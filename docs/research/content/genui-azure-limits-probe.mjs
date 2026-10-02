// Azure structured-output limit probe (genui-reliability.md §6.1). Run: node docs/research/content/genui-azure-limits-probe.mjs taxila-fast
// Probe Azure structured-output limits on Taxila deployments. Prints no secrets.
import fs from "node:fs";
for (const line of fs.readFileSync("/home/user/Taxila/.env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const base = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "");
const key = process.env.AZURE_OPENAI_API_KEY;
async function call(path, body) {
  const t0 = performance.now();
  const r = await fetch(base + path, { method: "POST", headers: { "api-key": key, "content-type": "application/json" }, body: JSON.stringify(body) });
  const txt = await r.text(); const ms = Math.round(performance.now() - t0);
  let j; try { j = JSON.parse(txt); } catch { j = { raw: txt.slice(0, 300) }; }
  return { status: r.status, ms, j };
}
function wideSchema(nProps) {
  const props = {}; for (let i = 0; i < nProps; i++) props["p" + i] = { type: "integer" };
  return { type: "object", properties: props, required: Object.keys(props), additionalProperties: false };
}
function deepSchema(depth) {
  let s = { type: "object", properties: { v: { type: "integer" } }, required: ["v"], additionalProperties: false };
  for (let i = 0; i < depth; i++) s = { type: "object", properties: { c: s }, required: ["c"], additionalProperties: false };
  return s;
}
const dep = process.argv[2] || "taxila-fast";
const msgs = [{ role: "user", content: "Fill every field with small integers (0-9)." }];
const res = {};
for (const [name, schema] of [["wide120", wideSchema(120)], ["wide400", wideSchema(400)], ["deep8", deepSchema(8)], ["deep12", deepSchema(12)],
  ["minmax", { type: "object", properties: { a: { type: "integer", minimum: 3, maximum: 5 }, s: { type: "string", maxLength: 4, pattern: "^[a-z]+$" }, arr: { type: "array", items: { type: "integer" }, minItems: 2, maxItems: 2 } }, required: ["a", "s", "arr"], additionalProperties: false }]]) {
  const body = { model: dep, messages: msgs, max_completion_tokens: 4000, reasoning_effort: "none", response_format: { type: "json_schema", json_schema: { name: name, strict: true, schema } } };
  const r = await call("/chat/completions", body);
  const content = r.j?.choices?.[0]?.message?.content;
  let summary = r.status === 200 ? content?.slice(0, 160) : (r.j?.error?.message || JSON.stringify(r.j)).slice(0, 300);
  res[name] = { status: r.status, ms: r.ms, out: summary, usage: r.j?.usage?.completion_tokens };
  console.log(name, r.status, r.ms + "ms", summary);
}
// CFG custom tool via Responses API
const lark = 'start: line+\nline: SHAPE " " ID " " INT " " INT "\\n"\nSHAPE: "rect" | "circle"\nID: /[a-z][a-z0-9]{0,7}/\nINT: /[0-9]{1,3}/';
const rr = await call("/responses", { model: dep, input: "Draw two shapes: a rect r1 at 10 20 and a circle c1 at 50 60. Use the draw tool.", reasoning: { effort: "low" },
  tools: [{ type: "custom", name: "draw", description: "Draw shapes, one per line: <shape> <id> <x> <y>", format: { type: "grammar", syntax: "lark", definition: lark } }], tool_choice: "required" });
const item = rr.j?.output?.find?.((o) => o.type === "custom_tool_call");
console.log("cfg", rr.status, rr.ms + "ms", item ? JSON.stringify(item.input) : (rr.j?.error?.message || JSON.stringify(rr.j).slice(0, 300)));
res.cfg = { status: rr.status, ms: rr.ms, out: item ? item.input : (rr.j?.error?.message || "").slice(0, 300) };
fs.writeFileSync(new URL(`./genui-azure-limits-${dep}-2026-10-02.json`, import.meta.url), JSON.stringify(res, null, 2));
