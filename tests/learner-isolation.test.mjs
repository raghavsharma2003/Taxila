// Floor 8 / §13.1 Test I at the KT layer: permuting anything in KT_PERMUTED_INPUTS (vibe knobs, timing,
// affect labels, engagement state, intra-session wall-clock offsets) leaves the ledger byte-identical;
// perturbing a HELD input changes it (the power check: the test can fail).
import { test } from "node:test";
import assert from "node:assert/strict";
import { fold, newLedger, canonical } from "../server/learner/kt/ledger.js";
import { makeLog, rng } from "../server/learner/kt/gen.js";
import { KT_PERMUTED_INPUTS, KT_HELD_INPUTS } from "../shared/learner.ts";

const RUNS = Number(process.env.LEARNER_PROP_RUNS || 60);
const L0 = () => newLedger({ childId: "c", classLevel: 6 });
const ledgerBytes = (log) => canonical(fold(L0(), log));

/** Attach a permuted channel to every event (the fields a leaky implementation could read). */
function withPermuted(log, seed, gen) {
  const r = rng(seed);
  const pick = (xs) => xs[Math.floor(r() * xs.length)];
  return log.map((e, i) => {
    const extreme = gen === "d";
    const v = {
      vibe: { waitNudgeSec: extreme ? 12 : 4 + Math.floor(r() * 5), endpointSilenceMs: extreme ? 2000 : 200 + Math.floor(r() * 1500),
        teacherTurnWords: 10 + Math.floor(r() * 30), humourDose: extreme ? "light" : pick(["off", "light"]), energy: pick(["calm", "warm"]),
        address: pick(["didi", "sir", "teacher"]), interestTheme: pick(["cricket", "space", null]) },
      timing: { onsetLatencyMs: Math.exp(Math.log(50) + r() * Math.log(400)), wordsPerSec: r() * 4, rapid: r() < 0.3, bargeIn: r() < 0.2, scriptMix: r() },
      acts: { AFFECT_SELF: extreme ? "negative" : pick(["negative", "positive", null]), taskValence: extreme ? "bored" : pick(["neutral", "ease", "hard", "bored"]) },
      derived: { engagementState: pick(["warming", "engaged", "strained", "disengaging", "stopped"]) },
    };
    // generator (e): re-time the lesson; wall-clock offsets from the session start move, order is kept
    const at = gen === "e" ? new Date(Date.parse(e.sessionStartAt) + i * (1000 + Math.floor(r() * 30000))).toISOString() : e.at;
    return { ...e, at, ...v };
  });
}

test("partition lists are disjoint (runtime twin of the type-level check)", () => {
  const held = new Set(KT_HELD_INPUTS);
  assert.equal(KT_PERMUTED_INPUTS.filter((k) => held.has(k)).length, 0);
  assert.ok(KT_PERMUTED_INPUTS.includes("timing.intraSessionOffsetMs") && KT_HELD_INPUTS.includes("session.sessionStartAt"));
});

test("Test I: vibe / timing / affect / engagement permutations leave KT, misconceptions and θ byte-identical", () => {
  for (let s = 1; s <= RUNS; s++) {
    const log = makeLog(5000 + s);
    const ref = ledgerBytes(withPermuted(log, s, "a"));
    assert.equal(ref, ledgerBytes(log), `seed ${s}: the channel is ignored`);
    for (const gen of ["b", "c", "d", "e"]) assert.equal(ledgerBytes(withPermuted(log, s * 31 + gen.charCodeAt(0), gen)), ref, `seed ${s} gen ${gen}`);
  }
});

test("power check: perturbing a held input (outcome, gaming, controllerEasy, teach) changes the ledger", () => {
  const log = makeLog(77, { flags: false, sessions: 2 });
  const i = log.findIndex((e) => !e.teach && e.cls === "item.open" && e.outcome <= 4);
  assert.ok(i >= 0);
  const base = ledgerBytes(log);
  const mut = (f) => ledgerBytes(log.map((e, k) => (k === i ? f(e) : e)));
  assert.notEqual(mut((e) => ({ ...e, outcome: e.outcome === 0 ? 4 : 0 })), base, "outcome");
  assert.notEqual(mut((e) => ({ ...e, gamingWindowKt: true })), base, "gamingWindowKt");
  assert.notEqual(mut((e) => ({ ...e, controllerEasy: true })), base, "controllerEasy");
  assert.notEqual(mut((e) => ({ ...e, teach: true })), base, "teach");
  const sid = log[i].sessionId;
  const shifted = log.map((e) => (e.sessionId === sid ? { ...e, sessionStartAt: new Date(Date.parse(e.sessionStartAt) + 86_400_000 * 3).toISOString() } : e));
  assert.notEqual(ledgerBytes(shifted), base, "sessionStartAt");
});
