// Round 3 · forge: the live pipeline's new parts (no browser, no DB, no model; ~1 s).
//   boardFit (src/studio/boardFit.ts): a board is laid out FOR the child's box (geometry scales, words keep their size)
//   buildLive (server/forge3/live.js): an interactive ask becomes a play@1 piece from the play stream's own session start
//   studioSeam.composeAsk + slotFor (server/studio/seam.js): the piece reaches the Studio slot on the ask's turn
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fitBoard, minPxAt, crossings, applyTransform, rememberTransform, transformFor, _forgetTransforms, BOARD_FLOOR_PX, MIN_F } from "../src/studio/boardFit.ts";
import { boardFrame } from "../src/studio/boardView.ts";
import { lintScript } from "../shared/whiteboard.js";

const TOPICS = new URL("../data/studio-catalogue/topics/", import.meta.url);
const firstBeat = (id) => {
  const t = JSON.parse(readFileSync(new URL(`${id}.json`, TOPICS), "utf8"));
  const beats = t.whiteboard?.beats ?? [];
  return (beats.find((x) => x.ok && x.script) ?? beats[0])?.script ?? null;
};
const P360 = { w: 324, h: 400 }, P412 = { w: 364, h: 503 }, L1366 = { w: 736, h: 392 };
const designOf = (s) => { const f = boardFrame(s); return f.framed ? { w: f.w, h: f.h } : s.board; };
const overlaps = (s) => lintScript(s).filter((i) => i.check === "text_overlap").length;

describe("round3 forge: boards laid out for the box (boardFit)", () => {
  it("an 800 x 500 catalogue board reaches the 14 px floor on a 360 phone, cleanly, and is untouched on a laptop", () => {
    const s = firstBeat("c6-science-ch02-t01");
    const r = fitBoard(s, P360, designOf(s));
    assert.ok(r.pxBefore < BOARD_FLOOR_PX, `before ${r.pxBefore}`);
    assert.ok(r.t && r.reached && r.pxAfter >= BOARD_FLOOR_PX, JSON.stringify({ t: r.t, px: r.pxAfter, why: r.why }));
    assert.ok(r.t.f >= MIN_F && r.t.f < 1);
    assert.ok(overlaps(r.script) <= overlaps(s), "no new overlapping words");
    assert.ok(crossings(r.script.ops) <= crossings(s.ops), "no word newly crossed by a line");
    assert.equal(lintScript(r.script).filter((i) => i.check === "inside_board").length, 0, "every op inside the new board");
    // words keep their size; the geometry is scaled
    const tx0 = s.ops.find((o) => o.op === "text"), tx1 = r.script.ops.find((o) => o.id === tx0.id);
    assert.equal(tx1.size, tx0.size);
    const lap = fitBoard(s, L1366, designOf(s));
    assert.equal(lap.t, null);
    assert.equal(lap.script, s);
  });
  it("a board with no words, or already legible, is drawn as it is", () => {
    const circle = { v: 1, scriptId: "c", line: { lessonId: "L" }, board: { w: 400, h: 300, ground: "chalk" }, mode: "fresh", durationMs: 1000,
      ops: [{ id: "a", op: "circle", c: [200, 150], r: 60, startMs: 0, endMs: 500 }] };
    assert.equal(fitBoard(circle, P360, circle.board).t, null);
    const big = { ...circle, ops: [{ id: "t", op: "text", at: [200, 150], text: "3/4", size: "l", startMs: 0, endMs: 300 }] };
    assert.equal(fitBoard(big, P360, big.board).why, "meets the floor as drawn");
  });
  it("a continue board reuses its fresh board's transform (they line up)", () => {
    _forgetTransforms();
    const s = { ...firstBeat("c6-science-ch02-t01"), line: { lessonId: "L-cont" } };
    const r = fitBoard(s, P360, designOf(s));
    rememberTransform(s, r.t);
    const cont = { ...s, scriptId: "next", mode: "continue", ops: [{ id: "z", op: "text", at: [400, 450], text: "woody", size: "m", startMs: 0, endMs: 300 }] };
    const t = transformFor(cont);
    assert.deepEqual(t, r.t);
    const c2 = applyTransform(cont, t);
    assert.deepEqual([c2.board.w, c2.board.h], [r.script.board.w, r.script.board.h], "same board size as the fresh board (priorFor matches by size)");
    assert.equal(transformFor({ ...cont, line: { lessonId: "other" } }), undefined);
  });
  it("over every catalogue board and the 20 taxila.dev boards: far fewer below the floor on phones, never a new overlap", () => {
    const scripts = readdirSync(TOPICS).filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", "")).map(firstBeat).filter(Boolean);
    for (const x of JSON.parse(readFileSync(new URL("./fixtures/round3-forge/prod-boards-2026-10-09.json", import.meta.url), "utf8"))) scripts.push(x.script);
    const count = (box) => {
      let below0 = 0, below1 = 0, worse = 0;
      for (const s of scripts) {
        const r = fitBoard(s, box, designOf(s));
        if ((r.pxBefore ?? 99) < BOARD_FLOOR_PX) below0++;
        if ((r.pxAfter ?? 99) < BOARD_FLOOR_PX) below1++;
        if (r.t && (overlaps(r.script) > overlaps(s) || crossings(r.script.ops) > crossings(s.ops))) worse++;
      }
      return { below0, below1, worse };
    };
    const p = count(P360), q = count(P412);
    // measured 2026-10-09: 312 → 61 at 360, 271 → 36 at 412 (402 boards); the guard leaves room for kit edits
    assert.ok(p.below0 > 250 && p.below1 <= 80, JSON.stringify(p));
    assert.ok(q.below1 <= 50, JSON.stringify(q));
    assert.equal(p.worse + q.worse, 0);
    assert.ok(minPxAt(scripts[0], { w: 800, h: 500 }, { w: 800, h: 500 }) > 0);
  });
});

describe("round3 forge: the live play piece (buildLive)", () => {
  let buildLive, verifySession;
  before(async () => {
    ({ buildLive } = await import("../server/forge3/live.js"));
    ({ verifySession } = await import("../server/play/session.js"));
  });
  const child = (cl) => ({ id: "kid-r3f", class_level: cl, language_pref: "hinglish" });
  it("a game ask on an admitted topic is a play@1 piece: a signed session, a solver-checked level, its board twin and on-screen facts", async () => {
    const r = await buildLive({ ask: "game", lessonId: "L1", child: child(4), skillId: "c4-maths-ch05-t01-s1", topicId: "c4-maths-ch05-t01" }, { q: null, playCerts: null });
    assert.ok(r, "a piece");
    assert.equal(r.artifact.kind, "play");
    assert.equal(r.artifact.play.family, "todo-jodo");
    assert.ok(verifySession(r.artifact.play.sessionId), "the play server's own signed session");
    assert.equal(r.level.proof.solvable, true);
    assert.equal(r.level.proof.shortcutFree, true);
    assert.ok(r.boardTwin?.board?.title, "a board twin for a box that cannot hold the level");
    assert.equal(r.facts.archetype, "play@1");
    for (const v of Object.values(r.facts.onScreen)) assert.ok(typeof v === "number" || (typeof v === "string" && v.length <= 24));
    assert.ok(r.ms < 3000);
  });
  it("no piece: a topic without play coverage, an excluded topic, a picture ask, a safeguarding moment", async () => {
    const m = (o) => buildLive({ ask: "game", lessonId: "L1", child: child(6), skillId: null, topicId: "c6-maths-ch06-t01", ...o }, { q: null, playCerts: null });
    assert.equal(await m({}), null);
    assert.equal(await m({ topicId: "c7-science-ch06-t01", child: child(7) }), null, "adolescence topics are never gamified");
    assert.equal(await m({ topicId: "c4-maths-ch05-t01", ask: "picture" }), null);
    assert.equal(await m({ topicId: "c4-maths-ch05-t01", safety: true }), null);
  });
  it("the visual-QA certificate decides the art: a failed art is swapped for one that passed; none passed → no piece", async () => {
    const base = { ask: "simulation", lessonId: "L2", child: child(7), skillId: null, topicId: "c7-science-ch01-t01" };
    const first = await buildLive(base, { q: null, playCerts: null });
    assert.ok(first);
    const picked = first.artifact.play.art;
    const cell = (ok) => ({ byViewport: { p360: ok, p412: ok, l1366: ok } });
    const others = ["kagaz", "chalk", "blueprint", "raat"].filter((a) => a !== picked);
    const swap = { pieces: { "kyun-lab/fair-test": { [`${picked}@c7`]: cell(false), [`${others[0]}@c7`]: cell(true) } } };
    const r = await buildLive(base, { q: null, playCerts: swap });
    assert.ok(r);
    assert.equal(r.artifact.play.art, others[0]);
    const none = { pieces: { "kyun-lab/fair-test": Object.fromEntries(["kagaz", "chalk", "blueprint", "raat"].map((a) => [`${a}@c7`, cell(false)])) } };
    assert.equal(await buildLive(base, { q: null, playCerts: none }), null);
  });
});

describe("round3 forge: the serving rule of the certificates (the device's 14 px rule)", () => {
  it("a classes 4-5 view failing ONLY the 16 px young floor with text ≥ 14 px may be served; anything else may not", async () => {
    const { servesView, certificatesFromMatrix, verdictFor } = await import("../server/forge3/certify.js");
    assert.equal(servesView({ pass: false, fails: ["Q1.legible"], stats: { minPx: 14.3 } }), true);
    assert.equal(servesView({ pass: false, fails: ["Q1.legible"], stats: { minPx: 12.3 } }), false);
    assert.equal(servesView({ pass: false, fails: ["Q1.legible", "Q4.touchable"], stats: { minPx: 15 } }), false);
    const certs = certificatesFromMatrix({ rows: [{ id: "game:c4-x", topic: "c4-x", group: "game:g@1", byViewport: { p360: false, p412: false },
      fails: [], views: [{ vp: "p360", pass: false, fails: ["Q1.legible", "Q4.touchable"], stats: { minPx: 12.3 } }, { vp: "p412", pass: false, fails: ["Q1.legible"], stats: { minPx: 14.3 } }] }] });
    assert.equal(verdictFor("c4-x", "game", "p412", certs).pass, true);
    assert.equal(verdictFor("c4-x", "game", "p360", certs).pass, false);
  });
});

describe("round3 forge: the play piece reaches the Studio slot (seam)", () => {
  let studioSeam, _reset, _setDeps, _lesson, setCerts;
  before(async () => {
    ({ studioSeam, _reset, _setDeps, _lesson } = await import("../server/studio/seam.js"));
    _setDeps({ q: null });
    // the seam's wiring is under test here, not the certificate file's current verdicts
    ({ _setPlayCertificates: setCerts } = await import("../server/forge3/compose.js"));
    setCerts(null);
  });
  after(() => { _reset(); setCerts(undefined); });
  const kid = { id: "kid-seam", first_name: "Aarav", class_level: 4, language_pref: "hinglish" };
  it("composeAsk then slotFor on the same turn shows the piece; it stays on later turns; a second ask does not replace it", async () => {
    _reset();
    studioSeam.prefetch({ lessonId: "L-seam", child: kid, topicId: "c4-maths-ch05-t01", purpose: "practice", mode: "text" });
    studioSeam.statusFacts("L-seam", { beat: "practice" });
    const a = await studioSeam.composeAsk("L-seam", { visual: "game", skillId: "c4-maths-ch05-t01-s1", topicId: "c4-maths-ch05-t01", child: kid });
    assert.equal(a?.kind, "play");
    const slot = studioSeam.slotFor("L-seam", null, { beat: "practice", tray: "none", visualRequest: true });
    assert.equal(slot?.artifact?.kind, "play");
    assert.equal(slot.state, "revealed");
    assert.match(studioSeam.factsRowForSlot("L-seam", slot) ?? "", /play@1/);
    studioSeam.statusFacts("L-seam", { beat: "practice" });
    const later = studioSeam.slotFor("L-seam", null, { beat: "practice", tray: "none" });
    assert.equal(later?.intentId, slot.intentId);
    assert.equal(await studioSeam.composeAsk("L-seam", { visual: "game", topicId: "c4-maths-ch05-t01", child: kid }), null, "never pulled away mid-game");
  });
  it("a composed piece not shown on its turn is dropped; a safeguarding turn shows nothing; a picture ask composes nothing", async () => {
    _reset();
    studioSeam.prefetch({ lessonId: "L-s2", child: kid, topicId: "c4-maths-ch05-t01", purpose: "practice", mode: "text" });
    studioSeam.statusFacts("L-s2", {});
    assert.equal(await studioSeam.composeAsk("L-s2", { visual: "picture", topicId: "c4-maths-ch05-t01", child: kid }), null);
    await studioSeam.composeAsk("L-s2", { visual: "game", topicId: "c4-maths-ch05-t01", child: kid });
    assert.equal(studioSeam.slotFor("L-s2", null, { safety: true, visualRequest: true }), null);
    assert.equal(_lesson("L-s2").pendingPlay, null);
    assert.equal(await studioSeam.composeAsk("L-s2", { visual: "game", topicId: "c4-maths-ch05-t01", child: kid }), null, "nothing new after a safeguarding turn");
    studioSeam.prefetch({ lessonId: "L-s3", child: { ...kid, id: "kid-s3" }, topicId: "c4-maths-ch05-t01", purpose: "practice", mode: "text" });
    studioSeam.statusFacts("L-s3", {});
    assert.equal((await studioSeam.composeAsk("L-s3", { visual: "game", topicId: "c4-maths-ch05-t01", child: { ...kid, id: "kid-s3" } }))?.kind, "play");
    studioSeam.statusFacts("L-s3", {});
    assert.equal(studioSeam.slotFor("L-s3", null, { visualRequest: true }), null, "a stale pending piece (an earlier turn) is never shown");
  });
});
