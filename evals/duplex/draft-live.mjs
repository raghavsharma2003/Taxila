// draft-live.mjs — duplex prototype, measurement M-D4 (2026-10-04): what one speculative reply draft costs in time and
// tokens on the live reply deployment, so the simulator's draft model (harness.mjs draftModel) is measured, not assumed.
//
// Method: n calls to DEPLOY.reply (taxila-fast unless DEPLOY_REPLY is set) through server/azure.js chatStream (the
// production streaming path, quotaLane "live"), the way server/duplex/launch.js launches a draft: a system prompt shaped
// like a teacher brief (~1,100 tokens, synthetic, NOT the production compile() prompt) + the child's words + the code
// grade, max 200 tokens, effort none. Half the calls are W drafts (outcome known, no child words), half C drafts (child
// words). Plus k cancellation probes: a draft aborted 300 ms after launch, to confirm the AbortController stops the stream
// (the billed tokens of an aborted call are not visible to the client; launch.js estimates them).
// Records TTFT, total time, prompt/completion tokens. US container -> eastus2. Spend: < USD 0.02.
//   NODE_USE_ENV_PROXY=1 node evals/duplex/draft-live.mjs [--n 24]
import fs from "node:fs";
import path from "node:path";
import { loadEnv, ROOT, RESULTS, q, mean, r0 } from "./lib.mjs";
loadEnv();
await import(ROOT + "server/net.js");
const { chatStream, DEPLOY, usdOf } = await import(ROOT + "server/azure.js");

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const N = Number(arg("--n", 24));
const dep = DEPLOY.reply;

// Synthetic brief: shapes and notes (inherited law: never lines she could recite), padded to a production-like size.
const BRIEF = [
  "Role: a warm Hindi-English (Hinglish) voice teacher for a class 5 child. Spoken register: short clauses, one idea per sentence.",
  "Never deny being an AI. No romance or companion register. If distress appears, stop teaching and follow the safeguard.",
  "Reply shape: (1) uptake of the child's own words, (2) the verdict only after the uptake, (3) one next step or question.",
  "Verdict rules: correct -> name what was right, briefly; misconception -> do not say wrong first, ask a contrast question;",
  "incorrect -> one hint toward the method, not the answer. Never read the answer key aloud before the child has tried twice.",
  "Item: fractions, comparing parts of a whole; key and common misconception supplied as data below.",
].join("\n");
const PAD = Array.from({ length: 34 }, (_, i) => `note ${i + 1}: lesson context line ${i + 1}, prior turn summary shape, learner model hint (mastery 0.${(i * 7) % 10}), kit step ${i % 5}.`).join("\n");
const CASES = [
  { phase: "wait", user: "Item key: 3/4. Code grade: correct. Child words: (not yet spoken). Draft the reply for this outcome." },
  { phase: "wait", user: "Item key: 56. Code grade: misconception (48: added instead of multiplied). Child words: (not yet spoken). Draft the reply." },
  { phase: "candidate", user: "Item key: 12. Child said: \"उम्म, मुझे लगता है बारह\". Code grade: correct. Reply." },
  { phase: "candidate", user: "Teach-back beat. Child said: \"क्योंकि cube के सारे faces square होते हैं, इसलिए सब edges बराबर होते हैं\". Reply." },
];

const rows = [];
for (let i = 0; i < N; i++) {
  const c = CASES[i % CASES.length];
  const messages = [{ role: "system", content: `${BRIEF}\n${PAD}` }, { role: "user", content: c.user }];
  const t0 = performance.now();
  let ttft = null;
  try {
    const r = await chatStream(dep, messages, { maxTokens: 200, effort: "none", quotaLane: "live", kind: "duplex_draft_probe",
      onDelta: () => { if (ttft === null) ttft = performance.now() - t0; } });
    const u = r.usage || {};
    rows.push({ phase: c.phase, ttft: r0(ttft), total: r0(performance.now() - t0), in: u.prompt_tokens ?? u.in ?? null, out: u.completion_tokens ?? u.out ?? null, chars: (r.text || "").length });
  } catch (e) { rows.push({ phase: c.phase, error: String(e?.message || e).slice(0, 160) }); }
}
// cancellation probes
const cancels = [];
for (let i = 0; i < 4; i++) {
  const ctl = new AbortController();
  const t0 = performance.now();
  let chars = 0;
  setTimeout(() => ctl.abort(), 300);
  try {
    await chatStream(dep, [{ role: "system", content: `${BRIEF}\n${PAD}` }, { role: "user", content: CASES[3].user }], { maxTokens: 200, effort: "none", signal: ctl.signal, quotaLane: "live", kind: "duplex_draft_probe", onDelta: (_d, full) => { chars = full.length; } });
    cancels.push({ aborted: false, ms: r0(performance.now() - t0), chars });
  } catch (e) { cancels.push({ aborted: true, ms: r0(performance.now() - t0), chars, error: String(e?.message || e).slice(0, 80) }); }
}
const ok = rows.filter((r) => !r.error && r.ttft !== null);
const tokPerS = ok.map((r) => (r.out && r.total > r.ttft ? (r.out / (r.total - r.ttft)) * 1000 : null)).filter(Boolean);
const usd = ok.reduce((a, r) => a + usdOf(dep, { in: r.in || 0, out: r.out || 0 }), 0);
const result = {
  id: "M-D4", date: "2026-10-04", deployment: dep, n: rows.length, ok: ok.length, errors: rows.filter((r) => r.error).length,
  method: "chatStream, synthetic ~1.1k-token teacher brief, max 200 tokens, effort none, sequential, US container -> eastus2",
  model: {
    ttft: [r0(q(ok.map((r) => r.ttft), 0.5)), r0(q(ok.map((r) => r.ttft), 0.9))],
    outTok: [r0(q(ok.map((r) => r.out), 0.5)), r0(q(ok.map((r) => r.out), 0.9))],
    inTok: r0(mean(ok.map((r) => r.in))),
    tokPerS: r0(q(tokPerS, 0.5)),
    total: [r0(q(ok.map((r) => r.total), 0.5)), r0(q(ok.map((r) => r.total), 0.9))],
  },
  cancels, usd: +usd.toFixed(5), rows,
};
fs.mkdirSync(RESULTS, { recursive: true });
fs.writeFileSync(path.join(RESULTS, "draft-live-2026-10-04.json"), JSON.stringify(result, null, 1));
console.log(JSON.stringify({ ...result, rows: undefined }, null, 1));
process.exit(0);
