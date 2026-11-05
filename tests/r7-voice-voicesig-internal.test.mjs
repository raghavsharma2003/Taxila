// Round 7, stream B Voice, voice-voicesig-acting: TAXILA_VOICESIG unset = internal. A computed knowledge state hands its
// tie-breaker (followUpProbe / gentlerHint / slowerPace) to the Director in our own lessons before the children-evidence
// bar is met; the adapter still runs as shadow (no learner-model evidence); shadow is one env away; off still kills it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { turn, seamMode, status, INTERNAL_ACTING } from "../server/voicesig/lesson.js";

const kvOf = (f = {}) => ({ v: 1, stage: 1, modelVer: "t", f: { onsetMs: 2600, durationMs: 1400, fillerLeadMs: 900, thinkPauses: 1, pausesRead: 2, ...f },
  q: { audio: 1, raw: 1, enc: 0, det: 1, micClass: "builtin", langMode: "mixed" }, aLogit: 0.4, computeMs: 4 });
const item = { id: "i1", answer: "12" };
const correct = { outcome: "correct", flags: {} };

test("internal is the default; a computed state's read is live and labelled internal", () => {
  assert.equal(seamMode({}), "internal");
  const out = turn({ kv: kvOf(), childText: "umm shayad 12", cls: correct, item, classLevel: 5, env: {} });
  if (out.read?.state) {
    assert.equal(out.read.live, true);
    assert.equal(out.read.why, "internal");
    assert.ok(out.reasons.includes("vs_gate.live"));
  }
  const sh = turn({ kv: kvOf(), childText: "umm shayad 12", cls: correct, item, classLevel: 5, env: { TAXILA_VOICESIG: "shadow" } });
  assert.deepEqual(sh.hints, {}, "shadow: nothing acts");
  assert.equal(turn({ kv: kvOf(), childText: "12", cls: correct, item, env: { TAXILA_VOICESIG: "off" } }).read, null, "off kills it");
});

test("internal never acts on a safety turn, and the status page is honest about it", () => {
  const s = turn({ kv: kvOf(), childText: "mujhe marna hai", cls: correct, item, classLevel: 5, env: {} });
  assert.equal(s.read, null);
  assert.deepEqual(s.hints, {});
  const st = status({});
  assert.equal(st.mode, "internal");
  assert.deepEqual([...st.liveStates].sort(), [...INTERNAL_ACTING].sort());
  for (const row of st.states) if (INTERNAL_ACTING.has(row.state)) assert.match(row.says, /^internal: .*not yet measured on children/);
  assert.match(st.honesty, /internal mode/);
});
