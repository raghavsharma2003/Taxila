// dc-r8-director25 H4 supersedes dc-r8-director24 H3 under main's 035 and 037 (the second-request rule): help is one function. Every
// request for help on a part gets that part's ladder's first wording none of whose sentences she has said, whatever request came before;
// the key and its why come when the ladder has nothing unsaid, over the card's answer board, and the card is closed. A Hindi request never
// gets a key: with nothing unsaid, the line that there are no easier words, and the question. After a key's check-in a give-up gets the
// why's other wording, then "we'll meet this again" and the lesson goes on. (File name kept: it held 037's tests.)
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initLessonState, step } from "../server/director/state.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { setScriptForTest } from "../server/director/script.js";
import { PREDICATES } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

describe("r8-director24-second-help (H4)", () => {
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; process.env.TAXILA_R7_SCRIPT = "on"; setScriptForTest(); });
  afterEach(() => { setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });

  const T = "c5-maths-ch02-t01";
  const sc = JSON.parse(readFileSync(new URL(`../data/lesson-scripts/${T}.json`, import.meta.url), "utf8"));
  const sk = sc.skills[0], e1 = sk.explain[0];
  const PART = `${sk.skillId}:e1:card`;
  const cls = (o, request = null) => ({ outcome: o, confidence: 0.9, flags: {}, ...(request ? { request } : {}) });
  // (what she says is what the said set is built from: her turn's words, as the turn's text — here the move's help words and the card)
  const heard = (r) => ({ ...r, state: { ...r.state, recent: [...(r.state.recent ?? []), { who: "teacher", text: [r.state.lastMove?.simpler, r.state.lastMove?.gave?.why, r.ui?.ask?.text].filter(Boolean).join(" ") }] } });
  const atCard = (topic = T, card = e1) => {
    const K = kitFromFile(getTopic(topic));
    let r = step(initLessonState({ topicId: topic, kit: K, ctx: { firstName: "Riya", lang: "hinglish", classLevel: 5, ageBand: "10-15", lessonKey: "h4" }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    for (let i = 0; i < 10 && !r.state.activeItemId; i++) r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), text: "theek hai", now: (r.state.turn + 1) * 20_000 });
    return { K, r: { ...r, state: { ...r.state, recent: [...(r.state.recent ?? []), { who: "teacher", text: `${card.point.hi} ${r.ui.ask.text}` }] } } };
  };
  const say = (K, r, text, c) => heard(step(r.state, { event: "turn", kit: K, cls: c, text, now: (r.state.turn + 1) * 20_000 }));
  const ladder = [e1.ask.simpler, e1.pointAlt, e1.simpler].filter(Boolean).map((x) => x.hi);

  test("each request climbs the card's ladder, whatever came before; the key only when it is empty, on the answer board, the card closed", () => {
    const { K, r } = atCard();
    const card = r.state.activeItemId;
    assert.equal(ladder.length, 3, "this card has ask.simpler, its point's pointAlt and simpler");
    let x = r;
    const asks = [["samajh nahi aaya", cls("no_evidence")], ["pata nahi", cls("no_evidence")], ["samajh nahi aaya", cls("no_evidence")]];
    for (const [k, [text, c]] of asks.entries()) {
      x = say(K, x, text, c);
      const lm = x.state.lastMove;
      assert.equal(lm.help?.part, PART, `${k}: help on the card`);
      assert.equal(lm.simpler, ladder[k].charAt(0).toUpperCase() + ladder[k].slice(1), `${k}: rung ${k + 1}`);
      assert.ok(!lm.gave, `${k}: no key while a rung is unsaid`);
      assert.equal(x.state.activeItemId, card, `${k}: the card stays live`);
    }
    // (the ladder has nothing unsaid: the key and its why, over the answer board, the card let go)
    const k = say(K, x, "pata nahi", cls("no_evidence"));
    assert.equal(k.state.lastMove.help?.card, "close");
    // (the walk's own close: the key in the lesson's language — the kit item's form of the script's key)
    assert.ok(k.state.lastMove.gave?.answer, "the key is given");
    assert.deepEqual(k.state.lastMove.closeBeat?.board, e1.ask.answerBoard);
    assert.ok(k.state.skipped.includes(card));
    assert.equal(k.state.keyedPart, PART);
    // (after the key's check-in: the why's other wording, then "we'll meet this again" and the lesson goes on)
    const w = say(K, k, "pata nahi", cls("no_evidence"));
    assert.equal(w.state.lastMove.help?.keyed, true);
    assert.equal(w.state.lastMove.help?.rung, "whyAlt");
    const g = say(K, w, "mujhe nahi pata", cls("no_evidence"));
    // (Brain 044 T5: with nothing unsaid after a key, the "nothing easier" line is the help, then the go-on line — the go-on line alone is no help)
    assert.equal(g.state.lastMove.help?.joint, "helpSpent");
    assert.equal(g.state.lastMove.help?.then, "afterKeyGoOn");
    assert.ok((g.state.lastMove.sayFirst ?? [])[0], "the joint is said first");
  });

  // (repinned d31 on Brain 046 Q2: the card has a `hindi` form (Learning 019) — the first request is that form alone; each request after it
  // climbs the same ladder, then the form again; with nothing unsaid, the form again — never a key, never the "nothing easier" line, the
  // question stays. The rule kept: a Hindi request climbs the card's ladder and never gets a key.
  // (repinned d32: c5-t01 s1 e1 became a value question and lost its hindi form in the reader fixes, so the rule is shown on the first
  // live card that still has one, c4-maths-ch05-t01 s1 e1, with the same three-rung ladder)
  test("a Hindi request climbs the same ladder and never gets a key: the hindi form first, the ladder with it, then the form, and the question", () => {
    const T2 = "c4-maths-ch05-t01";
    const sc2 = JSON.parse(readFileSync(new URL(`../data/lesson-scripts/${T2}.json`, import.meta.url), "utf8"));
    const e1 = sc2.skills[0].explain[0];
    const ladder = [e1.ask.simpler, e1.pointAlt, e1.simpler].filter(Boolean).map((x) => x.hi);
    const { K, r } = atCard(T2, e1);
    const card = r.state.activeItemId;
    const hindi = { type: "language", lang: "hindi" };
    assert.equal(card, `script:${sc2.skills[0].skillId}:ask:e1`, "the first card is s1 e1");
    assert.ok(e1.ask.hindi?.hi, "this card has its hindi form");
    let x = r;
    for (let k = 0; k <= ladder.length; k++) {
      x = say(K, x, "hindi mein samjhao", cls("no_evidence", hindi));
      assert.equal(x.state.lastMove.cell?.column, "hindi");
      assert.equal(x.state.lastMove.help?.rung, ["hindi", "ask.simpler", "pointAlt", "simpler"][k]);
      assert.equal(x.state.lastMove.hindiForm, e1.ask.hindi.hi.replace(/\s+/g, " ").trim(), "the form is the card's question");
      assert.equal(x.state.ctx.lang, "hindi", "the lesson's language from now on");
    }
    const s = say(K, x, "aur hindi mein batao", cls("no_evidence", hindi));
    assert.ok(!s.state.lastMove.gave, "never a key");
    assert.notEqual(s.state.lastMove.help?.joint, "helpSpent", "never the nothing-easier line");
    assert.equal(s.state.lastMove.help?.rung, "hindi");
    assert.equal(s.state.activeItemId, card, "the question stays");
    assert.equal(s.ui.ask?.itemId, card);
  });

  test("hindiNewWords under H4: the same part again is the fault; the easier-words line and the question is the answer with nothing left", () => {
    const script = sc;
    const card = e1.ask.prompt.hi;
    const ctx = { prevRead: "no_evidence · language", script, o: {} };
    const cell = { part: PART, column: "hindi" };
    const same = e1.simpler.hi;
    const L = (text) => { const r = { who: "teacher", card, text, cell }; return { L: { rows: [{ who: "teacher", text: same }, { who: "child", text: "hindi mein" }, r] }, r }; };
    const a = L(`Achha, isi ko Hindi ke shabdon mein phir se kehti hoon. ${same} ${card}`);
    assert.match(PREDICATES.hindiNewWords(a.L, a.r, 2, ctx) ?? "", /words she has said/);
    const b = L(`Isse aasaan shabd mere paas abhi nahi hain. ${card}`);
    assert.equal(PREDICATES.hindiNewWords(b.L, b.r, 2, ctx), null);
    const c = L(`Achha, Hindi mein bolti hoon. ${card}`);
    assert.match(PREDICATES.hindiNewWords(c.L, c.r, 2, ctx) ?? "", /no new words/);
  });
});
