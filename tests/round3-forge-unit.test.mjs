// Round 3 · forge: the pure parts of the live-build pipeline and the visual QA verdict (no browser, < 1 s).
//   boardFrame (src/studio/boardView.ts): the stage frames a board's drawn content, never the empty slate
//   twinScript (src/studio/twinBoard.ts): a Studio v2 piece too small for the device becomes a legible board twin
//   art (server/forge3/art.js): one ground per lesson, by subject and band, varied across lessons
//   compose (server/forge3/compose.js): the ladder for a moment (interactive asks get something to DO)
//   judgeView (server/forge3/qa/checks.js): the verdict on one measured view
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { boardFrame, contentBox, MAX_ZOOM } from "../src/studio/boardView.ts";
import { twinScript, twinLines } from "../src/studio/twinBoard.ts";
import { boardGroundFor, dressBoard, topicParts } from "../server/forge3/art.js";
import { compose, askClass, admitPlay, varietyOf, noteShown } from "../server/forge3/compose.js";
import { judgeView, judgePiece, SV2_MIN } from "../server/forge3/qa/checks.js";
import { certificatesFromMatrix, verdictFor, servable } from "../server/forge3/certify.js";
import { normalizeScript } from "../shared/whiteboard.js";
import { viewportClassOf } from "../server/forge3/qa/viewports.js";

const PROD = JSON.parse(readFileSync(new URL("./fixtures/round3-forge/prod-boards-2026-10-09.json", import.meta.url), "utf8"));

describe("round3 forge: board framing", () => {
  it("frames a corner drawing larger, contains every op, and never zooms past MAX_ZOOM", () => {
    // (the prod script is a "continue" board; framed as the fresh board it would be on a first mount)
    const diagram = { ...PROD.find((x) => x.case === "diagram").script, mode: "fresh" };
    const f = boardFrame(diagram);
    assert.equal(f.framed, true);
    assert.ok(f.zoom > 1.05 && f.zoom <= MAX_ZOOM, `zoom ${f.zoom}`);
    const c = contentBox(diagram);
    assert.ok(f.x <= c.x && f.y <= c.y && f.x + f.w >= c.x + c.w && f.y + f.h >= c.y + c.h, "the frame holds all content");
    assert.ok(f.x >= 0 && f.y >= 0 && f.x + f.w <= diagram.board.w + 0.1 && f.y + f.h <= diagram.board.h + 0.1, "inside the board");
    const one = { board: { w: 400, h: 300 }, mode: "fresh", ops: [{ id: "a", op: "text", at: [200, 150], text: "x", size: "m" }] };
    assert.ok(boardFrame(one).zoom <= MAX_ZOOM);
  });
  it("leaves a continue board and a full board alone", () => {
    const s = PROD.find((x) => x.case === "draw").script;
    assert.equal(boardFrame({ ...s, mode: "continue" }).framed, false);
    const full = { board: { w: 400, h: 300 }, mode: "fresh", ops: [{ id: "r", op: "rect", at: [4, 4], w: 392, h: 292 }] };
    assert.equal(boardFrame(full).framed, false);
  });
});

describe("round3 forge: board twin", () => {
  it("wraps long lines on words into ≤ 4 lines of ≤ 24 chars, and the script normalises strictly", () => {
    const t = twinLines({ title: "Equal parts", lines: ["1 whole = 4 equal parts · one part = 1/4", "a very long line of words that keeps going past the cap"] });
    assert.ok(t.lines.length <= 4 && t.lines.every((l) => l.length <= 24));
    const s = twinScript({ title: "Equal parts", lines: ["1 whole = 4 equal parts", "one part = 1/4"] }, "x");
    const n = normalizeScript(s, { strict: true });
    assert.equal(n.ok, true, JSON.stringify(n.errors));
    assert.equal(s.board.ground, "paper");
    assert.equal(twinScript(null), null);
  });
});

describe("round3 forge: art direction", () => {
  it("picks by subject and band, varies across lessons, and a continue board keeps its ground", () => {
    assert.deepEqual(topicParts("c6-maths-ch07-t01"), { classLevel: 6, subject: "maths" });
    const maths = new Set(["a", "b", "c", "d", "e", "f"].map((l) => boardGroundFor({ topicId: "c6-maths-ch07-t01", lessonId: l })));
    assert.ok(maths.size >= 2 && [...maths].every((g) => ["grid", "chalk"].includes(g)), [...maths].join());
    for (const l of ["a", "b", "c", "d"]) assert.notEqual(boardGroundFor({ topicId: "c4-evs-ch01-t01", lessonId: l }), "chalk", "class 4: light grounds");
    assert.notEqual(boardGroundFor({ topicId: "c6-maths-ch07-t01", lessonId: "a", lastGround: boardGroundFor({ topicId: "c6-maths-ch07-t01", lessonId: "a" }) }),
      boardGroundFor({ topicId: "c6-maths-ch07-t01", lessonId: "a" }), "never the child's last ground when another fits");
    const s = { board: { w: 400, h: 300, ground: "chalk" }, mode: "continue", ops: [] };
    assert.equal(dressBoard(s, { ground: "paper", prevGround: "grid" }).board.ground, "grid");
    assert.equal(dressBoard({ ...s, mode: "fresh" }, { ground: "paper" }).board.ground, "paper");
  });
});

describe("round3 forge: composition ladder", () => {
  const cov = { v: 1, skills: { "c5-maths-ch02-t01-s1": { family: "nishana", mode: "place", goal: "place", arts: ["blueprint", "kagaz"], contexts: ["road"] } }, excluded: { "c7-science-ch06-t01": "adolescence" } };
  const certs = { topics: { "c5-maths-ch02-t01": { game: { byViewport: { p360: false, p412: false, l1366: true }, fails: [] } }, "c4-maths-ch05-t01": { game: { byViewport: { p360: false, p412: false, l1366: false }, fails: ["x"] } } } };
  it("an interactive ask gets something to DO first: play, then a game certified for the size, then the engine in the tray, then a board", () => {
    const r = compose({ ask: "game", skillId: "c5-maths-ch02-t01-s1", topicId: "c5-maths-ch02-t01", vp: "l1366", moduleInTray: true }, { coverage: cov, certs, playCerts: null });
    assert.deepEqual(r.ladder.map((x) => x.kind), ["play", "stagecraft", "keep_module", "board", "voice"]);
    assert.equal(r.pick.family, "nishana");
    const phone = compose({ ask: "game", skillId: "c5-maths-ch02-t01-s1", topicId: "c5-maths-ch02-t01", vp: "p360" }, { coverage: cov, certs, playCerts: null });
    assert.ok(!phone.ladder.some((x) => x.kind === "stagecraft"), "a game that failed visual QA at 360 is not offered at 360");
    const broken = compose({ ask: "game", skillId: "zzz", topicId: "c4-maths-ch05-t01" }, { coverage: cov, certs, playCerts: null });
    assert.deepEqual(broken.ladder.map((x) => x.kind), ["board", "voice"], "broken everywhere: never served");
  });
  it("a picture ask gets a board first; safety shows nothing new; askClass maps the request lexicons", () => {
    assert.equal(compose({ ask: "diagram", topicId: "c5-maths-ch02-t01" }, { coverage: cov, certs, playCerts: null }).pick.kind, "board");
    assert.equal(compose({ ask: "game", safety: true }, { coverage: cov, certs, playCerts: null }).pick.kind, "voice");
    assert.equal(askClass("game_request"), "interactive");
    assert.equal(askClass("board_request"), "picture");
    assert.equal(admitPlay("c5-maths-ch02-t01-s1", "c7-science-ch06-t01", cov), null, "an excluded topic gets no game");
  });
  it("variety: the art rotates away from the last one, and a family just shown steps behind a library game", () => {
    const pickArt = ({ topicArts, lastArt }) => ({ art: topicArts.find((a) => a !== lastArt), reason: "rotation" });
    const a = compose({ ask: "game", skillId: "c5-maths-ch02-t01-s1", topicId: "c5-maths-ch02-t01", vp: "l1366", lesson: { lastArt: "blueprint" } }, { coverage: cov, certs, pickArt, playCerts: null });
    assert.equal(a.pick.art, "kagaz");
    let lesson = {};
    lesson = noteShown(lesson, { kind: "play", family: "nishana", mode: "place", art: "kagaz" });
    const b = compose({ ask: "game", skillId: "c5-maths-ch02-t01-s1", topicId: "c5-maths-ch02-t01", vp: "l1366", lesson }, { coverage: cov, certs, pickArt, playCerts: null });
    assert.equal(b.pick.kind, "stagecraft", "the same family twice in a row steps behind a certified alternative");
    assert.deepEqual(varietyOf([{ art: "chalk" }, { art: "chalk" }, { art: "paper" }]), { n: 3, arts: 2, forms: 1, longestSameLook: 2 });
    // a (family, mode, art) that failed the play visual QA at this size is not offered there
    const playCerts = { pieces: { "nishana/place": { "kagaz@c7": { byViewport: { p360: false, l1366: true } } } } };
    const c = compose({ ask: "game", skillId: "c5-maths-ch02-t01-s1", topicId: "c5-maths-ch02-t01", vp: "p360", classLevel: 7, lesson: { lastArt: "blueprint" } }, { coverage: cov, certs, pickArt, playCerts });
    assert.ok(!c.ladder.some((x) => x.kind === "play"), JSON.stringify(c.why));
    const d = compose({ ask: "game", skillId: "c5-maths-ch02-t01-s1", topicId: "c5-maths-ch02-t01", vp: "l1366", classLevel: 7, lesson: { lastArt: "blueprint" } }, { coverage: cov, certs, pickArt, playCerts });
    assert.equal(d.pick.kind, "play"); assert.equal(d.pick.certified, true);
  });
});

describe("round3 forge: visual QA verdict", () => {
  const box = { x: 24, y: 120, w: 312, h: 195 };
  it("fails small words, clipped words, overlaps and small canvas targets; passes a clean board", () => {
    const m = { box, tray: { x: 16, y: 112, w: 328, h: 404 }, texts: [{ t: "0", px: 11, x: 30, y: 200, w: 8, h: 14, outside: false, ellipsis: false }], targets: [], overlaps: [], svg: { w: 312, h: 195 }, content: { x: 30, y: 130, w: 280, h: 170, drawn: 4 } };
    const v = judgeView(m);
    assert.equal(v.pass, false); assert.deepEqual(v.fails, ["Q1.legible"]);
    const sv2 = judgeView({ box, tray: m.tray, texts: [], targets: [], overlaps: [], canvas: { w: 312, h: 195, ink: { share: 0.3 } }, kind: "stagecraft" }, { artifactKind: "stagecraft" });
    assert.ok(sv2.fails.includes("Q1.legible") && sv2.fails.includes("Q4.touchable"), JSON.stringify(sv2.fails));
    assert.equal(Math.round(SV2_MIN.label * 312 / 1000 * 10) / 10, sv2.stats.canvasLabel);
    const clean = judgeView({ ...m, texts: [{ t: "whole", px: 18, x: 40, y: 140, w: 50, h: 22, outside: false, ellipsis: false }] });
    assert.equal(clean.pass, true, JSON.stringify(clean.fails));
    assert.equal(judgeView({ ...m, texts: [], content: { x: 30, y: 130, w: 30, h: 20, drawn: 1 } }).fails.includes("Q7.not_a_speck"), true);
    assert.equal(judgeView({ ...m, texts: [], shapesCut: 2 }).fails.includes("Q2.whole"), true);
  });
  it("a piece passes only where every view passed; certificates follow the matrix; the device class comes from its box", () => {
    const p = judgePiece([{ vp: "p360", verdict: { pass: false, fails: ["Q1.legible"] } }, { vp: "l1366", verdict: { pass: true, fails: [] } }]);
    assert.deepEqual(p, { pass: false, byViewport: { p360: false, l1366: true }, fails: ["p360:Q1.legible"] });
    const certs = certificatesFromMatrix({ rows: [{ id: "game:c1", topic: "c1", group: "game:x@1", byViewport: { p360: false, l1366: true }, fails: [] }, { id: "board:c1", topic: "c1", group: "catalogue-board", byViewport: { p360: false, l1366: false }, fails: ["p360:Q1"] }] });
    assert.equal(verdictFor("c1", "game", "l1366", certs).pass, true);
    assert.equal(servable("c1", "board", certs), false);
    assert.equal(servable("c2", "game", certs), true, "never judged: allowed (library only), logged");
    assert.equal(viewportClassOf({ w: 324 }), "p360"); assert.equal(viewportClassOf({ w: 376 }), "p412"); assert.equal(viewportClassOf({ w: 740 }), "l1366");
  });
});
