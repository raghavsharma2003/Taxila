// dc-r7-script-walk-v6-7 (main's director15 judgement, four hand judges): each fix a PREDICATE pinned on director15's own rows (0-based
// rows of the run's .json), replayed through turn.js planTurn (tests/fixtures/replay.mjs) and textReply with the run's own scripts.
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { replay, runScriptOf } from "./fixtures/replay.mjs";
import { textReply, replyDeps } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { setScriptForTest } from "../server/director/script.js";

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
});
