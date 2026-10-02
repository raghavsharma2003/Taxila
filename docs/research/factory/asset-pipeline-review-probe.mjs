// Principal-review probe for asset-pipeline.md (2026-10-02).
// Usage: node --env-file=.env.local docs/research/factory/asset-pipeline-review-probe.mjs
// Measures: (1) gpt-4o-mini-tts on Azure accepts voice marin / cedar (AP11/§7.3 claim);
// (2) image quota semantics (M-AP8): two back-to-back n=4 low generations — does the 2nd 429?;
// (3) speech-to-text quota: 5 back-to-back transcriptions of one short clip — any 429? (the doc's
// WER round trip runs one transcription per voice line); (4) ARM read-only: the image deployment's
// capacity (RPM) and sku. Never prints a key. Writes asset-pipeline-review-probe-2026-10-02.json.
import { writeFileSync } from "node:fs";
const E = process.env;
const BASE = E.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "");
const V1 = /\/openai\/v1$/.test(BASE) ? BASE : `${BASE}/openai/v1`;
const H = { "api-key": E.AZURE_OPENAI_API_KEY, "content-type": "application/json" };
const out = { date: "2026-10-02", tts: [], image: [], stt: [], arm: {} };
const t = () => performance.now();

// (1) TTS voices
let clip = null;
for (const voice of ["marin", "cedar", "coral"]) {
  const s = t();
  const r = await fetch(`${V1}/audio/speech`, { method: "POST", headers: H, body: JSON.stringify({
    model: E.DEPLOY_TTS || "gpt-4o-mini-tts", voice, input: "Shabaash! Ab agla level kholte hain.", response_format: "mp3" }) });
  const buf = r.ok ? Buffer.from(await r.arrayBuffer()) : null;
  if (buf && !clip) clip = buf;
  out.tts.push({ voice, http: r.status, ms: Math.round(t() - s), bytes: buf?.length ?? 0, err: r.ok ? null : (await r.text()).slice(0, 300) });
}

// (2) image quota semantics: two n=4 low requests fired 1 s apart
const imgBody = JSON.stringify({ model: E.DEPLOY_IMAGE || "taxila-image", prompt: "flat vector steel tumbler, thick dark outline, transparent background",
  size: "1024x1024", quality: "low", background: "transparent", output_format: "png", n: 4 });
const fire = async (i) => { const s = t(); const r = await fetch(`${V1}/images/generations`, { method: "POST", headers: H, body: imgBody });
  const j = await r.json().catch(() => ({}));
  return { i, http: r.status, ms: Math.round(t() - s), images: j.data?.length ?? 0, outTokens: j.usage?.output_tokens ?? null,
    retryAfter: r.headers.get("retry-after"), remainingReq: r.headers.get("x-ratelimit-remaining-requests"),
    err: r.ok ? null : JSON.stringify(j).slice(0, 300) }; };
const p1 = fire(1); await new Promise((r) => setTimeout(r, 1000)); const p2 = fire(2);
await new Promise((r) => setTimeout(r, 1000)); const p3 = fire(3);
out.image = await Promise.all([p1, p2, p3]);

// (3) STT burst
if (clip) {
  const model = E.DEPLOY_TRANSCRIBE || "taxila-transcribe";
  const jobs = [];
  for (let i = 0; i < 5; i++) {
    const fd = new FormData(); fd.append("file", new Blob([clip], { type: "audio/mpeg" }), "line.mp3");
    const s = t();
    jobs.push(fetch(`${BASE.replace(/\/openai\/v1$/, "")}/openai/deployments/${model}/audio/transcriptions?api-version=2025-03-01-preview`, { method: "POST", headers: { "api-key": E.AZURE_OPENAI_API_KEY }, body: fd })
      .then(async (r) => ({ i, http: r.status, ms: Math.round(t() - s), retryAfter: r.headers.get("retry-after"),
        text: r.ok ? (await r.json()).text : (await r.text()).slice(0, 200) })));
  }
  out.stt = await Promise.all(jobs);
}

// (4) ARM read-only: deployment capacity
try {
  const tok = await fetch(`https://login.microsoftonline.com/${E.AZURE_TENANT_ID}/oauth2/v2.0/token`, { method: "POST",
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: E.AZURE_SP_CLIENT_ID, client_secret: E.AZURE_SP_SECRET,
      scope: "https://management.azure.com/.default" }) }).then((r) => r.json());
  const A = { authorization: `Bearer ${tok.access_token}` };
  const sub = E.AZURE_SUBSCRIPTION_ID, rg = E.AZURE_RESOURCE_GROUP;
  const accts = await fetch(`https://management.azure.com/subscriptions/${sub}/resourceGroups/${rg}/providers/Microsoft.CognitiveServices/accounts?api-version=2024-10-01`, { headers: A }).then((r) => r.json());
  out.arm.accounts = [];
  for (const a of accts.value ?? []) {
    const d = await fetch(`https://management.azure.com${a.id}/deployments?api-version=2024-10-01`, { headers: A }).then((r) => r.json());
    out.arm.accounts.push({ kind: a.kind, location: a.location, deployments: (d.value ?? []).map((x) => ({ name: x.name,
      model: `${x.properties?.model?.name}@${x.properties?.model?.version}`, sku: x.sku?.name, capacity: x.sku?.capacity,
      rateLimits: x.properties?.rateLimits })) });
  }
  const tiers = await fetch(`https://management.azure.com/subscriptions/${sub}/providers/Microsoft.CognitiveServices/quotaTiers?api-version=2025-10-01-preview`, { headers: A });
  out.arm.quotaTiers = { http: tiers.status, body: (await tiers.text()).slice(0, 800) };
} catch (e) { out.arm.error = String(e).slice(0, 300); }

writeFileSync(new URL("./asset-pipeline-review-probe-2026-10-02.json", import.meta.url), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
