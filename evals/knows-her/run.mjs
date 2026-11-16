#!/usr/bin/env node
// knows-her: does a scripted lesson differ between two children because of what is known about them, and does every
// difference name its fact? Deterministic: no model, no network, no database, no clock (NOW is fixed). Runs in the gate
// through tests/knows-her-eval.test.mjs. `node evals/knows-her/run.mjs` prints the report; `--write` also saves it under
// evals/knows-her/results/.
import { writeFileSync, mkdirSync } from "node:fs";
import { planFor, defaultWalk, assertWalkExplained } from "../../server/director/knows.js";
import { simulateWalk } from "./walk.mjs";
import { childrenFor, PILOT_TOPICS, NOW } from "./children.mjs";

const beatKeys = (events) => events.filter((e) => e.kind === "beat").map((e) => `${e.skillId}|${e.beat}`);
const sig = (b) => `${b.on}:${b.fact?.kind}`;
const throws = (f) => { try { f(); return false; } catch { return true; } };

/** One named difference per lesson slot: K2's and K7's records choose the same slot (the warm-up's first card). */
const SLOT = { opener: "firstCard", compress_fallback: "compress" };
const slotOf = (x) => SLOT[x.choice] ?? x.choice;
/** The named differences between two children's lessons: one per slot whose applied records differ. */
export function differences(a, b) {
  const out = [];
  const choices = [...new Set([...a.applied, ...b.applied].map(slotOf))];
  for (const choice of choices) {
    const ra = a.applied.filter((x) => slotOf(x) === choice), rb = b.applied.filter((x) => slotOf(x) === choice);
    const sa = ra.map(sig).sort().join(","), sb = rb.map(sig).sort().join(",");
    if (sa !== sb) out.push({ choice, a: ra, b: rb });
  }
  return out;
}

export function runTopic(topicId) {
  const { script, kit, children } = childrenFor(topicId);
  const lessons = {};
  const failures = [];
  for (const [name, c] of Object.entries(children)) {
    const plan = planFor({ script, kit, now: NOW, ...c.input });
    const walk = simulateWalk({ script, kit, plan, answer: c.answer });
    const because = [...plan.because, ...walk.applied.filter((x) => !plan.because.includes(x))];
    let explained = true;
    try { assertWalkExplained({ script, kit, because, events: walk.events }); } catch (e) { explained = false; failures.push(`${topicId} ${name}: ${e.message}`); }
    // the predicate bites: drop each applied record that changed the walk and the same walk must fail
    const bites = walk.applied.filter((x) => !(x.choice === "hookSlot" && (x.fact?.index ?? 0) === 0)).map((x) => {
      const without = because.filter((y) => !(y.choice === x.choice && y.on === x.on) && !(x.choice === "firstCard" && y.choice === "opener" && y.on === x.on));
      return { choice: x.choice, on: x.on, throws: throws(() => assertWalkExplained({ script, kit, because: without, events: walk.events })) };
    });
    for (const b of bites) if (!b.throws) failures.push(`${topicId} ${name}: removing the ${b.choice} record on ${b.on} did not make the walk fail`);
    lessons[name] = { plan, events: walk.events, applied: walk.applied, explained, bites };
  }
  // a child with no history gets exactly the script's default, with an empty because
  const n = lessons.new;
  const def = defaultWalk(script, kit);
  const isDefault = n.plan.because.length === 0 && n.applied.length === 0 && n.plan.compress.length === 0 && n.plan.firstCard === null
    && n.plan.hookSlot === null && Object.keys(n.plan.checkOrder).length === 0 && n.plan.allKnown === false && Object.keys(n.plan.ladderOrder).length === 0 && n.plan.prereqCheck === null
    && n.plan.opener === "standard_retrieval" && JSON.stringify(beatKeys(n.events)) === JSON.stringify(def);
  if (!isDefault) failures.push(`${topicId} new: not the script's default walk`);
  const diffs = differences(lessons.meera, lessons.kabir);
  if (diffs.length < 4) failures.push(`${topicId}: ${diffs.length} named differences between meera and kabir (need 4)`);
  if (JSON.stringify(lessons.meera.events) === JSON.stringify(lessons.kabir.events)) failures.push(`${topicId}: meera and kabir walked the same lesson`);
  // the games-only child: the lesson reads what play taught (her skill state and mix-up came only from play: rows)
  const gd = differences(lessons.new, lessons.player);
  if (gd.length < 2) failures.push(`${topicId} player: ${gd.length} differences from a child with no history (need 2)`);
  const fb = lessons.meeraForgot.applied.some((x) => x.choice === "compress_fallback");
  if (!fb) failures.push(`${topicId} meeraForgot: no compress_fallback record`);
  return {
    topicId, failures,
    newIsDefault: isDefault,
    playerVsNew: gd.map((d) => ({ choice: d.choice, player: d.b.map((x) => ({ on: x.on, fact: x.fact, source: x.source })) })),
    differences: diffs.map((d) => ({ choice: d.choice, meera: d.a.map((x) => ({ on: x.on, fact: x.fact, source: x.source })), kabir: d.b.map((x) => ({ on: x.on, fact: x.fact, source: x.source })) })),
    lessons: Object.fromEntries(Object.entries(lessons).map(([k, v]) => [k, { cards: beatKeys(v.events).length, events: v.events.length, applied: v.applied.map((x) => `${x.choice}@${x.on}`), explained: v.explained, bites: v.bites }])),
  };
}

export function runEval() {
  const topics = PILOT_TOPICS.map(runTopic);
  return { eval: "knows-her", date: new Date(NOW).toISOString().slice(0, 10), n: { topics: topics.length, childrenPerTopic: 5 },
    ok: topics.every((t) => !t.failures.length), failures: topics.flatMap((t) => t.failures), topics };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = runEval();
  for (const t of r.topics) {
    console.log(`${t.topicId}: new=default ${t.newIsDefault ? "yes" : "NO"} · ${t.differences.length} named differences (meera vs kabir)`);
    console.log(`   player (games only) vs new: ${t.playerVsNew.map((d) => d.choice).join(", ")}`);
    for (const d of t.differences) console.log(`   ${d.choice.padEnd(18)} meera [${d.meera.map((x) => `${x.on} ← ${x.fact.kind}`).join("; ")}]  kabir [${d.kabir.map((x) => `${x.on} ← ${x.fact.kind}`).join("; ")}]`);
  }
  if (r.failures.length) console.log(`FAIL\n  ${r.failures.join("\n  ")}`); else console.log("PASS");
  if (process.argv.includes("--write")) {
    const dir = new URL("./results/", import.meta.url);
    mkdirSync(dir, { recursive: true });
    writeFileSync(new URL(`${r.date}.json`, dir), `${JSON.stringify(r, null, 2)}\n`);
  }
  process.exit(r.ok ? 0 : 1);
}
