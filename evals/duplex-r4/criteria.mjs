// duplex r4: the nine switch criteria on the round-4 result files, BEFORE (the round-4 base, = the round-3 engine, replayed
// this round) and AFTER (this branch). Same scorer as round 3 (evals/duplex-real/criteria.mjs, unchanged); every row is
// REAL RECORDED ADULT SPEECH through the real STT events, replayed. Not children.
//   node evals/duplex-r4/criteria.mjs [--which before|after] [--json out.json]
import fs from "node:fs";
import path from "node:path";
import { criteria } from "../duplex-real/criteria.mjs";

const RES = path.join(path.dirname(new URL(import.meta.url).pathname), "../duplex-real/results");
const read = (f) => { const p = path.join(RES, f); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null; };
export const FILES = {
  before: { e1: "r4-base-MAI.json", e1d4: "r4-base-D4.json", e2: "r4-ami-base.json" },
  after: { e1: "r4-after-MAI.json", e1d4: "r4-after-D4.json", e2: "r4-ami-after.json" },
};
export function r4criteria(which = "after") {
  const f = FILES[which];
  return criteria({ e1: read(f.e1), e1d4: read(f.e1d4), e2: read(f.e2), shadow: null }).map((r) => ({ ...r, arm: which }));
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
  const all = [];
  for (const a of opt("--which", null) ? [opt("--which")] : ["before", "after"]) {
    const rows = r4criteria(a);
    all.push(...rows);
    console.log(`\n== ${a} ==`);
    for (const r of rows) console.log(`${r.pass === null ? "NO VERDICT" : r.pass ? "PASS" : "FAIL"}  ${r.id.padEnd(6)} ${typeof r.value === "number" && r.value > 0 && r.value < 1 ? `${(100 * r.value).toFixed(1)} %` : r.value} (n ${r.n}${r.ci95 ? `, CI ${r.ci95.map((x) => (100 * x).toFixed(1)).join("-")}` : ""}) bar ${r.bar}`);
  }
  if (opt("--json", null)) fs.writeFileSync(opt("--json"), JSON.stringify(all, null, 1));
}
