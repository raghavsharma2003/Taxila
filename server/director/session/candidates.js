// The CLOSED candidate set an intake frame is mapped onto (TUTOR-MODEL §2.3 point 2): never the whole graph. It holds
//   - the child's class, in the subject they named (else today's timetable subjects, else every subject of the class);
//   - one class below in the same subject(s), for the back-chain (weighted down);
//   - a prior toward the chapters near where the school is (the pointer, ±2), so a class-6 child's "angles" is the class-6
//     chapter, never the class-5 one (the probe's error).
// Scoring is lexical over the topic's title (3), chapter title (2) and outcomes / mix-ups / hooks (1), on the concept tokens
// of server/lesson/purpose.js (imported, unchanged) plus the alias layer below (school vocabulary → syllabus words or ids).
// Activity words (intake.js ACTIVITY_WORDS) never score. PURE over the loaded syllabus; no model, no child id.

import { getTopic, topicSequence, SUBJECT_ORDER } from "../../content/curriculum.js";
import { conceptTokens, tokens } from "../../lesson/purpose.js";
import { ACTIVITY_WORDS, contentWords } from "./intake.js";
import { CONFIRM_MIN_P } from "./flags.js";

/**
 * School vocabulary → syllabus words (a reviewed list, child-free, library-level: TUTOR-MODEL §2.3 point 3). Each entry is
 * matched on the child's words; `adds` are concept words fed to the scorer, `ids` are topic or chapter id PREFIXES that
 * score directly (for books whose titles are proper nouns: SST, the language readers). Written from the syllabus files and
 * school usage, never from a test set.
 */
export const ALIASES = Object.freeze([
  { rx: /\btables?\s+(?:of\s+)?\d+|\d+\s+ka\s+(?:table|pahada)|\bpahad[ae]\b|\bmultiplication\s+tables?\b|\btimes\s+tables?\b|पहाड़े?/i, adds: "multiplication times facts groups" },
  { rx: /\b(?:lcm|l\.c\.m|lasa|laghutam)\b/i, adds: "lowest common multiple multiples" },
  { rx: /\b(?:hcf|h\.c\.f|gcd|g\.c\.d|gcf|masa|mahattam)\b/i, adds: "highest common factor factors" },
  { rx: /\b(?:bodmas|brackets?)\b/i, adds: "brackets order evaluation expressions" },
  { rx: /\b(?:algebra|variables?|x\s+ki\s+value|letter\s+numbers?)\b/i, adds: "letters expressions algebra" },
  { rx: /\b(?:equations?|samikaran)\b|समीकरण/i, adds: "equations unknown solving" },
  { rx: /\b(?:decimals?|point\s+wale|dashamlav)\b|दशमलव/i, adds: "decimal decimals tenths" },
  { rx: /\d+\s*\/\s*\d+.{0,40}\b(?:same|equal|barabar|equivalent|ek\s+jaise)\b|\b(?:same|equal|barabar|equivalent)\b.{0,40}\d+\s*\/\s*\d+/i, adds: "equivalent fractions fraction" },
  { rx: /\b(?:negative\s+numbers?|minus\s+(?:wale|numbers?)|purnank|integers?)\b|पूर्णांक/i, adds: "integers integer zero" },
  { rx: /\b(?:percent(?:age)?|pratishat|%|profit|loss|discount)\b|प्रतिशत/i, adds: "percentages percentage" },
  { rx: /\b(?:ratio|anupat|proportion)\b|अनुपात/i, adds: "ratio ratios proportional" },
  { rx: /\b(?:squares?\s+roots?|cube\s+roots?|vargmool|varg)\b|वर्गमूल/i, adds: "square roots cubes" },
  { rx: /\b(?:exponents?|powers?|ghatank)\b|घातांक/i, adds: "exponents exponential powers" },
  { rx: /\b(?:pythagoras|baudhayana|hypotenuse)\b/i, adds: "pythagoras baudhayana theorem right triangles" },
  { rx: /\b(?:graphs?|bar\s+graphs?|pictographs?|data|tally)\b/i, adds: "data graphs pictographs" },
  { rx: /\b(?:mean|median|mode|average|ausat)\b|औसत/i, adds: "mean median mode representative" },
  { rx: /\b(?:prime|composite|abhajya)\b|अभाज्य/i, adds: "prime composite factorisation" },
  { rx: /\b(?:divisibility|divisible|vibhajyata)\b/i, adds: "divisibility" },
  { rx: /\b(?:angles?|kon|kone|acute|obtuse|reflex|degrees?)\b|कोण/i, adds: "angles angle" },
  { rx: /\b(?:triangles?|trikon|tribhuj)\b|त्रिभुज/i, adds: "triangles triangle" },
  { rx: /\b(?:perimeter|parimaap|parimap)\b|परिमाप/i, adds: "perimeter" },
  { rx: /\b(?:area|kshetrafal|chhetrafal)\b|क्षेत्रफल/i, adds: "area" },
  { rx: /\b(?:symmetry|symmetrical|saman?mit)\b|सममित/i, adds: "symmetry symmetrical" },
  { rx: /\b(?:clock|ghadi|time|samay)\b|घड़ी|समय/i, adds: "time clock" },
  { rx: /\b(?:photosynthesis|prakash\s+sanshleshan)\b|प्रकाश\s*संश्लेषण/i, adds: "photosynthesis plants food" },
  { rx: /\b(?:magnets?|chumbak|chumbakiya)\b|चुंबक|चुम्बक/i, adds: "magnets magnet magnetic" },
  { rx: /\b(?:electricity|current|circuits?|bijli|bulb|battery|cell)\b|बिजली/i, adds: "electricity circuits electric" },
  { rx: /\b(?:acids?|bases?|indicators?|litmus|amla|kshar)\b|अम्ल|क्षार/i, adds: "acidic basic indicators" },
  { rx: /\b(?:nutrients?|carbohydrates?|proteins?|vitamins?|balanced\s+diet|poshan|pachan)\b|पोषण/i, adds: "food components nutrients diet" },
  { rx: /\b(?:digestion|digestive|pachan\s+tantra)\b|पाचन/i, adds: "digestion" },
  { rx: /\b(?:respiration|breathing|saans|shwasan)\b|श्वसन/i, adds: "respiration" },
  { rx: /\b(?:evaporation|condensation|vashpikaran|states?\s+of\s+(?:water|matter)|solid\s+liquid\s+gas)\b|वाष्पीकरण/i, adds: "evaporation states water" },
  { rx: /\b(?:separation|filtration|sieving|winnowing|threshing|decantation|sedimentation)\b/i, adds: "separation sieving filtration" },
  { rx: /\b(?:light|shadows?|reflection|mirrors?|lens|lenses|parchai|prakash)\b|परछाई|प्रकाश/i, adds: "light shadow reflection" },
  { rx: /\b(?:heat|conduction|convection|radiation|garmi)\b/i, adds: "heat conduction convection" },
  { rx: /\b(?:force|forces|push|pull|friction|bal)\b|(?<![\p{L}\p{M}])बल(?![\p{L}\p{M}])|घर्षण/iu, adds: "force forces" },
  { rx: /\b(?:motion|speed|velocity|gati)\b|गति/i, adds: "motion speed" },
  { rx: /\b(?:cells?|koshika|microorganisms?|bacteria|microbes?)\b|कोशिका/i, adds: "cells cell microorganisms" },
  { rx: /\b(?:solar\s+system|planets?|grah|stars?|constellations?|taare|universe)\b|ग्रह|तारे/i, adds: "solar system stars" },
  { rx: /\b(?:eclipse|grahan|seasons?|mausam|rotation|revolution)\b|ग्रहण/i, adds: "eclipses seasons rotation" },
  { rx: /\b(?:metals?|non[\s-]*metals?|dhatu|rust(?:ing)?)\b|धातु/i, adds: "metals non-metals rusting" },
  { rx: /\b(?:physical\s+(?:and|aur)\s+chemical|chemical\s+changes?|physical\s+changes?)\b/i, adds: "physical chemical changes" },
  { rx: /\b(?:habitat|living\s+things|non[\s-]*living|sajeev|nirjeev)\b/i, adds: "living characteristics habitats" },
  { rx: /\b(?:germination|life\s+cycles?|ankuran)\b/i, adds: "germination life cycles" },
  { rx: /\b(?:float(?:ing|s)?|sink(?:ing|s)?|tairna|tairti|tairta|doobna|doobti|doobta)\b|तैर|डूब/i, adds: "floating sinking" },
  { rx: /\b(?:nouns?|sangya)\b|संज्ञा/i, adds: "nouns noun" },
  { rx: /\b(?:verbs?|kriya)\b|क्रिया/i, adds: "verbs verb" },
  { rx: /\b(?:adjectives?|visheshan)\b|विशेषण/i, adds: "adjectives adjective" },
  { rx: /\b(?:pronouns?|sarvanam)\b|सर्वनाम/i, adds: "pronouns pronoun" },
  { rx: /\b(?:tenses?|kaal)\b|काल/i, adds: "tense tenses" },
  { rx: /\b(?:poem|poems|kavita|kavitaen|poetry|rhyme)\b|कविता/i, adds: "poem" },
  { rx: /\b(?:dohe|doha|dohas)\b|दोहे|दोहा/i, adds: "dohe" },
  // SST and the readers: titles are proper nouns, so the school words name chapters directly
  { rx: /\b(?:mughals?|mughal\s+empire|akbar|babur|humayun|shah\s+jahan|aurangzeb|delhi\s+sultanate|sultanate|sultans?)\b|मुग़ल|मुगल|अकबर/i, ids: ["c8-sst-ch02", "c8-sst-ch15", "c7-sst-ch16"] },
  { rx: /\b(?:marathas?|shivaji|peshwa)\b|मराठा|शिवाजी/i, ids: ["c8-sst-ch03"] },
  { rx: /\b(?:british|east\s+india\s+company|colonial|angrez|company\s+rule)\b|अंग्रेज/i, ids: ["c8-sst-ch04", "c8-sst-ch09"] },
  { rx: /\b(?:freedom\s+struggle|independence|gandhi|azadi|swatantrata|quit\s+india)\b|आज़ादी|स्वतंत्रता|गांधी/i, ids: ["c8-sst-ch09"] },
  { rx: /\b(?:elections?|voting|vote|chunav|matdan)\b|चुनाव/i, ids: ["c8-sst-ch05", "c9-sst-ch07"] },
  { rx: /\b(?:parliament|lok\s+sabha|rajya\s+sabha|sansad)\b|संसद/i, ids: ["c8-sst-ch06"] },
  { rx: /\b(?:judiciary|courts?|nyaypalika|supreme\s+court)\b|न्यायपालिका/i, ids: ["c8-sst-ch11"] },
  { rx: /\b(?:constitution|samvidhan)\b|संविधान/i, ids: ["c7-sst-ch10"] },
  { rx: /\b(?:panchayat|gram\s+sabha|sarpanch)\b|पंचायत/i, ids: ["c6-sst-ch11"] },
  { rx: /\b(?:municipal|nagar\s+nigam|ward)\b/i, ids: ["c6-sst-ch12"] },
  { rx: /\b(?:harappa|harappan|indus|sindhu)\b|हड़प्पा|सिंधु/i, ids: ["c6-sst-ch06"] },
  { rx: /\b(?:latitude|longitude|globe|maps?|naksha|equator|akshansh|deshantar)\b|अक्षांश|देशांतर/i, ids: ["c6-sst-ch01"] },
  { rx: /\b(?:continents?|oceans?|mahadweep|mahasagar)\b|महाद्वीप|महासागर/i, ids: ["c6-sst-ch02"] },
  { rx: /\b(?:mountains?|plateaus?|plains?|landforms?|pathar|pahad)\b/i, ids: ["c6-sst-ch03", "c4-evs-ch09"] },
  { rx: /\b(?:weather|climate|monsoon|jalvayu|mausam)\b|जलवायु/i, ids: ["c7-sst-ch02", "c7-sst-ch03", "c9-sst-ch03"] },
  { rx: /\b(?:gupta|guptas)\b|गुप्त/i, ids: ["c7-sst-ch07"] },
  { rx: /\b(?:maurya|mauryan|ashoka|chandragupta|magadha|empires?)\b|मौर्य|अशोक/i, ids: ["c7-sst-ch05"] },
  { rx: /\b(?:barter|money|paisa|rupee)\b/i, ids: ["c7-sst-ch11", "c3-maths-ch12"] },
  { rx: /\b(?:markets?|bazaar|bazar)\b/i, ids: ["c7-sst-ch12"] },
  { rx: /\b(?:banks?|loan|interest|finance)\b/i, ids: ["c7-sst-ch20", "c9-sst-ch16"] },
  { rx: /\b(?:farming|farmers?|agriculture|kheti|kisan)\b|खेती|किसान/i, ids: ["c7-sst-ch13"] },
  { rx: /\b(?:population|jansankhya)\b|जनसंख्या/i, ids: ["c8-sst-ch13"] },
  { rx: /\b(?:resources?|natural\s+resources?|sansadhan)\b|संसाधन/i, ids: ["c8-sst-ch01", "c6-science-ch11"] },
  { rx: /\b(?:rights?|duties|citizenship|adhikar|kartavya)\b|अधिकार|कर्तव्य/i, ids: ["c8-sst-ch12"] },
  { rx: /\b(?:architecture|temples?|monuments?|stupa)\b/i, ids: ["c8-sst-ch10"] },
  { rx: /\b(?:timeline|bc|bce|sources\s+of\s+history)\b/i, ids: ["c6-sst-ch04"] },
  { rx: /\b(?:raven|fox|kauwa|lomdi)\b/i, ids: ["c6-english-ch02"] },
  { rx: /\b(?:chandrayaan|chandrayan)\b|चंद्रयान/i, ids: ["c3-english-ch12", "c3-hindi-ch16"] },
  { rx: /\b(?:kabir)\b|कबीर/i, ids: ["c8-hindi-ch05"] },
  { rx: /\b(?:rahim)\b|रहीम/i, ids: ["c6-hindi-ch05"] },
  { rx: /\b(?:meera|mira)\b|मीरा/i, ids: ["c7-hindi-ch10"] },
  { rx: /\b(?:chetak)\b|चेतक/i, ids: ["c6-hindi-ch11"] },
  { rx: /\b(?:jhansi|rani\s+laxmibai|lakshmibai)\b|झाँसी|झांसी/i, ids: ["c9-hindi-ch11"] },
  { rx: /\b(?:do\s+bailon|bail(?:on)?\s+ki\s+katha|hira\s+moti)\b|दो\s+बैलों/i, ids: ["c9-hindi-ch01"] },
  { rx: /\b(?:birbal|khichdi)\b|बीरबल|खिचड़ी/i, ids: ["c3-hindi-ch06"] },
]);

let INDEX = null, VOCAB = null;
/** Every Latin title / chapter word of the syllabus (stemmed), for the misspelling step. */
function vocab() {
  if (VOCAB) return VOCAB;
  VOCAB = new Set();
  for (const bySubject of index().values()) for (const list of bySubject.values()) for (const tp of list) for (const w of [...tp.title, ...tp.chapter]) if (/^[a-z]{4,}$/.test(w)) VOCAB.add(w);
  return VOCAB;
}
/** Edit distance with a cap (early exit). */
function within(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = cur[0];
    for (let j = 1; j <= b.length; j++) { cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); best = Math.min(best, cur[j]); }
    if (best > max) return false;
    prev = cur;
  }
  return prev[b.length] <= max;
}
/** The one syllabus word within reach of a misspelt word (none when two or more are equally near: never a guess). */
function nearestVocab(w) {
  for (const max of w.length >= 7 ? [1, 2] : [1]) {
    const hits = [...vocab()].filter((v) => v[0] === w[0] || max === 1 ? within(w, v, max) : false);
    if (hits.length === 1) return hits[0];
    if (hits.length > 1) return null;
  }
  return null;
}
const setOf = (s) => new Set(tokens(s).filter((x) => x.length >= 3));
/** class → subject → [{ id, chapterId, chapterNumber, title, chapter, body }] (built once). */
function index() {
  if (INDEX) return INDEX;
  INDEX = new Map();
  for (let cl = 1; cl <= 9; cl++) {
    const bySubject = new Map();
    for (const subject of SUBJECT_ORDER) {
      const list = topicSequence(cl, subject).map((id) => {
        const t = getTopic(id);
        return { id, subject, classLevel: cl, chapterId: t.chapter.id, chapterNumber: t.chapter.number, chapterTitle: t.chapter.title, titleText: t.title,
          title: setOf(t.title), chapter: setOf(t.chapter.title), body: setOf([...t.outcomes, ...t.misconceptions, ...t.hooks].join(" ")) };
      });
      if (list.length) bySubject.set(subject, list);
    }
    INDEX.set(cl, bySubject);
  }
  return INDEX;
}

/** The subjects a class has (its syllabus files), e.g. classes 3-5 have evs and no science/sst. */
export const subjectsOfClass = (cl) => [...(index().get(Number(cl))?.keys() ?? [])];

/** A named subject in the child's class: "science" in classes 3-5 is the EVS book; "evs" from class 6 is science. */
export function subjectInClass(subject, cl) {
  const have = subjectsOfClass(cl);
  if (!subject) return null;
  if (have.includes(subject)) return subject;
  if (subject === "science" && have.includes("evs")) return "evs";
  if (subject === "evs" && have.includes("science")) return "science";
  if (subject === "sst" && have.includes("evs")) return "evs";
  return null;
}

/** The query's tokens: concept tokens (purpose.js) of the content words + alias words; ids an alias names. */
export function queryOf(text) {
  const words = contentWords(text).filter((w) => !ACTIVITY_WORDS.has(w));
  const q = conceptTokens(words.join(" "));
  // Devanagari words meet Devanagari titles as they are (purpose.js conceptTokens keeps only the ones it has a synonym for):
  // "हार की जीत", "तीन मछलियाँ", "नीम"
  for (const w of words) if (/[\u0900-\u097F]/.test(w) && w.length >= 2) q.add(w.normalize("NFC"));
  // a misspelt school word ("simetry", "divison", "devide") meets the syllabus word one or two letters away (never a word the
  // syllabus already has; ≥ 5 letters; 2 edits only from 7 letters)
  for (const w of [...q]) {
    if (!/^[a-z]{5,}$/.test(w) || vocab().has(w)) continue;
    const near = nearestVocab(w);
    if (near) q.add(near);
  }
  const ids = [];
  for (const a of ALIASES) {
    if (!a.rx.test(String(text ?? ""))) continue;
    if (a.adds) for (const w of tokens(a.adds)) q.add(w);
    if (a.ids) ids.push(...a.ids);
  }
  for (const w of [...q]) if (ACTIVITY_WORDS.has(w)) q.delete(w);
  return { tokens: q, ids };
}

/** Score weights (exported for tests and the report). */
export const W = Object.freeze({ title: 3, chapter: 2, body: 1, aliasId: 6, pointerAt: 2.5, pointerNear: 1.5, classBelow: 2, minScore: 3 });

/**
 * PURE. The closed candidate set for a frame, ranked, with a confidence p for the top pick.
 * @param {{ kind: string, subject: string|null }} frame   intake.js frame
 * @param {string} text                                      the child's words
 * @param {{ classLevel: number, subjects?: string[], pointer?: Record<string, number> }} ctx
 *   subjects: today's timetable subjects (a parent setting or the plan); pointer: the school's current chapter per subject
 * @returns {{ candidates: { topicId: string, chapterId: string, subject: string, score: number, p: number, via: string }[], top: object|null, p: number, abstain: boolean, ask: object[]|null }}
 */
export function intakeCandidates(frame, text, ctx = {}) {
  const cl = Number(ctx.classLevel) || 5;
  const none = { candidates: [], top: null, p: 0, abstain: true, ask: null };
  if (!frame || ["safety", "nothing", "unknown", "share"].includes(frame.kind)) return none;
  const named = subjectInClass(frame.subject, cl);
  // a want may be any subject of the class (tier a); everything else is what the school can be teaching: the named subject,
  // else the timetable's, else every subject of the class
  const subjects = named ? [named]
    : frame.kind !== "want" && ctx.subjects?.length ? ctx.subjects.map((s) => subjectInClass(s, cl)).filter(Boolean)
      : subjectsOfClass(cl);
  const q = queryOf(text);
  const pointer = ctx.pointer ?? {};
  const scored = [];
  for (const d of [0, 1]) {
    const c = cl - d;
    if (c < 1) break;
    for (const s of subjects) {
      for (const tp of index().get(c)?.get(subjectInClass(s, c) ?? s) ?? []) {
        let lex = 0;
        for (const w of q.tokens) lex += ((tp.title.has(w) ? W.title : 0) + (tp.chapter.has(w) ? W.chapter : 0) + (tp.body.has(w) ? W.body : 0)) * (q.tokens.boost?.has(w) ? 2 : 1);
        const viaAlias = q.ids.some((p) => tp.id.startsWith(p));
        if (viaAlias) lex += W.aliasId;
        if (!lex) continue;
        let score = lex - d * W.classBelow;
        const ptr = d === 0 ? Number(pointer[tp.subject]) : NaN;
        if (Number.isFinite(ptr)) score += tp.chapterNumber === ptr ? W.pointerAt : Math.abs(tp.chapterNumber - ptr) <= 2 ? W.pointerNear : 0;
        scored.push({ topicId: tp.id, chapterId: tp.chapterId, subject: tp.subject, classLevel: c, title: tp.titleText, score, via: viaAlias ? "alias" : "lexical" });
      }
    }
  }
  // the child's own class first: a class-below topic is a candidate only when the own class has nothing that scores (the
  // back-chain is the Director's job once a topic is confirmed: next-topic.js pickTopic; TUTOR-MODEL §2.3 point 2)
  if (scored.some((x) => x.classLevel === cl && x.score >= W.minScore)) for (let i = scored.length - 1; i >= 0; i--) if (scored[i].classLevel < cl) scored.splice(i, 1);
  scored.sort((a, b) => b.score - a.score || (a.topicId < b.topicId ? -1 : 1));
  // a subject with no topic words ("aaj maths mein kuch naya padhaya"): the pointer's chapter is the best guess, never certain
  if (!scored.length || scored[0].score < W.minScore) {
    if (named && Number.isFinite(Number(pointer[named])) && ["taught", "not_understood", "test", "homework"].includes(frame.kind)) {
      const at = (index().get(cl)?.get(named) ?? []).filter((tp) => tp.chapterNumber === Number(pointer[named]) || tp.chapterNumber === Number(pointer[named]) + 1);
      const chapters = [...new Map(at.map((tp) => [tp.chapterId, tp])).values()].slice(0, 2)
        .map((tp) => ({ topicId: tp.id, chapterId: tp.chapterId, subject: tp.subject, classLevel: cl, title: tp.chapterTitle, score: 0, via: "pointer" }));
      if (chapters.length) return { candidates: chapters.map((c, i) => ({ ...c, p: i === 0 ? 0.45 : 0.3 })), top: { ...chapters[0], p: 0.45 }, p: 0.45, abstain: false, ask: chapters.length >= 2 ? chapters : null };
    }
    return none;
  }
  // one pick per chapter (siblings are the same idea); confidence from the margin over the best OTHER chapter
  const byChapter = [];
  for (const x of scored) if (!byChapter.some((y) => y.chapterId === x.chapterId)) byChapter.push(x);
  const best = byChapter[0], runner = byChapter[1];
  const margin = runner ? best.score - runner.score : best.score;
  const p = Math.max(0.05, Math.min(0.95, 0.35 + 0.08 * Math.min(best.score, 8) + 0.06 * Math.min(margin, 5) - (best.classLevel < cl ? 0.1 : 0)));
  const candidates = byChapter.slice(0, 4).map((x, i) => ({ ...x, p: i === 0 ? p : Math.max(0.05, Math.min(0.9, p * (x.score / Math.max(best.score, 1)) * 0.7)) }));
  return { candidates, top: candidates[0], p, abstain: false, ask: p < CONFIRM_MIN_P && candidates.length >= 2 ? candidates.slice(0, 2) : null };
}
