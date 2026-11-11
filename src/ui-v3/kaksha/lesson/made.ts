// The Debrief's "Made for you" read (r7 app-debrief-made-later), in a plain .ts module so the unit tests can import it.
// No clock (tests/r4-kaksha-desk "no clock"): like the map's "Now secure" diff, the plan's madeFor feed is read once when
// the lesson opens and again when the Debrief shows; the pieces new since the first read are this session's.
import { getJson, postJson } from "../../../lesson/api.ts";
import type { ChildEmote, ChildEmoteRequest, MadeForItem } from "../../../../shared/contracts.ts";

/** The plan's madeFor feed (STUDENT-FLOW §9.3); null when the read failed (unknown, so the Debrief shows no strip). */
export async function readMadeFor(cid: string): Promise<MadeForItem[] | null> {
  try {
    const r = await getJson<{ madeFor?: MadeForItem[] }>(`/api/child/plan?childId=${encodeURIComponent(cid)}`);
    return Array.isArray(r.madeFor) ? r.madeFor : [];
  } catch {
    return null;
  }
}

/** This session's pieces: in the end read and not in the start read. An unknown start (null) shows nothing rather than
 *  calling earlier pieces new. */
export function madeSince(before: MadeForItem[] | null, after: MadeForItem[] | null): MadeForItem[] {
  if (!before || !after) return [];
  const had = new Set(before.map((x) => x.id));
  return after.filter((x) => !had.has(x.id));
}

/** "What helped?" (STUDENT-FLOW §8.2; Learning's POST /api/child/reflect): one tap, fire and forget (a second is a no-op
 *  on the server). A choice, never an effect claim; never shown to parents. */
export type ReflectChoice = `made:${string}` | "board" | "explain" | "self" | "unsure";
export async function sendReflect(cid: string, lessonId: string, choice: ReflectChoice): Promise<boolean> {
  try {
    await postJson("/api/child/reflect", { childId: cid, lessonId, choice });
    return true;
  } catch {
    return false;
  }
}
/** The closing emote to her (Brain's POST /api/child/emote; one per lesson, closed values, no text). */
export async function sendEmote(cid: string, lessonId: string, emote: ChildEmote): Promise<boolean> {
  try {
    await postJson("/api/child/emote", { childId: cid, lessonId, emote } satisfies ChildEmoteRequest);
    return true;
  } catch {
    return false;
  }
}
