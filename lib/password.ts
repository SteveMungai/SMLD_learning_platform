// lib/password.ts
import { createHash } from "crypto";

export const MIN_PASSWORD_LENGTH = 8; // matches /api/register
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// Reset tokens live in NextAuth's VerificationToken table, namespaced by this prefix.
export const resetIdentifier = (email: string) => `pwreset:${email}`;

// Only a hash of the token is stored, so a database leak can't be used to reset accounts.
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
