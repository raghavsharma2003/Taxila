// Learning 020 Part 1 (dc-r8-director31; docs/patches/to-learning/020-director31-hindi-rules-and-rewrites.md): the checker's new rule set,
// d32Errors. One test per rule, each on a small inline script fragment that fails it and one that passes it; and one that holds the
// seven scripts to the gate now that D32_READY and D32_PICTURES_READY list them all.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { d32Errors, D32_READY, D32_PICTURES_READY, isD32, structureErrors, kitTopic, scriptOf, hindiOverlap, HINDI_OVERLAP_MAX, POINT_TURN_MAX,
  FIRST_TEACH_MAX, ASK_WHOLE_REQUIRED, d32Listing, viewOf, twoWayOptions, d31Errors } from "../scripts/lesson-scripts/check.mjs";
import { INTERESTS } from "../server/persona/signals.js";

const HI = (hi, en = "x") => ({ hi, en });
const words = (n, w = "shabd") => Array.from({ length: n }, () => w).join(" ");
const VIEWED = { template: "fraction-parts@1", params: { parts: 2, shade: 1, whole: "circle" } }; // a board with a second view
const BARE = { template: "shade-grid@1", params: { rows: 2, cols: 2, shade: 1 } }; // one with none
/** A one-skill fragment; `card` and `skill` override the first explain card and the skill. */
const frag = ({ card = {}, skill = {}, top = {} } = {}) => ({
  topicId: "t-frag", terms: [], joints: {},
  skills: [{ skillId: "t-frag-s1", explain: [
    { id: "e1", point: HI("Yeh roti 2 barabar tukdon mein kati hai."), board: VIEWED, ask: { prompt: HI("Rangin tukda roti ka kaunsa fraction hai?"), key: "1/2", accept: ["aadha"], ...card } },
  ], ...skill }],
  ...top,
});
const run = (s) => d32Errors(s, { force: true });
const ruled = (s, n) => run(s).filter((x) => x.includes(`Learning 020 rule ${n})`) || x.includes(`Learning 020 rule ${n},`));

// (repinned d32, 2026-11-19: the two staged scripts were rewritten and Studio 014 gave the boards their views, so D32_READY and
// D32_PICTURES_READY hold all seven and the picture rule no longer waits. The gate is kept honest by a staged script outside the lists:
// off on the gate, and the rules still bite when forced)
test("020 the gate: on for the five live scripts and the two rewritten staged ones, the picture rule with them; off for a script not listed", () => {
  const live = ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c5-maths-ch02-t03", "c6-maths-ch06-t01"];
  const staged = ["c4-maths-ch01-t02", "c6-maths-ch07-t01"];
  assert.deepEqual(D32_READY, [...live, ...staged]);
  assert.deepEqual(D32_PICTURES_READY, [...live, ...staged]); // (rule 7 is on for all seven)
  const stagedOf = (t) => JSON.parse(readFileSync(new URL(`../data/lesson-scripts-staged/${t}.json`, import.meta.url), "utf8"));
  const scripts = [...live.map((t) => scriptOf(t)), ...staged.map(stagedOf)];
  for (const s of scripts) {
    Object.defineProperty(s, "__interests", { value: INTERESTS, enumerable: false });
    assert.equal(isD32(s), true, s.topicId);
    assert.deepEqual(d32Errors(s), [], s.topicId); // (clean on the gate)
    assert.deepEqual(run(s), [], `${s.topicId}: clean when forced too, rule 7 included`);
    assert.equal(structureErrors(s, kitTopic(s.topicId)).length, 0, s.topicId);
  }
  const off = stagedOf("c4-maths-ch03-t01");
  Object.defineProperty(off, "__interests", { value: INTERESTS, enumerable: false });
  assert.equal(isD32(off), false, "a staged script not yet rewritten is off");
  assert.deepEqual(d32Errors(off), [], "off on the gate");
  assert.ok(run(off).length > 0, "the rules do bite on it when forced");
});

test("020 rule 1: a hindi form that shares most of its content words with the card fails; another sentence passes; samkon fails", () => {
  const copy = frag({ card: { hindi: HI("Rangin tukda poori roti ka kaunsa fraction hai?") } });
  assert.ok(hindiOverlap(copy.skills[0].explain[0].ask, copy).share > HINDI_OVERLAP_MAX);
  assert.equal(ruled(copy, 1).length, 1);
  const other = frag({ card: { hindi: HI("Jis hisse mein rang bhara hai, use kaise likhoge?") } });
  assert.deepEqual(ruled(other, 1), []);
  // (numbers, names and the script's terms are not content words)
  const named = frag({ card: { prompt: HI("Mohit ne 3/4 fraction khaya, kitna bacha?"), hindi: HI("Mohit ke paas 3/4 fraction tha; ab haath mein kya raha?") } });
  assert.deepEqual(ruled({ ...named, terms: [HI("bhinn", "fraction")] }, 1), []);
  // (no hindi form at all is not an error here: it is a hole)
  assert.deepEqual(ruled(frag(), 1), []);
  const samkon = frag({ top: { terms: [HI("samkon", "right angle")] }, card: { hindi: HI("Kya yeh kona samkon jaisa dikhta hai?") } });
  assert.ok(ruled(samkon, 1).some((x) => /"samkon"/.test(x)));
  assert.ok(!ruled({ ...samkon, terms: [] }, 1).some((x) => /"samkon"/.test(x)));
});

test("020 rule 2: the hindiSwitch forms promise only Hindi", () => {
  const bad = frag({ top: { joints: { hindiSwitch: [HI("Theek hai, ise aasaan shabdon mein kehti hoon."), HI("Haan, seedhe bolti hoon."), HI("Achha, doosre shabdon mein.")] } } });
  assert.equal(ruled(bad, 2).length, 3);
  const good = frag({ top: { joints: { hindiSwitch: [HI("Theek hai, Hindi mein poochhti hoon."), HI("Haan, Hindi mein bolti hoon."), HI("Achha, Hindi mein.")] } } });
  assert.deepEqual(ruled(good, 2), []);
});

test("020 rule 3: no false rule about unequal pieces; --rules lists the rule sentences for the reader", () => {
  const bad = frag({ skill: { covered: HI("Aaj dekha ki sirf barabar tukdon ka fraction naam hota hai."),
    remediation: [{ targets: "m", say: HI("Rassi teen ulte-seedhe tukdon mein kati, isliye in tukdon ka fraction naam nahi hota.") }] } });
  assert.equal(ruled(bad, 3).length, 2);
  const tabhi = frag({ top: { wrap: { covered: HI("1/3 tabhi kehte hain jab teeno hisse barabar hon.") } } });
  assert.equal(ruled(tabhi, 3).length, 1);
  const good = frag({ skill: { covered: HI("Tukde barabar na hon, toh ginti se unka naam nahi rakh sakte.") } });
  assert.deepEqual(ruled(good, 3), []);
  const listing = d32Listing(frag({ skill: { covered: HI("Neeche wala number hamesha saare tukde ginta hai. Upar rangin.") } }));
  assert.deepEqual(listing.filter((x) => x.startsWith("R ")), ["R t-frag-s1/covered: Neeche wala number hamesha saare tukde ginta hai."]);
});

test("020 rule 4: reask on every asked worked step and the teachback; told on every worked step", () => {
  const we = (step, teachback) => frag({ skill: { workedExample: { problem: HI("Barfi ke 5 tukde."), board: VIEWED, steps: [step] } }, top: { teachback } });
  const ask = { prompt: HI("Neeche kaunse tukde ginoge?"), key: "saare", accept: [] };
  const tb = { prompt: HI("Kaunsa fraction hai?"), key: "1/2", accept: [] };
  const bad = we({ ask, do: HI("Neeche saare tukde"), result: "5", why: HI("x") }, tb);
  const e = ruled(bad, 4);
  assert.equal(e.length, 3);
  for (const want of [/steps\[0\]\.ask\.reask: \{ hi, en \}/, /steps\[0\]\.told: \{ hi, en \}/, /^teachback\.reask: \{ hi, en \}/]) assert.ok(e.some((x) => want.test(x)), String(want));
  const same = we({ ask: { ...ask, reask: ask.prompt }, told: HI("Neeche saare tukde gine: 5?"), do: HI("x"), result: "5", why: HI("x") }, { ...tb, reask: HI("Yeh fraction kaunsa hai?") });
  assert.ok(run(same).some((x) => /ask\.reask: the question's own words/.test(x)));
  assert.ok(run(same).some((x) => /told: asks nothing/.test(x)));
  const good = we({ ask: { ...ask, reask: HI("Saare tukde ginoge ya sirf khaye hue?", "All or only the eaten?") }, told: HI("Neeche wala number saare 5 tukde ginta hai."), do: HI("x"), result: "5", why: HI("x") }, { ...tb, reask: HI("Yeh fraction kaunsa hai?", "Which fraction is it?") });
  assert.deepEqual(ruled(good, 4), []);
});

test("020 rule 5: no two cards of a script end on the same last sentence", () => {
  const two = (p2) => frag({ skill: { checks: [{ id: "c1", prompt: p2, key: "haan", accept: [], board: VIEWED }] } , card: { prompt: HI("Riya kehti hai 1/2. Kya yeh sahi hai?") } });
  assert.equal(ruled(two(HI("Zoya kehti hai 1/3. Kya yeh sahi hai?")), 5).length, 1);
  assert.deepEqual(ruled(two(HI("Zoya kehti hai 1/3. Zoya theek keh rahi hai?")), 5), []);
});

test("020 rule 6: short reason + point + card at most 62, unless listed whole; the first teaching turn at most 75", () => {
  const s = (pointWords, hook = 10) => ({
    topicId: "t-frag", terms: [], joints: { startAnyway: [HI("Chalo, main batati hoon."), HI("Theek hai."), HI("Achha.")] },
    skills: [{ skillId: "t-frag-s1", hook: { interestSlots: [{ interest: "games", use: HI(words(hook)) }] }, explain: [
      { id: "e1", point: HI(words(20)), board: VIEWED, ask: { prompt: HI(`${words(9)}?`), key: "1/2", accept: [], whyShort: HI(words(8)) } },
      { id: "e2", point: HI(words(pointWords)), board: VIEWED, ask: { prompt: HI(`${words(14)}?`), key: "1/3", accept: [] } },
    ] }],
  });
  assert.equal(POINT_TURN_MAX, 62); assert.equal(FIRST_TEACH_MAX, 75);
  assert.deepEqual(ruled(s(40), 6), []); // 8 + 40 + 14 = 62
  assert.ok(ruled(s(41), 6).some((x) => /e2: short reason 8 \+ point 41 \+ card 14 = 63 words > 62/.test(x)));
  // (hook 10 + startAnyway 4 + point 20 + card 9 = 43; a 43-word hook takes it to 76)
  assert.deepEqual(ruled(s(40, 42), 6), []);
  assert.ok(ruled(s(40, 43), 6).some((x) => /e1: the first teaching turn \(hook 43 \+ startAnyway 4 \+ point 20 \+ card 9\) is 76 words > 75/.test(x)));
});

test("020 rule 7: a card whose board has no second view needs a pictureBoard with its pictureCaption", () => {
  assert.ok(viewOf(VIEWED)); assert.equal(viewOf(BARE), null);
  assert.deepEqual(ruled(frag(), 7), []);
  const bare = frag({ card: { board: BARE } });
  assert.ok(ruled(bare, 7).some((x) => /e1: its board \(shade-grid@1\) has no second view/.test(x)));
  const drawn = frag({ card: { board: BARE, pictureBoard: VIEWED, pictureCaption: HI("Wahi baat ek gol roti par: aadha rangin.") } });
  assert.deepEqual(ruled(drawn, 7), []);
  const noCaption = frag({ card: { board: BARE, pictureBoard: { template: "no-such@1", params: {} } } });
  assert.ok(run(noCaption).some((x) => /pictureBoard: \{ template, params \} with a known template/.test(x)));
  assert.ok(run(noCaption).some((x) => /pictureCaption: \{ hi, en \}/.test(x)));
});

test("020 rule 8: askWhole is required on the listed cards; --rules lists the candidates", () => {
  assert.deepEqual(ASK_WHOLE_REQUIRED[0], { topicId: "c4-maths-ch05-t01", skillId: "c4-maths-ch05-t01-s1", card: "e3" });
  const s = JSON.parse(JSON.stringify(scriptOf("c4-maths-ch05-t01")));
  delete s.skills[0].explain[2].ask.askWhole; // (the live script carries it since its 020 pass)
  assert.ok(ruled(s, 8).some((x) => /s1\/e3: short ask marker missing/.test(x)));
  s.skills[0].explain[2].ask.askWhole = true;
  assert.deepEqual(ruled(s, 8), []);
  const cand = frag({ card: { prompt: HI("Agar ek aur tukda rang do, toh kaunsa fraction hoga?") } });
  assert.equal(d32Listing(cand).filter((x) => x.startsWith("A ")).length, 1);
  assert.equal(d32Listing(frag({ card: { prompt: HI("Agar ek aur tukda rang do, toh kaunsa fraction hoga?"), askWhole: true } })).filter((x) => x.startsWith("A ")).length, 0);
});

test("020 rule 9: whyAltAsHelp only where whyAlt names no answer", () => {
  const bad = frag({ card: { whyAltAsHelp: true, whyAlt: HI("Rangin tukda aadha hai, kyunki 2 mein se 1.") } });
  assert.ok(ruled(bad, 9).some((x) => /whyAlt: said as help, it names "aadha"/.test(x)));
  const good = frag({ card: { whyAltAsHelp: true, whyAlt: HI("Poori roti ke tukde gino, phir rang wale.") } });
  assert.deepEqual(ruled(good, 9), []);
  assert.deepEqual(ruled(frag({ card: { whyAlt: HI("Rangin tukda aadha hai.") } }), 9), []); // (not said as help: not checked)
});

test("020 rule 10: a card's simpler and reask name no answer; a two-way card's hint never leaves one option", () => {
  assert.ok(ruled(frag({ card: { simpler: HI("Socho: aadha hi hai na.") } }), 10).some((x) => /simpler: names the answer "aadha"/.test(x)));
  assert.ok(ruled(frag({ card: { reask: HI("Yeh 1/2 hai, toh rangin kitna?") } }), 10).some((x) => /reask: names the answer "1\/2"/.test(x)));
  assert.deepEqual(ruled(frag({ card: { simpler: HI("Saare tukde gino, phir rangin.") } }), 10), []);
  // (a two-way card: naming one option and not the other fails; naming both, or neither, passes)
  const tw = (simpler) => frag({ card: { prompt: HI("Bada tukda laddoo ka 1/2 hai ya 1/3?"), key: "1/2", accept: ["aadha"], simpler: HI(simpler) } });
  assert.deepEqual(twoWayOptions(tw("x").skills[0].explain[0].ask), ["1/2", "1/3"]);
  assert.ok(ruled(tw("Socho, kya bada tukda 1/3 jitna chhota hai?"), 10).some((x) => /leaves one option: names "1\/3" and not "1\/2"/.test(x)));
  assert.deepEqual(ruled(tw("Bade tukde ko baaki do ke saath milao."), 10), []);
  assert.deepEqual(ruled(tw("Dekho, 1/2 ke paas hai ya 1/3 ke?"), 10), []);
  // (three options are not a two-way card)
  assert.equal(twoWayOptions({ prompt: HI("Tukda 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?"), key: "kam", accept: ["kam"] }), null);
});

test("020: no wrap.ack form promises to remember", () => {
  const ack = (hi) => frag({ top: { wrap: { ack: [HI(hi)] } } });
  assert.ok(run(ack("Theek hai, main yeh yaad rakhungi.")).some((x) => /wrap\.ack\[0\]: "yaad rakh/.test(x)));
  assert.ok(!run(ack("Hmm, samajh gayi, batane ke liye shukriya.")).some((x) => /wrap\.ack/.test(x)));
});
