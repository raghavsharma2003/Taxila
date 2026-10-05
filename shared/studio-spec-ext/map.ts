// map-route@1 — Map Room (VALUES-100 V3.1: grids and maps, directions and routes, map scale, the globe grid of
// latitude and longitude, continents and oceans, finding directions; c4 ch2, c4-evs ch2, c5 ch14, c6-sst ch1/ch2,
// c6-sci ch4-t03).
//   route  — program a delivery drone with direction tiles (N E S W, or forward / left / right from its own heading),
//            then fly it: it must reach the place without crossing water or buildings
//   scale  — measure between two places with the tape; turn the map length into real km with the scale bar
//   globe  — drop pins at latitude / longitude on a world grid (land outlines only; no borders anywhere)
//   region — fly to the named continent or ocean (land mask + conventional regions, computed)
// Every key is computed: paths by simulation on the grid, distances by geometry, pins by degree error, regions by a
// point-in-polygon test on Natural Earth land.
import { z } from "zod";
import { EnvelopeExt, MARKUP, TargetsField, UNGRADED, arr, envelope, isObj, num, oneOf, reqNum, reqStr, strings, stringsSchema, targets, type ExtSpecDef, type Graded } from "./common.ts";
import { GLYPHS, type Glyph } from "./scene.ts";
import { LAND } from "./land-data.ts";

const MR_STRINGS = { thread: "Drag the thread along the road from A to B", round: "Round", done: "deliveries", go: "FLY", undo: "UNDO", coach: "Tap arrows to program the route, then FLY", runDone: "Map room closed", fwd: "forward", left: "left", right: "right", km: "km", scale: "1 square =", measure: "Drag the tape between the two places, then set the distance", lat: "lat", lon: "long", drop: "Tap where the pin goes", fly: "Fly to", set: "SET", N: "N", S: "S", E: "E", W: "W", blocked: "BLOCKED", arrived: "DELIVERED" };
const Cell = z.tuple([z.number().int().min(0).max(11), z.number().int().min(0).max(7)]);
const Place = z.object({ at: Cell, label: z.string().min(1).max(10).refine((s) => !MARKUP.test(s)), glyph: z.enum(GLYPHS).optional() });
export const REGIONS = ["Asia", "Africa", "Europe", "North America", "South America", "Australia", "Antarctica", "Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Southern Ocean"] as const;
const MrRound = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("route"), title: z.string().min(1).max(22), sub: z.string().max(40), w: z.number().int().min(5).max(12), h: z.number().int().min(4).max(8), blocks: z.array(Cell).max(40), places: z.array(Place).min(1).max(6), start: Cell, goal: z.number().int().min(0).max(5), steer: z.enum(["compass", "turns"]), maxSteps: z.number().int().min(2).max(30), ...TargetsField }),
  z.object({ mode: z.literal("scale"), title: z.string().min(1).max(22), sub: z.string().max(40), w: z.number().int().min(5).max(12), h: z.number().int().min(4).max(8), places: z.array(Place).min(2).max(6), from: z.number().int().min(0).max(5), to: z.number().int().min(0).max(5), kmPerSquare: z.number().min(0.5).max(500), tol: z.number().min(0.1).max(500), ...TargetsField }),
  z.object({ mode: z.literal("globe"), title: z.string().min(1).max(22), sub: z.string().max(40), pins: z.array(z.object({ lat: z.number().min(-80).max(80), lon: z.number().min(-180).max(180), label: z.string().min(1).max(12).optional() })).min(1).max(4), tol: z.number().min(2).max(15), ...TargetsField }),
  z.object({ mode: z.literal("thread"), title: z.string().min(1).max(22), sub: z.string().max(40), w: z.number().int().min(5).max(12), h: z.number().int().min(4).max(8), curve: z.array(z.tuple([z.number().min(0).max(12), z.number().min(0).max(8)])).min(3).max(10), kmPerSquare: z.number().min(0.5).max(500), tolPct: z.number().min(4).max(20), ...TargetsField }),
  z.object({ mode: z.literal("region"), title: z.string().min(1).max(22), sub: z.string().max(40), asks: z.array(z.enum(REGIONS)).min(1).max(5), ...TargetsField }),
]);
export type MrRoundT = z.infer<typeof MrRound>;
export const MapSchema = z.object({ archetype: z.literal("map-route@1"), ...EnvelopeExt, strings: stringsSchema(MR_STRINGS, 64), title: z.string().min(1).max(36), rounds: z.array(MrRound).min(1).max(4) });
export type MapSpec = z.infer<typeof MapSchema>;

// ── geography (computed)
function inPoly(x: number, y: number, flat: number[]): boolean { let c = false; for (let i = 0, j = flat.length - 2; i < flat.length; j = i, i += 2) { const xi = flat[i], yi = flat[i + 1], xj = flat[j], yj = flat[j + 1]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; }
export const onLand = (lon: number, lat: number) => LAND.some((p) => inPoly(lon, lat, p));
const CONT: Record<string, number[]> = {
  Africa: [-18, 37, 11, 38, 33, 32, 35, 30, 43, 12, 52, 12, 52, -2, 41, -17, 35, -35, 18, -36, 11, -18, 8, 4, -17, 14, -18, 22],
  Europe: [-25, 36, -6, 36, 10, 37, 28, 35, 30, 41, 41, 41, 48, 42, 50, 50, 58, 52, 66, 68, 60, 80, -25, 72],
  Asia: [27, 37, 35, 30, 43, 12, 52, 12, 60, 22, 75, 4, 96, -12, 141, -12, 145, 0, 180, 40, 180, 78, 60, 80, 66, 68, 58, 52, 50, 50, 48, 42, 41, 41, 30, 41],
  "North America": [-170, 72, -60, 84, -12, 84, -50, 60, -52, 46, -75, 20, -60, 14, -77, 7, -82, 8, -92, 14, -118, 30, -170, 52],
  "South America": [-82, 8, -77, 7, -60, 14, -34, -6, -40, -25, -64, -57, -76, -50, -82, -5],
  Australia: [110, -10, 155, -10, 180, -32, 176, -48, 145, -45, 110, -36],
};
export function regionOf(lon: number, lat: number): string {
  if (lat < -60) return onLand(lon, lat) ? "Antarctica" : "Southern Ocean";
  if (onLand(lon, lat)) { for (const [k, p] of Object.entries(CONT)) if (inPoly(lon, lat, p)) return k; return "land"; }
  if (lat > 66) return "Arctic Ocean";
  if ((lon >= 20 && lon <= 120 && lat < 25) || (lon >= 120 && lon <= 147 && lat < -12)) return "Indian Ocean";
  if (lon > -70 && lon < 20) return "Atlantic Ocean";
  if (lon >= -100 && lon <= -70 && lat > 8 && lat < 32) return "Atlantic Ocean";   // Caribbean and the Gulf
  if (lon >= -6 && lon <= 42 && lat >= 30 && lat <= 47) return "Atlantic Ocean";     // Mediterranean and Black Sea
  if (lon >= 100 || lon <= -70) return "Pacific Ocean";
  return "inland sea";
}
const DIRS: Record<string, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
/** Fly a program on the grid: compass moves ("N","E" …) or turns ("F","L","R", heading starts N). */
export function flyRoute(rd: Extract<MrRoundT, { mode: "route" }>, prog: string[]): { path: [number, number][]; blocked: boolean; end: [number, number] } {
  let [x, y] = rd.start; let h = 0; const path: [number, number][] = [[x, y]]; const blk = new Set(rd.blocks.map((b) => b.join(",")));
  const order = ["N", "E", "S", "W"];
  for (const m of prog.slice(0, 40)) {
    let d: [number, number] | null = null;
    if (rd.steer === "compass") d = DIRS[m] ?? null; else if (m === "L") h = (h + 3) % 4; else if (m === "R") h = (h + 1) % 4; else if (m === "F") d = DIRS[order[h]];
    if (!d) continue;
    x += d[0]; y += d[1];
    if (x < 0 || y < 0 || x >= rd.w || y >= rd.h || blk.has(x + "," + y)) return { path, blocked: true, end: [x, y] };
    path.push([x, y]);
  }
  return { path, blocked: false, end: [x, y] };
}
/** Breadth-first shortest compass route length (the planner needs a reachable goal within maxSteps). */
export function shortest(rd: Extract<MrRoundT, { mode: "route" }>): number {
  const blk = new Set(rd.blocks.map((b) => b.join(","))), goal = rd.places[rd.goal]?.at; if (!goal) return Infinity;
  const q: [number, number, number][] = [[rd.start[0], rd.start[1], 0]], seen = new Set([rd.start.join(",")]);
  while (q.length) { const [x, y, d] = q.shift()!; if (x === goal[0] && y === goal[1]) return d; for (const [dx, dy] of Object.values(DIRS)) { const nx = x + dx, ny = y + dy, k = nx + "," + ny; if (nx < 0 || ny < 0 || nx >= rd.w || ny >= rd.h || blk.has(k) || seen.has(k)) continue; seen.add(k); q.push([nx, ny, d + 1]); } }
  return Infinity;
}
/** a smooth road through the control points (Catmull-Rom), sampled in grid units */
export function curvePts(curve: [number, number][], per = 16): [number, number][] {
  const P = [curve[0], ...curve, curve[curve.length - 1]], out: [number, number][] = [];
  for (let i = 1; i < P.length - 2; i++) for (let k = 0; k < per; k++) { const t = k / per, t2 = t * t, t3 = t2 * t, f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3); out.push([f(P[i - 1][0], P[i][0], P[i + 1][0], P[i + 2][0]), f(P[i - 1][1], P[i][1], P[i + 1][1], P[i + 2][1])]); }
  out.push(curve[curve.length - 1]); return out;
}
export const polyLen = (pts: [number, number][]) => pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
export const threadKey = (rd: Extract<MrRoundT, { mode: "thread" }>) => polyLen(curvePts(rd.curve)) * rd.kmPerSquare;
/** how far (grid units, mean) a traced path strays from the road */
export function traceStray(rd: Extract<MrRoundT, { mode: "thread" }>, trace: [number, number][]): number {
  const road = curvePts(rd.curve, 24); if (trace.length < 2) return Infinity;
  return trace.reduce((a, q) => a + Math.min(...road.map((p) => Math.hypot(p[0] - q[0], p[1] - q[1]))), 0) / trace.length;
}
export const scaleKey = (rd: Extract<MrRoundT, { mode: "scale" }>) => { const a = rd.places[rd.from].at, b = rd.places[rd.to].at; return Math.hypot(a[0] - b[0], a[1] - b[1]) * rd.kmPerSquare; };

const mrDefault: MapSpec = {
  archetype: "map-route@1", skills: ["c5-maths-ch14-t01", "c5-maths-ch14-t02", "c6-sst-ch01-t01"], lang: "en", strings: { ...MR_STRINGS }, title: "Map Room",
  rounds: [
    { mode: "route", title: "Drone delivery", sub: "program the route around the lake", w: 10, h: 6, steer: "compass", maxSteps: 16, start: [0, 5], goal: 0,
      blocks: [[3, 2], [3, 3], [3, 4], [4, 2], [4, 3], [4, 4], [7, 0], [7, 1], [7, 2]], places: [{ at: [9, 1], label: "Clinic", glyph: "house" }, { at: [5, 5], label: "School", glyph: "school" }] },
    { mode: "scale", title: "How far?", sub: "1 square on the map = 5 km", w: 10, h: 6, kmPerSquare: 5, from: 0, to: 1, tol: 3, places: [{ at: [1, 1], label: "Village", glyph: "house" }, { at: [9, 4], label: "Market", glyph: "shop" }] },
    { mode: "globe", title: "Pin the globe", sub: "latitude first, then longitude", tol: 6, pins: [{ lat: 23.5, lon: 78, label: "Tropic" }, { lat: 0, lon: 0 }] },
  ],
};
const cell = (v: unknown): [number, number] | null => (Array.isArray(v) && v.length === 2 && Number.isInteger(v[0]) && Number.isInteger(v[1]) && v[0] >= 0 && v[0] <= 11 && v[1] >= 0 && v[1] <= 7 ? [v[0], v[1]] : null);
function places(v: unknown, r: string[], w: number, h: number) { return arr(v, "places", r).slice(0, 6).map((p) => { if (!isObj(p)) return null; const at = cell(p.at), label = reqStr(p.label, 10, "place.label", r); if (!at || !label || at[0] >= w || at[1] >= h) return null; const gl = typeof p.glyph === "string" && (GLYPHS as readonly string[]).includes(p.glyph) ? { glyph: p.glyph as Glyph } : {}; return { at, label, ...gl }; }).filter((p): p is NonNullable<typeof p> => !!p); }
function repairMap(raw: Record<string, unknown>, r: string[]): MapSpec | null {
  const env = envelope(raw, mrDefault, r);
  const rounds: MrRoundT[] = [];
  for (const x of arr(raw.rounds, "rounds", r).slice(0, 4)) {
    if (!isObj(x)) { r.push("round"); continue; }
    const head = { title: reqStr(x.title, 22, "round.title", r) ?? "Map", sub: typeof x.sub === "string" && x.sub.length <= 40 && !MARKUP.test(x.sub) ? x.sub : "", ...targets(x.targets, r) };
    const mode = oneOf(x.mode, ["route", "scale", "globe", "region", "thread"] as const, "route", "mode", r);
    if (mode === "thread") {
      const w = num(x.w, 5, 12, 10, "w", r, true), h = num(x.h, 4, 8, 6, "h", r, true);
      const curve = arr(x.curve, "curve", r).filter((c): c is [number, number] => Array.isArray(c) && c.length === 2 && c.every((n) => typeof n === "number" && Number.isFinite(n))).slice(0, 10).map(([a, b]) => [Math.min(w - 0.5, Math.max(0.5, a)), Math.min(h - 0.5, Math.max(0.5, b))] as [number, number]);
      if (curve.length < 3) { r.push("thread:curve"); continue; }
      const rd = { mode, ...head, w, h, curve, kmPerSquare: num(x.kmPerSquare, 0.5, 500, 5, "kmPerSquare", r), tolPct: num(x.tolPct, 4, 20, 10, "tolPct", r) } as Extract<MrRoundT, { mode: "thread" }>;
      const straight = Math.hypot(curve[curve.length - 1][0] - curve[0][0], curve[curve.length - 1][1] - curve[0][1]), along = polyLen(curvePts(curve));
      if (along < straight * 1.15) { r.push("thread:road-too-straight"); continue; }
      rounds.push(rd); continue;
    }
    if (mode === "route" || mode === "scale") {
      const w = num(x.w, 5, 12, 10, "w", r, true), h = num(x.h, 4, 8, 6, "h", r, true), ps = places(x.places, r, w, h);
      if (mode === "route") {
        const start = cell(x.start); if (!start || start[0] >= w || start[1] >= h || !ps.length) { r.push("route:start"); continue; }
        const blocks = arr(x.blocks, "blocks", r).map(cell).filter((b): b is [number, number] => !!b && b[0] < w && b[1] < h && !(b[0] === start[0] && b[1] === start[1]) && !ps.some((p) => p.at[0] === b[0] && p.at[1] === b[1])).slice(0, 40);
        const rd = { mode, ...head, w, h, blocks, places: ps, start, goal: Math.min(ps.length - 1, num(x.goal, 0, 5, 0, "goal", r, true)), steer: oneOf(x.steer, ["compass", "turns"] as const, "compass", "steer", r), maxSteps: num(x.maxSteps, 2, 30, 20, "maxSteps", r, true) } as Extract<MrRoundT, { mode: "route" }>;
        const sp = shortest(rd); if (!Number.isFinite(sp) || sp === 0) { r.push("route:unreachable"); continue; } if (rd.maxSteps < sp) { r.push("route:maxSteps-raised"); rd.maxSteps = Math.min(30, sp + 4); }
        rounds.push(rd);
      } else {
        if (ps.length < 2) { r.push("scale:places"); continue; }
        const from = num(x.from, 0, ps.length - 1, 0, "from", r, true), to = num(x.to, 0, ps.length - 1, 1, "to", r, true);
        if (from === to) { r.push("scale:same"); continue; }
        const kmPerSquare = num(x.kmPerSquare, 0.5, 500, 5, "kmPerSquare", r);
        const rd = { mode, ...head, w, h, places: ps, from, to, kmPerSquare, tol: 0 } as Extract<MrRoundT, { mode: "scale" }>;
        rd.tol = num(x.tol, 0.1, 500, Math.max(0.5, scaleKey(rd) * 0.08), "tol", r);
        rounds.push(rd);
      }
    } else if (mode === "globe") {
      const pins = arr(x.pins, "pins", r).slice(0, 4).map((p) => { if (!isObj(p)) return null; const lat = reqNum(p.lat, -80, 80, "lat", r), lon = reqNum(p.lon, -180, 180, "lon", r); if (lat === null || lon === null) return null; const label = typeof p.label === "string" && p.label.length <= 12 && !MARKUP.test(p.label) ? { label: p.label } : {}; return { lat, lon, ...label }; }).filter((p): p is NonNullable<typeof p> => !!p);
      if (pins.length) rounds.push({ mode, ...head, pins, tol: num(x.tol, 2, 15, 6, "tol", r) }); else r.push("globe:pins");
    } else {
      const asks = [...new Set(arr(x.asks, "asks", r).filter((a): a is typeof REGIONS[number] => (REGIONS as readonly string[]).includes(a as string)))].slice(0, 5);
      if (asks.length) rounds.push({ mode, ...head, asks }); else r.push("region:asks");
    }
  }
  if (!rounds.length) return null;
  return { archetype: "map-route@1", ...env, strings: strings(raw.strings, MR_STRINGS, 64, r), title: reqStr(raw.title, 36, "title", r) ?? "Map Room", rounds };
}
function gradeMap(spec: MapSpec, itemId: string, value: unknown): Graded {
  const m = /^r(\d+):(\d+)$/.exec(itemId); if (!m) return UNGRADED;
  const rd = spec.rounds[+m[1] - 1]; if (!rd) return UNGRADED; const i = +m[2];
  if (rd.mode === "route") {
    const prog = Array.isArray(value) ? value.filter((s): s is string => typeof s === "string").slice(0, 40) : [];
    const f = flyRoute(rd, prog), goal = rd.places[rd.goal].at, arrived = !f.blocked && f.end[0] === goal[0] && f.end[1] === goal[1];
    return { verdict: arrived && f.path.length - 1 <= rd.maxSteps ? "right" : arrived ? "partial" : "wrong", truth: shortest(rd), detail: f.blocked ? "blocked" : arrived ? `${f.path.length - 1} steps` : "missed" };
  }
  if (rd.mode === "scale") { const key = scaleKey(rd), v = typeof value === "number" ? value : NaN; if (!Number.isFinite(v)) return { verdict: "wrong", truth: key, detail: "no-value" }; const e = Math.abs(v - key); return { verdict: e <= rd.tol ? "right" : e <= rd.tol * 2.5 ? "partial" : "wrong", truth: +key.toFixed(2), error: +e.toFixed(2) }; }
  if (rd.mode === "thread") { const key = threadKey(rd), v = isObj(value) ? value : {}, trace = Array.isArray(v.trace) ? v.trace.filter((q): q is [number, number] => Array.isArray(q) && q.length === 2 && q.every((n) => typeof n === "number" && Number.isFinite(n))).slice(0, 400) : []; if (trace.length < 2) return { verdict: "wrong", truth: +key.toFixed(1), detail: "no-value" }; const got = polyLen(trace) * rd.kmPerSquare, e = (Math.abs(got - key) / key) * 100, stray = traceStray(rd, trace); return { verdict: e <= rd.tolPct && stray <= 0.35 ? "right" : e <= rd.tolPct * 2 ? "partial" : "wrong", truth: +key.toFixed(1), error: +e.toFixed(1), detail: stray > 0.35 ? "off the road" : `${got.toFixed(1)} km` }; }
  if (rd.mode === "globe") { const p = rd.pins[i]; if (!p) return UNGRADED; const v = isObj(value) ? value : {}; const lat = Number(v.lat), lon = Number(v.lon); if (!Number.isFinite(lat) || !Number.isFinite(lon)) return { verdict: "wrong", truth: p, detail: "no-value" }; const e = Math.max(Math.abs(lat - p.lat), Math.abs(((lon - p.lon + 540) % 360) - 180)); return { verdict: e <= rd.tol ? "right" : e <= rd.tol * 2 ? "partial" : "wrong", truth: p, error: +e.toFixed(1) }; }
  const ask = rd.asks[i]; if (!ask) return UNGRADED; const v = isObj(value) ? value : {}; const lat = Number(v.lat), lon = Number(v.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return { verdict: "wrong", truth: ask, detail: "no-value" };
  const got = regionOf(lon, lat); return { verdict: got === ask ? "right" : "wrong", truth: ask, detail: got };
}
function keysMap(spec: MapSpec) { return spec.rounds.flatMap((rd, k) => rd.mode === "route" ? [{ itemId: `r${k + 1}:0`, key: `${shortest(rd)} steps`, prompt: `to ${rd.places[rd.goal].label}` }] : rd.mode === "scale" ? [{ itemId: `r${k + 1}:0`, key: `${scaleKey(rd).toFixed(1)} km`, prompt: `${rd.places[rd.from].label}→${rd.places[rd.to].label} at ${rd.kmPerSquare} km/square` }] : rd.mode === "thread" ? [{ itemId: `r${k + 1}:0`, key: `${threadKey(rd).toFixed(1)} km`, prompt: `road length at ${rd.kmPerSquare} km/square` }] : rd.mode === "globe" ? rd.pins.map((p, i) => ({ itemId: `r${k + 1}:${i}`, key: `${p.lat},${p.lon}`, prompt: p.label ?? "pin" })) : rd.asks.map((a, i) => ({ itemId: `r${k + 1}:${i}`, key: a, prompt: `fly to ${a}` }))); }
export const mapDef: ExtSpecDef<MapSpec> = {
  archetype: "map-route@1", title: "Map Room", kind: "game", subjects: ["maths", "sst", "evs", "science"],
  act: "program a drone's route with direction tiles and fly it round obstacles, lay a thread along a winding road and straighten it on the scale, measure a map with the tape and convert with the scale, drop pins at latitude and longitude, fly to a named continent or ocean",
  outcomes: { classes: [4, 5, 6, 7], subjects: ["maths", "sst"], topics: ["c5-maths-ch14-t01", "c5-maths-ch14-t02", "c6-sst-ch01-t01"], misconceptions: [] },
  schema: MapSchema as unknown as z.ZodType<MapSpec>, defaultSpec: mrDefault, repair: repairMap, grade: gradeMap, keys: keysMap,
};
