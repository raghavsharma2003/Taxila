// mirror-paint@1 — Mirror Studio (VALUES-100 V3.1: line symmetry, rotational symmetry, completing symmetric figures,
// congruent figures; c4 ch11, c5 ch10, c6 ch9, c7 ch9).
//   complete — half a rangoli is painted; paint the other half across the mirror before the scanner sweeps through
//   lines    — fold-test a figure along candidate mirrors (| — / \); mark every line of symmetry
//   turn     — rotate a design a quarter turn at a time; how many times does it look the same in a full turn?
//   twin     — turn and flip a piece until it fits its twin's outline (congruence by moves)
// Every key is computed from the cell set by code (reflection, rotation, set equality).
import { z } from "zod";
import { EnvelopeExt, MARKUP, TargetsField, UNGRADED, arr, envelope, isObj, num, oneOf, reqStr, strings, stringsSchema, targets, type ExtSpecDef, type Graded } from "./common.ts";

export type Cell = [number, number];
export const AXES = ["v", "h", "d1", "d2"] as const;
export type Axis = typeof AXES[number];
const MP_STRINGS = { round: "Round", done: "designs", check: "CHECK", rotate: "TURN", flip: "FLIP", coach: "Paint the mirror half: tap the squares", runDone: "Studio closed", lines: "Mark every line of symmetry", turn: "How many times the same in one full turn?", twin: "Turn and flip it to fit its twin", same: "SAME", order: "order", fold: "FOLD" };
const CellZ = z.tuple([z.number().int().min(0).max(11), z.number().int().min(0).max(9)]);
const MpRound = z.object({
  mode: z.enum(["complete", "lines", "turn", "twin"]), title: z.string().min(1).max(22), sub: z.string().max(40),
  size: z.number().int().min(4).max(10), cells: z.array(CellZ).min(1).max(60), axis: z.enum(AXES).optional(), time: z.number().min(15).max(120), ...TargetsField,
});
export type MpRoundT = z.infer<typeof MpRound>;
export const MirrorSchema = z.object({ archetype: z.literal("mirror-paint@1"), ...EnvelopeExt, strings: stringsSchema(MP_STRINGS, 52), title: z.string().min(1).max(36), rounds: z.array(MpRound).min(1).max(4) });
export type MirrorSpec = z.infer<typeof MirrorSchema>;

const key = (c: Cell) => c[0] + "," + c[1];
export const setOf = (cs: Cell[]) => new Set(cs.map(key));
export const sameSet = (a: Cell[], b: Cell[]) => { const A = setOf(a), B = setOf(b); return A.size === B.size && [...A].every((x) => B.has(x)); };
/** Reflect within an n×n board: v (x ↔ n−1−x), h, d1 (main diagonal), d2 (anti-diagonal). */
export function reflect(c: Cell, axis: Axis, n: number): Cell { const [x, y] = c; return axis === "v" ? [n - 1 - x, y] : axis === "h" ? [x, n - 1 - y] : axis === "d1" ? [y, x] : [n - 1 - y, n - 1 - x]; }
export const rot90 = (c: Cell, n: number): Cell => [n - 1 - c[1], c[0]];
export const onMirrorSide = (c: Cell, axis: Axis, n: number) => { const [x, y] = c; return axis === "v" ? x < n / 2 - 0.25 : axis === "h" ? y < n / 2 - 0.25 : axis === "d1" ? x > y : x + y < n - 1; };
export const symmetryAxes = (cs: Cell[], n: number) => AXES.filter((a) => sameSet(cs, cs.map((c) => reflect(c, a, n))));
export function rotOrder(cs: Cell[], n: number): number { let cur = cs; for (let k = 1; k <= 4; k++) { cur = cur.map((c) => rot90(c, n)); if (sameSet(cur, cs)) return 4 / k; } return 1; }
/** Normalise a piece to its top-left corner (for congruence up to translation). */
export const norm = (cs: Cell[]) => { const mx = Math.min(...cs.map((c) => c[0])), my = Math.min(...cs.map((c) => c[1])); return cs.map((c) => [c[0] - mx, c[1] - my] as Cell); };
export function twinTarget(rd: MpRoundT): Cell[] { let t = rd.cells.map((c) => [c[0], c[1]] as Cell); t = t.map((c) => rot90(c, rd.size)); t = t.map((c) => reflect(c, "v", rd.size)); return norm(t); }

const mpDefault: MirrorSpec = {
  archetype: "mirror-paint@1", skills: ["c6-maths-ch09-t01", "c6-maths-ch09-t02", "c4-maths-ch11-t02"], lang: "en", strings: { ...MP_STRINGS }, title: "Mirror Studio",
  rounds: [
    { mode: "complete", title: "Finish the rangoli", sub: "the mirror runs down the middle", size: 8, axis: "v", time: 60, cells: [[3, 0], [2, 1], [3, 1], [1, 2], [3, 2], [0, 3], [2, 3], [3, 3], [1, 4], [3, 4], [2, 5], [3, 5], [3, 6]] },
    { mode: "lines", title: "Fold test", sub: "which folds match exactly?", size: 6, time: 45, cells: [[0, 0], [5, 0], [1, 1], [4, 1], [2, 2], [3, 2], [2, 3], [3, 3], [1, 4], [4, 4], [0, 5], [5, 5]] },
    { mode: "turn", title: "Quarter turns", sub: "same look, how many times?", size: 6, time: 45, cells: [[2, 0], [0, 3], [3, 5], [5, 2], [2, 2], [3, 3], [2, 3], [3, 2]] },
  ],
};
function repairMirror(raw: Record<string, unknown>, r: string[]): MirrorSpec | null {
  const env = envelope(raw, mpDefault, r);
  const rounds: MpRoundT[] = [];
  for (const x of arr(raw.rounds, "rounds", r).slice(0, 4)) {
    if (!isObj(x)) { r.push("round"); continue; }
    const mode = oneOf(x.mode, ["complete", "lines", "turn", "twin"] as const, "complete", "mode", r);
    const size = num(x.size, 4, 10, 8, "size", r, true);
    const cells = [...new Map(arr(x.cells, "cells", r).filter((c): c is Cell => Array.isArray(c) && c.length === 2 && c.every((v) => Number.isInteger(v)) && c[0] >= 0 && c[0] < size && c[1] >= 0 && c[1] < size).map((c) => [key(c as Cell), [c[0], c[1]] as Cell])).values()].slice(0, 60);
    if (!cells.length) { r.push("round:cells"); continue; }
    const head = { mode, title: reqStr(x.title, 22, "round.title", r) ?? "Design", sub: typeof x.sub === "string" && x.sub.length <= 40 && !MARKUP.test(x.sub) ? x.sub : "", size, time: num(x.time, 15, 120, 60, "time", r), ...targets(x.targets, r) };
    if (mode === "complete") {
      const axis = oneOf(x.axis, AXES, "v", "axis", r);
      const half = cells.filter((c) => onMirrorSide(c, axis, size) || sameSet([c], [reflect(c, axis, size)]));
      const toPaint = half.map((c) => reflect(c, axis, size)).filter((c) => !half.some((h) => h[0] === c[0] && h[1] === c[1]));
      if (half.length < 2 || !toPaint.length) { r.push("complete:no-half"); continue; }
      if (half.length < cells.length) r.push("complete:cells-trimmed-to-one-side");
      rounds.push({ ...head, cells: half, axis });
    } else if (mode === "turn") { rounds.push({ ...head, cells }); }
    else if (mode === "lines") { rounds.push({ ...head, cells }); }
    else { if (sameSet(norm(cells), twinTarget({ ...head, cells } as MpRoundT))) { r.push("twin:already-fits"); continue; } if (cells.length > 12) { r.push("twin:piece-too-big"); continue; } rounds.push({ ...head, cells }); }
  }
  if (!rounds.length) return null;
  return { archetype: "mirror-paint@1", ...env, strings: strings(raw.strings, MP_STRINGS, 52, r), title: reqStr(raw.title, 36, "title", r) ?? "Mirror Studio", rounds };
}
function gradeMirror(spec: MirrorSpec, itemId: string, value: unknown): Graded {
  const m = /^r(\d+)$/.exec(itemId); if (!m) return UNGRADED;
  const rd = spec.rounds[+m[1] - 1]; if (!rd) return UNGRADED;
  if (rd.mode === "complete") {
    const want = rd.cells.map((c) => reflect(c, rd.axis ?? "v", rd.size)).filter((c) => !rd.cells.some((h) => h[0] === c[0] && h[1] === c[1]));
    const got = Array.isArray(value) ? (value.filter((c) => Array.isArray(c) && c.length === 2 && c.every((v) => Number.isInteger(v))) as Cell[]) : [];
    const ok = sameSet(got, want), miss = want.filter((c) => !setOf(got).has(key(c))).length, extra = got.filter((c) => !setOf(want).has(key(c))).length;
    return { verdict: ok ? "right" : miss + extra <= 1 ? "partial" : "wrong", truth: want.length, error: miss + extra, detail: `${miss} missing, ${extra} extra` };
  }
  if (rd.mode === "lines") {
    const want = symmetryAxes(rd.cells, rd.size), got = Array.isArray(value) ? [...new Set(value.filter((a) => (AXES as readonly string[]).includes(a as string)))] : [];
    const ok = want.length === got.length && want.every((a) => got.includes(a));
    return { verdict: ok ? "right" : "wrong", truth: want, detail: want.join(",") || "none" };
  }
  if (rd.mode === "turn") { const want = rotOrder(rd.cells, rd.size); return { verdict: value === want ? "right" : "wrong", truth: want }; }
  const mv = isObj(value) ? value : {}; const rot = Number(mv.rot) % 4, flip = !!mv.flip;
  let cur = rd.cells.map((c) => [c[0], c[1]] as Cell); for (let i = 0; i < (Number.isInteger(rot) && rot >= 0 ? rot : 0); i++) cur = cur.map((c) => rot90(c, rd.size)); if (flip) cur = cur.map((c) => reflect(c, "v", rd.size));
  return { verdict: sameSet(norm(cur), twinTarget(rd)) ? "right" : "wrong", truth: "rot1+flip" };
}
function keysMirror(spec: MirrorSpec) { return spec.rounds.map((rd, k) => ({ itemId: `r${k + 1}`, key: rd.mode === "lines" ? symmetryAxes(rd.cells, rd.size).join(",") || "none" : rd.mode === "turn" ? String(rotOrder(rd.cells, rd.size)) : rd.mode, prompt: `${rd.mode} ${rd.size}×${rd.size}` })); }
export const mirrorDef: ExtSpecDef<MirrorSpec> = {
  archetype: "mirror-paint@1", title: "Mirror Studio", kind: "game", subjects: ["maths"],
  act: "paint the mirror half of a design before the scanner sweeps, fold-test a figure to find every line of symmetry, count the quarter turns that look the same, turn and flip a piece to fit its twin",
  outcomes: { classes: [4, 5, 6, 7], subjects: ["maths"], topics: ["c6-maths-ch09-t01", "c6-maths-ch09-t02", "c4-maths-ch11-t02"], misconceptions: [] },
  schema: MirrorSchema as unknown as z.ZodType<MirrorSpec>, defaultSpec: mpDefault, repair: repairMirror, grade: gradeMirror, keys: keysMirror,
};
