// r7 Games, Galti Pakdo · a classmate's working of a simple equation (c7-maths-ch15-t03): the claim weighed in a line on the
// taraazu, the first wrong line caught, its fix taken from three offers, or "sab sahi"; nothing ever runs on a clock.
// Pure law checks: every generated level validates, its solver solves it, no idea-free act list wins (shortcut null); an
// INDEPENDENT checker (plain JS on the line TEXT the child sees: it evaluates each side as arithmetic, finds where each
// line's two sides meet, and puts the claim into the question; none of the law's helpers) agrees with the law on which line
// breaks first, what the claim is and whether it balances the question; each mal-rule's acts land on its OWN misconception
// moment; every working has at most one step bug and it is one of the topic's own; the kinds come a third each; the first
// level differs from child to child; tampered params are refused; a claim in an act never decides; the generator is fast
// (CPU time); and every coverage entry serves a proven level through the play server.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { galtiLogic, GALTI_MAL, BUG_OF, BUGS, workingOf, lineText, laterLine, PLAN } from "../src/play/families/galti-pakdo/galti.logic.ts";
import { coverage, entryKey, levelsFor, currentLevel, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { playActOf } from "../server/director/play-verbs.js";
import { CHANCE_WEIGHT, GAME_WEIGHT, FAMILIES, MODES, FAMILY_ARTS, sanitizeActs } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";
import { pickLevels } from "../src/play/core/pick.ts";
import { counted } from "./_work.mjs";

const ROOT = new URL("../", import.meta.url).pathname;
const L = galtiLogic;
const ALL = Object.fromEntries(GALTI_MAL.map((m) => [m, `k-${m}`]));
const req = (goal, seed, o = {}) => ({ family: "galti-pakdo", mode: "kaapi", goal, topicId: "t", skillId: "t-s1", classLevel: 7, fade: 1, mis: {}, misMap: ALL, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = L.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = L.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const levelsOf = (goal, kind, seeds = [1, 7, 42, 99]) => {
  const out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) for (const c of L.generate(req(goal, seed, { fade, grammar: { kind } }))) out.push(c);
  return out;
};

// ───────────────────────────── THE INDEPENDENT CHECKER (reads only the text on the page) ─────────────────────────────
/** a side as written ("3x + 5", "2(x + 4)", "x ÷ 3 + 2", "−4") → its value at x, by plain arithmetic */
function sideAt(text, x) {
  const js = text.replace(/−/g, "-").replace(/÷/g, "/").replace(/×/g, "*").replace(/(\d)\s*x/g, "$1*x").replace(/(\d)\s*\(/g, "$1*(");
  assert.match(js, /^[0-9x+\-*/(). ]+$/, `unexpected text ${text}`);
  return Function("x", `"use strict"; return (${js});`)(x);
}
/** where a line's two sides meet (each side is a straight line in x: two values fix it) */
function meet(line) {
  const [l, r] = line.split(" = ");
  const f = (x) => sideAt(l, x) - sideAt(r, x), f0 = f(0), f1 = f(1);
  return f1 === f0 ? NaN : -f0 / (f1 - f0);
}
const near = (a, b) => Math.abs(a - b) < 1e-9;
/** the checker's reading of a working: the first line whose sides meet somewhere else than the line above's, the claim,
 *  and whether the claim balances the question */
function readWorking(texts) {
  let first = 0;
  for (let j = 1; j < texts.length; j++) if (!near(meet(texts[j]), meet(texts[j - 1]))) { first = j; break; }
  const last = texts[texts.length - 1], m = /^x = (\d+)$/.exec(last);
  assert.ok(m, `the working ends on x = n: ${last}`);
  const v = Number(m[1]), [ql, qr] = texts[0].split(" = ");
  return { first, v, balances: near(sideAt(ql, v), sideAt(qr, v)) };
}

test("galti-pakdo: the family is registered (FAMILIES, MODES, arts, logic, a verb that never chooses)", () => {
  assert.ok(FAMILIES.includes("galti-pakdo"));
  assert.deepEqual([...MODES["galti-pakdo"]], ["kaapi"]);
  assert.equal(FAMILY_ARTS["galti-pakdo"].length, 4);
  assert.equal(LOGIC["galti-pakdo/kaapi"], galtiLogic);
  const v = playActOf("galti-pakdo", "kaapi");
  assert.ok(v && v.hi && v.en && v.act !== "choose");
  assert.doesNotMatch(`${v.hi} ${v.en}`, /\b(chuniye|choose|pick)\b/i);
});

for (const goal of ["pakdo", "sudhaaro"]) for (const kind of ["sahi", "lucky", "neat"]) {
  test(`galti-pakdo ${goal}/${kind}: every level validates, solves, is shortcut-free; the checker agrees; mal-rules land on their own misconception`, () => {
    const cands = levelsOf(goal, kind), seen = new Set();
    assert.ok(cands.length > 60, `only ${cands.length} candidates`);
    for (const c of cands) {
      const level = L.validate(c.level);
      assert.ok(level, c.signature);
      const p = level.params;
      assert.equal(p.kind, kind); assert.equal(p.goal, goal);
      assert.equal(L.shortcut(level), null, `${c.signature} shortcut`);
      // the checker reads the friend's working as text
      const w = workingOf(p), texts = w.lines.map(lineText), r = readWorking(texts);
      assert.equal(r.first, p.at, `${c.signature}: the first line that breaks (checker ${r.first})`);
      assert.equal(r.balances, kind !== "neat", `${c.signature}: the claim x = ${r.v} in the question`);
      assert.ok(texts.length >= 3 && texts.length <= 4, `${c.signature}: ${texts.length} lines`);
      // one step bug at most, one of the topic's own
      if (kind === "sahi") assert.equal(p.bug, ""); else assert.ok(BUGS.includes(BUG_OF[p.bug]), p.bug);
      // the solver's acts solve it cleanly
      const sol = L.solve(level), done = run(level, sol);
      assert.ok(done.s.done && done.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      assert.deepEqual(done.refused, [], `${c.signature} solver refused`);
      const g = L.grade(level, env(sol));
      assert.equal(g.verdict, "solved"); assert.ok(g.clean);
      // sudhaaro: three offers; only the law's line brings the claim back to the question's own x
      if (goal === "sudhaaro" && kind !== "sahi") {
        assert.equal(p.fixes.length, 3); assert.equal(p.fixes.filter((f) => f === "ok").length, 1);
        const shown = new Set();
        p.fixes.forEach((f) => {
          const fw = workingOf(p, f).lines.map(lineText);
          assert.deepEqual(fw.slice(0, p.at), texts.slice(0, p.at), "the lines above the mended one stay");
          assert.notEqual(fw[p.at], texts[p.at], "an offer is never the friend's own line");
          shown.add(fw[p.at]);
          const fr = readWorking(fw);
          assert.equal(fr.first, f === "ok" ? 0 : p.at, `${c.signature} offer ${f}`);
          assert.equal(fr.balances, f === "ok", `${c.signature} offer ${f} weighed in the question`);
        });
        assert.equal(shown.size, 3, "three different lines");
      } else assert.deepEqual(p.fixes, []);
      for (const mal of GALTI_MAL) {
        const acts = L.malActs(level, mal);
        if (!acts) continue;
        seen.add(mal);
        const m = run(level, acts);
        assert.ok(!m.s.done, `${c.signature} ${mal} must not solve`);
        const mc = m.ms.filter((x) => x.kind === "misconception_consequence");
        assert.equal(mc.length, 1, `${c.signature} ${mal}`); assert.equal(mc[0].misconceptionId, mal);
        const mg = L.grade(level, env(acts));
        assert.equal(mg.evidence[0].outcome, "incorrect"); assert.equal(mg.evidence[0].misconceptionId, `k-${mal}`);
      }
    }
    const want = { sahi: [], lucky: ["right-answer"], neat: ["neat-correct", "check-later"] }[kind];
    assert.deepEqual([...seen].sort(), [...want].sort(), `${goal}/${kind}: mal-rules shown`);
  });
}

test("galti-pakdo: the friend's step bugs are all five of the topic's own, on every step, carried or not", () => {
  const bugs = new Set(), at = new Set(), lastStep = new Set();
  for (const goal of ["pakdo", "sudhaaro"]) for (const kind of ["lucky", "neat"]) for (const c of levelsOf(goal, kind, [1, 2, 3, 5, 8, 13, 21, 34])) {
    const p = c.level.params;
    bugs.add(BUG_OF[p.bug]); at.add(p.at);
    if (p.at === PLAN[p.form].length) lastStep.add(kind);
  }
  assert.deepEqual([...bugs].sort(), [...BUGS].sort());
  assert.deepEqual([...at].sort(), [1, 2, 3]);
  // a plainly wrong last line exists (the neat kind); a lucky working never has its bug on the last step
  assert.deepEqual([...lastStep], ["neat"]);
});

test("galti-pakdo: the law's answers (check-later, check_first, follows, not_first, a wrong offer, the flagged line reopened)", () => {
  // check-later: weighed in a later line first, it balances; the question tips; weighed in the question first, no belief
  const neat = L.generate(req("sudhaaro", 3, { grammar: { kind: "neat" }, fade: 2 })).map((c) => L.validate(c.level));
  for (const level of neat.slice(0, 8)) {
    const p = level.params, j = laterLine(p);
    const a = run(level, [{ kind: "check", line: j }]);
    assert.equal(a.ms.find((m) => m.kind === "misconception_consequence")?.misconceptionId, "check-later");
    assert.equal(a.s.why, "later");
    const b = run(level, [{ kind: "check", line: 0 }, { kind: "check", line: j }]);
    assert.ok(!b.ms.some((m) => m.kind === "misconception_consequence"), "the question weighed first: exploring later lines is fine");
    // a correct line flagged: it follows (decisive); a fix before the line is caught is refused
    if (p.at > 1) { const f = run(level, [{ kind: "flag", line: p.at - 1 }]); assert.deepEqual(f.refused, ["follows"]); }
    assert.deepEqual(run(level, [{ kind: "fix", i: 0 }]).refused, ["flag_first"]);
    // a wrong offer: the claim changes, the question tips, the offers reopen when the line is tapped again
    const bad = p.fixes.findIndex((f) => f !== "ok"), ok = p.fixes.indexOf("ok");
    const t = run(level, [{ kind: "flag", line: p.at }, { kind: "fix", i: bad }]);
    assert.deepEqual(t.refused, ["tips"]); assert.equal(t.s.on, 0); assert.ok(!t.s.done);
    const back = run(level, [{ kind: "flag", line: p.at }, { kind: "fix", i: bad }, { kind: "flag", line: p.at }, { kind: "fix", i: ok }]);
    assert.ok(back.s.done);
    const g = L.grade(level, env([{ kind: "flag", line: p.at }, { kind: "fix", i: bad }, { kind: "flag", line: p.at }, { kind: "fix", i: ok }]));
    assert.equal(g.verdict, "solved"); assert.equal(g.evidence[0].outcome, "incorrect", "the first committed fix decides the evidence");
  }
  // not_first: on a lucky working the line after the bug does not follow either, but it is not the first
  const lucky = L.generate(req("pakdo", 9, { grammar: { kind: "lucky" }, fade: 3 })).map((c) => L.validate(c.level));
  let nf = 0;
  for (const level of lucky) {
    const r = run(level, [{ kind: "flag", line: level.params.at + 1 }]);
    if (r.refused[0] === "not_first") { nf++; assert.ok(r.ms.some((m) => m.kind === "near_miss")); }
  }
  assert.ok(nf > 0, "a not-first flag is answered");
  // sahi: "sab sahi" before the question is weighed is refused (not decisive); after, it solves
  const sahi = L.validate(L.generate(req("pakdo", 4, { grammar: { kind: "sahi" } }))[0].level);
  assert.deepEqual(run(sahi, [{ kind: "sab" }]).refused, ["check_first"]);
  assert.ok(run(sahi, [{ kind: "sab" }, { kind: "check", line: 0 }, { kind: "sab" }]).s.done);
  assert.deepEqual(run(sahi, [{ kind: "flag", line: 1 }]).refused, ["follows"]);
  // the question can never be flagged; undo steps back
  assert.deepEqual(run(sahi, [{ kind: "flag", line: 0 }]).refused, ["question"]);
  assert.equal(run(sahi, [{ kind: "check", line: 0 }, { kind: "undo" }]).s.on, -1);
});

test("galti-pakdo: tampered params are refused; a claim in an act never decides", () => {
  const level = L.generate(req("sudhaaro", 5, { grammar: { kind: "neat" } }))[0].level;
  const p = level.params;
  const bad = (patch) => L.validate({ ...level, params: { ...p, ...patch } });
  assert.ok(L.validate(level));
  assert.equal(bad({ kind: "sahi" }), null);
  assert.equal(bad({ at: p.at + 1 }), null);
  assert.equal(bad({ bug: "nope" }), null);
  assert.equal(bad({ fixes: ["ok", "ok", p.fixes.find((f) => f !== "ok")] }), null);
  assert.equal(bad({ fixes: [p.bug, ...p.fixes.slice(1)] }), null);
  assert.equal(bad({ who: "<script>" }), null);
  assert.equal(bad({ eq: { L: { t: "lin", k: 2, b: 3 }, R: { t: "lin", k: 0, b: 8 } } }), null, "a question whose x is not a whole number");
  assert.equal(L.validate({ ...level, mode: "pairs" }), null);
  const forged = sanitizeActs([{ seq: 1, act: { kind: "sab", correct: true, solved: true } }]);
  assert.ok(!("correct" in forged[0].act) && !("solved" in forged[0].act));
  assert.notEqual(L.grade(level, forged).verdict, "solved");
});

// ───────────────────────────── the play server ─────────────────────────────
const GP = () => coverage().entries.filter((e) => e.family === "galti-pakdo");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("galti-pakdo coverage: two entries on c7-maths-ch15-t03, mapped to its kit misconceptions; the topic is no longer arena-only", () => {
  assert.deepEqual(GP().map((e) => `${e.topicId}|${e.mode}|${e.goal}|${e.skillIds.join(",")}`), [
    "c7-maths-ch15-t03|kaapi|pakdo|c7-maths-ch15-t03-s1,c7-maths-ch15-t03-s2", "c7-maths-ch15-t03|kaapi|sudhaaro|c7-maths-ch15-t03-s3,c7-maths-ch15-t03-s2"]);
  for (const e of GP()) assert.deepEqual(e.misMap, { "neat-correct": "c7-maths-ch15-t03-m-neat-correct", "right-answer": "c7-maths-ch15-t03-m-right-answer", "check-later": "c7-maths-ch15-t03-m-check-later" });
  for (const [sk, goal] of [["s1", "pakdo"], ["s2", "pakdo"], ["s3", "sudhaaro"]]) {
    const id = `c7-maths-ch15-t03-${sk}`;
    assert.ok(hasPlay(id)); assert.equal(entryFor({ skillId: id }).family, "galti-pakdo"); assert.equal(entryFor({ skillId: id }).goal, goal);
  }
  assert.ok(!(coverage().arenaOnly ?? []).includes("c7-maths-ch15-t03"));
});

for (const e of GP()) for (const fade of [1, 2, 3]) {
  test(`galti-pakdo server ${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id`, () => {
    for (const child of ["c1", "c2", "c3", "c4", "c5", "c6"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const cur = currentLevel(s, e, "Zoya");
      assert.ok(cur && cur.family === "galti-pakdo" && cur.mode === "kaapi" && cur.params.goal === e.goal);
      assert.ok(!cur.params.who.includes("{"), "the friend's name is filled at serve time");
      assert.ok(L.validate(cur), "the filled level still validates");
      const level = levelsFor(s, e).garam;
      assert.equal(level.params.look, fade);
      const g = gradeActs(level, env(L.solve(level)), { final: true });
      assert.equal(g.grade.verdict, "solved");
      const rows = lessonEvidence(g.grade, level);
      // pakdo is one pick (a lucky first tap lands it): its correct enters at the chance-adjusted weight (GAMES-03)
      assert.equal(rows[0].outcome, "correct"); assert.equal(rows[0].weight, e.goal === "pakdo" ? CHANCE_WEIGHT : GAME_WEIGHT); assert.ok(e.skillIds.includes(rows[0].skillId));
      for (const kitId of level.proof.discriminates) {
        const mal = Object.keys(level.mal).find((m) => level.mal[m] === kitId && L.malActs(level, m));
        assert.equal(gradeActs(level, env(L.malActs(level, mal)), { final: true }).grade.evidence[0].weight, GAME_WEIGHT, "a miss keeps the game weight");
      }
      const forged = gradeActs(level, [{ seq: 1, t: 0, act: { kind: "sab", solved: true, correct: true, verdict: "solved" } }], { final: true });
      assert.notEqual(forged.grade.verdict, "solved");
      for (const kitId of level.proof.discriminates) {
        const mal = Object.keys(level.mal).find((m) => level.mal[m] === kitId && L.malActs(level, m));
        const mg = gradeActs(level, env(L.malActs(level, mal)), { final: true });
        assert.equal(mg.grade.evidence[0].misconceptionId, kitId);
      }
      assert.ok(hiddenOf(level).length > 0, "hidden values");
    }
  });
}

test("galti-pakdo: a child's levels are a third each all-correct, right-answer-from-a-wrong-step and plainly-wrong-last-line", () => {
  for (const e of GP()) {
    const n = { sahi: 0, lucky: 0, neat: 0 }, N = 240;
    for (let c = 0; c < N; c++) {
      const child = `third-${c}`, key = entryKey(e);
      // the first level and the next three (n = 0..3) of each child: a child's own run of levels
      for (let k = 0; k < 4; k++) n[currentLevel(sessionOf(e, { childId: child, n: k, seed: seedOf(child, key, k) }), e).params.kind]++;
    }
    for (const [k, v] of Object.entries(n)) assert.ok(v / (4 * N) > 0.28 && v / (4 * N) < 0.39, `${e.goal}: ${k} ${v} of ${4 * N}`);
  }
});

// r7 (main, 2026-11-08): the picker is deterministic (base − 2.2·|p − band|), so without the seeded difficulty nudge one
// level would be every child's first level of a kind
test("galti-pakdo: the first level served differs across children", () => {
  for (const e of GP()) for (const fade of [1, 3]) {
    const sigs = new Set(), forms = new Set();
    for (let c = 0; c < 20; c++) {
      const child = `var-${c}`, lv = currentLevel(sessionOf(e, { childId: child, fade, seed: seedOf(child, entryKey(e), 0) }), e);
      sigs.add(lv.sig); forms.add(lv.params.form);
    }
    assert.ok(sigs.size >= 15, `${e.goal} fade ${fade}: ${sigs.size} distinct first levels over 20 children`);
    assert.ok(forms.size >= 2, `${e.goal} fade ${fade}: ${forms.size} forms`);
  }
});

test("galti-pakdo: the generator's and the picker's work is bounded (counted, not timed)", () => {
  // measured 2026-11-10 over every case below: at most 28 candidates and 533 calls into the family logic per pick; bounds are 3x above that. A count is the same on every machine; a
  // 50 ms p95 read 5 ms idle and 110 ms under the gate's load (tests/_work.mjs).
  const gen = [], calls = [], considered = [], counter = counted(L);
  for (const goal of ["pakdo", "sudhaaro"]) for (const fade of [1, 2, 3]) for (let seed = 1; seed <= 12; seed++) {
    gen.push(L.generate(req(goal, seed * 31, { fade })).length);
    counter.reset(); const picked = pickLevels(counter.logic, req(goal, seed * 31, { fade })); assert.ok(picked); calls.push(counter.calls()); considered.push(picked.considered);
  }
  assert.ok(Math.max(...gen) <= 84, `generate made ${Math.max(...gen)} candidates`);
  assert.ok(Math.max(...considered) <= 84, `pick considered ${Math.max(...considered)}`);
  assert.ok(Math.max(...calls) <= 1600, `pick made ${Math.max(...calls)} calls into the family logic`);
});

test("galti-pakdo: every word the view shows exists in all three languages; vakya's words stay last; no clock, randomness or colour literal", () => {
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words, keys = Object.keys(words);
  const first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
  const view = readFileSync(`${ROOT}src/play/families/galti-pakdo/galti.view.ts`, "utf8");
  const used = [...view.matchAll(/W\("(galti-pakdo\.[a-zA-Z0-9._-]+)"/g)].map((m) => m[1]);
  const extra = ["goal.pakdo", "goal.sudhaaro", "done.sahi", "title", ...BUGS.map((b) => `bug.${b}`), ...["later", "check_first", "neat", "lucky", "follows", "not_first", "tips", "not_all"].map((w) => `why.${w}`)].map((k) => `galti-pakdo.${k}`);
  assert.ok(used.length >= 6);
  for (const k of [...used, ...extra]) for (const l of ["hinglish", "en", "hi"]) assert.ok(words[k]?.[l], `${k} ${l}`);
  const logic = readFileSync(`${ROOT}src/play/families/galti-pakdo/galti.logic.ts`, "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(logic, /Math\.random|Date\.now|performance\.now|setTimeout|setInterval/);
  assert.doesNotMatch(view.replace(/\/\/.*$/gm, ""), /Math\.random|Date\.now|performance\.now|setTimeout|setInterval|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});
