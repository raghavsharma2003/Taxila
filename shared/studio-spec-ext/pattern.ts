// pattern-lab@1 — Pattern Lab (VALUES-100 V3.1: the number-play and tiling explorations of class 7; c7-maths ch06-t02
// grids and magic squares, ch06-t03 Virahanka–Fibonacci numbers, ch06-t04 digits in disguise, ch14-t02 tilings).
//   magic  — drag number tiles into a grid until every row, column (and diagonal) adds to the magic sum; live sums glow
//   rhythm — compose every different rhythm of n beats from short (1 beat) and long (2 beats) syllables; each new one
//            plays; the count of rhythms is the Virahanka number (found, never told)
//   cipher — letters hide digits in a sum (AB + BA = CC); turn each letter's dial until the sum is true (different
//            letters, different digits; no leading zero)
//   tile   — fit regular polygons round one point with no gap and no overlap (their angles must make 360°)
// Truth: exhaustive checks by code (all rhythms, every digit assignment, interior angles), never a model's claim.
import { z } from "zod";
import { EnvelopeExt, MARKUP, TargetsField, UNGRADED, arr, envelope, isObj, num, oneOf, reqStr, strings, stringsSchema, targets, type ExtSpecDef, type Graded } from "./common.ts";

const PL_STRINGS = { round: "Round", done: "right", check: "CHECK", add: "ADD", clear: "CLEAR", sum: "sum", found: "found", short: "short", long: "long", beats: "beats", cipher: "Turn the dials until the sum is true", tiles: "Fit shapes round the point", gap: "gap", overlap: "overlap", runDone: "Lab closed", repeat: "already found", magic: "every line adds to", rows: "rows", cols: "columns" };
export const POLYS = [3, 4, 5, 6, 8, 12] as const;
const PlRound = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("magic"), title: z.string().min(1).max(22), sub: z.string().max(40), n: z.literal(3), tiles: z.array(z.number().int().min(0).max(99)).length(9), givens: z.array(z.tuple([z.number().int().min(0).max(8), z.number().int().min(0).max(99)])).max(5), diagonals: z.boolean(), ...TargetsField }),
  z.object({ mode: z.literal("rhythm"), title: z.string().min(1).max(22), sub: z.string().max(40), beats: z.number().int().min(2).max(7), ...TargetsField }),
  z.object({ mode: z.literal("cipher"), title: z.string().min(1).max(22), sub: z.string().max(40), terms: z.array(z.string().regex(/^[A-Z]{1,3}$/)).min(2).max(3), total: z.string().regex(/^[A-Z]{1,4}$/), ...TargetsField }),
  z.object({ mode: z.literal("tile"), title: z.string().min(1).max(22), sub: z.string().max(40), kinds: z.number().int().min(1).max(3), allowed: z.array(z.number().int().refine((n) => (POLYS as readonly number[]).includes(n), "polygon")).min(2).max(6), ...TargetsField }),
]);
export type PlRoundT = z.infer<typeof PlRound>;
export const PatternSchema = z.object({ archetype: z.literal("pattern-lab@1"), ...EnvelopeExt, strings: stringsSchema(PL_STRINGS, 40), title: z.string().min(1).max(36), rounds: z.array(PlRound).min(1).max(4) });
export type PatternSpec = z.infer<typeof PatternSchema>;
type Magic = Extract<PlRoundT, { mode: "magic" }>;
type Cipher = Extract<PlRoundT, { mode: "cipher" }>;
type Tile = Extract<PlRoundT, { mode: "tile" }>;

// ---- magic squares ----
export const LINES3 = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8]], DIAG3 = [[0, 4, 8], [2, 4, 6]];
export const magicSum = (rd: Magic) => rd.tiles.reduce((a, b) => a + b, 0) / 3;
export function magicOk(rd: Magic, grid: (number | null)[]): boolean {
  if (grid.length !== 9 || grid.some((v) => v === null)) return false;
  const used = [...grid as number[]].sort((a, b) => a - b), want = [...rd.tiles].sort((a, b) => a - b); if (JSON.stringify(used) !== JSON.stringify(want)) return false;
  if (rd.givens.some(([c, v]) => grid[c] !== v)) return false;
  const S = magicSum(rd); return [...LINES3, ...(rd.diagonals ? DIAG3 : [])].every((l) => l.reduce((a, i) => a + (grid[i] as number), 0) === S);
}
export function magicSolve(rd: Magic): number[] | null {
  const grid: (number | null)[] = Array(9).fill(null); const pool = [...rd.tiles]; for (const [c, v] of rd.givens) { const k = pool.indexOf(v); if (k < 0 || grid[c] !== null) return null; grid[c] = v; pool.splice(k, 1); }
  const empty = grid.map((v, i) => (v === null ? i : -1)).filter((i) => i >= 0); let out: number[] | null = null;
  const go = (k: number, left: number[]) => { if (out) return; if (k === empty.length) { if (magicOk(rd, grid)) out = grid.slice() as number[]; return; } const seen = new Set<number>(); for (let j = 0; j < left.length; j++) { const v = left[j]; if (seen.has(v)) continue; seen.add(v); grid[empty[k]] = v; go(k + 1, [...left.slice(0, j), ...left.slice(j + 1)]); grid[empty[k]] = null; } };
  if (Number.isInteger(magicSum(rd))) go(0, pool); return out;
}
// ---- Virahanka rhythms ----
export function allRhythms(n: number): string[] { if (n === 0) return [""]; if (n < 0) return []; return [...allRhythms(n - 1).map((s) => s + "S"), ...allRhythms(n - 2).map((s) => s + "L")]; }
export const rhythmOk = (n: number, s: string) => /^[SL]+$/.test(s) && [...s].reduce((a, c) => a + (c === "S" ? 1 : 2), 0) === n;
// ---- cryptarithm ----
export const letters = (rd: Cipher) => [...new Set([...rd.terms.join(""), ...rd.total])];
export function cipherOk(rd: Cipher, map: Record<string, number>): boolean {
  const L = letters(rd); if (L.some((c) => !Number.isInteger(map[c]) || map[c] < 0 || map[c] > 9)) return false;
  if (new Set(L.map((c) => map[c])).size !== L.length) return false;
  const val = (w: string) => { if (w.length > 1 && map[w[0]] === 0) return NaN; return Number([...w].map((c) => map[c]).join("")); };
  const sum = rd.terms.reduce((a, t) => a + val(t), 0); return Number.isFinite(sum) && sum === val(rd.total);
}
export function cipherSolutions(rd: Cipher, cap = 50): Record<string, number>[] {
  const L = letters(rd), out: Record<string, number>[] = []; if (L.length > 6) return out;
  const used = new Set<number>(), map: Record<string, number> = {};
  const go = (k: number) => { if (out.length >= cap) return; if (k === L.length) { if (cipherOk(rd, map)) out.push({ ...map }); return; } for (let d = 0; d <= 9; d++) { if (used.has(d)) continue; used.add(d); map[L[k]] = d; go(k + 1); used.delete(d); } delete map[L[k]]; };
  go(0); return out;
}
// ---- tilings round a point ----
export const interior = (n: number) => ((n - 2) * 180) / n;
export function tileOk(rd: Tile, shapes: number[]): { sum: number; ok: boolean } {
  const s = shapes.reduce((a, n) => a + interior(n), 0), kinds = new Set(shapes).size;
  return { sum: s, ok: shapes.length >= 3 && Math.abs(s - 360) < 1e-6 && shapes.every((n) => (rd.allowed as number[]).includes(n)) && kinds === rd.kinds };
}
export function tilePlans(rd: Tile): number[][] {
  const out: number[][] = []; const al = [...rd.allowed].sort((a, b) => a - b) as number[];
  const go = (start: number, cur: number[], sum: number) => { if (Math.abs(sum - 360) < 1e-6) { if (new Set(cur).size === rd.kinds && cur.length >= 3) out.push([...cur]); return; } if (sum > 360 || cur.length >= 6) return; for (let i = start; i < al.length; i++) { cur.push(al[i]); go(i, cur, sum + interior(al[i])); cur.pop(); } };
  go(0, [], 0); return out;
}

const plDefault: PatternSpec = {
  archetype: "pattern-lab@1", skills: ["c7-maths-ch06-t02", "c7-maths-ch06-t03", "c7-maths-ch06-t04", "c7-maths-ch14-t02"], lang: "en", strings: { ...PL_STRINGS }, title: "Pattern Lab",
  rounds: [
    { mode: "magic", title: "Magic square", sub: "1 to 9: every line adds to 15", n: 3, tiles: [1, 2, 3, 4, 5, 6, 7, 8, 9], givens: [[4, 5]], diagonals: true },
    { mode: "rhythm", title: "Virahanka's rhythms", sub: "every rhythm of 5 beats", beats: 5, targets: "c7-maths-ch06-t03-m-order-ignored" },
    { mode: "cipher", title: "Digits in disguise", sub: "AB + BA = CC", terms: ["AB", "BA"], total: "CC" },
    { mode: "tile", title: "Round a point", sub: "two kinds of shapes, no gaps", kinds: 2, allowed: [3, 4, 6, 8, 12] },
  ],
};
function repairPattern(raw: Record<string, unknown>, r: string[]): PatternSpec | null {
  const env = envelope(raw, plDefault, r);
  const rounds: PlRoundT[] = [];
  for (const x of arr(raw.rounds, "rounds", r).slice(0, 4)) {
    if (!isObj(x)) { r.push("round"); continue; }
    const head = { title: reqStr(x.title, 22, "round.title", r) ?? "Patterns", sub: typeof x.sub === "string" && x.sub.length <= 40 && !MARKUP.test(x.sub) ? x.sub : "", ...targets(x.targets, r) };
    const mode = oneOf(x.mode, ["magic", "rhythm", "cipher", "tile"] as const, "magic", "mode", r);
    if (mode === "magic") {
      const tiles = arr(x.tiles, "tiles", r).filter((v): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 99);
      const givens = arr(x.givens, "givens", r).filter((gv): gv is [number, number] => Array.isArray(gv) && gv.length === 2 && Number.isInteger(gv[0]) && Number.isInteger(gv[1]) && gv[0] >= 0 && gv[0] <= 8).slice(0, 5);
      if (tiles.length !== 9) { r.push("magic:needs-9-tiles"); continue; }
      const rd: Magic = { mode, ...head, n: 3, tiles, givens, diagonals: x.diagonals !== false };
      if (!magicSolve(rd)) { r.push("magic:no-solution"); continue; }
      rounds.push(rd);
    } else if (mode === "rhythm") rounds.push({ mode, ...head, beats: num(x.beats, 2, 7, 5, "beats", r, true) });
    else if (mode === "cipher") {
      const terms = arr(x.terms, "terms", r).filter((t): t is string => typeof t === "string" && /^[A-Z]{1,3}$/.test(t)).slice(0, 3), total = typeof x.total === "string" && /^[A-Z]{1,4}$/.test(x.total) ? x.total : null;
      if (terms.length < 2 || !total) { r.push("cipher:shape"); continue; }
      const rd: Cipher = { mode, ...head, terms, total };
      const sols = cipherSolutions(rd); if (!sols.length) { r.push("cipher:no-solution"); continue; } if (letters(rd).length > 5) { r.push("cipher:too-many-letters"); continue; }
      rounds.push(rd);
    } else {
      const allowed = [...new Set(arr(x.allowed, "allowed", r).filter((n): n is (typeof POLYS)[number] => (POLYS as readonly number[]).includes(n as number)))].slice(0, 6);
      const rd = { mode, ...head, kinds: num(x.kinds, 1, 3, 1, "kinds", r, true), allowed } as Tile;
      if (allowed.length < 2 || !tilePlans(rd).length) { r.push("tile:no-tiling"); continue; }
      rounds.push(rd);
    }
  }
  if (!rounds.length) return null;
  return { archetype: "pattern-lab@1", ...env, strings: strings(raw.strings, PL_STRINGS, 40, r), title: reqStr(raw.title, 36, "title", r) ?? "Pattern Lab", rounds };
}
function gradePattern(spec: PatternSpec, itemId: string, value: unknown): Graded {
  const m = /^r(\d+)$/.exec(itemId); if (!m) return UNGRADED;
  const rd = spec.rounds[+m[1] - 1]; if (!rd) return UNGRADED;
  const v = isObj(value) ? value : {};
  if (rd.mode === "magic") { const grid = Array.isArray(v.grid) ? v.grid.slice(0, 9).map((x) => (Number.isInteger(x) ? (x as number) : null)) : []; const ok = magicOk(rd, grid); const S = magicSum(rd); const good = grid.length === 9 ? [...LINES3, ...(rd.diagonals ? DIAG3 : [])].filter((l) => l.every((i) => grid[i] !== null) && l.reduce((a, i) => a + (grid[i] as number), 0) === S).length : 0; return { verdict: ok ? "right" : good >= 5 ? "partial" : "wrong", truth: S, detail: `${good} lines make ${S}` }; }
  if (rd.mode === "rhythm") { const all = new Set(allRhythms(rd.beats)), got = new Set(Array.isArray(v.found) ? v.found.filter((s): s is string => typeof s === "string" && rhythmOk(rd.beats, s)) : []); return { verdict: got.size === all.size ? "right" : got.size >= Math.ceil(all.size * 0.7) ? "partial" : "wrong", truth: all.size, detail: `${got.size} of ${all.size}` }; }
  if (rd.mode === "cipher") { const map = isObj(v.map) ? Object.fromEntries(Object.entries(v.map).filter(([k, d]) => /^[A-Z]$/.test(k) && Number.isInteger(d))) as Record<string, number> : {}; const sols = cipherSolutions(rd); return { verdict: cipherOk(rd, map) ? "right" : "wrong", truth: sols[0] ?? null, detail: `${sols.length} solution${sols.length === 1 ? "" : "s"}` }; }
  const shapes = Array.isArray(v.shapes) ? v.shapes.map(Number).filter((n) => (POLYS as readonly number[]).includes(n)).slice(0, 8) : []; const t = tileOk(rd, shapes);
  return { verdict: t.ok ? "right" : Math.abs(t.sum - 360) < 1e-6 ? "partial" : "wrong", truth: tilePlans(rd)[0] ?? null, detail: `${Math.round(t.sum)}°` };
}
function keysPattern(spec: PatternSpec) {
  return spec.rounds.map((rd, k) => ({ itemId: `r${k + 1}`, key: rd.mode === "magic" ? `sum ${magicSum(rd)}: ${(magicSolve(rd) ?? []).join(",")}` : rd.mode === "rhythm" ? `${allRhythms(rd.beats).length} rhythms` : rd.mode === "cipher" ? JSON.stringify(cipherSolutions(rd)[0] ?? {}) : tilePlans(rd).map((p) => p.join("+")).join(" | "), prompt: rd.sub || rd.title }));
}
export const patternDef: ExtSpecDef<PatternSpec> = {
  archetype: "pattern-lab@1", title: "Pattern Lab", kind: "game", subjects: ["maths"],
  act: "drag tiles into a magic square with live line sums, compose every rhythm of n beats from short and long syllables (Virahanka), turn letter dials until a disguised sum is true, fit regular polygons round a point until the angles close at 360°",
  outcomes: { classes: [6, 7], subjects: ["maths"], topics: ["c7-maths-ch06-t02", "c7-maths-ch06-t03", "c7-maths-ch06-t04", "c7-maths-ch14-t02"], misconceptions: [] },
  schema: PatternSchema as unknown as z.ZodType<PatternSpec>, defaultSpec: plDefault, repair: repairPattern, grade: gradePattern, keys: keysPattern,
};
