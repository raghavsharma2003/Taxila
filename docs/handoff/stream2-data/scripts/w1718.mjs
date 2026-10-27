import fs from "node:fs"; import path from "node:path";
import { gateWhiteboard, withheldValues } from "/home/user/Taxila/server/studio/qa/whiteboard.js";
import { normalizeScript, lintScript } from "/home/user/Taxila/shared/whiteboard.js";
const DIR = "/home/user/Taxila/data/studio-catalogue/topics";
const kits = new Map();
const kitOf = (t) => { const m = /^(c\d+)-([a-z]+)-/.exec(t); if (!m) return null; const f = `/home/user/Taxila/data/kits/${m[1]}-${m[2]}.json`; if (!kits.has(f)) kits.set(f, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null); return kits.get(f)?.topics?.find((x) => x.topicId === t) ?? null; };
const by = {}; const samples = { W17: [], W18: [] }; let total = 0;
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith(".json")).sort()) {
  const rec = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
  const kit = kitOf(rec.topicId); const subj = rec.topicId.split("-")[1];
  for (const b of rec.whiteboard?.beats ?? []) {
    if (!b?.script) continue;
    const n = normalizeScript(b.script, { strict: true }); if (!n.ok || lintScript(n.script).length) continue;
    const line = String(rec.explainer?.spec?.text?.[b.line] ?? "");
    total++; const s = (by[subj] ??= { beats: 0, W17: 0, W18: 0 }); s.beats++;
    const g = gateWhiteboard({ ...n.script, line: { lessonId: "L" } }, { reply: line, kit, speechMs: 20000, withhold: withheldValues(kit, { line }) });
    for (const id of ["W17", "W18"]) {
      const c = g.checks.find((x) => x.id.startsWith(id));
      if (c && !c.pass) { s[id]++; if (samples[id].length < 10) samples[id].push({ topic: rec.topicId, beat: b.line, line: line.slice(0, 140), cells: n.script.ops.filter((o) => o.op === "numwork").map((o) => o.rows.flat().join(" ")).join(" | ").slice(0, 100), detail: c.detail }); }
    }
  }
}
const sum = Object.values(by).reduce((a, s) => ({ beats: a.beats + s.beats, W17: a.W17 + s.W17, W18: a.W18 + s.W18 }), { beats: 0, W17: 0, W18: 0 });
console.log(JSON.stringify({ total, sum, by }, null, 0));
for (const id of ["W17", "W18"]) { console.log("---", id); for (const x of samples[id]) console.log(x.topic, x.beat, "|", x.line, "|", x.cells, "|", JSON.stringify(x.detail)); }
