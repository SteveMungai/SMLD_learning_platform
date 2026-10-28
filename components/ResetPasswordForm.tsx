"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PasswordField from "@/components/PasswordField";

export default function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) return setError("The two passwords don't match.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");

    setLoading(true);
    try {
      const res = await fetch("/api/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setExpired(/invalid|expired/i.test(body.message ?? ""));
        throw new Error(body.message ?? "Something went wrong. Please try again.");
      }
      router.push("/login?reset=success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-600">
            {error}{" "}
            {expired && (
              <Link href="/forgot-password" className="font-semibold underline">Request a new link</Link>
            )}
          </p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <PasswordField id="password" label="New password" value={password} onChange={setPassword} autoComplete="new-password" />
        <PasswordField id="confirm" label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        <p className="text-xs text-gray-500 -mt-2">At least 8 characters.</p>
        <button type="submit" disabled={loading} className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60" style={{ backgroundColor: "#111111" }}>
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </>
  );
}
