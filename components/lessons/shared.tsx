// components/lessons/shared.tsx
export const colors = {
  red: "#E02020",
  black: "#111111",
  border: "#e5e7eb",
  panel: "#f9fafb",
  muted: "#6b7280",
  success: "#15803d",
};

export interface NoteItem {
  id: string;
  title: string;
  content: string | null;
  hasFile: boolean; // a downloadable file is attached
}

export const inputStyle = { border: `0.5px solid ${colors.border}`, color: "#111111", background: "#ffffff" };
export const inputClass = "w-full rounded-lg px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600/20";
