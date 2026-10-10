# Proposed context entries: Asha round 4 (option 4 "Lamplight flat"), 2026-10-10

Proposed by the Asha round-4 agent for the main loop to merge into `context/`. Evidence paths are relative to
`docs/design/round4/asha/`. Every number names n, method and date.

## Decisions (each with what would reverse it)

- `r4a-outfit-o6` **Asha wears a rust cardigan over a teal print kurta (o6), on the Lamplight flat face.** Owner confirmed
  2026-10-10 after the blind outfit tally (o6: lineup-2 overall 5/5, cardigan friendliest 10/10, parent-professional
  5.0, Indian 5/5; `evidence/tally-outfit.md`). Reverse if: the owner picks another, or a lineup with real parents /
  children (not model judges) prefers another outfit.
- `r4a-rig-front-b` **The rig front is rig-b (o6 plus one more age step), skin graded half-way to MST 6** (kC 0.7262,
  dL* -3.35; patch mean L* 61.8 -> 58.4, C* 65.3 -> 46.4; `evidence/skin-B.json`). Reverse if: the owner wants a
  different tone, or a full-MST-6 grade reads better to real viewers.
- `r4a-one-teacher` **One teacher: Asha teaches classes 1-9; Arjun, the draft Uma and every teacher-choice step go**
  (owner 2026-10-10). Classes 5-9 take the register written and tested for them (Arjun's sheet: notes + protégé
  Bittu), with only the role word changed; classes 1-4 keep hers. Prepared as `integrate/05*.patch`, not applied.
  Reverse if: the owner wants a second teacher back, or measured lessons show the older register failing older children
  under her name, voice or "didi" address.
- `r4a-look-switch` **The grown-up Asha (lamp1) ships, if at all, behind `face.look` (`?look=lamp1`); the default stays r8.**
  One runtime renders both (`evidence/r8-parity.json`). Reverse (apply `integrate/04`) when a lamp1 build passes the same
  blind protocol r8 passes: uncanny <= 1/5 and premium >= r8's 3.6 (`evidence/judge-live-tally.md`).
- `r4a-region-views` **A framing is a region `[x0, y0, w, h]` fitted contain-centred; the poster uses the same fit in CSS
  container units.** Wide windows (Home 319 x 172) never crop her chin; one poster serves every window. Reverse if: a slot
  needs a crop the region cannot express (a face-only close-up of a wide frame).
- `r4a-bilabials-from-text` **When Azure gives a b / m / p word no viseme 21, the mouth gets one from the word text**
  (`integrate/06`). Reverse if: the 24-line battery shows the inserted seals mistimed more often than they help, or
  Azure's Hinglish visemes start carrying the seals.
- `r4a-flat-unmix` **Layer edges on a flat painted ground are unmixed against the known ground colour** (alpha from the
  distance to the cream, colour = (pixel - (1 - a) cream) / a; each edge pixel owned by its nearest layer). Reverse if:
  a front arrives on a textured or gradient ground (then r8's two-colour matte is the right tool).

## Measurements

- `r4a-ms-rest-ssim` Rest gate: head SSIM 0.9734 at 1024 px, 0.9741 at 720 px (gate >= 0.97); eyes 0.955, mouth 0.981,
  hair top 0.974, chin-neck 0.981 (n = 1 rest frame per size; live rig through `harness.mjs`, SwiftShader, life still,
  idle smile 0.045; vs the graded front with the cream mapped to the clear colour; SSIM gaussian 1.5 on the channel
  mean; `evidence/rest-ssim-*.json`; 2026-10-10). Was 0.9454 before the cut fixes (iris circles refit, catchlights
  re-centred, painted lid shadow kept, face overscan off the ears and bun, flat-ground unmix).
- `r4a-ms-pack` Pack: 156.8 KB on the wire (WebP layers 143.2 KB + geom.json 13.6 KB gzip), 183.3 KB raw, + rest poster
  50.7 KB (gate <= 250 KB); WebP vs PNG composite SSIM 0.981 (`art/character/puppet2d/lamp1/pack-report.json`, 2026-10-10).
- `r4a-ms-fps` fps, headless Chromium + SwiftShader (software GL), demo page with one slot, her line playing, 10 s per run,
  CDP CPU throttle, 2026-10-10 (`evidence/fps-*.json`): 80 px speech-row circle (canvas 160 px) 58.7 fps at 1x, 57.3 at
  4x (gate >= 50 on the smallest slot); lesson-desk window 375 x 405 at DPR 2 (750 x 810 canvas) 14.9 at 1x, 10.5 at 4x,
  bound by software raster. Not a phone measurement.
- `r4a-ms-bilabials` Bilabial seals on one Diya DragonHD Hinglish line (n = 9 b/m/p words; rig lip gap per 60 Hz tick,
  `capture.mjs` log, 2026-10-10; `evidence/stageC-log-412.json`): Azure's visemes alone 5/9 sealed (gap 0.00 px at every
  viseme 21; baarah, pencil, dabbon, batao had none); with the text rule 9/9 (gap <= 0.12 px).
- `r4a-ms-blinks` Behaviour's blink rate while she speaks: 6 blinks in 7.8 s = 46 per minute (production behaviour.ts,
  unchanged; n = 1 scripted 15 s scene, 2026-10-10). Twice the 20-26 per minute usually cited for speech: worth a check.
- `r4a-ms-safety-calm` Safety calm on the lamp1 rig: speaking smile 0.000 (normal run 0.042), no listening nods (pitch max
  0.08 deg vs nods of 7.6 / 8.7 deg), the eval warm emote held at 0 (n = 1 scene each, same seed, 2026-10-10;
  `evidence/stageC-log-412-calm.json`).
- `r4a-ms-r8-parity` The r8 pack through the lamp1-derived runtime: pixel-identical on 12 poses (rest, aa, PP, O, E, DD,
  blink, smile, yaw +-20, brows, gaze up; max |diff| 0; harness, SwiftShader, fixed clock; `evidence/r8-parity.json`;
  2026-10-10).
- `r4a-ms-judge-live` Blind judges on the live puppet (n = 5 per round: 3 gpt-5.6-sol + 2 Kimi K2.6; ref still + 8 scene
  moments + 6 consecutive 15 fps frames at the 375 x 405 desk window; `evidence/judge-live-tally.md`; 2026-10-10):
  lamp1 C1-C4 same person 5/5 every round, childish 0/5, moving photo 1, 1, 1, 0 /5, uncanny 4, 5, 3, 4 /5, premium mean
  2.4, 2.6, 2.6, 2.6. Shipped r8, same page / scene / slot / prompt: uncanny 0/5, moving photo 0/5, premium 3.6.
- `r4a-ms-identity-B` Stage B stills, blind 3 x 2 grid (n = 5, two families): same person 5/5, identity 5, 5, 4, 5, 5,
  nothing childish / uncanny / disapproving (`evidence/idcheck-B-*.json`, 2026-10-10).
- `r4a-ms-slots` The face slots in today's app, CSS px, from the audit shots (`docs/design/round4/audit/shots`, 1x, read
  2026-10-10): lesson-desk window 325 x 316 (360 x 800), 375 x 405 (412 x 915), 440 x 440 (1366 x 768); play / work
  speech-row circle 80; child Home card 319 x 172 / 319 x 240 / 279 x 312; onboarding Meet 220 x 222; Summary about 78 x 100.

## Rejections (what was tried, what broke)

- `r4a-rj-warp-on-realistic-front` **The r8 arm-P method (one painted front, warped) on the Lamplight flat front.** After
  three polish rounds the blind judges still read it uncanny 4/5 ("the texture morphs over the head", "proportions swim",
  "eyes roll up", "teeth a flat strip") and premium 2.6, while r8 under the same protocol scores uncanny 0/5, premium
  3.6. Removing the 13 deg turn made it worse (uncanny 5/5, moving photo 3/5). The more realistic the painted face, the
  more a 2D warp reads as a moving photo. What might reverse it: painted keys per viseme, gaze and lid state (swap, not
  warp), far less motion amplitude, or a less realistic front.
- `r4a-rj-two-colour-matte-flat` r8's two-colour matte on flat art read the painted brown outlines and pale rims as
  half-transparent hair: ragged, shrunken silhouettes (head SSIM 0.955 -> 0.973 once replaced by the flat-ground unmix).
- `r4a-rj-face-overscan-under-ears` r8's face overscan reached over the ears and the bun, which are drawn BEFORE the face:
  skin painted over the ear lobe, the stud and the bun's edge. Overscan only under layers drawn after the face.
- `r4a-rj-cfront-glance` c-front's thinking glance (gaze [21, 20] + one arched brow) and the full upward gaze travel on
  her front: "eyes roll upward, misaligned" (C1 4/5); also behaviour's speaking aversion [4.7, 10.1]. Per-face overrides
  (glance [15, 4], level brows, iris upward travel x 0.5, lid lifts with the gaze) softened it but did not clear the gate.
- `r4a-rj-neck-follow-to-collar` Letting the neck follow the head down to the collar (to carry her painted chin shadow on
  the turn) dragged the lapels: "a stray curved mark at the collar" (C3). The follow now shallows toward the sides.
- `r4a-rj-pins-and-wide-eye-hole` r7's hairline pins (a light block above a raised brow) and r8's wider eye hole (a seam at
  the inner canthus) do not carry to this front.
- `r4a-rj-o3-kimi` The o3 shirt-kurta front: Kimi K2.6 refused 2 of 5 calls (HTTP 400 content filter on an innocuous
  collared shirt), so o3 had n = 4. Plan for refusals in Kimi batteries.
- `r4a-rj-denim-trade` Denim (o2) read cooler (brain 4 / 4 / 4) but less parent-professional (4 vs 5): the cool axis and
  the professional axis trade off; the print kurta under a cardigan held both.
- `r4a-rj-age-ceiling` Age edits on the flat style plateau: every outfit and both rig fronts read 25-35 to the judges
  (rig-b 25-36, n = 5); the flat lamplight style itself caps how old she reads.
- `r4a-rj-tooling` Kimi K2.6 at max_tokens 3000 truncated a 3-image JSON answer (raise to 12000); Playwright element
  screenshots time out after long SwiftShader steps (use clipped page screenshots + gl.finish()).
