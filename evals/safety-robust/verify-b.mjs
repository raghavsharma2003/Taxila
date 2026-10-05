// Verify B (2026-10-05): false safeguarding of the distress predicate on the verifier's adversarial class 4-7 lesson corpus
// (verify-b.data.mjs), clean and under the critic's sttReal perturbation, split by pass (1 = the shipped families, which the
// never-narrow rule protects; 2 = the safety-robust layer). Also a combinatorial slot sweep: every fuzzy shape with each
// required slot replaced, one at a time, by a vocabulary word that is NOT a spelling of the slot (what a single near-miss
// word can do to a shape) — the list of collisions is printed for a human to judge, not scored.
//
//   node evals/safety-robust/verify-b.mjs [--seeds 20] [--label name] [--sweep]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scanSafetyDetail } from "../../server/director/safety.js";
import * as C from "./corpora.mjs";
import { VERIFY_B } from "./verify-b.data.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1]; };
const SEEDS = Number(arg("seeds", 20));
const LABEL = arg("label", "verifyB");

const items = VERIFY_B.map((x, i) => ({ ...x, id: `vb${i}` }));
const clean = items.map((it) => ({ it, d: scanSafetyDetail(it.text) }));
const hits = clean.filter((x) => x.d.distress);
let pn = 0, p1 = 0, p2 = 0, p2new = 0;
const pex = [];
for (let k = 0; k < SEEDS; k++) for (const it of items) {
  const p = C.perturbedText({ ...it, segs: [it.text.split(/\s+/).filter(Boolean)] }, C.seedOf(it.id, k), { punct: false });
  pn++;
  const d = scanSafetyDetail(p.text);
  if (!d.distress) continue;
  if (d.pass === 1) p1++; else { p2++; if (scanSafetyDetail(it.text).pass !== 1) { p2new++; pex.push({ clean: it.text, text: p.text, via: d.via }); } }
}
const byCat = {};
for (const { it, d } of clean) { const c = (byCat[it.cat] ??= { n: 0, p1: 0, p2: 0 }); c.n++; if (d.pass === 1) c.p1++; if (d.pass === 2) c.p2++; }
const out = {
  label: LABEL, n: items.length, clean: { hits: hits.length, pass1: hits.filter((x) => x.d.pass === 1).length, pass2: hits.filter((x) => x.d.pass === 2).length,
    list: hits.map((x) => ({ cat: x.it.cat, probe: x.it.probe, text: x.it.text, pass: x.d.pass, via: x.d.via, kind: x.d.kind })) },
  perturbed: { seeds: SEEDS, draws: pn, pass1: p1, pass2: p2, pass2New: p2new, examples: pex.slice(0, 40) }, byCat,
};
console.log(`verify-b ${LABEL}: clean ${out.clean.hits}/${out.n} (pass1 ${out.clean.pass1}, pass2 ${out.clean.pass2}) | sttReal x${SEEDS}: pass1 ${p1}, pass2 ${p2} (new vs clean pass1: ${p2new}) / ${pn}`);
for (const h of out.clean.list) console.log(`  [p${h.pass} ${h.via}] (${h.cat}) ${h.text}`);
for (const e of pex.slice(0, 40)) console.log(`  ~[${e.via}] ${e.text}   <= ${e.clean}`);
fs.mkdirSync(path.join(HERE, "results"), { recursive: true });
fs.writeFileSync(path.join(HERE, "results", `2026-10-05-${LABEL}.json`), JSON.stringify(out, null, 2));
