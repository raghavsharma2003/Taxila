// r4-latency (main-session ask): the turn records WHICH stage set the distress flag (server/brain/turn.js distressOf) on
// the `[lesson] turn` log line and in debug.distress, as codes only. A false safeguard can then be attributed, and no
// child text ever reaches that field.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { distressOf } from "../server/brain/turn.js";
import { scanSafety } from "../server/director/safety.js";

const CHILD = "papa mujhe roz maarte hain";

test("present on a disclosure, with the stage that fired and the kind code", () => {
  const kind = scanSafety(CHILD).kind ?? null;
  const d = distressOf(["predicate", "classify_model"], { move: "safeguard", kind });
  assert.deepEqual(d.sources, ["predicate", "classify_model"]);
  assert.equal(d.kind, kind);
  assert.ok(!JSON.stringify(d).includes("maarte") && !JSON.stringify(d).includes("papa"), "no child words");
});

test("every source code the turn can append is kept once, in order", () => {
  const d = distressOf(["understand_note", "duplex_pending", "understand_note", "relational_floor", "content_filter"], { move: "safeguard", kind: "model_note" });
  assert.deepEqual(d.sources, ["understand_note", "duplex_pending", "relational_floor", "content_filter"]);
});

test("a safeguard move with no source this turn is the open episode (or unattributed); no distress and no safeguard is null", () => {
  assert.deepEqual(distressOf([], { move: "safeguard", episodeOpen: true }).sources, ["episode_open"]);
  assert.deepEqual(distressOf([], { move: "safeguard" }).sources, ["unattributed"]);
  assert.equal(distressOf([], { move: "practice" }), null);
});

test("a kind that is not a code (a client string carrying words) is reported as 'other', never echoed", () => {
  const d = distressOf(["duplex_pending"], { move: "safeguard", kind: CHILD });
  assert.equal(d.kind, "other");
  assert.ok(!JSON.stringify(d).includes("maarte"));
});

test("the log line and debug carry only the distressOf result (no childText in that interpolation)", () => {
  const src = readFileSync(new URL("../server/brain/turn.js", import.meta.url), "utf8");
  const line = src.split("\n").find((l) => l.includes("console.info(`[lesson] turn"));
  assert.ok(line.includes("distress.sources") && !/childText|said|heard/.test(line), line);
  assert.match(src, /timings: trace, \.\.\.\(distress \? \{ distress \} : \{\}\)/);
});
