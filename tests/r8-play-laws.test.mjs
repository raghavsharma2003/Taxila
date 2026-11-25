// Round 8: the three laws of every play family (dc-r8-game-modes-three-laws; docs/design/round8/games-judging/RULINGS-2026-11-11.md
// and LAWS-AUDIT.md). The checks themselves live in server/forge3/qa/laws.mjs (the play cert runs them on every level it
// judges); this suite runs them over every (family, mode, goal) the coverage serves and holds:
//   - no break outside KNOWN (each a break listed for main or for the kon stream in LAWS-AUDIT.md, with what it is);
//   - stambh/tally keeps all three laws on every served level;
//   - law 1 in the painter: a selected body and every canvas "you" are drawn in the focus colour, never green;
//   - law 3 in the grade: a mix-up from one pick among a few is at chance weight and unnamed, and the server names it only
//     when it repeats on as many levels whose surfaces differ as its blind chance needs (tests/r8-picks-default.test.mjs).
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const L = await import("../server/forge3/qa/laws.mjs");

/** Breaks still open, by (family/mode) → laws, each listed in LAWS-AUDIT.md (kon: the kon stream's; the rest: main's). */
const KNOWN = {
  // the science families: none left (laws ruling 2026-11-15: each miss line says what her act did; the idea is the solved
  // line's; laws.mjs IDEA_WORDS fails a miss line that states it; tests/r8-laws-idea-words.test.mjs)
  // kon: none left (round 8 kon round 2: ends' light is green only when solved and ray-two-ends is a chance pick; place/draw's
  // join-wrong-end is a chance pick; measure is typed)
  // law 4 (dc-r8-gate2-shadow S4; ruling 005): none left (laws.mjs CHECK_WAITS_OPEN is empty; LAWS-AUDIT.md "Law 4")
  ...Object.fromEntries(Object.keys(L.CHECK_WAITS_OPEN).map((k) => [k, [4]])),
};

// Every language the view can show (laws ruling 2026-11-15, late evening 2: "a law that holds in one language only is not
// held"): the same seeds and levels in each, KNOWN empty in each.
for (const lang of ["hinglish", "en", "hi"]) describe(`r8 play laws: every served level of every family (${lang})`, () => {
  it("no law break outside the listed ones; stambh/tally keeps all four", async () => {
    const rows = await L.lawsOverCoverage({ seeds: 2, perGoal: 1, lang });
    assert.ok(rows.length > 150, `levels checked: ${rows.length}`);
    const extra = [];
    for (const r of rows) for (const b of r.breaks) if (!(KNOWN[r.key] ?? []).includes(b.law)) extra.push(`${lang} ${r.key} ${r.goal} ${r.levelId}: L${b.law} ${b.state} ${b.what}`);
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
  it("nameOnRepeat names a chance-pick mix-up only on as many levels as its blind chance needs, surfaces apart; afterLevelBody remembers it", async () => {
    // (rulings 2026-11-16, "the per-session reading" 2: the computed default; a pick whose options cannot be read is taken
    // at one in two, which needs four sightings within the session's first four levels: tests/r8-picks-default.test.mjs)
    const { nameOnRepeat, afterLevelBody, surfaceOf } = await import("../server/play/levels.js");
    const { GAME_WEIGHT, CHANCE_WEIGHT } = await import("../shared/play.ts");
    const lv = (id, a) => ({ family: "todo-jodo", mode: "strips", levelId: id, params: { a } });
    const [A, B, C, D] = [lv("a", 1), lv("b", 2), lv("c", 3), lv("d", 4)];
    assert.notEqual(surfaceOf(A), surfaceOf(B));
    const row = { skillId: "s", outcome: "incorrect", chanceMis: "kit-x", weight: CHANCE_WEIGHT };
    // (an unnamed row leaves without its chanceMis: nothing about a one-pick mix-up reaches the lesson; evening ruling kon/name 3)
    const { chanceMis: _c, ...plain } = row;
    assert.deepEqual(nameOnRepeat([row], {}, A), [plain], "a first sighting is not named");
    const s1 = afterLevelBody({}, { grade: { evidence: [row] }, level: A });
    assert.deepEqual(s1.chance, [{ mis: "kit-x", surface: surfaceOf(A), k: 4 }]);
    assert.equal(s1.nextFocus, "kit-x", "the next level aims at it");
    assert.deepEqual(nameOnRepeat([row], s1, A), [plain], "the same surface again names nothing");
    assert.deepEqual(nameOnRepeat([row], { ...s1, n: 1 }, B), [plain], "a second sighting is not enough at one in two");
    const s3 = afterLevelBody(afterLevelBody(s1, { grade: { evidence: [row] }, level: B }), { grade: { evidence: [row] }, level: C });
    assert.deepEqual(nameOnRepeat([row], { ...s3, n: 3 }, C), [plain], "three sightings, one surface twice: not named");
    const named = nameOnRepeat([row], { ...s3, n: 3 }, D)[0];
    assert.equal(named.misconceptionId, "kit-x"); assert.equal(named.weight, GAME_WEIGHT);
    assert.deepEqual(nameOnRepeat([row], { ...s3, n: 4 }, D), [plain], "past the session's first four levels: named on none");
    assert.deepEqual(nameOnRepeat([{ ...row, chanceMis: "kit-y" }], { ...s3, n: 3 }, D)[0].misconceptionId, undefined, "another mix-up is not named by this one");
  });
});

/**
 * Law 4's open list only shrinks (main's ruling 005, 2026-11-16): CHECK_WAITS_OPEN (the modes the play cert skips law 4 for)
 * is a subset of this pinned list, and a mode taken off it is taken off here too, so it cannot come back.
 */
const CHECK_WAITS_MAX = [
  // empty (claude/r8-law4-open, 2026-11-16): the 20 pinned at S4 (todo-jodo/strips, nishana/place, kyun-lab/dhruv, kon/place,
  // rang/milao, todo-jodo/atoms, nazariya/floor, nazariya/powers, taraazu/equality, aakash/chakkar, aakash/ritu, badlaav/aag,
  // badlaav/palat, bhaap/chakra, bhaap/hawa, chhaano/geela, chhaano/sukha, jaanch/daag, jaanch/neela, rang/pehchaan) are fixed;
  // law 4 holds in every mode and nothing may be opened again
];

describe("r8 play laws: law 4, the check waits after a miss (dc-r8-gate2-shadow S4)", () => {
  it("the open list only shrinks: CHECK_WAITS_OPEN is within the pinned list (now empty)", () => {
    assert.deepEqual(Object.keys(L.CHECK_WAITS_OPEN), [], "law 4 holds in every mode");
    const grown = Object.keys(L.CHECK_WAITS_OPEN).filter((k) => !CHECK_WAITS_MAX.includes(k));
    assert.deepEqual(grown, [], "a mode added to CHECK_WAITS_OPEN: law 4's open list only shrinks");
  });
  it("a sighting is a level's first check only: a pick after a miss on the same level carries no chanceMis (gradeLevel)", async () => {
    const { gradeLevel, firstCheckSeq } = await import("../src/play/core/replay.ts");
    const { CHANCE_WEIGHT } = await import("../shared/play.ts");
    // a one-pick goal: "miss" is a plain law_refused (not decisive), "pick" the mix-up's signature, "ok" a solve
    const logic = { chancePicks: ["g"], init: () => ({ done: false }), goalMet: (_l, s) => s.done, facts: () => ({}),
      apply(_l, s, a, seq) {
        if (a.kind === "miss") return { state: s, moments: [{ kind: "law_refused", seq, facts: {} }], refused: "look_again" };
        if (a.kind === "pick") return { state: s, moments: [{ kind: "misconception_consequence", seq, facts: {}, misconceptionId: "m" }], refused: "wrong" };
        return { state: { done: true }, moments: [{ kind: "solved", seq, facts: {} }] };
      } };
    const level = { levelId: "x", skillId: "s", goal: "g", mal: { m: "kit-m" }, proof: { discriminates: [] } };
    const env = (as) => as.map((kind, i) => ({ seq: i + 1, t: i, via: "touch", act: { kind } }));
    const first = gradeLevel(logic, level, env(["pick", "ok"])).evidence[0];
    assert.equal(first.chanceMis, "kit-m", "the level's first check is a sighting");
    const after = gradeLevel(logic, level, env(["miss", "pick", "ok"])).evidence[0];
    assert.equal(after.chanceMis, undefined, "a pick after a miss is no sighting");
    assert.equal(after.weight, CHANCE_WEIGHT); assert.equal(after.outcome, "incorrect");
    assert.equal(firstCheckSeq({ moments: [{ kind: "progress", seq: 1 }, { kind: "law_refused", seq: 2 }], refusals: [] }), 2);
    assert.equal(firstCheckSeq({ moments: [], refusals: [{ seq: 3, code: "missed" }] }), 3);
    assert.equal(firstCheckSeq({ moments: [{ kind: "progress", seq: 1 }], refusals: [{ seq: 1, code: "bad_act" }] }), Infinity);
  });
  it("law 4's forms in the logic: a pick that missed is greyed, a typed number refused unchanged, an experiment repeat a look", async () => {
    const forms = new Map();
    const { coverage } = await import("../server/play/levels.js");
    const { coverageLevels } = await import("../server/forge3/qa/cert-levels.mjs");
    const want = { "todo-jodo/strips": "off", "kon/place": "off", "nazariya/powers": "refused", "aakash/chakkar": "look", "rang/pehchaan": "look", "badlaav/palat": "look" };
    for (const e of coverage().entries.filter((x) => want[`${x.family}/${x.mode}`])) for (const lv of await coverageLevels(e, 1)) {
      for (const f of await L.law4Forms(lv, {})) { assert.equal(f.break, undefined, `${lv.levelId} ${f.mal}: ${f.break}`); (forms.get(`${e.family}/${e.mode}`) ?? forms.set(`${e.family}/${e.mode}`, new Set()).get(`${e.family}/${e.mode}`)).add(f.form); }
    }
    for (const [k, form] of Object.entries(want)) assert.ok(forms.get(k)?.has(form), `${k}: ${[...(forms.get(k) ?? [])].join(",")}`);
  });
  it("the play cert skips law 4 for an open mode only", async () => {
    const src = (await import("node:fs")).readFileSync(new URL("../server/forge3/play-cert.js", import.meta.url), "utf8");
    assert.match(src, /CHECK_WAITS_OPEN\[`\$\{level\.family\}\/\$\{level\.mode\}`\]/);
    assert.match(src, /b\.law !== 4/);
  });
  it("the check button of stambh/bars, kon/zone and nazariya/tri is off after a miss, and not her move", async () => {
    const { coverage } = await import("../server/play/levels.js");
    const { coverageLevels } = await import("../server/forge3/qa/cert-levels.mjs");
    let seen = 0;
    for (const e of coverage().entries.filter((x) => ["stambh/bars", "kon/zone", "nazariya/tri"].includes(`${x.family}/${x.mode}`))) for (const lv of await coverageLevels(e, 1)) {
      for (const mal of Object.keys(lv.mal ?? {})) {
        const m = await L._mount(lv, {});
        const acts = m.logic.malActs(lv, mal);
        if (!acts?.length) continue;
        let missAt = -1;
        for (let i = 0; i < acts.length && missAt < 0; i++) { const r = m.ctl.dispatch(acts[i]); if (r.refused === "missed" || r.moments.some((x) => ["misconception_consequence", "near_miss", "law_refused"].includes(x.kind))) missAt = i; }
        if (missAt < 0 || m.logic.goalMet(lv, m.ctl.state)) continue;
        m.look();
        const check = m.view.controls().find((c) => c.kind === "primary" && c.group === "go");
        assert.ok(check, `${lv.levelId} ${mal}: a check control`);
        assert.equal(check.disabled, true, `${lv.levelId} ${mal}: ${check.id} waits after the miss`);
        assert.ok(!check.you, `${lv.levelId} ${mal}: a waiting check is not her move`);
        seen++;
      }
    }
    assert.ok(seen >= 3, `misses checked: ${seen}`);
  });
  it("missWait: waits after a miss on the same answer; once her answer changes it does not", async () => {
    const { missWait } = await import("../src/play/core/viewkit.ts");
    const { coverage } = await import("../server/play/levels.js");
    const { coverageLevels } = await import("../server/forge3/qa/cert-levels.mjs");
    const e = coverage().entries.find((x) => x.family === "stambh" && x.mode === "bars");
    let seen = 0;
    for (const lv of await coverageLevels(e, 2)) for (const mal of Object.keys(lv.mal ?? {})) {
      const m = await L._mount(lv, {}), w = missWait(m.ctl), acts = m.logic.malActs(lv, mal);
      if (!acts?.length) continue;
      let missed = false;
      for (const a of acts) { if (missed) break; const r = m.ctl.dispatch(a); w.saw(r.moments, r.refused); missed = r.refused === "missed" || r.moments.some((x) => ["misconception_consequence", "near_miss", "law_refused"].includes(x.kind)); }
      if (!missed || m.logic.goalMet(lv, m.ctl.state)) continue;
      assert.equal(w.waits({ kind: "check" }), true, `${lv.levelId} ${mal}: waits`);
      const before = JSON.stringify(m.ctl.state);
      for (const a of m.logic.solve(lv) ?? []) { const r = m.ctl.dispatch(a); w.saw(r.moments, r.refused); if (JSON.stringify(m.ctl.state) !== before) break; }
      assert.equal(w.waits({ kind: "check" }), false, `${lv.levelId} ${mal}: her answer changed, the check is hers again`);
      seen++;
    }
    assert.ok(seen >= 1, `misses checked: ${seen}`);
  });
});
