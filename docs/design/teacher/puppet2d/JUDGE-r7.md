# JUDGE r7: puppet2d polish-r7 (arm P)

Date: 2026-10-05. The judge is a harsh art director using their own eyes on full-size frames and clips, plus two blind Foundry vision models.
Candidate: `art/character/puppet2d/polish-r7/` (demo.html, frames-sheet.jpg, clip-review-r7-1024.mp4 and its three cuts).

## Verdict: 4.0 / 5. Shippable (4.0). Not at the owner's 4.5.

Strict, not rounded up. The only blocking defect from r6, the forehead shard, is gone at full size in every brow raise.
Nothing pops, tears or turns uncanny in the 45 s clip. Lip-sync is the best of any round. By the bar's definition ("that is her, animated, premium, ship it"), this is
4.0. Two acting reads, thinking and concern B, are still wrong, and the turn is still a slide inside a mostly frontal head. Those three
are why it is not 4.3 or higher. Reaching 4.5 needs the acting fixes below plus one change of method on the turn.

The blind models scored my grid 3.8 (grok-4-20-reasoning) and 3.6 (taxila-brain / sol). Both said "same character". That is lower than
their r6 4.0 / 4.0, but the grid is not comparable. I sampled it from the r7 clip, and its thinking cell is the new default take C, which both
models read as "sceptical / displeased". Every defect they listed is an acting or turn read. Neither model flagged a rendering artefact.
I weigh my full-size and motion review above their grid scores. The models are not shown motion, and at grid size they cannot see what
decides "premium" in this product: the absence of artefacts in motion.

## What I checked and what I saw

| check | evidence | result |
|---|---|---|
| Forehead shard (r6 blocker) | `judge-r7/fore.png` (delight t=31.0 and surprise t=35.8, full size) | **Fixed.** The hairline is clean. The brow tails tuck under the hair with a soft painted strand tip and no aliased dark piece. I agree with hairgate's 0 of 1,356. |
| Identity, 1 fps over 45 s | `judge-r7/contact.jpg` | It holds. She looks like c-front in every frame. Rest SSIM is 0.962. |
| Lip-sync at 15 fps | `judge-r7/mouth.jpg` | Real closures between words, an aa-to-E spread, an O, f/v with teeth on the lip, a tongue tip, and soft lip-rim lighting. No frozen mouth. It reads timed to the voice. This is premium. |
| Blink and idle at 10 fps | `judge-r7/s32.jpg` | The double blink has a believable half-lid in-between, and the brows and head drift continuously. The transition from warm into concern is smooth over about 0.6 s with no pop. |
| Delight, full size | f-30.5 | Lovely. It has the laugh bounce, a lit lower lip, and no pinched slivers at the inner lids. The mouth is a touch wide. Grok calls the teeth "too bright/square". That is minor. |
| Surprise | grid r2c3 | The puffed lower face is much reduced, and the O is bigger. Sol still calls it "a rigid oval pasted on": the cheeks and chin do not answer the jaw drop. |
| Turn, full size | `judge-r7/turn.jpg`, `turnfull.png` | Clearly better than r6. The silhouette moves, the far ear tucks, and it reads as about 20 degrees in motion. But the nose, the bindi and the mouth stay frontal, and the far eye sits right on the outline at -20°. Sol: "only the gaze and silhouette imply a turn". |
| Thinking (C default, C2, A) | `judge-r7/think.png` | **Weakest state.** Take C (eyes down, flat press, chin tucked) reads as shy or downcast at full size, and as sceptical or side-eye in motion (grid r1c3). It is not "hmm, let me think". c-thinking.webp is the target. It shows eyes UP and aside, one brow up, and the mouth pushed to one side in a pursed half-pout. Take A is closest to it but lacks the mouth shift. |
| Concern B | `judge-r7/concern.png` | It is now distinct from A (other tilt, big lean). The near-closed pout with the protruding lower lip reads as petulant or sulky (both models and me). Concern A and C are good. |
| Performance | builder's proxy | SwiftShader at 4x throttle: p95 10 ms. **The phone is still unmeasured.** This remains the hard gate before Integrate. |

## Blind Foundry judges (my grid, no builder notes)

Prompt: the judge-r6 / r7 prompt, unchanged (`scripts/character/puppet2d/judge-r7-blind.mjs`). The grid is 8 cells from the r7 clip plus concern B
from the frames sheet. It is `judge-r7/grid_X.jpg`.

| model | score | same | headline |
|---|---|---|---|
| grok-4-20-reasoning | 3.8 | yes | Thinking reads as "skeptical side-eye". Delight teeth are too white and square. The surprise O is too wide. |
| taxila-brain (sol) | 3.6 | yes | The turn is too frontal. Thinking reads as suspicion. The surprise O looks pasted on. The concern B pout is petulant. Features drift a little across cells. |

## Highest-payoff fixes to reach 4.5 (in order)

1. **Thinking: re-target to c-thinking.webp and make that the default** (warp tuning, no repaint). Use eyes up and to one side (gaze about (+18, +20)), one
   brow up with the other neutral and no knit, and a head tilt of 6-8° toward the raised brow. The key is a one-sided mouth: shift the closed mouth 6-10 px
   toward the raised-brow side, with mouthPress on that side and a slight pucker (mouthRollUpper 0.2), so it is the pursed "hmm". Use smile 0. Keep take C (looking down) as
   the rare variant only. Add a slow 1-2 px gaze micro-search while held. Expected: both models read "thinking" and it matches the concept 1:1.
2. **Concern B: replace the pout** (warp tuning). Keep the tilt and the lean, but give it parted lips (jaw 6-8 px) with both corners down and the
   lower lip *not* forward: set mouthShrugLower to 0 and mouthLowerDown to about 0.2, with inner brows up. Gate the upper teeth so they stay hidden by
   capping upper-lip raise. This is "oh no, are you okay?" rather than sulking.
3. **Surprise lower face** (warp tuning). Drive a chin drop and slight cheek *thinning* from jawOpen on the O: the cheeks narrow 3-5 px per side
   and the chin moves down with the jaw. That makes the face answer the mouth instead of an oval being pasted on. Also soften the teeth on delight: lower the
   teeth-layer value about 8% and round the corners.
4. **METHOD CHANGE, turn: rotate the interior features, not just the silhouette.** Add a nose plane key (the nose tip shifts toward the turn side by
   about 0.6x the far-outline travel, and the near-side nostril wing is foreshortened), move the bindi and the philtrum/mouth centre-line onto the same
   cylindrical mapping (mouth centre about 0.5x), and compress the far eye horizontally (about 0.85 at 20°) rather than only shrinking it. Fit it to the painted 30° keys
   as silDx was. Without this, the turn caps both models at "glance with a frontal face". This is the single biggest gap to 4.5.
5. **Feature-scale lock across expressions** (rig audit). Sol notes the eye and brow scale drifts between cells. Check that expression warps
   never scale the eye whites above 1.03x of rest, except on surprise.
6. **Phone gate (owner).** Open demo.html?facerig=1 on the cheap Android and read fps and work p95 before Integrate.

Items 1-3 are a single tuning round with no image spend. Item 4 is a new warp key family and the round that decides 4.5.

## Evidence

`docs/design/teacher/puppet2d/judge-r7/`: grid_X.jpg, ref.jpg, blind-sol.json, blind-grok.json, contact.jpg (1 fps), fore.png
(forehead at full size, delight and surprise), mouth.jpg (15 fps talk), s32.jpg (10 fps blink and concern transition), turn.jpg (4 fps turn),
turnfull.png (full-size turn), think.png, concern.png.
