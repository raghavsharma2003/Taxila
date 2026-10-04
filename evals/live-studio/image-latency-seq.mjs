// Sequential re-run of the rate-limited cells (FLUX.2-pro capacity 1, gpt-image-2 capacity 4): one call per 65 s.
import fs from "node:fs";
import { loadEnv } from "./models.mjs";
loadEnv();
const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""), K = process.env.AZURE_OPENAI_API_KEY;
const HOST = new URL(E).host.split(".")[0];
const P = "Children's picture-book watercolour of a single green potted plant on a sunny windowsill in an Indian home, soft morning light, warm palette, plain background, absolutely no text, letters or numbers.";
const OUT = new URL("./img-2026-10-04/", import.meta.url).pathname;
const rows = JSON.parse(fs.readFileSync(OUT + "results.json", "utf8")).filter((r) => !r.error);
const plan = ["FLUX.2-pro/1024", "gpt-image-2/medium/1024", "FLUX.2-pro/768", "FLUX.2-pro/1024", "gpt-image-2/medium/1024", "FLUX.2-pro/768"];
for (const id of plan) {
  const t = performance.now();
  try {
    let r;
    if (id.startsWith("FLUX")) r = await fetch(`https://${HOST}.services.ai.azure.com/providers/blackforestlabs/v1/flux-2-pro?api-version=preview`, { method: "POST", headers: { "api-key": K, "content-type": "application/json" }, body: JSON.stringify({ model: "taxila-flux2", prompt: P, n: 1, width: +id.split("/")[1], height: +id.split("/")[1], output_format: "jpeg" }) });
    else r = await fetch(`${E}/images/generations`, { method: "POST", headers: { "api-key": K, "content-type": "application/json" }, body: JSON.stringify({ model: "taxila-image", prompt: P, n: 1, size: "1024x1024", quality: "medium" }) });
    const j = await r.json(); const ms = Math.round(performance.now() - t);
    if (!r.ok) { rows.push({ id, error: r.status }); console.log(id, "ERR", r.status); } else { rows.push({ id, ms, usage: j.usage }); console.log(id, ms); }
  } catch (e) { console.log(id, "ERR", e.message); }
  await new Promise((r) => setTimeout(r, 65_000));
}
fs.writeFileSync(OUT + "results.json", JSON.stringify(rows, null, 1));
