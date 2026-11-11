// ITEM-ARENA bank (round 4 G1): challenges come only from VERIFIED kit items and are graded against the verified key in
// code. These checks hold the builder to that: offered choices parse cleanly, numeric decoys are wrong BY VALUE (an
// equivalent form is never a decoy), the hint never states the key, every challenge has exactly one key among its options,
// and the bank on disk is what the builder makes (`build-arena --check`).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { offered, parseNum, numericDecoys, challengeOf, build, head, MIN_CHALLENGES } from "../server/play/tools/build-arena.mjs";

const texts = (p) => offered(p)?.map((o) => o.text) ?? null;

test("arena bank: the prompt's own choices parse cleanly, and a sentence is never an option", () => {
  assert.deepEqual(texts("In ionic bonding, are electrons shared or transferred?"), ["shared", "transferred"]);
  assert.deepEqual(texts("Does वर्षा start with ब or व?"), ["ब", "व"]);
  assert.deepEqual(texts("A slide in the park makes what kind of line: standing, sleeping or slanting?"), ["standing", "sleeping", "slanting"]);
  assert.deepEqual(texts("Listen and tap: which word means large, 'big' or 'dig'?"), ["big", "dig"]);
  assert.deepEqual(texts("Which is right: 'payal chup ho gaya' or 'payal chup ho gayi'?"), ["payal chup ho gaya", "payal chup ho gayi"]);
  assert.deepEqual(texts("Is a one-rupee coin round or long?"), ["round", "long"]);
  assert.equal(texts("Is 3/4 bigger or smaller than 2/3?"), null, "a lead the parser cannot separate gives no choice");
  assert.equal(texts("Before you try: stir a spoon of salt into water, will it taste like plain water or salty?"), null);
  assert.deepEqual(texts("Which number is bigger? (a) 305 (b) 350 (c) 335"), ["305", "350", "335"]);
});

test("arena bank: numeric decoys keep the key's shape and are wrong by value", () => {
  const cases = [["24,360", ["24360"]], ["₹18", ["18"]], ["3/4", ["0.75", "6/8"]], ["90°", []], ["2.5 m", []], ["−7", ["-7"]], ["1,00,000", []], ["0", []]];
  for (const [k, acc] of cases) {
    const key = parseNum(k);
    assert.ok(key, k);
    const ok = [key.value, ...acc.map((a) => parseNum(a)?.value).filter((v) => v != null)];
    const d = numericDecoys(key, ok, `t-${k}`);
    assert.equal(d.length, 3, `${k}: ${d}`);
    for (const x of d) {
      const v = parseNum(x)?.value;
      assert.ok(v != null, `${k}: decoy ${x} parses`);
      assert.ok(ok.every((o) => Math.abs(o - v) > 1e-9), `${k}: decoy ${x} equals the key by value`);
    }
    if (key.prefix) assert.ok(d.every((x) => x.startsWith(key.prefix)), `${k} keeps ₹`);
    if (key.unit) assert.ok(d.every((x) => x.endsWith(key.unit)), `${k} keeps its unit`);
  }
  // 1/2 never offers 2/4 (or any other equivalent form) as wrong
  const half = parseNum("1/2"), d = numericDecoys(half, [0.5], "half");
  assert.ok(d.every((x) => Math.abs(parseNum(x).value - 0.5) > 1e-9));
});

test("arena bank: only verified items; open, picture and estimate prompts are left out; the hint never states the key", () => {
  const t = { topicId: "c5-maths-ch01-t01" };
  const it = (o) => ({ id: "x-i01", skillId: "c5-maths-ch01-t01-s1", kind: "practice", difficulty: 2, prompt_en: "What is 6 × 7?", prompt_hi: "6 × 7 kitna?", answer: "42", acceptable: ["42"], hints: ["Think of 6 sevens.", "6 × 7 = 42.", "", ""], verified: { agrees: true }, ...o });
  assert.equal(challengeOf(it({ verified: { agrees: false } }), t).ok, undefined);
  assert.equal(challengeOf(it({ verified: undefined }), t).ok, undefined);
  assert.equal(challengeOf(it({ prompt_en: "Name a number between 3 and 9." , answer: "5" }), t).ok, undefined);
  assert.equal(challengeOf(it({ prompt_en: "Look at the picture. How many apples?" }), t).ok, undefined);
  assert.equal(challengeOf(it({ prompt_en: "About how much is 6,812 − 2,907?", answer: "4000" }), t).ok, undefined);
  const c = challengeOf(it({}), t).ok;
  assert.ok(c);
  assert.equal(c.form, "numeric");
  assert.equal(c.options.filter((o) => o.text === c.keyText).length, 1);
  assert.equal(c.hint, "Think of 6 sevens.", "hints[1] states the key, so the pump is used");
});

test("arena bank: a numbered-list answer is never a number; a yes/no, why or which-one question never shows number tiles (audit CD-08, CD-15)", () => {
  const t = { topicId: "c7-maths-ch12-t02" };
  const it = (o) => ({ id: "x-i02", skillId: "c7-maths-ch12-t02-s1", kind: "practice", difficulty: 2, prompt_hi: "", hints: [], verified: { agrees: true }, ...o });
  // CD-08: the head of "1. Stop … 2. …" is the list, not "1"
  assert.equal(parseNum(head("1. Stop and stay in one place. 2. Ask a police officer. 3. Say your phone number.")), null);
  assert.equal(challengeOf(it({ prompt_en: "Say the lost-child plan in three steps.", answer: "1. Stop and stay in one place. 2. Ask a police officer. 3. Say your phone number." }), t).ok, undefined);
  assert.equal(head("42. That is the total"), "42", "a number followed by a full stop and prose is still the head");
  // CD-15: a number only in an accepted form, for a why question → not numeric
  const why = challengeOf(it({ prompt_en: "Why is 4.8 ÷ 0.6 the same as 48 ÷ 6?", answer: "Multiply both by 10; the quotient stays 8.", acceptable: ["8"] }), t);
  assert.equal(why.ok, undefined);
  // … for a yes/no question → a yes/no challenge, not four number tiles
  const yn = challengeOf(it({ prompt_en: "Golu says 4 groups of 5 make 9. Is he right?", answer: "No. 4 groups of 5 make 20.", acceptable: ["no", "20"] }), t).ok;
  assert.equal(yn?.form, "yesno");
  assert.equal(yn.keyText, "no");
  // … for an offered choice → a choice
  const ch = challengeOf(it({ prompt_en: "Which is longer: 1 m or 90 cm?", answer: "1 m is longer.", acceptable: ["1 m"] }), t).ok;
  assert.equal(ch?.form, "choice");
  // a question that asks for a number keeps its numeric key from an accepted form
  const num = challengeOf(it({ prompt_en: "If c + 2 = 9, what is c?", answer: "c = 7", acceptable: ["7"] }), t).ok;
  assert.equal(num?.form, "numeric");
  // and the bank on disk has no numeric challenge whose answer head is not a number for a why / yes-no / which question
  const bank = build();
  for (const f of Object.values(bank.files)) for (const c of f.challenges) if (c.form === "numeric") assert.ok(!/^\s*(why|teach|explain)\b/i.test(c.prompt.en), c.id);
});

test("arena bank: every challenge on disk has exactly one key option; topics are admitted at the minimum; the bank is fresh", () => {
  const { files, index } = build();
  let n = 0;
  for (const f of Object.values(files)) for (const c of f.challenges) {
    n++;
    assert.equal(c.options.filter((o) => o.text === c.keyText).length, 1, c.id);
    assert.ok(c.options.length >= 2 && c.options.length <= 4, c.id);
    assert.equal(c.verified.agrees, true);
    if (c.hint) {
      const toks = c.hint.toLowerCase().split(/[^\p{L}\p{N}\p{M}/.,°%₹]+/u).map((x) => x.replace(/[.,]+$/, ""));
      if (c.form === "yesno") assert.doesNotMatch(c.hint, /^\s*(yes|no|true|false|haan|nahi|sahi|galat)\b/i, `${c.id}: hint opens with the verdict`);
      else assert.ok(!toks.includes(String(c.keyText).toLowerCase()), `${c.id}: hint states the key`);
    }
  }
  assert.ok(n > 2000, `${n} challenges`);
  for (const t of Object.values(index.topics)) assert.equal(t.eligible, t.challenges >= MIN_CHALLENGES);
  const disk = JSON.parse(readFileSync(new URL("../data/arena/index.json", import.meta.url), "utf8"));
  assert.deepEqual(disk.counts, index.counts, "data/arena is stale: run node server/play/tools/build-arena.mjs");
});

// main 2026-11-11 (c6-maths-ch07-t05 s3): a mixed number with the unit its word problem gives ("1 1/2 m") is a numeric key,
// and the key and its decoys share ONE shape: every option a proper mixed number, the same unit, the fraction part in lowest
// terms when the key's is. An option without the unit the others carry, an improper "1 7/2" or an unreduced "1 2/4" beside
// "1 1/4" is the odd one out, and a child can pick by form alone.
test("arena bank: a mixed number with a unit is a numeric key; its decoys are proper, in lowest terms, with the same unit", () => {
  for (const [k, unit] of [["1 1/2 m", "m"], ["2 3/4 litre", "litre"], ["7 1/2 km", "km"], ["3 2/3", ""]]) {
    const key = parseNum(k);
    assert.equal(key?.kind, "mixed", k);
    assert.equal(key.unit, unit, `${k}: unit`);
    const d = numericDecoys(key, [key.value], `t-${k}`);
    assert.equal(d.length, 3, `${k}: ${d}`);
    for (const x of d) {
      const m = /^(\d+) (\d+)\/(\d+)(?: (.+))?$/.exec(x);
      assert.ok(m, `${k}: decoy ${x} is a mixed number`);
      const [w, n, dd] = [+m[1], +m[2], +m[3]];
      assert.ok(w >= 1 && n >= 1 && n < dd, `${k}: decoy ${x} is proper`);
      const g = (a, b) => (b ? g(b, a % b) : a);
      if (g(key.n, key.d) === 1) assert.equal(g(n, dd), 1, `${k}: decoy ${x} in lowest terms`);
      assert.equal(m[4] ?? "", unit, `${k}: decoy ${x} keeps the unit`);
      assert.notEqual(parseNum(x).value, key.value, `${k}: decoy ${x} is wrong by value`);
    }
  }
  const c = challengeOf({ id: "x-i10", skillId: "x-s3", kind: "practice", prompt_en: "A ribbon is 3 1/4 m long. You cut off 1 3/4 m. How much is left?", answer: "1 1/2 m", verified: { agrees: true } }, { topicId: "x" });
  assert.ok(c.ok, JSON.stringify(c));
  assert.equal(c.ok.keyText, "1 1/2 m");
});

test("arena bank: on disk, every numeric challenge's options share one shape and one unit (no odd one out)", () => {
  const bad = [];
  for (const f of readdirSync(new URL("../data/arena/", import.meta.url)).filter((x) => /^c\d/.test(x))) {
    const bank = JSON.parse(readFileSync(new URL(`../data/arena/${f}`, import.meta.url), "utf8"));
    JSON.stringify(bank, (k, v) => {
      if (v && v.form === "numeric" && Array.isArray(v.options)) {
        const t = v.options.map((o) => o.text);
        const mixed = t.filter((x) => /^\d+ \d+\/\d+/.test(x)).length;
        if (mixed && mixed !== t.length) bad.push(`${v.id}: ${t.join(" ; ")}`);
        if (new Set(t.map((x) => x.replace(/^[-−₹\d\s/.,]+/, ""))).size > 1) bad.push(`unit ${v.id}: ${t.join(" ; ")}`);
      }
      return v;
    });
  }
  assert.deepEqual(bad, []);
});
