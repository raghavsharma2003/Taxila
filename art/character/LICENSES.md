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
