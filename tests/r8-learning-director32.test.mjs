// Learning 021 Part 1 (dc-r8-director32; docs/patches/to-learning/021-director32-own-reason-hindi-drawings-read.md): the checker's
// d33 rules. 1 the safety reader over every answer form (on for every script); 2 the whyAlt-as-help H lines; 3 a posing board that is
// its own answer (B lines; an error behind D33_READY / --d33); 4 the operation pairs (O lines); 5 joints.noPicture / joints.yourTurn.
// Each on small inline fragments and on the real scripts (the six live ones, staged c4-maths-ch01-t02, and the staged batch).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { answerForms, safetyHits, safetyErrors, SAFETY_STAGED_KNOWN, SAFETY_SEEN, whyAltHelpLines, operationPairs, operationsOf } from "../scripts/lesson-scripts/check.mjs";
import { scanSafety } from "../server/director/safety.js";

const HI = (hi, en = "x") => ({ hi, en });
const LIVE = ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c5-maths-ch02-t03", "c6-maths-ch06-t01", "c6-maths-ch07-t01"];
const load = (d, t) => JSON.parse(readFileSync(new URL(`../data/${d}/${t}.json`, import.meta.url), "utf8"));
const S = Object.fromEntries([...LIVE.map((t) => [t, load("lesson-scripts", t)]), ["c4-maths-ch01-t02", load("lesson-scripts-staged", "c4-maths-ch01-t02")]]);
const STAGED = readdirSync(new URL("../data/lesson-scripts-staged/", import.meta.url)).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
/** A one-skill fragment; `card` overrides the first explain card, `skill` the skill, `top` the script. */
const frag = ({ card = {}, skill = {}, top = {} } = {}) => ({
  topicId: "t-frag", terms: [], joints: {},
  skills: [{ skillId: "t-frag-s1", explain: [
    { id: "e1", point: HI("Yeh roti 2 barabar tukdon mein kati hai."), board: { template: "fraction-parts@1", params: { parts: 2, shade: 1, whole: "circle" } },
      ask: { prompt: HI("Rangin tukda roti ka kaunsa fraction hai?"), key: "1/2", accept: ["aadha"], ...card } },
  ], ...skill }],
  ...top,
});

// ---- 1 the safety reader
test("021 rule 1: every key, accept form and named wrong answer (string or list) of every keyed object is read", () => {
  const s = frag({ card: { wrongIfMis: ["2/1", "do"] }, skill: { checks: [{ id: "c1", prompt: HI("Kitne?"), key: "3", accept: ["teen"], wrongIfMis: "4" }],
    remediation: [{ targets: "m", then: { prompt: HI("Ab?"), key: "1/3", accept: [] } }], explain: [{ id: "e1", point: HI("x"), ask: { prompt: HI("y"), key: "1/2", accept: ["aadha"], wrongIfMis: ["2/1", "do"] }, quick: { prompt: HI("z"), key: "2" } }] },
    top: { teachback: { prompt: HI("Batao?"), key: "k" } } });
  const f = answerForms(s).map((x) => `${x.at} ${x.field} ${x.form}`);
  for (const x of ["t-frag-s1/e1 key 1/2", "t-frag-s1/e1 accept[0] aadha", "t-frag-s1/e1 wrongIfMis[0] 2/1", "t-frag-s1/e1 wrongIfMis[1] do",
    "t-frag-s1/c1 wrongIfMis 4", "t-frag-s1/c1 accept[0] teen", "t-frag-s1/remediation[0].then key 1/3", "t-frag-s1/explain[0].quick key 2", "teachback key k"]) assert.ok(f.includes(x), x);
});

test("021 rule 1: a form scanSafety marks is an error naming the card and the form; a clean form is not", () => {
  const bad = "I want to die";
  assert.equal(scanSafety(bad).distress, true); // (the frozen predicate, as the walk reads a reply)
  const e = safetyErrors(frag({ card: { accept: ["aadha", bad] } }));
  assert.equal(e.length, 1);
  assert.match(e[0], /t-frag-s1\/e1\.accept\[1\] "I want to die".*scanSafety self_harm.*Learning 021 rule 1/);
  assert.match(safetyErrors(frag({ card: { wrongIfMis: [bad] } }))[0], /t-frag-s1\/e1\.wrongIfMis\[0\]/);
  assert.deepEqual(safetyErrors(frag()), []);
});

test("021 rule 1: a SAFETY_SEEN word (\"blade\", the director32 steering trip scanSafety does not mark) is an error too, as a whole word", () => {
  assert.ok(SAFETY_SEEN.some((w) => w.word === "blade" && /steering/.test(w.seen)));
  assert.equal(scanSafety("chhote blade wali").distress, false); // (why the list exists: the model read tripped, the predicate does not)
  assert.match(safetyErrors(frag({ card: { accept: ["chhote blade wali"] } }))[0], /"chhote blade wali".*"blade" \(SAFETY_SEEN\)/);
  assert.deepEqual(safetyErrors(frag({ card: { accept: ["bladeless"] } })), []);
});

test("021 rule 1, real scripts: the six live scripts have no hit; c4-maths-ch01-t02's are the two blade forms of s2 remediation[0].then", () => {
  for (const t of LIVE) assert.deepEqual(safetyHits(S[t]), [], t);
  const h = safetyHits(S["c4-maths-ch01-t02"]).map((x) => `${x.at} ${x.form}`);
  assert.deepEqual(h, ["c4-maths-ch01-t02-s2/remediation[0].then 4 cm blade wali", "c4-maths-ch01-t02-s2/remediation[0].then chhote blade wali"]);
  assert.equal(safetyErrors(S["c4-maths-ch01-t02"]).length, 2); // (expected to fail until Part 2 E replaces the word)
});

test("021 rule 1, the staged batch: every hit outside c4-maths-ch01-t02 is on SAFETY_STAGED_KNOWN, and every entry is a live hit", () => {
  for (const t of STAGED.filter((x) => x !== "c4-maths-ch01-t02")) {
    const s = load("lesson-scripts-staged", t);
    assert.deepEqual(safetyErrors(s), [], t);
  }
  for (const k of SAFETY_STAGED_KNOWN) assert.ok(STAGED.includes(k.topicId) && !LIVE.includes(k.topicId) && k.topicId !== "c4-maths-ch01-t02", k.topicId);
});

// ---- 2 whyAlt as help (H lines)
test("021 rule 2: H+ an unmarked whyAlt that passes rule 9, H- one that names the key or an accepted form, H0 none; a marked clean one is not listed", () => {
  const one = (card) => whyAltHelpLines(frag({ card }));
  assert.match(one({ whyAlt: HI("Tumne rangin tukde nahi, saare tukde gine.") })[0], /^H\+ t-frag-s1\/e1: passes rule 9, unmarked: Tumne/);
  assert.match(one({ whyAlt: HI("Do mein se ek rangin hai, yaani 1/2.") })[0], /^H- t-frag-s1\/e1: fails rule 9: names "1\/2"/);
  assert.match(one({ whyAlt: HI("Yeh aadha hai.") })[0], /^H- .*"aadha"/);
  assert.deepEqual(one({}), ["H0 t-frag-s1/e1: no whyAlt"]);
  assert.deepEqual(one({ whyAlt: HI("Tumne rangin tukde nahi, saare tukde gine."), whyAltAsHelp: true }), []);
});

test("021 rule 2, real scripts: one H line at most per card, and every H- names a form", () => {
  for (const s of Object.values(S)) {
    const h = whyAltHelpLines(s), ats = h.map((x) => x.split(":")[0]);
    assert.equal(new Set(ats).size, ats.length, s.topicId);
    for (const x of h.filter((y) => y.startsWith("H-"))) assert.match(x, /names "/, x);
  }
});

// ---- 4 operation pairs (O lines)
test("021 rule 4: operations are read in Hinglish, English and signs; \"jodi\" (a pair) and \"bante\" (are made) are not operations", () => {
  assert.deepEqual(operationsOf("Bhujayein jodo."), ["add"]);
  assert.deepEqual(operationsOf("140 − 46 = 94"), ["subtract"]);
  assert.deepEqual(operationsOf("lambai aur chaudai ka guna"), ["multiply"]);
  assert.deepEqual(operationsOf("2 × 3 aur 15 ÷ 3"), ["multiply", "divide"]);
  assert.deepEqual(operationsOf("Roti barabar baanto."), ["divide"]);
  assert.deepEqual(operationsOf("ek jodi joote; teen group bante hain"), []);
});

test("021 rule 4: a point, remediation or covered sentence naming an operation is printed with the first later sentence naming it", () => {
  const s = frag({ skill: {
    explain: [{ id: "e1", point: HI("Parimap ke liye bhujayein jodte hain, guna nahi."), ask: { prompt: HI("Kitna dhaaga?"), key: "1" } },
      { id: "e2", point: HI("Ab dekho."), ask: { prompt: HI("2 × (3 + 4) kitna hai?"), key: "14" } }],
    remediation: [{ targets: "m", say: HI("Farsh ke liye ghatao."), then: { prompt: HI("Ab?"), key: "1" } }],
    covered: HI("Humne jodna seekha.") } });
  const o = operationPairs(s);
  assert.ok(o.includes("O t-frag-s1/explain[0].point [add]: Parimap ke liye bhujayein jodte hain, guna nahi. → t-frag-s1/explain[1].ask.prompt: 2 × (3 + 4) kitna hai?"), o.join("\n"));
  assert.ok(o.includes("O t-frag-s1/explain[0].point [multiply]: Parimap ke liye bhujayein jodte hain, guna nahi. → t-frag-s1/explain[1].ask.prompt: 2 × (3 + 4) kitna hai?"));
  assert.ok(o.includes("O t-frag-s1/remediation[0].say [subtract]: Farsh ke liye ghatao. → no later sentence names it"));
  assert.ok(o.some((x) => x.startsWith("O t-frag-s1/covered [add]")));
  assert.ok(!o.some((x) => x.includes("ask.prompt [")), "a card's prompt is not a source");
});

test("021 rule 4, real script: c6-maths-ch06-t01's \"guna sirf farsh batata hai\" is paired with the later 2 × (lambai + chaudai)", () => {
  const o = operationPairs(S["c6-maths-ch06-t01"]);
  assert.ok(o.some((x) => x.startsWith("O c6-maths-ch06-t01-s1/remediation[1].sayAlt [multiply]:") && x.includes("→ c6-maths-ch06-t01-s2/explain[1].pointAlt:") && x.includes("2 × (lambai + chaudai)")), o.join("\n"));
});
