# PLAN: the 2D animated teacher (character C), built in-house

**Date:** 2026-10-04. **Trigger:** the stylised 3D build failed the owner's bar after four judged rounds
(`../stylised/build/JUDGE-r4.md`: 2/5, blind tally n=7 with "same character" 7/7 and "Memoji quality" 0/7, mean 2.29).
**Owner directive (binding):** the teacher is concept C (`../stylised/concepts/c-front.webp` and its `-talking`, `-listening`,
`-thinking`, `-happy` and `-sheet` images). The work is in-house only: no artist and no bought character. Build a fully
polished 2D animated version of the same character, with these requirements:

- She talks, with Hindi/Hinglish lip-sync that includes tongue shapes.
- She listens, thinks and emotes.
- She runs at 60 fps on a cheap Android phone in the web app.
- She is driven through the unchanged HeadRig parameter names, so the Director, `behaviour.ts` and `lip.ts` do not change.
- Image spend stays under USD 30, on Azure Foundry image models only.
- Every runtime library is open source with a licence that allows commercial use.

Evidence tags as in `../stylised/RESEARCH.md`: [V] primary source read today · [S] secondary · [M] measured in this repo ·
[U] my inference, unverified.

---

## 0. One screen

1. **Why 2D can pass where 3D failed.** Every 3D defect the judges named was **surface craft that the agent had to make**:
   - a flat lip stripe and slab teeth;
   - faceted, lumpy skin with plastic shading;
   - a staring eyeball with pinched lids;
   - helmet hair with a crown seam.

   In arm P (painted), most of those pixels **are c-front's own pixels**, or edits of c-front made by the same image
   model that painted it. The agent's job moves from "sculpt appeal" (measured to fail: `rj-agent-authored-stylised-face`)
   to "cut, clean, rig and time". That job is engineering, which the agent has done well throughout this project.
2. **Rest pose = c-front, checked by pixels.** With every weight at zero plus the look's `restSmile`, the puppet must
   reproduce c-front: SSIM ≥ 0.97 for arm P and ≥ 0.92 for arm V, on the head-and-bust crop at 1024². No 3D route
   could ever pass that gate. It guards against identity drift for the rest of the build.
3. **Technique: Live2D-style deformation, written by us.** We take the techniques, not the software:
   - layered art with overscan;
   - per-layer warp lattices;
   - parameters with keyforms;
   - parallax for the head turn;
   - stencil-clipped eyes and mouth;
   - pendulum physics for hair.

   These run on our own ~1.5k-line WebGL2 renderer (`src/avatar/puppet2d/`). It has no runtime dependency, and its
   chunk is about 25 KB gz. Keyforms are **computed from a 2.5D proxy** (an ellipsoid head with a per-vertex depth),
   so the agent authors the rig as data and code, never in a GUI. Hand overrides per keyform are allowed for art
   direction.
4. **Two arms, one runtime, one puppet schema.**
   - **P (painted):** layers cut from c-front and completed by mask-edits on gpt-image. Mouths are a painted set:
     15 visemes × {neutral, smile, concern}, plus tongue patches. Mouth patches are swapped with a cross-fade, and
     every other layer moves by mesh warp.
   - **V (vector):** every feature is a parametric Bézier shape with soft-shading fields (edge-distance gradients and
     clipped Gaussian blobs), tessellated on the CPU and drawn by the same renderer. The mouth is continuous: lips,
     teeth and tongue are all functions of the mouth parameters, with no swaps.
   - **Pick per layer group by the rubric (§11).** My prior [U] is a hybrid: P for the hair, face base, ears, nose,
     neck and kurta, and V for the eye internals, lids, lashes and brows. The mouth is a true toss-up, and the judge
     decides it.
5. **Seam.** A new `Puppet2DRig` implements the HeadRig signature:
   `apply(bs, head[p,y,r], gaze[yaw,pitch], lean, breath)`, `dispose()` and `stats()`. A new `stage2d.ts` runs the
   same tick as `stage3d.ts`: tap → LipDriver → floorState → Behaviour → Compositor → rig.apply → render. The only
   files touched outside `src/avatar/puppet2d/` are a look-kind switch in `TutorFace.tsx` and a `kind` field in the
   look contract. `behaviour.ts`, `lip.ts`, `compositor.ts` and the Director are unchanged.
6. **Budget.**
   - **Images:** planned about USD 19, hard stop USD 28 (ledger, §9.3).
   - **Runtime download:** P ≤ 650 KB (one 2048² WebP atlas plus the mouth atlas plus JSON); V ≤ 120 KB.
   - **Frame cost:** CPU ≤ 3 ms and GPU ≤ 6 ms at p95 on a Mali-G52 class phone at 60 fps [U until bench B1].
7. **The gate is the owner's eye**, at full size next to c-front, plus short clips. My own eye and a blind Foundry
   vision panel are advisory (`rj-holistic-model-judge-gate`).

---

## 1. Research: how the best 2D talking characters are built

### 1.1 Survey

| system | how faces move | mouth / lip-sync | head turn | licence for us | what we take |
|---|---|---|---|---|---|
| **Duolingo Lily** (Rive) | One state machine drives the mouth, expressions and camera. Head and body are nested artboards. 8 head × 8 body idles recombine into 64+ neutral variations. It is a "modular actor": eyes, brows and mouth are layered so the expression only exists when they combine. The file is < 1 MB [V rive.app blog] | 20+ mouths per character, drawn for her personality [V via RESEARCH §1.1]. Mouth timelines sit on their own state-machine layer, picked by one numeric input and blended with eased transitions [S tutorials] | authored per pose, not a free turn | runtime MIT, **editor is a GUI**, and the `.riv` binary has no supported programmatic authoring path [U] → **technique only** | the mouth layer never fights the emotion layer; idle recombination; latency masked by pondering; mouths drawn per character |
| **Live2D Cubism** (VTubers) | ArtMeshes inside a deformer hierarchy (Body X/Y/Z → Breath → Face Rotation → per-part warp deformers). Parameters carry keyforms; values between keyforms are interpolated [V docs.live2d.com] | Mouth Form × Mouth Open params; the inner mouth, teeth and tongue are clipped by the lip mesh | `ParamAngleX/Y/Z` at ±30, with one warp deformer **per part** "to create parallax and deform it three-dimensionally" [V docs] | **blocked** (`rj-live2d-for-teacher`) → **technique only** | the per-part warp hierarchy; 3×3 angle keyforms; clipping masks; physics feeding parameters |
| **Inochi2D** | Open Live2D-like: a parameter system with 2D grid interpolation (linear, cubic or stepped) for transforms and mesh deforms; MeshGroups that deform other meshes [S] | as Live2D | as Live2D | BSD-2, but the web/WASM path is not production-ready (RESEARCH §1.5) → **technique only** | the 2D-grid keyform interpolation; **pendulum and spring-pendulum physics that feed parameters** (not vertices) |
| **iki** (zeikar/iki) | An MIT WebGL2 TypeScript runtime with warp-mesh and grid deformation, stencil clipping, spring/chain physics, an open JSON format, and an auto-rigger from role-named layers [V GitHub] | — | — | MIT, but early 0.x with 9 stars → **reference only**. Do not depend on it. Reading its code for ideas is fine | proof that this architecture fits in a small web runtime |
| **Spine** (Esoteric) | Bones plus weighted mesh deformation and FFD keys | slot attachments (swap) | mesh FFD per angle | runtimes are under the Spine Runtimes Licence, which needs an editor licence → **technique only** | weighted meshes for hair locks; attachment swap for mouths |
| **Adobe Character Animator** | Layer-named puppets; behaviours (Face, Lip Sync, Eye Gaze, Head Turner) | **11 audio visemes** (Ah, D, Ee, F, L, M, Oh, R, S, Uh, W-Oo) plus 3 silent mouths (Neutral, Smile, Surprised) [S helpx] | Head Turner **swaps** whole views (frontal / quarter / profile) | proprietary → technique only | that a teacher's mouth set is about 11-14 shapes, with emotion as the *silent* mouths; that swaps are fine when cross-faded |
| **Reallusion Cartoon Animator 360 Head** | Each feature sprite is transformed, deformed and masked per angle | sprite mouth sets | 9 angle points (25 advanced) on a 3×3 grid of yaw × pitch, each with transform, FFD 2×2 to 5×5, **sprite switch**, mask and **layer-order** settings; values between points are interpolated [V manual] | proprietary → technique only | **this is our head-turn recipe**: a 3×3 angle grid, per-layer transform plus FFD lattice, a sprite switch only where a warp cannot work, and a masked face |
| VTuber eye craft (general practice) | The sclera is clipped by the lid opening. The iris is a separate layer that moves under the clip. The highlight is a separate layer that barely moves (it reads as a wet cornea). Lids deform. A happy eye-smile is a separate closed-arc lid shape [U, common practice] | — | — | technique | the whole eye stack (§4.3) |

### 1.2 What separates "premium alive" from "cutout puppet" (the failure modes we design against)

1. **Seams and halos** at layer edges. The fix is overscan, premultiplied alpha, a 1-2 px feather painted into
   every cut, and no hard alpha edge against a different-coloured layer underneath.
2. **Paper flatness on a turn**, where every layer slides by the same amount. The fix is depth-graded parallax plus
   per-layer warps derived from one 3D proxy, and far-side shading that deepens with yaw (§5).
3. **Mouth popping.** Hard swaps at 10-15 Hz flicker. The fix is to cross-fade patches over 2-3 frames and to drive
   the lattice continuously between patches. Do **not** add a minimum hold:
   `avatar-lipsync-dead-ends` #2 measured that holds cut accuracy from r 0.43 to 0.16.
4. **Dead eyes.** The fix is a view-space catchlight that never disappears, with a micro-lag on saccades. The iris
   squashes on blinks, the lids wrap the eye, and lids follow the gaze.
5. **Static idle.** The fix is breathing in the bust and neck, physics on the locks and bun, behaviour-driven blinks
   and saccades, and head drift. These are all physical or functional, which keeps the "every motion has a
   function" rule in `behaviour.ts`.
6. **Expression = mouth only.** The fix is that every emotion moves the brows, lids, cheeks, mouth and head tilt
   together. Cheek lift pushes the lower lids up on a smile (the "eyes smile" of c-happy).

### 1.3 Hindi / Hinglish mouth needs

The contract gives 15 Oculus visemes plus `tongueTipUp`, `tongueCurl` and `tongueWide`. Azure `hi-IN` gives viseme
IDs (0-21) but no blend shapes [V, `docs/research/avatar/audio-to-face-ml.md`]. The visible distinctions a Hindi
mouth must draw:

| Hindi sounds | articulation | contract drive | what must be visible |
|---|---|---|---|
| प फ ब भ म | bilabial | `viseme_PP` | full lip seal, a slight press. Aspirates (फ, भ) release with a small puff (lip part plus jaw 0.1), which comes from timing, not a new shape |
| व (ʋ) | labiodental approximant, lighter than English v | `viseme_FF` at about 0.6 | the lower lip near the upper teeth |
| त थ द ध, dental न | dental: the tongue tip touches the back of the upper teeth | `viseme_DD`/`nn` + `tongueTipUp` | **the tongue tip just visible behind or at the upper teeth**, with a small jaw opening |
| ट ठ ड ढ ण ड़ ढ़ | retroflex: the tip curls back | `tongueCurl` (+ `viseme_DD` jaw) | the **underside of the tongue** (darker, with a shadow line) at the palate; the front of the interior is empty |
| ल | lateral | `viseme_nn` + `tongueWide` 0.5 + `tongueTipUp` | tip up, blade wide |
| र (tap/trill) | alveolar tap | `viseme_RR` + a brief `tongueTipUp` | a quick tip flick. The lips are less rounded than English r |
| क ख ग घ | velar | `viseme_kk` | the jaw open, with the tongue back and high (the front of the interior is dark) |
| च छ ज झ, श | palatal / post-alveolar | `viseme_CH` | the lips pushed forward, teeth near |
| स | alveolar fricative | `viseme_SS` | teeth together, lips parted |
| अ / आ | schwa / open | `viseme_aa` at 0.6 / 1.0 | open jaw; the schwa is smaller |
| इ ई / ए ऐ | front vowels | `viseme_I` / `viseme_E` | spread |
| उ ऊ / ओ औ | back rounded | `viseme_U` / `viseme_O` | rounded |
| anusvara, chandrabindu | nasalisation | none | no mouth change. Never invent one |

Rule: tongue keys are a **separate layer** inside the clipped mouth interior. They are never crossed into the lip
art. That keeps the mouth art list small (§6) and lets `tongueTipUp` ride on any viseme, as `VISEME_TO_ARKIT` already
does for `DD` and `nn`.

---

## 2. Rendering runtime decision

| option | licence | gz size [U] | fits | verdict |
|---|---|---|---|---|
| **Own WebGL2 renderer** (`puppet2d/gl.ts`): textured triangle meshes, premultiplied alpha, a stencil for clipping, dynamic vertex buffers | ours | ~25 KB with the rig | full control; an opaque hand-made context (the CHARACTER-PIPELINE §4.4.1 lesson); no three.js in this chunk | **chosen** |
| PixiJS v8 (`MeshSimple`, `MeshPlane`, masks) | MIT [S] | ~100-150 KB tree-shaken | good mesh API; masks and filters cost extra passes | fallback if our renderer stalls in bring-up for more than 1 day |
| three.js r180 orthographic | MIT | already in the lazy 3D chunk (~170 KB) | would reuse `stage3d` code | rejected: it drags 170 KB into the 2D path, which should also serve devices the 3D tiers cannot hold |
| Canvas2D | browser | 0 | no mesh warp (affine only) | only the static plate (tier D) and portraits |
| SVG DOM animation | browser | 0 | re-rasterises gradients every frame; jank on low-end Android [U] | authoring and preview for arm V only, never the runtime |
| Rive runtime | MIT | 222 KB (canvas-lite) [V RESEARCH] | needs `.riv` authored in the GUI | excluded (no programmatic authoring) |

**Renderer specification:**

- **Draws.** One draw per layer, about 30-40 draws. Overdraw is about 3× at the bust framing, with no
  full-screen passes.
- **Context.** WebGL2 with `{alpha:false, antialias:false, stencil:true, premultipliedAlpha:true}`. The canvas
  clears to the look's backdrop (c-front cream).
- **Anti-aliasing:**
  - painted layers AA through their feathered alpha;
  - V shapes AA through a per-vertex edge-distance attribute (fwidth AA in the fragment shader);
  - MSAA is off.
- **Vertex work.** Deformation runs on the CPU in TypedArrays (≤ 8k vertices in total) and uploads with
  `bufferSubData` per frame. Only the dirty layers upload.
- **Idle frames.** A frame where nothing moved skips the GPU, as `stage3d` already does. Breathing means something
  always moves, so in practice the cap applies.
- **Shaders.** Two programs:
  - `paint`: texture × tint × alpha, plus an optional multiply-shade uniform for turn shading;
  - `vec`: a flat or gradient colour, plus edge-distance soft shading and AA.

---

## 3. Layer list (draw order, back to front)

There is one `puppet.json` per look. Every layer has these fields:

- `id`;
- `src`: an atlas rect for P, a shape id for V;
- `mesh`: a grid lattice or a ribbon;
- `depth`: proxy depth, in units of face half-width `r`;
- `parent`: the deformer group;
- `clip`: a stencil source;
- `drivers`.

**Groups:** `body` (breath, lean) → `neck` → `head` (roll about the neck pivot, then yaw and pitch through the
proxy) → `face` (expression lattices).

| # | layer | group | depth (r) | how it animates | P source | V construction |
|---|---|---|---|---|---|---|
| 1 | backdrop | — | — | clear colour | c-front bg sample | same |
| 2 | **hair_back** (the mass behind the head, both sides, down to the nape) | head | −0.65 | proxy parallax (moves *against* the yaw); a 4×4 warp; physics sway ±1.5° from head angular acceleration | inpaint edit E3: the hair mass with the face, ears and neck removed, painted with overscan | Bézier mass, base `#26211f`-ish, groove strokes |
| 3 | **bun** | head | −0.75 | parallax; a 2-DOF damped spring (lag 80-120 ms); squash ≤ 2% | E4: the bun completed where the neck and lock hide it | Bézier knot with 3 wrapped grooves |
| 4 | **kurta** (with piping) | body | 0 | breath: scale y 1 + 0.006·breath about the hem, shoulders rise 1.5 px; lean: scale 1.02 | c-front cut (+ E7 for the area under the locks) | teal fill, fold gradients, orange piping stroke |
| 5 | **neck** (plus the under-chin shadow, a separate multiply layer 5b) | neck | −0.2 | follows the head 35% (the Neck 35 / Head 65 split from §4.2 rule 6); stretches with pitch; the shadow moves with jaw and pitch | E5: neck extended up under the chin (overscan) | gradient fill + shadow blob |
| 6 | **ear_L / ear_R** | head | −0.15 | parallax; the near ear grows to ×1.08 and moves out, the far ear slides behind the face (behind layer 7 in order) | E2: ears completed under the side hair | Bézier ears with inner shading |
| 7 | **face_base** (skin with no eyes, brows or mouth; nose shading kept; overscan into the hairline and past the cheeks) | head | proxy surface | the **cylindrical/ellipsoid warp** (§5); expression lattice: cheek lift (smile, cheekSquint), jaw drop (chin down by jawOpen), cheekPuff | **E1: the "blank face" mask-edit** (eyes, brows and mouth replaced with matching skin) + E1b (forehead and temples under the hair) | ellipse-ish outline + 5 shading blobs (cheek warmth, under-hairline shade, chin terminator, side shading, nose tip) |
| 8 | **turn_shade_L / turn_shade_R** | head | surface | multiply layer; alpha = max(0, ±yaw)/20° × 0.35; slides with the terminator | generated from the face_base alpha + a gradient (no image spend) | same |
| 9 | **blush** (very subtle) | face | surface | **static** at the art's level. Not animated (the safety floor: no blush loops) | part of c-front | blob |
| 10 | **nose** | face | +0.55 tip | the largest parallax; on yaw, the far-side nostril shading compresses | c-front cut (the nose sits on face_base in E1) | ball + 2 dimples + a tip highlight |
| 11-13 | **mouth stack** (stencil = inner-lip contour): `mouth_interior` (a dark-red gradient), `teeth_upper`, `teeth_lower` (moves with the jaw), `tongue` | face | +0.35 | see §6 | patches from the mouth sheet (§6.2) | parametric (§6.3) |
| 14 | **lips** (outer lip shapes; for P they are inside the patch) | face | +0.38 | P: the patch swap + a 3×3 lattice for corners and open; V: a parametric contour | patch | Béziers with upper-crescent / lower-pillow shading |
| 15-20 | **eye stack ×2** (§4.3): `sclera` (stencil = the opening), `iris` (+ pupil, + limbus), `catchlight`, `lid_upper` (skin + crease), `lash_upper` (ribbon with flick), `lid_lower` (+ a soft lower line) | face | +0.25 | gaze transform; lid curves from blink, squint, wide and lid-follow | sclera/iris from refs/eye-closeup + E6 (closed-lid art); lashes cut from c-front | all vector (prior winner) |
| 21 | **brows ×2** | face | +0.3 | a ribbon on a 3-point spline (inner, mid, outer); thickness profile from the art | cut from c-front, mapped onto the ribbon UV | ribbon fill with rounded head and tapered tail |
| 22 | **bindi** | face | +0.28 | parallax only (it rides the forehead warp) | c-front cut | disc |
| 23 | **earring_L / earring_R** (gold studs) | head | −0.1 | parallax; follows the ear; a glint sprite whose alpha follows yaw and pitch change (a moving specular). Studs do not swing; at most a 0.5 px jiggle on nods | c-front cut | circle + highlight |
| 24 | **hair_cap** (the top shell with the parting, over the forehead and sides) | head | +0.15 over the surface | proxy rotation with a cap offset, so the **parting moves with the head**; 5×5 lattice; brows never pass under it (the brow ribbon is clamped below the hairline) | c-front cut + E3 overscan | 2 masses with groove strokes and a broad soft sheen band |
| 25 | **side_sweep_L / side_sweep_R** (the front masses over the ear tops) | head | +0.05 | parallax + a 3×3 warp; small physics lag | c-front cut + E2 | masses |
| 26 | **lock_L / lock_R** (the loose front strands) | head | +0.1 | a **6-segment rope mesh** on a verlet chain (pendulum) anchored at the temple; driven by head angular acceleration, breath and gravity; collides with the cheek ellipse | c-front cut; under-strand completed by E2 | tapered ribbon with a sheen stroke |

The head layers come to about 32 draws (×2 for paired parts). Every P layer is cut with **8-12% overscan**
(painted area beyond what c-front shows). Without it, a turn or a jaw drop reveals a hole. Producing that overscan is
what the inpainting edits (§9) are for.

---

## 4. How each part animates

### 4.1 Animation method rules

- **Transform** (translate, rotate, scale) is for rigid parts: the bindi, earrings, iris and catchlight.
- **Mesh warp** (grid lattice with keyforms) is for anything that bends: the face base, hair masses, ears, neck,
  kurta, and the mouth patch between swaps.
- **Ribbons** are for anything that is a line: brows, lashes, the lower-lid line, locks and piping.
- **Swaps** are used only where topology changes: P mouth patches (open vs closed, teeth vs no teeth, tongue states)
  and P eye-closed arcs. Every swap is a cross-fade of 2-3 frames (33-50 ms at 60 fps).
- **Keyforms:** each lattice stores keyforms on a parameter grid. The runtime interpolates them bilinearly in 2D
  grids (as in Inochi2D) and adds them up across independent parameters, as Live2D does for separate parameters.

### 4.2 Head, body, idle and physics

| motion | source | implementation |
|---|---|---|
| head pitch/yaw | `head[0..1]` from behaviour (yaw ≤ 20°, the GR-1.4 remainder) | §5 proxy projection |
| head roll | `head[2]` | rigid rotation of the head group about the neck pivot (at the chin-neck junction) |
| lean | `lean` 0..1 | body + head scale ×(1 + 0.025·lean), y + 6 px, a slight pitch-down of 2° |
| breathing | `breath` (the existing rig argument) | kurta and shoulder scale y; neck +0.5 px; head y follows 60%; **always on**, so she is never static |
| blink | `eyeBlinkLeft/Right` (gamma blinks with time-warp, from behaviour) | the lid curve closes; on frames where blink > 0.9 the iris squashes 6% in y; 1 frame of lid squash/overshoot on reopening (renderer-side, purely physical) |
| saccades / gaze | `gaze[yaw,pitch]` | iris translate within an ellipse of travel (yaw 25° → 0.42 × the opening half-width); the catchlight moves 25% of the iris travel (the cornea reads as wet); upper-lid follow from `eyeLookUp/Down` (already in the CHARACTER-PIPELINE rule 3) |
| hair locks | physics | verlet, 6 nodes, 4 ms substeps, damping 0.08, gravity + inertial force from the head-group acceleration; **reduced motion ×0.3** |
| bun / back hair | physics | 2-DOF damped spring on the deformer offset (k 90, ζ 0.5) |
| earrings | physics/specular | glint only (studs) |

**What the renderer must not add:** no random fidgets and no idle loops. Lily-style idle recombination belongs in
the behaviour layer (RESEARCH §4.3), and `behaviour.ts` is frozen for this workstream. If the judges find the idle
lifeless with physics plus breath plus behaviour, that becomes a proposed `behaviour.ts` change for the main loop. The
renderer does not compensate on its own.

### 4.3 Eyes (the part that decides "alive vs dead")

1. **Opening** is a closed curve made of the upper-lid Bézier (4 control points) and the lower-lid Bézier. Inputs:
   - blink: the upper lid descends to meet the lower lid at 35% of the opening height (the Memoji convention);
   - squint and cheekSquint: the lower lid rises up to 30% and flattens;
   - eyeWide: the upper lid rises 12%;
   - happy closed: when blink > 0.6 and smile > 0.4, the closing arc **inverts** into the c-happy ^ crescent. This
     is a keyform, not a new image in V; in P it is a swap to the E6 crescent.

   The opening is drawn to the stencil (ref 1 for left, 2 for right).
2. **Sclera:** a warm off-white fill with a soft top shadow under the lid. For P it is painted; for V it is a
   gradient whose top 25% is darker and which moves with the lid.
3. **Iris** (≈ 61% of the visible eye height, from TECH-PLAN §2.3):
   - radial brown with a darker limbus ring and a pupil of 0.42 of the iris;
   - translated by gaze;
   - scale x × cos(gaze yaw + head yaw × 0.6), the foreshortening that sells the turn;
   - drawn under the stencil.
4. **Catchlight:** one crisp soft-edged white disc, upper-left as in c-front, plus an optional tiny second dot. It
   is in view space and stays put when the head turns, which keeps the eye "wet". It is hidden only by the lid (via
   the stencil).
5. **Upper lid skin:** the region above the opening edge, in the skin colour plus a crease line. It moves with the
   opening edge, so the lid wraps over the eye rather than the eye shrinking.
6. **Lash line:** a ribbon along the upper-lid edge with a thickness profile (thin at the inner corner, thick
   across the top, a smooth tapered flick at the outer corner) and a near-black colour. It is a single tapered shape:
   the JUDGE-r4 fix #6 lesson ("jagged lashes", "pinched outer corner").
7. **Lower line:** a 40% opacity soft line that rises with squint.

### 4.4 Brows

- A ribbon on a 3-point spline with these drivers:
  - inner point: `browInnerUp` (up 0.18 IOD), `browDown` (down 0.08 and in 0.05 IOD);
  - outer point: `browOuterUp` (up 0.14 IOD);
  - mid: interpolated, with an arch gain that bends the brow on `browInnerUp` (the worry shape);
  - `browDown` also tilts the head end down, which gives concentration in thinking.
- On yaw, the far brow foreshortens through the proxy.
- The brows are clamped below the hair_cap edge.

### 4.5 Cheeks, jaw and nose

- **Smile:**
  - `mouthSmile` and `cheekSquint` lift the cheek lattice up and out by 4-6% of r;
  - they push the lower lid up (adding to `eyeSquint`);
  - the nasolabial region compresses slightly;
  - in P a soft shadow arc is added by the cheek-lift keyform; in V the shading blob moves with it.
- **jawOpen:**
  - the chin and lower face move down by up to 0.09 r × jawCeiling;
  - the mouth-patch lattice follows;
  - the neck shadow grows.
- **cheekPuff:** cheeks out 3%.
- **noseSneer:** the nose wings lift 1-2 px. It is rarely used.

---

## 5. Faking the ±20° head turn

**The proxy.** An ellipsoid head fitted to c-front: rx = face half-width (212 px at 1024²), ry = 1.18 rx,
rz = 0.95 rx, centred at the face centre. A depth field adds bumps on top:

- nose: +0.55 r at the tip, falloff 0.15 r;
- cheeks: +0.06;
- eye sockets: −0.04;
- lips: +0.05;
- brow ridge: +0.03.

Each vertex of each head layer stores its rest 2D position and a depth:

- face_base vertices take the proxy surface depth at their xy;
- feature layers take their table depth (§3);
- hair layers sit on the proxy surface plus an offset (cap +0.15; back hair is a back-surface offset).

**Runtime projection** (orthographic, cheap, exact for the proxy):
`p = R(pitch, yaw) · (x, y, d) → (x', y')`. A small perspective term applies x' ×= 1 + 0.04·z' / r, so near features
scale up slightly.

Behaviour of each part under the projection:

- The **face outline**: the face_base lattice vertices lie on the ellipsoid, so the near cheek bulges out, the far
  cheek tucks in, and the far side's texture compresses.
- The **overscan** past the near cheek becomes visible. The E1 overscan exists for exactly this.
- **Ordering:** the far ear goes behind face_base, as in the fixed order. The far lock may pass behind the cheek: the
  lock has a per-node depth, and a stencil test against the face silhouette hides the part behind the face.
- **Masking:** features (eyes, brows, nose, mouth) are clipped to the face silhouette stencil (ref 3). A far eye at
  the edge cannot hang off the face. Cartoon Animator's "mask out features outside the face" does the same.
- **Shading:** turn_shade multiply layers deepen the far side (alpha ∝ |yaw|); the nose's far-side shading
  compresses.
- **Art direction:** a 3×3 keyform grid (yaw −20/0/+20 × pitch −12/0/+12) of *offsets on top of the projection* per
  layer, stored in `puppet.json`. Hand-tuned in the polish loop. This is where "the far eye shrinks 4% more" or
  "the parting shifts 3 px more" live. It is Cartoon Animator's 9 angle points, and they start at zero.
- **Sprite switch (the last resort, P only):** if hair_cap at ±20° tears or looks flat after warps, generate one
  edit per side, "the same hair at a slight 3/4 turn", cut it to the same layer, and cross-fade by |yaw| in
  [12°, 20°]. The budget holds 4 such edits.
- **Validation:** `refs/q3-left.webp` and `refs/q3-right.webp` are about 30-35° 3/4 views. At yaw ±20°, the
  render's feature positions should sit between front and q3 (landmark interpolation error ≤ 4% IOD). Judge items
  T1-T3 (§11) apply.
- **Hard limit:** the runtime clamps yaw to ±20° and pitch to +12/−10. Behaviour already caps the head at 20°.

---

## 6. Mouths: the parameter solver and the art list

### 6.1 Mouth solver (shared by both arms; `puppet2d/mouth.ts`, pure, tested)

The composited weights (after `Compositor`) map to a **mouth state**:

`open, wide, round, smile (signed: + smile, − frown), concern, upperUp, lowerDown, press, rollIn, teethShow, tipUp, curl, tongueWide, tongueOut`.

Sources:

- **visemes:** each `viseme_*` weight contributes its canonical state (a table taken from the TECH-PLAN §5.3
  recipes);
- **ARKit lip keys:** linear maps. For example: open = jawOpen / jawCeiling; round = max(funnel, pucker);
  wide = stretch;
- **emotion:** smile = avg(mouthSmileL, R) − avg(mouthFrownL, R); concern = f(browInnerUp, mouthPress) when
  smile < 0.1;
- **tongue keys:** taken directly;
- **asymmetry:** `mouthSmileLeft` ≠ `Right` and `mouthLeft/Right` give a lattice skew (the playful lopsided smile).

The M0 `lip.ts` emits only jaw, funnel, pucker and stretch. The solver must therefore look good from that alone,
because that is today's live path. Visemes are used when HeadAudio or Azure IDs arrive. Both paths are tested.

### 6.2 Arm P: painted mouth patches

- **Mouth close-up base.** One high-quality edit (M0) zooms c-front's lower face to 1024² so the mouth is about 380
  px wide. Every mouth patch is a **masked edit of that close-up**, at medium quality, with only the mouth region
  editable. The patch is then:
  1. cut with a feathered ellipse;
  2. colour-matched to the base ring (a per-channel affine fit on the unmasked ring);
  3. Poisson-blended (OpenCV `seamlessClone`) on the base;
  4. downscaled to a runtime cell of 192×144.
- **Art list** (rows = the mouth shapes; columns = the emotion register):

| row | covers | neutral | smile | concern |
|---|---|---|---|---|
| m_sil | viseme_sil | ✓ (= neutral ref) | ✓ (= c-front) | ✓ (slight press, corners down) |
| m_PP | PP | ✓ | ✓ | ✓ |
| m_FF | FF (light, for व) | ✓ | ✓ | — (falls back to neutral + lattice) |
| m_TH | TH; Hindi dental tip visible | ✓ | ✓ | — |
| m_DD | DD, nn (jaw small, teeth, interior; the tongue comes from the tongue layer) | ✓ | ✓ | ✓ |
| m_kk | kk | ✓ | ✓ | — |
| m_CH | CH (SH, J) | ✓ | ✓ | — |
| m_SS | SS | ✓ | ✓ | ✓ |
| m_RR | RR | ✓ | — | — |
| m_aa | aa (also the delight laugh at full open in the smile column) | ✓ | ✓ | ✓ |
| m_E | E | ✓ | ✓ | — |
| m_I | I | ✓ | ✓ | — |
| m_O | O (also surprise at large open) | ✓ | ✓ | ✓ |
| m_U | U | ✓ | — | ✓ |
| m_open_sm | the small half-open, between rows (speech filler) | ✓ | ✓ | ✓ |

  That is **39 lip/teeth patches**. The concern column only needs the shapes a gentle-concern utterance actually
  uses; the rest fall back to the neutral patch plus the lattice's corner-down keyform.
- **Tongue:** for P, the tongue is drawn as **separate tongue patches** (painted on an open-mouth interior, cut by a
  tongue mask): `t_rest`, `t_tipUp`, `t_curl` (underside), `t_wide`, `t_out` = 5 patches. They sit in the mouth stack
  under the upper teeth and are clipped by the current patch's inner-lip mask, which is extracted per patch at build
  time. Tongues do not need emotion columns.
- **Interior:** each open patch's interior is re-flattened at build time: the inner region gets a uniform soft-dark
  gradient (bag colour as in CHARACTER-PIPELINE §4.4 #7), so the tongue and teeth layers sit on a consistent
  interior.
- **Runtime selection:**
  - the column weight comes from smile and concern (soft, so two columns can cross-fade);
  - the row comes from nearest-neighbour in mouth-state space with hysteresis 0.05 (the `mouthCell` idea);
  - the current patch's 3×3 lattice is warped to the exact open/wide/round/smile, so motion between swaps is
    continuous;
  - each swap is a 2-3 frame cross-fade.

### 6.3 Arm V: a parametric mouth

- **Lips.** The upper lip is an outer contour (5 control points: corners, 2 peaks, cupid's-bow dip) plus an inner
  contour. The lower lip is a fuller pillow. Every control point is a linear function of the mouth state, authored as
  keyforms on the state axes, so it is data. Shading:
  - upper lip: a darker crescent (shade field 0.15);
  - lower lip: a soft highlight blob at 40% height and a shadow crease below;
  - corner pockets: small dark ellipses whose size grows with smile;
  - all clipped to the lip shape.
- **Teeth.** The upper row is one curved band clipped to the inner contour. Its visible height is
  clamp(open·k + upperUp) and it never exceeds the lip (by construction: it is clipped). The lower row shows only
  when open > 0.35 or on SS/E/I. There are no individual teeth: one white band with a soft top shadow and 2-3 faint
  separation hints at 10% opacity. This fixes the "floating slab" failure.
- **Interior.** A dark warm radial gradient (bag colour), lighter toward the front-bottom.
- **Tongue.** A Bézier blob of 6 control points, a function of (tipUp, curl, tongueWide, tongueOut, open):
  - tipUp: the tip reaches the upper teeth's back edge;
  - curl: the tip rotates back and up, the underside colour (darker, bluish-red) shows, and a midline vein hint
    appears;
  - wide: the blade flattens and fills 85% of the interior width;
  - out: the tip passes the lower teeth (capped).
- **Corners** follow the smile arc (up and back) and the frown (down). Asymmetric weights skew them.

### 6.4 Emotion register (both arms)

The mouth columns are crossed with the face-wide emotion poses. Emotion poses are **presets in the look's
runtime.json**, per face (`teacher-presets-per-face`). They are re-scored on this face, with a held-out judge.

| emotion (owner list) | maps to | brows | lids / eyes | cheeks / mouth | head |
|---|---|---|---|---|---|
| warm smile | `warm` (behaviour.ts) | relaxed, +0.05 outer | squint 0.1 | smile column, cheek lift 0.3 | tilt 2° |
| delight | `excited` / `proud` | outer up 0.25 | happy crescent at peaks, wide 0.12 at onset | smile column, m_aa-open laugh shape at peak, full cheek lift | small bounce: 1 spring impulse up |
| gentle concern | `concerned` | inner up 0.3 (worry bend), slight knit | soft, lids 10% lower | concern column, press 0.12 | tilt 5°, chin down 3° |
| surprise | (no Emotion value today; ARKit mix: eyeWide, browOuterUp, browInnerUp, jawOpen 0.25 → m_O) | up | wide, iris shrinks 3% | small O | head back 3° (pitch −) |
| playful | (no Emotion value today; asymmetric smile, one brow up, tilt) | one outer up 0.3 | squint 0.15 | lopsided smile skew, **no wink**, no tongue-out, no pout | tilt 6° |
| listening | state `listening` | slightly up | attentive: lids open, gaze contact with Andrist aversions | soft closed smile | nods (behaviour), lean-in on your_turn |
| thinking | state `thinking` | one brow down / inner up | **glance away up-left** (behaviour's cognitive aversion) | lips pushed aside (mouthLeft 0.3 + press), as in c-thinking | tilt 4°; no hand: the thinking pose is hands-free as the owner asked; the bust has no hands in frame |

`surprise` and `playful` can be rendered from ARKit mixes today, but behaviour.ts's `Emotion` type does not emit
them. Adding them is a Director/behaviour decision for the main loop. The puppet will already render them. The
safety floor is kept: no wink, no blush animation, no pout and no romance register in any preset.

---

## 7. Parameter mapping from the HeadRig names

ARKit `Left` is **her** left (screen right). Unlisted ARKit keys are accepted and ignored. Everything is clamped
after the Compositor.

| input | puppet parameter(s) |
|---|---|
| `head[0]` pitch (+ = chin down), `head[1]` yaw (+ = her left), `head[2]` roll | proxy R(pitch, yaw); head-group roll about the neck pivot; neck takes 35% |
| `gaze[0]` yaw, `gaze[1]` pitch | iris and catchlight translate; iris foreshortening |
| `lean`, `breath` | body group (§4.2) |
| `eyeBlinkL/R` | upper-lid closure |
| `eyeSquintL/R`, `cheekSquintL/R` | lower-lid rise; cheek lift (cheekSquint) |
| `eyeWideL/R` | upper-lid raise |
| `eyeLookUp/Down/In/OutL/R` | lid follow only (gaze moves the iris) |
| `browDownL/R`, `browInnerUp`, `browOuterUpL/R` | brow spline points |
| `jawOpen` (≤ jawCeiling), `jawForward/Left/Right` | mouth open + chin lattice; small chin shift |
| `mouthClose`, `mouthPressL/R`, `mouthRollLower/Upper` | mouth state close / press / rollIn |
| `mouthFunnel`, `mouthPucker` | round |
| `mouthStretchL/R`, `mouthDimpleL/R` | wide |
| `mouthSmileL/R`, `mouthFrownL/R`, `mouthLeft/Right` | smile ±, skew |
| `mouthUpperUpL/R`, `mouthLowerDownL/R`, `mouthShrugUpper/Lower` | upperUp, lowerDown (teeth show); chin bump |
| `cheekPuff`, `noseSneerL/R` | cheek lattice; nose wings |
| `tongueOut` | tongueOut |
| `viseme_sil PP FF TH DD kk CH SS nn RR aa E I O U` | mouth state canonical table (§6.1) |
| `tongueTipUp`, `tongueCurl`, `tongueWide` | the tongue layer |
| correctives (`jawOpen_mouthClose`, …) | ignored (a 2D solver needs none), accepted silently |

`stats()` returns `{triangles, meshes}` = total triangles and draw count. Stage events are identical to the 3D ones,
so the existing telemetry and the governor carry over.

---

## 8. Integration (the Integrate phase only; minimal seam)

- **New files (Integrate phase):** `src/avatar/puppet2d/`:
  - `rig.ts` (Puppet2DRig: apply/dispose/stats);
  - `gl.ts` (renderer);
  - `deform.ts` (lattices, keyforms, proxy);
  - `mouth.ts` (solver);
  - `physics.ts`;
  - `stage2d.ts` (the stage3d tick contract: frame cap, governor, reveal-in-silence, context-loss handling with
    `forceContextLoss`, as in `avatar-m0-review-traps` #1);
  - `contract.ts` (`puppet.json` schema + validator, no DOM).
- **`HeadRig.root` is a three `Group`.** The 2D rig implements the same `apply` signature, but its `root` is a
  canvas. Proposal: `stage2d` owns the canvas, and `Puppet2DRig` implements `Omit<HeadRig, "root">`. No change to
  `head.ts`.
- **Seam edits:**
  1. `three/contract.ts`: the look entry gains `kind?: "glb" | "puppet2d"` (default `"glb"`);
  2. `TutorFace.tsx`: when the look is `puppet2d`, import `./puppet2d/stage2d.ts` instead of `./three/stage3d.ts`.
     It is behind `face.rig`, with no new flag. The ARKit emotion presets come from the look's runtime.json.
- **Tier D / portraits:** render the puppet at rest to `plate.webp`, plus the 5 mouth cells from `m_open_sm`/`m_aa`
  and the blink overlay. That way `PlatePerson` shows the same picture and no fallback ever changes the face.
- **Tiers:**
  - B → puppet at 60 fps, DPR ≤ 2;
  - Blite → puppet at 30 fps, DPR 1, physics substeps ×0.5 (same art, so no face change);
  - D → the plate;
  - E → voice.

  2D may well hold on devices that are D for 3D. The probe decides that, not a regex.
- **Assets:** `public/assets/teacher/c2d/<rev>/` holds `puppet.json`, `atlas.webp` (2048²; 1024² for Blite),
  `mouth.webp` (the cell atlas), `runtime.json` and `plate/*`. They are published by a `publish-puppet.mjs` mirroring
  `publish-look.mjs`. Not committed by this workstream.

---

## 9. Build arms, steps and budget

### 9.1 Arm P: painted layers + mesh-warp runtime

| step | what | output |
|---|---|---|
| P0 | **Probe the image deployments** (`taxila-image` = gpt-image-2; `gpt-image-2.5-flare` has quota 0/4 per `measurements.md`, so it is likely not yet deployed). Probe: one masked edit at medium, testing whether the mask is respected outside the region, whether `background: transparent` is honoured [U], and the cost per call from the usage fields | `scripts/character/puppet2d/probe.mjs`, ledger row |
| P1 | **Segmentation of c-front** into layer masks: colour clustering (hair near-black, skin, teal, orange, gold, eye white) + the agent's polygon annotations (`art/character/puppet2d/masks.json`), checked by overlay PNGs by eye | masks 1024² per layer |
| P2 | **Completion edits** (mask = the hidden region plus overscan; prompt = complete the hidden part; image = c-front). E1 blank face; E1b skin under the hairline; E2 ears and the area under the locks; E3 hair_back with the face removed; E4 bun; E5 neck under the chin; E6 closed-eye lids (normal + happy crescent); E7 kurta under the locks. About 10 edits at high, 2 tries each | completed layer sources |
| P3 | **Strict compositing:** only masked pixels are taken from each edit. Each edit is registered to c-front (ECC on the unmasked area) and colour-transferred per channel on a ring. Seams are Poisson-blended. ΔE2000 skin/hair/kurta vs c-front ≤ 2 | cleaned layers |
| P4 | **Upscale ×2** of the head layers for the close framing (Real-ESRGAN x2 if its weights' licence checks out commercial-OK [U]; else Lanczos + unsharp). Then atlas packing, premultiplied, 2048² WebP q90 | `atlas.webp` |
| P5 | **Mouth sheet:** M0 close-up + 39 lip patches + 5 tongue patches (§6.2) as masked medium edits; then cut, colour-match, interior flatten | `mouth.webp` |
| P6 | **Rig authoring as data:** lattice sizes, depths, keyform offsets, pivots (`puppet.json`), generated by `scripts/character/puppet2d/rig.mjs` from the masks + proxy | `puppet.json` |
| P7 | **Viewer + evidence:** `scripts/character/puppet2d/viewer/` (Vite page) + Playwright stills/clips (§11.3) | renders, clips |

### 9.2 Arm V: parametric vector redraw

| step | what |
|---|---|
| V1 | **Shape inventory as JSON:** every feature is a closed cubic-Bézier path with named control points, fill or gradient, and shading fields (edge-distance shade with an inner colour and width; Gaussian blobs with centre, radii, colour and opacity, clipped to the parent). Hair grooves are tapered strokes. |
| V2 | **Fit to c-front:** CMA-ES (`cma`, BSD-3) over control points and colours. The loss is LAB L1 + a Sobel-edge term + a mask IoU per layer, against the P1 masks. The rasteriser is our own numpy scanline for the loss; the final evidence uses the WebGL renderer. Then the agent edits by eye, region by region, at 4× zoom. **No image spend.** |
| V3 | **Keyforms** on the mouth-state axes, the lid curves and the brow spline, authored as numbers in `puppet.json` (the same schema as P, with shape ids instead of atlas rects). |
| V4 | **SVG export** of any pose, for reviews and blind-judge stills alongside the WebGL capture. |
| Risk [U] | Soft Memoji shading built from blobs may read as **flat vector** (concept direction d, which the owner did not pick) on the hair and skin. That is why the prior is a hybrid. If V's rest SSIM is below 0.92 after V2 + 1 polish pass, V is confined to the eye, brow and mouth layers. |

### 9.3 Image budget (USD 30 cap; ledger `art/character/puppet2d/ledger.json`, written per call from the `usage` field; the script refuses to call past USD 28)

Prices: gpt-image-2 **medium ≈ $0.053/image** [M measurements.md]. **High ≈ $0.25-0.30** [U: from refs.json's 133,456
output tokens for 19 images at the gpt-image-1 list price]. P0 replaces both with measured numbers.

| item | calls | quality | est. USD |
|---|---|---|---|
| P0 probes | 4 | medium/high | 0.7 |
| P2 completion edits (10 × 2 tries) | 20 | high | 6.0 |
| E6 closed-eye variants + 2 retries | 4 | high | 1.2 |
| M0 mouth close-up base (×2 tries) | 2 | high | 0.6 |
| P5 mouth + tongue patches (44 + 30% retries) | 58 | medium | 3.1 |
| ±20° hair sprite-switch edits (only if warps fail) | 4 | high | 1.2 |
| polish-loop re-paints | 12 | high | 3.6 |
| blind judge (Foundry vision, ~40 calls) | — | text tokens | ~2 |
| **planned total** | | | **≈ 18.4** (hard stop 28) |

Rate limit: `taxila-image` allows 4 requests per minute (measured), so the scripts use 3 workers, back off on 429,
and run in `--serial` mode on retry. Secrets are read from `.env.local` through `--env-file`. Keys are never logged,
and the ledger stores no headers.

### 9.4 Order of work

1. **S0:** P0 probe + P1 masks + the proxy fit + the renderer skeleton. Rest-pose SSIM check for P (the layers
   simply recomposited, no warps) must be ≥ 0.99. That proves the cut is lossless.
2. **S1 (vertical slice, both arms):** face_base + eyes (blink, gaze) + brows + mouth with 5 rows (sil, PP, aa, O,
   E) + ±20° turn + breath. Judge round J1: pairwise P vs V per layer group (§11). Pick per group.
3. **S2 (full build of the pick):** all layers, the full mouth list, tongue, physics, the emotion presets, Hindi clips.
4. **J2, then polish L1-L3** (each round: judge failures → named layer → keyform, paint or shape edit → re-render →
   re-judge → owner sheet).
5. **B1 device bench**, then Integrate (§8).

Kill rule: if after L3 the owner says "not her" or "not premium", stop and report. Do not add another polish loop on
the same method; the 3D lesson was that unchanged-method rounds are waste (JUDGE-r4 fix #1).

---

## 10. Performance plan (60 fps on a cheap Android)

- **Budget per frame at 60 fps:**
  - CPU ≤ 3 ms p95: deformation (≤ 8k vertices), physics (≤ 20 nodes × 4 substeps) and the mouth solver;
  - GPU ≤ 6 ms p95: about 40 draws, overdraw ≤ 3.5× at 720×900 device px, one 2048² RGBA8 texture
    (16 MB GPU) plus the mouth atlas at 1024² (4 MB).
- **Blite:** a 1024² atlas, DPR 1, a 30 fps cap. This is the same art and the same face.
- **Bench B1:**
  1. Playwright Chromium with 6× CPU throttling + SwiftShader as a pessimistic proxy (work p95);
  2. **a real Mali-G52-class phone** via the owner's `?facerig=1` link and the existing stage stats events
     (fpsP50, intervalP95, workP95).

  Nothing is called "60 fps on a cheap Android" without measurement 2. Results go to `context/measurements.md`
  with n, method and date.
- **Download:** P ≤ 650 KB in total, lazy-loaded off the cold path. The plate paints at t = 0, and the puppet
  cross-fades in during her silence (the existing reveal rule).

---

## 11. Judge rubric

### 11.1 Panel

1. **My own eye** on full-size stills and clips. This is the primary input and is written up first.
2. **Blind Foundry vision panel:**
   - two families: `DEPLOY_BRAIN` (gpt-5.6-sol), plus a second vision family as deployed (for example Grok or Llama
     4), chosen on the sanity battery;
   - stimuli: REF = c-front or the matching c-* expression, and X = our render, with order randomised and X
     described only as "an animated version attempt";
   - sizes 128 px and 1024 px.
3. **The owner.** This is the gate.

### 11.2 Sanity battery (before any use)

- The panel must **reject** at least 90% of the 3D polish-r2 renders, the stylised-premium bake-off and the
  Rocketbox/GNM faces against c-front.
- The panel must **accept** at least 90% of ref-vs-ref pairs (c-front vs neutral, c-front vs refs/front-ortho).
- If it fails, change the judge, not the bar.

### 11.3 Stimuli per round

- **Stills:**
  - rest (vs c-front);
  - talking aa (vs c-talking);
  - listening (vs c-listening);
  - thinking (vs c-thinking);
  - delight (vs c-happy);
  - gentle concern, surprise, playful;
  - yaw −20, yaw +20 (vs q3-left/right as a soft reference);
  - a blink mid-frame;
  - the tongue visemes DD-tipUp, retroflex curl and TH.
- **Clips** (Playwright screencast at 60 fps → mp4, plus 8-frame strips for the vision models):
  1. a 10 s Hindi/Hinglish line, driven by forced-aligned visemes (`scripts/character/align.py` on Azure TTS
     audio);
  2. the same line driven by the live `LipDriver` from audio only (today's path);
  3. a 10 s idle;
  4. 10 s of listening with nods;
  5. the thinking transition;
  6. a head-turn sweep.

### 11.4 Atomic checklist (binary, one-line reason each, per stimulus × size × judge; nothing is averaged before the per-item report)

Identity and register:

- **I1** Same character as c-front, same art style.
- **I2** Premium: "a polished app character", not a paper cutout, not flat vector clip-art, not a cheap game.
- **I3** Not uncanny: no dead eyes, no stretched mouth, no swimming textures.

Surface:

- **S1** No visible seams, halos or cut edges between layers.
- **S2** Colours match c-front (skin, near-black hair, teal kurta, orange piping, gold studs, bindi).
- **S3** Soft Memoji shading is kept, not flattened.

Eyes:

- **E1** A catchlight on both eyes in every frame where the eyes are open.
- **E2** The lids wrap the eye; the lash line is a smooth tapered flick.
- **E3** The blink is clean (no sclera leaking at full close, no pop).
- **E4** The gaze reads as looking at the viewer when she should, and the aversion reads as deliberate.

Mouth:

- **M1** The lips have volume (a thin upper crescent and a fuller lower pillow).
- **M2** The teeth are one curved row inside the lips, never poking out.
- **M3** The tongue is visible and plausible on TH, the DD tip-up and the retroflex curl.
- **M4** Bilabials close (p, b, m): in clip 1, at least 80% of bilabial frames are closed, counted against the
  alignment.
- **M5** No popping or flicker between mouth shapes.

Turn:

- **T1** At ±20° it reads as a head turn, not a slide.
- **T2** No feature leaves the face, no tearing in the hair, the parting moves with the head.
- **T3** The far side compresses and the near ear grows.

Emotion and state:

- **X1** The intended emotion or state reads at 128 px. Forced choice among 8 labels; n ≥ 12 per label; confirmed
  by the held-out family (`teacher-presets-per-face`).
- **X2** Thinking reads as thinking (glance away, lips aside) without hands.

Motion (clips, judged by my eye; the model sees strips):

- **A1** Never static: in the idle clip, no 2 s window has zero visible motion.
- **A2** Hair and bun secondary motion lags naturally and never jitters.
- **A3** Lip-sync looks in time (no visible lead or lag at the bilabials).
- **A4** Nods and lean-in read as listening.

Performance (measured, not judged):

- **P1** B1 bench fps p50 ≥ 58 and work p95 within budget on the real device.
- **P2** Download within budget.

### 11.5 Bars

- **Rest SSIM vs c-front:** P ≥ 0.97, V ≥ 0.92 (proxy gate, run before any judging).
- **Advisory panel:**
  - I1-I3 ≥ 90% at both sizes;
  - every other item ≥ 75%;
  - X1 ≥ 70% per label;
  - mean 1-5 score ≥ 4.0 from my eye and ≥ 3.5 from the panel.
- **Pairwise P vs V per layer group** (hair, face, eyes, brows, mouth): the arm with ≥ 65% forced choice wins.
  Otherwise both go to the owner.
- **Owner gate:** a side-by-side sheet (c-front | rest render at full size and 128 px; 4 expression pairs; the turn
  strip) plus clips 1, 3 and 6. Nothing is called done without the owner's yes.

---

## 12. Licences (record in `art/character/LICENSES.md` as each is actually used)

| item | licence | role |
|---|---|---|
| Painted layers and mouths (gpt-image-2 / 2.5 edits of our concept) | our output under the Azure OpenAI terms | shipped (P) |
| Own WebGL2 renderer, rig, solver, physics | ours | shipped |
| PixiJS v8 (only if the fallback is taken) | MIT | shipped (conditional) |
| OpenCV (`seamlessClone`, ECC) | Apache-2.0 | build-time |
| numpy, pillow, scipy, `cma` | BSD-3 / MIT-CMU / BSD-3 / BSD-3 | build-time |
| Real-ESRGAN (code + x2 weights) | BSD-3 [U: verify that the weights' licence is commercial-OK before use] | build-time, conditional |
| sharp / libvips (atlas WebP) | Apache-2.0 / LGPL-2.1 | build-time |
| Playwright, ffmpeg | Apache-2.0 / LGPL | evidence only |
| Live2D, Spine, Rive editor, Character Animator, Cartoon Animator | proprietary | **technique reference only; nothing used** |
| Inochi2D (BSD-2), iki (MIT) | open | technique reference only; no code copied without recording it here |

---

## 13. Open items for the main loop (to log, not to block)

1. Log `supersedes`: `teacher-stylised-3d-inhouse` → `teacher-2d-puppet-c` (owner directive 2026-10-04), with a
   reversal condition: "3D returns only with a commissioned or bought face, or a new method that beats 3.5 blind".
2. Look id: is `c2d` a new look, or does it replace `teal` for Asha? The runtime-contract owners decide.
3. `Emotion` gains `surprised` and `playful` (Director tags + behaviour presets). This is a behaviour.ts change,
   outside this workstream.
4. Lily-style idle recombination in behaviour (RESEARCH §4.3), if A1 fails with physics and breath alone.
5. Confirm the `gpt-image-2.5-flare` deployment and quota (0/4 used on 2026-10-04). Until then, `taxila-image`
   (gpt-image-2) is the painter.

Sources: https://rive.app/blog/duolingo-s-ai-powered-video-call-brings-lily-to-life ;
https://docs.live2d.com/en/cubism-editor-tutorials/xy/ ; https://docs.live2d.com/en/cubism-editor-tutorials/deformer/ ;
https://ruolinzheng.gitbook.io/live2d-cubism-cookbook/modeling-and-rigging/deformer-hierarchy ;
https://github.com/Inochi2D/inochi2d ; https://docs.rs/bevy_inochi2d/latest/bevy_inochi2d/ ; https://github.com/zeikar/iki ;
https://helpx.adobe.com/il_en/adobe-character-animator/how-to/lip-sync-mouth-shapes.html ;
https://www.reallusion.com/cartoon-animator/360-head-creator.html ;
https://manual.reallusion.com/Cartoon-Animator/Content/Resources/4.0/03_Actor/Head_Types/25_Angle_Points_Settings_for_360_Head.htm ;
https://pixijs.com/8.x/guides/components/scene-objects/mesh ; RESEARCH.md §1.1-1.5 for Rive sizes and Live2D licence.
