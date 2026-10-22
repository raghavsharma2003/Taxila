// NCERT syllabus graph (data/curriculum/c{class}-{subject}.json), loaded once and kept in memory.
// Topic order inside a file IS the teaching order (chapter number, then topic position).
// Deploy note: these files are read with fs at runtime, so the Vercel function must include data/**.
import { readFileSync, readdirSync } from "fs";

const DIR = new URL("../../data/curriculum/", import.meta.url);
const FILE_RE = /^c(\d+)-([a-z]+)\.json$/;

/** Subjects in the order nextTopicFor tries them (kits exist for these first). */
export const SUBJECT_ORDER = ["maths", "science", "evs", "english", "hindi", "sst"];

/**
 * @typedef {{ id: string, title: string, outcomes: string[], prerequisites: string[], misconceptions: string[],
 *   hooks: string[], classLevel: number, subject: string, book: string,
 *   chapter: { id: string, number: number, title: string }, order: number }} Topic
 */

let _index = null;

function load() {
  if (_index) return _index;
  /** @type {Map<string, Topic>} */
  const topics = new Map();
  /** @type {Map<string, string[]>} "class:subject" → topic ids in teaching order */
  const sequence = new Map();
  for (const file of readdirSync(DIR).filter((f) => FILE_RE.test(f)).sort()) {
    const d = JSON.parse(readFileSync(new URL(file, DIR), "utf8"));
    const ids = [];
    for (const ch of [...(d.chapters || [])].sort((a, b) => a.number - b.number)) {
      for (const t of ch.topics || []) {
        topics.set(t.id, {
          id: t.id, title: t.title, outcomes: t.outcomes || [], prerequisites: t.prerequisites || [],
          misconceptions: t.misconceptions || [], hooks: t.hooks || [],
          classLevel: d.class, subject: d.subject, book: d.book,
          chapter: { id: ch.id, number: ch.number, title: ch.title }, order: ids.length,
        });
        ids.push(t.id);
      }
    }
    sequence.set(`${d.class}:${d.subject}`, ids);
  }
  _index = { topics, sequence };
  return _index;
}

/** @returns {Topic | null} */
export function getTopic(topicId) {
  return load().topics.get(topicId) ?? null;
}

/** Topic ids for one class and subject, in teaching order ([] if the book is not in the seed). */
export function topicSequence(classLevel, subject) {
  return load().sequence.get(`${classLevel}:${subject}`) ?? [];
}

/**
 * Longest curriculum topic id that prefixes `id` — how a skill or misconception id generated for a
 * mini-kit (`<topicId>-s1`, `<topicId>-m1`) is traced back to its topic.
 */
export function topicIdByPrefix(id) {
  let best = null;
  for (const tid of load().topics.keys()) {
    if (id.startsWith(tid + "-") && (!best || tid.length > best.length)) best = tid;
  }
  return best;
}

/**
 * round 3 fix (experience B8): the topic of the child's class that a child's own words name ("photosynthesis padhna hai"),
 * or null. Word match on the topic title, then the chapter title (words of 4+ letters, case-insensitive), in the subjects'
 * teaching order. PURE over the loaded syllabus.
 * @returns {Topic | null}
 */
// census 14.5 (F1 round 3, main: 38aad918 c4 "geometry padhao, triangles" was told geometry is not in class 5, which has
// "Shapes and Patterns"): the everyday name of a subject a child asks for, and the words its chapters are titled with. Tried
// in this order only when the child's own words name no topic; curated, never model output.
// census 14.5 (F1 round 3, main: 38aad918 c4 "geometry padhao, triangles" was told geometry is not in class 5, which has
// "Triangles and polygons"): the everyday name of a subject a child asks for, the school subjects it belongs to, and the
// words its TOPIC titles use (never the chapter titles: "Animal Jumps" is a maths chapter). Tried in this order only when
// the child's own words name no topic; curated, never model output.
const SUBJECT_WORDS = [
  ["geometry", ["maths"], ["triangle","shape","angle","polygon","circle","symmetr"]],
  ["shapes", ["maths"], ["shape","triangle","polygon"]],
  ["shape", ["maths"], ["shape","triangle"]],
  ["triangles", ["maths"], ["triangle"]],
  ["triangle", ["maths"], ["triangle"]],
  ["आकार", ["maths"], ["shape"]],
  ["त्रिभुज", ["maths"], ["triangle"]],
  ["ज्यामिति", ["maths"], ["triangle","shape","angle"]],
  ["aakar", ["maths"], ["shape"]],
  ["trikon", ["maths"], ["triangle"]],
  ["algebra", ["maths"], ["algebra","equation","variable","expression"]],
  ["equations", ["maths"], ["equation"]],
  ["बीजगणित", ["maths"], ["algebra","equation"]],
  ["measurement", ["maths"], ["measur","length","metre"]],
  ["naap", ["maths"], ["measur","length"]],
  ["time", ["maths"], ["time","clock","second","minute","hour"]],
  ["samay", ["maths"], ["time","clock"]],
  ["money", ["maths"], ["money","rupee"]],
  ["paise", ["maths"], ["money","rupee"]],
  ["multiplication", ["maths"], ["multipl"]],
  ["guna", ["maths"], ["multipl"]],
  ["division", ["maths"], ["divid","division"]],
  ["bhag", ["maths"], ["divid","division"]],
  ["addition", ["maths"], ["add"]],
  ["jod", ["maths"], ["add"]],
  ["subtraction", ["maths"], ["subtract"]],
  ["ghata", ["maths"], ["subtract"]],
  ["graphs", ["maths"], ["graph","data"]],
  ["graph", ["maths"], ["graph","data"]],
  ["data", ["maths"], ["data","graph"]],
  ["decimals", ["maths"], ["decimal"]],
  ["numbers", ["maths"], ["number"]],
  ["counting", ["maths"], ["count","number"]],
  ["ginti", ["maths"], ["count","number"]],
  ["plants", ["science","evs"], ["plant"]],
  ["paudhe", ["science","evs"], ["plant"]],
  ["पौधे", ["science","evs"], ["plant"]],
  ["animals", ["science","evs"], ["animal"]],
  ["janwar", ["science","evs"], ["animal"]],
  ["जानवर", ["science","evs"], ["animal"]],
  ["body", ["science","evs"], ["body","organ"]],
  ["sharir", ["science","evs"], ["body"]],
  ["water", ["science","evs"], ["water"]],
  ["paani", ["science","evs"], ["water"]],
  ["food", ["science","evs"], ["food"]],
  ["khana", ["science","evs"], ["food"]],
  ["electricity", ["science","evs"], ["electric","circuit"]],
  ["bijli", ["science","evs"], ["electric","circuit"]],
  ["magnets", ["science","evs"], ["magnet"]],
  ["light", ["science","evs"], ["light","shadow"]],
  ["sound", ["science","evs"], ["sound"]],
  ["space", ["sst","science","evs"], ["planet","solar system","moon","star","eclipse"]],
  ["planets", ["sst","science","evs"], ["planet","solar system"]],
  ["solar system", ["sst","science","evs"], ["solar","planet"]],
  ["stars", ["sst","science","evs"], ["star"]],
  ["moon", ["sst","science","evs"], ["moon"]],
  ["maps", ["sst","science","evs"], ["map"]],
  ["directions", ["sst","science","evs"], ["direction","map"]],
  ["weather", ["sst","science","evs"], ["weather","climate"]],
  ["history", ["sst","science","evs"], ["histor","kingdom","empire"]],
  ["itihas", ["sst","science","evs"], ["histor"]],
];
/** The topic of a child's class their everyday subject word means (SUBJECT_WORDS), or null. */
function findTopicBySubject(query, classLevel) {
  const q = String(query ?? "").toLowerCase().normalize("NFC").trim();
  for (const [k, subjects, ws] of SUBJECT_WORDS) {
    if (!new RegExp(`(?<![\\p{L}\\p{M}])${k}(?![\\p{L}\\p{M}])`, "u").test(q)) continue;
    for (const w of ws) { const t = findTopicLiteral(w, classLevel, { fields: ["title"], subjects }); if (t) return t; }
  }
  return null;
}

export function findTopic(query, classLevel) {
  return findTopicLiteral(query, classLevel) ?? findTopicBySubject(query, classLevel);
}

function findTopicLiteral(query, classLevel, { fields = ["title", "chapter"], subjects = SUBJECT_ORDER } = {}) {
  const words = String(query ?? "").toLowerCase().normalize("NFC").split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 4);
  if (!words.length) return null;
  // round 3 fix: each word must START a word of the title ("fraction" → "Fractions"), never sit inside one ("time" was found
  // in "Centimetres and metres", and a child asking for time would have been offered the length lesson)
  const res = words.map((w) => new RegExp(`(?<![\\p{L}\\p{N}])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "u"));
  const has = (text) => { const t = String(text ?? "").toLowerCase(); return res.every((re) => re.test(t)); };
  const cls = Number(classLevel);
  for (const field of fields) {
    for (const subject of subjects) {
      for (const id of topicSequence(cls, subject)) {
        const t = getTopic(id);
        if (t && has(field === "title" ? t.title : t.chapter?.title)) return t;
      }
    }
  }
  return null;
}
