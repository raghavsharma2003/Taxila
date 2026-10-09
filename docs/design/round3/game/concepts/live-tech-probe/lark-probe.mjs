// r3-game live-tech probe (scratch): can the play delta be a GRAMMAR-constrained DSL line (Lark custom tool,
// Responses API) on our gpt-5.6-luna background twin, with string LENGTHS bounded at decode time?
// Usage: node --env-file=.env.local docs/design/round3/game/concepts/live-tech-probe/lark-probe.mjs <n> <out.json>   (never prints keys)
import { writeFileSync } from "node:fs";
const [nStr = "2", out = "lark.json"] = process.argv.slice(2);
const N = Number(nStr), DEP = process.env.PROBE_DEP || "taxila-fast-bg";
const base = (process.env.AZURE_OPENAI_ENDPOINT || "").replace(/\/+$/, "");
const key = process.env.AZURE_OPENAI_API_KEY || "";
const GRAMMAR_CHARS = String.raw`start: "form=" FORM " ctx=" CTX " rope=" ROPE " move=" MOVE " goal=" GOAL " why=" WHY
FORM: "shape" | "predict" | "spot"
CTX: "garden" | "net" | "pen" | "bed" | "rangoli"
ROPE: "16" | "20" | "24" | "28"
MOVE: "thin" | "square" | "none"
GOAL: /[A-Za-z][A-Za-z ,?'-]{7,47}/
WHY: /[A-Za-z][A-Za-z ,?'-]{7,59}/`;
const GRAMMAR_WORDS = String.raw`start: "form=" FORM " ctx=" CTX " rope=" ROPE " move=" MOVE " goal=" goal " | why=" why
goal: WORD " " WORD " " WORD (" " WORD)? (" " WORD)? (" " WORD)? "."
why: WORD " " WORD " " WORD " " WORD (" " WORD)? (" " WORD)? (" " WORD)? (" " WORD)? "?"
FORM: "shape" | "predict" | "spot"
CTX: "garden" | "net" | "pen" | "bed" | "rangoli"
ROPE: "16" | "20" | "24" | "28"
MOVE: "thin" | "square" | "none"
WORD: /[A-Za-z']{1,12}/`;
const GRAMMAR = process.env.PROBE_GRAMMAR === "words" ? GRAMMAR_WORDS : GRAMMAR_CHARS;
const sys = "ROLE play-delta picker; code already built the game. Call play_delta once. Strings: Roman Hinglish, class 6, no numbers, never reveal an area.";
const cases = ["mujhe lagta hai dono ka area same hoga kyunki rassi utni hi hai | interests cricket", "perimeter same hai toh area bhi same na? | interests kheti, cooking", "game banao na isse | interests drawing", "I think the long thin one is bigger because it is longer | interests football"];
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const rows = [];
for (let i = 0; i < N; i++) {
  const body = {
    model: DEP, reasoning: { effort: process.env.PROBE_EFFORT || "none" }, max_output_tokens: 400,
    input: [{ role: "developer", content: sys }, { role: "user", content: `topic c6-maths-ch06-t02 same perimeter different area; child: ${cases[i % 4]}; misconception same-perimeter-area` }],
    tools: [{ type: "custom", name: "play_delta", description: "one line: the picks and two short strings", format: { type: "grammar", syntax: "lark", definition: GRAMMAR } }],
    tool_choice: "required",
  };
  const t0 = performance.now();
  let status = 0, line = null, err = null, usage = null;
  try {
    const r = await fetch(`${base}/responses`, { method: "POST", headers: { "content-type": "application/json", "api-key": key }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
    status = r.status;
    const j = await r.json();
    if (!r.ok) err = String(j?.error?.message || status).slice(0, 160);
    const call = (j.output || []).find((o) => o.type === "custom_tool_call");
    line = call?.input ?? null; usage = j.usage ?? null;
    if (!line && !err) err = "no custom_tool_call: " + JSON.stringify((j.output || []).map((o) => o.type));
  } catch (e) { err = String(e?.message || e).slice(0, 160); }
  const ms = Math.round(performance.now() - t0);
  const m = line && (line.match(/^form=(\w+) ctx=(\w+) rope=(\d+) move=(\w+) goal=(.+?) \| why=(.+)$/) || line.match(/^form=(\w+) ctx=(\w+) rope=(\d+) move=(\w+) goal=(.+) why=(.+)$/));
  const goal = m?.[5], why = m?.[6];
  const ok = !!m && goal.length <= 48 && why.length <= 60;
  rows.push({ i, ms, status, err, ok, out: usage?.output_tokens ?? null, reasoning: usage?.output_tokens_details?.reasoning_tokens ?? null, line, goalLen: goal?.length, whyLen: why?.length });
  process.stdout.write(`${i} ${status} ${ms}ms out=${usage?.output_tokens} ok=${ok} ${err ?? ""} ${line ? "| " + line.slice(0, 140) : ""}\n`);
  await new Promise((res) => setTimeout(res, 400));
}
const good = rows.filter((r) => !r.err);
const summary = { grammar: process.env.PROBE_GRAMMAR || "chars", dep: DEP, effort: process.env.PROBE_EFFORT || "none", n: rows.length, errors: rows.length - good.length, ok: rows.filter((r) => r.ok).length,
  ms_p50: good.length ? q(good.map((r) => r.ms), 0.5) : null, ms_p90: good.length ? q(good.map((r) => r.ms), 0.9) : null, out_p50: good.length ? q(good.map((r) => r.out), 0.5) : null, at: new Date().toISOString() };
writeFileSync(out, JSON.stringify({ summary, grammar: GRAMMAR, rows }, null, 1));
console.log(JSON.stringify(summary));
