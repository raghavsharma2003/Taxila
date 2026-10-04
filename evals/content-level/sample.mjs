// Content-level audit (OWNER-RESET #2, 2026-10-04): draws the two item samples that docs/design/reset/CONTENT-LEVEL.md
// judges. Read-only over data/** and the real selection code; writes evals/content-level/out/samples.json.
//
//   A "bank":   60 items per class (4-7), seeded, stratified equally across that class's subjects
//               (4 subjects x 15 in classes 4-5; 5 subjects x 12 in classes 6-7). Measures what the kits contain.
//   B "served": for EVERY topic of classes 4-7, the first 3 items of the real practice queue
//               (server/director/items.js buildPracticeQueue on server/content/kits.js kitFromFile), i.e. what a
//               child with no history is actually asked first. Measures what children see.
//
// Run: node evals/content-level/sample.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { getTopic, topicSequence } from "../../server/content/curriculum.js";
import { kitFromFile } from "../../server/content/kits.js";
import { buildPracticeQueue, findItem } from "../../server/director/items.js";

const SEED = 20261004;
const PER_CLASS = 60;
const CLASSES = [4, 5, 6, 7];
const SUBJECTS = { 4: ["maths", "evs", "english", "hindi"], 5: ["maths", "evs", "english", "hindi"],
  6: ["maths", "science", "english", "hindi", "sst"], 7: ["maths", "science", "english", "hindi", "sst"] };

function prng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const rnd = prng(SEED);
const shuffle = (xs) => xs.map((x) => [rnd(), x]).sort((a, b) => a[0] - b[0]).map(([, x]) => x);

const row = (topic, it, extra = {}) => ({
  id: it.id, class: topic.classLevel, subject: topic.subject, book: topic.book,
  chapter: topic.chapter.title, topic: topic.title, outcomes: topic.outcomes,
  kind: it.kind, kitDifficulty: it.difficulty, prompt: it.prompt_en || it.prompt_hi, prompt_hi: it.prompt_hi, answer: it.answer, ...extra,
});

const bank = [], served = [], full = [];
for (const c of CLASSES) {
  const subs = SUBJECTS[c];
  const per = Math.floor(PER_CLASS / subs.length);
  for (const s of subs) {
    const pool = [];
    for (const tid of topicSequence(c, s)) {
      const topic = getTopic(tid);
      const kit = kitFromFile(topic);
      if (!kit) continue;
      for (const it of kit.items) { pool.push(row(topic, it)); full.push(row(topic, it, { topicOrder: topic.order })); }
      // B: the real queue head
      const q = buildPracticeQueue(kit);
      const s0 = { itemsDone: [], skipped: [], skills: {}, seed: SEED, ctx: {} };
      q.slice(0, 3).forEach((id, pos) => {
        const it = findItem(s0, kit, id);
        if (it) served.push(row(topic, it, { queuePos: pos + 1, topicOrder: topic.order, diagnostic: !!it.diagnostic }));
      });
    }
    bank.push(...shuffle(pool).slice(0, per));
  }
}
mkdirSync(new URL("./out/", import.meta.url), { recursive: true });
writeFileSync(new URL("./out/samples.json", import.meta.url), JSON.stringify({ seed: SEED, date: "2026-10-04", bank, served }, null, 1));
writeFileSync(new URL("./out/full.json", import.meta.url), JSON.stringify(full));
console.log(`full ${full.length}; bank ${bank.length} items; served ${served.length} items over ${new Set(served.map((r) => r.topic + r.class)).size} topics`);
