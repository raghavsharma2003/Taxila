// PRODUCT-DESIGN-V2 §13.2 / §14 B1-A6: the B1 battery on the SHIPPED route, not the dev fixtures. Standalone (needs
// Chromium; not part of `npm test`):
//
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tests/e2e-design-b1-route.mjs [--dist <built SPA>] [--shots <dir>]
//
// It builds the production SPA (vite build → a temp dir, NO dev routes) unless --dist is given, serves it with
// server/serve.mjs on a spare port (as §13.2 specifies), and mocks every /api/* call with Playwright's page.route:
// the guardian's /api/me, and a scripted Director for /api/lesson/start, /turn, /end and /api/tts (a short WAV per
// stored turn). So what runs is the real child route /c/:cid/lesson/new: ChildShell, prefs, theme, LessonScreen,
// useDesk, the LessonRuntime, the outbox, the UiBridge clip buffer and the TextLink, end to end.
// Checks, at every captured frame (360 × 640 DPR 2 touch, 1280 × 800; light and dark for Older):
//   V-LAYOUT-3  no .dk-card, .dk-strip or .dk-dock clips its content (scrollHeight ≤ clientHeight; the card's body
//               ends inside the card), with a negative control (a forced 60 px card must trip it)
//   V-SIG-2     ≤ 1 [data-lamp], only the dock in YOUR TURN
//   V-TGT       every visible control ≥ 48 dp (Older) / 64 dp (Young) in both dimensions (§11.5)
//   V-EN-1      English chrome outside [data-speech]
//   and the flows: the verdict and hint line land on the card; the number item opens the NumberPad; T4 (HTTP 500)
//   suspends the floor word ("Your answer is saved") and "Send again" delivers; offline T2 "Try again" says
//   "Still no internet…"; every attempt carries turnSeq; Young with no voice gets the Help menu at once.
//   V-PERF-1    long tasks > 50 ms in a 10 s YOUR TURN window with the live face (SwiftShader), reported.
import http from "http";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn, execFileSync } from "child_process";
import { chromium } from "playwright";
import { lessonScript } from "../src/child/lesson/dev/script.ts";

const ROOT = new URL("..", import.meta.url).pathname;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const SHOTS = arg("--shots", `${ROOT}docs/design/build/b1`);
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
};

let dist = arg("--dist");
if (!dist) {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), "taxila-b1-dist-"));
  execFileSync("npx", ["vite", "build", "--outDir", dist, "--emptyOutDir"], { cwd: ROOT, stdio: "ignore", env: { ...process.env, VITE_DEV_ROUTES: "" } });
}
const freePort = () => new Promise((r) => { const s = http.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
const PORT = await freePort();
const BASE = `http://127.0.0.1:${PORT}`;
const srv = spawn(process.execPath, [path.join(ROOT, "server/serve.mjs")], { env: { ...process.env, PORT: String(PORT), TAXILA_DIST: dist }, stdio: ["ignore", "pipe", "pipe"] });
let srvLog = "";
srv.stdout.on("data", (d) => (srvLog += d));
srv.stderr.on("data", (d) => (srvLog += d));
for (let i = 0; i < 100; i++) {
  try { if ((await fetch(`${BASE}/`)).ok) break; } catch { /* starting */ }
  await new Promise((r) => setTimeout(r, 150));
}
console.log(`app: ${BASE} (built ${dist})`);

// 0.9 s of silence, 16 kHz mono PCM16: her "audio" for every stored turn
function wav(ms = 900) {
  const n = Math.round(16 * ms);
  const b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVE", 8); b.write("fmt ", 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(16000, 24); b.writeUInt32LE(32000, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 2, 40);
  return b;
}
const WAV = wav();

/** The scripted Director behind page.route. Options: fail the next n turns with a status; go offline. */
function director(page, { young, kid }) {
  const s = lessonScript(young);
  const st = { i: 0, fail: 0, failStatus: 500, offline: false, turns: [], tts: [] };
  page.route("**/api/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const p = url.pathname;
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (st.offline) return route.abort("internetdisconnected");
    if (p === "/api/me") return json(200, { guardian: { id: "g1", email: "g@test.invalid", name: "Grown-up" }, children: [kid] });
    if (p === "/api/lesson/start") {
      return json(200, {
        lessonId: "L-route", topic: { id: "t", title: young ? "Halves" : "Fractions: halves and quarters", chapter: "Fractions" },
        teacher: { id: kid.teacher_id, name: young ? "Asha" : "Arjun", voice: "v", addressedAs: "", role: "AI teacher" }, moduleCommands: [], ui: s.opening.ui,
        teacherOpening: s.opening.reply, teacherOpeningSeq: 1,
      });
    }
    if (p === "/api/lesson/turn") {
      const body = JSON.parse(req.postData() || "{}");
      st.turns.push(body);
      if (st.fail > 0) { st.fail--; return json(st.failStatus, { error: "boom" }); }
      const step = s.turns[Math.min(st.i, s.turns.length - 1)];
      st.i++;
      return json(200, { move: { kind: step.end ? "wrap" : "probe", shape: "x" }, moduleCommands: [], ui: step.ui, teacherReply: step.reply, teacherReplySeq: 1 + st.i, ...(step.end ? { end: true } : {}) });
    }
    if (p === "/api/lesson/end") return json(200, { summary: null, parentNote: null });
    if (p === "/api/tts") {
      st.tts.push(JSON.parse(req.postData() || "{}").seq);
      return route.fulfill({ status: 200, contentType: "audio/wav", body: WAV });
    }
    return json(404, { error: "not mocked" });
  });
  return st;
}

const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
const PHONE = { viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true };
const LAPTOP = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 };
const errors = [];

// ── per-frame checks ──
const clipped = (page) => page.evaluate(() => {
  const bad = [];
  for (const sel of [".dk-card", ".dk-strip", ".dk-dock"]) for (const el of document.querySelectorAll(sel)) {
    if (el.scrollHeight > el.clientHeight + 1) bad.push(`${sel} ${el.scrollHeight}>${el.clientHeight}`);
    const body = el.querySelector("[data-measure]");
    if (body && body.getBoundingClientRect().bottom > el.getBoundingClientRect().bottom + 1) bad.push(`${sel} body ends ${Math.round(body.getBoundingClientRect().bottom - el.getBoundingClientRect().bottom)} px below`);
  }
  return bad;
});
const smallTargets = (page) => page.evaluate(() => {
  const root = document.querySelector('[data-testid="lesson"]');
  if (!root) return [];
  const min = root.getAttribute("data-family") === "young" ? 64 : 48;
  const bad = [];
  for (const el of root.querySelectorAll("button, [role=button], a[href], input")) {
    if (el.closest("[inert], .dk-sr") || el.offsetParent === null) continue;
    if (el.matches(".dk-wait")) continue; // a 32 dp pill with a 48 dp ::after hit area (§6.3.4 header row)
    // Young Pause: a 56 dp pill in the 56 dp top bar, with a ::after hit area to 64 dp (checked, not skipped)
    if (el.matches(".dk-pause") && min === 64) {
      const after = getComputedStyle(el, "::after");
      const r0 = el.getBoundingClientRect();
      const ext = after.content !== "none" ? -2 * parseFloat(after.top || "0") : 0;
      if (Math.round(r0.height + ext) >= 64 && r0.width >= 64) continue;
    }
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (Math.round(r.height) < min || Math.round(r.width) < min) bad.push(`${(el.getAttribute("data-testid") || el.textContent || el.className).toString().trim().slice(0, 24)} ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  return bad;
});
const lamps = (page) => page.evaluate(() => [...document.querySelectorAll("[data-lamp]")].map((e) => `${e.getAttribute("data-testid")}:${e.getAttribute("data-floor")}`));
const HINGLISH = /\b(ghar|ruko|bolo|bas|bhejo|phir|shuru|chalo|paath|abhyaas|pakka|baari|agla|kyun|aata|karein|karo|humne|banaya|mera|meri|bagiya|aasmaan|tumhare|aage|chalein|nahi|haan|yahan|likho|abhi|suno|kaise|pata|chhoo)\b/i;
const chromeBad = (page) => page.evaluate((re) => {
  const rx = new RegExp(re, "i");
  const out = [];
  const walk = (n) => {
    if (n.nodeType === 1 && n.matches("[data-speech], script, style, .dk-sr")) return;
    if (n.nodeType === 3 && n.textContent.trim()) out.push(n.textContent.trim());
    for (const c of n.childNodes) walk(c);
  };
  walk(document.querySelector('[data-testid="lesson"]') ?? document.body);
  return out.filter((s) => /[ऀ-ॿ]/.test(s) || rx.test(s));
}, HINGLISH.source);

const frameIssues = { clip: [], tgt: [], lamp: [], en: [] };
async function frame(page, tag) {
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${SHOTS}/route__${tag}.png` });
  frameIssues.clip.push(...(await clipped(page)).map((x) => `${tag}: ${x}`));
  frameIssues.tgt.push(...(await smallTargets(page)).map((x) => `${tag}: ${x}`));
  const l = await lamps(page);
  const floor = await page.locator('[data-testid="lesson"]').getAttribute("data-floor").catch(() => null);
  if (l.length > 1 || (l.length === 1 && !(l[0] === "dock:your_turn" && floor === "your_turn"))) frameIssues.lamp.push(`${tag}: ${l.join(",")}`);
  frameIssues.en.push(...(await chromeBad(page)).map((x) => `${tag}: ${x}`));
}
const waitFloor = (page, f, timeout = 15_000) => page.waitForFunction((f) => document.querySelector('[data-testid="lesson"]')?.getAttribute("data-floor") === f, f, { timeout });
const word = (page) => page.locator('[data-testid="state-word"]').textContent().catch(() => "");

const OLDER = { id: "kid-o", first_name: "Kabir", class_level: 8, language_pref: "hinglish", teacher_id: "arjun" };
const YOUNG = { id: "kid-y", first_name: "Riya", class_level: 3, language_pref: "hinglish", teacher_id: "asha" };

async function open(dev, kid, scheme) {
  const ctx = await browser.newContext({ ...dev, colorScheme: scheme });
  await ctx.addInitScript(([cid, theme]) => {
    try { localStorage.setItem(`taxila.child.${cid}.prefs`, JSON.stringify({ theme })); } catch { /* storage blocked */ }
  }, [kid.id, scheme]);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  const st = director(page, { young: kid === YOUNG, kid });
  await page.goto(`${BASE}/c/${kid.id}/lesson/new?mode=text`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="lesson"]', { timeout: 20_000 });
  return { ctx, page, st };
}

try {
  // ═════════ Older, the real route, every combination ═════════
  for (const [dev, w] of [[PHONE, "360"], [LAPTOP, "1280"]]) for (const scheme of ["light", "dark"]) {
    const tag = (s) => `${s}__b3__${w}__${scheme}`;
    const { ctx, page, st } = await open(dev, OLDER, scheme);
    await waitFloor(page, "your_turn", 20_000);
    await frame(page, tag("your_turn"));
    const ask = (await page.locator('[data-testid="ask"]').textContent())?.trim();
    check(`route ${w} ${scheme}: the opening's ui.ask is pinned on the card`, ask === "Which is bigger: 1/2 or 1/4?", ask);
    // typed answer → correct verdict lands; next item (number) pins its ask
    await page.locator('[data-testid="child-input"]').fill("one half");
    await page.locator('[data-testid="send"]').click();
    await waitFloor(page, "heard", 2000).catch(() => {});
    await frame(page, tag("heard"));
    await waitFloor(page, "speaking", 10_000);
    await frame(page, tag("correct"));
    check(`route ${w} ${scheme}: the verdict mark lands on the child's answer when she speaks`, (await page.locator('[data-testid="answer-chip"]').getAttribute("data-verdict")) === "correct");
    await waitFloor(page, "your_turn", 15_000);
    // number item, no voice (text mode) → the NumberPad is in the tray
    const pad = await page.locator('[data-testid="number-pad"]').isVisible().catch(() => false);
    check(`route ${w} ${scheme}: a number item with no voice puts the NumberPad in the tray`, pad);
    await frame(page, tag("pad"));
    await page.locator('[data-testid="number-pad"] .dk-key', { hasText: /^3$/ }).click();
    await page.locator('[data-testid="number-pad"] .dk-key--send').click();
    await waitFloor(page, "your_turn", 15_000);
    await frame(page, tag("not_yet_hint"));
    const nv = await page.locator('[data-testid="answer-chip"]').getAttribute("data-verdict").catch(() => null);
    const hintVisible = await page.locator(".dk-line--hint").isVisible().catch(() => false);
    const lookAgain = await page.locator(".dk-verdict-line").isVisible().catch(() => false);
    check(`route ${w} ${scheme}: not yet — magnifier chip, "Let's look again" and the hint line all VISIBLE (not clipped)`, nv === "not_yet" && hintVisible && lookAgain);
    // T4: an HTTP 500 → the strip, the floor word suspended, "Send again" delivers
    st.fail = 1; st.failStatus = 500;
    await page.locator('[data-testid="number-pad"] .dk-key', { hasText: /^2$/ }).click();
    await page.locator('[data-testid="number-pad"] .dk-key--send').click();
    const t4 = await page.waitForSelector('[data-strip="T4"]', { timeout: 4000 }).then(() => true, () => false);
    await frame(page, tag("T4"));
    const w4 = (await word(page))?.trim();
    check(`route ${w} ${scheme}: T4 shows, and the dock says "Your answer is saved" (not "Got it"/"thinking" under the strip)`, t4 && w4 === "Your answer is saved", w4);
    check(`route ${w} ${scheme}: T4 — the chip says "Not sent yet" and is fully visible`, await page.locator('[data-testid="not-sent"]').isVisible().catch(() => false));
    await page.locator('[data-testid="strip-send_again"]').click();
    const delivered = await waitFloor(page, "speaking", 8000).then(() => true, () => false);
    const resent = st.turns.at(-1);
    check(`route ${w} ${scheme}: "Send again" delivers the held answer, marked retried, same turnSeq`, delivered && resent?.retried === true && resent.turnSeq === st.turns.at(-2)?.turnSeq, JSON.stringify({ seq: resent?.turnSeq, retried: resent?.retried }));
    check(`route ${w} ${scheme}: every turn the server received carried a turnSeq`, st.turns.every((t) => Number.isInteger(t.turnSeq)), st.turns.map((t) => t.turnSeq).join(","));
    await waitFloor(page, "your_turn", 15_000);
    await frame(page, tag("tiles"));
    // T2 offline → Try again → "Still no internet…" (the strip stays)
    if (w === "360" && scheme === "light") {
      await ctx.setOffline(true);
      st.offline = true;
      const tile = page.locator('[data-testid="choices"] button').first();
      await tile.click();
      await page.waitForSelector('[data-strip="T2"]', { timeout: 4000 }).catch(() => {});
      await frame(page, tag("T2"));
      await page.locator('[data-testid="strip-try_again"]').click();
      await page.waitForTimeout(200);
      const t2 = (await page.locator('[data-testid="trouble-strip"]').textContent().catch(() => "")) ?? "";
      check("route 360: offline, 'Try again' keeps the strip and says 'Still no internet. Your answers are saved.'", /Still no internet/.test(t2), t2.slice(0, 60));
      await frame(page, tag("T2_still"));
      st.offline = false;
      await ctx.setOffline(false);
      const rc = await page.waitForSelector('[data-strip="RC"], [data-testid="sent"]', { timeout: 4000 }).then(() => true, () => false);
      check("route 360: back online → 'Back online.' / 'Sent' within 3 s, the held tap delivered", rc && st.turns.some((t) => t.chipId));
    }
    // V-PERF-1: long tasks in a 10 s YOUR TURN window (live face, SwiftShader)
    if (w === "360" && scheme === "light") {
      await waitFloor(page, "your_turn", 15_000).catch(() => {});
      const n = await page.evaluate(() => new Promise((res) => {
        const seen = [];
        const po = new PerformanceObserver((l) => { for (const e of l.getEntries()) seen.push(Math.round(e.duration)); });
        po.observe({ type: "longtask", buffered: false });
        setTimeout(() => { po.disconnect(); res(seen); }, 10_000);
      }));
      check("V-PERF-1 route 360 (SwiftShader, live face): long tasks > 50 ms in 10 s of YOUR TURN ≤ 2", n.length <= 2, `${n.length} long task(s): ${n.join(", ")} ms`);
    }
    await ctx.close();
  }

  // ═════════ Young, the real route: no voice → Help at once; tiles; 64 dp targets ═════════
  for (const [dev, w] of [[PHONE, "360"], [LAPTOP, "1280"]]) {
    const tag = (s) => `${s}__b2__${w}__light`;
    const { ctx, page } = await open(dev, YOUNG, "light");
    await waitFloor(page, "your_turn", 20_000);
    await frame(page, tag("your_turn_novoice"));
    const help = await page.locator('[data-testid="help-menu"]').isVisible().catch(() => false);
    const mode = (await page.locator('[data-testid="mode-line"]').textContent().catch(() => "")) ?? "";
    check(`route Young ${w}: with no voice, the Help menu is in the tray at once (not after 15 s), and the mode line points at it`, help && /Tap a picture above/.test(mode), mode);
    await page.locator('[data-testid="help-menu"] button').nth(1).click(); // Show me choices → a Director request
    await waitFloor(page, "your_turn", 15_000);
    await frame(page, tag("tiles"));
    const tiles = await page.locator('[data-testid="choices"] button').count();
    check(`route Young ${w}: the next turn's tiles are in the tray`, tiles >= 2, `${tiles}`);
    await ctx.close();
  }

  // ═════════ negative control: a forced 60 px card is caught as clipped ═════════
  {
    const { ctx, page } = await open(PHONE, OLDER, "light");
    await waitFloor(page, "your_turn", 20_000);
    await page.addStyleTag({ content: ".dk-card { height: 60px !important; overflow: hidden !important; }" });
    check("V-LAYOUT-3 negative control: a card forced to 60 px is reported as clipped", (await clipped(page)).length > 0);
    await ctx.close();
  }

  check("V-LAYOUT-3 route: no card, strip or dock clips its content in any captured frame", !frameIssues.clip.length, frameIssues.clip.slice(0, 5).join("; "));
  check("V-TGT route: every visible control ≥ 48 dp (Older) / 64 dp (Young)", !frameIssues.tgt.length, [...new Set(frameIssues.tgt)].slice(0, 8).join("; "));
  check("V-SIG-2 route: ≤ 1 lamp, the dock only, in YOUR TURN only", !frameIssues.lamp.length, frameIssues.lamp.slice(0, 4).join("; "));
  check("V-EN-1 route: English chrome on the lesson route", !frameIssues.en.length, frameIssues.en.slice(0, 4).join("; "));
} catch (e) {
  check("route battery ran to completion", false, e.stack?.split("\n").slice(0, 3).join(" | "));
} finally {
  await browser.close();
  srv.kill();
}
if (errors.length) console.log(`page errors:\n  ${[...new Set(errors)].slice(0, 10).join("\n  ")}`);
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed; shots in ${SHOTS}`);
process.exit(failed.length ? 1 : 0);
