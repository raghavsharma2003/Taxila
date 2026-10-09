// Round 3 integration (2026-10-09): the two changes the integrator made beyond the streams' patches.
//   1. server/index.js: relational-human 05 (GET/DELETE /api/parent/memory) and play 01 (/api/play/*) both edit the one
//      register line; the hand merge keeps both route tables and `...lane` LAST (play 01 as written appended `...play`
//      after it, which tests/w2d-voice-lanes.test.mjs fails: the realtime seam's lane route is pinned as the last spread).
//   2. src/latency/duplexTurn.ts: the duplex end-of-turn prefetch keys on the engine's measured `eager` start when the engine
//      sends one (docs/design/round3/duplex/APPLY.md §4), else round 2's projected-pComplete `draft` start.
import { describe, test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TurnPrefetcher } from "../src/latency/prefetch.ts";
import { registerLatencyTarget, latencyDuplexSink, __resetDuplexTurn } from "../src/latency/duplexTurn.ts";
import { routes as play } from "../server/play/routes.js";
import { routes as relational } from "../server/relational/routes.js";

describe("round 3 integration: server/index.js registers both round-3 route tables", () => {
  const src = readFileSync(new URL("../server/index.js", import.meta.url), "utf8");
  const reg = src.match(/register\(\{([^}]*)\}\)/)?.[1] ?? "";
  test("the relational and play tables are imported and spread into the one register call", () => {
    assert.match(src, /import \{ routes as relational \} from "\.\/relational\/routes\.js";/);
    assert.match(src, /import \{ routes as play \} from "\.\/play\/routes\.js";/);
    assert.match(reg, /\.\.\.relational\b/);
    assert.match(reg, /\.\.\.play\b/);
    // play 01 as written put ...play AFTER ...lane; tests/w2d-voice-lanes.test.mjs pins `...lane }` as the last spread
    // (the realtime seam owns POST /api/lesson/lane), so the merge keeps ...lane last
    assert.match(reg, /\.\.\.lane\s*$/, "...lane stays the last spread");
  });
  test("the two tables do not shadow each other or an existing table's keys", () => {
    const pk = Object.keys(play), rk = Object.keys(relational);
    assert.ok(pk.length > 0 && rk.length > 0);
    assert.ok(pk.every((k) => /\/api\/play\//.test(k)), `play keys: ${pk.join(", ")}`);
    assert.ok(rk.every((k) => /\/api\/parent\/memory/.test(k)), `relational keys: ${rk.join(", ")}`);
    assert.equal(pk.filter((k) => rk.includes(k)).length, 0);
  });
});

describe("round 3 integration: the duplex end-of-turn prefetch keys on the engine's eager start", () => {
  beforeEach(() => __resetDuplexTurn());
  const prepare = (text, hint) => ({ to: "think", op: "prepare", t: 0, text, uptake: null, hint: { warmTts: "none", sttProbe: false, textHash: "h", buildIntent: null, ...hint } });
  const target = () => {
    const sent = [];
    const pf = new TurnPrefetcher({ lessonId: "L", post: async (b) => { sent.push(b.text); }, onSend: () => {} });
    registerLatencyTarget({ lessonId: "L", prefetcher: pf, ack: null, duplexLive: () => true });
    return sent;
  };
  test("eager start sends the prefetch even when the draft is not a start", () => {
    const sent = target();
    latencyDuplexSink(prepare("chhe faces", { draft: "none", eager: "start" }));
    assert.deepEqual(sent, ["chhe faces"]);
  });
  test("an engine that sends eager decides by it: a draft start with eager none or cancel sends nothing", () => {
    const sent = target();
    latencyDuplexSink(prepare("chhe", { draft: "start", eager: "none" }));
    latencyDuplexSink(prepare("chhe faces", { draft: "start", eager: "cancel" }));
    assert.deepEqual(sent, []);
  });
  test("an engine without eager (round 2) keeps the draft start", () => {
    const sent = target();
    latencyDuplexSink(prepare("aath", { draft: "start" }));
    assert.deepEqual(sent, ["aath"]);
  });
});
