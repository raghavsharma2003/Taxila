// lamp1 (round 4, Asha option 4) image client: generations and edits on the Azure OpenAI image deployment
// (DEPLOY_IMAGE = taxila-image, gpt-image-2), with a spend ledger. Adapted from polish-r8/imgapi.mjs.
// Keys come from /home/user/Taxila/.env.local and are never printed or written. The ledger stores the prompt, sizes,
// usage and the estimated cost only (no headers, no endpoint URL).
// Cost model: text-in $5/M, image-in $10/M, image-out $30/M (gpt-image-2 retail read 2026-10-04, measurements.md
// `image-flare-low-vs-image2-2026-10-04`; image-in at $10/M is an overestimate). Refuses any call once the ledger
// reaches HARD_STOP (USD 23 of the USD 25 cap, ASHA brief).
//   import { edit, gen, spent } from "./imgapi.mjs";
import fs from "node:fs";
import path from "node:path";

const REPO = "/home/user/Taxila";
for (const line of fs.readFileSync(`${REPO}/.env.local`, "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "");
const K = process.env.AZURE_OPENAI_API_KEY;
export const DEP = process.env.DEPLOY_IMAGE || "taxila-image";
export const LEDGER = `${REPO}/docs/design/round4/asha/ledger.json`;
export const CAP = 25;
export const HARD_STOP = 23;

function readLedger() {
  return fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, "utf8")) : {
    about: "Every image call for round-4 Asha (option 4 lamplight flat). Deployment taxila-image (gpt-image-2) on AZURE_OPENAI_ENDPOINT (eastus2). usd = text-in $5/M + image-in $10/M + image-out $30/M from each call's usage. No keys, no headers, no URLs.",
    capUSD: CAP, hardStopUSD: HARD_STOP, calls: [], failures: [] };
}
const writeLedger = (L) => fs.writeFileSync(LEDGER, JSON.stringify(L, null, 1));
export function spent() { return readLedger().calls.reduce((s, c) => s + (c.usd || 0), 0); }
function cost(u) {
  if (!u) return 0.25; // unknown usage: book the high-quality estimate
  const d = u.input_tokens_details || {};
  const img = d.image_tokens ?? 0, txt = d.text_tokens ?? Math.max(0, (u.input_tokens ?? 0) - img);
  return txt * 5e-6 + img * 10e-6 + (u.output_tokens ?? 0) * 30e-6;
}

/**
 * One call. kind "gen" | "edit". images: [{file, name}] (first = the image to edit; PNG). mask: PNG path or null.
 * Returns the PNG buffer and writes a ledger row.
 */
export async function call({ tag, kind = "edit", prompt, images = [], mask = null, quality = "high", size = "1024x1024", fidelity = "high", stage = "" }) {
  const before = spent();
  if (before >= HARD_STOP) throw new Error(`ledger at $${before.toFixed(2)} >= hard stop $${HARD_STOP}; refusing ${tag}`);
  for (let i = 0; i < 6; i++) {
    const t0 = Date.now();
    let r;
    try {
      if (kind === "gen") {
        r = await fetch(`${E}/images/generations`, { method: "POST", headers: { "api-key": K, "content-type": "application/json" },
          body: JSON.stringify({ model: DEP, prompt, n: 1, size, quality }), signal: AbortSignal.timeout(400_000) });
      } else {
        const fd = new FormData();
        fd.append("model", DEP); fd.append("prompt", prompt); fd.append("n", "1"); fd.append("size", size);
        fd.append("quality", quality); fd.append("input_fidelity", fidelity);
        for (const im of images) fd.append("image[]", new Blob([fs.readFileSync(im.file)], { type: "image/png" }), im.name || path.basename(im.file));
        if (mask) fd.append("mask", new Blob([fs.readFileSync(mask)], { type: "image/png" }), "mask.png");
        r = await fetch(`${E}/images/edits`, { method: "POST", headers: { "api-key": K }, body: fd, signal: AbortSignal.timeout(400_000) });
      }
    } catch (e) {
      console.log(`[img] ${tag} network ${String(e.message).slice(0, 100)}; retry`);
      await new Promise((s) => setTimeout(s, 15000 * (i + 1)));
      continue;
    }
    const ms = Date.now() - t0;
    if (r.ok) {
      const j = await r.json();
      const usd = cost(j.usage);
      const L = readLedger();
      L.calls.push({ tag, stage, kind, deploy: DEP, quality, size, fidelity: kind === "edit" ? fidelity : null, masked: !!mask,
        src: images.map((x) => path.basename(x.file)), ms, attempts: i + 1, usage: j.usage ?? null, usd: +usd.toFixed(4),
        date: new Date().toISOString(), prompt });
      writeLedger(L);
      if (!j.data?.[0]?.b64_json) throw new Error(`${tag}: no image in response`);
      console.log(`[img] ${tag} ok ${(ms / 1000).toFixed(1)} s out=${j.usage?.output_tokens ?? "?"} $${usd.toFixed(3)} (total $${(before + usd).toFixed(2)})`);
      return Buffer.from(j.data[0].b64_json, "base64");
    }
    const t = (await r.text()).slice(0, 400).replace(/https?:\/\/\S+/g, "<url>");
    const L = readLedger(); L.failures.push({ tag, status: r.status, body: t, date: new Date().toISOString() }); writeLedger(L);
    if (r.status !== 429 && r.status < 500) throw new Error(`${tag} HTTP ${r.status}: ${t}`);
    console.log(`[img] ${tag} retry ${r.status}`);
    await new Promise((s) => setTimeout(s, 20000 * (i + 1)));
  }
  throw new Error(`${tag}: retries exhausted`);
}
export const edit = (o) => call({ ...o, kind: "edit" });
export const gen = (o) => call({ ...o, kind: "gen" });
