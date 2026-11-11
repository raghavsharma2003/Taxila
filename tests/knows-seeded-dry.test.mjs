// Round 8 (main's ruling on director19): the seeded children, dry, in the gate. 4 pilot topics × the four seeded learners
// (evals/knows-her/seed.mjs: meera, meeraForgot, kabir, player), each lesson started from her plan and played by the reactive
// child sim (evals/child-sim/reactive.mjs, persona steady) through the real step(), every turn read by code alone
// (classifyFast; a turn code cannot read is no_evidence, as the harness's --dry). No model, no network. Every walk must pass
// assertWalkExplained, and each child's planned choices must show up. This is the free check before the paid seeded run.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { findItem } from "../server/director/items.js";
import { classifyFast, targetFor } from "../server/director/classify.js";
import { setScriptForTest } from "../server/director/script.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { assertWalkExplained } from "../server/director/knows.js";
import { createReactiveChild, maxTurnsFor } from "../evals/child-sim/reactive.mjs";
import { seedLearner, SEEDED } from "../evals/knows-her/seed.mjs";
import { knowsPracticeStart } from "../server/director/knows-walk.js";
import { childrenFor, PILOT_TOPICS } from "../evals/knows-her/children.mjs";
import { CTX } from "./fixtures/kit.mjs";
import { eventsOf } from "./fixtures/knows/events.mjs";

const FLAGS = ["TAXILA_R7_SCRIPT", "TAXILA_R7_SCRIPT_DIR", "TAXILA_R7_ONE_LIVE", "TAXILA_R8_KNOWS"];
const KEEP = {};
const NO = { outcome: "no_evidence", confidence: 1, source: "dry", flags: { dontKnow: false, asksForAnswer: false, minimal: false, offTopic: false, distress: false, distressKind: null, wantsToStop: false } };

function seededLesson(topicId, learner) {
  const kit = kitFromFile(getTopic(topicId));
  const seeded = seedLearner(topicId, learner);
  const classLevel = Number(/^c(\d+)-/.exec(topicId)[1]);
  const s0 = initLessonState({ topicId, kit, ctx: { ...CTX, classLevel, lang: "hinglish", interests: seeded.interests, firstMeeting: false }, seed: 7, now: 0,
    knows: seeded.plan, warmupItems: seeded.warmup, level: seeded.level, activeMisconceptionIds: seeded.activeMisconceptionIds });
  if (s0.knows) s0.knowsApplied = seeded.applied;
  knowsPracticeStart(s0, kit, { level: seeded.level, activeMisconceptionIds: seeded.activeMisconceptionIds });
  let r = step(s0, { event: "start", kit, now: 0 });
  const child = createReactiveChild({ persona: "steady", seed: 7, kit, name: "Riya" });
  const moves = [r.move], states = [r.state];
  let s = r.state;
  for (let i = 0; i < maxTurnsFor("steady") && !r.end; i++) {
    const live = s.activeItemId ? findItem(s, kit, s.activeItemId) : null;
    const meta = live?.scriptAsk ?? live?.scriptCheck ?? live?.scriptThen ?? null;
    const card = live ? { itemId: live.id, key: String(live.answer), accept: live.acceptable ?? [], misses: s.misses?.[live.id] ?? 0 } : null;
    const ask = meta ? { key: String(live.answer), accept: live.acceptable ?? [], targets: meta.targets ?? null, wrongIfMis: meta.wrongIfMis ?? null } : null;
    const sb = s.lastMove?.scriptBeat;
    const out = child.reply({ turn: i, teacher: "", beat: sb ? { skillId: sb.skillId, kind: sb.kind, beatId: sb.beatId } : null, card, ask, boardUp: false, lang: "hinglish",
      ...(["probe", "teachback"].includes(s.lastMove?.kind) ? { probe: true } : {}) });
    if (out.text == null || out.kind === "leave") break;
    const fast = classifyFast({ target: targetFor(s, kit, live), childText: out.text, lang: "hinglish", classLevel, typed: true });
    const c = fast.result ?? NO;
    r = step({ ...s, recent: [...(s.recent ?? []), { who: "teacher", text: (r.move.mustSay ?? []).join(" ") }, { who: "child", text: out.text }] }, { event: "turn", kit, cls: c, text: out.text, now: (i + 1) * 20_000 });
    s = r.state; moves.push(r.move); states.push(s);
  }
  return { kit, moves, states, final: s, plan: seeded.plan, queue: s0.knowsPractice?.defaultQueue ?? null };
}

describe("round 8: the seeded children, dry, through the real walk", () => {
  beforeEach(() => { for (const k of FLAGS) { KEEP[k] = process.env[k]; delete process.env[k]; } setScriptForTest(); });
  afterEach(() => { setScriptForTest(); for (const k of FLAGS) { if (KEEP[k] === undefined) delete process.env[k]; else process.env[k] = KEEP[k]; } });

  for (const topicId of PILOT_TOPICS) for (const learner of SEEDED) {
    test(`${topicId} × ${learner}: every move explained; her planned choices show`, () => {
      const { script, kit } = childrenFor(topicId);
      const L = seededLesson(topicId, learner);
      const applied = L.final.knowsApplied ?? [];
      const because = [...L.plan.because, ...applied.filter((b) => !L.plan.because.some((p) => p.choice === b.choice && p.on === b.on))];
      const events = eventsOf({ script, kit, moves: L.moves, plan: L.plan, states: L.states });
      assertWalkExplained({ script, kit, because, events, queue: L.queue });
      // (a choice shows only where the lesson reached it: the steady child leaves after about 40 turns)
      const reached = (skillId) => events.some((e) => e.kind === "beat" && e.skillId === skillId && /^check:/.test(e.beat));
      assert.ok(L.moves.length >= 10, `${L.moves.length} moves`);
      const ch = applied.map((b) => b.choice);
      if (L.plan.compress.length) assert.ok(ch.includes("compress"), `compress applied: ${ch.join()}`);
      if (L.plan.firstCard) assert.ok(ch.includes("firstCard") || ch.includes("opener"), `first card applied: ${ch.join()}`);
      for (const sk of Object.keys(L.plan.checkOrder)) if (reached(sk)) assert.ok(applied.some((b) => b.choice === "checkOrder" && b.on === sk), `check order applied on ${sk}: ${ch.join()}`);
    });
  }
});
