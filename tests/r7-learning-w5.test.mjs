// Round 7 F W5: counting "teen" becomes 3 in her Hinglish text; number names, quotes, English "teen" and answers never change.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { rewrite, rewriteKit } from "../scripts/kits/w5-filter-numerals.mjs";

test("a counting teen becomes 3", () => {
  assert.equal(rewrite("Teen dost school jaate hain.").text, "3 dost school jaate hain.");
  assert.equal(rewrite("Rainbow ke teen rang batao.").text, "Rainbow ke 3 rang batao.");
});

test("number names, quotes and the English teen stay", () => {
  for (const s of ["do hazaar teen sau paanch", "teen-chauthai ghoomo", "ek, do, teen...", "saadhe teen baje", "do-teen sentence",
    "'Teen hazaar chhe' kaunsa number hai?", "a teen number like 14", "the teens"]) {
    assert.equal(rewrite(s).changed, 0, s);
  }
});

test("answers, acceptable forms and ids are never rewritten", () => {
  const kit = { items: [{ id: "x-teen", prompt_hi: "Teen pens hain.", answer: "teen", acceptable: ["teen pens"] }] };
  const { changes } = rewriteKit(kit);
  assert.equal(changes.length, 1);
  assert.deepEqual(kit.items[0], { id: "x-teen", prompt_hi: "3 pens hain.", answer: "teen", acceptable: ["teen pens"] });
});

test("the shipped kits have no counting teen left in the text she reads", () => {
  const dir = new URL("../data/kits/", import.meta.url);
  for (const f of readdirSync(dir).filter((x) => /^c\d-[a-z]+\.json$/.test(x))) {
    const { changes } = rewriteKit(JSON.parse(readFileSync(new URL(f, dir), "utf8")), f);
    assert.deepEqual(changes.map((c) => `${f}${c.path}`), [], f);
  }
});
