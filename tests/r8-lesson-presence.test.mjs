// Round 8 step b: the lesson's presence layout (stageLayout.ts \`presence\`), which the ?tx= switch turns on (StageBody).
import { test } from "node:test";
import assert from "node:assert/strict";
import { solveStage, STAGE } from "../src/ui-v3/kaksha/lesson/stageLayout.ts";
import { presenceState } from "../src/ui-v3/r8/presence.ts";
import { mathRuns } from "../src/child/lesson/mathRuns.ts";

const sum = (L) => L.top.h + 4 + L.stage.h + STAGE.gap + (L.answer ? L.answer.h + STAGE.gap : 0) + (L.chips?.h ?? 0) + (L.strip?.h ?? 0) + L.dock.h + STAGE.pad;

test("presence on a phone: no PiP; a talk row between the board and the question while a piece is up; the column still sums", () => {
  for (const [w, h] of [[360, 740], [360, 640], [412, 915]]) {
    const L = solveStage({ width: w, height: h, family: "older", artifact: true, chips: true, presence: true });
    assert.equal(L.kind, "phone");
    assert.equal(L.pip, null, "no face over the board");
    assert.ok(L.talk, "the talk row");
    assert.ok(L.talk.y >= L.slot.y + L.slot.h, "under the board");
    assert.ok(L.rail.y >= L.talk.y + L.talk.h, "above the question");
    assert.ok(L.rail.y + L.rail.h <= L.stage.y + L.stage.h, "inside the stage frame");
    assert.equal(sum(L), h, `${w}x${h} sums to the container`);
    assert.ok(L.slot.h >= STAGE.slotMin, "the board keeps a usable slot");
    assert.ok(L.slot.w * L.slot.h > L.dock.w * L.dock.h, "the board is the largest zone");
  }
  const none = solveStage({ width: 360, height: 740, family: "older", artifact: false, chips: true, presence: true });
  assert.equal(none.talk, null, "with nothing up she holds the stage: no talk row");
  const kb = solveStage({ width: 360, height: 740, family: "older", artifact: true, keyboard: true, presence: true });
  assert.equal(kb.talk, null, "a keyboard folds the talk row away");
  const off = solveStage({ width: 360, height: 740, family: "older", artifact: true, chips: true });
  assert.ok(off.pip && off.talk === null, "without presence, today's PiP layout is unchanged");
});

test("presence on wide screens: her tile is one presence row, the caption takes the side column, and a gap parts the board from the question", () => {
  const L = solveStage({ width: 1366, height: 768, family: "older", artifact: true, chips: true, presence: true });
  assert.equal(L.kind, "wide");
  assert.equal(L.tile.h, STAGE.presenceRow);
  assert.ok(L.caption.h >= 120 && L.caption.h <= STAGE.capPresence, "the caption holds her last lines");
  assert.equal(L.chips.y, L.caption.y + L.caption.h, "the chips sit right under her words");
  assert.equal(L.dock.y + L.dock.h, 768 - STAGE.gutterWide, "the dock stays at the column's foot");
  assert.equal(L.rail.y, L.slot.y + L.slot.h + STAGE.gap);
  assert.equal(L.rail.y + L.rail.h, L.stage.y + L.stage.h);
  const today = solveStage({ width: 1366, height: 768, family: "older", artifact: true, chips: true });
  assert.ok(today.tile.h > 200 && today.rail.y === today.slot.y + today.slot.h, "without presence, unchanged");
});

test("her presence reads the floor: talking, listening, thinking, idle", () => {
  assert.equal(presenceState("speaking"), "talking");
  assert.equal(presenceState("showing"), "talking");
  assert.equal(presenceState("your_turn"), "listening");
  assert.equal(presenceState("listening"), "listening");
  assert.equal(presenceState("thinking"), "thinking");
  assert.equal(presenceState("idle"), "idle");
  assert.equal(presenceState(undefined), "idle");
});

test("the plain board's maths lines split into fractions to stack, the text unchanged", () => {
  assert.deepEqual(mathRuns("1/2 = 2/4"), [{ frac: ["1", "2"] }, { text: " = " }, { frac: ["2", "4"] }]);
  assert.deepEqual(mathRuns("12 + 3"), [{ text: "12 + 3" }]);
  assert.deepEqual(mathRuns("x = 3/10."), [{ text: "x = " }, { frac: ["3", "10"] }, { text: "." }]);
  const back = (rs) => rs.map((r) => ("frac" in r ? `${r.frac[0]}/${r.frac[1]}` : r.text)).join("");
  for (const s of ["1/2 = 2/4", "3/4 > 1/2 and 7/8", "no maths"]) assert.equal(back(mathRuns(s)), s);
});

test("step f: the offline state has its own words (never 'something went wrong'), in the copy's style", async () => {
  const fs = await import("node:fs");
  const copy = fs.readFileSync(new URL("../src/child/copy.ts", import.meta.url), "utf8");
  const title = /offlineTitle:\s*"([^"]+)"/.exec(copy)?.[1], line = /offlineLine:\s*"([^"]+)"/.exec(copy)?.[1];
  assert.equal(title, "You're offline.");
  assert.ok(line && !/!|went wrong|error/i.test(line), "calm, no exclamation, not an error");
  const shell = fs.readFileSync(new URL("../src/child/ChildShell.tsx", import.meta.url), "utf8");
  assert.match(shell, /offline \? t\("offlineTitle"\)/, "the gate says offline when the device is offline");
  assert.match(shell, /addEventListener\("online"/, "it tries again by itself when the network returns");
  const stage = fs.readFileSync(new URL("../src/ui-v3/kaksha/lesson/StageBody.tsx", import.meta.url), "utf8");
  assert.match(stage, /ks-standby/, "a piece that has not drawn yet never leaves an empty board card");
});
