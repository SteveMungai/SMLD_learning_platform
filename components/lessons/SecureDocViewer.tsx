"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { FileText, Lock, Minus, Plus, X } from "lucide-react";
import { colors } from "./shared";


const ZOOM_STEP = 0.25;

function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, label: string, dpr: number) {
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = "#374151";
  ctx.font = `${14 * dpr}px sans-serif`;
  ctx.rotate(-Math.PI / 6);
  for (let y = -h; y < h * 2; y += 150 * dpr) {
    for (let x = -w; x < w * 2; x += 340 * dpr) ctx.fillText(label, x, y);
  }
  ctx.restore();
}

function PageCanvas({ doc, pageNumber, width, zoom, label }: { doc: PDFDocumentProxy; pageNumber: number; width: number; zoom: number; label: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  // Draw a page only when it is near the screen, so a long document opens quickly.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true); }, { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || width <= 0) return;
    let cancelled = false;
    let task: RenderTask | null = null;
    (async () => {
      try {
        const page = await doc.getPage(pageNumber);
        const base = page.getViewport({ scale: 1 });
        const cssScale = (width / base.width) * zoom;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: cssScale * dpr });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        setSize({ w: Math.floor(viewport.width / dpr), h: Math.floor(viewport.height / dpr) });
        task = page.render({ canvas, viewport });
        await task.promise;
        const ctx = canvas.getContext("2d");
        if (!cancelled && ctx) drawWatermark(ctx, canvas.width, canvas.height, label, dpr);
      } catch {
        /* a render that was cancelled by a zoom change throws; nothing to do */
      }
    })();
    return () => { cancelled = true; task?.cancel(); };
  }, [visible, doc, pageNumber, width, zoom, label]);

  return (
    <div ref={wrapRef} className="mx-auto bg-white shadow-sm" style={{ width: size?.w ?? width * zoom, height: size?.h ?? Math.round(width * zoom * 1.3) }}>
      <canvas ref={canvasRef} role="img" aria-label={`Page ${pageNumber}`} style={{ display: "block", width: size?.w, height: size?.h }} />
    </div>
  );
}

function ViewerBody({ noteId, label, onClose }: { noteId: string; label: string; onClose: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const taskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [width, setWidth] = useState(0);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const res = await fetch(`/api/materials/${noteId}/view`, { headers: { "x-doc-viewer": "1" }, cache: "no-store", credentials: "same-origin" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const task = pdfjs.getDocument({ data: new Uint8Array(await res.arrayBuffer()), standardFontDataUrl: "/standard_fonts/" });
        taskRef.current = task;
        const loaded = await task.promise;
        if (cancelled) return void task.destroy();
        setDoc(loaded);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => { cancelled = true; void taskRef.current?.destroy(); taskRef.current = null; };
  }, [noteId]);

  // Pages fit the width of the box, on any screen size.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(0, Math.floor(entry.contentRect.width - 16))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [status]);

  return (
    <div
      className="secure-doc select-none rounded-lg overflow-hidden mt-3"
      style={{ border: `0.5px solid ${colors.border}`, WebkitTouchCallout: "none" }}
      tabIndex={0}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && ["s", "p", "c", "a", "u"].includes(e.key.toLowerCase())) e.preventDefault(); }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-gray-50" style={{ borderBottom: `0.5px solid ${colors.border}` }}>
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-600"><Lock size={13} aria-hidden="true" /> Read on screen only{doc ? ` · ${doc.numPages} page${doc.numPages === 1 ? "" : "s"}` : ""}</span>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Zoom out" disabled={zoom <= 0.5} onClick={() => setZoom((z) => Math.max(0.5, z - ZOOM_STEP))} className="w-10 h-10 sm:w-9 sm:h-9 inline-flex items-center justify-center rounded-md hover:bg-gray-200 disabled:opacity-40"><Minus size={16} /></button>
          <span className="text-xs w-10 text-center text-gray-600" aria-live="polite">{Math.round(zoom * 100)}%</span>
          <button type="button" aria-label="Zoom in" disabled={zoom >= 2.5} onClick={() => setZoom((z) => Math.min(2.5, z + ZOOM_STEP))} className="w-10 h-10 sm:w-9 sm:h-9 inline-flex items-center justify-center rounded-md hover:bg-gray-200 disabled:opacity-40"><Plus size={16} /></button>
          <button type="button" aria-label="Close document" onClick={onClose} className="w-10 h-10 sm:w-9 sm:h-9 inline-flex items-center justify-center rounded-md hover:bg-gray-200"><X size={16} /></button>
        </div>
      </div>
      <div ref={scrollRef} className="overflow-auto bg-gray-200 p-2" style={{ maxHeight: "75vh" }}>
        {status === "loading" && <p role="status" className="py-16 text-center text-sm text-gray-600">Opening document…</p>}
        {status === "error" && <p role="alert" className="py-16 text-center text-sm" style={{ color: "#b91c1c" }}>We couldn&apos;t open this document. Check your connection and try again.</p>}
        {status === "ready" && doc && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: doc.numPages }, (_, i) => <PageCanvas key={i} doc={doc} pageNumber={i + 1} width={width} zoom={zoom} label={label} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SecureDocViewer({ noteId, fileName, sizeKB, label }: { noteId: string; fileName: string; sizeKB: number; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-2.5 rounded-lg px-3 min-h-11 text-sm text-gray-800 hover:bg-gray-50 transition-colors max-w-full"
        style={{ border: `0.5px solid ${colors.border}` }}
      >
        <FileText size={16} className="text-gray-500 shrink-0" aria-hidden="true" />
        <span className="truncate">{open ? "Hide document" : "View document"}: {fileName}</span>
        <span className="text-xs text-gray-400 shrink-0">{sizeKB} KB</span>
      </button>
      {open && <ViewerBody noteId={noteId} label={label} onClose={() => setOpen(false)} />}
    </div>
  );
}
