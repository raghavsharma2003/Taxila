import fs from "node:fs";
import { numberPhrases, spokenNumber } from "/home/user/Taxila/server/grading/spoken-number.js";
const { cases } = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const val = (s) => { const [a, b] = s.split("/"); return b ? +a / +b : +a; };
let ok = 0;
for (const c of cases) {
  const want = c.values.map(val);
  const got = numberPhrases(c.text, { split: true }) ?? null;
  const same = got && got.length === want.length && got.every((v, i) => Math.abs(v - want[i]) < 1e-9);
  if (same) ok++; else console.log("DIFF", JSON.stringify(c.text), "got", JSON.stringify(got), "want", JSON.stringify(want), "| one:", spokenNumber(c.text));
}
console.log(`${ok}/${cases.length}`);
