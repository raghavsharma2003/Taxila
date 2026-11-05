// Round 7 M4 (studio-stagecraft-sources-unfed): the point's skill is the skill being taught, the sources are fed at the
// reveal point (state → invalidation, beat lookahead, stuck signal), the seam never reveals or keeps a Stagecraft piece of
// another skill than the move's (slotFor hint.skillId, patch to Brain 009), and the offline replay runs on the production
// path. Pure: instant-only builders, no DB, no model.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as seam from "../server/studio/seam.js";
import * as bridge from "../server/stagecraft/seam-bridge.js";
import { StagecraftHost } from "../server/stagecraft/host.js";
import { createBuilders } from "../server/stagecraft/builders.js";
import { productionCatalog } from "../server/stagecraft/lesson.js";
import { stagecraftPointFor, kernelPoint, newKernelView, feedPoint, stuckOn, feedsOn } from "../server/stagecraft/kernel-point.js";
import { beatLookahead } from "../server/stagecraft/lookahead.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";

const { studioSeam, _lesson, _setDeps } = seam;
const T = "c6-maths-ch05-t02";
const kit = (() => { try { return kitFromFile(getTopic(T)); } catch { return null; } })();
const catalog = productionCatalog();
const instantOnly = () => ({ instant: createBuilders().instant, generatedSpec: async () => ({ ok: false }), image: async () => ({ ok: false }), liveCodegen: async () => ({ ok: false }), library: async () => ({ ok: false }) });
// (no writeEvidence here: in a single-process run a module-level override replaced p4-content-seam's evidence recorder)
_setDeps({ q: async () => [], gateAvailable: () => false });
const S1 = kit?.skills?.[0]?.id, S2 = kit?.skills?.[1]?.id;

function lesson(id, rows) {
  const host = bridge.attach(id, new StagecraftHost({ lessonId: id, mode: "on", catalog, builders: instantOnly(), sink: rows ? (r) => rows.push(r) : undefined }));
  studioSeam.prefetch({ lessonId: id, purpose: "practice", kit, topicId: T, child: { id: "child-1", class_level: 6, language_pref: "hinglish" } });
  const L = _lesson(id);
  L.child = { id: "child-1", class_level: 6 };
  return { host, L };
}
const point = (id, turn, childText, state = {}) => stagecraftPointFor({ lesson: { id, topic_id: T }, prev: { beat: { type: "explain" }, turn }, state, kit,
  child: { class_level: 6, language_pref: "hinglish" }, childText, now: Date.now() });

async function revealed(id, skill) {
  const gate = await import("../server/forge3/tray-gate.js");
  gate._certifyStudioV2ForTests(true);
  for (let k = 0; k < 3; k++) studioSeam.statusFacts(id, { beat: "explain" });
  const p = point(id, 4, "animation dikhao na", { lastMove: { skillId: skill } });
  const view = studioSeam.statusFacts(id, { beat: "explain", stagecraftPoint: p });
  return { p, view, gate };
}

test("M4: the reveal point carries the skill being taught (the Director's last move), the kit's first skill only before one", () => {
  assert.ok(S1 && S2 && S1 !== S2, "the fixture kit has two skills");
  const id = "m4-skill"; lesson(id);
  assert.equal(point(id, 4, "", { lastMove: { skillId: S2 } }).current.skillId, S2);
  assert.equal(point(id, 5, "", {}).current.skillId, S1);
  assert.equal(stuckOn({ history: { [S2]: ["correct", "incorrect", "incorrect"] } }, S2), true);
  assert.equal(stuckOn({ history: { [S2]: ["incorrect", "correct"] } }, S2), false);
  assert.equal(feedsOn({ STAGECRAFT_FEEDS: "off" }), false);
  assert.equal(feedsOn({}), true);
  bridge.detach(id);
});

test("M4: feedPoint invalidates on a skill change and nominates the beat lookahead (silent: nothing revealed)", () => {
  const rows = [];
  const host = new StagecraftHost({ lessonId: "m4-feed", mode: "on", catalog, builders: instantOnly(), sink: (r) => rows.push(r) });
  const v = newKernelView(), fed = {};
  const at = 1_000_000;
  const x = (skillId, beat, turn) => ({ lesson: { id: "m4-feed", topic_id: T }, prev: { beat: { type: beat }, turn }, state: {}, kit, child: { class_level: 6 }, skillId, now: at + turn * 20_000 });
  const p1 = kernelPoint(v, x(S1, "explain", 3), { catalog });
  feedPoint(host, fed, p1);
  const planned = rows.filter((r) => r.kind === "nominated" && r.source === "plan_lookahead");
  assert.ok(planned.length >= 1, "the next beats of the arc are nominated");
  assert.ok(planned.every((r) => r.family.startsWith(`${S1}|`)), "for the skill being taught");
  assert.ok(host.state.candidates.some((c) => c.premise.skillId === S1), "built silently");
  assert.equal(rows.filter((r) => r.kind === "point").length, 0, "no reveal from a feed");
  const p2 = kernelPoint(v, x(S2, "explain", 4), { catalog });
  feedPoint(host, fed, p2);
  assert.ok(rows.some((r) => r.kind === "invalidated" && r.reason === "topic_change"), "the old skill's candidates die the moment the skill changes");
  assert.ok(!host.state.candidates.some((c) => c.state === "ready" && c.premise.skillId === S1), "nothing of the old skill stays ready");
  assert.deepEqual(beatLookahead({ beat: "explain", skillId: S1, topicId: T, at: 0 }).beats.map((b) => b.beat), ["explain", "worked_example", "practice_set"]);
  assert.equal(beatLookahead({ beat: "break", skillId: S1, topicId: T, at: 0 }), null);
  host.close();
});

test("M4 never stale: a piece decided for the old skill is not revealed when the move changed the skill", async (tc) => {
  const id = "m4-guard-1"; const { L, host } = lesson(id);
  const { view, gate } = await revealed(id, S1);
  tc.after(() => { gate._certifyStudioV2ForTests(false); bridge.detach(id); });
  assert.ok(view?.propose?.reveal, "Stagecraft proposes for the request");
  const slot = studioSeam.slotFor(id, { reveal: view.propose.reveal }, { beat: "explain", tray: null, asking: false, skillId: S2 });
  assert.equal(slot, null, "not under her line about another skill");
  assert.equal(L.pieces.get(view.propose.reveal).retiredWhy, "skill_changed");
  assert.equal(host.state.meta.onStageCand, null, "the conductor sees an empty stage again");
});

test("M4 never stale: the same skill reveals; a piece still up leaves with the reply that changes the skill", async (tc) => {
  const id = "m4-guard-2"; const { L } = lesson(id);
  const { view, gate } = await revealed(id, S1);
  tc.after(() => { gate._certifyStudioV2ForTests(false); bridge.detach(id); });
  const slot = studioSeam.slotFor(id, { reveal: view.propose.reveal }, { beat: "explain", tray: null, asking: false, skillId: S1 });
  assert.equal(slot?.artifact?.kind, "stagecraft");
  await studioSeam.onReveal({ lessonId: id, childId: "child-1", turn: 4, studio: { reveal: view.propose.reveal } });
  assert.equal(L.onScreen, view.propose.reveal);
  assert.equal(studioSeam.slotFor(id, null, { beat: "explain", tray: null, skillId: S1 })?.artifact?.kind, "stagecraft", "stays while the skill holds");
  assert.equal(studioSeam.slotFor(id, null, { beat: "explain", tray: null, skillId: S2 }), null);
  assert.equal(L.onScreen, null);
  assert.equal(L.pieces.get(view.propose.reveal).retiredWhy, "skill_changed");
  // without the hint (Brain's patch 009 not applied) the seam is unchanged
  const id2 = "m4-guard-3"; lesson(id2);
  const r2 = await revealed(id2, S1);
  assert.equal(studioSeam.slotFor(id2, { reveal: r2.view.propose.reveal }, { beat: "explain", tray: null })?.artifact?.kind, "stagecraft");
  bridge.detach(id2);
});

test("M4 replay: a recorded lesson through the production path; the guard arm serves nothing stale", async () => {
  const { replayLesson } = await import("../evals/stagecraft/replay.mjs");
  const dir = "evals/conversation-r3/results/final6-after/lessons";
  const files = fs.readdirSync(dir).sort().slice(0, 4);
  for (const f of files) {
    const rec = { ...JSON.parse(fs.readFileSync(`${dir}/${f}`, "utf8")) };
    rec.slot = `t:${rec.slot}`;
    const g = await replayLesson(rec, "guard", { catalog });
    assert.equal(g.staleServed, 0, f);
    assert.equal(g.staleStage, 0, f);
    assert.ok(g.stageActive >= 0 && g.stageActive <= 1);
  }
});
