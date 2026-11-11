# Judge packet: `stambh/tally`, tally marks (class 4 maths, "Tables and pictographs")

This packet is meant to be read on its own: everything a judge needs is in this file and the 16 screenshots beside it. Code commit: `204d45d17` (in integration 42).

**Topic:** c4-maths-ch14-t01, skill s1, "Organise data using tally marks and a table". Class 4, age band 6–9.

**The mix-up it plays out:** `tally-four`. The kit's belief: "Reads a bundle of tally marks as 4, counting only the standing lines". Its signs:
- reads a full tally bundle as 4;
- writes five as five standing lines;
- totals from tallies come out too small.

## The rule the game enforces (never stated on screen)

A bundle is four standing lines with one line across them, and it is worth 5. A row's count is 5 × bundles + single lines. The child makes every mark herself, and every stroke is legal: a cross after fewer than four lines is allowed. If such a cross were refused, a child could learn the rule by trying "╱" and falling back to "|" when it bounced. When the child presses Check, the game regroups each row by fives, and only then shows which groups are not bundles.

## Goal 1: `keep` (keep a tally, then fill the table)

**What she sees.** A strip at the top where things pass one at a time, for example vehicles at a crossing. Below it is one row per category: an icon, a name and an empty tally area, with a total box at the right under the heading "Kul". There are two large stroke buttons, "|" (one standing line) and "╱" (one line across). Shots: `keep-initial-*`, `keep-mid-*`.

**What she does.**
1. For each thing that passes, she taps its row and then a stroke button. The next thing comes only after she has made a stroke, so nothing is timed.
2. When the scene has passed, the strip folds away and a number pad appears.
3. She types each row's total into its box and presses "Jaancho".
4. "Wapas" undoes her last step.

**This level's givens and key** (as in the shots). Scene "Chauraahe se guzri gaadiyan", rows Car, Bus and Auto. The truth is Car 3, Bus 6, Auto 7.

The key is right only when each row's marks are correctly bundled *and* each total matches:

| Row | Correct marks | Total |
|---|---|---|
| Car | three standing lines | 3 |
| Bus | one bundle plus one line | 6 |
| Auto | one bundle plus two lines | 7 |

Shot: `keep-end-*`, where all three ticks are green. A row with the right number of strokes but no line across is not right: the game refuses it as "not bundled" and shows the same ring as in the mix-up below.

**What a tally-four child does, and what the screen shows** (`keep-mal-*`):
- **What she does.** She writes every fifth thing as another standing line, with no line across anywhere. She then counts each group of five standing lines as 4, so she types Bus 5 and Auto 6.
- **What the screen shows when she presses Jaancho:**
  - Each group of five standing lines gets a dashed ring and a small ✗, with no words.
  - Each total that is short gets a dashed box.
  - Car, which has no group of five, keeps its tick.
- **When the game names the mix-up.** Only when both halves show: no line across anywhere, *and* every total short by exactly its groups of five. Any other wrong answer is an ordinary miss, and the tests check that it is never named tally-four.

## Goal 2: `read` (how many does this tally show?)

**What she sees.** One category, for example "Car", a row of tally bundles, "=" and an empty box, with a number pad below. Shots: `read-initial-*`, `read-mid-*`.

**What she does.** She types a number on the pad and presses "Jaancho".

**This level's givens and key** (as in the shots). Five bundles, so the key is 25. Shot: `read-end-*`.

**What a tally-four child does, and what the screen shows** (`read-mal-*`):
- **What she does.** She types 20, counting 4 per bundle.
- **What the screen shows:** her box gets a dashed outline, and a number line appears below the tallies:
  - **her number** is a dot labelled "20";
  - **the true value** has a triangle marker but no number written on it;
  - **the gap** between them is drawn as a hop for each unit.

The gap equals the number of bundles, so a child who counts by fours is short by one for every bundle.

## Things the judges should know

- **Can a child pass by trial?**
  - In `keep`, no: a row passes only when its marks are bundled, so typing numbers can't make a row of plain standing lines right.
  - In `read`, she may check again after a miss, as in every Taxila game. Every check after the first is recorded, along with her misses, and only a correct *first* check counts as first-try evidence for the learner model. The number-line play-out appears on every tally-four check, but the mix-up is recorded against her only from her *first* check.
- **What the teacher receives.** The game reports to the lesson `bundles`, the mix-up if named, `crossesMissing` (keep), and her `answer`. The game never speaks.
- **Sizes.** Rows hold up to ten bundles and four lines in 360 px. Fade 1, the easiest, has 6–19 in `read`, and a scene of 8–14 things across 2 rows in `keep`. Fade 3 (as in the `keep` shots) has 21–49 in `read`, and a scene of 16–28 things across 3 rows in `keep`.
- **Not checked yet:** on a real phone, or with a child.

## Every child-facing string

The lesson is in Hinglish (shown), Hindi or English; the game shows only the lesson's language.

| Where | Hinglish | Hindi | English |
|---|---|---|---|
| game name (header) | Stambh | स्तंभ | Graphs |
| instruction, keep | Jo guzar raha hai uski tally rakho, phir table bharo | जो गुज़र रहा है उसकी टैली रखो, फिर तालिका भरो | Keep a tally of what goes by, then fill the table |
| instruction, read | Yeh tally kitne dikhati hai? | यह टैली कितने दिखाती है? | How many does this tally show? |
| scene, traffic | Chauraahe se guzri gaadiyan | चौराहे से गुज़री गाड़ियाँ | Vehicles at the crossing |
| scene, bangles | Choodi ki dukaan par biki choodiyan | चूड़ी की दुकान पर बिकी चूड़ियाँ | Bangles sold at the stall |
| row names, traffic | Car · Bus · Auto · Cycle | कार · बस · ऑटो · साइकिल | Car · Bus · Auto · Cycle |
| row names, bangles | Kaanch · Kada · Moti | काँच · कड़ा · मोती | Glass · Kada · Beaded |
| total column heading | Kul | कुल | Total |
| check button | Jaancho | जाँचो | Check |
| undo button | Wapas | वापस | Undo |
| stroke buttons | \| and ╱ (marks, no words) | same | same |
| number pad | 0–9 and ⌫ | same | same |

Numbers are always shown as digits. The game shows no feedback words: no "right", no "wrong", no hint text. Feedback is only ticks, rings, ✗ marks, dashed boxes and the number line. The round "T" at the top is the teacher's avatar from the lesson shell, not part of the game.

## Screenshots (16)

`{keep,read}-{initial,mid,mal,end}-{360x640,1366x768}.png`:
- `initial` is the first screen;
- `mid` is part-way through play;
- `mal` is the tally-four answer, just after Jaancho;
- `end` is solved.

The 360×640 shots are at 2× pixel density. The 1366×768 shots were scaled to 1× for size; colours are unchanged.
