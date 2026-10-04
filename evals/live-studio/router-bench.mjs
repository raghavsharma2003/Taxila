// The Studio router bench (LIVE-STUDIO S10 bench half, §6, §8; BUILD-PLAN W2-F #4). Runs the SERVER code path
// (server/studio/build.js buildRace: stream guard → fixers → gate → ≤ 2 repairs, the race of the routed arms) over
// every frame archetype with fixed truth + strings (evals/live-studio/goldens/goldens.json, params and alt params
// alternating, so a build that hard-codes values fails), and publishes per archetype: first-try pass, pass after
// repair, P(pass by lead), time to playable p50 / p90, $ per passed build, with 80% Wilson intervals. Never means of
// check pass rates.
//
//   --mode race   (default) the production race; P(pass by lead) is the ship metric
//   --mode arms   each arm alone (uncensored per-arm rates: the input for re-ordering arms)
//   --write       rewrite server/studio/routes.json: an archetype becomes live only at P(pass by lead) ≥ 0.95 with
//                 n ≥ 30; arms re-order only when 80% Wilson intervals do not overlap (cost breaks ties); and drop a
//                 row per archetype into context/inbox/w2-f-router-bench.json
//
// Usage: STUDIO_QA_LOCAL=1 NODE_USE_ENV_PROXY=1 node evals/live-studio/router-bench.mjs [--n 10] [--archetypes a,b] [--conc 4] [--mode race] [--write]
// Spend: ≈ $0.05-0.25 per race (LIVE-STUDIO §7). n = 10 weekly, n = 30 on a new archetype.
import fs from "node:fs";
import path from "node:path";
import { loadEnv } from "./models.mjs";
loadEnv();
process.env.STUDIO_QA_LOCAL = process.env.STUDIO_QA_LOCAL ?? "1";
const { buildRace } = await import("../../server/studio/build.js");
const { routeFor, loadRoutes, _setRoutes } = await import("../../server/studio/router.js");
const { localGate } = await import("../../server/studio/qa/pool.js");
const { archetype, FRAME_ARCHETYPES } = await import("../../server/studio/archetypes/index.js");
const { setSink } = await import("../../server/studio/telemetry.js");

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.join(HERE, "../..");
const N = +arg("n", 3), CONC = +arg("conc", 4), MODE = arg("mode", "race");
const ids = arg("archetypes", FRAME_ARCHETYPES.join(",")).split(",");
const OUT = path.join(HERE, arg("out", `out-router-bench-${new Date().toISOString().slice(0, 10)}`));
fs.mkdirSync(OUT, { recursive: true });
const G = JSON.parse(fs.readFileSync(path.join(HERE, "goldens/goldens.json"), "utf8"));
setSink(() => {});

const gate = localGate({ concurrency: Math.max(2, CONC) });
const keepAlive = setInterval(() => {}, 1000);     // server/lanes.js parks background calls on an unref'd timer

/** 80% Wilson interval for k of n. */
export function wilson(k, n, z = 1.2816) {
  if (!n) return [0, 1];
  const p = k / n, d = 1 + (z * z) / n, c = p + (z * z) / (2 * n), m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [+((c - m) / d).toFixed(3), +((c + m) / d).toFixed(3)];
}
const q = (xs, p) => { const s = xs.slice().sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };

const jobs = [];
for (const id of ids) {
  const g = G[id]; if (!g) { console.log(`no golden truth for ${id}, skipped`); continue; }
  const route = routeFor(id);
  const armSets = MODE === "arms" ? route.arms.map((arm) => ({ label: arm.name, route: { ...route, arms: [{ ...arm, opportunistic: false }], race: 1 } })) : [{ label: "race", route }];
  for (const set of armSets) for (let s = 0; s < N; s++) jobs.push({ id, s, set, which: s % 2 && g.alt ? "alt" : "params" });
}
console.log(`${jobs.length} ${MODE} jobs over ${ids.length} archetypes`);
const resultsFile = path.join(OUT, `results-${MODE}.json`);
const rows = fs.existsSync(resultsFile) ? JSON.parse(fs.readFileSync(resultsFile, "utf8")) : [];
const done = new Set(rows.map((r) => r.key));
let next = 0;
await Promise.all(Array.from({ length: CONC }, async () => {
  while (next < jobs.length) {
    const j = jobs[next++];
    const key = `${j.id}|${j.set.label}|${j.s}`;
    if (done.has(key)) continue;
    const g = G[j.id];
    const plan = { planId: `bench:${key}`, intentId: `bench:${key}`, archetype: j.id, kind: archetype(j.id).kind, skeleton: archetype(j.id).skeleton,
      params: g[j.which], strings: g[`${j.which}Strings`] ?? g.strings, craft: { mood: "warm", motion: "lively" }, teacherCue: "", seam: {}, checks: [], budgets: { bytes: 60000, ms: 90000 } };
    const firstPaint = [];
    let res;
    try {
      res = await buildRace(plan, { route: j.set.route, band: g.band ?? "B3", gate: (job) => gate.gate(job), deadlineMs: 240_000, opportunistic: MODE === "race", keepHtml: true,
        onPartial: () => {}, onStatus: () => {} });
    } catch (e) { res = { ok: false, records: [], ms: 0, usd: 0, reason: String(e?.message ?? e).slice(0, 100) }; }
    const recs = res.records;
    const passFirst = recs.some((r) => r.gate.pass && r.timings.repairs === 0);
    const row = { key, archetype: j.id, set: j.set.label, which: j.which, ok: res.ok, passFirst, ms: res.ms, usd: res.usd, reason: res.reason,
      winner: res.winner?.arm ?? null, toPlayableMs: res.ok ? res.winner.record?.timings.toPlayableMs ?? res.ms : null,
      arms: recs.map((r) => ({ arm: r.arm, pass: r.gate.pass, repairs: r.timings.repairs, ttftMs: r.timings.ttftMs, firstPaintMs: r.timings.firstPaintMs ?? null, genMs: r.timings.genMs, qaMs: r.timings.qaMs, usd: r.usd,
        failed: r.gate.checks.filter((c) => !c.pass).map((c) => c.id), fixes: r.fixes, error: r.error })) };
    if (res.ok) fs.writeFileSync(path.join(OUT, `${key.replace(/\|/g, "__")}.html`), res.winner.html);
    for (const r of recs) if (r.html && !r.gate.pass) fs.writeFileSync(path.join(OUT, `${key.replace(/\|/g, "__")}__${r.arm}__fail.html`), r.html);
    rows.push(row);
    fs.writeFileSync(resultsFile, JSON.stringify(rows, null, 1));
    console.log(`${key} ${res.ok ? `PASS by ${row.winner}${passFirst ? " (first try)" : ""}` : `FAIL ${res.reason}`} ${res.ms} ms $${res.usd} ${row.arms.map((a) => `${a.arm}:${a.pass ? "ok" : a.failed.slice(0, 3).join("+") || a.error}`).join(" ")}`);
    void firstPaint;
  }
}));
await gate.close();
clearInterval(keepAlive);

// ───────────────────────────── the table ─────────────────────────────
const table = [];
for (const id of ids) for (const label of [...new Set(rows.filter((r) => r.archetype === id).map((r) => r.set))]) {
  const r = rows.filter((x) => x.archetype === id && x.set === label);
  const route = routeFor(id);
  const lead = route.leadMs ?? 90_000;
  const passed = r.filter((x) => x.ok), byLead = passed.filter((x) => x.toPlayableMs <= lead);
  const failChecks = {};
  for (const x of r) for (const a of x.arms) for (const f of a.failed) failChecks[f] = (failChecks[f] ?? 0) + 1;
  table.push({ archetype: id, set: label, n: r.length, passFirst: r.filter((x) => x.passFirst).length, passFinal: passed.length, passByLead: byLead.length,
    pByLead: +(byLead.length / Math.max(1, r.length)).toFixed(3), wilson80: wilson(byLead.length, r.length),
    p50ms: q(passed.map((x) => x.toPlayableMs), 0.5), p90ms: q(passed.map((x) => x.toPlayableMs), 0.9),
    usdPerPassed: passed.length ? +(r.reduce((s, x) => s + x.usd, 0) / passed.length).toFixed(4) : null,
    topFails: Object.entries(failChecks).sort((a, b) => b[1] - a[1]).slice(0, 5) });
}
fs.writeFileSync(path.join(OUT, `table-${MODE}.json`), JSON.stringify(table, null, 1));
console.table(table.map((t) => ({ ...t, wilson80: t.wilson80.join("-"), topFails: t.topFails.map(([k, v]) => `${k}:${v}`).join(" ") })));

if (process.argv.includes("--write") && MODE === "race") {
  const routes = loadRoutes(true);
  const inbox = [];
  for (const t of table) {
    const r = routes.archetypes[t.archetype] ?? (routes.archetypes[t.archetype] = { ...routes.defaults });
    const live = t.n >= 30 && t.pByLead >= 0.95 && archetype(t.archetype).pictureTruth !== "human_review";
    r.live = live;
    if (t.p90ms) r.leadMs = Math.max(30_000, Math.round(t.p90ms * 1.1));
    r.bench = { date: new Date().toISOString().slice(0, 10), n: t.n, passFirst: t.passFirst, passFinal: t.passFinal, pByLead: t.pByLead, wilson80: t.wilson80, p50ms: t.p50ms, p90ms: t.p90ms, usdPerPassed: t.usdPerPassed };
    if (t.usdPerPassed) r.estUsd = t.usdPerPassed;
    inbox.push({ id: `studio-bench-${t.archetype}-${r.bench.date}`, type: "measurement", date: r.bench.date,
      text: `Router bench (${MODE}, server code path) ${t.archetype}: ${t.passByLead}/${t.n} passed by the ${Math.round((r.leadMs ?? 90000) / 1000)} s lead (80% Wilson ${t.wilson80.join("-")}), first try ${t.passFirst}/${t.n}, after repair ${t.passFinal}/${t.n}, time to playable p50 ${t.p50ms} ms / p90 ${t.p90ms} ms, $${t.usdPerPassed} per passed build; live=${live}.` });
  }
  _setRoutes(routes);
  fs.writeFileSync(path.join(ROOT, "server/studio/routes.json"), JSON.stringify(routes, null, 1));
  fs.writeFileSync(path.join(ROOT, "context/inbox/w2-f-router-bench.json"), JSON.stringify(inbox, null, 1));
  console.log("routes.json and context/inbox/w2-f-router-bench.json written");
}
