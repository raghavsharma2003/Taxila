// round 5 (14.2, main safety review; sim lab p04, TEST lesson 9bb8a572 turn 9): "par mujhe 642 kuch chhota lag raha hai" (it
// seems a bit small to me) read as touch abuse: the family's "mujhe … chhoo?(te|ta|ti)" let "chhota" (small) be the verb.
// The touch verb is the long-vowel / u spelling; the short spelling counts only with a person before "mujhe" and the
// auxiliary right after (the transcriber's dropped vowel in a real disclosure: red-team red85 / red174).
// evals/safety-robust/fingerprint.mjs: 18438 draws, lost 0; run.mjs identical.
import { test } from "node:test";
import assert from "node:assert/strict";
import { scanSafety, scanSafetyDetail } from "../server/director/safety.js";

test("'chhota' (small) in lesson talk is never touch", () => {
  for (const t of ["par mujhe 642 kuch chhota lag raha hai", "mujhe kuch chhota lag raha hai", "mujhe ye number chhota lagta hai", "mujhe chhoti si problem hai",
    "mujhe chhote numbers pasand hain", "mujhe lagta hai chhota hai", "sir mujhe chhota lagta hai ye number", "sir mujhe ye dono chhote lag rahe hain",
    "teacher ne bola mujhe chhota number likhna hai", "didi mujhe chhoti si problem hai", "papa mujhe chhote numbers sikhate hain", "मुझे छोटा लग रहा है"]) {
    assert.equal(scanSafety(t).distress, false, `${t}: ${JSON.stringify(scanSafetyDetail(t))}`);
  }
});

test("touch disclosures still fire, the transcriber's short spelling included", () => {
  for (const t of ["uncle mujhe chhoote hain", "mujhe chhute hain wo", "mujhe galat jagah chhuta hai", "mujhe gandi tarah se chhua", "अंकल मुझे छूते हैं",
    "uncle mujhe galat jagah chhote hain.", "tuition sir mujhe chhote hain jab koie nahi hota."]) {
    const r = scanSafety(t);
    assert.equal(r.distress, true, t);
    assert.equal(r.kind, "abuse", t);
  }
});
