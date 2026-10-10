// The teacher's micro-reactions in play (DESIGN.md §5): an authored bank of SHAPES per moment and language, filled with the
// moment's on-screen facts by code, guarded, and rotated deterministically (no RNG in the feedback path, G3; no identical
// line twice in a session, the tic risk of `rj-static-filler-list`). PURE: the server (server/play/react.js, which adds the
// never-rules floor) and the offline dev harness both use it. No model writes or chooses these lines.
import { reactionProblems, type Facts, type Lang, type Moment, type MomentKind, type Reaction } from "../../../shared/play.ts";
import { hash32 } from "./rng.ts";

/** data/play/reactions.json: { v, moments: { [moment]: { [lang]: string[] } } } — strings may hold {slot} names from facts. */
export interface ReactionBank { v: number; moments: Partial<Record<MomentKind, Partial<Record<Lang, string[]>>>> ; family?: Record<string, Partial<Record<MomentKind, Partial<Record<Lang, string[]>>>>>;
  /** round 4: lines for a real-game engine's screen (said only when the child sees that engine; they replace the family's
   *  lines for the same moment, which name the 2D view's objects) */
  engine?: Record<string, Partial<Record<MomentKind, Partial<Record<Lang, string[]>>>>> }
/** Moments the teacher may react to with a micro-line, in priority order (one line per act at most). */
export const REACT_ORDER: MomentKind[] = ["solved", "slip_found", "prediction_violated", "prediction_confirmed", "misconception_consequence", "law_refused", "near_miss", "prediction_committed", "impasse", "first_act", "new_strategy", "progress"];
/** Minimum seconds between two micro-lines (the client also enforces it with the finger floor). */
export const MIN_GAP_S = 4;

export interface ReactHistory { used: Set<string>; lastAt: number; count: number }
export const newHistory = (): ReactHistory => ({ used: new Set(), lastAt: -1e9, count: 0 });

/**
 * Fill {slot}s from facts; a missing slot makes the shape unusable (never "{n}" on screen or in her mouth). A shape may
 * start with a condition `{?key=a|b}` (usable only when facts[key] is one of the values) or `{?key}` (only when the fact
 * exists). pickReaction adds the level's `mode` and `goal` and the moment's mal-rule as `mal` for conditions. Refusal shapes carry the
 * refusal they describe (`{?why=not_enough}`): an unconditioned "these pieces are different sizes" was said to a child
 * taking 5 hundreds from 0 in the place-value game (found in a mistake-state screenshot, 2026-10-09).
 */
export function fill(shape: string, facts: Facts): string | null {
  const cond = /^\{\?(\w+)(?:=([^}]*))?\}/.exec(shape);
  if (cond) {
    const v = facts[cond[1]];
    if (v === undefined || v === null || v === "") return null;
    if (cond[2] !== undefined && !cond[2].split("|").includes(String(v))) return null;
    shape = shape.slice(cond[0].length);
  }
  let ok = true;
  const out = shape.replace(/\{(\w+)\}/g, (_, k: string) => { const v = facts[k]; if (v === undefined || v === null || v === "") { ok = false; return ""; } return String(v); });
  return ok ? out : null;
}

/**
 * The line for the most important moment of one act, or null. `hidden` = values the child must still produce (the key);
 * a filled line carrying one is refused (reactionProblems "reveals_hidden"). `nowS` drives the gap rule.
 */
export function pickReaction(bank: ReactionBank, moments: Moment[], o: { lang: Lang; family?: string; mode?: string; goal?: string; engine?: string | null; seed: string; hist: ReactHistory; nowS: number; hidden?: (string | number)[]; extraCheck?: (text: string) => boolean }): Reaction | null {
  if (o.nowS - o.hist.lastAt < MIN_GAP_S && !moments.some((m) => m.kind === "solved")) return null;
  const sorted = [...moments].sort((a, b) => REACT_ORDER.indexOf(a.kind) - REACT_ORDER.indexOf(b.kind));
  for (const m of sorted) {
    if (REACT_ORDER.indexOf(m.kind) < 0) continue;
    const eng = o.engine ? bank.engine?.[o.engine]?.[m.kind]?.[o.lang] : undefined;
    const fam = eng?.length ? undefined : o.family ? bank.family?.[o.family]?.[m.kind]?.[o.lang] : undefined;
    const shapes = [...(eng ?? []), ...(fam ?? []), ...(bank.moments[m.kind]?.[o.lang] ?? [])];
    if (!shapes.length) continue;
    const facts: Facts = { ...(o.mode ? { mode: o.mode } : {}), ...(o.goal ? { goal: o.goal } : {}), ...(m.misconceptionId ? { mal: m.misconceptionId } : {}), ...m.facts };
    const start = hash32(`${o.seed}:${m.kind}:${o.hist.count}`) % shapes.length;
    for (let k = 0; k < shapes.length; k++) {
      const i = (start + k) % shapes.length;
      const filled = fill(shapes[i], facts);
      if (!filled) continue;
      // a line that opens with a filled-in word ("sau mein sirf 0 hain") still starts like a sentence
      const text = /^[a-z]/.test(filled) ? filled[0].toUpperCase() + filled.slice(1) : filled;
      const id = `${m.kind}.${o.lang}.${i}`;
      if (o.hist.used.has(text)) continue;
      if (reactionProblems(text, { hidden: o.hidden }).length) continue;
      if (o.extraCheck && !o.extraCheck(text)) continue;
      o.hist.used.add(text); o.hist.lastAt = o.nowS; o.hist.count++;
      return { id, moment: m.kind, lang: o.lang, text, channel: "micro" };
    }
  }
  return null;
}
