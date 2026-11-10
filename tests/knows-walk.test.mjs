// Round 8 part D: the REAL walk (director/state.js step) with a knows.js plan. On each pilot topic, simulated children are
// walked through step() and the moves are read back as walk events; assertWalkExplained must hold on every walk, a child
// with no history must walk the script's default with no record, and each planned choice must show in the real moves (K1
// and its fallback, allKnown, K2/K7's first card, K3's check order and the classifier's remediation, K6's hook).
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { setScriptForTest } from "../server/director/script.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { planFor, assertWalkExplained, defaultWalk } from "../server/director/knows.js";
import { knowsWarmup, knowsDecisionsOf } from "../server/director/knows-walk.js";
import { decisionRecordStmt } from "../server/brain/trace.js";
import { childrenFor, PILOT_TOPICS, NOW } from "../evals/knows-her/children.mjs";
import { CTX, cls } from "./fixtures/kit.mjs";
import { eventsOf } from "./fixtures/knows/events.mjs";

const FLAGS = ["TAXILA_R7_SCRIPT", "TAXILA_R7_SCRIPT_DIR", "TAXILA_R7_ONE_LIVE", "TAXILA_R8_KNOWS"];
const KEEP = {};

/** Walk one child through step(): every card answered by `answer`, every other move "haan"; stops at the wrap or 90 turns. */
function walkReal(topicId, { plan, answer, interests = [] }) {
  const { script } = childrenFor(topicId);
  const kit = kitFromFile(getTopic(topicId));
  const kw = knowsWarmup(plan, [], { kit, max: 4 });
  let s0 = initLessonState({ topicId, kit, ctx: { ...CTX, classLevel: Number(topicId.slice(1, 2)), lang: "hinglish", interests }, seed: 7, now: 0, warmupItems: kw.items, knows: plan });
  if (s0.knows) s0.knowsApplied = kw.because.map((b) => ({ ...b, turn: 0 }));
  let r = step(s0, { event: "start", kit, now: 0 });
  const moves = [r.move], states = [r.state];
  let prevAsk = null;
  for (let n = 0; n < 90 && !r.end && r.move.kind !== "wrap" && r.state.phase !== "teachback"; n++) {
    const ask = r.ui?.ask?.itemId ? (r.move.item ?? { id: r.ui.ask.itemId }) : null;
    let text = "haan", c = cls("no_evidence");
    if (ask) { const a = answer(ask) ?? { verdict: "right" }; text = a.verdict === "right" ? "sahi jawab" : "galat jawab"; c = a.verdict === "right" ? cls("correct") : cls("incorrect", a.misconceptionId ? { misconceptionId: a.misconceptionId } : {}); if (a.misconceptionId) c.outcome = "misconception"; }
    prevAsk = ask ?? prevAsk;
    const recent = [...(r.state.recent ?? []), { who: "teacher", text: (r.move.mustSay ?? []).join(" ") }];
    r = step({ ...r.state, recent }, { event: "turn", kit, cls: c, text, now: (r.state.turn + 1) * 20_000 });
    moves.push(r.move); states.push(r.state);
  }
  return { script, kit, moves, states, final: r.state, plan };
}

const applied = (st) => st.knowsApplied ?? [];
const choices = (st) => applied(st).map((b) => b.choice);

describe("round 8 D: the real walk with a plan", () => {
  beforeEach(() => { for (const k of FLAGS) { KEEP[k] = process.env[k]; delete process.env[k]; } KEEP.split = process.env.TAXILA_R7_SPLIT; process.env.TAXILA_R7_SPLIT = "off"; setScriptForTest(); });
  afterEach(() => { setScriptForTest(); for (const k of FLAGS) { if (KEEP[k] === undefined) delete process.env[k]; else process.env[k] = KEEP[k]; } if (KEEP.split === undefined) delete process.env.TAXILA_R7_SPLIT; else process.env.TAXILA_R7_SPLIT = KEEP.split; });

  for (const topicId of PILOT_TOPICS) {
    const C = childrenFor(topicId);
    const planOf = (name) => planFor({ script: C.script, kit: C.kit, now: NOW, ...C.children[name].input });

    test(`${topicId}: no history → the default walk, no record`, () => {
      const w = walkReal(topicId, { plan: planOf("new"), answer: () => ({ verdict: "right" }) });
      const ev = eventsOf(w);
      assert.deepEqual(applied(w.final), []);
      assertWalkExplained({ script: C.script, kit: C.kit, because: [], events: ev });
      const keys = [...new Set(ev.filter((e) => e.kind === "beat").map((e) => `${e.skillId}|${e.beat}`))];
      assert.deepEqual(keys, defaultWalk(C.script, C.kit).slice(0, keys.length), "a prefix of the script's walk");
      assert.ok(keys.length >= 8, `${keys.length} beats walked`);
    });

    for (const name of ["meera", "meeraForgot", "kabir", "player"]) {
      test(`${topicId}: ${name}'s real walk is explained by its records`, () => {
        const plan = planOf(name);
        const w = walkReal(topicId, { plan, answer: C.children[name].answer, interests: C.children[name].input.interests });
        const ev = eventsOf(w);
        const because = [...plan.because, ...applied(w.final).filter((b) => !plan.because.some((p) => p.choice === b.choice && p.on === b.on))];
        assertWalkExplained({ script: C.script, kit: C.kit, because, events: ev });
        const ch = choices(w.final);
        if (name === "meera") { assert.ok(ch.includes("compress"), ch.join()); assert.ok(ch.includes("opener"), ch.join()); assert.ok(ev.some((e) => e.kind === "first")); }
        if (name === "meeraForgot") assert.ok(ch.includes("compress_fallback"), ch.join());
        if (name === "kabir") { for (const c of ["firstCard", "checkOrder", "hookSlot"]) assert.ok(ch.includes(c), `${c} in ${ch.join()}`); }
        if (name === "player") assert.ok(ch.includes("firstCard") && ch.includes("checkOrder"), ch.join());
      });
    }

    test(`${topicId}: allKnown → each skill opens at its check, she says so once, then the last ladder hardest first`, () => {
      const skills = Object.fromEntries(C.kit.skills.map((s) => [s.id, { status: "mastered", learnedChecked: true }]));
      const plan = planFor({ script: C.script, kit: C.kit, skills, now: NOW });
      assert.equal(plan.allKnown, true);
      const w = walkReal(topicId, { plan, answer: () => ({ verdict: "right" }) });
      const ev = eventsOf(w);
      assertWalkExplained({ script: C.script, kit: C.kit, because: [...plan.because, ...applied(w.final)], events: ev });
      const said = w.moves.flatMap((m) => m.sayFirst ?? []).filter((x) => /pehle se achhe se aata/.test(x));
      assert.equal(said.length, 1);
      assert.ok(choices(w.final).includes("allKnown"));
      const beats = ev.filter((e) => e.kind === "beat");
      assert.equal(new Set(beats.filter((e) => /^check:/.test(e.beat)).map((e) => `${e.skillId}|${e.beat}`)).size, C.script.skills.length, "one check per skill");
      const last = C.script.skills.at(-1);
      const ladder = [...new Set(beats.filter((e) => e.skillId === last.skillId && /^ladder:/.test(e.beat)).map((e) => e.beat.slice(7)))];
      const diff = new Map(C.kit.items.map((i) => [i.id, i.difficulty ?? 0]));
      assert.ok(ladder.length >= 1 && diff.get(ladder[0]) === Math.max(...last.ladder.map((x) => diff.get(x.itemId) ?? 0)), `the last ladder opens at its hardest rung: ${ladder.join()}`);
      assert.ok(!beats.some((e) => /^(explain|hook|worked)/.test(e.beat)), "nothing re-taught");
    });
  }

  test("the ledger's marks: the compressed opener's card carries recheck, her mix-up's first check carries probeFor", () => {
    const C = childrenFor("c5-maths-ch02-t01");
    const meera = planFor({ script: C.script, kit: C.kit, now: NOW, ...C.children.meera.input });
    const wm = walkReal("c5-maths-ch02-t01", { plan: meera, answer: () => ({ verdict: "right" }) });
    const opener = wm.states.map((st) => st.scriptCard).find((c) => c?.id === `script:${C.kit.skills[0].id}:${meera.compressAt[C.kit.skills[0].id]}`);
    assert.equal(opener?.recheck, true);
    assert.ok(wm.states.every((st) => !st.scriptCard?.recheck || st.scriptCard.id === opener.id), "only that card");
    const kabir = planFor({ script: C.script, kit: C.kit, now: NOW, ...C.children.kabir.input });
    const rec = kabir.because.find((b) => b.choice === "checkOrder");
    const wk = walkReal("c5-maths-ch02-t01", { plan: kabir, answer: () => ({ verdict: "right" }), interests: C.children.kabir.input.interests });
    const probe = wk.states.map((st) => st.scriptCard).find((c) => c?.id === rec.fact.cardId);
    assert.equal(probe?.probeFor, rec.fact.misconceptionId);
  });

  test("the trace: a turn's because records become knows.<choice> decision rows; the start's ride the first turn", () => {
    const prev = { turn: 0, knowsApplied: [{ choice: "firstCard", on: "i1", fact: { kind: "closed_badly" }, source: "s", turn: 0 }] };
    const next = { turn: 1, knowsApplied: [...prev.knowsApplied, { choice: "compress", on: "s1", fact: { kind: "learned_delayed_check" }, source: "s", turn: 1 }] };
    const rows = knowsDecisionsOf(prev, next, { lessonId: "L", legalMode: "M1", stmt: decisionRecordStmt });
    assert.deepEqual(rows.map((r) => r.params[2]), ["knows.firstCard", "knows.compress"]);
    assert.equal(rows[1].params[5], "learner");
    const later = knowsDecisionsOf(next, { turn: 2, knowsApplied: next.knowsApplied }, { lessonId: "L", legalMode: "M1", stmt: decisionRecordStmt });
    assert.deepEqual(later, [], "nothing new: no row");
  });

  test("TAXILA_R8_KNOWS=off: no plan at the start", async () => {
    const { knowsPlanAtStart } = await import("../server/director/knows-walk.js");
    const C = childrenFor(PILOT_TOPICS[0]);
    const entry = { script: C.script, ok: new Set(C.script.skills.map((s) => s.skillId)) };
    assert.ok(knowsPlanAtStart({ entry, kit: C.kit, now: NOW, env: {} }));
    assert.equal(knowsPlanAtStart({ entry, kit: C.kit, now: NOW, env: { TAXILA_R8_KNOWS: "off" } }), null);
    assert.equal(knowsPlanAtStart({ entry: { ...entry, script: { ...C.script, recordedRun: true } }, kit: C.kit, now: NOW, env: {} }), null, "a recorded-run replay: no knows choices");
  });
});
