const { resolveLane } = await import("/home/user/Taxila/server/endpoints.js");
const { DEPLOY } = await import("/home/user/Taxila/server/azure.js");
const lane = resolveLane("IMAGE");
const prompt = "A friendly children's-book illustration of a potato, one object, centred, plain light background, soft colours, simple shapes; no people, no faces, no hands, no text, no letters, no numbers, no logos.";
const t0 = Date.now();
const r = await fetch(`${lane.endpoint}/openai/deployments/${DEPLOY.image}/images/generations?api-version=2025-04-01-preview`, { method: "POST", headers: { "api-key": lane.key, "content-type": "application/json" },
  body: JSON.stringify({ prompt, n: 1, size: "1024x1024", quality: "low", output_format: "webp", output_compression: 60 }) });
const j = await r.json().catch(() => ({}));
const b = j.data?.[0]?.b64_json;
console.log(r.status, DEPLOY.image, Date.now() - t0, "ms", b ? Math.round(b.length * 0.75 / 1024) + " KB" : JSON.stringify(j).slice(0, 300));
if (b) (await import("node:fs")).writeFileSync("/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/potato.webp", Buffer.from(b, "base64"));
