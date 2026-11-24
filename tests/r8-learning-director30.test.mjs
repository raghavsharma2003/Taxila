// Learning 019 Part 1 (dc-r8-director30 items 2, 5's joint, 6; docs/patches/to-learning/019-director30-pilots-list-and-first-three.md):
// the checker's new rules on the four pilots. Every card the child answers has a plain-Hindi form of its question (`hindi`): the same
// numbers and slots, no answer the question does not state, no English connective or verb; joints.afterWorked; an asked step's easier
// wording never states the step's answer; the wrap says "achha laga" once at most; a card that accepts an equal fraction in other
// numbers says so in its why; `--since` lists every changed part with its board.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { scriptOf, d31Errors, hindiCards, hindiFormErrors, stepSimplerHits, equalForms, changedParts, sinceReport, partsOf,
  D29_PILOTS, STANDARD_STAGED, AFTER_WORKED_MAX, HINDI_FORM_ENGLISH } from "../scripts/lesson-scripts/check.mjs";

const fresh = (t) => JSON.parse(JSON.stringify(scriptOf(t)));
const S = Object.fromEntries(D29_PILOTS.map((t) => [t, scriptOf(t)]));

test("019: the four pilots pass the new rules", () => {
  for (const [t, s] of Object.entries(S)) assert.deepEqual(d31Errors(s), [], t);
});

test("019 A.1, as 020 rule 1 left it: a hindi form is optional (a card with no honest plainer sentence has none); one that is written is whole and ends on its question", () => {
  for (const [t, s] of Object.entries(S)) {
    const cards = hindiCards(s);
    // (a floor on each script's size: the four pilots 30 or more; c5-maths-ch02-t03, live as judged in dc-r8-director31, has 29)
    // (c6-maths-ch07-t01, live as judged in director32, has 27)
    // (c4-maths-ch01-t02, live since to-brain 052, has 28)
    assert.ok(cards.length >= ({ "c5-maths-ch02-t03": 29, "c6-maths-ch07-t01": 27, "c4-maths-ch01-t02": 28 }[t] ?? 30), `${t}: ${cards.length} cards`);
    for (const { at, card } of cards) {
      if (!card.hindi) continue; // (optional now)
      assert.ok(card.hindi?.hi && card.hindi?.en, `${t} ${at}`);
      assert.match(card.hindi.hi.trim(), /\?$/, `${t} ${at}: ends on the question`);
    }
    // (the walk's kinds: explain cards, follow-ups, checks, asked steps, the own step, the closing question)
    for (const re of [/\/e\d\.ask$/, /remediation\[\d\]\.then$/, /\/c\d$/, /steps\[\d\]\.ask$/, /yourStep$/, /^teachback$/]) assert.ok(cards.some((c) => re.test(c.at)), `${t}: ${re}`);
  }
  // (dc-r8-director31 / 020 rule 1: the form is optional, so a script with none on a card is not failed for it, and every kind of card
  //  must still exist in hindiCards, form or not: the walk lists cards, not forms)
});

test("019 A.1: the form keeps the question's numbers and slots exactly and names no answer the question does not state", () => {
  const s = fresh("c4-maths-ch05-t01");
  const c2 = s.skills[0].checks[1]; // 12 pieces, 1/12 eaten, key 11
  c2.hindi = { hi: "Tumhari chocolate ke 12 tukde hain, aur tumne ek kha liya. Ab kitne bache?", en: "x?" };
  assert.ok(hindiFormErrors(c2, "c2").some((x) => /the numbers of the question exactly \(question 1\/12, 12; form 12\)/.test(x)));
  c2.hindi = { hi: "Tumhari chocolate mein 12 barabar tukde hain, aur tumne 1/12 kha liya, toh 11 bache na?", en: "x?" };
  assert.ok(hindiFormErrors(c2, "c2").some((x) => /names the answer "11"|the numbers of the question exactly/.test(x)));
  // (d33, 2026-11-23: the c4 rewrite's s3 e3 has no {friend} slot now; the slot case moves to c5-t01's s2 c3, a {friend} card, with an
  //  honest en so that only the hi's dropped slot is caught, and the same form with the slot kept as the control)
  const e3 = fresh("c5-maths-ch02-t01").skills[1].checks[2]; // {friend}
  assert.match(e3.prompt.hi, /\{friend\}/);
  const en = "{friend} says 3/4 is two numbers, 3 and 4. On the line from 0 to 1, how many marks will you put your finger on to show 3/4?";
  e3.hindi = { hi: "Ravi ka kehna hai ki 3/4 do number hain, 3 aur 4. 0 se 1 ki line par 3/4 dikhane ke liye kitne mark par ungli rakhoge?", en };
  assert.ok(hindiFormErrors(e3, "e3").includes("e3.hindi: the question's slots exactly"), hindiFormErrors(e3, "e3").join(" | "));
  e3.hindi = { hi: "{friend} ka kehna hai ki 3/4 do number hain, 3 aur 4. 0 se 1 ki line par 3/4 dikhane ke liye kitne mark par ungli rakhoge?", en };
  assert.ok(!hindiFormErrors(e3, "e3").some((x) => /slots exactly/.test(x)), hindiFormErrors(e3, "e3").join(" | "));
  // (a word answer: c5-t02's "Neha ke paas kam" for a card that asks "kam ya zyada?")
  // (d35 closing: the card's question now says "kam hai ya zyada" itself, so the live card states it; the case is held on the card as it was,
  // tests/fixtures/scripts-023/before-d35 — git df9ed5591)
  const t2 = JSON.parse(readFileSync(new URL("./fixtures/scripts-023/before-d35/c5-maths-ch02-t02.json", import.meta.url), "utf8")), then = t2.skills[1].remediation[0].then;
  then.hindi = { hi: "Do ek jaise ribbon hain, dono 7 barabar hisson mein kate. Neha ne ek se 3 liye aur Gopi ne doosre se 6, toh Neha ke paas kam hai ya zyada?", en: "x?" };
  assert.ok(hindiFormErrors(then, "then").some((x) => /names the answer "kam hai"/.test(x)));
  // (a yes and a no offered together are a choice, not an answer)
  const e4 = fresh("c4-maths-ch05-t01").skills[0].explain[3].ask;
  e4.hindi = { hi: "Doosri patti ke 6 barabar tukde hain; Raju ne 1 liya aur 5 bache. Raju bolta hai usne 1/5 liya kyunki 5 bache, haan ya nahi?", en: "x?" };
  assert.deepEqual(hindiFormErrors(e4, "e4").filter((x) => /names the answer/.test(x)), []);
});

test("019 A.1: English stays only where it is the school's word: no English connective or verb in the hi, and not the card's own words", () => {
  for (const w of ["equal parts", "what fraction", "and", "the side", "how many"]) assert.ok(HINDI_FORM_ENGLISH.test(`Yeh ${w} hai?`), w);
  for (const w of ["fraction", "line", "rectangle", "cm", "is chocolate", "group", "gap"]) assert.ok(!HINDI_FORM_ENGLISH.test(`Yeh ${w} hai?`), w);
  const s = fresh("c6-maths-ch06-t01"), c3 = s.skills[1].checks[2];
  c3.hindi = { hi: "Ek square tile ki side 11 cm hai. Tile ka parimap kitna hai?", en: "x?" };
  assert.ok(hindiFormErrors(c3, "c3").some((x) => /"side" is English/.test(x)));
  c3.hindi = { hi: c3.prompt.hi, en: c3.prompt.en };
  assert.ok(hindiFormErrors(c3, "c3").some((x) => /the same words as the card/.test(x)));
});

test("019 A.2: joints.afterWorked — three forms of six words or fewer, asking nothing, no number or slot", () => {
  for (const [t, s] of Object.entries(S)) {
    const f = s.joints.afterWorked;
    assert.equal(f.length, 3, t);
    for (const x of f) for (const l of ["hi", "en"]) {
      assert.ok(x[l].split(/\s+/).length <= AFTER_WORKED_MAX, `${t} ${x[l]}`);
      assert.ok(!/[?\d{]/.test(x[l]), `${t} ${x[l]}`);
    }
  }
  const s = fresh("c5-maths-ch02-t01");
  s.joints.afterWorked[1] = { hi: "Ab yeh sawaal tum akele karke dikhao?", en: "Now do this one alone?" };
  const e = d31Errors(s);
  assert.ok(e.some((x) => /joints\.afterWorked\[1\]: 7 words > 6/.test(x)) && e.some((x) => /joints\.afterWorked\[1\]: asks nothing/.test(x)), e.join("\n"));
  delete s.joints.afterWorked;
  assert.ok(d31Errors(s).some((x) => /joints\.afterWorked: 3 forms \(got 0/.test(x)));
});

test("019 A.3: an asked step's easier wording never states the step's answer (director30 c5-t02 S1, c6 s1 and s2, put back)", () => {
  const t2 = fresh("c5-maths-ch02-t02");
  t2.skills[0].workedExample.steps[0].simpler.hi = "Ek patti kam logon mein bate ya zyada mein: kam logon wala hissa bada hota hai.";
  assert.ok(d31Errors(t2).some((x) => /s1\/workedExample\.steps\[0\]\.simpler: states the step's answer "kam"/.test(x)));
  // (d32 reader fixes: c6 s2's asked step now asks what to do with 24 and 18, key "jodkar do guna", and its easier wording states
  // neither; the director30 case is kept on an inline fixture of the step as it stood, "aadhe chakkar mein kaun si bhujayein?")
  const c6 = fresh("c6-maths-ch06-t01");
  c6.skills[1].workedExample.steps[0].ask = { prompt: { hi: "Kone se saamne wale kone tak, aadhe chakkar mein kaun si bhujayein aati hain?", en: "From a corner to the opposite one, which sides are in half a round?" },
    key: "ek lambai aur ek chaudai", accept: ["lambai aur chaudai", "lambi aur chhoti bhuja", "ek lambi aur ek chhoti bhuja", "ek lambi ek chhoti", "24 aur 18", "24 cm aur 18 cm", "ek lambai ek chaudai", "length and breadth", "one length and one breadth", "the length and the breadth", "24 and 18"] };
  c6.skills[1].workedExample.steps[0].simpler.hi = "Tape ek kone se chalao: pehle lambi bhuja, phir mud ke chhoti bhuja. Ab tum saamne wale kone par ho.";
  // (the limit, said in docs/status/learning.md: c6 s2's giveaway lays the two sides out in order, "pehle lambi bhuja, phir … chhoti
  // bhuja", and no accepted form is in it word for word; it was rewritten by hand. A wording that does say an accepted form is caught)
  assert.deepEqual(stepSimplerHits(c6.skills[1].workedExample).filter((h) => h.l === "hi"), []);
  c6.skills[1].workedExample.steps[0].simpler.hi = "Tape ek kone se saamne wale kone tak chalao: raaste mein ek lambi aur ek chhoti bhuja aati hai.";
  assert.ok(stepSimplerHits(c6.skills[1].workedExample).some((h) => h.l === "hi" && h.at === "steps[0]"), "the long and the short side are accepted forms of 'ek lambai aur ek chaudai'");
  // (c6 s1's "teeno roll" against the director30 asked step, keyed "teeno")
  const we = fresh("c6-maths-ch06-t01").skills[0].workedExample;
  we.steps[0].ask.key = "teeno"; we.steps[0].ask.accept = ["teen", "3", "all three"];
  we.steps[0].simpler.hi = "Socho baad ki jaali teen roll mein aayi hai. Har bhuja par ek roll khulta hai, toh poori baad teeno roll milakar banti hai.";
  assert.ok(stepSimplerHits(we).some((h) => h.form === "teeno"));
  // (a number the problem itself states is a given: c4 s1's 5)
  for (const [t, s] of Object.entries(S)) for (const k of s.skills) assert.deepEqual(stepSimplerHits(k.workedExample), [], `${t} ${k.skillId}`);
});

test("019 B: the wrap says \"achha laga\" once at most (director30, all four: three times in two turns)", () => {
  for (const [t, s] of Object.entries(S)) {
    const n = [...s.wrap.ack, ...s.wrap.ask, s.wrap.goodbye].filter((f) => /achha laga/i.test(f.hi)).length;
    assert.ok(n <= 1, `${t}: ${n}`);
    assert.ok(s.wrap.ack.every((f) => !/achha laga/i.test(f.hi)), t);
  }
  const s = fresh("c6-maths-ch06-t01");
  s.wrap.ack[1] = { hi: "Achha, yeh jaankar achha laga.", en: "Okay, good to know that." };
  const e = d31Errors(s);
  assert.ok(e.some((x) => /wrap\.ack\[1\]: "achha laga"/.test(x)) && e.some((x) => /wrap: "achha laga" in 2 forms/.test(x)), e.join("\n"));
});

test("019 B: a card that accepts an equal fraction in other numbers names it in its why (director30 c5-t01 steady 56, 82, 88)", () => {
  const t1 = S["c5-maths-ch02-t01"];
  const c1 = t1.skills[1].checks[0];
  assert.deepEqual(equalForms(c1), ["2/3"]);
  assert.deepEqual(equalForms(t1.skills[2].checks[1]).sort(), ["1 5/6", "1 aur 5/6"]);
  const s = fresh("c5-maths-ch02-t01");
  s.skills[1].checks[0].why.hi = "5 marks se 6 barabar gaps bante hain, aur chautha mark 4 gaps par hai, yaani 4/6";
  assert.ok(d31Errors(s).some((x) => /s2\/c1\.why: accepts 2\/3 for 4\/6/.test(x)));
});

test("019 A.4: --since lists every changed part with its board and key; an unchanged script lists nothing", () => {
  const s = scriptOf("c5-maths-ch02-t02");
  assert.deepEqual(changedParts(s, s), []);
  const old = fresh("c5-maths-ch02-t02");
  // (director30 steady 74: the S3 e3 point sentence that named a strip not on its board, as it stood)
  old.skills[2].explain[2].point.hi = "Ginti barabar ho, toh hisse ka size faisla karta hai: kam hisson wali patti ke hisse bade. Khaali hisse bhi aise hi: 5 wali ka ek khaali hissa, 9 wali ke khaali hisse se bada.";
  const c = changedParts(s, old);
  assert.equal(c.length, 1);
  assert.equal(c[0].at, "s3 e3 point");
  // (d32 020, 2026-11-19: the point is drawn as bars of 3/5 and 3/8, no longer a compare@1 word table)
  assert.equal(c[0].board.template, "fraction-bars@1");
  const lines = sinceReport(s, old);
  assert.match(lines[0], /^s3 e3 point \[point\] over fraction-bars@1 \{"bars":\[\{"parts":5,"shade":3,"label":"3\/5"/);
  assert.match(lines[1], /point: "Ginti barabar ho.*" → "Ginti barabar ho/);
  // (a card is listed with its key; a script not in the commit lists every part as new)
  const t = fresh("c5-maths-ch02-t02"); t.skills[2].explain[2].ask.reask = { hi: "2/9 ya 2/5, kaunsa zyada hai?", en: "2/9 or 2/5, which is more?" };
  assert.match(sinceReport(t, s)[0], /s3 e3 card \[card\] over .*; key 2\/5/);
  assert.equal(changedParts(s, { skills: [] }).length, partsOf(s).length);
});

test("019 Part 2 hook: STANDARD_STAGED names the staged scripts held to the pilots' standard (none served by this list)", () => {
  assert.ok(Array.isArray(STANDARD_STAGED));
  for (const t of STANDARD_STAGED) assert.ok(!D29_PILOTS.includes(t));
});
