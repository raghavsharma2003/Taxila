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

test("A6: the note list is empty (main, 2026-11-24: the three forms that said what was not made were reworded); such a form is an error", async () => {
  const { d33JointErrors, noPictureNoteLines, NO_PICTURE_NOTE } = await import("../scripts/lesson-scripts/check.mjs");
  const s = structuredClone(live("c5-maths-ch02-t02"));
  assert.deepEqual(NO_PICTURE_NOTE, []);
  assert.deepEqual(d33JointErrors(s, { required: true }), []);
  assert.equal(noPictureNoteLines(s).length, 0);
  // (the pattern reads "drawing" and "picture" as it reads "tasveer": c6-ch07-t01's and c6-ch07-t03's old third forms)
  for (const hi of ["Iske liye aur koi tasveer nahi bani hai.", "Iske liye koi doosri drawing nahi bani hai.", "Iske liye koi doosri picture nahi bani hai."]) {
    const t = structuredClone(s);
    t.joints.noPicture[2] = { hi, en: "What is on the board is the whole picture of this." };
    assert.ok(d33JointErrors(t, { required: true }).length > 0, hi);
  }
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

// ── B5: a bare "bilkul" is a yes; N/D at a "kitne hisse" card is not wrong in code ──
const gradeOf = async (item, say) => {
  const { classifyFast } = await import("../server/director/classify.js");
  const r = classifyFast({ target: { mode: "item", item, key: item.answer, also: item.acceptable || [] }, childText: say, typed: false, asrConfidence: 0.95 });
  return r?.result?.outcome ?? "model";
};
const probe = (key, prompt) => ({ id: "probe", skillId: "s", kind: "practice", prompt_hi: prompt, prompt_en: prompt, answer: key, acceptable: [], scriptCheck: { wrongIfMis: null, targets: null } });

test("B5: a bare \"bilkul\" is a yes at a yes / no card, and a no is still a no", async () => {
  const YN = "Ek chhota tukda pizza ka ek-tihaai hai, haan ya nahi?";
  for (const s of ["bilkul", "Bilkul!", "bilkul ji", "बिल्कुल"]) {
    assert.equal(await gradeOf(probe("Yes", YN), s), "correct", s);
    assert.equal(await gradeOf(probe("No", YN), s), "incorrect", s);
  }
  assert.equal(await gradeOf(probe("No", YN), "bilkul nahi"), "correct");
  assert.equal(await gradeOf(probe("Yes", YN), "bilkul nahi"), "incorrect");
  // (at a number card it is an acknowledgement, not a wrong answer: the model's, as "haan" is)
  assert.equal(await gradeOf(probe("4", "Kitne?"), "bilkul"), "model");
  assert.equal(await gradeOf(probe("4", "Kitne?"), "haan"), "model");
});

test("B5: at c5-maths-ch02-t03's \"kitne hisse\" cards, N/D over the board's parts is never incorrect from the script grade", async () => {
  const { scriptAskItem } = await import("../server/director/script.js");
  const s = live("c5-maths-ch02-t03");
  const item = (sk, id) => { const k = s.skills.find((x) => x.skillId === `c5-maths-ch02-t03-${sk}`); const b = k.explain.find((x) => x.id === id); return scriptAskItem(k.skillId, b.id, b.ask); };
  for (const [sk, id, nd, wrong] of [["s1", "e1", "5/10", ["3", "5/12", "2/10", "1/2"]], ["s1", "e2", "6/12", ["4", "6/10"]], ["s2", "e1", "4/10", ["3", "4/5"]]]) {
    const it = item(sk, id);
    assert.notEqual(await gradeOf(it, nd), "incorrect", `${sk} ${id} ${nd}`);
    for (const f of [it.answer, ...it.acceptable]) assert.equal(await gradeOf(it, f), "correct", `${sk} ${id} form ${f}`);
    // (a plain wrong number, and a fraction over another strip or of another count, grade as before)
    for (const w of wrong) assert.equal(await gradeOf(it, w), "incorrect", `${sk} ${id} ${w}`);
    for (const w of [it.scriptAsk.wrongIfMis].flat().filter(Boolean)) assert.equal(await gradeOf(it, w), "misconception", `${sk} ${id} named ${w}`);
  }
  assert.equal(await gradeOf(item("s1", "e2"), "6/12"), "model");
});
