# JUDGE r4: 2D puppet, arm P (polish r4a + r4b)

Date: 2026-10-04. Judge: harsh art director (Opus 5.5), plus a blind Foundry vision opinion.
Candidate: `art/character/puppet2d/polish-r4/` (demo.html, frames-sheet.jpg, clip-review-r4b-1024.mp4, clip-talk-14s-r4b.mp4).

## Score: 3.8 / 5 (not ready; owner bar 4.5)

- r3 scored 3.8 and r2 scored 3.5. The builder's self-score is 3.9.
- Strict, not rounded up.
- The frontal performance (rest, talk, emotes, blink) is now at about 4.0, which is shippable.
- The new painted turn plates bring in a full-size seam and crease on the +20 side, plus a feature-slide that is still visible. Fps also regressed. Those two pull the whole down.
- If the turn were limited to about ±8 (which hides the plates), this would be a 4.0 candidate today.

## How I judged

- **Frames sheet** against c-front, at full size and at thumbnail.
- **45 s review clip** at 1 fps (overview), 4 fps (expressions 27-36 s, turn 36-45 s) and 30 fps (blink).
- **Talk clip:** a mouth crop at 15 fps over 5-9 s.
- **Full-resolution frame** at 39.5 s (frontal) and at 43.5 s (+20 plate).
- **Blind Foundry opinion:** grok-4-20-reasoning and gpt-5.6-sol (taxila-brain), one run each. Each saw c-front, the sheet and the full-size +20 frame, with no builder notes.
- **Evidence** is in `judge-r4/`:
  - `judge-blind-*.json`
  - `judge-yawR20-full.png`
  - `judge-talk15.jpg`
  - `judge-blink30.jpg`
  - `judge-turn4fps.jpg`

## Blind panel

| model | same | score | top defect |
|---|---|---|---|
| grok-4-20-reasoning | yes | 3.5 | Painted-plate turns don't match the blend turns: seams, warp and lighting mismatch. Visemes are watered down. |
| gpt-5.6-sol | yes | 3.0 | The +20 plate has a conspicuous vertical blend seam, a smeared cheek and a doubled mouth corner. The turn is a feature-slide. O, U, F/V, L and ch don't separate well. |

- The builder's own gpt-5.6-sol panel (stills grid, n=24) put it at about 3.7.
- My prompt was harsher: it named the studio-puppet standard and included the full-size turn frame. That is why the scores came in lower.
- Both models found the +20 seam on their own. I confirmed it by eye in `judge-yawR20-full.png`. It is a vertical shading break from the brow edge down the near cheek, with a crease beside the mouth corner.

## Real wins since r3

1. **Articulation (the r3 blocker) is largely fixed.**
   - In the 15 fps mouth strip there are real closures (m/b/p hold), a rounded o and u, a big aa with the cavity showing, and spread E.
   - It no longer reads as "smiling while mumbling".
   - Timing against the audio looks right, and the closures land on the bilabials.
2. **Teeth** use the painted contour and are clean at 1x. No shimmer.
3. **Blink at 30 fps is clean.** The sequence is mid, closed, closed, mid, open (about 1-2-1 frames). Bell's dip reads, and nothing pops.
   - In motion the 0.6 mid key is fine. It only reads as "sleepy" as a still frame, so stop judging it from stills.
4. **Expression range is up.**
   - Surprise shows sclera above the iris.
   - Delight has the lower-lid push.
   - Concern is soft, with the frown and no teeth sliver.
   - Thinking now matches c-thinking (pursed, glance up).
   - All of them read at thumbnail size. Transitions ease, and nothing pops anywhere in 45 s.
5. **Identity holds everywhere frontal.** Rest is c-front (SSIM 0.984).

## Blocking 4 (must fix to ship)

1. **+20 turn plate: seam and crease at full size (regression).**
   - The two-texture blend shows a visible vertical shading discontinuity on the near cheek.
   - There is an ageing-like crease beside the mouth corner, and the "yaw +20, delight" frame warps the cheek. This is uncanny at full size.
   - The -20 plate has a milder version: a cheek seam and the nose turning less than the head.
2. **Turn is still a feature-slide.**
   - The far eye stays near frontal size, and the mouth is not foreshortened.
   - The live eye and mouth layers are drawn over the plate, so they keep frontal proportions while the skull turns.
3. **Fps is unmeasured on the phone, and the proxy regressed.**
   - The plates doubled the triangle count to about 32k.
   - At 4x CPU throttle, work p95 went from 17 ms to 32 ms.
   - Integrate cannot proceed until the owner reads `demo.html?facerig=1` on the cheap Android.

## Blocking 4.5

- **Visemes f/v, l/t/d and ch are still weak at a glance.**
  - f/v reads as a small smile, because the lower-lip-under-teeth contact is too subtle.
  - The L tongue tip is barely visible.
  - ch does not differ from E.
  - Both blind models flag these.
- **aa and surprise share a mouth construction.** Surprise needs a taller, narrower oval; aa should be wider.
- **Playful wink:** the closed lid is a flat diagonal slit with no cheek push on the winking side.
- **Too much smile while talking.** The concept asks for talking through a smile, so keep it as a bias. But the smile still lifts nearly every talking frame, so the mouth reads "chirpy" all the time.
- **Idle and listening life is fine but not delightful.** There is no secondary motion beyond hair sway (earring jiggle, breathing in the shoulders, micro-saccades between fixations).

## Highest-payoff fixes, in order

1. **METHOD CHANGE, turn: stop drawing frontal live layers over the yaw plates.**
   - Per side, paint the eyes, brows, nose and mouth shell into a plate-specific layer set: far eye about 0.8x width, mouth foreshortened.
   - Then blend the layer sets as well as the skin, not just the skin.
   - Remove the cheek seam by feathering the plate blend mask across a 40-60 px band along a shading-neutral contour, not a straight column. Repaint the +20 near cheek and mouth corner to delete the crease (about USD 0.30-0.60 of image-edit).
   - Until that lands, clamp product yaw to ±10 using the blend only. That alone removes the uncanny full-size frames and gives a shippable 4.0.
2. **Fps:**
   - Coarsen the plate grids from 8 px to 16 px in flat skin, keeping 8 px only inside the feature masks.
   - Draw only the active-side plate (|yaw| > 2).
   - Target: proxy work p95 at or below the r3 figure (17 ms). The owner still has to measure on the phone.
3. **Visemes, second pass:**
   - f/v: upper teeth visible, lower lip tucked and lifted to touch them, with no smile.
   - L/t/d: tongue tip clearly visible behind the upper teeth for at least 2 frames.
   - ch: lips protruded and squared, with teeth showing behind them.
   - Surprise mouth: a taller and narrower oval than aa.
   - Gate: a blind forced-choice label test on mouth crops, aiming for at least 80% correct.
4. **Playful wink:** a curved closed-lid key with a cheek raise on the winking side.
5. **Secondary life:** shoulder breathing, earring lag, micro-saccades, and a brow flick on stressed syllables. This is what moves 4.3 to 4.5+.

Expected: fix 1 (with the interim ±10 clamp) plus fix 2 gives 4.0-4.1 and makes it shippable. Fixes 3-5 carry it to about 4.4-4.5.

## Verdict

- Not ready: best is 3.8, below 4.
- The frontal puppet is there. The turn is the one thing keeping it from shipping.
- The phone fps must be read by the owner before Integrate.
