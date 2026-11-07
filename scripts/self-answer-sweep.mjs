// main 14.4: how often does her line state the answer of its own numeric question before asking it (studio/request.js
// selfAnswer), over sim-lab records (adult-run simulated lessons, no child), and does the rewrite (unanswer) clear it?
//   node scripts/self-answer-sweep.mjs <records-root> [--out file]
import fs from "node:fs";
import path from "node:path";
import { selfAnswer, unanswer } from "../server/studio/request.js";

const root = process.argv[2];
const out = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : null;
const kits = new Map();
const kitOf = (t) => { const m = /^(c\d+)-([a-z]+)-/.exec(t ?? ""); if (!m) return null; const f = `data/kits/${m[1]}-${m[2]}.json`; if (!kits.has(f)) kits.set(f, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null); return kits.get(f)?.topics?.find((x) => x.topicId === t) ?? null; };
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".json") && d.endsWith("records") ? [path.join(d, e.name)] : []));
let lines = 0, before = 0, after = 0;
const by = {}, hits = [];
for (const f of walk(root)) {
  const r = JSON.parse(fs.readFileSync(f, "utf8"));
  const run = f.split(path.sep).find((x) => x.startsWith("r5-")) ?? "?";
  const worked = String(kitOf(r.start?.topic?.id)?.workedExample?.problem ?? "");
  const recent = [], child = [];
  for (const t of r.turns ?? []) {
    if (t.child) child.push(String(t.child));
    if (!t.teacher) continue;
    lines++; (by[run] ??= { lines: 0, before: 0, after: 0 }).lines++;
    const o = { recent, worked, child };
    const hit = selfAnswer(t.teacher, o);
    if (hit) {
      before++; by[run].before++;
      const fixed = unanswer(t.teacher, hit);
      if (selfAnswer(fixed, o)) { after++; by[run].after++; }
      hits.push({ run, lesson: path.basename(f), turn: t.n, source: hit.source, answer: hit.answer, line: t.teacher, fixed });
    }
    recent.push(t.teacher);
  }
}
const sum = { lines, before, after, by };
console.log(JSON.stringify(sum));
for (const h of hits) console.log(`${h.run} ${h.lesson} #${h.turn} [${h.source} → ${h.answer}]\n  was: ${h.line}\n  now: ${h.fixed}`);
if (out) fs.writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), method: "studio/request.js selfAnswer over every teacher line; operands: the question, her line, her last two lines, the kit worked example's givens; the child's last two turns exempt", sum, hits }, null, 1));
