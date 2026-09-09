"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Film,
  Presentation,
  Paperclip,
  Download,
  ClipboardList,
  Upload,
  CheckCircle2,
  ChevronDown,
  Lock,
} from "lucide-react";
import { Tag, colors } from "./shared";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

export interface MaterialItem {
  id: string;
  type: "VIDEO" | "SLIDES" | "NOTES" | "OTHER";
  title: string;
  fileUrl: string;
}

export interface AssignmentItem {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO — submissions lock after this instant
}

export interface MySubmission {
  fileName: string;
  submittedAt: string;
}

export interface StudentWeekData {
  id: string;
  weekNumber: number;
  topic: string;
  description?: string | null;
  leader?: string | null;
  passage?: string | null;
  materials: MaterialItem[];
  assignment?: AssignmentItem | null;
  mySubmission?: MySubmission | null;
}

const materialIcon: Record<MaterialItem["type"], LucideIcon> = {
  VIDEO: Film,
  SLIDES: Presentation,
  NOTES: FileText,
  OTHER: Paperclip,
};

export function StudentWeekCard({ week }: { week: StudentWeekData }) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const video = week.materials.find((m) => m.type === "VIDEO");
  const documents = week.materials.filter((m) => m.type !== "VIDEO");
  const embedUrl = video ? getYouTubeEmbedUrl(video.fileUrl) : null;
  const hasNotes = documents.length > 0;

  const isSubmitted = justSubmitted || !!week.mySubmission;
  const dueDate = week.assignment ? new Date(week.assignment.dueDate) : null;
  // NOTE: this only hides the UI — the actual submission endpoint must also
  // reject uploads once Date.now() > assignment.dueDate server-side.
  const isPastDue = !!dueDate && Date.now() > dueDate.getTime();

  return (
    <div className="grid grid-cols-[64px_1fr] sm:grid-cols-[80px_1fr] gap-x-4 sm:gap-x-6 py-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: colors.red }}>
          Week
        </p>
        <p
          className="text-3xl sm:text-4xl font-bold leading-none"
          style={{ fontFamily: "Georgia, serif", color: colors.black }}
        >
          {String(week.weekNumber).padStart(2, "0")}
        </p>
      </div>

      <button type="button" onClick={() => setOpen((v) => !v)} className="text-left">
        <div className="flex items-start justify-between gap-3">
          <h3
            className="text-xl sm:text-2xl font-bold text-gray-900"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {week.topic}
          </h3>
          <ChevronDown
            size={18}
            className={`mt-2 flex-shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          <Tag label={hasNotes ? "Notes" : "No notes yet"} tone={hasNotes ? "red" : "muted"} />
          {video && <Tag label="Video" tone="red" />}
          {week.assignment &&
            (isSubmitted ? (
              <Tag label="Submitted" tone="success" />
            ) : isPastDue ? (
              <Tag label="Past due" tone="red" />
            ) : (
              <Tag label="Assignment due" tone="black" />
            ))}
        </div>

        {week.description && (
          <p className="text-sm text-gray-500 mt-3 max-w-lg">{week.description}</p>
        )}

        {(week.leader || week.passage) && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs" style={{ color: colors.muted }}>
            {week.leader && (
              <span>
                Leader: <span className="text-gray-600">{week.leader}</span>
              </span>
            )}
            {week.passage && (
              <span>
                Passage: <span className="text-gray-600">{week.passage}</span>
              </span>
            )}
          </div>
        )}
      </button>

      {open && (
        <div className="col-start-2 mt-5 space-y-6">
          {/* Notes & materials */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
              Class materials
            </h4>

            {video && (
              <div className="mb-4">
                {embedUrl ? (
                  <div className="aspect-video rounded-md overflow-hidden">
                    <iframe src={embedUrl} className="w-full h-full" allowFullScreen />
                  </div>
                ) : (
                  <p className="text-sm text-red-600">This video link couldn&apos;t be loaded.</p>
                )}
              </div>
            )}

            {documents.length === 0 ? (
              <p className="text-sm text-gray-500">
                Your instructor hasn&apos;t uploaded notes for this week yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {documents.map((doc) => {
                  const Icon = materialIcon[doc.type];
                  return (
                    <li key={doc.id}>
                      <a
                        href={doc.fileUrl}
                        className="flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 hover:bg-gray-50 transition-colors group"
                        style={{ borderColor: colors.border }}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <Icon size={18} className="text-gray-500 flex-shrink-0" />
                          <span className="text-sm text-gray-800 truncate">{doc.title}</span>
                        </span>
                        <Download size={16} className="text-gray-400 group-hover:text-gray-900 flex-shrink-0" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Assignment */}
          {week.assignment && dueDate && (
            <section className="rounded-md p-4" style={{ backgroundColor: colors.sectionBg }}>
              <div className="flex items-start gap-2 mb-2">
                <ClipboardList size={18} style={{ color: colors.red }} className="mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{week.assignment.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Due{" "}
                    {dueDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}{" "}
                    at {dueDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4">{week.assignment.description}</p>

              {isSubmitted ? (
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: colors.success }}>
                  <CheckCircle2 size={16} />
                  Submitted
                  {fileName ? ` — ${fileName}` : week.mySubmission ? ` — ${week.mySubmission.fileName}` : ""}
                </div>
              ) : isPastDue ? (
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <Lock size={15} />
                  Submissions closed — the due date has passed.
                </div>
              ) : (
                <label
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white cursor-pointer transition-opacity hover:opacity-90"
                  style={{ backgroundColor: colors.black }}
                >
                  <Upload size={15} />
                  Submit assignment
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setFileName(f.name);
                        setJustSubmitted(true);
                      }
                    }}
                  />
                </label>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}