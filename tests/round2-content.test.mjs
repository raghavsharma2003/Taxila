// Round 2 · stream content (docs/design/round2/content/). Pure: no network, no DB, no model.
// The new modules (server/stagecraft/board-first.js, board-legible.js) are tested as they are; the cases that need a
// hot-file patch (docs/design/round2/content/patches/*.diff) skip with the patch's name until it is applied, then must pass.
// Hooks live inside describe (npm test runs every file in one process).
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { gateCtxFor, regate, retime, withSectors } from "../server/stagecraft/board-sync.js";
import * as boardSync from "../server/stagecraft/board-sync.js";
import { explainerFor } from "../server/forge/explainer/lesson.js";
import { WB_BOARD } from "../server/studio/plan.js";
import { gateWhiteboard } from "../server/studio/qa/whiteboard.js";
import { loadCatalogue } from "../server/stagecraft/catalogue.js";
import * as BF from "../server/stagecraft/board-first.js";
import { fitLegible, minTextPx, scaleScript } from "../server/stagecraft/board-legible.js";
import * as seam from "../server/studio/seam.js";
import { planEngine, ENGINES } from "../shared/engine-catalog.js";
import { recheckEngineAnswer, RECHECKABLE } from "../server/director/recheck.js";
import * as FR from "../src/modules/frame/engines/fractions.logic.ts";

const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const W8_PATCHED = src("server/studio/qa/whiteboard.js").includes("round2 content");
const SEAM_PATCHED = typeof seam.studioSeam.preselectWhiteboard === "function";
const SYNC_PATCHED = src("server/stagecraft/board-sync.js").includes("takePreselected");
const FR_PATCHED = (ENGINES["fractions@1"]?.modes ?? []).includes("name");
const TOPIC_MAP = JSON.parse(src("shared/engine-topic-map.json"));
const kitOf = (id) => kitFromFile(getTopic(id));

// the owner-5 line on production (2026-10-06 16:39 UTC, Log Analytics: "whiteboard not drawn W8.counts_match_line")
const PROD_LINE = "Meher, look at the screen: 3 equal groups, each with 5 dots. Count the dots in one group—how many are there?";
const askFor = (topicId, { id = "t:wb:1", beat = "explain", content, line = "", mode = "fresh", requested } = {}) => ({
  intent: { intentId: id, lessonId: id.split(":wb:")[0], kind: "whiteboard", beat, style: { band: "B3" } },
  line: { lessonId: id.split(":wb:")[0], text: line }, mode, kit: { topicId, content: content ?? [] }, ...(requested ? { requested: true } : {}) });

// a deterministic board-first pick: c4 fractions, the "more equal parts, smaller part" line → the catalogue board of one
// whole in 4 equal parts (its row names "equal parts 4"); a line from the row passes, a line with 6 parts is refused (W8)
const C4 = "c4-maths-ch05-t01";
const c4Ask = (id) => { const kit = kitOf(C4); return askFor(C4, { id, content: [kit.expectations[2]] }); };
const GOOD = "Board par dekho: ek roti 4 equal parts mein kati hai. Ek part ko kya kehte hain?";
const BAD = "Board par dekho: roti 6 equal parts mein kati hai.";

describe("W8 reads 'N equal groups, each with M' as N x M (patch 01: the owner-5 production failure)", () => {
  it("the kit's own equal-groups board passes against the exact production line", { skip: W8_PATCHED ? false : "patch 01-whiteboard-w8-groups.diff not applied" }, () => {
    const kit = kitOf("c6-maths-ch07-t01");
    const ask = askFor(kit.topicId, { id: "p:wb:3", content: [kit.expectations[0]], line: PROD_LINE, requested: true });
    const ctx = gateCtxFor(ask, { kit, redact: ["Meher"] });
    const x = explainerFor({ lessonId: "p", kit, band: "B3", text: PROD_LINE });
    assert.equal(x.template, "equal-groups@1");
    const s = withSectors(retime(x.params.script, Math.max(800, Number(x.params.script.durationMs) || 0), ctx.speechMs), ctx.reply);
    const r = regate({ ...s, board: { ...WB_BOARD, ...(s.board ?? {}) } }, ask, ctx);
    assert.equal(r.ok, true, JSON.stringify(r.gate?.checks?.filter((c) => !c.pass)));
  });
  it("still refuses a board whose count is not her partition times a number she says", () => {
    const kit = kitOf("c6-maths-ch07-t01");
    const line = "Look at the screen: 4 equal groups of dots.";
    const ask = askFor(kit.topicId, { id: "p:wb:4", content: [kit.expectations[0]], line });
    const ctx = gateCtxFor(ask, { kit });
    const x = explainerFor({ lessonId: "p", kit, band: "B3", text: PROD_LINE });   // 15 dots
    const s = retime(x.params.script, Math.max(800, Number(x.params.script.durationMs) || 0), ctx.speechMs);
    const r = regate({ ...s, board: { ...WB_BOARD, ...(s.board ?? {}) } }, ask, ctx);
    assert.equal(r.ok, false);
    assert.ok(r.gate.checks.some((c) => c.id === "W8.counts_match_line" && !c.pass));
  });
});

describe("board legibility fit (catalogue boards at the phone tray)", () => {
  it("the authored catalogue mostly fails W1 as drawn; the fit makes its geometry pass for most boards, text sizes untouched", () => {
    const cat = loadCatalogue({ fresh: true });
    const GEO = new Set(["W0.shape", "W1.fits_stage", "W2.no_text_overlap", "W2.text_clear_of_lines", "W3.labels_anchored"]);
    const geoPass = (s) => !gateWhiteboard({ ...s, scriptId: "x", line: { lessonId: "L" }, anchor: "line_audio_start", mode: "fresh" }, { reply: "", kit: {}, speechMs: 4000 })
      .checks.some((c) => !c.pass && GEO.has(c.id));
    let n = 0, w1Before = 0, before = 0, after = 0;
    for (const [, e] of cat) for (const b of e.boards ?? []) {
      n++;
      if (minTextPx(b.script) < 11) w1Before++;
      if (geoPass(b.script)) before++;
      const f = fitLegible(b.script);
      if (geoPass(f)) after++;
      const texts = (s) => s.ops.filter((o) => o.op === "text").map((o) => o.size ?? "m").join();
      assert.equal(texts(f), texts(b.script), "text sizes are never changed");
    }
    assert.ok(n >= 3000, `catalogue boards ${n}`);
    assert.ok(w1Before / n > 0.9, `boards below 11 px as authored: ${w1Before}/${n}`);
    assert.ok(after / n >= 0.6 && after > before * 10, `geometry passes: before ${before}/${n}, after ${after}/${n}`);
  });
  it("scaleScript scales coordinates and lengths only", () => {
    const s = { board: { w: 800, h: 500 }, ops: [{ id: "a", op: "circle", c: [400, 250], r: 100, startMs: 0, endMs: 500 }, { id: "t", op: "text", at: [10, 20], text: "1/2", size: "s", startMs: 0, endMs: 300 }] };
    const k = scaleScript(s, 0.5);
    assert.deepEqual([k.board.w, k.board.h, k.ops[0].c, k.ops[0].r, k.ops[1].at, k.ops[1].size, k.ops[1].text], [400, 250, [200, 125], 50, [5, 10], "s", "1/2"]);
  });
});

describe("board-first preselect", () => {
  it("the row prefix is the seam's, and the row is never mistaken for a Studio piece's", () => {
    assert.equal(BF.STUDIO_ROW_PREFIX, seam.STUDIO_ROW_PREFIX);
    const row = BF.rowOfFacts({ onScreen: { numbers: "3 5 15" } });
    assert.ok(BF.isBoardFirstRow(row));
    assert.equal(seam.isStudioRow(row), false);
    assert.equal(BF.isBoardFirstRow(`${BF.STUDIO_ROW_PREFIX}whiteboard · x 1`), false);
    assert.equal(BF.rowOfFacts({ onScreen: {} }), null, "no values, no row");
  });
  it("covers >= 90% of explain and worked-example asks over the 385 class 4-7 topics, in < 60 ms each, no model call", async () => {
    const { allTopics } = await import("../evals/p4-content/coverage.mjs");
    let n = 0, ok = 0; const t0 = performance.now();
    for (const t of allTopics()) {
      let kit; try { kit = kitOf(t.topicId); } catch { continue; }
      for (const [beat, content] of [["explain", (kit.expectations ?? []).slice(0, 1)], ["worked_example", [`worked example: ${kit.workedExample?.problem ?? ""}`]]]) {
        n++;
        if (BF.preselect(askFor(t.topicId, { id: `cov${n}:wb:1`, beat, content }), { kit })) ok++;
      }
    }
    const ms = (performance.now() - t0) / n;
    assert.equal(n, 770);
    assert.ok(ok / n >= 0.9, `preselected ${ok}/${n}`);
    assert.ok(ms < 60, `${ms.toFixed(1)} ms per ask`);
  });
  it("re-gates on her REAL line: a line written from the row passes, a contradicting line falls through (null)", () => {
    const kit = kitOf(C4);
    const a = c4Ask("rg1:wb:1");
    const pick = BF.preselect(a, { kit });
    assert.match(pick?.row ?? "", /equal parts 4/, "the row names the drawn counts W8 checks");
    const good = { ...a, line: { ...a.line, text: GOOD } };
    const r = BF.takePreselected(good, gateCtxFor(good, { kit }));
    assert.equal(r?.ok, true); assert.equal(r.source, "first"); assert.ok(r.syncMs < 200);
    const a2 = c4Ask("rg2:wb:1");
    BF.preselect(a2, { kit });
    const bad = { ...a2, line: { ...a2.line, text: BAD } };
    assert.equal(BF.takePreselected(bad, gateCtxFor(bad, { kit })), null);
    assert.equal(BF.pickState(bad), "rejected:W8.counts_match_line");
    assert.equal(BF.takePreselected(good, gateCtxFor(good, { kit })), null, "a pick is used once");
  });
  it("W9 is checked as if her line said no number: the 3 x 5 board waits for a line that says 3 and 5", () => {
    const kit = kitOf("c6-maths-ch07-t01");
    const p = BF.preselect(askFor(kit.topicId, { id: "w9:wb:1", beat: "worked_example", content: [`worked example: ${kit.workedExample.problem}`] }), { kit });
    assert.doesNotMatch(p?.row ?? "", /numbers 3 5 15/, "item answers (5, 15) are never preselected onto the board");
  });
  it("never on a continued board; the kill switch turns it off", () => {
    const kit = kitOf("c5-evs-ch01-t01");
    assert.equal(BF.preselect(askFor(kit.topicId, { id: "c1:wb:1", content: kit.expectations.slice(0, 1), mode: "continue" }), { kit }), null);
    const was = process.env.TAXILA_BOARD_FIRST;
    process.env.TAXILA_BOARD_FIRST = "0";
    try { assert.equal(BF.preselect(askFor(kit.topicId, { id: "c2:wb:1", content: kit.expectations.slice(0, 1) }), { kit }), null); }
    finally { if (was === undefined) delete process.env.TAXILA_BOARD_FIRST; else process.env.TAXILA_BOARD_FIRST = was; }
  });
  it("board-sync takes the preselected board as rung 0 (patch 02)", { skip: SYNC_PATCHED ? false : "patch 02-board-sync-first.diff not applied" }, async () => {
    const kit = kitOf(C4);
    const a = c4Ask("bs1:wb:1");
    BF.preselect(a, { kit });
    let called = 0;
    const r = await boardSync.plan({ ...a, line: { ...a.line, text: GOOD } }, { kit, planWhiteboard: async () => { called++; return { ok: false }; }, budgetMs: 7000 });
    assert.equal(r.source, "first"); assert.ok(r.syncMs < 200); assert.equal(called, 0, "no model call when the preselected board passes");
  });
});

describe("seam: preselect, then requestIntent draws synchronously (patch 03)", () => {
  before(() => { seam._setDeps({ planWhiteboard: async () => ({ ok: false, usd: 0 }), q: async () => [], writeEvidence: async () => ({ written: true }) }); });
  const open = (id) => { const kit = kitOf(C4); seam.studioSeam.prefetch({ lessonId: id, purpose: "practice", kit, topicId: C4, child: { id: `child-${id}`, class_level: 4, language_pref: "hinglish" } }); return kit; };
  it("a preselected board rides the ack with its artifact; a safeguarded lesson preselects nothing", { skip: SEAM_PATCHED ? false : "patch 03-studio-seam-first.diff not applied" }, () => {
    const id = "r2c-1"; open(id);
    const base = c4Ask(`${id}:wb:4`);
    const row = seam.studioSeam.preselectWhiteboard(base);
    assert.ok(BF.isBoardFirstRow(row), String(row));
    const ack = seam.studioSeam.requestIntent({ ...base, line: { ...base.line, text: GOOD } });
    assert.equal(ack.state, "revealed");
    assert.equal(ack.artifact?.kind, "whiteboard");
    assert.ok(ack.artifact.script.ops.length > 0);
    const id2 = "r2c-2"; open(id2);
    seam.studioSeam.onSafety(id2);
    assert.equal(seam.studioSeam.preselectWhiteboard(c4Ask(`${id2}:wb:4`)), null);
  });
  it("a line that contradicts the preselected board falls through to the ladder (planning, never a wrong board)", { skip: SEAM_PATCHED ? false : "patch 03-studio-seam-first.diff not applied" }, () => {
    const id = "r2c-3"; open(id);
    const base = c4Ask(`${id}:wb:4`);
    seam.studioSeam.preselectWhiteboard(base);
    const ack = seam.studioSeam.requestIntent({ ...base, line: { ...base.line, text: BAD } });
    assert.equal(ack.state, "planning");
    assert.equal(ack.artifact, undefined);
  });
  it("a continued board: her row is the board on screen", { skip: SEAM_PATCHED ? false : "patch 03-studio-seam-first.diff not applied" }, () => {
    const id = "r2c-4"; open(id);
    const base = c4Ask(`${id}:wb:4`);
    seam.studioSeam.preselectWhiteboard(base);
    seam.studioSeam.requestIntent({ ...base, line: { ...base.line, text: GOOD } });
    const cont = { ...c4Ask(`${id}:wb:5`), mode: "continue" };
    assert.match(seam.studioSeam.preselectWhiteboard(cont) ?? "", /equal parts 4/);
    // the board on screen, re-gated on her new line, stays up at once (no empty stage while a continuation plans)
    const ack = seam.studioSeam.requestIntent({ ...cont, line: { ...cont.line, text: "Ab board par dekho: 4 equal parts mein se ek part ko quarter kehte hain." } });
    assert.equal(ack.state, "revealed");
    assert.equal(ack.artifact?.kind, "whiteboard");
  });
});

describe("fractions@1 name / of (patch 05: w1b-mounts, 3 maths lessons with no item-bound mount on production)", () => {
  const skip = FR_PATCHED ? false : "patch 05-fractions-name-of.diff not applied";
  it("binds the items the three production lessons posed first, and only items whose key the engine computes", { skip }, () => {
    const want = { "c6-maths-ch07-t01-i01": ["name", "1/4"], "c4-maths-ch05-t01-i01": ["name", "1/4"], "c7-maths-ch08-t01-i01": ["of", "5"], "c4-maths-ch05-t01-i02": ["of", "5"] };
    for (const [id, [mode, key]] of Object.entries(want)) {
      const kit = kitOf(id.replace(/-i\d+$/, ""));
      const item = kit.items.find((i) => i.id === id);
      const p = planEngine({ kit, item, lang: "en", mode: "show", topicMap: TOPIC_MAP });
      assert.equal(p?.bindItem, true, `${id}: ${p?.why}`);
      assert.deepEqual([p.engine, p.params.mode, p.key], ["fractions@1", mode, key], id);
    }
    // never bound: a key with another number ("25 cm, which is 1/4 m"), a fraction of a fraction, an unequal cut
    const P = (prompt_en, answer) => planEngine({ kit: { topicId: "c6-maths-x", formats: { engineHints: ["fraction-strips"] } }, item: { id: "x", prompt_en, answer }, lang: "en", topicMap: TOPIC_MAP });
    assert.notEqual(P("A 1-metre ribbon is cut into 4 equal pieces. How long is each piece, in cm and as a fraction of a metre?", "25 cm, which is 1/4 m")?.bindItem, true);
    assert.notEqual(P("What is 1/2 of 3/4?", "3/8")?.bindItem, true);
    assert.notEqual(P("A chocolate is broken into 3 pieces. What fraction is one piece?", "1/3")?.bindItem, true);
    assert.notEqual(P("What is 1/3 of 10?", "3")?.bindItem, true);
  });
  it("frame logic: name accepts any equal value; of is the number only; impossible configs are errors", { skip }, () => {
    const n = FR.normalize({ mode: "name", target: "1/4", parts: 4, shaded: 1 });
    assert.equal(n.error, null); assert.equal(FR.nameCorrect(n, 1, 4), true); assert.equal(FR.nameCorrect(n, 2, 8), true); assert.equal(FR.nameCorrect(n, 1, 3), false);
    assert.ok(FR.normalize({ mode: "name", target: "1/4", parts: 4, shaded: 2 }).error);
    const o = FR.normalize({ mode: "of", target: "2/3", count: 15 });
    assert.equal(o.error, null); assert.equal(FR.ofCorrect(o, 10), true); assert.equal(FR.ofCorrect(o, 5), false); assert.equal(FR.ofMisc(o, 5), "unit_fraction_only");
    assert.ok(FR.normalize({ mode: "of", target: "1/3", count: 10 }).error);
  });
  it("the SERVER re-grades the raw act: a forged correct:true on a wrong answer is wrong, both modes", { skip }, () => {
    assert.ok(RECHECKABLE["fractions@1"].includes("fr.name") && RECHECKABLE["fractions@1"].includes("fr.of"));
    const name = { engine: "fractions@1", params: { mode: "name", target: "1/4", parts: 4, shaded: 1 } };
    assert.deepEqual(recheckEngineAnswer(name, { value: { kind: "fr.name", value: "1/3" }, correct: true }), { correct: false, claimMismatch: true });
    assert.deepEqual(recheckEngineAnswer(name, { value: { kind: "fr.name", value: "1/4" }, correct: false }), { correct: true, claimMismatch: true });
    const of = { engine: "fractions@1", params: { mode: "of", target: "1/4", count: 20 } };
    assert.deepEqual(recheckEngineAnswer(of, { value: { kind: "fr.of", value: 4 }, correct: true }), { correct: false, claimMismatch: true });
    assert.deepEqual(recheckEngineAnswer(of, { value: { kind: "fr.of", value: 5 }, correct: true }), { correct: true, claimMismatch: false });
    assert.equal(recheckEngineAnswer(of, { value: { kind: "fr.of", value: "five" }, correct: true }).unverifiable, true, "an unreadable act is no evidence, never the claim");
  });
});
