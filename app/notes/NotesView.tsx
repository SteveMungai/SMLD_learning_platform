"use client";

import { useState } from "react";

// --- Types ---
type UserRole = "INSTRUCTOR" | "STUDENT";

type Material = {
  id: string;
  name: string;
  type: "NOTES" | "ASSIGNMENT";
  url: string;
};

type Submission = {
  id: string;
  studentName: string;
  fileName: string;
  submittedAt: string;
};

type Week = {
  id: string;
  weekNumber: number;
  topic: string;
  description: string;
  materials: Material[];
  submissions: Submission[]; 
};

// --- Dummy Data ---
const DUMMY_WEEKS: Week[] = [
  {
    id: "w1",
    weekNumber: 1,
    topic: "Introduction to Application Architecture",
    description: "This week you will be introduced to basic server routing and ORM configurations.",
    materials: [{ id: "m1", name: "Week 1 Notes.pdf", type: "NOTES", url: "#" }],
    submissions: [{ id: "s1", studentName: "Sumeiya Hassan", fileName: "assignment_1_sumeiya.zip", submittedAt: "2026-09-02T10:00:00Z" }],
  },
  {
    id: "w2",
    weekNumber: 2,
    topic: "Database Schemas & ORMs",
    description: "This week you will dive deeper into database table specifications and relationships.",
    materials: [],
    submissions: [],
  },
];

// --- Components ---

export default function NotesPage() {
  const [role, setRole] = useState<UserRole>("STUDENT");
  const [weeks] = useState<Week[]>(DUMMY_WEEKS);

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900">
      {/* Role Switcher (For Development/Demo) */}
      <div className="mx-auto mb-8 flex max-w-4xl items-center justify-between rounded-lg bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold">Course Notes & Assignments</h1>
          <p className="text-sm text-gray-500">Currently viewing as: <strong className="text-blue-600">{role}</strong></p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setRole("STUDENT")} className={`rounded px-4 py-2 text-sm font-medium ${role === "STUDENT" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}>Student View</button>
          <button onClick={() => setRole("INSTRUCTOR")} className={`rounded px-4 py-2 text-sm font-medium ${role === "INSTRUCTOR" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}>Instructor View</button>
        </div>
      </div>

      {/* Week List */}
      <div className="mx-auto max-w-4xl space-y-4">
        {weeks.map((week) => (
          <WeekCard key={week.id} week={week} role={role} />
        ))}
      </div>
    </div>
  );
}

function WeekCard({ week, role }: { week: Week; role: UserRole }) {
  const notes = week.materials.filter((m) => m.type === "NOTES");
  const assignments = week.materials.filter((m) => m.type === "ASSIGNMENT");

  return (
    <div className="flex flex-col gap-4 rounded-md border border-gray-200 bg-white p-4 shadow-sm sm:flex-row">
      {/* Left side: Image Thumbnail mimicking image_f6bcdb.png */}
      <div className="h-32 w-48 shrink-0 overflow-hidden rounded-md bg-blue-50 flex items-center justify-center border border-gray-100">
        <span className="text-blue-300 font-bold text-xl tracking-widest uppercase">WEEK {week.weekNumber}</span>
      </div>

      {/* Right side: Content */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Week {week.weekNumber}: {week.topic || "[insert topic]"}</h2>
          
          {week.materials.length === 0 ? (
            <p className="mt-1 text-sm text-gray-400 italic">Content isn't available</p>
          ) : (
            <p className="mt-1 text-sm font-medium text-green-600">Materials available</p>
          )}
          
          <p className="mt-2 text-sm text-gray-600">{week.description}</p>
        </div>

        {/* Role-Specific Actions */}
        <div className="mt-4 border-t border-gray-100 pt-4">
          {role === "INSTRUCTOR" ? (
            <InstructorActions week={week} notes={notes} assignments={assignments} />
          ) : (
            <StudentActions week={week} notes={notes} assignments={assignments} />
          )}
        </div>
      </div>
    </div>
  );
}

function InstructorActions({ week, notes, assignments }: { week: Week; notes: Material[]; assignments: Material[] }) {
  const [showSubmissions, setShowSubmissions] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 rounded border border-dashed border-gray-300 bg-gray-50 p-3">
          <p className="mb-2 text-xs font-semibold text-gray-500 uppercase">Manage Notes</p>
          {notes.map(n => <div key={n.id} className="text-sm text-blue-600 hover:underline cursor-pointer">{n.name}</div>)}
          <button className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800">+ Upload Notes</button>
        </div>
        
        <div className="flex-1 rounded border border-dashed border-gray-300 bg-gray-50 p-3">
          <p className="mb-2 text-xs font-semibold text-gray-500 uppercase">Manage Assignments</p>
          {assignments.map(a => <div key={a.id} className="text-sm text-blue-600 hover:underline cursor-pointer">{a.name}</div>)}
          <button className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800">+ Upload Assignment</button>
        </div>
      </div>

      <div className="rounded bg-slate-50 p-3 border border-slate-200">
        <button 
          onClick={() => setShowSubmissions(!showSubmissions)}
          className="flex w-full items-center justify-between text-sm font-semibold text-slate-700"
        >
          <span>Student Submissions ({week.submissions.length})</span>
          <span>{showSubmissions ? "▲" : "▼"}</span>
        </button>
        
        {showSubmissions && (
          <ul className="mt-3 divide-y divide-slate-200 text-sm">
            {week.submissions.length === 0 && <li className="py-2 text-slate-500 italic">No submissions yet.</li>}
            {week.submissions.map(sub => (
              <li key={sub.id} className="flex justify-between py-2">
                <span className="font-medium text-slate-800">{sub.studentName}</span>
                <div className="flex items-center gap-3 text-slate-500">
                  <a href="#" className="text-blue-600 hover:underline">{sub.fileName}</a>
                  <span className="text-xs">{new Date(sub.submittedAt).toLocaleDateString()}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StudentActions({ week, notes, assignments }: { week: Week; notes: Material[]; assignments: Material[] }) {
  // Mock logic to check if current student submitted
  const hasSubmitted = week.submissions.length > 0; 

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <div className="flex-1 space-y-3">
        <div>
          <p className="mb-1 text-xs font-semibold text-gray-500 uppercase">Course Notes</p>
          {notes.length > 0 ? notes.map(n => (
            <a key={n.id} href={n.url} className="block text-sm text-blue-600 hover:underline">Download {n.name}</a>
          )) : <p className="text-sm text-gray-400 italic">No notes posted yet</p>}
        </div>
        
        <div>
          <p className="mb-1 text-xs font-semibold text-gray-500 uppercase">Assignment</p>
          {assignments.length > 0 ? assignments.map(a => (
            <a key={a.id} href={a.url} className="block text-sm text-blue-600 hover:underline">Download {a.name}</a>
          )) : <p className="text-sm text-gray-400 italic">No assignment posted yet</p>}
        </div>
      </div>

      <div className="flex-1 rounded border border-gray-200 bg-gray-50 p-4">
        <p className="mb-2 text-xs font-semibold text-gray-500 uppercase">Your Submission</p>
        {hasSubmitted ? (
          <div>
            <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 mb-2">Submitted</span>
            <p className="text-sm text-gray-600">Your assignment has been recorded.</p>
            <button className="mt-3 text-sm font-medium text-blue-600 hover:underline">Replace submission</button>
          </div>
        ) : (
          <div>
            <span className="inline-block rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800 mb-2">Pending</span>
            <div className="mt-2 flex items-center justify-center rounded border border-dashed border-gray-400 bg-white p-4">
              <button className="text-sm font-medium text-blue-600 hover:text-blue-800">Upload your work</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}