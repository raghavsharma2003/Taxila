// r4-latency: perceive.js rule 5 (EXACT). On the prefetch, the reply for the plan the turn will make starts as soon as
// classify (and, on a non-answer, the note) is in; the turn adopts it only through the exact reply key. No network, no DB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { perceive, exactSpecOn } from "../server/latency/perceive.js";
import { pickSpeculation } from "../server/brain/turn.js";

const flush = () => new Promise((r) => setImmediate(r));
const deferred = () => { let res, rej; const p = new Promise((a, b) => { res = a; rej = b; }); return { p, res, rej }; };

function fakeDeps({ fast = { result: null, flags: {} } } = {}) {
  const calls = { reply: 0, plan: 0, applied: [] };
  const cls = deferred(), note = deferred();
  const d = {
    classifyFast: () => structuredClone(fast),
    classify: () => cls.p,
    understand: () => note.p,
    // the 3-way speculation: none of them is the plan the note leads to
    speculate: () => [Promise.resolve({ key: "plan:incorrect:-", trace: [], result: Promise.resolve({ reply: "spec", guard: { caught: [] } }) })],
    planTurn: async (_s, c) => { calls.plan++; return { r: { hold: false, state: { recent: [], key: `plan:${c.outcome}:${c.request?.type ?? "-"}` }, ui: {} }, instructions: "I" }; },
    replyKey: (next) => next.key,
    textReply: async () => { calls.reply++; return { reply: "exact", guard: { caught: [] } }; },
    conv2Mode: () => "on",
    applyNote: (c, n) => { calls.applied.push(n.intent); return { ...c, request: { type: n.intent } }; },
    withAnswerMods: (c) => c,
    steerOn: () => false,
    noteWaitMs: 2200,
    now: () => 1,
  };
  return { d, calls, cls, note };
}
const input = (over = {}) => ({ classified: true, clsArgs: { target: { mode: "item" }, childText: "pata nahi", trace: [] }, state: {}, target: { mode: "item" },
  planCtx: { kit: {} }, said: "pata nahi", historyOf: (n) => n.recent, textLane: true, late: false, help: null, childText: "pata nahi",
  noteArgs: { said: "pata nahi" }, noteParallel: false, exact: true, ...over });

test("EXACT is a release flag, off by default", () => {
  assert.equal(exactSpecOn({}), false);
  assert.equal(exactSpecOn({ TAXILA_EXACT_SPEC: "on" }), true);
});

test("a non-answer: the reply for the note's plan starts when the note lands, and the turn adopts it by its key", async () => {
  const { d, calls, cls, note } = fakeDeps();
  const P = perceive(d, input());
  cls.res({ outcome: "no_evidence", flags: {} });
  await flush();
  assert.equal(calls.reply, 0, "a non-answer waits for the note, as the turn does");
  note.res({ intent: "dont_know" });
  await P.exact;
  assert.deepEqual(calls.applied, ["dont_know"]);
  assert.equal(calls.reply, 1);
  const hit = await pickSpeculation(P.specs, "plan:no_evidence:dont_know");
  assert.equal(hit?.result.reply, "exact");
  assert.equal(hit.exact, true);
  assert.equal(await pickSpeculation(P.specs, "plan:no_evidence:other"), null, "another key is a miss: the turn writes its own");
});

test("a graded answer does not wait for the note; a key a speculation already has is not written twice", async () => {
  const { d, calls, cls } = fakeDeps();
  const P = perceive(d, input());
  cls.res({ outcome: "incorrect", flags: {} });
  assert.equal(await P.exact, "dup");
  assert.equal(calls.reply, 0);
  assert.equal(calls.applied.length, 0, "the note was still out: not applied (the turn would not wait for it either)");
});

test("never on a distress read, a content-filter block, the turn's own perceive (no exact), or a late turn", async () => {
  for (const [over, c] of [[{}, { outcome: "no_evidence", flags: { distress: true } }], [{}, { outcome: "no_evidence", source: "content_filter", flags: {} }],
    [{ exact: false }, { outcome: "incorrect", flags: {} }], [{ late: true }, { outcome: "incorrect", flags: {} }]]) {
    const { d, calls, cls, note } = fakeDeps();
    const P = perceive(d, input(over));
    cls.res(c); note.res({ intent: "dont_know" });
    await P.exact; await flush();
    assert.equal(calls.reply, 0, JSON.stringify([over, c]));
  }
});

test("the placeholder is on the list before the plan resolves, so a turn picking right after the note sees it", async () => {
  const { d, cls, note } = fakeDeps();
  let release;
  const gate = new Promise((r) => { release = r; });
  const plan = d.planTurn;
  d.planTurn = async (...a) => { await gate; return plan(...a); };
  const P = perceive(d, input());
  cls.res({ outcome: "no_evidence", flags: {} }); note.res({ intent: "dont_know" });
  await flush(); await flush();
  assert.equal(P.specs.length, 2, "the speculation + the exact placeholder");
  const picking = pickSpeculation(P.specs, "plan:no_evidence:dont_know");
  release();
  assert.equal((await picking)?.result.reply, "exact");
});
