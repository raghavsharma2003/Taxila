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
  const s = fresh("c5-maths-ch02-t01");
  s.skills[0].workedExample.viewCaption.hi = "Is patti ko raasta samjho: gaps ke beech ke teen marks teen khambe. Rangin gap ghar se pehle khambe tak ka raasta hai.";
  assert.ok(d30Errors(s).some((x) => /skills\[0\]\.workedExample\.viewCaption: names steps\[0\]\.ask's answer "gaps"/.test(x)));
  const c6 = fresh("c6-maths-ch06-t01");
  c6.skills[2].workedExample.viewCaption.hi = "Rani ka ek chakkar yahan ek seedhi line ban gaya hai: 50 m, 30 m, 50 m, 30 m.";
  assert.ok(d30Errors(c6).some((x) => /names steps\[0\]\.ask's answer "ek chakkar"/.test(x)));
  // (number words are read as digits: "paanch" names an accepted "5"…)
  const t1 = fresh("c5-maths-ch02-t01");
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
  assert.equal(n, 48, "c4 10, c5-t01 12, c5-t02 14, c6 2, c5-t03 10 (live since dc-r8-director31)");
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
