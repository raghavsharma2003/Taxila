// dc-r7-script-walk-v6-6 (main's director14 judgement, four hand judges): each fix is a PREDICATE pinned on director14's own rows
// (0-based rows of the run's .json), replayed through turn.js planTurn (tests/fixtures/replay.mjs) and textReply with the run's own
// v2.3 scripts and her own words.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { drawnContradictionsOf } from "../evals/hybrid-side-by-side/drawn-pages.mjs";
import { scriptsOf, answerBoardOf } from "../evals/hybrid-side-by-side/proxies-v64.mjs";
import { pictureMismatch } from "../evals/hybrid-side-by-side/checks.mjs";

const RUN = "2026-11-09-director14";
const DIR = new URL(`../evals/hybrid-side-by-side/results/${RUN}/`, import.meta.url).pathname;
const TAG = { "c4-ch05-t01": "c4", "c5-ch02-t01": "c5-t01", "c5-ch02-t02": "c5-t02", "c6-ch06-t01": "c6" };

describe("r7-brain-v66.test.mjs", () => {
  describe("H3: contradictions read from the pages drawn", () => {
    // main's 22 hand rows on director14 (17 paging, 4 second view, 1 model words)
    const HAND = ["c4 steady 20", "c4 steady 54", "c5-t01 steady 18", "c5-t01 stuck 18", "c5-t01 offtopic 26", "c5-t01 steering 14",
      "c5-t01 stuck 26", "c5-t01 stuck 70", "c5-t01 offtopic 16", "c5-t01 offtopic 46", "c5-t01 offtopic 62", "c5-t01 steering 48",
      "c5-t02 steady 42", "c5-t02 steady 46", "c5-t02 steady 66", "c5-t02 steering 46", "c5-t02 stuck 54",
      "c6 steady 50", "c6 steady 72", "c6 stuck 54", "c6 offtopic 12", "c6 offtopic 66"];
    test("recall ≥ 20/22 with ≤ 2 false flags on director14", () => {
      const scripts = scriptsOf(DIR);
      const got = new Set();
      for (const f of readdirSync(DIR).filter((x) => /^(steady|offtopic|stuck|steering)-.*\.json$/.test(x))) {
        const j = JSON.parse(readFileSync(DIR + f, "utf8"));
        const persona = f.split("-")[0], tag = TAG[f.slice(f.indexOf("-") + 1, -5)];
        for (const d of drawnContradictionsOf(j.director, { answerBoardOf: (id) => answerBoardOf(scripts, j.topicId, id) })) got.add(`${tag} ${persona} ${d.i}`);
      }
      const hit = HAND.filter((k) => got.has(k));
      const falseFlags = [...got].filter((k) => !HAND.includes(k));
      assert.ok(hit.length >= 20, `recall ${hit.length}/22; missed ${HAND.filter((k) => !got.has(k)).join(", ")}`);
      assert.ok(falseFlags.length <= 2, `false flags: ${falseFlags.join(", ")}`);
    });
    test("the unrolled checker hears 'patti'", () => {
      const board = { template: "measured@1", params: { shape: "triangle", unit: "cm", sides: [4, 5, 6] } };
      assert.deepEqual(pictureMismatch("Screen par dekho: teeno bhujayein ek seedhi patti par.", board, "unrolled"), []);
    });
  });
});
