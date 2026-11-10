// r7 audit: faults in the learner model, placement and set-up that main decides before anything changes (main 2026-11-10:
// "commit a failing test that shows the fault on a concrete child"). Each test FAILS today and is marked `todo` so the gate
// stays green; the smallest change that makes each pass, and what else it moves, is in
// docs/design/round7/audit/learner-proposals.md ("Decisions first"). Remove `todo` with the fix. Pure, no DB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fold, newLedger } from "../server/learner/kt/ledger.js";
import { ladder } from "../server/comprehension/state.js";
import { finalEvent, lateEvent } from "../server/comprehension/later.js";
import { coldStartResult } from "../server/placement/coldstart.js";
import { schoolStartIndex } from "../server/content/next-topic.js";
import { getTopic, topicSequence } from "../server/content/curriculum.js";

const S = "c5-maths-ch02-t01-s1", T0 = Date.UTC(2026, 10, 2, 11, 0);
let n = 0;
const ev = (o) => ({ id: `L1:${++n}:0`, seq: n, sessionId: "L1", sessionStartAt: new Date(T0).toISOString(), at: new Date(T0 + n * 60_000).toISOString(),
  episodeId: `L1-ep${n}`, skillIds: [S], target: S, itemKey: `k${n}`, cls: "item.open", outcome: 0, grader: "code", graderVersion: "g", topicType: "T3", ...o });
const fresh = () => newLedger({ childId: "c", classLevel: 5 });

test("LEARN-02: a class-5 child who gets all 10 cards wrong (each ends C4) is not given a rising estimate", () => {
  n = 0;
  const after = (k) => fold(fresh(), Array.from({ length: k }, () => ev({ outcome: 4 }))).skills[S].pL;
  const one = after(1), ten = after(10);
  assert.ok(ten <= one, `after 1 wrong card ${one.toFixed(3)}, after 10 ${ten.toFixed(3)}`);
  assert.ok(ten < 0.4, `after 10 wrong cards the estimate is ${ten.toFixed(3)}: the weak-foundation rule (< 0.4) never fires`);
});

test("LEARN-02 (real pipeline): 60 wrong answers on a pilot topic end below where the child started; weak foundation and the worked support level fire", async () => {
  const { spawnSync } = await import("node:child_process");
  const { mkdtempSync, readFileSync: rd, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { guidanceLevel } = await import("../server/director/fading.js");
  const dir = mkdtempSync(join(tmpdir(), "replay-"));
  try {
    const r = spawnSync(process.execPath, [new URL("../evals/learner-pilot-replay/replay.mjs", import.meta.url).pathname, "--topics", "c5-maths-ch02-t01",
      "--children", "wrong", "--lessons", "3", "--label", "t", "--out", dir], { encoding: "utf8", env: { ...process.env, DATABASE_URL: "" } });
    assert.equal(r.status, 0, r.stderr);
    const rows = JSON.parse(rd(join(dir, "replay-t.json"), "utf8")).rows;
    assert.ok(rows.length >= 3);
    for (const x of rows) {
      assert.ok(x.answers >= 20 && x.right === 0, JSON.stringify(x));
      assert.ok(x.end <= x.prior, `${x.skill}: ${x.prior} → ${x.end} after ${x.answers} wrong answers`);
      assert.equal(x.weak, true, `${x.skill}: the weak-foundation rule does not fire`);
      assert.equal(guidanceLevel({ pKnown: x.end, attempts: x.answers }).level, "worked", `${x.skill}: support level`);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("LEARN-04: taught but never answered is not 'gets the answers'", { todo: "LEARN-04: main decides the model change" }, () => {
  const x = { display: "practising", pL: 0.659, recent: [], delayedMisses: 0, U: 0.5, T: 0.2, nonGameU: true, nonGameT: true, mStar: 0, verified: false, longDelayPos: false };
  assert.equal(ladder(x).state, "not_yet", "no answer at all, yet the ladder reads 'does'");
});

test("LEARN-05: the same blind 'why' verdict gives the same state whether it arrives in time or late", { todo: "LEARN-05: main decides the model change" }, () => {
  const res = [{ targetId: "x", label: "present", spanOk: true }];
  n = 0; const a = [ev({}), ev({})]; const w1 = ev({ cls: "probe.why", outcome: 2, grader: "llm" });   // the classifier guessed "none"
  const inTime = fold(fresh(), [...a, finalEvent(w1, res).event]).skills[S];
  n = 0; const b = [ev({}), ev({})]; const w2 = ev({ cls: "probe.why", outcome: 2, grader: "llm" });
  const late = fold(fresh(), [...b, finalEvent(w2, []).event, { ...lateEvent(w2, res), seq: 99 }]).skills[S];
  assert.equal(late.display, inTime.display, `in time ${inTime.display} (${inTime.pL.toFixed(3)}), late ${late.display} (${late.pL.toFixed(3)})`);
});

test("LEARN-07: a parent's 'Easy' never starts a class-5 child before the calendar's chapter", { todo: "LEARN-07: main decides the placement change" }, () => {
  const date = new Date("2026-11-09T06:00:00Z");
  const order = topicSequence(5, "maths");
  const calendar = schoolStartIndex(order, getTopic, { classLevel: 5, date });
  for (const parentView of ["easy", "fine"]) {
    const r = coldStartResult({ subject: "maths", classLevel: 5, parentView, date });
    const i = schoolStartIndex(order, getTopic, { classLevel: 5, startGE: r?.startGE, date });
    const ch = (k) => getTopic(order[k]).chapter.number;
    assert.ok(i >= calendar, `${parentView}: chapter ${ch(i)}, the calendar alone gives chapter ${ch(calendar)}`);
  }
});

test("LEARN-10: set-up never shows a raw error message to the parent", { todo: "LEARN-10: main decides the set-up copy" }, () => {
  for (const f of ["ChildProfile.tsx", "Consent.tsx", "Setup.tsx"]) {
    const src = readFileSync(new URL(`../src/onboarding/${f}`, import.meta.url), "utf8");
    assert.doesNotMatch(src, /setErr\(errText\(/, `${f} shows e.message ("Failed to fetch", "internal error")`);
  }
});
