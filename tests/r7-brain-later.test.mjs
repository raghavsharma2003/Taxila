// round 7 A7 (PIPELINE §A Brain item 6): the Later list on the screen (ui.later), the turn's moment (ui.moment), a tap on a
// Later entry as "talk about it now", and her own promise kept so it comes back before the wrap. Pure.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { classifyFast, targetFor } from "../server/director/classify.js";
import { findItem } from "../server/director/items.js";
import { laterUi, momentOf, keepPromise, promisesLater } from "../server/director/later.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";
// round 7 (main 2026-11-04): these tests are the NEW behaviour, so they clear the kill switches they depend on and restore them
// after (`npm test` runs every file in one process; an earlier file must never decide which path they test)
const R7_FLAGS = ["TAXILA_R7_PARK_TOPIC", "TAXILA_R7_BYE_CHECKIN", "TAXILA_R7_FRUSTRATION"];
const R7_KEEP = {};
describe("r7-brain-later.test.mjs: round 7 behaviour (kill switches cleared)", () => {
beforeEach(() => { for (const k of R7_FLAGS) { R7_KEEP[k] = process.env[k]; delete process.env[k]; } });
afterEach(() => { for (const k of R7_FLAGS) { if (R7_KEEP[k] === undefined) delete process.env[k]; else process.env[k] = R7_KEEP[k]; } });

const K = kit();
const NE = cls("no_evidence");
const start = () => step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX }, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });
const turn = (r, c = NE, extra = {}) => step(r.state, { event: "turn", kit: K, cls: c, text: "x", now: (r.state.turn + 1) * 20_000, ...extra });
const park = (topic) => ({ ...NE, source: "note", request: { type: "park", topic, learning: true, whole: true, src: "note" } });

test("laterUi: open, due at its boundary or the wrap, returned for a couple of turns, then gone", () => {
  const L = [{ id: "p3", topic: "cricket ka score", learning: false, at: 3, promise: "at_end" },
    { id: "p4", topic: "kya sun garam hai", learning: true, at: 4, promise: "after_question" },
    { id: "p1", topic: "purani baat", learning: true, at: 1, promise: "at_end", servedAt: 2 }];
  const rows = laterUi(L, { turn: 5, itemOnTable: true });
  assert.deepEqual(rows.map((r) => [r.id, r.status]), [["p3", "open"], ["p4", "open"]]);
  assert.equal(laterUi(L, { turn: 5, itemOnTable: false }).find((r) => r.id === "p4").status, "due");
  assert.ok(laterUi(L, { turn: 5, wrapping: true }).every((r) => r.status === "due"));
  assert.equal(laterUi(L, { turn: 3 }).find((r) => r.id === "p1").status, "returned");
  assert.equal(laterUi([], {}), null);
});

test("a parked question shows on the screen with a park moment", () => {
  let r = start();
  for (let i = 0; i < 2; i++) r = turn(r);
  r = turn(r, park("cricket ka world cup"));
  const e = r.ui.later?.find((x) => /cricket/.test(x.text));
  assert.ok(e, JSON.stringify(r.ui.later));
  assert.equal(r.ui.moment?.kind, "park");
  assert.equal(r.ui.moment.laterId, e.id);
});

test("a tap on the Later entry is 'talk about it now': served, never graded, a returned moment", () => {
  let r = start();
  for (let i = 0; i < 2; i++) r = turn(r);
  r = turn(r, park("cricket ka world cup"));
  const id = r.ui.later[0].id;
  const item = r.state.activeItemId ? findItem(r.state, K, r.state.activeItemId) : null;
  const c = classifyFast({ target: targetFor(r.state, K, item), childText: "", chipId: `later:${id}` });
  const res = c.result ?? c;
  assert.equal(res.outcome, "no_evidence");
  assert.deepEqual(res.request, { type: "later", id, whole: true, src: "later" });
  const t = turn(r, res, { chipId: `later:${id}` });
  assert.match(t.move.shape, /come back to what they asked earlier \(cricket ka world cup\)/);
  assert.equal(t.ui.moment?.kind, "returned");
  assert.equal(t.ui.later.find((x) => x.id === id).status, "returned");
});

test("momentOf: decline and stop check-in", () => {
  assert.deepEqual(momentOf([], [], { request: "decline" }), { kind: "decline" });
  assert.deepEqual(momentOf([], [], { checkin: "stop", request: "stop" }), { kind: "stop_check" });
  assert.equal(momentOf([], [], { kind: "explain" }), null);
});

test("her own promise is kept: parked from the child's topic, once, never on a safeguard turn", () => {
  assert.equal(promisesLater("Cricket ki baat hum baad mein karenge, pehle ye sawaal."), true);
  assert.equal(promisesLater("We will come back to that at the end."), true);
  assert.equal(promisesLater("Ab agla step dekhte hain."), false);
  const L = keepPromise([], { reply: "Cricket ki baat hum baad mein karenge.", turn: 6, topic: null, childText: "cricket ke baare mein baat karein?" });
  assert.equal(L.length, 1);
  assert.equal(L[0].fromHer, true);
  assert.equal(L[0].promise, "at_end");
  assert.equal(keepPromise(L, { reply: "Cricket ki baat baad mein karenge.", turn: 7, childText: "cricket ke baare mein baat karein?" }).length, 1, "no duplicate");
  assert.equal(keepPromise([], { reply: "Baad mein baat karenge.", turn: 6, childText: "x y z", safeguard: true }).length, 0);
  const parkedNow = [{ id: "p6", topic: "cricket", at: 6, promise: "at_end" }];
  assert.equal(keepPromise(parkedNow, { reply: "Baad mein baat karenge.", turn: 6, childText: "kuch aur" }), parkedNow, "the Director parked this turn");
});
});
