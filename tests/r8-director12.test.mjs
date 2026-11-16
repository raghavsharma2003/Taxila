// round 7, director12 (main's v6.4, S4-S6): each item pinned on a director12 row
// (evals/hybrid-side-by-side/results/2026-11-08-director12 on claude/r4-conversation e71b1caf; rows 0-based, the rows'
// text and boards copied here). Replayed through Studio's seam as the run drove it: the page up drawn on its own line,
// then the picture turn.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as seam from "../server/studio/seam.js";
import * as BF from "../server/stagecraft/board-first.js";
import { catalogueEntry } from "../server/stagecraft/catalogue.js";
import { normalizeScript } from "../shared/whiteboard.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";

const kitOf = (T) => kitFromFile(getTopic(T));
let lessonN = 0;

/** A lesson on Studio's seam: `send(ref, beat, text, more, item)` sends a turn (with no text: the line Brain writes from
 *  the pick's row) and waits for its board. `item` is the card Brain sends on ask.kit.item (its prompt). */
function lesson(T) {
  const kit = kitOf(T), L = `r8d12-${lessonN++}`;
  seam.studioSeam.prefetch({ lessonId: L, purpose: "practice", kit, topicId: T, child: { id: `c-${L}`, class_level: 5, language_pref: "hinglish" } });
  let n = 0;
  const send = async (ref, beat, text = "", more = {}, item = null) => {
    const a = { intent: { intentId: `${L}:wb:${++n}`, lessonId: L, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: ref, scriptBeat: beat, ...more },
      line: { lessonId: L, teacherReplySeq: n, text: "" }, mode: "fresh", kit: { topicId: T, content: [], ...(item ? { item: { id: "script:card", prompt_hi: item, prompt_en: "" } } : {}) } };
    const row = seam.studioSeam.preselectWhiteboard({ ...a });
    a.line.text = text || String(row ?? "").replace(/^[^:]*:\s*/, "");
    const k = seam.studioSeam.requestIntent(a);
    return { row, k: k?.state === "planning" && k.ready ? (await k.ready) ?? { state: "failed" } : k };
  };
  return { L, kit, send };
}
const check = (answers) => ({ scriptId: "s", beatId: "then", kind: "check", ownBoard: true, answers });
const PIC = { request: { kind: "picture" } };
const switchWord = (k) => k?.artifact?.script?.switches?.[0]?.word ?? null;

test("director12 S4: a fraction-parts bar's second view is the same whole round, and a circle's is the bar — the card's 0-shaded bar under the 3-shaded one up keeps the shading on screen (c4 steady row 18)", async () => {
  const bar = (shade) => ({ template: "fraction-parts@1", params: { parts: 4, shade, whole: "bar" } });
  const key = { keys: ["3/4"] };
  // (the card alone: its own shading, the circle writing no fraction that is the key)
  assert.deepEqual({ ...BF.altCall(bar(0), key) }, { template: "fraction-parts@1", parts: 4, shade: 0, whole: "circle", view: "round" });
  assert.deepEqual({ ...BF.altCall(bar(3), key) }, { template: "fraction-parts@1", parts: 4, shade: 3, whole: "circle", hideResult: true, view: "round" });
  // (under the same bar shaded 3 — c4 steady row 16's page — the circle keeps those 3: they are on screen already)
  assert.equal(BF.sameFigure(bar(0), BF.refKey(bar(3))), true);
  assert.equal(BF.sameFigure(bar(0), BF.refKey({ template: "fraction-parts@1", params: { parts: 4, shade: 1, whole: "circle" } })), false, "a circle is another figure");
  assert.equal(BF.altCall(bar(0), { ...key, up: bar(3) }).shade, 3);
  // (and the reverse: a circle's second view is the bar)
  assert.equal(BF.altCall({ template: "fraction-parts@1", params: { parts: 3, shade: 1, whole: "circle" } }).whole, "bar");

  // on the seam: row 16's 3-shaded bar up on its line, then the child's "picture dikhao" over the card's 0-shaded bar
  const s = lesson("c4-maths-ch05-t01");
  const up = await s.send(bar(3), { scriptId: "s", beatId: "c", kind: "explain" },
    "Bilkul, Riya—3-chouthaai ko fraction mein kaise likhogi, aur upar-neeche ke numbers kya batayenge, kyunki bar ke 4 barabar tukde the aur unme se 3 khaye gaye, yaani 3/4.");
  assert.equal(up.k.state, "revealed");
  const { row, k } = await s.send(bar(0), check(["3/4"]), "", PIC);
  assert.match(String(row), /whole circle · parts 4 · shaded 3/);
  assert.doesNotMatch(String(row), /3\/4/, "the key is written nowhere");
  assert.equal(k.state, "revealed", row);
  assert.equal(k.artifact.altView, "round");
  assert.equal(k.artifact.screen.template, "fraction-parts@1");
  assert.equal(k.artifact.script.ops.filter((o) => o.op === "sector").length, 3, "the 3 shaded parts are not dropped");
  // (an unshaded whole's facts row writes no "fraction 0/4")
  const { row: r0 } = await lesson("c4-maths-ch05-t01").send(bar(0), check(["3/4"]));
  assert.doesNotMatch(String(r0), /0\/4/);
});

test("director12 S4: an unmarked ask line's picture is the bars of its denominators, unnamed, its 0 and 1 kept — whether or not that line is up (c5-t02 steady row 18, stuck row 18)", async () => {
  const s = lesson("c5-maths-ch02-t02");
  const e3 = { template: "fraction-line@1", params: { den: 8, from: 0, to: 1, marks: [{ num: 1, label: "1/8" }, { num: 2, label: "1/4" }] } };
  assert.equal((await s.send(e3, { scriptId: "s", beatId: "e3", kind: "explain" },
    "Yeh sankhya rekha 0 se 1 tak hai, aur is par 2 nishaan hain. 1/8 zero ke paas hai, aur 1/4 usse aage. Toh 1/8 < 1/4.")).k.state, "revealed");
  // (the ask's own line, dens [3, 7], is not up yet: row 18 drew it as the picture — "Screen par 0 se 1 tak ki line hai")
  const ask = { template: "fraction-line@1", params: { dens: [3, 7], from: 0, to: 1 } };
  const { row, k } = await s.send(ask, check(["1/3"]), "", PIC);
  assert.equal(k.state, "revealed", row);
  assert.equal(k.artifact.altView, "parts");
  assert.equal(k.artifact.screen.template, "fraction-bars@1");
  assert.deepEqual(k.artifact.screen.counts.wholes.map((w) => [w.parts, w.shaded]), [[3, 0], [7, 0]]);
  assert.ok(!k.artifact.script.ops.some((o) => o.op === "text" && /1\/3|1\/7/.test(o.text)), "no fraction named on a bar while the card asks it");
  // (stuck row 18: dens [4, 8] under the 1/4, 1/8 bars of row 16)
  assert.deepEqual(BF.altCall({ template: "fraction-line@1", params: { dens: [4, 8], from: 0, to: 1 } }, { keys: ["smaller"] }).bars,
    [{ parts: 4, shade: 0, label: "?" }, { parts: 8, shade: 0, label: "?" }]);
  // (S1 holds: a line's asked mark keeps its position, its value "?")
  assert.deepEqual(BF.altCall({ template: "fraction-line@1", params: { den: 8, from: 0, to: 1, mark: 1 } }, { keys: ["1/8 km"] }).bars, [{ parts: 8, shade: 1, label: "?" }]);
});

test("director12 S4: a count-key card (c5-t01 stuck row 18, \"kitne barabar gaps?\", key 8) gets a smaller case of the same rule — never the key's own count cut, never 'nothing new'", async () => {
  const card = { template: "fraction-line@1", params: { den: 8, from: 0, to: 1 } };
  const c = BF.altCall(card, { keys: ["8"] });
  assert.equal(c.view, "example");
  assert.deepEqual(c.bars, [{ parts: 4, shade: 1, label: "1/4" }]);
  // (main A1 still holds on a two-scale line: the 8-gap scale is uncut beside the named 1/4)
  assert.deepEqual(BF.altCall({ template: "fraction-line@1", params: { dens: [4, 8], from: 0, to: 1, marks: [[1, 4]] } }, { keys: ["8"] }).bars,
    [{ parts: 4, shade: 1, label: "1/4" }, { parts: 1, shade: 0, label: "?" }]);
  // (revealed: the scale is its own bar again, unnamed)
  assert.deepEqual(BF.altCall(card, { keys: [] }).bars, [{ parts: 8, shade: 0, label: "?" }]);
  const s = lesson("c5-maths-ch02-t01");
  const prompt = "Isi line ke neeche ki taraf 0 aur 1 ke beech 7 marks barabar doori par hain. Neeche ki taraf line kitne barabar gaps mein bati hai?";
  assert.equal((await s.send(card, check(["8"]), prompt, {}, prompt)).k.state, "revealed");
  const { row, k } = await s.send(card, check(["8"]), "", PIC, prompt);
  assert.match(String(row), /4 equal parts, 1 shaded = 1\/4/);
  assert.equal(k.state, "revealed", row);
  assert.equal(k.artifact.altView, "example");
  assert.ok(!k.artifact.script.ops.some((o) => (o.op === "text" || o.op === "label") && /\b8\b/.test(o.text)), "8 is written nowhere");
});

test("director12 S5: the words that bring the card back come from its own text — c5-t01's 'sadak' (steering row 14) and c6's 'khet PQRST' (steady row 18) turn the page where she names them", async () => {
  const roadPrompt = "Wahi 0 se 1 km ki sadak ab 8 barabar hisson mein bati hai. Khilona pehle hisse ke end par ruka. Woh kis number par hai?";
  const road = { template: "fraction-line@1", params: { den: 8, from: 0, to: 1, mark: 1 } };
  const w = BF.cardWordsOf({ intent: { boardRef: road }, kit: { item: { prompt_hi: roadPrompt } } });
  assert.ok(w.has("sadak") && w.has("khilona"), [...w].join(","));
  for (const generic of ["number", "barabar", "hisson", "pehle", "mein"]) assert.ok(!w.has(generic), generic);
  const s = lesson("c5-maths-ch02-t01");
  assert.equal((await s.send(road, check(["1/8 km"]), roadPrompt, {}, roadPrompt)).k.state, "revealed");
  const pic = await s.send(road, check(["1/8 km"]), "Dekho, yahi numbers ab patti par. " + roadPrompt, PIC, roadPrompt);
  assert.equal(pic.k.state, "revealed");
  assert.equal(pic.k.artifact.altView, "parts");
  assert.equal(pic.k.artifact.script.switches?.length, 1, "the road comes back as a second page");
  assert.equal(switchWord(pic.k), "wahi");
  assert.deepEqual(pic.k.artifact.screens.map((x) => x.template), ["fraction-bars@1", "fraction-line@1"]);

  // c6: the lettered pentagon (measured@1 has no figure words) — its corner names and the card's "khet"
  const fieldPrompt = "Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?";
  const pent = { template: "measured@1", params: { shape: "pentagon", unit: "m", sides: [8, 5, 7, 6, 3], names: ["P", "Q", "R", "S", "T"] } };
  const pw = BF.cardWordsOf({ intent: { boardRef: pent }, kit: { item: { prompt_hi: fieldPrompt } } });
  for (const t of ["khet", "pqrst", "pq", "tp"]) assert.ok(pw.has(t), t);
  assert.ok(!pw.has("parimap"), "the template's own word is no trigger");
  const c6 = lesson("c6-maths-ch06-t01");
  assert.equal((await c6.send(pent, check(["29 m"]), fieldPrompt, {}, fieldPrompt)).k.state, "revealed");
  const p6 = await c6.send(pent, check(["29 m"]), "Dekho, yahi numbers ab patti par. " + fieldPrompt, PIC, fieldPrompt);
  assert.equal(p6.k.state, "revealed");
  assert.equal(p6.k.artifact.altView, "unrolled");
  assert.equal(switchWord(p6.k), "paanch");
  // (her caption sentence naming the card's word is still the caption: the first sentence never turns the page)
  const cap = await c6.send(pent, check(["29 m"]), "Khet ki 5 bhujayein seedhi karke ek line par: 8 m, 5 m, 7 m, 6 m, 3 m.", PIC, fieldPrompt);
  assert.equal(cap.k.state, "revealed");
  assert.equal(cap.k.artifact.altView, "unrolled");
  assert.equal(cap.k.artifact.script.switches?.length ?? 0, 0);
});

test("director12 S6: a script board's preselect is judged on her real line, not its facts row — c5-t02 steady row 78's c0 bars join the worked line; a catalogue page on another board size is scaled onto the turn's board", () => {
  const T = "c5-maths-ch02-t02", kit = kitOf(T);
  const text = "Bilkul sahi, Riya—tumne same-size tukdon mein upar ke numbers tulna karo karke kam hissa pehchana, kyunki tukde same size ke hain aur Raju ke tukde kam hain, isliye sankhya rekha par bhi 3/8, 5/8 se pehle aata hai. Toh poora jawab: Raju ne kam cake khaya, sirf 3/8. Meena ne ek cake ka 2/6 khaya aur uske bhai ne usi cake ka 4/6. Zyada kisne khaya: Meena ne ya uske bhai ne, ya dono ne barabar?";
  const line = { template: "fraction-line@1", params: { den: 8, from: 0, to: 1, marks: [{ num: 3, label: "3/8" }, { num: 5, label: "5/8" }] } };
  const c0 = { template: "fraction-bars@1", params: { bars: [{ parts: 6, shade: 2, label: "?" }, { parts: 6, shade: 4, label: "?" }] } };
  const ask = { intent: { intentId: "r8d12-s6", lessonId: "r8d12-s6", kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: line, scriptBeat: { scriptId: "s", beatId: "worked", kind: "worked" },
    segments: [{ atChar: 266, atClause: 2, boardRef: c0, scriptBeat: { scriptId: "s", beatId: "c0", kind: "check", ownBoard: true, answers: ["bhai ne"] } }] },
    line: { lessonId: "r8d12-s6", teacherReplySeq: 1, text }, mode: "fresh", kit: { topicId: T, content: [] } };
  const r = BF.pagesBoard(ask, { kit });
  assert.ok(r, "the two pages join");
  assert.deepEqual(r.screens.map((x) => x.template), ["fraction-line@1", "fraction-bars@1"], "c0's own bars, not the catalogue's");
  assert.deepEqual([r.script.board.w, r.script.board.h], [400, 300]);
  // the rescale: the catalogue's L1 board (800 × 500) onto 400 × 300, centred, inside the board, still valid
  const L1 = catalogueEntry(T).boards.find((b) => b.line === "L1").script;
  const p = BF.pageOnBoard(L1, { w: 400, h: 300 });
  assert.deepEqual([p.board.w, p.board.h], [400, 300]);
  assert.ok(normalizeScript(p, { strict: true }).ok);
  const pts = p.ops.flatMap((o) => [o.at, o.from, o.to, o.c, ...(o.points ?? [])]).filter(Array.isArray);
  assert.ok(pts.every(([x, y]) => x >= 0 && x <= 400 && y >= 0 && y <= 300));
  assert.equal(p.ops.length, L1.ops.length);
});

test("Learning's D7 (main 2026-11-09): a card's two-bar compare certifies as the live gate takes it — the bars are wholes when her line names each bar's parts (c5-t02 s3 checks[1] ribbons pose; s2 rem1.then 3/5 vs 4/10 reveal); a bar she never names still binds", async () => {
  const { certifyBoardRef } = await import("../server/forge/explainer/board-ref.js");
  const B = (bars) => ({ template: "fraction-bars@1", params: { bars } });
  const ribbons = B([{ parts: 12, shade: 0, label: "?" }, { parts: 6, shade: 0, label: "?" }]);
  const r1 = await certifyBoardRef(ribbons, { withhold: { values: [] },
    line: "Anjali aur Gopi ke paas ek jaise ribbon hain. Anjali apne ribbon ke 12 barabar tukdon mein se 5 kaatti hai, Gopi apne ribbon ke 6 barabar tukdon mein se 5. Lamba tukda kisne kaata, Anjali ne ya Gopi ne?" });
  assert.ok(r1.ok, JSON.stringify(r1.failed));
  const r2 = await certifyBoardRef(B([{ parts: 5, shade: 3, label: "3/5" }, { parts: 10, shade: 4, label: "4/10" }]), { withhold: { values: [] }, line: "3/5 utna hai jitna 6/10, aur 6/10, 4/10 se zyada hai" });
  assert.ok(r2.ok, JSON.stringify(r2.failed));
  const r3 = await certifyBoardRef(B([{ parts: 8, shade: 7, label: "7/8" }, { parts: 10, shade: 9, label: "9/10" }]), { withhold: { values: [] }, line: "9/10 mein 1/10 kam hai aur 7/8 mein 1/8 kam, aur 1/10 ka gap 1/8 ke gap se chhota hai" });
  assert.ok(r3.ok, JSON.stringify(r3.failed));
  const r4 = await certifyBoardRef(B([{ parts: 4, shade: 1, label: "1/4" }, { parts: 8, shade: 1, label: "1/8" }, { parts: 2, shade: 1, label: "1/2" }]), { withhold: { values: [] }, line: "1/4 aur 1/8 mein kaunsa bada hai?" });
  assert.equal(r4.ok, false, "a third bar her line never names");
});

test("Learning's D7 (main 2026-11-09): equal-groups@1 `equalTo` draws the equal share beside the given groups — c4's marbles 7, 3, 3, 3 beside 4 × 4, pencils 6, 3, 3 beside 3 × 4 — and certifies under the cards' whys", async () => {
  const { certifyBoardRef } = await import("../server/forge/explainer/board-ref.js");
  const { expand } = await import("../server/forge/explainer/templates.js");
  const marbles = { sizes: [7, 3, 3, 3], equalTo: { groups: 4, each: 4 } };
  const x = expand({ template: "equal-groups@1", ...marbles });
  assert.ok(x.ok, String(x.errors));
  assert.deepEqual(x.facts.counts, { groups: 4, values: ["7", "3", "3", "3"], equalTo: { groups: 4, each: 4 } });
  assert.equal(x.facts.onScreen.equalShare, "4 groups of 4");
  const texts = x.script.ops.filter((o) => o.op === "text").map((o) => o.text);
  assert.deepEqual(texts, ["7", "3", "3", "3", "4", "4", "4", "4"]);
  assert.equal(x.script.ops.filter((o) => o.op === "circle" && o.ink === "good").length, 16, "the share's 16, in its own ink");
  assert.ok(x.script.ops.filter((o) => o.op === "ellipse").every((o) => o.c[0] - o.rx >= 0 && o.c[0] + o.rx <= 400));
  // (the share must be the same things: groups × each = the sizes' sum)
  assert.equal(expand({ template: "equal-groups@1", sizes: [7, 3, 3, 3], equalTo: { groups: 3, each: 4 } }).ok, false);
  for (const [params, why] of [[marbles, "group 7, 3, 3, 3 barabar nahi; 16 ke ek-chauthaai mein har group 4 ka hota, 4 × 4 = 16"],
    [{ sizes: [6, 3, 3], equalTo: { groups: 3, each: 4 } }, "group 6, 3, 3 barabar nahi; 12 ke ek-tihaai mein har group 4 ka hota, 3 × 4 = 12"]]) {
    const r = await certifyBoardRef({ template: "equal-groups@1", params }, { line: why, withhold: { values: [] } });
    assert.ok(r.ok, `${why}: ${JSON.stringify(r.failed)}`);
  }
  // (without equalTo the board is as before)
  assert.equal(expand({ template: "equal-groups@1", sizes: [7, 3, 3, 3] }).facts.counts.equalTo, undefined);
});
