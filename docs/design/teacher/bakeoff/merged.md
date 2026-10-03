# Bake-off merged teal: ai-portrait-wrap identity on the procedural-v3 build (2026-10-03)

VERDICT.md steps 1-2, and step 3 attempted. The build is `node scripts/character/bakeoff/merged/build.mjs --solve-g9 --reps 12`
(about 43 min on 4 vCPU, CPU only). It writes `public/assets/teacher-bakeoff/merged/teal/{H,Bplus,Blite}.glb` and `runtime.json`, and
the evidence set goes to `docs/design/teacher/bakeoff/merged/renders/teal/` (`contact.png`, turntable, emotions with the
encouraging clip, states, visemes, tiers, lip-sync MP4s, plates). `COMPARE.png` has a new MERGED row, built by
`python3 scripts/character/bakeoff/merged/compare.py`. Nothing ships: two VERDICT bars are still open (see "Open").

## Result against the VERDICT bars

| bar | result | evidence |
|---|---|---|
| parting wedge gone | **pass**: 0 skin-albedo texels inside the hairline mask, 0 uncovered gap texels; clean temples in the turntable. Residual: in chin-down frames the hairline edge at the crown still reads as a jagged skin/hair border | `teal/tex/tex.json` wedge; turntable, COMPARE |
| eyes not brighter than the skin | **pass on brightness**, but now errs dark: in the tier and lip-sync framing the eyes read as dark slits under the lid shadow. An eye-review item | contact sheet |
| G6 teeth at baseline (4) | **pass**: 4/300 at rest, at every viseme and tongue key, and at all 9 emotion presets (new: G6 now covers the presets); jawOpen 1.0 10 (iteration 2: 12) | `reports/teal.json` |
| G9 colour, hue not only L\* | **pass**: rendered L\* 54.9 C\* 27.6 vs MST 6 55.1 / 27.9; hue 55.8 deg against the reference's 55.9 deg | `renders/measure.json`, `reports/g9-solve.json` |
| 3/4 lower face (NME at yaw 24 <= 1.5x front; front NME <= 1.2%) | **FAIL**: front interior NME 1.23%; 3/4 at matched yaw 2.0% (21 deg) and 2.7% (26 deg); at yaw 24 2.7-3.0% (2.2-2.4x front) | see "3/4 likeness" |
| H brows not drawn on | done (ai-portrait-wrap's thinned cards over the projected brows, kept) | emotions |
| emotions >= 70% on 8 of 9, n = 12, second judge | **FAIL**: judge A 6/9, judge C 7/9, judge B 4/9 | `renders/emotion-check.json`, COMPARE |
| encouraging on a 2 s nod clip | done (25 fps MP4 plus a 6-frame strip for the judge): A 7/12, C 12/12, B 0/12 | `emotions/encouraging_clip.*` |
| delighted: no grimace, upper teeth, soft tongue, no black void | **pass by eye**: open smile with the upper row, warm interior, no lower-row gap | `emotions/delighted.png` |
| cheats | listening faces the camera (yaw 0) with a 12 deg tilt; playful has no half-wink (no lid glitch) | emotions |
| budgets | H 5.05 MB, 31.8k tris, 5 draws; B+ 1.79 MB, 16.8k, 5; B-lite 0.72 MB. H head skin 15.7k tris (the face draw with teeth, tongue and mouth bag is 17.9k) | `reports/teal.json` tiers |
| G1-G5, penetration, closures | 82/82 keys; G2 ok; G3 max 0.13 mm; G4 0%; G5 p95 <= 0.163 mm (sd0 and H); penetration 0 on all 5 pairs; lip-sync bilabial closures 9/9 (RMS arm 1/9, as logged) | `reports/teal.json`, `render.json` |
| lookalike check | renders **pass**, references **flagged** (see below) | `reports/realperson.json` |

Emotion scores, correct out of 12 (A = taxila-brain with the bake-off prompt; C = taxila-brain with the held-out prompt; B = taxila-fast with the held-out prompt):

| | warm | encouraging (clip) | curious | thinking | listening | concerned | delighted | playful | surprised |
|---|---|---|---|---|---|---|---|---|---|
| A | 12 | 7 | 8 | 12 | 7 | 12 | 12 | 12 | 12 |
| C | 12 | 12 | 5 | 12 | 7 | 12 | 12 | 9 | 12 |
| B | 12 | 0 | 0 | 0 | 0 | 10 | 12 | 4 | 11 |

## What was fixed, and how (each change carries a `merged:` or `FIX` comment in the code)

1. **Resting smile never reached the assets** (main pipeline and merged): the mesh now follows the Basis key after the bake.
   The fix was already in `scripts/character/blender/build_look.py`; this run verified it.
2. **Smile corrective on an asymmetric face**: the mouth corners are picked by vertex id on the symmetric base
   (`keys.mouth_corner_vids`). Also already in both pipelines; verified (G3 0.13 mm).
3. **New, same bug class, in both pipelines: `shift_parts` edited the Basis but not the mesh.** The join re-based every key
   on the unshifted mesh, so every key carried the configured teeth/tongue shift as a delta (on `base.blend`,
   `mouthSmileLeft` moved the teeth 2.83 mm and the tongue 3.2 mm), and the rest pose kept the unshifted teeth. This was
   most of the delighted grimace. Fixed in `scripts/character/blender/build_look.py` too. It takes effect on the next
   main-pipeline build; `public/assets/teacher/**` is untouched.
4. **Rigid teeth and tongue**: the MHCLO proxies had inherited every skin delta near the mouth. Now the upper row moves with
   no key, and the lower row and tongue follow each key's jaw component, measured on the chin (`report.teethRigid`).
5. **Narrower dental arch** (`mouth.teethWidth` 0.94, `molarTaper` 0.12): the canines came through the smile corners.
6. **Lid conform against the real eye surface** (ball plus cornea bulge, gaze +-15 deg, 0.35 mm margin), on the basis and
   per key, symmetrised on the topological mirror. This removed the dark dash under the iris. Residual: 1 lid vertex per
   eye inside the surface at the delighted preset only (`gates.lid_inside_eye_surface`); not visible.
7. **Parting wedge and temple flaps**: the projection's exclusion now follows the painted hairline's curve; v3's hairline is
   repainted over the projection at full strength inside the mask; the hairline table is look-overridable and lowered at the
   temples and the centre (`hair.v3.hairline`, used by cards, scalp paint and texture alike); a temple-band fill; and a
   gap metric in the gate.
8. **Skin**: a chroma clamp on the projected albedo (grey, blue and olive drift beyond 0.012 rg is pulled back; 43% of
   texels touched), a low-frequency tone transfer so the procedural areas (neck, under the chin, ears) carry the projected
   tone, and no projection on down-facing skin (the portrait's cast shadow had painted a grey-violet patch under the jaw).
9. **G9**: the solver goes to the reference hue (the earlier session's change) with adaptive damping (it was flipping between
   two gains, L\* 58.1 and 52.2). The gate samples the warm face with a neutral head, because a head pose moved the fixed
   patches on the face and the same build read L\* 52.6, 54.7 or 58.7.
10. **Pinned UVs and cull set** (`uvcache.json`, `cullcache.json` in the build dir): mm-scale edits re-packed the
    angle-based unwrap and the cull count drifted, so a texture baked on one build landed scrambled on the next.
11. **Presets** (`viewer/presets.js`): listening (pose and face), playful (no half-wink), delighted (open smile), curious,
    thinking (symmetric, no head roll), warm (no head roll), surprised (jaw 0.30, funnel 0.18 for G6). Curious, thinking,
    listening and warm were chosen against **judge A only** (n = 5-10 per variant); judge A is therefore not independent on
    those four. The encouraging clip adds a spoken "haan" mouth and brow lifts on each nod. The nasolabial wrinkle drive
    is halved (it drew a dark line at the smile corner).

## Measured, not obvious (candidates for `context/`)

- **Judge noise is large at n = 6.** The identical warm image scored 6/6 and then 3/6 under judge A. Select at n >= 10.
- **Head roll and one-sided mouth pulls read as "playful"** to these judges: warm 8/10 with a 4 deg roll, 10/10 without;
  one-sided thinking 0/10, symmetric 10/10.
- **taxila-fast (judge B) answers "warm" for almost any subtle still**: 0/12 on encouraging and thinking, which A and C
  score 12/12. It is not usable as a held-out expression judge. Judge C (same prompt, strong model) is the useful held-out check.
- **Listening sits between warm and concerned on a still**: less brow knit reads as warm, more reads as concerned. A
  "mm-hm" nod clip, like encouraging's, is the likely fix. That would need a logged decision.
- **The front likeness is texture-locked.** The front portrait is projected onto the mesh, so the front landmarks are
  largely painted on. The closed loop diverged once it fed front errors back into geometry (front 0.96 -> 2.83% in 2
  iterations with a valid texture). A 2.5 mm chin correction moved front nose-chin/IOD only 0.755 -> 0.762. Only the
  silhouette (profile) term is a pure geometry signal, and it is noisy (the "under" error swung 2.1-8.0 mm across iterations).

## 3/4 likeness (open)

Front nose-chin / IOD is 0.755 against the reference's 0.815, so the lower face is 7% short at the front. At 3/4 it is
0.886 against 0.919, only 3.5% short. Relative to its own front, the lower face therefore lengthens too much when the head
turns, which is the VERDICT's "too long at 3/4". The profile-only fit loop (`fitloop.py --front 0 --depth 0 --select
profile`, best iterate kept) is in the build. The bar is not met. The likely route is to re-project the texture per
iteration, so landmark error measures shape rather than paint (about 12 min per iteration on CPU), or to fit the
silhouette with more profile views.

## Lookalike check (`identity/realperson.py`)

- **Method:** OpenCV Zoo SFace embeddings (Apache-2.0) with YuNet alignment (MIT), cosine similarity, against 1,454
  detectable faces of 1,810 Wikidata public figures (1,149 Indian women public figures, 305 the most-linked women
  worldwide).
- **Calibration:** OpenCV's 0.363 "same person" point does not hold on this population: 93.6% of the real people have a
  *different* real person above it. The bar is therefore relative. A probe must stay below the gallery's own p95
  nearest-different-person cosine, 0.508.
- **Shipped renders** (warm, delighted, concerned, tiers H and B+, idle, neutral front): max 0.40, which is **pass**. That
  is below the gallery median of 0.44, so she resembles no one more than strangers typically resemble each other.
- **Caveat:** SFace rates these renders only 0.34-0.42 similar to their own reference portraits (portrait-to-portrait
  pairs score 0.83-0.93). So the render result is weak evidence.
- **Reference portraits:** `front_smile` (0.560) and `q3_left` (0.540) both have the same Wikidata person
  (`Q6167421`) as their nearest match. That is above the p95 bar, though under the gallery max of 0.597.
- **A human review of that match is owed before any child sees her.** If it holds, regenerate the reference set.

## Open (blocking ship)

1. Emotions: 8/9 under two judges is not met (A 6/9, C 7/9). Listening and curious are the gap under both.
2. 3/4 likeness bar (above).
3. Eye review: the eyes now read too dark in the tier and lip-sync framing.
4. Perioral tone: a brownish ring around the lips remains in the viseme close-ups.
5. Crown hairline edge in chin-down frames.
6. Human review of the reference-portrait lookalike flag.
