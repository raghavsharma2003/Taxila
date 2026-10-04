// Live Studio probe: image latency for the in-lesson window (text-free art only: generated-media-carries-facts).
// gpt-image-2 low vs medium (taxila-image) and FLUX.2-pro (taxila-flux2) at 1024x1024 and 768x768; n = 3 per cell.
import fs from "node:fs";
import { loadEnv } from "./models.mjs";
loadEnv();
const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""), K = process.env.AZURE_OPENAI_API_KEY;
const HOST = new URL(E).host.split(".")[0];
const OUT = new URL("./img-2026-10-04/", import.meta.url).pathname;
const P = "Children's picture-book watercolour of a single green potted plant on a sunny windowsill in an Indian home, soft morning light, warm palette, plain background, absolutely no text, letters or numbers.";
async function oai(quality, size) {
  const r = await fetch(`${E}/images/generations`, { method: "POST", headers: { "api-key": K, "content-type": "application/json" }, body: JSON.stringify({ model: "taxila-image", prompt: P, n: 1, size, quality }) });
  const j = await r.json(); if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j).slice(0, 160)}`); return { b64: j.data[0].b64_json, usage: j.usage };
}
async function flux(w) {
  const r = await fetch(`https://${HOST}.services.ai.azure.com/providers/blackforestlabs/v1/flux-2-pro?api-version=preview`, { method: "POST", headers: { "api-key": K, "content-type": "application/json" }, body: JSON.stringify({ model: "taxila-flux2", prompt: P, n: 1, width: w, height: w, output_format: "jpeg" }) });
  const j = await r.json(); if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j).slice(0, 160)}`); return { b64: j.data[0].b64_json };
}
const cells = { "gpt-image-2/low/1024": () => oai("low", "1024x1024"), "gpt-image-2/medium/1024": () => oai("medium", "1024x1024"), "FLUX.2-pro/1024": () => flux(1024), "FLUX.2-pro/768": () => flux(768) };
const rows = [];
await Promise.all(Object.entries(cells).map(async ([id, fn]) => { for (let s = 0; s < 3; s++) { const t = performance.now(); try { const o = await fn(); const ms = Math.round(performance.now() - t); fs.writeFileSync(`${OUT}${id.replace(/\//g, "_")}_${s}.img`, Buffer.from(o.b64, "base64")); rows.push({ id, s, ms, usage: o.usage, bytes: o.b64.length * 0.75 | 0 }); console.log(id, s, ms, JSON.stringify(o.usage || {})); } catch (e) { rows.push({ id, s, error: e.message }); console.log(id, s, "ERR", e.message); } } }));
fs.writeFileSync(`${OUT}results.json`, JSON.stringify(rows, null, 1));
