// Main, 20:22 (Learning's readers ran staged lines through toSpoken): five renderer faults, each a raw symbol or abbreviation reaching
// TTS. (1) "=" after a word; (2) the unit after a fraction; (3) the Hinglish distributive "N-N" read as a range; (4) a unit abbreviation
// with no number before it; (5) "×" after a word. And from every spoken string of the 34 scripts run through it: an operator between
// words ("4 × side", "lambai + chaudai", "whole − part"), one opening the line ("÷ 4 …"), a signed "+7", a spaced slash between words.
import { test } from "node:test";
import assert from "node:assert/strict";
import { toSpoken } from "../server/voice/spoken.js";

const hl = (x, ageBand = "10-15") => toSpoken(x, { mode: "hinglish", ageBand });
const en = (x, ageBand = "10-15") => toSpoken(x, { mode: "english", ageBand });
const hi = (x) => toSpoken(x, { mode: "hinglish", schoolMedium: "hindi", ageBand: "10-15" });

test("(1) a bare '=' after a word or letter is spoken", () => {
  assert.equal(hl("0.2 rupaye = 20 paise"), "Zero point two rupaye equals twenty paise");
  assert.equal(en("Angle XYZ = 50°"), "Angle XYZ equals fifty degrees");
});

test("(2) the unit after a fraction or a mixed number is said in words", () => {
  assert.equal(hl("Toh 1/2 m kapda"), "Toh one upon two metre kapda");
  assert.equal(hl("1/4 kg aata", "6-9"), "One quarter kilogram aata");
  assert.equal(en("2 1/2 m of cloth"), "Two and one upon two metres of cloth");
});

test("(3) the distributive N-N is 'two-two' / 'do-do', 'two each' in English — never a range", () => {
  assert.equal(hl("2-2 ki jodi"), "Two-two ki jodi");
  assert.equal(hl("1000-1000 pencil"), "One thousand-one thousand pencil");
  assert.equal(hi("5-5 laddoo"), "पाँच-पाँच laddoo");
  assert.equal(en("5-5 laddoos"), "Five each laddoos");
  // (a range stays a range)
  assert.equal(hl("3-5 din"), "Three to five din");
});

test("(4) a unit abbreviation with no number before it is said in words", () => {
  assert.equal(hl("kitne cm lagenge?"), "kitne centimetre lagenge?");
  assert.equal(en("how many km is it?"), "how many kilometres is it?");
  // (one-letter units stay: "m" is a line's name as often as a metre)
  assert.equal(hl("line m P se hokar"), "line m P se hokar");
});

test("(5) and the scripts' read: an operator with a word on either side, one opening the line, a signed number, a spaced slash", () => {
  assert.equal(hl("5 tukde × 6 cm"), "Five tukde into six centimetre");
  assert.equal(en("4 × side"), "Four times side");
  assert.equal(hl("2 × (lambai + chaudai)"), "Two into (lambai plus chaudai)");
  assert.equal(en("whole − part"), "whole minus part");
  assert.equal(hl("÷ 4 poore bracket par lagta hai"), "Divided by four poore bracket par lagta hai");
  assert.equal(en("down a column, +7"), "down a column, plus seven");
  assert.equal(hl("kinaara / seema"), "kinaara ya seema");
  assert.equal(en("edge / boundary"), "edge or boundary");
});
