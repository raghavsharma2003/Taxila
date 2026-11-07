import fs from "node:fs"; import path from "node:path";
const root = "/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/simrec";
const DIAG = /\b(?:diagram|chart|chitra|tasveer|picture|figure|drawing|sketch)\b|डायग्राम|चित्र|तस्वीर|चार्ट/iu;
const POINT_AT = /\b(?:screen|whiteboard)\b|(?<!\b(?:cbse|icse|state|school|cricket|rbse|bihar|up)\s)\bboard\b(?!\s+(?:exams?|pariksha|games?|ke\s+exam))|स्क्रीन|(?<!(?:सीबीएसई|स्कूल)\s)बोर्ड(?!\s+(?:परीक्षा|एग्जाम))/iu;
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".json") && d.endsWith("records") ? [path.join(d, e.name)] : []));
let diag = 0, diagNotPoint = 0, emptyStage = 0; const ex = [];
for (const f of walk(root)) {
  const r = JSON.parse(fs.readFileSync(f, "utf8"));
  for (const t of r.turns ?? []) {
    if (!t.teacher) continue;
    const ss = (String(t.teacher).match(/[^.!?।]+[.!?।]*/g) ?? []).filter((x) => DIAG.test(x) && !POINT_AT.test(x));
    if (!ss.length) continue; diagNotPoint++;
    const s = t.screen ?? {};
    const has = !!(s.whiteboard || s.module || s.studio);
    if (!has) { emptyStage++; ex.push({ f: path.basename(f).slice(0, 34), n: t.n, s: ss.join(" ").slice(0, 140) }); }
  }
}
console.log(JSON.stringify({ linesWithDiagWordNoPointAt: diagNotPoint, emptyStage }));
for (const e of ex) console.log(JSON.stringify(e));
