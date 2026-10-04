// W1-B #5, review fix: the turn-path Forge warmer is live on a replica that has served NO lesson start (a scale-out, a
// restart or a deploy with lessons in progress). Before, it was registered only inside prefetchLessonFills, so such a
// replica never warmed a missed item and its lessons got no G1 fills for their whole remaining length.
// Each case runs in a FRESH process (the live server's import path: server/forge/seam.js, which routes/lesson.js
// imports), offline (code pick, no model, no Neon, no Blob), with no lesson start and no prefetch.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const ROOT = new URL("..", import.meta.url).pathname;
const UUID = "7d4f2c1e-9a3b-4c5d-8e6f-0a1b2c3d4e5f";

function fresh(body, extraEnv = {}) {
  const { NODE_TEST_CONTEXT, ...env } = process.env;
  const src = `
    const { hasFillWarmer, peekLessonFill, _settleLesson } = await import("./server/forge/lesson-fills.js");
    await import("./server/forge/seam.js");
    const { planModule } = await import("./server/director/modules.js");
    const { getKit } = await import("./server/content/index.js");
    const { diagnosticItems } = await import("./server/forge/derive.js");
    const { requestFill } = await import("./server/forge/index.js");
    const out = { warmer: hasFillWarmer() };
    ${body}
    console.log("RESULT " + JSON.stringify(out));
    process.exit(0);`;
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", src], { cwd: ROOT, encoding: "utf8", timeout: 120_000,
    env: { ...env, FORGE_FLAVOUR: "off", FORGE_DB_CACHE: "off", FORGE_BLOB: "off", ...extraEnv } });
  const line = (r.stdout || "").split("\n").find((l) => l.startsWith("RESULT "));
  assert.ok(line, `child failed (status ${r.status}): ${(r.stderr || "").slice(-600)}`);
  return JSON.parse(line.slice(7));
}

const WALK = (lessonId) => `
    const kit = await getKit("c5-english-ch02-t01", { generate: false });
    const learner = { child: { classLevel: 5, languagePref: "hinglish", interests: [] }, recentWrong: [], activeMisconceptions: [], pKnown: {} };
    let item = null;
    for (const it of [...kit.items, ...diagnosticItems(kit)]) {
      if ((await requestFill({ kit, item: it, move: "practice", learner, needByMs: 10_000, noGapRow: true })).status === "ready") { item = it; break; }
    }
    const s = { module: null, turn: 1, activeItemId: item.id, ctx: { sessionId: ${JSON.stringify(lessonId)}, lang: "hinglish", classLevel: 5, ageBand: "10-15" } };
    const first = planModule(s, { kit, item, move: { kind: "practice" }, lang: "hinglish", band: "B3" });
    await _settleLesson(${JSON.stringify(lessonId)}, 60_000);
    s.turn++;
    const second = planModule(s, { kit, item, move: { kind: "practice" }, lang: "hinglish", band: "B3" });
    const g1 = (cmds) => cmds.some((c) => c.op === "mount" && c.goal === "g1:" + item.id);
    Object.assign(out, { item: item.id, firstG1: g1(first), warm: !!peekLessonFill(${JSON.stringify(lessonId)}, item.id), secondG1: g1(second) });`;

test("a fresh server process with no lesson start: the item misses once, then the next posing mounts its G1 fill", () => {
  const r = fresh(WALK(UUID));
  assert.equal(r.warmer, true, "the live server registers the warmer at import, not on a lesson start");
  assert.equal(r.firstG1, false, `first posing of ${r.item} is a miss (nothing prefetched on this replica)`);
  assert.equal(r.warm, true, "the miss warmed the item in the background");
  assert.equal(r.secondG1, true, "the next posing mounts the G1 fill");
});

test("the default warmer warms only real lessons (uuid ids): an eval's made-up session id fires no fill", () => {
  const r = fresh(WALK("eval"));
  assert.equal(r.warmer, true);
  assert.equal(r.warm, false);
  assert.equal(r.secondG1, false);
});

test("under the test runner (NODE_TEST_CONTEXT) or FORGE_TURN_WARM=off, importing the seam registers no warmer", () => {
  assert.equal(fresh("", { NODE_TEST_CONTEXT: "child-v8" }).warmer, false);
  assert.equal(fresh("", { FORGE_TURN_WARM: "off" }).warmer, false);
});
