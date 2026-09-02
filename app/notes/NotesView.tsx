"use client";

import { useState } from "react";
import type { Week, Material } from "@prisma/client";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

type WeekWithMaterials = Week & { materials: Material[] };

function MaterialIcon({ type }: { type: string }) {
  if (type === "VIDEO") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path d="M4 2.5v9l8-4.5-8-4.5z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3 1.5h5.5L11 4v8.5a.5.5 0 01-.5.5h-7a.5.5 0 01-.5-.5v-10a.5.5 0 01.5-.5z"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <path d="M8.5 1.5V4H11" stroke="currentColor" strokeWidth="1" fill="none" />
    </svg>
  );
}

const TYPE_LABEL: Record<string, string> = {
  VIDEO: "Watch the session",
  SLIDES: "Slides",
  NOTES: "Notes",
  OTHER: "Material",
};

function WeekContent({ week }: { week: WeekWithMaterials }) {
  const video = week.materials.find((m) => m.type === "VIDEO");
  const documents = week.materials.filter((m) => m.type !== "VIDEO");
  const embedUrl = video ? getYouTubeEmbedUrl(video.fileUrl) : null;

  const dateLabel = week.sessionDate
    ? new Date(week.sessionDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div>
      <div className="mb-6">
        <h2
          className="font-serif text-2xl sm:text-3xl"
          style={{ color: "var(--paper)" }}
        >
          {week.topic}
        </h2>
        {dateLabel && (
          <p className="mt-1 text-xs tracking-wide" style={{ color: "var(--muted)" }}>
            {dateLabel}
          </p>
        )}
        {week.description && (
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {week.description}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {video &&
          (embedUrl ? (
            <div
              className="aspect-video overflow-hidden rounded-sm"
              style={{ border: "1px solid var(--panel-line)" }}
            >
              <iframe
                src={embedUrl}
                className="h-full w-full"
                allowFullScreen
                title={video.title}
              />
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--gold-dim)" }}>
              This session&apos;s video link couldn&apos;t be loaded.
            </p>
          ))}

        {documents.length > 0 && (
          <ul
            className="divide-y rounded-sm"
            style={{ borderColor: "var(--panel-line)" }}
          >
            {documents.map((doc) => (
              <li key={doc.id} style={{ borderColor: "var(--panel-line)" }}>
                <a
                  href={`/api/materials/${doc.id}/download`}
                  className="group/link flex items-center gap-3 py-3 text-sm transition-colors"
                  style={{ color: "var(--paper)" }}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: "var(--panel)",
                      color: "var(--gold-dim)",
                      border: "1px solid var(--panel-line)",
                    }}
                  >
                    <MaterialIcon type={doc.type} />
                  </span>
                  <span className="group-hover/link:underline">
                    {TYPE_LABEL[doc.type] ?? "Material"}
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    {doc.title}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}

        {!video && documents.length === 0 && (
          <p className="text-sm italic" style={{ color: "var(--muted)" }}>
            Nothing has been posted for this week yet.
          </p>
        )}
      </div>
    </div>
  );
}

export function NotesView({ weeks }: { weeks: WeekWithMaterials[] }) {
  const [activeId, setActiveId] = useState(weeks[0]?.id);
  const activeWeek = weeks.find((w) => w.id === activeId) ?? weeks[0];

  return (
    <div>
      {/* Week selector row */}
      <div
        className="mb-10 flex gap-2 overflow-x-auto pb-2"
        role="tablist"
        aria-label="Select a week"
      >
        {weeks.map((week) => {
          const isActive = week.id === activeWeek?.id;
          return (
            <button
              key={week.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveId(week.id)}
              className="flex shrink-0 flex-col items-center gap-1.5 rounded-md px-4 py-2.5 text-left transition-colors"
              style={{
                background: isActive ? "var(--panel)" : "transparent",
                border: `1px solid ${isActive ? "var(--gold-dim)" : "var(--panel-line)"}`,
              }}
            >
              <span
                className="font-serif text-lg leading-none"
                style={{ color: isActive ? "var(--gold)" : "var(--paper)" }}
              >
                {week.weekNumber}
              </span>
              <span
                className="text-[10px] tracking-wide uppercase"
                style={{ color: "var(--muted)" }}
              >
                Week
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected week's content */}
      {activeWeek && <WeekContent week={activeWeek} />}
    </div>
  );
}