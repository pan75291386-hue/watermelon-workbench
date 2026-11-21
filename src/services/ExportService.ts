export interface ExportChapter {
  title: string;
  markdown: string;
}

interface ExportLine {
  text: string;
  headingLevel: number;
}

/** Export readable UTF-8 text without the workbench's visual paragraph indents. */
export function buildTxtExport(chapters: ExportChapter[]): string {
  return chapters.map((chapter) => {
    const lines = parseChapter(chapter.markdown).map((line) => line.text);
    return chapters.length > 1
      ? [chapter.title, "", ...lines].join("\n").trimEnd()
      : lines.join("\n");
  }).join("\n\n\n");
}

/** A small, dependency-free OOXML package that opens as a real .docx file. */
export function buildDocxExport(chapters: ExportChapter[]): ArrayBuffer {
  const paragraphs: string[] = [];

  chapters.forEach((chapter, chapterIndex) => {
    if (chapters.length > 1) {
      paragraphs.push(paragraph(chapter.title, 1, chapterIndex > 0));
    }
    for (const line of parseChapter(chapter.markdown)) {
      paragraphs.push(paragraph(line.text, line.headingLevel));
    }
  });

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
    `<w:body>${paragraphs.join("")}` +
    `<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>` +
    `</w:body></w:document>`;

  return createZip([
    {
      name: "[Content_Types].xml",
      text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
        `</Types>`,
    },
    {
      name: "_rels/.rels",
      text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
        `</Relationships>`,
    },
    { name: "word/document.xml", text: documentXml },
  ]);
}

function parseChapter(markdown: string): ExportLine[] {
  const source = markdown.replace(/\r\n?/g, "\n");
  const withoutFrontmatter = source.replace(/^---\n[\s\S]*?\n---(?:\n|$)/, "");
  const lines: ExportLine[] = [];
  let inCodeBlock = false;

  for (const sourceLine of withoutFrontmatter.split("\n")) {
    if (/^\s*(```|~~~)/.test(sourceLine)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) {
      lines.push({ text: sourceLine, headingLevel: 0 });
      continue;
    }

    const heading = sourceLine.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      lines.push({ text: plainInline(heading[2] ?? ""), headingLevel: heading[1]?.length ?? 1 });
      continue;
    }

    let line = sourceLine.replace(/^\s{0,3}>\s?/, "");
    line = line.replace(/^(\s*)[-*+]\s+/, "$1• ");
    lines.push({ text: plainInline(line), headingLevel: 0 });
  }
  return lines;
}

function plainInline(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\[\[([^\]]+)\]\]/g, (_match, link: string) => link.split("|").pop() ?? link)
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\\([\\`*_{}\[\]()#+.!>~-])/g, "$1");
}

function paragraph(text: string, headingLevel: number, pageBreak = false): string {
  const headingSize = [0, 32, 28, 26, 24, 22, 22][headingLevel] ?? 22;
  const properties = headingLevel || pageBreak
    ? `<w:pPr>${headingLevel ? "<w:keepNext/>" : ""}${pageBreak ? "<w:pageBreakBefore/>" : ""}` +
      (headingLevel ? `<w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="${headingLevel - 1}"/>` : "") +
      `</w:pPr>`
    : "";
  const runProperties = headingLevel ? `<w:rPr><w:b/><w:sz w:val="${headingSize}"/></w:rPr>` : "";
  return `<w:p>${properties}<w:r>${runProperties}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function createZip(files: { name: string; text: string }[]): ArrayBuffer {
  const encoder = new TextEncoder();
  const entries = files.map(({ name, text }) => {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(text);
    return { nameBytes, data, checksum: crc32(data) };
  });
  const localSize = entries.reduce((size, entry) => size + 30 + entry.nameBytes.length + entry.data.length, 0);
  const centralSize = entries.reduce((size, entry) => size + 46 + entry.nameBytes.length, 0);
  const bytes = new Uint8Array(localSize + centralSize + 22);
  const view = new DataView(bytes.buffer);
  let offset = 0;
  const offsets: number[] = [];

  entries.forEach((entry) => {
    offsets.push(offset);
    view.setUint32(offset, 0x04034b50, true);
    view.setUint16(offset + 4, 20, true);
    view.setUint16(offset + 6, 0x0800, true);
    view.setUint32(offset + 14, entry.checksum, true);
    view.setUint32(offset + 18, entry.data.length, true);
    view.setUint32(offset + 22, entry.data.length, true);
    view.setUint16(offset + 26, entry.nameBytes.length, true);
    offset += 30;
    bytes.set(entry.nameBytes, offset);
    offset += entry.nameBytes.length;
    bytes.set(entry.data, offset);
    offset += entry.data.length;
  });

  const centralOffset = offset;
  entries.forEach((entry, index) => {
    view.setUint32(offset, 0x02014b50, true);
    view.setUint16(offset + 4, 20, true);
    view.setUint16(offset + 6, 20, true);
    view.setUint16(offset + 8, 0x0800, true);
    view.setUint32(offset + 16, entry.checksum, true);
    view.setUint32(offset + 20, entry.data.length, true);
    view.setUint32(offset + 24, entry.data.length, true);
    view.setUint16(offset + 28, entry.nameBytes.length, true);
    view.setUint32(offset + 42, offsets[index] ?? 0, true);
    offset += 46;
    bytes.set(entry.nameBytes, offset);
    offset += entry.nameBytes.length;
  });

  view.setUint32(offset, 0x06054b50, true);
  view.setUint16(offset + 8, entries.length, true);
  view.setUint16(offset + 10, entries.length, true);
  view.setUint32(offset + 12, centralSize, true);
  view.setUint32(offset + 16, centralOffset, true);
  return bytes.buffer;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
