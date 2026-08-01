import {
  App,
  Menu,
  Modal,
  Notice,
  normalizePath,
  Setting,
  TAbstractFile,
  TFile,
  TextFileView,
  WorkspaceLeaf,
  setIcon,
} from "obsidian";
import type WatermelonWorkbenchPlugin from "../main";
import type { WatermelonSettings } from "../settings";
import {
  createDefaultRandomNameOptions,
  generateRandomNames,
  getRandomNameCategory,
  isChinesePersonCategory,
  listRandomNameCategories,
  listRandomNameGroups,
  normalizeRandomNameOptions,
  type RandomNameOptions,
} from "../services/RandomNameService";
import {
  buildSnapshotDiff,
  countWritingCharacters,
  createTimeMachineSnapshot,
  listTimeMachineSnapshots,
  maybeCreateTimeMachineSnapshot,
  type SnapshotDiffLine,
  type TimeMachineSnapshot,
} from "../services/TimeMachineService";
import {
  computeTypingSpeed,
  computeWritingStats,
  formatDuration,
  type WritingSessionStats,
  type WritingStats,
} from "../services/StatsService";
import { prefixSelectedLines, wrapSelection } from "../utils/formatting";

const PARAGRAPH_INDENT = "　　";

export const WORKBENCH_VIEW_TYPE = "watermelon-workbench";

interface WorkbenchViewState {
  file?: string;
}

type ToolbarCommand = "bold" | "italic" | "heading" | "quote" | "bullet";
type ScopeMode = "single-file" | "folder";
type PanelSide = "left" | "right";

interface SessionRuntimeState {
  baselineWords: number;
  writingTimeMs: number;
  idleTimeMs: number;
  lastActivityAt: number | null;
  lastTickAt: number;
}

const FONT_PRESETS = [
  "",
  '"LXGW WenKai", "霞鹜文楷", cursive',
  '"Source Han Serif SC", "Noto Serif SC", SimSun, serif',
  '"Source Han Sans SC", "Noto Sans SC", sans-serif',
  '"Microsoft YaHei", "PingFang SC", sans-serif',
  '"SimSun", "宋体", serif',
  '"FangSong", "仿宋", serif',
  'Georgia, "Times New Roman", serif',
] as const;

const FONT_SIZE_PRESETS = [16, 18, 20, 22, 24, 26, 28, 30] as const;
const LINE_HEIGHT_PRESETS = [1.4, 1.5, 1.6, 1.8, 2] as const;
const IDLE_THRESHOLD_MS = 5000;
const MIN_PANEL_WIDTH = 180;
const MAX_PANEL_WIDTH = 480;

export class WorkbenchView extends TextFileView {
  plugin: WatermelonWorkbenchPlugin;
  private rootEl!: HTMLDivElement;
  private toolbarEl!: HTMLDivElement;
  private bodyEl!: HTMLDivElement;
  private chapterListEl!: HTMLDivElement;
  private chapterListBodyEl!: HTMLDivElement;
  private leftResizerEl!: HTMLDivElement;
  private editorShellEl!: HTMLDivElement;
  private editorEl!: HTMLTextAreaElement;
  private emptyStateEl!: HTMLDivElement;
  private rightResizerEl!: HTMLDivElement;
  private statsEl!: HTMLDivElement;
  private statsBodyEl!: HTMLDivElement;
  private pluginBoxBodyEl!: HTMLDivElement;
  private timeMachineListEl!: HTMLDivElement;
  private timeMachineDiffEl!: HTMLDivElement;
  private chapterToggleButton!: HTMLButtonElement;
  private statsToggleButton!: HTMLButtonElement;
  private chapterPanelVisible: boolean;
  private statsPanelVisible: boolean;
  private chapterPanelWidth: number;
  private statsPanelWidth: number;
  private activeFontFamily: string;
  private activeFontSizePx: number;
  private activeLineHeight: number;
  private chapters: TFile[] = [];
  private selectedChapterPath: string | null = null;
  private scopeMode: ScopeMode = "single-file";
  private scopeRootPath: string | null = null;
  private sessionState: SessionRuntimeState = createEmptySessionState();
  private randomNameOptions: RandomNameOptions = createDefaultRandomNameOptions();
  private randomNames: string[] = [];
  private activePluginTool: "random" | "time-machine" | null = null;
  private otherChaptersWords = 0;
  private novelTotalWords = 0;
  private timeMachineSnapshots: TimeMachineSnapshot[] = [];
  private lastSnapshotWords = 0;
  private lastSnapshotCreatedAt = 0;
  private snapshotSaveInFlight = false;
  private caretMirrorEl: HTMLDivElement | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: WatermelonWorkbenchPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.chapterPanelVisible = plugin.settings.showChapterPanel;
    this.statsPanelVisible = plugin.settings.showStatsPanel;
    this.chapterPanelWidth = plugin.settings.chapterPanelWidth;
    this.statsPanelWidth = plugin.settings.statsPanelWidth;
    this.activeFontFamily = plugin.settings.defaultFontFamily;
    this.activeFontSizePx = plugin.settings.defaultFontSizePx;
    this.activeLineHeight = plugin.settings.defaultLineHeight;
  }

  override getViewType(): string {
    return WORKBENCH_VIEW_TYPE;
  }

  override getDisplayText(): string {
    return this.file ? `Watermelon · ${this.file.basename}` : "Watermelon Workbench";
  }

  override getIcon(): string {
    return "notebook-pen";
  }

  override getViewData(): string {
    return this.editorEl ? getPlainEditorText(this.editorEl.value) : this.data ?? "";
  }

  override setViewData(data: string, clear: boolean): void {
    if (clear) {
      this.clear();
    }

    this.data = data;
    if (this.editorEl) {
      this.editorEl.value = formatEditorDisplayText(data);
    }
    this.updateHeaderState();
    this.updateStats();
  }

  override clear(): void {
    this.data = "";
    if (this.editorEl) {
      this.editorEl.value = "";
    }
    this.updateStats();
  }

  override getState(): Record<string, unknown> {
    return {
      ...super.getState(),
      file: this.file?.path ?? this.selectedChapterPath ?? undefined,
    };
  }

  override async setState(state: WorkbenchViewState, result: { history: boolean }): Promise<void> {
    await super.setState(state, result);

    const filePath = typeof state?.file === "string" ? state.file : null;
    if (!filePath) {
      return;
    }

    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file instanceof TFile) {
      this.configureScopeFromFile(file, true);
      this.refreshChapterList();
      await this.openChapter(file);
    }
  }

  override async onOpen(): Promise<void> {
    this.buildLayout();
    this.registerVaultEvents();
    this.registerSessionTicker();
    this.applyTypography();
    this.applyPanelLayout();

    const fileToOpen = this.getInitialFileForOpen();
    if (fileToOpen) {
      this.configureScopeFromFile(fileToOpen, true);
      this.refreshChapterList();
      await this.openChapter(fileToOpen);
    } else {
      this.refreshChapterList();
      this.renderEmptyEditorState("打开一个 Markdown 笔记后再进入 Workbench，或使用“Open current file in writing workbench”。");
    }
  }

  override async onLoadFile(file: TFile): Promise<void> {
    await super.onLoadFile(file);
    this.selectedChapterPath = file.path;
    this.updateHeaderState();
    this.refreshChapterList();
    this.updateStats();
  }

  override async onClose(): Promise<void> {
    await this.save();
  }

  async refreshFromSettings(): Promise<void> {
    this.chapterPanelVisible = this.plugin.settings.showChapterPanel;
    this.statsPanelVisible = this.plugin.settings.showStatsPanel;
    this.chapterPanelWidth = clampPanelWidth(this.plugin.settings.chapterPanelWidth);
    this.statsPanelWidth = clampPanelWidth(this.plugin.settings.statsPanelWidth);
    this.activeFontFamily = this.plugin.settings.defaultFontFamily;
    this.activeFontSizePx = this.plugin.settings.defaultFontSizePx;
    this.activeLineHeight = this.plugin.settings.defaultLineHeight;
    this.refreshChapterList();
    this.applyTypography();
    this.applyPanelLayout();
    this.updateStats();
  }

  async openChapter(file: TFile): Promise<void> {
    if (this.file?.path === file.path) {
      return;
    }

    if (this.file) {
      await this.save();
    }

    this.selectedChapterPath = file.path;
    this.file = file;
    const contents = normalizeLegacyParagraphSpacing(await this.app.vault.cachedRead(file));
    this.setViewData(contents, true);
    this.resetSessionStats(contents);
    this.lastSnapshotWords = countWritingCharacters(contents);
    this.lastSnapshotCreatedAt = Date.now();
    await this.refreshTimeMachineSnapshots();
    await this.onLoadFile(file);

    if (this.plugin.settings.rememberLastFile) {
      this.plugin.settings.lastOpenFilePath = file.path;
      await this.plugin.saveSettings();
    }
  }

  async exitWorkbench(): Promise<void> {
    await this.save();

    const currentFile = this.file;
    if (currentFile) {
      await this.leaf.setViewState({
        type: "markdown",
        active: true,
        state: { file: currentFile.path, mode: "source" },
      });
      return;
    }

    this.leaf.detach();
  }

  getInitialFileForOpen(): TFile | null {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile instanceof TFile && activeFile.extension === "md") {
      return activeFile;
    }

    if (this.plugin.settings.rememberLastFile && this.plugin.settings.lastOpenFilePath) {
      const remembered = this.app.vault.getAbstractFileByPath(this.plugin.settings.lastOpenFilePath);
      if (remembered instanceof TFile) {
        return remembered;
      }
    }

    return null;
  }

  configureScopeFromFile(file: TFile, force = false): void {
    if (!force && this.scopeRootPath) {
      return;
    }

    const siblingFiles = getMarkdownSiblings(file, this.app.vault.getMarkdownFiles());
    if (siblingFiles.length > 1) {
      this.scopeMode = "folder";
      this.scopeRootPath = file.parent?.path ?? "";
    } else {
      this.scopeMode = "single-file";
      this.scopeRootPath = file.path;
    }
  }

  private buildLayout(): void {
    this.contentEl.empty();
    this.contentEl.addClass("wm-workbench-view");

    this.rootEl = this.contentEl.createDiv({ cls: "wm-workbench" });
    this.toolbarEl = this.rootEl.createDiv({ cls: "wm-toolbar" });
    this.bodyEl = this.rootEl.createDiv({ cls: "wm-body" });

    this.chapterListEl = this.bodyEl.createDiv({ cls: "wm-sidebar wm-sidebar-left" });
    this.leftResizerEl = this.bodyEl.createDiv({ cls: "wm-resizer wm-resizer-left" });
    this.editorShellEl = this.bodyEl.createDiv({ cls: "wm-editor-shell" });
    this.editorEl = this.editorShellEl.createEl("textarea", {
      cls: "wm-editor",
      attr: {
        spellcheck: "false",
        placeholder: "在这里开始你的章节创作……",
      },
    });
    this.emptyStateEl = this.editorShellEl.createDiv({ cls: "wm-empty-state" });
    this.rightResizerEl = this.bodyEl.createDiv({ cls: "wm-resizer wm-resizer-right" });
    this.statsEl = this.bodyEl.createDiv({ cls: "wm-sidebar wm-sidebar-right" });

    this.renderToolbar();
    this.renderChapterSidebar();
    this.renderStatsPane();
    this.attachEditorEvents();
    this.attachResizerEvents();
    this.updateHeaderState();
    this.updateStats();
  }

  private renderToolbar(): void {
    this.toolbarEl.empty();

    const leftGroup = this.toolbarEl.createDiv({ cls: "wm-toolbar-group" });
    const fontSelect = leftGroup.createEl("select", { cls: "wm-select" });
    FONT_PRESETS.forEach((font) => {
      fontSelect.createEl("option", {
        value: font,
        text: prettyFontName(font),
      });
    });
    fontSelect.value = this.activeFontFamily;
    if (fontSelect.value !== this.activeFontFamily) {
      fontSelect.createEl("option", {
        value: this.activeFontFamily,
        text: prettyFontName(this.activeFontFamily),
      });
      fontSelect.value = this.activeFontFamily;
    }
    this.registerDomEvent(fontSelect, "change", async () => {
      this.activeFontFamily = fontSelect.value;
      this.plugin.settings.defaultFontFamily = fontSelect.value;
      this.applyTypography();
      await this.plugin.saveSettings();
    });

    const sizeSelect = leftGroup.createEl("select", { cls: "wm-select wm-select-small" });
    FONT_SIZE_PRESETS.forEach((size) => {
      sizeSelect.createEl("option", { value: String(size), text: `${size}` });
    });
    sizeSelect.value = String(this.activeFontSizePx);
    this.registerDomEvent(sizeSelect, "change", async () => {
      this.activeFontSizePx = Number(sizeSelect.value);
      this.plugin.settings.defaultFontSizePx = this.activeFontSizePx;
      this.applyTypography();
      await this.plugin.saveSettings();
    });

    const lineHeightSelect = leftGroup.createEl("select", { cls: "wm-select" });
    LINE_HEIGHT_PRESETS.forEach((lineHeight) => {
      lineHeightSelect.createEl("option", {
        value: String(lineHeight),
        text: `${lineHeight}倍行距`,
      });
    });
    lineHeightSelect.value = String(this.activeLineHeight);
    this.registerDomEvent(lineHeightSelect, "change", async () => {
      this.activeLineHeight = Number(lineHeightSelect.value);
      this.plugin.settings.defaultLineHeight = this.activeLineHeight;
      this.applyTypography();
      await this.plugin.saveSettings();
    });

    const formatGroup = this.toolbarEl.createDiv({ cls: "wm-toolbar-group wm-toolbar-actions" });
    this.createToolbarButton(formatGroup, "B", "加粗", () => this.applyCommand("bold"));
    this.createToolbarButton(formatGroup, "I", "斜体", () => this.applyCommand("italic"));
    this.createToolbarButton(formatGroup, "H1", "标题", () => this.applyCommand("heading"));
    this.createToolbarButton(formatGroup, "❝", "引用", () => this.applyCommand("quote"));
    this.createToolbarButton(formatGroup, "•", "列表", () => this.applyCommand("bullet"));

    const rightGroup = this.toolbarEl.createDiv({ cls: "wm-toolbar-group wm-toolbar-group-right" });

    this.chapterToggleButton = rightGroup.createEl("button", {
      cls: "clickable-icon wm-icon-button",
      attr: { type: "button", "aria-label": "切换章节目录" },
    });
    this.registerDomEvent(this.chapterToggleButton, "click", () => {
      this.chapterPanelVisible = !this.chapterPanelVisible;
      this.plugin.settings.showChapterPanel = this.chapterPanelVisible;
      this.applyPanelLayout();
      void this.plugin.saveSettings();
    });

    this.statsToggleButton = rightGroup.createEl("button", {
      cls: "clickable-icon wm-icon-button",
      attr: { type: "button", "aria-label": "切换实时统计栏" },
    });
    this.registerDomEvent(this.statsToggleButton, "click", () => {
      this.statsPanelVisible = !this.statsPanelVisible;
      this.plugin.settings.showStatsPanel = this.statsPanelVisible;
      this.applyPanelLayout();
      void this.plugin.saveSettings();
    });

    const exitButton = rightGroup.createEl("button", {
      cls: "wm-toolbar-button wm-exit-button",
      text: "退出",
      attr: { type: "button", "aria-label": "退出 Workbench" },
    });
    this.registerDomEvent(exitButton, "click", () => {
      void this.exitWorkbench();
    });
  }

  private renderChapterSidebar(): void {
    this.chapterListEl.empty();
    const headerEl = this.chapterListEl.createDiv({ cls: "wm-sidebar-header" });
    headerEl.createEl("h3", { text: "章节目录" });
    const createButton = headerEl.createEl("button", {
      cls: "clickable-icon",
      attr: { type: "button", "aria-label": "新建章节" },
    });
    setIcon(createButton, "file-plus");
    this.registerDomEvent(createButton, "click", () => {
      void this.createChapterInCurrentDirectory();
    });

    const refreshButton = headerEl.createEl("button", {
      cls: "clickable-icon",
      attr: { type: "button", "aria-label": "刷新章节列表" },
    });
    setIcon(refreshButton, "refresh-cw");
    this.registerDomEvent(refreshButton, "click", () => this.refreshChapterList());

    this.chapterListBodyEl = this.chapterListEl.createDiv({ cls: "wm-chapter-list" });
    this.renderChapterItems();
  }

  private renderStatsPane(): void {
    this.statsEl.empty();

    this.pluginBoxBodyEl = this.statsEl.createDiv({ cls: "wm-sidebar-section wm-plugin-box" });
    this.renderPluginBox();

    const headerEl = this.statsEl.createDiv({ cls: "wm-sidebar-header wm-stats-header" });
    headerEl.createEl("h3", { text: "实时统计" });
    const hideButton = headerEl.createEl("button", {
      cls: "wm-pill-button",
      text: "隐藏",
      attr: { type: "button" },
    });
    this.registerDomEvent(hideButton, "click", () => {
      this.statsPanelVisible = false;
      this.plugin.settings.showStatsPanel = false;
      this.applyPanelLayout();
      void this.plugin.saveSettings();
    });

    this.statsBodyEl = this.statsEl.createDiv({ cls: "wm-stats-grid" });
    this.updateStats();
  }

  private renderPluginBox(): void {
    this.pluginBoxBodyEl.empty();
    this.pluginBoxBodyEl.createEl("h3", { text: "插件箱", cls: "wm-plugin-box-title" });

    if (this.activePluginTool === "random") {
      this.renderRandomNameTool();
      return;
    }

    if (this.activePluginTool === "time-machine") {
      this.renderTimeMachineTool();
      return;
    }

    const menu = this.pluginBoxBodyEl.createDiv({ cls: "wm-plugin-icon-menu" });
    this.createPluginIcon(menu, "dice", "随机取名", () => {
      this.activePluginTool = "random";
      this.renderPluginBox();
    });
    this.createPluginIcon(menu, "history", "时光机", () => {
      this.activePluginTool = "time-machine";
      this.renderPluginBox();
    });
  }

  private createPluginIcon(parent: HTMLElement, icon: string, label: string, onClick: () => void): void {
    const button = parent.createEl("button", {
      cls: "wm-plugin-icon-button",
      attr: { type: "button", "aria-label": label },
    });
    const iconEl = button.createSpan({ cls: "wm-plugin-icon" });
    setIcon(iconEl, icon);
    button.createSpan({ cls: "wm-plugin-icon-label", text: label });
    this.registerDomEvent(button, "click", onClick);
  }

  private renderToolHeader(parent: HTMLElement, title: string): void {
    const header = parent.createDiv({ cls: "wm-tool-header" });
    const backButton = header.createEl("button", {
      cls: "wm-mini-button",
      text: "← 返回",
      attr: { type: "button" },
    });
    header.createEl("h4", { text: title });
    this.registerDomEvent(backButton, "click", () => {
      this.activePluginTool = null;
      this.renderPluginBox();
    });
  }

  private renderRandomNameTool(): void {
    const panel = this.pluginBoxBodyEl.createDiv({ cls: "wm-tool-panel" });
    this.renderToolHeader(panel, "随机取名");

    this.randomNameOptions = normalizeRandomNameOptions(this.randomNameOptions);

    const controls = panel.createDiv({ cls: "wm-random-controls" });
    const groupSelect = this.createLabeledSelect(
      controls,
      "类型",
      listRandomNameGroups().map((group) => [group.id, group.label]),
    );
    groupSelect.value = this.randomNameOptions.group;

    const categorySelect = this.createLabeledSelect(controls, "细类", []);
    const lengthSelect = this.createLabeledSelect(controls, "字数", [
      ["2", "二字名"],
      ["3", "三字名"],
    ]);
    lengthSelect.value = String(this.randomNameOptions.chineseNameLength);

    const hintEl = panel.createDiv({ cls: "wm-random-hint" });

    const generateButton = panel.createEl("button", {
      cls: "wm-toolbar-button wm-primary-button",
      text: "生成随机名称",
      attr: { type: "button" },
    });

    const resultList = panel.createDiv({ cls: "wm-random-result-list" });
    const renderNames = () => {
      resultList.empty();
      const names = this.randomNames.length > 0 ? this.randomNames : generateRandomNames(this.randomNameOptions, 12);
      this.randomNames = names;
      names.forEach((name) => {
        const item = resultList.createEl("button", {
          cls: "wm-random-name-chip",
          text: name,
          attr: { type: "button", title: "点击插入到正文" },
        });
        this.registerDomEvent(item, "click", () => this.insertTextAtCursor(name));
      });
    };

    const refreshCategorySelect = (preferredCategoryId: string) => {
      categorySelect.empty();
      const categories = listRandomNameCategories(groupSelect.value as RandomNameOptions["group"]);
      categories.forEach((category) => {
        categorySelect.createEl("option", { value: category.id, text: category.label });
      });

      const categoryId = categories.some((category) => category.id === preferredCategoryId)
        ? preferredCategoryId
        : categories[0]?.id ?? "person.chinese.modern";
      categorySelect.value = categoryId;
    };

    const updateOptions = (keepCategory = true) => {
      if (!keepCategory) {
        refreshCategorySelect("");
      }

      this.randomNameOptions = normalizeRandomNameOptions({
        group: groupSelect.value as RandomNameOptions["group"],
        categoryId: categorySelect.value as RandomNameOptions["categoryId"],
        chineseNameLength: lengthSelect.value === "3" ? 3 : 2,
      });

      groupSelect.value = this.randomNameOptions.group;
      refreshCategorySelect(this.randomNameOptions.categoryId);
      categorySelect.value = this.randomNameOptions.categoryId;
      lengthSelect.value = String(this.randomNameOptions.chineseNameLength);
      lengthSelect.disabled = !isChinesePersonCategory(this.randomNameOptions.categoryId);
      hintEl.setText(`${getRandomNameCategory(this.randomNameOptions.categoryId).hint} 点击名称可插入正文。`);
      this.randomNames = generateRandomNames(this.randomNameOptions, 12);
      renderNames();
    };

    refreshCategorySelect(this.randomNameOptions.categoryId);
    this.registerDomEvent(groupSelect, "change", () => updateOptions(false));
    this.registerDomEvent(categorySelect, "change", () => updateOptions(true));
    this.registerDomEvent(lengthSelect, "change", () => updateOptions(true));
    this.registerDomEvent(generateButton, "click", () => updateOptions(true));
    updateOptions(true);
  }

  private renderTimeMachineTool(): void {
    const panel = this.pluginBoxBodyEl.createDiv({ cls: "wm-tool-panel" });
    this.renderToolHeader(panel, "时光机");
    panel.createDiv({ cls: "wm-plugin-panel-hint", text: "自动备份：每日 1 份 + 每新增约 500 字且间隔 2 分钟；每章保留最近 30 份自动备份，手动备份永久保留。" });

    const snapshotNowButton = panel.createEl("button", {
      cls: "wm-toolbar-button wm-primary-button",
      text: "立即保存版本",
      attr: { type: "button" },
    });
    this.registerDomEvent(snapshotNowButton, "click", () => {
      void this.saveManualTimeMachineSnapshot();
    });

    this.timeMachineListEl = panel.createDiv({ cls: "wm-time-machine-list" });
    this.timeMachineDiffEl = panel.createDiv({ cls: "wm-time-machine-diff" });
    this.renderTimeMachineSnapshots();
  }

  private createLabeledSelect(parent: HTMLElement, label: string, options: Array<[string, string]>): HTMLSelectElement {
    const wrapper = parent.createDiv({ cls: "wm-random-control" });
    wrapper.createEl("span", { text: label });
    const select = wrapper.createEl("select", { cls: "wm-select wm-select-small" });
    options.forEach(([value, text]) => {
      select.createEl("option", { value, text });
    });
    return select;
  }

  private attachEditorEvents(): void {
    this.registerDomEvent(this.editorEl, "input", () => {
      this.handleEditorMutation();
    });

    this.registerDomEvent(this.editorEl, "keydown", (event: KeyboardEvent) => {
      if (event.isComposing) {
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        this.insertIndentedLineBreak();
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        void this.exitWorkbench();
      }
    });
  }

  private attachResizerEvents(): void {
    this.registerDomEvent(this.leftResizerEl, "pointerdown", (event: PointerEvent) => {
      this.startResize("left", event);
    });
    this.registerDomEvent(this.rightResizerEl, "pointerdown", (event: PointerEvent) => {
      this.startResize("right", event);
    });
  }

  private registerSessionTicker(): void {
    this.registerInterval(
      window.setInterval(() => {
        if (!this.file) {
          return;
        }

        this.updateSessionDurations(Date.now());
        this.updateStats();
      }, 1000),
    );
  }

  private handleEditorMutation(): void {
    const now = Date.now();
    this.updateSessionDurations(now);
    this.sessionState.lastActivityAt = now;
    this.normalizeEditorDisplay();
    this.data = getPlainEditorText(this.editorEl.value);
    this.updateStats();
    this.requestSave();
    this.keepCursorInComfortZone();
    void this.maybeSaveTimeMachineSnapshot();
  }

  private keepCursorInComfortZone(): void {
    window.requestAnimationFrame(() => {
      const editor = this.editorEl;
      const cursor = editor.selectionStart ?? 0;
      if (editor.value.slice(cursor).trim()) {
        return;
      }

      const caretTop = this.getTextareaCaretTop(editor, cursor);
      const caretViewportY = caretTop - editor.scrollTop;
      const lowerTrigger = editor.clientHeight * 0.62;
      if (caretViewportY <= lowerTrigger) {
        return;
      }

      const targetY = editor.clientHeight * 0.48;
      const maxScrollTop = Math.max(0, editor.scrollHeight - editor.clientHeight);
      editor.scrollTop = clamp(caretTop - targetY, 0, maxScrollTop);
    });
  }

  private getTextareaCaretTop(editor: HTMLTextAreaElement, cursor: number): number {
    const style = window.getComputedStyle(editor);
    const mirror = this.getCaretMirrorEl();
    const marker = document.createElement("span");
    const beforeCursor = editor.value.slice(0, cursor);

    mirror.empty();
    copyTextareaLayoutStyles(editor, mirror, style);
    mirror.appendText(beforeCursor.length > 0 ? beforeCursor : " ");
    marker.appendText(" ");
    mirror.appendChild(marker);

    const mirrorRect = mirror.getBoundingClientRect();
    const markerRect = marker.getBoundingClientRect();
    return markerRect.top - mirrorRect.top;
  }

  private getCaretMirrorEl(): HTMLDivElement {
    if (!this.caretMirrorEl) {
      this.caretMirrorEl = this.editorShellEl.createDiv();
    }

    return this.caretMirrorEl;
  }

  private normalizeEditorDisplay(): void {
    const cursor = this.editorEl.selectionStart ?? 0;
    const currentValue = this.editorEl.value;
    const formatted = formatEditorDisplayTextWithCursor(currentValue, cursor);
    if (formatted.value === currentValue) {
      return;
    }

    this.editorEl.value = formatted.value;
    this.editorEl.setSelectionRange(formatted.cursor, formatted.cursor);
  }

  private insertIndentedLineBreak(): void {
    const selectionStart = this.editorEl.selectionStart ?? 0;
    const selectionEnd = this.editorEl.selectionEnd ?? 0;
    const value = this.editorEl.value;
    const insertion = `\n${PARAGRAPH_INDENT}`;
    const nextValue = `${value.slice(0, selectionStart)}${insertion}${value.slice(selectionEnd)}`;
    const nextCursor = selectionStart + insertion.length;

    this.editorEl.value = nextValue;
    this.editorEl.focus();
    this.editorEl.setSelectionRange(nextCursor, nextCursor);
    this.handleEditorMutation();
  }

  private async applyCommand(command: ToolbarCommand): Promise<void> {
    const selectionStart = this.editorEl.selectionStart ?? 0;
    const selectionEnd = this.editorEl.selectionEnd ?? 0;
    const value = this.editorEl.value;

    const result =
      command === "bold"
        ? wrapSelection(value, selectionStart, selectionEnd, "**")
        : command === "italic"
          ? wrapSelection(value, selectionStart, selectionEnd, "*")
          : command === "heading"
            ? prefixSelectedLines(value, selectionStart, selectionEnd, "# ")
            : command === "quote"
              ? prefixSelectedLines(value, selectionStart, selectionEnd, "> ")
              : prefixSelectedLines(value, selectionStart, selectionEnd, "- ");

    this.editorEl.value = result.value;
    this.editorEl.focus();
    this.editorEl.setSelectionRange(result.selectionStart, result.selectionEnd);
    this.handleEditorMutation();
  }

  private createToolbarButton(parent: HTMLElement, label: string, ariaLabel: string, onClick: () => void): void {
    const button = parent.createEl("button", {
      cls: "wm-toolbar-button",
      text: label,
      attr: { type: "button", "aria-label": ariaLabel },
    });
    this.registerDomEvent(button, "click", onClick);
  }

  private insertTextAtCursor(text: string): void {
    const selectionStart = this.editorEl.selectionStart ?? 0;
    const selectionEnd = this.editorEl.selectionEnd ?? 0;
    const value = this.editorEl.value;
    const nextValue = `${value.slice(0, selectionStart)}${text}${value.slice(selectionEnd)}`;
    const nextCursor = selectionStart + text.length;

    this.editorEl.value = nextValue;
    this.editorEl.focus();
    this.editorEl.setSelectionRange(nextCursor, nextCursor);
    this.handleEditorMutation();
  }

  private async refreshTimeMachineSnapshots(): Promise<void> {
    this.timeMachineSnapshots = await listTimeMachineSnapshots(this.plugin, this.file);
    this.renderTimeMachineSnapshots();
  }

  private renderTimeMachineSnapshots(): void {
    if (!this.timeMachineListEl) {
      return;
    }

    this.timeMachineListEl.empty();
    if (this.timeMachineDiffEl) {
      this.timeMachineDiffEl.empty();
    }

    if (!this.file) {
      this.timeMachineListEl.createDiv({ cls: "wm-empty-sidebar-state", text: "选择章节后开始记录历史版本。" });
      return;
    }

    if (this.timeMachineSnapshots.length === 0) {
      this.timeMachineListEl.createDiv({ cls: "wm-empty-sidebar-state", text: "暂时没有历史版本。每天会保留 1 份日备份，写作新增约 500 字且间隔 2 分钟后会自动保存。" });
      return;
    }

    this.timeMachineSnapshots.forEach((snapshot) => {
      const item = this.timeMachineListEl.createDiv({ cls: "wm-time-machine-item" });
      item.createDiv({ cls: "wm-time-machine-title", text: `${snapshotKindLabel(snapshot.kind)} · ${new Date(snapshot.createdAt).toLocaleString()}` });
      item.createDiv({ cls: "wm-time-machine-meta", text: `${snapshot.wordCount || "未知"} 字 · ${snapshot.path}` });
      const actions = item.createDiv({ cls: "wm-time-machine-actions" });
      const diffButton = actions.createEl("button", {
        cls: "wm-mini-button",
        text: "查看删改",
        attr: { type: "button" },
      });
      const restoreButton = actions.createEl("button", {
        cls: "wm-mini-button wm-danger-button",
        text: "恢复",
        attr: { type: "button" },
      });
      this.registerDomEvent(diffButton, "click", () => {
        void this.showSnapshotDiff(snapshot);
      });
      this.registerDomEvent(restoreButton, "click", () => {
        void this.restoreSnapshot(snapshot);
      });
    });
  }

  private async showSnapshotDiff(snapshot: TimeMachineSnapshot): Promise<void> {
    if (!this.timeMachineDiffEl) {
      return;
    }

    const snapshotFile = this.app.vault.getAbstractFileByPath(snapshot.path);
    if (!(snapshotFile instanceof TFile)) {
      new Notice("这个历史版本文件不存在。可能已被移动或删除。");
      await this.refreshTimeMachineSnapshots();
      return;
    }

    const diff = await buildSnapshotDiff(this.plugin, snapshotFile, getPlainEditorText(this.editorEl.value));
    this.renderSnapshotDiff(diff);
  }

  private renderSnapshotDiff(diff: SnapshotDiffLine[]): void {
    this.timeMachineDiffEl.empty();
    this.timeMachineDiffEl.createDiv({ cls: "wm-time-machine-diff-title", text: "当前版本相对历史版本的删改" });
    const visibleDiff = diff.filter((line) => line.kind !== "same" || line.text.trim()).slice(0, 160);
    visibleDiff.forEach((line) => {
      this.timeMachineDiffEl.createDiv({ cls: `wm-diff-line wm-diff-${line.kind}`, text: `${diffPrefix(line.kind)} ${line.text}` });
    });

    if (visibleDiff.length === 0) {
      this.timeMachineDiffEl.createDiv({ cls: "wm-empty-sidebar-state", text: "没有发现文本差异。" });
    }
  }

  private async restoreSnapshot(snapshot: TimeMachineSnapshot): Promise<void> {
    const snapshotFile = this.app.vault.getAbstractFileByPath(snapshot.path);
    if (!(snapshotFile instanceof TFile)) {
      new Notice("这个历史版本文件不存在。可能已被移动或删除。");
      await this.refreshTimeMachineSnapshots();
      return;
    }

    const snapshotText = await this.app.vault.cachedRead(snapshotFile);
    await this.saveManualTimeMachineSnapshot(false);
    this.editorEl.value = formatEditorDisplayText(snapshotText);
    this.handleEditorMutation();
    this.lastSnapshotWords = countWritingCharacters(snapshotText);
    this.lastSnapshotCreatedAt = Date.now();
    new Notice("已恢复到所选时光机版本。恢复前的当前内容已另存为备份。");
    await this.refreshTimeMachineSnapshots();
  }

  private async saveManualTimeMachineSnapshot(showNotice = true): Promise<void> {
    if (!this.file) {
      new Notice("请先打开一个 Markdown 章节。");
      return;
    }

    const text = getPlainEditorText(this.editorEl.value);
    const snapshot = await createTimeMachineSnapshot(this.plugin, this.file, text, { kind: "manual" });
    this.lastSnapshotWords = snapshot.wordCount;
    this.lastSnapshotCreatedAt = snapshot.createdAt;
    if (showNotice) {
      new Notice("已保存一个时光机版本。");
    }
    await this.refreshTimeMachineSnapshots();
  }

  private async maybeSaveTimeMachineSnapshot(): Promise<void> {
    if (this.snapshotSaveInFlight) {
      return;
    }

    this.snapshotSaveInFlight = true;
    try {
      const snapshotState = await maybeCreateTimeMachineSnapshot(
        this.plugin,
        this.file,
        getPlainEditorText(this.editorEl.value),
        this.lastSnapshotWords,
        this.lastSnapshotCreatedAt,
      );
      if (snapshotState.created) {
        this.lastSnapshotWords = snapshotState.wordCount;
        this.lastSnapshotCreatedAt = snapshotState.createdAt;
        await this.refreshTimeMachineSnapshots();
      }
    } finally {
      this.snapshotSaveInFlight = false;
    }
  }

  refreshChapterList(): void {
    this.chapters = this.getScopedFiles().sort((left, right) => this.compareFiles(left, right, this.plugin.settings));
    this.renderChapterItems();
    void this.refreshNovelTotalWords();
  }

  private async refreshNovelTotalWords(): Promise<void> {
    const activeFilePath = this.file?.path;
    const totals = await Promise.all(
      this.chapters
        .filter((file) => file.path !== activeFilePath)
        .map(async (file) => computeWritingStats(await this.app.vault.cachedRead(file)).words),
    );

    this.otherChaptersWords = totals.reduce((total, words) => total + words, 0);
    this.novelTotalWords = this.otherChaptersWords + computeWritingStats(this.editorEl ? getPlainEditorText(this.editorEl.value) : this.data ?? "").words;
    this.updateStats();
  }

  private renderChapterItems(): void {
    if (!this.chapterListBodyEl) {
      return;
    }

    this.chapterListBodyEl.empty();

    if (this.chapters.length === 0) {
      this.chapterListBodyEl.createDiv({
        cls: "wm-empty-sidebar-state",
        text: this.scopeMode === "folder" ? "当前文件夹下没有 Markdown 文件。" : "当前仅显示这篇笔记。",
      });
      return;
    }

    this.chapters.forEach((file) => {
      const row = this.chapterListBodyEl.createDiv({
        cls: `wm-chapter-row${file.path === this.selectedChapterPath ? " is-active" : ""}`,
      });
      const item = row.createEl("button", {
        cls: "wm-chapter-item",
        attr: { type: "button", title: file.path },
      });
      const titleEl = item.createDiv({ cls: "wm-chapter-title", text: file.basename });
      this.registerDomEvent(item, "click", () => {
        void this.openChapter(file);
      });
      this.registerDomEvent(titleEl, "click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.promptRenameChapter(file);
      });
      this.registerDomEvent(item, "contextmenu", (event) => {
        event.preventDefault();
        Menu.forEvent(event)
          .addItem((menuItem) => {
            menuItem
              .setTitle("打开章节")
              .setIcon("file-text")
              .onClick(() => {
                void this.openChapter(file);
              });
          })
          .addItem((menuItem) => {
            menuItem
              .setTitle("重命名章节")
              .setIcon("pencil")
              .onClick(() => this.promptRenameChapter(file));
          })
          .addItem((menuItem) => {
            menuItem
              .setTitle("删除章节")
              .setIcon("trash-2")
              .setWarning(true)
              .onClick(() => {
                void this.deleteChapter(file);
              });
          });
      });
    });
  }

  private async createChapterInCurrentDirectory(): Promise<void> {
    const folderPath = this.getCurrentChapterCreationFolderPath();
    if (folderPath === null) {
      new Notice("请先打开一个章节，再新建章节。");
      return;
    }

    try {
      await this.save();
      const file = await this.app.vault.create(this.getUniqueChapterPath(folderPath), "");
      this.scopeMode = "folder";
      this.scopeRootPath = file.parent?.path ?? folderPath;
      this.refreshChapterList();
      await this.openChapter(file);
      this.editorEl.focus();
      new Notice(`已新建章节：${file.basename}`);
    } catch (error) {
      console.error("Failed to create chapter", error);
      new Notice("新建章节失败，请检查当前目录是否可写。");
    }
  }

  private getCurrentChapterCreationFolderPath(): string | null {
    if (this.scopeMode === "folder" && this.scopeRootPath !== null) {
      return this.scopeRootPath;
    }

    if (this.file) {
      return this.file.parent?.path ?? "";
    }

    if (this.selectedChapterPath) {
      const selectedFile = this.app.vault.getAbstractFileByPath(this.selectedChapterPath);
      if (selectedFile instanceof TFile) {
        return selectedFile.parent?.path ?? "";
      }
    }

    return null;
  }

  private getUniqueChapterPath(folderPath: string): string {
    const baseName = "新章节";
    let chapterPath = joinVaultPath(folderPath, `${baseName}.md`);
    let counter = 2;

    while (this.app.vault.getAbstractFileByPath(chapterPath)) {
      chapterPath = joinVaultPath(folderPath, `${baseName} ${counter}.md`);
      counter += 1;
    }

    return chapterPath;
  }

  private promptRenameChapter(file: TFile): void {
    new ChapterRenameModal(this.app, file, async (inputName) => {
      const baseName = normalizeChapterBaseName(inputName);
      const error = this.getChapterRenameError(file, baseName);
      if (error) {
        return error;
      }

      if (baseName === file.basename) {
        return null;
      }

      await this.renameChapter(file, baseName);
      return null;
    }).open();
  }

  private async renameChapter(file: TFile, baseName: string): Promise<void> {
    const newPath = this.getChapterRenamePath(file, baseName);
    const renamingActiveFile = this.file?.path === file.path;

    try {
      if (renamingActiveFile) {
        await this.save();
      }

      await this.app.fileManager.renameFile(file, newPath);
      const renamedFile = this.app.vault.getAbstractFileByPath(newPath);
      if (renamedFile instanceof TFile) {
        if (renamingActiveFile) {
          this.file = renamedFile;
          this.selectedChapterPath = renamedFile.path;
          if (this.scopeMode === "single-file" && this.scopeRootPath === file.path) {
            this.scopeRootPath = renamedFile.path;
          }
          await this.refreshTimeMachineSnapshots();

          if (this.plugin.settings.rememberLastFile) {
            this.plugin.settings.lastOpenFilePath = renamedFile.path;
            await this.plugin.saveSettings();
          }
        } else if (this.selectedChapterPath === file.path) {
          this.selectedChapterPath = renamedFile.path;
        }
      }

      this.refreshChapterList();
      this.updateHeaderState();
      new Notice(`已重命名为：${baseName}`);
    } catch (error) {
      console.error("Failed to rename chapter", error);
      new Notice("重命名章节失败，请检查名称是否有效或目标文件是否已存在。");
      this.refreshChapterList();
    }
  }

  private getChapterRenamePath(file: TFile, baseName: string): string {
    return joinVaultPath(file.parent?.path ?? "", `${baseName}.md`);
  }

  private getChapterRenameError(file: TFile, baseName: string): string | null {
    const invalidNameReason = getInvalidChapterBaseNameReason(baseName);
    if (invalidNameReason) {
      return invalidNameReason;
    }

    const targetPath = this.getChapterRenamePath(file, baseName);
    const existingFile = this.app.vault.getAbstractFileByPath(targetPath);
    if (existingFile && existingFile.path !== file.path) {
      return "同名章节已存在。";
    }

    return null;
  }

  private async deleteChapter(file: TFile): Promise<void> {
    const deletingActiveFile = this.file?.path === file.path;

    try {
      if (deletingActiveFile) {
        await this.save();
      }

      const confirmed = await this.app.fileManager.promptForDeletion(file);
      if (!confirmed) {
        return;
      }

      const nextFile = deletingActiveFile ? this.getNextChapterAfter(file) : null;
      await this.app.fileManager.trashFile(file);

      if (deletingActiveFile) {
        this.file = null;
        this.selectedChapterPath = null;
        const nextExistingFile = nextFile ? this.app.vault.getAbstractFileByPath(nextFile.path) : null;
        if (nextExistingFile instanceof TFile) {
          await this.openChapter(nextExistingFile);
        } else {
          this.scopeMode = "folder";
          this.scopeRootPath = file.parent?.path ?? "";
          await this.clearDeletedActiveChapterState();
        }
      } else {
        this.refreshChapterList();
      }

      new Notice(`已移至废纸篓：${file.basename}`);
    } catch (error) {
      console.error("Failed to delete chapter", error);
      new Notice("删除章节失败，请检查文件是否仍存在或是否可写。");
      this.refreshChapterList();
    }
  }

  private getNextChapterAfter(file: TFile): TFile | null {
    const index = this.chapters.findIndex((chapter) => chapter.path === file.path);
    if (index === -1) {
      return null;
    }

    return this.chapters[index + 1] ?? this.chapters[index - 1] ?? null;
  }

  private async clearDeletedActiveChapterState(): Promise<void> {
    this.file = null;
    this.selectedChapterPath = null;
    this.timeMachineSnapshots = [];
    this.renderTimeMachineSnapshots();
    this.timeMachineDiffEl?.empty();
    this.clear();
    this.renderEmptyEditorState("当前章节已删除。请选择或新建一个章节继续写作。");
    this.refreshChapterList();

    if (this.plugin.settings.rememberLastFile) {
      this.plugin.settings.lastOpenFilePath = null;
      await this.plugin.saveSettings();
    }
  }

  private updateStats(): void {
    if (!this.statsBodyEl) {
      return;
    }

    const staticStats = computeWritingStats(this.editorEl ? getPlainEditorText(this.editorEl.value) : this.data ?? "");
    const sessionStats = this.getSessionStats(staticStats.words);
    this.novelTotalWords = this.otherChaptersWords + staticStats.words;
    const rows = this.buildStatsRows(staticStats, sessionStats);

    this.statsBodyEl.empty();
    rows.forEach((entries) => {
      const row = this.statsBodyEl.createDiv({ cls: "wm-stat-row" });
      entries.forEach(([label, value]) => {
        const card = row.createDiv({ cls: "wm-stat-card" });
        card.createDiv({ cls: "wm-stat-label", text: label });
        card.createDiv({ cls: "wm-stat-value", text: value });
      });
    });
  }

  private buildStatsRows(stats: WritingStats, sessionStats: WritingSessionStats): Array<Array<[string, string]>> {
    return [
      [
        ["本次字数", String(sessionStats.sessionWords)],
        ["输入速度（字/分）", String(sessionStats.typingSpeed)],
      ],
      [
        ["码字时间", formatDuration(sessionStats.writingTimeMs)],
        ["空闲时间", formatDuration(sessionStats.idleTimeMs)],
      ],
      [
        ["总字符数", String(stats.characters)],
        ["去空格字符数", String(stats.charactersNoSpaces)],
      ],
      [
        ["章节数", String(this.chapters.length)],
        ["小说总字数", String(this.novelTotalWords || stats.words)],
      ],
    ];
  }

  private applyTypography(): void {
    if (!this.rootEl) {
      return;
    }

    this.rootEl.setCssProps({
      "--wm-font-family": this.activeFontFamily || "var(--font-text, var(--font-interface))",
      "--wm-font-size": `${this.activeFontSizePx}px`,
      "--wm-line-height": String(this.activeLineHeight),
    });
  }

  private applyPanelLayout(): void {
    if (!this.rootEl || !this.bodyEl) {
      return;
    }

    this.rootEl.setCssProps({
      "--wm-left-width": `${clampPanelWidth(this.chapterPanelWidth)}px`,
      "--wm-right-width": `${clampPanelWidth(this.statsPanelWidth)}px`,
    });

    this.bodyEl.toggleClass("wm-left-hidden", !this.chapterPanelVisible);
    this.bodyEl.toggleClass("wm-right-hidden", !this.statsPanelVisible);

    if (this.chapterToggleButton) {
      this.chapterToggleButton.empty();
      setIcon(this.chapterToggleButton, this.chapterPanelVisible ? "panel-left-close" : "panel-left-open");
    }

    if (this.statsToggleButton) {
      this.statsToggleButton.empty();
      setIcon(this.statsToggleButton, this.statsPanelVisible ? "panel-right-close" : "panel-right-open");
    }
  }

  private updateHeaderState(): void {
    this.emptyStateEl?.toggleClass("is-hidden", Boolean(this.file));
    this.leaf.setEphemeralState({ file: this.file?.path ?? this.selectedChapterPath ?? null });
  }

  renderEmptyEditorState(message: string): void {
    this.emptyStateEl.empty();
    this.emptyStateEl.createDiv({ cls: "wm-empty-title", text: "Watermelon Workbench" });
    this.emptyStateEl.createDiv({ cls: "wm-empty-copy", text: message });
    this.updateHeaderState();
  }

  private registerVaultEvents(): void {
    this.registerEvent(this.app.vault.on("create", (file) => this.handleVaultRefresh(file)));
    this.registerEvent(this.app.vault.on("delete", (file) => this.handleVaultRefresh(file)));
    this.registerEvent(this.app.vault.on("rename", (file) => this.handleVaultRefresh(file)));
    this.registerEvent(this.app.vault.on("modify", (file) => this.handleVaultRefresh(file)));
  }

  private handleVaultRefresh(file: TAbstractFile): void {
    if (!(file instanceof TFile) || file.extension !== "md") {
      return;
    }

    if (!this.isFileInCurrentScope(file)) {
      return;
    }

    this.refreshChapterList();
  }

  private isFileInCurrentScope(file: TFile): boolean {
    if (this.scopeRootPath === null) {
      return false;
    }

    if (this.scopeMode === "single-file") {
      return file.path === this.scopeRootPath;
    }

    return file.parent?.path === this.scopeRootPath;
  }

  private getScopedFiles(): TFile[] {
    if (this.scopeRootPath === null) {
      return [];
    }

    const markdownFiles = this.app.vault.getMarkdownFiles();

    if (this.scopeMode === "single-file") {
      const file = this.app.vault.getAbstractFileByPath(this.scopeRootPath);
      return file instanceof TFile ? [file] : [];
    }

    return markdownFiles.filter((file) => file.parent?.path === this.scopeRootPath);
  }

  private startResize(side: PanelSide, event: PointerEvent): void {
    event.preventDefault();

    const bodyRect = this.bodyEl.getBoundingClientRect();
    const onMove = (moveEvent: PointerEvent) => {
      if (side === "left") {
        this.chapterPanelWidth = clampPanelWidth(moveEvent.clientX - bodyRect.left);
        this.plugin.settings.chapterPanelWidth = this.chapterPanelWidth;
      } else {
        this.statsPanelWidth = clampPanelWidth(bodyRect.right - moveEvent.clientX);
        this.plugin.settings.statsPanelWidth = this.statsPanelWidth;
      }

      this.applyPanelLayout();
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      this.bodyEl.removeClass("is-resizing");
      void this.plugin.saveSettings();
    };

    this.bodyEl.addClass("is-resizing");
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  private resetSessionStats(text: string): void {
    const baselineWords = computeWritingStats(text).words;
    this.sessionState = {
      baselineWords,
      writingTimeMs: 0,
      idleTimeMs: 0,
      lastActivityAt: null,
      lastTickAt: Date.now(),
    };
  }

  private updateSessionDurations(now: number): void {
    const previousTick = this.sessionState.lastTickAt;
    if (!previousTick) {
      this.sessionState.lastTickAt = now;
      return;
    }

    const delta = now - previousTick;
    if (delta <= 0) {
      return;
    }

    const lastActivityAt = this.sessionState.lastActivityAt;
    if (lastActivityAt === null) {
      this.sessionState.idleTimeMs += delta;
      this.sessionState.lastTickAt = now;
      return;
    }

    const idleBoundary = lastActivityAt + IDLE_THRESHOLD_MS;
    if (previousTick >= idleBoundary) {
      this.sessionState.idleTimeMs += delta;
    } else if (now <= idleBoundary) {
      this.sessionState.writingTimeMs += delta;
    } else {
      this.sessionState.writingTimeMs += idleBoundary - previousTick;
      this.sessionState.idleTimeMs += now - idleBoundary;
    }

    this.sessionState.lastTickAt = now;
  }

  private getSessionStats(currentWords: number): WritingSessionStats {
    const sessionWords = Math.max(0, currentWords - this.sessionState.baselineWords);
    const writingTimeMs = this.sessionState.writingTimeMs;
    const idleTimeMs = this.sessionState.idleTimeMs;

    return {
      sessionWords,
      typingSpeed: computeTypingSpeed(sessionWords, writingTimeMs),
      writingTimeMs,
      idleTimeMs,
    };
  }

  private compareFiles(left: TFile, right: TFile, settings: WatermelonSettings): number {
    if (settings.chapterSort === "modified") {
      return right.stat.mtime - left.stat.mtime || left.path.localeCompare(right.path, undefined, { numeric: true });
    }

    return left.path.localeCompare(right.path, undefined, { numeric: true });
  }
}

class ChapterRenameModal extends Modal {
  private submitting = false;

  constructor(
    app: App,
    private readonly file: TFile,
    private readonly onSubmit: (baseName: string) => Promise<string | null>,
  ) {
    super(app);
  }

  override onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "重命名章节" });
    contentEl.createEl("p", { cls: "wm-settings-description", text: "仅修改文件名，保留 .md 扩展名。" });

    let inputValue = this.file.basename;
    const errorEl = contentEl.createDiv({ cls: "wm-modal-error" });
    errorEl.hide();

    new Setting(contentEl)
      .setName("章节名称")
      .setDesc("可以直接输入名称，也可以带 .md 后缀。")
      .addText((text) => {
        text.setValue(inputValue);
        text.inputEl.select();
        text.onChange((value) => {
          inputValue = value;
          errorEl.hide();
          errorEl.setText("");
        });
        text.inputEl.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void submit();
          }
        });
      });

    const submit = async () => {
      if (this.submitting) {
        return;
      }

      this.submitting = true;
      try {
        const error = await this.onSubmit(inputValue);
        if (error) {
          errorEl.setText(error);
          errorEl.show();
          return;
        }

        this.close();
      } finally {
        this.submitting = false;
      }
    };

    new Setting(contentEl)
      .addButton((button) => {
        button.setButtonText("取消").onClick(() => this.close());
      })
      .addButton((button) => {
        button.setButtonText("重命名").setCta().onClick(() => {
          void submit();
        });
      });
  }

  override onClose(): void {
    this.contentEl.empty();
  }
}

function prettyFontName(fontFamily: string): string {
  if (!fontFamily) {
    return "跟随 Obsidian";
  }

  const firstPart = fontFamily.split(",")[0]?.trim() ?? fontFamily;
  return firstPart.replace(/^"|"$/g, "");
}

function normalizeLegacyParagraphSpacing(text: string): string {
  return text
    .split("\n")
    .map((line) => line.startsWith(PARAGRAPH_INDENT) ? line.slice(PARAGRAPH_INDENT.length) : line)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

function formatEditorDisplayText(text: string): string {
  const originalLines = text.split("\n");
  return getPlainEditorText(text)
    .split("\n")
    .map((line, index) => {
      if (line.trim()) {
        return `${PARAGRAPH_INDENT}${line}`;
      }

      const originalLine = originalLines[index] ?? "";
      return originalLine.startsWith(PARAGRAPH_INDENT) ? PARAGRAPH_INDENT : line;
    })
    .join("\n");
}

function formatEditorDisplayTextWithCursor(text: string, cursor: number): { value: string; cursor: number } {
  const before = text.slice(0, cursor);
  const formattedBefore = formatEditorDisplayText(before);
  const formattedAll = formatEditorDisplayText(text);
  return {
    value: formattedAll,
    cursor: Math.min(formattedAll.length, formattedBefore.length),
  };
}

function getPlainEditorText(text: string): string {
  return text
    .split("\n")
    .map((line) => line.startsWith(PARAGRAPH_INDENT) ? line.slice(PARAGRAPH_INDENT.length) : line)
    .join("\n");
}

function getMarkdownSiblings(currentFile: TFile, allMarkdownFiles: TFile[]): TFile[] {
  const parentPath = currentFile.parent?.path ?? "";
  return allMarkdownFiles.filter((file) => (file.parent?.path ?? "") === parentPath);
}

function joinVaultPath(folderPath: string, fileName: string): string {
  return normalizePath(folderPath && folderPath !== "/" ? `${folderPath}/${fileName}` : fileName);
}

function normalizeChapterBaseName(input: string): string {
  const trimmed = input.trim();
  return trimmed.toLowerCase().endsWith(".md") ? trimmed.slice(0, -3).trim() : trimmed;
}

function getInvalidChapterBaseNameReason(baseName: string): string | null {
  if (!baseName) {
    return "章节名不能为空。";
  }

  if (/[\\/:*?"<>|]/.test(baseName)) {
    return "章节名不能包含 / \\ : * ? \" < > |。";
  }

  if (baseName.endsWith(".")) {
    return "章节名不能以句点结尾。";
  }

  return null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampPanelWidth(width: number): number {
  return Math.round(clamp(width, MIN_PANEL_WIDTH, MAX_PANEL_WIDTH));
}

function parseCssPx(value: string, fallback: number): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function copyTextareaLayoutStyles(editor: HTMLTextAreaElement, mirror: HTMLDivElement, style: CSSStyleDeclaration): void {
  mirror.setCssStyles({
    position: "absolute",
    top: "0",
    left: "0",
    width: style.width,
    height: "auto",
    minHeight: "0",
    maxHeight: "none",
    visibility: "hidden",
    pointerEvents: "none",
    overflow: "hidden",
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
    wordBreak: "break-word",
    boxSizing: style.boxSizing,
    padding: style.padding,
    border: style.border,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    textTransform: style.textTransform,
    tabSize: style.tabSize,
  });
}

function diffPrefix(kind: SnapshotDiffLine["kind"]): string {
  if (kind === "added") {
    return "+";
  }

  if (kind === "removed") {
    return "-";
  }

  return " ";
}

function snapshotKindLabel(kind: TimeMachineSnapshot["kind"]): string {
  if (kind === "auto") {
    return "自动";
  }

  if (kind === "daily") {
    return "每日";
  }

  if (kind === "manual") {
    return "手动";
  }

  return "旧版";
}

function createEmptySessionState(): SessionRuntimeState {
  return {
    baselineWords: 0,
    writingTimeMs: 0,
    idleTimeMs: 0,
    lastActivityAt: null,
    lastTickAt: Date.now(),
  };
}

export async function openWorkbenchLeaf(
  plugin: WatermelonWorkbenchPlugin,
  file?: TFile | null,
): Promise<void> {
  const { workspace } = plugin.app;
  const activeLeaf = workspace.activeLeaf;
  const existingLeaf = workspace.getLeavesOfType(WORKBENCH_VIEW_TYPE)[0];
  const leaf = existingLeaf ?? activeLeaf ?? workspace.getLeaf(false);

  await leaf.setViewState({
    type: WORKBENCH_VIEW_TYPE,
    active: true,
    state: file ? { file: file.path } : undefined,
  });

  const view = leaf.view;
  if (!(view instanceof WorkbenchView)) {
    new Notice("Unable to open the Watermelon workbench view.");
    return;
  }

  await view.refreshFromSettings();

  const targetFile = file ?? view.getInitialFileForOpen();
  if (!targetFile) {
    view.renderEmptyEditorState("请先选择一个 Markdown 笔记，再进入 Workbench。");
    return;
  }

  view.configureScopeFromFile(targetFile, true);
  view.refreshChapterList();
  await view.openChapter(targetFile);
}
