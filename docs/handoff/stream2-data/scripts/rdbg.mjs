import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire("/home/user/Taxila/scripts/x.mjs");
const { chromium } = require("playwright");
const path = require("node:path");
const ev = JSON.parse(fs.readFileSync("/home/user/Taxila/docs/design/round4/build/r12/t-client/replay-rrweb-events.json","utf8")).sort((a,b)=>a.timestamp-b.timestamp);
const js = fs.readFileSync(path.join(path.dirname(require.resolve("rrweb")),"rrweb.umd.cjs"),"utf8");
const b = await chromium.launch(); const p = await b.newPage({viewport:{width:412,height:915}, reducedMotion:'reduce'});
await p.setContent('<div id=root></div>'); await p.addScriptTag({content: js});
const out = await p.evaluate(async ({ev, at}) => {
  const r = new rrweb.Replayer(ev, { root: document.getElementById("root"), UNSAFE_replayCanvas: true, showWarning: true });
  const res = [];
  for (const off of at) { r.pause(off - ev[0].timestamp); await new Promise(s=>setTimeout(s,300)); const d = document.querySelector("iframe").contentDocument; const el = d.querySelector(".dk-caption-line"); const cs = el && d.defaultView.getComputedStyle(el); const ch = d.querySelector(".dk-chip"); const cc = ch && d.defaultView.getComputedStyle(ch); res.push([off, el?.outerHTML.slice(0,300), cs && [cs.opacity, cs.visibility, cs.color, cs.display, el.getBoundingClientRect().height], ch?.outerHTML.slice(0,200), cc && [cc.opacity, cc.visibility, cc.display, ch.getBoundingClientRect().height], [...d.querySelectorAll("style")].length, d.styleSheets.length]); }
  return res;
}, { ev, at: JSON.parse(fs.readFileSync("/home/user/Taxila/docs/design/round4/build/r12/t-client/replay-proof.json","utf8")).rows.map(r=>Date.parse(r.at)) });
console.log(JSON.stringify(out, null, 1)); await b.close();
