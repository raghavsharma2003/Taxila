# Judge packet: `kon/name`, naming an angle with three letters (class 6 maths, "Angles and comparing angles")

This packet is meant to be read on its own: everything a judge needs is in this file and the 30 screenshots beside it. Code: branch `claude/r8-tally-name-r3` (the fixes after the evening judging of 2026-11-11); every screenshot was retaken on it. **Not yet checked on a real phone, or with a child.**

**Topic:** c6-maths-ch02-t02, skill s1 (naming an angle). Class 6, age band 10–12. Two goals: `say` (name a lit angle) and `find` (find the angle a name means).

**The three laws this packet is built to** (main's rulings, for every game):
1. Green means right and only right. What she has tapped but not yet committed is blue-violet (the focus colour); her own wrong value is brown (the mix-up colour); green appears only on a solve. The green-yellow action button keeps its colour.
2. After a miss the screen never holds the key while a try remains.
3. A mix-up is named only by an act a guess rarely produces. `say` (a three-letter name she builds) names it. `find` (one tap among five arcs) does not: there it is graded at chance weight, nothing about it reaches the teacher, and it is named only when it repeats on a level with other letters.

**The mix-up it plays out:** `vertex-name` (kit id `c6-maths-ch02-t02-m-vertex-name`). The kit's belief: "Thinks the letters of an angle can be written in any order, so the vertex need not be the middle letter". Its signs: names the angle at B as angle BAC; puts the arc at the first letter; says angle ABC and angle BAC are the same.

| Goal | Named (kept on her record) | Not named from one tap; named only on a repeat |
|---|---|---|
| say | vertex-name | — |
| find | — | vertex-name (a first- or last-letter arc) |

## The figure (both goals)

Three rays leave one point, the vertex. Each ray's end carries a letter, and the vertex carries one too. Two **neighbouring** ray ends are joined by a straight line, making a triangle with the vertex; the joining line never crosses a ray. The figure therefore has **five angles**: three at the vertex and two corners of the triangle.

Letters are four of A B C D E O P Q R S, drawn at random, **never O and Q together** (they look alike at 360 px). At the easiest level (fade 1) the vertex is "O" **in her first level of this game only**; every later level at fade 1 has another letter at the vertex (O may stand at a ray end), so "O goes in the middle" cannot pass the fade. At higher fades the vertex can be any letter.

## The rule the game enforces (never stated on screen)

A name of three letters is right when its **middle letter is the angle's vertex** and its **outer two letters are points on that angle's two arms**, in either order (ABC = CBA).

Whatever three letters she gives (`say`), the game lights the angle those letters *actually denote*: the angle at the middle letter, between the lines to the other two. It is drawn solid when that is one of the five angles, dashed (with its two rays) when it is not. The game never says "wrong" and never says where the vertex goes.

## Reading the letters like text never passes (both goals)

A child who does not know the rule may read the letters off the screen as she reads a line of text. The generator refuses any level where that puts the asked angle's vertex in the middle:
- letters within one letter's height of each other (22 board px) are **one row**; letters within one letter's width (16 board px) are **one column**;
- it reads by rows, top to bottom or bottom to top, each row left to right or right to left; and by columns, left to right or right to left, each column top to bottom or bottom to top (eight orders);
- it checks both the points and the places where their letters are drawn.

This applies to every served level of both goals, and a test checks it with its own reading code. (The level judge 2 found, A on top with Q and P at one height, read "AQP", is now refused.)

## Goal 1: `say` (name the lit angle)

**What she sees.** The figure, with **one angle lit** as a blue-filled sector with a blue-violet arc. The instruction reads "Akshar chhookar chamakte kon ka naam likho". Buttons: "Mita do", "Wapas" and "Yahi naam" (off). Shot: `say-initial-*`.

**What she does.** She taps three letters/dots in turn. Each tapped point turns **blue-violet** and grows; the name so far builds in a blue-violet chip (e.g. "∠CO_") in the quietest corner of the board. "Yahi naam" turns on at three letters. "Wapas" takes back her last letter; "Mita do" clears all. Shot: `say-mid-*`.

**This level's givens and key** (level `kon-name:say:120:75:50:0:1`, her first level, so the vertex is O). Letters O, R, C, P: rays OR, OC, OP; R and C are joined. The lit angle is at O between OC and OP. **The key is "COP" or "POC".** Shot: `say-end-*` (green tick beside O; the line under the board: "Tumne ∠COP likha · jaanch: 1").

### Mal-rule `vertex-name`
- **What a child holding it does.** She taps the right three letters with the vertex first: **O, C, P** ("∠OCP"). Shot: `say-mal-vertex-name-*`.
- **What the screen then shows when she presses "Yahi naam":** the lit angle at O stays lit. The game lights the angle her name denotes: the corner at the **middle letter C**, between the lines to O and to P. That is not one of the five angles, so it is **dashed**: dashed brown rays C to O and C to P, and a dashed brown arc at C. The dashed C-to-O ray lies on the solid line CO, so it is drawn **4 px beside it**, not over it. A brown chip "∠OCP" sits beside C.
- **How it is graded.** Not right; named `vertex-name` (a name she built letter by letter, and the kit's own sign) only when her three letters are exactly the right three with the vertex not in the middle. A name with a wrong letter is an ordinary miss with the same light-up. When the vertex-first name's middle letter is a triangle corner and its arms are that corner's, the corner lights **solid**.
- **A solve after a miss** ends with a **pale** tick and "jaanch: 2". Shot: `say-end-after-miss-*`.

**A later level at fade 1** (level `kon-name:say:125:75:55:0:1`, served as her second level): letters A, B, Q, E with **A at the vertex**; the lit angle is ∠QAE. Shots: `say-later-initial-*`, `say-later-mal-vertex-name-*` (she names it vertex-first, "∠AQE"; the angle at Q between QA and QE is not one of the five, so it is dashed).

## Goal 2: `find` (find the angle a name means)

**What she sees.** No angle lit. All five angles have their arcs drawn bold in dark grey. **The two arcs at the vertex between neighbouring rays are drawn at different radii** (42 and 58 units), so where they meet on the shared ray there is a 16-unit step and they never read as one curve; the wide arc sits further out (84), the corner arcs are small (24). A name chip such as "∠APO" shows in a corner of the board and in the instruction: "∠APO kaunsa kon hai? Uska chaap chhuo". The only button is "Wapas".

**What she does.** She taps an arc. A tap within 44 board-units of an arc goes to the nearest arc (the tap model sits each of the two vertex arcs at 50 units; every point of each *drawn* arc taps that arc, which is tested). Every arc keeps a round touch area at least 48 units across in its own region. That single tap is the decision.

**The asked angle is at the vertex (the centre point) on some levels and at a triangle corner on others.** Over 48 served levels (three fades) the test counts at least 6 of each; in the generator's output about a third are at the vertex. One level of each is shown:

**A triangle corner** (level `kon-name:find:150:80:60:0:3:1`). Letters O, P, A, D: rays OP, OA, OD; P and A are joined. The name shown is **∠APO**: the middle letter is P, so the angle is the triangle corner at P, between PA and PO. **The key is the small arc at P.** Shots: `find-initial-*`, `find-end-*` (the arc at P green, a green tick; "Tumne ∠APO dhoondha · jaanch: 1").

**The vertex** (level `kon-name:find:140:70:50:1:1:1`). Letters O, C, P, E: rays OC, OP, OE; P and E are joined. The name shown is **∠EOP**: the middle letter is O, so the angle is at the vertex between OE and OP. **The key is the arc at O between OP and OE.** Shots: `find-vertex-initial-*`, `find-vertex-end-*` ("Tumne ∠EOP dhoondha · jaanch: 1").

### What a wrong tap shows: the contradiction form
- **What a child holding the belief does.** She reads "∠APO" and takes the corner at its first letter, A, between the lines to P and O: she taps **∠PAO** at A. Shot: `find-first-letter-played-*`. At the vertex level she reads "∠EOP" and taps the corner at E (∠OEP): `find-vertex-first-letter-played-*`.
- **What the screen then shows** (no words):
  - the arc she tapped turns **brown** (never green);
  - in place of the asked name, one row: **"∠APO ≠ ∠OAP = ∠PAO"**. The asked name stays in its plain ink chip; "≠" and a brown chip with *her arc's own two names* follow it.
  - The row sits **beside the figure**: to its right or left, level with its middle, where it fits (at 1366); stacked as a column there when the row is too wide; else just above or below the figure (at 360).
  - Nothing marks the asked arc.
- **Why this form.** Showing only her arc's name ("∠OAP") is not enough, because to a child with this belief "∠OAP" and "∠APO" are the same name. The row sets the same three letters in another order against the asked name as **a different angle** ("≠"), and shows the one reordering that *is* the same angle (the reverse, "=") on her arc. That contradicts "the same letters are the same angle" without stating the middle-letter rule, and without showing where the asked angle is. Any wrong arc shows the same form (with its own names).
- **How it is graded.** Not right. One tap among five lands on this arc by chance a fifth of the time, so **nothing goes on her record from it**, and **nothing about it reaches the teacher's view** after one tap:
  - the grade keeps it at chance weight as `chanceMis` (the play server's own memory);
  - the lesson's evidence rows carry no misconception and no `chanceMis`;
  - the trail the lesson reads lists no mal-rule;
  - no seam row is sent for the tap; the level-end row has no `sign`, `vertex_ok` or `arms_ok` (find reports only the name and the arc she picked);
  - the flight recorder logs the tap as an ordinary miss.
  
  When she does it again on a level **with other letters**, the play server names it: the evidence row carries `vertex-name` and the trail lists it. A test plays this through the real routes. A `say` miss names it on its own (a built name).
- **A solve after wrong taps** ends with a **pale** tick and "jaanch: 2"; only her first tap is evidence. Shots: `find-end-after-miss-*`, `find-vertex-end-after-miss-*`.

## Things the judges should know

- **Can a child pass by trial?**
  - `say`: not on the first try (2 of 24 orderings of three different letters). She can try again; the game lights what each name denotes, so a persistent child can steer by watching which corner lights. Only a first press that is already a solve counts as first-try evidence (full in-game weight, 0.5). A mix-up named at her first press stays on her record.
  - `find`: yes, by elimination, with at most four wrong taps. A correct *first* tap enters at the "chance" weight; a later solve shows a pale tick and its number of checks.
- **Shortcuts the generator refuses to serve.** A level where reading the letters like text puts the vertex in the middle (above, both goals); a `find` level whose answer is the widest arc; any figure with points closer than 68 units, an angle under 20°, a joining line across a ray, O with Q, an arc without its own touch area (`find`), or a vertex-first dashed angle under 20° (`say`).
- **What the teacher receives.** `say`: the name she gave (`said`), `vertex_ok` and `arms_ok`, and the mix-up if named. `find`: the asked name and the arc she `picked` only; the mix-up only on a repeat (above).
- **Sizes.** The board is a fixed 320 × 300 units (at 360 px about 1.12 CSS px per unit). The letters, chips and tick grow with the board on a wide screen (up to 2×; at 1366 the board is about 2.5 CSS px per unit), so they keep their size relative to the figure; a phone keeps them as they were. Letter touch squares are 48–64 px and never overlap. The line under the board keeps room for two lines on a phone, so the board does not move when it changes to the end line.
- **Picker speed.** The read-like-text rule refuses most figures, so `find` now tries 1000 figures per request (was 160) and still serves about 6. The picker's CPU time: p95 19 ms over 60 requests (bar 50 ms).
- **Not checked yet:** on a real phone, or with a child.

## Every child-facing string

| Where | Hinglish | Hindi | English |
|---|---|---|---|
| game name (header) | Kon | कोण | Angles |
| instruction, say | Akshar chhookar chamakte kon ka naam likho | अक्षर छूकर चमकते कोण का नाम लिखो | Tap letters to name the lit angle |
| instruction, find (name filled in) | ∠APO kaunsa kon hai? Uska chaap chhuo | ∠APO कौन-सा कोण है? उसका चाप छुओ | Which angle is ∠APO? Tap its arc |
| end line, say | Tumne ∠COP likha · jaanch: 1 | तुमने ∠COP लिखा · जाँच: 1 | You wrote ∠COP · checks: 1 |
| end line, find | Tumne ∠APO dhoondha · jaanch: 1 | तुमने ∠APO ढूँढा · जाँच: 1 | You found ∠APO · checks: 1 |
| clear button, say | Mita do | मिटा दो | Clear |
| commit button, say | Yahi naam | यही नाम | That's the name |
| undo button | Wapas | वापस | Undo |
| chips | ∠COP, ∠OCP, ∠APO, "∠APO ≠ ∠OAP = ∠PAO" | same | same |

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
| 7. Figure | The two vertex arcs drawn at 42 and 58 units (a gap where they meet); the joined pair is always two neighbouring ray ends (joining the outer two always crossed the middle ray); say's dashed arc ≥ 24 units long (radius up to 72, its angle ≥ 20°); a dashed ray on a drawn line is drawn 4 px beside it; O and Q never together. | `find-initial`, `say-mal-vertex-name` |
| 8. "kon" stays | Unchanged. | — |

## Changes after the evening judging

Rulings: `docs/design/round8/games-judging/RULINGS-2026-11-11-evening.md` (kon/name 1–5). Tests: `tests/r8-games-kon-name.test.mjs`, `tests/r8-games-kon-layout.test.mjs` (every served level, every screen, both sizes), `tests/r8-play-laws.test.mjs`.

| # | Ruling | What changed | Screens |
|---|---|---|---|
| 1 (blocking) | Second say level: A on top, Q and P at one height; reading like text gives AQP, the key. Letters within one letter height are one row, within one letter width one column; refuse any level where reading by rows or columns, either way, puts the vertex in the middle; assert on every served level of both goals | The generator refuses such levels (eight reading orders, by the points and by where the letters are drawn; the view now draws the letters where the law places them). The proof suite asserts it on every generated level of both goals with its own reading code. Both packet levels changed (the old say level is refused). | `say-*`, `find-*` |
| 2 | find keys at the centre point as well as at triangle corners; say so; one screen of each | Both kinds are served (about a third at the vertex), tested on 48 served levels. The packet shows a corner level (`find-*`) and a vertex level (`find-vertex-*`, new). | `find-*`, `find-vertex-*` |
| 3 | After one find tap nothing about vertex-name reaches the teacher's view; only on the repeat; test it | find reports only the name and the arc she picked (no `sign`, `vertex_ok`, `arms_ok`). Centrally, for every one-pick mix-up: no mid-level seam; no mal-rule in the trail; no `chanceMis` on the lesson's evidence rows; logged as an ordinary miss. On a repeat with other letters the row is named and the trail lists it. A test plays both through the real `/api/play/act` and `/api/play/next` routes and reads the signed tokens. | — |
| 4 | At 1366 the chips scale with the board; the "≠" row sits beside the figure | Chips, letters, the "≠" and the tick grow with the board (up to 2×; unchanged on a phone). The row sits to the figure's right or left where it fits, stacked there when too wide, else just above or below it. | `find-first-letter-played-1366x768`, `find-vertex-first-letter-played-1366x768` |
| 5 | find's end line names what she found; "jaanch" one way everywhere | find ends "Tumne ∠APO dhoondha · jaanch: 1" (Hindi "तुमने ∠APO ढूँढा · जाँच: 1", English "You found ∠APO · checks: 1"), the same form as say's. Every kon/name string writes "jaanch" / "जाँच" / "checks" the same way. | `find-end-*`, `find-vertex-end-*` |
| CPU | Keep the picker under its bar | p95 19 ms of CPU over 60 requests after the new rule (bar 50 ms; it was 16–20 ms). | — |

## Screenshots (30)

`<goal>-<step>-{360x640,1366x768}.png`:
- say: `initial`, `mid`, `mal-vertex-name`, `end`, `end-after-miss`, `later-initial`, `later-mal-vertex-name`
- find (a corner): `initial`, `first-letter-played`, `end`, `end-after-miss`
- find-vertex (the vertex): `initial`, `first-letter-played`, `end`, `end-after-miss`

Steps: `initial` the first screen; `mid` three letters tapped, before "Yahi naam"; `mal-vertex-name` / `first-letter-played` just after the decision; `end` solved first try; `end-after-miss` solved at the second check; `later-*` a second level at fade 1. `find` has no `mid` screen: there is nothing between the first look and the tap.

The 360×640 shots are at 2× pixel density; the 1366×768 shots were taken at 2× and scaled to 1× (RGB, no palette).
