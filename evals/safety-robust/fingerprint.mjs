// Per-draw fingerprint of the distress predicate (2026-10-05, Day-0 guard frames for the ORIGINAL families,
// decision safety-old-pattern-false-alarms-guarded-2026-10-05). Every distress item of every recall set is scanned clean,
// clean without punctuation, on the 20 report seeds (0..19) and the 20 dev seeds (1000..1019) exactly as run.mjs draws them;
// the result is one bit (+ kind) per draw. Two fingerprints are compared draw by draw: a guard may change NO recall draw.
//
//   node evals/safety-robust/fingerprint.mjs --out file.json          write the fingerprint of the current tree
//   node evals/safety-robust/fingerprint.mjs --diff before.json after.json
import fs from "node:fs";
import { scanSafetyDetail } from "../../server/director/safety.js";
import * as C from "./corpora.mjs";
import { HELDOUT_DISTRESS } from "./negatives.data.mjs";
import { REDTEAM_DISTRESS, REDTEAM_ROUND2, REDTEAM_ROUND3 } from "./redteam.data.mjs";

const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? null : process.argv[i + 1]; };

if (arg("diff")) {
  const a = JSON.parse(fs.readFileSync(arg("diff"), "utf8"));
  const b = JSON.parse(fs.readFileSync(process.argv[process.argv.indexOf("--diff") + 2], "utf8"));
  let lost = 0, gained = 0, kind = 0, n = 0;
  const ex = [];
  for (const [k, v] of Object.entries(a.draws)) {
    n++;
    const w = b.draws[k];
    if (v[0] && !w?.[0]) { lost++; if (ex.length < 40) ex.push(["LOST", k, v, w]); }
    else if (!v[0] && w?.[0]) { gained++; if (ex.length < 40) ex.push(["GAINED", k, v, w]); }
    else if (v[0] && w[1] !== v[1]) kind++;
  }
  console.log(`draws ${n}: lost ${lost}, gained ${gained}, kind changed ${kind}`);
  for (const e of ex) console.log("  ", JSON.stringify(e));
  process.exit(lost ? 1 : 0);
}

const sets = {
  taxilafdb_84: C.taxilaFdbDistress(),
  es3_80: C.es3Distress(),
  heldout_40: HELDOUT_DISTRESS.map(([text, kind], i) => ({ id: `held${i}`, segs: [text.split(/\s+/)], text, kind })),
  conversation_v2: (await C.conversationV2Distress()).filter((x) => x.text).map((x) => ({ ...x, segs: [x.text.split(/\s+/)] })),
  redteam_225: [...REDTEAM_DISTRESS, ...REDTEAM_ROUND2, ...REDTEAM_ROUND3].map(([text, kind], i) => ({ id: `red${i}`, segs: [text.split(/\s+/)], text, kind })),
};
const draws = {};
const bit = (t) => { const d = scanSafetyDetail(t); return [d.distress ? 1 : 0, d.kind]; };
const seeds = [...Array(20).keys(), ...Array.from({ length: 20 }, (_, k) => 1000 + k)];
for (const [name, items] of Object.entries(sets)) {
  for (const it of items) {
    draws[`${name}|${it.id}|clean`] = bit(C.cleanText(it));
    draws[`${name}|${it.id}|nopunct`] = bit(C.cleanText(it, { punct: false }));
    for (const k of seeds) draws[`${name}|${it.id}|s${k}`] = bit(C.perturbedText(it, C.seedOf(it.id, k)).text);
  }
}
const out = arg("out") ?? "/dev/stdout";
fs.writeFileSync(out, JSON.stringify({ date: "2026-10-05", n: Object.keys(draws).length, hits: Object.values(draws).filter((v) => v[0]).length, draws }));
console.error(`fingerprint: ${Object.keys(draws).length} draws, ${Object.values(draws).filter((v) => v[0]).length} distress`);
