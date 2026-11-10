// Homework help, the match ladder (round 7 F, learning-homework-help; STUDENT-FLOW §4.2 `homework`; CONDUCTOR §6.3 pick-first).
// The child's homework question (typed now; a photo's extracted text later) → where it sits in the child's own class book,
// so the Ask beat (Brain) can teach the METHOD on a kit-verified look-alike, never solve their sheet.
//
// The ladder, first rung that holds:
//   kit_item  the question IS (nearly) a kit question of the child's class: same numbers, most of the same words
//   topic     the words name a topic or chapter of the child's class book (curriculum.js findTopic)
//   subject   only the subject is clear from its words (a subject vocabulary)
//   null      no match: the start still runs (the Ask beat asks what it is about)
// PURE apart from reading the kit files (cached by the loader). No model call.
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { findTopic, getTopic, SUBJECT_ORDER, topicSequence } from "../content/curriculum.js";

const KITS = join(dirname(fileURLToPath(import.meta.url)), "../../data/kits");
export const ITEM_MIN = 0.6;      // [U] word-overlap (Jaccard) for "this IS a kit question"
const STOP = new Set("the a an of to in on and or is are be by for with what which how many much find write if then its it this that from as at your you do does".split(" "));

/** PURE. Words and numbers of a question, lower case, Devanagari digits to ASCII, number words kept as written. */
export function tokens(text) {
  const t = String(text ?? "").normalize("NFC").toLowerCase().replace(/[०-९]/g, (d) => String("०१२३४५६७८९".indexOf(d)))
    .replace(/(\d),(?=\d)/g, "$1");
  return t.split(/[^\p{L}\p{M}\p{N}.]+/u).map((w) => w.replace(/^\.+|\.+$/g, "")).filter((w) => w && !STOP.has(w));
}
const numbersOf = (ws) => ws.filter((w) => /^\d+(\.\d+)?$/.test(w)).sort();
/** PURE. Overlap of two token lists (Jaccard on sets); 0 when their numbers differ (a different question). */
export function overlap(a, b) {
  const na = numbersOf(a).join(" "), nb = numbersOf(b).join(" ");
  if (na !== nb) return 0;
  const A = new Set(a), B = new Set(b);
  const inter = [...A].filter((w) => B.has(w)).length;
  return inter / (A.size + B.size - inter || 1);
}

const cache = new Map();
/** The child's class kits' items: [{ topicId, itemId, toks }]. */
function classItems(classLevel) {
  if (cache.has(classLevel)) return cache.get(classLevel);
  const out = [];
  for (const subject of SUBJECT_ORDER) {
    const f = join(KITS, `c${classLevel}-${subject}.json`);
    if (!existsSync(f)) continue;
    let kit; try { kit = JSON.parse(readFileSync(f, "utf8")); } catch { continue; }
    for (const t of kit.topics ?? []) for (const it of t.items ?? []) {
      for (const p of [it.prompt_en, it.prompt_hi]) if (p) out.push({ topicId: t.topicId, itemId: it.id, toks: tokens(p) });
    }
  }
  cache.set(classLevel, out);
  return out;
}

/** A small subject vocabulary for the last rung (whole words, any case; Roman Hindi and English). [U] */
export const SUBJECT_VOCAB = {
  maths: ["add", "subtract", "multiply", "divide", "fraction", "fractions", "sum", "difference", "product", "remainder", "perimeter", "area", "angle", "triangle", "number", "numbers", "equation", "jod", "ghatao", "guna", "bhag", "bhinn", "maths", "math", "mathematics", "ganit"],
  science: ["force", "light", "magnet", "cell", "plant", "plants", "acid", "motion", "energy", "electric", "circuit", "science", "vigyan"],
  evs: ["plant", "plants", "animal", "animals", "water", "food", "family", "pani", "evs", "paryavaran"],
  english: ["noun", "verb", "adjective", "sentence", "paragraph", "poem", "story", "grammar", "tense", "pronoun", "english", "angrezi"],
  hindi: ["संज्ञा", "क्रिया", "विशेषण", "कविता", "कहानी", "वाक्य", "व्याकरण"],
  sst: ["map", "history", "river", "mountain", "government", "democracy", "kingdom", "empire", "climate", "sst", "geography", "civics"],
};

/**
 * Words that never name a topic: Hinglish and English filler, and school-day activity words (rj-r4t-activity-word-as-topic:
 * "copy check ki" once found "Checking reasonableness"). [U]
 */
export const FILLER = new Set(("homework hw kaam work question questions sawal sawaal prashn exercise worksheet page copy notebook "
  + "check test revision class school teacher sir maam ma'am miss help solve answer answers karna karni karne kar karo kiya "
  + "diya diye mila likhna likho padhna samjhao samjha samajh batao ka ki ke ko se me mein mai main par pe hai hain tha thi "
  + "aur ya ye yeh woh wo kya kaise kaun mera meri mere mujhe hum humko aaj kal wala wali wale waala waali bhi toh please "
  + "about do my me i our today tomorrow got have has need want some").split(" "));

/** PURE. The words of a homework sentence that can name a topic, in order (fillers and stop words removed). */
export const topicWords = (text) => tokens(text).filter((w) => !FILLER.has(w) && !/^\d/.test(w));

/** The topic its words name: all of them together first, then each one alone (the first that names a topic). */
function topicFromWords(words, cls) {
  if (!words.length) return null;
  return findTopic(words.join(" "), cls) ?? (words.length > 1 ? words.map((w) => findTopic(w, cls)).find(Boolean) ?? null : null);
}

/**
 * PURE (apart from the cached kit read). The best rung for a homework question.
 * @param {string} text  @param {{ classLevel: number }} child
 * @returns {{ rung: 'kit_item'|'topic'|'subject', topicId: string|null, itemId?: string, subject: string, chapter: number|null, topicTitle: string|null, score?: number } | null}
 */
export function matchHomework(text, child) {
  const cls = Number(child?.classLevel ?? child?.class_level);
  const q = tokens(text);
  if (!q.length || !(cls >= 1 && cls <= 9)) return null;
  // rung 1: a kit question of the child's class
  let best = null;
  for (const it of classItems(cls)) {
    const s = overlap(q, it.toks);
    if (s >= ITEM_MIN && (!best || s > best.s || (s === best.s && it.itemId < best.it.itemId))) best = { s, it };
  }
  const shape = (rung, topicId, extra = {}) => {
    const t = topicId ? getTopic(topicId) : null;
    return { rung, topicId: t ? t.id : null, subject: extra.subject ?? t?.subject, chapter: t?.chapter?.number ?? null, topicTitle: t?.title ?? null, ...extra };
  };
  if (best) return shape("kit_item", best.it.topicId, { itemId: best.it.itemId, score: Math.round(best.s * 100) / 100 });
  // rung 2: a topic or chapter of the class book. findTopic needs EVERY long word to start a title word, so it is given the
  // topic words only (rj-r4t-findtopic-as-intake: a whole sentence never matches), then each of them alone.
  const t = topicFromWords(topicWords(text), cls);
  if (t) return shape("topic", t.id);
  // rung 3: the subject only
  const words = new Set(q);
  // only subjects the child's class has (EVS up to class 5, science and SST after)
  const hits = Object.entries(SUBJECT_VOCAB).filter(([s]) => topicSequence(cls, s).length > 0)
    .map(([s, vs]) => [s, vs.filter((v) => words.has(v)).length]).filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1] || SUBJECT_ORDER.indexOf(a[0]) - SUBJECT_ORDER.indexOf(b[0]));
  return hits.length ? { rung: "subject", topicId: null, subject: hits[0][0], chapter: null, topicTitle: null } : null;
}
