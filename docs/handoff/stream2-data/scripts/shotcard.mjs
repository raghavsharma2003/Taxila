import { buildHarness, serveHarness, openJudge, launchLocal } from "/home/user/Taxila/server/forge3/qa/render.js";
import { expand } from "/home/user/Taxila/server/forge/explainer/templates.js";
import { trayViewports } from "/home/user/Taxila/server/forge3/certify-tray.js";
const dir = await buildHarness("/home/user/Taxila/node_modules/.cache/forge3-harness-card");
const { server, base } = await serveHarness(dir);
const browser = await launchLocal();
const judge = await openJudge({ browser, base });
const r = expand({ template: "fraction-of@1", a: 1, b: 2, c: 1, d: 2 });
for (const [young, card] of [[false, { kind: "steps", n: 3, checkpointAhead: true }], [true, { kind: "picture", n: 1, checkpointAhead: false }]]) {
  const script = { ...r.script, card };
  const v = await judge.judge({ kind: "whiteboard", stage: { w: script.board.w, h: script.board.h }, script }, { viewports: trayViewports(young), young, shotDir: process.argv[2], shotTag: `card-${card.kind}-${young ? "y" : "o"}` });
  console.log(card.kind, young, JSON.stringify(v.piece), v.views.map((x) => x.verdict.stats.minPx).join(" "));
}
await judge.close(); await browser.close(); server.close();
