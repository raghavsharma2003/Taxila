// probe: the mouth interior strip's projected columns (x of top/bottom vertices, gap) for one pose (fold / coverage check)
import { serve, open } from "./shoot.mjs";
const srv = await serve();
const { browser, page } = await open(srv, "capture=1&px=1024&view=0,0,1024&yawmax=20", { viewport: { width: 1024, height: 1024 } });
const spec = JSON.parse(process.argv[2] || '{"expr":"delight","bs":{},"head":[0,-20,0]}');
const r = await page.evaluate((s) => { window.P2D.pose(s); const I = window.P2D.rig.shell.inner, U = window.P2D.rig.shell.sheets.U, L = window.P2D.rig.shell.sheets.L; const out = [];
  for (let i = 0; i < 8; i++) out.push({ s: +I.s[i * 2].toFixed(3), xt: +I.proj[i * 4].toFixed(1), yt: +I.proj[i * 4 + 1].toFixed(1), xb: +I.proj[i * 4 + 2].toFixed(1), yb: +I.proj[i * 4 + 3].toFixed(1), gap: +I.gap[i * 2].toFixed(1) });
  const row0 = []; for (let c = 0; c < 12; c++) row0.push([+U.pos[(c * U.R) * 2].toFixed(1), +U.pos[(c * U.R) * 2 + 1].toFixed(1), +L.pos[(c * L.R) * 2 + 1].toFixed(1)]);
  return { out, row0 }; }, spec);
console.log(JSON.stringify(r.out)); console.log("shell row0 (x, yU, yL):", JSON.stringify(r.row0));
await browser.close(); srv.close();
