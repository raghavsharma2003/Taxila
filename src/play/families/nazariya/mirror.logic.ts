// Nazariya · mirror (c4-maths-ch11-t02 mirror halves, c5-maths-ch10-t02 designs, c6-maths-ch09-t01 completing a figure).
// A glass wall stands across the plot. One side holds the given half (locked pillars); the child builds the other half so
// that the whole build is its own reflection in the glass. On a check, every column that differs from the reflection glows.
//   axis "x": the glass stands between columns m − 1 and m (a standing mirror line, seen from above)
//   axis "z": the glass lies between rows m − 1 and m (a lying line)
// Mal-rules, each an image the belief draws: copy-no-flip (the half slid across unflipped) · distance-off (each pillar one
// step too far: the line counted as a square) · wrong-direction (flipped across, and also turned top-to-bottom) ·
// wrong-axis (reflected in a standing line when the glass lies: "only vertical lines are mirror lines").
import type { Candidate, Facts, GenRequest, NazariyaAct, PlayLevel } from "../../../../shared/play.ts";
import { mulberry32 } from "../../core/rng.ts";
import { buildActs, built, commit, idx, inside, lvl, makeLogic, mom, plotOf, rowsText, same, zeros, type Applied, type NzState, type Plot } from "./grid.ts";

export interface MirrorParams extends Plot { goal: "complete"; axis: "x" | "z"; m: number; given: number[] }
export const MIRROR_MAL = ["copy-no-flip", "distance-off", "wrong-direction", "wrong-axis"] as const;
type Map2 = (x: number, z: number) => [number, number];

/** Where a column of the given half lands under the true reflection or a belief's image (null = the belief says nothing). */
export function mapOf(p: MirrorParams, rule: string): Map2 | null {
  const { w, d, m } = p;
  if (p.axis === "x") switch (rule) {
    case "truth": return (x, z) => [2 * m - 1 - x, z];
    case "copy-no-flip": return (x, z) => [x + m, z];
    case "distance-off": return (x, z) => [2 * m - x, z];
    case "wrong-direction": return (x, z) => [2 * m - 1 - x, d - 1 - z];
    default: return null;
  }
  switch (rule) {
    case "truth": return (x, z) => [x, 2 * m - 1 - z];
    case "copy-no-flip": return (x, z) => [x, z + m];
    case "distance-off": return (x, z) => [x, 2 * m - z];
    case "wrong-direction": return (x, z) => [w - 1 - x, 2 * m - 1 - z];
    case "wrong-axis": return (x, z) => [w - 1 - x, z];
    default: return null;
  }
}
/** The heights a rule draws on the open (unlocked) columns; everything else 0. */
export function imageOf(p: MirrorParams, rule: string): number[] | null {
  const f = mapOf(p, rule);
  if (!f) return null;
  const h = [...p.base];
  for (let z = 0; z < p.d; z++) for (let x = 0; x < p.w; x++) {
    const v = p.given[idx(p, x, z)]; if (!v) continue;
    const [nx, nz] = f(x, z);
    if (!inside(p, nx, nz)) continue;
    const j = idx(p, nx, nz);
    if (!p.lock[j]) h[j] = v;
  }
  return h;
}
export const truthOf = (p: MirrorParams) => imageOf(p, "truth") as number[];
/** Open columns whose height differs from the reflection (the engine makes exactly these glow). */
export const mirrorMismatch = (p: MirrorParams, h: readonly number[]): number[] => { const t = truthOf(p); return h.map((v, i) => (!p.lock[i] && v !== t[i] ? 1 : 0)); };

function validate(raw: unknown): MirrorParams | null {
  const r = raw as Partial<MirrorParams> | null, plot = plotOf(raw);
  if (!r || !plot || r.goal !== "complete" || (r.axis !== "x" && r.axis !== "z")) return null;
  const m = Number(r.m), n = plot.w * plot.d;
  if (!Number.isInteger(m) || m < 2) return null;
  if (r.axis === "x" ? plot.w !== 2 * m : plot.d !== 2 * m) return null;
  const given = Array.isArray(r.given) && r.given.length === n ? r.given.map(Number) : null;
  if (!given || given.some((v) => !Number.isInteger(v) || v < 0 || v > plot.hmax)) return null;
  // the given half sits on its own side, off the outer edge, and is exactly the locked scenery
  for (let z = 0; z < plot.d; z++) for (let x = 0; x < plot.w; x++) {
    const i = idx(plot, x, z), v = given[i], k = r.axis === "x" ? x : z;
    if (v && (k < 1 || k > m - 1)) return null;
    if (plot.lock[i] !== (v ? 1 : 0) || plot.base[i] !== v) return null;
  }
  if (given.filter((v) => v).length < 2) return null;
  return { ...plot, goal: "complete", axis: r.axis, m, given };
}

function check(level: PlayLevel<MirrorParams>, s: NzState, seq: number): Applied {
  const p = level.params, mm = mirrorMismatch(p, s.h), off = mm.reduce((a, b) => a + b, 0), bumped = { ...s, acts: s.acts + 1 };
  if (off === 0) return { state: commit(s, { ...s, done: true }), moments: [mom("solved", seq, { pillars: p.given.filter((v) => v).length, axis: p.axis === "x" ? "standing" : "lying" })] };
  for (const mal of Object.keys(level.mal)) { const img = imageOf(p, mal); if (img && same(img, s.h)) return { state: bumped, moments: [mom("misconception_consequence", seq, { off, axis: p.axis === "x" ? "standing" : "lying" }, mal)], refused: "mismatch" }; }
  return { state: bumped, moments: [mom(off === 1 ? "near_miss" : "law_refused", seq, { off, why: "not_a_reflection" })], refused: "mismatch" };
}
function solve(level: PlayLevel<MirrorParams>): NazariyaAct[] | null { return [...buildActs(level.params, truthOf(level.params)), { kind: "check" }]; }
/** Without reflecting: copy the half unflipped, fill the open side flat, build nothing. None may pass. */
function shortcut(level: PlayLevel<MirrorParams>): NazariyaAct[] | null {
  const p = level.params, t = truthOf(p);
  const tries = [imageOf(p, "copy-no-flip"), p.lock.map((l, i) => (l ? p.base[i] : 1)), p.lock.map((l, i) => (l ? p.base[i] : 0))];
  for (const h of tries) if (h && same(h, t)) return [...buildActs(p, h), { kind: "check" }];
  return null;
}
function malActs(level: PlayLevel<MirrorParams>, mal: string): NazariyaAct[] | null {
  const p = level.params, img = imageOf(p, mal);
  if (!img || same(img, truthOf(p)) || same(img, p.base)) return null;
  return [...buildActs(p, img), { kind: "check" }];
}

/** A plot for a given half (row-major heights on the given side only). */
export function mirrorPlot(axis: "x" | "z", m: number, other: number, hmax: number, given: number[]): MirrorParams {
  const w = axis === "x" ? 2 * m : other, d = axis === "x" ? other : 2 * m;
  return { w, d, hmax, base: [...given], lock: given.map((v) => (v ? 1 : 0)), goal: "complete", axis, m, given };
}
function generate(req: GenRequest): Candidate<MirrorParams>[] {
  const g = req.grammar as { axes?: ("x" | "z")[]; hmax?: number; ms?: number[] };
  const rnd = mulberry32(req.seed), out: Candidate<MirrorParams>[] = [];
  const axes = g.axes ?? ["x"], hmax = g.hmax ?? (req.classLevel <= 4 ? 2 : 3), ms = g.ms ?? (req.classLevel <= 4 ? [3, 4] : [3, 4, 5]);
  for (let k = 0; k < 36; k++) {
    const axis = axes[k % axes.length], m = ms[Math.floor(rnd() * ms.length)], other = 3 + Math.floor(rnd() * 3);
    const w = axis === "x" ? 2 * m : other, d = axis === "x" ? other : 2 * m;
    const given = zeros(w * d);
    for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) {
      const kk = axis === "x" ? x : z;
      if (kk >= 1 && kk <= m - 1 && rnd() < 0.45) given[z * w + x] = 1 + Math.floor(rnd() * hmax);
    }
    if (given.filter((v) => v).length < 3) continue;
    const params = mirrorPlot(axis, m, other, hmax, given);
    const cells = given.filter((v) => v).length;
    out.push({ signature: `${axis}:${w}x${d}:${given.join("")}`, difficulty: Math.min(1, 0.05 * cells + (axis === "z" ? 0.15 : 0) + 0.05 * (m - 3)), level: lvl(req, "mirror", "complete", params, `${axis}-${w}x${d}-${k}`) });
  }
  return out;
}
function facts(level: PlayLevel<MirrorParams>, s: NzState): Facts {
  const p = level.params, f: Facts = { axis: p.axis === "x" ? "standing" : "lying", pillars: p.given.filter((v) => v).length, blocks: built(p, s.h) };
  if (s.checks) { f.checks = s.checks; f.off = mirrorMismatch(p, s.h).reduce((a: number, b) => a + b, 0); }
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<MirrorParams>, s: NzState) {
  const p = level.params;
  return { title: p.axis === "x" ? "Complete across the standing mirror" : "Complete across the lying mirror", lines: [`given: ${rowsText(p, p.given)}`, `now: ${rowsText(p, s.h)}`] };
}

export const mirrorLogic = makeLogic<MirrorParams>({ mode: "mirror", malRules: MIRROR_MAL, validate, check, solve, shortcut, malActs, generate, facts, board });
