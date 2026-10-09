// duplex r3: the shadow → live switch criteria (docs/design/round2/duplex-real/CRITERIA.md, unchanged bars) scored on the
// round-3 result files, BEFORE (the round-2 engine at HEAD, replayed this round on the same recorded STT events) and AFTER
// (this tree). Reuses evals/duplex-real/criteria.mjs; every row is REAL-ADULT unless it says otherwise.
//   node evals/duplex-r3/criteria.mjs [--which before|after] [--json out.json]
import fs from "node:fs";
import path from "node:path";
import { criteria } from "../duplex-real/criteria.mjs";

const RES = path.join(path.dirname(new URL(import.meta.url).pathname), "../duplex-real/results");
const read = (f) => { const p = path.join(RES, f); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null; };

export const FILES = {
  before: { e1: "r3-base-MAI.json", e1d4: "r3-base-D4.json", e2: "r3-base-ami.json" },
  after: { e1: "r3-after-MAI.json", e1d4: "r3-after-D4.json", e2: "r3-ami-after2.json" },
};

/** The rows for one arm (default: after, falling back to before for a file that does not exist yet). */
export function r3criteria(which = "after") {
  const f = FILES[which];
  const rows = criteria({ e1: read(f.e1), e1d4: read(f.e1d4), e2: read(f.e2), shadow: null });
  return rows.map((r) => ({ ...r, arm: which }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
  const arms = opt("--which", null) ? [opt("--which")] : ["before", "after"];
  const all = [];
  for (const a of arms) {
    const rows = r3criteria(a);
    all.push(...rows);
    console.log(`\n== ${a} ==`);
    for (const r of rows) console.log(`${r.pass === null ? "NO VERDICT" : r.pass ? "PASS" : "FAIL"}  ${r.id.padEnd(6)} ${typeof r.value === "number" && r.value > 0 && r.value < 1 ? `${(100 * r.value).toFixed(1)} %` : r.value} (n ${r.n}${r.ci95 ? `, CI ${r.ci95.map((x) => (100 * x).toFixed(1)).join("-")}` : ""}) bar ${r.bar} [${r.src}]`);
  }
  if (opt("--json", null)) fs.writeFileSync(opt("--json"), JSON.stringify(all, null, 1));
}
