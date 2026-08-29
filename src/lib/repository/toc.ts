/* Table-of-contents generation for tool README pages (ported from the live
   site's utils/toc.ts). Extracts H2/H3/H4 headings, builds a hierarchy, and
   produces anchor IDs that the markdown renderer applies to headings. */

export interface TocItem {
  id: string;
  text: string;
  level: number; // 2 | 3 | 4
  children?: TocItem[];
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* Strip inline markdown so heading text + IDs are clean and consistent. */
export function cleanHeading(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

/* The anchor id for a raw heading line's text (matches TOC + renderer). */
export function headingId(rawText: string): string {
  return slugify(cleanHeading(rawText));
}

export function extractHeadings(content: string): TocItem[] {
  const lines = content.split("\n");
  const flat: TocItem[] = [];
  let inCode = false;

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;

    let level: number | null = null;
    let raw = "";
    if (line.startsWith("## ")) {
      level = 2;
      raw = line.slice(3);
    } else if (line.startsWith("### ")) {
      level = 3;
      raw = line.slice(4);
    } else if (line.startsWith("#### ")) {
      level = 4;
      raw = line.slice(5);
    }
    if (!level) continue;
    const text = cleanHeading(raw);
    if (!text) continue;
    flat.push({ id: slugify(text), text, level });
  }

  return buildHierarchy(flat);
}

function buildHierarchy(headings: TocItem[]): TocItem[] {
  const result: TocItem[] = [];
  const stack: { item: TocItem; level: number }[] = [];
  for (const h of headings) {
    while (stack.length > 0 && stack[stack.length - 1].level >= h.level) stack.pop();
    if (stack.length === 0) {
      result.push(h);
    } else {
      const parent = stack[stack.length - 1].item;
      (parent.children ||= []).push(h);
    }
    stack.push({ item: h, level: h.level });
  }
  return result;
}

export function flattenToc(items: TocItem[]): TocItem[] {
  const out: TocItem[] = [];
  const walk = (list: TocItem[]) => {
    for (const it of list) {
      out.push(it);
      if (it.children) walk(it.children);
    }
  };
  walk(items);
  return out;
}

export function shouldShowToc(items: TocItem[]): boolean {
  return flattenToc(items).length >= 3;
}

export function generateTocSchema(items: TocItem[], pageUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Table of Contents",
    itemListElement: flattenToc(items).map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.text,
      url: `${pageUrl}#${item.id}`,
    })),
  };
}
