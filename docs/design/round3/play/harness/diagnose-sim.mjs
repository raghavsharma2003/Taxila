#!/usr/bin/env node
// P-O9 (DESIGN.md §11): how many levels does it take to tell which misconception a child holds? SIMULATED learners only.
//
// A synthetic learner holds exactly one of the topic's mapped mal-rules, or none. On a level that DISCRIMINATES its belief
// (the level's proof.discriminates, computed by the family's own malActs replay) it plays the mal-rule's acts with
// probability 1 − ε, else the solution; on any other level it plays the solution with probability 1 − ε, else a random
// wrong act (an "other" error). The diagnoser keeps a Bayesian posterior over {none, each mal-rule}, updates it from the
// server-shaped grade (correct / incorrect with misconception X / incorrect other), and stops when one hypothesis reaches
// 0.9 or after 12 levels.
//
// Policies compared on the SAME candidate pool per step (the family's generator + proveLevel, as the server serves):
//   random  — a uniformly random proven level
//   picker  — src/play/core/pick.ts pickLevels' garam choice, fed the posterior as req.mis (what production does)
//   eig     — the level with the largest expected information gain about the hypothesis (the optimal-experiment rule)
//
//   node docs/design/round3/play/harness/diagnose-sim.mjs [--n 200] [--eps 0.1]
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { LOGIC } from "../../../../../src/play/families/index.ts";
import { pickLevels, proveLevel, pFirstTry } from "../../../../../src/play/core/pick.ts";
import { mulberry32 } from "../../../../../src/play/core/rng.ts";
import { coverage } from "../../../../../server/play/levels.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const N = Number(arg("n", 200)), EPS = Number(arg("eps", 0.1)), STOP = 0.9, MAX = 12;

// topics with ≥ 2 mapped mal-rules (diagnosis needs a choice to make)
const entries = coverage().entries.filter((e) => Object.keys(e.misMap).length >= 2);

function poolFor(logic, e, seed) {
  const req = { family: e.family, mode: e.mode, topicId: e.topicId, skillId: e.skillId, classLevel: e.classLevel, fade: 1, goal: e.goal, mis: {}, misMap: e.misMap, grammar: e.grammar, recent: [], seed };
  const out = [];
  for (const c of logic.generate(req).slice(0, 400)) {
    const v = logic.validate(c.level); if (!v) continue;
    const proof = proveLevel(logic, v); if (!proof) continue;
    out.push({ level: { ...v, proof: { ...proof, pFirstTry: 0, score: 0, genMs: 0 } }, difficulty: c.difficulty, sig: c.signature });
  }
  return { req, pool: out };
}
/** P(observation | hypothesis, level): obs ∈ "correct" | "other" | <kit misconception id> */
function lik(obs, h, level) {
  const disc = h !== "none" && level.proof.discriminates.includes(h);
  if (disc) return obs === h ? 1 - EPS : obs === "correct" ? EPS * 0.5 : obs === "other" ? EPS * 0.5 : 1e-6;
  return obs === "correct" ? 1 - EPS : obs === "other" ? EPS : 1e-6;
}
const H = (post) => -Object.values(post).reduce((s, p) => s + (p > 0 ? p * Math.log2(p) : 0), 0);
function update(post, obs, level) {
  const out = {}; let z = 0;
  for (const [h, p] of Object.entries(post)) { out[h] = p * lik(obs, h, level); z += out[h]; }
  for (const h of Object.keys(out)) out[h] /= z || 1;
  return out;
}
function eig(post, level) {
  const obsSet = ["correct", "other", ...level.proof.discriminates];
  let exp = 0;
  for (const o of obsSet) {
    const po = Object.entries(post).reduce((s, [h, p]) => s + p * lik(o, h, level), 0);
    if (po > 0) exp += po * H(update(post, o, level));
  }
  return H(post) - exp;
}
function learnerObs(truth, level, rnd) {
  const disc = truth !== "none" && level.proof.discriminates.includes(truth);
  if (disc) return rnd() < 1 - EPS ? truth : rnd() < 0.5 ? "correct" : "other";
  return rnd() < 1 - EPS ? "correct" : "other";
}

const rows = [];
for (const e of entries) {
  const logic = LOGIC[`${e.family}/${e.mode}`];
  const kitIds = [...new Set(Object.values(e.misMap))];
  const hyps = ["none", ...kitIds];
  const { req, pool } = poolFor(logic, e, 7);
  const discriminable = kitIds.filter((k) => pool.some((c) => c.level.proof.discriminates.includes(k)));
  if (pool.length < 4 || discriminable.length < 2) { rows.push({ topic: e.topicId, mode: `${e.mode}/${e.goal}`, skipped: `pool ${pool.length}, discriminable ${discriminable.length}` }); continue; }
  const res = {};
  for (const policy of ["random", "picker", "eig"]) {
    const counts = []; let right = 0;
    const rnd = mulberry32(99);
    for (let i = 0; i < N; i++) {
      const truth = hyps[i % hyps.length];
      let post = Object.fromEntries(hyps.map((h) => [h, 1 / hyps.length]));
      const used = new Set(); let k = 0;
      while (k < MAX && Math.max(...Object.values(post)) < STOP) {
        const avail = pool.filter((c) => !used.has(c.sig));
        if (!avail.length) break;
        let c;
        if (policy === "random") c = avail[Math.floor(rnd() * avail.length)];
        else if (policy === "eig") c = avail.reduce((b, x) => (eig(post, x.level) > eig(post, b.level) ? x : b), avail[0]);
        else {
          const mis = Object.fromEntries(kitIds.map((id) => [id, post[id]]));
          const r = pickLevels(logic, { ...req, mis, recent: [...used], seed: 7 });
          c = r ? avail.find((x) => x.level.levelId === r.garam.levelId) ?? avail.find((x) => x.sig === r.garam.levelId) ?? avail[0] : avail[0];
        }
        used.add(c.sig); k++;
        post = update(post, learnerObs(truth, c.level, rnd), c.level);
      }
      counts.push(k);
      const best = Object.entries(post).sort((a, b) => b[1] - a[1])[0];
      if (best[1] >= STOP && best[0] === truth) right++;
    }
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    res[policy] = { meanLevels: +mean.toFixed(2), correctlyClassified: `${right}/${N}` };
  }
  rows.push({ topic: e.topicId, mode: `${e.mode}/${e.goal}`, hypotheses: hyps.length, pool: pool.length, ...res, pickerVsRandom: +(res.picker.meanLevels / res.random.meanLevels).toFixed(2), eigVsRandom: +(res.eig.meanLevels / res.random.meanLevels).toFixed(2) });
  console.log(JSON.stringify(rows.at(-1)));
}
void pFirstTry;
const ok = rows.filter((r) => !r.skipped);
const agg = (k) => +(ok.reduce((s, r) => s + r[k], 0) / Math.max(1, ok.length)).toFixed(2);
const out = { at: new Date().toISOString(), method: `SIMULATED learners (one mal-rule or none, ε = ${EPS}), n = ${N} per topic per policy, Bayesian stop at ${STOP}, max ${MAX} levels; same proven candidate pool for every policy`, rows, mean: { pickerVsRandom: agg("pickerVsRandom"), eigVsRandom: agg("eigVsRandom") }, topics: ok.length };
writeFileSync(join(HERE, "..", "results", "diagnose-sim-2026-10-09.json"), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out.mean), "topics", ok.length);
