// temp lint for c6-english re-author (deleted after use)
import { readFileSync } from "fs";
import { normalizeKit, RUNG_DEFAULTS } from "./server/content/kits.js";
import { promptFor, revealsAnswer } from "./server/director/items.js";
import { estimateTokens } from "./server/learner/brief.js";
const file = process.argv[2];
const d = JSON.parse(readFileSync(file, "utf8"));
const topics = d.topics ?? [d];
let bad = 0;
for (const t of topics) {
  const kinds = new Set(t.items.map((i) => i.kind));
  const kit = normalizeKit(t, { topicId: t.topicId, verified: true });
  if (!kit) { console.log(t.topicId, "NULL KIT"); bad++; continue; }
  const raw = new Map(t.items.map((i) => [i.id, i]));
  const msgs = [];
  for (const it of kit.items) {
    it.hints.forEach((h, r) => { if (h === RUNG_DEFAULTS[r] && raw.get(it.id).hints[r] !== h) msgs.push(`${it.id} rung${r + 1} replaced: ${raw.get(it.id).hints[r]}`); });
    for (const lang of ["hinglish", "hindi", "english"]) if (revealsAnswer(promptFor(it, lang), it)) msgs.push(`${it.id} prompt(${lang}) leaks`);
    const ra = raw.get(it.id);
    if ((ra.acceptable || []).some((a) => a.length > 60)) msgs.push(`${it.id} acceptable >60 chars dropped`);
    if ((ra.acceptable || []).length > 8) msgs.push(`${it.id} >8 acceptable`);
  }
  for (const m of t.misconceptions) if (!t.items.some((i) => i.targetsMisconception === m.id)) msgs.push(`misconception ${m.id} untargeted`);
  for (const i of t.items) if (i.targetsMisconception && !t.misconceptions.some((m) => m.id === i.targetsMisconception)) msgs.push(`${i.id} targets unknown ${i.targetsMisconception}`);
  const ids = t.items.map((i) => i.id); if (new Set(ids).size !== ids.length) msgs.push("dup item ids");
  const skillIds = new Set(t.skills.map((s) => s.id)); for (const i of t.items) if (!skillIds.has(i.skillId)) msgs.push(`${i.id} bad skill`);
  for (const s of t.skills) if (!t.items.some((i) => i.skillId === s.id)) msgs.push(`skill ${s.id} has no items`);
  for (const m of t.misconceptions) { const n = m.diagnostic.options.filter((o) => o.correct).length; if (n !== 1) msgs.push(`${m.id} ${n} correct`); }
  if (t.workedExample.fadedVersion.length !== t.workedExample.steps.length || !t.workedExample.fadedVersion.some((s) => s.includes("___"))) msgs.push("faded mismatch");
  console.log(`${t.topicId}: items ${t.items.length}->${kit.items.length} kinds ${kinds.size} lint ${JSON.stringify(kit.lint)} skills ${t.skills.length} mis ${t.misconceptions.length}`);
  for (const m of msgs) console.log("   ", m);
  if (msgs.length || kit.lint.itemsDropped || kit.lint.diagnosticsDropped || kit.lint.hintsReplaced || kinds.size < 5 || t.items.length < 10) bad++;
}
console.log(bad ? `BAD ${bad}` : "OK");
