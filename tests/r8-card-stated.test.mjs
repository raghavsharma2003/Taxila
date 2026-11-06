// Round 7 (main, director8 hand judge, c5 ch02-t02: ~40 "?" over a stated number, from 19 in director7): a scripted card's
// board writes "?" ONLY over the value the card asks for. Every number the spoken card states is drawn, even one that also
// sits in an accept form ("5 wali roti ka tukda", "her brother, 4/6"). Over every check and then-card of the pilot scripts
// (data/lesson-scripts) and, when present, Learning's staged batch (data/lesson-scripts-staged): her line is the card's
// prompt (Brain speaks it whole, last), Brain sends scriptBeat.answers [key, ...accept]. Pure: no DB, no model.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as BF from "../server/stagecraft/board-first.js";
import { gateCtxFor, statedAsUnknown, answerValues } from "../server/stagecraft/board-sync.js";
import { resolveBoardRef, refNumbersOf } from "../server/forge/explainer/board-ref.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";

const DIRS = ["data/lesson-scripts", "data/lesson-scripts-staged"].filter((d) => fs.existsSync(d));
const nums = (t) => (String(t ?? "").match(/\d+(?:\.\d+)?(?:\s*\/\s*\d+)?/g) ?? []).map((m) => m.replace(/\s+/g, ""));

function cards() {
  const out = [];
  for (const dir of DIRS) for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    const sc = JSON.parse(fs.readFileSync(`${dir}/${f}`, "utf8"));
    (sc.skills ?? []).forEach((k, si) => {
      for (const c of k.checks ?? []) if (c.board && c.prompt?.hi) out.push({ dir, T: sc.topicId, where: `s${si + 1} ${c.id}`, board: c.board, text: c.prompt.hi, answers: [c.key, ...(c.accept ?? [])].map(String), ownBoard: true });
      for (const r of k.remediation ?? []) if (r.then?.board && r.then?.prompt?.hi) out.push({ dir, T: sc.topicId, where: `s${si + 1} then:${String(r.targets).replace(/^.*-m-/, "m-")}`, board: r.then.board, text: r.then.prompt.hi, answers: [r.then.key, ...(r.then.accept ?? [])].filter((a) => a != null).map(String), ownBoard: true });
    });
  }
  return out;
}
function kitOf(T) { try { return kitFromFile(getTopic(T)); } catch { return null; } }

test("director8 S1: only the KEY's values are withheld, and never one her line states (accept forms quote the card's givens)", () => {
  assert.deepEqual(answerValues(["1/5", "one fifth", "5 wali roti ka tukda"], "Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein."), ["1/5"]);
  assert.deepEqual(answerValues(["her brother", "her brother, 4/6"], "Meena ne 2/6 khaya aur bhai ne 4/6."), []);
  assert.deepEqual(answerValues(["1/12, 1/6, 1/3"], "Kram mein lagao: 1/3, 1/12, 1/6."), []);
  assert.deepEqual(answerValues(["1/2"], "Dekho 2/4 par."), [], "an equal fraction states it");
  assert.deepEqual(answerValues(["30 m", "30"], "Parimap kitna hai?"), ["30"]);
});

test("director8 S1: a fraction line's asked mark whose value her line states is labelled, not '?' (c5-t02 c3)", () => {
  const ref = { template: "fraction-line@1", params: { den: 4, from: 0, to: 1, mark: 1 } };
  const x = { ops: [{ id: "q", op: "text", text: "?", at: [0, 0] }] };
  assert.equal(BF.statedMark(x, ref, "Haan, pehla nishaan 1/4 hai.")?.ops[0].text, "1/4");
  assert.equal(BF.statedMark(x, ref, "Pehla nishaan 2/8 ke barabar hai, yaani 2/8.")?.ops[0].text, "2/8");
  assert.equal(BF.statedMark(x, ref, "Woh nishaan 1/8 se bada hai ya chhota?"), null, "1/8 is not the mark: it stays the question");
});

test(`director8 S1: on every check and then-card (${DIRS.join(" + ")}), no number the card's prompt states is drawn as "?"`, () => {
  const all = cards(), bad = [];
  let drawn = 0, n = 0;
  for (const c of all) {
    const kit = kitOf(c.T);
    const id = `r8s1-${n++}`;
    const ask = { intent: { intentId: `${id}:wb:1`, lessonId: id, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: c.board,
      scriptBeat: { scriptId: "s", beatId: `${c.where}`, kind: "check", ownBoard: c.ownBoard, answers: c.answers } },
      line: { lessonId: id, text: "" }, mode: "fresh", kit: { topicId: c.T, content: [] } };
    BF.preselect(ask, { kit: kit ?? undefined });
    const real = { ...ask, line: { lessonId: id, text: c.text } };
    const t = BF.takePreselected(real, gateCtxFor(real, { kit: kit ?? undefined, redact: [], prior: [] }));
    if (!t?.script) continue;      // (a board refused on its line is the ladder's: never a "?" over a stated number)
    drawn++;
    const said = new Set(nums(c.text));
    // 1. no "?" the gate wrote stands for a number the card states
    const masked = statedAsUnknown(t.script, c.text, ask.intent.intentId);
    // 2. no number the board AUTHORS (labels, sides, items) and the card states is missing from what is drawn
    const shown = new Set(t.script.ops.flatMap((o) => (o.op === "text" || o.op === "label" ? nums(o.text) : o.op === "numwork" ? (o.rows ?? []).flat().map(String) : [])));
    const r = resolveBoardRef(c.board, {});
    const authored = r.ok ? refNumbersOf(r.call) : [];
    const missing = authored.filter((v) => said.has(v) && !shown.has(v));
    // 3. an asked fraction-line mark whose value the card states is labelled
    const markLeft = r.ok && r.call.template === "fraction-line@1" && Number.isInteger(r.call.mark) && [...said].some((s) => /\//.test(s) && Number(s.split("/")[0]) / Number(s.split("/")[1]) === r.call.mark / r.call.den)
      && t.script.ops.some((o) => o.op === "text" && String(o.text).trim() === "?");
    if (masked.length || missing.length || markLeft) bad.push(`${c.dir.replace("data/", "")} ${c.T} ${c.where}: ${[...masked.map((v) => `"?" over ${v}`), ...missing.map((v) => `${v} not drawn`), ...(markLeft ? ["asked mark '?' though stated"] : [])].join(", ")}`);
  }
  assert.ok(drawn >= 20, `cards drawn: ${drawn} of ${all.length}`);
  assert.deepEqual(bad, []);
});

// ── director8 v6 (dc-r7-script-walk-v6) ──────────────────────────────────────────────────────────────────────────────
import * as seam from "../server/studio/seam.js";
const texts = (s) => (s?.ops ?? []).filter((o) => o.op === "text" || o.op === "label").map((o) => String(o.text));
let lessonN = 0;
/** One lesson through the seam: the card's board goes up (preselect, as Brain's turn does, then the take). */
function showCard(T, kit, ref, kind, answers, text, extra = {}) {
  const L = `r8v6-${lessonN++}`;
  seam.studioSeam.prefetch({ lessonId: L, purpose: "practice", kit, topicId: T, child: { id: `c-${L}`, class_level: 5, language_pref: "hinglish" } });
  let n = 0;
  const turn = (t, more = {}, lineFromRow = null) => {
    const a = { intent: { intentId: `${L}:wb:${++n}`, lessonId: L, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: ref,
      scriptBeat: { scriptId: "s", beatId: "c", kind, ...(kind === "check" ? { ownBoard: true } : {}), ...(answers ? { answers } : {}) }, ...more },
      line: { lessonId: L, teacherReplySeq: n, text: t }, mode: "fresh", kit: { topicId: T, content: [] } };
    const row = seam.studioSeam.preselectWhiteboard({ ...a, line: { ...a.line, text: "" } });
    if (lineFromRow) a.line.text = lineFromRow(row);
    return seam.studioSeam.requestIntent(a);
  };
  return { first: turn(text, extra), turn };
}

test("director8 S1′: once she confirms the answer, the board shows it (c5-t01 worked 1/4 km; c1 1/3)", () => {
  const T = "c5-maths-ch02-t01", kit = kitOf(T);
  const worked = { template: "fraction-line@1", params: { den: 4, from: 0, to: 1, mark: 1 } };
  const w = showCard(T, kit, worked, "worked", null, "0 se 1 km ko 4 equal gaps mein baanto; pehla khamba ek gap door hai. Pehla khamba kitne km par hoga?");
  assert.ok(texts(w.first.artifact.script).includes("?"), "the open question is a '?'");
  const ok = w.turn("Sahi, Riya. Tumne 4 equal gaps mein pehla gap 1/4 liya: pehla khamba 1/4 km par hai.");
  assert.ok(texts(ok.artifact.script).includes("1/4") && !texts(ok.artifact.script).includes("?"), JSON.stringify(texts(ok.artifact.script)));
  const c1 = { template: "fraction-line@1", params: { den: 3, from: 0, to: 1, mark: 1 } };
  const c = showCard(T, kit, c1, "check", ["1/3"], "0 ke baad pehla mark kaunsa fraction hai?");
  assert.ok(texts(c.first.artifact.script).includes("?"));
  const yes = c.turn("Haan, sahi hai: pehla mark 1/3 hai, kyunki 2 marks se 3 barabar gaps bante hain.");
  assert.ok(texts(yes.artifact.script).includes("1/3") && !texts(yes.artifact.script).includes("?"));
});

test("director8 S3′: a picture asked while the card's board is up draws a SECOND view of the same numbers (altView, counts.wholes); another board up → the card's board; the asked value stays '?'", () => {
  const T = "c5-maths-ch02-t02", kit = kitOf(T);
  const ref = { template: "fraction-line@1", params: { den: 6, from: 0, to: 1, marks: [{ num: 1, label: "1/6" }, { num: 2, label: "1/3" }] } };
  const s = showCard(T, kit, ref, "worked", null, "Rahul ko ek bar ka 1/6 milta hai, Sana ko doosre bar ka 1/3. Kise bada tukda milta hai?");
  assert.equal(s.first.artifact.screen.template, "fraction-line@1");
  const pic = s.turn("Yeh dekho: 2 barabar bar, ek 6 barabar hisson mein, 1 rangin, 1/6; ek 3 barabar hisson mein, 1 rangin, 1/3.", { request: { kind: "picture" } });
  assert.equal(pic.state, "revealed");
  assert.equal(pic.artifact.altView, "parts");
  // (Brain reads the pick's view right after the preselect: preselectWhiteboard's row is unchanged)
  assert.equal(seam.studioSeam.preselectedAltView(pic.slotId.split(":")[0]), "parts");
  assert.equal(pic.artifact.screen.template, "fraction-bars@1");
  assert.deepEqual(pic.artifact.screen.counts.wholes, [{ parts: 6, shaded: 1, label: "1/6" }, { parts: 3, shaded: 1, label: "1/3" }]);
  assert.deepEqual([...new Set(pic.artifact.screen.numbers)].sort(), ["1/3", "1/6"]);
  // another board up: the picture is the card's own board (SC2 unchanged)
  const other = { template: "fraction-line@1", params: { den: 8, from: 0, to: 1, marks: [{ num: 1, label: "1/8" }, { num: 2, label: "1/4" }] } };
  const o = showCard(T, kit, other, "explain", null, "Line par 1/8 aur 1/4 dekho.");
  assert.equal(o.first.state, "revealed");
  const card = o.turn("Rahul ka 1/6, Sana ka 1/3: screen par dekho.", { request: { kind: "picture" }, boardRef: ref });
  assert.equal(card.state, "revealed");
  assert.equal(card.artifact.altView, undefined);
  assert.equal(card.artifact.screen.template, "fraction-line@1");
  // the asked value: a card whose mark is asked (key 1/3) — its second view is one "?" bar, unshaded, and never writes 1/3
  const c5 = "c5-maths-ch02-t01", kit5 = kitOf(c5);
  const asked = { template: "fraction-line@1", params: { den: 3, from: 0, to: 1, mark: 1 } };
  const q = showCard(c5, kit5, asked, "check", ["1/3"], "0 ke baad pehla mark kaunsa fraction hai?");
  const qp = q.turn("Yeh dekho: 1 barabar bar, 3 barabar hisson mein. Pehla mark kaunsa fraction hai?", { request: { kind: "picture" } });
  assert.equal(qp.state, "revealed");
  if (qp.artifact.altView) {
    assert.deepEqual(qp.artifact.screen.counts.wholes, [{ parts: 3, shaded: 0, label: "?" }]);
    assert.ok(!texts(qp.artifact.script).includes("1/3"));
  }
  assert.ok(!texts(qp.artifact.script).some((t) => /(?<![\d/])1\/3(?![\d/])/.test(t)), "the asked 1/3 is never written");
});

test(`director8 S3′: on every check and then-card (${DIRS.join(" + ")}), a picture request returns a figure`, () => {
  const none = [];
  let n = 0;
  for (const c of cards()) {
    const kit = kitOf(c.T);
    if (!kit) continue;
    const s = showCard(c.T, kit, c.board, "check", c.answers, c.text);
    if (s.first?.state !== "revealed") continue;     // (a card whose board never goes up has nothing to show twice)
    n++;
    // (her picture line: Brain writes it from the preselected row — the second view's bars, when that is what was picked —
    // and speaks the card's prompt whole, last)
    const p = s.turn(c.text, { request: { kind: "picture" } }, (row) => {
      const r = String(row ?? "");
      const bars = [...r.matchAll(/bar\d (\d+) equal parts, (\d+) shaded = (\d+\/\d+|\?)/g)];
      if (bars.length) return `${bars.length} barabar bar: ${bars.map((b) => `ek ${b[1]} barabar hisson mein${b[2] !== "0" ? `, ${b[2]} rangin${b[3] === "?" ? "" : ` (${b[3]})`}` : ""}`).join("; ")}. ${c.text}`;
      const ws = [...r.matchAll(/whole\d (\d+) (equal|unequal) parts(?:, (\d+) shaded)?/g)];
      if (ws.length) return `Yeh dekho: ${ws.map((w) => `${w[1]} ${w[2] === "equal" ? "barabar" : "alag-alag"} tukde${w[3] ? `, ${w[3]} rangin` : ""}`).join("; ")}. ${c.text}`;
      return c.text;
    });
    if (p?.state !== "revealed" || !p.artifact?.script?.ops?.length) none.push(`${c.dir.replace("data/", "")} ${c.T} ${c.where}: ${p?.state ?? "null"}`);
  }
  assert.ok(n >= 20, `cards up: ${n}`);
  // Learning's staged data, 2026-11-06: a card whose prompt names a shape (a circle, a chord) over a words-only compare board
  // fails W15 (named shape drawn) once the child asks to SEE it — the board, not Studio, is the fix (told Learning). The list
  // only shrinks: a new failure, or any pilot card, fails this test.
  const KNOWN = new Set(["lesson-scripts-staged c4-maths-ch01-t02 s3 c1", "lesson-scripts-staged c4-maths-ch01-t02 s3 c2", "lesson-scripts-staged c4-maths-ch01-t02 s3 c3",
    "lesson-scripts-staged c4-maths-ch01-t02 s3 then:m-round-is-circle", "lesson-scripts-staged c5-maths-ch13-t02 s1 then:m-miss-pairs",
    "lesson-scripts-staged c6-maths-ch08-t01 s1 c2", "lesson-scripts-staged c6-maths-ch08-t01 s1 then:m-chord-diameter"]);
  // (c7-maths-ch05-t02 s3 c2 left this list: its "Set-square se do lines kheenchi" read as a named square — W15 no longer
  // counts the instrument, or "square cm" — and lines@1 now draws crossing and parallel lines)
  assert.deepEqual(none.filter((x) => !KNOWN.has(x.replace(/: [a-z]+$/, ""))), []);
});

test("director8 bridge boards: compare@1 draws and counts '8 ka 1/2 = 4 | 8 ka 1/4 = 2' rows", async () => {
  const { expand } = await import("../server/forge/explainer/templates.js");
  const x = expand({ template: "compare@1", left: { title: "1/2", items: ["8 ka 1/2 = 4"] }, right: { title: "1/4", items: ["8 ka 1/4 = 2"] } });
  assert.ok(x.ok, String(x.errors));
  assert.deepEqual(texts(x.script).filter((t) => /=/.test(t)), ["8 ka 1/2 = 4", "8 ka 1/4 = 2"]);
  assert.deepEqual(x.script.facts.counts.columns.map((col) => col.quantities), [[{ n: 4, what: "8 ka 1/2" }], [{ n: 2, what: "8 ka 1/4" }]]);
});

test("c7 lines@1: two crossing lines and parallel lines with a transversal — angle labels (value, '?', name) drawn and counted; a value must BE the angle drawn", async () => {
  const { expand } = await import("../server/forge/explainer/templates.js");
  const { certifyBoardRef } = await import("../server/forge/explainer/board-ref.js");
  const cross = { template: "lines@1", kind: "cross", deg: 60, ends: ["A", "B", "C", "D"], point: "O", angles: [{ at: 1, value: 60 }, { at: 3, value: "?" }, { at: 2, name: "b" }] };
  const x = expand(cross);
  assert.ok(x.ok, String(x.errors));
  assert.deepEqual(x.script.facts.counts, { angles: [60], marks: [{ at: "angle 1", label: "60°" }, { at: "angle 3", label: "?" }, { at: "angle 2", label: "b" }], labels: 3 });
  for (const t of ["A", "B", "C", "D", "O", "60°", "?", "b"]) assert.ok(texts(x.script).includes(t), t);
  assert.deepEqual(expand({ ...cross, angles: [{ at: 2, value: 60 }] }).errors, ["lines_angle_value:2"], "angle 2 is 120°, never 60°");
  const par = { template: "lines@1", kind: "parallel", names: ["AB", "CD"], transversal: { deg: 60, name: "PQ" }, angles: [{ at: 1, value: 60 }, { at: 5, value: "?" }] };
  const y = expand(par);
  assert.ok(y.ok, String(y.errors));
  assert.deepEqual(y.script.facts.counts.marks, [{ at: "angle 1", label: "60°" }, { at: "angle 5", label: "?" }]);
  assert.equal(y.script.facts.onScreen.lines, "two parallel lines");
  // the full gate, with c7-style lines
  for (const [ref, line] of [[cross, "Screen par do rekhayein AB aur CD, O par kat rahi hain. Ek kon 60° hai. Uske saamne wala kon kitne degree ka hoga?"],
    [{ template: "lines@1", kind: "parallel", names: ["AB", "CD"], gap: "3 cm" }, "AB aur CD do parallel rekhayein hain. Unke beech ki doori har jagah 3 cm hai."],
    [par, "AB aur CD parallel hain, aur PQ dono ko kaat rahi hai. Upar wala kon 60° hai. Neeche usi jagah wala kon kitna hoga?"]]) {
    const r = await certifyBoardRef(ref, { line });
    assert.equal(r.ok, true, `${ref.kind}: ${JSON.stringify(r.failed)}`);
  }
});

test("c7 lines@1 under the S1 rule: the asked angle is '?' until her line states it; the given angle is drawn", () => {
  const T = "c5-maths-ch02-t01", kit = kitOf(T);
  const ref = { template: "lines@1", kind: "cross", deg: 70, ends: ["A", "B", "C", "D"], point: "O", angles: [{ at: 1, value: 70 }, { at: 3, value: "?" }] };
  const ask = (id, text) => ({ intent: { intentId: `${id}:wb:1`, lessonId: id, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: ref,
    scriptBeat: { scriptId: "s", beatId: "c", kind: "check", ownBoard: true, answers: ["70"] } }, line: { lessonId: id, text }, mode: "fresh", kit: { topicId: T, content: [] } });
  const take = (id, text) => { const a = ask(id, text); BF.preselect({ ...a, line: { ...a.line, text: "" } }, { kit }); return BF.takePreselected(a, gateCtxFor(a, { kit, redact: [], prior: [] })); };
  const open = take("l7a", "Do rekhayein AB aur CD, O par kat rahi hain. Ek kon 70° hai. Uske saamne wala kon kitne degree ka hai?");
  assert.ok(open?.script, "drawn");
  assert.deepEqual(texts(open.script).filter((t) => /°|\?/.test(t)), ["70°", "?"], "the given 70° drawn, the asked angle '?'");
  const said = take("l7b", "Haan, AB aur CD O par kat rahi hain; ek kon 70° hai, toh saamne wala kon bhi 70° hai.");
  assert.ok(said?.script, "drawn");
  assert.deepEqual(texts(said.script).filter((t) => /°|\?/.test(t)), ["70°", "70°"], "confirmed: the asked angle is written");
});

test("director9: the confirming VERDICT segment on the answered card's own board reveals the mark — ops, counts.marks and labels (offtopic-c5-ch02-t01 turn 13)", () => {
  const T = "c5-maths-ch02-t01", kit = kitOf(T);
  const sc = JSON.parse(fs.readFileSync(`data/lesson-scripts/${T}.json`, "utf8"));
  const rem = sc.skills[0].remediation.find((r) => r.targets.endsWith("m-not-numbers"));
  const answers = [rem.then.key, ...(rem.then.accept ?? [])].map(String);
  const card = { template: "fraction-line@1", params: { den: 8, from: 0, to: 1, mark: 1 } };
  const cb = { scriptId: "s", beatId: "then:c5-maths-ch02-t01-m-not-numbers", kind: "check", ownBoard: true, answers };
  // the harness's per-segment take (evals/hybrid-side-by-side.mjs: each part preselected, then taken on its own words)
  const a = { intent: { intentId: "d9row:s0", lessonId: "d9row", kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: card, scriptBeat: cb }, line: { lessonId: "d9row", text: "" }, mode: "fresh", kit: { topicId: T, content: [] } };
  BF.preselect(a, { kit });
  const aR = { ...a, line: { ...a.line, text: "Bilkul, Riya—pehla gap 1/8 km hota hai. " } };
  const tk = BF.takePreselected(aR, gateCtxFor(aR, { kit, redact: [], prior: [] }));
  assert.ok(tk?.script, "taken");
  assert.deepEqual(texts(tk.script), ["1/8"]);
  assert.deepEqual(tk.screen.counts.marks, [{ at: "mark 1", label: "1/8" }], "the screen says what is drawn");
  assert.ok(tk.screen.labels.includes("1/8") && tk.screen.numbers.includes("1/8"));
  // and through the seam, the whole turn paged: verdict on the card's board, the closed card's board, the card again
  const text = "Bilkul, Riya—pehla gap 1/8 km hota hai. Aur pehle wale sawaal ka jawab isi line par tha, kyunki 1/3 ka matlab 0 se 1 ke 3 barabar gaps mein se pehla gap, toh woh isi line par hai. Ab aage chalein?";
  const e1 = { template: "fraction-line@1", params: { den: 2, from: 0, to: 1, marks: [{ num: 1, label: "1/2" }] } };
  const s = showCard(T, kit, card, "check", answers, rem.then.prompt.hi);
  assert.ok(texts(s.first.artifact.script).includes("?"), "the card's question: '?'");
  const v = s.turn(text, { scriptBeat: cb, segments: [{ atChar: 40, atClause: 1, boardRef: e1, scriptBeat: { scriptId: "s", beatId: "e1", kind: "explain" } }, { atChar: 180, atClause: 1, boardRef: card, scriptBeat: cb }] });
  assert.equal(v.state, "revealed");
  assert.deepEqual(v.artifact.screens[0].counts.marks, [{ at: "mark 1", label: "1/8" }], JSON.stringify(v.artifact.screens[0]));
  assert.ok(v.artifact.script.ops.some((o) => o.id.startsWith("a.") && o.text === "1/8"));
});

test("director9 S3′ on the run path: every picture request of the run, with the card's board already up, draws a second view through the seam (preselectWhiteboard → requestIntent)", () => {
  // (the 11 director9 rows, r4-conversation f4cf2561: the board up the turn before, then the child's picture ask)
  const ROWS = [
    ["c5-maths-ch02-t02", "stuck T18", { template: "fraction-parts@1", params: { parts: 8, shade: 1, whole: "bar" } }, "line", "fraction-line@1"],
    ["c5-maths-ch02-t02", "offtopic T26", { template: "fraction-line@1", params: { den: 8, from: 0, to: 1, marks: [{ num: 1, label: "1/8" }, { num: 2, label: "1/4" }] } }, "parts", "fraction-bars@1"],
    ["c5-maths-ch02-t02", "steering T14", { template: "fraction-line@1", params: { dens: [7, 9], from: 0, to: 1, marks: [[1, 7], [1, 9]] } }, "parts", "fraction-bars@1"],
    ["c5-maths-ch02-t01", "steady T34 / offtopic T28", { template: "fraction-line@1", params: { den: 8, from: 0, to: 1, marks: [{ num: 1, label: "1/8" }, { num: 4, label: "1/2" }] } }, "parts", "fraction-bars@1"],
    ["c5-maths-ch02-t01", "stuck T18 / steering T14", { template: "fraction-line@1", params: { dens: [4, 8], from: 0, to: 1, marks: [[1, 4]] } }, "parts", "fraction-bars@1"],
    ["c4-maths-ch05-t01", "stuck T18 / steering T14", { template: "shade-grid@1", params: { rows: 1, cols: 4, shade: 3, labels: false, hideResult: true } }, "parts", "fraction-bars@1"],
    ["c4-maths-ch05-t01", "offtopic T26 / steady T18", { template: "compare@1", params: { left: { title: "Cake A", items: ["3 tukde", "1 bada, 2 chhote", "1/3 nahi"] }, right: { title: "Cake B", items: ["3 tukde", "sab barabar", "har tukda 1/3"] } } }, "wholes", "wholes@1",
      "Screen par Cake A aur Cake B: dono ke 3 tukde. Cake A mein 1 bada, 2 chhote, isliye 1/3 nahi; Cake B mein sab barabar, har tukda 1/3."],
  ];
  const lineFor = (row) => {
    const bars = [...String(row ?? "").matchAll(/bar\d (\d+) equal parts, (\d+) shaded = (\d+\/\d+|\?)/g)];
    if (bars.length) return `Yeh dekho: ${bars.length} barabar bar: ${bars.map((b) => `ek ${b[1]} barabar hisson mein${b[2] !== "0" ? `, ${b[2]} rangin${b[3] === "?" ? "" : ` (${b[3]})`}` : ""}`).join("; ")}.`;
    const ws = [...String(row ?? "").matchAll(/whole\d (\d+) (equal|unequal) parts/g)];
    if (ws.length) return `Yeh dekho: ${ws.map((w, i) => `Cake ${"AB"[i]}: ${w[1]} ${w[2] === "equal" ? "barabar" : "alag-alag"} tukde`).join("; ")}.`;
    const m = /gaps (\d+) equal gaps.*marks ([\d/ ,]+)/.exec(String(row ?? ""));
    return m ? `Yeh dekho: 0 se 1 ki sankhya rekha, ${m[1]} barabar gaps, aur nishaan ${m[2].trim()} par.` : "Yeh dekho.";
  };
  for (const [T, where, ref, view, template, firstLine] of ROWS) {
    const kit = kitOf(T);
    const L = `d9pic-${lessonN++}`;
    seam.studioSeam.prefetch({ lessonId: L, purpose: "practice", kit, topicId: T, child: { id: `c-${L}`, class_level: 5, language_pref: "hinglish" } });
    const mk = (n, t, more = {}) => ({ intent: { intentId: `${L}:wb:${n}`, lessonId: L, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: ref, scriptBeat: { scriptId: "s", beatId: "b", kind: "explain" }, ...more },
      line: { lessonId: L, teacherReplySeq: n, text: t }, mode: "fresh", kit: { topicId: T, content: [] } });
    const up = mk(1, "");
    const upRow = seam.studioSeam.preselectWhiteboard({ ...up });
    up.line.text = firstLine ?? `Screen par dekho. ${String(upRow ?? "").replace(/^.*?board · /, "").replace(/ · /g, ". ")}`;
    assert.equal(seam.studioSeam.requestIntent(up)?.state, "revealed", `${T} ${where}: the card's board is up`);
    // (Brain sends { kind: "picture" }, or { kind: "show" } when the child names nothing: both take the second view)
    const ask = mk(2, "", { request: { kind: lessonN % 2 ? "show" : "picture" } });
    const row = seam.studioSeam.preselectWhiteboard({ ...ask });
    assert.equal(seam.studioSeam.preselectedAltView(L), view, `${T} ${where}: ${row}`);
    ask.line.text = lineFor(row);
    const k = seam.studioSeam.requestIntent(ask);
    assert.equal(k?.state, "revealed", `${T} ${where}: ${ask.line.text}`);
    assert.equal(k.artifact.altView, view);
    assert.equal(k.artifact.screen.template, template, `${T} ${where}`);
  }
});

test("director9 (Brain's replay of c5-t01 steady T21): a later page whose own take fails is dropped, not the whole turn — the verdict page's revealed 1/8 still reaches the screen", () => {
  const T = "c5-maths-ch02-t01", kit = kitOf(T);
  const sc = JSON.parse(fs.readFileSync(`data/lesson-scripts/${T}.json`, "utf8"));
  const rem = sc.skills[0].remediation.find((r) => r.targets.endsWith("m-not-numbers"));
  const answers = [rem.then.key, ...(rem.then.accept ?? [])].map(String);
  const card = { template: "fraction-line@1", params: { den: 8, from: 0, to: 1, mark: 1 } };
  const e1 = { template: "fraction-line@1", params: { den: 2, from: 0, to: 1, marks: [{ num: 1, label: "1/2" }] } };
  const cb = { scriptId: "s", beatId: "then:c5-maths-ch02-t01-m-not-numbers", kind: "check", ownBoard: true, answers };
  const say = "Bilkul, Riya: pehla hissa 1/8 km hai.", closed = " Aur pehle wale sawaal ka jawab isi line par tha, kyunki 1/2 ka matlab 0 se 1 ke 2 barabar gaps mein se pehla gap.", tail = " Ab agla hissa.";
  const text = `${say}${closed}${tail}`;
  const s = showCard(T, kit, card, "check", answers, rem.then.prompt.hi);
  const v = s.turn(text, { scriptBeat: cb, segments: [{ atChar: say.length + 1, boardRef: e1, scriptBeat: { scriptId: "s", beatId: "e1", kind: "explain" } }, { atChar: say.length + closed.length + 1, boardRef: card, scriptBeat: cb }] });
  assert.equal(v?.state, "revealed", "the turn draws");
  assert.deepEqual(v.artifact.screens[0].counts.marks, [{ at: "mark 1", label: "1/8" }]);
  assert.ok(v.artifact.script.ops.some((o) => o.op === "text" && o.text === "1/8"), "the verdict page's 1/8 is drawn");
  assert.ok(v.artifact.screens.length >= 1 && v.artifact.screens.length <= 3);
});
