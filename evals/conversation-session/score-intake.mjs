// Scores the session-first intake (server/director/session/{intake,candidates}.js) and today's router (server/lesson/purpose.js
// matchTopic, the research probe's baseline) on an intake set. Deterministic: no model, no network, no DB.
//   node evals/conversation-session/score-intake.mjs [--set dev|heldout] [--verbose]
// A row is RIGHT when the pick lands in gold (or gold is [null] and nothing is claimed), a MISS when a gold topic exists and
// nothing is claimed, WRONG otherwise. For the new path a claim is either a silent pick (p >= 0.6) or a two-way "which
// one?" whose two options include gold (counted separately: "asked"), so a guess is never scored as a pick.
import { intakeParse } from "../../server/director/session/intake.js";
import { intakeCandidates } from "../../server/director/session/candidates.js";
import { CONFIRM_MIN_P } from "../../server/director/session/flags.js";
import { matchTopic } from "../../server/lesson/purpose.js";

const argv = process.argv.slice(2);
const set = argv.includes("--set") ? argv[argv.indexOf("--set") + 1] : "dev";
const verbose = argv.includes("--verbose");
const rows = set === "heldout" ? (await import("./heldout-intake.mjs")).HELDOUT : (await import("./dev-intake.mjs")).DEV;

const inGold = (id, gold) => !!id && gold.some((g) => g && id.startsWith(g));
const nullOk = (gold) => gold.includes(null);
const out = { set, n: rows.length, old: { right: 0, wrong: 0, miss: 0 }, now: { right: 0, rightPick: 0, rightAsk: 0, wrong: 0, miss: 0 }, kind: { right: 0 }, byKind: {}, rows: [] };
for (const r of rows) {
  const m = matchTopic(r.text, r.cls)?.topicId ?? null;
  const oldOk = m ? inGold(m, r.gold) : nullOk(r.gold);
  out.old[oldOk ? "right" : m ? "wrong" : "miss"]++;
  const frame = intakeParse(r.text);
  const c = intakeCandidates(frame, r.text, { classLevel: r.cls });
  const pick = !c.abstain && c.top && c.p >= CONFIRM_MIN_P ? c.top.topicId : null;
  const ask = !pick && c.ask ? c.ask.map((x) => x.topicId) : null;
  let verdict;
  if (pick) verdict = inGold(pick, r.gold) ? "rightPick" : nullOk(r.gold) && r.gold.length > 1 ? "rightPick" : "wrong";
  else if (ask) verdict = ask.some((id) => inGold(id, r.gold)) ? "rightAsk" : nullOk(r.gold) ? "rightAsk" : "wrong";
  else verdict = nullOk(r.gold) ? "rightPick" : "miss";
  if (verdict.startsWith("right")) { out.now.right++; out.now[verdict]++; } else out.now[verdict]++;
  const kindOk = frame.kind === r.kind;
  if (kindOk) out.kind.right++;
  (out.byKind[r.kind] ??= { n: 0, kindRight: 0, topicRight: 0 }).n++;
  if (kindOk) out.byKind[r.kind].kindRight++;
  if (verdict.startsWith("right")) out.byKind[r.kind].topicRight++;
  out.rows.push({ id: r.id, cls: r.cls, text: r.text, gold: r.gold, kind: r.kind, got: frame.kind, subject: frame.subject, pick, p: Number(c.p?.toFixed?.(2) ?? 0), ask, verdict, old: m, oldOk });
}
console.log(`set ${set}, n = ${out.n}`);
console.log(`today's router (matchTopic): right ${out.old.right}/${out.n}, wrong ${out.old.wrong}, miss ${out.old.miss}`);
console.log(`session intake: right ${out.now.right}/${out.n} (silent pick or nothing claimed ${out.now.rightPick}, two-way ask holding gold ${out.now.rightAsk}), wrong ${out.now.wrong}, miss ${out.now.miss}`);
console.log(`intake kind: ${out.kind.right}/${out.n}`);
for (const [k, v] of Object.entries(out.byKind)) console.log(`  ${k.padEnd(15)} n ${v.n}  kind ${v.kindRight}/${v.n}  topic ${v.topicRight}/${v.n}`);
if (verbose) for (const r of out.rows) if (!r.verdict.startsWith("right") || r.got !== r.kind) console.log(`${r.verdict.padEnd(9)} ${r.id} c${r.cls} [${r.kind}→${r.got}] ${r.text} | pick ${r.pick} p ${r.p} ask ${r.ask} | gold ${r.gold}`);
if (argv.includes("--json")) console.log(JSON.stringify(out));
export default out;
