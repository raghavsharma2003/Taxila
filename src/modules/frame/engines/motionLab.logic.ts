// motion-lab@1 v1 slice — speed, friction and the pendulum (science S10). Closed-form physics (no
// integrator is needed for these three scenes), so every reading is exact and golden-testable:
//   speed:    distance = speed × time.
//   friction: a block pushed at v0 slides d = v0² / (2 μk g) before it stops (μk per surface).
//   pendulum: period T = 2π √(L / g) for small swings, independent of the bob's mass.
import { clampInt, isNum } from "../kit/math.ts";

export type Scene = "speed" | "friction" | "pendulum";
export const G = 9.8;
export const SURFACES = { ice: 0.05, wood: 0.3, sand: 0.6, carpet: 0.45 } as const;
export type Surface = keyof typeof SURFACES;

export interface MLConfig {
  scene: Scene;
  distance: number; // speed: the flag, m
  time: number; // speed: s
  v0: number; // friction: m/s
  surfaces: Surface[];
  ask: "mass" | "length"; // pendulum question
  predict: boolean;
  issues: string[];
  error: string | null;
}

export function normalize(p: Record<string, unknown>): MLConfig {
  const issues: string[] = [];
  const rep = String(p.representation ?? "").toLowerCase();
  const scene: Scene = p.scene === "speed" || p.scene === "friction" || p.scene === "pendulum" ? p.scene : /pendul|swing|jhoola/.test(rep) ? "pendulum" : /friction|rough|smooth|ghars/.test(rep) ? "friction" : "speed";
  const time = clampInt(p.time, 1, 20, 5);
  const distance = clampInt(p.distance, 1, 200, 20);
  let error: string | null = null;
  if (scene === "speed" && distance % time !== 0) error = `speed: ${distance} m in ${time} s needs a whole-number speed`;
  if (scene === "speed" && distance / time > 20) error = "speed: more than 20 m/s";
  const surfaces = Array.isArray(p.surfaces) ? (p.surfaces.filter((x) => typeof x === "string" && x in SURFACES) as Surface[]).slice(0, 3) : [];
  if (Array.isArray(p.surfaces) && surfaces.length !== p.surfaces.length) issues.push("surfaces: only ice, wood, sand, carpet");
  return {
    scene,
    distance,
    time,
    v0: isNum(p.v0) ? Math.max(1, Math.min(6, p.v0)) : 3,
    surfaces: surfaces.length >= 2 ? surfaces : ["ice", "wood", "sand"],
    ask: p.ask === "length" ? "length" : "mass",
    predict: p.predict === true || p.mode === "predict",
    issues,
    error,
  };
}

export const travelled = (speed: number, time: number) => speed * time;
export const stoppingDistance = (v0: number, s: Surface) => (v0 * v0) / (2 * SURFACES[s] * G);
export const farthest = (c: Pick<MLConfig, "v0" | "surfaces">): Surface => [...c.surfaces].sort((a, b) => stoppingDistance(c.v0, b) - stoppingDistance(c.v0, a))[0];
/** Period in seconds for a string of L cm (mass does not enter). */
export const period = (Lcm: number, _massG?: number) => 2 * Math.PI * Math.sqrt(Lcm / 100 / G);
export const swingsIn = (seconds: number, Lcm: number) => Math.floor(seconds / period(Lcm));

/** Pendulum question answers, from the model: heavier → "same"; longer → "slower". */
export function pendulumAnswer(ask: "mass" | "length"): "faster" | "slower" | "same" {
  const t1 = period(50, 50);
  const t2 = ask === "mass" ? period(50, 200) : period(100, 50);
  return Math.abs(t1 - t2) < 1e-9 ? "same" : t2 > t1 ? "slower" : "faster";
}

/** A fair test varies only the asked variable: ≥ 2 runs with different values of it and the other held. */
export function fairTest(runs: { L: number; m: number }[], ask: "mass" | "length"): boolean {
  for (let i = 0; i < runs.length; i++)
    for (let j = i + 1; j < runs.length; j++) {
      const a = runs[i], b = runs[j];
      if (ask === "mass" && a.L === b.L && a.m !== b.m) return true;
      if (ask === "length" && a.m === b.m && a.L !== b.L) return true;
    }
  return false;
}
