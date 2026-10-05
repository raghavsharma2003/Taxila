// What a new child is asked first, before and after RS-6, for every class 4-7 topic (385).
//   served-old: the current code (server/director/items.js buildPracticeQueue) over the current kits (data/kits).
//   served-new: the F0-patched queue (applied to a temp copy, see lib/f0-sandbox.mjs) over the kits merged with the
//               re-levelled overlay (data/kits-relevel, via data/kits-relevel/merge.mjs into a temp dir).
//   node evals/content-level-v2/served.mjs [old|new|both]
import { writeFileSync } from "node:fs";


const which = process.argv[2] || "both";
const OUT = new URL("./out/", import.meta.url);
const SUBJECTS = { 4: ["maths", "evs", "english", "hindi"], 5: ["maths", "evs", "english", "hindi"],
  6: ["maths", "science", "sst", "english", "hindi"], 7: ["maths", "science", "sst", "english", "hindi"] };
const S0 = () => ({ itemsDone: [], skipped: [], skills: {}, seed: 20261004, ctx: {} });

async function collect({ curriculum, kits, items, f0 }) {
  const rows = [];
  for (const c of [4, 5, 6, 7]) for (const s of SUBJECTS[c]) for (const tid of curriculum.topicSequence(c, s)) {
    const topic = curriculum.getTopic(tid);
    const kit = kits.kitFromFile(topic);
    if (!kit) continue;
    const q = f0 ? items.buildPracticeQueue(kit, { classLevel: c }) : items.buildPracticeQueue(kit);
    q.slice(0, 3).forEach((id, i) => {
      const it = items.findItem(S0(), kit, id);
      if (it) rows.push({ id: it.id, topicId: tid, class: c, subject: s, pos: i + 1, prompt: it.prompt_en, answer: it.answer,
        difficulty: it.difficulty, ge: it.ge ?? null, diagnostic: !!it.diagnostic, ...(it.options ? { options: it.options.map((o) => o.text) } : {}) });
    });
  }
  return rows;
}

if (which !== "new") {
  const curriculum = await import("../../server/content/curriculum.js");
  const kits = await import("../../server/content/kits.js");
  const items = await import("../../server/director/items.js");
  const rows = await collect({ curriculum, kits, items, f0: false });
  writeFileSync(new URL("served-old.json", OUT), JSON.stringify(rows, null, 1));
  console.log(`served-old: ${rows.length} rows over ${new Set(rows.map((r) => r.topicId)).size} topics`);
}
if (which !== "old") {
  const { loadF0Sandbox } = await import("./lib/f0-sandbox.mjs");
  const sb = await loadF0Sandbox({ mergedKits: true });
  const rows = await collect({ curriculum: sb.curriculum, kits: sb.kits, items: sb.items, f0: true });
  writeFileSync(new URL("served-new.json", OUT), JSON.stringify(rows, null, 1));
  console.log(`served-new: ${rows.length} rows over ${new Set(rows.map((r) => r.topicId)).size} topics`);
  sb.cleanup();
}
