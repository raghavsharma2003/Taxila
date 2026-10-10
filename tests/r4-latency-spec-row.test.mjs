// r4-latency (patch 02): studioSeam.peekFactsRow is READ ONLY and gives the row the real turn adds (slotFor +
// factsRowForSlot) on a turn that leaves the screen as it is, so speculative replies carry it and their keys can match.
// Pure: the Stagecraft host is attached with instant-only builders, the evidence writer is a fake, no DB, no model.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as seam from "../server/studio/seam.js";
import * as bridge from "../server/stagecraft/seam-bridge.js";
import { StagecraftHost } from "../server/stagecraft/host.js";
import { createBuilders } from "../server/stagecraft/builders.js";
import { productionCatalog } from "../server/stagecraft/lesson.js";
import { stagecraftPointFor } from "../server/stagecraft/kernel-point.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { withFactsRows } from "../server/brain/turn.js";

const { studioSeam, _lesson, _setDeps, hostAnswer } = seam;
const T = "c6-maths-ch05-t02";
const kit = (() => { try { return kitFromFile(getTopic(T)); } catch { return null; } })();
const catalog = productionCatalog();
const instantOnly = () => ({ instant: createBuilders().instant, generatedSpec: async () => ({ ok: false }), image: async () => ({ ok: false }), liveCodegen: async () => ({ ok: false }), library: async () => ({ ok: false }) });
_setDeps({ writeEvidence: async () => ({ written: true }), q: async () => [], gateAvailable: () => false });

function lesson(id) {
  bridge.attach(id, new StagecraftHost({ lessonId: id, mode: "on", catalog, builders: instantOnly() }));
  studioSeam.prefetch({ lessonId: id, purpose: "practice", kit, topicId: T, child: { id: "child-1", class_level: 6, language_pref: "hinglish" } });
  const L = _lesson(id);
  L.child = { id: "child-1", class_level: 6 };
  return L;
}
const point = (id, turn, childText) => stagecraftPointFor({ lesson: { id, topic_id: T }, prev: { beat: { type: "explain" }, turn }, state: {}, kit, child: { class_level: 6, language_pref: "hinglish" }, childText, now: Date.now() });

/** A piece the child asked for, revealed on turn 4 and on screen after it. */
async function onScreen(id) {
  const L = lesson(id);
  for (let k = 0; k < 3; k++) studioSeam.statusFacts(id, { beat: "explain" });
  const view = studioSeam.statusFacts(id, { beat: "explain", stagecraftPoint: point(id, 4, "animation dikhao na") });
  studioSeam.slotFor(id, { reveal: view.propose.reveal }, { beat: "explain", tray: null, asking: true });
  await studioSeam.onReveal({ lessonId: id, childId: "child-1", turn: 4, studio: { reveal: view.propose.reveal } });
  return { L, piece: L.pieces.get(view.propose.reveal) };
}
const snapshot = (L) => JSON.stringify({ shown: L.shown, onScreen: L.onScreen, states: [...L.pieces.values()].map((p) => [p.intentId, p.state, p.heldTurn ?? null]) });

test("peekFactsRow = the row the next turn's slotFor + factsRowForSlot give when the screen does not change", { skip: !kit && "kit missing" }, async () => {
  const id = "r4l-peek-1";
  const { L, piece } = await onScreen(id);
  assert.equal(L.onScreen, piece.intentId);
  const before = snapshot(L);
  const peek = studioSeam.peekFactsRow(id, { tray: null });
  assert.equal(snapshot(L), before, "read only: nothing in the lesson's Studio state moved");
  assert.ok(peek && seam.isStudioRow(peek), peek);
  // the real next turn (no reveal, no retire, the tray is Studio's)
  studioSeam.statusFacts(id, { beat: "explain" });
  const slot = studioSeam.slotFor(id, null, { beat: "explain", tray: null });
  assert.equal(studioSeam.factsRowForSlot(id, slot), peek);
});

test("peekFactsRow follows the host's outcome, and gives nothing when the Director takes the tray or after a safety turn", { skip: !kit && "kit missing" }, async () => {
  const id = "r4l-peek-2";
  const { L, piece } = await onScreen(id);
  const t = piece.stagecraft.spec.task;
  const wrong = t.kind === "tap" ? "__x__" : t.kind === "order" ? [...t.items].reverse() : t.answer + 1e6;
  await hostAnswer({ lessonId: id, intentId: piece.intentId, value: { itemId: "task", value: wrong, correct: true }, child: L.child, lesson: { id } });
  const peek = studioSeam.peekFactsRow(id, { tray: null });
  studioSeam.statusFacts(id, { beat: "explain" });
  assert.equal(studioSeam.factsRowForSlot(id, studioSeam.slotFor(id, null, { beat: "explain", tray: null })), peek);
  assert.equal(studioSeam.peekFactsRow(id, { tray: "tiles" }), null);
  assert.equal(studioSeam.slotFor(id, null, { beat: "explain", tray: "tiles" }), null, "the real turn agrees: the Director's tray hides it");
  studioSeam.slotFor(id, null, { safety: true });
  assert.equal(studioSeam.peekFactsRow(id, { tray: null }), null);
  assert.equal(studioSeam.peekFactsRow("no-such-lesson"), null);
});

test("withFactsRows: content that does not change keeps the instructions as they are (no recompile)", () => {
  const same = { lastContent: ["fact one"] };
  assert.equal(withFactsRows(same, null, "INSTR", {}), "INSTR");
  assert.deepEqual(same.lastContent, ["fact one"]);
  // a compile that fails twice (here: no kit) leaves the content exactly as it was, as the turn always did
  const STALE = `${seam.STUDIO_ROW_PREFIX}shade_fraction · parts 4`;
  const next = { lastContent: ["fact one", STALE] };
  assert.equal(withFactsRows(next, null, "INSTR", { studioRow: `${seam.STUDIO_ROW_PREFIX}number_line_jump · to 3/4` }), "INSTR");
  assert.deepEqual(next.lastContent, ["fact one", STALE]);
});
