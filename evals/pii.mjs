// scrubPii (server/director/safety.js), measured and gated:
//   1. the authored table (pii.data.mjs): every positive masks its kinds (the four shapes that refuted Gurukul's
//      scrubPii are first), every negative comes back byte-identical — GATE: all of it;
//   2. every kit string (prompts, answers, hints, worked examples, diagnostics): a mask on a kit ANSWER would grade
//      a child's right answer wrong if the scrub ever ran before classification — reported; GATE: <= pinned count;
//   3. 108 + 300 recorded child utterances from the relational and attune probes — reported; GATE: 0 masked;
//   4. cost per call.
//   node evals/pii.mjs [--json out.json]
import { writeFileSync, readFileSync } from "node:fs";
import { scrubPii } from "../server/director/safety.js";
import { POSITIVES, NEGATIVES } from "./pii.data.mjs";
import { kitStrings, relationalCoded } from "./lib/corpora.mjs";

/** Pinned 2026-10-03: two kit story lines ("…से मेरा नाम गंगा पड़ता है", a river speaking) lose a word. */
const KIT_FLAG_FLOOR = 2;
let failed = 0;
const gate = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) failed++; };

const miss = POSITIVES.filter(([t, kinds]) => { const r = scrubPii(t); return !kinds.every((k) => r.found.includes(k)); });
const loud = NEGATIVES.filter((t) => scrubPii(t).text !== t);
for (const [t] of miss) console.log(`      miss: ${t} → ${scrubPii(t).text}`);
for (const t of loud) console.log(`      false mask: ${t} → ${scrubPii(t).text}`);
gate(!miss.length, `authored identifiers: ${POSITIVES.length - miss.length}/${POSITIVES.length} masked`);
gate(!loud.length, `authored lesson answers: ${NEGATIVES.length - loud.length}/${NEGATIVES.length} untouched`);

// negative control: a Gurukul-style scrub (contiguous digit runs and emails only) must miss the refuting shapes
const naive = (t) => t.replace(/\d{10,}/g, "[n]").replace(/\S+@\S+/g, "[e]");
const refuting = POSITIVES.slice(0, 4);
const naiveCaught = refuting.filter(([t]) => naive(t) !== t).length;
gate(naiveCaught < refuting.length, `negative control: a contiguous-digits scrub masks only ${naiveCaught}/${refuting.length} of the refuting shapes`);

const kits = kitStrings();
const t0 = performance.now();
const kitHits = kits.filter((k) => scrubPii(k.text).found.length);
const us = ((performance.now() - t0) * 1000) / Math.max(1, kits.length);
const answers = kitHits.filter((k) => /\.(answer|acceptable\d+)$/.test(k.where));
for (const k of kitHits.slice(0, 10)) console.log(`      ${k.where}: ${k.text.slice(0, 100)}`);
gate(kitHits.length <= KIT_FLAG_FLOOR, `kit strings masked: ${kitHits.length}/${kits.length} (answers/acceptable: ${answers.length})`);

const child = relationalCoded().map((r) => r.child);
try {
  const j = JSON.parse(readFileSync(new URL("../docs/research/voice/attune-probe-2026-10-02.json", import.meta.url), "utf8"));
  (function walk(o, k) { if (Array.isArray(o)) o.forEach((x) => walk(x, k)); else if (o && typeof o === "object") Object.entries(o).forEach(([kk, v]) => walk(v, kk)); else if (typeof o === "string" && /^(child|childText|say|line)$/.test(k ?? "")) child.push(o); })(j);
} catch { /* optional corpus */ }
const childHits = child.filter((t) => scrubPii(t).found.length);
for (const t of childHits.slice(0, 10)) console.log(`      ${t} → ${scrubPii(t).text}`);
gate(childHits.length === 0, `recorded child utterances masked: ${childHits.length}/${child.length}`);
console.log(`cost: ${us.toFixed(1)} µs per call (mean over ${kits.length} kit strings)`);

const out = process.argv.includes("--json") ? process.argv[process.argv.indexOf("--json") + 1] : null;
if (out) writeFileSync(out, JSON.stringify({ date: new Date().toISOString().slice(0, 10), authored: { positives: POSITIVES.length, missed: miss.length, negatives: NEGATIVES.length, falseMasks: loud.length },
  kits: { n: kits.length, masked: kitHits.length, answersMasked: answers.length }, child: { n: child.length, masked: childHits.length }, usPerCall: +us.toFixed(1) }, null, 2));
console.log(failed ? `\n${failed} gate(s) FAILED` : "\npii: PASS");
process.exitCode = failed ? 1 : 0;
