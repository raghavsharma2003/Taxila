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
