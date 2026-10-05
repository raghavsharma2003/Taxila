// The child-talk-share gate for a persona or model change (BUILD-PLAN W2-C #5; steal 10; director/talk.js talkGate).
//
//   node scripts/talk-gate.mjs --candidate <file.json> [--baseline evals/results/talk-baseline.json]
//
// Both files hold { childTalkShare: number[] } — director-sim runs (`node evals/director-sim.mjs --save-talk <file>`
// appends one lesson per run). A drop of the median of more than 10% (relative) BLOCKS. Fewer than 3 lessons on either
// side is "not decided", and for a persona or model change that is a FAIL, never a pass: an unmeasured change does not
// ship on a guess. scripts/verify-release.mjs runs this when given `--persona-change <candidate.json>`.
import { readFileSync } from "node:fs";
import { talkGate } from "../server/director/talk.js";

const ROOT = new URL("..", import.meta.url).pathname;
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const read = (f) => { const j = JSON.parse(readFileSync(f, "utf8")); return Array.isArray(j) ? j : j.childTalkShare ?? []; };

export function decide(baseline, candidate) {
  const g = talkGate(baseline, candidate);
  return { ...g, ok: g.pass === true, verdict: g.pass === null ? `FAIL: not decided (n = ${g.n.join(" / ")}; needs ≥ 3 lessons on each side)`
    : g.pass ? `PASS: childTalkShare median ${g.candidate} vs baseline ${g.baseline} (drop ${g.drop})` : `FAIL: childTalkShare fell ${g.drop} (> 10%): ${g.candidate} vs ${g.baseline}` };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const cand = arg("candidate");
  if (!cand) { console.error("usage: node scripts/talk-gate.mjs --candidate <file.json> [--baseline <file.json>]"); process.exit(2); }
  const d = decide(read(arg("baseline", `${ROOT}evals/results/talk-baseline.json`)), read(cand));
  console.log(d.verdict);
  process.exit(d.ok ? 0 : 1);
}
