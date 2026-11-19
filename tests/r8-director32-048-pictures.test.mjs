// Brain 048 G5 and G6 (docs/patches/to-brain/048-script-cards-hear-hindi-as-spoken.md, d32): what a picture request draws, in order — the card's
// authored pictureBoard with its pictureCaption, then the board's own second view, then the card's hint as help; and one line about a picture.
// The walk's choice is pinned on the live c4-ch05-t01 script (and a copy of it with a card given both); the predicates on director31's rows and
// on rows built here.
import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { lessonFlags, PENDING, PREDICATES } from "../evals/hybrid-side-by-side/dry-predicates.mjs";
import { PICTURE_NONE } from "../scripts/lesson-scripts/check.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const RUN = join(ROOT, "tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-18-director31");
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
const T = "c4-maths-ch05-t01";
const kit = kitFromFile(getTopic(T));
const picture = { event: "turn", text: "picture dikhao", kit, cls: { outcome: "no_evidence", request: { type: "visual" } } };
const atCard = (S, e, shown = null) => ({ turn: 9, ctx: { lang: "hinglish" }, lastMove: { kind: "explain" }, lastUi: { status: "your_turn", ask: { itemId: `script:${S}:ask:${e}` } }, ...(shown ? { picShown: shown } : {}) });

describe("G5: what a picture request at a card gets", () => {
  after(async () => { const { setScriptForTest } = await import("../server/director/script.js"); setScriptForTest(undefined); });
  test("a card with a pictureBoard (and no second view): the pictureBoard first, then the card's hint — never the same board again", async () => {
    const { pictureKindOf } = await import("../server/director/state.js");
    const S = `${T}-s2`;
    const a = pictureKindOf(atCard(S, "e1"), picture);
    assert.equal(a.kind, "pictureBoard");
    assert.ok(a.card.pictureBoard?.template && a.card.pictureCaption?.hi);
    assert.equal(pictureKindOf(atCard(S, "e1", { [a.part.id]: ["pictureBoard"] }), picture).kind, "hint");
  });
  test("a card whose board has a second view and no pictureBoard: the view, then the hint", async () => {
    const { pictureKindOf } = await import("../server/director/state.js");
    const S = `${T}-s1`;
    const a = pictureKindOf(atCard(S, "e2"), picture);
    assert.equal(a.kind, "view");
    assert.equal(pictureKindOf(atCard(S, "e2", { [a.part.id]: ["view"] }), picture).kind, "hint");
  });
  test("a card with both: the pictureBoard before the board's own second view, then the hint", async () => {
    const { setScriptForTest } = await import("../server/director/script.js");
    const { pictureKindOf } = await import("../server/director/state.js");
    const s = JSON.parse(readFileSync(join(ROOT, "data/lesson-scripts", `${T}.json`), "utf8"));
    const S = `${T}-s1`, e2 = s.skills[0].explain.find((b) => b.id === "e2");
    e2.ask.pictureBoard = { template: "fraction-parts@1", params: { parts: 4, shade: 1, whole: "circle" } };
    e2.ask.pictureCaption = { hi: "Yeh ek gol roti hai, chaar barabar tukdon mein.", en: "This is a round roti in four equal pieces." };
    setScriptForTest(T, s);
    const k1 = pictureKindOf(atCard(S, "e2"), picture);
    assert.equal(k1.kind, "pictureBoard");
    const k2 = pictureKindOf(atCard(S, "e2", { [k1.part.id]: ["pictureBoard"] }), picture);
    assert.equal(k2.kind, "view");
    assert.equal(pictureKindOf(atCard(S, "e2", { [k1.part.id]: ["pictureBoard", "view"] }), picture).kind, "hint");
    setScriptForTest(undefined);
  });
  test("every card on the checker's PICTURE_NONE list gets the hint (an asked step here)", async () => {
    const { pictureKindOf } = await import("../server/director/state.js");
    for (const n of PICTURE_NONE.filter((x) => x.topicId === T)) {
      const [S, path] = n.at.split("/");
      const m = /^workedExample\.steps\[(\d+)\]\.ask$/.exec(path);
      assert.ok(m, `a PICTURE_NONE entry this test can address: ${n.at}`);
      const prev = { turn: 9, ctx: { lang: "hinglish" }, lastMove: { kind: "worked_example", stepAsk: { skillId: S, step: Number(m[1]), prompt: "?" } }, lastUi: { status: "your_turn" } };
      assert.equal(pictureKindOf(prev, picture)?.kind, "hint", n.at);
    }
  });
  test("not a picture request, or a game: nothing", async () => {
    const { pictureKindOf } = await import("../server/director/state.js");
    assert.equal(pictureKindOf(atCard(`${T}-s2`, "e1"), { ...picture, text: "pata nahi", cls: { outcome: "no_evidence" } }), null);
  });
});

describe("G5/G6 predicates", () => {
  test("pictureSame, pictureRefused, pictureTwoLines are gated", () => {
    for (const k of ["pictureSame", "pictureRefused", "pictureTwoLines"]) { assert.ok(PREDICATES[k], k); assert.ok(!PENDING.has(k), k); }
  });
  test("pictureSame reads director31's picture turns that redrew the board up (c4-ch01-t02 offtopic 28, stuck 18, steady 18; c6-ch07-t01 offtopic 30)", () => {
    const at = (persona, file, topic) => {
      const j = JSON.parse(readFileSync(join(RUN, `${persona}-${file}.json`), "utf8"));
      const script = JSON.parse(readFileSync(join(RUN, "scripts", `${topic}.json`), "utf8"));
      return new Set(lessonFlags({ rows: j.director, script }).filter((f) => f.predicate === "pictureSame").map((f) => f.row));
    };
    assert.ok(at("offtopic", "c4-ch01-t02", "c4-maths-ch01-t02").has(28));
    assert.ok(at("stuck", "c4-ch01-t02", "c4-maths-ch01-t02").has(18));
    assert.ok(at("steady", "c4-ch01-t02", "c4-maths-ch01-t02").has(18));
    assert.ok(at("offtopic", "c6-ch07-t01", "c6-maths-ch07-t01").has(30));
    assert.equal(at("steady", "c5-ch02-t01", "c5-maths-ch02-t01").size, 0);
  });
  const ctx = (prevT, script = {}) => ({ prevT, script, o: {} });
  test("pictureSame: a new board, or a view beside the old one, is no fault", () => {
    const up = { who: "teacher", screen: { boardRef: { template: "shape@1", params: { a: 1 } } } };
    const same = { who: "teacher", text: "x", held: { drawn: "kept", picture: { view: null }, layout: { split: false } }, screen: { boardRef: up.screen.boardRef } };
    assert.ok(PREDICATES.pictureSame([], same, 1, ctx(up)));
    assert.equal(PREDICATES.pictureSame([], { ...same, held: { ...same.held, picture: { view: "parts" } } }, 1, ctx(up)), null);
    assert.equal(PREDICATES.pictureSame([], { ...same, held: { drawn: "held", picture: { view: null } }, screen: { boardRef: { template: "angle@1", params: {} } } }, 1, ctx(up)), null);
  });
  test("pictureRefused: a picture request answered with a refusal line, in either language", () => {
    const r = (text) => ({ who: "teacher", text, cell: { part: "x", column: "picture" } });
    assert.ok(PREDICATES.pictureRefused([], r("Iski doosri tasveer abhi nahi ban rahi, toh board wali tasveer hi dekhte hain."), 1, ctx(null)));
    assert.ok(PREDICATES.pictureRefused([], r("There isn't another picture for this one; look at the board again."), 1, ctx(null)));
    assert.equal(PREDICATES.pictureRefused([], r("Board par chocolate ke saare tukde gino."), 1, ctx(null)), null);
  });
  test("pictureTwoLines: the script's caption and the engine's line for the view in one turn", () => {
    const script = { skills: [{ checks: [{ viewCaption: { hi: "Yahan dono pattiyan ek hi number line par hain.", en: "Both strips are on one number line." } }] }] };
    const row = (text) => ({ who: "teacher", text, held: { picture: { view: "line", line: "Dekho, do sankhya rekhayein, ek ke neeche ek." } }, seams: [{ right: "caption" }] });
    assert.ok(PREDICATES.pictureTwoLines([], row("Yahan dono pattiyan ek hi number line par hain. Dekho, do sankhya rekhayein, ek ke neeche ek. Kaunsa bada hai?"), 1, ctx(null, script)));
    assert.equal(PREDICATES.pictureTwoLines([], row("Yahan dono pattiyan ek hi number line par hain. Kaunsa bada hai?"), 1, ctx(null, script)), null);
  });
});

describe("G6: one line about a picture", () => {
  test("where the script supplies the caption, the engine's line for the view is not also said, nor her sentence written from it (director31 steering c5-t03 14, replayed)", async () => {
    const { replay, runScriptOf } = await import("./fixtures/replay.mjs");
    const { textReply, replyDeps } = await import("../server/brain/say.js");
    const { instructionsFor } = await import("../server/compiler/instructions.js");
    const { setScriptForTest } = await import("../server/director/script.js");
    const RUN = "2026-11-18-director31", TT = "c5-maths-ch02-t03";
    const KEEP = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT;
    const chat = replyDeps.chat;
    try {
      const sc = runScriptOf(RUN, TT); delete sc.recordedRun; setScriptForTest(TT, sc);
      const { kit, plans } = await replay(RUN, "steering", TT, 15);
      const pl = plans.find((p) => p.state.lastMove?.request === "visual");
      assert.ok(pl, "the picture turn");
      const engine = "Dekho, do sankhya rekhayein, ek ke neeche ek.";
      const st = { ...pl.state, lastMove: { ...pl.state.lastMove, altLine: engine, altView: "line" } };
      replyDeps.chat = async () => ({ text: "Do sankhya rekhayein hain, ek ke neeche ek. Ab socho." });
      const r = (await textReply({ instructions: instructionsFor(st, kit), state: st, kit, childText: pl.child, history: [], ui: pl.p.r.ui, module: null })).reply;
      assert.match(r, /^Dono patti yahan ek number line par hain/, "the script's caption leads");
      assert.doesNotMatch(r, /rekhayein/i, "no second line about the picture");
    } finally { replyDeps.chat = chat; setScriptForTest(); if (KEEP !== undefined) process.env.TAXILA_R7_SCRIPT = KEEP; }
  });
  test("sharesLine: two content words of the engine's line", async () => {
    const { sharesLine } = await import("../server/brain/say.js");
    assert.ok(sharesLine("Do sankhya rekhayein hain, ek ke neeche ek.", "Dekho, do sankhya rekhayein, ek ke neeche ek."));
    assert.ok(!sharesLine("Accha, chalo.", "Dekho, do sankhya rekhayein, ek ke neeche ek."));
  });
});

describe("047 R6: the turn's fit", () => {
  const at = (persona, file, topic, name) => {
    const j = JSON.parse(readFileSync(join(RUN, `${persona}-${file}.json`), "utf8"));
    const script = JSON.parse(readFileSync(join(RUN, "scripts", `${topic}.json`), "utf8"));
    return new Set(lessonFlags({ rows: j.director, script }).filter((f) => f.predicate === name).map((f) => f.row));
  };
  test("firstTeachLong is gated and reads director31's six first teaching turns at 76 to 80 (row 4 of stuck and steering in c5-t02, c5-t03, c6-ch07-t01)", () => {
    assert.ok(PREDICATES.firstTeachLong && !PENDING.has("firstTeachLong"));
    for (const p of ["stuck", "steering"]) for (const [f, t] of [["c5-ch02-t02", "c5-maths-ch02-t02"], ["c5-ch02-t03", "c5-maths-ch02-t03"], ["c6-ch07-t01", "c6-maths-ch07-t01"]])
      assert.deepEqual([...at(p, f, t, "firstTeachLong")], [4], `${p} ${f}`);
    assert.equal(at("steady", "c5-ch02-t02", "c5-maths-ch02-t02", "firstTeachLong").size, 0);
  });
  test("vpcUnlisted (counted) reads director31 c5-t03 steady 52 and c5-t02 steady 76: over 65 with the short reason, and not listed whole", () => {
    assert.ok(PENDING.has("vpcUnlisted"));
    assert.ok(at("steady", "c5-ch02-t03", "c5-maths-ch02-t03", "vpcUnlisted").has(52));
    assert.ok(at("steady", "c5-ch02-t02", "c5-maths-ch02-t02", "vpcUnlisted").has(76));
  });
});
