// Round 8 (main 2026-11-11, ruling 3): the home's one true line under ?tx= (src/ui-v3/r8/homeLine.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { homeLine } from "../src/ui-v3/r8/homeLine.ts";

test("parked questions first, then resuming, then today's time; nothing when none is true; only the start state", () => {
  const L = (o) => homeLine({ state: "start", jar: 0, resuming: false, lessonTime: null, ...o });
  assert.deepEqual(L({ jar: 2, resuming: true, lessonTime: "4:30 pm" }), { kind: "jar", n: 2 });
  assert.deepEqual(L({ resuming: true, lessonTime: "4:30 pm" }), { kind: "resume" });
  assert.deepEqual(L({ lessonTime: "4:30 pm" }), { kind: "time", time: "4:30 pm" });
  assert.equal(L({}), null, "no filler line when nothing is true");
  for (const state of ["done", "capped", "resting", "homework", "test", "loading"]) assert.equal(L({ state, jar: 3 }), null);
});

test("the copy: digits for counts, a singular for one, never a topic title", async () => {
  const { kt } = await import("../src/ui-v3/kaksha/copy.ts");
  assert.equal(kt("jarOne"), "Your 1 question from last time comes first.");
  assert.equal(kt("jarMany", { n: "3" }), "Your 3 questions from last time come first.");
  assert.equal(kt("lessonToday", { time: "4:30 pm" }), "Lesson time today: 4:30 pm.");
  const views = fs.readFileSync(new URL("../src/ui-v3/kaksha/views.tsx", import.meta.url), "utf8");
  assert.match(views, /homeLine\(\{ state: p\.state, jar: p\.jarCount/, "the home reads the server's count");
});
