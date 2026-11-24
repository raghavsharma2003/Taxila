// dc-r8-director26 (docs/patches/to-brain/040): the walk and the line on the director26 rows, walked live on today's scripts (the run's
// child lines replayed through the real turn path; the model never called).
import { test } from "node:test";
import assert from "node:assert/strict";
import { textReply, replyDeps, FALLBACK } from "../server/brain/say.js";
import { chat, chatStream } from "../server/azure.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { replay } from "./fixtures/replay.mjs";

const RUN = "2026-11-17-director26";
// (dc-r8-director27 Brain 042: these tests replay director26's child lines, row by row, through today's walk. Today's scripts carry Learning
// 016's quick questions and asked steps, which change the turn shapes the rows were written against; the walk on a script without those two
// fields is the walk these rows test — each replay that depends on the old turn shapes runs on today's script with the two fields taken off)
import { readFileSync } from "node:fs";
import { setScriptForTest } from "../server/director/script.js";
function without042(T) {
  // (d29 final: the pilots as director28 ran them — Learning 017's cuts and reshaped worked examples move these replays off director26's rows)
  const s = JSON.parse(readFileSync(new URL(`./fixtures/eval-results/hybrid-side-by-side/results/2026-11-17-director28/scripts/${T}.json`, import.meta.url), "utf8"));
  delete s.recordedRun;
  for (const k of s.skills ?? []) { for (const e of k.explain ?? []) delete e.quick; for (const st of k.workedExample?.steps ?? []) delete st.ask; }
  return s;
}
/** Run fn with T's script without 042's fields. */
async function on041(T, fn) { setScriptForTest(T, without042(T)); try { return await fn(); } finally { setScriptForTest(); } }
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

// (dc-r8-director27 P6.1: after a request at the greeting the hook is said with the first point, as on the ordinary path — c5-t02 steering's
// "samajh nahi aaya" at the greeting gets greetSimpler, the hook and e1 at row 2, so there is no opening check-in left; the clarify at row 4
// is at e1's check-in, and gets e1's help)
// (dc-r8-director28 Brain 044 T1 changes both: after a request at the greeting, the greeting's simpler wording is its own turn and ends on the
// greeting's question; the next turn is the hook, the first point and its card — a second request there gets the "nothing easier" line first.
// The hook never ends a turn, so no request meets the hook's check-in)
test("N1/P6.1 (Brain 044 T1): a request at the greeting gets the greeting's simpler wording alone; the next turn is the hook with the first point (c5-t02 steering 2, 4)", async () => on041("c5-maths-ch02-t02", async () => {
  const { plans } = await replay(RUN, "steering", "c5-maths-ch02-t02", 3);
  const at2 = plans.at(-1).state.lastMove;
  assert.ok(at2.greetHelp, "the greeting's simpler wording on its own turn");
  assert.equal((at2.sayFirst ?? []).length, 1);
  const { plans: p4 } = await replay(RUN, "steering", "c5-maths-ch02-t02", 5);
  const at4 = p4.at(-1).state.lastMove;
  assert.equal(at4.scriptBeat?.beatId, "e1");
  assert.ok(at4.hookSaid, "the hook is said with the first point");
  // (dc-r8-director29 Brain 045 P4: the line that starts the lesson — "nothing easier" is never said before something has been taught)
  assert.equal(at4.help?.joint, "startAnyway", "a second request: the start line first");
}));

test("N1 (Brain 044 T1): a give-up after the greeting's simpler wording (c4 offtopic 4) opens on a word to her, then the hook and the point", async () => {
  // (the ordinary hook turn now, no longer the code-only hook-help path: the model's draft is stubbed empty)
  const { out, p } = await lineAt("offtopic", "c4-maths-ch05-t01", 5, { model: async () => ({ text: "" }) });
  assert.ok(p.before.lastMove?.greetHelp, "the turn before was the greeting's simpler wording");
  assert.ok(out.reply.startsWith(String(p.state.lastMove.help?.joint === "helpSpent" ? p.state.lastMove.sayFirst[0] : "").trim()), out.reply);
  assert.ok(out.reply.includes(String(p.state.lastMove.point).trim()), "the point whole");
  assert.match(out.reply, /\?\s*$/, "ends on a question");
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
  // (re-pinned for main's ruling of 2026-11-23 on to-brain 049 B3: c3 is marked whyAltAsHelp, and its whyAlt is help — after the key too —
  // only when the child's last answer at c3 was its named wrong answer; otherwise the order before B3, the card's simpler first)
  const last = st.answerAt?.[`${S}:check:c3`] ?? null;
  const named = !!last && (last.outcome === "misconception" || !!last.wrongListed);
  assert.ok(m.help.rung === (named ? "whyAlt" : "simpler") || m.help.joint === "afterKeyGoOn", JSON.stringify(m.help));
  assert.notEqual(m.kind, "teachback", "not straight to the closing question");
});

test("N1: 'mujhe nahi pata' on a point whose wordings are spent (c5-t02 stuck 28) gets a word before the card", async () => on041("c5-maths-ch02-t02", async () => {
  const { plans } = await replay(RUN, "stuck", "c5-maths-ch02-t02", 29);
  const m = plans.at(-1).p.r.state.lastMove;
  // (d29 final: with the point and its card now in one turn where they fit 75 — Brain 044 T1 — the replay can reach row 28 with the card
  // already posed; a give-up on a live card with nothing unsaid is its key (help's close). On the point with its card waiting, as director26
  // ran: the "nothing easier" line, then helpToCard leads the card)
  // (to-brain 049 B6: the right verdict at row 22 is now split from the point it led into, and the replay reaches row 28 on a card with a
  // wording still unsaid — help says it, keeping the card; with none unsaid, the key)
  if (plans.at(-1).before?.lastUi?.ask?.itemId) { assert.ok(["close", "keep"].includes(m.help?.card), m.help?.card); return; }
  assert.equal(m.help?.card, "ask");
  // (Brain 044 T5: the "nothing easier" line is the help, then helpToCard leads the card)
  assert.equal(m.help?.joint, "helpSpent");
  assert.equal(m.help?.then, "helpToCard");
  assert.ok(String(m.simpler ?? "").trim().length > 0, "the word is said");
}));

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

// (dc-r8-director26 C1, main's ruling change 4: c6 stuck's last told step and the child's own step are one turn now, so its clarifies at
// row 36 are on that card, not on step 1; c5-t01 stuck 44, the work order's other row for this, still reaches step 1's empty ladder)
// (dc-r8-director27 P3, c5-t01 stuck 44 in director27: the next step with nothing to the child — with nothing left for the part, the turn says
// the helpSpent line, then goes on; still never the go-on line's promise, which is a key's)
// (Brain 044 T6: her park line no longer counts in the turn's 75, so director26's row 44 now reaches the child's own step with the park — the
// rule is pinned on the picker: a worked step whose ladder is empty says helpSpent and goes on, with no go-on promise)
test("J1/P3: a worked step whose ladder is empty says helpSpent and goes on to the next step, with no go-on promise", async () => {
  const { pickHelp, helpPart, ladderOf, addSaid } = await import("../server/director/help.js");
  const { saidIn } = await import("../server/director/script.js");
  const script = without042("c5-maths-ch02-t01");
  const id = "c5-maths-ch02-t01-s1:worked:step1";
  let said = [];
  for (const r of ladderOf(script, helpPart(script, id))) said = addSaid(said, saidIn(r.value, "hinglish"), 1);
  const d = pickHelp({ script, part: id, request: "clarify", said });
  assert.equal(d.card, "goOn");
  assert.equal(d.joint?.kind, "helpSpent", "the helpSpent line answers her");
  assert.ok(!d.then, "no go-on promise");
  assert.ok(!/phir aay|dobara/i.test(d.joint.text), "no promise");
});

test("J1: a right verdict into the worked problem (c6 steady 16) takes beforeWorked (code's form while the script has none)", async () => on041("c6-maths-ch06-t01", async () => {
  const { out } = await lineAt("steady", "c6-maths-ch06-t01", 17, { model: async () => ({ text: "Sahi jawab." }) });
  const s = (out.guard.seams ?? []).find((x) => x.joint === "beforeWorked");
  assert.ok(s, JSON.stringify(out.guard.seams));
  assert.ok(out.reply.indexOf(s.form) < out.reply.indexOf("Phoolon"), out.reply);
}));

test("R1: c5-t02 steady 118 — the mix-up remediated in the first skill, met again in the third, gets the third skill's remediation", async () => on041("c5-maths-ch02-t02", async () => {
  // (048 repin: the script card's reader now hears a hedged "mujhe lagta hai haan" as the card's named wrong answer "yes"; row 62's child said
  // it to her recorded check-in "Yeh hissa saaf hua?" while the replayed walk had s2 e2 open, which moved this path off its rows. The replay
  // now passes her recorded line as `heard`, as the turn path does, so an answer to her other question is not graded against the card)
  const { plans } = await replay(RUN, "steady", "c5-maths-ch02-t02", 119, { heard: true });
  const m = plans.at(-1).p.r.state.lastMove;
  assert.equal(m.scriptBeat?.kind, "remediation", JSON.stringify(m.scriptBeat));
  assert.equal(m.scriptBeat.skillId, "c5-maths-ch02-t02-s3");
  // (and the said-once record names the remediation, its skill and its mix-up)
  assert.ok((plans.at(-1).p.r.state.remedied ?? []).includes("c5-maths-ch02-t02-s3|c5-maths-ch02-t02-m-tops-only"));
}));

test("A4: an aside said again is replied to in the child's own words; the reply is never cut to a bare 'Achha.'", async () => {
  const { againInHerWords } = await import("../server/brain/say.js");
  const { asideReplyLine } = await import("../server/brain/asideReplies.js");
  // (dc-r8-director27 P6.3, Learning 016: an aside said again gets the said-again form with the child's own words — c4 offtopic 20 and 32 said
  // "Achha, pichhli baar sixer maara." twice, word for word)
  // (re-pinned to to-brain 049 and main's ruling of 2026-11-23, B6.3: "yeh tumne bataya tha" only of what the child told before — with nothing
  // told before, the phrase form; with "sixer maara" in an earlier line of theirs, the said-again form)
  assert.equal(againInHerWords("kal maine cricket khela, sixer maara", "cricket", "hinglish", { recent: [] }), "Achha, pichhli baar sixer maara.");
  // (re-pinned, to-brain 052 C: the forms are read from data/lesson-aside-replies.json as it stands — e12517b3f rewrote them: no "sabse"
  // of what the child did not rank, second mention as second mention)
  const sport = JSON.parse(readFileSync(new URL("../data/lesson-aside-replies.json", import.meta.url), "utf8")).kinds.sport;
  const fill = (f, phrase) => f.hi.replace("{phrase}", phrase);
  const again = againInHerWords("kal maine cricket khela, sixer maara", "cricket", "hinglish", { recent: [{ who: "child", text: "maine sixer maara tha" }, { who: "teacher", text: "Achha." }] });
  assert.ok(sport.againReplies.map((f) => fill(f, "sixer maara")).includes(again), again);
  // (her return in the script's own form — "usmein sabse mazedaar kya hai?" — is a liking question: the phrase form answers it)
  // (re-pinned, d35 closing item 1: the merged library's replyKinds (Learning 023 rule 7, to-brain 053 C2) — a liking asked or said is
  // answered in the first liking form, read from the file, with the child's own phrase)
  const liking = JSON.parse(readFileSync(new URL("../data/lesson-aside-replies.json", import.meta.url), "utf8")).replyKinds.liking;
  assert.equal(asideReplyLine({ said: "chauka", topic: "cricket", asked: "Ab cricket ki baat karte hain: usmein sabse mazedaar kya hai?", words: ["chauka"] }).line, fill(liking[0], "chauka"));
  assert.equal(asideReplyLine({ said: "batting sabse achhi lagti hai", topic: "cricket", asked: "Cricket ki baari aa gayi: uske baare mein thoda aur batao na?", words: ["batting"] }).line,
    fill(liking[0], "batting"));
});

// (dc-r8-director27 Brain 042 E3 superseded this row's rule — the card's own second view, its posing board's — and dc-r8-director29 Brain 045 P1
// supersedes E3: one function names the board a picture turn is of — the part being helped, or the answered card's answer board after its
// key — and that board is drawn under its answerViewCaption (Learning 018), else redrawn alone with the card's why. Brain 045 P3 moves the key
// off the recorded rows (a follow-up card's ladder runs into its remediation's wordings first), so the key is reached here by missing the
// then-card on director29 steering c5-t01 until the walk keys it)
test("Record: a picture asked for after the walk's key on a then-card (c5-t01 steering) is drawn on the card's answer board (Brain 045 P1)", async () => {
  const { kit, plans } = await replay("2026-11-18-director29", "steering", "c5-maths-ch02-t01", 12);
  let st = { ...plans.at(-1).state };
  assert.ok(String(st.activeItemId ?? "").includes(":then:"), "a follow-up card is live");
  for (let k = 0; k < 6 && !st.lastMove?.gave?.answer; k++) { const p = await planAt(st, "1 and 6", kit); st = { ...p.r.state, mode: "text" }; }
  const prev = st.lastMove;
  assert.ok(prev.gave?.answer, "the walk keyed the card");
  assert.ok(prev.closeBeat?.answerBoard, "the key was said over the card's answer board");
  const p = await planAt(st, "drawing karke samjhao", kit);
  const m = p.r.state.lastMove;
  assert.equal(m.request, "visual");
  assert.ok(m.keyedPicture, "a picture of the card just keyed");
  assert.deepEqual(m.scriptBeat?.board, prev.closeBeat.board, "the picture is on the answered card's answer board");
  assert.notDeepEqual(m.scriptBeat?.board, prev.closeBeat.posingBoard, "never the posing board");
});

test("W1: the closing question answered right — the wrap opens on the verdict and its why; a line after the closing key gets the acknowledgement", async () => {
  // (Brain 044: c4 steady's replayed lines run out before the closing question on today's rules; c5-t01 steady reaches it)
  // (Brain 046 Q1: a yes or an aside at an asked step no longer tells it — director26's recorded lines leave the walk before the closing
  // question in every steady lesson; director30's steady c5-t01 reaches it)
  // (d32 step 0: Learning's d32 rewrite of c5-t01 changed its cards, and director30's recorded lines no longer reach the closing question on
  // the live script — nor on the run's own copy, which d31's walk had already moved off it. The replay walks the script as it stood before
  // the d32 rewrite, kept as a fixture: the last one these lines reach the closing question on)
  setScriptForTest("c5-maths-ch02-t01", JSON.parse(readFileSync(new URL("./fixtures/scripts/c5-maths-ch02-t01.d31.json", import.meta.url), "utf8")));
  // (to-brain 049 B6: the verdict-point-card split added turns director30's recorded child never answered. Re-pinned to main's ruling of
  // 2026-11-23: with such a turn said whole up to 70 the replay reaches the closing question with the split on — no switch)
  const vpc0 = process.env.TAXILA_VPC_SPLIT; delete process.env.TAXILA_VPC_SPLIT;
  try {
  const { kit, plans } = await replay("2026-11-18-director30", "steady", "c5-maths-ch02-t01", 400);
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
  // (dc-r8-director27 P4: a first miss gets the closing question's hint and the question again; the second, the key turn; then "mujhe laga
  // aisa hi hoga" — the wrap's first turn opens on a wrap.ack form)
  const miss1 = await planAt(asked.state, "5/9", kit);
  assert.equal(miss1.r.state.lastMove.kind, "teachback");
  assert.equal(miss1.r.state.lastMove.authoredEnd, "teachback", "the hint and the question again, not the key");
  assert.equal(miss1.r.state.lastMove.renderedKinds?.[0], "help");
  const miss = await planAt({ ...miss1.r.state, recent: [...(miss1.r.state.recent ?? []), { who: "teacher", text: (miss1.r.state.lastMove.rendered ?? []).join(" ") }] }, "5/9", kit);
  assert.equal(miss.r.state.lastMove.authoredEnd, "teachbackKey", "the second miss gets the key");
  const after = await planAt(miss.r.state, "mujhe laga aisa hi hoga", kit);
  const w = after.r.state.lastMove;
  assert.equal(w.kind, "wrap");
  const acks = tb && (await import("../server/director/script.js")).scriptFor(kit).script.wrap.ack.map((f) => f.hi);
  assert.ok(w.wrapAck && acks.some((a) => String(w.rendered?.[0] ?? "").startsWith(String(a).slice(0, 12))), JSON.stringify(w.rendered));
  } finally { setScriptForTest(); if (vpc0 === undefined) delete process.env.TAXILA_VPC_SPLIT; else process.env.TAXILA_VPC_SPLIT = vpc0; }
});
