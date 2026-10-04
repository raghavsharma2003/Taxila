// Scout 2026-10-04: MAI-Image-2.6-Flash and MAI-Image-2.5-Pro (southindia; not covered by the refresh bench) on the
// image-bench prompts + judge + rubric copied verbatim from docs/research/models/image-bench.mjs (2026-10-02), so scores
// sit next to gpt-image-2 / FLUX.2-pro there. n=2 per prompt per arm. Writes results/mai-image-2026-10-04.json + JPEGs.
// Run from repo root: NODE_USE_ENV_PROXY=1 node --env-file=.env.local evals/model-refresh-2026-10-04/scout/mai-image.mjs
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { execFileSync } from "child_process";
const ROOT = new URL("../../../", import.meta.url).pathname;
const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, ""), K = process.env.AZURE_OPENAI_API_KEY;
const SI = process.env.AZURE_AI_SOUTHINDIA_ENDPOINT.replace(/\/$/, ""), SIK = process.env.AZURE_AI_SOUTHINDIA_KEY;
const OUT = new URL("results/mai-image/", import.meta.url).pathname; mkdirSync(OUT, { recursive: true });
const PROMPTS = [
  { id: "diagram", text: "A clean labelled educational diagram of the parts of a flowering plant for an Indian class 3 science book. Exactly five English labels with leader lines pointing to the right part: Root, Stem, Leaf, Flower, Fruit. White background, bright flat colours, large readable labels.", labels: ["Root", "Stem", "Leaf", "Flower", "Fruit"] },
  { id: "classroom", text: "Warm children's-book illustration of a government school classroom in a small Indian town: class 4 children in school uniforms sitting at wooden benches, a woman teacher in a cotton saree pointing at a blackboard that shows the fractions 1/2 = 2/4, a ceiling fan, a window with a neem tree outside. No other text." },
  { id: "tutor", text: "Friendly cartoon tutor character for an Indian children's learning app: a young Indian woman teacher, kind expressive eyes, simple kurta, holding a tablet, smiling, full body, clean flat vector style, plain light background, no text." },
];


async function genMai(dep, prompt) {
  const r = await fetch(`${SI}/mai/v1/images/generations`, { method: "POST", headers: { "api-key": SIK, "content-type": "application/json" },
    body: JSON.stringify({ model: dep, prompt, width: 1024, height: 1024 }) });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j).slice(0, 200)}`);
  return { b64: j.data[0].b64_json, usage: j.usage };
}
const ARMS = { "MAI-Image-2.6-Flash": (p) => genMai("scout-mai-image26-flash", p), "MAI-Image-2.5-Pro": (p) => genMai("scout-mai-image25-pro", p) };
async function judge(jpgB64, p) {
  const t = `You judge an image generated for an Indian children's learning app (classes 1-9). The prompt was: "${p.text}"
Score each 1-5: adherence (everything asked is present, nothing odd), text (labels/numbers spelled right AND pointing at the right part; 5 if no text was asked and none appears; 1 if gibberish text appears), authenticity (looks genuinely Indian where relevant, no stereotype or Western default), appeal (a 9-year-old would like it), artifacts (5 = no anatomical/rendering defects).
${p.labels ? `List any of these labels that are missing, misspelt or point at the wrong part: ${p.labels.join(", ")}.` : ""}
JSON only: {"adherence":n,"text":n,"authenticity":n,"appeal":n,"artifacts":n,"label_errors":[...],"issue":"one short sentence"}`;
  for (let a = 0; a < 2; a++) {
    const r = await fetch(`${E}/chat/completions`, { method: "POST", headers: { "api-key": K, "content-type": "application/json" }, body: JSON.stringify({
      model: "taxila-brain", max_completion_tokens: 2000, reasoning_effort: "medium", response_format: { type: "json_object" },
      messages: [{ role: "user", content: [{ type: "text", text: t }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${jpgB64}` } }] }] }) });
    const j = await r.json(); try { return JSON.parse(j.choices[0].message.content); } catch { }
  }
  return null;
}


const rows = [];
for (let rep = 0; rep < 2; rep++) for (const p of PROMPTS) for (const [arm, gen] of Object.entries(ARMS)) {
  let res, err, t0;
  for (let attempt = 0; attempt < 4; attempt++) {
    t0 = performance.now();
    try { res = await gen(p.text); err = null; break; } catch (e) { err = String(e.message); if (!/429/.test(err)) break; await new Promise((r) => setTimeout(r, 65000)); }
  }
  const ms = Math.round(performance.now() - t0);
  const row = { prompt: p.id, arm, rep, ms, err };
  if (res) {
    const png = OUT + `${p.id}-${arm}-${rep}.png`; writeFileSync(png, Buffer.from(res.b64, "base64"));
    const jpg = png.replace(/\.png$/, ".jpg");
    execFileSync("python3", ["-c", `from PIL import Image;im=Image.open("${png}").convert("RGB");im.thumbnail((768,768));im.save("${jpg}",quality=82)`]);
    execFileSync("rm", [png]);
    row.file = jpg.replace(ROOT, ""); row.usage = res.usage;
    row.judge = await judge(readFileSync(jpg).toString("base64"), p);
  }
  rows.push(row); console.log(p.id.padEnd(10), arm.padEnd(20), ms + "ms", err || "", JSON.stringify(row.judge || {}), JSON.stringify(row.usage || {}));
  writeFileSync(new URL("results/mai-image-2026-10-04.json", import.meta.url), JSON.stringify({ date: "2026-10-04", from: "US container -> southindia", judge: "taxila-brain (gpt-5.6-sol) effort medium, rubric verbatim from image-bench.mjs", rows }, null, 1));
}
