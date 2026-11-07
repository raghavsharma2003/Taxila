// Round 7 (main, dc-r7-teaching-scripts): the board-ref vocabulary a lesson script's explain beat names. Every listed
// template renders from its example; an unknown or out-of-range ref is refused with its reason; `{ auto: true }` is the
// code's own pick; certifyBoardRef runs the full whiteboard gate against the beat's line.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { BOARD_REFS, resolveBoardRef, certifyBoardRef } from "../server/forge/explainer/board-ref.js";

const kit = JSON.parse(fs.readFileSync("data/kits/c5-maths.json", "utf8")).topics.find((t) => t.topicId === "c5-maths-ch02-t01");

test("board refs: every template in the vocabulary renders from its own example", () => {
  assert.ok(Object.keys(BOARD_REFS).length >= 20);
  for (const [template, d] of Object.entries(BOARD_REFS)) {
    const r = resolveBoardRef({ template, ...d.example });
    assert.ok(r.ok, `${template}: ${r.why}`);
  }
});

test("board refs: unknown and out-of-range refs are refused with a reason; withhold 'item' hides the result", () => {
  assert.match(resolveBoardRef({ template: "volcano@9" }).why, /unknown_template/);
  assert.equal(resolveBoardRef({ template: "fraction-line@1", den: 40 }).ok, false);
  assert.equal(resolveBoardRef(null).ok, false);
  assert.equal(resolveBoardRef({ template: "equal-groups@1", groups: 3, each: 4, withhold: "item" }).call.hideResult, true);
  assert.deepEqual(resolveBoardRef({ auto: true }, { kit }).call, { template: "fraction-line@1", den: 5, target: [2, 5], show: true });
});

test("board refs: certify runs the full gate (the line must say what the board shows)", async () => {
  const ok = await certifyBoardRef({ template: "fraction-line@1", den: 5, target: [2, 5], show: true }, { kit, line: kit.workedExample.steps.join(" ") });
  assert.equal(ok.ok, true, JSON.stringify(ok.failed));
  const item = kit.items.find((i) => i.id.endsWith("-i03"));
  const leak = await certifyBoardRef({ template: "fraction-line@1", den: 5, target: [3, 5], show: true }, { kit, item, line: item.prompt_en });
  assert.equal(leak.ok, false, "a ref that places the asked fraction is refused");
  assert.ok(leak.failed.includes("W9.no_reveal"));
});

test("board-first preselect builds the board a scripted beat names (intent.boardRef), else the code's own pick", async () => {
  const BF = await import("../server/stagecraft/board-first.js");
  const { kitFromFile } = await import("../server/content/kits.js");
  const { getTopic } = await import("../server/content/curriculum.js");
  const k6 = kitFromFile(getTopic("c6-maths-ch06-t01"));
  const ask = (id, boardRef) => ({ intent: { intentId: id, lessonId: id.split(":wb:")[0], kind: "whiteboard", beat: "explain", style: { band: "B3" }, ...(boardRef ? { boardRef } : {}) },
    line: { lessonId: id.split(":wb:")[0], text: "" }, mode: "fresh", kit: { topicId: k6.topicId, content: [k6.expectations[0]] } });
  const ref = { template: "measured@1", shape: "rect", w: 50, h: 30, unit: "m", trace: true };
  const p = BF.preselect(ask("sref1:wb:1", ref), { kit: k6 });
  assert.equal(p?.by, "script", JSON.stringify(p && { by: p.by, template: p.template }));
  assert.equal(p.template, "measured@1");
  // (gated like any board: a side that is some item's answer is written "?" until her line says it)
  assert.match(JSON.stringify(p.facts), /m/);
  // Brain's nested form is the same ref
  assert.equal(resolveBoardRef({ template: "measured@1", params: { shape: "rect", w: 50, h: 30, unit: "m" } }).ok, true);
  // a ref that cannot render falls back to the code's pick (never no board because of a bad ref)
  const before = BF.scriptRefStats().failed;
  const q = BF.preselect(ask("sref2:wb:1", { template: "measured@1", shape: "rect", w: -1, h: 3, unit: "m" }), { kit: k6 });
  assert.equal(BF.scriptRefStats().failed, before + 1);
  assert.notEqual(q?.by, "script");
});

test("W4 reads a list's commas as separators, a thousands comma as part of the number (Learning: '7, 3, 3, 3')", async () => {
  const { numbersIn } = await import("../server/studio/qa/whiteboard.js");
  const n = [...numbersIn("7, 3, 3, 3 and 45,000 and 1,00,000")];
  for (const v of ["7", "3", "45000", "100000"]) assert.ok(n.includes(v), v);
  assert.ok(!n.some((v) => v.includes(",")));
});

test("director4 S1/S2: a scripted explain step gets its board even as a 'continue' ask, with every authored number shown", async () => {
  const BF = await import("../server/stagecraft/board-first.js");
  const { kitFromFile } = await import("../server/content/kits.js");
  const { getTopic } = await import("../server/content/curriculum.js");
  const ask = (t, ref, kind, n) => { const kit = kitFromFile(getTopic(t)); const it = kit.items[0];
    return [{ intent: { intentId: `d4-${n}:wb:1`, lessonId: `d4-${n}`, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: ref, scriptBeat: { scriptId: "s", beatId: `e${n}`, kind } },
      line: { lessonId: `d4-${n}`, text: "" }, mode: "continue", kit: { topicId: t, content: [], item: { id: it.id, prompt_en: it.prompt_en } } }, kit]; };
  const pick = (...a) => { const [q, kit] = ask(...a); return BF.preselect(q, { kit }); };
  const c5 = pick("c5-maths-ch02-t01", { template: "fraction-line@1", params: { den: 2, from: 0, to: 1, marks: [{ num: 1, label: "1/2" }] } }, "explain", 1);
  assert.equal(c5?.by, "script", "S1: Brain's one 'explain' beat id made steps 2-3 'continue': no board at all");
  assert.deepEqual(c5.screen, { template: "fraction-line@1", shape: "number line", numbers: ["0", "1", "1/2"], labels: ["1/2"],
    counts: { lines: [{ gaps: 2, ticks: 3, innerTicks: 1 }], marks: [{ at: "1/2", label: "1/2" }] } });
  const tri = pick("c6-maths-ch06-t01", { template: "measured@1", params: { shape: "triangle", unit: "cm", sides: [4, 5, 6], trace: true } }, "explain", 2);
  assert.equal(tri?.by, "script");
  assert.ok(["4", "5", "6"].every((v) => tri.screen.numbers.includes(v)), `S2: no '? cm' (${JSON.stringify(tri.screen)})`);
  assert.equal(tri.screen.shape, "triangle");
  const pent = pick("c6-maths-ch06-t01", { template: "measured@1", params: { shape: "pentagon", unit: "m", sides: [4, 5, 3, 6, 2] } }, "worked", 3);
  assert.deepEqual(pent.screen.numbers, ["4", "5", "3", "6", "2"]);
  // a check beat still withholds: the named mark is "?"
  const chk = pick("c5-maths-ch02-t01", { template: "fraction-line@1", params: { den: 3, from: 0, to: 1, mark: 1 } }, "check", 4);
  assert.ok(!chk.screen.numbers.includes("1/3"));
  // certify: a ref whose board leaves the line's measures off fails
  const bare = await certifyBoardRef({ template: "shape@1", shape: "pentagon" }, { line: "Ek paanch bhujaon wali kyaari: 4 m, 5 m, 3 m, 6 m, 2 m." });
  assert.ok(bare.failed.some((f) => f.startsWith("line_measures_not_on_board")));
});

test("Brain R4: a screen's shape is always one word of the closed set", async () => {
  const { screenOf, SCREEN_SHAPES } = await import("../server/stagecraft/board-first.js");
  const s = (t, shape) => screenOf({ template: t }, { onScreen: { shape } }).shape;
  assert.equal(s("measured@1", "rect"), "rectangle");
  assert.equal(s("measured@1", "7-sided shape"), "polygon");
  assert.equal(s("shape@1", "kyaari"), "drawing", "a free name is never passed through");
  assert.equal(s("fraction-line@1", undefined), "number line");
  assert.equal(s("anything@9", undefined), "drawing");
  for (const t of ["measured@1", "shape@1", "fraction-line@1", "table@1", "symmetry@1", "shade-grid@1"]) assert.ok(SCREEN_SHAPES.includes(s(t, undefined)), t);
});

test("Brain R4: screen numbers are what the board writes (a fraction numwork reads a/b), never a '?'", async () => {
  const { screenOf } = await import("../server/stagecraft/board-first.js");
  const { expand } = await import("../server/forge/explainer/templates.js");
  const x = expand({ template: "fraction-parts@1", parts: 4, shade: 3, whole: "roti" });
  assert.deepEqual(screenOf({ template: "fraction-parts@1" }, x.facts, x.script).numbers, ["3/4"]);
  const asked = { ops: [{ op: "numwork", layout: "fraction", rows: [["?"], ["?"]] }, { op: "text", text: "? cm" }] };
  assert.deepEqual(screenOf({ template: "fraction-parts@1" }, {}, asked).numbers, []);
});

test("director5 SC1: the screen carries what the board draws, counted by the template (gaps, inner ticks, marks, parts, sides)", async () => {
  const { screenOf } = await import("../server/stagecraft/board-first.js");
  const { expand } = await import("../server/forge/explainer/templates.js");
  const scr = (c) => { const x = expand(c); assert.ok(x.ok, x.errors?.join(",")); return screenOf({ template: c.template }, x.facts, x.script); };
  // c5-t01: "beech mein 2 marks" over a line in thirds is TRUE (2 inner ticks), and "3 barabar gaps" too
  assert.deepEqual(scr({ template: "fraction-line@1", den: 3, to: 1, marks: [{ num: 1, label: "1/3" }] }).counts.lines, [{ gaps: 3, ticks: 4, innerTicks: 2 }]);
  // two wholes: the per-whole count as well
  assert.deepEqual(scr({ template: "fraction-line@1", den: 4, to: 2, hop: { num: 7 } }).counts.lines, [{ gaps: 8, gapsPerWhole: 4, ticks: 9, innerTicks: 7 }]);
  // an asked mark names its position, never its value
  const ask = scr({ template: "fraction-line@1", den: 4, mark: 3 });
  assert.deepEqual(ask.counts.marks, [{ at: "mark 3", label: "?" }]);
  assert.ok(!JSON.stringify(ask).includes("3/4"));
  // c6: a pentagon's 5 sides and their values; a rectangle's 4; a triangle's 3
  assert.deepEqual(scr({ template: "measured@1", shape: "pentagon", unit: "m", sides: [4, 5, 3, 6, 2] }).counts, { sides: 5, corners: 5, sideValues: ["4 m", "5 m", "3 m", "6 m", "2 m"] });
  assert.equal(scr({ template: "measured@1", shape: "rect", unit: "cm", w: 6, h: 4 }).counts.sides, 4);
  assert.deepEqual(scr({ template: "measured@1", shape: "triangle", unit: "cm", sides: [4, 5, 6] }).counts.sideValues, ["6 cm", "5 cm", "4 cm"]);
  assert.deepEqual(scr({ template: "fraction-parts@1", parts: 6, shade: 2 }).counts, { parts: 6, shaded: 2 });
  assert.deepEqual(scr({ template: "shade-grid@1", rows: 3, cols: 5, shade: 6, hideResult: true }).counts, { rows: 3, cols: 5, parts: 15, shaded: 6 });
  assert.deepEqual(scr({ template: "equal-groups@1", groups: 3, each: 4 }).counts, { groups: 3, each: 4 });
  // two denominators: one line count per scale
  assert.equal(scr({ template: "fraction-line@1", dens: [5, 8], marks: [[3, 5]] }).counts.lines.length, 2);
  // director6 #2: every template counts, word boards too (a flow's steps, a compare board's columns and stated quantities)
  assert.deepEqual(scr({ template: "flow@1", steps: ["sunlight", "leaf", "food"] }).counts, { steps: 3 });
  assert.deepEqual(scr({ template: "compare@1", left: { title: "Roti", items: ["2 tukde"] }, right: { title: "Tukde", items: ["ek bada", "ek chhota"] } }).counts,
    { columns: [{ title: "Roti", items: 1, quantities: [{ n: 2, what: "tukde" }] }, { title: "Tukde", items: 2, quantities: [] }] });
});

test("director5 SC2: a scripted remediation board goes up only on the turn its explanation is spoken; a picture asked for re-shows the card's board", async () => {
  const seam = await import("../server/studio/seam.js");
  const BF = await import("../server/stagecraft/board-first.js");
  const { kitFromFile } = await import("../server/content/kits.js");
  const { getTopic } = await import("../server/content/curriculum.js");
  const sc = JSON.parse(fs.readFileSync("data/lesson-scripts/c5-maths-ch02-t01.json", "utf8"));
  const rem = sc.skills[0].remediation[1];
  const T = "c5-maths-ch02-t01", kit = kitFromFile(getTopic(T));
  // every v2 remediation board is "spoken" on its own say; an unrelated line holds it
  const ask = (id, text, { kind = "remediation", ref = rem.board, request } = {}) => ({ intent: { intentId: `${id}:wb:1`, lessonId: id, kind: "whiteboard", beat: "explain", style: { band: "B3" },
    boardRef: ref, scriptBeat: { scriptId: "s", beatId: "r1", kind }, ...(request ? { request } : {}) }, line: { lessonId: id, text }, mode: "fresh", kit: { topicId: T, content: [] } });
  assert.equal(BF.scriptBoardSpoken(ask("x", rem.say.hi)), true);
  assert.equal(BF.scriptBoardSpoken(ask("x", "Koi baat nahi, ek baar aur sochte hain.")), false);
  assert.equal(BF.scriptBoardSpoken(ask("x", "Koi baat nahi.", { kind: "explain" })), true, "only remediation is held");
  for (const f of fs.readdirSync("data/lesson-scripts")) {
    const d = JSON.parse(fs.readFileSync(`data/lesson-scripts/${f}`, "utf8"));
    for (const sk of d.skills ?? []) for (const b of sk.remediation ?? []) if (b.board && !b.board.auto) assert.ok(BF.scriptBoardSpoken(ask("x", b.say?.hi ?? "", { ref: b.board })), `${f} ${b.targets}`);
  }
  // through the seam: an unspoken remediation never takes the tray
  const open = (id) => seam.studioSeam.prefetch({ lessonId: id, purpose: "practice", kit, topicId: T, child: { id: `child-${id}`, class_level: 5, language_pref: "hinglish" } });
  open("sc2-a");
  assert.equal(seam.studioSeam.requestIntent(ask("sc2-a", "Koi baat nahi, ek baar aur sochte hain.")), null);
  assert.equal(seam._lesson("sc2-a").onScreen, null);
  // the c5 whole-number-bias board: the SCRIPT's three marks (1/8, 1/4, 1/2), not the code's one-mark line
  const p = BF.preselect(ask("sc2-b", ""), { kit });
  assert.equal(p?.by, "script");
  assert.deepEqual(p.screen.counts.marks.map((m) => m.label), ["1/8", "1/4", "1/2"]);
  // a picture asked for while the card is live: its board again, even though that page was seen before
  const { pageSig } = await import("../server/studio/request.js");
  const seen = new Set([pageSig(p.script)]);
  assert.notEqual(BF.preselect(ask("sc2-c", "", { kind: "check" }), { kit, seen })?.by, "script", "no request: a page seen before is not shown again");
  const again = BF.preselect(ask("sc2-d", "", { kind: "check", request: { kind: "picture" } }), { kit, seen });
  assert.equal(again?.by, "script", "asked for: the card's own board, again");
});

test("director5: every v2 script board is preselected as the script's and drawn on its authored line (W6 stretch, W10 parts and stretches)", async () => {
  const BF = await import("../server/stagecraft/board-first.js");
  const { gateCtxFor } = await import("../server/stagecraft/board-sync.js");
  const { claimsNotDrawn } = await import("../server/studio/qa/semantics.js");
  const { expand } = await import("../server/forge/explainer/templates.js");
  const { kitFromFile } = await import("../server/content/kits.js");
  const { getTopic } = await import("../server/content/curriculum.js");
  // W10: one line in eighths draws the halves and quarters; "3 gaps" is a stretch of a 6-gap line; "4 barabar gaps" over 8 is not
  const eighths = expand({ template: "fraction-line@1", den: 8, to: 1, marks: [{ num: 1, label: "1/8" }] }).script.ops;
  assert.deepEqual(claimsNotDrawn("Screen par line ko 2 hisson mein kaato, phir 4 hisson mein kaato.", eighths), []);
  assert.deepEqual(claimsNotDrawn("Screen par line 8 barabar gaps mein hai; 3 gaps 0 se.", eighths), []);
  assert.equal(claimsNotDrawn("Screen par line 4 barabar gaps mein bati hai.", eighths).length, 1);
  // (Learning's v2.1 fixed the last two: the train's hop to 7/5, the compare board in the line's Hinglish)
  const KNOWN = new Set();
  const misses = [];
  let n = 0;
  for (const f of fs.readdirSync("data/lesson-scripts")) {
    const sc = JSON.parse(fs.readFileSync(`data/lesson-scripts/${f}`, "utf8"));
    const T = f.replace(".json", ""); const kit = kitFromFile(getTopic(T));
    for (const [si, sk] of (sc.skills ?? []).entries()) for (const kind of ["explain", "remediation"]) for (const [bi, b] of (sk[kind] ?? []).entries()) {
      if (!b.board || b.board.auto) continue;
      const id = `d5all-${n++}`, tag = `${T} s${si} ${kind}${bi}`;
      const ask = { intent: { intentId: `${id}:wb:1`, lessonId: id, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: b.board, scriptBeat: { scriptId: "s", beatId: `${kind}${bi}`, kind } },
        line: { lessonId: id, text: "" }, mode: "continue", kit: { topicId: T, content: [] } };
      const p = BF.preselect(ask, { kit });
      const real = { ...ask, line: { lessonId: id, text: (kind === "explain" ? b.point?.hi : b.say?.hi) ?? "" } };
      const t = BF.takePreselected(real, gateCtxFor(real, { kit, redact: [], prior: [] }));
      if (p?.by !== "script" || !t) misses.push(tag);
    }
  }
  assert.ok(n >= 60, `${n} script boards`);
  assert.deepEqual(misses.filter((m) => !KNOWN.has(m)), []);
});

test("director5 then-cards: a scripted card's own labels are drawn (2/4 on the 1/4-hops card), every other kit key stays withheld", async () => {
  const BF = await import("../server/stagecraft/board-first.js");
  const { kitFromFile } = await import("../server/content/kits.js");
  const { getTopic } = await import("../server/content/curriculum.js");
  const T = "c5-maths-ch02-t01", kit = kitFromFile(getTopic(T));
  const card = (id, ref) => ({ intent: { intentId: `${id}:wb:1`, lessonId: id, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: ref, scriptBeat: { scriptId: "s", beatId: "then1", kind: "check" } },
    line: { lessonId: id, text: "" }, mode: "fresh", kit: { topicId: T, content: [] } });
  // Learning's then-card (claude/r7-learning 31b818f9c): "1/4 ke 2 hop 2/4 tak … 1/8 ke 2 hop 2/4 se pehle rukenge, ya baad?"
  const p = BF.preselect(card("then-a", { template: "fraction-line@1", params: { den: 4, from: 0, to: 1, marks: [{ num: 2, label: "2/4" }], hop: { num: 2 } } }), { kit });
  assert.equal(p?.by, "script", "2/4 = 1/2 is a kit key, but it is this card's authored given");
  // an asked mark on a card is never labelled, so nothing is freed: still "?"
  const q = BF.preselect(card("then-b", { template: "fraction-line@1", params: { den: 3, from: 0, to: 1, mark: 1 } }), { kit });
  assert.ok(!q.screen.numbers.includes("1/3"));
});

test("director6 #1: a number her line states is never drawn '?' — the take's screen is the drawn board; a card's own board shows its givens; certify fails '?' over a stated number", async () => {
  const BF = await import("../server/stagecraft/board-first.js");
  const { gateCtxFor } = await import("../server/stagecraft/board-sync.js");
  const { kitFromFile } = await import("../server/content/kits.js");
  const { getTopic } = await import("../server/content/curriculum.js");
  const c6 = kitFromFile(getTopic("c6-maths-ch06-t01")), c4 = kitFromFile(getTopic("c4-maths-ch05-t01"));
  const rect = { template: "measured@1", params: { shape: "rect", unit: "m", w: 40, h: 25 } };
  const ask = (id, T, ref, beat = {}) => ({ intent: { intentId: `${id}:wb:1`, lessonId: id, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: ref,
    scriptBeat: { scriptId: "s", beatId: "c1", kind: "check", ...beat } }, line: { lessonId: id, text: "" }, mode: "fresh", kit: { topicId: T, content: [] } });
  const line = "Ek rectangle playground 40 m lamba aur 25 m chauda hai. Iska parimap kitna hai?";
  // c6 steady T38: a check whose board may be borrowed: 40 (a kit key) is "?" before her line exists...
  const a = ask("d6-a", "c6-maths-ch06-t01", rect);
  const p = BF.preselect(a, { kit: c6 });
  assert.ok(!p.screen.numbers.includes("40"));
  assert.deepEqual(p.screen.counts.sideValues, ["?", "25 m", "?", "25 m"], "the counts follow the mask");
  // ...and on her line that states it, the board draws 40 m and the screen Brain reads SAYS so (it said 25 alone before)
  const real = { ...a, line: { lessonId: "d6-a", text: line } };
  const t = BF.takePreselected(real, gateCtxFor(real, { kit: c6, redact: [], prior: [] }));
  assert.ok(t.script.ops.some((o) => o.op === "text" && o.text === "40 m"));
  assert.deepEqual(t.screen.numbers, ["40", "25"]);
  assert.deepEqual(t.screen.counts.sideValues, ["40 m", "25 m", "40 m", "25 m"]);
  // a card's OWN board (Brain: ownBoard) and a then-card show their givens from the start (c4 steady T10: "? tukde")
  assert.ok(BF.preselect(ask("d6-b", "c6-maths-ch06-t01", rect, { ownBoard: true }), { kit: c6 }).screen.numbers.includes("40"));
  const tukde = { template: "compare@1", params: { left: { title: "Roti", items: ["2 tukde"] }, right: { title: "Tukde", items: ["ek bada", "ek chhota"] } } };
  const q = BF.preselect(ask("d6-c", "c4-maths-ch05-t01", tukde, { beatId: "then:c4-maths-ch05-t01-m-unequal-parts" }), { kit: c4 });
  assert.ok(q.script.ops.some((o) => o.op === "text" && o.text === "2 tukde"));
  // a check that BORROWS its explain beat's board keeps that board's taught answer hidden (c4 s3 c1: key 1/2)
  const taught = { template: "compare@1", params: { left: { title: "Patti ke 2 hisse", items: ["2 barabar hisse", "1 hissa = 1/2"] }, right: { title: "Wahi patti, 4 hisse", items: ["4 barabar hisse", "1 hissa = 1/4"] } } };
  const b = BF.preselect(ask("d6-d", "c4-maths-ch05-t01", taught), { kit: c4 });
  assert.ok(!b?.screen?.numbers?.includes("1/2"));
  // certify: a board that would write a number the line states as "?" fails the ref
  const r = await certifyBoardRef({ template: "measured@1", shape: "rect", unit: "m", w: 40, h: 25 }, { line, withhold: { values: ["40"], words: [] } });
  assert.ok(r.failed.includes("stated_drawn_as_unknown:40"), JSON.stringify(r.failed));
  assert.equal((await certifyBoardRef({ template: "measured@1", shape: "rect", unit: "m", w: 40, h: 25 }, { line, withhold: { values: ["130"], words: [] } })).ok, true);
});

test("Learning c6 circles: a circle shows its radius and diameter (arrows, not cuts), a chord and an arc, each labelled clear of its line", async () => {
  const { expand } = await import("../server/forge/explainer/templates.js");
  const line = "Screen par ek circle hai. Centre se kinaare tak ki line radius hai, 7 cm. Ek kinaare se doosre kinaare tak, centre se hoke, diameter hai, 14 cm. Chord bhi kinaare se kinaare tak jaati hai, par centre se nahi. Kinaare ka ek hissa arc hai.";
  const ref = { template: "shape@1", shape: "circle", centre: "centre O", radius: "radius 7 cm", diameter: "diameter 14 cm", chord: "chord", arc: "arc" };
  const r = await certifyBoardRef(ref, { line });
  assert.ok(r.ok, JSON.stringify(r.failed));
  const x = expand(ref);
  assert.equal(x.script.ops.filter((o) => o.op === "arrow").length, 2, "radius and diameter are measures (arrows): W8 never reads them as cuts");
  assert.ok(x.script.ops.some((o) => o.id === "chord" && o.op === "line"));
  assert.ok(x.script.ops.some((o) => o.id === "arc" && o.op === "stroke"));
  // the bare circle without the line's measures still fails (the line states 7 cm and 14 cm)
  assert.ok((await certifyBoardRef({ template: "shape@1", shape: "circle", diameter: "diameter", chord: "chord" }, { line })).failed.some((f) => f.startsWith("line_measures_not_on_board")));
});

test("director8 prep: a fraction line whose dot hops counts its hops (\"0 se 6 hop\" over 6 drawn hops is the board's own count)", async () => {
  const { expand } = await import("../server/forge/explainer/templates.js");
  const c = (params) => expand({ template: "fraction-line@1", ...params })?.script?.facts?.counts;
  assert.equal(c({ den: 4, from: 0, to: 2, marks: [{ num: 6, label: "6/4" }], hop: { num: 6 } })?.hops, 6);
  assert.equal(c({ den: 6, from: 0, to: 1, hop: { num: 4 } })?.hops, 4);
  assert.equal(c({ den: 8, from: 0, to: 1, marks: [{ num: 3, label: "3/8" }, { num: 6, label: "3/4" }] })?.hops, undefined, "no dot, no hops counted");
});

test("Learning's template asks: 4-digit place value, a 0-10000 scale, short/long angle arms, and 'set-square' is no square", async () => {
  const { expand } = await import("../server/forge/explainer/templates.js");
  // 4815 is written "4,815" (Indian grouping): one number, shown
  const pv = await certifyBoardRef({ template: "place-value@1", value: 4815 }, { line: "Screen par sankhya 4815 hai. Har ank apne khane mein jaata hai: 4 hazaar ke khane mein, 8 sau ke khane mein, 1 dahai ke khane mein, aur 5 ikaai ke khane mein. Toh 4815 mein 4 hazaar, 8 sau, 1 dahai aur 5 ikaai hain." });
  assert.equal(pv.ok, true, JSON.stringify(pv.failed));
  // a big scale: its ticks are an axis once her line says the step
  const ref = { template: "number-line-scale@1", from: 0, to: 10000, step: 1000, marks: [{ value: 4815 }] };
  const x = expand(ref);
  assert.ok(x.ok, String(x.errors));
  // (App's render check: 0, 5000, 10000 labelled — 5-digit labels on every 1000 run together at 360 dp)
  assert.deepEqual(x.script.facts.counts, { lines: [{ gaps: 10, ticks: 11, innerTicks: 9 }], marks: [{ at: "4815", label: "4815" }], labels: 3 });
  const nl = await certifyBoardRef(ref, { line: "Screen par 0 se 10000 tak ki sankhya rekha hai, har 1000 par ek nishaan. 4815 yahan hai: 4000 aur 5000 ke beech, 5000 ke zyada paas. Isliye 4815 ko nikatatam hazaar tak 5000 likhte hain." });
  assert.equal(nl.ok, true, JSON.stringify(nl.failed));
  assert.equal(expand({ template: "number-line-scale@1", from: 4000, to: 5000, step: 100, marks: [{ value: 4815, label: "?" }] }).script.facts.counts.marks[0].label, "?");
  assert.deepEqual(expand({ template: "number-line-scale@1", from: 0, to: 10000, step: 300 }).errors, ["scale_range"], "a step that does not divide the range");
  // the same angle, short arms and long arms
  const ang = expand({ template: "angle@1", angles: [{ deg: 50, len: "short" }, { deg: 50, len: "long" }] });
  assert.ok(ang.ok, String(ang.errors));
  const arm = (i) => { const o = ang.script.ops.find((q) => q.id === `h${i}`); return Math.hypot(o.to[0] - o.from[0], o.to[1] - o.from[1]); };
  assert.ok(Math.abs(arm(0) * 2 - arm(1)) < 1, `short ${arm(0)} vs long ${arm(1)}`);
  // W15: "set-square" (the instrument) and "square cm" (a unit) name no square
  const { gateWhiteboard } = await import("../server/studio/qa/whiteboard.js");
  const lines = expand({ template: "lines@1", kind: "parallel", names: ["AB", "CD"], gap: "5 cm" });
  for (const line of ["Set-square se do lines AB aur CD kheenchi; beech ki doori 5 cm hai.", "AB aur CD ke beech 5 cm; area 12 square cm nahi, yeh doori hai.",
    "AB aur CD ke beech 5 cm, aur yahan koi square corner nahi bana.", "Square kona matlab right angle: AB aur CD ke beech 5 cm."]) {
    const g = gateWhiteboard(lines.script, { reply: line, speechMs: 9000, withhold: { values: [] }, asked: true });
    assert.ok(g.checks.find((c) => c.id === "W15.named_shape_drawn")?.pass !== false, line);
  }
});

test("director9: an L-shaped room (6 sides that close as an L) is drawn TO SCALE with right angles; a walk that does not close is refused; wholes@1 draws equal and unequal pieces", async () => {
  const { expand } = await import("../server/forge/explainer/templates.js");
  const L = expand({ template: "measured@1", shape: "polygon", unit: "m", sides: [8, 3, 5, 4, 3, 7] });
  assert.ok(L.ok, String(L.errors));
  const P = L.script.ops.find((o) => o.op === "polygon").points;
  assert.equal(P.length, 6);
  for (let i = 0; i < 6; i++) { const A = P[i], B = P[(i + 1) % 6]; assert.ok(A[0] === B[0] || A[1] === B[1], `side ${i} is not straight across or down`); }
  const len = (i) => Math.hypot(P[(i + 1) % 6][0] - P[i][0], P[(i + 1) % 6][1] - P[i][1]);
  assert.ok(Math.abs(len(0) / len(1) - 8 / 3) < 0.02, "to scale: 8 against 3");
  assert.equal(L.script.facts.onScreen.outline, "L-shape, right angles");
  assert.deepEqual(L.script.facts.counts.sideValues, ["8 m", "3 m", "5 m", "4 m", "3 m", "7 m"]);
  assert.ok(expand({ template: "measured@1", shape: "polygon", unit: "cm", sides: [6, 2, 4, 3, 2, 5], names: ["A", "B", "C", "D", "E", "F"] }).ok, "corner names clear of the side lengths");
  assert.deepEqual(expand({ template: "measured@1", shape: "polygon", unit: "m", sides: [8, 3, 5, 4, 3, 6], walk: "RDLDLU" }).errors, ["polygon_walk"]);
  // a hexagon whose sides do not close as an L is still drawn regular, labelled
  const H = expand({ template: "measured@1", shape: "polygon", unit: "m", sides: [5, 4, 6, 3, 4, 6] });
  assert.ok(H.ok && H.script.facts.onScreen.outline === undefined);
  const W = expand({ template: "wholes@1", wholes: [{ parts: 3, equal: false, title: "Cake A" }, { parts: 3, equal: true, title: "Cake B" }] });
  assert.ok(W.ok, String(W.errors));
  assert.deepEqual(W.script.facts.counts.wholes, [{ parts: 3, shaded: 0, label: "Cake A" }, { parts: 3, shaded: 0, label: "Cake B" }]);
  assert.deepEqual(W.script.facts.onScreen, { whole1: "3 unequal parts", whole2: "3 equal parts" });
});
