import { normalizePath, PluginSettingTab, Setting } from "obsidian";
import type WatermelonWorkbenchPlugin from "./main";

export type ChapterSortMode = "name" | "modified";

export interface WatermelonSettings {
  manuscriptRoot: string;
  defaultFontFamily: string;
  defaultFontSizePx: number;
  defaultLineHeight: number;
  autoParagraphIndent: boolean;
  showChapterPanel: boolean;
  showStatsPanel: boolean;
  chapterPanelWidth: number;
  statsPanelWidth: number;
  rememberLastFile: boolean;
  chapterSort: ChapterSortMode;
  lastOpenFilePath: string | null;
}

export const DEFAULT_SETTINGS: WatermelonSettings = {
  manuscriptRoot: "",
  defaultFontFamily: "",
  defaultFontSizePx: 22,
  defaultLineHeight: 1.8,
  autoParagraphIndent: true,
  showChapterPanel: true,
  showStatsPanel: true,
  chapterPanelWidth: 260,
  statsPanelWidth: 280,
  rememberLastFile: true,
  chapterSort: "name",
  lastOpenFilePath: null,
};

export class WatermelonSettingTab extends PluginSettingTab {
  plugin: WatermelonWorkbenchPlugin;

  constructor(plugin: WatermelonWorkbenchPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  override display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Writing workbench")
      .setDesc("保持 Markdown 文件不变，只调整写作工作台中的展示与辅助功能。")
      .setHeading();

    new Setting(containerEl)
      .setName("Manuscript root")
      .setDesc("Only used as an optional ceiling for your novel files. Leave empty to derive scope from the currently opened note.")
      .addText((text) => {
        text
          .setPlaceholder("Novels/My Project")
          .setValue(this.plugin.settings.manuscriptRoot)
          .onChange(async (value) => {
            this.plugin.settings.manuscriptRoot = normalizeRootInput(value);
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Workbench font")
      .setDesc("留空则跟随 Obsidian 正文字体；也可以输入本机已安装字体名称，例如：霞鹜文楷、Microsoft YaHei、SimSun。")
      .addText((text) => {
        text
          .setPlaceholder("跟随 Obsidian，或输入本地字体名称")
          .setValue(this.plugin.settings.defaultFontFamily)
          .onChange(async (value) => {
            this.plugin.settings.defaultFontFamily = normalizeFontFamilyInput(value);
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Default font size")
      .setDesc("Editor font size in pixels.")
      .addDropdown((dropdown) => {
        [16, 18, 20, 22, 24, 26, 28, 30].forEach((size) => {
          dropdown.addOption(String(size), `${size}px`);
        });
        dropdown.setValue(String(this.plugin.settings.defaultFontSizePx));
        dropdown.onChange(async (value) => {
          this.plugin.settings.defaultFontSizePx = Number(value) || DEFAULT_SETTINGS.defaultFontSizePx;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Default line height")
      .setDesc("Comfortable spacing for long-form writing.")
      .addDropdown((dropdown) => {
        [1.4, 1.5, 1.6, 1.8, 2].forEach((lineHeight) => {
          dropdown.addOption(String(lineHeight), `${lineHeight}x`);
        });
        dropdown.setValue(String(this.plugin.settings.defaultLineHeight));
        dropdown.onChange(async (value) => {
          this.plugin.settings.defaultLineHeight = Number(value) || DEFAULT_SETTINGS.defaultLineHeight;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Show chapter panel by default")
      .setDesc("Display the left-hand chapter list when the workbench opens.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.showChapterPanel).onChange(async (value) => {
          this.plugin.settings.showChapterPanel = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Show stats panel by default")
      .setDesc("Display the right-hand writing statistics panel when the workbench opens.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.showStatsPanel).onChange(async (value) => {
          this.plugin.settings.showStatsPanel = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Remember last opened chapter")
      .setDesc("Restore the most recently opened file when the workbench opens again.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.rememberLastFile).onChange(async (value) => {
          this.plugin.settings.rememberLastFile = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Chapter sort")
      .setDesc("Choose how chapter files are ordered in the left pane.")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("name", "By path / name")
          .addOption("modified", "By last modified time");
        dropdown.setValue(this.plugin.settings.chapterSort);
        dropdown.onChange(async (value) => {
          this.plugin.settings.chapterSort = value === "modified" ? "modified" : "name";
          await this.plugin.saveSettings();
        });
      });
  }
}

function normalizeRootInput(value: string): string {
  const trimmed = value.trim();
  return trimmed ? normalizePath(trimmed) : "";
}

function normalizeFontFamilyInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.includes(",") || trimmed.startsWith("\"") || trimmed.startsWith("'")) {
    return trimmed;
  }

  return `"${trimmed.replace(/"/g, "\\\"")}"`;
}
