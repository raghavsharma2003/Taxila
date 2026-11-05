// Round 7 M5a (owner's #4 at $0): code-built cinematic scenes. Every pilot scene is clean in all three languages and
// certified at every viewport class; the timeline semantics the player draws are pinned; numbers on screen are computed;
// an "animation dikhao" on a pilot topic gets the scene through the seam (composeAsk → slotFor), any other topic does not.
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeScene, lintScene, sceneAt, lineWarp, stillAt } from "../shared/scene.js";
import { SCENES, sceneFor } from "../server/forge/animate/scenes.js";
import { certifyForTray } from "../server/forge3/tray-gate.js";
import * as seam from "../server/studio/seam.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";

test("scenes: 20 pilot topics (10 maths, 10 science), clean in en / hinglish / hi, certified at p360, p412, l1366 for both bands", () => {
  const ids = Object.keys(SCENES);
  assert.equal(ids.length, 20);
  assert.equal(ids.filter((t) => /-maths-/.test(t)).length, 10);
  for (const t of ids) for (const lang of ["en", "hinglish", "hi"]) {
    const r = sceneFor(t, { lang });
    assert.ok(r.ok, `${t} ${lang}: ${r.errors.join(",")}`);
    for (const vp of ["p360", "p412", "l1366"]) for (const young of [false, true]) assert.ok(certifyForTray({ kind: "scene", scene: r.scene }, { vp, young }).ok, `${t} ${lang} ${vp} ${young}`);
  }
  assert.equal(sceneFor("c9-maths-ch01-t01"), null);
});

test("scene timeline: rest until the first key, eased between keys, held after; loops; reduced motion holds each beat", () => {
  const n = normalizeScene({ durationMs: 6000, actors: [{ id: "d", prop: "drop", at: [50, 50], opacity: 0 }],
    tracks: [{ actor: "d", keys: [{ t: 1000, at: [50, 50], opacity: 1 }, { t: 3000, at: [50, 250] }] }], beats: [{ t: 0, says: "a" }, { t: 3000, says: "b" }] });
  assert.ok(n.ok, n.errors.join(","));
  const at = (t) => sceneAt(n.scene, t).actors[0];
  assert.equal(at(500).opacity, 0, "at rest before its first key");
  assert.equal(at(1000).opacity, 1);
  assert.equal(at(2000).y, 150, "eased midpoint");
  assert.equal(at(5000).y, 250, "held after the last key");
  assert.equal(stillAt(n.scene, 2500), 0);
  assert.equal(stillAt(n.scene, 3500), 3000);
  // her clauses: beat 1 (clause 1) is pinned to the clause's onset
  const s2 = normalizeScene({ ...n.scene, beats: [{ t: 0, clause: 0, says: "a" }, { t: 3000, clause: 1, says: "b" }] }).scene;
  const warp = lineWarp(s2, [0, 6000]);
  assert.equal(Math.round(warp(6000)), 3000);
  assert.equal(Math.round(warp(3000)), 1500);
  assert.ok(lintScene(normalizeScene({ durationMs: 6000, actors: [{ id: "x", prop: "sun", at: [500, 50] }], beats: [{ t: 0, says: "a" }] }).scene).some((i) => i.startsWith("off_stage")));
});

test("numbers on screen are computed: 12 laddoos in 3 plates end 4 to a plate; the ant's walk is 2 × (6 + 4)", () => {
  const s = sceneFor("c4-maths-ch09-t02", { lang: "en" }).scene;
  assert.equal(s.facts.each, 4);
  const end = sceneAt(s, s.durationMs).actors.filter((a) => a.id.startsWith("l"));
  const plates = [90, 200, 310];
  const per = plates.map((x) => end.filter((a) => Math.abs(a.x - x) <= 30 && a.y > 200).length);
  assert.deepEqual(per, [4, 4, 4]);
  const p = sceneFor("c6-maths-ch06-t01", { lang: "en" }).scene;
  assert.equal(p.facts.perimeter, "20 m");
  assert.ok(p.captions.some((c) => c.text === "Perimeter = 20 m"));
  const ant = sceneAt(p, p.durationMs).actors.find((a) => a.id === "ant");
  assert.deepEqual([ant.x, ant.y], [92, 80], "back where it started");
});

test("seam: 'animation dikhao' on a pilot topic is answered by its scene; a topic with no scene is not", async () => {
  const { studioSeam, _lesson, _setDeps } = seam;
  _setDeps({ writeEvidence: async () => ({ written: true }), q: async () => [], gateAvailable: () => false });
  const T = "c4-maths-ch05-t01";
  const kit = kitFromFile(getTopic(T));
  const id = "scene-ask-1";
  studioSeam.prefetch({ lessonId: id, purpose: "practice", kit, topicId: T, child: { id: "child-1", class_level: 4, language_pref: "hinglish" } });
  _lesson(id).child = { id: "child-1", class_level: 4, language_pref: "hinglish" };
  const r = await studioSeam.composeAsk(id, { visual: "animation", topicId: T, child: { id: "child-1", class_level: 4, language_pref: "hinglish" } });
  assert.equal(r?.kind, "scene");
  const slot = studioSeam.slotFor(id, null, { beat: "explain", tray: null, visualRequest: true });
  assert.equal(slot?.artifact?.kind, "scene");
  assert.equal(slot.artifact.scene.id, "equal-parts");
  assert.match(studioSeam.factsRowForSlot(id, slot) ?? "", /1\/4/, "her facts row names what the film shows");
  // a game ask on the same topic is not a scene
  const g = await studioSeam.composeAsk(id, { visual: "game", topicId: T, child: { id: "child-1", class_level: 4 } });
  assert.notEqual(g?.kind, "scene");
});

test("withholding: a scene never plays while a keyed card is live, never when the key is unknown, never showing a held value", async () => {
  const { sceneValues, sceneShowsHeld, sceneMayPlay } = await import("../shared/scene.js");
  const parts = sceneFor("c4-maths-ch05-t01", { lang: "en" }).scene;
  assert.ok(sceneValues(parts).includes("1/4"));
  assert.deepEqual(sceneShowsHeld(parts, ["2/8"]), ["1/4"], "rational equality: 2/8 is the 1/4 on screen");
  assert.equal(sceneMayPlay(parts, { held: [] }).ok, true);
  assert.equal(sceneMayPlay(parts, { held: [], cardLive: true }).why, "card_live");
  assert.equal(sceneMayPlay(parts, { held: null }).why, "held_unknown");
  assert.match(sceneMayPlay(parts, { held: ["1/4"] }).why, /^shows_held:1\/4/);
  assert.equal(sceneMayPlay(parts, { held: ["7"] }).why, "card_live", "any live key: no scene, even one that shows another value");
  // every pilot: its values are found (no scene can show a number the check does not see)
  for (const t of Object.keys(SCENES)) {
    const s = sceneFor(t, { lang: "en" }).scene;
    for (const v of sceneValues(s)) assert.ok(sceneShowsHeld(s, [v]).length, `${t}: ${v}`);
  }
});

test("seam withholding: no scene comes up on a turn with a card open, and one on screen leaves when a card goes live", async () => {
  const { studioSeam, _lesson } = seam;
  const T = "c4-maths-ch05-t01";
  const kit = kitFromFile(getTopic(T));
  const child = { id: "child-1", class_level: 4, language_pref: "hinglish" };
  const mk = (id) => { studioSeam.prefetch({ lessonId: id, purpose: "practice", kit, topicId: T, child }); _lesson(id).child = child; return _lesson(id); };
  // a key held from the last turn: composeAsk gives no scene
  const L1 = mk("scene-held-1");
  studioSeam.noteWithheld("scene-held-1", ["1/4"]);
  assert.notEqual((await studioSeam.composeAsk("scene-held-1", { visual: "animation", topicId: T, child }))?.kind, "scene");
  assert.ok(![...L1.pieces.values()].some((p) => p.source === "scene"));
  // composed with no card, but this turn's move asks an item: not shown, retired
  const L2 = mk("scene-held-2");
  assert.equal((await studioSeam.composeAsk("scene-held-2", { visual: "animation", topicId: T, child }))?.kind, "scene");
  assert.equal(studioSeam.slotFor("scene-held-2", null, { beat: "explain", tray: null, visualRequest: true, asking: true }), null);
  assert.equal([...L2.pieces.values()].find((p) => p.source === "scene").retiredWhy, "card_live");
  // shown, then a card opens (patch 010's itemOpen): it leaves
  const L3 = mk("scene-held-3");
  await studioSeam.composeAsk("scene-held-3", { visual: "animation", topicId: T, child });
  assert.equal(studioSeam.slotFor("scene-held-3", null, { beat: "explain", tray: null, visualRequest: true })?.artifact?.kind, "scene");
  await studioSeam.onReveal({ lessonId: "scene-held-3", childId: child.id, turn: L3.turn, studio: { reveal: [...L3.pieces.values()].find((p) => p.source === "scene").intentId } });
  assert.equal(studioSeam.slotFor("scene-held-3", null, { beat: "practice_set", tray: null, itemOpen: true }), null);
  assert.equal(L3.onScreen, null);
  // the key could not be computed (noteWithheld null): fail closed
  mk("scene-held-4");
  studioSeam.noteWithheld("scene-held-4", null);
  assert.notEqual((await studioSeam.composeAsk("scene-held-4", { visual: "animation", topicId: T, child }))?.kind, "scene");
});
