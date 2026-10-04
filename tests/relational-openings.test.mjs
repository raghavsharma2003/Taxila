// RELATIONAL-OS R3 (BUILD-PLAN W2-I #4): the fixed-wording safety openings per language mode. The client table
// (src/lesson/safetyStrings.ts) and the server table (server/relational/openings.js) are identical; every opening carries
// Childline 1098 and Tele-MANAS 14416 digit-exact (numerals on screen, digit words in speech), has no preface, no feeling
// word, no secrecy promise, names a trusted adult rather than assuming a parent, and is in the child's language mode.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as SERVER from "../server/relational/openings.js";
import * as CLIENT from "../src/lesson/safetyStrings.ts";
import { floorViolations, relationalViolations, safetyPreface, stripSafetyPreface } from "../server/director/safety.js";

const rows = (table) => Object.entries(table).flatMap(([mode, byAddr]) => Object.entries(byAddr).map(([addr, r]) => ({ mode, addr, ...r })));

test("client and server tables are identical (one wording, two runtimes)", () => {
  assert.deepEqual(CLIENT.OPENINGS, JSON.parse(JSON.stringify(SERVER.OPENINGS)));
  assert.deepEqual(CLIENT.CHECK_OPENINGS, JSON.parse(JSON.stringify(SERVER.CHECK_OPENINGS)));
  assert.equal(CLIENT.OPENINGS_VERSION, SERVER.OPENINGS_VERSION);
  for (const lang of ["english", "hinglish", "hindi", "xx", undefined]) assert.equal(CLIENT.safetyModeOf(lang), SERVER.safetyModeOf(lang));
  assert.equal(CLIENT.safetyOpening("hinglish", { address: "aap" }).text, SERVER.safetyOpeningFor("hinglish", { address: "aap" }).text);
});

test("every opening passes the floor (requireHelpline), the relational never-rules, and the no-preface check", () => {
  for (const r of [...rows(SERVER.OPENINGS), ...rows(SERVER.CHECK_OPENINGS)]) {
    for (const k of ["text", "speech"]) {
      assert.deepEqual(floorViolations(r[k], { requireHelpline: true }), [], `${r.mode}/${r.addr}/${k}`);
      assert.deepEqual(relationalViolations(r[k], { gender: "f" }), [], `${r.mode}/${r.addr}/${k}`);
      assert.deepEqual(relationalViolations(r[k], { gender: "m" }), [], `${r.mode}/${r.addr}/${k} (either persona can say it)`);
      assert.equal(safetyPreface(r[k]), null, `${r.mode}/${r.addr}/${k}`);
    }
    assert.match(r.text, /(?<!\d)1098(?!\d)/, "Childline numerals on screen");
    assert.match(r.speech, /one zero nine eight|ek shunya nau aath|एक शून्य नौ आठ/, "digit by digit in speech");
    assert.doesNotMatch(r.text + r.speech, /\b(?:glad|happy|proud|sad|concerned|worried|sorry)\b|khush|खुश/i, "no feeling word (F8)");
    assert.doesNotMatch(r.text + r.speech, /secret|raaz|राज|won'?t tell|nahi bataungi|नहीं बताऊंगी/i, "never a secrecy promise");
    assert.doesNotMatch(r.text, /\b(?:your (?:mom|mum|dad|parents)|mummy|papa)\b|मम्मी|पापा/i, "a trusted adult, not an assumed parent (the adult may be the source)");
  }
  for (const r of rows(SERVER.OPENINGS)) assert.match(r.text, /(?<!\d)14416(?!\d)/, "disclosure openings carry Tele-MANAS too");
});

test("language mode and address: English has no Hindi, Hinglish is Roman, Hindi is Devanagari; aap forms where asked", () => {
  for (const r of rows(SERVER.OPENINGS)) {
    if (r.mode === "hi") assert.match(r.text, /[ऀ-ॿ]/);
    else assert.doesNotMatch(r.text, /[ऀ-ॿ]/);
    if (r.mode === "en") assert.doesNotMatch(r.text, /\b(?:batao|karo|hai|tum|aap)\b/);
    if (r.addr === "aap") assert.doesNotMatch(r.text, /\btum(?:ne|he)?\b|तुम/);
  }
  assert.equal(SERVER.safetyOpeningFor("english", { address: "aap" }).text, SERVER.OPENINGS.en.tum.text, "English has one address form");
  assert.equal(SERVER.safetyOpeningFor("hindi").mode, "hi");
});

test("withSafetyOpening: the vetted opening first, a spoken-planning preface cut, never doubled", () => {
  const reply = "Aarav, this sounds serious, so I’ll focus on keeping you safe first.No, Aarav, do not send any photo. That is not safe.";
  const out = SERVER.withSafetyOpening(reply, "english", { stripPreface: stripSafetyPreface });
  assert.ok(out.startsWith(SERVER.OPENINGS.en.tum.text));
  assert.doesNotMatch(out, /sounds serious/);
  assert.match(out, /do not send any photo/);
  assert.equal(SERVER.withSafetyOpening(out, "english"), out, "idempotent");
  assert.equal(SERVER.withSafetyOpening("", "hinglish"), SERVER.OPENINGS.hinglish.tum.text, "no model reply: the opening alone still answers");
});
