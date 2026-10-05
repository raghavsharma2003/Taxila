// sky-lab@1 — Sky Lab (VALUES-100 V3.1: Earth, Moon, Sun and stars as moving models; c5-evs ch09-t01/t02, c7-sci
// ch12-t01..t03, c6-sci ch12-t01, c4-evs ch10).
//   daynight — looking down on the North Pole: spin the Earth until it is the asked time in a city (it must spin west to
//              east, the way the real Earth does; the Sun never moves)
//   season   — move the Earth along its orbit with its axis fixed in space; read the noon Sun height and day length in
//              Delhi (and the Earth-Sun distance, which is SMALLEST in January) and stop on the asked season
//   eclipse  — drag the Moon round the Earth to make a solar or lunar eclipse; with `nodes`, the Moon's orbit is tilted
//              and the date must bring the Sun in line with the nodes too (why there is not an eclipse every month)
//   stars    — the real sky round the pole: scrub the night and find the one star that does not move, or follow the
//              pointer stars of the Saptarishi; or join the stars of a constellation
// All truth is computed from astronomy here (local solar time, solar declination, real star coordinates, J2000).
import { z } from "zod";
import { EnvelopeExt, MARKUP, TargetsField, UNGRADED, arr, envelope, isObj, num, oneOf, reqStr, strings, stringsSchema, targets, type ExtSpecDef, type Graded } from "./common.ts";

const SK_STRINGS = { round: "Round", done: "right", lock: "LOCK", spin: "Drag to spin the Earth", sun: "Sun", noon: "noon", midnight: "midnight", sunrise: "sunrise", sunset: "sunset", localTime: "time in", north: "North Pole", dayLength: "day", sunHigh: "noon Sun", distance: "Earth–Sun", orbit: "Drag the Earth along its orbit", longest: "longest day in Delhi", shortest: "shortest day in Delhi", equal: "equal day and night", summerNorth: "summer in India", summerSouth: "summer in Australia", solar: "solar eclipse", lunar: "lunar eclipse", moon: "Moon", date: "date", night: "night", stillStar: "Tap the star that does not move", pointer: "Drag from Merak through Dubhe", join: "Join the stars", polaris: "Pole Star", wrongWay: "the Earth spins west to east", runDone: "Sky closed", hours: "h", months: "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec", saptarishi: "Saptarishi", cassiopeia: "Cassiopeia", new: "new moon", waxingCrescent: "waxing crescent", firstQuarter: "first quarter", waxingGibbous: "waxing gibbous", full: "full moon", waningGibbous: "waning gibbous", lastQuarter: "last quarter", waningCrescent: "waning crescent", fromEarth: "seen from Earth", place: "Drag the Moon round its orbit" };
const SkRound = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("daynight"), title: z.string().min(1).max(22), sub: z.string().max(40), city: z.string().min(1).max(14), lon: z.number().min(-180).max(180), ask: z.enum(["noon", "midnight", "sunrise", "sunset"]), tolH: z.number().min(0.5).max(2), ...TargetsField }),
  z.object({ mode: z.literal("season"), title: z.string().min(1).max(22), sub: z.string().max(40), ask: z.enum(["longest", "shortest", "equal", "summerNorth", "summerSouth"]), ...TargetsField }),
  z.object({ mode: z.literal("eclipse"), title: z.string().min(1).max(22), sub: z.string().max(40), ask: z.enum(["solar", "lunar"]), nodes: z.boolean(), node: z.number().min(0).max(359), ...TargetsField }),
  z.object({ mode: z.literal("phase"), title: z.string().min(1).max(22), sub: z.string().max(40), ask: z.enum(["new", "waxingCrescent", "firstQuarter", "waxingGibbous", "full", "waningGibbous", "lastQuarter", "waningCrescent"]), ...TargetsField }),
  z.object({ mode: z.literal("stars"), title: z.string().min(1).max(22), sub: z.string().max(40), task: z.enum(["still", "pointer", "join"]), shape: z.enum(["saptarishi", "cassiopeia"]), ...TargetsField }),
]);
export type SkRoundT = z.infer<typeof SkRound>;
export const SkySchema = z.object({ archetype: z.literal("sky-lab@1"), ...EnvelopeExt, strings: stringsSchema(SK_STRINGS, 72), title: z.string().min(1).max(36), rounds: z.array(SkRound).min(1).max(4) });
export type SkySpec = z.infer<typeof SkySchema>;

// ---- day and night: Earth angle `rot` (deg, CCW seen from above the North Pole); the Sun is at angle 0 ----
export const ASK_H = { noon: 12, midnight: 0, sunrise: 6, sunset: 18 } as const;
/** local solar time (h) at longitude lon when the Earth has turned `rot` degrees (rot 0 = Greenwich at noon) */
export const localHour = (rot: number, lon: number) => (((12 + (rot + lon) / 15) % 24) + 24) % 24;
export const hourGap = (a: number, b: number) => { const d = Math.abs(a - b) % 24; return Math.min(d, 24 - d); };
export const rotFor = (lon: number, h: number) => ((((h - 12) * 15 - lon) % 360) + 360) % 360;
/** the start angle: the city 8 hours (120°) BEFORE the asked time, so the honest spin is +120° */
export const startRot = (rd: Extract<SkRoundT, { mode: "daynight" }>) => rotFor(rd.lon, (ASK_H[rd.ask] + 16) % 24);
// ---- seasons ----
export const decl = (day: number) => 23.44 * Math.sin((2 * Math.PI * (day - 80)) / 365);
export const dayHours = (lat: number, day: number) => { const x = -Math.tan((lat * Math.PI) / 180) * Math.tan((decl(day) * Math.PI) / 180); return x <= -1 ? 24 : x >= 1 ? 0 : (2 * Math.acos(x) * 180) / Math.PI / 15; };
export const noonSun = (lat: number, day: number) => 90 - Math.abs(lat - decl(day));
export const sunDistance = (day: number) => 1 - 0.0167 * Math.cos((2 * Math.PI * (day - 3)) / 365);
export const DELHI = 28.6;
const circ = (a: number, b: number) => { const d = Math.abs(a - b) % 365; return Math.min(d, 365 - d); };
export function seasonVerdict(ask: Extract<SkRoundT, { mode: "season" }>["ask"], day: number): "right" | "partial" | "wrong" {
  if (ask === "longest") return circ(day, 172) <= 20 ? "right" : circ(day, 172) <= 45 ? "partial" : "wrong";
  if (ask === "shortest") return circ(day, 355) <= 20 ? "right" : circ(day, 355) <= 45 ? "partial" : "wrong";
  if (ask === "equal") { const d = Math.min(circ(day, 80), circ(day, 266)); return d <= 10 ? "right" : d <= 25 ? "partial" : "wrong"; }
  if (ask === "summerNorth") return decl(day) >= 15 ? "right" : decl(day) >= 5 ? "partial" : "wrong";
  return decl(day) <= -15 ? "right" : decl(day) <= -5 ? "partial" : "wrong";
}
export const SEASON_DAY = { longest: 172, shortest: 355, equal: 80, summerNorth: 172, summerSouth: 355 } as const;
// ---- eclipses: angles in degrees, Sun direction seen from the Earth; Moon angle round the Earth ----
const angGap = (a: number, b: number) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); };
export const ECL_TOL = 6;
export function eclipseOk(rd: Extract<SkRoundT, { mode: "eclipse" }>, moon: number, sun: number): { aligned: boolean; onNode: boolean } {
  const want = rd.ask === "solar" ? sun : sun + 180, aligned = angGap(moon, want) <= ECL_TOL;
  const onNode = !rd.nodes || Math.abs(Math.sin(((moon - rd.node) * Math.PI) / 180)) <= Math.sin((ECL_TOL * Math.PI) / 180) + 1e-9;
  return { aligned, onNode };
}
// ---- Moon phases: the Sun is at angle 180 (left); elongation = the Moon's angle from the Sun, counted the way it orbits ----
export const PHASE_E = { new: 0, waxingCrescent: 45, firstQuarter: 90, waxingGibbous: 135, full: 180, waningGibbous: 225, lastQuarter: 270, waningCrescent: 315 } as const;
export const elongation = (moon: number) => (((moon - 180) % 360) + 360) % 360;
export const litFraction = (e: number) => (1 - Math.cos((e * Math.PI) / 180)) / 2;
// ---- stars: J2000 RA (h) and Dec (deg), rounded ----
export const STARS: Record<string, [number, number]> = {
  polaris: [2.53, 89.26], dubhe: [11.06, 61.75], merak: [11.03, 56.38], phecda: [11.9, 53.69], megrez: [12.26, 57.03], alioth: [12.9, 55.96], mizar: [13.4, 54.93], alkaid: [13.79, 49.31],
  caph: [0.15, 59.15], schedar: [0.68, 56.54], gammacas: [0.95, 60.72], ruchbah: [1.43, 60.24], segin: [1.91, 63.67],
  kochab: [14.85, 74.16], pherkad: [15.35, 71.83], thuban: [14.07, 64.38], alderamin: [21.31, 62.59], capella: [5.28, 46.0], deneb: [20.69, 45.28], errai: [23.66, 77.63], yildun: [17.54, 86.59],
};
export const SHAPES: Record<"saptarishi" | "cassiopeia", [string, string][]> = {
  saptarishi: [["dubhe", "merak"], ["merak", "phecda"], ["phecda", "megrez"], ["megrez", "dubhe"], ["megrez", "alioth"], ["alioth", "mizar"], ["mizar", "alkaid"]],
  cassiopeia: [["caph", "schedar"], ["schedar", "gammacas"], ["gammacas", "ruchbah"], ["ruchbah", "segin"]],
};
/** the star nearest the celestial pole is the one that does not move */
export const stillStar = () => Object.entries(STARS).sort((a, b) => b[1][1] - a[1][1])[0][0];
const ek = (a: string, b: string) => [a, b].sort().join("-");
export function joinScore(shape: "saptarishi" | "cassiopeia", edges: [string, string][]): { hit: number; extra: number; of: number } {
  const want = new Set(SHAPES[shape].map(([a, b]) => ek(a, b))), got = new Set(edges.filter((e) => e[0] !== e[1] && e[0] in STARS && e[1] in STARS).map(([a, b]) => ek(a, b)));
  let hit = 0, extra = 0; for (const e of got) if (want.has(e)) hit++; else extra++;
  return { hit, extra, of: want.size };
}

const skDefault: SkySpec = {
  archetype: "sky-lab@1", skills: ["c7-science-ch12-t01", "c7-science-ch12-t02", "c7-science-ch12-t03", "c6-science-ch12-t01"], lang: "en", strings: { ...SK_STRINGS }, title: "Sky Lab",
  rounds: [
    { mode: "daynight", title: "Spin the Earth", sub: "make it sunrise in Delhi", city: "Delhi", lon: 77.2, ask: "sunrise", tolH: 1, targets: "c7-science-ch12-t01-m1" },
    { mode: "season", title: "Orbit the Sun", sub: "find the longest day in Delhi", ask: "longest" },
    { mode: "eclipse", title: "Make an eclipse", sub: "line up for a solar eclipse", ask: "solar", nodes: true, node: 40 },
    { mode: "stars", title: "The still star", sub: "watch the night turn", task: "still", shape: "saptarishi" },
  ],
};
function repairSky(raw: Record<string, unknown>, r: string[]): SkySpec | null {
  const env = envelope(raw, skDefault, r);
  const rounds: SkRoundT[] = [];
  for (const x of arr(raw.rounds, "rounds", r).slice(0, 4)) {
    if (!isObj(x)) { r.push("round"); continue; }
    const head = { title: reqStr(x.title, 22, "round.title", r) ?? "Sky", sub: typeof x.sub === "string" && x.sub.length <= 40 && !MARKUP.test(x.sub) ? x.sub : "", ...targets(x.targets, r) };
    const mode = oneOf(x.mode, ["daynight", "season", "eclipse", "phase", "stars"] as const, "daynight", "mode", r);
    if (mode === "daynight") { const city = reqStr(x.city, 14, "city", r); if (!city) continue; rounds.push({ mode, ...head, city, lon: num(x.lon, -180, 180, 77.2, "lon", r), ask: oneOf(x.ask, ["noon", "midnight", "sunrise", "sunset"] as const, "noon", "ask", r), tolH: num(x.tolH, 0.5, 2, 1, "tolH", r) }); }
    else if (mode === "season") rounds.push({ mode, ...head, ask: oneOf(x.ask, ["longest", "shortest", "equal", "summerNorth", "summerSouth"] as const, "longest", "ask", r) });
    else if (mode === "phase") rounds.push({ mode, ...head, ask: oneOf(x.ask, ["new", "waxingCrescent", "firstQuarter", "waxingGibbous", "full", "waningGibbous", "lastQuarter", "waningCrescent"] as const, "full", "ask", r) });
    else if (mode === "eclipse") rounds.push({ mode, ...head, ask: oneOf(x.ask, ["solar", "lunar"] as const, "solar", "ask", r), nodes: x.nodes === true, node: num(x.node, 0, 359, 40, "node", r, true) });
    else rounds.push({ mode, ...head, task: oneOf(x.task, ["still", "pointer", "join"] as const, "still", "task", r), shape: oneOf(x.shape, ["saptarishi", "cassiopeia"] as const, "saptarishi", "shape", r) });
  }
  if (!rounds.length) return null;
  return { archetype: "sky-lab@1", ...env, strings: strings(raw.strings, SK_STRINGS, 72, r), title: reqStr(raw.title, 36, "title", r) ?? "Sky Lab", rounds };
}
function gradeSky(spec: SkySpec, itemId: string, value: unknown): Graded {
  const m = /^r(\d+)$/.exec(itemId); if (!m) return UNGRADED;
  const rd = spec.rounds[+m[1] - 1]; if (!rd) return UNGRADED;
  const v = isObj(value) ? value : {};
  if (rd.mode === "daynight") {
    const rot = Number(v.rot), net = Number(v.net); if (!Number.isFinite(rot)) return { verdict: "wrong", truth: ASK_H[rd.ask], detail: "no-value" };
    const h = localHour(rot, rd.lon), gap = hourGap(h, ASK_H[rd.ask]), timeOk = gap <= rd.tolH, wayOk = Number.isFinite(net) && net > 0;
    return { verdict: timeOk && wayOk ? "right" : timeOk ? "partial" : "wrong", truth: ASK_H[rd.ask], error: +gap.toFixed(2), detail: timeOk && !wayOk ? "spun east to west" : `${h.toFixed(1)} h` };
  }
  if (rd.mode === "season") { const day = Number(v.day); if (!Number.isFinite(day)) return { verdict: "wrong", truth: SEASON_DAY[rd.ask], detail: "no-value" }; const d = ((Math.round(day) % 365) + 365) % 365; return { verdict: seasonVerdict(rd.ask, d), truth: SEASON_DAY[rd.ask], detail: `day ${d}, δ ${decl(d).toFixed(1)}°` }; }
  if (rd.mode === "phase") { const moon = Number(v.moon); if (!Number.isFinite(moon)) return { verdict: "wrong", truth: PHASE_E[rd.ask], detail: "no-value" }; const e = elongation(moon), gap = angGap(e, PHASE_E[rd.ask]); return { verdict: gap <= 22 ? "right" : gap <= 45 ? "partial" : "wrong", truth: PHASE_E[rd.ask], error: +gap.toFixed(1), detail: `${Math.round(litFraction(e) * 100)}% lit` }; }
  if (rd.mode === "eclipse") { const moon = Number(v.moon), sun = rd.nodes ? Number(v.sun) : 180; if (!Number.isFinite(moon) || !Number.isFinite(sun)) return { verdict: "wrong", truth: rd.ask, detail: "no-value" }; const e = eclipseOk(rd, moon, sun); return { verdict: e.aligned && e.onNode ? "right" : e.aligned ? "partial" : "wrong", truth: rd.ask, detail: !e.aligned ? "not in line" : !e.onNode ? "Moon above or below the Sun's line" : "eclipse" }; }
  if (rd.task === "join") { const edges = Array.isArray(v.edges) ? v.edges.filter((e): e is [string, string] => Array.isArray(e) && e.length === 2 && typeof e[0] === "string" && typeof e[1] === "string").slice(0, 30) : []; const s = joinScore(rd.shape, edges); return { verdict: s.hit === s.of && s.extra === 0 ? "right" : s.hit >= Math.ceil(s.of * 0.7) && s.extra <= 1 ? "partial" : "wrong", truth: SHAPES[rd.shape].map((e) => e.join("-")), detail: `${s.hit}/${s.of}` }; }
  return { verdict: v.star === stillStar() ? "right" : "wrong", truth: stillStar() };
}
function keysSky(spec: SkySpec) {
  return spec.rounds.map((rd, k) => ({ itemId: `r${k + 1}`, key: rd.mode === "daynight" ? `${rd.city} at ${ASK_H[rd.ask]}:00 (spin +${(((rotFor(rd.lon, ASK_H[rd.ask]) - startRot(rd)) % 360) + 360) % 360}°)` : rd.mode === "season" ? `day ${SEASON_DAY[rd.ask]}` : rd.mode === "eclipse" ? `${rd.ask}${rd.nodes ? ` at node ${rd.node}°` : ""}` : rd.mode === "phase" ? `${PHASE_E[rd.ask]}° from the Sun` : rd.task === "join" ? SHAPES[rd.shape].map((e) => e.join("-")).join(",") : stillStar(), prompt: rd.sub || rd.title }));
}
export const skyDef: ExtSpecDef<SkySpec> = {
  archetype: "sky-lab@1", title: "Sky Lab", kind: "simulation", subjects: ["science", "evs"],
  act: "spin the Earth (west to east) until a city reaches the asked time, move the tilted Earth round its orbit to find a season while reading day length, noon Sun height and distance, drag the Moon (and the date) to line up an eclipse, place the Moon in its orbit for a named phase then see it from Earth, scrub the night sky to find the still Pole Star or join a constellation",
  outcomes: { classes: [4, 5, 6, 7], subjects: ["science", "evs"], topics: ["c7-science-ch12-t01", "c7-science-ch12-t02", "c7-science-ch12-t03", "c6-science-ch12-t01", "c5-evs-ch09-t01", "c5-evs-ch09-t02", "c4-evs-ch10-t02"], misconceptions: [] },
  schema: SkySchema as unknown as z.ZodType<SkySpec>, defaultSpec: skDefault, repair: repairSky, grade: gradeSky, keys: keysSky,
};
