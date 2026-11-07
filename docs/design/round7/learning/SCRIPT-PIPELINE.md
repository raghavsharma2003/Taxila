# Lesson-script pipeline (round 7 F, dc-r7-teaching-scripts)

How one topic's teaching becomes an authored, verified script that the Director walks. No Azure calls: Claude authors and
verifies in session, and code checks. The pilot (c4-maths-ch05-t01, c5-maths-ch02-t01, c6-maths-ch06-t01) went through
these steps, and so did the pipeline test (c5-maths-ch02-t02).

## Steps for one topic

1. **Pick.** Take the next topic from `node scripts/lesson-scripts/next-topics.mjs` (the ranking is explained below). It
   must have a kit in `data/kits/` with verified items.
2. **Author: one Claude agent, in session.** It gets:
   - [LESSON-SCRIPTS-SPEC.md](LESSON-SCRIPTS-SPEC.md), the contract (shapes, not sentences);
   - the topic's kit topic JSON;
   - one finished script as a format example.

   It writes `data/lesson-scripts/<topicId>.json` with `status: "draft"`. The board rules it must follow:
   - a check board never shows its answer;
   - board text uses only its beat's words and numbers;
   - a round whole is cut into sectors.
3. **Check: code.** Run `node scripts/lesson-scripts/check.mjs <topicId>`. It runs three gates and exits 1 on any error:
   - **S, structure against the kit:**
     - the kit's skills in kit order;
     - real misconception ids and same-skill ladder items;
     - a full worked example with no faded blanks;
     - 2-3 checks per skill, none printing its key;
     - remediation that never counts;
     - every kit misconception checked;
     - board params in range;
     - number-line checks that ask (`mark` / `target`), never show.
   - **W, Studio's whiteboard gate** (`certifyBoardRef`'s W-checks) on every board. Each board is judged against a stand-in
     for what she will say over it:
     - an explain beat's `point`;
     - the worked example's problem, step results and answer;
     - a check's prompt, with its key withheld;
     - a remediation's `move`.

     W6 timing is reported but not failed here, because Studio re-times and re-gates every board against her real line at
     turn time.
   - **V, Brain's runtime validator** (`server/director/script.js` `validateTopicScript`): every skill walkable, 0 errors.

   Fix every S, W or V error in the script and re-run until it passes.
4. **Blind solve: a SEPARATE Claude agent.** Run `node scripts/lesson-scripts/check.mjs <topicId> --blind q.json --keys k.json`.
   It writes the prompts with no keys (every check and every remediation follow-up) and the worked examples.

   The solver agent reads only `q.json`. It solves each question and checks each worked example step by step. It must also
   flag any question that:
   - is ambiguous;
   - leans on an undescribed picture;
   - gives its answer away.

   Compare its answers with `k.json`:
   - an equivalent form (2/6 m = 1/3 m) is added to `accept`;
   - a real disagreement or a flagged question is rewritten, then re-solved blind by a FRESH agent.

   A key the solver cannot reach is never kept.
5. **Log.** Write a new `context/inbox/r7-learning-<n>.json` measurement. It records n questions, n agreeing, the flags
   and rewrites, worked examples ok / not ok, the S/W/V results and the date. Use `md` as `{decisions, measurements, rejected}`
   and edges as `{src, rel, dst}`, with `rel` one of supersedes, measured_by, constrains, part_of, caused_by, blocks or inherits.
6. **Gates and push.** Run `npx tsc -b && npx vite build`, the four shards, and `node scripts/context.mjs --check`.
   `tests/r7-learning-lesson-scripts.test.mjs` runs step 3 on every script in the folder, so a later kit, board or
   validator change that breaks a script turns CI red.

Cost per topic, all in session: one author agent, one blind solver, sometimes a second re-solve agent, and about 1 s of
code checks. Azure: 0.

## The next 30 class 4-7 maths topics, by expected traffic

There is no real usage yet, so traffic is estimated from how the Conductor routes a child:
- every lesson's topic comes from the class sequence (`nextTopicOf`, in curriculum order);
- a weak prerequisite sends the child back to it (`adapt.js` `prereqPick`, plus the revisit rules).

So a topic that many later topics depend on gets more visits than its chapter position alone suggests. The rank is:
1. **Later topics that need it:** the number of class 4-7 maths topics whose prerequisite closure contains it, descending.
2. Then class.
3. Then chapter order.

Only topics with a kit and no script yet are listed. Replace this ranking with the Conductor's real pick counts
(`lesson.topic_id` by class) once lessons run. Regenerate with `node scripts/lesson-scripts/next-topics.mjs --n 30 --md`.

| # | topic | class | chapter | title | type | later topics that need it |
|---|---|---|---|---|---|---|
| 1 | c4-maths-ch04-t01 | 4 | 4 | Numbers up to 9999 | T3 | 24 |
| 2 | c4-maths-ch01-t02 | 4 | 1 | Right angles and circles | T3 | 20 |
| 3 | c5-maths-ch03-t01 | 5 | 3 | Angles as amount of turning | T3 | 19 |
| 4 | c4-maths-ch09-t01 | 4 | 9 | Multiplication facts and patterns | T1 | 18 |
| 5 | c6-maths-ch02-t01 | 6 | 2 | Point, line segment, line and ray | T2 | 18 |
| 6 | c4-maths-ch06-t01 | 4 | 6 | Centimetres and metres | T4 | 17 |
| 7 | c5-maths-ch02-t02 | 5 | 2 | Comparing fractions | T3 | 17 |
| 8 | c5-maths-ch03-t02 | 5 | 3 | Right, acute and obtuse angles | T3 | 14 |
| 9 | c6-maths-ch02-t02 | 6 | 2 | Angles and comparing angles | T3 | 14 |
| 10 | c6-maths-ch02-t03 | 6 | 2 | Measuring and drawing angles | T4 | 13 |
| 11 | c4-maths-ch03-t01 | 4 | 3 | Odd and even numbers | T3 | 12 |
| 12 | c4-maths-ch07-t01 | 4 | 7 | Adding and subtracting larger numbers | T4 | 12 |
| 13 | c6-maths-ch02-t04 | 6 | 2 | Types of angles | T2 | 12 |
| 14 | c5-maths-ch01-t01 | 5 | 1 | Numbers in thousands and beyond | T3 | 10 |
| 15 | c5-maths-ch02-t03 | 5 | 2 | Equivalent fractions | T3 | 10 |
| 16 | c5-maths-ch05-t01 | 5 | 5 | Kilometres, metres and centimetres | T4 | 10 |
| 17 | c6-maths-ch08-t01 | 6 | 8 | Circles with a compass | T3 | 10 |
| 18 | c5-maths-ch13-t01 | 5 | 13 | Multiples and common multiples | T3 | 9 |
| 19 | c6-maths-ch07-t01 | 6 | 7 | Fractional units and equal shares | T3 | 9 |
| 20 | c6-maths-ch07-t03 | 6 | 7 | Equivalent fractions | T4 | 9 |
| 21 | c4-maths-ch14-t01 | 4 | 14 | Tables and pictographs | T5 | 8 |
| 22 | c5-maths-ch13-t02 | 5 | 13 | Factors | T3 | 8 |
| 23 | c6-maths-ch07-t04 | 6 | 7 | Comparing fractions | T4 | 8 |
| 24 | c7-maths-ch05-t01 | 7 | 5 | Intersecting lines and vertically opposite angles | T3 | 8 |
| 25 | c4-maths-ch03-t02 | 4 | 3 | Number patterns | T5 | 7 |
| 26 | c4-maths-ch04-t02 | 4 | 4 | Comparing and ordering 4-digit numbers | T4 | 7 |
| 27 | c6-maths-ch05-t01 | 6 | 5 | Common factors and common multiples | T4 | 7 |
| 28 | c6-maths-ch07-t05 | 6 | 7 | Adding and subtracting fractions | T4 | 7 |
| 29 | c7-maths-ch02-t01 | 7 | 2 | Writing arithmetic expressions | T5 | 7 |
| 30 | c7-maths-ch03-t01 | 7 | 3 | Tenths and hundredths | T3 | 7 |

Row 7, c5-maths-ch02-t02, is the pipeline test topic. Once it is scripted, the list moves up by one. **The 30-topic batch
waits for the director4 verdict** (main 2026-11-05), because the script format may change after it.
