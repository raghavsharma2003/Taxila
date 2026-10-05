import { serve, open } from "/home/user/Taxila/scripts/character/puppet2d/polish-r10/shoot.mjs";
const srv = await serve();
const { browser, page } = await open(srv, "capture=1&px=1024&view=0,0,1024", { viewport: { width: 1024, height: 1024 } });
for (const spec of [{ bs: { viseme_O: 1, jawOpen: 0.4 } }, { bs: { viseme_U: 1, jawOpen: 0.2 } }, { expr: "surprise", bs: {} }, { bs: { viseme_aa: 1, jawOpen: 0.55 } }]) {
  const r = await page.evaluate((s) => { window.P2D.pose(s); const sh = window.P2D.rig.shell; const I = sh.inner; const g = []; for (let i = 0; i < I.gap.length; i += 2) g.push(+I.gap[i].toFixed(1)); return { p: Object.fromEntries(Object.entries(window.P2D.rig.solver.p).map(([k, v]) => [k, +v.toFixed(2)])), gapMid: g[24], gaps: g.filter((_, i) => i % 6 == 0) }; }, spec);
  console.log(JSON.stringify(spec), JSON.stringify(r));
}
await browser.close(); srv.close();
