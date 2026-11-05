// Round 7 F (dc-r7-teaching-scripts): the pilot lesson scripts in data/lesson-scripts/ hold to their kit and to the
// authoring rules: every kit skill in kit order, real kit misconceptions and items, boards inside the template ranges (c5
// on a fraction number line only), a full worked example with no faded blanks, no check that prints its own key, and
// remediation that never falls back to counting. Keys were blind-solved by a separate Claude agent (measurement
// ms-r7-pilot-scripts-blind); this test keeps the structure honest as the scripts change.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const DIR = new URL("../data/lesson-scripts/", import.meta.url);
const files = readdirSync(DIR).filter((f) => f.endsWith(".json"));
const kitTopic = (topicId) => JSON.parse(readFileSync(new URL(`../data/kits/${topicId.split("-").slice(0, 2).join("-")}.json`, import.meta.url), "utf8"))
  .topics.find((t) => t.topicId === topicId);

const RANGE = {
  "fraction-parts@1": (p) => p.parts >= 2 && p.parts <= 12 && p.shade >= 0 && p.shade <= p.parts,
  "fraction-of@1": (p) => p.b >= 2 && p.b <= 6 && p.d >= 2 && p.d <= 6 && p.a >= 1 && p.a <= p.b && p.c >= 1 && p.c <= p.d,
  "equal-groups@1": (p) => p.groups >= 2 && p.groups <= 6 && p.each >= 1 && p.each <= 8,
  "compare@1": (p) => p.left?.items?.length >= 1 && p.right?.items?.length >= 1,
  "measured@1": (p) => ["m", "cm"].includes(p.unit) && ["rect", "square", "triangle", "circle"].includes(p.shape),
  "shape@1": (p) => typeof p.shape === "string",
  // Studio's board (C1, 2026-11-05): marks label points and hop draws the solved jumps (explain, worked, remediation);
  // a CHECK board uses mark k ("?" on a named mark) or target [a, den] (the asked fraction written, not placed), never both
  "fraction-line@1": (p) => {
    const inLine = (n) => Number.isInteger(n) && n >= 0 && n <= p.den * p.to;
    return p.den >= 2 && p.den <= 12 && [1, 2, 3].includes(p.to) && (p.marks ?? []).every((m) => inLine(m.num))
      && (p.hop === undefined || inLine(p.hop.num)) && (p.mark === undefined || inLine(p.mark)) && !(p.mark !== undefined && p.target !== undefined)
      && (p.target === undefined || (Array.isArray(p.target) && p.target[1] === p.den && inLine(p.target[0])));
  },
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
/** The prompt prints the key as a word (a two-way choice "X or Y" and yes/no keys are not a leak). */
function leaks(prompt, key) {
  const p = String(prompt).toLowerCase(), k = String(key).toLowerCase().trim();
  if (k.length < 2 || /^(yes|no)$/.test(k)) return false;
  if (new RegExp(`(^|[^\\w/])${esc(k)}\\s+or\\s|\\sor\\s+${esc(k)}([^\\w/]|$)`).test(p)) return false;
  return new RegExp(`(^|[^\\w/])${esc(k)}([^\\w/]|$)`).test(p);
}

test("there are the three pilot scripts", () => {
  assert.deepEqual(files.sort(), ["c4-maths-ch05-t01.json", "c5-maths-ch02-t01.json", "c6-maths-ch06-t01.json"]);
});

for (const f of files) {
  const s = JSON.parse(readFileSync(new URL(f, DIR), "utf8"));
  const kit = kitTopic(s.topicId);
  test(`${s.topicId}: kit skills, misconceptions and items are real; boards in range; checks keyed, never leaked`, () => {
    assert.ok(kit, "kit topic");
    assert.deepEqual(s.skills.map((k) => k.skillId), kit.skills.map((k) => k.id));
    const mis = new Set(kit.misconceptions.map((m) => m.id)), items = new Set(kit.items.map((i) => i.id));
    const boards = [];
    for (const k of s.skills) {
      assert.ok(k.hook?.convey && k.hook.interestSlots?.length, `${k.skillId} hook`);
      assert.ok(k.explain.length >= 2, `${k.skillId} explain beats`);
      for (const e of k.explain) { assert.ok(e.board && e.point, `${k.skillId}/${e.id} board + point`); boards.push(e.board); }
      const we = k.workedExample;
      assert.ok(we.problem && we.givens?.length && we.steps.length >= 2 && we.answer && we.why, `${k.skillId} worked example complete`);
      assert.ok(!/_{2,}/.test(JSON.stringify(we)), `${k.skillId} worked example has no faded blanks`);
      boards.push(we.board);
      assert.ok(k.checks.length >= 2 && k.checks.length <= 3, `${k.skillId} 2-3 checks`);
      for (const c of k.checks) {
        assert.ok(mis.has(c.targets), `${k.skillId}/${c.id} targets a kit misconception`);
        assert.ok(c.key && c.wrongIfMis && c.wrongIfMis !== c.key, `${k.skillId}/${c.id} key and the misconception's answer`);
        assert.ok(!leaks(c.prompt, c.key), `${k.skillId}/${c.id} prompt prints its key`);
        if (c.board) {
          boards.push(c.board);
          const p = c.board.params ?? {};
          if (c.board.template === "fraction-line@1") assert.ok(!p.hop && !(p.marks ?? []).length && (p.mark !== undefined || p.target), `${k.skillId}/${c.id} a check line asks (mark/target), never shows`);
        }
      }
      assert.ok(k.ladder.length >= 3, `${k.skillId} ladder`);
      for (const r of k.ladder) assert.ok(items.has(r.itemId), `${k.skillId} ladder ${r.itemId} is a kit item`);
      for (const r of k.remediation) {
        assert.ok(mis.has(r.targets) && r.move && r.then && r.thenKey, `${k.skillId} remediation ${r.targets}`);
        assert.ok(!/\bcount (them|the (pieces|parts|squares|units))\b/i.test(r.move), `${k.skillId} remediation never falls back to counting`);
        if (r.board) boards.push(r.board);
      }
    }
    assert.equal(s.skills.at(-1).bridgeToNext ?? null, null);
    for (const b of boards) {
      assert.ok(RANGE[b.template]?.(b.params ?? {}), `${b.template} ${JSON.stringify(b.params)}`);
      if (s.classLevel === 5) assert.equal(b.template, "fraction-line@1", "c5 is on the number line");
    }
    const checked = new Set(s.skills.flatMap((k) => k.checks.map((c) => c.targets)));
    assert.equal(checked.size, mis.size, "every kit misconception is checked somewhere");
  });
}

// Studio's full whiteboard gate (certifyBoardRef's W-checks, server/forge/explainer/board-ref.js) on every board, against a
// stand-in for what she will say over it: an explain beat's `point`, the worked example's problem + step results + answer,
// a check's prompt (its key and accepted forms withheld: W9), a remediation's move. W6 (timing) is judged against the
// stand-in's length, which is not her line; Studio re-times and re-gates every board against her real line at turn time,
// so W6 (and W19 when only W6 fails at the end state) is left to that gate. Every other W-check must pass here.
test("every board passes Studio's whiteboard gate (W6 timing is judged at turn time against her real line)", async () => {
  const [{ resolveBoardRef }, { expand }, { gateWhiteboard }, { retimeToLine }] = await Promise.all([
    import("../server/forge/explainer/board-ref.js"), import("../server/forge/explainer/templates.js"),
    import("../server/studio/qa/whiteboard.js"), import("../server/stagecraft/board-sync.js")]);
  const failed = [];
  for (const f of files) {
    const s = JSON.parse(readFileSync(new URL(f, DIR), "utf8"));
    const kit = kitTopic(s.topicId);
    for (const k of s.skills) {
      const we = k.workedExample;
      const beats = [...k.explain.map((e) => [e.id, e.board, e.point, null]), ["we", we.board, [we.problem, ...we.steps.map((x) => x.result), we.answer].join(" "), null],
        ...k.checks.map((c) => [c.id, c.board, c.prompt, { values: [c.key, ...(c.accept ?? [])] }]), ...k.remediation.map((r, i) => [`rem${i + 1}`, r.board, r.move, null])];
      for (const [id, board, line, withhold] of beats) {
        if (!board) continue;
        const r = resolveBoardRef(board, { kit });
        if (!r.ok) { failed.push(`${k.skillId}/${id}: ${r.why}`); continue; }
        const text = String(line);
        const g = gateWhiteboard(retimeToLine(expand(r.call).script, text), { reply: text, speechMs: Math.max(1500, text.split(/\s+/).length * 400), withhold: withhold ?? { values: [] }, kit });
        const bad = g.checks.filter((c) => !c.pass && c.id !== "W6.timing" && !(c.id === "W19.settled" && c.detail?.every?.((d) => d === "W6.timing")));
        if (bad.length) failed.push(`${k.skillId}/${id}: ${bad.map((c) => `${c.id} ${JSON.stringify(c.detail)}`).join(" | ")}`);
      }
    }
  }
  assert.deepEqual(failed, []);
});

test("Brain's runtime validator walks every skill of every script (server/director/script.js)", async () => {
  const { validateTopicScript } = await import("../server/director/script.js");
  for (const f of files) {
    const s = JSON.parse(readFileSync(new URL(f, DIR), "utf8"));
    const r = validateTopicScript(s, kitTopic(s.topicId));
    assert.deepEqual(r.errors, [], s.topicId);
    assert.equal(r.ok.length, s.skills.length, `${s.topicId} walkable skills`);
  }
});
