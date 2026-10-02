// Real-browser check of the voice feature pipeline: Chromium's fake microphone plays a synthetic WAV
// (tones at known f0 with silence gaps) → AudioWorklet decimation → FrameAnalyzer → UtteranceTracker.
// Opt-in (launches Chromium): VOICE_BROWSER=1 node --test tests/voice-features-browser.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const ROOT = new URL("..", import.meta.url).pathname;
const RUN = process.env.VOICE_BROWSER === "1";

/** 48 kHz mono 16-bit WAV from segments { ms, f0? }. */
function wav(segments, rate = 48_000) {
  const n = segments.reduce((a, s) => a + Math.round((s.ms / 1000) * rate), 0);
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(n * 2, 40);
  let i = 0, ph = 0;
  for (const s of segments) {
    const k = Math.round((s.ms / 1000) * rate);
    for (let j = 0; j < k; j++, i++) {
      ph += (2 * Math.PI * (s.f0 || 0)) / rate;
      const v = s.f0 ? 0.25 * (Math.sin(ph) + 0.4 * Math.sin(2 * ph)) : 0;
      buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2);
    }
  }
  return buf;
}

test("browser: worklet → features on a fake microphone", { skip: !RUN && "set VOICE_BROWSER=1" }, async () => {
  const dir = mkdtempSync(join(tmpdir(), "vf-"));
  // 1 s silence, 700 ms @ 240 Hz, 500 ms silence, 700 ms @ 240 Hz, then a long silence (the file loops).
  writeFileSync(join(dir, "mic.wav"), wav([{ ms: 1000 }, { ms: 700, f0: 240 }, { ms: 500 }, { ms: 700, f0: 240 }, { ms: 3100 }]));
  writeFileSync(join(dir, "index.html"), `<!doctype html><script type="module">
    import { VoiceFeatures } from "/@fs${ROOT}src/voice/features.ts";
    window.run = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const vf = new VoiceFeatures();
      await vf.attach(stream);
      await new Promise((r) => setTimeout(r, 6500));   // > one loop of the 6 s file
      // Finalize over the newest loop: tone pair at loop offset 1.0-2.9 s.
      const now = Date.now();
      const u = vf.finalize({ text: "umm paanch hai", startedAt: now - 6000 });
      vf.detach();
      return u;
    };
  </script>`);
  const { createServer } = await import("vite");
  const server = await createServer({ root: dir, configFile: false, logLevel: "error", server: { port: 0, fs: { allow: [ROOT, dir] } } });
  await server.listen();
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-audio-capture=${join(dir, "mic.wav")}`, "--autoplay-policy=no-user-gesture-required"] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(server.resolvedUrls.local[0]);
    const u = await page.evaluate(() => window.run());
    assert.deepEqual(errors, []);
    assert.ok(u, "an utterance was found");
    console.log("browser features:", JSON.stringify(u.features));
    assert.ok(Math.abs(u.features.f0MedianHz - 240) / 240 < 0.02, `f0 ${u.features.f0MedianHz}`);
    assert.ok(u.features.pauseCount >= 1, `pauses ${u.features.pauseCount}`);
    assert.ok(u.features.longestPauseMs >= 400 && u.features.longestPauseMs <= 600, `longest pause ${u.features.longestPauseMs}`);
    assert.equal(u.features.fillerCount, 1);
  } finally {
    await browser.close();
    await server.close();
  }
});

/** Serve `html` from a temp root through Vite (repo files via /@fs) and run window.run() in Chromium. */
async function inBrowser(html, micWav, timeout = 30_000) {
  const dir = mkdtempSync(join(tmpdir(), "vf-"));
  writeFileSync(join(dir, "mic.wav"), micWav);
  writeFileSync(join(dir, "index.html"), html);
  const { createServer } = await import("vite");
  const server = await createServer({ root: dir, configFile: false, logLevel: "error", server: { port: 0, fs: { allow: [ROOT, dir] } } });
  await server.listen();
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-audio-capture=${join(dir, "mic.wav")}`, "--autoplay-policy=no-user-gesture-required"] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.setDefaultTimeout(timeout);
    await page.goto(server.resolvedUrls.local[0]);
    const out = await page.evaluate(() => window.run());
    return { out, errors };
  } finally {
    await browser.close();
    await server.close();
  }
}

test("browser: onset is measured against a known teacher end in ONE clock (epoch ms)", { skip: !RUN && "set VOICE_BROWSER=1" }, async () => {
  // The "child" is an oscillator gated on at a known context time, captured back through a MediaStream in the
  // same context; the teacher's end is a link event 700 ms (wall clock) before that gate opens.
  const { out, errors } = await inBrowser(`<!doctype html><script type="module">
    import { VoiceFeatures } from "/@fs${ROOT}src/voice/features.ts";
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    window.run = async () => {
      const ctx = new AudioContext();
      await ctx.resume();
      const osc = ctx.createOscillator(); osc.frequency.value = 240;
      const g = ctx.createGain(); g.gain.value = 0;
      const dest = ctx.createMediaStreamDestination();
      osc.connect(g).connect(dest); osc.start();
      const vf = new VoiceFeatures();
      await vf.attachTap({ stream: dest.stream, ctx, teacherEnd: "local" });
      await sleep(800);                                   // noise-floor seed
      const results = [];
      for (let k = 0; k < 5; k++) {
        vf.onLinkEvent({ type: "teacher_audio_start" });
        await sleep(200);
        vf.onLinkEvent({ type: "teacher_audio_end" });    // stamped now (+ outputLatency)
        const endAt = Date.now();
        g.gain.setValueAtTime(0.3, ctx.currentTime + 0.7); // the child starts 700 ms later
        g.gain.setValueAtTime(0, ctx.currentTime + 1.5);
        vf.onLinkEvent({ type: "child_speech_start", at: endAt + 700 });
        await sleep(1800);
        vf.onLinkEvent({ type: "child_speech_end", at: endAt + 1500 });
        const u = vf.onLinkEvent({ type: "child_final", text: "paanch", startedAt: endAt + 700, typed: false, asrConfidence: 0.9 });
        results.push(u?.features?.onsetMs ?? null);
      }
      const outLat = (ctx.outputLatency || ctx.baseLatency || 0) * 1000;
      vf.detach();
      return { onsets: results, outLat };
    };
  </script>`, wav([{ ms: 1000 }]));
  assert.deepEqual(errors, []);
  console.log("browser onset vs known teacher end (expected 700 − outputLatency):", JSON.stringify(out));
  for (const o of out.onsets) {
    assert.ok(o != null, "every answer has an onset");
    assert.ok(Math.abs(o - (700 - out.outLat)) <= 60, `onset ${o} (outputLatency ${out.outLat})`);
  }
});

test("browser: /dev/lesson wiring — a spoken push-to-talk turn POSTs its voice features on /api/lesson/turn", { skip: !RUN && "set VOICE_BROWSER=1" }, async () => {
  // Real LessonRuntime + real CascadeLink (STT call unavailable → push-to-talk recording), fake mic speaking a
  // tone, fake API and transcriber. Asserts the turn request carries numbers-only features.
  const { out, errors } = await inBrowser(`<!doctype html><script type="module">
    import { LessonRuntime } from "/@fs${ROOT}src/lesson/runtime.ts";
    import { CascadeLink } from "/@fs${ROOT}src/lesson/cascadeLink.ts";
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    window.run = async () => {
      const turns = [];
      const api = {
        start: async () => ({ lessonId: "00000000-0000-0000-0000-000000000001", topic: { id: "t", title: "T", chapter: "1" }, teacher: { id: "a", name: "A", voice: "marin" }, moduleCommands: [], ui: {} }),
        turn: async (req) => { turns.push(req); return { move: { kind: "probe", shape: "s" }, moduleCommands: [], ui: {} }; },
        end: async () => ({ ok: true }),
        realtimeToken: async () => { throw new Error("unused"); },
      };
      const rt = new LessonRuntime({ api, createLink: (_m, ctx) => new CascadeLink({
        lessonId: ctx.lessonId, levels: ctx.levels,
        fetchToken: async () => { throw new Error("no STT in this test"); },
        transcribe: async () => ({ text: "paanch hai", asrConfidence: 0.9 }),
        speech: async () => { throw new Error("no TTS in this test"); },
      }) });
      await rt.start("child-1", "voice");
      await sleep(1500);                                 // worklet up, floor seeded
      rt.talkStart();
      await sleep(1800);
      rt.talkEnd();
      for (let i = 0; i < 40 && !turns.length; i++) await sleep(100);
      await rt.end();
      return turns.map((t) => ({ childText: t.childText, voiceFeatures: t.voiceFeatures ?? null }));
    };
  </script>`, wav([{ ms: 300 }, { ms: 6000, f0: 240 }, { ms: 300 }]));
  assert.deepEqual(errors, []);
  console.log("turn requests:", JSON.stringify(out));
  assert.equal(out.length, 1, "one Director turn");
  const v = out[0].voiceFeatures;
  assert.ok(v, "the turn carries voice features");
  assert.equal(v.context, "answer");
  assert.ok(v.features.durationMs > 500, `duration ${v.features.durationMs}`);
  assert.ok(Math.abs(v.features.f0MedianHz - 240) / 240 < 0.03, `f0 ${v.features.f0MedianHz}`);
  for (const [k, x] of Object.entries(v.features)) assert.equal(typeof x, "number", k);
  assert.ok(!JSON.stringify(v).includes("paanch"), "no transcript text");
});
