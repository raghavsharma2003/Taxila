// Re-judge evals/results/bakeoff-shots/*.png (task A) — the bakeoff's judge call capped max_completion_tokens at 300 on a
// reasoning model, so about a third of verdicts came back empty. Same rubric, taxila-brain effort low, 2000 tokens.
// Writes docs/research/models/diagram-rejudge-2026-10-02.json. Usage: NODE_USE_ENV_PROXY=1 node docs/research/models/rejudge-diagrams.mjs
import { readFileSync, writeFileSync, readdirSync } from "fs";
const ROOT = new URL("../../../", import.meta.url).pathname;
for (const line of readFileSync(ROOT + ".env.local", "utf8").split("\n")) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1"); }
const E = process.env.AZURE_OPENAI_ENDPOINT, K = process.env.AZURE_OPENAI_API_KEY;
const ASK = { "water-cycle": [4, "the water cycle (evaporation, condensation, precipitation, collection) with sun, sea, clouds, rain, river"],
  "equiv-fractions": [4, "equivalent fractions: two identical bars, one split into 2 parts with 1 shaded, one split into 4 parts with 2 shaded, showing 1/2 = 2/4"],
  "plant-parts": [3, "parts of a plant (root, stem, leaf, flower, fruit) and what each does"] };
const dir = ROOT + "evals/results/bakeoff-shots/";
const files = readdirSync(dir).filter((f) => f.endsWith(".png"));
const rows = [];
await Promise.all(Array.from({ length: 6 }, async () => { while (files.length) { const f = files.shift();
  const d = Object.keys(ASK).find((k) => f.includes("-" + k + "-")); const model = f.slice(0, f.indexOf("-" + d + "-"));
  const png = readFileSync(dir + f);
  let v = null;
  for (let a = 0; a < 2 && !v; a++) {
    const r = await fetch(`${E}/chat/completions`, { method: "POST", headers: { "api-key": K, "content-type": "application/json" }, body: JSON.stringify({
      model: "taxila-brain", max_completion_tokens: 2000, reasoning_effort: "low", response_format: { type: "json_object" },
      messages: [{ role: "user", content: [{ type: "text", text: `You are judging an educational diagram for an Indian class ${ASK[d][0]} child. Topic: ${ASK[d][1]}. Score 1-5 each: correctness (science/maths right, labels in right places), legibility (readable labels at phone size, no overlaps), appeal (would a child enjoy it). JSON: {"correctness":n,"legibility":n,"appeal":n,"issue":"short"}` },
        { type: "image_url", image_url: { url: `data:image/png;base64,${png.toString("base64")}` } }] }] }) });
    const j = await r.json(); try { v = JSON.parse(j.choices[0].message.content); } catch {}
  }
  rows.push({ model, diagram: d, file: f, judge: v }); console.log(model, d, JSON.stringify(v));
} }));
writeFileSync(ROOT + "docs/research/models/diagram-rejudge-2026-10-02.json", JSON.stringify({ judge: "taxila-brain effort low", rows }, null, 1));
