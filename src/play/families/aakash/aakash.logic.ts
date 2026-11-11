// Aakash (आकाश, "sky") · round 7, the Earth's motions, seasons and eclipses (class 7 science, c7-science-ch12). A model the
// child turns and moves. Nothing here runs on a clock: the Earth spins, goes round, or the Moon moves on only when the child
// taps (or drags) it, and the law answers each act at once. The model is not to scale; its steps are scene values.
//
// chakkar (rotation and revolution, ch12-t01). The Sun stays where it is.
//   din   (s1, s2) the Earth seen from above its North Pole, the Sun's light from one side: the half facing the Sun has day.
//                  "Spin" turns it an eighth of a turn west to east, so a place turns from night into day and back; the sky
//                  over the place shows the Sun coming up in the east. A card names moments for the place (sunrise, noon,
//                  sunset, midnight; look 3 two places, the eastern one turning into the light first); "Now!" says the place
//                  is there.
//   saal  (s3, s1) the Earth on its path round the Sun: "Spin" turns it on its axis, "Go round" moves it a quarter of the way
//                  round. A card names a day (one whole spin, staying in its place on the path) and a year (once all the way
//                  round); "Done" closes each.
// ritu (seasons, ch12-t02). The Earth's path seen a little from the side; its axis leans, and keeps pointing the same way all
//   the way round (the law refuses to turn it). Each half's sunlight is drawn on graph paper: the same bundle of light makes a
//   small bright patch where it falls straight and a bigger, dimmer patch where it slants (the kit's torch-and-graph-paper
//   activity; patch sizes are scene values, compared, never measured).
//   jhuk  (s1, s3) a card names a half and a season ("summer in the north half"); the child moves the Earth round and says
//                  "Here!" where that is so. The point of the path closest to the Sun is marked (the kit: early January,
//                  the northern winter).
//   dhoop (s2)     an ice block on India's field (north half) or Australia's (south half); one day of sunshine melts it only
//                  where the light falls straight.
// grahan (eclipses, ch12-t03). The Moon goes round the Earth (eight places, a scene value); "Months pass" moves the Earth on
//   round the Sun. A side strip shows the Sun-Earth line and the Moon above it, below it or on it (a picture, never an angle).
//   chaaya (s1, s2) the months when the Moon's path crosses the line at new and full moon: move the Moon to make the eclipse the
//                  card names, and say "Eclipse!".
//   kab    (s3)     the level starts in a month when it does not: new and full moons come and go with no eclipse until the
//                  months pass and the three line up.
//
// The CHILD's beliefs (mal-rules; each mapped to the topic's own kit misconception, a deterministic act list with its own
// consequence):
//   sun-goes     (t01 m1) the Sun dragged to go round the Earth for day: it stays put; the Earth turns the place into light
//   spin-year    (t01 m2) "Done" on a year after spinning the Earth on the spot: one spin is a day; it has not gone round
//   trip-day     (t01 m2) "Go round" for a day: going round the Sun is the year's movement, not the day's
//   near-summer  (t02 m1) "Here!" for summer in the north at the point closest to the Sun: it is the northern winter there
//   axis-turns   (t02 m2) the axis turned to lean the north half towards the Sun: it keeps pointing the same way in space
//   slant-same   (t02 m3) a day of sunshine on the ice where its light slants: the same light spread over more squares; it stays
//   every-month  (t03 m1) "Eclipse!" at a new or full moon when the Moon passes above or below the line: no eclipse this month
//   phase-shadow (t03 m2) "Eclipse!" for a lunar eclipse at a part-lit moon: the Earth's shadow is nowhere near; we see part of
//                         its sunlit half
// Not admitted: t03 m3 (sunglasses, a partly covered Sun): no mechanic; it is the teacher's safety line.
// Every number on screen is the kit's (about 24 hours, about 365¼ days); every other number here is a scene value with no fact
// claimed; tests/r7-games-aakash.test.mjs checks both against the kit.
import type { AakashAct, Candidate, Facts, FamilyLogic, GenRequest, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export const AAKASH_MODES = ["chakkar", "ritu", "grahan"] as const;
export type AakashMode = (typeof AAKASH_MODES)[number];
export const GOALS_OF = { chakkar: ["din", "saal"], ritu: ["jhuk", "dhoop"], grahan: ["chaaya", "kab"] } as const;
export type AakashGoal = (typeof GOALS_OF)[AakashMode][number];
export const AAKASH_MAL = ["sun-goes", "spin-year", "trip-day", "near-summer", "axis-turns", "slant-same", "every-month", "phase-shadow"] as const;

/** the kit's own sentences each law rests on (tests read them out of data/kits/c7-science.json) */
export const KIT_OF: Record<string, Record<string, string>> = {
  "c7-science-ch12-t01": {
    "the spin": "The Earth spins (rotates) on its axis, an imaginary line through the North and South Poles, from west to east, once in about 24 hours",
    "the day half": "At any moment the half of the Earth facing the Sun has day and the other half has night; as the Earth rotates, places move from night into day and back",
    "rise in the east": "the Sun, Moon and stars appear to rise in the east and set in the west; the Sun does not really go around the Earth each day",
    "east first": "Places farther east turn into sunlight first",
    "the year": "The Earth also moves (revolves) around the Sun in an orbit; one revolution takes about 365¼ days, which is one year",
    "the moments": "call out sunrise, noon, sunset and midnight for the sticker",
    "spins in a walk": "spin on the spot (rotation, day) while walking slowly around a chair (Sun) (revolution, year)",
  },
  "c7-science-ch12-t02": {
    "the axis keeps its way": "keeps pointing the same way in space while the Earth goes around the Sun",
    "north towards": "When the northern half is tilted towards the Sun, the Sun's rays fall on it more directly (more concentrated)",
    "north away": "When the northern half is tilted away from the Sun, rays fall at a slant (spread out)",
    "the south opposite": "The southern hemisphere is tilted the opposite way, so its seasons are opposite",
    "India and Australia": "when it is summer in India it is winter in Australia",
    "closest in the northern winter": "the Earth is actually closest to the Sun in early January, during the northern winter",
    "the patches": "Torch-on-graph-paper activity: count squares lit straight vs slanted",
    "the bigger area": "Ignores spreading of light over a bigger area",
  },
  "c7-science-ch12-t03": {
    "solar": "A solar eclipse happens when the Moon comes between the Sun and the Earth in a straight line",
    "only at new moon": "it can happen only on a new moon day",
    "lunar": "A lunar eclipse happens when the Earth comes between the Sun and the Moon, and the Earth's shadow falls on the Moon",
    "only at full moon": "it can happen only on a full moon night",
    "not in line": "usually the three are not exactly in line",
    "phases": "The phases of the Moon are caused by how much of the Moon's sunlit half we see as it goes around the Earth, not by the Earth's shadow",
    "above the shadow": "Show the Moon passing above the shadow most months and through it only when near a crossing point",
  },
};

// ───────────────────────────── the model (scene values, no fact claimed) ─────────────────────────────
/** scene value, no fact claimed: the steps of one spin (an eighth of a turn each) */
export const SPIN = 8;
/** scene value, no fact claimed: the places on the path round the Sun (a quarter of the way each) */
export const PATH = 4;
/** scene value, no fact claimed: the Moon's places on its way round the Earth */
export const MOON = 8;
/** scene value, no fact claimed (not to scale): how far ahead in the spin the eastern place is */
export const EAST = 1;
/** a place's moment by its spin step (0 noon, 2 sunset, 4 midnight, 6 sunrise; the odd steps between) */
export type Moment8 = "noon" | "set" | "mid" | "rise";
export const MOMENT_AT: Record<Moment8, number> = { noon: 0, set: 2, mid: 4, rise: 6 };
/** day while the place faces the Sun: steps 7, 0, 1 (sunrise and sunset on the line between day and night) */
export const isDay = (r: number) => r === 7 || r === 0 || r === 1;
export type Place = "A" | "G" | "H";   // Arunachal (east), Gujarat (west), home
export type Half = "N" | "S";
export type Season = "summer" | "winter";
/** ritu: where each half's light falls at each place on the path (0 the north half tilted towards the Sun, 2 away) */
export type Fall = "straight" | "middle" | "slant";
export const fallOf = (half: Half, pos: number): Fall => {
  const q = ((pos % PATH) + PATH) % PATH;
  if (q === 1 || q === 3) return "middle";
  return (q === 0) === (half === "N") ? "straight" : "slant";
};
/** scene value: the place on the path closest to the Sun (drawn a little nearer; the kit: early January, the northern winter) */
export const NEAR = 2;
/** the season a half has at a place on the path ("" between) */
export const seasonOf = (half: Half, pos: number): Season | "" => { const f = fallOf(half, pos); return f === "straight" ? "summer" : f === "slant" ? "winter" : ""; };
/** grahan: is the Moon on the Sun-Earth line at its place k this month e (its path crosses the line at two opposite places,
 *  and the crossing places turn as the Earth goes round the Sun) */
export const onLine = (k: number, e: number) => ((((k - 2 * e) % 4) + 4) % 4) === 0;
/** above (1), on (0) or below (−1) the line: a picture only, never an angle */
export const heightOf = (k: number, e: number): number => Math.round(Math.sin((Math.PI * (k - 2 * e)) / 4) * 2) / 2;
export const NEW_AT = 0;
export const FULL_AT = 4;
export type Eclipse = "solar" | "lunar";

// ───────────────────────────── the rows of each goal ─────────────────────────────
interface DinRow { places: readonly Place[]; card: readonly { at: number; when: Moment8 }[]; r0: number; ctx: readonly string[]; look: 1 | 2 | 3 }
const DIN_ROWS: readonly DinRow[] = [
  { places: ["H"], card: [{ at: 0, when: "rise" }, { at: 0, when: "noon" }], r0: 4, ctx: ["ghar", "globe"], look: 1 },
  { places: ["H"], card: [{ at: 0, when: "noon" }, { at: 0, when: "set" }], r0: 5, ctx: ["ghar", "globe"], look: 1 },
  { places: ["H"], card: [{ at: 0, when: "set" }, { at: 0, when: "mid" }], r0: 1, ctx: ["ghar", "globe"], look: 1 },
  { places: ["H"], card: [{ at: 0, when: "mid" }, { at: 0, when: "rise" }], r0: 3, ctx: ["ghar", "globe"], look: 1 },
  { places: ["H"], card: [{ at: 0, when: "rise" }, { at: 0, when: "set" }, { at: 0, when: "mid" }], r0: 3, ctx: ["ghar", "globe"], look: 2 },
  { places: ["H"], card: [{ at: 0, when: "noon" }, { at: 0, when: "mid" }, { at: 0, when: "rise" }], r0: 6, ctx: ["ghar", "globe"], look: 2 },
  { places: ["H"], card: [{ at: 0, when: "set" }, { at: 0, when: "rise" }, { at: 0, when: "noon" }], r0: 7, ctx: ["ghar", "globe"], look: 2 },
  { places: ["H"], card: [{ at: 0, when: "mid" }, { at: 0, when: "noon" }, { at: 0, when: "set" }], r0: 1, ctx: ["ghar", "globe"], look: 2 },
  // look 3: Arunachal (east, place 0) and Gujarat (west, place 1)
  { places: ["A", "G"], card: [{ at: 0, when: "rise" }, { at: 1, when: "rise" }], r0: 3, ctx: ["india", "globe"], look: 3 },
  { places: ["A", "G"], card: [{ at: 0, when: "set" }, { at: 1, when: "set" }], r0: 6, ctx: ["india", "globe"], look: 3 },
  { places: ["A", "G"], card: [{ at: 0, when: "rise" }, { at: 1, when: "rise" }, { at: 1, when: "noon" }], r0: 2, ctx: ["india", "globe"], look: 3 },
  { places: ["A", "G"], card: [{ at: 0, when: "noon" }, { at: 1, when: "noon" }, { at: 0, when: "set" }], r0: 4, ctx: ["india", "globe"], look: 3 },
];
export type Span = "day" | "year";
interface SaalRow { card: readonly Span[]; pos0: number; r0: number; ctx: readonly string[]; look: 1 | 2 | 3 }
const SAAL_ROWS: readonly SaalRow[] = [
  { card: ["day", "year"], pos0: 0, r0: 0, ctx: ["ghar", "globe", "chair"], look: 1 },
  { card: ["year", "day"], pos0: 1, r0: 2, ctx: ["ghar", "globe", "chair"], look: 1 },
  { card: ["day", "year"], pos0: 3, r0: 5, ctx: ["ghar", "globe", "chair"], look: 1 },
  { card: ["year", "day", "year"], pos0: 2, r0: 4, ctx: ["ghar", "globe", "chair"], look: 2 },
  { card: ["day", "year", "day"], pos0: 0, r0: 6, ctx: ["ghar", "globe", "chair"], look: 2 },
  { card: ["day", "day", "year"], pos0: 1, r0: 1, ctx: ["ghar", "globe"], look: 3 },
  { card: ["year", "day", "day"], pos0: 3, r0: 3, ctx: ["ghar", "chair"], look: 3 },
  { card: ["day", "year", "year"], pos0: 2, r0: 7, ctx: ["globe", "chair"], look: 3 },
];
interface JhukRow { card: readonly { half: Half; season: Season }[]; pos0: number; ctx: readonly string[]; look: 1 | 2 | 3 }
const JHUK_ROWS: readonly JhukRow[] = [
  { card: [{ half: "N", season: "summer" }], pos0: 1, ctx: ["sun", "lamp"], look: 1 },
  { card: [{ half: "N", season: "summer" }], pos0: 3, ctx: ["sun", "lamp"], look: 1 },
  { card: [{ half: "N", season: "winter" }], pos0: 3, ctx: ["sun", "lamp"], look: 1 },
  { card: [{ half: "N", season: "summer" }, { half: "S", season: "summer" }], pos0: 2, ctx: ["sun", "lamp"], look: 2 },
  { card: [{ half: "N", season: "winter" }, { half: "S", season: "winter" }], pos0: 1, ctx: ["sun", "lamp"], look: 2 },
  { card: [{ half: "S", season: "summer" }, { half: "N", season: "summer" }], pos0: 3, ctx: ["sun", "lamp"], look: 2 },
  { card: [{ half: "S", season: "winter" }, { half: "N", season: "winter" }, { half: "N", season: "summer" }], pos0: 1, ctx: ["sun", "lamp"], look: 3 },
  { card: [{ half: "N", season: "summer" }, { half: "S", season: "summer" }, { half: "N", season: "summer" }], pos0: 3, ctx: ["sun", "lamp"], look: 3 },
  { card: [{ half: "S", season: "summer" }, { half: "S", season: "winter" }, { half: "N", season: "summer" }], pos0: 1, ctx: ["sun", "lamp"], look: 3 },
];
interface DhoopRow { card: readonly Half[]; pos0: number; ctx: readonly string[]; look: 1 | 2 | 3 }
const DHOOP_ROWS: readonly DhoopRow[] = [
  { card: ["N"], pos0: 1, ctx: ["sun", "lamp"], look: 1 },
  { card: ["N"], pos0: 2, ctx: ["sun", "lamp"], look: 1 },
  { card: ["S"], pos0: 3, ctx: ["sun", "lamp"], look: 1 },
  { card: ["S"], pos0: 0, ctx: ["sun", "lamp"], look: 1 },
  { card: ["N", "S"], pos0: 1, ctx: ["sun", "lamp"], look: 2 },
  { card: ["S", "N"], pos0: 3, ctx: ["sun", "lamp"], look: 2 },
  { card: ["N", "S"], pos0: 2, ctx: ["sun", "lamp"], look: 2 },
  { card: ["S", "N", "S"], pos0: 1, ctx: ["sun", "lamp"], look: 3 },
  { card: ["N", "S", "N"], pos0: 3, ctx: ["sun", "lamp"], look: 3 },
];
interface GrahanRow { card: readonly Eclipse[]; e0: number; k0: number; ctx: readonly string[]; look: 1 | 2 | 3 }
const CHAAYA_ROWS: readonly GrahanRow[] = [
  { card: ["solar"], e0: 0, k0: 5, ctx: ["sun", "lamp"], look: 1 },
  { card: ["lunar"], e0: 2, k0: 1, ctx: ["sun", "lamp"], look: 1 },
  { card: ["lunar"], e0: 0, k0: 7, ctx: ["sun", "lamp"], look: 1 },
  { card: ["solar"], e0: 2, k0: 2, ctx: ["sun", "lamp"], look: 1 },
  { card: ["solar", "lunar"], e0: 0, k0: 6, ctx: ["sun", "lamp"], look: 2 },
  { card: ["lunar", "solar"], e0: 2, k0: 2, ctx: ["sun", "lamp"], look: 2 },
  { card: ["lunar", "solar"], e0: 0, k0: 1, ctx: ["sun", "lamp"], look: 2 },
  { card: ["solar", "lunar", "solar"], e0: 2, k0: 3, ctx: ["sun", "lamp"], look: 3 },
  { card: ["lunar", "solar", "lunar"], e0: 0, k0: 6, ctx: ["sun", "lamp"], look: 3 },
];
const KAB_ROWS: readonly GrahanRow[] = [
  { card: ["solar"], e0: 1, k0: 6, ctx: ["sun", "lamp"], look: 1 },
  { card: ["lunar"], e0: 3, k0: 2, ctx: ["sun", "lamp"], look: 1 },
  { card: ["solar"], e0: 3, k0: 7, ctx: ["sun", "lamp"], look: 1 },
  { card: ["lunar"], e0: 1, k0: 3, ctx: ["sun", "lamp"], look: 1 },
  { card: ["solar", "lunar"], e0: 1, k0: 5, ctx: ["sun", "lamp"], look: 2 },
  { card: ["lunar", "solar"], e0: 3, k0: 1, ctx: ["sun", "lamp"], look: 2 },
  { card: ["solar", "lunar"], e0: 3, k0: 2, ctx: ["sun", "lamp"], look: 2 },
  { card: ["lunar", "solar", "lunar"], e0: 1, k0: 6, ctx: ["sun", "lamp"], look: 3 },
  { card: ["solar", "lunar", "solar"], e0: 3, k0: 3, ctx: ["sun", "lamp"], look: 3 },
];

// ───────────────────────────── params, state ─────────────────────────────
export interface AakashParams {
  goal: AakashGoal;
  /** the scaffold (fade): 1 the shortest cards; 3 the longest */
  look: 1 | 2 | 3;
  /** the row of the goal's table (everything the level starts with is that row's own) */
  row: number;
  /** the context drawn (one the row allows) */
  scene: string;
  /** scene value: the seed of the star field the view draws (no fact claimed) */
  lay: number;
}
export interface AakashW {
  /** the spin step of the first place (chakkar), 0..7 */
  r: number;
  /** the place on the path round the Sun (chakkar/saal, ritu), 0..3; grahan: the month's place (e) */
  pos: number;
  /** grahan: the Moon's place round the Earth, 0..7 */
  k: number;
  /** the card's next item */
  next: number;
  /** saal: the spin steps and the quarters moved since the item began */
  sp: number; mv: number;
  /** dhoop: the ice blocks melted (one per card item done) */
  melted: number;
}
export interface AakashState extends Undoable<AakashState> {
  w: AakashW;
  /** the law's last answer for the view ("" when the last act just happened) */
  why: string;
  /** the tool of the last act */
  m: string;
  /** a mal-rule consequence already shown on this level (each fires once) */
  seen: string[];
  done: boolean; acts: number;
}

const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
const mod = (a: number, n: number) => ((a % n) + n) % n;
export const modeOfGoal = (g: string): AakashMode | null => (AAKASH_MODES.find((m) => (GOALS_OF[m] as readonly string[]).includes(g)) ?? null);
export const dinRow = (p: AakashParams) => DIN_ROWS[p.row];
export const saalRow = (p: AakashParams) => SAAL_ROWS[p.row];
export const jhukRow = (p: AakashParams) => JHUK_ROWS[p.row];
export const dhoopRow = (p: AakashParams) => DHOOP_ROWS[p.row];
export const grahanRow = (p: AakashParams) => (p.goal === "kab" ? KAB_ROWS : CHAAYA_ROWS)[p.row];
const rowsOf = (goal: AakashGoal): readonly { ctx: readonly string[]; look: 1 | 2 | 3 }[] =>
  goal === "din" ? DIN_ROWS : goal === "saal" ? SAAL_ROWS : goal === "jhuk" ? JHUK_ROWS : goal === "dhoop" ? DHOOP_ROWS : goal === "chaaya" ? CHAAYA_ROWS : KAB_ROWS;
/** the card's length */
export const cardOf = (p: AakashParams): readonly unknown[] =>
  p.goal === "din" ? dinRow(p).card : p.goal === "saal" ? saalRow(p).card : p.goal === "jhuk" ? jhukRow(p).card : p.goal === "dhoop" ? dhoopRow(p).card : grahanRow(p).card;
/** a place's spin step (the eastern place is EAST steps ahead of the western one: it turns into the light first) */
export const stepOf = (p: AakashParams, w: AakashW, at: number): number => {
  const pl = dinRow(p).places;
  return pl.length === 2 ? mod(w.r + (at === 1 ? 0 : EAST), SPIN) : mod(w.r, SPIN);
};
/** the moment a spin step is (only the four the card names; "" between) */
export const momentOf = (r: number): Moment8 | "" => (r === 0 ? "noon" : r === 2 ? "set" : r === 4 ? "mid" : r === 6 ? "rise" : "");

/** the tools on the strip (each goal's own) */
export function toolsOf(p: AakashParams): string[] {
  switch (p.goal) {
    case "din": return ["spin"];
    case "saal": return ["spin", "round"];
    case "jhuk": return ["round", "tilt"];
    case "dhoop": return ["round", "shine"];
    case "chaaya": return ["moon"];
    case "kab": return ["moon", "months"];
  }
}

// ───────────────────────────── validate, init ─────────────────────────────
function validate(level: PlayLevel<unknown>): PlayLevel<AakashParams> | null {
  const p = level.params as Partial<AakashParams> | null;
  if (!p || !AAKASH_MODES.includes(level.mode as AakashMode)) return null;
  const mode = level.mode as AakashMode;
  if (!(GOALS_OF[mode] as readonly string[]).includes(p.goal as string)) return null;
  const goal = p.goal as AakashGoal, look = p.look === 1 || p.look === 2 || p.look === 3 ? p.look : 0;
  if (!look || !isInt(p.row) || !isInt(p.lay) || p.lay < 0 || p.lay > 9999 || typeof p.scene !== "string") return null;
  const r = rowsOf(goal)[p.row];
  if (!r || r.look !== look || !r.ctx.includes(p.scene)) return null;
  return { ...level, params: { goal, look, row: p.row, scene: p.scene, lay: p.lay } } as PlayLevel<AakashParams>;
}
function initW(p: AakashParams): AakashW {
  const w: AakashW = { r: 0, pos: 0, k: 0, next: 0, sp: 0, mv: 0, melted: 0 };
  switch (p.goal) {
    case "din": return { ...w, r: dinRow(p).r0 };
    case "saal": return { ...w, r: saalRow(p).r0, pos: saalRow(p).pos0 };
    case "jhuk": return { ...w, pos: jhukRow(p).pos0 };
    case "dhoop": return { ...w, pos: dhoopRow(p).pos0 };
    case "chaaya": case "kab": { const g = grahanRow(p); return { ...w, pos: g.e0, k: g.k0 }; }
  }
}
function init(level: PlayLevel<AakashParams>): AakashState {
  return { w: initW(level.params), why: "", m: "", seen: [], done: false, acts: 0, prev: null, depth: 0 };
}
const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });

// ───────────────────────────── apply (THE LAW) ─────────────────────────────
type Out = { state: AakashState; moments: Moment[]; refused?: string };
function apply(level: PlayLevel<AakashParams>, s: AakashState, act: AakashAct, seq: number): Out {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind === "use" ? act.m : act.kind }));
  const tool = act.kind === "use" ? act.m : act.kind;
  const bump = (st: AakashState): AakashState => ({ ...st, acts: s.acts + 1 });
  /** a mal-rule's consequence (only when this level maps it; once per level), else the law's plain answer */
  const mal = (id: string, f: Facts, why: string): Moment => (!(id in level.mal) || s.seen.includes(id) ? mom("law_refused", seq, { ...f, why }) : mom("misconception_consequence", seq, f, id));
  /** refused: the state stays (only the law's answer for the view changes) */
  const no = (code: string, moment?: Moment): Out => {
    const m = moment ?? mom("law_refused", seq, { why: code, tool });
    out.push(m);
    const seen = m.kind === "misconception_consequence" && m.misconceptionId ? [...s.seen, m.misconceptionId] : s.seen;
    return { state: bump({ ...s, why: code, m: tool, seen }), moments: out, refused: code };
  };
  /** accepted: a new world (undoable) */
  const ok = (w: AakashW, f: Facts = {}): Out => {
    const n = cardOf(p).length, done = w.next >= n;
    out.push(mom(done ? "solved" : "progress", seq, { tool, ...f }));
    return { state: bump(pushUndo(s, { ...s, w, why: "", m: tool, done })), moments: out };
  };
  const w = s.w;
  if (act.kind !== "use" && act.kind !== "done") return no("unknown_act");
  // the Sun is on screen (and can be dragged) only in chakkar; everywhere else a tool must be the goal's own
  if (act.kind === "use" && !(act.m === "sun" && (p.goal === "din" || p.goal === "saal")) && !toolsOf(p).includes(act.m)) return no("no_tool");

  switch (p.goal) {
    case "din": {
      const r = dinRow(p), it = r.card[w.next];
      if (tool === "sun") return no("sun_still", mal("sun-goes", { r: w.r }, "sun_still"));
      if (tool === "spin") return ok({ ...w, r: mod(w.r + 1, SPIN) }, { r: mod(w.r + 1, SPIN) });
      // "Now!": the card's place is at the card's moment
      const at = stepOf(p, w, it.at), here = momentOf(at);
      if (here === it.when) return ok({ ...w, next: w.next + 1 }, { when: it.when, at: it.at });
      return no("not_now", mom("law_refused", seq, { why: "not_now", want: it.when, at: it.at, step: at }));
    }
    case "saal": {
      const r = saalRow(p), it = r.card[w.next];
      if (tool === "sun") return no("sun_still");
      if (tool === "spin") {
        if (w.sp >= 2 * SPIN) return no("dizzy");
        return ok({ ...w, r: mod(w.r + 1, SPIN), sp: w.sp + 1 }, { sp: w.sp + 1 });
      }
      if (tool === "round") {
        // going round the Sun is the year's movement: on a day it is off the card
        if (it === "day") return no("not_day_move", mal("trip-day", { sp: w.sp, item: it }, "not_day_move"));
        if (w.mv >= PATH) return no("round_done");
        return ok({ ...w, pos: mod(w.pos + 1, PATH), mv: w.mv + 1 }, { mv: w.mv + 1 });
      }
      if (it === "day") {
        if (w.sp === SPIN && w.mv === 0) return ok({ ...w, next: w.next + 1, sp: 0, mv: 0 }, { item: it });
        return no(w.sp < SPIN ? "short_day" : "long_day", mom("law_refused", seq, { why: w.sp < SPIN ? "short_day" : "long_day", sp: w.sp }));
      }
      if (w.mv === PATH) return ok({ ...w, next: w.next + 1, sp: 0, mv: 0 }, { item: it });
      // a whole spin on the spot taken for a year: it is still at the same place on its path
      if (w.mv === 0 && w.sp >= SPIN) return no("spun_not_round", mal("spin-year", { sp: w.sp, mv: w.mv }, "spun_not_round"));
      return no("short_year", mom("law_refused", seq, { why: "short_year", mv: w.mv }));
    }
    case "jhuk": {
      const it = jhukRow(p).card[w.next];
      if (tool === "tilt") return no("axis_same", mal("axis-turns", { pos: w.pos }, "axis_same"));
      if (tool === "round") return ok({ ...w, pos: mod(w.pos + 1, PATH) }, { pos: mod(w.pos + 1, PATH), fallN: fallOf("N", w.pos + 1) });
      if (seasonOf(it.half, w.pos) === it.season) return ok({ ...w, next: w.next + 1 }, { half: it.half, season: it.season, pos: w.pos });
      const f: Facts = { half: it.half, season: it.season, pos: w.pos, fall: fallOf(it.half, w.pos) };
      // summer in the north looked for at the closest point: it is the northern winter there
      if (it.half === "N" && it.season === "summer" && w.pos === NEAR) return no("near_winter", mal("near-summer", f, "near_winter"));
      return no("not_here", mom("law_refused", seq, { ...f, why: "not_here" }));
    }
    case "dhoop": {
      const half = dhoopRow(p).card[w.next];
      if (tool === "round") return ok({ ...w, pos: mod(w.pos + 1, PATH) }, { pos: mod(w.pos + 1, PATH) });
      if (tool === "done") return no("not_yet");
      // a day of sunshine on the ice: it melts only where the light falls straight (a small bright patch)
      const fall = fallOf(half, w.pos), f: Facts = { half, pos: w.pos, fall };
      if (fall === "straight") return ok({ ...w, next: w.next + 1, melted: w.melted + 1 }, f);
      if (fall === "slant") return no("spread", mal("slant-same", f, "spread"));
      return no("spread_some", mom("law_refused", seq, { ...f, why: "spread_some" }));
    }
    case "chaaya": case "kab": {
      const it = grahanRow(p).card[w.next];
      if (tool === "moon") return ok({ ...w, k: mod(w.k + 1, MOON) }, { k: mod(w.k + 1, MOON), line: onLine(w.k + 1, w.pos) ? "on" : "off" });
      if (tool === "months") return ok({ ...w, pos: mod(w.pos + 1, PATH) }, { e: mod(w.pos + 1, PATH) });
      const at = it === "solar" ? NEW_AT : FULL_AT, f: Facts = { want: it, k: w.k, line: onLine(w.k, w.pos) ? "on" : "off" };
      if (w.k === at && onLine(w.k, w.pos)) return ok({ ...w, next: w.next + 1 }, f);
      // a new or full moon in a month when the Moon passes above or below the line: no eclipse
      if (w.k === at) return no("off_line", mal("every-month", f, "off_line"));
      // a part-lit moon taken for the Earth's shadow on it
      if (it === "lunar" && w.k !== NEW_AT) return no("phase", mal("phase-shadow", f, "phase"));
      return no("wrong_side", mom("law_refused", seq, { ...f, why: "wrong_side" }));
    }
  }
}
const goalMet = (_l: PlayLevel<AakashParams>, s: AakashState) => s.done;

// ───────────────────────────── solve, shortcut, malActs ─────────────────────────────
const U = (m: string): AakashAct => ({ kind: "use", m });
const D: AakashAct = { kind: "done" };
const run = (level: PlayLevel<AakashParams>, acts: AakashAct[]) => { let s = init(level); for (const a of acts) s = apply(level, s, a, 1).state; return s; };
const times = (n: number, a: AakashAct): AakashAct[] => Array.from({ length: n }, () => a);
/** the acts that solve the card from the state `s`, up to (not including) item `upTo` (the law's own accepted acts) */
function plan(p: AakashParams, s0: AakashW, upTo: number): AakashAct[] {
  const acts: AakashAct[] = [], w = { ...s0 };
  for (; w.next < upTo; w.next++) {
    switch (p.goal) {
      case "din": {
        const it = dinRow(p).card[w.next];
        const n = mod(MOMENT_AT[it.when] - stepOf(p, w, it.at), SPIN);
        acts.push(...times(n, U("spin")), D); w.r = mod(w.r + n, SPIN); break;
      }
      case "saal": {
        const it = saalRow(p).card[w.next];
        if (it === "day") { acts.push(...times(SPIN - w.sp, U("spin")), D); w.r = mod(w.r + SPIN - w.sp, SPIN); }
        else { acts.push(...times(PATH - w.mv, U("round")), D); w.pos = mod(w.pos + PATH - w.mv, PATH); }
        w.sp = 0; w.mv = 0; break;
      }
      case "jhuk": {
        const it = jhukRow(p).card[w.next];
        let n = 0; while (seasonOf(it.half, w.pos + n) !== it.season) n++;
        acts.push(...times(n, U("round")), D); w.pos = mod(w.pos + n, PATH); break;
      }
      case "dhoop": {
        const half = dhoopRow(p).card[w.next];
        let n = 0; while (fallOf(half, w.pos + n) !== "straight") n++;
        acts.push(...times(n, U("round")), U("shine")); w.pos = mod(w.pos + n, PATH); break;
      }
      case "chaaya": case "kab": {
        const it = grahanRow(p).card[w.next], at = it === "solar" ? NEW_AT : FULL_AT;
        let e = 0; while (!onLine(at, w.pos + e)) e++;
        const n = mod(at - w.k, MOON);
        acts.push(...times(e, U("months")), ...times(n, U("moon")), D); w.pos = mod(w.pos + e, PATH); w.k = at; break;
      }
    }
  }
  return acts;
}
function solve(level: PlayLevel<AakashParams>): AakashAct[] | null {
  const p = level.params, acts = plan(p, init(level).w, cardOf(p).length);
  return run(level, acts).done ? acts : null;
}
/** idea-free play: "done" at once; one tool tapped over and over (then "done"); every tool in turn a dozen times */
function shortcut(level: PlayLevel<AakashParams>): AakashAct[] | null {
  const p = level.params, tools = toolsOf(p), tries: AakashAct[][] = [[D]];
  for (const m of tools) tries.push([...times(12, U(m)), D], [...times(12, U(m)), D, ...times(12, U(m)), D]);
  if (tools.length > 1) tries.push([...tools.flatMap((m) => times(12, U(m))), D]);
  for (const t of tries) if (run(level, t).done) return t;
  return null;
}
function malActs(level: PlayLevel<AakashParams>, malId: string): AakashAct[] | null {
  const p = level.params, w0 = init(level).w, card = cardOf(p);
  /** the acts up to the first card item where `want` holds (the solver's own) */
  const upTo = (want: (i: number) => boolean): { acts: AakashAct[]; w: AakashW } | null => {
    const i = card.findIndex((_, j) => want(j));
    if (i < 0) return null;
    const acts = plan(p, w0, i);
    return { acts, w: run(level, acts).w };
  };
  switch (malId) {
    case "sun-goes": return p.goal === "din" ? [U("sun")] : null;
    case "trip-day": {
      if (p.goal !== "saal") return null;
      const at = upTo((i) => saalRow(p).card[i] === "day");
      return at ? [...at.acts, U("round")] : null;
    }
    case "spin-year": {
      if (p.goal !== "saal") return null;
      const at = upTo((i) => saalRow(p).card[i] === "year");
      return at ? [...at.acts, ...times(SPIN, U("spin")), D] : null;
    }
    case "near-summer": {
      if (p.goal !== "jhuk") return null;
      const at = upTo((i) => { const it = jhukRow(p).card[i]; return it.half === "N" && it.season === "summer"; });
      return at ? [...at.acts, ...times(mod(NEAR - at.w.pos, PATH), U("round")), D] : null;
    }
    case "axis-turns": return p.goal === "jhuk" ? [U("tilt")] : null;
    case "slant-same": {
      if (p.goal !== "dhoop") return null;
      const half = dhoopRow(p).card[0];
      let n = 0; while (fallOf(half, w0.pos + n) !== "slant") n++;
      return [...times(n, U("round")), U("shine")];
    }
    case "every-month": {
      if (p.goal !== "kab") return null;
      // the first new or full moon the card names, claimed in the month the level starts in
      const it = grahanRow(p).card[0], at = it === "solar" ? NEW_AT : FULL_AT;
      if (onLine(at, w0.pos)) return null;
      return [...times(mod(at - w0.k, MOON), U("moon")), D];
    }
    case "phase-shadow": {
      if (p.goal !== "chaaya" && p.goal !== "kab") return null;
      const at = upTo((i) => grahanRow(p).card[i] === "lunar");
      if (!at) return null;
      // on to the first half-lit moon (a quarter of the way round from new or full), then "Eclipse!"
      let n = 0; while (![2, 6].includes(mod(at.w.k + n, MOON))) n++;
      return [...at.acts, ...times(n, U("moon")), D];
    }
  }
  return null;
}

// ───────────────────────────── generate ─────────────────────────────
interface AakashGrammar { scenes?: string[] }
const JITTER = 0.24;
function difficultyOf(p: AakashParams, steps: number): number {
  return Math.max(0, Math.min(1, 0.2 + 0.015 * (steps - 6) + 0.1 * (p.look - 1)));
}
function generate(req: GenRequest): Candidate<AakashParams>[] {
  const mode = (AAKASH_MODES.includes(req.mode as AakashMode) ? req.mode : "chakkar") as AakashMode;
  const goals = GOALS_OF[mode] as readonly AakashGoal[];
  const goal = (goals.includes(req.goal as AakashGoal) ? req.goal : goals[0]) as AakashGoal;
  const g = req.grammar as AakashGrammar, rnd = mulberry32(req.seed);
  const look = (req.fade === 2 || req.fade === 3 ? req.fade : 1) as 1 | 2 | 3;
  const scenes = Array.isArray(g.scenes) && g.scenes.length ? g.scenes : null;
  const rows: { row: number; scene: string }[] = [];
  rowsOf(goal).forEach((r, i) => { if (r.look === look) for (const ctx of r.ctx) if (!scenes || scenes.includes(ctx)) rows.push({ row: i, scene: ctx }); });
  // the seed orders the rows (the picker's band and the nudge below then choose among them)
  for (let i = rows.length - 1; i > 0; i--) { const k = Math.floor(rnd() * (i + 1)); [rows[i], rows[k]] = [rows[k], rows[i]]; }
  const out: Candidate<AakashParams>[] = [];
  for (const { row, scene } of rows) {
    const params: AakashParams = { goal, look, row, scene, lay: Math.floor(rnd() * 10000) };
    const sig = `${mode}:${goal}:${row}:${scene}`;
    const level = {
      v: "play@1", levelId: `aakash-${sig}-${req.seed}`.replace(/[^a-z0-9:=+._-]/gi, "_"), family: "aakash", mode, topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: scene, seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 1, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 },
    } as PlayLevel<AakashParams>;
    const v = validate(level as PlayLevel<unknown>);
    if (!v) continue;
    const sol = solve(v);
    if (!sol || shortcut(v)) continue;
    // a seeded nudge (± JITTER / 2) so the picker's nearest-to-band level differs from child to child
    const difficulty = Math.max(0, Math.min(1, difficultyOf(v.params, sol.length) + (rnd() - 0.5) * JITTER));
    out.push({ signature: sig, difficulty, level: v });
  }
  return out;
}

// ───────────────────────────── hidden, facts, board, grade ─────────────────────────────
/** the words that would give the idea away are never said first (the teacher's line waits for the child's act) */
const HIDDEN: Record<AakashGoal, string[]> = {
  din: ["the earth turns", "earth spins", "prithvi ghoomti", "west to east", "pashchim se poorab"],
  saal: ["one spin", "ek chakkar", "go round", "once round", "poora chakkar"],
  jhuk: ["tilted towards", "jhuka hua", "same way", "closest", "paas"],
  dhoop: ["straight", "seedhi", "slant", "tirchhi", "spread"],
  chaaya: ["in line", "ek line", "between", "beech mein"],
  kab: ["in line", "ek line", "above", "below", "upar", "neeche"],
};
export function aakashHidden(level: PlayLevel<unknown>): string[] {
  try { const v = validate(level); return v ? [...HIDDEN[v.params.goal]] : []; } catch { return []; }
}
function facts(level: PlayLevel<AakashParams>, s: AakashState): Facts {
  const p = level.params, f: Facts = { goal: p.goal, next: s.w.next, of: cardOf(p).length };
  if (p.goal === "din") f.step = s.w.r;
  if (p.goal === "saal") { f.sp = s.w.sp; f.mv = s.w.mv; }
  if (p.goal === "jhuk" || p.goal === "dhoop") { f.pos = s.w.pos; f.north = fallOf("N", s.w.pos); f.south = fallOf("S", s.w.pos); }
  if (p.goal === "chaaya" || p.goal === "kab") { f.moon = s.w.k; f.line = onLine(s.w.k, s.w.pos) ? "on" : "off"; }
  if (s.why) f.why = s.why;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<AakashParams>, s: AakashState) {
  const p = level.params;
  return { title: "Aakash", lines: [`card: ${JSON.stringify(cardOf(p))}`, ...Object.entries(s.w).map(([k, v]) => `${k}: ${v}`)] };
}
function grade(level: PlayLevel<AakashParams>, acts: PlayActEnvelope<AakashAct>[]): PlayGrade {
  return gradeLevel(aakashLogic, level, acts, {
    decisiveRefusals: ["not_now", "short_day", "long_day", "short_year", "spun_not_round", "not_day_move", "not_here", "near_winter", "spread", "spread_some", "off_line", "phase", "wrong_side", "not_yet"], final: true,
  });
}

export const aakashLogic: FamilyLogic<AakashParams, AakashState, AakashAct> = {
  family: "aakash", modes: AAKASH_MODES, malRules: AAKASH_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
