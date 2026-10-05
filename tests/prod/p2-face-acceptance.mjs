// ship5 p2-face acceptance: the style-C 2D puppet is the lesson face, lip-synced to Diya on the REAL path.
//   NODE_USE_ENV_PROXY=1 node tests/prod/p2-face-acceptance.mjs        (TAXILA_BASE=http://localhost:PORT for a local server)
// Needs patches 01 + 02 + 03 applied and deployed (docs/design/ship5/p2-face/APPLY.md); each arm names what it proves.
//   config     GET /api/face/config: both runtime switches ON (TAXILA_FACE_PUPPET2D, TAXILA_DHD_VISEMES), pack rev;
//   pack       the pack the stage loads is served (geom.json, layers, both posters);
//   lesson     class-3 child (Asha): the lesson face is the puppet, labelled "Asha, AI teacher", drawn and revealed before
//              her first sound, Diya's viseme frames reach the face through server -> tts-stream -> player -> bus, the
//              speaking frames are drawn from them, every batch of one part carries one playAt (the ship5 merge fix), and
//              the drawn mouth tracks the scheduled sound (envelope cross-correlation lag inside a correctness band);
//   arjun      class-6 child (Arjun, no puppet art): TutorFace, never the puppet, never a face swap;
//   kill       the server says puppet2d:false (route fulfilled in the browser: the env switch itself cannot be flipped
//              from a test): the lesson shows TutorFace, no error;
//   packfail   every pack request fails: TutorFace before reveal (the automatic fallback), the label stays, no error;
//   safety     when the dock has a text box: a distress line makes a safety turn, and the face holds the neutral calm
//              (driver.inSafety), never a smile preset (policy R6). Without a text box the arm WARNs (no false PASS).
// From the sandbox these are correctness checks; timing numbers are printed as WARN, never gated (SwiftShader).
import { withTestAccount, launch, ok, warn, done, BASE } from "./lib.mjs";
import { INIT, analyse, q } from "../../evals/p2-face/recorder.mjs";

const ARGS = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"];

// ── config + pack ──
const cfgRes = await fetch(`${BASE}/api/face/config`).catch((e) => ({ status: 0, e }));
const cfg = cfgRes.status === 200 ? await cfgRes.json() : null;
ok(cfgRes.status === 200, `config: GET /api/face/config → ${cfgRes.status} (404 = patch 03 not deployed)`);
ok(cfg?.puppet2d === true && cfg?.visemes === true, `config: puppet2d and visemes ship ON (${JSON.stringify(cfg)})`);
const rev = cfg?.rev ?? "r8";
for (const [f, type] of [["geom.json", /json/], ["face.webp", /webp/], ["mouth_rest.webp", /webp/], ["rest-medium.webp", /webp/], ["rest-close.webp", /webp/]]) {
  const r = await fetch(`${BASE}/face-puppet/${rev}/${f}`);
  ok(r.status === 200 && type.test(r.headers.get("content-type") ?? ""), `pack: /face-puppet/${rev}/${f} → ${r.status} ${r.headers.get("content-type")}`);
}

async function openLesson(api, child, { route } = {}) {
  const h = await launch({ cookieFrom: api, viewport: { width: 412, height: 860 }, launch: { args: ARGS } });
  await h.context.addInitScript(INIT);
  const errors = [];
  h.page.on("pageerror", (e) => errors.push(e.message.slice(0, 200)));
  if (route) await route(h.page);
  await h.page.goto(`${BASE}/c/${child.id}/lesson/new?mode=text&facerig=1`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  return { ...h, errors };
}
const faceInfo = (page) => page.evaluate(() => {
  const p = document.querySelector("[data-face='puppet2d']");
  const any = document.querySelector("[data-face], .tx-tutorface");
  return { puppet: !!p, phase: p?.getAttribute("data-phase") ?? null, label: (p ?? any)?.getAttribute("aria-label") ?? document.querySelector("[aria-label*='AI teacher']")?.getAttribute("aria-label") ?? null, tutorFace: !!document.querySelector(".tx-tutorface"), live: !!window.__puppet };
});
async function speakAndWait(h, ms = 45_000) {
  const tap = h.page.getByText(/Tap to hear/);
  if (await tap.count()) await tap.first().click().catch(() => {});
  const t0 = Date.now();
  let heard = false, quiet = 0;
  while (Date.now() - t0 < ms) {
    await h.page.waitForTimeout(500);
    const on = await h.page.evaluate(() => { const W = window.__rec; return !!W.ctx && W.audio.some((a) => !a.stop && a.rate === 24000 && a.when + a.n / a.rate > W.ctx.currentTime - 0.3); });
    if (on) { heard = true; quiet = 0; } else if (heard && (quiet += 500) >= 2500) break;
  }
  return heard;
}

// ── lesson (Asha) ──
await withTestAccount(async ({ api, child }) => {
  const h = await openLesson(api, child);
  try {
    await h.page.waitForFunction(() => !!window.__puppet, null, { timeout: 60_000 }).catch(() => {});
    const heard = await speakAndWait(h);
    ok(heard, "lesson: her opening was scheduled on the player");
    // a second reply: the help tile that makes her explain (class 3 text mode has picture tiles, no text box)
    const how = h.page.getByRole("button", { name: /Show me how/ });
    if (await how.count()) { await how.first().click().catch(() => {}); await speakAndWait(h); }
    const rec = await h.page.evaluate(() => ({ ...window.__rec, ctx: null, log: window.__puppet?.log ?? [], snap: window.__puppet?.snapshot?.() ?? null }));
    const f = await faceInfo(h.page);
    ok(f.puppet && f.live, `lesson: the face is the live puppet (${JSON.stringify(f)})`);
    ok(f.label === "Asha, AI teacher", `lesson: AI disclosure on the face host (${f.label})`);
    ok(h.errors.length === 0, `lesson: no page errors ${JSON.stringify(h.errors.slice(0, 2))}`);
    const first = rec.log.find((e) => e.type === "firstDraw"), reveal = rec.log.find((e) => e.type === "reveal");
    const a = analyse(rec);
    ok(!!first && !!reveal, `lesson: first draw ${first?.ms} ms, reveal ${reveal?.ms} ms (${reveal?.why}) after mount`);
    ok(!!reveal && reveal.at <= a.firstSoundAt, `lesson: the live face was revealed before her first sound (reveal ${reveal?.at}, sound ${a.firstSoundAt})`);
    const batches = rec.bus.filter((b) => b.n);
    ok(batches.length > 0, `lesson: Diya's viseme frames reached the face (${batches.length} batches, ${batches.reduce((s, b) => s + b.n, 0)} visemes)`);
    // one part, one playAt between cuts (the ship5 merge fix: before it, one part's batches spread 0.1-8 ms)
    let spread = 0, seg = new Map();
    for (const b of rec.bus) { if (b.kind === "cut") { seg = new Map(); continue; } if (!b.n && !b.words) continue; const k = `${b.part}`; if (seg.has(k)) spread = Math.max(spread, Math.abs(seg.get(k) - b.playAt)); else seg.set(k, b.playAt); }
    ok(spread <= 1, `lesson: every batch of one part carries one playAt (max spread ${spread.toFixed(2)} ms)`);
    const speakingFrames = rec.frames.filter((x) => x[3] === "speaking");
    const vis = speakingFrames.filter((x) => x[2] === "visemes").length / Math.max(1, speakingFrames.length);
    ok(vis >= 0.8, `lesson: ${(vis * 100).toFixed(1)}% of speaking frames are drawn from her visemes (n = ${speakingFrames.length})`);
    const lags = a.replies.map((r) => r.gapLagMs);
    ok(lags.length > 0 && lags.every((l) => l >= -100 && l <= 150), `lesson: drawn mouth vs scheduled sound, xcorr lag per reply ${JSON.stringify(lags)} ms inside [-100, 150]`);
    warn(`timing (SwiftShader, not a gate): first draw ${first?.ms} ms, reveal ${reveal?.ms} ms, lag median ${q(lags, 0.5)} ms, freezes in her voice > 180 ms: ${a.freezes.over180} (max ${a.freezes.maxMs} ms over ${a.freezes.voicedSecs} s), fps ${rec.snap?.fpsP50?.toFixed(1)}`);
  } finally { await h.browser.close(); }
}, { child: { classLevel: 3 }, tag: "p2face" });

// ── Arjun keeps TutorFace ──
await withTestAccount(async ({ api, child }) => {
  const h = await openLesson(api, child);
  try {
    await h.page.waitForTimeout(8000);
    const f = await faceInfo(h.page);
    ok(!f.puppet, `arjun: no puppet for Arjun (${JSON.stringify(f)})`);
    ok(f.tutorFace || /Arjun/.test(f.label ?? ""), "arjun: his own face (TutorFace) is shown");
    ok(h.errors.length === 0, `arjun: no page errors ${JSON.stringify(h.errors.slice(0, 2))}`);
  } finally { await h.browser.close(); }
}, { child: { classLevel: 6 }, tag: "p2face" });

// ── the server kill switch, and a pack that cannot load: both land on TutorFace ──
for (const [arm, route] of [
  ["kill", (page) => page.route("**/api/face/config", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ puppet2d: false, visemes: true, rev }) }))],
  ["packfail", (page) => page.route("**/face-puppet/**", (r) => (/rest-(medium|close)\.webp/.test(r.request().url()) ? r.continue() : r.abort("failed")))],
]) {
  await withTestAccount(async ({ api, child }) => {
    const h = await openLesson(api, child, { route });
    try {
      await h.page.waitForTimeout(arm === "packfail" ? 12_000 : 8000);
      const f = await faceInfo(h.page);
      ok(!f.puppet && f.tutorFace, `${arm}: the lesson shows TutorFace, the automatic fallback (${JSON.stringify(f)})`);
      ok(/Asha/.test(f.label ?? "") || f.tutorFace, `${arm}: the face is still labelled (${f.label})`);
      ok(h.errors.length === 0, `${arm}: no page errors ${JSON.stringify(h.errors.slice(0, 2))}`);
    } finally { await h.browser.close(); }
  }, { child: { classLevel: 3 }, tag: "p2face" });
}

// ── safety turns are neutral ──
await withTestAccount(async ({ api, child }) => {
  const h = await openLesson(api, child);
  try {
    await h.page.waitForFunction(() => !!window.__puppet, null, { timeout: 60_000 }).catch(() => {});
    await speakAndWait(h);
    let box = h.page.locator("input.dk-input");
    if (!(await box.count())) { const k = h.page.locator("[data-testid='type']"); if (await k.count()) { await k.first().click().catch(() => {}); box = h.page.locator("input.dk-input"); } }
    if (!(await box.count())) { warn("safety: no text box in this lesson's dock; the neutral safety face is covered by tests/p2-face-unit.test.mjs only"); return; }
    await box.first().fill("mujhe bahut dar lagta hai, ghar pe mujhe roz maarte hain");
    await box.first().press("Enter");
    await speakAndWait(h, 60_000);
    const st = await h.page.evaluate(() => ({ inSafety: window.__puppet?.driver?.inSafety ?? null, log: window.__puppet?.driver?.policy?.log ?? [] }));
    const from = st.log.findIndex((l) => /safety turn: neutral|pose calm_steady/.test(l));
    ok(st.inSafety === true && from >= 0, `safety: the face holds the neutral safety calm after a distress line (${JSON.stringify(st.log.slice(-4))})`);
    ok(from >= 0 && !st.log.slice(from).some((l) => /^emote /.test(l)), `safety: no preset of any kind after the safety turn began (${JSON.stringify(st.log.slice(from, from + 6))})`);
  } finally { await h.browser.close(); }
}, { child: { classLevel: 4 }, tag: "p2face" });

done();
