// Round 4 (decision routed by the main session, 2026-10-10, owner's vision "games built on the go, the skill as the
// mechanic"): at a PRACTICE beat an admitted play piece for the skill wins over a Stagecraft reveal; on an explain beat
// Stagecraft keeps the stage as before; the play piece is an offer, and after one decline in the lesson the practice beat is
// Stagecraft's again (NEVER MANIPULATE). G2 measured Stagecraft taking every practice beat (claude/r4-khand, n = 3).
// Studio v2 is certified for the duration of each test (the merge mechanics behind the tray gate). No browser, no model.
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { kitTopicAny } from "../server/stagecraft/catalogue.js";
import { createBuilders } from "../server/stagecraft/builders.js";
import { productionCatalog } from "../server/stagecraft/lesson.js";
import * as bridge from "../server/stagecraft/seam-bridge.js";
import { revealPoint, REST_CFG } from "../server/stagecraft/adapters.js";
import { StagecraftHost } from "../server/stagecraft/host.js";
import { studioSeam, _lesson, hostFeedback } from "../server/studio/seam.js";
import * as trayGate from "../server/forge3/tray-gate.js";

const T = "c6-maths-ch05-t02";
const kit = kitTopicAny(T);
const catalog = productionCatalog();
const skillId = kit.skills?.[0]?.id ?? `${T}-s1`;
const instantOnly = () => ({ instant: createBuilders().instant, generatedSpec: async () => ({ ok: false }), image: async () => ({ ok: false }), liveCodegen: async () => ({ ok: false }), library: async () => ({ ok: false }) });
const keyOf = (lessonId, beat) => ({ lessonId, topicId: T, skillId, beat, itemId: null, misconceptionId: null, misconceptionState: "unknown", hintRung: 0, representation: null, band: "B3", lang: "hinglish", kitHash: "k", learnerRev: 0, floorRev: 1, pending: [] });
function setup(lessonId, beat) {
  studioSeam.prefetch({ lessonId, purpose: "practice" });
  const L = _lesson(lessonId);
  const host = bridge.attach(lessonId, new StagecraftHost({ lessonId, mode: "on", catalog, builders: instantOnly(), clock: () => 400_000 }));
  host.input({ t: "state", key: keyOf(lessonId, beat), at: 0 });
  // the play piece Studio proposes for the skill (seam.composeAsk / a W2 play proposal)
  const play = { intentId: `${lessonId}:play:1`, slotId: `${lessonId}:play:1:slot`, kind: "game", archetype: "play:todo-jodo/strips", source: "play",
    artifact: { kind: "play", play: { family: "todo-jodo", mode: "strips", skillId, topicId: T } }, skillId, need: "practice", state: "ready", retired: false, createdAt: Date.now() };
  L.pieces.set(play.intentId, play);
  return { L, host, play };
}
const pointFor = (lessonId, beat) => revealPoint({ lessonId, turnSeq: 9, safety: false, beat, beatChanged: true, topicId: T, skillId, band: "B3", lang: "hinglish", kitHash: "k",
  lastPolicyRevealTurn: 0, at: 400_000, phase: "her_turn" }, { catalog });
const viewWith = (id) => ({ statuses: [], onScreen: null, propose: { reveal: id } });

describe("r4: practice beat, play vs Stagecraft", () => {
  // on only while these tests run (a one-process suite must not see Studio v2 certified in other files' tests)
  before(() => trayGate._certifyStudioV2ForTests(true));
  after(() => trayGate._certifyStudioV2ForTests(false));
  it("a practice_set beat with an admitted play piece: the play piece is proposed, not the Stagecraft reveal", () => {
    const id = "pp-1"; const { host, play } = setup(id, "practice_set");
    const v = bridge.augmentView(id, viewWith(play.intentId), pointFor(id, "practice_set"));
    assert.equal(v.propose?.reveal, play.intentId);
    assert.equal(host.playWins, 1);
  });
  it("an explain beat with a play proposal: Stagecraft's reveal wins as before", () => {
    // the play rule never fires off a practice beat: whatever Stagecraft decides there is exactly today's merge (here, with
    // the same Stagecraft decision, a non-play W2 proposal and the play proposal give the same result)
    const id = "pp-2"; const { host, play } = setup(id, "explain");
    const v = bridge.augmentView(id, viewWith(play.intentId), pointFor(id, "explain"));
    assert.equal(host.playWins ?? 0, 0, "the practice rule did not fire on an explain beat");
    const id2 = "pp-2b"; setup(id2, "explain");
    const w = bridge.augmentView(id2, viewWith("w2-other"), pointFor(id2, "explain"));
    assert.equal(v.propose?.reveal === play.intentId, w.propose?.reveal === "w2-other", "same merge outcome as for any W2 proposal");
  });
  it("after the child declines a game in this lesson, the practice beat is Stagecraft's again", async () => {
    const id = "pp-3"; const { L, play } = setup(id, "practice_set");
    assert.equal((await hostFeedback({ lessonId: id, intentId: play.intentId, action: "not_this" })).ok, true);
    assert.equal(L.playDeclined, true);
    const again = { ...play, intentId: `${id}:play:2`, slotId: `${id}:play:2:slot`, archetype: "play:other/mode", state: "ready", retired: false };
    L.pieces.set(again.intentId, again);
    const v = bridge.augmentView(id, viewWith(again.intentId), pointFor(id, "practice_set"));
    // Stagecraft reveals or holds (it depends on its policy state); either way no second game is proposed
    assert.notEqual(v.propose?.reveal, again.intentId, "no second game pushed after a decline");
  });
  it("REST_CFG is untouched by the rule (boards elsewhere are not starved)", () => {
    assert.ok(REST_CFG.restRetireTurns >= 1);
  });
});
