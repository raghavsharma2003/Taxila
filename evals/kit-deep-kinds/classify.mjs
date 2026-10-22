// Two-model deep / shallow audit of deep-tagged kit items (docs/research/kits/DEEP-KIND-AUDIT.md). One JSONL row per
// (item, model) call in <dir>/results.jsonl. Resumable: a pair with a verdict is skipped; a failure is recorded, never a
// verdict, and is re-tried only with --retry-failed. At most 8 calls in flight; one retry on 429 / 5xx / timeout.
//   node evals/kit-deep-kinds/items.mjs --dir <work>
//   NODE_USE_ENV_PROXY=1 node --env-file=<.env.local> evals/kit-deep-kinds/classify.mjs --dir <work> < /dev/null
import "./env.mjs"; // FIRST: no database, no trace, the SIN account
import { readFileSync, appendFileSync, existsSync } from "node:fs";
import { SYSTEM, userMsg, validate, RUBRIC_VERSION } from "./rubric.mjs";
import { arg, workDir } from "./lib.mjs";
const { chat } = await import("../../server/azure.js");

const DIR = workDir();
const MODELS = arg("models", "taxila-brain,DeepSeek-V4-Pro").split(",");
const LIMIT = Number(arg("limit", "0")) || Infinity;
const OUT = `${DIR}/results.jsonl`;
const KINDS = arg("kinds", "") ? new Set(arg("kinds").split(",")) : null;
const CONC = Math.min(8, Number(arg("conc", "8")));
const retryFailed = process.argv.includes("--retry-failed");
const OPTS = { "taxila-brain": { effort: "medium", maxTokens: 4000 }, "DeepSeek-V4-Pro": { maxTokens: 800 }, "grok-4-1-fast-non-reasoning": { maxTokens: 300 } };

let items = JSON.parse(readFileSync(`${DIR}/items.json`, "utf8"));
if (KINDS) items = items.filter((x) => KINDS.has(x.kind));
// a deterministic shuffle, so a partial run is a fair sample of every kind / class / subject
const h = (s) => [...s].reduce((a, c) => Math.imul(a ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
items.sort((a, b) => h(a.itemId) - h(b.itemId));
items = items.slice(0, LIMIT);

const done = new Map();
if (existsSync(OUT)) for (const l of readFileSync(OUT, "utf8").split("\n").filter(Boolean)) {
  const r = JSON.parse(l); const k = `${r.itemId}|${r.model}`;
  if (r.ok) done.set(k, "ok"); else if (!done.has(k)) done.set(k, "fail");
}
const jobs = [];
for (const x of items) for (const m of MODELS) { const s = done.get(`${x.itemId}|${m}`); if (s === "ok" || (s === "fail" && !retryFailed)) continue; jobs.push([x, m]); }
console.error(`jobs ${jobs.length} (items ${items.length}, models ${MODELS.join("+")}, conc ${CONC})`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const retryable = (e) => e?.status === 429 || e?.status >= 500 || e?.status === 0 || ["timeout", "network"].includes(e?.code);
async function once(x, m) {
  const r = await chat(m, [{ role: "system", content: SYSTEM }, { role: "user", content: userMsg(x) }], { ...(OPTS[m] ?? { maxTokens: 800 }), json: true, retries: 0, timeoutMs: 90_000 });
  const v = validate(r.json);
  if (!v) { const e = new Error(`schema: ${String(r.text).slice(0, 120)}`); e.code = "schema"; throw e; }
  return { ...v, usage: r.usage ? { in: r.usage.prompt_tokens, out: r.usage.completion_tokens } : null };
}
let n = 0, fails = 0; const t0 = Date.now();
async function run([x, m]) {
  const t = Date.now(); let attempt = 0, row;
  for (;;) {
    try { const v = await once(x, m); row = { itemId: x.itemId, topicId: x.topicId, kind: x.kind, model: m, ok: true, demand: v.demand, why: v.why, usage: v.usage, ms: Date.now() - t, attempt, rubric: RUBRIC_VERSION }; break; }
    catch (e) {
      if (attempt === 0 && retryable(e)) { attempt = 1; await sleep(e?.status === 429 ? 8000 : 1500); continue; }
      row = { itemId: x.itemId, topicId: x.topicId, kind: x.kind, model: m, ok: false, error: `${e?.status ?? ""} ${e?.code ?? ""} ${String(e?.message ?? e).slice(0, 160)}`.trim(), ms: Date.now() - t, attempt, rubric: RUBRIC_VERSION }; fails++; break;
    }
  }
  appendFileSync(OUT, JSON.stringify(row) + "\n");
  if (++n % 200 === 0) console.error(`${n}/${jobs.length} fails ${fails} ${Math.round((Date.now() - t0) / 1000)}s`);
}
let next = 0;
await Promise.all(Array.from({ length: CONC }, async () => { while (next < jobs.length) { const j = jobs[next++]; await run(j); } }));
console.error(`done ${n} calls, ${fails} failures, ${Math.round((Date.now() - t0) / 1000)}s`);
