# Judge packet: `stambh/tally`, tally marks (class 4 maths, "Tables and pictographs")

This packet is meant to be read on its own: everything a judge needs is in this file and the 25 screenshots beside it. Round 4: the code is on branch `claude/r8-tally-name-r3` (the commit that carries this packet). What changed after rounds 1, 2 and 3 is listed at the end.

**Topic:** c4-maths-ch14-t01, skill s1, "Organise data using tally marks and a table". Class 4, age band 6–9.

**The mix-up it plays out:** `tally-four`. The kit's belief: "Reads a bundle of tally marks as 4, counting only the standing lines". Its signs:
- reads a full tally bundle as 4;
- writes five as five standing lines;
- totals from tallies come out too small.

## The rule the game enforces (never stated on screen)

A bundle is four standing lines with one line across them, and it is worth 5. A row's count is 5 × bundles + loose lines. The child makes every mark herself, and every stroke is legal: a cross after fewer than four lines is allowed. If such a cross were refused, a child could learn the rule by trying "╱" and falling back to "|" when it bounced. When the child presses Check, the game regroups each row by fives, and only then plays out what each group is worth.

## Only levels where the evidence can tell the mix-up from everything else

A row holds n = 5b + s strokes: b bundles and s loose lines (0 to 4). The mix-up's number is M = 4b + s = n − b. The table below lists **every way a child can reach a row's number without the mix-up**, worked out from the rule, not from what judges found. A *slip* is one thing done by accident (one stroke or one bundle). A *reading* is a whole way of reading the tally that is not the mix-up's.

| # | Way, without the mix-up | Her number | Equal to M when | How the level law excludes it |
|---|---|---|---|---|
| 1 | slip: a loose line missed | n − 1 | b = 1 | read always has b ≥ 3. In keep a row with one bundle can be reached this way, but every keep level also has a row of two bundles, which one slip cannot reach (n − 1 ≠ n − 2; see the last rows) |
| 2 | slip: a loose line counted twice | n + 1 | never (M is below n) | — |
| 3 | slip: a bundle skipped | n − 5 | b = 5 | read never serves 5 bundles (25–29); a keep row holds at most 14 (b ≤ 2) |
| 4 | slip: a bundle counted twice | n + 5 | never | — |
| 5 | slip: one bundle's line across missed (that bundle read as 4) | n − 1 | b = 1 | as row 1 |
| 6 | slip: one bundle's line across counted again (that bundle read as 6) | n + 1 | never | — |
| 7 | reading: the loose lines dropped | 5b | s = b | **the law serves no row with as many loose lines as bundles** (6, 12, 18, 24): 2 bundles + 2 lines = 12 reads as 10 both ways |
| 8 | reading: the loose lines counted twice | n + s | never | — |
| 9 | reading: the line across counted as a sixth line | n + b | never | — |
| 10 | reading: the lines across alone | b | 3b + s = 0: never | — |
| 11 | reading: each group as one | b + s | 3b = 0: never | — |
| 12 | reading: each bundle as ten | 10b + s | never | — |
| 13 | reading: the loose lines alone | s | 4b = 0: never | — |
| 14 | two slips in one row (two loose lines missed, or a bundle as 4 and a line missed) | n − 2 | b = 2 | read always has b ≥ 3, so M = n − b is at least 3 short. Keep: see below |

**Keep, across the rows.** In keep the mix-up makes every row with bundles short by its own bundles. Every keep level has bundles in at least two rows, and one of them holds two bundles. That row is two short under the mix-up. No single slip and no reading in the list makes a row exactly two short when its loose lines are not two (row 7 is excluded by the law). So without the mix-up she needs two slips in that row and one more in the other row with a bundle: **at least three slips**. Doing one slip or one reading in each row never gives the mix-up's totals.

**Read.** One row of at least three bundles (never five) and at least one loose line, never as many loose lines as bundles. M is no slip's and no reading's number in the list above. Without the mix-up she needs at least two slips together (for example a bundle skipped and a line counted twice).

The law (`tellsApart` in `src/play/families/stambh/tally.logic.ts`) refuses any other givens. A proof suite in `tests/r8-games-stambh-tally.test.mjs` checks every generated level of both goals (12 seeds × 3 fades). The suite writes the list in the table itself, not from the law's code. It checks that the mix-up's answer differs from every listed slip and reading: in read on the one row; in keep in any one row with the rest right, and as a reading in every row; and that no choice of one slip or reading per row reaches it. It also checks that the law refuses 12, 18, 24, 25, 27, 30, 7, 11 and 13 in read, and keep levels with bundles in one row only, a row of 12, or rows of one bundle only.

**When each form is named** (keep):
- **"counted"**: one stroke per thing in every row, lines across drawn, and every row holding bundles short by exactly its own bundles (the rows with no bundle right).
- **"five"**: one stroke per thing in every row and no line across anywhere, on a level that holds at least three groups of five. (Every keep level does: a row of two bundles and another with at least one.)

## Goal 1: `keep` (keep a tally, then fill the table)

**What she sees.** At the top is a strip where things pass one at a time, for example bangles at a stall. Below it is one card per category: an icon, a name and an empty tally area, with a total box at the right under the heading "Kul". The card she has picked has a thick blue-violet outline (the focus colour; never green). Each kind has one colour wherever it appears: Kaanch orange, Kada blue, Moti red-brown, in the strip, on its card and in `read`. Only the thing passing now stands in the strip; nothing waits faint beside it. There are two large stroke buttons, "|" (one standing line) and "╱" (one line across); they are faint until a row is picked. The line under the world says what she does: "Jo guzre, uski row chhuo, phir ek nishaan lagao" (tap the row of each thing that goes by, then make a mark). Shots: `keep-initial-*` (nothing picked yet), `keep-mid-*` (half the scene kept, the next row picked).

**What she does.**
1. For each thing that passes, she taps its row and then a stroke button. The next thing comes only after she has made a stroke, so nothing is timed.
2. When the scene has passed, the strip folds away, the line changes to "Har row ka kul likho, phir jaancho" (write each row's total, then check), and a number pad appears. She taps a row or its total box and types its total. The digit keys never go dim: a digit typed into a full box (two digits) starts it again.
3. She presses "Jaancho".
4. "Wapas" undoes her last step. Once the scene has passed, "Phir se rakho" (keep again) lets the whole scene pass again from the start: her strokes and totals clear, and "Wapas" brings them back. This is how she repairs her marks after the strip has folded away (`keep-again-360x640`).

**This level's givens and key** (as in the shots). Scene "Choodi ki dukaan par biki choodiyan", rows Kaanch, Kada and Moti. The truth is Kaanch 10, Kada 5, Moti 2: 17 bangles.

The key is right only when each row's marks are correctly bundled *and* each total matches:

| Row | Correct marks | Total |
|---|---|---|
| Kaanch | two bundles | 10 |
| Kada | one bundle | 5 |
| Moti | two standing lines | 2 |

Shot: `keep-end-*`, where all three ticks are green and the line under the world reads "Tumne 17 cheezon ki tally rakhi · jaanch: 1" (you kept a tally of 17 things · checks: 1).

**What the screen shows at a check (every check, mix-up or not):**
- A total box gets a green tick only when its whole row is right: the marks bundled as tallies are AND the total is the row's count. Green is used for nothing else.
- A total that is not the row's count gets a dashed box in amber, the mix-up colour.
- A right total over wrong marks gets neither: no tick and no dashed box. Its row shows what is wrong.
- In each row that is not right (its marks are not bundled, or its total is off), every closed group plays out what it is worth. A count runs over the group's strokes, one amber digit at a time: 1, 2, 3, 4 on the standing lines, then 5 on the line across. For five standing lines, the 5 lands on the fifth line, and that line tips across the four before it. A group closed early (a line across after two lines) is counted to what it holds (3). The last numbers hold for a moment, then **the whole play-out fades** (about 3.5 s after the check): the digits go and a tipped line stands again. **Nothing stays over the tally while a try remains**, so she cannot add up the 5s to get the key (`keep-mal-after-360x640`).
- There are no words, no rings and no ✗.
- The line under the world says what to change, and nothing else:
  - marks wrong, totals right: "Tally phir se rakho" (keep the tally again). "Phir se rakho" is then the lit button.
  - totals wrong, marks right: "Koi kul badlo" (change a total).
  - both: "Koi kul badlo, ya tally phir se rakho".
- "Jaancho" stays off after a check until she changes something (a total, or the tally kept again).

**What a tally-four child does, and what the screen shows.** The game names the mix-up in two forms, both from the kit's signs.
- **The main form: she counts the standing lines** (`keep-mal-*`, `keep-mal-after-360x640`).
  - **What she does.** She draws the bundles correctly but counts only their standing lines, so she types Kaanch 8 and Kada 4, and Moti 2.
  - **What the screen shows.** Kaanch's and Kada's boxes are dashed. Over each of their bundles the count runs 1–4 and lands 5 on the line across (`keep-mal-*`, taken while it holds), then fades (`keep-mal-after`). Moti is right (marks and total) and keeps its tick. The line reads "Koi kul badlo"; the pad is on screen and "Jaancho" waits for a change.
- **The second form: she writes five as five standing lines** (`keep-mal-five-360x640`).
  - **What she does.** She never draws a line across but counts her lines right: Kaanch 10, Kada 5.
  - **What the screen shows.** The rows holding a group of five get no tick, because their marks are not right; Moti (2, no group of five) is right and keeps its tick. No box is dashed, because her numbers are right. The level is not solved. Over each group of five standing lines the count runs to 5, the fifth line tips across the four (amber), and then it fades. The line reads "Tally phir se rakho", "Phir se rakho" is the lit button, and "Jaancho" is off until something changes.

The child who draws five standing lines *and* counts each group as 4 also has no line across, so she is named in this second form ("five").

**Any other wrong answer is an ordinary miss:** a one-off total, a bundle skipped or counted twice, a single missing cross (the slip of a hand), or strokes in the wrong row. Over 2000+ random acts, the tests check that a check names tally-four exactly when the signature holds. The test writes that signature from the kit's signs, not from the game's code.

## Goal 2: `read` (how many does this tally show?)

**What she sees.** One category, for example "Moti", a row of tally bundles, "=" and an empty box, with a number pad below. The line reads "Yeh tally kitne dikhati hai?" Shots: `read-initial-*`, `read-mid-*`.

**What she does.** She types a number on the pad and presses "Jaancho".

**This level's givens and key** (as in the shots). Three bundles and one line, so the key is 16. Shot: `read-end-*`, which shows a full green tick and "Tumne 16 likha · jaanch: 1" (you wrote 16 · checks: 1).

**What a tally-four child does, and what the screen shows.**
- **First check** (`read-mal-*`, `read-mal-after-360x640`):
  - **What she does.** She types 13, counting 4 per bundle.
  - **What the screen shows.**
    - **On the tally**, as in `keep`: over each bundle the count runs 1, 2, 3, 4 on the standing lines and lands 5 on the line across, holds, and fades.
    - **Her box** gets a dashed amber outline.
    - **Below, a plain line from 0** carries her number, an amber dot with an amber "13" label, and, after this first miss only, an arrow pointing the way to go.
    - The line has no unit ticks, no place for the answer and no hops, so the answer cannot be counted off it.
- **A later check** (`read-retry-360x640`): she types 14, still off. The count runs over each bundle again and fades, and her box is dashed. On the line there is **her dot and nothing else: no arrow** after a later miss. Unlimited tries with an arrow would be a higher-or-lower search for the key.
- **Solved after a retry** (`read-end-retry-360x640`): the tick is pale, not full green, and the line reads "Tumne 16 likha · jaanch: 2". The evidence records the first check as incorrect and `first_try` = 0.

## Things the judges should know

- **Can a child pass by trial?**
  - In `keep`, no: a row passes only when its marks are bundled, so typing numbers can't make a row of plain standing lines right.
  - In `read`, she may check again after a miss, as in every Taxila game. Only a correct *first* check counts as first-try evidence. The mix-up is recorded only from her *first* check. No check's screen shows the answer. The play-out shows what each bundle is worth and then fades. Only the first miss shows which way her number is off.
- **What the teacher receives.** The game reports to the lesson `bundles`, the mix-up if named, and in `keep` which sign it was (`sign=five` when no line across was drawn anywhere; `sign=counted` when lines across were drawn and each row holding bundles is short by exactly its own bundles). It also reports `crossesMissing` (keep) and her `answer`. The game never speaks.
- **Why the mix-up may be named from one check.** Every form is a constructed act, not a pick among a few: a typed number (any of 0–99), or a whole tally kept with no line across. The level law also makes the mix-up's numbers at least two slips away in read and three in keep (above).
- **Sizes.**
  - In `keep`, a row holds up to 14 strokes (two bundles and four), and on a 360 px phone it lies on **one line** in both phases.
  - In `read`, a row holds up to 49 (nine bundles and four). At 360 the largest read row takes two lines: four bundles on the first, and five bundles then the four loose lines on the second. The loose lines stand beyond the end of the first line, so **no loose line is under a bundle**. Between the two lines of strokes there is at least half a stroke's height, and room for the count's digits over the second line (`read-largest-360x640`, `read-largest-mal-360x640`). No group is split across lines.
  - The tally layout keeps a row on one line whenever its strokes stay at least 8 px apart and 22 px tall.
  - Fade 1, the easiest, has 16–19 in `read` (three bundles and a few lines) and a scene of 15–18 things across 2 rows in `keep`. Fade 3 has 21–49, and 20–28 things across 3 rows.
  - The largest cases are shot at 360 with the pad open: `keep-largest-360x640` (Car 14, Bus 9, Auto 5; 28 things) and `read-largest-360x640` (49). The browser layout test covers both at both sizes.
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
- the amber count digits and the tipping line over her groups (both goals), which fade;
- in `read`, her amber number on a plain line, with an arrow after the first miss only.

No string states the answer, where a stroke goes, or the rule; a test checks every string for digits and for "five", "across", "khadi", "tirchi" and "bundle". The round "T" at the top is the teacher's avatar from the lesson shell, not part of the game.

## Screenshots (25)

`{keep,read}-{initial,mid,mal,end}-{360x640,1366x768}.png` (16):
- `initial` is the first screen;
- `mid` is part-way through play (keep: the next row picked);
- `mal` is the tally-four answer about 2 s after Jaancho, while the count holds (keep: the main form, "counted");
- `end` is a first-try solve.

At 360×640 only (9):

| Shot | What it shows |
|---|---|
| `keep-mal-after` | the main form 4.6 s after Jaancho: the count has faded; dashed boxes, "Koi kul badlo" |
| `keep-mal-five` | the second form: five standing lines, totals right; no ticks on those rows, "Tally phir se rakho", Jaancho off |
| `keep-again` | after "Phir se rakho": the strip is back, the rows are cleared |
| `keep-largest` | 28 things, Car 14 on one line, the pad open |
| `read-mal-after` | the first miss 4.6 s after Jaancho: the count has faded; her number and the arrow on the line |
| `read-retry` | a second wrong check: the count over each bundle; her dot on the line, no arrow |
| `read-end-retry` | solved on the second check: a pale tick, "jaanch: 2" |
| `read-largest` | 49 on two lines, the pad open |
| `read-largest-mal` | 49 read as 40: the count over each bundle on both lines, clear of the line above |

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
| 3 | Read, first miss: count over each bundle as keep does; no triangle and no unit ticks | On every miss in `read` the count runs over each bundle on the tally itself (1…4, then 5 on the line across). The number line keeps only her amber number and an arrow. The triangle, the unit ticks **and the hops** are gone: with her number known, hops let the answer be counted off (law 2). Shots: `read-mal-*`, `read-retry-360x640`. |
| 4 | A tally with no cross is `sign=five` whatever its totals; `sign=counted` needs crosses drawn and totals short by exactly the bundles | The law names "five" whenever every thing has its stroke and no line across is drawn anywhere, whatever the totals. It names "counted" only when lines across are drawn and every total is short by its row's bundles. The test signature, written from the kit's signs, is changed to match and is still checked over 2000+ random acts per goal. |
| 5 | Kada one colour in both goals; a digit into a full box replaces it; the faded strip item is clearly next or removed | Each kind's colour is its place in its scene, so Kada is blue in `keep` and `read`. A digit typed into a full box starts it again, so the keys never look off. The faded item is removed: only the thing passing now stands in the strip. Shots: `read-*`, `keep-initial-*`, `keep-mid-*`. |
| Laws | Green means right and only right; no key on screen after a miss while a try remains; a mix-up named only by an act a guess rarely produces | Checked by code on every served level in the play cert and in `tests/r8-play-laws.test.mjs`; stambh/tally has no break. Law 1: green only on right rows' ticks; selection in focus; her wrong totals in amber. Law 2: no answer value, unit tick, place or hop after a miss. Law 3: both forms are constructed acts (typed numbers, a whole tally), never one pick among a few. |

## Changes after the evening judging

Rulings: `docs/design/round8/games-judging/RULINGS-2026-11-11-evening.md` (stambh/tally 1–6, and the "Next" paragraph for round 4). Each change is held by a test in `tests/r8-games-stambh-tally.test.mjs` (every generated level, both goals) or `tests/r8-stambh-tally-layout-browser.test.mjs` (the served and largest levels at 360 × 640 and 1366 × 768).

| # | Ruling | What changed | Screens |
|---|---|---|---|
| 1 (blocking) | 2 bundles + 2 lines = 12: the mix-up gives 10, and so does dropping the loose lines. Add that slip; no row whose loose lines equal its bundles; read ≥ 3 bundles; keep bundles in ≥ 2 rows; `counted` only when every row holding bundles is short by exactly its own; `five` only with no cross anywhere and ≥ 3 groups of five; assert each on every level | The law serves no row with as many loose lines as bundles (6, 12, 18, 24), read only 3, 4 or 6–9 bundles with a loose line, keep only with bundles in two rows or more and a row of two bundles (so the mix-up is three slips away). `sign=counted` needs every row holding bundles short by exactly its own bundles, the rest right. `sign=five` needs no line across anywhere and at least three groups of five in the level. Every one of these is asserted on every generated level. Sizes moved with it: fade 1 read 16–19 and keep 15–18 things; the packet's level is now Kaanch 10, Kada 5, Moti 2 (was Kaanch 12, the blocking case), and read is 16 (was 21). | `keep-*`, `read-*` |
| 2 | The 5s left over the bundles let her add up the key: the count plays and fades; nothing stays over the tally while a try remains | The count runs as before, its last numbers hold about a second, and then the whole play-out fades over 0.6 s (a tipped fifth line stands again). Nothing is over the tally from about 3.5 s after the check. Tested on the real view: after the play-out no digit is drawn over the tally in either goal (read keeps only her own number on the line). | `keep-mal-after-360x640`, `read-mal-after-360x640` (new) |
| 3 | The arrow after the first miss only; from the second miss her dot and nothing else | The arrow is drawn only after the first check. A later miss shows the count over the bundles (fading), her dashed box, and her dot and number on the plain line, no arrow. Tested. | `read-retry-360x640` |
| 4 | read's largest case at 360: half a stroke's height between the two lines of strokes; no loose line directly under a bundle | On two lines or more the strokes are spaced at least half their height apart, and at least the height of the count's digits, so the count over the second line is clear of the first. The closed groups fill the first line four at a time and the rest, with the loose lines last, take the second, so the loose lines stand beyond the end of the line above. The read area gained 10 px from the number line's reserve. Both rules are unit-tested on read rows of 21–49 at several box sizes. | `read-largest-360x640`, `read-largest-mal-360x640` (new) |
| 5 | The lime action button beside green ticks | No change here: the action colour comes with Design's patch 002 (it is not green in either theme). | — |
| 6 | The packet said no box gets a tick in the "five" state; the screen rightly ticks the rows that are right | Corrected: a row with no group of five (Moti 2) is right and keeps its tick; no box of a row holding a group of five gets one. | `keep-mal-five-360x640` |
| Next | Before round 4, write every way a child can reach the mix-up's number without the mix-up, from the level law, and show the law excludes each; assert it | The table "Only levels where the evidence can tell the mix-up from everything else" above: six slips, seven readings and two slips in one row, each with when it equals the mix-up and why the law excludes it. The proof suite writes the same list independently and asserts it on every generated level of both goals. | — |
