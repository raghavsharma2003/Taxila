# JUDGE r5: 2D puppet, polish-r5 of arm P

Date: 2026-10-04. Judge: harsh art director pass, independent of the builder.
Candidate: `art/character/puppet2d/polish-r5/` (demo.html, frames-sheet.jpg, clip-review-r5-1024.mp4).
Evidence: `docs/design/teacher/puppet2d/judge-r5/`. Blind script: `scripts/character/puppet2d/judge-r5-blind.mjs`.

## Verdict

**3.9 / 5. Not ready.** The owner's bar is 4.5, and shipping needs 4.0.

The frontal performance is now close to shippable. The talk loop, the wink, the blink and the main expressions all hold up in motion. It stays under 4.0 for four reasons:

1. **A tear artefact I found myself at full size** (the builder did not report it). When the head rolls or lifts, a jagged, dark, saw-tooth strip shows on the right shoulder under the bun.
2. The surprise mouth reads as a hard vector cut-out.
3. The turn is clamped to ±10 and still reads as features sliding under a static skull.
4. Fps on the phone is still unmeasured.

The builder self-scored 4.0. My score is lower because of the tear: it shows on three of the key expressions, and "never popping or tearing" is part of the bar.

## What I looked at

- **frames-sheet.jpg against c-front**, at thumbnail and full size.
- **A 1 fps contact sheet of the whole 45 s clip.** Identity holds in every frame and nothing pops.
- **A 15 fps mouth strip, 9-11 s.** Real closures, rounded O/U, open aa, spread E with teeth, a pink tongue tip on two frames, and a blink inside the talk. The timing reads as plausible against the speech rhythm. Rows of talking frames no longer all look chirpy, so the lower smile bias works.
- **The wink at 30 fps, 36.6-37.8 s.** Open, half, arch held for about 0.5 s, half, open. There are no ghost frames and no blink re-trigger, so the r4 bug is fixed. The arch is curved and the cheek and smirk are on the same side, so it reads as a real playful wink. Small nit: the half-lid frame on the way in looks droopy, more sleepy than cheeky.
- **Full-size frames:** delight at 30.5 s and the ±10 turn at 41.5 s. Zooms of the surprise mouth and the bun and shoulder edge.
- **An independent 3x3 grid that I sampled from the clip myself**, not the builder's sheet: `judge-r5/grid_X.jpg`.

## Blind Foundry opinion

I sent `ref.jpg` and my own grid to both models. The builder's notes were not included.

| model | score | same character | defects it named |
|---|---|---|---|
| gpt-5.6-sol (taxila-brain) | **3.7** | yes | The ~10° turn is the gaze only; the features stay frontal. Delight stretches the lower face. The two concern takes look like duplicates, so the range is shallow. Eyes, cheeks and smile drift slightly from REF. |
| grok-4-20-reasoning | **3.7** | yes | The talking cell looks like rest. Thinking is weak. Concern is too subtle. The turn's nose and cheek "fail to rotate", which reads as flat 2D. |

Calibration note: my grid caught the talking cell between syllables, with the lips nearly closed. That sampling is part of why both models marked talking down. The builder's curated panel scored 4.0 and 3.5. Both runs agree on the same ceiling, though: the turn, plus expression range and strength.

## Defects, by severity

1. **The shoulder under the bun tears (full size, new).** When the head rolls or lifts, a jagged, dark strip of baked hair edge is left on the kurta shoulder, just right of the neck (`judge-r5/zoom-bun-delight.png`). It shows in the delight, thinking and playful cells of the grid. It is absent at rest and in the ±10 turn (`zoom-bun-3t.png`). It looks like body-plate residue: the bun's old silhouette was never cleaned off the body layer, or the bun mask has a hard alpha edge. At full size this is the one thing an art director's eye goes to first.
2. **The surprise mouth is a hard-edged cut-out** (`zoom-surprise.png`). The cavity is a crisp ellipse with no soft inner occlusion. The lower lip is a flat translucent band under it, and the corners do not tuck into the cheeks. It does not match the soft Memoji shading of c-front. The protrusion also reads slightly snout-like at thumbnail.
3. **The turn is a feature-slide, capped at ±10.** It is clean, with no seam or crease, but both blind models still see the head failing to rotate. Going past ±10 needs the method change named in r4, and it has not been done.
4. **The range is shallow on concern and thinking.** Concern is a brow tilt plus a flat mouth, and the two takes are nearly identical. Thinking reads as mild curiosity. There is no mouth push to one side, no lip press and no squint.
5. **The delight mouth is oversized and rubbery at full size.** The lower face stretches and the jaw bulges (the "rubbery jaw on big openings" both models named in r5's own blind panel). The upper lids look flat during delight.
6. **f/v is still the weakest viseme.** It was 4/6 for sol and lower for grok, and grok's forced-choice test was 0.69, under the 80% gate.
7. **Fps on the phone is unmeasured.** The SwiftShader proxy is good: p95 of 12-13 ms at 4x throttle, down from 32 ms. A cheap Android reading of `demo.html?facerig=1` is still required before Integrate.

## Highest-payoff fixes (to reach 4.0, then 4.5)

**To 4.0 (cheap, this round):**

1. **Clean the body plate under the bun.** Inpaint the shoulder and neck region the bun can uncover, from about +40 px past the bun silhouette, using the kurta and skin colours. Give the bun layer a soft 3-4 px alpha feather. Then gate it: a dark-pixel scan of the shoulder region over every frame of the 45 s clip must find zero saw-tooth runs. Use the existing layers; at most one image edit, about USD 0.10.
2. **Soften the surprise and aa cavities.** Add an inner occlusion gradient (dark at the top under the upper lip, lighter toward the tongue). Give the cavity a 2 px soft rim. Draw the lower lip as a lit volume, not a translucent band. Tuck the corners into a short cheek crease. The same pass fixes the delight mouth edge.
3. **Clamp jaw drop and stretch on delight and aa** to about 85% of the current value. Add a slight cheek-up lift so the lower face does not balloon.

**To 4.5 (needs changes of method, stated plainly):**

4. **METHOD CHANGE, turn (still outstanding from r4):** per-side plate feature layers. Repaint the far eye at about 0.8x width, the foreshortened mouth, and the nose with a shifted bridge highlight. Blend the layer sets together with the skin, along a shading-neutral contour. Add parallax on the ears, the hair shell and the bun, and shift the jaw contour. Without this, the ceiling stays at about 4.1. With it, a ±20 turn becomes a real asset.
5. **METHOD CHANGE, expression range:** author asymmetric secondary keys, painted or warp-keyed, for concern (inner-brow knit, lip press with one corner down, a lower-lid raise) and thinking (lips pushed to one side, a slight squint on one side, a cheek bunch). Today these are the frontal shapes with small offsets, which is why both models call them weak and duplicated. Add 2-3 variants for each emotion, chosen at random by the rig, so repeats never look like copies.
6. **f/v and ch, third pass:** make the lower lip visibly tuck under the upper incisors, with a shadow line under the teeth. Gate on both models scoring at least 0.80 on forced-choice, not just one.
7. **Lids:** a curved, volumetric upper-lid key for mid-blink and delight (a lid-fold highlight plus a lash-line bend) to remove the flat-lid look.
8. **Earring glint:** draw the glint that life.js already computes. It is cheap and adds life.
9. **Phone:** the owner reads `?facerig=1` fps and work p95 on the cheap Android. That is the hard gate before Integrate.

## Score rationale

- **Frontal performance: about 4.0.** Identity, talk timing, wink, blink and idle life are all at the premium bar in motion.
- **Full-size polish: below 4.** The shoulder tear on three key expressions and the cut-out surprise mouth pull it down.
- **Turn: clean but limited,** about 3.8 if judged alone.
- **Blind models:** 3.7 and 3.7 on an independent sample.

Overall: **3.9, strict, not rounded up.** Fixes 1-3 are cheap and should reach 4.0-4.1. Fixes 4-5 are the changes of method that 4.5 needs.
