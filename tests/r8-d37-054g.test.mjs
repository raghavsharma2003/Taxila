// d37 builder G (RULING-G, main's ruling after the last read before the paid run): the round's own regressions and the smaller items.
// G1: items 1 (the reply turn's board), 2 (a plain no at a comprehension check-in), 4 (a Hindi request at a held-card check-in) and 9
// (closing item 5's `same`). Item 3 (A(iii) out) is pinned beside the tests it re-pins (r8-d37-054a, r8-d37-054a2).
import { test, describe } from "node:test";
import assert from "node:assert/strict";

const { initLessonState, step } = await import("../server/director/state.js");
const { kitFromFile } = await import("../server/content/kits.js");
const { getTopic } = await import("../server/content/curriculum.js");
const { textReply, replyDeps } = await import("../server/brain/say.js");
const { classifyFast, targetFor } = await import("../server/director/classify.js");
const { findItem } = await import("../server/director/items.js");
const { dryReading } = await import("../evals/hybrid-side-by-side/dry-reader.mjs");
const { useStaged } = await import("../evals/hybrid-side-by-side/staged.mjs");
const { PREDICATES, PENDING } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");

const STUB = "Achha, chalo isko saath mein dekhte hain. Ek baar phir se batao?";
const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const J = (b) => JSON.stringify(b ?? null);

/** A lesson walked with step() and textReply (the reply stubbed: every line is the script's or code's), each child line read as the dry
 *  matrix reads it (code's reader, else the dry stub). `go(text)` says one line; `until(s)` walks right answers (or "haan") first. */
async function walker(TOPIC, seed = 7) {
  useStaged([TOPIC]);
  const kit = kitFromFile(getTopic(TOPIC));
  const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "a pretend little friend" }, ageBand: "10-15", lang: "hinglish",
    interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: TOPIC, classLevel: Number(/^c(\d)/.exec(TOPIC)[1]), sessionId: `d37-054g-${seed}`, lessonKey: `d37-054g-${seed}`, teacher: "director" };
  const chat0 = replyDeps.chat, stream0 = replyDeps.chatStream;
  replyDeps.chat = async () => ({ text: STUB }); replyDeps.chatStream = replyDeps.chat;
  let r = step(initLessonState({ topicId: TOPIC, kit, ctx, seed, now: 0 }), { event: "start", kit, now: 0 });
  const say = async (text) => textReply({ instructions: "x", state: r.state, kit, childText: text, history: r.state.recent ?? [], ui: r.ui, module: null });
  r.state.recent = [...(r.state.recent ?? []), { who: "teacher", text: (await say("")).reply }];
  const go = async (text, cls = null) => {
    const s = r.state;
    const item = s.activeItemId ? findItem(s, kit, s.activeItemId) : null;
    const target = targetFor(s, kit, item);
    const read = cls ?? (classifyFast({ target, childText: text, lang: "hinglish", classLevel: ctx.classLevel, typed: true }).result ?? dryReading(target));
    r = step({ ...s, recent: [...(s.recent ?? []), { who: "child", text }] }, { event: "turn", kit, text, cls: read, now: (s.turn + 1) * 20_000 });
    const t = await say(text);
    r.state.recent = [...(r.state.recent ?? []), { who: "teacher", text: t.reply }];
    return { text: norm(t.reply), lm: r.state.lastMove ?? {}, state: r.state, ui: r.ui, seams: (t.guard?.seams ?? []).map((x) => x.right) };
  };
  const until = async (f, n = 300) => { for (let i = 0; i < n && !f(r.state); i++) { const it = r.state.activeItemId ? findItem(r.state, kit, r.state.activeItemId) : null; await go(it ? String(it.answer) : "haan"); } return f(r.state); };
  return { go, until, kit, now: () => r.state, done: () => { replyDeps.chat = chat0; replyDeps.chatStream = stream0; } };
}


describe("item 1: her reply's point turn pages the point on its OWN board; the card's board comes up with the card", () => {
  // (the made rows: a turn of her reply, a joint and point e1 of skill s2 ending on its check-in; e1's point board A, its card's board B)
  const A = { template: "angle@1", params: { angles: [{ deg: 60, name: "kam" }] } };
  const B = { template: "angle@1", params: { angles: [{ deg: 50, name: "cake ki nok" }] } };
  const script = { topicId: "t", joints: {}, skills: [{ skillId: "t-s1", explain: [] }, { skillId: "t-s2", explain: [{ id: "e1", board: A, point: { hi: "p" }, ask: { board: B, prompt: { hi: "q?" } } }] }] };
  const up = { template: "shape@1", params: { shape: "square" } };
  const row = (board) => ({ who: "teacher", text: "Achha, batting! Chalo, ab padhai. Tester ka kona kone par. Yahan tak saaf hai?", beat: "s2:explain:e1", boardRef: up,
    pageParts: [{ part: "body", from: 34, beat: "e1", boards: [board], own: board }], segments: [{ from: 0, beat: "e1", board: up }, { from: 34, beat: "e1", board }],
    seams: [{ left: "start", right: "aiReply" }, { left: "aiReply", right: "point" }, { left: "point", right: "checkin" }] });
  const run = (r) => { const ctx = { o: {}, script }; PREDICATES.boardOfSaidPart({ rows: [] }, { who: "teacher", text: "x", boardRef: up, segments: [{ from: 0, board: up }], pageParts: [{ part: "close", from: 0, beat: "c3", boards: [up], own: up }] }, 0, ctx); return PREDICATES.boardOfSaidPart({ rows: [] }, r, 2, ctx); };
  test("boardOfSaidPart (gated): the point recorded on its card's board, the card unsaid, trips it (close/dry1: steady c4-ch01-t02 46, steering c4-ch01-t02 38, steady c4-ch06-t01 42, offtopic c4-ch06-t01 58)", () => {
    assert.ok(!PENDING.has("boardOfSaidPart"));
    assert.match(run(row(B)), /no part said belongs to/);
  });
  test("the other side: the point on its own board passes; a beat whose point and card share one board passes", () => {
    assert.equal(run(row(A)), null);
    const same = { ...script, skills: [script.skills[0], { skillId: "t-s2", explain: [{ id: "e1", board: B, ask: { board: B } }] }] };
    const ctx = { o: {}, script: same };
    PREDICATES.boardOfSaidPart({ rows: [] }, { who: "teacher", text: "x", boardRef: up, segments: [{ from: 0, board: up }] }, 0, ctx);
    assert.equal(PREDICATES.boardOfSaidPart({ rows: [] }, row(B), 2, ctx), null);
  });
  test("the walk (state.js replyPoint, the held point said after her AI line): the point's own beat (heldBeat) pages it; the held card keeps its card beat", async () => {
    const { _replyPointForTest: replyPoint } = await import("../server/director/state.js");
    const KIT = { topicId: "t-test", __joints: { afterAiLine: [{ hi: "Ab apni padhai par lautte hain.", en: "Now back to learning." }] } };
    const CARD = { itemId: "script:t-s2:ask:e1", text: "Yeh cake ke tukde ki nok hai. Kam khuli ya zyada?" };
    const cardBeat = { skillId: "t-s2", beatId: "e1", kind: "explain", board: B };
    const pointBeat = { skillId: "t-s2", beatId: "e1", kind: "explain", board: A };
    const P = "Tester ka kona kone par, seedha kinaara bhuja par.";
    const turnOf = (lm) => {
      const lastMove = { kind: "explain", itemId: CARD.itemId, skillId: "t-s2", asideAck: true, heldSaid: [P], sayFirst: [P], scriptBeat: cardBeat, cardBeat, ...lm };
      const state = { turn: 9, ctx: { lang: "hinglish" }, later: [], posedAt: { [CARD.itemId]: 9 }, activeItemId: CARD.itemId, lastMove, lastUi: { status: "your_turn", ask: CARD }, bodyUnsaid: [P] };
      return { state, move: lastMove, ui: { status: "your_turn", ask: CARD }, moduleCommands: [], end: false };
    };
    const prev = { turn: 8, lastMove: { kind: "repair", tasteAsked: { topic: "Virat" } } };
    const INPUT = { event: "turn", kit: KIT, text: "batting", cls: { asideReply: true } };
    const t = replyPoint(prev, INPUT, turnOf({ heldBeat: pointBeat }));
    assert.equal(t.state.lastMove.replyPoint, "afterAiLine"); assert.equal(t.state.lastMove.noFit, "point");
    assert.equal(J(t.state.lastMove.scriptBeat?.board), J(A), "the point on its own board");
    assert.equal(J((t.state.splitHold.move.cardBeat ?? t.state.splitHold.move.scriptBeat)?.board), J(B), "the card held on its card's board");
    assert.equal(J(t.state.splitHold.move.scriptBeat?.board), J(B));
    // (the other side: with no held beat that owns a board — nothing to page the point on but what the move carries — as built)
    const t0 = replyPoint(prev, INPUT, turnOf({}));
    assert.equal(t0.state.lastMove.replyPoint, "afterAiLine"); assert.equal(J(t0.state.lastMove.scriptBeat?.board), J(B));
  });
});
