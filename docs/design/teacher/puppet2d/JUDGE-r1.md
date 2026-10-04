# Puppet2D — Judge r1 (harsh art director)

Date: 2026-10-04. Candidates: arm **P** (painted layers cut from c-front + WebGL2 rig + gpt-image-2 mouth atlas) and
arm **V** (fully vector/parametric, fitted shading fields, no pixels).

**Verdict: winner = P. Score P 3.0 / 5, V 2.0 / 5. Not ready (bar is 4).** Small borrows from V are listed below. Do not merge the two rigs.

## What I looked at
- Both frames sheets at full size and at thumbnail size: `art/character/puppet2d/P/frames-sheet.jpg` and `art/character/puppet2d/V/evidence/frames-sheet.png`.
- **P clip** `clip-highlight-15s.mp4`:
  - a 2 fps contact sheet of all 15 s;
  - every frame (30 fps) of a 1 s talking window, as a mouth crop (`judge-r1/p_mouth30.jpg`);
  - full-size stills from delight (12.0 s) and the head turn (14.2 s) (`judge-r1/p_turn.png`).
- **V clip** `clip-v-15s-60fps.mp4`: a 2 fps contact sheet of all 15 s.
- **Blind Foundry vision run** (gpt-5.6-sol, `taxila-brain`, one call). The inputs were:
  - c-front;
  - two anonymised 2x2 grids (rest / talk aa / delight / yaw +20), with A = V and B = P;
  - script `scripts/character/puppet2d/judge-r1-blind.mjs`; raw reply in `judge-r1/blind-out.json`.

## Arm P — 3.0
**Strong (keep all of this):**
- **The rest pose is her.** Side by side at 1024 px I can barely tell it from c-front. The only difference is slightly softer eye detail.
- **Mouth atlas.** This is the best part of either arm.
  - Lips have volume. Teeth show as one curved row inside the lips.
  - The open shapes (aa, O, surprise) have a real cavity and the right Memoji finish.
  - Delight at full size is close to c-happy and reads as warm and premium.
- **Lip-sync motion** (watched frame by frame over 30 frames):
  - Shapes change on phoneme timing, and closures land on bilabials.
  - The 45 ms cross-fade shows no popping or double-lip ghosting.
- **The blink** has a proper lid wrap with the lower lid rising.
- **Idle and listening** have life: breath, small head drift, nods.

**Ship-blockers (in order of damage):**
1. **The head turn falls apart at full size.** At t = 14.2 s, about +yaw:
   - dark cut debris and a notch at the chin/neck/bun junction;
   - jagged, light-fringed edges on both side locks;
   - the far lock and ear clip.

   The blind judge independently called this "severe cutout/compositing debris … immediately unshippable". It also reads as a slide more than a turn: the features barely foreshorten.
2. **Lock edge matting at every pose.**
   - A white or light halo runs along the thin side locks, visible at 720 px even when she faces front (in the delight still too).
   - The jaw-to-bun cut edge shows on several stills.
   - This is the "cut-out puppet" tell, and premium dies on edges.
3. **Expressions are too subtle outside delight and surprise.**
   - Thinking does not match c-thinking: no head tilt, no raised brow, the eyes barely leave camera.
   - Concern, playful and listening read as "warm smile" (7/16 recognition).
   - The c-* concepts are bolder than the puppet everywhere except delight.
4. **Delight squint is uneven** (the left eye closes more than the right). The blind judge flagged it as off-model, and I agree it is slightly lopsided.
5. **Faint lid seam** along the top of the sclera at full size.
6. Not shown yet:
   - 60 fps on a real Android (proxy only);
   - surprise, playful and thinking-lips exist only as demo mixes;
   - nods are scripted.

## Arm V — 2.0
- **At thumbnail size it is clearly her. At full size it is not premium:**
  - blotchy, mottled skin from the RBF shading fit, most visibly on the forehead and cheeks;
  - a soft nose;
  - the eye region SSIM is only 0.81;
  - the mouth looks pasted on: a flat white teeth band, and open shapes that stay a smile-curve that is too narrow;
  - the blind judge called the talking "aa" "a pasted smiling grin, not an open aa".
- **Motion:**
  - The emotions are near-identical across the clip.
  - Thinking barely differs from rest.
  - The turn sweep was never checked in motion.
- **Payload** is 637 KB gzipped against a 120 KB budget.
- **Wins over P:**
  - Turns cannot tear (one shared dome).
  - Continuous parametric lids and brows.
  - These are architectural virtues, but they do not overcome the surface finish.

## Blind model opinion (gpt-5.6-sol)

| arm | same character | score | verdict |
|---|---|---|---|
| A (= V) | yes | 3 | wrong "aa" shape (grin with teeth); identity drift on the turn; delight emotionally flat |
| B (= P) | yes | 3 | turn compositing debris; turn reads frontal; delight mouth oversized, uneven squint |

The model preferred B (= P): it "preserves REF's facial proportions, rendering, costume and calm core identity more accurately … closer to ship quality once the turn-state compositing … [is] rebuilt". The model was gentler on V than I am. My full-size look at V's skin is the reason I score it a full point below P.

## Decision
- **Winner: P.**
- **Borrow ideas from V, not code wholesale:**
  - the shared head-dome depth for face and hair, so hair and face move as one surface on turns (this addresses P's tearing);
  - V's continuous brow-ribbon parameters, to get bolder brow acting for thinking and concern on top of P's painted brows.

  Keep P's painted skin, hair, eyes, mouth atlas and kurta.

## Fixes required for r2 (P)
1. **Turn rebuild:**
   - Fill the chin/neck/bun junction so no background or dark debris can show at any yaw or pitch in the range.
   - Add the 3/4 hair and lock sprite-switch, or the shared-dome warp, so the far lock and ear do not clip.
   - Increase feature foreshortening so ±20° reads as a turn, not a slide.
   - Check it in motion: render a dedicated clip of the yaw sweep and look at every frame.
2. **Re-matte the lock and hair edges:**
   - Use alpha with the background colour decontaminated, or premultiplied alpha with a 1-2 px erode plus a dark feather.
   - Test against both cream and contrasting backgrounds.
   - The goal is zero light fringe at 1024 px.
3. **Push the expressions toward the c-* concepts:**
   - Thinking: head tilt and roll, one brow up, eyes up and to the side, mouth pulled aside (match c-thinking).
   - Concern: inner brows up and lids slightly lowered.
   - Playful: asymmetric smile plus a brow.
   - Listening: a slight head tilt plus a soft smile, as in c-listening.
   - Target at least 12/16 on blind single-still recognition.
4. **Even out the delight squint** (symmetric cheek lift and lid close), and check that the delight mouth size is on-model against c-happy.
5. **Remove the faint top lid seam**: overlap the lid layer by 1 px with AA matched to the sclera.
6. **Add emitters to behaviour.ts and the Director:**
   - promote surprise, playful and thinking-lips from demo mixes to real emitters;
   - drive the nods from the real listening state, not a script.

   This needs the main loop's sign-off on the `behaviour.ts` change, or must stay as compositor presets.
7. **Real-device fps**: run step B1.2 on an actual Mali-class phone through `?facerig=1` before Integrate.
8. Re-judge on new full-size stills **and** a turn clip. Then run the two-family blind panel plus the sanity battery.

ready = false (best score 3.0 < 4).
