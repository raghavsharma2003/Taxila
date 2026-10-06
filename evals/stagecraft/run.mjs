// E-ST1 / E-ST2 / E-ST3 / E-ST6 runner (STAGECRAFT.md §7.2). $0: the simulator only (sim.mjs), the real conductor.
//   node evals/stagecraft/run.mjs [--n 240] [--calibrated] [--quick]
// Writes evals/stagecraft/results/sim-<date>.json and prints the measured table against the §6 targets.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const has = (k) => process.argv.includes(`--${k}`);

async function env() {
  const S = await import("../../shared/studio-spec.ts");
  const { topicPool } = await import("./scripts.mjs");
  const { buildCatalog } = await import("../../server/stagecraft/catalog.js");
  const pool = topicPool(S.ENGINE_SPECS);
  let catalog = buildCatalog(S.ENGINE_SPECS, { w2Topics: pool.w2Topics, w2Kinds: pool.w2Kinds, library: ["slice-at@1", "food-web@1", "area-claim@1"] });
  let engineSpecs = S.ENGINE_SPECS;
  // ship5 p4-content --catalogue: the production admissibility table (server/stagecraft/lesson.js productionCatalog: the base
  // engines plus the checked authored catalogue's games and explainers), keeping the W2 live rows of the same pool
  if (has("catalogue")) {
    const { productionCatalog } = await import("../../server/stagecraft/lesson.js");
    const pc = productionCatalog({ fresh: true });
    catalog = { ...pc, w2Topics: catalog.w2Topics, w2Kinds: catalog.w2Kinds, w2Live: catalog.w2Live, library: catalog.library };
    engineSpecs = Object.fromEntries(Object.entries(pc.rs4).map(([id, a]) => [id, { title: S.ENGINE_SPECS[id]?.title ?? id, outcomes: { topics: a.topics, misconceptions: a.misconceptions, classes: a.classes } }]));
  }
  let cdf = null;
  const stress = arg("stress", null) ? JSON.parse(arg("stress")) : null;
  if (stress?.sampleCalibrated) stress.sampleCdf = JSON.parse(fs.readFileSync(path.join(HERE, "calibration.json"), "utf8"));
  if (has("calibrated") && fs.existsSync(path.join(HERE, "calibration.json"))) cdf = JSON.parse(fs.readFileSync(path.join(HERE, "calibration.json"), "utf8"));
  return { S, pool, catalog, cdf, stress, engineSpecs };
}

// ───────────── worker: one arm over a seed range ─────────────
if (has("worker")) {
  const { S, pool, catalog, cdf, stress, engineSpecs } = await env();
  const { makeLesson } = await import("./scripts.mjs");
  const { simulate } = await import("./sim.mjs");
  const arm = arg("worker"), [a, b] = arg("seeds").split("-").map(Number), flags = arg("flags", "");
  const out = [];
  const cal = { bins: {}, hit: { n: 0, h1: 0, h3: 0, h5: 0 } };
  for (let seed = a; seed <= b; seed++) {
    const L = makeLesson(seed, { pool, forceSafety: flags.includes("safety"), forceStorm: flags.includes("storm") });
    let rows = null;
    const r = simulate(L, arm, { catalog, engineSpecs, cdf, stress, onRows: (x) => { rows = x; } });
    if (arm === "sc_on" && !flags) calibrate(rows, cal);
    out.push({ seed, ...r });
  }
  fs.writeFileSync(arg("out"), JSON.stringify({ lessons: out, cal }));
  process.exit(0);
}

/** E-ST2: pNeed reliability per source (P(the family is served within 90 s | nominated at pNeed)) and hit@k. */
function calibrate(rows, cal) {
  const served = rows.filter((r) => r.kind === "point" && r.servedRung && !r.swap && r.servedRung !== "steer");
  const noms = rows.filter((r) => r.kind === "nominated" && r.source && Number.isFinite(r.pNeed));
  for (const n of noms) {
    const hit = served.some((p) => p.family === n.family && p.at > n.at && p.at <= n.at + 90_000);
    const bin = Math.min(9, Math.floor(n.pNeed * 10));
    const k = `${n.source}|${bin}`;
    cal.bins[k] ??= { n: 0, hit: 0, sumP: 0 };
    cal.bins[k].n++; cal.bins[k].hit += hit ? 1 : 0; cal.bins[k].sumP += n.pNeed;
  }
  for (const p of served) {
    const recent = new Map();
    for (const n of noms) if (n.at <= p.at && n.at > p.at - 60_000) { const w = n.pNeed * Math.pow(0.5, (p.at - n.at) / 20_000); recent.set(n.family, Math.max(recent.get(n.family) ?? 0, w)); }
    const ranked = [...recent.entries()].sort((x, y) => y[1] - x[1]).map((x) => x[0]);
    const i = ranked.indexOf(p.family);
    cal.hit.n++; if (i === 0) cal.hit.h1++; if (i >= 0 && i < 3) cal.hit.h3++; if (i >= 0 && i < 5) cal.hit.h5++;
  }
}

// ───────────── main ─────────────
const N = +arg("n", 240), DATE = new Date().toISOString().slice(0, 10);
const CPU = Math.max(2, Math.min(os.cpus().length, 12));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "stagecraft-"));
function runWorker(arm, a, b, flags = "") {
  const out = path.join(tmp, `${arm.replace(/[^a-z0-9_]/gi, "_").slice(0, 60)}-${a}-${b}-${flags || "x"}.json`);
  return new Promise((res, rej) => {
    const p = spawn(process.execPath, [new URL(import.meta.url).pathname, "--worker", arm, "--seeds", `${a}-${b}`, "--out", out, "--flags", flags, ...(has("calibrated") ? ["--calibrated"] : []), ...(has("catalogue") ? ["--catalogue"] : []), ...(arg("stress") ? ["--stress", arg("stress")] : [])], { stdio: ["ignore", "ignore", "inherit"] });
    p.on("exit", (c) => (c === 0 ? res(JSON.parse(fs.readFileSync(out, "utf8"))) : rej(new Error(`${arm} ${a}-${b} exit ${c}`))));
  });
}
async function runArm(arm, from, to, flags = "") {
  const chunk = Math.ceil((to - from + 1) / CPU);
  const jobs = [];
  for (let a = from; a <= to; a += chunk) jobs.push([a, Math.min(to, a + chunk - 1)]);
  const parts = [];
  // a small pool so several arms can share the CPUs
  for (let i = 0; i < jobs.length; i += CPU) parts.push(...(await Promise.all(jobs.slice(i, i + CPU).map(([a, b]) => runWorker(arm, a, b, flags)))));
  const lessons = parts.flatMap((p) => p.lessons).sort((x, y) => x.seed - y.seed);
  const cal = { bins: {}, hit: { n: 0, h1: 0, h3: 0, h5: 0 } };
  for (const p of parts) { for (const [k, v] of Object.entries(p.cal.bins)) { cal.bins[k] ??= { n: 0, hit: 0, sumP: 0 }; cal.bins[k].n += v.n; cal.bins[k].hit += v.hit; cal.bins[k].sumP += v.sumP; } for (const k of ["n", "h1", "h3", "h5"]) cal.hit[k] += p.cal.hit[k]; }
  return { lessons, cal };
}

const { foldArm } = await import("../../server/stagecraft/telemetry.js");
const t0 = Date.now();
const ARMS = arg("arms", "w2,sc_off,sc_on,sc_on_k1").split(",");
const res = {};
for (const arm of ARMS) { res[arm] = await runArm(arm, 1, N); console.error(`${arm}: ${res[arm].lessons.length} lessons (${((Date.now() - t0) / 1000).toFixed(0)} s)`); }

// lossless shadow: the policy's want stream must be identical with speculation off and on
let agree = 0, total = 0, lessonsIdentical = 0;
if (res.sc_off && res.sc_on) {
  for (let i = 0; i < res.sc_on.lessons.length; i++) {
    const a = res.sc_off.lessons[i].wants, b = res.sc_on.lessons[i].wants;
    const n = Math.max(a.length, b.length);
    let same = 0;
    for (let j = 0; j < n; j++) if (a[j] !== undefined && a[j] === b[j]) same++;
    agree += same; total += n; if (same === n) lessonsIdentical++;
  }
}
// E-ST6 safety battery + 429 storms (sc_on), E-ST3 sweeps (sc_on variants on the first 80 seeds)
const safety = has("quick") ? null : await runArm("sc_on", 10001, 10080, "safety");
const storm = has("quick") ? null : await runArm("sc_on", 20001, 20060, "storm");
const SWEEPS = has("quick") ? [] : [
  ["maxFamilies=4", { maxFamilies: 4 }], ["lambda=25", { lambdaPerUsd: 25 }], ["lambda=100", { lambdaPerUsd: 100 }],
  ["minPReadySpec=0.4", { minPReadySpec: 0.4 }], ["spec.concurrent=2", { tiers: { spec: { concurrent: 2 } } }], ["halfLife=10s", { halfLifeMs: 10_000 }],
  ["spec.maxLead=45s", { tiers: { spec: { maxLeadMs: 45_000 } } }], ["spec.maxLead=180s", { tiers: { spec: { maxLeadMs: 180_000 } } }],
];
const sweeps = {};
for (const [name, cfg] of SWEEPS) sweeps[name] = foldArm((await runArm(`sweep:${JSON.stringify(cfg)}`, 1, 80)).lessons);
if (SWEEPS.length) sweeps["baseline(sc_on, seeds 1-80)"] = foldArm(res.sc_on.lessons.slice(0, 80));

const cards = Object.fromEntries(Object.entries(res).map(([k, v]) => [k, foldArm(v.lessons)]));
const cal = res.sc_on?.cal;
const reliability = cal ? Object.entries(cal.bins).map(([k, v]) => { const [source, bin] = k.split("|"); return { source, bin: +bin, n: v.n, meanP: +(v.sumP / v.n).toFixed(3), observed: +(v.hit / v.n).toFixed(3) }; }).sort((a, b) => a.source.localeCompare(b.source) || a.bin - b.bin) : [];
const ece = (src) => { const r = reliability.filter((x) => x.source === src); const n = r.reduce((a, x) => a + x.n, 0); return n ? +(r.reduce((a, x) => a + x.n * Math.abs(x.meanP - x.observed), 0) / n).toFixed(3) : null; };
const out = {
  date: DATE, n: N, calibrated: has("calibrated"), method: "evals/stagecraft/sim.mjs: virtual-clock replay of scripted lessons (scripts.mjs, classes 4-7 maths/science, real kit topic and misconception ids) through server/stagecraft/conductor.js step() and policy.js wantAt(); build times lognormal from config.js BUILD_MS (RS-4 spec bench n=30/archetype, router bench n=30/archetype, flare 15.1 s)" + (has("calibrated") ? " recalibrated by calibration.json (E-ST4)" : ""),
  arms: cards,
  lossless: { pointsCompared: total, agree, rate: total ? +(agree / total).toFixed(4) : null, lessonsIdentical, lessons: res.sc_on?.lessons.length ?? 0 },
  calibration: { reliability, ece: Object.fromEntries(["plan_lookahead", "partial_intent", "child_request", "child_signal", "board_state"].map((s) => [s, ece(s)])), hitAtK: cal ? { n: cal.hit.n, h1: +(cal.hit.h1 / cal.hit.n).toFixed(3), h3: +(cal.hit.h3 / cal.hit.n).toFixed(3), h5: +(cal.hit.h5 / cal.hit.n).toFixed(3) } : null },
  safetyBattery: safety ? { lessons: safety.lessons.length, turnsInQuarantine: null, ...pick(foldArm(safety.lessons), ["safetyTurnReveals", "visibleFailures", "staleReveals", "wrongReveals", "readyWhenNeededRate"]), buildsDuringSafety: safety.lessons.reduce((a, l) => a + l.buildsDuringSafety, 0), safetyLessons: safety.lessons.length } : null,
  stormBattery: storm ? { lessons: storm.lessons.length, ...pick(foldArm(storm.lessons), ["visibleFailures", "readyWhenNeededRate", "quota429", "failovers", "staleReveals"]) } : null,
  sweeps,
  seconds: Math.round((Date.now() - t0) / 1000),
};
function pick(o, ks) { return Object.fromEntries(ks.map((k) => [k, o[k]])); }
fs.mkdirSync(path.join(HERE, "results"), { recursive: true });
const file = path.join(HERE, "results", `sim-${DATE}${has("calibrated") ? "-calibrated" : ""}${arg("tag") ? "-" + arg("tag") : ""}.json`);
fs.writeFileSync(file, JSON.stringify(out, null, 1));
fs.rmSync(tmp, { recursive: true, force: true });

const f = (x, d = 2) => (x == null ? "—" : typeof x === "number" ? x.toFixed(d) : String(x));
const row = (name, key, fmt = (c) => f(c[key])) => console.log(`| ${name} | ${ARMS.map((a) => fmt(cards[a])).join(" | ")} |`);
console.log(`\n${file}\n`);
console.log(`| metric | ${ARMS.join(" | ")} |`);
console.log(`|---|${ARMS.map(() => "---").join("|")}|`);
row("lessons / served points", null, (c) => `${c.lessons} / ${c.points}`);
row("right artifact ready when needed", "readyWhenNeededRate");
row("  an on-topic checked piece ready (not the board)", "pieceReadyRate");
for (const t of ["plan_lookahead", "child_request", "partial_intent", "child_signal", "board_state"]) row(`  ready: ${t}`, null, (c) => { const x = c.readyWhenNeededByTrigger[t]; return x ? `${f(x.rate)} (n ${x.n})` : "—"; });
row("request → first frame p50 / p95 (ms)", null, (c) => `${f(c.requestToFirstFrameMs.p50, 0)} / ${f(c.requestToFirstFrameMs.p95, 0)} (n ${c.requestToFirstFrameMs.n})`);
row("spec time-to-ready p50 / p90 (ms)", null, (c) => `${f(c.timeToReadyMs.spec.p50, 0)} / ${f(c.timeToReadyMs.spec.p90, 0)}`);
row("live time-to-ready p50 / p90 (ms)", null, (c) => `${f(c.timeToReadyMs.live.p50, 0)} / ${f(c.timeToReadyMs.live.p90, 0)} (n ${c.timeToReadyMs.live.n})`);
row("speculative $ / lesson-hour (wasted)", null, (c) => `${f(c.usdPerLessonHour.total, 4)} (${f(c.usdPerLessonHour.wasted, 4)})`);
row("wasted spec builds / lesson-hour", null, (c) => f(c.wastedBuildsPerLessonHour.spec, 1));
row("stale-stage turns (old-topic piece left up)", "staleStageTurns", (c) => f(c.staleStageTurns, 0));
row("wrong / stale / safety / child-speaking reveals", null, (c) => `${c.wrongReveals} / ${c.staleReveals} / ${c.safetyTurnReveals} / ${c.revealsWhileChildSpeaks}`);
row("off-topic reveals / visible failures", null, (c) => `${c.offTopicReveals} / ${c.visibleFailures}`);
row("generated pieces / 25 min", "generatedRevealsPer25", (c) => f(c.generatedRevealsPer25, 1));
row("stage moments / 25 min", "stageMomentsPer25", (c) => f(c.stageMomentsPer25, 1));
row("specs built / 25 min", "specsLaunchedPer25", (c) => f(c.specsLaunchedPer25, 1));
row("stage active share", "stageActiveShare");
row("median gap between pieces (s)", null, (c) => f((c.medianGapBetweenPiecesMs ?? 0) / 1000, 0));
row("child-initiated share", "childInitiatedShare");
row("3-min windows with a visual (flow-exempt)", null, (c) => (c.visualWindowCoverage == null ? "—" : `${f(c.visualWindowCoverage, 3)} (n ${c.visualWindows}, exempt ${c.visualWindowsFlowExempt})`));
row("rest retires", "restRetires", (c) => f(c.restRetires, 0));
row("live whiteboards / 25 min (modelled, sc_rest)", "whiteboardsPer25", (c) => f(c.whiteboardsPer25, 1));
console.log(`\nlossless (sc_off vs sc_on want stream): ${out.lossless.agree}/${out.lossless.pointsCompared} = ${out.lossless.rate}; identical lessons ${out.lossless.lessonsIdentical}/${out.lossless.lessons}`);
if (out.calibration.hitAtK) console.log(`E-ST2 hit@1/3/5: ${out.calibration.hitAtK.h1} / ${out.calibration.hitAtK.h3} / ${out.calibration.hitAtK.h5} (n ${out.calibration.hitAtK.n}); ECE ${JSON.stringify(out.calibration.ece)}`);
if (out.safetyBattery) console.log(`E-ST6 safety battery: ${JSON.stringify(out.safetyBattery)}`);
if (out.stormBattery) console.log(`429 storm battery: ${JSON.stringify(out.stormBattery)}`);
for (const [k, v] of Object.entries(sweeps)) console.log(`E-ST3 ${k}: ready ${f(v.readyWhenNeededRate)} spec$/h ${f(v.usdPerLessonHour.total, 4)} wasted ${f(v.usdPerLessonHour.wasted, 4)} gen/25 ${f(v.generatedRevealsPer25, 1)}`);
console.log(`(${out.seconds} s)`);
