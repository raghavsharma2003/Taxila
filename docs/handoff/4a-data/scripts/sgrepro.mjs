// reproduce: does the classifier's model distress read or the UNDERSTAND note flag distress on re-explain requests?
import { classify } from "/home/user/Taxila/server/director/classify.js";
import { understand } from "/home/user/Taxila/server/conversation/understand.js";
const N = Number(process.argv[2] ?? 20);
const LINES = ["explain it differently", "samjhao alag tarike se", "phir se samjhao", "explain again", "I don't get it, explain differently"];
const target = { mode: "item", key: "2/3", also: [], misconceptions: [], item: { prompt_en: "Which fraction is bigger, 2/5 or 2/3?" } };
for (const said of LINES) {
  let cd = 0, nd = 0, ne = 0, kinds = {};
  const runs = Array.from({ length: N }, async () => {
    const r = await classify({ target, childText: said, typed: true, classLevel: 5, heard: "2/5 aur 2/3 mein kaunsa bada hai?" });
    if (r.flags?.distress) { cd++; kinds[r.flags.distressKind] = (kinds[r.flags.distressKind] ?? 0) + 1; }
    const n = await understand({ cls: 5, topicTitle: "Comparing fractions", phase: "practice", teacherLast: "2/5 aur 2/3 mein kaunsa bada hai?", ask: "Which fraction is bigger, 2/5 or 2/3?", said });
    if (!n) ne++; else if (n.distress) nd++;
  });
  for (let i = 0; i < runs.length; i += 4) await Promise.all(runs.slice(i, i + 4));
  console.log(`${JSON.stringify(said)}: classify distress ${cd}/${N} ${JSON.stringify(kinds)} | note distress ${nd}/${N - ne} (note unavailable ${ne})`);
}
