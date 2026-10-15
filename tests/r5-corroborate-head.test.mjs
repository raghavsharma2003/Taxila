// round 5 (4A; main's conditions for corroborate.js answerHead): a right answer followed by its working is credited by its
// answer HEAD only when the whole reply failed on a number the explanation brought, the head passes the full check alone,
// and nothing after it corrects it. The adversarial set below must give 0 credits. Pure (no model: the model's label is
// given as "correct", the case corroborate exists for).
import { test } from "node:test";
import assert from "node:assert/strict";
import { corroborate, answerHead } from "../server/grading/corroborate.js";

const T = (key, also = [], prompt = "", kind = "practice") => ({ mode: "item", key, also, item: { id: "x", kind, prompt_en: prompt } });
const credit = (target, text) => corroborate({ target, text, result: { source: "model", outcome: "correct", confidence: 0.9 } });

test("a right answer followed by its working is credited by its head (sim lab e46a281c decided truth)", () => {
  const r = credit(T("70", ["seventy", "sattar"], "30 and how much make 100?"), "70! matlab sattar. kyunki 30 aur 70 milke 100 hote hain, jaise teen das aur saat das.");
  assert.equal(r.outcome, "correct"); assert.equal(r.corroboration, "supported_head");
  assert.equal(credit(T("2345", [], "Write two thousand three hundred forty-five in digits."), "2345. do hazaar teen sau pentaalees, hazaar wali jagah do rakha, sau jagah teen, das jagah chaar, ek jagah paanch").outcome, "correct");
  assert.equal(credit(T("₹20", ["20"], "How much more than 80 makes 100 rupees?"), "20 rupaye! kyunki 80 mein 20 jodne se 100, jaise 8 dahaai aur 2 dahaai das dahaai.").outcome, "correct");
});

test("ADVERSARIAL: none of these is credited by its head", () => {
  const cases = [
    // a wrong answer, then working that contains the key
    [T("70", ["sattar"], "30 and how much make 100?"), "60. kyunki 30 aur 70 milke 100 hote hain"],
    [T("45", [], "4 groups of 10 and 5 more?"), "9, matlab 4 packets mein 40 aur 5 loose"],
    // a self-correction after the head: the head is not the child's answer
    [T("60", [], "How much is 30 + 30?"), "70 nahi... 60, kyunki 30 aur 30"],
    [T("54", [], "6 times 9?"), "45... wait, matlab 54, kyunki 6 nau 54"],
    [T("9", [], "4 plus 5?"), "8. sorry, matlab 9, kyunki 4 aur 5"],
    [T("9", [], "4 plus 5?"), "9. galti ho gayi, matlab 8, kyunki 4 aur 4"],
    // two choices in the head
    [T("70", ["sattar"], "30 and how much make 100?"), "70 ya 60? kyunki 30 aur 70 milke 100"],
    [T("7", [], "3 plus 4?"), "7 or 8, because 3 and 4 and 1 more"],
    // the key inside a longer number
    [T("7", [], "3 plus 4?"), "70. kyunki 3 aur 4 milke 7 hote hain"],
    [T("7", [], "3 plus 4?"), "17, matlab 3 aur 4 milke 7"],
    // the head negates the key
    [T("Yes", ["haan"], "Is 12 even?"), "nahi, kyunki 12 ko 2 se bhaag karo toh 6 aata hai"],
    // a why / teachback item is never rescued by a head
    [T("70", [], "Why is 30 + 70 = 100?", "why"), "70, kyunki 3 das aur 7 das milke 10 das"],
    [T("70", [], "Teach Golu 30 + 70.", "teachback"), "70, kyunki 3 das aur 7 das milke 10 das"],
  ];
  for (const [t, text] of cases) assert.notEqual(credit(t, text).outcome, "correct", `${text} → ${JSON.stringify(credit(t, text))}`);
});

test("the head: up to the first explanation marker, else the first sentence; a reply that is all head has none", () => {
  assert.deepEqual(answerHead("70! matlab sattar."), { head: "70!", rest: "matlab sattar." });
  assert.equal(answerHead("70"), null);
  assert.equal(answerHead("saat... jaise 7 likhte hain na").head, "saat...");
});
