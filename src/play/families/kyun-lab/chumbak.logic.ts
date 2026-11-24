// Kyun-Lab · chumbak (चुंबक, magnets): two modes for class 6 science (c6-science-ch04-t02, -t03). Nothing here runs on a
// clock: every change waits for the child's tap. Every fact the law uses is a sentence of the topic kit (KIT_OF, read out of
// data/kits/c6-science.json by tests/r7-games-kyun-chumbak.test.mjs); every other number is a scene value that claims no fact.
//
// dhruv (poles, attraction and repulsion; ch04-t02):
//   sira   (s1)  a magnet is hidden under a cover at a place the seed chooses (never at the cover's own ends). The child touches
//                a pin to spots along the cover; pins cling MOST at the magnet's two ends (its poles), few along its middle,
//                none off it (the kit: "the attraction is strongest at the poles, which is why iron filings cluster at the
//                ends"; "barely at its centre"). She flags the two poles and lifts the cover: the filings show.
//   jodo   (s2)  a magnetic toy train: each carriage has a magnet across it, N at one end and S at the other. She turns
//                carriages round and pushes the train together: unlike poles that meet pull and couple, like poles push the
//                carriage away (look 3: the poles are not printed; a push shows which joint pushes apart).
//   pakka  (s2)  bars that look alike: one is a magnet, the others plain iron. She brings either pole of her marked magnet
//                to any end. Iron is only ever pulled; only a magnet can push one pole away. "This is the magnet" holds only
//                for a bar she has seen push (the kit: "Repulsion is the sure test ... attraction alone may just mean the
//                object is made of iron").
//   todo   (s3)  imagined, never tried (the kit: "just in your head, never try it, since real magnets break into sharp
//                pieces"): a bar magnet has snapped into 2-4 pieces. She labels every new end N or S (or "no pole"), testing
//                ends with her marked magnet if she likes; each piece is a whole magnet with N and S.
//   taakat (s3)  the kit's own pair: a small thin magnet lifts 20 pins, a big grey one only 8. She dips each into the pins and
//                tags the stronger one (the kit: "A bigger magnet is not always stronger").
// disha (finding directions; ch04-t03). Directions are quarter turns (N, E, S, W; the kit: "east ... a quarter turn
// clockwise from north"). The ground is drawn turned by a seeded quarter (screen-up is not north), so only the magnet tells.
//   latkao (s1)  a bar magnet on a thread, twisted in her hand. Let go, it always settles north-south with its N end north
//                (twist it again: it comes back). She turns a paper map until its N arrow lies along the magnet's N end.
//   ghoomo (s2)  she stands holding a compass. Turning herself turns the box with her; the needle keeps pointing north. She
//                faces a landmark, turns the box until N on the dial is under the needle, and reads the letter in front of
//                her (the kit's worked example).
//   loha   (s2)  the same, but she starts by a steel almirah / an iron table / a magnet: there the needle turns away from
//                north towards it. Read there and the reading is wrong; walk away, the needle swings back (the kit: "Keep a
//                compass away from magnets and iron or steel objects, which disturb the needle").
//
// The CHILD's beliefs (mal-rules; the kit's own misconception ids, each a deterministic act list with its own consequence):
//   middle-strong (t02 m3) a spot along the magnet's middle flagged as a pole: lifted, the filings crowd the two ends
//   pull-proves   (t02 m4) "this is the magnet" for a bar only ever pulled: iron is pulled too (a plain iron nail beside it)
//   one-pole      (t02 m2) a piece labelled with one pole only (an end "no pole", or N at both ends): that end pushes a pole
//   big-stronger  (t02 m1) the big grey magnet tagged stronger: 8 pins against the small one's 20 (the kit's numbers)
//   needle-turns  (t03 m3) set the dial, turned herself, read without setting it again: the needle stayed north, the box
//                          turned with her
//   iron-trust    (t03 m2) the compass read by the iron, set to its pulled needle: walked away, the needle swings back
// Not admitted: t03 m1 ("north is cold"): no mechanic here; the needle simply settles as the kit says and the reason is the
// teacher's (server/play/tools/rules/kyun-lab.mjs says why).
import type { Candidate, ChumbakAct, Facts, FamilyLogic, GenRequest, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export const CHUMBAK_MODES = ["dhruv", "disha"] as const;
export type ChumbakMode = (typeof CHUMBAK_MODES)[number];
export const CHUMBAK_MAL = ["middle-strong", "one-pole", "pull-proves", "big-stronger", "needle-turns", "iron-trust"] as const;
export const GOALS_OF = { dhruv: ["sira", "jodo", "pakka", "todo", "taakat"], disha: ["latkao", "ghoomo", "loha"] } as const;
export type ChumbakGoal = (typeof GOALS_OF)[ChumbakMode][number];

/** scene value, no fact claimed: the spots along the cover where a pin can be touched */
export const SPOTS = 7;
/** scene value, no fact claimed: pins drawn clinging at a pole spot, at a middle spot (the kit states only "strongest at the
 *  poles", "far fewer in the middle", "barely at its centre"; no count) and off the magnet */
export const PINS_POLE = 5;
export const PINS_MID = 1;
/** the kit's own numbers (c6-science-ch04-t02 m1 diagnostic): "A small thin magnet lifts 20 pins; a big grey magnet lifts
 *  only 8" */
export const KIT_PINS = { small: 20, big: 8 } as const;

/** where each fact comes from in the kit: the tests read these texts out of data/kits/c6-science.json */
export const KIT_OF: Record<string, [string, string]> = {
  "poles strongest": ["c6-science-ch04-t02", "the attraction is strongest at the poles, which is why iron filings cluster at the ends"],
  "middle barely": ["c6-science-ch04-t02", "A steel pin sticks strongly near the strip’s top and bottom but barely at its centre"],
  "like repel": ["c6-science-ch04-t02", "Like poles repel each other; unlike poles attract."],
  "train": ["c6-science-ch04-t02", "turn the carriage around so unlike poles face each other and attract"],
  "repulsion sure": ["c6-science-ch04-t02", "Repulsion is the sure test that an object is a magnet; attraction alone may just mean the object is made of iron."],
  "iron only attracted": ["c6-science-ch04-t02", "The iron nail is only ever attracted."],
  "broken whole": ["c6-science-ch04-t02", "each piece becomes a complete magnet with its own north and south pole; a single pole cannot be separated"],
  "never break": ["c6-science-ch04-t02", "just in your head, never try it, since real magnets break into sharp pieces"],
  "size not strength": ["c6-science-ch04-t02", "A bigger magnet is not always stronger"],
  "20 and 8": ["c6-science-ch04-t02", "A small thin magnet lifts 20 pins; a big grey magnet lifts only 8."],
  "settles north": ["c6-science-ch04-t03", "A freely suspended bar magnet always comes to rest pointing roughly north-south; the end pointing north is its north (north-seeking) pole."],
  "turned back": ["c6-science-ch04-t03", "It swings and settles back into the north-south direction."],
  "dial": ["c6-science-ch04-t03", "turn the compass so the dial's N lines up with the needle's north end, then read the other directions"],
  "quarter turn": ["c6-science-ch04-t03", "a quarter turn clockwise from north"],
  "needle stays": ["c6-science-ch04-t03", "It keeps pointing north-south while the box turns under it"],
  "iron disturbs": ["c6-science-ch04-t03", "Keep a compass away from magnets and iron or steel objects, which disturb the needle."],
  "turns to magnet": ["c6-science-ch04-t03", "The needle swings away from north and turns towards the magnet"],
};

// ───────────────────────────── params and state ─────────────────────────────
/** One flat params object; validate() keeps only the fields of the level's goal. Directions are quarter turns 0..3 (N E S W). */
export interface ChumbakParams {
  goal: ChumbakGoal;
  /** the scaffold (fade): 1 the fewest things; 3 the most */
  look: 1 | 2 | 3;
  /** the drawn context (a kit interest context); never changes the law */
  ctx: string;
  /** scene value: the seed of the drawn layout (no fact claimed) */
  lay: number;
  // sira: the hidden magnet covers spots from .. from + len − 1
  from?: number; len?: number;
  // jodo: each carriage's starting way round (0: N at its left end, 1: turned round), the engine's back pole (0 N, 1 S),
  // the poles printed (false at look 3)
  cars?: number[]; eng?: number; shown?: boolean;
  // pakka: how many bars, which one is the magnet, its way round (0: N at its left end)
  bars?: number; mag?: number;
  // todo: how many pieces; where the breaks fall (scene value: one of three drawn layouts, no fact claimed)
  pieces?: number; cut?: number;
  // pakka / todo: the magnet's way round (0: N at its left end)
  flip?: number;
  // taakat: 0 the small thin magnet on the left, 1 on the right
  order?: number;
  // disha: the ground's screen turn (the direction drawn at screen-up), the hung magnet's starting twist and the map's N
  // (latkao); where she faces, the box's N, the landmark (ghoomo / loha); the iron's side as seen from the spot by it (loha)
  rot?: number; twist?: number; map?: number; face?: number; box?: number; target?: number; iron?: number;
}
export interface Test { i: number; end: number; p: "N" | "S"; r: "pull" | "push" }
export interface ChumbakState extends Undoable<ChumbakState> {
  /** sira: pins clinging per spot (−1 = not touched yet) */
  probes: number[];
  /** sira: the spots flagged as poles */
  marks: number[];
  /** jodo: each carriage's way round now */
  cars: number[];
  /** jodo: per joint after the last push: 1 pulled together, −1 pushed apart (empty before a push) */
  joints: number[];
  /** pakka / todo: every pole brought to an end, in order */
  tests: Test[];
  /** todo: per piece [left, right] label: "" | "N" | "S" | "-" (the two outer ends are printed) */
  labels: string[][];
  /** taakat: which magnets were dipped into the pins */
  dipped: boolean[];
  /** latkao: the hung magnet's N end (quarter turns), held in the hand or hanging free; the map's N */
  twist: number; held: boolean; map: number;
  /** ghoomo / loha: where she faces, the box's N, where she stands (loha: 0 by the iron, 1 away); the dial was set and then
   *  she turned (the box turned off the needle by her own turn) */
  face: number; box: number; spot: number; turnedOff: boolean;
  /** the law's last answer for the view ("" | a refusal code) and the thing it was about (−1 none) */
  why: string; on: number;
  done: boolean; acts: number;
}

const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
const q4 = (x: number) => ((x % 4) + 4) % 4;
export const DIRS = ["N", "E", "S", "W"] as const;
const inRange = (x: unknown, lo: number, hi: number): x is number => isInt(x) && x >= lo && x <= hi;
/** jodo: how many carriages a look pulls (scene value, no fact claimed) */
const JODO_CARS: Record<1 | 2 | 3, readonly number[]> = { 1: [2, 3], 2: [3, 4], 3: [3] };
const CTX: Record<ChumbakGoal, readonly string[]> = {
  sira: ["case", "board", "box"], jodo: ["train"], pakka: ["lab", "fair"], todo: ["lab", "fair"], taakat: ["lab", "fair", "home"],
  latkao: ["campus", "hunt", "mela"], ghoomo: ["campus", "hunt", "mela", "trek"], loha: ["almirah", "table", "bar"],
};

// ───────────────────────────── the law's small helpers ─────────────────────────────
/** sira: the pins that cling at spot `at` (the kit's order: most at a pole, few along the middle, none off the magnet) */
export function pinsAt(p: Pick<ChumbakParams, "from" | "len">, at: number): number {
  const a = p.from as number, b = a + (p.len as number) - 1;
  return at === a || at === b ? PINS_POLE : at > a && at < b ? PINS_MID : 0;
}
export const polesOf = (p: Pick<ChumbakParams, "from" | "len">) => [p.from as number, (p.from as number) + (p.len as number) - 1];
/** jodo: a piece's [left, right] pole ("N" / "S"); piece −1 is the engine (its back is `eng`) */
export function carPoles(way: number): ["N" | "S", "N" | "S"] { return way ? ["S", "N"] : ["N", "S"]; }
export function jointsOf(p: ChumbakParams, cars: readonly number[]): number[] {
  const out: number[] = [];
  let right: "N" | "S" = p.eng ? "S" : "N";
  for (const w of cars) { const [l, r] = carPoles(w); out.push(l !== right ? 1 : -1); right = r; }
  return out;
}
/** jodo: the one way round of each carriage that couples the whole train */
export function trainKey(p: ChumbakParams): number[] {
  const out: number[] = [];
  let right: "N" | "S" = p.eng ? "S" : "N";
  for (let i = 0; i < (p.cars ?? []).length; i++) { const w = right === "N" ? 1 : 0; out.push(w); right = carPoles(w)[1]; }
  return out;
}
/** pakka: the pole at bar i's end (null = plain iron, no pole) */
export const barPole = (p: ChumbakParams, i: number, end: number): "N" | "S" | null => (i !== p.mag ? null : (end === 0) === !p.flip ? "N" : "S");
/** todo: the pole at piece i's end: every piece lies the same way round as the whole magnet */
export const piecePole = (p: ChumbakParams, _i: number, end: number): "N" | "S" => ((end === 0) === !p.flip ? "N" : "S");
/** todo: the two outer ends are printed on the magnet; the others are new ends at a break */
export const printed = (p: ChumbakParams, i: number, end: number) => (i === 0 && end === 0) || (i === (p.pieces as number) - 1 && end === 1);
/** pakka / todo: what the marked magnet's pole `pole` does at an end whose own pole is `at` (null: iron, only ever pulled) */
export const meet = (pole: "N" | "S", at: "N" | "S" | null): "pull" | "push" => (at && at === pole ? "push" : "pull");
/** taakat: which magnet is where */
export const sizeAt = (p: ChumbakParams, i: number): "small" | "big" => ((i === 0) === !p.order ? "small" : "big");
/** disha: where the needle's N end points at the spot (loha by the iron: towards the iron; otherwise north) */
export const needleAt = (p: ChumbakParams, spot: number) => (p.goal === "loha" && spot === 0 ? (p.iron as number) : 0);
/** disha: the dial letter in front of her (the box's N is at `box`; she faces `face`) */
export const letterAhead = (face: number, box: number) => DIRS[q4(face - box)];

// ───────────────────────────── hidden, validate, init ─────────────────────────────
const DIR_WORDS: Record<string, string[]> = {
  N: ["north", "North", "uttar", "Uttar", "उत्तर"], E: ["east", "East", "poorab", "Poorab", "purab", "Purab", "पूर्व"],
  S: ["south", "South", "dakshin", "Dakshin", "दक्षिण"], W: ["west", "West", "pashchim", "Pashchim", "पश्चिम"],
};
/** the answer the child must find is never said first: the pole spots, the carriages to turn, the magnet bar, the stronger
 *  magnet and its pins, the new poles at a break, the landmark's direction */
export function chumbakHidden(level: PlayLevel<unknown>): string[] {
  try {
    const v = validate(level);
    if (!v) return [];
    const p = v.params;
    switch (p.goal) {
      case "sira": return polesOf(p).map((x) => String(x + 1));
      case "jodo": { const k = trainKey(p); return (p.cars ?? []).map((w, i) => (w !== k[i] ? String(i + 1) : "")).filter(Boolean); }
      case "pakka": { const L = "ABC"[p.mag as number]; return [`${L} bar`, `bar ${L}`, `${L} wali`, `${L} वाली`]; }
      case "todo": return ["both poles", "dono pole", "दोनों ध्रुव"];
      case "taakat": return [String(KIT_PINS.small), "small", "chhota", "छोटा"];
      case "latkao": return [];
      default: return DIR_WORDS[DIRS[p.target as number]];
    }
  } catch { return []; }
}

function validate(level: PlayLevel<unknown>): PlayLevel<ChumbakParams> | null {
  const p = level.params as Partial<ChumbakParams> | null;
  if (!p || !CHUMBAK_MODES.includes(level.mode as ChumbakMode)) return null;
  const mode = level.mode as ChumbakMode, goal = p.goal as ChumbakGoal;
  if (!(GOALS_OF[mode] as readonly string[]).includes(goal)) return null;
  const look = p.look === 1 || p.look === 2 || p.look === 3 ? p.look : 0;
  if (!look || typeof p.ctx !== "string" || !CTX[goal].includes(p.ctx) || !inRange(p.lay, 0, 9999)) return null;
  const base = { goal, look, ctx: p.ctx, lay: p.lay } as ChumbakParams;
  const ok = (x: ChumbakParams) => ({ ...level, params: x }) as PlayLevel<ChumbakParams>;
  switch (goal) {
    case "sira": {
      // the magnet lies wholly under the cover and never at its own ends (the cover's ends are not the poles)
      if (!inRange(p.len, 3, 5) || !inRange(p.from, 1, SPOTS - 2) || (p.from as number) + (p.len as number) - 1 > SPOTS - 2) return null;
      return ok({ ...base, from: p.from, len: p.len });
    }
    case "jodo": {
      if (!Array.isArray(p.cars) || !JODO_CARS[look].includes(p.cars.length) || !p.cars.every((w) => w === 0 || w === 1) || !(p.eng === 0 || p.eng === 1)) return null;
      if (p.shown !== (look < 3)) return null;
      const x = { ...base, cars: [...p.cars], eng: p.eng, shown: look < 3 };
      if (jointsOf(x, x.cars).every((j) => j > 0)) return null;
      return ok(x);
    }
    case "pakka": {
      const n = look === 1 ? 2 : 3;
      if (p.bars !== n || !inRange(p.mag, 0, n - 1) || !(p.flip === 0 || p.flip === 1)) return null;
      return ok({ ...base, bars: n, mag: p.mag, flip: p.flip });
    }
    case "todo": {
      if (p.pieces !== look + 1 || !(p.flip === 0 || p.flip === 1) || !inRange(p.cut, 0, 2)) return null;
      return ok({ ...base, pieces: p.pieces, flip: p.flip, cut: p.cut });
    }
    case "taakat": {
      if (!(p.order === 0 || p.order === 1)) return null;
      return ok({ ...base, order: p.order });
    }
    case "latkao": {
      if (!inRange(p.rot, 0, 3) || !inRange(p.twist, 1, 3) || !inRange(p.map, 1, 3)) return null;
      return ok({ ...base, rot: p.rot, twist: p.twist, map: p.map });
    }
    case "ghoomo": case "loha": {
      if (!inRange(p.rot, 0, 3) || !inRange(p.face, 0, 3) || !inRange(p.box, 0, 3) || !inRange(p.target, 0, 3) || p.face === p.target) return null;
      if (goal === "loha" ? !inRange(p.iron, 1, 3) : p.iron !== undefined) return null;
      // turning to face the landmark must never set the dial by itself (she sets it every time)
      if (q4((p.box as number) + (p.target as number) - (p.face as number)) === 0) return null;
      return ok({ ...base, rot: p.rot, face: p.face, box: p.box, target: p.target, ...(goal === "loha" ? { iron: p.iron } : {}) });
    }
  }
  return null;
}

function init(level: PlayLevel<ChumbakParams>): ChumbakState {
  const p = level.params;
  return {
    probes: p.goal === "sira" ? Array.from({ length: SPOTS }, () => -1) : [], marks: [],
    cars: [...(p.cars ?? [])], joints: [], tests: [],
    labels: p.goal === "todo" ? Array.from({ length: p.pieces as number }, (_, i) => [printed(p, i, 0) ? piecePole(p, i, 0) : "", printed(p, i, 1) ? piecePole(p, i, 1) : ""]) : [],
    dipped: p.goal === "taakat" ? [false, false] : [],
    twist: p.twist ?? 0, held: p.goal === "latkao", map: p.map ?? 0,
    face: p.face ?? 0, box: p.box ?? 0, spot: 0, turnedOff: false,
    why: "", on: -1, done: false, acts: 0, prev: null, depth: 0,
  };
}

const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });

// ───────────────────────────── apply (THE LAW) ─────────────────────────────
function apply(level: PlayLevel<ChumbakParams>, s: ChumbakState, act: ChumbakAct, seq: number): { state: ChumbakState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  const bump = (st: ChumbakState): ChumbakState => ({ ...st, acts: s.acts + 1 });
  const no = (code: string, on = -1, moment?: Moment) => {
    if (moment) out.push(moment);
    return { state: bump({ ...s, why: code, on }), moments: out, refused: code };
  };
  const refuse = (code: string, on = -1, f: Facts = {}) => no(code, on, mom("law_refused", seq, { ...f, why: code }));
  const ok = (next: Partial<ChumbakState>, f?: Facts) => { if (f) out.push(mom("progress", seq, f)); return { state: bump(pushUndo(s, { ...s, why: "", on: -1, ...next })), moments: out }; };
  const solved = (next: Partial<ChumbakState>, f: Facts) => { out.push(mom("solved", seq, f)); return { state: bump(pushUndo(s, { ...s, why: "", on: -1, ...next, done: true })), moments: out }; };
  /** a belief's consequence when the topic maps it; the plain refusal otherwise (the same code either way) */
  const mal = (id: string, code: string, on: number, f: Facts) => no(code, on, id in level.mal ? mom("misconception_consequence", seq, { ...f, why: code }, id) : mom("law_refused", seq, { ...f, why: code }));
  const k = act.kind;

  switch (p.goal) {
    case "sira": {
      if (k === "probe" || k === "mark") {
        const at = Number(act.at);
        if (!inRange(at, 0, SPOTS - 1)) return no("bad_spot");
        if (k === "probe") {
          if (s.probes[at] >= 0) return no("probed", at);
          const pins = pinsAt(p, at), probes = s.probes.map((x, i) => (i === at ? pins : x));
          return ok({ probes, on: at }, { spot: at + 1, pins });
        }
        if (s.probes[at] < 0) return refuse("probe_first", at, { spot: at + 1 });
        if (s.marks.includes(at)) return ok({ marks: s.marks.filter((x) => x !== at), on: at }, { spot: at + 1, flag: "off" });
        if (s.marks.length >= 2) return refuse("two_poles", at, { spot: at + 1 });
        return ok({ marks: [...s.marks, at].sort((x, y) => x - y), on: at }, { spot: at + 1, flag: "on" });
      }
      if (k !== "run") return no("unknown_act");
      if (!s.marks.length) return refuse("mark_first");
      const [a, b] = polesOf(p), f: Facts = { flags: s.marks.length };
      if (s.marks.length === 2 && s.marks[0] === a && s.marks[1] === b) return solved({}, { ...f, poles: "found" });
      const mid = s.marks.find((x) => x > a && x < b);
      if (mid !== undefined) return mal("middle-strong", "middle", mid, { ...f, spot: mid + 1 });
      const off = s.marks.find((x) => x !== a && x !== b);
      if (off !== undefined) return refuse("not_pole", off, { ...f, spot: off + 1 });
      return refuse("both_ends", s.marks[0], f);
    }
    case "jodo": {
      if (k === "flip") {
        const i = Number(act.i);
        if (!inRange(i, 0, s.cars.length - 1)) return no("bad_car");
        return ok({ cars: s.cars.map((w, j) => (j === i ? 1 - w : w)), joints: [], on: i }, { carriage: i + 1 });
      }
      if (k !== "run") return no("unknown_act");
      const joints = jointsOf(p, s.cars);
      if (joints.every((j) => j > 0)) return solved({ joints }, { joined: joints.length });
      const at = joints.findIndex((j) => j < 0);
      // a push with the poles printed is an answer (like poles were set facing); with them hidden it is how she finds out
      const code = p.shown ? "repel_seen" : "repel";
      out.push(mom("law_refused", seq, { why: code, joint: at + 1, apart: joints.filter((j) => j < 0).length }));
      return { state: bump({ ...s, joints, why: code, on: at }), moments: out, refused: code };
    }
    case "pakka": case "todo": {
      if (k === "near") {
        const i = Number(act.i), end = Number(act.end), pole: "N" | "S" | null = act.p === "N" || act.p === "S" ? act.p : null;
        const n = p.goal === "pakka" ? (p.bars as number) : (p.pieces as number);
        if (!inRange(i, 0, n - 1) || !(end === 0 || end === 1) || !pole) return no("bad_test");
        const r = meet(pole, p.goal === "pakka" ? barPole(p, i, end) : piecePole(p, i, end));
        const tests = [...s.tests.filter((t) => !(t.i === i && t.end === end && t.p === pole)), { i, end, p: pole, r }];
        return ok({ tests, on: i }, { thing: i + 1, end: end ? "right" : "left", pole, result: r });
      }
      if (p.goal === "pakka") {
        if (k !== "claim") return no("unknown_act");
        const i = Number(act.i);
        if (!inRange(i, 0, (p.bars as number) - 1)) return no("bad_bar");
        const mine = s.tests.filter((t) => t.i === i);
        if (!mine.length) return refuse("test_first", i, { bar: "ABC"[i] });
        if (mine.some((t) => t.r === "push")) return solved({ on: i }, { bar: "ABC"[i], proof: "push" });
        return mal("pull-proves", "only_pull", i, { bar: "ABC"[i], pulls: mine.length });
      }
      if (k === "label") {
        const i = Number(act.i), end = Number(act.end), v = String(act.v);
        if (!inRange(i, 0, (p.pieces as number) - 1) || !(end === 0 || end === 1) || !["N", "S", "-", ""].includes(v)) return no("bad_label");
        if (printed(p, i, end)) return no("printed", i);
        return ok({ labels: s.labels.map((pc, j) => (j === i ? pc.map((x, e) => (e === end ? v : x)) : pc)), on: i }, { piece: i + 1, end: end ? "right" : "left", label: v || "none" });
      }
      if (k !== "run") return no("unknown_act");
      const blank = s.labels.findIndex((pc) => pc.some((x) => x === ""));
      if (blank >= 0) return refuse("label_all", blank, { piece: blank + 1 });
      // a piece with one pole only: an end with no pole, or the same pole at both ends
      const lone = s.labels.findIndex((pc) => pc.includes("-") || pc[0] === pc[1]);
      if (lone >= 0) return mal("one-pole", "one_pole", lone, { piece: lone + 1, pieces: s.labels.length });
      const wrong = s.labels.findIndex((pc, i) => pc[0] !== piecePole(p, i, 0) || pc[1] !== piecePole(p, i, 1));
      if (wrong >= 0) return refuse("look_again", wrong, { piece: wrong + 1 });
      return solved({}, { pieces: s.labels.length, poles: "both" });
    }
    case "taakat": {
      const i = Number((act as { i?: number }).i);
      if (k === "dip") {
        if (!inRange(i, 0, 1)) return no("bad_magnet");
        if (s.dipped[i]) return no("dipped", i);
        return ok({ dipped: s.dipped.map((x, j) => x || j === i), on: i }, { magnet: sizeAt(p, i), pins: KIT_PINS[sizeAt(p, i)] });
      }
      if (k !== "claim") return no("unknown_act");
      if (!inRange(i, 0, 1)) return no("bad_magnet");
      if (sizeAt(p, i) === "big") return mal("big-stronger", "bigger", i, { magnet: "big", tested: s.dipped.filter(Boolean).length });
      if (!s.dipped.every(Boolean)) return refuse("test_both", s.dipped.findIndex((x) => !x), { magnet: "small" });
      return solved({ on: i }, { magnet: "small", pins: KIT_PINS.small, other: KIT_PINS.big });
    }
    case "latkao": {
      if (k === "twist") {
        const by = Number(act.by);
        if (by !== 1 && by !== -1) return no("bad_turn");
        return ok({ twist: q4(s.twist + by), held: true }, { magnet: DIRS[q4(s.twist + by)], held: "yes" });
      }
      if (k === "let") {
        if (!s.held) return no("free");
        return ok({ twist: 0, held: false }, { settled: "N-S", from: DIRS[s.twist] });
      }
      if (k === "spin") {
        const by = Number(act.by);
        if (by !== 1 && by !== -1) return no("bad_turn");
        return ok({ map: q4(s.map + by) }, { map: DIRS[q4(s.map + by)] });
      }
      if (k !== "run") return no("unknown_act");
      if (s.held) return refuse("held", -1, { map: DIRS[s.map] });
      if (s.map !== 0) return refuse("map_off", -1, { map: DIRS[s.map] });
      return solved({}, { map: "N" });
    }
    case "ghoomo": case "loha": {
      if (k === "turn" || k === "dial") {
        const by = Number(act.by);
        if (by !== 1 && by !== -1) return no("bad_turn");
        const box = q4(s.box + by), needle = needleAt(p, s.spot);
        if (k === "dial") return ok({ box, turnedOff: false }, { dial: box === needle ? "set" : "off" });
        // the box turns with her; the needle does not
        const turnedOff = s.box === needle ? box !== needle : s.turnedOff && box !== needle;
        return ok({ face: q4(s.face + by), box, turnedOff }, { facing: s.face === p.target ? "landmark" : "away" });
      }
      if (k === "go") {
        const to = Number(act.to);
        if (p.goal !== "loha" || !(to === 0 || to === 1)) return no("bad_spot");
        if (to === s.spot) return no("here");
        return ok({ spot: to, turnedOff: false }, { spot: to ? "away" : "by_iron" });
      }
      if (k !== "run") return no("unknown_act");
      const needle = needleAt(p, s.spot), letter = letterAhead(s.face, s.box), f: Facts = { letter };
      if (s.face !== p.target) return refuse("not_facing", -1, f);
      // read by the iron with the dial set to its pulled needle: the reading the iron gave
      if (p.goal === "loha" && s.spot === 0) return s.box === needle ? mal("iron-trust", "near_iron", 0, f) : refuse("set_n", -1, f);
      if (s.box === needle) return solved({}, { ...f, read: "right" });
      return s.turnedOff ? mal("needle-turns", "needle_stayed", -1, f) : refuse("set_n", -1, f);
    }
  }
  return no("unknown_act");
}
const goalMet = (_l: PlayLevel<ChumbakParams>, s: ChumbakState) => s.done;

// ───────────────────────────── solve, shortcut, malActs ─────────────────────────────
const run = (level: PlayLevel<ChumbakParams>, acts: ChumbakAct[]) => { let s = init(level); for (const a of acts) s = apply(level, s, a, 1).state; return s; };
/** the quarter turns (±1 each) that take `from` to `to` the short way */
const turns = (from: number, to: number): number[] => { const d = q4(to - from); return d === 0 ? [] : d === 3 ? [-1] : d === 2 ? [1, 1] : [1]; };
function solve(level: PlayLevel<ChumbakParams>): ChumbakAct[] | null {
  const p = level.params;
  switch (p.goal) {
    case "sira": { const [a, b] = polesOf(p); return [{ kind: "probe", at: a }, { kind: "probe", at: b }, { kind: "mark", at: a }, { kind: "mark", at: b }, { kind: "run" }]; }
    case "jodo": { const key = trainKey(p); return [...(p.cars ?? []).flatMap((w, i): ChumbakAct[] => (w !== key[i] ? [{ kind: "flip", i }] : [])), { kind: "run" }]; }
    case "pakka": {
      // the magnet's left end pushes the pole it already is
      const pole = barPole(p, p.mag as number, 0) as "N" | "S";
      return [{ kind: "near", i: p.mag as number, end: 0, p: pole }, { kind: "claim", i: p.mag as number }];
    }
    case "todo": {
      const acts: ChumbakAct[] = [];
      for (let i = 0; i < (p.pieces as number); i++) for (const end of [0, 1]) if (!printed(p, i, end)) acts.push({ kind: "label", i, end, v: piecePole(p, i, end) });
      return [...acts, { kind: "run" }];
    }
    case "taakat": { const sm = sizeAt(p, 0) === "small" ? 0 : 1; return [{ kind: "dip", i: 0 }, { kind: "dip", i: 1 }, { kind: "claim", i: sm }]; }
    case "latkao": return [{ kind: "let" }, ...turns(p.map as number, 0).map((by): ChumbakAct => ({ kind: "spin", by })), { kind: "run" }];
    case "ghoomo": case "loha": {
      const go: ChumbakAct[] = p.goal === "loha" ? [{ kind: "go", to: 1 }] : [];
      const face = turns(p.face as number, p.target as number), box = q4((p.box as number) + face.reduce((x, y) => x + y, 0));
      return [...go, ...face.map((by): ChumbakAct => ({ kind: "turn", by })), ...turns(box, 0).map((by): ChumbakAct => ({ kind: "dial", by })), { kind: "run" }];
    }
  }
  return null;
}
/** idea-free play: answer at once; the cover's own ends; turn every carriage; claim a bar untested or only pulled; the big
 *  magnet's look; the map left as it lies; face the landmark and read without setting the dial */
function shortcut(level: PlayLevel<ChumbakParams>): ChumbakAct[] | null {
  const p = level.params, tries: ChumbakAct[][] = [[{ kind: "run" }]];
  switch (p.goal) {
    case "sira": tries.push([{ kind: "probe", at: 0 }, { kind: "probe", at: SPOTS - 1 }, { kind: "mark", at: 0 }, { kind: "mark", at: SPOTS - 1 }, { kind: "run" }]); break;
    case "jodo": tries.push([...(p.cars ?? []).map((_, i): ChumbakAct => ({ kind: "flip", i })), { kind: "run" }], [{ kind: "flip", i: 0 }, { kind: "run" }]); break;
    case "pakka": for (let i = 0; i < (p.bars as number); i++) tries.push([{ kind: "claim", i }], [{ kind: "near", i, end: 0, p: "N" === barPole(p, i, 0) ? "S" : "N" }, { kind: "claim", i }]); break;
    case "todo": for (const v of ["N", "S", "-"]) tries.push([...(solve(level) ?? []).filter((a) => a.kind === "label").map((a): ChumbakAct => ({ ...(a as Extract<ChumbakAct, { kind: "label" }>), v })), { kind: "run" }]); break;
    case "taakat": tries.push([{ kind: "claim", i: 0 }], [{ kind: "claim", i: 1 }]); break;
    case "latkao": tries.push([{ kind: "let" }, { kind: "run" }]); break;
    case "ghoomo": case "loha": tries.push([...(p.goal === "loha" ? [{ kind: "go", to: 1 } as ChumbakAct] : []), ...turns(p.face as number, p.target as number).map((by): ChumbakAct => ({ kind: "turn", by })), { kind: "run" }]); break;
  }
  for (const t of tries) if (run(level, t).done) return t;
  return null;
}
function malActs(level: PlayLevel<ChumbakParams>, malId: string): ChumbakAct[] | null {
  const p = level.params;
  switch (malId) {
    case "middle-strong": {
      if (p.goal !== "sira") return null;
      const mid = (p.from as number) + Math.floor(((p.len as number) - 1) / 2);
      return [{ kind: "probe", at: mid }, { kind: "mark", at: mid }, { kind: "run" }];
    }
    case "pull-proves": {
      if (p.goal !== "pakka") return null;
      // a plain iron bar is pulled, and called the magnet
      const iron = p.mag === 0 ? 1 : 0;
      return [{ kind: "near", i: iron, end: 0, p: "N" }, { kind: "claim", i: iron }];
    }
    case "one-pole": {
      if (p.goal !== "todo") return null;
      // the believer's labels: the new ends at a break have no pole
      return [...(solve(level) ?? []).filter((a) => a.kind === "label").map((a): ChumbakAct => ({ ...(a as Extract<ChumbakAct, { kind: "label" }>), v: "-" })), { kind: "run" }];
    }
    case "big-stronger": return p.goal === "taakat" ? [{ kind: "claim", i: sizeAt(p, 0) === "big" ? 0 : 1 }] : null;
    case "needle-turns": {
      if (p.goal !== "ghoomo") return null;
      // set the dial first, then turn to face the landmark and read as if the needle had turned too
      return [...turns(p.box as number, 0).map((by): ChumbakAct => ({ kind: "dial", by })), ...turns(p.face as number, p.target as number).map((by): ChumbakAct => ({ kind: "turn", by })), { kind: "run" }];
    }
    case "iron-trust": {
      if (p.goal !== "loha") return null;
      // by the iron: face the landmark, set the dial under the pulled needle, read
      const face = turns(p.face as number, p.target as number), box = q4((p.box as number) + face.reduce((x, y) => x + y, 0));
      return [...face.map((by): ChumbakAct => ({ kind: "turn", by })), ...turns(box, p.iron as number).map((by): ChumbakAct => ({ kind: "dial", by })), { kind: "run" }];
    }
  }
  return null;
}

// ───────────────────────────── generate ─────────────────────────────
const JITTER = 0.24;
function rows(goal: ChumbakGoal, look: 1 | 2 | 3): Partial<ChumbakParams>[] {
  const out: Partial<ChumbakParams>[] = [];
  const cross = (xs: Partial<ChumbakParams>[], key: keyof ChumbakParams, vals: readonly unknown[]) => xs.flatMap((x) => vals.map((v) => ({ ...x, [key]: v })));
  switch (goal) {
    case "sira":
      // look 1: the longest magnets (a clear middle); look 3: the shortest too
      for (let len = 3; len <= 5; len++) for (let from = 1; from + len - 1 <= SPOTS - 2; from++) if (look === 1 ? len >= 4 : look === 2 ? len <= 4 : true) out.push({ from, len });
      return out;
    case "jodo":
      for (const n of JODO_CARS[look]) for (let eng = 0; eng < 2; eng++) for (let m = 0; m < 1 << n; m++) out.push({ eng, cars: Array.from({ length: n }, (_, i) => (m >> i) & 1), shown: look < 3 });
      return out;
    case "pakka": { const n = look === 1 ? 2 : 3; return cross(cross([{ bars: n }], "mag", [...Array(n).keys()]), "flip", [0, 1]); }
    case "todo": return cross(cross([{ pieces: look + 1 }], "flip", [0, 1]), "cut", [0, 1, 2]);
    case "taakat": return [{ order: 0 }, { order: 1 }];
    // look 1: one quarter turn to make; look 3: a half turn (the map upside down, the landmark behind her)
    case "latkao": return cross(cross(cross([{}], "rot", [0, 1, 2, 3]), "twist", [1, 2, 3]), "map", look === 1 ? [1, 3] : look === 3 ? [2] : [1, 2, 3]);
    case "ghoomo": case "loha": {
      let xs = cross(cross(cross(cross([{}], "rot", [0, 1, 2, 3]), "face", [0, 1, 2, 3]), "target", [0, 1, 2, 3]), "box", [0, 1, 2, 3]);
      xs = xs.filter((x) => { const d = q4((x.target as number) - (x.face as number)); return look === 1 ? d % 2 === 1 : look === 3 ? d === 2 : true; });
      if (goal === "loha") xs = cross(xs, "iron", [1, 2, 3]);
      return xs;
    }
  }
}
function difficultyOf(p: ChumbakParams, steps: number): number {
  const base: Record<ChumbakGoal, number> = { sira: 0.25, jodo: 0.2, pakka: 0.35, todo: 0.35, taakat: 0.2, latkao: 0.2, ghoomo: 0.35, loha: 0.45 };
  const extra = p.goal === "sira" ? 0.06 * (5 - (p.len as number)) : p.goal === "jodo" && !p.shown ? 0.1 : 0;
  return Math.max(0, Math.min(1, base[p.goal] + 0.08 * (p.look - 1) + 0.03 * steps + extra));
}
function generate(req: GenRequest): Candidate<ChumbakParams>[] {
  const mode = (CHUMBAK_MODES.includes(req.mode as ChumbakMode) ? req.mode : "dhruv") as ChumbakMode;
  const goals = GOALS_OF[mode] as readonly ChumbakGoal[];
  const goal = (goals.includes(req.goal as ChumbakGoal) ? req.goal : goals[0]) as ChumbakGoal;
  const look = (req.fade === 2 || req.fade === 3 ? req.fade : 1) as 1 | 2 | 3, rnd = mulberry32(req.seed);
  const all = rows(goal, look).flatMap((r) => CTX[goal].map((ctx) => ({ ...r, ctx })));
  // the seed orders the rows; at most 48 are proved (the picker's band and the nudge below choose among them)
  for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
  const out: Candidate<ChumbakParams>[] = [];
  for (const row of all) {
    if (out.length >= 48) break;
    const params = { goal, look, lay: Math.floor(rnd() * 10000), ...row } as ChumbakParams;
    const sig = `${mode}:${goal}:${look}:${JSON.stringify(row)}`;
    const level = {
      v: "play@1", levelId: `chumbak-${mode}-${goal}-${out.length}-${req.seed}`, family: "kyun-lab", mode, topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: params.ctx, seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 1, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 },
    } as PlayLevel<ChumbakParams>;
    const v = validate(level as PlayLevel<unknown>);
    if (!v) continue;
    const sol = solve(v);
    if (!sol || !run(v, sol).done || shortcut(v)) continue;
    // a seeded nudge (± JITTER / 2) so the picker's nearest-to-band level differs from child to child
    const difficulty = Math.max(0, Math.min(1, difficultyOf(v.params, sol.length) + (rnd() - 0.5) * JITTER));
    out.push({ signature: sig, difficulty, level: v });
  }
  return out;
}

// ───────────────────────────── facts, board, grade ─────────────────────────────
function facts(level: PlayLevel<ChumbakParams>, s: ChumbakState): Facts {
  const p = level.params, f: Facts = { goal: p.goal };
  switch (p.goal) {
    case "sira": f.touched = s.probes.filter((x) => x >= 0).length; f.flags = s.marks.length; break;
    case "jodo": f.carriages = s.cars.length; if (s.joints.length) f.apart = s.joints.filter((j) => j < 0).length; break;
    case "pakka": case "todo": f.tests = s.tests.length; f.pushes = s.tests.filter((t) => t.r === "push").length; break;
    case "taakat": f.dipped = s.dipped.filter(Boolean).length; break;
    case "latkao": f.hanging = s.held ? "held" : "free"; f.map = DIRS[s.map]; break;
    default: f.letter = letterAhead(s.face, s.box); f.dial = s.box === needleAt(p, s.spot) ? "set" : "off"; if (p.goal === "loha") f.spot = s.spot ? "away" : "by_iron";
  }
  if (s.why) f.why = s.why;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<ChumbakParams>, s: ChumbakState) {
  const p = level.params, title = "Chumbak";
  switch (p.goal) {
    case "sira": return { title, lines: [s.probes.map((x) => (x < 0 ? "·" : String(x))).join(" "), `flags: ${s.marks.map((x) => x + 1).join(", ") || "—"}`] };
    case "jodo": return { title, lines: [`engine ${p.eng ? "S" : "N"}| ${s.cars.map((w) => carPoles(w).join("-")).join(" | ")}`, s.joints.length ? s.joints.map((j) => (j > 0 ? "pull" : "push")).join(" ") : ""].filter(Boolean) };
    case "pakka": return { title, lines: s.tests.map((t) => `${"ABC"[t.i]} ${t.end ? "right" : "left"} + ${t.p}: ${t.r}`) };
    case "todo": return { title, lines: s.labels.map((pc, i) => `${i + 1}: ${pc[0] || "?"} … ${pc[1] || "?"}`) };
    case "taakat": return { title, lines: [0, 1].map((i) => `${sizeAt(p, i)}: ${s.dipped[i] ? KIT_PINS[sizeAt(p, i)] : "?"} pins`) };
    case "latkao": return { title, lines: [`magnet N end: ${DIRS[s.twist]} (${s.held ? "held" : "free"})`, `map N: ${DIRS[s.map]}`] };
    default: return { title, lines: [`facing ${DIRS[s.face]}, dial N at ${DIRS[s.box]}, needle at ${DIRS[needleAt(p, s.spot)]}`, `ahead: ${letterAhead(s.face, s.box)}`] };
  }
}
function grade(level: PlayLevel<ChumbakParams>, acts: PlayActEnvelope<ChumbakAct>[]): PlayGrade {
  return gradeLevel(chumbakLogic, level, acts, { decisiveRefusals: ["middle", "not_pole", "both_ends", "repel_seen", "only_pull", "one_pole", "look_again", "bigger", "map_off", "set_n", "needle_stayed", "near_iron"], final: true });
}

export const chumbakLogic: FamilyLogic<ChumbakParams, ChumbakState, ChumbakAct> = {
  family: "kyun-lab", modes: CHUMBAK_MODES, malRules: CHUMBAK_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
export const chumbakHelpers = { q4, turns, run };
