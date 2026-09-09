"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { InstructorWeekCard, type InstructorWeekData } from "./InstructorWeekCard";
import { colors } from "./shared";

export function InstructorWeekList({ initialWeeks }: { initialWeeks: InstructorWeekData[] }) {
  const [weeks, setWeeks] = useState(initialWeeks);
  const [showAddWeek, setShowAddWeek] = useState(false);
  const [topic, setTopic] = useState("");
  const [leader, setLeader] = useState("");
  const [passage, setPassage] = useState("");

  function addWeek() {
    if (!topic) return;
    const nextNumber = weeks.length ? Math.max(...weeks.map((w) => w.weekNumber)) + 1 : 1;
    setWeeks((w) => [
      ...w,
      {
        id: `tmp-${Date.now()}`,
        weekNumber: nextNumber,
        topic,
        leader: leader || null,
        passage: passage || null,
        materials: [],
        assignment: null,
        submissions: [],
      },
    ]);
    setTopic("");
    setLeader("");
    setPassage("");
    setShowAddWeek(false);
  }

  return (
    <>
      <div className="flex items-center justify-between py-6 border-b-2" style={{ borderColor: colors.black }}>
        <p className="text-sm text-gray-500">
          Tap a week to add materials · <span className="font-semibold text-gray-700">built for weekly updates</span>
        </p>
        <button
          type="button"
          onClick={() => setShowAddWeek((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold text-white flex-shrink-0"
          style={{ backgroundColor: colors.black }}
        >
          <Plus size={15} /> Add week
        </button>
      </div>

      {showAddWeek && (
        <div className="my-5 rounded-md p-4 space-y-3" style={{ backgroundColor: colors.sectionBg }}>
          <input
            placeholder="Topic, e.g. Walking in the Word"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: colors.border }}
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              placeholder="Leader"
              value={leader}
              onChange={(e) => setLeader(e.target.value)}
              className="flex-1 rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: colors.border }}
            />
            <input
              placeholder="Passage, e.g. John 1:1-18"
              value={passage}
              onChange={(e) => setPassage(e.target.value)}
              className="flex-1 rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: colors.border }}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addWeek}
              className="rounded-md px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: colors.red }}
            >
              Add week
            </button>
            <button type="button" onClick={() => setShowAddWeek(false)} className="text-sm text-gray-500">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="divide-y" style={{ borderColor: colors.border }}>
        {weeks.map((week) => (
          <InstructorWeekCard key={week.id} week={week} />
        ))}
      </div>
    </>
  );
}