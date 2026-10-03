# CHARACTER-PIPELINE.md: the in-house teacher characters, end to end

Date: 2026-10-03. Owner decision `character-built-in-house` (no contracted artist, no paid or third-party character
service; three.js/WebGL runtime; Azure-only applies to runtime AI, build-time open-source tools are fine).
Target: `TEACHER-VISUAL.md` (S3h hero head and shoulders, tiers H / B+ / B-lite / D). This doc is how the characters
are made, what came out, how close it is to the target, and the contract the `src/avatar` runtime codes against.

Evidence tags as in TEACHER-VISUAL: **[M]** measured here, **[U]** judgement or estimate.

**Revision: iteration 2 (2026-10-03, same day), after the art-director review.** Every high-severity review item and
most of the others were applied by script, the full evidence set was re-rendered, the tiers re-measured, and the
iteration-1 sheets kept beside the new ones (§9). The top-line changes:
- **The skin is in its Monk band.** Rendered cheek / forehead / jaw L\*a\*b\* under the shipped shader is within
  0.3 L\* and 0.5 C\* of the MST hex on all three looks (G9, a new gate). Iteration 1 was about 23 L\* too light.
- **Two root-cause bugs** behind the "tan, patchy brows" and the "split" hair were found and fixed (§7, items 8-10).
  The canvas alpha one is a **runtime-contract change for `src/avatar`** (§4.4).
- **Every gate now reports a pass the spec numbers support**: lip gap p95 ≤ 0.3 mm by surface distance, mirror
  error ≤ 0.21 mm, a penetration count, a teeth-luma check, and the hashes are pinned.
- **The evidence clip now shows the rig**: the forced-aligned sentence drives the visemes, and 9 of 9 bilabial
  frames close. The M0 RMS driver arm closes on 1-3 of 9, which is why the driver requirements in §4.4 exist.
- **Not met, still:** a photoreal-leaning identity, strand hair, modelled garments, and emotion legibility (a vision
  self-check scores 37%, against 24% before; the bar is ≥ 70% per emotion). §8 and §10 give the plan.

---

## 0. One screen (iteration 1 text, updated where marked)

- **One command regenerates everything** from licence-clean inputs: `node scripts/character/build.mjs` (≈ 17 min of
  asset build for three looks on 4 vCPU, plus ≈ 25 min of evidence renders and measurement on SwiftShader) [M].
- **Three looks, no names.** `teal`, `slate`, `plum` are the TEACHER-VISUAL §4.3 designs (rows 1, 2, 3 = the designs
  the cast calls asha, arjun, uma). The child names the teacher; nothing in a GLB, texture, node, mesh or material
  carries a name (meshes are `face`, `eyes`, `cards`, `hair`, `garment`, `lens`).
- **Shipped per look:** `public/assets/teacher/<look>/{H,Bplus,Blite}.glb`, `runtime.json`, `plate/{plate,mouth,blink}.webp`
  + `plate.json` (tier D).
- **All inputs are CC0 or ours** (`art/character/LICENSES.md`): MakeHuman base mesh and targets, the faceunits01 /
  visemes02 packs, MakeHuman teeth, tongue, brow, lash and hair proxies. Every texture is procedural from our own mesh.
- **Budgets met** on every look (§6): H ≤ 6 MB / ≤ 45k tris / ≤ 8 draws; B+ ≤ 2.2 MB / ≤ 18k tris / ≤ 5 draws.
  Iteration 2: H 5.53-5.93 MB, B+ 1.75-1.92 MB, B-lite 0.73-0.77 MB, D plates 16-27 KB.
- **Honest verdict (§8):** a working, fully rigged, tiered, validated character factory whose output is a clean
  real-time CG teacher, **not yet the TEACHER-VISUAL "photoreal-leaning hero"**. The rig, keys, tiers, shaders,
  budgets and runtime contract are at spec; the *look* (sculpt, skin, hair, garments) is the gap, and it is the part
  an artist's eye improves fastest. The Codex references had not landed during this run, so the identity was set from
  the MANIFEST hex data and descriptions only.

---

## 1. Regenerate

```
node scripts/character/build.mjs                         # setup (idempotent) + 3 looks + renders + measure + runtime.json
node scripts/character/build.mjs --looks teal            # one look
node scripts/character/build.mjs --skip-render           # assets only
node scripts/character/build.mjs --setup-only            # tools only
node scripts/character/build.mjs --from texture          # resume a look's stages (build | texture | export | finish)
node scripts/character/build.mjs --solve-g9              # closed loop: render -> L*a*b* -> skin.albedoGain -> re-bake
NODE_USE_ENV_PROXY=1 node scripts/character/tts.mjs      # (once) the TTS sentence per look for the lip-sync clips
python3 scripts/character/align.py                       # (once; build.mjs runs it if missing) viseme timeline per clip
node scripts/character/g9.mjs                            # G9 + teeth-luma gate alone (measure.mjs also runs it)
NODE_USE_ENV_PROXY=1 node scripts/character/emotion-check.mjs   # vision forced-choice legibility proxy (Azure)
python3 scripts/character/compare.py docs/design/teacher/renders # before | after sheets
```

Iteration-2 build notes: every download is sha256-pinned and every package version is exact (G10, `build.mjs`
`SHA256`); `build.mjs` fetches `claude/blissful-mayer-icwe2j` and **fails** if Codex references under
`art/gen/teacher/**` exist but a look does not declare `references.used` (override: `--allow-unused-refs`). Wall
time per look, 4 vCPU, three looks in parallel: build_look 15 s, texture 3-4 min (garment AO added), export + finish
1 min; evidence renders ≈ 45 min for three looks (two lip-sync arms now); measure ≈ 6 min.

Setup installs into `$CHAR_HOME` (default `/tmp/claude-0/char`, outside the repo): a Python venv with the `bpy==4.2.0`
wheel (≈ 520 MB wheel, deleted after install), the MPFB 2.0.17 extension, the CC0 packs (zips deleted after unpack,
≈ 340 MB unpacked), `@gltf-transform/*` 4.x + `meshoptimizer`, and KTX-Software 4.4.0 (`toktx`). Nothing under
`art/character/**` is a `.blend`: every source is script-regenerable from the look spec, so nothing large is committed.

| path | what |
|---|---|
| `art/character/looks/<look>.json` | the look spec: MakeHuman macros, identity targets, seed, skin / lip / iris / hair hex, garment, accessory, faceStyle (asymmetry) |
| `art/character/reports/<look>.json` | every gate number, key record, count and tier budget of the last build |
| `art/character/LICENSES.md` | licence of every input |
| `scripts/character/blender/build_look.py` | stage 1: human, identity, head scale, keys, proxies, bust cut, mouth, tongue extras, correctives, eyes, garments, UVs, validation |
| `scripts/character/blender/keys.py`, `parts.py`, `mpfb_env.py` | key sets + correctives + validators; garments, glasses, studs, bun; MPFB glue |
| `scripts/character/blender/texture.py` | stage 1b: numpy UV rasteriser + procedural skin, garment, hair and card maps |
| `scripts/character/blender/export_tier.py` | stage 2: tier geometry, armature + weights, raw GLB |
| `scripts/character/finish.mjs` | stage 3: KTX2 (UASTC / ETC1S), meshopt, budgets → `public/assets/teacher/<look>/` |
| `scripts/character/viewer/{rig,shaders,presets,main}.js` | the GLB rig (runtime contract implementation), TaxilaSkin/Eye/Hair/Cloth/Lens, emotions/states, evidence page |
| `scripts/character/{render,measure,harness,tts,runtime-json}.mjs`, `plates.py`, `contact.py` | evidence + measurement + runtime.json |

## 2. What each stage does

1. **Base mesh (CC0).** `HumanService.create_human` from macro sliders (gender, age 24 / 26 / 34 → 0.478 / 0.508 /
   0.569, weight, proportions, ethnic mix). MPFB topology keeps the lid and lip loops (`avatar-asset-dead-ends` #3).
2. **Scripted sculpt.** 20–30 MakeHuman modelling targets per look (head shape, chin, cheekbones, nose width and
   nostrils, lip volume, eye scale ×1.03–1.06 class, epicanthus), plus seeded one-sided offsets (cheek volume, cheek
   bones, lid height: the 3–8% asymmetry). Baked into the basis. Then the S3h **head ×1.03** about the skull with a
   tilted-plane falloff so the chin stays rigid and the throat does not scale.
2b. **Identity sculpt layer (iteration 2, `identity_sculpt.py`).** A landmark-anchored Gaussian-RBF displacement field
   driven by each look's `sculpt` block, in millimetres on named regions (brow ridge, inner brow, lid crease, nose
   bridge and tip, alar width, philtrum, upper and lower lip, mouth corner, cheek fat pad, cheek bone, jaw angle,
   chin). Anchors are found on our own mesh (eye helpers, lip group, nose tip, chin). It runs before the head scale,
   the face units and the proxies, so the keys and the MHCLO brows / lashes / teeth all fit the sculpted basis. The
   three looks now differ in nose, lip line, brow ridge, cheek and jaw (values in `art/character/looks/*.json`).
   When the Codex turnarounds land, the block is meant to be **fitted** to ~40 annotated landmarks, not set by hand.
3. **Shape keys by script.** ARKit 52 + 15 visemes from the CC0 packs, loaded *after* the identity bake and
   interpolated onto the teeth/tongue/brow/lash proxies through their MHCLO bindings. Then:
   - **symmetrise (iteration 2)**: every L/R unit is averaged with the mirror of its partner on a TOPOLOGICAL mirror
     map taken from the still-symmetric base (0 of 19,158 vertices unmatched), and bilateral keys with their own
     mirror. faceunits01's L/R units differed by up to 6.5 mm (G3). The designed 3-8% asymmetry is applied at runtime
     (`faceStyle.asym`) and in the identity targets, never by the pack;
   - **scripted expression deltas (iteration 2, `keys.expression_correctives`)**: `mouthSmile*` gets a corner lift up
     and back (60% of the unit's corner travel) plus a nasolabial bulge lateral to the fold; `cheekSquint*` gets a
     lower-lid raise and a cheek-pad lift; `browInnerUp` / `browOuterUp*` x1.3. The runtime calibration table is now
     **empty** (was 1.2-1.6x on smile, squint and brow);
   - **resting smile** baked into the basis per look (`faceStyle.restSmile`: teal 0.03, plum 0.05), so plum's neutral
     no longer reads stern;
   - **lip seal**: MakeHuman's neutral rests with the lips ~1.5 mm apart (parted lips at rest also read as the wrong
     register). Iteration 2 seals by **point-to-surface** distance: every upper-lip vertex within 2.4 mm of the lower
     lip's surface (and vice versa) moves half-way to it, spread with a 7 mm falloff, iterated until the p95 gap is
     ≤ 0.25 mm; basis, `viseme_PP` and `mouthClose` (with `jawOpen`) are each sealed [M: §5];
   - **Hindi tongue extras** as region-weighted progressive bends on the tongue: `tongueTipUp` (dental: blade to the
     upper incisors, 26° from 62% of the length), `tongueCurl` (retroflex: 70° from 74%, tip up and back),
     `tongueWide` (open ā / e: +20% width, flattened);
   - **7 correctives (12 keys; sided where a parent is sided)** derived from the rig's own deltas (§4.2);
   - teeth decimated (rigid per jaw; key deltas re-mapped **within the same loose part**, see §7 rejections).
4. **Eyes, teeth, tongue, hair, brows, lashes.** (Iteration 2: upper teeth 1.3 mm down and 1.0 mm forward, the tongue
   2.5 mm up and 2 mm forward; a gum weight in the `_region` fraction (1.00 enamel to 1.45 gum); lower lash cards
   removed; brow / lash cards packed into their halves of the cards atlas, which they had not been; ponytail lifted
   4 cm with a 12° tail tilt and crown volume; fringe cards in front of the forehead clipped on slate.) Our own eyeball (sclera/iris ball + a real cornea bulge: cornea
   radius 0.693 r, apex 1.07 r → limbus 0.48 r), fitted to the MakeHuman eye helper (radius = 0.962 × the cage, a
   sphere fit). The iris is shaded under the cornea with refraction parallax (§4.3). Teeth/tongue/bag are merged into
   the face mesh (`_region` attribute) so the mouth costs no draw call. Brow cards (H) and lash cards are MakeHuman
   CC0 cards; hair is MakeHuman CC0 card hair (`ponytail01`, `short02`, `short04` + a scripted bun) with our colour.
5. **Skin (iteration 2 changes first).** Albedo = the look's **MST hex** x a per-look per-channel `albedoGain` solved
   by G9 (§5); shade and lip keep the ratios of the old design hexes; lips desaturated 20%, coverage 0.62 → 0.4, a
   feathered border, half the lip-line normal; nasolabial σ 2.2 → 3.5 mm at 0.9 → 0.5 mm depth along the alar-base fold
   path; static wrinkles 0 below 30 years (`ageYears`); roughness ≥ 0.42, less T-zone gloss, specular x(1 − 0.1 (MST − 6));
   H gets its own albedo without the painted brows (a 35% under-tone only); brows at 1024 px, full colour, alpha x1.6;
   a narrower scalp blend; garments: indigo twill denim, a two-colour woven plaid, the pallu trim, and per-vertex
   garment AO. Iteration-1 text: `texture.py` rasterises the face's own UVs (one angle-based chart for the expressive face at 2.4× texel
   density, smart-projected charts for scalp, ears, neck) and evaluates per texel, from the texel's 3D rest position:
   albedo (MST hex pulled 12% to grey, melanin noise, periorbital and lid-crease shade, haemoglobin zones on cheeks,
   nose, ears and chin, lips, painted brows, scalp, stubble for `slate`), a tangent-space normal (pores at low
   amplitude, lip lines, soft undulation; computed seam-free along the texel's own tangent frame), **one compress
   wrinkle map** (forehead, glabella, crow's feet, nasolabial, under-eye, chin) + a stretch map (H), two RGBA region
   masks (the TEACHER-VISUAL 8 regions), and a packed cavity / roughness / thickness / ambient-occlusion map (AO from
   24-ray hemisphere casts per vertex against face + garment).
6. **Export.** (Iteration 2: a per-vertex `_strand` root-to-tip tangent on hair and cards, written in glTF axes; the
   glasses rims and studs bypass the B+ decimator; B+ face albedo in UASTC; H cards atlas 2048 x 1024 with UASTC RDO 2.5
   on the card textures.) Blender glTF (morph normals off, one material per mesh, Mixamo-style bones `Spine2 Neck Head LeftEye
   RightEye LeftShoulder RightShoulder`, root `Armature`), then `finish.mjs`: KTX2 (UASTC for normals, alpha and H
   colour; ETC1S for B+ / B-lite colour; zstd 19, mipmaps), meshopt (`EXT_meshopt_compression` + quantization). Draco
   is not used: it leaves morph targets uncompressed (`avatar-asset-dead-ends` #1).
7. **Evidence** (`render.mjs`; iteration 2: two lip-sync arms, `lipsync.mp4` driven by the forced-aligned visemes and
   `lipsync-rms.mp4` by the M0 driver with the proposed expander settings; the mouth camera framed on the incisor
   landmark; the canvas created opaque, §4.4): headless three.js in Chromium, SwiftShader. Turntable (36 frames → MP4, 8 stills),
   9 emotions, 7 owner states, 15 visemes + 3 tongue keys, tier comparison, a lip-sync clip from a real Azure
   `gpt-4o-mini-tts` sentence driven by **the real `src/avatar` stack** (`LipDriver` → `Behaviour` → `Compositor`, imported
   unchanged through Vite), and the tier-D plates rendered from the B+ runtime. Output: `docs/design/teacher/renders/<look>/`.
8. **Measurement** (`measure.mjs`), §6.

---

## 3. Tiers as built

| | H | B+ | B-lite | D |
|---|---|---|---|---|
| geometry | MPFB sd0 face + hi eyes (36×28 + cornea), brow + lash cards, full card hair | same face, lo eyes (14×10), lash cards, hair ≤ 3k tris, garment ≤ 2.2k | **same GLB geometry as B+** | plate + 5-cell mouth strip + blink overlay (≈ 30–45 KB webp) |
| morph targets | 82: ARKit 52 + 15 visemes + 3 tongue + 12 correctives | 58: ARKit 52 + `tongueTipUp` + 5 corrective keys (3 logical) | 58 | — |
| maps | albedo 2048 UASTC (no painted brows), normal 2048, wrinkle compress + stretch 1024, masks 512 ×2, packed 1024, hair 2048, cards 2048×1024, cloth 1024 | albedo 1024 UASTC (was ETC1S), normal 1024 UASTC, wrinkle 512, masks 256 ×2, packed 512, hair 1024, cloth 512 | albedo, packed 256, hair, cards, cloth only (no normal, wrinkle, masks) | — |
| shading | TaxilaSkin: LUT diffuse + dual GGX + wrinkle blend + stretch + back-scatter + flush; TaxilaEye full | TaxilaSkin without stretch/back-scatter/flush | `TIER_LITE`: wrap Lambert + rim, no spec, no normal | DOM |

Deviation from TEACHER-VISUAL §5.1, stated: **H uses the sd0 face, not sd1.** MPFB's head is ≈ 3.9k vertices, so
sd1 of the whole head is ≈ 31k tris against the §5.1 cap of 16k; only a face-mask-only subdivision fits, and it is
not built yet (the keys would have to be re-evaluated per state through the subdivision). H's extra fidelity today
is the eyes, brow cards, maps at 2× resolution, the stretch map, back-scatter, and 82 keys.
Deviation, stated: §5.2's totals say "H 77, B+ 55"; correctives with sided parents need sided keys (a bilateral key
cannot follow a one-eyed blink), so H ships 82 and B+ 58.

## 4. Runtime contract for `src/avatar` (do not edit src/avatar from this workstream; this is the note)

### 4.1 Files and selection

- `public/assets/teacher/<look>/H.glb`, `Bplus.glb`, `Blite.glb`, `runtime.json`, `plate/plate.webp`, `plate/mouth.webp`,
  `plate/blink.webp`, `plate/plate.json`. `<look>` ∈ `teal | slate | plum`. The tutor id → look map lives in code
  (`shared/tutors.js` gets a `lookId`): asha → `teal`, arjun → `slate`, uma → `plum`; a child-named teacher points at
  a look id, never the reverse.
- Tier selection follows TEACHER-VISUAL §10 and `src/avatar/tier.ts`: the existing `B` maps to **B+** (`Bplus.glb`),
  `Blite` to **B-lite** (`Blite.glb`, with the tier's runtime knobs: DPR 1.0, no MSAA, 20 fps), `D` to the plate,
  `E` to voice-only. **H** is a new tier: MEDIA_PERFORMANCE_CLASS ≥ 33 or the GPU allow-list, RAM ≥ 6 GB, probe pass
  at H. "On-screen size beats device class": in the SpeechRow (≤ 160 px) load B+.
- Loader: `GLTFLoader` + `KTX2Loader` (basis transcoder at `three/examples/jsm/libs/basis/`) + `MeshoptDecoder`.
  `EXT_meshopt_compression`, `KHR_mesh_quantization` and `KHR_texture_basisu` are **required** extensions.
- **Quantization trap:** positions are quantized; for skinned meshes the dequantisation lives in the inverse bind
  matrices, so raw `position` attributes are not metres. Compute any world landmark with
  `mesh.getVertexPosition(i, v)` + `localToWorld` (what `rig.js` does); bind-space math inside shaders stays valid
  because the scale is uniform.

### 4.2 Driving (the `HeadRig` contract, unchanged)

`scripts/character/viewer/rig.js` implements `src/avatar/three/head.ts`'s `HeadRig`:
`apply(bs, head[pitch,yaw,roll], gaze[yaw,pitch], lean, breath)`, `dispose()`, `stats()` — so the factory GLB swaps
in behind the same interface (`avatar-m0-procedural-head`). Port `rig.js`, `shaders.js`, `presets.js` into
`src/avatar/three/` as they are. Rules it applies after the compositor:

1. **Visemes:** H has `viseme_*` morphs and takes them directly. B+ / B-lite fold each viseme into ARKit keys through
   `runtime.json.visemeFold` (the per-character `lipMatrix` seed; `DD` and `nn` also raise `tongueTipUp`).
2. **Calibration** (`runtime.json.calibration`): the CC0 face units are softer than Apple's reference on smiles,
   cheek/eye squint and brow raise; gains 1.2–1.6 make a TEACHER-VISUAL §6 amplitude read at its intended size.
3. **Lid follow:** `eyeLookUp*` / `eyeLookDown*` += |gaze pitch| / 25° × 0.5 (lower lid follows through the same keys).
4. **Correctives:** weight = product of the parents' final weights (`runtime.json.correctives`), never authored.
5. **Wrinkles (§9):** region weights from the FINAL weights — maskA = forehead (browInnerUp, browOuterUp), glabella
   (browDown, worry knot), crow's feet L/R (cheekSquint, eyeSquint, smile); maskB = nasolabial L/R (smile, sneer),
   chin (shrugLower, press, rollLower), neck (reserved); stretch from jawOpen and brow raise.
6. **Bones:** head rotation split Neck 35% / Head 65%, applied in character space (Y up, Z forward; + pitch = chin
   down, + yaw = her left, roll sign as `head.ts`); eyes rotate `LeftEye` / `RightEye` (+ yaw = her left, + pitch = up);
   lean = `Spine2` pitch 4°; breath = `Spine2` 0.4° + shoulders ±0.9° roll.
7. **Morph mode:** keep three's relative morphs (`avatar-m0-dead-ends` #1); GLTFLoader already does.

### 4.3 Shapes, names, maps

- Face morph names: exactly Apple's ARKit 52; `viseme_sil PP FF TH DD kk CH SS nn RR aa E I O U`;
  `tongueTipUp tongueCurl tongueWide`; correctives `jawOpen_mouthClose`, `mouthFunnel_jawOpen`,
  `jawOpen_mouthSmile{Left,Right}`, `eyeBlink_eyeLookDown{Left,Right}`, `eyeBlink_eyeSquint{Left,Right}`,
  `browInnerUp_browDown{Left,Right}`, `cheekSquint_eyeBlink{Left,Right}`. `cards` carries the ARKit subset that moves
  brows and lashes.
- Map slots (self-described in each material's `extras.taxila`): TaxilaSkin `baseColor` = albedo, `normal`,
  `occlusion` = packed (R cavity, G roughness, B thickness, A AO), `emissive` = wrinkle compress, `metallicRoughness` =
  mask A, `KHR_materials_sheen.sheenColor` = mask B, `KHR_materials_clearcoat.clearcoatNormal` = wrinkle stretch.
  The data slots carry factor 0, so a generic glTF viewer shows a sane fallback.
- Emotions and states: `runtime.json.emotions` / `.states` (= `presets.js`, TEACHER-VISUAL §6 and §7.2 verbatim).
  `FaceEmotion` grows as §6 says; the renders use these presets.

### 4.4 Iteration-2 contract changes (required of `src/avatar` before these assets ship)

1. **An opaque canvas, made by hand.** Hair, brow and lash cards use alpha-to-coverage, which also writes the fragment
   alpha into the drawing buffer; an alpha canvas then composites every card edge against the page behind it. That
   was the "tan, patchy brows" and the bright card edges in profile in iteration 1 [M: brow-band pixels up to sRGB
   177 / 164 / 150 in the screenshot, from a texture whose RGB is sRGB 28 / 22 / 15; dark once the canvas is opaque]. **three r180 always asks the browser for an alpha context**
   (`WebGLRenderer.js` sets `alpha: true` in the context attributes and only emulates `alpha: false`), and
   `src/avatar/three/stage3d.ts` passes `alpha: true` anyway. Create the WebGL2 context yourself with
   `{ alpha: false, antialias, depth: true, stencil: false }` and pass `{ canvas, context }` to the renderer
   (`scripts/character/viewer/main.js` does this). If the stage ever needs transparency around the teacher, it needs a
   final alpha pass. Do not blend the cards to get it: that is the Mali Early-Z trap.
2. **The light rig is part of the asset.** `runtime.json.lighting` (key direction and colour, rim, L1 SH, Neutral
   tone mapping, exposure 1) is the rig G9 solved the albedo against. A different rig re-opens G9; a stage background
   that needs other light means re-solving `albedoGain` (`build.mjs --solve-g9`), not tweaking exposure.
3. **Calibration is gone.** `runtime.json.calibration` is `{}`; do not port the iteration-1 gains.
4. **`jawCeiling` per look** (`runtime.json.jawCeiling`, 0.55): clamp `jawOpen` after composition (rig.js does).
5. **Lip driver requirements (before H ships; review item 2a)**:
   - a closure expander in `src/avatar/lip.ts`: energy below the gate puts the jaw at 0 within one frame, and opening
     follows a power curve above 1, so the jaw falls faster than loudness;
   - the HeadAudio viseme classes driving `viseme_*` on H and `visemeFold` on B+.

   Measured: with the M0 driver given `{jawCeiling 0.55, gateFrac 0.18, curve 1.6, tauMs 25}` as its *existing*
   options, the RMS arm closes on 1-3 of 9 aligned bilabial frames, so options alone are not enough. Until this lands,
   do not run E-T1 / E-T4 on M0-driven clips.
6. **New attributes**: `_strand` (vec3, glTF axes, normalized int16) on `hair` and `cards`, used by `TaxilaHair` under
   `HAS_STRAND`. The `_region` value on teeth carries a gum weight in its fraction (1.00-1.45): round it for the region
   id, as `rig.js` does.
7. **Mouth-interior uniforms**: teeth (0.6, 0.55, 0.46), gum (0.30, 0.10, 0.09), tongue (0.40, 0.13, 0.11), bag
   (0.09, 0.022, 0.018), with occlusion from depth AND `jawOpen` (`shaders.js` SKIN_FRAG).

## 5. Validation, measured [M] (per look; `art/character/reports/<look>.json`; iteration 2, iteration 1 in brackets)

| gate | bar | teal | slate | plum |
|---|---|---|---|---|
| G1 names (H) | 82/82 | 82/82 | 82/82 | 82/82 |
| G2 bounded (≤ 26 mm; jaw, mouthClose ≤ 45; tongueOut ≤ 35), finite, non-empty | all | pass | pass | pass |
| G3 mirror, max over L/R pairs, on the topological twin | ≤ 0.5 mm | **0.16** [6.48] | **0.21** [6.40] | **0.17** [6.13] |
| G4 lid seal: cornea rays escaping at blink = 1 (also with lookDown or squint + correctives) | 0.0% | 0.0% | 0.0% | 0.0% |
| G5 lip gap, contact-vertex distance to the opposite lip SURFACE, p95 (rest / PP / jaw 0.3 + close 0.3) | ≤ 0.3 mm | **0.21 / 0.16 / 0.20** [0.71 / 0.26 / 0.59, by pairs] | **0.14 / 0.16 / 0.14** [0.65 / 0.31 / 0.57] | **0.15 / 0.24 / 0.16** [0.47 / 0.29 / 0.42] |
| G5 lip aperture: rays escaping between the lips (rest / PP / jaw + close ± corrective) | 0% | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 | **0** / 0 / 0 / 0 [3.9 at rest] |
| G5 pass (mm AND aperture) | both | **pass** | **pass** | **pass** [fail] |
| G6 tooth/tongue vertices outside the lips (300 sampled; rest → worst viseme) | no increase | 3 → 4 | 0 → 1 | 5 → 9 |
| lid vertices inside the eyeball, increase over rest (worst eyeLook) | 0 | +12 (lookDown) | +4 | +5 [+9] |
| **G9 rendered skin vs MST hex** (H, `warm`, cheek L/R + forehead + jaw R; L\* / C\*) | ±3 / ±4 | **54.8 / 27.8** vs MST 6 55.1 / 27.9 [≈ 78 / -] | **42.7 / 24.2** vs MST 7 42.5 / 23.9 [≈ 68] | **30.5 / 17.2** vs MST 8 30.7 / 17.7 [≈ 54] |
| teeth L\* p90 at jawOpen 0.3 (mouth camera, incisor landmark) | ≤ 80 | 43 | 32 | 19 |
| garment penetration: inner-layer vertices outside the outer layer (ray test) | 0 | **21** (after pushing 56) | **49** (97) | **88** (32) |
| bilabial closure in the evidence clip (aligned /p b m/ frames with the lips sealed) | ≥ 90% | 9/9 (visemes) · 1/9 (RMS) | 9/9 · 2/9 | 9/9 · 3/9 |

Reading:
- **G3** was a pack property and is now fixed at the source; the residual 0.16-0.21 mm is the scripted smile delta
  on an asymmetric identity basis.
- **G5 is now measured as the spec defines it** (a gap, in mm). Iteration 1's "0% aperture = pass" hid a 0.5-0.7 mm
  rest gap; its vertex-pair metric could not see that several upper vertices shared one lower partner.
- **G9 method** (`g9.mjs`): 600 x 750, face camera, emotion `warm`, five 9 x 9 px patches projected from the eye
  landmarks, per-patch channel median, linear average, CIE L\*a\*b\* D65; a patch more than 15 L\* from the median is
  rejected and reported. `jawL` was rejected on all three looks (the key light leaves it in shadow at this pose).
  Solve: damped per-channel ratio (exponent 0.6), 2-3 steps; gains: teal (1.05, 1.15, 1.41), slate (1.07, 1.27,
  1.61), plum (1.18, 1.61, 2.02). The raw MST hexes rendered too dark and too saturated under this rig, so the
  solved albedo is lighter and bluer than the hex. That is the point of solving against the render, not the hex.
- **Bilabial closure, honestly**: n = 9 aligned bilabial frames per clip (one sentence, 9 /p b m/ spans of about one
  frame each). The "visemes" arm counts a frame closed when `viseme_PP` ≥ 0.6, the open visemes ≤ 0.3 and jaw < 0.04,
  so it is a weight criterion. Its geometric meaning comes from G5 (PP gap p95 0.16-0.24 mm). It proves that the rig
  can close on time from an alignment, not that a live driver will.
- **Garment penetration is still not 0**; see §8.

## 6. Budgets and performance [M]

Per-tier numbers from `finish.json` (bytes, tris, draws) and `measure-2026-10-03.json` (SwiftShader). FPS is
**software GL on a 4-vCPU container, uncapped, with other work on the host**: relative only, not phone numbers.
The device lab (E-T2) is still owed.

Iteration 2 (the iteration-1 table is in `renders/before/measure-2026-10-03.json`):

| look | tier | GLB MB [it 1] | tris | draws | morph targets | canvas (Mpx, MSAA) | ms/frame p50, 3 reps [it 1] | uncapped fps (software GL) |
|---|---|---|---|---|---|---|---|---|
| teal | H | 5.93 [5.92] | 23840 | 5 | 82 | 540x900 (0.486, on) | 195.1 / 194.8 / 194.5 [195.7] | 5.1 |
| teal | Bplus | 1.92 [1.69] | 16960 | 5 | 58 | 360x610 (0.22, on) | 102.2 / 100.7 / 100.5 [100.4] | 9.9 |
| teal | Blite | 0.77 [0.75] | 16960 | 5 | 58 | 360x400 (0.144, off) | 31.1 / 30.7 / 30.9 [30.8] | 32.4 |
| slate | H | 5.93 [5.60] | 22564 | 6 | 82 | 540x900 (0.486, on) | 179.4 / 179.5 / 179.5 [180.6] | 5.6 |
| slate | Bplus | 1.85 [1.52] | 16715 | 5 | 58 | 360x610 (0.22, on) | 96.9 / 96.7 / 95.3 [94.7] | 10.3 |
| slate | Blite | 0.73 [0.70] | 16715 | 5 | 58 | 360x400 (0.144, off) | 29.1 / 28.5 / 28.3 [29.0] | 35.1 |
| plum | H | 5.53 [5.54] | 20144 | 5 | 82 | 540x900 (0.486, on) | 177.2 / 181.6 / 179.5 [174.7] | 5.6 |
| plum | Bplus | 1.75 [1.63] | 15522 | 5 | 58 | 360x610 (0.22, on) | 94.7 / 94.7 / 95.5 [92.9] | 10.6 |
| plum | Blite | 0.73 [0.71] | 15522 | 5 | 58 | 360x400 (0.144, off) | 28.8 / 28.3 / 28.5 [27.2] | 35.1 |

Host load: the full pass ran at load 2.4-4.3. teal ran first at load ≈ 4 and read 258 / 134 / 31.5 ms; re-run alone at
load 1.2 it read the row above, so that was host contention, not the asset. Frame cost is unchanged within noise. B+ grew
0.1-0.33 MB (UASTC face albedo, item 14) and stays under 2.2 MB; H stays under 6 MB (5.93 is the closest margin, paid for by
UASTC RDO 2.5 on the card textures). D plates 16-27 KB (budget 75). Renderer: `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)`.

Read: B-lite at 0.14 Mpx without MSAA renders ≈ 3× faster than B+ at 0.22 Mpx with MSAA, and H at 0.49 Mpx ≈ 2× B+ — the cost on a CPU rasteriser is dominated by pixels × MSAA, as TEACHER-VISUAL §10.2 found. M0 measured 30–34 ms at 0.128 Mpx on the same harness; B-lite here is 27–31 ms at 0.144 Mpx with `TIER_LITE` TaxilaSkin and the full eye and hair shaders, but **nothing here predicts a Mali-G52**. Morph-texture memory per tier (position only, 16 B × vertices × targets, ×2 for three's JS copy): H ≈ 9 MB → 18 MB, B+ ≈ 6.3 MB → 12.6 MB, within the 45 / 20 MB resident budgets before textures; the resident total on device is E-T7.

## 7. What was tried and did not work (proposed rejections)

1. **Nearest-vertex key transfer onto decimated teeth.** A lower incisor took an upper tooth's (zero) jaw delta, and
   one tooth stretched into a spike whenever the jaw opened (every viseme and the whole lip-sync clip). Fixed by
   mapping inside the matching loose part only.
2. **A "lip thinning" press term in `jawOpen_mouthClose`.** It re-opened 8–16% of the lip aperture at jaw 0.3 +
   close 0.3 (G5). The corrective is the seal term only, ≈ 0 once the basis and `mouthClose` are sealed.
3. **MakeHuman's own UV atlas for the bust.** The face got ≈ 400 px of a 2048 map. Re-unwrapped (one LSCM face chart
   at 2.4× density + smart-projected rest).
4. **Eye radius = the MH eye helper's mean radius.** The helper is a cage ~4% larger than the eyeball; the lids sat
   inside the ball. Radius = 0.962 × helper (sphere fit to the proxy's back half).
5. **A 0.56 r cornea with apex 1.055 r** gave a 0.34 r limbus and an iris that filled the whole opening; human
   proportions (limbus 0.48 r) fixed it.
6. **`bpy` 4.2 exits with SIGSEGV at interpreter teardown** after a successful run; every stage ends with `os._exit(0)`.

Iteration 2 (each a measured break):

7. **Vertex-pair lip seal.** Nearest-pair midpoints, one pass, left a rest gap of p95 0.47-0.71 mm (several upper
   vertices share one lower partner). Pairing both ways and iterating did not converge either: p95 0.85 mm, max 2.7 mm,
   because many-to-many pairs cannot all meet. **Instead:** point-to-surface contacts within 2.4 mm, half-way moves,
   iterated (p95 0.14-0.21 mm, 0% aperture).
8. **An alpha WebGL canvas with alpha-to-coverage cards** (three r180's default context). The partial fragment alpha
   reached the page compositor, so the brows, lashes and card edges read pale grey. Neither the texture (the KTX2
   decodes to sRGB 28) nor the GPU decode (a raw-RGBA transcode test gave the same result) was at fault. **Instead:**
   an opaque context made by hand (§4.4.1).
9. **Brow and lash cards sharing the whole cards atlas.** Both sets kept their MH UVs over the full brows | lashes
   atlas, so brows sampled lash texels and the reverse. **Instead:** pack the brows into u 0-0.5 and the lashes into
   0.5-1.
10. **Strand tangent from the derivative frame's v axis.** It flips sign across the MH cards' mirrored UVs, and the
    shifted Kajiya-Kay highlight jumped, so slate's hair lit half grey and half black. **Instead:** a baked `_strand`
    attribute. **Trap:** Blender's glTF exporter converts POSITION and NORMAL to Y-up but writes custom vector
    attributes verbatim. Measured in the viewer: dot(`_strand`, dP/dv) was about 0.05 until the export stored
    (x, z, −y).
11. **Cylindrical UVs on the diagonal pallu.** The strip was squashed into a thin region, and the dilated border colour
    bled across it in the lower mips (the pallu read mostly orange). **Instead:** the pallu's own strip UVs.
12. **Using the MST hex directly as albedo** (`texture.py`, before the loop). Under the stage rig it rendered too dark
    and too saturated (teal L\* 51.8 C\* 34.6 against 55.1 / 27.9). **Instead:** solve the gain against the render (G9).
13. **An undamped per-channel G9 update.** Chroma oscillated (plum C\* 25.8 → 11.5 → 22.5 → 14.4). A jaw patch on the
    background (L\* 68, C\* 11) drove teal's blue gain to 0.17. **Instead:** damping (exponent 0.6), outlier rejection,
    keeping the best measured gain, and jaw patches moved onto the lower cheek.
14. **`holes_fill` to cap the arm cut.** It is a no-op: the arm cut is part of the bust's single boundary loop, not a
    closed hole. **Instead:** a fan to the centroid per side, on the visible layer only.

## 8. How close to TEACHER-VISUAL (honest, iteration 2)

Read with `docs/design/teacher/renders/before-after.png` (warm face, before | after, G9 numbers),
`before-after-<look>.png` (both contact sheets side by side), `<look>/contact.png`, `turntable.mp4`, `lipsync.mp4`,
`lipsync-rms.mp4`, `emotion-check.json`.

| target (TEACHER-VISUAL) | iteration 1 | iteration 2 |
|---|---|---|
| licence-clean, in-house, one source → H / B+ / B-lite / D | met | met; downloads hash-pinned (G10) |
| skin inside its MST band (G9, H7) | **not run**; rendered ≈ 23 L\* light, about 2x chroma (a colourism problem) | **met** [M]: within 0.3 L\* and 0.5 C\* on all three |
| keys at spec: names, bounds, lid seal, lip seal ≤ 0.3 mm, mirror | names, bounds and lid met; lip seal **over-claimed** (0.5-0.7 mm); mirror **failed** 6.5 mm | **met** [M]: G1-G5 pass by the spec's own numbers |
| expressions legible and distinct, no runtime gains | gains 1.2-1.6; warm / encouraging / listening alike | gains 1.0; head and gaze signatures differ. **Not met**: the vision self-check is 37% overall [M, n = 6 per emotion] (warm 83%, thinking 100%, surprised 67%; encouraging, delighted and playful 0%, read as warm, listening and warm). Iteration 1 was 24% on the same test |
| lip-sync: bilabial closure ≥ 90% | 0 jaw closures; one shape | the **rig** closes 9/9 from the aligned visemes, and vowels open on their own shapes; the **M0 driver** still closes 1-3/9, so §4.4.5 is owed |
| mouth interior | lower teeth showing, upper hidden; flat white teeth; pink interior | upper incisors show at jaw 0.3, a thin gum band, depth- and jaw-driven darkening (teeth L\* 19-43 at jaw 0.3). Teeth read slightly olive under the occlusion [U, my read] |
| brows, lashes, hair shading | tan patchy brows, lower-lash specks, slate's split hair, bright card edges | fixed at the root (§7.8-10); plum's flyaways clipped; teal's ponytail high with crown volume |
| garments | jagged necklines, baby-blue denim, poke-through, a "sports jersey" saree | smoothed and re-projected necklines, indigo twill, a woven plaid, capped arm cuts, a draped pallu strip with an edge border and zari line, a mustard blouse, AO. **Not met**: the shells are still offset skin rather than modelled cloth. 21-88 inner vertices still poke through. Teal's kurti shows lighter polygon patches, and slate's tee shows a vertical tone split |
| identity: distinct faces, warm neutral, teacher register | one MakeHuman face recoloured; plum stern | an RBF sculpt layer gives each look its own nose, lips, brow ridge, cheek and jaw; plum's brows are higher and thinner, with a resting smile baked in. **Not met**: still MakeHuman-derived and CG-smooth, judged [U] against §4.3 only, because no Codex references exist |
| hair: strand-like, no helmet | helmet | the silhouette is better (ponytail, crown volume), but the cards are still MakeHuman's; slate's "curls" are a smooth cap with a stepped clipped fringe. **Not met** |
| "photoreal-leaning stylised hero" | not met | **not met**: closer in colour, mouth and shading correctness, not yet in form |

Every gate that iteration 1 over-claimed now fails or passes on the spec's own number.

## 9. Before / after (iteration 1 → 2, same pipeline, same day)

| review item | done | evidence |
|---|---|---|
| 1 skin L\*/chroma, G9 gate, closed loop, exposure in runtime.json | **done** | §5 G9 row, `before-after.png`, `g9.mjs`, `art/character/reports/g9-solve.json`, `runtime.json.lighting` |
| 2a driver requirements in the contract | **done** | §4.4.5 |
| 2b visemes from the TTS sentence (offline forced alignment) | **done** | `align.py`, `audio/<look>.align.json`, `lipsync.mp4` (9/9) |
| 2c `jawCeiling` per look | **done** | `runtime.json.jawCeiling` 0.55 |
| 3 gates: G5 in mm, G3 symmetrise, plum rest, inbox amended | **done** | §5, `context/inbox/teacher-character.json` |
| 4 hair tangent (slate split) + highlight clamp at alpha < 0.5 | **done** | §7.10; slate turntable |
| 5 nasolabial σ, static_k 0 below 30, forehead stretch halved | **done** | `texture.py`, `presets.js`. Forehead creases still show on brow raises (dynamic wrinkle map), §10 |
| 6 teeth / tongue position, gums, interior darkening, teeth-luma check | **done** | §4.4.7, §5 teeth row |
| 7 garments: clean necklines, pallu strip with UV trim, push-out + penetration test, indigo twill | **partly**: all applied, but not modelled meshes, and penetration is not 0 | §5 penetration row; turntables |
| 8 identity sculpt layer + plum brows, cheeks, resting smile; build fails on unused references | **done** (hand-set; fitting waits for the references) | `identity_sculpt.py`, looks `sculpt` blocks, `build.mjs` |
| 9 lips: coverage 0.4, feathered, half lip lines, −20% saturation, teal's lower lip trimmed | **done** | warm stills |
| 10 scripted smile / squint / brow deltas, gains 1.0, head-gaze signatures, vision self-check | **done; the bar is not met** | `keys.py`, `presets.js`, `emotion-check.json` (37% vs 24%) |
| 11 brows uKK 0, full colour, 1024 px, no double brow on H, lower lashes | **done** (plus the two root causes, §7.8-9) | tier stills |
| 12 ponytail, flyaways, scalp blend; hair from curves (GN) | **partly**: silhouette edits only, no curve-generated cards | turntables |
| 13 sclera 0.78 with corner tint, lid AO top quarter | **done**; the bilateral blink in the lip-sync stills was not re-checked frame by frame | eye close-ups |
| 14 roughness ≥ 0.42, MST-scaled specular, B+ UASTC albedo, round rims | **done** (the rims were octagonal because the B+ decimator collapsed them) | B+ tier stills |
| 15 mouth camera on the lip landmark | **done** | viseme rows |
| 16 sha256 pins, exact versions | **done** | `build.mjs` |

## 10. Next iteration (in order of payoff) [U]

1. **Emotion legibility (bar ≥ 70% per emotion).** delighted needs the open-mouth Duchenne (jawOpen 0.15-0.2 with
   mouthUpperUp, a bigger cheek raise) to separate from warm; playful needs the one-sided brow at 0.45 and the eye-led
   glance; encouraging needs the nod as motion and a brow lift. Re-run `emotion-check.mjs` per change. Gate it in
   build at 70% before any child panel.
2. **The live lip driver** (§4.4.5): the expander plus HeadAudio classes in `src/avatar`. Run the lip bench, then E-T5.
3. **Garments as modelled meshes**: a collar curve, a closed shell with real thickness, a skinned jacket lapel and
   pallu edge, and a penetration gate of 0 that fails the build; a garment normal map for twill and weave; fix teal's
   kurti patches (UV dilation per layer) and slate's tee seam.
4. **Hair from Blender curves (Geometry Nodes)**: clumped strand cards with a flow map, ≤ 12k H / ≤ 3.5k B+, and
   curls with real clumps for slate.
5. **Identity from references**: when the Codex turnarounds land, annotate about 40 landmarks per look and fit the
   `sculpt` block (MediaPipe allowed at build time). Add a side-by-side to the contact sheet. Then a skin-detail pass:
   softer SSS-like falloff, pore scale by region, and forehead creases only above 30 years or 0.4 brow raise.
6. **Tiers**: the H face-mask subdivision (§3 deviation), and the on-device E-T2 / E-T7.
7. **Teeth tone**: reduce the green cast of the occluded enamel (warmer occlusion tint), and check the bilateral blink
   frame by frame (review item 13).

Reversal per `character-built-in-house`: if the owner's eye test fails after this second iteration, revisit an artist
for the hero tier only (identity sculpt, hair, garments), keeping this pipeline for rig, keys, gates, tiers and
export.
