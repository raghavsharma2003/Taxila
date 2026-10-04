# TECH-PLAN: building the style C teacher in-house

**Date:** 2026-10-04. **Owner directive (binding, 2026-10-04):** the teacher is concept style C
(`../concepts/c-front.webp` and its edits), built in-house: no artist, no purchased character, no paid asset. GPU use
is allowed: AWS through `scripts/gpu/*`, with a USD 150 cap for this workflow and no instance left running. If 3D
fails the owner's bar after the polish loop, the fallback is a 2D puppet of the same character. Do not start the 2D
puppet yet, but say plainly if 3D is failing.

**Supersedes for this workstream:** `teacher-stylised-face-commissioned` (RESEARCH.md §3, which recommended
commissioning the face). The owner has overruled that recommendation. The main loop must log a `supersedes` edge.
RESEARCH.md's verdict that "the agent ceiling for a face is 2-3.5/5" still stands as **the risk this plan is designed
against**. It is not a reason to skip the plan (see §0.2).

Evidence tags as in RESEARCH.md: [V] primary source read today · [S] secondary · [M] measured in this repo · [U] my
inference.

---

## 0. One screen

1. **Refs are done (step 2):** 19 edits of `c-front.webp` in `refs/`, plus the contact sheet `refs/SHEET.webp`.
   The edits cover front, neutral, ortho front, 3/4 both sides, profile both sides, back, top, turnaround, an eye
   close-up, a hair close-up, and nine mouth shapes (A O E U MBP FV SS TH, plus the concept's smile). By eye, the
   identity holds on every image. Known defects are listed in §2.2. The front is the authority; the side views are
   soft constraints.
2. **Why in-house can work this time when it failed before:** every failed agent face was a *realistic* topology
   (MakeHuman, GNM, a photo wrap) pushed toward cartoon. That gave "a doll": realistic nose and lips beside doll eyes
   (`teacher-stylised-on-makehuman-rejected`). Style C is built from a few low-frequency primitives: a near-sphere
   cranium, a soft cheek mass, two big eyeball spheres, a button nose, lips as two soft rolls, and hair as about 8
   sculpted shells. A parametric model with about 60 parameters, fitted to silhouettes and landmarks, can reach that
   form. A realistic face has a long tail of fine detail that it cannot reach.
3. **Two arms, one back end.** Both arms end on **our own clean quad template**, which has hand-planned edge loops.
   Every shipped vertex comes from that template. That is how this plan stays consistent with decisions.md
   `avatar-cast-shared-mpfb-s2` ("image-to-3D excluded from shipped assets").
   - **Arm A (parametric):** a Blender script builds the template from a low cage with known loops, and CMA-ES fits
     about 60 shape parameters to annotated silhouettes and landmarks from the refs.
   - **Arm B (image-to-3D as a sculpt target):** several open models generate high-resolution sculpts from the refs
     on AWS. The best seed by silhouette IoU becomes the target, and Arm A's template is wrapped onto it with landmark
     correspondence plus non-rigid ICP.
   - **Pick by the rubric in §8.** Shape authoring, eyes, hair, shading, tiers and gates are shared code.
4. **Shapes are rig-then-bake, not sculpted one by one.** A temporary Blender rig is built on the template's known
   loops: a jaw bone, spherical lid rotators about the eyeball centre, a lip-corner arc, mouth-ring radial scalers,
   cheek bulge falloffs, and a separate brow mesh with segment bones. A parameter table poses it for each of the 82
   contract keys (ARKit 52 + 15 visemes + 3 tongue + 12 correctives), and each pose is baked to a morph. The lids then
   wrap the eyeball by construction, which fixes G4 at the source.
5. **Shading is cheap toon-soft, not PBR skin.** Wrap diffuse, a warm terminator band (fake SSS), a soft rim, broad
   low spec, vertex-colour AO and blush, an opaque eyeball with iris parallax and a small cornea shell with a sharp
   catchlight, and Kajiya-Kay hair on a flow attribute. There are no normal or wrinkle maps. The texture set is one
   512² atlas (iris + bindi + piping), so tier H fits ≤ 25k tris and about 1.5 MB.
6. **The gate is the eye, helped by a calibrated judge.** The judge is pairwise and atomic: a binary checklist from
   two judge families against `c-front.webp`, at 128 px and 1024 px. It must first pass a sanity battery: reject the
   faces the owner already rejected and accept ref-vs-ref pairs. The judge is advisory (`rj-holistic-model-judge-gate`).
   The owner's side-by-side is the gate.
7. **Budget:** Arm B is about USD 6-15 of GPU (Hunyuan3D-2.1 measured at USD 0.53 a run [M]). Arm A fits on CPU
   (local, or c6i spot at about USD 0.03 per 10 min [M]). Planned total ≤ USD 40 of the USD 150 cap.
8. **2D trigger (§10):** fall back if, after 3 polish iterations, the owner says "not the same character / not
   Memoji-quality", or the judge's same-character rate is below 70% at thumbnail.

---

## 1. Research: how Memoji-class stylised heads are built

### 1.1 Construction (what makes Memoji/Bitmoji/Animal Crossing/Pixar-stylised read as premium)

| element | how the pros build it | what we copy |
|---|---|---|
| **Topology** | Low-frequency quad mesh, all-quad, subdivision-ready. Concentric loops around each eye (3-4 rings) and around the mouth (4-6 rings). A nasolabial loop flows from the nose wing around the mouth into the jaw. Poles sit away from deforming areas. Memoji-class heads are about 10-20k tris in total [U, RESEARCH.md §1.3] | the template in §3.1, with loops fixed by construction, so every shape knows its rings by index |
| **Eyes** | Separate eyeball spheres. Iris and pupil sit on a slightly concave disc or as a texture under a **cornea dome** (a separate shell, glossy, refractive or faked). Big iris (Memoji-class iris ≈ 55-65% of the visible eye height [U]). One strong specular catchlight, sometimes painted in view space so it never disappears | eyeball + iris disc texture + cornea shell with a GGX lobe **and** a view-space catchlight (§6.2). Limbus at 0.48 r (`teacher-character-dead-ends` #5) |
| **Eyelids** | Lids are skin that **wraps the eyeball**: a blink rotates the lid edge loops about the eyeball centre (a "spherical lid" rig), so the lid slides over the sphere and never cuts into it. A thick dark lid rim (the lash line, with a small flick in style C) is geometry, not cards | lid loops rotated about the fitted eyeball centre, then baked (§5.2). Lash line = a thin solid rim strip, no alpha (removes the Mali Early-Z and alpha-canvas traps, `teacher-character-dead-ends-it2` #2) |
| **Brows** | Their own shapes: a separate floating mesh or a projected texture, with large travel and bend (inner up, outer up, knit). Thick, soft-edged, rounded tips | separate brow meshes (≈ 150 quads each), conformed 0.4 mm above the forehead, with 3 segment bones (inner, mid, outer) driven by browInnerUp, browDown_L/R and browOuterUp_L/R |
| **Nose** | A tiny button: a ball plus two soft nostril dimples, nearly no bridge in front view | 2 parameters (tip size, bridge height) and no nostril holes |
| **Lips** | Soft volume: two rolls with a defined but soft vermilion edge (vertex colour, not texture), a corner pinch loop, and a mouth bag behind | 6 mouth rings, with lip colour from vertex colour on rings 1-3 |
| **Hair** | **Solid sculpted shells**: large clumps with soft broad grooves, a centre parting, a bun as a torus-ish knot, and loose locks as thin swept tubes. Soft shading with a broad sheen. No cards | §6.4: 6-10 shells generated from guide curves (Blender curve + taper/bevel → mesh → smooth), each with a `_strand` flow attribute (stored x, z, -y, per `teacher-character-dead-ends-it2` #4) |
| **Skin shading** | Matte-soft. Subsurface faked with wrap lighting and a warm terminator. Gentle rim light. No pores, no wrinkles. Large readable shapes only | §6.1 |
| **Rig** | ARKit-52-style blendshapes plus eye/head joints. Big, clean, readable shapes; the face is designed so every key reads at about 120 px [RESEARCH §1.3]. Animation adds squash on blinks and overshoot | the contract keys (§5) plus the cartoon behaviour profile (`teacher-stylised-behaviour-profile`, RESEARCH §4), at runtime only |

### 1.2 Open image-to-3D models (2026), as sculpt targets only

| model | licence (weights / code) | input | GPU | verdict |
|---|---|---|---|---|
| **Hunyuan3D-2.1** (3.3B shape) | Tencent Hunyuan 3D 2.1 Community Licence: worldwide **minus EU/UK/KR**; separate licence above 1M MAU; Tencent claims no rights in outputs; outputs may not train other models [M: re-read, decisions `face3d-models`] | 1 image | L4 24 GB: about 200 s per seed at octree 512 [M `face3d-teal-run-2026-10-03`] | **Run first.** The harness, locks and weights are already pinned in `scripts/gpu/jobs/face3d/`. Shape only: skip the paint stage |
| **Hunyuan3D-2mv** (multi-view shape) | `tencent-hunyuan-community` [V HF card]; territory clause as above [U: same family] | front + left + back [V] | similar to 2.0 [U] | **Run second:** our refs supply exactly front/profile/back. Re-read the licence file before running and record its hash |
| **Step1X-3D** (1.3B geometry) | **Apache-2.0** code and weights [V GitHub] | 1 image | geometry + texture 27-29 GB [V]; geometry alone fits L40S 48 GB (`g6e.xlarge`, 4 vCPU) [U] | **Run third.** It is the cleanest licence. Uses PyTorch3D (BSD) and Kaolin (Apache-2.0). Geometry only. Gate: the run must succeed with `nvdiffrast` absent |
| **TRELLIS.2-4B** | MIT code and weights [V]. **But** `to_glb` and texturing import nvdiffrast (NVIDIA non-commercial) and the image encoder is gated DINOv3 [M `face3d-nc-deps-rejected`]. CuMesh and FlexGEMM licences are unverified [U] | 1 image | ≥ 24 GB [V] | **Conditional.** Use only if (a) the raw `mesh.vertices/faces` path runs with `nvdiffrast` poisoned in `sys.modules`, (b) the CuMesh and FlexGEMM licences are commercial-OK, and (c) DINOv3's licence permits this use. Otherwise skip |
| Hunyuan3D 2.5 / 3.0 / 3.1 | hosted API only, no weights [S] | — | — | excluded (third-party service) |
| InstantMesh (Apache-2.0), Stable Fast 3D (Stability Community) | — | — | — | older and lower quality; not worth a run [U] |

**How the AI mesh is used:** only as a *shape target* for the wrap (§4). It is never shipped and never used to train
a model, which keeps Hunyuan's "no improving other models" clause and decisions `avatar-cast-shared-mpfb-s2` intact.
The hair volume from the AI mesh guides the hair shell curves; the shells themselves are ours.

### 1.3 Retopology and shape transfer options

| option | licence | role here |
|---|---|---|
| **Our own template + wrap** (landmarks → similarity → non-rigid ICP with Laplacian regulariser, as in `bakeoff/ai-portrait-wrap/wrap.py`) | ours | **Primary.** It keeps our loops and the vertex order, so the shape rig and gates index the same vertices in both arms |
| QuadriFlow (in Blender, `bpy.ops.object.quadriflow_remesh`) | Blender GPL tool; output ours | Fallback for **hair shells** and the bun only (no deformation, so the loops do not matter) |
| Instant Meshes | BSD-3 | as QuadriFlow, CLI on CPU. Only if QuadriFlow's flow is poor on the bun |
| Blender Shrinkwrap (project, with offset) + Corrective Smooth | GPL tool | the final wrap pass: project the template on the target with a 0 mm offset, then a Laplacian relax on non-landmark vertices |
| Deformation transfer (Sumner and Popović 2004) of existing ARKit keys onto the new head | technique | **Not primary.** Naive delta transfer leaves the cornea visible at blink when proportions change (`avatar-asset-dead-ends` #2), and realistic source keys produce realistic-looking motion. Shapes are authored by rig-then-bake (§5) |
| Quad Remesher, Wrap3/R3DS, Polywink | paid | excluded (directive) |

---

## 2. Reference sheet (step 2, done)

### 2.1 What was made

- **Generator:** `scripts/character/stylised/gen-refs.mjs` (Foundry `taxila-image` = gpt-image-2, `/images/edits`,
  `input_fidelity: high`, 1024², quality high). Every image is an **edit of `c-front.webp`**, so the identity comes
  from pixels, not text. Three workers stay under the deployment's 429 limit.
- **Output:** `docs/design/teacher/stylised/build/refs/*.webp` (19 images + `SHEET.webp`). Prompts, dates and token
  usage are in `refs/refs.json`. 19 API calls, 133,456 output image tokens, 0 failures.

| file | use in the build | sha256 (first 12) |
|---|---|---|
| neutral | **neutral basis**: closed relaxed mouth (the concept smiles, and the basis must not) | d5a050423453 |
| front-ortho | Arm A front silhouette + landmarks; Arm B front input | 2f98c15770a6 |
| q3-left, q3-right | held-out views for fit validation (never fitted) | 3e33c1a3a5da, 0408bd4e1d5c |
| profile-left, profile-right | profile silhouette (soft constraint); Arm B "left" input | eb3222f3e122, ebc7569a2ce4 |
| back | hair-mass silhouette; bun position; Arm B "back" input | f9a5cbf7c6b3 |
| top | parting and hair-flow direction | 563b605ad63e |
| turnaround | relative proportions across views at one scale | a2f141301ccd |
| eye-closeup | iris/pupil/sclera ratios, lid rim and flick, catchlight placement, brow shape | e5c4f1c93a54 |
| hair-closeup | groove count and width, shell layering, sheen | 6d5132527336 |
| mouth-A, -O, -E, -U, -MBP, -FV, -SS, -TH | viseme targets `aa`, `O`, `E`/`I`, `U`, `PP`, `FF`, `SS`, `DD`/`nn` (§5.3) | f5dbc81621bb, 1662015d587a, 1fc41d11d7a4, 681596236fb7, 1af8116e6d50, 7a66ed2ea9de, 97d69f77eabc, d2d812fb2a0a |
| ../concepts/c-front, c-talking, c-listening, c-thinking, c-happy | identity authority; expression targets for smile, talking, listening, thinking, happy | (existing) |

### 2.2 Known defects (by eye, one look, not a measurement)

1. **Bun position disagrees across views.** The front has it low at her left; the back has it centre-low with a
   slight left offset; profile-left shows it, which implies centre-back. **Decision:** low at the nape, centred, 15%
   offset to her left. The front read wins.
2. **Cranium depth varies.** profile-left reads longer than profile-right, and the 3/4 views read slightly smaller
   in head-to-shoulder ratio than the front. **Decision:** front and front-ortho are the authority; profile depth is
   fitted with a low weight and finally set by eye on turntables.
3. **mouth-FV is weak** (lower-lip tuck barely visible) and **mouth-TH shows no tongue**. These keys are authored
   from phonetics, not refs.
4. **top** came out as a head-down pitch, not a top camera. It is still usable for parting and flow.
5. Only one loose lock is visible in q3-right. **Decision:** two locks (front authority), each ≤ 300 tris.

Regenerating any single view: `NODE_USE_ENV_PROXY=1 node scripts/character/stylised/gen-refs.mjs --only <name> --force`.
There is headroom of 11 more images under the 30 cap.

### 2.3 Target proportions from c-front (1024² pixel coordinates, by eye [U]; step A1 replaces them with annotated landmarks)

| measure | px | ratio to face width (425) |
|---|---|---|
| face width at cheeks | 425 | 1.00 |
| head width incl. hair | 615 | 1.45 |
| interocular (iris centres) | 205 | 0.48 |
| eye opening width | 115 | 0.27 |
| iris diameter | 70 | 0.165 (≈ 61% of visible eye height) |
| brow centre → eye centre | 97 | 0.23 |
| eye centre → nose tip | 92 | 0.22 |
| nose tip → mouth line | 50 | 0.12 |
| mouth line → chin | 105 | 0.25 |
| crown (hair top) → chin | 655 | 1.54 |

---

## 3. Arm A: procedural parametric head fitted to the refs

**Where:** `scripts/character/stylised/a/` (Blender `bpy` 4.2 wheel from the existing `$CHAR_HOME/bpyenv`, set up by
`scripts/character/build.mjs --setup-only`). Every stage ends with `os._exit(0)` (`teacher-character-dead-ends` #7).

### 3.1 Template (`a/cage.py`)

1. **Cage, authored as data:** `art/character/stylised/cage.json` holds about 420 quads for a half head, mirrored.
   - **Fixed loops:** 4 eye rings, 6 mouth rings, 1 nasolabial loop, a jaw loop, a neck ring, an ear stub, and a
     cranium grid.
   - **Fixed indices:** each loop is a named vertex list (`loops.eye_L[0..3]`, `loops.mouth[0..5]`, ...). The shape
     rig and gates use these names, never nearest-vertex searches.
2. **Subdivide:** Catmull-Clark level 2 → about 3.4k quads (6.8k tris) for H, and level 1 → about 1.7k tris for B+
   (§7). The loop names propagate through subdivision.
3. **Parts as separate meshes:**
   - eyeballs (UV sphere 32×24) + cornea shells (a dome cap, 0.48 r limbus);
   - brows (strips, about 150 quads each);
   - lash rim (a thin strip on the lid edge, about 300 tris each);
   - mouth bag, teeth (two simple rounded arches, 400 tris each) and tongue (600 tris);
   - earrings (an ico sphere, 80 tris each), and a bindi (a tiny disc decal, 32 tris, 0.2 mm proud);
   - bust and kurta (§6.5).

### 3.2 Parameters (about 60, `a/params.py`)

| group | parameters |
|---|---|
| cranium | radii x/y/z, crown height, occiput bulge, forehead slope |
| face mass | cheek width, cheek fullness, cheek height, jaw width, chin length, chin roundness, face length |
| eyes | centre x/y/z, eyeball radius, opening height, opening width, upper-lid arc, lower-lid arc, outer-corner tilt, lid-rim thickness, flick length |
| brows | inner/outer x/y, arch height, thickness inner/mid/outer, tip roundness |
| nose | tip radius, tip y/z, bridge height, nostril width |
| mouth | width, y, upper/lower lip volume, vermilion height, corner depth, philtrum depth, rest smile (0 for neutral) |
| ears | size, y, rotation, protrusion |
| neck and shoulders | neck radius, neck length, shoulder width, shoulder slope |
| global | head-to-shoulder scale, asymmetry seed (≤ 0.5%, for life) |

Each parameter drives a deformation of the cage: a radial basis displacement centred on named loops, with a
geodesic falloff. Parameters are bounded so the cage cannot fold. A Jacobian sign check runs on every cage face,
and the optimiser rejects any fold.

### 3.3 Fit (`a/fit.py`)

1. **Annotate the refs once** (`art/character/stylised/landmarks.json`):
   - about 40 2D landmarks on neutral/front-ortho: eye corners, iris centres, lid apexes, brow ends, nose tip and
     wings, mouth corners, lip midpoints, chin, cheek extremes, ear tops, hairline;
   - about 15 landmarks on each profile;
   - silhouette masks: `rembg` U-2-Net (MIT/Apache, already in `face3d`) plus a hair/skin split by a colour threshold.
   - MediaPipe Face Landmarker is tried first. If it misplaces cartoon eyes by more than 3 px it is not used, and
     the landmarks are clicked by the agent from pixel coordinates (it can read images) and checked with an overlay
     PNG.
2. **Render:** Blender EEVEE-less (Workbench) orthographic silhouettes and landmark projections. Or faster: our own
   numpy z-buffer of the subdivided mesh at 256², about 20 ms.
3. **Objective (front weight 1.0, profile 0.35, back 0.2):**
   - silhouette IoU (skin and hair separately);
   - landmark reprojection error, normalised by interocular distance;
   - a symmetry prior and a smoothness prior.
4. **Optimiser:** CMA-ES (`cma`, BSD) with popsize 24 and about 600 generations. That is about 15k evaluations,
   ≈ 6 min at 20 ms on 4 cores. The fit runs locally, or on `c6i.2xlarge` spot when the container is busy.
5. **Held-out check:** q3-left and q3-right are never fitted. Report their IoU and landmark error at a fixed fitted
   yaw.
   - **Bar:** front skin IoU ≥ 0.95, hair IoU ≥ 0.92, landmark NME ≤ 2.5% IOD, held-out 3/4 IoU ≥ 0.88.
   - These are proxies. The appeal bar is §8.

### 3.4 Why Arm A might fail, honestly

The silhouette and landmarks pin the *outline and feature placement*. They do not pin the **planes in between**: the
cheek-to-eye-socket transition, the softness of the lip rolls, and how the brow mass meets the forehead. Those are
where "cute" lives. Mitigation: shape priors taken from the c-front shading, plus the polish loop (§9), where the judge
names a region and the agent adjusts that region's parameters. If the polish loop stalls on the same region twice,
Arm B's sculpt informs that region (§4.4).

---

## 4. Arm B: image-to-3D sculpt target, then our topology

**Where:** GPU job `scripts/gpu/jobs/stylised3d/` (a copy of `face3d`'s pinned toolchain: hashed locks, sha256
weights, commit pins), plus CPU wrap in `scripts/character/stylised/b/`.

### 4.1 Generate (AWS)

| run | model | inputs | seeds | instance | estimate |
|---|---|---|---|---|---|
| B1 | Hunyuan3D-2.1 shape, octree 512, 50 steps, guidance 5 | front-ortho; neutral (bust matte, not a head crop: `head-crop-matte-for-hunyuan-shape`) | 4 each | g6.2xlarge (L4, 8 vCPU) | ≈ 35 min, ≈ USD 0.60 on-demand [from M] |
| B2 | Hunyuan3D-2mv | front-ortho + profile-left + back (bg removed, centred, same scale) | 4 | g6.2xlarge | ≈ 30 min, ≈ USD 0.50 [U] |
| B3 | Step1X-3D geometry | front-ortho; neutral | 4 each | g6e.xlarge (L40S 48 GB, 4 vCPU) | ≈ 45 min, ≈ USD 1.50 [U] |
| B4 | TRELLIS.2 (only if the §1.2 conditions hold) | front-ortho | 4 | g6e.xlarge | ≈ 30 min, ≈ USD 1 [U] |

- **Setup cost:** each job is about 6 min of toolchain plus weights; the S3 weight cache is reused.
- **Caps:** `--max-minutes 90`, spot first.
- **Always:** `python3 scripts/gpu/status.py` after each run, then `reaper.py`.
- **Total Arm B:** ≤ USD 8 planned, USD 20 hard. The ledger in `status.py` is the record.

### 4.2 Score and pick (on the instance, then CPU)

- Render each candidate's silhouettes at the ref cameras (similarity-aligned on the front).
- Score skin and hair IoU per view, profile included. Here the multi-view model should win.
- Keep the top 2. The agent also looks at a turntable contact sheet of each: a high IoU with a lumpy surface is
  rejected by eye.

### 4.3 Wrap our template onto it (`b/wrap.py`)

1. Landmarks on the sculpt: project the 2D front landmarks onto the sculpt by ray-cast (the face3d `lift.py`
   approach), and the profile landmarks the same way.
2. Run Arm A's fit first, as initialisation, so the template starts close.
3. Non-rigid ICP: point-to-plane, with Laplacian and edge-length regularisers.
   - **Excluded from ICP:** eye sockets (the eyeballs are ours, placed by the fitted centre), the mouth interior
     (the AI mesh fuses lips) and the ears (low quality in these models [U]).
   - **Projection:** Shrinkwrap with a 0 mm offset, then Corrective Smooth (8 iterations) on non-landmark vertices.
4. Mirror-symmetrise on the topological twin (the G3 lesson). A 0.3% seeded asymmetry is re-added only at the end.
5. **Hair:** do not wrap. Slice the sculpt's hair region (classified by the scalp boundary plus a colour-free
   geometric test) into a target volume, then fit the guide curves of the hair shells (§6.4) to that volume.

### 4.4 Cross-pollination

If Arm A's planes are weak in a region and Arm B is good there, blend the B-wrapped positions into A per region with
a mask: cheeks, brow ridge, lip rolls. Both arms share vertex order, so this is a per-vertex lerp.

---

## 5. Shapes: list, authoring method, contract mapping

The contract is **CHARACTER-PIPELINE §4.3, unchanged**:
- **H:** 82 morphs = ARKit 52 + 15 visemes + `tongueTipUp`/`tongueCurl`/`tongueWide` + 12 correctives.
- **B+ / B-lite:** 58 = ARKit 52 + `tongueTipUp` + 5 corrective keys, with visemes folded through
  `runtime.json.visemeFold`.
- **Rules kept:** relative morphs, and the `HeadRig` interface. Bones are `Neck`, `Head`, `LeftEye`, `RightEye`,
  `Spine2`, plus 2-4 spring bones for the bun, locks and earrings (RESEARCH §4.5).

### 5.1 Method: rig-then-bake (`keys/rig_bake.py`)

1. Build a **temporary authoring rig** on the template from its named loops:
   - a jaw bone (pivot fitted at the ear-stub line);
   - lid rotators about each eyeball centre: upper and lower, separate axes for blink and lookUp/lookDown follow;
   - a lip-corner arc (corners move on a sphere about the jaw pivot);
   - mouth-ring radial scale and forward push;
   - cheek and nasolabial bulge falloffs;
   - nose-wing lift;
   - brow segment bones on the separate brow mesh;
   - tongue bones (3 segments).
2. **Weights:** geodesic distance from the named loops, with a smoothstep falloff. No auto weights.
3. **Pose table:** `art/character/stylised/keys.json` gives each key as a list of rig channel values. It is data,
   so the polish loop edits numbers, not code.
4. **Bake** each pose to a morph delta on the subdivided mesh at weight 1. Then run the per-key clean-ups:
   - lip seal by point-to-surface contacts (`teacher-character-dead-ends-it2` #1);
   - lid-over-eyeball push-out (no lid vertex inside the eyeball sphere + 0.3 mm);
   - teeth and tongue inside the lips.
5. **Correctives:** the product rule (CHARACTER-PIPELINE §4.2 rule 4). Each corrective's delta is
   `bake(pose_a + pose_b) − bake(pose_a) − bake(pose_b)`, computed from the rig, so it is exact by construction.
6. **Cartoon amplitude:** the poses are authored at Memoji amplitude (big brow travel, wide smiles, deep pucker).
   The runtime behaviour profile adds timing (anticipation, overshoot, blink squash), not shape.

### 5.2 The 52 ARKit keys by group

| group | keys | authoring on the stylised head |
|---|---|---|
| eyelids | eyeBlink L/R, eyeSquint L/R, eyeWide L/R | **spherical lid rotation** about the eyeball centre (upper lid 0 → closed meets the lower lid at 35% height, the Memoji convention). Squint lifts the lower lid and pushes the cheek up. Wide rotates the upper lid up 8°. The lash rim and flick follow as a rigid child of the lid edge loop |
| gaze | eyeLook{Up,Down,In,Out} L/R | the eyeballs rotate on bones; the morphs carry **lid follow only** (upper lid tracks the iris top; lower lid follows 50%), per the CHARACTER-PIPELINE §4.2 rule 3 |
| brows | browDown L/R, browInnerUp, browOuterUp L/R | brow mesh segment bones (inner/mid/outer), plus a forehead skin follow of 30%. browInnerUp gives the "worry" bend that reads at thumbnail. Travel up to 18% of IOD [U, Memoji-class] |
| jaw | jawOpen, jawForward, jawLeft, jawRight | jaw bone rotation about the fitted pivot, cheek falloff, and lower teeth and tongue rigid with the jaw. `jawCeiling` 0.55 at runtime |
| mouth | mouthClose, mouthFunnel, mouthPucker, mouthLeft/Right, mouthSmile L/R, mouthFrown L/R, mouthDimple L/R, mouthStretch L/R, mouthRollLower/Upper, mouthShrugLower/Upper, mouthPress L/R, mouthLowerDown L/R, mouthUpperUp L/R | corner arc + ring scale/push + roll rotators on lip rings 1-2. **Smile:** corners up and back along the arc, the cheek mass bulges up and pushes the lower lid (reads as "eyes smile", the c-happy target). **Pucker/funnel:** radial shrink + forward push, with the funnel lips everted. **Press/roll:** lip-ring rotation about the lip-line axis |
| cheeks and nose | cheekPuff, cheekSquint L/R, noseSneer L/R | cheek falloffs; noseSneer lifts the nose wings and a short upper-lip segment |
| tongue | tongueOut | tongue bones (3 segments) push out past the teeth; capped so it never crosses the lower lip by more than 6 mm |

### 5.3 Visemes (H only) and Hindi tongue keys

| contract viseme | ref target | rig recipe (channels) |
|---|---|---|
| `viseme_sil` | neutral | zero |
| `viseme_PP` | mouth-MBP | mouthClose + mouthPress 0.4 + rollLower 0.15 |
| `viseme_FF` | mouth-FV (weak ref) | lower lip rolled up under the upper teeth: rollLower 0.6, jaw 0.08, upperUp 0.2 |
| `viseme_TH` | phonetic | jaw 0.15, tongue tip forward between the teeth |
| `viseme_DD` | mouth-TH (weak ref) | jaw 0.15, `tongueTipUp` 1 |
| `viseme_kk` | phonetic | jaw 0.2, tongue back up |
| `viseme_CH` | phonetic | funnel 0.5, teeth near, jaw 0.12 |
| `viseme_SS` | mouth-SS | teeth together, stretch 0.4, lips parted 2 mm |
| `viseme_nn` | phonetic | jaw 0.1, `tongueTipUp` 0.8 |
| `viseme_RR` | phonetic | funnel 0.3, `tongueCurl` 0.6 |
| `viseme_aa` | mouth-A | jaw 0.45, lowerDown 0.3, upperUp 0.15 |
| `viseme_E` | mouth-E | stretch 0.5, smile 0.2, jaw 0.15 |
| `viseme_I` | mouth-E (closer) | stretch 0.35, jaw 0.1 |
| `viseme_O` | mouth-O | funnel 0.6, pucker 0.3, jaw 0.25 |
| `viseme_U` | mouth-U | pucker 0.9, jaw 0.08 |
| `tongueTipUp` / `tongueCurl` / `tongueWide` | — | tongue bones: tip raised to the alveolar ridge (Hindi dental/alveolar) / tip curled back (retroflex ट ड ण) / blade flattened and widened |

The viseme fold for B+ is re-derived from these recipes, since they *are* ARKit channel mixes. That is an exact fold,
with `DD`/`nn` raising `tongueTipUp`.

### 5.4 Correctives (12, the contract names)

`jawOpen_mouthClose`, `mouthFunnel_jawOpen`, `jawOpen_mouthSmile{L,R}`, `eyeBlink_eyeLookDown{L,R}`,
`eyeBlink_eyeSquint{L,R}`, `browInnerUp_browDown{L,R}`, `cheekSquint_eyeBlink{L,R}`. Each comes from the rig
(§5.1 step 5). The `jawOpen_mouthClose` corrective is the seal term only (`teacher-character-dead-ends` #2). B+
keeps 5 keys (3 logical), as now.

### 5.5 Gates reused (all must pass before any judge run)

- G1 names: 82/82 on H, 58/58 on B+.
- G2 bounded.
- G3 mirror ≤ 0.5 mm.
- **G4 lid seal 0.0%** at blink, also with lookDown and squint plus correctives.
- G5 lip gap p95 ≤ 0.3 mm and 0 aperture rays at rest, PP, and jaw 0.3 + close 0.3.
- G6 teeth and tongue inside the lips.
- Lid vertices inside the eyeball: 0 increase.
- Plus the new **G-partial**: G4 and G5 at weights 0.25/0.5/0.75 and on pairwise combos
  (`avatar-asset-dead-ends` #2 note).

These run through `scripts/character/measure.mjs` once it accepts a look path.

---

## 6. Shading recipe (three.js r180, one shader family, `TaxilaToon`)

Constraints:
- Mali-G52 class: about 30 fps at B-lite's 0.144 Mpx without MSAA.
- No alpha blending on large surfaces (Early-Z), and an opaque canvas (CHARACTER-PIPELINE §4.4.1).
- The light rig ships in `runtime.json.lighting` (§4.4.2). It is re-solved for style C: soft key from above-left, a
  cool-neutral fill from SH L1, a warm rim from behind-right.

### 6.1 Skin (MeshStandardMaterial + `onBeforeCompile`, or a ShaderMaterial in `shaders.js`)

- **Diffuse:** wrap lighting, `(N·L + w)/(1 + w)` with w = 0.45, then a smoothstep remap for a soft two-tone feel.
  Under the near-frontal key the two-tone ramp was invisible on the MakeHuman face (`teacher-stylised-on-makehuman-rejected`),
  so the wrap here is tuned so the cheek and nose turn reads in front view.
- **Terminator warmth (fake SSS):** add `sssColor (0.85, 0.32, 0.22) × band(N·L ≈ 0..0.3) × 0.35`.
- **Rim:** `rimColor × pow(1 − N·V, 3) × smoothstep(-0.2, 0.4, N·L_rim) × 0.25`, so the rim appears on the lit side
  of the silhouette.
- **Spec:** one broad GGX lobe, roughness 0.55, F0 0.028, intensity 0.3. There is no clearcoat and no sheen
  (MeshPhysical costs too much on B tiers).
- **Vertex colours:**
  - RGB albedo variation: blush on the cheeks, lip colour on rings 1-3, slightly darker lid creases, a nose-tip warm
    accent;
  - A channel = baked AO (Blender Cycles AO bake at build time, per vertex).
- **Albedo:** solved against the render (the G9 method: damped per-channel gain, `teacher-character-dead-ends-it2`
  #6), targeting the c-front cheek colour sampled at five patches, not a hex.
- No normal map on any tier. Optional H only: a 256² tangent-space "softness" map for the lip vermilion edge.

### 6.2 Eyes

- **Eyeball:** an opaque sphere.
  - Sclera: warm off-white (0.93, 0.90, 0.86) with a soft grey AO band near the lids. The band is a vertex-colour
    gradient on the lid rim plus an "eye occlusion" darkening driven by lid proximity.
  - Iris: a 256² texture (radial warm brown, a darker limbus ring, and subtle radial fibres drawn procedurally by our
    script) with parallax offset by view (depth 0.25 r). Pupil scale 0.42 r.
- **Cornea:** a separate dome cap, the only blended surface (small: about 0.5% of pixels).
  - A GGX lobe with roughness 0.05;
  - a **view-space catchlight**: a crisp soft-edged disc at fixed eye-space upper-left, like c-front's white dot,
    so the eye is never dead;
  - Fresnel edge brightening.
- **Lash rim:** an opaque near-black solid strip with a flick, plus a dark lower-lid line at 40% opacity done as
  vertex colour on the skin, not alpha.

### 6.3 Brows

Opaque mesh, colour (0.10, 0.07, 0.06), soft edge by geometry roundness (bevelled strip). Wrap diffuse; no spec.

### 6.4 Hair (solid shells)

- **Geometry:** 6-10 shells from guide curves. A curve with a variable-width profile (taper, groove indent) →
  mesh → Catmull-Clark level 1 → QuadriFlow if needed.
  - Elements: the parting split, 2 side sweeps per side, a crown cap, the bun (a torus knot plus a wrapped band) and
    2 loose locks (tubes, ≤ 300 tris).
- **Shading:**
  - wrap diffuse on a near-black warm base (0.08, 0.065, 0.06);
  - **Kajiya-Kay** with two shifted lobes along `_strand`: a broad soft primary at 0.2 intensity and a tinted
    secondary;
  - groove AO from vertex colour (baked);
  - the rim as for skin.
- The look target is the matte-soft sheen in refs/hair-closeup.

### 6.5 Bust and kurta

- Simple stylised bust, about 2.5k tris, with a kurta shell modelled as the outer surface. No inner body under the
  kurta, which removes the garment-penetration gate failures (CHARACTER-PIPELINE §5).
- The orange piping is a geometry strip on the neckline and placket (about 300 tris), not texture.
- Kurta shading: wrap diffuse plus a faint cloth sheen term (cheap, `pow(1 − N·V, 5) × 0.08`) and baked fold AO.

### 6.6 Tone and output

NeutralToneMapping, exposure 1, sRGB output, an opaque WebGL2 context made by hand. The c-front background colour is
the default stage clear colour for evidence renders.

---

## 7. LOD and tier plan

| | H | B+ | B-lite | D |
|---|---|---|---|---|
| head skin | CC level 2 ≈ 6.8k tris | CC level 1 ≈ 1.7k tris + a level-2 face mask (eyes and mouth region) ≈ 3.2k total | = B+ | plate |
| eyes (×2) | eyeball 32×24 (1.5k) + cornea (0.4k) | eyeball 16×12 + cornea 0.2k | = B+ | |
| lash rims + brows | 1.2k | 0.6k | = B+ | |
| mouth bag, teeth, tongue | 2.4k | 1.0k | = B+ | |
| hair shells + bun + locks | 6.5k | 2.6k | = B+ | |
| bust + kurta + piping + earrings + bindi | 3.3k | 1.4k | = B+ | |
| **total tris** | **≈ 23-25k** | **≈ 10-11k** | = B+ | — |
| morphs | 82 | 58 (fold) | 58 | — |
| textures | iris 256² + atlas 512² (UASTC) | atlas 256² (ETC1S) | = B+ | — |
| shader | TaxilaToon full (+ KK hair, iris parallax, cornea) | no parallax; single KK lobe | `TIER_LITE`: wrap diffuse + rim only; cornea catchlight kept (it is what makes the eyes alive) | — |
| draws | ≤ 6 (skin, eyes, cornea, hair, brows+lashes, bust) | ≤ 5 | ≤ 5 | DOM |
| GLB budget | ≤ 2.5 MB (meshopt + quantization; morphs dominate) | ≤ 1.2 MB | same GLB as B+ | ≤ 75 KB plates |

- Morph-texture memory on H ≈ 16 B × verts × 82 ≈ 16 × 14k × 82 ≈ 18 MB (×2 JS copy) [U]. The morphs could be
  restricted to the head mesh only, with eyes on bones and teeth/tongue on bones where possible, cutting this by
  about 40%.
- GPU vertices per Blender vertex stay ≤ 1.3: no custom split normals (`avatar-asset-dead-ends` #4).
- KTX2 for textures (WebP lands as RGBA8, `avatar-asset-dead-ends` #5). meshopt, not Draco (#1).
- D plates are rendered from B+ by the existing `plates.py`.
- Export reuses `scripts/character/blender/export_tier.py`, then `finish.mjs` (gltf-transform), then
  `runtime-json.mjs`. The output look id is `c` (no name), at `public/assets/teacher/c/` behind flag `face.rig`.
  Shipping it is the main loop's call.

---

## 8. Vision-judge rubric (advisory) and the owner gate

The judge is built from the project's own lessons:
- A holistic 1-10 score does not track humans (`rj-holistic-model-judge-gate`).
- Poses chosen against the grading judge inflate scores (`teacher-presets-per-face`).
- Numeric gates passed while the owner saw "scary" (decisions, 2026-10-03).

### 8.1 Set-up

- **Judges:** two families from Azure Foundry Direct models, chosen by a short bake-off on the sanity battery. For
  example, the `DEPLOY_BRAIN` GPT vision model as primary, and a different family with vision (Llama 4 / Mistral /
  Grok vision, as deployed) as the second. Both must agree for a "pass"; disagreement counts as "fail" pending a human.
- **Stimuli per round:**
  - 6 renders of the candidate under the shipped light rig and background: front neutral, front smile (c-happy
    target), talking `aa`, listening, thinking, and 3/4 left;
  - each paired with the matching concept image;
  - shown at **128 px** (thumbnail, as in the SpeechRow) and **1024 px**;
  - left/right order randomised; the judge is not told which image is the render.
- **Sanity battery (must pass before the judge is used):**
  - reject ≥ 90% of pairs (c-front vs a rejected face: `bakeoff/stylised-premium`, GNM and Rocketbox renders);
  - accept ≥ 90% of ref-vs-ref pairs (c-front vs neutral, q3-left, etc.);
  - if it fails, change the judge, not the bar.

### 8.2 Atomic checklist (binary per item; each item gets a yes/no with a one-line reason, and nothing is averaged before the per-item report)

Identity and register:
1. Same character: would a person say these are the same person in the same art style?
2. Memoji/Bitmoji register: a phone-avatar cartoon, not a realistic CG person and not a doll?
3. Not scary or uncanny: no dead eyes, no stretched mouth, no plastic-doll look?

Proportions:

4. The head-to-shoulder ratio matches.
5. Eye size and spacing match: big, round, well apart.
6. The brows are thick, soft and rounded, at the same height.
7. The nose is a small soft button.
8. The mouth is small and soft, with lips as soft volume.

Eyes:

9. A glossy cornea with a visible white catchlight on both eyes.
10. The big brown iris has a dark pupil, and the sclera is visible but not dominant.
11. The lids wrap the eyeball with a thick dark lash line and a small outer flick.

Hair:

12. Solid sculpted hair with broad soft grooves, no strands or cards.
13. A centre parting.
14. The low bun reads.
15. Two soft loose locks in front of the ears.

Materials:

16. The skin is matte-soft and warm, with no pores and no blotches.
17. A gentle rim light; soft shading.
18. The colours match: skin tone, near-black hair, teal kurta, orange piping, gold studs, small dark bindi.

Expressions (per expression render):

19. The intended state reads at 128 px.
20. No artefacts: no teeth poke-through, no lid crack, no hair intersection.

### 8.3 Scoring and bars

- **Per item:** pass rate across 6 renders × 2 sizes × 2 judges.
- **Candidate bar (advisory):**
  - items 1-3 pass at ≥ 90%;
  - each other item at ≥ 75%;
  - expression legibility (19) ≥ 70% per emotion, n ≥ 12, confirmed by a **held-out** judge family not used during
    polish (`teacher-presets-per-face`).
- **Pairwise A/B between arms:** forced choice "which is closer to the concept" over the same stimuli. The arm with
  ≥ 65% wins; otherwise both go to the owner.
- **Numeric proxies (reported, not gating appeal):**
  - silhouette IoU per view;
  - landmark NME;
  - skin, hair and kurta ΔE2000 against concept patches (≤ 6);
  - G1-G6 + G-partial.
- **The owner gate:** a side-by-side sheet. Row 1: c-front | render, at 128 px and full size. Row 2: the four
  expression pairs. Row 3: a turntable strip. Plus a 10 s talking clip on the forced-aligned Hindi sentence
  (`scripts/character/align.py`). Nothing is called done without the owner's yes.

---

## 9. Order of work and the polish loop

| step | what | output | est. cost |
|---|---|---|---|
| P0 | landmarks + masks on the refs; the judge sanity battery | `landmarks.json`, `masks/`, `judge-sanity.json` | Foundry tokens only |
| A1-A3 | cage + params + fit | `art/character/stylised/a/head.blend`, fit report | CPU |
| B1-B4 | GPU sculpts (in parallel with A) | `art/character/stylised/b/runs/*` (≤ 30 MB kept, webp turntables) | ≤ USD 8 |
| B5 | wrap the template onto the best sculpt | `b/head.blend`, report | CPU |
| S1 | eyes, brows, lash rims, mouth interior, hair shells, bust (shared) | parts | CPU |
| S2 | rig-then-bake 82 keys + correctives; gates G1-G6 + G-partial | keyed `.blend` per arm | CPU |
| S3 | TaxilaToon shader in `scripts/character/viewer/shaders.js` (a new family), light rig, G9-style albedo solve | viewer renders | CPU (SwiftShader) |
| J1 | judge round 1, A vs B pairwise; pick or blend (§4.4) | `judge-r1.json`, sheet | tokens |
| L1-L3 | **polish loop**, at most 3 iterations: the judge's failing items → named region → parameter, pose-table or shader edits → re-render → re-judge. Each iteration ends with an owner sheet | sheets per iteration | tokens + CPU |
| T1 | tiers, export, budgets, D plates; runtime.json | `public/assets/teacher/c/*` (not committed by this workstream) | CPU |

Disk: keep ≥ 5 GB free. Turntable frames are deleted after composing webp sheets. GLBs and blends live under
`art/character/stylised/`; only the final GLBs go to `public/`.

---

## 10. Kill criteria and the 2D fallback (not started)

Switch to the 2D puppet of the same character if, after L3:
- the owner says it is not the same character or not Memoji-quality; **or**
- judge item 1 or 3 is below 70% at 128 px with both arms; **or**
- E-T2 on a Mali-G52-class device holds B-lite below 30 fps p50 after the pixel and fps knobs.

The 2D route would reuse the refs (front, 3/4, mouth set) as the art source for a layered puppet. Our options are
three.js 2D meshes with our own warps, or Rive (runtime MIT; the editor seat is a purchase, which the directive may
not allow, so in-house mesh warps are the default). It would keep the same `lip.ts` and `behaviour.ts` numbers. I will
say so plainly at the first point any of these criteria trips.

---

## 11. Licences (to be recorded in `art/character/LICENSES.md` as each is actually used)

| item | licence | status |
|---|---|---|
| refs (gpt-image-2 edits of our concept) | our output (Azure OpenAI terms: output owned by the customer) | made, hashes in §2.1 |
| Blender bpy 4.2 | GPL-3.0+ (tool; output ours) | in use already |
| `cma` (CMA-ES) | BSD-3 | planned |
| rembg / U-2-Net | MIT / Apache-2.0 | pinned in face3d |
| MediaPipe Face Landmarker | Apache-2.0 | pinned |
| Hunyuan3D-2.1 | Tencent Hunyuan 3D 2.1 Community (no EU/UK/KR; MAU clause) | pinned, target-only use |
| Hunyuan3D-2mv | tencent-hunyuan-community | re-read the LICENSE and hash it before the run |
| Step1X-3D | Apache-2.0 | verify the weights card + hash at run time |
| TRELLIS.2 | MIT, with NC/gated deps | conditional (§1.2) |
| PyTorch3D / Kaolin | BSD-3 / Apache-2.0 | with Step1X-3D |
| QuadriFlow (in Blender), Instant Meshes | GPL tool / BSD-3 | fallback |

---

## 12. Open questions for the main loop (to log, not to block)

1. Log `supersedes: teacher-stylised-face-commissioned` with the owner's 2026-10-04 directive, and a decision
   recording that image-to-3D output is a fitting target only (it never ships), consistent with
   `avatar-cast-shared-mpfb-s2`.
2. The look id `c` versus the `teal | slate | plum` map: is style C a fourth look, or does it replace `teal` for
   Asha? Runtime-contract owners decide.
3. The Hunyuan territory clause (EU/UK/KR) applies to assets "built this way" (`face3d-models` reversal). Because the
   shipped mesh is our template fitted to the sculpt, counsel may read this as outside the clause. Until then, prefer
   Step1X-3D (Apache-2.0) if it ties on IoU.
