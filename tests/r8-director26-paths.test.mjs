// dc-r8-director26 (docs/patches/to-brain/040): the walk and the line on the director26 rows, walked live on today's scripts (the run's
// child lines replayed through the real turn path; the model never called).
import { test } from "node:test";
import assert from "node:assert/strict";
import { textReply, replyDeps, FALLBACK } from "../server/brain/say.js";
import { chat, chatStream } from "../server/azure.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { replay } from "./fixtures/replay.mjs";

const RUN = "2026-11-17-director26";
/** One child line planned on a state, as tests/fixtures/replay.mjs plans each recorded line. */
async function planAt(state, text, kit) {
  const { classifyFast, targetFor } = await import("../server/director/classify.js");
  const { findItem } = await import("../server/director/items.js");
  const { planTurn } = await import("../server/brain/turn.js");
  const { newLearnerState } = await import("../server/comprehension/fuse.js");
  const classLevel = Number(/^c(\d)/.exec(kit.topicId)[1]);
  const CHILD = { id: "00000000-0000-0000-0000-00000000aaaa", legal_mode: "M1", class_level: classLevel }, LESSON = { id: "11111111-1111-1111-1111-11111111aaaa", started_at: new Date(0).toISOString() };
  const s = { ...state, seq: (state.seq ?? 0) + 1, recent: [...(state.recent ?? []), { who: "teacher", text: "" }, { who: "child", text }] };
  const item = s.activeItemId ? findItem(s, kit, s.activeItemId) : null;
  const fast = classifyFast({ target: targetFor(s, kit, item), childText: text, lang: "hinglish", classLevel, typed: true });
  const c = fast.result ?? { outcome: "no_evidence", confidence: 0.9, source: "test", flags: { ...fast.flags } };
  return planTurn(s, c, { kit, child: CHILD, lesson: LESSON, activeItem: item, moduleOnly: false, moduleEvents: [], answer: text, childText: text, leaked: false,
    live: Promise.resolve({ state: newLearnerState({ childId: CHILD.id, classLevel }), maxSeq: 0 }), carried: [], now: 9_000_000 });
}
const noModel = async () => { throw new Error("the model was called"); };
async function lineAt(persona, T, row1, { model = noModel } = {}) {
  const { kit, plans } = await replay(RUN, persona, T, row1);
  const p = plans.at(-1);
  const st = { ...p.state, recent: [...(p.state.recent ?? [])] };
  replyDeps.chat = model; replyDeps.chatStream = model;
  try {
    return { p, st, out: await textReply({ instructions: instructionsFor(st, kit), state: st, kit, childText: p.child, history: [], ui: p.p.r.ui, module: null }) };
  } finally { replyDeps.chat = chat; replyDeps.chatStream = chatStream; }
}

test("B2: 'bas aaj ke liye itna hi' (c4 stuck 68) gets the authored stop line, with no model call", async () => {
  // (the model, if asked, writes director26's menu: it must not be asked, and its words must not be said)
  let called = 0;
  const menu = async () => { called++; return { text: "Riya, theek hai—tum rukna chahti ho. Buttons mein chuno: aage badhein, thodi der pause lein, ya aaj ke liye padhai rok dein?" }; };
  const { st, out } = await lineAt("stuck", "c4-maths-ch05-t01", 69, { model: menu });
  assert.equal(called, 0, "no model call on the stop turn");
  assert.equal(st.lastMove?.checkin, "stop", "the walk's stop check-in");
  assert.equal(out.reply, FALLBACK.hinglish.checkinStop);
  assert.doesNotMatch(out.reply, /button/i);
});

test("N1: a clarify at the opening's check-in (c5-t02 steering 4) is one authored word, the first point and its check-in — no model call", async () => {
  let called = 0;
  const draft = async () => { called++; return { text: "Koi baat nahi. Yeh patti ek poora hai: 4 barabar hisse, aur ek mein rang bhara hai. Woh ek hissa 1/4 hai. 1/4 ka 4 batata hai ki patti ke 4 barabar hisse hain. Neeche wali patti bhi utni hi lambi hai. Kya tum bata sakti ho?" }; };
  const { st, out } = await lineAt("steering", "c5-maths-ch02-t02", 5, { model: draft });
  assert.equal(called, 0, "no model call");
  assert.equal(st.lastMove.hookHelp, "clarify");
  const parts = (out.guard.parts?.list ?? []).map((p) => p.part);
  assert.deepEqual(parts.slice(0, 2), ["aside", "body"], "a word to her, then the point");
  assert.ok(out.reply.includes(String(st.lastMove.point).trim()), "the point whole");
  assert.match(out.reply, /\?\s*$/, "ends on a question");
});

test("N1: a give-up at the hook's check-in (c6 steady 4) opens on a word to her, then the point and its card", async () => {
  const { out } = await lineAt("steady", "c6-maths-ch06-t01", 5);
  assert.equal(out.guard.parts.list[0].part, "aside");
  assert.equal(out.guard.parts.list.at(-1).part, "card");
});

test("N1: 'pata nahi, aap batao' at the check-in on the last card's why (c5-t01 steady 128) gets the why's other wording or the go-on line", async () => {
  // (the walk is found where the run's row 126 left it — the last card's close and why, its check-in, the phase already the teach-back's —
  // wherever today's walk reaches it; the child's line there is the run's)
  // (today's walk says that close with the teach-back's lead in one turn — the close's words are counted as said, C1 — so the run's state is
  // built: the last card c3 closed with its why, its check-in, no card live, the phase the teach-back's, as row 126 of the run left it)
  const { kit, plans } = await replay(RUN, "steady", "c5-maths-ch02-t01", 126);
  const S = "c5-maths-ch02-t01-s3";
  const before = plans.at(-1).state;
  const cb = { scriptId: "c5-maths-ch02-t01@2.3", skillId: S, beatId: "c3", kind: "check" };
  const st = { ...before, phase: "teachback", keyedPart: `${S}:check:c3`, activeItemId: undefined, lastUi: { status: "your_turn" },
    lastMove: { kind: "repair", splitClose: true, gaveCheck: true, closeBeat: cb, scriptBeat: cb } };
  const m = (await planAt(st, "pata nahi, aap batao", kit)).r.state.lastMove;
  assert.ok(m.help?.keyed, "help on the card just keyed");
  assert.ok(m.help.rung === "whyAlt" || m.help.joint === "afterKeyGoOn", JSON.stringify(m.help));
  assert.notEqual(m.kind, "teachback", "not straight to the closing question");
});

test("N1: 'mujhe nahi pata' on a point whose wordings are spent (c5-t02 stuck 28) gets a word before the card", async () => {
  const { plans } = await replay(RUN, "stuck", "c5-maths-ch02-t02", 29);
  const m = plans.at(-1).p.r.state.lastMove;
  assert.equal(m.help?.card, "ask");
  assert.equal(m.help?.joint, "helpToCard");
  assert.ok(String(m.simpler ?? "").trim().length > 0, "the word is said");
});

test("J1: the go-on line is not said where the back-to joint follows (the seam pass drops it)", async () => {
  const { seamPass } = await import("../server/brain/seams.js");
  const { kitFromFile } = await import("../server/content/kits.js");
  const { getTopic } = await import("../server/content/curriculum.js");
  const kit = kitFromFile(getTopic("c6-maths-ch06-t01"));
  const go = "Koi baat nahi, parimap ke aise sawaal aage phir aayenge; abhi aage badhte hain.";
  const list = [{ part: "close", text: go }, { part: "body", text: "Kinaare par ek baar dhaaga lapetna hai." }, { part: "card", text: "Kitna dhaaga lagega?" }];
  const r = seamPass(list, { kit, state: { ctx: { lang: "hinglish" } }, lang: "hinglish", info: { returnCard: true, helpJoint: { kind: "afterKeyGoOn", form: go, by: "authored" } } });
  const text = r.list.map((p) => p.text).join(" ");
  assert.ok(!text.includes("abhi aage badhte hain"), text);
  assert.ok(!r.seams.some((x) => x.joint === "afterKeyGoOn") || !r.seams.some((x) => x.joint === "backTo"), JSON.stringify(r.seams));
});

test("J1: a worked step whose ladder is empty (c6 stuck 44) goes on to the next step with no go-on promise", async () => {
  const { plans } = await replay(RUN, "stuck", "c6-maths-ch06-t01", 45);
  const m = plans.at(-1).p.r.state.lastMove;
  assert.equal(m.help?.card, "goOn");
  assert.ok(!m.help?.joint, "no joint: the next step opens on its own frame");
  assert.ok(!(m.sayFirst ?? []).some((x) => /phir aay|dobara/i.test(x)), "no promise");
});

test("J1: a right verdict into the worked problem (c6 steady 16) takes beforeWorked (code's form while the script has none)", async () => {
  const { out } = await lineAt("steady", "c6-maths-ch06-t01", 17, { model: async () => ({ text: "Sahi jawab." }) });
  const s = (out.guard.seams ?? []).find((x) => x.joint === "beforeWorked");
  assert.ok(s, JSON.stringify(out.guard.seams));
  assert.ok(out.reply.indexOf(s.form) < out.reply.indexOf("Phoolon"), out.reply);
});

test("R1: c5-t02 steady 118 — the mix-up remediated in the first skill, met again in the third, gets the third skill's remediation", async () => {
  const { plans } = await replay(RUN, "steady", "c5-maths-ch02-t02", 119);
  const m = plans.at(-1).p.r.state.lastMove;
  assert.equal(m.scriptBeat?.kind, "remediation", JSON.stringify(m.scriptBeat));
  assert.equal(m.scriptBeat.skillId, "c5-maths-ch02-t02-s3");
  // (and the said-once record names the remediation, its skill and its mix-up)
  assert.ok((plans.at(-1).p.r.state.remedied ?? []).includes("c5-maths-ch02-t02-s3|c5-maths-ch02-t02-m-tops-only"));
});

test("A4: an aside said again is replied to in the child's own words; the reply is never cut to a bare 'Achha.'", async () => {
  const { againInHerWords } = await import("../server/brain/say.js");
  const { asideReplyLine } = await import("../server/brain/asideReplies.js");
  assert.equal(againInHerWords("kal maine cricket khela, sixer maara", "cricket", "hinglish", { recent: [] }), "Achha, pichhli baar sixer maara.");
  // (her return in the script's own form — "usmein sabse mazedaar kya hai?" — is a liking question: the phrase form answers it)
  assert.equal(asideReplyLine({ said: "chauka", topic: "cricket", asked: "Ab cricket ki baat karte hain: usmein sabse mazedaar kya hai?", words: ["chauka"] }).line, "Achha, toh tumhe chauka sabse achha lagta hai.");
  assert.equal(asideReplyLine({ said: "batting sabse achhi lagti hai", topic: "cricket", asked: "Cricket ki baari aa gayi: uske baare mein thoda aur batao na?", words: ["batting"] }).line,
    "Achha, toh tumhe batting sabse achha lagta hai.");
});

test("Record: a picture asked for after the walk's key on a then-card (c5-t01 steering 14) is drawn on the answered board", async () => {
  const { plans } = await replay(RUN, "steering", "c5-maths-ch02-t01", 15);
  const m = plans.at(-1).p.r.state.lastMove;
  const prev = plans.at(-2).p.r.state.lastMove;
  assert.ok(prev.gave?.answer, "the key was said on the turn before");
  assert.deepEqual(m.scriptBeat?.board, prev.closeBeat?.board, "the picture is on the board the key was said over");
});

test("W1: the closing question answered right — the wrap opens on the verdict and its why; a line after the closing key gets the acknowledgement", async () => {
  const { kit, plans } = await replay(RUN, "steady", "c4-maths-ch05-t01", 400);
  const asked = plans.find((x) => x.state.lastMove?.kind === "teachback" && x.state.lastMove?.authoredEnd !== "teachbackKey");
  assert.ok(asked, "the walk reaches the closing question");
  const tb = kit && (await import("../server/director/script.js")).scriptFor(kit).script.teachback;
  const right = await planAt(asked.state, tb.key, kit);
  const st = { ...right.r.state, recent: [...(right.r.state.recent ?? [])] };
  // (the verdict and its why lead the wrap, or — when with what was covered they run over 75 words — are a turn of their own before it)
  assert.ok(["wrap", "teachback"].includes(st.lastMove.kind), st.lastMove.kind);
  assert.ok(st.lastMove.endWhy, "the why rides on the verdict");
  replyDeps.chat = noModel; replyDeps.chatStream = noModel;
  try {
    const out = await textReply({ instructions: instructionsFor(st, kit), state: st, kit, childText: tb.key, history: [], ui: right.r.ui, module: null });
    assert.match(out.reply.split(/(?<=[.!?])\s+/)[0], /kyunki/, out.reply);
  } finally { replyDeps.chat = chat; replyDeps.chatStream = chatStream; }
  // (a miss: the key turn, then "mujhe laga aisa hi hoga" — the wrap's first turn opens on a wrap.ack form)
  const miss = await planAt(asked.state, "5/9", kit);
  const after = await planAt(miss.r.state, "mujhe laga aisa hi hoga", kit);
  const w = after.r.state.lastMove;
  assert.equal(w.kind, "wrap");
  const acks = tb && (await import("../server/director/script.js")).scriptFor(kit).script.wrap.ack.map((f) => f.hi);
  assert.ok(w.wrapAck && acks.some((a) => String(w.rendered?.[0] ?? "").startsWith(String(a).slice(0, 12))), JSON.stringify(w.rendered));
});
