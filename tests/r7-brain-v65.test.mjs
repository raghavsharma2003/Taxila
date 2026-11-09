// dc-r7-script-walk-v6-5 (main's director13 judgement, four hand judges): each fix is a PREDICATE pinned on director13's own rows
// (0-based rows of the run's .json), replayed through turn.js planTurn (tests/fixtures/replay.mjs) and textReply with the run's own
// v2.3 scripts and her own words.
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { replay, runScriptOf } from "./fixtures/replay.mjs";
import { textReply, replyDeps, BEAT_ASK, WORKED_ASK } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { pictureMismatch } from "../evals/hybrid-side-by-side/checks.mjs";
import { setScriptForTest } from "../server/director/script.js";
import { findItem } from "../server/director/items.js";
import { whiteboardIntentOf, boardItemOf, cardPageRefused } from "../server/brain/propose.js";

const RUN = "2026-11-09-director13";
const TOPIC = { c4: "c4-maths-ch05-t01", "c5-t01": "c5-maths-ch02-t01", "c5-t02": "c5-maths-ch02-t02", c6: "c6-maths-ch06-t01" };
const sentences = (t) => (String(t ?? "").match(/[^.!?।]+[.!?।]*/g) ?? []).map((x) => x.trim()).filter(Boolean);

describe("r7-brain-v65.test.mjs", () => {
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT; setScriptForTest(); });
  afterEach(() => { replyDeps.chat = chat; setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });

  /** Row n (0-based, a teacher row) replayed: her line now (the run's own draft), the state, and the pages the seam would send.
   *  `lastMove` merges into the replayed move (what production's turn.js adds from Studio's pick, e.g. altView). */
  const at = async (persona, topic, n, { lastMove = null } = {}) => {
    const T = TOPIC[topic];
    setScriptForTest(T, runScriptOf(RUN, T));
    const { kit, rows, last } = await replay(RUN, persona, T, n + 1);
    const state = lastMove ? { ...last.state, lastMove: { ...last.state.lastMove, ...lastMove } } : last.state;
    replyDeps.chat = async () => ({ text: rows[n].text });
    const out = await textReply({ instructions: instructionsFor(state, kit), state, kit, childText: last.child, history: [], ui: last.p.r.ui, module: null });
    const item = boardItemOf(state, kit, findItem);
    const a = whiteboardIntentOf({ lessonId: `v65-${persona}-${topic}-${n}`, turn: state.turn, beat: { id: "visual", type: "explain" }, next: state, kit, item, line: { text: out.reply, parts: out.guard.parts } });
    return { out, rows, last, state, kit, ask: a };
  };

  // P3 — a picture turn is its own page: the second view with its own one line; the card is not said over it
  // (each row's second view as Studio drew it in director13: rows[n].screen.altView; the example view's strip from its line)
  const P3_ROWS = [
    ["steady", "c5-t01", 18, { view: "example", parts: 4, labels: ["1/4"] }],
    ["stuck", "c5-t01", 18, { view: "example", parts: 4, labels: ["1/4"] }],
    ["offtopic", "c5-t01", 26, { view: "parts", labels: [] }],
    ["steering", "c5-t01", 14, { view: "parts", labels: [] }],
    ["steady", "c5-t02", 18, { view: "parts", labels: [] }],
    ["offtopic", "c5-t02", 28, { view: "parts", labels: [] }],
  ];
  test("P3 predicate: a picture turn drawn as a second view says that view's one line and no card over it (judges' 6 rows)", async () => {
    const bad = [];
    for (const [persona, topic, n, altView] of P3_ROWS) {
      const { out, last, ask } = await at(persona, topic, n, { lastMove: { altView } });
      const tag = `${persona} ${topic} row ${n}`;
      if (last.state.lastMove?.request !== "visual" && !last.state.lastMove?.visual) { bad.push(`${tag}: not a picture turn`); continue; }
      const card = String(last.p.r.ui?.ask?.text ?? "");
      const cardS = sentences(card).filter((x) => x.length > 12);
      const said = cardS.filter((x) => out.reply.includes(x.replace(/[.!?।]+$/, "")));
      if (said.length) bad.push(`${tag}: the card said over the second view | ${out.reply.slice(0, 160)}`);
      if (/[?？]/.test(out.reply)) bad.push(`${tag}: a question over the second view | ${out.reply.slice(0, 160)}`);
      if (ask.intent.segments?.length) bad.push(`${tag}: ${ask.intent.segments.length + 1} pages`);
      if (sentences(out.reply).length > 2) bad.push(`${tag}: more than the view's line and one pointer | ${out.reply}`);
    }
    assert.deepEqual(bad, []);
  });

  // P2′ — a card whose own page Studio refuses is not said over the page before it
  const P2B_ROWS = [["steady", "c4", 56], ["steady", "c4", 60], ["offtopic", "c4", 56]];
  test("P2′ predicate: a refused card page means no line about that card's figure; the part is dropped and logged (judges' 3 rows)", async () => {
    const bad = [];
    for (const [persona, topic, n] of P2B_ROWS) {
      const { out, last, state, kit } = await at(persona, topic, n);
      const tag = `${persona} ${topic} row ${n}`;
      const card = String(last.p.r.ui?.ask?.text ?? "");
      const item = boardItemOf(state, kit, findItem);
      const refused = cardPageRefused({ lessonId: `v65p2-${persona}-${n}`, turn: state.turn, next: state, kit, item, line: { text: out.reply, parts: out.guard.parts } });
      if (card && out.reply.includes(card.slice(0, 30)) && refused) bad.push(`${tag}: the card said, its page refused | ${out.reply.slice(-140)}`);
      if (!out.reply.includes(card.slice(0, 30)) && !out.guard.cardPageDropped) bad.push(`${tag}: the card left out with no log`);
    }
    assert.deepEqual(bad, []);
  });

  // F1 — frames: no fragments or stray tokens, no echoed English answer, no praise or aside beside a wrong verdict, no invented method
  const FRAG_ROWS = [["steady", "c4", 52], ["offtopic", "c4", 58], ["steady", "c5-t01", 80], ["offtopic", "c5-t02", 42], ["stuck", "c6", 18]];
  const METHOD_ROWS = [["steady", "c6", 64], ["offtopic", "c4", 62], ["stuck", "c4", 28]];
  const FRAME_OK = /^(?:Haan, sahi hai|Bilkul sahi|Achha|Theek hai|Okay|Alright|Phir se dekho:|Ek baar aur dekho:|Sawaal yeh hai:|Dhyan se dekho:)[.!]?$/i;
  test("F1 predicate: no fragment, stray token or echoed English answer (judges' 5 rows)", async () => {
    const bad = [];
    for (const [persona, topic, n] of FRAG_ROWS) {
      const { out } = await at(persona, topic, n);
      const tag = `${persona} ${topic} row ${n}`;
      if (/[—–]\s*,/.test(out.reply)) bad.push(`${tag}: "—," | ${out.reply.slice(0, 100)}`);
      if (/\b(?:the|a|an)\s+\d+(?:st|nd|rd|th)\b/i.test(out.reply)) bad.push(`${tag}: their English answer echoed | ${out.reply.slice(0, 100)}`);
      const short = sentences(out.reply).filter((x) => x.split(/\s+/).length <= 2 && !FRAME_OK.test(x));
      if (short.length) bad.push(`${tag}: fragment ${JSON.stringify(short)} | ${out.reply.slice(0, 120)}`);
    }
    assert.deepEqual(bad, []);
  });
  test("F1 predicate: no praise, \"Wah\" or aside beside a wrong verdict (c6 offtopic 40)", async () => {
    const { out } = await at("offtopic", "c6", 40);
    assert.doesNotMatch(out.reply, /(?<![\p{L}])(?:wah|waah|shabash|zabardast|kamaal|bahut badhiya|cricket|sixer|virat)(?![\p{L}])/iu, out.reply);
  });
  test("F1 predicate: never a method of theirs they did not say — a \"Tumne …\" line uses only their words (judges' 3 rows)", async () => {
    const bad = [];
    const STOPM = new Set(["tumne", "tumhara", "tumhari", "tumhe", "bataya", "batayi", "kaha", "socha", "tareeka", "tarika", "achha", "theek", "haan", "sahi", "yahan", "isliye", "pehle", "phir", "kaise", "jaana"]);
    for (const [persona, topic, n] of METHOD_ROWS) {
      const { out, last } = await at(persona, topic, n);
      const theirs = (String(last.child).toLowerCase().match(/\p{L}{3,}/gu) ?? []).map((w) => w.slice(0, 4));
      for (const x of sentences(out.reply).filter((y) => /(?<![\p{L}])(?:tumne|tumhara|tumhari)(?![\p{L}])/iu.test(y))) {
        const extra = (x.toLowerCase().match(/\p{L}{4,}/gu) ?? []).filter((w) => !STOPM.has(w) && !theirs.includes(w.slice(0, 4)));
        if (extra.length) bad.push(`${persona} ${topic} row ${n}: "${x}" adds ${extra.join(", ")} (they said "${last.child}")`);
      }
    }
    assert.deepEqual(bad, []);
  });
  // F1 — every code frame has several forms, none said twice within 4 of her turns; the two probe acks are gone;
  // "Is sawaal ka jawab" for the card just answered or given up
  const FRAMES = [/Nahi, yeh jawab nahi hai\./, /Phir se dekho:/, /Theek, yeh tumhari soch thi|Achha, tumne apna tareeka bataya/];
  async function frameFaults(persona, topic) {
    const T = TOPIC[topic];
    setScriptForTest(T, runScriptOf(RUN, T));
    const { kit, rows, plans } = await replay(RUN, persona, T, 1e9);
    const bad = [], said = [];
    for (const pl of plans) {
      const n = pl.row - 1;
      if (!rows[n]) continue;
      replyDeps.chat = async () => ({ text: rows[n].text });
      const recent = said.slice(-4).map((t) => ({ who: "teacher", text: t }));
      const st = { ...pl.state, recent: [...(pl.state.recent ?? []).filter((x) => x.who !== "teacher").slice(-4), ...recent] };
      const out = await textReply({ instructions: instructionsFor(st, kit), state: st, kit, childText: pl.child, history: [], ui: pl.p.r.ui, module: null });
      const r = out.reply;
      if (FRAMES[2].test(r)) bad.push(`row ${n}: a deleted probe ack | ${r.slice(0, 80)}`);
      for (const f of FRAMES.slice(0, 2)) if (f.test(r) && said.slice(-4).some((t) => f.test(t))) bad.push(`row ${n}: "${f.source}" again within 4 turns`);
      if (/Pichhle sawaal ka (?:sahi )?jawab/.test(r) && pl.state.lastMove?.gave && !pl.state.lastMove?.closed) bad.push(`row ${n}: the card just given up called "Pichhle sawaal" | ${r.slice(0, 80)}`);
      said.push(r);
    }
    return bad;
  }
  for (const persona of ["offtopic", "steering", "steady", "stuck"]) for (const topic of Object.keys(TOPIC)) {
    test(`F1 predicate: frames vary, the deleted acks are gone, "Is sawaal ka jawab" for the card just given up (${persona} ${topic})`, async () => {
      assert.deepEqual(await frameFaults(persona, topic), []);
    });
  }

  // F2 — no first-person taste or experience claims; asked directly, she answers honestly as an AI and turns it back to them
  const TASTE = /(?<![\p{L}])(?:mujhe\s+(?:bhi\s+)?(?:\p{L}+\s+){0,3}(?:pasand|achha\s+lagta|achhi\s+lagti|bahut\s+achha)|mera\s+(?:favourite|pasandida)|meri\s+(?:favourite|pasand)|main\s+(?:bhi\s+)?(?:khelti|dekhti|khela|dekha)|i\s+(?:also\s+)?(?:like|love|enjoy)|my\s+favou?rite)(?![\p{L}])/iu;
  const DENIES_AI = /(?<![\p{L}])(?:main\s+(?:ek\s+)?(?:insaan|human|asli)|main\s+ai\s+nahi|i\s+am\s+(?:a\s+)?(?:human|real\s+person)|i'?m\s+not\s+an?\s+ai)(?![\p{L}])/iu;
  async function personaFaults(persona, topic) {
    const T = TOPIC[topic];
    setScriptForTest(T, runScriptOf(RUN, T));
    const { kit, rows, plans } = await replay(RUN, persona, T, 1e9);
    const bad = [];
    for (const pl of plans) {
      const n = pl.row - 1;
      if (!rows[n]) continue;
      const r0 = pl.state.lastMove?.returned;
      // (the H2″ retry is answered with a taste claim, the shape director13's drafts had)
      replyDeps.chat = async (_d, msgs) => (/^You are a warm teacher/.test(msgs?.[0]?.content ?? "") && r0 ? { text: `Mujhe bhi ${r0.topic} bahut pasand hai!` } : { text: rows[n].text });
      const out = await textReply({ instructions: instructionsFor(pl.state, kit), state: pl.state, kit, childText: pl.child, history: [], ui: pl.p.r.ui, module: null });
      if (TASTE.test(out.reply)) bad.push(`row ${n}: a taste claim | ${out.reply.slice(0, 140)}`);
      if (DENIES_AI.test(out.reply)) bad.push(`row ${n}: denies being an AI | ${out.reply.slice(0, 140)}`);
      if (r0 && /(?:aapko|tumhe|aap)\b.*\bpasand|do you like|your favou?rite/i.test(r0.said ?? "") && !/\bAI\b/.test(out.reply)) bad.push(`row ${n}: asked her taste ("${r0.said}"), no honest AI answer | ${out.reply.slice(0, 140)}`);
    }
    return bad;
  }
  for (const persona of ["offtopic", "steering", "steady", "stuck"]) for (const topic of Object.keys(TOPIC)) {
    test(`F2 predicate: no first-person taste claim, never a denial of being an AI, an honest answer when asked (${persona} ${topic})`, async () => {
      assert.deepEqual(await personaFaults(persona, topic), []);
    });
  }

  // B1 — no beatless model turns: a move with no card is the walk's own beat (its authored simpler), and asks no question of hers
  test("B1 predicate: a turn between cards says the walk beat's authored simpler, gives away no key and asks no question (c5-t02 offtopic 4, 34)", async () => {
    const bad = [];
    for (const n of [4, 34]) {
      const { out, last } = await at("offtopic", "c5-t02", n);
      const lm = last.state.lastMove ?? {};
      if (!lm.scriptBeat?.beatId || !lm.beatless) bad.push(`row ${n}: no beat of the walk on the move`);
      if (/[?？]/.test(out.reply)) bad.push(`row ${n}: a question with no card | ${out.reply}`);
      if (/3 tukdon ka tukda bada|kaunsa bhinn bada/i.test(out.reply)) bad.push(`row ${n}: the worked step's key | ${out.reply}`);
    }
    assert.deepEqual(bad, []);
  });
  const CHECKINS = new Set([...BEAT_ASK.hinglish, ...WORKED_ASK.hinglish, ...BEAT_ASK.english, ...WORKED_ASK.english]);
  async function cardlessQuestions(persona, topic) {
    const T = TOPIC[topic];
    setScriptForTest(T, runScriptOf(RUN, T));
    const { kit, rows, plans } = await replay(RUN, persona, T, 1e9);
    const bad = [];
    for (const pl of plans) {
      const n = pl.row - 1;
      // (a worked example's own authored question is code's: W1 poses it before "Diya hai")
      if (!rows[n] || pl.p.r.ui?.ask || pl.state.lastMove?.kind === "wrap" || pl.state.lastMove?.kind === "worked_example" || /^worked/.test(pl.state.lastMove?.scriptBeat?.beatId ?? "")) continue;
      replyDeps.chat = async () => ({ text: rows[n].text });
      const out = await textReply({ instructions: instructionsFor(pl.state, kit), state: pl.state, kit, childText: pl.child, history: [], ui: pl.p.r.ui, module: null });
      const qs = sentences(out.reply).filter((x) => /[?？]/.test(x) && !CHECKINS.has(x));
      if (qs.length && pl.state.lastMove?.scriptBeat) bad.push(`row ${n} (${pl.state.lastMove?.kind}): ${qs.join(" ")}`);
    }
    return bad;
  }
  for (const persona of ["offtopic", "steering", "steady", "stuck"]) for (const topic of Object.keys(TOPIC)) {
    test(`B1 predicate: no question of hers on a scripted turn with no card (${persona} ${topic})`, async () => {
      assert.deepEqual(await cardlessQuestions(persona, topic), []);
    });
  }

  // K2 — help and pace. These change the walk, so the replay walks it live (recordedRun off: tests/fixtures/replay.mjs)
  const atLive = async (persona, topic, n, opts = {}) => {
    const T = TOPIC[topic];
    const sc = runScriptOf(RUN, T); delete sc.recordedRun;
    setScriptForTest(T, sc);
    const { kit, rows, last } = await replay(RUN, persona, T, n + 1);
    const state = opts.lastMove ? { ...last.state, lastMove: { ...last.state.lastMove, ...opts.lastMove } } : last.state;
    replyDeps.chat = async () => ({ text: rows[n].text });
    const out = await textReply({ instructions: instructionsFor(state, kit), state, kit, childText: last.child, history: [], ui: last.p.r.ui, module: null, ...(opts.verdict ? { verdict: opts.verdict } : {}) });
    return { out, last, state };
  };
  test("K2 predicate: a then-card's second miss gives its key and why (c6 stuck 52, c5-t01 stuck 44)", async () => {
    for (const [persona, topic, n] of [["stuck", "c6", 52], ["stuck", "c5-t01", 44]]) {
      const { out, last } = await atLive(persona, topic, n);
      assert.match(String(last.before.activeItemId), /:then:/, `${persona} ${topic} row ${n}: a then-card`);
      assert.ok(last.state.lastMove?.gave?.answer, `${persona} ${topic} row ${n}: the key given | ${out.reply.slice(0, 120)}`);
      assert.match(out.reply, /Is sawaal ka (?:sahi )?jawab/, out.reply);
    }
  });
  test("K2 predicate: a remediation said once in the lesson is never said again on another card (c5-t02 stuck 24, 38; c6 offtopic 18, 58)", async () => {
    for (const [persona, topic, n, said] of [["stuck", "c5-t02", 24, /8 bada number hai, par 1\/8 chhota hissa hai/], ["stuck", "c5-t02", 38, /8 bada number hai, par 1\/8 chhota hissa hai/],
      ["offtopic", "c6", 18, /har bhuja ka naam aur lambai bolo/], ["offtopic", "c6", 58, /Kinaare par dhaaga lapeto/]]) {
      const { out } = await atLive(persona, topic, n);
      assert.doesNotMatch(out.reply, said, `${persona} ${topic} row ${n}: ${out.reply.slice(0, 160)}`);
    }
  });
  test("K2 predicate: 'pata nahi' gets the card's own simpler or point, never a remediation (c4 stuck 10)", async () => {
    const { out } = await atLive("stuck", "c4", 10);
    assert.doesNotMatch(out.reply, /Bache hue tukde neeche kabhi nahi aate/, out.reply);
  });
  test("K2 predicate: a simpler on a live card re-poses it in the same turn, never 'Ab isi par ek sawaal' and a wait (c4 steady 8, offtopic 26, steering 30)", async () => {
    for (const [persona, n] of [["steady", 8], ["offtopic", 26], ["steering", 30]]) {
      const { out, last } = await atLive(persona, "c4", n);
      assert.ok(!last.state.lastMove?.splitTeach && last.p.r.ui?.ask, `${persona} c4 row ${n}: split`);
      assert.doesNotMatch(out.reply, /Ab (?:isi|is) par ek (?:chhota )?sawaal/, out.reply);
      assert.match(out.reply, /\?$/, out.reply);
    }
  });
  test("K2 predicate: 'woh wala ho gaya, aage chalo' to a why-probe moves on, never a stop menu (c5-t02 steady 54)", async () => {
    const { out, last } = await atLive("steady", "c5-t02", 54);
    assert.equal(last.state.lastMove?.request, "move_on");
    assert.notEqual(last.state.lastMove?.kind, "break");
    assert.doesNotMatch(out.reply, /chunein|band karein/i, out.reply);
  });
  test("K2 predicate: a break she was not asked for teaches nothing and asks no lesson question (c4 stuck 46's line)", async () => {
    // (row 46's own draft is that break line: "Nahi, kyunki teenon tukde barabar nahi hain … Ab batao: aadha kab hota hai?")
    const { out } = await at("stuck", "c4", 46, { lastMove: { kind: "break", request: undefined } });
    assert.doesNotMatch(out.reply, /aadha kab hota hai|teenon tukde/, out.reply);
  });

  // A1 — asides: no canned fact about an aside on any turn; an aside unreturned by its card's close comes back, at a break at latest
  test("A1 predicate: no canned fact about an aside on any turn (c5-t02 steady 46, 50; c6 offtopic 8; c6 stuck 38)", async () => {
    const bad = [];
    for (const [persona, topic, n] of [["steady", "c5-t02", 46], ["steady", "c5-t02", 50], ["offtopic", "c6", 8], ["stuck", "c6", 38]]) {
      const { out } = await at(persona, topic, n);
      if (/mashhoor|cover drive/i.test(out.reply)) bad.push(`${persona} ${topic} row ${n}: ${out.reply.slice(0, 160)}`);
    }
    assert.deepEqual(bad, []);
  });
  for (const persona of ["offtopic", "steering", "steady", "stuck"]) for (const topic of Object.keys(TOPIC)) {
    test(`A1 predicate: every aside parked is returned by the lesson's end (${persona} ${topic})`, async () => {
      const T = TOPIC[topic];
      const sc = runScriptOf(RUN, T); delete sc.recordedRun;
      setScriptForTest(T, sc);
      const { plans } = await replay(RUN, persona, T, 1e9);
      const end = plans.at(-1).state;
      const open = (end.later ?? []).filter((e) => e.share && e.parkSaid && !e.servedAt);
      // (the lesson's own end returns them at the wrap; a lesson the replay stops mid-walk counts only asides older than 12 turns)
      const stale = open.filter((e) => end.turn - e.at > 12 && end.lastMove?.kind !== "wrap");
      assert.deepEqual(stale.map((e) => `${e.topic} parked at ${e.at}, open at ${end.turn}`), []);
    });
  }
  test("A1 predicate: a break returns an aside still open", async () => {
    const T = TOPIC["c5-t01"];
    const sc = runScriptOf(RUN, T); delete sc.recordedRun;
    setScriptForTest(T, sc);
    const { kit, last } = await replay(RUN, "stuck", T, 37);
    const e = (last.state.later ?? []).find((x) => x.share && x.parkSaid && !x.servedAt);
    assert.ok(e, "an aside open at row 36");
    const { step } = await import("../server/director/state.js");
    const r = step({ ...last.state }, { event: "turn", kit, cls: { outcome: "no_evidence", confidence: 0.9, flags: {}, request: { type: "break" } }, text: "thak gayi, thoda break", now: 9_000_000 });
    assert.equal(r.move.kind, "break");
    assert.equal(r.move.returned?.topic, e.topic, JSON.stringify(r.move).slice(0, 200));
  });

  // Harness
  test("harness: the picture checker reads Studio's unrolled view (a shape's sides laid on a line)", () => {
    const rect = { template: "measured@1", params: { shape: "rectangle" } };
    const said = "Screen par dekho: yeh rekha chaaron bhujayein ek seedh mein hai.";
    assert.deepEqual(pictureMismatch(said, rect, { view: "unrolled" }), []);
  });
});
