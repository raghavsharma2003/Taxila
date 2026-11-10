// AT-F12, the face-side sibling of AT-U12 (tests/relational-policy.test.mjs: the Director's directive, face included, is
// identical after a correct and a wrong commit). Round 7 face-reacts: her listening face, her thinking face and the
// thinking breath are verdict-blind. Pose, timing and magnitude are the same whatever the child's answer turns out to be
// (design-v2-face-verdict-neutral; main 2026-11-05: "extend AT-U12 or a sibling to prove it").
//   1. The face is a pure function of its inputs: two drivers fed the same listen → heard → thinking → her-reply sequence
//      draw byte-identical frames (blendshapes, head, gaze, lean, breath), with the react flag on and off.
//   2. No input carries an answer: the driver's per-frame input is {nowMs, tap, status, childLevel}; the floor mapping
//      takes the floor and the flag only; and no face-path module names a verdict in code (comments and the policy's
//      "verdict-neutral" release labels aside).
//   3. Nothing in the wait knows the verdict yet: the verdict arrives with her reply (TurnResponse ui.verdict), whose first
//      audio ENDS the thinking face (tests/r7-face-react.test.mjs; measured on the real runtime in
//      docs/design/round7/face/react/summary.json, the script's "correct" and "not yet" turns alike).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const TAP0 = { buf: null, sampleRate: 48000, t: 0, level: 0, fresh: false };
const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

/** One child turn as the face sees it: the floor statuses of src/ui/teacher/floor.ts, then her reply's voice. */
async function turnFrames(react) {
  const { PuppetDriver } = await import("../src/face-puppet/driver.ts");
  const { faceStatusOf } = await import("../src/ui/teacher/floor.ts");
  const d = new PuppetDriver({ band: "b3", seed: 11, react });
  const out = [];
  const rig = { clock: null, frame: (bs, head, gaze, lean, breath) => out.push(JSON.stringify([bs, head, gaze, lean, breath])) };
  let t = 0;
  const run = (floor, ms, tap = TAP0, child = 0) => { for (const end = t + ms; t < end; t += 16) d.frame({ nowMs: t, tap, status: faceStatusOf(floor, react), childLevel: child }, rig); };
  run("your_turn", 600);
  run("listening", 1600, TAP0, 0.45); // the child talks
  run("heard", 400); // stopped; the transcript not in yet
  run("thinking", 1500); // the turn is with the Director
  run("speaking", 600, { ...TAP0, level: 0.5 }); // her reply (the first moment the verdict exists on the page)
  return out;
}

test("AT-F12: the listening / thinking face is a pure function of the floor: identical frames for any answer", async () => {
  for (const react of [false, true]) {
    const a = await turnFrames(react), b = await turnFrames(react);
    assert.equal(a.length, b.length);
    assert.deepEqual(a, b, `react=${react}: byte-identical pose, timing and magnitude`);
  }
});

test("AT-F12: no face input carries the answer", () => {
  const driver = src("src/face-puppet/driver.ts");
  const input = driver.match(/export interface DriverInput \{([\s\S]*?)\n\}/)[1].replace(/\/\*\*[\s\S]*?\*\//g, "");
  assert.deepEqual([...input.matchAll(/^\s*(\w+)\??:/gm)].map((m) => m[1]).sort(), ["childLevel", "nowMs", "status", "tap"]);
  assert.match(src("src/ui/teacher/floor.ts"), /export function faceStatusOf\(floor: TeacherFloor \| null \| undefined, react = faceReactEnabled\(\)\): FloorStatus \| null/);
  const code = (p) => src(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "").replace(/"[^"\n]*verdict-(neutral|blind)[^"\n]*"/g, '""');
  for (const p of ["src/ui/teacher/floor.ts", "src/ui/teacher/Teacher.tsx", "src/face-puppet/driver.ts", "src/face-puppet/stage.ts",
    "src/face-puppet/PuppetFace.tsx", "src/face-puppet/LessonFace.tsx", "src/face-puppet/policy.ts", "src/face-puppet/knowledge.ts", "src/avatar/behaviour.ts"]) {
    assert.doesNotMatch(code(p), /verdict|not_yet|isCorrect|\bcorrect\b/i, `${p} names an answer`);
  }
});

test("AT-F12: on the real runtime, the 'correct' and 'not yet' turns think alike (the measured evidence)", () => {
  const s = JSON.parse(src("tests/fixtures/face-react/summary.json"));
  for (const [arm, v] of Object.entries(s.arms)) {
    if (!arm.startsWith("on-")) continue;
    assert.equal(v.thinkingShareOfGap, 1, `${arm}: thinking for the whole wait`);
    assert.equal(v.jawWhileThinking, 0, `${arm}: no mouth while thinking`);
  }
  // per turn: the script's turn 1 is answered "correct", turn 2 "not yet"; the thinking face starts alike
  const r = JSON.parse(src("tests/fixtures/face-react/react-on-cpu1-r1.json"));
  const [t1, t2] = r.turns;
  assert.equal(t1.verdict, "correct");
  assert.equal(t2.verdict, "not_yet");
  assert.ok(Math.abs(t1.faceThinkingAfterTalkEndMs - t2.faceThinkingAfterTalkEndMs) <= 34, "thinking starts within two frames of each other");
  assert.deepEqual(Object.keys(t1.think.states), ["thinking"]);
  assert.deepEqual(Object.keys(t2.think.states), ["thinking"]);
});
