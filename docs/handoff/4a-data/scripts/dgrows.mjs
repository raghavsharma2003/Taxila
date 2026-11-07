import fs from "node:fs";
const R = process.argv[2], arm = process.argv[3] ?? "agent_gpt6";
const s = JSON.parse(fs.readFileSync(R + "/scores.json", "utf8"));
const out = [];
for (const l of s.lessons.filter((x) => x.arm === arm)) {
  const rec = JSON.parse(fs.readFileSync(`${R}/records/${l.persona}--${arm}--text.json`, "utf8"));
  const facts = rec.end?.facts?.skills ?? [];
  const kts = rec.turns.flatMap((t) => (t.reasons?.kt ?? []).map((k) => ({ ...k, turn: t.n })));
  const seen = new Set();
  const uniq = kts.filter((k) => !seen.has(k.id) && seen.add(k.id));
  l.understanding.rows.forEach((r, i) => {
    const ks = uniq.filter((k) => (k.skillIds ?? []).includes(r.skillId));
    const learned = rec.learning.find((x) => x.skillId === r.skillId);
    out.push({ persona: l.persona, skill: r.skillId, truth: r.truth, read: r.read, check: facts[i]?.check ?? null, fact: facts[i] ? `${facts[i].unaidedCorrect}/${facts[i].attempts}` : null,
      graded: ks.map((k) => `${k.cls}:${k.outcome}`).join(" "), nGraded: ks.length, learnedAt: learned?.turn ?? null, startState: null });
  });
}
fs.writeFileSync(process.argv[4], JSON.stringify(out, null, 1));
console.log(out.length, "rows");
