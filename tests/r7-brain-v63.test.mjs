// dc-r7-script-walk-v6-3 (main's director11 judgement, four hand judges): each fix is a PREDICATE pinned on director11's own rows,
// replayed through turn.js planTurn (tests/fixtures/replay.mjs) and textReply with the run's own v2.3 scripts and her own words.
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { replay, runScriptOf } from "./fixtures/replay.mjs";
import { textReply, replyDeps } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { setScriptForTest } from "../server/director/script.js";

/** T1′: the closes a turn says — a right answer's verdict with its why, a give-up / worked answer, a carried close of another card. */
export function closesOf(reply) {
  const s = String(reply ?? "");
  const out = [];
  if (/^(?:haan|bilkul|sahi|shabaash|yes|right|correct)\b[^.!?]*\bkyunki\b/i.test(s)) out.push("verdict+why");
  if (/\btoh poora jawab\b|\bso the full answer\b/i.test(s)) out.push("worked");
  if (/\bis sawaal ka (?:sahi )?jawab\b|\bthis question'?s answer\b/i.test(s)) out.push("gave");
  if (/\bpehle wale sawaal ka (?:sahi )?jawab\b|\bthe earlier question'?s\b/i.test(s)) out.push("carried");
  return out;
}

describe("r7-brain-v63.test.mjs", () => {
  const RUN = "2026-11-08-director11";
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT; setScriptForTest(); });
  afterEach(() => { replyDeps.chat = chat; setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });
  const TOPIC = { c4: "c4-maths-ch05-t01", "c5-t01": "c5-maths-ch02-t01", "c5-t02": "c5-maths-ch02-t02", c6: "c6-maths-ch06-t01" };
  /** The judges' "T<n>" is the run's row n (0-based: the teacher's turn after the child's row n-1). */
  const at = async (persona, topic, n) => {
    const T = TOPIC[topic];
    setScriptForTest(T, runScriptOf(RUN, T));
    const { kit, rows, last } = await replay(RUN, persona, T, n + 1);
    replyDeps.chat = async () => ({ text: rows[n].text });
    const out = await textReply({ instructions: instructionsFor(last.state, kit), state: last.state, kit, childText: last.child, history: [], ui: last.p.r.ui, module: null });
    return { out, rows, last };
  };

  const T1_ROWS = [["steady", "c6", 20], ["steady", "c6", 32], ["stuck", "c6", 52], ["offtopic", "c6", 28], ["steering", "c6", 12], ["steering", "c6", 32],
    ["steady", "c4", 24], ["stuck", "c4", 14], ["stuck", "c4", 54], ["offtopic", "c4", 12], ["offtopic", "c4", 20], ["steering", "c4", 30],
    ["steady", "c5-t01", 24], ["stuck", "c5-t01", 24], ["offtopic", "c5-t01", 15], ["steering", "c5-t01", 10],
    ["steady", "c5-t02", 17], ["stuck", "c5-t02", 15], ["offtopic", "c5-t02", 11]];
  test("T1′ predicate: one close at most, and never a close of a card other than the one just answered (judges' 19 rows)", async () => {
    const bad = [];
    for (const [persona, topic, n] of T1_ROWS) {
      const { out, rows } = await at(persona, topic, n);
      const was = closesOf(rows[n].text), now = closesOf(out.reply);
      if (now.length > 1 || now.includes("carried")) bad.push(`${persona} ${topic} T${n}: ${now.join("+")} (run: ${was.join("+")}) | ${out.reply.slice(0, 160)}`);
    }
    assert.deepEqual(bad, []);
  });
});
