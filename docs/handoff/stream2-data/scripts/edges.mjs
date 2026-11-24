import { expand } from "/home/user/Taxila/server/forge/explainer/templates.js";
import fs from "node:fs";
const L = JSON.parse(fs.readFileSync("/home/user/Taxila/server/forge/explainer/library.json", "utf8"));
const bad = {};
const walk = (o, f) => { if (o && typeof o === "object") { if (o.call?.template) f(o.call); for (const v of Object.values(o)) walk(v, f); } };
let n = 0;
walk(L, (call) => { n++;
  let s; try { s = expand(call, { band: "B3", lessonId: "x", scriptId: "x" }); s = s.script ?? s; } catch { return; }
  if (!s?.ops) return;
  const { w, h } = s.board;
  for (const o of s.ops) if (o.op === "rect") { const [x, y] = o.at; const pad = (o.weight ?? 1) / 2; if (x - pad < 0 || y - pad < 0 || x + o.w + pad > w || y + o.h + pad > h) { bad[call.template] = (bad[call.template] ?? 0) + 1; break; } }
});
console.log(n, bad);
