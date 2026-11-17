# To Learning 016: director27 judged; the script list and two new fields

Judgement and decision: `docs/design/round7/judgements/director27-2026-11-17.md` (`dc-r8-director27`). Reports with rows: `evals/hybrid-side-by-side/results/2026-11-17-director27/judges/`. Built by an agent run from the main loop, as 014 and 015 were.

015 held: in three topics no hint gives its answer; every worked problem has a lead-in and is worded as one to do together; replies carry the child's word. Scope: the four pilots.

## A. Two new fields (the checker learns them in this patch; the walk uses them in Brain 042)

All four judges found the "samajh aaya?" check-ins tedious; the steady child says "haan" 16 to 22 times a lesson. Where a check-in stood before a waiting card or inside a worked example, the child now answers a small question.

1. **`explain[].quick`** on every explain beat:
   ```
   "quick": {
     "prompt": { "hi": "…", "en": "…" },   // 14 words or fewer
     "key": "…", "accept": ["…"],            // as on a card
     "say": { "hi": "…", "en": "…" }        // the answer in one line, 12 words or fewer
   }
   ```
   - It asks for one thing the point has just said or the point's board shows: a count, a name, which of two. A child who listened can answer in a word or two.
   - Its key is not the card's key and it does not hand over the card's answer: after hearing `quick` answered, the card must still need its own thinking.
   - It names no number the board does not show, and it is true over the point's board.
   - `say` states the answer plainly and nothing more. It is said when the child does not answer right; there is no hint and no second try.
   - Blind-solve every key as cards are: the answer comes from the point and board alone.
2. **`workedExample.steps[].ask`** on at least one step of every worked example that has two or more steps (the step where a child can do the thing herself; never the first step if it only sets the picture up):
   ```
   "ask": {
     "prompt": { "hi": "…", "en": "…" },   // 14 words or fewer; its answer is this step's result
     "key": "…", "accept": ["…"],
     "right": { "hi": "…", "en": "…" }     // said after a right answer: the result and its reason, 15 words or fewer
   }
   ```
   - The step's told form stays as it is: it is what she says when the child does not answer right.
   - The step asked is not the child's own step (`yourStep`) and does not give `yourStep`'s answer.
   - c4 skill 1: the child's own step is trivial now ("Kaunsa fraction bana?" after both numbers were said). Move the work so the child's own step needs thinking.
   - c6 skill 3: five told steps and the child only multiplies 3 × 160. Give the child two of the steps.
3. **Word limits the walk relies on:** a worked `problem` is 30 words or fewer; a lead-in, the problem and the first question fit in 75.

`scripts/lesson-scripts/check.mjs` enforces the shapes, the word limits, `quick.key` ≠ the card's key, and at least one asked step per worked example of two or more steps.

## B. Re-asks and hints

1. **A re-ask says the question again without doing its work.** It never states a number the card left the child to find. Named: c4 e3's re-ask "3 barabar tukdon mein se 2 mein rang ho" (offtopic 34, steering 44); c4 skill 1's worked step, hint plus re-ask "5… mein se 3 khaye gaye" (steady 54, offtopic 50). Read every `reask` in c4 against its card; then the other three.
2. **A hint is true of the board the card is posed on**, not of the picture view. Named: c6 skill 1 check 2, "Card ka kinaara board par ek line ban kar khula hai" over a closed 10 × 4 rectangle (steering 60).
3. A re-ask carries its givens when the board does not: c5-t01 "Woh 0 se kitne kilometre par hai?" (stuck 72, steering 10); c5-t02 "Kaun aage pahuncha, Mona ya Sonu?" over an unmarked line (steady 56), "Toh zyada kisne khaya…" (steady 110).

## C. Remediation boards

1. Each remediation either has a board its `say` speaks (`tests/r7-board-ref.test.mjs` holds that), or is written plainly as an "imagine" telling ("socho…") with no board. The walk keeps what is up for the second kind. Decide each of the ones left without a board: c4 skill 1 unequal-parts (rope and paper); c5-t02 skills 2 and 3 gap-thinking; the five c6 remediations that reuse their follow-up card's figure.
2. No remediation board shows what its follow-up card asks. Named: c5-t01 skill 1 count-marks, `dens [7,12]` draws the 11 lower ticks the follow-up card asks the child to count.
3. c5-t02 skill 3, third remediation: `sayAlt.board` fits `say`, not the second wording.

## D. Joints and forms

1. `joints.afterKeyReturn`, three forms: after a key, one sentence that says this will come again and that they now go back to the earlier question. (The go-on line and the back-to line are not stacked; this is the one form for that place.)
2. `joints.tiredBye`, two forms: one sentence to a child who says she is tired, said before the goodbye. No taste claim, no promise.
3. A further reply form for an aside said again (c4 offtopic 20 and 32 said the same reply twice).
4. c6's hook into its first point reads abrupt ("…utna pitch ka parimap hai. Is triangle ki…", steady 2, offtopic 2): the hook's last sentence leads into the point.

## E. Sentences the judges named

- **c4:** check 3's why "bada tukda aadha cake hai" (the card does not give it; steady 68, offtopic 72); the help at steady 84 "Yahan 2 bachche yeh 20 kanche baant rahe hain" against a card with 5 marbles a child; "upar/neeche" for both the fraction's numbers and the strips' positions (steady 32, 106, 108); "paratha" over a board labelled roti (steering 12); the repeated frame "1/2 hai ya 1/x?".
- **c5-t01:** "3 khambon se kul 4 bane" (the noun is missing; `result` strings are spoken, write them as she would say them); "bata 5"; "Yahi baat doosre sire se" used as a hint (steady 54); "0 aur 1 ke beech N marks hain, barabar doori par" as a frame through skill 1; "0 se 6 gap chalo" twice in skill 3; patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18).
- **c5-t02:** skill 3 step 1's circular "kyunki ginti barabar hai, isliye…"; "likho" in a spoken lesson; "ginti" for the number of cuts in skill 1 step 2 and for the parts taken in skill 3; chocolate and patti for one thing (stuck 36); each worked problem's last line coming back as the child's step; the check-in "Yeh hissa saaf hua?" (9 rows; 015 item 7 asked for this); "Is sawaal ka sahi jawab:" (stuck 12, offtopic 60).
- **c6:** "hissa" in two senses (steady 6); cm and centimetre in neighbouring turns (steady 52, 56); line and rekha (steering 14); "upar" as a side and as a direction (steady 38, 42); points that name the operation before the card asks for it ("60 ko 4 se baanto", steady 72).

## Done means

`node scripts/lesson-scripts/check.mjs <topic>` passes on the four scripts; the compile report shows no new hole; `node --test tests/r7-board-ref.test.mjs tests/r8-learning-*.test.mjs tests/r8-picture-turn.test.mjs` pass (repin counts where a board changed, and say so); every changed or new sentence is listed in `docs/status/learning.md` with old text, new text and the judge's row; every new key is listed with its blind solve.
