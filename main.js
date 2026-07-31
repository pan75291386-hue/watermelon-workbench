"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => WatermelonWorkbenchPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian4 = require("obsidian");

// src/settings.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  manuscriptRoot: "",
  defaultFontFamily: '"Source Han Serif SC", "Noto Serif SC", SimSun, serif',
  defaultFontSizePx: 22,
  defaultLineHeight: 1.8,
  showChapterPanel: true,
  showStatsPanel: true,
  chapterPanelWidth: 260,
  statsPanelWidth: 280,
  rememberLastFile: true,
  chapterSort: "name",
  lastOpenFilePath: null
};
var WatermelonSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(plugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("Writing workbench").setDesc("\u4FDD\u6301 Markdown \u6587\u4EF6\u4E0D\u53D8\uFF0C\u53EA\u8C03\u6574\u5199\u4F5C\u5DE5\u4F5C\u53F0\u4E2D\u7684\u5C55\u793A\u4E0E\u8F85\u52A9\u529F\u80FD\u3002").setHeading();
    new import_obsidian.Setting(containerEl).setName("Manuscript root").setDesc("Only used as an optional ceiling for your novel files. Leave empty to derive scope from the currently opened note.").addText((text) => {
      text.setPlaceholder("Novels/My Project").setValue(this.plugin.settings.manuscriptRoot).onChange(async (value) => {
        this.plugin.settings.manuscriptRoot = normalizeRootInput(value);
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Default font family").setDesc("Used only inside the workbench editor view.").addText((text) => {
      text.setPlaceholder('"Source Han Serif SC", SimSun, serif').setValue(this.plugin.settings.defaultFontFamily).onChange(async (value) => {
        this.plugin.settings.defaultFontFamily = value.trim() || DEFAULT_SETTINGS.defaultFontFamily;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Default font size").setDesc("Editor font size in pixels.").addDropdown((dropdown) => {
      [16, 18, 20, 22, 24, 26, 28, 30].forEach((size) => {
        dropdown.addOption(String(size), `${size}px`);
      });
      dropdown.setValue(String(this.plugin.settings.defaultFontSizePx));
      dropdown.onChange(async (value) => {
        this.plugin.settings.defaultFontSizePx = Number(value) || DEFAULT_SETTINGS.defaultFontSizePx;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Default line height").setDesc("Comfortable spacing for long-form writing.").addDropdown((dropdown) => {
      [1.4, 1.5, 1.6, 1.8, 2].forEach((lineHeight) => {
        dropdown.addOption(String(lineHeight), `${lineHeight}x`);
      });
      dropdown.setValue(String(this.plugin.settings.defaultLineHeight));
      dropdown.onChange(async (value) => {
        this.plugin.settings.defaultLineHeight = Number(value) || DEFAULT_SETTINGS.defaultLineHeight;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Show chapter panel by default").setDesc("Display the left-hand chapter list when the workbench opens.").addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.showChapterPanel).onChange(async (value) => {
        this.plugin.settings.showChapterPanel = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Show stats panel by default").setDesc("Display the right-hand writing statistics panel when the workbench opens.").addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.showStatsPanel).onChange(async (value) => {
        this.plugin.settings.showStatsPanel = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Remember last opened chapter").setDesc("Restore the most recently opened file when the workbench opens again.").addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.rememberLastFile).onChange(async (value) => {
        this.plugin.settings.rememberLastFile = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Chapter sort").setDesc("Choose how chapter files are ordered in the left pane.").addDropdown((dropdown) => {
      dropdown.addOption("name", "By path / name").addOption("modified", "By last modified time");
      dropdown.setValue(this.plugin.settings.chapterSort);
      dropdown.onChange(async (value) => {
        this.plugin.settings.chapterSort = value === "modified" ? "modified" : "name";
        await this.plugin.saveSettings();
      });
    });
  }
};
function normalizeRootInput(value) {
  const trimmed = value.trim();
  return trimmed ? (0, import_obsidian.normalizePath)(trimmed) : "";
}

// src/views/WorkbenchView.ts
var import_obsidian3 = require("obsidian");

// src/services/RandomNameService.ts
var CHINESE_SURNAMES = [
  "\u6797",
  "\u82CF",
  "\u6C88",
  "\u987E",
  "\u9646",
  "\u8C22",
  "\u8BB8",
  "\u6C5F",
  "\u6E29",
  "\u53F6",
  "\u5468",
  "\u8D75",
  "\u79E6",
  "\u5B8B",
  "\u97E9",
  "\u5B5F",
  "\u7A0B",
  "\u7EAA",
  "\u59DC",
  "\u767D",
  "\u5085",
  "\u4E54",
  "\u590F",
  "\u5510",
  "\u8427",
  "\u695A",
  "\u6D1B",
  "\u4E91",
  "\u9ECE",
  "\u949F",
  "\u5F90",
  "\u9B4F",
  "\u859B",
  "\u8D3A",
  "\u6881",
  "\u987E",
  "\u5B81",
  "\u76DB",
  "\u95FB",
  "\u8F9B"
];
var CHINESE_GIVEN_CHARS = [
  "\u5B89",
  "\u7136",
  "\u6E05",
  "\u5B81",
  "\u5C9A",
  "\u665A",
  "\u821F",
  "\u9065",
  "\u661F",
  "\u6CB3",
  "\u6708",
  "\u9701",
  "\u521D",
  "\u5FAE",
  "\u68E0",
  "\u6800",
  "\u79BE",
  "\u5E8F",
  "\u73E9",
  "\u749F",
  "\u8F9E",
  "\u781A",
  "\u77E5",
  "\u884D",
  "\u6B8A",
  "\u58A8",
  "\u666F",
  "\u6F9C",
  "\u4E88",
  "\u7720",
  "\u664F",
  "\u662D",
  "\u7167",
  "\u4E00",
  "\u4E34",
  "\u91CE",
  "\u5DDD",
  "\u56DE",
  "\u58F0",
  "\u6D1B",
  "\u7EFE",
  "\u68A8",
  "\u82E5",
  "\u5F26",
  "\u6816",
  "\u671B",
  "\u5EAD",
  "\u7AF9",
  "\u8861",
  "\u5C18",
  "\u96BD",
  "\u7476",
  "\u7FCE",
  "\u69FF",
  "\u70EC",
  "\u82CD",
  "\u8FDF",
  "\u8D8A",
  "\u971C",
  "\u65FB"
];
var ENGLISH_FIRST_NAMES = [
  "Aiden",
  "Alice",
  "Amelia",
  "Arthur",
  "Audrey",
  "Blair",
  "Caleb",
  "Clara",
  "Daphne",
  "Elias",
  "Evelyn",
  "Felix",
  "Flora",
  "Gavin",
  "Hazel",
  "Iris",
  "Julian",
  "Lena",
  "Leo",
  "Mira",
  "Nora",
  "Oscar",
  "Rhea",
  "Rowan",
  "Selene",
  "Theo",
  "Vera",
  "Victor"
];
var ENGLISH_LAST_NAMES = [
  "Ashford",
  "Blackwood",
  "Bright",
  "Calloway",
  "Carter",
  "Everett",
  "Fairchild",
  "Gray",
  "Hale",
  "Hart",
  "Hawthorne",
  "Kingsley",
  "Lancaster",
  "Locke",
  "Marlow",
  "Montgomery",
  "Pierce",
  "Quinn",
  "Reed",
  "Sinclair",
  "Sterling",
  "Vaughn",
  "Whitaker",
  "Wilder"
];
var ANCIENT_PLACE_PREFIXES = [
  "\u9752",
  "\u4E91",
  "\u957F",
  "\u5BD2",
  "\u843D",
  "\u671B",
  "\u5F52",
  "\u6276",
  "\u767D",
  "\u7384",
  "\u6731",
  "\u788E",
  "\u542C",
  "\u85CF",
  "\u4E5D",
  "\u5343",
  "\u7167",
  "\u6F9C",
  "\u9E64",
  "\u6816"
];
var ANCIENT_PLACE_SUFFIXES = [
  "\u5DDE",
  "\u90E1",
  "\u57CE",
  "\u5173",
  "\u6E21",
  "\u8C37",
  "\u5C71",
  "\u5DDD",
  "\u9675",
  "\u53F0",
  "\u5BAB",
  "\u89C2",
  "\u9601",
  "\u575E",
  "\u6CFD",
  "\u539F",
  "\u5761",
  "\u5DF7",
  "\u9547",
  "\u6865"
];
var MODERN_PLACE_PREFIXES = [
  "\u661F\u6D77",
  "\u5357\u5CB8",
  "\u5317\u57CE",
  "\u65B0\u5DDD",
  "\u4E91\u6E2F",
  "\u6F9C\u6E7E",
  "\u9E7F\u9E23",
  "\u9752\u79BE",
  "\u671B\u6C5F",
  "\u4E34\u5B89",
  "\u6D77\u68E0",
  "\u9526\u7A0B",
  "\u4E1C\u5E8F",
  "\u897F\u6D32",
  "\u957F\u5B81",
  "\u660E\u6E56",
  "\u79CB\u6D66",
  "\u6674\u5DDD"
];
var MODERN_PLACE_SUFFIXES = [
  "\u5E02",
  "\u533A",
  "\u8DEF",
  "\u8857",
  "\u5DF7",
  "\u6E7E",
  "\u6E2F",
  "\u7AD9",
  "\u5E7F\u573A",
  "\u82B1\u56ED",
  "\u516C\u5BD3",
  "\u533B\u9662",
  "\u5927\u5B66",
  "\u4E66\u5E97",
  "\u5F71\u57CE",
  "\u5927\u53A6",
  "\u516C\u56ED",
  "\u7801\u5934"
];
function createDefaultRandomNameOptions() {
  return {
    target: "person",
    personLanguage: "chinese",
    chineseNameLength: 2,
    placeStyle: "ancient"
  };
}
function generateRandomNames(options, count = 12) {
  const names = /* @__PURE__ */ new Set();
  const limit = Math.max(1, count);
  let attempts = 0;
  while (names.size < limit && attempts < limit * 20) {
    attempts += 1;
    names.add(generateOne(options));
  }
  return Array.from(names);
}
function generateOne(options) {
  if (options.target === "place") {
    return options.placeStyle === "ancient" ? `${pick(ANCIENT_PLACE_PREFIXES)}${pick(ANCIENT_PLACE_SUFFIXES)}` : `${pick(MODERN_PLACE_PREFIXES)}${pick(MODERN_PLACE_SUFFIXES)}`;
  }
  if (options.personLanguage === "english") {
    return `${pick(ENGLISH_FIRST_NAMES)} ${pick(ENGLISH_LAST_NAMES)}`;
  }
  const surname = pick(CHINESE_SURNAMES);
  if (options.chineseNameLength === 2) {
    return `${surname}${pick(CHINESE_GIVEN_CHARS)}`;
  }
  return `${surname}${pick(CHINESE_GIVEN_CHARS)}${pick(CHINESE_GIVEN_CHARS)}`;
}
function pick(items) {
  const item = items[Math.floor(Math.random() * items.length)];
  if (item === void 0) {
    throw new Error("Cannot pick from an empty list.");
  }
  return item;
}

// src/services/TimeMachineService.ts
var import_obsidian2 = require("obsidian");
var BACKUP_FOLDER_NAME = "\u5907\u4EFD";
var AUTO_SNAPSHOT_INTERVAL_WORDS = 500;
var AUTO_SNAPSHOT_MIN_INTERVAL_MS = 2 * 60 * 1e3;
var MAX_AUTO_SNAPSHOTS_PER_FILE = 30;
async function maybeCreateTimeMachineSnapshot(plugin, file, currentText, lastSnapshotWords, lastSnapshotCreatedAt) {
  const currentState = {
    wordCount: lastSnapshotWords,
    createdAt: lastSnapshotCreatedAt,
    created: false
  };
  if (!file) {
    return currentState;
  }
  const currentWords = countWritingCharacters(currentText);
  if (currentWords <= 0) {
    return currentState;
  }
  const now = Date.now();
  const today = formatDateStamp(now);
  if (!await hasDailySnapshotForDate(plugin, file, today)) {
    const dailySnapshot = await createTimeMachineSnapshot(plugin, file, currentText, {
      kind: "daily",
      wordCount: currentWords,
      createdAt: now
    });
    return {
      wordCount: dailySnapshot.wordCount,
      createdAt: dailySnapshot.createdAt,
      created: true
    };
  }
  if (currentWords - lastSnapshotWords < AUTO_SNAPSHOT_INTERVAL_WORDS) {
    return currentState;
  }
  if (lastSnapshotCreatedAt > 0 && now - lastSnapshotCreatedAt < AUTO_SNAPSHOT_MIN_INTERVAL_MS) {
    return currentState;
  }
  const autoSnapshot = await createTimeMachineSnapshot(plugin, file, currentText, {
    kind: "auto",
    wordCount: currentWords,
    createdAt: now
  });
  await pruneOldAutoSnapshots(plugin, file);
  return {
    wordCount: autoSnapshot.wordCount,
    createdAt: autoSnapshot.createdAt,
    created: true
  };
}
async function createTimeMachineSnapshot(plugin, file, text, options = {}) {
  const folderPath = await ensureChapterBackupFolder(plugin, file);
  const createdAt = options.createdAt ?? Date.now();
  const wordCount = options.wordCount ?? countWritingCharacters(text);
  const kind = options.kind ?? "manual";
  const snapshotPath = await getUniqueSnapshotPath(plugin, folderPath, kind, createdAt, wordCount);
  await plugin.app.vault.create(snapshotPath, text);
  return {
    path: snapshotPath,
    createdAt,
    wordCount,
    originalPath: file.path,
    kind
  };
}
function getBackupFolderPath(file) {
  const parentPath = file.parent?.path;
  return (0, import_obsidian2.normalizePath)(parentPath && parentPath !== "/" ? `${parentPath}/${BACKUP_FOLDER_NAME}` : BACKUP_FOLDER_NAME);
}
function getChapterBackupFolderPath(file) {
  return (0, import_obsidian2.normalizePath)(`${getBackupFolderPath(file)}/${sanitizeFileName(file.basename)}`);
}
function countWritingCharacters(text) {
  return Array.from(text.replace(/\s+/g, "")).length;
}
async function listTimeMachineSnapshots(plugin, file) {
  if (!file) {
    return [];
  }
  return [...listLegacySnapshots(plugin, file), ...listChapterSnapshots(plugin, file)].sort(
    (left, right) => right.createdAt - left.createdAt
  );
}
async function buildSnapshotDiff(plugin, snapshot, currentText) {
  const snapshotText = await plugin.app.vault.cachedRead(snapshot);
  return diffLines(snapshotText, currentText);
}
function diffLines(previousText, currentText) {
  const previousLines = previousText.split("\n");
  const currentLines = currentText.split("\n");
  const rows = previousLines.length + 1;
  const columns = currentLines.length + 1;
  const table = Array.from({ length: rows }, () => Array.from({ length: columns }, () => 0));
  for (let row2 = previousLines.length - 1; row2 >= 0; row2 -= 1) {
    for (let column2 = currentLines.length - 1; column2 >= 0; column2 -= 1) {
      table[row2][column2] = previousLines[row2] === currentLines[column2] ? table[row2 + 1][column2 + 1] + 1 : Math.max(table[row2 + 1][column2], table[row2][column2 + 1]);
    }
  }
  const result = [];
  let row = 0;
  let column = 0;
  while (row < previousLines.length && column < currentLines.length) {
    if (previousLines[row] === currentLines[column]) {
      result.push({ kind: "same", text: previousLines[row] });
      row += 1;
      column += 1;
    } else if (table[row + 1][column] >= table[row][column + 1]) {
      result.push({ kind: "removed", text: previousLines[row] });
      row += 1;
    } else {
      result.push({ kind: "added", text: currentLines[column] });
      column += 1;
    }
  }
  while (row < previousLines.length) {
    result.push({ kind: "removed", text: previousLines[row] });
    row += 1;
  }
  while (column < currentLines.length) {
    result.push({ kind: "added", text: currentLines[column] });
    column += 1;
  }
  return result;
}
async function ensureChapterBackupFolder(plugin, file) {
  const rootFolderPath = getBackupFolderPath(file);
  await ensureFolder(plugin, rootFolderPath);
  const chapterFolderPath = getChapterBackupFolderPath(file);
  await ensureFolder(plugin, chapterFolderPath);
  return chapterFolderPath;
}
async function ensureFolder(plugin, folderPath) {
  const existing = plugin.app.vault.getAbstractFileByPath(folderPath);
  if (existing) {
    return;
  }
  await plugin.app.vault.createFolder(folderPath);
}
function listLegacySnapshots(plugin, file) {
  const folder = plugin.app.vault.getAbstractFileByPath(getBackupFolderPath(file));
  if (!(folder instanceof import_obsidian2.TFolder)) {
    return [];
  }
  const prefix = `${sanitizeFileName(file.basename)}__`;
  return folder.children.filter((child) => child instanceof import_obsidian2.TFile && child.name.startsWith(prefix) && child.name.endsWith(".md")).map((snapshot) => ({
    path: snapshot.path,
    createdAt: snapshot.stat.ctime,
    wordCount: readWordCountFromSnapshotName(snapshot.basename),
    originalPath: file.path,
    kind: "legacy"
  }));
}
function listChapterSnapshots(plugin, file) {
  const folder = plugin.app.vault.getAbstractFileByPath(getChapterBackupFolderPath(file));
  if (!(folder instanceof import_obsidian2.TFolder)) {
    return [];
  }
  return folder.children.filter((child) => child instanceof import_obsidian2.TFile && child.extension === "md").map((snapshot) => ({
    path: snapshot.path,
    createdAt: snapshot.stat.ctime,
    wordCount: readWordCountFromSnapshotName(snapshot.basename),
    originalPath: file.path,
    kind: readSnapshotKindFromName(snapshot.basename)
  }));
}
async function hasDailySnapshotForDate(plugin, file, dateStamp) {
  const folder = plugin.app.vault.getAbstractFileByPath(getChapterBackupFolderPath(file));
  if (!(folder instanceof import_obsidian2.TFolder)) {
    return false;
  }
  return folder.children.some(
    (child) => child instanceof import_obsidian2.TFile && child.basename.startsWith(`daily__${dateStamp}__`) && child.extension === "md"
  );
}
async function pruneOldAutoSnapshots(plugin, file) {
  const folder = plugin.app.vault.getAbstractFileByPath(getChapterBackupFolderPath(file));
  if (!(folder instanceof import_obsidian2.TFolder)) {
    return;
  }
  const autoSnapshots = folder.children.filter((child) => child instanceof import_obsidian2.TFile && child.basename.startsWith("auto__") && child.extension === "md").sort((left, right) => right.stat.ctime - left.stat.ctime);
  const expiredSnapshots = autoSnapshots.slice(MAX_AUTO_SNAPSHOTS_PER_FILE);
  for (const snapshot of expiredSnapshots) {
    await plugin.app.vault.delete(snapshot);
  }
}
async function getUniqueSnapshotPath(plugin, folderPath, kind, createdAt, wordCount) {
  const timestamp = kind === "daily" ? formatDateStamp(createdAt) : formatTimestamp(createdAt);
  const baseName = `${kind}__${timestamp}__${wordCount}\u5B57`;
  let snapshotPath = (0, import_obsidian2.normalizePath)(`${folderPath}/${baseName}.md`);
  let counter = 2;
  while (plugin.app.vault.getAbstractFileByPath(snapshotPath)) {
    snapshotPath = (0, import_obsidian2.normalizePath)(`${folderPath}/${baseName}-${counter}.md`);
    counter += 1;
  }
  return snapshotPath;
}
function readWordCountFromSnapshotName(name) {
  const match = name.match(/__(\d+)字(?:-\d+)?$/);
  return match ? Number(match[1]) : 0;
}
function readSnapshotKindFromName(name) {
  if (name.startsWith("auto__")) {
    return "auto";
  }
  if (name.startsWith("daily__")) {
    return "daily";
  }
  if (name.startsWith("manual__")) {
    return "manual";
  }
  return "legacy";
}
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
function formatDateStamp(timestamp) {
  const date = new Date(timestamp);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}
function sanitizeFileName(name) {
  return name.replace(/[\\/:*?"<>|]/g, "_");
}

// src/services/StatsService.ts
var CJK_CHAR_REGEX = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu;
var LATIN_WORD_REGEX = /[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g;
var HEADING_REGEX = /^#{1,6}\s+/gm;
function computeWritingStats(text) {
  const characters = Array.from(text).length;
  const charactersNoSpaces = Array.from(text.replace(/\s+/g, "")).length;
  const cjkMatches = text.match(CJK_CHAR_REGEX) ?? [];
  const latinMatches = text.match(LATIN_WORD_REGEX) ?? [];
  const paragraphs = text.split(/\n\s*\n/g).map((paragraph) => paragraph.trim()).filter(Boolean).length;
  const headings = (text.match(HEADING_REGEX) ?? []).length;
  const words = cjkMatches.length + latinMatches.length;
  const readingMinutes = Math.max(1, Math.ceil(words / 300));
  return {
    words,
    characters,
    charactersNoSpaces,
    paragraphs,
    headings,
    readingMinutes
  };
}
function computeTypingSpeed(sessionWords, writingTimeMs) {
  if (sessionWords <= 0 || writingTimeMs <= 0) {
    return 0;
  }
  return Math.round(sessionWords / (writingTimeMs / 6e4));
}
function formatDuration(durationMs) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1e3));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds % 3600 / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

// src/utils/formatting.ts
function wrapSelection(value, selectionStart, selectionEnd, wrapper) {
  const selectedText = value.slice(selectionStart, selectionEnd);
  const replacement = `${wrapper}${selectedText}${wrapper}`;
  const nextValue = `${value.slice(0, selectionStart)}${replacement}${value.slice(selectionEnd)}`;
  const cursorStart = selectionStart + wrapper.length;
  const cursorEnd = cursorStart + selectedText.length;
  return {
    value: nextValue,
    selectionStart: cursorStart,
    selectionEnd: cursorEnd
  };
}
function prefixSelectedLines(value, selectionStart, selectionEnd, prefix) {
  const lineStart = value.lastIndexOf("\n", Math.max(0, selectionStart - 1)) + 1;
  const lineEndIndex = value.indexOf("\n", selectionEnd);
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
  const block = value.slice(lineStart, lineEnd);
  const transformedBlock = block.split("\n").map((line) => `${prefix}${line}`).join("\n");
  const nextValue = `${value.slice(0, lineStart)}${transformedBlock}${value.slice(lineEnd)}`;
  const delta = transformedBlock.length - block.length;
  return {
    value: nextValue,
    selectionStart: selectionStart + prefix.length,
    selectionEnd: selectionEnd + delta
  };
}

// src/views/WorkbenchView.ts
var PARAGRAPH_INDENT = "\u3000\u3000";
var WORKBENCH_VIEW_TYPE = "watermelon-workbench";
var FONT_PRESETS = [
  '"Source Han Serif SC", "Noto Serif SC", SimSun, serif',
  '"Source Han Sans SC", "Noto Sans SC", sans-serif',
  '"Microsoft YaHei", "PingFang SC", sans-serif',
  'Georgia, "Times New Roman", serif'
];
var FONT_SIZE_PRESETS = [16, 18, 20, 22, 24, 26, 28, 30];
var LINE_HEIGHT_PRESETS = [1.4, 1.5, 1.6, 1.8, 2];
var IDLE_THRESHOLD_MS = 5e3;
var MIN_PANEL_WIDTH = 180;
var MAX_PANEL_WIDTH = 480;
var WorkbenchView = class extends import_obsidian3.TextFileView {
  constructor(leaf, plugin) {
    super(leaf);
    this.chapters = [];
    this.selectedChapterPath = null;
    this.scopeMode = "single-file";
    this.scopeRootPath = null;
    this.sessionState = createEmptySessionState();
    this.randomNameOptions = createDefaultRandomNameOptions();
    this.randomNames = [];
    this.activePluginTool = null;
    this.timeMachineSnapshots = [];
    this.lastSnapshotWords = 0;
    this.lastSnapshotCreatedAt = 0;
    this.snapshotSaveInFlight = false;
    this.plugin = plugin;
    this.chapterPanelVisible = plugin.settings.showChapterPanel;
    this.statsPanelVisible = plugin.settings.showStatsPanel;
    this.chapterPanelWidth = plugin.settings.chapterPanelWidth;
    this.statsPanelWidth = plugin.settings.statsPanelWidth;
    this.activeFontFamily = plugin.settings.defaultFontFamily;
    this.activeFontSizePx = plugin.settings.defaultFontSizePx;
    this.activeLineHeight = plugin.settings.defaultLineHeight;
  }
  getViewType() {
    return WORKBENCH_VIEW_TYPE;
  }
  getDisplayText() {
    return this.file ? `Watermelon \xB7 ${this.file.basename}` : "Watermelon Workbench";
  }
  getIcon() {
    return "notebook-pen";
  }
  getViewData() {
    return this.editorEl ? getPlainEditorText(this.editorEl.value) : this.data ?? "";
  }
  setViewData(data, clear) {
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
  clear() {
    this.data = "";
    if (this.editorEl) {
      this.editorEl.value = "";
    }
    this.updateStats();
  }
  getState() {
    return {
      ...super.getState(),
      file: this.file?.path ?? this.selectedChapterPath ?? void 0
    };
  }
  async setState(state, result) {
    await super.setState(state, result);
    const filePath = typeof state?.file === "string" ? state.file : null;
    if (!filePath) {
      return;
    }
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file instanceof import_obsidian3.TFile) {
      this.configureScopeFromFile(file, true);
      this.refreshChapterList();
      await this.openChapter(file);
    }
  }
  async onOpen() {
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
      this.renderEmptyEditorState("\u6253\u5F00\u4E00\u4E2A Markdown \u7B14\u8BB0\u540E\u518D\u8FDB\u5165 Workbench\uFF0C\u6216\u4F7F\u7528\u201COpen current file in writing workbench\u201D\u3002");
    }
  }
  async onLoadFile(file) {
    await super.onLoadFile(file);
    this.selectedChapterPath = file.path;
    this.updateHeaderState();
    this.refreshChapterList();
    this.updateStats();
  }
  async onClose() {
    await this.save();
  }
  async refreshFromSettings() {
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
  async openChapter(file) {
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
  async exitWorkbench() {
    await this.save();
    const currentFile = this.file;
    if (currentFile) {
      await this.leaf.setViewState({
        type: "markdown",
        active: true,
        state: { file: currentFile.path, mode: "source" }
      });
      return;
    }
    this.leaf.detach();
  }
  getInitialFileForOpen() {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile instanceof import_obsidian3.TFile && activeFile.extension === "md") {
      return activeFile;
    }
    if (this.plugin.settings.rememberLastFile && this.plugin.settings.lastOpenFilePath) {
      const remembered = this.app.vault.getAbstractFileByPath(this.plugin.settings.lastOpenFilePath);
      if (remembered instanceof import_obsidian3.TFile) {
        return remembered;
      }
    }
    return null;
  }
  configureScopeFromFile(file, force = false) {
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
  buildLayout() {
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
        placeholder: "\u5728\u8FD9\u91CC\u5F00\u59CB\u4F60\u7684\u7AE0\u8282\u521B\u4F5C\u2026\u2026"
      }
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
  renderToolbar() {
    this.toolbarEl.empty();
    const leftGroup = this.toolbarEl.createDiv({ cls: "wm-toolbar-group" });
    const fontSelect = leftGroup.createEl("select", { cls: "wm-select" });
    FONT_PRESETS.forEach((font) => {
      fontSelect.createEl("option", {
        value: font,
        text: prettyFontName(font)
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
        text: `${lineHeight}\u500D\u884C\u8DDD`
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
    this.createToolbarButton(formatGroup, "B", "\u52A0\u7C97", () => this.applyCommand("bold"));
    this.createToolbarButton(formatGroup, "I", "\u659C\u4F53", () => this.applyCommand("italic"));
    this.createToolbarButton(formatGroup, "H1", "\u6807\u9898", () => this.applyCommand("heading"));
    this.createToolbarButton(formatGroup, "\u275D", "\u5F15\u7528", () => this.applyCommand("quote"));
    this.createToolbarButton(formatGroup, "\u2022", "\u5217\u8868", () => this.applyCommand("bullet"));
    const rightGroup = this.toolbarEl.createDiv({ cls: "wm-toolbar-group wm-toolbar-group-right" });
    this.chapterToggleButton = rightGroup.createEl("button", {
      cls: "clickable-icon wm-icon-button",
      attr: { type: "button", "aria-label": "\u5207\u6362\u7AE0\u8282\u76EE\u5F55" }
    });
    this.registerDomEvent(this.chapterToggleButton, "click", () => {
      this.chapterPanelVisible = !this.chapterPanelVisible;
      this.plugin.settings.showChapterPanel = this.chapterPanelVisible;
      this.applyPanelLayout();
      void this.plugin.saveSettings();
    });
    this.statsToggleButton = rightGroup.createEl("button", {
      cls: "clickable-icon wm-icon-button",
      attr: { type: "button", "aria-label": "\u5207\u6362\u5B9E\u65F6\u7EDF\u8BA1\u680F" }
    });
    this.registerDomEvent(this.statsToggleButton, "click", () => {
      this.statsPanelVisible = !this.statsPanelVisible;
      this.plugin.settings.showStatsPanel = this.statsPanelVisible;
      this.applyPanelLayout();
      void this.plugin.saveSettings();
    });
    const exitButton = rightGroup.createEl("button", {
      cls: "wm-toolbar-button wm-exit-button",
      text: "\u9000\u51FA",
      attr: { type: "button", "aria-label": "\u9000\u51FA Workbench" }
    });
    this.registerDomEvent(exitButton, "click", () => {
      void this.exitWorkbench();
    });
  }
  renderChapterSidebar() {
    this.chapterListEl.empty();
    const headerEl = this.chapterListEl.createDiv({ cls: "wm-sidebar-header" });
    headerEl.createEl("h3", { text: "\u7AE0\u8282\u76EE\u5F55" });
    const refreshButton = headerEl.createEl("button", {
      cls: "clickable-icon",
      attr: { type: "button", "aria-label": "\u5237\u65B0\u7AE0\u8282\u5217\u8868" }
    });
    (0, import_obsidian3.setIcon)(refreshButton, "refresh-cw");
    this.registerDomEvent(refreshButton, "click", () => this.refreshChapterList());
    this.chapterListBodyEl = this.chapterListEl.createDiv({ cls: "wm-chapter-list" });
    this.renderChapterItems();
  }
  renderStatsPane() {
    this.statsEl.empty();
    this.pluginBoxBodyEl = this.statsEl.createDiv({ cls: "wm-sidebar-section wm-plugin-box" });
    this.renderPluginBox();
    const headerEl = this.statsEl.createDiv({ cls: "wm-sidebar-header wm-stats-header" });
    headerEl.createEl("h3", { text: "\u5B9E\u65F6\u7EDF\u8BA1" });
    const hideButton = headerEl.createEl("button", {
      cls: "wm-pill-button",
      text: "\u9690\u85CF",
      attr: { type: "button" }
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
  renderPluginBox() {
    this.pluginBoxBodyEl.empty();
    this.pluginBoxBodyEl.createEl("h3", { text: "\u63D2\u4EF6\u7BB1", cls: "wm-plugin-box-title" });
    if (this.activePluginTool === "random") {
      this.renderRandomNameTool();
      return;
    }
    if (this.activePluginTool === "time-machine") {
      this.renderTimeMachineTool();
      return;
    }
    const menu = this.pluginBoxBodyEl.createDiv({ cls: "wm-plugin-icon-menu" });
    this.createPluginIcon(menu, "dice", "\u968F\u673A\u53D6\u540D", () => {
      this.activePluginTool = "random";
      this.renderPluginBox();
    });
    this.createPluginIcon(menu, "history", "\u65F6\u5149\u673A", () => {
      this.activePluginTool = "time-machine";
      this.renderPluginBox();
    });
  }
  createPluginIcon(parent, icon, label, onClick) {
    const button = parent.createEl("button", {
      cls: "wm-plugin-icon-button",
      attr: { type: "button", "aria-label": label }
    });
    const iconEl = button.createSpan({ cls: "wm-plugin-icon" });
    (0, import_obsidian3.setIcon)(iconEl, icon);
    button.createSpan({ cls: "wm-plugin-icon-label", text: label });
    this.registerDomEvent(button, "click", onClick);
  }
  renderToolHeader(parent, title) {
    const header = parent.createDiv({ cls: "wm-tool-header" });
    const backButton = header.createEl("button", {
      cls: "wm-mini-button",
      text: "\u2190 \u8FD4\u56DE",
      attr: { type: "button" }
    });
    header.createEl("h4", { text: title });
    this.registerDomEvent(backButton, "click", () => {
      this.activePluginTool = null;
      this.renderPluginBox();
    });
  }
  renderRandomNameTool() {
    const panel = this.pluginBoxBodyEl.createDiv({ cls: "wm-tool-panel" });
    this.renderToolHeader(panel, "\u968F\u673A\u53D6\u540D");
    const controls = panel.createDiv({ cls: "wm-random-controls" });
    const targetSelect = this.createLabeledSelect(controls, "\u7C7B\u578B", [
      ["person", "\u4EBA\u540D"],
      ["place", "\u5730\u540D"]
    ]);
    targetSelect.value = this.randomNameOptions.target;
    const languageSelect = this.createLabeledSelect(controls, "\u4EBA\u540D", [
      ["chinese", "\u4E2D\u6587"],
      ["english", "\u82F1\u6587"]
    ]);
    languageSelect.value = this.randomNameOptions.personLanguage;
    const lengthSelect = this.createLabeledSelect(controls, "\u5B57\u6570", [
      ["2", "\u4E8C\u5B57\u540D"],
      ["3", "\u4E09\u5B57\u540D"]
    ]);
    lengthSelect.value = String(this.randomNameOptions.chineseNameLength);
    const placeSelect = this.createLabeledSelect(controls, "\u5730\u540D", [
      ["ancient", "\u53E4\u4EE3"],
      ["modern", "\u73B0\u4EE3"]
    ]);
    placeSelect.value = this.randomNameOptions.placeStyle;
    const generateButton = panel.createEl("button", {
      cls: "wm-toolbar-button wm-primary-button",
      text: "\u751F\u6210\u968F\u673A\u540D\u79F0",
      attr: { type: "button" }
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
          attr: { type: "button", title: "\u70B9\u51FB\u63D2\u5165\u5230\u6B63\u6587" }
        });
        this.registerDomEvent(item, "click", () => this.insertTextAtCursor(name));
      });
    };
    const updateOptions = () => {
      this.randomNameOptions = {
        target: targetSelect.value === "place" ? "place" : "person",
        personLanguage: languageSelect.value === "english" ? "english" : "chinese",
        chineseNameLength: lengthSelect.value === "3" ? 3 : 2,
        placeStyle: placeSelect.value === "modern" ? "modern" : "ancient"
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
  renderTimeMachineTool() {
    const panel = this.pluginBoxBodyEl.createDiv({ cls: "wm-tool-panel" });
    this.renderToolHeader(panel, "\u65F6\u5149\u673A");
    panel.createDiv({ cls: "wm-plugin-panel-hint", text: "\u81EA\u52A8\u5907\u4EFD\uFF1A\u6BCF\u65E5 1 \u4EFD + \u6BCF\u65B0\u589E\u7EA6 500 \u5B57\u4E14\u95F4\u9694 2 \u5206\u949F\uFF1B\u6BCF\u7AE0\u4FDD\u7559\u6700\u8FD1 30 \u4EFD\u81EA\u52A8\u5907\u4EFD\uFF0C\u624B\u52A8\u5907\u4EFD\u6C38\u4E45\u4FDD\u7559\u3002" });
    const snapshotNowButton = panel.createEl("button", {
      cls: "wm-toolbar-button wm-primary-button",
      text: "\u7ACB\u5373\u4FDD\u5B58\u7248\u672C",
      attr: { type: "button" }
    });
    this.registerDomEvent(snapshotNowButton, "click", () => {
      void this.saveManualTimeMachineSnapshot();
    });
    this.timeMachineListEl = panel.createDiv({ cls: "wm-time-machine-list" });
    this.timeMachineDiffEl = panel.createDiv({ cls: "wm-time-machine-diff" });
    this.renderTimeMachineSnapshots();
  }
  createLabeledSelect(parent, label, options) {
    const wrapper = parent.createDiv({ cls: "wm-random-control" });
    wrapper.createEl("span", { text: label });
    const select = wrapper.createEl("select", { cls: "wm-select wm-select-small" });
    options.forEach(([value, text]) => {
      select.createEl("option", { value, text });
    });
    return select;
  }
  attachEditorEvents() {
    this.registerDomEvent(this.editorEl, "input", () => {
      this.handleEditorMutation();
    });
    this.registerDomEvent(this.editorEl, "keydown", (event) => {
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
  attachResizerEvents() {
    this.registerDomEvent(this.leftResizerEl, "pointerdown", (event) => {
      this.startResize("left", event);
    });
    this.registerDomEvent(this.rightResizerEl, "pointerdown", (event) => {
      this.startResize("right", event);
    });
  }
  registerSessionTicker() {
    this.registerInterval(
      window.setInterval(() => {
        if (!this.file) {
          return;
        }
        this.updateSessionDurations(Date.now());
        this.updateStats();
      }, 1e3)
    );
  }
  handleEditorMutation() {
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
  keepCursorInComfortZone() {
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
  normalizeEditorDisplay() {
    const cursor = this.editorEl.selectionStart ?? 0;
    const currentValue = this.editorEl.value;
    const formatted = formatEditorDisplayTextWithCursor(currentValue, cursor);
    if (formatted.value === currentValue) {
      return;
    }
    this.editorEl.value = formatted.value;
    this.editorEl.setSelectionRange(formatted.cursor, formatted.cursor);
  }
  insertIndentedLineBreak() {
    const selectionStart = this.editorEl.selectionStart ?? 0;
    const selectionEnd = this.editorEl.selectionEnd ?? 0;
    const value = this.editorEl.value;
    const insertion = `
${PARAGRAPH_INDENT}`;
    const nextValue = `${value.slice(0, selectionStart)}${insertion}${value.slice(selectionEnd)}`;
    const nextCursor = selectionStart + insertion.length;
    this.editorEl.value = nextValue;
    this.editorEl.focus();
    this.editorEl.setSelectionRange(nextCursor, nextCursor);
    this.handleEditorMutation();
  }
  async applyCommand(command) {
    const selectionStart = this.editorEl.selectionStart ?? 0;
    const selectionEnd = this.editorEl.selectionEnd ?? 0;
    const value = this.editorEl.value;
    const result = command === "bold" ? wrapSelection(value, selectionStart, selectionEnd, "**") : command === "italic" ? wrapSelection(value, selectionStart, selectionEnd, "*") : command === "heading" ? prefixSelectedLines(value, selectionStart, selectionEnd, "# ") : command === "quote" ? prefixSelectedLines(value, selectionStart, selectionEnd, "> ") : prefixSelectedLines(value, selectionStart, selectionEnd, "- ");
    this.editorEl.value = result.value;
    this.editorEl.focus();
    this.editorEl.setSelectionRange(result.selectionStart, result.selectionEnd);
    this.handleEditorMutation();
  }
  createToolbarButton(parent, label, ariaLabel, onClick) {
    const button = parent.createEl("button", {
      cls: "wm-toolbar-button",
      text: label,
      attr: { type: "button", "aria-label": ariaLabel }
    });
    this.registerDomEvent(button, "click", onClick);
  }
  insertTextAtCursor(text) {
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
  async refreshTimeMachineSnapshots() {
    this.timeMachineSnapshots = await listTimeMachineSnapshots(this.plugin, this.file);
    this.renderTimeMachineSnapshots();
  }
  renderTimeMachineSnapshots() {
    if (!this.timeMachineListEl) {
      return;
    }
    this.timeMachineListEl.empty();
    if (this.timeMachineDiffEl) {
      this.timeMachineDiffEl.empty();
    }
    if (!this.file) {
      this.timeMachineListEl.createDiv({ cls: "wm-empty-sidebar-state", text: "\u9009\u62E9\u7AE0\u8282\u540E\u5F00\u59CB\u8BB0\u5F55\u5386\u53F2\u7248\u672C\u3002" });
      return;
    }
    if (this.timeMachineSnapshots.length === 0) {
      this.timeMachineListEl.createDiv({ cls: "wm-empty-sidebar-state", text: "\u6682\u65F6\u6CA1\u6709\u5386\u53F2\u7248\u672C\u3002\u6BCF\u5929\u4F1A\u4FDD\u7559 1 \u4EFD\u65E5\u5907\u4EFD\uFF0C\u5199\u4F5C\u65B0\u589E\u7EA6 500 \u5B57\u4E14\u95F4\u9694 2 \u5206\u949F\u540E\u4F1A\u81EA\u52A8\u4FDD\u5B58\u3002" });
      return;
    }
    this.timeMachineSnapshots.forEach((snapshot) => {
      const item = this.timeMachineListEl.createDiv({ cls: "wm-time-machine-item" });
      item.createDiv({ cls: "wm-time-machine-title", text: `${snapshotKindLabel(snapshot.kind)} \xB7 ${new Date(snapshot.createdAt).toLocaleString()}` });
      item.createDiv({ cls: "wm-time-machine-meta", text: `${snapshot.wordCount || "\u672A\u77E5"} \u5B57 \xB7 ${snapshot.path}` });
      const actions = item.createDiv({ cls: "wm-time-machine-actions" });
      const diffButton = actions.createEl("button", {
        cls: "wm-mini-button",
        text: "\u67E5\u770B\u5220\u6539",
        attr: { type: "button" }
      });
      const restoreButton = actions.createEl("button", {
        cls: "wm-mini-button wm-danger-button",
        text: "\u6062\u590D",
        attr: { type: "button" }
      });
      this.registerDomEvent(diffButton, "click", () => {
        void this.showSnapshotDiff(snapshot);
      });
      this.registerDomEvent(restoreButton, "click", () => {
        void this.restoreSnapshot(snapshot);
      });
    });
  }
  async showSnapshotDiff(snapshot) {
    if (!this.timeMachineDiffEl) {
      return;
    }
    const snapshotFile = this.app.vault.getAbstractFileByPath(snapshot.path);
    if (!(snapshotFile instanceof import_obsidian3.TFile)) {
      new import_obsidian3.Notice("\u8FD9\u4E2A\u5386\u53F2\u7248\u672C\u6587\u4EF6\u4E0D\u5B58\u5728\u3002\u53EF\u80FD\u5DF2\u88AB\u79FB\u52A8\u6216\u5220\u9664\u3002");
      await this.refreshTimeMachineSnapshots();
      return;
    }
    const diff = await buildSnapshotDiff(this.plugin, snapshotFile, getPlainEditorText(this.editorEl.value));
    this.renderSnapshotDiff(diff);
  }
  renderSnapshotDiff(diff) {
    this.timeMachineDiffEl.empty();
    this.timeMachineDiffEl.createDiv({ cls: "wm-time-machine-diff-title", text: "\u5F53\u524D\u7248\u672C\u76F8\u5BF9\u5386\u53F2\u7248\u672C\u7684\u5220\u6539" });
    const visibleDiff = diff.filter((line) => line.kind !== "same" || line.text.trim()).slice(0, 160);
    visibleDiff.forEach((line) => {
      this.timeMachineDiffEl.createDiv({ cls: `wm-diff-line wm-diff-${line.kind}`, text: `${diffPrefix(line.kind)} ${line.text}` });
    });
    if (visibleDiff.length === 0) {
      this.timeMachineDiffEl.createDiv({ cls: "wm-empty-sidebar-state", text: "\u6CA1\u6709\u53D1\u73B0\u6587\u672C\u5DEE\u5F02\u3002" });
    }
  }
  async restoreSnapshot(snapshot) {
    const snapshotFile = this.app.vault.getAbstractFileByPath(snapshot.path);
    if (!(snapshotFile instanceof import_obsidian3.TFile)) {
      new import_obsidian3.Notice("\u8FD9\u4E2A\u5386\u53F2\u7248\u672C\u6587\u4EF6\u4E0D\u5B58\u5728\u3002\u53EF\u80FD\u5DF2\u88AB\u79FB\u52A8\u6216\u5220\u9664\u3002");
      await this.refreshTimeMachineSnapshots();
      return;
    }
    const snapshotText = await this.app.vault.cachedRead(snapshotFile);
    await this.saveManualTimeMachineSnapshot(false);
    this.editorEl.value = formatEditorDisplayText(snapshotText);
    this.handleEditorMutation();
    this.lastSnapshotWords = countWritingCharacters(snapshotText);
    this.lastSnapshotCreatedAt = Date.now();
    new import_obsidian3.Notice("\u5DF2\u6062\u590D\u5230\u6240\u9009\u65F6\u5149\u673A\u7248\u672C\u3002\u6062\u590D\u524D\u7684\u5F53\u524D\u5185\u5BB9\u5DF2\u53E6\u5B58\u4E3A\u5907\u4EFD\u3002");
    await this.refreshTimeMachineSnapshots();
  }
  async saveManualTimeMachineSnapshot(showNotice = true) {
    if (!this.file) {
      new import_obsidian3.Notice("\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A Markdown \u7AE0\u8282\u3002");
      return;
    }
    const text = getPlainEditorText(this.editorEl.value);
    const snapshot = await createTimeMachineSnapshot(this.plugin, this.file, text, { kind: "manual" });
    this.lastSnapshotWords = snapshot.wordCount;
    this.lastSnapshotCreatedAt = snapshot.createdAt;
    if (showNotice) {
      new import_obsidian3.Notice("\u5DF2\u4FDD\u5B58\u4E00\u4E2A\u65F6\u5149\u673A\u7248\u672C\u3002");
    }
    await this.refreshTimeMachineSnapshots();
  }
  async maybeSaveTimeMachineSnapshot() {
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
        this.lastSnapshotCreatedAt
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
  refreshChapterList() {
    this.chapters = this.getScopedFiles().sort((left, right) => this.compareFiles(left, right, this.plugin.settings));
    this.renderChapterItems();
  }
  renderChapterItems() {
    if (!this.chapterListBodyEl) {
      return;
    }
    this.chapterListBodyEl.empty();
    if (this.chapters.length === 0) {
      this.chapterListBodyEl.createDiv({
        cls: "wm-empty-sidebar-state",
        text: this.scopeMode === "folder" ? "\u5F53\u524D\u6587\u4EF6\u5939\u4E0B\u6CA1\u6709 Markdown \u6587\u4EF6\u3002" : "\u5F53\u524D\u4EC5\u663E\u793A\u8FD9\u7BC7\u7B14\u8BB0\u3002"
      });
      return;
    }
    this.chapters.forEach((file) => {
      const item = this.chapterListBodyEl.createEl("button", {
        cls: `wm-chapter-item${file.path === this.selectedChapterPath ? " is-active" : ""}`,
        attr: { type: "button" }
      });
      item.createDiv({ cls: "wm-chapter-title", text: file.basename });
      this.registerDomEvent(item, "click", () => {
        void this.openChapter(file);
      });
    });
  }
  updateStats() {
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
  buildStatsRows(stats, sessionStats) {
    return [
      [
        ["\u672C\u6B21\u5B57\u6570", String(sessionStats.sessionWords)],
        ["\u8F93\u5165\u901F\u5EA6\uFF08\u5B57/\u5206\uFF09", String(sessionStats.typingSpeed)]
      ],
      [
        ["\u7801\u5B57\u65F6\u95F4", formatDuration(sessionStats.writingTimeMs)],
        ["\u7A7A\u95F2\u65F6\u95F4", formatDuration(sessionStats.idleTimeMs)]
      ],
      [
        ["\u603B\u5B57\u7B26\u6570", String(stats.characters)],
        ["\u53BB\u7A7A\u683C\u5B57\u7B26\u6570", String(stats.charactersNoSpaces)]
      ]
    ];
  }
  applyTypography() {
    if (!this.rootEl) {
      return;
    }
    this.rootEl.style.setProperty("--wm-font-family", this.activeFontFamily);
    this.rootEl.style.setProperty("--wm-font-size", `${this.activeFontSizePx}px`);
    this.rootEl.style.setProperty("--wm-line-height", String(this.activeLineHeight));
  }
  applyPanelLayout() {
    if (!this.rootEl || !this.bodyEl) {
      return;
    }
    this.rootEl.style.setProperty("--wm-left-width", `${clampPanelWidth(this.chapterPanelWidth)}px`);
    this.rootEl.style.setProperty("--wm-right-width", `${clampPanelWidth(this.statsPanelWidth)}px`);
    this.bodyEl.toggleClass("wm-left-hidden", !this.chapterPanelVisible);
    this.bodyEl.toggleClass("wm-right-hidden", !this.statsPanelVisible);
    if (this.chapterToggleButton) {
      this.chapterToggleButton.empty();
      (0, import_obsidian3.setIcon)(this.chapterToggleButton, this.chapterPanelVisible ? "panel-left-close" : "panel-left-open");
    }
    if (this.statsToggleButton) {
      this.statsToggleButton.empty();
      (0, import_obsidian3.setIcon)(this.statsToggleButton, this.statsPanelVisible ? "panel-right-close" : "panel-right-open");
    }
  }
  updateHeaderState() {
    this.emptyStateEl?.toggleClass("is-hidden", Boolean(this.file));
    this.leaf.setEphemeralState({ file: this.file?.path ?? this.selectedChapterPath ?? null });
  }
  renderEmptyEditorState(message) {
    this.emptyStateEl.empty();
    this.emptyStateEl.createDiv({ cls: "wm-empty-title", text: "Watermelon Workbench" });
    this.emptyStateEl.createDiv({ cls: "wm-empty-copy", text: message });
    this.updateHeaderState();
  }
  registerVaultEvents() {
    this.registerEvent(this.app.vault.on("create", (file) => this.handleVaultRefresh(file)));
    this.registerEvent(this.app.vault.on("delete", (file) => this.handleVaultRefresh(file)));
    this.registerEvent(this.app.vault.on("rename", (file) => this.handleVaultRefresh(file)));
    this.registerEvent(this.app.vault.on("modify", (file) => this.handleVaultRefresh(file)));
  }
  handleVaultRefresh(file) {
    if (!(file instanceof import_obsidian3.TFile) || file.extension !== "md") {
      return;
    }
    if (!this.isFileInCurrentScope(file)) {
      return;
    }
    this.refreshChapterList();
  }
  isFileInCurrentScope(file) {
    if (!this.scopeRootPath) {
      return false;
    }
    if (this.scopeMode === "single-file") {
      return file.path === this.scopeRootPath;
    }
    return file.parent?.path === this.scopeRootPath;
  }
  getScopedFiles() {
    if (!this.scopeRootPath) {
      return [];
    }
    const markdownFiles = this.app.vault.getMarkdownFiles();
    if (this.scopeMode === "single-file") {
      const file = this.app.vault.getAbstractFileByPath(this.scopeRootPath);
      return file instanceof import_obsidian3.TFile ? [file] : [];
    }
    return markdownFiles.filter((file) => file.parent?.path === this.scopeRootPath);
  }
  startResize(side, event) {
    event.preventDefault();
    const bodyRect = this.bodyEl.getBoundingClientRect();
    const onMove = (moveEvent) => {
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
  resetSessionStats(text) {
    const baselineWords = computeWritingStats(text).words;
    this.sessionState = {
      baselineWords,
      writingTimeMs: 0,
      idleTimeMs: 0,
      lastActivityAt: null,
      lastTickAt: Date.now()
    };
  }
  updateSessionDurations(now) {
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
  getSessionStats(currentWords) {
    const sessionWords = Math.max(0, currentWords - this.sessionState.baselineWords);
    const writingTimeMs = this.sessionState.writingTimeMs;
    const idleTimeMs = this.sessionState.idleTimeMs;
    return {
      sessionWords,
      typingSpeed: computeTypingSpeed(sessionWords, writingTimeMs),
      writingTimeMs,
      idleTimeMs
    };
  }
  compareFiles(left, right, settings) {
    if (settings.chapterSort === "modified") {
      return right.stat.mtime - left.stat.mtime || left.path.localeCompare(right.path, void 0, { numeric: true });
    }
    return left.path.localeCompare(right.path, void 0, { numeric: true });
  }
};
function prettyFontName(fontFamily) {
  const firstPart = fontFamily.split(",")[0]?.trim() ?? fontFamily;
  return firstPart.replace(/^"|"$/g, "");
}
function normalizeLegacyParagraphSpacing(text) {
  return text.split("\n").map((line) => line.startsWith(PARAGRAPH_INDENT) ? line.slice(PARAGRAPH_INDENT.length) : line).join("\n").replace(/\n{3,}/g, "\n\n");
}
function formatEditorDisplayText(text) {
  const originalLines = text.split("\n");
  return getPlainEditorText(text).split("\n").map((line, index) => {
    if (line.trim()) {
      return `${PARAGRAPH_INDENT}${line}`;
    }
    const originalLine = originalLines[index] ?? "";
    return originalLine.startsWith(PARAGRAPH_INDENT) ? PARAGRAPH_INDENT : line;
  }).join("\n");
}
function formatEditorDisplayTextWithCursor(text, cursor) {
  const before = text.slice(0, cursor);
  const formattedBefore = formatEditorDisplayText(before);
  const formattedAll = formatEditorDisplayText(text);
  return {
    value: formattedAll,
    cursor: Math.min(formattedAll.length, formattedBefore.length)
  };
}
function getPlainEditorText(text) {
  return text.split("\n").map((line) => line.startsWith(PARAGRAPH_INDENT) ? line.slice(PARAGRAPH_INDENT.length) : line).join("\n");
}
function getMarkdownSiblings(currentFile, allMarkdownFiles) {
  const parentPath = currentFile.parent?.path;
  if (!parentPath) {
    return [currentFile];
  }
  return allMarkdownFiles.filter((file) => file.parent?.path === parentPath);
}
function clampPanelWidth(width) {
  return Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, Math.round(width)));
}
function diffPrefix(kind) {
  if (kind === "added") {
    return "+";
  }
  if (kind === "removed") {
    return "-";
  }
  return " ";
}
function snapshotKindLabel(kind) {
  if (kind === "auto") {
    return "\u81EA\u52A8";
  }
  if (kind === "daily") {
    return "\u6BCF\u65E5";
  }
  if (kind === "manual") {
    return "\u624B\u52A8";
  }
  return "\u65E7\u7248";
}
function createEmptySessionState() {
  return {
    baselineWords: 0,
    writingTimeMs: 0,
    idleTimeMs: 0,
    lastActivityAt: null,
    lastTickAt: Date.now()
  };
}
async function openWorkbenchLeaf(plugin, file) {
  const { workspace } = plugin.app;
  const activeLeaf = workspace.activeLeaf;
  const existingLeaf = workspace.getLeavesOfType(WORKBENCH_VIEW_TYPE)[0];
  const leaf = existingLeaf ?? activeLeaf ?? workspace.getLeaf(false);
  await leaf.setViewState({
    type: WORKBENCH_VIEW_TYPE,
    active: true,
    state: file ? { file: file.path } : void 0
  });
  const view = leaf.view;
  if (!(view instanceof WorkbenchView)) {
    new import_obsidian3.Notice("Unable to open the Watermelon workbench view.");
    return;
  }
  await view.refreshFromSettings();
  const targetFile = file ?? view.getInitialFileForOpen();
  if (!targetFile) {
    view.renderEmptyEditorState("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A Markdown \u7B14\u8BB0\uFF0C\u518D\u8FDB\u5165 Workbench\u3002");
    return;
  }
  view.configureScopeFromFile(targetFile, true);
  view.refreshChapterList();
  await view.openChapter(targetFile);
}

// src/main.ts
var WatermelonWorkbenchPlugin = class extends import_obsidian4.Plugin {
  async onload() {
    await this.loadSettings();
    this.registerView(WORKBENCH_VIEW_TYPE, (leaf) => new WorkbenchView(leaf, this));
    this.addCommand({
      id: "open-writing-workbench",
      name: "Open writing workbench",
      callback: async () => {
        await openWorkbenchLeaf(this, this.app.workspace.getActiveFile());
      }
    });
    this.addCommand({
      id: "open-current-file-in-writing-workbench",
      name: "Open current file in writing workbench",
      checkCallback: (checking) => {
        const activeFile = this.app.workspace.getActiveFile();
        if (!(activeFile instanceof import_obsidian4.TFile) || activeFile.extension !== "md") {
          return false;
        }
        if (!checking) {
          void openWorkbenchLeaf(this, activeFile);
        }
        return true;
      }
    });
    this.addCommand({
      id: "exit-writing-workbench",
      name: "Exit writing workbench",
      checkCallback: (checking) => {
        const view = this.getAnyWorkbenchView();
        if (!view) {
          return false;
        }
        if (!checking) {
          void view.exitWorkbench();
        }
        return true;
      }
    });
    this.addRibbonIcon("notebook-pen", "Open Watermelon Workbench", async () => {
      await openWorkbenchLeaf(this, this.app.workspace.getActiveFile());
    });
    this.addSettingTab(new WatermelonSettingTab(this));
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
    for (const leaf of this.app.workspace.getLeavesOfType(WORKBENCH_VIEW_TYPE)) {
      const view = leaf.view;
      if (view instanceof WorkbenchView) {
        await view.refreshFromSettings();
      }
    }
  }
  getAnyWorkbenchView() {
    for (const leaf of this.app.workspace.getLeavesOfType(WORKBENCH_VIEW_TYPE)) {
      if (leaf.view instanceof WorkbenchView) {
        return leaf.view;
      }
    }
    return null;
  }
};
