#!/usr/bin/env node
// Approval lane, step 1 (docs/design/round7/studio/APPROVAL-LANE.md): the Foundry spec call — the lane's ONLY paid step,
// run by main (stream sessions hold no Azure key). One candidate spec per topic, aimed at one named mix-up of its kit, made
// by Stagecraft's own generatedSpec builder (the same prompt, validators and checks as the live rung), at most 2 attempts a
// topic, under a hard USD cap.
//
//   node --env-file=.env.local scripts/approve-generate.mjs --topics c4-maths-ch05-t01,c5-maths-ch02-t01,c5-maths-ch02-t02,c6-maths-ch06-t01 --out data/studio-approved/candidates [--usd 0.25] [--dry] [--keep-refused]
//
// Writes <out>/<topicId>.candidate.json (the target, the spec, its checks) and <out>/manifest.json (each call's deployment,
// tokens, cost and outcome; the total). Reads the key only from the process env (server/azure.js); prints no secret and no
// request header. --dry: the plan and each prompt's size, no call, no key needed. Everything after (predicate checks, the
// render, the judge, the store) runs on these files with no key: scripts/approve-check.mjs.
import fs from "node:fs";
import path from "node:path";
import { PILOT_TARGETS, beatFor, specHash } from "../server/studio/approved.js";
import { specPrompt, createBuilders } from "../server/stagecraft/builders.js";
import { kindOf } from "../server/stagecraft/catalogue.js";
import { validateAny } from "../shared/studio-spec-ext/index.ts";

const arg = (k, d = null) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const DRY = process.argv.includes("--dry");
// --keep-refused: a refused attempt's spec as the model returned it, why it was refused and what the engine's repair dropped,
// beside the candidates as <topic>.refused-<attempt>.json (main, 2026-11-10: c5-t02 fell back twice and nothing said why)
const KEEP_REFUSED = process.argv.includes("--keep-refused");
const OUT = path.resolve(arg("--out", "data/studio-approved/candidates"));
const CAP = Number(arg("--usd", "0.25"));
const MAX_ATTEMPTS = 2;
/** A spec call's worst case before it is made (6000 output tokens on taxila-fast pricing is far below this); the cap is checked
 *  against spent + this, so the cap holds even if one call costs its worst. */
const WORST_CALL_USD = 0.02;
const topics = String(arg("--topics", PILOT_TARGETS.map((t) => t.topicId).join(","))).split(",").map((s) => s.trim()).filter(Boolean);
const targets = topics.map((t) => {
  const x = PILOT_TARGETS.find((p) => p.topicId === t);
  if (!x) throw new Error(`no approval target for ${t} (server/studio/approved.js PILOT_TARGETS)`);
  return { ...x, ...(beatFor(x.topicId, x.misconceptionId) ?? {}) };
});
if (!Number.isFinite(CAP) || CAP <= 0) throw new Error("--usd must be a positive number");

const key = (t) => ({ topicId: t.topicId, band: "B3", lang: "hinglish", misconceptionId: t.misconceptionId });
const cand = (t) => ({ id: `approve:${t.topicId}`, archetype: t.archetype, kind: kindOf(t.archetype), need: "contrast_misconception", premise: { misconceptionId: t.misconceptionId, ...(t.how ? { how: t.how } : {}) } });

console.log(`approval lane — generate: ${targets.length} topics, ≤ ${MAX_ATTEMPTS} attempts each, cap $${CAP.toFixed(2)}${DRY ? " (dry: no call)" : ""}`);
for (const t of targets) {
  const msgs = specPrompt(cand(t), key(t));
  console.log(`  ${t.topicId}  ${t.archetype}  aimed at ${t.misconceptionId}  beat ${t.beat ?? "-"} (${t.when ?? "-"})  prompt ${msgs.reduce((n, m) => n + m.content.length, 0)} chars`);
}
if (DRY) process.exit(0);

const [{ chat, usdOf, normUsage }, { q8Strings }, { specChainCfg }] = await Promise.all([import("../server/azure.js"), import("../server/studio/plan.js"), import("../server/stagecraft/lesson.js")]);
const dep = specChainCfg().chains?.spec?.[0] ?? "taxila-fast-bg";
const calls = [];
let spent = 0, lastRaw = null;
// (the builder's own chat call, wrapped only to record the deployment and tokens — never the request or its headers)
const deps = {
  chat: async (d, messages, o) => { const r = await chat(d, messages, o); calls.at(-1).tokens = normUsage(r.usage); lastRaw = r.json ?? null; return r; },
  // taxila-fast-bg is taxila-fast's background twin, priced as taxila-fast (lesson.js productionDeps)
  usdOf: (d, u) => usdOf(d === "taxila-fast-bg" || d === "taxila-stagecraft" ? "taxila-fast" : d, u),
  normUsage,
  q8: (strings, lang) => q8Strings({ strings }, { lang: lang === "en" ? "en" : lang === "hi" ? "hi" : "hinglish" }),
};
const B = createBuilders(deps);
fs.mkdirSync(OUT, { recursive: true });
for (const t of targets) {
  let done = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS && !done; attempt++) {
    if (spent + WORST_CALL_USD > CAP) throw new Error(`USD cap: spent $${spent.toFixed(4)}, one more call could pass $${CAP.toFixed(2)} — stopped before ${t.topicId} attempt ${attempt}`);
    calls.push({ topicId: t.topicId, attempt, deployment: dep, at: new Date().toISOString() });
    let r;
    try { r = await B.generatedSpec(cand(t), dep, undefined, key(t)); } catch (e) { r = { ok: false, usd: 0, why: `error: ${String(e?.code ?? e?.message ?? e).slice(0, 80)}` }; }
    const usd = Number(r?.usd) || 0;
    spent += usd;
    Object.assign(calls.at(-1), { usd: Math.round(usd * 1e6) / 1e6, ok: !!r?.ok, why: r?.ok ? null : r?.why ?? "refused" });
    console.log(`  ${t.topicId} attempt ${attempt}: ${r?.ok ? "candidate" : `refused (${r?.why})`}  $${usd.toFixed(5)}`);
    if (!r?.ok && KEEP_REFUSED) {
      const v = (() => { try { const x = validateAny(t.archetype, lastRaw); return { fellBack: !!x.fellBack, repairs: (x.repairs ?? []).slice(0, 60) }; } catch (e) { return { error: String(e?.message ?? e).slice(0, 200) }; } })();
      fs.writeFileSync(path.join(OUT, `${t.topicId}.refused-${attempt}.json`), JSON.stringify({ v: 1, target: t, why: r?.why ?? "refused", validator: v, raw: lastRaw }, null, 2) + "\n");
    }
    lastRaw = null;
    if (r?.ok && r.checks?.contentSafe !== false) done = { r, attempt };
    if (spent > CAP) throw new Error(`USD cap passed: $${spent.toFixed(4)} > $${CAP.toFixed(2)}`);
  }
  if (done) {
    const spec = done.r.payload.spec;
    fs.writeFileSync(path.join(OUT, `${t.topicId}.candidate.json`), JSON.stringify({ v: 1, target: t, archetype: t.archetype, spec, hash: specHash(t.archetype, spec),
      checks: done.r.checks, facts: done.r.facts, generation: { deployment: dep, attempt: done.attempt, at: calls.at(-1).at } }, null, 2) + "\n");
  }
}
const manifest = { v: 1, at: new Date().toISOString(), capUsd: CAP, totalUsd: Math.round(spent * 1e6) / 1e6, calls };
fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`done: ${calls.length} calls, $${spent.toFixed(4)} of $${CAP.toFixed(2)}; candidates and manifest in ${path.relative(process.cwd(), OUT)}`);
