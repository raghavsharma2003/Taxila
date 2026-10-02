// Lints the compiled `core` blocks of the character sheets in this folder.
// Rules = html-portfolio src/engine/shapelint.ts lintLine (≤14 words, not sentence-shaped, no first-person
// line-initial) + Taxila additions: no square brackets (ack-bracket-direction, reproduced on gpt-realtime-2.1),
// no kinship/role address words anywhere in the core (DL9), no quotation marks (a quoted phrase is a recitable
// line), and the estimated size must fit compile.js SECTION_CAPS.character = 450 (estimateTokens = chars/3.5).
// Also reports cross-sheet overlap so a shared line is a deliberate floor line, not a leak.
// Run: node docs/research/voice/characters/lint-sheets.mjs   (exit 1 on any violation)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { readCore, readCue } from "./core.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const MAX_WORDS = 14;
const CAP_TOKENS = 450;
const SENTENCE_SHAPED_RE = /^[A-Z][^.?!]*[.?!]$/;
const FIRST_PERSON_RE = /^(i\b|i'm\b|i've\b|main\b|mai\b|mujhe\b|meri\b|mera\b|maine\b)/i;
const KINSHIP_RE = /\b(didi|di|bhaiya|bhaia|bhai|ma'?am|madam|miss|sir|aunty|uncle|teacher ji)\b/i;
const est = (s) => Math.ceil(s.length / 3.5);

const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".md")).sort();
let bad = 0;
const cores = {};
for (const f of files) {
  const c = readCore(path.join(DIR, f));
  cores[f] = c;
  const v = [];
  if (!c.header.startsWith("WHO YOU ARE:")) v.push("header must start with WHO YOU ARE:");
  if (KINSHIP_RE.test(c.header)) v.push(`header carries an address term: ${c.header.match(KINSHIP_RE)[0]}`);
  for (const n of c.notes) {
    const r = [];
    const words = n.split(/\s+/).filter(Boolean).length;
    if (words > MAX_WORDS) r.push(`${words} words`);
    if (SENTENCE_SHAPED_RE.test(n)) r.push("sentence-shaped");
    if (FIRST_PERSON_RE.test(n)) r.push("first-person line-initial");
    if (/[\[\]]/.test(n)) r.push("square bracket");
    if (/["“”]/.test(n)) r.push("quotation mark");
    if (KINSHIP_RE.test(n)) r.push(`kinship/role word: ${n.match(KINSHIP_RE)[0]}`);
    if (r.length) v.push(`"${n}" → ${r.join(", ")}`);
  }
  for (const cue of [readCue(path.join(DIR, f)), readCue(path.join(DIR, f), "hinglish")]) if (cue) {
    const w = cue.split(/\s+/).length;
    if (w > 12) v.push(`cue ${w} words (cap 12)`);
    if (KINSHIP_RE.test(cue) || /\b(Asha|Arjun|Uma)\b/.test(cue)) v.push("cue carries a name or address word");
    if (/["“”\[\]]/.test(cue) || SENTENCE_SHAPED_RE.test(cue)) v.push("cue quoted, bracketed or sentence-shaped");
  }
  const tokens = est(c.text);
  if (tokens > CAP_TOKENS) v.push(`estimated ${tokens} tokens > cap ${CAP_TOKENS}`);
  console.log(`${f}: ${c.notes.length} notes, ${c.text.length} chars, ~${tokens} tokens (cap ${CAP_TOKENS}) — ${v.length ? "FAIL" : "clean"}`);
  for (const x of v) console.log("   ✗ " + x);
  bad += v.length;
}

// cross-sheet overlap: identical notes (expected only for the AI-true identity lines) and word-trigram Jaccard
const tri = (notes) => {
  const s = new Set();
  for (const n of notes) {
    const w = n.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, " ").split(/\s+/).filter(Boolean);
    for (let i = 0; i + 2 < w.length; i++) s.add(w.slice(i, i + 3).join(" "));
  }
  return s;
};
const names = Object.keys(cores);
for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
  const a = cores[names[i]], b = cores[names[j]];
  const norm = (n) => n.replace(/\b(Asha|Arjun|Uma)\b/g, "X").replace(/\b(feminine|masculine)\b/g, "G");
  const bNorm = new Set(b.notes.map(norm));
  const shared = a.notes.filter((n) => bNorm.has(norm(n)));
  const sharedNorm = new Set(shared.map(norm));
  const ta = tri(a.notes.filter((n) => !sharedNorm.has(norm(n))));
  const tb = tri(b.notes.filter((n) => !sharedNorm.has(norm(n))));
  const inter = [...ta].filter((t) => tb.has(t)).length;
  const jac = inter / (new Set([...ta, ...tb]).size || 1);
  console.log(`${names[i]} × ${names[j]}: ${shared.length} identical notes (name/gender-normalised); trigram Jaccard on the rest ${jac.toFixed(3)}`);
  for (const s of shared) console.log(`   = ${s}`);
}
process.exit(bad ? 1 : 0);
