// Patch 13 (item-context set-aside, server/director/itemSetAside.js): the risk cross product the main safety review asked for.
// Every recall disclosure (TaxilaFDB, ES-3, held-out, conversation-v2, red team) is tried with EVERY verified kit item as the
// current posed item; a disclosure that ANY item would set aside is a failure. Optionally a lines file (tests, near-misses,
// kit strings) the same way, reported rather than failed (kit content of the item itself is the set-aside's purpose).
//
//   node evals/conversation-r4/setaside-risk.mjs                       full: 438 firing disclosures x 12,398 items (~60 s)
//   node evals/conversation-r4/setaside-risk.mjs --sample 40 --seed 7  CI: 40 disclosures x every item
//   node evals/conversation-r4/setaside-risk.mjs --lines file.txt      report a lines file instead
// Exit 1 when a recall disclosure would be set aside.
import fs from "node:fs";
import { itemSetAside, itemWords } from "../../server/director/itemSetAside.js";
import * as C from "../safety-robust/corpora.mjs";
import { HELDOUT_DISTRESS } from "../safety-robust/negatives.data.mjs";
import { REDTEAM_DISTRESS, REDTEAM_ROUND2, REDTEAM_ROUND3 } from "../safety-robust/redteam.data.mjs";

const arg = (k, d = null) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1]; };
const items = [];
for (const f of fs.readdirSync("data/kits").filter((f) => f.endsWith(".json"))) {
  const j = JSON.parse(fs.readFileSync(`data/kits/${f}`, "utf8"));
  for (const t of j.topics ?? []) for (const it of t.items ?? []) if (it.verified?.agrees === true) { itemWords(it); items.push(it); }
}
const lines = arg("lines");
let texts = lines ? fs.readFileSync(lines, "utf8").split("\n").filter(Boolean).map((t) => ["file", t]) : [
  ...C.taxilaFdbDistress().map((x) => ["fdb", C.cleanText(x)]), ...C.es3Distress().map((x) => ["es3", C.cleanText(x)]),
  ...HELDOUT_DISTRESS.map(([t]) => ["held", t]), ...(await C.conversationV2Distress()).filter((x) => x.text).map((x) => ["conv", x.text]),
  ...[...REDTEAM_DISTRESS, ...REDTEAM_ROUND2, ...REDTEAM_ROUND3].map(([t]) => ["red", t]),
];
const sample = Number(arg("sample", 0));
if (sample > 0) {
  let s = Number(arg("seed", 7));
  const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  texts = texts.map((x) => [rnd(), x]).sort((a, b) => a[0] - b[0]).slice(0, sample).map(([, x]) => x);
}
let firing = 0, setAside = 0;
const ex = [];
for (const [set, t] of texts) {
  if (itemSetAside({ text: t, item: null, posed: false }).why === "no_hit") continue;
  firing++;
  const by = items.find((it) => itemSetAside({ text: t, item: it, posed: true }).aside);
  if (by) { setAside++; ex.push(`${set} | ${by.id} | ${t}`); }
}
console.log(`set-aside risk: ${texts.length} lines, ${firing} firing, ${items.length} verified items; set aside by >= 1 item: ${setAside}`);
for (const e of ex) console.log(`  ${e}`);
process.exit(!lines && setAside ? 1 : 0);
