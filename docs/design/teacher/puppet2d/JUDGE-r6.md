# JUDGE r6: polish-r6 (arm P, built from r5)

Date: 2026-10-05. Judge: harsh art director, own eyes plus two blind Foundry vision models.
Candidate: `art/character/puppet2d/polish-r6/` (demo.html, frames-sheet.jpg, clip-review-r6-1024.mp4, clip-talk-14s-r6.mp4, clip-turn-6s-r6.mp4).
Evidence: `docs/design/teacher/puppet2d/judge-r6/`.

## Score: 3.9, strict and not rounded up (builder: 3.9). ready = false

r6 closes every cheap item from r5, and the blind models moved from 3.7 to 4.0 on my grid. What keeps it below 4 is a new
full-size artefact: a hard black spike on the forehead whenever the brows lift. The owner would see it on every delight
and surprise. It is cheap to fix and is now the only thing between this build and 4.0. Getting to the owner's 4.5 bar still
needs the two method changes listed below.

## What I checked

- frames-sheet.jpg against c-front, at thumbnail and full size.
- A 45-frame contact sheet of the 45 s review clip at 1 fps (`contact-1fps.jpg`). Identity holds and nothing pops.
- A 15 fps mouth strip from the talk clip (`mouth-15fps.jpg`). The shapes change at speech rate, with real closures
  (m/b/p), aa, O, spread E and f/v with teeth on lip. There is a blink inside the talk, and the open mouths now have an
  inner cavity, a tongue mound and a lit lower lip. This is the best lip-sync so far, and none of the vector cut-out look is left.
- A 10 fps transition strip, delight to warm to concern (`trans-10fps.jpg`). The blend is smooth over about 1 s with no
  popping, ghosting or snapping. Minor: the delight grin is held as one frozen mouth for about 1.2 s, with no micro-motion.
- Full-size frames of thinking, the 20° turn, delight and surprise (`full4.jpg`, `f-*.png`).
- The shoulder tear from r5 is gone at full size in delight, thinking, playful and the turn. I agree with teargate's
  0/1356 result.

## Defects, worst first

1. **NEW, full size: a forehead hair spike.** A hard-edged, aliased black triangular shard pokes out under the hairline
   above her right eye (viewer's left) in delight and surprise, and wherever the brow-raise warp pulls the forehead down
   relative to the hair. It is absent at rest (`zoom-wisp-rest.png`) and present in `zoom-wisp.png` (delight left, surprise
   right). It looks like an underlying wisp or hair-underlayer tip that the brow warp exposes. It has none of the 3.5 px
   feather the bun now has. Neither blind model caught it at grid size. The owner would catch it at full size.
2. **Thinking does not read as thinking.** Both blind models read thinking A as "pleasant listening / curious", and I
   read it as coy side-eye. The upward glance plus head roll is right, but the mouth still carries the warm smile, and the
   push-to-side is too weak to cancel it. Thinking C (looking down, pressed) is the best take. Fix: thinking takes zero the
   smile (mouthSmile at 0 or slightly negative), add a stronger one-sided brow raise or knit, and press the lips. Make C the
   default and keep A as the rarer variant.
3. **The two concern takes look like duplicates.** gpt-5.6-sol says the second take is "nearly indistinguishable"
   from the first. The asymmetry is too small to register at viewing size. Give B a different head action (a small tilt
   and forward lean) and a different mouth (lips parted, corners down on both sides) instead of mirroring A.
4. **The turn is still a feature slide inside a frontal skull** (gpt, grok, and my eye on `f-40.3.png`). The ±20
   field now moves the parting and bun, and the far eye shrinks, but the jaw and cheek silhouette on the far side do not
   foreshorten, and grok still reads it as about 10°. This is the method ceiling the builder chose (no per-side layers).
5. **The surprise lower face is puffy.** The cheeks and jaw balloon around a small round O, so it looks blown-out
   rather than gasping. Lower the cheek-puff contribution on surprise, drop the jaw a little more, and widen the O by about 10%.
6. **The delight squint pinches** the lower lids into white slivers at the inner corners (gpt). Reduce cheekSquint on
   delight by about 15%.

Not judged here: phone fps. The SwiftShader proxy figure (12-13 ms work p95 at 4x) is a proxy, not a phone reading, and the
cheap-Android measurement is still a hard gate before Integrate.

## Blind Foundry judges (my grid, no builder notes)

My grid was sampled from the review clip: rest, talk (an open frame from the talk clip), thinking, delight, concern A,
surprise, playful, concern B and the 20° turn. Script: `scripts/character/puppet2d/judge-r6-blind.mjs`, which is the r5
prompt with the turn label changed to about 20°.

| model | score | same | headline |
|---|---|---|---|
| gpt-5.6-sol (taxila-brain) | **4.0** | yes | turn lacks foreshortening; concern takes duplicate; thinking reads curious; delight squint pinches; surprise mouth pasted-on |
| grok-4-20-reasoning | **4.0** | yes | thinking too similar to rest (smile too strong); concern mouth neutral; surprise O too round; turn reads ~10° |

r5 on the equivalent grid scored 3.7 and 3.7. Raw output is in `judge-r6/blind-sol.json` and `judge-r6/blind-grok.json`.

## Highest-payoff fixes, in order

1. **Forehead spike (cheap, blocking 4.0).** Find which layer owns the shard (a wisp tip or the hair underlayer under
   the fringe edge). Either clip it to the hair shell's rest silhouette or feather and recolour it into the hair, and pin
   the hairline to the brow warp so the brow raise cannot uncover it. Gate it the way teargate does: scan every frame for
   a dark run of at least 3 px below the hairline contour and above the brows, in a band about 30 px wide, which must
   return 0 on the full 45 s clip. Expected result: 4.0.
2. **Thinking and concern acting (cheap, warp keys only).** Zero the smile on thinking and make C the default; give
   concern B a different head action and mouth. Expected result: +0.1.
3. **Surprise and delight tuning (cheap).** Reduce the surprise puff and widen the O; reduce the delight squint 15%; add
   a small mouth micro-oscillation during held delight. Expected result: +0.05.
4. **METHOD CHANGE for 4.5: a far-side silhouette deform for the turn.** Painting feature layers is not needed. Add a
   jaw and cheek contour warp key that moves the far-side face outline inward and the near-side cheek outward, with a
   matching ear and hair-shell parallax offset, fitted to the painted 30° keys. Without it, both models cap the turn at
   "about 10°, feature slide", and the ceiling stays near 4.2.
5. **METHOD CHANGE for 4.5: an acting layer.** Add authored per-emotion head and shoulder motion curves (a lean in on
   concern, a chin tuck and look down on thinking, a small bounce on delight), so each emotion is carried by body acting
   and not only by the face. That is what separates a premium studio puppet from a well-rigged face, and it is where Lily
   gets her life.
6. **The phone reading.** The owner opens `demo.html?facerig=1` on the cheap Android and records fps and work p95.

## Verdict

That is her, and the motion is alive and smooth. The lip-sync is now good enough to ship. One full-size artefact (the
forehead spike) keeps it at 3.9. After fix 1, I expect 4.0 to 4.1, which is shippable but not the owner's 4.5. Reaching
4.5 needs fixes 4 and 5, which are changes of method.
