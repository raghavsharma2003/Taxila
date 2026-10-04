# JUDGE r3 — 2D puppet, arm P, polish r3

Date: 2026-10-04. Judge: harsh art director. Owner bar: 4.5/5 (4 = "that is her, animated, premium, ship it").

## Verdict: 3.8 / 5. Not ready.

This is strict and not rounded up. The builder scored it 3.9. The blind panel's mean was 3.73, from gpt-5.6-sol at n=3 on the final iteration (3.8, 3.7, 3.7), and every run said "same character". r2 was 3.5. The gain is real but small, and almost all of it comes from removing defects. Very little comes from new expressive range.

## What I looked at
- `polish-r3/frames-sheet.jpg` against `c-front.png` at full size and at thumbnail.
- `clip-review-r3-1024.mp4`:
  - a 1 fps overview of the full 45 s;
  - the turn sweep at 3 fps, from 38.5 to 45 s.
- `clip-talk-15s-r3.mp4`:
  - a mouth crop at 15 fps over 4 s;
  - full-resolution mouth crops every 9th frame over 6 s.
- The 9 blind JSONs in `judge-r3/`. I read the final iteration, c1 to c3, in full.

## What is now genuinely good
- **No popping or tearing anywhere in motion.** The mouth is one continuous shell. Pauses blend, and the corners never snap back to the rest smile. The r2 "pasted mouth" tell is gone.
- **She talks through her smile, like c-talking.** At thumbnail size she reads as warm and speaking.
- **Blink.** The closed key is a clean crease arc. The 2-1-3 curve reads as a real blink in motion, with no smear.
- **Seams are gone at full size.** That covers the brow-tail fragment, the earring chips, the dark speck and the backdrop line. Rest is c-front (SSIM 0.985).
- **Identity holds across all 11 expressions.** Thinking, delight and playful are close to the concepts, and the playful half-lid is clean.
- **Turn.** The hair silhouette and bun now move with yaw, and the far eye stays round. It is much better than r2's reptilian oval.
- **Payload** is 105 KB, inside the budget.

## What blocks 4 (shippable)
1. **Articulation is monotonous. This is the biggest gap left in motion.** Stepping the full-resolution talk crops:
   - Nearly every frame is the same shape: a wide smile slit with an upper-teeth strip, and a gap that varies by a few pixels.
   - Mouth width barely changes, so there is no visible rounding for o/u.
   - There is no clean lip closure for m/b/p.
   - There is no visible tongue frame in the sample.

   The result reads as "smiling while mumbling", not as Hindi being spoken. All 3 blind runs read 'aa' as "cheerful talking, not a clean aa". I do not accept "that is the directive working": c-talking is one pose, and a talking-through-a-smile mouth still has to round, close and drop. The smile should bias the shape, not replace it.
2. **The teeth edge is lumpy and wobbly** at 1x in the full-resolution crops. The white strip has a ragged bottom contour that shimmers from frame to frame. A premium puppet never shows this.
3. **The turn is still partly a feature slide.** It is better at ±20, but 2 of 3 blind runs still call it "features sliding inside a frontal skull". In my turn sheet:
   - the nose and mouth stay frontal-shaped while the skull shifts;
   - the far cheek does not compress or occlude.

   The 1.25x extrapolation past the painted plate is unverified.

## What blocks 4.5 (the owner's bar)
4. **Concern and surprise are mild.** Surprise reads as "pleased oh". It needs:
   - raised and separated brows;
   - upper lids lifted to show sclera above the iris;
   - a dropped, rounded jaw.

   Delight lacks the eye-squint and cheek push (blind c3).
5. **The still mid-blink reads as sleepy or smug.** It is fine in motion, but captured frames and thumbnails will show it. Make the mid key asymmetric in timing: lids at about 0.6, with pupils partly hidden.
6. **Small proportion drift.** Blind c2 noted a "tinier nose, narrower jaw, smaller mouth" side by side. Check the mouth shell's rest width against c-front's lip width exactly.
7. **fps on a real phone is unmeasured.** That gates Integrate whatever the art score.

## Fixes, in order of payoff
1. **Change of method for the viseme parameter space. This is the biggest lever.** Re-derive the viseme vectors in `lips.js` so the shape varies independently of the smile:
   - Width: pucker/o/u at 0.6-0.7x of rest width; ee/E at 1.1x.
   - Closure: m/b/p go to full lip contact with a slight press bulge, held for at least 2 frames (66 ms) whatever the smoothing.
   - aa: jaw drop of at least 1.8x the current maximum, so the lower lip clears the teeth and the cavity shows.
   - f/v: lower lip tucked under the upper teeth.
   - Tongue: L/t/d show the tongue tip for at least 1 frame.

   Then cap mouthSmile while articulating, to about 0.5 of rest for rounded visemes, so the corners pull in. Use the smile only as a bias.

   Gate: in a mouth-crop strip of "chalo, aao, mama, bubbly", each phoneme must be identifiable by eye.
2. **Teeth.** Replace the procedural edge with the painted upper-teeth atlas contour, warped to the upper lip and clipped by the inner lip. Antialias the bottom edge, so there is no per-frame shimmer.
3. **Change of method for the turn.** This is the builder's own next step, and I endorse it:
   - Repaint yawR with the bun on the correct side (about USD 0.30).
   - Cross-dissolve the painted yaw plate into the frontal one while warping, both through the shared field. This is the real two-texture keyform blend.
   - Drop the 1.25x extrapolation. Paint a ±28 key if more range is needed.
   - Add far-cheek compression and nose-bridge occlusion to the key field.
4. **Expression range.** Raise the surprise, concern and delight targets by about 30-40%, and paint the missing pieces:
   - surprise: upper-lid lift with sclera above the iris;
   - delight: a squint lower-lid push.

   Check each against the c-expression concepts at thumbnail size.
5. **Mid-blink key.** Lids at about 0.6, with the brow dip kept. Keep the still frame out of marketing captures.
6. **Phone.** The owner opens `demo.html?facerig=1` on the cheap Android. Read fps and work p95 before Integrate.

Expected outcome: fixes 1 and 2 move it to about 4.1 to 4.2 (shippable). Fixes 3 and 4 are what carry it toward 4.5. Total image spend stays under USD 3 (ledger 8.76 of 30).

## Evidence
- Blind runs: `judge-r3/blind-{a,b,c}{1,2,3}.json`, `grid_X.jpg`, `ref.jpg`.
- Judge crops (session scratchpad, regenerable with ffmpeg from the clips):
  - overview at 1 fps;
  - turn sweep at 3 fps, 38.5 to 45 s;
  - talk mouth at 15 fps;
  - full-resolution mouth every 9th frame.
