// dc-r7-script-walk-v6-10 (main's director18 judgement): each fix pinned on director18's own rows (0-based rows of the run's .json),
// walked live (tests/fixtures/walk.mjs: turn.js planTurn and textReply on the run's own scripts, her live lines in the history).
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { walk } from "./fixtures/walk.mjs";
import { rowsOf } from "./fixtures/replay.mjs";
import { pictureRowFlag, pictureTruth } from "../server/brain/picture.js";
import { T2 } from "./fixtures/t2-predicates.mjs";
import { REQUEST_TABLE } from "../server/director/requestTable.js";

const RUN = "2026-11-10-director18";
const T = { c4: "c4-maths-ch05-t01", "c5-t01": "c5-maths-ch02-t01", "c5-t02": "c5-maths-ch02-t02", c6: "c6-maths-ch06-t01" };
const TWIN_LIST = JSON.parse(readFileSync(new URL("../data/lesson-twins.json", import.meta.url), "utf8")).twins;
const twinless = (t) => TWIN_LIST.reduce((x, p, i) => x.replace(new RegExp(`(?<![\\p{L}])(?:${[...p.en, ...p.hi].sort((a, b) => b.length - a.length).join("|")})(?![\\p{L}])`, "giu"), `#${i}`), String(t));
const NO_PIC = /doosri tasveer|alag chitra|second picture|another picture/i;

describe("r7-brain-v610.test.mjs", () => {
  // P6: a picture turn is one take — the drawing, the view and her line together; with no view, no picture line
  describe("P6: one call for a picture turn", () => {
    const BAD = [["steady", "c4", 18], ["steady", "c5-t01", 18], ["offtopic", "c5-t01", 28], ["steering", "c5-t01", 14], ["stuck", "c5-t02", 18],
      ["offtopic", "c5-t02", 26], ["steering", "c5-t02", 14], ["steady", "c6", 18], ["offtopic", "c6", 26]];
    const GOOD = [["offtopic", "c4", 26], ["steady", "c5-t02", 18], ["steering", "c4", 14], ["steering", "c6", 14], ["stuck", "c5-t01", 18], ["stuck", "c6", 18]];
    test("the predicate flags director18's 9 rows and none of its drawn picture rows", () => {
      for (const [p, t, n] of BAD) assert.ok(pictureRowFlag(rowsOf(RUN, p, T[t])[n]), `${p} ${t} ${n}`);
      for (const [p, t, n] of GOOD) assert.equal(pictureRowFlag(rowsOf(RUN, p, T[t])[n]), null, `${p} ${t} ${n}`);
    });
    test("the predicate throws in tests on a picture line with no view", (t) => {
      // pictureTruth is strict only under the test runner (NODE_TEST_CONTEXT, set by `node --test` for its child processes
      // but NOT in-process under --experimental-test-isolation=none, which scripts/test-leak-check.mjs uses): declare it here.
      const had = process.env.NODE_TEST_CONTEXT;
      process.env.NODE_TEST_CONTEXT ??= "v610-strict";
      t.after(() => { if (had === undefined) delete process.env.NODE_TEST_CONTEXT; });
      assert.throws(() => pictureTruth([{ part: "alt" }, { part: "card" }], { view: null, layout: { split: false } }), /P6/);
      assert.equal(pictureTruth([{ part: "alt" }], { view: "parts" }), null);
      assert.equal(pictureTruth([{ part: "body" }], { view: null }), null);
    });
    for (const [p, t, n] of BAD) test(`${p} ${t} ${n}: the line is the take's; a view said is a view drawn`, async () => {
      const x = (await walk(p, t, n + 1, { run: RUN })).find((y) => y.n === n);
      assert.ok(x, "the picture turn was walked");
      const parts = x.out.guard?.parts?.list ?? [];
      assert.doesNotThrow(() => pictureTruth(parts, { view: x.pic?.view ?? null, layout: x.hb?.layout ?? null }));
      if (x.pic?.view) {
        assert.ok(x.hb?.layout?.split, `drawn beside: ${JSON.stringify(x.hb?.layout)}`);
        assert.equal(x.hb?.altView ?? x.hb?.layout?.panels?.[1]?.view, x.pic.view, "the draw is the decision");
        // (v6.11: the turn's one word of a twin pair — data/lesson-twins.json, the card's word winning — may differ from the take's)
        assert.ok(twinless(x.out.reply).startsWith(twinless(x.pic.line).slice(0, 20)), x.out.reply);
      } else {
        assert.ok(!parts.some((q) => q.part === "alt"), x.out.reply);
        assert.match(x.out.reply, NO_PIC);
      }
    });
  });

  // T2, A6, R7: each director18 row its predicate flags in the record, and the live walk no longer does
  const ROWS = {
    clarifyAtCheckin: [["steering", "c4", 6], ["steering", "c5-t01", 6]],
    parkNoCard: [["stuck", "c4", 34], ["offtopic", "c4", 20], ["steering", "c5-t02", 24], ["offtopic", "c6", 32]],
    hindiPromise: [["steady", "c5-t02", 38]],
    asideAfterStep: [["offtopic", "c6", 18]],
    // (stuck c5-t02 50 retired, dc-r8-director20 G3: from row 30 the walk gives a spent card's key on the give-up, so the recorded child
    // lines answer other cards by row 50 — a replay is a pin, not proof)
    resumeDropped: [["offtopic", "c5-t02", 10], ["offtopic", "c6", 10]],
    alreadySaidKey: [["offtopic", "c5-t01", 24], ["steady", "c5-t01", 50], ["stuck", "c5-t01", 60]],
    tryFirstNoCard: [["offtopic", "c5-t01", 38]],
    kuchPoochna: [["stuck", "c5-t02", 54]],
    asideAck: [["offtopic", "c5-t02", 10], ["offtopic", "c6", 10]],
    gaveStacked: [["stuck", "c5-t01", 60], ["steady", "c5-t02", 48], ["steering", "c6", 22]],
    openers: [["offtopic", "c6", 18], ["steady", "c4", 38], ["offtopic", "c4", 38], ["stuck", "c4", 44]],
    wording: [["steering", "c6", 22]],
  };
  const liveRow = (x) => ({ text: x.out.reply, card: x.out.guard?.cardHeld ? null : x.pl.p.r.ui?.ask?.text ?? null,
    beat: x.pl.state.lastMove?.scriptBeat ? `${x.pl.state.lastMove.scriptBeat.skillId}:${x.pl.state.lastMove.scriptBeat.kind}:${x.pl.state.lastMove.scriptBeat.beatId}` : null });
  describe("T2 / A6 / R7: director18's rows, flagged in the record, not in the live walk", () => {
    for (const [name, rows] of Object.entries(ROWS)) for (const [p, t, n] of rows) test(`${name}: ${p} ${t} ${n}`, async () => {
      const rec = rowsOf(RUN, p, T[t]);
      const prevRec = [...rec.slice(0, n)].reverse().find((r) => r.who === "teacher");
      assert.ok(T2[name](rec[n], rec[n - 1]?.text ?? "", prevRec), `the predicate flags the recorded row: ${rec[n].text.slice(0, 100)}`);
      const ts = await walk(p, t, n + 1, { run: RUN });
      const i = ts.findIndex((y) => y.n === n);
      assert.ok(i >= 0, "walked");
      const x = ts[i], prev = i > 0 ? liveRow(ts[i - 1]) : null;
      assert.equal(T2[name](liveRow(x), x.pl.child, prev), null, x.out.reply);
    });
    test("every director18 row of the table's T2 rows is replayed here", () => {
      const named = new Set(Object.values(ROWS).flat().map(([p, t, n]) => `director18 ${p} ${t} ${n}`));
      const missing = REQUEST_TABLE.filter((r) => r.id.startsWith("T2.")).flatMap((r) => r.rows).filter((x) => !named.has(x) && !/c4 44|c4 32|c6 8|c5-t02 56|stuck c5-t02 50/.test(x));
      assert.deepEqual(missing, []);
    });
    // (a sweep of the 16 live lessons for the rules that hold on every turn)
    test("A6, T2.9, R7: no acknowledgement, no 'Kuch poochna hai', no Hindi promise, openers and wording — 16 lessons walked live", async () => {
      const bad = [];
      for (const t of Object.keys(T)) for (const p of ["steady", "stuck", "offtopic", "steering"]) {
        const ts = await walk(p, t, 200, { run: RUN });
        ts.forEach((x, i) => { for (const k of ["asideAck", "kuchPoochna", "hindiPromise", "openers", "wording", "alreadySaidKey", "parkNoCard"]) {
          const r = T2[k](liveRow(x), x.pl.child, i > 0 ? liveRow(ts[i - 1]) : null); if (r) bad.push(`${p} ${t} ${x.n} ${k}: ${x.out.reply.slice(0, 90)}`); } });
      }
      assert.deepEqual(bad, []);
    });
  });
  // T2.5: a language or clarify request never spends a card's help — the miss after it gets help, not the key
  describe("T2.5: a request never spends help", () => {
    for (const [p, t, n] of [["offtopic", "c4", 34], ["stuck", "c6", 8]]) test(`${p} ${t} ${n}: no key for a card whose help only a request heard`, async () => {
      const x = (await walk(p, t, n + 1, { run: RUN })).find((y) => y.n === n);
      assert.ok(!x.pl.state.lastMove?.gave?.answer, x.out.reply);
    });
  });

  // Joints (Learning D13, 021-authored-joints): the script's own forms are said — the park, the return with what the child said, the
  // Hindi switch (never an "ab se" promise) and the ask-again; code's fixed sentences only for a topic without a script
  test("joints: the authored forms, slots filled, three or more each; no 'ab se' switch", async () => {
    const { jointOf } = await import("../server/director/script.js");
    const { returnQuestion, parkAckOf } = await import("../server/brain/say.js");
    const { kitFromFile } = await import("../server/content/kits.js");
    const { getTopic } = await import("../server/content/curriculum.js");
    const kit = kitFromFile(getTopic(T.c4));
    for (const k of ["asidePark", "asideReturn", "hindiSwitch", "askAgain"]) assert.ok((jointOf(kit, k, "hinglish", { aside: "cricket", said: "sixer maara" }) ?? []).length >= 2, k);
    assert.ok(!(jointOf(kit, "hindiSwitch", "hinglish") ?? []).some((x) => /ab se/i.test(x)));
    const r = returnQuestion("cricket", "hinglish", { turn: 3, seed: 1, recent: [] }, { said: "kal maine cricket khela, sixer maara", kit });
    // (v6.11 G2/J2 and Learning D14.1, main on director19: {said} forms put the child's own words in her mouth — the return is one
    // question on the aside's topic, never the child's sentence, with no slot left unfilled)
    assert.match(r, /cricket/i, r);
    assert.doesNotMatch(r, /maine|sixer maara|\{/i, r);
    assert.match(r.trim(), /\?$/, r);
    const park = parkAckOf({ turn: 3, recent: [] }, "hinglish", kit).map((f) => f("cricket"));
    assert.ok(park.length >= 3 && park.every((x) => /cricket/i.test(x) && !/\{/.test(x)), JSON.stringify(park));
  });

  // Main's ruling with Learning's script-card evidence (to-main 001, live in tests/r7-learner-evidence.test.mjs 2b-2d): a script card
  // answered right in this lesson, with or without help, is never posed again in it — on director18's 16 lessons walked live
  test("a script card answered right is not posed again in the lesson (16 lessons walked live)", async () => {
    const bad = [];
    for (const t of Object.keys(T)) for (const p of ["steady", "stuck", "offtopic", "steering"]) {
      const ts = await walk(p, t, 200, { run: RUN });
      const right = new Set();
      for (const x of ts) {
        const id = x.pl.p.r.ui?.ask?.itemId;
        if (id && right.has(id) && !x.pl.state.lastMove?.request) bad.push(`${p} ${t} ${x.n}: ${id} posed again | ${x.out.reply.slice(0, 80)}`);
        for (const r of x.pl.state.rightCards ?? []) right.add(r);
      }
      if (ts.at(-1)?.pl.state.rightRepose) bad.push(`${p} ${t}: rightRepose ${ts.at(-1).pl.state.rightRepose}`);
    }
    assert.deepEqual(bad, []);
  });
});
