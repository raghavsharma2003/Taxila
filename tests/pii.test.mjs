// scrubPii (server/director/safety.js): direct identifiers masked before a child's words reach a provider or
// a row. The shapes that refuted Gurukul's scrubPii@gp are pinned first; lesson answers must survive untouched.
import { test } from "node:test";
import assert from "node:assert/strict";
import { scrubPii, containsPii } from "../server/director/safety.js";
import { POSITIVES, NEGATIVES } from "../evals/pii.data.mjs";

test("the four shapes that refuted the source are masked", () => {
  assert.equal(scrubPii("1234 5678 9012").text, "[aadhaar]");
  assert.equal(scrubPii("98765 43210").text, "[phone]");
  assert.equal(scrubPii("+91 98765 43210").text, "[phone]");
  assert.equal(scrubPii("९८७६५ ४३२१०").text, "[phone]");
});

test("every authored identifier is masked with its kind; every lesson answer comes back byte-identical", () => {
  for (const [t, kinds] of POSITIVES) { const r = scrubPii(t); for (const k of kinds) assert.ok(r.found.includes(k), `${t} → ${r.text} (${r.found})`); }
  for (const t of NEGATIVES) assert.equal(scrubPii(t).text, t, t);
});

test("maths stays maths: monotone runs, lists of number groups, digit-by-digit sequences, units", () => {
  for (const t of ["9876543210", "0123456789", "3012 3120 3201 3210", "6 3 10 5 16 8 4 2 1", "1 h 20 min", "H 4, T 0, O 6", "sector 90°", "1,00,00,000"]) {
    assert.equal(scrubPii(t).text, t, t);
  }
});

test("the child's first name is kept (the teacher already uses it); a surname and family names are masked", () => {
  assert.equal(scrubPii("My name is Riya.").text, "My name is Riya.");
  assert.equal(scrubPii("My name is Riya Sharma.").text, "My name is Riya [name].");
  assert.equal(scrubPii("मेरा नाम रिया शर्मा है").text, "मेरा नाम रिया [name] है");
  assert.equal(scrubPii("mere papa ka naam Suresh hai").text, "mere papa ka naam [name] hai");
});

test("known names are masked wherever they appear, on letter boundaries", () => {
  const r = scrubPii("Sharma uncle aur Sharmaji ka ghar", { names: ["Sharma"] });
  assert.equal(r.text, "[name] uncle aur Sharmaji ka ghar");
  assert.deepEqual(r.found, ["name"]);
});

test("found lists kinds only (never values); containsPii agrees", () => {
  const r = scrubPii("mail riya@example.com, phone 9812345670");
  assert.deepEqual(r.found, ["email", "phone"]);
  assert.ok(!JSON.stringify(r.found).includes("riya"));
  assert.equal(containsPii("pata nahi didi"), false);
  assert.equal(containsPii("mera number 98123 45670"), true);
});

test("non-strings never throw", () => {
  assert.deepEqual(scrubPii(undefined), { text: "", found: [] });
  assert.deepEqual(scrubPii(42), { text: "42", found: [] });
});
