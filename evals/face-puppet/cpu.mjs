// CPU cost of the puppet, robust to a loaded machine: CPU-seconds (utime + stime from /proc) consumed by Chromium's
// renderer and GPU processes per wall second while the production stage plays 3 Diya lines (talking) and then holds
// your_turn/idle, minus the same page with the puppet removed (baseline). SwiftShader = the GPU's work is CPU work too,
// so the GPU-process share is a pessimistic stand-in for a phone GPU. Reports % of one core.
//   node evals/face-puppet/cpu.mjs [cpuThrottle]
import { chromium } from "playwright";
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
const rate = +(process.argv[2] || 1);
const srv = spawn(process.execPath, ["evals/face-puppet/serve.mjs", "4731"], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 500));
const TICK = +execSync("getconf CLK_TCK").toString().trim();
const chromePids = () => new Set(fs.readdirSync("/proc").filter((d) => /^\d+$/.test(d)).filter((d) => { try { return fs.readFileSync(`/proc/${d}/cmdline`, "utf8").includes("chrome-headless-shell"); } catch { return false; } }));
const procs = (mine) => {
  const out = [];
  for (const d of mine) {
    try {
      const st = fs.readFileSync(`/proc/${d}/stat`, "utf8"), r = st.slice(st.lastIndexOf(")") + 2).split(" ");
      const cmd = fs.readFileSync(`/proc/${d}/cmdline`, "utf8");
      out.push({ pid: +d, kind: /--type=renderer/.test(cmd) ? "renderer" : /--type=gpu-process/.test(cmd) ? "gpu" : "other", cpu: (+r[11] + +r[12]) / TICK });
    } catch { /* gone */ }
  }
  return out;
};
const sum = (root) => { const o = { renderer: 0, gpu: 0, other: 0 }; for (const p of procs(root)) o[p.kind] += p.cpu; return o; };
async function measure(mode) {
  const before = chromePids();
  const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"] });
  const p = await b.newPage({ viewport: { width: 400, height: 400 } });
  const root = [...chromePids()].filter((x) => !before.has(x)); // this run's browser processes only
  if (rate > 1) await (await p.context().newCDPSession(p)).send("Emulation.setCPUThrottlingRate", { rate });
  await p.goto(`http://127.0.0.1:4731/h/index.html?mode=rt&line=00,01,02&px=360`);
  await p.waitForFunction("window.H && (window.H.ready || window.H.error)", null, { timeout: 120000 });
  if (mode === "blank") await p.evaluate("window.H.stage.stop(); window.H.stage.canvas.style.display = 'none'");
  await p.waitForTimeout(2000);
  const f0 = mode === "blank" ? 0 : await p.evaluate("window.H.stage.snapshot().frames");
  const a = sum(root), t0 = Date.now();
  await p.waitForTimeout(15000);
  const z = sum(root), secs = (Date.now() - t0) / 1000;
  const frames = mode === "blank" ? 0 : (await p.evaluate("window.H.stage.snapshot().frames")) - f0;
  const snap = mode === "blank" ? null : await p.evaluate("window.H.stage.snapshot()");
  await b.close();
  return { mode, secs, frames, drawnFps: frames / secs, rendererCores: (z.renderer - a.renderer) / secs, gpuCores: (z.gpu - a.gpu) / secs, snap };
}
const puppet = await measure("puppet"), blank = await measure("blank");
srv.kill();
const res = { date: new Date().toISOString().slice(0, 10), loadavg1m: os.loadavg()[0], cpuThrottle: rate, method: "Chromium headless (SwiftShader GL), 360 CSS px canvas @ dpr 1, Diya lines playing on a real AudioContext; CPU-seconds from /proc per wall second over 15 s, puppet page minus the same page with the stage stopped", puppet, blank,
  rendererCpuMsPerFrame: +((1000 * (puppet.rendererCores - blank.rendererCores) * puppet.secs) / Math.max(1, puppet.frames)).toFixed(2),
  gpuSwiftShaderCpuMsPerFrame: +((1000 * (puppet.gpuCores - blank.gpuCores) * puppet.secs) / Math.max(1, puppet.frames)).toFixed(2),
  facePctOfOneCore: { renderer: +(100 * (puppet.rendererCores - blank.rendererCores)).toFixed(1), gpuSwiftShader: +(100 * (puppet.gpuCores - blank.gpuCores)).toFixed(1) } };
fs.writeFileSync(`evals/face-puppet/out/cpu-${rate}x.json`, JSON.stringify(res, null, 1));
console.log(JSON.stringify({ ...res, puppet: { ...puppet, snap: undefined }, blank: { ...blank, snap: undefined }, final: puppet.snap }, null, 1));
