// round 7 contracts (PIPELINE.md §O "contracts first"): the steer row, the Later list and the conversational moment are
// typed in shared/contracts.ts; the server reads every SteerId the App can send (server/director/steer.js), a steer chip is
// never graded, and a mapped one is the same request the child's words make.
import { test } from "node:test";
import assert from "node:assert/strict";
import { STEER_IDS } from "../shared/contracts.ts";
import { isSteerChip, steerRequest, laterChipId } from "../server/director/steer.js";
import { classifyFast } from "../server/director/classify.js";
import { initLessonState, step } from "../server/director/state.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const PENDING = new Set(["steer:wrap2"]); // decision D5 "wrap up in 2": the move lands with PIPELINE A9

test("every SteerId in the contract is read by the server; each mapped one is a whole request", () => {
  for (const id of STEER_IDS) {
    assert.ok(isSteerChip(id), id);
    const r = steerRequest(id);
    if (PENDING.has(id)) { assert.equal(r, null, id); continue; }
    assert.ok(r && typeof r.type === "string" && r.whole === true, id);
  }
  assert.equal(isSteerChip("req:story"), false);
  assert.equal(steerRequest("steer:nonsense"), null);
});

test("a later chip names its entry; anything else is not one", () => {
  assert.equal(laterChipId("later:p12"), "p12");
  for (const x of ["later:", "later:a b", "stop:end", null, undefined]) assert.equal(laterChipId(x), null, String(x));
});

test("a steer chip is never graded: no evidence, with the request it maps to", () => {
  const target = { mode: "item", item: { id: "x", answer: "4", prompt_en: "2 + 2?" }, answer: "4" };
  for (const id of STEER_IDS) {
    const r = classifyFast({ target, childText: "", chipId: id });
    const res = r?.result ?? r;
    assert.equal(res.outcome, "no_evidence", id);
    if (!PENDING.has(id)) assert.equal(res.request?.type, steerRequest(id).type, id);
  }
});

test("'steer:slower' while she teaches is the same re-explain the words 'slowly please' get (the teach step stays)", () => {
  const K = kit();
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX }, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });
  for (let i = 0; i < 2; i++) r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), now: (r.state.turn + 1) * 20_000 });
  assert.equal(r.state.phase, "teach");
  const idx = r.state.teachIdx;
  const s = step(r.state, { event: "turn", kit: K, cls: { ...cls("no_evidence"), source: "chip", request: steerRequest("steer:slower") }, chipId: "steer:slower", now: 99_000 });
  assert.equal(s.move.kind, "reteach");
  assert.match(s.move.shape, /slow down/);
  assert.equal(s.state.teachIdx, idx);
});
