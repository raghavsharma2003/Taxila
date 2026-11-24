// Main on director21 (item 2): the bugs, each with a check that fails on director21's rows or code before its fix.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { checkRun } from "../evals/hybrid-side-by-side/check-run.mjs";
import { lessonFlags } from "../evals/hybrid-side-by-side/dry-predicates.mjs";
import { GAVE_FORMS } from "../server/brain/say.js";
import { joinable } from "../server/director/script.js";

const RUN = new URL("./fixtures/eval-results/director21", import.meta.url).pathname;
const FLAGS = checkRun(RUN);
const rowsOf = (p) => FLAGS.filter((x) => x.predicate === p).map((x) => `${x.lesson} ${x.row}`);

// (re-pinned, to-brain 052 close: the predicate reads Learning's reply library, which Learning rewrote in data/lesson-aside-replies.json
// (e12517b3f): director21's frozen rows say the old forms ("Hmm, catch. Samajh gayi."), so they are read with each old reply sentence
// put back as a form of today's file, the same word in its slot — the rows, the re-renders and the turns around them are director21's)
const REPLIES = JSON.parse(readFileSync(new URL("../data/lesson-aside-replies.json", import.meta.url), "utf8")).kinds.sport.replies.map((f) => f.hi);
const OLD_REPLY = /^(?:Oh|Hmm|Achha), (\p{L}+)[.!] (?:Achha|Samajh gayi|Theek hai)\. /u;
function r2Rows(lesson, rows) {
  const L = JSON.parse(readFileSync(join(RUN, `${lesson}.json`), "utf8"));
  const director = L.director.map((r, i) => {
    const m = rows.includes(i) ? OLD_REPLY.exec(String(r.text ?? "")) : null;
    assert.ok(!rows.includes(i) || m, `${lesson} ${i}: director21's reply`);
    return m ? { ...r, text: `${REPLIES[rows.indexOf(i) % REPLIES.length].replace("{word}", m[1])} ${r.text.slice(m[0].length)}` } : r;
  });
  const script = JSON.parse(readFileSync(join(RUN, "scripts", `${L.topicId}.json`), "utf8"));
  return lessonFlags({ rows: director, script }).filter((x) => x.predicate === "asideReplyOnce").map((x) => `${lesson} ${x.row}`);
}

test("R2: her aside reply is said once — the re-renders on c4 offtopic 38, c5-t02 stuck 46, 48 are flagged", () => {
  const c4 = r2Rows("offtopic-c4-ch05-t01", [36, 38]), c5 = r2Rows("stuck-c5-ch02-t02", [44, 46, 48]);
  for (const r of ["offtopic-c4-ch05-t01 38", "stuck-c5-ch02-t02 46", "stuck-c5-ch02-t02 48"]) assert.ok([...c4, ...c5].includes(r), r);
  // (the reply on the turn after her return question is the reply itself)
  assert.ok(!c4.includes("offtopic-c4-ch05-t01 36"));
  assert.ok(!c5.includes("stuck-c5-ch02-t02 44"));
});

// (dc-r8-director23 S: the joint predicates read the seam pass's record only; director21's rows have none, and the run is flagged for it)
test("J1: rows with no seams record — director21's — are flagged; the joints are read from the seams list", () => {
  assert.ok(rowsOf("seamJoints").length >= 1);
  assert.deepEqual(rowsOf("backToJoint"), []);
});

test("the screen's buttons are never named aloud (c4 steering 66, c5-t02 offtopic 72)", () => {
  for (const r of ["steering-c4-ch05-t01 66", "offtopic-c5-ch02-t02 72"]) assert.ok(rowsOf("uiWords").includes(r), r);
});

test("a key that is itself a verdict word takes the frame without 'sahi' (c5-t01 steady: 'sahi jawab: sahi nahi')", () => {
  for (const f of GAVE_FORMS.hinglish.yesNo) {
    const t = f("sahi nahi", ", kyunki wahi poora 11 mein bata");
    assert.ok(!/sahi jawab: sahi nahi/i.test(t), t);
  }
  assert.match(GAVE_FORMS.hinglish.yesNo[0]("Gopi ke paas", ""), /sahi jawab: Gopi/);
});

test("a name keeps its capital after 'kyunki' (c5-t02: 'kyunki farhan ka bar')", () => {
  assert.equal(joinable("Farhan ka bar 7 hisson mein kata hai", { lower: true }), "Farhan ka bar 7 hisson mein kata hai");
  assert.equal(joinable("Dono patti barabar lambi hain", { lower: true }), "dono patti barabar lambi hain");
});

test("D: the child's answer to her return or AI-line question has its own column — director21's graded readings are flagged", () => {
  const rows = rowsOf("readerAsideColumn");
  for (const r of ["offtopic-c4-ch05-t01 8", "offtopic-c4-ch05-t01 20", "offtopic-c5-ch02-t02 24"]) assert.ok(rows.includes(r), `${r} in ${rows.join(", ")}`);
});
