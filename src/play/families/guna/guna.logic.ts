// Guna (गुणा, "multiply") · round 7, multi-digit multiplication and division (classes 4-5). Nothing runs on a clock: every
// cut, crate, deal and count is the child's act, and the law answers only on "run". One law per mode, each a real thing:
//   field/area    a field a × b (34 × 26) is cut by the child into place-value strips on each side (34 = 30 + 4, 26 = 20 + 6):
//                 a piece whose two sides are each one digit of tens / ones / hundreds fills with its tiles (30 × 20 is 3 × 2
//                 hundred-tiles; 30 × 6 is 3 × 6 ten-tiles; 4 × 6 is 4 × 6 one-tiles); a piece cut anywhere else stays bare.
//                 The truck's racks take crates of 1, 10, 100, 1000, 10000 (nine at most on a rack: ten crates are packed as
//                 one of the next place); on "run" it drives onto the weighbridge, which must read exactly a × b
//   field/round   about a × b: the child stretches / shrinks each side to a round length (48 → 50, 21 → 20), the round field
//                 fills with its tiles, and the truck is loaded with about that much; the bridge checks the nearest round
//                 sides and their product
//   pack/share    a godown of crates (618 = 6 hundreds, 1 ten, 8 ones) is shared into b trucks: one deal puts one crate of a
//                 place into EVERY truck (so the trucks are always equal); a crate that cannot go round is opened into ten of
//                 the next place down (the regrouping IS the move); on "send" the trucks leave, and what stays on the dock
//                 must be less than one round
//   story/all     n things, c to a vehicle, everyone must go: set out the vehicles, then run: nobody may be left on the dock,
//                 and no vehicle may leave empty (round UP)
//   story/full    only full packets count: set out the packets, then run: every packet full, and not enough left for one more
//                 (round DOWN)
//   story/left    full packets go to the shop, the rest to the jar: put the rest in the jar first, then the machine packs what
//                 is left into full packets; nothing may be left over in the machine and the jar may not hold a full packet
//   field/area (big, r7 guna2)  both sides round and the truck 6..7 racks (3000 × 400): the field fills with 3 × 4 tiles of
//                 1000 × 100 each, and the truck (crates up to 10^6, shown as columns) must weigh exactly the product: the zeros
//                 of both sides ARE the tile's size, so counting zeros is choosing the rack
//   field/check   is a claimed answer reasonable? the child pulls the sides to round lengths and loads the estimate (as round),
//                 then marks each of three dockets (a × b written by someone: the true product, ten times it, a tenth of it)
//                 "could be right" or "send back"; the bridge checks the estimate and every mark (an answer near the
//                 estimate is fine even though it is not equal to it; one a place away is not)
//   pack/each     equal sharing at small numbers (class 4): loose things on the dock, one deal gives one to EVERY friend; on
//                 "send" what stays must be less than one round (the godown of share with one place and nothing to open)
// Mal-rules (each a deterministic set-up; a level serves one only where it differs from every other one of the goal's):
//   adds-ten      area: × 10 taken as + 10 (45 × 10 → 55)
//   ones-only     area: only the ones multiplied, the tens digit brought down (23 × 4 → 2 | 12 → 212)
//   no-carry      area: each digit's product written side by side (27 × 3 → 6 | 21 → 621)
//   forget-carry  area: the carried tens not added (56 × 7 → 35 | 2 → 352; 56 × 40 → 2040)
//   no-zero       area: the tens digit's product without its zero (34 × 21 → 34 + 68 = 102; 23 × 40 → 92)
//   diagonal      area: only tens × tens and ones × ones (34 × 26 → 600 + 24 = 624)
//   zero-count    area (round × round) / round: a zero lost when the basic fact ends in 0 (50 × 40 → 200)
//   digitwise     share: each place shared on its own, never opened (what cannot go round is left on the dock)
//   short         share / full: a round less than can be made (the leftover is as big as a share or bigger)
//   drop          all: the leftover dropped (130 children, 40 a bus → 3 buses)
//   up            full: always one more (a packet not full)
//   quotient      left: the number of packets put in the jar, not the leftover
//   zero-less     area / round (both sides round, the basic fact NOT ending in 0): one zero too few (3000 × 400 → 1,20,000)
//   zero-more     area / round (both sides round): one zero too many (3000 × 200 → 60,00,000), where it fits the truck
//   trusts        check: every docket kept (the steps were followed, so it must be right)
//   must-equal    check: every docket sent back (none equals the estimate)
import type { Candidate, Facts, FamilyLogic, GenRequest, GunaAct, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export type GunaMode = "field" | "pack" | "story";
export type GunaGoal = "area" | "round" | "check" | "share" | "each" | "all" | "full" | "left";
export interface GunaParams {
  goal: GunaGoal;
  /** the fade: 1 tiles drawn one by one and every place named · 2 tiles drawn, fewer names · 3 a filled piece shows only its place colour */
  face: 1 | 2 | 3;
  /** field: the two sides (a across, b down) · pack: the godown's number and the trucks · story: the things and how many go in one */
  a: number; b: number;
  /** story / each: which story (0..2 per goal) · check: the dockets' order (0..5); else 0 */
  ctx: number;
}
export interface GunaState extends Undoable<GunaState> {
  /** field/area: the cut positions on side a (across) and side b (down), ascending */
  cx: number[]; cy: number[];
  /** field/round: the sides as the child has set them (0 = not yet) */
  ra: number; rb: number;
  /** field: crates on the truck per place (index 0 = ones), 0..9 each */
  crates: number[];
  /** pack: the godown's crates per place (index 0 = ones); each truck's crates per place (all trucks the same) */
  dock: number[]; truck: number[];
  /** story: vehicles / packets set out, or the jar's count */
  n: number;
  /** check: each docket's mark (0 none, 1 could be right, 2 send back) */
  marks: number[];
  ended: boolean; runs: number; done: boolean; acts: number;
}

export const GUNA_MAL = ["adds-ten", "ones-only", "no-carry", "forget-carry", "no-zero", "diagonal", "zero-count", "digitwise", "short", "drop", "up", "quotient",
  "zero-less", "zero-more", "trusts", "must-equal"] as const;
const MAL_OF: Record<GunaGoal, readonly string[]> = {
  area: ["adds-ten", "ones-only", "no-carry", "forget-carry", "no-zero", "diagonal", "zero-count", "zero-less", "zero-more"],
  round: ["zero-count", "zero-less", "zero-more"],
  check: ["trusts", "must-equal"],
  share: ["digitwise", "short"],
  each: ["short"],
  all: ["drop"],
  full: ["up", "short"],
  left: ["quotient"],
};
const GOALS_OF: Record<GunaMode, readonly GunaGoal[]> = { field: ["area", "round", "check"], pack: ["share", "each"], story: ["all", "full", "left"] };
/** RACKS: the most racks a truck has (r7 guna2: 7, up to crates of 10^6, for class 7's 3000 × 400; every earlier level has
 *  at most 5, and a truck of more than 5 is drawn as columns); DOCKETS: a check level's claimed answers */
export const MAX_CUTS = 3, STORY_MAX = 99, RACK = 9, RACKS = 7, DOCKETS = 3;

const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
/** decimal digits of x (1 for 0..9) */
export const digits = (x: number) => String(Math.abs(Math.trunc(x))).length;
/** one non-zero digit followed only by zeros (4, 30, 200, 6000): a side part that tiles */
export const isRound = (x: number) => isInt(x) && x > 0 && /^[1-9]0*$/.test(String(x));
/** the place unit of a round part (30 → 10) and its digit (30 → 3) */
export const unitOf = (x: number) => 10 ** (digits(x) - 1);
export const leadOf = (x: number) => Math.floor(x / unitOf(x));
/** the parts a side is cut into, in order from the corner */
export function partsOf(len: number, cuts: readonly number[]): number[] {
  const out: number[] = []; let last = 0;
  for (const c of cuts) { out.push(c - last); last = c; }
  out.push(len - last);
  return out;
}
/** every piece of the field tiles: each side's parts are all round */
export const fieldTiled = (a: number, b: number, cx: readonly number[], cy: readonly number[]) => partsOf(a, cx).every(isRound) && partsOf(b, cy).every(isRound);
/** the nearest round length at the side's own leading place (48 → 50, 21 → 20, 348 → 300) */
export const roundSide = (x: number) => { const u = unitOf(x); return Math.round(x / u) * u; };
/** the value of a place-value vector (index 0 = ones) */
export const valueOf = (v: readonly number[]) => v.reduce((s, c, i) => s + c * 10 ** i, 0);
/** the digits of x as a place vector of `n` places (index 0 = ones) */
export const placesOf = (x: number, n: number) => Array.from({ length: n }, (_, i) => Math.floor(x / 10 ** i) % 10);
/** the truck's racks: one per place of the biggest product the sides can make */
export function racksOf(p: Pick<GunaParams, "goal" | "a" | "b">): number {
  if (p.goal === "round" || p.goal === "check") return digits(roundSide(p.a)) + digits(roundSide(p.b));
  return digits(p.a) + digits(p.b);
}

/** THE ANSWER the law compares with */
export function want(p: GunaParams): number {
  switch (p.goal) {
    case "area": return p.a * p.b;
    case "round": case "check": return roundSide(p.a) * roundSide(p.b);
    case "share": case "each": return Math.floor(p.a / p.b);
    case "all": return Math.ceil(p.a / p.b);
    case "full": return Math.floor(p.a / p.b);
    case "left": return p.a % p.b;
  }
}

/** a set-up: what the child commits before the run (field: the load and the sides; pack: the dock left; story: the count) */
export interface Setup { load?: number; ra?: number; rb?: number; dock?: number[]; n?: number; marks?: number[] }
const sameVec = (x: readonly number[] = [], y: readonly number[] = []) => x.length === y.length && x.every((v, i) => v === y[i]);
const sameSetup = (x: Setup, y: Setup) => x.load === y.load && x.ra === y.ra && x.rb === y.rb && x.n === y.n && sameVec(x.dock, y.dock) && sameVec(x.marks, y.marks);
/** check: the three dockets in the level's order: the true product, ten times it, a tenth of it (rounded down); `ok` is
 *  whether the answer could be right (the true one) */
const PERMS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]] as const;
export function dockets(p: Pick<GunaParams, "a" | "b" | "ctx">): { v: number; ok: boolean }[] {
  const all = [{ v: p.a * p.b, ok: true }, { v: p.a * p.b * 10, ok: false }, { v: Math.floor((p.a * p.b) / 10), ok: false }];
  return (PERMS[p.ctx] ?? PERMS[0]).map((i) => all[i]);
}
/** check: the marks that are right (1 could be right, 2 send back) */
export const rightMarks = (p: Pick<GunaParams, "a" | "b" | "ctx">) => dockets(p).map((d) => (d.ok ? 1 : 2));
/** pack: the godown's crates per place (each: one place of loose things) */
const dockOf = (p: Pick<GunaParams, "goal" | "a">) => (p.goal === "each" ? [p.a] : placesOf(p.a, digits(p.a)));
const godown = (g: GunaGoal) => g === "share" || g === "each";
/** THE judgement of a run (pack: what the trucks hold is equal by construction; the dock must be less than one round) */
export function judge(p: GunaParams, s: Setup): boolean {
  if (p.goal === "area") return s.load === p.a * p.b;
  if (p.goal === "round") return s.ra === roundSide(p.a) && s.rb === roundSide(p.b) && s.load === want(p);
  if (p.goal === "check") return s.ra === roundSide(p.a) && s.rb === roundSide(p.b) && s.load === want(p) && sameVec(s.marks, rightMarks(p));
  if (godown(p.goal)) return !!s.dock && valueOf(s.dock) < p.b;
  return s.n === want(p);
}

// ── the long division a godown is shared by (the solver, and the beliefs' own ways of sharing) ──
/** the acts that share the godown: from the top place down, deal every round that goes; when `open`, open what is left
 *  into the place below before moving down. `stopShort` leaves the last ones round undealt. */
function shareActs(p: GunaParams, open: boolean, stopShort = false): { acts: GunaAct[]; dock: number[] } {
  const dock = dockOf(p), acts: GunaAct[] = [];
  for (let pl = dock.length - 1; pl >= 0; pl--) {
    while (dock[pl] >= p.b) { dock[pl] -= p.b; acts.push({ kind: "deal", place: pl }); }
    if (open && pl > 0) while (dock[pl] > 0) { dock[pl]--; dock[pl - 1] += 10; acts.push({ kind: "open", place: pl }); }
  }
  if (stopShort) {
    const last = acts.map((a) => a.kind === "deal" && a.place === 0).lastIndexOf(true);
    if (last < 0) return { acts: [], dock: [] };
    acts.splice(last, 1); dock[0] += p.b;
  }
  return { acts, dock };
}

/** the load a belief puts on the truck (field), or null when it has no reading here */
function beliefLoad(p: GunaParams, mal: string): number | null {
  const { a, b } = p;
  const two = a >= 10 && a <= 99, aT = Math.floor(a / 10), aO = a % 10;
  switch (mal) {
    case "adds-ten": return b === 10 ? a + 10 : null;
    case "ones-only": return two && b <= 9 && aO * b >= 10 ? Number(`${aT}${aO * b}`) : null;
    case "no-carry": return two && b <= 9 && aO * b >= 10 ? Number(`${aT * b}${aO * b}`) : null;
    case "forget-carry": {
      if (!two || !isRound(b)) return null;
      const d = leadOf(b), u = unitOf(b);
      return aO * d >= 10 ? (aT * d * 10 + ((aO * d) % 10)) * u : null;
    }
    case "no-zero": {
      // the shift error lives in a 2-digit × tens multiplication; with both sides round it is the zero-count belief's set-up
      if (b < 10 || b > 99 || isRound(a)) return null;
      const bT = Math.floor(b / 10), bO = b % 10;
      return a * bO + a * bT;
    }
    case "diagonal": {
      if (!two || b < 10 || b > 99 || b % 10 === 0 || aO === 0) return null;
      return aT * Math.floor(b / 10) * 100 + aO * (b % 10);
    }
    case "zero-count": {
      const x = p.goal === "round" ? roundSide(a) : a, y = p.goal === "round" ? roundSide(b) : b;
      if (!isRound(x) || !isRound(y) || (leadOf(x) * leadOf(y)) % 10 !== 0) return null;
      return (x * y) / 10;
    }
    // r7 guna2: the attached zeros miscounted (the basic fact's own zero is zero-count's): one too few, one too many
    case "zero-less": case "zero-more": {
      const x = p.goal === "round" ? roundSide(a) : a, y = p.goal === "round" ? roundSide(b) : b;
      if (!isRound(x) || !isRound(y) || x < 10 || y < 10) return null;
      if (mal === "zero-less") return (leadOf(x) * leadOf(y)) % 10 === 0 ? null : (x * y) / 10;
      return x * y * 10;
    }
  }
  return null;
}
function rawMal(p: GunaParams, mal: string): Setup | null {
  if (!MAL_OF[p.goal].includes(mal)) return null;
  if (p.goal === "area") { const v = beliefLoad(p, mal); return v === null ? null : { load: v }; }
  if (p.goal === "round") { const v = beliefLoad(p, mal); return v === null ? null : { ra: roundSide(p.a), rb: roundSide(p.b), load: v }; }
  if (p.goal === "check") return { ra: roundSide(p.a), rb: roundSide(p.b), load: want(p), marks: new Array(DOCKETS).fill(mal === "trusts" ? 1 : 2) };
  if (godown(p.goal)) {
    if (mal === "digitwise") return { dock: shareActs(p, false).dock };
    const s = shareActs(p, true, true); return s.acts.length ? { dock: s.dock } : null;
  }
  const q = Math.floor(p.a / p.b);
  switch (mal) {
    case "drop": return { n: q };
    case "up": return { n: q + 1 };
    case "short": return { n: q - 1 };
    case "quotient": return { n: q };
  }
  return null;
}
function legal(p: GunaParams, s: Setup): boolean {
  if (p.goal === "area" || p.goal === "round" || p.goal === "check") {
    if (!isInt(s.load) || s.load <= 0 || s.load >= 10 ** racksOf(p)) return false;
    if (p.goal === "check" && !(s.marks?.length === DOCKETS && s.marks.every((m) => m === 1 || m === 2))) return false;
    return p.goal === "area" || (isInt(s.ra) && isInt(s.rb) && s.ra > 0 && s.rb > 0);
  }
  if (godown(p.goal)) return !!s.dock && s.dock.every((c) => isInt(c) && c >= 0);
  if (!isInt(s.n)) return false;
  return p.goal === "left" ? s.n >= 0 && s.n <= p.a : s.n >= 1 && s.n <= STORY_MAX;
}
/** The set-up a child holding `mal` commits, or null (no reading here, not legal, would solve, or another of the goal's
 *  beliefs commits the very same set-up: a signature names ONE belief) */
export function malSetup(p: GunaParams, mal: string): Setup | null {
  const m = rawMal(p, mal);
  if (!m || !legal(p, m) || judge(p, m)) return null;
  for (const other of MAL_OF[p.goal]) {
    if (other === mal) continue;
    const o = rawMal(p, other);
    if (o && legal(p, o) && sameSetup(o, m)) return null;
  }
  return m;
}

/** the values the teacher may not say before the child produces them: the product (or estimate), the quotient and the
 *  leftover, the story's answer */
export function gunaHidden(level: PlayLevel<unknown>): string[] {
  const p = level.params as GunaParams | null;
  if (!p || typeof p.goal !== "string" || !isInt(p.a) || !isInt(p.b) || p.b <= 0) return [];
  try {
    if (godown(p.goal)) { const r = p.a % p.b; return [String(want(p)), ...(r ? [String(r)] : [])]; }
    return [String(want(p))];
  } catch { return []; }
}

const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });

function validate(level: PlayLevel<unknown>): PlayLevel<GunaParams> | null {
  const p = level.params as Partial<GunaParams> | null, mode = level.mode as GunaMode;
  if (!p || !GOALS_OF[mode] || !GOALS_OF[mode].includes(p.goal as GunaGoal)) return null;
  const goal = p.goal as GunaGoal, { a, b } = p;
  const face = p.face === 1 || p.face === 2 || p.face === 3 ? p.face : 0;
  if (!face || !isInt(a) || !isInt(b) || a < 2 || b < 2) return null;
  const ctx = p.ctx ?? -1;
  const out = { ...level, params: { goal, face, a, b, ctx: 0 } } as PlayLevel<GunaParams>;
  if (goal === "area") {
    // r7 guna2 (class 7): both sides round and at least 10, 6..7 racks (3000 × 400): the zeros are the whole idea
    if (ctx === 0 && isRound(a) && isRound(b) && a >= 10 && b >= 10 && digits(a) + digits(b) > 5 && digits(a) + digits(b) <= RACKS) return out;
    // one side at least 2 digits; at most 5 racks; never a bare times-table fact
    if (ctx !== 0 || a > 999 || b > 1000 || digits(a) + digits(b) > 5 || (a < 10 && b < 10) || a < b && a < 10) return null;
    return out;
  }
  if (goal === "round" || goal === "check") {
    // 2- to 4-digit sides, never round already, never halfway (45 / 250), one side rounded up and the other down (so neither
    // "always up" nor "always down" wins); at most 5 racks (r7 guna2: 7 for the round goal, class 7's 4872 × 312)
    if (a < 11 || b < 11 || a > 9999 || b > 9999 || isRound(a) || isRound(b)) return null;
    if (goal === "round" ? ctx !== 0 : !isInt(ctx) || ctx < 0 || ctx >= PERMS.length) return null;
    const half = (x: number) => (x / unitOf(x)) % 1 === 0.5 || Math.floor((x % unitOf(x)) / (unitOf(x) / 10)) === 5;
    if (half(a) || half(b) || (roundSide(a) > a) === (roundSide(b) > b)) return null;
    if (racksOf({ goal, a, b }) > (goal === "round" ? RACKS : 5)) return null;
    return goal === "check" ? { ...level, params: { goal, face, a, b, ctx } } as PlayLevel<GunaParams> : out;
  }
  if (goal === "each") {
    // class 4 sharing: 6..60 loose things among 2..9 friends, at least two rounds
    if (!isInt(ctx) || ctx < 0 || ctx > 2 || a < 6 || a > 60 || b > 9 || a < 2 * b) return null;
    return { ...level, params: { goal, face, a, b, ctx } } as PlayLevel<GunaParams>;
  }
  if (goal === "share") {
    // 2- or 3-digit godown into 2..9 trucks; at least ten in each truck; sharing it needs a crate opened somewhere above the ones
    if (ctx !== 0 || a < 10 || a > 999 || b > 9 || a < 10 * b) return null;
    if (valueOf(shareActs({ goal, face, a, b, ctx: 0 }, false).dock) < b) return null;
    return out;
  }
  // stories: a leftover always (so the story decides), 1..98 vehicles, and the left story's jar never the packets' count
  if (!isInt(ctx) || ctx < 0 || ctx > 2 || a > 999 || b > 50 || a % b === 0 || a < b) return null;
  if (Math.ceil(a / b) > STORY_MAX || (goal !== "all" && Math.floor(a / b) < 2)) return null;
  if (goal === "left" && a % b === Math.floor(a / b)) return null;
  return { ...level, params: { goal, face, a, b, ctx } } as PlayLevel<GunaParams>;
}

const isField = (g: GunaGoal) => g === "area" || g === "round" || g === "check";
function init(level: PlayLevel<GunaParams>): GunaState {
  const p = level.params, field = isField(p.goal), dock = godown(p.goal) ? dockOf(p) : [];
  return { cx: [], cy: [], ra: 0, rb: 0, crates: field ? new Array(racksOf(p)).fill(0) : [], dock,
    truck: new Array(dock.length).fill(0), n: 0, marks: p.goal === "check" ? new Array(DOCKETS).fill(0) : [], ended: false, runs: 0, done: false, acts: 0, prev: null, depth: 0 };
}
const setupOf = (p: GunaParams, s: GunaState): Setup =>
  p.goal === "area" ? { load: valueOf(s.crates) } : p.goal === "round" ? { load: valueOf(s.crates), ra: s.ra, rb: s.rb }
    : p.goal === "check" ? { load: valueOf(s.crates), ra: s.ra, rb: s.rb, marks: s.marks } : godown(p.goal) ? { dock: s.dock } : { n: s.n };
/** the sides as the child's field shows them now */
export const fieldSides = (p: GunaParams, s: Pick<GunaState, "ra" | "rb">): [number, number] => p.goal === "round" || p.goal === "check" ? [s.ra || p.a, s.rb || p.b] : [p.a, p.b];

function apply(level: PlayLevel<GunaParams>, s: GunaState, act: GunaAct, seq: number): { state: GunaState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  const bump = (st: GunaState): GunaState => ({ ...st, acts: s.acts + 1 });
  const no = (code: string) => ({ state: bump(s), moments: out, refused: code });
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  const change = (patch: Partial<GunaState>) => ({ state: bump(pushUndo(s, { ...s, ...patch, ended: false })), moments: out });
  const field = isField(p.goal);
  switch (act.kind) {
    case "cut": {
      if (p.goal !== "area") return no("no_cut");
      const side = Number(act.side), at = Number(act.at);
      if (side !== 0 && side !== 1) return no("bad_cut");
      const len = side === 0 ? p.a : p.b, cuts = side === 0 ? s.cx : s.cy;
      if (!isInt(at) || at <= 0 || at >= len) return no("bad_cut");
      const next = cuts.includes(at) ? cuts.filter((c) => c !== at) : [...cuts, at].sort((x, y) => x - y);
      if (next.length > MAX_CUTS) return no("too_many_cuts");
      return change(side === 0 ? { cx: next } : { cy: next });
    }
    case "round": {
      if (p.goal !== "round" && p.goal !== "check") return no("no_round");
      const side = Number(act.side), to = Number(act.to);
      if (side !== 0 && side !== 1) return no("bad_round");
      const len = side === 0 ? p.a : p.b, u = unitOf(len);
      // only the round lengths next to the side: down to its place, or up to the next
      if (!isInt(to) || to % u !== 0 || to <= 0 || Math.abs(to - len) >= u) return no("bad_round");
      if ((side === 0 ? s.ra : s.rb) === to) return no("same_round");
      return change(side === 0 ? { ra: to } : { rb: to });
    }
    case "crate": {
      if (!field) return no("no_truck");
      const pl = Number(act.place), by = Number(act.by);
      if (!isInt(pl) || pl < 0 || pl >= s.crates.length || (by !== 1 && by !== -1)) return no("bad_crate");
      const c = s.crates[pl] + by;
      if (c > RACK) return no("rack_full");
      if (c < 0) return no("rack_empty");
      const crates = [...s.crates]; crates[pl] = c;
      return change({ crates });
    }
    case "stamp": {
      if (p.goal !== "check") return no("no_docket");
      const i = Number(act.i), to = Number(act.to);
      if (!isInt(i) || i < 0 || i >= DOCKETS || (to !== 1 && to !== 2)) return no("bad_stamp");
      if (s.marks[i] === to) return no("same_stamp");
      const marks = [...s.marks]; marks[i] = to;
      return change({ marks });
    }
    case "open": case "deal": {
      if (!godown(p.goal)) return no("no_godown");
      const pl = Number(act.place);
      if (!isInt(pl) || pl < 0 || pl >= s.dock.length) return no("bad_place");
      const dock = [...s.dock];
      if (act.kind === "open") {
        if (pl === 0) return no("ones_stay");
        if (dock[pl] < 1) return no("none_here");
        dock[pl]--; dock[pl - 1] += 10;
        return change({ dock });
      }
      if (dock[pl] < p.b) return no("not_round");   // one crate to EVERY truck, or none
      dock[pl] -= p.b;
      const truck = [...s.truck]; truck[pl]++;
      return change({ dock, truck });
    }
    case "count": {
      if (field || godown(p.goal)) return no("no_count");
      const n = Number(act.n), hi = p.goal === "left" ? p.a : STORY_MAX;
      if (!isInt(n) || n < 0 || n > hi) return no("bad_count");
      if (n === s.n) return no("same_count");
      return change({ n });
    }
    case "run": {
      if (s.ended) return no("change_first");
      if (p.goal === "area" && !fieldTiled(p.a, p.b, s.cx, s.cy)) return no("cut_first");
      if ((p.goal === "round" || p.goal === "check") && (!s.ra || !s.rb)) return no("round_first");
      if (p.goal === "check" && s.marks.some((m) => m === 0)) return no("mark_first");
      if (field && valueOf(s.crates) === 0) return no("load_first");
      if ((p.goal === "all" || p.goal === "full") && s.n === 0) return no("count_first");
      const su = setupOf(p, s), runs = s.runs + 1, ok = judge(p, su);
      const end = bump({ ...s, ended: true, runs, done: ok });
      const f: Facts = { goal: p.goal, run: runs };
      if (ok) { out.push(mom("solved", seq, f)); return { state: end, moments: out }; }
      for (const mal of Object.keys(level.mal)) {
        const m = malSetup(p, mal);
        if (m && sameSetup({ ...su, ...m }, su)) { out.push(mom("misconception_consequence", seq, f, mal)); return { state: end, moments: out, refused: "missed" }; }
      }
      // near: one crate off on one rack / one round short on the dock / one vehicle or one in the jar off
      const w = want(p);
      const near = p.goal === "check" ? valueOf(s.crates) === w && s.marks.filter((m, i) => m !== rightMarks(p)[i]).length === 1
        : field ? (() => { const d = Math.abs(valueOf(s.crates) - w); return d > 0 && /^[1-9]0*$/.test(String(d)) && d < w; })()
        : godown(p.goal) ? valueOf(s.dock) < 2 * p.b
        : Math.abs(s.n - w) === 1;
      out.push(mom(near ? "near_miss" : "law_refused", seq, { ...f, why: "run_missed" }));
      return { state: end, moments: out, refused: "missed" };
    }
  }
  return no("unknown_act");
}
const goalMet = (_l: PlayLevel<GunaParams>, s: GunaState) => s.done;

/** the cuts that split a side into its places, biggest first (34 → [30]; 125 → [100, 120]) */
export function placeCuts(len: number): number[] {
  const out: number[] = []; let at = 0;
  const ds = String(len).split("").map(Number);
  ds.forEach((d, i) => { const part = d * 10 ** (ds.length - 1 - i); if (!part) return; at += part; if (at < len) out.push(at); });
  return out;
}
/** the acts that load a value onto the truck (each rack from 0) */
function loadActs(v: number, racks: number): GunaAct[] {
  const acts: GunaAct[] = [];
  placesOf(v, racks).forEach((c, place) => { for (let k = 0; k < c; k++) acts.push({ kind: "crate", place, by: 1 }); });
  return acts;
}
/** the acts that commit a set-up from the level's start, then run */
export function setupActs(p: GunaParams, su: Setup): GunaAct[] | null {
  const acts: GunaAct[] = [];
  if (p.goal === "area") {
    for (const at of placeCuts(p.a)) acts.push({ kind: "cut", side: 0, at });
    for (const at of placeCuts(p.b)) acts.push({ kind: "cut", side: 1, at });
    acts.push(...loadActs(su.load ?? 0, racksOf(p)));
  } else if (p.goal === "round" || p.goal === "check") {
    acts.push({ kind: "round", side: 0, to: su.ra ?? 0 }, { kind: "round", side: 1, to: su.rb ?? 0 }, ...loadActs(su.load ?? 0, racksOf(p)));
    (su.marks ?? []).forEach((to, i) => acts.push({ kind: "stamp", i, to }));
  } else if (godown(p.goal)) return null;
  else if (su.n) acts.push({ kind: "count", n: su.n });
  acts.push({ kind: "run" });
  return acts;
}
function solve(level: PlayLevel<GunaParams>): GunaAct[] | null {
  const p = level.params;
  if (godown(p.goal)) return [...shareActs(p, true).acts, { kind: "run" }];
  const su: Setup = p.goal === "area" ? { load: want(p) } : p.goal === "round" ? { ra: roundSide(p.a), rb: roundSide(p.b), load: want(p) }
    : p.goal === "check" ? { ra: roundSide(p.a), rb: roundSide(p.b), load: want(p), marks: rightMarks(p) } : { n: want(p) };
  return legal(p, su) ? setupActs(p, su) : null;
}
/**
 * Set-ups that win without the idea: the truck loaded with a + b, a, b or the two written side by side; the sides both
 * rounded down or both up; the trucks sent at once, or every place shared without ever opening a crate; one vehicle, or
 * one per thing, or the jar left empty. A level any of them solves is never served.
 */
export function shortcutActs(p: GunaParams): GunaAct[][] {
  const tries: GunaAct[][] = [];
  if (p.goal === "area") for (const v of [p.a + p.b, p.a, p.b, Number(`${p.a}${p.b}`)]) { const su = { load: v }; if (legal(p, su)) tries.push(setupActs(p, su)!); }
  else if (p.goal === "round") {
    const ua = unitOf(p.a), ub = unitOf(p.b);
    for (const [ra, rb] of [[Math.floor(p.a / ua) * ua, Math.floor(p.b / ub) * ub], [Math.ceil(p.a / ua) * ua, Math.ceil(p.b / ub) * ub]]) {
      const su = { ra, rb, load: ra * rb };
      if (ra > 0 && rb > 0 && legal(p, su)) tries.push(setupActs(p, su)!);
    }
  } else if (p.goal === "check") {
    // every docket kept / every docket sent back (on the right estimate); the right marks on sides both rounded one way
    const ua = unitOf(p.a), ub = unitOf(p.b);
    for (const m of [1, 2]) tries.push(setupActs(p, { ra: roundSide(p.a), rb: roundSide(p.b), load: want(p), marks: new Array(DOCKETS).fill(m) })!);
    for (const [ra, rb] of [[Math.floor(p.a / ua) * ua, Math.floor(p.b / ub) * ub], [Math.ceil(p.a / ua) * ua, Math.ceil(p.b / ub) * ub]]) {
      const su = { ra, rb, load: ra * rb, marks: rightMarks(p) };
      if (ra > 0 && rb > 0 && legal(p, su)) tries.push(setupActs(p, su)!);
    }
  } else if (p.goal === "share") tries.push([{ kind: "run" }], [...shareActs(p, false).acts, { kind: "run" }]);
  else if (p.goal === "each") tries.push([{ kind: "run" }]);   // loose things: nothing to open, so dealing on IS the idea
  else for (const n of [1, Math.min(p.a, STORY_MAX), 0]) { const su = { n }; if (legal(p, su)) tries.push(setupActs(p, su)!); }
  return tries;
}
function replayDone(level: PlayLevel<GunaParams>, acts: GunaAct[]): boolean {
  let s = init(level);
  for (const a of acts) s = apply(level, s, a, 1).state;
  return s.done;
}
function shortcut(level: PlayLevel<GunaParams>): GunaAct[] | null {
  for (const t of shortcutActs(level.params)) if (replayDone(level, t)) return t;
  return null;
}
function malActs(level: PlayLevel<GunaParams>, mal: string): GunaAct[] | null {
  const p = level.params, m = malSetup(p, mal);
  if (!m) return null;
  if (godown(p.goal)) return [...shareActs(p, mal !== "digitwise", mal === "short").acts, { kind: "run" }];
  return setupActs(p, m);
}

/** basic facts that end in 0 (5 × 2 = 10, 4 × 5 = 20 …) */
const ZERO_FACTS: readonly [number, number][] = [[5, 2], [5, 4], [5, 6], [5, 8], [2, 5], [4, 5], [6, 5], [8, 5]];
type Shape = "2x1" | "3x1" | "2x10" | "2xT" | "2x2" | "RxR" | "2xH" | "BIG";
interface GunaGrammar {
  /** area: the field shapes a level draws from */
  shapes?: Shape[];
  /** share: the godown's digits (2 or 3) */
  sizes?: number[];
  /** stories: the share that go in one (lo, hi) and the vehicles / packets it comes to (lo, hi) */
  cap?: [number, number]; q?: [number, number];
  /** round (r7 guna2, class 7): the sides 3- and 4-digit, the truck up to 7 racks */
  big?: boolean;
}
function difficultyOf(p: GunaParams): number {
  const f = 0.06 * (p.face - 1);
  switch (p.goal) {
    case "area": return Math.min(1, 0.2 + f + 0.08 * (digits(p.a) + digits(p.b)) + (p.b >= 10 && !isRound(p.b) ? 0.1 : 0));
    case "round": case "check": return Math.min(1, 0.35 + f + 0.05 * (digits(p.a) + digits(p.b)));
    case "each": return Math.min(1, 0.2 + f + 0.02 * Math.floor(p.a / p.b) + (p.a % p.b ? 0.05 : 0));
    case "share": return Math.min(1, 0.25 + f + 0.12 * digits(p.a) + (p.a % p.b ? 0.05 : 0));
    default: return Math.min(1, 0.3 + f + 0.01 * Math.ceil(p.a / p.b) + (p.b >= 10 ? 0.1 : 0));
  }
}
function generate(req: GenRequest): Candidate<GunaParams>[] {
  const g = req.grammar as GunaGrammar;
  const mode = (["field", "pack", "story"] as const).find((m) => m === req.mode) ?? "field";
  const goal = (GOALS_OF[mode].includes(req.goal as GunaGoal) ? req.goal : GOALS_OF[mode][0]) as GunaGoal;
  const rnd = mulberry32(req.seed), out: Candidate<GunaParams>[] = [], seen = new Set<string>();
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const pickOf = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
  const face = req.fade as 1 | 2 | 3;
  const mk = (params: GunaParams, sig: string): Candidate<GunaParams> => ({
    signature: sig, difficulty: difficultyOf(params),
    level: { v: "play@1", levelId: `guna-${sig}-${req.seed}`.replace(/[^a-z0-9:/.,_-]/gi, "_"), family: "guna", mode, topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: "guna", seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 2, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } },
  });
  const shapes = (g.shapes ?? ["2x1", "2x10", "2xT"]).filter((x) => ["2x1", "3x1", "2x10", "2xT", "2x2", "RxR", "2xH", "BIG"].includes(x));
  const sizes = (g.sizes ?? [2, 3]).filter((x) => x === 2 || x === 3);
  const nz = () => int(1, 9);
  for (let k = 0; k < 160 && out.length < 24; k++) {
    let a = 0, b = 0, ctx = 0;
    if (goal === "area") {
      const sh = pickOf(shapes.length ? shapes : ["2x1"]);
      // the ones digit chosen so a carry happens most times (where the carry beliefs show)
      const two = () => { const t = int(1, 9), o = int(1, 9); return t * 10 + o; };
      if (sh === "2x1") {
        // half the time the tens times b stays one digit (where "side by side" still fits the truck)
        b = int(3, 9);
        a = (rnd() < 0.5 ? int(1, Math.max(1, Math.floor(9 / b))) : int(1, 9)) * 10 + (rnd() < 0.85 ? int(Math.ceil(10 / b), 9) : int(1, 9));
      }
      else if (sh === "3x1") { b = int(2, 9); a = int(1, 3) * 100 + int(0, 9) * 10 + int(1, 9); }
      else if (sh === "2x10") { b = 10; a = two(); }
      else if (sh === "2xT") { b = int(2, 9) * 10; a = int(1, 9) * 10 + (rnd() < 0.7 ? int(Math.ceil(10 / (b / 10)), 9) : int(1, 9)); }
      else if (sh === "2x2") { a = two(); b = int(1, 4) * 10 + int(1, 9); }
      else if (sh === "RxR") {
        // a basic fact that ends in 0 most times (5 × 4, 6 × 5: where a zero gets lost)
        const [la, lb] = rnd() < 0.6 ? pickOf(ZERO_FACTS) : [nz(), nz()];
        a = la * pickOf([10, 100]); b = lb * 10;
      } else if (sh === "BIG") {
        // r7 guna2 (class 7): 3000 × 400, 500 × 600 …: a basic fact (ending in 0 half the time), then zeros on both sides
        // until the truck needs 6 or 7 racks
        const [la, lb] = rnd() < 0.5 ? pickOf(ZERO_FACTS) : [int(2, 9), int(2, 9)];
        const z = int(4, 5), za = int(z - 3, 3), zb = z - za;
        a = la * 10 ** za; b = lb * 10 ** zb;
      } else { a = two(); b = 100; }
    } else if (goal === "round" && g.big) {
      // r7 guna2 (class 7): a 3- or 4-digit side near a round thousands / hundreds, a 2- or 3-digit side near round tens /
      // hundreds; one rounds up, the other down
      const [la, lb] = rnd() < 0.5 ? pickOf(ZERO_FACTS) : [nz(), nz()];
      const ua = 1000, ub = rnd() < 0.6 ? 100 : 10, upA = rnd() < 0.5;
      const near = (r: number, u: number, up: boolean) => { const off = int(1, 4) * (u / 10) + int(0, u / 10 - 1); return up ? r - off : r + off; };
      a = near(la * ua, ua, upA); b = near(lb * ub, ub, !upA);
      // a side that fell below its thousands (1000 − 310 = 690) rounds at its own place: not a big estimate
      if (racksOf({ goal, a, b }) < 6) continue;
    } else if (goal === "round" || goal === "check") {
      // the round sides first (a basic fact that ends in 0 most times), then a side near each: one rounds up, one down
      const [la, lb] = rnd() < 0.6 ? pickOf(ZERO_FACTS) : [nz(), nz()];
      const ua = rnd() < 0.3 ? 100 : 10, upA = rnd() < 0.5;
      const near = (r: number, u: number, up: boolean) => { const off = int(1, 4) * (u / 10) + (u === 100 ? int(0, 9) : 0); return up ? r - off : r + off; };
      a = near(la * ua, ua, upA); b = near(lb * 10, 10, !upA);
      if (goal === "check") ctx = int(0, PERMS.length - 1);
    } else if (goal === "each") {
      // class 4: share among 2..9 friends, 2..9 each, a leftover most times
      const [clo, chi] = g.cap ?? [2, 6], [qlo, qhi] = g.q ?? [2, 9];
      b = int(clo, chi);
      a = int(qlo, qhi) * b + (rnd() < 0.75 ? int(1, b - 1) : 0);
      ctx = int(0, 2);
    } else if (goal === "share") {
      const dg = pickOf(sizes.length ? sizes : [2]);
      b = int(2, 9);
      a = dg === 2 ? int(Math.max(10, 10 * b), 99) : int(Math.max(100, 10 * b), 999);
    } else {
      const [clo, chi] = g.cap ?? [3, 9], [qlo, qhi] = g.q ?? [2, 12];
      b = int(clo, chi);
      const q = int(Math.max(goal === "all" ? 1 : 2, qlo), qhi);
      a = q * b + int(1, b - 1);
      ctx = int(0, 2);
    }
    const params: GunaParams = { goal, face, a, b, ctx };
    const sig = `${goal}:${a}:${b}:${ctx}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    const cand = mk(params, sig);
    const v = validate(cand.level);
    if (!v || !solve(v) || shortcut(v)) continue;
    out.push(cand);
  }
  return out;
}

function facts(level: PlayLevel<GunaParams>, s: GunaState): Facts {
  const p = level.params, f: Facts = { goal: p.goal };
  if (p.goal === "area") { f.cuts = s.cx.length + s.cy.length; if (fieldTiled(p.a, p.b, s.cx, s.cy)) f.tiled = "yes"; }
  if ((p.goal === "round" || p.goal === "check") && s.ra && s.rb) f.field = `${s.ra} × ${s.rb}`;
  if (isField(p.goal)) { const v = valueOf(s.crates); if (v) f.load = v; }
  if (p.goal === "check") f.marked = s.marks.filter((m) => m > 0).length;
  if (godown(p.goal)) { f.dealt = s.truck.reduce((x, y) => x + y, 0); f.dock = valueOf(s.dock); }
  if (p.goal === "all" || p.goal === "full" || p.goal === "left") f.count = s.n;
  if (s.runs) f.runs = s.runs;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<GunaParams>, s: GunaState) {
  const p = level.params, lines: string[] = [];
  if (p.goal === "area") lines.push(`field: ${p.a} × ${p.b}`, `cuts: ${partsOf(p.a, s.cx).join(" + ")} × ${partsOf(p.b, s.cy).join(" + ")}`, `truck: ${valueOf(s.crates)}`);
  if (p.goal === "round") lines.push(`about: ${p.a} × ${p.b}`, `field: ${s.ra || "–"} × ${s.rb || "–"}`, `truck: ${valueOf(s.crates)}`);
  if (p.goal === "check") lines.push(`about: ${p.a} × ${p.b}`, `field: ${s.ra || "–"} × ${s.rb || "–"}`, `truck: ${valueOf(s.crates)}`,
    `dockets: ${dockets(p).map((d, i) => `${d.v} ${["–", "ok", "back"][s.marks[i]]}`).join(", ")}`);
  if (godown(p.goal)) lines.push(`${p.goal === "each" ? "things" : "godown"}: ${p.a}`, `${p.goal === "each" ? "friends" : "trucks"}: ${p.b}`, `each ${p.goal === "each" ? "friend" : "truck"}: ${valueOf(s.truck)}`, `dock: ${valueOf(s.dock)}`);
  if (p.goal === "all" || p.goal === "full" || p.goal === "left") lines.push(`things: ${p.a}`, `in one: ${p.b}`, `${p.goal === "left" ? "jar" : "set out"}: ${s.n}`);
  return { title: "Guna", lines };
}
function grade(level: PlayLevel<GunaParams>, acts: PlayActEnvelope<GunaAct>[]): PlayGrade {
  return gradeLevel(gunaLogic, level, acts, { decisiveRefusals: ["missed"], final: true });
}

export const gunaLogic: FamilyLogic<GunaParams, GunaState, GunaAct> = {
  family: "guna", modes: ["field", "pack", "story"], malRules: GUNA_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
