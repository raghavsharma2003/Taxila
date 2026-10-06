// ship5 p4-content: the Studio seam WITH patch 03 applied (docs/design/ship5/p4-content/patches/03-studio-seam.diff).
// Skipped until the patch lands (the seam then exports prepareWhiteboard); after it, every case must pass. Pure: the
// Stagecraft host is attached with instant-only builders, the planner and the evidence writer are fakes, no DB, no model.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as seam from "../server/studio/seam.js";
import * as bridge from "../server/stagecraft/seam-bridge.js";
import { StagecraftHost } from "../server/stagecraft/host.js";
import { createBuilders } from "../server/stagecraft/builders.js";
import { productionCatalog } from "../server/stagecraft/lesson.js";
import { stagecraftPointFor, kernelView } from "../server/stagecraft/kernel-point.js";
import { catalogueEntry } from "../server/stagecraft/catalogue.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";

const { studioSeam, _lesson, _setDeps, hostAnswer, isStudioRow, STUDIO_ROW_PREFIX, STUDIO_LIMITS } = seam;
const PATCHED = typeof studioSeam.prepareWhiteboard === "function";
const skip = PATCHED ? false : "patch 03 (server/studio/seam.js) not applied yet";

const T = "c6-maths-ch05-t02";
const kit = (() => { try { return kitFromFile(getTopic(T)); } catch { return null; } })();
const catalog = productionCatalog();
const instantOnly = () => ({ instant: createBuilders().instant, generatedSpec: async () => ({ ok: false }), image: async () => ({ ok: false }), liveCodegen: async () => ({ ok: false }), library: async () => ({ ok: false }) });
const written = [];
_setDeps({ writeEvidence: async (_child, ev) => { written.push(ev); return { written: true }; }, q: async () => [], gateAvailable: () => false });

function lesson(id) {
  // the host is attached BEFORE the prefetch, so the seam's startStagecraft finds it (no production deps, no network)
  const host = bridge.attach(id, new StagecraftHost({ lessonId: id, mode: "on", catalog, builders: instantOnly() }));
  studioSeam.prefetch({ lessonId: id, purpose: "practice", kit, topicId: T, child: { id: "child-1", class_level: 6, language_pref: "hinglish" } });
  const L = _lesson(id);
  L.child = { id: "child-1", class_level: 6 };
  return { host, L };
}
const point = (id, turn, childText) => stagecraftPointFor({ lesson: { id, topic_id: T }, prev: { beat: { type: "explain" }, turn }, state: {}, kit, child: { class_level: 6, language_pref: "hinglish" }, childText, now: Date.now() });

test("seam (patch 03): a child's request is proposed, shown by slotFor, revealed by onReveal and graded by the HOST", { skip }, async () => {
  const id = "p4s-1"; const { L } = lesson(id);
  for (let k = 0; k < 3; k++) studioSeam.statusFacts(id, { beat: "explain" });       // past the first-reveal turn
  const p = point(id, 4, "animation dikhao na");
  assert.equal(p.want?.childRequested, true);
  const view = studioSeam.statusFacts(id, { beat: "explain", stagecraftPoint: p });
  assert.ok(view?.propose?.reveal, "Stagecraft proposes even with no Wave 2 piece in the lesson");
  assert.equal(view.propose.requested, true);
  const slot = studioSeam.slotFor(id, { reveal: view.propose.reveal }, { beat: "explain", tray: null, asking: true });
  assert.equal(slot?.artifact?.kind, "stagecraft", "her own question does not hold a piece the child asked for");
  assert.equal(slot.artifact.stagecraft.archetype, "scene-explainer@1");
  assert.deepEqual(slot.artifact.stagecraft.spec, catalogueEntry(T).explainer.spec);
  const row = studioSeam.factsRowForSlot(id, slot);
  assert.ok(row?.startsWith(STUDIO_ROW_PREFIX) && isStudioRow(row), "a stage-tagged row the turn strips next time");
  await studioSeam.onReveal({ lessonId: id, childId: "child-1", turn: 4, studio: { reveal: view.propose.reveal } });
  const piece = L.pieces.get(view.propose.reveal);
  assert.equal(piece.state, "revealed"); assert.equal(L.onScreen, piece.intentId);
  const spec = piece.stagecraft.spec, t = spec.task;
  const right = t.kind === "tap" ? t.answer : t.kind === "order" ? t.items : t.answer;
  const wrong = t.kind === "tap" ? "__x__" : t.kind === "order" ? [...t.items].reverse() : t.answer + 1e6;
  const w = await hostAnswer({ lessonId: id, intentId: piece.intentId, value: { itemId: "task", value: wrong, correct: true }, child: L.child, lesson: { id } });
  assert.equal(w.correct, false, "a forged correct:true is wrong");
  const r = await hostAnswer({ lessonId: id, intentId: piece.intentId, value: { itemId: "task", value: right, correct: false }, child: L.child, lesson: { id } });
  assert.equal(r.correct, true); assert.equal(r.complete, true);
  assert.ok(written.some((ev) => ev?.via === "studio"), "a host-graded kt_evidence event");
  assert.equal(kernelView(id).wrong >= 0, true);
  bridge.detach(id);
});

test("seam (patch 03): a safeguard quarantines Stagecraft for the rest of the lesson", { skip }, () => {
  const id = "p4s-2"; const { host } = lesson(id);
  for (let k = 0; k < 3; k++) studioSeam.statusFacts(id, { beat: "explain" });
  studioSeam.onSafety(id);
  assert.equal(host.state.quarantined, true);
  const v = studioSeam.statusFacts(id, { beat: "explain", stagecraftPoint: point(id, 5, "game khelna hai") });
  assert.ok(!v?.propose?.reveal, "nothing new on stage after a safeguard");
  bridge.detach(id);
});

test("seam (patch 03): spacing is 2 with a Stagecraft host (P5) and stays 4 without one; off = no host = the Wave 2 view", { skip }, () => {
  assert.equal(STUDIO_LIMITS.turnsBetweenReveals, 4);
  assert.equal(STUDIO_LIMITS.stagecraftTurnsBetweenReveals, 2);
  const id = "p4s-3";
  studioSeam.prefetch({ lessonId: id, purpose: "practice" });
  bridge.detach(id);
  assert.equal(studioSeam.statusFacts(id, { beat: "explain", stagecraftPoint: null }), null);
});

test("seam (patch 03): the whiteboard ask goes through board sync (speculative board first, then the line plan)", { skip }, async () => {
  const id = "p4s-4"; lesson(id);
  bridge.detach(id);
  const script = { v: 1, scriptId: "s", line: { lessonId: id }, anchor: "line_audio_start", board: { w: 400, h: 300, ground: "chalk" }, mode: "fresh", durationMs: 3000,
    ops: [0, 1, 2].map((i) => ({ id: `r${i}`, op: "rect", at: [20 + i * 120, 120], w: 100, h: 60, startMs: 200 + i * 700, endMs: 600 + i * 700 })) };
  let lineCalls = 0;
  _setDeps({ planWhiteboard: async (ask) => { if (/Three boxes/.test(ask.line.text)) return { ok: true, script, usd: 0 }; lineCalls++; return { ok: false, usd: 0 }; } });
  const intent = { intentId: `${id}:wb:5`, lessonId: id, kind: "whiteboard", skillId: kit?.skills?.[0]?.id, need: "explain", beat: "explain", neededAtMs: 0, priority: "on_cue", style: { band: "B3", lang: "hinglish", motion: "lively" } };
  const ask = { intent, line: { lessonId: id, text: "" }, mode: "fresh", kit: { topicId: T, content: ["Three boxes in a row."] } };
  assert.equal(studioSeam.prepareWhiteboard(ask), true);
  await new Promise((r) => setTimeout(r, 10));
  const ack = studioSeam.requestIntent({ ...ask, line: { lessonId: id, text: "Dekho, teen boxes ek line mein." } });
  assert.equal(ack?.state, "planning");
  await new Promise((r) => setTimeout(r, 30));
  const s = seam.slotSnapshot(id, intent.intentId);
  assert.equal(s?.artifact?.kind, "whiteboard"); assert.equal(lineCalls, 0, "the speculative board answered; no line plan paid for");
  assert.equal(_lesson(id).pieces.get(intent.intentId).boardSource, "spec");
});
