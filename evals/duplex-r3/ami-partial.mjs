// duplex r3: re-summarize an ami-overlap run's per-meeting parts for a subset of meetings (ablations run on 2 meetings are
// compared with the full run's same 2 meetings).
//   node evals/duplex-r3/ami-partial.mjs <tmp dir of a run> IS1008b,ES2004b
import fs from "node:fs";
import path from "node:path";
import { summarize } from "./ami-overlap.mjs";
const [dir, ms] = process.argv.slice(2);
const parts = ms.split(",").map((m) => JSON.parse(fs.readFileSync(path.join(dir, `${m}.json`), "utf8")));
const { detail, ...s } = summarize(parts, { dir: path.basename(dir), meetings: ms });
console.log(JSON.stringify({ meetings: ms, pairs: s.pairs, cont: `${s.continuer_keepTalking.k}/${s.continuer_keepTalking.n}`, contHushed: s.continuer_hushed.k, barge200: `${s.bargeIn_stop.within200}/${s.bargeIn_stop.n}`, stopped: s.bargeIn_stop.stopped, room: `${s.roomTalk_falseYield.k}/${s.roomTalk_falseYield.n}`, roomHushed: s.roomTalk_hushed.k, echo: `${s.echo_selfYield.k}/${s.echo_selfYield.n}`, contFail: s.continuer_failure_reasons }));
