// Round 3, stream relational-human: FIRST SOUND end to end — the child stops speaking → the first sound the child hears
// from her — on a cascade lesson against the REAL API, with the device's rules simulated exactly:
//   - the turn prefetch (src/latency/prefetch.ts: local VAD offset 400 ms + deltas still 250 ms, ≤ 3 per item);
//   - the acknowledgement (src/latency/ack.ts): asked on the prefetched words (or the final transcript when no prefetch
//     was sent), PLAYED only when the final transcript equals those words and her reply's first audio has not arrived;
//     the reply then waits for the clip to end + 180 ms (cascadeLink ackGate);
//   - the reply: POST /api/lesson/turn on the final transcript, then /api/voice/tts-stream → first PCM byte.
// Derived from evals/latency/turn-e2e.mjs (round 2): the same synthetic child, the same transcription session the server
// mints, the same script, so round-2 and round-3 numbers are comparable stage by stage.
//
//   node <envrun> node evals/relational-human/first-sound.mjs [--root DIR] [--turns 20] [--lessons 1] [--class 4]
//        [--prefetch] [--ack] [--base URL] [--save DIR] [--out file.json] [--label text] [--topic id]
//
//   --root DIR    import the server from another tree (a HEAD export for "before", the patched copy for "after")
//   --lessons N   N lessons in parallel (the quota / 429 load arm); per-turn rows carry the lesson index
//   --save DIR    per-turn audio for the blind listening test: child.pcm, ack.pcm, reply.pcm (s16le 24 kHz) + timeline
// In-process only (no --base): every Azure response the SERVER receives is counted by deployment and status (the
// prefetch's 429 cost); the harness's own child-voice calls are not counted.
// "sound" = first PCM byte + 60 ms player lead + a NOMINAL 50 ms device output latency (not measured). SYNTHETIC child
// speech (gpt-4o-mini-tts ×1.2 pitch): this measures the pipeline, not children. Transcription runs from THIS host to
// eastus2 over WebSocket with the account key (the browser uses WebRTC with a minted token). Label results accordingly.
import http from "http";
import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import { pathToFileURL } from "url";

const REPO = new URL("../..", import.meta.url).pathname;
const argv = process.argv;
const arg = (name, dflt) => { const i = argv.indexOf(name); return i > 0 ? argv[i + 1] : dflt; };
const ROOT = path.resolve(arg("--root", REPO)) + "/";
for (const line of fs.readFileSync(REPO + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
const TURNS = Number(arg("--turns", 20));
const LESSONS = Number(arg("--lessons", 1));
const CLASS = Number(arg("--class", 4));
const OUT = arg("--out");
const SAVE = arg("--save");
const BASE_ARG = arg("--base");
const PREFETCH = argv.includes("--prefetch");
const ACK = argv.includes("--ack");
const LABEL = arg("--label", "");
const TOPIC = arg("--topic", "c4-maths-ch01-t01");
/** "items" (default): the child answers the item actually on the table from the kit — right, wrong, right per item, with
 *  a "pata nahi" every fifth turn — so graded answers are a realistic share; "round2": the round-2 harness's fixed lines. */
const SCRIPT_MODE = arg("--script", "items");
const LOCAL_OFFSET_MS = 400, DEBOUNCE_MS = 250, MAX_PER_ITEM = 3;
const ACK_MAX_AGE_MS = 3500, ACK_REPLY_GAP_MS = 180, ACK_HOLD_MAX_MS = 1800;

const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "");
const KEY = process.env.AZURE_OPENAI_API_KEY;
const SR = 24000, BPS = SR * 2, CHUNK_MS = 40;
const START_LEAD_MS = 60, OUTPUT_LATENCY_MS = 50;
const WD = fs.mkdtempSync(path.join(os.tmpdir(), "first-sound-"));

// ───────────── the server's Azure traffic, counted (in-process only) ─────────────
const nativeFetch = globalThis.fetch;
const azure = { calls: 0, byDep: {}, status: {} };
function countAzure(url, status, init) {
  const u = String(url);
  if (!/openai\.azure\.com|cognitiveservices|services\.ai\.azure\.com|tts\.speech\.microsoft\.com/.test(u)) return;
  let model = null;
  try { model = typeof init?.body === "string" ? JSON.parse(init.body).model ?? null : null; } catch { /* not JSON */ }
  const dep = u.match(/deployments\/([^/?]+)/)?.[1] ?? model ?? (/tts\.speech/.test(u) ? "speech-tts" : u.replace(/^https?:\/\/[^/]+/, "").split("?")[0].slice(0, 40));
  azure.calls++;
  const d = (azure.byDep[dep] ??= { calls: 0, s429: 0, other: 0 });
  d.calls++;
  if (status === 429) d.s429++; else if (status >= 400) d.other++;
  azure.status[status] = (azure.status[status] ?? 0) + 1;
}
if (!BASE_ARG) {
  // the server calls globalThis.fetch; the harness's own calls (child voice, the API) use nativeFetch and are not counted
  globalThis.fetch = async (url, init) => {
    const res = await nativeFetch(url, init);
    countAzure(url?.url ?? url, res.status, init);
    return res;
  };
}
const hfetch = (...a) => nativeFetch(...a);

// ───────────── the child (the cascade-latency.mjs script, unchanged) ─────────────
const SCRIPT = {
  "c4-maths-ch01-t01": {
    talk: ["Haan didi, main ready hoon. Mujhe lagta hai dabbe mein zyada corners hote hain.", "Achha, toh dabbe ki flat side ko face kehte hain?", "Haan, samajh gaya. Do faces jahan milte hain woh edge hai.",
      "Achha, aur corner woh point hai na jahan edges milte hain?"],
    items: {
      "c4-maths-ch01-t01-i01": ["Mujhe lagta hai dice ke chhe faces hain.", "Teen faces hain didi."],
      "c4-maths-ch01-t01-i02": ["Woh line edge hai, kinara.", "Woh toh corner hai na?"],
      "c4-maths-ch01-t01-i03": ["Cube ke aath corners hote hain.", "Chhe corners?"],
      "c4-maths-ch01-t01-i04": ["Picture mein teen dikhte hain, par asal mein chhe faces honge.", "Teen faces."],
      "c4-maths-ch01-t01-i05": ["Kyunki har face ke peeche ek chhupa hua face hai, upar neeche, aage peeche.", "Kyunki maine gine the."],
      "c4-maths-ch01-t01-i06": ["Dono mein barabar, baarah baarah edges hain.", "Maachis mein zyada hain kyunki woh lambi hai."],
      "c4-maths-ch01-t01-i07": ["Baarah edges aur aath corners.", "Aath edges aur chhe corners."],
      "c4-maths-ch01-t01-i08": ["Nahi, aath toh corners hain, edges baarah hote hain.", "Haan, aath hi hain."],
      "c4-maths-ch01-t01-i09": ["Baarah sticks aur aath goliyan.", "Aath sticks chahiye."],
      "c4-maths-ch01-t01-i10": ["Paanch faces, ek square aur chaar triangle.", "Chaar faces?"],
      "c4-maths-ch01-t01-i11": ["Paanch corners hain.", "Chaar corners."],
      "c4-maths-ch01-t01-i12": ["Chintu, peeche aur neeche wale faces bhi gino, jodi mein gino toh chhe hote hain.", "Chintu, teen hi hain."],
      "c4-maths-ch01-t01-i13": ["Chhe faces, baarah edges, aath corners.", "Chhe faces, aath edges, baarah corners."],
    },
    why: ["Kyunki maine har taraf gina, upar neeche, aage peeche, daayen baayen.", "Bas aise hi pata tha."],
  },
};
const UNSURE = "Mujhe nahi pata, ek baar aur batao na.";
function diagLines(topic, itemId) {
  const m = topic?.misconceptions?.find((x) => `diag:${x.id}` === itemId);
  const opts = m?.diagnostic?.options ?? [];
  const right = opts.find((o) => o.correct)?.text, wrong = opts.find((o) => o.misconceptionId === m.id)?.text;
  return right ? [`Mujhe lagta hai ${right}.`, ...(wrong ? [`${wrong}?`] : [])] : null;
}
const NUM_HL = ["shunya", "ek", "do", "teen", "chaar", "paanch", "chhe", "saat", "aath", "nau", "das", "gyaarah", "baarah", "terah", "chaudah", "pandrah", "solah", "satrah", "athaarah", "unnees", "bees"];
const spokenNums = (t) => String(t).replace(/\d+/g, (d) => (Number(d) <= 20 ? NUM_HL[Number(d)] : d));
/** A short spoken answer to a kit item: the key (numbers as Hinglish words), or a plausible wrong one. */
function itemAnswer(it, right) {
  const key = String(it.answer ?? "").trim();
  const short = key.split(/[;:.(]/)[0].trim();
  if (/\d/.test(short) && short.split(/\s+/).length <= 6) {
    if (right) return spokenNums(short.replace(/^an? /i, ""));
    let bumped = false;
    return spokenNums(short.replace(/\d+/, (d) => { bumped = true; return String(Number(d) + (Number(d) > 2 ? -2 : 2)); })) + (bumped ? "" : "");
  }
  const opts = (it.options ?? []).map((o) => String(o.text ?? o)).filter(Boolean);
  if (short.split(/\s+/).length <= 3) {
    if (right) return short.replace(/^(an?|the) /i, "");
    const other = opts.find((o) => o.trim().toLowerCase() !== short.toLowerCase());
    return other ? other.replace(/^(an?|the) /i, "") : null;
  }
  return null; // a long explanation key: the child gives a why line instead
}
function childLine(topicId, topic, move, seen, turnIdx) {
  const s = SCRIPT[topicId];
  if (SCRIPT_MODE === "items" && /^fade:\d+$/.test(move?.itemId ?? "")) {
    // a faded worked-example step (W2-C): the blanks' values are the words the faded line lacks (rj-w1c-script-child-cannot-fill-fade)
    const i = Number(move.itemId.slice(5));
    const step = topic?.workedExample?.steps?.[i], faded = topic?.workedExample?.fadedVersion?.[i];
    const k = (seen[move.itemId] = (seen[move.itemId] ?? 0) + 1) - 1;
    if (step && faded && turnIdx % 5 !== 4) {
      const have = new Set(faded.toLowerCase().split(/[^a-z0-9]+/));
      const blanks = step.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w && !have.has(w));
      const tail = faded.match(/___\s+([a-z]+)\.?$/i)?.[1] ?? "";
      if (blanks.length) {
        const vals = k % 3 === 1 ? blanks.map((b) => (/^\d+$/.test(b) ? String(Number(b) + 2) : b)) : blanks;
        return `${spokenNums(vals.join(", "))}${tail ? ` ${tail}` : ""}.`;
      }
    }
  }
  if (SCRIPT_MODE === "items" && move?.itemId && move?.kind !== "probe") {
    const it = topic?.items?.find((i) => i.id === move.itemId);
    const k = (seen[move.itemId] = (seen[move.itemId] ?? 0) + 1) - 1;
    if (turnIdx % 5 === 4) return UNSURE;
    const a = it ? itemAnswer(it, k % 3 !== 1) : null;
    if (a) return k % 2 ? `Mujhe lagta hai ${a}.` : `${a[0].toUpperCase()}${a.slice(1)}.`;
  }
  const itemId = move?.itemId;
  if (move?.kind === "probe" && s?.why) {
    const k = (seen[`why:${itemId}`] = (seen[`why:${itemId}`] ?? 0) + 1) - 1;
    return s.why[(k + (turnIdx % 2)) % s.why.length];
  }
  if (itemId) {
    const k = (seen[itemId] = (seen[itemId] ?? 0) + 1) - 1;
    let lines = s?.items[itemId] ?? diagLines(topic, itemId);
    if (!lines) {
      const it = topic?.items?.find((i) => i.id === itemId);
      lines = it ? [`Mujhe lagta hai ${it.acceptable?.at(-1) ?? it.answer}.`] : [];
    }
    const cycle = [lines[0], lines[1] ?? UNSURE, UNSURE, lines[0]].filter(Boolean);
    if (cycle.length) return cycle[(k + (turnIdx % 2)) % cycle.length];
  }
  const talk = s?.talk ?? ["Haan, main sun raha hoon.", "Achha, aage batao."];
  return turnIdx === 0 || talk.length < 2 ? talk[0] : talk[1 + ((turnIdx - 1) % (talk.length - 1))];
}
function topicFacts(topicId) {
  const cls = topicId.match(/^c(\d+)-([a-z]+)-/);
  if (!cls) return null;
  try { return JSON.parse(fs.readFileSync(`${REPO}data/kits/c${cls[1]}-${cls[2]}.json`, "utf8")).topics.find((t) => t.topicId === topicId) ?? null; }
  catch { return null; }
}
const CHILD_VOICE = "Voice of a shy 9-year-old Indian child answering a teacher in class. Natural, a little hesitant, Indian accent, not theatrical.";
const clipCache = new Map();
async function childClip(text, voice) {
  const k = `${voice}|${text}`;
  if (clipCache.has(k)) return clipCache.get(k);
  for (let attempt = 0; ; attempt++) {
    const r = await hfetch(`${E}/audio/speech`, { method: "POST", headers: { "api-key": KEY, "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.DEPLOY_TTS || "gpt-4o-mini-tts", voice, input: text, instructions: CHILD_VOICE, response_format: "pcm" }) });
    if (r.status === 429 && attempt < 6) { await new Promise((res) => setTimeout(res, 2000 * (attempt + 1))); continue; }
    if (!r.ok) throw new Error(`child tts ${r.status}`);
    const raw = Buffer.from(await r.arrayBuffer());
    const a = path.join(WD, `in-${process.pid}-${Math.random().toString(36).slice(2)}.pcm`), b = a.replace(/in-/, "out-");
    fs.writeFileSync(a, raw);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", String(SR), "-ac", "1", "-i", a,
      "-af", `asetrate=${SR * 1.2},aresample=${SR},atempo=${(1 / 1.2).toFixed(4)}`, "-f", "s16le", "-ar", String(SR), "-ac", "1", b]);
    const out = fs.readFileSync(b);
    fs.rmSync(a, { force: true }); fs.rmSync(b, { force: true });
    clipCache.set(k, out);
    return out;
  }
}
function speechEndMs(pcm) {
  const thr = 32768 * 0.01;
  for (let i = (pcm.length >> 1) - 1; i >= 0; i--) if (Math.abs(pcm.readInt16LE(i * 2)) > thr) return (i / SR) * 1000;
  return 0;
}

// ───────────── the API (in-process or remote) ─────────────
let base = BASE_ARG?.replace(/\/+$/, "");
let server = null;
if (!base) {
  const { handle } = await import(pathToFileURL(ROOT + "server/index.js").href);
  server = http.createServer(handle);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
}
function client() {
  let cookie = "";
  async function api(method, p, body, expect = [200, 201]) {
    const res = await hfetch(base + p, { method, headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const set = res.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0];
    const j = await res.json().catch(() => ({}));
    if (!expect.includes(res.status)) throw Object.assign(new Error(`${method} ${p} → ${res.status} ${JSON.stringify(j).slice(0, 200)}`), { status: res.status });
    return j;
  }
  api.cookie = () => cookie;
  return api;
}

// ───────────── transcription (WebSocket; the session config the server minted) ─────────────
function sttSocket(session) {
  const ws = new WebSocket(`${E.replace(/^https/, "wss")}/realtime?intent=transcription`, { headers: { "api-key": KEY } });
  const listeners = new Set();
  const ready = new Promise((resolve, reject) => {
    ws.onopen = () => ws.send(JSON.stringify({ type: "session.update", session: { ...session, audio: { input: { ...session.audio.input, format: { type: "audio/pcm", rate: SR } } } } }));
    ws.onerror = (e) => reject(new Error(`ws error ${e?.message ?? ""}`));
    ws.onmessage = (m) => {
      const e = JSON.parse(m.data);
      if (e.type === "session.updated") resolve();
      if (e.type === "error") console.log("  stt error:", JSON.stringify(e.error).slice(0, 200));
      for (const fn of listeners) fn(e, performance.now());
    };
  });
  return { ws, ready, on: (fn) => (listeners.add(fn), () => listeners.delete(fn)) };
}

/** Stream one utterance in real time; `onPrefetch(text, at)` is the device rule. Resolves when every segment is transcribed. */
function speak(stt, pcm, onPrefetch) {
  const lead = Buffer.alloc(BPS / 2), tail = Buffer.alloc(BPS * 3);
  const all = Buffer.concat([lead, pcm, tail]);
  const endInAll = 500 + speechEndMs(pcm);
  return new Promise((resolve, reject) => {
    const out = { segments: 0, prefetches: [] };
    const committed = [], texts = new Map(), confs = [];
    const timeout = setTimeout(() => { off(); clearTimeout(pfTimer); reject(new Error("transcripts incomplete after 25 s")); }, 25_000);
    const partial = new Map();
    let pfTimer = null, lastSent = "", sent = 0;
    const joined = () => [...committed.map((id) => partial.get(id) ?? texts.get(id) ?? ""), ...[...partial.keys()].filter((k) => !committed.includes(k)).map((k) => partial.get(k))]
      .map((t) => String(t).trim()).filter(Boolean).join(" ");
    const armPrefetch = () => {
      if (!onPrefetch || out.finalAt !== undefined) return;
      const now = performance.now();
      const due = Math.max(out.speechEndAt + LOCAL_OFFSET_MS, (out.deltaLastAt ?? 0) + DEBOUNCE_MS);
      clearTimeout(pfTimer);
      pfTimer = setTimeout(() => {
        const t = joined();
        if (!t || t === lastSent || sent >= MAX_PER_ITEM || out.finalAt !== undefined) return;
        lastSent = t; sent++;
        const at = performance.now();
        out.prefetches.push({ text: t, at });
        onPrefetch(t, at);
      }, Math.max(0, due - now));
    };
    const check = () => {
      if (out.vadAt === undefined || out.vadAt < out.speechEndAt || !committed.length || committed.some((id) => !texts.has(id))) return;
      clearTimeout(timeout);
      clearTimeout(pfTimer);
      off();
      out.segments = committed.length;
      out.text = committed.map((id) => texts.get(id)).filter(Boolean).join(" ");
      out.deltaText = committed.map((id) => String(partial.get(id) ?? "").trim()).filter(Boolean).join(" ");
      out.conf = confs.length ? confs.reduce((a, b) => a + b, 0) / confs.length : undefined;
      resolve(out);
    };
    const off = stt.on((e, at) => {
      if (e.type === "input_audio_buffer.speech_stopped") out.vadAt = at;
      if (e.type === "conversation.item.input_audio_transcription.delta") {
        partial.set(e.item_id, (partial.get(e.item_id) ?? "") + (e.delta ?? ""));
        out.deltaLastAt = at;
        if (at >= out.speechEndAt) armPrefetch();
      }
      if (e.type === "input_audio_buffer.committed") committed.push(e.item_id);
      if (e.type === "conversation.item.input_audio_transcription.completed" || e.type === "conversation.item.input_audio_transcription.failed") {
        out.finalAt = at;
        texts.set(e.item_id, String(e.transcript || "").trim());
        const lps = (e.logprobs || []).map((l) => l.logprob).filter((v) => typeof v === "number");
        if (lps.length) confs.push(Math.exp(lps.reduce((a, b) => a + b, 0) / lps.length));
        check();
      }
    });
    const t0 = performance.now();
    out.speechEndAt = t0 + endInAll;
    if (onPrefetch) setTimeout(armPrefetch, Math.max(0, endInAll + LOCAL_OFFSET_MS));
    let pos = 0, n = 0;
    const step = (BPS * CHUNK_MS) / 1000;
    const tick = () => {
      if (pos >= all.length) return;
      stt.ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: all.subarray(pos, pos + step).toString("base64") }));
      pos += step;
      n++;
      setTimeout(tick, Math.max(0, t0 + n * CHUNK_MS - performance.now()));
    };
    tick();
  });
}

// ───────────── her audio ─────────────
async function ttsAll(api, lessonId, seq, keep) {
  const res = await hfetch(base + "/api/voice/tts-stream", { method: "POST", headers: { "content-type": "application/json", cookie: api.cookie() }, body: JSON.stringify({ lessonId, seq }) });
  if (!res.ok) throw new Error(`tts-stream ${res.status} ${await res.text()}`);
  const reader = res.body.getReader();
  let first = 0;
  const parts = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!first && value.length) first = performance.now();
    if (keep) parts.push(Buffer.from(value));
  }
  return { firstAt: first, pcm: keep ? Buffer.concat(parts) : null, prewarmedMs: res.headers.get("x-tts-prewarmed-ms") === null ? null : Number(res.headers.get("x-tts-prewarmed-ms")), engine: res.headers.get("x-tts-engine") };
}

/** POST /api/lesson/turn-ack: { at (ms perf), status, ack } — the device asks once per distinct text. */
function askAck(api, lessonId, text) {
  const t = performance.now();
  return hfetch(base + "/api/lesson/turn-ack", { method: "POST", headers: { "content-type": "application/json", cookie: api.cookie() }, body: JSON.stringify({ lessonId, text }) })
    .then(async (r) => ({ text, askedAt: t, at: performance.now(), status: r.status, why: r.headers.get("x-prefetch"), ack: r.status === 200 ? (await r.json()).ack : null }))
    .catch((e) => ({ text, askedAt: t, at: performance.now(), status: 0, why: String(e?.message ?? e).slice(0, 60), ack: null }));
}

// ───────────── one lesson ─────────────
const prefetchStatus = { sent: 0, accepted: 0, missingRoute: 0, failed: 0 };
const skipped = [];
async function lesson(L, rows = []) {
  const api = client();
  let password, childId;
  try {
    const st = Date.now(), rnd = Math.random().toString(36).slice(2, 8);
    password = `r3rh-pw-${st}-${rnd}`;
    await api("POST", "/api/auth/signup", { email: `r3rh+${st}${rnd}@taxila.test`, password, name: "Latency", isGuardianAdult: true });
    ({ child: { id: childId } } = await api("POST", "/api/children", { firstName: "Aarav", classLevel: CLASS, languagePref: "hinglish", interests: ["cricket"] }));
    await api("POST", "/api/consent", { childId, grants: { core_tutoring: true, learning_profile: true, memory: true } });
    await api("POST", "/api/parent/controls", { childId, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
    const s = await api("POST", "/api/lesson/start", { childId, mode: "cascade", ...(TOPIC !== "auto" ? { topicId: TOPIC } : {}) });
    console.log(`[L${L}] lesson ${s.lessonId} topic=${s.topic.id} base=${server ? `in-process ${ROOT}` : base} prefetch=${PREFETCH} ack=${ACK} script=${SCRIPT_MODE}`);
    const tok = await api("POST", "/api/voice/stt-token", { lessonId: s.lessonId });
    console.log(`[L${L}] stt: model=${tok.session?.audio?.input?.transcription?.model} vad=${JSON.stringify(tok.session?.audio?.input?.turn_detection)}`);
    const topic = topicFacts(s.topic.id);
    const seen = {};
    let move = s.debug?.move;
    let turnSeq = 0;
    let stt = sttSocket(tok.session);
    await stt.ready;
    for (let i = 0; i < TURNS; i++) {
      const line = childLine(s.topic.id, topic, move, seen, i);
      const clip = await childClip(line, i % 2 ? "sage" : "coral");
      const acks = [];
      const onPrefetch = PREFETCH ? (text) => {
        prefetchStatus.sent++;
        hfetch(base + "/api/lesson/turn-prefetch", { method: "POST", headers: { "content-type": "application/json", cookie: api.cookie() }, body: JSON.stringify({ lessonId: s.lessonId, text }) })
          .then((r) => { if (r.status === 404) prefetchStatus.missingRoute++; else if (r.ok) prefetchStatus.accepted++; else prefetchStatus.failed++; return r.arrayBuffer(); })
          .catch(() => { prefetchStatus.failed++; });
        if (ACK) acks.push(askAck(api, s.lessonId, text)); // AckClient.request on the prefetch's words (onSend)
      } : null;
      let heard;
      try { heard = await speak(stt, clip, onPrefetch); }
      catch (e) {
        // an STT stall (the realtime transcription socket stops answering) is the harness's, not the lesson's: reconnect,
        // skip this turn (no turn posted, not in the stats) and say so in the summary — a stall used to lose the whole lesson
        skipped.push({ lesson: L, turn: i + 1, why: String(e?.message ?? e).slice(0, 80) });
        console.log(`  [L${L}] turn ${i + 1}: SKIPPED (${e?.message ?? e}); reconnecting the STT socket`);
        try { stt.ws.close(); } catch { /* already closed */ }
        const tk = await api("POST", "/api/voice/stt-token", { lessonId: s.lessonId });
        stt = sttSocket(tk.session);
        await stt.ready;
        continue;
      }
      const tTurn = performance.now();
      // AckClient.onFinal: the final words differ from every asked text (or nothing was asked) → ask on the final words
      if (ACK && !acks.length) acks.push(askAck(api, s.lessonId, heard.text));
      else if (ACK && !heard.prefetches.some((p) => p.text.replace(/\s+/g, " ").trim() === heard.text.replace(/\s+/g, " ").trim())) acks.push(askAck(api, s.lessonId, heard.text));
      const body = { lessonId: s.lessonId, childText: heard.text, typed: false, turnSeq: ++turnSeq, ...(heard.conf !== undefined ? { asrConfidence: heard.conf } : {}) };
      const r = await api("POST", "/api/lesson/turn", body);
      const replyAt = performance.now();
      const tts = r.teacherReplySeq ? await ttsAll(api, s.lessonId, r.teacherReplySeq, !!SAVE) : null;
      const asked = move?.itemId ?? null;
      move = r?.move;
      if (!r?.teacherReplySeq || !tts?.firstAt) { console.log(`  [L${L}] turn ${i + 1}: no reply audio (${r?.move?.kind})`); if (r?.end) break; continue; }
      // the device's play rule for the ack (src/latency/ack.ts tryPlay + cascadeLink.playAck)
      const ackRes = (await Promise.all(acks)).filter(Boolean);
      const finalText = heard.text.replace(/\s+/g, " ").trim();
      const usable = ackRes.filter((a) => a.ack && a.text.replace(/\s+/g, " ").trim() === finalText).at(-1) ?? null;
      const finalAt = heard.finalAt;
      let ackPlayAt = null, ackEnd = null;
      if (usable) {
        const startAt = Math.max(usable.at, finalAt);
        if (startAt < tts.firstAt && startAt - finalAt <= ACK_MAX_AGE_MS) { ackPlayAt = startAt; ackEnd = startAt + START_LEAD_MS + usable.ack.ms; }
      }
      const replySoundAt = ackEnd !== null ? Math.max(tts.firstAt, ackEnd + Math.min(ACK_REPLY_GAP_MS, ACK_HOLD_MAX_MS)) : tts.firstAt;
      const end = heard.speechEndAt;
      const marks = Object.fromEntries((r.debug?.timings ?? []).filter((t) => String(t.kind).startsWith("@")).map((t) => [t.kind.slice(1), t.ms]));
      const cls = r.debug?.classification ? `${r.debug.classification.outcome}/${r.debug.classification.source}` : null;
      const row = {
        lesson: L, turn: i + 1, said: line, asked, heard: heard.text, deltaEqualsFinal: heard.deltaText === heard.text, move: r.move?.kind, reply: r.teacherReply,
        cls, verdict: r.ui?.verdict ?? null,
        endpoint: Math.round(heard.vadAt - end), stt: Math.round(heard.finalAt - heard.vadAt), turnAfterEnd: Math.round(tTurn - end),
        lastDeltaAfterEnd: heard.deltaLastAt === undefined ? null : Math.round(heard.deltaLastAt - end), finalAfterEnd: Math.round(heard.finalAt - end),
        prefetchAfterEnd: heard.prefetches.length ? Math.round(heard.prefetches.at(-1).at - end) : null, prefetchCount: heard.prefetches.length,
        director: Math.round(replyAt - tTurn), tts: Math.round(tts.firstAt - replyAt),
        replyFirstByte: Math.round(tts.firstAt - end),
        // what the child hears
        ackStatus: ackRes.map((a) => (a.ack ? `ack:${a.ack.phrase}` : `${a.status}:${a.why ?? ""}`)),
        ackPhrase: usable?.ack?.phrase ?? null, ackReadyAfterEnd: usable ? Math.round(usable.at - end) : null, ackDecidedMs: usable?.ack?.decidedMs ?? null,
        ackPlayed: ackPlayAt !== null, ackSoundAfterEnd: ackPlayAt !== null ? Math.round(ackPlayAt - end) + START_LEAD_MS + OUTPUT_LATENCY_MS : null,
        ackClipMs: usable?.ack?.ms ?? null,
        replySound: Math.round(replySoundAt - end) + START_LEAD_MS + OUTPUT_LATENCY_MS,
        firstSound: Math.round((ackPlayAt ?? tts.firstAt) - end) + START_LEAD_MS + OUTPUT_LATENCY_MS,
        speculation: r.debug?.speculation ? (r.debug.speculation.hit ? "hit" : "miss") : "none",
        prefetched: !!r.debug?.prefetch?.adopted, prefetchMiss: r.debug?.prefetch?.miss ?? null, prefetchAheadMs: r.debug?.prefetch?.aheadMs ?? null, note: r.debug?.note ?? null,
        serverMs: r.debug?.ms ?? null, marks, ttsPrewarmedMs: tts.prewarmedMs, engine: tts.engine,
        guard: r.debug?.guard ? [...r.debug.guard.caught, ...(r.debug.guard.rewritten ? ["rewritten"] : [])].join(",") : null,
      };
      rows.push(row);
      if (SAVE) {
        const dir = path.join(SAVE, `L${L}-t${String(i + 1).padStart(2, "0")}`);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "child.pcm"), clip);
        if (tts.pcm) fs.writeFileSync(path.join(dir, "reply.pcm"), tts.pcm);
        if (usable?.ack?.pcm) fs.writeFileSync(path.join(dir, "ack.pcm"), Buffer.from(usable.ack.pcm, "base64"));
        // the timeline relative to the CHILD'S speech end inside child.pcm (ms)
        fs.writeFileSync(path.join(dir, "timeline.json"), JSON.stringify({ childSpeechEndMs: Math.round(speechEndMs(clip)), ackAtMs: row.ackPlayed ? row.ackSoundAfterEnd : null,
          replyAtMs: row.replySound, said: line, heard: heard.text, reply: r.teacherReply, ackPhrase: row.ackPlayed ? row.ackPhrase : null, verdict: row.verdict, move: row.move, cls }, null, 1));
      }
      console.log(`  [L${L}] turn ${i + 1}: endpoint ${row.endpoint} stt ${row.stt} director ${row.director} tts ${row.tts} → reply ${row.replySound} first ${row.firstSound} ms [${row.move}] cls ${cls}${row.ackPlayed ? ` ACK "${row.ackPhrase}" @${row.ackSoundAfterEnd}` : ` ack ${JSON.stringify(row.ackStatus)}`}${row.prefetched ? ` PF+${row.prefetchAheadMs}` : ""}`);
      if (r.end) break;
    }
    stt.ws.close();
  } finally {
    if (childId) await api("DELETE", "/api/account", { password, confirm: true }).catch((e) => console.log(`could not delete the test account: ${e.message}`));
  }
  return rows;
}

const t0 = Date.now();
const loadAvg0 = os.loadavg()[0];
let rows = [];
try {
  rows = (await Promise.all(Array.from({ length: LESSONS }, (_, L) => { const sink = []; return lesson(L, sink).catch((e) => { console.log(`[L${L}] failed: ${e.message} (${sink.length} turns kept)`); return sink; }); }))).flat();
} finally {
  server?.close();
  fs.rmSync(WD, { recursive: true, force: true });
}

const stat = (k, pick = (r) => r[k], src = rows) => {
  const v = src.map(pick).filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return null;
  const q = (p) => v[Math.min(v.length - 1, Math.floor(p * (v.length - 1) + 0.5))];
  return { n: v.length, p50: q(0.5), p90: q(0.9), min: v[0], max: v.at(-1) };
};
const KEYS = ["endpoint", "stt", "lastDeltaAfterEnd", "finalAfterEnd", "turnAfterEnd", "prefetchAfterEnd", "director", "tts", "replyFirstByte", "replySound", "ackSoundAfterEnd", "ackReadyAfterEnd", "firstSound", "serverMs"];
const summary = Object.fromEntries(KEYS.map((k) => [k, stat(k)]));
const graded = (r) => /^(correct|incorrect|partial|misconception)\//.test(r.cls ?? "");
summary.firstSoundGraded = stat("firstSound", (r) => (graded(r) ? r.firstSound : NaN));
summary.firstSoundNonAnswer = stat("firstSound", (r) => (!graded(r) ? r.firstSound : NaN));
summary.ackReadyRight = stat("ackReadyAfterEnd", (r) => (r.cls?.startsWith("correct") ? r.ackReadyAfterEnd : NaN));
summary.ackReadyWrong = stat("ackReadyAfterEnd", (r) => (/^(incorrect|partial|misconception)/.test(r.cls ?? "") ? r.ackReadyAfterEnd : NaN));
summary.ack = { played: rows.filter((r) => r.ackPlayed).length, graded: rows.filter(graded).length, of: rows.length,
  reasons: rows.reduce((m, r) => { for (const s of r.ackStatus) m[s.startsWith("ack:") ? (r.ackPlayed ? "played" : "arrived_not_played") : s] = (m[s.startsWith("ack:") ? (r.ackPlayed ? "played" : "arrived_not_played") : s] ?? 0) + 1; return m; }, {}) };
summary.speculation = { hit: rows.filter((r) => r.speculation === "hit").length, of: rows.filter((r) => r.speculation !== "none").length };
summary.prefetchAdopted = { yes: rows.filter((r) => r.prefetched).length, of: rows.length, ...prefetchStatus };
summary.skippedTurns = skipped;
summary.rewrites = rows.filter((r) => r.guard && /rewrit|replaced/.test(r.guard)).length;
summary.azure = server ? azure : "remote (not counted)";
console.log("\nstage                n    p50    p90    min    max  (ms after the child's speech end)");
for (const [k, s] of Object.entries(summary)) if (s && s.p50 !== undefined) console.log(`${k.padEnd(20)} ${String(s.n).padStart(2)} ${String(s.p50).padStart(6)} ${String(s.p90).padStart(6)} ${String(s.min).padStart(6)} ${String(s.max).padStart(6)}`);
console.log(`ack ${JSON.stringify(summary.ack)}`);
console.log(`prefetch adopted ${summary.prefetchAdopted.yes}/${rows.length} ${JSON.stringify(prefetchStatus)} · speculation ${summary.speculation.hit}/${summary.speculation.of} · rewrites ${summary.rewrites}`);
if (server) console.log(`azure (server side) calls ${azure.calls} status ${JSON.stringify(azure.status)} by deployment ${JSON.stringify(azure.byDep)}`);
if (OUT) {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ method: { date: new Date().toISOString(), label: LABEL, turns: rows.length, lessons: LESSONS, classLevel: CLASS, base: server ? "in-process" : base, root: ROOT,
    host: os.hostname(), loadAvg: [loadAvg0, os.loadavg()[0]], wallS: Math.round((Date.now() - t0) / 1000), prefetch: PREFETCH, ack: ACK,
    script: SCRIPT_MODE, stt: process.env.TAXILA_STT_MODEL || process.env.DEPLOY_TRANSCRIBE || "(server default)",
    env: { TAXILA_TURN_PREFETCH: process.env.TAXILA_TURN_PREFETCH ?? "(default on)", TAXILA_ACK: process.env.TAXILA_ACK ?? "(default on)", AZURE_SPEECH_REGION: process.env.AZURE_SPEECH_REGION ?? null, TAXILA_DB: process.env.TAXILA_DB ?? null },
    note: "synthetic child speech (gpt-4o-mini-tts ×1.2 pitch); WebSocket transcription from this US sandbox to eastus2; sound = first byte (or the ack's play time) + 60 ms lead + 50 ms NOMINAL output latency; device rules simulated" }, summary, rows }, null, 1));
}
process.exit(rows.length ? 0 : 1);
