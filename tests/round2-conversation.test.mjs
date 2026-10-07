// Round 2 (conversation stream): the lead slot (conversation/compose.js + brain/say.js), the "unclear" reading for a
// broken-off turn, how-they-asked-to-be-taught kept on every move, and the pinned-Hindi rule. The reply model is replaced
// (replyDeps), no network. Needs docs/design/round2/conversation/patches (APPLY.md).
import { describe, test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { leadSlotWanted, leadSlotNote, cleanLead, leadOk, composeTurn, leadDropsQuestion, leadNamesKey, CONTENT_REQUESTS } from "../server/conversation/compose.js";
import { fallbackLead, FALLBACK_LEADS } from "../server/conversation/fallback-lead.js";
import { readIntent, fragmentLike } from "../server/conversation/lexicon.js";
import { requestFromNote } from "../server/conversation/policy.js";
import { textReply, replyDeps, fallbackReply } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { initLessonState, step } from "../server/director/state.js";
import { promptFor } from "../server/director/items.js";
import { compile } from "../server/compiler/compile.js";
import { CHARACTERS } from "../server/compiler/characters/index.js";
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

describe("round2 conversation", () => {
  afterEach(() => { replyDeps.chat = chat; delete process.env.TAXILA_P5_LEADSLOT; delete process.env.TAXILA_P5; });
  const scripted = (...texts) => { const seen = []; let i = 0; replyDeps.chat = async (_d, msgs) => { seen.push(msgs.at(-1).content); return { text: texts[Math.min(i++, texts.length - 1)] }; }; return seen; };

  test("compose: a lead loses its questions and any copy of the card question; the turn ends on the question byte for byte", () => {
    const ask = "A pizza has 3 equal slices. What is one slice?";
    const lead = cleanLead("Main ek AI teacher hoon, insaan nahi. Kya tum ready ho? A pizza has 3 equal slices. What is one slice?", ask);
    assert.equal(lead, "Main ek AI teacher hoon, insaan nahi.");
    assert.ok(leadOk(lead));
    assert.equal(composeTurn(lead, ask), `Main ek AI teacher hoon, insaan nahi. ${ask}`);
    assert.equal(composeTurn("Achha, phir se dekhte hain", ask), `Achha, phir se dekhte hain. ${ask}`);
    assert.ok(!leadOk(cleanLead("What is one slice?", ask)), "a question alone is no lead");
    assert.ok(!leadOk("Riya,"), "a name is no lead");
  });

  test("compose: which turns take the lead slot (a request or a re-pose, with a pinned question; never a diagnostic, a why, a close)", () => {
    assert.ok(leadSlotWanted({ request: "identity", pinned: "q" }));
    assert.ok(leadSlotWanted({ rePose: true, pinned: "q" }));
    assert.ok(!leadSlotWanted({ request: "identity", pinned: null }));
    assert.ok(!leadSlotWanted({ request: "identity", pinned: "q", diagnostic: true }));
    assert.ok(!leadSlotWanted({ rePose: true, pinned: "q", whyProbe: true }));
    assert.ok(!leadSlotWanted({ pinned: "q" }), "a first pose with no request keeps the one-call path");
    const note = leadSlotNote({ ageBand: "6-9" });
    assert.match(note, /PART ONE ONLY/);
    assert.match(note, /No question of any kind/);
    assert.ok(!/"[^"]{20,}"/.test(note), "a shape, never a quoted line she could recite");
  });

  test("lead slot: an identity question with a question on the card → her words, then the card question; the model's own question is cut", async () => {
    const r = turn(toPractice(), req("identity"));
    assert.equal(r.state.lastMove.request, "identity");
    const q = r.ui.ask.text;
    const seen = scripted("Main ek AI teacher hoon, koi insaan nahi. Chalo, wapas sawaal par? ");
    const out = await textReply({ instructions: "x", state: r.state, kit: K, childText: "tum robot ho?", history: [], ui: r.ui, module: r.state.module });
    assert.ok(out.guard.leadSlot, JSON.stringify(out.guard));
    assert.match(seen[0], /PART ONE ONLY/, "the lead-slot note is the last message");
    assert.ok(out.reply.startsWith("Main ek AI teacher hoon, koi insaan nahi."), out.reply);
    assert.ok(out.reply.trim().endsWith(q.trim()) || out.reply.trim().endsWith(promptFor(K.items.find((i) => i.id === r.state.lastMove.itemId), CTX.lang).trim()), out.reply);
    assert.ok(!/wapas sawaal par\?/.test(out.reply), "her own question is cut: the card question is the turn's only one");
  });

  test("lead slot: a lead that comes back as only the question falls through to the one-call path (never a bare turn by design)", async () => {
    const r = turn(toPractice(), req("identity"));
    const item = K.items.find((i) => i.id === r.state.lastMove.itemId);
    const q = promptFor(item, CTX.lang);
    const seen = scripted(q, `Main AI teacher hoon. ${q}`);
    const out = await textReply({ instructions: "x", state: r.state, kit: K, childText: "tum robot ho?", history: [], ui: r.ui, module: r.state.module });
    assert.equal(seen.length >= 2, true);
    assert.ok(!out.guard.leadSlot);
    assert.match(out.reply, /AI teacher/);
  });

  test("lead slot repair: a re-pose still bare after the rewrite gets one lead-only call, kept only when it is clean", async () => {
    process.env.TAXILA_P5_LEADSLOT = "off";           // the one-call path first ...
    const r = turn(turn(toPractice(), cls("incorrect")), cls("incorrect"));
    const q = r.ui.ask.text;
    const seen = scripted(q, q, q);
    let out = await textReply({ instructions: "x", state: r.state, kit: K, childText: "1/3", history: [], ui: r.ui, module: r.state.module, verdict: "not_yet" });
    const off = out;
    delete process.env.TAXILA_P5_LEADSLOT;               // ... then with the slot on, the lead-only repair speaks
    const seen2 = scripted(q, q, q, "Tukde barabar hain, toh har tukda kitna bada hoga, ye socho.");
    out = await textReply({ instructions: "x", state: r.state, kit: K, childText: "1/3", history: [], ui: r.ui, module: r.state.module, verdict: "not_yet" });
    assert.ok(seen.length >= 2 && seen2.length >= 2);
    assert.ok(out.reply.length > q.length, out.reply);
    assert.ok(out.reply.trim().endsWith(q.trim()), out.reply);
    assert.ok(off.reply.length >= q.length);
  });

  test("lead slot: a lead that states the key is caught by the same leak guard as any turn (the slot never loosens a truth check)", async () => {
    const r = turn(toPractice(), req("identity"));
    const item = K.items.find((i) => i.id === r.state.lastMove.itemId);
    scripted(`Main AI hoon. Answer ${item.answer} hai.`, `Main AI teacher hoon. ${promptFor(item, CTX.lang)}`);
    const out = await textReply({ instructions: "x", state: r.state, kit: K, childText: "tum robot ho?", history: [], ui: r.ui, module: r.state.module });
    // refused in the slot (it names the key), or caught by the leak guard: either way it is never shipped
    assert.ok(out.guard.caught.includes("leak") || !out.guard.leadSlot, JSON.stringify(out.guard));
    assert.ok(!out.reply.includes(`Answer ${item.answer} hai`), out.reply);
  });

  test("kill switch: TAXILA_P5_LEADSLOT=off is the one-call path (no lead-slot note is ever sent)", async () => {
    process.env.TAXILA_P5_LEADSLOT = "off";
    const r = turn(toPractice(), req("identity"));
    const item = K.items.find((i) => i.id === r.state.lastMove.itemId);
    const seen = scripted(`Main AI teacher hoon. ${promptFor(item, CTX.lang)}`);
    const out = await textReply({ instructions: "x", state: r.state, kit: K, childText: "tum robot ho?", history: [], ui: r.ui, module: r.state.module });
    assert.ok(!seen.some((m) => /PART ONE ONLY/.test(m)));
    assert.ok(!out.guard.leadSlot);
  });

  test("unclear: a broken-off line is a no-blame repair request (code reading and the note), never a verdict; reduplication and article drills are not", () => {
    for (const t of ["umm wo jo bada wala ki", "the the bigger piece is the", "uh i mean it goes to the"]) assert.equal(readIntent(t)?.type, "unclear", t);
    for (const t of ["dheere dheere chalo", "a the the", "an, a, a", "hmm", "ruko soch raha hoon", "1/3 hai", "it is the bigger one"]) assert.notEqual(readIntent(t)?.type, "unclear", t);
    assert.ok(!fragmentLike("what is the the?"), "a question is never a fragment");
    assert.equal(requestFromNote({ intent: "noise", also: [] }).type, "unclear");
    const r = turn(toPractice(), req("unclear"));
    assert.equal(r.state.lastMove.request, "unclear");
    assert.match(r.state.lastMove.shape, /say it again or finish/);
    assert.match(r.state.lastMove.shape, /no verdict/);
    // integration (w1a-battery): typed input never gets "say it again" (audit G4): no repair, no unclear move
    const p = toPractice();
    const t2 = step(p.state, { event: "turn", kit: K, cls: req("unclear"), typed: true, now: (p.state.turn + 1) * 20_000 });
    assert.notEqual(t2.state.lastMove.kind, "repair");
    assert.notEqual(t2.state.lastMove.request, "unclear");
    assert.match(t2.state.lastMove.shape ?? "", /typed reply/);
  });

  test("insistence with nothing parked is a short real engagement now, never a second 'later'", () => {
    const r = turn(toPractice(), req("detour", { topic: "cricket" }));
    assert.equal(r.state.lastMove.request, "detour");
    assert.match(r.state.lastMove.shape, /engage for real/);
    assert.ok(!/promise to come back/.test(r.state.lastMove.shape));
    assert.equal((r.state.later ?? []).length, 0, "nothing new parked");
  });

  test("how they asked to be taught rides on every later move and is rendered (droppable) in the MOVE section", () => {
    let r = turn(toPractice(), req("adopt", { method: "step by step with a picture" }));
    assert.deepEqual(r.state.prefs, ["step by step with a picture"]);
    r = turn(r, cls("incorrect"));
    assert.deepEqual(r.state.lastMove.prefs, ["step by step with a picture"], "the next move still carries it");
    process.env.TAXILA_P5 = "off";
    const r2 = turn(toPractice(), cls("incorrect"));
    assert.equal(r2.state.lastMove.prefs, undefined, "TAXILA_P5=off: the HEAD move");
  });

  test("pinned Hindi: everyday words in Hindi, English only for a maths or science term; the prefs line is in the MOVE section", () => {
    let r = turn(toPractice(), req("adopt", { method: "step by step" }));
    r = turn(r, cls("incorrect"));
    const s = { ...r.state, ctx: { ...r.state.ctx, lang: "hindi", langPinned: true } };
    const input = { character: CHARACTERS.asha, brief: BRIEF, lessonState: s, move: r.move, item: r.item, next: r.next, content: r.content,
      topic: { title: "Fractions as equal shares", classLevel: 4, subject: "maths" }, language: "hindi" };
    const text = compile(input);
    assert.match(text, /Everyday words in Hindi/);
    assert.match(text, /how they asked you to teach \(keep doing it\): step by step/);
    const plain = compile({ ...input, lessonState: { ...s, ctx: { ...s.ctx, langPinned: false } } });
    assert.ok(!/Everyday words in Hindi/.test(plain), "only when they ASKED for Hindi");
  });
  test("fallback lead (no model): a request or a re-pose gets a fixed code lead before the card question; a first pose stays the question alone", () => {
    assert.equal(fallbackLead({ request: "identity" }), FALLBACK_LEADS.hinglish.identity);
    assert.match(fallbackLead({ request: "identity", lang: "english" }), /\bAI\b/);
    assert.equal(fallbackLead({ request: "confused", hint: "Pehle dekho kitne barabar tukde hain." }), "Pehle dekho kitne barabar tukde hain.");
    assert.equal(fallbackLead({ request: "confused", hint: "" }), FALLBACK_LEADS.hinglish.help);
    assert.equal(fallbackLead({ request: "stop" }), "", "a stop is never fallback-led (the closing lines own it)");
    assert.equal(fallbackLead({}), "", "a first pose with no request: the question alone, as before");
    assert.equal(fallbackLead({ rePose: true }), FALLBACK_LEADS.hinglish.help);
    for (const L of Object.values(FALLBACK_LEADS)) for (const [k, x] of Object.entries(L)) {
      assert.ok(!/[?？]/.test(x), `${k}: a lead never asks (the card question is the turn's only question)`);
      assert.ok(leadOk(x), `${k}: a lead is a response of its own (>= 4 words)`);
      assert.ok(!/1098|14416/.test(x), `${k}: no helpline on a non-safety line`);
    }
  });

  test("fallback lead: the reply model down on an identity request → 'AI teacher' then the card question (never a bare re-ask; the floor holds with every model down)", async () => {
    const r = turn(toPractice(), req("identity"));
    replyDeps.chat = async () => { throw new Error("429 Too Many Requests"); };
    const out = await textReply({ instructions: "x", state: r.state, kit: K, childText: "tum robot ho?", history: [], ui: r.ui, module: r.state.module });
    const item = K.items.find((i) => i.id === r.state.lastMove.itemId);
    const q = promptFor(item, CTX.lang);
    assert.ok(out.guard.caught.includes("unavailable"));
    assert.ok(out.reply.startsWith("Main ek AI teacher hoon"), out.reply);
    assert.ok(out.reply.trim().endsWith(q.trim()), out.reply);
    // aap child: the fixed line in aap forms; kill switch: the question alone (HEAD)
    const aap = fallbackReply({ ...r.state, ctx: { ...r.state.ctx, address: "aap" } }, item);
    assert.ok(aap.trim().endsWith(q.trim()));
    process.env.TAXILA_P5_LEADSLOT = "off";
    assert.equal(fallbackReply(r.state, item), q);
  });
  test("compose: a lead that drops, pauses or defers the question is refused (the card question follows it), so the one-call path writes the turn", () => {
    for (const t of ["Theek hai, Meher. Isse abhi chhod dete hain, koi pressure nahi.", "Meher, let’s stop here. You found 4.", "Okay, we can skip this one and do it later."]) {
      assert.ok(leadDropsQuestion(t), t);
      assert.ok(!leadOk(t), t);
    }
    for (const t of ["Koi baat nahi, pehle A ko B se jodiye.", "Main ek AI teacher hoon, koi insaan nahi.", "Chalo, ek chhota step lete hain: pehle tukde gino."]) assert.ok(leadOk(t), t);
  });
  test("compose: a lead that names the card question's key is refused, even a key the question itself names (odd / even)", () => {
    assert.ok(leadNamesKey("36 even hai, kyunki 2-2 ke sabhi jode poore ban jaate hain.", ["even"]));
    assert.ok(!leadOk("36 even hai, kyunki 2-2 ke sabhi jode poore ban jaate hain.", ["even"]));
    assert.ok(leadOk("Iske sabhi numbers do-do ke pairs mein baant jaate hain.", ["even"]));
    assert.ok(leadOk("Pehle 4 rounds ke points jodo, phir penalty ghatao.", ["240"]), "a number in the lead that is not the key is fine");
    assert.ok(!leadOk("Socho, 1/3 wala tukda sabse chhota hai.", ["1/3"]));
  });

  test("lead slot: a lead stating a key the question names falls through to the one-call path (never shipped)", async () => {
    const r = turn(toPractice(), req("identity"));
    const item = K.items.find((i) => i.id === r.state.lastMove.itemId);
    const q = promptFor(item, CTX.lang);
    const seen = scripted(`Main AI teacher hoon, aur answer ${item.answer} hai.`, `Main AI teacher hoon, koi insaan nahi. ${q}`);
    const out = await textReply({ instructions: "x", state: r.state, kit: K, childText: "tum robot ho?", history: [], ui: r.ui, module: r.state.module });
    assert.ok(!out.guard.leadSlot, JSON.stringify(out.guard));
    assert.ok(seen.length >= 2);
    assert.ok(!out.reply.includes(`answer ${item.answer} hai`), out.reply);
  });
  test("compose: content requests (answer their question, clarify, example, story, another way, why, how) keep the one-call path; the note never says 'fully' or 'what they asked for'", () => {
    for (const r of CONTENT_REQUESTS) assert.ok(!leadSlotWanted({ request: r, pinned: "q" }), r);
    for (const r of ["identity", "adult", "decline", "uptake", "unclear", "frustration", "boredom", "detour"]) assert.ok(leadSlotWanted({ request: r, pinned: "q" }), r);
    const note = leadSlotNote({});
    assert.ok(!/fully|what they asked for/.test(note), note);
    assert.match(note, /never its answer/);
  });
});
