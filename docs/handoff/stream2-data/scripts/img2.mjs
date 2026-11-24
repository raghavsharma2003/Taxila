const E = process.env;
const ends = { primary: [E.AZURE_OPENAI_ENDPOINT, E.AZURE_OPENAI_API_KEY], [REDACTED:AZURE_AI_CENTRALINDIA_REGION]: [E.AZURE_AI_CENTRALINDIA_ENDPOINT, E.AZURE_AI_CENTRALINDIA_KEY] };
const deps = { DEPLOY_IMAGE: E.DEPLOY_IMAGE, FLARE: E.REFRESH_DEPLOY_IMAGE25_FLARE, SUNBURST: E.REFRESH_DEPLOY_IMAGE25_SUNBURST, MAI: E.REFRESH_DEPLOY_MAI_IMAGE26 };
for (const [en, [ep, key]] of Object.entries(ends)) for (const [dn, dep] of Object.entries(deps)) {
  if (!ep || !dep) continue;
  const base = ep.replace(/\/+$/, "").replace(/\/openai.*$/, "");
  const t0 = Date.now();
  const r = await fetch(`${base}/openai/deployments/${dep}/images/generations?api-version=2025-04-01-preview`, { method: "POST", headers: { "api-key": key, "content-type": "application/json" },
    body: JSON.stringify({ prompt: "A friendly children's-book illustration of a potato, one object, centred, plain light background; no people, no text.", n: 1, size: "1024x1024", quality: "low", output_format: "webp", output_compression: 60 }) }).catch((e) => ({ status: "ERR " + e.message }));
  const j = r.json ? await r.json().catch(() => ({})) : {};
  const b = j.data?.[0]?.b64_json;
  console.log(en, dn, dep, r.status, Date.now() - t0, "ms", b ? Math.round(b.length * 0.75 / 1024) + " KB" : String(j.error?.code ?? j.error?.message ?? "").slice(0, 80));
  if (b) { (await import("node:fs")).writeFileSync("/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/potato.webp", Buffer.from(b, "base64")); process.exit(0); }
}
