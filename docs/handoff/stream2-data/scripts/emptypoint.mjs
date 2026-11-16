import fs from "node:fs"; import path from "node:path";
const root = "/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/simrec";
const POINT_AT = /\b(?:screen|whiteboard)\b|(?<!\b(?:cbse|icse|state|school|cricket|rbse|bihar|up)\s)\bboard\b(?!\s+(?:exams?|pariksha|games?|ke\s+exam))|स्क्रीन|(?<!(?:सीबीएसई|स्कूल)\s)बोर्ड(?!\s+(?:परीक्षा|एग्जाम))/iu;
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".json") && d.endsWith("records") ? [path.join(d, e.name)] : []));
let lines = 0, pointing = 0, empty = 0, emptyNextHas = 0; const ex = [];
for (const f of walk(root)) {
  const r = JSON.parse(fs.readFileSync(f, "utf8"));
  const ts = r.turns ?? [];
  ts.forEach((t, i) => {
    if (!t.teacher) return; lines++;
    const ss = String(t.teacher).match(/[^.!?।]+[.!?।]*/g) ?? [];
    if (!ss.some((x) => POINT_AT.test(x))) return; pointing++;
    const s = t.screen ?? {};
    const has = !!(s.whiteboard || s.module || s.studio || (s.chips ?? []).length);
    if (has) return; empty++;
    const n = ts[i + 1]?.screen ?? {};
    if (n.whiteboard || n.module || n.studio) emptyNextHas++;
    ex.push({ f: path.basename(f).slice(0, 40), n: t.n, move: t.move?.kind ?? t.move, nextHas: !!(n.whiteboard || n.module || n.studio), line: ss.filter((x) => POINT_AT.test(x)).join(" ").slice(0, 130) });
  });
}
console.log(JSON.stringify({ lines, pointing, empty, emptyNextHas }));
for (const e of ex.slice(0, 40)) console.log(JSON.stringify(e));
