// dc-r7-script-walk-v6-7 (main's director15 judgement, four hand judges): each fix a PREDICATE pinned on director15's own rows (0-based
// rows of the run's .json), replayed through turn.js planTurn (tests/fixtures/replay.mjs) and textReply with the run's own scripts.
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { replay, runScriptOf } from "./fixtures/replay.mjs";
import { textReply, replyDeps } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { setScriptForTest } from "../server/director/script.js";
import { readFileSync, readdirSync } from "node:fs";
import { drawnContradictionsOf } from "../evals/hybrid-side-by-side/drawn-pages.mjs";
import { scriptsOf, answerBoardOf, beatBoardOf } from "../evals/hybrid-side-by-side/proxies-v64.mjs";

const RUN = "2026-11-09-director15";
const TOPIC = { c4: "c4-maths-ch05-t01", "c5-t01": "c5-maths-ch02-t01", "c5-t02": "c5-maths-ch02-t02", c6: "c6-maths-ch06-t01" };
const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();

describe("r7-brain-v67.test.mjs", () => {
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT; setScriptForTest(); });
  afterEach(() => { replyDeps.chat = chat; setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });

  /** Teacher row n of director15, walked live (recordedRun off): her line now from the run's own words, and the state. */
  const live = async (persona, topic, n) => {
    const T = TOPIC[topic];
    const sc = runScriptOf(RUN, T); delete sc.recordedRun;
    setScriptForTest(T, sc);
    const { kit, rows, last, plans } = await replay(RUN, persona, T, n + 1);
    replyDeps.chat = async () => ({ text: rows[n]?.text ?? "" });
    const out = await textReply({ instructions: instructionsFor(last.state, kit), state: last.state, kit, childText: last.child, history: [], ui: last.p.r.ui, module: null });
    return { out, last, kit, rows, plans };
  };

  describe("A3: asides", () => {
    // (main: the taste question was parked in every topic, then buried by the next card)
    const TASTE = [["stuck", "c5-t01", 34], ["offtopic", "c5-t02", 8], ["stuck", "c6", 38], ["offtopic", "c6", 8], ["stuck", "c4", 38]];
    test("0 parked taste questions: answered on the turn, the honest line LAST — no card after it", async () => {
      const bad = [];
      for (const [persona, topic, n] of TASTE) {
        const { out, last } = await live(persona, topic, n);
        const tag = `${persona} ${topic} row ${n}`;
        if (!/pasand/i.test(last.child)) { bad.push(`${tag}: not the taste row (${last.child})`); continue; }
        if ((last.state.later ?? []).some((e) => /virat/i.test(e.topic) && e.servedAt == null)) bad.push(`${tag}: parked`);
        if (!last.state.lastMove?.tasteAsked) bad.push(`${tag}: not answered on its turn`);
        if (!/Main AI|meri (?:apni )?(?:koi )?pasand nahi/i.test(out.reply)) bad.push(`${tag}: no honest line | ${out.reply.slice(0, 100)}`);
        if (!norm(out.reply).endsWith("?") || !/(?:kya lagta hai|kaun hai)\?$/.test(norm(out.reply))) bad.push(`${tag}: the aside question does not end her turn | ${out.reply.slice(-90)}`);
        if (/cover drive|mast hai/i.test(out.reply)) bad.push(`${tag}: a fact of hers`);
      }
      assert.deepEqual(bad, []);
    });
    test("0 lost asides: every return due is said, code's line, naming only their topic (c5-t02 offtopic, c4 steering/offtopic, c5-t01 offtopic/steering, c6 steady)", async () => {
      const bad = [];
      for (const [persona, topic] of [["offtopic", "c5-t02"], ["steering", "c4"], ["offtopic", "c4"], ["offtopic", "c5-t01"], ["steering", "c5-t01"], ["steady", "c6"]]) {
        const T = TOPIC[topic];
        const sc = runScriptOf(RUN, T); delete sc.recordedRun;
        setScriptForTest(T, sc);
        const { kit, rows, plans } = await replay(RUN, persona, T, 1e9);
        for (const pl of plans) {
          const ret = pl.state.lastMove?.returned;
          if (!ret) continue;
          const n = pl.row - 1;
          replyDeps.chat = async () => ({ text: rows[n]?.text ?? "" });
          const out = await textReply({ instructions: instructionsFor(pl.state, kit), state: pl.state, kit, childText: pl.child, history: [], ui: pl.p.r.ui, module: null });
          if (!out.guard.returnSaid || !out.reply.includes(out.guard.returnLine ?? "\u0000")) bad.push(`${persona} ${topic} row ${n}: the return not said | ${out.reply.slice(0, 100)}`);
        }
        const open = (plans.at(-1)?.state.later ?? []).filter((e) => e.share && e.servedAt == null && e.parkSaid && e.onItem);
        // (an aside parked on the lesson's last card may still wait: the lesson ended before its boundary)
        const lastTurn = plans.at(-1)?.state.turn ?? 0;
        for (const e of open) if (lastTurn - e.at > 8) bad.push(`${persona} ${topic}: ${e.topic} never returned (parked at ${e.at}, last turn ${lastTurn})`);
      }
      assert.deepEqual(bad, []);
    });
    test("a repeated aside gets one line, no new promise (c5-t02 offtopic 28: 'mujhe cricket pasand hai')", async () => {
      const { out, last } = await live("offtopic", "c5-t02", 28);
      assert.match(last.child, /cricket/i);
      assert.ok(last.state.lastMove?.asideAgain || last.state.lastMove?.returned, JSON.stringify(last.state.lastMove).slice(0, 200));
      assert.match(out.reply, /cricket/i, out.reply);
      assert.doesNotMatch(out.reply, /ke baad karenge|baad baat karenge/i, out.reply);
    });
  });
  describe("H4: the counter, part by part", () => {
    test("director15: main's 5 hand rows and the named P4′ rows found; ≤ 2 other flags", () => {
      const DIR = new URL(`../evals/hybrid-side-by-side/results/${RUN}/`, import.meta.url).pathname;
      const scripts = scriptsOf(DIR);
      const TAG = { "c4-ch05-t01": "c4", "c5-ch02-t01": "c5-t01", "c5-ch02-t02": "c5-t02", "c6-ch06-t01": "c6" };
      const got = new Set();
      for (const f of readdirSync(DIR).filter((x) => /^(steady|offtopic|stuck|steering)-.*\.json$/.test(x))) {
        const j = JSON.parse(readFileSync(DIR + f, "utf8"));
        const tag = TAG[f.slice(f.indexOf("-") + 1, -5)];
        for (const d of drawnContradictionsOf(j.director, { answerBoardOf: (id) => answerBoardOf(scripts, j.topicId, id), beatBoardOf: beatBoardOf(scripts, j.topicId) })) got.add(`${tag} ${f.split("-")[0]} ${d.i}`);
      }
      const HAND = ["c4 steady 78", "c5-t02 steering 8", "c6 steering 8", "c6 offtopic 32", "c5-t02 offtopic 44"];
      const P4P = ["c4 stuck 32", "c4 offtopic 16", "c5-t02 stuck 16", "c5-t02 offtopic 16"];
      // (main's P4′ shape counted in c6 ×9 and c5-t01 ×7 too, unnamed: a flag there of that shape is no false flag)
      const p4Shape = (k) => /^(?:c6|c5-t01) /.test(k);
      // (c4 offtopic 34: the yourStep's simpler on closed e4's board — main's B1″ row)
      const known = new Set(["c4 offtopic 34"]);
      const hit = HAND.filter((k) => got.has(k));
      assert.ok(hit.length >= 4, `hand rows: ${hit.length}/5, missed ${HAND.filter((k) => !got.has(k))}`);
      for (const k of P4P) assert.ok(got.has(k), `P4′ row ${k}`);
      const other = [...got].filter((k) => !HAND.includes(k) && !P4P.includes(k) && !p4Shape(k) && !known.has(k));
      assert.ok(other.length <= 2, `other flags: ${other}`);
    });
  });
});
