// helpers for lesson notes
//
// Notes written with the editor are stored as (sanitised) HTML in Note.Content. 

export const MAX_NOTE_TEXT = 20_000; // characters of readable text
export const MAX_NOTE_HTML = 120_000; // characters of stored HTML, formatting included

export const isHtmlNote = (content: string) => /^\s*<(p|h[1-6]|ul|ol|blockquote|hr)[\s>/]/i.test(content);

export const escapeHtml = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Turns an old plain-text note into HTML so it can be opened in the editor. */
export function plainToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** What to load into the editor for a stored note. */
export const editorHtml = (content: string | null) => (!content ? "" : isHtmlNote(content) ? content : plainToHtml(content));

/** A starting layout for lesson notes: topic, objectives in bold bullets, key points, reflection. */
export const NOTES_OUTLINE = `<h1>Topic title</h1>
<h2>Learning objectives</h2>
<p>By the end of this lesson you will be able to:</p>
<ul>
<li><p><strong>First objective:</strong> what students will understand or do</p></li>
<li><p><strong>Second objective:</strong> what students will understand or do</p></li>
<li><p><strong>Third objective:</strong> what students will understand or do</p></li>
</ul>
<h2>Key points</h2>
<ul data-variant="dash">
<li><p>Point one</p></li>
<li><p>Point two</p></li>
</ul>
<h2>Scripture</h2>
<blockquote><p>Verse or passage, with the reference</p></blockquote>
<h2>Reflection questions</h2>
<ol>
<li><p>Question one</p></li>
<li><p>Question two</p></li>
</ol>`;
