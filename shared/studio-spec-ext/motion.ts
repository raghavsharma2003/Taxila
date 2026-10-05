// motion-lab@1 — Motion Lab (VALUES-100 V3.1: time, speed and motion; c6-sci ch05-t03, c7-sci ch08-t01..t03,
// c4-evs ch07-t02 moving toys).
//   pendulum — tune a pendulum's length until it beats the asked time period; a mass knob is there to be tried (it
//              changes nothing, which is the point: the misconception is that heavier swings faster)
//   race     — two of distance / time / speed are given; set the third on a dial so your cart and the train arrive
//              together, then RUN the race and watch it
//   drive    — hold the pedal to drive a car so its distance-time trace follows a target graph (uniform and
//              non-uniform motion are drawn, not described)
// Truth is physics computed here: T = 2π√(L/g), d = v·t, and the RMS gap between the driven and target graphs.
import { z } from "zod";
import { EnvelopeExt, MARKUP, TargetsField, UNGRADED, arr, envelope, isObj, num, oneOf, reqStr, strings, stringsSchema, targets, type ExtSpecDef, type Graded } from "./common.ts";

const ML_STRINGS = { round: "Round", done: "right", length: "length", mass: "mass", release: "SWING", stop: "STOP", lock: "LOCK", period: "one swing", swings: "swings", timer: "timer", run: "RUN", hold: "HOLD to drive", target: "target", yours: "yours", runDone: "Lab closed", coach: "Drag the slider, then test it", speed: "speed", time: "time", distance: "distance", train: "train", you: "you", together: "TOGETHER", early: "too early", late: "too late" };
const Pt = z.tuple([z.number().min(0).max(20), z.number().min(0).max(200)]);
const MlRound = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("pendulum"), title: z.string().min(1).max(22), sub: z.string().max(40), period: z.number().min(0.8).max(3.2), tol: z.number().min(0.03).max(0.3), massKnob: z.boolean(), ...TargetsField }),
  z.object({ mode: z.literal("race"), title: z.string().min(1).max(22), sub: z.string().max(40), ask: z.enum(["speed", "time", "distance"]), d: z.number().min(10).max(1000), t: z.number().min(2).max(60), unitD: z.enum(["m", "km"]), unitT: z.enum(["s", "h"]), tolPct: z.number().min(2).max(15), ...TargetsField }),
  z.object({ mode: z.literal("drive"), title: z.string().min(1).max(22), sub: z.string().max(40), pts: z.array(Pt).min(2).max(8), vmax: z.number().min(5).max(40), tol: z.number().min(2).max(30), ...TargetsField }),
]);
export type MlRoundT = z.infer<typeof MlRound>;
export const MotionSchema = z.object({ archetype: z.literal("motion-lab@1"), ...EnvelopeExt, strings: stringsSchema(ML_STRINGS, 40), title: z.string().min(1).max(36), rounds: z.array(MlRound).min(1).max(4) });
export type MotionSpec = z.infer<typeof MotionSchema>;

export const G = 9.81;
/** period (s) of a simple pendulum of length L cm */
export const periodOf = (Lcm: number) => 2 * Math.PI * Math.sqrt(Lcm / 100 / G);
export const lengthFor = (T: number) => G * (T / (2 * Math.PI)) ** 2 * 100;
export const L_MIN = 10, L_MAX = 250;
export const raceKey = (rd: Extract<MlRoundT, { mode: "race" }>) => (rd.ask === "speed" ? rd.d / rd.t : rd.ask === "time" ? rd.t : rd.d);
/** the dial range for a race round (0..max, in the asked quantity's unit) */
export const raceMax = (rd: Extract<MlRoundT, { mode: "race" }>) => { const k = raceKey(rd); const m = k * 2; const mag = 10 ** Math.floor(Math.log10(m)); return Math.ceil(m / mag) * mag; };
/** target distance at time t on a piecewise-linear graph (held flat after the last point) */
export function targetAt(pts: [number, number][], t: number): number {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [t0, d0] = pts[i - 1], [t1, d1] = pts[i]; return d0 + ((d1 - d0) * (t - t0)) / (t1 - t0 || 1); }
  return pts[pts.length - 1][1];
}
export const DRIVE_DT = 0.25;
/** RMS gap between a driven trace (distance every DRIVE_DT s) and the target */
export function driveGap(pts: [number, number][], trace: number[]): number {
  const end = pts[pts.length - 1][0], n = Math.round(end / DRIVE_DT);
  if (trace.length < n) return Infinity;
  let s = 0; for (let i = 1; i <= n; i++) { const e = trace[i] - targetAt(pts, i * DRIVE_DT); s += e * e; }
  return Math.sqrt(s / n);
}
export const isUniform = (pts: [number, number][]) => { const v = (i: number) => (pts[i][1] - pts[i - 1][1]) / (pts[i][0] - pts[i - 1][0]); for (let i = 2; i < pts.length; i++) if (Math.abs(v(i) - v(1)) > 1e-6) return false; return true; };

const mlDefault: MotionSpec = {
  archetype: "motion-lab@1", skills: ["c7-science-ch08-t01", "c7-science-ch08-t02", "c7-science-ch08-t03"], lang: "en", strings: { ...ML_STRINGS }, title: "Motion Lab",
  rounds: [
    { mode: "pendulum", title: "Clock pendulum", sub: "make one swing take 2 seconds", period: 2, tol: 0.08, massKnob: true, targets: "c7-science-ch08-t01-m1" },
    { mode: "race", title: "Catch the train", sub: "the train covers 120 m in 8 s", ask: "speed", d: 120, t: 8, unitD: "m", unitT: "s", tolPct: 5 },
    { mode: "drive", title: "Drive the graph", sub: "steady, stop, then faster", pts: [[0, 0], [4, 40], [6, 40], [10, 100]], vmax: 20, tol: 6 },
  ],
};
function repairMotion(raw: Record<string, unknown>, r: string[]): MotionSpec | null {
  const env = envelope(raw, mlDefault, r);
  const rounds: MlRoundT[] = [];
  for (const x of arr(raw.rounds, "rounds", r).slice(0, 4)) {
    if (!isObj(x)) { r.push("round"); continue; }
    const head = { title: reqStr(x.title, 22, "round.title", r) ?? "Motion", sub: typeof x.sub === "string" && x.sub.length <= 40 && !MARKUP.test(x.sub) ? x.sub : "", ...targets(x.targets, r) };
    const mode = oneOf(x.mode, ["pendulum", "race", "drive"] as const, "pendulum", "mode", r);
    if (mode === "pendulum") {
      const period = num(x.period, 0.8, 3.2, 2, "period", r);
      if (lengthFor(period) < L_MIN || lengthFor(period) > L_MAX) { r.push("pendulum:length-out-of-rig"); continue; }
      rounds.push({ mode, ...head, period, tol: num(x.tol, 0.03, 0.3, 0.08, "tol", r), massKnob: x.massKnob !== false });
    } else if (mode === "race") {
      rounds.push({ mode, ...head, ask: oneOf(x.ask, ["speed", "time", "distance"] as const, "speed", "ask", r), d: num(x.d, 10, 1000, 120, "d", r), t: num(x.t, 2, 60, 8, "t", r), unitD: oneOf(x.unitD, ["m", "km"] as const, "m", "unitD", r), unitT: oneOf(x.unitT, ["s", "h"] as const, "s", "unitT", r), tolPct: num(x.tolPct, 2, 15, 5, "tolPct", r) });
    } else {
      const pts = arr(x.pts, "pts", r).filter((p): p is [number, number] => Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === "number" && Number.isFinite(n))).slice(0, 8).map(([t, d]) => [Math.min(20, Math.max(0, t)), Math.min(200, Math.max(0, d))] as [number, number]);
      if (pts.length < 2 || pts[0][0] !== 0 || pts[0][1] !== 0) { r.push("drive:must-start-at-origin"); continue; }
      const vmax = num(x.vmax, 5, 40, 20, "vmax", r);
      let ok = true; for (let i = 1; i < pts.length; i++) { const dt = pts[i][0] - pts[i - 1][0], dd = pts[i][1] - pts[i - 1][1]; if (dt <= 0 || dd < 0 || dd / dt > vmax * 0.9) ok = false; }
      if (!ok) { r.push("drive:graph-must-rise-in-time-within-vmax"); continue; }
      rounds.push({ mode, ...head, pts, vmax, tol: num(x.tol, 2, 30, 6, "tol", r) });
    }
  }
  if (!rounds.length) return null;
  return { archetype: "motion-lab@1", ...env, strings: strings(raw.strings, ML_STRINGS, 40, r), title: reqStr(raw.title, 36, "title", r) ?? "Motion Lab", rounds };
}
function gradeMotion(spec: MotionSpec, itemId: string, value: unknown): Graded {
  const m = /^r(\d+)$/.exec(itemId); if (!m) return UNGRADED;
  const rd = spec.rounds[+m[1] - 1]; if (!rd) return UNGRADED;
  const v = isObj(value) ? value : {};
  if (rd.mode === "pendulum") {
    const L = Number(v.length); if (!Number.isFinite(L) || L < L_MIN || L > L_MAX) return { verdict: "wrong", truth: +lengthFor(rd.period).toFixed(1), detail: "no-value" };
    const e = Math.abs(periodOf(L) - rd.period);
    return { verdict: e <= rd.tol ? "right" : e <= rd.tol * 2.5 ? "partial" : "wrong", truth: +lengthFor(rd.period).toFixed(1), error: +e.toFixed(3), detail: `${periodOf(L).toFixed(2)} s` };
  }
  if (rd.mode === "race") { const key = raceKey(rd), x = Number(v.value); if (!Number.isFinite(x)) return { verdict: "wrong", truth: key, detail: "no-value" }; const e = Math.abs(x - key) / key * 100; return { verdict: e <= rd.tolPct ? "right" : e <= rd.tolPct * 2.5 ? "partial" : "wrong", truth: +key.toFixed(2), error: +e.toFixed(1) }; }
  const trace = Array.isArray(v.trace) ? v.trace.map(Number).filter(Number.isFinite).slice(0, 200) : [];
  const gap = driveGap(rd.pts, trace);
  return { verdict: gap <= rd.tol ? "right" : gap <= rd.tol * 2 ? "partial" : "wrong", truth: isUniform(rd.pts) ? "uniform" : "non-uniform", error: Number.isFinite(gap) ? +gap.toFixed(2) : undefined, detail: Number.isFinite(gap) ? `gap ${gap.toFixed(1)} m` : "unfinished" };
}
function keysMotion(spec: MotionSpec) {
  return spec.rounds.map((rd, k) => ({ itemId: `r${k + 1}`, key: rd.mode === "pendulum" ? `${lengthFor(rd.period).toFixed(1)} cm` : rd.mode === "race" ? `${+raceKey(rd).toFixed(2)} ${rd.ask === "speed" ? `${rd.unitD}/${rd.unitT}` : rd.ask === "time" ? rd.unitT : rd.unitD}` : isUniform(rd.pts) ? "uniform" : "non-uniform", prompt: rd.mode === "pendulum" ? `period ${rd.period} s` : rd.mode === "race" ? `${rd.ask}?` : "follow the graph" }));
}
export const motionDef: ExtSpecDef<MotionSpec> = {
  archetype: "motion-lab@1", title: "Motion Lab", kind: "simulation", subjects: ["science", "evs", "maths"],
  act: "tune a real-time pendulum's length to a target period (a mass knob that changes nothing), set the missing one of distance / time / speed and run the race, hold a pedal to drive a car along a target distance-time graph",
  outcomes: { classes: [4, 6, 7], subjects: ["science", "evs"], topics: ["c7-science-ch08-t01", "c7-science-ch08-t02", "c7-science-ch08-t03", "c6-science-ch05-t03"], misconceptions: [] },
  schema: MotionSchema as unknown as z.ZodType<MotionSpec>, defaultSpec: mlDefault, repair: repairMotion, grade: gradeMotion, keys: keysMotion,
};
