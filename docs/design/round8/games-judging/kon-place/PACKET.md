# Judge packet: `kon/place`, placing the protractor (class 6 maths, "Measuring and drawing angles")

This packet is meant to be read on its own: everything a judge needs is in this file and the 36 screenshots beside it. Code: branch `claude/r8-kon-fixes` (the fix round after the first packet, which was taken at `685b755c5`); every screenshot was retaken on it. **Not yet checked on a real phone, or with a child.**

**Topic:** c6-maths-ch02-t03, "Measuring and drawing angles". Class 6, age band 10–12. Three goals: `measure` (skill s2, also s1), `draw` (s3, s2, s1) and `size` (s2).

**What is new.** The older game for this topic drew the protractor already sitting on the angle, so only one of the kit's mix-ups could ever show. Here the protractor lies loose and the child puts it on the angle herself. The game grades the placement, and then grades the number or mark against what the protractor *as she placed it* shows.

**The mix-ups it plays out** (kit ids `c6-maths-ch02-t03-m-*`):
- `vertex-off`
- `wrong-scale`
- `join-wrong-end`

Which goal can show which:

| Goal | Mix-ups it can name |
|---|---|
| measure | vertex-off, wrong-scale |
| draw | vertex-off, wrong-scale, join-wrong-end |
| size | none (see Goal 3: the kit's `tool-size` is no longer claimed) |

## The rule the game enforces (never stated on screen)

A protractor is **placed** when both of these hold:
- its small centre dot is within 11 board-pixels of the vertex O: about **11 CSS px at a 360 px phone** and about 25 px on the 1366 screen (see Sizes below);
- its straight base line is within ±3° of an arm. For `measure`, the other arm must also cross the half-disc, i.e. the protractor opens towards it.

Everything after that is graded on what the protractor shows *as placed*:
- The scale to read is the one whose 0 sits on the placed arm.
- A reading counts if it is within ±2° of what that scale shows.
- A drawn dot counts if it is within ±2° of the asked angle on that scale.

**A protractor that is not placed can never solve the level**, whatever number is read off it. The game never snaps the protractor to the vertex or to an arm (a snap would be the placement), shows no live reading of the angle, and has no timer.

## Goal 1: `measure` (read the angle)

**What she sees.** Two black arms from a dot O, with letters A and B at the arm ends and O under the dot. A loose, see-through half-disc protractor rests below the figure, slightly tilted. It has a printed outer scale and a printed inner scale. Numbers are printed every 20° at fade 1 (as in the shots), every 30° at fade 2, and only 0, 90 and 180 at fade 3; small ticks are every 5°, longer every 10°. A round green handle with two turning arrows sits on the protractor's body. The instruction at the bottom reads "Protractor se ∠AOB naapo". There are two small arrow buttons, "Wapas" and a green "Rakh do". Shots: `measure-initial-*`, `measure-placed-*`.

**What she does, in order.**
1. She drags the protractor by its body to move it.
2. She drags the green handle to turn it about its own centre. Turning goes in 1° steps. The two arrow buttons (↺ ↻) turn it by exactly 1° each press.
3. She presses "Rakh do". The protractor is now frozen and the controls change.
4. She taps the number she reads, on the outer band or the inner band of the scale. A green mark appears on that band and her number appears in a chip at the bottom of the board (e.g. "125°"). "−1" and "+1" adjust it by one. Shot: `measure-read-chosen-*`.
5. She presses "Yahi hai". "Yahi hai" stays disabled until she has tapped a number.
6. After the lock she has two ways back: "Wapas" takes back one step (the lock itself, or, after a miss, her last "Yahi hai"), and "Phir se rakho" unfreezes the protractor and clears her chosen number.

**This level's givens and key** (as in the shots). OA runs flat to the right. OB goes up and to the left. **The key is 125°**, which is not a printed number (fade 1 prints every 20°): she has to count ticks past 120. She must:
- place the protractor with its centre dot on O and its base along OA (turned so the outer scale's 0 is at A);
- then read **125** (within ±2).

Shot: `measure-end-*` (her "125°" chip with the green tick beside it). Reading the *same* angle off the inner scale, from the other end, gives 55. That is the wrong-scale mix-up below.

### Mal-rule `vertex-off`
- **Kit belief:** "Lines up the bottom edge of the protractor instead of putting its centre point on the vertex". Signs: "Places the vertex at the corner of the protractor's edge", "Gets readings a few degrees off", "Does not look for the small centre mark".
- **What a child holding it does.** She slides the protractor so its flat bottom edge lies along OA with O on that edge (O at the middle of the edge). This leaves the centre dot 24 board-pixels above O. She turns it to flat, locks it, and then reads the number correctly *off the protractor as it sits*: here 133. Shots: `measure-vertex-off-chosen-*`, `measure-vertex-off-played-*`.
- **What the screen then shows when she presses "Yahi hai"** (no words):
  - a brown ring appears on O, with a thin dashed brown line from O to the protractor's centre dot;
  - the arm her reading means is drawn as a dashed brown line **from the protractor's centre dot** through the rim. It starts above the corner and runs beside OB without ever lying on it;
  - her "133°" chip stays on screen.
  - The ring and the dashed join appear only here: in the play-out of a committed decision whose placement is the bottom edge on O. They never appear before her first "Yahi hai", and never for any other off placement (see Things the judges should know).
- **How it is graded.** Not right. It is the named mix-up `vertex-off` because her reading is correct for the protractor as placed, but the placement is off. The generator only serves a level when this reading differs from the true angle by at least 3°.

### Mal-rule `wrong-scale`
- **Kit belief:** "Reads the wrong scale on the protractor, e.g. gets 130° for a 50° angle". Signs: "Gives a reading over 90° for an obviously narrow angle", "Always reads the outer scale", "Two readings for the same angle add to 180°".
- **What a child holding it does.** She places the protractor correctly, but reads the other scale's number: 180 − 125 = **55**. Shots: `measure-wrong-scale-chosen-*`, `measure-wrong-scale-played-*`.
- **What the screen then shows:**
  - a dashed brown arm from O at 55°, i.e. the arm her number actually means on the scale whose 0 is on OA, pointing far from OB;
  - a dashed brown arc between OB and that arm;
  - her "55°" chip.
- **When the game names it.** Only when her number is within ±2° of 180 minus the true reading, and the angle is not close to 90° (where the two scales would agree). Any other wrong number is an ordinary miss with the same arm drawn but no named mix-up. A near miss (within 5°) is recorded as such.

## Goal 2: `draw` (draw an angle of a given size)

**What she sees.** Only the first arm, OA, with the dot O and the letter A. The same loose protractor rests below. The instruction gives the size: "Protractor se OA par ∠AOB = 125° banao". Shot: `draw-initial-*`.

**What she does, in order.**
1. She drags, turns and presses "Rakh do" exactly as in `measure`. Shot: `draw-placed-*`.
2. She taps the rim of the protractor to put a green dot where the asked angle is on the scale. Tapping the rim again moves the dot. Shot: `draw-dot-*`.
3. She presses "O se jodo" or "A se jodo" to join the dot to O or to A with the ruler. Both buttons are disabled until a dot is placed.
4. "Phir se rakho" unfreezes the protractor and clears the dot. "Wapas" undoes her last step. After a miss, a new dot ends the play-out of the old one: nothing is measured again until she joins.

**This level's givens and key** (as in the shots). OA flat, O in the middle, **asked angle 125°** (not a printed number at fade 1). She must:
- place the protractor (centre on O, base on OA);
- put the dot at **125 on the scale whose 0 is at A** (within ±2°);
- join it to **O**.

The game then draws the arm from O through the dot. Shot: `draw-end-*` (green arm, green tick beside its end). Draw accepts the protractor either way round: turned so 0 is at A, or flipped. It reads whichever scale has its 0 on OA.

### Mal-rule `vertex-off`
- **Kit belief:** the same as in `measure` (the bottom edge lined up instead of the centre dot).
- **What a child holding it does.** She puts the bottom edge on OA with O on it, so the centre is 24 board-pixels above O. She marks 125 on the scale and joins the dot to O. Shot: `draw-vertex-off-played-*`.
- **What the screen then shows:**
  - a brown ring on O, with a dashed line from O to the protractor's centre;
  - her green arm, from O to the dot;
  - a brown arc at O with a chip "∠O 119°", the angle her arm really makes (not 125);
  - the asked 125° as a dashed dark arm from O, so the gap is visible.

### Mal-rule `wrong-scale`
- **What a child holding it does.** She places the protractor correctly, then marks 125 on the *other* scale. That puts the dot at 55° from A. She joins it to O. Shot: `draw-wrong-scale-played-*`.
- **What the screen then shows:**
  - her green arm from O, with a brown arc and a chip "∠O 55°";
  - the dashed dark arm at the asked 125° on the other side of the vertical, far from hers.

### Mal-rule `join-wrong-end`
- **Kit belief:** "Believes the degree mark can be joined to either end of the first arm, so joins it to the far end instead of to the vertex where the protractor's centre was". Signs: "Joins the dot to the far end of the first line, making a triangle-like shape", "Cannot point to which point is the vertex of the angle just drawn", "Measures the drawn angle afterwards and gets a different number".
- **What a child holding it does.** She places the protractor correctly, puts the dot at the right mark (125), then presses "A se jodo". Shot: `draw-join-wrong-end-played-*`.
- **What the screen then shows:**
  - her green line runs from A (the far end of OA) through the dot, nowhere near O;
  - a small brown arc at A, and a chip "∠A 24°" (the angle that line makes at A);
  - the dashed dark arm at the asked 125° from O.
- **How it is graded.** Joining to A is never right, even with a perfect dot. It is named `join-wrong-end` only when the dot itself is at the right mark. A wrong dot joined to A is an ordinary miss.

## Goal 3: `size` (which angle is more?)

**What she sees.** Two angles, ∠P above and ∠Q below. Each already has a protractor sitting correctly on it, one small (above in this level) and one big. Each angle is named under its vertex. The instruction reads "Kaunsa kon zyada hai: ∠P ya ∠Q?". There are three buttons: "∠P", "Barabar" and "∠Q". Nothing can be moved. There are no numbers other than the printed scales, so she compares the two angles using the protractors. Shot: `size-initial-*`.

**What she does.** She presses one of the three buttons. That is the whole decision.

**This level's givens and key** (as in the shots). ∠P and ∠Q are both **115°** (the small protractor is under P, the big one under Q). **The key is "Barabar"** (same).
- The generator serves equal-angle levels half the time.
- In the other half the two angles differ by 15–40°, and the angle under the *bigger* protractor is always the *smaller* angle. So the bigger tool's angle is never the answer.
- At fades 1 and 2 neither angle is a printed number.

Shot: `size-end-*`: for "Barabar" the green tick sits between the two figures, tied to neither angle; for a ∠P or ∠Q answer it sits beside that angle's name.

### No mix-up is named here (main's ruling, 2026-11-11)
The kit's `tool-size` belief ("Thinks a bigger protractor gives a bigger reading for the same angle") is about the *reading* one angle gives under two tools; its diagnostic asks what happens to the reading. This goal asks which of two angles is more and never asks for a reading, so it no longer claims `tool-size`: the belief is out of the rule's mal map and out of the law. Following the kit (she gives both readings of one angle) would need a reading act in `size`; that was the bigger change, so the honest small option was taken.
- **A wrong pick** (shot `size-tool-size-played-*`, the file name kept from the first packet: she presses ∠Q, the angle under the bigger protractor) is an ordinary miss. Each angle's name turns into its reading, under its own figure: "∠P 115°" and "∠Q 115°". No belief is recorded.

## Things the judges should know

- **Can a child pass by trial?**
  - `measure` and `draw`: not by luck.
    - A protractor that is not placed never solves, whatever she reads or marks off it.
    - A correct reading of a wrong placement is graded `vertex-off` (shown above). It is never right, and never an ordinary pass.
    - Only the exact "bottom edge on O" placement is *named* `vertex-off`. Any other off placement (centre 16 px away in another direction, protractor upside down) is a plain refusal with no mix-up recorded. Its play-out shows only what her number means on the protractor as it sits (measure: the arm her number means, drawn from the protractor's own centre; draw: her arm, the angle it makes and the asked arm), with no ring and no line to O.
    - She can try again. After a miss she can press "Yahi hai" again, or "O se jodo"/"A se jodo", with a changed number. After a bad placement she presses "Phir se rakho" and moves it again. Every decision after the first is recorded, along with her misses, and the final verdict can be "solved" after a miss. Only a *first* decision that is already a solve counts as first-try evidence for the learner model. A mix-up named at her first decision stays on her record even if she then fixes it and solves. The record also keeps the placement (centre offset in px, base error in degrees) at her first decision.
    - **Honest limit:** the play-out after a miss shows her where her number or arm actually landed, so a persistent child can home in on the answer. The ring-and-dashed-line from O to the protractor's centre is the `vertex-off` signature only: it is drawn after she commits a bottom-edge placement, never before her first commit and never for another off placement.
    - At fades 1 and 2 no key is a printed number, so it cannot be read off a numeral without the ticks.
  - `size`: yes, in the end. It is one pick among three, so a first pick enters the learner model at the "chance" weight, not the full in-game weight (0.5). She can pick again after a miss, so within at most three presses she passes, but not first-try.
- **What the teacher receives.** `placed` (ok or off, at her first decision), `centre_px`, `base_deg`, `read` (measure), `made` and `at` (draw), `pick` (size), and the mix-up if named. The teacher is not told the measure reading before she gives it. The game never speaks.
- **Sizes.** The board is a fixed 320 × 340 units; the view scales it into the box. At 360 px the play box is 360 × 349, so 1 unit is about 1.03 CSS px (the shots at 360 wide are at 2× pixel density). The protractor is about 216 px wide there and the turning handle's touch area is 64 px. **The centre tolerance is 11 units: about 11 CSS px from O on a 360 px phone**, about 25 px on the 1366 screen. It was 8; it is set for a finger's drop, and she drags the protractor by its body, so her finger is not over the centre dot. The bottom-edge placement sits 24 units off (the strip under the base was deepened from 20 so the two zones stay apart: 11 + 11 < 24).
  - Measure and draw angles are every 5° from 20° to 160°, never within 10° of 0, 90 or 180, and never a printed number at fades 1 and 2 (no multiple of 20 at fade 1, of 30 at fade 2). About 45% open clockwise (OA then points left). At fade 1 the first arm lies flat or within 10° of flat; at higher fades it can tilt up to 50° either way, so she has to turn the protractor.
  - Size angles run 20° to 150°, never within 10° of 90°, and never a printed number at fades 1 and 2.
- **Not checked yet:** on a real phone, or with a child.

## Every child-facing string

The lesson is in Hinglish (shown), Hindi or English; the game shows only the lesson's language. The figure's letters (A, B, O, P, Q) and the scale's digits are the same in all three.

| Where | Hinglish | Hindi | English |
|---|---|---|---|
| game name (header, shown capitalised) | Kon | कोण | Angles |
| instruction, measure | Protractor se ∠AOB naapo | चाँदे से ∠AOB नापो | Measure ∠AOB with the protractor |
| instruction, draw (the size is filled in, e.g. 125°) | Protractor se OA par ∠AOB = 125° banao | चाँदे से OA पर ∠AOB = 125° बनाओ | Draw ∠AOB = 125° on OA with the protractor |
| instruction, size | Kaunsa kon zyada hai: ∠P ya ∠Q? | कौन-सा कोण ज़्यादा है: ∠P या ∠Q? | Which angle is more: ∠P or ∠Q? |
| lock button | Rakh do | रख दो | Place it |
| unlock button (after locking) | Phir se rakho | फिर से रखो | Move it again |
| commit button, measure | Yahi hai | यही है | That's it |
| spoken label (screen reader) of ↺ | Protractor ko ghadi ki ulti disha mein ghumao | चाँदे को घड़ी की उलटी दिशा में घुमाओ | Turn the protractor anticlockwise |
| spoken label of ↻ | Protractor ko ghadi ki disha mein ghumao | चाँदे को घड़ी की दिशा में घुमाओ | Turn the protractor clockwise |
| spoken label of −1 | Reading ghatao | रीडिंग घटाओ | Lower the reading |
| spoken label of +1 | Reading badhao | रीडिंग बढ़ाओ | Raise the reading |
| join buttons, draw | O se jodo · A se jodo | O से जोड़ो · A से जोड़ो | Join to O · Join to A |
| size buttons | ∠P · Barabar · ∠Q | ∠P · बराबर · ∠Q | ∠P · Same · ∠Q |
| undo button (before and after the lock) | Wapas | वापस | Undo |
| turn buttons | ↺ ↻ (symbols; spoken labels above) | same | same |
| reading adjust buttons | −1 · +1 | same | same |
| chip after a reading | 125° (her own number) | same | same |
| chips in the play-out | ∠O 119° · ∠O 55° · ∠A 24° · ∠P 115° · ∠Q 115° | same | same |
| scale numbers | 0–180 printed on the protractor | same | same |
| the lesson's one-line verb for this game (teacher side, not on the game screen) | protractor rakho aur kon naapo | (no separate Hindi line; the lesson says it in its own language) | place the protractor and measure the angle |

"Rakh do" uses "do" as the verb "give/put", not the number two. Every spoken label is in the lesson's language too, with no number word. Numbers are always digits. The game shows no feedback words: no "right", no "wrong", no hint text. Feedback is only ticks, rings, dashed lines, arcs and the chips above. The round "T" at the top is the teacher's avatar from the lesson shell, not part of the game.

## Fixed since the first packet

Each fix has a test that fails on the first packet's code (`tests/r8-games-kon-layout.test.mjs` on every served level at both sizes, or the proof suite `tests/r8-games-kon-place.test.mjs`).

1. **Off-placement hint** (was issue 1). The ring on O and the dashed join to the centre now appear only in the play-out of a committed bottom-edge placement (`vertex-off`). Never before her first commit; never for any other off placement, which shows only what her number or arm means as placed. A new dot after a miss also ends the old play-out.
2. **Size tick position** (was 2). The tick sits with her answer: beside ∠P's or ∠Q's name, or, for "Barabar", between the two figures, clear of every arm.
3. **Measure tick over a letter** (was 3). The tick sits beside her reading's chip, away from the figure; no tick or ring may overlap any letter or label (layout check).
4. **Printed number is the key** (was 4, main's ruling). At fades 1 and 2 no key and no size angle is a printed number (proof-suite assertion over every generated level).
5. **English accessibility labels** (was 5). All four spoken labels come from the lesson's words in all three languages, with no number word.
6. **`tool-size` question differs from the kit** (was 7, main's ruling). `size` no longer claims `tool-size` (Goal 3).
7. **Overlap in the `size` play-out** (was 8). Each reading replaces its angle's name under its own figure; no chip may cross an arm (layout check).
8. **`measure` after locking has no "Wapas"** (was 9). "Wapas" is offered after the lock too (one step back: the lock, or her last "Yahi hai").
9. **Tolerance for a finger** (was 10, main's ruling). 11 units, about 11 CSS px from O at 360 (was 8); the bottom-edge placement moved to 24 units off so it stays outside. Still untested with a real finger: the reversal condition stands (more than about 30% placement misses with no belief named).
10. **Scale labelling by fade** (was 11, main's ruling). Fade 1 prints every 20°, fade 2 every 30°, fade 3 only 0, 90 and 180.
11. **The board stays still at the end.** On solving, the buttons stay (all off) instead of disappearing, so the board does not grow and move (layout check: the board's box is the same before and after solving).

## Known issues still open

1. **`vertex-off` wording vs play-out** (was 6; kept, for main and Learning). The kit's first sign says the vertex goes at "the corner of the protractor's edge". The game puts O at the *middle* of the bottom edge, which matches the kit's belief ("lines up the bottom edge instead of putting its centre point on the vertex") and its second sign ("readings a few degrees off"). A bottom-corner placement is not named: it gives readings tens of degrees off, or none. The game was not changed; the kit text was sent to main as a question for Learning.

## Screenshots (36)

`{measure,draw,size}-<step>-{360x640,1366x768}.png`:
- measure: `initial`, `placed`, `read-chosen`, `vertex-off-chosen`, `vertex-off-played`, `wrong-scale-chosen`, `wrong-scale-played`, `end`
- draw: `initial`, `placed`, `dot`, `vertex-off-played`, `wrong-scale-played`, `join-wrong-end-played`, `end`
- size: `initial`, `tool-size-played` (a wrong pick: the bigger tool's angle; no belief named now), `end`

Steps:
- `initial` is the first screen;
- `placed` is the protractor in its right place, not yet locked;
- `read-chosen` and `*-chosen` are a number chosen on the scale, before "Yahi hai";
- `dot` is the dot put on the rim;
- `*-played` is what the screen shows just after the decision;
- `end` is solved.

The 360×640 shots are at 2× pixel density. The 1366×768 shots were taken at 2× and scaled to 1× for size; colours are unchanged. Levels: measure `kon-place:measure:125:0`, draw `kon-place:draw:125:0`, size `kon-size:115:115:B` (fade 1, as served).
