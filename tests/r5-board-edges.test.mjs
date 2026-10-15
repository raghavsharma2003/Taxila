// Round 5, stream 2 (QA D09: "on the phone the 3rd box is clipped at the stage's bottom edge"): no box of a library board
// touches the board's edge. flow@1's column layout put its last box's bottom at exactly y = 300 (the board's height), so the
// box's stroke was cut wherever the stage shows the board as drawn: 191 of the 316 library boards. Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { expand } from "../server/forge/explainer/templates.js";

const LIB = JSON.parse(fs.readFileSync(new URL("../server/forge/explainer/library.json", import.meta.url), "utf8"));
const calls = [];
const walk = (o) => { if (o && typeof o === "object") { if (o.call?.template) calls.push(o.call); for (const v of Object.values(o)) walk(v); } };
walk(LIB);

test("every library board keeps its boxes (with their strokes) inside the board", () => {
  assert.ok(calls.length > 100, "the library was read");
  const out = [];
  for (const call of calls) {
    let s;
    try { s = expand(call, { band: "B3", lessonId: "x", scriptId: "x" }); } catch { continue; }
    s = s?.script ?? s;
    if (!s?.ops) continue;
    const { w, h } = s.board;
    for (const o of s.ops) {
      if (o.op !== "rect") continue;
      const pad = (o.weight ?? 1) / 2;
      if (o.at[0] - pad < 0 || o.at[1] - pad < 0 || o.at[0] + o.w + pad > w || o.at[1] + o.h + pad > h) { out.push(`${call.template} ${o.id}`); break; }
    }
  }
  assert.deepEqual(out, []);
});

test("flow@1 in a column (QA D09's board): the third box ends above the board's bottom", () => {
  const s0 = expand({ template: "flow@1", steps: ["Change to grams", "Compare weights", "Find the heavier weight"] }, { band: "B3", lessonId: "x", scriptId: "x" });
  const s = s0.script ?? s0;
  const b2 = s.ops.find((o) => o.id === "b2");
  assert.ok(b2.at[1] + b2.h <= s.board.h - 8, `bottom ${b2.at[1] + b2.h} of ${s.board.h}`);
});

test("no library board's facts row carries an id-like key ('left1', 'step2'): she reads the row and says them (sim lab p29)", async () => {
  const { factsRow } = await import("../server/director/modules.js");
  const bad = [];
  for (const call of calls) {
    let s;
    try { s = expand(call, { band: "B3", lessonId: "x", scriptId: "x" }); } catch { continue; }
    if (!s?.facts) continue;
    const row = factsRow(s.facts) ?? "";
    const ids = row.split(" · ").slice(1).map((p) => p.split(" ")[0]).filter((w) => /^[a-z]+\d+$/i.test(w));
    if (ids.length) bad.push(`${call.template}: ${ids.join(",")}`);
  }
  assert.deepEqual([...new Set(bad)], []);
});

test("a new page that shares nothing with her line is not drawn (sim lab boardfacts: p04 'six thousand forty-two' under '345 …', p25 pencils under cricket)", async () => {
  const { syncedWithLine } = await import("../server/studio/request.js");
  const pg = (...t) => ({ ops: t.map((text, i) => ({ id: `t${i}`, op: "text", at: [0, 0], text })) });
  assert.equal(syncedWithLine(pg("Write six thousand forty-two in numbers"), "Ab 345 mein hundreds place ka digit kaunsa hai?"), false);
  assert.equal(syncedWithLine(pg("Pencil = ₹5", "3 pencils = ?"), "Cricket mein 4 overs mein 24 runs bane."), false);
  assert.equal(syncedWithLine(pg("3/4"), "Dekho, teen chauthai matlab chaar mein se teen hisse."), true, "a number said in words is its digits");
  assert.equal(syncedWithLine(pg("Fraction", "3/8"), "भिन्न का मतलब है पूरे का हिस्सा।"), true, "her Hindi name for the thing, the board's English (main, 14.3)");
  assert.equal(syncedWithLine(pg("Equivalent fractions"), "Barabar bhinn ek hi hissa dikhate hain."), true);
  assert.equal(syncedWithLine(pg("Standing line", "Sleeping line"), "Upar-neeche jaane wali line standing line hoti hai."), true);
  assert.equal(syncedWithLine({ ops: [{ id: "c", op: "circle", c: [0, 0], r: 40 }] }, "kuch bhi"), true, "a page that writes nothing is not judged");
  assert.equal(syncedWithLine(pg("Half = 1/2"), ""), true, "no line known: not judged");
});

test("14.3 game ask with no play piece: the lesson's own prepared activity for the skill is shown (never a board, never a diagram)", async () => {
  const { _lessonPieceForAsk, candidateIntents } = await import("../server/studio/seam.js");
  const { archetype } = await import("../server/studio/archetypes/index.js");
  const kits = JSON.parse(fs.readFileSync(new URL("../data/kits/c7-maths.json", import.meta.url), "utf8"));
  const kit = kits.topics.find((t) => t.topicId === "c7-maths-ch08-t01");
  const cands = candidateIntents({ lessonId: "L-g1", kit, topicId: kit.topicId, child: { class_level: 7 } });
  const pieces = new Map();
  for (const c of cands) pieces.set(c.intent.intentId, { intentId: c.intent.intentId, slotId: `${c.intent.intentId}:slot`, kind: archetype(c.archetype).kind, archetype: c.archetype,
    params: c.params, skillId: c.intent.skillId, state: "fallback_ready", source: "skeleton", retired: false });
  const L = { lessonId: "L-g1", pieces, turn: 3, subs: new Set(), redact: [] };
  const got = _lessonPieceForAsk(L, { visual: "game", skillId: kit.skills[0].id });
  assert.ok(got, "c7 multiplying fractions: the prefetched activity answers the game ask");
  assert.equal(got.kind, "lesson_piece");
  assert.ok(["game", "simulation"].includes(archetype(got.archetype).kind), got.archetype);
  assert.equal(L.pendingPlay.intentId, got.intentId, "shown on this turn like a play piece");
  const none = { lessonId: "L-g2", pieces: new Map([...pieces].filter(([, p]) => !["game", "simulation"].includes(p.kind))), turn: 3, subs: new Set(), redact: [] };
  assert.equal(_lessonPieceForAsk(none, { visual: "game" }), null, "no doable piece: honest talk, as before");
});

test("QA pass 12 D36: a clock's face numerals are givens (only the open key is withheld); a named rectangle is drawn as one (W15)", async () => {
  const { freeAsked } = await import("../server/studio/request.js");
  const { namedShapeMissing } = await import("../server/studio/qa/whiteboard.js");
  assert.deepEqual(freeAsked({ values: ["2", "4", "7", "9"], phrases: [] }, { kind: "draw", subject: "ghadi" }, { answer: "9" }).values, ["9"]);
  const trapezoid = [{ op: "polygon", points: [[80, 200], [320, 200], [280, 80], [120, 80]] }];
  assert.deepEqual(namedShapeMissing("Rectangle ki length 50 m aur breadth 30 m hai.", trapezoid), ["rectangle named, not drawn"]);
  assert.deepEqual(namedShapeMissing("Rectangle ki length 50 m.", [{ op: "rect", at: [80, 80], w: 240, h: 120 }]), []);
  assert.deepEqual(namedShapeMissing("आयत की लंबाई 50 m", [{ op: "polygon", points: [[0, 0], [100, 0], [100, 50], [0, 50]] }]), []);
  assert.deepEqual(namedShapeMissing("Number line par 0 se 50.", [{ op: "line", from: [0, 0], to: [100, 0] }]), [], "no closed shape: not judged");
});

test("QA pass 12 D35: 'number line pe dikhao' with no numbers named draws HER line's numbers by code (the line plan failed ~1 in 2)", async () => {
  const { numberLineBoard } = await import("../server/studio/request.js");
  const { gateWhiteboard } = await import("../server/studio/qa/whiteboard.js");
  const line = "0 se 50 m aur phir 30 m ke steps dikhaiye: boundary ka agla hissa kitna hoga?";
  const nums = (line.match(/-?\d+(?:\.\d+)?(?:\/\d+)?/g) ?? []).filter((x, i, a) => a.indexOf(x) === i).slice(0, 4);
  const sc = numberLineBoard({ kind: "number_line", said: nums }, { spanMs: 5000 });
  assert.ok(sc);
  assert.deepEqual(gateWhiteboard(sc, { reply: line, speechMs: 5000 }).checks.filter((c) => !c.pass).map((c) => c.id), []);
});

test("14.3 (main: a game ask mounts the topic's engine): 'mujhe game khelna hai' at the first teaching turn mounts c7-maths-ch08-t01's engine, unbound, never stating the open item's key", async () => {
  const fs = await import("node:fs");
  const { initLessonState, step } = await import("../server/director/state.js");
  const { requestOf } = await import("../server/director/requests.js");
  const { openItemOf, moduleFacts } = await import("../server/director/modules.js");
  const { leaksOpenItem } = await import("../server/forge/explainer/guard.js");
  const kit = JSON.parse(fs.readFileSync("data/kits/c7-maths.json", "utf8")).topics.find((t) => t.topicId === "c7-maths-ch08-t01");
  const ctx = { sessionId: "ga-t", classLevel: 7, firstName: "Kabir", teacherName: "Arjun", teacherId: "arjun", protege: { name: "Golu", what: "a pretend baby elephant" },
    ageBand: "10-15", lang: "hinglish", interests: ["cricket"], address: "aap", firstMeeting: true, hasCallback: false, topicTitle: kit.title, nextTitle: "x", purpose: "lesson" };
  let r = step(initLessonState({ topicId: kit.topicId, kit, ctx, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
  r = step(r.state, { event: "turn", kit, cls: { outcome: "no_evidence", confidence: 1, flags: {}, source: "request", request: requestOf("mujhe game khelna hai") }, now: 20_000, text: "mujhe game khelna hai" });
  const m = r.state.module;
  assert.equal(r.ui.tray, "module");
  assert.ok(m && m.engine !== "explainer@1", `an engine, not the board rung (got ${m?.engine})`);
  assert.equal(m.itemId ?? null, null, "unbound: graded nothing");
  const open = openItemOf(r.state, kit, null);
  if (open) assert.ok(!leaksOpenItem({ facts: moduleFacts(m), ops: [] }, open));
});

test("QA pass 13: the pointer is in the language of HER line (an English-pref child's Hinglish line got 'Look at the board:'), and a line told to imagine the board that is coming sees it instead", async () => {
  const { boardPointer, seeNotImagine, refersToBoard } = await import("../server/studio/request.js");
  assert.equal(boardPointer("english", "Kabir, number line par 50 metre se 30 metre tak nahi"), "Board par dekho: ");
  assert.equal(boardPointer("english", "Here the sides are 5 and 3."), "Look at the board: ");
  assert.equal(boardPointer("hinglish", "यह एक आयत है"), "बोर्ड पर देखो: ");
  const seen = seeNotImagine("Kabir, number line imagine karo: 0 se 50 m");
  assert.equal(seen, "Kabir, number line dekho: 0 se 50 m");
  assert.ok(refersToBoard(seen));
});

test("QA pass 13 (lesson 42f725b7): an ASKED board under a line that names a rectangle must draw one, even when it draws no closed shape at all (a formula board)", async () => {
  const { namedShapeMissing } = await import("../server/studio/qa/whiteboard.js");
  const line = "Dekho, board par rectangle bana hai: do sides 50 metres aur do sides 30 metres.";
  const formula = [{ op: "text", at: [40, 60], text: "? × ( length + breadth )" }];
  assert.deepEqual(namedShapeMissing(line, formula), [], "not asked: a words-only board is not this check's");
  assert.deepEqual(namedShapeMissing(line, formula, { asked: true }), ["rectangle named, not drawn"]);
  assert.deepEqual(namedShapeMissing(line, [{ op: "rect", at: [20, 20], w: 200, h: 120 }], { asked: true }), []);
});

test("QA pass 13 W16: a number-work cell cut at the old 6-character cap ('breadt') is refused when a word of her line or the kit proves the cut; whole words and plurals stay", async () => {
  const { cutCells } = await import("../server/studio/qa/whiteboard.js");
  const { normalizeScript } = await import("../shared/whiteboard.js");
  const qa = [{ id: "formula", op: "numwork", rows: [["?", "×", "(", "length", "+", "breadt", ")"]] }];
  assert.deepEqual(cutCells(qa, { reply: "length aur breadth ko jodo" }), ['formula: "breadt" (breadth)']);
  assert.deepEqual(cutCells([{ id: "a", op: "numwork", rows: [["length", "minute", "number"]] }], { reply: "length, minutes, number" }), []);
  // the normalizer no longer cuts silently: an equation word fits (one line of text), a column cell over 6 is an error
  const board = { w: 677, h: 423, ground: "chalk" };
  const eq = normalizeScript({ v: 1, scriptId: "s", board, durationMs: 3000, ops: [{ id: "e", op: "numwork", startMs: 0, endMs: 900, at: [40, 80], layout: "equation", rows: [["2", "×", "(", "length", "+", "breadth", ")"]] }] }, { strict: true });
  assert.equal(eq.ok, true, JSON.stringify(eq.errors));
  assert.equal(eq.script.ops[0].rows[0][5], "breadth");
  const col = normalizeScript({ v: 1, scriptId: "s", board, durationMs: 3000, ops: [{ id: "c", op: "numwork", startMs: 0, endMs: 900, at: [40, 80], layout: "column_add", rows: [["1234567"], ["1"], ["1234568"]] }] }, { strict: true });
  assert.equal(col.ok, false);
});
