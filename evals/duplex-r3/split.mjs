// duplex r3: re-aggregate an eot-replay / eot.mjs result file by split (train = even row ids, test = odd), so the number the
// parameters were chosen on (TRAIN) and the held-out number (TEST) are reported side by side, from the REAL engine run.
//   node evals/duplex-r3/split.mjs <result.json> [...]
import fs from "node:fs";
import { aggregate } from "../duplex-real/eot.mjs";
const inSplit = (id, split) => split === "all" || (parseInt(id.replace(/\D/g, ""), 10) % 2 === 0) === (split === "train");
export function bySplit(res) {
  const out = {};
  for (const split of ["train", "test", "all"]) {
    const a = aggregate(res.perTurn.filter((p) => inSplit(p.id, split)));
    out[split] = { turns: a.turns, cut500: a.pauseCutoff_500, cutAll: a.pauseCutoff_all100, s900: a.silence900_500, inSpeech: a.inSpeechCommits, gap: a.decisionGap };
  }
  return out;
}
if (import.meta.url === `file://${process.argv[1]}`) {
  for (const f of process.argv.slice(2)) {
    const r = JSON.parse(fs.readFileSync(f, "utf8"));
    const s = bySplit(r);
    for (const [k, v] of Object.entries(s)) console.log(f.split("/").pop().padEnd(28), k.padEnd(5), `cut500 ${v.cut500.k}/${v.cut500.n} = ${(100 * v.cut500.rate).toFixed(1)}% [${v.cut500.ci95.map((x) => (100 * x).toFixed(1)).join("-")}]`, `cutAll ${v.cutAll.k}/${v.cutAll.n}`, `s900 ${v.s900.k}`, `inSpeech ${v.inSpeech}`, `gap p50/p90 ${v.gap.p50}/${v.gap.p90} missed ${v.gap.missed} <=350 ${v.gap.within350}`);
  }
}
