import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";

// Invite codes: 8 characters from an alphabet with no look-alikes (no 0/O, 1/I/L), so they survive
// being read out or typed from a phone. 31^8 is about 850 billion combinations.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const LENGTH = 8;

/** One message for every kind of bad code, so nobody can tell "wrong" from "switched off". */
export const JOIN_PROBLEM = "That join code isn't active. Check it, or ask your lecturer for a new one.";

export function newJoinCode(): string {
  let code = "";
  for (let i = 0; i < LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

/** Accepts "k7p2-xq9m", " K7P2 XQ9M " and so on. */
export const normalizeJoinCode = (input: string): string => input.toUpperCase().replace(/[^A-Z0-9]/g, "");

/** K7P2XQ9M becomes K7P2-XQ9M for reading out loud. */
export const formatJoinCode = (code: string): string => (code.length === LENGTH ? `${code.slice(0, 4)}-${code.slice(4)}` : code);

/** A code nobody else is using. */
export async function uniqueJoinCode(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = newJoinCode();
    if (!(await prisma.cohort.findUnique({ where: { JoinCode: code }, select: { CohortID: true } }))) return code;
  }
  throw new Error("Could not generate a unique join code");
}

export type JoinLookup =
  | { ok: true; cohort: { CohortID: string; CohortName: string; AcademicYear: string } }
  | { ok: false };

/** The cohort a code opens, if the code exists, is switched on and hasn't expired. */
export async function lookupJoinCode(input: string, now = new Date()): Promise<JoinLookup> {
  const code = normalizeJoinCode(input);
  if (code.length !== LENGTH) return { ok: false };
  const cohort = await prisma.cohort.findUnique({
    where: { JoinCode: code },
    select: { CohortID: true, CohortName: true, AcademicYear: true, JoinCodeExpiresAt: true },
  });
  if (!cohort) return { ok: false };
  if (cohort.JoinCodeExpiresAt && cohort.JoinCodeExpiresAt <= now) return { ok: false };
  return { ok: true, cohort: { CohortID: cohort.CohortID, CohortName: cohort.CohortName, AcademicYear: cohort.AcademicYear } };
}
