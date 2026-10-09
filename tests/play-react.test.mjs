// Play: the teacher's micro-reactions (data/play/reactions.json, src/play/core/react.ts, server/play/react.js) and the
// style/juice rules (src/play/core/styles.ts, juice.ts, shared/play.ts pickArt). Every authored shape, filled with the
// facts its moment carries, must pass the play guard AND the lesson's never-rules floor; rotation is deterministic and
// never repeats a line; the level's key is never spoken; NEVER MANIPULATE words are absent. Art tokens hold their
// contrast and status-by-shape rules; juice holds its caps (Kao et al. CHI 2024 rule J1).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pickReaction, newHistory, fill, REACT_ORDER } from "../src/play/core/react.ts";
import { LOGIC } from "../src/play/families/index.ts";
import { reactionFor, floorOk, hiddenOf } from "../server/play/react.js";
import { reactionProblems, REACTION_BANNED, FLOORS, FAMILY_ARTS, pickArt } from "../shared/play.ts";
import { ART, contrast, edgeOf, labelOn, bodyFill } from "../src/play/core/styles.ts";
import { Juice } from "../src/play/core/juice.ts";

const bank = JSON.parse(readFileSync(new URL("../data/play/reactions.json", import.meta.url), "utf8"));
const SAMPLE = { n: 36, a: "2/3", b: "3/4", at: "0.4", truth: "0.5", gap: "1/4", value: "3/4", strip: "2 × 2 × 3", bittu: "2 × 2 × 3", mine: "2 × 2 × 3", k: 3, x: 4, left: "2x + 3", right: "11", place: "tens", need: 2, have: 1, choice: 0, predicted: "A", differences: 2, unit: "seeds", why: "tipped", took: 2, named: 7 };

function* allShapes() {
  for (const [moment, langs] of Object.entries(bank.moments)) for (const [lang, shapes] of Object.entries(langs)) for (const s of shapes) yield { moment, lang, s, where: "moments" };
  for (const [fam, ms] of Object.entries(bank.family ?? {})) for (const [moment, langs] of Object.entries(ms)) for (const [lang, shapes] of Object.entries(langs)) for (const s of shapes) yield { moment, lang, s, where: fam };
}

describe("play reactions: the authored bank", () => {
  it("every shape, filled, passes the play guard and the lesson's never-rules floor (all languages)", () => {
    let n = 0;
    for (const { moment, lang, s, where } of allShapes()) {
      const text = fill(s, SAMPLE) ?? s.replace(/^\{\?[^}]*\}/, "").replace(/\{\w+\}/g, "3");
      assert.deepEqual(reactionProblems(text), [], `${where}/${moment}/${lang}: ${text}`);
      assert.equal(floorOk(text), true, `${where}/${moment}/${lang}: floor: ${text}`);
      assert.ok(["hinglish", "en", "hi"].includes(lang));
      assert.ok(REACT_ORDER.includes(moment), moment);
      n++;
    }
    assert.ok(n >= 60, `only ${n} shapes`);
  });
  it("every reactable moment has lines in all three languages; banned words never appear", () => {
    for (const m of ["solved", "impasse", "prediction_confirmed", "prediction_violated", "near_miss", "misconception_consequence", "law_refused"]) for (const lang of ["hinglish", "en", "hi"]) {
      const fam = Object.values(bank.family ?? {}).some((f) => f[m]?.[lang]?.length);
      assert.ok(bank.moments[m]?.[lang]?.length || fam, `${m}/${lang}`);
    }
    const all = [...allShapes()].map((x) => x.s.toLowerCase()).join("\n");
    for (const w of ["streak", "coins", "reward", "last chance", "hurry", "shabash", "genius"]) assert.ok(!all.includes(w), w);
    assert.ok(REACTION_BANNED.includes("galat") && REACTION_BANNED.includes("streak"));
  });
  it("rotation is deterministic, never repeats a line in a session, and respects the 4 s gap", () => {
    const run = () => { const h = newHistory(), out = []; for (let i = 0; i < 12; i++) { const r = pickReaction(bank, [{ kind: "law_refused", seq: i, facts: SAMPLE }], { lang: "hinglish", family: "taraazu", seed: "L1", hist: h, nowS: i * 5 }); if (r) out.push(r.text); } return out; };
    const a = run(), b = run();
    assert.deepEqual(a, b);
    assert.equal(new Set(a).size, a.length);
    const h = newHistory();
    assert.ok(pickReaction(bank, [{ kind: "near_miss", seq: 1, facts: SAMPLE }], { lang: "en", seed: "L", hist: h, nowS: 10 }));
    assert.equal(pickReaction(bank, [{ kind: "near_miss", seq: 2, facts: SAMPLE }], { lang: "en", seed: "L", hist: h, nowS: 11 }), null);
  });
  it("a line is said only where it is true: law_refused shapes name their why; every {?key=v} names a real refusal / mal-rule / mode / goal of that family", () => {
    const SRC = { "todo-jodo": ["atoms", "strips", "bundles"], taraazu: ["balance"], nishana: ["line"], "kyun-lab": ["lab"] };
    const cov = JSON.parse(readFileSync(new URL("../data/play/coverage.json", import.meta.url), "utf8"));
    for (const [fam, ms] of Object.entries(bank.family ?? {})) {
      const code = SRC[fam].map((f) => readFileSync(new URL(`../src/play/families/${fam}/${f}.logic.ts`, import.meta.url), "utf8")).join("\n");
      const logics = Object.values(LOGIC).filter((l) => l.family === fam);
      const known = {
        why: new Set([...code.matchAll(/why: "([a-z_]+)"/g)].map((m) => m[1])),
        mal: new Set(logics.flatMap((l) => l.malRules)),
        mode: new Set(logics.flatMap((l) => l.modes)),
        goal: new Set([...cov.entries.filter((e) => e.family === fam).map((e) => e.goal), ...(fam === "todo-jodo" ? ["atoms", "two-trees"] : [])]),
      };
      for (const [moment, langs] of Object.entries(ms)) for (const [lang, shapes] of Object.entries(langs)) for (const sh of shapes) {
        const c = /^\{\?(\w+)(?:=([^}]*))?\}/.exec(sh);
        if (moment === "law_refused") assert.ok(c && c[1] === "why", `${fam}/law_refused/${lang} has no {?why=} condition: ${sh}`);
        if (!c || c[2] === undefined) continue;
        assert.ok(known[c[1]], `${fam}/${moment}: unknown condition key ${c[1]} (${sh})`);
        for (const w of c[2].split("|")) assert.ok(known[c[1]].has(w), `${fam}/${moment}: ${c[1]}="${w}" does not exist in this family (${sh})`);
      }
    }
    // the defect this rule closes: taking 5 hundreds from 0 in the place-value game drew "these pieces are different sizes"
    for (let i = 0; i < 20; i++) {
      const r = pickReaction(bank, [{ kind: "law_refused", seq: 1, facts: { why: "not_enough", place: "sau", have: 0, need: 5 } }], { lang: "hinglish", family: "todo-jodo", seed: `B${i}`, hist: newHistory(), nowS: 100 });
      assert.ok(r && /sau/.test(r.text) && !/tukde/.test(r.text), r?.text);
    }
    assert.equal(fill("{?why=tipped}Taraazu jhuk gaya.", { why: "not_alone" }), null);
    assert.equal(fill("{?why=tipped|not_alone}Taraazu jhuk gaya.", { why: "not_alone" }), "Taraazu jhuk gaya.");
    assert.equal(fill("{?predicted}Chalao.", {}), null);
    // a place-value misconception never draws the factor-tree line, a strips solve never says "back to n"
    const r1 = pickReaction(bank, [{ kind: "misconception_consequence", seq: 1, facts: { written: "524" }, misconceptionId: "smaller-from-larger" }], { lang: "en", family: "todo-jodo", mode: "bundles", goal: "subtract", seed: "x", hist: newHistory(), nowS: 100 });
    assert.ok(r1 && !/1 changed|humming/.test(r1.text), r1?.text);
    const r2 = pickReaction(bank, [{ kind: "solved", seq: 1, facts: { a: "1/2", b: "2/3", more: 1, n: 6 } }], { lang: "en", family: "todo-jodo", mode: "strips", goal: "compare", seed: "y", hist: newHistory(), nowS: 100 });
    assert.ok(r2 && !/Back to/.test(r2.text), r2?.text);
  });
  it("a missing fact skips the shape; the level's key is never spoken before it is found", () => {
    assert.equal(fill("{x} hai", {}), null);
    assert.deepEqual(reactionProblems("x = 4 hai", { hidden: [4] }), ["reveals_hidden"]);
    const level = { family: "taraazu", mode: "equation", levelId: "bal-1", params: { x: 4 } };
    assert.deepEqual(hiddenOf(level), [4]);
    for (let i = 0; i < 30; i++) {
      const { reaction } = reactionFor([{ kind: "law_refused", seq: 1, facts: { ...SAMPLE, x: 4, named: 4 } }], { lang: "hinglish", level: { ...level, levelId: `bal-${i}` }, nowS: 100 });
      if (reaction) assert.ok(!/(^|[^0-9])4([^0-9]|$)/.test(reaction.text), reaction.text);
    }
  });
});

describe("play style and juice", () => {
  it("every art direction: text ≥ 7 (ink) / ≥ 4.5 (ink2) on its ground; body edges and status marks ≥ 3 (WCAG 1.4.11); labels on bodies ≥ 4.5", () => {
    for (const a of Object.values(ART)) {
      assert.ok(contrast(a.ink, a.ground) >= 7, `${a.id} ink`);
      assert.ok(contrast(a.ink2, a.ground) >= 4.5, `${a.id} ink2`);
      for (const k of ["q1", "q2", "q3", "q4"]) assert.ok(contrast(edgeOf(a, k), a.ground) >= 3, `${a.id} ${k} edge ${contrast(edgeOf(a, k), a.ground).toFixed(2)}`);
      for (const k of ["good", "look"]) assert.ok(contrast(a[k], a.ground) >= 3, `${a.id} ${k}`);
      for (const k of ["q1", "q2", "q3", "q4"]) assert.ok(contrast(labelOn(a, k), bodyFill(a, k)) >= 4.5, `${a.id} label on ${k} ${contrast(labelOn(a, k), bodyFill(a, k)).toFixed(2)}`);
    }
  });
  it("'look again' is never red; the your-move hue is distinct from every quantity hue", () => {
    const hue = (hex) => { const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx === mn) return 0; const d = mx - mn; const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360; };
    for (const a of Object.values(ART)) {
      const h = hue(a.look); assert.ok(h > 20 && h < 70, `${a.id} look hue ${h}`);
      for (const k of ["q1", "q2", "q3", "q4"]) assert.notEqual(a.you.toLowerCase(), a[k].toLowerCase());
    }
  });
  it("floors: text ≥ 14 (16 young), targets ≥ 44; every family wears ≥ 3 directions; pickArt never repeats unasked", () => {
    assert.ok(FLOORS.text >= 14 && FLOORS.textYoung >= 16 && FLOORS.target >= 44);
    for (const arts of Object.values(FAMILY_ARTS)) assert.ok(arts.length >= 3);
    const a = pickArt({ family: "todo-jodo", subject: "maths", topicId: "t", classLevel: 6, lastArt: "kagaz", topicArts: ["kagaz", "chalk"] });
    assert.equal(a.art, "chalk");
    assert.equal(pickArt({ family: "todo-jodo", subject: "maths", topicId: "t", classLevel: 6, childArt: "raat" }).art, "raat");
    assert.notEqual(pickArt({ family: "taraazu", subject: "maths", topicId: "t", classLevel: 4, topicArts: ["raat", "kagaz"] }).art, "raat");
  });
  it("juice caps: ≤ 90 particles, shake ≤ 6 px, hit-stop ≤ 80 ms; reduced motion has none", () => {
    const j = new Juice();
    for (let i = 0; i < 20; i++) j.burst(0, 0, { n: 40, color: "#fff" });
    assert.ok(j.particles.length <= 90);
    j.shake(40); assert.ok(j.shakeA <= 6);
    j.stop?.(500); assert.ok(j.hitstop <= 0.08 + 1e-9);
    const r = new Juice(); r.reduced = true; r.burst(0, 0, { n: 10, color: "#fff" }); r.shake(5);
    assert.equal(r.particles.length, 0); assert.equal(r.shakeA, 0);
  });
});
