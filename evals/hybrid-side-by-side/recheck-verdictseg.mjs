// Offline recheck of gate.v6.verdictSeg on a finished run (no model calls): main, director11. The corrected verdictMisplaced
// (checks.mjs) adds two exemptions — Brain's bare-verdict rule (under 6 words, no digit) and the answered card's authored
// answerBoard — so it can only clear flags; this re-tests each flagged row with the run's own scripts and rows.
//   node evals/hybrid-side-by-side/recheck-verdictseg.mjs evals/hybrid-side-by-side/results/<run>
import { readFileSync, readdirSync } from "node:fs";
import { verdictMisplaced } from "./checks.mjs";

const dir = process.argv[2];
const scripts = Object.fromEntries(readdirSync(`${dir}/scripts`).map((f) => { const j = JSON.parse(readFileSync(`${dir}/scripts/${f}`, "utf8")); return [j.topicId, j]; }));
/** A scripted card id (script:<skill>:ask:<beat> | script:<skill>:<checkId> | script:<skill>:then:<targets>) → its answerBoard. */
const answerBoardOf = (topicId, itemId) => {
  const m = /^script:([^:]+):(.+)$/.exec(String(itemId ?? ""));
  const sk = m && scripts[topicId]?.skills?.find((s) => s.skillId === m[1]);
  if (!sk) return null;
  const rest = m[2];
  if (rest.startsWith("ask:")) { const b = rest.slice(4); return (b === "worked" ? sk.workedExample?.yourStep : sk.explain?.find((x) => x.id === b)?.ask)?.answerBoard ?? null; }
  if (rest.startsWith("then:")) return sk.remediation?.find((r) => r.targets === rest.slice(5))?.then?.answerBoard ?? null;
  return sk.checks?.find((c) => c.id === rest)?.answerBoard ?? null;
};
const firstSentence = (t) => (String(t ?? "").match(/^[^.!?]+[.!?]/) ?? [String(t ?? "")])[0];
const out = { flagged: 0, cleared: 0, clearedBare: 0, clearedAnswerBoard: 0, kept: 0, contradictions: 0, perTopic: {} };
for (const f of readdirSync(dir).filter((x) => /^(steady|offtopic|stuck|steering)-.*\.json$/.test(x))) {
  const j = JSON.parse(readFileSync(`${dir}/${f}`, "utf8"));
  const topic = f.replace(/^[a-z]+-/, "").replace(".json", "");
  const pt = (out.perTopic[topic] ??= { contradictions: 0, verdictSeg: 0 });
  let prevCard = null;
  for (const r of j.director ?? []) {
    if (r.who !== "teacher") continue;
    let c = r.gate?.contradictions ?? 0;
    if (r.gate?.v6?.verdictSeg) {
      out.flagged++;
      const firstBoard = r.segments?.[0]?.board ?? r.boardRef ?? null;
      const verdict = firstSentence(r.text);
      // (answeredBoard: the original check found the first board was not the live card's; stand-in that keeps that result)
      const answeredBoard = { template: "\u0000answered", params: {} };
      const answerBoard = answerBoardOf(j.topicId, prevCard);
      const still = verdictMisplaced({ graded: true, verdict, firstBoard: firstBoard ?? { template: "\u0000none", params: {} }, answeredBoard, answerBoard });
      if (still) { out.kept++; pt.verdictSeg++; }
      else { out.cleared++; c -= 1; if (!/\d/.test(verdict) && verdict.split(/\s+/).filter(Boolean).length < 6) out.clearedBare++; else out.clearedAnswerBoard++; }
    }
    out.contradictions += c; pt.contradictions += c;
    prevCard = r.check?.itemId ?? null;
  }
}
console.log(JSON.stringify(out, null, 1));
