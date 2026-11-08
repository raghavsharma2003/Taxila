// dc-r7-code-spec (turn-replay 2026-11-06): on a turn the BYTES decided, her reply starts alongside the model distress read
// (server/latency/perceive.js rule 6, TAXILA_CODE_SPEC). Pinned here: it is off unless the flag is on; with it on the reply
// call starts before the read returns, and nothing it writes streams (no clause hook); a distress read makes a different plan,
// so the speculated reply's key never matches; and the turn picks a speculated reply only after it awaited the read.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { perceive, codeSpecOn } from "../server/latency/perceive.js";

const deferred = () => { const o = { settled: false }; o.p = new Promise((r) => { o.res = (v) => { o.settled = true; r(v); }; }); return o; };

function deps(log, read) {
  return {
    now: () => 1000,
    classifyFast: () => ({ result: { outcome: "correct", confidence: 1, source: "exact", flags: { distress: false } }, flags: {} }),
    classify: () => read.p,
    understand: () => null,
    speculate: () => [],
    conv2Mode: () => "off",
    // the plan for a classification: a distress read is a safeguard plan, everything else the answer's plan
    planTurn: async (_s, cls) => ({ r: { hold: false, state: { seq: 1 }, ui: {} }, instructions: cls.flags?.distress ? "SAFEGUARD" : "ANSWER" }),
    replyKey: (_n, _k, _r, instructions) => `key:${instructions}`,
    textReply: (args) => { log.push({ at: read.settled ? "after" : "before", hooks: Object.keys(args).filter((k) => /clause|hook|onClause/i.test(k)) }); return Promise.resolve({ reply: "x", guard: { caught: [] } }); },
  };
}
const X = { classified: true, clsArgs: {}, state: {}, target: {}, planCtx: { kit: {} }, said: "5", historyOf: () => [], textLane: true, late: false, help: null, childText: "5", noteArgs: null };

describe("code-classified speculation (TAXILA_CODE_SPEC)", () => {
  const KEEP = {};
  beforeEach(() => { KEEP.v = process.env.TAXILA_CODE_SPEC; delete process.env.TAXILA_CODE_SPEC; });
  afterEach(() => { if (KEEP.v === undefined) delete process.env.TAXILA_CODE_SPEC; else process.env.TAXILA_CODE_SPEC = KEEP.v; });

  test("off by default: no reply starts before the read", async () => {
    assert.equal(codeSpecOn({}), false);
    const log = [], read = deferred();
    const out = perceive(deps(log, read), X);
    await new Promise((r) => setImmediate(r));
    assert.equal(out.specs.length, 0);
    assert.equal(log.length, 0);
    read.res({ outcome: "correct", flags: {} });
  });

  test("on: the reply starts while the distress read is out, with no clause hook (nothing streams before the read)", async () => {
    process.env.TAXILA_CODE_SPEC = "on";
    const log = [], read = deferred();
    const out = perceive(deps(log, read), X);
    await new Promise((r) => setImmediate(r));
    assert.equal(log.length, 1, "the reply call started");
    assert.equal(log[0].at, "before", "before the distress read returned");
    assert.deepEqual(log[0].hooks, [], "no clause hook: nothing reaches TTS or the client from here");
    const s = await out.specs[0];
    assert.equal(s.key, "key:ANSWER");
    read.res({ outcome: "correct", flags: { distress: false } });
  });

  test("on: a distress read makes a different plan, so the speculated reply can never be the one used", async () => {
    process.env.TAXILA_CODE_SPEC = "on";
    const log = [], read = deferred();
    const d = deps(log, read);
    const out = perceive(d, X);
    read.res({ outcome: "correct", flags: { distress: true } });
    const cls = await out.clsP;
    const real = await d.planTurn({}, cls, {});
    const key = d.replyKey(null, null, null, real.instructions);
    const s = await out.specs[0];
    assert.notEqual(s.key, key, "the turn's key (safeguard) never matches the speculated one");
  });

  test("the turn picks a speculated reply only after it has awaited the classification (and its distress read)", () => {
    const src = readFileSync(new URL("../server/brain/turn.js", import.meta.url), "utf8");
    const awaitAt = src.indexOf("cls = classified ? await P.clsP : null");
    const pickAt = src.indexOf("await pickSpeculation(specs, key)");
    assert.ok(awaitAt > 0 && pickAt > 0, "both lines exist");
    assert.ok(awaitAt < pickAt, "the read is awaited before any speculated reply is picked");
  });
});
