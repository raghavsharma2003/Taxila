import fs from "node:fs";
import { earnedRead } from "/home/user/Taxila/server/agent/agent.js";
const dir = process.argv[2] + "/evals/simlab/results/r5-agent-gate-7740135/records/";
const DEEP = new Set(["contrast", "near_transfer", "far_transfer", "error_spot", "predict", "why", "teachback", "translate_rep"]);
const rules = {
  stored: (v) => v?.read ?? null,
  evidenceOnly: (v) => (v?.graded?.length ? earnedRead("understood", v.graded) : v?.read ?? null),
  evidenceOr1Deep: (v) => {
    const g = v?.graded ?? [];
    if (!g.length) return v?.read ?? null;
    const e = earnedRead("understood", g);
    if (e === "understood") return e;
    const right = g.filter((x) => x.g === "correct"), last = g.map((x) => x.g).lastIndexOf("correct");
    if (right.some((x) => DEEP.has(x.kind)) && !g.slice(last + 1).some((x) => x.g !== "correct") && !g.some((x) => x.g !== "correct")) return "understood";
    return e;
  },
  maxModelEvidence: (v) => { const e = v?.graded?.length ? earnedRead("understood", v.graded) : null; return e === "understood" ? e : v?.read ?? e; },
};
for (const [name, fn] of Object.entries(rules)) {
  let n = 0, right = 0, over = 0, under = 0;
  const rank = { not: 0, partly: 1, understood: 2 };
  for (const f of fs.readdirSync(dir).filter((x) => /agent_gpt6/.test(x))) {
    const r = JSON.parse(fs.readFileSync(dir + f, "utf8"));
    const L = r.lane2?.agent?.learner ?? {};
    for (const [sk, t] of Object.entries(r.state ?? {})) {
      const read = fn(L[sk]);
      if (!read || !(read in rank) || !(t in rank)) continue;
      n++; if (read === t) right++; else if (rank[read] > rank[t]) over++; else under++;
    }
  }
  console.log(name.padEnd(18), "n", n, "right", right, `(${Math.round(100 * right / n)}%)`, "over", over, "under", under);
}
