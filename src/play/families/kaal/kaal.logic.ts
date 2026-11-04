// Kaal (काल, "time") · Kaal-nadi, the river of time (round 7, the first SST law family). A horizontal river: BCE on the
// left, CE on the right, and NO year 0 (1 BCE flows straight into 1 CE). An event stone ("Ashoka becomes king (c. 268 BCE)";
// at class 6 just the year) rides in a boat; the child drags the boat along the river to the year and RUNs: the stone drops,
// and the law compares the year under the boat with the event's VERIFIED year (data/play/kaal/events.json, checked
// against the kits by server/play/tools/build-kaal.mjs) within a tolerance proportional to the river's span. A miss: the
// stone floats to its true place and the exact gap in years is drawn. PURE law + generator + solver + grader.
//
// Goals (mode place: place, century; mode order: order):
//   place    one stone to its year
//   century  one stone into its century band (the river is shaded into centuries named only by their ordinals)
//   order    3-4 stones arrive one after another; each is placed and checked on its own, so the sequence is BUILT by placing
//            (never by sorting buttons); a landed stone stays on the river as a landmark
//
// The river's coordinate x: year y > 0 (CE) occupies (y − 1, y]; year y < 0 (BCE) occupies [y, y + 1). So x = 0 is the
// boundary between 1 BCE and 1 CE, a tick at x = −500 is where 500 BCE begins and a tick at x = 100 is where 100 CE ends,
// and the years between a and b are |xOf(a) − xOf(b)| (1 BCE → 1 CE is 1 year; 500 BCE → 200 BCE is 300).
//
// Mal-rules (each with a deterministic malActs; a level shows one only where its stone lands > 2 tolerances from the truth
// and no other mal-rule predicts the same landing):
//   bce-counts-up         BCE years read as counting UP to the right like CE years. Rule: the BCE stretch of the visible
//                         river [lo, min(hi, 0)] is mirrored, x' = lo + min(hi, 0) − x, so on a river from 600 BCE the
//                         stone for 500 BCE lands near 100 BCE (to the right of where 100 BCE belongs). place / order only.
//   century-first-digits  a year's century read from its first digits: 1857 → the 18th-century band, 634 CE → the 6th,
//                         550 BCE → the 5th century BCE. century goal only (the stone lands mid-band).
//   year-zero             a year 0 counted between 1 BCE and 1 CE: the stone lands one year further from the boundary
//                         than its year (5 CE at 6 CE, 3 BCE at 4 BCE). Only on a river that crosses the boundary at a
//                         one-year tolerance (spans ≤ 40 years). No kit slug names it yet: implemented, mapped nowhere.
import type { Candidate, FamilyLogic, Facts, GenRequest, KaalAct, Lang, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32, shuffle } from "../../core/rng.ts";

export type KaalGoal = "place" | "order" | "century";
export interface KaalLabel { hinglish: string; en: string; hi: string }
/** One dated event as the server passes it (data/play/kaal/events.json); a class-6 bare year has `label: null`. */
export interface KaalEvent { id: string; topicId?: string; year: number; circa: boolean; decade?: boolean; label: KaalLabel | null }
export interface KaalStone { id: string; year: number; circa: boolean; decade: boolean; label: KaalLabel | null }
export interface KaalParams {
  goal: KaalGoal;
  /** the river's ends in x (multiples of `step`) and its tick step in years; `minor` unlabelled ticks (0 = none) */
  lo: number; hi: number; step: number; minor: number;
  /** fade: 1 every tick labelled and the bands shaded, 2 every other tick, 3 only the ends and the BCE | CE boundary */
  labels: 1 | 2 | 3;
  /** the stones, in the order the boat carries them */
  stones: KaalStone[];
  /** years (computed from the span, never trusted from a level); 0 = the exact year */
  tol: number;
  /** what the stone shows besides its year: "year" (class 6) or the event's name */
  text: "year" | "event";
}
export interface KaalState extends Undoable<KaalState> { marks: (number | null)[]; landed: boolean[]; checks: number; done: boolean; acts: number }
export const KAAL_MAL = ["bce-counts-up", "century-first-digits", "year-zero"] as const;

export const STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000] as const;
const MAX_ABS = 12000, FUTURE = 2500;

// ───────────────────────────── the river's arithmetic (no year 0) ─────────────────────────────

/** the middle of year y on the river */
export const xOf = (y: number) => (y > 0 ? y - 0.5 : y + 0.5);
/** the year under river coordinate x (never 0) */
export const yearAt = (x: number) => (x >= 0 ? Math.max(1, Math.ceil(x)) : Math.floor(x));
/** years from a to b (1 BCE to 1 CE is 1) */
export const yearsApart = (a: number, b: number) => Math.abs(xOf(a) - xOf(b));
/** the signed century: 1857 → 19, 1900 → 19, 1901 → 20, 550 BCE → −6 */
export const centuryOf = (y: number) => (y > 0 ? Math.ceil(y / 100) : -Math.ceil(-y / 100));
/** the band index of a century on the river (…, −2, −1 | 0, 1, …): the 1st century BCE is −1, the 1st CE 0 */
const bandIx = (c: number) => (c > 0 ? c - 1 : c);
/** the x where century c's band begins */
export const bandLo = (c: number) => (c > 0 ? 100 * (c - 1) : 100 * c);
/** the year in the middle of century c's band */
const bandMid = (c: number) => (c > 0 ? 100 * c - 50 : -(100 * -c - 50));
export const tolFor = (span: number) => (span <= 40 ? 0 : Math.max(1, Math.round(span * 0.02)));
export function minorFor(step: number, span: number): number {
  if (step <= 1) return 0;
  for (const m of [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500]) if (m < step && step % m === 0 && [2, 4, 5, 10].includes(step / m) && span / m <= 60) return m;
  return 0;
}
export const inLine = (p: Pick<KaalParams, "lo" | "hi">, y: number) => y !== 0 && xOf(y) >= p.lo && xOf(y) <= p.hi;
/** is tick i (0 … n) labelled at this fade (the view may thin labels further on a narrow box, never add) */
export const labelled = (p: Pick<KaalParams, "labels" | "lo" | "hi" | "step">, i: number) => {
  const n = Math.round((p.hi - p.lo) / p.step);
  return p.labels === 1 || i === 0 || i === n || (p.labels === 2 && i % 2 === 0);
};

// ───────────────────────────── words the law shares with the view (never sentences) ─────────────────────────────

/** "500 BCE", "c. 268 BCE", "1857 CE", "1960s": the law's own (English) year text for facts and the board; the view renders
 *  the lesson language from data/play/engine-words.json (kaal.era.*, kaal.circa, kaal.decade, kaal.ord.*) */
export function yearText(y: number, _lang: Lang = "en", o: { circa?: boolean; decade?: boolean } = {}): string {
  if (o.decade) return `${y - 5}s`;
  const t = `${Math.abs(y)} ${y < 0 ? "BCE" : "CE"}`;
  return o.circa ? `c. ${t}` : t;
}
export const stoneYear = (s: KaalStone, lang: Lang = "en") => yearText(s.year, lang, s);
export const eraWord = (bce: boolean, _lang: Lang = "en") => (bce ? "BCE" : "CE");
/** "19th" (English); the view gives the Hindi ordinal from engine words */
export function ordinal(n: number, _lang: Lang = "en"): string {
  const t = n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${t}`;
}

// ───────────────────────────── mal-rules ─────────────────────────────

/** where a child holding `mal` drops stone `st` (a year), before the fit / distance / ambiguity checks */
function rawMal(p: KaalParams, st: KaalStone, mal: string): number | null {
  switch (mal) {
    case "bce-counts-up": {
      if (p.goal === "century" || st.year > 0 || p.lo >= 0) return null;
      return yearAt(p.lo + Math.min(p.hi, 0) - xOf(st.year));
    }
    case "century-first-digits": {
      if (p.goal !== "century") return null;
      const fd = Math.floor(Math.abs(st.year) / 100), c = st.year > 0 ? fd : -fd;
      return fd === 0 || c === centuryOf(st.year) ? null : bandMid(c);
    }
    case "year-zero": {
      if (p.goal === "century" || !(p.lo < 0 && p.hi > 0)) return null;
      return st.year > 0 ? st.year + 1 : st.year - 1;
    }
  }
  return null;
}
/** two drops land the same for the law (the same century band, or within the tolerance) */
const sameLanding = (p: KaalParams, a: number, b: number) => (p.goal === "century" ? centuryOf(a) === centuryOf(b) : yearsApart(a, b) <= p.tol);
/** the law accepts year y for stone st */
export const accepted = (p: KaalParams, st: KaalStone, y: number) => sameLanding(p, y, st.year);
/**
 * The year a child holding `mal` drops stone `st` at, or null when the belief says nothing different here (the landing is
 * within 2 tolerances of the truth, or the same century), when it lands off the river, or when another mal-rule predicts
 * the very same landing (a signature names ONE belief).
 */
export function malYear(p: KaalParams, st: KaalStone, mal: string): number | null {
  const m = rawMal(p, st, mal);
  if (m === null || !inLine(p, m)) return null;
  if (p.goal === "century" ? centuryOf(m) === centuryOf(st.year) : yearsApart(m, st.year) <= 2 * p.tol) return null;
  for (const other of KAAL_MAL) {
    if (other === mal) continue;
    const o = rawMal(p, st, other);
    if (o !== null && sameLanding(p, o, m)) return null;
  }
  return m;
}
/** the hidden values: the years the child has to find (and the century, in a century goal) */
export function kaalHidden(level: PlayLevel<unknown>): number[] {
  const p = level.params as Partial<KaalParams> | null;
  if (!p || !Array.isArray(p.stones)) return [];
  const out = p.stones.map((s) => Math.abs(Number(s?.year))).filter((y) => Number.isFinite(y) && y > 0);
  if (p.goal === "century") out.push(...p.stones.map((s) => Math.abs(centuryOf(Number(s?.year)))).filter((c) => c > 0));
  return [...new Set(out)];
}

// ───────────────────────────── the verified events the server registered (never loaded by the client) ─────────────────────────────

let REGISTRY: Map<string, KaalEvent> | null = null;
/** The play server registers data/play/kaal/events.json here (server/play/levels.js); validate then refuses a stone whose
 *  year, circa or name differs from the file. The client never registers it (it never loads the file). */
export function registerKaalEvents(events: KaalEvent[]): void { REGISTRY = new Map(events.map((e) => [e.id, e])); }

const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
function stoneOf(raw: unknown): KaalStone | null {
  const s = raw as Partial<KaalStone> | null;
  if (!s || typeof s.id !== "string" || s.id.length > 60 || !isInt(s.year) || s.year === 0 || Math.abs(s.year) > MAX_ABS) return null;
  const circa = !!s.circa, decade = !!s.decade;
  if (decade && (s.year < 0 || s.year % 10 !== 5 || circa)) return null;
  let label: KaalLabel | null = null;
  if (s.label != null) {
    const l = s.label as Partial<KaalLabel>;
    if (!(["hinglish", "en", "hi"] as const).every((k) => typeof l[k] === "string" && (l[k] as string).length > 0 && (l[k] as string).length <= 60)) return null;
    label = { hinglish: l.hinglish as string, en: l.en as string, hi: l.hi as string };
  }
  if (s.id.startsWith("year:")) {
    // a generated bare year (class 6): self-describing, never circa, never named
    if (s.id !== `year:${s.year}` || circa || decade || label) return null;
  } else if (REGISTRY) {
    const e = REGISTRY.get(s.id);
    if (!e || e.year !== s.year || !!e.circa !== circa || !!e.decade !== decade || JSON.stringify(e.label ?? null) !== JSON.stringify(label)) return null;
  }
  return { id: s.id, year: s.year, circa, decade, label };
}

function validate(level: PlayLevel<unknown>): PlayLevel<KaalParams> | null {
  const p = level.params as Partial<KaalParams> | null;
  const mode = level.mode as string;
  if (!p || (mode !== "place" && mode !== "order")) return null;
  if (p.goal !== "place" && p.goal !== "order" && p.goal !== "century") return null;
  if ((mode === "order") !== (p.goal === "order")) return null;
  const lo = p.lo, hi = p.hi, step = Number(p.step);
  if (!isInt(lo) || !isInt(hi) || hi <= lo || Math.abs(lo) > MAX_ABS || hi > FUTURE) return null;
  if (!(STEPS as readonly number[]).includes(step) || lo % step !== 0 || (hi - lo) % step !== 0) return null;
  const n = (hi - lo) / step;
  if (n < 3 || n > 12) return null;
  if (p.goal === "century" && (step !== 100 || n < 3 || n > 7)) return null;
  if (!Array.isArray(p.stones)) return null;
  const k = p.stones.length;
  if (p.goal === "order" ? k < 3 || k > 4 : k !== 1) return null;
  const stones: KaalStone[] = [];
  for (const raw of p.stones) { const s = stoneOf(raw); if (!s || !inLine({ lo, hi }, s.year)) return null; stones.push(s); }
  if (new Set(stones.map((s) => s.id)).size !== k || new Set(stones.map((s) => s.year)).size !== k) return null;
  const span = hi - lo, tol = tolFor(span), minor = p.goal === "century" ? 0 : minorFor(step, span);
  // the tolerance and the minor ticks are the river's, never the level's say
  if (p.tol !== tol || (p.minor ?? 0) !== minor) return null;
  const labels = p.labels === 2 || p.labels === 3 ? p.labels : 1;
  const text = p.text === "event" ? "event" : "year";
  return { ...level, params: { goal: p.goal, lo, hi, step, minor, labels, stones, tol, text } } as PlayLevel<KaalParams>;
}

const init = (level: PlayLevel<KaalParams>): KaalState => ({ marks: level.params.stones.map(() => null), landed: level.params.stones.map(() => false), checks: 0, done: false, acts: 0, prev: null, depth: 0 });
/** the stone in the boat now (order: the first not yet landed) */
export const currentStone = (p: KaalParams, s: KaalState) => { if (p.goal !== "order") return 0; const k = s.landed.indexOf(false); return k < 0 ? p.stones.length : k; };
const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });

function apply(level: PlayLevel<KaalParams>, s: KaalState, act: KaalAct, seq: number): { state: KaalState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  const bump = (st: KaalState): KaalState => ({ ...st, acts: s.acts + 1 });
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  const k = currentStone(p, s);
  if (act.kind === "place") {
    const i = Number(act.which), y = Number(act.year);
    if (!isInt(i) || i < 0 || i >= p.stones.length || !isInt(y)) return { state: bump(s), moments: out, refused: "bad_place" };
    // there is no year 0: the river has no place for it
    if (y === 0) { out.push(mom("law_refused", seq, { why: "no_year_zero" })); return { state: bump(s), moments: out, refused: "no_year_zero" }; }
    if (!inLine(p, y)) return { state: bump(s), moments: out, refused: "off_river" };
    if (s.landed[i]) return { state: bump(s), moments: out, refused: "landed" };
    if (i !== k) return { state: bump(s), moments: out, refused: "one_at_a_time" };
    return { state: bump(pushUndo(s, { ...s, marks: s.marks.map((m, j) => (j === i ? y : m)) })), moments: out };
  }
  if (act.kind === "check") {
    const y = s.marks[k];
    if (y === null || y === undefined) return { state: bump(s), moments: out, refused: "place_first" };
    const st = p.stones[k], next = bump(pushUndo(s, { ...s, checks: s.checks + 1 }));
    if (accepted(p, st, y)) {
      const landed = s.landed.map((l, j) => l || j === k), all = landed.every(Boolean);
      if (all) { out.push(mom("solved", seq, { goal: p.goal, stones: p.stones.length })); return { state: { ...next, landed, done: true }, moments: out }; }
      out.push(mom("progress", seq, { landed: landed.filter(Boolean).length, of: p.stones.length }));
      return { state: { ...next, landed }, moments: out };
    }
    // a miss: the stone floats to its true place; the gap is exact (in years, or in century bands)
    const side = xOf(y) < xOf(st.year) ? "earlier" : "later";
    const gap: Facts = p.goal === "century" ? { gap_c: Math.abs(bandIx(centuryOf(y)) - bandIx(centuryOf(st.year))), side } : { gap: yearsApart(y, st.year), side };
    for (const mal of Object.keys(level.mal)) {
      const m = malYear(p, st, mal);
      if (m !== null && sameLanding(p, y, m)) { out.push(mom("misconception_consequence", seq, gap, mal)); return { state: next, moments: out, refused: "missed" }; }
    }
    const near = p.goal === "century" ? gap.gap_c === 1 : (gap.gap as number) <= Math.max(2 * p.tol, 1);
    out.push(mom(near ? "near_miss" : "law_refused", seq, { ...gap, why: "landed_off" }));
    return { state: next, moments: out, refused: "missed" };
  }
  return { state: bump(s), moments: out, refused: "unknown_act" };
}
const goalMet = (_l: PlayLevel<KaalParams>, s: KaalState) => s.done;

function solve(level: PlayLevel<KaalParams>): KaalAct[] {
  return level.params.stones.flatMap((st, i) => [{ kind: "place", which: i, year: st.year }, { kind: "check" }] as KaalAct[]);
}
/** The landmarks a child can drop on without knowing where the year lives: the ends, the middle, the BCE | CE boundary,
 *  every labelled tick (a stone at a labelled tick is a READING task, not a placement) and, in order, the stones landed
 *  before (a landmark on the river). */
export function landmarks(p: KaalParams): number[] {
  const ys = new Set<number>();
  const at = (x: number) => ys.add(yearAt(Math.min(p.hi - 1e-6, Math.max(p.lo + 1e-6, x))));
  at(p.lo); at(p.hi); at((p.lo + p.hi) / 2);
  if (p.lo < 0 && p.hi > 0) { ys.add(-1); ys.add(1); }
  const n = Math.round((p.hi - p.lo) / p.step);
  if (p.goal !== "century") for (let i = 0; i <= n; i++) { const t = p.lo + i * p.step; if (t !== 0 && labelled(p, i)) ys.add(t); }
  return [...ys];
}
function shortcut(level: PlayLevel<KaalParams>): KaalAct[] | null {
  const p = level.params, acts: KaalAct[] = [], marks = landmarks(p);
  for (let k = 0; k < p.stones.length; k++) {
    const st = p.stones[k];
    const hit = [...marks, ...p.stones.slice(0, k).map((s) => s.year)].find((y) => inLine(p, y) && accepted(p, st, y));
    if (hit !== undefined) return [...acts, { kind: "place", which: k, year: hit }, { kind: "check" }];
    acts.push({ kind: "place", which: k, year: st.year }, { kind: "check" });
  }
  return null;
}
function malActs(level: PlayLevel<KaalParams>, mal: string): KaalAct[] | null {
  const p = level.params, acts: KaalAct[] = [];
  for (let k = 0; k < p.stones.length; k++) {
    const m = malYear(p, p.stones[k], mal);
    if (m !== null) return [...acts, { kind: "place", which: k, year: m }, { kind: "check" }];
    acts.push({ kind: "place", which: k, year: p.stones[k].year }, { kind: "check" });
  }
  return null;
}

// ───────────────────────────── generation ─────────────────────────────

interface KaalGrammar { goal?: KaalGoal; events?: unknown[]; free?: boolean; text?: "year" | "event"; stones?: number[] }
interface Line { lo: number; hi: number; step: number }

/** a river of n ticks at one of STEPS holding every x in xs, with a random margin */
function makeLine(xs: number[], rnd: () => number, minSpan: number, maxSpan: number): Line | null {
  const mn = Math.min(...xs), mx = Math.max(...xs), n = 5 + Math.floor(rnd() * 4);
  const ok = STEPS.filter((s) => s * n >= Math.max(minSpan, (mx - mn) * 1.1) && s * n <= maxSpan);
  if (!ok.length) return null;
  const s = ok[Math.floor(rnd() * ok.length)];
  const kMin = Math.floor(mn / s), kMax = Math.ceil(mx / s), need = kMax - kMin;
  if (need > n) return null;
  const lo = (kMin - Math.floor(rnd() * (n - need + 1))) * s, hi = lo + n * s;
  return Math.abs(lo) > MAX_ABS || hi > FUTURE ? null : { lo, hi, step: s };
}
/** a short river around the BCE | CE boundary, a tick every 5 years (the exact year: tolerance 0) */
function zeroLine(x: number, rnd: () => number): Line | null {
  const n = 6 + Math.floor(rnd() * 3), a = 1 + Math.floor(rnd() * (n - 1)), lo = -5 * a, hi = lo + 5 * n;
  return x > lo && x < hi && hi > 0 ? { lo, hi, step: 5 } : null;
}
/** 4-6 century bands with the stone's band never at an end */
function centuryLine(y: number, rnd: () => number): Line {
  const c = centuryOf(y), nb = 4 + Math.floor(rnd() * 3), pos = 1 + Math.floor(rnd() * (nb - 2));
  const lo = bandLo(c) - 100 * pos;
  return { lo, hi: lo + 100 * nb, step: 100 };
}
function freeYear(rnd: () => number, goal: KaalGoal): number {
  const r = rnd();
  if (goal === "century") {
    let y = r < 0.75 ? 101 + Math.floor(rnd() * 1925) : -(101 + Math.floor(rnd() * 899));
    if (y % 100 === 0) y += y > 0 ? 1 : -1;
    return y;
  }
  if (r < 0.2) return (rnd() < 0.5 ? -1 : 1) * (1 + Math.floor(rnd() * 14));      // around the boundary (no year 0)
  if (r < 0.6) return -10 * (1 + Math.floor(rnd() * 300));                          // 10 … 3000 BCE
  if (r < 0.75) return -(1 + Math.floor(rnd() * 2999));
  return 1 + Math.floor(rnd() * 2025);
}
function difficultyOf(p: KaalParams): number {
  const bce = p.stones.some((s) => s.year < 0), cross = p.lo < 0 && p.hi > 0;
  return Math.min(1, 0.2 + 0.08 * (p.labels - 1) + (bce ? 0.1 : 0) + (cross ? 0.05 : 0) + (p.tol === 0 ? 0.1 : 0)
    + (p.goal === "order" ? 0.1 + 0.05 * (p.stones.length - 3) : 0) + (p.goal === "century" ? 0.15 : 0));
}
export function eventsOf(raw: unknown): KaalStone[] {
  if (!Array.isArray(raw)) return [];
  const out: KaalStone[] = [];
  for (const e of raw) {
    const ev = e as Partial<KaalEvent> | null;
    if (!ev || typeof ev.id !== "string" || !isInt(ev.year) || ev.year === 0) continue;
    out.push({ id: ev.id, year: ev.year, circa: !!ev.circa, decade: !!ev.decade, label: ev.label ?? null });
  }
  return out;
}

function generate(req: GenRequest): Candidate<KaalParams>[] {
  const g = (req.grammar ?? {}) as KaalGrammar;
  const goal: KaalGoal = req.mode === "order" ? "order" : req.goal === "century" || g.goal === "century" ? "century" : "place";
  const pool = eventsOf(g.events), free = !!g.free && goal !== "order";
  const text: "year" | "event" = g.text ?? (req.classLevel <= 6 ? "year" : "event");
  const labels = req.fade as 1 | 2 | 3;
  const rnd = mulberry32(req.seed), out: Candidate<KaalParams>[] = [], seen = new Set<string>();
  const mk = (line: Line, stones: KaalStone[]): void => {
    const span = line.hi - line.lo;
    const params: KaalParams = { goal, lo: line.lo, hi: line.hi, step: line.step, minor: goal === "century" ? 0 : minorFor(line.step, span), labels, stones, tol: tolFor(span), text };
    if (!stones.every((s) => inLine(params, s.year))) return;
    // order: two stones closer than 2 tolerances could be told apart only by luck (and a landed one would mark the other)
    if (goal === "order") for (let i = 0; i < stones.length; i++) for (let j = i + 1; j < stones.length; j++) if (yearsApart(stones[i].year, stones[j].year) <= Math.max(2 * params.tol, 1)) return;
    const sig = `${goal}:${stones.map((s) => s.year).join(",")}@${line.lo}..${line.hi}/${line.step}`;
    if (seen.has(sig)) return;
    seen.add(sig);
    const level: PlayLevel<KaalParams> = { v: "play@1", levelId: `kaal-${sig}-${req.seed}`.replace(/[^a-z0-9:/.,_-]/gi, "_"), family: "kaal", mode: goal === "order" ? "order" : "place", topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: "kaal-nadi", seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 2 * stones.length, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } };
    // a stone on a landmark is a reading task: never offered
    if (shortcut(level)) return;
    out.push({ level, signature: sig, difficulty: difficultyOf(params) });
  };
  if (goal === "order") {
    if (pool.length < 3) return [];
    const sizes = (g.stones ?? [3, 4]).filter((x) => x === 3 || x === 4);
    for (let k = 0; k < 400 && out.length < 30; k++) {
      const m = Math.min(pool.length, sizes[Math.floor(rnd() * sizes.length)] ?? 3);
      const stones = shuffle(pool, rnd).slice(0, m);
      const xs = stones.map((s) => xOf(s.year)), ext = Math.max(...xs) - Math.min(...xs);
      const line = makeLine(xs, rnd, Math.max(40, ext * 1.1), Math.max(ext * 3, 400));
      if (line) mk(line, stones);
    }
    return out;
  }
  for (let k = 0; k < 120 && out.length < 36; k++) {
    let st: KaalStone;
    if (free && (!pool.length || rnd() < 0.5)) { const y = freeYear(rnd, goal); st = { id: `year:${y}`, year: y, circa: false, decade: false, label: null }; }
    else if (pool.length) st = pool[Math.floor(rnd() * pool.length)];
    else return out;
    if (goal === "century" && st.year % 100 === 0) continue;   // a year ending in 00 (1900) tells no century belief apart
    const x = xOf(st.year);
    const line = goal === "century" ? centuryLine(st.year, rnd)
      : st.id.startsWith("year:") && Math.abs(st.year) <= 15 ? zeroLine(x, rnd)
      : makeLine([x], rnd, 40, Math.max(400, 2.2 * Math.abs(x)));
    if (line && line.hi <= FUTURE) mk(line, [st]);
  }
  return out;
}

function facts(level: PlayLevel<KaalParams>, s: KaalState): Facts {
  const p = level.params;
  const f: Facts = { goal: p.goal, stones: p.stones.length, landed: s.landed.filter(Boolean).length };
  if (s.checks) f.checks = s.checks;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<KaalParams>, s: KaalState) {
  const p = level.params;
  return {
    title: "Kaal-nadi",
    lines: [`${yearText(yearAt(p.lo + 1e-6))} … ${yearText(yearAt(p.hi - 1e-6))}`, ...p.stones.map((st, i) =>
      `${st.label && p.text === "event" ? `${st.label.en}: ` : ""}${stoneYear(st)}${s.marks[i] !== null ? ` · ${s.landed[i] ? "landed" : "boat at"} ${yearText(s.marks[i] as number)}` : ""}`)],
  };
}
function grade(level: PlayLevel<KaalParams>, acts: PlayActEnvelope<KaalAct>[]): PlayGrade {
  return gradeLevel(kaalLogic, level, acts, { decisiveRefusals: ["missed"], final: true });
}

export const kaalLogic: FamilyLogic<KaalParams, KaalState, KaalAct> = {
  family: "kaal", modes: ["place", "order"], malRules: KAAL_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
export const kaalHelpers = { xOf, yearAt, yearsApart, centuryOf, bandLo, tolFor, minorFor, inLine, labelled, yearText, stoneYear, eraWord, ordinal, malYear, accepted, currentStone, landmarks };
