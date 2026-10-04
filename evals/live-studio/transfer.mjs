// Live Studio probe: the library effect. Every build that passed the gate in results.json is re-gated with NEW host
// truth (fraction: different items incl. a 7-part whole; bar chart: different values, a different top bar;
// photosynthesis: the English strings table). A build that passes is reusable for the next child at QA cost only.
// Usage: node evals/live-studio/transfer.mjs [--out out-2026-10-04]
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { KINDS } from "./kinds.mjs";
import { runQA } from "./qa.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), arg("out", "out-2026-10-04"));
const results = JSON.parse(fs.readFileSync(path.join(OUT, "results.json"), "utf8"));

const ALT = {
  fraction_game: () => { KINDS.fraction_game.params = { items: [{ id: "j1", n: 1, d: 3 }, { id: "j2", n: 4, d: 6 }, { id: "j3", n: 2, d: 7 }], picture: "pizza-or-bar" }; },
  bar_chart_viz: () => { KINDS.bar_chart_viz.params = { data: [{ key: "mango", value: 5 }, { key: "banana", value: 11 }, { key: "apple", value: 8 }, { key: "guava", value: 3 }, { key: "orange", value: 10 }] }; },
  photosynthesis_anim: () => { Object.assign(KINDS.photosynthesis_anim.strings, { title: "How a plant makes its food", sun: "Sunlight", leaf: "Leaf", roots: "Roots", water: "Water",
    co2: "Carbon dioxide", o2: "Oxygen", glucose: "Glucose (food)", play: "Play", pause: "Pause", step1: "Sunlight falls on the leaf.", step2: "Roots send water up.",
    step3: "The leaf takes in carbon dioxide from the air.", step4: "Glucose is made in the leaf.", step5: "The leaf gives out oxygen.", ask: "Which gas does the leaf give out?" }); },
};
for (const f of Object.values(ALT)) f();

const browser = await chromium.launch();
const rows = [];
for (const r of results.filter((x) => x.passFinal)) {
  const last = r.rounds.length - 1;
  const frag = fs.readFileSync(path.join(OUT, `${r.id}__r${last}.html`), "utf8");
  const qa = await runQA(browser, r.kind, frag, {});
  rows.push({ id: r.id, kind: r.kind, arm: r.arm, pass: qa.pass, ms: qa.ms, failed: qa.checks.filter((c) => !c.pass).map((c) => c.id) });
  console.log(r.id, qa.pass ? "PASS" : "fail " + rows.at(-1).failed.join(","), qa.ms + "ms");
}
await browser.close();
fs.writeFileSync(path.join(OUT, "transfer.json"), JSON.stringify(rows, null, 1));
