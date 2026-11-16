import fs from "node:fs"; import path from "node:path";
const root = "/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/simrec";
const W = "(?:diagram|chart|chitra|tasveer|picture|figure|drawing|sketch|डायग्राम|चित्र|तस्वीर|चार्ट)";
const POINT_DIAG = new RegExp([
  `(?:\\b(?:is|iss|us|uss|yeh|ye|yah|this|the|that)\\s+${W}\\b)`,
  `(?:\\b${W}\\s+(?:mein|me|par|pe|ko|in|on)\\s+(?:\\S+\\s+){0,3}(?:dekh\\w*|look|see|notice|dikh\\w*))`,
  `(?:\\b(?:look|dekh\\w*)\\s+(?:at\\s+)?(?:the\\s+|is\\s+|iss\\s+)?${W}\\b)`,
  `(?:(?:इस|यह|ये|उस)\\s+${W})`,
].join("|"), "iu");
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".json") && d.endsWith("records") ? [path.join(d, e.name)] : []));
let hit = 0, empty = 0; const ex = [];
for (const f of walk(root)) for (const t of JSON.parse(fs.readFileSync(f, "utf8")).turns ?? []) {
  if (!t.teacher) continue;
  const ss = (String(t.teacher).match(/[^.!?।]+[.!?।]*/g) ?? []).filter((x) => POINT_DIAG.test(x));
  if (!ss.length) continue; hit++;
  const s = t.screen ?? {}; const has = !!(s.whiteboard || s.module || s.studio);
  if (!has) empty++;
  ex.push({ has, f: path.basename(f).slice(0, 30), n: t.n, s: ss.join(" ").slice(0, 120) });
}
console.log(JSON.stringify({ hit, empty }));
for (const e of ex) console.log(JSON.stringify(e));
