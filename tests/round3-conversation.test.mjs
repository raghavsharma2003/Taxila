// Round 3 (conversation stream, 2026-10-09): replies right the first time. The first pose of a question is a lead-slot turn
// (the model writes only the bridge, code adds the verified question), a re-pose that ends on the card's form is not
// "drift", a re-pose still bare after every repair gets a fixed code lead (never the bare question), the praise guard reads
// the owner's prod case, a stop check-in offers a choice, a granted break asks nothing, a share from their life is kept for
// later (a promise that is kept), and two recited prompt notes are reworded. The reply model is replaced (replyDeps), no
// network. Needs docs/design/round3/conversation/patches (APPLY.md).
import { describe, test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { leadSlotWanted, leadSlotNote, requestNote, turnNote, LEAD_MAX_FIRST } from "../server/conversation/compose.js";
import { fallbackLead, FALLBACK_LEADS, LEAD_VARIANTS } from "../server/conversation/fallback-lead.js";
import { requestFromNote } from "../server/conversation/policy.js";
import { textReply, replyDeps, checkInProblems, FALLBACK, hintStatements } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { initLessonState, step } from "../server/director/state.js";
import { promptFor, asksWhy } from "../server/director/items.js";
import { praiseProblem, wrapsUp, lastQuestionOnly } from "../server/director/say.js";
import * as SH from "../server/director/shapes.js";
import { compileWithReport, SECTION_CAPS } from "../server/compiler/compile.js";
import { CHARACTERS } from "../server/compiler/characters/index.js";
import { alsoReading, readIntent } from "../server/conversation/lexicon.js";
import { kit, CTX, BRIEF, cls } from "./fixtures/kit.mjs";

const K = kit();
const fresh = () => initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 });
const turn = (r, c) => step(r.state, { event: "turn", kit: K, cls: c, now: (r.state.turn + 1) * 20_000 });
const req = (type, extra = {}) => ({ ...cls("no_evidence"), source: "request", request: { type, whole: true, src: "p5", ...extra } });
function toPractice() {
  let r = step(fresh(), { event: "start", kit: K, now: 0 });
  while (r.state.phase !== "practice" || !r.move.itemId || r.move.itemId.startsWith("fade:")) r = turn(r, cls("no_evidence"));
  return r;
}
const itemOf = (r) => K.items.find((i) => i.id === r.state.lastMove.itemId);

describe("round3 conversation", () => {
  afterEach(() => { replyDeps.chat = chat; for (const k of ["TAXILA_P5_R3CONV", "TAXILA_P5_LEADSLOT", "TAXILA_P5"]) delete process.env[k]; });
  const scripted = (...texts) => { const seen = []; let i = 0; replyDeps.chat = async (_d, msgs) => { seen.push(msgs.at(-1).content); return { text: texts[Math.min(i++, texts.length - 1)] }; }; return seen; };

  test("compose: a first pose takes the lead slot; a diagnostic, a why, a close and a content request never do", () => {
    assert.ok(leadSlotWanted({ firstPose: true, pinned: "q" }));
    assert.ok(!leadSlotWanted({ firstPose: true, pinned: null }));
    assert.ok(!leadSlotWanted({ firstPose: true, pinned: "q", diagnostic: true }));
    assert.ok(!leadSlotWanted({ firstPose: true, pinned: "q", whyProbe: true }));
    assert.ok(!leadSlotWanted({ firstPose: true, pinned: "q", closing: true }));
    assert.ok(!leadSlotWanted({ firstPose: true, pinned: "q", request: "example" }), "content requests keep the one-call path (round 2)");
    const note = leadSlotNote({ first: true, confirm: true, ageBand: "10-15" });
    assert.match(note, /the lesson goes on/);
    assert.match(note, /First confirm that their last answer was right/);
    assert.match(note, new RegExp(`at most ${LEAD_MAX_FIRST["10-15"]} words`));
    assert.ok(!/"[^"]{20,}"/.test(note), "a shape, never a quoted line she could recite");
    assert.ok(!/First confirm/.test(leadSlotNote({ first: true })), "no confirmation asked when the last answer was not right");
    assert.match(leadSlotNote({ first: true, noAnswer: true }), /not an answer: no praise or agreement word/);
  });

  test("first pose: the model writes the bridge, code adds the question byte for byte, one model call, no rewrite", async () => {
    const r = toPractice();
    const item = itemOf(r);
    const q = promptFor(item, CTX.lang);
    // the model asks its own question and re-words the kit question: both are cut, the verified one is appended
    const seen = scripted(`Chalo Riya, ab ek chhota sawaal. Ek roti ke kitne tukde hain?`);
    const out = await textReply({ instructions: "x", state: r.state, kit: K, childText: "achha", history: [], ui: r.ui, module: r.state.module, verdict: "ungraded" });
    assert.ok(out.guard.leadSlot, JSON.stringify(out.guard));
    assert.equal(seen.length, 1, "one call: the slot's lead");
    assert.match(seen[0], /PART ONE ONLY/);
    assert.match(seen[0], /the lesson goes on/);
    assert.ok(out.reply.trim().endsWith(q.trim()), out.reply);
    assert.ok(out.reply.startsWith("Chalo Riya, ab ek chhota sawaal."), out.reply);
    assert.ok(!/kitne tukde hain\?/.test(out.reply), "her own question is cut");
    assert.equal(out.guard.rewritten, false);
    assert.ok(!out.guard.caught.includes("drift") && !out.guard.caught.includes("ask"), JSON.stringify(out.guard));
  });

  test("first pose after a right answer: the slot's last note asks for the confirmation first, and a confirming lead passes noconfirm", async () => {
    // right answers until one is followed by a NEW question at rung 0 (the first may get a why-probe instead)
    let r = toPractice();
    for (let k = 0; k < 6; k++) {
      const before = r.state.lastMove.itemId;
      r = turn(r, cls("correct"));
      if (r.state.lastMove.itemId && r.state.lastMove.itemId !== before && r.state.pendingWhy !== r.state.lastMove.itemId && (r.state.pinRun ?? 0) === 1) break;
    }
    assert.ok(r.state.lastMove.itemId && r.state.pendingWhy !== r.state.lastMove.itemId, "a new question is posed");
    const seen = scripted("Bilkul sahi, Riya: tumne barabar tukde gine. Ab agla.");
    const out = await textReply({ instructions: "x", state: r.state, kit: K, childText: "1/2", history: [], ui: r.ui, module: r.state.module, verdict: "correct" });
    assert.match(seen[0], /First confirm that their last answer was right/);
    assert.ok(!out.guard.caught.includes("noconfirm"), JSON.stringify(out.guard));
    assert.ok(out.reply.startsWith("Bilkul sahi, Riya"), out.reply);
  });

  test("kill switch: TAXILA_P5_R3CONV=off keeps a first pose on round 2's one-call path", async () => {
    process.env.TAXILA_P5_R3CONV = "off";
    const r = toPractice();
    const q = promptFor(itemOf(r), CTX.lang);
    const seen = scripted(`Chalo Riya. ${q}`);
    const out = await textReply({ instructions: "x", state: r.state, kit: K, childText: "achha", history: [], ui: r.ui, module: r.state.module, verdict: "ungraded" });
    assert.ok(!seen.some((m) => /PART ONE ONLY/.test(m)));
    assert.ok(!out.guard.leadSlot);
  });

  test("re-pose: a turn that answers them and ends on the card's form is not drift (the question was posed last turn)", async () => {
    const r = turn(toPractice(), req("identity"));
    assert.ok((r.state.pinRun ?? 0) > 1, "the same question is on the card again");
    const card = r.ui.ask.text;
    scripted("Main ek AI teacher hoon, koi insaan nahi, Riya.");
    const out = await textReply({ instructions: "x", state: r.state, kit: K, childText: "tum robot ho?", history: [], ui: r.ui, module: r.state.module });
    assert.ok(!out.guard.caught.includes("drift"), JSON.stringify(out.guard));
    assert.ok(out.reply.trim().endsWith(card.trim()), out.reply);
    assert.match(out.reply, /AI teacher/);
  });

  test("a re-pose still only the question after every model repair gets a fixed code lead she has not said yet, never the bare question", async () => {
    const r = turn(turn(toPractice(), cls("incorrect")), cls("incorrect"));
    const q = r.ui.ask.text;
    scripted(q);                                              // every call: only the question
    const earlier = [{ who: "teacher", text: `${FALLBACK_LEADS.hinglish.help} ${q}` }];
    const out = await textReply({ instructions: "x", state: r.state, kit: K, childText: "1/3", history: earlier, ui: r.ui, module: r.state.module, verdict: "not_yet" });
    assert.ok(out.reply.trim().endsWith(q.trim()), out.reply);
    assert.ok(out.reply.trim().length > q.trim().length + 10, `not bare: ${out.reply}`);
    assert.ok(!out.reply.startsWith(FALLBACK_LEADS.hinglish.help), "the lead she already said this lesson is not said again");
    assert.ok(!(out.guard.final ?? []).includes("bare"), JSON.stringify(out.guard));
  });

  test("fallback lead variants: none asks, none names a helpline, each is a lead of its own; avoid picks a fresh one", () => {
    for (const L of Object.values(LEAD_VARIANTS)) for (const [k, list] of Object.entries(L)) for (const x of list) {
      assert.ok(!/[?？]/.test(x), `${k}: a lead never asks`);
      assert.ok(x.split(/\s+/).length >= 4, `${k}: ${x}`);
      assert.ok(!/1098|14416/.test(x));
    }
    assert.equal(fallbackLead({ rePose: true }), FALLBACK_LEADS.hinglish.help, "no avoid: round 2's line, unchanged");
    assert.equal(fallbackLead({ rePose: true, avoid: [FALLBACK_LEADS.hinglish.help] }), LEAD_VARIANTS.hinglish.help[1]);
    assert.equal(fallbackLead({ rePose: true, hint: "Pehle tukde gino.", avoid: ["Pehle tukde gino. Kitne?"] }), LEAD_VARIANTS.hinglish.help[0], "a hint already said is not said again");
  });

  // The owner's prod case ("Aapne Pattern A ka niyam sahi pehchaana" on an ungraded turn) is DETECTED by round3 truth patch 04
  // (PRAISE_ANY_WIDE; its tests carry the case). This stream owns what happens around it: the bridge note that asks for no
  // praise word when their last line was not an answer, and the rewrite reason (tests below). No false catch here:
  test("praise guard: a plain account of what they did, or of why it is not right yet, is not praise", () => {
    assert.equal(praiseProblem("Aapne Pattern A ka niyam sahi pehchaana.", "correct"), null);
    assert.equal(praiseProblem("Aapne 10 mein 4 joda, lekin judti hui row har baar ek flag lambi hoti hai.", "not_yet"), null);
    assert.equal(praiseProblem("Aapka jawab abhi sahi nahi hai; har baar 4 badh raha hai.", "not_yet"), null);
    assert.equal(praiseProblem("Tumne 999 kaha; sahi number 9 se chhota hoga.", "not_yet"), null);
  });

  test("why-probe: asking for the rule or what they thought is asking why", () => {
    for (const t of ["Tumne kaunsa rule use karke decide kiya?", "Kya socha tumne?", "What helped you decide?", "Kis tarah pata chala?"]) assert.ok(asksWhy(t), t);
    for (const t of ["Ab agla sawaal: 3+4?", "Kaun bada hai, 1/2 ya 1/3?"]) assert.ok(!asksWhy(t), t);
  });

  test("stop check-in: naming only the stop is not a choice; the fixed check-in lines are", () => {
    assert.ok(checkInProblems("Okay, Meher. We’ll stop the lesson here.", { kind: "stop", lang: "english" }).includes("nochoice"));
    assert.ok(wrapsUp("Okay, Meher. We’ll stop the lesson here."), "and it is a goodbye before they chose");
    for (const line of [FALLBACK.english.checkinStop, FALLBACK.hinglish.checkinStop]) assert.deepEqual(checkInProblems(line, { kind: "stop" }), [], line);
    assert.deepEqual(checkInProblems("Of course, Anaya. Choose: keep going, take a short break, or stop for today.", { kind: "stop", lang: "english" }), []);
    assert.ok(!wrapsUp("Lesson yahin rukega; wapas aakar dekhenge."), "the lesson waiting for them is not a goodbye");
  });

  test("a stop check-in that names only the stop is rewritten, and the fixed line ships when the rewrite still does", async () => {
    const r = turn(toPractice(), { ...cls("no_evidence"), flags: { ...cls("no_evidence").flags, wantsToStop: true } });
    assert.equal(r.state.lastMove.checkin, "stop");
    scripted("Theek hai Riya, hum yahin rukte hain.", "Theek hai Riya, hum yahin rukte hain.");
    const out = await textReply({ instructions: "x", state: r.state, kit: K, childText: "bas karo", history: [], ui: r.ui, module: r.state.module });
    assert.ok(out.guard.caught.includes("nochoice") || out.guard.caught.includes("wrap"), JSON.stringify(out.guard));
    assert.deepEqual(checkInProblems(out.reply, { kind: "stop" }), [], out.reply);
  });

  test("after a check-in answered with a plain 'haan', the next move carries on (no talk of resting or ending)", () => {
    const r = turn(toPractice(), { ...cls("no_evidence"), flags: { ...cls("no_evidence").flags, wantsToStop: true } });
    const n = turn(r, cls("no_evidence"));
    assert.notEqual(n.state.lastMove.kind, "wrap");
    assert.match(n.state.lastMove.shape, /did not ask to stop: carry on as normal/);
    const n2 = turn(n, cls("no_evidence"));
    assert.ok(!/did not ask to stop/.test(n2.state.lastMove.shape), "one turn only");
  });

  test("a granted break asks nothing: no hand-back check, so no rewrite adds a lesson question", async () => {
    const r = turn(toPractice(), req("break"));
    assert.equal(r.state.lastMove.kind, "break");
    const seen = scripted("Theek hai Riya, chhota break lo; lesson yahin rukega, wapas aakar wahin se chalenge.");
    const out = await textReply({ instructions: "x", state: r.state, kit: K, childText: "brb", history: [], ui: r.ui, module: r.state.module, verdict: "unverified" });
    assert.equal(seen.length, 1, JSON.stringify(out.guard));
    assert.ok(!out.guard.caught.includes("flat"), JSON.stringify(out.guard));
    assert.ok(!/[?？]/.test(out.reply), out.reply);
  });

  test("agreeing to a request is not praise of an answer (unverified reading only); a graded wrong answer keeps every praise check", async () => {
    const r = turn(toPractice(), req("break"));
    scripted("Bilkul, Riya. Aap break lijiye; lesson yahin rukega.");
    const out = await textReply({ instructions: "x", state: r.state, kit: K, childText: "thoda break chahiye", history: [], ui: r.ui, module: r.state.module, verdict: "unverified" });
    assert.ok(!out.guard.caught.includes("praise"), JSON.stringify(out.guard));
    const w = turn(toPractice(), cls("incorrect"));
    scripted("Bilkul sahi! Ab dekho.", "Ab dekho, tukde barabar hain kya?");
    const out2 = await textReply({ instructions: "x", state: w.state, kit: K, childText: "1/3", history: [], ui: w.ui, module: w.state.module, verdict: "not_yet" });
    assert.ok(out2.guard.caught.includes("praise"), JSON.stringify(out2.guard));
  });

  test("a share from their life is noticed and kept for later: a real later slot, served when the question resolves", () => {
    const rq = requestFromNote({ intent: "personal_share", also: [], topic: "naya cycle", inBounds: true });
    assert.deepEqual([rq.type, rq.kind, rq.topic], ["uptake", "personal_share", "naya cycle"]);
    const r = turn(toPractice(), { ...cls("no_evidence"), request: rq });
    assert.match(r.state.lastMove.shape, /they shared something from their life \(naya cycle\)/);
    assert.match(r.state.lastMove.shape, /come back to it right after this question/);
    assert.equal(r.state.later.filter((p) => p.share).length, 1);
    // the question resolves (right answers until the next question) → the share comes back as what they told her, once
    let n = r, served = 0;
    for (let k = 0; k < 6; k++) { n = turn(n, cls("correct")); if (/come back to what they told you earlier \(naya cycle\)/.test(n.state.lastMove.shape)) served++; }
    assert.equal(served, 1, "served once, when the question on the table resolved");
    assert.ok(n.state.later.find((p) => p.share).servedAt != null);
    // a topic that fails the code screen is never kept
    const u = turn(toPractice(), { ...cls("no_evidence"), request: requestFromNote({ intent: "personal_share", also: [], topic: "my boyfriend kissed me", inBounds: true }) });
    assert.ok(!(u.state.later ?? []).some((p) => p.share), "screened out");
  });

  test("recited notes reworded: no 'sensible' in the not-yet note, no 'hard work and that is okay', a decline gives no reason and carries the hook", () => {
    assert.ok(!/sensible/.test(SH.VERDICT_NOTE.not_yet));
    assert.ok(!/hard work and that is okay/.test(SH.frustrationFirst()));
    assert.match(SH.declineOob(), /no reason why/);
    assert.match(SH.declineOob(), /hook/);
    process.env.TAXILA_P5_R3CONV = "off";
    assert.match(SH.frustrationFirst(), /hard work and that is okay/, "off: round 2's wording");
    assert.ok(!/no reason why/.test(SH.declineOob()));
  });

  test("two needs in one breath: the second need rides on the move as a note (code reading of the turn's own clauses)", () => {
    assert.deepEqual(alsoReading("thak gaya hoon, kya thoda easy kar sakte ho?", "break"), ["frustration", "easier"]);
    assert.deepEqual(alsoReading("slowly and in hindi please", "language"), ["slower"]);
    assert.deepEqual(alsoReading("boring hai, game khelein?", "visual"), ["boredom"]);
    assert.equal(alsoReading("boring hai, game khelein?", "boredom"), null, "the need the move already answers is not added again");
    assert.equal(alsoReading("hindi mein batao", "language"), null);
    assert.equal(alsoReading("3/4 aur 1/2", null), null, "an attempt with numbers is never read");
    const r = toPractice();
    const n = step(r.state, { event: "turn", kit: K, cls: req("language", { lang: "hindi" }), text: "slowly and in hindi please", now: (r.state.turn + 1) * 20_000 });
    assert.match(n.state.lastMove.shape, /they also asked you to go slower/);
  });

  test("lexicon: not following it AND giving up is frustration; a hold word before a request is a request; 'aa gaya, chalo' is back", () => {
    assert.equal(readIntent("kuch samajh nahi aa raha, chhodo")?.type, "frustration");
    assert.equal(readIntent("this is too confusing, i give up on this question")?.type, "frustration");
    assert.equal(readIntent("samajh nahi aaya")?.type, "confused");
    assert.equal(readIntent("isko chhodo")?.type, "skip");
    assert.notEqual(readIntent("ruko, pehle diagram dikhao phir question")?.type, "thinking");
    assert.equal(readIntent("ruko soch raha hoon pehle gin leta hoon")?.type, "thinking");
    for (const t of ["aa gaya, chalo", "back, let's go", "आ गया"]) assert.equal(readIntent(t)?.type, "back", t);
    assert.notEqual(readIntent("the back of the book")?.type, "back");
  });

  test("a push on what was just parked is a short real engagement now, never a second 'after this question'", () => {
    const r = turn(toPractice(), req("park", { topic: "favourite cricketer", learning: false }));
    assert.match(r.state.lastMove.shape, /promise to come back to it/);
    const n = turn(r, req("park", { topic: "favourite cricketer", learning: false }));
    assert.match(n.state.lastMove.shape, /engage for real/);
    assert.ok(!/promise to come back/.test(n.state.lastMove.shape));
  });

  test("budget: every round-3 move shape, with every optional note, fits the MOVE section (an over-cap section is a 500)", () => {
    const TEXT = "thak gaya hoon, kya thoda easy kar sakte ho, slowly please, boring hai";
    const types = [["decline"], ["park", { topic: "cricket match kal India ka" }], ["detour", { topic: "why is the sky blue and why sunsets are red" }],
      ["uptake", { kind: "personal_share", topic: "mere naye cycle ki ghanti aur wheels" }], ["uptake", { kind: "joke" }], ["frustration"], ["boredom"], ["identity"],
      ["adult"], ["unclear"], ["answer_q"], ["adopt", { method: "step by step with a picture first then numbers" }], ["back"], ["break"], ["easier"]];
    for (const address of ["tum", "aap"]) for (const ageBand of ["6-9", "10-15"]) for (const lane of ["text", "voice"]) for (const [type, extra] of types) {
      const ctx = { ...CTX, address, ageBand };
      let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 });
      while (r.state.phase !== "practice" || !r.move.itemId || r.move.itemId.startsWith("fade:")) r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), now: (r.state.turn + 1) * 20_000 });
      r = step(r.state, { event: "turn", kit: K, cls: { ...cls("no_evidence"), flags: { ...cls("no_evidence").flags, wantsToStop: true } }, now: (r.state.turn + 1) * 20_000 });
      r = step(r.state, { event: "turn", kit: K, cls: req(type, extra ?? {}), text: TEXT, now: (r.state.turn + 1) * 20_000 });
      const input = { character: CHARACTERS.asha, brief: { ...BRIEF, ageBand }, lessonState: r.state, move: r.move, item: r.item, next: r.next, content: r.content,
        topic: { title: "Fractions as equal shares", classLevel: 4, subject: "maths" }, language: "hinglish", lane };
      const rep = compileWithReport(input);
      assert.ok(rep.sections.find((x) => x.id === "move").tokens <= SECTION_CAPS.move, `${type} ${address} ${ageBand} ${lane}`);
    }
  });

  test("a request answered on a teaching turn (no question on the card) gets the request's note as the LAST message", async () => {
    let r = step(fresh(), { event: "start", kit: K, now: 0 });
    r = turn(r, cls("no_evidence"));
    const t = turn(r, req("uptake", { kind: "joke" }));
    assert.ok(!t.state.lastMove.itemId, "a teaching turn");
    assert.ok(t.state.lastMove.lead, "the move carries the request's note");
    const seen = scripted("Haha, Golu bhi hans padega! Ab dekho, roti ke barabar tukde kaise bante hain. Tum kya sochte ho?");
    await textReply({ instructions: "x", state: t.state, kit: K, childText: "haha", history: [], ui: t.ui, module: t.state.module });
    assert.match(seen[0], /^THIS TURN, FIRST: they joked/);
    assert.ok(!/"[^"]{20,}"/.test(requestNote("they joked: one playful line back")), "a shape, never a quoted line");
  });

  test("small talk: a question about what SHE does is answered now (owner-2 'PUBG khelte ho?'), a question about others is not small talk", () => {
    for (const t of ["PUBG khelte ho?", "Free Fire khelte ho?", "aap cricket dekhte hain?", "do you play minecraft?"]) assert.equal(readIntent(t)?.type, "small_talk", t);
    for (const t of ["bachche cricket khelte hain?", "kitne bachche cricket khelte hain?"]) assert.notEqual(readIntent(t)?.type, "small_talk", t);
  });

  test("stop check-in and boredom say back what they asked before the choices (the acknowledgement is explicit)", () => {
    assert.match(SH.stopCheck(), /say back in a few warm words, in their words, that they want to stop/);
    assert.match(SH.boredOffer(), /say back in a few words, in their words, that this part is boring/);
    process.env.TAXILA_P5_R3CONV = "off";
    assert.match(SH.stopCheck(), /acknowledge it warmly in one short line/);
  });

  test("one-call turns end on their own shape note: a content request ends on the card question, a teaching turn hands back; a break gets none", async () => {
    const r = turn(toPractice(), req("example"));
    const seen = scripted("Example: ek roti ke 4 barabar tukde, har tukda ek-chauthai. Aur ab?");
    await textReply({ instructions: "x", state: r.state, kit: K, childText: "example do", history: [], ui: r.ui, module: r.state.module });
    assert.match(seen[0], /^THIS TURN: what they asked or the move's step first/);
    assert.ok(seen[0].includes(`"${r.ui.ask.text.trim()}"`) || seen[0].includes(promptFor(itemOf(r), CTX.lang)), seen[0]);
    let t = step(fresh(), { event: "start", kit: K, now: 0 });
    t = turn(t, cls("no_evidence"));
    const seen2 = scripted("Ek roti ko 2 barabar tukdon mein kaato. Har tukda kitna hua?");
    await textReply({ instructions: "x", state: t.state, kit: K, childText: "achha", history: [], ui: t.ui, module: t.state.module });
    assert.match(seen2[0], /the lesson goes on, so no goodbye; end by handing the floor back/);
    const b = turn(toPractice(), req("break"));
    const seen3 = scripted("Theek hai Riya, chhota break lo; lesson yahin rukega.");
    await textReply({ instructions: "x", state: b.state, kit: K, childText: "brb", history: [], ui: b.ui, module: b.state.module });
    assert.ok(!/^THIS TURN/.test(seen3[0]), "a granted break keeps its own shape");
    assert.equal(turnNote({ handBack: false }), null);
    assert.ok(!/"[^"]{20,}"/.test(turnNote({})), "the hand-back note quotes nothing she could recite");
  });

  test("praise caught on a turn with no answer to judge: the rewrite goes straight on (no echo of the filler), a wrong answer keeps 'start from what they did'", async () => {
    const r = turn(toPractice(), cls("no_evidence"));
    const q = promptFor(itemOf(r), CTX.lang);
    const seen = scripted(`Badhiya Riya, bilkul sahi socha tumne. ${q}`, `Badhiya Riya, bilkul sahi socha tumne. ${q}`, `Chalo, isse dhyaan se dekho. ${q}`);
    await textReply({ instructions: "x", state: r.state, kit: K, childText: "haan theek hai", history: [], ui: r.ui, module: r.state.module, verdict: "unverified" });
    assert.ok(seen.some((m) => /no answer of theirs to judge this turn/.test(m)), seen.join(" | "));
    const w = turn(toPractice(), cls("incorrect"));
    const qw = w.ui.ask.text;
    const seen2 = scripted(`Bilkul sahi Riya, ekdam theek kaha. ${qw}`, `Bilkul sahi Riya, ekdam theek kaha. ${qw}`, `Tumne 1/3 socha. ${qw}`);
    await textReply({ instructions: "x", state: w.state, kit: K, childText: "1/3", history: [], ui: w.ui, module: w.state.module, verdict: "not_yet" });
    assert.ok(seen2.some((m) => /start from what they actually did/.test(m)), seen2.join(" | "));
  });

  test("skip in the child's own words is a skip in code (never the classifier's stop): demonstratives, 'next one' tails, polite words", () => {
    for (const t of ["ye wala skip karo", "isko chhodo dusra do", "next question please", "yeh wala chhod ke agla do", "is question ko chhodo", "dusra sawaal do", "skip it please"])
      assert.equal(readIntent(t)?.type, "skip", t);
    for (const t of ["chhodo", "dusra wala", "another one", "next time", "ek aur example do", "skip the explanation i get it", "mujhe skip nahi karna"])
      assert.notEqual(readIntent(t)?.type, "skip", t);
    process.env.TAXILA_P5_R3CONV = "off";
    assert.equal(readIntent("ye wala skip karo"), null);
  });

  test("card cap: an ask to hear THIS question again is honoured on the capped turn; their next answer turn leaves it", () => {
    const capped = (m) => /on the table long enough/.test(m.shape ?? "");
    let r = toPractice();
    while (!capped(r.state.lastMove) && (r.state.pinRun ?? 0) < 3) r = turn(r, cls("no_evidence"));
    assert.ok(!capped(r.state.lastMove), "the cap fired before the request turn");
    const asked = turn(r, req("repeat"));
    assert.ok(!capped(asked.state.lastMove), asked.state.lastMove.shape);
    assert.equal(asked.state.lastMove.request, "repeat");
    const after = turn(asked, cls("no_evidence")).state.lastMove;
    assert.ok(capped(after) || /for later/.test(after.shape ?? ""), after.shape);
    process.env.TAXILA_P5_R3CONV = "off";
    assert.ok(capped(turn(r, req("repeat")).state.lastMove), "kill switch: the cap applies as before");
  });

  test("two questions: a short tag after the question that carries the turn goes, the carrying question stays", () => {
    const t = "Riya, tumhe yeh hissa boring lag raha hai: game, picture, ya quick challenge? Kaunsa chunogi?";
    assert.equal(lastQuestionOnly(t), "Kaunsa chunogi?");
    assert.equal(lastQuestionOnly(t, { keepContent: true }), "Riya, tumhe yeh hissa boring lag raha hai: game, picture, ya quick challenge?");
    assert.equal(lastQuestionOnly("Kya tum ready ho? Batao, 3 aur 4 milkar kitne hote hain?", { keepContent: true }), "Batao, 3 aur 4 milkar kitne hote hain?");
  });

  test("a question about what SHE does needs no question mark (a spoken 'pubg khelte ho' was deferred); 'tumne galat dekha' is not small talk", () => {
    for (const t of ["pubg khelte ho", "free fire khelte ho kya", "kya tum cartoon dekhte ho", "aap cricket dekhte hain", "do you play minecraft"])
      assert.equal(readIntent(t)?.type, "small_talk", t);
    for (const t of ["tumne galat dekha", "hum log ludo khelte hain", "main roz cricket khelta hoon"]) assert.notEqual(readIntent(t)?.type, "small_talk", t);
  });

  test("a help request answered with only the card question gets a line of her own, on a first pose too (owner-2 'samajh nahi aaya' on a faded step)", async () => {
    let r = step(fresh(), { event: "start", kit: K, now: 0 });
    for (let i = 0; i < 30 && !(r.move.itemId ?? "").startsWith("fade:"); i++) r = turn(r, cls("no_evidence"));
    const a = turn(r, req("another", { confused: true }));
    const st = { ...a.state, pinRun: 1 };
    const ask = a.ui.ask.text;
    scripted(ask, ask, ask);
    const out = await textReply({ instructions: "x", state: st, kit: K, childText: "samajh nahi aaya", history: [], ui: a.ui, module: st.module, verdict: "unverified" });
    const own = out.reply.split(ask).join(" ").trim();
    assert.ok(own.split(/\s+/).length >= 4 && out.reply.trim().endsWith(ask.trim()), out.reply);
    assert.match(own, /^[A-Z]/);
    process.env.TAXILA_P5_R3CONV = "off";
    scripted(ask, ask, ask);
    const off = await textReply({ instructions: "x", state: st, kit: K, childText: "samajh nahi aaya", history: [], ui: a.ui, module: st.module, verdict: "unverified" });
    assert.equal(off.reply.trim(), ask.trim(), "kill switch: round 2 behaviour");
  });

  test("a kit hint used as her lead starts with a capital letter and ends with a stop", () => {
    assert.equal(hintStatements({ id: "z", answer: "9", hints: ["look at the step just before"] }, 1), "Look at the step just before.");
  });
});
