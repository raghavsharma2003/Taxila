// Spec bench (RESET-PLAN RS-4 acceptance: "spec bench per archetype (n ≥ 30): strict validity ≥ 95% after repair").
// For each archetype, N planner calls (Azure taxila-fast-bg, JSON mode, schema in the prompt) grounded in a real kit
// slice for one of the archetype's tagged topics. Measures, per archetype: raw JSON ok, raw strict-schema valid (before
// any repair), usable after repair (not the reviewed default), fallback rate, repairs, latency p50/p95, USD.
// Never prints a key; loads .env.local into process.env only. Spend guard: stops at --max-usd (default 4).
//   node src/studio-v2/tools/spec-bench.mjs [--n 30] [--only <archetype>] [--deployment taxila-fast-bg] [--max-usd 4]
import fs from "node:fs";
import path from "node:path";
import { docs, repo } from "./pw.mjs";

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const N = +opt("--n", 30), only = opt("--only", null), deployment = opt("--deployment", "taxila-fast-bg"), maxUsd = +opt("--max-usd", 4), conc = +opt("--conc", 4);
for (const line of fs.readFileSync(path.join(repo, ".env.local"), "utf8").split("\n")) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ""); }
const { chat, usdOf, normUsage } = await import(path.join(repo, "server/azure.js"));
const S = await import(path.join(repo, "shared/studio-spec.ts"));

const kits = {};
for (const f of fs.readdirSync(path.join(repo, "data/kits"))) if (/^c[4-7]-(maths|science|evs)\.json$/.test(f)) for (const t of JSON.parse(fs.readFileSync(path.join(repo, "data/kits", f), "utf8")).topics ?? []) kits[t.topicId] = t;
function kitSlice(topicId) {
  const t = kits[topicId]; if (!t) return { topicId };
  return { topicId, misconceptions: (t.misconceptions ?? []).map((m) => ({ id: m.id, belief: m.belief })), items: (t.items ?? []).slice(0, 8).map((i) => ({ prompt: i.prompt_en, answer: i.answer, kind: i.kind, targets: i.targetsMisconception ?? null })) };
}
function prompt(a, topicId, k) {
  const d = S.ENGINE_SPECS[a], schema = JSON.stringify(S.specJsonSchema(a)), ex = JSON.stringify(d.defaultSpec);
  return [
    { role: "system", content: "You plan Studio pieces for Indian students aged 9-15 (NCERT classes 4-7). Output ONE JSON object: a spec for the named engine. The engine owns physics, truth and feel; you choose items, order, pacing and short labels. Every number must come from the kit slice or be exactly computable. Labels: short, plain, no markup, no emoji, not sentences to be read aloud." },
    { role: "user", content: `ENGINE ${a} (${d.title}, ${d.kind}).\nJSON SCHEMA:\n${schema}\nONE VALID EXAMPLE (a different lesson; do not copy its items):\n${ex.slice(0, 5000)}\nKIT SLICE for this lesson:\n${JSON.stringify(kitSlice(topicId)).slice(0, 3500)}\nRequest #${k}: plan a fresh spec for topic ${topicId}${k % 3 === 0 ? ", aimed at a child who just showed one of the misconceptions above" : k % 3 === 1 ? ", for a confident child: harder" : ""}. Use skills [${JSON.stringify(topicId)}]. Return only the JSON.` },
  ];
}
const benchFile = path.join(docs, "spec-bench.json");
const out = fs.existsSync(benchFile) ? JSON.parse(fs.readFileSync(benchFile, "utf8")) : { archetypes: {} };
let usd = 0;
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };
for (const a of S.ARCHETYPES_V2.filter((x) => !only || x === only)) {
  const topics = S.ENGINE_SPECS[a].outcomes.topics, rows = [];
  let next = 0;
  async function worker() {
    while (next < N && usd < maxUsd) {
      const k = next++, topicId = topics[k % topics.length], t0 = Date.now();
      let r = { k, topicId, ok: false };
      try {
        const res = await chat(deployment, prompt(a, topicId, k), { json: true, maxTokens: 6000, effort: "low", schemaName: "spec" });
        const u = normUsage(res.usage), cost = usdOf(deployment.replace(/-bg$/, ""), u); usd += cost;
        const strict = S.ENGINE_SPECS[a].schema.safeParse(res.json).success;
        const v = S.validateSpec(a, res.json);
        r = { k, topicId, ok: true, ms: Date.now() - t0, strict, usable: !v.fellBack, repairs: v.repairs.length, repairKinds: [...new Set(v.repairs.map((x) => x.split(":")[0]))].slice(0, 6), usd: +cost.toFixed(5), outTokens: u?.out ?? 0 };
      } catch (e) { r = { k, topicId, ok: false, ms: Date.now() - t0, error: String(e.code || e.message).slice(0, 80) }; }
      rows.push(r);
    }
  }
  await Promise.all(Array.from({ length: conc }, worker));
  const ok = rows.filter((r) => r.ok), ms = ok.map((r) => r.ms);
  const summary = { n: rows.length, jsonOk: ok.length, strictRaw: ok.filter((r) => r.strict).length, usableAfterRepair: ok.filter((r) => r.usable).length, fellBack: ok.filter((r) => !r.usable).length,
    validAfterRepair: ok.length, medianRepairs: pct(ok.map((r) => r.repairs), 0.5), p50ms: pct(ms, 0.5), p95ms: pct(ms, 0.95), usd: +ok.reduce((x, r) => x + r.usd, 0).toFixed(4),
    topRepairs: Object.entries(ok.flatMap((r) => r.repairKinds).reduce((m, x) => ((m[x] = (m[x] || 0) + 1), m), {})).sort((x, y) => y[1] - x[1]).slice(0, 5), errors: rows.filter((r) => !r.ok).map((r) => r.error).slice(0, 5) };
  out.archetypes[a] = { summary, rows };
  out.deployment = deployment; out.date = new Date().toISOString(); out.method = "JSON mode, schema + one example + kit slice in prompt, effort low; strictRaw = zod strict schema on the raw output before repair; usable = validateSpec did not fall back to the reviewed default";
  fs.writeFileSync(benchFile, JSON.stringify(out, null, 1));
  console.log(a.padEnd(22), JSON.stringify(summary));
  if (usd >= maxUsd) { console.log("spend guard hit at $" + usd.toFixed(3)); break; }
}
console.log("total usd", usd.toFixed(4));
