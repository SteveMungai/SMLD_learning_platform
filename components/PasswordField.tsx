"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: "current-password" | "new-password";
  placeholder?: string;
};

export default function PasswordField({ id, label, value, onChange, autoComplete, placeholder = "••••••••" }: Props) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={16} /></span>
        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-10 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
          style={{ "--tw-ring-color": "#E02020" } as React.CSSProperties}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
