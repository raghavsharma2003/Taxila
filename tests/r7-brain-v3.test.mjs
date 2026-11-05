// dc-r7-script-walk-v3 (main's director5 judgement): K1 a probe is never graded wrong and a key closes once affirmed; V1 code
// speaks a scripted remediation's authored explanation; V2/G1 an explain beat's authored point is always in what she says
// (a guard never leaves the card alone); G2 the kit's worked example never speaks in script mode; "Null" is never said.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initLessonState, step } from "../server/director/state.js";
import { setScriptForTest } from "../server/director/script.js";
import { verdictFor, joinAsk } from "../server/director/say.js";
import { textReply, replyDeps, pointSaid } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX, cls } from "./fixtures/kit.mjs";

const K = kitFromFile(getTopic("c6-maths-ch06-t01"));
const SC = JSON.parse(readFileSync(new URL("./fixtures/scripts/c6-s1-v2.json", import.meta.url), "utf8"));
const S1 = SC.skills[0];

test("K1: a reply to a probe or a teach-back is never a wrong answer; a wrong belief in it still is", () => {
  const why = { mode: "why", item: {}, ideas: [], misconceptions: [] };
  assert.equal(verdictFor({ outcome: "incorrect" }, why, { childText: "38 m" }), "ungraded");
  assert.equal(verdictFor({ outcome: "misconception" }, why, { childText: "l + b" }), "not_yet");
  assert.equal(verdictFor({ outcome: "incorrect" }, { mode: "teachback", expectations: [] }, { childText: "pata nahi" }), "ungraded");
  assert.equal(verdictFor({ outcome: "incorrect" }, { mode: "item", item: {} }, { childText: "7" }), "not_yet");
});

test("a card that is null is never read as 'Null'", () => {
  assert.equal(joinAsk("Pehla mark 1/8 hai.", null), "Pehla mark 1/8 hai.");
});

test("pointSaid: most content words and every number of the point", () => {
  assert.equal(pointSaid("Triangle ki teeno bhujayein 4 cm, 5 cm aur 6 cm hain.", S1.explain[0].point.hi), true);
  assert.equal(pointSaid("Chalo ek shape dekhte hain.", S1.explain[0].point.hi), false);
});

describe("v3 in the lesson (c6 skill-1 v2 fixture)", () => {
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT; setScriptForTest(); setScriptForTest(K.topicId, SC); });
  afterEach(() => { replyDeps.chat = chat; setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });
  const run = () => {
    let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6, lang: "hinglish", interests: ["cricket"] }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    const t = (text, c = cls("no_evidence")) => { r = step({ ...r.state, recent: [...(r.state.recent ?? []), { who: "teacher", text: [r.move.point, ...(r.move.mustSay ?? [])].filter(Boolean).join(" ") }] }, { event: "turn", kit: K, cls: c, text, now: (r.state.turn + 1) * 20_000 }); return r; };
    return { t, get r() { return r; } };
  };

  test("V2/G1: an explain line without the authored point gets it, verbatim, before the card", async () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    assert.equal(L.r.move.point, S1.explain[0].point.hi);
    const card = L.r.ui.ask.text;
    replyDeps.chat = async () => ({ text: `Dekho, parimap boundary ki lambai hai. ${card}` });
    const out = await textReply({ instructions: "x", state: { ...L.r.state, mode: "text" }, kit: K, childText: "haan", history: [], ui: L.r.ui, module: null });
    assert.ok(out.reply.includes(S1.explain[0].point.hi), out.reply);
    assert.ok(out.reply.trim().endsWith(card), "the card stays last");
  });

  test("V1: a scripted remediation is spoken from its authored lines, then its follow-up card", async () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    L.t("7 cm", { ...cls("incorrect"), outcome: "misconception", misconceptionId: "c6-maths-ch06-t01-m-missing-sides" });
    const card = L.r.ui.ask.text;
    replyDeps.chat = async () => ({ text: "Koi baat nahi, ek alag tarah se dekhte hain." });
    const out = await textReply({ instructions: "x", state: { ...L.r.state, mode: "text" }, kit: K, childText: "7 cm", verdict: "not_yet", history: [], ui: L.r.ui, module: null });
    assert.ok(out.reply.includes("cheenti"), out.reply);
    assert.match(out.reply, /^7 cm sahi nahi hai\./, "K2: the verdict comes first, before the remediation board's explanation ('koi baat nahi' is no verdict)");
    assert.ok(out.reply.trim().endsWith(card), out.reply);
    assert.ok(!/50 m|30 m/.test(out.reply), "never the kit's worked example");
  });

  test("K2: a script card let go after stuck turns has its key said", () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    let gave = null;
    for (let i = 0; i < 12 && !gave; i++) { L.t("pata nahi", cls("dont_know")); gave = L.r.move.gave ?? null; }
    assert.ok(gave, "the card is let go with its answer");
    assert.match(gave.answer, /\d/);
  });

  test("SC2: a picture asked for while a script card is live shows THAT card's board", () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    assert.equal(L.r.move.scriptBeat?.beatId, "e1");
    L.t("picture dikhao", { ...cls("no_evidence"), request: { type: "visual", kind: "diagram" } });
    assert.equal(L.r.move.scriptBeat?.beatId, "e1", JSON.stringify(L.r.move.scriptBeat));
    assert.deepEqual(L.r.move.scriptBeat?.board, S1.explain[0].board);
  });

  test("director6: the verdict leads, even after a give-up reveal or an S1 fixed line; a graded-right answer is never negated", async () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    const card = L.r.ui.ask.text;
    const st = { ...L.r.state, mode: "text" };
    // a wrong answer with the previous card's give-up reveal on the move: the reveal never comes before the verdict
    replyDeps.chat = async () => ({ text: `9 sahi nahi hai. Chalo phir se dekhte hain. ${card}` });
    const a = await textReply({ instructions: "x", state: { ...st, lastMove: { ...st.lastMove, gave: { answer: "38 m", why: "" } } }, kit: K, childText: "9", verdict: "not_yet", history: [], ui: L.r.ui, module: null });
    assert.match(a.reply, /^9 sahi nahi hai\./, a.reply);
    assert.ok(a.reply.includes("38 m"), "the reveal is still said");
    // a wrong answer whose line has no verdict at all: code adds it
    replyDeps.chat = async () => ({ text: card });
    const b = await textReply({ instructions: "x", state: st, kit: K, childText: "9", verdict: "not_yet", history: [], ui: L.r.ui, module: null });
    assert.match(b.reply, /^(?:9 sahi nahi hai|Nahi, yeh jawab nahi hai)\./, b.reply);
    // a graded-right answer negated by her line ("1/8 nahi"): the negation goes, a plain yes leads
    replyDeps.chat = async () => ({ text: `Riya, 12 cm nahi; teeno bhujayein jodo. ${card}` });
    const c = await textReply({ instructions: "x", state: st, kit: K, childText: "12 cm", verdict: "correct", history: [], ui: L.r.ui, module: null });
    assert.match(c.reply, /^Haan, sahi hai\./, c.reply);
    assert.doesNotMatch(c.reply, /12 cm nahi/, c.reply);
  });

  test("v4 W1: a remediation whose line a guard replaces still says the verdict, then the authored say, then the card", async () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    L.t("7 cm", { ...cls("incorrect"), outcome: "misconception", misconceptionId: "c6-maths-ch06-t01-m-missing-sides" });
    const card = L.r.ui.ask.text;
    replyDeps.chat = async () => ({ text: "Iska jawab 38 m hai, kyunki sab bhujayein judti hain." });   // a leak of the then-card's key
    const out = await textReply({ instructions: "x", state: { ...L.r.state, mode: "text" }, kit: K, childText: "7 cm", verdict: "not_yet", history: [], ui: L.r.ui, module: null });
    assert.match(out.reply, /^7 cm sahi nahi hai\./, out.reply);
    assert.ok(out.reply.includes("cheenti"), out.reply);
    assert.ok(out.reply.trim().endsWith(card), out.reply);
    assert.doesNotMatch(out.reply, /38 m hai/, "the leak is gone");
  });

  test("v4 W3: an explain paraphrase without the point keeps one short clause of hers, then the point once, then the card whole", async () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    const card = L.r.ui.ask.text;
    replyDeps.chat = async () => ({ text: `Parimap ka matlab hai poori boundary ki lambai, ek chakkar. Ab socho. ${card}` });
    const out = await textReply({ instructions: "x", state: { ...L.r.state, mode: "text" }, kit: K, childText: "haan", history: [], ui: L.r.ui, module: null });
    const p = S1.explain[0].point.hi;
    assert.equal(out.reply.split(p).length - 1, 1, out.reply);
    assert.ok(out.reply.trim().endsWith(card), out.reply);
    assert.ok(out.reply.indexOf(p) < out.reply.indexOf(card), "the point comes before the ask");
  });

  test("v4 W1: a turn that would be the bare card says the card's own authored line first", async () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    L.t("pata nahi", cls("dont_know"));
    const card = L.r.ui.ask.text;
    assert.ok(L.r.state.lastMove.cardPoint, JSON.stringify(L.r.state.lastMove));
    replyDeps.chat = async () => ({ text: card });
    const out = await textReply({ instructions: "x", state: { ...L.r.state, mode: "text" }, kit: K, childText: "pata nahi", history: [], ui: L.r.ui, module: null });
    assert.notEqual(out.reply.trim(), card.trim(), "never the bare card");
    assert.ok(out.reply.trim().endsWith(card), out.reply);
  });

  test("v4: a then-card's authored prompt is never cut, and re-posing it shows its own board", () => {
    const long = structuredClone(SC);
    const r0 = long.skills[0].remediation[0];
    r0.then.prompt.hi = "Ek kisaan ke khet ki chhe bhujayein hain jinki lambai 10 m, 4 m, 6 m, 5 m, 4 m aur 9 m hai. Woh poore khet ke chaaron taraf ek baar baad lagata hai. Uska parimap kitna hai?";
    r0.then.board = { template: "shape@1", params: { shape: "hexagon" } };
    setScriptForTest(); setScriptForTest(K.topicId, long);
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    L.t("7 cm", { ...cls("incorrect"), outcome: "misconception", misconceptionId: "c6-maths-ch06-t01-m-missing-sides" });
    assert.ok(r0.then.prompt.hi.length > 120);
    assert.equal(L.r.ui.ask.text, r0.then.prompt.hi, "shown whole");
    L.t("pata nahi", cls("dont_know"));
    assert.equal(L.r.ui.ask?.itemId, L.r.state.activeItemId, "the then-card is still the card");
    assert.deepEqual(L.r.move.scriptBeat?.board, r0.then.board, JSON.stringify(L.r.move));
  });

  test("v4 W4: after a remediation's follow-up, the card they missed is closed with its answer", async () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    L.t("7 cm", { ...cls("incorrect"), outcome: "misconception", misconceptionId: "c6-maths-ch06-t01-m-missing-sides" });
    assert.match(L.r.state.activeItemId, /:then:/);
    L.t("38", cls("correct"));
    // (a right follow-up may get its why-probe first; the close comes on the move after the follow-up is done)
    for (let i = 0; i < 3 && !L.r.move.closed; i++) L.t("har bhuja ek baar jodi", cls("correct"));
    assert.equal(L.r.move.closed?.answer, "12 cm", JSON.stringify(L.r.move));
    replyDeps.chat = async () => ({ text: "Bahut badhiya!" });
    const out = await textReply({ instructions: "x", state: { ...L.r.state, mode: "text" }, kit: K, childText: "38", verdict: "correct", history: [], ui: L.r.ui, module: null });
    assert.match(out.reply, /Aur pehle wale sawaal ka jawab 12 cm tha\./, out.reply);
  });

  test("v4 W6: an aside is parked with a promise in her line (topic found in code), and kept until it is served", async () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    L.t("kal maine cricket khela, sixer maara", { ...cls("no_evidence"), request: { type: "uptake", kind: "personal_share" } });
    const e = (L.r.state.later ?? []).find((x) => /cricket/i.test(x.topic));
    assert.ok(e, JSON.stringify(L.r.state.later));
    const card = L.r.ui.ask?.text ?? "";
    replyDeps.chat = async () => ({ text: `Wah! ${card}` });
    const out = await textReply({ instructions: "x", state: { ...L.r.state, mode: "text" }, kit: K, childText: "kal maine cricket khela, sixer maara", history: [], ui: L.r.ui, module: null });
    assert.match(out.reply, /cricket/i, out.reply);
    L.t("aapko virat pasand hai?", { ...cls("no_evidence"), request: { type: "answer_q" } });
    assert.ok((L.r.state.later ?? []).some((x) => /virat/i.test(x.topic)), JSON.stringify(L.r.state.later));
  });

  test("latency cut 1: a script draft whose only problems the assembly fixes is not rewritten; the turn equals the rewrite path's, but for her lead-in", async () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    const card = L.r.ui.ask.text;
    const draft = `Parimap ka matlab hai boundary ki lambai. ${card}`;   // the point left out (mustsay), nothing else wrong
    const go = async (env) => {
      const keep = process.env.TAXILA_R7_SKIP_REWRITE; if (env) process.env.TAXILA_R7_SKIP_REWRITE = env; else delete process.env.TAXILA_R7_SKIP_REWRITE;
      let calls = 0;
      replyDeps.chat = async () => { calls += 1; return { text: calls === 1 ? draft : `Chalo dekhte hain. ${card}` }; };
      try { const out = await textReply({ instructions: "x", state: { ...L.r.state, mode: "text" }, kit: K, childText: "haan", history: [], ui: L.r.ui, module: null }); return { out, calls }; }
      finally { if (keep === undefined) delete process.env.TAXILA_R7_SKIP_REWRITE; else process.env.TAXILA_R7_SKIP_REWRITE = keep; }
    };
    const fast = await go(null), slow = await go("off");
    assert.equal(fast.calls, 1, "no second model call");
    assert.ok(slow.calls >= 2, "the kill switch keeps today's rewrite");
    assert.deepEqual(fast.out.guard.rewriteSkipped, ["mustsay"]);
    const tail = (t) => t.slice(t.indexOf(S1.explain[0].point.hi));
    assert.equal(tail(fast.out.reply), tail(slow.out.reply), `${fast.out.reply}  ||  ${slow.out.reply}`);
  });

  test("latency cut 2 (TAXILA_R7_LONG_TRIM, off by default): long is trimmed in code only when switched on", async () => {
    const { longTrimOn } = await import("../server/brain/say.js");
    assert.equal(longTrimOn({}), false);
    assert.equal(longTrimOn({ TAXILA_R7_LONG_TRIM: "on" }), true);
  });
});

test("v2.1 validator: {friend} not the child or Asha, no '?' glyph, no echo ask, ≤3 worked steps (c4-5), follow-ups with a board", async () => {
  const { validateTopicScript, fillFriend } = await import("../server/director/script.js");
  const base = () => { const s = structuredClone(SC); s.version = 2.1; return s; };
  const errs = (f) => { const s = base(); f(s.skills[0]); return validateTopicScript(s, K).errors.join(" | "); };
  assert.equal(errs(() => {}), "", "the fixture is v2.1-clean");
  assert.match(errs((k) => { k.checks[0].prompt.hi = "Asha kehti hai: L shape ke kamre ki 6 bhujayein 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hain. Parimap kitna hai?"; }), /\{friend\}/);
  assert.match(errs((k) => { k.workedExample.yourStep.prompt.hi = "18 m + 2 m = ? m, kitna hua?"; }), /read aloud/);
  assert.match(errs((k) => { k.explain[0].point.hi = "triangle ki bhujayein 3, 4, 5 cm: kul 12 cm"; }), /echo/);
  assert.match(errs((k) => { delete k.remediation[0].board; }), /needs a board/);
  assert.equal(fillFriend("{friend} ne 3/4 kaha", "Riya"), "Zoya ne 3/4 kaha");
  assert.equal(fillFriend("{friend} ne 3/4 kaha", "Zoya"), "Kabir ne 3/4 kaha", "never the child's own name");
});

test("a scripted lesson's teach-back invents no pretend learner (director5 c4: 'Golu' met for the first time)", async () => {
  const SH = await import("../server/director/shapes.js");
  assert.doesNotMatch(SH.teachback({ protege: null }), /Golu|undefined/);
  assert.match(SH.teachback({ protege: { name: "Golu", what: "a pretend baby elephant" } }), /Golu/, "unscripted lessons keep their protege");
  assert.doesNotMatch(SH.teachbackFollowup({ protege: null, missing: "x" }), /undefined/);
});

test("SC1: counted claims are checked against Studio's screen.counts, and never without them", async () => {
  const { countContradicts, screenContradictions } = await import("../server/brain/say.js");
  const line = { lines: [{ gaps: 3, ticks: 4, innerTicks: 2 }], marks: [{ at: "1/3", label: "1/3" }] };
  assert.equal(countContradicts("Board par dekho, 0 aur 1 ke beech mein 2 nishaan hain.", line), false);
  assert.equal(countContradicts("Board par dekho, beech mein 3 nishaan hain.", line), true);
  assert.equal(countContradicts("Dekho, line 4 barabar hisson mein bati hai.", line), true);
  assert.equal(countContradicts("Board par dekho, beech mein 3 nishaan hain.", null), false, "no counts: no count check");
  const pent = { sides: 5, corners: 5, sideValues: ["4 m", "5 m", "3 m", "6 m", "2 m"] };
  assert.equal(countContradicts("Is kyaari ki 4 bhujayein hain.", pent), true);
  assert.equal(countContradicts("Board par sab bhujayein jodo: kul 20 m.", pent), false, "a total is not a side value");
  assert.equal(countContradicts("Dekho, 4 hisse hain aur 3 rangin hain.", { parts: 4, shaded: 1 }), true);
  // director5's false flag: a count the board drew but never wrote is not a missing number
  assert.equal(screenContradictions("Board par dekho, beech mein 2 nishaan hain.", { shape: null, numbers: ["0", "1"], counts: line }).length, 0);
});

test("{friend} fills a card's graded fields too: the friend's wrong pick is graded as its misconception", async () => {
  const { scriptThenItem } = await import("../server/director/script.js");
  const it = scriptThenItem("s1", { targets: "m-x", then: { prompt: { hi: "{friend} ya Ravi, kaun sahi hai", en: "{friend} or Ravi, who is right" }, key: "Ravi", accept: [], wrongIfMis: "{friend}" } });
  assert.equal(it.scriptThen.wrongIfMis, "{friend}", "the then-card carries its listed wrong pick");
});

test("a version 2.1 script is walked, not only validated (director6 first start: every 2.1 script fell back to the kit)", async () => {
  const { setScriptForTest, scriptIdOf, WALK_VERSIONS } = await import("../server/director/script.js");
  const keep = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT;
  try {
    const s = structuredClone(SC); s.version = 2.1;
    setScriptForTest(); setScriptForTest(K.topicId, s);
    assert.ok(WALK_VERSIONS.has(2.1));
    assert.equal(scriptIdOf(K), `${K.topicId}@2.1`);
  } finally { setScriptForTest(); if (keep === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = keep; }
});

test("scriptWhyNot names why a topic has no walkable script (version, missing file, validation)", async () => {
  const { setScriptForTest, scriptWhyNot } = await import("../server/director/script.js");
  const keep = { s: process.env.TAXILA_R7_SCRIPT, d: process.env.TAXILA_R7_SCRIPT_DIR };
  try {
    process.env.TAXILA_R7_SCRIPT = "on"; process.env.TAXILA_R7_SCRIPT_DIR = "/nonexistent-scripts";
    setScriptForTest();
    assert.match(scriptWhyNot(K), /no readable script/);
    setScriptForTest(K.topicId, structuredClone(SC));
    assert.equal(scriptWhyNot(K), null, "a walkable script: no reason");
  } finally {
    setScriptForTest();
    for (const [k, v] of [["TAXILA_R7_SCRIPT", keep.s], ["TAXILA_R7_SCRIPT_DIR", keep.d]]) if (v === undefined) delete process.env[k]; else process.env[k] = v;
  }
});

test("SC1 (director6): authored lines that match their board are never flagged; real miscounts still are", async () => {
  const { screenContradictions } = await import("../server/brain/say.js");
  const f = (numbers, counts) => ({ shape: null, numbers, counts });
  const eighths = f(["0", "1", "1/8", "1/4", "1/2"], { lines: [{ gaps: 8, ticks: 9, innerTicks: 7 }], marks: [{ at: "1/8", label: "1/8" }, { at: "2/8", label: "1/4" }, { at: "4/8", label: "1/2" }] });
  const quarters = f(["0", "1", "1/4"], { lines: [{ gaps: 4, ticks: 5, innerTicks: 3 }], marks: [{ at: "1/4", label: "1/4" }] });
  const bar = f(["8", "2"], { parts: 8, shaded: 2 });
  const roti = f(["1", "2"], { parts: 2, shaded: 1 });
  const rect = f(["14", "6"], { sides: 4, corners: 4, sideValues: ["14 m", "6 m", "14 m", "6 m"] });
  for (const [t, facts] of [
    ["Screen par 0 se 1 ki ek hi line par teen mark hain: 1/2, 1/4 aur 1/8, aur 1/8 bilkul 0 ke paas hai.", eighths],
    ["Screen par 0 se 1 metre tak ka ribbon hai, beech mein 3 chalk ke nishaan hain, aur ribbon 4 barabar hisson mein bata hai.", quarters],
    ["Is patti ke 8 barabar hisse hain, aur rang wale 2 hisse milkar theek ek 1/4 jitne lambe hain.", bar],
    ["Board par 2 barabar tukde hain: har tukda aadha, yaani 1/2.", roti],
    ["Ek cheenti is rectangle ke ek kone se chalti hai, uske paas ek meter hai.", rect],
  ]) assert.deepEqual(screenContradictions(t, facts), [], t);
  assert.equal(screenContradictions("Screen par dekho, beech mein 5 nishaan hain.", quarters).length, 1, "a wrong inner-mark count");
  assert.equal(screenContradictions("Is patti ke 6 barabar hisse hain.", bar).length, 1, "a wrong division");
  assert.equal(screenContradictions("Board par dekho, 2/3 ka nishaan hai.", eighths).length, 1, "a fraction off every tick");
});

test("v4 W4: the listed wrong answer beats a by-value match ('after 1/3' to a 'between 0 and 1/3' card)", async () => {
  const { classifyFast } = await import("../server/director/classify.js");
  const item = { id: "script:x:c1", answer: "between 0 and 1/3", acceptable: ["0 aur 1/3 ke beech", "1/3 se pehle", "before 1/3", "pehle"], scriptCheck: { checkId: "c1", targets: "m-x", wrongIfMis: "after 1/3" } };
  const t = { mode: "item", item, key: item.answer, also: item.acceptable };
  const g = (x) => classifyFast({ target: t, childText: x, lang: "hinglish", typed: true }).result?.outcome;
  assert.equal(g("after 1/3"), "misconception");
  assert.equal(g("1/3 ke baad"), "misconception");
  assert.equal(g("before 1/3"), "correct");
  assert.equal(g("1/3 se pehle"), "correct");
  const it2 = { id: "script:x:c2", answer: "30 m", acceptable: ["30", "30 metre"], scriptCheck: { checkId: "c2", targets: "m-y", wrongIfMis: "23 m" } };
  const t2 = { mode: "item", item: it2, key: it2.answer, also: it2.acceptable };
  assert.equal(classifyFast({ target: t2, childText: "mujhe lagta hai 30 m", lang: "hinglish", typed: true }).result?.outcome, "correct", "a numeric key still grades by value");
  assert.equal(classifyFast({ target: t2, childText: "23", lang: "hinglish", typed: true }).result?.outcome, "misconception");
});

test("{friendF}/{friendM}: kit items are filled in every field, with names never the child's", async () => {
  const { findItem } = await import("../server/director/items.js");
  const { fillFriend } = await import("../server/director/script.js");
  const kit = { items: [{ id: "k1", skillId: "s", prompt_hi: "{friendF} kehti hai ki 3/4 bada hai", prompt_en: "{friendF} says 3/4 is bigger", answer: "{friendF}", acceptable: ["{friendF} sahi hai"], hints: ["{friendM} se pucho"] }], misconceptions: [] };
  const it = findItem({ ctx: { firstName: "Zoya" } }, kit, "k1");
  assert.equal(it.prompt_hi, "Meera kehti hai ki 3/4 bada hai", "never the child's own name");
  assert.equal(it.answer, "Meera");
  assert.deepEqual(it.acceptable, ["Meera sahi hai"]);
  assert.deepEqual(it.hints, ["Kabir se pucho"]);
  assert.equal(findItem({ ctx: { firstName: "Riya" } }, kit, "k1").answer, "Zoya");
  assert.equal(fillFriend("{friend} ne kaha", "Zoya"), "Kabir ne kaha", "the v2.1 slot is unchanged");
});
