# JUDGE r8: 2D puppet, polish r8 (base P)

Date: 2026-10-05. The judge is a harsh art director. I used my own eyes on full-size sheet cells and on clip frames: a 1 fps contact sheet of the whole 45 s, 15 fps strips of the talking, the thinking entry and the bun/collar edge, and 5 fps strips of the concern and the turn. I also got two blind Foundry vision opinions on my own grid.

**Score: 4.1 / 5. Ship-quality (ready), but below the owner's 4.5 bar.** r7 was 4.0. The builder self-scored 3.9.

## What r8 fixed, confirmed by eye

- **Thinking (UP, default take).** It now follows c-thinking.webp: eyes up and to one side, one brow raised, a one-sided closed mouth, no smile, and a head tilt. At full size it reads as "hmm, let me think", not side-eye. It is still slightly drier than the concept. In the concept the raised brow arches higher, and the mouth pushes into a clear sideways moue with a little lip volume on that side. In r8 it is a thin, flat line. Both blind models still find a faint sceptical undertone. (cells1.png, tear.jpg row 3)
- **Thinking entry.** At 15 fps (t = 22.8 to 23.8) the smile-to-think transition is smooth: the gaze lifts first and the mouth settles after. Nothing pops.
- **Teargate hit at t = 23.23.** I looked at frames 694 to 701 at full resolution (bun.jpg) and saw no tear at the bun/collar junction. **Not a defect.** One minor note: the bun's lower contour has a slightly grainy, dark fringe where it meets the cream background, which is just visible at 1:1. It is cosmetic, but a premium puppet would have a clean edge there.
- **Concern B.** The pout is gone. Lips parted, corners down, inner brows up: it reads as worried or dismayed, not petulant. The mouth is still a little flat and wide, like a "grimace" rectangle. The concept would want a softer, rounder lower lip.
- **Surprise.** The lower face now answers the O. It is better, but the O is still the most "pasted on" mouth in the set. The interior is a strong red and the lower-lip rim is heavy. Grok calls it "harsh, elongated".
- **Turn.** This is the biggest gain of the round. The nose tip, bindi and mouth line now lead the turn, the far outline sits outside the far eye, and at ±20° it reads as a real three-quarter view (cells2.png, turn.jpg, motion-turn-r8.jpg). The remaining tell is the **lighting**. The shading stays frontal: there is no shadow plane on the far side of the nose bridge and no darkening of the far cheek, so the face still feels a bit "slid" rather than turned. Sol still says the turn is "mostly sliding features sideways". The "far nostril tucks" choice reads correctly to me. I accept the builder's departure from my spec.
- **Feature-scale lock.** Across the 45 s I see no eye or brow scale drift. (Sol's "severe scale drift" on cell r3c2 is my own artefact: I cropped concern B from the sheet at a different framing. Discount it.)
- **Lip-sync.** Unchanged from r7 and still excellent at 15 fps: real closures, aa/E/O, teeth, tongue tip on t/d/l, and a quick return to the rest smile between phrases (lips.jpg).
- **Life.** Blinks have in-betweens, the idle drift never stops, and the wink/playful read is charming. Identity holds in all 45 contact frames.

No popping, tearing or uncanny moment anywhere in the clip.

## Blind Foundry judges (my grid, no builder notes)

I used the judge-r6/r7 prompt unchanged (`scripts/character/puppet2d/judge-r8-judge-blind.mjs`, a copy of judge-r7-blind.mjs). The grid has 8 cells from the r8 clip (t = 0.5, 11.4, 25, 30, 33, 35, 37, 40.6) plus concern B from the frames sheet. REF is c-front.

| model | score | same? | main complaints |
|---|---|---|---|
| grok-4-20-reasoning | 3.6 | yes | concern brows too angular/adult; surprise inner mouth harsh; turn edge reads as a "2D cutout" |
| taxila-brain (sol) | 3.6 | yes | turn "built by sliding features"; lower face "rubbery" on delight and surprise; thinking slightly sceptical |

Both scored r7 at 3.8 / 3.6. They do not reward the r8 gains, and their remaining complaints match mine: the turn has frontal lighting, and the open-mouth lower face is rubbery. Neither flags a rendering artefact.

## Why it is 4.1 and not 4.5

A premium studio puppet (Duolingo Lily tier) has three things r8 still lacks:
1. **Turns that re-light.** In r8, form moves but light does not.
2. **Open mouths that deform the cheeks and chin like soft volume.** Today it is a 2D shape over a fixed face.
3. **Acting poses that match the concepts' exaggeration.** Thinking and concern are correct but timid next to c-thinking.

## Highest-payoff fixes (in order)

1. **METHOD CHANGE: yaw-driven relighting of the turn.** This is needed for 4.5 and costs no image spend if done procedurally. Add a shading term keyed on yaw:
   - a nose-bridge side-plane shadow on the far side;
   - far-cheek and far-temple darkening of about 6-10% luminance in a soft gradient;
   - a near-cheek highlight shift toward the near side;
   - a slight occlusion shadow where the far eye socket meets the nose root.
   Fit it by eye to the painted 30° keys, the way SIL.far was fitted. If procedural light cannot match the Memoji soft shading, the fallback is to paint a yaw ±30° shading overlay pair with the image model (about USD 1-2) and crossfade it with |yaw|.
2. **Lower face as soft volume on open mouths (surprise, delight, aa).**
   - Drive cheek puff and nasolabial softening from jawOpen and mouthSmile.
   - Thin the lower-lip rim on the O and warm or desaturate the interior red by about 10-15%.
   - Round the O slightly narrower at the top.
   This is the "rubbery" read both models give.
3. **Thinking: push toward the concept.**
   - Raise the raised brow by about 30% more, with a higher arch.
   - Give the one-sided mouth volume: on the push side, a slight mouthPucker and lower-lip push (shrugLower about 0.2) so it reads as a moue, not a thin line.
   - Move the gaze about 3 px further up.
   - Keep the inner-brow lift that removed the scepticism.
4. **Concern B.**
   - Soften the parted-lip rectangle with a rounder lower lip and corners down with a slight curl.
   - Lower brow angularity by about 20%. Grok reads the brows as "sharp, adult".
5. **Bun edge.** Clean the grainy dark fringe on the bun's lower contour: a premultiplied-alpha edge or a 1 px feather on that mask.
6. **Clip coverage.** Put concern B in the review clip, so it can be judged in motion and not only as a still.
7. **Phone gate (owner, hard gate before Integrate).** Open demo.html?facerig=1 on the cheap Android and read fps and work p95. The SwiftShader proxy (p95 12.7 ms at 4x throttle, at parity with r7) is not a phone reading.

## Evidence

All files are in `docs/design/teacher/puppet2d/judge-r8/`:

| file | contents |
|---|---|
| grid_X.jpg, ref.jpg | the blind grid and its reference |
| blind-sol.json, blind-grok.json | the two blind verdicts |
| contact.jpg | 1 fps, 45 s |
| tear.jpg | thinking entry, 15 fps |
| bun.jpg | frames 694 to 701, full resolution, at the teargate hit |
| lips.jpg | talking, 15 fps |
| conc.jpg | concern beat, 4 fps |
| turn.jpg | turn, 5 fps |
| cells1.png | thinking UP, UP2, concern B, surprise |
| cells2.png | turn ±20, delight at +20, O at -16 |
