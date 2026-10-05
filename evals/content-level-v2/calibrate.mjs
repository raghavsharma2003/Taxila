// Writes rater-calibrated grade-equivalents into the overlay (data/kits-relevel) and the placement bank (RS-6 F1).
//   ge = mean(rater grade) - 0.5   (a rater's "class g" = the middle of class g on ability.js's GE scale)
// Overlay items: ge, geRaters {gpt6, deepseek}, tooEasy (either rater grade <= C-2). Old kit items rated in served-old get
// an entry in topic.oldGE { itemId: ge } so the F0 queue can use a measured ge instead of the difficulty proxy.
// Placement items: geRated, and anchorMismatch when BOTH raters put it more than one class from its band anchor.
//   node evals/content-level-v2/calibrate.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";

const OUT = new URL("./out/", import.meta.url);
const read = (u) => JSON.parse(readFileSync(u, "utf8"));
const R = (set, r) => { const f = new URL(`ratings-${set}-${r}.json`, OUT); return existsSync(f) ? read(f).r : {}; };
const round = (x) => Math.round(x * 100) / 100;

const RA = R("relevel", "gpt6"), RB = R("relevel", "deepseek"), OA = R("served-old", "gpt6"), OB = R("served-old", "deepseek");
const KR = new URL("../../data/kits-relevel/", import.meta.url);
let n = 0, nOld = 0;
for (const f of readdirSync(KR).filter((x) => /^c\d-[a-z]+\.json$/.test(x))) {
  const d = read(new URL(f, KR)); const C = d.class;
  for (const t of d.topics) {
    for (const it of [...t.openers, ...(t.ongrade || []), ...t.harder]) {
      const a = RA[it.id], b = RB[it.id];
      if (!a || !b) continue;
      it.ge = round((a.grade + b.grade) / 2 - 0.5);
      it.geRaters = { gpt6: a.grade, deepseek: b.grade, rubric: "v2" };
      it.tooEasy = a.grade <= C - 2 || b.grade <= C - 2;
      if (!it.demand) it.demand = a.demand;
      n++;
    }
    const oldGE = {};
    for (const id of new Set([...(t.replacesOpeners || [])])) {
      const a = OA[id], b = OB[id];
      if (a && b && !id.startsWith("diag:")) oldGE[id] = { ge: round((a.grade + b.grade) / 2 - 0.5), tooEasy: a.grade <= C - 2 || b.grade <= C - 2 };
    }
    // served-old also rated position-3 items? Only positions 1-2 were rated; anything else stays on the proxy.
    if (Object.keys(oldGE).length) { t.oldGE = oldGE; nOld += Object.keys(oldGE).length; }
  }
  writeFileSync(new URL(f, KR), JSON.stringify(d, null, 1));
}
const PA = R("placement", "gpt6"), PB = R("placement", "deepseek");
const PD = new URL("../../data/placement/", import.meta.url);
let np = 0, mism = 0;
for (const f of readdirSync(PD).filter((x) => /^c\d-[a-z]+\.json$/.test(x))) {
  const d = read(new URL(f, PD));
  for (const it of d.items) {
    const a = PA[it.id], b = PB[it.id];
    if (!a || !b) continue;
    it.geRated = round((a.grade + b.grade) / 2 - 0.5);
    it.geRaters = { gpt6: a.grade, deepseek: b.grade, rubric: "v2" };
    const off = (g) => Math.abs(g - 0.5 - it.ge);
    it.anchorMismatch = off(a.grade) > 1 && off(b.grade) > 1;
    if (it.anchorMismatch) mism++;
    np++;
  }
  writeFileSync(new URL(f, PD), JSON.stringify(d, null, 1));
}
console.log(`overlay items calibrated ${n}; old items with measured ge ${nOld}; placement calibrated ${np}, anchor mismatches ${mism}`);
