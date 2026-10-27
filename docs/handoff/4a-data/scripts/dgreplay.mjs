import fs from "node:fs";
import { evidenceRead, depthOf } from "/home/user/Taxila/server/agent/read.js";
const R = process.argv[2], arm = process.argv[3] ?? "agent_gpt6";
const s = JSON.parse(fs.readFileSync(R + "/scores.json", "utf8"));
const O = { not: 0, partly: 1, understood: 2 };
const readOf = (g) => g.length ? evidenceRead(g, { bar: 0.8 }) : null;
const tally = { judge: {}, actual: {}, perfect: {} };
const add = (k, truth, read) => { if (!read || read === "unknown") return (tally[k].unk = (tally[k].unk ?? 0) + 1); const key = read === truth ? "agree" : O[read] > O[truth] ? "over" : "under"; tally[k][key] = (tally[k][key] ?? 0) + 1; };
const rowsOut = [];
for (const l of s.lessons.filter((x) => x.arm === arm)) {
  const rec = JSON.parse(fs.readFileSync(`${R}/records/${l.persona}--${arm}--text.json`, "utf8"));
  const act = {}, per = {};
  for (const t of rec.turns) {
    const d = t.decided; if (!d?.outcome) continue;
    const cls = t.reasons?.classification?.outcome;
    const g = cls === "correct" ? "correct" : cls === "partial" ? "partly" : ["incorrect", "misconception"].includes(cls) ? "wrong" : null;
    if (g) (act[d.skillId] ??= []).push({ item: d.itemId, kind: d.kind, g });
    const p = d.outcome === "right" ? "correct" : d.outcome === "wrong" ? "wrong" : null;
    if (p) (per[d.skillId] ??= []).push({ item: d.itemId, kind: d.kind, g: p });
  }
  for (const r of l.understanding.rows) {
    add("judge", r.truth, r.read);
    const a = readOf(act[r.skillId] ?? []), p = readOf(per[r.skillId] ?? []);
    add("actual", r.truth, a); add("perfect", r.truth, p);
    rowsOut.push({ persona: l.persona, skill: r.skillId, truth: r.truth, judge: r.read, actual: a, perfect: p, act: (act[r.skillId] ?? []).map((x) => `${depthOf(x.kind)[0]}${x.g[0]}`).join(""), per: (per[r.skillId] ?? []).map((x) => `${depthOf(x.kind)[0]}${x.g[0]}`).join("") });
  }
}
console.log(arm, JSON.stringify(tally));
fs.writeFileSync(process.argv[4], JSON.stringify(rowsOut, null, 1));
