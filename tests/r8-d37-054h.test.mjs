// d37 builder H (RULING-H, main's ruling after the second whole read): items 15 and 16.
//   15. Every reply to a child's try-first is "Haan, pehle tum try karo." and nothing after it; the gated check `tryFirstNotAlone` reads it.
import { test, describe } from "node:test";
import assert from "node:assert/strict";

const { D37H_PREDICATES, isTryFirst, goAheadOf } = await import("../evals/hybrid-side-by-side/d37h-predicates.mjs");
const { PREDICATES, PENDING } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");

const T = (text, extra = {}) => ({ who: "teacher", text, seams: [], ...extra });
const C = (text) => ({ who: "child", text });
const flagsOf = (rows) => rows.map((r, i) => D37H_PREDICATES.tryFirstNotAlone({ rows }, r, i)).map((x, i) => (x ? i : -1)).filter((i) => i >= 0);

describe("item 15: tryFirstNotAlone (made rows, both sides)", () => {
  test("it is registered and gated", () => { assert.ok(PREDICATES.tryFirstNotAlone); assert.ok(!PENDING.has("tryFirstNotAlone")); });
  test("its own list of try-firsts reads the matrix's three lines and their like, and not an answer or a yes", () => {
    for (const t of ["mujhe khud try karne do", "ruko, main khud karti hoon", "pehle main try karun?", "let me try", "main khud karunga", "khud try karungi"]) assert.ok(isTryFirst(t), t);
    for (const t of ["haan", "12", "pata nahi", "try nahi karna", "main thak gayi hoon"]) assert.ok(!isTryFirst(t), t);
  });
  test("the go-ahead alone passes; the go-ahead with a short ask, an invitation or the question flags (g/dry2 rows' shapes)", () => {
    const Q = T("Bat ek metre se kitne centimetre chhota hai?");
    assert.deepEqual(flagsOf([Q, C("mujhe khud try karne do"), T("Haan, pehle tum try karo.")]), []);
    assert.deepEqual(flagsOf([Q, C("ruko, main khud karti hoon"), T("Haan, pehle tum try karo. Ab phir se socho, jawab kya hoga?")]), [2]);
    assert.deepEqual(flagsOf([Q, C("pehle main try karun?"), T("Haan, pehle tum try karo. Ab tumhara jawab sunti hoon.")]), [2]);
    assert.deepEqual(flagsOf([Q, C("pehle main try karun?"), T("Haan, pehle tum try karo. Chalo, ab tumhari baari.")]), [2]);
    assert.deepEqual(flagsOf([Q, C("pehle main try karun?"), T("Haan, pehle tum try karo — Bat ek metre se kitne centimetre chhota hai?")]), [2]);
  });
  test("a reply to a try-first with no go-ahead flags; a safety turn is not read; a go-ahead after any other line is not read", () => {
    assert.deepEqual(flagsOf([T("Q?"), C("mujhe khud try karne do"), T("Koi baat nahi, isko aise dekho: 12 ka aadha 6.")]), [2]);
    assert.deepEqual(flagsOf([T("Q?"), C("mujhe khud try karne do"), T("Main yahin hoon.", { move: "safeguard" })]), []);
    assert.deepEqual(flagsOf([T("Q?"), C("haan"), T("Haan, pehle tum try karo. Ab phir se socho, jawab kya hoga?")]), []);
  });
  test("goAheadOf splits the go-ahead from what follows", () => {
    assert.deepEqual(goAheadOf("Haan, pehle tum try karo."), { goAhead: "Haan, pehle tum try karo", rest: "" });
    assert.equal(goAheadOf("Haan, pehle tum try karo. Ab tum batao.").rest, "Ab tum batao.");
    assert.equal(goAheadOf("Achha, chalo."), null);
  });
});
