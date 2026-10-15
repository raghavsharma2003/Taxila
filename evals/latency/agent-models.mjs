// Round 5, stream 3 (latency): the agent loop's candidate Teacher models (docs/design/round5/AGENT.md §1 "Models"), measured
// as the loop will use them: ONE streamed chat call with the Teacher's compact state, the tool schemas, the last turns and
// the child's new words; speech is written first and tool calls ride beside it.
// Per call (ms after the request left): ttft (first content token), clause (the first SPEAKABLE clause is complete: the
// first sentence end, or a comma after >= 6 words — what goes to TTS at once), tool (the first tool-call delta), done.
// Interleaved round-robin across models, one call at a time, so a regional hiccup lands on every arm.
//   node evals/latency/agent-models.mjs [--n 30] [--models a,b,c] [--out file.json]
// US container -> the deployments' regions (eastus2 / southindia per server/endpoints.js): absolute numbers carry this
// host's RTT; India adds or removes ~0.2 s per call (measurements.md india-latency-2026-10-04). Synthetic state, not a child.
import fs from "node:fs";

const REPO = new URL("../..", import.meta.url).pathname;
for (const line of fs.readFileSync(REPO + ".env.local", "utf8").split("\n")) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1"); }
const argv = process.argv;
const arg = (k, d) => { const i = argv.indexOf(k); return i > 0 ? argv[i + 1] : d; };
const N = Number(arg("--n", 30)), OUT = arg("--out");
const MODELS = arg("--models", "taxila-gpt61-sol,taxila-gpt6,taxila-gpt6-astra,grok-4-1-fast-non-reasoning,taxila-fast").split(",");
const { laneEndpoint, laneKey } = await import(REPO + "server/endpoints.js");
const { isReasoningFamily, effortFor } = await import(REPO + "server/azure.js");

const TOOLS = [
  ["board_show", "Show something on the child's board; returns what actually mounted.", { kind: { type: "string", enum: ["write", "number_line", "table", "shapes", "picture"] }, spec: { type: "string" } }],
  ["board_clear", "Empty the board.", {}],
  ["item_next", "The next verified kit item for a skill at a level.", { skill: { type: "string" }, level: { type: "integer" } }],
  ["answer_check", "Grade the child's answer against the verified key.", { item: { type: "string" }, answer: { type: "string" } }],
  ["learner_note", "Record the covert comprehension read.", { skill: { type: "string" }, read: { type: "string", enum: ["understood", "partly", "not"] }, evidence: { type: "string" } }],
  ["game_make", "Start a Forge game build in parallel.", { brief: { type: "string" } }],
  ["picture_get", "Ask for a real picture.", { subject: { type: "string" } }],
].map(([name, description, properties]) => ({ type: "function", function: { name, description, parameters: { type: "object", properties, required: Object.keys(properties), additionalProperties: false } } }));

const STATE = {
  child: { class: 4, lang: "Hinglish (Roman Hindi with English maths words)", address: "tum", interests: ["cricket", "drawing"] },
  goal: "c4-maths fractions: equal parts, naming 1/2, 1/3, 1/4, comparing unit fractions",
  kit: { concepts: ["a fraction names equal parts of one whole", "the bottom number says how many equal parts", "more parts = smaller pieces"],
    items: Array.from({ length: 8 }, (_, i) => ({ id: `c4-frac-i${i + 1}`, skill: i < 4 ? "name-unit-fraction" : "compare-unit-fractions", prompt: `Item ${i + 1}: ${["Roti ke 4 barabar tukde, ek tukda kitna?", "Kaunsa bada: 1/3 ya 1/5?"][i % 2]}` })),
    misconceptions: ["bigger denominator means bigger piece", "unequal parts still count as quarters", "1/2 means 'one of two things' regardless of size"] },
  learner: { "name-unit-fraction": { read: "partly", evidence: ["said 1/4 for a quarter roti", "hesitated on thirds"] }, "compare-unit-fractions": { read: "not", evidence: ["said 1/5 > 1/3 because 5 > 3"] } },
  screen: { board: "number_line 0..1 marked in quarters", mounted: true },
  jobs: [{ id: "g-17", kind: "game", brief: "cricket over: share runs into equal parts", state: "building", etaS: 40 }],
  plan: ["re-explain why 1/5 < 1/3 with a roti split in front of her", "check with one compare item", "if right, start the cricket game when ready"],
};
const RECENT = [
  ["assistant", "Achha batao, 1/3 aur 1/5 mein kaunsa tukda bada hoga?"], ["user", "1/5 bada hai kyunki 5 bada number hai"],
  ["assistant", "Hmm, interesting! Socho, ek roti ko 3 logon mein baanto ya 5 logon mein, kis mein tumhe zyada roti milegi?"], ["user", "3 logon mein... wait"],
];
const SYSTEM = `You are Asha, an AI teacher for an Indian child, speaking aloud (your words go straight to a voice). You run the lesson.
Speak FIRST, briefly (one or two short sentences, the child's language mix), then call tools only if they help right now; tools run while you speak.
Never grade yourself: answer_check grades. Never ask a child on voice to type.
Lesson state (JSON): ${JSON.stringify(STATE)}`;
const SAYS = ["haan 3 logon mein zyada milegi, toh 1/3 bada hai!", "pata nahi didi", "matlab 1/5 chhota hai? kyunki zyada log hain?", "kya hum cricket wala game khel sakte hain?", "mujhe samajh nahi aaya, phir se batao"];

function bodyFor(dep, said) {
  const reasoning = isReasoningFamily(dep), eff = effortFor(dep, "none");
  return { model: dep, stream: true, stream_options: { include_usage: true }, tools: TOOLS, tool_choice: "auto", parallel_tool_calls: true,
    messages: [{ role: "system", content: SYSTEM }, ...RECENT.map(([role, content]) => ({ role, content })), { role: "user", content: `(the child said) ${said}` }],
    [reasoning ? "max_completion_tokens" : "max_tokens"]: 400, ...(eff ? { reasoning_effort: eff } : {}) };
}
const CLAUSE = (t) => /[.!?।]\s|[.!?।]$/.test(t) || (/,\s/.test(t) && t.trim().split(/\s+/).length >= 6);

// gpt-6.1-sol / gpt-6-astra have no "none" effort, and function tools with reasoning work only on /v1/responses
const RESPONSES = /^(taxila-gpt61-sol|taxila-gpt6-astra)/i;
function responsesBody(dep, said) {
  return { model: dep, stream: true, max_output_tokens: 600, reasoning: { effort: effortFor(dep, "none") ?? "low" }, parallel_tool_calls: true, tool_choice: "auto",
    tools: TOOLS.map((t) => ({ type: "function", name: t.function.name, description: t.function.description, parameters: t.function.parameters, strict: true })),
    input: [{ role: "developer", content: SYSTEM }, ...RECENT.map(([role, content]) => ({ role, content })), { role: "user", content: `(the child said) ${said}` }] };
}

async function one(dep, said) {
  const t0 = performance.now(), r = { dep, ttft: null, clause: null, tool: null, done: null, status: 0, tools: 0, words: 0, firstClause: "", api: RESPONSES.test(dep) ? "responses" : "chat" };
  const ctl = AbortSignal.timeout(20_000);
  try {
    const res = await fetch(laneEndpoint("CHAT") + (r.api === "responses" ? "/responses" : "/chat/completions"), { method: "POST", headers: { "api-key": laneKey("CHAT"), "content-type": "application/json" },
      body: JSON.stringify(r.api === "responses" ? responsesBody(dep, said) : bodyFor(dep, said)), signal: ctl });
    r.status = res.status;
    if (!res.ok) { r.error = (await res.text()).replace(/\s+/g, " ").slice(0, 300); return r; }
    let text = "", buf = "";
    const dec = new TextDecoder();
    for await (const chunk of res.body) {
      buf += dec.decode(chunk, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") continue;
        let j; try { j = JSON.parse(data); } catch { continue; }
        if (j.type) { // the Responses API's events
          const now = Math.round(performance.now() - t0);
          if (j.type === "response.output_text.delta" && j.delta) { if (r.ttft == null) r.ttft = now; text += j.delta; if (r.clause == null && CLAUSE(text)) { r.clause = now; r.firstClause = text.trim().slice(0, 120); } }
          if (j.type === "response.output_item.added" && j.item?.type === "function_call") { if (r.tool == null) r.tool = now; r.tools++; }
          if (j.type === "response.failed" || j.type === "error") r.error = JSON.stringify(j).slice(0, 200);
          continue;
        }
        for (const c of j.choices ?? []) {
          const d = c.delta ?? {};
          const now = Math.round(performance.now() - t0);
          if (d.content) { if (r.ttft == null) r.ttft = now; text += d.content; if (r.clause == null && CLAUSE(text)) { r.clause = now; r.firstClause = text.trim().slice(0, 120); } }
          if (d.tool_calls?.length) { if (r.tool == null) r.tool = now; for (const tc of d.tool_calls) if (tc.function?.name) r.tools++; }
        }
      }
    }
    r.done = Math.round(performance.now() - t0);
    if (r.clause == null && text.trim()) { r.clause = r.done; r.firstClause = text.trim().slice(0, 120); } // one short line: it is all the clause
    r.words = text.trim() ? text.trim().split(/\s+/).length : 0;
  } catch (e) { r.error = String(e?.message ?? e).slice(0, 160); }
  return r;
}

const rows = [];
for (let i = 0; i < N; i++) {
  for (const dep of MODELS) {
    const r = await one(dep, SAYS[i % SAYS.length]);
    rows.push({ i, ...r });
    console.log(`[${i}] ${dep.padEnd(30)} ${r.status} ttft ${r.ttft} clause ${r.clause} tool ${r.tool} done ${r.done} tools=${r.tools} words=${r.words} ${r.error ?? ""}`);
    await new Promise((res) => setTimeout(res, 300));
  }
}
const pct = (a, p) => { const s = a.filter(Number.isFinite).sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };
const summary = Object.fromEntries(MODELS.map((dep) => {
  const R = rows.filter((r) => r.dep === dep && r.status === 200);
  const col = (k) => R.map((r) => r[k]);
  return [dep, { ok: R.length, of: rows.filter((r) => r.dep === dep).length, ttft: [pct(col("ttft"), 0.5), pct(col("ttft"), 0.9)], clause: [pct(col("clause"), 0.5), pct(col("clause"), 0.9)],
    done: [pct(col("done"), 0.5), pct(col("done"), 0.9)], speaksFirst: R.filter((r) => r.ttft != null && (r.tool == null || r.ttft <= r.tool)).length, toolCalls: R.filter((r) => r.tools > 0).length,
    noSpeech: R.filter((r) => r.ttft == null).length }];
}));
console.log(JSON.stringify(summary, null, 1));
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ at: new Date().toISOString(), n: N, models: MODELS, summary, rows }, null, 1));
process.exit(0);
