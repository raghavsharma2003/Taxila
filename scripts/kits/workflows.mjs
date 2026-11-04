// Learning's spend-gated kit workflows (round 7 F): each one's plan (built from the repo's own data, so the dry run's call
// count is exact), its authoring prompt (shapes, never lines to recite: the inherited prompt law) and how its answer becomes
// items to verify. Azure authors only; the blind solve, the equivalence check and the level rating are Claude's, in
// session (owner 2026-10-27), from the packet runner.mjs writes. See docs/design/round7/learning/KIT-WORKFLOW.md.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const KITS = join(ROOT, "data/kits");
const topicsOf = (kit) => (Array.isArray(kit.topics) ? kit.topics : Object.values(kit.topics));
const loadKit = (c, s) => { const f = join(KITS, `c${c}-${s}.json`); return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : null; };
const kitFiles = (re) => readdirSync(KITS).filter((f) => re.test(f)).sort();
const only = (opts, id) => !opts.only || id.startsWith(opts.only);
const chunk = (xs, n) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));

const AUDIENCE = `Learners are Indian children of class C (CBSE/NCERT 2025-26 books), ages 9-15. Register: real situations they care
about (cricket and kabaddi, phone data, metro timetables, cooking, money in rupees, school events); never baby characters,
talking animals or "little friend". Indian names, places, rupees, lakh/crore grouping, metric units.`;
const ITEM_SHAPE = `{"kind":"...","prompt_en":"...","prompt_hi":"...","answer":"...","acceptable":["..."],"targetsMisconception":"<kit misconception id or null>","hints":["","","",""]}`;

// ───────────────────────────── G1: sentence-train grammar items (C2's vakya target) ─────────────────────────────

/** The vakya bank index: C2's file once it is in the tree, else read from C2's branch (tooling only). */
function vakyaIndex() {
  const f = join(ROOT, "data/play/vakya/index.json");
  if (existsSync(f)) return JSON.parse(readFileSync(f, "utf8"));
  try { return JSON.parse(execFileSync("git", ["show", "origin/claude/r7-games:data/play/vakya/index.json"], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })); }
  catch { return null; }
}
export const G1_TARGET = 6, G1_LOSS = 1.4, G1_BATCH = 8;

export const g1 = {
  name: "g1-grammar-items", cap: 120,
  plan(opts) {
    const idx = vakyaIndex();
    if (!idx) throw new Error("g1 needs data/play/vakya/index.json (C2 Games' build-vakya output)");
    const jobs = [];
    for (const [skillId, s] of Object.entries(idx.skills).sort()) {
      if (!only(opts, skillId)) continue;
      const need = Math.max(0, G1_TARGET - (s.built ?? 0));
      if (!need) continue;
      const want = Math.ceil(need * G1_LOSS);
      chunk(Array.from({ length: want }), G1_BATCH).forEach((b, i) => jobs.push({ id: `${skillId}#${i}`, stage: "author", skillId, title: s.title, n: b.length, estIn: 3500, estOut: 2500 }));
    }
    return jobs;
  },
  system: `You write grammar practice for an Indian AI tutor. ${AUDIENCE}
Each question is a PRODUCTION task with exactly ONE right sentence as its key: the child builds or fixes a whole sentence.
Shapes, best first: (1) an error_spot whose wrong sentence needs two or more changes or a reordering; (2) a word-order build
from given words; (3) a transform (report a quoted sentence, make the question asking where/why, change number, gender or
tense). For a Hindi skill: वचन/लिंग/काल transforms of a full sentence that change at least two words, all in Devanagari.
The key is one sentence of 3-12 words made only from words in the prompt plus the skill's closed set (helper verbs,
articles, relative pronouns, the verb's own forms). Never "which is correct: X or Y", never an open task ("any", "for
example", "your own", "two sentences", "जैसे", "कोई भी"), never a prompt that prints the key's order with one swap.
Every item names the kit misconception it targets (targetsMisconception) so a wrong build can be traced to it.
hints: 4, each at most 14 words; hints 1-3 never contain the key. Reply as JSON {"items":[${ITEM_SHAPE}]}.`,
  user: (j) => JSON.stringify({ skillId: j.skillId, skill: j.title, count: j.n, kitMisconceptions: misconceptionsOf(j.skillId) }),
  collect: (j, json) => (json?.items ?? []).slice(0, j.n).map((it, i) => ({ id: `g1:${j.id}:${i}`, skillId: j.skillId, check: "blind", ...it })),
};

function misconceptionsOf(skillId) {
  const m = /^c(\d)-([a-z]+)-(ch\d+-t\d+)/.exec(skillId);
  const kit = m ? loadKit(m[1], m[2]) : null;
  const t = kit ? topicsOf(kit).find((x) => skillId.startsWith(x.topicId)) : null;
  return (t?.misconceptions ?? []).map((x) => ({ id: x.id, belief: x.belief }));
}

// ───────────────────────────── W1a: Hinglish + Devanagari complete answer forms (the 293 census items) ─────────────────────────────

const CENSUS = join(ROOT, "docs/research/census/2026-10-21-kits-english-only-forms.json");
export const w1a = {
  name: "w1a-hinglish-forms", cap: 60,
  plan(opts) {
    const c = JSON.parse(readFileSync(CENSUS, "utf8"));
    return chunk(c.items.filter((x) => only(opts, x.item)), 10).map((b, i) => ({ id: `w1a#${i}`, stage: "author", items: b, estIn: 2500, estOut: 1500 }));
  },
  system: `You add answer forms to an Indian tutor's answer key. For each item you get its English key (a full answer) and the
Hinglish fragments a child said that were graded only partial. Write the COMPLETE answer as an Indian child would say it:
(a) in Roman Hinglish, (b) in Devanagari Hindi. A complete form carries every idea of the key, no more; keep the key's
numbers and named things exactly. 1-3 forms each. Reply as JSON {"items":[{"item":"<id>","hinglish":["..."],"devanagari":["..."]}]}.`,
  user: (j) => JSON.stringify(j.items.map((x) => ({ item: x.item, key: x.key, partialSaid: x.hinglishPartial ?? [] }))),
  collect: (j, json) => (json?.items ?? []).filter((x) => j.items.some((y) => y.item === x.item)).map((x) => ({
    id: `w1a:${x.item}`, item: x.item, check: "equivalence", key: j.items.find((y) => y.item === x.item).key,
    forms: [...(x.hinglish ?? []), ...(x.devanagari ?? [])], answer: null })),
};

// ───────────────────────────── W1b: Hindi worked-example steps (class 4-7 maths pilot) ─────────────────────────────

export const w1b = {
  name: "w1b-worked-hi", cap: 160,
  plan(opts) {
    const jobs = [];
    for (const c of [4, 5, 6, 7]) for (const t of topicsOf(loadKit(c, "maths") ?? { topics: [] })) {
      if (!only(opts, t.topicId) || !t.workedExample?.steps?.length || t.workedExample.steps_hi) continue;
      jobs.push({ id: t.topicId, stage: "author", topicId: t.topicId, we: t.workedExample, estIn: 1800, estOut: 1500 });
    }
    return jobs;
  },
  system: `You translate a worked example for an Indian maths teacher who teaches in Hindi-English mix and in Hindi. Keep every
number, unit, symbol and step boundary exactly; one output step per input step; the blanks (___) of the faded version stay
at the same places. Write how a teacher SAYS it, short. Reply as JSON {"steps_hi":["<Roman Hinglish>"],"fadedVersion_hi":["..."],
"steps_hi_deva":["<Devanagari>"],"fadedVersion_hi_deva":["..."]}.`,
  user: (j) => JSON.stringify(j.we),
  collect: (j, json) => [{ id: `w1b:${j.topicId}`, topicId: j.topicId, check: "numbers-equal", en: j.we, hi: json, answer: null }],
};

// ───────────────────────────── W1c: per-skill explain plans (class 4-7 maths pilot) ─────────────────────────────

export const w1c = {
  name: "w1c-explain-plans", cap: 480,
  plan(opts) {
    const jobs = [];
    for (const c of [4, 5, 6, 7]) for (const t of topicsOf(loadKit(c, "maths") ?? { topics: [] })) {
      for (const s of t.skills ?? []) {
        if (!only(opts, s.id) || s.explain) continue;
        jobs.push({ id: s.id, stage: "author", classLevel: c, skill: s, topic: t, estIn: 3000, estOut: 3000, maxTokens: 8000 });
      }
    }
    return jobs;
  },
  system: `You plan how a great Indian maths teacher EXPLAINS one skill to a class-C child before any practice. ${AUDIENCE}
Plan, as data (the teacher composes her own words from it; do not write her lines):
- concrete: the hands-on situation that makes the idea visible (one sentence);
- pictorial: what is drawn on the board, as a list of board elements (shapes, labels, arrows), in order;
- symbolic: the written method, step by step, 2-6 steps;
- anchor: ONE worked problem that uses the kit's own numbers when the kit's worked example belongs to this skill, else new
  numbers of class-C size; its steps and its single final answer;
- analogy: one everyday comparison an Indian child of this age knows;
- preempt: the kit misconception most likely here (its id) and the contrast that defuses it;
- check: one quick question to see whether the explanation landed, with its answer.
Reply as JSON {"concrete":"","pictorial":[""],"symbolic":[""],"anchor":{"problem":"","steps":[""],"answer":""},"analogy":"","preempt":{"misconceptionId":"","contrast":""},"check":{"question":"","answer":""}}.`,
  user: (j) => JSON.stringify({ classLevel: j.classLevel, skill: j.skill, topicExpectations: j.topic.expectations, misconceptions: (j.topic.misconceptions ?? []).map((m) => ({ id: m.id, belief: m.belief })), kitWorkedExample: j.topic.workedExample }),
  collect: (j, json) => json ? [
    { id: `w1c:${j.id}:anchor`, skillId: j.id, check: "blind", prompt_en: json.anchor?.problem, answer: json.anchor?.answer, plan: json },
    { id: `w1c:${j.id}:check`, skillId: j.id, check: "blind", prompt_en: json.check?.question, answer: json.check?.answer },
  ] : [],
};

// ───────────────────────────── W2: relevel (no Azure: the level rating is Claude's) ─────────────────────────────

export const w2 = {
  name: "w2-relevel", cap: 0,
  /** No Azure jobs: rating is evaluation (Claude, in session). `packets(opts)` lists the items to rate, 40 per packet. */
  plan: () => [],
  packets(opts) {
    const classes = opts.only?.startsWith("c") ? [Number(opts.only[1])] : [4, 5, 6, 7];
    const out = [];
    for (const f of kitFiles(/^c\d-[a-z]+\.json$/)) {
      const kit = JSON.parse(readFileSync(join(KITS, f), "utf8"));
      if (!classes.includes(kit.class)) continue;
      for (const t of topicsOf(kit)) for (const it of t.items ?? []) {
        if (typeof it.ge === "number") continue;
        // the rubric (evals/content-level-v2/rubric-v2.mjs) rates the question WITH its key, never with its chapter or topic
        out.push({ id: it.id, classLevel: kit.class, subject: kit.subject, prompt_en: it.prompt_en, prompt_hi: it.prompt_hi,
          answer: it.answer ?? (it.options ?? []).find((o) => o.correct)?.text ?? null, ...(it.options ? { options: it.options.map((o) => o.text) } : {}) });
      }
    }
    return chunk(out, 40);
  },
};

// ───────────────────────────── W3: language kits on the real NCERT chapters (class 4-7 English and Hindi) ─────────────────────────────

export const w3 = {
  name: "w3-language-real-text", cap: 130,
  plan(opts) {
    const jobs = [];
    for (const c of [4, 5, 6, 7]) for (const s of ["english", "hindi"]) for (const t of topicsOf(loadKit(c, s) ?? { topics: [] })) {
      if (!only(opts, t.topicId)) continue;
      jobs.push({ id: t.topicId, stage: "author", classLevel: c, subject: s, topic: t, estIn: 4000, estOut: 4000, maxTokens: 9000 });
    }
    return jobs;
  },
  system: `You rewrite a language lesson's practice so it is about the REAL chapter of the class-C NCERT 2025-26 textbook the child
reads in school (the story, poem or lesson this topic covers), not an invented text. ${AUDIENCE}
Never reproduce the book's text beyond a single short line in quotes; refer to its characters, events and words by name.
Write 16 questions across the topic's skills: comprehension of what happens and why, vocabulary from the chapter in context,
the grammar point the chapter carries, and one personal-response question. Each is answerable by speech or a short typed
answer with a key (a "why" keeps one key idea). For an English chapter: prompt_en in English, prompt_hi in Roman Hinglish.
For a Hindi chapter: both in Devanagari. hints: 4, each at most 14 words, 1-3 never contain the key.
Also name the chapter you based it on. Reply as JSON {"chapter":"<book chapter title>","items":[${ITEM_SHAPE}]}.`,
  user: (j) => JSON.stringify({ classLevel: j.classLevel, subject: j.subject, topicId: j.topic.topicId, skills: j.topic.skills, expectations: j.topic.expectations, misconceptions: (j.topic.misconceptions ?? []).map((m) => ({ id: m.id, belief: m.belief })) }),
  collect: (j, json) => (json?.items ?? []).slice(0, 16).map((it, i) => ({ id: `w3:${j.id}:${i}`, topicId: j.id, chapter: json.chapter ?? null, check: "blind", ...it })),
};

// ───────────────────────────── W4: placement banks for class 9 ─────────────────────────────

export const w4 = {
  name: "w4-placement-bank", cap: 8,
  plan(opts) {
    const jobs = [];
    for (const s of ["maths", "science"]) {
      if (existsSync(join(ROOT, `data/placement/c9-${s}.json`)) || !only(opts, `c9-${s}`)) continue;
      for (const band of ["early", "mid", "late", "below"]) jobs.push({ id: `c9-${s}-${band}`, stage: "author", subject: s, band, estIn: 2500, estOut: 4000 });
    }
    return jobs;
  },
  system: `You write placement questions for an Indian AI tutor's class-9 warm-up round (CBSE/NCERT 2025-26). ${AUDIENCE}
A placement question measures level, it does not teach: one step or two, answerable in a number (with unit) or a short
option choice, at most 35 words, no hints. "band" says where on the scale to aim: below (class 7-8 demand), early (start of
class 9), mid, late (end of class 9). Spread the questions across the year's chapters. format: numeric | mcq (mcq: 4 options,
exactly one correct). Reply as JSON {"items":[{"band":"","format":"","prompt_en":"","prompt_hi":"<Roman Hinglish>","answer":"","unit":"","options":[{"text":"","correct":false}],"topicRef":"c9-<subject>-chNN-tNN","demand":"recall|apply|reason"}]} with 10 items.`,
  user: (j) => JSON.stringify({ classLevel: 9, subject: j.subject, band: j.band, count: 10 }),
  collect: (j, json) => (json?.items ?? []).slice(0, 10).map((it, i) => ({ id: `pl-c9-${j.subject}-${j.band}-${i}`, check: "blind", ...it })),
};

export const WORKFLOWS = { g1, w1a, w1b, w1c, w2, w3, w4 };
