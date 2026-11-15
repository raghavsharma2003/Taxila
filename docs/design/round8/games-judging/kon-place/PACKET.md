# Judge packet: `kon/place`, placing the protractor (class 6 maths, "Measuring and drawing angles")

This packet is meant to be read on its own: everything a judge needs is in this file and the 56 screenshots beside it. **Round 3.** Code: branch `claude/r8-kon-place-r3` (the fixes after the evening judging, `RULINGS-2026-11-11-evening.md`, kon/place 1–6: see "Changes for round 3" first; before it, the fixes after `RULINGS-2026-11-11.md` and after main's hold of the same day). Every screenshot was retaken on it. **Not yet checked on a real phone, or with a child.**

**Topic:** c6-maths-ch02-t03, "Measuring and drawing angles". Class 6, age band 10–12. Three goals: `measure` (skill s2, also s1), `draw` (s3, s2, s1) and `size` (s2).

**What is new.** The older game for this topic drew the protractor already sitting on the angle, so only one of the kit's mix-ups could ever show. Here the protractor lies loose and the child puts it on the angle herself. The game grades the placement, and then grades the number she types or the mark she makes against what the protractor *as she placed it* shows.

**The three laws this packet is built to** (main's rulings, for every game):
1. Green means right and only right. What she has selected but not yet committed is blue-violet (the focus colour). Her own wrong value is brown (the mix-up colour). The green-yellow action button keeps its colour.
2. After a miss the screen never holds the key while a try remains: not the key, not a line she can trace, not readings that settle the next pick.
3. A mix-up is named only by an act a guess rarely produces (a typed number, a placement, a mark). A mix-up from a pick among a few buttons is graded at chance weight and is not kept on her record; it is named when it repeats on a level whose surface differs.

**The mix-ups it plays out** (kit ids `c6-maths-ch02-t03-m-*`):

| Goal | Named (kept on her record) | At chance weight, named only on a repeat |
|---|---|---|
| measure | wrong-scale, vertex-off, centre-on-arm (*) | — |
| draw | wrong-scale, vertex-off, centre-on-arm (*) | join-wrong-end (one of two join buttons) |
| size | none (the kit's `tool-size` is not claimed: Goal 3) | — |

(*) `centre-on-arm` is Learning's new kit entry (the old `vertex-off` split in two on 2026-11-11: `vertex-off` is now only the bottom edge on O). The game names it already; the coverage rule maps it to the kit id when that id reaches the integration branch (integration 49). Until then a centre-on-arm placement is an ordinary refusal with no mix-up recorded.

## The rule the game enforces (never stated on screen)

A protractor is **placed** when both of these hold:
- its small centre dot is within 11 board-units of the vertex O (about 9 CSS px on a 360 px phone, about 25 px on the 1366 screen; see Sizes);
- its straight base line is within ±3° of an arm. For `measure`, the other arm must also cross the half-disc, i.e. the protractor opens towards it.

Everything after that is graded on what the protractor shows *as placed*:
- The scale to read is the one whose 0 sits on the placed arm.
- A typed reading counts if it is within ±2° of what that scale shows. **The number she types decides which scale she read:** within ±2° of 180 minus that number is the other scale (`wrong-scale`).
- A drawn dot counts if it is within ±2° of the asked angle on that scale.

**A protractor that is not placed can never solve the level**, whatever number she types or marks off it. The game never snaps the protractor to the vertex or to an arm (a snap would be the placement), never prints a reading for her, shows no live reading of the angle, and has no timer.

## Goal 1: `measure` (read the angle)

**What she sees.** Two black arms from a dot O, with letters A and B at the arm ends and O near the dot (O stands clear of every line of the protractor in every pose: below its bottom edge when it is placed). A loose, see-through half-disc protractor rests below the figure, slightly tilted. It has a printed outer scale and a printed inner scale. Numbers are printed every 20° at fade 1 (as in the shots), every 30° at fade 2, and only 0, 90 and 180 at fade 3; small ticks are every 5°, longer every 10°. Where two numbers would stand closer than 4 px at the screen's size and the protractor's turn, a number first slides along its own tick (an inner one inward, an outer one outward); only where no slide parts them are **both numbers at that tick** left out together, the outer and the inner (at 360 × 640, protractor flat: the tick of the outer 80 and the inner 100; nothing at 1366). A number is never left out of one scale alone. The scale numbers are drawn over the arms and her lines on a ground halo, so a line through a number never hides it. A round blue-violet handle with two turning arrows sits on the protractor's body. The instruction under the board reads "Protractor se ∠AOB naapo". There is a row of six small buttons (↺ ↻ ← ↑ ↓ →), then "Wapas" and "Rakh do". Shots: `measure-initial-*`, `measure-turned-*` (turned 12°: a number slid along its tick), `measure-placed-*`.

**What she does, in order.**
1. She drags the protractor by its body to move it. **← ↑ ↓ → move it by one board px** (about 0.84 CSS px at 360, 2.3 px at 1366) for the last fine step under her finger: the law's own move, no snap, no reading, nothing on screen but the protractor moving.
2. She drags the blue-violet handle to turn it about its own centre, in 1° steps. ↺ and ↻ turn it by exactly 1° each press.
3. She presses "Rakh do". The protractor is now frozen. The instruction changes to **"Scale padho aur ∠AOB ka number likho"** and a **number pad** appears: 1 … 9, 0 and ⌫ (delete), with "Phir se rakho", "Wapas" and "Yahi hai" under it. Shot: `measure-locked-*`.
4. **She types the number she reads.** Nothing on the board prints a value: tapping the protractor does nothing after the lock. Her number appears in a blue-violet chip under the board as she types (e.g. "150°"). The pad refuses a number over 180. Shot: `measure-typed-*`.
5. She presses "Yahi hai" (off until she has typed a digit).
6. After the lock she has two ways back: "Wapas" takes back one step (the lock itself, or, after a miss, her last "Yahi hai"), and "Phir se rakho" unfreezes the protractor and clears what she typed.

**This level's givens and key** (as in the shots, level `kon-place:measure:150:180m`). OA runs flat to the **left**; OB goes up and to the right, so the angle opens clockwise from OA. Placed with its centre on O and its base along OA, the protractor's **outer** scale has its 0 at the far (right) end, away from A, and the **inner** scale has its 0 on OA. **The key is 150°**, read on the inner scale. 150 is not a printed number at fade 1 (every 20° is printed): she counts the ticks past 140. Reading the outer scale gives 30: that is `wrong-scale`. Levels like this one, where the outer scale is the wrong one, are half of all levels. Shot: `measure-end-*`.

### Mal-rule `vertex-off`
- **Kit belief:** "Lines up the bottom edge of the protractor instead of putting its centre point on the vertex". Signs (as split by Learning): "Places the vertex on the protractor's bottom edge, not at the small centre mark", "Gets readings a few degrees off (about 6 to 8 degrees: 133 for 125)", "Does not look for the small centre mark".
- **What a child holding it does.** She slides the protractor so its flat bottom edge lies along OA with O on that edge (O at the middle of the edge). This leaves the centre dot 24 board-units above O. She turns it flat, locks it, and types the number the protractor *as it sits* shows (here 161). Shots: `measure-vertex-off-typed-*`, `measure-vertex-off-played-*`.
- **What the screen then shows when she presses "Yahi hai"** (no words):
  - a brown ring on O, with a thin dashed brown line from O to the protractor's centre dot: **the placement only**;
  - her "161°" chip stays **neutral** (no colour of right or of a mix-up), and **no arm is drawn from the misplaced centre** (round 3, ruling 1: such an arm runs beside OB and would tell her whether her number was right).
  - The ring and the dashed join appear only in the play-out of a committed decision whose placement is the bottom edge on O. Never before her first "Yahi hai", never for any other off placement.
- **How it is graded.** Not right. Her number is graded only on a placed protractor, so here it is **not graded at all**: whatever she types (161, 150, 30, 7), the decision, its name and its play-out are the same. It is named `vertex-off` by the placement alone (the bottom edge on O). The generator only serves a level where the reading as placed differs from the true angle by at least 3°, so a child who reads her misplaced protractor correctly does not land on the key by accident.

### Mal-rule `centre-on-arm` (*)
- **Kit belief:** "Puts the protractor's centre mark (or its corner) somewhere other than the vertex: on an arm, or at an arm's end point". Signs: "Puts the centre mark on point A or C, the end of an arm", "Sets the protractor's corner, not its centre mark, at the vertex", "Reads a number tens of degrees off, or finds no reading at all".
- **What the game takes as this placement** (each a placement a guess rarely makes, law 3): the centre mark within 11 units of an arm's end point (A, or B in `measure`) with the base along that arm (±3°); or the protractor's bottom corner within 11 units of O with the base along an arm.
- **What a child holding it does** (shot `measure-centre-on-arm-played-*`): she puts the centre mark on A with the base along OA, locks it, and types what she thinks she reads (150). Part of the protractor then runs past the board's edge: it is her own placement.
- **What the screen then shows:** the brown ring on O and the dashed brown join from O to where her centre is (here along OA, to A): the placement only. Her "150°" chip stays neutral (150 is the true size; round 2 painted it brown and drew an arm from her centre parallel to OB, which told her 150 was right). No arm is drawn from her centre. In `draw` (shot `draw-centre-on-arm-played-*`): the ring and join, her arm from O through the dot she marked on the misplaced protractor, its arc and "∠O 52°".
- **How it is graded.** Never right (an off placement never solves), and her number is not graded (whatever she types, the same decision). Named `centre-on-arm` only on a level that maps it; the ring and the join are shown only where it is named (an unnamed off placement never shows where the centre belongs).

### Mal-rule `wrong-scale`
- **Kit belief:** "Reads the wrong scale on the protractor, e.g. gets 130° for a 50° angle". Signs: "Gives a reading over 90° for an obviously narrow angle", "Always reads the outer scale", "Two readings for the same angle add to 180°".
- **What a child holding it does.** She places the protractor correctly and types the other scale's number: 180 − 150 = **30**. Shots: `measure-wrong-scale-typed-*`, `measure-wrong-scale-played-*`.
- **What the screen then shows:** a dashed brown arm from O at 30° from OA, i.e. the arm her number means on the scale whose 0 is on OA, far from OB; a dashed brown arc between OB and that arm (no number on it); her "30°" chip in brown. The true size is never shown.
- **When the game names it.** When her typed number is within ±2° of 180 minus the true reading, and the angle is not close to 90° (where the two scales would agree). Any other wrong number is an ordinary miss with the same arm drawn and no mix-up named; within 5° it is recorded as a near miss.
- **What a first-try solve says.** Only on a level where the outer scale is the wrong one (as here) does a first-try solve count as evidence that she chose the right scale. On a level where OA points right, the outer scale is the right one, a child who always reads the outer scale solves it, and her solve says nothing about scales (it counts only as a correct placement).

## Goal 2: `draw` (draw an angle of a given size)

**What she sees.** Only the first arm, OA, with the dot O and the letter A. The same loose protractor rests below. The instruction gives the size: "Protractor se OA par ∠AOB = 130° banao". Shot: `draw-initial-*`.

**What she does, in order.**
1. She drags, turns and presses "Rakh do" exactly as in `measure`. The instruction changes to **"Kinare par 130° ka bindu lagao, phir jodo"**. Shots: `draw-placed-*`, `draw-locked-*`.
2. She taps the rim of the protractor to put a blue-violet dot. Tapping the rim again moves it, and **↺ ↻ move the dot 1° along the rim** (1° is under 2 px on a phone, too fine for a finger). The arrows say which way it moves round the rim, not "−1"/"+1", because a number would name one of the two scales. Shot: `draw-dot-*`.
3. She presses "O se jodo" or "A se jodo" to join the dot to O or to A with the ruler. Both are off until a dot is placed. **The two buttons' order changes from level to level** (here "A se jodo" comes first).
4. "Phir se rakho" unfreezes the protractor and clears the dot; "Wapas" undoes her last step. After a miss, a new dot ends the play-out of the old one: nothing is measured until she joins again.

**This level's givens and key** (level `kon-place:draw:130:180m`). OA flat, pointing **left**; **asked angle 130°** (not a printed number at fade 1). She must place the protractor (centre on O, base on OA), put the dot at **130 on the scale whose 0 is on OA** (here the inner scale), and join it to **O**. The game then draws her arm from O through the dot in green, with its letter **B** at its end and a green tick beside it. Shot: `draw-end-*`. Draw accepts the protractor either way round; it reads whichever scale has its 0 on OA.

**After any miss** the screen shows only *her* arm (brown), a brown arc at the corner it starts from, and a brown chip naming the angle it really makes, e.g. "∠O 50°". **The asked arm is never drawn**: there is no line to trace.

### Mal-rule `vertex-off`
- **What a child holding it does.** Bottom edge on OA with O on it (centre 24 units above O); dot at 130 on the scale; joined to O. Shot: `draw-vertex-off-played-*`.
- **What the screen then shows:** the brown ring on O with the dashed line to the protractor's centre; her arm from O through the dot, in brown; a brown arc at O and the chip "∠O 123°", the angle her arm really makes (not 130).

### Mal-rule `wrong-scale`
- **What a child holding it does.** Places the protractor correctly, marks 130 on the *other* (outer) scale, which puts the dot 50° from OA, joins to O. Shot: `draw-wrong-scale-played-*`.
- **What the screen then shows:** her brown arm, a brown arc at O and "∠O 50°".
- As in `measure`, it is told apart only on levels where the outer scale is the wrong one (OA points left, as here).

### Mal-rule `join-wrong-end` (at chance weight)
- **Kit belief:** "Believes the degree mark can be joined to either end of the first arm, so joins it to the far end instead of to the vertex where the protractor's centre was".
- **What a child holding it does.** Places the protractor correctly, puts the dot at the right mark (130), then presses "A se jodo". Shot: `draw-join-wrong-end-played-*`.
- **What the screen then shows:** her brown line from A (the far end of OA) through the dot; a small brown arc at A; a chip "∠A 22°" (the angle that line makes at A).
- **How it is graded.** Not right. It is the `join-wrong-end` signature only when the dot itself was at the right mark. Because the join is one of two buttons, a guess makes it half the time, so one join puts **nothing on her record**: the grade keeps it at chance weight (`chanceMis`), and the play server names it only if she makes it again on a level whose surface differs (the shared law-3 rule). The teacher also sees `sign=join-wrong-end`.

## Goal 3: `size` (which angle is more?)

**What she sees.** Two angles, ∠P above and ∠Q below. Each already has a protractor sitting correctly on it, one small (above in this level) and one big. Each angle's name is under its vertex. **Both protractors print the same numbers** (every 30° at fades 1 and 2, as in the shots; 0, 90 and 180 at fade 3). The instruction reads **"Kaunsa kon zyada hai: ∠P, ∠Q, ya dono barabar?"**. Three buttons: "∠P", "Barabar", "∠Q". Nothing can be moved. Shot: `size-initial-*`.

**What she does.** She presses one of the three buttons.

**The keys.** The generator makes **any of the three** the key, equally often, and either protractor can hold the bigger angle. The two angles differ by 15–40° or are equal; at fades 1 and 2 neither is a printed number.
- Level 1 (`kon-size:105:105:B`): ∠P = ∠Q = 105°; **the key is "Barabar"**. Shot: `size-end-*`: a chip "∠P = ∠Q" between the two figures with the green tick beside it, clear of both names.
- Level 2 (`kon-size:100:135:Bm`): ∠P = 100° (small protractor, opening the other way), ∠Q = 135° (big protractor); **the key is "∠Q"**. Shots: `size-other-*`.

**A wrong pick** shows only *her* pick, in brown: the name she picked becomes a brown chip under its figure, or, for "Barabar", a brown chip "∠P = ∠Q" between the figures. **No reading is shown** while a pick remains (the readings would settle the next pick). Shots: `size-wrong-pick-played-*` (she picks ∠Q on level 1), `size-other-same-played-*` (she picks "Barabar" on level 2).

### No mix-up is named here
The kit's `tool-size` belief ("Thinks a bigger protractor gives a bigger reading for the same angle") is about the *reading* one angle gives under two tools. This goal asks which of two angles is more and never asks for a reading, so it does not claim `tool-size`. A wrong pick is an ordinary miss.

## Things the judges should know

- **Can a child pass by trial?**
  - `measure` and `draw`: not by luck. A protractor that is not placed never solves. A correct reading of a wrong placement is `vertex-off`, never right. Only the exact "bottom edge on O" placement is *named* `vertex-off`; any other off placement is a plain refusal with no mix-up recorded, and its play-out shows nothing of where the centre belongs (no ring, no line to O): in `measure` only her neutral chip, in `draw` her own arm from O and the angle it makes. She can try again; every decision is recorded. Only a *first* decision that is already a solve counts as first-try evidence. A mix-up named at her first decision stays on her record even if she then solves.
  - After a miss the play-out shows where *her* number or arm landed, never the key. A persistent child can still compare her arm with OB (measure) or adjust her dot and join again (draw): that is reading the protractor again, which is the skill.
  - `size`: one pick among three, so a first-try solve enters the learner model at the "chance" weight. She can pick again after a miss and passes within three presses, but not first-try. Any of the three can be the key, so no fixed habit ("the bigger tool", "always Barabar") wins more than a third of the levels.
- **End screens.** A first-try solve ends with a full green tick; a solve after a miss ends with a **pale** tick. The line under the board says what she did and how many checks it took, with no praise: "Tumne 150° likha · jaanch: 1" (measure), "Tumne ∠AOB = 130° banaya · jaanch: 2" (draw), and for size what she found: "∠P aur ∠Q barabar hain · jaanch: 1" or "∠Q zyada hai · jaanch: 2" ("jaanch" lowercase after the dot, as in kon/name). Shots: `*-end-*` (one check), `*-end-after-miss-*` (two checks, pale tick).
- **What the teacher receives.** `placed` (ok or off, at her first decision), `centre_px`, `base_deg`, `read` (measure), `made` and `at` (draw), `pick` (size), the mix-up if named, and `sign=join-wrong-end` where it applies. The teacher is not told the measure reading before she gives it. The game never speaks.
- **Sizes.** The board is a fixed 320 × 340 units scaled into the box. In `measure` and `draw` on a phone the buttons keep a band of three rows from the first screen, so the board has one size in every state: at 360 × 640, 1 unit is 0.84 CSS px and the protractor 177 px wide (first screen, placed, locked, typed, each miss, the end); at 1366 × 768 it is 474 px wide throughout. The turning handle's touch area is 64 px. **The centre tolerance is 11 units** (about 9 CSS px at 360; about 25 px at 1366); the bottom-edge placement sits 24 units off, outside it. The line under the board always keeps room for two lines on a phone, so the board does not move when the line changes.
  - Measure and draw angles are every 5° from 20° to 160°, never within 10° of 0, 90 or 180, and never a printed number at fades 1 and 2. Half open clockwise (OA points left). At fade 1 the first arm lies flat or within 10° of flat; at higher fades it can tilt up to 50° either way.
  - Size angles run 20° to 150°, never within 10° of 90°.
- **Not checked yet:** on a real phone, or with a child. The 11-unit tolerance stands until it is tried on a phone (reversal: more than about 30% placement misses with no belief named).

## Every child-facing string

The lesson is in Hinglish (shown), Hindi or English; the game shows only the lesson's language. The figure's letters (A, B, O, P, Q) and the digits are the same in all three.

| Where | Hinglish | Hindi | English |
|---|---|---|---|
| game name (header) | Kon | कोण | Angles |
| instruction, measure, before "Rakh do" | Protractor se ∠AOB naapo | चाँदे से ∠AOB नापो | Measure ∠AOB with the protractor |
| instruction, measure, after "Rakh do" | Scale padho aur ∠AOB ka number likho | स्केल पढ़ो और ∠AOB की संख्या लिखो | Read the scale and type the size of ∠AOB |
| instruction, draw, before "Rakh do" (size filled in) | Protractor se OA par ∠AOB = 130° banao | चाँदे से OA पर ∠AOB = 130° बनाओ | Draw ∠AOB = 130° on OA with the protractor |
| instruction, draw, after "Rakh do" | Kinare par 130° ka bindu lagao, phir jodo | किनारे पर 130° का बिंदु लगाओ, फिर जोड़ो | Put a dot at 130° on the rim, then join it |
| instruction, size | Kaunsa kon zyada hai: ∠P, ∠Q, ya dono barabar? | कौन-सा कोण ज़्यादा है: ∠P, ∠Q, या दोनों बराबर? | Which angle is more: ∠P, ∠Q, or are they the same? |
| end line, measure | Tumne 150° likha · jaanch: 1 | तुमने 150° लिखा · जाँच: 1 | You wrote 150° · checks: 1 |
| end line, draw | Tumne ∠AOB = 130° banaya · jaanch: 1 | तुमने ∠AOB = 130° बनाया · जाँच: 1 | You drew ∠AOB = 130° · checks: 1 |
| end line, size (key ∠P or ∠Q) | ∠Q zyada hai · jaanch: 1 | ∠Q ज़्यादा है · जाँच: 1 | ∠Q is more · checks: 1 |
| end line, size (key "Barabar") | ∠P aur ∠Q barabar hain · jaanch: 1 | ∠P और ∠Q बराबर हैं · जाँच: 1 | ∠P and ∠Q are the same · checks: 1 |
| spoken label of ← ↑ ↓ → (protractor, before the lock) | Protractor ko baayein / upar / neeche / daayein khiskao | चाँदे को बाएँ / ऊपर / नीचे / दाएँ खिसकाओ | Move the protractor left / up / down / right |
| lock button | Rakh do | रख दो | Place it |
| unlock button | Phir se rakho | फिर से रखो | Move it again |
| commit button, measure | Yahi hai | यही है | That's it |
| number pad, measure | 1 … 9, 0, ⌫ | same | same |
| spoken label of ⌫ | Aakhri ank mitao | आख़िरी अंक मिटाओ | Delete the last digit |
| spoken label of ↺ / ↻ (protractor, before the lock) | Protractor ko ghadi ki ulti disha mein ghumao / … ghadi ki disha mein ghumao | चाँदे को घड़ी की उलटी दिशा में घुमाओ / … घड़ी की दिशा में घुमाओ | Turn the protractor anticlockwise / clockwise |
| spoken label of ↺ / ↻ (the dot, draw) | Bindu ko ghadi ki ulti disha mein khiskao / … ghadi ki disha mein khiskao | बिंदु को घड़ी की उलटी दिशा में खिसकाओ / … घड़ी की दिशा में खिसकाओ | Move the dot anticlockwise / clockwise |
| join buttons, draw (order varies) | O se jodo · A se jodo | O से जोड़ो · A से जोड़ो | Join to O · Join to A |
| size buttons | ∠P · Barabar · ∠Q | ∠P · बराबर · ∠Q | ∠P · Same · ∠Q |
| undo button | Wapas | वापस | Undo |
| chips | 150° (her own number) · ∠O 123° · ∠O 50° · ∠A 22° · ∠P = ∠Q · ∠P · ∠Q | same | same |

"Rakh do" uses "do" as the verb "give/put", not the number two. Every spoken label is in the lesson's language with no number word. The game shows no feedback words: no "right", no "wrong", no hint text. The round "T" at the top is the teacher's avatar from the lesson shell, not part of the game.

## Changes for round 3

Rulings: `docs/design/round8/games-judging/RULINGS-2026-11-11-evening.md`, kon/place 1–6 (the judging of `6746c7d47`). All 56 screens were retaken (360 × 640 at 2× pixel density; 1366 × 768 taken at 2× and scaled to 1×; RGB, no palette reduction). Each ruling is held by a test: `tests/r8-games-kon-layout.test.mjs` (headless on every generated level, and in the browser on every served level and screen at both sizes) or `tests/r8-games-kon-place.test.mjs`.

| Ruling | What changed | Shots that show it | Held by |
|---|---|---|---|
| 1. A right number painted wrong | Her number is graded only on a placed protractor. On an off placement (vertex-off, centre-on-arm, or any other) the play-out shows the placement only: the ring on O and the dashed join to her centre, where the level names the mix-up. Her number's chip stays neutral whatever it is; no arm is drawn from her misplaced centre. The decision itself does not depend on the number (it never did; now it is pinned). In `draw` the miss still shows her own arm from O and the angle it makes (her own line, not a reading). | `measure-centre-on-arm-played` (150, neutral, ring and join only), `measure-vertex-off-played` (161, neutral, ring and join only); compare `measure-wrong-scale-played` (placed: her 30 brown, its arm and arc) | layout (browser): on measure's vertex-off and centre-on-arm screens only OA and OB are drawn, and her chip carries no meaning colour; place test: every generated measure level, three off placements, five typed numbers each: one and the same decision |
| 2. The letter O | O is placed after every line, clear of all of them by 4 px: every line of the protractor (rim, base, strip sides, bottom edge, ticks, centre mark), the arms and her lines, the arcs, the ring, the dots, the chips and the scale numbers. It keeps to the side away from the angle's opening and steps further out before it swings round. In `draw` it was on the wrong side (inside the opening, under the arc and the protractor's centre: missing on `draw-vertex-off-played`); now it is below. Placed, it sits just under the bottom edge; vertex-off, just under O on the edge. | `draw-vertex-off-played`, `measure-placed`, `draw-placed`, `measure-vertex-off-*`, `draw-centre-on-arm-played`, `measure-turned` | layout: headless on every generated level (fades 1–3, four seeds) in the rest, placed, vertex-off and centre-on-arm poses at both sizes, O has a spot clear of every protractor line, within 62 board px of its vertex; browser: O on every measure and draw screen, and no protractor line crosses its ink |
| 3. Numbers left out at 360 | A number is never left out of one scale alone. Where two numbers would come closer than 4 px, a number first slides along its own tick (inner inward up to 22 px, never onto the turning handle; outer outward up to 4 px), the least slide that parts them. Only where no slide does are **both** numbers at that tick left out (never 0, 90, 180). At 360 flat (fade 1): the tick of the outer 80 / inner 100 goes, both numbers. Turned, other numbers slide or other pairs go: in `measure-turned` (12°) the inner 180 slides 17 px in along the base, the inner 140 and 60 a px or two, and the outer 80 / inner 100 pair is left out. At 360 and fade 1 a turned protractor leaves out one or two pairs on most turns (the 20° print step is crowded on a 177 px protractor); at fades 2 and 3 nothing is left out at any turn, and nothing at 1366. Depends only on the screen size, the protractor's turn and the fade's print step, never on the key. | `measure-placed-360`, `measure-turned-360`, every 360 measure/draw shot | layout: headless every whole turn at every print step and both sizes: the ticks left out are the same on both scales, and as drawn every value v has as many 180 − v; browser: the same on every drawn screen |
| 4. Lines through the numbers | The scale numbers are drawn last, after the arms, her arm, her dot and the play-out lines, each on a ground-coloured halo (painter `text(…, { halo })`). OB through the inner 160 and outer 20 no longer hides them. | `measure-vertex-off-*-360`, `measure-placed`, `draw-end`, `size-*` | layout (browser): every scale number is drawn with its halo, and every arm is drawn before the first number (the audit's draw order) |
| 5. Placing with a finger | Four position nudges beside the turn arrows: ← ↑ ↓ → move the protractor by one board px (the law's own move act; no snap, no reading, no cue beyond the protractor moving). On a phone they share the turn arrows' row (six buttons). Spoken labels in the lesson's language. | `measure-initial`, `measure-placed`, `draw-initial`, `draw-placed` | place test: the four buttons, their direction and step, and a nudge moves the pose by exactly one board px; accessible labels in all three languages with no number word |
| 6. Words | "Rim par" → **"Kinare par 130° ka bindu lagao, phir jodo"**. Size's end line says what she found: "∠P aur ∠Q barabar hain · jaanch: 1", "∠Q zyada hai · jaanch: 2" (Hindi and English alike; "jaanch" lowercase after the dot, as kon/name's end lines). | `draw-locked`, `draw-dot`, `size-end`, `size-other-end-after-miss` | place test: the strings |

## Changes after judging round 2

Rulings: `docs/design/round8/games-judging/RULINGS-2026-11-11.md` (kon/place 1–6, and the three laws). Each change is held by a test: the proof suite `tests/r8-games-kon-place.test.mjs` (every generated level) or the layout check `tests/r8-games-kon-layout.test.mjs` (every served level, every screen, 360 × 640 and 1366 × 768).

| Ruling | What changed | Screens |
|---|---|---|
| 1. Measure: she types the number | After "Rakh do" a number pad (0–9, ⌫); no tap prints a value (the band tap is gone); the typed number decides the scale (±2 of the scale whose 0 is on the placed arm is right, ±2 of 180 minus it is `wrong-scale`). | `measure-locked`, `measure-typed`, `*-typed`, `*-played` |
| 2. Draw: only her arm and "∠O x°" after a miss; nudges | The asked arm is never drawn; her arm (brown), its arc and chip only. ↺ ↻ move the dot 1° along the rim (arrows, so no scale is named). | `draw-*-played`, `draw-dot` |
| 3. Size: all three answers offered; no readings on a miss; tick clear of labels; any key; same numbers | New instruction "∠P, ∠Q, ya dono barabar?"; a miss shows only her pick in brown; "Barabar" solved shows "∠P = ∠Q" between the figures with the tick beside it; the generator makes each of the three the key a third of the time (the "bigger tool's angle is never the answer" rule is gone); both protractors print every 30° (fades 1–2). | `size-*` |
| 4. Scale evidence only where the outer scale is wrong; join-wrong-end at chance; button order | `wrong-scale` is discriminated (and listed first, so a first-try solve says "chose the right scale") only on levels where the outer scale is wrong; the two orientations are served equally (was 45/55). `join-wrong-end` is graded at chance weight (`chanceMis`, not on her record from one join; named on a repeat on another level, by the shared law-3 rule). The join buttons' order varies by level. | `draw-join-wrong-end-played` |
| 5. Mix-up colour; B label; instruction after "Rakh do"; checks at the end | Her wrong number or arm is brown, her selection blue-violet, green only when right; the finished arm carries B; the instruction changes after the lock; end lines count checks, and a solve after a miss has a pale tick. | `*-end`, `*-end-after-miss`, `*-locked` |
| 6. Tolerance; vertex-off kit wording | Tolerance unchanged (11 units). Learning split the kit entry: `vertex-off` is the bottom edge only (as the game already played it), and the new `centre-on-arm` (centre on an arm's end, or the corner on O) is named by the law, with the same ring-and-join play-out; the rule maps it with integration 49. | `*-centre-on-arm-played` |
| Law 1 (every family) | The handle and her dot/number are blue-violet (focus), not green; brown for her wrong value. The views name these by role (answer, focus, mix-up): the painter's `LAW_ROLES`, with the new blue-violet focus token. | all |

Also fixed while retaking: the vertex-off protractor's top numbers could be cut at the board's top edge on some mirrored levels (the generator now keeps the numbers' full height on the board), and the letter O stands a little further from the vertex so the vertex-off ring never touches it.

## Changes after the hold

Main held kon/place's judging on 2026-11-11 for three faults. All 54 screens were retaken after the fixes.

1. **Scale numbers ran together.** On the inner scale at 360, "80" and "100" touched ("80100") once the board shrank after "Rakh do". The lettering now works like this (`src/play/families/kon/kon.scale.ts`, one function used by both the view and the layout check):
   - The outer numbers stand where they did.
   - Each inner number now sits just inside the end of its long tick, however wide it is and however the protractor is turned. Before, every inner number stood at one fixed radius.
   - The inner 0 and 180 lie along the base, lifted just clear of the base line, where an arm runs.
   - If two numbers (outer, inner, or one of each) would still come within 4 px of each other at this screen size and turn, the fewest numbers that clear every such pair are left out. Inner numbers go before outer ones, and the ends 0, 90 and 180 always print.
   - (Superseded in round 3, ruling 3: numbers now slide along their ticks, or both numbers at a tick go together.) At 360 × 640 with the protractor flat at fade 1, only the inner 100 was left out. The inner 80 and the outer 100 and 80 still print at those ticks. On a protractor tilted 5–10° (some fade-1 levels), two or three inner numbers drop. At fades 2 and 3 a tilted protractor can drop the inner 150 or 30.
   - Nothing is left out at 1366, or on either size protractor. The two size protractors always print the same numbers.
   - Numbers stay as digits, at the 14 px floor.
   - The letters A, B and O also keep 4 px clear of every number. Before, O stood against the resting protractor's 80 ("80O"); now it takes the nearest clear spot around the vertex.
   - The three laws are untouched: a number left out depends only on the screen size and the protractor's turn, never on the key, and the cert's law check finds 0 breaks.
2. **The check now compares numbers with each other.** `tests/r8-games-kon-layout.test.mjs` checks every scale number's box against every other's (at least 4 px apart; a box is the number's advance width by its figure height):
   - Headless, on every generated level of `measure`, `draw` and `size` (fades 1–3, six seeds). It checks every pose a level serves (resting, placed, vertex-off, centre-on-arm; both size protractors) and every whole turn of the loose protractor. It runs at the world boxes of 360 × 640 and 1366 × 768 with the view's own layout function.
   - In the browser, on the served levels, every screen at both sizes, with the widths the browser measured. These are compared with the headless model (within 0.6 px), and the world box with the headless one.
   - Letters against numbers, the same way.
3. **The protractor changed size while she read.** At 360 the number pad added a third row of buttons after "Rakh do", and the protractor shrank from 213 px to 181 px (`measure`) or 178 px (`draw`). Now `measure` and `draw` keep a band of three button rows from the first screen on a phone (`src/play/play.css`), with the rows at its foot. The board keeps one box in every state: the protractor is 177 × 109 px at 360 and 474 × 291 px at 1366, on the first, placed, locked, typed, miss and end screens. The layout check asserts this for each goal at both sizes. Size (one row of three buttons) was already constant: 176 and 243 px at 360, 352 and 488 px at 1366.

**Centre-on-arm screens.** The check still exempts the protractor's own numbers cut at the board's edge (and the ring over its 0) on the centre-on-arm screens. Her protractor is centred on A, so part of it lies off the canvas at both sizes: it cuts 140, 160 and 180 at 360, and 160 and 180 at 1366. That is her placement, not the layout, and no layout of the scale can bring numbers back from beyond the screen's edge.

## Known issues still open

1. **`centre-on-arm` mapping** goes live with integration 49 (the kit id is on Learning's branch, not yet on the integration branch). The game names it already where a level maps it; the shots show it with that mapping.
2. **The protractor is 177 px wide at 360 × 640** (fixed after the hold: it no longer changes size, but it now has the smaller size in every state, where before only the first screen had about 213 px). The numbers stay at the 14 px floor. Reverse if children cannot read the 5° ticks at that size.
3. `kon/ends` (same family, not in this packet) was fixed to the laws too: its open-end light is green only when solved, the asked figure is no longer drawn after a miss, and `ray-two-ends` is at chance weight.

## Screenshots (56)

`<goal>-<step>-{360x640,1366x768}.png`:
- measure: `initial`, `turned` (round 3: the loose protractor turned 12°), `placed`, `locked`, `typed`, `vertex-off-typed`, `vertex-off-played`, `centre-on-arm-played`, `wrong-scale-typed`, `wrong-scale-played`, `end`, `end-after-miss`
- draw: `initial`, `placed`, `locked`, `dot`, `vertex-off-played`, `centre-on-arm-played`, `wrong-scale-played`, `join-wrong-end-played`, `end`, `end-after-miss`
- size: `initial`, `wrong-pick-played`, `end` (level 1, key "Barabar"); `other-initial`, `other-same-played`, `other-end-after-miss` (level 2, key ∠Q)

Steps: `initial` is the first screen; `placed` the protractor in its right place, not yet locked; `locked` just after "Rakh do"; `typed` / `*-typed` a number typed, before "Yahi hai"; `dot` the dot on the rim; `*-played` just after the decision; `end` solved first try; `end-after-miss` solved at the second check (measure: after typing the other scale's 30; draw: after the wrong-scale arm; size: after a "Barabar" pick).

The 360×640 shots are at 2× pixel density; the 1366×768 shots were taken at 2× and scaled to 1× (colours unchanged). Levels (fade 1, as served): measure `kon-place:measure:150:180m`, draw `kon-place:draw:130:180m`, size `kon-size:105:105:B` and `kon-size:100:135:Bm`.
