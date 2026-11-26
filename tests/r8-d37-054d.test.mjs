// to-brain 054 D, closes and returns (round d37; docs/patches/to-brain/054-director36-the-turns-shape-walk-only.md section D and main's rulings:
// D4 out of d37), with main's two added items (OPEN-after-A item 1: a second taste ask straight after the first exchange; RULING-A7 item 5:
// the said-again line). Walked as the dry matrix walks a lesson — routes/lesson.js planTurn, brain/say.js textReply with the reply model
// stubbed, the guard's bookkeeping as brain/turn.js keeps it — on the live scripts, the child's lines read by code's reader, else the dry
// stub; and the three D.5 predicates on made rows.
import { test, describe } from "node:test";
import assert from "node:assert/strict";

const { initLessonState, step, requeueMissedReturn } = await import("../server/director/state.js");
const { kitFromFile } = await import("../server/content/kits.js");
const { getTopic } = await import("../server/content/curriculum.js");
const { findItem } = await import("../server/director/items.js");
const { textReply, replyDeps, returnQuestion, honestTasteLine, asideAgainLine, BACK_TO_LEAD, likeToldBefore } = await import("../server/brain/say.js");
const { holdReplyStub } = await import("./_reply-hold.mjs");
const { jointsSaid } = await import("../server/brain/turn.js");
const { classifyFast, targetFor } = await import("../server/director/classify.js");
const { dryReading } = await import("../evals/hybrid-side-by-side/dry-reader.mjs");
const { __test } = await import("../server/routes/lesson.js");
const { newLearnerState } = await import("../server/comprehension/fuse.js");
const { D37D_PREDICATES: P } = await import("../evals/hybrid-side-by-side/d37d-predicates.mjs");
const { PREDICATES, PENDING } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");

// (the reply model stubbed for each walk's whole length through tests/_reply-hold.mjs, counted across walks and files: the suites' walks run
// side by side, here and in other files sharing the process, and a walk that put the real model back would end another walk's turn on the
// fixed carry-on line. Was: stubbed once at import and never restored, which another file's walk ending put the real model back under)
const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
/** A lesson walked over `lines` as the dry matrix walks it ("@": the open card's key, read right). → one entry a child line. */
let walkN = 0;
async function walkSay(TOPIC, lines, persona = "offtopic") {
  // (each walk its own lesson id: a reply-path memo keyed by the lesson would carry one walk's lines into the next)
  const LID = `11111111-1111-1111-1111-${String(++walkN).padStart(12, "0")}`;
  const free = holdReplyStub();
  try {
    const kit = kitFromFile(getTopic(TOPIC));
    const classLevel = Number(/^c(\d)/.exec(TOPIC)[1]);
    const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "a pretend baby elephant" }, ageBand: "10-15", lang: "hinglish",
      interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: TOPIC, classLevel, sessionId: LID, teacher: "director", lessonKey: `${TOPIC}:${persona}:` };
    let r = step(initLessonState({ topicId: TOPIC, kit, ctx, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
    const brief = { firstName: "Riya", classLevel, ageBand: "10-15", languagePref: "hinglish", interests: ["cricket"], recentWins: [], activeMisconceptions: [], memoryCallbacks: [],
      vibe: { pace: "medium", verbosity: "brief", humour: "medium" }, relationshipStage: "first_meeting (0 sessions together)" };
    r = { ...r, state: { ...r.state, brief, mode: "text", kitVerified: kit.verified, kitHash: kit.hash } };
    const t0 = await textReply({ instructions: "x", state: r.state, kit, childText: "", ui: r.ui, module: null });
    r.state.recent = [...(r.state.recent ?? []), { who: "teacher", text: t0.reply }];
    const CHILD = { id: "00000000-0000-0000-0000-00000000aaaa", legal_mode: "M1", class_level: classLevel };
    const LESSON = { id: LID, started_at: new Date(0).toISOString() };
    let live = { state: newLearnerState({ childId: CHILD.id, classLevel }), maxSeq: 0 };
    const out = [];
    for (const raw of lines) {
      const s = r.state; const it = s.activeItemId ? findItem(s, kit, s.activeItemId) : null;
      const text = raw === "@" ? (it ? String(it.answer) : "haan") : raw;
      const target = targetFor(s, kit, it);
      const cls = raw === "@" ? { outcome: it ? "correct" : "no_evidence", confidence: 0.9, flags: {} } : { ...(classifyFast({ target, childText: text, lang: "hinglish", classLevel, typed: true }).result ?? dryReading(target)) };
      const s1 = { ...s, seq: (s.seq ?? 0) + 1, recent: [...(s.recent ?? []), { who: "child", text }] };
      const p = await __test.planTurn(s1, cls, { kit, child: CHILD, lesson: LESSON, activeItem: it, moduleOnly: false, moduleEvents: [], answer: text, childText: text, leaked: false, live: Promise.resolve(live), carried: [], now: (s.turn + 1) * 20_000 });
      live = { state: p.learner.after, maxSeq: live.maxSeq };
      r = { ...p.r, state: { ...p.r.state, mode: "text" } };
      const t = await textReply({ instructions: "x", state: r.state, kit, childText: text, history: r.state.recent.slice(0, -1), ui: r.ui, module: null });
      const g = t.guard ?? {}; let nx = r.state; let ui = r.ui;
      if (g.returnMissed && nx.lastMove?.returned) nx = { ...nx, later: requeueMissedReturn(nx, g).later };
      if (g.cardHeld && nx.activeItemId) { nx = { ...nx, cardUnsaid: nx.activeItemId }; if (ui?.ask) ui = { ...ui, ask: null }; }
      if (g.bodyHeld?.length) nx = { ...nx, bodyUnsaid: g.bodyHeld };
      if (g.backTo) nx = { ...nx, backToN: (nx.backToN ?? 0) + 1 };
      if (g.whyJoint != null) nx = { ...nx, whyJoint: { last: g.whyJoint, n: (nx.whyJoint?.n ?? 0) + 1 } };
      nx = { ...nx, dekhoN: (nx.dekhoN ?? 0) + (String(t.reply).match(/(?<![\p{L}])Dekho,/gu)?.length ?? 0) };
      if (g.jointsUsed?.length) { const jn = { ...(nx.jointN ?? {}) }; for (const k of jointsSaid(g, t.reply)) jn[k] = (jn[k] ?? 0) + 1; nx = { ...nx, jointN: jn }; }
      if (g.asideEnd && !ui?.ask) nx = { ...nx, asideReplyDue: true };
      nx = { ...nx, returnAsked: g.asideEnd && g.returnSaid && nx.lastMove?.returned?.topic ? { topic: nx.lastMove.returned.topic } : undefined };
      if (!nx.returnAsked && g.asideEnd && g.honestNow && nx.lastMove?.tasteAsked?.topic) nx = { ...nx, returnAsked: { topic: nx.lastMove.tasteAsked.topic } };
      nx = { ...nx, recent: [...(nx.recent ?? []), { who: "teacher", text: t.reply }] };
      r = { ...r, state: nx, ui };
      out.push({ child: text, text: norm(t.reply), seams: (g.seams ?? []).map((x) => x.right), lm: nx.lastMove ?? {}, state: nx, ui, guard: g });
    }
    return { out, kit };
  } finally { free(); }
}
const kitOf = (t) => kitFromFile(getTopic(t));
const SIXER = "kal maine cricket khela, sixer maara";
// (the dry matrix's own child lines of director37's BEFORE walk, c4/dry4: steering c5-t01 up to its verdict at row 26)
const STEERING_C5T01 = ["samajh nahi aaya", "samajh nahi aaya", "pata nahi, aap batao", "thoda hindi mein samjhao", "3", "6 kilometre", "drawing karke samjhao", "ek aur picture dikhao", "6 kilometre", "pehle main try karun?", "6 kilometre", SIXER, "teesra hissa"];

describe("D1: a return led by a verdict opens on a back-to word; with none left by 049 B6.3's filter, the return is said with the verdict as at a23e5c45d (main's second ruling on cause D, item 1: the go-on fallback taken out)", async () => {
  test("returnQuestion, lead \"verdict\": a back-to form where the aside told nothing; none (null) where every back-to form asks what was told", () => {
    const kit = kitOf("c6-maths-ch07-t01");
    for (const seed of [1, 2, 3, 7, 11]) {
      const st = { seed, turn: 20, later: [{ id: "p1", topic: "cricket", servedAt: 20 }], recent: [] };
      const q = returnQuestion("cricket", "hinglish", st, { said: "mujhe cricket pasand hai", kit, lead: "verdict" });
      assert.ok(q && BACK_TO_LEAD.test(q), `seed ${seed}: ${q}`);
      assert.equal(returnQuestion("cricket", "hinglish", st, { said: SIXER, kit, lead: "verdict" }), null, `seed ${seed}`);
    }
    // (the back-to openers, and the cold ones director36's judges heard)
    for (const x of ["Ab cricket ki baat karte hain: usmein sabse mazedaar kya hai?", "Jaisa kaha tha, ab cricket par aate hain, uski sabse achhi baat kya hai?", "Chalo, ab cricket ki baat karte hain.", "Cricket ki baari aa gayi: uske baare mein thoda aur batao na?", "Achha, ab cricket ki baat sunti hoon, uske baare mein kuch aur bataoge?"]) assert.ok(BACK_TO_LEAD.test(x), x);
    for (const x of ["Sixer ki baat tumne ki thi: tab tumhare saath kaun tha?", "Cricket wali baat batao na, tumhe uski kaunsi baat pasand hai?", "Cricket mein kya kuch aisa hai jise tum naap sakte ho?", "Tumne cricket ki baat chhedi thi; ab batao, uske baare mein kya kehna tha?"]) assert.ok(!BACK_TO_LEAD.test(x), x);
  });
  // (d38 re-pin, to-brain 055 C1 as main ruled in RULING-A2 A(i): the eleventh line's miss is the cap with remediation[2].simpler unsaid — it
  // is now that wording ending on the invitation (C1), and the key with its reason comes at one more miss, "6 kilometre" again; was: the key
  // at the eleventh line. The verdict and the told return at "teesra hissa" are as before)
  const { out } = await walkSay("c5-maths-ch02-t01", [...STEERING_C5T01.slice(0, 11), "6 kilometre", ...STEERING_C5T01.slice(11), "haan"], "steering");
  test("steering c5-t01 (director36's row 26: verdict, then \"Sixer ki baat tumne ki thi: …\"): no back-to form survives, so the told return is said with the verdict, as at a23e5c45d — never a go-on turn with no question", () => {
    const v = out.at(-2), next = out.at(-1);
    assert.deepEqual(v.seams, ["verdict", "return"], v.text);
    assert.notEqual(v.lm.noFit, "return"); assert.equal(v.lm.vpcGoOn, undefined);
    assert.match(v.text, /\. Sixer ki baat tumne ki thi: tab tumhare saath kaun tha\?$/);
    assert.equal(v.lm.returned?.topic, "cricket");
    assert.ok(!next.seams.includes("return"), "said once");
  });
});

describe("D2: her AI exchange does not serve a park of something the child told; it is returned at the next boundary", async () => {
  const { out } = await walkSay("c6-maths-ch06-t01", ["haan, samajh aaya", "9 cm", "unatees", "9 cm", "pandrah cm", "30", "20 centimetres", "pata nahi, aap batao", SIXER, "aapko virat pasand hai?", "chauka", "mujhe nahi pata", "drawing karke samjhao", "chaar metre", "haan"]);
  test("offtopic c6 (director36 row 18 → 20): the AI line after the park is no return; the park stays open", () => {
    const ai = out[9];
    assert.deepEqual(ai.seams, ["aiQuestion"]); assert.ok(!ai.lm.tasteAsked?.served && !ai.guard.returnSaid, ai.text);
    assert.match(ai.text, /^Main AI teacher hoon, isliye meri apni koi pasand nahi hoti\. /);
    assert.ok((ai.state.later ?? []).some((e) => e.topic === "cricket" && e.servedAt == null && e.said === SIXER));
  });
  test("and the park is returned at a later boundary, before the wrap", () => {
    const k = out.findIndex((t, n) => n > 9 && t.seams.includes("return"));
    assert.ok(k > 9);
    assert.equal(out[k].lm.returned?.topic, "cricket");
  });
});

describe("D3: the AI line never asks a favourite the child's question named; a later ask asks the first form not asked, else the line alone; \"kya kehna tha\" asks what was told", () => {
  const first = "Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?";
  test("a later ask with a topic named: not \"Tumhara favourite kaun hai?\" but the next form; with both asked, the honest line alone", () => {
    assert.equal(honestTasteLine("Virat", "hinglish", 2, [first]), "Main AI hoon, meri koi pasand nahi hoti. Virat ko tum kiske saath dekhte ho?");
    const both = [first, "Main AI hoon, meri koi pasand nahi hoti. Virat ko tum kiske saath dekhte ho?", "Meri apni pasand nahi hoti, main AI hoon. Tumne pehli baar Virat ko kab dekha tha?"];
    assert.equal(honestTasteLine("Virat", "hinglish", 4, both), "Main AI hoon, meri koi pasand nahi hoti.");
    for (let n = 2; n < 6; n++) assert.doesNotMatch(honestTasteLine("Virat", "hinglish", n, [first]), /favourite/i);
    // (no topic named: the favourite form is still a question she may ask)
    assert.match(honestTasteLine("", "hinglish", 2, [first]), /Tumhara favourite kaun hai\?$/);
  });
  test("the AI line's first form and its told form are unchanged (the AI line itself is never dropped)", () => {
    assert.equal(honestTasteLine("Virat", "hinglish", 1, []), first);
    assert.match(honestTasteLine("Virat", "hinglish", 1, [], true), /^Main AI teacher hoon, isliye meri apni koi pasand nahi hoti\. /);
  });
  test("\"… kya kehna tha?\" is a question about what was told: a told aside's return never asks it (staged c4-ch01-t02's own form)", async () => {
    const { readFileSync } = await import("node:fs");
    const script = JSON.parse(readFileSync(new URL("../data/lesson-scripts-staged/c4-maths-ch01-t02.json", import.meta.url), "utf8"));
    const kit = { topicId: "c4-maths-ch01-t02", __joints: { asideReturn: script.joints.asideReturn } };
    for (const seed of [1, 2, 3, 4, 5, 6, 7]) {
      const q = returnQuestion("cricket", "hinglish", { seed, turn: 9, later: [], recent: [] }, { said: SIXER, kit });
      assert.doesNotMatch(q, /kya kehna tha/, `seed ${seed}`);
    }
  });
});

describe("D3, main's added item (OPEN-after-A item 1): her taste asked again straight after the first exchange — the honest line alone and what the lesson was about to say", async () => {
  const LINES = ["haan, samajh aaya", "3", "6 kilometre", "pata nahi", "one sixth", "1 upon 3", "eight", "1/8", "picture dikhao", "between 0 and 1/5 hai na", "1/10 wala", "chaar gap", "dhai sau metre", "pehle main try karun?", "1 upon 11", "1/12", "pehle mark par", "aapko virat pasand hai?", "chauka", "aapko virat pasand hai?"];
  const { out } = await walkSay("c5-maths-ch02-t01", LINES, "steady");
  test("c5-t01: the AI line, her reply (the point and its check-in, card held), the ask again: the honest line alone and the held card in one turn", () => {
    const [ai, reply, again] = out.slice(-3);
    assert.deepEqual(ai.seams, ["aiQuestion"]);
    assert.equal(reply.lm.replyPoint, "afterAiLine");
    assert.ok(again.lm.tasteAsked?.alone, JSON.stringify(again.lm.tasteAsked));
    assert.match(again.text, /^Main AI hoon, meri koi pasand nahi hoti\. /);
    assert.equal(again.seams.at(-1), "card"); assert.ok(again.ui?.ask?.itemId, "the card posed");
    assert.equal((again.text.match(/[?？]/g) ?? []).length, 1, "one question: the card's");
  });
  const w = await walkSay("c6-maths-ch06-t01", ["haan, samajh aaya", "9 cm", "unatees", "9 cm", "pandrah cm", "30", "20 centimetres", "pata nahi, aap batao", SIXER, "aapko virat pasand hai?", "chauka", "aapko virat pasand hai?"]);
  test("c6 (a worked step): the honest line alone and the step's question in one turn — no turn held", () => {
    const again = w.out.at(-1);
    assert.ok(again.lm.tasteAsked?.alone);
    assert.match(again.text, /^Main AI hoon, meri koi pasand nahi hoti\. /);
    assert.equal(again.seams.at(-1), "stepAsk"); assert.ok(!again.state.splitHold);
  });
  test("goOnNoTeach reads no three turns running with no teaching part on either walk", () => {
    for (const o of [out, w.out]) {
      const rows = o.flatMap((t) => [{ who: "child", text: t.child }, { who: "teacher", text: t.text, seams: t.seams.map((right) => ({ right })) }]);
      rows.forEach((x, i) => assert.equal(x.who === "teacher" ? PREDICATES.goOnNoTeach({ rows }, x, i, {}) : null, null, `row ${i}`));
    }
  });
});

describe("the said-again line (RULING-A7 item 5): the script's own park form that speaks of the side-topic as kept, where one fits; else code's line", () => {
  test("c6-ch07-t01 and c5-t01 have one (\"… sambhaal ke rakhi hai …\"); c6-ch06-t01 has none: code's line stays (named for Learning)", () => {
    assert.equal(asideAgainLine("cricket", "hinglish", { recent: [] }, kitOf("c6-maths-ch07-t01")), "Wah, cricket ki baat sambhaal ke rakhi hai, baad mein zaroor sunungi.");
    assert.equal(asideAgainLine("cricket", "hinglish", { recent: [] }, kitOf("c5-maths-ch02-t01")), "Wah, cricket ki baat sambhaal ke rakhi hai, baad mein zaroor sunungi.");
    assert.equal(asideAgainLine("cricket", "hinglish", { recent: [] }, kitOf("c6-maths-ch06-t01")), "Cricket wali baat maine likh li hai.");
  });
  test("a kept form she said in her last four turns is not said again: code's line", () => {
    const recent = [{ who: "teacher", text: "Wah, cricket ki baat sambhaal ke rakhi hai, baad mein zaroor sunungi. Chalo, pehle yahan se aage badhte hain." }];
    assert.equal(asideAgainLine("cricket", "hinglish", { recent }, kitOf("c6-maths-ch07-t01")), "Cricket wali baat maine likh li hai.");
  });
});

describe("the matrix's own rows (d/dry1, d/dry2 of round d37's builder D): the walk fixed where D's turns met causes A to C", async () => {
  test("a child who answered her question what they like in it gets the AI line's told form at the first ask (dry offtopic c6-ch07-t01 48: returnAsksAgain)", () => {
    const recent = [{ who: "teacher", text: "Haan, bilkul theek. Chalo, cricket ke baare mein batao, tumhe woh kyun pasand hai?" }, { who: "child", text: "batting sabse achhi lagti hai" },
      { who: "teacher", text: "Achha, toh tumhe batting pasand hai! Do ek hi size ki chocolate … Yahan tak theek hai?" }, { who: "child", text: "aapko virat pasand hai?" }];
    assert.equal(likeToldBefore({ recent }), true);
    assert.equal(likeToldBefore({ recent: recent.slice(2) }), false);
    assert.doesNotMatch(honestTasteLine("Virat", "hinglish", 1, [], true), /sabse achha/);
  });
  const LINES = ["haan, samajh aaya", "3", "one sixth", "3", "ek bata teen", "8 gap", "1/10 wala", "2", "1/3 km", "gyarah marks lagenge", "1/4 kilometer", "samajh nahi aaya", "drawing karke samjhao", "1/10", "1/11 hai na", "Hindi mein bolo", "1/4", "after 1/5", "ruko, main khud karti hoon", "between 0 and 1/5 hai na", "1/12", "pehle mark pe 1/9 hai", "mujhe cricket pasand hai", SIXER, "8/5", "8/5", "5/8 par", "aapko virat pasand hai?", "batting", "haan"];
  const { out } = await walkSay("c5-maths-ch02-t01", LINES);
  test("offtopic c5-t01: the told return with its verdict (no go-on turn), the AI line, her reply carrying the held point and its check-in, then the card (replyPointCardNext)", () => {
    const [v, ai, rp, next] = out.slice(-4);
    assert.deepEqual(v.seams, ["verdict", "return"]); assert.notEqual(v.lm.noFit, "return");
    assert.ok(ai.seams.includes("aiQuestion"), ai.seams.join());
    assert.deepEqual(rp.seams.slice(-2), ["point", "checkin"]);
    assert.deepEqual(next.seams, ["card"]); assert.ok(next.ui?.ask?.itemId);
  });
});

describe("D.5 predicates: each trips on a made row and passes its fixed twin (returnColdAfterVerdict pending since main's second ruling on cause D, item 1)", () => {
  const T = (o) => ({ who: "teacher", ...o, seams: (o.seams ?? []).map((right) => ({ right })) });
  const C = (text, intent = null) => ({ who: "child", text, ...(intent ? { intent } : {}) });
  test("registered; shareParkUnreturned and aiAsksTold gated, returnColdAfterVerdict pending (its rows are Learning's: a told return needs a form opening on a back-to word)", () => {
    for (const k of ["shareParkUnreturned", "aiAsksTold"]) { assert.equal(typeof PREDICATES[k], "function", k); assert.ok(!PENDING.has(k), k); }
    assert.equal(typeof PREDICATES.returnColdAfterVerdict, "function"); assert.ok(PENDING.has("returnColdAfterVerdict"));
  });
  test("returnColdAfterVerdict", () => {
    const cold = T({ text: "Bilkul sahi. Sixer ki baat tumne ki thi: tab tumhare saath kaun tha?", returnSaid: true, seams: ["verdict", "return"] });
    const warm = T({ text: "Sahi jawab. Ab cricket ki baat karte hain: usmein sabse mazedaar kya hai?", returnSaid: true, seams: ["verdict", "return"] });
    const alone = T({ text: "Sixer ki baat tumne ki thi: tab tumhare saath kaun tha?", returnSaid: true, seams: ["return"] });
    assert.ok(P.returnColdAfterVerdict({ rows: [] }, cold, 0));
    assert.equal(P.returnColdAfterVerdict({ rows: [] }, warm, 0), null);
    assert.equal(P.returnColdAfterVerdict({ rows: [] }, alone, 0), null, "a return alone is no return after a verdict");
  });
  test("shareParkUnreturned", () => {
    const park = T({ text: "Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Pehle is sawaal ka jawab do.", seams: ["park", "answerFirst"] });
    const ai = T({ text: "Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?", returnSaid: true, seams: ["aiQuestion"] });
    const bye = T({ text: "Aaj ke liye itna hi, phir milte hain.", move: "wrap", seams: ["goodbye"] });
    const ret = T({ text: "Sixer ki baat tumne ki thi: tab tumhare saath kaun tha?", returnSaid: true, seams: ["return"] });
    const bad = [C(SIXER, "aside"), park, C("aapko virat pasand hai?", "aside"), ai, C("chauka"), bye];
    assert.ok(P.shareParkUnreturned({ rows: bad }, bye, 5));
    const good = [C(SIXER, "aside"), park, C("haan"), ret, C("Rohit"), bye];
    assert.equal(P.shareParkUnreturned({ rows: good }, bye, 5), null);
    assert.equal(P.shareParkUnreturned({ rows: bad }, ai, 3), null, "read at the end row only");
    // (main's second ruling on cause D, item 1: the allowance for a return D1's fallback held for the turn the child left on goes with the
    // fallback — such a row is read as any park never returned)
    const goOn = T({ text: "Bilkul sahi: … 100 − 70 = 30 centimetre bacha. Theek hai, abhi agli baat dekhte hain.", noFit: "return", seams: ["verdict", "aside"] });
    const left = [C(SIXER, "aside"), park, C("70 cm"), goOn, C("ab main jaati hoon, bye"), bye];
    assert.ok(P.shareParkUnreturned({ rows: left }, bye, 5));
  });
  test("aiAsksTold", () => {
    const fav = T({ text: "Main AI hoon, meri koi pasand nahi hoti. Tumhara favourite kaun hai?", seams: ["aiQuestion"] });
    const next = T({ text: "Main AI hoon, meri koi pasand nahi hoti. Virat ko tum kiske saath dekhte ho?", seams: ["aiQuestion"] });
    assert.ok(P.aiAsksTold({ rows: [C("aapko virat pasand hai?"), fav] }, fav, 1));
    assert.equal(P.aiAsksTold({ rows: [C("aapko virat pasand hai?"), next] }, next, 1), null);
    assert.equal(P.aiAsksTold({ rows: [C("aapko pasand hai?"), fav] }, fav, 1), null, "a question that names nothing");
    const said = T({ text: "Bilkul sahi. Tumne cricket ki baat chhedi thi; ab batao, uske baare mein kya kehna tha?", returnSaid: true, seams: ["verdict", "return"] });
    assert.ok(P.aiAsksTold({ rows: [C(SIXER, "aside"), T({ text: "Cricket ki baat bhi hogi.", seams: ["park"] }), C("4"), said] }, said, 3));
    assert.equal(P.aiAsksTold({ rows: [C("mujhe cricket pasand hai", "aside"), T({ text: "Cricket ki baat bhi hogi.", seams: ["park"] }), C("4"), said] }, said, 3), null, "an aside that told nothing");
  });
});

describe("RULING-E2 item 1: asideFrameTwice reads the reply-kind forms of 053 C2 as reply frames, as the walk does", () => {
  // (d37 close item 8: row 34 now says "Achha, papa! Yeh batane ke liye shukriya." — the {word} is no longer the auxiliary "hoon")
  test("a reply after a liking reply is read against that reply (offtopic c4-ch01-t02 34 against row 28, not row 10); the same frame twice running is still flagged", async () => {
    const { D34C_PREDICATES: Q, asideFrameOf } = await import("../evals/hybrid-side-by-side/d34c-predicates.mjs");
    const { replyFrameOf } = await import("../server/brain/asideReplies.js");
    const t = (text) => ({ who: "teacher", text }), c = (text) => ({ who: "child", text });
    const liking = "Achha, toh tumhe chauka pasand hai!";
    assert.equal(asideFrameOf(t(liking)), "Achha, toh tumhe {phrase} pasand hai!", "a reply-kind form is a frame");
    assert.equal(asideFrameOf(t(liking)), replyFrameOf(liking), "the frame the walk reads");
    const rows = [t("Achha, toh Rohit! Yeh batane ke liye shukriya."), c("chauka"), t(liking), c("papa ke saath dekhta hoon"), t("Achha, papa! Yeh batane ke liye shukriya.")];
    assert.equal(Q.asideFrameTwice({ rows }, rows[4], 4), null, "row 28's liking frame is her last: not flagged");
    const twice = [t("Achha, toh tumhe batting pasand hai!"), c("chauka"), t(liking)];
    assert.match(String(Q.asideFrameTwice({ rows: twice }, twice[2], 2)), /twice running/, "the liking frame in two replies running");
    const old = [t("Achha, toh Rohit! Yeh batane ke liye shukriya."), c("papa ke saath dekhta hoon"), t("Achha, papa! Yeh batane ke liye shukriya.")];
    assert.match(String(Q.asideFrameTwice({ rows: old }, old[2], 2)), /twice running/, "the same kind frame twice running");
  });
});
