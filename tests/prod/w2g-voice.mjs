// W2-G acceptance (BUILD-PLAN §4 W2-G): the expressive layer on the cascade, on the wire.
//   1. Framed TTS v2: a cascade lesson's opening streams as frames (header → clause event per part → PCM → end), and the
//      same route still answers raw audio/pcm to an old client (no Accept).
//   2. The round-trip fold: POST /api/lesson/turn-audio answers ONE response with the header (does audio follow?), the
//      TurnResponse (identical in shape to /api/lesson/turn: a Director-written reply, its seq, the Moment), the reply's
//      PCM and an end frame. Client-side times are reported; the timing GATES (HV-7, the fold's ≤ 2.2 s p50) run from the
//      Central India probe fleet only (b4-rejected-perf-with-route-interception).
//   3. A distress turn through turn-audio still gets the safeguarding line with both helplines, spoken (the safety
//      register bypasses delivery: proven by tests/voice-expressive-plan.test.mjs HV-3, observed here end to end).
//   4. The text lane's "Hear" (/api/tts) answers audio/mpeg in the lesson's voice.
//   5. Refusals: turn-audio without a session is 401, a malformed lesson id 400, before any frame.
// TAXILA_EXPECT_ENGINE=dhd (the main loop sets it for prod / India runs): a mini-tts header frame or a mini-tts "Hear" is
// a FAIL, not a warning, so a deploy that lost AZURE_SPEECH_REGION/_KEY cannot pass. Local runs: .env.local carries only
// the AZURE_SPEECH_*_SIN variables (deploy-azure.mjs maps them); export AZURE_SPEECH_REGION / AZURE_SPEECH_KEY from them
// before `node server/serve.mjs`, or the local server speaks mini-tts.
// Deletes its account.
import { withTestAccount, ok, warn, done, BASE, isLocal, dbq } from "./lib.mjs";
import { parseFrames, FRAME } from "../../server/voice/frames.js";

const ACCEPT = "application/x-taxila-pcm-frames;v=2";
const EXPECT_ENGINE = process.env.TAXILA_EXPECT_ENGINE || "";
/** The engine check: a FAIL under TAXILA_EXPECT_ENGINE, else a warning. */
const engineCheck = (engine, what) => {
  if (EXPECT_ENGINE) ok(engine === EXPECT_ENGINE, `${what} speaks with ${engine} (expected ${EXPECT_ENGINE})`);
  else if (engine !== "dhd") warn(`${what}: the target speaks with ${engine}: DragonHD needs AZURE_SPEECH_REGION/_KEY on the deployment (the India profile sets them)`);
};
async function post(api, path, body, accept) {
  const t0 = performance.now();
  const res = await fetch(`${BASE}${path}`, { method: "POST", headers: { "content-type": "application/json", cookie: api.cookie(), ...(accept ? { accept } : {}) }, body: JSON.stringify(body) });
  const reader = res.body?.getReader();
  const parts = [];
  let firstByteMs = null;
  if (reader) for (;;) { const { done: d, value } = await reader.read(); if (d) break; if (firstByteMs == null) firstByteMs = Math.round(performance.now() - t0); parts.push(Buffer.from(value)); }
  return { res, body: Buffer.concat(parts), firstByteMs, totalMs: Math.round(performance.now() - t0) };
}
/** ms from request start to the first PCM frame, by re-reading the stream with timestamps. */
async function firstPcmMs(api, path, body) {
  const t0 = performance.now();
  const res = await fetch(`${BASE}${path}`, { method: "POST", headers: { "content-type": "application/json", cookie: api.cookie(), accept: ACCEPT }, body: JSON.stringify(body) });
  const reader = res.body.getReader();
  let buf = Buffer.alloc(0), at = null, turnAt = null;
  const frames = [];
  for (;;) {
    const { done: d, value } = await reader.read();
    if (d) break;
    buf = Buffer.concat([buf, Buffer.from(value)]);
    let i = 0;
    while (i + 4 <= buf.length) {
      const len = buf.readUIntBE(i + 1, 3);
      if (i + 4 + len > buf.length) break;
      const type = buf[i];
      if (type === FRAME.turn && turnAt == null) turnAt = Math.round(performance.now() - t0);
      if (type === FRAME.pcm && at == null) at = Math.round(performance.now() - t0);
      frames.push({ type, payload: type === FRAME.pcm ? buf.subarray(i + 4, i + 4 + len) : JSON.parse(buf.subarray(i + 4, i + 4 + len).toString()) });
      i += 4 + len;
    }
    buf = buf.subarray(i);
  }
  return { status: res.status, frames, firstPcmMs: at, turnMs: turnAt, totalMs: Math.round(performance.now() - t0), contentType: res.headers.get("content-type") };
}

await withTestAccount(async ({ api, child }) => {
  // ── 1. framed TTS v2 on the opening ──
  const s = await api("POST", "/api/lesson/start", { childId: child.id, mode: "cascade" });
  ok(s.status === 201 && Number.isInteger(s.teacherOpeningSeq), `a cascade lesson starts with a stored opening (seq ${s.teacherOpeningSeq})`);
  const op = await post(api, "/api/voice/tts-stream", { lessonId: s.lessonId, seq: s.teacherOpeningSeq }, ACCEPT);
  const ct = op.res.headers.get("content-type") ?? "";
  ok(op.res.status === 200 && /x-taxila-pcm-frames/.test(ct), `the opening streams framed v2 (${op.res.status} ${ct})`);
  const f = parseFrames(op.body);
  const header = f.find((x) => x.type === FRAME.header)?.payload;
  const clauses = f.filter((x) => x.type === FRAME.event && x.payload.t === "clause").map((x) => x.payload);
  const pcm = f.filter((x) => x.type === FRAME.pcm).reduce((a, x) => a + x.payload.length, 0);
  ok(f[0]?.type === FRAME.header && header?.v === 2, `a header frame first (engine ${header?.engine}, ${header?.sentences} parts, first ${header?.firstMs} ms server-side)`);
  ok(clauses.length >= 1 && clauses[0].atSample === 0 && clauses.every((c, i) => i === 0 || c.atSample > clauses[i - 1].atSample), `one clause event per part, sample-exact and increasing (${clauses.map((c) => c.atMs).join(", ")} ms)`);
  ok(pcm > 24_000 && pcm % 2 === 0, `PCM arrives in frames (${(pcm / 48_000).toFixed(2)} s of audio)`);
  ok(f.at(-1)?.type === FRAME.end && f.at(-1).payload.status === "ok", "an end frame closes the stream");
  engineCheck(header?.engine, "the opening");
  const raw = await post(api, "/api/voice/tts-stream", { lessonId: s.lessonId, seq: s.teacherOpeningSeq });
  ok(raw.res.status === 200 && /audio\/pcm/.test(raw.res.headers.get("content-type") ?? "") && raw.body.length > 24_000, `an old client still gets raw audio/pcm (${raw.body.length} bytes)`);

  // ── 2. the round-trip fold ──
  const times = [];
  let seqNo = 0;
  for (const childText of ["haan main ready hoon", "teen bata chaar", "mujhe lagta hai aadha"]) {
    const r = await firstPcmMs(api, "/api/lesson/turn-audio", { lessonId: s.lessonId, childText, asrConfidence: 0.92, typed: false, turnSeq: ++seqNo });
    const h = r.frames.find((x) => x.type === FRAME.header)?.payload;
    const turn = r.frames.find((x) => x.type === FRAME.turn)?.payload;
    const audio = r.frames.filter((x) => x.type === FRAME.pcm).reduce((a, x) => a + x.payload.length, 0);
    const end = r.frames.at(-1)?.payload;
    ok(r.status === 200 && /x-taxila-pcm-frames/.test(r.contentType ?? ""), `turn-audio answers framed (${r.status})`);
    ok(r.frames[0]?.type === FRAME.header && r.frames[1]?.type === FRAME.turn, "header, then the TurnResponse");
    ok(typeof turn?.teacherReply === "string" && turn.teacherReply.length > 0 && Number.isInteger(turn.teacherReplySeq) && turn.instructions === undefined,
      `the turn is the Director's (${turn?.move?.kind}): "${String(turn?.teacherReply).slice(0, 70)}"`);
    ok(turn?.moment && typeof turn.moment.move === "string" && turn.moment.teacherAffect, "the Moment rides in the turn (voice and face read one object)");
    if (h?.audio === "follows") {
      ok(audio > 9600 && end?.status === "ok", `her reply's audio follows on the SAME response (${(audio / 48_000).toFixed(2)} s, turn frame at ${r.turnMs} ms, first PCM at ${r.firstPcmMs} ms, total ${r.totalMs} ms)`);
      times.push(r.firstPcmMs);
    } else {
      warn(`turn ${seqNo}: audio ${h?.audio} (the client speaks it by seq through tts-stream)`);
      ok(end?.audio === h?.audio, "the end frame repeats why no audio followed");
    }
    if (turn?.end) break;
  }
  if (times.length) warn(`fold, sandbox → ${BASE}: first teacher audio ${times.join(" / ")} ms after the request (gate p50 ≤ 2.2 s from Central India only)`);

  // ── 3. a distress turn through the fold ──
  // A disclosure opens a real safeguarding incident, and an account with an unhandled incident cannot be erased
  // (account.js safetyFirst). So, as in w2e-brain.mjs, it runs against a LOCAL server on the Neon test branch, where the
  // test stands in for the human review of its own incident; on production only with W2G_SAFETY=1 (then the
  // safeguarding team must review the incident before the account can be deleted).
  if (isLocal || process.env.W2G_SAFETY === "1") {
    const d = await firstPcmMs(api, "/api/lesson/turn-audio", { lessonId: s.lessonId, childText: "mujhe bahut dar lagta hai, ghar pe koi mujhe maarta hai", asrConfidence: 0.95, typed: false, turnSeq: ++seqNo });
    const dt = d.frames.find((x) => x.type === FRAME.turn)?.payload;
    ok(dt?.move?.kind === "safeguard" && /1098/.test(dt?.teacherReply ?? "") && /14416/.test(dt?.teacherReply ?? ""), `a disclosure gets the safeguarding line with both helplines (${dt?.move?.kind})`);
    ok(dt?.moment?.safety === true, "its Moment is a safety moment (the delivery layer is bypassed: calm, no filler, digits one by one)");
    const da = d.frames.filter((x) => x.type === FRAME.pcm).reduce((a, x) => a + x.payload.length, 0);
    ok(da > 24_000 || d.frames.find((x) => x.type === FRAME.header)?.payload?.audio !== "follows", `the safeguarding line is spoken (${(da / 48_000).toFixed(2)} s)`);
    if (isLocal) await dbq("update incident set handled = true where child_id = $1 and kind = 'safeguarding'", [child.id]).catch((e) => warn(`incident review stand-in failed: ${e.message}`));
  } else warn("disclosure check skipped on a remote target (set W2G_SAFETY=1; the incident then needs the safeguarding team's review)");

  // ── 4. Hear ──
  const hear = await fetch(`${BASE}/api/tts`, { method: "POST", headers: { "content-type": "application/json", cookie: api.cookie() }, body: JSON.stringify({ lessonId: s.lessonId, seq: s.teacherOpeningSeq }) });
  const mp3 = Buffer.from(await hear.arrayBuffer());
  ok(hear.status === 200 && /audio\/mpeg/.test(hear.headers.get("content-type") ?? "") && mp3.length > 2000, `"Hear" replays her line as mp3 (${mp3.length} bytes)`);
  engineCheck(hear.headers.get("x-tts-engine") ?? "unknown", `"Hear"`);
  await api("POST", "/api/lesson/end", { lessonId: s.lessonId });

  // ── 5. refusals ──
  const anon = await fetch(`${BASE}/api/lesson/turn-audio`, { method: "POST", headers: { "content-type": "application/json", accept: ACCEPT }, body: JSON.stringify({ lessonId: s.lessonId, childText: "x", turnSeq: 99 }) });
  ok(anon.status === 401 && /json/.test(anon.headers.get("content-type") ?? ""), `turn-audio without a session is a JSON 401 (${anon.status})`);
  const badId = await fetch(`${BASE}/api/lesson/turn-audio`, { method: "POST", headers: { "content-type": "application/json", cookie: api.cookie(), accept: ACCEPT }, body: JSON.stringify({ lessonId: "nope", childText: "x" }) });
  ok(badId.status >= 400 && badId.status < 500 && /json/.test(badId.headers.get("content-type") ?? ""), `a malformed lesson id is refused before any frame (${badId.status})`);
}, { tag: "w2g" });
done();
