import sanitizeHtml from "sanitize-html";
import { MAX_NOTE_HTML, MAX_NOTE_TEXT } from "@/lib/notes-shared";



const FONT_SIZES = [/^(12|14|16|18|20|24|28|32|36)px$/];
const ALIGNMENTS = [/^(left|center|right|justify)$/];

export function sanitizeNoteHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "h1", "h2", "h3", "strong", "b", "em", "i", "u", "s", "ul", "ol", "li", "blockquote", "hr", "a", "span", "mark"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      p: ["style"],
      h1: ["style"],
      h2: ["style"],
      h3: ["style"],
      span: ["style"],
      ul: ["data-variant"],
    },
    allowedStyles: { "*": { "font-size": FONT_SIZES, "text-align": ALIGNMENTS } },
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
    transformTags: {
      // Links always open in a new tab and never pass the page's identity on.
      a: (tagName, attribs) => ({ tagName, attribs: { href: attribs.href ?? "", target: "_blank", rel: "noopener noreferrer nofollow" } }),
      ul: (tagName, attribs) => {
        const kept: Record<string, string> = {};
        if (attribs["data-variant"] === "dash") kept["data-variant"] = "dash";
        return { tagName, attribs: kept };
      },
    },
  });
}

const textOf = (html: string) =>
  sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/&nbsp;|&#160;/g, " ").trim();

/** Cleans editor output for saving. Returns null content when nothing readable was written. */
export function prepareNoteContent(raw: string): { content: string | null; error?: string } {
  if (raw.length > MAX_NOTE_HTML * 2) return { content: null, error: "That is too long. Split it into two notes." };
  const clean = sanitizeNoteHtml(raw).trim();
  const text = textOf(clean);
  if (!text) return { content: null };
  if (text.length > MAX_NOTE_TEXT) return { content: null, error: `That's too long (${MAX_NOTE_TEXT.toLocaleString()} characters maximum). Split it into two notes.` };
  if (clean.length > MAX_NOTE_HTML) return { content: null, error: "There is too much formatting in this note. Try removing some, or split it into two notes." };
  return { content: clean };
}
