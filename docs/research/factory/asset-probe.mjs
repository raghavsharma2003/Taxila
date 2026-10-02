// asset-probe.mjs — asset-pipeline probe on the real Azure deployments (2026-10-02).
// Questions:
//  A  does taxila-image (gpt-image-2) honour background:"transparent" on Azure? (docs say gpt-image-1 series only)
//  B  chroma-key fallback: generate on flat magenta, key it out locally, measure fringe
//  C  style/character reference sheet generation (latency, medium 1536x1024)
//  D  edits with the sheet as reference (input_fidelity high): same character, new pose — latency + consistency
//  E  prop in the sheet's style via reference
//  F  Indian-context stereotype check: unguided vs cast-spec prompt (n=2 each)
//  G  rupee prompt: does it bake text / reproduce a banknote?
//  H  Content Safety image:analyze on every output via the AIServices endpoint (same key)
// Usage: node --env-file=.env.local docs/research/factory/asset-probe.mjs  [OUT dir defaults to scratchpad-like /tmp path]
import fs from "node:fs"; import path from "node:path";
const BASE = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""); const KEY = process.env.AZURE_OPENAI_API_KEY;
const MODEL = process.env.DEPLOY_IMAGE || "taxila-image";
const CS = BASE.replace(/\.openai\.azure\.com.*$/, ".cognitiveservices.azure.com");
const OUT = process.env.OUT || "/tmp/asset-probe"; fs.mkdirSync(OUT, { recursive: true });
const rows = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastCall = 0;
async function pace() { const gap = 15500 - (Date.now() - lastCall); if (gap > 0) await sleep(gap); lastCall = Date.now(); } // 4 RPM quota

async function gen(id, body) {
  await pace(); const t0 = Date.now();
  const r = await fetch(`${BASE}/images/generations`, { method: "POST", headers: { "api-key": KEY, "content-type": "application/json" }, body: JSON.stringify({ model: MODEL, n: 1, ...body }) });
  return finish(id, "gen", body, r, t0);
}
async function edit(id, refs, body) {
  await pace(); const t0 = Date.now();
  const fd = new FormData(); fd.append("model", MODEL);
  for (const [k, v] of Object.entries(body)) fd.append(k, String(v));
  for (const f of refs) fd.append("image[]", new Blob([fs.readFileSync(f)], { type: "image/png" }), path.basename(f));
  const r = await fetch(`${BASE}/images/edits`, { method: "POST", headers: { "api-key": KEY }, body: fd });
  return finish(id, "edit", { ...body, refs: refs.map((f) => path.basename(f)) }, r, t0);
}
async function finish(id, kind, body, r, t0) {
  const ms = Date.now() - t0; const txt = await r.text(); let j; try { j = JSON.parse(txt); } catch { j = null; }
  const row = { id, kind, http: r.status, ms, req: { ...body, prompt: body.prompt?.slice(0, 160) } };
  if (!r.ok || !j?.data?.[0]) { row.err = txt.slice(0, 400); rows.push(row); console.log(JSON.stringify(row)); return null; }
  const d = j.data[0]; let buf;
  if (d.b64_json) buf = Buffer.from(d.b64_json, "base64"); else if (d.url) buf = Buffer.from(await (await fetch(d.url)).arrayBuffer());
  const f = path.join(OUT, `${id}.png`); fs.writeFileSync(f, buf);
  row.bytes = buf.length; row.usage = j.usage || null; row.revised = d.revised_prompt?.slice(0, 120) || null;
  row.pngColorType = buf[25]; // 6 = RGBA, 2 = RGB
  row.safety = await contentSafety(buf);
  rows.push(row); console.log(JSON.stringify(row)); return f;
}
async function contentSafety(buf) {
  // shrink-free call; CS limit 4 MB, 50-7200 px
  if (buf.length > 4e6) return { skipped: "over 4MB" };
  const t0 = Date.now();
  try {
    const r = await fetch(`${CS}/contentsafety/image:analyze?api-version=2024-09-01`, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": KEY, "content-type": "application/json" }, body: JSON.stringify({ image: { content: buf.toString("base64") } }) });
    const t = await r.text(); return { http: r.status, ms: Date.now() - t0, body: t.slice(0, 300) };
  } catch (e) { return { err: String(e).slice(0, 200) }; }
}

const STYLE = "Flat 2D vector illustration for a children's learning app: rounded shapes, uniform thick dark-brown outline, flat colour fills with one shade tone, no gradients, no texture, no text, no letters, no numbers.";
const MAG = "Isolated on a perfectly flat solid pure magenta (#FF00FF) background, no shadow on the background, nothing touching the edges.";

// A transparent on Azure
await gen("A-transparent", { prompt: `${STYLE} A single ripe Alphonso mango with one green leaf, centred.`, size: "1024x1024", quality: "low", background: "transparent", output_format: "png" });
// A2 same without background param but asking for transparency in words (control)
// B chroma-key
await gen("B-magenta-mango", { prompt: `${STYLE} A single ripe Alphonso mango with one green leaf, centred. ${MAG}`, size: "1024x1024", quality: "low", output_format: "png" });
// C character sheet (protégé, B1-B2 band) — cartoon, non-photoreal
const sheet = await gen("C-protege-sheet", { prompt: `${STYLE} Character reference sheet of one cartoon character: Golu, a cheerful 7-year-old Indian boy, medium-brown skin (warm tan, not light), short black hair with a cowlick, round face, big friendly eyes, yellow half-sleeve t-shirt with a plain green collar, navy shorts, white sneakers. Show the same character three times side by side: front view, three-quarter view, side view, full body, neutral standing pose, identical proportions and colours in all three. ${MAG}`, size: "1536x1024", quality: "medium", output_format: "png" });
if (sheet) {
  await edit("D1-edit-wave", [sheet], { prompt: `The exact same character Golu from the reference sheet, same face, hair, skin tone, clothes and colours, same flat outline style. Single full-body pose: waving happily with his right hand, looking at the viewer. ${MAG}`, size: "1024x1024", quality: "low", input_fidelity: "high" });
  await edit("D2-edit-think", [sheet], { prompt: `The exact same character Golu from the reference sheet, same face, hair, skin tone, clothes and colours, same flat outline style. Single full-body pose: thinking, finger on chin, eyes looking up. ${MAG}`, size: "1024x1024", quality: "low", input_fidelity: "high" });
  await edit("D3-edit-think-lowfid", [sheet], { prompt: `The exact same character Golu from the reference sheet, same face, hair, skin tone, clothes and colours, same flat outline style. Single full-body pose: thinking, finger on chin, eyes looking up. ${MAG}`, size: "1024x1024", quality: "low", input_fidelity: "low" });
  await edit("E-prop-in-style", [sheet], { prompt: `Using only the illustration style of the reference (outline weight, flat fills, palette), draw a steel plate with two rotis and a small bowl of yellow dal. No characters. ${MAG}`, size: "1024x1024", quality: "low" });
}
// F Indian-context: unguided vs cast spec
for (const i of [1, 2]) await gen(`F-unguided-${i}`, { prompt: `Children's book illustration: an Indian family eating dinner together at home.`, size: "1024x1024", quality: "low" });
for (const i of [1, 2]) await gen(`F-castspec-${i}`, { prompt: `${STYLE} An everyday family dinner in a small modern Indian city flat: a mother in a kurta with jeans just back from work, a father serving rice and dal, a grandmother, and two children (one girl with glasses). Skin tones vary across medium-brown to deep-brown. Plain contemporary clothing, no religious symbols, no jewellery emphasis, simple dining table, steel plates, a ceiling fan.`, size: "1024x1024", quality: "low" });
// G rupee
await gen("G-rupee-unguided", { prompt: `A ten rupee coin and a fifty rupee note on a table, illustration for kids.`, size: "1024x1024", quality: "low" });
await gen("G-rupee-generic", { prompt: `${STYLE} A generic round golden coin with a plain raised rim and a blank centre, and a plain rectangular light-green paper money note with a simple wave pattern and a blank oval in the middle. ${MAG}`, size: "1024x1024", quality: "low" });

const res = { date: "2026-10-02", model: MODEL, base: BASE.replace(/https:\/\/([^.]+)\./, "https://<res>."), rows };
fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "asset-probe-2026-10-02.json"), JSON.stringify(res, null, 2));
console.log("done", rows.length);
