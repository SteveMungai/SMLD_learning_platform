// lib/names.ts
//
// Names are shown in grading and printed on the completion certificate, so they must be a
// person's real full name rather than a nickname, an email address or a placeholder.

export type NameCheck = { ok: true; value: string } | { ok: false; error: string };

// A word starts with a letter and may contain letters, marks, apostrophes, periods, hyphens.
const WORD = "[\\p{L}\\p{M}][\\p{L}\\p{M}'’.\\-]*";
const FULL_NAME = new RegExp(`^${WORD}(?: ${WORD})+$`, "u");

export function validateFullName(input: unknown): NameCheck {
  const value = String(input ?? "").normalize("NFC").replace(/\s+/g, " ").trim();

  if (value.length < 3) return { ok: false, error: "Please enter your full name." };
  if (value.length > 100) return { ok: false, error: "Your name is too long (100 characters maximum)." };
  if (/[\d@_/\\]/.test(value)) {
    return { ok: false, error: "Use your real name — no numbers, email addresses or symbols." };
  }
  if (!FULL_NAME.test(value)) {
    return { ok: false, error: "Enter your first and last name, using letters only (hyphens and apostrophes are fine)." };
  }
  // At least two real words (not just initials), e.g. "J. K." alone isn't enough.
  const substantial = value.split(" ").filter((w) => w.replace(/[^\p{L}]/gu, "").length >= 2);
  if (substantial.length < 2) {
    return { ok: false, error: "Enter your first and last name in full, not just initials." };
  }
  return { ok: true, value };
}

export const isValidFullName = (name: string | null | undefined) => !!name && validateFullName(name).ok;

export const NAME_NOTICE =
  "Please use your real full name. It appears on your grades and will be printed on your certificate when you complete the cohort.";
