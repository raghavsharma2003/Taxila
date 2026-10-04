// W2-H, the Studio piece inside the lesson (owner priority 4; LIVE-STUDIO §4, §5.1, AT-11; STUDENT-FLOW §5.3 journey 2):
// drives the REAL child lesson route (Vite dev server: ChildShell, LessonScreen, useDesk, Desk, WorkTray, StudioStage,
// the skeleton renderers, StudioFrame) with the API mocked by page.route, and checks:
//   1. every archetype's skeleton-as-activity sits INSIDE the stage box, which sits inside the tray, at 360 x 800,
//      768 x 1024 and 1366 x 768: nothing overflows, the page never scrolls sideways, every target is ≥ 44 CSS px;
//   2. the seven tray states keep the tray exactly the same size (no layout jump), and no state ever shows a spinner,
//      a percentage, code or error text;
//   3. a gate-passed build (a real router-bench winner) mounts in the opaque-origin frame from bytes re-hashed against
//      its sha, plays with real taps, and is graded by the HOST; from inside the frame fetch / image loads / top
//      navigation are refused and a forged postMessage answer is ignored (AT-11, locally);
//   4. bytes that do not match the build id are never mounted: the skeleton activity takes their place;
//   5. "Show me again" and "Not this one" reach the server.
// Runs in `npm test` when Chromium is installed; STUDIO_BROWSER=0 skips it. Screenshots: STUDIO_SHOTS=<dir>.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, mkdirSync } from "fs";
import { createHash } from "crypto";

const ROOT = new URL("..", import.meta.url).pathname;
const browsersDir = process.env.PLAYWRIGHT_BROWSERS_PATH;
const haveChromium = !!browsersDir && existsSync(browsersDir) && readdirSync(browsersDir).some((d) => d.startsWith("chromium"));
const SKIP = process.env.STUDIO_BROWSER === "0" ? "STUDIO_BROWSER=0" : !haveChromium ? "no Chromium under PLAYWRIGHT_BROWSERS_PATH" : false;
const SHOTS = process.env.STUDIO_SHOTS || null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const KID = { id: "kid-studio-h", first_name: "Kabir", class_level: 5, language_pref: "hinglish", teacher_id: "arjun" };
const LESSON = "aaaaaaaa-1111-4222-8333-444444444444";
const { ARCHETYPES, buildParams } = await import("../server/studio/archetypes/index.js");
const GOLD = JSON.parse(readFileSync(new URL("../evals/live-studio/goldens/goldens.json", import.meta.url), "utf8"));
const FIXTURE = readFileSync(new URL("./fixtures/studio-shade-fraction.html", import.meta.url), "utf8");
const SHA = createHash("sha256").update(FIXTURE, "utf8").digest("hex");

let vite, browser, base;
before(async () => {
  if (SKIP) return;
  const { createServer } = await import("vite");
  vite = await createServer({ root: ROOT, configFile: ROOT + "vite.config.ts", logLevel: "error", server: { port: 0, strictPort: false, host: "127.0.0.1", hmr: false } });
  await vite.listen();
  base = vite.resolvedUrls.local[0].replace(/\/$/, "");
  const { chromium } = await import("playwright");
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  await vite?.close();
});

const skeletonOf = (id) => {
  const a = ARCHETYPES.get(id);
  return { kind: "skeleton", stage: a.stage, skeleton: a.skeleton, archetype: id, intentId: `${LESSON}:st:1`, params: buildParams(a, GOLD[id].params), strings: GOLD[id].strings ?? {} };
};
const frameArt = (sha = SHA) => ({ kind: "frame", stage: { w: 360, h: 320 }, studioKind: "game", archetype: "shade_fraction", skeleton: "fraction-parts", intentId: `${LESSON}:st:1`,
  src: `/api/studio/build?sha=${sha}`, sha256: sha, params: GOLD.shade_fraction.params, strings: GOLD.shade_fraction.strings });

/** A host grader for the mock /api/studio/answer: shade_fraction items in order, from the golden truth. */
function hostGrader() {
  let i = 0;
  const items = GOLD.shade_fraction.params.items;
  return (v) => { const it = items[i]; const correct = !!it && v?.n === it.n && v?.d === it.d; if (correct) i++; return { correct, complete: i >= items.length }; };
}

async function lessonWith(viewport, slot, { calls = [], build = { sha256: SHA, fragment: FIXTURE } } = {}) {
  const mobile = viewport.width < 600;
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1, hasTouch: mobile, isMobile: mobile });
  const ui = { status: "speaking", phase: "teach", handover: "answer", answerForm: "words", tray: "studio", studioSlot: slot, ask: { text: "Try it", itemId: "i1" } };
  const grade = hostGrader();
  await page.route("**/api/**", async (route) => {
    const u = new URL(route.request().url());
    const p = u.pathname;
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (p === "/api/me") return json(200, { guardian: { id: "g1", email: "g@test.invalid", name: "Grown-up" }, children: [KID] });
    if (p === "/api/lesson/start") return json(200, { lessonId: LESSON, topic: { id: "c5-maths-ch02-t01", title: "Fractions", chapter: "Fractions" },
      teacher: { id: "arjun", name: "Arjun", voice: "v", addressedAs: "", role: "AI teacher" }, moduleCommands: [], ui, teacherOpening: "Dekho.", teacherOpeningSeq: 1 });
    if (p === "/api/lesson/turn") return json(200, { move: { kind: "explain", shape: "x" }, moduleCommands: [], ui, teacherReply: "Hmm.", teacherReplySeq: 2 });
    if (p === "/api/lesson/end") return json(200, { summary: null, parentNote: null });
    if (p === "/api/studio/stream") return route.fulfill({ status: 204, body: "" });
    if (p === "/api/studio/slot") return json(200, { slot: null });
    if (p === "/api/studio/build") { calls.push({ p }); return json(200, { ...build, archetype: "shade_fraction", kind: "game", stage: { w: 360, h: 320 } }); }
    if (p === "/api/studio/answer") { const b = JSON.parse(route.request().postData() || "{}"); calls.push({ p, b }); return json(200, grade(b.value)); }
    if (p === "/api/studio/feedback" || p === "/api/studio/frame-error") { calls.push({ p, b: JSON.parse(route.request().postData() || "{}") }); return json(200, { ok: true }); }
    if (p.startsWith("/api/tts") || p.startsWith("/api/voice")) return route.fulfill({ status: 503, body: "" });
    return json(200, {});
  });
  await page.goto(`${base}/c/${KID.id}/lesson/new?mode=text`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="lesson"]', { timeout: 30_000 });
  await page.waitForSelector('[data-testid="tray"][data-kind="studio"] [data-testid="studio-box"]', { timeout: 30_000 });
  await page.waitForFunction(() => { const b = document.querySelector('[data-testid="studio-box"]'); return !!b && b.getBoundingClientRect().width > 0; }, null, { timeout: 10_000 });
  await page.waitForTimeout(300);
  return page;
}

const measure = (page) => page.evaluate(() => {
  const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; };
  const tray = document.querySelector('[data-testid="tray"]');
  const box = document.querySelector('[data-testid="studio-box"]');
  const art = box?.querySelector("svg, iframe, img");
  const targets = [...(box?.querySelectorAll('[role="button"], button, .sk-col, .sk-row, .sk-bin') ?? [])].map((e) => ({ ...r(e), t: (e.textContent || "").slice(0, 20) }));
  const ctrl = [...document.querySelectorAll('[data-testid="studio-more"]')].map(r);
  const trayText = tray?.innerText ?? "";
  return { tray: r(tray?.querySelector(".dk-tray-body") ?? tray), box: r(box), art: r(art), targets, ctrl, trayText,
    trayScroll: tray ? { sh: tray.scrollHeight, ch: tray.clientHeight, sw: tray.scrollWidth, cw: tray.clientWidth } : null,
    page: { sw: document.documentElement.scrollWidth, iw: innerWidth } };
});
const inside = (a, b, e = 0.75) => a && b && a.x >= b.x - e && a.y >= b.y - e && a.x + a.w <= b.x + b.w + e && a.y + a.h <= b.y + b.h + e;

const VIEWPORTS = [{ width: 360, height: 800 }, { width: 768, height: 1024 }, { width: 1366, height: 768 }];
const SKELETON_IDS = [...ARCHETYPES.values()].filter((a) => a.build !== "script").map((a) => a.id);

test("every skeleton activity sits inside its stage box, nothing overflows, targets ≥ 44 px (360 x 800, 768 x 1024, 1366 x 768)", { skip: SKIP, timeout: 600_000 }, async () => {
  const fails = [];
  for (const vp of VIEWPORTS) for (const id of (vp.width === 360 ? SKELETON_IDS : ["shade_fraction", "bar_chart_read", "sort_bins", "hub_flows"])) {
    const page = await lessonWith(vp, { slotId: "s1", intentId: `${LESSON}:st:1`, state: "fallback_shown", artifact: skeletonOf(id) });
    try {
      await page.waitForSelector('[data-testid="studio-skeleton"]', { timeout: 10_000 });
      const m = await measure(page);
      const tag = `${vp.width}x${vp.height} ${id}`;
      if (!inside(m.box, m.tray)) fails.push(`${tag}: box outside tray ${JSON.stringify([m.box, m.tray])}`);
      if (!inside(m.art, m.box)) fails.push(`${tag}: drawing outside box ${JSON.stringify([m.art, m.box])}`);
      if (!m.targets.length) fails.push(`${tag}: no targets`);
      for (const t of m.targets) {
        if (Math.min(t.w, t.h) < 44 - 0.5) fails.push(`${tag}: target ${Math.round(t.w)}x${Math.round(t.h)} "${t.t}" under 44 px`);
        if (!inside(t, m.box, 1.5)) fails.push(`${tag}: target outside box "${t.t}"`);
      }
      for (const c of m.ctrl) if (!inside(c, m.tray, 1)) fails.push(`${tag}: control outside tray`);
      if (m.trayScroll && (m.trayScroll.sh > m.trayScroll.ch + 1 || m.trayScroll.sw > m.trayScroll.cw + 1)) fails.push(`${tag}: tray scrolls`);
      if (m.page.sw > m.page.iw + 1) fails.push(`${tag}: horizontal page scroll`);
      if (SHOTS) await page.screenshot({ path: `${SHOTS}/w2h-${id}-${vp.width}x${vp.height}.png` });
    } finally { await page.close(); }
  }
  assert.deepEqual(fails, []);
});

test("the tray states keep the tray the same size and never show a spinner, a percentage, code or error text", { skip: SKIP, timeout: 300_000 }, async () => {
  const states = ["skeleton_shown", "building", "ready", "revealed", "in_use", "fallback_shown"];
  const sizes = [], fails = [];
  for (const state of states) {
    const page = await lessonWith({ width: 360, height: 800 }, { slotId: "s1", intentId: `${LESSON}:st:1`, state, artifact: skeletonOf("shade_fraction") });
    try {
      await page.waitForSelector(`[data-testid="studio-stage"][data-state="${state}"]`, { timeout: 10_000 });
      await page.waitForTimeout(700);   // the pencil draw / reveal choreography settles
      const m = await measure(page);
      sizes.push({ state, tray: m.tray, box: m.box });
      if (/\d\s*%|loading|error|generat|spinner|function\s*\(|<\w+/i.test(m.trayText)) fails.push(`${state}: forbidden text "${m.trayText.slice(0, 80)}"`);
      const spin = await page.evaluate(() => [...document.querySelectorAll('[data-testid="tray"] *')].some((e) => /spin|progress/i.test(e.className?.baseVal ?? e.className ?? "") || e.getAttribute("role") === "progressbar"));
      if (spin) fails.push(`${state}: a spinner or progress element`);
      const chip = await page.$('[data-testid="studio-chip"]');
      if ((state === "skeleton_shown" || state === "building") !== !!chip) fails.push(`${state}: caption chip ${chip ? "shown" : "missing"}`);
      if (SHOTS) await page.screenshot({ path: `${SHOTS}/w2h-state-${state}.png` });
    } finally { await page.close(); }
  }
  for (const s of sizes) for (const k of ["x", "y", "w", "h"]) {
    if (Math.abs(s.tray[k] - sizes[0].tray[k]) > 4) fails.push(`${s.state}: tray ${k} moved ${s.tray[k]} vs ${sizes[0].tray[k]}`);
    if (Math.abs(s.box[k] - sizes[0].box[k]) > 4) fails.push(`${s.state}: box ${k} moved`);
  }
  assert.deepEqual(fails, []);
});

test("a gate-passed build mounts from re-hashed bytes in an opaque-origin frame, plays with real taps, and the host grades it (AT-10/AT-11 locally)", { skip: SKIP, timeout: 300_000 }, async () => {
  const calls = [];
  const page = await lessonWith({ width: 360, height: 800 }, { slotId: "s1", intentId: `${LESSON}:st:1`, state: "revealed", artifact: frameArt() }, { calls });
  // Chromium reports a CSP-blocked load as a request that FAILED with "csp"; anything that finished reached the network
  const external = [];
  page.on("requestfinished", (r) => { if (/example\.com|evil/.test(r.url())) external.push(r.url()); });
  page.on("requestfailed", (r) => { if (/example\.com|evil/.test(r.url()) && r.failure()?.errorText !== "csp") external.push(`${r.url()} ${r.failure()?.errorText}`); });
  try {
    await page.waitForSelector('[data-testid="studio-frame"] iframe', { timeout: 15_000 });
    const sandbox = await page.getAttribute('[data-testid="studio-frame"] iframe', "sandbox");
    assert.equal(sandbox, "allow-scripts");
    const fl = page.frameLocator('[data-testid="studio-frame"] iframe');
    await fl.locator("[data-part]").first().waitFor({ timeout: 10_000 });
    // item 1 (3/4): a wrong check first, then the right one; the host's grade drives the build
    const item = GOLD.shade_fraction.params.items[0];
    await fl.locator('[data-action="check"]').click();
    for (let i = 0; i < item.n; i++) await fl.locator(`[data-part="${i}"]`).click();
    await fl.locator('[data-action="check"]').click();
    await page.waitForTimeout(1500);
    const answers = calls.filter((c) => c.p === "/api/studio/answer");
    assert.ok(answers.length >= 2, `answers reached the host: ${JSON.stringify(answers)}`);
    assert.deepEqual(answers.at(-1).b.value, { n: item.n, d: item.d });
    assert.equal(answers.at(-1).b.intentId, `${LESSON}:st:1`);
    const second = GOLD.shade_fraction.params.items[1];
    await fl.locator(`[data-item="${second.id}"]`).first().waitFor({ timeout: 5000 });
    // AT-11 from inside the revealed build
    const frame = page.frames().find((f) => f !== page.mainFrame() && f.url() === "about:srcdoc");
    assert.ok(frame, "the build runs in a srcdoc frame");
    const inside = await frame.evaluate(async () => {
      const out = {};
      try { await fetch("https://example.com/x"); out.fetch = "allowed"; } catch { out.fetch = "refused"; }
      try { const i = new Image(); i.src = "https://example.com/p.png"; document.body.appendChild(i); } catch { /* refused */ }
      try { const d = document.createElement("div"); d.style.background = "url(https://example.com/bg.png)"; document.body.appendChild(d); } catch { /* refused */ }
      try { top.location.href = "https://example.com/"; out.top = "allowed"; } catch { out.top = "refused"; }
      try { out.cookie = document.cookie; } catch { out.cookie = "refused"; }
      try { localStorage.setItem("a", "1"); out.storage = "allowed"; } catch { out.storage = "refused"; }
      parent.postMessage({ type: "answer", value: { n: 2, d: 5 }, correct: true }, "*");
      return out;
    });
    await page.waitForTimeout(800);
    assert.equal(inside.fetch, "refused");
    assert.equal(inside.top, "refused");
    assert.equal(inside.storage, "refused");
    assert.ok(inside.cookie === "refused" || inside.cookie === "", "no cookies in the opaque origin");
    assert.deepEqual(external, [], "nothing reached the network from inside the build");
    assert.equal(calls.filter((c) => c.p === "/api/studio/answer").length, answers.length, "a forged postMessage answer never reaches the host");
    assert.ok(page.url().startsWith(base), "the lesson page was not navigated");
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/w2h-frame-revealed.png` });
  } finally { await page.close(); }
});

test("bytes that do not match the build id are never mounted: the skeleton activity takes their place, quietly", { skip: SKIP, timeout: 120_000 }, async () => {
  const calls = [];
  const page = await lessonWith({ width: 360, height: 800 }, { slotId: "s1", intentId: `${LESSON}:st:1`, state: "revealed", artifact: frameArt() },
    { calls, build: { sha256: SHA, fragment: FIXTURE.replace("</style>", "body{background:red}</style>") } });
  try {
    await page.waitForSelector('[data-testid="studio-skeleton"]', { timeout: 15_000 });
    assert.equal(await page.$('[data-testid="studio-frame"] iframe'), null);
    assert.ok(calls.some((c) => c.p === "/api/studio/frame-error"));
    const m = await measure(page);
    assert.doesNotMatch(m.trayText, /error|could not|failed/i);
  } finally { await page.close(); }
});

test("'Show me again' and 'Not this one' reach the server from the corner control", { skip: SKIP, timeout: 120_000 }, async () => {
  const calls = [];
  const page = await lessonWith({ width: 360, height: 800 }, { slotId: "s1", intentId: `${LESSON}:st:1`, state: "fallback_shown", artifact: skeletonOf("bar_chart_read") }, { calls });
  try {
    await page.click('[data-testid="studio-more"]');
    await page.click('[data-testid="studio-again"]');
    await page.click('[data-testid="studio-more"]');
    await page.click('[data-testid="studio-notthis"]');
    await page.waitForTimeout(400);
    const fb = calls.filter((c) => c.p === "/api/studio/feedback").map((c) => c.b.action);
    assert.deepEqual(fb, ["again", "not_this"]);
    assert.equal(await page.$('[data-testid="studio-skeleton"]'), null, "the retired piece leaves the stage");
  } finally { await page.close(); }
});
