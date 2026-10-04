// TaxilaFDB + engine model (stage A/B) unit tests: metrics semantics, baseline arms, the device ear in noise, echo and
// hold-request fixes found by the benchmark, the semantic estimator's typed contract, and stage B JS↔ONNX parity.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { facts, aggregate, bootCI, ece } from "../evals/duplex/taxilafdb/metrics.mjs";
import { SilenceEngine, SmartTurnEngine, FinalLandsEngine } from "../evals/duplex/taxilafdb/arms.mjs";
import { ChildAudioTracker } from "../src/duplex/audio.ts";
import { EchoSubtractor } from "../server/duplex/echo.js";
import { understand } from "../server/duplex/understand.js";
import { parseSemantic, semanticUser, SEMANTIC_EXCHANGES } from "../server/duplex/semantic.js";

const rec = (o = {}) => ({
  id: "s~v~clean", scenario: "s", family: "F2", sub: "open_explanation", arm: "a", lane: "D4", speaks: [], yields: [], resumes: [], nods: [], clips: [], reacts: 0, ducks: 0,
  safetyAt: null, endMs: 9000, ctxExchange: "open_explanation",
  g: { childSegs: [{ start: 1000, end: 2000 }, { start: 3000, end: 4000 }], words: [[1000, 2000], [3000, 4000]], pauses: [{ afterSeg: 0, ms: 1000, cls: "mid_explanation", start: 2000, end: 3000 }],
    trueEnd: 4000, childOnset: 1000, herSpan: { start: 0, end: 900 }, overlays: [] },
  sg: { endClass: "respond" }, ...o,
});
const speak = (t, o = {}) => ({ t, op: "speak", reason: "turn_end", firstAudio: t + 300, revokedAt: null, verdictAt: null, text: "", how: "cold", herEndAt: null, ...o });

test("a SPEAK inside a thinking pause is a cut-off; after the end it is the gap", () => {
  const f = facts(rec({ speaks: [speak(2500, { revokedAt: 3050 }), speak(4400)] }));
  assert.equal(f.pauses[0].thinking, true);
  assert.equal(f.pauses[0].takeover, true);
  assert.equal(f.gap, 400);
  assert.equal(f.missed2s, false);
  const g = facts(rec({ speaks: [speak(4400)] }));
  assert.equal(g.pauses[0].takeover, false);
});

test("a question to her answered in its pause is allowed; a hold offer only after 15 s", () => {
  const q = facts(rec({ g: { ...rec().g, pauses: [{ afterSeg: 0, ms: 1000, cls: "question_pause", start: 2000, end: 3000 }] }, sg: { endClass: "respond", cutIn: { reason: "question_to_her", afterSeg: 0 } }, speaks: [speak(2400)] }));
  assert.equal(q.pauses[0].takeover, false);
  assert.equal(q.cutInHit, true);
  const holdRec = rec({ g: { ...rec().g, pauses: [{ afterSeg: 0, ms: 20000, cls: "hold_long", start: 2000, end: 22000 }], trueEnd: 23000 }, sg: { endClass: "respond", holdRequest: true } });
  assert.equal(facts({ ...holdRec, speaks: [{ ...speak(10000), op: "cut_in", reason: "hold_offer" }] }).holdViolation, true);
  assert.equal(facts({ ...holdRec, speaks: [{ ...speak(17100), op: "cut_in", reason: "hold_offer" }] }).holdViolation, false);
});

test("an infeasible drift cut-in is not expected, and one fired anyway is out of policy", () => {
  const f = facts(rec({ family: "F11", sg: { endClass: "respond", cutIn: { reason: "off_task_drift", minOffTaskMs: 30000 } }, speaks: [{ ...speak(2500), op: "cut_in", reason: "off_task_drift" }] }));
  assert.equal(f.driftInfeasible, true);
  assert.equal(f.cutInExpected, undefined);
  assert.equal(f.cutIns[0].inPolicy, false);
});

test("bootstrap CI is deterministic and brackets the point", () => {
  const items = Array.from({ length: 40 }, (_, i) => ({ c: `s${i % 10}`, y: i % 4 === 0 }));
  const a = bootCI(items, (x) => x.filter((y) => y.y).length / x.length), b = bootCI(items, (x) => x.filter((y) => y.y).length / x.length);
  assert.deepEqual(a, b);
  assert.ok(a.lo <= a.point && a.point <= a.hi);
  assert.equal(ece([{ p: 1, y: 1 }, { p: 0, y: 0 }]), 0);
  const agg = aggregate([facts(rec({ speaks: [speak(4400)] }))]);
  assert.equal(agg.M2_thinkingCutoff.k, 0);
});

const tick = (o = {}) => ({ t: 5000, phase: "child_turn", phaseSince: 0, child: { voicing: false, silenceRunMs: 0, firstOnsetAt: 1000, lastOffsetAt: 4000 }, transcript: { text: "बासठ", isFinal: false },
  her: { handedOverAt: 900 }, safety: { distress: false }, context: { wt1: { voiceMs: 6000 } }, ...o });

test("silence-N speaks at N ms of silence once words exist; cascade-900 waits for the final", () => {
  const e = new SilenceEngine(640);
  assert.equal(e.tick(tick({ child: { ...tick().child, silenceRunMs: 600 } })).action, "HOLD");
  assert.equal(e.tick(tick({ child: { ...tick().child, silenceRunMs: 660 } })).action, "SPEAK");
  const c = new FinalLandsEngine("cascade-900");
  assert.equal(c.tick(tick({ child: { ...tick().child, silenceRunMs: 1200 } })).action, "HOLD");
  assert.equal(c.tick(tick({ child: { ...tick().child, silenceRunMs: 1200 }, transcript: { text: "बासठ", isFinal: true } })).action, "SPEAK");
});

test("smart-turn arm: judged once per silence run at 200 ms, else the 3 s timeout (Pipecat pattern)", () => {
  const store = { p: (_id, t) => (t < 6000 ? 0.2 : 0.9) };
  const e = new SmartTurnEngine(store, "x", 0.5);
  const at = (t, sil, off = 4000) => e.tick(tick({ t, child: { ...tick().child, silenceRunMs: sil, lastOffsetAt: off } })).action;
  assert.equal(at(4300, 300), "HOLD"); // judged incomplete (0.2)
  assert.equal(at(6500, 2500), "HOLD"); // same run: not re-judged even though p is now 0.9
  assert.equal(at(7100, 3100), "SPEAK"); // timeout
  assert.equal(at(8300, 300, 8000), "SPEAK"); // a new run judged complete
});

test("the device ear learns a noisy room's floor and ignores aperiodic bursts", () => {
  const a = new ChildAudioTracker();
  let edges = [];
  let seed = 3;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
  for (let t = 0; t < 6000; t += 20) {
    const speech = t >= 2000 && t < 2600;
    const db = speech ? -22 : -42 + rnd() * 12; // a fluctuating -42..-30 dBFS bed
    const r = a.push(t, Math.pow(10, db / 20), speech ? 260 : null);
    if (r.edge) edges.push(`${r.edge}@${t}`);
  }
  assert.deepEqual(edges.map((e) => e.split("@")[0]), ["onset", "offset"]);
  assert.ok(a.silenceRunMs() >= 3000, `silence run ${a.silenceRunMs()}`);
});

test("echo: a fresh single token of hers is dropped, a stale one (an answer repeating her word) is kept", () => {
  const e = new EchoSubtractor();
  e.heard("u1", [{ w: "हर", startMs: 200, endMs: 500 }, { w: "हिस्सा", startMs: 500, endMs: 900 }, { w: "बराबर", startMs: 900, endMs: 1300 }]);
  assert.equal(e.subtract("हर", 700, 300).text, "");
  assert.equal(e.subtract("बराबर", 3200, 300).text, "बराबर");
});

test("a hold request with a trailing address word is still a hold", () => {
  assert.equal(understand("एक मिनट दीदी,", { answerForm: "number" }).holdTail, true);
  assert.equal(understand("one second ma'am", {}).holdTail, true);
  assert.equal(understand("एक मिनट दीदी छप्पन", { answerForm: "number" }).holdTail, false);
});

test("semantic estimator: typed numbers only, open contexts only, no identity in the payload", () => {
  assert.deepEqual(parseSemantic({ pComplete: 1.4, pHoldWanted: -1, asksHer: "0.2", offTask: null }), { pComplete: 1, pHoldWanted: 0, asksHer: 0.2, offTask: null });
  assert.equal(parseSemantic({ pHoldWanted: 0.3 }), null);
  assert.equal(SEMANTIC_EXCHANGES.has("closed_answer"), false);
  const u = semanticUser({ text: "क्योंकि cube के सारे faces", context: { exchange: "open_explanation", beat: "teachback", childId: "c-123", name: "Aarav" } });
  assert.ok(!/c-123|Aarav/.test(u));
  assert.ok(u.includes("क्योंकि cube"));
});

test("stage B: the JS head matches the exported ONNX graph on held-out ticks", async (t) => {
  const pf = new URL("../evals/duplex/taxilafdb/data/stageb-parity.json", import.meta.url);
  const { loadManifest, makeHead } = await import("../evals/duplex/taxilafdb/stageb.mjs");
  let m;
  try { m = loadManifest(); } catch { t.skip("no stage B model exported yet"); return; }
  if (!fs.existsSync(pf)) { t.skip("no parity file"); return; }
  const P = JSON.parse(fs.readFileSync(pf, "utf8"));
  const head = makeHead(m);
  let worst = 0;
  for (let i = 0; i < P.features.length; i++) {
    const miss = P.missing[i][0] > 0.5;
    const [a, b] = head(P.features[i], miss ? null : P.emb[i], P.st[i][0], miss);
    worst = Math.max(worst, Math.abs(a - P.p[i][0]), Math.abs(b - P.p[i][1]));
  }
  assert.ok(worst < 2e-3, `max |JS - torch| = ${worst}`);
});
