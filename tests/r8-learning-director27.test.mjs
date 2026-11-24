// Learning 016 (dc-r8-director27): the four pilot scripts carry a quick question on every explain beat and an asked step in every
// worked example of two or more steps; re-asks, hints and remediation boards as the order reads them; the two new joints. These
// hold the rules on the scripts as written; scripts/lesson-scripts/check.mjs d27Errors holds the shapes and lengths.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { scriptOf, d27Errors, isD27, D27_PILOTS, checkTopic, toldStepText, fitOf } from "../scripts/lesson-scripts/check.mjs";

const words = (t) => String(t ?? "").split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
const norm = (t) => String(t ?? "").toLowerCase().replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
const S = Object.fromEntries(D27_PILOTS.map((t) => [t, scriptOf(t)]));

test("016: the checker passes the four pilots, and its new rules are quiet on them", async () => {
  for (const t of D27_PILOTS) {
    assert.deepEqual(d27Errors(S[t]), [], t);
    const r = await checkTopic(t);
    assert.ok(r.ok, `${t}: ${[...r.structure, ...r.boards, ...r.runtime].slice(0, 5).join(" | ")}`);
  }
});

// (Learning 017 B, dc-r8-director28: the quick questions asked back the sentence just said; a quick is kept only where a point and
// its card cannot be cut to fit one turn, and every pilot pair now fits, so no pilot beat keeps one. Where one is kept its shape is
// still director27's: a short question, a one-line say, a key that is not its card's.)
test("017 B (was 016 A1): a quick question only where its point and card do not fit; then in its shape, its key not its card's", () => {
  let n = 0, kept = 0;
  for (const [t, s] of Object.entries(S)) {
    const fit = new Map(fitOf(s).points.map((p) => [`${p.skill}/${p.id}`, p]));
    for (const k of s.skills) for (const b of k.explain) {
      const q = b.quick, at = `${t} ${k.skillId} ${b.id}`, f = fit.get(`${k.skillId}/${b.id}`);
      n++;
      assert.equal(!!q, f.total > f.limit, `${at}: quick ${q ? "on a pair that fits" : "missing on a pair that does not fit"} (${f.total}/${f.limit})`);
      if (!q) continue;
      kept++;
      for (const l of ["hi", "en"]) {
        assert.ok(words(q.prompt[l]) <= 14 && /\?\s*$/.test(q.prompt[l]), `${at} prompt ${l}`);
        assert.ok(words(q.say[l]) <= 12 && !/\?/.test(q.say[l]), `${at} say ${l}`);
      }
      const card = [b.ask.key, ...(b.ask.accept ?? [])].map(norm), mine = [q.key, ...q.accept].map(norm);
      assert.ok(!mine.some((x) => card.includes(x)), `${at}: shares a form with its card`);
    }
  }
  // (to-brain 052 D: c4-maths-ch01-t02's 3 + 3 + 3, live since b3c7e81fd, the last three)
  assert.equal(n, 4 + 3 + 3 + 3 + 3 + 3 + 3 + 4 + 4 + 3 + 3 + 3 + 3 + 3 + 3 + 3 + 2 + 3 + 3 + 3 + 3, "every beat of the live scripts (the four pilots, then c5-maths-ch02-t03's 3 + 3 + 3, live since dc-r8-director31, then c6-maths-ch07-t01's 3 + 2 + 3, live since director32)");
  assert.equal(kept, 0, "every pilot pair fits, so no pilot keeps a quick");
});

test("016 A2: every worked example of two or more steps asks a step; the ask's answer is that step's result, never the child's own step's", () => {
  for (const [t, s] of Object.entries(S)) for (const k of s.skills) {
    const we = k.workedExample, at = `${t} ${k.skillId}`;
    if ((we.steps ?? []).length < 2) continue;
    const asked = we.steps.filter((x) => x.ask);
    assert.ok(asked.length >= 1, `${at}: no asked step`);
    for (const x of asked) {
      assert.ok(norm(x.result).includes(norm(x.ask.key)) || x.ask.accept.some((a) => ` ${norm(x.result)} `.includes(` ${norm(a)} `)), `${at}: ask key ${x.ask.key} is not the step's result ${x.result}`);
      assert.notEqual(norm(x.ask.key), norm(we.yourStep.key), at);
      for (const l of ["hi", "en"]) assert.ok(words(x.ask.prompt[l]) <= 14 && words(x.ask.right[l]) <= 15, `${at} ${l}`);
    }
    for (const l of ["hi", "en"]) assert.ok(words(we.problem[l]) <= 30, `${at} problem ${l}`);
    for (const x of we.steps) assert.ok(words(toldStepText(x)) <= 30, `${at} told step`);
  }
});

test("016 A2: c4 skill 1's own step needs thinking (the bottom number is hers); c6 skill 3 gives the child two steps and her own is not '3 × 160'", () => {
  const c4 = S["c4-maths-ch05-t01"].skills[0].workedExample;
  assert.equal(c4.yourStep.key, "2/5");
  // (Learning 017 D: the asked step is now the bottom number's reasoning, "saare tukde: 5"; the child's own step still needs thinking:
  // the top number, the pieces left, is said by no step)
  assert.ok(!c4.steps.some((x) => /\b2\b/.test(`${x.result} ${x.why.hi} ${x.ask?.right?.hi ?? ""}`)), "no told or asked step states the 2 pieces left");
  assert.equal(c4.yourStep.wrongIfMis, "2/3", "the part-part slip is the child's to avoid");
  const c6 = S["c6-maths-ch06-t01"].skills[2].workedExample;
  // (Learning 017 D: director28's judges read c6's two asked sums as a quiz; one asked step, the reasoning one, and no sum asked)
  assert.ok(c6.steps.filter((x) => x.ask).length >= 1);
  assert.ok(!c6.steps.some((x) => x.ask && /\d\s*[+×]\s*\d/.test(x.ask.prompt.hi)), "no asked step is a sum");
  assert.ok(!/3\s*×\s*160/.test(`${c6.yourStep.prompt.hi} ${c6.yourStep.prompt.en}`), "her step is not handed to her as a sum");
  assert.ok(!c6.steps.some((x) => /3\s*×/.test(`${x.do.hi} ${x.result}`)), "no step tells the times-three");
});

test("016 B: the named re-asks no longer do their card's work; c6's check 2 hint is true of its closed rectangle; re-asks carry their givens", () => {
  const c4 = S["c4-maths-ch05-t01"].skills[0];
  assert.ok(!/\b2 mein rang\b/.test(c4.explain[2].ask.reask.hi), "c4 e3 re-ask states 2 of 3");
  assert.ok(!/5 barabar tukdon mein se 3/.test(c4.workedExample.yourStep.reask.hi), "c4 skill 1 worked re-ask");
  const c6 = S["c6-maths-ch06-t01"];
  assert.ok(!/line ban kar khula/.test(c6.skills[0].checks[1].simpler.hi), "hint written for the picture view");
  assert.ok(!/aadha lo|lambai hatao/.test(`${c6.skills[2].explain[1].ask.prompt.hi} ${c6.skills[2].explain[1].ask.reask.hi}`), "c6 s3 e2 card does its own work");
  const c5a = S["c5-maths-ch02-t01"];
  assert.match(c5a.skills[0].remediation[2].then.reask.hi, /6 barabar gaps/);
  assert.match(c5a.skills[1].checks[2].reask.hi, /3\/4/);
  assert.match(S["c5-maths-ch02-t02"].skills[1].explain[2].ask.reask.hi, /3\/5.*1\/5/);
});

test("016 C: every remediation has a board its say speaks or is a 'socho' telling with none; none shows its card's answer", async () => {
  const BF = await import("../server/stagecraft/board-first.js");
  const ask = (text, ref) => ({ intent: { intentId: "d27:wb:1", lessonId: "d27", kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: ref, scriptBeat: { scriptId: "s", beatId: "r", kind: "remediation" } }, line: { lessonId: "d27", text }, mode: "fresh", kit: { topicId: "t", content: [] } });
  let own = 0, imagine = 0;
  for (const [t, s] of Object.entries(S)) for (const k of s.skills) for (const [i, r] of k.remediation.entries()) {
    const at = `${t} ${k.skillId} rem${i}`;
    if (r.board) { own++; assert.ok(BF.scriptBoardSpoken(ask(r.say.hi, r.board)), `${at}: its board is not spoken by its say`); }
    else { imagine++; assert.match(r.say.hi, /\bsocho\b/i, `${at}: no board, and not an imagine telling`); }
    if (r.sayAlt?.board) assert.ok(BF.scriptBoardSpoken(ask(r.sayAlt.hi, r.sayAlt.board)), `${at}: sayAlt board unspoken`);
  }
  // (the count is of remediation items over the five live scripts, D27_PILOTS: [with a board, "socho" tellings with none]. The four pilots
//  were 19 + 8 and c5-maths-ch02-t03 adds 5 + 0; the 020 rewrites (dc-r8-director31) gave two more remediations a board, so the four are
//  21 + 6. Listed: the 6 are c5-t01 s3 rem1, c6-t01 s1 rem1, s2 rem0, s2 rem1, s3 rem0, s3 rem1, every one a "Socho" telling.)
  assert.deepEqual([own, imagine], [21 + 5 + 4, 6]); // (+ 4: c6-maths-ch07-t01, live since director32, every remediation with its own board)
  // (C2: the count-marks board drew the 11 lower ticks its card asks the child to count)
  const cm = S["c5-maths-ch02-t01"].skills[0].remediation[0];
  // (dc-r8-director31: the 020 rewrite replaced the 7-gap board with the tailor's 4-marks-5-gaps board, den 5; the rule stands: the board never
  //  draws the 12 gaps its then-card asks the child to count)
  assert.ok(!(cm.board.params.dens ?? []).includes(12) && cm.board.params.den !== 12 && cm.board.params.den === 5);
  // (C3: c5-t02 skill 3's third remediation: the 3-and-8 board is the say's; the tanks have none)
  const g = S["c5-maths-ch02-t02"].skills[2].remediation[2];
  assert.deepEqual(g.board.params.bars.map((b) => b.parts), [3, 8]);
  assert.equal(g.sayAlt.board, undefined);
});

test("016 D: afterKeyReturn (three forms) and tiredBye (two forms) in each pilot; a staged script without them is not failed for it", () => {
  for (const [t, s] of Object.entries(S)) {
    assert.equal(s.joints.afterKeyReturn.length, 3, t);
    assert.equal(s.joints.tiredBye.length, 2, t);
    for (const f of s.joints.tiredBye) assert.ok(!/\b(bye|zaroor|kal|mujhe|achha laga)\b/i.test(f.hi), `${t}: ${f.hi}`);
  }
  const dir = "data/lesson-scripts-staged";
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    const s = JSON.parse(fs.readFileSync(`${dir}/${f}`, "utf8"));
    if (isD27(s)) continue;
    assert.deepEqual(d27Errors(s), [], f);
  }
});

test("016 E: the judges' words: pehli/doosri patti in c4 and c5-t02, no paratha, a noun in the spoken results, hook into the point", () => {
  const all = (s) => JSON.stringify(s);
  assert.ok(!/\b[Uu]par wali\b|\b[Nn]eeche wali\b/.test(all(S["c4-maths-ch05-t01"])), "c4 strips by position");
  assert.ok(!/\b[Uu]par wali\b|\b[Nn]eeche wali\b/.test(all(S["c5-maths-ch02-t02"])), "c5-t02 strips by position");
  assert.ok(!/paratha/i.test(all(S["c4-maths-ch05-t01"])));
  assert.ok(!/bata 5/.test(all(S["c5-maths-ch02-t01"])));
  assert.ok(S["c5-maths-ch02-t01"].skills[0].workedExample.steps[1].result.includes("gaps"));
  assert.ok(!/likho/.test(all(S["c5-maths-ch02-t02"].skills[2].workedExample)));
  assert.ok(!/ko 4 se baanto/.test(S["c6-maths-ch06-t01"].skills[2].explain[0].point.hi));
  for (const sl of S["c6-maths-ch06-t01"].skills[0].hook.interestSlots) assert.match(sl.use.hi, /triangle/, "the hook leads into the triangle");
});
