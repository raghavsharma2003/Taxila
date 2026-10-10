// Round 4, stream 4A (G2 Khand finding): while a play piece is up, her task words come from the piece's MODE in code. Every
// family / mode in shared/play.ts has a verb (a new family cannot ship without one), and the compile's last check uses it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { MODES } from "../shared/play.ts";
import { PLAY_ACTS, playActOf, playCheck } from "../server/director/play-verbs.js";
import { initLessonState, step } from "../server/director/state.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { kit, CTX, cls, BRIEF } from "./fixtures/kit.mjs";

test("every family / mode in shared/play.ts has its act and verbs (Khand's nazariya too)", () => {
  for (const [family, modes] of Object.entries(MODES)) for (const mode of modes) {
    const a = playActOf(family, mode);
    assert.ok(a && a.act && a.hi && a.en, `${family}/${mode} has no verb`);
  }
  for (const mode of ["views", "array", "floor", "powers", "mirror"]) assert.ok(playActOf("nazariya", mode), `nazariya/${mode}`);
});

test("a build / place / fill mode never gets a choosing verb; only a choose mode does", () => {
  for (const [family, modes] of Object.entries(PLAY_ACTS)) for (const [mode, a] of Object.entries(modes)) {
    const c = playCheck({ family, mode });
    assert.ok(c.includes(a.hi), `${family}/${mode}`);
    if (a.act === "choose") assert.doesNotMatch(c, /never a choosing verb/);
    else { assert.match(c, /never a choosing verb/); assert.doesNotMatch(a.hi, /chun/); }
  }
  assert.equal(playCheck({ family: "nope", mode: "x" }), null, "no guessed verb");
});

test("compile: with a Khand build piece up, the last check is the build verb, not the card question", () => {
  const K = kit();
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 });
  for (let i = 0; i < 6 && !r.move.itemId; i++) r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), now: (i + 1) * 20_000 });
  const st = { ...r.state, brief: BRIEF, mode: "text", playOn: { turn: r.state.turn, family: "nazariya", mode: "views" } };
  const text = instructionsFor(st, K, "text");
  assert.match(text, /ONE MORE CHECK: the game is on the screen and the question card is folded away: no card question this turn.*\(banao\)/);
  assert.doesNotMatch(text.split("ONE MORE CHECK")[1], /the only question this turn/);
  const plain = instructionsFor({ ...st, playOn: undefined }, K, "text");
  assert.doesNotMatch(plain, /question card is folded away/);
});
