// Whole-project audit 2026-11-09, platform: the cost ledger and two settings (PLAT-35 meter, 37, 38, 46, 47, 48, 53; PLAT-40 reverted).
import { test } from "node:test";
import assert from "node:assert/strict";
import { usdChat, usdStt, CHAT } from "../server/cost/prices.js";
import { lessonCost } from "../server/cost/rollup.js";
import { ledgerTokens, normUsage } from "../server/azure.js";
import { sharedHot } from "../server/lanes.js";
import { saysOff } from "../server/trace/writer.js";
import { bootWarmOn } from "../server/boot-warm.js";

test("PLAT-37: taxila-fast-bg is priced as taxila-fast, not the taxila-brain fallback", () => {
  const u = { in: 1_000_000, cached: 0, out: 1_000_000 };
  assert.equal(usdChat("taxila-fast-bg", u), usdChat("taxila-fast", u));
  assert.ok(CHAT["taxila-fast-bg"]);
});

test("PLAT-48: taxila-transcribe is priced as gpt-4o-transcribe ($0.36/h)", () => {
  assert.equal(usdStt("taxila-transcribe", 3600), 0.36);
});

test("PLAT-38: the recorder gets cached tokens, so the ledger uses the cached price", () => {
  const raw = { prompt_tokens: 1000, prompt_tokens_details: { cached_tokens: 800 }, completion_tokens: 10 };
  const t = ledgerTokens(normUsage(raw));
  assert.deepEqual(t, { in: 1000, cached: 800, out: 10 });
  assert.ok(usdChat("taxila-fast", t) < usdChat("taxila-fast", { in: 1000, out: 10 }));
  assert.equal(ledgerTokens(null), undefined);
});

test("PLAT-46 and PLAT-47: only the server's d5.session counts; a non-2xx image or speech call is not spend", () => {
  const c = lessonCost([
    { kind: "d5.session", src: "server", data: { sec: 60, usd: 0.082 } },
    { kind: "d5.session", src: "client", data: { phase: "closed" } },
    { kind: "image.call", src: "server", data: { deployment: "taxila-image", n: 1, usd: 0.053, status: 429 } },
    { kind: "image.call", src: "server", data: { deployment: "taxila-image", n: 1, usd: 0.053, status: 200 } },
    { kind: "speech.tts", src: "server", data: { engine: "dragonhd", chars: 100, usd: 0.0022, status: 500 } },
  ]);
  assert.equal(c.meters.s2s.usd, 0.082);
  assert.equal(c.meters.image.usd, 0.053);
  assert.equal(c.meters.image.n, 1);
  assert.equal(c.meters.tts.usd, 0);
  assert.equal(c.unpriced, 0, "the client's d5.session is not an unpriced spend");
});

test("PLAT-35 (meter half): d5Session files its event under the lesson the caller names", async () => {
  const W = await import("../server/trace/writer.js");
  const { d5Session } = await import("../server/cost/meter.js");
  const rows = [];
  W._setTraceDeps({ insert: async (r) => { rows.push(...r); }, off: false });
  try {
    const lessonId = "44444444-4444-4444-8444-444444444444", childId = "55555555-5555-4555-8555-555555555555";
    d5Session({ sec: 30, lessonId, childId });
    await W.flushTrace();
    const e = rows.find((r) => r.kind === "d5.session");
    assert.equal(e.sid, lessonId);
    assert.equal(e.cid, childId);
  } finally { W._resetTrace(); }
});

test("PLAT-40 reverted: taxila-gpt6 stays an uncapped pool even when the agent lane can run (capping it starved Studio builds)", () => {
  // server/lanes.js header: capping background calls on a deployment no hot lane shares made the 21st prefetch build wait
  // 55 s (W2-E fixer). The audit proposed capping the teacher agent's deployment; main rejected it on that measurement.
  assert.equal(sharedHot({ TAXILA_TEACHER: "agent" }).has("taxila-gpt6"), false);
  assert.equal(sharedHot({ TAXILA_TEACHER_AGENT_FOR: "owner@example.test" }).has("taxila-gpt6"), false);
});

test("PLAT-53: off, 0, false and no all switch the recorder and the boot warm-up off", () => {
  for (const v of ["off", "0", "false", "no", " OFF "]) { assert.equal(saysOff(v), true, v); assert.equal(bootWarmOn({ TAXILA_BOOT_WARM: v }), false, v); }
  for (const v of [undefined, "", "on", "1"]) { assert.equal(saysOff(v), false, String(v)); assert.equal(bootWarmOn({ TAXILA_BOOT_WARM: v }), true, String(v)); }
});
