# Teacher character inputs and their licences

Every input that reaches a shipped pixel or vertex of `public/assets/teacher/**` is listed here. Rule
(TEACHER-VISUAL §11, owner 2026-10-03): CC0, or CC-BY with attribution; nothing NC, nothing MetaHuman, no scan or photo
of a real person, no face detector licensed for non-commercial use, no paid or third-party character service.
Checked 2026-10-03 against the licence text inside each downloaded file (the MHCLO headers and pack JSON).

## Shipped (geometry or texels derive from these)

| input | used for | source | licence | evidence |
|---|---|---|---|---|
| MakeHuman base mesh `hm08` (`base.obj`), macro and modelling targets (head, chin, cheek, nose, mouth, eyes, eyebrows, forehead, ears, neck) | the head-and-shoulders topology, identity of each look | MPFB 2.0.17 bundled data (MakeHuman 1.x assets) | **CC0** | `base.obj` header: "explicitly released as CC0 in september 2020" |
| `faceunits01` pack (52 ARKit face units as MakeHuman targets) | the 52 ARKit shape keys (then sealed, baked through the identity, validated) | files.makehumancommunity.org/functional/faceunits01.zip, author Mika Suominen | **CC0** | `packs/faceunits01.json`: `"license": "CC0"` for every unit |
| `visemes02` pack (15 Meta/Oculus visemes) | the 15 viseme shape keys (H) | files.makehumancommunity.org/functional/visemes02.zip, author Mika Suominen | **CC0** | `packs/visemes02.json`: `"license": "CC0"` |
| `makehuman_system_assets_cc0`: `teeth_base`, `tongue01` | teeth and tongue meshes (teeth decimated, keys re-derived) | asset pack, MakeHuman system assets | **CC0** | MHCLO headers (uuid 0a5ec82a…, 52ad91a3…) |
| same pack: `eyebrow001`, `eyebrow010` (mesh + alpha PNG; `eyebrow003` was used by plum in iteration 1 only) | brow cards (H), brow-hair placement for the painted brows | asset pack | **CC0** | MHCLO headers (uuid 9c81ec3a…, 4089e4e3…, 8261cde8…) |
| same pack: `eyelashes01`, `eyelashes02` (mesh + alpha PNG) | lash cards (all tiers) | asset pack | **CC0** | MHCLO headers (uuid d533836f…, 04a0718e…) |
| same pack: hair `ponytail01`, `short02`, `short04` (card meshes + diffuse alpha PNG) | hair cards and the alpha/luminance of the hair atlas (colour is ours) | asset pack | **CC0** | MHCLO headers (uuid 44e0340e…, c104cd4a…, e09bfd91…) |
| everything else: skin albedo / normal / wrinkle / masks / cavity-roughness-thickness-AO maps, eyes (sclera, iris, cornea), mouth bag, garments, glasses, studs, bun, the skin LUT, shaders | | written by us (`scripts/character/**`): seeded procedural noise on our own mesh, no image input | ours | — |

| Monk Skin Tone (MST) scale, the 10 published hex values (iteration 2) | the albedo anchor of each look's band and the G9 target (`texture.py`, `g9.mjs`) | Dr. Ellis Monk / Google, skintone.google | **CC BY 4.0**: "Monk Skin Tone Scale by Dr. Ellis Monk, Google, CC BY 4.0" (attribution carried here and in `texture.py`) | the scale's published release terms |

Constants taken from publications (techniques are not licensed): the six-Gaussian skin diffusion profile of d'Eon &
Luebke (GPU Gems 3, ch. 14) for the pre-integrated LUT (Penner 2011); Kajiya-Kay hair highlights; GGX.

## Build-time tools (run offline; nothing of them ships)

| tool | licence | note |
|---|---|---|
| Blender `bpy` 4.2.0 wheel (PyPI) | GPL-3.0-or-later | output is ours |
| MPFB 2.0.17 (extensions.blender.org) | GPL-3.0-or-later (code); its data is CC0 | run headless to build the human and fit proxies |
| @gltf-transform/core, extensions, functions 4.5.1 | MIT | meshopt + KTX2 packaging |
| meshoptimizer 1.3.0 | MIT | geometry compression (decoder ships inside three.js, MIT) |
| numpy 1.26.4, pillow 12.3.0, scipy 1.17.1 | BSD-3 / MIT-CMU / BSD-3 | pinned (iteration 2) |
| KTX-Software 4.4.0 (`toktx`) | Apache-2.0 | UASTC / ETC1S encoding |
| three.js r180, Playwright, ffmpeg | MIT / Apache-2.0 / LGPL | evidence renders only |

Every download is sha256-pinned in `scripts/character/build.mjs` (`SHA256`, recorded 2026-10-03; a mismatch stops the
build), so this licence evidence is tied to exact bytes (G10): faceunits01.zip `d113107b…`, visemes02.zip `a69ab6fb…`,
makehuman_system_assets_cc0.zip `b542127a…`, KTX-Software-4.4.0 `942f7dd6…`, MPFB 2.0.17 `4f0a879d…`.

## Evidence-only inputs (not in any shipped asset)

| input | use | terms |
|---|---|---|
| `facebook/wav2vec2-base-960h` (Hugging Face) via PyTorch + transformers | offline CTC forced alignment of the evidence sentence -> the viseme timeline of `lipsync.mp4` (`align.py`) | **Apache-2.0** (model card); torch BSD-3, transformers Apache-2.0. Build-time only, never in the runtime |
| Azure `taxila-brain` (vision) | the forced-choice emotion self-check over our own renders (`emotion-check.mjs`) | owner's Azure grant; inputs are synthetic renders, no child data |
| Azure OpenAI `gpt-4o-mini-tts` audio (voices marin, cedar, sage) | the lip-sync clips in `docs/design/teacher/renders/` | owner's Azure grant (first-party Azure model) |

## Not used (and why)

- Codex teacher references (`art/gen/teacher/**` on `claude/blissful-mayer-icwe2j`): none had landed when this build
  ran (checked by `git ls-tree` at start and twice later; re-checked in iteration 2 at start and end, 0 files, branch
  head 2026-10-03 15:27 +0530; `build.mjs` now fails if they land unused). Look data came from `MANIFEST.json.characters` and
  `shared/tutors.js` (hex colours, hair style, attire) instead. When the references land, they guide the identity
  targets and the albedo tint only; no generated pixel is copied into a texture without this file being updated.
- MakeHuman skin textures (`skins/*`): CC0, but not needed; the albedo is procedural so its MST band can be set exactly.
- MetaHuman, Character Creator, Daz, VRoid, scan libraries, InsightFace / any face detector: excluded by rule.

## Bakeoff `ai-portrait-wrap` (2026-10-03; assets under `public/assets/teacher-bakeoff/ai-portrait-wrap/**` only)

Not shipped to `public/assets/teacher/**`. Adds these inputs to the CC0 / ours set above:

| input | used for | source | licence / terms | note |
|---|---|---|---|---|
| reference portraits `art/character/bakeoff/ai-portrait-wrap/refs/<look>/*.png` (front, front_smile, q3_left, q3_right, profile_left, q3_left_smile) | identity: landmark targets for the wrap, and the projected skin albedo + fine normal detail | generated by Azure Foundry `taxila-image` (gpt-image-2), prompts in `refs/<look>/refs.json` | owner's Azure grant; Azure OpenAI service terms: output belongs to the customer, commercial use allowed | generated, not a photo of a real person. Residual risk [U]: a generated face can resemble a real person by chance; a reverse-image / likeness review before shipping is owed |
| MediaPipe Face Landmarker `face_landmarker.task` (float16 v1, sha256 `64184e22…`) + `mediapipe==0.10.21` (PyPI) | build-time landmarks on the portraits and on our renders (fit, projection cameras, likeness metric) | storage.googleapis.com/mediapipe-models | **Apache-2.0** | build time only, nothing of it ships |
| opencv-contrib-python 4.11 (a mediapipe dependency) | none directly | PyPI | Apache-2.0 | build time only |

Considered and not used: TRELLIS (MIT) and TripoSR (MIT) need a GPU for TRELLIS / ~2.5 GB of weights and dependencies
for TripoSR on CPU (no Azure GPU was creatable, see the bakeoff doc); Hunyuan3D-2 (Tencent Hunyuan 3D Community
Licence: territory excludes the EU, UK and South Korea, so India is in scope, with extra terms above a monthly-active-user
threshold [U, from the licence text as recalled, not re-read this session]): not used.

## Bake-off `procedural-v3` (2026-10-03; outputs under `public/assets/teacher-bakeoff/procedural-v3/**`)

| input | used for | source | licence | evidence |
|---|---|---|---|---|
| MakeHuman expression units (`targets/expression/units/{caucasian,african,asian}/*.target.gz`: mouth-corner-puller, mouth-retraction, mouth-upward-retraction, eyebrows-*-inner-up / -down / -extern-up, eye-*-slit), blended by the look's race mix | mixed into the ARKit keys `mouthSmile*`, `mouthUpperUp*`, `browInnerUp`, `browDown*`, `browOuterUp*`, `eyeSquint*` (`faceStyle.v3mix`) | MPFB 2.0.17 bundled data (same sha256-pinned zip as above) | **CC0** | MPFB `LICENSE.md` §C (bundled assets CC0) and `LICENSE.ASSETS.md` (CC0 1.0 text) |
| everything else in v3: hair guide curves, strand cards and the strand atlas (`hair_v3.py`), modelled garments, collar, pocket flaps, buttons, piping (`garments_v3.py`), skin zones, pores, micro tile, detail map, albedo detail (`skin_v3.py`), the H subdivision (`subdiv.py`) | | written by us, procedural from our own mesh; no image or third-party hair/cloth asset | ours | — |

The MakeHuman CC0 card hair (`ponytail01`) is **not** used by v3 (replaced by the generated cards). Evidence-only, as
above: Azure `taxila-brain` for the emotion check; the existing Azure TTS clip and its alignment (re-used unchanged).

## Bake-off `stylised-premium` (2026-10-03; outputs under `public/assets/teacher-bakeoff/stylised-premium/**`)

Built on the procedural-v3 scripts (forked into `scripts/character/bakeoff/stylised-premium/`), so every v3 row above
applies unchanged. New inputs: **none from third parties.**

| input | used for | source | licence |
|---|---|---|---|
| more MakeHuman modelling targets (`head-round`, `chin-*`, `nose-*`, `mouth-*`, `cheek-*`, `eyebrows-trans-up`) | the stylised proportions, at the values in `art/character/bakeoff/stylised-premium/looks/teal.json` | MPFB 2.0.17 bundled data (same sha256-pinned zip) | **CC0** |
| the eye-region proportion field, the rest-wide bake, the stylised expression fields (`keys.expression_stylised`), the sculpted hair mass, the toon-PBR skin / hair / eye shader terms, the base blush | | written by us, procedural; no image, no third-party asset or service | ours |

Evidence-only, as above: Azure `taxila-brain` for the emotion check and variant scoring (`variants.mjs`), and the
existing Azure TTS clip and its alignment, re-used unchanged.
