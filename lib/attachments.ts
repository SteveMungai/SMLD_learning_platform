// lib/attachments.ts
//
// Rules for files students attach to a submission. Pure TypeScript (no Node APIs) so the
// browser can pre-check files with exactly the same rules the server enforces.
//
// Files are stored in the database (AttachmentData) and served through
// /api/attachments/[id]. Limits are deliberately small: serverless hosts (e.g. Vercel)
// cap request bodies at ~4.5 MB. To allow bigger files, switch to direct-to-storage
// uploads (R2/S3 signed URLs) and keep only the link in Attachment.FileLink.

export const MAX_FILES = 5;
export const MAX_TOTAL_BYTES = 4 * 1024 * 1024; // all new files in one submit request

// Allowed types by extension. The server derives Content-Type from this table and never
// trusts the type the browser claims. No HTML/SVG/JS: those could run script when opened.
export const ALLOWED_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain; charset=utf-8",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export const ACCEPT_ATTR = Object.keys(ALLOWED_TYPES).map((e) => "." + e).join(",");

export const extOf = (name: string) => (name.split(".").pop() ?? "").toLowerCase();

export function cleanFileName(name: string) {
  // Drop any path, control characters and quotes; keep it a sane length.
  const base = name.split(/[\\/]/).pop() ?? "file";
  return base.replace(/[\u0000-\u001f"<>|:*?]/g, "").trim().slice(0, 150) || "file";
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Returns an error message, or null when the file is acceptable. */
export function checkFile(name: string, size: number): string | null {
  if (size <= 0) return `"${name}" is empty.`;
  if (!(extOf(name) in ALLOWED_TYPES)) {
    return `"${name}" isn't an allowed file type (PDF, Word, PowerPoint, Excel, text or image).`;
  }
  if (size > MAX_TOTAL_BYTES) return `"${name}" is too large (limit ${formatSize(MAX_TOTAL_BYTES)}).`;
  return null;
}

/** Cheap content sniffing so a renamed file can't masquerade as a different type (server-side). */
export function matchesSignature(ext: string, head: Uint8Array): boolean {
  const starts = (...bytes: number[]) => bytes.every((b, i) => head[i] === b);
  switch (ext) {
    case "pdf": return starts(0x25, 0x50, 0x44, 0x46); // %PDF
    case "png": return starts(0x89, 0x50, 0x4e, 0x47);
    case "jpg":
    case "jpeg": return starts(0xff, 0xd8, 0xff);
    case "webp": return starts(0x52, 0x49, 0x46, 0x46); // RIFF
    case "docx":
    case "pptx":
    case "xlsx": return starts(0x50, 0x4b); // zip container "PK"
    case "doc":
    case "ppt":
    case "xls": return starts(0xd0, 0xcf, 0x11, 0xe0); // OLE2
    default: return true; // txt: no signature
  }
}
