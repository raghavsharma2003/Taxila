// dc-r7-script-walk-v6-8 (main's director16 judgement): G1 — the grading matrix over EVERY scripted key in data/lesson-scripts (its
// key, its accepted forms, the unit dropped, the sign flipped, its listed wrong answer, a near number). Main's reversal: any
// misgrade, no paid run until this passes.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { classifyFast } from "../server/director/classify.js";

const DIR = new URL("../data/lesson-scripts/", import.meta.url).pathname;
const said = (x) => (x && typeof x === "object" ? x.hi ?? x.en ?? "" : String(x ?? ""));
const cardsOf = (script) => script.skills.flatMap((sk) => [
  ...(sk.explain ?? []).filter((b) => b.ask?.key != null).map((b) => ({ id: `${sk.skillId}:ask:${b.id}`, c: b.ask, meta: "scriptAsk" })),
  ...(sk.workedExample?.yourStep?.key != null ? [{ id: `${sk.skillId}:ask:worked`, c: sk.workedExample.yourStep, meta: "scriptAsk" }] : []),
  ...(sk.checks ?? []).filter((c) => c.key != null).map((c) => ({ id: `${sk.skillId}:${c.id}`, c, meta: "scriptCheck" })),
  ...(sk.remediation ?? []).filter((r) => r.then?.key != null).map((r) => ({ id: `${sk.skillId}:then:${r.targets}`, c: r.then, meta: "scriptThen" })),
]);
const targetOf = ({ id, c, meta }) => {
  const item = { id: `script:${id}`, answer: said(c.key), acceptable: (c.accept ?? []).map(said), [meta]: { wrongIfMis: c.wrongIfMis ?? null, targets: c.targets ?? null } };
  return { mode: "item", item, key: item.answer, also: item.acceptable, ideas: [], misconceptions: [], open: false };
};
const grade = (t, text) => classifyFast({ target: t, childText: text, typed: true })?.result?.outcome ?? null;
const UNIT = /\s*\b(?:cm|m|km|mm|metre|metres|meter|meters|centimetre|centimetres|kg|g)\b\.?$/i;

describe("r7-brain-v68.test.mjs", () => {
  describe("G1: the grading matrix over every scripted key", () => {
    for (const f of readdirSync(DIR).filter((x) => x.endsWith(".json"))) {
      test(`every card of ${f}: key and accepted forms right; the sign flipped, the listed wrong answer and a near number never right`, () => {
        const script = JSON.parse(readFileSync(DIR + f, "utf8"));
        const bad = [];
        let n = 0;
        for (const card of cardsOf(script)) {
          const t = targetOf(card);
          const key = t.key;
          n++;
          for (const form of [key, ...t.also]) if (grade(t, form) !== "correct") bad.push(`${card.id}: "${form}" → ${grade(t, form)}`);
          const num = /^-?\d+(?:\.\d+)?(?:\/\d+)?/.exec(key.trim())?.[0];
          if (num && !num.startsWith("-")) {
            for (const neg of [`-${key}`, `- ${key}`, `−${key}`, `minus ${key}`]) if (grade(t, neg) === "correct") bad.push(`${card.id}: "${neg}" graded right (sign)`);
            if (UNIT.test(key) && grade(t, key.replace(UNIT, "")) !== "correct") bad.push(`${card.id}: "${key.replace(UNIT, "")}" (unit dropped) not right`);
            if (!num.includes("/")) {
              const near = `${Number(num) + 1}${key.trim().slice(num.length)}`;
              if (![key, ...t.also].includes(near) && grade(t, near) === "correct") bad.push(`${card.id}: "${near}" graded right`);
            }
          }
          const w = card.c.wrongIfMis != null ? said(card.c.wrongIfMis) : null;
          if (w && ![key, ...t.also].includes(w) && grade(t, w) === "correct") bad.push(`${card.id}: listed wrong answer "${w}" graded right`);
        }
        assert.ok(n > 5, `${f}: only ${n} cards`);
        assert.deepEqual(bad, []);
      });
    }
    test("the director16 misgrade: '-1/7 km' to the key '1/7 km' is wrong, on the fast path and the model's", async () => {
      const t = { mode: "item", item: { id: "script:x", answer: "1/7 km", acceptable: ["1/7"], scriptThen: { wrongIfMis: null, targets: null } }, key: "1/7 km", also: ["1/7"], ideas: [], misconceptions: [] };
      assert.equal(grade(t, "-1/7 km"), "incorrect");
      const { signMismatch } = await import("../server/director/classify.js");
      assert.equal(signMismatch({ result: { outcome: "correct" } }, t, "-1/7 km").result.outcome, "incorrect");
      assert.equal(signMismatch({ result: { outcome: "correct" } }, t, "1/7 km").result.outcome, "correct");
    });
  });
});
