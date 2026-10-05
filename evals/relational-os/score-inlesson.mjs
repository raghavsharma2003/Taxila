// Scores the relational signals and the safety predicates on the in-lesson corpora (W2-I fixer, 2026-10-05):
//   evals/relational-os/inlesson-negatives.mjs (hand, in-sample) and inlesson-heldout.json (model-written, out of sample).
// A negative is FALSE when it yields a release kind (goodbye / end_request / goodbye_distress), a boundary kind, a
// third-party ask, a harm signal, wantsToStop() or scanSafety().distress. Recall on the held-out positives.
//   node evals/relational-os/score-inlesson.mjs [--root <tree with server/relational + server/director/safety.js>]
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { INLESSON_NEGATIVES, LEAVE_POSITIVES } from "./inlesson-negatives.mjs";

const i = process.argv.indexOf("--root");
const root = i > 0 ? process.argv[i + 1] : new URL("../../", import.meta.url).pathname;
const { signalsOf } = await import(pathToFileURL(`${root}/server/relational/signals.js`).href);
const { scanSafety, wantsToStop } = await import(pathToFileURL(`${root}/server/director/safety.js`).href);
const hf = process.argv.includes("--v2") ? "./inlesson-heldout-v2.json" : "./inlesson-heldout.json";
const held = JSON.parse(readFileSync(new URL(hf, import.meta.url), "utf8"));

const RELEASE = new Set(["goodbye", "end_request", "goodbye_distress"]);
const BOUNDARY = new Set(["warmth_offer", "permanence_ask", "secret_ask", "contact_ask", "night_ask", "romance", "loneliness"]);
function judge(text) {
  const s = signalsOf(text);
  return { release: s.some((x) => RELEASE.has(x.kind)), boundary: s.some((x) => BOUNDARY.has(x.kind)), third: s.some((x) => x.thirdParty),
    harm: s.some((x) => x.kind === "harm") || scanSafety(text).distress, stop: wantsToStop(text), kinds: s.map((x) => x.kind) };
}
const wilson = (k, n) => { if (!n) return [0, 0]; const z = 1.96, p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), m = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [+((c - m) / d).toFixed(3), +((c + m) / d).toFixed(3)]; };
function negatives(name, list) {
  const f = { release: [], boundary: [], third: [], harm: [], stop: [] };
  for (const x of list) { const j = judge(x.text); for (const k of Object.keys(f)) if (j[k]) f[k].push(x.text); }
  const any = new Set(Object.values(f).flat());
  console.log(`\n${name}: n=${list.length}  any-false ${any.size} ${JSON.stringify(wilson(any.size, list.length))}`);
  for (const [k, v] of Object.entries(f)) console.log(`  ${k.padEnd(8)} ${v.length}${v.length ? "  e.g. " + v.slice(0, 6).map((t) => JSON.stringify(t)).join(" | ") : ""}`);
  return any.size;
}
function recall(name, list, pred) {
  const miss = list.filter((x) => !pred(judge(typeof x === "string" ? x : x.text)));
  console.log(`${name.padEnd(28)} ${list.length - miss.length}/${list.length} ${JSON.stringify(wilson(list.length - miss.length, list.length))}${miss.length ? "  missed: " + miss.slice(0, 8).map((x) => JSON.stringify(typeof x === "string" ? x : x.text)).join(" | ") : ""}`);
}
console.log(`root: ${root}  held-out: ${hf}`);
negatives("hand in-lesson negatives (in-sample)", INLESSON_NEGATIVES);
negatives("held-out in-lesson negatives (model-written)", held.sets.negatives);
console.log("\nrecall (held-out, model-written):");
recall("goodbye → release or stop", held.sets.goodbye, (j) => j.release || j.stop);
recall("goodbye → goodbye signal", held.sets.goodbye, (j) => j.kinds.includes("goodbye"));
recall("stop → end_request/goodbye/stop", held.sets.stop, (j) => j.kinds.includes("end_request") || j.kinds.includes("goodbye") || j.stop);
recall("third party → 3p or harm", held.sets.third_party, (j) => j.third || j.harm);
console.log("\nrecall (hand positives):");
recall("goodbye", LEAVE_POSITIVES.goodbye, (j) => j.kinds.includes("goodbye"));
recall("end_request", LEAVE_POSITIVES.end_request, (j) => j.kinds.includes("end_request"));
recall("third party", LEAVE_POSITIVES.third_party, (j) => j.third);
