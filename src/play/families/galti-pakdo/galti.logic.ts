// Galti Pakdo (ग़लती पकड़ो, "catch the mistake") · round 7, checking a classmate's working of a simple equation (class 7,
// c7-maths-ch15-t03). Nothing here runs on a clock. A friend's notebook shows how they solved an equation, line by line, and
// ends with a claim x = v. The child puts the claim on the taraazu in any line (the pans weigh both sides of THAT line with
// x = v put in), then either says "sab sahi" or taps the first line that breaks; in the mend goal they then pick the line
// that belongs there, and the law rewrites the working below it and weighs the new answer in the question itself.
//
// Every working line is made by the LAW (one step: open the bracket; take the number off the x side; take the x term off the
// right; divide by x's number; multiply by the divisor), done to both sides. A faulty working carries exactly ONE of the
// topic's own step bugs, at one step (BUGS below): a term moved across without changing + / − (move-no-change; for a minus
// term or an x term, sign-slip), only part of a bracket multiplied (part-bracket), a step done to one side only (one-side),
// the wrong undoing operation (wrong-inverse: ÷ undone by ÷, × undone by −). Never a random typo.
// Kinds of working (each served about a third of the time: the kind is drawn from the level's seed):
//   sahi    every line by the law; the claim balances the question; the child must check it there and say "sab sahi"
//   lucky   one bug, but the friend's next line goes on from the RIGHT line: the claim is right, a step is wrong
//           (kit: m-right-answer, "a right final answer means every step was right")
//   neat    one bug, carried by the law to the end: a neat last line that is plainly wrong (kit: m-neat-correct)
// Goals: pakdo (catch: s1 check it, s2 the first wrong line) and sudhaaro (mend: s2, s3 pick the fix; the fix choices are
// the law's line and two lines the step's other bugs make).
// The CHILD's beliefs (the family's mal-rules; each a deterministic act list, each with its own visible consequence):
//   neat-correct   "sab sahi" on a neat working without weighing it: the law weighs the question and the beam tips
//   right-answer   the question weighed (it balances), then "sab sahi" on a lucky working: the steps are not read
//   check-later    the claim weighed in a later line before the question (it balances there, the question does not)
import type { Candidate, Facts, FamilyLogic, GaltiAct, GenRequest, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

// ── expressions: k·x + b, a(x + b), x ÷ a + b ──
export type Expr = { t: "lin"; k: number; b: number } | { t: "br"; a: number; b: number } | { t: "div"; a: number; b: number };
/** one line: L = R (R is always k·x + b; k = 0 once the x term has left the right) */
export interface Eq { L: Expr; R: Extract<Expr, { t: "lin" }> }
export type Intent = "open" | "const" | "xr" | "coef" | "undiv";
export type Form = "lin" | "br-open" | "br-div" | "frac" | "both";
export type Kind = "sahi" | "lucky" | "neat";
export type GaltiGoal = "pakdo" | "sudhaaro";
export const FORMS: readonly Form[] = ["lin", "br-open", "br-div", "frac", "both"];
export const KINDS: readonly Kind[] = ["sahi", "lucky", "neat"];
export const PLAN: Record<Form, readonly Intent[]> = {
  lin: ["const", "coef"], "br-open": ["open", "const", "coef"], "br-div": ["coef", "const"], frac: ["const", "undiv"], both: ["xr", "const", "coef"],
};
/** the step bugs (the friend's one mal-rule), as the line each makes, by the intent it spoils */
export const BUG_KEYS: Record<Intent, readonly string[]> = {
  open: ["part-1", "part-2", "side-open"],
  const: ["move", "sign", "side", "inv-div"],
  xr: ["sign-x", "side-x"],
  coef: ["side", "inv-sub", "inv-mul"],
  undiv: ["side", "inv-div", "inv-sub"],
};
/** a bug key → the step bug it is (the name the child sees once the line is mended) */
export const BUG_OF: Record<string, string> = {
  move: "move-no-change", sign: "sign-slip", "sign-x": "sign-slip", side: "one-side", "side-x": "one-side", "side-open": "one-side",
  "part-1": "part-bracket", "part-2": "part-bracket", "inv-div": "wrong-inverse", "inv-sub": "wrong-inverse", "inv-mul": "wrong-inverse",
};
export const BUGS = ["move-no-change", "sign-slip", "part-bracket", "one-side", "wrong-inverse"] as const;
export const GALTI_MAL = ["neat-correct", "right-answer", "check-later"] as const;

export interface GaltiParams {
  goal: GaltiGoal;
  /** the scaffold (fade): 1 the friend's step written beside each line, short workings; 2 no notes; 3 four-line workings */
  look: 1 | 2 | 3;
  form: Form;
  /** the question (line 0) */
  eq: Eq;
  kind: Kind;
  /** the line the friend's one step bug is on (1 = the first working line); 0 for a sahi working */
  at: number;
  /** the bug key at `at` ("" for sahi) */
  bug: string;
  /** sudhaaro, faulty: the three lines offered for line `at`, in order ("ok" = the law's own line); else [] */
  fixes: string[];
  /** the friend: a {friendF} / {friendM} slot (filled with a name at serve time) or the name */
  who: string;
}
export interface GaltiState extends Undoable<GaltiState> {
  /** the line the claim is weighed in (−1 = none yet) */
  on: number;
  /** the claim has been weighed in the question (line 0) */
  orig: boolean;
  /** the line flagged as the first that breaks (−1 = none) */
  flag: number;
  /** sudhaaro: the fix taken from `fixes` (−1 = the friend's line) */
  fix: number;
  /** the law's last answer, for the view: "" | later | neat | lucky | follows | not_first | check_first | tips | not_all */
  why: string;
  /** the line a refused flag tried */
  tried: number;
  done: boolean; acts: number;
}

const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
const lin = (k: number, b: number): Extract<Expr, { t: "lin" }> => ({ t: "lin", k, b });
const MAXN = 999;

// ── rationals (a value on a pan may be a fraction: 2 ÷ 3) ──
export interface Q { n: number; d: number }
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
const q = (n: number, d = 1): Q => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; return { n: n / g, d: d / g }; };
const qadd = (a: Q, b: Q) => q(a.n * b.d + b.n * a.d, a.d * b.d);
const qsub = (a: Q, b: Q) => q(a.n * b.d - b.n * a.d, a.d * b.d);
const qmul = (a: Q, b: Q) => q(a.n * b.n, a.d * b.d);
const qdiv = (a: Q, b: Q) => q(a.n * b.d, a.d * b.n);
export const qcmp = (a: Q, b: Q) => Math.sign(a.n * b.d - b.n * a.d);
export const qText = (a: Q) => (a.d === 1 ? String(a.n) : `${a.n}/${a.d}`);
/** an expression as k·x + b with rational k, b */
const norm = (e: Expr): { k: Q; b: Q } => (e.t === "lin" ? { k: q(e.k), b: q(e.b) } : e.t === "br" ? { k: q(e.a), b: q(e.a * e.b) } : { k: q(1, e.a), b: q(e.b) });
export const valueAt = (e: Expr, v: number): Q => { const n = norm(e); return qadd(qmul(n.k, q(v)), n.b); };
/** the solution of a line, or null when x drops out */
export function rootOf(eq: Eq): Q | null {
  const l = norm(eq.L), r = norm(eq.R), k = qsub(l.k, r.k);
  return k.n === 0 ? null : qdiv(qsub(r.b, l.b), k);
}
/** −1: the left pan is heavier (it goes down), 0 level, 1 the right is heavier */
export const tiltAt = (eq: Eq, v: number) => -qcmp(valueAt(eq.L, v), valueAt(eq.R, v));
export const balances = (eq: Eq, v: number) => qcmp(valueAt(eq.L, v), valueAt(eq.R, v)) === 0;

// ── text ──
const plusB = (b: number) => (b > 0 ? ` + ${b}` : b < 0 ? ` − ${-b}` : "");
const xTerm = (k: number) => (k === 1 ? "x" : `${k}x`);
export function exprText(e: Expr): string {
  if (e.t === "br") return `${e.a}(x${plusB(e.b)})`;
  if (e.t === "div") return `x ÷ ${e.a}${plusB(e.b)}`;
  if (e.k === 0) return e.b < 0 ? `−${-e.b}` : String(e.b);
  return `${xTerm(e.k)}${plusB(e.b)}`;
}
export const lineText = (eq: Eq) => `${exprText(eq.L)} = ${exprText(eq.R)}`;
/** the expression with the claim put in for x ("3 × 7 + 5", "2 × (7 + 4)", "18 ÷ 3 + 2") */
export function subText(e: Expr, v: number): string {
  if (e.t === "br") return `${e.a} × (${v}${plusB(e.b)})`;
  if (e.t === "div") return `${v} ÷ ${e.a}${plusB(e.b)}`;
  if (e.k === 0) return e.b < 0 ? `−${-e.b}` : String(e.b);
  return `${e.k === 1 ? String(v) : `${e.k} × ${v}`}${plusB(e.b)}`;
}
/** the step written beside a line at look 1: what the friend did to both sides */
export function noteOf(intent: Intent, src: Eq): string {
  const L = src.L;
  switch (intent) {
    case "open": return L.t === "br" ? `${L.a} × ( )` : "";
    case "const": { const b = L.t === "br" ? 0 : L.b; return b > 0 ? `−${b}` : `+${-b}`; }
    case "xr": return `−${xTerm(src.R.k)}`;
    case "coef": return `÷${L.t === "br" ? L.a : L.t === "lin" ? L.k : 1}`;
    case "undiv": return `×${L.t === "div" ? L.a : 1}`;
  }
}

// ── the law: one step done to both sides ──
type StepOut = Eq | null | "bad";
const okNum = (n: number) => isInt(n) && Math.abs(n) <= MAXN;
/** the law's step (null: the step does not apply to this line; "bad": a fraction or a number out of range) */
export function lawStep(intent: Intent, eq: Eq): StepOut {
  const { L, R } = eq;
  switch (intent) {
    case "open": return L.t === "br" ? { L: lin(L.a, L.a * L.b), R } : null;
    case "const": {
      if (L.t === "br" || !L.b) return null;
      const nb = R.b - L.b;
      return okNum(nb) ? { L: L.t === "lin" ? lin(L.k, 0) : { t: "div", a: L.a, b: 0 }, R: lin(R.k, nb) } : "bad";
    }
    case "xr": return L.t === "lin" && R.k ? { L: lin(L.k - R.k, L.b), R: lin(0, R.b) } : null;
    case "coef": {
      if (R.k) return null;
      if (L.t === "lin" && !L.b && L.k > 1) return R.b % L.k === 0 ? { L: lin(1, 0), R: lin(0, R.b / L.k) } : "bad";
      if (L.t === "br") return R.b % L.a === 0 ? { L: lin(1, L.b), R: lin(0, R.b / L.a) } : "bad";
      return null;
    }
    case "undiv": return L.t === "div" && !L.b && !R.k ? (okNum(R.b * L.a) ? { L: lin(1, 0), R: lin(0, R.b * L.a) } : "bad") : null;
  }
}
/** the line a step bug makes from `src` at this intent, or null (the bug has no reading here) */
export function bugStep(intent: Intent, key: string, src: Eq): Eq | null {
  const { L, R } = src;
  const ok = (e: Eq | null) => (e && [e.L, e.R].every((x) => (x.t === "lin" ? okNum(x.k) && okNum(x.b) : okNum(x.a) && okNum(x.b))) ? e : null);
  switch (intent) {
    case "open":
      if (L.t !== "br") return null;
      if (key === "part-1") return ok({ L: lin(L.a, L.b), R });          // a(x + b) → ax + b
      if (key === "part-2") return ok({ L: lin(1, L.a * L.b), R });      // a(x + b) → x + ab
      if (key === "side-open") return ok({ L: lin(1, L.b), R });         // the a dropped from one side only
      return null;
    case "const": {
      if (L.t === "br" || !L.b) return null;
      const left: Expr = L.t === "lin" ? lin(L.k, 0) : { t: "div", a: L.a, b: 0 };
      if (key === "move" && L.b > 0) return ok({ L: left, R: lin(R.k, R.b + L.b) });       // +b moved as +b
      if (key === "sign" && L.b < 0) return ok({ L: left, R: lin(R.k, R.b + L.b) });       // −b moved as −b
      if (key === "side") return ok({ L: left, R });                                        // off one side only
      if (key === "inv-div") { const b = Math.abs(L.b); return b > 1 && R.b % b === 0 ? ok({ L: left, R: lin(R.k, R.b / b) }) : null; }   // + / − undone by ÷
      return null;
    }
    case "xr":
      if (L.t !== "lin" || !R.k) return null;
      if (key === "sign-x") return ok({ L: lin(L.k + R.k, L.b), R: lin(0, R.b) });        // −cx moved as +cx
      if (key === "side-x") return ok({ L, R: lin(0, R.b) });                              // off the right only
      return null;
    case "coef": {
      if (R.k) return null;
      if (L.t === "lin" && !L.b && L.k > 1) {
        if (key === "side") return ok({ L: lin(1, 0), R });                                // x side divided only
        if (key === "inv-sub") return ok({ L: lin(1, 0), R: lin(0, R.b - L.k) });          // ÷ done as −
        if (key === "inv-mul") return ok({ L: lin(1, 0), R: lin(0, R.b * L.k) });          // ÷ done as ×
        return null;
      }
      if (L.t === "br") {
        if (key === "side") return ok({ L: lin(1, L.b), R });
        if (key === "inv-sub") return ok({ L: lin(1, L.b), R: lin(0, R.b - L.a) });
        if (key === "inv-mul") return ok({ L: lin(1, L.b), R: lin(0, R.b * L.a) });
      }
      return null;
    }
    case "undiv":
      if (L.t !== "div" || L.b || R.k) return null;
      if (key === "side") return ok({ L: lin(1, 0), R });                                  // × done to the x side only
      if (key === "inv-div") return R.b % L.a === 0 ? ok({ L: lin(1, 0), R: lin(0, R.b / L.a) }) : null;   // ÷ undone by ÷
      if (key === "inv-sub") return ok({ L: lin(1, 0), R: lin(0, R.b - L.a) });            // ÷ undone by −
      return null;
  }
}
/** the working has reached x = n */
const done = (eq: Eq) => eq.L.t === "lin" && eq.L.k === 1 && !eq.L.b && !eq.R.k;

/** the friend's (or the mended) working: the lines, which intent made each, the step note, and the claim it ends on */
export interface Working { lines: Eq[]; ints: (Intent | null)[]; notes: string[]; answer: number }
/** the law's steps from a line on, skipping those that do not apply; null when a step is bad or it never reaches x = n */
function chain(from: Eq, intents: readonly Intent[]): { lines: Eq[]; ints: Intent[]; notes: string[] } | null {
  const lines: Eq[] = [], ints: Intent[] = [], notes: string[] = [];
  let cur = from;
  for (const it of intents) {
    const nx = lawStep(it, cur);
    if (nx === "bad") return null;
    if (!nx) continue;
    lines.push(nx); ints.push(it); notes.push(noteOf(it, cur)); cur = nx;
  }
  return done(cur) && cur.R.b >= 1 && cur.R.b <= MAXN ? { lines, ints, notes } : null;
}
/**
 * The working on the page. fix: −1 the friend's own; else a key from `fixes` ("ok" = the law's line at `at`), the lines
 * below it rewritten by the law. Null when the params cannot make one (validate refuses those).
 */
export function workingOf(p: Pick<GaltiParams, "eq" | "form" | "kind" | "at" | "bug">, fixKey: string | null = null): Working | null {
  const plan = PLAN[p.form];
  const right = chain(p.eq, plan);
  if (!right || right.lines.length !== plan.length) return null;
  const all = (lines: Eq[], ints: (Intent | null)[], notes: string[]): Working | null => {
    const last = lines[lines.length - 1];
    return done(last) && last.R.b >= 1 ? { lines, ints, notes, answer: last.R.b } : null;
  };
  const sahi = all([p.eq, ...right.lines], [null, ...right.ints], ["", ...right.notes]);
  if (p.kind === "sahi" && fixKey === null) return sahi;
  const s = p.at;
  if (!sahi || s < 1 || s > plan.length) return null;
  const before = sahi.lines.slice(0, s), intent = plan[s - 1], src = sahi.lines[s - 1];
  const head = { lines: before, ints: sahi.ints.slice(0, s), notes: sahi.notes.slice(0, s) };
  const key = fixKey ?? p.bug;
  const line = key === "ok" ? sahi.lines[s] : bugStep(intent, key, src);
  if (!line) return null;
  const note = noteOf(intent, src);
  // lucky (the friend's own working): the next line goes on from the RIGHT line s
  if (p.kind === "lucky" && fixKey === null) {
    if (s >= plan.length) return null;
    return all([...head.lines, line, ...sahi.lines.slice(s + 1)], [...head.ints, intent, ...sahi.ints.slice(s + 1)], [...head.notes, note, ...sahi.notes.slice(s + 1)]);
  }
  const rest = chain(line, plan.slice(s));
  if (!rest) {
    // the bug line may itself be the last (a one-side divide: x = n)
    if (!done(line) || line.R.b < 1) return null;
    return all([...head.lines, line], [...head.ints, intent], [...head.notes, note]);
  }
  return all([...head.lines, line, ...rest.lines], [...head.ints, intent, ...rest.ints], [...head.notes, note, ...rest.notes]);
}
/** the first line that does not follow from the line above it (a different solution), or 0 when every line follows */
export function firstBreak(lines: readonly Eq[]): number {
  for (let j = 1; j < lines.length; j++) {
    const a = rootOf(lines[j - 1]), b = rootOf(lines[j]);
    if (!a || !b || qcmp(a, b) !== 0) return j;
  }
  return 0;
}
export const follows = (lines: readonly Eq[], j: number) => { const a = rootOf(lines[j - 1]), b = rootOf(lines[j]); return !!a && !!b && qcmp(a, b) === 0; };
/** the law's line at `at` and the bug keys that make a different line there (the fix choices come from these) */
export function fixPool(p: Pick<GaltiParams, "eq" | "form">, at: number): { right: Eq; keys: string[] } | null {
  const plan = PLAN[p.form], right = chain(p.eq, plan);
  if (!right || right.lines.length !== plan.length || at < 1 || at > plan.length) return null;
  const src = at === 1 ? p.eq : right.lines[at - 2], intent = plan[at - 1], ok = right.lines[at - 1];
  const keys: string[] = [], seen = new Set([lineText(ok)]);
  for (const k of BUG_KEYS[intent]) {
    const e = bugStep(intent, k, src);
    if (!e || seen.has(lineText(e))) continue;
    seen.add(lineText(e)); keys.push(k);
  }
  return { right: ok, keys };
}

/** the values the teacher may not say before the child finds them: the verdict, the first wrong line, the mended line */
export function galtiHidden(level: PlayLevel<unknown>): string[] {
  const p = level.params as GaltiParams | null;
  if (!p || !p.eq || !PLAN[p.form]) return [];
  try {
    if (p.kind === "sahi") return ["sab sahi", "all correct"];
    const pool = fixPool(p, p.at), x = rootOf(p.eq);
    return [`line ${p.at}`, ...(pool ? [lineText(pool.right)] : []), ...(x && x.d === 1 ? [String(x.n)] : [])];
  } catch { return []; }
}

const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });
const WHO_RE = /^(\{friend[FM]?\}|[\p{L} .'-]{1,24})$/u;

function exprOk(e: unknown, side: "L" | "R"): e is Expr {
  const x = e as Expr | null;
  if (!x || typeof x !== "object") return false;
  if (x.t === "lin") return isInt(x.k) && isInt(x.b) && x.k >= 0 && x.k <= 20 && Math.abs(x.b) <= 99;
  if (side === "R") return false;
  if (x.t === "br" || x.t === "div") return isInt(x.a) && isInt(x.b) && x.a >= 2 && x.a <= 9 && Math.abs(x.b) <= 99;
  return false;
}
/** the question's shape for its form */
function formOk(form: Form, eq: Eq): boolean {
  const { L, R } = eq;
  switch (form) {
    case "lin": return L.t === "lin" && L.k >= 2 && L.b !== 0 && R.k === 0;
    case "br-open": case "br-div": return L.t === "br" && L.b > 0 && R.k === 0;
    case "frac": return L.t === "div" && L.b > 0 && R.k === 0;
    case "both": return L.t === "lin" && R.k >= 1 && L.k > R.k && L.b > 0 && R.b > L.b;
  }
}
/** every claim this level can weigh (the friend's, and the answer each offered fix leads to) fits on a pan */
function pansOk(eq: Eq, v: number): boolean {
  return [eq.L, eq.R].every((e) => { const x = valueAt(e, v); return x.n > 0 && x.n / x.d <= MAXN && x.d <= 9; });
}

function validate(level: PlayLevel<unknown>): PlayLevel<GaltiParams> | null {
  const p = level.params as Partial<GaltiParams> | null;
  if (!p || level.mode !== "kaapi" || (p.goal !== "pakdo" && p.goal !== "sudhaaro")) return null;
  const look = p.look === 1 || p.look === 2 || p.look === 3 ? p.look : 0;
  if (!look || !FORMS.includes(p.form as Form) || !KINDS.includes(p.kind as Kind)) return null;
  if (typeof p.who !== "string" || !WHO_RE.test(p.who)) return null;
  const eq = p.eq as Eq | undefined;
  if (!eq || !exprOk(eq.L, "L") || !exprOk(eq.R, "R")) return null;
  const form = p.form as Form, kind = p.kind as Kind;
  // rebuilt from its fields only (a tampered level never smuggles anything else in)
  const L0 = eq.L, E: Eq = { L: L0.t === "lin" ? lin(L0.k, L0.b) : { t: L0.t, a: L0.a, b: L0.b }, R: lin(eq.R.k, eq.R.b) };
  if (!formOk(form, E)) return null;
  const x = rootOf(E);
  if (!x || x.d !== 1 || x.n < 1 || x.n > 40) return null;
  if (!isInt(p.at) || typeof p.bug !== "string" || !Array.isArray(p.fixes) || !p.fixes.every((f) => typeof f === "string")) return null;
  const base = { eq: E, form, kind, at: p.at, bug: p.bug };
  if (kind === "sahi" ? p.at !== 0 || p.bug !== "" || p.fixes.length : p.at < 1 || !BUG_OF[p.bug]) return null;
  const w = workingOf(base);
  if (!w || w.answer > 99 || !pansOk(E, w.answer)) return null;
  if (w.lines.some((l) => [l.L, l.R].some((e) => (e.t === "lin" ? Math.abs(e.b) > MAXN || e.k > 40 : Math.abs(e.b) > MAXN)))) return null;
  const fb = firstBreak(w.lines);
  if (kind === "sahi" && (fb !== 0 || w.answer !== x.n)) return null;
  if (kind !== "sahi") {
    if (fb !== p.at || (kind === "lucky" ? w.answer !== x.n : w.answer === x.n)) return null;
    // the bug is one the step can make, and its line differs from the law's
    const pool = fixPool(base, p.at);
    if (!pool || !pool.keys.includes(p.bug)) return null;
  }
  const fixes = [...p.fixes];
  if (p.goal === "sudhaaro" && kind !== "sahi") {
    // three offers: the law's line once, two other bug lines (never the friend's own), all different, each a working
    if (fixes.length !== 3 || fixes.filter((f) => f === "ok").length !== 1 || new Set(fixes).size !== 3 || fixes.includes(p.bug)) return null;
    const pool = fixPool(base, p.at)!;
    for (const f of fixes) {
      if (f !== "ok" && !pool.keys.includes(f)) return null;
      const fw = workingOf(base, f);
      if (!fw || fw.answer > 99 || !pansOk(E, fw.answer) || (f === "ok" ? fw.answer !== x.n : fw.answer === x.n)) return null;
    }
  } else if (fixes.length) return null;
  return { ...level, params: { goal: p.goal, look, form, eq: E, kind, at: p.at, bug: p.bug, fixes, who: p.who } } as PlayLevel<GaltiParams>;
}

function init(_level: PlayLevel<GaltiParams>): GaltiState {
  return { on: -1, orig: false, flag: -1, fix: -1, why: "", tried: -1, done: false, acts: 0, prev: null, depth: 0 };
}
/** the working on the page in this state (the friend's, or the one a fix rewrote) */
export const pageOf = (p: GaltiParams, s: Pick<GaltiState, "fix">): Working => (s.fix >= 0 ? workingOf(p, p.fixes[s.fix]) : workingOf(p))!;

function apply(level: PlayLevel<GaltiParams>, s: GaltiState, act: GaltiAct, seq: number): { state: GaltiState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  const bump = (st: GaltiState): GaltiState => ({ ...st, acts: s.acts + 1 });
  const no = (code: string, patch: Partial<GaltiState> = {}) => ({ state: bump({ ...s, ...patch }), moments: out, refused: code });
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  const page = pageOf(p, s), friend = workingOf(p)!, v = page.answer;
  switch (act.kind) {
    case "check": {
      const j = Number(act.line);
      if (!isInt(j) || j < 0 || j >= page.lines.length) return no("bad_line");
      if (j === s.on) return no("same_line");
      const t = tiltAt(page.lines[j], v);
      const f: Facts = { line: j, claim: `x = ${v}`, tilt: t };
      // weighed in a later line before the question: that line balances, the question does not
      const later = j > 0 && !s.orig && balances(page.lines[j], v) && !balances(page.lines[0], v);
      if (later) out.push("check-later" in level.mal ? mom("misconception_consequence", seq, f, "check-later") : mom("law_refused", seq, { ...f, why: "check_later" }));
      else out.push(mom("progress", seq, f));
      return { state: bump(pushUndo(s, { ...s, on: j, orig: s.orig || j === 0, why: later ? "later" : "", tried: -1 })), moments: out };
    }
    case "flag": {
      const j = Number(act.line);
      if (!isInt(j) || j < 1 || j >= friend.lines.length) return no(j === 0 ? "question" : "bad_line");
      // a mended line tapped again: back to the friend's line, the offers open again
      if (p.goal === "sudhaaro" && j === s.flag) {
        if (s.fix < 0) return no("same_line");
        out.push(mom("progress", seq, { flag: j, reopened: "yes" }));
        return { state: bump(pushUndo(s, { ...s, fix: -1, why: "", tried: -1 })), moments: out };
      }
      const first = firstBreak(friend.lines);
      if (j === first) {
        if (p.goal === "pakdo") { out.push(mom("solved", seq, { flag: j })); return { state: bump(pushUndo(s, { ...s, flag: j, fix: -1, why: "", tried: -1, done: true })), moments: out }; }
        out.push(mom("progress", seq, { flag: j }));
        return { state: bump(pushUndo(s, { ...s, flag: j, fix: -1, why: "", tried: -1 })), moments: out };
      }
      // a line that does not follow, but an earlier one already breaks
      if (first > 0 && j > first && !follows(friend.lines, j)) { out.push(mom("near_miss", seq, { flag: j, why: "not_first" })); return no("not_first", { why: "not_first", tried: j }); }
      out.push(mom("law_refused", seq, { flag: j, why: "follows" }));
      return no("follows", { why: "follows", tried: j });
    }
    case "fix": {
      if (p.goal !== "sudhaaro" || p.kind === "sahi") return no("no_fix_here");
      if (s.flag !== p.at) return no("flag_first");
      const i = Number(act.i);
      if (!isInt(i) || i < 0 || i >= p.fixes.length) return no("bad_fix");
      if (i === s.fix) return no("same_fix");
      const nw = workingOf(p, p.fixes[i])!, f: Facts = { line: p.at, claim: `x = ${nw.answer}`, tilt: tiltAt(p.eq, nw.answer) };
      if (p.fixes[i] === "ok") { out.push(mom("solved", seq, f)); return { state: bump(pushUndo(s, { ...s, fix: i, on: 0, orig: true, why: "", tried: -1, done: true })), moments: out }; }
      // the law rewrites the lines below and weighs the new claim in the question: the beam tips
      out.push(mom("law_refused", seq, { ...f, why: "fix_tips" }));
      return { state: bump(pushUndo(s, { ...s, fix: i, on: 0, orig: true, why: "tips", tried: -1 })), moments: out, refused: "tips" };
    }
    case "sab": {
      if (s.fix >= 0) { out.push(mom("law_refused", seq, { why: "not_all" })); return no("not_all", { why: "not_all" }); }
      if (p.kind === "sahi") {
        if (!s.orig) { out.push(mom("law_refused", seq, { why: "check_first", claim: `x = ${v}` })); return no("check_first", { why: "check_first" }); }
        out.push(mom("solved", seq, { claim: `x = ${v}` }));
        return { state: bump(pushUndo(s, { ...s, done: true, why: "", tried: -1 })), moments: out };
      }
      // the law answers a "sab sahi" by weighing the claim in the question itself
      const mal = p.kind === "neat" ? "neat-correct" : "right-answer", f: Facts = { claim: `x = ${v}`, tilt: tiltAt(p.eq, v) };
      out.push(mal in level.mal ? mom("misconception_consequence", seq, f, mal) : mom("law_refused", seq, { ...f, why: "not_all" }));
      return { state: bump(pushUndo(s, { ...s, on: 0, orig: true, why: p.kind, tried: -1 })), moments: out, refused: "not_all" };
    }
  }
  return no("unknown_act");
}
const goalMet = (_l: PlayLevel<GaltiParams>, s: GaltiState) => s.done;

function solve(level: PlayLevel<GaltiParams>): GaltiAct[] | null {
  const p = level.params;
  if (p.kind === "sahi") return [{ kind: "check", line: 0 }, { kind: "sab" }];
  if (p.goal === "pakdo") return [{ kind: "flag", line: p.at }];
  const i = p.fixes.indexOf("ok");
  return i >= 0 ? [{ kind: "flag", line: p.at }, { kind: "fix", i }] : null;
}
/** "sab sahi" with nothing weighed, or weighed only in the last line: a level either solves is never served */
function shortcut(level: PlayLevel<GaltiParams>): GaltiAct[] | null {
  const last = workingOf(level.params)!.lines.length - 1;
  const tries: GaltiAct[][] = [[{ kind: "sab" }], [{ kind: "check", line: last }, { kind: "sab" }]];
  for (const t of tries) { let s = init(level); for (const a of t) s = apply(level, s, a, 1).state; if (s.done) return t; }
  return null;
}
/** the line a check-later child weighs in: the second-last line when the bug is above it, else the last */
export function laterLine(p: GaltiParams): number {
  const w = workingOf(p)!, n = w.lines.length;
  for (let j = n - 2; j >= 1; j--) if (j >= p.at && balances(w.lines[j], w.answer)) return j;
  return n - 1;
}
function malActs(level: PlayLevel<GaltiParams>, mal: string): GaltiAct[] | null {
  const p = level.params;
  if (mal === "neat-correct") return p.kind === "neat" ? [{ kind: "sab" }] : null;
  if (mal === "right-answer") return p.kind === "lucky" ? [{ kind: "check", line: 0 }, { kind: "sab" }] : null;
  if (mal === "check-later") return p.kind === "neat" ? [{ kind: "check", line: laterLine(p) }] : null;
  return null;
}

interface GaltiGrammar { forms?: Form[]; kind?: Kind }
/** the forms each look draws from (look 3: the four-line workings) */
const FORMS_OF: Record<1 | 2 | 3, readonly Form[]> = { 1: ["lin", "frac", "br-div"], 2: ["lin", "frac", "br-div", "br-open"], 3: ["br-open", "both"] };
const JITTER = 0.24;
function difficultyOf(p: GaltiParams, n: number): number {
  return 0.18 + 0.1 * (p.look - 1) + 0.05 * (n - 3) + (p.kind === "lucky" ? 0.16 : p.kind === "neat" ? 0.08 : 0) + (p.goal === "sudhaaro" ? 0.06 : 0) + 0.03 * p.at;
}

function generate(req: GenRequest): Candidate<GaltiParams>[] {
  const g = req.grammar as GaltiGrammar;
  const goal: GaltiGoal = req.goal === "sudhaaro" ? "sudhaaro" : "pakdo";
  const rnd = mulberry32(req.seed), out: Candidate<GaltiParams>[] = [], seen = new Set<string>();
  // the kind is the seed's FIRST draw, so a child's levels are a third each of sahi, lucky and neat workings
  const kind: Kind = KINDS.includes(g.kind as Kind) ? (g.kind as Kind) : KINDS[Math.floor(rnd() * 3)];
  const look = (req.fade === 2 || req.fade === 3 ? req.fade : 1) as 1 | 2 | 3;
  const forms = (Array.isArray(g.forms) && g.forms.length ? g.forms.filter((f) => FORMS.includes(f)) : FORMS_OF[look]);
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const pickOf = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
  const shuffle = <T>(xs: T[]): T[] => { for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [xs[i], xs[j]] = [xs[j], xs[i]]; } return xs; };
  const small = look === 1;
  for (let tries = 0; tries < 400 && out.length < 28; tries++) {
    const form = pickOf(forms.length ? forms : FORMS_OF[look]);
    const X = int(small ? 2 : 2, small ? 9 : 12);
    let eq: Eq;
    if (form === "lin") {
      const a = int(2, small ? 5 : 7), neg = rnd() < 0.4;
      const b = neg ? -int(1, Math.min(12, a * X - 1)) : int(1, small ? 12 : 20);
      eq = { L: lin(a, b), R: lin(0, a * X + b) };
    } else if (form === "br-open" || form === "br-div") {
      const a = int(2, small ? 4 : 5), b = int(1, small ? 6 : 9);
      eq = { L: { t: "br", a, b }, R: lin(0, a * (X + b)) };
    } else if (form === "frac") {
      const a = int(2, small ? 4 : 5), m = int(1, small ? 6 : 9), b = int(1, small ? 9 : 15);
      eq = { L: { t: "div", a, b }, R: lin(0, m + b) };
    } else {
      // x's number after the x term leaves the right is at least 2 (else the divide step would not be a step)
      const c = int(1, 4), a = c + int(2, 4), b = int(1, 12), x = int(1, 9);
      eq = { L: lin(a, b), R: lin(c, (a - c) * x + b) };
    }
    const plan = PLAN[form];
    let at = 0, bug = "";
    if (kind !== "sahi") {
      // lucky: the bug is never on the last step (a later line goes on from the right line)
      const steps = [...Array(plan.length).keys()].map((i) => i + 1).filter((i) => kind === "neat" || i < plan.length);
      at = pickOf(steps);
      const pool = fixPool({ eq, form }, at);
      if (!pool || !pool.keys.length) continue;
      bug = pickOf(pool.keys);
    }
    let fixes: string[] = [];
    if (goal === "sudhaaro" && kind !== "sahi") {
      const others = fixPool({ eq, form }, at)!.keys.filter((k) => k !== bug);
      if (others.length < 2) continue;
      fixes = shuffle(["ok", ...shuffle([...others]).slice(0, 2)]);
    }
    const params: GaltiParams = { goal, look, form, eq, kind, at, bug, fixes, who: rnd() < 0.5 ? "{friendF}" : "{friendM}" };
    const sig = `${goal}:${form}:${kind}:${lineText(eq)}:${at}:${bug}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    const cand: Candidate<GaltiParams> = {
      signature: sig, difficulty: 0,
      level: { v: "play@1", levelId: `galti-${sig}-${req.seed}`.replace(/[^a-z0-9:=+._-]/gi, "_"), family: "galti-pakdo", mode: "kaapi", topicId: req.topicId, skillId: req.skillId,
        fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: "kaapi", seed: req.seed,
        proof: { solvable: true, shortcutFree: true, minActs: 1, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } },
    };
    const v = validate(cand.level);
    if (!v || !solve(v) || shortcut(v)) continue;
    // a seeded nudge (± JITTER / 2) so the picker's nearest-to-band level differs from child to child
    const n = workingOf(v.params)!.lines.length;
    cand.difficulty = Math.max(0, Math.min(1, difficultyOf(v.params, n) + (rnd() - 0.5) * JITTER));
    out.push(cand);
  }
  return out;
}

function facts(level: PlayLevel<GaltiParams>, s: GaltiState): Facts {
  const p = level.params, w = pageOf(p, s), f: Facts = { goal: p.goal, lines: w.lines.length, claim: `x = ${w.answer}` };
  if (s.on >= 0) { f.on = s.on; f.tilt = tiltAt(w.lines[s.on], w.answer); }
  if (s.flag >= 0) f.flag = s.flag;
  if (s.fix >= 0) f.fixed = "yes";
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<GaltiParams>, s: GaltiState) {
  const p = level.params, w = pageOf(p, s);
  const lines = w.lines.map((l, j) => `${j === 0 ? "?" : j}  ${lineText(l)}`);
  if (s.on >= 0) lines.push(`x = ${w.answer} in ${s.on === 0 ? "?" : s.on}: ${subText(w.lines[s.on].L, w.answer)} ${balances(w.lines[s.on], w.answer) ? "=" : "≠"} ${subText(w.lines[s.on].R, w.answer)}`);
  return { title: "Galti Pakdo", lines };
}
function grade(level: PlayLevel<GaltiParams>, acts: PlayActEnvelope<GaltiAct>[]): PlayGrade {
  return gradeLevel(galtiLogic, level, acts, { decisiveRefusals: ["not_all", "follows", "tips"], final: true });
}

export const galtiLogic: FamilyLogic<GaltiParams, GaltiState, GaltiAct> = {
  family: "galti-pakdo", modes: ["kaapi"], malRules: GALTI_MAL,
  // pakdo: one line flagged (or "sab sahi") wins (a lucky tap 41 %, games audit GAMES-03): its correct enters at CHANCE_WEIGHT
  oneDecision: ["pakdo"],
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
