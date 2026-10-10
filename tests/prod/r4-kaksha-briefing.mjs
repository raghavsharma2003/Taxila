// K2 rendered harness (BUILD-SPEC §3.4, §6, §11; K-P3): the Kaksha Briefing in front of the REAL PlayStudioRenderer and
// the Antariksh engine (G1), on src/ui-v3/kaksha/dev/briefing.html. Runs on a tree with G1 (claude/r4-games-core) and
// patches K-P3 / K-P4 applied (the dev page needs G1's engines). Not part of `npm test`.
//   node tests/prod/r4-kaksha-briefing.mjs  → docs/design/round4/build/kaksha/shots-k2/*.webp + lint-k2.json; exit 1 on a finding
// Checks per page: the U1 in-page lint (text ≥ 14 px, targets ≥ 44 px, contrast, overflow) on the card, plus
//   HOLD-1   a 300 ms press does not launch; a 700 ms hold does (650 ms fill)
//   KEY-1    Enter launches at once
//   TRUTH-1  the look line is absent until the model's dress has answered, then names the MODEL's theme (red planet)
//   WARP-1   the warp covers the box after launch and is gone ≈ 1 s later, leaving the engine
//   REPLAY-1 the same presses with and without the Hangar colours post byte-identical acts (colour never reaches the law)
//   FRAME-1  launch → the engine's first painted frame, against the engine alone (no Briefing: level → first frame), interleaved,
//            n = 12 each, CPU ×4, SwiftShader (a G35-class PROXY, not a phone), on a PRODUCTION build of the page. Fails if
//            the Briefing adds > 100 ms at p50; the spec's absolute 1,200 ms is reported (the engine's own mount sets it).
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { spawn, execFileSync as run } from "node:child_process";
import { inPage } from "./r4-kaksha-inpage.mjs";

const ROOT = new URL("../..", import.meta.url).pathname;
const OUT = path.join(ROOT, "docs/design/round4/build/kaksha/shots-k2");
const PORT = 5195;
const BASE = `http://localhost:${PORT}/src/ui-v3/kaksha/dev/briefing.html`;
const BOXES = { phone: [360, 800, 328, 460], laptop: [1366, 768, 736, 460] };
fs.mkdirSync(OUT, { recursive: true });
run("npx", ["vite", "build", "--config", "tests/prod/r4-kaksha-briefing.vite.config.ts"], { cwd: ROOT, stdio: "ignore" });
const srv = spawn("npx", ["vite", "preview", "--config", "tests/prod/r4-kaksha-briefing.vite.config.ts", "--port", String(PORT), "--strictPort"], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], detached: true });
const stopVite = () => { try { process.kill(-srv.pid, "SIGTERM"); } catch { /* gone */ } };
await new Promise((res, rej) => { const t = setTimeout(() => rej(new Error("preview did not start")), 60000); srv.stdout.on("data", (d) => { if (String(d).includes(String(PORT))) { clearTimeout(t); res(); } }); });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const tot = { small: 0, deva: 0, targets: 0, contrast: 0, overflow: 0, pages: 0, checks: 0, errors: 0 };
const report = [], checks = [], frames = [];
const shot = async (p, name) => {
  const png = path.join(OUT, `${name}.png`);
  await p.screenshot({ path: png });
  execFileSync("python3", ["-c", `from PIL import Image;Image.open('${png}').save('${png.replace(".png", ".webp")}','WEBP',quality=78,method=6)`]);
  fs.rmSync(png);
};
const fail = (c) => { checks.push(c); tot.checks++; console.log("CHECK", c); };
try {
  for (const cls of [4, 6, 7]) for (const [view, [vw, vh, bw, bh]] of Object.entries(BOXES)) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: vw < 500 ? 2 : 1 });
    const p = await ctx.newPage();
    const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
    const url = `${BASE}?class=${cls}&w=${bw}&h=${bh}&modelMs=600&force3d=1&cos=1`;
    await p.goto(url);
    await p.waitForSelector('[data-testid="briefing"]');
    // TRUTH-1: before the model dress answers there is no look line; after it, the model's theme
    const early = await p.$$eval('[data-line="look"]', (els) => els.length);
    if (early) fail(`c${cls} ${view} TRUTH-1 look line before the model dress`);
    await p.waitForTimeout(900);
    const look = await p.$eval('[data-line="look"]', (e) => e.textContent).catch(() => null);
    if (!look || !/red planet/.test(look)) fail(`c${cls} ${view} TRUTH-1 look=${look}`);
    const r = await p.evaluate(inPage);
    tot.pages++; for (const k of ["small", "deva", "targets", "contrast"]) tot[k] += r[k].length; tot.overflow += r.overflow > 0 ? 1 : 0;
    report.push({ cls, view, ...r });
    if (r.small.length || r.targets.length || r.contrast.length) console.log(cls, view, JSON.stringify({ s: r.small, t: r.targets, k: r.contrast }));
    await shot(p, `c${cls}-briefing__${view}`);
    // HOLD-1: a short press does not launch
    const btn = await p.$('[data-testid="briefing-launch"]'); const b = await btn.boundingBox();
    await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await p.mouse.down(); await p.waitForTimeout(300); await p.mouse.up(); await p.waitForTimeout(400);
    if (await p.$('[data-testid="briefing"][data-launched="1"]')) fail(`c${cls} ${view} HOLD-1 a 300 ms press launched`);
    // a 700 ms hold launches; the warp covers the box
    await p.mouse.down(); await p.waitForTimeout(400);
    await shot(p, `c${cls}-briefing-hold__${view}`);
    await p.waitForTimeout(300); await p.mouse.up();
    await p.waitForTimeout(250);
    if (!(await p.evaluate(() => window.__k2.launchAt !== null))) fail(`c${cls} ${view} HOLD-1 a 700 ms hold did not launch`);
    else if (await p.$('[data-testid="briefing"][data-launched="1"]')) await shot(p, `c${cls}-warp__${view}`);
    await p.waitForTimeout(1500);
    if (await p.$('[data-testid="briefing"]')) fail(`c${cls} ${view} WARP-1 the card is still up 1.75 s after launch`);
    await p.waitForTimeout(800);
    await shot(p, `c${cls}-engine__${view}`);
    // KEY-1: Enter launches at once (fresh page)
    await p.goto(url); await p.waitForSelector('[data-testid="briefing-launch"]');
    await p.focus('[data-testid="briefing-launch"]'); await p.keyboard.press("Enter"); await p.waitForTimeout(150);
    if (!(await p.$('[data-testid="briefing"][data-launched="1"]'))) fail(`c${cls} ${view} KEY-1 Enter did not launch`);
    tot.errors += errs.length; if (errs.length) console.log(cls, view, "page errors", errs.slice(0, 2));
    await ctx.close();
  }
  // REPLAY-1: the same presses, Hangar colours off and on → the same acts
  const actsWith = [];
  for (const cos of ["0", "1"]) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    await p.goto(`${BASE}?class=6&w=328&h=460&modelMs=600&force3d=1&cos=${cos}`);
    await p.waitForSelector('[data-testid="briefing-launch"]'); await p.waitForTimeout(1000);
    await p.focus('[data-testid="briefing-launch"]'); await p.keyboard.press("Enter");
    await p.waitForFunction(() => window.__k2?.frameAt, null, { timeout: 15_000 }); await p.waitForTimeout(1800);
    for (const name of ["steer right", "steer right", "steer right", "Fire"]) { await p.getByRole("button", { name, exact: true }).first().click(); await p.waitForTimeout(500); }
    await p.waitForTimeout(2500);
    const acts = await p.evaluate(() => (window.__k2acts ?? []).map((b) => (b.acts ?? []).map((e) => ({ seq: e.seq, via: e.via, act: e.act }))));
    actsWith.push(JSON.stringify(acts));
    await ctx.close();
  }
  const replay = { identical: actsWith[0] === actsWith[1], posts: JSON.parse(actsWith[0]).length, acts: JSON.parse(actsWith[0]).flat().length };
  if (!replay.identical || !replay.acts) fail(`REPLAY-1 ${JSON.stringify(replay)}`);
  // FRAME-1: launch → first painted frame vs the engine alone, interleaved, CPU ×4
  const arms = { engine: "brief=0", briefing: "" }; const fr = { engine: [], briefing: [] };
  for (let i = 0; i < 12; i++) for (const [k, qs] of Object.entries(arms)) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    const cdp = await ctx.newCDPSession(p); await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await p.goto(`${BASE}?class=6&w=328&h=460&modelMs=600&force3d=1&cos=1&${qs}`);
    if (k === "briefing") { await p.waitForSelector('[data-testid="briefing-launch"]'); await p.waitForTimeout(1500); await p.focus('[data-testid="briefing-launch"]'); await p.keyboard.press("Enter"); }
    const ok = await p.waitForFunction(() => window.__k2?.frameAt, null, { timeout: 15_000 }).then(() => true, () => false);
    fr[k].push(ok ? Math.round(await p.evaluate(() => window.__k2.frameAt - window.__k2.launchAt)) : null);
    await ctx.close();
  }
  frames.push(fr, replay);
} finally { await browser.close(); stopVite(); }
const [fr, replay] = frames;
const stat = (v) => { const s = v.filter((x) => x !== null).sort((a, b) => a - b); const pc = (k) => (s.length ? s[Math.min(s.length - 1, Math.floor(k * (s.length - 1) + 0.5))] : null); return { n: s.length, missing: v.length - s.length, p50: pc(0.5), p90: pc(0.9), all: v }; };
const frame = { engine: stat(fr.engine), briefing: stat(fr.briefing), bar1200: null };
frame.bar1200 = (frame.briefing.p90 ?? 1e9) <= 1200 ? "met" : "not met (the engine alone: p50 " + frame.engine.p50 + " ms)";
if (frame.briefing.missing || (frame.briefing.p50 ?? 1e9) > (frame.engine.p50 ?? 0) + 100) fail(`FRAME-1 the Briefing adds > 100 ms ${JSON.stringify(frame)}`);
fs.writeFileSync(path.join(ROOT, "docs/design/round4/build/kaksha/lint-k2.json"), JSON.stringify({ date: new Date().toISOString().slice(0, 10), method: "Playwright Chromium (SwiftShader, forced 3D as the G1 cert harness does) on a PRODUCTION build of the Briefing dev page: the real PlayStudioRenderer + Antariksh with K-P3/K-P4; classes 4/6/7 x phone (328x460 box) and laptop (736x460 box); FRAME-1 at CPU x4 (a G35-class PROXY, not a phone)", totals: tot, frame, replay, checks, pages: report }, null, 1));
console.log(JSON.stringify({ tot, frame: { engine: frame.engine.p50 + "/" + frame.engine.p90, briefing: frame.briefing.p50 + "/" + frame.briefing.p90, bar1200: frame.bar1200 }, replay }));
process.exit(tot.small + tot.deva + tot.targets + tot.contrast + tot.overflow + tot.checks + tot.errors ? 1 : 0);
