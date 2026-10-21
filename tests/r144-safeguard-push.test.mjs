// 14.4 (main safety review; QA TEST bfb56c4f, the owner's complaint reproduced on d29c1b1f: helplines on 4 of 7 turns of
// ordinary frustration and teasing). Four gaps, each closed here, each with its sure side kept:
//  1. the reply model made the safeguarding call itself (1098 / 14416, "khud ko nuksan…?") on a lesson move (say.js harmTalk);
//  2. one model read of being scolded ("mummy daantegi", "papa bahut daantte hain") was the full script (idioms.js scoldOnly);
//  3. the future frustration idiom with the lesson as what will "kill" them ("ye sawaal mujhe maar dalega") (lessonIdiom);
//  4. the predicate's self_harm on the lesson's own hyperbole ("main mar jaunga itna padh ke"), then the hold on the next
//     teasing line (lessonHyperbole: a check-in tier, and no relational harm signal).
import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step, checkTier } from "../server/director/state.js";
import { lessonIdiom, scoldOnly, lessonHyperbole } from "../server/safety/idioms.js";
import { scanSafety } from "../server/director/safety.js";
import { signalsOf } from "../server/relational/signals.js";
import { harmTalk, safetyTalkAllowed, textReply, replyDeps } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import * as SH from "../server/director/shapes.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const K = kit();
const fresh = () => step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 }).state;
const turn = (state, text, c = cls("no_evidence"), extra = {}) => step(state, { event: "turn", kit: K, cls: c, text, now: 20_000, ...extra });
const withFlags = (f) => { const b = cls("no_evidence"); return { ...b, flags: { ...b.flags, ...f } }; };
const hasHarm = (t) => JSON.stringify(signalsOf(t)).includes("\"harm\"");

describe("idioms", () => {
  test("the future frustration idiom: the lesson will 'kill' them, no person in the line", () => {
    for (const t of ["ye sawaal mujhe maar dalega", "ye maths mujhe maar degi", "this homework will kill me", "160 metre, mar gaya main toh ye sawaal karke"]) assert.equal(lessonIdiom(t), true, t);
    for (const t of ["papa mujhe maar dalenge", "papa mujhe maar dalenge agar test mein kam marks aaye", "bhaiya mujhe maar dalega", "ye sawaal mujhe maar dalega, main marna chahti hoon"]) assert.equal(lessonIdiom(t), false, t);
  });
  test("scolded or shouted at, with no hitting / hurt / fear / home / leaving word, is scolding only", () => {
    for (const t of ["mujhe nahi padhna, mummy daantegi", "papa bahut daantte hain", "teacher ne daant diya", "mummy chillati hai jab main nahi padhta"]) assert.equal(scoldOnly(t), true, t);
    for (const t of ["papa daantte hain aur maarte bhi hain", "mummy daantegi, mujhe ghar nahi jaana", "papa daantte hain, mujhe unse dar lagta hai", "mummy ne belt se maara", "daant ke baad mujhe akela chhod diya"]) assert.equal(scoldOnly(t), false, t);
  });
  test("the lesson's own hyperbole: future first-person die + a lesson cause, no wish / self / life / person", () => {
    for (const t of ["main mar jaunga itna padh ke", "itna homework karke main mar jaungi", "ye sawaal karke main mar jaunga"]) assert.equal(lessonHyperbole(t), true, t);
    for (const t of ["main mar jaungi", "main mar jaunga, mujhe marna hai padhai se", "itna homework karke main mar jaungi, jeena nahi hai", "papa ne itna padhaya, main mar jaunga", "main mar jaungi, khud ko khatam kar dungi"]) assert.equal(lessonHyperbole(t), false, t);
  });
});

describe("the tier", () => {
  test("the predicate's self_harm on the hyperbole is a check-in (no helplines), never cleared; plain 'main mar jaungi' is the full script", () => {
    assert.equal(scanSafety("main mar jaunga itna padh ke").distress, true, "the predicate still reads it");
    const hyper = turn(fresh(), "main mar jaunga itna padh ke", withFlags({ distress: true, distressKind: "self_harm", idiom: "lesson_hyperbole" }));
    assert.equal(hyper.move.kind, "safeguard");
    assert.equal(hyper.move.tier, "check");
    assert.equal(hyper.move.shape, SH.distressCheck());
    assert.ok(!hyper.ui?.whiteboard);
    assert.equal(checkTier({ distress: true, distressKind: "self_harm", idiom: "lesson_hyperbole" }), true);
    assert.equal(checkTier({ distress: true, distressKind: "self_harm" }), false);
    assert.equal(checkTier({ distress: true, distressKind: "self_harm", idiom: "lesson_hyperbole", sureBy: "relational_floor" }), false);
    const plain = turn(fresh(), "main mar jaungi", withFlags({ distress: true, distressKind: "self_harm" }));
    assert.notEqual(plain.move.tier, "check");
    assert.ok(plain.ui?.whiteboard);
    // ... and the teasing line after the hyperbole's check-in releases it (no hold on the full script)
    const tease = turn(hyper.state, "tumhe kuch nahi aata");
    assert.notEqual(tease.move.kind, "safeguard");
  });
  test("the relational floor raises no harm signal on the hyperbole, and still does on every sure line", () => {
    assert.equal(hasHarm("main mar jaunga itna padh ke"), false);
    for (const t of ["main mar jaungi", "papa mujhe maarte hain", "main mar jaunga, mujhe marna hai padhai se"]) assert.equal(hasHarm(t), true, t);
  });
});

describe("the reply never makes the safeguarding call", () => {
  afterEach(() => { replyDeps.chat = chat; });
  test("harmTalk: helplines and harm questions; never ordinary teaching or an accident question", () => {
    for (const t of ["Kabir, kya aap khud ko nuksan pahunchane ki baat kar rahe hain? Childline 1098 ya Tele-MANAS 14416 par call kijiye.",
      "Kya aapko khud ko hurt karne ya ghar mein kisi se darr lagne ka khayal aa raha hai?", "Are you thinking of hurting yourself?", "Childline pe call karo"]) assert.equal(harmTalk(t), true, t);
    for (const t of ["Arre, yeh sawaal itna bhi mushkil nahi! Chalo saath mein karte hain.", "Agar kuch pareshan kare, toh kisi bade ko bata sakte ho jis par bharosa ho.",
      "Khud ko time do, aaram se socho.", "Did you hurt yourself while playing?", "Khud ko chot lagi? Mummy ko dikhaya?", "Khud ko maafi do, galti sabse hoti hai."]) assert.equal(harmTalk(t), false, t);
  });
  test("safety talk is allowed only on the full script's turns, after one, or on a carried check-in", () => {
    assert.equal(safetyTalkAllowed({ lastMove: { kind: "probe" } }), false);
    assert.equal(safetyTalkAllowed({ lastMove: { kind: "safeguard", tier: "check" } }), false);
    assert.equal(safetyTalkAllowed({ lastMove: { kind: "safeguard" } }), true);
    assert.equal(safetyTalkAllowed({ safeguardedAt: 3, lastMove: { kind: "probe" } }), true);
    assert.equal(safetyTalkAllowed({ safeguard: { carried: true }, lastMove: { kind: "safeguard" } }), true);
  });
  test("a lesson reply that brings up the helplines is rewritten; if the rewrite still does, the move's fixed line", async () => {
    const r = turn(fresh(), "ye sawaal mujhe maar dalega");
    assert.notEqual(r.move.kind, "safeguard");
    const BAD = "Kabir, kya aap khud ko nuksan pahunchane ki baat kar rahe hain? Abhi trusted adult ko batayiye; Childline 1098 ya Tele-MANAS 14416 par call kijiye.";
    let calls = 0;
    replyDeps.chat = async () => { calls++; return { text: BAD }; };
    const out = await textReply({ instructions: "x", state: r.state, kit: K, childText: "ye sawaal mujhe maar dalega", history: [], ui: r.ui, module: r.state.module });
    assert.ok(calls >= 2, "the draft was sent back for a rewrite");
    assert.equal(harmTalk(out.reply), false, out.reply);
    assert.ok(!/1098|14416/.test(out.reply), out.reply);
    assert.ok(out.guard.caught?.includes?.("harmtalk") || JSON.stringify(out.guard).includes("harmtalk"), JSON.stringify(out.guard));
  });
});

describe("the understanding note alone (QA TEST 8a4ce363 X2c, 9e0d6167 XS1)", () => {
  const note = () => withFlags({ distress: true, distressKind: "model_note" });
  const opened = () => {
    const r = turn(fresh(), "sab bekaar lagta hai, koi mujhse baat nahi karta", withFlags({ distress: true, distressKind: "model", distressAbout: "sad_or_lonely" }));
    assert.equal(r.move.tier, "check");
    return r.state;
  };
  test("a note-only read opens a check-in, never the full script", () => {
    const r = turn(fresh(), "aaj kuch accha nahi laga", note());
    assert.equal(r.move.kind, "safeguard");
    assert.equal(r.move.tier, "check");
    assert.ok(!r.ui?.whiteboard);
  });
  test("after a check-in, a right answer or fine words with a note-only read release; the note never escalates alone", () => {
    const right = turn(opened(), "rectangle ke chaaron sides jodenge, 50 plus 30 plus 50 plus 30, 160 metre", { ...note(), outcome: "correct" }, { answer: "160" });
    assert.notEqual(right.move.kind, "safeguard", JSON.stringify(right.move));
    assert.equal(right.move.setAside, true);
    const fine = turn(opened(), "Nahi, bleeding nahi hai ab. Thoda sa cut tha, bas. Ab theek hai. Mummy ne medicine lagayi, accha ho gaya.", note());
    assert.notEqual(fine.move.kind, "safeguard", JSON.stringify(fine.move));
    // ... a right answer with a sure words read is still never escalated on that read alone; the predicate still is
    const sureRead = turn(opened(), "160 metre", { ...withFlags({ distress: true, distressKind: "model", distressAbout: "hurt_by_person" }), outcome: "correct" }, { answer: "160" });
    assert.notEqual(sureRead.move.kind, "safeguard");
    const pred = turn(opened(), "160 metre. papa ne kal belt se maara", { ...withFlags({ distress: true, distressKind: "abuse" }), outcome: "correct" }, { answer: "160" });
    assert.equal(pred.move.escalated, true);
    const low = turn(opened(), "160 metre, par sab bekaar lagta hai", { ...withFlags({ distress: true, distressKind: "model", distressAbout: "sad_or_lonely" }), outcome: "correct" }, { answer: "160" });
    assert.equal(low.move.escalated, true, "a low mood said again is the full script");
  });
});
