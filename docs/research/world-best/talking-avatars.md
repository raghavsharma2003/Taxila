# World-best: real-time human-like talking teachers on web and low-end Android

**Date:** 2026-10-03 · **Area:** audio-driven facial animation, real-time Gaussian and mesh heads in the browser,
one-shot head reconstruction and parametric head models, avatar sources (MetaHuman, VRM, Ready Player Me, Live2D),
emotion, gaze and listening behaviour, and what holds 30 fps in a ₹10k Android WebView. · **Status:** research
extension. Nothing here has been run on a phone or shown to a child.

**What this file is NOT.** It does not repeat the avatar corpus Taxila already has, most of it from 2026-10-02/03:
`docs/research/avatar/AVATAR.md` (the v1 build spec), `audio-to-face-ml.md` (A2F-3D, LAM-A2E, the licence matrix,
the teacher/student distillation plan), `web-3d-talking-heads.md` (renderer stack, the Hindi lip bench),
`behaviour-expressiveness.md` (floor FSM, gaze/blink/nod rules, Greta), `performance-android.md` (tiers, governor),
`video-avatar-v2.md` (MuseTalk/Ditto economics), and `docs/design/teacher/{TEACHER-VISUAL,CHARACTER-PIPELINE,GPU-JOBS}.md`
plus the bake-off (`teacher-bakeoff-verdict`, `teacher-human-first-gpu`, `face3d-models`, `face3d-nc-deps-rejected`).
Read those first. This file adds **what changed in 2026 that those docs could not know or got wrong**, two things
measured this session by unpacking real artefacts, and a steal list mapped onto the shipped modules
(`src/avatar/*`, `scripts/character/*`, `scripts/character/bakeoff/merged/identity/*`).

**Tags.** **[V]** read in the primary source this session (repo, model card, paper abstract, package contents).
**[M]** measured this session (command and artefact named). **[S]** secondary (press, search summary, third-party
blog). **[U]** unverified, or a Taxila design inference that must be measured. **[T]** read in Taxila's own docs/code.

---

## 0. The answer on one screen

1. **The single biggest change since the corpus was written: Google released GNM Head (v3.0, July 2026) under
   Apache-2.0, code and weights** [V]. It is a scan-derived parametric head with skin, eyeballs, teeth and gums,
   and a tongue in one mesh: 17,821 vertices / 35,324 triangles, 253 identity and 383 regional expression
   components, 4 joints (neck, head, two eyes), pose correctives, mirror indices and UVs [M, `gnm_head.npz` unpacked].
   A MediaPipe↔GNM landmark correspondence already exists in Google's XR Blocks (Apache-2.0) [S]. This is the
   commercially clean FLAME replacement the corpus said did not exist ("the face-specific part stays MediaPipe plus
   our own wrap", `face3d-nc-deps-rejected`). **It should replace MakeHuman/MPFB as the identity base for the
   realistic teacher** (steal S1). MPFB's head is ≈ 3.9k vertices [T, CHARACTER-PIPELINE §5]; it is the reason
   every bake-off face "reads as one MakeHuman face with three finishes" [T, `teacher-bakeoff-verdict`].
2. **A LAM "Gaussian head" is a skinned morph-target mesh with one splat per vertex** [M]. The shipped sample
   avatar (`LAM_WebRender/asset/arkit/p2-1.zip`, 4.1 MB zipped) is 20,018 Gaussians bound 1:1 to a 20,018-vertex
   mesh that carries **51 ARKit morph targets** (no `tongueOut`) and a 262-joint skin, plus 12 baked body clips
   (hello / idle / speak ×5 / think ×3). So the "video-real" tier is not a different animation system: it is our
   `HeadRig.apply(bs, head, gaze, lean, breath)` contract with a splat material instead of `TaxilaSkin`. **Build a
   mesh-embedded splat appearance layer on our own (GNM-based) rig, not LAM's FLAME rig** (S3).
3. **Do not ship LAM's renderer or LAM's FLAME assets.** `gaussian-splat-renderer-for-lam@0.0.9-alpha.2` is a
   4.07 MB ES module (813 KB gzip [M]) that bundles its own three.js 0.173 (core, WebGPU and TSL builds), axios,
   jszip and mkkellogg's GaussianSplats3D (MIT) [M, source map]. We pin three 0.180 (`avatar-v1-stack`). LAM's
   FLAME licensing question (issue #111) is still unanswered as of today [V]. MeshLAM (CVPR 2026, one image →
   8k-vertex textured FLAME mesh in < 1 s) has no code or weights released [V]. Use Spark 2.x (MIT, World Labs,
   three.js-native, per-splat dynamic editing and skeletal animation, 500k-splat default mobile budget) as the
   splat renderer when the tier exists [V].
4. **Mobile Gaussian avatars got a lot faster in 2026, and every fast one is linear blendshapes**: Zhan et al.
   (CVPR 2026, pruned local blendshapes, WebGPU, "120 FPS at 2K on mobile") [V-abs]; GALA (Oct 2026, distils any
   neural Gaussian avatar into a block-local PCA basis plus a shallow coefficient predictor, "up to 60 fps on mobile
   devices", CPU animation cost cut "up to three orders of magnitude") [V-abs]; SqueezeMe (linear correctives,
   3 avatars at 72 FPS on Quest 3) [V-abs]. None has been measured on a Mali-G57 MC2; none has commercially usable
   weights. The method (bake to a linear basis) is the steal, the weights are not.
5. **MetaHuman's licence opened in June 2025** (any engine or DCC, free under $1M/yr revenue, sellable), **but it
   forbids using MetaHumans "to train or enhance" AI models** [S, cgchannel quoting Epic; Epic's licence page is
   behind a login] and a web export is ≈ 40 MB per character with Draco and 1024 px textures [V, metahuman-to-glb].
   That kills it for Taxila twice: the distilled lip student (`audio-to-face-ml.md` §3) trains on renders of the
   teacher, and the B tier budget is 1.5–2.2 MB. Use it as a **look reference only** (S12, anti-pattern A6).
6. **Listening behaviour now has commercially usable, CPU-real-time models**: Kyoto's MaAI (`pip install maai`,
   MIT code; VAP turn-taking, backchannel timing and **nod kinematics**: range, speed, repetitions, swing-up;
   English, Chinese and Japanese; RTF 0.57 with ONNX on CPU) [V]. The nod paper's n = 60 user study found
   model-timed nods beat stochastic nods on all seven metrics (p < .001) [V]. This upgrades
   `behaviour.ts`'s rule-based nod scheduler (S6). Hindi is not supported; it must be measured or fine-tuned.
7. **Products confirm the stylisation lesson at scale.** Duolingo's Lily (Rive, < 1 MB file, 8 head × 8 body idle
   layers = 64+ combinations, "pondering" head tilts during processing delay) is the best-loved real-time talking
   tutor face on phones [V, Rive case study]. Microsoft shipped Copilot Portraits on VASA-1 as **40 stylised** faces,
   not photoreal, with age limits and time limits [S]. Ready Player Me shut down on 2026-01-31 after Netflix bought
   it [S]: any third-party avatar service is a single point of failure, which validates the in-house rule.
8. **The path [D proposed]:** (a) GNM identity base + our MediaPipe wrap + Hunyuan3D shape prior → (b) 52 ARKit
   targets solved *through GNM's own expression space* + GNM teeth/tongue/eyes → (c) mesh tiers H/B+/B-lite exactly
   as today → (d) a per-character **splat skin layer** (S3) trained offline on the AWS build GPU from our own
   Blender/EEVEE renders and the portrait set, shipped only to phones that pass a measured E-GS1 probe → (e) the lip
   student distilled from A2F-3D (NVIDIA OML, unchanged) → (f) MaAI-timed listening nods. Every runtime piece is
   MIT/Apache/CC-BY and on-device; no paid AI at runtime, so the Azure-only rule is untouched.

---

## 1. Landscape: who is best at what (2024–2026)

### 1.1 Products (what each does better than anyone)

| product | what it does better than anyone | how | lesson for Taxila | tag |
|---|---|---|---|---|
| **Duolingo Video Call (Lily)** | a talking tutor face that people *like* on cheap phones, at < 1 MB | Rive state machine; separate pose and mouth state layers; 8 head × 8 body idle animations recombined (64+); "pondering" tilts and expressions fill processing pauses; animation inputs named for engineers; twice-weekly animator↔engineer hand-offs | the hard part is the **behaviour layer and the latency mask**, not the pixels. We already own both (`behaviour.ts`, THINKING aversion); the idle-recombination trick is cheap to copy (S8) | [V] https://rive.app/blog/duolingo-s-ai-powered-video-call-brings-lily-to-life ; [S] https://x.com/guidorosso/status/1904374664388018403 |
| **Microsoft Copilot Portraits** | real-time single-image talking faces at consumer scale | VASA-1 (512², ≈ 40 fps, server-side); 40 *stylised* portraits; age limit, time limits, AI indicator | even with VASA, Microsoft chose stylised, not photoreal, and fenced it. Our "realistic human" bet is unusual and must be panel-tested (A1) | [S] https://www.testingcatalog.com/microsoft-tests-40-3d-portraits-powered-by-vasa-1-for-copilot/ , https://windowsforum.com/threads/portraits-microsoft-copilots-voice-driven-avatars-powered-by-vasa-1.381552/ |
| **OpenAvatarChat + LAM (Alibaba Tongyi)** | the only open, end-to-end, one-photo → chatting 3D Gaussian head in a browser | LAM one-shot reconstruction (1.4 s), LAM-A2E audio→ARKit, WebGL splat renderer, LLM+ASR+TTS | the architecture is ours already (ARKit seam). Its assets and renderer are not shippable (§0.3) | [V] https://github.com/aigc3d/LAM |
| **Tavus Phoenix-4 / Simli / HeyGen / Azure TTS avatar** | photoreal live video | server GPU video synthesis | priced and rejected in `video-avatar-v2.md` / TEACHER-VISUAL §2 ($22/student-month for MuseTalk full lessons). Nothing in 2026 changed the arithmetic | [T] |
| **Epic MetaHuman (UE 5.6/5.7)** | the best rigged realistic human faces any team can make without a scan studio; audio-driven animation with mood overrides (Neutral/Happy/Sad/Fear/Disgust/Anger/Surprise) and head motion | DNA rig, Mesh-to-MetaHuman, Animator; realtime audio solver has no head motion | look reference for skin, eyes and mouth interior; licence and size rule it out as an asset (§0.5, A6) | [V] https://dev.epicgames.com/documentation/metahuman/audio-driven-animation ; [S] https://www.cgchannel.com/2025/06/you-can-now-sell-metahumans-or-use-them-in-unity-or-godot/ |
| **Ready Player Me** | was the interoperable web avatar standard | GLB + ARKit morphs | **shut down 2026-01-31** (Netflix acquisition, Dec 2025). Exported GLBs still work; the API does not | [S] https://variety.com/2025/digital/news/netflix-acquires-ready-player-me-games-avatar-creation-1236612915/ , https://avatarsdk.com/blog/2026/01/15/switch-from-ready-player-me-to-avatar-sdk-fast-familiar-production-ready/ |

### 1.2 Runtime face representations on the web

| representation | best example (2024–26) | runtime cost shape | licence | verdict for Taxila | tag |
|---|---|---|---|---|---|
| skinned morph mesh (ARKit-52) | our tiers; TalkingHead 1.7 (MIT); metahuman-to-glb | vertex-bound; 51–52 targets in a morph texture | ours / MIT | **stays the floor on every phone** | [T] |
| mesh-embedded Gaussians (one splat per vertex, or per triangle) | LAM sample: 20,018 splats on a 20,018-vertex morph mesh [M]; SplattingAvatar "30 FPS on iPhone 13" [S]; MGAvatar (mesh-bound Gaussians, 2026) [S] | **fill-rate and sort**: 20k semi-transparent quads, sorted per frame; morphs are the same as a mesh | renderer: Spark MIT [V]; methods: papers only | **the H+ "real skin" layer**, gated by E-GS1 | [M]/[V] |
| linear Gaussian blendshapes, distilled | Zhan et al. CVPR 2026 (WebGPU, 120 FPS 2K mobile) [V-abs]; GALA 2026 [V-abs]; AGORA (60 FPS on phones) [S]; 3D Gaussian Blendshapes (SIGGRAPH 2024) [S] | per-splat linear blend of a few dozen bases + sort | papers CC-BY (text); code/weights unclear or NC | method to copy for a v3 per-character bake | [V-abs] |
| neural portrait video (server) | VASA-1, Ditto, MuseTalk | server GPU per stream | mixed; priced | rejected for lessons [T] | [T] |
| 2.5D puppet | Live2D Cubism (fee above ¥10M/yr sales; ¥20M for "expandable" apps) [S]; **Inochi2D (BSD-2, 0.9 targets WASM/WebGL/WebGPU)** [S]; Rive | very cheap | Live2D: paid tier; Inochi2D: free | not the owner's direction (3D realistic). If the owner later chooses "cartoon", Inochi2D is the licence-clean Live2D; Rive was rejected on size [T] | [S] |
| VRM | three-vrm (MIT) | mesh | VRM spec open; VRoid assets rejected [T] | anime register; wrong for the realistic teacher | [T] |

### 1.3 Audio → face (only what is new since `audio-to-face-ml.md`)

| item | what is new | tag |
|---|---|---|
| NVIDIA Audio2Face-3D | a **multi-identity diffusion v3.2** TensorRT engine set is on NGC (updated 2026-03-07), NVIDIA Open Model License, "ready for commercial use"; Hugging Face still carries only v3.0 / v2.3 / v2.3.1 [M: HF API listing]. Audio2Emotion is still "Audio2Face use only". Claire's training data includes Mandarin; nothing Indic | [V] https://catalog.ngc.nvidia.com/orgs/nim/nvidia/models/audio2face_3d_model ; https://github.com/NVIDIA/Audio2Face-3D |
| LAM-A2E | `3DAIGC/LAM_audio2exp` remains the release; no 2026 update found | [M] |
| MetaHuman audio-driven animation | mood override with intensity; head motion offline only; Unreal-only and not trainable-on (licence) | [V] |
| EMOTE / EMOCA / inferno | still MPI non-commercial | [S] https://github.com/radekd91/inferno |
| UniTalker, FaceFormer, ARTalk | unchanged (weights encumbered) | [T] |

### 1.4 Heads from images and parametric models

| item | what it does best | licence (code / weights / deps) | verdict | tag |
|---|---|---|---|---|
| **GNM Head v3.0 (Google, 2026-07)** | scan-derived head with eyes, teeth, gums and tongue in one model; 253 identity / 383 expression comps (100 per eye region, 150 lower face, 32 tongue, 1 iris); 4 joints; 36 pose-corrective regressors; UVs; mirror map; NumPy/JAX/PyTorch/TF | **Apache-2.0, code and weights**; ear-landmark model in a third-party repo is research-only | **adopt as identity base (S1)**. Demographic coverage is "four broad groups" from ≈ 5,000 people; South Asian fit must be measured (E-GNM1) | [V] https://github.com/google/GNM , https://huggingface.co/google/gnm-v3 , https://arxiv.org/abs/2607.23687 ; [M] |
| FLAME 2023 Open | CC-BY-4.0 FLAME edition | commercial OK; all other FLAME editions NC | usable, but GNM is richer (teeth, tongue, eyes, more data) and has no ecosystem traps (LAM ships an unclear edition) | [V] https://flame.is.tue.mpg.de/ |
| LAM (SIGGRAPH 2025), FA-LAM (2026-07), PanoLAM (2025-09) | one image → animatable Gaussian head; FA-LAM adds symmetric attention regularisation and streaming 4D reconstruction | LAM Apache-2.0 but FLAME edition unclear (#111 open); FA-LAM code not stated | method reference; do not ship assets | [V] https://github.com/aigc3d/LAM/issues/111 , https://arxiv.org/abs/2607.20922 |
| MeshLAM (CVPR 2026) | one image → 8k-vertex textured mesh, < 1 s, GRU refinement | no code/weights | watch | [V] https://meshlam.github.io/ |
| Hunyuan3D 2.1 (+Omni, Part) | best open-weight shape+PBR | Tencent community licence (no EU/UK/KR; 1M MAU) | **keep as shape prior** (`face3d-models`); 3.0/3.1 are API-only, no weights | [T]/[S] https://triposr.org/blog/hunyuan3d-versions |
| TRELLIS / TRELLIS.2 | best open MIT image-to-3D | GLB export imports nvdiffrast (still NVIDIA Source Code Licence, non-commercial) [V] | rejection stands | [V] https://github.com/NVlabs/nvdiffrast |
| Arc2Avatar (CVPR 2025) | single image → expressive Gaussian avatar via Arc2Face ID guidance | code MIT, but builds on LucidDreamer's diff-gaussian-rasterization fork (Inria, NC) and Arc2Face (ArcFace/InsightFace identity features; InsightFace models NC) | **no** | [V] https://github.com/dimgerogiannis/Arc2Avatar ; [S] |
| FaceLift | single image → 360° head | Adobe Research licence | no (stands) | [T] |

### 1.5 Listening, gaze and turn-taking

| item | what it does best | licence | verdict | tag |
|---|---|---|---|---|
| **MaAI (Kyoto)** | real-time VAP turn-taking, backchannel timing, **nod timing + kinematics** on CPU; stereo (user+system) or user-only | code MIT; models per-card (CC-BY-4.0 stated for the nod paper's code and models; Mimi encoder CC-BY) | **adopt for nod timing (S6)** after a Hindi/Hinglish check | [V] https://github.com/MaAI-Kyoto/MaAI , https://arxiv.org/html/2607.12329 |
| Avatar Forcing (CVPR 2026) | interactive head generation reacting to user audio *and* motion, ≈ 500 ms latency, > 80% preference over baseline | paper | method only; we have no camera | [V-abs] https://arxiv.org/abs/2601.00664 |
| ARIG (ICCV 2025), EvolvingAvatar (2026) | frame-level autoregressive listen/speak head motion | papers | method only | [V-abs] https://arxiv.org/abs/2507.00472 |
| Meta Seamless Interaction | 4,000+ h dyadic, FACS AU tokens, face expression params, SMPL-H | **CC-BY-NC-4.0** (HF card) | do not train on it; a press summary saying "CC BY-SA" is wrong | [V] https://huggingface.co/datasets/facebook/seamless-interaction |
| TANDE (ICMI 2026) | n = 36 young adults: **non-verbal backchannels preferred** over verbal+non-verbal in emotional conversation | paper | supports Taxila's existing "no audio backchannels" rule for a different reason | [V-abs] https://arxiv.org/abs/2607.13357 |

### 1.6 Splat renderers for three.js

| renderer | notes | tag |
|---|---|---|
| **Spark 2.x (World Labs)** | MIT; v2.3.1; THREE.js-native; WebGL2; per-splat transform each frame, skeletal animation, a GPU shader graph ("dyno") for editing splats; PLY/SPZ/SPLAT/KSPLAT/SOG; LoD tree with a 500k-splat default mobile budget (1.5M desktop); sort metrics generated with splats and sorted in a worker | [V] https://github.com/sparkjsdev/spark , https://sparkjs.dev/docs/new-spark-renderer/ |
| GaussianSplats3D (mkkellogg) | MIT; what LAM's renderer forks; wasm sorters (SIMD / non-SIMD, shared / non-shared memory) | [M] (LAM source map) |

---

## 2. Corrections to Taxila's earlier docs (dated 2026-10-03)

| doc / entry | said | now | evidence |
|---|---|---|---|
| `face3d-nc-deps-rejected` | "none [face-specific model] passes commercial use, so the face-specific part stays MediaPipe plus our own wrap" | **GNM Head (Apache-2.0) passes**: a face-specific statistical model with a MediaPipe correspondence | [V]/[M] §1.4 |
| `docs/harvest/web-sites.md` ws-19 | GNM heads are "adult identities; not usable as child-tutor faces" | the tutor *is* an adult teacher; adult identities are exactly right. The note conflated child users with the face | [T] |
| `audio-to-face-ml.md` §2.1 LAM row | "Gaussian head ... v3 candidate"; WebRender is "lightweight" | it is a FLAME-subdivided 20k-vertex morph mesh carrying splats; the renderer bundles a second three.js (813 KB gz) | [M] |
| `audio-to-face-ml.md` (A2F row) | v3.0 is the latest diffusion model | multi-identity **v3.2** engines exist on NGC (2026-03-07); HF lags | [V] |
| `character-creation.md` (MetaHuman) | MetaHuman EULA confined to Unreal | since June 2025 usable in any engine/DCC; the binding constraint is now **no AI training** and size | [S] |
| `character-creation.md` / AVATAR §1.4 (Ready Player Me rejected) | rejected on licence/look | it no longer exists as a service (2026-01-31) | [S] |
| `audio-to-face-ml.md` §2.1 SqueezeMe "driven by keypoints" | — | unchanged; still not audio-driven and not released | [V-abs] |

---

## 3. STEAL LIST

Each item: what, where in Taxila, expected impact, how we measure it, licence/compliance. Ordered by
impact ÷ cost.

### S1. GNM Head as the identity base (replaces the MPFB head for the realistic teacher)
- **What.** Build each look's head from GNM: identity coefficients fitted to the look's portraits through the
  MediaPipe 478-landmark correspondence (XR Blocks), then the existing dense normal-shrink refinement toward the
  Hunyuan3D shape (`gpu_target.py`), then projected skin. GNM supplies eyes, teeth, gums and tongue in the same
  topology, which removes the MPFB proxy-teeth/tongue/lip-seal work that keeps failing gates (G6 tooth/tongue
  outside lips 3 → 9 [T, CHARACTER-PIPELINE]).
- **Where.** New `scripts/character/gnm/` (`fit.py`: landmark fit via the NumPy backend; `export.py`: GNM → glTF
  with UVs and the 4 joints, neck/head split preserved for `rig.js`'s Neck 35% / Head 65%); swap the base in
  `scripts/character/bakeoff/merged/identity/wrap.py` behind `TAXILA_BASE=gnm`; keep MPFB for hair/garment proxies
  until replaced; `art/character/LICENSES.md` gains GNM (Apache-2.0, NOTICE).
- **Impact.** The bake-off's ceiling was the base ("one MakeHuman face with three finishes"); GNM is learned from
  ≈ 5,000 scanned people with 4.6× MPFB's vertex count [M/T]. Expected: front NME and the held-out judge improve,
  and the owner's "specific human" eye test becomes passable [U].
- **Measure.** E-GNM1 (§5): front NME ≤ 1.2% and yaw-24 reprojection on the three looks vs the current merged
  build, n = 12 stills per look, held-out judge; plus owner eye test. Log to `measurements.md`.
- **Licence.** Apache-2.0 code and weights [V]. Do **not** use the third-party ear-landmark model (research-only)
  [S]. GNM's demographic coverage is coarse: E-GNM1 must include South Asian portraits of every Monk band we ship.

### S2. Solve the 52 ARKit keys *through* GNM's expression space
- **What.** GNM's 383 expression components are regional PCA bases, not FACS-named [M]. Fit one GNM expression
  vector per ARKit key (52) by least squares against (a) our existing per-key target shapes transferred to GNM by
  surface correspondence, regularised to stay inside GNM's space; then bake the 52 as morph targets (plus the three
  Hindi tongue keys from GNM's 32 tongue components). Correctives (12 keys) are re-solved the same way.
- **Where.** `scripts/character/blender/keys.py` gains a GNM path; `scripts/character/emotion-check.mjs` and the
  preset re-score (`teacher-presets-per-face`) run on the new face.
- **Impact.** Expressions become anatomically plausible combinations a real face can make (the space was learned
  from scans), which is exactly what "delighted is a dark open grimace with gappy lower teeth" lacked [T]. Tongue
  shapes for retroflex /ʈ ɖ ɳ/ come from a measured tongue model rather than hand sculpts.
- **Measure.** The existing emotion judge at n = 12 per state (target ≥ 70% on 8 of 9 stills, held-out judge); G6
  intra-oral gate; Hindi closure rate on the lip bench (`avatar-lipsync-bench`), unchanged or better.
- **Licence.** Apache-2.0. Morph memory at H: 17,821 × 52 × 16 B ≈ 14.8 MB (×2 three's JS copy ≈ 29.7 MB) [M
  arithmetic], inside the 45 MB H budget; B+ needs a decimated GNM (≤ 18k tris) with targets transferred.

### S3. Mesh-embedded splat skin, one splat per vertex, as an H+ tier (LAM's structure on our rig)
- **What.** Copy LAM's measured asset structure, not its assets: every vertex of the (subdivided) head carries one
  Gaussian whose centre follows the morphed/skinned vertex; per-splat colour, opacity, scale, rotation are learned
  offline per character. The teacher's existing `FaceFrame` → compositor → `HeadRig.apply` path is unchanged; the
  renderer swaps `TaxilaSkin` for a splat pass (Spark `SplatMesh` driven by a dyno that reads the morphed positions,
  or our own instanced quad shader with a wasm sort ported from GaussianSplats3D, both MIT). Eyes, teeth and hair
  stay mesh (they are what splat heads render worst).
- **Where.** `src/avatar/three/splat.ts` (new), a `tier.ts` entry `Hs` above `H`; training job in
  `docs/design/teacher/GPU-JOBS.md` §6 (AWS build GPU per `aws-build-gpu`): optimise splat attributes against
  (a) the portrait set and (b) our own multi-view Blender/EEVEE renders of the H rig in all 52 keys, using a
  **commercially licensed rasteriser** (nerfstudio `gsplat`, Apache-2.0 [V: LICENSE read 2026-10-03]; check that no CUDA submodule it pulls carries another licence) — never the Inria
  diff-gaussian-rasterization.
- **Impact.** Skin micro-detail, soft hair edge and view-consistent subsurface look that the mesh shader cannot
  reach; this is the closest commercially clean route to "crazy-real" without video [U].
- **Measure.** E-GS1 (§5) on the reference phones; M-AV-1 panel (realism × warmth × weirdness) S3h-mesh vs
  S3h-splat; file size (target ≤ 3 MB per character with SPZ/SOG-style quantisation; LAM's raw float PLY is 1.36 MB
  for 20k splats [M]).
- **Licence.** Splat renderer MIT; training rasteriser must be Apache/MIT; training data is our own renders and
  owner-supplied portraits, so no third-party data rights.

### S4. Distil the H+ splat layer to a linear basis (GALA / Zhan et al. / SqueezeMe pattern)
- **What.** If splat attributes need to change with expression (wrinkles, lip colour on stretch), never run a neural
  decoder at runtime: bake per-splat colour/scale deltas onto the same 52 ARKit weights as a linear basis (block-local
  PCA, pruned), so the runtime cost is one more weighted sum, like morphs.
- **Where.** The S3 training job; `splat.ts` reads the deltas as a second morph texture.
- **Impact.** Keeps H+ cost shape identical to a morph mesh; the 2026 papers show this is what makes 60–120 fps
  possible on phones [V-abs].
- **Measure.** ms/frame with and without deltas on the E-GS1 phones; the emotion judge on wrinkle-dependent states
  (concerned, delighted).
- **Licence.** Method only (papers); our implementation.

### S5. Upgrade the offline lip/face teacher to A2F-3D multi v3.2, with emotion as an input, never Audio2Emotion
- **What.** For the distilled student (`audio-to-face-ml.md` §3) and for cinematic moments (TEACHER-VISUAL §13), use
  the v3.2 multi-identity engines when an A100/L4 engine exists for the build GPU; drive emotion from the Director's
  known intent vector, which A2F accepts as input.
- **Where.** `GPU-JOBS.md` job list; the `FaceFrame` training corpus builder.
- **Impact.** Better teacher labels → better student; the Hindi closure-rate bench decides.
- **Measure.** E-1 from `audio-to-face-ml.md` (closure ≥ 90% on /p b m pʰ bʰ/), v3.0 vs v3.2.
- **Licence.** NVIDIA Open Model License (commercial, distillation allowed per the corpus [T]); engines are
  GPU-specific; Audio2Emotion stays out. Build-time only, so the Azure-only runtime rule is untouched.

### S6. Model-timed listening nods (MaAI VAP + nod kinematics) replacing random nod draws
- **What.** Run MaAI's user-only (single-channel) nod/backchannel model on the child's mic stream; it emits nod
  onset probability plus range, speed, repetitions (1/2/3+) and swing-up. Feed those into `behaviour.ts`'s nod
  scheduler, which keeps its invariants (nods only in open turns, verdict-neutral, expressive budget).
- **Where.** Client: `src/avatar/behaviour.ts` gains a `nodSource` seam. Runtime choice: (a) ONNX in a worker on the
  phone if the model is small enough, or (b) server-side next to `server/voice/features.js` (CPU, Azure Container
  Apps) sending a nod event over the existing data channel. Measured RTF 0.57 on CPU [V] makes (b) safe.
- **Impact.** The paper's n = 60 study: model timing beat stochastic timing on all seven perception metrics
  (p < .001) [V]. Nods are Taxila's main listening signal (audio backchannels are rejected), so timing quality is
  the listening quality.
- **Measure.** Offline: F1 of nod timing vs. human-annotated nod points on 30 min of Taxila child-turn audio (Hindi,
  Hinglish), against the current scheduler. Online: M-AV listening panel. Note the published F1 is only 52 [V].
- **Licence.** MIT code; check each HF model card (the nod paper states CC-BY-4.0). No Hindi model: if Japanese/
  English weights transfer poorly, fine-tune on our own annotated audio (consented). The child's audio stays on our
  infrastructure; no third-party API.

### S7. VAP turn-taking as a second signal for the floor FSM (yield / hold)
- **What.** The same MaAI VAP head predicts "who speaks next" every frame; use it as a soft input to THINKING vs
  YOUR-TURN in the floor FSM so she stops "waiting" visibly just before the child resumes.
- **Where.** `src/avatar/behaviour.ts` floor FSM; server VAD stays authoritative for audio (`avatar-m0-tap-chain`).
- **Impact.** Fewer "stare-down" moments and fewer false yields; the face never changes the audio path.
- **Measure.** Count of floor flips that a rater marks as wrong, on 50 recorded child turns, before/after.
- **Licence.** As S6.

### S8. Duolingo-style idle recombination and named animation inputs
- **What.** Split idle head motion and idle torso/breath motion into 8 + 8 short clips with independent random
  phase, giving 64+ combinations, so a 45-minute lesson never shows a repeating loop; give every behaviour input an
  engineer-readable name and a single place it is set (our compositor already is that place).
- **Where.** `src/avatar/behaviour.ts` (idle scheduler), `scripts/character/viewer/presets.js`.
- **Impact.** Removes loop-spotting, which children are fast at [U]; cost ≈ 0.
- **Measure.** Autocorrelation of head-pose over 45 min of sim (`behaviour-proto/sim.mjs`) has no peak above a
  threshold at any lag < 10 min.
- **Licence.** Idea only.

### S9. Use Spark's LoD splat budget model for the governor, not a new one
- **What.** If S3 ships, express the H+ budget as splats-on-screen and let the existing governor (`tier.ts`) scale
  it (`lodSplatScale`-style) before demoting to H mesh.
- **Where.** `src/avatar/tier.ts`.
- **Impact.** One degradation path instead of a cliff.
- **Measure.** E-GS1 governor trace: no oscillation, demotion within 2 s of sustained long frames.
- **Licence.** MIT.

### S10. Keep MediaPipe as the one face measurement tool, and add the GNM correspondence
- **What.** Taxila already ray-casts MediaPipe landmarks onto the reconstruction (`face3d-models`); with GNM, the
  XR Blocks MediaPipe↔GNM correspondence and its depth-bias reference cloud replace our own landmark-to-surface
  mapping for the fit.
- **Where.** `scripts/character/gnm/fit.py`; `align.py`.
- **Impact.** Removes a custom, unvalidated mapping; the reference cloud "absorbs MediaPipe's depth bias" [S].
- **Measure.** Held-out reprojection NME, same as the `gpu-identity-target-flag` reversal test.
- **Licence.** XR Blocks repo LICENSE is Apache-2.0 [V: read 2026-10-03]; confirm the correspondence file itself carries no separate notice before copying.

### S11. MetaHuman as a look-dev reference board only
- **What.** Render a few MetaHuman faces under our stage light rig as a visual target for skin, eye wetness, mouth
  interior and teeth in G9/H13 look-dev. Never export a MetaHuman into Taxila, never put a MetaHuman render in any
  training set.
- **Where.** `docs/design/teacher/` look-dev notes.
- **Impact.** A concrete bar for "crazy real" that the owner can compare against.
- **Measure.** Owner A/B: our H vs the reference, same light, same framing.
- **Licence.** UE EULA; the no-AI-training clause makes this a human-eyes-only reference [S].

### S12. Mood-override shape for offline moments (from MetaHuman Animator)
- **What.** For cinematic moments, author emotion as (mood, intensity, sub-mood) overrides on top of the audio solve,
  exactly as MetaHuman Animator does; our two-layer state machine already separates floor × affect, so this is a
  naming change in the offline renderer's inputs.
- **Where.** TEACHER-VISUAL §13 tooling.
- **Impact.** Consistent emotion across moments; easy owner review.
- **Measure.** Emotion judge on moments clips.
- **Licence.** Idea only.

---

## 4. Anti-patterns others learned the hard way

| id | anti-pattern | who learned it | what to do instead | tag |
|---|---|---|---|---|
| A1 | **Assuming photoreal is what people want from a talking AI face** | Microsoft shipped VASA-1 Portraits as 40 stylised faces with age and time limits; Duolingo's most-loved tutor face is a < 1 MB 2D puppet | keep realism a measured choice per band (M-AV-1), which the owner directive already makes conditional (`teacher-human-first-gpu`) | [S]/[V] |
| A2 | **Building on a third-party avatar service** | every Ready Player Me integrator on 2026-01-31 | in-house assets in open formats only (glTF, PLY/SPZ); no runtime calls to an avatar vendor | [S] |
| A3 | **Shipping a research demo renderer** | LAM's npm renderer: second three.js, axios, jszip, 813 KB gz, alpha version | port the shader idea into our stage; one three.js per app | [M] |
| A4 | **Trusting "Apache-2.0" on a repo that ships third-party model files** | LAM (FLAME files with MPG notices, edition unclear, issue unanswered since 2026-09-15); Arc2Avatar (MIT code over NC rasteriser and NC identity features); TRELLIS (MIT over nvdiffrast) | licence-check every *imported* file and weight, not the repo badge; extend the CI hash denylist (AVATAR §1.5) to Inria `diff-gaussian-rasterization`, `nvdiffrast`, InsightFace `antelopev2`, FLAME pre-2023-Open | [V] |
| A5 | **Training on dyadic datasets because the press says they are open** | Seamless Interaction is CC-BY-NC-4.0 on its own card; a press summary said CC-BY-SA | read the dataset card itself | [V] |
| A6 | **Using MetaHumans anywhere near a training loop** | Epic's licence forbids MetaHumans to "train or enhance" AI models | MetaHuman stays a human-eyes reference (S11) | [S] |
| A7 | **Running a neural decoder per frame on a phone** | SqueezeMe, GALA, Zhan et al. all had to distil to linear bases to get mobile frame rates | bake to morph-like linear bases (S4); the corpus's "no wav2vec on device" rule is the same law | [V-abs] |
| A8 | **Random backchannel / nod timing** | nod study: stochastic timing lost on all 7 metrics (n = 60) | model-timed nods (S6) inside the existing invariants | [V] |
| A9 | **Verbal backchannels as warmth** | TANDE (n = 36): non-verbal preferred | keep "no audio backchannels" (already a Taxila rejection, now with a second reason) | [V-abs] |
| A10 | **Mapping ARKit names onto a PCA expression model by eye** | GNM's expression comps are regional PCA, not FACS [M]; MPFB face units needed calibration gains 1.2–1.6 [T] | solve each ARKit key in the model's space (S2) and re-score presets per face | [M]/[T] |
| A11 | **Splat heads for eyes, teeth and hair** | the LAM sample keeps everything as one splat cloud on FLAME; mouth interior and eyes are where one-shot splat heads look worst [U] | hybrid: splat skin, mesh eyes/teeth/tongue/hair cards (S3) | [U] |

---

## 5. Experiments that gate the steal list (log each with n, method, date)

| id | question | method | pass bar |
|---|---|---|---|
| **E-GNM1** | Does a GNM base beat MPFB for our looks? | Fit GNM to the teal/slate/plum portrait sets (S1, S10); run the merged build with `TAXILA_BASE=gnm`; front NME, yaw-24 reprojection, held-out judge, n = 12 stills per look; include ≥ 3 South Asian portraits per Monk band | NME ≤ 1.2%, ≥ 70% on 8 of 9 stills, owner eye test prefers GNM |
| **E-GNM2** | Do ARKit keys solved in GNM space read better? | S2 on teal; emotion judge per state, n = 12; G6 intra-oral gate; Hindi closure bench | judge ≥ v3 baseline (85%); G6 no increase; closure unchanged or better |
| **E-GS1** | Can a 20k-splat head hold 30 fps in the WebView on ₹10k phones? | The LAM sample (`p2-1.zip`, research use in the lab only, never shipped) and a 20k-splat Spark head on the 3 reference phones (Mali-G57 MC2, Mali-G52, Unisoc) + 2 ₹20k phones; canvas 0.2 / 0.35 / 0.5 Mpx; 5 min sustained; thermal and battery logged | ≥ 30 fps p50 and ≤ 5% frames > 50 ms for 5 min at ≥ 0.2 Mpx; else H+ is ₹20k+ only |
| **E-GS2** | Does splat skin beat mesh skin to children's and parents' eyes? | M-AV-1 panel, S3h-mesh vs S3h-splat, same rig and audio | splat wins realism without losing warmth or adding weirdness |
| **E-NOD1** | Does MaAI's nod timing transfer to Hindi/Hinglish child speech? | 30 min of consented child-turn audio, 2 annotators mark nod-able points; F1 MaAI vs current scheduler | MaAI F1 ≥ current + 0.10; otherwise fine-tune |
| **E-A2F32** | Is v3.2 a better teacher than v3.0 on Hinglish? | `audio-to-face-ml.md` E-1 protocol, both versions | closure ≥ 90% and rater preference ≥ 60% |

---

## 6. Recommended path to a "crazy-real", expressive teacher (in-house, commercially clean)

1. **Now (no GPU needed):** S8 idle recombination; S2 solver prototyped on CPU (GNM NumPy backend runs here; the
   weights are 53 MB [M]); S1 fit on CPU (landmark least squares). E-GNM1/2 decide the base.
2. **With the AWS build GPU:** Hunyuan3D prior (already pinned) → GNM fit → wrap → projected, de-lit skin; A2F v3.2
   labels for the student (S5); cinematic moments rendered in Blender from the same rig.
3. **H+ splat skin (S3/S4)** only after E-GS1 says which phones can hold it; ship as an opt-in "HD teacher" tier
   that the governor can always drop to H mesh.
4. **Listening:** S6/S7 server-side on CPU next to `server/voice/features.js`, events over the data channel.
5. **Never:** live video for lessons (priced out), MetaHuman assets, FLAME pre-Open assets, Inria/nvdiffrast/
   InsightFace in any shipped or training path, third-party avatar services.

---

## Sources

- GNM: https://github.com/google/GNM ; https://huggingface.co/google/gnm-v3 (weights, `v3_0/gnm_head.npz`, sha256
  61d78bbf…) ; https://arxiv.org/abs/2607.23687 ; https://www.cgchannel.com/2026/07/google-open-sources-gnm-head-its-parametric-human-head-model/ [S] ;
  https://github.com/shameem4/headSize-gnm [S] ; https://xrblocks.github.io/docs/samples/GNM-Head/
- LAM: https://github.com/aigc3d/LAM ; https://github.com/aigc3d/LAM/issues/111 ; https://github.com/aigc3d/LAM_WebRender ;
  npm `gaussian-splat-renderer-for-lam@0.0.9-alpha.2` ; https://arxiv.org/abs/2502.17796 ; FA-LAM https://arxiv.org/abs/2607.20922 ;
  MeshLAM https://meshlam.github.io/ , https://arxiv.org/abs/2604.22865
- Mobile Gaussian avatars: https://arxiv.org/abs/2605.01854 , https://gapszju.github.io/webavatar/ ; GALA https://arxiv.org/abs/2610.02207 ;
  SqueezeMe https://arxiv.org/abs/2412.15171 ; SplattingAvatar https://arxiv.org/abs/2403.05087 ; Mobile-GS https://xiaobiaodu.github.io/mobile-gs-project/ [S]
- Spark: https://github.com/sparkjsdev/spark ; https://sparkjs.dev/docs/new-spark-renderer/ ; https://www.worldlabs.ai/blog/spark-2.0
- FLAME: https://flame.is.tue.mpg.de/ ; nvdiffrast: https://github.com/NVlabs/nvdiffrast
- Audio2Face-3D: https://github.com/NVIDIA/Audio2Face-3D ; https://catalog.ngc.nvidia.com/orgs/nim/nvidia/models/audio2face_3d_model ;
  https://developer.nvidia.com/blog/nvidia-open-sources-audio2face-animation-model/
- MetaHuman: https://www.cgchannel.com/2025/06/you-can-now-sell-metahumans-or-use-them-in-unity-or-godot/ [S] ;
  https://www.metahuman.com/en-US/license (login-walled, not read) ; https://dev.epicgames.com/documentation/metahuman/audio-driven-animation ;
  https://github.com/smorchj/metahuman-to-glb
- Ready Player Me: https://variety.com/2025/digital/news/netflix-acquires-ready-player-me-games-avatar-creation-1236612915/ [S] ;
  https://avatarsdk.com/blog/2026/01/15/switch-from-ready-player-me-to-avatar-sdk-fast-familiar-production-ready/ [S]
- Duolingo/Rive: https://rive.app/blog/duolingo-s-ai-powered-video-call-brings-lily-to-life
- Copilot Portraits: https://www.testingcatalog.com/microsoft-tests-40-3d-portraits-powered-by-vasa-1-for-copilot/ [S]
- Listening: https://github.com/MaAI-Kyoto/MaAI ; https://arxiv.org/html/2607.12329 ; https://arxiv.org/pdf/2507.23298 ;
  https://arxiv.org/abs/2601.00664 ; https://arxiv.org/abs/2507.00472 ; https://arxiv.org/abs/2609.35616 ; https://arxiv.org/abs/2607.13357 ;
  https://huggingface.co/datasets/facebook/seamless-interaction
- Heads/3D: https://github.com/dimgerogiannis/Arc2Avatar ; https://triposr.org/blog/hunyuan3d-versions [S]
- 2.5D: https://www.live2d.com/en/sdk/license/ [S] ; https://nlnet.nl/project/Inochi2D/ [S]
- EMOTE: https://github.com/radekd91/inferno [S]

**Measured this session [M]** (scratchpad, not committed): unpacked `gaussian-splat-renderer-for-lam-0.0.9-alpha.2.tgz`
(module 4,067,930 B, gzip 812,836 B, 120 sources incl. three@0.173.0 core/webgpu/tsl, axios 1.13.2, jszip 3.10.1);
`LAM_WebRender/asset/arkit/p2-1.zip` (offset.ply 20,018 vertices, 17 float props; skin.glb 20,018 vertices, 51 morph
targets, 262 joints; animation.glb 12 clips); `google/gnm-v3 v3_0/gnm_head.npz` (17,821 vertices, 35,324 triangles,
253 identity, 383 expression comps, 4 joints, 36 pose correctives, 46 vertex groups, 6 mesh components);
Hugging Face model listing for `nvidia/Audio2Face*` (v3.0, v2.3, v2.3.1 only).
