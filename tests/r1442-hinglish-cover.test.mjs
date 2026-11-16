// 14.4.2 (sim lab 1b3bb12c p66 / p68, main's conditions): what corroboration reads beyond English. A model still never
// grades: each case below is a model "correct" proposal checked in code against the item's verified forms.
import { test } from "node:test";
import assert from "node:assert/strict";
import { corroborate } from "../server/grading/corroborate.js";

const t = (id, key, also = [], alsoLabel = {}) => ({ mode: "item", key, also, alsoLabel, item: { id, kind: "practice", prompt_en: "", prompt_hi: "" } });
const credited = (target, text) => corroborate({ target, text, result: { outcome: "correct", confidence: 0.9, source: "model", flags: {} } }).outcome === "correct";

test("the whole key, then '? ya phir <another answer>', is a choice between answers, never credited", () => {
  const target = t("c6-science-ch03-t04-i12", "Any two: more fuel burnt and more air pollution; it loses freshness; it needs cold storage, packaging or preservatives; it can cost more.");
  assert.equal(credited(target, "more fuel burnt and more air pollution, it loses freshness, it needs cold storage, packaging or preservatives, it can cost more? ya phir the distance food travels"), false);
  assert.equal(credited(target, "more fuel burnt and more air pollution, it loses freshness, it needs cold storage, packaging or preservatives, it can cost more"), true);
});

test("band / khula and saaf / ganda are decisive sides: the opposite in Hinglish is no credit", () => {
  const target = t("c3-evs-ch07-t02-i08", "Keep the tank covered and the tap closed", ["dhakkan band rakho"], { "dhakkan band rakho": "complete" });
  assert.equal(credited(target, "dhakkan khula rakho"), false);
  assert.equal(credited(target, "dhakkan band rakho"), true);
  const clean = t("c3-evs-ch07-t02-i09", "Use a clean container", ["saaf bartan"], { "saaf bartan": "complete" });
  assert.equal(credited(clean, "ganda bartan"), false);
});

test("'Any N:' — the count is no number the reply must say; a reply that does say it still counts", () => {
  const target = t("c3-evs-ch07-t02-i01", "Any two: keep it covered; use a ladle", []);
  assert.equal(credited(target, "keep it covered, use a ladle"), true);
  const three = t("c5-evs-ch07-t01-i02", "Any three: make things move, make heat, give light, make sound, help living things grow.", ["roshni"], { roshni: "complete" });
  assert.equal(credited(three, "Move karna, heat dena, light dena. Teen cheezen, theek hai?"), true);
});

test("a Hinglish reply reads as the English it means, only as a rescue at the key-like cover, never on a language item", () => {
  const target = t("c3-evs-ch07-t02-i20", "Cover the water and wash your hands");
  assert.equal(credited(target, "paani dhak ke rakho aur haath dho"), false, "cover 2 of 4 English content words: below the key-like bar");
  const rescue = t("c3-evs-ch07-t02-i21", "Dust, germs and insects");
  assert.equal(credited(rescue, "dhool, kitanu aur keede"), true);
  assert.equal(credited({ ...rescue, item: { ...rescue.item, id: "c3-hindi-ch07-t02-i21" } }, "dhool, kitanu aur keede"), false, "a language item tests the words themselves");
  // never changes which forms a take-back is judged against: a negated Hinglish form stays negated
  const neg = t("c6-science-ch06-t01-i03", "Salt and sugar dissolve; sand and chalk powder settle at the bottom.", ["salt and sugar", "namak aur cheeni"], {});
  assert.equal(credited(neg, "nahi, namak aur cheeni nahi hota"), false);
});
