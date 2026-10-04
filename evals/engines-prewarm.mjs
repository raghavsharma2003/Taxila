// W2-B #4: does pre-warming the module frame make the explain beat's first mount fast? Measured, not assumed: the frame
// is sandboxed (opaque origin), and whether a warm frame's fetches serve a later frame from cache is a browser question.
//
// Serves the REAL build (dist/, `npx vite build` first) with server/serve.mjs, opens the app origin in Chromium (4x CPU
// throttle by default), and times the first mount of an explainer@1 board in a fresh browser context, three ways:
//   cold:  nothing warmed;
//   warm:  src/modules/prewarm.ts's warm frame loaded first (the lesson start), then the mount;
//   again: a second mount in the same context (the frame's own cache).
// "mount" = iframe inserted → the board is painted in the frame (ready, init, engine chunk, first render; the first stroke then starts on its own script time). n per arm.
// Run: node evals/engines-prewarm.mjs [--n 10] [--cpu 4] [--port 8791]
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const N = +arg("--n", 10), CPU = +arg("--cpu", 4), PORT = +arg("--port", 8791);
if (!existsSync(new URL("dist/modules.html", ROOT))) { console.error("build first: npx vite build"); process.exit(2); }

const { expand } = await import("../server/forge/explainer/templates.js");
const script = expand({ template: "fraction-parts@1", whole: "circle", parts: 4, shade: 3 }).script;
const { DEFAULT_WARM } = { DEFAULT_WARM: ["explainer@1", "scene@1", "fraction-bars@1", "fractions@1", "number-line@1", "place-value@1", "collections@1", "multiply-divide@1"] };

const server = spawn(process.execPath, ["server/serve.mjs"], { cwd: ROOT.pathname, env: { ...process.env, PORT: String(PORT) }, stdio: ["ignore", "pipe", "pipe"] });
const base = `http://127.0.0.1:${PORT}`;
for (let i = 0; i < 100; i++) { try { const r = await fetch(base + "/modules.html"); if (r.ok) break; } catch { /* not up yet */ } await new Promise((r) => setTimeout(r, 100)); }

const { chromium } = await import("playwright");
const browser = await chromium.launch();
const pct = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)]; };

async function run(arm) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 800 } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  if (CPU > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU });
  await page.goto(base + "/robots.txt").catch(() => {});
  await page.goto(base + "/", { waitUntil: "load" });
  if (arm === "warm") {
    await page.evaluate(({ engines }) => new Promise((resolve) => {
      const f = document.createElement("iframe");
      f.setAttribute("sandbox", "allow-scripts");
      f.style.cssText = "position:fixed;left:-10px;top:-10px;width:1px;height:1px;opacity:0";
      f.src = `/modules.html#${encodeURIComponent("warm:" + engines.join(","))}`;
      f.addEventListener("load", () => setTimeout(resolve, 1500), { once: true });
      document.body.appendChild(f);
    }), { engines: DEFAULT_WARM });
  }
  const mount = async (id) => {
    const t0 = await page.evaluate(({ id, script }) => {
      const t = performance.now();
      const f = document.createElement("iframe");
      f.setAttribute("sandbox", "allow-scripts");
      f.style.cssText = "position:fixed;left:0;top:0;width:328px;height:290px;border:0;z-index:99";
      f.src = `/modules.html#${id}`;
      window.addEventListener("message", (e) => {
        if (e.source !== f.contentWindow || e.data?.type !== "ready") return;
        const ch = new MessageChannel();
        f.contentWindow.postMessage({ type: "init", moduleId: id, engine: "explainer@1", params: { script, delayMs: 0 }, lang: "hinglish", ageBand: "10-15" }, "*", [ch.port2]);
      });
      document.body.appendChild(f);
      return t;
    }, { id, script });
    const frame = await (async () => { for (let i = 0; i < 400; i++) { const fr = page.frames().find((x) => x.url().endsWith(`#${id}`)); if (fr) return fr; await page.waitForTimeout(5); } })();
    await frame.waitForSelector("[data-testid=explainer] svg rect", { timeout: 15000, state: "attached" });
    return Math.round((await page.evaluate(() => performance.now())) - t0);
  };
  const first = await mount("m1");
  const again = arm === "cold" ? await mount("m2") : null;
  await ctx.close();
  return { first, again };
}

const res = { cold: [], warm: [], again: [] };
for (let i = 0; i < N; i++) {
  const c = await run("cold"); res.cold.push(c.first); res.again.push(c.again);
  const w = await run("warm"); res.warm.push(w.first);
}
await browser.close();
server.kill();
const sum = (xs) => ({ n: xs.length, p50: pct(xs, 50), p90: pct(xs, 90), max: Math.max(...xs) });
const out = { date: new Date().toISOString().slice(0, 10), cpu: CPU, host: "dev container, localhost (no network RTT: this isolates boot + parse + compile)",
  cold: sum(res.cold), warm: sum(res.warm), secondMount: sum(res.again), raw: res };
mkdirSync(new URL("evals/results/", ROOT), { recursive: true });
writeFileSync(new URL(`evals/results/engines-prewarm-${out.date}.json`, ROOT), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
process.exit(0);
