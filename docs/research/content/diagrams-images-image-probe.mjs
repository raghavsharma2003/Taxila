// diagrams-images-image-probe.mjs — Taxila content/diagrams-images: gpt-image-2 for LABELLED science diagrams (2026-10-02).
// Distinct from factory/asset-probe.mjs (sprites, transparency, character sheets, stereotype check) — this one asks:
//  I1 baked labels: are requested label strings rendered exactly, English vs Hindi (Devanagari), low vs medium quality?
//  I2 text-free base: does "no text / no labels / no arrows" hold for a diagram base?
//  I3 VLM anchoring: can taxila-brain (gpt-5.6-sol, vision) place each part's anchor on a text-free base, repeatably?
//     (the label-diagram@1 pipeline: raster base + host-rendered SVG labels at verified anchors)
//  I4 VLM OCR as a gate: does a vision transcription agree with the requested strings?
// Usage: node --env-file=.env.local docs/research/content/diagrams-images-image-probe.mjs   (≈14 images, ≈ $0.20)
import fs from "node:fs"; import path from "node:path"; import { chromium } from "playwright";
const BASE = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""); const KEY = process.env.AZURE_OPENAI_API_KEY;
const IMG = process.env.DEPLOY_IMAGE || "taxila-image"; const VLM = process.env.DEPLOY_BRAIN || "taxila-brain";
const HERE = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(HERE, "diagrams-images-image-probe-2026-10-02"); fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); let last = 0;
async function pace() { const g = 16000 - (Date.now() - last); if (g > 0) await sleep(g); last = Date.now(); } // 4 RPM deployment cap

const SUBJECTS = {
  flower: { what: "a single flower cut in half lengthwise (longitudinal section) showing its parts",
    en: ["petal", "sepal", "stamen", "anther", "stigma", "ovary"], hi: ["पंखुड़ी", "बाह्यदल", "पुंकेसर", "परागकोश", "वर्तिकाग्र", "अंडाशय"] },
  watercycle: { what: "the water cycle over a river, hills and the sea, with the sun and clouds",
    en: ["evaporation", "condensation", "precipitation", "collection"], hi: ["वाष्पीकरण", "संघनन", "वर्षण", "संग्रहण"] },
  circuit: { what: "a simple closed electric circuit on a table: one dry cell, one switch, one torch bulb in a holder, connected by wires in a single loop",
    en: ["cell", "switch", "bulb", "wire"], hi: ["सेल", "स्विच", "बल्ब", "तार"] },
  plantcell: { what: "one plant cell as seen under a microscope, drawn as a clear school diagram",
    en: ["cell wall", "cell membrane", "nucleus", "cytoplasm", "vacuole", "chloroplast"], hi: ["कोशिका भित्ति", "कोशिका झिल्ली", "केंद्रक", "कोशिका द्रव्य", "रिक्तिका", "हरितलवक"] },
};
const STYLE = "Flat 2D school science diagram for children aged 10-12, clean white background, simple shapes, thin dark outlines, soft flat colours, no gradients, no shadows.";
const labelled = (s, lang) => `${STYLE} Show ${SUBJECTS[s].what}. Add exactly ${SUBJECTS[s][lang].length} text labels, ${lang === "hi" ? "in Hindi written in Devanagari script" : "in English"}, spelled exactly as given and nothing else: ${SUBJECTS[s][lang].map((w) => `"${w}"`).join(", ")}. Each label sits outside the drawing and is joined to the correct part by one thin straight leader line. No title, no other words, no numbers.`;
const base = (s) => `${STYLE} Show ${SUBJECTS[s].what}. Every listed part must be clearly visible and separate: ${SUBJECTS[s].en.join(", ")}. Leave empty white margin around the drawing. Absolutely no text, no letters, no numbers, no labels, no arrows and no leader lines anywhere in the image.`;

const rows = [];
async function gen(id, prompt, quality) {
  for (let attempt = 0; attempt < 4; attempt++) {
    await pace(); const t0 = Date.now();
    const r = await fetch(`${BASE}/images/generations`, { method: "POST", headers: { "api-key": KEY, "content-type": "application/json" },
      body: JSON.stringify({ model: IMG, prompt, size: "1024x1024", quality, n: 1, output_format: "png" }) });
    const ms = Date.now() - t0; const txt = await r.text(); let j = null; try { j = JSON.parse(txt); } catch {}
    if (r.status === 429) { await sleep(30000); continue; }
    const row = { id, quality, http: r.status, ms, usage: j?.usage ?? null };
    if (!r.ok || !j?.data?.[0]) { row.err = txt.slice(0, 300); rows.push(row); console.log(JSON.stringify(row)); return null; }
    const d = j.data[0]; const buf = d.b64_json ? Buffer.from(d.b64_json, "base64") : Buffer.from(await (await fetch(d.url)).arrayBuffer());
    const f = path.join(OUT, `${id}.png`); fs.writeFileSync(f, buf); row.bytes = buf.length; rows.push(row); console.log(JSON.stringify(row)); return { f, row };
  }
  rows.push({ id, err: "429 x4" }); return null;
}
async function vlm(prompt, file, json) {
  const t0 = Date.now(); const b64 = fs.readFileSync(file).toString("base64");
  const body = { model: VLM, max_completion_tokens: 4000, reasoning_effort: "low",
    messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: `data:image/png;base64,${b64}`, detail: "high" } }] }] };
  if (json) body.response_format = { type: "json_object" };
  const r = await fetch(`${BASE}/chat/completions`, { method: "POST", headers: { "api-key": KEY, "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({})); return { http: r.status, ms: Date.now() - t0, text: j.choices?.[0]?.message?.content ?? JSON.stringify(j).slice(0, 300), usage: j.usage?.prompt_tokens };
}
const OCR = "Transcribe every piece of visible text in this image exactly as written (keep the script; do not translate or correct spelling), one item per line. If there is no text at all, output exactly NONE.";

// I1 + I4: labelled, 4 subjects x 2 languages at low; flower + plantcell at medium too
const results = { labelled: [], bases: [] };
for (const s of Object.keys(SUBJECTS)) for (const lang of ["en", "hi"]) {
  const g = await gen(`L-${s}-${lang}-low`, labelled(s, lang), "low"); if (!g) continue;
  const o = await vlm(OCR, g.f, false); results.labelled.push({ id: `L-${s}-${lang}-low`, lang, requested: SUBJECTS[s][lang], ms: g.row.ms, ocr: o.text.split("\n").map((x) => x.trim()).filter(Boolean), ocr_ms: o.ms });
}
for (const s of ["flower", "plantcell"]) for (const lang of ["en", "hi"]) {
  const g = await gen(`L-${s}-${lang}-medium`, labelled(s, lang), "medium"); if (!g) continue;
  const o = await vlm(OCR, g.f, false); results.labelled.push({ id: `L-${s}-${lang}-medium`, lang, requested: SUBJECTS[s][lang], ms: g.row.ms, ocr: o.text.split("\n").map((x) => x.trim()).filter(Boolean), ocr_ms: o.ms });
}
// I2 + I3: text-free bases, OCR, and two independent anchor runs
const ANCH = (parts) => `This is a text-free school diagram. For each of these parts give ONE point that lies clearly INSIDE that part (not on its edge), as fractions of image width and height from the top-left (0..1). Parts: ${parts.join(", ")}. If a part is not visible, set "visible": false. Reply as JSON: {"parts":[{"id":"<part>","visible":true,"x":0.0,"y":0.0}]}`;
for (const s of Object.keys(SUBJECTS)) {
  const g = await gen(`B-${s}-low`, base(s), "low"); if (!g) continue;
  const o = await vlm(OCR, g.f, false); const a1 = await vlm(ANCH(SUBJECTS[s].en), g.f, true); const a2 = await vlm(ANCH(SUBJECTS[s].en), g.f, true);
  const parse = (t) => { try { return JSON.parse(t).parts; } catch { return null; } };
  const p1 = parse(a1.text), p2 = parse(a2.text);
  const drift = p1 && p2 ? p1.map((a) => { const b = p2.find((q) => q.id === a.id); return b && a.visible && b.visible ? +Math.hypot(a.x - b.x, a.y - b.y).toFixed(3) : null; }) : null;
  results.bases.push({ id: `B-${s}-low`, ms: g.row.ms, ocr: o.text.split("\n").map((x) => x.trim()).filter(Boolean), anchors_run1: p1, anchors_run2: p2, drift_run1_vs_run2: drift, anchor_ms: [a1.ms, a2.ms] });
}
// overlays for human inspection: run-1 anchors as numbered dots + host-rendered Hindi/English labels
const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
for (const b of results.bases) {
  if (!b.anchors_run1) continue; const s = b.id.split("-")[1]; const img = fs.readFileSync(path.join(OUT, `${b.id}.png`)).toString("base64");
  const dots = b.anchors_run1.filter((p) => p.visible).map((p, i) => { const hi = SUBJECTS[s].hi[SUBJECTS[s].en.indexOf(p.id)] ?? ""; const x = p.x * 1024, y = p.y * 1024;
    return `<circle cx="${x}" cy="${y}" r="10" fill="#C2410C" stroke="#fff" stroke-width="3"/><text x="${x + 16}" y="${y + 6}" font-size="22" font-family="sans-serif" fill="#1F1A14" stroke="#fff" stroke-width="5" paint-order="stroke">${p.id} / ${hi}</text>`; }).join("");
  await page.setContent(`<body style="margin:0"><svg width="1024" height="1024"><image href="data:image/png;base64,${img}" width="1024" height="1024"/>${dots}</svg></body>`);
  await page.screenshot({ path: path.join(OUT, `${b.id}-anchors.png`) });
}
await browser.close();
fs.writeFileSync(path.join(HERE, "diagrams-images-image-probe-2026-10-02.json"), JSON.stringify({ date: "2026-10-02", image_model: IMG, vlm: VLM, size: "1024x1024", rows, results }, null, 2));
console.log("done", rows.length);
