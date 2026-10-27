import fs from "node:fs";
const A = await import("/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/request-pre.mjs");
const B = await import("/home/user/Taxila/server/studio/request.js");
const { expand } = await import("/home/user/Taxila/server/forge/explainer/templates.js");
const L = JSON.parse(fs.readFileSync("/home/user/Taxila/server/forge/explainer/library.json", "utf8"));
const calls = []; const walk = (o) => { if (o && typeof o === "object") { if (o.call?.template) calls.push(o.call); for (const v of Object.values(o)) walk(v); } }; walk(L);
let n = 0; const moved = {};
for (const c of calls) { const x = expand(c, { lessonId: "L", scriptId: "s" }); if (!x.ok) continue; n++;
  const a = A.isDrawing(x.script), b = B.isDrawing(x.script); if (a !== b) (moved[c.template] ??= []).push(`${a}->${b}`); }
console.log(JSON.stringify({ libraryScripts: n, moved: Object.fromEntries(Object.entries(moved).map(([k, v]) => [k, v.length + " " + v[0]])) }));
