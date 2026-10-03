# Bake-off: procedural-v3 (the scripted pipeline pushed to its limit)

Date 2026-10-03. Look built: **teal** only (the Asha design). slate and plum were **not** built in v3: their hair
(curls, a bun) and garments (a shirt over a tee, a saree with a pallu) need generators v3 does not have yet. Evidence
tags: **[M]** measured here, **[U]** my judgement.

## One screen

- **Emotion legibility: 37% -> 85% overall [M]** on the same vision forced-choice check (n = 6 per emotion, one look x
  6 reps). 8 of 9 emotions pass the 70% bar. **encouraging stays at 0/6**: it reads as "warm" on every one of
  17 variants I tried (n = 6-8 each). Because of that, **the build fails its own emotion gate**, as the brief asked.
  It exits 2 and names the emotion.
- **Every other gate passes [M]:** G1 82/82, G2, G3 0.11 mm, G4 0%, G5 on sd0 and on the new subdivided H face, G9
  (dL 0.1, dC -0.2), teeth L\*, garment penetration **0 on all 5 pairs**, and the H / B+ / B-lite budgets.
- **What changed, all built in-house by script from CC0 inputs:**
  1. emotion shapes built into the face units;
  2. hair generated as guide curves turned into clumped cards (the MakeHuman helmet hair is gone);
  3. modelled garments (relaxed cloth, a real collar, a placket, pocket flaps, buttons, piping), penetration-gated;
  4. skin micro-detail: zone pores, a micro tile, specular breakup, subsurface tint, peach fuzz, moisture;
  5. a subdivided face mask on H, with all 82 keys carried through it.
- **Honest verdict [U]:** a clear step up from iteration 2. Expressions now read, and the hair and clothes now look made
  rather than stock. It is still **not** the "crazy level", human-like face the owner wants. The base is still a
  MakeHuman head, the skin still reads as clean CG under this flat rig, and the lips are heavy. The face is the ceiling
  of this approach, not the rig.

## Evidence (all under `docs/design/teacher/bakeoff/procedural-v3/renders/`)

| what | path |
|---|---|
| contact sheet: turntable, 9 emotions, 7 states, 15 visemes + 3 tongue keys, tiers, lip-sync strip | `teal/contact.png` |
| before / after (iteration 2 above, v3 below: emotions + turntable, same camera and rig) | `before-after.png` |
| 9 emotions, 7 states, viseme sweep, turntable stills + MP4 | `teal/emotions/`, `teal/states/`, `teal/visemes/`, `teal/turntable/`, `teal/turntable.mp4` |
| lip-sync, same TTS sentence as the pipeline (`renders/audio/teal.mp3` + `teal.align.json`) | `teal/lipsync.mp4` (aligned visemes), `teal/lipsync-rms.mp4` (M0 RMS driver) |
| emotion check (rows and confusions) | `emotion-check.json` |
| FPS + G9 | `measure.json` (full build), `measure-quiet.json` (re-run) |
| gate report (every number below) | `art/character/bakeoff/procedural-v3/reports/teal.json` |
| assets (same runtime contract) | `public/assets/teacher-bakeoff/procedural-v3/teal/{H,Bplus,Blite}.glb`, `runtime.json`, `plate/` |
| scripts / look | `scripts/character/bakeoff/procedural-v3/**`, `art/character/bakeoff/procedural-v3/looks/teal.json` |

Regenerate: `node scripts/character/bakeoff/procedural-v3/build.mjs --looks teal [--solve-g9]` takes about 26 min on
4 vCPU: build 25 s, textures 4.5 min, export + finish 1.5 min, renders about 14 min, measure, then the emotion check.
It reuses the main pipeline's `$CHAR_HOME` tools (bpy 4.2, MPFB 2.0.17, KTX, gltf-transform). Nothing under
`public/assets/teacher/**` or the main scripts was changed.

## Gates [M] (teal; v3 vs iteration 2)

| gate | bar | v3 | iteration 2 |
|---|---|---|---|
| G1 names (H) | 82/82 | 82/82 | 82/82 |
| G2 bounded / finite / non-empty | all | pass | pass |
| G3 mirror, max over L/R pairs | <= 0.5 mm | **0.11** (after re-symmetrising the MakeHuman units) | 0.16 |
| G4 lid seal at blink (+ lookDown / squint + correctives), sd0 and H | 0% | 0 / 0 / 0, both | 0 |
| G5 lip gap p95, sd0 (rest / PP / jaw 0.3 + close 0.3 / + corr.) | <= 0.3 mm | 0.14 / 0.15 / 0.13 / 0.13, aperture 0 | 0.21 / 0.16 / 0.20 |
| **G5 on the subdivided H face** (re-sealed after Catmull-Clark) | <= 0.3 mm | **0.22 / 0.18 / 0.23 / 0.23**, aperture 0 | (no H subdivision) |
| G6 tooth/tongue outside lips (300 sampled; rest -> worst viseme) | no increase | 3 -> 4 | 3 -> 4 |
| **garment penetration** (kurti->jacket, skin->kurti, skin->jacket, jacket->collar, piping->jacket) | **0, build fails otherwise** | **0 / 0 / 0 / 0 / 0** | 21 (one pair measured) |
| G9 rendered skin vs MST 6 (L\* / C\*) | +-3 / +-4 | **55.2 / 27.7** vs 55.1 / 27.9 | 54.8 / 27.8 |
| teeth L\* p90 at jaw 0.3 | <= 80 | 43.7 | 43 |
| bilabial closure in the clip (aligned visemes / M0 RMS) | >= 90% | 9/9 / 1/9 | 9/9 / 1/9 |
| **emotion legibility, per emotion** | **>= 70%, build fails otherwise** | **85% overall; 8/9 pass; encouraging 0%** | 37% |

Emotion check, per emotion (n = 6): warm 100, encouraging **0** (all read as warm), curious 83, thinking 100,
listening 100, concerned 83, delighted 100, playful 100, surprised 100.
- The full build before the last hair change scored 83% overall with concerned at 67% (4/6), so the 70% line sits
  inside the noise at n = 6.
- The judge is the existing proxy: `taxila-brain`, a blind 9-way forced choice with glosses. It is **not** the E-T4
  child panel.

## Budgets and performance [M]

| tier | GLB MB | tris | draws | morph targets | morph texture MB (x2 for three's copy) |
|---|---|---|---|---|---|
| H | 5.84 (cap 6) | 33,998 (cap 45k) | 5 | 82 | 14.8 -> 29.6 |
| B+ | 1.74 (cap 2.2) | 16,814 (cap 18k) | 5 | 58 | 6.3 |
| B-lite | 0.72 | 16,814 | 5 | 58 | 6.3 |
| D plates | 23 KB total | | | | |

**Deviation, stated:** the H head is about 17.5k tris against the TEACHER-VISUAL §5.1 head cap of 16k (the face mesh
is 20,150 tris including teeth, tongue and the mouth bag). Its morph memory is 14.8 MB against the §5.2 estimate of 8.6.
The whole-tier caps are met.

FPS is software GL (SwiftShader, 4 vCPU), relative only, and **the host was loaded** (loadavg 4.4-7.8: other
workstreams were running). In the same conditions, back to back:
- the iteration-2 teal asset measured H 367-389 ms, B+ 207-249 ms, B-lite 57-60 ms;
- v3 measured H 391-401 ms, B+ 172-213 ms, B-lite 44-55 ms.

So v3 H costs about +5% per frame, which fits its 43% more triangles under the same pixel cost, and B+ / B-lite are
the same within noise. The published iteration-2 figures (H 195 ms) came from a quiet host. These numbers do not
replace the device lab (E-T2).

## What was done, per item of the brief

### 1. Emotion legibility (37% -> 85%)

- **Built into the shapes.** `faceStyle.v3mix` blends MakeHuman's CC0 anatomical expression units into the ARKit keys,
  per side, weighted by the look's race mix:
  - corner puller + retraction into `mouthSmile*`;
  - upward retraction into `mouthUpperUp*`, so the upper teeth show in a laugh;
  - inner-up, down and extern-up into the brow keys;
  - slit into `eyeSquint*`.
- **Scripted fields on top** (`keys.expression_correctives_v3`):
  - the cheek apple rides up and forward with the smile;
  - a deeper nasolabial fold, a lower-lid push, and crow's-feet bunching on `cheekSquint`;
  - corrugator knit on `browDown`, and an oblique inner brow.
  - The keys are then re-symmetrised (G3 0.11 mm).
- **New preset signatures** (`viewer/presets.js`, also written into `runtime.json.emotions`):
  - delighted is an open-mouth Duchenne smile (jaw 0.32, upper teeth showing);
  - playful is a lopsided smile, the opposite brow raised and a half-wink;
  - listening has no smile, an attentive squint and the head turned with the gaze held;
  - concerned is an oblique brow with pressed lips and a tilt.
  - The amplitudes are larger than the TEACHER-VISUAL §6 rows. This deviation is stated in `presets.js`.
- **Register held:** no sad, fearful or glamour faces. Lip moisture was cut to 0.35 after an early build read as lip
  gloss.
- **The front teeth were too dark** (they read as a black slot), so the occlusion was retuned in the shader. Teeth L\*
  p90 is still 43.7, well under the bar of 80.
- **encouraging, honestly:** I tried 17 variants with n = 6-8 each:
  - raised brows with a pressed smile and a nod;
  - an open "you can" mid-speech mouth;
  - an earnest face with no smile;
  - the judge's own recipe (lifted lids with lower-lid tension, a mid-speech mouth with upper teeth, a chin tuck, an
    off-camera gaze).
  - Every one read as warm or playful.
  - In a still face, "encouraging" is the same muscle set as "warm" plus a nod or a gesture, and neither exists in a
    still. It needs motion (the nod), a hand, or a context cue. The preset kept is the most semantically honest one.

### 2. Hair from guide curves (`blender/hair_v3.py`)

- **The hairline:** MakeHuman's scalp group is the crown only, so the hairline is designed: an elevation per azimuth
  around the head, with a seeded irregular edge and painted per texel.
- **Guide curves:** they run from the hairline to a high ponytail tie, carried on the skull by radial projection, with
  a volume profile and per-clump wander. They are kept in `base.blend` as a curve object for inspection.
- **Cards (H):** three cap layers with 134 clump cards, 18 baby-hair cards, 22 flyaways, and 40 radial plus 14
  crossing clump cards around a gravity-hung tail that is collision-pushed off the head, neck and collar. The tail has
  an opaque core tube, an elastic band and 8 tail flyaways: 6.5k tris in all. B+ gets its own 1.8k-tri LOD instead of
  a decimated copy.
- **The atlas:** 2048 x 1024 of anti-aliased fibres per card type, with taper, waviness, per-fibre tone and clump
  convergence.
- **The `_strand` tangent** comes from the generator. The UV heuristic flips sign across the crown.
- **Rejected:** an outer layer of sparse "strandy" cards plus 34 flyaways. At the silhouette, sub-pixel fibres averaged
  with the background into a pale grey halo all round the head and tail. Denser kinds outside and fewer flyaways
  removed it (compare the turntable stills).

### 3. Modelled garments (`blender/garments_v3.py`)

- **Relaxed cloth:** each layer is a bust shell relaxed as a membrane: 36 Laplacian tension steps under hard
  "outside-the-layer-below" constraints. Ease is 3.5 mm for the kurti; for the jacket, 9 mm over the skin and 4.5 mm
  over the kurti. The tension removes the skin anatomy and bridges concavities.
- **Detail parts:**
  - a two-part shirt collar (stand + fall) generated from the neckline loop;
  - a raised placket with double topstitching;
  - pointed chest-pocket flaps conformed to the jacket;
  - copper buttons;
  - a round piping tube on a U-scoop kurti neckline;
  - a tone-on-tone block-print buti on the kurti;
  - only the visible edges rolled for thickness.
- **Penetration gate:** a ray test on 5 pairs, with a resolve loop. The build fails unless every pair is 0, and all
  are 0.
- **Not done:**
  - no garment normal map (the twill is in the albedo);
  - the arm-cut caps still show as a flat dark patch in profile;
  - the B+ garment is decimated to 3.5k and its penetration was not re-measured.

### 4. Skin micro-detail (`blender/skin_v3.py` + `viewer/shaders.js`)

- **The 2048 normal:**
  - zone-scaled pores (wider and deeper on the nose and inner cheeks; fine on the lids; none on the vermilion);
  - orange peel and lip lines;
  - a 34-year-old's faint static lines: forehead, crow's feet, under-eye, two neck rings.
- **The albedo:** three-scale melanin mottling, periorbital and perioral pigment, alar redness, a natural pigmented lip
  and two small moles.
- **The 512 micro tile, shader-tiled x46** (about 8 mm per tile): skin crosshatch, micro pores, specular breakup and
  micro cavity.
- **The 1024 detail map:** peach-fuzz density, subsurface-tint weight, moisture (lip centre, lid margins, caruncle) and
  micro strength.
- **Shader terms** (`HAS_DETAIL` / `HAS_MICRO`): a terminator subsurface tint, a vellus sheen, a sharp wet lobe and
  specular breakup.
- **G9** still passes without re-solving the gain.
- **Honest read [U]:** this is real at close range (the viseme close-ups), but at the bust and face framings, under the
  stage rig, the skin still reads as smooth CG. The flat key + SH light hides micro-normal detail, and the albedo is
  low in contrast. The light rig is part of the contract (G9), so I did not change it.

### 5. Subdivided face for H (`blender/subdiv.py`, `blender/seal.py`)

- **What is subdivided:** the lid rings and the mouth (1,448 polygons) are split off, Catmull-Clark subdivided once with
  linear UVs, and every one of the 82 keys is re-evaluated through the subdivision.
- **A watertight seam:** the mask boundary is held on the linear subdivision in every key, and the neighbouring faces
  get the same midpoints. The open-edge count is unchanged (414 -> 414).
- **Lips re-sealed after smoothing:** the smoothing pulled the touching lips apart, so they were re-sealed on the
  subdivided face. G4 and G5 were then re-measured there; both pass.
- **The cost:** the head is over its 16k cap (see Budgets).

## Contract notes

The runtime contract is unchanged, with additive extras only:
- **Unchanged:** files, mesh, morph and bone names, the `runtime.json` schema and the lighting.
- **Two optional map slots, self-described in `extras.taxila`:**
  - the detail map in `KHR_materials_specular.specularTexture`;
  - the micro tile in `KHR_materials_clearcoat.clearcoatRoughnessTexture` (H).
- **Rig defines:** `rig.js` sets `HAS_DETAIL` / `HAS_MICRO` only when those maps exist.
- **Shader edits:** the mouth-interior occlusion for the teeth is retuned in `shaders.js`.
- **Emotion presets:** v3 values.
- **Porting:** a port of this approach means porting the v3 `rig.js`, `shaders.js` and `presets.js`.

## Proposed context entries

- **rejection:** sparse outer hair cards produce a silhouette halo under alpha-to-coverage.
- **rejection:** encouraging is not separable from warm in a still (n = 6 x 17 variants).
- **measurement:** emotion check, 85% at n = 6 per emotion.
- **decision, with its reversal condition:** encouraging is judged on motion (the nod), not on stills. Reverse it if a
  still variant reaches 70% on the same judge.

## What would move it further [U]

1. **The face itself:** this approach tops out at a well-rigged MakeHuman. A sculpt fitted to references (the Codex
   turnarounds) or a scanned-proportion base under a CC0 or commercial licence is the next big lever, ahead of any more
   shader work.
2. **A softer, more directional stage light** with contact shadows, and then a re-solve of G9. Most of the skin detail
   is invisible under the current rig.
3. **Judge encouraging on a 1-2 s clip** with the nod, not on a still.
4. **Garment normal maps, slate's curls and plum's bun and pallu** in the v3 generators, then build all three looks.
