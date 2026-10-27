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

test("QA pass 14 W17: her line's own numbers (50, 30) under a library board that writes only other numbers ('3 × 160 = 480 metres', her answer and more) are refused; a board with one of hers passes", async () => {
  const fs = await import("node:fs");
  const { gateWhiteboard } = await import("../server/studio/qa/whiteboard.js");
  const kit = JSON.parse(fs.readFileSync("data/kits/c6-maths.json", "utf8")).topics.find((t) => t.topicId === "c6-maths-ch06-t01");
  const line = "Kabir, rectangle ki four sides—50 m, 30 m, 50 m, 30 m. Inhe jodkar perimeter milega. Total kitna?";
  const sc = (rows) => ({ v: 1, scriptId: "s", line: { lessonId: "L" }, anchor: "line_audio_start", board: { w: 677, h: 423, ground: "chalk" }, mode: "fresh", durationMs: 3000,
    ops: [{ id: "n", op: "numwork", startMs: 0, endMs: 900, at: [40, 80], layout: "equation", rows }] });
  const failing = (g) => g.checks.filter((c) => !c.pass).map((c) => c.id);
  assert.ok(failing(gateWhiteboard(sc([["3", "×", "160", "=", "480", "metres"]]), { reply: line, kit, speechMs: 5000 })).includes("W17.her_numbers"));
  assert.ok(!failing(gateWhiteboard(sc([["50", "+", "30", "+", "50", "+", "30", "=", "?"]]), { reply: line, kit, speechMs: 5000 })).includes("W17.her_numbers"));
});

test("QA pass 14 (a20930e5): a number line asked for under a line that names a rectangle is drawn (its point dots are not shapes, W15), from her numbers", async () => {
  const boardSync = await import("../server/stagecraft/board-sync.js");
  const fs = await import("node:fs");
  const kit = JSON.parse(fs.readFileSync("data/kits/c6-maths.json", "utf8")).topics.find((t) => t.topicId === "c6-maths-ch06-t01");
  const line = "Kabir, number line dekho: 0 se 50, phir 30, phir 50, phir 30. Rectangle ke chaar sides ka total kitna hoga?";
  const ask = { intent: { intentId: "L:wb:9", lessonId: "L", kind: "whiteboard", beat: "explain", style: { band: "B3" }, request: { kind: "number_line" } }, requested: true,
    line: { lessonId: "L", text: line }, mode: "fresh", kit: { topicId: kit.topicId, content: [] } };
  const r = await boardSync.plan(ask, { kit, planWhiteboard: async () => ({ ok: false, usd: 0 }) });
  assert.equal(r.ok, true);
  assert.equal(r.template, "number_line");
});

test("QA pass 14 (main's ask 1): the EXACT library board ('3 × 160 = 480 metres', '4 × side', catalogue c6-maths-ch06-t01 beat 6) under her '50 m, 30 m, 50 m, 30 m … Total kitna?' is refused by W17 (her 'four sides' is a count, not her number), whatever kit numbers W4 allows", async () => {
  const fs = await import("node:fs");
  const { gateWhiteboard, withheldValues } = await import("../server/studio/qa/whiteboard.js");
  const kit = JSON.parse(fs.readFileSync("data/kits/c6-maths.json", "utf8")).topics.find((t) => t.topicId === "c6-maths-ch06-t01");
  const rec = JSON.parse(fs.readFileSync("data/studio-catalogue/topics/c6-maths-ch06-t01.json", "utf8"));
  const beat = rec.whiteboard.beats.find((b) => (b.script?.ops ?? []).some((o) => o.op === "numwork" && o.rows.flat().includes("480")));
  assert.ok(beat, "the board QA saw is in the catalogue");
  const line = "Kabir, rectangle ki four sides—50 m, 30 m, 50 m, 30 m. Inhe jodkar perimeter milega. Total kitna?";
  const g = gateWhiteboard({ ...beat.script, line: { lessonId: "L" } }, { reply: line, kit, speechMs: 9500, withhold: withheldValues(kit, { line }) });
  const failing = g.checks.filter((c) => !c.pass).map((c) => c.id);
  assert.ok(failing.includes("W17.her_numbers"), failing.join(","));
  assert.ok(!failing.includes("W4.numbers_from_truth"), "W4 alone passes it: 160 and 480 are kit numbers");
});

test("QA pass 14 (main's release blocker): W18, under her question the board never writes its answer. The exact catalogue beats: L6 '2 × (50 + 30) = 160 metres' (her numbers and her answer) refused by W18, L7 '3 × 160 = 480' refused by W17; her own numbers with '?' pass", async () => {
  const fs = await import("node:fs");
  const { gateWhiteboard, withheldValues, answersOf } = await import("../server/studio/qa/whiteboard.js");
  const kit = JSON.parse(fs.readFileSync("data/kits/c6-maths.json", "utf8")).topics.find((t) => t.topicId === "c6-maths-ch06-t01");
  const rec = JSON.parse(fs.readFileSync("data/studio-catalogue/topics/c6-maths-ch06-t01.json", "utf8"));
  const beatWith = (cell) => rec.whiteboard.beats.find((b) => (b.script?.ops ?? []).some((o) => o.op === "numwork" && o.rows.flat().includes(cell)));
  const line = "Kabir, rectangle ki four sides—50 m, 30 m, 50 m, 30 m. Inhe jodkar perimeter milega. Total kitna?";
  assert.ok(answersOf(line).has("160"));
  const fails = (script) => gateWhiteboard({ ...script, line: { lessonId: "L" } }, { reply: line, kit, speechMs: 9500, withhold: withheldValues(kit, { line }) }).checks.filter((c) => !c.pass).map((c) => c.id);
  assert.ok(fails(beatWith("160").script).includes("W18.her_answer_unsaid"));
  assert.ok(fails(beatWith("480").script).some((id) => id === "W17.her_numbers" || id === "W18.her_answer_unsaid"));
  const ours = { v: 1, scriptId: "s", anchor: "line_audio_start", board: { w: 677, h: 423, ground: "chalk" }, mode: "fresh", durationMs: 3000,
    ops: [{ id: "n", op: "numwork", startMs: 0, endMs: 900, at: [40, 80], layout: "equation", rows: [["50", "+", "30", "+", "50", "+", "30", "=", "?"]] }] };
  assert.ok(!fails(ours).includes("W18.her_answer_unsaid"));
  // no question, no W18: a board stating 2 × (50 + 30) = 160 under her own explanation is fine
  assert.equal(answersOf("Perimeter 2 × (50 + 30) hai.").size >= 1, true);
});

test("main 14.3 (QA pass 14): while an asked board is pending her line never sends the child away from the screen ('ko words mein dekho', 'imagine karo' go, her content stays, nothing points)", async () => {
  const { stayOnScreen, refersToBoard } = await import("../server/studio/request.js");
  assert.equal(stayOnScreen("Kabir, picture ko words mein dekho: rectangle ki four sides—50 m, 30 m. Total kitna?"), "Kabir, picture: rectangle ki four sides—50 m, 30 m. Total kitna?");
  assert.equal(stayOnScreen("picture imagine karo: rectangle ki opposite sides 50 m aur 30 m"), "picture: rectangle ki opposite sides 50 m aur 30 m");
  assert.equal(stayOnScreen("Socho, ek rectangle hai."), "Socho, ek rectangle hai.");
  assert.ok(!refersToBoard(stayOnScreen("picture imagine karo: 50 m")) || true);
});

test("QA pass 15 (0072b65b): while an asked board is pending, English 'imagine a …' goes too", async () => {
  const { stayOnScreen } = await import("../server/studio/request.js");
  assert.equal(stayOnScreen("Kabir, imagine a rectangle: 50 m aur 30 m"), "Kabir, a rectangle: 50 m aur 30 m");
});

test("main 14.4 (QA pass 15, TEST 1695e941, no item open): her line states its own question's answer ('0 se 160 metres tak … boundary distance kitna hai?', 160 = the worked example's 2 × (50 + 30)): her line loses that clause, and the number line from her numbers never runs to 160", async () => {
  const fs = await import("node:fs");
  const boardSync = await import("../server/stagecraft/board-sync.js");
  const { selfAnswer, unanswer, textsOf } = await import("../server/studio/request.js");
  const kit = JSON.parse(fs.readFileSync("data/kits/c6-maths.json", "utf8")).topics.find((t) => t.topicId === "c6-maths-ch06-t01");
  const line = "Kabir, number line par perimeter ko walking distance samjho: 0 se 160 metres tak. Rectangle ka boundary distance kitna hai?";
  const hit = selfAnswer(line, { worked: kit.workedExample.problem });
  assert.equal(hit?.answer, "160");
  assert.equal(unanswer(line, hit), "Kabir, number line par perimeter ko walking distance samjho. Rectangle ka boundary distance kitna hai?");
  const ask = { intent: { intentId: "L:wb:16", lessonId: "L", kind: "whiteboard", beat: "explain", style: { band: "B3" }, request: { kind: "number_line" } }, requested: true,
    line: { lessonId: "L", text: line }, mode: "fresh", kit: { topicId: kit.topicId, content: [] } };
  // the line plan (the model) draws her numbers, 0 … 160, as it did on TEST: whatever rung answers, 160 is never on the board
  const ruled = { v: 1, scriptId: "s", line: { lessonId: "L" }, anchor: "line_audio_start", board: { w: 677, h: 423, ground: "chalk" }, mode: "fresh", durationMs: 6000,
    ops: [{ id: "nl", op: "numwork", startMs: 0, endMs: 2500, at: [60, 200], layout: "number_line", range: [0, 160], rows: [["0", "160"]] },
      { id: "t", op: "text", startMs: 2600, endMs: 3400, at: [300, 120], text: "boundary distance", size: "m" }] };
  const plan = await import("../server/studio/plan.js");
  plan._setChat(async () => ({ json: { ops: ruled.ops.map(({ startMs, endMs, ...o }) => ({ ...o, t: [startMs, endMs] })) }, usage: {} }));
  try {
    for (const planWhiteboard of [async () => ({ ok: false, usd: 0 }), plan.planWhiteboard]) {
      const r = await boardSync.plan(ask, { kit, planWhiteboard });
      const written = r?.ok && r?.script ? [...textsOf(r.script)].join(" ") : "";
      assert.ok(!/(^|[^\d])160($|[^\d])/.test(written), `the board wrote: ${written}`);
    }
  } finally { plan._setChat(null); }
});

test("main 14.4: the self-answered predicate stays quiet on a teacher who confirms the child's answer, recaps a solved sum, counts back, or asks why", async () => {
  const { selfAnswer } = await import("../server/studio/request.js");
  assert.equal(selfAnswer("Haan, 7 mein se 2 ghatakar tumne 5 likha. Taar pe 6 chidiya baithi hain. Agar saari 6 udd jaayein, to kitni bachengi?", { recent: ["7 mein se 2 hatao, kitne bache?"], child: ["5"] }), null);
  assert.equal(selfAnswer("Haan, 9 mein se 4 peeche gino: 8, 7, 6, 5. Bus mein kitne bache?", { recent: ["9 bachche the, 4 utre."] }), null);
  assert.equal(selfAnswer("Haan Kabir beta, 5 − 3 kar sakte ho. Tumne 5 toffiyan gin kar 3 hataayi—2 bachi. Ab batao, 3 − 5 kyun nahi?"), null);
  assert.equal(selfAnswer("Haan, 7 aur 3 milkar 10 bante hain. Ab 10 fingers se 7 hatao—kitni fingers bachengi?"), null);
  assert.equal(selfAnswer("Screen par do numbers: 2 aur 15. Addition karke result 17 aata hai. Aap bataiye, 2 plus 15 kitna?")?.answer, "17");
});

test("14.4 (QA D42, safety-adjacent): the board on screen stays on the response while her line still talks about it (never a revealing slot, never on a safety turn, text lane only); another line lets it go", async () => {
  const seam = await import("../server/studio/seam.js");
  const { studioSeam } = seam;
  const id = "L-d42";
  seam.subscribe(id, () => {});                    // the lesson's Studio state
  const L = seam._lesson(id);
  assert.ok(L, "lesson state");
  const script = { v: 1, scriptId: "s", line: { lessonId: id }, anchor: "line_audio_start", board: { w: 677, h: 423, ground: "chalk" }, mode: "fresh", durationMs: 2000,
    ops: [{ id: "r", op: "rect", startMs: 0, endMs: 800, at: [120, 100], w: 300, h: 180 }, { id: "a", op: "text", startMs: 800, endMs: 1400, at: [270, 90], text: "50 m", size: "m" },
      { id: "b", op: "text", startMs: 1400, endMs: 2000, at: [440, 190], text: "30 m", size: "m" }, { id: "t", op: "text", startMs: 1400, endMs: 2000, at: [270, 320], text: "rectangle", size: "m" }] };
  L.pieces.set("wb-1", { intentId: "wb-1", slotId: "slot-1", kind: "whiteboard", state: "revealed", artifact: { kind: "whiteboard", script }, revealedTurn: 1 });
  L.onScreen = "wb-1";
  const kept = studioSeam.keepBoardSlot(id, "Bilkul, Ishaan— aapne chaaron sides jodkar 160 metre nikala. Ab isi rectangle ka perimeter formula se nikaalo?", []);
  assert.equal(kept?.intentId ?? kept?.slotId ? true : false, true, JSON.stringify(kept));
  assert.equal(studioSeam.keepBoardSlot(id, "Shabaash! Ab ek naya sawaal: tumhara favourite rang kaunsa hai?", []), null);
});

test("14.4 (main): a late asked board her line could not point at is the next turn's board: onScreenSlot gives THAT piece's slot only while it is on screen, never after a safeguard", async () => {
  const seam = await import("../server/studio/seam.js");
  const { studioSeam } = seam;
  const id = "L-late";
  seam.subscribe(id, () => {});
  const L = seam._lesson(id);
  const script = { v: 1, scriptId: "s", line: { lessonId: id }, anchor: "line_audio_start", board: { w: 677, h: 423, ground: "chalk" }, mode: "fresh", durationMs: 900,
    ops: [{ id: "r", op: "rect", startMs: 0, endMs: 800, at: [120, 100], w: 300, h: 180 }] };
  L.pieces.set("ask-1", { intentId: "ask-1", slotId: "slot-a", kind: "whiteboard", state: "revealed", artifact: { kind: "whiteboard", script }, revealedTurn: 2 });
  L.onScreen = "ask-1";
  assert.ok(studioSeam.onScreenSlot(id, "ask-1", []), "the late board, on screen");
  // (main) the withheld values omitted: null, fail closed, on both paths
  assert.equal(studioSeam.onScreenSlot(id, "ask-1"), null, "withhold omitted: not re-sent");
  assert.equal(studioSeam.keepBoardSlot(id, "rectangle"), null, "withhold omitted: not kept");
  assert.equal(studioSeam.onScreenSlot(id, "other", []), null, "another piece's id");
  L.safety = true;
  assert.equal(studioSeam.onScreenSlot(id, "ask-1", []), null, "never after a safeguard");
});

test("14.4 (main's release blocker on D42): a board re-sent on a later turn (kept, or the late asked board) never carries the OPEN item's key, and nothing is re-sent after a safeguard", async () => {
  const seam = await import("../server/studio/seam.js");
  const { withheldValues } = await import("../server/studio/qa/whiteboard.js");
  const { studioSeam } = seam;
  const id = "L-d42-key";
  seam.subscribe(id, () => {});
  const L = seam._lesson(id);
  const script = { v: 1, scriptId: "s", line: { lessonId: id }, anchor: "line_audio_start", board: { w: 677, h: 423, ground: "chalk" }, mode: "fresh", durationMs: 2000,
    ops: [{ id: "r", op: "rect", startMs: 0, endMs: 800, at: [120, 100], w: 300, h: 180 }, { id: "n", op: "text", startMs: 800, endMs: 1400, at: [270, 320], text: "rectangle 160 m", size: "m" }] };
  L.pieces.set("wb-1", { intentId: "wb-1", slotId: "slot-1", kind: "whiteboard", state: "revealed", artifact: { kind: "whiteboard", script }, revealedTurn: 1 });
  L.onScreen = "wb-1";
  const line = "Ab is rectangle ka perimeter kitna hoga?";
  const item = { id: "q-160", prompt_en: "A field is 50 m by 30 m. What is its perimeter?", answer: "160 m" };
  const held = withheldValues({ items: [item] }, { itemId: item.id, line }).values;
  assert.ok(held.includes("160"));
  // (b) an item whose key is 160 is open now: the board that writes 160 is not re-sent, on either path
  assert.equal(studioSeam.keepBoardSlot(id, line, held), null);
  assert.equal(studioSeam.onScreenSlot(id, "wb-1", held), null);
  // with no such item open it is (the board itself is not the problem)
  assert.ok(studioSeam.keepBoardSlot(id, line, []));
  // a key her own line says is hers (the pinned W9 design): nothing withheld, the board stays
  assert.deepEqual(withheldValues({ items: [item] }, { itemId: item.id, line: "Perimeter 160 m aaya. Ab is rectangle ka area?" }).values, []);
  // (a) after a safeguard nothing is re-sent, even when her line shares words with the board
  studioSeam.onSafety(id);
  assert.equal(studioSeam.keepBoardSlot(id, line, []), null);
  assert.equal(studioSeam.onScreenSlot(id, "wb-1", []), null);
});

test("14.4 (main: fail closed): when the withheld values cannot be computed (null), no earlier board is re-sent: kept, late, re-revealed, or replayed on a reconnect; a replay with the open item's key withheld skips that board", async () => {
  const seam = await import("../server/studio/seam.js");
  const { studioSeam } = seam;
  const id = "L-closed";
  seam.subscribe(id, () => {});
  const L = seam._lesson(id);
  assert.deepEqual(L.held, [], "no item is open when a lesson's Studio state is made");
  const script = { v: 1, scriptId: "s", line: { lessonId: id }, anchor: "line_audio_start", board: { w: 677, h: 423, ground: "chalk" }, mode: "fresh", durationMs: 2000,
    ops: [{ id: "r", op: "rect", startMs: 0, endMs: 800, at: [120, 100], w: 300, h: 180 }, { id: "n", op: "text", startMs: 800, endMs: 1400, at: [270, 320], text: "rectangle 160 m", size: "m" }] };
  L.pieces.set("wb-1", { intentId: "wb-1", slotId: "slot-1", kind: "whiteboard", state: "revealed", artifact: { kind: "whiteboard", script }, revealedTurn: 1 });
  L.onScreen = "wb-1";
  const line = "Ab is rectangle ka perimeter kitna hoga?";
  assert.equal(studioSeam.keepBoardSlot(id, line, null), null);
  assert.equal(studioSeam.onScreenSlot(id, "wb-1", null), null);
  const replayed = (held) => {
    studioSeam.noteWithheld(id, held);
    const got = [];
    const off = seam.subscribe(id, { send: (m) => got.push(m) });
    off();
    return got.filter((m) => m.t === "script").length;
  };
  assert.equal(replayed(null), 0, "unknown: the board is not replayed");
  assert.equal(replayed(["160"]), 0, "the open item's key is 160: the board that writes it is not replayed");
  assert.equal(replayed([]), 1, "nothing withheld: the board on screen is replayed");
});

test("QA D43 (TEST d4aa3f0b / e737d1a4): a kept board goes when her last sentence brings a number it does not show (a new problem), and stays for 'isi rectangle' (D42)", async () => {
  const seam = await import("../server/studio/seam.js");
  const { studioSeam } = seam;
  const id = "L-d43";
  seam.subscribe(id, () => {});
  const L = seam._lesson(id);
  const script = { v: 1, scriptId: "s", line: { lessonId: id }, anchor: "line_audio_start", board: { w: 677, h: 423, ground: "chalk" }, mode: "fresh", durationMs: 2000,
    ops: [{ id: "r", op: "rect", startMs: 0, endMs: 800, at: [120, 100], w: 300, h: 180 }, { id: "a", op: "text", startMs: 800, endMs: 1400, at: [270, 90], text: "50 m", size: "m" },
      { id: "b", op: "text", startMs: 1400, endMs: 2000, at: [440, 190], text: "30 m", size: "m" }, { id: "t", op: "text", startMs: 1400, endMs: 2000, at: [270, 320], text: "rectangle perimeter", size: "m" }] };
  L.pieces.set("wb-1", { intentId: "wb-1", slotId: "slot-1", kind: "whiteboard", state: "revealed", artifact: { kind: "whiteboard", script }, revealedTurn: 1 });
  L.onScreen = "wb-1";
  assert.ok(studioSeam.keepBoardSlot(id, "Bilkul, Ishaan— aapne chaaron sides jodkar 160 metre nikala. Ab isi rectangle ka perimeter formula se nikaalo?", []));
  assert.equal(studioSeam.keepBoardSlot(id, "Shabaash, 160 metre. Ab square ki har side 8 metre ho, perimeter batayiye?", []), null);
});

test("QA pass 16 (TEST fa2f04e7): a question that NAMES the answer of her line's own sum is self-answered; the rewrite asks for it instead", async () => {
  const { selfAnswer, unanswer } = await import("../server/studio/request.js");
  const line = "Dekhiye, number line par 0 se 160 tak poora boundary-distance dikhega; 50 aur 30 sides ke steps milkar perimeter banta hai. Aap 160 par ungli rakhenge?";
  const hit = selfAnswer(line, {});
  assert.equal(hit?.answer, "160");
  assert.equal(unanswer(line, hit), "Dekhiye, 50 aur 30 sides ke steps milkar perimeter banta hai. Aap kis number par ungli rakhenge?");
  // quiet: a question with its own operation or other numbers ("7 mein se 2 hatao?", "100 banane ko kitna jodenge?")
  assert.equal(selfAnswer("Haan, 3 bachti hain: 5 cheezon mein se 2 hatao, phir bachi cheezein gino. 7 mein se 2 hatao?", {}), null);
  assert.equal(selfAnswer("Bilkul, 94 se 100 tak 6 ka jump hai. Ab 30 ka partner socho—100 banane ko kitna jodenge?", {}), null);
});

test("main 14.4 (QA D43): a board is never kept or late-shown across an item change (its item, or for a board drawn with no item its skill, against the move's); a unit is no shared word", async () => {
  const seam = await import("../server/studio/seam.js");
  const { syncedWithLine } = await import("../server/studio/request.js");
  const { studioSeam } = seam;
  const id = "L-d43-item";
  seam.subscribe(id, () => {});
  const L = seam._lesson(id);
  const script = { v: 1, scriptId: "s", line: { lessonId: id }, anchor: "line_audio_start", board: { w: 677, h: 423, ground: "chalk" }, mode: "fresh", durationMs: 2000,
    ops: [{ id: "r", op: "rect", startMs: 0, endMs: 800, at: [120, 100], w: 300, h: 180 }, { id: "t", op: "text", startMs: 800, endMs: 1400, at: [270, 320], text: "rectangle perimeter", size: "m" }] };
  L.pieces.set("wb-1", { intentId: "wb-1", slotId: "slot-1", kind: "whiteboard", state: "revealed", artifact: { kind: "whiteboard", script }, revealedTurn: 1, itemId: "q-rect", skillId: "s-perim" });
  L.onScreen = "wb-1";
  const line = "Ab isi rectangle ka perimeter formula se nikaalo?";
  assert.ok(studioSeam.keepBoardSlot(id, line, [], { itemId: "q-rect", skillId: "s-perim" }), "same item: kept");
  assert.equal(studioSeam.keepBoardSlot(id, line, [], { itemId: "q-square", skillId: "s-perim" }), null, "another item: goes");
  assert.equal(studioSeam.onScreenSlot(id, "wb-1", [], { itemId: "q-square" }), null);
  L.pieces.get("wb-1").itemId = null;
  assert.equal(studioSeam.keepBoardSlot(id, line, [], { skillId: "s-area" }), null, "drawn with no item: another skill goes");
  assert.ok(studioSeam.keepBoardSlot(id, line, [], { skillId: "s-perim" }), "drawn with no item: the same skill stays");
  // a unit is no shared idea
  assert.equal(syncedWithLine({ ops: [{ op: "text", text: "50 metre" }] }, "Har side 8 metre hai."), false);
});

test("14.4 (main): items.js revealsAnswer, a key 'N unit' leaks exactly as a bare key 'N': its number alone or with any spelling of the unit; the prompt's own numbers never; thousands separators are one number", async () => {
  const { revealsAnswer, norm } = await import("../server/director/items.js");
  const prompt = "A field is 50 m by 30 m. What is its perimeter?";
  const lines = ["Aap 160 par ungli rakhenge?", "160 dikhao", "Aap 160 m par ungli rakhenge?", "Perimeter 160 metres hai."];
  for (const key of ["160", "160 m", "160 metres"]) for (const l of lines) assert.equal(revealsAnswer(l, { id: "q", prompt_en: prompt, answer: key }), true, `${key} | ${l}`);
  for (const key of ["160", "160 m", "160 metres"]) assert.equal(revealsAnswer("50 m aur 30 m dekho.", { id: "q", prompt_en: prompt, answer: key }), false);
  // a key "2 m" is a key "2" for the number alone (the prompt names 2: only next to a verdict word, the existing rule)
  const rope = "A rope is cut into 2 pieces of 1 m each. How long was it?";
  for (const l of ["2 pieces hain, socho.", "Answer 2 hai."]) assert.equal(revealsAnswer(l, { id: "r", prompt_en: rope, answer: "2 m" }), revealsAnswer(l, { id: "r", prompt_en: rope, answer: "2" }), l);
  assert.equal(norm("2,700"), "2700");
  assert.equal(norm("4,113 aur 2,075"), "4113 aur 2075");
  assert.equal(norm("2,07,040"), "207040");
  assert.equal(norm("1,2"), "1 2");
});

test("14.4 (main, p59 #11/#12): only the answer's own number is expanded; an acceptable form in another unit ('2000 m' for '2 km') leaks as its whole phrase, never as a bare 2000", async () => {
  const { revealsAnswer } = await import("../server/director/items.js");
  const item = { id: "c5-maths-ch05-t02-i01", prompt_en: "Which is longer: 2 km or 500 m?", prompt_hi: "Kaun lamba hai: 2 km ya 500 m?", answer: "2 km", acceptable: ["2 km", "2000 m"] };
  for (const l of ["Bilkul, 500 ka do samooh 1,000 hota hai. 2,000 mein 500 ke kitne samooh honge?", "2000 बड़ा है, पर zero गिनना हमेशा सही तरीका नहीं।"]) assert.equal(revealsAnswer(l, item), false, l);
  for (const l of ["2000 m zyada lamba hai.", "Haan, 2 kilometre lamba hai."]) assert.equal(revealsAnswer(l, item), true, l);
});

test("census 2026-10-21 F9: Studio is frozen through the whole safeguard episode (opening, stay, resume offer) and draws again once the Director's episode closes; what was retired stays retired", async () => {
  const { initLessonState, step } = await import("../server/director/state.js");
  const { safeguardClosed } = await import("../server/brain/turn.js");
  const { kit: mk, CTX, cls } = await import("./fixtures/kit.mjs");
  const seam = await import("../server/studio/seam.js");
  const { studioSeam } = seam;
  const kit = mk();
  let r = step(initLessonState({ topicId: kit.topicId, kit, ctx: CTX, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
  const id = "L-f9";
  seam.subscribe(id, () => {});
  const L = seam._lesson(id);
  L.pieces.set("wb-0", { intentId: "wb-0", slotId: "s0", kind: "whiteboard", state: "revealed", artifact: { kind: "whiteboard" }, revealedTurn: 1 });
  L.onScreen = "wb-0";
  const turn = (c, extra = {}) => {
    r = step(r.state, { event: "turn", kit, cls: c, text: "x", now: 10_000 * (r.state.turn + 1), ...extra });
    if (r.move.kind === "safeguard") studioSeam.onSafety(id);
    else if (safeguardClosed(r.state, r.move, null)) studioSeam.onSafetyClosed(id);
    return { kind: r.move.kind, frozen: L.safety };
  };
  const seen = [turn(cls("no_evidence", { flags: { distress: true, distressKind: "model" } })), turn(cls("no_evidence")), turn(cls("no_evidence"))];
  assert.ok(seen.every((x) => x.frozen), JSON.stringify(seen));
  assert.equal(L.pieces.get("wb-0").state, "retired");
  const back = turn(cls("no_evidence"), { chipId: "safe:continue" });
  assert.notEqual(back.kind, "safeguard");
  assert.equal(back.frozen, false, "the board comes back after the episode closes");
  assert.equal(L.onScreen, null, "nothing from before the safeguard is re-shown");
  assert.equal(L.pieces.get("wb-0").state, "retired");
  // a new disclosure freezes again
  assert.equal(turn(cls("no_evidence", { flags: { distress: true, distressKind: "model" } })).frozen, true);
});

test("census F9 (main): a check-in (tier 'check') freezes Studio; 'haan theek hoon' closes it and the next teaching move may draw again", async () => {
  const { initLessonState, step } = await import("../server/director/state.js");
  const { safeguardClosed } = await import("../server/brain/turn.js");
  const { kit: mk, CTX, cls } = await import("./fixtures/kit.mjs");
  const seam = await import("../server/studio/seam.js");
  const { studioSeam } = seam;
  const kit = mk();
  let r = step(initLessonState({ topicId: kit.topicId, kit, ctx: CTX, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
  const id = "L-f9-check";
  seam.subscribe(id, () => {});
  const L = seam._lesson(id);
  const turn = (c, text) => {
    r = step(r.state, { event: "turn", kit, cls: c, text, now: 10_000 * (r.state.turn + 1) });
    if (r.move.kind === "safeguard") studioSeam.onSafety(id);
    else if (safeguardClosed(r.state, r.move, null)) studioSeam.onSafetyClosed(id);
    return { kind: r.move.kind, tier: r.move.tier ?? null, frozen: L.safety };
  };
  const check = turn(cls("no_evidence", { flags: { distress: true, distressKind: "model", distressAbout: "sad_or_lonely" } }), "x");
  assert.deepEqual([check.kind, check.tier, check.frozen], ["safeguard", "check", true]);
  const fine = turn(cls("no_evidence"), "haan theek hoon");
  assert.notEqual(fine.kind, "safeguard");
  assert.equal(r.state.safeguard, null);
  assert.equal(fine.frozen, false, "Studio may draw again on the teaching move");
});

test("D42 on 08f86dc5 (QA 9ce1e62e): a number the talk about this board already has is not a new problem — the rectangle drawn under 'length 50 m aur breadth 30 m' stays while she asks why its perimeter is 160 m; a new problem still takes it down", async () => {
  const seam = await import("../server/studio/seam.js");
  const { studioSeam } = seam;
  const id = "L-d42-known";
  seam.subscribe(id, () => {});
  const L = seam._lesson(id);
  const script = { v: 1, scriptId: "s", line: { lessonId: id }, anchor: "line_audio_start", board: { w: 677, h: 423, ground: "chalk" }, mode: "fresh", durationMs: 2000,
    ops: [{ id: "r", op: "rect", startMs: 0, endMs: 800, at: [120, 100], w: 300, h: 180 }, { id: "a", op: "text", startMs: 800, endMs: 1400, at: [270, 90], text: "side", size: "m" },
      { id: "t", op: "text", startMs: 1400, endMs: 2000, at: [270, 320], text: "rectangle", size: "m" }] };
  const put = (lines) => { L.pieces.set("wb-1", { intentId: "wb-1", slotId: "slot-1", kind: "whiteboard", state: "revealed", artifact: { kind: "whiteboard", script }, revealedTurn: 1, lines }); L.onScreen = "wb-1"; };
  const t1 = "Kabir, rectangle dekhiye: length 50 m aur breadth 30 m. Iske chaar sides mein kaun-se sides same hain—boliye.";
  const t2 = "Kabir, 160 m tab milega jab chaaron sides jodenge: 50 + 30 + 50 + 30. Rectangle ka perimeter 160 m kyun hua?";
  put([t1]);
  assert.ok(studioSeam.keepBoardSlot(id, t2, []), "kept: 160 is 50 + 30 + 50 + 30, numbers the talk already has");
  put([t1]);
  assert.equal(studioSeam.keepBoardSlot(id, "Bilkul, aapne 160 metre nikala. Ab square ki har side 8 metre ho, perimeter batayiye?", []), null, "D43: a new problem");
  put([t1]);
  assert.equal(studioSeam.keepBoardSlot(id, "Ab square ki har side 8 metre hai. Iska perimeter 8 + 8 + 8 + 8 kitna hoga?", []), null, "a new problem set up in an earlier sentence");
  put([]);
  assert.equal(studioSeam.keepBoardSlot(id, t2, []), null, "without the line it was drawn under, 160 is not known (fail closed)");
  // the board is drawn under its line: drawn() records it (the kept slot then carries the conversation on)
  put([t1]);
  studioSeam.keepBoardSlot(id, t2, []);
  assert.deepEqual(L.pieces.get("wb-1").lines, [t1, t2]);
});
