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
    return { text: norm(t.reply), lm: r.state.lastMove ?? {}, state: r.state, ui: r.ui, seams: (t.guard?.seams ?? []).map((x) => x.right), parts: t.guard?.lineParts ?? t.guard?.parts?.list ?? [] };
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

describe("item 2: a plain no at a comprehension check-in is \"I did not understand\" — the path \"samajh nahi aaya\" takes there", () => {
  const CK = /(?:Yahan tak theek hai|Ab tak samajh aaya|Yahan tak saaf hai|Yeh hissa saaf hua|Yeh kadam saaf hai|Yeh kadam samajh aaya)\?$/;
  const atBridgeCheckin = (s) => !s.lastUi?.ask?.itemId && !!s.lastMove?.bridgeSaid && !(s.lastMove?.replyPoint || s.lastMove?.startApart)
    && CK.test(String([...(s.recent ?? [])].reverse().find((t) => t.who === "teacher")?.text ?? "").trim());
  for (const TOPIC of ["c5-maths-ch02-t01", "c6-maths-ch06-t01"]) {
    test(`${TOPIC}, a bridge's check-in: "nahi" gets what "samajh nahi aaya" gets — the bridge's easier wording, then the same check-in; a second goes on`, async () => {
      const said = async (lines) => { const w = await walker(TOPIC); try { assert.ok(await w.until(atBridgeCheckin), "the walk reaches a bridge's check-in"); const out = []; for (const x of lines) out.push(await w.go(x)); return out; } finally { w.done(); } };
      const [n1, n2] = await said(["nahi", "nahi"]);
      const [c1, c2] = await said(["samajh nahi aaya", "samajh nahi aaya"]);
      assert.equal(n1.text, c1.text); assert.equal(n2.text, c2.text);
      assert.ok(n1.lm.help || n1.seams.includes("help"), `help: ${n1.text}`);
      assert.ok(!n1.ui.ask?.itemId, "no card yet: the same check-in");
      assert.match(n1.text, CK);
      // (the child's words are recorded as said: the record's cell reads the child's own line — column "other", a plain no the walk has no
      // column for — never the "samajh nahi aaya" reading the walk acts on, whose own cell says "clarify". RULING-G item 13, pr7 step 3: the
      // old assertions read talk.turns, which talk.js does not keep, and defaulted the column, so they could not fail. The talk monitor
      // counts no request turn — "samajh nahi aaya" included — so it is no record of either)
      assert.deepEqual([n1.lm.cell?.column, c1.lm.cell?.column], ["other", "clarify"], JSON.stringify([n1.lm.cell, c1.lm.cell]));
      assert.equal(n1.lm.cell?.part, c1.lm.cell?.part);
    });
  }
  test("the other side: a \"haan\" there goes on; a no to a question card is an answer (graded), never this", async () => {
    const w = await walker("c5-maths-ch02-t01");
    try {
      assert.ok(await w.until(atBridgeCheckin));
      const y = await w.go("haan");
      assert.ok(!y.lm.help, "a yes is no request");
    } finally { w.done(); }
    const w2 = await walker("c4-maths-ch05-t01");
    try {
      // (a yes-or-no card that the walk certainly reaches: c4-maths-ch05-t01's second card, skills[0].explain[1].ask, key No — "Kya woh pizza
      // ka ek-tihaai hai, haan ya nahi?". RULING-G item 13, pr7 step 3: the old side ran under \`if (reached)\` and could assert nothing)
      assert.ok(await w2.until((s) => /-s1:ask:e2$/.test(String(s.activeItemId ?? ""))), "the walk reaches the yes-or-no card");
      assert.match(String(w2.now().lastUi?.ask?.text ?? ""), /haan ya nahi\?$/);
      const n = await w2.go("nahi");
      // (graded by the card as its answer — right, its key is No — never sent down the clarify path)
      assert.equal(n.lm.cell?.column, "right", JSON.stringify(n.lm.cell));
      assert.notEqual(n.lm.help?.request, "clarify", n.text); assert.ok(!n.lm.help, n.text);
    } finally { w2.done(); }
  });
  test("plainNoUnhelped (gated): a plain no to a check-in answered by a point and a card trips it; help, a stop or a yes does not", () => {
    assert.ok(!PENDING.has("plainNoUnhelped"));
    const her = { who: "teacher", text: "Ab wahi gaps ginenge. Yahan tak saaf hai?" };
    const no = { who: "child", text: "nahi" };
    const t = (seams, o = {}) => ({ who: "teacher", text: "x", seams: seams.map((right) => ({ right })), ...o });
    const L = (r, kid = no) => ({ rows: [her, kid, r] });
    assert.match(PREDICATES.plainNoUnhelped(L(t(["point", "card"])), t(["point", "card"]), 2), /answered with no help/);
    assert.match(PREDICATES.plainNoUnhelped(L(t(["returnCard"])), t(["returnCard"]), 2), /answered with no help/);
    assert.equal(PREDICATES.plainNoUnhelped(L(t(["help", "checkin"])), t(["help", "checkin"]), 2), null);
    assert.equal(PREDICATES.plainNoUnhelped(L(t(["stopLine"])), t(["stopLine"]), 2), null);
    assert.equal(PREDICATES.plainNoUnhelped(L(t(["point", "card"]), { who: "child", text: "haan" }), t(["point", "card"]), 2), null);
    // (the second no running — her help to a FIRST plain no at that check-in ended on the check-in again — goes on, as a second "samajh nahi
    // aaya" does there; RULING-G item 13: only when the child's line before that help was itself a plain no at a check-in)
    const helpCk = { who: "teacher", text: "Gaps gino. Ab tak samajh aaya?", seams: [{ right: "help" }, { right: "checkin" }] };
    const goOn = t(["afterKeyGoOn", "point", "card"]);
    assert.equal(PREDICATES.plainNoUnhelped({ rows: [her, no, helpCk, no, goOn] }, goOn, 4), null);
    // (help given for a picture request, then a FIRST "nahi" answered with the go-on line: flagged — pr7 step 3, steering c4-ch05-t01 16)
    assert.match(PREDICATES.plainNoUnhelped({ rows: [her, { who: "child", text: "picture dikhao" }, helpCk, no, goOn] }, goOn, 4), /no help/);
    assert.match(PREDICATES.plainNoUnhelped({ rows: [helpCk, no, goOn] }, goOn, 2), /no help/);
    assert.match(PREDICATES.plainNoUnhelped({ rows: [her, no, helpCk, no, t(["point", "card"])] }, t(["point", "card"]), 4), /no help/);
    assert.match(PREDICATES.plainNoUnhelped({ rows: [her, no, goOn] }, goOn, 2), /no help/);
    const card = { who: "teacher", text: "Kya Pinky sahi hai?" };
    assert.equal(PREDICATES.plainNoUnhelped({ rows: [card, no, t(["verdict", "card"])] }, t(["verdict", "card"]), 2), null);
  });
  test("RULING-G item 13 (pr7 step 3): only a stop or a safety turn is excused; at a first no `alt` and `helpSpent` are no help; at a bridge's check-in the help ends on the check-in again", () => {
    const her = { who: "teacher", text: "Ab wahi gaps ginenge. Yahan tak saaf hai?" };
    const bridge = { ...her, seams: [{ right: "bridge" }, { right: "checkin" }] };
    const no = { who: "child", text: "nahi" };
    const t = (seams, o = {}) => ({ who: "teacher", text: "x", seams: seams.map((right) => ({ right })), ...o });
    const at = (r, h = her) => PREDICATES.plainNoUnhelped({ rows: [h, no, r] }, r, 2);
    assert.match(at(t(["point", "card"], { move: "wrap" })), /no help/);
    assert.match(at(t(["point", "card"], { move: "break" })), /no help/);
    assert.equal(at(t(["goodbye"], { move: "goodbye" })), null);
    assert.equal(at(t(["safety"], { move: "safeguard" })), null);
    assert.match(at(t(["helpSpent", "card"])), /no help/);
    assert.match(at(t(["card"], { pageParts: [{ part: "alt" }] })), /no help/);
    assert.equal(at(t(["card"], { pageParts: [{ part: "simpler" }] })), null);
    assert.equal(at(t(["key", "checkin"])), null);
    assert.match(at(t(["help", "point", "card"], { text: "Gaps gino. Is baar line 3 gaps mein hai. Kaunsa mark?" }), bridge), /does not end on the check-in again/);
    assert.equal(at(t(["help", "checkin"], { text: "Gaps gino. Ab tak samajh aaya?" }), bridge), null);
  });
  test("RULING-G item 13 (pr7 step 3): \"nhi\", \"nahin\" and a no with an address word are a plain no — at a check-in only, in the walk and (by its own list) in the check; \"nai\" is not", async () => {
    const { isPlainNo } = await import("../evals/hybrid-side-by-side/d37g-predicates.mjs");
    const her = { who: "teacher", text: "Ab wahi gaps ginenge. Yahan tak saaf hai?" };
    const pc = { who: "teacher", text: "x", seams: [{ right: "point" }, { right: "card" }] };
    for (const x of ["nhi", "nahin", "nahi didi", "nahi ma'am", "nahi mam", "nahi miss", "no ma'am", "nahi teacher", "Nahi, didi.", "nahi samjha didi"]) {
      assert.ok(isPlainNo(x), x);
      assert.match(PREDICATES.plainNoUnhelped({ rows: [her, { who: "child", text: x }, pc] }, pc, 2), /no help/, x);
    }
    for (const x of ["nai", "nahi pata", "no idea", "nahi didi mujhe nahi pata"]) assert.ok(!isPlainNo(x), x);
    // (the walk: the same forms at a bridge's check-in take the clarify path; "nai" does not)
    const CK = /(?:Yahan tak theek hai|Ab tak samajh aaya|Yahan tak saaf hai|Yeh hissa saaf hua|Yeh kadam saaf hai|Yeh kadam samajh aaya)\?$/;
    const atB = (s) => !s.lastUi?.ask?.itemId && !!s.lastMove?.bridgeSaid && !(s.lastMove?.replyPoint || s.lastMove?.startApart)
      && CK.test(String([...(s.recent ?? [])].reverse().find((q) => q.who === "teacher")?.text ?? "").trim());
    const one = async (line) => { const w = await walker("c5-maths-ch02-t01"); try { assert.ok(await w.until(atB)); return await w.go(line); } finally { w.done(); } };
    const ref = await one("samajh nahi aaya");
    for (const x of ["nhi", "nahi didi", "no ma'am"]) { const r = await one(x); assert.equal(r.text, ref.text, x); assert.equal(r.lm.cell?.column, "other", x); }
    const nai = await one("nai");
    assert.notEqual(nai.text, ref.text);
  });
});

describe("item 9 (pr6 section 3): closing item 5's kept-split fallback only where the held board is the board up (`same`)", async () => {
  const bf = await import("../server/stagecraft/board-first.js");
  const bars = { template: "fraction-bars@1", params: { bars: [{ parts: 9, shade: 0, label: "" }, { parts: 11, shade: 0, label: "" }] } };
  const wholes = { template: "wholes@1", params: { wholes: [{ parts: 2, title: "Roti" }, { parts: 10, title: "Roti" }] } };
  const one = (b) => bf.heldBoard({ intent: { held: { board: b, unit: "u" }, style: { band: "B3" } }, line: { text: "x" } }).lastPage;
  const barsPage = one(bars), viewPage = one(wholes);
  const split = { ...barsPage, ops: [...barsPage.ops, ...viewPage.ops.map((o) => ({ ...o, id: `v${o.id}`.slice(0, 32) }))] };
  const pages = (r) => r.screens.map((s) => [s.from, s.template]);
  test("the side no matrix row reaches: the board up (a kept split page) differs from the held board and she leads with a joint — the held board never goes up under her lead", () => {
    const lead = "Achha, chalo dekhte hain.";
    const rest = "Board par dono roti dekho: 2 hisson wali roti ka ek hissa aadhi roti hai, aur 10 hisson wali ka ek hissa bahut patla. Kaunsa hissa chhota hai?";
    const text = `${lead} ${rest}`;
    const ask = { intent: { held: { board: wholes, unit: "c5-maths-ch02-t02-s1:rem:x#help", switchTo: { board: bars, unit: "c5-maths-ch02-t02-s1:rem:x", atChar: text.length - 22 }, clearIfFull: true }, style: { band: "B3" } },
      line: { text, parts: { list: [{ part: "aside", text: lead }, { part: "simpler", text: rest }] } } };
    const r = bf.heldBoard(ask, { keepRef: bf.refKey(bars), keepPage: { ...split, keptBeside: { template: "wholes@1", altView: "wholes" } } });
    assert.ok(r, "a page");
    const under = pages(r).filter(([from]) => from < lead.length + 1).map(([, t]) => t);
    assert.ok(!under.includes("wholes@1") || pages(r)[0][1] !== "wholes@1", `the held board under her lead: ${JSON.stringify(pages(r))}`);
    assert.notDeepEqual(pages(r)[0], [0, "wholes@1"]);
  });
});

// G2: items 12 (evals only), 4, 5, 6, 7, 8, 10 and 11 (evals only).
describe("item 12 (main's ruling on G1's clash): returnAsksAgain's fallback counts an earlier answer only to a liking question of the same subject", async () => {
  const { D33_PREDICATES, sameLikeSubject } = await import("../evals/hybrid-side-by-side/d33-predicates.mjs");
  const T = (text) => ({ who: "teacher", text });
  const C = (text, intent = "aside_reply") => ({ who: "child", text, intent });
  const ai = (q) => T(`Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. ${q}`);
  const lesson = (q2, q1 = "Haan, sahi hai: 15/20. Chalo, cricket ke baare mein batao, tumhe woh kyun pasand hai?") => {
    const rows = [C("mujhe cricket pasand hai", "aside"), T(q1), C("fielding karna, catch pakadna"), T("Achha, toh tumhe catch pakadna pasand hai! Ab tak samajh aaya?"), C("aapko virat pasand hai?", "aside"), ai(q2)];
    return D33_PREDICATES.returnAsksAgain({ rows }, rows[5], 5);
  };
  test("g/dry1 offtopic c6-ch07-t03 48: the child raised Virat, she asks about Virat after an answer about cricket: passes", () => {
    assert.equal(lesson("Tumhe Virat ke baare mein sabse achha kya lagta hai?"), null);
    assert.equal(sameLikeSubject("Chalo, cricket ke baare mein batao, tumhe woh kyun pasand hai?", "Tumhe Virat ke baare mein sabse achha kya lagta hai?"), false);
  });
  test("the other side: the same subject asked twice still flags", () => {
    assert.match(lesson("Tumhe cricket mein sabse achha kya lagta hai?"), /after they said "fielding karna/);
  });
  test("the other side: a liking question that names no subject, after an answered liking question, still flags", () => {
    assert.match(lesson("Tumhe usmein sabse achha kya lagta hai?"), /after they said "fielding karna/);
  });
});

describe("item 4: a Hindi request at a held-card check-in is answered in Hindi — the switch line, then the held card's Hindi form", async () => {
  const { helpPart, hindiFormOf } = await import("../server/director/help.js");
  const { scriptFor } = await import("../server/director/script.js");
  const HINDI = ["Hindi mein bolo", { outcome: "no_evidence", confidence: 1, flags: {}, request: { type: "language", lang: "hindi" } }];
  const SWITCH = /Hindi mein (?:kehti|bolti|samjhati) hoon/i;
  for (const TOPIC of ["c5-maths-ch02-t01", "c6-maths-ch06-t01", "c5-maths-ch02-t03"]) {
    test(`${TOPIC}, A(ii)'s split first turn (two requests at the greeting): "Hindi mein bolo" — the switch line, the held card's Hindi form, ending on it; the card no longer held`, async () => {
      const w = await walker(TOPIC);
      try {
        const g = ["samajh nahi aaya", { outcome: "no_evidence", confidence: 1, flags: {}, request: { type: "another", whole: true, src: "p5", confused: true } }];
        await w.go(...g); const a = await w.go(...g);
        assert.ok(a.lm.startApart && a.state.splitHold?.teach, "the split first turn, its card held");
        const id = a.state.splitHold.ui.ask.itemId;
        const sc = scriptFor(w.kit).script;
        const hf = hindiFormOf(sc, helpPart(sc, `${id.replace(/^script:/, "").replace(/:ask:/, ":")}:card`)) ?? null;
        const t = await w.go(...HINDI);
        if (!hf) { assert.ok(!SWITCH.test(t.text), "no form: the easier-words line as built"); return; }
        assert.match(t.text, SWITCH);
        assert.ok(t.text.endsWith(norm(hf).replace(/\{friend\}/g, "Riya")) || t.text.includes(norm(hf).split(/(?<=[.!?])\s+/).at(-1)), t.text);
        assert.equal(t.ui.ask?.itemId, id, "the card is asked"); assert.ok(!t.state.splitHold, "no longer held");
        assert.ok(!/seedhe shabdon|aasaan shabdon|aur aasaan/i.test(t.text), "not the easier-words line");
        // (the switch line is the turn's lead part, said once: the board up stays under it and the card's board comes in at the card)
        assert.equal(t.text.match(SWITCH)?.length, 1);
        assert.equal(t.parts[0]?.part, "aside", JSON.stringify(t.parts)); assert.match(t.parts[0].text, SWITCH);
        assert.ok(t.parts.slice(1).some((p) => p.part === "card"), JSON.stringify(t.parts)); assert.ok(t.lm.heldHindi);
      } finally { w.done(); }
    });
  }
});


describe("item 4, the other side: a Hindi request at a card she has said keeps the switch line out of the parts, as built", () => {
  test("c5-maths-ch02-t01: a said card, \"Hindi mein bolo\" — the card's Hindi form after the switch line, no lead part, no heldHindi", async () => {
    const w = await walker("c5-maths-ch02-t01");
    try {
      await w.until((s) => s.activeItemId && !s.splitHold && /:ask:/.test(String(s.activeItemId)));
      const t = await w.go("Hindi mein bolo", { outcome: "no_evidence", confidence: 1, flags: {}, request: { type: "language", lang: "hindi" } });
      assert.ok(!t.lm.heldHindi);
      assert.ok(!t.parts.some((p) => p.part === "aside" && /Hindi mein (?:kehti|bolti|samjhati) hoon/i.test(p.text)), JSON.stringify(t.parts));
    } finally { w.done(); }
  });
});

describe("item 5 (and pr6's widening): the reply's slot never takes a person word; after the AI line's \"kab\" question, the slot-less form", async () => {
  const A = await import("../server/brain/asideReplies.js");
  const S = await import("../server/brain/say.js");
  const PLAIN = new Set(Object.values(JSON.parse((await import("node:fs")).readFileSync(new URL("../data/lesson-aside-replies.json", import.meta.url), "utf8")).kinds).flatMap((k) => (k.plain ?? []).map((f) => f.hi)));
  const KAB = "Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumne pehli baar Virat ko kab dekha tha?";
  test("the AI line's \"kab\" form is known by its words (TASTE_QS's third, as honestTasteLine asks it); its other forms are not", () => {
    assert.ok(S.tasteWhenAsked(KAB));
    assert.ok(S.tasteWhenAsked(S.honestTasteLine("Virat", "hinglish", 1, [], true)));
    assert.ok(S.tasteWhenAsked("I'm an AI teacher, so I don't have favourites of my own. When did you first watch cricket?"));
    assert.ok(!S.tasteWhenAsked("Main AI hoon, meri koi pasand nahi hoti. Virat ko tum kiske saath dekhte ho?"));
    assert.ok(!S.tasteWhenAsked("Sixer ki baat tumne ki thi: woh kab ki baat hai?"));
  });
  test("offtopic c6-ch07-t01 50: \"jab main chhoti thi, papa ke saath\" to the kab question — a slot-less form, never \"Haan, papa! Samajh gayi.\"", () => {
    for (const said of ["jab main chhoti thi, papa ke saath", "pichhle saal TV par"]) {
      const r = A.asideReplyLine({ said, topic: "Virat", asked: KAB, words: ["papa", "chhoti", "pichhle"], slotless: true });
      assert.equal(r.form, "plain", said); assert.ok(PLAIN.has(r.line), r.line);
    }
  });
  test("the other side: without the kab question a when-answer keeps its phrase form (\"pichhle saal TV\")", () => {
    const r = A.asideReplyLine({ said: "pichhle saal TV par", topic: "Virat", asked: "Sixer ki baat tumne ki thi: woh kab ki baat hai?", words: ["pichhle"] });
    assert.equal(r.form, "phrase"); assert.match(r.line, /pichhle saal TV/);
  });
  test("offtopic c4-ch01-t02 34: \"papa ke saath dekhta hoon\" — no person word in the slot: the slot-less form", () => {
    const r = A.asideReplyLine({ said: "papa ke saath dekhta hoon", topic: "Virat", asked: "Main AI hoon, meri koi pasand nahi hoti. Virat ko tum kiske saath dekhte ho?", words: ["papa"] });
    assert.ok(!/papa/i.test(r.line), r.line); assert.equal(r.form, "plain");
    assert.equal(A.replyWordOf(["papa", "mummy", "didi", "dost"], "papa mummy didi dost"), null);
  });
  test("the other side: another content word of the child's line that fits takes the slot; a name is no person word", () => {
    const r = A.asideReplyLine({ said: "papa aur Rohit ke saath", topic: "Virat", asked: "Virat ko tum kiske saath dekhte ho?", words: ["rohit", "papa"] });
    assert.match(r.line, /Rohit/); assert.ok(!/papa/i.test(r.line), r.line);
    const v = A.asideReplyLine({ said: "Rohit ke saath", topic: "Virat", asked: "Virat ko tum kiske saath dekhte ho?", words: ["rohit"] });
    assert.match(v.line, /Rohit!/);
    assert.equal(A.replyWordOf(["papa", "chauka"], "papa ne chauka maara"), "chauka");
  });
});

describe("item 6: a side-topic the child TELLS, said again where its park comes due, is answered as told (the told return)", async () => {
  const S = await import("../server/brain/say.js");
  const TOLD = "kal maine cricket khela, sixer maara";
  const ret = { topic: "cricket", share: true, said: "mujhe cricket pasand hai" };
  const st = (again) => ({ seed: 7, turn: 31, recent: [], later: [], lastMove: { returned: ret, ...(again ? { asideAgain: { topic: "cricket" } } : {}) } });
  test("close/dry1 offtopic c6-ch07-t03 32: the return reads the line just told — it keeps \"sixer\" and asks nothing told (not what they like, not when)", () => {
    assert.equal(S.toldNowOf(ret, st(true), TOLD), TOLD);
    const q = S.returnQuestion("cricket", "hinglish", st(true), { said: S.toldNowOf(ret, st(true), TOLD) });
    assert.match(q, /sixer/i, q); assert.ok(!/pasand|achha lag|kab ki baat|batao/i.test(q), q);
  });
  test("the other side: no aside said again on the turn (or a line that tells nothing, or another topic) — the park's own words, as built", () => {
    assert.equal(S.toldNowOf(ret, st(false), TOLD), ret.said);
    assert.equal(S.toldNowOf(ret, st(true), "cricket cricket"), ret.said);
    assert.equal(S.toldNowOf({ ...ret, topic: "football" }, st(true), TOLD), ret.said);
  });
});

describe("item 7: help at a card said in its POINT's wording ends on the card's reask (stuck c5-ch02-t01 12, c5-ch02-t02 12, c5-ch02-t03 12)", async () => {
  const { pointHelpReaskAt } = await import("../evals/hybrid-side-by-side/d34b-predicates.mjs");
  const { reaskOf } = await import("../server/director/question-run.js");
  const fs = await import("node:fs");
  const sc = JSON.parse(fs.readFileSync(new URL("../data/lesson-scripts/c5-maths-ch02-t01.json", import.meta.url), "utf8"));
  const GIVE = { outcome: "no_evidence", confidence: 1, flags: {}, request: { type: "give_up" } };
  test("the walk: give-ups at the first card — the turn whose help is the point's wording, third at the question, ends on the card's reask, never the invitation", async () => {
    const w = await walker("c5-maths-ch02-t01");
    try {
      await w.until((s) => /:ask:e1$/.test(String(s.activeItemId ?? "")));
      const reask = reaskOf(sc, ".skills[0].explain[0].ask");
      let hit = null, before = null, last = null;
      for (let k = 0; k < 4 && !hit; k++) {
        const t = await w.go("pata nahi", GIVE);
        if (["pointAlt", "simpler"].includes(String(t.lm.help?.rung)) && t.lm.pointHelpReask) { hit = t; before = last; }
        last = t;
      }
      assert.ok(hit, "a point-wording help turn marked pointHelpReask");
      assert.ok(!/Ab tum batao\.$/.test(hit.text), hit.text);
      // (on the reask; where her turn before ended on that reask, on the card as posed — the reask is not said twice running)
      if (before?.text.endsWith(reask)) assert.ok(!hit.text.endsWith(reask) && /\?$/.test(hit.text), hit.text);
      else assert.ok(hit.text.endsWith(reask), hit.text);
      assert.ok(pointHelpReaskAt({ who: "teacher", cell: { part: "c5-maths-ch02-t01-s1:e1:card" }, text: hit.text }, sc, before ? { text: before.text } : null), hit.text);
    } finally { w.done(); }
  });
  test("questionThreeRunning's exemption reads exactly that turn: the point's simpler at the card ending on its reask passes; the same help ending on the invitation, or a card's own simpler, does not", () => {
    const simpler = sc.skills[0].explain[0].simpler.hi;
    const reask = reaskOf(sc, ".skills[0].explain[0].ask");
    const cell = { part: "c5-maths-ch02-t01-s1:e1:card", column: "give_up" };
    assert.ok(pointHelpReaskAt({ who: "teacher", cell, text: `${simpler} ${reask}` }, sc));
    assert.ok(!pointHelpReaskAt({ who: "teacher", cell, text: `${simpler} Ab tum batao.` }, sc));
    assert.ok(!pointHelpReaskAt({ who: "teacher", cell, text: `Kuch aur socho. ${reask}` }, sc));
    assert.ok(!pointHelpReaskAt({ who: "teacher", cell: { ...cell, part: "c5-maths-ch02-t01-s1:e1:checkin" }, text: `${simpler} ${reask}` }, sc));
    // (the card as posed, its own question, only where her turn before ended on the reask)
    const prompt = sc.skills[0].explain[0].ask.prompt.hi;
    assert.ok(pointHelpReaskAt({ who: "teacher", cell, text: `${simpler} ${prompt}` }, sc, { text: `Kuch socho. ${reask}` }));
    assert.ok(!pointHelpReaskAt({ who: "teacher", cell, text: `${simpler} ${prompt}` }, sc, { text: "Kuch socho. Ab tum batao." }));
    assert.ok(!pointHelpReaskAt({ who: "teacher", cell, text: `${simpler} ${prompt}` }, sc));
  });
});
