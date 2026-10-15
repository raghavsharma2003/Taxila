// Round 5, stream 2 (QA D09: "on the phone the 3rd box is clipped at the stage's bottom edge"): no box of a library board
// touches the board's edge. flow@1's column layout put its last box's bottom at exactly y = 300 (the board's height), so the
// box's stroke was cut wherever the stage shows the board as drawn: 191 of the 316 library boards. Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { expand } from "../server/forge/explainer/templates.js";

const LIB = JSON.parse(fs.readFileSync(new URL("../server/forge/explainer/library.json", import.meta.url), "utf8"));
const calls = [];
const walk = (o) => { if (o && typeof o === "object") { if (o.call?.template) calls.push(o.call); for (const v of Object.values(o)) walk(v); } };
walk(LIB);

test("every library board keeps its boxes (with their strokes) inside the board", () => {
  assert.ok(calls.length > 100, "the library was read");
  const out = [];
  for (const call of calls) {
    let s;
    try { s = expand(call, { band: "B3", lessonId: "x", scriptId: "x" }); } catch { continue; }
    s = s?.script ?? s;
    if (!s?.ops) continue;
    const { w, h } = s.board;
    for (const o of s.ops) {
      if (o.op !== "rect") continue;
      const pad = (o.weight ?? 1) / 2;
      if (o.at[0] - pad < 0 || o.at[1] - pad < 0 || o.at[0] + o.w + pad > w || o.at[1] + o.h + pad > h) { out.push(`${call.template} ${o.id}`); break; }
    }
  }
  assert.deepEqual(out, []);
});

test("flow@1 in a column (QA D09's board): the third box ends above the board's bottom", () => {
  const s0 = expand({ template: "flow@1", steps: ["Change to grams", "Compare weights", "Find the heavier weight"] }, { band: "B3", lessonId: "x", scriptId: "x" });
  const s = s0.script ?? s0;
  const b2 = s.ops.find((o) => o.id === "b2");
  assert.ok(b2.at[1] + b2.h <= s.board.h - 8, `bottom ${b2.at[1] + b2.h} of ${s.board.h}`);
});

test("no library board's facts row carries an id-like key ('left1', 'step2'): she reads the row and says them (sim lab p29)", async () => {
  const { factsRow } = await import("../server/director/modules.js");
  const bad = [];
  for (const call of calls) {
    let s;
    try { s = expand(call, { band: "B3", lessonId: "x", scriptId: "x" }); } catch { continue; }
    if (!s?.facts) continue;
    const row = factsRow(s.facts) ?? "";
    const ids = row.split(" · ").slice(1).map((p) => p.split(" ")[0]).filter((w) => /^[a-z]+\d+$/i.test(w));
    if (ids.length) bad.push(`${call.template}: ${ids.join(",")}`);
  }
  assert.deepEqual([...new Set(bad)], []);
});
