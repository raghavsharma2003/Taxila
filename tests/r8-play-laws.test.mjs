// Round 8: the three laws of every play family (dc-r8-game-modes-three-laws; docs/design/round8/games-judging/RULINGS-2026-11-11.md
// and LAWS-AUDIT.md). The checks themselves live in server/forge3/qa/laws.mjs (the play cert runs them on every level it
// judges); this suite runs them over every (family, mode, goal) the coverage serves and holds:
//   - no break outside KNOWN (each a break listed for main or for the kon stream in LAWS-AUDIT.md, with what it is);
//   - stambh/tally keeps all three laws on every served level;
//   - law 1 in the painter: a selected body and every canvas "you" are drawn in the focus colour, never green;
//   - law 3 in the grade: a mix-up from one pick among a few is at chance weight and unnamed, and the server names it only
//     when it repeats on a level whose surface differs.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const L = await import("../server/forge3/qa/laws.mjs");

/** Breaks still open, by (family/mode) → laws, each listed in LAWS-AUDIT.md (kon: the kon stream's; the rest: main's). */
const KNOWN = {
  // the science families' after-a-miss line states the idea outright (authored lines in data/play/engine-words.json)
  "aakash/chakkar": [2], "aakash/grahan": [2], "aakash/ritu": [2], "badlaav/aag": [2], "bhaap/hawa": [2], "chhaano/sukha": [2],
  "jaanch/neela": [2], "rang/milao": [2], "rang/pehchaan": [2], "yantra/roshni": [2],
  // the run prints each row's count (the key of the next "Kul") after a miss
  "aankde/tally": [2],
  // a check-later miss labels a line ("line 2") that may be the first wrong one
  "galti-pakdo/kaapi": [2],
  // the given route's end value (the key the opened row must reach) is printed after a miss
  "koshtak/tray": [2],
  // the far-stage count shows after a "double" miss (to check: hers or the machine's)
  "kram/grow": [2],
  // kon: none left (round 8 kon round 2: ends' light is green only when solved and ray-two-ends is a chance pick; place/draw's
  // join-wrong-end is a chance pick; measure is typed)
};

describe("r8 play laws: every served level of every family", () => {
  it("no law break outside the listed ones; stambh/tally keeps all three", async () => {
    const rows = await L.lawsOverCoverage({ seeds: 2, perGoal: 1 });
    assert.ok(rows.length > 150, `levels checked: ${rows.length}`);
    const extra = [];
    for (const r of rows) for (const b of r.breaks) if (!(KNOWN[r.key] ?? []).includes(b.law)) extra.push(`${r.key} ${r.goal} ${r.levelId}: L${b.law} ${b.state} ${b.what}`);
    assert.deepEqual(extra, []);
    const tally = rows.filter((r) => r.key === "stambh/tally");
    assert.ok(tally.length >= 2, "tally levels checked");
    for (const r of tally) { assert.deepEqual(r.breaks, [], `${r.levelId}`); assert.ok(r.checked >= 3, `${r.levelId} states checked ${r.checked}`); }
  });
});

describe("r8 play laws: law 1 in the painter", () => {
  it("a selected body and a canvas \"you\" are the focus colour; focus is never the good green nor a quantity hue", async () => {
    const { ART, Painter, newAudit, roleColor, LAW_ROLES } = await import("../src/play/core/styles.ts");
    for (const a of Object.values(ART)) {
      assert.equal(roleColor(a, "you"), a.focus, a.id);
      assert.equal(roleColor(a, "focus"), a.focus, a.id);
      assert.equal(roleColor(a, LAW_ROLES.focus), a.focus); assert.equal(roleColor(a, LAW_ROLES.answer), a.good); assert.equal(roleColor(a, LAW_ROLES.mixup), a.look);
      for (const k of ["good", "q1", "q2", "q3", "q4", "you", "look"]) assert.notEqual(a.focus.toLowerCase(), a[k].toLowerCase(), `${a.id} focus vs ${k}`);
      // the hue of focus is blue-violet (200..300 deg), far from green (90..160)
      const n = parseInt(a.focus.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
      const h = ((mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60 + 360) % 360;
      assert.ok(h >= 200 && h <= 300, `${a.id} focus hue ${h}`);
      const audit = newAudit(a.id, false), P = new Painter(a, audit, false), strokes = [];
      const c = new Proxy({ setLineDash() {}, beginPath() {}, moveTo() {}, lineTo() {}, arcTo() {}, closePath() {}, fill() {}, save() {}, restore() {}, arc() {}, quadraticCurveTo() {},
        stroke() { strokes.push(this.strokeStyle); }, createPattern() { return null; }, createLinearGradient() { return { addColorStop() {} }; } }, { set(o, k, v) { o[k] = v; return true; }, get(o, k) { return o[k]; } });
      P.body(c, 0, 0, 40, 40, { role: "panel", state: "selected" });
      assert.ok(strokes.includes(a.focus), `${a.id}: the selected outline is focus (${strokes.join(",")})`);
      assert.ok(!strokes.includes(a.you) && !strokes.includes(a.good), `${a.id}: no lime, no green on a selection`);
      assert.ok(audit.uses.some((u) => u.op === "body:selected" && u.role === "focus"));
    }
  });
});

describe("r8 play laws: law 3 in the grade and on the server", () => {
  const fam = async () => (await import("../src/play/families/index.ts")).logicFor("todo-jodo", "strips");
  it("a mix-up from one pick among a few: incorrect at chance weight, chanceMis, no misconceptionId", async () => {
    const { CHANCE_WEIGHT } = await import("../shared/play.ts");
    const { coverage } = await import("../server/play/levels.js");
    const { coverageLevels } = await import("../server/forge3/qa/cert-levels.mjs");
    const lg = await fam();
    let seen = 0;
    for (const e of coverage().entries.filter((x) => x.family === "todo-jodo" && x.mode === "strips")) for (const lv of await coverageLevels(e, 2)) {
      for (const mal of Object.keys(lv.mal)) {
        if (!lg.chancePicks.includes(`${lv.goal}:${mal}`)) continue;
        const acts = lg.malActs(lv, mal);
        if (!acts) continue;
        const g = lg.grade(lv, acts.map((act, i) => ({ seq: i + 1, t: i, via: "touch", act })));
        const ev = g.evidence[0];
        if (!ev?.chanceMis) continue;
        assert.equal(ev.outcome, "incorrect"); assert.equal(ev.weight, CHANCE_WEIGHT); assert.equal(ev.misconceptionId, undefined);
        assert.equal(ev.chanceMis, lv.mal[mal]);
        seen++;
      }
    }
    assert.ok(seen >= 1, `chance-pick mix-ups graded: ${seen}`);
  });
  it("nameOnRepeat names a chance-pick mix-up only on a second level whose surface differs; afterLevelBody remembers it", async () => {
    const { nameOnRepeat, afterLevelBody, surfaceOf } = await import("../server/play/levels.js");
    const { GAME_WEIGHT, CHANCE_WEIGHT } = await import("../shared/play.ts");
    const A = { family: "todo-jodo", mode: "strips", levelId: "a", params: { a: 1 } }, B = { family: "todo-jodo", mode: "strips", levelId: "b", params: { a: 2 } };
    assert.notEqual(surfaceOf(A), surfaceOf(B));
    const row = { skillId: "s", outcome: "incorrect", chanceMis: "kit-x", weight: CHANCE_WEIGHT };
    // (an unnamed row leaves without its chanceMis: nothing about a one-pick mix-up reaches the lesson; evening ruling kon/name 3)
    const { chanceMis: _c, ...plain } = row;
    assert.deepEqual(nameOnRepeat([row], {}, A), [plain], "a first sighting is not named");
    const s1 = afterLevelBody({}, { grade: { evidence: [row] }, level: A });
    assert.deepEqual(s1.chance, [{ mis: "kit-x", surface: surfaceOf(A) }]);
    assert.equal(s1.nextFocus, "kit-x", "the next level aims at it");
    assert.deepEqual(nameOnRepeat([row], s1, A), [plain], "the same surface again names nothing");
    const named = nameOnRepeat([row], s1, B)[0];
    assert.equal(named.misconceptionId, "kit-x"); assert.equal(named.weight, GAME_WEIGHT);
    assert.deepEqual(nameOnRepeat([{ ...row, chanceMis: "kit-y" }], s1, B)[0].misconceptionId, undefined, "another mix-up is not named by this one");
  });
});
