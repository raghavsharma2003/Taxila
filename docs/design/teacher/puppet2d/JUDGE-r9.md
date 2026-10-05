# JUDGE r9: 2D puppet, polish r9 (base P)

Date: 2026-10-05. The judge is a harsh art director. Inputs:
- the r9 frames sheet at full size;
- the 48 s review clip: a 1 frame / 3 s contact sheet, 1:1 crops of four acting beats, a 30 fps strip of the concern A to B crossfade (34.6 to 35.2 s), 4x zooms of the mouth corners and eyes;
- the builder's motion strips for turn, talk and concern AB;
- c-front, c-happy and c-thinking side by side;
- two blind Foundry vision opinions on a grid I built myself from the r9 clip.

Evidence: `judge-r9/` (grid_X.jpg, ref.jpg, blind-*.json, fullsize-quad.png, zoom-delight-corners.png, zoom-eyes.png, concernAB-30fps.jpg, concepts-happy-thinking.jpg).

**Score: 4.2 / 5. Ship-quality (ready), but still below the owner's 4.5 bar.** r8 was 4.1. The builder self-scored 4.3; I give 0.1 less because of the delight-corner artefact and the concern read below.

## What r9 fixed, confirmed by eye

- **Turn relight (the method change).** It works.
  - At ±20 degrees, the far cheek and temple sit in a soft shadow plane, the nose separates from the far cheek, and the near cheek lifts.
  - In motion (motion-turn-r9, 42-47.6 s) the light tracks yaw continuously, with no seams between face, lids and lip shell.
  - The face now reads as turned, not slid.
  - What still gives it away is the **skull and hair**. The hair cap, part line and hair sheen stay frontal-lit and barely change shape, so the head reads as a turned face inside a frontal hairdo. Sol's complaint ("features rotate while the skull, hair mass, ears... remain nearly frontal") now points at that.
- **Thinking.**
  - One-sided arch, inner-brow lift and real moue volume make it much closer to c-thinking.
  - Grok no longer says sceptical. Sol still reads an "eye-roll" undertone.
  - Cause, seen at 1:1: the iris is pinned up against the upper lid with sclera showing below it. c-thinking looks up and to the side, the lid follows the gaze, and the iris sits clear of the lid.
  - The c-thinking moue also sits clearly **off-centre** toward the push side. Ours is still almost centred.
- **Concern A to B in motion.** The crossfade is continuous at 30 fps (concernAB-30fps.jpg). There is no smile flash, no pop and no doubled lip edge. The hidden-teeth-row sliver is gone.
- **Surprise O.** Egg top, thinner lower rim and a warmer cavity. It is no longer the most pasted-on mouth in the set. It is acceptable.
- **Bun edge.** Clean against the cream background at 1:1.
- **Lip-sync and life.** Still excellent: closures, aa/E/O/U, teeth, the t/d/l tongue tip, blinks with in-betweens, and continuous idle. Identity holds across all 48 s. Nothing pops, tears or turns uncanny.

## What is still wrong (my eyes, 1:1)

1. **Delight / wide-smile corner whiskers.** This is an artefact visible at full size (zoom-delight-corners.png, t = 30.5).
   - At both corners of the open delight mouth, c-front's closed lip line still extends past the opening as a forked dark and pale double tick.
   - The fix 2 seam fade covers the rounded O but not the wide smile.
   - The cavity's lateral edge on the push side is also a hard, near-vertical stencil cut.
   - A premium puppet never shows this. It is the single most visible craft defect left.
2. **Delight is off-model against c-happy** (concepts-happy-thinking.jpg).
   - c-happy has a dominant upper-teeth band, a small cavity, a modest lower lip and cheek-squinted eyes.
   - Ours drops the jaw too far, shows a large dark-red cavity and a heavy pink lower lip, and the eyes stay round.
   - Grok: "excessively broad... deviates from REF's soft Memoji restraint". Sol and grok both flagged mouth size last round too.
3. **Concern reads as sad or disappointed, not caring.** Both blind models said so for both takes (4 of 4 cells).
   - The mouth is small and turned down, the cheeks are slack and the eyes are passive.
   - For a teacher, concern has to be engaged, along the lines of "oh, are you okay? let's fix it": inner brows up, eyes slightly wider and on the child, a small lean or tilt, and a mouth that is soft, not sulky.
4. **The turn is still face-only** (see the turn bullet above): the hair and skull do not turn.
5. **Global likeness drift.** Talking and surprise eyes open wider than c-front, and the lower face narrows on concern. Both models mention it, and it is real but small. As the builder says, it comes from the cut layers.
6. **Minor.** Playful B (the wink on her left) reads sleepy or smug in the sheet, because both lids are low. The eyeliner wing tips show a faint double edge at 4x.

## Blind Foundry judges (my grid, no builder notes)

I ran the judge-r6 prompt unchanged, via `scripts/character/puppet2d/judge-r9-judge-blind.mjs`, a copy of judge-r9-blind.mjs. The grid is my own: 9 cells from the r9 clip at t = 0.5, 11.4, 25, 30.5, 33.6, 38.3, 40.2, 36.4 (concern B in motion) and 46. REF is c-front.

| model | score | same? | main complaints |
|---|---|---|---|
| taxila-brain (sol) | 3.8 | yes | turn shows skull/hair frontal; concern reads sulky/sad; thinking has an eye-roll undertone; talking frame looks held; face-volume drift |
| grok-4-20-reasoning | 3.8 | yes | thinking brow sharp; concern flat, "disappointed"; turn jaw/neck shading; delight smile too broad; talking eyes too wide |

r8 scored 3.6 / 3.6, so both models moved +0.2. That is at the edge of their ±0.3 noise, but it agrees with the direction I see. Neither flags a rendering artefact; at their grid size they cannot see the corner whiskers.

## Why 4.2 and not 4.5

r9 delivered the method change asked for, and it works on the face. The gap to premium-studio polish now comes from three things:
- one remaining visible craft artefact, the delight corners;
- the acting of two beats against their concepts: delight against c-happy, and concern, which has no concept and reads as sulky;
- the head turn stopping at the hairline.

None of these is a rendering-stability problem. Motion quality is already at studio level.

## Highest-payoff fixes (in order)

1. **Delight / aa / E corner clean-up (cheap, high impact).**
   - Extend the r9 closed-seam fade to every open mouth wider than the rest smile. On columns outside the opening, fade c-front's closed lip line into the corner crease within 2 to 3 px, so no forked or pale tick survives.
   - Feather the cavity's lateral edge so it rounds into the corner instead of ending in a vertical cut.
   - Gate it: add a corner-tick detector to the articulation strip (a dark-pale-dark triple within 6 px outside the opening ends) and require 0 hits over the clip.
2. **Re-pose delight onto c-happy.**
   - Reduce the jaw drop by about 25%.
   - Raise the upper-teeth band so it is the dominant shape.
   - Shrink the visible cavity and the lower-lip mass by about 30%.
   - Add cheekSquint / eyeSquint of about 0.35 so the eyes smile.
   - Check it side by side with c-happy at full size, not on the sheet.
3. **METHOD CHANGE: turn the hair, not just the face.** Apply the r9 yaw light field to the hair cap as well: far-side hair darker and near-side sheen lifted. Then add a yaw-keyed hair-cap warp fitted to the painted 30-degree keys' hair silhouette, the same way lightfit.py fitted the skin:
   - the part line shifts toward the far side;
   - the near-side hair volume widens;
   - the far side compresses;
   - the bun swings slightly to the far side.
   This needs no image spend, because the keys already hold the target. Without it, sol will keep calling the turn a cheat.
4. **Concern: change the intent from sad to caring.**
   - Inner brows up (keep).
   - Upper lids raised about 0.15, with the gaze locked on the viewer.
   - Head tilt plus a slight forward lean.
   - Mouth-corner drop reduced by about 40%, with a hint of a one-sided reassuring lift on concern B.
   - Accept it only when both blind models read "concerned / caring", not "sad / disappointed".
5. **Thinking gaze.**
   - Move the look-up diagonally up and to the side. Lift the upper lid with eyeLookUp so the iris sits clear of the lid and no sclera shows beneath it. That removes the eye-roll read.
   - Shift the moue 3 to 4 px toward the push side, with a slight tilt, to match c-thinking.
6. **Likeness lock (cheap).** Clamp eyeWide on talking visemes to about 0.15, so the eyes stay at c-front size while talking, and hold the jaw width on concern.
7. **Phone gate (owner, hard gate before Integrate).** Open `demo.html?facerig=1` on the cheap Android and read fps and work p95. The SwiftShader proxy (r9 p95 18.2 ms at 4x CPU, against 16.4 ms for r8, mostly the relight fetch) is not a phone reading.

Image spend this round: USD 0.00, ledger 9.98 of 30.
