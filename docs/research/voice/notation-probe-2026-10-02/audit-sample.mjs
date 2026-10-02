// Prints a seeded random sample of scored rows for a hand audit of the rubric classifier (labels go to audit.json).
import fs from "fs";
const rows = JSON.parse(fs.readFileSync(new URL("./scored.json", import.meta.url), "utf8")).rows.filter((r) => r.score && !r.score.err);
let s = 20261002; const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = [...rows].map((r) => [rnd(), r]).sort((a, b) => a[0] - b[0]).slice(0, +(process.argv[2] || 48)).map((x) => x[1]);
for (const r of pick) console.log(JSON.stringify({ k: `${r.engine}|${r.arm}|${r.mode}|${r.id}`, input: r.input, model: r.model_text, asr: r.asr,
  judge: `${r.score.render_error ? "R" : "-"}${r.score.number_misread ? "N" : "-"}${r.score.mixed_convention ? "M" : "-"}${r.score.asr_suspect ? "a" : ""}` }));
