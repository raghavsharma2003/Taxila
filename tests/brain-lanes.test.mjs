// Quota lanes (BUILD-PLAN §1.3 rev 2, superhuman-quota-isolation; TEACHER-BRAIN §12; W2-E acceptance G-QUOTA): 20
// concurrent Studio races plus a consolidation burst on a SHARED deployment while live replies run → 0 hot-path 429s.
// A simulated deployment enforces its TPM over a sliding minute and answers 429 when a call would exceed it; the clock
// and timers are fake, so the test is exact and fast. The control arm (no lanes) shows the same load DOES 429 the hot path.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createLanes, admit, settle, twinFor, BACKGROUND_SHARE } from "../server/lanes.js";

/** A fake clock with a timer queue (ms resolution). */
function fakeTime() {
  let t = 0;
  const timers = [];
  return {
    now: () => t,
    setTimer: (fn, ms) => { timers.push({ at: t + Math.max(1, ms), fn }); return timers.at(-1); },
    async runUntil(end, onTick) {
      while (t < end) {
        t += 1;
        for (const x of timers.filter((y) => y.at <= t)) { timers.splice(timers.indexOf(x), 1); x.fn(); }
        onTick?.(t);
        if (t % 50 === 0) await new Promise((r) => setImmediate(r));
      }
    },
  };
}

/** A deployment: TPM over a sliding 60 s window; a call that would exceed it is a 429. */
function deployment(tpm, now) {
  const log = [];
  return {
    call(tokens) {
      const t = now();
      while (log.length && log[0].at <= t - 60_000) log.shift();
      const used = log.reduce((a, x) => a + x.tokens, 0);
      if (used + tokens > tpm) return 429;
      log.push({ at: t, tokens });
      return 200;
    },
  };
}

async function simulate({ lanes }) {
  const clock = fakeTime();
  const L = lanes ? createLanes({ now: clock.now, setTimer: clock.setTimer, tpm: { shared: 500_000 } }) : null;
  const dep = deployment(500_000, clock.now);
  const res = { hot: 0, hot429: 0, bg: 0, bg429: 0, bgWaitMax: 0 };
  async function call(lane, tokens, kind = "chat") {
    const t0 = clock.now();
    const wait = L ? L.admit({ quotaLane: lane, deployment: "shared", kind, estTokens: tokens }) : undefined;
    if (wait) await wait;
    const status = dep.call(tokens);
    L?.settle({ quotaLane: lane, deployment: "shared", kind, status, usage: status === 200 ? { in: tokens * 0.6, out: tokens * 0.4 } : undefined, estTokens: tokens });
    if (lane === "hot") { res.hot += 1; if (status === 429) res.hot429 += 1; } else { res.bg += 1; if (status === 429) res.bg429 += 1; res.bgWaitMax = Math.max(res.bgWaitMax, clock.now() - t0); }
  }
  const pending = [];
  // background burst at t=0: 20 Studio races (two arms × ~12k tokens each) and 40 consolidations (~2k each)
  for (let i = 0; i < 20; i++) for (let k = 0; k < 2; k++) pending.push(call("background", 12_000));
  for (let i = 0; i < 40; i++) pending.push(call("background", 2_000));
  // the live lessons: a classify (~1.5k) and a reply (~4k) every 1 s for 3 minutes (≈ 330k TPM, 66% of the deployment)
  await clock.runUntil(180_000, (t) => { if (t % 1000 === 0) { pending.push(call("hot", 1_500)); pending.push(call("hot", 4_000)); } });
  await clock.runUntil(400_000);
  await Promise.all(pending);
  return { ...res, stats: L?.stats };
}

test("G-QUOTA: 20 Studio races + a consolidation burst on a shared deployment → 0 hot-path 429s (the control arm without lanes does 429)", async () => {
  const control = await simulate({ lanes: false });
  assert.ok(control.hot429 > 0, `control: the burst starves live replies (${control.hot429} hot 429s)`);
  const shaped = await simulate({ lanes: true });
  assert.equal(shaped.hot429, 0, `hot 429s with lanes: ${shaped.hot429}`);
  assert.equal(shaped.hot, 360);
  assert.equal(shaped.bg, 80, "every background call still ran (delayed, never dropped)");
  assert.ok(shaped.bgWaitMax > 10_000, "background calls waited for their bucket");
});

test("admit: hot and untagged calls never wait; background waits only when its 30% share is spent; a hot 429 pauses background", async () => {
  const clock = fakeTime();
  const L = createLanes({ now: clock.now, setTimer: clock.setTimer, tpm: { d: 100_000 } });
  assert.equal(L.admit({ quotaLane: "hot", deployment: "d", kind: "chat", estTokens: 99_000 }), undefined);
  assert.equal(L.admit({ deployment: "d", kind: "chat" }), undefined, "untagged = hot");
  // the background share is 30k tokens/min: 7 × 4k go at once, the 8th waits
  for (let i = 0; i < 7; i++) assert.equal(L.admit({ quotaLane: "background", deployment: "d", kind: "chat" }), undefined);
  const w = L.admit({ quotaLane: "background", deployment: "d", kind: "chat" });
  assert.ok(w instanceof Promise);
  let done = false; w.then(() => { done = true; });
  await clock.runUntil(30_000);
  assert.equal(done, false, "the share is per sliding minute: still waiting at 30 s");
  await clock.runUntil(61_000);
  assert.ok(done, "released when the first calls left the minute");
  // a hot 429 → background pauses 10 s
  L.settle({ quotaLane: "hot", deployment: "d", kind: "chat", status: 429 });
  const p = L.admit({ quotaLane: "background", deployment: "d", kind: "chat", estTokens: 100 });
  assert.ok(p instanceof Promise, "paused after a hot 429");
  let released = false; p.then(() => { released = true; });
  await clock.runUntil(66_000);
  assert.equal(released, false, "still paused 5 s later");
  await clock.runUntil(80_000);
  assert.equal(released, true);
  assert.equal(L.stats.hot429, 1);
  assert.equal(BACKGROUND_SHARE, 0.3);
});

test("the module's default lanes keep the azure.js contract: admit → undefined for hot and a first background call; settle never throws", () => {
  assert.equal(admit({ quotaLane: "hot", deployment: "taxila-fast", kind: "chat" }), undefined);
  assert.equal(admit({ quotaLane: "background", deployment: "lanes-test-dep", kind: "chat" }), undefined);
  assert.doesNotThrow(() => settle({ quotaLane: "background", deployment: "lanes-test-dep", kind: "chat", status: 200, usage: { in: "x", out: null } }));
  assert.doesNotThrow(() => settle(null));
  process.env.TAXILA_BG_TWINS = JSON.stringify({ "taxila-fast": "taxila-fast-bg" });
  try { assert.equal(twinFor("taxila-fast"), "taxila-fast-bg"); assert.equal(twinFor("taxila-brain"), null); } finally { delete process.env.TAXILA_BG_TWINS; }
});
