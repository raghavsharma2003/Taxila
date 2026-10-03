// Forge G1 measurement (FACTORY.md §12 M-G1 rows; the workstream exit): end-to-end requestFill latency (p50/p95) and
// the G1 gate pass rate on real kit items across maths, science (EVS for classes 4-5) and English, classes 4-7, on the
// real Azure deployment (taxila-fast flavour pick), real Neon asset_cache and real Blob (taxilaforge/forge); then the
// headless render + solution replay of every T1 fill in the production frame (dist/), Content Safety over the strings
// table, and G1 coverage over every item of those kits.
// Run: node --env-file=.env.local evals/forge-g1.mjs [--n-per-subject 10] [--seed 3] [--fresh]   (needs NODE_USE_ENV_PROXY=1 here)
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const PER = +arg("--n-per-subject", 9); const SEED = +arg("--seed", 3);
const ROOT = new URL("../", import.meta.url);
const OUT = new URL(`evals/results/forge-g1-${new Date().toISOString().slice(0, 10)}.json`, ROOT);

const { requestFill } = await import("../server/forge/index.js");
const { diagnosticItems, activitiesFor } = await import("../server/forge/derive.js");
const { getKit } = await import("../server/content/index.js");
const { _memClear, flushWrites } = await import("../server/forge/cache.js");
const { learnerView } = await import("../server/forge/learner-view.js");
const { renderCheck } = await import("../server/forge/render-check.mjs");
const { HOOK_BY_ID, TEMPLATE_STRINGS } = await import("../server/forge/strings.js");
const { rng } = await import("../server/forge/kitmath.js");

const R_ALL = new Set(["fraction-bars@1", "scene@1"]);
const pct = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)] : null; };
const rand = rng(SEED);
const shuffle = (a) => a.map((x) => [rand(), x]).sort((p, q) => p[0] - q[0]).map((x) => x[1]);
const subjectOf = (f) => (/maths/.test(f) ? "maths" : /english/.test(f) ? "english" : "science");

// ── 1. pick items: real kit items (and the kit's diagnostics) that have a derivable activity, stratified ──
const files = readdirSync(new URL("data/kits/", ROOT)).filter((f) => /^c[4-7]-(maths|science|evs|english)\.json$/.test(f)).sort();
const pool = { maths: [], science: [], english: [] };
const coverage = { maths: { items: 0, any: 0, liveToday: 0 }, science: { items: 0, any: 0, liveToday: 0 }, english: { items: 0, any: 0, liveToday: 0 } };
for (const f of files) {
  const subject = subjectOf(f); const classLevel = +f[1];
  for (const t of JSON.parse(readFileSync(new URL(`data/kits/${f}`, ROOT), "utf8")).topics) {
    const kit = await getKit(t.topicId, { generate: false }); if (!kit) continue;
    for (const item of [...kit.items, ...diagnosticItems(kit)]) {
      const acts = activitiesFor(item, kit).activities;
      coverage[subject].items++;
      if (acts.length) coverage[subject].any++;
      if (acts.some((a) => a.renderer === "fraction-bars@1")) coverage[subject].liveToday++;
      if (acts.length) pool[subject].push({ kit, item, classLevel, kinds: acts.map((a) => a.template ?? a.renderer) });
    }
  }
}
// Stratify: maths takes every T1-capable class first so the engine path is measured, then diagnostics.
const picks = [];
for (const subject of ["maths", "science", "english"]) {
  const byClass = {};
  for (const p of shuffle(pool[subject])) (byClass[p.classLevel] ??= []).push(p);
  const order = subject === "maths" ? (p) => (p.kinds.includes("fraction-bars@1") ? 0 : 1) : () => 0;
  for (const c of Object.keys(byClass)) byClass[c].sort((a, b) => order(a) - order(b));
  const classes = Object.keys(byClass).sort();
  if (subject === "maths") {   // the T1 engine path first: up to half the maths picks, spread over classes
    const t1 = shuffle(pool.maths.filter((p) => p.kinds.includes("fraction-bars@1")));
    for (const c of classes) { const p = t1.find((x) => x.classLevel === +c && !picks.includes(x)); if (p && picks.length < Math.ceil(PER / 2)) { picks.push({ ...p, subject }); byClass[c] = byClass[c].filter((x) => x !== p); } }
    for (const p of t1) if (picks.filter((x) => x.subject === "maths").length < Math.ceil(PER / 2) && !picks.some((x) => x.item === p.item)) { picks.push({ ...p, subject }); byClass[p.classLevel] = byClass[p.classLevel].filter((x) => x !== p); }
  }
  for (let i = 0; picks.filter((p) => p.subject === subject).length < PER && i < 50; i++) {
    const c = classes[i % classes.length]; const p = byClass[c].shift(); if (p) picks.push({ ...p, subject });
  }
}

// ── 2. cold → db → memory, on the real stack ──
// "cold" must be a real miss: drop earlier g1_fill rows (all written by Forge G1 itself; child-free cache rows).
if (process.argv.includes("--fresh")) { const { q } = await import("../server/db.js"); const r = await q("delete from asset_cache where kind = 'g1_fill' returning key"); console.log(`fresh: dropped ${r.length} g1_fill rows`); }
const interestsBySubject = { maths: ["cricket", "cooking"], science: ["space", "animals"], english: ["trains", "films"] };
const runs = [];
const lv = [];
for (let i = 0; i < 5; i++) { const t0 = performance.now(); await learnerView(randomUUID(), "c6-maths-ch07-t05"); lv.push(Math.round(performance.now() - t0)); }
for (const pass of ["cold", "db", "memory"]) {
  if (pass === "db") { await flushWrites(); _memClear(); }
  for (const p of picks) {
    const learner = { child: { firstName: "Asha", classLevel: p.classLevel, languagePref: "hinglish", interests: interestsBySubject[p.subject] }, recentWrong: [], activeMisconceptions: [], pKnown: {} };
    const r = await requestFill({ kit: p.kit, item: p.item, move: "practice", learner, renderers: R_ALL, needByMs: 10_000 });
    runs.push({ pass, subject: p.subject, classLevel: p.classLevel, itemId: p.item.id, status: r.status, tier: r.tier ?? null, template: r.template ?? r.renderer ?? null,
      cached: r.cached ?? null, ms: r.timings?.total ?? null, timings: r.timings, flavour: r.flavour ?? null,
      firstTryPass: r.status === "ready" && !(r.rejectedBeforeShip?.length), rejected: r.rejectedBeforeShip ?? r.gateFailures ?? [],
      fillKey: r.fillKey ?? null, renderer: r.renderer ?? null, payload: r.command?.params ?? null, grade: r.grade ?? null });
    console.log(pass, p.subject, p.item.id, r.status, r.template ?? r.renderer ?? "", r.timings?.total, "ms", r.flavour?.by ?? "", r.cached ?? "");
  }
}
await flushWrites();

// ── 3. headless render + solution replay of every T1 fill (production frame bytes) ──
const t1 = runs.filter((r) => r.pass === "cold" && r.renderer === "fraction-bars@1");
const render = t1.length ? await renderCheck(t1.map((r) => ({ fillKey: r.fillKey, renderer: r.renderer, payload: r.payload, grade: r.grade, itemId: r.itemId })), { dist: new URL("dist", ROOT).pathname }) : [];

// ── 4. Blob: the cached render payload is publicly readable ──
const { getFill } = await import("../server/forge/cache.js");
_memClear();
const anyKey = runs.find((r) => r.pass === "cold" && r.status === "ready")?.fillKey;
const hit = anyKey ? await getFill(anyKey) : null;
let blob = null;
if (hit?.body?.blobUrl) { const t0 = performance.now(); const res = await fetch(hit.body.blobUrl); blob = { url: hit.body.blobUrl.replace(/[0-9a-f]{64}/, "<sha256>"), status: res.status, ms: Math.round(performance.now() - t0), cacheControl: res.headers.get("cache-control"), bytes: (await res.arrayBuffer()).byteLength }; }

// ── 5. Content Safety over the strings table (the offline clearance of every non-kit string a fill can show) ──
async function contentSafety(text) {
  const host = (process.env.AZURE_OPENAI_ENDPOINT || "").replace(/(https:\/\/[^/]+).*/, "$1");
  const res = await fetch(`${host}/contentsafety/text:analyze?api-version=2024-09-01`, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": process.env.AZURE_OPENAI_API_KEY, "content-type": "application/json" }, body: JSON.stringify({ text, outputType: "FourSeverityLevels" }) });
  if (!res.ok) return { error: res.status };
  return (await res.json()).categoriesAnalysis.reduce((m, c) => Math.max(m, c.severity), 0);
}
const rows = [...Object.values(HOOK_BY_ID), ...TEMPLATE_STRINGS].flatMap((h) => [h.en, h.hi, h.hi_latn]);
const cs = { rows: rows.length, maxSeverity: 0, flagged: [], errors: 0 };
for (const s of [...new Set(rows)]) { const v = await contentSafety(s); if (typeof v !== "number") cs.errors++; else { cs.maxSeverity = Math.max(cs.maxSeverity, v); if (v >= 2) cs.flagged.push(s); } }

// ── summary ──
const cold = runs.filter((r) => r.pass === "cold");
const sumReady = (rs) => { const ok = rs.filter((r) => r.status === "ready"); return { n: ok.length, p50: pct(ok.map((r) => r.ms), 50), p95: pct(ok.map((r) => r.ms), 95), max: Math.max(...ok.map((r) => r.ms)) }; };
const sum = (rs) => ({ n: rs.length, ready: rs.filter((r) => r.status === "ready").length, firstTryPass: rs.filter((r) => r.firstTryPass).length,
  p50: pct(rs.map((r) => r.ms), 50), p95: pct(rs.map((r) => r.ms), 95), max: Math.max(...rs.map((r) => r.ms)) });
const summary = {
  at: new Date().toISOString(), seed: SEED, perSubject: PER, model: process.env.DEPLOY_FAST || "taxila-fast", host: "dev container (US build container; no India RTT)",
  cold: { all: sum(cold), maths: sum(cold.filter((r) => r.subject === "maths")), science: sum(cold.filter((r) => r.subject === "science")), english: sum(cold.filter((r) => r.subject === "english")) },
  dbHit: sumReady(runs.filter((r) => r.pass === "db")), memoryHit: sumReady(runs.filter((r) => r.pass === "memory")),
  gapRepeat: sumReady(runs.filter((r) => r.pass !== "cold" && r.status === "gap").map((r) => ({ ...r, status: "ready" }))),
  flavour: { model: cold.filter((r) => r.flavour?.by === "model").length, code: cold.filter((r) => r.flavour?.by === "code").length, modelRejectedByGate: cold.filter((r) => r.flavour?.modelRejected).length,
    p50: pct(cold.map((r) => r.timings?.model ?? 0), 50), p95: pct(cold.map((r) => r.timings?.model ?? 0), 95) },
  gateMs: { p50: pct(cold.map((r) => r.timings?.gate ?? 0), 50), max: Math.max(...cold.map((r) => r.timings?.gate ?? 0)) },
  learnerViewMs: lv, templates: Object.fromEntries([...new Set(cold.map((r) => r.template))].map((t) => [t, cold.filter((r) => r.template === t).length])),
  rejections: cold.flatMap((r) => r.rejected.map((x) => ({ itemId: r.itemId, ...x }))),
  render: { n: render.length, ok: render.filter((r) => r.ok).length, bootMs: render.map((r) => r.bootMs), failures: render.filter((r) => !r.ok) },
  blob, contentSafety: cs, coverage,
};
mkdirSync(new URL("evals/results/", ROOT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ summary, runs: runs.map(({ payload, grade, ...r }) => r) }, null, 1));
console.log(JSON.stringify(summary, null, 1));
process.exit(0);
