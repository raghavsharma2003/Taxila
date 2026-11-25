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
const { textReply, replyDeps, returnQuestion, honestTasteLine, asideAgainLine, BACK_TO_LEAD } = await import("../server/brain/say.js");
const { jointsSaid } = await import("../server/brain/turn.js");
const { classifyFast, targetFor } = await import("../server/director/classify.js");
const { dryReading } = await import("../evals/hybrid-side-by-side/dry-reader.mjs");
const { __test } = await import("../server/routes/lesson.js");
const { newLearnerState } = await import("../server/comprehension/fuse.js");

const STUB = "Achha, chalo isko saath mein dekhte hain. Ek baar phir se batao?";
// (the reply model stubbed for the whole file, never restored: the suites' walks run side by side, and a walk that put the real model back
// would end another walk's turn on the fixed carry-on line)
replyDeps.chat = async () => ({ text: STUB }); replyDeps.chatStream = replyDeps.chat;
const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
/** A lesson walked over `lines` as the dry matrix walks it ("@": the open card's key, read right). → one entry a child line. */
let walkN = 0;
async function walkSay(TOPIC, lines, persona = "offtopic") {
  // (each walk its own lesson id: a reply-path memo keyed by the lesson would carry one walk's lines into the next)
  const LID = `11111111-1111-1111-1111-${String(++walkN).padStart(12, "0")}`;
  {
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
  }
}
const kitOf = (t) => kitFromFile(getTopic(t));
const SIXER = "kal maine cricket khela, sixer maara";
// (the dry matrix's own child lines of director37's BEFORE walk, c4/dry4: steering c5-t01 up to its verdict at row 26)
const STEERING_C5T01 = ["samajh nahi aaya", "samajh nahi aaya", "pata nahi, aap batao", "thoda hindi mein samjhao", "3", "6 kilometre", "drawing karke samjhao", "ek aur picture dikhao", "6 kilometre", "pehle main try karun?", "6 kilometre", SIXER, "teesra hissa"];

describe("D1: a return led by a verdict opens on a back-to word; with none left by 049 B6.3's filter, the verdict ends on the go-on line and the return is the next turn", async () => {
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
  const { out } = await walkSay("c5-maths-ch02-t01", [...STEERING_C5T01, "haan"], "steering");
  test("steering c5-t01 (director36's row 26: verdict, then \"Sixer ki baat tumne ki thi: …\"): the verdict ends on the go-on line, the told return alone on the next turn", () => {
    const v = out.at(-2), ret = out.at(-1);
    assert.deepEqual(v.seams.slice(0, 1), ["verdict"]); assert.ok(!v.seams.includes("return"), v.text);
    assert.equal(v.lm.noFit, "return"); assert.ok(v.lm.vpcGoOn && v.text.endsWith(v.lm.vpcGoOn), v.text);
    assert.ok(!/[?？]/.test(v.text), "no question on the go-on turn");
    assert.deepEqual(ret.seams, ["return"]); assert.equal(ret.lm.returned?.topic, "cricket");
    assert.match(ret.text, /^Sixer ki baat tumne ki thi: /);
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

