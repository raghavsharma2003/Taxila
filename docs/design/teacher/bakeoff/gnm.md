# Bake-off gnm: the teal teacher on Google GNM Head v3.0 (E-GNM1, 2026-10-03)

**Verdict (candid):** GNM is the best *base* any row has had. It is the first teal that reads, from the front and in
3/4, as one specific, believable Indian woman in her thirties rather than a MakeHuman face with a finish. Its likeness
in 3/4 and on the held-out views beats merged under the same protocol. Its mouth interior is GNM's own anatomy: the
teeth stay inside the lips in every pose (G6 0/300, merged 4/300), and the open mouth is a mouth, not a void. It
**does not clear the bake-off bars yet**:

- **Emotion (held-out judge):** 6/9 on judge C. Curious reads as listening (0/12 in both runs). Concerned and playful
  depend on the run. The judges are noisy enough that a texture-only rebuild moved playful/C from 10/12 to 2/12.
- **Yaw-24 likeness:** 1.71x the front value, against a 1.5x bar.
- **G5 lip gap (MakeHuman-era metric):** fails at rest by construction. GNM's scanned lips meet along a line, not over
  a flat seal. The light-through-lips test passes everywhere on H.

**Recommendation:** adopt GNM as the identity base (S1). Keep merged's expression craft *in GNM's space*; do not go back
to MPFB. Next: re-score curious/concerned with brow-specific designs, fix the three visible defects (below), then the
owner eye test. This row is evidence only. Nothing ships, and `merged/**` and `src/avatar/**` are untouched.

Build: `node scripts/character/bakeoff/gnm/build.mjs [--fit] [--solve-g9]` takes about 20 min on 4 vCPU, CPU only.
**No AWS GPU was used ($0; `scripts/gpu/status.py`: 0 live instances).**
- Assets: `public/assets/teacher-bakeoff/gnm/teal/{H,Bplus,Blite}.glb`, `runtime.json`, `plate/`.
- Evidence: `docs/design/teacher/bakeoff/gnm/renders/teal/`.
- Reports: `art/character/bakeoff/gnm/reports/`.
- COMPARE.png: a new **gnm** row, built by `scripts/character/bakeoff/verdict/compare.py`, which now also draws the MERGED row.

## What was built (each stage is a script in `scripts/character/bakeoff/gnm/`)

1. **GNM fetch and licence.** Code is github.com/google/GNM @ `940c36b8`. Weights are hf `google/gnm-v3` `v3_0/gnm_head.npz`
   (sha256 `61d78bbf…`, pinned in `gnm_model.py`, not committed). Both are **Apache-2.0**, verified against the
   licence texts and recorded in `art/character/LICENSES.md` (§ Bake-off `gnm`), with the verbatim licence in
   `art/character/bakeoff/gnm/third_party/`.
   - The GLBs are a derivative work, so the attribution "Face geometry derived from GNM Head v3.0, Copyright 2026
     Google LLC, Apache License 2.0" must ship with them.
   - The MediaPipe<->GNM correspondence is XR Blocks' `FaceCorrespondence.js` (Apache-2.0, from gnm-webcam-puppet,
     Apache-2.0). It has 473 pairs, a bias-cancelling reference cloud and 166 skull-fixed points.
2. **Identity fit** (`fit.py`). 170 head + 3 eyeball components, ridge prior λ=2 (chosen on the held-out views).
   - Terms: 2D landmarks on front/q45 L/R; skin-mask edges (ears, cheeks, jaw) on those views; the leading-edge
     silhouette of both profiles. MediaPipe fails at profile (it reads yaw 58-60° on near-90° portraits), so the
     profile cameras come from a silhouette-only grid search and ICP.
   - Result: front 0.96%, q45 1.08/1.17%, held-out q3 1.14/1.21% (2D reprojection, % IOD); profile edges 2.5-2.7% IOD.
     Coefficient rms 0.97 and max 4.0, so the fit stays inside the model.
   - Overlay: `art/character/bakeoff/gnm/fit/teal_overlay.jpg`.
3. **Keys in GNM's space** (`corr.py`, `keys.py`). v3's 82 key shapes are carried to GNM as targets: landmark RBF,
   then non-rigid ICP, then a label-constrained inverse map, so lips and lids cannot swap. Each key is then solved by
   ridge least squares over GNM's 382 expression components.
   - Median explained variance 0.85 (p10 0.71) over 56 solved keys; the Right keys are exact mirrors (G3 0 mm).
   - Contact terms: lids close by upper-lid-to-lower-lid-surface contact (G4 0%); PP and mouthClose seal by
     lip-to-surface contact.
   - Tongue keys are targets written on GNM's own tongue: tip-up 16°, curl 40°, wide +20%.
4. **Assembly** (`assemble.py`, `write_glb.mjs`).
   - **face** = GNM skin + teeth/gums (decimated to 1.6k tris at H) + tongue + mouth lining. The lining and the inner
     lips are tagged `_region` 3, so they shade as mouth interior. GNM's neck reaches the sternal notch, so no MPFB skin
     is needed.
   - The contract eye mesh is scaled to GNM's fitted eyeball (r 14.5 mm, at its eye joints).
   - v3's hair cards, lash cards, kurti and studs are carried by the displacement field and pushed out of GNM's skin.
   - Armature, framing and body are v3's. GNM keeps its metric size: v3's head was 5% smaller by landmark similarity.
   - B+: meshoptimizer collapses onto existing vertices (skin 7.2k tris, lips and lid margins locked), so the keys
     carry over exactly.
5. **Skin** (`texture.py`). Albedo is projected from the 5 TRAIN portraits only. The held-out q3 views are never
   projected, so their likeness numbers stay honest.
   - Projection uses visibility z-buffers and (n·v)^4 weights.
   - Excluded from projection: kurti, orange piping and eye whites.
   - Mild frontal de-shading. G9 gain solved to MST 6 at the reference hue.
   - Normal detail comes from the portrait's high-pass; the other maps are from GNM's own regions.
6. **Evidence** comes from the merged run's renderer, light, presets and judges, forked by `fork.mjs`. One addition:
   **per-face preset gains** (`viewer/presets.js` `GNM_GAIN`: concerned ×1.3, delighted ×1.6, playful ×1.6), chosen
   on judge A only (n=6/variant, `reports/rescore.json`). Judge C never saw a candidate.

## Gate table (H / B+ ; `reports/gates-H.json`, `gates-Bplus.json`; bars as merged's `build.mjs`)

| gate | bar | gnm H | gnm B+ / B-lite | merged (merged.md) |
|---|---|---|---|---|
| G1 names | 82 / 58 | 82 | 58 | 82 |
| G2 bounded, finite, non-empty | all | pass | pass | pass |
| G3 mirror | ≤ 0.5 mm | **0.00** (exact mirrors) | 0.00 | 0.13 |
| G4 lid seal (blink, +lookDown, +squint) | 0% | **0 / 0 / 0** | 0 / 0 / 0 | 0 |
| G5 lip gap p95, rest / PP / jaw .3+close .3 | ≤ 0.3 mm | **2.15 / 0.70 / 2.00 FAIL** | 2.15 / 2.01 / 1.98 FAIL | 0.13 / 0.23 / 0.14 |
| G5 aperture (light between the lips) | 0% | **0 / 0 / 0** | 0 / **5.0 (PP fold)** / 0 | 0 |
| G6 teeth/tongue outside lips (300 samples), rest → every viseme, tongue key (+jaw 0.4), emotion | no increase (≤ 4) | **0 → 0** everywhere (tongueOut 11, not gated) | 0 → 0 | 4 → 4 |
| lids inside the eye surface | 0 | 0, except **delighted 2** (×1.6 preset squint) | delighted 4 | delighted 1 per eye |
| garment penetration | 0 | 0 | 0 | 0 |
| G9 skin vs MST 6 (L\* / C\*, hue) | ±3 / ±4 | **55.3 / 27.7** vs 55.1 / 27.9 | – | 54.9 / 27.6 |
| teeth L\* p90 at jaw 0.3 | ≤ 80 | 42 | – | – |
| bilabial closures, aligned clip / RMS arm | ≥ 90% | 9/9 / 1/9 (driver, as logged) | – | 9/9 / 1/9 |
| budget | H ≤ 6 MB, 45k tris, 8 draws; B ≤ 2.2 MB, 18k, 5 | **5.07 MB, 41.9k, 5** | **1.81 MB, 13.8k, 5** / 0.76 MB | 5.05 / 1.79 MB |

Notes on the table:
- **G5-mm** was written for MakeHuman's lips, which are sealed by pushing vertices into a flat contact. GNM's scanned
  lips meet along a line. Every inner-lip vertex within 2.4 mm of the other lip counts as gap, so the rest pose reads
  ~2 mm while no light passes.
  - Forcing a seal in GNM's space flattened the lower lip into a slab (12-14 mm vertex shifts; rejected, `--rest-seal`).
  - The PP seal (weight 30) closes light at 0.70 mm but leaves a small V-notch at the upper-lip centre (visible on the
    viseme strip). Without the seal, PP looks natural but leaks 2.5% at a corner.
- **Morph texture at H is 19.4 MB**, 2× merged, because GNM has 14.7k face vertices × 82 targets. Doubled for three's
  JS copy that is 39 MB, inside the 45 MB resident H budget but tight. The H face is 28.2k tris against TEACHER-VISUAL's
  16k head target (deviation; merged is 17.9k).
- FPS (SwiftShader, host load 5-6, **not phone numbers**): H 2.6, B+ 7.6, B-lite 26.6 fps. An earlier run at lower load
  measured 3.4 / 10.2 / 35.7 fps. B+ and B-lite carry fewer tris than merged (13.8k vs 17.0k).

## Emotion check (`renders/emotion-check.json`, `reports/emotion-check-run{1,2}-summary.txt`)

Method: a blind 9-way forced choice, n = 12 per emotion per judge. A = taxila-brain with the bake-off prompt.
C = taxila-brain with the held-out prompt. Encouraging is judged on its 6-frame nod clip. Run 1 used the textures
before the eye-white/piping exclusion; run 2 is the shipped asset. Same geometry and presets in both.

| emotion | A run1 | A run2 | C run1 | C run2 | pooled A+C, both runs (n = 48) | merged A / C (n = 12) |
|---|---|---|---|---|---|---|
| warm | 12 | 12 | 12 | 12 | 100% | 12 / 12 |
| encouraging (clip) | 11 | 8 | 12 | 10 | 85% | 7 / 12 |
| curious | 6 | 4 | 0 | 0 | **21%** → listening | 8 / 5 |
| thinking | 12 | 12 | 12 | 12 | 100% | 12 / 12 |
| listening | 9 | 9 | 11 | 11 | 83% | 7 / 7 |
| concerned | 12 | 8 | 4 | 2 | **54%** → listening | 12 / 12 |
| delighted | 11 | 11 | 12 | 12 | 96% | 12 / 12 |
| playful | 11 | 12 | 10 | 2 | 73% | 12 / 9 |
| surprised | 12 | 12 | 12 | 12 | 100% | 12 / 12 |
| **≥ 70%** | 8/9 | 6/9 | 7/9 | 6/9 | **7/9** (79% overall) | 6/9 / 7/9 |

Reading the table:
- On the tuning judge A, gnm reaches the bar in run 1 (8/9) and not in run 2 (6/9). On the held-out judge C it misses
  in both runs.
- Before the per-face gains, the same check scored pooled 60%, 5/9. Delighted 21% and playful 0% both read as warm.
  GNM's in-space smile is the scanned smile, without the MakeHuman units' exaggeration.
- Gains on the solved keys themselves were ~1.0 (`keys.json amplitudeGain`), so the shortfall is in *shape*, not
  amplitude. Curious and concerned are brow designs: GNM's brow keys explain 0.86-0.94 of v3's targets but move less
  skin, and on this calm face the judge sees "attentive".
- Encouraging, 0/108 on stills in the earlier rows, scores 85% on the clip.

## Likeness (`reports/likeness.json`; same metric as merged's fit loop)

Method: MediaPipe on neutral H renders vs the reference, interior NME % IOD. The face camera is re-centred on the
turned head: merged's face camera swings the head half out of frame at 21-26°, which by itself put gnm's 3/4 error at
3.3-4.2%. merged's GLB was measured with the identical protocol (`reports/likeness-merged.json`).

| pair | gnm | merged (same protocol) | merged's own report |
|---|---|---|---|
| front (bar ≤ 1.2%) | **1.16 pass** | **1.03** | 1.23 |
| q45_left / q45_right at ref yaw 21 / 26 (TRAIN) | 1.54 / 2.20 | 2.51 / 2.79 | 2.0 / 2.7 |
| q3_left / q3_right at 18 / 21 (**held out**) | **1.38 / 1.44** | 1.84 / 2.09 | – |
| yaw 24 vs q45 L / R | 1.62 / 2.34 → **1.71× front, FAIL** (bar 1.5×) | 2.21 / 3.03 → 2.54× | 2.2-2.4× |

gnm is better than merged on every turned view, but its front value is 0.13 worse. The q45_right reference is the one
whose identity drifted most in generation, and it is the worst pair for both rows.

## My honest look at the renders (contact sheet, COMPARE)

**Better than any earlier row:**
- the lips, chin and jaw are anatomically real, from scans;
- the delighted mouth shows the upper row with the lower row hidden, and no grimace;
- the visemes show real dental anatomy (FF, TH, DD, SS read);
- the open aa is a mouth with a dark, warm interior;
- the profile has a believable neck-chin line;
- in the turntable she is the same person from every side.

**Defects I can see:**
1. **Dark under-eye circles and a slightly greasy, orange-peel skin at close range.** The portrait's shading is baked
   into the albedo, and the high-pass normal detail turns into pores under the contract key light. The de-shading is
   only half strength.
2. **A pale band at the top of the forehead** where v3's hair cards stop short of GNM's taller hairline. It shows in
   chin-down poses (encouraging, concerned).
3. **The PP V-notch** (above).
4. **Brows move too little for curious/concerned:** the judge confusion is real.
5. **The eyes are v3's contract eye mesh at GNM's size and position**, not GNM's own eyeball geometry. GNM's cornea
   apex is 16.2 mm vs ours 15.5 mm, because TaxilaEye's analytic iris assumes the contract mesh.
6. **Faint residue of the reference kurti neckline** on the upper chest (a lighter U where the piping was filled).
7. **The likeness review is still owed:** these are the same generated references merged flagged.

## Against the bake-off bars and the merged result

| bar (VERDICT / talking-avatars §5) | gnm | merged |
|---|---|---|
| front NME ≤ 1.2% | **pass** 1.16 | pass 1.03 (same protocol) |
| 3/4 at yaw 24 ≤ 1.5× front | fail 1.71× | fail 2.54× |
| ≥ 70% on 8 of 9, n=12, held-out judge | **fail** (C 6-7/9) | fail (C 7/9) |
| G6 at baseline | **pass, 0** | pass, 4 |
| G9 | pass | pass |
| budgets | pass (H morph memory 2× merged) | pass |
| owner eye test prefers GNM | **owed** | – |

**E-GNM1 status:** NME pass; held-out judge fail; owner eye test owed. On the axis the verdict said matters most (a
specific human, with the mouth interior as a real failure mode), GNM wins. On expression it ties merged on the
held-out judge.

## Reversal condition

Go back to the MPFB-based merged build only if one of these holds:
- after brow-design re-scoring, gnm still cannot hold ≥ 70% on 8 of 9 under the held-out judge while merged can;
- the owner's eye test prefers merged's face.

## Next (in order of payoff)

1. Re-score **curious and concerned** with brow-led designs on judge A, keeping C held out. Raise brow amplitude inside
   GNM's eye-region components with a dedicated brow-only solve.
2. **De-light the albedo properly** (the under-eye circles and the pores). Re-fit the **hair cards to GNM's hairline**.
3. Replace the PP seal with a constrained solve that keeps the upper-lip centre's curvature (removes the notch).
4. Run the slate and plum looks with the same code: `fit.py` takes any portrait set.
5. A GNM-native eye shader would let the eye mesh be GNM's own cornea and eyeball.
