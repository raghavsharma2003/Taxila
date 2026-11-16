// r7 audit, set-up (main approved 2026-11-10): LEARN-10 raw error text, LEARN-43 "One moment" for ever, LEARN-44 an EVS
// chip classes 1-2 have no book for, and "Not sure" not clearing a saved answer, LEARN-45 board required, LEARN-46 consent
// asked twice. Pure rules from src/onboarding/setupRules.ts, plus where each step uses them.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { setupError, feelChipsFor, consentOnFile, parentViewToSend } from "../src/onboarding/setupRules.ts";
import { ApiError } from "../src/app/api.ts";

const src = (f) => readFileSync(new URL(`../src/onboarding/${f}`, import.meta.url), "utf8");

test("LEARN-10: set-up words errors for a parent, never e.message", () => {
  assert.doesNotMatch(setupError(new TypeError("Failed to fetch")), /Failed to fetch/);
  assert.doesNotMatch(setupError(new ApiError(500, "internal error", {})), /internal error/);
  assert.match(setupError(new ApiError(400, "the spoken name may hold letters…", { field: "nameSpoken", code: "name_spoken.shape" })), /letters only/);
  assert.equal(setupError(new ApiError(400, "missing field: firstName", { field: "firstName", code: "name.missing" })), "Add your child's name.");
});

test("LEARN-43: a failed PIN read offers Try again", () => {
  const s = src("ChildProfile.tsx");
  assert.match(s, /setPinReadFailed\(true\)/);
  assert.match(s, /pinReadFailed && <Button[^>]*onClick=\{\(\) => setPinTry/);
});

test("LEARN-44: chips only for subjects the class has a book for; Not sure sends unsure for a cleared answer", () => {
  assert.deepEqual(feelChipsFor(2, ["maths", "english", "hindi"]), ["maths"]);
  assert.deepEqual(feelChipsFor(4, ["maths", "evs", "english"]), ["maths", "evs"]);
  assert.deepEqual(feelChipsFor(7, null), ["maths", "science"], "while the book list loads, the class's own pair");
  assert.deepEqual(parentViewToSend({ maths: "hard" }, ["evs", "maths"]), { maths: "hard", evs: "unsure" });
  assert.match(src("ChildProfile.tsx"), /feelChipsFor\(cl, bookSubjects\)/);
});

test("LEARN-45: the board is optional and defaults to CBSE", () => {
  const s = src("steps/Class.tsx");
  assert.match(s, /const board = c\.board \?\? "cbse";/);
  assert.match(s, /const ready = !!c\.classLevel && !!speak;/);
});

test("LEARN-46: a signed-in parent whose consent is on file goes to the child step", () => {
  assert.equal(consentOnFile([{ child_id: null, purpose: "core_tutoring", granted: true }]), true);
  assert.equal(consentOnFile([{ child_id: "c1", purpose: "core_tutoring", granted: true }]), false);
  assert.equal(consentOnFile([]), false);
  assert.match(src("Account.tsx"), /consentOnFile\(m\?\.consents\) \? "\/start\/child" : "\/start\/consent"/);
});
