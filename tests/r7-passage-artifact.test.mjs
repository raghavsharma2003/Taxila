// The passage artifact (main's yes 2026-11-10: a passage is reading matter, not a board): server/studio/passage.js
// passageArtifact, the tray gate's "passage" predicate at the three sizes, and the seam's showPassage (one piece per passage,
// a later call turns the page).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { passageArtifact, pagePassage } from "../server/studio/passage.js";
import { certifyForTray } from "../server/forge3/tray-gate.js";
import * as seam from "../server/studio/seam.js";

const KITS = new URL("../data/kits/", import.meta.url);
const passages = readdirSync(KITS).filter((f) => f.endsWith(".json")).flatMap((f) => (JSON.parse(readFileSync(new URL(f, KITS), "utf8")).topics ?? []).flatMap((t) => t.passages ?? []));

test("passage artifact: the kit's pages exactly, the page clamped; every kit passage certified by predicate at p360, p412 and l1366 (Older and Young)", () => {
  for (const p of passages) {
    const a = passageArtifact(p, { page: 99 });
    assert.equal(a.kind, "passage");
    assert.deepEqual(a.passage.pages.map((x) => x.text), pagePassage(p).pages.map((x) => x.text));
    assert.equal(a.passage.page, a.passage.pages.length, "page clamped to the last");
    for (const vp of ["p360", "p412", "l1366"]) for (const young of [false, true]) assert.equal(certifyForTray(a, { vp, young }).ok, true, `${p.id} ${vp} young=${young}`);
  }
  assert.equal(certifyForTray(passageArtifact(passages[0]), { vp: "p360", box: { w: 120, h: 300 } }).ok, false, "a box too narrow for a line of 12 is refused");
  assert.equal(certifyForTray(passageArtifact(passages[0]), { vp: "p360", box: { w: 328, h: 60 } }).ok, false, "a box too short for 2 lines is refused");
});

test("seam showPassage: the passage on the tray at her page; a later call turns the page of the same piece", () => {
  const L = `passage-${Date.now()}`;
  seam.studioSeam.prefetch({ lessonId: L, purpose: "practice", topicId: "c5-english-ch01-t01", child: { id: `c-${L}`, class_level: 5, language_pref: "hinglish" } });
  const p = passages.find((x) => pagePassage(x).pages.length >= 2);
  const a = seam.studioSeam.showPassage(L, { passage: p, page: 1 });
  assert.equal(a.state, "revealed");
  assert.equal(a.artifact.kind, "passage");
  assert.equal(a.page, 1);
  const b = seam.studioSeam.showPassage(L, { passage: p, page: 2 });
  assert.equal(b.intentId, a.intentId, "the same piece");
  assert.equal(b.page, 2);
  assert.equal(seam.studioSeam.showPassage(L, { passage: { id: "x", text: "" } }), null);
});
