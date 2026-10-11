// Release 11 stream 5 (set-up and sign-in in Volt): a full-page shot of EVERY set-up surface on a production build served
// against the stream's Neon TEST branch, at 360x800, 412x915 and 1366x768: the five steps (each on arrival), sign-in,
// a wrong-password auth error, forgot password, the hand-off into child mode (the first child screen). A fresh parent
// account per viewport. Used for the before/after sheets (tests/prod/r11-asha-sheets.py).
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tests/prod/r11-asha-setup-shots.mjs --dist <dir> --label before|after --out <dir>
import http from "http";
import fs from "fs";
import { spawn } from "child_process";
import { chromium } from "playwright";

const ROOT = new URL("../..", import.meta.url).pathname;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const DIST = arg("--dist"), LABEL = arg("--label", "run"), OUT = arg("--out");
fs.mkdirSync(OUT, { recursive: true });
const port = await new Promise((r) => { const s = http.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
const srv = spawn(process.execPath, ["--env-file=.env.local", "--env-file=tests/prod/prod-routing.env", "--import", "./tests/prod/r4-timeline/preload.mjs", "server/serve.mjs"],
  { cwd: ROOT, env: { ...process.env, PORT: String(port), TAXILA_DIST: DIST, NODE_USE_ENV_PROXY: "1", NODE_EXTRA_CA_CERTS: "/root/.ccr/ca-bundle.crt", ACCESS_LOG: "off" }, stdio: "ignore" });
const BASE = `http://127.0.0.1:${port}`;
for (let i = 0; i < 150; i++) { try { if ((await fetch(`${BASE}/`)).ok) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 200)); }

const VIEWS = [{ w: 360, h: 800 }, { w: 412, h: 915 }, { w: 1366, h: 768 }];
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
const errors = [], gates = [];
try {
  for (const v of VIEWS) {
    const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1, hasTouch: v.w < 720, permissions: ["microphone"], reducedMotion: "reduce" });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errors.push(`${v.w} ${page.url()} ${String(e).slice(0, 160)}`));
    const btn = (name) => page.getByRole("button", { name, exact: true }).or(page.getByRole("radio", { name, exact: true }));
    const shot = async (name) => {
      await page.waitForTimeout(700);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 0) errors.push(`${v.w} ${name}: horizontal overflow ${overflow}px`);
      await page.screenshot({ path: `${OUT}/${LABEL}-${v.w}-${name}.png`, fullPage: true });
    };
    const email = `r11-${LABEL}-${v.w}-${Date.now()}@taxila.test`, pw = `pw-${Date.now()}-Ab9`;
    // sign-in, a wrong-password error, forgot password (signed out)
    await page.goto(`${BASE}/start/phone?login=1`, { waitUntil: "load" });
    await shot("signin");
    await page.getByLabel("Email").first().fill("nobody-r11@taxila.test");
    await page.getByLabel("Password", { exact: true }).first().fill("wrong-password-1");
    await page.getByRole("button", { name: /^Sign in$/ }).first().click();
    await page.waitForTimeout(1500);
    await shot("signin-error");
    await page.goto(`${BASE}/start/forgot`, { waitUntil: "load" });
    await shot("forgot");
    // the first run
    await page.goto(`${BASE}/start/class`, { waitUntil: "load" });
    for (let guard = 0, n = 0; guard < 20; guard++) {
      await page.waitForTimeout(900);
      const path = new URL(page.url()).pathname;
      if (path.startsWith("/c/")) break;
      const step = path.replace("/start/", "");
      await shot(`${String(++n).padStart(2, "0")}-${step}`);
      if (step === "class") {
        await btn("Class 4").first().click(); await btn("CBSE").first().click(); await btn("Hindi and English mix").first().click();
        await shot(`${String(n).padStart(2, "0")}-${step}-filled`);
        await btn("Continue").first().click();
      } else if (step === "promises") {
        const b = await page.getByRole("button", { name: /Hold to continue/ }).first().boundingBox();
        gates.push({ view: `${v.w}x${v.h}`, holdTop: Math.round(b.y), holdBottom: Math.round(b.y + b.height), aboveFold: b.y + b.height <= v.h });
        if (b.y + b.height > v.h) { errors.push(`${v.w}x${v.h}: the hold gate is below the fold (${Math.round(b.y)}-${Math.round(b.y + b.height)})`); await page.mouse.wheel(0, b.y + b.height - v.h + 40); await page.waitForTimeout(400); Object.assign(b, await page.getByRole("button", { name: /Hold to continue/ }).first().boundingBox()); }
        await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(2300); await page.mouse.up();
      } else if (step === "phone") {
        await page.getByLabel("Your name").fill("Setup Parent"); await page.getByLabel("Email").fill(email); await page.getByLabel("Password", { exact: true }).fill(pw);
        await btn("Create account").first().click();
      } else if (step === "consent") {
        await btn("Yes, remember").first().click(); await btn("Yes").first().click(); await btn("Only in the app").first().click();
        await shot(`${String(n).padStart(2, "0")}-${step}-filled`);
        await btn("Agree and continue").first().click();
      } else if (step === "child") {
        await page.getByRole("button", { name: "0", exact: true }).waitFor({ timeout: 20000 });
        await page.getByLabel(/first name/i).fill("Riya");
        for (const d of "2580") await btn(d).first().click();
        await btn("Next").first().click();
        for (const d of "2580") await btn(d).first().click();
        await btn("OK").first().click();
        await shot(`${String(n).padStart(2, "0")}-${step}-filled`);
        await page.getByRole("button", { name: "Give the phone to Riya" }).click();
        await page.waitForURL(/\/c\//, { timeout: 30000 });
      } else throw new Error(`unknown step ${path}`);
      await page.waitForURL((u) => new URL(u).pathname !== path, { timeout: 30000 });
    }
    await shot("99-handoff");
    await ctx.close();
  }
} finally {
  await browser.close();
  srv.kill();
}
fs.writeFileSync(`${OUT}/${LABEL}-errors.json`, JSON.stringify({ errors, gates }, null, 1));
console.log(JSON.stringify({ label: LABEL, shots: fs.readdirSync(OUT).filter((f) => f.startsWith(`${LABEL}-`) && f.endsWith(".png")).length, errors, gates }));
