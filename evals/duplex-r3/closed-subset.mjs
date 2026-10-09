// duplex r3: the CLOSED-ANSWER subset of eot-bench Hindi (REAL-ADULT): turns whose engine context at the turn end was a closed
// answer (her line was a yes/no question and the answer stayed short), read from the pause table, scored from a replay
// result. The tutor's most common child turn is a short closed answer; eot-bench has few, so n is small and stated.
//   node evals/duplex-r3/closed-subset.mjs <table.json.gz> <replay-result.json> [...]
import fs from "node:fs";
import { loadTable } from "./eot-policy.mjs";
import { endEpisode } from "./eot-sem-ceiling.mjs";
const q = (a, p) => { if (!a.length) return null; const z = [...a].sort((x, y) => x - y); return z[Math.floor((z.length - 1) * p)]; };
const T = loadTable(process.argv[2]);
const closed = new Map();
for (const S of T.sessions) for (const tr of S.turns) {
  const e = endEpisode(S, tr);
  const r = e?.rows.find((x) => x.text && x.unseen <= 120) ?? e?.rows.at(-1);
  if (r && r.exchange === "closed_answer") closed.set(tr.id, { text: r.text, holds: tr.spans.length - 1 });
}
for (const f of process.argv.slice(3)) {
  const R = JSON.parse(fs.readFileSync(f, "utf8"));
  const per = R.perTurn.filter((p) => closed.has(p.id));
  const gaps = per.map((p) => p.gap).filter((g) => g !== null);
  const cut = per.filter((p) => p.holds.some((h) => h.cut)).length;
  console.log(f.split("/").pop(), JSON.stringify({ closedTurns: per.length, gapP50: q(gaps, 0.5), gapP90: q(gaps, 0.9), within350: gaps.filter((g) => g <= 350).length, turnsWithACutoff: cut, examples: per.slice(0, 6).map((p) => `${p.id} ${p.gap} ${closed.get(p.id).text.slice(-30)}`) }));
}
