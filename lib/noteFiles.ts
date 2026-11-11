// Only PDFs are accepted: they are the one common document type that can be shown reliably on every
// phone and computer without letting the browser offer a download. Word and PowerPoint files should be
// exported to PDF first. The size limit comes from serverless hosting, which caps a request body at about
// 4.5 MB (the same reason submission attachments are limited).

export const MAX_NOTE_FILE_BYTES = 4 * 1024 * 1024;
export const NOTE_FILE_ACCEPT = "application/pdf,.pdf";
export const NOTE_FILE_HELP = "PDF only, up to 4 MB. Export Word or PowerPoint files to PDF first.";

/** Every PDF starts with "%PDF-". Checking this stops a renamed file of another type being stored. */
export const looksLikePdf = (bytes: Uint8Array): boolean =>
  bytes.length > 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;

export function checkNoteFile(file: { name: string; size: number }): string | null {
  if (!/\.pdf$/i.test(file.name)) return "Only PDF files can be attached. Export your document to PDF first.";
  if (file.size === 0) return "That file is empty.";
  if (file.size > MAX_NOTE_FILE_BYTES) return `That file is too large (${(file.size / 1048576).toFixed(1)} MB). The limit is 4 MB. Try compressing the PDF.`;
  return null;
}

/** "5 Nov 2026" in Nairobi time, for "Added ..." labels. Accepts a Date or an ISO string. */
export const formatDay = (d: Date | string): string =>
  new Intl.DateTimeFormat("en-KE", { timeZone: "Africa/Nairobi", day: "numeric", month: "short", year: "numeric" }).format(typeof d === "string" ? new Date(d) : d);
