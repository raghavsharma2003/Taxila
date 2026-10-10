// duplex r4: sweep candidate end-of-turn rules on the TRAIN half (even ids) of both real lanes; print TEST alongside only for
// the chosen row (pass --show-test). Real recorded adult Hindi (eot-bench, CC BY 4.0) + real STT events; not children.
//   node evals/duplex-r4/eot-sweep-r4.mjs <table-MAI> <table-D4> [--show-test]
import { loadTable, score } from "../duplex-r3/eot-policy.mjs";
import { classR3, policyOf, R3_WAIT, endShape } from "./eot-policy-r4.mjs";
import { ROOT } from "../duplex-real/lib.mjs";
const { valuesIn, normText } = await import(ROOT + "server/duplex/understand.js");

// the engine's own dictation noun list (src/duplex/markers.ts), never a copy
const { DICTATION_NOUN: DICTATION } = await import(ROOT + "src/duplex/markers.ts");
const NOUN_TAIL = /(?:नंबर|नम्बर|number|पता|address|एड्रेस|पिन|pin|कोड|code|आईडी|id|फ्लैट|flat|सेक्टर|sector|ब्लॉक|block|मकान)$/iu;

export function classR4(r, opts) {
  const base = classR3(r);
  if (base === "idk" || base === "question") return base;
  const es = endShape(r.text);
  if (es === "terminal") return base;
  const t = normText(r.text ?? "");
  const toks = t.split(" ").filter(Boolean);
  if (!DICTATION.test(t)) return base;
  if (NOUN_TAIL.test(toks.at(-1) ?? "")) return "dictation";
  const tailVals = valuesIn(r.text ?? "").filter((v) => v.at >= toks.length - 4).length;
  if (tailVals >= (opts?.minVals ?? 1)) return "dictation";
  return base;
}

const tabs = process.argv.slice(2).filter((a) => !a.startsWith("--")).map((f) => loadTable(f));
const showTest = process.argv.includes("--show-test");
const fmt = (s) => `${s.cut500}/${s.holds500} gap ${s.gapP50}/${s.gapP90}`;
const cutsOf = (s) => s.per.flatMap((p) => p.holds.filter((h) => h.ms >= 500 && h.cut).map((h) => `${p.id}:${h.ms}:${(h.cutBy?.r?.text ?? "").slice(-28)}`));
const rows = [];
for (const D of (process.env.D ? [Number(process.env.D)] : [1200, 1600, 2000, 2400, 2800])) for (const minVals of [1, 2]) for (const hold of [1600, 1800, 2000]) for (const complete of [1100, 1200, 1300]) {
  const W = { ...R3_WAIT, hold, complete, dictation: D };
  const cf = (r) => classR4(r, { minVals });
  const res = tabs.map((T) => score(T, policyOf(cf, W), "train"));
  rows.push({ D, minVals, hold, complete, train: res.map(fmt).join(" | "), cuts: res.map((s) => s.cut500), gap: res.map((s) => s.gapP50), W, cf });
}
rows.sort((a, b) => Math.max(...a.cuts) - Math.max(...b.cuts) || Math.max(...a.gap) - Math.max(...b.gap));
for (const r of rows.slice(0, 25)) console.log(`D ${r.D} minVals ${r.minVals} hold ${r.hold} complete ${r.complete}  TRAIN ${r.train}`);
const base = tabs.map((T) => score(T, policyOf(classR3, R3_WAIT), "train"));
console.log("R3 baseline TRAIN", base.map(fmt).join(" | "), base.map(cutsOf));
if (showTest) {
  const pick = rows[0];
  for (const split of ["train", "test", "all"]) { const res = tabs.map((T) => score(T, policyOf(pick.cf, pick.W), split)); console.log("PICK", split, res.map(fmt).join(" | "), JSON.stringify(res.map(cutsOf))); }
}
