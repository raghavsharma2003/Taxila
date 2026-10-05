// Viseme-only mode (no word events): how often the text-sequence stop flags put the retroflex curl on the same id-19
// events as the word-boundary resolution does, over the 24-line battery.  node evals/face-puppet/retro-align.mjs
import fs from "node:fs";
import { resolveVisemes, stopFlagsFromText } from "../../src/face-puppet/visemes.ts";
const D = "evals/face-puppet/out/diya/";
let n = 0, agree = 0, curlTruth = 0, curlHit = 0, curlFalse = 0, countMatch = 0, lines = 0;
const rows = [];
for (const f of fs.readdirSync(D).filter((x) => /^\d\d\.json$/.test(x)).sort()) {
  const m = JSON.parse(fs.readFileSync(D + f, "utf8"));
  const a = resolveVisemes(m.visemes, m.words), b = resolveVisemes(m.visemes, [], m.text);
  const stops = m.visemes.filter((v) => v.id === 19).length, expected = stopFlagsFromText(m.text).length;
  lines++; if (stops === expected) countMatch++;
  let la = 0, ln = 0;
  a.forEach((x, i) => { if (x.id !== 19) return; const t = !!x.target.tongue?.tongueCurl, p = !!b[i].target.tongue?.tongueCurl; n++; ln++; if (t === p) { agree++; la++; } if (t) { curlTruth++; if (p) curlHit++; } else if (p) curlFalse++; });
  rows.push({ line: f.slice(0, 2), azureStops: stops, textStops: expected, agree: `${la}/${ln}` });
}
const res = { date: new Date().toISOString().slice(0, 10), id19Events: n, agreement: +(agree / n).toFixed(3), retroflexTruth: curlTruth, retroflexHit: curlHit, falseCurls: curlFalse, linesWithEqualStopCount: `${countMatch}/${lines}`, rows };
fs.writeFileSync("evals/face-puppet/out/retro-align.json", JSON.stringify(res, null, 1));
console.log({ ...res, rows: undefined }); console.table(rows);
