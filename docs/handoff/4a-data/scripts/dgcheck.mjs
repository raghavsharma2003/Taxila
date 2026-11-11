import fs from "node:fs";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
console.info = () => {};
const R = process.argv[2]; const s = JSON.parse(fs.readFileSync(R + "/scores.json", "utf8"));
const O = { not: 0, partly: 1, understood: 2 }; const t = {};
const rows = [];
for (const l of s.lessons.filter((x) => x.arm === "agent_gpt6")) {
  const rec = JSON.parse(fs.readFileSync(`${R}/records/${l.persona}--agent_gpt6--text.json`, "utf8"));
  const tp = l.understanding.rows[0].skillId.match(/^c\d+-[a-z]+-ch\d+-t\d+/)[0]; const kit = kitFromFile(getTopic(tp));
  const byTitle = Object.fromEntries((rec.end?.facts?.skills ?? []).map((x) => [x.skill, x]));
  for (const r of l.understanding.rows) {
    const f = byTitle[kit.skills.find((k) => k.id === r.skillId)?.title];
    const own = !f ? "no facts" : (f.check ?? "no check").split(":")[0];
    const v = r.read === "unknown" ? "unknown" : r.read === r.truth ? "agree" : O[r.read] > O[r.truth] ? "OVER" : "UNDER";
    const k = `${v.padEnd(7)} ${r.truth}->${r.read}  | agent's own check: ${own}`; t[k] = (t[k] ?? 0) + 1;
    rows.push({ persona: l.persona, skill: r.skillId, truth: r.truth, judge: r.read, own, fact: f ? `${f.unaidedCorrect}/${f.attempts}` : null });
  }
}
console.log(Object.entries(t).sort().map(([k, v]) => `${String(v).padStart(3)}  ${k}`).join("\n"));
fs.writeFileSync(process.argv[3], JSON.stringify(rows, null, 1));
