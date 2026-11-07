#!/usr/bin/env node
// Round 7 F (main 2026-11-05): which class 4-7 maths topics to script next, by EXPECTED traffic. There is no real usage
// yet, so traffic is estimated from how the Conductor routes a child:
//   1. every lesson's topic comes from the class sequence (curriculum order, reports/truth.js nextTopicOf), and
//   2. a weak prerequisite sends the child back to it (conductor/adapt.js prereqPick; the S4/R-rules revisit it),
// so a topic that many later topics depend on is visited more often than its chapter position alone says. Rank:
//   dependents = class 4-7 maths topics whose prerequisite closure contains it (descending), then class, then chapter order.
// Only topics with a kit (data/kits) and without a script (data/lesson-scripts) are listed. [U]: replace with the
// Conductor's real pick counts once lessons run (lesson.topic_id by class).
//
//   node scripts/lesson-scripts/next-topics.mjs [--n 30] [--md]
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const CLASSES = [4, 5, 6, 7];

export function rankTopics() {
  const topics = [];
  for (const c of CLASSES) {
    const cur = JSON.parse(readFileSync(join(ROOT, "data/curriculum", `c${c}-maths.json`), "utf8"));
    const kit = JSON.parse(readFileSync(join(ROOT, "data/kits", `c${c}-maths.json`), "utf8"));
    const kitIds = new Set(kit.topics.map((t) => t.topicId));
    let pos = 0;
    for (const ch of cur.chapters) for (const t of ch.topics) topics.push({ id: t.id, title: t.title, cls: c, chapter: ch.number, chapterTitle: ch.title, pos: pos++,
      prereqs: t.prerequisites ?? [], hasKit: kitIds.has(t.id), topicType: kit.topics.find((k) => k.topicId === t.id)?.topicType ?? null });
  }
  const byId = new Map(topics.map((t) => [t.id, t]));
  const closure = new Map();
  const close = (id, seen = new Set()) => {
    if (closure.has(id)) return closure.get(id);
    const out = new Set();
    for (const p of byId.get(id)?.prereqs ?? []) if (!seen.has(p)) { out.add(p); for (const q of close(p, new Set([...seen, id]))) out.add(q); }
    closure.set(id, out);
    return out;
  };
  const dependents = new Map(topics.map((t) => [t.id, 0]));
  for (const t of topics) for (const p of close(t.id)) if (dependents.has(p)) dependents.set(p, dependents.get(p) + 1);
  const scripted = new Set(existsSync(join(ROOT, "data/lesson-scripts")) ? readdirSync(join(ROOT, "data/lesson-scripts")).map((f) => f.replace(/\.json$/, "")) : []);
  return topics.filter((t) => t.hasKit && !scripted.has(t.id)).map((t) => ({ ...t, dependents: dependents.get(t.id) }))
    .sort((a, b) => b.dependents - a.dependents || a.cls - b.cls || a.pos - b.pos);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const i = process.argv.indexOf("--n"), n = i > 0 ? Number(process.argv[i + 1]) : 30;
  const rows = rankTopics().slice(0, n);
  if (process.argv.includes("--md")) {
    console.log("| # | topic | class | chapter | title | type | later topics that need it |\n|---|---|---|---|---|---|---|");
    rows.forEach((t, k) => console.log(`| ${k + 1} | ${t.id} | ${t.cls} | ${t.chapter} | ${t.title} | ${t.topicType} | ${t.dependents} |`));
  } else rows.forEach((t, k) => console.log(`${String(k + 1).padStart(2)} ${t.id.padEnd(20)} dep ${String(t.dependents).padStart(2)}  ${t.title}`));
}
