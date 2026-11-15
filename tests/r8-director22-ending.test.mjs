// dc-r8-director22 T, the ending: (1) the teach-back's answer board is up from the first word of the turn that says its key — read from
// the pages drawn (director22's four steady endings said the key over the question board, the answer board ~125 characters later);
// (3) the verdict is a turn of its own, the wrap the next; (4) one sentence about what this child did, written by the model and kept
// only when code's check passes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { checkRun } from "../evals/hybrid-side-by-side/check-run.mjs";
import { childSentenceOk } from "../server/brain/say.js";

const D22 = new URL("../evals/hybrid-side-by-side/results/2026-11-15-director22", import.meta.url).pathname;

test("T1: director22's steady endings said the teach-back's key before its answer board — flagged from the pages", { skip: !existsSync(D22) }, () => {
  const rows = checkRun(D22).filter((x) => x.predicate === "teachbackKeyBoard").map((x) => `${x.lesson} ${x.row}`);
  for (const r of ["steady-c4-ch05-t01 136", "steady-c5-ch02-t01 146", "steady-c5-ch02-t02 140", "steady-c6-ch06-t01 142"]) assert.ok(rows.includes(r), `${r} in ${rows.join(", ")}`);
});

test("T4: the sentence about the child is kept only when it is one sentence, at most 18 words, numbers from the rows, no trait praise", () => {
  const rows = "T: Is circle ke 9 barabar tukde hain ... C: 4/9";
  assert.equal(childSentenceOk("Tumne circle ke 9 tukdon mein se rangin 4/9 khud nikala", rows), "Tumne circle ke 9 tukdon mein se rangin 4/9 khud nikala.");
  assert.equal(childSentenceOk("Tum bahut smart ho, tumne 4/9 nikala.", rows), null);
  assert.equal(childSentenceOk("Tumne 5/9 nikala.", rows), null);
  assert.equal(childSentenceOk("Tumne 4/9 nikala. Phir tumne aur kiya.", rows), null);
  assert.equal(childSentenceOk("Achha, chalo isko saath mein dekhte hain. Ek baar phir se batao?", rows), null);
  assert.equal(childSentenceOk(Array(19).fill("shabd").join(" "), rows), null);
});
