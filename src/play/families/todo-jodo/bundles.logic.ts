// Todo-Jodo · bundles (DESIGN.md §3.1): place-value columns of blocks (thousands plates, hundreds flats, tens rods, ones
// cubes). Take a number away column by column; a column that has too few cannot give them until a bigger block is
// unbundled into ten smaller ones (conservation under regrouping). Fade 3: the written column is the controller (write each
// answer digit). PURE law + generator + solver + grader.
// Mal-rules (fade 3, where the written column can carry them): smaller-from-larger · zero-regroup · no-decrement.
import type { BundlesAct, Candidate, FamilyLogic, Facts, GenRequest, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export interface BundlesParams { a: number; b: number; places: number; goal: "subtract" }
export interface BundlesState extends Undoable<BundlesState> {
  cols: number[];            // blocks now in each place (index 0 = ones)
  taken: number[];           // blocks taken away from each place
  written: (number | null)[];
  unbundled: number[];       // how many times each place was unbundled (the borrow marks at fade 2)
  done: boolean;
  acts: number;
}
export const BUNDLES_MAL = ["smaller-from-larger", "zero-regroup", "no-decrement"] as const;
export const PLACE_NAMES = ["ones", "tens", "hundreds", "thousands", "ten-thousands", "lakhs"] as const;
// the place as the child's screen names it (src/play/copy.ts bundles.places), for the teacher's line in each language: an
// English "hundreds" in a Hinglish line under a column labelled "sau" is a mismatch (mistake-state still, 2026-10-09)
const PLACE_HL = ["ek", "das", "sau", "hazaar", "das hazaar", "lakh"] as const;
const PLACE_HI = ["इकाई", "दस", "सौ", "हज़ार", "दस हज़ार", "लाख"] as const;
const placeFacts = (q: number) => ({ place: PLACE_NAMES[q], place_hl: PLACE_HL[q], place_hi: PLACE_HI[q] });

export const digitsOf = (n: number, places: number) => Array.from({ length: places }, (_, p) => Math.floor(n / 10 ** p) % 10);
const valueOfCols = (cols: number[]) => cols.reduce((s, c, p) => s + c * 10 ** p, 0);
const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });

/** The answer digits a child holding mal-rule `mal` writes (null = this subtraction cannot show the belief). */
export function malDigits(p: BundlesParams, mal: string): number[] | null {
  const A = digitsOf(p.a, p.places), B = digitsOf(p.b, p.places), truth = digitsOf(p.a - p.b, p.places);
  let out: number[] | null = null;
  if (mal === "smaller-from-larger") out = A.map((x, i) => Math.abs(x - B[i]));
  if (mal === "zero-regroup") {
    const lead = A.findIndex((x, i) => x > 0 && i > 0 && A.slice(0, i).some((z) => z === 0));
    if (lead < 0) return null;
    out = A.map((x, i) => (i < lead ? (x === 0 ? 10 : x) : i === lead ? x - 1 : x) - B[i]);
    if (out.some((d) => d < 0 || d > 9)) return null;
  }
  if (mal === "no-decrement") {
    out = []; for (let i = 0; i < A.length; i++) out.push(A[i] < B[i] ? A[i] + 10 - B[i] : A[i] - B[i]);
  }
  return out && out.join() !== truth.join() ? out : null;
}

function validate(level: PlayLevel<unknown>): PlayLevel<BundlesParams> | null {
  const p = level.params as Partial<BundlesParams> | null;
  if (!p || p.goal !== "subtract") return null;
  const a = Number(p.a), b = Number(p.b), places = Number(p.places);
  if (!Number.isInteger(places) || places < 2 || places > 6) return null;
  if (!Number.isInteger(a) || !Number.isInteger(b) || b < 1 || a <= b || a >= 10 ** places) return null;
  return { ...level, params: { a, b, places, goal: "subtract" } } as PlayLevel<BundlesParams>;
}
function init(level: PlayLevel<BundlesParams>): BundlesState {
  const p = level.params;
  return { cols: digitsOf(p.a, p.places), taken: Array(p.places).fill(0), written: Array(p.places).fill(null), unbundled: Array(p.places).fill(0), done: false, acts: 0, prev: null, depth: 0 };
}
function apply(level: PlayLevel<BundlesParams>, s: BundlesState, act: BundlesAct, seq: number): { state: BundlesState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [], B = digitsOf(p.b, p.places);
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  const bump = (st: BundlesState): BundlesState => ({ ...st, acts: s.acts + 1 });
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  const placeOk = (q: number) => Number.isInteger(q) && q >= 0 && q < p.places;
  switch (act.kind) {
    case "unbundle": {
      const q = act.place;
      if (!placeOk(q) || q === 0) return { state: bump(s), moments: out, refused: "bad_place" };
      if (s.cols[q] < 1) { out.push(mom("law_refused", seq, { why: "empty_place", ...placeFacts(q) })); return { state: bump(s), moments: out, refused: "empty" }; }
      const cols = s.cols.map((c, i) => (i === q ? c - 1 : i === q - 1 ? c + 10 : c));
      const unbundled = s.unbundled.map((u, i) => (i === q ? u + 1 : u));
      out.push(mom("progress", seq, { unbundled: PLACE_NAMES[q], into: PLACE_NAMES[q - 1], now: cols.slice().reverse().join("|") }));
      return { state: bump(pushUndo(s, { ...s, cols, unbundled })), moments: out };
    }
    case "take": {
      const q = act.place, n = Math.round(Number(act.n));
      if (!placeOk(q) || !Number.isInteger(n) || n < 1) return { state: bump(s), moments: out, refused: "bad_take" };
      const need = B[q] - s.taken[q];
      if (n > need) { out.push(mom("law_refused", seq, { why: "more_than_asked", ...placeFacts(q), need })); return { state: bump(s), moments: out, refused: "too_many" }; }
      if (s.cols[q] < n) { out.push(mom("law_refused", seq, { why: "not_enough", ...placeFacts(q), have: s.cols[q], need: n })); return { state: bump(s), moments: out, refused: "not_enough" }; }
      const cols = s.cols.map((c, i) => (i === q ? c - n : c)), taken = s.taken.map((t, i) => (i === q ? t + n : t));
      out.push(mom("progress", seq, { took: n, ...placeFacts(q), left: cols[q] }));
      return { state: bump(pushUndo(s, { ...s, cols, taken })), moments: out };
    }
    case "write": {
      const q = act.place, d = Math.round(Number(act.digit));
      if (!placeOk(q) || !Number.isInteger(d) || d < 0 || d > 9) return { state: bump(s), moments: out, refused: "bad_write" };
      const written = s.written.map((w, i) => (i === q ? d : w));
      return { state: bump(pushUndo(s, { ...s, written })), moments: out };
    }
    case "done": {
      if (level.fade === 3) {
        // a leading place the answer does not reach may stay blank (nobody writes 09524)
        const len = String(p.a - p.b).length, w0 = s.written.map((x, q) => x ?? (q >= len ? 0 : null));
        if (w0.some((x) => x === null)) return { state: bump(s), moments: out, refused: "write_all" };
        const truth = digitsOf(p.a - p.b, p.places), w = w0 as number[];
        if (w.join() === truth.join()) { out.push(mom("solved", seq, { answer: p.a - p.b })); return { state: bump(pushUndo(s, { ...s, done: true })), moments: out }; }
        for (const mal of Object.keys(level.mal)) { const md = malDigits(p, mal); if (md && md.join() === w.join()) { out.push(mom("misconception_consequence", seq, { written: w.slice().reverse().join("") }, mal)); return { state: bump(s), moments: out, refused: "wrong_answer" }; } }
        out.push(mom("law_refused", seq, { why: "check_columns", written: w.slice().reverse().join("") }));
        return { state: bump(s), moments: out, refused: "wrong_answer" };
      }
      if (s.taken.some((t, i) => t < B[i])) { out.push(mom("law_refused", seq, { why: "take_all" })); return { state: bump(s), moments: out, refused: "take_all" }; }
      out.push(mom("solved", seq, { left: valueOfCols(s.cols) }));
      return { state: bump(pushUndo(s, { ...s, done: true })), moments: out };
    }
  }
  return { state: bump(s), moments: out, refused: "unknown_act" };
}
const goalMet = (_l: PlayLevel<BundlesParams>, s: BundlesState) => s.done;

function solve(level: PlayLevel<BundlesParams>): BundlesAct[] | null {
  const p = level.params, B = digitsOf(p.b, p.places), acts: BundlesAct[] = [];
  if (level.fade === 3) {
    const len = String(p.a - p.b).length;
    digitsOf(p.a - p.b, p.places).forEach((d, q) => { if (q < len) acts.push({ kind: "write", place: q, digit: d }); });
    acts.push({ kind: "done" });
    return acts;
  }
  const cols = digitsOf(p.a, p.places);
  for (let q = 0; q < p.places; q++) {
    if (B[q] === 0) continue;
    if (cols[q] < B[q]) {
      let r = q + 1; while (r < p.places && cols[r] === 0) r++;
      if (r >= p.places) return null;
      for (let k = r; k > q; k--) { acts.push({ kind: "unbundle", place: k }); cols[k]--; cols[k - 1] += 10; }
    }
    acts.push({ kind: "take", place: q, n: B[q] }); cols[q] -= B[q];
  }
  acts.push({ kind: "done" });
  return acts;
}
/** In the block world the law makes every route conserve value; at fade 3 a column-by-column guess is not a shortcut
 *  because the whole written answer is checked at once. Probe: declare done at once. */
function shortcut(level: PlayLevel<BundlesParams>): BundlesAct[] | null {
  let s = init(level); s = apply(level, s, { kind: "done" }, 1).state;
  return s.done ? [{ kind: "done" }] : null;
}
function malActs(level: PlayLevel<BundlesParams>, mal: string): BundlesAct[] | null {
  if (level.fade !== 3) return null;
  const md = malDigits(level.params, mal);
  return md ? [...md.map((d, q) => ({ kind: "write", place: q, digit: d }) as BundlesAct), { kind: "done" }] : null;
}
function difficultyOf(p: BundlesParams): number {
  const A = digitsOf(p.a, p.places), B = digitsOf(p.b, p.places);
  const borrows = A.filter((x, i) => x < B[i]).length, zeros = A.slice(0, -1).filter((x) => x === 0).length;
  return Math.min(1, 0.1 + 0.15 * borrows + 0.15 * zeros + 0.08 * (p.places - 3));
}
function generate(req: GenRequest): Candidate<BundlesParams>[] {
  const g = req.grammar as { places?: number; zeros?: boolean };
  const places = g.places ?? (req.classLevel <= 4 ? 4 : 5);
  const rnd = mulberry32(req.seed), out: Candidate<BundlesParams>[] = [];
  for (let k = 0; k < 160; k++) {
    let a = Math.floor(10 ** (places - 1) + rnd() * 9 * 10 ** (places - 1));
    if (g.zeros || k % 3 === 0) a = Math.floor(a / 10 ** (places - 1)) * 10 ** (places - 1) + (k % 2 ? Math.floor(rnd() * 10) * 10 ** (places - 2) : 0);
    const b = Math.floor(10 ** (places - 2) + rnd() * (a - 10 ** (places - 2)));
    if (b >= a || b < 10) continue;
    const params: BundlesParams = { a, b, places, goal: "subtract" };
    if (!digitsOf(a, places).some((x, i) => x < digitsOf(b, places)[i])) continue;    // at least one regrouping
    out.push({ signature: `sub:${a}-${b}`, difficulty: difficultyOf(params),
      level: { v: "play@1", levelId: `bund-${a}-${b}-${req.seed}`, family: "todo-jodo", mode: "bundles", topicId: req.topicId, skillId: req.skillId, fade: req.fade, goal: "subtract", params,
        targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: "blocks", seed: req.seed,
        proof: { solvable: true, shortcutFree: true, minActs: 0, solutions: 0, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } } });
  }
  return out;
}
function facts(level: PlayLevel<BundlesParams>, s: BundlesState): Facts {
  const p = level.params;
  const f: Facts = { a: p.a, b: p.b, blocks: s.cols.slice().reverse().join("|"), taken: s.taken.slice().reverse().join("|") };
  if (level.fade === 3) f.written = s.written.slice().reverse().map((w) => (w === null ? "_" : w)).join("");
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<BundlesParams>, s: BundlesState) {
  const p = level.params;
  return { title: `${p.a} − ${p.b}`, lines: [`blocks: ${s.cols.slice().reverse().join(" | ")}`, `taken: ${s.taken.slice().reverse().join(" | ")}`] };
}
function grade(level: PlayLevel<BundlesParams>, acts: PlayActEnvelope<BundlesAct>[]): PlayGrade {
  return gradeLevel(bundlesLogic, level, acts, { decisiveRefusals: ["wrong_answer"], final: true });
}
export const bundlesLogic: FamilyLogic<BundlesParams, BundlesState, BundlesAct> = {
  family: "todo-jodo", modes: ["bundles"], malRules: BUNDLES_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
export const bundlesHelpers = { digitsOf, valueOfCols, malDigits, PLACE_NAMES };
