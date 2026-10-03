// The child names the teacher (context/decisions.md#child-names-teacher; PRODUCT-DESIGN-V2 §3.3 step 5, §6.3.9):
// the picker's naming step talks to POST /api/tutors/name, whose code predicate (server/compiler/characters/naming.js)
// is the only authority. The shape rule is shared (shared/tutors.js) so the step can answer instantly; the denylists
// (slurs, profanity, romance and companion terms, public figures) and the own-name rule live on the server only.
// Chrome is ENGLISH ONLY. Every line here is rendered copy and never prompt text.
import type { TeacherNameRefused, TeacherNameResponse } from "../../../shared/contracts.ts";
import { normalizeTeacherName, teacherNameShape, TEACHER_NAME } from "../../../shared/tutors.js";
import { ApiError, getJson, postJson } from "../../lesson/api.ts";

export { normalizeTeacherName, teacherNameShape, TEACHER_NAME };
export type NameReason = TeacherNameRefused["reason"] | "offline";

export type NameResult = { ok: true; res: TeacherNameResponse } | { ok: false; reason: NameReason; suggestions: string[] };

/** Save the name (null = the character's own name). A refusal is a result, never a throw: the step retries gently. */
export async function saveTeacherName(childId: string, name: string | null, source: "child" | "parent" = "child"): Promise<NameResult> {
  try {
    return { ok: true, res: await postJson<TeacherNameResponse>("/api/tutors/name", { childId, name, source }) };
  } catch (e) {
    if (e instanceof ApiError && e.status === 422) {
      const b = (e.body ?? {}) as Partial<TeacherNameRefused>;
      const reason = (["shape", "own_name", "not_allowed", "public_figure"] as const).find((r) => r === b.reason) ?? "not_allowed";
      return { ok: false, reason, suggestions: Array.isArray(b.suggestions) ? b.suggestions.filter((x) => typeof x === "string").slice(0, 4) : [] };
    }
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) throw e;
    return { ok: false, reason: "offline", suggestions: [] };
  }
}

/** The parent corner's view: the name in use, the look's own name and the history (behind the parent gate). */
export const getTeacherName = (childId: string) => getJson<TeacherNameResponse>(`/api/tutors/name?childId=${encodeURIComponent(childId)}`);

/** The rendered copy of the naming step and the parent row. {T}: a teacher name; {C}: the child's name. */
export const NAME_COPY = {
  title: "What will you call your teacher?",
  titleYoung: "Name your teacher",
  pick: "Pick a name",
  type: "Or type a name",
  rule: `Letters only, ${TEACHER_NAME.min} to ${TEACHER_NAME.max}.`,
  use: "Use this name",
  keep: "Keep {T}",
  // when a custom name is in use, the secondary button goes back to the look's own name ("Not now" is the keep)
  goBack: "Go back to {T}",
  saving: "Saving",
  loading: "Loading",
  still: "Whatever the name, your teacher is an AI.",
  current: "Your teacher's name: {T}",
  change: "Change name",
  cancel: "Not now",
  saved: "Your teacher is now called {T}.",
  // the gentle retry: one kind sentence, then names to tap (the typed name is never repeated back)
  shape: `Use letters only, ${TEACHER_NAME.min} to ${TEACHER_NAME.max} of them.`,
  own_name: "That's your own name. Your teacher needs a different one.",
  public_figure: "That's a famous person's name. Pick a name just for your teacher.",
  not_allowed: "That name won't work for a teacher. Try another, or pick one of these.",
  offline: "Something went wrong. Try again.",
  // parent corner
  parentTitle: "Teacher's name",
  parentLine: "{C} calls the teacher {T}.",
  parentOwn: "{C} uses the teacher's own name, {T}.",
  parentNote: "{C} can give the teacher a name. Whatever the name, the teacher still tells {C} they are talking to an AI.",
  parentReset: "Reset to {T}",
  parentChange: "Change name",
  parentChooseTitle: "Choose a name for the teacher",
  parentChanged: "The teacher is called {T} from the next lesson.",
  parentResetDone: "The teacher is called {T} again from the next lesson.",
  parentHistory: "Earlier names",
  parentRetired: "The name {C} chose is no longer allowed, so the teacher uses {T}.",
} as const;

export const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? "");
