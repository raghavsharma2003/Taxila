import path from "node:path";
import { chromium } from "playwright";
process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
const b = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--allow-file-access-from-files"] });
const p = await b.newPage({ viewport: { width: 720, height: 776 } });
await p.goto("file://" + path.resolve("art/character/puppet2d/V/demo.html") + "?rec=1&dpr=1");
await p.waitForFunction(() => window.DEMO_READY);
const cdp = await p.context().newCDPSession(p);
for (const rate of [1, 4]) {
  await cdp.send("Emulation.setCPUThrottlingRate", { rate });
  const r = await p.evaluate(() => {
    const rig = window.DEMO.rig, q = (a, f) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(f * (s.length - 1))]; };
    const feat = [], step = [];
    for (let i = 0; i < 600; i++) {
      const t = 2.4 + i / 60;
      const t0 = performance.now(); window.DEMO.step(t, 1 / 60); step.push(performance.now() - t0);
      const t1 = performance.now(); rig._features(rig.state.bs, rig.state.gaze, rig.state.head[1]); feat.push(performance.now() - t1);
    }
    return { featP50: q(feat, .5), featP95: q(feat, .95), stepP50: q(step, .5), stepP95: q(step, .95), dynTris: rig.lastDynTris };
  });
  console.log(rate, JSON.stringify(r));
}
await b.close();
