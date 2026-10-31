"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import PasswordField from "@/components/PasswordField";
import { NAME_NOTICE, validateFullName } from "@/lib/names";

type Props = {
  name: string | null;
  email: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  memberSince: string;
  hasPassword: boolean;
  nameIsValid: boolean;
};

const ROLE_LABEL = { STUDENT: "Student", INSTRUCTOR: "Lecturer", ADMIN: "Admin" } as const;
const cardStyle = { background: "#ffffff", border: "0.5px solid #e5e7eb" };

export default function AccountSettings({ name, email, role, memberSince, hasPassword, nameIsValid }: Props) {
  const [fullName, setFullName] = useState(name ?? "");
  const [savedName, setSavedName] = useState(name ?? "");
  const [nameError, setNameError] = useState("");
  const [nameOk, setNameOk] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [needsReview, setNeedsReview] = useState(!nameIsValid);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameError("");
    setNameOk("");
    const check = validateFullName(fullName);
    if (!check.ok) return setNameError(check.error);

    setNameSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: check.value }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message ?? "Something went wrong. Please try again.");
      setFullName(body.name);
      setSavedName(body.name);
      setNeedsReview(false);
      setNameOk("Your name was updated.");
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setNameSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (next !== confirm) return setError("The new passwords don't match.");
    if (next.length < 8) return setError("New password must be at least 8 characters.");

    setLoading(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message ?? "Something went wrong. Please try again.");
      // The change signed out every session, including this one. Sign back in with the
      // new password so this device gets a fresh token and stays logged in.
      const again = await signIn("credentials", { email, password: next, redirect: false });
      if (again?.error) {
        window.location.href = "/login?expired=1";
        return;
      }
      setSuccess("Your password has been updated and your other devices were signed out.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const rows: [string, string][] = [
    ["Name", savedName || "—"],
    ["Email", email],
    ["Role", ROLE_LABEL[role]],
    ["Member since", new Date(memberSince).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })],
  ];

  return (
    <div className="space-y-8">
      <section style={cardStyle} className="p-6 rounded-xl">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Profile</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-bold uppercase tracking-widest" style={{ color: "#9ca3af" }}>{label}</dt>
              <dd className="text-sm text-gray-900 mt-1 break-words">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section style={cardStyle} className="p-6 rounded-xl">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Your name</h2>
        <p className="text-sm mb-4" style={{ color: "#6b7280" }}>{NAME_NOTICE}</p>

        {needsReview && (
          <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
            <p className="text-sm text-amber-800">The name on your account doesn&apos;t look like a full real name. Please correct it below.</p>
          </div>
        )}
        {nameError && <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3"><p className="text-sm text-red-600">{nameError}</p></div>}
        {nameOk && <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3"><p className="text-sm text-green-800">{nameOk}</p></div>}

        <form onSubmit={saveName} className="space-y-4 max-w-md">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
              style={{ "--tw-ring-color": "#E02020" } as React.CSSProperties}
            />
          </div>
          <button type="submit" disabled={nameSaving || fullName.trim() === savedName} className="rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60" style={{ backgroundColor: "#111111" }}>
            {nameSaving ? "Saving…" : "Save name"}
          </button>
        </form>
      </section>

      <section style={cardStyle} className="p-6 rounded-xl">
        <h2 className="text-lg font-bold text-gray-900 mb-1">{hasPassword ? "Change password" : "Set a password"}</h2>
        <p className="text-sm mb-6" style={{ color: "#6b7280" }}>Use at least 8 characters.</p>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3"><p className="text-sm text-red-600">{error}</p></div>
        )}
        {success && (
          <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3"><p className="text-sm text-green-800">{success}</p></div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
          {hasPassword && (
            <div>
              <PasswordField id="current" label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" />
              <Link href="/forgot-password" className="inline-block mt-1.5 text-xs font-medium" style={{ color: "#E02020" }}>
                Forgot your current password?
              </Link>
            </div>
          )}
          <PasswordField id="new" label="New password" value={next} onChange={setNext} autoComplete="new-password" />
          <PasswordField id="confirm" label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
          <button type="submit" disabled={loading} className="rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60" style={{ backgroundColor: "#111111" }}>
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>
    </div>
  );
}
