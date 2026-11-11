# Judge packet: `kon/place`, placing the protractor (class 6 maths, "Measuring and drawing angles")

This packet is meant to be read on its own: everything a judge needs is in this file and the 50 screenshots beside it. Code: branch `claude/r8-kon-round2` (the fixes after judging round 2, `RULINGS-2026-11-11.md`); every screenshot was retaken on it. **Not yet checked on a real phone, or with a child.**

**Topic:** c6-maths-ch02-t03, "Measuring and drawing angles". Class 6, age band 10–12. Three goals: `measure` (skill s2, also s1), `draw` (s3, s2, s1) and `size` (s2).

**What is new.** The older game for this topic drew the protractor already sitting on the angle, so only one of the kit's mix-ups could ever show. Here the protractor lies loose and the child puts it on the angle herself. The game grades the placement, and then grades the number she types or the mark she makes against what the protractor *as she placed it* shows.

**The three laws this packet is built to** (main's rulings, for every game):
1. Green means right and only right. What she has selected but not yet committed is blue (the focus colour). Her own wrong value is brown (the mix-up colour). The green-yellow action button keeps its colour.
2. After a miss the screen never holds the key while a try remains: not the key, not a line she can trace, not readings that settle the next pick.
3. A mix-up is named only by an act a guess rarely produces (a typed number, a placement, a mark). A pick among a few buttons is reported as a *sign* at chance weight and is not kept on her record.

**The mix-ups it plays out** (kit ids `c6-maths-ch02-t03-m-*`):

| Goal | Named (kept on her record) | Reported only as a sign (not kept) |
|---|---|---|
| measure | wrong-scale, vertex-off | — |
| draw | wrong-scale, vertex-off | join-wrong-end (one of two join buttons) |
| size | none (the kit's `tool-size` is not claimed: Goal 3) | — |

## The rule the game enforces (never stated on screen)

A protractor is **placed** when both of these hold:
- its small centre dot is within 11 board-units of the vertex O (about 11 CSS px on a 360 px phone before the lock, about 10 after it, about 25 px on the 1366 screen; see Sizes);
- its straight base line is within ±3° of an arm. For `measure`, the other arm must also cross the half-disc, i.e. the protractor opens towards it.

Everything after that is graded on what the protractor shows *as placed*:
- The scale to read is the one whose 0 sits on the placed arm.
- A typed reading counts if it is within ±2° of what that scale shows. **The number she types decides which scale she read:** within ±2° of 180 minus that number is the other scale (`wrong-scale`).
- A drawn dot counts if it is within ±2° of the asked angle on that scale.

**A protractor that is not placed can never solve the level**, whatever number she types or marks off it. The game never snaps the protractor to the vertex or to an arm (a snap would be the placement), never prints a reading for her, shows no live reading of the angle, and has no timer.

## Goal 1: `measure` (read the angle)

**What she sees.** Two black arms from a dot O, with letters A and B at the arm ends and O near the dot. A loose, see-through half-disc protractor rests below the figure, slightly tilted. It has a printed outer scale and a printed inner scale. Numbers are printed every 20° at fade 1 (as in the shots), every 30° at fade 2, and only 0, 90 and 180 at fade 3; small ticks are every 5°, longer every 10°. A round blue handle with two turning arrows sits on the protractor's body. The instruction under the board reads "Protractor se ∠AOB naapo". There are two small arrow buttons (↺ ↻), "Wapas" and "Rakh do". Shots: `measure-initial-*`, `measure-placed-*`.

**What she does, in order.**
1. She drags the protractor by its body to move it.
2. She drags the blue handle to turn it about its own centre, in 1° steps. ↺ and ↻ turn it by exactly 1° each press.
3. She presses "Rakh do". The protractor is now frozen. The instruction changes to **"Scale padho aur ∠AOB ka number likho"** and a **number pad** appears: 1 … 9, 0 and ⌫ (delete), with "Phir se rakho", "Wapas" and "Yahi hai" under it. Shot: `measure-locked-*`.
4. **She types the number she reads.** Nothing on the board prints a value: tapping the protractor does nothing after the lock. Her number appears in a blue chip under the board as she types (e.g. "150°"). The pad refuses a number over 180. Shot: `measure-typed-*`.
5. She presses "Yahi hai" (off until she has typed a digit).
6. After the lock she has two ways back: "Wapas" takes back one step (the lock itself, or, after a miss, her last "Yahi hai"), and "Phir se rakho" unfreezes the protractor and clears what she typed.

**This level's givens and key** (as in the shots, level `kon-place:measure:150:180m`). OA runs flat to the **left**; OB goes up and to the right, so the angle opens clockwise from OA. Placed with its centre on O and its base along OA, the protractor's **outer** scale has its 0 at the far (right) end, away from A, and the **inner** scale has its 0 on OA. **The key is 150°**, read on the inner scale. 150 is not a printed number at fade 1 (every 20° is printed): she counts the ticks past 140. Reading the outer scale gives 30: that is `wrong-scale`. Levels like this one, where the outer scale is the wrong one, are half of all levels. Shot: `measure-end-*`.

### Mal-rule `vertex-off`
- **Kit belief:** "Lines up the bottom edge of the protractor instead of putting its centre point on the vertex". Signs: "Places the vertex at the corner of the protractor's edge", "Gets readings a few degrees off", "Does not look for the small centre mark".
- **What a child holding it does.** She slides the protractor so its flat bottom edge lies along OA with O on that edge (O at the middle of the edge). This leaves the centre dot 24 board-units above O. She turns it flat, locks it, and types the number the protractor *as it sits* shows (here 161). Shots: `measure-vertex-off-typed-*`, `measure-vertex-off-played-*`.
- **What the screen then shows when she presses "Yahi hai"** (no words):
  - a brown ring on O, with a thin dashed brown line from O to the protractor's centre dot;
  - the arm her number means is drawn as a dashed brown line **from the protractor's centre dot** through the rim; it starts above the corner and runs beside OB without lying on it;
  - her "161°" chip turns brown.
  - The ring and the dashed join appear only in the play-out of a committed decision whose placement is the bottom edge on O. Never before her first "Yahi hai", never for any other off placement.
- **How it is graded.** Not right. It is named `vertex-off` because her number is right for the protractor as placed but the placement is off. The generator only serves a level when this reading differs from the true angle by at least 3°.

### Mal-rule `wrong-scale`
- **Kit belief:** "Reads the wrong scale on the protractor, e.g. gets 130° for a 50° angle". Signs: "Gives a reading over 90° for an obviously narrow angle", "Always reads the outer scale", "Two readings for the same angle add to 180°".
- **What a child holding it does.** She places the protractor correctly and types the other scale's number: 180 − 150 = **30**. Shots: `measure-wrong-scale-typed-*`, `measure-wrong-scale-played-*`.
- **What the screen then shows:** a dashed brown arm from O at 30° from OA, i.e. the arm her number means on the scale whose 0 is on OA, far from OB; a dashed brown arc between OB and that arm (no number on it); her "30°" chip in brown. The true size is never shown.
- **When the game names it.** When her typed number is within ±2° of 180 minus the true reading, and the angle is not close to 90° (where the two scales would agree). Any other wrong number is an ordinary miss with the same arm drawn and no mix-up named; within 5° it is recorded as a near miss.
- **What a first-try solve says.** Only on a level where the outer scale is the wrong one (as here) does a first-try solve count as evidence that she chose the right scale. On a level where OA points right, the outer scale is the right one, a child who always reads the outer scale solves it, and her solve says nothing about scales (it counts only as a correct placement).

## Goal 2: `draw` (draw an angle of a given size)

**What she sees.** Only the first arm, OA, with the dot O and the letter A. The same loose protractor rests below. The instruction gives the size: "Protractor se OA par ∠AOB = 130° banao". Shot: `draw-initial-*`.

**What she does, in order.**
1. She drags, turns and presses "Rakh do" exactly as in `measure`. The instruction changes to **"Rim par 130° ka bindu lagao, phir jodo"**. Shots: `draw-placed-*`, `draw-locked-*`.
2. She taps the rim of the protractor to put a blue dot. Tapping the rim again moves it, and **↺ ↻ move the dot 1° along the rim** (1° is under 2 px on a phone, too fine for a finger). The arrows say which way it moves round the rim, not "−1"/"+1", because a number would name one of the two scales. Shot: `draw-dot-*`.
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

### Sign `join-wrong-end` (not named)
- **Kit belief:** "Believes the degree mark can be joined to either end of the first arm, so joins it to the far end instead of to the vertex where the protractor's centre was".
- **What a child holding it does.** Places the protractor correctly, puts the dot at the right mark (130), then presses "A se jodo". Shot: `draw-join-wrong-end-played-*`.
- **What the screen then shows:** her brown line from A (the far end of OA) through the dot; a small brown arc at A; a chip "∠A 22°" (the angle that line makes at A).
- **How it is graded.** Not right, an ordinary miss. Because the join is one of two buttons, a guess makes it half the time, so the mix-up is **not** named and nothing goes on her record: the teacher receives `sign=join-wrong-end` (only when the dot itself was at the right mark). Naming it on a repeat on a different level is proposed to main (it needs memory across levels that the play server does not keep yet).

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
  - `measure` and `draw`: not by luck. A protractor that is not placed never solves. A correct reading of a wrong placement is `vertex-off`, never right. Only the exact "bottom edge on O" placement is *named* `vertex-off`; any other off placement is a plain refusal with no mix-up recorded, and its play-out shows only what her number or arm means as placed (no ring, no line to O). She can try again; every decision is recorded. Only a *first* decision that is already a solve counts as first-try evidence. A mix-up named at her first decision stays on her record even if she then solves.
  - After a miss the play-out shows where *her* number or arm landed, never the key. A persistent child can still compare her arm with OB (measure) or adjust her dot and join again (draw): that is reading the protractor again, which is the skill.
  - `size`: one pick among three, so a first-try solve enters the learner model at the "chance" weight. She can pick again after a miss and passes within three presses, but not first-try. Any of the three can be the key, so no fixed habit ("the bigger tool", "always Barabar") wins more than a third of the levels.
- **End screens.** A first-try solve ends with a full green tick; a solve after a miss ends with a **pale** tick. The line under the board says what she did and how many checks it took, with no praise: "Tumne 150° likha · jaanch: 1" (measure), "Tumne ∠AOB = 130° banaya · jaanch: 2" (draw), "Jaanch: 1" (size). Shots: `*-end-*` (one check), `*-end-after-miss-*` (two checks, pale tick).
- **What the teacher receives.** `placed` (ok or off, at her first decision), `centre_px`, `base_deg`, `read` (measure), `made` and `at` (draw), `pick` (size), the mix-up if named, and `sign=join-wrong-end` where it applies. The teacher is not told the measure reading before she gives it. The game never speaks.
- **Sizes.** The board is a fixed 320 × 340 units scaled into the box. At 360 px, before the lock (two rows of buttons), 1 unit is about 1.0 CSS px and the protractor about 215 px wide; after the lock the number pad takes a third row, so 1 unit is about 0.87 CSS px and the protractor about 185 px wide while she reads. The turning handle's touch area is 64 px. **The centre tolerance is 11 units** (placement happens before the lock, so about 11 CSS px at 360; about 25 px at 1366); the bottom-edge placement sits 24 units off, outside it. The line under the board always keeps room for two lines on a phone, so the board does not move when the line changes.
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
| instruction, draw, after "Rakh do" | Rim par 130° ka bindu lagao, phir jodo | किनारे पर 130° का बिंदु लगाओ, फिर जोड़ो | Put a dot at 130° on the rim, then join it |
| instruction, size | Kaunsa kon zyada hai: ∠P, ∠Q, ya dono barabar? | कौन-सा कोण ज़्यादा है: ∠P, ∠Q, या दोनों बराबर? | Which angle is more: ∠P, ∠Q, or are they the same? |
| end line, measure | Tumne 150° likha · jaanch: 1 | तुमने 150° लिखा · जाँच: 1 | You wrote 150° · checks: 1 |
| end line, draw | Tumne ∠AOB = 130° banaya · jaanch: 1 | तुमने ∠AOB = 130° बनाया · जाँच: 1 | You drew ∠AOB = 130° · checks: 1 |
| end line, size | Jaanch: 1 | जाँच: 1 | Checks: 1 |
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

## Changes after judging round 2

Rulings: `docs/design/round8/games-judging/RULINGS-2026-11-11.md` (kon/place 1–6, and the three laws). Each change is held by a test: the proof suite `tests/r8-games-kon-place.test.mjs` (every generated level) or the layout check `tests/r8-games-kon-layout.test.mjs` (every served level, every screen, 360 × 640 and 1366 × 768).

| Ruling | What changed | Screens |
|---|---|---|
| 1. Measure: she types the number | After "Rakh do" a number pad (0–9, ⌫); no tap prints a value (the band tap is gone); the typed number decides the scale (±2 of the scale whose 0 is on the placed arm is right, ±2 of 180 minus it is `wrong-scale`). | `measure-locked`, `measure-typed`, `*-typed`, `*-played` |
| 2. Draw: only her arm and "∠O x°" after a miss; nudges | The asked arm is never drawn; her arm (brown), its arc and chip only. ↺ ↻ move the dot 1° along the rim (arrows, so no scale is named). | `draw-*-played`, `draw-dot` |
| 3. Size: all three answers offered; no readings on a miss; tick clear of labels; any key; same numbers | New instruction "∠P, ∠Q, ya dono barabar?"; a miss shows only her pick in brown; "Barabar" solved shows "∠P = ∠Q" between the figures with the tick beside it; the generator makes each of the three the key a third of the time (the "bigger tool's angle is never the answer" rule is gone); both protractors print every 30° (fades 1–2). | `size-*` |
| 4. Scale evidence only where the outer scale is wrong; join-wrong-end at chance; button order | `wrong-scale` is discriminated (and listed first, so a first-try solve says "chose the right scale") only on levels where the outer scale is wrong; the two orientations are served equally (was 45/55). `join-wrong-end` is a sign (`sign=join-wrong-end`), never on her record from one join. The join buttons' order varies by level. | `draw-join-wrong-end-played` |
| 5. Mix-up colour; B label; instruction after "Rakh do"; checks at the end | Her wrong number or arm is brown, her selection blue, green only when right; the finished arm carries B; the instruction changes after the lock; end lines count checks, and a solve after a miss has a pale tick. | `*-end`, `*-end-after-miss`, `*-locked` |
| 6. Tolerance; vertex-off kit wording | Unchanged (11 units; the kit split is with Learning, accepted open by both judges). | — |
| Law 1 (every family) | The handle and her dot/number are blue (focus), not green; brown for her wrong value. | all |

Also fixed while retaking: the vertex-off protractor's top numbers could be cut at the board's top edge on some mirrored levels (the generator now keeps the numbers' full height on the board), and the letter O stands a little further from the vertex so the vertex-off ring never touches it.

## Known issues still open

1. **`vertex-off` wording vs play-out** (kept, with Learning). The kit's first sign says the vertex goes at "the corner of the protractor's edge"; the game puts O at the *middle* of the bottom edge (the kit's belief and second sign). A bottom-corner placement is not named.
2. **The board is smaller while she reads** (new): the number pad takes a third row of buttons on a phone, so after the lock the protractor is about 185 px wide at 360 instead of about 215. The numbers stay at the 14 px floor. Reverse if children cannot read the 5° ticks at that size.
3. **Naming a sign on a repeat** (law 3) needs memory across levels; proposed to main, not built.

## Screenshots (50)

`<goal>-<step>-{360x640,1366x768}.png`:
- measure: `initial`, `placed`, `locked`, `typed`, `vertex-off-typed`, `vertex-off-played`, `wrong-scale-typed`, `wrong-scale-played`, `end`, `end-after-miss`
- draw: `initial`, `placed`, `locked`, `dot`, `vertex-off-played`, `wrong-scale-played`, `join-wrong-end-played`, `end`, `end-after-miss`
- size: `initial`, `wrong-pick-played`, `end` (level 1, key "Barabar"); `other-initial`, `other-same-played`, `other-end-after-miss` (level 2, key ∠Q)

Steps: `initial` is the first screen; `placed` the protractor in its right place, not yet locked; `locked` just after "Rakh do"; `typed` / `*-typed` a number typed, before "Yahi hai"; `dot` the dot on the rim; `*-played` just after the decision; `end` solved first try; `end-after-miss` solved at the second check (measure: after typing the other scale's 30; draw: after the wrong-scale arm; size: after a "Barabar" pick).

The 360×640 shots are at 2× pixel density; the 1366×768 shots were taken at 2× and scaled to 1× (colours unchanged). Levels (fade 1, as served): measure `kon-place:measure:150:180m`, draw `kon-place:draw:130:180m`, size `kon-size:105:105:B` and `kon-size:100:135:Bm`.
