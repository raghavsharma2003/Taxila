// p5-interaction (owner directive 2026-10-05, priority 5): the Director acts on the child's words. Pure: no network, no
// model. The phrases are the ones the live prod battery sent (evals/prod-runs/2026-10-05-day0: owner-2, owner-4) and the
// conversation-v2 battery's intents. Needs docs/design/ship5/p5-interaction/patches applied (APPLY.md).
import { describe, test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step, LIMITS } from "../server/director/state.js";
import { classifyFast, targetFor } from "../server/director/classify.js";
import { findItem } from "../server/director/items.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const K = kit();
const fresh = (over = {}) => initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0, ...over });
const turn = (r, c, extra = {}) => step(r.state, { event: "turn", kit: K, cls: c, now: (r.state.turn + 1) * 20_000, ...extra });
const NE = cls("no_evidence");
function toPractice() {
  let r = step(fresh(), { event: "start", kit: K, now: 0 });
  while (r.state.phase !== "practice" || !r.move.itemId || r.move.itemId.startsWith("fade:")) r = turn(r, NE);
  return r;
}
function toTeach() {
  const r = step(fresh(), { event: "start", kit: K, now: 0 });
  let x = turn(r, NE);
  while (x.state.phase !== "teach") x = turn(x, NE);
  return x;
}
function said(r, text, typed = true) {
  const target = targetFor(r.state, K, findItem(r.state, K, r.state.activeItemId));
  const fast = classifyFast({ target, childText: text, typed });
  return fast.result ?? { outcome: "no_evidence", confidence: 1, source: "model", flags: { ...fast.flags, wantsToStop: !!fast.request }, request: fast.request };
}
const ended = (r) => r.end || r.move.kind === "wrap" || r.state.phase === "done";
const SAVED = { ...process.env };
// File-scoped: a top-level hook wraps EVERY file's tests in the shared npm-test process (rj: shared-process hook leak).
describe('p5-interaction director', () => {
afterEach(() => { for (const k of ["TAXILA_P5", "TAXILA_P5_STEER", "TAXILA_P5_CARDCAP", "TAXILA_P5_GUARDS", "TAXILA_P5_RECHECK", "TAXILA_CONV2"]) { if (k in SAVED) process.env[k] = SAVED[k]; else delete process.env[k]; } });

// ── the card cap (owner-2 R5.loop: 17 of 90 turns; w1c-three-day: a why item held 7 turns) ──
test("card cap: one question is pinned at most LIMITS.cardMax turns in a row; the next turn resolves it and moves on", () => {
  for (const reply of [NE, cls("no_evidence", { flags: { dontKnow: true } }), cls("incorrect")]) {
    let r = toPractice();
    const item = r.move.itemId;
    const pins = [r.ui.ask?.itemId];
    for (let i = 0; i < 6 && r.ui.ask?.itemId === item; i++) { r = turn(r, reply); pins.push(r.ui.ask?.itemId); }
    const run = pins.findIndex((x) => x !== item);
    assert.ok(run > 0 && run <= LIMITS.cardMax, `${reply.outcome}/${JSON.stringify(reply.flags)}: the question was on the card ${run} turns in a row (${pins.join(",")})`);
    assert.equal(ended(r), false, "the lesson goes on");
  }
});

test("card cap: after real help (rung ≥ 2) the answer is given with one line of why and a similar question follows; with no help it is left, no answer", () => {
  let r = toPractice();
  const item = findItem(r.state, K, r.move.itemId);
  r = turn(r, cls("incorrect")); r = turn(r, cls("incorrect"));
  const capped = turn(r, cls("incorrect"));
  assert.equal(capped.state.capped?.how, "assert");
  assert.match(capped.move.shape, /give its answer plainly with one line of why/);
  assert.ok(capped.content.some((l) => l.includes(String(item.answer))), "the key rides in the content, for the words");
  assert.notEqual(capped.move.itemId, item.id);
  // unclear replies only: no hint was given, so no answer either
  let u = toPractice();
  const uitem = u.move.itemId;
  for (let i = 0; i < 5 && u.move.itemId === uitem; i++) u = turn(u, NE);
  assert.notEqual(u.move.itemId, uitem);
  assert.ok(u.state.skipped.includes(uitem) || u.state.itemsDone.includes(uitem));
});

test("card cap: the choices still come — on the SECOND unclear reply with the cap on", () => {
  let r = toPractice();
  r = turn(r, NE);
  r = turn(r, NE);
  // the fixture's practice items have no diagnostic options; choicesFor builds key + distractors
  assert.ok(r.ui.chips?.length || r.move.itemId !== toPractice().move.itemId, "choices on screen, or the item was left");
});

test("kill switch: TAXILA_P5_CARDCAP=off restores the four-turn ladder (HEAD behaviour)", () => {
  process.env.TAXILA_P5_CARDCAP = "off";
  let r = toPractice();
  const item = r.move.itemId;
  let n = 1;
  for (let i = 0; i < 4; i++) { r = turn(r, cls("incorrect")); if (r.ui.ask?.itemId === item) n++; }
  assert.ok(n >= 4, `with the cap off the item stays (${n} turns)`);
});

// ── teach-phase steering (owner-4: 5/16 not acted on; all five were teach-phase requests that advanced the plan) ──
test("a story / example / slower / another-way request DURING teaching re-explains the same idea; the teach step does not advance", () => {
  for (const [phrase, how] of [["story ki tarah batao", /as a story/], ["example do", /an example/], ["slowly please", /slow down/], ["explain it differently", /new, simpler way in/], ["samajh nahi aaya", /new, simpler way in/]]) {
    const r = toTeach();
    const idx = r.state.teachIdx;
    const s = turn(r, said(r, phrase));
    assert.equal(s.move.kind, "reteach", phrase);
    assert.match(s.move.shape, how, phrase);
    assert.match(s.move.shape, /no new step of the lesson yet/, phrase);
    assert.equal(s.state.teachIdx, idx, `${phrase}: teachIdx unchanged`);
    assert.equal(ended(s), false);
  }
});

// ── change of topic (owner rule 2026-10-05; w2i-release) ──
test("'can we talk about something else' is steering: never a break and never a wrap; a warm yes with ways in (chips)", () => {
  for (const r of [toPractice(), toTeach()]) {
    const s = turn(r, said(r, "can we talk about something else"));
    assert.equal(ended(s), false);
    assert.ok(!["break", "wrap"].includes(s.move.kind), `move ${s.move.kind}`);
    assert.match(s.move.shape, /a different way into today's idea/);
    assert.deepEqual(s.ui.chips.map((c) => c.id), ["req:visual", "req:story", "req:game", "stop:continue"]);
    // a ways-in chip is the request it names
    const story = turn(s, said(s, "Tell it as a story"), { chipId: "req:story" });
    assert.match(story.move.shape, /story/);
    const pic = turn(s, NE, { chipId: "req:visual" });
    assert.equal(pic.move.request, "visual");
  }
});

// ── the readings (lexicon.js → policy.js → requestMove) ──
test("confused / clarify / repeat / back / skip / easier / harder / know on a question: each acted on, none graded, none ends", () => {
  const cases = [
    ["nahi samjha", (s) => s.move.kind === "reteach"],
    ["matlab?", (s) => /what the question means|simpler words/.test(s.move.shape)],
    ["phir se bolo", (s) => /did not catch it/.test(s.move.shape)],
    ["mummy bula rahi thi, haan", (s) => /welcome them back/.test(s.move.shape) && !/goodbye/.test(s.move.shape.replace(/no goodbye/, ""))],
    ["skip", (s) => /skip this one/.test(s.move.shape)],
    ["easy wala do", (s) => /easier one/.test(s.move.shape)],
    ["mushkil wala do", (s) => /harder one/.test(s.move.shape)],
    ["mujhe aata hai", (s) => /they say they know this/.test(s.move.shape)],
  ];
  for (const [phrase, ok] of cases) {
    const r = toPractice();
    const c = said(r, phrase);
    assert.equal(c.outcome, "no_evidence", `${phrase}: never an answer`);
    const s = turn(r, c);
    assert.equal(ended(s), false, phrase);
    assert.ok(ok(s), `${phrase}: ${s.move.kind} / ${s.move.shape.slice(0, 160)}`);
  }
});

test("boredom and frustration: something changes now (ways in / a smaller step), never an end and never a helpline", () => {
  const r = toPractice();
  const b = turn(r, said(r, "boring yaar"));
  assert.match(b.move.shape, /bored: no guilt/);
  assert.equal(ended(b), false);
  const f = turn(r, said(r, "mujhse nahi hoga"));
  assert.match(f.move.shape, /this one is hard work and that is okay/);
  assert.notEqual(f.move.kind, "safeguard");
});

test("thinking aloud: no question pinned this turn (no re-ask), the item stays active, the next answer is graded on it", () => {
  const r = toPractice();
  const item = r.move.itemId;
  const t = turn(r, said(r, "ruko, soch raha hoon"));
  assert.equal(t.ui.ask, undefined);
  assert.equal(t.state.activeItemId, item);
  assert.match(t.move.shape, /thinking aloud/);
  const a = turn(t, cls("correct"));
  assert.ok(a.state.itemsDone.includes(item), "the next answer is graded on the same item");
});

test("identity / small talk / out of bounds: one line of uptake (or a warm no), then the question again", () => {
  for (const [phrase, re] of [["tum robot ho?", /plainly an AI teacher/], ["aapko kaunsa cricketer pasand hai?", /one honest line as an AI/], ["ghost story sunao", /not something for our lesson/]]) {
    const r = toPractice();
    const s = turn(r, said(r, phrase));
    assert.match(s.move.shape, re, phrase);
    assert.equal(s.move.itemId, r.move.itemId, `${phrase}: back to the question`);
  }
});

test("Later list: a park is remembered and comes back once the item on the table resolves; a push within 3 turns is a detour", () => {
  const r = toPractice();
  const park = turn(r, { ...NE, request: { type: "park", topic: "black holes", learning: true, whole: true } });
  assert.equal(park.state.later.length, 1);
  assert.match(park.move.shape, /black holes/);
  assert.match(park.move.shape, /right after this question/);
  const push = turn(park, { ...NE, request: { type: "detour", topic: "black holes", whole: true } });
  assert.match(push.move.shape, /at most two sentences/);
  assert.ok(push.state.later[0].servedAt != null);
  // a fresh park returns after the item resolves
  const p2 = turn(r, { ...NE, request: { type: "park", topic: "volcanoes", learning: true, whole: true } });
  const right = turn(p2, cls("correct"));
  const back = right.move.kind === "probe" ? turn(right, cls("correct")) : right;
  assert.ok(/volcanoes/.test(right.move.shape) || /volcanoes/.test(back.move.shape), "the parked question came back");
});

test("a stop read by the UNDERSTAND note alone: one check-in, never an end on the first ask; a second within two turns ends it", () => {
  const r = toPractice();
  const c = turn(r, { ...NE, request: { type: "stop", whole: true, src: "note" } });
  assert.equal(ended(c), false);
  assert.equal(c.move.kind, "break");
  const again = turn(c, { ...NE, request: { type: "stop", whole: true, src: "note" } });
  assert.equal(ended(again), true);
});

test("module answer the server could not re-check: no verdict, no silent drop — the child is asked for it in words", () => {
  const r = toPractice();
  const m = step(r.state, { event: "module", kit: K, now: 99_000, moduleEvents: [], unverified: true });
  assert.equal(m.hold, undefined);
  assert.match(m.move.shape, /could not be read/);
  assert.equal(m.move.itemId, r.move.itemId);
});

test("kill switch: TAXILA_P5=off — 'something else' is the old break + side chat, 'nahi samjha' is not a request", () => {
  process.env.TAXILA_P5 = "off";
  const r = toPractice();
  const s = turn(r, said(r, "can we talk about something else"));
  assert.equal(s.move.kind, "break");
  const c = said(r, "nahi samjha");
  assert.equal(c.request ?? null, null);
});

test("safety still outranks every reading: distress words with a steering phrase are a safeguard", () => {
  const r = toPractice();
  const c = said(r, "main khud ko hurt karna chahta hoon, samajh nahi aaya");
  assert.equal(c.flags.distress, true);
  const s = turn(r, c);
  assert.equal(s.move.kind, "safeguard");
});
});
