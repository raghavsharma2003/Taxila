// ship5 p1-duplex acceptance: the hands-free duplex teacher on a RUNNING server (local first, then taxila.dev).
//   NODE_USE_ENV_PROXY=1 node tests/prod/p1-duplex-acceptance.mjs           (TAXILA_BASE=http://localhost:PORT for a local server)
// Needs docs/design/ship5/p1-duplex/APPLY.md applied, built and deployed. Arms, each naming what it proves:
//   config   GET /api/duplex/config → 200 { duplex: "on" }, no-store (404 = patch 04 missing; "off" = killed by
//            TAXILA_DUPLEX, which this run reports as a FAIL because the feature ships ON).
//   bundle   the served client carries the engine and the switch: the lesson chunk references /api/duplex/config and the
//            engine's own reason codes (a stale build without patch 03/05 has neither).
//   seam     TurnRequest.duplex on a spoken turn is accepted (never a 400), with no effect on an ordinary answer; with P1_SAFETY=1 a clean final carrying duplex.safetyPending (the engine's sticky partial predicate)
//            still gets the safeguarding move with Childline 1098 and Tele-MANAS 14416. Opt-in with P1_SAFETY=1: it opens a
//            real safeguarding incident, and that test account then FAILS cleanup (erase_review) until the team reviews it.
//   browser  (Chromium available) a spoken lesson with a FAKE MICROPHONE playing a child's answer on a loop
//            (tests/prod/fixtures/p1-duplex-child-answer.wav, Azure TTS child-like voice), and NO click after the start tap:
//              - no talk button is rendered while the engine is live (hands-free);
//              - a POST /api/lesson/turn arrives carrying `duplex.transcriptHash` (the engine committed the turn: mic → shared
//                tap → gpt-live-transcribe partials → engine → turn), with no tap on any talk control;
//              - with ?duplex=0 (the device kill switch) the talk button is back and turns carry no `duplex` (today's path).
//            If the transcription call is refused for quota (429), the arm checks the graceful path instead: the talk
//            button appears and the lesson continues, and it WARNs rather than failing on the STT quota.
// Timing numbers (gap, yield) are NOT asserted here: from the sandbox they measure the proxy. They come from
// evals/p1-duplex (TaxilaFDB, AMI real adult speech) and the on-device stats.
import fs from "node:fs";
import { withTestAccount, ok, warn, done, BASE, isLocal, launch } from "./lib.mjs";

const browserOn = () => {
  if (process.argv.includes("--no-browser")) return false;
  const dir = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  return fs.existsSync(dir) && fs.readdirSync(dir).some((d) => d.startsWith("chromium"));
};

const HELPLINES = [/1098/, /14416/];
const FIXTURE = new URL("./fixtures/p1-duplex-child-answer.wav", import.meta.url).pathname;

// ── config ──
const cfgRes = await fetch(BASE + "/api/duplex/config").catch(() => ({ status: 0 }));
const cfg = cfgRes.status === 200 ? await cfgRes.json().catch(() => null) : null;
ok(cfgRes.status === 200, `config: GET /api/duplex/config → ${cfgRes.status} (404 = patch 04 not deployed)`);
ok(cfg?.duplex === "on", `config: the duplex teacher ships ON (server says ${cfg?.duplex}; "off" = TAXILA_DUPLEX kill switch set)`);
ok((cfgRes.headers?.get?.("cache-control") ?? "").includes("no-store"), "config: no-store (a kill reaches the next lesson at once)");

// ── bundle ──
try {
  const html = await (await fetch(BASE + "/")).text();
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map((m) => m[1]);
  const seen = new Set();
  let hasSwitch = false, hasEngine = false;
  const queue = scripts.map((s) => new URL(s, BASE + "/").href);
  // walk the entry and the chunks it names (one level of dynamic imports is enough: the lesson chunk names the duplex one)
  for (let i = 0; i < queue.length && i < 200; i++) {
    const u = queue[i];
    if (seen.has(u)) continue;
    seen.add(u);
    const js = await (await fetch(u)).text().catch(() => "");
    if (js.includes("/api/duplex/config")) hasSwitch = true;
    if (js.includes("sustained_voice") && js.includes("lexical_horizon")) hasEngine = true;
    for (const m of js.matchAll(/["'`](\/?assets\/[A-Za-z0-9_.-]+\.js)["'`]/g)) queue.push(new URL(m[1].replace(/^\/?/, "/"), BASE).href);
  }
  ok(hasSwitch, `bundle: the client resolves the duplex switch (/api/duplex/config referenced; ${seen.size} chunks read)`);
  ok(hasEngine, "bundle: the duplex engine ships in the client (its governor reason codes are present)");
} catch (e) {
  ok(false, `bundle: could not read the client: ${e.message}`);
}

// ── seam ──
await withTestAccount(async ({ api, child }) => {
  const s = await api("POST", "/api/lesson/start", { childId: child.id, mode: "cascade" }).catch(() => api("POST", "/api/lesson/start", { childId: child.id, mode: "text" }));
  ok(!!s.lessonId, "seam: a spoken lesson starts");
  let seq = 0;
  const say = (childText, duplex) => api("POST", "/api/lesson/turn", { lessonId: s.lessonId, childText, asrConfidence: 0.9, typed: false, turnSeq: ++seq, ...(duplex ? { duplex } : {}) }, [200, 201, 400, 409, 422]);
  const r1 = await say("haan ready", { transcriptHash: "a1b2c3", safetyPending: null, engineSummary: { engine: "stage-a/live", reasons: ["turn_end"], pComplete: [], decidedAfterEndMs: 340 } });
  ok(r1.status === 200 || r1.status === 201, `seam: a turn carrying TurnRequest.duplex is accepted (${r1.status})`);
  ok(r1.move?.kind !== "safeguard", `seam: an ordinary duplex turn is not a safeguard (${r1.move?.kind})`);
  if (process.env.P1_SAFETY === "1") {
    // the engine's predicate tripped on a PARTIAL ("…mujhe mar jaana hai") and the final was revised to clean words
    const r2 = await say("theek hai", { transcriptHash: "d4e5f6", safetyPending: { kind: "self_harm", source: "predicate" } });
    ok(r2.status === 200 || r2.status === 201, `seam: the safety-pending turn is accepted (${r2.status})`);
    ok(r2.move?.kind === "safeguard", `seam: duplex.safetyPending on a clean final → the safeguarding move (${r2.move?.kind})`);
    const said = String(r2.teacherReply ?? "") + " " + JSON.stringify(r2.ui ?? {});
    ok(HELPLINES.every((re) => re.test(said)), "seam: the safeguard carries Childline 1098 and Tele-MANAS 14416");
  } else warn("seam: the safety-pending check opens a real safeguarding incident (the account then needs the safeguarding team's review before it can be deleted): set P1_SAFETY=1 to run it");
  await api("POST", "/api/lesson/end", { lessonId: s.lessonId }).catch(() => {});
});

// ── browser ──
// A fake transcription CALL for the "scripted" arm (window.RTCPeerConnection replaced in the page): the data channel opens,
// and whenever the fake microphone's energy (the fixture: 2 s silence, ~2.3 s of a child's "मुझे लगता है बारह", 4.5 s silence,
// looped) rises and falls, it sends what gpt-live-transcribe sends: speech_started, the words as deltas ~600 ms after they are
// spoken, the completed transcript ~500 ms after the speech ends. Everything else is the product: the shared AudioWorklet
// tap on the mic, the duplex engine, the cascade link, the runtime, the server turn.
const FAKE_CALL = () => {
  const NativeAudioContext = window.AudioContext;
  let level = () => 0;
  const gum = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = async (c) => {
    const s = await gum(c);
    try {
      const ctx = new NativeAudioContext();
      const an = ctx.createAnalyser();
      an.fftSize = 1024;
      ctx.createMediaStreamSource(s).connect(an);
      const buf = new Float32Array(an.fftSize);
      level = () => { an.getFloatTimeDomainData(buf); let e = 0; for (const v of buf) e += v * v; return 10 * Math.log10(e / buf.length + 1e-12); };
      void ctx.resume();
    } catch { /* level stays 0 */ }
    return s;
  };
  window.__p1 = { sent: [] };
  window.RTCPeerConnection = class {
    constructor() { this.connectionState = "new"; }
    addTrack() {}
    createDataChannel() {
      const dc = { readyState: "connecting", send: (m) => window.__p1.sent.push(JSON.parse(m)), close() { this.readyState = "closed"; } };
      this.dc = dc;
      return dc;
    }
    async createOffer() { return { type: "offer", sdp: "v=0" }; }
    async setLocalDescription(d) { this.localDescription = d; }
    async setRemoteDescription() {
      setTimeout(() => {
        this.dc.readyState = "open"; this.connectionState = "connected"; this.dc.onopen?.();
        let on = false, startAt = 0, quietSince = 0, n = 0;
        const words = ["मुझे", "लगता", "है", "बारह"];
        const emit = (e) => this.dc.onmessage?.({ data: JSON.stringify(e) });
        setInterval(() => {
          const loud = level() > -45, now = performance.now();
          if (loud && !on) { on = true; startAt = now; n++; emit({ type: "input_audio_buffer.speech_started", item_id: `it${n}`, audio_start_ms: Math.round(now) }); }
          if (loud) quietSince = 0;
          if (!loud && on) {
            if (!quietSince) quietSince = now;
            if (now - quietSince > 250) {
              on = false;
              const id = `it${n}`, dur = quietSince - startAt;
              words.forEach((w, i) => setTimeout(() => emit({ type: "conversation.item.input_audio_transcription.delta", item_id: id, delta: (i ? " " : "") + w }), Math.max(0, 600 - (now - quietSince) - dur * (1 - (i + 1) / words.length))));
              setTimeout(() => emit({ type: "conversation.item.input_audio_transcription.completed", item_id: id, transcript: words.join(" ") }), 900);
            }
          }
        }, 20);
      }, 5);
    }
    close() {}
  };
};

if (!browserOn()) warn("browser: Chromium not available here: the hands-free arms are skipped");
else if (!fs.existsSync(FIXTURE)) ok(false, `browser: fixture missing (${FIXTURE})`);
else {
  for (const arm of (process.env.P1_ARMS || "scripted,real,killed").split(",")) {
    await withTestAccount(async ({ api, child }) => {
      const { browser, context, page } = await launch({
        cookieFrom: api,
        viewport: { width: 390, height: 844 },
        launch: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-audio-capture=${FIXTURE}`, "--autoplay-policy=no-user-gesture-required"] },
      });
      try {
        await context.grantPermissions(["microphone"], { origin: BASE }).catch(() => {});
        if (arm !== "real") {
          await context.addInitScript(FAKE_CALL);
          await page.route("**/api/voice/stt-token", (r) => r.fulfill({ status: 200, contentType: "application/json",
            body: JSON.stringify({ token: "ek_fake", expiresAt: 0, base: "https://stt.invalid/openai/v1", session: { type: "transcription", audio: { input: { turn_detection: { type: "server_vad", silence_duration_ms: 900 } } } } }) }));
          await page.route("https://stt.invalid/**", (r) => r.fulfill({ status: 201, contentType: "application/sdp", body: "v=0 answer" }));
        }
        const turns = [], refused = [], logs = [];
        page.on("request", (rq) => {
          if (rq.url().endsWith("/api/lesson/turn") && rq.method() === "POST") { try { turns.push(JSON.parse(rq.postData() ?? "{}")); } catch { /* */ } }
        });
        page.on("response", (rs) => { if (rs.url().endsWith("/api/voice/stt-token") && rs.status() >= 400) refused.push(rs.status()); });
        page.on("console", (m) => { const t = m.text(); if (/duplex|cascade|transcri|worklet|stepped aside/i.test(t)) logs.push(`${m.type()}: ${t.slice(0, 200)}`); });
        page.on("pageerror", (e) => logs.push(`pageerror: ${String(e).slice(0, 200)}`));
        await page.goto(`${BASE}/`).catch(() => {});
        await page.evaluate((cid) => { try { localStorage.setItem(`taxila.child.${cid}.prefs`, JSON.stringify({ hello: true, pttNoteSeen: true })); } catch { /* */ } }, child.id).catch(() => {});
        await page.goto(`${BASE}/c/${child.id}/lesson/new?topic=c5-maths-ch02-t02${arm === "killed" ? "&duplex=0" : "&duplex=default"}`);
        // the one start tap (audio needs a user activation); after it, no clicks at all
        const hear = page.locator('[data-testid="tap-to-hear"]');
        await hear.waitFor({ timeout: 45_000 }).catch(() => {});
        if (await hear.isVisible().catch(() => false)) await hear.click();
        const deadline = Date.now() + 75_000;
        const spokenTurns = () => turns.filter((t) => !t.typed && (t.childText ?? "") !== "");
        while (Date.now() < deadline && !spokenTurns().some((t) => arm === "killed" || t.duplex)) {
          if (arm === "real" && logs.some((l) => /falling back to push-to-talk/.test(l))) break;
          await page.waitForTimeout(1000);
        }
        const mic = await page.locator('[data-testid="mic"]').isVisible().catch(() => false);
        const spoken = spokenTurns();
        const d = spoken.find((t) => t.duplex?.transcriptHash);
        if (logs.length) console.log(`     page log (${arm}):\n       ${logs.slice(0, 12).join("\n       ")}`);
        if (arm === "scripted") {
          ok(!mic, "browser (scripted STT): no talk button while the duplex engine is live (hands-free)");
          ok(!!d, `browser (scripted STT): the engine committed a spoken turn from the fake mic with no click: mic → shared tap → engine → POST /api/lesson/turn (${spoken.length} spoken turns: ${spoken.map((t) => JSON.stringify(t.childText)).join(", ")})`);
          ok(!!d && d.duplex.safetyPending === null && typeof d.duplex.engineSummary?.decidedAfterEndMs === "number", `browser (scripted STT): the turn carries the engine summary (decided ${d?.duplex?.engineSummary?.decidedAfterEndMs} ms after the voice ended, safety ${JSON.stringify(d?.duplex?.safetyPending)})`);
          ok(!!d && !/[\u0900-\u097F]/.test(JSON.stringify(d.duplex)), "browser (scripted STT): the duplex summary carries hashes and codes only, never the child's words");
          const vad = await page.evaluate(() => (window.__p1?.sent ?? []).filter((m) => m.type === "session.update").map((m) => m.session?.audio?.input?.turn_detection?.silence_duration_ms ?? null)).catch(() => []);
          ok(vad.includes(1500), `browser (scripted STT): the server VAD became the 1,500 ms backstop (session.update silences: ${vad.join(", ")})`);
        } else if (arm === "real") {
          if (refused.length || logs.some((l) => /falling back to push-to-talk/.test(l))) {
            warn(`browser (real STT): the transcription call could not come up from this runner (${refused.length ? `token ${refused.join(", ")}` : "WebRTC needs UDP to Azure"}); checking the graceful path instead`);
            ok(mic, "browser (real STT unavailable): the talk button is back (today's tap-to-talk path) and the lesson continues");
          } else {
            ok(!mic, "browser (real STT): no talk button while the duplex engine is live (hands-free)");
            ok(!!d, `browser (real STT): gpt-live-transcribe + the engine committed a spoken turn with no click (${spoken.length} spoken: ${spoken.map((t) => JSON.stringify(t.childText)).join(", ")})`);
          }
        } else {
          ok(mic, "browser (?duplex=0): the talk button is back: the kill switch restores today's tap-to-talk path");
          ok(turns.every((t) => !t.duplex), "browser (?duplex=0): no turn carries a duplex summary");
        }
      } finally {
        await browser.close();
      }
    }, { tag: `p1dx-${arm}` });
  }
}

done();
