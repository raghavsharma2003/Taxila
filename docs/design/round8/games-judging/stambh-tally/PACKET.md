# Judge packet: `stambh/tally`, tally marks (class 4 maths, "Tables and pictographs")

This packet is meant to be read on its own: everything a judge needs is in this file and the 25 screenshots beside it. Round 4: the code is on branch `claude/r8-tally-name-r3` (the commit that carries this packet). What changed after rounds 1, 2 and 3 is listed at the end. **Gate 2 (evidence) is the section "Gate 2: evidence" below, on branch `claude/r8-gate2-tally`; a judge for gate 2 reads that section only.**

**Topic:** c4-maths-ch14-t01, skill s1, "Organise data using tally marks and a table". Class 4, age band 6–9.

**The mix-up it plays out:** `tally-four`. The kit's belief: "Reads a bundle of tally marks as 4, counting only the standing lines". Its signs:
- reads a full tally bundle as 4;
- writes five as five standing lines;
- totals from tallies come out too small.

## The rule the game enforces (never stated on screen)

A bundle is four standing lines with one line across them, and it is worth 5. A row's count is 5 × bundles + loose lines. The child makes every mark herself, and every stroke is legal: a cross after fewer than four lines is allowed. If such a cross were refused, a child could learn the rule by trying "╱" and falling back to "|" when it bounced. When the child presses Check, the game regroups each row by fives, and only then plays out what each group is worth.

## Gate 2: evidence

Ruling (`RULINGS-2026-11-11-night.md`, decision `dc-r8-game-gate-play-then-evidence`): "stop listing slips. `keep` may name from one level (its two totals together need three slips). `read` names tally-four only when the mix-up's number is typed on two levels whose bundles and loose lines both differ." **Law 3's number:** an act that a blind guess or one ordinary slip produces more than 1 time in 10 names nothing by itself. **Read per session** (`RULINGS-2026-11-15.md`, "To Games, 2026-11-16"): what must be rare is a child named a mix-up she does not hold over one sitting, so the 1 in 10 is the chance over a whole session, not per pair. The pair rule was over that line (5 in 32 over three levels); read now names on three levels, or on two when one of them is *firm*, within the session's first four levels (below, "Read: per session").

Branch `claude/r8-gate2-tally`; the per-session rule on `claude/r8-gate2-session`. Every number below is computed by `tests/r8-games-stambh-tally.test.mjs` ("gate 2, keep", "gate 2, read", "gate 2, read per session") from the tally, the pad and the ways of reading a tally, not from the game's code, and asserted on every generated level (12 seeds × 3 fades: 269 keep levels) and every read row the level law serves.

**What counts as what.** A row has b bundles and s loose lines, n = 5b + s things. The mix-up's number is M = 4b + s = n − b.
- **A way of reading** is how she reads a whole tally, the same on every level and every row: the right way (5b + s), or one of seven others: the loose lines dropped (5b), the loose lines doubled (5b + 2s), the line across as a sixth line (6b + s), the lines across alone (b), each group as one (b + s), each bundle as ten (10b + s), the loose lines alone (s). Because a way of reading repeats, no repeat can tell it from the mix-up, so the level law refuses the only row where a way of reading gives M by itself: the loose lines dropped when s = b (6, 12, 18, 24).
- **An ordinary slip** is one accident, read her way. *Counting:* a bundle skipped or counted twice, a loose line missed or counted twice, a stroke of a bundle missed or counted again (a missed line across). *Typing* on the pad (1 2 3 4 5 6 / 7 8 9 0 ⌫, six to a row): one key landing on a key that touches it (side or corner; 9 and 0 touch), the two digits swapped, a key not registered, a key pressed twice. A slip that changes nothing is not listed.
- **The chance of one slip** giving M on a row is the share of the listed slips of one kind (counting, or typing: whichever is larger) that land on M. Slips are taken as certain: she slips on every level. The worst way of reading is taken on every row.
- **A blind guess** is any number 0 to 99 on the pad: 1 in 100 per box.

### Keep: named from one level

The mix-up's totals in keep are every row short by its own bundles. Keep rows hold up to 14 things, so a row has at most two bundles.

| Row (its count) | Bundles | The mix-up's total | Fewest ordinary slips to it, read right | The slips |
|---|---|---|---|---|
| 2, 3, 4 | 0 | the count | 0 (it is right) | — |
| 5, 7, 8, 9 | 1 | count − 1 | 1 | a loose line or a line across missed; for 5, 8, 9 also the key beside |
| 10, 11, 13, 14 | 2 | count − 2 | 2 | two of those; no one counting slip and no typing slip moves a total by exactly 2 (10→8, 11→9: a digit lost and another changed; 13→11, 14→12: 3 and 1, 4 and 2 do not touch on the pad) |
| 6, 12 | 1, 2 | 5, 10 | 0 by the loose lines dropped | **refused by the law** (s = b) |

The level law serves keep only with bundles in at least two rows and one row of two bundles, so **her totals together need at least 3 ordinary slips** to come out as the mix-up's. With any other way of reading (counted as one step, once for the level) the fewest is also 3 or more.

| Keep, over all 269 generated levels | Result | Law 3's line |
|---|---|---|
| Fewest ordinary slips to the mix-up's totals ("counted") | 3 on 189 levels, 4 on 72, 5 on 8; never under 3 | one slip names nothing: it never gives them |
| A blind guess, "counted" (every total typed at random) | (1/100)^rows: 1 in 10,000 (2 rows), 1 in 1,000,000 (3 rows) | under 1 in 10 |
| "five" (no line across anywhere): the slips | one per missing line across: at least 3 (every level has three groups of five) | — |
| A blind guess, "five" (each stroke one of the two buttons at random) | at most (1/2)^15 = 1 in 32,768 (the smallest scene is 15 things) | under 1 in 10 |
| One slip in EVERY row, the worst way of reading | at most 1 in 16 (7 + 11, 5 + 13, 5 + 11 with the loose lines dropped: 1 in 4 per row); 0 when read right (the two-bundle row is never one slip away) | under 1 in 10 |
| **Per session** (accepted as proved, 2026-11-16; keep is not capped) | one ordinary slip: 0 on every level, so 0 over any session; a blind guess: 1 − (1 − 1/10,000)^n over n levels, under 1 in 10 up to 1,053 keep levels | under 1 in 10 |

So keep names tally-four from its first check, as before (`sign=counted` or `sign=five`).

### Read: named on three levels, or two with a firm one (per session)

One read level is one typed number. The table gives, for every row the level law serves (16 to 49; 18 and 24 refused), the chance that one slip lands on the mix-up's number. A row where no slip, read any of the eight ways, lands on it is **firm** (the last column): only a blind guess gives the mix-up's number there, 1 in 100. Every other row is **weak**.

| n | Bundles + loose | M | One slip, read right | Worst way of reading | One slip, worst way | Kind, per session |
|---|---|---|---|---|---|---|
| 16 | 3 + 1 | 13 | 0 | line across as a sixth | 1 in 6 | weak: three needed |
| 17 | 3 + 2 | 14 | 0 | loose lines dropped | 1 in 4 | weak: three needed |
| 19 | 3 + 4 | 16 | 0 | loose lines dropped | 1 in 4 | weak: three needed |
| 20 | 4 + 0 | 16 | 0 | none lands | 0 | **firm**: a pair with it names |
| 21 | 4 + 1 | 17 | 0 | loose lines doubled | 1 in 6 | weak: three needed |
| 22 | 4 + 2 | 18 | 0 | none lands | 0 | **firm**: a pair with it names |
| 23 | 4 + 3 | 19 | 0 | loose lines dropped | 1 in 4 | weak: three needed |
| 25 | 5 + 0 | 20 | 1 in 4 | right | 1 in 4 | weak: three needed |
| 26 | 5 + 1 | 21 | 1 in 6 | right | 1 in 6 | weak: three needed |
| 27 | 5 + 2 | 22 | 1 in 6 | right | 1 in 6 | weak: three needed |
| 28 | 5 + 3 | 23 | 1 in 6 | right | 1 in 6 | weak: three needed |
| 29 | 5 + 4 | 24 | 1 in 6 | loose lines dropped | 1 in 4 | weak: three needed |
| 30 | 6 + 0 | 24 | 0 | none lands | 0 | **firm**: a pair with it names |
| 31 | 6 + 1 | 25 | 0 | loose lines dropped | 1 in 4 | weak: three needed |
| 32 | 6 + 2 | 26 | 0 | each bundle as ten | 1 in 9 | weak: three needed |
| 33 | 6 + 3 | 27 | 0 | none lands | 0 | **firm**: a pair with it names |
| 34 | 6 + 4 | 28 | 0 | loose lines doubled | 1 in 13 | weak: three needed |
| 35 | 7 + 0 | 28 | 0 | none lands | 0 | **firm**: a pair with it names |
| 36 | 7 + 1 | 29 | 0 | none lands | 0 | **firm**: a pair with it names |
| 37 | 7 + 2 | 30 | 0 | loose lines dropped | 1 in 4 | weak: three needed |
| 38 | 7 + 3 | 31 | 1 in 13 | loose lines doubled | 1 in 10 | weak: three needed |
| 39 | 7 + 4 | 32 | 1 in 13 | right | 1 in 13 | weak: three needed |
| 40 | 8 + 0 | 32 | 0 | none lands | 0 | **firm**: a pair with it names |
| 41 | 8 + 1 | 33 | 0 | none lands | 0 | **firm**: a pair with it names |
| 42 | 8 + 2 | 34 | 0 | loose lines doubled | 1 in 10 | weak: three needed |
| 43 | 8 + 3 | 35 | 0 | loose lines dropped | 1 in 4 | weak: three needed |
| 44 | 8 + 4 | 36 | 0 | none lands | 0 | **firm**: a pair with it names |
| 45 | 9 + 0 | 36 | 0 | none lands | 0 | **firm**: a pair with it names |
| 46 | 9 + 1 | 37 | 0 | loose lines doubled | 1 in 10 | weak: three needed |
| 47 | 9 + 2 | 38 | 0 | none lands | 0 | **firm**: a pair with it names |
| 48 | 9 + 3 | 39 | 0 | each bundle as ten | 1 in 13 | weak: three needed |
| 49 | 9 + 4 | 40 | 1 in 12 (9 → 0 on the pad) | loose lines dropped | 1 in 4 | weak: three needed |

Many rows are over 1 in 10 alone (1 in 4 at worst), so **one read level names nothing**: its typed number is a pick at chance weight. The pair figures below were the evidence for the old two-level rule; read per session they are not enough ("Read: per session", after them). Two slips are independent, so the chance is the product. Over every pair of servable rows whose bundles and loose lines both differ (350 pairs), the same way of reading on both:

| Read, two levels (per pair: the old rule) | Chance | Law 3's line, per pair |
|---|---|---|
| The worst pair: 17 (3 + 2) then 23 (4 + 3), the loose lines dropped | 1/4 × 1/4 = **1 in 16** | under 1 in 10 |
| How 17 gets 1 in 4: dropping the loose lines reads 15; the counting slips open read that way are a bundle skipped (10), a bundle counted twice (20), a stroke of a bundle missed (14 = M) or counted again (16): 1 of 4. Typing 15: 25, 75, 85, 14 (= M), 16, 10, 51, 1, 5: 1 of 9. The larger is 1 in 4. 23 the same way: 20 read; 15, 25, 19 (= M), 21: 1 in 4 | | |
| The judges' cases: 49 then 37 (the loose lines dropped), 49 then 27 (read right: 9 → 0 on the pad, then a bundle skipped) | 1/4 × 1/4 = 1 in 16; 1/12 × 1/6 = 1 in 72 | under 1 in 10 |
| A blind guess on both | 1/100 × 1/100 = 1 in 10,000 | under 1 in 10 |

Why both must differ (the ruling): a level with the same bundles or the same loose lines repeats half of the tally, so a slip tied to that half can repeat with it, and the two slips are no longer independent. Every pair in the table changes both. The server keeps read's surface as two parts, its bundles and its loose lines (`tallySurface`), and counts a sighting only when every part differs from every other sighting's (`server/play/levels.js`, `surfacesDiffer`, `repeatMet`). It remembers the last six picks in the session (`CHANCE_MEMORY`), more than the four levels a session names from.

#### Read: per session

**How many read levels a session serves.** A session has no end of its own: `/api/play/next` serves another level whenever it is asked, and every act signs the session token afresh, so nothing in how a session serves levels bounds the count. The bound is therefore set: **a pick with a gate-2 rule is named only on the session's first four levels** (`NAMING_LEVELS = 4` in `server/play/levels.js`, read from the session body's level count `n`, which only the server sets). Later levels of the session still grade right or wrong and still play out; they name no pick. Every figure below is over n = 4 read levels (a session that serves another game first has fewer).

**The rule** (`tallyLogic.chanceRepeat` `read:tally-four`: three sightings, or two when one is firm; `firmSighting`): tally-four is named when the mix-up's number has been typed on **three** read levels whose bundles and loose lines differ two by two, or on **two** such levels when **one of them is a firm row**. Of main's two ways this is (b), "two one-slip levels need a third". (a), "a one-slip level counts only beside one that is not", is also under the line (1 in 114 at worst), but it names strictly less: it never names a child whose levels were all weak rows (every fade-1 row is weak), while (b) names everything (a) names and three weak sightings too. Firm rows: 20, 22, 30, 33, 35, 36, 40, 41, 44, 45, 47 (fades 2 and 3); the law's own test (`oneSlipFromMixup`) is checked against this table on every servable row.

**The arithmetic.** Each of the 4 levels lands on the mix-up's number independently, a weak row with chance w, a firm row with chance f; every split of the four into firm and weak rows is tried and the worst is printed. Surfaces are left out (the parts that must differ), so these are upper bounds for any order of rows.

| Read, per session (n = 4 levels) | The worst split | Chance | Law 3's line |
|---|---|---|---|
| The child who slips on every level (the worst way of reading, the worst rows: w = 1/4; a firm row only by a blind guess, f = 1/100) | four weak rows, three or four of them land: 4 × (1/4)³ × (3/4) + (1/4)⁴ = 12/256 + 1/256 | **13 in 256 = 1 in 19.7** | under 1 in 10 |
| (the same child, one firm row among the four) | 1/100 × (1 − (3/4)³) + 99/100 × (1/4)³ | 1 in 47 | under |
| The blind guesser (every row 1 in 100) | three firm rows and one weak: two or more land, one of them firm | **1 in 1,689** | under 1 in 10 |
| *Before:* the pair rule over three levels (main's figure) | two or more of three land: 3 × (1/4)² × (3/4) + (1/4)³ | 5 in 32 = 1 in 6.4 | **over** |
| *Before:* the pair rule over four levels (and it grew without end: there was no cap) | 1 − (3/4)⁴ − 4 × (1/4) × (3/4)³ | 67 in 256 = 1 in 3.8 | **over** |
| Why the cap is four: this rule over five levels | three or more of five weak land: 106 in 1,024 | 1 in 9.7 | over |

**What changed in the level law.** The slip list (`TALLY_SLIPS`, `slipsTo`, `MIN_SLIPS`) is gone. Kept: no row with as many loose lines as bundles (a way of reading, not an accident: 6, 12, 18, 24); keep's bundles in two rows with a row of two (the three slips above). Dropped from read, because the chance table covers them: three bundles or more (the fades still serve 16 and up), never five bundles, at least one loose line. **Read now serves 20, 25–30, 35, 40 and 45 too** (fades 2 and 3; fade 1 is still 16, 17, 19). No view code changed (the new rows are drawn as every row is); the play cert was run again for `stambh/tally` (16 samples, every size passing), and the layout tests ran on every generated level, these included.

**What changes when main switches naming on** (removes `stambh/tally` from `NAMING_OFF` in `shared/play.ts`; no screen changes):
- keep: a first check with either sign reaches the teacher as tally-four from that level (`mal=tally-four`, `sign=counted|five`, the evidence row named at the game weight).
- read: a first check on the mix-up's number reaches the lesson as an ordinary miss: no mix-up in the evidence row, the facts row, the seam or the trail. The session remembers it (`chance`, with the level's two parts, and `firm` on a firm row). When, within the session's first four levels, she has typed it on three levels whose bundles and loose lines differ two by two, or on two such levels one of them firm, that level's evidence row is named tally-four at the game weight (`named: "repeat"`) and the trail carries it.
- Until then (naming off) neither goal names anything, and nothing is remembered. Tested both ways: "gate 2, the server's repeat rule with naming on" (two weak sightings name nothing, a third names it, a firm one names on the second, a level past the session's fourth names nothing).

**Ruled 2026-11-16: per session.** The 1 in 16 above is per pair; three levels at the worst rows gave 5 in 32 that some two land. The rule above replaces the pair rule: 13 in 256 per session at worst, over the four levels a session names from.

## Before gate 2: the slip list (replaced by "Gate 2: evidence" above; kept as the round 4 record)

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
    - **Below, a plain line from 0** carries her number, an amber dot with an amber "13" label, and, after this first miss only, an arrow pointing the way to go. The line has **one scale for the whole level**, set from the level's fade alone: it runs from 0 to twice the largest row that fade serves, up to the next ten (fade 1: 0–40, fade 2: 0–70, fade 3: 0–100). It never depends on her number or the key, so a bigger number always stands further right (her 14 to the right of her 13); a number past the end stands at the end.
    - The line has no unit ticks, no place for the answer and no hops, so the answer cannot be counted off it.
- **A later check** (`read-retry-360x640`): she types 14, still off. The count runs over each bundle again and fades, and her box is dashed. On the line there is **her dot and nothing else: no arrow** after a later miss. Unlimited tries with an arrow would be a higher-or-lower search for the key.
- **Solved after a retry** (`read-end-retry-360x640`): the tick is pale, not full green, and the line reads "Tumne 16 likha · jaanch: 2". The evidence records the first check as incorrect and `first_try` = 0.

## Things the judges should know

- **Can a child pass by trial?**
  - In `keep`, no: a row passes only when its marks are bundled, so typing numbers can't make a row of plain standing lines right.
  - In `read`, she may check again after a miss, as in every Taxila game. Only a correct *first* check counts as first-try evidence. The mix-up is recorded only from her *first* check. No check's screen shows the answer. The play-out shows what each bundle is worth and then fades. Only the first miss shows which way her number is off.
- **What the teacher receives.** The game reports to the lesson `bundles`, the mix-up if named, and in `keep` which sign it was (`sign=five` when no line across was drawn anywhere; `sign=counted` when lines across were drawn and each row holding bundles is short by exactly its own bundles). It also reports `crossesMissing` (keep) and her `answer`. The game never speaks.
- **When the mix-up is named** (gate 2, above): `keep` from one check (three slips or more; a blind guess far under 1 in 10); `read` on three levels whose bundles and loose lines differ two by two, or two when one is a firm row, within the session's first four levels (one level alone can be one slip away, 1 in 4 at worst; per session at worst 13 in 256). Today both run with naming off.
- **Sizes.**
  - In `keep`, a row holds up to 14 strokes (two bundles and four), and on a 360 px phone it lies on **one line** in both phases.
  - In `read`, a row holds up to 49 (nine bundles and four). At 360 the largest read row takes two lines: four bundles on the first, and five bundles then the four loose lines on the second. The loose lines stand beyond the end of the first line, so **no loose line is under a bundle**. Between the two lines of strokes there is at least half a stroke's height and at least 26 px, so the count's digits over the second line (16 px, standing 3–19 px over their own strokes) stay clear of the first line's strokes, nearer their own bundles than the ones above (`read-largest-360x640`, `read-largest-mal-360x640`). No group is split across lines.
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

## Gate 1 fixes (night rulings)

Rulings: `docs/design/round8/games-judging/RULINGS-2026-11-11-night.md`, "stambh/tally: passes gate 1 after two fixes". Branch `claude/r8-gate1-place-tally`. Only the screens these change were retaken (360 × 640 at 2× pixel density; 1366 × 768 taken at 2× and scaled to 1×; RGB, no palette reduction), on the same level as before (Moti 16, fade 1; the largest case Moti 49). The gate-2 items (no slip list, `keep` from one level, `read`'s two-level rule) are not in this commit.

| Ruling | Change | Shots | Test |
|---|---|---|---|
| 1. One scale for the whole level (a bigger number never moves left) | The number line's end comes from the level's fade alone (`numberLineEnd`: twice the largest row the fade serves, to the next ten: 40, 70, 100), never from her number or the key; a number past the end stands at the end. Before, the end was 1.6 × her number, so her 14 stood left of her 13. | `read-mal-*`, `read-mal-after-360x640`, `read-retry-360x640` (13 at a third of the line, then 14 just right of it), `read-largest-mal-360x640` | `tests/r8-games-stambh-tally.test.mjs` "gate 1, ruling 1": the real view on every generated read level (40 seeds, fades 1–3, and the largest): over a rising run of 17 numbers (0 … 99) her chip never stands left of the one before and moves right with every unit inside the line; the same number stands at the same place on levels of one fade with different keys |
| 2. read's largest case: the second line's count digits clear of the first line's strokes | On two lines or more the count's digits keep the floor size (16 px) and read keeps 26 px between the lines (was 21), so a digit over the second line stands 3–19 px over its own strokes and further from the first line's strokes than from its own. | `read-largest-360x640`, `read-largest-mal-360x640` | `tests/r8-games-stambh-tally.test.mjs` "gate 1, ruling 2": every generated read level and the largest, in five world boxes from the 360 phone's to the desktop's, at five moments of the count: no stroke of the line above enters a digit's box (with its half-width and 2 px), and each digit is nearer its own line than the one above |

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
