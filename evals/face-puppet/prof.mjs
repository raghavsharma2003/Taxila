// Per-layer rig cost profile (rig.prof) of the production stage in the harness.  node evals/face-puppet/prof.mjs [cpuThrottle]
import { chromium } from "playwright";
import { spawn } from "node:child_process";
const srv = spawn(process.execPath, ["evals/face-puppet/serve.mjs", "4720"], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 500));
const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"] });
const p = await b.newPage({ viewport: { width: 760, height: 760 } });
const cdp = await p.context().newCDPSession(p);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: +(process.argv[2]||1) });
await p.goto("http://127.0.0.1:4720/h/index.html?mode=rt&line=00,01&px=360&budget=999");
await p.waitForFunction("window.H && window.H.ready");
await p.evaluate("window.H.stage.rig.prof = {}");
await p.waitForTimeout(8000);
const prof = await p.evaluate("window.H.stage.rig.prof");
const n = prof.frames; const rows = Object.entries(prof).filter(([k]) => k !== "frames").map(([k, v]) => [k, +(v / n).toFixed(3)]).sort((a, b) => b[1] - a[1]);
console.log("frames", n, rows);
await b.close(); srv.kill();
