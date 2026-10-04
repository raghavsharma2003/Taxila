import path from "node:path";
import { chromium } from "playwright";
process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
const b = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--allow-file-access-from-files"] });
const p = await b.newPage({ viewport: { width: 720, height: 776 } });
await p.goto("file://" + path.resolve("art/character/puppet2d/V/demo.html") + "?rec=1&dpr=1");
await p.waitForFunction(() => window.DEMO_READY);
const cdp = await p.context().newCDPSession(p);
await cdp.send("Profiler.enable"); await cdp.send("Profiler.setSamplingInterval",{interval:100}); await cdp.send("Profiler.start");
await p.evaluate(() => { for (let i = 0; i < 1500; i++) window.DEMO.step(2.4 + (i%600) / 60, 1 / 60); });
const { profile } = await cdp.send("Profiler.stop");
const self = new Map(); const byId = new Map(profile.nodes.map(n=>[n.id,n]));
const dt = profile.timeDeltas; const cnt = new Map();
profile.samples.forEach((id,i)=>cnt.set(id,(cnt.get(id)||0)+(dt[i]||0)));
for (const [id,t] of cnt){ const n=byId.get(id); const k=n.callFrame.functionName+":"+n.callFrame.lineNumber; self.set(k,(self.get(k)||0)+t);}
console.log([...self].sort((a,b)=>b[1]-a[1]).slice(0,18).map(([k,t])=>k+" "+(t/1000).toFixed(0)+"ms").join("\n"));
await b.close();
