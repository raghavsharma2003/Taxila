# Judge packet: `kon/name`, naming an angle with three letters (class 6 maths, "Angles and comparing angles")

This packet is meant to be read on its own: everything a judge needs is in this file and the 14 screenshots beside it. Code: branch `claude/r8-kon-fixes` (the fix round after the first packet, which was taken at `685b755c5`); every screenshot was retaken on it. **Not yet checked on a real phone, or with a child.**

**Topic:** c6-maths-ch02-t02, skill s1 (naming an angle). Class 6, age band 10–12. Two goals: `say` (name a lit angle) and `find` (find the angle a name means).

**The mix-up it plays out:** `vertex-name` (kit id `c6-maths-ch02-t02-m-vertex-name`). The kit's belief: "Thinks the letters of an angle can be written in any order, so the vertex need not be the middle letter". Its signs:
- names the angle at B as angle BAC;
- puts the arc at the first letter;
- says angle ABC and angle BAC are the same.

The other mix-ups of this topic (longer arms, arc size, full turn) belong to other games and are not played here.

## The figure (both goals)

Three rays leave one point, the vertex. Each ray's end carries a letter, and the vertex carries one too. Two of the three ray ends are joined by a straight line, making a triangle with the vertex. The figure therefore has **five angles**:
- three at the vertex (between ray 1 and 2, ray 2 and 3, and ray 1 and 3);
- two corners of the triangle.

Letters are four of A B C D E O P Q R S, drawn at random. At the easiest level (fade 1) the vertex is always "O"; at higher fades it can be any letter. Letters stand just outside the points, and the vertex's letter stands on the side away from its rays.

## The rule the game enforces (never stated on screen)

A name of three letters is right when its **middle letter is the angle's vertex** and its **outer two letters are points on that angle's two arms**, in either order (ABC = CBA).

Whatever three letters she gives, the game lights the angle those letters *actually denote*: the angle at the middle letter, between the lines to the other two letters.
- It is drawn solid when that is one of the figure's five angles.
- It is drawn dashed, with its two rays, when it is not a drawn angle. Then the child sees the game making up a corner that is not in the picture.

The game never says "wrong" and never says where the vertex goes. The goal lines name neither the order nor the middle.

## Goal 1: `say` (name the lit angle)

**What she sees.** The figure, with **one angle lit** as a blue-filled sector with a blue arc. Every point has a small dot and a letter. The instruction at the bottom reads "Akshar chhookar chamakte kon ka naam likho" (no number word, no rule). Under it are three buttons, "Mita do", "Wapas" (both off until she taps) and "Yahi naam" (disabled). Shot: `say-initial-*`.

**What she does, in order.**
1. She taps three of the letters/dots, one after another. Each tapped point turns green and grows, and the name so far builds in a chip (e.g. "∠COB") in the quietest corner of the board, away from the points. The chip shows underscores for letters not yet tapped. Shot: `say-mid-*`.
2. When three are tapped, "Yahi naam" turns green. She presses it. A fourth tap is refused. The same point can be tapped twice (it gives a name like "∠OOB", which denotes no angle).
3. "Wapas" takes back her last letter (one step); "Mita do" clears all of them.

**This level's givens and key** (as in the shots). Letters O, C, B, Q. Rays OC, OB and OQ; C and Q are joined. The lit angle is the one at O between OB and OC.
- **The key is a name with O in the middle and B and C at the ends:** "BOC" or "COB". Either order passes.
- The five angles of this figure are ∠COB (lit), ∠BOQ, ∠COQ, and the triangle corners ∠OCQ and ∠OQC.

Shot: `say-end-*` (all three letters green, name chip "∠COB", green tick beside O, clear of the letter and the rays). The figure does not move when the game is solved: the buttons stay, all off.

### Mal-rule `vertex-name`
- **Kit belief:** "Thinks the letters of an angle can be written in any order, so the vertex need not be the middle letter".
- **What a child holding it does.** She taps the right three letters with the vertex first. In this level she taps **O, C, B**, so the chip reads "∠OCB" (or she puts O last, "CBO"). Shot: `say-mal-vertex-name-*`.
- **What the screen then shows when she presses "Yahi naam":**
  - the lit angle at O stays lit (so she can compare);
  - the game lights the angle her name actually denotes: the corner at the **middle letter**, here C, between the lines to O and to B;
  - this one is not a drawn angle, so it is shown **dashed**: dashed brown rays C to B and C to O, and a dashed brown arc at C;
  - a brown chip "∠OCB" sits beside C, clear of every point, letter and line. Her name now shows only there (the corner chip that held it while she tapped steps aside during the play-out), so it is on screen once.
- **How it is graded.** Not right. It is named `vertex-name` only when her three letters are exactly the right three letters with the vertex not in the middle. A name with a wrong letter is an ordinary miss, and the same light-up of what it denotes still shows. When the vertex-first name's middle letter happens to be a point where the figure does have a corner (a joined ray end), that corner is shown **solid** instead of dashed. Both cases are tested.
- **Does this match the kit's belief?** Yes. The kit's signs ("names the angle at B as BAC", "puts the arc at the first letter") are played as: she means the angle at the vertex, and a different corner lights up.

## Goal 2: `find` (find the angle a name means)

**What she sees.** The same kind of figure, with **no angle lit**. Instead, every one of the five angles has its arc drawn bold in dark grey: no handles. A name chip such as "∠OPQ" shows in a corner of the board and in the instruction: "∠OPQ kaunsa kon hai? Uska chaap chhuo". The only button is "Wapas". Shot: `find-initial-*`.

**What she does.** She taps an arc. A tap anywhere within 44 board-pixels of an arc goes to the *nearest* arc, so no point of the board belongs to two arcs, and every arc keeps a round touch area at least 48 board-pixels across (about 54 CSS px at 360) that lies wholly in its own region. The generator never serves a figure where an arc has no such area. That single tap is the decision; the arc turns green. There is no "mid" screen for `find`: the screen between the first look and her tap is identical to the first one, so no `mid` shots are given.

**This level's givens and key** (as in the shots). Letters O, A, Q, P. Rays OA, OQ and OP; Q and P are joined. The name shown is **∠OPQ**, written with the vertex *not* at O: the middle letter is P, so the angle is the triangle corner at P, between PO and PQ.
- **The key is the small arc at P.**
- The five arcs are: ∠AOQ, ∠QOP, ∠AOP (the wide one at O), ∠OQP at Q and ∠OPQ at P.
- ∠OPQ and ∠QPO are the same angle, so the name could equally have been shown as ∠QPO.

Shot: `find-end-*` (the arc at P green, green tick beside P).

### Mal-rule `vertex-name`
- **What a child holding it does.** She reads "∠OPQ" and takes the corner at its first letter, O, between the lines to P and Q. She taps the arc **∠QOP** at O. Shot: `find-mal-vertex-name-*`.
- **What the screen then shows:**
  - the arc she tapped turns green;
  - a brown arc is drawn over it;
  - a brown chip "∠QOP" appears beside O, naming what she tapped, clear of the points and lines;
  - the shown name "∠OPQ" stays up.
- **How it is graded.** Not right. It is named `vertex-name` only when she taps the angle at the shown name's first letter, or its last letter when the first-letter reading is not a drawn angle. The generator only serves a name if one of those two readings is one of the five drawn angles, so the belief always has something real to land on.
- **Which readings of the belief it does not cover** (main's question (vi)). The game names exactly one reading per level: the first-letter reading when it is a drawn angle, else the last-letter reading. Not covered:
  - the last-letter reading whenever the first-letter reading is also drawn (here the angle at Q, ∠OQP, would be "vertex last"; a tap on it is an ordinary miss);
  - a reading whose corner is not one of the five drawn angles (the game cannot be tapped there in `find`; `say` covers it, dashed);
  - the kit's third sign, "says angle ABC and angle BAC are the same": `find` never asks her to compare two names.

## Things the judges should know

- **Can a child pass by trial?**
  - `say`: not on the first try. A name is three letters in order out of four, so there are 24 orderings of three different letters, and only two are right (about 8%). She can try again: "Mita do" clears her letters, or "Wapas" takes back the last one, and she taps again. The game lights what each name denotes, so a persistent child can steer by watching which corner lights. Every press of "Yahi naam" is recorded, with her misses and the name she gave. Only a first press that is already a solve counts as first-try evidence for the learner model, at the full in-game weight (0.5).
  - `find`: yes, with at most four wrong taps. It is one tap among five arcs, so a correct *first* tap enters the learner model at the lower "chance" weight, not the full weight, because luck could produce it. The tapped arc's name appears in a brown chip, so she learns names by elimination. Every tap is recorded.
  - A mix-up named at her first press stays on her record even if she then solves.
- **Shortcuts the generator refuses to serve.**
  - A `say` level where reading the three letters left to right, or top to bottom, puts the vertex in the middle.
  - A `find` level whose answer is the widest arc.
  - Every point at least 68 board units from the others, every angle at least 20°, and (`find`) every arc with its own round touch area at least 48 units across.
- **What the teacher receives.** The name she gave (`said`, or `picked` for `find`), `vertex_ok` (yes or no) and `arms_ok` (yes or no) at her latest decision, and the mix-up if named. The game never speaks.
- **Sizes.** The board is a fixed 320 × 300 units, scaled into the box (at 360 px the play box is about 360 × 399, so 1 unit is about 1.12 CSS px). Every letter's touch square is 48 to 64 px across and never overlaps another letter's (the letters are 68 units apart). Every arc's round touch area is at least 48 units (about 54 px) across and lies in that arc's own tap region, so no two overlap. The triangle-corner arcs are drawn at radius 24 units (was 30) so they keep room beside the wide arc's end.
- **Not checked yet:** on a real phone, or with a child.

## Every child-facing string

The lesson is in Hinglish (shown), Hindi or English; the game shows only the lesson's language. The figure's letters are the same Latin capitals in all three.

| Where | Hinglish | Hindi | English |
|---|---|---|---|
| game name (header, shown capitalised) | Kon | कोण | Angles |
| instruction, say | Akshar chhookar chamakte kon ka naam likho | अक्षर छूकर चमकते कोण का नाम लिखो | Tap letters to name the lit angle |
| instruction, find (the name is filled in, e.g. ∠OPQ) | ∠OPQ kaunsa kon hai? Uska chaap chhuo | ∠OPQ कौन-सा कोण है? उसका चाप छुओ | Which angle is ∠OPQ? Tap its arc |
| clear button, say | Mita do | मिटा दो | Clear |
| commit button, say | Yahi naam | यही नाम | That's the name |
| undo button, say (her last letter) and find | Wapas | वापस | Undo |
| chips | ∠COB, ∠OCB, ∠OPQ, ∠QOP (letters with ∠) | same | same |
| the lesson's one-line verb for this game (teacher side, not on the game screen) | kon ka naam batao ya naam wala kon dhoondho | (no separate Hindi line; the lesson says it in its own language) | name the angle, or find the angle a name means |

"Mita do" uses "do" as the verb "give/put", not the number two. Letters are shown as capitals. The game shows no feedback words: no "right", no "wrong", no hint text. Feedback is only ticks, lit sectors, dashed rays, arcs and chips. The round "T" at the top is the teacher's avatar from the lesson shell, not part of the game.

## Fixed since the first packet

Each fix has a test that fails on the first packet's code (`tests/r8-games-kon-layout.test.mjs` on every served level at both sizes, or the proof suite `tests/r8-games-kon-name.test.mjs`).

1. **Number word in the instruction** (was issue 1). "Akshar chhookar chamakte kon ka naam likho" / "अक्षर छूकर चमकते कोण का नाम लिखो" / "Tap letters to name the lit angle": no number word, no rule (test: no goal line or button has a number word).
2. **`find` targets at 360** (was 2). The rings are gone; she taps the arc itself (the nearest arc within 44 units). Every arc has a round touch area ≥ 48 units (about 54 px at 360) wholly in its own region, so no two touch areas overlap (proof suite over every generated `find` level; layout check: no two arc targets overlap, none under 48 px).
3. **Chip overlap in the `say` play-out** (was 3). The chip is placed beside its corner clear of every point, letter, line and other chip, and the name shows once (layout check: no chip across a line or over a point).
4. **Layout shift at the end** (was 4). The buttons stay on solving, all off, so the board keeps its size (layout check: the board's box is the same before and after solving).
5. **No undo in `say`** (was 6). "Wapas" takes back her last letter, beside "Mita do".

## Known issues still open

1. **`find` plays out only one reading** (was 5; a design question for main and the judges). See "Which readings of the belief it does not cover" under Goal 2.
2. **Identical `mid` shot for `find`.** Not a defect: there is nothing between the first screen and the tap (see Goal 2). It is why this packet has 14 screenshots, not 16.

## Screenshots (14)

`{say,find}-<step>-{360x640,1366x768}.png`:
- say: `initial`, `mid`, `mal-vertex-name`, `end`
- find: `initial`, `mal-vertex-name`, `end`

Steps:
- `initial` is the first screen;
- `mid` is part-way through (three letters tapped, before "Yahi naam");
- `mal-vertex-name` is the vertex-name answer, just after the decision;
- `end` is solved.

The two goals are different levels. The `say` level is the O, C, B, Q figure (`kon-name:say:100:75:60:2:0`); the `find` level is the O, A, Q, P figure (`kon-name:find:155:65:50:1:4:0`). The 360×640 shots are at 1× pixel density; the 1366×768 shots were taken at 2× and scaled to 1×.
