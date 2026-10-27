// Round 5, stream 3 (main's P0, 2026-10-21): production reply calls on taxila-fast (eastus2) timed out at 6 s on 2026-10-16
// 08-10 UTC (45 of 183), so a quarter of the owner's replies were the fallback line. The reply is a hedged call (server/azure.js
// chat({ hedgeMs: 2200 })), but its twin goes to the SAME deployment, so a slow deployment slows both arms. This measures the
// proposed fix: the twin on the overflow account's twin (southindia), against today's same-deployment twin.
//   primary   the CHAT host: STUBBED "hang" (never answers; the 10-16 shape) or "slow" (answers after --slow-ms), or "real"
//             (production's own account, main's ask 2026-10-21: one call at a time, n per arm, never in parallel)
//   overflow  the southindia account, real (this session's *_SIN key, set on process.env in this process only)
// Arms per call, interleaved: same (both arms on the primary, today) | si (arm 1 on the overflow lane at the hedge point).
//   node evals/latency/reply-hedge-arm.mjs [--n 20] [--mode hang|slow] [--slow-ms 4500] [--hedge 2200] [--out file.json]
import fs from "node:fs";

const REPO = new URL("../..", import.meta.url).pathname;
const argv = process.argv;
const arg = (k, d) => { const i = argv.indexOf(k); return i > 0 ? argv[i + 1] : d; };
const N = Number(arg("--n", 20)), MODE = arg("--mode", "hang"), SLOW_MS = Number(arg("--slow-ms", 4500)), HEDGE = Number(arg("--hedge", 2200)), OUT = arg("--out");
for (const line of fs.readFileSync(REPO + ".env.local", "utf8").split("\n")) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1"); }
process.env.AZURE_OPENAI_ENDPOINT_OVERFLOW = process.env.AZURE_OPENAI_ENDPOINT_SIN;
process.env.AZURE_OPENAI_API_KEY_OVERFLOW = process.env.AZURE_OPENAI_API_KEY_SIN;
delete process.env.AZURE_OPENAI_ENDPOINT_CHAT; delete process.env.AZURE_OPENAI_API_KEY_CHAT; // the CHAT lane = the primary host, stubbed below
process.env.TAXILA_OVERFLOW_DEPLOYMENTS = "taxila-fast";
const { chat, hedged } = await import(REPO + "server/azure.js");
const host = (u) => { try { return new URL(u).host; } catch { return ""; } };
const PRIMARY = host(process.env.AZURE_OPENAI_ENDPOINT), OVER = host(process.env.AZURE_OPENAI_ENDPOINT_OVERFLOW);
if (!PRIMARY || !OVER || PRIMARY === OVER) { console.error("need distinct primary and overflow hosts"); process.exit(2); }

// hang / slow: the primary NEVER receives a request from this eval (every call to it is answered or hung here)
const realFetch = globalThis.fetch;
const hits = { primary: 0, overflow: 0 };
globalThis.fetch = async (input, init) => {
  const h = host(typeof input === "string" ? input : input?.url);
  if (h === PRIMARY && MODE === "real") { hits.primary++; return realFetch(input, init); }
  if (h === PRIMARY) {
    hits.primary++;
    const signal = init?.signal;
    await new Promise((resolve, reject) => {
      if (MODE === "slow") setTimeout(resolve, SLOW_MS);
      signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })), { once: true });
    });
    return new Response(JSON.stringify({ choices: [{ message: { content: "Achha, chalo dekhte hain." } }], usage: { prompt_tokens: 50, completion_tokens: 8 } }), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (h === OVER) hits.overflow++;
  return realFetch(input, init);
};

const MSGS = [{ role: "system", content: "You are Asha, an AI teacher for an Indian class 4 child, speaking aloud in Hinglish. One or two short sentences." },
  { role: "user", content: "matlab 1/5 chhota hai?" }];
const OPTS = { maxTokens: 220, effort: "none", timeoutMs: 6000, quotaLane: "hot" };

async function one(arm) {
  const t0 = performance.now(), b = { ...hits };
  let ok = false, err = null;
  try {
    if (arm === "same") await chat("taxila-fast", MSGS, { ...OPTS, hedgeMs: HEDGE });
    else await hedged((signal, i) => chat("taxila-fast", MSGS, { ...OPTS, hedgeMs: 0, retries: 0, signal, ...(i === 1 ? { lane: "OVERFLOW" } : {}) }), HEDGE);
    ok = true;
  } catch (e) { err = String(e?.code ?? e?.status ?? e?.message).slice(0, 60); }
  return { arm, ok, ms: Math.round(performance.now() - t0), primaryCalls: hits.primary - b.primary, overflowCalls: hits.overflow - b.overflow, err };
}

const rows = [];
for (let i = 0; i < N; i++) for (const arm of i % 2 ? ["si", "same"] : ["same", "si"]) {
  const r = await one(arm);
  rows.push({ i, ...r });
  console.log(`[${i}] ${arm.padEnd(4)} ${r.ok ? "ok " : "ERR"} ${r.ms} ms  p${r.primaryCalls}/o${r.overflowCalls} ${r.err ?? ""}`);
}
const pct = (a, p) => { const s = a.filter(Number.isFinite).sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };
const summary = Object.fromEntries(["same", "si"].map((arm) => { const R = rows.filter((r) => r.arm === arm), O = R.filter((r) => r.ok);
  return [arm, { n: R.length, answered: O.length, ms: [pct(O.map((r) => r.ms), 0.5), pct(O.map((r) => r.ms), 0.9)], overflowCalls: R.reduce((s, r) => s + r.overflowCalls, 0), errors: R.filter((r) => !r.ok).map((r) => r.err) }]; }));
console.log(JSON.stringify({ mode: MODE, hedge: HEDGE, summary }, null, 1));
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ at: new Date().toISOString(), mode: MODE, hedge: HEDGE, slowMs: SLOW_MS, n: N, summary, rows }, null, 1));
process.exit(0);
