"use client";

import { useRef } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { FontSize, TextStyle } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { BulletList } from "@tiptap/extension-list";
import {
  AlignCenter, AlignLeft, Bold, Heading1, Heading2, Heading3, Highlighter, Italic, LayoutTemplate,
  Link2, List, ListOrdered, Minus, Quote, Redo2, RemoveFormatting, Underline, Undo2,
} from "lucide-react";
import { MAX_NOTE_TEXT, NOTES_OUTLINE } from "@/lib/notes-shared";

// Bullet list that can also be a dash list (– item). Saved as <ul data-variant="dash">.
const DashableBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      variant: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-variant"),
        renderHTML: (attrs: { variant?: string | null }) => (attrs.variant ? { "data-variant": attrs.variant } : {}),
      },
    };
  },
});

const SIZES = [
  ["Small", "14px"],
  ["Normal", ""],
  ["Large", "20px"],
  ["Extra large", "24px"],
  ["Huge", "32px"],
] as const;

const BORDER = "0.5px solid #e5e7eb";

function Btn({ label, active, disabled, onClick, children }: {
  label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active ?? undefined}
      disabled={disabled}
      // Keep the text selection in the editor while a toolbar button is pressed.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="inline-flex items-center justify-center min-w-10 h-10 sm:min-w-9 sm:h-9 px-2 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40"
      style={{ background: active ? "#fee2e2" : undefined, color: active ? "#991b1b" : undefined }}
    >
      {children}
    </button>
  );
}

const Divider = () => <span aria-hidden="true" className="hidden sm:block w-px h-6 mx-1" style={{ background: "#e5e7eb" }} />;

function Toolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h1: e.isActive("heading", { level: 1 }),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      highlight: e.isActive("highlight"),
      bullets: e.isActive("bulletList") && !e.isActive("bulletList", { variant: "dash" }),
      dashes: e.isActive("bulletList", { variant: "dash" }),
      numbers: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      center: e.isActive({ textAlign: "center" }),
      size: (e.getAttributes("textStyle").fontSize as string | undefined) ?? "",
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const c = () => editor.chain().focus();

  const setLink = () => {
    const previous = (editor.getAttributes("link").href as string | undefined) ?? "";
    const url = window.prompt("Link address (start with https://). Leave empty to remove the link.", previous);
    if (url === null) return;
    if (url.trim() === "") return void c().extendMarkRange("link").unsetLink().run();
    if (!/^(https?:\/\/|mailto:)/i.test(url.trim())) return void window.alert("The link must start with https:// or http://");
    c().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const toggleDash = () => {
    if (s.dashes) return void c().toggleBulletList().run();
    if (!editor.isActive("bulletList")) c().toggleBulletList().run();
    c().updateAttributes("bulletList", { variant: "dash" }).run();
  };
  const toggleBullets = () => {
    if (s.bullets) return void c().toggleBulletList().run();
    if (!editor.isActive("bulletList")) c().toggleBulletList().run();
    c().updateAttributes("bulletList", { variant: null }).run();
  };

  return (
    <div role="toolbar" aria-label="Text formatting" className="flex flex-wrap items-center gap-0.5 px-2 py-1.5" style={{ borderBottom: BORDER, background: "#f9fafb" }}>
      <Btn label="Heading 1 (largest)" active={s.h1} onClick={() => c().toggleHeading({ level: 1 }).run()}><Heading1 size={17} /></Btn>
      <Btn label="Heading 2" active={s.h2} onClick={() => c().toggleHeading({ level: 2 }).run()}><Heading2 size={17} /></Btn>
      <Btn label="Heading 3" active={s.h3} onClick={() => c().toggleHeading({ level: 3 }).run()}><Heading3 size={17} /></Btn>
      <select
        aria-label="Font size"
        value={SIZES.some(([, v]) => v === s.size) ? s.size : ""}
        onChange={(e) => (e.target.value ? c().setFontSize(e.target.value).run() : c().unsetFontSize().run())}
        className="h-10 sm:h-9 rounded-md px-2 text-sm bg-white text-gray-800"
        style={{ border: BORDER }}
      >
        {SIZES.map(([label, value]) => <option key={label} value={value}>{label}</option>)}
      </select>
      <Divider />
      <Btn label="Bold" active={s.bold} onClick={() => c().toggleBold().run()}><Bold size={16} /></Btn>
      <Btn label="Italic" active={s.italic} onClick={() => c().toggleItalic().run()}><Italic size={16} /></Btn>
      <Btn label="Underline" active={s.underline} onClick={() => c().toggleUnderline().run()}><Underline size={16} /></Btn>
      <Btn label="Highlight" active={s.highlight} onClick={() => c().toggleHighlight().run()}><Highlighter size={16} /></Btn>
      <Divider />
      <Btn label="Bullet list" active={s.bullets} onClick={toggleBullets}><List size={17} /></Btn>
      <Btn label="Dash list" active={s.dashes} onClick={toggleDash}><span aria-hidden="true" className="text-base leading-none">–</span></Btn>
      <Btn label="Numbered list" active={s.numbers} onClick={() => c().toggleOrderedList().run()}><ListOrdered size={17} /></Btn>
      <Divider />
      <Btn label="Align left" active={!s.center} onClick={() => c().setTextAlign("left").run()}><AlignLeft size={16} /></Btn>
      <Btn label="Centre" active={s.center} onClick={() => c().setTextAlign("center").run()}><AlignCenter size={16} /></Btn>
      <Btn label="Quote or scripture" active={s.quote} onClick={() => c().toggleBlockquote().run()}><Quote size={16} /></Btn>
      <Btn label="Divider line" onClick={() => c().setHorizontalRule().run()}><Minus size={16} /></Btn>
      <Btn label="Link" active={s.link} onClick={setLink}><Link2 size={16} /></Btn>
      <Divider />
      <Btn label="Clear formatting" onClick={() => c().unsetAllMarks().clearNodes().unsetTextAlign().run()}><RemoveFormatting size={16} /></Btn>
      <Btn label="Undo" disabled={!s.canUndo} onClick={() => c().undo().run()}><Undo2 size={16} /></Btn>
      <Btn label="Redo" disabled={!s.canRedo} onClick={() => c().redo().run()}><Redo2 size={16} /></Btn>
      <Btn label="Insert a lesson outline (topic, objectives, key points)" onClick={() => c().insertContent(NOTES_OUTLINE).run()}><LayoutTemplate size={16} /></Btn>
    </div>
  );
}

/**
 * Rich text editor for lesson notes. `initialHtml` is read once when the editor mounts; give the
 * component a new `key` to load different content or to clear it. Output is HTML, which the server
 * sanitises again before saving.
 */
export default function RichTextEditor({ initialHtml, onChange }: { initialHtml: string; onChange: (html: string) => void }) {
  const countRef = useRef<HTMLSpanElement>(null);
  const editor = useEditor({
    immediatelyRender: false, // avoids a server/browser mismatch warning in Next.js
    content: initialHtml,
    extensions: [
      StarterKit.configure({
        bulletList: false,
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" } },
      }),
      DashableBulletList,
      TextStyle,
      FontSize,
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    editorProps: {
      attributes: {
        class: "note-content note-editor px-4 py-3 min-h-60 focus:outline-none",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "Notes text",
      },
    },
    onCreate: ({ editor: e }) => { if (countRef.current) countRef.current.textContent = String(e.getText().length); },
    onUpdate: ({ editor: e }) => {
      if (countRef.current) countRef.current.textContent = String(e.getText().length);
      onChange(e.isEmpty ? "" : e.getHTML());
    },
  });

  return (
    <div className="rounded-lg overflow-hidden bg-white" style={{ border: BORDER }}>
      {editor ? <Toolbar editor={editor} /> : <div className="h-12" style={{ borderBottom: BORDER, background: "#f9fafb" }} />}
      <EditorContent editor={editor} />
      <p className="px-4 py-1.5 text-xs flex justify-between gap-3" style={{ borderTop: BORDER, color: "#6b7280" }}>
        <span>Tip: select text, then use the buttons above. The last button inserts a ready-made lesson outline.</span>
        <span className="shrink-0"><span ref={countRef}>0</span> / {MAX_NOTE_TEXT.toLocaleString()}</span>
      </p>
    </div>
  );
}
