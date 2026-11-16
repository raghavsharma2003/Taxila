# Judge packet: `kon/name`, naming an angle with three letters (class 6 maths, "Angles and comparing angles")

This packet is meant to be read on its own: everything a judge needs is in this file and the 36 screenshots beside it. Gate 2 (the evidence rule, below the first table): branch `claude/r8-gate2-name`. Code for gate 1: branch `claude/r8-gate1-name-b` (the final gate-1 fixes of 2026-11-15, on top of the gate-1 fixes after the night rulings of 2026-11-11 and the fixes after the evening judging); every screenshot whose drawing changed was retaken on it (see "Gate 1, final fixes"). **Not yet checked on a real phone, or with a child.**

**Topic:** c6-maths-ch02-t02, skill s1 (naming an angle). Class 6, age band 10–12. Two goals: `say` (name a lit angle) and `find` (find the angle a name means).

**The three laws this packet is built to** (main's rulings, for every game):
1. Green means right and only right. What she has tapped but not yet committed is blue-violet (the focus colour); her own wrong value is brown (the mix-up colour); green appears only on a solve. The green-yellow action button keeps its colour.
2. After a miss the screen never holds the key while a try remains.
3. A mix-up is named only by an act a guess rarely produces (law 3's number: an act that a blind guess or one ordinary slip produces more than 1 time in 10 names nothing by itself). Neither goal names it from one act: three random taps give a vertex-first or vertex-last name 1 time in 6 (`say`), and one tap among five arcs lands on the mix-up's arc 1 time in 5 (`find`). Both are graded at chance weight, nothing about one act reaches the teacher, and the mix-up is named only on its second occurrence, on a level with another figure and other letters (see "Gate 2: evidence").

**The mix-up it plays out:** `vertex-name` (kit id `c6-maths-ch02-t02-m-vertex-name`). The kit's belief: "Thinks the letters of an angle can be written in any order, so the vertex need not be the middle letter". Its signs: names the angle at B as angle BAC; puts the arc at the first letter; says angle ABC and angle BAC are the same.

| Goal | Named from one act | Not named from one act; named only on its second occurrence (another figure, other letters) |
|---|---|---|
| say | — | vertex-name (the right three letters, the vertex first or last) |
| find | — | vertex-name (a first- or last-letter arc) |

## Gate 2: evidence

Rulings: `RULINGS-2026-11-11-night.md` (kon/name, "For gate 2": "in `say`, a vertex-first or vertex-last name is named on its second occurrence (three random taps produce it 1 time in 6, over the 1 in 10 line); a first fade-1 solve with O at the vertex is fade-weighted") and `RULINGS-2026-11-15.md` ("Kept for gate 2", five items, answered one by one below; and "a wide-key level names nothing from one solve"). Decision `dc-r8-game-gate-play-then-evidence`. **Law 3's number:** an act that a blind guess or one ordinary slip produces more than 1 time in 10 names nothing by itself.

Branch `claude/r8-gate2-name`. Every number below is computed by `tests/r8-games-kon-name-gate2.test.mjs` through the law itself (`konLogic.apply` on every three-tap name, `arcHit` and `arcTargets` for taps, `vertexNamePick` for the mix-up's arc) and asserted on every generated level: **621 `say` levels and 1,280 `find` levels** (fades 1–3; at fade 1 both a first and a later level; the kit map the server serves; `find` takes 40 seeds, since it draws one key arc per request). Naming is still off for kon/name (`NAMING_OFF`); the last part says what switching it on changes.

**What counts as what.**
- **A blind name** (`say`): three taps, each on any of the four letters (the view lets a letter be tapped again), then "Yahi naam". The worse model is also given: three *different* letters (24 orders), the ruling's own count.
- **A blind tap** (`find`): one of the five arcs, evenly. **A blind rule**: a way of choosing an arc that never reads the name (a fixed arc by its place, the smallest / largest / second smallest angle, a corner at random).
- **An ordinary slip** (`say`): one of her three taps lands on another letter (any of the other three, so every neighbouring letter is counted), from the right name either way round; and, separately, two neighbouring taps swapped. (`find`): a tap meant for the key that leaves its touch disc by 8, 16, 24 or 32 board units, in any of 72 directions, and lands on another arc.

### `say`: one name is 1 in 6 at worst; named on the second

| On every one of the 621 levels | vertex-name | of | chance |
|---|---|---|---|
| Blind, a letter may be tapped again | 4 | 64 | **1 in 16** |
| Blind, three different letters (the ruling's model) | 4 | 24 | **1 in 6** |
| (Blind, the right name, for comparison) | 2 | 64 | 1 in 32 |
| One tap on another letter, from the right name | 0 | 18 | **0** |
| Two neighbouring taps swapped, from the right name | 2 | 2 | 1 in 1 |

The mix-up is exactly the right three letters with the vertex not in the middle (four of the six orders of those letters), so a tap on any other letter can never make it, and a swap of two neighbouring taps always does. A swap is the mix-up's own act (an order that ignores the vertex), and 1 in 6 is over the line, so **one name names nothing**: `say:vertex-name` is a chance pick (`konLogic.chancePicks`). The server names it on its **second occurrence**, on a level whose figure **and** letters both differ: **1/6 × 1/6 = 1 in 36** for two blind names (1 in 256 with repeats allowed), and a single slip can never make two names on two levels.

A child who reads the lit angle's three letters across the screen (by rows or by columns, either way) gives the mix-up's name on every level: the generator serves no level where a reading order puts the vertex in the middle, so every reading order puts it first or last. That is not a blind act: it is writing the letters in an order that ignores the vertex, which is the kit's belief itself ("the letters can be written in any order"); twice on two figures it is named, rightly.

### `find`: one tap is 1 in 5 at worst; named on the second

| Over the 1,280 levels | value |
|---|---|
| Levels with a mix-up arc (an arc at the name's first or last letter with arms to the other two letters) | 672 |
| Levels without one (the wide key, and the angle at the vertex outside the triangle) | 608 (every wide key among them: 320 of 320) |
| Blind tap, on a level with a mix-up arc | **1 in 5** (0 on the others) |
| Blind rules, share of all levels landing on the mix-up arc | arc 0: 0.102 · arc 1: 0.129 · arc 2 (the wide one): 0 · arc 3: 0.114 · arc 4: 0.180 · smallest angle: 0.141 · largest: 0 · second smallest: 0.127 · a corner at random: 0.147 |
| Worst blind rule | **0.180** |
| One slip off the key's disc that lands on another arc: share on the mix-up arc | at worst 0.181 on one level, 0.014 on average |

`find` is a one-decision goal (`konLogic.oneDecision`), so one tap names nothing. Named on its **second occurrence** on another figure with other letters: **1/5 × 1/5 = 1 in 25** for two blind taps, 0.180² = **1 in 31** for the worst blind rule kept over two levels, and **1 in 30** for one blind `say` name and one blind `find` tap (the two goals count towards one another: the same mix-up, the same skill). No pick needs more than two sightings (`konLogic.chanceRepeat` has no kon/name entry).

### The surface: "another figure, other letters"

`nameSurface` gives the play server two parts: the figure (the goal, the three rays' headings, the joined pair, the asked angle) and the letters. The server's `surfacesDiffer` counts a second sighting only when **both** differ. The test plays it: the same letters on another figure, or the same figure with other letters, or a `say` name and a `find` tap on one figure and its letters, name nothing.

### The five items kept for gate 2 (`RULINGS-2026-11-15.md`), answered

1. **"Say names vertex-name only on its second occurrence, and the packet still says the first press."** Done: `say:vertex-name` is a chance pick. One vertex-first or vertex-last name is graded `incorrect` at chance weight with `chanceMis` (the play server's own memory), and nothing about it reaches the lesson: no misconception on the evidence rows, no `chanceMis` on them, no mal-rule in the trail, no seam, and no `vertex_ok` / `arms_ok` in the facts (a say name now reports her name only, as a find tap reports her arc). The second, on another figure with other letters, is named. The packet's old lines ("`say` ... names it", "A mix-up named at her first press stays on her record", the table above) are rewritten.
2. **"A first fade-1 solve with O at the vertex is fade-weighted."** Done: a right answer on her first fade-1 level when the asked angle's vertex is O (the book's first figure, where "O in the middle" passes without the rule) enters at **CHANCE_WEIGHT** (0.25, the learner model's controllerEasy temper: half a game's 0.5) and **discriminates nothing**. There was no fade weight in the code to reuse; the chance weight is the one step the learner model has below a game's weight, so it is used, through a new `FamilyLogic.faintSolve` that `gradeLevel` reads. 24 of the 621 say levels are such levels (and some find levels, where a right tap is at chance weight anyway, now with no `discriminates`); at fade 1 a later level never has O at the vertex. The level shown above (`kon-name:say:100:60:95:50:1:0`, ∠ROB at O) is one.
3. **"On the 2 levels in 5 where only one arc has a named vertex with arms to the other two letters, a right answer is no evidence against vertex-name."** Done and asserted: those levels (the wide key and the angle at the vertex outside the triangle; 608 of 1,280 here) have no mix-up arc, so the picker's proof claims nothing for them (`discriminates` empty on all 608), and `faintSolve` holds them too: their right tap carries no `discriminates`.
4. **"State what 'Wapas' records after a wrong find tap."** "Wapas" takes back what she sees (her brown arc and the "≠" row; in `say`, her committed name), not that she checked. The grade and the trail read the level's moments, which an undo does not remove: **the wrong tap stays the level's first decision** (`incorrect`, at chance weight with `chanceMis` if it was the mix-up's arc, else at the game weight), the trail counts it (one miss, one undo, no first try), and the session remembers a mix-up tap as it would without "Wapas". On the screen, the count of checks now keeps it too: before this change an undo took a check off, so a wrong tap, "Wapas" and the right tap ended "jaanch: 1" with a full tick, looking like a first try; now it ends "jaanch: 2" with the pale tick. **Under law 3 this is right:** law 3 limits what one pick *names*, not what is recorded; an undo that erased a miss would let her pass by trial without it showing (a gate-1 item), and would hide from the grade the very tap whose repeat law 3 waits for.
5. **"A right first tap on a wide level counts for less."** A right first tap on any `find` level already enters at CHANCE_WEIGHT (one tap among five), the learner model's lowest step for a game, so it cannot weigh less in the model without a new temper. On a wide level it now counts for less than on a level with a mix-up arc: it carries **no `discriminates`** (it says nothing against vertex-name, item 3), and it names nothing (**"a wide-key level names nothing from one solve"**, the evening answer of 2026-11-15: no mix-up arc exists there, so no tap names anything, and the right tap claims nothing). A weight under 0.25 for it is a question for main (status, below).

### What switching naming on changes (no screen changes)

Main removes `kon/name` from `NAMING_OFF` (`shared/play.ts`). Then: the session remembers each one-act sighting of vertex-name with its surface (at most six); the second sighting on another figure with other letters puts `vertex-name` on the evidence row at the game weight (`named: "repeat"`), in the trail and in the next level's focus; right answers on levels that show the mix-up carry `discriminates` (not faint solves); a one-act miss at chance weight keeps its `chanceMis` for the server's memory. With naming off, as today, every row is right or wrong at the game weight and nothing is remembered. The moments and the play-out she sees are the same either way.

## The figure (both goals)

Three rays leave one point, the vertex. Each ray's end carries a letter, and the vertex carries one too. Two **neighbouring** ray ends are joined by a straight line, making a triangle with the vertex; the joining line never crosses a ray. The figure therefore has **five angles**: three at the vertex and two corners of the triangle.

**No two of the five angles are within 8° of each other in size**, and the three rays have three different lengths (at least 12 units apart), so the triangle is never isosceles. The generator chooses the five sizes first (every two at least 10° apart on a 5° grid), then the two joined rays' lengths that make those corners; a test measures every generated level with its own geometry. So whenever the screen sets two angles against each other with "≠" (below), they are different angles *and* different sizes.

Letters are four of A B C D E O P Q R S, drawn at random, **never O and Q together** (they look alike at 360 px). At the easiest level (fade 1) the vertex is "O" **in her first level of this game only**; every later level at fade 1 has another letter at the vertex (O may stand at a ray end), so "O goes in the middle" cannot pass the fade. At higher fades the vertex can be any letter.

## The rule the game enforces (never stated on screen)

A name of three letters is right when its **middle letter is the angle's vertex** and its **outer two letters are points on that angle's two arms**, in either order (ABC = CBA).

Whatever three letters she gives (`say`), the game lights the angle those letters *actually denote*: the angle at the middle letter, between the lines to the other two. It is drawn solid when that is one of the five angles, dashed (with its two rays) when it is not. The game never says "wrong" and never says where the vertex goes.

## Reading the letters like text never passes (both goals)

A child who does not know the rule may read the letters off the screen as she reads a line of text. The generator refuses any level where that puts the asked angle's vertex in the middle:
- letters within one letter's height of each other (22 board px) are **one row**; letters within one letter's width (16 board px) are **one column**;
- it reads by rows, top to bottom or bottom to top, each row left to right or right to left; and by columns, left to right or right to left, each column top to bottom or bottom to top (eight orders);
- it checks both the points and the places where their letters are drawn.

This applies to every served level of both goals, with **one exception: a `find` level whose key is the wide arc** (the angle at the vertex between the two outer rays). That angle is always over 90°, and the vertex of any angle over 90° lies between its arms' ends when read by rows or by columns, so no wide-arc level could pass the rule. Reading across therefore finds the key on wide-arc levels, which are 1 level in 5 (below), the same rate as a blind tap; the first tap is weighted at that chance rate. A test checks every other level with its own reading code. (The level judge 2 found, A on top with Q and P at one height, read "AQP", is refused.)

## Goal 1: `say` (name the lit angle)

**What she sees.** The figure, with **one angle lit** as a blue-filled sector with a blue-violet arc. The instruction reads "Akshar chhookar chamakte kon ka naam likho". Buttons: "Mita do", "Wapas" and "Yahi naam" (off). Shot: `say-initial-*`.

**What she does.** She taps three letters/dots in turn. Each tapped point turns **blue-violet** and grows; the name so far builds in a blue-violet chip (e.g. "∠RO_") in the quietest corner of the board, at least one letter height clear of every letter. "Yahi naam" turns on at three letters. "Wapas" takes back her last letter; "Mita do" clears all. Shot: `say-mid-*`.

**This level's givens and key** (level `kon-name:say:100:60:95:50:1:0`, her first level, so the vertex is O). Letters O, R, B, A: rays OR (95 units), OB (82), OA (110); B and A are joined. The five angles: ∠ROB 60°, ∠BOA 95°, ∠ROA 155°, ∠OBA 50°, ∠OAB 35°. The lit angle is at O between OR and OB. **The key is "ROB" or "BOR".** Shot: `say-end-*` (green tick beside O; the line under the board: "Tumne ∠ROB likha · jaanch: 1").

### Mal-rule `vertex-name`
- **What a child holding it does.** She taps the right three letters with the vertex first: **O, R, B** ("∠ORB"). Shot: `say-mal-vertex-name-*`.
- **What the screen then shows when she presses "Yahi naam":** the lit angle at O stays lit. The game lights the angle her name denotes: the angle at the **middle letter R**, between the lines to O and to B. That is not one of the five angles, so it is **dashed**: dashed brown rays R to O and R to B, and a dashed brown arc at R. The dashed R-to-O ray lies on the solid line RO, so it is drawn **10 px beside it** (centre to centre; a clear gap of about 6–7 px between the two lines at 360), not over it. A brown chip "∠ORB" sits beside R.
- **How it is graded.** Not right. The mix-up's sign is exactly the right three letters with the vertex not in the middle; a name with a wrong letter is an ordinary miss with the same light-up. When the vertex-first name's middle letter is a triangle corner and its arms are that corner's, the corner lights **solid**. **One such name names nothing** (gate 2: three random taps give it 1 time in 6): it is kept at chance weight as `chanceMis`, nothing about it reaches the teacher, and `vertex-name` is named only on its second occurrence, on a level with another figure and other letters.
- **A solve after a miss** ends with a **pale** tick and "jaanch: 2". Shot: `say-end-after-miss-*`.

**A later level at fade 1** (level `kon-name:say:195:65:80:45:1:0`, served as her second level): letters P, O, E, C with **P at the vertex** (O stands at a ray end); E and C are joined; the lit angle is ∠OPE (65°). Shots: `say-later-initial-*`, `say-later-mal-vertex-name-*` (she names it vertex-first, "∠POE"; the angle at O between OP and OE is not one of the five, so it is dashed, its ray O-to-P drawn beside the solid line OP).

## Goal 2: `find` (find the angle a name means)

**What she sees.** No angle lit. All five angles have their arcs drawn bold in dark grey. **The two arcs at the vertex between neighbouring rays are drawn at different radii** (42 and 58 units), so where they meet on the shared ray there is a 16-unit step and they never read as one curve; the wide arc sits further out, 16 units inside the figure's shortest ray and never more than 84 (gate 1, final fixes), so it never ends on a point, the corner arcs are small (24). A name chip such as "∠APO" shows in a corner or along an edge of the board, at least one letter height clear of every letter, and in the instruction: "∠APO kaunsa kon hai? Uska chaap chhuo". The only button is "Wapas".

**What she does.** She taps an arc. A tap within 44 board-units of an arc goes to the nearest arc (the tap model sits each of the two vertex arcs at 50 units; every point of each *drawn* arc taps that arc, which is tested). Every arc keeps a round touch area at least 48 units across in its own region. That single tap is the decision.

**The key is each of the five arcs 1 time in 5, the wide one included.** Each request draws its key arc (and which two rays are joined) first, evenly, and every figure it offers the picker has that key; so the angle at the vertex inside the triangle, the one at the vertex outside it, the wide one, and each of the two corners are the key equally often, whatever the picker prefers among the figures. Measured as served over 600 requests: 138, 119, 119, 110, 114 (arcs 0–4). A first tap by any rule that does not read the name wins about 1 time in 5: "a corner (small) arc" 0.19, "an arc inside the triangle" 0.20, "the widest" 0.20. By angle *size* the floor is a little higher: "the smallest angle" wins 0.21 and "one of the three smallest" 0.27, because an asked angle at the vertex (other than the wide one) is kept under 65° so that reading across never finds it, and the wide one is always the largest, so the second largest angle is almost never the key. Tests: `tests/r8-games-kon-name.test.mjs` (over the generator and as served), `tests/r7-games-chance-weight.test.mjs` (as the play server serves it). Three levels are shown:

**A triangle corner** (level `kon-name:find:160:90:70:50:0:3:1`). Letters O, P, A, D: rays OP (117 units), OA (140), OD (105); P and A are joined. The five angles: ∠POA 90°, ∠AOD 70°, ∠POD 160°, ∠OPA 50°, ∠OAP 40°. The name shown is **∠APO**: the middle letter is P, so the angle is the triangle corner at P, between PA and PO. **The key is the small arc at P.** Shots: `find-initial-*`, `find-end-*` (the arc at P green, a green tick; "Tumne ∠APO dhoondha · jaanch: 1").

**The vertex, inside the triangle** (level `kon-name:find:105:60:85:50:0:0:0`: the same angles as the judged packet, with other letters and rays; the judged figure, with BA 85 units, is no longer served, since its wide arc would have to run at 69). Letters R, A, D, P: rays RA (139), RD (113), RP (91); A and D are joined. The five angles: ∠ARD 60°, ∠DRP 85°, ∠ARP 145°, ∠RAD 50°, ∠RDA 70°. The name shown is **∠ARD**: the middle letter is R, so the angle is at the vertex between RA and RD. **The key is the arc at R between RA and RD.** Shots: `find-vertex-initial-*`, `find-vertex-end-*` ("Tumne ∠ARD dhoondha · jaanch: 1").

**The wide arc** (level `kon-name:find:150:70:85:60:0:2:0`). Letters O, E, D, P: rays OE (128), OD (145), OP (95); E and D are joined. The five angles: ∠EOD 70°, ∠DOP 85°, ∠EOP 155°, ∠OED 60°, ∠ODE 50°. The name shown is **∠EOP**: the middle letter is O, so the angle is at the vertex between OE and OP, the wide one. **The key is the wide arc at O.** Shots: `find-wide-initial-*`, `find-wide-end-*` ("Tumne ∠EOP dhoondha · jaanch: 1"). A wide-arc name's first or last letter (E, P) is not a corner of the triangle with the other two letters as its arms, so no tap here is the mix-up's own; `find-wide-wrong-arc-*` shows a tap on the arc at O between OE and OD.

### What a wrong tap shows: the contradiction form
- **What a child holding the belief does.** She reads "∠APO" and takes the corner at its first letter, A, between the lines to P and O: she taps **∠PAO** at A (40°; the asked ∠APO is 50°). Shot: `find-first-letter-played-*`. At the vertex level she reads "∠ARD" and takes the corner at A, between the lines to R and D: she taps ∠RAD (50°; the asked ∠ARD is 60°), and the row reads "∠ARD ≠ ∠RAD = ∠DAR": `find-vertex-first-letter-played-*`.
- **What the screen then shows** (no words):
  - the arc she tapped turns **brown** (never green);
  - in place of the asked name, one row: **"∠APO ≠ ∠OAP = ∠PAO"**. The asked name stays in its plain ink chip; "≠" and a brown chip with *her arc's own two names* follow it.
  - The row sits **wholly above or below the figure's whole box**, its arcs and letters included (at 360; at 1366 it stays above or below as well, where it reads well); at the figure's side only on a wide screen with room. It keeps **at least one letter height clear of every letter** (a letter's box grown by its own height all round) and clear of every line and every arc, so no chip in it reads as the label of a point or of an arc. `find` serves only figures that leave it that room at 360 (a figure that does not is moved up or down on the board, or drawn a little smaller with the same angles).
  - Nothing marks the asked arc.
  - The "≠" is true either way she reads it: her arc is a different angle **and** a different size (no two angles of a figure are within 8°).
- **Why this form.** Showing only her arc's name ("∠OAP") is not enough, because to a child with this belief "∠OAP" and "∠APO" are the same name. The row sets the same three letters in another order against the asked name as **a different angle** ("≠"), and shows the one reordering that *is* the same angle (the reverse, "=") on her arc. That contradicts "the same letters are the same angle" without stating the middle-letter rule, and without showing where the asked angle is. Any wrong arc shows the same form (with its own names).
- **How it is graded.** Not right. One tap among five lands on this arc by chance a fifth of the time, so **nothing goes on her record from it**, and **nothing about it reaches the teacher's view** after one tap:
  - the grade keeps it at chance weight as `chanceMis` (the play server's own memory);
  - the lesson's evidence rows carry no misconception and no `chanceMis`;
  - the trail the lesson reads lists no mal-rule;
  - no seam row is sent for the tap; the level-end row has no `sign`, `vertex_ok` or `arms_ok` (find reports only the name and the arc she picked);
  - the flight recorder logs the tap as an ordinary miss.
  
  When she does it again on a level **with another figure and other letters** (a find tap or a say name), the play server names it: the evidence row carries `vertex-name` and the trail lists it. A test plays this through the real routes. A `say` name is held the same way (gate 2).
- **A key whose first-letter reading is not drawn** (the wide arc, or the angle at the vertex outside the triangle: 2 levels in 5) has no mix-up arc: every wrong tap there is a plain miss, shown in the same "≠" form.
- **A solve after wrong taps** ends with a **pale** tick and "jaanch: 2"; only her first tap is evidence. Shots: `find-end-after-miss-*`, `find-vertex-end-after-miss-*`.

## Things the judges should know

- **Can a child pass by trial?**
  - `say`: not on the first try (2 of 24 orderings of three different letters). She can try again; the game lights what each name denotes, so a persistent child can steer by watching which corner lights. Only a first press that is already a solve counts as first-try evidence (full in-game weight, 0.5; chance weight on her first fade-1 level when the lit angle is at O). A vertex-first or vertex-last name at her first press is a miss at chance weight and is named only on its second occurrence (gate 2). "Wapas" after a press takes back her name, not the check.
  - `find`: yes, by elimination, with at most four wrong taps. A correct *first* tap enters at the "chance" weight (one tap among five arcs, the key each arc 1 time in 5); a later solve shows a pale tick and its number of checks.
- **Shortcuts the generator refuses to serve.** A level where reading the letters like text puts the vertex in the middle (above; both goals, but for `find`'s wide-arc key); any figure two of whose angles are within 8° of each other in size, with two rays of nearly one length, with points closer than 68 units, an angle under 20°, a joining line across a ray, O with Q, an arc without its own touch area (`find`), or a vertex-first dashed angle under 20° (`say`). The widest arc is no longer kept from being the key: the keys are spread over all five.
- **What the teacher receives.** `say`: the name she gave (`said`) only. `find`: the asked name and the arc she `picked` only. The mix-up only on its second occurrence (above). With naming off (gate 1 alone, as served now), never.
- **Sizes.** The board is a fixed 320 × 300 units (at 360 px about 1.12 CSS px per unit). The letters, chips and tick grow with the board on a wide screen (up to 2×; at 1366 the board is about 2.5 CSS px per unit), so they keep their size relative to the figure; a phone keeps them as they were. Letter touch squares are 48–64 px and never overlap. The line under the board keeps room for two lines on a phone, so the board does not move when it changes to the end line.
- **Picker speed.** `find` tries up to 1000 figures per request and stops at 8 that pass (each passing figure costs a full touch-area search); it faces an asked angle under 65° towards a diagonal, so reading across rarely refuses it. The picker's CPU time since the final gate-1 fixes: p95 about 26 ms over 90 requests in this container (bar 50 ms).
- **Not checked yet:** on a real phone, or with a child.

## Every child-facing string

| Where | Hinglish | Hindi | English |
|---|---|---|---|
| game name (header) | Kon | कोण | Angles |
| instruction, say | Akshar chhookar chamakte kon ka naam likho | अक्षर छूकर चमकते कोण का नाम लिखो | Tap letters to name the lit angle |
| instruction, find (name filled in) | ∠APO kaunsa kon hai? Uska chaap chhuo | ∠APO कौन-सा कोण है? उसका चाप छुओ | Which angle is ∠APO? Tap its arc |
| end line, say | Tumne ∠ROB likha · jaanch: 1 | तुमने ∠ROB लिखा · जाँच: 1 | You wrote ∠ROB · checks: 1 |
| end line, find | Tumne ∠APO dhoondha · jaanch: 1 | तुमने ∠APO ढूँढा · जाँच: 1 | You found ∠APO · checks: 1 |
| clear button, say | Mita do | मिटा दो | Clear |
| commit button, say | Yahi naam | यही नाम | That's the name |
| undo button | Wapas | वापस | Undo |
| chips | ∠ROB, ∠ORB, ∠APO, "∠APO ≠ ∠OAP = ∠PAO", "∠ARD ≠ ∠RAD = ∠DAR", "∠EOP ≠ ∠EOD = ∠DOE" | same | same |

"jaanch" is written one way in every kon/name string: "jaanch" in Hinglish, "जाँच" in Hindi, "checks" in English, always after "·" in the end line. "kon" stays: it is the lessons' word for angle. "Mita do" uses "do" as the verb. The game shows no feedback words: no "right", no "wrong", no hint text.

## Changes after judging round 2

Rulings: `docs/design/round8/games-judging/RULINGS-2026-11-11.md` (kon/name 1–8). Each change is held by a test in `tests/r8-games-kon-name.test.mjs` (every generated level) or `tests/r8-games-kon-layout.test.mjs` (every served level, every screen, 360 × 640 and 1366 × 768).

| Ruling | What changed | Screens |
|---|---|---|
| 1. Find's wrong pick is never green | Her wrong arc is brown; green only on the solve. Tapped letters and the building name in `say` are blue-violet (focus), not green. | `find-first-letter-played`, `say-mid` |
| 2. Find names nothing from one tap | The grade keeps a first/last-letter arc at chance weight (`chanceMis`, no misconception on her record); the server names it on a second such pick on a level with other letters. | `find-first-letter-played` |
| 3. Contradict "same letters, same angle" | "∠APO ≠ ∠OAP = ∠PAO": the asked name against her arc's two names (above). Built. | `find-first-letter-played` |
| 4. Solve after wrong taps | Pale tick; the end line counts checks. Also for `say`. | `*-end-after-miss`, `*-end` |
| 5. Say unchanged | One vertex-first name still names `vertex-name`. | `say-mal-vertex-name` |
| 6. Fade 1: O in the first level only | The generator puts O at the vertex only when she has played no level of this game yet; later fade-1 levels never do. | `say-later-*` |
| 7. Figure | The two vertex arcs drawn at 42 and 58 units (a gap where they meet); the joined pair is always two neighbouring ray ends (joining the outer two always crossed the middle ray); say's dashed arc ≥ 24 units long (radius up to 72, its angle ≥ 20°); a dashed ray on a drawn line is drawn beside it (4 px then; 10 px since gate 1, below); O and Q never together. | `find-initial`, `say-mal-vertex-name` |
| 8. "kon" stays | Unchanged. | — |

## Changes after the evening judging

Rulings: `docs/design/round8/games-judging/RULINGS-2026-11-11-evening.md` (kon/name 1–5). Tests: `tests/r8-games-kon-name.test.mjs`, `tests/r8-games-kon-layout.test.mjs` (every served level, every screen, both sizes), `tests/r8-play-laws.test.mjs`.

| # | Ruling | What changed | Screens |
|---|---|---|---|
| 1 (blocking) | Second say level: A on top, Q and P at one height; reading like text gives AQP, the key. Letters within one letter height are one row, within one letter width one column; refuse any level where reading by rows or columns, either way, puts the vertex in the middle; assert on every served level of both goals | The generator refuses such levels (eight reading orders, by the points and by where the letters are drawn; the view now draws the letters where the law places them). The proof suite asserts it on every generated level of both goals with its own reading code. Both packet levels changed (the old say level is refused). | `say-*`, `find-*` |
| 2 | find keys at the centre point as well as at triangle corners; say so; one screen of each | Both kinds are served, tested on 48 served levels (since gate 1: 3 in 5 at the vertex, the wide arc included, below). The packet shows a corner level (`find-*`) and a vertex level (`find-vertex-*`). | `find-*`, `find-vertex-*` |
| 3 | After one find tap nothing about vertex-name reaches the teacher's view; only on the repeat; test it | find reports only the name and the arc she picked (no `sign`, `vertex_ok`, `arms_ok`). Centrally, for every one-pick mix-up: no mid-level seam; no mal-rule in the trail; no `chanceMis` on the lesson's evidence rows; logged as an ordinary miss. On a repeat with other letters the row is named and the trail lists it. A test plays both through the real `/api/play/act` and `/api/play/next` routes and reads the signed tokens. | — |
| 4 | At 1366 the chips scale with the board; the "≠" row sits beside the figure | Chips, letters, the "≠" and the tick grow with the board (up to 2×; unchanged on a phone). The row sits to the figure's right or left where it fits, stacked there when too wide, else just above or below it. | `find-first-letter-played-1366x768`, `find-vertex-first-letter-played-1366x768` |
| 5 | find's end line names what she found; "jaanch" one way everywhere | find ends "Tumne ∠APO dhoondha · jaanch: 1" (Hindi "तुमने ∠APO ढूँढा · जाँच: 1", English "You found ∠APO · checks: 1"), the same form as say's. Every kon/name string writes "jaanch" / "जाँच" / "checks" the same way. | `find-end-*`, `find-vertex-end-*` |
| CPU | Keep the picker under its bar | p95 19 ms of CPU over 60 requests after the new rule (bar 50 ms; it was 16–20 ms). Since gate 1: p95 16 ms. | — |

## Gate 1 fixes (night rulings)

Rulings: `docs/design/round8/games-judging/RULINGS-2026-11-11-night.md`, "kon/name: gate 1 not passed" (1–4). Every screenshot was retaken after these. Tests: `tests/r8-games-kon-name.test.mjs` and `tests/r8-games-kon-name-view.test.mjs` (every generated level), `tests/r7-games-chance-weight.test.mjs` (as served), `tests/r8-games-kon-layout.test.mjs` (in the browser: every served level, every screen, 360 × 640 and 1366 × 768). Each test fails on the code before these fixes.

| Ruling | Change | Shot | Test |
|---|---|---|---|
| 1. No two angles of a figure within 8° in size (rays of different lengths), so the "≠" row is true whether "≠" is read as "a different angle" or "not equal" | The generator picks the five angle sizes first, every two at least 10° apart, then gives the two joined rays the lengths that make those corners (never equal), and the third ray a length of its own; it checks the figure as drawn. The isosceles "∠APO ≠ ∠OAP" case (two 50° corners) cannot be served. | `find-first-letter-played-*` (∠APO 50°, her ∠PAO 40°), `find-vertex-first-letter-played-*`, `find-wide-wrong-arc-*` | `night ruling kon/name 1` in `r8-games-kon-name.test.mjs`: every generated level of both goals, measured by the test's own geometry from the drawn segments (five angles pairwise ≥ 8°, three rays ≥ 10 units apart) |
| 2. `find` keys spread evenly over all five arcs, the wide one included; chance weight 1 in 5; no "small arc" shortcut | Each request draws its key arc and its joined pair first, evenly; every figure it offers has that key, so the picker cannot tilt it. The wide arc is a key (it was never served), the angle at the vertex outside the triangle as often as the one inside. Measured as served (600 requests): each arc 18–23 %; "a corner arc" wins 0.19, "an arc inside the triangle" 0.20, "the widest" 0.20. | `find-wide-initial-*`, `find-wide-wrong-arc-*`, `find-wide-end-*` (new) | `night ruling kon/name 2` in `r8-games-kon-name.test.mjs` (over the generator, 1200 requests: each arc within 3 points of 20 %, each role too; as served, 300 requests: the rules above ≤ 0.24); `chance weight kon/name find` in `r7-games-chance-weight.test.mjs` (as the play server serves it, at CHANCE_WEIGHT) |
| 3. The "≠" row and the name chip keep one letter height clear of every letter at 360 | Both are placed only where their box stays a letter's own height clear of every letter's box (and clear of every line and point): the row beside the figure is set one letter height further out, and further spots along the canvas's edges are tried. | `find-first-letter-played-360x640`, `find-vertex-first-letter-played-*`, `find-initial-*`, `say-mid-*` | `r8-games-kon-name-view.test.mjs` (headless, every generated level, at 360 and 1366: the name chip; the "≠" row after every wrong arc); `r8-games-kon-layout.test.mjs` (the browser, every screen) |
| 4. The dashed ray beside a solid line is offset enough to be seen at 360 | Drawn 10 px from the line, centre to centre, at every size (was 4.5 board units, about 4–5 px: it read as one thick line). | `say-mal-vertex-name-*` (R to O), `say-later-mal-vertex-name-*` (O to P) | `r8-games-kon-name-view.test.mjs` (every generated say level's vertex-first play-out, 360 and 1366: ≥ 8 px); `r8-games-kon-layout.test.mjs` (the browser) |
| CPU | Keep the picker under its bar | The touch-area search looks only near each arc and tries first the sample point that ruled out the last centre; a centre is checked 2 px wider all round on 24 rim points (was 4 px on 16). p95 16 ms of CPU over 60 requests (bar 50 ms). | — | `kon/name: the picker's work per level is within its bar` |

## Gate 1, final fixes (2026-11-15)

Ruling: `docs/design/round8/games-judging/RULINGS-2026-11-15.md`, "`kon/name` at the play gate" (1–4), after both fresh judges failed `find-vertex-first-letter-played-360x640` (the row "∠PBC ≠ ∠BPC = ∠CPB" drawn inside the figure, across the wide arc and the arc at B). Tests: `tests/r8-games-kon-name-view.test.mjs` (headless, the real view: every generated level and every level the play server serves, a spread of children at fades 1–3, with the arcs as the canvas was asked to draw them), `tests/r8-games-kon-layout.test.mjs` (in the browser: every served level, every screen, 360 × 640 and 1366 × 768). The three new headless tests (rulings 1–3) fail on the code the judges read (`ceb7b4fc4`): 236, 156 and 288 faults.

| Ruling | Change | Shot | Test |
|---|---|---|---|
| 1. Every arc (every tap target) is in the clearance test for the "≠" row and the name chip, as letters and lines are; at 360 the row sits above or below the figure's whole box, arcs included | Every drawn arc is declared to the layout audit (chords of 6° at most), so the name chip, the "≠" row and every other chip keep clear of arcs as of lines. The row is placed only wholly above or below the figure's box (its lines, arcs, points and letters, each letter grown by its own height), or at its side on a wide screen with room; only failing every such spot does it fall back (never on a served level at 360). `find` serves only figures that leave the row a band at 360: a figure that does not is moved up or down on the board, or its rays are shortened alike (same angles, at most twice, not below 0.8). | `find-vertex-first-letter-played-*` (the row now under the figure), `find-first-letter-played-*` (above it), `find-wide-wrong-arc-*` (above it); `say-mid-*` (her name's chip moved off the lit arc) | `gate 1, ruling 1` (two tests): after every wrong arc on every served find level the row's three pieces lie wholly above or below the figure's box at 360 and cross no arc or line at 1366; the name chip (find's asked name, say's built name) crosses no arc and no line. Browser: every find screen declares its arcs, the row lies outside the figure's box at 360, and no chip crosses an arc (`chip×arc`) on any screen |
| 2. The wide arc's radius clearly shorter than the shortest ray, so it never ends on a point | The wide arc runs 16 board units inside the figure's shortest ray (never more than 84), drawn and tapped alike (`wideR`); `find` serves a figure only when that leaves it at 70 or more, clear of the arcs at the vertex (58). The judged vertex figure (BA 85: an arc at 69) is no longer served; the packet's vertex level is a served one with the same angles. | `find-vertex-*` (new level), `find-wide-*` (the arc at 79, was 84 with OP 95) | `gate 1, ruling 2`: on every served level of both goals, the drawn wide arc's radius ≤ shortest ray − 15 and no drawn arc ends within 12 board units of a point; `kon/name/find: a tap is on the nearest arc` and the round-2 test (a tap on the drawn arc is a tap on that arc) still hold |
| 3. Say's dashed arc reads as an arc at 360; the dashed ray runs outside the lit sector | The play-out arc of an angle that is not one of the figure's is one continuous stroke (it was 5 px dashes); its two rays stay dashed and say it is not drawn. A dashed ray beside a solid line is set to the side away from the lit sector (away from the lit angle's other arm when the line is one of its arms; else away from the lit vertex). | `say-mal-vertex-name-*` (R to O, now outside the lit sector), `say-later-mal-vertex-name-*` (O to P, now outside) | `gate 1, ruling 3`: on every served say level's vertex-first play-out at 360 and 1366, the play-out arc is stroked solid (or with dashes ≥ 12 px) and runs ≥ 27 px at 360, and no dashed ray passes through the lit sector |
| 4. At 1366 the row may stay above the figure | It does, where it reads well (the row is placed above or below first at every size). No test demanded "beside the figure" at 1366; the old candidate order is gone. | `find-first-letter-played-1366x768`, `find-wide-wrong-arc-1366x768` | `gate 1, ruling 1` at 1366: no piece of the row on an arc or a line |
| CPU | Keep the picker under its bar | The row-room check is cheap and runs before the touch-area search. p95 about 26 ms of CPU (bar 50 ms). | — | `kon/name: the picker's work per level is within its bar` |

Retaken (360 × 640 at 2×; 1366 × 768 at 2× halved to 1×): `find-first-letter-played`, `find-vertex-initial`, `find-vertex-first-letter-played`, `find-vertex-end`, `find-vertex-end-after-miss`, `find-wide-initial`, `find-wide-wrong-arc`, `find-wide-end`, `say-mid`, `say-mal-vertex-name`, `say-later-mal-vertex-name` (both sizes each). The others were rendered again on this code and are pixel for pixel the same, so they were kept.

## Screenshots (36)

`<goal>-<step>-{360x640,1366x768}.png`:
- say: `initial`, `mid`, `mal-vertex-name`, `end`, `end-after-miss`, `later-initial`, `later-mal-vertex-name`
- find (a corner): `initial`, `first-letter-played`, `end`, `end-after-miss`
- find-vertex (the vertex, inside the triangle): `initial`, `first-letter-played`, `end`, `end-after-miss`
- find-wide (the wide arc): `initial`, `wrong-arc`, `end`

Steps: `initial` the first screen; `mid` three letters tapped, before "Yahi naam"; `mal-vertex-name` / `first-letter-played` / `wrong-arc` just after the decision; `end` solved first try; `end-after-miss` solved at the second check; `later-*` a second level at fade 1. `find` has no `mid` screen: there is nothing between the first look and the tap.

The 360×640 shots are at 2× pixel density; the 1366×768 shots were taken at 2× and scaled to 1× (RGB, no palette).
