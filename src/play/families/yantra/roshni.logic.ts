// Yantra · roshni (रोशनी, "light"), round 7: sources of light and materials (class 7 science, c7-science-ch11-t01). A light
// bench: each lane holds one thing (a kit-named source of light, the Moon or a steel plate) on the left, a slot in the
// middle where a screen of a kit-named material may stand, and the child's eye on the right, which every lane looks into.
// Nothing runs on a clock: a switch, a screen or a cover changes only when the child taps, and LOOK (the run) asks the law
// what the eye sees. What the eye sees is shown only after a look (predicting it is the skill), with the light's path drawn
// out from each source: never from the eye.
//
// THE LAW (the kit's own sentences, KIT_OF):
//   - a luminous thing (the Sun, a star, a candle flame, a glowing bulb, a firefly) gives out its own light while it is on;
//   - a non-luminous thing gives none: it is seen only when light from a source falls on it and is reflected into the eye.
//     The Moon shines by reflecting sunlight (only the Sun lights it here); a steel plate is lit by any source that is on;
//   - between a thing and the eye: air and a transparent material (clear glass, clean water) let almost all light pass, so it
//     is seen clearly; a translucent one (butter paper, frosted glass, oiled paper) lets some pass, so it is seen but not
//     clearly; an opaque one (cardboard, wood, a steel plate, a brick wall) lets none pass, so it is not seen;
//   - a cardboard cover over a thing lets no light leave it (cardboard is opaque);
//   - with no light on, nothing is seen, however the eye looks.
// The eye never looks at the Sun: the Sun's lane always has a brick wall before the eye (any eye-safety line is the teacher's).
//
// Three goals:
//   parda  (s2) the sources are lit; place the tray's screens so the eye sees each light as the card shows: clearly, not
//          clearly, or not at all. Butter paper in a lane the card wants clear is m3 (translucent taken for transparent).
//   roshan (s3, s1) the sources start off; switch them on and off, and (looks 2-3) place screens, so the eye sees exactly
//          what the card shows: a non-luminous thing can be seen only with a source on whose light falls on it. LOOK with
//          the Moon wanted and no sunlight on it is m1 (the Moon taken for a source); LOOK with no light on at all is m2
//          (seeing in the dark by looking hard).
//   dhak   (s1) every source is lit; with exactly as many cardboard covers as there are things giving out their own light,
//          make it dark for the eye. A cover on the Moon is m1: the Sun still shines, and once the Sun is covered the Moon
//          goes dark by itself.
// Every name, kind and property is the kit's (KIT_OF; tests/r7-games-yantra-roshni.test.mjs reads them out of
// data/kits/c7-science.json). Light amounts are qualitative (all / some / none); every count here is a scene value.
import type { Candidate, Facts, FamilyLogic, GenRequest, Moment, PlayActEnvelope, PlayGrade, PlayLevel, YantraAct } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export const ROSHNI_GOALS = ["parda", "roshan", "dhak"] as const;
export type RoshniGoal = (typeof ROSHNI_GOALS)[number];
export const ROSHNI_MAL = ["blur-clear", "moon-alone", "look-hard", "moon-cover"] as const;

/** the kit's own sentences each part of the law rests on (tests read them out of data/kits/c7-science.json) */
export const KIT_OF: Record<string, string> = {
  luminous: "Luminous objects give out their own light: the Sun, other stars, a candle flame, a glowing bulb, a firefly.",
  "non-luminous": "Non-luminous objects do not give out their own light; we see them only when light from a source falls on them and is reflected into our eyes.",
  moon: "The Moon is non-luminous: it shines by reflecting sunlight.",
  transparent: "Transparent materials let almost all light pass so we can see clearly through them (clear glass, clean water, air).",
  translucent: "Translucent materials let some light pass but we cannot see clearly through them (butter paper, frosted glass, oiled paper).",
  opaque: "Opaque materials do not let light pass (cardboard, wood, a steel plate, a brick wall).",
  "steel plate": "Steel plate: does not make light; we see it by reflected light, so non-luminous",
  "in the dark": "No, because no light falls on the ball to be reflected into your eyes",
  "moon goes dark": "the bowl shines only when the torch is on",
};

// ───────────────────────────── the bench ─────────────────────────────
/** the things on the bench: the kit's luminous objects, the Moon, and a steel plate (non-luminous by the kit's worked example) */
export const THINGS = { sun: "luminous", star: "luminous", candle: "luminous", bulb: "luminous", firefly: "luminous", moon: "non-luminous", plate: "non-luminous" } as const;
export type ThingId = keyof typeof THINGS;
export const SOURCES = ["sun", "star", "candle", "bulb", "firefly"] as const satisfies readonly ThingId[];
export const isSource = (t: ThingId) => THINGS[t] === "luminous";
/** the kit's materials and what each lets through (KIT_OF transparent / translucent / opaque); air is an empty slot */
export const MATS = {
  glass: "transparent", water: "transparent",
  butter: "translucent", frosted: "translucent", oiled: "translucent",
  cardboard: "opaque", wood: "opaque", steel: "opaque", brick: "opaque",
} as const;
export type MatId = keyof typeof MATS;
export type MatKind = (typeof MATS)[MatId];
export const MAT_IDS = Object.keys(MATS) as MatId[];
export const ofKind = (k: MatKind) => MAT_IDS.filter((m) => MATS[m] === k);
/** what the eye sees of a lane: clearly, not clearly, not at all because it is blocked, not at all because no light is on it */
export type Seen = "clear" | "blur" | "hidden" | "dark";
/** what a card asks of a lane ("not": not seen at all, whichever way) */
export type Want = "clear" | "blur" | "hidden" | "not";

export interface RoshniParams {
  goal: RoshniGoal;
  /** the scaffold (fade): 1 the fewest lanes and no screens to find; 3 the most */
  look: 1 | 2 | 3;
  /** the thing in each lane, top to bottom */
  things: ThingId[];
  /** lanes with a brick wall standing before the eye (fixed; the Sun's lane always) */
  walls: number[];
  /** what the card asks the eye to see in each lane */
  want: Want[];
  /** the screens on the tray (each a single piece) */
  tray: MatId[];
  /** dhak: the cardboard covers (as many as the things that give out their own light; a scene value) */
  covers: number;
}
export interface RoshniState extends Undoable<RoshniState> {
  /** each lane's source is on (roshan: the child's switches; parda and dhak: every source is lit) */
  on: boolean[];
  /** the screen standing in each lane's slot (null: air) */
  slot: (MatId | null)[];
  /** dhak: a cardboard cover over the lane's thing */
  cover: boolean[];
  /** what the eye saw at the last look (null: not looked since the bench last changed) */
  shown: Seen[] | null;
  runs: number;
  /** the law's answer at the last look ("" none) */
  why: string;
  /** the lane the answer is about (−1 none) */
  at: number;
  /** a mal-rule consequence already shown on this level (each fires once) */
  seenMal: string[];
  done: boolean; acts: number;
}

const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
const WANTS: Record<RoshniGoal, readonly Want[]> = { parda: ["clear", "blur", "hidden"], roshan: ["clear", "not"], dhak: ["not"] };

// ───────────────────────────── THE LAW ─────────────────────────────
/** the screen in a lane: the fixed brick wall, the child's piece, or null (air) */
export const screenOf = (p: RoshniParams, s: Pick<RoshniState, "slot">, i: number): MatId | null => (p.walls.includes(i) ? "brick" : s.slot[i] ?? null);
/** does the lane's thing send light out (its own, or light from a source reflected)? */
export function litOf(p: RoshniParams, s: Pick<RoshniState, "on" | "cover">, i: number): boolean {
  const t = p.things[i];
  if (s.cover[i]) return false;
  const shining = (j: number) => isSource(p.things[j]) && s.on[j] && !s.cover[j];
  if (isSource(t)) return shining(i);
  if (t === "moon") return p.things.some((x, j) => x === "sun" && shining(j));   // the Moon shines by reflecting sunlight
  return p.things.some((_, j) => shining(j));                                     // light from a source falls on it
}
/** the sources on the bench whose light falls on lane i's (non-luminous) thing */
export function lightersOf(p: RoshniParams, s: Pick<RoshniState, "on" | "cover">, i: number): number[] {
  const t = p.things[i];
  if (isSource(t) || s.cover[i]) return [];
  return p.things.map((x, j) => j).filter((j) => isSource(p.things[j]) && s.on[j] && !s.cover[j] && (t !== "moon" || p.things[j] === "sun"));
}
/** what the eye sees of each lane */
export function seenOf(p: RoshniParams, s: Pick<RoshniState, "on" | "cover" | "slot">): Seen[] {
  return p.things.map((_, i) => {
    if (s.cover[i]) return "hidden";
    if (!litOf(p, s, i)) return "dark";
    const m = screenOf(p, s, i), k = m ? MATS[m] : "transparent";
    return k === "opaque" ? "hidden" : k === "translucent" ? "blur" : "clear";
  });
}
export const meets = (w: Want, v: Seen) => (w === "not" ? v === "hidden" || v === "dark" : w === v);
export const anyOn = (p: RoshniParams, s: Pick<RoshniState, "on" | "cover">) => p.things.some((t, j) => isSource(t) && s.on[j] && !s.cover[j]);

/**
 * The light's path for the view (pure; tests check it): a ray from each lit source to the slot of its own lane and on to the
 * eye (dim past a translucent screen, stopped at an opaque one or at a cover), a ray from each source to every non-luminous
 * thing its light falls on, and from there to the slot and the eye. A ray always starts at a thing; none starts at the eye.
 */
export interface Ray { from: number; to: "slot" | "eye" | number; light: "all" | "some" }
export function raysOf(p: RoshniParams, s: Pick<RoshniState, "on" | "cover" | "slot">): Ray[] {
  const out: Ray[] = [];
  p.things.forEach((_, i) => {
    // the light that falls on a non-luminous thing (on its cover, when it is covered: it is not reflected on)
    for (const j of lightersOf(p, { ...s, cover: s.cover.map((x, k) => (k === i ? false : x)) }, i)) out.push({ from: j, to: i, light: "all" });
    if (!litOf(p, s, i)) return;
    const m = screenOf(p, s, i), k = m ? MATS[m] : "transparent";
    out.push({ from: i, to: "slot", light: "all" });
    if (k !== "opaque") out.push({ from: i, to: "eye", light: k === "translucent" ? "some" : "all" });
  });
  return out;
}

// ───────────────────────────── validate, init ─────────────────────────────
function validate(level: PlayLevel<unknown>): PlayLevel<RoshniParams> | null {
  const p = level.params as Partial<RoshniParams> | null;
  if (!p || level.mode !== "roshni" || !ROSHNI_GOALS.includes(p.goal as RoshniGoal)) return null;
  const goal = p.goal as RoshniGoal, look = p.look === 1 || p.look === 2 || p.look === 3 ? p.look : 0;
  if (!look || !Array.isArray(p.things) || p.things.length < 2 || p.things.length > 5) return null;
  if (!p.things.every((t) => typeof t === "string" && t in THINGS) || new Set(p.things).size !== p.things.length) return null;
  const n = p.things.length, things = p.things as ThingId[];
  if (!Array.isArray(p.walls) || !p.walls.every((w) => isInt(w) && w >= 0 && w < n) || new Set(p.walls).size !== p.walls.length) return null;
  if (!Array.isArray(p.want) || p.want.length !== n || !p.want.every((w) => WANTS[goal].includes(w as Want))) return null;
  if (!Array.isArray(p.tray) || p.tray.length > 6 || !p.tray.every((m) => typeof m === "string" && m in MATS) || new Set(p.tray).size !== p.tray.length) return null;
  if (!isInt(p.covers) || p.covers < 0 || p.covers > 5) return null;
  // the eye never looks at the Sun: its lane always has a brick wall; walls stand only before sources
  const sun = things.indexOf("sun");
  if (sun >= 0 && !p.walls.includes(sun)) return null;
  if (!p.walls.every((w) => isSource(things[w]))) return null;
  // per goal: parda lights sources only (never the Sun) and no walls; dhak has covers and no tray; roshan has no covers
  if (goal === "parda" && (!things.every((t) => isSource(t) && t !== "sun") || p.walls.length || p.covers)) return null;
  if (goal === "dhak" && (p.tray.length || p.covers !== things.filter(isSource).length || !things.includes("moon") || !things.includes("sun"))) return null;
  const want = p.want as Want[];
  if (goal === "roshan" && (p.covers || !things.some((t, i) => !isSource(t) && want[i] === "clear") || things.some((t, i) => t === "sun" && want[i] !== "not"))) return null;
  const q: RoshniParams = { goal, look, things: things.slice(), walls: p.walls.slice().sort((a, b) => a - b), want: want.slice(), tray: (p.tray as MatId[]).slice(), covers: p.covers };
  const lv = { ...level, params: q } as PlayLevel<RoshniParams>;
  // the level is honest: the card is not met at the start, and the law's own plan meets it
  const s0 = init(lv);
  if (q.want.every((w, i) => meets(w, seenOf(q, s0)[i]))) return null;
  if (!plan(q)) return null;
  return lv;
}
function init(level: PlayLevel<RoshniParams>): RoshniState {
  const p = level.params, n = p.things.length;
  return { on: p.things.map((t) => isSource(t) && p.goal !== "roshan"), slot: Array(n).fill(null), cover: Array(n).fill(false), shown: null,
    runs: 0, why: "", at: -1, seenMal: [], done: false, acts: 0, prev: null, depth: 0 };
}
const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });

// ───────────────────────────── apply ─────────────────────────────
type Out = { state: RoshniState; moments: Moment[]; refused?: string };
function apply(level: PlayLevel<RoshniParams>, s: RoshniState, act: YantraAct, seq: number): Out {
  const p = level.params, out: Moment[] = [], n = p.things.length;
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  const bump = (st: RoshniState): RoshniState => ({ ...st, acts: s.acts + 1 });
  const no = (code: string): Out => ({ state: bump(s), moments: out, refused: code });
  /** the bench changed: what the eye saw is stale until the next look */
  const ok = (patch: Partial<RoshniState>): Out => ({ state: bump(pushUndo(s, { ...s, ...patch, shown: null, why: "", at: -1 })), moments: out });
  const lane = (x: unknown) => (isInt(x) && x >= 0 && x < n ? x : -1);
  switch (act.kind) {
    case "toggle": {
      // roshan: the switch on a source (a non-luminous thing has none: it gives out no light to switch)
      const i = lane(Number(String(act.id).replace(/^thing-/, "")));
      if (p.goal !== "roshan") return no("no_switch");
      if (i < 0) return no("bad_toggle");
      if (!isSource(p.things[i])) return no("no_switch");
      const on = s.on.slice(); on[i] = !on[i];
      return ok({ on });
    }
    case "place": {
      const i = lane(Number(act.x));
      if (i < 0) return no("bad_place");
      if (p.goal === "dhak") {
        if (act.part !== "cover") return no("bad_place");
        if (s.cover[i]) return no("covered");
        if (s.cover.filter(Boolean).length >= p.covers) return no("no_covers_left");
        const cover = s.cover.slice(); cover[i] = true;
        return ok({ cover });
      }
      const m = act.part as MatId;
      if (!p.tray.includes(m)) return no("not_on_tray");
      if (s.slot.includes(m)) return no("in_use");
      if (p.walls.includes(i)) return no("wall");
      if (s.slot[i]) return no("slot_taken");
      const slot = s.slot.slice(); slot[i] = m;
      return ok({ slot });
    }
    case "remove": {
      const id = String(act.id), i = lane(Number(id.replace(/^(slot|cover)-/, "")));
      if (i < 0) return no("bad_remove");
      if (id.startsWith("cover-")) { if (!s.cover[i]) return no("bad_remove"); const cover = s.cover.slice(); cover[i] = false; return ok({ cover }); }
      if (!s.slot[i]) return no("bad_remove");
      const slot = s.slot.slice(); slot[i] = null;
      return ok({ slot });
    }
    case "run": {
      const shown = seenOf(p, s), bad = p.want.map((w, i) => (meets(w, shown[i]) ? -1 : i)).filter((i) => i >= 0);
      const f: Facts = { goal: p.goal, seen: shown.join("|"), on: s.on.filter(Boolean).length };
      const base = { ...s, runs: s.runs + 1, shown };
      // dhak asks for a dark room (no light given out anywhere), not just for nothing in the eye's sight: a cover over the
      // Moon hides the Moon, but the Sun still shines
      const met = p.goal === "dhak" ? !anyOn(p, s) : !bad.length;
      if (met) { out.push(mom("solved", seq, f)); return { state: bump(pushUndo(s, { ...base, why: "", at: -1, done: true })), moments: out }; }
      const [why, at, mal] = missOf(p, s, shown, bad);
      const fires = !!mal && mal in level.mal && !s.seenMal.includes(mal);
      out.push(fires ? mom("misconception_consequence", seq, { ...f, why }, mal) : mom("law_refused", seq, { ...f, why }));
      // a look changes nothing on the bench; it shows what the eye sees (kept until the bench changes)
      return { state: bump({ ...base, why, at, seenMal: fires ? [...s.seenMal, mal as string] : s.seenMal }), moments: out, refused: why };
    }
  }
  return no("unknown_act");
}
/** why a look missed the card (the law's answer), the lane it is about, and the belief the act shows (if one does) */
function missOf(p: RoshniParams, s: RoshniState, shown: Seen[], bad: number[]): [string, number, string | null] {
  const n = p.things.length, lanes = Array.from({ length: n }, (_, i) => i);
  if (p.goal === "parda") {
    // translucent taken for transparent: a lane the card wants clear behind butter paper / frosted glass / oiled paper
    const i = bad.find((k) => p.want[k] === "clear" && shown[k] === "blur");
    if (i !== undefined) return ["blur_clear", i, "blur-clear"];
    const j = bad[0];
    return [shown[j] === "clear" ? "too_clear" : shown[j] === "blur" ? "some_light" : "no_light", j, null];
  }
  if (p.goal === "roshan") {
    const moon = p.things.indexOf("moon");
    // the Moon wanted, and no sunlight on it: the Moon taken for a source of its own light
    if (moon >= 0 && p.want[moon] === "clear" && shown[moon] === "dark") return ["moon_dark", moon, "moon-alone"];
    // no light on at all: nothing is seen, however the eye looks
    if (!anyOn(p, s)) return ["all_dark", bad[0], "look-hard"];
    const i = bad[0];
    if (p.want[i] === "clear") return [shown[i] === "dark" ? "no_light_on_it" : shown[i] === "blur" ? "not_clearly" : "blocked", i, null];
    return [shown[i] === "blur" ? "glow_seen" : isSource(p.things[i]) ? "light_seen" : "lit_seen", i, null];
  }
  // dhak
  const moon = lanes.find((i) => p.things[i] === "moon" && s.cover[i]);
  if (moon !== undefined) return ["moon_covered", moon, "moon-cover"];
  const plate = lanes.find((i) => p.things[i] === "plate" && s.cover[i]);
  const still = lanes.find((i) => isSource(p.things[i]) && !s.cover[i]) ?? bad[0];
  return [plate !== undefined ? "plate_covered" : "still_light", plate ?? still, null];
}
const goalMet = (_l: PlayLevel<RoshniParams>, s: RoshniState) => s.done;

// ───────────────────────────── plan (the law's own solution), solve, shortcut, malActs ─────────────────────────────
/** the fewest acts that meet the card, or null: for every set of switches (roshan), the screens each lane then needs */
export function plan(p: RoshniParams): YantraAct[] | null {
  const n = p.things.length, lanes = Array.from({ length: n }, (_, i) => i);
  if (p.goal === "dhak") {
    const src = lanes.filter((i) => isSource(p.things[i]));
    return src.length === p.covers ? [...src.map((i): YantraAct => ({ kind: "place", part: "cover", x: i, y: 0 })), { kind: "run" }] : null;
  }
  const kindOf = (w: Want, lit: boolean): MatKind | "none" | "any" | null => {
    if (!lit) return w === "not" ? "any" : null;
    return w === "clear" ? "none" : w === "blur" ? "translucent" : "opaque";   // "not" while lit: it must be blocked
  };
  const switchable = p.goal === "roshan" ? lanes.filter((i) => isSource(p.things[i])) : [];
  let best: YantraAct[] | null = null;
  for (let mask = 0; mask < 1 << switchable.length; mask++) {
    const on = p.things.map((t, i) => (p.goal === "roshan" ? switchable.some((j, b) => j === i && (mask >> b) & 1) : isSource(t)));
    const st = { on, cover: Array(n).fill(false) };
    const pieces = p.tray.slice(), acts: YantraAct[] = [];
    switchable.forEach((j, b) => { if ((mask >> b) & 1) acts.push({ kind: "toggle", id: `thing-${j}` }); });
    let ok = true;
    for (const i of lanes) {
      const need = kindOf(p.want[i], litOf(p, st, i));
      if (need === null) { ok = false; break; }
      if (need === "any") continue;
      const wall = p.walls.includes(i);
      if (need === "none") { if (wall) { ok = false; break; } continue; }
      if (wall) { if (need !== "opaque") ok = false; if (!ok) break; continue; }
      const k = pieces.findIndex((m) => MATS[m] === need);
      if (k < 0) { ok = false; break; }
      acts.push({ kind: "place", part: pieces[k], x: i, y: 0 });
      pieces.splice(k, 1);
    }
    if (!ok) continue;
    acts.push({ kind: "run" });
    if (!best || acts.length < best.length) best = acts;
  }
  return best;
}
const run = (level: PlayLevel<RoshniParams>, acts: YantraAct[]) => { let s = init(level); for (const a of acts) s = apply(level, s, a, 1).state; return s; };
function solve(level: PlayLevel<RoshniParams>): YantraAct[] | null {
  const acts = plan(level.params);
  return acts && run(level, acts).done ? acts : null;
}
/** idea-free play: LOOK at once; every switch on; the tray's pieces into the lanes in order (or backwards); covers on the
 *  first, the last, or the brightest-looking lanes */
function shortcut(level: PlayLevel<RoshniParams>): YantraAct[] | null {
  const p = level.params, n = p.things.length, lanes = Array.from({ length: n }, (_, i) => i), tries: YantraAct[][] = [];
  const R: YantraAct = { kind: "run" };
  tries.push([R]);
  if (p.goal === "dhak") {
    const cov = (ix: number[]): YantraAct[] => [...ix.slice(0, p.covers).map((i): YantraAct => ({ kind: "place", part: "cover", x: i, y: 0 })), R];
    const s0 = init(level), seen0 = seenOf(p, s0);
    tries.push(cov(lanes), cov(lanes.slice().reverse()), cov(lanes.filter((i) => seen0[i] !== "dark" && seen0[i] !== "hidden")));
  } else {
    const allOn: YantraAct[] = p.goal === "roshan" ? lanes.filter((i) => isSource(p.things[i])).map((i) => ({ kind: "toggle", id: `thing-${i}` })) : [];
    const firstOn: YantraAct[] = allOn.slice(0, 1);
    const free = lanes.filter((i) => !p.walls.includes(i));
    const lay = (order: number[], pieces: MatId[]): YantraAct[] => pieces.slice(0, order.length).map((m, k) => ({ kind: "place", part: m, x: order[k], y: 0 }));
    for (const sw of [[], allOn, firstOn]) {
      if (sw.length) tries.push([...sw, R]);
      if (p.tray.length) {
        tries.push([...sw, ...lay(free, p.tray), R], [...sw, ...lay(free.slice().reverse(), p.tray), R], [...sw, ...lay(free, p.tray.slice().reverse()), R]);
      }
    }
  }
  for (const t of tries) if (run(level, t).done) return t;
  return null;
}
function malActs(level: PlayLevel<RoshniParams>, malId: string): YantraAct[] | null {
  const p = level.params, n = p.things.length, lanes = Array.from({ length: n }, (_, i) => i);
  const fires = (acts: YantraAct[]) => {
    let s = init(level);
    for (const [k, a] of acts.entries()) { const r = apply(level, s, a, k + 1); if (r.moments.some((m) => m.kind === "misconception_consequence" && m.misconceptionId === malId)) return true; s = r.state; }
    return false;
  };
  let acts: YantraAct[] | null = null;
  switch (malId) {
    case "blur-clear": {
      if (p.goal !== "parda") return null;
      const i = lanes.find((k) => p.want[k] === "clear"), m = p.tray.find((x) => MATS[x] === "translucent");
      if (i === undefined || !m) return null;
      acts = [{ kind: "place", part: m, x: i, y: 0 }, { kind: "run" }];
      break;
    }
    case "moon-alone": {
      if (p.goal !== "roshan") return null;
      const moon = p.things.indexOf("moon");
      if (moon < 0 || p.want[moon] !== "clear") return null;
      // a light switched on, but not the Sun: the Moon is still dark
      const other = lanes.find((i) => isSource(p.things[i]) && p.things[i] !== "sun");
      acts = other === undefined ? [{ kind: "run" }] : [{ kind: "toggle", id: `thing-${other}` }, { kind: "run" }];
      break;
    }
    case "look-hard": {
      if (p.goal !== "roshan") return null;
      acts = [{ kind: "run" }];
      break;
    }
    case "moon-cover": {
      if (p.goal !== "dhak") return null;
      const moon = p.things.indexOf("moon");
      if (moon < 0) return null;
      acts = [{ kind: "place", part: "cover", x: moon, y: 0 }, { kind: "run" }];
      break;
    }
  }
  return acts && fires(acts) ? acts : null;
}

// ───────────────────────────── generate ─────────────────────────────
const JITTER = 0.24;
interface RoshniGrammar { goal?: RoshniGoal }
function shuffle<T>(a: T[], rnd: () => number): T[] {
  const x = a.slice();
  for (let i = x.length - 1; i > 0; i--) { const k = Math.floor(rnd() * (i + 1)); [x[i], x[k]] = [x[k], x[i]]; }
  return x;
}
/** one candidate bench for the goal and look (null when the draw does not make an honest level) */
function draw(goal: RoshniGoal, look: 1 | 2 | 3, rnd: () => number): RoshniParams | null {
  const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];
  if (goal === "parda") {
    // lit sources (never the Sun), one per lane; the card asks for each way of being seen at least once (look 1: two of them)
    const n = look === 1 ? 2 : look === 2 ? 3 : 4;
    const things = shuffle(["star", "candle", "bulb", "firefly"] as ThingId[], rnd).slice(0, n);
    const kinds: Want[] = look === 1 ? shuffle(["clear", "blur", "hidden"] as Want[], rnd).slice(0, 2) : shuffle(["clear", "blur", "hidden"] as Want[], rnd);
    while (kinds.length < n) kinds.push(pick(["clear", "blur", "hidden"] as Want[]));
    const want = shuffle(kinds, rnd);
    if (!want.includes("clear")) return null;
    const tray: MatId[] = [];
    const take = (k: MatKind) => { const m = shuffle(ofKind(k), rnd).find((x) => !tray.includes(x)); if (m) tray.push(m); return !!m; };
    for (const w of want) {
      if (w === "blur" && !take("translucent")) return null;
      if (w === "hidden" && !take("opaque")) return null;
      // a clear lane: air does it; at looks 2-3 a transparent piece may stand there too
      if (w === "clear" && rnd() < 0.5) take("transparent");
    }
    // distractors: always a translucent piece beside a clear lane (butter paper is not clear glass), and more at looks 2-3
    take("translucent");
    for (let k = 0; k < look - 1 + (rnd() < 0.5 ? 1 : 0); k++) take(pick(["transparent", "translucent", "opaque"] as MatKind[]));
    if (tray.length > 6) return null;
    return { goal, look, things, walls: [], want, tray: shuffle(tray, rnd), covers: 0 };
  }
  if (goal === "dhak") {
    // the Sun (behind its brick wall), the Moon, and others; covers for exactly the things that give out their own light
    const extra = look === 1 ? 1 : look === 2 ? 2 : 3;
    const pool: ThingId[] = look === 1 ? ["star", "candle", "bulb", "firefly"] : ["star", "candle", "bulb", "firefly", "plate"];
    const things = shuffle(["sun", "moon", ...shuffle(pool, rnd).slice(0, extra)] as ThingId[], rnd);
    if (look === 1 && things.includes("plate")) return null;
    return { goal, look, things, walls: [things.indexOf("sun")], want: things.map(() => "not" as Want), tray: [], covers: things.filter(isSource).length };
  }
  // roshan: a sky bench (the Sun behind its wall, the Moon) or a room bench (a steel plate); from look 2 a sky bench has the
  // steel plate too (the Sun lights it as well)
  const sky = rnd() < 0.5, room = !sky || look > 1;
  const lanesN = look === 3 ? 4 : 3;
  const base: ThingId[] = [...(sky ? ["sun", "moon"] as ThingId[] : []), ...(room ? ["plate"] as ThingId[] : [])];
  const fill = shuffle(["star", "candle", "bulb", "firefly"] as ThingId[], rnd).slice(0, Math.max(1, lanesN - base.length));
  const things = shuffle([...base, ...fill], rnd);
  const walls: number[] = things.includes("sun") ? [things.indexOf("sun")] : [];
  // look 1: no screens to place; a room bench gets one source walled from the eye (the light that hides)
  if (look === 1 && !sky) { const src = things.map((t, i) => i).filter((i) => isSource(things[i])); walls.push(pick(src)); }
  // the card: every non-luminous thing seen or not, sources seen or not (never the Sun)
  const want: Want[] = things.map((t) => {
    if (t === "sun") return "not";
    if (!isSource(t)) return look > 1 && rnd() < 0.4 ? "not" : "clear";
    return look === 1 ? "not" : rnd() < 0.3 ? "clear" : "not";
  });
  if (!things.some((t, i) => !isSource(t) && want[i] === "clear")) return null;
  const tray: MatId[] = [];
  if (look > 1) {
    tray.push(pick(["cardboard", "wood", "brick"] as MatId[]), pick(ofKind("translucent")));
    if (look === 3 || rnd() < 0.5) tray.push(pick(ofKind("transparent")));
    if (look === 3) tray.push(pick((["cardboard", "wood", "brick"] as MatId[]).filter((m) => !tray.includes(m))));
  }
  return { goal, look, things, walls: walls.sort((a, b) => a - b), want, tray: shuffle(tray, rnd), covers: 0 };
}
function difficultyOf(p: RoshniParams, steps: number): number {
  return Math.max(0, Math.min(1, 0.2 + 0.03 * (steps - 3) + 0.1 * (p.look - 1) + 0.02 * p.tray.length));
}
function generate(req: GenRequest): Candidate<RoshniParams>[] {
  const g = (req.grammar ?? {}) as RoshniGrammar;
  const goal = (ROSHNI_GOALS.includes(req.goal as RoshniGoal) ? req.goal : g.goal ?? "parda") as RoshniGoal;
  const look = (req.fade === 2 || req.fade === 3 ? req.fade : 1) as 1 | 2 | 3;
  const rnd = mulberry32(req.seed), out: Candidate<RoshniParams>[] = [], sigs = new Set<string>();
  for (let k = 0; k < 90 && out.length < 12; k++) {
    const params = draw(goal, look, rnd);
    if (!params) continue;
    const sig = `roshni:${goal}:${look}:${params.things.join(",")}:${params.walls.join(",")}:${params.want.join(",")}:${params.tray.join(",")}`;
    if (sigs.has(sig)) continue;
    const level = {
      v: "play@1", levelId: `roshni-${goal}-${look}-${req.seed}-${k}`, family: "yantra", mode: "roshni", topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: "lab", seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 1, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 },
    } as PlayLevel<RoshniParams>;
    const v = validate(level as PlayLevel<unknown>);
    if (!v) continue;
    const sol = solve(v);
    if (!sol || shortcut(v)) continue;
    // each look's own work: look 1 places no screen; looks 2-3 need at least one screen (parda, roshan)
    const screens = sol.filter((a) => a.kind === "place" && a.part !== "cover").length;
    if (goal !== "dhak" && (look === 1 ? screens > 0 && goal === "roshan" : screens === 0)) continue;
    // every level can show the belief its goal is about
    const mals = goal === "parda" ? ["blur-clear"] : goal === "dhak" ? ["moon-cover"] : ["moon-alone", "look-hard"];
    const probe = { ...v, mal: Object.fromEntries(mals.map((m) => [m, m])) } as PlayLevel<RoshniParams>;
    if (!mals.some((m) => malActs(probe, m))) continue;
    sigs.add(sig);
    // a seeded nudge (± JITTER / 2) so the picker's nearest-to-band level differs from child to child
    const difficulty = Math.max(0, Math.min(1, difficultyOf(v.params, sol.length) + (rnd() - 0.5) * JITTER));
    out.push({ signature: sig, difficulty, level: v });
  }
  return out;
}

// ───────────────────────────── hidden, facts, board, grade ─────────────────────────────
/** the words that would give the idea away are never said first (the teacher's line waits for the child's act) */
const HIDDEN: Record<RoshniGoal, string[]> = {
  parda: ["transparent", "translucent", "opaque", "not clearly", "saaf nahi"],
  roshan: ["sunlight", "reflect", "the Sun", "suraj", "chamakta hai"],
  dhak: ["own light", "luminous", "apni roshni", "the Sun", "suraj"],
};
export function roshniHidden(level: PlayLevel<unknown>): string[] {
  try { const v = validate(level); return v ? [...HIDDEN[v.params.goal]] : []; } catch { return []; }
}
function facts(level: PlayLevel<RoshniParams>, s: RoshniState): Facts {
  const p = level.params, f: Facts = { goal: p.goal, lanes: p.things.length };
  if (p.goal === "dhak") f.covers_left = p.covers - s.cover.filter(Boolean).length;
  if (s.runs) f.looks = s.runs;
  if (s.why) f.why = s.why;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<RoshniParams>, s: RoshniState) {
  const p = level.params;
  return { title: "Roshni", lines: p.things.map((t, i) => `${t}${p.walls.includes(i) ? " |wall|" : ""} want ${p.want[i]} · on ${s.on[i] ? 1 : 0} · ${s.slot[i] ?? "air"}${s.cover[i] ? " · covered" : ""}`) };
}
function grade(level: PlayLevel<RoshniParams>, acts: PlayActEnvelope<YantraAct>[]): PlayGrade {
  return gradeLevel(roshniLogic, level, acts, {
    decisiveRefusals: ["blur_clear", "too_clear", "some_light", "no_light", "moon_dark", "all_dark", "no_light_on_it", "not_clearly", "blocked", "glow_seen", "light_seen", "lit_seen", "moon_covered", "plate_covered", "still_light"],
    final: true,
  });
}

export const roshniLogic: FamilyLogic<RoshniParams, RoshniState, YantraAct> = {
  family: "yantra", modes: ["roshni"], malRules: ROSHNI_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
