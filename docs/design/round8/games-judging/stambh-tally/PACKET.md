# Judge packet: `stambh/tally`, tally marks (class 4 maths, "Tables and pictographs")

This packet is meant to be read on its own: everything a judge needs is in this file and the 22 screenshots beside it. Round 3: the code is on branch `claude/r8-laws-tally` (the commit that carries this packet). What changed after rounds 1 and 2 is listed at the end.

**Topic:** c4-maths-ch14-t01, skill s1, "Organise data using tally marks and a table". Class 4, age band 6–9.

**The mix-up it plays out:** `tally-four`. The kit's belief: "Reads a bundle of tally marks as 4, counting only the standing lines". Its signs:
- reads a full tally bundle as 4;
- writes five as five standing lines;
- totals from tallies come out too small.

## The rule the game enforces (never stated on screen)

A bundle is four standing lines with one line across them, and it is worth 5. A row's count is 5 × bundles + single lines. The child makes every mark herself, and every stroke is legal: a cross after fewer than four lines is allowed. If such a cross were refused, a child could learn the rule by trying "╱" and falling back to "|" when it bounced. When the child presses Check, the game regroups each row by fives, and only then plays out what each group is worth.

**Only levels where the evidence can tell the mix-up from a slip are served.** The mix-up's answer must differ from every one-bundle slip: one bundle skipped (5 short), one bundle counted twice (5 over), or one single line off (1 either way). So:
- `read` never serves a row of bundles only (there is always at least one single line), and never a row with 1 bundle (the mix-up would give n − 1, the same as a one-off slip) or 5 bundles (it would give n − 5, the same as skipping a bundle).
- `keep` always has at least two bundles across the rows.

The law refuses any other givens, and the tests check the condition on every generated level of both goals.

## Goal 1: `keep` (keep a tally, then fill the table)

**What she sees.** A strip at the top where things pass one at a time, for example bangles at a stall. Below it is one card per category: an icon, a name and an empty tally area, with a total box at the right under the heading "Kul". The card she has picked has a thick blue-violet outline (the focus colour; never green). Each kind has one colour wherever it appears: Kaanch orange, Kada blue, Moti red-brown, in the strip, on its card and in `read`. Only the thing passing now stands in the strip; nothing waits faint beside it. There are two large stroke buttons, "|" (one standing line) and "╱" (one line across); they are faint until a row is picked. The line under the world says what she does: "Jo guzre, uski row chhuo, phir ek nishaan lagao" (tap the row of each thing that goes by, then make a mark). Shots: `keep-initial-*` (nothing picked yet), `keep-mid-*` (half the scene kept, the Kaanch row picked).

**What she does.**
1. For each thing that passes, she taps its row and then a stroke button. The next thing comes only after she has made a stroke, so nothing is timed.
2. When the scene has passed, the strip folds away, the line changes to "Har row ka kul likho, phir jaancho" (write each row's total, then check), and a number pad appears. She taps a row or its total box and types its total. The digit keys never go dim: a digit typed into a full box (two digits) starts it again.
3. She presses "Jaancho".
4. "Wapas" undoes her last step. Once the scene has passed, "Phir se rakho" (keep again) lets the whole scene pass again from the start: her strokes and totals clear, and "Wapas" brings them back. This is how she repairs her marks after the strip has folded away (`keep-again-360x640`).

**This level's givens and key** (as in the shots). Scene "Choodi ki dukaan par biki choodiyan", rows Kaanch, Kada and Moti. The truth is Kaanch 12, Kada 3, Moti 2: 17 bangles.

The key is right only when each row's marks are correctly bundled *and* each total matches:

| Row | Correct marks | Total |
|---|---|---|
| Kaanch | two bundles plus two lines | 12 |
| Kada | three standing lines | 3 |
| Moti | two standing lines | 2 |

Shot: `keep-end-*`, where all three ticks are green and the line under the world reads "Tumne 17 cheezon ki tally rakhi · jaanch: 1" (you kept a tally of 17 things · checks: 1).

**What the screen shows at a check (every check, mix-up or not):**
- A total box gets a green tick only when its whole row is right: the marks bundled as tallies are AND the total is the row's count. Green is used for nothing else.
- A total that is not the row's count gets a dashed box in amber, the mix-up colour.
- A right total over wrong marks gets neither: no tick and no dashed box. Its row shows what is wrong.
- In each row that is not right (its marks are not bundled, or its total is off), every closed group plays out what it is worth. A count runs over the group's strokes, one amber digit at a time: 1, 2, 3, 4 on the standing lines, then 5 on the line across. For five standing lines, the 5 lands on the fifth line, and that line tips across the four before it. The group's last number stays over it. A group closed early (a line across after two lines) is counted to what it holds (3).
- There are no words, no rings and no ✗.
- The line under the world says what to change, and nothing else:
  - marks wrong, totals right: "Tally phir se rakho" (keep the tally again). "Phir se rakho" is then the lit button.
  - totals wrong, marks right: "Koi kul badlo" (change a total).
  - both: "Koi kul badlo, ya tally phir se rakho".
- "Jaancho" stays off after a check until she changes something (a total, or the tally kept again).

**What a tally-four child does, and what the screen shows.** The game names the mix-up in two forms, both from the kit's signs.
- **The main form: she counts the standing lines** (`keep-mal-*`).
  - **What she does.** She draws the bundles correctly but counts only their standing lines, so she types Kaanch 10.
  - **What the screen shows.** Kaanch's box is dashed. Over each of Kaanch's bundles the count runs 1–4 and lands 5 on the line across, and a 5 stays over each bundle. Kada and Moti are right (marks and totals) and keep their ticks. The line reads "Koi kul badlo"; the pad is on screen and "Jaancho" waits for a change.
  - **When the game names it.** It is named when one stroke was made per thing in every row, at least one line across is drawn, and every total is the row's count less its bundles. That means each wrong total is short by exactly its row's bundles.
- **The second form: she writes five as five standing lines** (`keep-mal-five-360x640`).
  - **What she does.** She never draws a line across but counts her lines right: Kaanch 12.
  - **What the screen shows.** No box gets a tick, because no row with a group of five is right, and no box is dashed, because her numbers are right. The level is not solved. Over each group of five standing lines the count runs to 5, the fifth line tips across the four (amber), and a 5 stays over the group. The line reads "Tally phir se rakho", "Phir se rakho" is the lit button, and "Jaancho" is off until something changes.
  - **When the game names it.** It is named when one stroke was made per thing in every row and there is no line across anywhere, whatever the totals are.

The child who draws five standing lines *and* counts each group as 4 also has no line across, so she is named in this second form ("five").

**Any other wrong answer is an ordinary miss:** a one-off total, a bundle skipped or counted twice, a single missing cross (the slip of a hand), or strokes in the wrong row. Over 2000+ random acts, the tests check that a check names tally-four exactly when the signature holds. The test writes that signature from the kit's signs, not from the game's code.

## Goal 2: `read` (how many does this tally show?)

**What she sees.** One category, for example "Kada", a row of tally bundles, "=" and an empty box, with a number pad below. The line reads "Yeh tally kitne dikhati hai?" Shots: `read-initial-*`, `read-mid-*`.

**What she does.** She types a number on the pad and presses "Jaancho".

**This level's givens and key** (as in the shots). Four bundles and one line, so the key is 21. Shot: `read-end-*`, which shows a full green tick and "Tumne 21 likha · jaanch: 1" (you wrote 21 · checks: 1).

**What a tally-four child does, and what the screen shows.**
- **First check** (`read-mal-*`):
  - **What she does.** She types 17, counting 4 per bundle.
  - **What the screen shows.**
    - **On the tally**, as in `keep`: over each bundle the count runs 1, 2, 3, 4 on the standing lines and lands 5 on the line across. A 5 stays over each of the four bundles, in amber.
    - **Her box** gets a dashed amber outline.
    - **Below, a plain line from 0** carries her number, an amber dot with an amber "17" label, and an arrow pointing the way to go.
    - The line has no unit ticks, no place for the answer and no hops, so the answer cannot be counted off it.
- **A later check** (`read-retry-360x640`): she types 19, still off. The screen is the same: the count over each bundle, her amber "19" and the arrow.
- **Solved after a retry** (`read-end-retry-360x640`): the tick is pale, not full green, and the line reads "Tumne 21 likha · jaanch: 2". The evidence records the first check as incorrect and `first_try` = 0.

## Things the judges should know

- **Can a child pass by trial?**
  - In `keep`, no: a row passes only when its marks are bundled, so typing numbers can't make a row of plain standing lines right.
  - In `read`, she may check again after a miss, as in every Taxila game. Only a correct *first* check counts as first-try evidence. The mix-up is recorded only from her *first* check. No check's screen shows the answer: it shows what each bundle is worth and which way her number is off.
- **What the teacher receives.** The game reports to the lesson `bundles`, the mix-up if named, and in `keep` which sign it was (`sign=five` when no line across was drawn anywhere; `sign=counted` when lines across were drawn and each total is short by its row's bundles). It also reports `crossesMissing` (keep) and her `answer`. The game never speaks.
- **Why the mix-up may be named from one check.** Every form is a constructed act, not a pick among a few: a typed number (any of 0–99), or a whole tally kept with no line across. A guess rarely produces either.
- **Sizes.**
  - In `keep`, a row holds up to 14 strokes (two bundles and four), and on a 360 px phone it lies on **one line** in both phases.
  - In `read`, a row holds up to 49 (nine bundles and four). At 360 the largest read row takes two lines of five groups, and no group is split across lines.
  - The tally layout keeps a row on one line whenever its strokes stay at least 8 px apart and 22 px tall.
  - Fade 1, the easiest, has 11–19 in `read` (two or three bundles and a few lines) and a scene of 10–14 things across 2 rows in `keep`. Fade 3 has 21–49 and 16–28 things across 3 rows.
  - The largest cases are shot at 360 with the pad open: `keep-largest-360x640` (Car 14, Bus 8, Auto 6; 28 things) and `read-largest-360x640` (49). The browser layout test covers both at both sizes.
- **Not checked yet:** on a real phone, or with a child.

## Every child-facing string

The lesson is in Hinglish (shown), Hindi or English; the game shows only the lesson's language.

| Where | Hinglish | Hindi | English |
|---|---|---|---|
| game name (header) | Stambh | स्तंभ | Graphs |
| instruction, keep (scene) | Jo guzre, uski row chhuo, phir ek nishaan lagao | जो गुज़रे, उसकी पंक्ति छुओ, फिर एक निशान लगाओ | Tap the row of each thing that goes by, then make a mark |
| instruction, keep (table) | Har row ka kul likho, phir jaancho | हर पंक्ति का कुल लिखो, फिर जाँचो | Write each row's total, then check |
| instruction, keep (after a miss: marks and totals off) | Koi kul badlo, ya tally phir se rakho | कोई कुल बदलो, या टैली फिर से रखो | Change a total, or keep the tally again |
| instruction, keep (after a miss: marks off, totals right) | Tally phir se rakho | टैली फिर से रखो | Keep the tally again |
| instruction, keep (after a miss: totals off, marks right) | Koi kul badlo | कोई कुल बदलो | Change a total |
| instruction, read | Yeh tally kitne dikhati hai? | यह टैली कितने दिखाती है? | How many does this tally show? |
| end line, keep | Tumne {n} cheezon ki tally rakhi · jaanch: {k} | तुमने {n} चीज़ों की टैली रखी · जाँच: {k} | You kept a tally of {n} things · checks: {k} |
| end line, read | Tumne {n} likha · jaanch: {k} | तुमने {n} लिखा · जाँच: {k} | You wrote {n} · checks: {k} |
| scene, traffic | Chauraahe se guzri gaadiyan | चौराहे से गुज़री गाड़ियाँ | Vehicles at the crossing |
| scene, bangles | Choodi ki dukaan par biki choodiyan | चूड़ी की दुकान पर बिकी चूड़ियाँ | Bangles sold at the stall |
| row names, traffic | Car · Bus · Auto · Cycle | कार · बस · ऑटो · साइकिल | Car · Bus · Auto · Cycle |
| row names, bangles | Kaanch · Kada · Moti | काँच · कड़ा · मोती | Glass · Kada · Beaded |
| total column heading | Kul | कुल | Total |
| check button | Jaancho | जाँचो | Check |
| undo button | Wapas | वापस | Undo |
| keep-again button | Phir se rakho | फिर से रखो | Keep again |
| stroke buttons | \| and ╱ (marks, no words) | same | same |
| number pad | 0–9 and ⌫ | same | same |

`{n}` and `{k}` are digits: what she counted or wrote, and how many checks she made. Numbers are always digits.

The game shows no feedback words: no "right", no "wrong", no hint text, no praise. Feedback is only:
- green ticks on right rows (pale after a retry);
- amber dashed boxes on totals that are off;
- the amber count digits and the tipping line over her groups (both goals);
- in `read`, her amber number on a plain line with an arrow.

No string states the answer, where a stroke goes, or the rule; a test checks every string for digits and for "five", "across", "khadi", "tirchi" and "bundle". The round "T" at the top is the teacher's avatar from the lesson shell, not part of the game.

## Screenshots (22)

`{keep,read}-{initial,mid,mal,end}-{360x640,1366x768}.png` (16):
- `initial` is the first screen;
- `mid` is part-way through play (keep: the next row picked);
- `mal` is the tally-four answer just after Jaancho (keep: the main form, "counted");
- `end` is a first-try solve.

At 360×640 only (6):

| Shot | What it shows |
|---|---|
| `keep-mal-five` | the second form: five standing lines, totals right; no ticks, "Tally phir se rakho", Jaancho off |
| `keep-again` | after "Phir se rakho": the strip is back, the rows are cleared |
| `keep-largest` | 28 things, Car 14 on one line, the pad open |
| `read-retry` | a second wrong check: the count over each bundle, her number and an arrow |
| `read-end-retry` | solved on the second check: a pale tick, "jaanch: 2" |
| `read-largest` | 49, the pad open |

The 360×640 shots are at 2× pixel density. The 1366×768 shots were scaled to 1× for size; colours are unchanged (RGB, no palette).

## Changes after judging round 1

| # | Finding | What changed |
|---|---|---|
| 1 (blocking) | keep did not name or show the main form | The game now names tally-four from the totals: one stroke per thing, and every total the row's count less its bundles, crosses drawn or not ("counted"). It also names the kit's second sign, five standing lines with no line across and the totals right ("five"). Both forms are played out (`keep-mal-*`, `keep-mal-five`). The test-written signature matches the named checks over 2000+ random acts per goal, and every one-bundle slip, with or without one missing cross, is tested never to be named. |
| 2 (blocking) | read's 5-bundle level collided with a skipped bundle | `read` never serves bundles only, and never 1 or 5 bundles. `keep` always has at least two bundles. The law refuses any other givens. A test computes, on every generated level of both goals (12 seeds × 3 fades), that the mix-up's answer differs from every slip: one bundle skipped, one counted twice, or one single off. |
| 3 (blocking) | dashed ring + ✗ on five lines read as "five is too many" | The ring and ✗ are gone. A group now plays out its worth: a count of 1…5 over its strokes, and the fifth standing line tips across the four; its 5 stays over the group. No words. |
| 4 | read hops let 25 be read off; end screen same after a retry | The hops and the triangle show only on the first check. Later checks show only her number and an arrow, with no unit ticks. A solve after a retry ends with a pale tick, and the end line says "jaanch: 2". |
| 5 | her wrong value was green, the truth amber | Her dot and label are amber, matching her dashed box. The true place is a plain dark triangle, and the hops are dark grey. Green is used only for ticks. |
| 6 | no visible selected row; instruction did not say rows are tapped; no repair path | Rows are cards while the scene passes, and the picked one is outlined. The instruction says to tap the row, then make a mark. The table phase and after-a-miss phase have their own lines. "Phir se rakho" keeps the scene again (Wapas undoes it), and the after-a-miss line names that path. |
| 7 | Auto (7) wrapped at 360 though the packet claimed ten bundles fit | The tally layout keeps a row on one line while strokes stay at least 8 px apart and 22 px tall. Keep rows of up to 14 now lie on one line at 360, and the claims above are restated. The unit test covers keep rows of 5–14 at the 360 box and the 49 read row (no group split). The browser test and screenshots cover the largest keep (28 things, a row of 14) and read (49) cases with the pad open. |
| 8 | the instruction stayed after the task; end said nothing | At the end the instruction is replaced by a neutral factual line in the lesson's language, in digits: what she counted or wrote and how many checks. No praise and no rule. |

## Changes after judging round 2

| # | Ruling (RULINGS-2026-11-11.md, stambh/tally) | What changed |
|---|---|---|
| 1 | The "five" state must point only at "Phir se rakho"; "Jaancho" off until something changes; a tick only when marks and total are both right | A tick now needs the row's marks bundled **and** its total right. A right total over wrong marks gets no tick and no dashed box. After a check the line says what to change: "Tally phir se rakho" (marks off, totals right: the five state), "Koi kul badlo" (totals off, marks right), or both. In the five state "Phir se rakho" is the lit button. "Jaancho" stays off after any check until a total changes or the tally is kept again. Shot: `keep-mal-five-360x640`. |
| 2 | Selection outlines take the focus colour | The picked row and the picked total box are outlined in the focus colour, a blue-violet, in every art direction. No green is used for a selection, for her wrong value or for anything but a right row's tick. The action button "Jaancho" keeps the action colour. Shots: `keep-mid-*`, `keep-mal-*`. |
| 3 | Read, first miss: count over each bundle as keep does; no triangle and no unit ticks | On every miss in `read` the count runs over each bundle on the tally itself (1…4, then 5 on the line across; a 5 stays). The number line keeps only her amber number and an arrow. The triangle, the unit ticks **and the hops** are gone: with her number known, hops let the answer be counted off (law 2). Shots: `read-mal-*`, `read-retry-360x640`. |
| 4 | A tally with no cross is `sign=five` whatever its totals; `sign=counted` needs crosses drawn and totals short by exactly the bundles | The law names "five" whenever every thing has its stroke and no line across is drawn anywhere, whatever the totals. It names "counted" only when lines across are drawn and every total is short by its row's bundles. The test signature, written from the kit's signs, is changed to match and is still checked over 2000+ random acts per goal. |
| 5 | Kada one colour in both goals; a digit into a full box replaces it; the faded strip item is clearly next or removed | Each kind's colour is its place in its scene, so Kada is blue in `keep` and `read`. A digit typed into a full box starts it again, so the keys never look off. The faded item is removed: only the thing passing now stands in the strip. Shots: `read-*`, `keep-initial-*`, `keep-mid-*`. |
| Laws | Green means right and only right; no key on screen after a miss while a try remains; a mix-up named only by an act a guess rarely produces | Checked by code on every served level in the play cert and in `tests/r8-play-laws.test.mjs`; stambh/tally has no break. Law 1: green only on right rows' ticks; selection in focus; her wrong totals in amber. Law 2: no answer value, unit tick, place or hop after a miss. The 5 over each bundle stays, as ruling 3 asks. Law 3: both forms are constructed acts (typed numbers, a whole tally), never one pick among a few. |
