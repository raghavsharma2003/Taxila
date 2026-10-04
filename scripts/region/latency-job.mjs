// The in-job half of scripts/region/latency.mjs: runs inside an ACA job (node:22 image) at a vantage point and prints
// one `LAT {json}` line per sample, `LAT_DONE` at the end. Never prints a key or a URL with credentials.
// env: VANTAGE, STAGING, PROD (base urls), N, SIN_EP/SIN_KEY (taxila-ai-southindia v1 base + key), EUS_EP/EUS_KEY
// (the eastus2 account), LESSONS (staging lesson count; 0 skips).
const E = process.env, N = Number(E.N || 20), V = E.VANTAGE;
const out = (o) => console.log("LAT " + JSON.stringify({ v: V, ...o }));
const now = () => performance.now();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function health(base, path) {
  const t = now();
  try { const r = await fetch(base + path, { signal: AbortSignal.timeout(20000) }); const j = await r.json().catch(() => ({})); return { ms: Math.round(now() - t), status: r.status, dbMs: j.dbMs, rev: j.revision }; }
  catch (e) { return { ms: null, err: String(e.message).slice(0, 80) }; }
}

async function lesson(base, i) {
  let cookie = "";
  const A = async (method, path, body) => {
    const t = now();
    const r = await fetch(base + path, { method, headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(60000) });
    const set = r.headers.get("set-cookie"); if (set) cookie = set.split(";")[0];
    const j = await r.json().catch(() => ({}));
    if (r.status >= 300) throw new Error(`${method} ${path} ${r.status} ${JSON.stringify(j).slice(0, 120)}`);
    return { ms: Math.round(now() - t), ...j };
  };
  const st = Date.now() + "-" + i, PW = `lat-pw-${st}`, row = { t: "lesson", target: "staging", i };
  try {
    await A("POST", "/api/auth/signup", { email: `smoke+lat${st}@taxila.test`, password: PW, name: "Latency", isGuardianAdult: true });
    const { child } = await A("POST", "/api/children", { firstName: "Riya", classLevel: 5, languagePref: "hinglish", interests: ["cricket"] });
    await A("POST", "/api/consent", { childId: child.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
    await A("POST", "/api/parent/controls", { childId: child.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
    const s = await A("POST", "/api/lesson/start", { childId: child.id, mode: "text" });
    row.start = s.ms; row.turns = [];
    for (const childText of ["haan didi, main ready hoon", "mujhe nahi pata, thoda samjhao na", "achha, ab samajh aaya"]) {
      const r = await A("POST", "/api/lesson/turn", { lessonId: s.lessonId, childText, asrConfidence: 0.95, typed: true });
      row.turns.push(r.ms); if (r.end) break;
    }
    await A("POST", "/api/lesson/end", { lessonId: s.lessonId });
  } catch (e) { row.err = String(e.message).slice(0, 160); }
  finally { try { await A("DELETE", "/api/account", { password: PW, confirm: true }); row.deleted = true; } catch (e) { row.deleted = false; row.delErr = String(e.message).slice(0, 80); } }
  out(row);
}

const PROMPT = [{ role: "system", content: "You are a warm Hinglish teacher for a 9-year-old. Reply in at most 12 words." }, { role: "user", content: "Didi, 3/4 bada hai ya 2/3?" }];
async function ttft(ep, key, dep) {
  const t0 = now(); let first = null;
  try {
    const r = await fetch(`${ep}/chat/completions`, { method: "POST", headers: { "api-key": key, "content-type": "application/json" },
      body: JSON.stringify({ model: dep, messages: PROMPT, max_completion_tokens: 200, stream: true, reasoning_effort: "none" }), signal: AbortSignal.timeout(30000) });
    if (!r.ok) return { err: `http ${r.status}` };
    const dec = new TextDecoder(); let buf = "";
    for await (const chunk of r.body) {
      buf += dec.decode(chunk, { stream: true }); let k;
      while ((k = buf.indexOf("\n")) >= 0) { const line = buf.slice(0, k).trim(); buf = buf.slice(k + 1);
        if (!line.startsWith("data:") || line.includes("[DONE]")) continue;
        try { const j = JSON.parse(line.slice(5)); if (first == null && j.choices?.[0]?.delta?.content) first = now(); } catch {} }
    }
    return { ttft: first == null ? null : Math.round(first - t0), total: Math.round(now() - t0) };
  } catch (e) { return { err: String(e.message).slice(0, 80) }; }
}

let PCM = null;
async function synth() {
  const r = await fetch(`${E.EUS_EP}/audio/speech`, { method: "POST", headers: { "api-key": E.EUS_KEY, "content-type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini-tts", voice: "coral", input: "Didi, teen bata chaar bada hai ya do bata teen? Mujhe samajh nahi aaya.", response_format: "pcm" }) });
  if (!r.ok) throw new Error("tts " + r.status);
  PCM = Buffer.from(await r.arrayBuffer());
}
const wav = () => { const h = Buffer.alloc(44); h.write("RIFF", 0); h.writeUInt32LE(36 + PCM.length, 4); h.write("WAVEfmt ", 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(24000, 24); h.writeUInt32LE(48000, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(PCM.length, 40); return Buffer.concat([h, PCM]); };

// realtime transcription socket: commit → transcript.completed (what a turn blocks on); audio streamed in real time
const rtTx = (ep, key, model) => new Promise((resolve) => {
  const host = new URL(ep).host, CH = 24000 * 2 * 0.04; let off = 0, started = false, tCommit = 0, tOpen = 0; const t0 = now();
  let ws; try { ws = new WebSocket(`wss://${host}/openai/v1/realtime?intent=transcription`, { headers: { "api-key": key } }); } catch (e) { return resolve({ err: "ws ctor " + e.message }); }
  const done = (o) => { try { ws.close(); } catch {} resolve({ ...o, total: Math.round(now() - t0) }); };
  const timer = setTimeout(() => done({ err: "timeout" }), 40000);
  ws.onopen = () => { tOpen = now(); ws.send(JSON.stringify({ type: "session.update", session: { type: "transcription", audio: { input: { format: { type: "audio/pcm", rate: 24000 }, transcription: { model }, turn_detection: null } } } })); };
  ws.onmessage = (ev) => { const e = JSON.parse(ev.data);
    if (e.type === "session.updated" && !started) { started = true; const iv = setInterval(() => { if (off >= PCM.length) { clearInterval(iv); tCommit = now(); ws.send(JSON.stringify({ type: "input_audio_buffer.commit" })); return; } ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: PCM.subarray(off, off + CH).toString("base64") })); off += CH; }, 40); }
    else if (e.type === "conversation.item.input_audio_transcription.completed") { clearTimeout(timer); done({ final: Math.round(now() - tCommit), open: Math.round(tOpen - t0) }); }
    else if (e.type === "error") { clearTimeout(timer); done({ err: JSON.stringify(e.error).slice(0, 120) }); } };
  ws.onerror = (e) => { clearTimeout(timer); done({ err: "ws error " + (e?.message || "") }); };
});
async function batchTx(ep, key, dep) {
  const t0 = now(); const fd = new FormData(); fd.append("file", new Blob([wav()], { type: "audio/wav" }), "a.wav"); fd.append("model", dep);
  try { const r = await fetch(`${ep.replace(/\/openai\/v1$/, "")}/openai/deployments/${dep}/audio/transcriptions?api-version=2025-03-01-preview`, { method: "POST", headers: { "api-key": key }, body: fd, signal: AbortSignal.timeout(30000) });
    await r.text(); return r.ok ? { total: Math.round(now() - t0) } : { err: `http ${r.status}` }; } catch (e) { return { err: String(e.message).slice(0, 80) }; }
}

out({ t: "start", n: N, node: process.version });
// 1) health, interleaved, first call of each target is the cold one (reported, excluded from the stats by the reader)
for (let i = 0; i <= N; i++) for (const [target, base] of [["staging", E.STAGING], ["prod", E.PROD]]) out({ t: "health", target, i, ...(await health(base, "/api/health")) });
for (let i = 0; i < 6; i++) for (const [target, base] of [["staging", E.STAGING], ["prod", E.PROD]]) { const h = await health(base, "/api/health?db=1"); out({ t: "healthdb", target, i, ms: h.ms, dbMs: h.dbMs }); }
// 2) model TTFT, interleaved SI / eastus2, same deployment name
for (let i = 0; i <= N; i++) for (const [acct, ep, key] of [["sin", E.SIN_EP, E.SIN_KEY], ["eus", E.EUS_EP, E.EUS_KEY]]) out({ t: "ttft", dep: "taxila-fast", acct, i, ...(await ttft(ep, key, "taxila-fast")) });
// 3) transcription
try { await synth(); out({ t: "audio", bytes: PCM.length, seconds: PCM.length / 48000 }); } catch (e) { out({ t: "audio", err: e.message }); }
if (PCM) for (let i = 0; i <= N; i++) {
  out({ t: "rttx", dep: "taxila-live-transcribe", acct: "eus", i, ...(await rtTx(E.EUS_EP, E.EUS_KEY, "taxila-live-transcribe")) });
  out({ t: "rttx", dep: "taxila-mai-tx2-stream", acct: "sin", i, ...(await rtTx(E.SIN_EP, E.SIN_KEY, "taxila-mai-tx2-stream")) });
  out({ t: "batchtx", dep: "taxila-transcribe", acct: "sin", i, ...(await batchTx(E.SIN_EP, E.SIN_KEY, "taxila-transcribe")) });
  out({ t: "batchtx", dep: "taxila-transcribe", acct: "eus", i, ...(await batchTx(E.EUS_EP, E.EUS_KEY, "taxila-transcribe")) });
}
// 4) staging lessons (production is never written: the A/B for prod is health + the model lanes)
for (let i = 0; i < Number(E.LESSONS || 0); i++) { await lesson(E.STAGING, i); await sleep(200); }
console.log("LAT_DONE");
