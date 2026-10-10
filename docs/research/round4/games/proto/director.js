// Antariksh Nishana · the game director (pure code; no model call happens here). It composes ONE playable level spec from
// the lesson state in well under 50 ms. A model may contribute only the DRESS (closed enums: theme, wrapper, music, pace,
// teacher move) - never a number, a position, a key or a child-facing sentence. If the dress is missing, late or invalid,
// the base dress plays (dec-r3-model-writes-delta-not-spec): the game never waits for a model.
import { generate, SKILLS, MIS } from "./law.js";

/** The closed vocabulary a model may write (this IS the strict json_schema of the delta call; see specs/dress.schema.json). */
export const DRESS_ENUMS = {
  theme: ["neela-nebula", "laal-grah", "hara-toofan"],
  wrapper: ["beacon-rescue", "mine-sweep", "comet-catch"],
  music: ["calm", "drive", "off"],
  pace: ["steady", "brisk"],          // travel speed of the world only; never the time a child has to decide
  teacherMove: ["notice", "ghost-first"],
  lang: ["hinglish", "en", "hi"],
};
export const BASE_DRESS = { theme: "neela-nebula", wrapper: "mine-sweep", music: "calm", pace: "steady", teacherMove: "notice", lang: "hinglish" };

/** Keep only enum-valid fields (a model string outside the list is dropped, never repaired or truncated). */
export function cleanDress(d, lastTheme) {
  const out = { ...BASE_DRESS }, dropped = [];
  if (d && typeof d === "object") for (const [k, allowed] of Object.entries(DRESS_ENUMS)) {
    if (d[k] === undefined) continue;
    if (allowed.includes(d[k])) out[k] = d[k]; else dropped.push(k);
  }
  if (!d && lastTheme === out.theme) out.theme = DRESS_ENUMS.theme[(DRESS_ENUMS.theme.indexOf(lastTheme) + 1) % 3];   // never the same look twice running
  return { dress: out, dropped };
}

/**
 * lesson = { skillId, misconceptionSeen?, fade?, door?: "garam" | "teekha", seed, linePx, lastTheme? }
 * misconceptionSeen is a KIT misconception id (from the classifier on the child's last answer, or the ledger's top belief).
 * door "teekha" moves one skill up the kit's prereq chain (s1 -> s2 -> s3) or one fade up; "garam" stays in band.
 */
export function compose(lesson, modelDress) {
  const t0 = performance.now();
  const order = Object.keys(SKILLS);
  let skillId = lesson.skillId, fade = lesson.fade ?? 1;
  if (lesson.door === "teekha") { if (fade < 3) fade += 1; else skillId = order[Math.min(order.length - 1, order.indexOf(skillId) + 1)]; }
  const focusMal = Object.entries(MIS).find(([, id]) => id === lesson.misconceptionSeen)?.[0] ?? null;
  // ladder: exact ask -> next fade that can show the belief -> drop the focus (still a valid level) -> null (board twin)
  const tries = [[fade, focusMal], [Math.min(3, fade + 1), focusMal], [fade, null]];
  let level = null, used = null;
  for (const [f, m] of tries) { level = generate({ skillId, focusMal: m, fade: f, seed: lesson.seed ?? 1, n: 2, linePx: lesson.linePx ?? 300 }); if (level) { used = { fade: f, focus: m }; break; } }
  const { dress, dropped } = cleanDress(modelDress, lesson.lastTheme);
  return { v: "antariksh-spec@0", level, dress, used, dropped, composeMs: +(performance.now() - t0).toFixed(2) };
}
