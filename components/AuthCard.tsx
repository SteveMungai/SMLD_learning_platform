import Link from "next/link";
import type { ReactNode } from "react";

// Centered card used by the forgot / reset password pages.
export default function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="text-4xl font-black tracking-tight" style={{ color: "#E02020", fontFamily: "'Georgia', serif" }}>
            SMLD
          </Link>
        </div>
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {children}
        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/login" className="font-semibold" style={{ color: "#E02020" }}>Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
