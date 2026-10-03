// B1-A1 (PRODUCT-DESIGN-V2 §4.1): the eight-state floor. Every transition of the §4.1 table; YOUR TURN is
// impossible without a pending hand-over; heard always precedes thinking; the mutation "YOUR TURN on
// awaiting=false alone" (the old statusOf) fails these checks.
import { test } from "node:test";
import assert from "node:assert/strict";
import { FloorController, INITIAL_FLOOR, reduceFloor, FLOOR_TIMING } from "../src/lesson/floor.ts";
import { INITIAL_FLAGS, reduceStatus, statusOf } from "../src/lesson/status.ts";

const T = FLOOR_TIMING.older;
const run = (events, start = INITIAL_FLOOR) => {
  let s = start;
  let now = 0;
  const seen = [s.floor];
  for (const e of events) {
    if (typeof e === "number") { now += e; continue; }
    s = reduceFloor(s, e, now, T);
    if (seen.at(-1) !== s.floor) seen.push(s.floor);
  }
  return { s, seen };
};
const strict = (h) => ({ type: "ui", handover: h });

test("floor: idle → speaking → yielding → your_turn → listening → heard → thinking → speaking (§4.1 table)", () => {
  const { seen } = run([
    strict("answer"), { type: "teacher_audio_start" }, { type: "teacher_audio_ending", remainingMs: 200 }, { type: "teacher_audio_end" },
    { type: "child_speech_start" }, { type: "child_speech_end" }, 400, { type: "tick" }, { type: "teacher_audio_start" },
  ]);
  assert.deepEqual(seen, ["idle", "speaking", "yielding", "your_turn", "listening", "heard", "thinking", "speaking"]);
});

test("floor: showing on a demo cue, back to speaking when it ends; yielding from showing", () => {
  const { seen } = run([strict("answer"), { type: "teacher_audio_start" }, { type: "ui", handover: "answer", cues: { program: "demo" } }, { type: "ui", handover: "answer", cues: null }]);
  assert.deepEqual(seen, ["idle", "speaking", "showing", "speaking"]);
  const b = run([{ type: "ui", handover: "choice", cues: { program: "point" } }, { type: "teacher_audio_start" }, { type: "teacher_audio_ending", remainingMs: 100 }]);
  assert.deepEqual(b.seen, ["idle", "showing", "yielding"]);
});

test("floor: chain → idle, never YOUR TURN; a yield needs handover ∉ {chain, undefined}", () => {
  const { seen } = run([strict("chain"), { type: "teacher_audio_start" }, { type: "teacher_audio_ending", remainingMs: 100 }, { type: "teacher_audio_end" }]);
  assert.deepEqual(seen, ["idle", "speaking", "idle"]);
  // strict mode (a handover was seen once): a turn with none hands nothing over
  const s2 = run([strict("answer"), { type: "ui" }, { type: "teacher_audio_start" }, { type: "teacher_audio_end" }]);
  assert.equal(s2.s.floor, "idle");
});

test("floor: YOUR TURN is impossible without a pending hand-over (every input, every start state)", () => {
  const inputs = [{ type: "teacher_audio_start" }, { type: "teacher_audio_end" }, { type: "teacher_audio_ending", remainingMs: 0 }, { type: "child_speech_start" },
    { type: "child_speech_end" }, { type: "child_silent" }, { type: "response_start" }, { type: "commit" }, { type: "tick" }, { type: "settle" }, { type: "reset" }, { type: "ui" }, strict("chain")];
  // strict mode, handover chain: random walks never reach your_turn
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  for (let walk = 0; walk < 300; walk++) {
    let s = { ...INITIAL_FLOOR, legacy: false, handover: "chain" };
    let now = 0;
    for (let k = 0; k < 40; k++) {
      const e = inputs[Math.floor(rnd() * inputs.length)];
      now += 100;
      s = reduceFloor(s, e, now, T);
      assert.notEqual(s.floor, "your_turn", `walk ${walk}: ${JSON.stringify(e)}`);
      assert.notEqual(s.floor, "yielding");
    }
  }
});

test("floor: heard always precedes thinking (no commit → no thinking)", () => {
  const inputs = [{ type: "teacher_audio_start" }, { type: "teacher_audio_end" }, { type: "child_speech_start" }, { type: "child_speech_end" },
    { type: "response_start" }, { type: "commit" }, { type: "tick" }, { type: "settle" }, strict("answer")];
  let seed = 3;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  for (let walk = 0; walk < 300; walk++) {
    let s = INITIAL_FLOOR;
    let now = 0;
    let prev = s.floor;
    for (let k = 0; k < 40; k++) {
      now += 250;
      s = reduceFloor(s, inputs[Math.floor(rnd() * inputs.length)], now, T);
      if (s.floor === "thinking" && prev !== "thinking") assert.equal(prev, "heard", `walk ${walk}`);
      prev = s.floor;
    }
  }
});

test("floor: barge-in (speaking → listening); typed send from your_turn → heard; heard → thinking at heardMs or response_start", () => {
  assert.deepEqual(run([strict("answer"), { type: "teacher_audio_start" }, { type: "child_speech_start" }]).seen, ["idle", "speaking", "listening"]);
  assert.deepEqual(run([strict("answer"), { type: "teacher_audio_start" }, { type: "teacher_audio_end" }, { type: "commit" }, 399, { type: "tick" }]).seen, ["idle", "speaking", "your_turn", "heard"]);
  assert.deepEqual(run([strict("answer"), { type: "teacher_audio_start" }, { type: "teacher_audio_end" }, { type: "commit" }, 400, { type: "tick" }]).seen.at(-1), "thinking");
  assert.deepEqual(run([strict("answer"), { type: "teacher_audio_start" }, { type: "teacher_audio_end" }, { type: "commit" }, { type: "response_start" }]).seen.at(-1), "thinking");
});

test("floor: an accidental tap (child_silent) and a failed turn (settle) give the open question back", () => {
  assert.equal(run([strict("answer"), { type: "teacher_audio_start" }, { type: "teacher_audio_end" }, { type: "child_speech_start" }, { type: "child_silent" }]).s.floor, "your_turn");
  assert.equal(run([strict("answer"), { type: "teacher_audio_start" }, { type: "teacher_audio_end" }, { type: "commit" }, 500, { type: "tick" }, { type: "settle" }]).s.floor, "your_turn");
});

test("floor legacy mode: no handover ever sent → a turn hands over (the old behaviour), until one is", () => {
  assert.equal(run([{ type: "teacher_audio_start" }, { type: "teacher_audio_end" }]).s.floor, "your_turn");
});

test("FloorController: settle is ignored while a Director call is in flight (the answer is not dropped)", () => {
  let inFlight = true;
  const timers = { setTimeout: () => 0, clearTimeout: () => {} };
  let now = 0;
  const c = new FloorController(T, timers, () => now, () => inFlight);
  c.onSignal({ type: "ui", ui: { handover: "answer" } });
  c.onSignal({ type: "teacher_audio_start" });
  c.onSignal({ type: "teacher_audio_end" });
  c.onSignal({ type: "child_final", text: "two", typed: true, startedAt: 0 });
  assert.equal(c.state.floor, "heard");
  now = 500;
  c.feed({ type: "tick" });
  assert.equal(c.state.floor, "thinking");
  c.onSignal({ type: "settle" });
  assert.equal(c.state.floor, "thinking");
  inFlight = false;
  c.onSignal({ type: "settle" });
  assert.equal(c.state.floor, "your_turn");
});

test("statusOf fix: YOUR TURN needs a pending hand-over; the mutation (your_turn on awaiting=false alone) is caught", () => {
  let f = reduceStatus(INITIAL_FLAGS, { type: "settle" });
  assert.equal(statusOf(f), "your_turn", "legacy: unchanged");
  f = reduceStatus(f, { type: "handover", open: false });
  assert.equal(statusOf(f), "thinking", "no pending hand-over → never YOUR TURN");
  const mutant = (fl) => (fl.childSpeaking ? "listening" : fl.teacherSpeaking ? "speaking" : fl.awaiting || fl.activeResponses > 0 ? "thinking" : "your_turn");
  assert.notEqual(mutant(f), statusOf(f), "the old rule would light YOUR TURN here");
});
