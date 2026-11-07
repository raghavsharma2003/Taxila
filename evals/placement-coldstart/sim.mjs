// Cold-start placement, measured offline (round 7 F, main 2026-11-07 item (c)). Simulated children with KNOWN true θ
// (maths, GE scale) answer onboarding (a noisy parent view, a noisier own pick), get a start from
// server/placement/coldstart.js, then take lessons. Each lesson yields first-try answers on skills at the current start,
// drawn from the child's true θ, and folds them through the REAL θ engine (kt/ability.js initialBase / openEpoch / addObs /
// currentTheta). Covert refinement is coldstart.refinedStart over that live θ. No quiz anywhere.
//
// Reported per population × answer model × condition:
//   settle      lessons until refinedStart reads θ AND |θ̂ − θ| ≤ 0.5 holds from then to the last lesson (median, p75;
//               "never" counts as LESSONS + 1)
//   by5 / by10  share settled by lesson 5 / 10
//   err1        mean |start − θ| at lesson 1;  high1  share starting > 0.5 GE above θ (too hard on day one)
//   err5        mean |start − θ| at lesson 5
// Conditions: "class" = today's rule without answers (θ prior = class prior; start = the calendar, C − 1 + 0.8·year);
//             "onboarding" = the answers' site and start (coldstart.js).
//
//   node evals/placement-coldstart/sim.mjs [--z 0.25] [--settle 0.6] [--n 300] [--obs 3] [--lessons 20] [--seed 7] [--out evals/placement-coldstart/out.json]
import fs from "node:fs";
import { initialBase, newEpoch, openEpoch, addObs, currentTheta, A_GE, C_OPEN, S_SLIP, gAtten, sigmoid, bSkill } from "../../server/learner/kt/ability.js";
import { coldStartResult, refinedStart, SITE_SD_MIN } from "../../server/placement/coldstart.js";
import { schoolYearFraction } from "../../server/placement/cat.js";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const TUNE = { ...(arg("z") != null ? { zStart: Number(arg("z")) } : {}), ...(arg("settle") != null ? { settleSd: Number(arg("settle")) } : {}) };
const N = Number(arg("n", 300)), OBS = Number(arg("obs", 3)), LESSONS = Number(arg("lessons", 20)), SEED = Number(arg("seed", 7));
const OUT = arg("out", "evals/placement-coldstart/out.json");
const DATE = new Date("2026-11-07T10:00:00+05:30");
const CLASSES = [3, 4, 5, 6, 7, 8];

// seeded PRNG + normal
let st = SEED >>> 0;
const rnd = () => { st = (st + 0x6d2b79f5) >>> 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());

// b for a skill at GE g is g + B_OFF (ability.js bSkill: an on-grade child succeeds 70% of the time); read off a real id
const B_OFF = bSkill("c5-maths-ch01-t01") - 4;
const expectedOf = (C) => C - 1 + schoolYearFraction(DATE);
const calendarGE = (C) => C - 1 + 0.8 * schoolYearFraction(DATE);

/** True θ populations, relative to the class's expected level today. */
const POPS = {
  // the model's own belief (ability.js classPrior: 0.6 on-track at C−1, 0.4 far below), each component sd 1.0
  model: (C) => { const enrolled = C - 0.5, gap = Math.max(0.5, 0.6 * (C - 1.8)); return rnd() < 0.6 ? enrolled - 0.5 + gauss() : enrolled - gap + gauss(); },
  // a kinder world: 80% within ±0.6 of expected, 20% a class and a half below
  ontrack: (C) => (rnd() < 0.8 ? expectedOf(C) + 0.6 * gauss() : expectedOf(C) - 1.5 + 0.8 * gauss()),
};
/** How children answer items: the engine's own 4PL, and a misspecified one (flatter, more slips and guesses). */
const ANSWER = {
  model: { a: A_GE * gAtten(0.75), c: C_OPEN, s: S_SLIP },
  missp: { a: 1.0, c: 0.1, s: 0.15 },
};
/** Onboarding answers from the truth: the parent sees the child's level through noise sd 0.8; the child through 1.2. */
function answersOf(theta, C) {
  const d = theta - expectedOf(C);
  const pv = rnd() < 0.15 ? "unsure" : (d + 0.8 * gauss() < -0.8 ? "hard" : d + 0.8 * gauss() > 0.6 ? "easy" : "fine");
  const e = d + 1.2 * gauss();
  const cp = e < -0.6 ? "tricky" : e > 0.6 ? "easy" : "okay";
  return { parentView: pv, childPick: cp };
}

function runChild({ C, theta, cond, ans }) {
  const strand = "maths:core";
  const r = cond === "onboarding" ? coldStartResult({ subject: "maths", classLevel: C, ...answersOf(theta, C), date: DATE }, TUNE) : null;
  const site = r?.placement?.[strand];
  const placement = site ? { [strand]: { mu: site.mu, sd: Math.max(SITE_SD_MIN, site.sd) } } : {};
  let t = DATE.getTime();
  let ep = newEpoch(initialBase({ strands: [strand], classLevel: C, openedAt: new Date(t), epochId: "e0", placement }));
  const start0 = r ? r.startGE : calendarGE(C);
  const trail = [];
  let ev = 0;
  for (let L = 1; L <= LESSONS; L++) {
    if (L > 1) { t += 86_400_000; ep = openEpoch(ep, new Date(t), `e${L}`); }
    const th = currentTheta(ep)[strand];
    const start = refinedStart({ startGE: start0 }, th, TUNE);
    // the lesson's first-try answers sit on skills at the start (GE start .. start+0.3), b at the engine's convention
    for (let k = 0; k < OBS; k++) {
      const ge = start.startGE + 0.3 * rnd();
      const b = ge + B_OFF;
      const P = ans.c + (1 - ans.c - ans.s) * sigmoid(ans.a * (theta - b));
      addObs(ep, { evId: `x${ev++}`, strand, y: rnd() < P ? 1 : 0, b, a: A_GE * gAtten(0.75), c: C_OPEN, s: S_SLIP, w: 1 });
    }
    const after = currentTheta(ep)[strand];
    trail.push({ L, start: start.startGE, from: start.from, mu: after.mu, sd: after.sd });
  }
  return { start0, trail };
}

/** Lessons to settle: the first lesson whose start reads θ and from which |θ̂ − θ| ≤ 0.5 holds to the end. */
function settleOf(trail, theta) {
  for (let i = 0; i < trail.length; i++) {
    if (trail[i].from !== "theta") continue;
    if (trail.slice(i).every((x) => Math.abs(x.mu - theta) <= 0.5)) return trail[i].L;
  }
  return LESSONS + 1;
}

const q = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const r2 = (x) => Math.round(x * 100) / 100;

const rows = [];
for (const [pop, draw] of Object.entries(POPS)) for (const [am, ans] of Object.entries(ANSWER)) for (const cond of ["class", "onboarding"]) {
  const settle = [], err1 = [], err5 = [], high1 = [];
  for (const C of CLASSES) for (let i = 0; i < N; i++) {
    const theta = draw(C);
    const { start0, trail } = runChild({ C, theta, cond, ans });
    settle.push(settleOf(trail, theta));
    err1.push(Math.abs(start0 - theta));
    high1.push(start0 - theta > 0.5 ? 1 : 0);
    err5.push(Math.abs(trail[Math.min(4, trail.length - 1)].start - theta));
  }
  rows.push({ pop, answers: am, cond, n: settle.length, settleMedian: q(settle, 0.5), settleP75: q(settle, 0.75),
    by5: r2(mean(settle.map((x) => (x <= 5 ? 1 : 0)))), by10: r2(mean(settle.map((x) => (x <= 10 ? 1 : 0)))),
    err1: r2(mean(err1)), high1: r2(mean(high1)), err5: r2(mean(err5)) });
}
console.table(rows);
fs.mkdirSync(new URL(".", `file://${process.cwd()}/${OUT}`).pathname, { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ at: new Date().toISOString(), method: "evals/placement-coldstart/sim.mjs", n: N, obsPerLesson: OBS, lessons: LESSONS, seed: SEED, tune: TUNE, classes: CLASSES, rows }, null, 1));
console.log(`wrote ${OUT}`);
