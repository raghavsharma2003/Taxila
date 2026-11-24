#!/usr/bin/env node
// to-brain 053 E (decision dc-r8-director34 item 11): the judges' prompt is checked by code before a run.
//
//   node scripts/judge-prompt-check.mjs <prompt.md> [<scripts dir> …]
//     Every quoted Hinglish sentence in the prompt — text between double quotes ("…" or “…”) of four words or more, split into its
//     sentences, each of four words or more with a Hinglish word in it — that is found in no script (every string of every *.json in
//     the dirs given, default data/lesson-scripts and data/lesson-scripts-staged: its lines and its joint lists), no reply library
//     (data/lesson-aside-replies.json) and none of the walk's own lines (the string literals of server/brain, server/director and
//     server/conversation) is printed. Exit 1 if any. A "…" inside a quote stands for words left out: each piece must be found, in
//     order, in one source string; a script's {slot} matches any few words.
//     director34's prompt: the J7 quote "Toh 2/4 zyada hai" (a replacement sentence that is not the script's) is reported.
//
//   node scripts/judge-prompt-check.mjs --endings [<run dir>]
//     The turn endings the walk produces, for main to paste into the prompt (the list is never typed): the seam kind each teacher row of a
//     run ends on (its last `seams[].right`), with its count and one example of the words it ends on. Default run dir: director34's frozen
//     rows (tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-24-director34); a dry matrix's out dir works the same.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const norm = (t) => String(t ?? "").toLowerCase().replace(/[’‘`]/g, "'").replace(/[^\p{L}\p{N}/'{} ]+/gu, " ").replace(/\s+/g, " ").trim();
const words = (t) => norm(t).split(" ").filter(Boolean);
/** Hinglish function words: a quote holding none of them is English (a rule, a label) and not checked. */
// (words that are also English — the, to, do, main, me, par, so, ho — decide nothing)
const HINGLISH = new Set("hai hain tha thi hoga hogi hota hoti hote ka ki ke ko se mein aur toh bhi nahi nahin kya kyun kyunki kaise kitne kitna kitni kaun kaunsa kaunsi yeh ye woh wo wahi yahi ab abhi phir pehle baad matlab yaani haan theek achha sahi jawab sawaal tum tumhe tumne tumhara tumhari tumhare aap mujhe batao dekho suno socho karo kar karna karte karti hua hue hui gaya gayi diya liya wala wali wale saath baat ek teen chaar barabar hissa hisse zyada kam".split(" "));
const ENGLISH = new Set("the a an of and is are that which with for on in it its this from by as be was were when where what who not or each every said says she they their".split(" "));
const isHinglish = (t) => { const w = words(t); return w.some((x) => HINGLISH.has(x)) && w.filter((x) => ENGLISH.has(x)).length / w.length < 0.2; };

/** The quoted sentences of a prompt: [{ quote, sentence }] — each sentence of a quote of four words or more, itself of four words or more. */
export function quotedSentences(md) {
  const out = [];
  const re = /"([^"\n]{3,400})"|“([^”\n]{3,400})”/g;
  for (const m of String(md).matchAll(re)) {
    const q = (m[1] ?? m[2]).trim();
    if (words(q.replace(/…|\.\.\./g, " ")).length < 4) continue;
    for (const s of q.split(/(?<=[.!?।])\s+/)) {
      const t = s.trim();
      if (words(t.replace(/…|\.\.\./g, " ")).length < 4 || !isHinglish(t)) continue;
      out.push({ quote: q, sentence: t });
    }
  }
  return out;
}

/** Every string a sentence may come from: script values, the reply library's, and the walk's string literals. */
export function sourceStrings({ scriptDirs = [join(ROOT, "data/lesson-scripts"), join(ROOT, "data/lesson-scripts-staged")], codeDirs = ["server/brain", "server/director", "server/conversation"].map((d) => join(ROOT, d)) } = {}) {
  const out = [];
  const walkJson = (x) => { if (typeof x === "string") out.push(x); else if (Array.isArray(x)) x.forEach(walkJson); else if (x && typeof x === "object") Object.values(x).forEach(walkJson); };
  const files = (d, ext) => (existsSync(d) ? readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? files(p, ext) : p.endsWith(ext) ? [p] : []; }) : []);
  for (const d of scriptDirs) for (const f of files(d, ".json")) { try { walkJson(JSON.parse(readFileSync(f, "utf8"))); } catch { /* not JSON */ } }
  const lib = join(ROOT, "data/lesson-aside-replies.json");
  if (existsSync(lib)) walkJson(JSON.parse(readFileSync(lib, "utf8")));
  // (the walk's own lines: every quoted literal of its code, a template's ${…} as a slot)
  for (const d of codeDirs) for (const f of [...files(d, ".js"), ...files(d, ".json")]) {
    const src = readFileSync(f, "utf8");
    if (f.endsWith(".json")) { try { walkJson(JSON.parse(src)); } catch { /* skip */ } continue; }
    for (const m of src.matchAll(/"((?:[^"\\\n]|\\.){8,})"|`((?:[^`\\]|\\.){8,})`/g)) out.push(String(m[1] ?? m[2]).replace(/\$\{[^}]*\}/g, "{x}"));
  }
  return out;
}

const esc = (t) => t.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
/** A matcher for one source string: its normal form with each {slot} as a few words. */
// (a string that is mostly slots — "{friend}", "{x}/{x}" — matches anything: three literal words at least)
const sourceRe = (s) => { const n = norm(s); return /\{\w*\}/.test(n) && n.replace(/\{\w*\}/g, " ").trim().split(/\s+/).filter((w) => /\p{L}/u.test(w)).length >= 3 ? new RegExp(n.split(/\{\w*\}/).map((x) => esc(x.trim())).join(".{0,60}?")) : null; };
/** Whether a quoted sentence is found in the sources: every piece between its "…" in one source string, in order. */
export function foundIn(sentence, sources, cache = new Map()) {
  const pieces = String(sentence).split(/…|\.\.\./).map(norm).filter((p) => p.split(" ").length >= 1 && p.length >= 2);
  if (!pieces.length) return true;
  for (const s of sources) {
    let n = cache.get(s);
    if (!n) { n = { t: norm(s), re: sourceRe(s) }; cache.set(s, n); }
    let at = 0, ok = true;
    for (const p of pieces) {
      const k = n.t.indexOf(p, at);
      if (k >= 0) { at = k + p.length; continue; }
      if (n.re && pieces.length === 1) { const filled = new RegExp(`^(?:${n.re.source})$`); if (filled.test(p) || n.re.test(p)) continue; }
      ok = false; break;
    }
    if (ok) return true;
  }
  return false;
}

/** The quoted sentences found nowhere: [{ quote, sentence }]. */
export function checkPrompt(md, opts = {}) {
  const sources = sourceStrings(opts);
  const cache = new Map();
  const seen = new Set();
  return quotedSentences(md).filter((x) => { const k = norm(x.sentence); if (seen.has(k)) return false; seen.add(k); return !foundIn(x.sentence, sources, cache); });
}

/** The endings of a run's teacher rows by the seam kind each ends on: [{ kind, n, example }], most first. */
export function turnEndings(runDir) {
  const by = new Map();
  for (const f of readdirSync(runDir).filter((x) => x.endsWith(".json"))) {
    let d; try { d = JSON.parse(readFileSync(join(runDir, f), "utf8")); } catch { continue; }
    for (const r of d?.director ?? []) {
      if (r?.who !== "teacher") continue;
      const kind = (r.seams ?? []).at(-1)?.right ?? "(no seams)";
      const last = String(r.text ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?।])\s+/).at(-1) ?? "";
      const e = by.get(kind) ?? { kind, n: 0, example: last.slice(0, 80) };
      e.n++; by.set(kind, e);
    }
  }
  return [...by.values()].sort((a, b) => b.n - a.n || a.kind.localeCompare(b.kind));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (args[0] === "--endings") {
    const dir = args[1] ?? join(ROOT, "tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-24-director34");
    for (const e of turnEndings(dir)) console.log(`- ${e.kind} (${e.n}): "${e.example}"`);
    process.exit(0);
  }
  if (!args[0]) { console.error("usage: judge-prompt-check.mjs <prompt.md> [<scripts dir> …] | --endings [<run dir>]"); process.exit(2); }
  const md = readFileSync(args[0], "utf8");
  const bad = checkPrompt(md, args.length > 1 ? { scriptDirs: args.slice(1) } : {});
  for (const b of bad) console.log(`not found: "${b.sentence}"${b.sentence !== b.quote ? `  (in "${b.quote.slice(0, 100)}${b.quote.length > 100 ? "…" : ""}")` : ""}`);
  console.log(`${bad.length} quoted sentence${bad.length === 1 ? "" : "s"} not found in the scripts, the reply library or the walk's lines`);
  process.exit(bad.length ? 1 : 0);
}
