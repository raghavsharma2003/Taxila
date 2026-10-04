// COPY of evals/model-refresh-2026-10-04/studio/run.mjs for the scout text-build arm (2026-10-04). Brief, gate (qa.mjs),
// repairs, timing and pricing logic UNCHANGED; diffs marked SCOUT: imports point at the refresh folder, ARMS has only
// the scout arm, and the generation endpoint is the southindia account (the only arm lives there).
// Usage: NODE_USE_ENV_PROXY=1 node studio-run.mjs --kinds fraction_game --n 5 --out results/studio
// ORIGINAL HEADER: Model-refresh 2026-10-04, Studio builds. Same brief (kinds.mjs, photosynthesis brief v2), same strict gate (qa.mjs)
// and same <=2 gate-fed repairs as evals/live-studio/run.mjs, with three changes:
//  1. LABEL ANCHORING is a HARD gate check on photosynthesis (LIVE-STUDIO §14.5 / G4): a failure fails the round and
//     its detail feeds the repair prompt. passNoAnchor records the old-gate verdict for comparability.
//  2. Gates run under a 2-slot semaphore (4-CPU container; the perf check runs at 4x CPU throttle and must not see
//     other gates' load). Gate wait is NOT counted in time-to-playable (gen ms + gate ms only, as before).
//  3. An arm whose generation times out twice is dropped; the drop is logged in dropped.json.
// Usage: NODE_USE_ENV_PROXY=1 node evals/model-refresh-2026-10-04/studio/run.mjs [--arms a,b] [--kinds k] [--n 5] [--conc 14] [--perArm 3]
import fs from "node:fs";
import path from "node:path";
process.env.STUDIO_BRIEF_V2 = "1";
const { chromium } = await import("playwright");
const { loadEnv, generate, usd, unfence, PRICES } = await import("../../model-refresh-2026-10-04/studio/models.mjs"); // SCOUT
const { KINDS, SYSTEM, userPrompt, wrap } = await import("../../live-studio/kinds.mjs");
const { runQA, streamFirstPaint } = await import("../../live-studio/qa.mjs");

loadEnv();
// SCOUT: route to southindia; MAI Models retail $2 in / $0.2 cached / $8 out per 1M (prices-2026-10-04.json)
process.env.AZURE_OPENAI_ENDPOINT = process.env.AZURE_AI_SOUTHINDIA_ENDPOINT.replace(/\/+$/, "") + "/openai/v1"; process.env.AZURE_OPENAI_API_KEY = process.env.AZURE_AI_SOUTHINDIA_KEY;
PRICES["scout-mai-thinking1"] = { in: 2, cached: 0.2, out: 8 };
// SCOUT: Bedrock arms (opt-in with --arms br:...): ConverseStream through ./bedrock.mjs, mapped to generate()'s shape.
const { converse, BR_ARMS, BR_PRICE } = await import("./bedrock.mjs");
for (const [k, [i, o]] of Object.entries(BR_PRICE)) PRICES[k] = { in: i, cached: i, out: o };
async function generateAny(dep, system, user, opts) {
  if (!dep.startsWith("br:")) return generate(dep, system, user, opts);
  const chunks = []; const [region, id] = BR_ARMS[dep];
  const r = await converse(region, id, [{ role: "system", content: system }, { role: "user", content: user }], { maxTokens: Math.min(opts.maxTokens || 16000, 16000), timeoutMs: 300_000, chunks });
  return { text: r.text, chunks, ttftMs: r.ttft, firstAnyMs: r.ttft, reasoningChars: 0, served: id, ms: r.ms,
    usage: r.usage ? { in: r.usage.prompt_tokens, cached: 0, out: r.usage.completion_tokens, reasoning: 0 } : null,
    error: r.err ? (/timeout|aborted/i.test(r.err) ? "timeout" : `HTTP ${(r.err.match(/http (\d+)/) || [])[1] || "?"}: ${r.err}`) : r.finish === "max_tokens" ? "length" : null };
}
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
export const ARMS = { // SCOUT
  "mai-thinking1": { dep: "scout-mai-thinking1" },
  ...Object.fromEntries(Object.keys(BR_ARMS).map((k) => [k, { dep: k }])), // SCOUT: Bedrock, run only when named in --arms
};
const arms = arg("arms", "mai-thinking1").split(","); // SCOUT: default = the arm measured 2026-10-04
const kinds = arg("kinds", Object.keys(KINDS).join(",")).split(",");
const N = +arg("n", 5), CONC = +arg("conc", 14), PER_ARM = +arg("perArm", 3), REPAIRS = +arg("repairs", 2);
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), arg("out", "out"));
fs.mkdirSync(OUT, { recursive: true });

// --- gate semaphore
let gateSlots = 2; const gateQ = [];
async function gated(fn) {
  if (gateSlots > 0) gateSlots--; else await new Promise((r) => gateQ.push(r));
  try { return await fn(); } finally { const n = gateQ.shift(); if (n) n(); else gateSlots++; }
}

// --- label anchoring (logic identical to evals/live-studio/anchor.mjs; thresholds 70 px entity, 90 px flow)
async function anchorCheck(browser, frag) {
  const page = await browser.newPage({ viewport: { width: 360, height: 640 } });
  const t0 = performance.now();
  try {
    await page.route("**/*", (x) => x.abort());
    await page.setContent(wrap("photosynthesis_anim", frag), { waitUntil: "load", timeout: 10_000 });
    await page.waitForTimeout(400);
    const best = {};
    for (let f = 0; f < 8; f++) {
      const d = await page.evaluate(() => {
        const box = (e) => e.getBoundingClientRect();
        const ctr = (b) => [b.x + b.width / 2, b.y + b.height / 2];
        const distBox = (p, b) => Math.hypot(Math.max(b.x - p[0], 0, p[0] - (b.x + b.width)), Math.max(b.y - p[1], 0, p[1] - (b.y + b.height)));
        const out = {};
        for (const k of ["leaf", "roots", "water", "co2", "o2"]) {
          const lab = document.querySelector(`[data-label=${k}]`); if (!lab) { out[k] = 999; continue; }
          const lb = box(lab); const lc = ctr(lb);
          if (k === "leaf" || k === "roots") { const e = document.querySelector(`[data-entity=${k}]`); out[k] = e ? distBox(lc, box(e)) - Math.min(lb.width, 160) / 2 : 999; }
          else { const ps = [...document.querySelectorAll(`[data-flow=${k}]`)]; out[k] = ps.length ? Math.min(...ps.map((p) => distBox(lc, box(p)))) - lb.width / 2 : 999; }
        }
        return out;
      });
      for (const [k, v] of Object.entries(d)) best[k] = Math.min(best[k] ?? 1e9, v);
      await page.waitForTimeout(200);
    }
    const fails = Object.entries(best).filter(([k, v]) => v > (k === "leaf" || k === "roots" ? 70 : 90)).map(([k, v]) => `${k} label ${Math.round(v)} px from its referent`);
    return { id: "labels_anchored_to_referent", pass: fails.length === 0, detail: fails, ms: Math.round(performance.now() - t0) };
  } catch (e) {
    return { id: "labels_anchored_to_referent", pass: false, detail: String(e.message).slice(0, 160), ms: Math.round(performance.now() - t0) };
  } finally { await page.close(); }
}

async function gate(browser, kind, frag, shot) {
  return gated(async () => {
    const qa = await runQA(browser, kind, frag, { shot });
    const passNoAnchor = qa.pass;
    if (kind === "photosynthesis_anim") {
      const a = await anchorCheck(browser, frag);
      qa.checks.push({ id: a.id, pass: a.pass, detail: a.detail });
      qa.ms += a.ms; qa.pass = qa.pass && a.pass;
    }
    return { ...qa, passNoAnchor };
  });
}

const browser = await chromium.launch();
const resultsFile = path.join(OUT, "results.json"), droppedFile = path.join(OUT, "dropped.json");
const results = fs.existsSync(resultsFile) ? JSON.parse(fs.readFileSync(resultsFile, "utf8")) : [];
const dropped = fs.existsSync(droppedFile) ? JSON.parse(fs.readFileSync(droppedFile, "utf8")) : {};
const doneIds = new Set(results.map((r) => r.id));
const timeouts = {}; const running = {};
// interleave: seed-major so every arm makes progress in parallel and seed-aligned race pairs fill evenly
const jobs = [];
for (let s = 0; s < N; s++) for (const kind of kinds) for (const arm of arms) jobs.push({ kind, arm, s });

function repairPrompt(kind, frag, qa) {
  const fails = qa.checks.filter((c) => !c.pass).map((c) => `- ${c.id}: ${String(JSON.stringify(c.detail ?? "") ?? "").slice(0, 240)}`).join("\n");
  return `${userPrompt(kind)}\n\nYOUR PREVIOUS FRAGMENT FAILED THE AUTOMATED GATE. Failing checks (id: detail):\n${fails}\n\nPREVIOUS FRAGMENT:\n${frag}\n\nReturn the complete corrected fragment (same output rules).`;
}

async function one(job) {
  const id = `${job.kind}__${job.arm}__${job.s}`;
  if (doneIds.has(id) || dropped[job.arm]) return;
  const { dep, effort, maxTokens } = ARMS[job.arm];
  const rec = { id, ...job, dep, effort: effort || null, startedAt: new Date().toISOString(), rounds: [] };
  let prompt = userPrompt(job.kind), wall = 0;
  for (let round = 0; round <= REPAIRS; round++) {
    const g = await generateAny(dep, SYSTEM, prompt, { effort, maxTokens: maxTokens || 16000 }); // SCOUT
    if (g.error === "timeout") {
      timeouts[job.arm] = (timeouts[job.arm] || 0) + 1;
      if (timeouts[job.arm] >= 2 && !dropped[job.arm]) { dropped[job.arm] = { at: new Date().toISOString(), reason: "2 generation timeouts (300 s)", lastJob: id }; fs.writeFileSync(droppedFile, JSON.stringify(dropped, null, 1)); console.log("DROP ARM", job.arm); }
    }
    const frag = unfence(g.text);
    fs.writeFileSync(path.join(OUT, `${id}__r${round}.html`), frag);
    const r = { round, genMs: g.ms, ttftMs: g.ttftMs, firstAnyMs: g.firstAnyMs, reasoningChars: g.reasoningChars, served: g.served, usage: g.usage, usd: usd(dep, g.usage), error: g.error, chars: frag.length };
    if (round === 0 && g.chunks.length) r.streamPaintMs = await gated(() => streamFirstPaint(browser, job.kind, g.text, g.chunks, unfence));
    if (!g.error && frag.length > 200) {
      const qa = await gate(browser, job.kind, frag, path.join(OUT, `${id}__r${round}`));
      r.qa = { pass: qa.pass, passNoAnchor: qa.passNoAnchor, ms: qa.ms, readyMs: qa.firstReadyMs, perf: qa.perf, failed: qa.checks.filter((c) => !c.pass).map((c) => ({ id: c.id, detail: c.detail })), nChecks: qa.checks.length };
      wall += g.ms + qa.ms; r.cumWallMs = wall; rec.rounds.push(r);
      console.log(`${id} r${round} gen ${g.ms}ms ttft ${g.ttftMs} any ${g.firstAnyMs} qa ${qa.pass ? "PASS" : "fail " + r.qa.failed.map((f) => f.id).join(",")} $${r.usd.toFixed(4)}`);
      if (qa.pass) break;
      prompt = repairPrompt(job.kind, frag, qa);
    } else {
      wall += g.ms; r.cumWallMs = wall; rec.rounds.push(r);
      console.log(`${id} r${round} ERROR ${g.error} chars ${frag.length}`);
      if (g.error && /HTTP 4\d\d/.test(g.error) && !/429/.test(g.error)) break;
      if (dropped[job.arm]) break;
    }
  }
  const last = rec.rounds.at(-1);
  rec.passFirst = !!rec.rounds[0]?.qa?.pass;
  rec.passFirstNoAnchor = !!rec.rounds[0]?.qa?.passNoAnchor;
  rec.passFinal = !!last?.qa?.pass;
  rec.roundsUsed = rec.rounds.length;
  rec.timeToPlayableMs = rec.passFinal ? last.cumWallMs : null;
  rec.usd = rec.rounds.reduce((a, r) => a + (r.usd || 0), 0);
  results.push(rec);
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 1));
}

// worker pool with a per-arm concurrency cap (keeps one deployment from hogging the pool or its own TPM)
const pending = jobs.slice();
async function worker() {
  for (;;) {
    const i = pending.findIndex((j) => (running[j.arm] || 0) < PER_ARM);
    if (i < 0) { if (!pending.length) return; await new Promise((r) => setTimeout(r, 500)); continue; }
    const j = pending.splice(i, 1)[0];
    running[j.arm] = (running[j.arm] || 0) + 1;
    try { await one(j); } catch (e) { console.log("JOB ERR", j, e.message); } finally { running[j.arm]--; }
  }
}
await Promise.all(Array.from({ length: CONC }, worker));
await browser.close();
const spend = results.reduce((a, r) => a + r.usd, 0);
console.log("done", results.length, "spend $" + spend.toFixed(2), "dropped", JSON.stringify(dropped));
