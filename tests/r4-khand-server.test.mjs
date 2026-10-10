// r4-khand · the Nazariya family on the play server: coverage entries (built from server/play/tools/rules/nazariya.mjs and
// checked against the kits), the server's re-grade of raw acts on the level it regenerates, the lesson evidence rows, the
// reaction bank (data/play/reactions/nazariya.json) and the saved build (server/play/builds.js). No DB, no network: the
// requireChild routes and the saved row are exercised on the local production build by tests/prod/r4-khand-loop.mjs.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { coverage, entryFor, entryKey, levelsFor, seedOf, hasPlay } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { bank, reactionFor, floorOk, hiddenOf } from "../server/play/react.js";
import { buildOf } from "../server/play/builds.js";
import { RULES, ACTS } from "../server/play/tools/rules/nazariya.mjs";
import { LOGIC } from "../src/play/families/index.ts";
import { env } from "../src/play/core/pick.ts";
import { fill } from "../src/play/core/react.ts";
import { reactionProblems, GAME_WEIGHT } from "../shared/play.ts";

const NZ = () => coverage().entries.filter((e) => e.family === "nazariya");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, classLevel: entry.classLevel, fade: 1, lang: "hinglish", mis: {}, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], ...over });

describe("r4-khand coverage", () => {
  it("every authored rule is admitted (no broken mapping) and every mapped misconception id is the kit's", () => {
    const entries = NZ();
    assert.equal(entries.length, RULES.length);
    const kits = new Map();
    for (const f of ["c4-maths.json", "c5-maths.json", "c6-maths.json"]) for (const t of JSON.parse(readFileSync(new URL(`../data/kits/${f}`, import.meta.url), "utf8")).topics) kits.set(t.topicId, t);
    for (const e of entries) {
      const kit = kits.get(e.topicId);
      for (const id of Object.values(e.misMap)) assert.ok(kit.misconceptions.some((m) => m.id === id), id);
      for (const sk of e.skillIds) assert.ok(kit.skills.some((s) => s.id === sk), sk);
      assert.deepEqual(e.skillIds, ACTS[`${e.topicId}|${e.goal}`].map((x) => `${e.topicId}-${x}`));
    }
    assert.equal(new Set(entries.map((e) => e.topicId)).size, 11);
  });
  it("admission is by skill: each claimed skill finds a Nazariya entry whose act exercises it", () => {
    for (const e of NZ()) for (const sk of e.skillIds) {
      assert.ok(hasPlay(sk));
      const got = entryFor({ skillId: sk });
      assert.ok(got.skillIds.includes(sk), sk);
    }
  });
});

describe("r4-khand server grade", () => {
  for (const e of NZ()) for (const fade of [1, 2, 3]) {
    it(`${e.topicId} ${e.mode}/${e.goal} fade ${fade}: the server's level solves by its solver; claims never solve; a mal-rule folds its kit id`, () => {
      const r = levelsFor(sessionOf(e, { fade }), e);
      assert.ok(r?.garam, "no level");
      const level = r.garam, logic = LOGIC[`nazariya/${e.mode}`];
      const g = gradeActs(level, env(logic.solve(level)), { final: true });
      assert.equal(g.grade.verdict, "solved");
      const rows = lessonEvidence(g.grade, level);
      assert.equal(rows[0].outcome, "correct"); assert.equal(rows[0].source, "game"); assert.equal(rows[0].weight, GAME_WEIGHT);
      assert.ok(e.skillIds.includes(rows[0].skillId));
      // a device that claims a solve with junk acts
      const forged = gradeActs(level, [{ seq: 1, t: 0, act: { kind: "check", solved: true, correct: true, verdict: "solved" } }], { final: true });
      assert.notEqual(forged.grade.verdict, "solved");
      for (const kitId of level.proof.discriminates) {
        const mal = Object.keys(level.mal).find((m) => level.mal[m] === kitId);
        const mg = gradeActs(level, env(logic.malActs(level, mal)), { final: true });
        assert.equal(lessonEvidence(mg.grade, level)[0].misconceptionId, kitId);
      }
    });
  }
});

describe("r4-khand reactions", () => {
  const fam = bank().family?.nazariya;
  it("the loader merges data/play/reactions/nazariya.json into the bank", () => { assert.ok(fam?.law_refused?.en?.length >= 10); });
  it("every shape in every language passes the play guard and the lesson's never-rules floor, filled", () => {
    const SAMPLE = { off: 2, top_off: 1, front_off: 1, side_off: 0, rows: 6, cols: 8, said: 14, blocks: 12, floor: 9, fence: 12, side: 4, hmax: 3, view: "front", goal: "cube", act: "layer" };
    let n = 0;
    for (const [moment, langs] of Object.entries(fam)) for (const [lang, shapes] of Object.entries(langs)) for (const sh of shapes) {
      const text = fill(sh, { ...SAMPLE, why: /\{\?why=([^}|]*)/.exec(sh)?.[1] ?? "", mal: /\{\?mal=([^}|]*)/.exec(sh)?.[1] ?? "", mode: /\{\?mode=([^}|]*)/.exec(sh)?.[1] ?? "", off: /\{\?off=([^}|]*)/.exec(sh)?.[1] ?? 2 });
      assert.ok(text, `${moment}/${lang}: ${sh}`);
      assert.deepEqual(reactionProblems(text), [], `${moment}/${lang}: ${text}`);
      assert.equal(floorOk(text), true, `${moment}/${lang}: ${text}`);
      n++;
    }
    assert.ok(n >= 120, `${n} shapes`);
  });
  it("a shape is said only where it is true: every {?why=} is a refusal the law makes, every {?mal=} a mal-rule it implements", () => {
    const src = ["grid", "views.logic", "array.logic", "floor.logic", "powers.logic", "mirror.logic"].map((f) => readFileSync(new URL(`../src/play/families/nazariya/${f}.ts`, import.meta.url), "utf8")).join("\n");
    const mals = new Set(Object.values(LOGIC).filter((l) => l.family === "nazariya").flatMap((l) => l.malRules));
    for (const langs of Object.values(fam)) for (const shapes of Object.values(langs)) for (const sh of shapes) {
      const why = /^\{\?why=([^}]*)\}/.exec(sh)?.[1];
      if (why) for (const w of why.split("|")) assert.ok(new RegExp(`["']${w}["']`).test(src), `no refusal ${w}`);
      const mal = /^\{\?mal=([^}]*)\}/.exec(sh)?.[1];
      if (mal) for (const m of mal.split("|")) assert.ok(mals.has(m), `no mal-rule ${m}`);
    }
  });
  it("every language has the same shapes (a line in one language is a line in all three)", () => {
    for (const [moment, langs] of Object.entries(fam)) {
      const key = (l) => (langs[l] ?? []).map((s) => /^\{\?[^}]*\}/.exec(s)?.[0] ?? "").join("|");
      assert.equal(key("en"), key("hinglish"), moment); assert.equal(key("en"), key("hi"), moment);
    }
  });
  it("the key is never spoken before the child makes it (array count, next square / cube, best field)", () => {
    for (const e of NZ()) for (const fade of [1, 2, 3]) {
      const level = levelsFor(sessionOf(e, { fade }), e).garam, hidden = hiddenOf(level), logic = LOGIC[`nazariya/${e.mode}`];
      if (e.mode === "array" || e.mode === "powers") assert.ok(hidden.length, `${e.topicId} hides nothing`);
      // every moment a wrong path produces, through her picker: no line holds the key
      for (const mal of Object.keys(level.mal)) {
        const acts = logic.malActs(level, mal); if (!acts) continue;
        const g = gradeActs(level, env(acts), { final: false });
        let hist; let t = 0;
        for (const m of g.moments) { t += 5; const r = reactionFor([m], { lang: "en", level, solved: false, history: hist, nowS: t }); hist = r.history; if (r.reaction) for (const h of hidden) assert.ok(!new RegExp(`(^|[^0-9])${h}([^0-9]|$)`).test(r.reaction.text), `${r.reaction.text} says ${h}`); }
      }
    }
  });
});

describe("r4-khand saved builds", () => {
  it("a build is kept only from the server's replay of a solved level, as heights; unsolved, foreign or tampered → nothing", () => {
    const e = NZ().find((x) => x.mode === "views"), level = levelsFor(sessionOf(e), e).garam, logic = LOGIC["nazariya/views"];
    const b = buildOf(level, env(logic.solve(level)));
    assert.ok(b); assert.equal(b.heights.length, b.w * b.d); assert.equal(b.levelId, level.levelId);
    assert.equal(buildOf(level, env(logic.solve(level).slice(0, -1))), null);
    assert.equal(buildOf({ ...level, family: "taraazu" }, env(logic.solve(level))), null);
    assert.equal(buildOf({ ...level, params: { ...level.params, w: 99 } }, env(logic.solve(level))), null);
    assert.ok(!("score" in b) && !("count" in b));
  });
});
