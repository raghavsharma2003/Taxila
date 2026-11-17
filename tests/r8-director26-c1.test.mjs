// dc-r8-director26 C1, the main loop's ruling (docs/patches/to-brain/040 C1; the judgement's clause 4): four turn shapes that end on a
// question of the lesson instead of a check-in. Walked on today's scripts (data/lesson-scripts), the model never called.
//  1. the hook shares the first point's turn when the two fit in 75 words (else, with greetSimpler said first, it keeps its own);
//  2. a bare point and its own card share a turn of up to 75 words; after a close or a bridge the card waits past 60 (director24's rule);
//  3. a remediation and its follow-up card share a turn of up to 60 words (dc-r8-director27 P2; 75 before), each on its own board;
//  4. the worked problem and its first told step share a turn when they fit; the last told step comes with the child's own step.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step, unitTurn, L2_CAP } from "../server/director/state.js";
import { setScriptForTest, scriptFor } from "../server/director/script.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { boardPartsOf } from "../server/brain/propose.js";
import { CTX, cls } from "./fixtures/kit.mjs";

const KEEP = {};
const FLAGS = ["TAXILA_R7_SCRIPT", "TAXILA_R7_SPLIT", "TAXILA_R7_SPLIT_CLOSE", "TAXILA_L2"];
const words = (x) => String(x ?? "").split(/\s+/).filter(Boolean).length;

describe("dc-r8-director26 C1: turns that end on the lesson's question", () => {
  beforeEach(() => { for (const k of FLAGS) { KEEP[k] = process.env[k]; delete process.env[k]; } setScriptForTest(); });
  afterEach(() => { setScriptForTest(); for (const k of FLAGS) { if (KEEP[k] === undefined) delete process.env[k]; else process.env[k] = KEEP[k]; } });
  const run = (T) => {
    const K = kitFromFile(getTopic(T));
    let r = step(initLessonState({ topicId: T, kit: K, ctx: { ...CTX, classLevel: Number(/^c(\d)/.exec(T)[1]), lang: "hinglish", interests: ["cricket"] }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    const t = (text, c = cls("no_evidence")) => { r = step({ ...r.state, recent: [...(r.state.recent ?? []), { who: "teacher", text: "x" }] }, { event: "turn", kit: K, cls: c, text, now: (r.state.turn + 1) * 20_000 }); return r; };
    return { K, t, get r() { return r; } };
  };

  test("1. the hook and e1's point share a turn when they fit (c6); after a request at the greeting, greetSimpler and the hook keep theirs (c4)", () => {
    const L = run("c6-maths-ch06-t01");
    L.t("haan");
    const m = L.r.state.lastMove;
    // (Learning 016 lengthened c6's hook — its last sentence leads into the first point — to 41 words: with e1's 37 and her check-in it runs
    // over 75, so the hook is said on its own turn, as c4's is. The rule is what is held: shared when they fit, else the hook alone)
    const sk0 = scriptFor(L.K).script.skills[0];
    const hookW = words(sk0.hook.interestSlots.find((x) => x.interest === "cricket")?.use?.hi);
    if (hookW + words(sk0.explain[0].point.hi) + 4 > L2_CAP) { assert.equal(m.kind, "hook"); assert.ok(!m.hookSaid); }
    else {
    assert.equal(m.hookSaid, true);
    assert.equal(m.scriptBeat?.beatId, "e1");
    const sk = scriptFor(L.K).script.skills[0];
    assert.ok(sk.hook.interestSlots.some((x) => x.use.hi === m.sayFirst?.[0]), "the hook's line in the child's interest, said first");
    assert.ok(words(m.sayFirst) + words(m.point) + 4 <= L2_CAP, "the two fit in 75 words with her check-in");
    // (the hook before them is a part: the point and its card keep director24's 60 — here they run over it, so the card waits)
    assert.equal(L.r.ui?.ask, undefined);
    assert.equal(L.r.move.splitTeach, true);
    }
    // c4: "pata nahi" to the greeting — greetSimpler, then the hook, on a turn of their own (with e1 they run over 75)
    const C = run("c4-maths-ch05-t01");
    C.t("pata nahi", { ...cls("no_evidence"), flags: { dontKnow: true } });
    assert.equal(C.r.state.lastMove.kind, "hook");
    assert.equal(C.r.state.lastMove.sayFirst?.[0], scriptFor(C.K).script.greetSimpler.hi);
  });

  test("2. a bare point and its own card: one turn up to 75 words; with a close before the point, director24's 60", () => {
    const item = { id: "script:x-s1:ask:e1" };
    const out = (move, extra = {}) => ({ state: { ctx: { lang: "hinglish" }, turn: 4 }, move: { kind: "explain", point: "p", itemId: item.id, ...move }, ui: { ask: { itemId: item.id, text: "q" } }, ...extra });
    assert.deepEqual(unitTurn(out({}), { text: "haan", cls: cls("no_evidence") }), { margin: 8 }, "nothing before them");
    assert.equal(unitTurn(out({}), { text: "haan", cls: cls("no_evidence") }, 20), null, "a verdict and its why before the point");
    assert.equal(unitTurn(out({ bridgeSaid: "Ab aage." }), { text: "haan", cls: cls("no_evidence") }), null, "a bridge before the point");
    assert.equal(unitTurn(out({ hookSaid: true }), { text: "haan", cls: cls("no_evidence") }, 0, 30), null, "the hook before the point");
    assert.equal(unitTurn(out({ asideAck: true }), { text: "sixer", cls: cls("no_evidence") }), null, "her reply to an aside before the point");
    assert.equal(unitTurn(out({}), { text: "pata nahi, aap batao", cls: cls("no_evidence") }), null, "help's turn keeps its cap");
    assert.equal(unitTurn({ ...out({}), state: { ctx: { lang: "hinglish", plainWords: true }, turn: 4 } }, { text: "haan", cls: cls("no_evidence") }), null, "plain words keep 45");
  });

  test("3. a remediation and its follow-up card: one turn up to 60 words (dc-r8-director27 P2), the remediation on its board, the card's board at the card's first word", () => {
    const K = kitFromFile(getTopic("c6-maths-ch06-t01"));
    const rem = { scriptId: "c6@2.3", skillId: "c6-maths-ch06-t01-s1", beatId: "rem:m", kind: "remediation", board: { template: "shape@1", params: { shape: "hexagon" } } };
    const then = { scriptId: "c6@2.3", skillId: "c6-maths-ch06-t01-s1", beatId: "then:m", kind: "then", board: { template: "measured@1", params: { shape: "rect", w: 14, h: 9 } } };
    const o = { state: { ctx: { lang: "hinglish" }, turn: 9, later: [] }, move: { kind: "reteach", rendered: ["r"], scriptBeat: rem, cardBeat: then }, ui: { ask: { itemId: "script:c6-maths-ch06-t01-s1:then:m", text: "q" } } };
    const u = unitTurn(o, { kit: K, cls: cls("misconception") });
    const j = Math.max(...scriptFor(K).script.joints.beforeRemediation.map((x) => words(x.hi)));
    // (dc-r8-director27 P2: two judges found the two too much in one breath at 68 to 74 words — the card joins within 60, REM_CARD_CAP)
    assert.deepEqual(u, { margin: 5 + j, cap: 60 }, "her miss verdict and the longest beforeRemediation form beside the authored words, under 60");
    // (an aside's return due at the follow-up card's held half keeps the remediation on a turn of its own, as before the ruling)
    const due = { ...o, state: { ...o.state, later: [{ topic: "cricket", at: 3, share: true, parkSaid: true, onItem: "script:c6-maths-ch06-t01-s1:ask:e3" }] } };
    assert.equal(unitTurn(due, { kit: K, cls: cls("misconception") }), null);
    // the page: the verdict and the remediation on the remediation's board, the card on its own from its first word
    const v = "16 m sahi nahi hai.", say = "Ek cheenti corner se chalti hai aur har bhuja ke baad apna total badhati hai.", card = "Is khet ka parimap kitna hai?";
    const line = `${v} ${say} ${card}`;
    const pages = boardPartsOf({ ...o.move, closeBeat: rem }, line, card, { verdict: v, list: [{ part: "close", text: v }, { part: "body", text: say }, { part: "card", text: card }] });
    assert.deepEqual(pages.boardRef, rem.board, "the remediation's board is up while its words are said");
    assert.deepEqual(pages.segments.map((x) => [x.atChar, x.boardRef]), [[line.indexOf(card), then.board]], "the card's board at the card's first word");
  });

  test("4. the worked example: the problem with its first step where they fit; the last told step with the child's own step", () => {
    const L = run("c5-maths-ch02-t02");
    const sk = scriptFor(L.K).script.skills[0];
    // walk skill 1's points, every card right, to the worked example
    for (let i = 0; i < 30 && !/^worked/.test(String(L.r.state.lastMove?.scriptBeat?.beatId ?? "")) && !L.r.state.splitHold?.move?.problemLines; i++) {
      if (L.r.ui?.ask?.itemId) { const id = L.r.ui.ask.itemId, b = /:ask:(e\d+)$/.exec(id)?.[1]; const key = b ? sk.explain.find((x) => x.id === b).ask.key : null; L.t(String(key ?? "haan"), key ? cls("correct") : cls("no_evidence")); }
      else L.t("haan");
    }
    // the verdict on e3, its why and the joint run over 75 words with the problem and step 1: the verdict, the joint and the problem are
    // said as before the ruling, and step 1 goes back to the walk
    const lm = L.r.state.lastMove;
    const problemTurn = lm.problemLines ? lm : L.r.state.splitHold?.move ?? lm;
    assert.ok(/^worked(?::problem|:step1)$/.test(String(problemTurn.scriptBeat?.beatId)), JSON.stringify(problemTurn.scriptBeat));
    const steps = sk.workedExample.steps.length;
    const said = [];
    if (problemTurn.problemLines) said.push(...problemTurn.rendered.slice(problemTurn.problemLines));
    let cardTurn = null;
    for (let i = 0; i < 6 && !cardTurn; i++) {
      L.t("haan");
      const m = L.r.state.lastMove;
      if (m.kind === "worked_example" && m.rendered?.length && m.stepFrom) said.push(...m.rendered.slice(m.problemLines ?? 0));
      else if (m.kind === "worked_example" && m.rendered?.length) said.push(...m.rendered);
      if (/:ask:worked$/.test(String(L.r.ui?.ask?.itemId ?? ""))) cardTurn = m;
    }
    assert.ok(cardTurn, "the child's own step is posed");
    assert.equal(said.length, steps, "every told step said once");
    assert.ok(cardTurn.rendered?.length >= 1, "the last told step shares the child's own step's turn");
    assert.ok(words([...cardTurn.rendered, L.r.ui.ask.text].join(" ")) <= L2_CAP, "in 75 words");
  });
});
