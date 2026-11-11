// for each LOST draw key in a diff of two fingerprints, print the draw's text and its first canonical reading in both trees
import fs from "node:fs";
const [fa, fb, treeB] = process.argv.slice(2);
const A = JSON.parse(fs.readFileSync(fa, "utf8")).draws, B = JSON.parse(fs.readFileSync(fb, "utf8")).draws;
const E = "/home/user/Taxila/evals/safety-robust/";
const C = await import(E + "corpora.mjs");
const { HELDOUT_DISTRESS } = await import(E + "negatives.data.mjs");
const R = await import(E + "redteam.data.mjs");
const LA = await import("/home/user/Taxila/server/safety/lexicon.js"), LB = await import(treeB + "/server/safety/lexicon.js");
const sets = {
  taxilafdb_84: C.taxilaFdbDistress(), es3_80: C.es3Distress(),
  heldout_40: HELDOUT_DISTRESS.map(([text, kind], i) => ({ id: `held${i}`, segs: [text.split(/\s+/)], text, kind })),
  conversation_v2: (await C.conversationV2Distress()).filter((x) => x.text).map((x) => ({ ...x, segs: [x.text.split(/\s+/)] })),
  redteam_225: [...R.REDTEAM_DISTRESS, ...R.REDTEAM_ROUND2, ...R.REDTEAM_ROUND3].map(([text, kind], i) => ({ id: `red${i}`, segs: [text.split(/\s+/)], text, kind })),
};
for (const [k, v] of Object.entries(A)) {
  if (!(v[0] && !B[k]?.[0])) continue;
  const [name, id, d] = k.split("|"); const it = sets[name].find((x) => x.id === id);
  const t = d === "clean" ? C.cleanText(it) : d === "nopunct" ? C.cleanText(it, { punct: false }) : C.perturbedText(it, C.seedOf(it.id, +d.slice(1))).text;
  const a = LA.canonicalReading(t), b = LB.canonicalReading(t);
  const aw = a.split(" "), bw = b.split(" ");
  console.log(k, "|", t, "\n   A:", a, "\n   B:", b, "\n   diff:", aw.map((w, i) => w !== bw[i] ? `${w}->${bw[i]}` : null).filter(Boolean).join(" "));
}
