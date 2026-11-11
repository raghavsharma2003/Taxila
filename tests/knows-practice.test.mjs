// Round 8, the kit-practice phase (main's ruling after integration 26): once the script's walk is spent the lesson goes on
// with the kit's practice queue (director/items.js selectNext). Her queue is built with her level and mix-ups; knows.js
// records where it departs from a no-history child's (practiceOrder, practiceDiag), and knows-walk.js knowsPick records the
// in-lesson reasons a pick leaves the queue's order (practiceFast, practiceEasier). The predicate checks each queue pick
// against its skill's queue order. A child who knows every skill reaches this phase fast, so the test uses that child.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { setScriptForTest } from "../server/director/script.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { planFor, assertWalkExplained, practicePlanOf } from "../server/director/knows.js";
import { knowsPracticeStart } from "../server/director/knows-walk.js";
import { buildPracticeQueue } from "../server/director/items.js";
import { childrenFor, PILOT_TOPICS } from "../evals/knows-her/children.mjs";
import { eventsOf } from "./fixtures/knows/events.mjs";
import { CTX, cls } from "./fixtures/kit.mjs";

const FLAGS = ["TAXILA_R7_SCRIPT", "TAXILA_R7_SCRIPT_DIR", "TAXILA_R7_ONE_LIVE", "TAXILA_R8_KNOWS"];
const KEEP = {};

/** A child who knows every skill (so the script part is one check per skill), behind her class and flagged weak, with one open mix-up. */
function practiceLesson(topicId, { noLevel = false, mix = true } = {}) {
  const C = childrenFor(topicId);
  const kit = kitFromFile(getTopic(topicId));
  const cl = Number(/^c(\d+)-/.exec(topicId)[1]);
  const skills = Object.fromEntries(C.kit.skills.map((s) => [s.id, { status: "mastered", learnedChecked: true, pKnown: 0.95 }]));
  const plan = planFor({ script: C.script, kit: C.kit, skills, now: 0 });
  const lv = noLevel ? null : { theta: cl - 1.5, weak: true };
  const mixId = mix ? C.kit.misconceptions.filter((m) => m.diagnostic).at(-1)?.id : null;
  const ami = mixId ? [mixId] : [];
  const s0 = initLessonState({ topicId, kit, skills, ctx: { ...CTX, classLevel: cl, lang: "hinglish", interests: [] }, seed: 7, now: 0, knows: plan, level: lv, activeMisconceptionIds: ami });
  knowsPracticeStart(s0, kit, { level: lv, activeMisconceptionIds: ami });
  let r = step(s0, { event: "start", kit, now: 0 });
  const moves = [r.move], states = [r.state];
  for (let n = 0; n < 90 && !r.end && r.move.kind !== "wrap" && r.state.phase !== "teachback"; n++) {
    const ask = r.ui?.ask?.itemId;
    r = step({ ...r.state, recent: [...(r.state.recent ?? []), { who: "teacher", text: (r.move.mustSay ?? []).join(" ") }] },
      { event: "turn", kit, cls: ask ? cls("correct") : cls("no_evidence"), text: ask ? "sahi" : "haan", now: (r.state.turn + 1) * 20_000 });
    moves.push(r.move); states.push(r.state);
  }
  const because = [...plan.because, ...(r.state.knowsApplied ?? [])];
  return { C, plan, because, final: r.state, queue: s0.knowsPractice?.defaultQueue ?? null, events: eventsOf({ script: C.script, kit: C.kit, moves, plan, states }) };
}

describe("round 8: the kit-practice phase is explained", () => {
  beforeEach(() => { for (const k of FLAGS) { KEEP[k] = process.env[k]; delete process.env[k]; } KEEP.split = process.env.TAXILA_R7_SPLIT; process.env.TAXILA_R7_SPLIT = "off"; setScriptForTest(); });
  afterEach(() => { setScriptForTest(); for (const k of FLAGS) { if (KEEP[k] === undefined) delete process.env[k]; else process.env[k] = KEEP[k]; } if (KEEP.split === undefined) delete process.env.TAXILA_R7_SPLIT; else process.env.TAXILA_R7_SPLIT = KEEP.split; });

  for (const topicId of PILOT_TOPICS) {
    test(`${topicId}: kit-practice picks follow the queue or carry their record; dropping a record fails the walk`, () => {
      const L = practiceLesson(topicId);
      const picks = L.events.filter((e) => e.kind === "practice" && e.source === "queue");
      assert.ok(picks.length >= 1, "the lesson reached the kit's queue");
      assert.ok(assertWalkExplained({ script: L.C.script, kit: L.C.kit, because: L.because, events: L.events, queue: L.queue }));
      const ch = L.because.map((b) => b.choice);
      assert.ok(ch.includes("practiceOrder") && ch.includes("practiceDiag"), ch.join());
      for (const c of ["practiceFast", "practiceDiag"]) {
        const used = L.because.filter((b) => b.choice === c && picks.some((p) => p.itemId === b.on));
        for (const b of used) assert.throws(() => assertWalkExplained({ script: L.C.script, kit: L.C.kit, because: L.because.filter((x) => x !== b), events: L.events, queue: L.queue }),
          /departs/, `dropping ${c} on ${b.on}`);
      }
    });
  }

  test("no level and no mix-up: her queue is the no-history queue, no practice record at the start", () => {
    const L = practiceLesson(PILOT_TOPICS[1], { noLevel: true, mix: false });
    assert.ok(!L.because.some((b) => b.choice === "practiceOrder" || b.choice === "practiceDiag"));
    assert.ok(assertWalkExplained({ script: L.C.script, kit: L.C.kit, because: L.because, events: L.events, queue: L.queue }));
  });

  test("practicePlanOf: a diagnostic for her mix-up and a level-set order are records; the same queue is none", () => {
    const kit = kitFromFile(getTopic("c5-maths-ch02-t01"));
    const q0 = buildPracticeQueue(kit, {});
    assert.deepEqual(practicePlanOf({ kit, queue: q0, defaultQueue: q0 }).because, []);
    const mix = kit.misconceptions.filter((m) => m.diagnostic).at(-1).id;
    const q1 = buildPracticeQueue(kit, { activeMisconceptionIds: [mix], classLevel: 5, theta: 3.5, weak: true });
    const b = practicePlanOf({ kit, queue: q1, defaultQueue: q0, level: { theta: 3.5, weak: true } }).because;
    const d = b.find((x) => x.choice === "practiceDiag");
    if (q1.find((id) => id.startsWith("diag:")) !== q0.find((id) => id.startsWith("diag:"))) assert.equal(d.fact.misconceptionId, mix);
    const o = b.find((x) => x.choice === "practiceOrder");
    assert.equal(o.fact.kind, "weak"); assert.ok(o.fact.order.length > 0);
  });
});
