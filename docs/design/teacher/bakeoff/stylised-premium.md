# Bake-off: stylised-premium (a feature-animation look on the same rig)

Date 2026-10-03. Look built: **teal** only (the Asha design: warm Indian woman teacher, mid-30s, MST 6). slate and plum
were **not** built. This approach is a fork of the procedural-v3 scripts, and v3 has no generators yet for their hair
(curls, a bun) or garments (a shirt over a tee, a saree pallu). Evidence tags: **[M]** measured here, **[U]** my
judgement.

## One screen

- **Emotion legibility [M]: 85% and 87% overall** on two independent runs of the same blind 9-way judge (n = 6 per
  emotion per run). Pooled, that is **93 of 108 = 86%**, against the brief's 85% target and procedural-v3's 85%.
  **8 of 9 emotions pass the 70% bar.** The exception is **encouraging, at 0 of 12**. It reads as "warm" (or
  "playful") here, exactly as in v3, and it stays at 0 across **12 more still variants** tried on this face. So the
  build's own emotion gate fails on that one emotion and exits 2, as it is designed to.
- **Every other gate passes [M]:**
  - G1 82/82, G2, G3 0.11 mm, G4 0%;
  - G5 on sd0 (p95 0.12-0.14 mm) and on the subdivided H face (0.20-0.21 mm);
  - G6 3 -> 5;
  - garment penetration 0 on all 5 pairs;
  - **G9 L\* 55.9 / C\* 28.1 vs MST 6 55.1 / 27.9**, with the albedo gain re-solved for the new shader;
  - teeth L\* p90 57.9;
  - budgets on H, B+ and B-lite;
  - bilabial closure 9/9 from the aligned visemes.
- **What changed, all by script on the v3 rig.** Nothing else was changed: not the rig, the key names, the tiers or the
  runtime contract.
  1. **Proportion field:** the eye regions are scaled ×1.20 about each eye, with the eyeball, the lids and the brows
     moving together. The rendered eyeball radius is 18.2 mm against v3's 14.8 mm, i.e. 1.23× including the head scale.
     A "rest-wide" lid bake makes the eyes rounder and more open, and blink still closes. The head is ×1.055 (v3: 1.03).
     The face is rounder with a smaller chin, a softer, shorter and narrower nose, fuller cheeks, and a narrower mouth
     with slimmer lips.
  2. **Re-authored expression shapes:** brow ARCS (the outer-middle of the brow lifts most), an arched inner-brow
     raise, a squash-friendly smile (corners up and out, the cheek apple pushed into the lower lid), and gains of
     1.1-1.35 on the brow, squint, wide and smile units.
  3. **Toon-PBR hybrid TaxilaSkin:** a wrap term through a soft two-tone ramp, a warm saturated shade tint, a warm
     terminator band, a broad fresnel rim, a painted cheek blush, a softer specular lobe, and the normal map at 0.45.
     It is one code path for H, B+ and B-lite.
  4. **A feature-animation eye:** the limbus goes from 0.48 r to 0.528 r (a ~10% larger iris), with a brighter sclera
     and a larger, softer catch-light.
  5. **Sculpted hair:** an opaque lofted hair mass, with the strand cards over it for the edges and the top, a fuller
     crown and sides, and a "halo" highlight band in TaxilaHair.
  6. **Three emotion presets re-chosen on this face** (concerned, listening, playful) by `variants.mjs`, using the same
     judge.
- **Honest verdict [U]:**
  - It is a **clear step towards an appealing, readable stylised teacher**:
    - the bigger, rounder eyes and the softer face read as friendlier;
    - every emotion except encouraging reads at a phone-sized still;
    - the hair is now a modelled shape, not a slick cap.
  - It is **not** the "crazy level", feature-film face the owner described.
    - Underneath, it is still a MakeHuman head pushed by fields, so the forms are smooth but generic.
    - The lips are flat and pale under the stage rig, and the nose is still a realistic nose made smaller.
    - The toon ramp barely shows under the contract's near-frontal key light.
    - The B+ / B-lite painted brows read tan and patchy (inherited).
    - The hair mass shows a faint striped texture on top.
  - A real feature-animation face needs a **designed sculpt**: a stylised base mesh made for these proportions, not
    MakeHuman pushed by fields. That is the next lever, not more shader work.

## Evidence (all under `docs/design/teacher/bakeoff/stylised-premium/renders/`)

| what | path |
|---|---|
| contact sheet: turntable, 9 emotions, 7 states, 15 visemes + 3 tongue keys, tiers, lip-sync strip | `teal/contact.png` |
| **before / after**: iteration 2, procedural-v3 and stylised-premium (9 emotions, turntable + idle; same camera, same rig) | `before-after.png` (`compare.py`) |
| 9 emotions, 7 states, viseme sweep, turntable stills + MP4 | `teal/emotions/`, `teal/states/`, `teal/visemes/`, `teal/turntable/`, `teal/turntable.mp4` |
| lip-sync, the same TTS sentence as the pipeline (`docs/design/teacher/renders/audio/teal.mp3` + `teal.align.json`) | `teal/lipsync.mp4` (aligned visemes, 9/9 bilabial), `teal/lipsync-rms.mp4` (M0 RMS driver, 1/9) |
| tiers H / B+ / B-lite, same pose | `teal/tier_{H,Bplus,Blite}.png` |
| emotion check, build run (fork of the script with a `--gate`) | `emotion-check.json` (85%) |
| emotion check, `scripts/character/emotion-check.mjs` itself, `--root` pointed here | `emotion-check-main.json` (87%) |
| variant scoring (encouraging x 12, concerned x 9, listening x 4, playful x 4) | `variants/*.json` |
| FPS, G9 and teeth | `measure.json` |
| gate report (every number below) | `art/character/bakeoff/stylised-premium/reports/teal.json`, `g9-solve.json` |
| assets (the same runtime contract) | `public/assets/teacher-bakeoff/stylised-premium/teal/{H,Bplus,Blite}.glb`, `runtime.json`, `plate/` |
| scripts / look | `scripts/character/bakeoff/stylised-premium/**`, `art/character/bakeoff/stylised-premium/looks/teal.json` |
| licences | `art/character/LICENSES.md` § Bake-off `stylised-premium`: no new third-party input; the extra MakeHuman targets are CC0 |

**Regenerate:**

```
node scripts/character/bakeoff/stylised-premium/build.mjs --looks teal --solve-g9 --reps 6
NODE_USE_ENV_PROXY=1 node scripts/character/emotion-check.mjs --looks teal --reps 6 --root "docs/design/teacher/bakeoff/stylised-premium/renders/{look}/emotions" --out docs/design/teacher/bakeoff/stylised-premium/renders/emotion-check-main.json
python3 scripts/character/bakeoff/stylised-premium/compare.py
NODE_USE_ENV_PROXY=1 node scripts/character/bakeoff/stylised-premium/variants.mjs --emotion <e> --file <variants.json> --reps 6
```

- The build takes about 28 min on 4 vCPU: build 20 s, textures about 4 min, export + finish 1.5 min, a G9 re-solve
  (+ re-texture), renders about 12 min, measure, then the emotion check.
- It reuses the main pipeline's `$CHAR_HOME` tools. Build dirs are under `$CHAR_HOME/bakeoff-sp` (66 MB).
- Nothing under `public/assets/teacher/**`, the main scripts or the procedural-v3 folders was changed.

## Gates [M] (teal; stylised-premium vs procedural-v3)

| gate | bar | stylised-premium | procedural-v3 |
|---|---|---|---|
| G1 names (H) | 82/82 | 82/82 | 82/82 |
| G2 bounded / finite / non-empty | all | pass | pass |
| G3 mirror, max over L/R pairs | ≤ 0.5 mm | **0.11** | 0.11 |
| G4 lid seal at blink (+ lookDown / squint + correctives), sd0 and H | 0% | 0 / 0 / 0, both | 0 |
| G5 lip gap p95, sd0 (rest / PP / jaw 0.3 + close 0.3 / + corr.) | ≤ 0.3 mm | 0.14 / 0.14 / 0.14 / 0.12, aperture 0 | 0.14 / 0.15 / 0.13 / 0.13 |
| G5 on the subdivided H face | ≤ 0.3 mm | **0.21 / 0.21 / 0.20 / 0.20**, aperture 0 | 0.22 / 0.18 / 0.23 / 0.23 |
| G6 tooth/tongue outside lips (300 sampled; rest -> worst viseme) | no increase | 3 -> 5 | 3 -> 4 |
| garment penetration (5 pairs) | 0 | 0 / 0 / 0 / 0 / 0 | 0 |
| **G9** rendered skin vs MST 6 (L\* / C\*) | ±3 / ±4 | **55.9 / 28.1** (dL 0.8, dC 0.2) | 55.2 / 27.7 |
| teeth L\* p90 at jaw 0.3 | ≤ 80 | 57.9 | 43.7 |
| bilabial closure (aligned visemes / M0 RMS) | ≥ 90% | 9/9 / 1/9 | 9/9 / 1/9 |
| **emotion legibility, per emotion** | ≥ 70% | **8/9 pass; overall 85% + 87% (pooled 86%); encouraging 0/12** | 8/9; 85%; encouraging 0/6 |

Emotion check per emotion, pooled over both runs (n = 12):

| emotion | correct | read instead as |
|---|---|---|
| warm | 12/12 | |
| **encouraging** | **0/12** | warm 9, playful 3 |
| curious | 11/12 | listening 1 |
| thinking | 12/12 | |
| listening | 11/12 | curious 1 |
| concerned | 11/12 | curious 1 |
| delighted | 12/12 | |
| playful | 12/12 | |
| surprised | 12/12 | |

- The judge is the existing proxy: `taxila-brain`, a blind 9-way forced choice with glosses. It is **not** the E-T4
  child panel. With n = 6 per run, one answer is 17 points.
- **Before the three presets were re-chosen**, this face scored **67%** with the v3 presets (`emotion-check-before-presets.txt`, n = 6):
  - concerned 0/6 (read as curious or listening);
  - listening 3/6;
  - playful 3/6.

  The bigger stylised brows and eyes changed which cue dominated, so presets do not transfer between faces unchanged.

**Lid note [M]:** at rest, 27 lid vertices per eye sit inside the larger eyeball, against a much smaller v3 baseline.
That is the 1.2× ball meeting MakeHuman's lid thickness.
- The increase over rest is still small (+5 at blink, +9 at lookDown), and G4 is 0% (no cornea ray escapes the
  closed lid).
- The clip-through was **not** checked frame by frame at extreme gaze. That check is owed.

## Budgets and performance [M]

| tier | GLB MB | tris | draws | morph targets | morph texture MB |
|---|---|---|---|---|---|
| H | **5.91** (cap 6) | 33,549 (cap 45k) | 5 | 82 | 14.1 |
| B+ | 1.81 (cap 2.2) | 17,327 (cap 18k) | 5 | 58 | 6.2 |
| B-lite | 0.73 | 17,327 | 5 | 58 | 6.2 |

- **Getting H under its cap:** the first stylised H was 6.13 MB. Two changes brought it to 5.91:
  - the skin micro tile was dropped (at the stylised `uMicroK` 0.2 it was invisible);
  - the hair mass replaced v3's third card layer.
- **Hair tris:** H 6.9k (v3 6.5k), B+ 2.35k.
- **FPS** is SwiftShader, 4 vCPU, with other bake-offs running on the host (load average 2.9-3.7). The p50 ms per frame
  over 3 reps was H 395-404, B+ 129-140, B-lite 37-39. v3's numbers under similar load were H 391-401, B+ 172-213,
  B-lite 44-55. The toon ramp costs nothing measurable: there is no LUT fetch and the shader is shorter. This does not
  replace the device lab (E-T2).

## What was done, per item of the brief

### 1. Proportions by script over the MPFB base

- **The eye field (`build_look.py` §3c):**
  - It runs after every key exists and before the proxies, eyes, garments and hair are fitted, so all of them follow.
  - Each eye region is scaled about its own centre (×1.20 inside r0 = 16 mm, smooth to 0 at r1 = 34 mm) and nudged
    0.9 mm outward and 0.4 mm up, so the bigger eyes do not crowd the bridge.
  - Every key's delta is carried through the field's local scale, so a blink closes the bigger opening (G4 0%).
  - The field also moves the eye **helper**, so the eyeball we build from it scales with the lids.
  - **Trap, measured:** the first build multiplied the field by the `body` group, and the helper is not in it. The lids
    grew 17% around an unchanged ball (eyeball radius 15.1 mm against the expected 17+). G4 still passed, so only the
    radius check caught it.
- **Rest-wide:** 0.22 × `eyeWide` is baked into the basis and every key, then subtracted from each side's `eyeBlink`.
  The closed lid lands where it did, and the open eye is rounder.
- **Lids and brows:** the brow sits in the field's falloff ring, so it rises with the bigger eye. `eyebrows-trans-up`
  0.1 leaves room for brow arcs.
- **Face shape:**
  - MakeHuman CC0 targets: `head-round` 0.35, smaller chin (height and width), a shorter, shallower and up-tipped nose
    with no hump and narrower nostrils, a narrower mouth with lower and upper lip height reduced, a defined cupid's bow,
    fuller cheeks (volume and inner);
  - the identity-sculpt block: a lower bridge, the tip 1.8 mm back, the alar 2 mm in, cheek pad +1.8 mm forward, the jaw
    angle 3.8 mm in.
- **Eyes as a shape (`make_eyes` + `EYE_FRAG`):** the cornea goes from 0.693 r with its apex at 1.07 r to 0.73 r with
  its apex at 1.075 r. The limbus goes from 0.478 r to 0.528 r and the iris radius from 0.47 to 0.515. The sclera is
  brighter (0.82), and a softer second catch-light lobe reads at phone size.

### 2. Expression shapes re-authored (`keys.expression_stylised`)

- **On top of v3's units:**
  - brow outer-up ×1.35, inner-up ×1.3, down ×1.25, eyeWide ×1.3, cheekSquint ×1.25, smile and upperUp ×1.1;
  - a brow-arc field (+2.6 mm at the outer-middle, the forehead +0.8 mm);
  - an inner-brow arch;
  - smile corners +1.2 mm up and out, with the cheek apple +1.6 mm up and forward into the lower lid.
- **Re-symmetrised:** G3 0.11 mm.
- **Bounded:** G2 passes, and the lip seals were redone (G5).
- **Stylised lips needed a partial-close seal (`seal.py`):** the slimmer lips made the contact slide non-linearly
  between rest and full close. The subdivided H face then failed G5 at jaw 0.3 + close 0.3 (p95 0.33 mm). The partial
  state is now sealed alternately with the full one, and the result is 0.20 mm.

### 3. Toon-PBR hybrid skin (`viewer/shaders.js`, `STYLE` constants, mirrored in `runtime.json.style`)

- **Diffuse:** `wl = wrap(N.L, 0.55)`, then `ramp = mix(wl, smoothstep(0.16, 0.62, wl), 0.8)`.
- **Shading terms:**
  - the shade side is tinted (1.08, 0.78, 0.68): warmer and more saturated, never grey;
  - a warm terminator band (0.20, 0.06, 0.035) acts as subsurface;
  - a fresnel rim mixes the cool rig rim with a warm albedo rim;
  - a painted blush sits on the cheek apples at 0.45;
  - the GGX lobes are softened (roughness ≥ 0.30), and the normal map is at 0.45.
- **Tiers:** B-lite runs the same ramp in `TIER_LITE`.
- **The light rig is unchanged** (the contract).
- **G9 re-solved:** the toon ramp renders lighter than the pre-integrated LUT, so the solved albedo gain fell from v3's
  (1.05, 1.15, 1.41) to (0.84, 0.98, 1.22). The skin is in its MST 6 band (dL 0.8).
- **Honest read [U]:** under this near-frontal key the two-tone ramp mostly shows at the jaw, the nose side and the
  cheek edge. The skin reads as soft and painterly, not as a strongly graphic toon. A more side-lit rig would show the
  ramp and needs a G9 re-solve; it was not changed, because the rig is part of the contract.

### 4. Hair as sculpted masses plus edge cards (`blender/hair_v3.py`)

- **The mass:** an opaque lofted shell (56 x 14 on H, 32 x 9 on B+) from just behind the hairline to the tie. It lies
  on the same volume profile as the cards, 0.9 mm under the first card layer.
- **The profile:**
  - crown volume 13 mm, against v3's 6.5 mm;
  - rising faster from the hairline (`riseT` 0.3);
  - a side bulge (+50% over the temples and sides) for a softer, face-framing silhouette.
- **On top:** two card layers, baby hairs and 10 flyaways. The mass is in the same mesh and material, so it adds no draw.
- **Shading:** TaxilaHair has a two-tone ramp, a warm shade and a broad halo highlight band over the Kajiya-Kay glints.
- **Honest read [U]:**
  - The profile now reads as a modelled bun-and-ponytail form.
  - The front view is still a pulled-back cap, as the Asha design asks: a high ponytail, not a fringe.
  - The core texture shows faint stripes on the mass at the crown.

### 5. Emotion presets (`viewer/presets.js`)

These were chosen by score, not by eye. Each variant was rendered on the H face and judged 6 times
(`renders/variants/*.json`).

| emotion | variants tried | kept |
|---|---|---|
| concerned | 9 | **c5, 6/6**: inner brow 1.0 + knit 0.35, corners down 0.5, lower lip up 0.3, no lean (any tilt + lean read as listening) |
| listening | 4 | **l2, 6/6**: no smile, a 16° turn with the gaze held |
| playful | 4 | **p1, 6/6**: a stronger lopsided smile and a half-wink |
| encouraging | 12 | **none reached 1/6**; the v3 preset is kept |

The register held throughout: concern stays gentle, with no sad, fearful or glamour faces.

**Encouraging, honestly:** the 12 variants were:
- an open-mouth nod;
- "you can";
- earnest;
- "come on";
- a nod with a squint;
- determined;
- a proud nod with soft lids;
- "haan!" mid-word;
- soft hope;
- a wide-eyed tilt-nod;
- a firm closed smile;
- v3's preset.

Every one read as warm or playful (72 judgements, 0 hits). Combined with v3's 17 variants, that is about 29 still designs
and 0 hits. This strongly supports v3's proposed decision: **encouraging is a motion (a nod or a gesture), not a still
face.** It should be judged on a 1-2 s clip.

## Contract notes

The runtime contract is **unchanged** in files, mesh names, morph names, bone names, the `runtime.json` schema and the
lighting. There are additive extras only:
- `runtime.json.style` holds the STYLE constants and the stylise parameters;
- the skin micro tile slot is **absent** on H (the rig already handles a missing slot).

Porting this approach means porting **this fork's** `rig.js`, `shaders.js` and `presets.js`. The eye shader constants
(`RC` 0.73, apex 1.075, `ZI` 0.825, `IR` 0.515) are tied to the eye geometry in these GLBs. Do not mix them with
iteration-2 or v3 eyes.

## Proposed context entries

- **rejection:** scaling the eye region by a field masked to the `body` group. The MakeHuman eye helper is not in
  `body`, so the lids grew around an unscaled eyeball and G4 still passed. Check the eyeball radius after any eye-region
  edit.
- **rejection:** emotion presets carried unchanged across a re-proportioned face (67%: concerned 0/6, listening 3/6,
  playful 3/6). Re-score the presets per face.
- **measurement:** stylised-premium emotion check 85% and 87% (pooled 86%, n = 12 per emotion; encouraging 0/12).
- **measurement:** encouraging 0/72 judgements over 12 still variants on a second face. This strengthens v3's "judge
  on motion" decision. Reversal: a still variant at ≥ 70% on the same judge.
- **decision, with its reversal condition:** G5 seals the partial close (jaw 0.3 + close 0.3) as well as the full one.
  Reverse it if the full-only seal passes the partial gate on every look.

## What would move it further [U]

1. **A designed stylised base** in place of fielded MakeHuman. This is the ceiling here. It could be a CC0/commercial
   base made for animation proportions, or an in-house Blender sculpt scripted from a 2D turnaround (`taxila-image`).
   It would carry real stylised planes: a defined upper lid, a sculpted nose tip, a graphic lip shape.
2. **A rig light that shows the toon ramp:** a 35-45° side key with a warm bounce, then a G9 re-solve.
3. **Lips:** a painted lip shape with a darker upper lip and a lit lower lip; the current lips are flat and pale.
4. **The B+ / B-lite painted brows:** they read tan and patchy. Re-bake them from the H brow cards.
5. **Encouraging as a clip**, with the nod.
6. **slate and plum** once v3 has curls, a bun and pallu generators.
