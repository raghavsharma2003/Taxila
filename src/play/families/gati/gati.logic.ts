// Gati (गति, "motion") · round 7, science of motion for classes 6 and 7 (NCERT c6 ch 5 "types of motion", c7 ch 8 "speed",
// "uniform and non-uniform motion"). NOTHING here runs on a clock: time moves only when the child steps it (one tap, one
// interval), and the law answers a set-up only when the child runs it. Every fact is the topic kit's own expectation; the
// numbers in a scene (how far a bus goes in an hour, how many seconds a robot is watched) are the scene's, chosen by the
// generator, never a claimed fact. The one conversion the law uses is the kit's: 1 km/h = 1000 m ÷ 3600 s = 5/18 m/s.
// Modes and goals:
//   drishti/sandarbh  (c6-science-ch05-t03 s1) a train past a platform, a bus past a bus stop, or two trains side by side,
//                     one still: watch the same thing (the passenger, the man on the platform, your own train) from each
//                     reference in turn while stepping the clock; the trail of its places, drawn as seen from the reference,
//                     stays one dot (at rest compared with it) or spreads (moving compared with it). Each reference card
//                     takes "at rest" or "moving"; the run checks each against the reference. Three references at every
//                     look (a blind guess is then right 1 in 6, never 1 in 4); look 1 uses only things the kit's own scenes
//                     name (KIT_THINGS: the passenger, her seat, the platform, a signboard; the girl in the bus, the boy next
//                     to her, Aman at the bus stop, the bus stop, the tree by the road).
//   drishti/prakaar   (s2) three or four things seen only as the light on their moving point (the thing and its name are
//                     shown only once the child has checked, at every look):
//                     a train on a straight track, a ball dropped straight down, a child on a straight slide; a giant-wheel
//                     seat, a fan blade tip, a clock hand tip; a swing, a pendulum, a boat ride, a plucked string. Step the
//                     clock and the light leaves its path; put each on linear, circular or oscillatory. The run plays the
//                     clock on: a swing's light goes back over its own arc, a wheel's goes all the way round.
//   drishti/do-gati   (s3) a rolling bicycle wheel, a merry-go-round horse, and things with one motion (a fan, a swing, a
//                     train, a giant-wheel seat); watch from the ground or riding along with the thing; tick every type of
//                     motion each shows (a rolling wheel turns round while the bicycle moves straight ahead).
//   raftaar/aage      (c7-science-ch08-t02 s3) two movers on one track for different times: flag the faster one. The child
//                     steps the clock and chalks a mark where each mover is (a mover whose trip is over takes no mark); the
//                     flag is refused until both marks are for the SAME time: who is ahead after the same time.
//   raftaar/nikaalo   (s1, s2; look 3 the kit's average speed) one mover's trip, stepped to its end on a marked track; set the
//                     speedometer; the run drives a ghost at that speed for the same time beside it (ghostOf: it lands on
//                     the trip's end mark exactly when the speed is right; the track grows to hold where it lands).
//   raftaar/badlo     (s4) a speedometer in km/h (a multiple of 18, the kit's 36 km/h = 10 m/s and its siblings); step the
//                     clock one second at a time on a track in metres; set the metres covered each second (m/s); the run
//                     drives a ghost at that many m/s for the seconds stepped, landing on (or away from) the car's mark.
//   nishaan/ek-saa    (c7-science-ch08-t03 s1, s2) three or four movers on straight tracks; each step of the clock drops a
//                     chalk mark at each one; put each on uniform (equal distances in equal intervals) or non-uniform.
// Mal-rules (verified kit misconception ids only, mapped in server/play/tools/rules/gati.mjs; each a deterministic set-up
// that does not solve, and no two of a goal's beliefs commit the same set-up):
//   no-reference     ch05-t03 m1: the same verdict from every reference ("I am sitting still, so I am not moving at all")
//   curve-circular   ch05-t03 m2: every to-and-fro thing put on circular (the clock stepped only part of the way)
//   one-type         ch05-t03 m3: each thing ticked with one type only (the bicycle only straight ahead)
//   farther-faster   ch08-t02 m1: the mover that went farther flagged, its longer time not looked at
//   speed-distance   ch08-t02 m2: the trip's distance set on the speedometer
//   multiply         ch08-t02 m3: distance × time set on the speedometer
//   keeps-moving     ch08-t03 m1: uniform exactly when it never stops
//   same-totals      ch08-t03 m2: the uneven mover with the same total distance in the same total time as a uniform one
//                    put on uniform
//   uniform-slow     ch08-t03 m3: the fast uniform mover put on non-uniform
import type { Candidate, Facts, FamilyLogic, GatiAct, GenRequest, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export type GatiMode = "drishti" | "raftaar" | "nishaan";
export type GatiGoal = "sandarbh" | "prakaar" | "do-gati" | "aage" | "nikaalo" | "badlo" | "ek-saa";
export const GATI_MODES: readonly GatiMode[] = ["drishti", "raftaar", "nishaan"];
export const GOALS_OF: Record<GatiMode, readonly GatiGoal[]> = { drishti: ["sandarbh", "prakaar", "do-gati"], raftaar: ["aage", "nikaalo", "badlo"], nishaan: ["ek-saa"] };
export const GATI_MAL = ["no-reference", "curve-circular", "one-type", "farther-faster", "speed-distance", "multiply", "keeps-moving", "same-totals", "uniform-slow"] as const;
export const MAL_OF: Record<GatiGoal, readonly string[]> = {
  sandarbh: ["no-reference"], prakaar: ["curve-circular"], "do-gati": ["one-type"],
  aage: ["farther-faster"], nikaalo: ["speed-distance", "multiply"], badlo: [],
  "ek-saa": ["keeps-moving", "same-totals", "uniform-slow"],
};

// ── the kit's facts (each one of the topic kit's own expectations; asserted by the tests) ──
/** ch08-t02: "1 km/h = 1000 m ÷ 3600 s = 5/18 m/s; for example, 36 km/h = 10 m/s" */
export const KMH_TO_MS = { num: 5, den: 18 } as const;
export const msOf = (kmh: number) => (kmh * KMH_TO_MS.num) / KMH_TO_MS.den;
/** ch05-t03: the three types of motion the kit names (linear, circular, oscillatory), in bin order */
export const TYPES = ["linear", "circular", "oscillatory"] as const;
export type MotionType = 0 | 1 | 2;

// ───────────────────────────── drishti: the things ─────────────────────────────
/** prakaar things: the kit's own examples, each with the one type it shows (ch05-t03 expectations and items) */
export const PRAKAAR = {
  train: 0, drop: 0, slide: 0,
  wheel: 1, fan: 1, clock: 1,
  swing: 2, pendulum: 2, boat: 2, string: 2,
} as const satisfies Record<string, MotionType>;
export type PrakaarThing = keyof typeof PRAKAAR;
/** the to-and-fro things whose path is a curve (an arc): where "anything curved is circular" shows */
export const ARC: readonly PrakaarThing[] = ["swing", "pendulum", "boat"];
/** do-gati things and every type each shows (the kit: a rolling bicycle wheel turns round while the bicycle moves straight
 *  ahead; a merry-go-round's horses go round and up and down at the same time) */
export const DOGATI = {
  bicycle: [0, 1], horse: [1, 2],
  fan: [1], swing: [2], train: [0], wheel: [1],
} as const satisfies Record<string, readonly MotionType[]>;
export type DoGatiThing = keyof typeof DOGATI;
export const TWO: readonly DoGatiThing[] = ["bicycle", "horse"];
const maskOf = (ts: readonly number[]) => ts.reduce((m, t) => m | (1 << t), 0);
export const bitsOf = (m: number): MotionType[] => ([0, 1, 2] as MotionType[]).filter((t) => m & (1 << t));

/** the period (ticks) of each prakaar thing's repeating motion; 0 for a linear one */
export const PERIOD: Record<PrakaarThing, number> = { train: 0, drop: 0, slide: 0, wheel: 12, fan: 8, clock: 12, swing: 8, pendulum: 6, boat: 10, string: 4 };
export const PRAKAAR_T = 12;
/**
 * Where a prakaar thing's marked point is at time t (continuous; the view samples between ticks), in a window from −1 to 1
 * (y down). Linear: constant speed along a line (the dropped ball speeds up, still a straight line). Circular: round a
 * centre. Oscillatory: to and fro about the middle (an arc for a swing, a pendulum, a boat; a straight line for a string).
 */
export function prakaarAt(thing: PrakaarThing, phase: number, t: number): [number, number] {
  const P = PERIOD[thing], th = P ? (2 * Math.PI * (t + phase)) / P : 0;
  switch (thing) {
    case "train": return [-0.86 + (1.72 * t) / PRAKAAR_T, 0.35];
    case "slide": return [-0.8 + (1.6 * t) / PRAKAAR_T, -0.62 + (1.24 * t) / PRAKAAR_T];
    case "drop": return [0.1, -0.86 + 1.72 * (t / PRAKAAR_T) ** 2];
    case "wheel": return [0.72 * Math.cos(th), 0.72 * Math.sin(th)];
    case "fan": return [0.6 * Math.cos(-th), 0.6 * Math.sin(-th)];
    case "clock": return [0.7 * Math.sin(th), -0.7 * Math.cos(th)];
    case "swing": case "pendulum": case "boat": {
      const A = thing === "boat" ? 1.05 : thing === "swing" ? 0.95 : 0.75, L = thing === "boat" ? 1.45 : 1.55, a = A * Math.cos(th);
      return [L * Math.sin(a), -0.85 + L * Math.cos(a) - (thing === "boat" ? 0.1 : 0.18)];
    }
    case "string": return [0, 0.45 * Math.sin(th)];
  }
}
export const DOGATI_T = 10;
/** where a do-gati thing's marked point (and its base: the axle, the platform's centre) is at time t, from the ground
 *  (frame 0) or riding along with its base (frame 1) */
export function dogatiAt(thing: DoGatiThing, phase: number, t: number, frame: 0 | 1): { pt: [number, number]; base: [number, number] } {
  switch (thing) {
    case "bicycle": {
      // rolling without slipping: the rim turns by the distance gone over the radius
      const R = 0.42, x = -0.62 + (1.24 * t) / DOGATI_T, a = phase - ((1.24 * t) / DOGATI_T) / R, bx = frame ? 0 : x;
      return { pt: [bx + R * Math.cos(a), 0.18 + R * Math.sin(a)], base: [bx, 0.18] };
    }
    case "horse": {
      const a = frame ? phase : phase + (2 * Math.PI * t) / 12, bob = 0.22 * Math.sin((Math.PI * t) / 2);
      // the base is the centre of the circle the horse goes round (a pole above the platform's middle)
      return { pt: [0.78 * Math.cos(a), -0.05 + 0.32 * Math.sin(a) - bob], base: [0, -0.05] };
    }
    case "fan": { const a = phase - (2 * Math.PI * t) / 8; return { pt: [0.6 * Math.cos(a), 0.6 * Math.sin(a)], base: [0, 0] }; }
    case "wheel": { const a = phase + (2 * Math.PI * t) / 12; return { pt: [0.7 * Math.cos(a), 0.7 * Math.sin(a)], base: [0, 0] }; }
    case "swing": { const a = 0.95 * Math.cos(phase + (2 * Math.PI * t) / 8); return { pt: [1.45 * Math.sin(a), -0.9 + 1.45 * Math.cos(a) - 0.15], base: [0, -0.9] }; }
    case "train": { const x = frame ? 0 : -0.78 + (1.56 * t) / DOGATI_T; return { pt: [x, 0.3], base: [x, 0.3] }; }
  }
}

// sandarbh stories: who rides what (−1 = on the ground; else the vehicle index), the vehicles' speeds (world units a tick)
export type Story = "train" | "bus" | "twin";
export const STORY_THINGS: Record<Story, readonly string[]> = {
  train: ["passenger", "seat", "platform", "sign", "man"],
  bus: ["rider", "boy", "aman", "tree", "stop"],
  twin: ["mytrain", "other", "platform", "sign"],
};
/** the things the kit's own scenes name (ch05-t03: the passenger, the train seat and the platform; "a tree beside the road,
 *  the platform or a signboard" as reference points; the girl in the bus, the boy sitting next to her, Aman at the bus stop;
 *  your train and the train on the next track). Look 1 uses only these (the man on the platform is the scene's own) */
export const KIT_THINGS: readonly string[] = ["passenger", "seat", "platform", "sign", "rider", "boy", "aman", "tree", "stop", "mytrain", "other"];
/** the vehicle each thing rides (−1: the ground) */
export const RIDES: Record<string, number> = { passenger: 0, seat: 0, platform: -1, sign: -1, man: -1, rider: 0, boy: 0, aman: -1, tree: -1, stop: -1, mytrain: 0, other: 1 };
/** each story's vehicles, as speeds a tick (the twin's own train stands at the platform; the next train pulls out) */
export const speedsOf = (story: Story, v: number): number[] => (story === "twin" ? [0, v] : [v]);
export const SANDARBH_T = 6;
/** things that are references only, never the watched thing */
export const FIXED: readonly string[] = ["platform", "sign","tree", "stop", "seat", "other"];
/** the thing's speed on the ground */
export const speedOfThing = (story: Story, v: number, id: string) => { const r = RIDES[id]; return r < 0 ? 0 : speedsOf(story, v)[r]; };
/** at rest compared with the reference: its place, seen from the reference, never changes */
export const restFrom = (story: Story, v: number, target: string, ref: string) => speedOfThing(story, v, target) === speedOfThing(story, v, ref);

// ───────────────────────────── params ─────────────────────────────
type Look = 1 | 2 | 3;
export interface SandarbhParams { goal: "sandarbh"; look: Look; story: Story; v: number; target: string; refs: string[] }
export interface PrakaarParams { goal: "prakaar"; look: Look; things: PrakaarThing[]; phase: number[] }
export interface DoGatiParams { goal: "do-gati"; look: Look; things: DoGatiThing[]; phase: number[] }
/** raftaar units: a distance unit, the clock's time unit, the speed unit they make */
export type Units = "kmh" | "ms" | "mmin";
export const UNITS: Record<Units, { d: string; t: string; v: string }> = { kmh: { d: "km", t: "h", v: "km/h" }, ms: { d: "m", t: "s", v: "m/s" }, mmin: { d: "m", t: "min", v: "m/min" } };
export interface Mover { who: string; v: number; T: number }
export interface AageParams { goal: "aage"; look: Look; units: Units; movers: Mover[] }
export interface NikaaloParams { goal: "nikaalo"; look: Look; units: Units; who: string; legs: number[] }
export interface BadloParams { goal: "badlo"; look: Look; who: string; kmh: number }
export interface Trail { who: string; gaps: number[] }
export interface EkSaaParams { goal: "ek-saa"; look: Look; dt: number; movers: Trail[] }
export type GatiParams = SandarbhParams | PrakaarParams | DoGatiParams | AageParams | NikaaloParams | BadloParams | EkSaaParams;

export interface GatiState extends Undoable<GatiState> {
  /** the clock: intervals stepped (only ever by the child) */
  t: number;
  /** the reference (sandarbh: a ref index) or the frame (do-gati: 0 ground, 1 riding along) watched from now */
  view: number;
  /** sandarbh: the references watched from with the clock stepped (bit i = ref i) */
  seen: number;
  /** each lane's bin (−1 = none): sandarbh 0 at rest / 1 moving; prakaar a type; ek-saa 0 uniform / 1 non-uniform */
  place: number[];
  /** do-gati: each lane's ticked types (bits) */
  tags: number[];
  /** aage: the lane flagged faster (−1 = none) */
  pick: number;
  /** aage: the clock time at which each lane's chalk mark was placed (−1 = none); the mark sits where its mover was then */
  chalk: number[];
  /** nikaalo / badlo: the counter (0 = not set) */
  at: number;
  ended: boolean; runs: number; done: boolean; acts: number;
}
const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);

// ── derived values ──
export const lanesOf = (p: GatiParams): number => {
  switch (p.goal) {
    case "sandarbh": return p.refs.length;
    case "prakaar": case "do-gati": return p.things.length;
    case "aage": return p.movers.length;
    case "ek-saa": return p.movers.length;
    default: return 0;
  }
};
export const binsOf = (p: GatiParams): number => (p.goal === "prakaar" ? 3 : p.goal === "sandarbh" || p.goal === "ek-saa" ? 2 : 0);
/** the last tick the clock can reach */
export function tMaxOf(p: GatiParams): number {
  switch (p.goal) {
    case "sandarbh": return SANDARBH_T;
    case "prakaar": return PRAKAAR_T;
    case "do-gati": return DOGATI_T;
    case "aage": return Math.max(...p.movers.map((m) => m.T));
    case "nikaalo": return p.legs.length;
    case "badlo": return 4;
    case "ek-saa": return p.movers[0].gaps.length;
  }
}
/** the fewest ticks the run needs (the clock must have been stepped this far) */
export function tNeedOf(p: GatiParams): number {
  switch (p.goal) {
    case "sandarbh": return 2;
    case "prakaar": return 4;
    case "do-gati": return 4;
    case "aage": return 1;
    case "nikaalo": return p.legs.length;
    case "badlo": return 1;
    case "ek-saa": return p.movers[0].gaps.length;
  }
}
export const totalOf = (p: NikaaloParams) => p.legs.reduce((a, b) => a + b, 0);
/** nikaalo: speed = distance ÷ time (the kit; for a changing speed, average speed = total distance ÷ total time) */
export const speedOf = (p: NikaaloParams) => totalOf(p) / p.legs.length;
/** aage: where a mover is after t ticks (it stops at the end of its trip) */
export const posOf = (m: Mover, t: number) => m.v * Math.min(t, m.T);
export const distOf = (m: Mover) => m.v * m.T;
/** aage: both lanes chalked, at the same time (the comparison the flag rests on) */
export const sameTimeMarks = (s: Pick<GatiState, "chalk">) => s.chalk.length === 2 && s.chalk[0] >= 1 && s.chalk[0] === s.chalk[1];
/** prakaar: the things (drawing and name) are shown only once the child has checked (at every look) */
export const namesShown = (s: Pick<GatiState, "runs">) => s.runs > 0;
/**
 * nikaalo / badlo, after a run: the ghost driven at the counter's speed for the same time as the real mover (nikaalo: the
 * whole trip; badlo: the seconds stepped), where it lands (d) and where the real mover's mark is (real). It lands on the
 * real mark exactly when the counter is right. `max`: a track length that holds both (the view never clips the ghost).
 */
export function ghostOf(p: GatiParams, s: Pick<GatiState, "ended" | "at" | "t">): { t: number; d: number; real: number; max: number } | null {
  if (!s.ended || !s.at) return null;
  if (p.goal === "nikaalo") { const t = p.legs.length, D = totalOf(p); return { t, d: s.at * t, real: D, max: Math.max(D, s.at * t) }; }
  if (p.goal === "badlo") { const t = s.t, ms = msOf(p.kmh); return { t, d: s.at * t, real: ms * t, max: Math.max(ms * tMaxOf(p), s.at * t) }; }
  return null;
}
/** aage: the faster mover (speed = distance ÷ time) */
export const fasterOf = (p: AageParams) => (p.movers[0].v > p.movers[1].v ? 0 : 1);
export const fartherOf = (p: AageParams) => (distOf(p.movers[0]) > distOf(p.movers[1]) ? 0 : distOf(p.movers[1]) > distOf(p.movers[0]) ? 1 : -1);
/** ek-saa: equal distances in equal intervals (the kit's uniform motion) */
export const uniform = (tr: Trail) => tr.gaps.every((g) => g === tr.gaps[0]);
export const trailTotal = (tr: Trail) => tr.gaps.reduce((a, b) => a + b, 0);
const mean = (tr: Trail) => trailTotal(tr) / tr.gaps.length;
/** the right bins / tags for each lane */
export function rightPlace(p: GatiParams): number[] {
  switch (p.goal) {
    case "sandarbh": return p.refs.map((r) => (restFrom(p.story, p.v, p.target, r) ? 0 : 1));
    case "prakaar": return p.things.map((th) => PRAKAAR[th]);
    case "do-gati": return p.things.map((th) => maskOf(DOGATI[th]));
    case "ek-saa": return p.movers.map((m) => (uniform(m) ? 0 : 1));
    default: return [];
  }
}
/** nikaalo / badlo: the value the counter must take */
export function want(p: GatiParams): number {
  if (p.goal === "nikaalo") return speedOf(p);
  if (p.goal === "badlo") return msOf(p.kmh);
  return 0;
}
export const counterMax = (p: GatiParams) => (p.goal === "nikaalo" ? 999 : p.goal === "badlo" ? 99 : 0);

/** the law's verdict on a set-up */
function judge(p: GatiParams, s: GatiState): boolean {
  const r = rightPlace(p);
  switch (p.goal) {
    case "sandarbh": case "prakaar": case "ek-saa": return s.place.every((x, i) => x === r[i]);
    case "do-gati": return s.tags.every((x, i) => x === r[i]);
    case "aage": return s.pick === fasterOf(p);
    case "nikaalo": case "badlo": return s.at === want(p);
  }
}
/** does the set-up commit belief `mal` (and is it wrong)? */
export function holds(p: GatiParams, s: GatiState, mal: string): boolean {
  if (judge(p, s)) return false;
  switch (mal) {
    case "no-reference": return p.goal === "sandarbh" && s.place.every((x) => x === s.place[0]);
    case "curve-circular": {
      if (p.goal !== "prakaar") return false;
      const osc = p.things.map((th, i) => (PRAKAAR[th] === 2 ? i : -1)).filter((i) => i >= 0);
      return osc.some((i) => ARC.includes(p.things[i])) && osc.every((i) => s.place[i] === 1);
    }
    case "one-type": {
      if (p.goal !== "do-gati") return false;
      return p.things.some((th) => TWO.includes(th)) && p.things.every((th, i) => bitsOf(s.tags[i]).length === 1 && (DOGATI[th] as readonly number[]).includes(bitsOf(s.tags[i])[0]));
    }
    case "farther-faster": return p.goal === "aage" && fartherOf(p) >= 0 && s.pick === fartherOf(p);
    case "speed-distance": return p.goal === "nikaalo" && s.at === totalOf(p);
    case "multiply": return p.goal === "nikaalo" && s.at === totalOf(p) * p.legs.length;
    case "keeps-moving": return p.goal === "ek-saa" && p.movers.every((m, i) => (s.place[i] === 0) === m.gaps.every((g) => g > 0));
    case "same-totals": {
      if (p.goal !== "ek-saa") return false;
      const r = rightPlace(p), miss = p.movers.map((_, i) => i).filter((i) => s.place[i] !== r[i]);
      return miss.length > 0 && miss.every((i) => r[i] === 1 && s.place[i] === 0 && partnered(p, i));
    }
    case "uniform-slow": {
      if (p.goal !== "ek-saa") return false;
      const r = rightPlace(p), miss = p.movers.map((_, i) => i).filter((i) => s.place[i] !== r[i]);
      return miss.length > 0 && miss.every((i) => r[i] === 0 && s.place[i] === 1 && fast(p, i));
    }
  }
  return false;
}
/** ek-saa: an uneven mover that covers the same total distance in the same total time as a uniform one */
export const partnered = (p: EkSaaParams, i: number) => !uniform(p.movers[i]) && p.movers.some((m, j) => j !== i && uniform(m) && trailTotal(m) === trailTotal(p.movers[i]));
/** ek-saa: a uniform mover faster than every other mover (its equal gaps longer than any other's average gap) */
export const fast = (p: EkSaaParams, i: number) => uniform(p.movers[i]) && p.movers.every((m, j) => j === i || p.movers[i].gaps[0] > mean(m) + 1);

/** values the teacher may not say before the child finds them */
export function gatiHidden(level: PlayLevel<unknown>): string[] {
  const p = level.params as GatiParams | null;
  try {
    if (!p) return [];
    if (p.goal === "nikaalo" || p.goal === "badlo") return [String(want(p))];
    return [];
  } catch { return []; }
}

// ───────────────────────────── validate ─────────────────────────────
const LOOK = (x: unknown): Look | 0 => (x === 1 || x === 2 || x === 3 ? x : 0);
const PRAKAAR_THINGS = Object.keys(PRAKAAR) as PrakaarThing[];
const DOGATI_THINGS = Object.keys(DOGATI) as DoGatiThing[];
export const WHO_AAGE: Record<Units, readonly string[]> = { kmh: ["bus", "car", "train", "scooter"], ms: ["toycar", "robot", "runner"], mmin: ["cycle", "runner"] };
export const WHO_EKSAA = ["toycar", "robot", "metro", "marble", "auto", "cycle", "runner", "train"] as const;
export const BADLO_WHO = ["car", "train", "bus"] as const;
const uniq = <T>(xs: readonly T[]) => new Set(xs).size === xs.length;
const allInt = (xs: unknown, lo: number, hi: number) => Array.isArray(xs) && xs.every((x) => isInt(x) && x >= lo && x <= hi);

function validParams(goal: GatiGoal, q: Record<string, unknown>, look: Look): GatiParams | null {
  switch (goal) {
    case "sandarbh": {
      const story = q.story as Story, v = q.v, target = q.target, refs = q.refs as string[];
      // the watched thing is a person or a train (never the ground's things or a seat); a speed that keeps every trail on the scene
      if (!STORY_THINGS[story] || !isInt(v) || v < 10 || v > 20 || typeof target !== "string" || !STORY_THINGS[story].includes(target) || FIXED.includes(target)) return null;
      if (!Array.isArray(refs) || refs.length !== 3 || !uniq(refs) || !refs.every((r) => typeof r === "string" && STORY_THINGS[story].includes(r) && r !== target)) return null;
      // look 1: only the kit's own scenes (the train and the bus), only the things they name
      if (look === 1 && (story === "twin" || ![target, ...refs].every((x) => KIT_THINGS.includes(x)))) return null;
      const p: SandarbhParams = { goal, look, story, v, target, refs: [...refs] };
      const r = rightPlace(p);
      // at rest from one reference and moving from another (the kit's point)
      if (!r.includes(0) || !r.includes(1)) return null;
      if (story === "twin" && target !== "mytrain") return null;
      return p;
    }
    case "prakaar": {
      const things = q.things as PrakaarThing[], phase = q.phase as number[];
      if (!Array.isArray(things) || things.length < 3 || things.length > 4 || !uniq(things) || !things.every((t) => PRAKAAR_THINGS.includes(t))) return null;
      if (!allInt(phase, 0, 11) || phase.length !== things.length) return null;
      const types = new Set(things.map((t) => PRAKAAR[t]));
      // at least two types, and a to-and-fro thing on a curve (an arc)
      if (types.size < 2 || !things.some((t) => ARC.includes(t))) return null;
      return { goal, look, things: [...things], phase: [...phase] };
    }
    case "do-gati": {
      const things = q.things as DoGatiThing[], phase = q.phase as number[];
      if (!Array.isArray(things) || things.length < 2 || things.length > 3 || !uniq(things) || !things.every((t) => DOGATI_THINGS.includes(t))) return null;
      if (!allInt(phase, 0, 11) || phase.length !== things.length) return null;
      if (!things.some((t) => TWO.includes(t)) || things.every((t) => TWO.includes(t))) return null;
      return { goal, look, things: [...things], phase: [...phase] };
    }
    case "aage": {
      const units = q.units as Units, ms = q.movers as Mover[];
      if (!UNITS[units] || !Array.isArray(ms) || ms.length !== 2) return null;
      const movers: Mover[] = [];
      for (const m of ms) {
        if (!m || typeof m.who !== "string" || !WHO_AAGE[units].includes(m.who) || !isInt(m.v) || m.v < 1 || m.v > 400 || !isInt(m.T) || m.T < 1 || m.T > 6) return null;
        movers.push({ who: m.who, v: m.v, T: m.T });
      }
      if (movers[0].who === movers[1].who || movers[0].v === movers[1].v || movers[0].T === movers[1].T) return null;
      if (movers.some((m) => distOf(m) > 600)) return null;
      const p: AageParams = { goal, look, units, movers };
      // the faster mover never went farther (else the race is no test): farther and slower, or the same distance
      const far = fartherOf(p);
      if (far === fasterOf(p)) return null;
      return p;
    }
    case "nikaalo": {
      const units = q.units as Units, legs = q.legs as number[];
      if (!UNITS[units] || typeof q.who !== "string" || !WHO_AAGE[units].includes(q.who) || !allInt(legs, 1, 300) || legs.length < 2 || legs.length > 5) return null;
      const p: NikaaloParams = { goal, look, units, who: q.who, legs: [...legs] };
      const D = totalOf(p);
      if (!isInt(speedOf(p)) || D * legs.length > 999) return null;
      // look 3: a speed that changes (the kit's average speed); else the same distance every interval
      if ((look === 3) === legs.every((x) => x === legs[0])) return null;
      return p;
    }
    case "badlo": {
      const kmh = q.kmh;
      if (!isInt(kmh) || kmh < 18 || kmh > 144 || kmh % 18 !== 0 || typeof q.who !== "string" || !(BADLO_WHO as readonly string[]).includes(q.who)) return null;
      return { goal, look, who: q.who, kmh };
    }
    case "ek-saa": {
      const ms = q.movers as Trail[], dt = q.dt;
      if (!isInt(dt) || ![1, 2, 10].includes(dt) || !Array.isArray(ms) || ms.length < 3 || ms.length > 4) return null;
      const movers: Trail[] = [];
      for (const m of ms) {
        if (!m || typeof m.who !== "string" || !(WHO_EKSAA as readonly string[]).includes(m.who) || !allInt(m.gaps, 0, 14) || m.gaps.length < 4 || m.gaps.length > 5) return null;
        movers.push({ who: m.who, gaps: [...m.gaps] });
      }
      if (!movers.every((m) => m.gaps.length === movers[0].gaps.length) || !uniq(movers.map((m) => m.who))) return null;
      if (movers.some((m) => trailTotal(m) < 4 || trailTotal(m) > 60)) return null;
      const p: EkSaaParams = { goal, look, dt, movers };
      const r = rightPlace(p);
      if (!r.includes(0) || !r.includes(1)) return null;
      return p;
    }
  }
}
function validate(level: PlayLevel<unknown>): PlayLevel<GatiParams> | null {
  const q = level.params as Record<string, unknown> | null;
  if (!q || typeof q !== "object") return null;
  const mode = level.mode as GatiMode;
  if (!GATI_MODES.includes(mode) || !GOALS_OF[mode].includes(q.goal as GatiGoal)) return null;
  const look = LOOK(q.look);
  if (!look) return null;
  let p: GatiParams | null = null;
  try { p = validParams(q.goal as GatiGoal, q, look); } catch { p = null; }
  if (!p) return null;
  // rebuilt from its fields only (a tampered level never smuggles anything else in): every key must be the goal's own
  const keys: Record<GatiGoal, string[]> = { sandarbh: ["story", "v", "target", "refs"], prakaar: ["things", "phase"], "do-gati": ["things", "phase"], aage: ["units", "movers"], nikaalo: ["units", "who", "legs"], badlo: ["who", "kmh"], "ek-saa": ["dt", "movers"] };
  if (Object.keys(q).some((k) => k !== "goal" && k !== "look" && !keys[p!.goal].includes(k))) return null;
  return { ...level, params: p };
}

function init(level: PlayLevel<GatiParams>): GatiState {
  const n = lanesOf(level.params);
  return { t: 0, view: 0, seen: 0, place: Array(n).fill(-1), tags: Array(n).fill(0), pick: -1, chalk: level.params.goal === "aage" ? [-1, -1] : [], at: 0, ended: false, runs: 0, done: false, acts: 0, prev: null, depth: 0 };
}

const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });

function apply(level: PlayLevel<GatiParams>, s: GatiState, act: GatiAct, seq: number): { state: GatiState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  const bump = (st: GatiState): GatiState => ({ ...st, acts: s.acts + 1 });
  const no = (code: string) => ({ state: bump(s), moments: out, refused: code });
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  const change = (patch: Partial<GatiState>) => ({ state: bump(pushUndo(s, { ...s, ...patch, ended: false })), moments: out });
  const n = lanesOf(p);
  switch (act.kind) {
    case "tick": {
      if (s.t >= tMaxOf(p)) return no("clock_end");
      const t = s.t + 1;
      out.push(mom("progress", seq, { t }));
      return change({ t, seen: p.goal === "sandarbh" ? s.seen | (1 << s.view) : s.seen });
    }
    case "view": {
      if (p.goal !== "sandarbh" && p.goal !== "do-gati") return no("no_view");
      const r = Number(act.ref), top = p.goal === "sandarbh" ? p.refs.length : 2;
      if (!isInt(r) || r < 0 || r >= top) return no("bad_view");
      if (r === s.view) return no("same_view");
      // a reference watched with the clock already stepped: its trail is drawn at once, from the first tick
      return change({ view: r, seen: p.goal === "sandarbh" && s.t >= 1 ? s.seen | (1 << r) : s.seen });
    }
    case "put": {
      const bins = binsOf(p), lane = Number(act.lane), at = Number(act.at);
      if (!bins) return no("no_bins");
      if (!isInt(lane) || !isInt(at) || lane < 0 || lane >= n || at < 0 || at >= bins) return no("bad_slot");
      if (s.place[lane] === at) return no("same_slot");
      const place = [...s.place]; place[lane] = at;
      return change({ place });
    }
    case "tag": {
      if (p.goal !== "do-gati") return no("no_tags");
      const lane = Number(act.lane), ty = Number(act.at);
      if (!isInt(lane) || !isInt(ty) || lane < 0 || lane >= n || ty < 0 || ty > 2) return no("bad_tag");
      const tags = [...s.tags]; tags[lane] ^= 1 << ty;
      return change({ tags });
    }
    case "chalk": {
      // a mark where the mover is now, at the clock's time (a mover whose trip is over has stopped: where it stands says
      // nothing about how far it goes in this time)
      if (p.goal !== "aage") return no("no_chalk");
      const lane = Number(act.lane);
      if (!isInt(lane) || lane < 0 || lane >= n) return no("bad_lane");
      if (s.t < 1) return no("step_first");
      if (s.t > p.movers[lane].T) return no("trip_over");
      if (s.chalk[lane] === s.t) return no("same_chalk");
      const chalk = [...s.chalk]; chalk[lane] = s.t;
      out.push(mom("progress", seq, { lane, mark: s.t }));
      return change({ chalk });
    }
    case "pick": {
      if (p.goal !== "aage") return no("no_pick");
      const lane = Number(act.lane);
      if (!isInt(lane) || lane < 0 || lane >= n) return no("bad_lane");
      // the flag rests on the comparison: both movers marked for the same time
      if (!sameTimeMarks(s)) return no("mark_same_time_first");
      if (lane === s.pick) return no("same_pick");
      return change({ pick: lane });
    }
    case "mark": {
      const top = counterMax(p), at = Number(act.at);
      if (!top) return no("no_counter");
      if (!isInt(at) || at < 1 || at > top) return no("off_counter");
      if (at === s.at) return no("same_mark");
      return change({ at });
    }
    case "run": {
      if (s.ended) return no("change_first");
      if (s.t < tNeedOf(p)) return no(p.goal === "nikaalo" || p.goal === "ek-saa" ? "step_all_first" : "step_first");
      if (p.goal === "sandarbh" && p.refs.some((_, i) => !(s.seen & (1 << i)))) return no("watch_each");
      if (binsOf(p) && s.place.some((x) => x < 0)) return no("place_all_first");
      if (p.goal === "do-gati" && s.tags.some((x) => !x)) return no("tag_all_first");
      if (p.goal === "aage" && !sameTimeMarks(s)) return no("mark_same_time_first");
      if (p.goal === "aage" && s.pick < 0) return no("pick_first");
      if (counterMax(p) && !s.at) return no("mark_first");
      const runs = s.runs + 1, ok = judge(p, s);
      const end = bump({ ...s, ended: true, runs, done: ok });
      const f: Facts = { goal: p.goal, run: runs, t: s.t };
      if (ok) { out.push(mom("solved", seq, f)); return { state: end, moments: out }; }
      for (const mal of Object.keys(level.mal)) if (MAL_OF[p.goal].includes(mal) && holds(p, s, mal)) { out.push(mom("misconception_consequence", seq, f, mal)); return { state: end, moments: out, refused: "missed" }; }
      out.push(mom(nearOf(p, s) ? "near_miss" : "law_refused", seq, { ...f, why: "run_missed" }));
      return { state: end, moments: out, refused: "missed" };
    }
  }
  return no("unknown_act");
}
/** one lane off (with the clock stepped as needed) */
function nearOf(p: GatiParams, s: GatiState): boolean {
  const r = rightPlace(p);
  switch (p.goal) {
    case "sandarbh": case "prakaar": case "ek-saa": return n1(p) > 2 && s.place.filter((x, i) => x !== r[i]).length === 1;
    case "do-gati": return s.tags.filter((x, i) => x !== r[i]).length === 1 && n1(p) > 2;
    default: return false;
  }
}
const n1 = (p: GatiParams) => lanesOf(p);
const goalMet = (_l: PlayLevel<GatiParams>, s: GatiState) => s.done;

// ───────────────────────────── set-ups as acts ─────────────────────────────
export interface Setup { t?: number; views?: number[]; place?: number[]; tags?: number[]; pick?: number; at?: number; chalk?: number }
export function setupActs(p: GatiParams, su: Setup): GatiAct[] {
  const acts: GatiAct[] = [];
  const T = su.t ?? tNeedOf(p);
  if (p.goal === "aage") {
    // step to the marking time, chalk both lanes there, step on to T (never back), then flag
    const c = su.chalk ?? 1;
    for (let i = 0; i < c; i++) acts.push({ kind: "tick" });
    acts.push({ kind: "chalk", lane: 0 }, { kind: "chalk", lane: 1 });
    for (let i = c; i < Math.max(c, T); i++) acts.push({ kind: "tick" });
  } else if (p.goal === "sandarbh") {
    // step with the first reference, then watch from each other one
    for (let i = 0; i < T; i++) acts.push({ kind: "tick" });
    for (const r of su.views ?? p.refs.map((_, i) => i).slice(1)) acts.push({ kind: "view", ref: r });
  } else {
    for (let i = 0; i < T; i++) acts.push({ kind: "tick" });
    for (const r of su.views ?? []) acts.push({ kind: "view", ref: r });
  }
  (su.place ?? []).forEach((at, lane) => acts.push({ kind: "put", lane, at }));
  (su.tags ?? []).forEach((m, lane) => { for (const ty of bitsOf(m)) acts.push({ kind: "tag", lane, at: ty }); });
  if (su.pick !== undefined) acts.push({ kind: "pick", lane: su.pick });
  if (su.at !== undefined) acts.push({ kind: "mark", at: su.at });
  acts.push({ kind: "run" });
  return acts;
}
function replay(level: PlayLevel<GatiParams>, acts: GatiAct[]): { s: GatiState; ms: Moment[]; refused: string[] } {
  let s = init(level); const ms: Moment[] = [], refused: string[] = [];
  acts.forEach((a, i) => { const r = apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); });
  return { s, ms, refused };
}
function solveSetup(p: GatiParams): Setup {
  switch (p.goal) {
    case "sandarbh": case "prakaar": case "ek-saa": return { place: rightPlace(p) };
    case "do-gati": return { views: [1], tags: rightPlace(p) };
    case "aage": return { pick: fasterOf(p) };
    case "nikaalo": case "badlo": return { at: want(p) };
  }
}
function solve(level: PlayLevel<GatiParams>): GatiAct[] | null {
  const acts = setupActs(level.params, solveSetup(level.params)), r = replay(level, acts);
  return r.s.done && !r.refused.length ? acts : null;
}
/** the set-up a child holding `mal` commits */
function rawMal(p: GatiParams, mal: string): Setup | null {
  if (!MAL_OF[p.goal].includes(mal)) return null;
  const r = rightPlace(p);
  switch (mal) {
    // "sitting still, so not moving at all": at rest from every reference
    case "no-reference": return p.goal === "sandarbh" ? { place: r.map(() => 0) } : null;
    case "curve-circular": return p.goal === "prakaar" ? { place: p.things.map((th) => (PRAKAAR[th] === 2 ? 1 : PRAKAAR[th])) } : null;
    // each thing one type: the bicycle only straight ahead, the horse only round
    case "one-type": return p.goal === "do-gati" ? { tags: p.things.map((th) => maskOf([DOGATI[th][0]])) } : null;
    // the marks placed (the flag needs them), then the clock stepped to the end: the totals, not the marks, decide
    case "farther-faster": return p.goal === "aage" && fartherOf(p) >= 0 ? { t: tMaxOf(p), chalk: 1, pick: fartherOf(p) } : null;
    case "speed-distance": return p.goal === "nikaalo" ? { at: totalOf(p) } : null;
    case "multiply": return p.goal === "nikaalo" ? { at: totalOf(p) * p.legs.length } : null;
    case "keeps-moving": return p.goal === "ek-saa" ? { place: p.movers.map((m) => (m.gaps.every((g) => g > 0) ? 0 : 1)) } : null;
    case "same-totals": return p.goal === "ek-saa" ? { place: p.movers.map((_, i) => (partnered(p, i) ? 0 : r[i])) } : null;
    case "uniform-slow": return p.goal === "ek-saa" ? { place: p.movers.map((_, i) => (fast(p, i) ? 1 : r[i])) } : null;
  }
  return null;
}
/** the acts of a child holding `mal`, or null: no reading here, not legal, would solve, or another of the goal's beliefs
 *  holds for the very same set-up (a signature names ONE belief) */
export function gatiMalActs(level: PlayLevel<GatiParams>, mal: string): GatiAct[] | null {
  const p = level.params, su = rawMal(p, mal);
  if (!su) return null;
  if (p.goal === "do-gati") su.views = [1];
  const acts = setupActs(p, su);
  const r = replay({ ...level, mal: { [mal]: "x" } }, acts);
  if (r.s.done || r.refused.length !== 1 || r.refused[0] !== "missed") return null;
  if (!r.ms.some((m) => m.kind === "misconception_consequence" && m.misconceptionId === mal)) return null;
  if (MAL_OF[p.goal].some((o) => o !== mal && holds(p, r.s, o))) return null;
  return acts;
}
/** set-ups that win without the idea; a level any of them solves is never served */
export function shortcutSetups(p: GatiParams): Setup[] {
  const n = lanesOf(p);
  switch (p.goal) {
    case "sandarbh": case "ek-saa": return [{ place: Array(n).fill(0) }, { place: Array(n).fill(1) }];
    case "prakaar": return [0, 1, 2].map((b) => ({ place: Array(n).fill(b) }));
    // one type each, every thing its first: the two-type thing is then short of one
    case "do-gati": return [{ views: [1], tags: p.things.map((th) => maskOf([DOGATI[th][0]])) }, { views: [1], tags: Array(n).fill(7) }];
    case "aage": return fartherOf(p) >= 0 ? [{ pick: fartherOf(p) }] : [{ pick: p.movers[0].T > p.movers[1].T ? 0 : 1 }];
    // (a changing speed: the last interval's distance read as the speed)
    case "nikaalo": return [{ at: totalOf(p) }, { at: totalOf(p) * p.legs.length }, ...(p.look === 3 ? [{ at: p.legs[p.legs.length - 1] }, { at: p.legs[0] }] : [])].filter((x) => x.at <= 999);
    // the speedometer's own number in m/s
    case "badlo": return p.kmh <= 99 ? [{ at: p.kmh }] : [];
  }
}
function shortcut(level: PlayLevel<GatiParams>): GatiAct[] | null {
  const p = level.params;
  for (const su of shortcutSetups(p)) {
    // nikaalo look 3: the last interval's distance can be the average by chance; the generator never serves such a level
    const acts = setupActs(p, su);
    if (replay(level, acts).s.done) return acts;
  }
  return null;
}

// ───────────────────────────── generate ─────────────────────────────
const JITTER = 0.2, clamp01 = (x: number) => Math.max(0, Math.min(1, x));
function shuffle<T>(xs: readonly T[], rnd: () => number): T[] { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/** ek-saa templates: the kinds of mover in a level (U slow uniform, F fast uniform, X uneven with U's total, M slowing
 *  down, S speeding up, A stopping and starting) */
const TEMPLATES: Record<1 | 2, readonly string[][]> = {
  1: [["U", "X", "M"], ["F", "U", "M"], ["U", "A", "M"], ["F", "A", "S"], ["U", "X", "S"]],
  2: [["U", "X", "M", "F"], ["U", "A", "M", "F"], ["U", "X", "S", "A"], ["F", "U", "M", "S"], ["U", "X", "M", "A"]],
};
const WHO_OF: Record<string, readonly string[]> = { U: ["robot", "toycar"], F: ["train", "metro"], X: ["runner", "cycle"], M: ["marble"], S: ["metro", "cycle"], A: ["auto"] };

function difficultyOf(p: GatiParams): number {
  const f = 0.08 * (p.look - 1);
  switch (p.goal) {
    case "sandarbh": return 0.3 + f + 0.05 * p.refs.length + (RIDES[p.target] < 0 ? 0.03 : 0);
    case "prakaar": return 0.3 + f + 0.04 * p.things.length;
    case "do-gati": return 0.35 + f + 0.04 * p.things.length;
    case "aage": return 0.3 + f + (fartherOf(p) < 0 ? 0.05 : 0.08);
    case "nikaalo": return 0.3 + f + 0.03 * p.legs.length;
    case "badlo": return 0.3 + f + 0.002 * p.kmh;
    case "ek-saa": return 0.3 + f + 0.04 * p.movers.length;
  }
}

function generate(req: GenRequest): Candidate<GatiParams>[] {
  const mode = GATI_MODES.find((m) => m === req.mode) ?? "drishti";
  const goal = (GOALS_OF[mode].includes(req.goal as GatiGoal) ? req.goal : GOALS_OF[mode][0]) as GatiGoal;
  const rnd = mulberry32(req.seed), out: Candidate<GatiParams>[] = [], seen = new Set<string>();
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const pickOf = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
  const look = (req.fade === 2 || req.fade === 3 ? req.fade : 1) as Look;
  const mk = (params: GatiParams, sig: string): Candidate<GatiParams> => ({
    signature: sig,
    // a seeded nudge (± JITTER / 2): the picker takes the level nearest its band, so without it every child met the same
    // first level
    difficulty: clamp01(difficultyOf(params) + (rnd() - 0.5) * JITTER),
    level: { v: "play@1", levelId: `gati-${sig}-${req.seed}`.replace(/[^a-z0-9:/.,_-]/gi, "_").slice(0, 120), family: "gati", mode, topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: "gati", seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 3, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } },
  });
  for (let k = 0; k < 220 && out.length < 24; k++) {
    let params: GatiParams | null = null, sig = "";
    if (goal === "sandarbh") {
      const story = pickOf<Story>(look === 1 ? ["train", "bus"] : ["train", "bus", "twin"]);
      // look 1: only the things the kit's own scenes name; three reference cards at every look
      const things = STORY_THINGS[story].filter((t) => look > 1 || KIT_THINGS.includes(t)), v = pickOf([12, 15, 18]);
      const target = story === "twin" ? "mytrain" : pickOf(things.filter((t) => !FIXED.includes(t)));
      const rest = things.filter((t) => t !== target && restFrom(story, v, target, t)), move = things.filter((t) => t !== target && !restFrom(story, v, target, t));
      if (!rest.length || !move.length) continue;
      const refs = [pickOf(rest), pickOf(move)];
      const more = things.filter((t) => t !== target && !refs.includes(t));
      if (!more.length) continue;
      refs.push(pickOf(more));
      const rs = shuffle(refs, rnd);
      params = { goal, look, story, v, target, refs: rs }; sig = `sandarbh:${story}:${target}:${rs.join(",")}:${v}`;
    } else if (goal === "prakaar") {
      const n = look === 1 ? 3 : 4;
      const arc = pickOf(ARC), circ = pickOf(PRAKAAR_THINGS.filter((t) => PRAKAAR[t] === 1)), lin = pickOf(PRAKAAR_THINGS.filter((t) => PRAKAAR[t] === 0));
      let things: PrakaarThing[] = [arc, circ, lin];
      if (n === 4) { const more = PRAKAAR_THINGS.filter((t) => !things.includes(t)); things.push(pickOf(more)); }
      things = shuffle(things, rnd);
      const phase = things.map((t) => (PERIOD[t] ? int(0, PERIOD[t] - 1) : 0));
      params = { goal, look, things, phase }; sig = `prakaar:${things.join(",")}:${phase.join("")}`;
    } else if (goal === "do-gati") {
      const twos = look === 3 ? shuffle(TWO, rnd) : [pickOf(TWO)];
      const ones = shuffle(DOGATI_THINGS.filter((t) => !TWO.includes(t)), rnd).slice(0, look === 1 ? 1 : 3 - twos.length);
      const things = shuffle([...twos, ...ones], rnd);
      const phase = things.map(() => int(0, 11));
      params = { goal, look, things, phase }; sig = `do-gati:${things.join(",")}:${phase.join(".")}`;
    } else if (goal === "aage") {
      const units = pickOf<Units>(look === 1 ? ["kmh"] : ["kmh", "ms", "mmin"]);
      const vs = units === "kmh" ? [20, 30, 40, 50, 60, 80] : units === "ms" ? [2, 3, 4, 5, 6, 8] : [100, 150, 200, 250, 300];
      const same = rnd() < 0.2;
      const [a, b] = shuffle(vs, rnd).slice(0, 2).sort((x, y) => x - y);   // a slower than b
      let Ta = 0, Tb = 0;
      if (same) {
        // the same distance in different times: the slower one takes longer
        const D = a * b / gcd(a, b); Ta = D / a; Tb = D / b;
      } else { Tb = int(1, 3); Ta = int(Tb + 1, Math.min(6, Tb + 3)); }
      if (!isInt(Ta) || !isInt(Tb) || Ta > 6 || Tb < 1 || Ta === Tb) continue;
      if (!same && a * Ta <= b * Tb) continue;   // the slower one went farther
      const whos = shuffle(WHO_AAGE[units], rnd);
      const ms: Mover[] = shuffle([{ who: whos[0], v: a, T: Ta }, { who: whos[1], v: b, T: Tb }], rnd);
      params = { goal, look, units, movers: ms }; sig = `aage:${units}:${ms.map((m) => `${m.who}${m.v}x${m.T}`).join(",")}`;
    } else if (goal === "nikaalo") {
      const units = pickOf<Units>(look === 1 ? ["kmh"] : ["kmh", "ms", "mmin"]);
      const T = int(2, look === 1 ? 3 : 4), who = pickOf(WHO_AAGE[units]);
      const v = units === "kmh" ? pickOf([20, 30, 40, 45, 50, 60, 75, 80]) : units === "ms" ? int(2, 9) : pickOf([60, 80, 100, 120, 150]);
      let legs = Array(T).fill(v) as number[];
      if (look === 3) {
        // a speed that changes on the way: legs around v, the total still T·v (the kit's average speed)
        const step = units === "ms" ? 1 : units === "kmh" ? 10 : 20;
        legs = legs.map((x, i) => x + (i % 2 ? -1 : 1) * step * int(1, 2));
        legs[T - 1] = v * T - legs.slice(0, -1).reduce((x, y) => x + y, 0);
        legs = shuffle(legs, rnd);
        if (legs.some((x) => x < 1) || legs.every((x) => x === legs[0]) || legs[0] === v || legs[T - 1] === v) continue;
      }
      params = { goal, look, units, who, legs }; sig = `nikaalo:${units}:${who}:${legs.join(".")}`;
    } else if (goal === "badlo") {
      const kmh = 18 * pickOf(look === 1 ? [1, 2, 3, 4] : [1, 2, 3, 4, 5, 6, 8]), who = pickOf(BADLO_WHO);
      params = { goal, look, who, kmh }; sig = `badlo:${who}:${kmh}`;
    } else {
      const tpl = pickOf(TEMPLATES[look === 1 ? 1 : 2]), N = look === 3 ? 5 : 4, dt = pickOf([1, 2, 10]);
      const U = int(2, 4), totals = new Set<number>();
      const movers: Trail[] = [], used = new Set<string>();
      let ok = true;
      for (const kd of tpl) {
        let gaps: number[] = [];
        if (kd === "U") gaps = Array(N).fill(U);
        else if (kd === "F") gaps = Array(N).fill(int(9, 12));
        else if (kd === "X") {
          // the same total as U, the gaps uneven (the kit's runners P and Q: both finish in the same time)
          const tot = U * N; gaps = Array(N).fill(1); let left = tot - N;
          while (left > 0) { const i = int(0, N - 1); if (gaps[i] < 2 * U + 1) { gaps[i]++; left--; } }
          if (gaps.every((g) => g === gaps[0])) { ok = false; break; }
        } else if (kd === "M") { const d = int(1, 2), s0 = d * (N - 1) + int(1, 3); gaps = [...Array(N).keys()].map((i) => s0 - d * i); }
        else if (kd === "S") { const d = int(1, 2), s0 = int(1, 2); gaps = [...Array(N).keys()].map((i) => s0 + d * i); }
        else { gaps = [...Array(N).keys()].map(() => int(2, 6)); gaps[int(1, N - 2)] = 0; if (new Set(gaps.filter((g) => g)).size < 2) { ok = false; break; } }
        const who = WHO_OF[kd].find((w) => !used.has(w));
        if (!who) { ok = false; break; }
        used.add(who);
        // only a designated partner shares a uniform mover's total
        const tot = gaps.reduce((a, b) => a + b, 0);
        if (kd !== "X" && kd !== "U" && totals.has(tot)) { ok = false; break; }
        if (kd === "U" || kd === "F") totals.add(tot);
        movers.push({ who, gaps });
      }
      if (!ok) continue;
      // a non-partner never shares a uniform total
      if (movers.some((m, i) => !uniform(m) && tpl[i] !== "X" && movers.some((u) => uniform(u) && trailTotal(u) === trailTotal(m)))) continue;
      const ms = shuffle(movers, rnd);
      params = { goal, look, dt, movers: ms }; sig = `ek-saa:${ms.map((m) => `${m.who}${m.gaps.join(".")}`).join(",")}`;
    }
    if (!params || seen.has(sig)) continue;
    seen.add(sig);
    const cand = mk(params, sig), v = validate(cand.level);
    if (!v || !solve(v) || shortcut(v)) continue;
    out.push(cand);
  }
  return out;
}
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

// ───────────────────────────── facts / board / grade ─────────────────────────────
function facts(level: PlayLevel<GatiParams>, s: GatiState): Facts {
  const p = level.params, f: Facts = { goal: p.goal, clock: s.t };
  if (p.goal === "sandarbh") f.watching_from = p.refs[s.view];
  if (p.goal === "do-gati") f.watching_from = s.view ? "riding along" : "the ground";
  if (binsOf(p)) f.placed = s.place.filter((x) => x >= 0).length;
  if (p.goal === "do-gati") f.ticked = s.tags.filter((x) => x).length;
  if (p.goal === "aage") { f.marked = s.chalk.filter((c) => c >= 0).length; if (sameTimeMarks(s)) f.marks_at = s.chalk[0]; }
  if (p.goal === "aage" && s.pick >= 0) f.flagged = p.movers[s.pick].who;
  if (s.at) f.reading = s.at;
  if (s.runs) f.runs = s.runs;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<GatiParams>, s: GatiState) {
  const p = level.params, lines: string[] = [`clock: ${s.t}`];
  switch (p.goal) {
    case "sandarbh": lines.push(`watching the ${p.target} from the ${p.refs[s.view]}`, ...p.refs.map((r, i) => `from the ${r}: ${s.place[i] < 0 ? "–" : s.place[i] ? "moving" : "at rest"}`)); break;
    case "prakaar": lines.push(...p.things.map((_, i) => `light ${i + 1} → ${s.place[i] < 0 ? "–" : TYPES[s.place[i]]}`)); break;
    case "do-gati": lines.push(...p.things.map((th, i) => `${th}: ${bitsOf(s.tags[i]).map((x) => TYPES[x]).join(" + ") || "–"}`)); break;
    case "aage": lines.push(...p.movers.map((m, i) => `${m.who}: ${posOf(m, s.t)} ${UNITS[p.units].d} after ${s.t} ${UNITS[p.units].t}; mark ${s.chalk[i] < 0 ? "–" : `${posOf(m, s.chalk[i])} ${UNITS[p.units].d} at ${s.chalk[i]} ${UNITS[p.units].t}`}`), `faster: ${s.pick < 0 ? "–" : p.movers[s.pick].who}`); break;
    case "nikaalo": lines.push(`${p.who}: ${p.legs.slice(0, s.t).reduce((a, b) => a + b, 0)} ${UNITS[p.units].d} after ${s.t} ${UNITS[p.units].t}`, `speedometer: ${s.at || "–"} ${UNITS[p.units].v}`); break;
    case "badlo": lines.push(`speedometer ${p.kmh} km/h; ${msOf(p.kmh) * s.t} m after ${s.t} s`, `m/s: ${s.at || "–"}`); break;
    case "ek-saa": lines.push(...p.movers.map((m, i) => `${m.who}: ${m.gaps.slice(0, s.t).join(", ")} m → ${s.place[i] < 0 ? "–" : s.place[i] ? "non-uniform" : "uniform"}`)); break;
  }
  return { title: "Gati", lines };
}
function grade(level: PlayLevel<GatiParams>, acts: PlayActEnvelope<GatiAct>[]): PlayGrade {
  return gradeLevel(gatiLogic, level, acts, { decisiveRefusals: ["missed"], final: true });
}

export const gatiLogic: FamilyLogic<GatiParams, GatiState, GatiAct> = {
  family: "gati", modes: GATI_MODES, malRules: GATI_MAL,
  // round 8 law 3 (dc-r8-game-modes-three-laws): mix-ups these goals see from ONE pick among five or fewer (a tool, a
  // bin, a lane, a claim; server/forge3/qa/laws.mjs found each): reported at chance weight, named only on a repeat
  chancePicks: ["do-gati:one-type", "prakaar:curve-circular", "ek-saa:keeps-moving", "ek-saa:same-totals", "ek-saa:uniform-slow"],
  validate, init, apply, goalMet, generate, solve, shortcut, malActs: gatiMalActs, grade, facts, board,
};
