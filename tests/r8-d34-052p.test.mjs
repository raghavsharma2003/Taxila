// to-brain 052, the predicates, checker and grader builder's parts (A4, A5, A6, B3's note, B5's two reads, C, D).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { vpcTurns, vpcErrors, VPC_OPENER_WORDS, VPC_LEAD_WORDS, NO_PICTURE_NOTE } from "../scripts/lesson-scripts/check.mjs";
import { wordsIn, VPC_MAX } from "../server/director/state.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const live = (t) => JSON.parse(readFileSync(join(ROOT, "data/lesson-scripts", `${t}.json`), "utf8"));

// ── A5: one count for the turn after a right answer ──
// (the two cards of c6-maths-ch06-t01 s2 as they stood at be79d35ab~1: the engine counted the turn over 70 and split it, the checker's F
// line read 53/61)
const OLD_E1_WHY_SHORT = { hi: "chaaron bhujayein: 10 + 6 + 10 + 6 = 32 m", en: "all four sides: 10 + 6 + 10 + 6 = 32 m" };
const OLD_E2_POINT = { hi: "Ek aur rectangle: 12 m lamba, 5 m chauda. Upar baayein kone se chalo, 12 m aage, phir 5 m neeche. Ab tum saamne wale kone par ho, yaani aadha chakkar. Baaki aadha bhi utna hi lamba hai. Isliye parimap = 2 × (lambai + chaudai).", en: "Another rectangle: 12 m long, 5 m wide. From the top-left corner go 12 m along, then 5 m down. Now you are at the opposite corner: half a round. The other half is as long. So perimeter = 2 × (length + breadth)." };

test("A5: the engine's count is every token, so + = × are words", () => {
  assert.equal(wordsIn("10 + 6 + 10 + 6 = 32 m"), 10);
  assert.equal(VPC_MAX, 70);
  assert.equal(VPC_OPENER_WORDS + VPC_LEAD_WORDS, 4);
});

test("A5: c6-ch06 s2 e2 with the old short reason and point is an error, with its parts; today's script passes", () => {
  const today = live("c6-maths-ch06-t01");
  assert.deepEqual(vpcErrors(today), []);
  const old = structuredClone(today);
  const s2 = old.skills.find((k) => k.skillId === "c6-maths-ch06-t01-s2");
  s2.explain.find((b) => b.id === "e1").ask.whyShort = OLD_E1_WHY_SHORT;
  s2.explain.find((b) => b.id === "e2").point = OLD_E2_POINT;
  const e = vpcErrors(old);
  assert.equal(e.length, 1, e.join("\n"));
  assert.match(e[0], /^c6-maths-ch06-t01-s2\/e2: .*short reason 12 \+ lead-in 1 \+ point 46 \+ card 12 = 74 words .*> 70/);
  const t = vpcTurns(today).find((p) => p.at === "c6-maths-ch06-t01-s2/e2");
  assert.ok(t.total <= VPC_MAX, String(t.total));
});

test("A5: an error only for a script in D34_READY (or forced)", () => {
  const s = structuredClone(live("c6-maths-ch06-t01"));
  s.topicId = "x-not-ready";
  s.skills[1].explain[0].ask.whyShort = OLD_E1_WHY_SHORT;
  s.skills[1].explain[1].point = OLD_E2_POINT;
  assert.deepEqual(vpcErrors(s), []);
  assert.equal(vpcErrors(s, { force: true }).length, 1);
});

// ── A6: a no-picture line is not a refusal ──
test("A6: a joints.noPicture form that matches the predicates' PICTURE_REFUSAL is a checker error; the nine scripts' forms are not", async () => {
  const { d33JointErrors } = await import("../scripts/lesson-scripts/check.mjs");
  const { PICTURE_REFUSAL } = await import("../evals/hybrid-side-by-side/d31-predicates.mjs");
  const s = structuredClone(live("c6-maths-ch06-t01"));
  assert.deepEqual(d33JointErrors(s, { required: true }), []);
  const refusal = { hi: "Doosri tasveer abhi nahi hai, board dekho.", en: "There isn't another picture, look at the board." };
  assert.ok(PICTURE_REFUSAL.test(refusal.hi));
  s.joints.noPicture = [refusal, ...s.joints.noPicture.slice(1)];
  const e = d33JointErrors(s, { required: true });
  assert.ok(e.some((x) => /^joints\.noPicture\[0\]: .*refusal.*052 A6/.test(x)), e.join("\n"));
  assert.ok(e.some((x) => /^joints\.noPicture\[0\] \(en\): .*refusal/.test(x)), e.join("\n"));
  for (const [dir, ts] of [["data/lesson-scripts", ["c4-maths-ch05-t01", "c4-maths-ch01-t02", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c5-maths-ch02-t03", "c6-maths-ch06-t01", "c6-maths-ch07-t01"]], ["data/lesson-scripts-staged", ["c4-maths-ch06-t01", "c6-maths-ch07-t03"]]])
    for (const t of ts) (JSON.parse(readFileSync(join(ROOT, dir, `${t}.json`), "utf8")).joints?.noPicture ?? []).forEach((f, i) => { for (const l of ["hi", "en"]) {
      const noted = NO_PICTURE_NOTE.some((x) => x.topicId === t && x.i === i && x.lang === l);
      assert.equal(PICTURE_REFUSAL.test(f[l] ?? ""), noted, `${t} noPicture[${i}] ${l}: ${f[l]}`);
    } });
});

test("A6: a noted form prints as a P line and is no error; off the pattern it must come off the list", async () => {
  const { d33JointErrors, noPictureNoteLines } = await import("../scripts/lesson-scripts/check.mjs");
  const s = structuredClone(live("c5-maths-ch02-t02"));
  assert.deepEqual(d33JointErrors(s, { required: true }), []);
  assert.equal(noPictureNoteLines(s).length, 1);
  s.joints.noPicture[2] = { hi: "Board par wahi rekha hai, use dekho.", en: "The line on the board is the one; look at it." };
  assert.ok(d33JointErrors(s, { required: true }).some((x) => /^NO_PICTURE_NOTE joints\.noPicture\[2\] hi: listed but/.test(x)));
});

// ── A4: hindiNoFormNoLine and spent help ──
test("A4: a language request answered with the script's nothing-easier form (help spent) reads clean; with neither form it is flagged", async () => {
  const { PREDICATES } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
  const script = live("c6-maths-ch07-t01");
  assert.ok(script.joints.easierWords?.length && script.joints.helpSpent?.length);
  const card = "60 cm ki ribbon ka 1/3 aur 30 cm ki ribbon ka 1/2: in dono mein kitne cm ka farak hai?";
  const child = { who: "child", text: "Hindi mein bolo", intent: "hindi" };
  // (offtopic-c6-ch07-t01 row 32 of the merged dry matrix: the honest line, then the card; by its seam and by its words alone)
  const spent = { who: "teacher", text: `${script.joints.helpSpent[1].hi} ${card}`, cell: { column: "hindi" },
    seams: [{ left: "start", right: "helpSpent", joint: "helpSpent", form: script.joints.helpSpent[1].hi, by: "authored" }, { left: "helpSpent", right: "card", joint: null }] };
  const at = (r) => PREDICATES.hindiNoFormNoLine({ rows: [child, r] }, r, 1, { script, o: {} });
  assert.equal(at(spent), null);
  assert.equal(at({ ...spent, seams: [] }), null);
  for (const f of script.joints.helpSpent) assert.equal(at({ ...spent, seams: [], text: `${f.hi} ${card}` }), null, f.hi);
  assert.ok(at({ ...spent, seams: [], text: card }));
});

// ── B3: an asked step's whyAlt is a note, not an error ──
test("B3: the checker notes (F) every asked worked step carrying a whyAlt, and it is no error", async () => {
  const { stepWhyAltLines, checkTopic } = await import("../scripts/lesson-scripts/check.mjs");
  const s = live("c6-maths-ch07-t01");
  const lines = stepWhyAltLines(s);
  assert.equal(lines.length, s.skills.flatMap((k) => k.workedExample?.steps ?? []).filter((x) => x.ask?.whyAlt).length);
  assert.ok(lines.length >= 1 && lines.every((l) => /^step whyAlt s\d steps\[\d+\]: .*052 B3/.test(l)), lines.join("\n"));
  assert.equal((await checkTopic("c6-maths-ch07-t01")).ok, true);
  const bare = structuredClone(s);
  for (const k of bare.skills) for (const x of k.workedExample?.steps ?? []) if (x.ask) delete x.ask.whyAlt;
  assert.deepEqual(stepWhyAltLines(bare), []);
});
