# Judge packet: `kon/name`, naming an angle with three letters (class 6 maths, "Angles and comparing angles")

This packet is meant to be read on its own: everything a judge needs is in this file and the 22 screenshots beside it. Code: branch `claude/r8-kon-round2` (the fixes after judging round 2, `RULINGS-2026-11-11.md`); every screenshot was retaken on it. **Not yet checked on a real phone, or with a child.**

**Topic:** c6-maths-ch02-t02, skill s1 (naming an angle). Class 6, age band 10–12. Two goals: `say` (name a lit angle) and `find` (find the angle a name means).

**The three laws this packet is built to** (main's rulings, for every game):
1. Green means right and only right. What she has tapped but not yet committed is blue-violet (the focus colour); her own wrong value is brown (the mix-up colour); green appears only on a solve. The green-yellow action button keeps its colour.
2. After a miss the screen never holds the key while a try remains.
3. A mix-up is named only by an act a guess rarely produces. `say` (a three-letter name she builds) names it; `find` (one tap among five arcs) does not: there it is graded at chance weight, not kept on her record, and named only when it repeats on a level with other letters.

**The mix-up it plays out:** `vertex-name` (kit id `c6-maths-ch02-t02-m-vertex-name`). The kit's belief: "Thinks the letters of an angle can be written in any order, so the vertex need not be the middle letter". Its signs: names the angle at B as angle BAC; puts the arc at the first letter; says angle ABC and angle BAC are the same.

| Goal | Named (kept on her record) | At chance weight, named only on a repeat |
|---|---|---|
| say | vertex-name | — |
| find | — | vertex-name (a first- or last-letter arc) |

## The figure (both goals)

Three rays leave one point, the vertex. Each ray's end carries a letter, and the vertex carries one too. Two **neighbouring** ray ends are joined by a straight line, making a triangle with the vertex; the joining line never crosses a ray. The figure therefore has **five angles**: three at the vertex and two corners of the triangle.

Letters are four of A B C D E O P Q R S, drawn at random, **never O and Q together** (they look alike at 360 px). At the easiest level (fade 1) the vertex is "O" **in her first level of this game only**; every later level at fade 1 has another letter at the vertex (O may stand at a ray end), so "O goes in the middle" cannot pass the fade. At higher fades the vertex can be any letter.

## The rule the game enforces (never stated on screen)

A name of three letters is right when its **middle letter is the angle's vertex** and its **outer two letters are points on that angle's two arms**, in either order (ABC = CBA).

Whatever three letters she gives (`say`), the game lights the angle those letters *actually denote*: the angle at the middle letter, between the lines to the other two. It is drawn solid when that is one of the five angles, dashed (with its two rays) when it is not. The game never says "wrong" and never says where the vertex goes.

## Goal 1: `say` (name the lit angle)

**What she sees.** The figure, with **one angle lit** as a blue-filled sector with a blue-violet arc. The instruction reads "Akshar chhookar chamakte kon ka naam likho". Buttons: "Mita do", "Wapas" and "Yahi naam" (off). Shot: `say-initial-*`.

**What she does.** She taps three letters/dots in turn. Each tapped point turns **blue-violet** and grows; the name so far builds in a blue-violet chip (e.g. "∠EO_") in the quietest corner of the board. "Yahi naam" turns on at three letters. "Wapas" takes back her last letter; "Mita do" clears all. Shot: `say-mid-*`.

**This level's givens and key** (level `kon-name:say:110:80:65:0:1`, her first level, so the vertex is O). Letters O, S, E, R: rays OS, OE, OR; S and E are joined. The lit angle is at O between OE and OR. **The key is "EOR" or "ROE".** Shot: `say-end-*` (green tick beside O; the line under the board: "Tumne ∠EOR likha · jaanch: 1").

### Mal-rule `vertex-name`
- **What a child holding it does.** She taps the right three letters with the vertex first: **O, E, R** ("∠OER"). Shot: `say-mal-vertex-name-*`.
- **What the screen then shows when she presses "Yahi naam":** the lit angle at O stays lit; the game lights the angle her name denotes, the corner at the **middle letter E**, between the lines to O and to R. That is not one of the five angles, so it is **dashed**: dashed brown rays E to O and E to R, and a dashed brown arc at E. The dashed E-to-O ray lies on the solid line OE, so it is drawn **4 px beside it**, not over it. The dashed arc is at least 24 board-units long (about 26 CSS px at 360). A brown chip "∠OER" sits beside E.
- **How it is graded.** Not right; named `vertex-name` (a name she built letter by letter, and the kit's own sign) only when her three letters are exactly the right three with the vertex not in the middle. A name with a wrong letter is an ordinary miss with the same light-up. When the vertex-first name's middle letter is a triangle corner, that corner lights **solid**.
- **A solve after a miss** ends with a **pale** tick and "jaanch: 2". Shot: `say-end-after-miss-*`.

**A later level at fade 1** (level `kon-name:say:0:70:70:1:0`, served as her second level): letters Q, P, A, B with **Q at the vertex**. Shots: `say-later-initial-*`, `say-later-mal-vertex-name-*` (she names it vertex-first, "∠QPA"; the corner at P lights).

## Goal 2: `find` (find the angle a name means)

**What she sees.** No angle lit. All five angles have their arcs drawn bold in dark grey. **The two arcs at the vertex between neighbouring rays are drawn at different radii** (42 and 58 units), so where they meet on the shared ray there is a 16-unit step and they never read as one curve; the wide arc sits further out (84), the corner arcs are small (24). A name chip such as "∠OAD" shows in a corner of the board and in the instruction: "∠OAD kaunsa kon hai? Uska chaap chhuo". The only button is "Wapas". Shot: `find-initial-*`.

**What she does.** She taps an arc. A tap within 44 board-units of an arc goes to the nearest arc (the tap model sits each of the two vertex arcs at 50 units; every point of each *drawn* arc taps that arc, which is tested). Every arc keeps a round touch area at least 48 units across in its own region. That single tap is the decision.

**This level's givens and key** (level `kon-name:find:10:80:65:1:4:0`). Letters O, R, D, A: rays OR, OD, OA; D and A are joined. The name shown is **∠OAD**: the middle letter is A, so the angle is the triangle corner at A, between AO and AD. **The key is the small arc at A.** Shot: `find-end-*` (the arc at A green, green tick beside A; "Jaanch: 1").

### What a wrong tap shows: the contradiction form (ruling 3)
- **What a child holding the belief does.** She reads "∠OAD" and takes the corner at its first letter, O, between the lines to A and D: she taps **∠AOD** at O. Shot: `find-first-letter-played-*`.
- **What the screen then shows** (no words):
  - the arc she tapped turns **brown** (never green);
  - in place of the asked name, one row: **"∠OAD ≠ ∠DOA = ∠AOD"**. The asked name stays in its plain ink chip; "≠" and a brown chip with *her arc's own two names* follow it.
  - Nothing marks the arc at A.
- **Why this form.** Showing only her arc's name ("∠DOA") is not enough, because to a child with this belief "∠DOA" and "∠OAD" are the same name. The row sets the same three letters in another order against the asked name as **a different angle** ("≠"), and shows the one reordering that *is* the same angle (the reverse, "=") on her arc. That contradicts "the same letters are the same angle" without stating the middle-letter rule, and without showing where the asked angle is. Any wrong arc shows the same form (with its own names).
- **How it is graded.** Not right. One tap among five lands on this arc by chance a fifth of the time, so **nothing goes on her record from it**: the grade keeps `vertex-name` at chance weight (`chanceMis`; the teacher also sees `sign=vertex-name`) when her arc is the angle at the shown name's first (or, when that is not drawn, last) letter. The play server names it when she does it again on a level **with other letters** (the shared law-3 rule; kon's surface for `find` is its letters). A `say` miss names it on its own (a built name).
- **A solve after wrong taps** ends with a **pale** tick and "Jaanch: 2"; only her first tap is evidence. Shot: `find-end-after-miss-*`.

## Things the judges should know

- **Can a child pass by trial?**
  - `say`: not on the first try (2 of 24 orderings of three different letters). She can try again; the game lights what each name denotes, so a persistent child can steer by watching which corner lights. Only a first press that is already a solve counts as first-try evidence (full in-game weight, 0.5). A mix-up named at her first press stays on her record.
  - `find`: yes, by elimination, with at most four wrong taps. A correct *first* tap enters at the "chance" weight; a later solve shows a pale tick and its number of checks.
- **Shortcuts the generator refuses to serve.** A `say` level where reading the letters left to right, or top to bottom, puts the vertex in the middle; a `find` level whose answer is the widest arc; any figure with points closer than 68 units, an angle under 20°, a joining line across a ray, O with Q, an arc without its own touch area (`find`), or a vertex-first dashed angle under 20° (`say`).
- **What the teacher receives.** The name she gave (`said`, or `picked` for `find`), `vertex_ok` and `arms_ok` at her latest decision, the mix-up if named (`say`), and `sign=vertex-name` where it applies (`find`).
- **Sizes.** The board is a fixed 320 × 300 units (at 360 px about 1.12 CSS px per unit). Letter touch squares are 48–64 px and never overlap. The line under the board keeps room for two lines on a phone, so the board does not move when it changes to the end line.
- **Not checked yet:** on a real phone, or with a child.

## Every child-facing string

| Where | Hinglish | Hindi | English |
|---|---|---|---|
| game name (header) | Kon | कोण | Angles |
| instruction, say | Akshar chhookar chamakte kon ka naam likho | अक्षर छूकर चमकते कोण का नाम लिखो | Tap letters to name the lit angle |
| instruction, find (name filled in) | ∠OAD kaunsa kon hai? Uska chaap chhuo | ∠OAD कौन-सा कोण है? उसका चाप छुओ | Which angle is ∠OAD? Tap its arc |
| end line, say | Tumne ∠EOR likha · jaanch: 1 | तुमने ∠EOR लिखा · जाँच: 1 | You wrote ∠EOR · checks: 1 |
| end line, find | Jaanch: 1 | जाँच: 1 | Checks: 1 |
| clear button, say | Mita do | मिटा दो | Clear |
| commit button, say | Yahi naam | यही नाम | That's the name |
| undo button | Wapas | वापस | Undo |
| chips | ∠EOR, ∠OER, ∠OAD, "∠OAD ≠ ∠DOA = ∠AOD" | same | same |

"kon" stays: it is the lessons' word for angle (ruling 8). "Mita do" uses "do" as the verb. The game shows no feedback words: no "right", no "wrong", no hint text.

## Changes after judging round 2

Rulings: `docs/design/round8/games-judging/RULINGS-2026-11-11.md` (kon/name 1–8). Each change is held by a test in `tests/r8-games-kon-name.test.mjs` (every generated level) or `tests/r8-games-kon-layout.test.mjs` (every served level, every screen, 360 × 640 and 1366 × 768).

| Ruling | What changed | Screens |
|---|---|---|
| 1. Find's wrong pick is never green | Her wrong arc is brown; green only on the solve. Tapped letters and the building name in `say` are blue-violet (focus), not green. | `find-first-letter-played`, `say-mid` |
| 2. Find names nothing from one tap | The grade keeps a first/last-letter arc at chance weight (`chanceMis`, no misconception on her record); the server names it on a second such pick on a level with other letters. | `find-first-letter-played` |
| 3. Contradict "same letters, same angle" | "∠OAD ≠ ∠DOA = ∠AOD": the asked name against her arc's two names (above). Built. | `find-first-letter-played` |
| 4. Solve after wrong taps | Pale tick; the end line counts checks ("Jaanch: 2"). Also for `say`. | `*-end-after-miss`, `*-end` |
| 5. Say unchanged | One vertex-first name still names `vertex-name`. | `say-mal-vertex-name` |
| 6. Fade 1: O in the first level only | The generator puts O at the vertex only when she has played no level of this game yet; later fade-1 levels never do. | `say-later-*` |
| 7. Figure | The two vertex arcs drawn at 42 and 58 units (a gap where they meet); the joined pair is always two neighbouring ray ends (joining the outer two always crossed the middle ray); say's dashed arc ≥ 24 units long (radius up to 72, its angle ≥ 20°); a dashed ray on a drawn line is drawn 4 px beside it; O and Q never together. | `find-initial`, `say-mal-vertex-name` |
| 8. "kon" stays | Unchanged. | — |

## Known issues still open

1. `find` has no `mid` screen: there is nothing between the first look and the tap.

## Screenshots (22)

`<goal>-<step>-{360x640,1366x768}.png`:
- say: `initial`, `mid`, `mal-vertex-name`, `end`, `end-after-miss`, `later-initial`, `later-mal-vertex-name`
- find: `initial`, `first-letter-played`, `end`, `end-after-miss`

Steps: `initial` the first screen; `mid` three letters tapped, before "Yahi naam"; `mal-vertex-name` / `first-letter-played` just after the decision; `end` solved first try; `end-after-miss` solved at the second check; `later-*` a second level at fade 1.

The 360×640 shots are now at 2× pixel density (were 1×); the 1366×768 shots were taken at 2× and scaled to 1×.
