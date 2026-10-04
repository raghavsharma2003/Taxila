// W2-D acceptance (BUILD-PLAN §4 W2-D): the voice lanes, on the wire.
//   1. The live-call token is minted the W2-D way: truncation retention_ratio, server VAD silence inside 600-1200 ms,
//      the transcription logprobs kept, no instructions in the client's copy (or a 503 with {fallback: "cascade"} when
//      the realtime lane is full: the start-time fallback).
//   2. "A forced rate limit switches to cascade with the lesson continuing": a realtime lesson takes a voice-lane turn,
//      then POST /api/lesson/lane (what the browser sends on inference_rate_limit_exceeded), then the SAME lesson answers
//      on the cascade lane: the repair turn has a Director-written reply, that stored turn streams as speech
//      (/api/voice/tts-stream), and an ordinary next turn is answered too. The switch is idempotent and one-way.
//   3. Refusals: a text lesson cannot "switch", an ended lesson cannot, a bad lane is a 400.
// The 4-parallel 20-minute realtime soak and the face checks (lip-bench, gaze, AT-U12) are evals/unit tests, not this
// file (evals/realtime-soak.mjs, evals/avatar/lip-bench.mjs, tests/w2d-voice-lanes.test.mjs). Deletes its account.
import { withTestAccount, ok, warn, done, BASE } from "./lib.mjs";

await withTestAccount(async ({ api, child }) => {
  // ── 1. the token ──
  const live = await api("POST", "/api/lesson/start", { childId: child.id, mode: "voice" });
  ok(live.status === 201 && typeof live.instructions === "string", "a realtime lesson starts");
  const tok = await api("POST", "/api/realtime/token", { lessonId: live.lessonId }, [200, 429, 502, 503]);
  if (tok.status === 200) {
    const s = tok.session ?? {};
    ok(s.truncation?.type === "retention_ratio" && s.truncation.retention_ratio > 0 && s.truncation.retention_ratio < 1, `the live call is minted with truncation ${JSON.stringify(s.truncation)}`);
    const td = s.audio?.input?.turn_detection ?? {};
    ok(td.type !== "server_vad" || (td.silence_duration_ms >= 600 && td.silence_duration_ms <= 1200), `server VAD silence ${td.silence_duration_ms} ms is inside 600-1200`);
    ok(Array.isArray(s.include) && s.include.includes("item.input_audio_transcription.logprobs"), "the transcription logprobs are kept (classify's low-ASR gate)");
    ok(s.instructions === undefined, "the client's copy of the session carries no instructions");
  } else if (tok.status === 503) {
    ok(tok.fallback === "cascade", `the realtime lane is full: the mint answers the cascade fallback (${tok.status})`);
  } else {
    warn(`realtime token ${tok.status}: the realtime lane is unavailable from here; the switch below still runs`);
  }

  // ── 2. the mid-sitting switch ──
  const v1 = await api("POST", "/api/lesson/turn", { lessonId: live.lessonId, childText: "haan main ready hoon", asrConfidence: 0.92, teacherText: "Namaste! Aaj hum fractions dekhenge. Ready?", turnSeq: 1 });
  ok(typeof v1.instructions === "string" && v1.teacherReply === undefined, "before the switch the turn is a realtime-lane turn (instructions, no written reply)");
  const sw = await api("POST", "/api/lesson/lane", { lessonId: live.lessonId, to: "cascade", reason: "rate_limit" });
  ok(sw.status === 200 && sw.mode === "cascade" && sw.switched === true, `the lesson moves to the cascade lane (${sw.ms} ms)`);
  const again = await api("POST", "/api/lesson/lane", { lessonId: live.lessonId, to: "cascade", reason: "rate_limit" });
  ok(again.status === 200 && again.switched === false, "a second switch is a no-op (idempotent)");
  const back = await api("POST", "/api/lesson/lane", { lessonId: live.lessonId, to: "voice" }, [400]);
  ok(back.status === 400, "the switch is one-way within a sitting");
  // The browser's repair turn after the switch: an empty spoken turn, ASR confidence 0.
  const rep = await api("POST", "/api/lesson/turn", { lessonId: live.lessonId, childText: "", asrConfidence: 0, turnSeq: 2 });
  ok(typeof rep.teacherReply === "string" && rep.teacherReply.length > 0 && Number.isInteger(rep.teacherReplySeq), `after the switch she speaks again, Director-written (${rep.move?.kind}): "${String(rep.teacherReply).slice(0, 80)}"`);
  ok(rep.instructions === undefined, "the cascade lane's response carries no instructions (the answer key stays on the server)");
  // That stored turn streams as speech: the lesson really continues on the cascade voice.
  const t0 = performance.now();
  const res = await fetch(`${BASE}/api/voice/tts-stream`, { method: "POST", headers: { "content-type": "application/json", cookie: api.cookie() }, body: JSON.stringify({ lessonId: live.lessonId, seq: rep.teacherReplySeq }) });
  const audio = res.ok ? Buffer.from(await res.arrayBuffer()) : Buffer.alloc(0);
  ok(res.status === 200 && audio.length > 4800 && /audio\/pcm/.test(res.headers.get("content-type") ?? ""), `her line streams on the cascade voice (${res.status}, ${audio.length} bytes, first byte header ${res.headers.get("x-tts-first-ms")} ms, total ${Math.round(performance.now() - t0)} ms)`);
  const next = await api("POST", "/api/lesson/turn", { lessonId: live.lessonId, childText: "teen bata chaar", asrConfidence: 0.9, turnSeq: 3 });
  ok(typeof next.teacherReply === "string" && next.teacherReply.length > 0, `the next child turn is answered on the cascade lane (${next.move?.kind})`);
  const end = await api("POST", "/api/lesson/end", { lessonId: live.lessonId });
  ok(end.status === 200, "the switched lesson ends normally");

  // ── 3. refusals ──
  const txt = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text" });
  const noSwitch = await api("POST", "/api/lesson/lane", { lessonId: txt.lessonId, to: "cascade" }, [409]);
  ok(noSwitch.status === 409, "a text lesson has no realtime lane to leave (409)");
  await api("POST", "/api/lesson/end", { lessonId: txt.lessonId });
  const ended = await api("POST", "/api/lesson/lane", { lessonId: live.lessonId, to: "cascade" }, [409]);
  ok(ended.status === 409, "an ended lesson cannot switch (409)");
  const badId = await api("POST", "/api/lesson/lane", { lessonId: "nope" }, [400]);
  ok(badId.status === 400, "a malformed lesson id is a 400");
}, { tag: "w2d" });

done();
