// the constructed sets of falsecredit.mjs through the FULL classifier (model included); every 3rd wrong form, every 3rd contra form
import fs from "node:fs";
import { classify } from "/home/user/Taxila/server/director/classify.js";
console.info = () => {}; console.warn = () => {};
const { sets } = await import("./fcsets.mjs");
const out = {};
for (const [name, set] of Object.entries(sets)) {
  let i = 0; const res = [];
  await Promise.all(Array.from({ length: 8 }, async () => { while (i < set.length) { const x = set[i++];
    const r = await classify({ target: x.target, childText: x.text, asrConfidence: 1, typed: true, lang: "hinglish", kit: x.kit }).catch(() => ({ outcome: "err" }));
    res.push({ id: x.id, text: x.text, outcome: r.outcome, path: `${r.source}${r.corroboration ? ":" + r.corroboration : ""}` }); } }));
  const cred = res.filter((r) => r.outcome === "correct"); const by = {}; for (const c of cred) by[c.path] = (by[c.path] ?? 0) + 1;
  console.log(`${name}: ${res.length} forms, CREDITED ${cred.length}`, JSON.stringify(by));
  for (const c of cred) console.log("    ", c.path, "|", c.id, "|", c.text.slice(0, 150));
  out[name] = res;
}
fs.writeFileSync("fcmodel.json", JSON.stringify(out, null, 1));
