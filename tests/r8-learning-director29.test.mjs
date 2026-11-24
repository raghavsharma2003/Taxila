// Learning 018 (dc-r8-director29 item 9, docs/patches/to-learning/018-director29-captions-and-said-lines.md): the checker's new
// rules on the four pilots. A caption is read against the view pictureTurn draws for its board (the same call
// tests/r8-picture-turn uses); a worked caption names no asked step's answer in words or digits; joints.startAnyway and
// joints.afterPark; an answerViewCaption beside every follow-up card's and check's answer board that has a second view; a
// remediation over 49 words with its card only when it is listed whole.
import { test } from "node:test";
import assert from "node:assert/strict";
import { scriptOf, d30Errors, d30Report, answerCards, captionViews, viewOf, boardKind, wrongKinds, workedCaptionHits, fitOf,
  REM_CARD_MAX, REM_WHOLE, remWhole, D29_PILOTS, START_ANYWAY_MAX } from "../scripts/lesson-scripts/check.mjs";

const fresh = (t) => JSON.parse(JSON.stringify(scriptOf(t)));
const S = Object.fromEntries(D29_PILOTS.map((t) => [t, scriptOf(t)]));

test("018: the four pilots pass the new rules", () => {
  for (const [t, s] of Object.entries(S)) assert.deepEqual(d30Errors(s), [], t);
});

test("018 A.1: the view kind is pictureTurn's — bars draw a line or wholes, a line draws bars, a roti's parts draw a strip", () => {
  assert.equal(viewOf({ template: "fraction-bars@1", params: { bars: [{ parts: 8, shade: 1, label: "1/8" }] } }).kind, "line");
  assert.equal(viewOf({ template: "fraction-bars@1", params: { bars: [{ parts: 8, shade: 0, label: "" }, { parts: 2, shade: 0, label: "" }] } }).kind, "circle");
  assert.equal(viewOf({ template: "fraction-line@1", params: { den: 7, from: 0, to: 1 } }).kind, "strip");
  assert.equal(viewOf({ template: "fraction-parts@1", params: { parts: 2, shade: 1, whole: "roti" } }).kind, "strip");
  assert.equal(boardKind({ template: "measured@1", params: { shape: "rect", unit: "m", w: 9, h: 6 } }), "figure");
  assert.deepEqual(wrongKinds("Yeh patti yahan ek number line ban gayi hai", "line", "strip"), []);
  assert.deepEqual(wrongKinds("Is gol ke saat barabar hisse hain", "strip", "line"), ["circle"]);
});

test("018 A.1: a caption naming the wrong kind of view fails (director29 c5-t02 stuck 18: a line said over bars whose view is wholes)", () => {
  const s = fresh("c5-maths-ch02-t02");
  const we = s.skills[0].workedExample;
  assert.equal(viewOf(we.board).kind, "circle", "the S1 worked board's second view is wholes");
  we.viewCaption = { hi: "Yahan dono chocolate ki jagah 0 se 1 ki number line hai: line ke upar 8 barabar gap, line ke neeche 2.", en: "Here the two chocolates are a number line from 0 to 1: 8 equal gaps above the line, 2 below." };
  const e = d30Errors(s);
  assert.ok(e.some((x) => /skills\[0\]\.workedExample\.viewCaption: names a line, but the view drawn is a circle \(wholes\)/.test(x)), e.join("\n"));
  // (and on a board with no view, the caption is true of the held board alone: c6 s3 e3's unrolled line)
  const c6 = fresh("c6-maths-ch06-t01");
  c6.skills[2].explain[2].viewCaption.hi = "Plot ka poora kinaara ek line par khula hai: 12 m, 8 m, 12 m, 8 m, kul 40 m.";
  assert.ok(d30Errors(c6).some((x) => /skills\[2\]\.explain\[2\]\.viewCaption: names a line, but the view drawn is none/.test(x)));
});

test("018 A.2: a worked caption naming an asked step's answer in words fails (c5-t01 \"gaps\", c6 \"ek chakkar\"); a given number is no answer", () => {
  // (d32 reader fixes: c5-t01 S1's asked step now asks the gap count, key 4; the "gaps" case is kept on an inline fixture of the
  // step as 018 found it — "khambe ginoge, ya gaps?", key "gaps" — and the new step is held the same way, "chaar" naming its 4)
  const s = fresh("c5-maths-ch02-t01");
  s.skills[0].workedExample.steps[0].ask = { prompt: { hi: "Doori ke liye khambe ginoge, ya khambon ke beech ke gaps?", en: "For the distance, do you count the poles or the gaps between them?" },
    key: "gaps", accept: ["gap", "beech ke gaps", "khambon ke beech ke gaps", "gaps ginenge", "the gaps", "gaps between"], right: { hi: "Haan, gaps; khambe toh bas jagahein hain.", en: "Yes, the gaps; the poles are only spots." } };
  s.skills[0].workedExample.viewCaption.hi = "Is patti ko raasta samjho: gaps ke beech ke teen marks teen khambe. Rangin gap ghar se pehle khambe tak ka raasta hai.";
  assert.ok(d30Errors(s).some((x) => /skills\[0\]\.workedExample\.viewCaption: names steps\[0\]\.ask's answer "gaps"/.test(x)));
  const s4 = fresh("c5-maths-ch02-t01");
  s4.skills[0].workedExample.viewCaption.hi = "Is patti ko raasta samjho: teen khambe ise chaar barabar hisson mein kaatte hain.";
  assert.ok(workedCaptionHits(s4.skills[0].workedExample).some((h) => h.form === "4"), "the step's own answer, 4, said as chaar");
  const c6 = fresh("c6-maths-ch06-t01");
  c6.skills[2].workedExample.viewCaption.hi = "Rani ka ek chakkar yahan ek seedhi line ban gaya hai: 50 m, 30 m, 50 m, 30 m.";
  assert.ok(d30Errors(c6).some((x) => /names steps\[0\]\.ask's answer "ek chakkar"/.test(x)));
  // (number words are read as digits: "paanch" names an accepted "5"…)
  // (d32: S2's asked step now asks the gap's size, key 1/5; the case is kept on an inline fixture of the step 018 found, whose
  // accepted forms held "5" — "2/5 ka kaunsa number batata hai…?")
  const t1 = fresh("c5-maths-ch02-t01");
  t1.skills[1].workedExample.steps.find((st) => st.ask).ask = { prompt: { hi: "2/5 ka kaunsa number batata hai ki line kitne barabar gaps mein kategi?", en: "Which number of 2/5 says how many equal gaps the line is cut into?" },
    key: "neeche wala number", accept: ["neeche wala", "neeche wala 5", "neeche", "5", "paanch", "bottom", "the bottom number", "the 5"] };
  t1.skills[1].workedExample.viewCaption.hi = "Board par 0 se 1 tak ki line hai, paanch barabar gaps mein.";
  assert.ok(workedCaptionHits(t1.skills[1].workedExample).some((h) => h.form === "5"));
  // (…but not where the problem itself states it: c4 s1's "paanch barabar tukde" is the given 5)
  assert.deepEqual(workedCaptionHits(S["c4-maths-ch05-t01"].skills[0].workedExample), []);
});

test("018 C.1: joints.startAnyway on the pilots — three forms of six words or fewer, asking nothing", () => {
  for (const [t, s] of Object.entries(S)) {
    const f = s.joints.startAnyway;
    assert.equal(f.length, 3, t);
    for (const x of f) for (const l of ["hi", "en"]) {
      assert.ok(x[l].split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length <= START_ANYWAY_MAX, `${t}: "${x[l]}"`);
      assert.ok(!/[?？]/.test(x[l]), `${t}: "${x[l]}" asks nothing`);
    }
  }
  const s = fresh("c4-maths-ch05-t01");
  s.joints.startAnyway[0].hi = "Chalo, main tumhe sab kuch abhi batati hoon.";
  assert.ok(d30Errors(s).some((x) => /joints\.startAnyway\[0\]: \d+ words > 6/.test(x)));
  delete s.joints.startAnyway;
  assert.ok(d30Errors(s).some((x) => /joints\.startAnyway: 3 forms/.test(x)));
});

test("018 C.2: the park forms promise only; joints.afterPark leads back (three forms, no question)", () => {
  for (const [t, s] of Object.entries(S)) {
    assert.equal(s.joints.afterPark?.length, 3, t);
    for (const x of s.joints.afterPark) assert.ok(!/[?？]|\{/.test(x.hi), `${t}: "${x.hi}"`);
  }
  const s = fresh("c5-maths-ch02-t02");
  s.joints.afterPark[1].hi = "Kya ab apna kaam karein?";
  assert.ok(d30Errors(s).some((x) => /joints\.afterPark\[1\]: asks nothing/.test(x)));
});

test("018 A.3: every follow-up card and check whose answer board has a second view has an answerViewCaption; none where there is no view", () => {
  let n = 0;
  for (const [t, s] of Object.entries(S)) for (const x of answerCards(s)) {
    if (x.view) { n++; assert.ok(x.card.answerViewCaption?.hi && x.card.answerViewCaption?.en, `${t} ${x.at}`); }
    else assert.equal(x.card.answerViewCaption, undefined, `${t} ${x.at}: no second view, no caption`);
  }
  // (d32 reader fixes and Studio 014's second views, 2026-11-19: 48 → 57; every one of them carries its caption, the rule above)
  assert.equal(n, 65, "c4 11, c5-t01 17, c5-t02 16, c6 2, c5-t03 11 (live since dc-r8-director31), c6-ch07-t01 3 (live since director32), c4-ch01-t02 5 (live since to-brain 052)");
  const s = fresh("c4-maths-ch05-t01");
  delete s.skills[0].checks[0].answerViewCaption;
  assert.ok(d30Errors(s).some((x) => /skills\[0\]\.c1\.answerViewCaption: what to look at/.test(x)));
  // (an answer caption is read against its view too: the c4 Pinky card's answer board draws a line)
  const t = fresh("c4-maths-ch05-t01");
  t.skills[0].remediation[1].then.answerViewCaption.hi = "Circle ke chaar tukdon mein se do rangin hain.";
  assert.ok(d30Errors(t).some((x) => /remediation\[1\]\.then\.answerViewCaption: names a circle/.test(x)));
  assert.ok(d30Report(S["c6-maths-ch06-t01"]).some((x) => /answer board with no second view/.test(x)));
});

test("018 said beats fitted: a remediation over 49 with its card fails unless REM_WHOLE lists it, with its reason", () => {
  for (const w of REM_WHOLE) assert.ok(w.reason && w.reason.length > 20, `${w.skillId} ${w.targets}: a reason`);
  for (const [t, s] of Object.entries(S)) for (const r of fitOf(s).rems) assert.ok(r.total <= REM_CARD_MAX || remWhole(t, r.skill, r.targets), `${t} ${r.skill}[${r.i}]`);
  const s = fresh("c6-maths-ch06-t01");
  s.skills[0].remediation[0].say.hi += " " + Array(30).fill("bhuja").join(" ") + ".";
  assert.ok(d30Errors(s).some((x) => /remediation\[0\]: say and card are \d+ words > 49/.test(x)));
  assert.ok(d30Report(S["c5-maths-ch02-t02"]).some((x) => /left whole/.test(x)));
});

test("018: every caption of the pilots was read against a view (captionViews covers board and answer board)", () => {
  for (const [t, s] of Object.entries(S)) {
    const cv = captionViews(s);
    assert.ok(cv.some((b) => b.cap === "viewCaption" && b.view) && cv.some((b) => b.cap === "answerViewCaption"), t);
  }
});
