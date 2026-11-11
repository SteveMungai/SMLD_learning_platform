// Keeps the PDF viewer's support files in step with the installed pdfjs-dist version.
// Runs after every `npm install` (including on Vercel). 
//   - the standard fonts, for PDFs that don't embed their own.
import { copyFileSync, cpSync, existsSync, mkdirSync } from "node:fs";

const worker = "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs";
const fonts = "node_modules/pdfjs-dist/standard_fonts";
mkdirSync("public", { recursive: true });
if (existsSync(worker)) copyFileSync(worker, "public/pdf.worker.min.mjs");
if (existsSync(fonts)) cpSync(fonts, "public/standard_fonts", { recursive: true });
