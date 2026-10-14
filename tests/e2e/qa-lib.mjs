// Round 5 QA / break-it harness: shared helpers. A production build served by server/serve.mjs against the Neon TEST
// branch (see tests/e2e/README.md). Every page records console errors, page errors, failed requests, API responses
// >= 400 and the client flight-recorder events it posts to /api/trace/batch, so a defect carries its evidence.
import fs from "fs";
import { chromium } from "playwright";

export const BASE = process.env.QA_BASE || "http://127.0.0.1:8090";
export const OUT = process.env.QA_OUT || "/tmp/qa-out";
// raw shots go to the run's output dir; the curated few live in docs/design/round5/qa/shots/ (small PNGs only)
export const SHOTS = process.env.QA_SHOTS || `${OUT}/shots/`;
fs.mkdirSync(SHOTS, { recursive: true });

export const PHONE = {
  name: "phone", viewport: { width: 393, height: 876 }, deviceScaleFactor: 2.75, hasTouch: true, isMobile: true,
  userAgent: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36",
};
export const LAPTOP = { name: "laptop", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };

export async function launch({ wav, extra = [], denyMic = !!process.env.QA_DENY } = {}) {
  // QA_DENY=1: no fake permission UI, and the context grants nothing → getUserMedia is refused (NotAllowedError)
  const args = ["--autoplay-policy=no-user-gesture-required", ...(denyMic ? [] : ["--use-fake-ui-for-media-stream"]), "--use-fake-device-for-media-stream", ...extra];
  if (wav) args.push(`--use-file-for-fake-audio-capture=${wav}`);
  return chromium.launch({ args, executablePath: process.env.QA_CHROMIUM || "/opt/pw-browsers/chromium" });
}

/** A context + page with the evidence recorders attached. `log` collects everything; `trace` the recorder events. */
export async function open(browser, device, { permissions = process.env.QA_DENY ? [] : ["microphone"], timezoneId = "Asia/Kolkata", locale = "en-IN", init } = {}) {
  const { name, ...opts } = device;
  const ctx = await browser.newContext({ ...opts, permissions, timezoneId, locale });
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  if (process.env.QA_SLOW) { // Chrome DevTools "Slow 3G": 400 ms RTT, 400 kbit/s down and up (QA_SLOW=1), + 4x CPU
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 400, downloadThroughput: 400 * 1024 / 8, uploadThroughput: 400 * 1024 / 8 });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  }
  const log = { console: [], pageerror: [], failed: [], http: [], trace: [] };
  const hook = (p) => {
    p.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") log.console.push(`${m.type()}: ${m.text().slice(0, 300)}`); });
    p.on("pageerror", (e) => log.pageerror.push(String(e).slice(0, 300)));
    p.on("requestfailed", (r) => { if (!/\/api\/trace\//.test(r.url())) log.failed.push(`${r.method()} ${r.url().replace(BASE, "")} ${r.failure()?.errorText}`); });
    p.on("response", (r) => { if (r.status() >= 400 && r.url().startsWith(BASE)) log.http.push(`${r.request().method()} ${r.url().replace(BASE, "")} ${r.status()}`); });
    p.on("request", (r) => {
      if (r.url().includes("/api/voice/transcribe")) { // keep the exact clip the app uploaded (decode with ffmpeg)
        try { const b = JSON.parse(r.postData() || "{}"); fs.mkdirSync(`${OUT}/clips`, { recursive: true }); const f = `${OUT}/clips/${Date.now()}.webm`; fs.writeFileSync(f, Buffer.from(b.audio, "base64")); log.clips = [...(log.clips || []), { f, at: Date.now() }]; } catch { /* not JSON */ }
      }
      if (r.url().includes("/api/trace/batch")) {
        try { const b = JSON.parse(r.postData() || "{}"); for (const e of b.events || b.e || []) log.trace.push(e); } catch { /* not JSON */ }
      }
    });
  };
  hook(page);
  ctx.on("page", hook);
  return { ctx, page, log, device: name };
}

let shotN = 0;
export async function shot(page, label) {
  const f = `${SHOTS}${label}.png`;
  await page.screenshot({ path: f, scale: "css" }).catch((e) => console.error("shot failed", label, String(e).slice(0, 100)));
  shotN++;
  return f;
}
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const btn = (page, name) => page.getByRole("button", { name, exact: true }).or(page.getByRole("radio", { name, exact: true }));

/** The flight-recorder events of one kind (or a regexp over kinds), compact. */
export const traceOf = (log, re) => log.trace.filter((e) => re.test(String(e.k ?? e.kind ?? e.type ?? ""))).map((e) => JSON.stringify(e).slice(0, 240));

export function dump(log, label) {
  fs.writeFileSync(`${OUT}/${label}.json`, JSON.stringify(log, null, 1));
  const bad = { console: log.console.filter((s) => s.startsWith("error")), pageerror: log.pageerror, failed: log.failed, http: log.http };
  return bad;
}

/** Sign a fresh parent up and create one child through the real /start set-up; returns { email, password, cid }. */
export async function setup(page, { child = "Riya", cls = "Class 4", pin = "2580", label = "qa", board = "CBSE", lang = "Hindi and English mix" } = {}) {
  const email = `qa-r5-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@taxila.test`;
  const password = `pw-${Date.now()}-Ab9`;
  const b = (n) => btn(page, n);
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await page.getByRole("link", { name: "Start free set-up" }).or(page.getByRole("button", { name: "Start free set-up" })).first().click();
  const seen = [];
  let last = "";
  for (let guard = 0; guard < 40; guard++) {
    // the next step only once the screen changed (a slow POST must not be answered twice)
    for (let i = 0; i < 60 && new URL(page.url()).pathname === last; i++) await page.waitForTimeout(250);
    await page.waitForTimeout(500);
    const path = new URL(page.url()).pathname;
    if (path.startsWith("/c/")) break;
    if (path === last) throw new Error(`set-up stuck on ${path}`);
    last = path;
    seen.push(path);
    if (path === "/start/class") {
      await b(cls).first().click(); await b(board).first().click();
      if (await b(lang).count()) await b(lang).first().click();
      await b("Continue").first().click();
    } else if (path === "/start/meet") {
      await b(lang).first().click(); await b("Continue").first().click();
    } else if (path === "/start/promises") {
      const hold = page.getByRole("button", { name: /Hold to continue/ }).first();
      const bb = await hold.boundingBox();
      await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.mouse.down(); await page.waitForTimeout(2300); await page.mouse.up();
    } else if (path === "/start/phone") {
      await page.getByLabel("Your name").fill("QA Parent");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password", { exact: true }).fill(password);
      await b("Create account").first().click();
    } else if (path === "/start/consent") {
      for (const n of ["Yes, remember", "Yes", "Only in the app"]) await b(n).first().click();
      await b("Agree and continue").first().click();
    } else if (path === "/start/child") {
      await page.getByLabel(/first name/i).first().fill(child);
      if (await b("Casual").count()) await b("Casual").first().click();
      if (await page.getByRole("button", { name: `Give the phone to ${child}` }).count() === 0 && await b("Continue").count()) { await b("Continue").first().click(); continue; }
      await page.getByRole("button", { name: "0", exact: true }).waitFor({ timeout: 20000 }).catch(() => {});
      if (await page.getByRole("button", { name: "0", exact: true }).count()) {
        for (const d of pin) await b(d).first().click();
        await b("Next").first().click();
        for (const d of pin) await b(d).first().click();
        await b("OK").first().click();
      }
      await page.getByRole("button", { name: `Give the phone to ${child}` }).click();
      await page.waitForURL(/\/c\//, { timeout: 30000 });
    } else if (path === "/start/controls") {
      for (const d of pin) await b(d).first().click();
      await b("Next").first().click();
      for (const d of pin) await b(d).first().click();
      await b("OK").first().click();
      await b("Looks good").first().click();
    } else if (path === "/start/check") {
      await page.locator("[data-testid=check-sound], #check-sound").first().click(); await page.locator("[data-testid=check-next], #check-next").first().click();
    } else if (path === "/start/handover") {
      await page.locator("[data-testid=handover-now]").click();
    } else {
      throw new Error(`unknown set-up screen ${path}`);
    }
  }
  const cid = (page.url().match(/\/c\/([^/]+)/) || [])[1];
  return { email, password, cid, seen };
}
