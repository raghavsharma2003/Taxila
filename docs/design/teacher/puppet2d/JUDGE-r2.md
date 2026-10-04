# Puppet2D judge, round 2 (polish-r2 of arm P)

Date: 2026-10-04. Candidate: `art/character/puppet2d/polish-r2/` (demo.html, frames-sheet.jpg, clip-full-r2.mp4,
clip-turn-sweep.mp4, work/poses/*.png at 1024 px). Bar: the owner wants 4.5. 4 means shippable.

## Verdict: 3.5 / 5, not ready

| | score |
|---|---|
| r1 (P) | 3.0 |
| Builder's self-score | 3.6 |
| Blind gpt-5.6-sol (`taxila-brain`), ref + 3x3 grid of full-size poses | 3.7 |
| **This judge (strict, not rounded up)** | **3.5** |

This is real progress over r1. The r1 turn debris, the frontal lock halos and the "everything reads as warm smile"
problem are mostly gone. It is still not shippable, and it is a full point short of what the owner asked for. The
gap is no longer one big break. It is a dozen small craft tells that a premium studio puppet would never show,
plus two method limits (the mouth and the turn) that more polish on the current method will not fix.

## What is good (keep)

- **Rest is her.** At 1024 the rest render is effectively c-front (SSIM 0.985). Thumbnail recognition is immediate.
- **Lip-sync timing is right.** I stepped "chalo" frame by frame at 30 fps (audio offset 4.957 s; evidence
  `judge-r2/mouth64.jpg`). It plays ch (teeth), aa (open cavity), L (tongue up), then o (round). Each viseme lands
  on its phoneme with no lag that I can see. The tongue key reads.
- **The mouth sprites** (gpt-image-2) have lip volume, a curved teeth row and a real cavity. They are the best part of the puppet.
- **Expressions now read.** Surprise, delight and concern are unambiguous at thumbnail size. Thinking (roll,
  arched brow, eyes up, "hmm" mouth) is close to c-thinking. The blind model correctly named 8 of 9 cells.
- **Idle life is present.** Blinks are occasional and sometimes doubled, there is head drift, and the nods are
  level-driven. She never freezes.

## What blocks 4 and above (my eye, at full size)

1. **Talking loses the smile, and pauses snap.** Every talking viseme is a neutral-lips shape. Between words the
   mouth cuts back to the wide rest smile, so the corners jump in and out on every pause: the mouth narrows and
   widens, and its baseline moves. At 30 fps the 45 ms cross-fade is about one frame, so in practice it is a swap.
   In c-talking she talks *through* a smile; here she alternates between smiling and speaking. In motion this is
   the strongest "pasted mouth" tell left (rows 3-4 of `mouth64.jpg`).
2. **The turn is still a feature slide.** At yaw ±20 the far eye is squeezed horizontally into a tall vertical
   oval: the iris and pupil become ellipses, a slightly reptilian look (`judge-r2/yawzoom.png`). The skull, hair
   mass, ears and jaw silhouette stay frontal. The blind model flagged the same thing on its own. The turn is clean
   now, with no debris, but it does not look volumetric.
3. **Seams and chips remain at full size in posed and rolled states** (`judge-r2/think_zoom.png`, thinking pose):
   - The left brow tail is a separate fragment with a light seam where the hair strand crosses it. The same
     problem is visible in surprise.
   - Small skin-coloured triangles stick out past the jaw line beside both earrings under roll.
   - The bun's underside is ragged and streaky under roll.
   - A dark speck sits near the right brow tail in several poses.

   r2's "clean" check covered the yaw/pitch sweep, not expression x roll combinations. These are the
   combinations that break.
4. **Mid-blink and half-lids look sleepy.** The half-lid frame has the lids lowered while the brows and lashes
   stay in pose, and the crease smears (the builder noted this too). In motion the blink closes over 3-5 frames
   and reads a little heavy. Playful's half-lid has the same smear.
5. **Small model drift between poses.** Brow thickness and arch change under the ribbon warp, and face width
   and chin taper shift slightly between expressions. The blind model called this "redrawn rather than rigged".
   It is subtle, but it is the difference between 4 and 4.5.
6. **Not measured or not shippable yet:** fps on a real cheap Android is unknown, and the payload is 2.2 MB
   against a 120 KB budget. Neither one moves the art score, but both block Integrate.

## Highest-payoff fixes, in order (and where the method has to change)

1. **METHOD CHANGE: mouth = warped lip shell plus interior sprites.** Stop swapping whole-mouth sprites.
   - Build one lip-contour mesh (outer and inner lip lines, about 16 control points) whose corners are driven
     continuously by mouthSmile, mouthStretch and mouthPucker, and whose opening is driven by jawOpen and the viseme.
   - Use the painted atlas only for the interior (teeth row, tongue keys, cavity), masked by the inner lip contour.
   - The smile weight then carries straight through speech, and pauses blend instead of snapping.
   - If that is too far, the fallback is to repaint the 15 visemes plus 3 tongue keys a second time as a
     "smiling" family (gpt-image-2 edit from c-talking, about $1) and blend the families by mouthSmile, with corner
     anchors aligned to the rest smile. That fallback stops the corner pops but still swaps sprites.
2. **METHOD CHANGE: the turn uses keyed 3/4 views, not one warped frontal plate.**
   - Paint ±25° yaw key plates of the head layers from `build/refs/` q3-left and q3-right (gpt-image-2 edit with
     c-front as identity reference, about $2-4).
   - Blend frontal to 3/4 with a shared mesh, the way angle-X keyforms work: mesh deformation is interpolated
     between painted keys rather than extrapolated from one view.
   - Until that lands, cap the far eye's horizontal compression at about 15%. Keep the iris and pupil circular and
     translate them; never scale them anisotropically.
3. **A full-size artefact battery across the whole pose matrix.**
   - Render every expression x {roll ±8, yaw ±20, pitch ±10} x {blink 0, 0.5} at 1024 over cream and teal.
   - Run an automated check for alpha islands and coverage holes, then do an eye pass on 4x crops of the brows,
     earrings, jaw and bun.
   - Fix the specific defects: extend the brow layer fully under the hair mask so no tail fragment exists; clip
     the face overscan to the jaw contour under roll; give the bun underside a hull fill plus a soft matte.
4. **Blink rebuild.** Paint a true closed-lid layer and a mid-lid layer with a proper crease (gpt-image-2 edit,
   about $0.5). Use a 2-1-3 frame curve: 2 frames closing, 1 closed, 3 opening. Have the brows dip by about 5% on
   the blink so the half-lid frame never holds as a sleepy expression.
5. **Lock the construction.**
   - Clamp the brow ribbon so its thickness is preserved and only position, angle and arch change.
   - Freeze the jaw and cheek silhouette across expressions, except jaw-open.
   - Re-measure per-pose silhouette IoU against rest. Drift should come only from deliberate parameters.
6. **Then measure what the art cannot show.**
   - Owner opens demo.html?facerig=1 on the cheap Android and reads the HUD.
   - Pack the atlases as WebP or KTX2 toward the 120 KB budget.
   - Re-record the review clip at 1024 so the owner judges at full size.

Fixes 1 and 2 are the difference between "good puppet" and "premium puppet". Fixes 3-5 are what take 4 to 4.5.
Expected range if all six land: 4.2-4.6, unverified.

## Evidence

- `judge-r2/blind-out.json`: blind gpt-5.6-sol output, score 3.7. Inputs were `ref.jpg` and `grid_X.jpg`. Script:
  `scripts/character/puppet2d/judge-r2-blind.mjs`. One run only (n=1); r2's own panel showed about ±0.5 run-to-run noise.
- `judge-r2/mouth64.jpg`: 64 consecutive frames of the mouth from t=4.9 s ("chalo aaj hum").
- `judge-r2/think_zoom.png`: brow-tail seam, earring skin chips and ragged bun underside in the thinking pose.
- `judge-r2/yawzoom.png`: far-eye vertical squeeze at yaw +20.
- `judge-r2/turn.jpg`: turn sweep at 5 fps. `judge-r2/grid6b.png`: latest poses at full size.
