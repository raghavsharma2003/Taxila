// ROUND 3 — stream duplex acceptance against a RUNNING server (local first, then taxila.dev).
//   NODE_USE_ENV_PROXY=1 node tests/prod/round3-duplex.mjs            (TAXILA_BASE=http://localhost:PORT for local)
//   DUPLEX_OWNER_EMAIL / DUPLEX_OWNER_PASSWORD   an account listed in TAXILA_DUPLEX_LIVE_FOR on the target (the owner-test
//                                                cohort). Locally the script signs that account up itself when
//                                                DUPLEX_OWNER_SIGNUP=1 and deletes it after.
// Needs docs/design/round3/duplex/APPLY.md applied, built and deployed, and on the target: TAXILA_DUPLEX=shadow,
// TAXILA_DUPLEX_LIVE_FOR=<owner account>. Arms, each naming what it proves:
//   config     anonymous GET /api/duplex/config → shadow (production stays shadow for everyone), no-store, Vary: cookie
//   everyone   a fresh signed-in parent (not in the cohort) → still shadow: the cohort is not "anyone with a session"
//   owner      the cohort account → { duplex: "on", cohort: "owner" } (the owner can try hands-free on any device)
//   shadow     POST /api/duplex/shadow still answers 204 (round-2 telemetry unbroken)
//   bundle     the served client carries the round-3 engine (stage A version 2026-10-09.r3) and the eager end of turn
//   browser    (Chromium available, R3_BROWSER != 0) the switch end to end in the shipped client: a spoken lesson with a FAKE
//              microphone and a scripted transcription call (the p1-duplex acceptance harness's fake, copied: that file runs
//              on import), and no click after the start tap:
//                - owner (needs the cohort account above): GET /api/duplex/config answers on/owner to the page, no talk button,
//                  and the engine commits a spoken turn (TurnRequest.duplex.transcriptHash) hands-free;
//                - everyone (a fresh account): the page hears shadow, no turn carries a duplex summary (today's path, the
//                  engine only logs);
//                - slow switch (the config answer held 4 s): still no duplex turn (patch 02: an unreadable switch runs shadow;
//                  before it the client failed OPEN to "on" and a child outside the cohort went live).
//              Real transcription needs WebRTC to Azure from a real device: not attempted from the sandbox.
//   evidence   the switch criteria from the committed round-3 result files: INFO, never a deploy failure
import fs from "node:fs";
import { ok, warn, done, BASE, isLocal, apiClient, withTestAccount } from "./lib.mjs";

const getConfig = async (api) => {
  const r = await fetch(BASE + "/api/duplex/config", { headers: api?.cookie?.() ? { cookie: api.cookie() } : {} }).catch(() => null);
  return { status: r?.status ?? 0, body: r && r.status === 200 ? await r.json().catch(() => null) : null, cache: r?.headers.get("cache-control"), vary: r?.headers.get("vary") };
};

// ── config (anonymous) ──
const anon = await getConfig(null);
ok(anon.status === 200 && ["on", "shadow", "off"].includes(anon.body?.duplex), `config: GET /api/duplex/config → ${anon.status} ${JSON.stringify(anon.body)}`);
ok(anon.body?.duplex === "shadow", `config: production stays shadow for an anonymous device (${anon.body?.duplex})`);
ok(anon.cache === "no-store", `config: no-store (${anon.cache})`);
ok(/cookie/i.test(anon.vary ?? ""), `config: Vary: cookie, so no cache keys a cohort answer on the URL alone (${anon.vary ?? "none"}; missing = round-3 config not deployed)`);
ok(!("cohort" in (anon.body ?? {})), "config: an anonymous answer names no cohort");

// ── everyone else (a fresh parent, signed in) ──
await withTestAccount(async ({ api }) => {
  const c = await getConfig(api);
  ok(c.body?.duplex === "shadow" && !c.body?.cohort, `everyone: a signed-in parent outside the cohort still gets shadow (${JSON.stringify(c.body)})`);
}, { tag: "r3dx", controls: null });

// ── the owner-test cohort ──
const email = process.env.DUPLEX_OWNER_EMAIL, password = process.env.DUPLEX_OWNER_PASSWORD;
if (email && password) {
  const api = apiClient();
  let signedUp = false;
  try {
    if (process.env.DUPLEX_OWNER_SIGNUP === "1") {
      await api("POST", "/api/auth/signup", { email, password, name: "Duplex Owner Test", isGuardianAdult: true });
      signedUp = true;
    } else await api("POST", "/api/auth/login", { email, password });
    const c = await getConfig(api);
    ok(c.body?.duplex === "on" && c.body?.cohort === "owner", `owner: the cohort account gets the hands-free teacher live (${JSON.stringify(c.body)})`);
  } catch (e) {
    ok(false, `owner: ${e.message}`);
  } finally {
    if (signedUp) await api("DELETE", "/api/account", { password, confirm: true }).then(() => console.log("cleanup: owner test account deleted"), (e) => ok(false, `cleanup: ${e.message}`));
  }
} else warn("owner: set DUPLEX_OWNER_EMAIL / DUPLEX_OWNER_PASSWORD (an account in TAXILA_DUPLEX_LIVE_FOR) to check the cohort");

// ── browser (owner cohort vs everyone, end to end in the shipped client) ──
const FIXTURE = new URL("./fixtures/p1-duplex-child-answer.wav", import.meta.url).pathname;
const browserOn = () => process.env.R3_BROWSER !== "0" && fs.existsSync(process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers") && fs.existsSync(FIXTURE);
// the scripted transcription call (copied from tests/prod/p1-duplex-acceptance.mjs FAKE_CALL, which runs on import)
const FAKE_CALL = () => {
  const NativeAudioContext = window.AudioContext;
  let level = () => 0;
  const gum = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = async (c) => {
    const s = await gum(c);
    try {
      const ctx = new NativeAudioContext(); const an = ctx.createAnalyser(); an.fftSize = 1024; ctx.createMediaStreamSource(s).connect(an);
      const buf = new Float32Array(an.fftSize);
      level = () => { an.getFloatTimeDomainData(buf); let e = 0; for (const v of buf) e += v * v; return 10 * Math.log10(e / buf.length + 1e-12); };
      void ctx.resume();
    } catch { /* level stays 0 */ }
    return s;
  };
  window.__r3 = { sent: [] };
  window.RTCPeerConnection = class {
    constructor() { this.connectionState = "new"; }
    addTrack() {}
    createDataChannel() { const dc = { readyState: "connecting", send: (m) => window.__r3.sent.push(JSON.parse(m)), close() { this.readyState = "closed"; } }; this.dc = dc; return dc; }
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

/** One spoken lesson in Chromium for a signed-in api client and child; returns what the page saw. No TLS errors ignored. */
async function spokenLesson(api, child, { slowConfigMs = 0 } = {}) {
  process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
  const { chromium } = await import("playwright");
  const proxy = !isLocal && process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const browser = await chromium.launch({ ...(proxy ? { proxy } : {}), args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-audio-capture=${FIXTURE}`, "--autoplay-policy=no-user-gesture-required"] });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const c = api.cookie(); const i = c.indexOf("=");
    await context.addCookies([{ name: c.slice(0, i), value: c.slice(i + 1), url: BASE }]);
    await context.grantPermissions(["microphone"], { origin: BASE }).catch(() => {});
    await context.addInitScript(FAKE_CALL);
    const page = await context.newPage();
    await page.route("**/api/voice/stt-token", (r) => r.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify({ token: "ek_fake", expiresAt: 0, base: "https://stt.invalid/openai/v1", session: { type: "transcription", audio: { input: { turn_detection: { type: "server_vad", silence_duration_ms: 900 } } } } }) }));
    await page.route("https://stt.invalid/**", (r) => r.fulfill({ status: 201, contentType: "application/sdp", body: "v=0 answer" }));
    // a slow or unreachable switch (an overloaded server, a flaky network): the answer arrives after the client gave up
    if (slowConfigMs) await page.route("**/api/duplex/config", async (r) => { await new Promise((z) => setTimeout(z, slowConfigMs)); await r.continue().catch(() => {}); });
    const turns = [], configs = [];
    page.on("request", (rq) => { if (rq.url().endsWith("/api/lesson/turn") && rq.method() === "POST") { try { turns.push(JSON.parse(rq.postData() ?? "{}")); } catch { /* */ } } });
    page.on("response", async (rs) => { if (rs.url().endsWith("/api/duplex/config")) configs.push(await rs.json().catch(() => null)); });
    if (process.env.R3_DEBUG) {
      page.on("request", (rq) => { if (/duplex|stt|lesson\/(start|turn)/.test(rq.url())) console.log(`  [r3] ${rq.method()} ${rq.url().replace(BASE, "")}`); });
      page.on("console", (m) => { if (/duplex|cascade|stepped|push-to-talk/i.test(m.text())) console.log(`  [r3] console ${m.text().slice(0, 160)}`); });
    }
    await page.goto(`${BASE}/`).catch(() => {});
    await page.evaluate((cid) => { try { localStorage.setItem(`taxila.child.${cid}.prefs`, JSON.stringify({ hello: true, pttNoteSeen: true })); } catch { /* */ } }, child.id).catch(() => {});
    await page.goto(`${BASE}/c/${child.id}/lesson/new?topic=c5-maths-ch02-t02&duplex=default`);
    const hear = page.locator('[data-testid="tap-to-hear"]');
    await hear.waitFor({ timeout: 45_000 }).catch(() => {});
    if (await hear.isVisible().catch(() => false)) await hear.click();
    const spoken = () => turns.filter((t) => !t.typed && (t.childText ?? "") !== "");
    const deadline = Date.now() + 75_000;
    while (Date.now() < deadline && !spoken().length) await page.waitForTimeout(1000);
    await page.waitForTimeout(1500);
    const mic = await page.locator('[data-testid="mic"]').isVisible().catch(() => false);
    return { configs, spoken: spoken(), mic };
  } finally {
    await browser.close();
  }
}

async function cohortAccount(fn) {
  const api = apiClient();
  let signedUp = false;
  try {
    if (process.env.DUPLEX_OWNER_SIGNUP === "1") { await api("POST", "/api/auth/signup", { email, password, name: "Duplex Owner Test", isGuardianAdult: true }); signedUp = true; }
    else await api("POST", "/api/auth/login", { email, password });
    const { child } = await api("POST", "/api/children", { firstName: "Riya", classLevel: 5, languagePref: "hinglish", interests: ["cricket"] });
    await api("POST", "/api/consent", { childId: child.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
    await api("POST", "/api/parent/controls", { childId: child.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
    await fn({ api, child });
  } catch (e) {
    ok(false, `browser (owner): ${e.message}`);
  } finally {
    if (signedUp) await api("DELETE", "/api/account", { password, confirm: true }).catch((e) => ok(false, `cleanup: ${e.message}`));
  }
}

if (!browserOn()) warn("browser: Chromium or the fixture is not available (or R3_BROWSER=0): the end-to-end arms are skipped");
else {
  if (email && password && process.env.DUPLEX_OWNER_SIGNUP === "1") {
    await cohortAccount(async ({ api, child }) => {
      const r = await spokenLesson(api, child);
      const d = r.spoken.find((t) => t.duplex?.transcriptHash);
      ok(r.configs.some((c) => c?.duplex === "on" && c?.cohort === "owner"), `browser (owner): the page heard the cohort answer (${JSON.stringify(r.configs)})`);
      ok(!r.mic, "browser (owner): no talk button: the teacher is hands-free for the owner");
      ok(!!d, `browser (owner): the duplex engine committed a spoken turn from the fake mic with no click (${r.spoken.length} spoken: ${r.spoken.map((t) => JSON.stringify(t.childText)).join(", ")})`);
    });
  } else warn("browser (owner): needs DUPLEX_OWNER_EMAIL / _PASSWORD with DUPLEX_OWNER_SIGNUP=1 (it builds a child on that account); skipped");
  await withTestAccount(async ({ api, child }) => {
    const r = await spokenLesson(api, child);
    ok(r.configs.every((c) => c?.duplex !== "on"), `browser (everyone): the page heard shadow, not on (${JSON.stringify(r.configs)})`);
    ok(r.spoken.every((t) => !t.duplex), `browser (everyone): no turn carries a duplex summary: today's path decides, the engine only logs (${r.spoken.length} spoken)`);
  }, { tag: "r3dx-b" });
  // the switch cannot be read in time (patch 02): a child outside the cohort must stay on today's path, never go live
  await withTestAccount(async ({ api, child }) => {
    const r = await spokenLesson(api, child, { slowConfigMs: 4000 });
    ok(r.spoken.length > 0 && r.spoken.every((t) => !t.duplex), `browser (slow switch): with GET /api/duplex/config answering after 4 s, no turn carries a duplex summary (the lesson stays shadow; ${r.spoken.length} spoken${r.spoken.some((t) => t.duplex) ? ": WENT LIVE (patch 02 not applied)" : ""})`);
  }, { tag: "r3dx-s" });
}

// ── shadow telemetry route (round 2) ──
{
  const body = { lessonId: "00000000-0000-4000-8000-000000000d18", summary: { schema: "duplex-shadow/1", mode: "shadow", band: "B3", lane: "live_transcribe", durMs: 1000, frames: 50, turns: [], overlaps: [], safetyRows: 0, fallbacks: [] } };
  const r = await fetch(BASE + "/api/duplex/shadow", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => ({ status: 0 }));
  ok(r.status === 204, `shadow: POST /api/duplex/shadow → ${r.status}`);
}

// ── bundle ──
try {
  const html = await (await fetch(BASE + "/")).text();
  const queue = [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map((m) => new URL(m[1], BASE + "/").href);
  const seen = new Set();
  let engine = false, eager = false;
  for (let i = 0; i < queue.length && i < 250; i++) {
    const u = queue[i];
    if (seen.has(u)) continue;
    seen.add(u);
    const js = await (await fetch(u)).text().catch(() => "");
    if (js.includes("2026-10-09.r3")) engine = true;
    if (js.includes("eagerStarts")) eager = true;
    for (const m of js.matchAll(/["'`](\/?assets\/[A-Za-z0-9_.-]+\.js)["'`]/g)) queue.push(new URL(m[1].replace(/^\/?/, "/"), BASE).href);
  }
  ok(engine && eager, `bundle: the client carries the round-3 engine (word-aware end of turn ${engine}, eager end of turn ${eager}; ${seen.size} chunks read)`);
} catch (e) {
  ok(false, `bundle: could not read the client: ${e.message}`);
}

// ── evidence (INFO) ──
try {
  const { r3criteria } = await import("../../evals/duplex-r3/criteria.mjs");
  for (const r of r3criteria()) console.log(`INFO criterion ${r.id} ${r.pass === null ? "NO VERDICT" : r.pass ? "MET" : "NOT MET"}: ${r.what} = ${r.value} (n ${r.n}) bar ${r.bar} [${r.src}]`);
} catch (e) {
  warn(`evidence: ${e.message}`);
}
if (!isLocal) warn("prod: hands-free in the browser needs WebRTC to Azure from a real device; this script checks the switch, the route and the shipped client, not a live call");
done();
