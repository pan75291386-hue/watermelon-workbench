import { normalizePath, TFile, TFolder } from "obsidian";
import type WatermelonWorkbenchPlugin from "../main";

export type TimeMachineSnapshotKind = "auto" | "daily" | "manual" | "legacy";

export interface TimeMachineSnapshot {
  path: string;
  createdAt: number;
  wordCount: number;
  originalPath: string;
  kind: TimeMachineSnapshotKind;
}

export interface TimeMachineSnapshotState {
  wordCount: number;
  createdAt: number;
  created: boolean;
}

export interface SnapshotDiffLine {
  kind: "same" | "added" | "removed";
  text: string;
}

const BACKUP_FOLDER_NAME = "备份";
const AUTO_SNAPSHOT_INTERVAL_WORDS = 500;
const AUTO_SNAPSHOT_MIN_INTERVAL_MS = 2 * 60 * 1000;
const MAX_AUTO_SNAPSHOTS_PER_FILE = 30;

export async function maybeCreateTimeMachineSnapshot(
  plugin: WatermelonWorkbenchPlugin,
  file: TFile | null,
  currentText: string,
  lastSnapshotWords: number,
  lastSnapshotCreatedAt: number,
): Promise<TimeMachineSnapshotState> {
  const currentState = {
    wordCount: lastSnapshotWords,
    createdAt: lastSnapshotCreatedAt,
    created: false,
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
  if (!(await hasDailySnapshotForDate(plugin, file, today))) {
    const dailySnapshot = await createTimeMachineSnapshot(plugin, file, currentText, {
      kind: "daily",
      wordCount: currentWords,
      createdAt: now,
    });
    return {
      wordCount: dailySnapshot.wordCount,
      createdAt: dailySnapshot.createdAt,
      created: true,
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
    createdAt: now,
  });
  await pruneOldAutoSnapshots(plugin, file);

  return {
    wordCount: autoSnapshot.wordCount,
    createdAt: autoSnapshot.createdAt,
    created: true,
  };
}

export async function createTimeMachineSnapshot(
  plugin: WatermelonWorkbenchPlugin,
  file: TFile,
  text: string,
  options: {
    kind?: Exclude<TimeMachineSnapshotKind, "legacy">;
    wordCount?: number;
    createdAt?: number;
  } = {},
): Promise<TimeMachineSnapshot> {
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
    kind,
  };
}

export function getBackupFolderPath(file: TFile): string {
  const parentPath = file.parent?.path;
  return normalizePath(parentPath && parentPath !== "/" ? `${parentPath}/${BACKUP_FOLDER_NAME}` : BACKUP_FOLDER_NAME);
}

export function getChapterBackupFolderPath(file: TFile): string {
  return normalizePath(`${getBackupFolderPath(file)}/${sanitizeFileName(file.basename)}`);
}

export function countWritingCharacters(text: string): number {
  return Array.from(text.replace(/\s+/g, "")).length;
}

export async function listTimeMachineSnapshots(
  plugin: WatermelonWorkbenchPlugin,
  file: TFile | null,
): Promise<TimeMachineSnapshot[]> {
  if (!file) {
    return [];
  }

  return [...listLegacySnapshots(plugin, file), ...listChapterSnapshots(plugin, file)].sort(
    (left, right) => right.createdAt - left.createdAt,
  );
}

export async function buildSnapshotDiff(
  plugin: WatermelonWorkbenchPlugin,
  snapshot: TFile,
  currentText: string,
): Promise<SnapshotDiffLine[]> {
  const snapshotText = await plugin.app.vault.cachedRead(snapshot);
  return diffLines(snapshotText, currentText);
}

export function diffLines(previousText: string, currentText: string): SnapshotDiffLine[] {
  const previousLines = previousText.split("\n");
  const currentLines = currentText.split("\n");
  const rows = previousLines.length + 1;
  const columns = currentLines.length + 1;
  const table: number[][] = Array.from({ length: rows }, () => Array.from({ length: columns }, () => 0));

  for (let row = previousLines.length - 1; row >= 0; row -= 1) {
    for (let column = currentLines.length - 1; column >= 0; column -= 1) {
      table[row]![column] =
        previousLines[row] === currentLines[column]
          ? table[row + 1]![column + 1]! + 1
          : Math.max(table[row + 1]![column]!, table[row]![column + 1]!);
    }
  }

  const result: SnapshotDiffLine[] = [];
  let row = 0;
  let column = 0;

  while (row < previousLines.length && column < currentLines.length) {
    if (previousLines[row] === currentLines[column]) {
      result.push({ kind: "same", text: previousLines[row]! });
      row += 1;
      column += 1;
    } else if (table[row + 1]![column]! >= table[row]![column + 1]!) {
      result.push({ kind: "removed", text: previousLines[row]! });
      row += 1;
    } else {
      result.push({ kind: "added", text: currentLines[column]! });
      column += 1;
    }
  }

  while (row < previousLines.length) {
    result.push({ kind: "removed", text: previousLines[row]! });
    row += 1;
  }

  while (column < currentLines.length) {
    result.push({ kind: "added", text: currentLines[column]! });
    column += 1;
  }

  return result;
}

async function ensureChapterBackupFolder(plugin: WatermelonWorkbenchPlugin, file: TFile): Promise<string> {
  const rootFolderPath = getBackupFolderPath(file);
  await ensureFolder(plugin, rootFolderPath);

  const chapterFolderPath = getChapterBackupFolderPath(file);
  await ensureFolder(plugin, chapterFolderPath);
  return chapterFolderPath;
}

async function ensureFolder(plugin: WatermelonWorkbenchPlugin, folderPath: string): Promise<void> {
  const existing = plugin.app.vault.getAbstractFileByPath(folderPath);
  if (existing) {
    return;
  }

  await plugin.app.vault.createFolder(folderPath);
}

function listLegacySnapshots(plugin: WatermelonWorkbenchPlugin, file: TFile): TimeMachineSnapshot[] {
  const folder = plugin.app.vault.getAbstractFileByPath(getBackupFolderPath(file));
  if (!(folder instanceof TFolder)) {
    return [];
  }

  const prefix = `${sanitizeFileName(file.basename)}__`;
  return folder.children
    .filter((child): child is TFile => child instanceof TFile && child.name.startsWith(prefix) && child.name.endsWith(".md"))
    .map((snapshot) => ({
      path: snapshot.path,
      createdAt: snapshot.stat.ctime,
      wordCount: readWordCountFromSnapshotName(snapshot.basename),
      originalPath: file.path,
      kind: "legacy",
    }));
}

function listChapterSnapshots(plugin: WatermelonWorkbenchPlugin, file: TFile): TimeMachineSnapshot[] {
  const folder = plugin.app.vault.getAbstractFileByPath(getChapterBackupFolderPath(file));
  if (!(folder instanceof TFolder)) {
    return [];
  }

  return folder.children
    .filter((child): child is TFile => child instanceof TFile && child.extension === "md")
    .map((snapshot) => ({
      path: snapshot.path,
      createdAt: snapshot.stat.ctime,
      wordCount: readWordCountFromSnapshotName(snapshot.basename),
      originalPath: file.path,
      kind: readSnapshotKindFromName(snapshot.basename),
    }));
}

async function hasDailySnapshotForDate(plugin: WatermelonWorkbenchPlugin, file: TFile, dateStamp: string): Promise<boolean> {
  const folder = plugin.app.vault.getAbstractFileByPath(getChapterBackupFolderPath(file));
  if (!(folder instanceof TFolder)) {
    return false;
  }

  return folder.children.some(
    (child) => child instanceof TFile && child.basename.startsWith(`daily__${dateStamp}__`) && child.extension === "md",
  );
}

async function pruneOldAutoSnapshots(plugin: WatermelonWorkbenchPlugin, file: TFile): Promise<void> {
  const folder = plugin.app.vault.getAbstractFileByPath(getChapterBackupFolderPath(file));
  if (!(folder instanceof TFolder)) {
    return;
  }

  const autoSnapshots = folder.children
    .filter((child): child is TFile => child instanceof TFile && child.basename.startsWith("auto__") && child.extension === "md")
    .sort((left, right) => right.stat.ctime - left.stat.ctime);

  const expiredSnapshots = autoSnapshots.slice(MAX_AUTO_SNAPSHOTS_PER_FILE);
  for (const snapshot of expiredSnapshots) {
    await plugin.app.vault.delete(snapshot);
  }
}

async function getUniqueSnapshotPath(
  plugin: WatermelonWorkbenchPlugin,
  folderPath: string,
  kind: Exclude<TimeMachineSnapshotKind, "legacy">,
  createdAt: number,
  wordCount: number,
): Promise<string> {
  const timestamp = kind === "daily" ? formatDateStamp(createdAt) : formatTimestamp(createdAt);
  const baseName = `${kind}__${timestamp}__${wordCount}字`;
  let snapshotPath = normalizePath(`${folderPath}/${baseName}.md`);
  let counter = 2;

  while (plugin.app.vault.getAbstractFileByPath(snapshotPath)) {
    snapshotPath = normalizePath(`${folderPath}/${baseName}-${counter}.md`);
    counter += 1;
  }

  return snapshotPath;
}

function readWordCountFromSnapshotName(name: string): number {
  const match = name.match(/__(\d+)字(?:-\d+)?$/);
  return match ? Number(match[1]) : 0;
}

function readSnapshotKindFromName(name: string): TimeMachineSnapshotKind {
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

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function formatDateStamp(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "_");
}
