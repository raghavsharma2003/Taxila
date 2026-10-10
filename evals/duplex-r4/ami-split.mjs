// duplex r4: the AMI overlap rows (R3-R6) by split from an ami-overlap.mjs per-meeting tmp dir. TRAIN = IS1008b + ES2004b
// (the meetings round 3 ablated on; round-4 changes are chosen there), TEST = ES2005b + IS1004b (held out). Real recorded
// adult speech (AMI, CC BY 4.0, evaluation only) + real STT events; not children.
//   node evals/duplex-r4/ami-split.mjs <tmp_dir> [<tmp_dir> ...]
import fs from "node:fs";
import path from "node:path";
import { summarize } from "../duplex-r3/ami-overlap.mjs";

export const AMI_SPLIT = { train: ["ES2004b", "IS1008b"], test: ["ES2005b", "IS1004b"] };
AMI_SPLIT.all = [...AMI_SPLIT.train, ...AMI_SPLIT.test];
const pct = (r) => `${r.k}/${r.n} = ${(100 * r.rate).toFixed(1)}% [${r.ci95.map((x) => (100 * x).toFixed(1)).join("-")}]`;
export function bySplit(dir) {
  const out = {};
  for (const [k, ms] of Object.entries(AMI_SPLIT)) {
    const parts = ms.filter((m) => fs.existsSync(path.join(dir, `${m}.json`))).map((m) => JSON.parse(fs.readFileSync(path.join(dir, `${m}.json`), "utf8")));
    if (parts.length !== ms.length) continue;
    const s = summarize(parts, {});
    out[k] = { R3: pct(s.continuer_keepTalking), R4: `${s.bargeIn_stop.within200}/${s.bargeIn_stop.n} (stopped ${s.bargeIn_stop.stopped}, p50 ${s.bargeIn_stop.p50})`, R5: pct(s.roomTalk_falseYield), R6: pct(s.echo_selfYield), contHushed: pct(s.continuer_hushed), roomHushed: pct(s.roomTalk_hushed) };
  }
  return out;
}
if (import.meta.url === `file://${process.argv[1]}`) for (const d of process.argv.slice(2)) { console.log("==", d.split("/").pop()); for (const [k, v] of Object.entries(bySplit(d))) console.log(k.padEnd(5), JSON.stringify(v)); }
