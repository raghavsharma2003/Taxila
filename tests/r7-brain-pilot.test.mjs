// round 7: main's hybrid-pilot judgement (docs/design/round7/judgements/hybrid-pilot-2026-11-04.md), one test per defect on the
// exact transcript turn (evals/hybrid-side-by-side/results/2026-11-04/, c6-maths-ch06-t01, class 6, Hinglish). Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { fadeItem } from "../server/director/fading.js";
import { promptFor } from "../server/director/items.js";
import { requestOf } from "../server/director/requests.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX, cls } from "./fixtures/kit.mjs";

const RANI = kitFromFile(getTopic("c6-maths-ch06-t01"));
const NE = cls("no_evidence");
const start = (K = RANI) => step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6, ageBand: "10-15", lang: "hinglish" }, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });
const turn = (r, text, c = NE, extra = {}) => step(r.state, { event: "turn", kit: RANI, cls: c, text, now: (r.state.turn + 1) * 20_000, ...extra });
const withReq = (text) => { const q = requestOf(text); return q ? { ...NE, source: "request", request: q } : NE; };

test("#1 (offtopic t8): the faded card she speaks is whole and in the lesson language: never 'How far does…' in Hinglish", () => {
  for (let i = 0; i < RANI.workedExample.steps.length; i++) {
    const it = fadeItem(RANI, { index: i });
    if (!it) continue;
    const hi = promptFor(it, "hinglish");
    assert.doesNotMatch(hi, /\p{L}…/u, hi);
    assert.doesNotMatch(hi, /Rani runs|How far/, hi);
    assert.match(hi, /^Khaali jagah bharo: /, hi);
    assert.doesNotMatch(promptFor(it, "english"), /\p{L}…/u);
  }
});

test("#2 (offtopic t2): spoken 'kuch aur baat karte hain' is noticed and parked, never the ways-in repair", () => {
  let r = start();
  for (let i = 0; i < 2; i++) r = turn(r, "haan");
  const ask = withReq("kuch aur baat karte hain");
  assert.equal(ask.request?.type, "change_topic");
  r = turn(r, "kuch aur baat karte hain", ask);
  assert.doesNotMatch(r.move.shape, /picture, a story|different way|ways in/i, r.move.shape);
  assert.match(r.move.shape, /talk about something else: say yes warmly/);
  assert.notEqual(r.move.kind, "break");
  // what they name is parked with a promise and the lesson goes on
  const named = turn(r, "cricket world cup ke baare mein");
  assert.ok(named.state.later.some((e) => /cricket/.test(e.topic)), JSON.stringify(named.state.later));
  assert.equal(named.ui.moment?.kind, "park");
  // a filler ("achha theek hai", the pilot's next line) parks nothing and goes back
  const filler = turn(r, "achha theek hai");
  assert.equal((filler.state.later ?? []).length, 0);
  assert.match(filler.move.shape ?? "", /back to the work warmly|did not name anything/);
});

test("#2: the steer:else chip takes the same path", async () => {
  const { steerRequest } = await import("../server/director/steer.js");
  let r = start();
  for (let i = 0; i < 2; i++) r = turn(r, "haan");
  r = turn(r, "", { ...NE, source: "chip", request: steerRequest("steer:else") }, { chipId: "steer:else" });
  assert.match(r.move.shape, /talk about something else: say yes warmly/);
});

test("#3 (offtopic t10, steady t10): 'bye' gets the stop check-in first; a second stop ends it", () => {
  let r = start();
  for (let i = 0; i < 3; i++) r = turn(r, "haan");
  const bye = { ...withReq("bye"), flags: { ...NE.flags, wantsToStop: true } };
  const once = turn(r, "bye", bye);
  assert.equal(once.move.kind, "break");
  assert.equal(once.move.checkin, "stop");
  assert.equal(once.end, false);
  const twice = turn(once, "bye", bye);
  assert.equal(twice.move.kind, "wrap");
  // the stop chip on the check-in ends it at once
  assert.equal(turn(once, "", NE, { chipId: "stop:end" }).move.kind, "wrap");
});
