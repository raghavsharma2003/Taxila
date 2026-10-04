// India move, Provision AI (docs/ops/INDIA-MOVE.md §4/§6). Mirrors the router's eastus2 Foundry deployments onto the
// South India AIServices account `taxila-ai-southindia` under the SAME deployment names (so DEPLOY_* never changes),
// copying model/version/format/SKU/capacity/upgrade option/RAI policy from the live eastus2 deployment. Idempotent:
// an existing SI deployment with the same model is left alone. Quota is checked before every PUT against the SI
// usages API; most GlobalStandard quotas are POOLED across the subscription (survey §2.1), so a twin that does not fit
// is skipped and written up as a quota request instead of being attempted.
// Never prints a key. `--env` writes the *_SIN names into .env.local (values copied from keys already there / ARM
// listKeys) without echoing them. Touches nothing on taxila-web and nothing on the eastus2 account (read-only there).
//   NODE_USE_ENV_PROXY=1 node scripts/region/foundry-si.mjs [--deploy] [--verify] [--env] [--only REGEX] [--n 3]
import { readFileSync, writeFileSync, appendFileSync, mkdirSync } from "fs";
import { ROOT, arm, loadEnv, SUB_PATH, sleep } from "../../infra/azure.mjs";

loadEnv();
const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f, d) => (has(f) ? argv[argv.indexOf(f) + 1] : d);
const ONLY = has("--only") ? new RegExp(val("--only")) : null;
const N = Number(val("--n", 3));
const DO_DEPLOY = has("--deploy"), DO_VERIFY = has("--verify"), DO_ENV = has("--env");
const RG = process.env.AZURE_RESOURCE_GROUP || "rg-raghavsharma1729-7190";
const SRC = process.env.TAXILA_FOUNDRY_SOURCE_ACCOUNT || "raghavsharma1729-compan-resource";
const DST = process.env.TAXILA_FOUNDRY_TARGET_ACCOUNT || "taxila-ai-southindia";
const REGION = process.env.TAXILA_TARGET_REGION || "southindia";
const API = "api-version=2024-10-01";
const acct = (n) => `${SUB_PATH()}/resourceGroups/${RG}/providers/Microsoft.CognitiveServices/accounts/${n}`;
const OUTDIR = ROOT + "node_modules/.cache/india-move/";
mkdirSync(OUTDIR, { recursive: true });

// Priority order = what a live lesson waits on first. Pooled quota is consumed in this order.
// kind: chat | responses | transcribe | embed | flux2 | kontext | realtime (verify path).
const PLAN = [
  ["taxila-fast", "chat"], ["taxila-brain", "chat"], ["grok-4-1-fast-non-reasoning", "chat"], ["DeepSeek-V4-Pro", "chat"],
  ["taxila-transcribe", "transcribe"], ["text-embedding-3-small", "embed"], ["taxila-gpt6", "chat"], ["taxila-gpt6-luna", "chat"],
  ["taxila-codex", "responses"], ["gpt-5.6-terra", "chat"], ["DeepSeek-V4-Flash", "chat"], ["grok-4-20-non-reasoning", "chat"],
  ["taxila-oss120", "chat"], ["taxila-flux2", "flux2"], ["taxila-kontext", "kontext"], ["taxila-fast-bg", "chat"], ["taxila-studio-sol", "chat"],
  ["taxila-realtime", "realtime"], ["gpt-realtime-2.1-mini", "realtime"], ["taxila-live", "realtime"], ["taxila-live-transcribe", "realtime"],
  // Pre-existing in SI only (no eastus2 twin); verified, never re-created.
  ["taxila-mai-tx2-stream", "realtime-tx"],
].filter(([n]) => !ONLY || ONLY.test(n));

const state = { at: new Date().toISOString(), region: REGION, source: SRC, target: DST, rows: [] };
const row = (name) => { let r = state.rows.find((x) => x.name === name); if (!r) state.rows.push(r = { name }); return r; };

async function usages() {
  const j = await arm("GET", `${SUB_PATH()}/providers/Microsoft.CognitiveServices/locations/${REGION}/usages?${API}`);
  return (j.value || []).map((u) => ({ name: u.name?.value, used: u.currentValue, limit: u.limit }));
}

if (DO_DEPLOY) {
  const srcDeps = (await arm("GET", `${acct(SRC)}/deployments?${API}`)).value || [];
  const dstDeps = (await arm("GET", `${acct(DST)}/deployments?${API}`)).value || [];
  for (const [name] of PLAN) {
    const r = row(name);
    const have = dstDeps.find((d) => d.name === name);
    const src = srcDeps.find((d) => d.name === name);
    if (have) { Object.assign(r, { action: "exists", model: `${have.properties.model.name}@${have.properties.model.version}`, sku: have.sku.name, capacity: have.sku.capacity }); console.log(name.padEnd(30), "exists", r.capacity); continue; }
    if (!src) { Object.assign(r, { action: "no-source" }); console.log(name.padEnd(30), "no eastus2 source deployment"); continue; }
    const m = src.properties.model, sku = src.sku;
    Object.assign(r, { model: `${m.name}@${m.version}`, sku: sku.name, wantCapacity: sku.capacity });
    const us = await usages();
    const q = us.find((u) => u.name?.endsWith(`.${sku.name}.${m.name}`));
    if (q) Object.assign(r, { quotaRow: q.name, quotaBefore: `${q.used}/${q.limit}` });
    const free = q ? q.limit - q.used : Infinity;
    if (free < sku.capacity) {
      // Deploy what fits only if it is a meaningful share; a 1-unit realtime twin would mislead the latency bench.
      Object.assign(r, { action: "quota-short", free, need: sku.capacity, request: { model: m.name, region: REGION, sku: sku.name, quotaRow: q.name, from: q.limit, to: q.limit + sku.capacity, units: "x1000 TPM (or requests per sku)" } });
      console.log(name.padEnd(30), `QUOTA SHORT ${q.used}/${q.limit}, need +${sku.capacity}`);
      continue;
    }
    const body = { sku: { name: sku.name, capacity: sku.capacity }, properties: { model: { format: m.format, name: m.name, version: m.version },
      versionUpgradeOption: src.properties.versionUpgradeOption, raiPolicyName: src.properties.raiPolicyName || "Microsoft.DefaultV2" } };
    try {
      await arm("PUT", `${acct(DST)}/deployments/${name}?${API}`, body);
      let st;
      for (let i = 0; i < 90; i++) { const d = await arm("GET", `${acct(DST)}/deployments/${name}?${API}`); st = d.properties?.provisioningState; if (/Succeeded|Failed|Canceled/.test(st)) break; await sleep(5000); }
      Object.assign(r, { action: st === "Succeeded" ? "created" : `state:${st}`, capacity: sku.capacity });
      console.log(name.padEnd(30), r.action, sku.capacity);
    } catch (e) { Object.assign(r, { action: "error", err: String(e.message).slice(0, 300) }); console.log(name.padEnd(30), "ERROR", r.err); }
  }
  const after = await usages();
  for (const r of state.rows) if (r.quotaRow) { const q = after.find((u) => u.name === r.quotaRow); if (q) r.quotaAfter = `${q.used}/${q.limit}`; }
}

// ---- endpoints + keys (never printed) ----
const E = process.env;
const EUS = (E.AZURE_OPENAI_ENDPOINT || "").replace(/\/+$/, "").replace(/\/openai\/v1$/, "");
const EUSK = E.AZURE_OPENAI_API_KEY;
const SIH = `https://${DST}.openai.azure.com`, SISVC = `https://${DST}.services.ai.azure.com`;
let SIK = E.AZURE_OPENAI_API_KEY_SIN || E.AZURE_AI_SOUTHINDIA_KEY;
if (!SIK) SIK = (await arm("POST", `${acct(DST)}/listKeys?${API}`)).key1;

if (DO_ENV) {
  const cur = readFileSync(ROOT + ".env.local", "utf8");
  const add = {
    AZURE_OPENAI_ENDPOINT_SIN: `${SIH}/openai/v1`,
    AZURE_OPENAI_API_KEY_SIN: SIK,
    AZURE_AI_SERVICES_ENDPOINT_SIN: SISVC,
    // South India serves no Azure Speech (survey §2.3): DragonHD stays on taxila-ai-centralindia, the nearest region.
    AZURE_SPEECH_REGION_SIN: E.AZURE_AI_CENTRALINDIA_REGION || "centralindia",
    AZURE_SPEECH_KEY_SIN: E.AZURE_AI_CENTRALINDIA_KEY,
  };
  const lines = Object.entries(add).filter(([k, v]) => v && !new RegExp(`^${k}=`, "m").test(cur)).map(([k, v]) => `${k}=${v}`);
  if (lines.length) appendFileSync(ROOT + ".env.local", (cur.endsWith("\n") ? "" : "\n") + "# India move (scripts/region/foundry-si.mjs): South India Foundry + Central India Speech\n" + lines.join("\n") + "\n");
  console.log("env names written:", lines.map((l) => l.split("=")[0]).join(", ") || "(all present)");
}

// ---- verification: one tiny call per deployment, TTFT from this (US) container; eastus2 twin interleaved ----
const PROMPT = [{ role: "system", content: "You are a warm Hinglish teacher for a 9-year-old. Reply in at most 12 words." }, { role: "user", content: "Didi, 3/4 bada hai ya 2/3?" }];
const REASONING_NONE = /^(taxila-fast|taxila-fast-bg|taxila-brain|taxila-studio-sol|gpt-5\.6-terra|taxila-gpt6|taxila-gpt6-luna)$/;
async function streamTTFT(url, key, body, isDelta) {
  const t0 = performance.now();
  const r = await fetch(url, { method: "POST", headers: { "api-key": key, "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) return { ok: false, http: r.status, err: (await r.text()).slice(0, 240) };
  const reader = r.body.getReader(), dec = new TextDecoder(); let buf = "", ttft = null, text = "", served;
  for (;;) {
    const { value, done } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    let i; while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue; const d = line.slice(5).trim(); if (d === "[DONE]") continue;
      let j; try { j = JSON.parse(d); } catch { continue; }
      served ||= j.model || j.response?.model;
      const delta = isDelta(j); if (delta) { if (ttft == null) ttft = performance.now() - t0; text += delta; }
    }
  }
  return { ok: ttft != null, http: r.status, ttftMs: ttft == null ? null : Math.round(ttft), totalMs: Math.round(performance.now() - t0), served, out: text.slice(0, 80) };
}
async function chat(base, key, dep) {
  const body = { model: dep, messages: PROMPT, max_completion_tokens: 300, stream: true, ...(REASONING_NONE.test(dep) ? { reasoning_effort: "none" } : {}) };
  let r = await streamTTFT(`${base}/openai/v1/chat/completions`, key, body, (j) => j.choices?.[0]?.delta?.content);
  if (!r.ok && r.http === 400 && body.reasoning_effort) { delete body.reasoning_effort; r = await streamTTFT(`${base}/openai/v1/chat/completions`, key, body, (j) => j.choices?.[0]?.delta?.content); r.note = "no reasoning_effort"; }
  return r;
}
const responses = (base, key, dep) => streamTTFT(`${base}/openai/v1/responses`, key, { model: dep, input: PROMPT, max_output_tokens: 400, stream: true, reasoning: { effort: "low" } },
  (j) => (j.type === "response.output_text.delta" ? j.delta : null));
async function timed(fn) { const t0 = performance.now(); const r = await fn(); return { ...r, totalMs: Math.round(performance.now() - t0) }; }
const embed = (base, key, dep) => timed(async () => {
  const r = await fetch(`${base}/openai/v1/embeddings`, { method: "POST", headers: { "api-key": key, "content-type": "application/json" }, body: JSON.stringify({ model: dep, input: ["teen bata chaar"] }) });
  const j = await r.json().catch(() => ({})); return r.ok ? { ok: true, http: r.status, out: `dim=${j.data?.[0]?.embedding?.length}` } : { ok: false, http: r.status, err: JSON.stringify(j).slice(0, 240) };
});
const WAV = (() => { try { return readFileSync(ROOT + "evals/model-refresh-2026-10-04/setup/results/smoke/d01.wav"); } catch { return null; } })();
const transcribe = (base, key, dep) => timed(async () => {
  const fd = new FormData(); fd.append("file", new Blob([WAV], { type: "audio/wav" }), "a.wav"); fd.append("model", dep);
  const r = await fetch(`${base}/openai/deployments/${dep}/audio/transcriptions?api-version=2025-03-01-preview`, { method: "POST", headers: { "api-key": key }, body: fd });
  const j = await r.json().catch(() => ({})); return r.ok ? { ok: true, http: r.status, out: String(j.text).slice(0, 80) } : { ok: false, http: r.status, err: JSON.stringify(j).slice(0, 240) };
});
const IMG_PROMPT = "A simple flat illustration of a pizza cut into 4 equal slices, 3 shaded orange, white background, no text";
const flux2 = (svc, key, dep) => timed(async () => {
  const r = await fetch(`${svc}/providers/blackforestlabs/v1/flux-2-pro?api-version=preview`, { method: "POST", headers: { "api-key": key, "content-type": "application/json" }, body: JSON.stringify({ model: dep, prompt: IMG_PROMPT, n: 1, width: 512, height: 512, output_format: "jpeg" }) });
  const j = await r.json().catch(() => ({})); const b = j.data?.[0]?.b64_json || j.result?.sample; return r.ok && b ? { ok: true, http: r.status, out: `image ${Math.round(String(b).length * 0.75 / 1024)} KB` } : { ok: false, http: r.status, err: JSON.stringify(j).slice(0, 240) };
});
const kontext = (base, key, dep) => timed(async () => {
  const r = await fetch(`${base}/openai/deployments/${dep}/images/generations?api-version=2025-04-01-preview`, { method: "POST", headers: { "api-key": key, "content-type": "application/json" }, body: JSON.stringify({ model: dep, prompt: IMG_PROMPT, n: 1, size: "1024x1024", output_format: "png" }) });
  const j = await r.json().catch(() => ({})); const b = j.data?.[0]?.b64_json; return r.ok && b ? { ok: true, http: r.status, out: `png ${Math.round(b.length * 0.75 / 1024)} KB` } : { ok: false, http: r.status, err: JSON.stringify(j).slice(0, 240) };
});
// Realtime transcription session: ttftMs = commit -> transcript.completed (streaming models emit deltas DURING the
// append, so first-delta-after-commit can be negative; the finalisation wait is what a turn actually blocks on) (same shape as model-refresh smoke).
// d01.wav is 16 kHz mono s16; the realtime session wants 24 kHz PCM, so resample linearly (data chunk located by tag).
const PCM24 = (() => { if (!WAV) return null; let p = 12; while (p < WAV.length - 8 && WAV.toString("ascii", p, p + 4) !== "data") p += 8 + WAV.readUInt32LE(p + 4);
  const rate = WAV.readUInt32LE(24), src = new Int16Array(WAV.buffer.slice(WAV.byteOffset + p + 8, WAV.byteOffset + p + 8 + (WAV.readUInt32LE(p + 4) & ~1)));
  const n = Math.floor(src.length * 24000 / rate), out = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) { const x = i * rate / 24000, k = Math.floor(x), f = x - k; out.writeInt16LE(Math.round(src[k] * (1 - f) + (src[Math.min(k + 1, src.length - 1)] ?? 0) * f), i * 2); }
  return out; })();
const rtTx = (host, key, model) => new Promise((resolve) => {
  if (!PCM24) return resolve({ ok: false, err: "no pcm fixture" });
  const CH = 24000 * 2 * 0.04; let off = 0, text = "", started = false, tCommit = 0, first = null; const t0 = performance.now();
  const ws = new WebSocket(`wss://${host}/openai/v1/realtime?intent=transcription`, { headers: { "api-key": key } });
  const done = (o) => { try { ws.close(); } catch {} resolve({ ...o, totalMs: Math.round(performance.now() - t0) }); };
  const timer = setTimeout(() => done({ ok: false, err: "timeout" }), 30000);
  ws.onopen = () => ws.send(JSON.stringify({ type: "session.update", session: { type: "transcription", audio: { input: { format: { type: "audio/pcm", rate: 24000 }, transcription: { model }, turn_detection: null } } } }));
  ws.onmessage = (ev) => { const e = JSON.parse(ev.data);
    if (e.type === "session.updated" && !started) { started = true; const iv = setInterval(() => { if (off >= PCM24.length) { clearInterval(iv); tCommit = performance.now(); ws.send(JSON.stringify({ type: "input_audio_buffer.commit" })); return; } ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: PCM24.subarray(off, off + CH).toString("base64") })); off += CH; }, 40); }
    else if (e.type === "conversation.item.input_audio_transcription.delta") { if (first == null) first = performance.now(); text += e.delta; }
    else if (e.type === "conversation.item.input_audio_transcription.completed") { clearTimeout(timer); done({ ok: true, ttftMs: Math.round(performance.now() - tCommit), firstDeltaBeforeCommit: first != null && first < tCommit, out: String(e.transcript ?? text).slice(0, 80) }); }
    else if (e.type === "error") { clearTimeout(timer); done({ ok: false, err: JSON.stringify(e.error).slice(0, 240) }); } };
  ws.onerror = (e) => { clearTimeout(timer); done({ ok: false, err: "ws error " + (e?.message || "") }); };
});

const median = (a) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };
if (DO_VERIFY) {
  const dst = new Set(((await arm("GET", `${acct(DST)}/deployments?${API}`)).value || []).filter((d) => d.properties?.provisioningState === "Succeeded").map((d) => d.name));
  const EUSSVC = EUS.replace(".openai.azure.com", ".services.ai.azure.com");
  for (const [name, kind] of PLAN) {
    const r = row(name);
    if (!dst.has(name)) { r.verify = "not deployed in SI"; continue; }
    const call = { chat: (si) => chat(si ? SIH : EUS, si ? SIK : EUSK, name), responses: (si) => responses(si ? SIH : EUS, si ? SIK : EUSK, name),
      embed: (si) => embed(si ? SIH : EUS, si ? SIK : EUSK, name), transcribe: (si) => transcribe(si ? SIH : EUS, si ? SIK : EUSK, name),
      flux2: (si) => flux2(si ? SISVC : EUSSVC, si ? SIK : EUSK, name), kontext: (si) => kontext(si ? SIH : EUS, si ? SIK : EUSK, name),
      "realtime-tx": (si) => (si ? rtTx(new URL(SIH).host, SIK, name) : Promise.resolve({ ok: false, err: "no eastus2 twin" })),
      realtime: (si) => (/transcribe/.test(name) ? rtTx(new URL(si ? SIH : EUS).host, si ? SIK : EUSK, name) : Promise.resolve({ ok: false, err: "realtime voice verify not wired" })) }[kind];
    // Image models cost per image: n=1 in SI only. Everything else: N interleaved pairs (SI, eastus2).
    const n = /flux2|kontext/.test(kind) ? 1 : N, si = [], eus = [];
    for (let i = 0; i < n; i++) {
      si.push(await call(true));
      if (!/flux2|kontext|realtime-tx/.test(kind)) eus.push(await call(false));
    }
    const key = (a) => a.map((x) => (x.ok ? x.ttftMs ?? x.totalMs : null));
    Object.assign(r, { kind, verify: si.every((x) => x.ok) ? "ok" : `FAIL ${si.find((x) => !x.ok)?.http ?? ""} ${si.find((x) => !x.ok)?.err ?? ""}`.slice(0, 200),
      metric: /chat|responses|realtime/.test(kind) ? "TTFT" : "total", n, siMs: key(si), eusMs: key(eus), siMedian: median(key(si)), eusMedian: median(key(eus)),
      eusOk: eus.length ? eus.every((x) => x.ok) : null, eusErr: eus.find((x) => !x.ok)?.err?.slice(0, 160),
      served: si.find((x) => x.served)?.served, sample: si.find((x) => x.out)?.out });
    console.log(name.padEnd(30), r.verify.padEnd(6), `${r.metric} SI med ${r.siMedian} [${r.siMs}] | eus2 med ${r.eusMedian} [${r.eusMs}]${r.eusOk === false ? " eus2 FAIL " + r.eusErr : ""}`);
  }
}

const f = OUTDIR + `foundry-si-${state.at.slice(0, 19).replace(/:/g, "")}.json`;
writeFileSync(f, JSON.stringify(state, null, 1));
console.log("wrote", f.replace(ROOT, ""));
