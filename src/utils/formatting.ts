export interface TextTransformResult {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

export function wrapSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  wrapper: string,
): TextTransformResult {
  const selectedText = value.slice(selectionStart, selectionEnd);
  const replacement = `${wrapper}${selectedText}${wrapper}`;
  const nextValue = `${value.slice(0, selectionStart)}${replacement}${value.slice(selectionEnd)}`;
  const cursorStart = selectionStart + wrapper.length;
  const cursorEnd = cursorStart + selectedText.length;

  return {
    value: nextValue,
    selectionStart: cursorStart,
    selectionEnd: cursorEnd,
  };
}

export function prefixSelectedLines(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
): TextTransformResult {
  const lineStart = value.lastIndexOf("\n", Math.max(0, selectionStart - 1)) + 1;
  const lineEndIndex = value.indexOf("\n", selectionEnd);
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
  const block = value.slice(lineStart, lineEnd);
  const transformedBlock = block
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
  const nextValue = `${value.slice(0, lineStart)}${transformedBlock}${value.slice(lineEnd)}`;
  const delta = transformedBlock.length - block.length;

  return {
    value: nextValue,
    selectionStart: selectionStart + prefix.length,
    selectionEnd: selectionEnd + delta,
  };
}
