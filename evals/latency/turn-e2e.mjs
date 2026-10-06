// Round-2 latency harness (stream "latency"): the child stops speaking → the teacher's first audio byte, per stage, on a
// cascade lesson, against the REAL API — in-process on this host (default) or a deployed base (--base https://taxila.dev).
// Not part of `npm test` (it costs a few cents per turn).
//
//   ./envrun.sh node evals/latency/turn-e2e.mjs [--turns 20] [--class 4] [--base URL] [--prefetch] [--turn-audio]
//                                               [--out file.json] [--label text] [--topic id|auto]
//
// Derived from evals/cascade-latency.mjs (same synthetic child, same transcription session the server mints, same
// script), plus what round 2 needs:
//   - the lesson hours are opened first (POST /api/parent/controls), so it runs at any hour;
//   - --base: a deployed server (cookie auth over HTTPS through the sandbox proxy); debug timings exist only in-process;
//   - --prefetch: the client rule of src/latency/prefetch.ts is SIMULATED from the live transcription deltas: once the
//     child has been quiet LOCAL_OFFSET_MS (the device energy VAD's offset, src/lesson/vad.ts offsetMs 400) and no new
//     delta came for DEBOUNCE_MS, POST /api/lesson/turn-prefetch with the delta text so far (again if later deltas change
//     it, at most MAX_PER_ITEM times). A 404 (a server without the route) is recorded and the arm runs as baseline;
//   - --turn-audio: POST /api/lesson/turn-audio (the round-trip fold: the reply's audio on the turn's own response)
//     instead of /turn + /api/voice/tts-stream;
//   - per turn: whether the joined deltas equal the completed transcript (the prefetch's adopt condition), and the
//     server's own phase marks (@ctx, @kit, @classified, @noted, @planned, @replied, @stored) when in-process.
// Stages (ms): endpoint = true speech end → server VAD speech_stopped; stt = → transcript completed; director = → the
// turn's JSON (turn-audio: → the turn frame); tts = → first PCM byte; total = speech end → first PCM byte.
// "sound" = total + 60 ms player start lead + a NOMINAL 50 ms device output latency (not measured).
// SYNTHETIC speech (gpt-4o-mini-tts, pitch-shifted ×1.2): measures the pipeline, not children. The transcription runs
// from THIS host to Azure eastus2 over WebSocket with the account key (the browser uses WebRTC with a minted token); for
// --base the API calls go from this host to the deployed region through the sandbox proxy. Label the result accordingly.
import http from "http";
import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";

const ROOT = new URL("../..", import.meta.url).pathname;
for (const line of fs.readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
const argv = process.argv;
const arg = (name, dflt) => { const i = argv.indexOf(name); return i > 0 ? argv[i + 1] : dflt; };
const TURNS = Number(arg("--turns", 20));
const CLASS = Number(arg("--class", 4));
const OUT = arg("--out");
const BASE_ARG = arg("--base");
const PREFETCH = argv.includes("--prefetch");
const TURN_AUDIO = argv.includes("--turn-audio");
const LABEL = arg("--label", "");
/** The lesson topic (the child script is written for it; another topic gets generic lines). */
const TOPIC = arg("--topic", "c4-maths-ch01-t01");
/** The device rule (src/latency/prefetch.ts): LOCAL_OFFSET_MS after speech end, DEBOUNCE_MS after the last delta. */
const LOCAL_OFFSET_MS = 400, DEBOUNCE_MS = Number(arg("--debounce", 250)), MAX_PER_ITEM = Number(arg("--max-per-item", 3));

const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "");
const KEY = process.env.AZURE_OPENAI_API_KEY;
const SR = 24000, BPS = SR * 2, CHUNK_MS = 40;
const START_LEAD_MS = 60, OUTPUT_LATENCY_MS = 50;
const WD = fs.mkdtempSync(path.join(os.tmpdir(), "turn-e2e-"));

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
function childLine(topicId, topic, move, seen, turnIdx) {
  const s = SCRIPT[topicId];
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
  try { return JSON.parse(fs.readFileSync(`${ROOT}data/kits/c${cls[1]}-${cls[2]}.json`, "utf8")).topics.find((t) => t.topicId === topicId) ?? null; }
  catch { return null; }
}
const CHILD_VOICE = "Voice of a shy 9-year-old Indian child answering a teacher in class. Natural, a little hesitant, Indian accent, not theatrical.";
async function childClip(text, voice) {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(`${E}/audio/speech`, { method: "POST", headers: { "api-key": KEY, "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.DEPLOY_TTS || "gpt-4o-mini-tts", voice, input: text, instructions: CHILD_VOICE, response_format: "pcm" }) });
    if (r.status === 429 && attempt < 4) { await new Promise((res) => setTimeout(res, 2000 * (attempt + 1))); continue; }
    if (!r.ok) throw new Error(`child tts ${r.status}`);
    const raw = Buffer.from(await r.arrayBuffer());
    const a = path.join(WD, "in.pcm"), b = path.join(WD, "out.pcm");
    fs.writeFileSync(a, raw);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", String(SR), "-ac", "1", "-i", a,
      "-af", `asetrate=${SR * 1.2},aresample=${SR},atempo=${(1 / 1.2).toFixed(4)}`, "-f", "s16le", "-ar", String(SR), "-ac", "1", b]);
    return fs.readFileSync(b);
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
  const { handle } = await import("../../server/index.js");
  server = http.createServer(handle);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
}
let cookie = "";
async function api(method, p, body, expect = [200, 201]) {
  const res = await fetch(base + p, { method, headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const set = res.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  const j = await res.json().catch(() => ({}));
  if (!expect.includes(res.status)) throw Object.assign(new Error(`${method} ${p} → ${res.status} ${JSON.stringify(j).slice(0, 200)}`), { status: res.status });
  return j;
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

/**
 * Stream one utterance in real time. `onPrefetch(text, at)` is the simulated device rule (see the header). Resolves when
 * every committed segment is transcribed.
 */
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
        if (out.deltaFirstAt === undefined || out.deltaFirstAt < (out.vadAt ?? 0)) out.deltaFirstAt = at;
        partial.set(e.item_id, (partial.get(e.item_id) ?? "") + (e.delta ?? ""));
        out.deltaLastAt = at;
        (out.deltaTimes ??= []).push(Math.round(at - out.speechEndAt));
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
    // the device's local VAD offset fires LOCAL_OFFSET_MS after the speech end whether or not a delta arrives then
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

// ───────────── the reply's first audio ─────────────
async function readFirst(res, framed) {
  const reader = res.body.getReader();
  let first = 0, bytes = 0, buf = Buffer.alloc(0), turn = null, turnAt = 0, header = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!framed) { if (!first && value.length) first = performance.now(); bytes += value.length; continue; }
    buf = Buffer.concat([buf, Buffer.from(value)]);
    while (buf.length >= 4) {
      const type = buf[0], len = buf.readUIntBE(1, 3);
      if (buf.length < 4 + len) break;
      const body = buf.subarray(4, 4 + len);
      buf = buf.subarray(4 + len);
      if (type === 0) { if (!first && body.length) first = performance.now(); bytes += body.length; }
      else if (type === 3) { turn = JSON.parse(body.toString("utf8")); turnAt = performance.now(); }
      else if (type === 2 && !header) header = JSON.parse(body.toString("utf8"));
    }
  }
  return { first, bytes, turn, turnAt, header };
}
async function ttsFirst(lessonId, seq) {
  const t0 = performance.now();
  const res = await fetch(base + "/api/voice/tts-stream", { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ lessonId, seq }) });
  if (!res.ok) throw new Error(`tts-stream ${res.status} ${await res.text()}`);
  const r = await readFirst(res, false);
  return { firstAt: r.first, t0, bytes: r.bytes, prewarmedMs: res.headers.get("x-tts-prewarmed-ms") === null ? null : Number(res.headers.get("x-tts-prewarmed-ms")), engine: res.headers.get("x-tts-engine") };
}

// ───────────── the run ─────────────
const rows = [];
let password, childId;
const prefetchStatus = { sent: 0, accepted: 0, missingRoute: 0, failed: 0 };
try {
  const st = Date.now(), rnd = Math.random().toString(36).slice(2, 8);
  password = `lat2-pw-${st}-${rnd}`;
  await api("POST", "/api/auth/signup", { email: `lat2+${st}${rnd}@taxila.test`, password, name: "Latency", isGuardianAdult: true });
  ({ child: { id: childId } } = await api("POST", "/api/children", { firstName: "Aarav", classLevel: CLASS, languagePref: "hinglish", interests: ["cricket"] }));
  await api("POST", "/api/consent", { childId, grants: { core_tutoring: true, learning_profile: true, memory: true } });
  await api("POST", "/api/parent/controls", { childId, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
  const s = await api("POST", "/api/lesson/start", { childId, mode: "cascade", ...(TOPIC !== "auto" ? { topicId: TOPIC } : {}) });
  console.log(`lesson ${s.lessonId} topic=${s.topic.id} base=${server ? "in-process" : base} prefetch=${PREFETCH} turnAudio=${TURN_AUDIO}`);
  const tok = await api("POST", "/api/voice/stt-token", { lessonId: s.lessonId });
  console.log(`stt: model=${tok.session.audio.input.transcription.model} vad=${JSON.stringify(tok.session.audio.input.turn_detection)}`);
  const topic = topicFacts(s.topic.id);
  const seen = {};
  let move = s.debug?.move;
  let turnSeq = 0;
  const stt = sttSocket(tok.session);
  await stt.ready;
  for (let i = 0; i < TURNS; i++) {
    const line = childLine(s.topic.id, topic, move, seen, i);
    const clip = await childClip(line, i % 2 ? "sage" : "coral");
    const acks = [];
    const onPrefetch = PREFETCH ? (text) => {
      prefetchStatus.sent++;
      // wantAck: the SHADOW ack decision (server/latency/ack.js) comes back once classify is in; nothing is played
      acks.push(fetch(base + "/api/lesson/turn-prefetch", { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ lessonId: s.lessonId, text, wantAck: true }) })
        .then(async (r) => { if (r.status === 404) prefetchStatus.missingRoute++; else if (r.ok) prefetchStatus.accepted++; else prefetchStatus.failed++;
          const j = await r.json().catch(() => null); return { text, at: performance.now(), ack: j?.ack ?? null }; })
        .catch(() => { prefetchStatus.failed++; return null; }));
    } : null;
    const heard = await speak(stt, clip, onPrefetch);
    const tTurn = performance.now();
    const body = { lessonId: s.lessonId, childText: heard.text, typed: false, turnSeq: ++turnSeq, ...(heard.conf !== undefined ? { asrConfidence: heard.conf } : {}) };
    let r, tts, replyAt;
    if (TURN_AUDIO) {
      const res = await fetch(base + "/api/lesson/turn-audio", { method: "POST", headers: { "content-type": "application/json", accept: "application/x-taxila-pcm-frames;v=2", cookie }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(`turn-audio ${res.status} ${await res.text()}`);
      const got = await readFirst(res, true);
      r = got.turn;
      replyAt = got.turnAt;
      if (got.header?.audio !== "follows" && r?.teacherReplySeq) tts = await ttsFirst(s.lessonId, r.teacherReplySeq);
      else tts = { firstAt: got.first, prewarmedMs: got.header?.prewarmedMs ?? null, engine: got.header?.engine ?? null, bytes: got.bytes };
    } else {
      r = await api("POST", "/api/lesson/turn", body);
      replyAt = performance.now();
      if (r.teacherReplySeq) tts = await ttsFirst(s.lessonId, r.teacherReplySeq);
    }
    const asked = move?.itemId ?? null;
    // the ack of the prefetch whose words the turn sent (the adopted one): when it was decided, relative to speech end
    const ackOf = (await Promise.all(acks)).filter((a) => a && a.text === heard.text).at(-1) ?? null;
    move = r?.move;
    if (!r?.teacherReplySeq || !tts?.firstAt) { console.log(`  turn ${i + 1}: no reply audio (${r?.move?.kind})`); if (r?.end) break; continue; }
    const marks = Object.fromEntries((r.debug?.timings ?? []).filter((t) => String(t.kind).startsWith("@")).map((t) => [t.kind.slice(1), t.ms]));
    const row = {
      said: line, asked, heard: heard.text, deltaText: heard.deltaText, deltaEqualsFinal: heard.deltaText === heard.text,
      conf: heard.conf === undefined ? null : +heard.conf.toFixed(3), move: r.move?.kind, reply: r.teacherReply,
      endpoint: Math.round(heard.vadAt - heard.speechEndAt), stt: Math.round(heard.finalAt - heard.vadAt),
      lastDeltaAfterEnd: heard.deltaLastAt === undefined ? null : Math.round(heard.deltaLastAt - heard.speechEndAt),
      prefetchAfterEnd: heard.prefetches.length ? Math.round(heard.prefetches.at(-1).at - heard.speechEndAt) : null,
      ack: ackOf?.ack ?? null, ackReadyAfterEnd: ackOf?.ack?.token ? Math.round(ackOf.at - heard.speechEndAt) : null,
      prefetchCount: heard.prefetches.length, deltaTimesAfterEnd: (heard.deltaTimes ?? []).slice(-8), prefetchTimes: heard.prefetches.map((p) => Math.round(p.at - heard.speechEndAt)), prefetchTextEqualsFinal: heard.prefetches.length ? heard.prefetches.at(-1).text === heard.text : null,
      turnAfterEnd: Math.round(tTurn - heard.speechEndAt),
      director: Math.round(replyAt - tTurn), tts: Math.round(tts.firstAt - replyAt), total: Math.round(tts.firstAt - heard.speechEndAt),
      sound: Math.round(tts.firstAt - heard.speechEndAt) + START_LEAD_MS + OUTPUT_LATENCY_MS,
      cls: r.debug?.classification ? `${r.debug.classification.outcome}/${r.debug.classification.source}` : null,
      speculation: r.debug?.speculation ? (r.debug.speculation.hit ? "hit" : "miss") : "none", specTried: r.debug?.speculation?.tried ?? null, specDiffers: r.debug?.speculation?.differs,
      prefetched: !!r.debug?.prefetch?.adopted, prefetchMiss: r.debug?.prefetch?.miss ?? null, prefetchAheadMs: r.debug?.prefetch?.aheadMs ?? null, note: r.debug?.note ?? null,
      serverMs: r.debug?.ms ?? null, marks, ttsPrewarmedMs: tts.prewarmedMs, engine: tts.engine,
      guard: r.debug?.guard ? [...r.debug.guard.caught, ...(r.debug.guard.rewritten ? ["rewritten"] : [])].join(",") : null,
    };
    rows.push(row);
    console.log(`  turn ${i + 1}: endpoint ${row.endpoint} · stt ${row.stt} · director ${row.director} · tts ${row.tts} = ${row.total} ms [${row.move}] cls ${row.cls} spec ${row.speculation}${row.prefetched ? ` PREFETCHED(+${row.prefetchAheadMs})` : row.prefetchMiss ? ` prefetch-miss:${row.prefetchMiss}` : ""}${row.note ? ` note ${JSON.stringify(row.note)}` : ""} delta==final ${row.deltaEqualsFinal}`);
    console.log(`      "${row.heard}" → "${String(row.reply).slice(0, 120)}" marks ${JSON.stringify(marks)}${row.specDiffers ? ` differs ${JSON.stringify(row.specDiffers).slice(0, 240)}` : ""}`);
    if (r.end) break;
  }
  stt.ws.close();
} finally {
  if (childId) await api("DELETE", "/api/account", { password, confirm: true }).catch((e) => console.log(`could not delete the test account: ${e.message}`));
  server?.close();
  fs.rmSync(WD, { recursive: true, force: true });
}

const stat = (k, pick = (r) => r[k]) => {
  const v = rows.map(pick).filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return null;
  const q = (p) => v[Math.min(v.length - 1, Math.floor(p * (v.length - 1) + 0.5))];
  return { n: v.length, p50: q(0.5), p90: q(0.9), min: v[0], max: v.at(-1) };
};
const KEYS = ["endpoint", "stt", "lastDeltaAfterEnd", "prefetchAfterEnd", "ackReadyAfterEnd", "turnAfterEnd", "director", "tts", "total", "sound", "serverMs"];
const summary = Object.fromEntries(KEYS.map((k) => [k, stat(k)]));
const nonAnswer = rows.filter((r) => r.cls?.startsWith("no_evidence"));
summary.directorNonAnswer = stat("director", (r) => (r.cls?.startsWith("no_evidence") ? r.director : NaN));
summary.directorAnswer = stat("director", (r) => (r.cls && !r.cls.startsWith("no_evidence") ? r.director : NaN));
summary.speculation = { hit: rows.filter((r) => r.speculation === "hit").length, of: rows.filter((r) => r.speculation !== "none").length };
summary.deltaEqualsFinal = { yes: rows.filter((r) => r.deltaEqualsFinal).length, of: rows.length };
summary.prefetchAdopted = { yes: rows.filter((r) => r.prefetched).length, of: rows.length, ...prefetchStatus };
summary.nonAnswerTurns = nonAnswer.length;
summary.ack = { echo: rows.filter((r) => r.ack?.token).length, of: rows.length, reasons: Object.fromEntries(Object.entries(rows.reduce((m, r) => { const k = r.ack?.token ? "echo" : r.ack?.none ?? "no_prefetch"; m[k] = (m[k] ?? 0) + 1; return m; }, {}))) };
// the would-be first sound with the SHADOW ack played: the ack's decision + a Diya first byte for a 1-word clip (not added: reported apart)
summary.firstSoundWithAck = stat("total", (r) => (r.ack?.token ? Math.min(r.total, r.ackReadyAfterEnd) : r.total));
console.log("\nstage              n    p50    p90    min    max  (ms)");
for (const [k, s] of Object.entries(summary)) if (s && s.p50 !== undefined) console.log(`${k.padEnd(18)} ${String(s.n).padStart(2)} ${String(s.p50).padStart(6)} ${String(s.p90).padStart(6)} ${String(s.min).padStart(6)} ${String(s.max).padStart(6)}`);
console.log(`ack (shadow) ${JSON.stringify(summary.ack)}`);
console.log(`speculation hits ${summary.speculation.hit}/${summary.speculation.of} · deltas == final ${summary.deltaEqualsFinal.yes}/${summary.deltaEqualsFinal.of} · prefetch adopted ${summary.prefetchAdopted.yes}/${rows.length} (${JSON.stringify(prefetchStatus)})`);
if (OUT) {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ method: { date: new Date().toISOString(), label: LABEL, turns: rows.length, classLevel: CLASS, base: server ? "in-process" : base, host: os.hostname(),
    prefetch: PREFETCH, turnAudio: TURN_AUDIO, classify: process.env.DEPLOY_CLASSIFY || "taxila-fast", stt: process.env.TAXILA_STT_MODEL || "(server default)",
    note: "synthetic child speech (gpt-4o-mini-tts ×1.2 pitch); WebSocket transcription from this host to eastus2; sound = first byte + 60 ms lead + 50 ms NOMINAL output latency" }, summary, rows }, null, 1));
}
process.exit(rows.length ? 0 : 1);
