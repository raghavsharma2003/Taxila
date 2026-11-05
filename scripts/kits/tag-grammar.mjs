#!/usr/bin/env node
// Round 7 F (main 2026-11-04, for C2 Games' vakya and the G1 workflow): tag every class 4-7 English / Hindi GRAMMAR skill
// with `kind: "grammar"` in data/kits, so build-vakya's grammar test does not depend on title wording.
//
// A skill is grammar when it asks the child to PRODUCE a sentence-level form: tense and verb forms, agreement (number,
// gender, person, ने), articles, pronouns, modals, question formation, conditionals, reported speech, voice, connectors,
// comparison, prepositions, quantity words. It is NOT grammar when it is vocabulary, spelling or script (ड़, nukta,
// conjuncts), word formation by prefix or suffix, homophones or contractions, literary devices, or only naming a word's
// part of speech (BORDERLINE below; left untagged, listed so C2 or main can flip one).
//
// The tagged set = what build-vakya's title patterns already find (grammarOf) + ADD, minus nothing. Idempotent.
//   node scripts/kits/tag-grammar.mjs           write the tags
//   node scripts/kits/tag-grammar.mjs --check   exit 1 when a kit is not tagged as this file says
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { grammarOf } from "../../server/play/tools/build-vakya.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
export const CLASSES = [4, 5, 6, 7], SUBJECTS = ["english", "hindi"];

/** Grammar skills the title patterns miss (read and classified by hand, 2026-11-04). */
export const ADD = Object.freeze([
  // English
  "c4-english-ch01-t01-s4", // can / can't + plain verb
  "c4-english-ch02-t01-s4", // irregular past forms
  "c4-english-ch03-t01-s3", // Do / Don't + plain verb
  "c4-english-ch04-t01-s4", // When I ..., I ...; -s for he/she
  "c4-english-ch05-t01-s4", // a / an
  "c4-english-ch06-t01-s4", // was / were; for + a length of time
  "c4-english-ch10-t01-s4", // -er + than
  "c4-english-ch11-t01-s4", // reached (no 'to'); uncountable luggage
  "c5-english-ch05-t01-s3", // one frog hops, many frogs hop
  "c5-english-ch06-t01-s4", // should + plain verb
  "c5-english-ch07-t01-s4", // -er or more, never both
  "c5-english-ch09-t01-s4", // relative 'who'
  "c5-english-ch10-t01-s3", // is/are + past participle (passive)
  "c6-english-ch11-t01-s5", // present simple for habits; so ... that
  "c6-english-ch12-t01-s5", // present simple -s; instructions
  "c6-english-ch13-t01-s5", // present simple -s/-es; capitals for names
  "c7-english-ch06-t01-s2", // could / would / may requests and offers
  "c7-english-ch08-t01-s4", // I hope ... / I wish ...
  "c7-english-ch14-t01-s3", // possessive apostrophe
  "c7-english-ch14-t01-s4", // thank you for + -ing; grateful to / for
  "c7-english-ch15-t01-s4", // passive voice
  // Hindi
  "c4-hindi-ch06-t01-s4",   // आप … हैं / तुम … हो; आपका पुत्र / आपकी पुत्री
  "c4-hindi-ch10-t01-s4",   // gender with a borrowed noun (नया कैमरा)
  "c5-hindi-ch01-t01-s4",   // वचन (the pattern finds it, but 'spells' in the title excludes it)
  "c6-hindi-ch02-t01-s4",   // gender agreement with टीम / हॉकी
  "c6-hindi-ch06-t01-s4",   // person change मैं/मेरी ↔ वे/उनकी
  "c6-hindi-ch09-t01-s4",   // ब्रज → today's Hindi with ने-agreement
  "c7-hindi-ch03-t01-s4",   // लिंग agreement (काँटा चुभता है, पत्ती झड़ती है)
  "c7-hindi-ch03-t01-s5",   // जबकि / परंतु contrast connectors
  "c7-hindi-ch08-t01-s4",   // open question words (कैसे, क्यों, क्या-क्या)
]);

/** Grammar by curriculum, but recognition of a part of speech rather than producing a form: left untagged on purpose. */
export const BORDERLINE = Object.freeze([
  "c4-hindi-ch04-t01-s4",   // picks out संज्ञा words (and the nukta)
  "c5-hindi-ch02-t01-s5",   // picks out संज्ञा; proper vs common noun
  "c5-hindi-ch08-t01-s4",   // व्यक्तिवाचक vs जातिवाचक (and ड after a nasal)
  "c5-hindi-ch11-t01-s4",   // identifies विशेषण
  "c6-english-ch12-t01-s4", // practice / practise, advice / advise (noun vs verb)
]);

const fileOf = (c, subj) => join(ROOT, "data/kits", `c${c}-${subj}.json`);

/** PURE. The skills of one kit file that should carry kind "grammar". */
export function grammarSkillIds(kit, subject) {
  const out = [];
  for (const t of kit.topics ?? []) for (const s of t.skills ?? []) {
    if (ADD.includes(s.id) || grammarOf(subject, s.title, null)) out.push(s.id);
  }
  return out;
}

/** PURE. Set or clear kind on every skill of the kit; returns { kit, changed, tagged }. */
export function tagKit(kit, subject) {
  const want = new Set(grammarSkillIds(kit, subject));
  let changed = 0;
  for (const t of kit.topics ?? []) for (const s of t.skills ?? []) {
    if (want.has(s.id) && s.kind !== "grammar") { s.kind = "grammar"; changed++; }
    else if (!want.has(s.id) && s.kind === "grammar") { delete s.kind; changed++; }
  }
  return { kit, changed, tagged: want.size };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const check = process.argv.includes("--check");
  let total = 0, drift = 0;
  const known = new Set();
  for (const c of CLASSES) for (const subj of SUBJECTS) {
    const f = fileOf(c, subj);
    const kit = JSON.parse(readFileSync(f, "utf8"));
    for (const t of kit.topics) for (const s of t.skills) known.add(s.id);
    const { changed, tagged } = tagKit(kit, subj);
    total += tagged; drift += changed;
    if (changed && !check) writeFileSync(f, JSON.stringify(kit, null, 1));
    console.log(`c${c}-${subj}: ${tagged} grammar skills${changed ? (check ? `, ${changed} not tagged as listed` : `, ${changed} changed`) : ""}`);
  }
  const missing = [...ADD, ...BORDERLINE].filter((id) => !known.has(id));
  if (missing.length) { console.error(`unknown skill ids: ${missing.join(", ")}`); process.exit(1); }
  console.log(`total ${total}`);
  if (check && drift) process.exit(1);
}
