// round 5 (14.2, main safety review; QA pass 11, n=3): after a safeguarding incident the next lesson opened straight into
// teaching. A start within hours of one (the route reads incident, `carried`) opens on a calm check-in: the helplines on
// the board, carry-on / stop chips, a fixed line in the child's language that names nothing that was said. The child's next
// ordinary words go gently back to the lesson; distress in them is the full safeguard; the stop chip ends the lesson.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { carriedCheckInLine } from "../server/brain/say.js";
import { floorViolations } from "../server/director/safety.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const K = kit();
const start = (extra = {}, ctx = CTX) => step(initLessonState({ topicId: K.topicId, kit: K, ctx, seed: 7, now: 0 }), { event: "start", kit: K, now: 0, ...extra });
const distress = { ...cls("no_evidence"), source: "predicate", flags: { ...cls("no_evidence").flags, distress: true, distressKind: "self_harm" } };

test("a carried start opens on the check-in: safeguard move, helplines on the board, carry-on and stop chips", () => {
  const r = start({ carried: { kind: "self_harm" } });
  assert.equal(r.move.kind, "safeguard");
  assert.match(JSON.stringify(r.ui.whiteboard), /1098/);
  assert.match(JSON.stringify(r.ui.whiteboard), /14416/);
  assert.deepEqual(r.ui.chips.map((c) => c.id), ["safe:continue", "safe:stop"]);
  assert.equal(r.state.safeguard.carried, true);
  assert.equal(r.state.safeguardedAt ?? null, null, "no disclosure in THIS lesson: its memory rules are not the safeguarded ones");
  const plain = start();
  assert.notEqual(plain.move.kind, "safeguard", "no incident: the ordinary opening");
});

test("after the check-in: ordinary words go back to the lesson; distress is the full safeguard; stop ends it", () => {
  const r = start({ carried: { kind: "self_harm" } });
  const fine = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), text: "haan theek hoon, padhte hain", now: 20_000 });
  assert.notEqual(fine.move.kind, "safeguard");
  assert.equal(fine.state.safeguard, null);
  const tap = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), chipId: "safe:continue", now: 20_000 });
  assert.notEqual(tap.move.kind, "safeguard");
  const hard = step(r.state, { event: "turn", kit: K, cls: distress, text: "mujhe nahi jeena", now: 20_000 });
  assert.equal(hard.move.kind, "safeguard");
  assert.equal(hard.state.safeguard.calm, 0, "a new disclosure starts a full episode");
  const stop = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), chipId: "safe:stop", now: 20_000 });
  assert.equal(stop.move.kind, "wrap");
});

test("the fixed line: both helplines, the child's name, every language and address form, discreet, passes the floor", () => {
  for (const lang of ["english", "hinglish", "hindi"]) for (const address of ["tum", "aap"]) {
    const line = carriedCheckInLine({ lang, address, firstName: "Riya Sharma" });
    assert.match(line, /1098/, `${lang}/${address}`);
    assert.match(line, /14416/, `${lang}/${address}`);
    assert.match(line, /Riya/, "the first name");
    assert.doesNotMatch(line, /Sharma/, "never the surname");
    assert.doesNotMatch(line, /last time|before you told|you told me|pichhli|bataya tha|पिछली|बताया था/i, "names nothing that was said");
    assert.deepEqual(floorViolations(line), [], `${lang}/${address}: ${line}`);
  }
  assert.doesNotMatch(carriedCheckInLine({ lang: "hinglish" }), /\{name\}|  /, "no name: no placeholder left");
  assert.match(carriedCheckInLine({ lang: "hinglish", address: "aap" }), /sakte hain\./);
});
