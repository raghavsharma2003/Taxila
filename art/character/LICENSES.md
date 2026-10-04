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

## Bake-off `merged` (2026-10-03; outputs under `public/assets/teacher-bakeoff/merged/**`)

The merged teal combines `ai-portrait-wrap` (identity: the generated reference set, wrap, fit loop, projected skin) with
`procedural-v3` (expression units, generated hair, relaxed garments). Every row of both sections applies unchanged; the
reference portraits are the same `taxila-image` outputs (Azure, customer-owned), copied to `art/character/bakeoff/merged/refs/teal`.
New shipped inputs: **none from third parties** (the chroma clamp, tone transfer, lid and teeth fixes, temple fill and
hairline table are ours, procedural).

Build-time only, nothing shipped or committed (the lookalike check, `identity/realperson.py`):

| input | used for | source | licence |
|---|---|---|---|
| OpenCV Zoo `face_recognition_sface_2021dec.onnx` (SFace, MobileFaceNet) | 128-d face embeddings for the lookalike check | github.com/opencv/opencv_zoo | **Apache-2.0** (commercial use allowed) |
| OpenCV Zoo `face_detection_yunet_2023mar.onnx` (YuNet) | face detection + 5-point alignment for the same | github.com/opencv/opencv_zoo | **MIT** |
| public-figure face set: 1,461 Wikimedia Commons thumbnails of 1,810 Wikidata people (Indian women public figures + the most-linked women worldwide), `identity/faceset.py` | the gallery the renders and references are compared against | Wikidata (CC0 metadata) + Wikimedia Commons (each image under its own Commons licence) | used only to compute embeddings at build time; kept in `$CHAR_HOME`, never redistributed or committed |

Evidence-only: Azure `taxila-brain` and `taxila-fast` for the three-judge emotion check and variant scoring, and the
existing Azure TTS clip and its alignment, re-used unchanged.

Iteration 3 (2026-10-04): one input swapped, no new third party. The lash cards are now MakeHuman **`eyelashes02`**
(same CC0 MakeHuman asset family and card topology as `eyelashes01`; its `.mhclo` states the CC0 release, September 2020),
with the lower lashes kept. Everything else added in iteration 3 is ours and procedural: the proportion pass
(`identity/proportion.py`), the upper-lip visibility floor, the lip, lid-margin, perioral, under-eye and hairline paint
passes, the eye, teeth, bounce-light and hair-coverage shader terms, and the arm-cap UV patch. MediaPipe (Apache-2.0) and
the OpenCV Zoo models above were re-used at build time for the likeness and lookalike measurements.

## Bake-off `gnm` (E-GNM1, 2026-10-03; outputs under `public/assets/teacher-bakeoff/gnm/**` only)

Not shipped to `public/assets/teacher/**`. The face geometry (skin, teeth, gums, tongue, mouth lining) and every key
shape of the gnm row are **derived from Google's GNM Head v3.0 weights** (identity and expression coefficients applied
to its bases), so the GLBs are a derivative work of an Apache-2.0 model. Checked 2026-10-03 against the licence text in
each source:

| input | used for | source | licence | evidence |
|---|---|---|---|---|
| GNM Head v3.0 code (`gnm/shape`, NumPy backend read as reference; our loader is `scripts/character/bakeoff/gnm/gnm_model.py`) | the forward model semantics (template + identity + expression bases, joints) | github.com/google/GNM @ `940c36b8` (2026-10-02) | **Apache-2.0** | repo `LICENSE` (Apache License 2.0 full text), source headers "Copyright 2026 Google LLC / Licensed under the Apache License, Version 2.0"; README: "suitable for both non-commercial and commercial applications". No NOTICE file in the repo |
| GNM Head v3.0 weights `v3_0/gnm_head.npz` (53,328,601 B, sha256 `61d78bbfb4ad8e0b38495804a4caef3214d3df00f8c3f68761e63b41ce3747eb`, matches the repo's `checksums.sha256`) | the teal face mesh (17,821-vertex topology, UVs, skinning weights), its identity fit and the 82 key shapes | huggingface.co/google/gnm-v3 (revision `c01e90d2`) | **Apache-2.0** | model card front matter `license: apache-2.0` and text "released under the Apache 2.0 permissive license, suitable for both academic research and commercial applications". Not committed (fetched by `gnm_model.py`, pinned by sha256) |
| MediaPipe <-> GNM landmark correspondence (473 landmark -> vertex pairs, the "differential" reference cloud, 166 skull-fixed flags) | the identity fit (`fit.py`) and the v3 correspondence (`corr.py`); cached as `art/character/bakeoff/gnm/mp_gnm_corr.json` | github.com/google/xrblocks `samples/avatar_lab/gnm/FaceCorrespondence.js` @ `863004ac`, generated from github.com/edualvarado/gnm-webcam-puppet | **Apache-2.0** (both repos) | xrblocks `LICENSE` and the puppet repo's `LICENSE` (Apache License 2.0) + its README "License: Apache 2.0" |
| procedural-v3's hair cards, brow/lash cards, kurti, studs, eye mesh, hair/cards/garment atlases and its 82 key shapes (as solve TARGETS only) | carried onto the GNM head | `public/assets/teacher-bakeoff/procedural-v3` build outputs | CC0 + ours (see the v3 section above) | — |
| reference portraits (front, q45_left, q45_right, profile90_left, profile90_right; the q3 views are held out and never projected) | identity landmarks and silhouettes, projected skin albedo and fine normal detail | `art/character/bakeoff/merged/refs/teal/` (taxila-image, prompts in `refs.json`) | as the ai-portrait-wrap row: Azure OpenAI output, customer-owned | **a likeness review is owed before any child sees this face** (VERDICT); the gnm albedo is as photographic as ai-portrait-wrap's |

Obligations if this row is ever shipped (Apache-2.0 §4): ship a copy of the licence with the app's notices
(`art/character/bakeoff/gnm/third_party/GNM-LICENSE.txt` is the verbatim copy), state that the face geometry was
modified from GNM Head v3.0 (Google LLC), and keep this attribution: "Face geometry derived from GNM Head v3.0,
Copyright 2026 Google LLC, Apache License 2.0." No trademark use. Not used: the third-party GNM ear-landmark model
(research-only licence), GNM's semantic sampler `.h5` decoders (Apache-2.0 too, but not needed), Mitsuba/pyrender.
Build-time tools added by this row: mediapipe 0.10.14 (Apache-2.0, apw venv), scipy 1.17.1, numpy 2.4.6 (BSD-3).

## Polished-face candidate `c2` (2026-10-04; outputs under `public/assets/teacher-candidates/c2/**` only)

Slot 2 of `docs/design/teacher/polished/SCOUT.md` is ThreeDee (a purchase, owner only; not bought). Per the brief, c2
instead builds the best **free** alternative on the scout's list that no other slot uses: **Microsoft Rocketbox**
(SCOUT row 7, "licence-perfect floor"). Riya (row 5) costs $10 on Superhive and its free Fab listing could not be
reached (Fab returns 403 to this container); CharacterZ has no published licence; VRoid is anime; Canino3d is a
Western teen with non-ARKit shapes. Not shipped to `public/assets/teacher/**`.

| input | used for | source | licence / terms | evidence |
|---|---|---|---|---|
| `Business_Female_01_facial.fbx` (2,190,000 B, sha256 `bf886b61087bf494431c5124bffe2f3d2cb80887fd19daeaec19abb72ae14868`) | every vertex, UV and skin weight of the c2 face, hair shell, cards and garment; the ARKit 52 (2022 set by Fang Ma and Matias Volonte), the 15 visemes, and the HeadBox / FACS units mixed into tongue, smile, brow and lid keys | github.com/microsoft/Microsoft-Rocketbox @ `0943055db6ec570bcef9f2c8b41c9e5467c808f9`, `Assets/Avatars/Professions/Business_Female_01/Export/` | **MIT** ("Copyright (c) 2020 Microsoft"; MIT since Nov 2020, README "November 2020 License Update") | repo `LICENSE.md` sha256 `17474e386e0b9e1a700cc3d06b2b0882a2c376d9c6b49c7f8274409b8f8d2352`, verbatim copy at `art/character/candidates/c2/third_party/ROCKETBOX-LICENSE.txt` |
| `f014_head_color.tga` (sha256 `8a4f4762f69b67a4f40e80436b66e359d319606874895e0e02e51aba15a9ffd2`), `f014_head_normal.tga` (`31a9b1e4343698b58a2fc34b3b630e3672067b20b5c05849c3dea37b1710f3d1`), `f014_head_specular.tga` (`16b10139caf59c79b31d4a290504a5684d3c65270889e09ff3758b25b9ffcbc4`), `f014_body_color.tga` (`168c58454bf7c28171c6f4bf2e7be2106bd0285aea576ff4076a2168d8d97aec`), `f014_opacity_color.tga` (`2bbcf46ac04f0e913e06e36c90a7d53198c7db99d614c70dca80f0d1a95d8390`) | skin albedo (recoloured to MST 6 in L\*a\*b\*, lips desaturated, G9 trim), normal, packed (roughness from the specular map; cavity/AO from the normal map), garment (blazer and shirt recoloured), hair shell and alpha cards (re-tinted) | same repo and commit, `.../Business_Female_01/Textures/` | **MIT** | as above. MIT explicitly permits "modify, merge, publish, distribute, sublicense, and/or sell" |
| `Business_Female_01.fbx`, `f014_body_normal.tga`, `f014_body_specular.tga` | not used (downloaded, hashes `7a13fa1e…`, `afef9ffc…`, `7208f6c2…`) | same | MIT | — |
| our eyeballs, armature, `_region` / `_strand` attributes, the recolour, the key mixes, the lip seal and rest lid | | written by us (`scripts/character/candidates/c2/**`) | ours | — |
| Monk Skin Tone scale MST 6 hex | albedo anchor and G9 target | skintone.google | CC BY 4.0 (attribution as above) | — |

Terms that matter for a paid children's web app: MIT has **no** field-of-use, revenue, territory, platform or
"protected format" clause, so a plain GLB delivered to a browser or an Android WebView is fine. The one obligation:
"The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
Software." If c2 ships, the app's third-party notices (and the repo) carry the verbatim MIT text above with
"Copyright (c) 2020 Microsoft" and the attribution "Teacher character derived from the Microsoft Rocketbox Avatar
Library (Business_Female_01), MIT License; modified by Taxila." The licence text gives no warranty. Rocketbox's README
asks research users to cite Gonzalez-Franco et al. 2020 (Frontiers in VR, doi 10.3389/frvir.2020.561558): a courtesy,
not a licence term. Not used from the Rocketbox ecosystem: the HeadBox Unity demo (github.com/openVRlab/Headbox; its
tracking path depends on non-commercial OpenFace), MoveBox, and the `.max` sources. The TTS audio of the lip-sync clip
is the bake-off's existing Azure `gpt-4o-mini-tts` sentence (first 6.0 s), re-used unchanged. Build-time tools: the same
pinned `bpy` 4.2 / gltf-transform / KTX-Software set as the in-house pipeline (Blender's bundled FBX importer, GPL; output
is ours).

## Polished-face candidate `c1` (2026-10-04; outputs under `public/assets/teacher-candidates/c1/**` only)

Slot 1 of `docs/design/teacher/polished/SCOUT.md` is **MetaHuman → GLB**. It is not a purchase, but it is blocked here on
three owner-only items: an Epic account login (UE 5.7 Linux and MetaHuman Creator both require one; Creator's rig and
texture solve runs in Epic's cloud), counsel's read of the UE/MetaHuman EULA for plain-GLB browser delivery, and the
Azure-only call on a one-off third-party cloud step. Nothing of MetaHuman was downloaded or used. Per the brief, c1
builds the best free alternative on the scout's list instead: **Microsoft Rocketbox** (the scout's licence-perfect
reserve), avatar **Female_Adult_11**, with the face texels of **Female_Adult_10** composited in (Rocketbox heads share
one UV template). Note: slot c2 also fell back to Rocketbox (a different avatar, Business_Female_01); no other free,
licence-clean, ARKit-ready option exists on the scout's list (Riya is $10; CharacterZ has no published licence), so
the two slots share a library, not a character. Not shipped to `public/assets/teacher/**`.

| input | used for | source | licence / terms | evidence |
|---|---|---|---|---|
| `Female_Adult_11_facial.fbx` (2,126,800 B, sha256 `7ddb77aedb39fa1dd17dc3b5beffaf260769f39cbace52e9e6cc62cd93ee1af9`) | every vertex, UV and skin weight of the c1 face, eyes, lash cards, hair (shell + bun cards) and garment; the source's authored ARKit 52 (`AK_01..52`) and 15 visemes (`AA_VI_00..14`), copied as authored deltas; `HB_12_TongueUp` / `HB_09_TongueIn` seed `tongueTipUp` / `tongueCurl` | github.com/microsoft/Microsoft-Rocketbox @ `0943055db6ec570bcef9f2c8b41c9e5467c808f9`, `Assets/Avatars/Adults/Female_Adult_11/Export/` | **MIT** ("Copyright (c) 2020 Microsoft") | repo `LICENSE.md` sha256 `17474e386e0b9e1a700cc3d06b2b0882a2c376d9c6b49c7f8274409b8f8d2352`, verbatim copy at `art/character/candidates/c1/third_party/ROCKETBOX-LICENSE.txt`; licence URL https://github.com/microsoft/Microsoft-Rocketbox/blob/master/LICENSE.md |
| `f011_head_color.tga` (sha256 `f2439ebb800708c467f3cf0147568d3e9c3c61ac76977363fc992d16e8b38efe`), `f011_head_normal.tga` (`3271569db6b47df4d388d92cd622ab194a84f222109b4910e5376c72b12d328a`), `f011_head_specular.tga` (`31ec6dba7675e53f03e3e2258ad4878ef01d4cff118b8339de7d8d54ef9aa747`), `f011_body_color.tga` (`e9797c77c32009ba0485aa351876063daa0e88250fba4884377faf8cea1d5eb6`), `f011_opacity_color.tga` (`07d5e246c49b95a15c336e4135d1d9a5cebfe2e3cb68b6041346ddf8c61b12f0`) | skin albedo outside the face oval (one linear gain to MST 6, G9-solved then warmed), normal, packed (roughness from specular, cavity from normal slope), garment (knit dress re-toned to teal in L\*a\*b\*, V-neck skin matched to the head's chest colour), hair-tie re-toned plum-brown, hair/lash alpha cards (padding dilated) | same repo and commit, `.../Female_Adult_11/Textures/` | **MIT** | as above |
| `f201_head_color.tga` (12,582,956 B, sha256 `a35402c2a3c7155b57f26724b5ca61bdde2d6ae05a7a7ef5aa782eb83d1fc90a`) | the face oval (feathered ellipse, colour-matched at forehead and cheek, green/lilac lid shadow neutralised, lips deepened to rose-brown) | same repo and commit, `Assets/Avatars/Adults/Female_Adult_10/Textures/` | **MIT** | as above |
| our armature, eye UV remap, `_region` attribute, the bust cut, the recolour, tongue extras | | written by us (`scripts/character/candidates/c1/**`) | ours | — |
| Monk Skin Tone scale MST 6 hex `#a07e56` | G9 target | skintone.google | CC BY 4.0 | — |

Terms that matter for a paid children's web app: identical to c2 above. MIT has no field-of-use, revenue, platform or
protected-format clause, so a plain GLB in a browser or Android WebView is permitted, modification and sale included.
The only obligation is to carry the copyright notice and permission text; if c1 ships, the app's third-party notices
carry the verbatim MIT text and "Teacher character derived from the Microsoft Rocketbox Avatar Library
(Female_Adult_11, Female_Adult_10 face texture), MIT License; modified by Taxila." No warranty. The lip-sync clip's
audio is the bake-off's existing Azure `gpt-4o-mini-tts` sentence (`docs/design/teacher/renders/audio/teal.mp3`),
re-used unchanged. Build-time tools: pinned `bpy` 4.2 (Blender FBX importer, GPL; output is ours), gltf-transform
(MIT), meshoptimizer (MIT), KTX-Software 4.4.0 (Apache-2.0).

## Polished-face candidate `c3` (2026-10-04; outputs under `public/assets/teacher-candidates/c3/**` only)

Slot 3 of `docs/design/teacher/polished/SCOUT.md` is **Avaturn** (a photo-to-avatar AI web service). It is not a
purchase, but it was not used. The binding Azure-only directive (CLAUDE.md, 2026-10-02) says "no third-party AI APIs
... builds may not call them", and the scout itself leaves the one-off authoring call to the owner. Using it would also
need an Avaturn account accepted under its ToU, and commercial use "only after notifying us at hello@avaturn.me", which
is an owner action. The ToU also keeps the IP with Avaturn. Nothing was uploaded to Avaturn and no account was made.
Per the brief, c3 builds the best free alternative on the scout's list that no other slot uses. c1 and c2 both took
Microsoft Rocketbox. Riya is $10 on Superhive, and its free Fab listing returns 403 here. Canino3d and the Sketchfab
"saree" upload need a Sketchfab login to download, and the saree upload's rights chain is doubtful. CharacterZ has no
published licence. So c3 uses the scout's **VRoid / VRM row (row 9)**, from the one VRoid-made adult woman whose
licence is published with the file: the VRM consortium's sample **`VRM1_Constraint_Twist_Sample`, (c) 2022 pixiv Inc.**
It is a stylised (anime-adjacent) character. The scout scored this row's register as weak for Indian parents, and that
risk is carried into the verdict. Not shipped to `public/assets/teacher/**`.

| input | used for | source | licence / terms | evidence |
|---|---|---|---|---|
| `VRM1_Constraint_Twist_Sample.vrm` (10,776,032 B, sha256 `12c2b97e95e700783a6a550dc0eee2d7880aeedccef9ae67bc4c5a2f0f2631a2`) | every vertex, UV and skin weight of the c3 face, eyes, hair and top. Its 57 `Fcl_*` morphs are the raw material of the synthesised ARKit 52 / 15 visemes / 3 tongue keys. Its 13 embedded PNG textures (face, body, mouth, eye white, iris, highlight, eyeline, brow, hair, scalp, top) are recoloured into four atlases | github.com/vrm-c/vrm-specification @ `94e82dd346fa6cf0337c4421728640e5252dd38e` (2026-10-02), `samples/VRM1_Constraint_Twist_Sample/vrm/` | **VRM Public License 1.0** (https://vrm.dev/en/licenses/1.0/). The file's own licence settings (`VRMC_vrm.meta`): `commercialUsage: "corporation"`, `modification: "allowModificationRedistribution"`, `allowRedistribution: true`, `avatarPermission: "everyone"`, `creditNotation: "unnecessary"`, `allowAntisocialOrHateUsage: false` (the three other `allow*` flags are true) | sample `README.md`: "License Information: [VRM Public License 1.0](https://vrm.dev/licenses/1.0/) (c) 2022 pixiv Inc."; meta copied verbatim to `art/character/candidates/c3/third_party/VRM-META.json`; licence text extracted to `third_party/VRM-PUBLIC-LICENSE-1.0.{en,ja}.txt` (page HTML sha256: en `22e38727184a5df1a362d158a989d4d9c732d2f600a998155ea0f52035776a0e`, ja `3b7172907033476ecf66ab42d2bca93a641bf578708c4ce1569a4b025c5a0502`, fetched 2026-10-04) |
| our armature, the arm pose and aim-bone solve, the hidden-skin removal, the head and eye-region scale, the synthesised keys, the recolour, the lip tint, the kurta neckline band, the TaxilaToon shaders | | written by us (`scripts/character/candidates/c3/**`) | ours | — |
| Monk Skin Tone scale MST 6 hex `#a07e56` | albedo anchor and G9 target | skintone.google | CC BY 4.0 (attribution as above) | — |

The exact terms that matter for a paid children's web app (VRM PL 1.0, quoted from the English text):
- **Grant, §2(a)(1):** "a worldwide, royalty-free, non-sublicensable, non-exclusive, irrevocable license to make Model
  Use of the Licensed Work Data, and to perform any of the following acts that the Licensor specifies in the License
  Settings": redistribute it, make **Avatar Use** (operating the avatar as a persona that speaks and acts, which is
  what a talking teacher is), create Adapted Work Data, and redistribute Adapted Work Data. The settings above grant
  all four.
- **Commercial, §2(a)(2)-(3):** the non-commercial-only and personal-only limits apply only if the settings say so. This
  file says `commercialUsage: "corporation"`, so a company may use it commercially.
- **Prohibited expressions, §3(d):** only `allowAntisocialOrHateUsage: false` applies, which forbids anti-social or hate
  expression in renders. The teacher product does neither.
- **Credit, §3(a):** `creditNotation: "unnecessary"`. We still keep the copyright line in the notices.
- **Adapted works, §3(b):** when we redistribute our modified model, our licence must not stop this licence applying to
  the recipient, must be the same or more restrictive, and its terms go into the adapted data's licence settings. The
  shipped GLBs carry the original licence settings, the copyright line and "adapted by Taxila" in
  `asset.extras.taxila.vrmLicense` (finish_c3.mjs).
- **No downstream restrictions, §2(a)(5)(C):** we may not apply "Effective Technological Measures" to the licensed data
  if that restricts recipients' licensed rights. A plain GLB in the browser complies. Do not wrap this one in DRM.
- **Format:** the licence defines Licensed and Adapted Work Data as VRM files. Our GLB is a glTF derived from a VRM
  and is not itself VRM. §2(a)(7) allows "technical modifications necessary" in "all media and formats". [U] Counsel
  should confirm that the format change keeps us inside the grant rather than outside it. Read literally, the grant
  only gets broader for us. No warranty (§4).
- No territory, revenue, platform, field-of-use or "protected format" clause, so web and Android WebView delivery is
  fine.

If c3 ships, the third-party notices carry: "Teacher character adapted from VRM1_Constraint_Twist_Sample, (c) 2022
pixiv Inc., VRM Public License 1.0 (https://vrm.dev/en/licenses/1.0/); modified by Taxila (recoloured, cut to a bust,
re-rigged, facial shapes synthesised)." Not used: VRoid Studio (Windows/macOS only, and its preset terms were not
needed), VRoid Hub models (login), three-vrm (the runtime stays ours), the sample's spring bones and MToon parameters
(our shaders replace them). The lip-sync clip's audio is the bake-off's existing Azure `gpt-4o-mini-tts` sentence
(`docs/design/teacher/renders/audio/teal.mp3`, first 6.0 s), re-used unchanged. Build-time tools: pinned `bpy` 4.2
(Blender glTF importer, GPL; output is ours), scipy, gltf-transform (MIT), meshoptimizer (MIT), KTX-Software 4.4.0
(Apache-2.0).

## Polished-face candidate `c4` (2026-10-04; outputs under `public/assets/teacher-candidates/c4/**` only)

Slot 4 of `docs/design/teacher/polished/SCOUT.md` is **MetaPerson Creator** (Avatar SDK / itSeez3D). It was not built:
exporting even the free first avatar needs a MetaPerson account sign-up (owner only; not created on the owner's behalf),
an upload of the input portrait to Avatar SDK's cloud (the Azure-only call is the owner's), written confirmation that an
exported avatar stays licensed after the EULA's revocable "Term" (https://avatarsdk.com/eula/), and every avatar after
the first costs in-app credits at an unpublished price (https://avatarsdk.com/pricing-cloud/, checked 2026-10-04: "your
first avatar is free, and each additional one costs in-app credits"). The trio (woman, man, older woman) is therefore a
purchase. Per the brief, c4 builds the best free alternative on the scout's list that no other slot uses as a
character. Checked and unreachable or unusable from here: Riya (Fab "free" listing needs a Fab login; Superhive $10),
Canino3d (Sketchfab CC-BY, but the download API answers 401 without an account token), CharacterZ (no published
licence), the "Indian Woman in Saree" upload (doubtful rights chain, no ARKit), VRoid (taken by slot c3, anime). So c4 is
**Microsoft Rocketbox Female_Adult_07** (dark hair in a low bun, tailored jacket): the same MIT library as c1
(Female_Adult_11) and c2 (Business_Female_01), a different character. Not shipped to `public/assets/teacher/**`.
Not used: `three-ws/avatars` on Hugging Face (tagged MIT, but its `michelle.glb` looks like Adobe's Mixamo character, so
the MIT tag cannot be trusted; not on the scout's list).

| input | used for | source | licence / terms | evidence |
|---|---|---|---|---|
| `Female_Adult_07_facial.fbx` (2,136,864 B, sha256 `88b359300657ea0efdbb34de7ab804db8b43c58b2dc143c62ed2615e75936fbc`) | every vertex, UV and skin weight of the c4 face, eyes, lash cards, hair (shell + bun cards) and garment; the source's authored ARKit 52 (`AK_01..52`) and 15 visemes (`AA_VI_00..14`), copied as authored deltas (expression keys gain-scaled as in c1); `HB_12_TongueUp` / `HB_09_TongueIn` seed `tongueTipUp` / `tongueCurl` | github.com/microsoft/Microsoft-Rocketbox @ `0943055db6ec570bcef9f2c8b41c9e5467c808f9`, `Assets/Avatars/Adults/Female_Adult_07/Export/` | **MIT** ("Copyright (c) 2020 Microsoft") | repo `LICENSE.md` sha256 `17474e386e0b9e1a700cc3d06b2b0882a2c376d9c6b49c7f8274409b8f8d2352`, verbatim copy at `art/character/candidates/c4/third_party/ROCKETBOX-LICENSE.txt`; https://github.com/microsoft/Microsoft-Rocketbox/blob/master/LICENSE.md |
| `f007_head_color.tga` (`65e399a091d27b2e66f202ba3628c270f513f80a1ea5776771f5e9239ddeed15`), `f007_head_normal.tga` (`0e9ca730fe44b83bf5024673d8973ef5c0a04cc6817af42a27b4471c5bc3d5e5`), `f007_head_specular.tga` (`d3f1ac4e0f26218e9a07eea3345c5b8b2d24b24a1daa06b9fcb45009ba0d9dd0`), `f007_body_color.tga` (`9a2e740bce46ff2e00c8a24074ee28a1d63198024d03718d5fde6cbfe7ef0fd3`), `f007_opacity_color.tga` (`c7c59dfb5f79160ac7cb88091b7c3e9148f9868008915f35ebfe29dc34e917c1`) | skin albedo (one linear gain to MST 6, G9-solved, a\* +2, freckle/blotch band softened to 45% in the face), painted hair and bun shell re-toned near-black brown in L\*a\*b\*, red ear studs to gold, lips trimmed to rose-brown, iris grey-green to brown; normal; packed (roughness from specular, cavity from normal slope); jacket re-toned to aubergine-brown and the crimson top to ivory; hair/lash alpha cards re-toned | same repo and commit, `.../Female_Adult_07/Textures/` | **MIT** | as above |
| `Female_Adult_07.fbx` (`faaa677a…`), `Female_Adult_07.png` preview (`532a2cc8…`), `f007_body_normal.tga` (`21a439db…`), `f007_body_specular.tga` (`694409439…`) | not used (downloaded) | same | MIT | — |
| our armature, eye UV remap, `_region` attribute (with the neighbour-majority teeth/gum fix), the bust cut, every re-tone, tongue extras | | written by us (`scripts/character/candidates/c4/**`, forked from `c1`) | ours | — |
| Monk Skin Tone scale MST 6 hex `#a07e56` | G9 target | skintone.google | CC BY 4.0 | — |

Terms that matter for a paid children's web app: identical to c1 and c2. MIT has no field-of-use, revenue, platform or
protected-format clause, so a plain GLB in a browser or Android WebView is permitted, modification and sale included.
The only obligation is to carry the copyright notice and permission text; if c4 ships, the app's third-party notices
carry the verbatim MIT text and "Teacher character derived from the Microsoft Rocketbox Avatar Library
(Female_Adult_07), MIT License; modified by Taxila." No warranty. The lip-sync clip's audio is the bake-off's existing
Azure `gpt-4o-mini-tts` sentence (`docs/design/teacher/renders/audio/teal.mp3`, first 6.0 s, 0.25 s fade), re-used
unchanged. Build-time tools: pinned `bpy` 4.2 (Blender FBX importer, GPL; output is ours), gltf-transform (MIT),
meshoptimizer (MIT), KTX-Software 4.4.0 (Apache-2.0), numpy / pillow / scipy.

## Style C stylised build (2026-10-04, plan phase; nothing shipped yet)

| input | used for | source | licence | evidence |
|---|---|---|---|---|
| 19 reference images `docs/design/teacher/stylised/build/refs/*.webp` | fitting targets and judge stimuli (not shipped pixels) | Azure Foundry `taxila-image` (gpt-image-2) edits of our concept `c-front.webp`, `scripts/character/stylised/gen-refs.mjs` | our output under the Azure OpenAI terms | prompts, dates and usage in `refs/refs.json`; sha256 in `build/TECH-PLAN.md` §2.1 |

Planned tools and models, with licence status, are listed in `docs/design/teacher/stylised/build/TECH-PLAN.md` §11.
Each is added to the tables above only once it is actually used, with source and hash.

### Style C, Arm B (image-to-3D as a shape target; 2026-10-04)

Every shipped vertex of `art/character/stylised/armB/teacher.glb` is ours: the skin is our template
(`scripts/character/stylised/armB/template.py`) placed by rays onto the sculpt; eyes, cornea, lids, lashes, brows, teeth,
tongue, ears, studs and bindi are generated by our scripts; hair and bust are new decimated meshes fitted to the sculpt's
labelled regions. The AI meshes are fitting targets only and are never used to train or improve another model.

| input | used for | source | licence | evidence |
|---|---|---|---|---|
| Hunyuan3D-2mv (`tencent/Hunyuan3D-2mv` @ `3a761b539b29fe4ff64714813aa9560fd66f5de0`, `hunyuan3d-dit-v2-mv/model.fp16.safetensors` sha256 `d36f5881bcdc56726b73e517cd444c13c60732431622da7268145355c8d38e9c`; code `Tencent-Hunyuan/Hunyuan3D-2` @ `f8db63096c8282cb27354314d896feba5ba6ff8a`) | the chosen shape target `hmv_A_s1` (front-ortho + profile-left as "left" + profile-right as "right" + back, seed 1, octree 512, 50 steps, guidance 5): sha256 `342dd4732df7c41b7bb5f949aad32cd7c886690a09d82375d0c8f7a7b60f3d21` | AWS job `stylised3d-20261004-074736-d124` (`scripts/gpu/jobs/stylised3d/`) | Tencent Hunyuan 3D 2.0 Community Licence: territory excludes EU, UK, South Korea; separate licence above 1M MAU; outputs ours; no use of outputs to improve other models | weights-card LICENSE sha256 `e5e6e2041e18326d82cd105a1b9404e36db55263dd9d42d4989f917c2501b67b`; repo LICENSE sha256 `94259df223918a5733677965c1bfe1774a2dba25042d9c3b47a3418ea6c1f324` (copies in the run's `pins/`) |
| Hunyuan3D-2.1 shape + paint (pinned as in face3d: `tencent/Hunyuan3D-2.1` @ `0b94677654c57bb9a6b6845cd7b704ccf551d327`, code @ `82920d643c0dc2f7bfd7255f45f62d386edfe60c`) | 5 single-view candidate shapes (not chosen); PBR paint of `hmv_A_s1` (`paint_hmv_A_s1/textured.glb` sha256 `1ed29daf4580814d148493987ea2aaff1f74ed3aa721295aeb8b23ecf9588643`) used ONLY to label hair / skin / kurta / piping regions and as the colour source of the kurta+piping bake (snapped to our palette, so no painted pixel ships) | same job | Tencent Hunyuan 3D 2.1 Community Licence (same territory / MAU / no-training terms) | LICENSE sha256 `b79ac5e11ce063b6c6570dbe9686a45a03ba08bd248aa6aa82fb342a23a81c0c` (repo), `5bd08f93b2d280bb26ff3eed5d3996fe47a9698b5f7785163928668d7fd578c6` (weights) |
| rembg + U-2-Net | background mattes of the refs on the instance | pinned in the face3d weight lock (`u2net.onnx`) | MIT / Apache-2.0 | `scripts/gpu/jobs/stylised3d/weights.lock.json` |
| iris texture, all part meshes, the shape rig, materials | eyes, lids, brows, lashes, mouth interior, ears, studs, bindi, every morph | ours (`scripts/character/stylised/armB/*.py`) | ours | — |

Build tools: `bpy` 4.2 (GPL tool, output ours; Cycles for the colour bake and the evidence renders), gltf-transform
(MIT), meshoptimizer (MIT), KTX-Software 4.4.0 (Apache-2.0), numpy / scipy / pillow. Counsel note carried from
TECH-PLAN §12.3: the Hunyuan territory clause may be read to reach assets "built this way"; the shipped mesh is our
template fitted to the sculpt. Step1X-3D (Apache-2.0) was not run in this pass.

### Style C, Arm A (procedural, no image-to-3D at all; 2026-10-04)

`art/character/stylised/armA/teacher.glb` is generated entirely by our scripts in `scripts/character/stylised/armA/`
from the numbers in `params.json`: an analytic SDF head (`sdf.py`), a cube-sphere quad grid ray-cast onto it with
inset ring patches for the eyes and mouth (`head.py`), procedural parts (`parts.py`: eyeballs, cornea shells, iris
texture drawn by numpy, liner, brows, teeth, tongue, ears, studs, bindi, swept hair shells, bun, locks, lofted kurta),
the shape rig and its 82 baked keys (`keys.py`), and the HeadRig skeleton (`export.py`). No third-party mesh, texture,
model weight or generated 3D asset is used. The refs and the concept were only looked at (by eye, and as overlay
outlines for placement); no pixel of them ships.

| input | used for | source | licence | evidence |
|---|---|---|---|---|
| `bpy` 4.2.0 wheel (PyPI) | headless build, Cycles evidence renders, glTF export | pypi.org/project/bpy | GPL-3.0 tool; outputs are ours | `bpy/__init__.so` sha256 `ea1bb1bdf79ceff2f8f3bd79d0bfc1d20c151250586d08e85f25fad68631d6f6` |
| gltf-transform, meshoptimizer | meshopt compression in `armA/finish.mjs` | npm (in `$CHAR_TOOLS`) | MIT / MIT | as already listed above |
| numpy, scipy, pillow | geometry, gates, sheets | PyPI (in `$CHAR_HOME/bpyenv`) | BSD / BSD / HPND | as above |

No GPU was used for Arm A (CPU Cycles in the container).

### Style C, polish round 2 (2026-10-04; `art/character/stylised/polish-r2/`)

Built only by our scripts in `scripts/character/stylised/r2/`, which are an extension of Arm A: the analytic SDF head,
eye-blend and conform passes, parts, shape rig, AO bake, export, and the TaxilaToon three.js shader in `r2/viewer/`.
No third-party mesh, texture, model weight or generated 3D asset is used. Arm B contributed code ideas only: the
G-partial chord push, the B+ LOD, the KTX2 finish and the shoulder bones. It contributed no Arm B geometry.

| item | used for | source | licence | evidence |
|---|---|---|---|---|
| `teacher.glb` (H, 24,583 tris) / `teacher_Bplus.glb` (10,604 tris) | outputs | ours | ours | sha256 `d0047ac6d424bd99137c7bd810164e7f748e47fd65b832b4e31590af2f35e449` / `0b3a5cac597777c0cc62b51d2ee5bd0163e32168ef6d90e5aeb9c055dc61d3e4` |
| three.js 0.180.0 | evidence renders (TaxilaToon), the runtime it targets | npm `three` | MIT | `build/three.module.js` sha256 `c8211c69345d2e9949dc7a8ac969380497aa0600a5a8ac6a459c8cd02dd9cb8a` |
| Playwright 1.63.0 + Chromium (SwiftShader), Vite 8.3.2 | headless render harness (`r2/render3.mjs`) | npm | Apache-2.0 / BSD-3 (Chromium) / MIT | tools only; nothing ships |
| KTX-Software 4.4.0, gltf-transform, meshoptimizer | `r2/finish.mjs` | as listed for Arm B | Apache-2.0 / MIT / MIT | as above |
| Foundry `DEPLOY_BRAIN` (GPT) and `grok-4-20-non-reasoning` | advisory vision judges (`r2/judge/judge2.py`); `Mistral-Large-3` and `grok-4-1-fast-non-reasoning` were tried and failed the sanity battery | Azure Foundry Direct | Azure terms; outputs ours | raw replies in `docs/design/teacher/stylised/build/polish-r2/judge-r2.json` |

No GPU was used in this round.

## 2D puppet, arm P (painted layers), 2026-10-04 (`art/character/puppet2d/P/`, `scripts/character/puppet2d/P/`)

| input / tool | role | licence | note |
|---|---|---|---|
| `docs/design/teacher/stylised/concepts/c-front.webp` (our concept, gpt-image-2 on Azure Foundry) | every layer pixel at rest (cut, matted, membrane-filled by our code) | our output under the Azure OpenAI terms | shipped (P) |
| 30 mouth patches: masked edits of a 4x close-up of c-front's lower face on `taxila-image` (gpt-image-2), c-front's own mouth as the second reference image | the painted mouth set | our output under the Azure OpenAI terms | prompts + usage per call in `art/character/puppet2d/ledger.json` |
| Own WebGL2 renderer, rig, mouth solver, springs (`scripts/character/puppet2d/P/runtime/*.js`) | runtime | ours | no third-party runtime code; Live2D / Inochi2D / Cartoon Animator / Rive / Spine used as technique references only, nothing copied |
| `src/avatar/{lip,behaviour,compositor}.ts` + `shared/tutors.js` (rng32) | the demo drives the puppet through them, unchanged | ours | bundled from the real source |
| numpy, scipy, pillow, opencv-python-headless 5.0 (ECC registration, warp) | build-time cut, matte, fill, registration | BSD-3 / BSD-3 / MIT-CMU / Apache-2.0 | nothing ships |
| vite 8 (rolldown) | demo bundle | MIT | build-time |
| Playwright 1.63, Chromium (SwiftShader), ffmpeg | evidence renders, clips, fps proxy | Apache-2.0 / BSD / LGPL | evidence only |
| voice clip `docs/design/teacher/renders/audio/teal.mp3` (gpt-4o-mini-tts on Azure, voice marin) + its CTC alignment (wav2vec2-base-960h, Apache-2.0) | demo audio + viseme timing | our output / Apache-2.0 model | evidence only |

Not used: Live2D (licence blocked), PixiJS (fallback not needed), Real-ESRGAN (no upscale was needed: the puppet renders at c-front's native 1024 px).

## 2D puppet, arm V (parametric vector), 2026-10-04 (`art/character/puppet2d/V/`, `scripts/character/puppet2d/V/`)

No image model was called and no image pixel ships: every region is a vector contour with a fitted shading field
(constant + Gaussian RBFs + edge-distance terms, ridge least squares against c-front), evaluated at mesh vertices; the
features are parametric shapes rebuilt per frame. Image spend for this arm: USD 0.

| input / tool | role | licence | note |
|---|---|---|---|
| `docs/design/teacher/stylised/concepts/c-front.webp` (our concept) | fitting target only (contours traced, colours fitted) | our output under the Azure OpenAI terms | not shipped as pixels |
| Own WebGL2 renderer, rig, mouth solver, springs (`scripts/character/puppet2d/V/{rig,mouth}.js`) | runtime | ours | zero runtime dependencies; Live2D / Inochi2D / Cartoon Animator are technique references only |
| `src/avatar/{behaviour,compositor,lip}.ts` + `shared/tutors.js` | the demo drives the puppet through them, unchanged | ours | bundled from the real source by `build-demo.mjs` |
| numpy, scipy (Delaunay, EDT, ndimage), pillow, opencv-python-headless 5.0 | build-time segmentation, meshing, fitting | BSD-3 / BSD-3 / MIT-CMU / Apache-2.0 | nothing ships |
| vite 8 | demo bundle | MIT | build-time |
| Playwright 1.63, Chromium (SwiftShader), ffmpeg | evidence stills, clips, fps proxy | Apache-2.0 / BSD / LGPL | evidence only |
| Foundry `DEPLOY_BRAIN` (gpt-5.6-sol) | advisory blind vision judge (`judge_v.py`), text tokens only | Azure terms | raw replies in `art/character/puppet2d/V/evidence/judge-v-blind.json` |

## 2D puppet, polish r2 of arm P, 2026-10-04 (`art/character/puppet2d/polish-r2/`, `scripts/character/puppet2d/polish-r2/`)

| What | Used for | Source | Licence | Notes |
|---|---|---|---|---|
| c-front + the arm-P mouth atlas (gpt-image-2 masked edits) | every layer and the 30 r1 mouth patches | carried over from arm P, unchanged | ours / Azure OpenAI terms | |
| 2 new mouth patches (`hmm`, `attentive`): masked edits on `taxila-image` (gpt-image-2), c-front's own mouth as the reference image (`gen-mouths-r2.mjs`, `cut-mouths-r2.py`) | thinking and listening mouths | Azure AI Foundry `taxila-image` (sold direct) | our output under the Azure OpenAI terms | USD 0.18 in `art/character/puppet2d/ledger.json` (total 7.48 of the 30 cap) |
| Own WebGL2 renderer, rig, mouth solver, expression emitters, listener (`scripts/character/puppet2d/polish-r2/runtime/{gl,rig,mouth,expr,demo}.js`) | runtime | ours | ours | the brow-ribbon channels and the shared head dome are IDEAS from arm V, re-implemented; no V code copied |
| numpy, scipy, OpenCV, Pillow | layer cutting / matting (`layers.py`) | pip | BSD-3 / BSD-3 / Apache-2.0 / HPND | build-time only |
| vite 8, Playwright 1.63 + Chromium (SwiftShader), ffmpeg | demo bundle, evidence stills/clips, fps proxy | npm / system | MIT / Apache-2.0 / BSD / LGPL | build/evidence only; nothing ships |
| Foundry `taxila-brain` (gpt-5.6-sol) + `grok-4-20-reasoning` | advisory blind panel + forced-choice recognition (`judge-r2.mjs`, `emo-ceiling.mjs`) | Azure AI Foundry (sold direct) | Azure terms | text/vision tokens only; raw replies in `art/character/puppet2d/polish-r2/judge-*.json` |

Not used: Live2D (licence blocked), Rive (GUI authoring), PixiJS (plain WebGL2 suffices).

## 2D puppet, polish r3 of arm P, 2026-10-04 (`art/character/puppet2d/polish-r3/`, `scripts/character/puppet2d/polish-r3/`)

| What | Used for | Source | Licence | Notes |
|---|---|---|---|---|
| c-front + the r2 layers (`layers.py` cut, carried over) | every head/body layer; r3 edits them in `fixups.py` (no new pixels except below) | ours | ours / Azure OpenAI terms | |
| 4 painted keys on `taxila-image` (gpt-image-2 edit, c-front as identity reference, high quality): `keys/yawL-0`, `keys/yawR-0` (with `build/refs/q3-left/right` as pose reference), `keys/mid-0`, `keys/closed-0` (masked eye edits) (`gen-keys.mjs`) | turn keyforms (landmark TPS field, `keyfield.py`; the yaw plates are fitting targets, NOT shipped as pixels); painted mid / shut lids (`lidkeys.py`, shipped as 4 small layers) | Azure AI Foundry `taxila-image` (sold direct) | our output under the Azure OpenAI terms | USD 1.19 in `art/character/puppet2d/ledger.json` (total 8.76 of the 30 cap) |
| The arm-P gpt-image-2 mouth atlas | ONLY the mouth interior now: upper teeth row (from `laugh`), cavity gradient (`aa`), tongue surface (`LL`), cut to `interior.png` by `interior.py` | carried over | ours / Azure OpenAI terms | the lips are c-front's own lips on the warped shell (`runtime/lips.js`) |
| Own WebGL2 renderer, rig, lip shell + solver, blink shaper, expression emitters (`scripts/character/puppet2d/polish-r3/runtime/*.js`) | runtime | ours | ours | zero runtime dependencies |
| numpy, scipy (ndimage, RBFInterpolator thin-plate spline, optimize), OpenCV, Pillow (WebP encode) | build-time cutting, TPS keyform fit, brow fit, WebP packing | pip | BSD-3 / BSD-3 / Apache-2.0 / HPND | build-time only; libwebp (BSD-3) via Pillow |
| vite 8, Playwright 1.63 + Chromium (SwiftShader), ffmpeg | bundle, battery renders, clips | npm / system | MIT / Apache-2.0 / BSD / LGPL | build/evidence only; nothing ships |
| Foundry `taxila-brain` (gpt-5.6-sol) | advisory blind judge (`scripts/character/puppet2d/judge-r3-blind.mjs`) | Azure AI Foundry (sold direct) | Azure terms | raw replies in `docs/design/teacher/puppet2d/judge-r3/` |

Not used: Live2D (licence blocked), Rive (GUI authoring), PixiJS (plain WebGL2 suffices).
