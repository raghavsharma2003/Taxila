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
export function findTopic(query, classLevel) {
  const words = String(query ?? "").toLowerCase().normalize("NFC").split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 4);
  if (!words.length) return null;
  // round 3 fix: each word must START a word of the title ("fraction" → "Fractions"), never sit inside one ("time" was found
  // in "Centimetres and metres", and a child asking for time would have been offered the length lesson)
  const res = words.map((w) => new RegExp(`(?<![\\p{L}\\p{N}])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "u"));
  const has = (text) => { const t = String(text ?? "").toLowerCase(); return res.every((re) => re.test(t)); };
  const cls = Number(classLevel);
  for (const field of ["title", "chapter"]) {
    for (const subject of SUBJECT_ORDER) {
      for (const id of topicSequence(cls, subject)) {
        const t = getTopic(id);
        if (t && has(field === "title" ? t.title : t.chapter?.title)) return t;
      }
    }
  }
  return null;
}
