// gnm: per-face preset re-score (VERDICT: "presets re-scored on the merged face, with a held-out judge"; the logged
// lesson teacher-presets-per-face). Renders each listed emotion at the face camera with its preset's blendshapes scaled
// by each gain (same design, more amplitude; head, gaze and lean unchanged; weights clamped at 1), into
// <out>/g<gain>/teal/emotions/<e>.png, for emotion-check.mjs --root. Chosen on judge A only; judge C stays held out.
//   node rescore.mjs --emotions curious,concerned,delighted,playful --gains 1,1.3,1.6 --out <dir>
import fs from "node:fs";
import path from "node:path";
import { openHarness } from "./harness.mjs";
const argv = process.argv.slice(2);
const opt = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d);
const EM = opt("--emotions", "curious,concerned,delighted,playful").split(","), GAINS = opt("--gains", "1,1.3,1.6").split(",").map(Number);
const out = opt("--out");
const hx = await openHarness({ w: 600, h: 750 });
try {
  await hx.page.evaluate(() => TX.load("teal", "H"));
  for (const g of GAINS) {
    const d = path.join(out, `g${g}`, "teal", "emotions");
    fs.mkdirSync(d, { recursive: true });
    for (const e of EM) {
      await hx.page.evaluate(([n, gg]) => { TX.frame("face", 0); const p = TX.emotion(n, 1); for (const k in p.bs) p.bs[k] = Math.min(1, p.bs[k] * gg); TX.pose(p); TX.render(); }, [e, g]);
      await hx.shot(path.join(d, `${e}.png`));
    }
  }
} finally { await hx.close(); }
