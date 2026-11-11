# Judge packet: `kon/place`, placing the protractor (class 6 maths, "Measuring and drawing angles")

This packet is meant to be read on its own: everything a judge needs is in this file and the 36 screenshots beside it. Code commit: `685b755c5` (the merge of kon/place and kon/name on `claude/r7-games`). **Not yet checked on a real phone, or with a child.**

**Topic:** c6-maths-ch02-t03, "Measuring and drawing angles". Class 6, age band 10–12. Three goals: `measure` (skill s2, also s1), `draw` (s3, s2, s1) and `size` (s2).

**What is new.** The older game for this topic drew the protractor already sitting on the angle, so only one of the kit's mix-ups could ever show. Here the protractor lies loose and the child puts it on the angle herself. The game grades the placement, and then grades the number or mark against what the protractor *as she placed it* shows.

**The mix-ups it plays out** (kit ids `c6-maths-ch02-t03-m-*`):
- `vertex-off`
- `wrong-scale`
- `join-wrong-end`
- `tool-size`

Which goal can show which:

| Goal | Mix-ups it can name |
|---|---|
| measure | vertex-off, wrong-scale |
| draw | vertex-off, wrong-scale, join-wrong-end |
| size | tool-size |

## The rule the game enforces (never stated on screen)

A protractor is **placed** when both of these hold:
- its small centre dot is within 8 board-pixels of the vertex O (see Sizes below for what that is on screen);
- its straight base line is within ±3° of an arm. For `measure`, the other arm must also cross the half-disc, i.e. the protractor opens towards it.

Everything after that is graded on what the protractor shows *as placed*:
- The scale to read is the one whose 0 sits on the placed arm.
- A reading counts if it is within ±2° of what that scale shows.
- A drawn dot counts if it is within ±2° of the asked angle on that scale.

**A protractor that is not placed can never solve the level**, whatever number is read off it. The game never snaps the protractor to the vertex or to an arm (a snap would be the placement), shows no live reading of the angle, and has no timer.

## Goal 1: `measure` (read the angle)

**What she sees.** Two black arms from a dot O, with letters A and B at the arm ends and O under the dot. A loose, see-through half-disc protractor rests below the figure, slightly tilted. It has a printed outer scale and a printed inner scale. Numbers are printed every 30° (at the hardest level, fade 3, only 0, 90 and 180); small ticks are every 5°, longer every 10°. A round green handle with two turning arrows sits on the protractor's body. The instruction at the bottom reads "Protractor se ∠AOB naapo". There are two small arrow buttons, "Wapas" and a green "Rakh do". Shots: `measure-initial-*`, `measure-placed-*`.

**What she does, in order.**
1. She drags the protractor by its body to move it.
2. She drags the green handle to turn it about its own centre. Turning goes in 1° steps. The two arrow buttons (↺ ↻) turn it by exactly 1° each press.
3. She presses "Rakh do". The protractor is now frozen and the controls change.
4. She taps the number she reads, on the outer band or the inner band of the scale. A green mark appears on that band and her number appears in a chip at the bottom of the board (e.g. "150°"). "−1" and "+1" adjust it by one. Shot: `measure-read-chosen-*`.
5. She presses "Yahi hai". "Yahi hai" stays disabled until she has tapped a number.
6. Before she commits, "Phir se rakho" unfreezes the protractor and clears her chosen number. "Wapas" is shown only before the lock; after the lock it is not offered.

**This level's givens and key** (as in the shots). OA runs flat to the right. OB goes up and to the left. **The key is 150°.** She must:
- place the protractor with its centre dot on O and its base along OA (turned so the outer scale's 0 is at A);
- then read **150** (within ±2).

Shot: `measure-end-*` (green tick beside B, her "150°" chip). Reading the *same* angle off the inner scale, from the other end, gives 30. That is the wrong-scale mix-up below.

### Mal-rule `vertex-off`
- **Kit belief:** "Lines up the bottom edge of the protractor instead of putting its centre point on the vertex". Signs: "Places the vertex at the corner of the protractor's edge", "Gets readings a few degrees off", "Does not look for the small centre mark".
- **What a child holding it does.** She slides the protractor so its flat bottom edge lies along OA with O on that edge. This leaves the centre dot 20 board-pixels above O. She turns it to flat, locks it, and then reads the number correctly *off the protractor as it sits*: here 160. Shots: `measure-vertex-off-chosen-*`, `measure-vertex-off-played-*`.
- **What the screen then shows when she presses "Yahi hai"** (no words):
  - a brown ring appears on O, with a thin dashed brown line from O to the protractor's centre dot;
  - the arm her reading means is drawn as a dashed brown line **from the protractor's centre dot** through the rim. It starts above the corner and runs beside OB without ever lying on it;
  - her "160°" chip stays on screen.
- **How it is graded.** Not right. It is the named mix-up `vertex-off` because her reading is correct for the protractor as placed, but the placement is off. The generator only serves a level when this reading differs from the true angle by at least 3°.

### Mal-rule `wrong-scale`
- **Kit belief:** "Reads the wrong scale on the protractor, e.g. gets 130° for a 50° angle". Signs: "Gives a reading over 90° for an obviously narrow angle", "Always reads the outer scale", "Two readings for the same angle add to 180°".
- **What a child holding it does.** She places the protractor correctly, but reads the other scale's number: 180 − 150 = **30**. Shots: `measure-wrong-scale-chosen-*`, `measure-wrong-scale-played-*`.
- **What the screen then shows:**
  - a dashed brown arm from O at 30°, i.e. the arm her number actually means on the scale whose 0 is on OA, pointing far from OB;
  - a dashed brown arc between OB and that arm;
  - her "30°" chip.
- **When the game names it.** Only when her number is within ±2° of 180 minus the true reading, and the angle is not close to 90° (where the two scales would agree). Any other wrong number is an ordinary miss with the same arm drawn but no named mix-up. A near miss (within 5°) is recorded as such.

## Goal 2: `draw` (draw an angle of a given size)

**What she sees.** Only the first arm, OA, with the dot O and the letter A. The same loose protractor rests below. The instruction gives the size: "Protractor se OA par ∠AOB = 145° banao". Shot: `draw-initial-*`.

**What she does, in order.**
1. She drags, turns and presses "Rakh do" exactly as in `measure`. Shot: `draw-placed-*`.
2. She taps the rim of the protractor to put a green dot where the asked angle is on the scale. Tapping the rim again moves the dot. Shot: `draw-dot-*`.
3. She presses "O se jodo" or "A se jodo" to join the dot to O or to A with the ruler. Both buttons are disabled until a dot is placed.
4. "Phir se rakho" unfreezes the protractor and clears the dot. "Wapas" undoes her last step.

**This level's givens and key** (as in the shots). OA flat, O at the left, **asked angle 145°**. She must:
- place the protractor (centre on O, base on OA);
- put the dot at **145 on the scale whose 0 is at A** (within ±2°);
- join it to **O**.

The game then draws the arm from O through the dot. Shot: `draw-end-*` (green arm, green tick beside its end). Draw accepts the protractor either way round: turned so 0 is at A, or flipped. It reads whichever scale has its 0 on OA.

### Mal-rule `vertex-off`
- **Kit belief:** the same as in `measure` (the bottom edge lined up instead of the centre dot).
- **What a child holding it does.** She puts the bottom edge on OA with O on it, so the centre is 20 board-pixels above O. She marks 145 on the scale and joins the dot to O. Shot: `draw-vertex-off-played-*`.
- **What the screen then shows:**
  - a brown ring on O, with a dashed line from O to the protractor's centre;
  - her green arm, from O to the dot;
  - a brown arc at O with a chip "∠O 137°", the angle her arm really makes (not 145);
  - the asked 145° as a dashed dark arm from O, so the gap is visible.

### Mal-rule `wrong-scale`
- **What a child holding it does.** She places the protractor correctly, then marks 145 on the *other* scale. That puts the dot at 35° from A. She joins it to O. Shot: `draw-wrong-scale-played-*`.
- **What the screen then shows:**
  - her green arm from O, close to OA, with a brown arc and a chip "∠O 35°";
  - the dashed dark arm at the asked 145° on the opposite side, far from hers.

### Mal-rule `join-wrong-end`
- **Kit belief:** "Believes the degree mark can be joined to either end of the first arm, so joins it to the far end instead of to the vertex where the protractor's centre was". Signs: "Joins the dot to the far end of the first line, making a triangle-like shape", "Cannot point to which point is the vertex of the angle just drawn", "Measures the drawn angle afterwards and gets a different number".
- **What a child holding it does.** She places the protractor correctly, puts the dot at the right mark (145), then presses "A se jodo". Shot: `draw-join-wrong-end-played-*`.
- **What the screen then shows:**
  - her green line runs from A (the far end of OA) through the dot, nowhere near O;
  - a small brown arc at A, and a chip "∠A 16°" (the angle that line makes at A);
  - the dashed dark arm at the asked 145° from O.
- **How it is graded.** Joining to A is never right, even with a perfect dot. It is named `join-wrong-end` only when the dot itself is at the right mark. A wrong dot joined to A is an ordinary miss.

## Goal 3: `size` (which angle is more?)

**What she sees.** Two angles, ∠P above and ∠Q below. Each already has a protractor sitting correctly on it, one small (above in this level) and one big. Each angle is named under its vertex. The instruction reads "Kaunsa kon zyada hai: ∠P ya ∠Q?". There are three buttons: "∠P", "Barabar" and "∠Q". Nothing can be moved. There are no numbers other than the printed scales, so she compares the two angles using the protractors. Shot: `size-initial-*`.

**What she does.** She presses one of the three buttons. That is the whole decision.

**This level's givens and key** (as in the shots). ∠P and ∠Q are both **105°** (the small protractor is under P, the big one under Q). **The key is "Barabar"** (same).
- The generator serves equal-angle levels half the time.
- In the other half the two angles differ by 15–40°, and the angle under the *bigger* protractor is always the *smaller* angle. So the bigger tool's angle is never the answer.

Shot: `size-end-*`.

### Mal-rule `tool-size`
- **Kit belief:** "Thinks a bigger protractor gives a bigger reading for the same angle". Signs: "Expects the blackboard protractor to give a larger number", "Links degrees to the length of the arms or the tool".
- **What a child holding it does.** She presses the angle under the bigger protractor (∠Q here), taking the bigger tool to mean the bigger angle. Shot: `size-tool-size-played-*`.
- **What the screen then shows:** two chips side by side between the figures, "∠P 105°" and "∠Q 105°", which makes the two readings equal. There is nothing else.
- **How it is graded.** Named `tool-size` only when she presses the bigger tool's angle. Pressing the other angle when the answer is "Barabar" is an ordinary miss.

## Things the judges should know

- **Can a child pass by trial?**
  - `measure` and `draw`: not by luck.
    - A protractor that is not placed never solves, whatever she reads or marks off it.
    - A correct reading of a wrong placement is graded `vertex-off` (shown above). It is never right, and never an ordinary pass.
    - Only the exact "bottom edge on O" placement is *named* `vertex-off`. Any other off placement (centre 10 px away in another direction, protractor upside down) is a plain refusal with no mix-up recorded.
    - She can try again. After a miss she can press "Yahi hai" again, or "O se jodo"/"A se jodo", with a changed number. After a bad placement she presses "Phir se rakho" and moves it again. Every decision after the first is recorded, along with her misses, and the final verdict can be "solved" after a miss. Only a *first* decision that is already a solve counts as first-try evidence for the learner model. A mix-up named at her first decision stays on her record even if she then fixes it and solves. The record also keeps the placement (centre offset in px, base error in degrees) at her first decision.
    - **Honest limit:** the play-out after a miss shows her where her number or arm actually landed, so a persistent child can home in on the answer. The ring-and-dashed-line from O to the protractor's centre appears after *any* off placement, which tells her the centre belongs on O (see Known issues).
  - `size`: yes, in the end. It is one pick among three, so a first pick enters the learner model at the "chance" weight, not the full in-game weight (0.5). She can pick again after a miss, so within at most three presses she passes, but not first-try.
- **What the teacher receives.** `placed` (ok or off, at her first decision), `centre_px`, `base_deg`, `read` (measure), `made` and `at` (draw), `pick` (size), and the mix-up if named. The teacher is not told the measure reading before she gives it. The game never speaks.
- **Sizes.** The board is a fixed 320 × 340 units; the view scales it into the box. At 360 px, 1 unit is about 1 CSS px (the shots at 360 wide are at 2× pixel density). The protractor is 216 px wide there and the turning handle's touch area is 64 px. The centre tolerance of 8 units is therefore about 8 CSS px on a phone, and about 18 px on the 1366 screen, where the board is larger. The bottom-edge placement sits 20 units off, so the two are 12 units apart.
  - Measure and draw angles are every 5° from 20° to 160°, never within 10° of 0, 90 or 180. About 45% open clockwise (OA then points left). At fade 1 the first arm lies flat or within 10° of flat; at higher fades it can tilt up to 50° either way, so she has to turn the protractor.
  - Size angles run 20° to 150°, never within 10° of 90°.
- **Not checked yet:** on a real phone, or with a child.

## Every child-facing string

The lesson is in Hinglish (shown), Hindi or English; the game shows only the lesson's language. The figure's letters (A, B, O, P, Q) and the scale's digits are the same in all three.

| Where | Hinglish | Hindi | English |
|---|---|---|---|
| game name (header, shown capitalised) | Kon | कोण | Angles |
| instruction, measure | Protractor se ∠AOB naapo | चाँदे से ∠AOB नापो | Measure ∠AOB with the protractor |
| instruction, draw (the size is filled in, e.g. 145°) | Protractor se OA par ∠AOB = 145° banao | चाँदे से OA पर ∠AOB = 145° बनाओ | Draw ∠AOB = 145° on OA with the protractor |
| instruction, size | Kaunsa kon zyada hai: ∠P ya ∠Q? | कौन-सा कोण ज़्यादा है: ∠P या ∠Q? | Which angle is more: ∠P or ∠Q? |
| lock button | Rakh do | रख दो | Place it |
| unlock button (after locking) | Phir se rakho | फिर से रखो | Move it again |
| commit button, measure | Yahi hai | यही है | That's it |
| join buttons, draw | O se jodo · A se jodo | O से जोड़ो · A से जोड़ो | Join to O · Join to A |
| size buttons | ∠P · Barabar · ∠Q | ∠P · बराबर · ∠Q | ∠P · Same · ∠Q |
| undo button | Wapas | वापस | Undo |
| turn buttons | ↺ ↻ (symbols, no words) | same | same |
| reading adjust buttons | −1 · +1 | same | same |
| chip after a reading | 150° (her own number) | same | same |
| chips in the play-out | ∠O 137° · ∠A 16° · ∠P 105° · ∠Q 105° | same | same |
| scale numbers | 0–180 printed on the protractor | same | same |
| the lesson's one-line verb for this game (teacher side, not on the game screen) | protractor rakho aur kon naapo | (no separate Hindi line; the lesson says it in its own language) | place the protractor and measure the angle |

"Rakh do" and "Mita do" use "do" as the verb "give/put", not the number two. Numbers are always digits. The game shows no feedback words: no "right", no "wrong", no hint text. Feedback is only ticks, rings, dashed lines, arcs and the chips above. The round "T" at the top is the teacher's avatar from the lesson shell, not part of the game.

## Known issues found while writing this packet

Judges should look at these:

1. **Off-placement hint.** After any decision made with the protractor off the vertex, the screen draws the ring on O and the dashed line to the protractor's centre, not only for the named `vertex-off`. That shows a child where the centre belongs. It makes trial-and-correction easier than the "never solves" rule alone suggests.
2. **Size tick position.** In `size-end-*` the green tick sits to the right of ∠Q, but the key in this level is "Barabar". The tick is at a fixed spot on the board, not tied to the answer. A judge may read it as "Q was right".
3. **Measure tick over a letter.** In `measure-end-360x640.png` the green tick sits on top of the letter B.
4. **Printed number is the key.** In this measure level the key (150) is a printed numeral, partly covered by arm OB. A child can read the key straight off a printed number without reading ticks. This holds for any angle that is a multiple of 30 at fades 1 and 2.
5. **English accessibility labels.** The turn and adjust buttons carry English-only spoken labels ("turn the protractor anticlockwise by 1°", "one less", "one more") even in a Hinglish or Hindi lesson. They do not appear on screen, but a screen reader would say them, and "one" is a number word.
6. **`vertex-off` wording vs play-out.** The kit's sign says the vertex goes at "the corner of the protractor's edge". The game puts O at the *middle* of the bottom edge. A bottom-corner placement is not named.
7. **`tool-size` question differs from the kit.** The kit's diagnostic asks what happens to the *reading* when the same angle is measured with a bigger protractor. The game asks which of two angles is more, never for a reading. The mix-up shown is related (bigger tool, bigger angle) but not identical. In equal-angle levels the shots match the kit's example exactly.
8. **Overlap in the `size` play-out at 360.** The two chips sit over the end of ∠Q's upper arm, just under the "∠P" label.
9. **`measure` after locking has no "Wapas".** `draw` keeps one; only "Phir se rakho" exists after the lock in `measure`.
10. **Tolerance vs phone.** The 8-unit centre tolerance is untested with a finger on a real 360 px screen (the design note's reversal condition: more than about 30% placement misses with no belief named).
11. **Scale labelling by fade.** The printed numbers change only at fade 3 (0, 90, 180). The "10" and "30" scale settings look identical on screen.

## Screenshots (36)

`{measure,draw,size}-<step>-{360x640,1366x768}.png`:
- measure: `initial`, `placed`, `read-chosen`, `vertex-off-chosen`, `vertex-off-played`, `wrong-scale-chosen`, `wrong-scale-played`, `end`
- draw: `initial`, `placed`, `dot`, `vertex-off-played`, `wrong-scale-played`, `join-wrong-end-played`, `end`
- size: `initial`, `tool-size-played`, `end`

Steps:
- `initial` is the first screen;
- `placed` is the protractor in its right place, not yet locked;
- `read-chosen` and `*-chosen` are a number chosen on the scale, before "Yahi hai";
- `dot` is the dot put on the rim;
- `*-played` is what the screen shows just after the decision;
- `end` is solved.

The 360×640 shots are at 2× pixel density. The 1366×768 shots were scaled to 1× for size; colours are unchanged.
