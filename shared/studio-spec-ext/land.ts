// land-lab@1 — Land & Water Lab (VALUES-100 V3.1: landforms, rivers, rain and climate as processes; c5-evs ch02-t01/
// t02, c4-evs ch09-t01, c6-sst ch03, c7-sst ch01-ch03, c7-sci ch05-t03 erosion overlap).
//   rain  — moist wind blows in from the sea over the land; it rises up slopes, cools and rains; past the top it sinks and
//           dries (rain shadow). Drop each place (tea garden, desert camp, ...) where it will be wet or dry.
//   river — a hill country seen from above, shaded by height: trace where the rain from the spring will flow, cell by
//           cell, then RAIN shows the true path (water always takes the steepest way down)
//   flood — a valley in cross-section: put the school on the slope and choose whether to plant trees; the STORM fills
//           the valley to the level the rain (less what the forest soaks up) gives
// Every key is a computed model: an orographic rain march, steepest descent on the height grid, a flood level formula.
import { z } from "zod";
import { EnvelopeExt, MARKUP, TargetsField, UNGRADED, arr, envelope, isObj, num, oneOf, reqStr, strings, stringsSchema, targets, type ExtSpecDef, type Graded } from "./common.ts";
import { GLYPHS } from "./scene.ts";

const LD_STRINGS = { round: "Round", done: "right", wind: "wind", sea: "sea", rain: "RAIN", storm: "STORM", lock: "LOCK", wet: "wet", dry: "dry", trees: "plant trees", spring: "spring", trace: "Tap cells from the spring to the sea", runDone: "Lab closed", level: "flood level", safe: "SAFE", flooded: "FLOODED", mm: "mm of rain", high: "high", low: "low", reset: "clear" };
const Ask = z.object({ label: z.string().min(1).max(14), glyph: z.enum(GLYPHS), need: z.enum(["wet", "dry"]) });
const Peak = z.object({ x: z.number().min(0).max(11), y: z.number().min(0).max(7), h: z.number().min(0.5).max(9), r: z.number().min(0.8).max(4) });
const LdRound = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("rain"), title: z.string().min(1).max(22), sub: z.string().max(40), coast: z.number().min(0.1).max(0.35), hills: z.array(z.object({ x: z.number().min(0.35).max(0.95), h: z.number().min(0.15).max(1), w: z.number().min(0.04).max(0.2) })).min(1).max(3), asks: z.array(Ask).min(1).max(3), ...TargetsField }),
  z.object({ mode: z.literal("river"), title: z.string().min(1).max(22), sub: z.string().max(40), w: z.number().int().min(6).max(12), h: z.number().int().min(5).max(8), peaks: z.array(Peak).min(1).max(4), spring: z.tuple([z.number().int().min(0).max(11), z.number().int().min(0).max(7)]), ...TargetsField }),
  z.object({ mode: z.literal("flood"), title: z.string().min(1).max(22), sub: z.string().max(40), profile: z.array(z.number().min(0).max(12)).min(8).max(16), rain: z.number().min(20).max(400), label: z.string().min(1).max(14), glyph: z.enum(GLYPHS), ...TargetsField }),
]);
export type LdRoundT = z.infer<typeof LdRound>;
export const LandSchema = z.object({ archetype: z.literal("land-lab@1"), ...EnvelopeExt, strings: stringsSchema(LD_STRINGS, 44), title: z.string().min(1).max(36), rounds: z.array(LdRound).min(1).max(4) });
export type LandSpec = z.infer<typeof LandSchema>;
type RainRd = Extract<LdRoundT, { mode: "rain" }>;
type RiverRd = Extract<LdRoundT, { mode: "river" }>;
type FloodRd = Extract<LdRoundT, { mode: "flood" }>;

// ---- rain: N columns from the sea (x = 0) inland (x = 1); the wind blows from the sea ----
export const RAIN_N = 120;
export const groundAt = (rd: RainRd, x: number) => (x < rd.coast ? 0 : 0.04 + rd.hills.reduce((a, h) => a + h.h * Math.exp(-(((x - h.x) / h.w) ** 2)), 0));
export function rainProfile(rd: RainRd): number[] {
  // intensity: base showers from sea air, strong where the air is forced UP a slope, almost none where it sinks
  let M = 1; const out: number[] = [], dx = 1 / (RAIN_N - 1); let prev = groundAt(rd, rd.coast);
  for (let i = 0; i < RAIN_N; i++) {
    const x = i * dx; if (x < rd.coast) { out.push(0); continue; }
    const gh = groundAt(rd, x), sl = (gh - prev) / dx; prev = gh;
    const r = sl > 0.05 ? M * (0.6 + 0.9 * sl) : sl < -0.05 ? M * 0.1 : M * 0.6; M = Math.max(0, M - r * dx * 0.5); out.push(r);
  }
  return out;
}
/** rain level 0..1 (saturating) at x */
export const rainAt = (rd: RainRd, x: number) => { const p = rainProfile(rd), i = Math.max(0, Math.min(RAIN_N - 1, Math.round(x * (RAIN_N - 1)))); return p[i] / (p[i] + 1.5); };
export const WET = 0.55, DRY = 0.2;
export function rainOk(rd: RainRd, need: "wet" | "dry", x: number): boolean { if (x < rd.coast + 0.01 || x > 1) return false; const r = rainAt(rd, x); return need === "wet" ? r >= WET : r <= DRY; }
// ---- river: height = a tilt toward the sea (the bottom row) + Gaussian peaks ----
export const heightAt = (rd: RiverRd, x: number, y: number) => (rd.h - 1 - y) * 0.8 + rd.peaks.reduce((a, p) => a + p.h * Math.exp(-(((x - p.x) ** 2 + (y - p.y) ** 2) / (p.r * p.r))), 0);
/** steepest descent (4 neighbours) from the spring until the sea (the bottom row is the coast); null on a pit */
export function riverPath(rd: RiverRd): [number, number][] | null {
  let [x, y] = rd.spring; const path: [number, number][] = [[x, y]], seen = new Set([x + "," + y]);
  while (y < rd.h - 1) {
    let best: [number, number] | null = null, bh = heightAt(rd, x, y);
    for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= rd.w || ny >= rd.h) continue; const hh = heightAt(rd, nx, ny); if (hh < bh - 1e-9) { bh = hh; best = [nx, ny]; } }
    if (!best || seen.has(best.join(","))) return null; [x, y] = best; seen.add(x + "," + y); path.push([x, y]);
  }
  return path;
}
export function riverScore(rd: RiverRd, cells: [number, number][]): { cover: number; extra: number } {
  const truth = riverPath(rd) ?? [], tk = new Set(truth.map((c) => c.join(","))), ck = new Set(cells.map((c) => c.join(",")));
  let hit = 0; for (const k of tk) if (ck.has(k)) hit++;
  let extra = 0; for (const k of ck) if (!tk.has(k)) extra++;
  return { cover: truth.length ? hit / truth.length : 0, extra: ck.size ? extra / ck.size : 1 };
}
// ---- flood: level = river bed + rain run-off, less what a forest soaks up ----
export const floodLevel = (rd: FloodRd, trees: boolean) => Math.min(...rd.profile) + (rd.rain / 100) * 2.2 * (trees ? 0.6 : 1);
export const siteHeight = (rd: FloodRd, x: number) => { const n = rd.profile.length - 1, f = Math.max(0, Math.min(1, x)) * n, i = Math.min(n - 1, Math.floor(f)), k = f - i; return rd.profile[i] * (1 - k) + rd.profile[i + 1] * k; };

const ldDefault: LandSpec = {
  archetype: "land-lab@1", skills: ["c7-sst-ch02-t01", "c5-evs-ch02-t01", "c5-evs-ch02-t02", "c7-sst-ch03-t01"], lang: "en", strings: { ...LD_STRINGS }, title: "Land & Water Lab",
  rounds: [
    { mode: "rain", title: "Monsoon over the Ghats", sub: "wind from the sea meets the hills", coast: 0.2, hills: [{ x: 0.42, h: 0.85, w: 0.09 }], asks: [{ label: "tea garden", glyph: "leaf", need: "wet" }, { label: "dry farm", glyph: "wheat", need: "dry" }] },
    { mode: "river", title: "Where will it flow?", sub: "trace the river from the spring", w: 9, h: 6, peaks: [{ x: 2, y: 1, h: 3, r: 2 }, { x: 7, y: 2, h: 2.4, r: 1.6 }], spring: [4, 0] },
    { mode: "flood", title: "Safe school", sub: "200 mm of rain is coming", profile: [9, 7, 5, 3.5, 2.5, 1.5, 0.5, 0, 0.8, 2, 3.2, 5, 7.5, 9], rain: 200, label: "school", glyph: "school", targets: "c5-evs-ch02-t02-m1" },
  ],
};
function repairLand(raw: Record<string, unknown>, r: string[]): LandSpec | null {
  const env = envelope(raw, ldDefault, r);
  const rounds: LdRoundT[] = [];
  for (const x of arr(raw.rounds, "rounds", r).slice(0, 4)) {
    if (!isObj(x)) { r.push("round"); continue; }
    const head = { title: reqStr(x.title, 22, "round.title", r) ?? "Land", sub: typeof x.sub === "string" && x.sub.length <= 40 && !MARKUP.test(x.sub) ? x.sub : "", ...targets(x.targets, r) };
    const mode = oneOf(x.mode, ["rain", "river", "flood"] as const, "rain", "mode", r);
    if (mode === "rain") {
      const hills = arr(x.hills, "hills", r).filter(isObj).slice(0, 3).map((h) => ({ x: num(h.x, 0.35, 0.95, 0.5, "hill.x", r), h: num(h.h, 0.15, 1, 0.6, "hill.h", r), w: num(h.w, 0.04, 0.2, 0.1, "hill.w", r) }));
      const asks = arr(x.asks, "asks", r).filter(isObj).slice(0, 3).map((a) => ({ label: reqStr(a.label, 14, "ask.label", r), glyph: oneOf(a.glyph, GLYPHS, "house", "ask.glyph", r), need: oneOf(a.need, ["wet", "dry"] as const, "wet", "ask.need", r) })).filter((a): a is { label: string; glyph: (typeof GLYPHS)[number]; need: "wet" | "dry" } => !!a.label);
      if (!hills.length || !asks.length) { r.push("rain:hills-or-asks"); continue; }
      const rd: RainRd = { mode, ...head, coast: num(x.coast, 0.1, 0.35, 0.2, "coast", r), hills, asks };
      const prof = Array.from({ length: 101 }, (_, i) => i / 100).filter((v) => v > rd.coast + 0.01);
      if (!asks.every((a) => prof.some((v) => rainOk(rd, a.need, v)))) { r.push("rain:no-wet-or-dry-land"); continue; }
      rounds.push(rd);
    } else if (mode === "river") {
      const w = num(x.w, 6, 12, 9, "w", r, true), h = num(x.h, 5, 8, 6, "h", r, true);
      const peaks = arr(x.peaks, "peaks", r).filter(isObj).slice(0, 4).map((p) => ({ x: num(p.x, 0, 11, 2, "peak.x", r), y: num(p.y, 0, 7, 1, "peak.y", r), h: num(p.h, 0.5, 9, 2, "peak.h", r), r: num(p.r, 0.8, 4, 1.6, "peak.r", r) }));
      const sp = Array.isArray(x.spring) && Number.isInteger(x.spring[0]) && Number.isInteger(x.spring[1]) ? [Math.min(w - 1, Math.max(0, x.spring[0])), Math.min(h - 2, Math.max(0, x.spring[1]))] as [number, number] : null;
      if (!peaks.length || !sp) { r.push("river:peaks-or-spring"); continue; }
      const rd: RiverRd = { mode, ...head, w, h, peaks, spring: sp };
      const path = riverPath(rd); if (!path || path.length < 4) { r.push("river:pit-or-too-short"); continue; }
      rounds.push(rd);
    } else {
      const profile = arr(x.profile, "profile", r).filter((v): v is number => typeof v === "number" && Number.isFinite(v)).slice(0, 16).map((v) => Math.min(12, Math.max(0, v)));
      if (profile.length < 8) { r.push("flood:profile"); continue; }
      const rd: FloodRd = { mode, ...head, profile, rain: num(x.rain, 20, 400, 200, "rain", r), label: reqStr(x.label, 14, "label", r) ?? "school", glyph: oneOf(x.glyph, GLYPHS, "school", "glyph", r) };
      const lvl = floodLevel(rd, false), safe = Array.from({ length: 101 }, (_, i) => siteHeight(rd, i / 100)).filter((hh) => hh > lvl).length;
      if (safe < 5 || safe > 95) { r.push("flood:no-real-choice"); continue; }
      rounds.push(rd);
    }
  }
  if (!rounds.length) return null;
  return { archetype: "land-lab@1", ...env, strings: strings(raw.strings, LD_STRINGS, 44, r), title: reqStr(raw.title, 36, "title", r) ?? "Land & Water Lab", rounds };
}
function gradeLand(spec: LandSpec, itemId: string, value: unknown): Graded {
  const m = /^r(\d+)(?::(\d+))?$/.exec(itemId); if (!m) return UNGRADED;
  const rd = spec.rounds[+m[1] - 1]; if (!rd) return UNGRADED;
  const v = isObj(value) ? value : {};
  if (rd.mode === "rain") { const a = rd.asks[Number(m[2] ?? 0)]; if (!a) return UNGRADED; const x = Number(v.x); if (!Number.isFinite(x)) return { verdict: "wrong", truth: a.need, detail: "no-value" }; const ok = rainOk(rd, a.need, x); return { verdict: ok ? "right" : "wrong", truth: a.need, detail: x < rd.coast ? "in the sea" : `rain ${(rainAt(rd, x) * 100).toFixed(0)}%` }; }
  if (rd.mode === "river") { const cells = Array.isArray(v.cells) ? v.cells.filter((c): c is [number, number] => Array.isArray(c) && c.length === 2 && Number.isInteger(c[0]) && Number.isInteger(c[1])).slice(0, 120) : []; const s = riverScore(rd, cells); return { verdict: s.cover >= 0.85 && s.extra <= 0.2 ? "right" : s.cover >= 0.5 ? "partial" : "wrong", truth: (riverPath(rd) ?? []).map((c) => c.join(",")).join(" "), detail: `${Math.round(s.cover * 100)}% of the river` }; }
  const x = Number(v.x), trees = v.trees === true; if (!Number.isFinite(x)) return { verdict: "wrong", truth: +floodLevel(rd, false).toFixed(2), detail: "no-value" };
  const lvl = floodLevel(rd, trees), hgt = siteHeight(rd, x);
  return { verdict: hgt > lvl ? "right" : "wrong", truth: +lvl.toFixed(2), detail: `site ${hgt.toFixed(1)} m, water ${lvl.toFixed(1)} m` };
}
function keysLand(spec: LandSpec) {
  return spec.rounds.flatMap((rd, k) => {
    if (rd.mode === "rain") return rd.asks.map((a, i) => ({ itemId: `r${k + 1}:${i}`, key: `${a.need}: ${Array.from({ length: 101 }, (_, j) => j / 100).filter((x) => rainOk(rd, a.need, x)).map((x) => x.toFixed(2)).filter((_, j, all) => j === 0 || j === all.length - 1).join("–")}`, prompt: a.label }));
    if (rd.mode === "river") return [{ itemId: `r${k + 1}`, key: (riverPath(rd) ?? []).map((c) => c.join(",")).join(" → "), prompt: "trace the river" }];
    return [{ itemId: `r${k + 1}`, key: `above ${floodLevel(rd, false).toFixed(1)} m (${floodLevel(rd, true).toFixed(1)} m with trees)`, prompt: rd.label }];
  });
}
export const landDef: ExtSpecDef<LandSpec> = {
  archetype: "land-lab@1", title: "Land & Water Lab", kind: "simulation", subjects: ["sst", "evs", "science"],
  act: "drop places on a coast-and-hills profile where moist sea wind will make them wet or leave them dry (rain shadow), trace a river cell by cell down a shaded height map before the rain shows its true path, place a building on a valley slope and choose trees before a storm fills the valley",
  outcomes: { classes: [4, 5, 6, 7], subjects: ["sst", "evs"], topics: ["c7-sst-ch02-t01", "c7-sst-ch03-t01", "c5-evs-ch02-t01", "c5-evs-ch02-t02", "c6-sst-ch03-t01", "c4-evs-ch09-t01"], misconceptions: [] },
  schema: LandSchema as unknown as z.ZodType<LandSpec>, defaultSpec: ldDefault, repair: repairLand, grade: gradeLand, keys: keysLand,
};
