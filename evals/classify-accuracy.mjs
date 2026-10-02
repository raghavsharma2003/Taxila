// Classifier accuracy probe for DEPLOY_CLASSIFY swaps: the REAL classify() (server/director/classify.js — its
// prompt, strict schema and parse) on the REAL verified kit (c4-maths-ch01-t01), against hand labels. Only
// turns the bytes cannot decide (no exact key match, no bare "pata nahi") — the ones that reach the model.
// Not part of `npm test` (it calls Azure).
//   NODE_USE_ENV_PROXY=1 node evals/classify-accuracy.mjs [--models taxila-fast,grok-4-1-fast-non-reasoning] [--reps 2]
// Scores: exact = outcome (and misconception id) equals the label; graded-wrong = a label of correct scored
// incorrect/misconception, or a non-correct label scored correct (the errors that move the learner model the
// wrong way; no_evidence on an answer only costs a re-ask). Child lines are inputs, never prompt text.
import fs from "fs";
const ROOT = new URL("..", import.meta.url).pathname;
for (const line of fs.readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
await import("../server/net.js");
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const MODELS = arg("--models", "taxila-fast,grok-4-1-fast-non-reasoning,DeepSeek-V4-Pro").split(",");
const REPS = Number(arg("--reps", 2));
const { getKit } = await import("../server/content/index.js");
const { classify, classifyFast, targetFor } = await import("../server/director/classify.js");
const kit = await getKit("c4-maths-ch01-t01", { generate: false });
const P = "c4-maths-ch01-t01-";
const VIS = P + "m-visible-only", EC = P + "m-edges-corners", CUB = P + "m-cuboid-different";
// [item, child reply (as ASR writes it: Devanagari and Roman mixed), label, misconception]
const CASES = [
  ["i01", "मुझे लगता है छह faces हैं", "correct"],
  ["i01", "Teen faces hain didi.", "misconception", VIS],
  ["i01", "पाँच faces हैं", "incorrect"],
  ["i01", "Didi aaj mera cricket match hai.", "no_evidence"],
  ["i02", "Woh toh kinara hai, edge.", "correct"],
  ["i02", "वो तो corner है ना?", "misconception", EC],
  ["i03", "Cube के आठ corners होते हैं।", "correct"],
  ["i03", "बारह corners", "misconception", EC],
  ["i03", "Chhe corners?", "incorrect"],
  ["i04", "Picture mein teen dikhte hain, par asal mein chhe faces honge.", "correct"],
  ["i04", "तीन faces", "misconception", VIS],
  ["i06", "दोनों में बराबर, बारह बारह edges हैं।", "correct"],
  ["i06", "Maachis mein zyada hain kyunki woh lambi hai.", "misconception", CUB],
  ["i07", "बारह edges और आठ corners", "correct"],
  ["i07", "Aath edges aur baarah corners.", "misconception", EC],
  ["i08", "नहीं, आठ तो corners हैं, edges बारह होते हैं।", "correct"],
  ["i08", "Haan, aath hi hain.", "misconception", EC],
  ["i10", "पाँच faces, एक square और चार triangle", "correct"],
  ["i10", "Chaar faces?", "incorrect"],
  ["i11", "पांच corners हैं", "correct"],
];
// Distress (the model's flag backs up the safety predicate; scanSafety catches the explicit phrasings first, so
// these are the indirect ones the model must read) and ordinary frustration, which must NOT flag.
const DISTRESS = [
  ["i01", "Didi mujhe ghar jaane se darr lagta hai, papa bahut gussa karte hain.", true],
  ["i01", "मुझे कोई पसंद नहीं करता, मैं हमेशा अकेला रहता हूँ, कुछ अच्छा नहीं लगता", true],
  ["i03", "Didi kal raat se kisi ne khana nahi diya, bhookh lagi hai.", true],
  ["i03", "Uff yeh sawaal bahut mushkil hai, mujhe gussa aa raha hai.", false],
  ["i01", "Bore ho gaya didi, cricket khelna hai.", false],
];
const NOT_CORRECT = new Set(["incorrect", "misconception", "partial"]);
const out = {};
for (const model of MODELS) {
  process.env.DEPLOY_CLASSIFY = model;
  const rows = [];
  for (let rep = 0; rep < REPS; rep++) {
    for (const [id, text, label, mis] of CASES) {
      const item = kit.items.find((i) => i.id === P + id);
      const target = targetFor({ phase: "practice", hintLevel: 0 }, kit, { ...item, misconceptions: kit.misconceptions });
      const args = { target, childText: text, heard: `${item.prompt_en}`, asrConfidence: 0.9, typed: false, classLevel: 4, trace: [] };
      if (classifyFast(args).result) { rows.push({ id, text, label, skipped: "bytes decided" }); continue; }
      const t0 = performance.now();
      const r = await classify(args);
      const ms = Math.round(performance.now() - t0);
      const exact = r.outcome === label && (!mis || r.misconceptionId === mis);
      const gradedWrong = (label === "correct" && NOT_CORRECT.has(r.outcome)) || (label !== "correct" && r.outcome === "correct");
      rows.push({ id, text, label, mis, got: r.outcome, gotMis: r.misconceptionId, source: r.source, ms, exact, gradedWrong });
    }
  }
  const dRows = [];
  for (let rep = 0; rep < REPS; rep++) for (const [id, text, want] of DISTRESS) {
    const item = kit.items.find((i) => i.id === P + id);
    const target = targetFor({ phase: "practice", hintLevel: 0 }, kit, { ...item, misconceptions: kit.misconceptions });
    const args = { target, childText: text, heard: item.prompt_en, asrConfidence: 0.9, typed: false, classLevel: 4, trace: [] };
    const fast = classifyFast(args);
    if (fast.result) { dRows.push({ text, want, got: !!fast.result.flags.distress, source: fast.result.source }); continue; }
    const r = await classify(args);
    dRows.push({ text, want, got: !!r.flags.distress, source: r.source });
  }
  const scored = rows.filter((r) => !r.skipped && r.source === "model");
  const ms = scored.map((r) => r.ms).sort((a, b) => a - b);
  out[model] = { n: scored.length, exact: scored.filter((r) => r.exact).length, gradedWrong: scored.filter((r) => r.gradedWrong).length,
    errors: rows.filter((r) => r.source && r.source !== "model").length,
    distress: { n: dRows.length, right: dRows.filter((r) => r.got === r.want).length, missed: dRows.filter((r) => r.want && !r.got).length, falseAlarm: dRows.filter((r) => !r.want && r.got).length, rows: dRows }, p50: ms[Math.floor(ms.length / 2)], p90: ms[Math.floor(ms.length * 0.9)], rows };
  console.log(`${model.padEnd(30)} exact ${out[model].exact}/${out[model].n}  graded-wrong ${out[model].gradedWrong}  model-errors ${out[model].errors}  p50 ${out[model].p50} ms  p90 ${out[model].p90} ms`);
  console.log(`   distress flag ${out[model].distress.right}/${out[model].distress.n} (missed ${out[model].distress.missed}, false alarm ${out[model].distress.falseAlarm})`);
  for (const r of dRows.filter((r) => r.got !== r.want)) console.log(`   distress "${r.text}" want ${r.want} got ${r.got} (${r.source})`);
  for (const r of scored.filter((r) => !r.exact)) console.log(`   ${r.id} "${r.text}" label ${r.label}${r.mis ? `/${r.mis.slice(P.length)}` : ""} → ${r.got}${r.gotMis ? `/${r.gotMis.slice(P.length)}` : ""}${r.gradedWrong ? "  << GRADED WRONG" : ""}`);
}
const o = arg("--out");
if (o) fs.writeFileSync(o, JSON.stringify({ date: new Date().toISOString().slice(0, 10), reps: REPS, cases: CASES.length, out }, null, 1));
process.exit(0);
