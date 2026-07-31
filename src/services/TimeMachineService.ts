import { normalizePath, TFile, TFolder } from "obsidian";
import type WatermelonWorkbenchPlugin from "../main";

export interface TimeMachineSnapshot {
  path: string;
  createdAt: number;
  wordCount: number;
  originalPath: string;
}

export interface SnapshotDiffLine {
  kind: "same" | "added" | "removed";
  text: string;
}

const BACKUP_FOLDER_NAME = "备份";
const SNAPSHOT_INTERVAL_WORDS = 100;

export async function maybeCreateTimeMachineSnapshot(
  plugin: WatermelonWorkbenchPlugin,
  file: TFile | null,
  currentText: string,
  lastSnapshotWords: number,
): Promise<number> {
  if (!file) {
    return lastSnapshotWords;
  }

  const currentWords = countWritingCharacters(currentText);
  if (currentWords <= 0 || currentWords - lastSnapshotWords < SNAPSHOT_INTERVAL_WORDS) {
    return lastSnapshotWords;
  }

  await createTimeMachineSnapshot(plugin, file, currentText, currentWords);
  return currentWords;
}

export async function createTimeMachineSnapshot(
  plugin: WatermelonWorkbenchPlugin,
  file: TFile,
  text: string,
  wordCount = countWritingCharacters(text),
): Promise<TimeMachineSnapshot> {
  const folderPath = getBackupFolderPath(file);
  await ensureFolder(plugin, folderPath);

  const createdAt = Date.now();
  const snapshotPath = await getUniqueSnapshotPath(plugin, folderPath, file, createdAt, wordCount);
  await plugin.app.vault.create(snapshotPath, text);

  return {
    path: snapshotPath,
    createdAt,
    wordCount,
    originalPath: file.path,
  };
}

export function getBackupFolderPath(file: TFile): string {
  const parentPath = file.parent?.path;
  return normalizePath(parentPath && parentPath !== "/" ? `${parentPath}/${BACKUP_FOLDER_NAME}` : BACKUP_FOLDER_NAME);
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

  const folder = plugin.app.vault.getAbstractFileByPath(getBackupFolderPath(file));
  if (!(folder instanceof TFolder)) {
    return [];
  }

  const prefix = `${sanitizeFileName(file.basename)}__`;
  const suffix = ".md";
  return folder.children
    .filter((child): child is TFile => child instanceof TFile && child.name.startsWith(prefix) && child.name.endsWith(suffix))
    .map((snapshot) => ({
      path: snapshot.path,
      createdAt: snapshot.stat.ctime,
      wordCount: readWordCountFromSnapshotName(snapshot.basename),
      originalPath: file.path,
    }))
    .sort((left, right) => right.createdAt - left.createdAt);
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

async function ensureFolder(plugin: WatermelonWorkbenchPlugin, folderPath: string): Promise<void> {
  const existing = plugin.app.vault.getAbstractFileByPath(folderPath);
  if (existing) {
    return;
  }

  await plugin.app.vault.createFolder(folderPath);
}

async function getUniqueSnapshotPath(
  plugin: WatermelonWorkbenchPlugin,
  folderPath: string,
  file: TFile,
  createdAt: number,
  wordCount: number,
): Promise<string> {
  const timestamp = formatTimestamp(createdAt);
  const baseName = `${sanitizeFileName(file.basename)}__${timestamp}__${wordCount}字`;
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

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "_");
}
