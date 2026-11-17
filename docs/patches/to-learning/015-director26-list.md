# To Learning 015: director26 judged; the script list

Judgement and decision: `docs/design/round7/judgements/director26-2026-11-17.md` (`dc-r8-director26`). Reports with rows: `evals/hybrid-side-by-side/results/2026-11-17-director26/judges/`. Built by an agent run from the main loop, as 014 was.

014 held: every explain card's new hint was read by four judges and none says its key. Scope: the four pilots.

1. **A board for every remediation** (`remediation[].board`, and one for a `sayAlt` or `simpler` that needs a different picture). It shows what the remediation's words describe, with nothing of a later card's answer on it. Six help turns in this run were said over another card's board because the remediation had none of its own.
2. **An independent read of every hint against its card** (`ask.simpler`, a check card's `simpler`, a remediation's `simpler`, a worked example's hints). A hint points at a method or at where to look. It never states the numbers of the answer, never leaves only one option on a yes-or-no card, and is true of the board it is said over. Named: c4 the first worked example's hint (it states 5 and 3; steady 46, offtopic 60), the e3 card's hint "ab rangin tukde gino" over a board with one piece shaded (offtopic 34, steering 44); c5-t01 the first skill's remediation hint "Chhota gap pehle khatam ho jaata hai" (stuck 24, offtopic 44), s1 c2's hint (stuck 68), s3 c1's hint (steady 120), "7 mein se 4 ghatao" (steady 114); c6 the hints that leave only arithmetic (stuck 6, 68; steady 108).
3. **Second wordings that are the first again.** Every first-skill `pointAlt` in c4 and c5-t02 and every `problemAlt` in the four scripts, plus c6's e3 hint: 16 help turns in this run were a paraphrase in the same order. A second wording uses a different object or a different act.
4. **Told steps.** Every worked example's told step is 30 words or fewer, one thing done and at most one "kyunki", so two fit in a turn. c5-t01 s3 step 1 and "toh ginti 4 aayi" are named.
5. **The wrap.** Each `wrap.covered` sentence is 20 words or fewer. `wrap.ack`: three forms that fit any answer to the closing question, "pata nahi, aap batao" included ("Hmm, main samajh gayi" does not). Each `teachback` gets a `simpler` (a hint for a near miss).
6. **Joints.** `joints.beforeWorked`: three forms that lead into a problem done together. A worked example's `problem` is worded as a problem to do together, never as a question to the child (the steady child answers "haan" to it).
7. **Words.** "hissa" is a fraction part and nothing else: the check-in "Yeh hissa saaf hua?" goes from scripts that teach hisse. "upar" in one sense per turn (c4 row 114; c5-t02 steady 22, 26). c4's raw key slot ("Is sawaal ka sahi jawab: pinky ka") gets a sayable key. "tukda / bhaag / hissa" and "patti / ribbon" in c4: one word per idea.
8. c5-t02 s1 e3's point uses a 3/7 line to compare 1/4 and 1/8; s1 step 1's doubled "ek-ek"; s2 c2's bache/khaya card.

Done means: `node scripts/lesson-scripts/check.mjs` passes on the four scripts; the compile report shows no new hole; every changed sentence is listed in `docs/status/learning.md` with old text, new text and the judge's row.
