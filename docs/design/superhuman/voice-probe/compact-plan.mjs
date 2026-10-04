// compact-plan.mjs — the planner as an ANNOTATOR: code splits the line into numbered clauses; the model returns only
// one short code tuple per clause (no text). Removes the content-preservation failure class (the model never writes
// the words) and cuts output tokens ~300 -> ~60, which is what set the 1.9 s floor at effort none (plan-latency.json).
// Run: NODE_USE_ENV_PROXY=1 node compact-plan.mjs
import fs from "node:fs";
import { LINES } from "./lines.mjs";
import { EMOTIONS, NONVERBALS } from "./planner.mjs";
const OAI = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""), KEY = process.env.AZURE_OPENAI_API_KEY;
const FILL = ["-", "हम्म", "अच्छा", "हाँ", "तो", "अरे", "देखो", "उम्म", "hmm", "okay", "so"];
const PACE = ["slow", "normal", "brisk"];
export const clauses = (t) => t.split(/(?<=[,।!?])\s+/u).filter(Boolean);
const BRIEF = `Annotate HOW numbered clauses of a teacher's line are spoken. Never output words of the line.
Output JSON only: {"c":[[e,i,p,ms,nv,f], ...]} one tuple per clause, in order.
e: emotion index into ${JSON.stringify(EMOTIONS)}. i: intensity 1-3. p: pace index into ${JSON.stringify(PACE)}.
ms: pause before the clause, 0-1200, varied, longer before the key idea. nv: index into ${JSON.stringify(NONVERBALS)} for a sound before the clause.
f: index into ${JSON.stringify(FILL)} for a word said before the clause (0 = none; at most 1 per line unless think_aloud; index 7/8 only in think_aloud).
laugh/chuckle only if the child laughed or joked and never near a mistake; hum only before thinking or wonder.`;
async function annotate(l, model, effort) {
  const cl = clauses(l.text);
  const user = JSON.stringify({ clauses: cl.map((c, i) => `${i}: ${c}`), intent: l.intent, moment: l.scene, child_laughed: !!l.childLaughed, child_wrong: !!l.childWrong });
  const t0 = performance.now();
  const r = await fetch(`${OAI}/chat/completions`, { method: "POST", headers: { "api-key": KEY, "content-type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "system", content: BRIEF }, { role: "user", content: user }], response_format: { type: "json_object" },
      ...(/^(taxila-|gpt-)/.test(model) ? { max_completion_tokens: 600, reasoning_effort: effort } : { max_tokens: 300 }) }) });
  const ms = Math.round(performance.now() - t0); const j = await r.json();
  if (!r.ok) return { ms, ok: false, err: JSON.stringify(j).slice(0, 160) };
  let p; try { p = JSON.parse(j.choices[0].message.content); } catch { return { ms, ok: false, err: "bad_json" }; }
  const ok = Array.isArray(p.c) && p.c.length === cl.length && p.c.every((t) => Array.isArray(t) && t.length === 6 && EMOTIONS[t[0]] && NONVERBALS[t[4]] !== undefined && FILL[t[5]] !== undefined);
  return { ms, ok, out: p, tok: j.usage?.completion_tokens };
}
const ARMS = [["taxila-fast", "none"], ["taxila-fast", "low"], ["grok-4-1-fast-non-reasoning", null]];
const res = {};
for (const [m, e] of ARMS) { const k = `${m}|${e}`; res[k] = [];
  for (let rep = 0; rep < 2; rep++) for (const l of LINES) { const r = await annotate(l, m, e); res[k].push({ line: l.id, ...r }); console.log(k, l.id, r.ms, r.ok ? "OK" : "BAD", r.tok, JSON.stringify(r.out || r.err).slice(0, 140)); } }
const sum = Object.fromEntries(Object.entries(res).map(([k, a]) => { const ms = a.map((x) => x.ms).sort((x, y) => x - y); return [k, { n: a.length, valid: a.filter((x) => x.ok).length, p50: ms[Math.floor(ms.length / 2)], p90: ms[Math.floor(ms.length * 0.9)], out_tokens_mean: Math.round(a.reduce((s, x) => s + (x.tok || 0), 0) / a.length) }]; }));
fs.writeFileSync("compact-plan.json", JSON.stringify({ when: new Date().toISOString(), from: "US sandbox -> eastus2", summary: sum, raw: res }, null, 1)); console.table(sum);
