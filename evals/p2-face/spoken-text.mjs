// Give every saved product segment the text Diya actually SPOKE (server/voice/spoken.js speakable(): digits and notation
// to Hinglish number words, the same last step the server runs before any voice), so the forced alignment
// (ctc-product.py) can align math replies too instead of skipping them for digits.
//   node evals/p2-face/spoken-text.mjs
import fs from "node:fs";
import { speakable } from "../../server/voice/spoken.js";
const DIR = new URL("./out/product/", import.meta.url).pathname;
let n = 0;
for (const f of fs.readdirSync(DIR).filter((x) => /-\d+\.json$/.test(x) && !x.endsWith(".ctc.json"))) {
  const j = JSON.parse(fs.readFileSync(DIR + f, "utf8"));
  if (!j.text || j.spokenText) continue;
  j.spokenText = speakable(j.text, { mode: "hinglish", ageBand: "6-9" });
  fs.writeFileSync(DIR + f, JSON.stringify(j));
  n++;
}
console.log("annotated", n);
