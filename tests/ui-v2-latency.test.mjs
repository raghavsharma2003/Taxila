// B1-A4 (PRODUCT-DESIGN-V2 §4.5, G-WAIT-1): ack clip ≤ 1 per 3 turns, never consecutive, never on a safety turn;
// over 200 simulated turns the clip rate, nod timing and thinking duration do not differ between correct and wrong
// (χ² p > 0.2); the negative control (clip only after correct) fails.
import { test } from "node:test";
import assert from "node:assert/strict";
import { AckRationer, beatsAt, BEATS } from "../src/lesson/latency.ts";
import { FLOOR_TIMING, INITIAL_FLOOR, reduceFloor } from "../src/lesson/floor.ts";

function lcg(seed) { let s = seed; return () => ((s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31); }

/** χ² 2x2 test (1 dof), p from the survival function of chi-square(1). */
function chi2p(a, b, c, d) {
  const n = a + b + c + d;
  const x = (n * (a * d - b * c) ** 2) / ((a + b) * (c + d) * (a + c) * (b + d) || 1);
  // P(X > x) for 1 dof = erfc(sqrt(x/2))
  const z = Math.sqrt(x / 2);
  const t = 1 / (1 + 0.5 * z);
  const erfc = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return erfc;
}

test("ack clips: ≤ 1 per 3 turns, never consecutive, never on a safety turn, only tap-to-talk, never after audio", () => {
  const r = new AckRationer();
  let last = -9;
  let count = 0;
  for (let i = 0; i < 90; i++) {
    const turn = r.nextTurn();
    const ok = r.allow({ tapToTalk: true, safetyTurn: turn % 7 === 0, audioStarted: false, bankSize: 12 });
    if (ok) {
      assert.ok(turn - last >= 3, `turn ${turn} after ${last}`);
      assert.notEqual(turn % 7, 0, "never on a safety turn");
      last = turn;
      count++;
    }
  }
  assert.ok(count <= 30);
  const r2 = new AckRationer();
  r2.nextTurn();
  assert.equal(r2.allow({ tapToTalk: false, safetyTurn: false, audioStarted: false, bankSize: 12 }), false);
  assert.equal(r2.allow({ tapToTalk: true, safetyTurn: false, audioStarted: true, bankSize: 12 }), false);
  assert.equal(r2.allow({ tapToTalk: true, safetyTurn: false, audioStarted: false, bankSize: 0 }), false);
});

function simulate(policy) {
  const rnd = lcg(42);
  const r = new AckRationer();
  const out = { correct: { clip: 0, n: 0, nodMs: [], thinkMs: [] }, wrong: { clip: 0, n: 0, nodMs: [], thinkMs: [] } };
  for (let i = 0; i < 200; i++) {
    const verdict = rnd() < 0.5 ? "correct" : "wrong";
    r.nextTurn();
    const replyMs = 1500 + rnd() * 2500;
    const clip = policy(r, verdict, replyMs);
    // the floor's own timing for this turn (verdict is not an input anywhere)
    let s = reduceFloor({ ...INITIAL_FLOOR, legacy: false, handover: "answer", floor: "your_turn" }, { type: "commit" }, 0, FLOOR_TIMING.older);
    const heardAt = s.since;
    s = reduceFloor(s, { type: "tick" }, FLOOR_TIMING.older.heardMs, FLOOR_TIMING.older);
    const thinkStart = s.since;
    s = reduceFloor(s, { type: "teacher_audio_start" }, replyMs, FLOOR_TIMING.older);
    const o = out[verdict];
    o.n++;
    o.clip += clip ? 1 : 0;
    o.nodMs.push(thinkStart - heardAt);
    o.thinkMs.push(s.since - thinkStart);
  }
  return out;
}
const fair = (r, _v, replyMs) => r.allow({ tapToTalk: true, safetyTurn: false, audioStarted: replyMs < 1600, bankSize: 12 });

test("G-WAIT-1: clip rate, nod timing and thinking duration do not differ between correct and wrong (χ² p > 0.2)", () => {
  const o = simulate(fair);
  const p = chi2p(o.correct.clip, o.correct.n - o.correct.clip, o.wrong.clip, o.wrong.n - o.wrong.clip);
  assert.ok(p > 0.2, `clip rate differs: p=${p.toFixed(3)} (${o.correct.clip}/${o.correct.n} vs ${o.wrong.clip}/${o.wrong.n})`);
  assert.deepEqual([...new Set([...o.correct.nodMs, ...o.wrong.nodMs])], [FLOOR_TIMING.older.heardMs], "the receipt nod is identical");
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  assert.ok(Math.abs(mean(o.correct.thinkMs) - mean(o.wrong.thinkMs)) < 400, "thinking duration does not track the verdict");
});

test("G-WAIT-1 negative control: a clip only after correct answers trips the check", () => {
  const leak = (r, v, replyMs) => v === "correct" && r.allow({ tapToTalk: true, safetyTurn: false, audioStarted: replyMs < 1600, bankSize: 12 });
  const o = simulate(leak);
  const p = chi2p(o.correct.clip, o.correct.n - o.correct.clip, o.wrong.clip, o.wrong.n - o.wrong.clip);
  assert.ok(p <= 0.2, `the leak must be caught (p=${p})`);
});

test("latency beats: the label at 600 ms (never earlier), chalk at 1.2 s, the moment at 4 s; Older see seconds", () => {
  assert.equal(beatsAt(599, { older: true }).thinkingLabel, false);
  assert.equal(beatsAt(BEATS.labelMs, { older: true }).thinkingLabel, true);
  assert.equal(beatsAt(1199, { older: true }).chalk, false);
  assert.equal(beatsAt(1200, { older: true }).chalk, true);
  assert.equal(beatsAt(4200, { older: true }).seconds, 4);
  assert.equal(beatsAt(4200, { older: false }).seconds, null, "Young never see a number");
});
