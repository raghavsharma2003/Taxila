// Foundry image-edit client with a spend ledger (PLAN §9.3). Keys come from .env.local and are never logged; the
// ledger stores prompt, sizes, usage and the estimated cost only (no headers).
//   import { edit, spent } from "./imgapi.mjs";
// Cost model (conservative, overestimates): text-in $5/M, image-in $10/M, image-out $40/M (gpt-image-1 list; the
// gpt-image-2 retail read 2026-10-04 is $30/M out, measurements.md). Refuses any call once the ledger passes HARD_STOP.
import fs from "node:fs";
import path from "node:path";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "");
const K = process.env.AZURE_OPENAI_API_KEY;
export const DEP = process.env.P2D_IMAGE_DEPLOY || process.env.DEPLOY_IMAGE || "taxila-image";
export const LEDGER = "art/character/puppet2d/ledger.json";
export const HARD_STOP = 28;

function readLedger() {
  return fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, "utf8")) : { capUSD: 30, hardStopUSD: HARD_STOP, calls: [] };
}
export function spent() {
  return readLedger().calls.reduce((s, c) => s + (c.usd || 0), 0);
}
function cost(u) {
  if (!u) return 0.3; // unknown usage: book the high-quality estimate
  const d = u.input_tokens_details || {};
  const img = d.image_tokens ?? 0, txt = d.text_tokens ?? Math.max(0, (u.input_tokens ?? 0) - img);
  return txt * 5e-6 + img * 10e-6 + (u.output_tokens ?? 0) * 40e-6;
}

/**
 * One edit call. images: [{file, name}] (first = the image to edit); mask: PNG path (transparent = editable) or null.
 * Returns the PNG buffer. Writes a ledger row (arm "P").
 */
export async function edit({ tag, prompt, images, mask = null, quality = "medium", size = "1024x1024", fidelity = "high" }) {
  const before = spent();
  if (before >= HARD_STOP) throw new Error(`ledger at $${before.toFixed(2)} >= hard stop $${HARD_STOP}; refusing ${tag}`);
  for (let i = 0; i < 6; i++) {
    const fd = new FormData();
    fd.append("model", DEP);
    fd.append("prompt", prompt);
    fd.append("n", "1");
    fd.append("size", size);
    fd.append("quality", quality);
    fd.append("input_fidelity", fidelity);
    for (const im of images) fd.append("image[]", new Blob([fs.readFileSync(im.file)], { type: "image/png" }), im.name || path.basename(im.file));
    if (mask) fd.append("mask", new Blob([fs.readFileSync(mask)], { type: "image/png" }), "mask.png");
    const t0 = Date.now();
    let r;
    try {
      r = await fetch(`${E}/images/edits`, { method: "POST", headers: { "api-key": K }, body: fd });
    } catch (e) {
      console.log(`[img] ${tag} network ${e.message}; retry`);
      await new Promise((s) => setTimeout(s, 15000));
      continue;
    }
    if (r.ok) {
      const j = await r.json();
      const usd = cost(j.usage);
      const L = readLedger();
      L.calls.push({ arm: "P", tag, deploy: DEP, quality, size, fidelity, masked: !!mask, nImages: images.length, ms: Date.now() - t0, usage: j.usage ?? null, usd: +usd.toFixed(4), date: new Date().toISOString(), prompt });
      fs.writeFileSync(LEDGER, JSON.stringify(L, null, 1));
      console.log(`[img] ${tag} ok ${((Date.now() - t0) / 1000).toFixed(1)} s $${usd.toFixed(3)} (total $${(before + usd).toFixed(2)})`);
      return Buffer.from(j.data[0].b64_json, "base64");
    }
    const t = (await r.text()).slice(0, 400);
    if (r.status !== 429 && r.status < 500) throw new Error(`${tag} HTTP ${r.status}: ${t}`);
    console.log(`[img] ${tag} retry ${r.status}`);
    await new Promise((s) => setTimeout(s, 20000 * (i + 1)));
  }
  throw new Error(`${tag}: retries exhausted`);
}
