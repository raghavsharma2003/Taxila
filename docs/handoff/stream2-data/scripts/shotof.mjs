import { buildHarness, serveHarness, openJudge, launchLocal } from "/home/user/Taxila/server/forge3/qa/render.js";
import { expand } from "/home/user/Taxila/server/forge/explainer/templates.js";
import { trayViewports } from "/home/user/Taxila/server/forge3/certify-tray.js";
const dir = await buildHarness("/home/user/Taxila/node_modules/.cache/forge3-harness");
const { server, base } = await serveHarness(dir);
const browser = await launchLocal();
const judge = await openJudge({ browser, base });
for (const [a,b,c,d] of [[1,2,1,2],[3,5,2,3]]) {
  const r = expand({ template: "fraction-of@1", a, b, c, d });
  const v = await judge.judge({ kind: "whiteboard", stage: { w: r.script.board.w, h: r.script.board.h }, script: r.script }, { viewports: trayViewports(false), shotDir: process.argv[2], shotTag: `of-${a}${b}${c}${d}` });
  console.log(a,b,c,d, JSON.stringify(v.piece));
}
await judge.close(); await browser.close(); server.close();
