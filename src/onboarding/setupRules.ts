// Set-up rules the steps share (audit 2026-11-09: LEARN-10 raw error text, LEARN-44 feel chips, LEARN-46 consent twice).
import { ApiError } from "../app/api.ts";
import { parentError } from "../parent/copy.ts";
import { feelSubjects } from "../child/feel.ts";
import type { ParentView } from "../parent/api.ts";

/** A 400 about one field, in words a parent reads (the server's message is for developers). */
const FIELD_WORDS: Record<string, string> = {
  "name.missing": "Add your child's name.",
  "name_spoken.shape": "Spell the name with letters only. Spaces, ' and - are fine; numbers and full stops are not.",
  "email.bad": "That email doesn't look right.",
  "email.taken": "An account with this email already exists. Sign in instead.",
  "password.short": "The password needs at least 8 characters.",
};

/**
 * What set-up shows for a failed request: a field's own sentence when the server named one, else the Parent corner's
 * error sentences. Never `e.message` ("Failed to fetch", "internal error", "missing field: firstName").
 */
export function setupError(e: unknown): string {
  if (e instanceof ApiError) {
    const code = ((e.body ?? {}) as { code?: string }).code;
    if (code && FIELD_WORDS[code]) return FIELD_WORDS[code];
  }
  return parentError(e);
}

/**
 * The "how does school feel" chips for a class: only subjects the class's book has (`subjectsWithChapters`, from the
 * chapters read; null while it loads). Classes 1-2 have no EVS book, so their EVS chip was saved and then dropped.
 */
export const feelChipsFor = (classLevel: number, subjectsWithChapters: string[] | null): string[] =>
  feelSubjects(classLevel).filter((s) => !subjectsWithChapters || subjectsWithChapters.includes(s));

/** The account's own consent (child_id null) is on file: a signed-in parent with no child skips the consent step. */
export const consentOnFile = (consents: { child_id: string | null; purpose: string; granted: boolean }[] | undefined | null): boolean =>
  !!consents?.some((c) => c.child_id === null && c.purpose === "core_tutoring" && c.granted);

/**
 * The parent views to send: every chip answer, and "unsure" for a subject the parent answered before and then cleared
 * with "Not sure" (dropping the key locally left the server's stored answer in place).
 */
export function parentViewToSend(now: Record<string, ParentView> | undefined, cleared: string[]): Record<string, ParentView> {
  const out: Record<string, ParentView> = { ...(now ?? {}) };
  for (const s of cleared) if (!(s in out)) out[s] = "unsure";
  return out;
}
