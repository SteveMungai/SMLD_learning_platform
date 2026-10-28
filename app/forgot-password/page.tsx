"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import AuthCard from "@/components/AuthCard";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? "Something went wrong. Please try again.");
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthCard title="Check your email">
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          If an account exists for <span className="font-semibold">{email}</span>, we&apos;ve sent a link to reset your password.
          It expires in 1 hour.
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Forgot password?" subtitle="Enter your email and we'll send you a link to reset it.">
      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Mail size={16} /></span>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
              style={{ "--tw-ring-color": "#E02020" } as React.CSSProperties}
            />
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60" style={{ backgroundColor: "#111111" }}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthCard>
  );
}
