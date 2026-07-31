export interface WritingStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  paragraphs: number;
  headings: number;
  readingMinutes: number;
}

export interface WritingSessionStats {
  sessionWords: number;
  typingSpeed: number;
  writingTimeMs: number;
  idleTimeMs: number;
}

const CJK_CHAR_REGEX = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu;
const LATIN_WORD_REGEX = /[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g;
const HEADING_REGEX = /^#{1,6}\s+/gm;

export function computeWritingStats(text: string): WritingStats {
  const characters = Array.from(text).length;
  const charactersNoSpaces = Array.from(text.replace(/\s+/g, "")).length;
  const cjkMatches = text.match(CJK_CHAR_REGEX) ?? [];
  const latinMatches = text.match(LATIN_WORD_REGEX) ?? [];
  const paragraphs = text
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean).length;
  const headings = (text.match(HEADING_REGEX) ?? []).length;
  const words = cjkMatches.length + latinMatches.length;
  const readingMinutes = Math.max(1, Math.ceil(words / 300));

  return {
    words,
    characters,
    charactersNoSpaces,
    paragraphs,
    headings,
    readingMinutes,
  };
}

export function computeTypingSpeed(sessionWords: number, writingTimeMs: number): number {
  if (sessionWords <= 0 || writingTimeMs <= 0) {
    return 0;
  }

  return Math.round(sessionWords / (writingTimeMs / 60000));
}

export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}
