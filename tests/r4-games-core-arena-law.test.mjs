// ITEM-ARENA law (round 4 G1): the shot is graded against the verified key in code; the first shot is the evidence; a
// claim field never decides; a miss darkens that option and never reveals the key in the facts; every bank challenge
// plays through the picker (solvable, shortcut-free) and survives a random battery (≥ 2000 acts) without throwing.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { arenaLogic } from "../src/play/families/arena/arena.logic.ts";
import { pickLevels } from "../src/play/core/pick.ts";

const bank = readdirSync(new URL("../data/arena/", import.meta.url)).filter((f) => /^c\d-[a-z]+\.json$/.test(f))
  .flatMap((f) => JSON.parse(readFileSync(new URL(`../data/arena/${f}`, import.meta.url), "utf8")).challenges);
const req = (items, o = {}) => ({ family: "arena", mode: "pick", goal: "pick", topicId: items[0].topicId, skillId: items[0].skillId, classLevel: 5, fade: 1, mis: {}, misMap: {}, grammar: { items }, recent: [], seed: 7, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 500, act }));
const levelOf = (c) => arenaLogic.validate(arenaLogic.generate(req([c]))[0].level);

test("arena: a hit on the key solves; a first miss is the evidence (incorrect) even if a later shot hits", () => {
  const c = bank.find((x) => x.form === "numeric"), L = levelOf(c);
  const key = L.params.key, wrong = L.params.options.find((o) => o.id !== key).id;
  const hit = arenaLogic.grade(L, env([{ kind: "aim", option: key }, { kind: "fire" }]));
  assert.equal(hit.verdict, "solved"); assert.equal(hit.evidence[0].outcome, "correct");
  const g = arenaLogic.grade(L, env([{ kind: "aim", option: wrong }, { kind: "fire" }, { kind: "aim", option: key }, { kind: "fire" }]));
  assert.equal(g.verdict, "solved");
  assert.equal(g.evidence.length, 1); assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].actSeq, 2);
});

test("arena: claim fields never decide; a darkened option cannot be aimed again; the key is not a fact before the hit", () => {
  const c = bank.find((x) => x.form === "choice"), L = levelOf(c);
  const key = L.params.key, wrong = L.params.options.find((o) => o.id !== key).id;
  const g = arenaLogic.grade(L, env([{ kind: "aim", option: wrong, correct: true }, { kind: "fire", solved: true, verdict: "correct" }]));
  assert.notEqual(g.verdict, "solved"); assert.equal(g.evidence[0].outcome, "incorrect");
  let s = arenaLogic.init(L);
  s = arenaLogic.apply(L, s, { kind: "aim", option: wrong }, 1).state;
  const miss = arenaLogic.apply(L, s, { kind: "fire" }, 2);
  assert.equal(miss.refused, "missed");
  assert.ok(!Object.values(miss.moments.flatMap((m) => Object.values(m.facts))).includes(c.keyText), "a miss never names the key");
  assert.equal(arenaLogic.facts(L, miss.state).answer, undefined);
  assert.equal(arenaLogic.apply(L, miss.state, { kind: "aim", option: wrong }, 3).refused, "already_out");
  assert.equal(arenaLogic.apply(L, arenaLogic.init(L), { kind: "fire" }, 1).refused, "aim_first");
});

test("arena: every bank challenge is a valid, solvable, shortcut-free level the picker serves", () => {
  let n = 0;
  for (const c of bank) {
    const r = pickLevels(arenaLogic, req([c]));
    assert.ok(r?.garam, `${c.id} not served`);
    assert.equal(r.garam.params.options.find((o) => o.id === r.garam.params.key).text, c.keyText, c.id);
    n++;
  }
  assert.ok(n > 2000);
});

test("arena: ≥ 2000 random acts with claim fields mixed in: the law never throws and solved ⇔ the key was hit", () => {
  let seed = 5, acts = 0;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
  for (const c of bank.slice(0, 400)) {
    const L = levelOf(c);
    let s = arenaLogic.init(L), lastAim = null, hitKey = false;
    for (let i = 0; i < 8 && !s.done; i++) {
      const r = rnd();
      const a = r < 0.5 ? { kind: "aim", option: L.params.options[Math.floor(rnd() * L.params.options.length)].id, ...(rnd() < 0.2 ? { correct: true } : {}) }
        : r < 0.9 ? { kind: "fire", ...(rnd() < 0.2 ? { solved: true } : {}) } : { kind: "undo" };
      if (a.kind === "fire" && s.aim === L.params.key) hitKey = true;
      s = arenaLogic.apply(L, s, a, i + 1).state; acts++;
      lastAim = s.aim ?? lastAim;
    }
    assert.equal(arenaLogic.goalMet(L, s), hitKey, `${c.id}: solved without hitting the key, or the reverse`);
  }
  assert.ok(acts >= 2000, `only ${acts} acts`);
});
