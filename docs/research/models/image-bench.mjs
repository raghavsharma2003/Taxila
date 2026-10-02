// Image-model probe for the model router (EXPERIMENT, 2026-10-02).
// 3 prompts x {gpt-image-2 (taxila-image), FLUX.2-pro (taxila-flux2), FLUX.1-Kontext-pro (taxila-kontext)}, n=1 each,
// judged by taxila-brain (gpt-5.6-sol) vision with a closed rubric. Writes image-bench-2026-10-02.json + JPEGs.
// Usage: NODE_USE_ENV_PROXY=1 node docs/research/models/image-bench.mjs
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { execFileSync } from "child_process";

const ROOT = new URL("../../../", import.meta.url).pathname;
for (const line of readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, ""), K = process.env.AZURE_OPENAI_API_KEY;
const HOST = E.match(/^https:\/\/([^.]+)\./)[1];
const OUT = ROOT + "docs/research/models/image-bench/"; mkdirSync(OUT, { recursive: true });

const PROMPTS = [
  { id: "diagram", text: "A clean labelled educational diagram of the parts of a flowering plant for an Indian class 3 science book. Exactly five English labels with leader lines pointing to the right part: Root, Stem, Leaf, Flower, Fruit. White background, bright flat colours, large readable labels.", labels: ["Root", "Stem", "Leaf", "Flower", "Fruit"] },
  { id: "classroom", text: "Warm children's-book illustration of a government school classroom in a small Indian town: class 4 children in school uniforms sitting at wooden benches, a woman teacher in a cotton saree pointing at a blackboard that shows the fractions 1/2 = 2/4, a ceiling fan, a window with a neem tree outside. No other text." },
  { id: "tutor", text: "Friendly cartoon tutor character for an Indian children's learning app: a young Indian woman teacher, kind expressive eyes, simple kurta, holding a tablet, smiling, full body, clean flat vector style, plain light background, no text." },
];

async function genOpenAI(dep, prompt) {
  const r = await fetch(`${E}/images/generations`, { method: "POST", headers: { "api-key": K, "content-type": "application/json" },
    body: JSON.stringify({ model: dep, prompt, n: 1, size: "1024x1024", quality: "medium" }) });
  const j = await r.json(); if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j).slice(0, 200)}`);
  return { b64: j.data[0].b64_json, usage: j.usage };
}
async function genDeployments(dep, prompt) {
  const r = await fetch(`https://${HOST}.openai.azure.com/openai/deployments/${dep}/images/generations?api-version=2025-04-01-preview`, {
    method: "POST", headers: { "api-key": K, "content-type": "application/json" },
    body: JSON.stringify({ model: dep, prompt, n: 1, size: "1024x1024", output_format: "png" }) });
  const j = await r.json(); if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j).slice(0, 200)}`);
  return { b64: j.data[0].b64_json };
}
async function genBfl(prompt) {
  const r = await fetch(`https://${HOST}.services.ai.azure.com/providers/blackforestlabs/v1/flux-2-pro?api-version=preview`, {
    method: "POST", headers: { "api-key": K, "content-type": "application/json" },
    body: JSON.stringify({ model: "taxila-flux2", prompt, n: 1, width: 1024, height: 1024, output_format: "png" }) });
  const j = await r.json(); if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j).slice(0, 200)}`);
  return { b64: j.data[0].b64_json };
}
const ARMS = {
  "gpt-image-2": (p) => genOpenAI("taxila-image", p),
  "FLUX.2-pro": (p) => genBfl(p),
  "FLUX.1-Kontext-pro": (p) => genDeployments("taxila-kontext", p),
};

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
for (const p of PROMPTS) for (const [arm, gen] of Object.entries(ARMS)) {
  let res, err, ms, t0;
  for (let attempt = 0; attempt < 4; attempt++) {
    t0 = performance.now();
    try { res = await gen(p.text); err = null; break; } catch (e) { err = String(e.message); if (!/429/.test(err)) break; await new Promise((r) => setTimeout(r, 65000)); }
  }
  ms = Math.round(performance.now() - t0);
  const row = { prompt: p.id, arm, ms, err };
  if (res) {
    const png = OUT + `${p.id}-${arm}.png`; writeFileSync(png, Buffer.from(res.b64, "base64"));
    const jpg = png.replace(/\.png$/, ".jpg");
    execFileSync("python3", ["-c", `from PIL import Image;im=Image.open("${png}").convert("RGB");im.thumbnail((768,768));im.save("${jpg}",quality=82)`]);
    execFileSync("rm", [png]);
    row.file = jpg.replace(ROOT, ""); row.usage = res.usage;
    row.judge = await judge(readFileSync(jpg).toString("base64"), p);
  }
  rows.push(row); console.log(p.id.padEnd(10), arm.padEnd(20), ms + "ms", err || "", JSON.stringify(row.judge || {}));
}
writeFileSync(ROOT + "docs/research/models/image-bench-2026-10-02.json", JSON.stringify({ at: new Date().toISOString(), judge: "taxila-brain (gpt-5.6-sol) effort medium", quality: "gpt-image-2 medium; FLUX defaults", rows }, null, 1));
console.log("done");
