#!/usr/bin/env node
// Builds data/play/coverage.json: which class 4-7 maths / science / EVS topics have a play family, with which goal and
// grammar, and which of the family's mal-rules map to which of the topic's VERIFIED kit misconceptions.
//
//   node server/play/tools/build-coverage.mjs           write the file
//   node server/play/tools/build-coverage.mjs --check   exit 1 if the file on disk is stale or any mapping is broken
//
// The RULES and ACTS are authored per family in server/play/tools/rules/<family>.mjs (S0.3: one file per family, so each
// games lane edits only its own; rules/index.mjs fixes their order). They say that a family's mechanic IS the topic's
// idea; the builder only checks them against the kits: every mapped misconception id must exist in the topic's kit, every
// mal-rule must be one the family's logic actually implements, every topic must exist in the curriculum. A broken entry
// fails the build rather than shipping a silent hole. Coverage counts are computed, never typed.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { LOGIC } from "../../../src/play/families/index.ts";
import { RULES, ACTS, CHECKS, FAMILY_RULES } from "./rules/index.mjs";

export { RULES, ACTS };

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const OUT = join(ROOT, "data/play/coverage.json");

/** Topics deliberately NOT given a game, with the reason (a game would trivialise or mis-frame them). */
export const EXCLUDED = [
  { prefix: "c7-science-ch06", why: "adolescence and reproductive health: taught in dialogue with care, never gamified" },
  { prefix: "c8-science-ch07", why: "adolescence (class 8): out of the class 4-7 scope and never gamified" },
];

const SCOPE = /^c[4-7]-(maths|science|evs)\.json$/;

function load() {
  const kits = new Map(), cur = new Map();
  for (const f of readdirSync(join(ROOT, "data/kits"))) if (SCOPE.test(f)) for (const t of JSON.parse(readFileSync(join(ROOT, "data/kits", f), "utf8")).topics) kits.set(t.topicId, t);
  for (const f of readdirSync(join(ROOT, "data/curriculum"))) if (SCOPE.test(f)) {
    const c = JSON.parse(readFileSync(join(ROOT, "data/curriculum", f), "utf8"));
    for (const ch of c.chapters ?? []) for (const t of ch.topics ?? []) cur.set(t.id, { ...t, classLevel: Number(c.class), subject: c.subject });
  }
  return { kits, cur };
}

export function build() {
  const { kits, cur } = load();
  const problems = [], entries = [], notAdmitted = [];
  for (const r of RULES) {
    const key = `${r.family}/${r.mode}`, logic = LOGIC[key], kit = kits.get(r.topicId), c = cur.get(r.topicId);
    if (!logic) { problems.push(`${r.topicId}: no logic ${key}`); continue; }
    if (!c) { problems.push(`${r.topicId}: not in the curriculum`); continue; }
    if (!kit) { problems.push(`${r.topicId}: no kit`); continue; }
    if (EXCLUDED.some((e) => r.topicId.startsWith(e.prefix))) { problems.push(`${r.topicId}: excluded topic has a rule`); continue; }
    const misMap = {};
    for (const [mal, slug] of Object.entries(r.misMap)) {
      if (!logic.malRules.includes(mal)) { problems.push(`${r.topicId}: ${key} has no mal-rule ${mal}`); continue; }
      const id = slug.startsWith(r.topicId) ? slug : `${r.topicId}-${slug.startsWith("m") && /^m\d+$/.test(slug) ? slug : `m-${slug}`}`;
      if (!kit.misconceptions.some((m) => m.id === id)) { problems.push(`${r.topicId}: kit has no misconception ${id}`); continue; }
      misMap[mal] = id;
    }
    CHECKS[r.family]?.(r, problems);
    // round 3 fix (adversarial B1): only the skills the act exercises (ACTS), never every skill of the topic
    const acts = ACTS[`${r.topicId}|${r.goal}`];
    if (!Array.isArray(acts)) { problems.push(`${r.topicId}|${r.goal}: no ACTS entry (which kit skills does the act exercise?)`); continue; }
    const skillIds = acts.map((sfx) => `${r.topicId}-${sfx}`);
    const unknown = skillIds.filter((id) => !kit.skills.some((sk) => sk.id === id));
    if (unknown.length) { problems.push(`${r.topicId}: ACTS names skills the kit does not have: ${unknown.join(", ")}`); continue; }
    if (!skillIds.length) { notAdmitted.push({ topicId: r.topicId, family: r.family, mode: r.mode, goal: r.goal, why: "the act exercises none of the topic's kit skills (ACTS [])" }); continue; }
    entries.push({ topicId: r.topicId, title: c.title, classLevel: c.classLevel, subject: c.subject, family: r.family, mode: r.mode, goal: r.goal,
      skillId: skillIds[0], skillIds, grammar: r.grammar, misMap, ...(r.arts ? { arts: r.arts } : {}) });
  }
  const inScope = [...cur.values()].filter((t) => /-(maths|science|evs)-/.test(t.id));
  const covered = new Set(entries.map((e) => e.topicId));
  const by = (pred) => inScope.filter(pred);
  const counts = {
    topicsInScope: inScope.length,
    topicsCovered: covered.size,
    entries: entries.length,
    withMisconceptionMap: new Set(entries.filter((e) => Object.keys(e.misMap).length).map((e) => e.topicId)).size,
    mappedMisconceptions: new Set(entries.flatMap((e) => Object.values(e.misMap))).size,
    bySubject: Object.fromEntries(["maths", "science", "evs"].map((s) => [s, { inScope: by((t) => t.id.includes(`-${s}-`)).length, covered: by((t) => t.id.includes(`-${s}-`) && covered.has(t.id)).length }])),
    byClass: Object.fromEntries([4, 5, 6, 7].map((k) => [k, { inScope: by((t) => t.classLevel === k).length, covered: by((t) => t.classLevel === k && covered.has(t.id)).length }])),
    byFamily: Object.fromEntries(FAMILY_RULES.map((m) => m.family).map((f) => [f, new Set(entries.filter((e) => e.family === f).map((e) => e.topicId)).size])),
  };
  // GRAMMAR.md §10: `skills` (skill id → its admitted game; the topic's FIRST rule wins) and `excluded` (topic id → why)
  const excluded = Object.fromEntries(inScope.filter((t) => EXCLUDED.some((e) => t.id.startsWith(e.prefix))).map((t) => [t.id, EXCLUDED.find((e) => t.id.startsWith(e.prefix)).why]));
  const skills = {};
  for (const e of entries) for (const sk of e.skillIds) if (!skills[sk]) skills[sk] = { topicId: e.topicId, family: e.family, mode: e.mode, goal: e.goal, grammar: e.grammar, misMap: e.misMap, ...(e.arts ? { arts: e.arts } : {}), contexts: [], why: `RULES ${e.topicId} ${e.family}/${e.mode}/${e.goal} · ACTS` };
  counts.skillsAdmitted = Object.keys(skills).length;
  counts.rulesNotAdmitted = notAdmitted.length;
  return { problems, file: { v: 1, note: "built by server/play/tools/build-coverage.mjs from RULES + ACTS; do not edit by hand", counts, skills, excluded, entries, notAdmitted } };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { problems, file } = build();
  const text = JSON.stringify(file, null, 1) + "\n";
  if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
  if (process.argv.includes("--check")) {
    let disk = ""; try { disk = readFileSync(OUT, "utf8"); } catch { /* missing */ }
    if (disk !== text) { console.error("data/play/coverage.json is stale: run node server/play/tools/build-coverage.mjs"); process.exit(1); }
    console.log("coverage ok", JSON.stringify(file.counts));
  } else { writeFileSync(OUT, text); console.log("wrote", OUT, JSON.stringify(file.counts)); }
}
