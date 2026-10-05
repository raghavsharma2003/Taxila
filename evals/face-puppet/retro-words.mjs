// Review v4 (2026-10-05): the WITH-WORDS retroflex path (parts >= 1) was used as the "truth" by retro-align.mjs and never
// checked itself. Per word: Azure id-19 events inside the word window vs the stops the word text predicts (wordFlags).
// A curl is placed on the k-th id-19 event of a word; when the counts differ the k-th event may be another sound, so a
// curl is only "aligned" when the counts match. Offline, no Azure spend: reads evals/face-puppet/out/diya/*.json.
//   node evals/face-puppet/retro-words.mjs
import fs from "node:fs";
import { resolveVisemes, wordFlags } from "../../src/face-puppet/visemes.ts";
const D = "evals/face-puppet/out/diya/";
const rows = [];
let words = 0, wordsWithStops = 0, countEq = 0, curls = 0, curlsInEqWords = 0, retroWords = 0, retroWordsEq = 0;
for (const f of fs.readdirSync(D).filter((x) => /^\d\d\.json$/.test(x)).sort()) {
  const m = JSON.parse(fs.readFileSync(D + f, "utf8"));
  const res = resolveVisemes(m.visemes, m.words);
  for (const w of m.words) {
    words++;
    const fl = wordFlags(w.text);
    const idx = m.visemes.map((v, i) => [v, i]).filter(([v]) => v.id === 19 && v.ms >= w.ms - 10 && v.ms < w.ms + w.durMs + 10);
    const az = idx.length, tx = fl.stops.length;
    if (az || tx) wordsWithStops++;
    if (az === tx) countEq++;
    const c = idx.filter(([, i]) => res[i].target.tongue?.tongueCurl).length;
    curls += c;
    if (az === tx) curlsInEqWords += c;
    if (fl.retroflex) { retroWords++; if (az === tx) retroWordsEq++; rows.push({ line: f.slice(0, 2), word: w.text, textStops: fl.stops.map((s) => (s ? "R" : "D")).join(""), azureId19: az, curlsDrawn: c, countsMatch: az === tx }); }
  }
}
const out = { date: new Date().toISOString().slice(0, 10), method: "per-word id-19 count (Azure, inside the word-boundary window +-10 ms) vs wordFlags stop count; 24-line Diya battery (with word events)", words, wordsWithStops, wordsCountMatch: countEq, retroflexWords: retroWords, retroflexWordsCountMatch: retroWordsEq, curlsDrawn: curls, curlsInCountMatchedWords: curlsInEqWords, rows };
fs.writeFileSync("evals/face-puppet/out/retro-words.json", JSON.stringify(out, null, 1));
console.log({ ...out, rows: undefined });
console.table(rows);
