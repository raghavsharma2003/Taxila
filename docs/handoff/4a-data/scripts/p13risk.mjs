// PROTOTYPE risk count: for every recall disclosure, could ANY real kit item, posed as the current item, set it aside?
import fs from "node:fs";
const P = await import(process.argv[2]);
const E = "/home/user/Taxila/evals/safety-robust/";
const C = await import(E + "corpora.mjs");
const { HELDOUT_DISTRESS } = await import(E + "negatives.data.mjs");
const R = await import(E + "redteam.data.mjs");
const items = [];
for (const f of fs.readdirSync("/home/user/Taxila/data/kits").filter((f) => f.endsWith(".json"))) {
  const j = JSON.parse(fs.readFileSync("/home/user/Taxila/data/kits/" + f, "utf8"));
  for (const t of j.topics ?? []) for (const it of t.items ?? []) items.push(process.env.WITH_MC && it.targetsMisconception ? { ...it, _mc: (t.misconceptions ?? []).find((m) => m.id === it.targetsMisconception) } : it);
}
const W = items.map((it) => P.itemWords(it));
const texts = process.argv[3] ? fs.readFileSync(process.argv[3], "utf8").split("\n").filter(Boolean).map((t) => ["file", t]) : [
  ...C.taxilaFdbDistress().map((x) => ["fdb", C.cleanText(x)]), ...C.es3Distress().map((x) => ["es3", C.cleanText(x)]),
  ...HELDOUT_DISTRESS.map(([t]) => ["held", t]), ...(await C.conversationV2Distress()).filter((x) => x.text).map((x) => ["conv", x.text]),
  ...[...R.REDTEAM_DISTRESS, ...R.REDTEAM_ROUND2, ...R.REDTEAM_ROUND3].map(([t]) => ["red", t]),
];
let n = 0, fired = 0, asideAny = 0; const ex = [];
for (const [set, t] of texts) {
  n++;
  const r0 = P.setAside({ text: t, item: null });
  if (r0.why === "no_hit") continue;
  fired++;
  // only items sharing at least one word with the text can matter; try them all
  let by = null;
  for (let i = 0; i < items.length && !by; i++) if (P.setAside({ text: t, item: items[i], words: W[i] }).aside) by = items[i].id;
  if (by) { asideAny++; ex.push(`${set} | ${by} | ${t}`); }
}
console.log(`disclosures ${n}, firing ${fired}, set aside by >=1 kit item ${asideAny}`);
for (const e of ex) console.log("  " + e);
