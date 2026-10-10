# Stage C blind judges (live puppet), n = 5 per round

Method: `scripts/character/puppet2d/lamp1/judge-live.mjs` (prompt verbatim in each `judge-live-C*-*.json`). Image 1 = the
approved graded rig front; image 2 = 8 moments of the 15 s scene in the lesson-desk window (375 x 405 CSS px at 412 x 915);
image 3 = 6 consecutive frames at 15 fps while she speaks. 3 x gpt-5.6-sol (taxila-brain, reasoning medium) + 2 x Kimi
K2.6 (taxila-kimi26). The judges are not told what the frames should show or what product it is.

| round | n | same person (>= 4/5) | childish (<= 1/5) | uncanny (<= 1/5) | moving photo (<= 1/5) | premium 1-5 |
|---|---|---|---|---|---|---|
| C1 | 5 | 5/5 | 0/5 | **4/5** | 1/5 | 3, 2, 2, 2, 3 (mean 2.4) |
| C2 | 5 | 5/5 | 0/5 | **5/5** | 1/5 | 3, 3, 3, 2, 2 (mean 2.6) |
| C3 | 5 | 5/5 | 0/5 | **3/5** | 1/5 | 3, 2, 3, 3, 2 (mean 2.6) |
| C4 | 5 | 5/5 | 0/5 | **4/5** | 0/5 | 3, 3, 3, 2, 2 (mean 2.6) |

C1 = first full build; C2 after polish 1 (per-face preset overrides: smaller thinking glance and listening tilt; 13 deg
turn; tongue / teeth tint); C3 after polish 2 (glance mostly aside, listening barely pitches, neck follows the jaw deeper,
ivory teeth, a lighter cavity); C4 after polish 3 (the iris's upward travel halved and the lid lifts with it, which also
covers behaviour's speaking aversion; the neck follow shallows toward the lapels).

**Verdict: the uncanny gate fails after the third polish round (4/5 in C4; best 3/5 in C3). Kill rule applies: stopped.**
Same person, not childish and not a moving photo pass in every round. What the judges keep naming, in order of frequency:
the eyes during a glance (upward gaze, "misaligned"), features "sliding" over the head on the 13-20 deg turn, the teeth as a
flat strip and the mouth interior changing between consecutive frames, and hair tips / earrings shifting.

## Calibration and one diagnostic (same protocol, n = 5 each)

| run | n | same person | childish | uncanny | moving photo | premium 1-5 |
|---|---|---|---|---|---|---|
| R8cal | 5 | 5/5 | 0/5 | **0/5** | 0/5 | 4, 4, 4, 3, 3 (mean 3.6) |
| D1noturn | 5 | 5/5 | 0/5 | **5/5** | 3/5 | 2, 3, 3, 2, 2 (mean 2.4) |

- **R8cal**: the shipped r8 puppet through the very same page, scene, slot and prompt (the lamp1 runtime renders the r8 pack
  pixel-identical, `r8-parity.json`). It passes every gate: uncanny 0/5, premium 3.6. So the protocol can be passed, and
  lamp1 is measurably worse than what ships today under it.
- **D1noturn**: removing the eval-only 13 deg turn does not help (uncanny 5/5, moving photo 3/5). The judges' reason is the
  warp itself on a semi-realistic painted face: "the texture morphs over the head", "proportions swim between frames".
- Reading: the r8 arm-P method (warping one painted front) carries a soft, 3D-cartoon face (r8); on the flatter, more
  realistic Lamplight front the same warps read as a moving photo. This is a style x method result, not a tuning gap.
