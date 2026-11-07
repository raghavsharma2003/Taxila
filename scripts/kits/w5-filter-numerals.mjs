// W5 (round 7 F, approved by main 2026-11-04; 0 model calls): Roman-Hinglish kit strings that trip Azure's content filter
// (open-r143-kit-filter-collisions: "teen" = three is read as the English "teen" inside her reply brief, and a block costs
// the child the turn). Kit text fix only; the safety code is untouched.
//
// Rule: in the text she reads aloud or is briefed with (prompt_hi, hints, worked-example steps in Hinglish), a COUNTING
// "teen" ("Teen dost school jaate hain", "teen baar") becomes the numeral 3 ("3 dost", "3 baar"). Never rewritten:
//   - answer forms (answer, acceptable), ids, signs and misconception text: grading and identity read them exactly;
//   - a NUMBER NAME ("teen hazaar pachaas", "chaubees hazaar teen sau saath", "teen-chauthai"): the exercise is the words;
//   - anything inside quotes: the child reads or says exactly that.
// Those are listed for a per-string decision (the open item's own instruction: "decide per string").
//
//   node scripts/kits/w5-filter-numerals.mjs            → dry run: prints every change and every skip, writes nothing
//   node scripts/kits/w5-filter-numerals.mjs --write    → rewrites data/kits/*.json in place (key order kept)
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const KITS = join(ROOT, "data/kits");
const FIELDS = new Set(["prompt_hi", "hint", "hints", "steps_hi", "fadedVersion_hi", "question_hi", "say_hi"]);
const NEVER = new Set(["answer", "acceptable", "id", "skillId", "misconceptionId", "targetsMisconception", "signs", "belief"]);
/** number-name neighbours: "teen" next to these is part of a number written in words */
const NUM_WORD = "ek|do|teen|char|chaar|paanch|panch|chhe|chhah|saat|aath|nau|das|gyarah|barah|terah|chaudah|pandrah|solah|satrah|atharah|unnees|bees|pachees|pachchees|tees|chalees|pachaas|saath|sattar|assi|nabbe|sau|hazaar|hazar|hajar|lakh|laakh|crore|karod|chauthai|tihai|aadha|dedh|dhai|sava|saadhe|paune|point|dashamlav";
const BEFORE = new RegExp(`(?:\\b(?:${NUM_WORD})[\\s,.\\-–]+)$`, "i");
const AFTER = new RegExp(`^(?:[\\s,.\\-–]+(?:${NUM_WORD})\\b)`, "i");
/** the English "teen" (13-19: "a teen number", "the teens", "teen-age") is English, not the Hindi three */
const ENGLISH_TEEN = /^(?:[\s-]*(?:numbers?|years?|age[rd]?s?)\b|s\b)/i;
const TEEN = /\bteen\b/gi;

/** PURE. Rewrite one string → { text, changed, skipped: [{ at, why }] }. */
export function rewrite(s) {
  const skipped = [];
  let changed = 0;
  // quoted spans are left exactly as they are
  const quoted = [];
  for (const m of s.matchAll(/'[^']*'|"[^"]*"|‘[^’]*’|“[^”]*”/g)) quoted.push([m.index, m.index + m[0].length]);
  const inQuote = (i) => quoted.some(([a, b]) => i > a && i < b);
  const text = s.replace(TEEN, (w, i) => {
    const before = s.slice(0, i), after = s.slice(i + w.length);
    if (inQuote(i)) { skipped.push({ at: i, why: "quoted" }); return w; }
    if (ENGLISH_TEEN.test(after)) { skipped.push({ at: i, why: "English 'teen'" }); return w; }
    if (BEFORE.test(before) || AFTER.test(after)) { skipped.push({ at: i, why: "number name" }); return w; }
    changed++;
    return "3";
  });
  return { text, changed, skipped };
}

/**
 * Items whose wording tests pin against real review drafts (tests/r4-leak-parts.test.mjs: director/items.js revealsAnswer
 * matches her draft to the question's own words, and the drafts say "teen"). Skipped until the leak guard treats a number
 * word and its numeral as one token (asked of Brain, docs/patches/to-brain/005).
 */
export const PINNED_ITEMS = new Set(["c4-maths-ch01-t01-rl-o1", "c4-maths-ch01-t01-i10"]);

/** PURE. Walk a kit file's JSON, rewriting the allowed fields; returns the counts and the lists. */
export function rewriteKit(kit, file = "") {
  const changes = [], skips = [];
  const walk = (o, path, key) => {
    if (Array.isArray(o)) return o.map((v, i) => walk(v, `${path}[${i}]`, key));
    if (o && typeof o === "object") {
      if (typeof o.id === "string" && PINNED_ITEMS.has(o.id)) return o;
      for (const k of Object.keys(o)) if (!NEVER.has(k)) o[k] = walk(o[k], `${path}.${k}`, k);
      return o;
    }
    if (typeof o === "string" && FIELDS.has(key) && TEEN.test(o)) {
      TEEN.lastIndex = 0;
      const r = rewrite(o);
      if (r.changed) changes.push({ file, path, from: o, to: r.text });
      for (const sk of r.skipped) skips.push({ file, path, why: sk.why, text: o });
      return r.text;
    }
    TEEN.lastIndex = 0;
    return o;
  };
  walk(kit, "", null);
  return { changes, skips };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const write = process.argv.includes("--write");
  let nc = 0, ns = 0;
  for (const f of readdirSync(KITS).filter((x) => /^c\d-[a-z]+\.json$/.test(x)).sort()) {
    const path = join(KITS, f);
    const raw = readFileSync(path, "utf8");
    const kit = JSON.parse(raw);
    const { changes, skips } = rewriteKit(kit, f);
    nc += changes.length; ns += skips.length;
    for (const c of changes) console.log(`CHANGE ${f}${c.path}\n  - ${c.from}\n  + ${c.to}`);
    for (const s of skips) console.log(`SKIP   ${f}${s.path} (${s.why}): ${s.text}`);
    if (write && changes.length) writeFileSync(path, JSON.stringify(kit, null, /^\{\n( +)"/.exec(raw)?.[1].length ?? 1) + (raw.endsWith("\n") ? "\n" : ""));
  }
  console.log(`\n${write ? "wrote" : "dry run"}: ${nc} strings rewritten, ${ns} left for a per-string decision`);
}
