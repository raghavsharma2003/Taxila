// r5: per-section CPU profile of the rig (?prof=1), realtime under CDP CPU throttling.  node prof.mjs [rate] [secs] [start]
import { serve, open } from "./shoot.mjs";
const rate = +(process.argv[2] || 4), secs = +(process.argv[3] || 10), start = process.argv[4] || "0";
const srv = await serve();
const { browser, page } = await open(srv, `prof=1&start=${start}`, { viewport: { width: 720, height: 900 } });
const cdp = await page.context().newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate });
await page.evaluate(() => { for (const k in window.P2D.rig.prof) delete window.P2D.rig.prof[k]; });
await page.waitForTimeout(secs * 1000);
const r = await page.evaluate(() => { const p = window.P2D.rig.prof, n = p.frames; const o = {}; for (const k in p) if (k !== "frames") o[k] = +(p[k] / n).toFixed(3); return { frames: n, msPerFrame: o }; });
console.log(JSON.stringify(r, null, 1));
await browser.close(); srv.close();
