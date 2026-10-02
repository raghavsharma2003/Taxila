// asset-probe2.mjs — sprite sheets, transparent edits, n>1 batching on taxila-image (2026-10-02).
//  S1 edit + background:"transparent": does the edit endpoint return alpha?
//  S2 2x2 walk-cycle sheet from the character reference (frames sliced and measured by asset-postprocess-probe2.py)
//  S3 n=4 in one generation call: latency and per-image tokens (variant picking for the VLM judge)
//  S4 multi-reference: character sheet + a separate palette/style swatch board as two image[] inputs
// Usage: OUT=<dir with C-protege-sheet.png> node --env-file=.env.local docs/research/factory/asset-probe2.mjs
import fs from "node:fs"; import path from "node:path";
const BASE = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""); const KEY = process.env.AZURE_OPENAI_API_KEY;
const MODEL = process.env.DEPLOY_IMAGE || "taxila-image"; const OUT = process.env.OUT || "/tmp/asset-probe";
const rows = []; const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); let last = 0;
async function pace() { const g = 15500 - (Date.now() - last); if (g > 0) await sleep(g); last = Date.now(); }
async function call(id, kind, body, refs = []) {
  await pace(); const t0 = Date.now(); let r;
  if (kind === "gen") r = await fetch(`${BASE}/images/generations`, { method: "POST", headers: { "api-key": KEY, "content-type": "application/json" }, body: JSON.stringify({ model: MODEL, ...body }) });
  else { const fd = new FormData(); fd.append("model", MODEL); for (const [k, v] of Object.entries(body)) fd.append(k, String(v));
    for (const f of refs) fd.append("image[]", new Blob([fs.readFileSync(f)], { type: "image/png" }), path.basename(f));
    r = await fetch(`${BASE}/images/edits`, { method: "POST", headers: { "api-key": KEY }, body: fd }); }
  const ms = Date.now() - t0; const txt = await r.text(); let j = null; try { j = JSON.parse(txt); } catch {}
  const row = { id, kind, http: r.status, ms, n: j?.data?.length || 0, usage: j?.usage || null, req: { ...body, prompt: body.prompt.slice(0, 140), refs: refs.map((f) => path.basename(f)) } };
  if (!r.ok) row.err = txt.slice(0, 400);
  (j?.data || []).forEach((d, i) => { const b = Buffer.from(d.b64_json, "base64"); const f = path.join(OUT, `${id}${j.data.length > 1 ? "-" + i : ""}.png`); fs.writeFileSync(f, b); row[`colorType${i}`] = b[25]; });
  rows.push(row); console.log(JSON.stringify(row)); return row;
}
const SHEET = path.join(OUT, "C-protege-sheet.png");
const STYLE = "flat 2D vector, uniform thick dark-brown outline, flat fills with one shade tone, no gradients, no text";
await call("S1-edit-transparent", "edit", { prompt: `The exact same character Golu from the reference, same face, hair, skin tone, clothes, ${STYLE}. Single full-body pose: jumping with both arms up, happy. Transparent background.`, size: "1024x1024", quality: "low", background: "transparent", output_format: "png" }, [SHEET]);
await call("S2-walk-sheet", "edit", { prompt: `Sprite sheet of the exact same character Golu from the reference, ${STYLE}. A 2x2 grid of four equal square cells, one full-body figure per cell, side view facing right, walk cycle: cell 1 contact (left foot forward), cell 2 passing, cell 3 contact (right foot forward), cell 4 passing. Same size, same scale and same ground line in every cell, figure centred in its cell, nothing crossing cell borders. Transparent background.`, size: "1024x1024", quality: "medium", background: "transparent", output_format: "png" }, [SHEET]);
await call("S3-n4-goat", "gen", { prompt: `Friendly cartoon goat character for a children's maths game, ${STYLE}, full body, standing, centred.`, n: 4, size: "1024x1024", quality: "low", background: "transparent", output_format: "png" });
// S4: build a palette swatch board locally (pure PIL-free: write a tiny SVG → PNG is not available here, so reuse the mango as the 'style' ref)
await call("S4-multiref", "edit", { prompt: `Image 1 is the character Golu. Image 2 is the house illustration style (outline weight, flat fills, palette). Draw Golu sitting cross-legged on the floor eating a mango, in the style of image 2, ${STYLE}. Transparent background.`, size: "1024x1024", quality: "low", background: "transparent", output_format: "png" }, [SHEET, path.join(OUT, "A-transparent.png")]);
fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "asset-probe2-2026-10-02.json"), JSON.stringify({ date: "2026-10-02", model: MODEL, rows }, null, 2));
console.log("done", rows.length);
