// The spoken renderer's content-preservation control (harvest port task 35: "a seam judged by 'is the markup
// gone' passes an empty string"; source src/voice/spokenText.ts@main corrupted `5 - 3`, `f(x)`, `[a,b]`, `->`,
// `<`). server/voice/spoken.js already covers the notation (spoken-notation workstream); this is the mustSay
// side it lacked: over every kit prompt, hint and diagnostic × three modes, toSpoken must never return an empty
// string for a non-empty input, and every word of 3+ letters must survive unless it was notation the renderer
// is meant to read out (a unit, a scale word read in Hindi, a formula or a point name spelled letter by letter).
//   node evals/spoken-preserve.mjs
import { toSpoken } from "../server/voice/spoken.js";
import { kitStrings } from "./lib/corpora.mjs";

const MODES = ["english", "hinglish", "hindi"];
const W = /[\p{L}\p{M}]{3,}/gu;
/** Words the renderer replaces by design: units it expands, and Indian scale words it reads in the mode's words. */
const EXPANDED = new Set(["min", "mins", "sec", "secs", "hrs", "kmph", "lakh", "lakhs", "crore", "crores"]);
/** A token written as notation: two or more capitals (∠APB, CaCO₃, NaCl) is read letter by letter. */
const isNotation = (tok) => (tok.match(/\p{Lu}/gu) ?? []).length >= 2;

let failed = 0;
const gate = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) failed++; };

// the five corruptions that refuted the source seam, pinned against this renderer. "Preserved", not "read
// correctly": `[a, b]` and `x -> y` come back UNCHANGED, so TTS still receives the bracket and arrow characters
// (2026-10-03 review). They are pinned as-is so a change to either is a visible decision, not drift.
const PROBES = [
  ["5 - 3 = 2", "english", "Five minus three equals two"],
  ["f(x) = 2x + 1", "english", "f(x) equals two x plus one"],
  ["[a, b]", "english", "[a, b]"],
  ["x -> y", "english", "x -> y"],
  ["3 < 5", "english", "Three is less than five"],
  ["5 - 3 = 2", "hindi", "पाँच ऋण तीन बराबर दो"],
  ["Childline 1098", "hindi", "Childline एक शून्य नौ आठ"],
];
const bad = PROBES.filter(([t, mode, want]) => toSpoken(t, { mode }) !== want);
for (const [t, mode, want] of bad) console.log(`      ${mode} ${JSON.stringify(t)} → ${JSON.stringify(toSpoken(t, { mode }))} (want ${JSON.stringify(want)})`);
gate(!bad.length, `port-plan corruption probes: ${PROBES.length - bad.length}/${PROBES.length} read right`);

const strings = kitStrings().filter((k) => /prompt_|hint|opt\d|diag_/.test(k.where));
function measure(render, list) {
  let n = 0, empty = 0, explained = 0;
  const unexplained = [];
  for (const k of list) for (const mode of MODES) {
    n++;
    const out = render(k.text, { mode });
    if (k.text.trim() && !out.trim()) { empty++; continue; }
    const have = new Set(out.toLowerCase().match(W) ?? []);
    for (const tok of k.text.match(/[\p{L}\p{M}\p{N}]+/gu) ?? []) {
      for (const w of tok.toLowerCase().match(W) ?? []) {
        if (have.has(w)) continue;
        if (EXPANDED.has(w) || isNotation(tok)) { explained++; continue; }
        unexplained.push({ mode, where: k.where, w, text: k.text.slice(0, 100), out: out.slice(0, 100) });
      }
    }
  }
  return { n, empty, explained, unexplained };
}
// negative controls: a seam that returns "" and one that drops a word must both fail this check
const sample = strings.slice(0, 50);
const c1 = measure(() => "", sample), c2 = measure((t) => t.replace(/[\p{L}\p{M}]{3,}/u, ""), sample);
gate(c1.empty > 0 && c2.unexplained.length > 0, `negative controls: an empty seam (${c1.empty} empty) and a word-dropping seam (${c2.unexplained.length} losses) are caught`);
const t0 = performance.now();
const { n, empty, explained, unexplained } = measure(toSpoken, strings);
const ms = performance.now() - t0;
gate(empty === 0, `non-empty in, non-empty out: ${n - empty}/${n} renderings`);
for (const u of unexplained.slice(0, 10)) console.log(`      lost "${u.w}" (${u.mode}) ${u.where}: ${u.text} → ${u.out}`);
gate(unexplained.length === 0, `every 3+ letter word survives or is notation read out: ${unexplained.length} unexplained losses (${explained} by design)`);
console.log(`cost: ${(1000 * ms / n).toFixed(1)} µs per rendering over ${n}`);
console.log(failed ? `\n${failed} gate(s) FAILED` : "\nspoken preserve: PASS");
process.exitCode = failed ? 1 : 0;
