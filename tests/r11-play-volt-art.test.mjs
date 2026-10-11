// Release 11 (dc-r4-volt-everywhere): under Volt night the r3 family games open on the dark arts; Volt day and the classic
// look keep the server's pick; a family never gets an art it does not have; the server's pick itself is untouched.
import { test } from "node:test";
import assert from "node:assert/strict";
import { voltArt } from "../src/play/core/volt-art.ts";
import { FAMILY_ARTS, pickArt } from "../shared/play.ts";

const night = { klook: "volt", ktheme: "night" }, day = { klook: "volt", ktheme: "dawn" };
test("Volt night: kagaz → blueprint, chalk → raat; the dark arts stay; only arts the family has", () => {
  for (const f of ["todo-jodo", "taraazu", "nishana", "kyun-lab", "kon"]) {
    for (const a of FAMILY_ARTS[f]) {
      const to = voltArt(a, f, night);
      assert.ok(FAMILY_ARTS[f].includes(to), `${f}/${a} → ${to}`);
      if (a === "raat" || a === "blueprint") assert.equal(to, a);
      if (a === "kagaz" && FAMILY_ARTS[f].includes("blueprint")) assert.equal(to, "blueprint");
      if (a === "chalk" && FAMILY_ARTS[f].includes("raat")) assert.equal(to, "raat");
    }
  }
});
test("Volt day, a holo look and the classic look (no attributes) keep the server's art", () => {
  for (const a of ["kagaz", "chalk", "blueprint", "raat"]) {
    assert.equal(voltArt(a, "todo-jodo", day), a);
    assert.equal(voltArt(a, "todo-jodo", { klook: "holo", ktheme: "night" }), a);
    assert.equal(voltArt(a, "todo-jodo", null), a);
  }
  assert.equal(pickArt({ family: "todo-jodo", subject: "maths", topicId: "t", classLevel: 7 }).art, "kagaz", "the server's pick is unchanged");
});
