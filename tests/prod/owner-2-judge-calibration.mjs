// owner-2's model judge (tests/prod/_owner.mjs modelJudge: J.confused / J.ignores_child / J.contradicts_verdict /
// J.talks_to_wrong_person) calibrated against a run a HUMAN already reviewed (round 4, stream 4A, 2026-10-10; the main
// session asked for the judge's precision on "confused" before any fix target is set).
//
// Ground truth: evals/owner-truth/results/2026-10-04T18-30-08, 18 production sessions read by a reviewer (review.json: 9
// auto flags dropped, 4 added); FAILURES.md owner item 2 ("confused / failing / repeating") rows, after that review.
// The judge sees exactly what it sees in a live run: the previous teacher turn, the child's words, the verdict, the reply.
// A judge flag on a turn the reviewer did not list is counted against precision, but it is listed for a human read: the
// reviewer read for the owner's five items, not for "confusing" as the judge defines it. No network beyond the judge.
//
//   NODE_USE_ENV_PROXY=1 node --env-file=.env.local tests/prod/owner-2-judge-calibration.mjs --judge model [--dir …] [--parallel 3]
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { modelJudge, modelJudgeOn, arg } from "./_owner.mjs";

if (!modelJudgeOn()) { console.error("needs --judge model"); process.exit(2); }
const DIR = arg("dir", "evals/owner-truth/results/2026-10-04T18-30-08");
const PAR = Number(arg("parallel", 3));
const human = new Map();   // "session#turn" → the reviewer's why
for (const line of readFileSync(join(DIR, "FAILURES.md"), "utf8").split("\n")) {
  const m = line.match(/^\| \d+ \| 2(?: \(soft\))? \| (\S+) [^|]*\| (\d+) \|(?:[^|]*\|){2}([^|]*)\|/);
  if (m) human.set(`${m[1]}#${m[2]}`, m[3].trim());
}
const jobs = [];
for (const f of readdirSync(join(DIR, "sessions")).filter((x) => x.endsWith(".json")).sort()) {
  const s = JSON.parse(readFileSync(join(DIR, "sessions", f), "utf8"));
  let prev = null;
  for (const t of s.turns) {
    if (t.who === "teacher") { prev = t; continue; }
    if (t.who !== "child" || !t.teacherReply) continue;
    jobs.push({ session: s.id, turn: t.n, previous: prev?.teacherReply ?? "", child: t.childText ?? "", reply: t.teacherReply, verdict: t.ui?.verdict ?? null });
    prev = t;
  }
}
const out = [];
for (let i = 0; i < jobs.length; i += PAR) {
  const batch = jobs.slice(i, i + PAR);
  const rs = await Promise.all(batch.map((j) => modelJudge(j)));
  batch.forEach((j, k) => out.push({ ...j, codes: rs[k].map((d) => d.code), why: rs[k].map((d) => d.why).join(" | ") }));
}
const flagged = (r, codes) => r.codes.some((c) => codes.includes(c));
const report = (label, codes) => {
  const fl = out.filter((r) => flagged(r, codes));
  const tp = fl.filter((r) => human.has(`${r.session}#${r.turn}`));
  const humanJudged = [...human.keys()].filter((k) => out.some((r) => `${r.session}#${r.turn}` === k));
  const caught = humanJudged.filter((k) => fl.some((r) => `${r.session}#${r.turn}` === k));
  console.log(`${label}: judge flags ${fl.length} of ${out.length} turns; also on the reviewer's item-2 list ${tp.length} (precision vs the list ${(100 * tp.length / Math.max(1, fl.length)).toFixed(0)}%); `
    + `the list's ${humanJudged.length} judged turns caught ${caught.length} (recall ${(100 * caught.length / Math.max(1, humanJudged.length)).toFixed(0)}%)`);
  return { flagged: fl.length, onList: tp.length, list: humanJudged.length, caught: caught.length };
};
console.log(`judge calibration on ${DIR}: ${out.length} teacher turns after a child turn; reviewer item-2 rows ${human.size}`);
const summary = { confused: report("J.confused", ["J.confused"]), confusedOrIgnores: report("J.confused or J.ignores_child", ["J.confused", "J.ignores_child"]) };
const OUTDIR = arg("out", "docs/design/round4/build/conversation/acceptance/judge-calibration");
mkdirSync(OUTDIR, { recursive: true });
writeFileSync(join(OUTDIR, "judge-calibration.json"), JSON.stringify({ dir: DIR, summary, humanList: Object.fromEntries(human), turns: out }, null, 1));
console.log(`→ ${OUTDIR}/judge-calibration.json (every disagreement listed for a human read)`);
