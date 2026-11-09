// round 7, director15 (main's v6.7, S9b root cause): c6 stuck row 18 (0-based), "picture dikhao" while the remediation's
// lettered hexagon is up. Replayed from the run (evals/hybrid-side-by-side/results/2026-11-09-director15) through Brain's own
// planTurn (tests/fixtures/replay.mjs, the recorded child reads, no model calls), then (a) through Studio's seam as production
// drives it and (b) through the eval harness's own board-first bookkeeping, without and with the page up's beat kind.
import { test } from "node:test";
import assert from "node:assert/strict";
import { replay, runScriptOf } from "./fixtures/replay.mjs";
import * as seam from "../server/studio/seam.js";
import * as BF from "../server/stagecraft/board-first.js";
import { gateCtxFor } from "../server/stagecraft/board-sync.js";
import { whiteboardIntentOf, boardItemOf } from "../server/brain/propose.js";
import { findItem } from "../server/director/items.js";
import { setScriptForTest } from "../server/director/script.js";

const RUN = "2026-11-09-director15", T = "c6-maths-ch06-t01";

test("director15 S9b (c6 stuck row 18): the remediation's board up reaches the preselect as kind \"remediation\" — production draws its second view, the hexagon laid straight, then the card; the harness saw it only with the page up's kind (Brain's patch 018)", async () => {
  setScriptForTest(T, runScriptOf(RUN, T));
  try {
    const { kit, rows, plans } = await replay(RUN, "stuck", T, 19);
    const byRow = new Map(plans.map((p) => [p.row - 1, p]));
    assert.equal(rows[17].text, "picture dikhao");
    assert.equal(byRow.get(16).state.lastMove?.scriptBeat?.kind, "remediation", "row 16 is the remediation's beat");

    // (a) production: Studio's seam, turn by turn, the preselect on the empty line then the take on her recorded line
    const L = `r8d15-${Date.now()}`;
    seam.studioSeam.prefetch({ lessonId: L, purpose: "practice", kit, topicId: T, child: { id: `c-${L}`, class_level: 6, language_pref: "hinglish" } });
    let at18 = null;
    for (const pl of plans) {
      const i = pl.row - 1;
      const mk = (text) => whiteboardIntentOf({ lessonId: L, turn: pl.state.turn, beat: { id: "visual", type: "explain" }, next: pl.state, kit, item: boardItemOf(pl.state, kit, findItem), line: { text } });
      const a0 = mk("");
      if (!a0?.intent?.boardRef) continue;
      seam.studioSeam.preselectWhiteboard({ ...a0 });
      const hint = seam.studioSeam.preselectedAltView(L);
      let k = seam.studioSeam.requestIntent(mk(rows[i].text));
      if (k?.state === "planning" && k.ready) k = await k.ready;
      if (i === 18) at18 = { hint, k, ref: a0.intent.boardRef };
    }
    assert.equal(at18.ref.params.shape, "pentagon", "row 18's card is the then-card's pentagon");
    assert.equal(at18.hint, "unrolled");
    assert.equal(at18.k.state, "revealed");
    assert.equal(at18.k.artifact.altView, "unrolled");
    assert.deepEqual((at18.k.artifact.screens ?? [at18.k.artifact.screen]).map((s) => s.template)[0], "unrolled@1");

    // (b) the harness's bookkeeping (evals/hybrid-side-by-side.mjs: preselect with the page up, take on her line, the paged
    // check), without the page up's kind — the run — and with it (patch 018)
    const harness = (withKind) => {
      let shownScript = null, shownRef = null, shownKind = null, pick18 = null, n = 0;
      for (const pl of plans) {
        const i = pl.row - 1, reply = rows[i]?.text ?? "", next = pl.state;
        if (!(next.lastMove?.scriptBeat?.board || next.lastMove?.cardBeat?.board)) continue;
        const Lh = `r8d15-h${withKind ? 1 : 0}`;
        const ask = whiteboardIntentOf({ lessonId: Lh, turn: next.turn, beat: { id: "visual", type: "explain" }, next, kit, item: boardItemOf(next, kit, findItem), line: { text: "" } });
        const pick = BF.preselect(ask, { kit, ...(shownScript ? { avoid: shownScript } : {}), ...(shownRef ? { avoidRef: shownRef } : {}), ...(withKind && shownKind ? { avoidKind: shownKind } : {}) });
        if (i === 18) pick18 = pick;
        let took = null;
        if (pick) { const askR = { ...ask, line: { ...ask.line, text: reply } }; try { took = BF.takePreselected(askR, gateCtxFor(askR, { kit, redact: [], prior: [] })); } catch { took = null; } }
        if (took?.script) {
          shownScript = took.script;
          shownRef = took.lastRef !== undefined ? took.lastRef : took.by === "script" && !took.altView ? BF.refKey(ask.intent.boardRef) : null;
          shownKind = !shownRef ? null : took.lastKind !== undefined ? took.lastKind : ask.intent.scriptBeat?.kind ?? null;
        }
        const askF = whiteboardIntentOf({ lessonId: `${Lh}-seg-${++n}`, turn: next.turn, beat: { id: "visual", type: "explain" }, next, kit, item: boardItemOf(next, kit, findItem), line: { text: reply } });
        if ((askF.intent.segments ?? []).length) {
          const pg = BF.pagesBoard({ ...askF, intent: { ...askF.intent, intentId: `${askF.intent.intentId}:pg` }, line: { ...askF.line, text: reply } }, { kit, ...(shownScript ? { keep: shownScript } : {}), ...(shownRef ? { keepRef: shownRef } : {}) });
          if (pg?.script) { shownScript = pg.lastPage ?? pg.script; shownRef = pg.lastRef ?? null; shownKind = shownRef ? pg.lastKind ?? null : null; }
        }
      }
      return pick18;
    };
    const run = harness(false), fixed = harness(true);
    assert.equal(run?.template, "measured@1", "the run's record: the card's own pentagon, nothing new");
    assert.equal(run?.altView, undefined);
    assert.equal(fixed?.altView, "unrolled", "with the page up's kind: the remediation's second view");
  } finally { setScriptForTest(undefined); }
});
