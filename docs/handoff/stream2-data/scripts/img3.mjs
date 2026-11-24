const E = process.env;
const base = E.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "").replace(/\/openai.*$/, "");
for (const [dep, body] of [[E.REFRESH_DEPLOY_IMAGE25_FLARE, { output_format: "jpeg", output_compression: 60 }], [E.DEPLOY_IMAGE, { output_format: "jpeg", output_compression: 60 }], [E.REFRESH_DEPLOY_IMAGE25_SUNBURST, { output_format: "jpeg", output_compression: 60 }]]) {
  const t0 = Date.now();
  const r = await fetch(`${base}/openai/deployments/${dep}/images/generations?api-version=2025-04-01-preview`, { method: "POST", headers: { "api-key": E.AZURE_OPENAI_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({ prompt: "A friendly children's-book illustration of a potato, one object, centred, plain light background; no people, no text.", n: 1, size: "1024x1024", quality: "low", ...body }) });
  const j = await r.json().catch(() => ({}));
  const b = j.data?.[0]?.b64_json;
  console.log(dep, JSON.stringify(body), r.status, Date.now() - t0, "ms", b ? Math.round(b.length * 0.75 / 1024) + " KB" : String(j.error?.message ?? "").slice(0, 200));
  if (b) { (await import("node:fs")).writeFileSync(`/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/potato.${body.output_format}`, Buffer.from(b, "base64")); break; }
}
