// RT-M2 simulator gate (BUILD-PLAN §3 W1-C #5, §7 "RT-M2: re-teach loop vs random arms, 20 seeds, beats random on
// DRS, else the loop does not ship"; personalisation audit §4.3). The REAL re-teach loop — selectReteach (reteach.js),
// the in-lesson failed-arm / prerequisite inputs (reteachSessionInputs + noteReteach, the code director/state.js calls),
// the resolver that turns a child's later answers into outcomes (resolve.js resolveAttempts) and the once-only
// population posterior update (session.js resolutionStmt semantics) — against the same loop choosing arms at random
// (no posteriors: Thompson over Beta(1,1) is a uniform draw among the eligible arms).
//
// World [U, author-set; the sim gates mechanics, never efficacy (SIM6)]: each arm has a hidden success rate per
// population cluster (subject × band), drawn per seed; the kit's primary arm is a little better on average; a
// language switch helps only a child who speaks Hindi; a child with a weak prerequisite gains half as much from any
// arm until a prerequisite descent repairs it; every child adds its own noise. Children arrive one after another, so
// the population posteriors learn as the cohort grows (what production does).
//
// DRS here = the share of re-teach episodes whose skill later shows a DELAYED success (resolved_delayed: a correct
// answer ≥ 20 h after the re-teach), the bandit's y_delay. Usage: node evals/comprehension-sim/rtm2.mjs [--seeds 20]
// [--children 240] [--out file]
import { writeFileSync, mkdirSync } from "fs";
import { selectReteach, armsFromKit, reteachSessionInputs, noteReteach, GENERIC_ARMS } from "../../server/comprehension/reteach.js";
import { resolveAttempts, clusterOf } from "../../server/comprehension/resolve.js";
import { outcomeIndex } from "../../server/learner/kt/outcomes.js";
import { concepts } from "./world.mjs";
import { rng } from "./child.mjs";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const SEEDS = Number(opt("--seeds", 20));
const CHILDREN = Number(opt("--children", 240));
const DAYS = 4;
const DAY = 86_400_000, MIN = 60_000;
const T0 = Date.parse("2026-10-05T04:30:00.000Z");
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const r3 = (x) => (x == null ? null : Math.round(x * 1000) / 1000);
const clamp = (p) => Math.max(0.02, Math.min(0.95, p));

const CS = concepts();
/** The re-teach world of one seed: hidden arm success per cluster. */
function world(seed) {
  const r = rng(`rtm2-world:${seed}`);
  const eff = {};
  for (const c of CS) {
    const mis = c.kit.misconceptions[0];
    const arms = [...armsFromKit(mis), ...GENERIC_ARMS];
    for (const band of ["B2", "B3"]) {
      const cl = clusterOf(c.skillId, band);
      for (const a of arms) eff[`${cl}|${a.id}`] ??= clamp(0.15 + 0.5 * r() + (a.primary ? 0.1 : 0) + (a.repClass === "language_switch" ? -0.05 : 0));
    }
  }
  return eff;
}

/** One child: DAYS lessons, two concepts a day, a misconception re-teach episode on most. Mutates `pop` (posteriors) for the loop. */
function runChildRT({ seed, idx, policy, eff, pop, log }) {
  const r = rng(`rtm2:${seed}:${idx}:${policy}`);
  const rt = rng(`rtm2-truth:${seed}:${idx}`);                       // the child's truth does not depend on the policy
  const band = rt() < 0.5 ? "B2" : "B3";
  const lang = rt() < 0.4 ? "en" : "hinglish";
  const noise = {};
  const weak = Object.fromEntries(CS.map((c) => [c.skillId, rt() < 0.3]));
  const rows = [], events = [];
  let rowId = 0, seq = 0;
  const episodes = [];
  const success = (c, armId, s) => {
    const cl = clusterOf(c.skillId, band);
    const arm = [...armsFromKit(c.kit.misconceptions[0]), ...GENERIC_ARMS].find((a) => a.id === armId);
    let p = eff[`${cl}|${armId}`] ?? 0.3;
    if (arm?.repClass === "language_switch") p = lang === "en" ? 0.1 : clamp(p + 0.15);
    noise[armId] ??= (rt() - 0.5) * 0.16;
    p = clamp(p + noise[armId]);
    if (s.weak) p *= 0.5;
    return r() < p;
  };
  const ev = (c, sessionId, at, ok) => events.push({ id: `e${++seq}`, seq, sessionId, at: new Date(at).toISOString(), skillIds: [c.skillId], target: c.skillId,
    cls: "item.open", outcome: outcomeIndex("item.open", ok ? "C0" : "C4") });
  const resolveNow = (now) => {
    const { updates } = resolveAttempts(rows, events, { now, band });
    for (const u of updates) {
      const row = rows.find((x) => x.id === u.id);
      if (row.rewarded_at) continue;
      row.outcome = u.outcome; row.reward = u.reward;
      if (u.final) {
        row.rewarded_at = new Date(now).toISOString();
        if (u.reward != null) { const p = (pop[`${u.cluster}|${u.armId}`] ??= { a: 1, b: 1 }); p.a += u.reward; p.b += 1 - u.reward; }
      }
    }
    return resolveAttempts(rows, events, { now, band }).attempts;
  };

  for (let d = 0; d < DAYS; d++) {
    const start = T0 + d * DAY;
    const sessionId = `${seed}-${idx}-d${d}`;
    const attempts = resolveNow(start);                              // lesson start: session.js resolves, then loads
    const todays = [CS[(idx + 2 * d) % CS.length], CS[(idx + 2 * d + 1) % CS.length]];
    // yesterday's skills come back first (the next-lesson check: resolved_next / resolved_delayed)
    for (const e of episodes.filter((x) => x.day === d - 1 || (x.day < d - 1 && !x.checked))) {
      const ok = r() < (e.repaired ? 0.8 : weak[e.c.skillId] ? 0.15 : 0.3);
      ev(e.c, sessionId, start + MIN, ok);
      e.checked = true;
    }
    const s = { failedArms: {}, lastArmBySkill: {}, armsUsed: [], comp: {}, skills: {}, ctx: {} };
    let t = start + 5 * MIN;
    for (const c of todays) {
      if (r() > 0.7) continue;                                       // no misconception confirmed on this concept today
      const k = c.skillId, mis = c.kit.misconceptions[0];
      const kitArms = armsFromKit(mis);
      const ep = { c, day: d, repaired: false, checked: false };
      episodes.push(ep);
      const state = { weak: weak[k] };
      for (let step = 0; step < 4 && !ep.repaired; step++) {
        const kit = { skills: [{ id: k, prereqSkillIds: [] }] };
        s.ctx.reteach = { prereqs: { [k]: [{ skillId: `${c.topicId}-pre-s1`, pL: state.weak ? 0.3 : 0.85 }] } };
        const inputs = reteachSessionInputs(s, k, kit);
        const posteriors = policy === "loop" ? Object.fromEntries(Object.entries(pop).filter(([key]) => key.startsWith(`${clusterOf(k, band)}|`)).map(([key, v]) => [key.split("|")[1], v])) : {};
        const dcs = selectReteach({ trigger: step === 0 ? "misconception_confirmed" : "two_fails_post_rung3", skillId: k, misId: mis.id, kitArms, attempts, band,
          seed: `${seed}:${idx}:${d}:${k}:${step}`, posteriors, lessonArmsUsed: s.armsUsed, failedArmsThisSession: inputs.failedArmsThisSession,
          prereqs: inputs.prereqs, pL: 0.5, hindiObserved: lang !== "en", now: new Date(t).toISOString() });
        noteReteach(s, k, dcs, inputs);
        log.moves[dcs.move] = (log.moves[dcs.move] ?? 0) + 1;
        if (dcs.move === "park" || dcs.move === "none") break;
        if (dcs.move === "prereq_descent") { if (state.weak) { state.weak = false; weak[k] = false; } t += 3 * MIN; continue; }
        s.armsUsed.push(dcs.armId);
        rows.push({ id: ++rowId, skill_id: k, session_id: sessionId, misconception_id: mis.id, arm_id: dcs.armId, rep_class: dcs.repClass,
          representation_id: dcs.representation ?? null, at: new Date(t).toISOString(), outcome: null, reward: null, rewarded_at: null });
        t += 2 * MIN;
        const ok = success(c, dcs.armId, state);
        ev(c, sessionId, t, ok);                                     // the in-lesson re-check (cooldown items)
        t += 2 * MIN;
        if (ok) ep.repaired = true;
      }
    }
  }
  // the horizon: one more lesson a day later checks what is still open, then resolves everything
  const end = T0 + DAYS * DAY;
  for (const e of episodes.filter((x) => !x.checked)) ev(e.c, `${seed}-${idx}-end`, end + MIN, r() < (e.repaired ? 0.8 : weak[e.c.skillId] ? 0.15 : 0.3));
  resolveNow(end + 31 * DAY);
  const drs = episodes.map((e) => {
    const mine = rows.filter((x) => x.skill_id === e.c.skillId && x.session_id.endsWith(`-d${e.day}`));
    return mine.some((x) => x.outcome === "resolved_delayed") ? 1 : 0;
  });
  return { drs, repairedNow: episodes.map((e) => +e.repaired), attempts: rows.length, resolvedRows: rows.filter((x) => x.outcome).length, rewarded: rows.filter((x) => x.rewarded_at).length };
}

const t0 = Date.now();
const perSeed = [];
const log = { moves: {} };
for (let seed = 0; seed < SEEDS; seed++) {
  const eff = world(seed);
  const row = { seed };
  for (const policy of ["loop", "random"]) {
    const pop = {};
    const kids = Array.from({ length: CHILDREN }, (_, idx) => runChildRT({ seed, idx, policy, eff, pop, log: policy === "loop" ? log : { moves: {} } }));
    const drs = kids.flatMap((k) => k.drs);
    row[policy] = { DRS: r3(mean(drs)), repaired_now: r3(mean(kids.flatMap((k) => k.repairedNow))), episodes: drs.length,
      attempts: kids.reduce((a, k) => a + k.attempts, 0), resolved_share: r3(kids.reduce((a, k) => a + k.resolvedRows, 0) / Math.max(1, kids.reduce((a, k) => a + k.attempts, 0))) };
  }
  row.delta = r3(row.loop.DRS - row.random.DRS);
  perSeed.push(row);
  console.log(`seed ${String(seed).padStart(2)} loop DRS ${row.loop.DRS} (now ${row.loop.repaired_now}) · random ${row.random.DRS} (now ${row.random.repaired_now}) · Δ ${row.delta}`);
}
const deltas = perSeed.map((x) => x.delta);
const wins = deltas.filter((d) => d > 0).length, losses = deltas.filter((d) => d < 0).length;
// two-sided sign test on wins vs losses (ties dropped)
const n = wins + losses;
const binom = (k, nn) => { let c = 1; for (let i = 0; i < k; i++) c = (c * (nn - i)) / (i + 1); return c / 2 ** nn; };
let p = 0; for (let k = 0; k <= n; k++) if (Math.abs(k - n / 2) >= Math.abs(wins - n / 2)) p += binom(k, n);
const sd = Math.sqrt(mean(deltas.map((d) => (d - mean(deltas)) ** 2)) * deltas.length / Math.max(1, deltas.length - 1));
const out = {
  date: new Date().toISOString().slice(0, 10), gate: "RT-M2: the re-teach loop beats random arms on DRS at 20 seeds (BUILD-PLAN §7)",
  label: "simulated · arm efficacies author-set [U] · gates the loop's mechanics (it learns from resolved outcomes), never efficacy",
  seeds: SEEDS, children_per_seed: CHILDREN, days: DAYS,
  loop_DRS: r3(mean(perSeed.map((x) => x.loop.DRS))), random_DRS: r3(mean(perSeed.map((x) => x.random.DRS))),
  mean_delta: r3(mean(deltas)), sd_delta: r3(sd), wins, losses, ties: deltas.length - n, sign_test_p: Math.round(p * 10000) / 10000,
  loop_repaired_now: r3(mean(perSeed.map((x) => x.loop.repaired_now))), random_repaired_now: r3(mean(perSeed.map((x) => x.random.repaired_now))),
  resolved_share: r3(mean(perSeed.map((x) => x.loop.resolved_share))), moves_loop: log.moves,
  pass: mean(deltas) > 0 && wins > losses && p < 0.05, per_seed: perSeed, ms: Date.now() - t0,
};
console.log(`RT-M2 ${out.pass ? "PASS" : "FAIL"}: loop DRS ${out.loop_DRS} vs random ${out.random_DRS} (Δ ${out.mean_delta} ± ${out.sd_delta} sd; ${wins}/${deltas.length} seeds won; sign test p = ${out.sign_test_p}) · moves ${JSON.stringify(log.moves)}`);
const dir = new URL("./results/", import.meta.url);
mkdirSync(dir, { recursive: true });
const file = opt("--out", new URL(`rtm2-${out.date}.json`, dir).pathname);
writeFileSync(file, JSON.stringify(out, null, 1) + "\n");
console.log("wrote", file);
if (!out.pass) process.exitCode = 1;
