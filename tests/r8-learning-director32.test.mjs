// Learning 021 Part 1 (dc-r8-director32; docs/patches/to-learning/021-director32-own-reason-hindi-drawings-read.md): the checker's
// d33 rules. 1 the safety reader over every answer form (on for every script); 2 the whyAlt-as-help H lines; 3 a posing board that is
// its own answer (B lines; an error behind D33_READY / --d33); 4 the operation pairs (O lines); 5 joints.noPicture / joints.yourTurn.
// Each on small inline fragments and on the real scripts (the six live ones, staged c4-maths-ch01-t02, and the staged batch).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { answerForms, safetyHits, safetyErrors, SAFETY_STAGED_KNOWN, SAFETY_SEEN, whyAltHelpLines, operationPairs, operationsOf,
  boardAnswerCards, boardAnswerLines, partCountsOf, d33Errors, d33JointErrors, D33_READY, isD33, D33_JOINTS } from "../scripts/lesson-scripts/check.mjs";
import { scanSafety } from "../server/director/safety.js";

const HI = (hi, en = "x") => ({ hi, en });
// (the six live at director32; c4-maths-ch01-t02, live since to-brain 052, is read from data/lesson-scripts beside them in S)
const LIVE = ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c5-maths-ch02-t03", "c6-maths-ch06-t01", "c6-maths-ch07-t01"];
const load = (d, t) => JSON.parse(readFileSync(new URL(`../data/${d}/${t}.json`, import.meta.url), "utf8"));
const S = Object.fromEntries([...LIVE.map((t) => [t, load("lesson-scripts", t)]), ["c4-maths-ch01-t02", load("lesson-scripts-staged", "c4-maths-ch01-t02")]]); // (director35 clause 53, release 61: c4-maths-ch01-t02 staged again)
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
  // (d33, 2026-11-23: the rewrite replaced the blade word, so c4-maths-ch01-t02 has no hit now; that "chhote blade wali" is caught stays
  //  pinned on the fragment in the test above)
  assert.deepEqual(h, []);
  assert.equal(safetyErrors(S["c4-maths-ch01-t02"]).length, 0);
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
  // (d33, 2026-11-23: the rewrite dropped "guna sirf farsh batata hai"; the s1 remediation[1] sayAlt's guna, "lambai aur chaudai ka guna farsh
  //  par bichhe 1 m wale square ginta hai", now pairs with the first later sentence naming a multiplication, its then-card's whyAlt "14 × 9 ...")
  assert.ok(o.some((x) => x.startsWith("O c6-maths-ch06-t01-s1/remediation[1].sayAlt [multiply]:") && x.includes("guna farsh par") && x.includes("→ c6-maths-ch06-t01-s1/remediation[1].then.whyAlt:") && x.includes("14 × 9")), o.join("\n"));
});

// ---- 3 a posing board that is its own answer (B lines; an error behind D33_READY / --d33)
const BAR = (...parts) => ({ template: "fraction-bars@1", params: { bars: parts.map((p) => ({ parts: p, shade: 0, label: "" })) } });
const LINE = (dens) => ({ template: "fraction-line@1", params: { dens, from: 0, to: 1 } });
const posed = (prompt, board, key = "aadhe se chhota") => frag({ card: { prompt: HI(prompt), key, accept: [], board } });

test("021 rule 3: the parts a board draws are counted per drawn thing", () => {
  assert.deepEqual(partCountsOf(BAR(2, 4)), [2, 4]);
  assert.deepEqual(partCountsOf(LINE([7, 8])), [7, 8]);
  assert.deepEqual(partCountsOf({ template: "fraction-line@1", params: { den: 4, from: 0, to: 2 } }), [8]);
  assert.deepEqual(partCountsOf({ template: "shade-grid@1", params: { rows: 2, cols: 3 } }), [6]);
  assert.deepEqual(partCountsOf({ template: "angle@1", params: {} }), []);
});

test("021 rule 3: a cut the card tells the child to make, already drawn, is caught; a given cut and an undrawn one are not", () => {
  const cut = "Isi patti ko ab 4 barabar tukdon mein kaato. Tab ek tukda aadhe se chhota hoga ya bada?";
  assert.deepEqual(boardAnswerCards(posed(cut, BAR(2, 4))).map((x) => [x.at, x.kind, x.n]), [["t-frag-s1/e1", "cut", 4]]);
  assert.deepEqual(boardAnswerCards(posed(cut, BAR(2))), []);
  assert.deepEqual(boardAnswerCards(posed("Doosri patti 4 barabar hisson mein kati hai. Ek hissa bada hai ya chhota?", BAR(2, 4))), []);
  assert.equal(boardAnswerCards(posed("Is 15 cm ki patti ke 3 barabar hisse karne hain. Har hissa kitne cm?", BAR(3), "5 cm")).length, 1);
});

test("021 rule 3: a count card whose board draws exactly the key's number of parts is caught; another count is not", () => {
  const q = "Us taraf kitne barabar gaps bane hain?";
  assert.deepEqual(boardAnswerCards(posed(q, LINE([7, 8]), "8")).map((x) => [x.kind, x.n]), [["count", 8]]);
  assert.deepEqual(boardAnswerCards(posed(q, LINE([7]), "8")), []);
  assert.deepEqual(boardAnswerCards(posed("Kitne tukde rangeen hain?", BAR(6), "1/6")), []); // (a fraction key is not a count)
});

// (d33, 2026-11-23: the rewrites cleared the five boards the rule caught — c4 s3 e1, c5-t01 s1 e2 and its s1 asked step, c6-ch07-t01 s1 e2
//  and s3 e3 — so the real scripts catch none; the rule is shown biting on a real card by posing c4 s3 e1, which still tells the child to
//  cut the strip into 4, over the old kind of board that already draws the 4)
const C4_CUT_OVER_4 = () => {
  const s = JSON.parse(JSON.stringify(S["c4-maths-ch05-t01"]));
  const e1 = s.skills[2].explain[0];
  assert.match(e1.ask.prompt.hi, /4 barabar tukdon mein kaat/);
  e1.ask.board = { template: "fraction-bars@1", params: { bars: [{ parts: 2, shade: 1, label: "" }, { parts: 4, shade: 0, label: "" }] } };
  return s;
};
test("021 rule 3, real scripts: the rewrites leave no board that is its own answer; a real cut card over a drawn cut is caught", () => {
  const all = Object.values(S).flatMap((s) => boardAnswerCards(s).map((x) => x.at));
  assert.deepEqual(all, []);
  const s = C4_CUT_OVER_4();
  assert.deepEqual(boardAnswerCards(s).map((x) => [x.at, x.kind, x.n]), [["c4-maths-ch05-t01-s3/e1", "cut", 4]]);
  assert.match(boardAnswerLines(s)[0], /^B c4-maths-ch05-t01-s3\/e1 \[cut 4\] over fraction-bars@1/);
});

// (d33, 2026-11-23: D33_READY holds the nine rewrites — the six live, then the three staged — and every one is clean on it; a staged
//  script not rewritten stays off and passes. Forced, a caught card is still an error, shown on the real cut card posed over its cut)
test("021 rule 3 and 5: D33_READY holds the nine rewrites and none fails on it; forced (as --d33), the caught cards are errors", () => {
  assert.deepEqual(D33_READY, [...LIVE, "c4-maths-ch01-t02", "c4-maths-ch06-t01", "c6-maths-ch07-t03"]);
  for (const s of Object.values(S)) { assert.equal(isD33(s), true, s.topicId); assert.deepEqual(d33Errors(s), [], s.topicId); }
  // (director36, 2026-11-25: c6-maths-ch07-t03 live after two passing runs, clause 71): read from data/lesson-scripts
  for (const [d, t] of [["lesson-scripts-staged", "c4-maths-ch06-t01"], ["lesson-scripts", "c6-maths-ch07-t03"]]) { const s = load(d, t); assert.equal(isD33(s), true, t); assert.deepEqual(d33Errors(s), [], t); }
  const off = load("lesson-scripts-staged", "c4-maths-ch03-t01");
  assert.equal(isD33(off), false, "a staged script not rewritten is off");
  assert.deepEqual(d33Errors(off), [], "off on the gate");
  const e = d33Errors(C4_CUT_OVER_4(), { force: true });
  assert.ok(e.some((x) => x.startsWith("c4-maths-ch05-t01-s3/e1: its posing board (fraction-bars@1) already draws the 4 parts") && x.includes("Learning 021 rule 3")), e.join("\n"));
  // (d33, 2026-11-23: the rewritten c4 now carries both joints; that forced makes them required is shown on the staged script without them)
  assert.ok(!e.some((x) => x.startsWith("joints.noPicture")), "c4 carries its joints now");
  assert.ok(d33Errors(off, { force: true }).some((x) => x.startsWith("joints.noPicture: 3 forms")), "forced, the new joints are required");
});

// ---- 5 joints.noPicture, joints.yourTurn
const J = (noPicture, yourTurn) => frag({ top: { joints: { noPicture, yourTurn } } });
const GOOD_NP = [HI("Iska koi aur chitra nahi hai.", "There is no other drawing of this."), HI("Is sawaal ka bas yahi board hai.", "This board is the only one for this question."), HI("Yahan doosra chitra nahi hai.", "There is no other drawing here.")]; // (to-brain 052 A6: "no second picture" is the predicates' refusal shape)
const GOOD_YT = [HI("Ab tumhari baari, apna jawab bolo.", "Your turn now, say your answer."), HI("Tum batao, main sun rahi hoon.", "You tell me, I am listening."), HI("Jo socha hai, woh bolo.", "Say what you thought.")];

test("021 rule 5: well-formed noPicture and yourTurn pass; absent is fine off D33_READY and required on it", () => {
  assert.deepEqual(D33_JOINTS, ["noPicture", "yourTurn"]);
  assert.deepEqual(d33JointErrors(J(GOOD_NP, GOOD_YT), { required: true }), []);
  assert.deepEqual(d33JointErrors(frag()), []);
  assert.deepEqual(d33JointErrors(frag(), { required: true }).map((x) => x.split(":")[0]), ["joints.noPicture", "joints.yourTurn"]);
});

test("021 rule 5: three forms; each a statement under 14 words in hi and en; noPicture names no number and promises nothing", () => {
  const e = (np, yt = GOOD_YT) => d33JointErrors(J(np, yt));
  assert.match(e(GOOD_NP.slice(0, 2))[0], /joints\.noPicture: 3 forms \(got 2\)/);
  assert.match(e(GOOD_NP, [GOOD_YT[0], GOOD_YT[1], HI("Ab tum batao?", "You tell?")])[0], /joints\.yourTurn\[2\]: asks nothing/);
  assert.match(e([GOOD_NP[0], GOOD_NP[1], HI("Yahan 4 hisse hain.", "There are no other drawings.")])[0], /noPicture\[2\]: names a number \("4"\)/);
  assert.match(e([GOOD_NP[0], GOOD_NP[1], HI("Yeh baad mein dikhaungi.", "No other drawing.")])[0], /"baad mein" promises/);
  for (const w of ["phir", "yaad"]) assert.ok(e([GOOD_NP[0], GOOD_NP[1], HI(`Chitra ${w} nahi.`, "No other drawing.")]).some((x) => x.includes(`"${w}" promises`)), w);
  const long = HI(Array.from({ length: 14 }, () => "shabd").join(" ") + ".", "Short.");
  assert.match(e([GOOD_NP[0], GOOD_NP[1], long])[0], /noPicture\[2\]: 14 words > 13/);
  assert.match(e(GOOD_NP, [GOOD_YT[0], GOOD_YT[1], HI("", "x")])[0], /yourTurn\[2\]: empty/);
});
