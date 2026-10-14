// Sim lab shared bits: .env.local, the Azure chat call (server/azure.js — the only module that talks to Azure), JSON
// parsing of model output, and the run-wide model choices.
import { readFileSync } from "fs";

export const ROOT = new URL("../..", import.meta.url).pathname;
for (const line of readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
// server/azure.js logs one line per call; the lab's own progress lines are what matter on stdout.
if (!process.env.SIMLAB_VERBOSE) console.info = () => {};

const { chat } = await import("../../server/azure.js");

/**
 * Models. The teacher under test is GPT-family (taxila-fast / taxila-gpt6 on the Director lane; gpt-6.x on the agent
 * lane), so the child and the judges come from other families, and the child never shares a family with a judge
 * (rj sim-child-model-in-grader-chain: the model that wrote the child's words never grades them).
 */
export const MODELS = {
  child: process.env.SIMLAB_CHILD || "DeepSeek-V4-Pro",
  judge: process.env.SIMLAB_JUDGE || "grok-4-20-reasoning",
  judge2: process.env.SIMLAB_JUDGE2 || "taxila-kimi26",
};
const family = (d) => (/grok/i.test(d) ? "grok" : /deepseek|ds4/i.test(d) ? "deepseek" : /kimi/i.test(d) ? "kimi" : /mistral/i.test(d) ? "mistral" : "gpt");
export const familyOf = family;
if (family(MODELS.child) === family(MODELS.judge) || family(MODELS.child) === family(MODELS.judge2)) throw new Error("simlab: the child model shares a family with a judge");

/** One model call that must return a JSON object. Retries once on a parse failure or a transient error. */
export async function askJson(deployment, messages, { maxTokens = 1200, timeoutMs = 90_000, effort } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await chat(deployment, messages, { maxTokens, timeoutMs, retries: 1, ...(effort ? { effort } : {}) });
      const j = parseJson(r.text);
      if (j) return { json: j, usage: r.usage };
      lastErr = new Error(`no JSON in ${deployment} output: ${String(r.text).slice(0, 200)}`);
    } catch (e) { lastErr = e; }
    await new Promise((res) => setTimeout(res, 1500 * (attempt + 1)));
  }
  throw lastErr;
}

export function parseJson(text) {
  const t = String(text ?? "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : t;
  const a = body.indexOf("{"), b = body.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(body.slice(a, b + 1)); } catch { return null; }
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Bounded-concurrency map, results in input order. */
export async function pool(items, conc, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(conc, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}
