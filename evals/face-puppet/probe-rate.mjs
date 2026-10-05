// Debug probe: the stage's face state, lip source and frame rate once a second while 3 Diya lines play (1x CPU).
import { chromium } from "playwright";
import { spawn } from "node:child_process";
const srv = spawn(process.execPath, ["evals/face-puppet/serve.mjs", "4721"], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 500));
const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"] });
const p = await b.newPage({ viewport: { width: 760, height: 760 } });
await p.goto("http://127.0.0.1:4721/h/index.html?mode=rt&line=00,01&px=360&budget=999");
await p.waitForFunction("window.H && window.H.ready");
await p.evaluate("window.__raf = 0; (function f(){ window.__raf++; requestAnimationFrame(f); })()");
for (let i = 0; i < 14; i++) { await p.evaluate("window.__raf0 = window.__raf"); await p.waitForTimeout(1000); console.log(JSON.stringify(await p.evaluate("(() => { const s = window.H.stage.snapshot(); return { st: s.state, lip: s.lipSource, cur: s.curFps, fps: Math.round(s.fpsP50), busy: +(window.H.stage.driver.busyUntil - performance.now()/1000).toFixed(2), raf: window.__raf - window.__raf0, frames: s.frames }; })()"))); }
await b.close(); srv.kill();
