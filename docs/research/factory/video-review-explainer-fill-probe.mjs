// Principal-review probe for video-animation-gen.md §6.2: does an explainer@1 TEMPLATE fill (narration in two
// scripts + bilingual cue terms) really land in "≈ 3-4 s" like scene@1 T2a (381 output tokens, 3.08 s p50)?
// Run from repo root: node docs/research/factory/video-review-explainer-fill-probe.mjs
// Synthetic briefs only; prints no secrets; writes video-review-explainer-fill-probe-2026-10-02.json
import fs from "node:fs"; import path from "node:path";
const HERE = path.dirname(new URL(import.meta.url).pathname);
for (const line of fs.readFileSync(path.join(HERE, "../../../.env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const BASE = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""); const KEY = process.env.AZURE_OPENAI_API_KEY;
const L10n = { type: "object", additionalProperties: false, required: ["hi", "hi_latn"],
  properties: { hi: { type: "string" }, hi_latn: { type: "string" } } };
const schema = { type: "object", additionalProperties: false, required: ["whole", "n", "k", "unequal_n", "segments", "probe"],
  properties: {
    whole: { type: "string", enum: ["roti", "pizza", "chocolate_bar", "paper_strip", "ladoo_tray"] },
    n: { type: "integer" }, k: { type: "integer" }, unequal_n: { type: "integer" },
    segments: { type: "array", items: { type: "object", additionalProperties: false, required: ["say", "terms", "est_s"],
      properties: { say: L10n, terms: { type: "array", items: { type: "string" } }, est_s: { type: "number" } } } },
    probe: { type: "object", additionalProperties: false, required: ["q", "options", "answer"],
      properties: { q: L10n, options: { type: "array", items: L10n }, answer: { type: "integer" } } } } };
const BRIEFS = [
  { objective: "FRAC.UNIT.3_4", kit_facts: ["3/4 = 3 of 4 EQUAL parts", "parts must be equal"], misconception: "MC.FRAC.UNEQUAL: counts unequal pieces as quarters", band: "B2" },
  { objective: "FRAC.UNIT.2_3", kit_facts: ["2/3 = 2 of 3 equal parts"], misconception: "MC.FRAC.BIGGER_DENOM: thinks 1/3 < 1/4", band: "B3" },
  { objective: "FRAC.UNIT.1_2", kit_facts: ["1/2 = 1 of 2 equal parts", "half"], misconception: "MC.FRAC.UNEQUAL", band: "B1" },
  { objective: "FRAC.UNIT.5_8", kit_facts: ["5/8 = 5 of 8 equal parts"], misconception: "MC.FRAC.WHOLE_NUMBER_BIAS: 5/8 > 3/4 because 8 > 4", band: "B4" },
  { objective: "FRAC.UNIT.3_5", kit_facts: ["3/5 = 3 of 5 equal parts"], misconception: "MC.FRAC.UNEQUAL", band: "B2" },
  { objective: "FRAC.UNIT.1_4", kit_facts: ["1/4 = 1 of 4 equal parts", "quarter"], misconception: "MC.FRAC.UNEQUAL", band: "B1" },
];
const instructions = [
  "Role: fill the slots of the partition-equal@1 explainer template for a Hindi-medium Indian child.",
  "Output: the slot JSON only.",
  "segments: 4 to 6; each say.hi is Devanagari Hindi, say.hi_latn is Roman Hinglish of the same meaning; terms are 2-4 cue words that appear in say, given in BOTH scripts.",
  "probe: one predict question with 3 options, answer is the option index.",
  "Every number must come from kit_facts. Confront the named misconception.",
  "Hard limits (last): at most 25 words per say script; sum of est_s between 20 and 60.",
].join("\n");
async function call(brief) {
  const body = { model: "taxila-fast", reasoning_effort: "none", max_completion_tokens: 3000,
    messages: [{ role: "system", content: instructions }, { role: "user", content: JSON.stringify(brief) }],
    response_format: { type: "json_schema", json_schema: { name: "partition_equal_slots", strict: true, schema } } };
  const t0 = performance.now();
  const r = await fetch(BASE + "/chat/completions", { method: "POST", headers: { "api-key": KEY, "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json(); const ms = Math.round(performance.now() - t0);
  if (!r.ok) return { ok: false, ms, status: r.status, err: String(j.error?.message ?? "").slice(0, 200) };
  const txt = j.choices[0].message.content; let parsed = null; try { parsed = JSON.parse(txt); } catch {}
  const hiChars = parsed ? parsed.segments.map((s) => s.say.hi).join(" ").length : null;
  const latnChars = parsed ? parsed.segments.map((s) => s.say.hi_latn).join(" ").length : null;
  const sumS = parsed ? parsed.segments.reduce((a, s) => a + s.est_s, 0) : null;
  const termsInSay = parsed ? parsed.segments.every((s) => s.terms.some((t) => s.say.hi.includes(t) || s.say.hi_latn.toLowerCase().includes(t.toLowerCase()))) : null;
  return { ok: true, ms, out: j.usage.completion_tokens, in: j.usage.prompt_tokens, segs: parsed?.segments.length, hiChars, latnChars, sumS, termsInSay,
    sample_seg0: parsed?.segments[0]?.say };
}
const runs = [];
for (const b of BRIEFS) { const r = await call(b); runs.push({ objective: b.objective, ...r }); console.log(JSON.stringify({ o: b.objective, ms: r.ms, out: r.out, segs: r.segs, sumS: r.sumS, termsInSay: r.termsInSay })); }
// token cost of the same sentence in each script (counts output tokens of an echo)
const ms = runs.filter((r) => r.ok).map((r) => r.ms).sort((a, b) => a - b); const outs = runs.filter((r) => r.ok).map((r) => r.out).sort((a, b) => a - b);
const q = (a, p) => a[Math.min(a.length - 1, Math.floor(p * a.length))];
const summary = { n: ms.length, p50_ms: q(ms, 0.5), max_ms: ms.at(-1), out_p50: q(outs, 0.5), out_max: outs.at(-1) };
console.log(JSON.stringify(summary));
fs.writeFileSync(path.join(HERE, "video-review-explainer-fill-probe-2026-10-02.json"), JSON.stringify({ date: "2026-10-02", model: "taxila-fast (gpt-5.6-luna), effort none, strict json_schema, chat/completions", method: "6 synthetic fraction briefs, sequential, from US build container", summary, runs }, null, 1));
