# Stylised animated teacher: world-best survey and recommendation

**Date:** 2026-10-04 · **Trigger:** the owner rejected realistic generated human faces (GNM "scary and cheap",
Rocketbox "2010 game") and asked for a fully polished **stylised** human teacher (anime-human, Pixar-ish 3D, or
Bitmoji/Memoji-like) that speaks Hindi/English/Hinglish, listens, thinks and emotes, runs smoothly on cheap Indian
Android phones, and that the child names.

**Builds on (not repeated here):** `docs/research/world-best/talking-avatars.md` (2026-10-03: audio-to-face, Gaussian
heads, MaAI nods, Duolingo/Copilot, Audio2Face licence), `docs/research/avatar/AVATAR.md` (tiers, behaviour spec),
`docs/research/avatar/web-3d-talking-heads.md` (lip-sync bench, morph memory), `docs/design/teacher/bakeoff/VERDICT.md`
(why our own stylised-premium face was rejected), `CHARACTER-PIPELINE.md` §4 (the runtime contract this must keep).

**Evidence tags:** [V] read at the primary source today · [S] secondary source (blog, press, review site) · [M] measured
in this repo · [U] my inference or estimate, unverified. Concept art for four directions is in `concepts/`, compared
in `concepts/COMPARE.png` (see §5).

---

## 0. One screen

1. **The products people love are all stylised, and their quality comes from human animators.** Duolingo's Lily
   (Rive, < 1 MB, 20+ mouths per character, 8 head x 8 body idles recombined) [V], Tolan (an alien designed with an
   Apple-Design-Award animator and two outside animation studios) [S], Apple Memoji (ARKit-52 driven stylised heads)
   [V-concept]. Microsoft shipped Copilot Portraits as stylised, not photoreal [S, prior sweep]. Replika replaced its
   3D avatars with 2D animated ones in May 2026 [S], and xAI retired its 3D anime Grok companions on 2026-09-01 [S]:
   3D for its own sake is not what wins.
2. **Recommendation: a stylised 3D GLB (family-film / Memoji-adjacent, directions b or c) with ARKit-52 + 15 visemes +
   3 tongue keys, on the HeadRig/tier/behaviour stack we already own.** It keeps every seam (`HeadRig`, `behaviour.ts`,
   `lip.ts`, tiers, the D plate rendered from the same mesh), turns head 3/4 for free, and a stylised mesh is *cheaper*
   to render than the realistic one (solid sculpted hair instead of alpha cards removes the Mali Early-Z trap; no SSS,
   wrinkle maps or pore detail). Runner-up and the right choice **if the owner picks the flat look (d)**: a 2D **Rive**
   puppet, Duolingo's exact route (222 KB gz runtime, MIT).
3. **Production route: commission the face; let the agent build everything around it.** An AI agent can generate concept
   art, write the export/compression/tier pipeline, transfer and validate keys, write shaders and the whole behaviour
   layer. It **cannot sculpt an appealing stylised face or author polished expression shapes / Rive mouths** — our own
   stylised-premium bake-off scored 1.5/5 for wow factor and was rejected as "a doll, not a cartoon" [M, VERDICT.md].
   Budget **USD 4-12k** for a senior freelance character artist (sculpt, retopo, 52+15+3 shapes, 1-3 outfits, source
   files, full IP assignment) [U, ranges in §3]; **USD 15-40k** for a small studio with an art director [U].
   **This conflicts with a standing owner rule**: decisions.md (2026-10-03) says "the in-house rule stands: no
   contracted artist", and the owner's own reversal path after GNM was "go stylised (feature-animation look) built from
   a professional stylised base". So the owner must choose (§3.1): **lift the rule for the face only** (my
   recommendation), or **buy a professional stylised base** with ARKit keys and adapt it in-house (cheaper, faster,
   less specific, and licence terms on AI training must be checked per seller).
4. **Licence blockers:** Live2D needs a paid publication licence once annual sales exceed ¥10M (≈ USD 67k), with fees
   such as ¥50k-300k initial + ¥20k-100k/month + 5% revenue share on the running-royalty plan, and a separate contract
   for any "expandable application such as avatar systems" regardless of size [V]. VRoid models are commercial-OK but
   VRoid forbids apps that generate or output avatars from VRoid parts without a separate pixiv licence [S, prior sweep
   V]. TalkingHead's demo avatar is CC BY-NC [V, prior]. Ready Player Me is gone (2026-01-31) [S]. Audio2Emotion is
   "Audio2Face use only" [V]. **The Azure-only directive** rules out any vendor avatar API (D-ID, HeyGen, AvatarFX,
   mascot.bot): everything must be our asset + our runtime.
5. **Behaviour is the product.** Lily's appeal is mostly behaviour: lean-in when intrigued, pondering tilts that make
   processing delays read as thought, nods for approval [V]. We already have the behaviour engine (`src/avatar/behaviour.ts`);
   stylisation needs a **cartoon-amplitude pass** (bigger, snappier, with anticipation and overshoot) and secondary
   motion, not a rewrite (§4).

---

## 1. The survey

Columns: quality ceiling · low-end mobile · licence for commercial web use · can we author it ourselves · cost.

### 1.1 Duolingo Video Call (Lily) — Rive state machines

- **What it is.** Lily is a single Rive file under 1 MB. One state machine drives mouth positions, facial
  expressions, camera moves and everything else. Head and body are nested artboards. 8 head and 8 body idle
  animations recombine into 64+ neutral variations [V]. 20+ mouth shapes per character, designed to fit each
  character's personality; believability "when animated" mattered more than any single frame [V, Duolingo blog via
  `character-creation.md`].
- **Listening/thinking.** Leaning in when intrigued; head tilts and pondering expressions during processing delays;
  furrowed brows when thinking; squints or head shakes when confused; raised brows and nods for approval. Processing
  delays are made to *look intentional* [V].
- **Process.** Bi-weekly animator-engineer syncs; a weekly "Riv Deliv" of updated files; they hired creative
  technologists who straddle animation and code [V].
- **Steal:** (1) idle recombination (8 x 8) instead of long baked idles; (2) mouths designed per character, not
  generic; (3) every latency gap is filled with a *thinking* behaviour; (4) a named-input contract between animator and
  engineer, delivered weekly.
- Quality ceiling: very high for 2D. Low-end mobile: excellent (vector, < 1 MB). Licence: runtime MIT; editor is a
  paid seat (Cadet USD 17/seat/month with runtime export) [S]. Self-authoring: **no** for the art (needs a Rive
  animator); yes for wiring. Cost: [U] a Lily-scale character rig with 20+ mouths, emotions and idles is weeks of a
  senior Rive animator, roughly USD 5-20k, plus ongoing.
- Sources: https://rive.app/blog/duolingo-s-ai-powered-video-call-brings-lily-to-life ;
  https://x.com/guidorosso/status/1904374664388018403

### 1.2 Rive runtime and viseme lip sync

- **How lip sync is done.** Mouth timelines per viseme on their own state-machine layer, selected by one number input
  (`visemeId`/`phoneme`), blended with eased transitions so the mouth does not snap; driven from TTS viseme events or
  audio analysis against `audio.currentTime` [S, several tutorials]. This maps directly onto our 15 Oculus visemes
  (fold to ~10 authored mouths) and Azure `hi-IN` viseme IDs (available for Hindi; blend shapes are not) [V, prior].
- **Runtime size (Jan 2026, brotli-9):** `@rive-app/canvas-lite` 222 KB, `canvas` 567 KB, `webgl2` 648 KB [V]. The
  earlier AVATAR.md rejection ("368-821 KB gz of wasm") is now only half true: canvas-lite is 222 KB. Lite drops some
  dependencies (check that feathering/vector features Lily-style art uses are supported in lite) [U].
- **Steal:** layer separation (mouth layer never fights the emotion layer), and drive-by-number from our existing
  `lip.ts` output.
- Sources: https://rive.app/docs/runtimes/runtime-sizes ; https://www.npmjs.com/package/@rive-app/canvas-lite ;
  https://dev.to/uianimation/how-to-build-real-time-ai-lip-sync-using-rive-state-machine-viseme-data-26o7

### 1.3 Apple Memoji / Animoji

- **What it is.** Stylised 3D heads driven by the ARKit face-tracking coefficients: 52 blendshapes, floats in [0,1]
  (brows, lids, jaw, lips, cheeks, tongue-out) plus eye and head transforms [V-concept, ARKit docs as quoted]. Apple
  never published the rig; the industry convention is that any head carrying the ARKit-52 set can be driven the same
  way.
- **What makes it good:** huge, clean, readable shapes; no pores, no wrinkles; very large eyes with strong specular;
  generous mouth interior; extremely smooth 60 fps secondary motion (hair, ears). The face is designed so every ARKit
  key reads at thumbnail size.
- **Steal:** design the face for the 52 keys (shape language that reads at 120 px), not the other way round; the
  Memoji amplitude register (squash on blinks, big brow travel). Licence: the look is Apple's; we take the principles,
  not the assets. Low-end mobile: Memoji-class meshes are ~10-20k tris [U] and fine on our B tiers.

### 1.4 Snapchat Bitmoji 3D

- **What it is.** Millions of renders per minute across chat, stories and AR; Snap optimised server rendering on AWS
  G6/L4 [S]. 2023 redesign: more realistic proportions, hair texture and face shading to allow "bolder smiles and more
  nuanced emotion" [S]. Research arm: **Snapmoji** (2025) turns a selfie into a Bitmoji-styled Gaussian-splat avatar in
  0.9 s, animating at 30-40 fps on mobile in a 3 MB model [V-abs].
- **Steal:** Bitmoji's register (friendly, slightly realistic proportions, cartoon materials) is the safest "adult
  teacher, not a toy" point between our directions (b) and (c). Snapmoji confirms stylised splats can run on phones,
  but there is no code and it would be another research project [U].
- Sources: https://arxiv.org/abs/2503.11978 ; https://www.fastcompany.com/90924345/gen-z-snapchat-redesigned-bitmoji ;
  https://aws.amazon.com/blogs/media/snap-optimizes-bitmoji-rendering-with-nvidia-l4-and-amazon-g6-instances

### 1.5 Live2D Cubism and VTuber tooling

- **Quality ceiling:** the best 2D anime puppets in the world (VTubers), with parallax head turns of about +-30 deg from
  layered art. Low-end mobile: good (2D meshes), Web SDK exists. **Authoring:** needs both an illustrator (layer-split
  PSD) and a Live2D rigger; an agent cannot do either to a polished standard. Commissions [U]: USD 1-6k for a quality
  VTuber model + rig.
- **Licence [V]:** individuals and businesses with < ¥10M annual sales need no contract; above that a Publication
  (SDK Release) Licence is required at least one month before release. The running-royalty plan lists Middle-Scale
  (< ¥100M) ¥50,000 initial + ¥20,000/month + 5% of sales, Large-Scale ¥300,000 + ¥100,000/month + 5% (that page is
  the video-content plan; app plans differ; the fee schedule must be confirmed with Live2D). "Expandable Applications
  such as avatar systems" need a separate contract regardless of size; a fixed-character app is probably not one, but
  a child-customisable teacher might be read as one [U]. The Cubism Core is closed source.
- **Inochi2D** is the licence-clean alternative (BSD-2), but its web/WASM path still needs a patched toolchain and 0.9
  is not released [V]. Not production-ready for us.
- **Verdict:** licence cost and closed core rule it out unless the owner specifically wants anime-2D. Sources:
  https://www.live2d.com/en/sdk/license/ ; https://www.live2d.com/en/sdk/license/running_plan02/ ;
  https://help.live2d.com/en/sdk/sdk_001/ ; https://github.com/Inochi2D/inochi2d ; https://nlnet.nl/project/Inochi2D/

### 1.6 VRM / three-vrm / VRoid

- **Format:** VRM 1.0 is glTF with humanoid bones, expression presets (joy/angry/sorrow/fun/surprised, blink, lookAt,
  **five vowel visemes aa ih ou ee oh**) and `overrideMouth/overrideBlink/overrideLookAt` to resolve emotion vs
  lip-sync conflicts [V spec]. Custom expressions are allowed, so a VRM can carry our ARKit-52 + Oculus set too.
  `@pixiv/three-vrm` is MIT and drops into our three.js stack; MToon is a cheap toon shader that runs well on phones
  [V/U].
- **VRoid Studio:** fast GUI authoring for anime characters; exported models can be used commercially by individuals
  and companies [S], but **apps that generate/output avatars built from VRoid parts need a separate pixiv licence**
  [prior V]. VRoid faces are recognisably "VRoid default"; reaching premium quality still needs a 3D artist editing
  the mesh and textures. VRoid is GUI-only: not scriptable by an agent [U].
- **Steal:** the `override*` idea (an explicit rule for what lip-sync may override when an emotion is up) belongs in
  our compositor regardless of format; MToon-style banded lighting if we pick anime (a).
- Sources: https://vrm.dev/en/vrm/vrm_features/ ;
  https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm-1.0/expressions.md ;
  https://vroid.com/en/studio/guidelines

### 1.7 TalkingHead (met4citizen)

- MIT three.js class for real-time lip-sync on full-body avatars; needs ARKit-52 + 15 Oculus visemes on a
  Mixamo-compatible rig; built-in lip-sync for English, German, French, Brazilian Portuguese, Finnish, Lithuanian
  (**no Hindi**); `speakAudio()` takes external word/viseme timings; `streamAudio()` for streaming; HeadAudio for
  audio-only visemes; 8 moods; built-in hand gestures (handup, index, ok, thumbup...); bone physics for hair; works
  with VRoid, Avaturn, Avatar SDK and MPFB characters [V].
- **Measured here [M]:** HeadAudio closes 65% of Hindi bilabials but chatters (35% vowel frames wrongly closed); RMS
  is the best jaw driver at zero lag; HeadAudio 0.1.0 has a `viseme_aa`-never-fires bug; TalkingHead's demo avatar is
  CC BY-NC (`web-3d-talking-heads.md`).
- **Steal:** its viseme-timing interface shape, mood table and gesture list as a checklist. We do not adopt the class:
  our `HeadRig` + `behaviour.ts` + `lip.ts` already cover it with Hindi-specific fixes.
- Source: https://github.com/met4citizen/TalkingHead

### 1.8 NVIDIA Audio2Face-3D

- **Status [V]:** open-sourced: SDK (C++/CUDA + Python, MIT), training framework (Apache-2.0, Python + Docker), Maya
  and UE5 plugins (MIT), models under the NVIDIA Open Model License (commercial use allowed): v3.0 diffusion, v2.3
  Mark, v2.3.1 Claire/James; Audio2Emotion v2.2 / v3.0 under a custom licence "use allowed with Audio2Face only".
  NGC carries a multi-identity v3.2 engine set (prior sweep). Linux supported (Ubuntu 20.04+, CUDA 12.8+). Outputs mesh
  deformation, joints or blendshape weights; ARKit-named output exists in the NIM path [S].
- **Can it run server-side to make blendshapes? Yes, on a GPU.** It cannot run on a phone. Two uses fit us: (1)
  **offline**: bake ARKit curves for authored lesson lines (greetings, praise, chapter intros) on an Azure GPU, which
  is a richer jaw/lip/cheek performance than our client driver; (2) as a **teacher** for distilling a small client lip
  model on Hindi TTS (the training framework is released). Live per-child streaming on GPU costs a GPU per few
  concurrent streams and adds latency [U]. Training data is English/Mandarin; Hindi quality must be measured. Hosting
  open weights on Azure GPU is Azure compute, which I read as inside the Azure-only directive; **the owner should
  confirm** [U].
- Sources: https://github.com/NVIDIA/Audio2Face-3D ; https://github.com/NVIDIA/Audio2Face-3D-SDK ;
  https://huggingface.co/nvidia/Audio2Face-3D-v3.0

### 1.9 Ready Player Me (2026)

- Shut down 2026-01-31 after Netflix acquired it (Dec 2025); exported GLBs still render, the API and hosted avatars do
  not [S, prior sweep]. **Lesson (A2 in talking-avatars.md): never depend on an avatar vendor at runtime.** Its RPM
  half-body style (ARKit + Oculus visemes on a stylised human) is still the right *contract* to copy.

### 1.10 Companion avatars: Character.ai, Hume, Sesame, Replika, Grok, Tolan, Praktika

| product | face | what to take |
|---|---|---|
| Character.ai **AvatarFX** (Apr 2025) | server-side diffusion video from one image, lip-sync, gestures [S] | not real-time on phones; costs a GPU per stream; also a third-party API. Proves the market, not the method |
| **Hume EVI 3 / EVI 4 mini** | voice only; no avatar product found [S] | emotion-in-voice matters more than the face for warmth |
| **Sesame** (Maya/Miles) | voice-first iOS app (May 2026), glasses planned 2027; no face [S] | the most-praised "human" AI of 2025-26 has no face at all: the voice + timing carry presence |
| **Replika** | moved from 3D to 2D animated avatars in its May 2026 2.0 rebuild [S] | a large companion product walked back from 3D |
| **Grok Ani/Mika** | 3D anime companions, retired 2026-09-01 as "an experiment" [S] | anime 3D companion register drew controversy; also a reminder of the romance register we must never touch |
| **Tolan** | stylised alien, explicitly non-human; built with an ADA-winning 3D animator, Chromosphere and Iorama [S] | premium feel came from hiring real animation talent; "never pretends to be human" is in keeping with our never-deny-being-an-AI floor |
| **Praktika** | five named 3D animated tutors that blink, smile and lip-sync [S] | closest edtech analogue to our product: named, stylised 3D tutors |

Sources: https://www.techgines.com/post/avatarfx-video-generation-hyper-realistic-ai-video-tool-by-character-ai ;
https://www.hume.ai/blog/announcing-evi-3-api ; https://research.contrary.com/company/sesame-ai ;
https://aicompanionpick.com/replika-avatars-and-customization-guide ;
https://aicompanionguides.com/blog/grok-companions-alternatives-2026/ ;
https://www.tolans.com/relay/designing-tolan-part-1-characters ; https://www.fastcompany.com/91283982/tolan-adorable-alien-ai-companion ;
https://play.google.com/store/apps/details?id=ai.praktika.android

### 1.11 Edtech tutors: Khanmigo and others

- Khanmigo never had a face beyond a circular icon; in April 2026 Sal Khan called it "a non-event" for most students,
  and the 2026 overhaul made it auto-activate because students did not seek it out [S]. The lesson for us is not
  "faces don't matter" but that **a passive helper loses**; a teacher who drives the lesson (our Director) is the
  different product. Duolingo Lily remains the edtech gold standard for a face.
- Sources: https://danmeyer.substack.com/p/rip-khanmigo-and-edtech-industry ;
  https://agentconn.com/blog/ai-tutoring-agents-post-khanmigo-mytutor-2026/

### 1.12 Non-verbal behaviour research (2024-2026)

| work | finding | use |
|---|---|---|
| **MaAI / listener nodding** (ICASSP 2025; arXiv 2607.12329; 2507.23298) | real-time prediction of nod timing *and type/kinematics* from speech, multi-task with backchannel prediction; model-timed nods beat stochastic ones (prior sweep: all 7 metrics, n = 60) [V-abs] | already planned (talking-avatars S6); stylised faces can carry bigger nods |
| **Avatar Forcing** (CVPR 2026) | causal diffusion-forcing head motion reacting to user audio + motion, ~500 ms latency; active listening improved by preference optimisation; preferred > 80% vs baseline [V-abs] | photoreal video head; take the *behaviours it learns* (react to laughter, nods, speech) as a checklist, not the model |
| **ARIG** (ICCV 2025), **StreamAvatar** (2025) | autoregressive interactive heads for real-time conversation [S] | same: references for listener reactions |
| **LiveGesture** (2026) | first zero-look-ahead streamable full-body gesture model (SVQ tokenizer + hierarchical AR transformer), BEAT2 [V-abs] | bust framing hides most gesture; BEAT2's licence must be checked before any training (`rj-nc-data-and-weights-in-product`) [U] |
| **Rolling-diffusion gestures** (2025) | streaming co-speech gestures up to 200 fps [V-abs] | same caveat |
| **TANDE** (ICMI 2026) | non-verbal backchannels preferred over verbal (n = 36) [V-abs, prior] | keeps our no-audio-backchannel rule |
| Andrist gaze aversion; Lee et al. "Eyes Alive" saccade model; gamma-distributed blinks | classic, already in `behaviour.ts` [M: implemented] | stylised eyes are bigger, so saccades and blinks are *more* visible: keep them physically timed, but render lids with squash |

Sources: https://arxiv.org/pdf/2607.12329 ; https://arxiv.org/html/2507.23298 ; https://taekyungki.github.io/AvatarForcing/ ;
https://arxiv.org/abs/2604.10927 ; https://arxiv.org/pdf/2503.10488

---

## 2. Rendering approaches compared

| approach | quality ceiling | cheap Android (Mali-G52 class) | licence | agent can author? | turns / 3/4 | fits our stack |
|---|---|---|---|---|---|---|
| **3D stylised GLB + ARKit-52 + visemes** (b/c) | Pixar/Memoji-level if a real artist sculpts it | good: 8-15k tris, 1-2 textures or ramps, solid hair, ~70 morphs on the head only; cheaper than our realistic B-lite [U until E-T2] | ours (commissioned, IP assigned) + three.js MIT | pipeline yes; **face no** | free | **full**: HeadRig, tiers, behaviour, lip, D plate |
| **2D Rive puppet** (d) | Lily-level | best: vector, < 1 MB file + 222 KB runtime | runtime MIT, editor seat | wiring yes; **art no** | only as authored | partial: needs a Rive adapter behind the face API; reuses behaviour + lip numbers |
| **VRM anime** (a) | high anime 3D | good (MToon) | three-vrm MIT; VRoid output OK, generator-apps clause | GUI tools; agent no | free | high (it is glTF) |
| **Live2D** (a, 2D) | best 2D anime | good | **paid above ¥10M sales**, closed core | no | +-30 deg | low |
| realistic 3D (rejected) | — | — | — | — | — | owner rejected |
| server video (AvatarFX, VASA-style) | photoreal | n/a (stream) | vendor API / GPU per stream | — | — | violates Azure-only + cost |

**Hindi lip sync is approach-independent:** our 15 visemes + `tongueTipUp/Curl/Wide` (retroflex, dental) drive 3D keys
directly; 2D needs ~10-12 authored mouths plus a retroflex/tongue-up mouth. Driver stays `lip.ts` (RMS jaw + closure
expander + HeadAudio classes) and Azure `hi-IN` viseme IDs on the TTS path. Stylised mouths *forgive* imprecise lip
sync better than realistic ones [U, consistent with Duolingo's "believable when animated"].

---

## 3. Production routes and prices

| route | what you get | price [U unless cited] | risk |
|---|---|---|---|
| **A. Commission a senior freelance character artist** (ArtStation/Upwork, stylised-film portfolio) | sculpt from our concept, game topology, 52 ARKit + 15 visemes + 3 tongue + correctives, 2-3 outfits/hair variants, textures, source .blend, IP assignment | **USD 4-12k** (low-end market: an Apr 2026 Upwork job for a stylised female web avatar with ARKit + visemes + GLB was fixed at **USD 600** [S]; a rigged VTuber-grade 3D model ≈ 35 h ≈ USD 2.1k at USD 60/h [S]) | quality varies hugely; pay for a paid test (head bust + 5 shapes) first |
| **B. Small animation studio with art director** | the above + expression library polish, turntables, look-dev, style guide, 3 characters | **USD 15-40k** | slower, best polish |
| **C. Buy a base and modify** | stock stylised woman (CGTrader/Sketchfab) + our edits | USD 50-500 for the asset | licences rarely allow AI-training of our lip student and rarely include blendshapes; generic look; Indian-woman stylised bases are thin |
| **D. Agent builds it (Blender scripting on AWS/Azure GPU)** | procedural/MakeHuman-derived stylised head | compute only | **already measured to fail on appeal**: stylised-premium 1.5/5 wow, 2/5 uncanny risk, rejected (VERDICT.md) [M] |
| **E. Rive animator** (if 2D) | Lily-scale puppet: 20+ mouths, emotions, idles, state machine | USD 5-20k + retainer | single-vendor dependency; art can only be edited in Rive |
| **F. AI image-to-3D (Hunyuan3D/TRELLIS/Tripo)** | blockout mesh | low | bad topology, no keys; TRELLIS GLB export uses NC deps (`face3d-nc-deps-rejected`); reference for the artist only |

**Split of work (recommended):** artist owns the sculpt, topology and the *art direction* of key shapes; we own
everything scriptable: concept art (this doc), the brief + shape-reading checklist, gltf-transform/meshopt/KTX2 tiers,
viseme fold, correctives-by-product, validation gates (G4 light-through-lids, G5 lip contact, G6 teeth), the
blind-judge emotion battery with a held-out judge (`teacher-presets-per-face`), the behaviour layer, and device
benches. Contract must include **AI-training rights** (our lip student trains on teacher renders) and no third-party
assets with NC terms.

### 3.1 The owner's no-contracted-artist rule

`character-built-in-house` (2026-10-03) forbids a contracted artist; after the GNM review the owner's reversal path
was "go stylised built from a professional stylised base". Options inside the rule, best first:

| base | what it is | licence notes | agent can adapt it? |
|---|---|---|---|
| **Reallusion Character Creator 5 + stylised/toon packs** (e.g. "Stylized Toon Girls/Boys") | parametric pro character system with a blendshape face rig and an ARKit proxy; FBX export; Blender import via the open `cc_blender_tools` [S] | perpetual/subscription EULA; real-time-engine export and AI-training terms must be read before purchase [U] | partly: CC5 is a Windows GUI app (Python API exists [U]); the agent cannot run it in this Linux container. Blender-side clean-up, keys, compression and tiers: yes |
| **Marketplace stylised women with ARKit-52** (Fab, RenderHub, Superhive, threedee.design "Cartoon Woman Rigged", GLB) [S] | fixed characters, USD 30-400 [U] | per-seller; Fab/RenderHub "extended" licences allow commercial use [S]; AI-training clauses vary [U] | yes for re-texture, hair/outfit swaps, key fixes; **re-sculpting the identity to an Indian woman to film quality: no** |

Inside the rule, the agent's ceiling is "a good bought face, re-dressed": it will look like the seller's character
with Indian colouring. Specific, ownable appeal (the concepts in §5 made real) needs the face to be commissioned.

**Honest limits of an agent:** I can produce on-model concept sheets (§5) and drive any number of render/score loops,
but the face's *appeal* (the ratio of eye size to cranium, the shape of a smile at 30% vs 70%, the arc of a blink) is
taste executed in a sculpting tool. Every bake-off this project ran says the agent ceiling for a face is 2-3.5/5. Pay
for the face; automate the rest.

---

## 4. Behaviour-layer plan (on `src/avatar/behaviour.ts`, not a rewrite)

What exists [M: code]: floor FSM (idle/speaking/your_turn/listening/thinking), gamma blinks with time-warp, contact
gaze with Andrist aversions, cognitive aversion in THINKING, listening tilt, YOUR TURN lean-in, prosody accent nods,
brow flash at onset, one armed emotion; reduced-motion and gentle-face modes; seeded and testable.

Add for the stylised teacher, in order of payoff:

1. **Cartoon amplitude profile** (`profile: "stylised"`): emotion and nod amplitudes x1.3-1.8, shorter attack, a
   small anticipation before big moves and 10-15% overshoot on head springs; blinks with a 1-frame lid squash. Re-score
   every emotion preset on the new face with a held-out judge, n >= 12 (`teacher-presets-per-face`).
2. **Latency mask = thinking repertoire** (Lily): 4-6 authored "pondering" poses (eyes up-left, lips pushed aside,
   chin touch if hands are in frame) chosen without repeats, entered within 150 ms of the child's end of turn and
   held until her first audio. This replaces any spinner.
3. **Idle recombination** (Duolingo 8 x 8): N head-idle and M body/breath idles layered and re-picked at random
   phase, so no loop is ever seen twice in a lesson. Still "every motion has a function": idles are breathing, weight
   shift and attention, not fidgets.
4. **Model-timed listening nods** (MaAI, after a Hindi/Hinglish check) replacing heuristic nods; plus *visible*
   listening reactions to the child's laughter and long pauses (Avatar Forcing's checklist).
5. **Secondary motion:** spring bones on the bun/loose strands, earrings and dupatta edge; cheap (2-4 bones).
6. **Gestures:** bust framing, so a small authored library (explain-open-palm, count-on-fingers, thumbs-up, clap,
   point-to-board) triggered by Director semantic tags, never generated. Generated co-speech gesture models stay out
   until a licence-clean dataset exists.
7. **Emotion source:** the Director's tag per utterance (warm/curious/excited/concerned/proud) plus prosody accents;
   no Audio2Emotion (licence).
8. **The child names her:** the name is display + speech only (`checkTeacherName`, lsn-name-predicate-rev2); the
   look id and behaviour profile never change with the name.
9. **Safety floor stays in the face:** no romance/companion register in any expression, idle or gesture (no winks,
   blush loops, pouts); the face never contradicts "I am an AI teacher".

---

## 5. Concept art (generated 2026-10-04)

`concepts/` holds, per direction, a front portrait and four expression edits (`-talking`, `-listening`, `-thinking`,
`-happy`), all edits of the front so identity holds; `<x>-sheet.webp` is one direction's sheet. `concepts/COMPARE.png`
is a 2 x 2 grid (a top-left, b top-right, c bottom-left, d bottom-right, corner letters only), each cell = the front
large, then talking / listening (top) and thinking / happy (bottom). Prompts and dates per image: `concepts/concepts.json`.
Generator: `scripts/character/stylised/gen-concepts.mjs` (Azure Foundry `taxila-image` = gpt-image-2, 1024², high);
composer: `scripts/character/stylised/compose.py`. Direction (c) was generated twice: v1 (`concepts/c-v1/`) read as a
second family-film render, so the prompt was pushed to the phone-emoji-avatar register (oversized round head, sculpted
solid hair, vinyl-toy materials). Images generated: 12 in the first run (4 fronts, 4 v1 (c) edits, 4 (d) edits; 8 edits hit 429 and produced nothing)
+ 13 in the second (new (c) front + 4 edits, 8 (a)/(b) edits) = 25, under the 40 cap.

| | direction | first read [U, my eye, not a panel] |
|---|---|---|
| a | anime-human | the most elegant and "teacher-adult"; needs a VRM/toon pipeline or Live2D; anime register may skew older and is less neutral for parents |
| b | Pixar/Disney-style 3D | warmest and most premium; the strongest fit for the recommended 3D GLB route; must avoid the doll trap (realistic nose/lips with doll eyes) |
| c | Memoji/Bitmoji-style 3D | cutest, most phone-native, easiest for an artist to make perfect and cheapest to render; risks reading as a toy to classes 6-9 |
| d | flat 2D vector | Duolingo-native, best for the cheapest phones (Rive); the least "person who listens to you" |

By eye on COMPARE.png (one look, not a measurement): identity, outfit, bindi and bun hold across all 16 edits; every
direction carries the four states legibly as stills, thinking reading most clearly in (b) and (a); (c)'s edits
zoomed out relative to its front. Encouraging/happy should still be judged as motion (`teacher-encouraging-is-motion`).

**Next step [U]:** a blind child/parent panel (n >= 20 per band, b1-b4) on COMPARE.png before any commission; my
prior is (b) for b1-b2 and a b/c blend (Bitmoji register: slightly realistic proportions, toy-clean materials) as the
single look across bands.

---

## 6. Ranked recommendation

1. **3D stylised GLB with ARKit-52 + 15 visemes + 3 tongue keys, look between (b) and (c)**, commissioned from a senior
   character artist (route A, USD 4-12k; route B if the owner wants three characters polished at once; **needs the
   owner to lift the no-contracted-artist rule for the face**, otherwise a bought pro stylised base per §3.1), on our
   existing three.js stack, tiers H/B+/B-lite/D (plate rendered from the same mesh)/E. Solid sculpted hair, toon-PBR
   materials with a ramp, one 1024 texture per tier. Behaviour plan §4.
2. **2D Rive puppet** in style (d), if the panel or the owner prefers flat, or if E-T2 shows the 3D B-lite cannot hold
   30 fps on Mali-G52 class phones. Needs a Rive animator (route E) and a `FaceRenderer` adapter that feeds the same
   behaviour and lip numbers.
3. **VRM anime** (a) via three-vrm + MToon, only if the owner picks anime; artist-made, not VRoid-default.
4. **Live2D**: not recommended (paid licence at our scale, closed core, two specialist artists).

Offline extra, any route: Audio2Face-3D on an Azure GPU to bake curves for authored lines and to act as a distillation
teacher, after a Hindi quality check and owner confirmation that self-hosted open weights on Azure satisfy the
Azure-only directive.
