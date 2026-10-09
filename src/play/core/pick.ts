// The level picker (DESIGN.md §3 "levels as experiments", §9). Pure; the server runs it per level (target p95 ≤ 50 ms) and
// the dev harness runs it in the browser. No model, no clock, seeded only through the request.
//
//   proveLevel: solvable (the family solver finds a sequence AND the grader marks it solved and clean), shortcut-free (the
//               family's shortcut search finds nothing), and which mapped mal-rules this level makes visible (their act
//               sequence produces their own misconception signature).
//   pickLevels: score = Σ P(misconception) over the misconceptions the level discriminates (diagnose fast)
//                       + band fit around 0.78 first-try success (0.62 for the harder door)
//                       + novelty (a signature the child has not just played); two doors from the top of the list.
import type { Candidate, FamilyLogic, GenRequest, LevelProof, PlayActBody, PlayActEnvelope, PlayLevel } from "../../../shared/play.ts";
import { gradeLevel } from "./replay.ts";

/** First-try success targets (G11: 70-85%). Difficulty scales are per family and UNCALIBRATED [U]: the band only orders them. */
export const BAND = { garam: 0.75, teekha: 0.55 } as const;
/** The learner model's P(unaided) when the request carries none (a mid-practice child). */
export const DEFAULT_PL = 0.75;
const logit = (p: number) => Math.log(p / (1 - p));
const sigm = (x: number) => 1 / (1 + Math.exp(-x));
export const env = <A>(acts: A[]): PlayActEnvelope<A>[] => acts.map((act, i) => ({ seq: i + 1, t: i * 900, via: "touch" as const, act }));

/** P(first try) for a candidate of `difficulty` (0..1) for a child at pL. */
export function pFirstTry(difficulty: number, pL = DEFAULT_PL): number {
  const p = Math.min(0.97, Math.max(0.05, pL));
  return sigm(logit(p) - 2.4 * (difficulty - 0.45));
}

export function proveLevel<P, S, A extends PlayActBody>(logic: FamilyLogic<P, S, A>, level: PlayLevel<P>): Omit<LevelProof, "pFirstTry" | "score" | "genMs"> | null {
  const sol = logic.solve(level);
  if (!sol || !sol.length) return null;
  const g = gradeLevel(logic, level, env(sol), { final: true });
  if (g.verdict !== "solved" || !g.clean) return null;
  if (logic.shortcut(level)) return null;
  const discriminates: string[] = [];
  for (const [malId, kitId] of Object.entries(level.mal)) {
    const acts = logic.malActs(level, malId);
    if (!acts) continue;
    const mg = gradeLevel(logic, level, env(acts), { final: true });
    if (mg.moments.some((m) => m.kind === "misconception_consequence" && m.misconceptionId === malId)) discriminates.push(kitId);
  }
  return { solvable: true, shortcutFree: true, minActs: sol.length, solutions: 1, discriminates: [...new Set(discriminates)] };
}

export interface Picked<P> { garam: PlayLevel<P>; teekha: PlayLevel<P> | null; considered: number; served: number; ms: number }

export function pickLevels<P, S, A extends PlayActBody>(logic: FamilyLogic<P, S, A>, req: GenRequest, opts: { max?: number } = {}): Picked<P> | null {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const cands: Candidate<P>[] = logic.generate(req).slice(0, opts.max ?? 400);
  const scored: { c: Candidate<P>; proof: Omit<LevelProof, "pFirstTry" | "score" | "genMs">; p: number; base: number }[] = [];
  const recent = new Set(req.recent);
  for (const c of cands) {
    const v = logic.validate(c.level as PlayLevel<unknown>);
    if (!v) continue;
    const proof = proveLevel(logic, v);
    if (!proof) continue;
    const p = pFirstTry(c.difficulty, req.pL);
    const diag = proof.discriminates.reduce((s, id) => s + (req.mis[id] ?? 0.15), 0);
    const novelty = recent.has(c.signature) ? -0.6 : 0.25;
    scored.push({ c: { ...c, level: v }, proof, p, base: 1.4 * diag + novelty });
  }
  if (!scored.length) return null;
  const score = (s: (typeof scored)[number], band: number) => s.base - 2.2 * Math.abs(s.p - band);
  const finish = (s: (typeof scored)[number], sc: number, door?: "garam" | "teekha"): PlayLevel<P> => {
    const ms = (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0;
    return { ...s.c.level, ...(door ? { door } : {}), proof: { ...s.proof, pFirstTry: +s.p.toFixed(3), score: +sc.toFixed(3), genMs: +ms.toFixed(2) } };
  };
  const byG = [...scored].sort((a, b) => score(b, BAND.garam) - score(a, BAND.garam) || (a.c.signature < b.c.signature ? -1 : 1));
  const g = byG[0];
  const harder = scored.filter((s) => s.c.signature !== g.c.signature && s.c.difficulty > g.c.difficulty + 0.05);
  const byT = harder.sort((a, b) => score(b, BAND.teekha) - score(a, BAND.teekha) || (a.c.signature < b.c.signature ? -1 : 1));
  const garam = finish(g, score(g, BAND.garam), req.harder ? undefined : "garam");
  const teekha = byT[0] ? finish(byT[0], score(byT[0], BAND.teekha), "teekha") : null;
  const ms = (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0;
  return { garam, teekha, considered: cands.length, served: scored.length, ms };
}
