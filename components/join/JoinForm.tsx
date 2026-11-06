"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { joinWithCode } from "@/app/join/actions";

export default function JoinForm({ initialCode, previewName }: { initialCode: string; previewName: string | null }) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState<{ name: string; already: boolean } | null>(null);

  if (joined) {
    return (
      <div role="status" className="rounded-2xl p-6 sm:p-8 text-center" style={{ border: "0.5px solid #e5e7eb" }}>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">{joined.already ? `You're already in ${joined.name}` : `You've joined ${joined.name}`}</h2>
        <p className="mt-2 text-sm text-gray-600">Your lessons, grades and announcements for this cohort are ready.</p>
        <Link href="/lessons" className="mt-6 inline-flex items-center justify-center rounded-lg px-5 min-h-11 text-sm font-semibold text-white no-underline" style={{ background: "#C81E1E" }}>Go to my lessons</Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const r = await joinWithCode(code);
          if (r.error) return setError(r.error);
          setJoined({ name: r.cohortName ?? "your cohort", already: !!r.already });
          router.refresh();
        });
      }}
      className="rounded-2xl p-6 sm:p-8 space-y-4"
      style={{ border: "0.5px solid #e5e7eb" }}
    >
      {previewName && (
        <p className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(224,32,32,0.06)", color: "#7f1d1d" }}>
          This code is for <b>{previewName}</b>.
        </p>
      )}
      <label htmlFor="join-code" className="block text-sm font-medium text-gray-700">
        Join code
        <input
          id="join-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          maxLength={20}
          placeholder="e.g. K7P2-XQ9M"
          className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-base uppercase tracking-widest text-gray-900 placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:border-gray-400"
        />
      </label>
      <p className="text-xs text-gray-500">Your lecturer or an admin gives you this code or link. Letters can be upper or lower case.</p>
      {error && <p role="alert" className="text-sm font-medium" style={{ color: "#b91c1c" }}>{error}</p>}
      <button type="submit" disabled={pending || !code.trim()} className="w-full sm:w-auto rounded-lg px-6 min-h-11 text-sm font-semibold text-white disabled:opacity-50" style={{ background: "#111" }}>
        {pending ? "Joining…" : "Join cohort"}
      </button>
    </form>
  );
}
