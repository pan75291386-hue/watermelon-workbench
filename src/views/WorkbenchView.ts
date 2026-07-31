import {
  Notice,
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
  '"Source Han Serif SC", "Noto Serif SC", SimSun, serif',
  '"Source Han Sans SC", "Noto Sans SC", sans-serif',
  '"Microsoft YaHei", "PingFang SC", sans-serif',
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
  private timeMachineSnapshots: TimeMachineSnapshot[] = [];
  private lastSnapshotWords = 0;
  private lastSnapshotCreatedAt = 0;
  private snapshotSaveInFlight = false;

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
    if (siblingFiles.length > 1 && file.parent?.path) {
      this.scopeMode = "folder";
      this.scopeRootPath = file.parent.path;
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

    const controls = panel.createDiv({ cls: "wm-random-controls" });
    const targetSelect = this.createLabeledSelect(controls, "类型", [
      ["person", "人名"],
      ["place", "地名"],
    ]);
    targetSelect.value = this.randomNameOptions.target;

    const languageSelect = this.createLabeledSelect(controls, "人名", [
      ["chinese", "中文"],
      ["english", "英文"],
    ]);
    languageSelect.value = this.randomNameOptions.personLanguage;

    const lengthSelect = this.createLabeledSelect(controls, "字数", [
      ["2", "二字名"],
      ["3", "三字名"],
    ]);
    lengthSelect.value = String(this.randomNameOptions.chineseNameLength);

    const placeSelect = this.createLabeledSelect(controls, "地名", [
      ["ancient", "古代"],
      ["modern", "现代"],
    ]);
    placeSelect.value = this.randomNameOptions.placeStyle;

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

    const updateOptions = () => {
      this.randomNameOptions = {
        target: targetSelect.value === "place" ? "place" : "person",
        personLanguage: languageSelect.value === "english" ? "english" : "chinese",
        chineseNameLength: lengthSelect.value === "3" ? 3 : 2,
        placeStyle: placeSelect.value === "modern" ? "modern" : "ancient",
      };
      languageSelect.disabled = this.randomNameOptions.target === "place";
      lengthSelect.disabled = this.randomNameOptions.target === "place" || this.randomNameOptions.personLanguage === "english";
      placeSelect.disabled = this.randomNameOptions.target === "person";
      this.randomNames = generateRandomNames(this.randomNameOptions, 12);
      renderNames();
    };

    this.registerDomEvent(targetSelect, "change", updateOptions);
    this.registerDomEvent(languageSelect, "change", updateOptions);
    this.registerDomEvent(lengthSelect, "change", updateOptions);
    this.registerDomEvent(placeSelect, "change", updateOptions);
    this.registerDomEvent(generateButton, "click", updateOptions);
    updateOptions();
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

      const distanceToBottom = editor.scrollHeight - editor.clientHeight - editor.scrollTop;
      const comfortZone = Math.round(editor.clientHeight * 0.28);
      if (distanceToBottom < comfortZone) {
        editor.scrollTop = Math.max(0, editor.scrollHeight - editor.clientHeight);
      }
    });
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
      const item = this.chapterListBodyEl.createEl("button", {
        cls: `wm-chapter-item${file.path === this.selectedChapterPath ? " is-active" : ""}`,
        attr: { type: "button" },
      });
      item.createDiv({ cls: "wm-chapter-title", text: file.basename });
      this.registerDomEvent(item, "click", () => {
        void this.openChapter(file);
      });
    });
  }

  private updateStats(): void {
    if (!this.statsBodyEl) {
      return;
    }

    const staticStats = computeWritingStats(this.editorEl ? getPlainEditorText(this.editorEl.value) : this.data ?? "");
    const sessionStats = this.getSessionStats(staticStats.words);
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
    ];
  }

  private applyTypography(): void {
    if (!this.rootEl) {
      return;
    }

    this.rootEl.style.setProperty("--wm-font-family", this.activeFontFamily);
    this.rootEl.style.setProperty("--wm-font-size", `${this.activeFontSizePx}px`);
    this.rootEl.style.setProperty("--wm-line-height", String(this.activeLineHeight));
  }

  private applyPanelLayout(): void {
    if (!this.rootEl || !this.bodyEl) {
      return;
    }

    this.rootEl.style.setProperty("--wm-left-width", `${clampPanelWidth(this.chapterPanelWidth)}px`);
    this.rootEl.style.setProperty("--wm-right-width", `${clampPanelWidth(this.statsPanelWidth)}px`);

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
    if (!this.scopeRootPath) {
      return false;
    }

    if (this.scopeMode === "single-file") {
      return file.path === this.scopeRootPath;
    }

    return file.parent?.path === this.scopeRootPath;
  }

  private getScopedFiles(): TFile[] {
    if (!this.scopeRootPath) {
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

function prettyFontName(fontFamily: string): string {
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
  const parentPath = currentFile.parent?.path;
  if (!parentPath) {
    return [currentFile];
  }

  return allMarkdownFiles.filter((file) => file.parent?.path === parentPath);
}

function clampPanelWidth(width: number): number {
  return Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, Math.round(width)));
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
