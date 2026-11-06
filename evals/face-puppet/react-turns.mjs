// Round 7 face-reacts (listening / thinking between turns): what does her face DO while the child talks and while she
// thinks, on the real lesson runtime? /dev/desk?live=1 (scripted Director + clock link; ?slow= is the Director's think
// time), the live puppet forced on, a 412 px phone viewport with screen recording. Per turn: the child talks (the link's
// talkStart / talkEnd: a mic level, child_speech_start / _end, then child_final), the Director thinks for SLOW ms, she
// replies. The driver's frame() is wrapped to log, per frame: the face state, gaze (yaw, pitch), head (pitch, yaw, roll)
// and the drawn jaw. Reported per turn and phase (listen = talk start → talk end; think = talk end → her first audio):
// time in each face state, the gaze excursion, head motion, the max jaw (must stay ~0 outside her speech), and how late
// THINKING ends after her first audio (must be <= 1 frame).
//   node evals/face-puppet/react-turns.mjs [--dist <dir>] [--out <dir>] [--cpu 1] [--slow 1500] [--flags "&react=1"]
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { chromium } from "playwright";

const ROOT = new URL("../..", import.meta.url).pathname;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const OUT = arg("--out", path.join(ROOT, "docs/design/round7/face/react"));
const CPU = Number(arg("--cpu", "1"));
const SLOW = Number(arg("--slow", "1500"));
const FLAGS = arg("--flags", "");
const LABEL = arg("--label", "baseline");
const TALK_MS = 1600;
let dist = arg("--dist");
if (!dist) {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), "taxila-r7-face-react-"));
  execFileSync("npx", ["vite", "build", "--outDir", dist, "--emptyOutDir"], { cwd: ROOT, stdio: "ignore", env: { ...process.env, VITE_DEV_ROUTES: "1" } });
}
fs.mkdirSync(OUT, { recursive: true });
const PORT = await new Promise((r) => { const s = http.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
const BASE = `http://127.0.0.1:${PORT}`;
const srv = spawn(process.execPath, [path.join(ROOT, "server/serve.mjs")], { env: { ...process.env, PORT: String(PORT), TAXILA_DIST: dist, DATABASE_URL: "" }, stdio: "ignore" });
for (let i = 0; i < 100; i++) { try { if ((await fetch(`${BASE}/`)).ok) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 150)); }

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const vdir = path.join(OUT, `video-${LABEL}`);
fs.rmSync(vdir, { recursive: true, force: true });
const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, recordVideo: { dir: vdir, size: { width: 412, height: 915 } } });
await ctx.route("**/api/face/config*", (r) => r.fulfill({ json: { puppet2d: true, visemes: true, rev: "r8", look: "r8" } }));
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
if (CPU > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU });
await page.goto(`${BASE}/dev/desk?live=1&band=b3&face=live&facerig=1&puppet=1&slow=${SLOW}${FLAGS}`, { waitUntil: "domcontentloaded" });
// her opening line, then the child's turn
await page.waitForFunction(() => window.__puppet?.isRevealed && window.__desk?.runtime, null, { timeout: 60_000 });
await page.waitForFunction(() => document.querySelector('[data-floor="your_turn"]'), null, { timeout: 60_000 });
await page.evaluate(() => {
  const w = window;
  w.__rt = { log: [], marks: [] };
  const d = w.__puppet.driver;
  const frame = d.frame.bind(d);
  d.frame = (inp, rig) => {
    const f = frame(inp, rig);
    w.__rt.log.push([performance.now(), f.state, +f.gaze[0].toFixed(2), +f.gaze[1].toFixed(2), +f.head[0].toFixed(2), +f.head[1].toFixed(2), +f.head[2].toFixed(2), +(f.mouth.jawOpen ?? 0).toFixed(3), +f.workMs.toFixed(2)]);
    return f;
  };
  new MutationObserver(() => {
    const fl = document.querySelector("[data-floor]")?.getAttribute("data-floor");
    const last = w.__rt.marks.filter((m) => m[1] === "floor").at(-1);
    if (fl && fl !== last?.[2]) w.__rt.marks.push([performance.now(), "floor", fl]);
  }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-floor"] });
});

async function turn(n) {
  await page.waitForFunction(() => document.querySelector('[data-floor="your_turn"]'), null, { timeout: 60_000 });
  await page.waitForTimeout(800);
  await page.evaluate((n) => { window.__rt.marks.push([performance.now(), "talkStart", n]); window.__desk.runtime.talkStart(); }, n);
  await page.waitForTimeout(TALK_MS);
  await page.evaluate((n) => { window.__rt.marks.push([performance.now(), "talkEnd", n]); window.__desk.runtime.talkEnd(); }, n);
  // her reply's first audio: the floor reads speaking
  await page.waitForFunction(() => document.querySelector('[data-floor="speaking"]'), null, { timeout: 30_000 });
  await page.evaluate((n) => window.__rt.marks.push([performance.now(), "herAudio", n]), n);
  await page.waitForTimeout(2500);
}
await turn(1); // the script's first reply: verdict correct
await turn(2); // the second: verdict not_yet
const { log, marks } = await page.evaluate(() => window.__rt);
await ctx.close();
await browser.close();
srv.kill();

const at = (kind, n) => marks.find((m) => m[1] === kind && m[2] === n)?.[0];
/** The floor's own change to `fl` at or after `t` (the page's MutationObserver, not the harness's polling). */
const floorAt = (fl, t) => marks.find((m) => m[1] === "floor" && m[2] === fl && m[0] >= t)?.[0];
const frames = (a, b) => log.filter((f) => f[0] >= a && f[0] < b);
const range = (fs, i) => (fs.length ? +(Math.max(...fs.map((f) => f[i])) - Math.min(...fs.map((f) => f[i]))).toFixed(2) : null);
const states = (fs) => { const c = {}; for (const f of fs) c[f[1]] = (c[f[1]] ?? 0) + 1; return Object.fromEntries(Object.entries(c).map(([k, v]) => [k, +(v / fs.length).toFixed(2)])); };
const phase = (fs) => ({ frames: fs.length, states: states(fs), gazeYawRange: range(fs, 2), gazePitchRange: range(fs, 3), headPitchRange: range(fs, 4), headRollRange: range(fs, 6), minJaw: fs.length ? Math.min(...fs.map((f) => f[7])) : null, maxJaw: fs.length ? Math.max(...fs.map((f) => f[7])) : null, workP95: fs.length ? [...fs.map((f) => f[8])].sort((a, b) => a - b)[Math.floor(fs.length * 0.95)] : null });
const turns = [1, 2].map((n) => {
  const t0 = at("talkStart", n), t1 = at("talkEnd", n), t2 = floorAt("speaking", t1);
  const faceThinkAt = log.find((f) => f[0] >= t1 && f[1] === "thinking")?.[0];
  const faceSpeakAt = log.find((f) => f[0] >= t1 && f[1] === "speaking")?.[0];
  return { turn: n, verdict: n === 1 ? "correct" : "not_yet", talkMs: Math.round(t1 - t0), gapMs: Math.round(t2 - t1),
    heardMs: Math.round(floorAt("thinking", t1) - t1),
    faceThinkingAfterTalkEndMs: faceThinkAt != null ? Math.round(faceThinkAt - t1) : null,
    listen: phase(frames(t0, t1)), think: phase(frames(t1, t2)), reply: phase(frames(t2, t2 + 2000)),
    faceSpeakingAfterAudioMs: faceSpeakAt != null ? Math.round(faceSpeakAt - t2) : null };
});
const result = { at: new Date().toISOString(), label: LABEL, cpu: CPU, slowMs: SLOW, flags: FLAGS, talkMs: TALK_MS, turns, marks, log };
fs.writeFileSync(path.join(OUT, `react-${LABEL}.json`), JSON.stringify(result, null, 1));
const vids = fs.readdirSync(vdir).filter((f) => f.endsWith(".webm"));
if (vids[0]) fs.renameSync(path.join(vdir, vids[0]), path.join(OUT, `react-${LABEL}.webm`));
fs.rmSync(vdir, { recursive: true, force: true });
console.log(JSON.stringify(turns, null, 1));
