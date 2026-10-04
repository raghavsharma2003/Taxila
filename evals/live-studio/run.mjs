// Live Studio probe runner (docs/design/superhuman/LIVE-STUDIO.md §M). Real streamed builds on Azure Foundry
// deployments for 3 kinds, each through the strict QA gate, with up to 2 self-repair rounds fed by the gate's
// failures. Usage:
//   NODE_USE_ENV_PROXY=1 node evals/live-studio/run.mjs [--arms a,b] [--kinds k1,k2] [--n 3] [--conc 6] [--repairs 2]
// Output: evals/live-studio/out-<date>/results.json (+ fragments and screenshots per build).
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { loadEnv, generate, usd, unfence } from "./models.mjs";
import { KINDS, SYSTEM, userPrompt } from "./kinds.mjs";
import { runQA, streamFirstPaint } from "./qa.mjs";

loadEnv();
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const ARMS = {
  "codex-low": { dep: "taxila-codex", effort: "low" },
  "codex-med": { dep: "taxila-codex", effort: "medium" },
  "sol-low": { dep: "taxila-brain", effort: "low" },
  "terra-low": { dep: "gpt-5.6-terra", effort: "low" },
  "kimi-code": { dep: "taxila-kimi-code" },
  "dsv4-pro": { dep: "DeepSeek-V4-Pro" },
  "dsv4-flash": { dep: "DeepSeek-V4-Flash" },
  "grok-4.3": { dep: "grok-4.3" },
};
const arms = arg("arms", Object.keys(ARMS).join(",")).split(",");
const kinds = arg("kinds", Object.keys(KINDS).join(",")).split(",");
const N = +arg("n", 3), CONC = +arg("conc", 6), REPAIRS = +arg("repairs", 2);
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), arg("out", "out-2026-10-04"));
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const jobs = [];
for (const kind of kinds) for (const arm of arms) for (let s = 0; s < N; s++) jobs.push({ kind, arm, s });
const resultsFile = path.join(OUT, "results.json");
const results = fs.existsSync(resultsFile) ? JSON.parse(fs.readFileSync(resultsFile, "utf8")) : [];
const doneIds = new Set(results.map((r) => r.id));

function repairPrompt(kind, frag, qa) {
  const fails = qa.checks.filter((c) => !c.pass).map((c) => `- ${c.id}: ${JSON.stringify(c.detail).slice(0, 240)}`).join("\n");
  return `${userPrompt(kind)}\n\nYOUR PREVIOUS FRAGMENT FAILED THE AUTOMATED GATE. Failing checks (id: detail):\n${fails}\n\nPREVIOUS FRAGMENT:\n${frag}\n\nReturn the complete corrected fragment (same output rules).`;
}

async function one(job) {
  const id = `${job.kind}__${job.arm}__${job.s}`;
  if (doneIds.has(id)) return;
  const { dep, effort } = ARMS[job.arm];
  const rec = { id, ...job, dep, effort: effort || null, rounds: [] };
  let prompt = userPrompt(job.kind), wall = 0;
  for (let round = 0; round <= REPAIRS; round++) {
    const g = await generate(dep, SYSTEM, prompt, { effort });
    const frag = unfence(g.text);
    fs.writeFileSync(path.join(OUT, `${id}__r${round}.html`), frag);
    const r = { round, genMs: g.ms, ttftMs: g.ttftMs, usage: g.usage, usd: usd(dep, g.usage), error: g.error, chars: frag.length };
    if (round === 0 && g.chunks.length) r.streamPaintMs = await streamFirstPaint(browser, job.kind, g.text, g.chunks, unfence);
    if (!g.error && frag.length > 200) {
      const qa = await runQA(browser, job.kind, frag, { shot: round === 0 || true ? path.join(OUT, `${id}__r${round}`) : null });
      r.qa = { pass: qa.pass, ms: qa.ms, readyMs: qa.firstReadyMs, perf: qa.perf, failed: qa.checks.filter((c) => !c.pass).map((c) => ({ id: c.id, detail: c.detail })), nChecks: qa.checks.length };
      wall += g.ms + qa.ms;
      r.cumWallMs = wall;
      rec.rounds.push(r);
      console.log(`${id} r${round} gen ${g.ms}ms ttft ${g.ttftMs} paint ${r.streamPaintMs ?? "-"} qa ${qa.pass ? "PASS" : "fail " + r.qa.failed.map((f) => f.id).join(",")} $${r.usd.toFixed(4)}`);
      if (qa.pass) break;
      prompt = repairPrompt(job.kind, frag, qa);
    } else {
      wall += g.ms; r.cumWallMs = wall; rec.rounds.push(r);
      console.log(`${id} r${round} ERROR ${g.error} chars ${frag.length}`);
      if (g.error && /HTTP 4\d\d/.test(g.error) && !/429/.test(g.error)) break;
    }
  }
  const last = rec.rounds.at(-1);
  rec.passFirst = !!rec.rounds[0]?.qa?.pass;
  rec.passFinal = !!last?.qa?.pass;
  rec.roundsUsed = rec.rounds.length;
  rec.timeToPlayableMs = rec.passFinal ? last.cumWallMs : null;
  rec.usd = rec.rounds.reduce((a, r) => a + (r.usd || 0), 0);
  results.push(rec);
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 1));
}

let next = 0;
await Promise.all(Array.from({ length: CONC }, async () => { while (next < jobs.length) { const j = jobs[next++]; try { await one(j); } catch (e) { console.log("JOB ERR", j, e.message); } } }));
await browser.close();
console.log("done", results.length);
