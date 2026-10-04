// Smoke: call route for FLUX.2-flex and gpt-image-2 low; vision ability of candidate non-OpenAI judges. Prints no keys.
import { writeFileSync, readFileSync } from "node:fs";
const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, ""), K = process.env.AZURE_OPENAI_API_KEY;
const HOST = E.match(/^https:\/\/([^.]+)\./)[1];
const OUT = new URL("results/smoke/", import.meta.url).pathname;
async function post(url, body) { const t = performance.now(); const r = await fetch(url, { method: "POST", headers: { "api-key": K, "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(240000) }); const j = await r.json().catch(() => ({})); return { ok: r.ok, http: r.status, j, ms: Math.round(performance.now() - t) }; }
const which = process.argv[2] || "all";
const P = "A shallow woven basket of raw green mangoes, gouache painting on warm paper, no text";
if (which === "all" || which === "flex") for (const route of ["flux-2-flex"]) {
  const r = await post(`https://${HOST}.services.ai.azure.com/providers/blackforestlabs/v1/${route}?api-version=preview`, { model: "taxila-flux2-flex", prompt: P, n: 1, width: 1024, height: 1024, output_format: "png", seed: 1 });
  const b = r.j.data?.[0]?.b64_json; if (b) writeFileSync(OUT + "flex.png", Buffer.from(b, "base64"));
  console.log("flex", route, r.http, r.ms, b ? "png" : JSON.stringify(r.j).slice(0, 300), JSON.stringify(Object.keys(r.j)));
}
if (which === "all" || which === "low") {
  const r = await post(`${E}/images/generations`, { model: "taxila-image", prompt: P, n: 1, size: "1024x1024", quality: "low" });
  console.log("gpt-image-2 low", r.http, r.ms, JSON.stringify(r.j.usage || r.j).slice(0, 300));
}
if (which === "all" || which === "judges") {
  const img = readFileSync(new URL("../../model-scout-2026-10-04/images/results/img/d3-circuit__FLUX.2-pro__0.jpg", import.meta.url)).toString("base64");
  for (const dep of [process.env.REFRESH_DEPLOY_MISTRAL_M35, process.env.REFRESH_DEPLOY_KIMI26, "taxila-kimi-code"]) {
    const r = await post(`${E}/chat/completions`, { model: dep, max_tokens: 4000, messages: [{ role: "user", content: [{ type: "text", text: "Describe exactly what each label's leader line touches in this circuit diagram, and whether the switch is open or closed. Short." }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${img}` } }] }] });
    console.log("judge", dep, r.http, r.ms, JSON.stringify(r.j.choices?.[0]?.message?.content || r.j).slice(0, 700), JSON.stringify(r.j.usage || {}));
  }
}
