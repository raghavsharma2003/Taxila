# Browser 3D talking heads for the Taxila tutor: stacks, avatar sources, audio-driven lip-sync (measured)

Date: 2026-10-02. Scope: a 3D tutor face in the browser and in Capacitor's Android WebView on ₹10k phones. The face
is driven by **gpt-realtime-2.1 audio arriving as a WebRTC `MediaStream`**, which carries **no visemes and no
timestamps**. The student picks one of several Indian tutor characters.

Builds on:
- `../tech-and-market.md` §2: Rive 2D was the v1 pick, video avatars cost $0.01–0.50/min. The owner now explicitly wants 3D.
- `../../harvest/companion-tech.md` §13:
  - lip-sync is slaved to the playback clock,
  - nothing heavy runs on the audio thread,
  - any change to the audio output path re-runs echosim.
- Sibling `audio-to-face-ml.md` covers the ML side: the A2F-3D teacher, a distilled student and the `FaceFrame`
  protocol. This file covers the **rendering stacks, avatar sources and existing in-browser lip-sync libraries**, and
  adds **measurements** that the sibling marks `[U]`.

Tags:
- **[M]** measured here, with method in §5 and scripts in `bench/`.
- **[V]** verified in source code or a primary document.
- **[S]** secondary source.
- **[U]** unverified or estimated.

---

## 0. TL;DR: findings that change decisions

1. **v1 stack: three.js r180 + TalkingHead 1.7 (MIT), vanilla, mounted in one React component.** Skip React Three
   Fiber, Babylon.js and model-viewer for the face.
   - TalkingHead already ships the hard non-lip parts: blink templates, eight moods, idle and speaking eye-contact and
     head-move statistics, `lookAtCamera`, hand gestures, dynamic bones, an `avatarOnly` mode, a 30 fps cap and a
     pixel-ratio option **[V]**.
   - Its streaming API accepts viseme or blend-shape timelines, and HeadAudio plugs straight into its blend-shape table **[V]**.
   - Measured min+gzip JS **[M]**:

     | bundle | gzip |
     |---|---|
     | three + GLTFLoader + meshopt | **145 KB** |
     | + TalkingHead | **204 KB** |
     | R3F + react-dom + three | 298 KB |
     | Babylon 9 core + glTF | **759 KB** |

   - model-viewer 4.3.1 has **no morph-target API at all**: zero occurrences of "morph" in its source **[V]**.
2. **Ready Player Me is dead.** Its creator, API and hosted avatars went offline on **2026-01-31**, after Netflix
   acquired it on 2025-12-19 **[S]**.
   - TalkingHead's own demo avatar `brunette.glb` is RPM-made and **CC BY-NC**, so it cannot ship **[V]**.
   - **Use MPFB (Blender + MakeHuman assets, CC0) as one shared base topology** and make every tutor character from it. MPFB has parametric age, gender and body sliders **[V]**.
   - One topology means one set of 52 ARKit + 15 Oculus shape keys, and lip-sync is tuned once for all characters.
   - **Avoid Avaturn and MetaPerson for this.** Both are selfie-to-avatar services at $300–800/month **[S]** and solve a problem we don't have.
   - VRoid works for an anime art direction. Its licence allows commercial use of models you made, but **forbids apps
     that generate or output avatars** **[V]**.
3. **Asset budget [M].** I measured TalkingHead's five sample avatars with `gltf-transform optimize --compress meshopt
   --texture-compress webp --texture-size 1024`. They come out at **0.95–2.8 MB** (raw 2.4–36.8 MB) and 13k–78k triangles.
   - The hidden cost is **morph-target memory**. three.js stores every target as Float32 RGBA texels: position + normal = **32 B per vertex per target** **[V, `WebGLMorphtargets.js`]**.
   - MPFB as shipped carries 1.52 M vertex-targets, which is **≈49 MB** of morph texture plus the same again as a JS-heap copy. Brunette needs 5.7 MB.
   - **Strip morphs from everything except head, teeth and eyes, and decimate to ≤30k triangles.**
4. **Audio-only lip-sync is mediocre in any library, and worse in Hindi [M].** I built a ground-truth bench:
   - **Inputs:** 14 Azure Neural TTS utterances (10 hi-IN, 4 en-IN; 2 voices each; 124 s in total) with Azure's own phone-aligned viseme timelines.
   - **Arms**, all run causally at 48 kHz in 128-sample quanta, as a browser does:
     - HeadAudio's real processor code,
     - wawa-lipsync's real code over a spec-faithful AnalyserNode,
     - an RMS envelope,
     - a wav2vec2 ONNX model.

   | arm | hi-IN r(mouth-open) | en-IN r | bilabial closures hit (hi) | vowel frames wrongly closed (hi) | lag |
   |---|---|---|---|---|---|
   | **RMS envelope** (12 lines of code) | **0.563** | **0.697** | 28/84 (33%) | 15.9% | 0 ms |
   | HeadAudio 0.1.0 as shipped | 0.431 | 0.521 | **55/84 (65%)** | **35.1%** (chatter) | 0–33 ms |
   | HeadAudio + `speakerMeanHz` per voice | 0.443 | 0.534 | 50/84 | 28.5% | 33 ms |
   | HeadAudio + 120 ms min-hold (the fix proposed in HeadAudio issue #3) | 0.155 | 0.263 | 14/84 | 7.7% | 83 ms |
   | wawa-lipsync 0.0.2 | 0.450 at its best lag, 0.353 at lag 0 | 0.518 | 11/84 (13%) | 13.0% | **217–233 ms** |
   | wav2arkit (wav2vec2 + LAM, offline, non-causal) | 0.525 (jaw), 0.556 (jaw + lip) | 0.581 / 0.715 | n/a | n/a | **leads by 100–167 ms**: needs lookahead |

   - **RMS is the best jaw driver measured, in both languages, at zero lag.**
   - HeadAudio is the only cheap arm that closes lips on प/ब/म reasonably often (65%). It pays for that by snapping shut on about 1 vowel frame in 3.
   - Every arm loses 0.09–0.13 r on Hindi versus English. Every shipped model was trained on English.
5. **HeadAudio 0.1.0 has a one-character bug: `viseme_aa` never activates [V].** `headaudio.mjs` gates on
   `if ( viseme )`, and in the minified build `e&&(this.visemeActive=…)`. The open-jaw viseme has id 0, which is falsy,
   so the node holds the previous viseme through every /a/.
   - Fixing it barely moves the metrics (§5.3), because the RMS-like part of the signal is what carries jaw openness.
   - Patch it anyway.
6. **wav2vec-class models are not a phone option [M].**
   - The "1.8 MB" `wav2arkit_cpu` really needs a **402 MB** weight file.
   - In onnxruntime-web WASM on a 2.1 GHz Xeon it runs at **165 ms per audio second on 4 threads** and **491 ms on 1 thread** (RTF 0.49).
   - A ₹10k phone's cores are slower still, so it would be at or beyond real time, before accounting for its 100–167 ms lookahead. This independently confirms the sibling's "teacher on server, student on phone".
7. **Cost of the cheap arms [M].** HeadAudio's processor costs **p50 0.005 ms, p99 0.08 ms, p99.9 0.3 ms** per 128-sample quantum, against a budget of 2.67 ms.
   - 13 of 46,403 quanta overran, consistent with JIT warm-up of 14 fresh instances **[U]**.
   - That is small, but it runs **on the audio thread** (companion-tech §13).
   - v1 therefore runs the MFCC classifier on the **main thread from an `AnalyserNode` tap**. That puts zero custom code in the render quantum, at the cost of a ≤33 ms classification cadence (§6.2).
8. **Wiring rule: playback stays on an unmuted `<audio>` element. Analysis is a side tap that never reaches `destination`.**
   - Chromium echo-cancels only audio played through the WebRTC playout path. Remote audio replayed through WebAudio is not in the AEC reference (crbug 687574 class) **[S]**.
   - HeadAudio's own OpenAI demo plays through WebAudio behind a *muted* `<audio>`. **Do not copy that part** **[V]**.
9. **Photoreal and "video-real" are a different track.** That is v2: server video avatars, or Gaussian heads driven by
   the same ARKit stream (sibling §6, §9). Make v1 **stylised 3D** (Pixar-ish, not photoreal) to stay out of the
   uncanny valley with children.

Everything recommended below runs client-side from MIT, Apache or CC0 code and assets, with no per-minute vendor. That is compatible with the Azure-only directive.

**Recommended v1:**
- **Renderer:** three.js + TalkingHead.
- **Characters:** MPFB-based, about 2 MB each.
- **Jaw:** RMS from a WebRTC tap.
- **Lip shape:** patched HeadAudio retrained on our Hindi tutor voices, weighted *below* RMS, plus a closure veto.
- **Expression:** driven by the Director's intent, never by audio emotion recognition.
- **v1.5:** a causal student model (sibling §5.2) replaces HeadAudio once it beats this bench's bars (§11).

---

## 1. Constraints (what every option is judged against)

| constraint | source | consequence |
|---|---|---|
| Audio is a WebRTC `MediaStream` from Azure; no visemes, no word timestamps, no lookahead | tech-and-market §1.5, §2.2 | text-driven lip-sync (TalkingHead's main path) is unavailable; audio-driven only, causal |
| AEC must keep working (barge-in floor) | companion-tech §13; echosim | playback path must not change; analysis is a side tap |
| Nothing heavy on the audio thread | companion-tech §13 / AFFECT-CONTINUITY §3.2 | prefer main-thread analysis from `AnalyserNode` |
| ₹10k Android: Mali-G52/G57-class or Adreno 61x GPU, 3–4 GB RAM, WebView = Chromium **[U, device list §9]** | brief | ≤30k tris, ≤3 MB GLB, 30 fps cap, DPR cap |
| Several selectable Indian tutors, different looks / genders / ages / styles | brief | one shared base topology + shape-key set; per-character GLB loaded lazily |
| Children 6–15 | brief | stylised, not photoreal; no fake emotion recognition of the child (rejected #8) |
| **Azure-only directive** (2026-10-02, `CLAUDE.md`): no third-party AI APIs | owner | the face must be client-side OSS. Avaturn/MetaPerson creator APIs, Simli and HeyGen are excluded from builds. Azure Speech (used for this bench's ground truth) and offline A2F on Azure GPUs are allowed |
| Later "video-real" | brief | face protocol = ARKit-52 + head pose + gaze (sibling §5.1), renderer-agnostic |

---

## 2. Rendering stacks compared

### 2.1 Summary

| stack | version (npm, date) | licence | gzip JS **[M]** | morph API | talking-head features out of the box | verdict |
|---|---|---|---|---|---|---|
| **three.js** | 0.186.1 (2026-09-24) **[V]** | MIT | 145 KB (core+GLTFLoader+meshopt) | `mesh.morphTargetInfluences[]`, texture-based, unlimited targets on WebGL2 **[V]** | none | base layer |
| **TalkingHead** (met4citizen) | 1.7.0 (npm 2025-12-08; repo HEAD 2026-09-25) **[V]**, peer three ^0.180 | MIT | 204 KB incl. three | `mtAvatar[name].{newvalue,realtime,fixed}` with easing **[V]** | moods, blinks, gaze, head idle/speaking, gestures, streaming visemes/blendshapes, dynamic bones, Mixamo FBX animations **[V]** | **v1 pick** |
| **three-vrm** (pixiv) | 3.5.5 (2026-07-09), repo HEAD 2026-09-09 **[V]** | MIT | 174 KB incl. three | `vrm.expressionManager.setValue('aa'…)`, 18 presets **[V]** | lookAt, spring bones, MToon toon shader; only 5 vowel mouth presets **[V]** | alternative if art = anime |
| **React Three Fiber** | 9.8.1 (2026-09-24), React ≥19 <19.4 **[V]** | MIT | 298 KB (R3F + react-dom + whole three) | same as three (it *is* three) | none (drei helpers) | not needed; reconciler overhead + whole-three import |
| **Babylon.js** | 9.29.0 (2026-10-01); 9.0 announced 2026-03-26 **[V][S]** | Apache-2.0 | 759 KB (Engine+Scene+glTF+morph, tree-shaken ES) | `MorphTargetManager` | animation retargeting new in 9.0 **[S]** | heavier; no talking-head ecosystem |
| **model-viewer** (Google) | 4.3.1 (2026-06-04), repo HEAD 2026-10-01 **[V]** | Apache-2.0 | n/m | **none**: 0 hits for "morph" in `packages/model-viewer/src` **[V]** | product viewing, AR | **cannot animate a face** |

All gzip figures: `esbuild --bundle --minify` of a minimal entry, then `gzip -9`. Scripts: `bench/` notes in §5.6.

### 2.2 TalkingHead in detail (read from source, `modules/talkinghead.mjs`, 4,895 lines)

**Avatar contract.** Mixamo-compatible rig, **52 ARKit + 15 Oculus viseme** shape keys. `mouthOpen`, `mouthSmile`,
`eyesClosed`, `eyesLookUp` and `eyesLookDown` are synthesised from ARKit if missing. Meshopt is on by default and
Draco is optional **[V]**.

**Life layer (the part that makes it feel like a person).** All of this exists and is tunable:
- **Blinks.** `animTemplateBlink`: 85% are single blinks with a 1–8 s delay and 100–300 ms closure; the rest are
  double blinks **[V]**.
- **Moods.** `neutral`, `happy`, `angry`, `sad`, `fear`, `disgust`, `love` and `sleep`, each with its own baseline,
  breathing rate (`chestInhale`) and idle animations **[V]**.
- **Eye contact and head motion.** `avatarIdleEyeContact` 0.2, `avatarIdleHeadMove` 0.5, `avatarSpeakingEyeContact` 0.5
  and `avatarSpeakingHeadMove` 0.5, plus `lookAtCamera(ms)` and `lookAt(x,y,ms)` **[V]**.
- **Gestures and emoji.** `speakWithHands()`, the `yes` and `no` head gestures, and emoji templates (😏, 😒 …) that
  map to ARKit combinations **[V]**.
- **Dynamic bones** (hair, earrings, dupatta) in `dynamicbones.mjs` **[V]**.
- **Streaming API (Appendix G).** `streamStart` / `streamAudio({audio, visemes, vtimes, vdurations | anims})` /
  `streamInterrupt` / `streamStop`, with an AudioWorklet player (`playback-worklet.js`) **[V]**.
  - It *plays the audio itself*. For WebRTC we do **not** use it for audio (§6). We drive blend shapes directly.
- **Direct control (Appendix F).** `Object.assign(head.mtAvatar[k], { newvalue, needsUpdate:true })` is eased.
  `realtime: v` is unsmoothed. `setFixedValue(k, v)` overrides everything else **[V]**.
- **Performance knobs.** `modelFPS` defaults to 30. `modelPixelRatio` is multiplied by `devicePixelRatio`, and the
  renderer runs with `antialias:true`, ACES tone mapping and `shadowMap.enabled = false` **[V]**.
  `avatarOnly: true` lets us own the renderer and loop **[V]**.

**Language modules.** `en`, `de`, `fr`, `fi`, `lt`, `pt_br`, and **no Hindi** **[V]**. They are text→viseme rule
sets that need word timestamps, which we don't have, so a `lipsync-hi.mjs` would not help v1 anyway.

**The project is a one-person side project.** The README says: "I don't have any big plans for it" **[V]**. It is MIT,
so **vendor it**: pin a commit and keep our patches in-tree. Don't track `main`.

### 2.3 three-vrm / VRM

- **Expression presets** **[V, `VRMExpressionPresetName.ts`]**:
  - `aa`, `ih`, `ou`, `ee`, `oh` (5 vowels),
  - `blink`, `blinkLeft`, `blinkRight`,
  - `happy`, `angry`, `sad`, `relaxed`, `surprised`, `neutral`,
  - `lookUp`, `lookDown`, `lookLeft`, `lookRight`.

  There are **no consonant visemes**. PP closure means "all mouth presets at 0", and FF or rounding detail is lost.
- **Strengths.** Spring bones for hair and cloth, the MToon toon shader, a standard humanoid map, and the VRoid Studio pipeline.
- **The sample VRoid avatar converted for TalkingHead** measured 1.94 MB optimised, 39.9k triangles, **244 bones** and
  124 shape keys **[M]**. The spring-bone and hair-bone count is a CPU cost on little cores **[U, measure]**.
- **Use it only if** the art director picks anime. TalkingHead ships `blender/VRoid/*.py` to convert VRoid to its
  ARKit+Oculus contract **[V]**, so even then the TalkingHead runtime stays.

### 2.4 React Three Fiber

R3F is a React reconciler for three. It adds nothing to face animation. It costs React reconciliation on the frame
path, and the measured bundle pulls in all of three (298 KB gzip with react-dom) **[M]**.

The Taxila UI is React, so mount TalkingHead imperatively in a `useEffect` on a `<div ref>`. This keeps the avatar's
rAF loop out of React state entirely, which matters on little cores.

### 2.5 Babylon.js 9

Babylon is competent: `MorphTargetManager`, glTF, and animation retargeting new in 9.0 **[S]**. But it is **5× the
JS** of three+TalkingHead (759 KB vs 145–204 KB gzip **[M]**), and it has no talking-head layer. We would rebuild
moods, blinks, gaze and gestures from nothing. Nothing in the brief needs it.

### 2.6 model-viewer

It is built for product display and AR Quick Look / Scene Viewer. Its scene-graph API covers materials, textures,
variants and named animations. There is **no morph-target access**: zero "morph" occurrences in the
`packages/model-viewer/src` TypeScript at HEAD 2026-10-01 **[V]**. Baked glTF animations can't follow live audio.
**Rejected for the face.** It could still serve the character *picker* turntable, but static images are cheaper (§8).

---

## 3. Avatar sources (who is alive in Oct 2026, and what we may ship)

| source | status Oct 2026 | licence for a paid kids' web app (GLB is downloadable by anyone) | Indian looks / ages / genders | ARKit+Oculus keys | verdict |
|---|---|---|---|---|---|
| **Ready Player Me** | **shut down 2026-01-31**, after Netflix acquired it 2025-12-19 **[S]** | exported GLBs still load, but there is no new creation; TalkingHead's `brunette.glb` is CC BY-NC **[V]** | n/a | yes (RPM had them) | **dead** |
| **MPFB 2** (Blender + MakeHuman assets) | active **[V]** | CC0 / CC-BY assets **[V]**; sample `mpfb.glb` is CC0 **[V]** | parametric age, gender, weight, proportions **[V]**; South-Asian features via sliders + our own skin textures **[U]** | TalkingHead ships `talkinghead.mhw`, targets, skeleton and an add-on that build them **[V]** | **v1 base** |
| **Avaturn** (Goodsize Inc.) | active **[S]** | free tier non-commercial; Pro **$800/mo** for 1,000 avatars **[S]** | selfie-based | "T2" avatars fully TalkingHead-compatible **[V]** | no: selfie generator, wrong problem, price |
| **Avatar SDK / MetaPerson** | active **[S]** | first avatar free; Plus $300–400/mo, Pro $600–800/mo; API only on Enterprise **[S]** | selfie-based, realistic or cartoon | yes; TalkingHead has rename scripts **[V]** | no (as Avaturn); vendor blog self-interested **[S]** |
| **VRoid Studio** (pixiv) | active **[S]** | commercial use of models you make is OK; **"cannot create an application that can generate or output 3D models"** **[V]** | anime style | via TalkingHead's VRoid scripts **[V]** | only if art = anime; no in-app character creator |
| **Microsoft Rocketbox** | archived library | MIT **[V]** | 115 adults, some South Asian **[U]** | ARKit+Oculus, needs re-rig **[V]** | fallback stock; dated look |
| **Mixamo** (Adobe) | up and free, but in maintenance mode; days-long outage June 2025 **[S]** | animations royalty-free in commercial projects; raw files not redistributable, **not for ML training** **[V]** | n/a (rig + animations) | n/a | use for idle and gesture clips, exported once and vendored; don't build a pipeline on its uptime |
| **Character Creator 4 (Reallusion)** | active **[S]** | realtime export licensing must be checked for client-side GLB **[U]** | strong, with professional heads | ARKit via its own profile **[U]** | v1.5 option if an artist uses it; legal review first |
| **Commissioned artist** (Blender + Faceit) | n/a | we own it | anything | Faceit builds ARKit; TalkingHead has `build-visemes-from-faceit-phonemes.py` **[V]** | **v1, on top of the MPFB base** |

TalkingHead's own warning applies to every row: "Many commercial 3D products generate avatars that cannot be used in
public web apps, where the asset is delivered to the client and effectively becomes downloadable" **[V]**.

### 3.1 Measured asset cost **[M]** (`bench/glbstat.mjs`, gltf-transform 4.x)

| sample (TalkingHead repo) | raw MB | optimised MB (meshopt + WebP @1024) | triangles | primitives (≈ draw calls) | bones | shape keys | vertex×targets | morph texture (×32 B) |
|---|---|---|---|---|---|---|---|---|
| brunette (RPM) | 4.72 | **0.95** | 13.2k | 10 | 67 | 72 | 177k | 5.7 MB |
| vroid | 2.35 | 1.94 | 39.9k | 19 | 244 | 124 | 509k | 16.3 MB |
| avaturn | 13.82 | 2.10 | 30.8k | 11 | 54 | 72 | 294k | 9.4 MB |
| avatarsdk | 12.28 | 2.64 | 47.0k | 10 | 73 | 66 | 677k | 21.7 MB |
| **mpfb** | 36.82 | 2.80 | **78.2k** | 8 | 67 | 66 | **1,519k** | **48.6 MB** |

The morph memory figure comes from three.js `WebGLMorphtargets.js`. It allocates
`Float32Array(vertexCount × vertexDataCount × 4 × targets)` with `vertexDataCount = 2` for position + normal, uploads
it as a `FloatType` texture, and keeps the JS array **[V]**. The vertex shader skips targets whose influence is 0
(`if ( morphTargetInfluences[ i ] != 0.0 )`) **[V]**, so per-frame cost scales with *active* targets, while memory
scales with *all* of them.

**Character spec that follows** (what we hand the artist):

| item | budget |
|---|---|
| triangles | ≤ 30k total; head ≤ 12k |
| primitives | ≤ 8; merge the outfit into one |
| bones | Mixamo set + ≤ 16 hair/cloth dynamic bones |
| shape keys | 52 ARKit + 15 Oculus on **head, teeth and tongue only**; eyes rotate by bone, not by morph |
| morph texture | (head + teeth verts ≈ 6k) × 67 × 32 B ≈ **13 MB** |
| textures | 1024² max, ≤ 4 maps, KTX2/ETC1S where possible (WebP decodes to RGBA8 on the GPU: 1024² × 4 B × 1.33 mip ≈ 5.6 MB each) |
| GLB | ≤ 2.5 MB over the wire |

---

## 4. Audio-driven lip-sync from a live stream: the options

TalkingHead's best quality path is text→viseme with TTS word timestamps. We cannot use it: gpt-realtime streams a
transcript with no timings. Everything below works from audio alone.

| method | how | runs where | output | latency | Hindi | status |
|---|---|---|---|---|---|---|
| **RMS envelope** | `AnalyserNode` time-domain RMS → gate → gain → jaw | main thread, native FFT-free | 1 channel (jaw) | ~0 algorithmic; window 10.7 ms @512 | language-agnostic | **best jaw signal measured [M]** |
| **HeadAudio** 0.1.0 (met4citizen, MIT) | AudioWorklet: pre-emphasis → 16 kHz polyphase → 512/256 MFCC-12 + tanh → energy VAD → Mahalanobis vs ~50 Gaussian prototypes → 6-frame majority vote (`RingBuffer(6)`) → 15 Oculus visemes; node eases 100 ms ramps **[V]** | audio thread (as shipped) | 15 Oculus visemes | README ~50 ms **[V]**; best fixed lag 0–50 ms **[M]** | trained on 4 English Kokoro voices **[V]**; Hindi worse **[M]** | best cheap *closure* detector; patch + retrain |
| **wawa-lipsync** 0.0.2 (MIT) | main-thread `AnalyserNode` fft 2048 (default smoothing 0.8) → 7 band energies + centroid → hand-written score rules → 15 Oculus **[V]** | main thread | 15 Oculus | **217–233 ms** best lag **[M]** | rules tuned on English | **reject**: laggy, never closes lips (0/34 en) **[M]**; `connectAudio` needs an `<audio src>`, not a `MediaStream` **[V]** |
| **wLipSync** 1.3.1 (mrxz, MIT; npm 2026-08-06) | WASM port of uLipSync (MFCC + per-speaker profile) in an AudioWorklet **[S]** | audio thread | A/I/U/E/O (+sil) per profile **[S]** | n/m | needs a profile made in **Unity** uLipSync **[S]** | possible VRM-path alternative; unmeasured |
| **OVRLipSync** (Meta) | DNN visemes | Unity/Unreal/native only | 15 Oculus | ~10 ms frames | n/a | **end-of-life** ("will not receive further updates"); no web build **[S]** |
| **Rhubarb (WASM)** | offline phonetic recogniser over a whole file **[S]** | Worker | 6–9 Preston-Blair shapes | whole-clip, not streaming | English | cached audio only |
| **wav2vec2-based** (LAM-A2E → `wav2arkit_cpu` ONNX, Apache-2.0) | wav2vec2-base-960h encoder + expression decoder → 52 ARKit @30 fps **[V]** | onnxruntime-web WASM/WebGPU | 52 ARKit incl. brows/eyes | non-causal; best alignment **leads audio 100–167 ms** **[M]**, i.e. needs that lookahead | English encoder; hi r 0.53–0.56 **[M]** | **not on phones**: 402 MB weights, RTF 0.49 single-thread on a Xeon **[M]** |
| **NVIDIA Audio2Face-3D** v2.3/v3.0 | regression/diffusion, ONNX-TRT, open weights 2025-09-24 **[S]** | server GPU | ARKit-52 + emotion | server round-trip | English + Mandarin training **[S]** | offline teacher (sibling §5.5) |
| **Azure Speech visemes / blend shapes** | `visemeReceived` with `audioOffset`; 3D blend shapes for some locales **[V]** | Azure TTS voices only | 22 viseme ids | aligned | hi-IN viseme ids delivered (this bench used them) **[M]** | ground truth / Voice Live path only; not our gpt-realtime voice |

---

## 5. The bench: what audio-only lip-sync actually achieves on Hindi **[M]**

### 5.1 Method

- **Stimuli** (`bench/gen.mjs`): Azure Speech SDK, `Riff24Khz16BitMonoPcm`, with `visemeReceived` events recorded
  (`audioOffset`/10⁴ = ms).
  - 5 Hindi texts (3 Devanagari, 1 Devanagari+English science, 1 numerals+units) × `hi-IN-SwaraNeural` and `hi-IN-MadhurNeural`.
  - 2 English texts × `en-IN-NeerjaNeural` and `en-IN-PrabhatNeural`.
  - Totals: **14 utterances, 93.9 s Hindi + 29.8 s English, 84 Hindi and 34 English bilabial segments**.
- **Ground truth.** Map Azure's 22 viseme ids to the Oculus 15 with TalkingHead's own table (`examples/azure-audio-streaming.html`) **[V]**.
  Sample at 60 fps. Mouth openness is a fixed table (aa 1.0, O .75, E .7, I .5, kk .45, U .4, RR .4, DD .35, TH/CH/nn .3,
  SS .25, FF .15, **PP 0**, sil 0), smoothed with a one-pole filter (τ 50 ms).
  - The table is shared with the viseme classifiers, which *favours* them. The RMS arm never sees it.
- **Arms** (`bench/bench.mjs`): audio is upsampled to 48 kHz and fed **causally in 128-sample quanta**. Each
  arm's output is read at 60 fps rAF instants, using only what was available by then.
  - **HeadAudio:** the unmodified `modules/processor.mjs` + `classifier.mjs` + `dist/model-en-mixed.bin`. The
    node-side easing (`update(dt)`, sigmoid, 100 ms ramps, per-viseme maxima) is re-implemented line-for-line,
    *including* its `if (viseme)` test. Variants: aa-fix; `speakerMeanHz` 220 for female and 120 for male; 120 ms minimum hold.
  - **wawa-lipsync:** the unmodified `src/lipsync.ts`, bundled with esbuild. `AnalyserNode` is emulated per the Web
    Audio spec: Blackman window, |X|/N, smoothing τ = 0.8, dB → byte with −100/−30, `getByteFrequencyData` each rAF.
  - **RMS:** last 512 samples, `(rms − 0.01) × 6` clamped, then one-pole τ 50 ms. This is the tech-and-market §2.2 snippet.
  - **wav2arkit:** onnxruntime-web 1.30 WASM in Node. Whole-utterance inference, `jawOpen` and
    `jawOpen + ½·mouthLowerDown − ½·mouthClose`, plus independent 1,000/500 ms chunks for latency.
- **Metrics.**
  - Pearson r of mouth openness against ground truth, at **one fixed lag per arm per language**: deployment needs a
    constant compensation. The lag searched is −100…+250 ms.
  - 15-class and 4-group (sil / closed / vowel / consonant) frame accuracy.
  - **Bilabial closure recall:** the fraction of ground-truth PP segments during which the arm's openness drops below 0.2.
  - **False closure:** the share of ground-truth vowel frames where openness is below 0.2.
- **Cost.** `process.hrtime` around every `process()` call (HeadAudio) and every `processAudio()` call (wawa, which
  includes a JS FFT the browser does natively). CPU: 4-vCPU Intel Xeon @ 2.1 GHz container, Node 22.22.

### 5.2 Results

| arm | lang | fixed lag | r(open) | r at lag 0 | 15-class acc | 4-group acc | PP closures hit | vowel frames closed |
|---|---|---|---|---|---|---|---|---|
| HeadAudio as shipped | hi | 0 | 0.431 | 0.431 | 0.287 | 0.506 | 55/84 | 35.1% |
| | en | 33 | 0.521 | 0.491 | 0.349 | 0.551 | 24/34 | 32.6% |
| HeadAudio aa-fix | hi | 33 | 0.411 | 0.404 | 0.311 | 0.518 | 54/84 | 34.4% |
| | en | 33 | 0.511 | 0.482 | 0.354 | 0.554 | 24/34 | 33.4% |
| HeadAudio aa-fix + speakerMeanHz | hi | 33 | 0.443 | 0.429 | 0.292 | 0.505 | 50/84 | 28.5% |
| | en | 50 | 0.534 | 0.495 | 0.328 | 0.542 | 23/34 | 24.2% |
| HeadAudio + 120 ms hold | hi | 83 | 0.155 | 0.143 | 0.134 | 0.366 | 14/84 | 7.7% |
| | en | 83 | 0.263 | 0.186 | 0.132 | 0.353 | 2/34 | 2.3% |
| wawa-lipsync | hi | 217 | 0.450 | 0.353 | 0.262 | 0.468 | 11/84 | 13.0% |
| | en | 233 | 0.518 | 0.389 | 0.229 | 0.500 | 0/34 | 8.6% |
| **RMS** | hi | 0 | **0.563** | **0.563** | n/a | n/a | 28/84 | 15.9% |
| | en | 0 | **0.697** | **0.697** | n/a | n/a | 17/34 | 9.3% |
| RMS × HeadAudio PP/FF veto | hi | 0 | 0.550 | 0.550 | n/a | n/a | 34/84 | 17.7% |
| | en | 0 | 0.693 | 0.693 | n/a | n/a | 17/34 | 9.3% |
| wav2arkit `jawOpen`, offline, per-utterance best lag | hi | −100…−167 (two at +267/+300) | 0.525 | 0.355 | n/a | n/a | n/m | n/m |
| | en | −100…−133 | 0.581 | 0.274 | n/a | n/a | n/m | n/m |
| wav2arkit jaw + lip combo, best lag | hi / en | as above | 0.556 / 0.715 | n/a | n/a | n/a | n/m | n/m |

| cost | p50 | p99 | p99.9 | max | budget |
|---|---|---|---|---|---|
| HeadAudio `process()` per 128-sample quantum (n = 46,403) | 0.005 ms | 0.076–0.088 ms | 0.27–0.32 ms | 3.6–6.7 ms (13 overruns, JIT warm-up **[U]**) | 2.667 ms |
| wawa `processAudio()` per rAF, incl. JS FFT (n = 7,430) | 0.19 ms | 0.60–0.71 ms | n/a | 5.7–7.8 ms | 16.7 ms frame |
| wav2arkit WASM, 4 threads | 165 ms per audio-second; 1 s chunk 181 ms med / 291 p90; 0.5 s chunk 102 / 175 | | | | real time |
| wav2arkit WASM, 1 thread | **491 ms per audio-second**; 1 s chunk 473 / 548; 0.5 s chunk 277 / 306 | | | | real time |

Ranges cover 2–3 identical reruns. The arms are deterministic; the timing varies.

### 5.3 What the numbers mean

1. **The jaw should follow loudness.** Speech energy is mostly vowel energy, and the open jaw *is* the vowel. RMS
   tracks it at zero lag and beats every classifier on openness in both languages. That holds even though the
   openness table was written for classifiers.
2. **Closure is the classifiers' only win, and it costs chatter.** HeadAudio closes on 65% of Hindi bilabials,
   against 33% for RMS. But it also closes on 35% of vowel frames: its 15-way decisions flip every 16 ms hop.
   - HeadAudio issue #3 (2026-08-15) measured the same thing on Spanish: 13 changes/s, median shape 64 ms, 74% of shapes under 100 ms **[S]**.
   - The fix proposed there, a 120 ms minimum hold, **halves the chatter but destroys accuracy** here (r 0.43 → 0.16; closures 55 → 14). Hold time is the wrong knob.
   - The right structure is RMS for the jaw and the classifier only for **lip shape** (closed / rounded / spread / labiodental) at reduced weight. My crude veto barely moved the closure count (28 → 34 of 84). A tuned or learned combiner is the v1.5 student's job.
3. **Hindi costs about 0.1 r for everyone.** All three learned or tuned arms are English-trained: HeadAudio on Kokoro
   English, wav2vec2-base-960h on LibriSpeech, wawa's hand rules. Hindi has more bilabial-aspirate clusters
   (भ /bʱ/, फ /pʰ/, often [f] in Hinglish) and nasalised vowels. **Retraining HeadAudio's prototypes on our own Hindi
   tutor audio** (sibling §5.6; ~30 s compile, 14 kB model **[V]**) is the cheapest next experiment, and this bench is its gate.
4. **wav2vec-class models anticipate.** Their best alignment *leads* the acoustic phone by 100–167 ms, as real lips
   do, because they look at future audio.
   - On a live WebRTC stream that means 100–167 ms of lookahead, i.e. delaying audio, which §6 forbids.
   - Run causally on 0.5–1 s chunks, they also cost 0.28–0.47 s per chunk on one Xeon thread.
   - **Not viable in the browser on a ₹10k phone**, which independently confirms sibling TL;DR-1.
5. **wawa-lipsync is the wrong tool.** Its `AnalyserNode` smoothing (0.8) plus a 10-frame history average gives
   ~220 ms of lag. It closed lips on 0 of 34 English bilabials.

### 5.4 Caveats (what this bench does *not* show)

- **The ground truth is Azure's phone alignment of Azure TTS audio, not video of real lips.** Acoustic phone onsets
  lag real articulatory onsets. That is part of why wav2vec "leads".
- **The stimuli are Azure Neural voices, not the gpt-realtime-2.1 voice we ship.** The same harness should be re-run
  on recorded gpt-realtime audio once an aligner gives ground truth (sibling §5.5 step 2).
- **"Openness r" is a proxy.** Perceived naturalness needs a human A/B (§11 E-4).
- **The sample is small:** n = 14 utterances and 2 voices per language. The differences between HeadAudio variants
  (±0.03 r) are within noise. RMS vs HeadAudio (+0.13 r on hi, +0.18 on en) and wawa's lag are not.
- **Costs were measured on a server core in Node, not on a phone in a WebView.** §9 gives the conversion assumptions.

### 5.5 HeadAudio patches we carry (vendored)

```diff
// modules/headaudio.mjs  _onmessage, case 'viseme'
-        if ( viseme ) {
+        if ( viseme !== null && viseme !== undefined ) {   // viseme_aa has id 0
```
Also carry:
- per-voice `speakerMeanHz`: Swara-like voices 220, Madhur-like 120. It lowered false closure 35% → 28.5% on hi **[M]**.
- a Hindi-retrained `model-hi-tutor.bin`, built from our tutor voices plus aligner marks.

### 5.6 Reproduce

```
cd docs/research/avatar/bench   # scripts assume sibling clones: ../met4citizen_HeadAudio, ../wass08_wawa-lipsync
npm i microsoft-cognitiveservices-speech-sdk esbuild onnxruntime-web @gltf-transform/{core,extensions,cli} meshoptimizer
set -a; . /home/user/Taxila/.env.local; set +a        # Speech key; never printed
node gen.mjs                      # 14 WAV + viseme JSON (stim/*.json are committed; WAVs are not)
npx esbuild <wawa>/src/index.ts --bundle --format=esm --outfile=wawa.mjs
node bench.mjs                    # -> bench-result.json (committed)
T=4 node w2a.mjs; T=1 node w2a.mjs; node w2adbg.mjs   # needs w2a/wav2arkit_cpu.onnx(+.data, 402 MB)
node glbstat.mjs <glbs...>
```

---

## 6. Wiring on the WebRTC path (implementable)

### 6.1 Rules

1. **Playback: one unmuted `<audio>` element** with `srcObject = remoteStream`. This is the AEC reference path and
   is unchanged from the voice stack, so it needs no echosim re-run.
2. **Analysis: `ctx.createMediaStreamSource(remoteStream) → AnalyserNode`.** It is **never** connected to
   `ctx.destination`, so no second audible path exists.
   - Chromium does not feed a remote `MediaStream` to WebAudio until a media element consumes it, and the `<audio>` element in rule 1 satisfies that **[V, HeadAudio `openai.html` comment] [S]**.
3. **No `DelayNode` on audible audio.** HeadAudio's README suggests one (50–100 ms) **[V]**. It would mean replaying
   through WebAudio, which leaves the AEC path (§0-8). Lips may trail audio by up to ~45 ms: ITU-R BT.1359 puts
   audio-leads-video detectability at +45 ms and acceptability at +90 ms **[S]**. The RMS jaw has ~0 algorithmic lag
   and HeadAudio has 33–50 ms **[M]**, so we are inside the budget without delaying anything.
4. **Render loop: TalkingHead's own rAF, capped at 30 fps.** The lip driver runs in its `update(dt)` hook, so the
   lips and the render share one clock.
5. **Barge-in:**
   - `input_audio_buffer.speech_started` and `output_audio_buffer.cleared/stopped` on the data channel force the mouth to rest with an 80 ms release.
   - The RMS gate does this on its own when audio stops, but the event is faster and covers the jitter-buffer tail.

### 6.2 Main-thread lip driver (zero custom audio-thread code)

```ts
// lipdriver.ts: runs inside TalkingHead's update(dt) at ≤30 fps. MIT HeadAudio modules are vendored.
import { MFCC } from "./vendor/headaudio/mfcc.mjs";
import { Classifier } from "./vendor/headaudio/classifier.mjs";
import * as P from "./vendor/headaudio/parameters.mjs";

export function createLipDriver(head: any, remote: MediaStream, voice: { speakerMeanHz: number }, model: any[]) {
  const ctx: AudioContext = head.audioCtx;                    // reuse TalkingHead's context
  const src = ctx.createMediaStreamSource(remote);
  const an = ctx.createAnalyser(); an.fftSize = 2048; an.smoothingTimeConstant = 0;
  src.connect(an);                                            // NOT to destination: AEC path untouched
  const td = new Float32Array(an.fftSize);
  const mfcc = new MFCC({ speakerMeanHz: voice.speakerMeanHz });
  const clf = new Classifier({ silSensitivity: 1.2 }); clf.import({ model, reset: true });
  const ratio = ctx.sampleRate / 16000, blk = new Float32Array(512), v = new Float32Array(P.MFCC_COEFF_N_WITH_DELTAS);
  let jaw = 0, rest = false;
  const SHAPE: Record<number, Record<string, number>> = {     // lip SHAPE only; jaw comes from RMS
    5: { mouthClose: 0.8, mouthPressLeft: 0.4, mouthPressRight: 0.4 },          // PP
    9: { mouthRollLower: 0.5, mouthUpperUpLeft: 0.2, mouthUpperUpRight: 0.2 },  // FF
    3: { mouthFunnel: 0.4 }, 4: { mouthPucker: 0.5, mouthFunnel: 0.2 },         // O, U
    2: { mouthStretchLeft: 0.25, mouthStretchRight: 0.25 }, 1: { mouthStretchLeft: 0.15, mouthStretchRight: 0.15 },
  };
  let shape: Record<string, number> = {};
  return {
    bargeIn() { rest = true; }, resume() { rest = false; },
    update(dtMs: number) {
      an.getFloatTimeDomainData(td);
      let s = 0; for (let i = td.length - 512; i < td.length; i++) s += td[i] * td[i];
      const target = rest ? 0 : Math.min(1, Math.max(0, (Math.sqrt(s / 512) - 0.01) * 6));  // gate+gain: tune per voice
      const a = 1 - Math.exp(-dtMs / (target > jaw ? 40 : 80));                          // fast open, slower close
      jaw += a * (target - jaw);
      // latest 32 ms -> 16 kHz: boxcar-average `ratio` samples (crude anti-alias; Opus at 24 kHz has energy to 12 kHz),
      // then the same pre-emphasis (0.97) and tanh compression HeadAudio's processor applies around MFCC
      const r = Math.round(ratio); let prev = 0;
      for (let i = 0; i < 512; i++) { let acc = 0; const e = td.length - (512 - i) * r;
        for (let k = 0; k < r; k++) acc += td[e + k] ?? 0; const x = acc / r; blk[i] = x - 0.97 * prev; prev = x; }
      mfcc.compute(blk, v);
      for (let j = 0; j < P.MFCC_COEFF_N; j++) v[j] = Math.tanh(v[j]);
      const vis = jaw > 0.02 ? clf.predict(v).viseme : 14;
      const want = (vis !== null && SHAPE[vis]) || {};
      for (const k of new Set([...Object.keys(shape), ...Object.keys(want)])) {
        const cur = shape[k] ?? 0, tgt = (want[k] ?? 0) * (vis === 5 ? 1 : jaw);       // PP closes even when loud
        shape[k] = cur + (1 - Math.exp(-dtMs / 50)) * (tgt - cur);
        Object.assign(head.mtAvatar[k], { newvalue: shape[k], needsUpdate: true });
      }
      const jawOut = vis === 5 ? jaw * 0.15 : jaw;                                       // closure veto
      Object.assign(head.mtAvatar.jawOpen, { newvalue: 0.55 * jawOut, needsUpdate: true });
    },
  };
}
```

Notes:
- The API calls follow HeadAudio's source **[V]**: `new MFCC({speakerMeanHz})`, `compute(block, out)`,
  `new Classifier({silSensitivity})`, `import({model, reset})` and `predict(v) → {viseme}`. Pre-emphasis and tanh
  live in `processor.mjs`, not in `MFCC`, so the driver re-applies them.
  - HeadAudio downsamples with a 32-tap polyphase sinc. The boxcar here is cruder.
  - `Classifier` majority-votes over a hard-coded `RingBuffer(6)` **[V]**. At the worklet's 16 ms hop that is a ~96 ms
    window. At a 30 Hz main-thread cadence it would be ~200 ms, so patch the ring to 3 to keep the window near 100 ms.
  - **This main-thread variant is not what §5 benchmarked** (§5 ran the worklet processor). Re-run `bench.mjs` with
    the driver's front-end before you ship it (§11 E-1).
- At 30 fps this classifies 30 times per second instead of 62.5. That costs nothing in closure detection: ground-truth
  PP segments are ≥ 40 ms **[U]**. It removes the custom per-quantum code on the audio thread, which is the reason for this design.
- If a later measurement shows the worklet path is safe on device (§11 E-5), HeadAudio's own worklet can replace the
  analyser tap with no change to the `mtAvatar` interface.

### 6.3 Gluing it together

```ts
pc.ontrack = (e) => {
  if (e.track.kind !== "audio") return;
  audioEl.srcObject = e.streams[0]; audioEl.muted = false; audioEl.play();   // playback = AEC path, unchanged
  lips = createLipDriver(head, e.streams[0], tutor.voice, tutor.lipModel);
};
head.opt.update = (dt: number) => { lips?.update(dt); face.update(dt); };    // one clock: TalkingHead's rAF
dc.onmessage = ({ data }) => {
  const ev = JSON.parse(data);
  if (ev.type === "input_audio_buffer.speech_started") { lips.bargeIn(); face.listen(); }
  if (ev.type === "output_audio_buffer.started")       { lips.resume(); face.speak(); }
  if (ev.type === "output_audio_buffer.stopped")       { face.idleOrWait(); }
  if (ev.type === "response.function_call_arguments.done" && ev.name === "emote") face.emote(JSON.parse(ev.arguments));
};
```

---

## 7. Beyond the lips: the face states Taxila needs

Mouth accuracy is necessary, but the other channels decide "feels like a real person". Every row below is a
TalkingHead primitive **[V]**, driven by realtime events and the Director, never by recognising the child's emotion
(rejected #8).

| state | trigger | face program (TalkingHead calls) |
|---|---|---|
| **idle / waiting** | no audio either way | mood `neutral`; `avatarIdleEyeContact` ≈ 0.4 (a teacher looks at the child more than the default 0.2); breathing; blinks 1–8 s |
| **listening** (child talks) | `input_audio_buffer.speech_started` | `lookAtCamera(…)` held; eye contact ≈ 0.8; slight `browInnerUp` 0.1; **no nods during the child's speech**. A visual nod is not the rejected audio backchannel, but it is unmeasured: A/B first (§11 E-6) |
| **thinking** (child stopped, no audio yet) | `input_audio_buffer.speech_stopped` → until `output_audio_buffer.started` | gaze aversion `lookAt` up and to the side for 400–900 ms; `browInnerUp` 0.2; mouth closed. This covers the 600 ms+ voice-to-voice gap with a human behaviour |
| **speaking** | `output_audio_buffer.started` | `avatarSpeakingEyeContact` 0.6; `lookAtCamera(500)` and `speakWithHands()` at sentence starts (gap > 150 ms in RMS, the pattern HeadAudio's README shows **[V]**); head motion from RMS peaks (prosody nods, sibling §6.2) |
| **praise / proud / surprised / concerned** | Director move → `emote` tool → mood `happy` or `love` / emoji template / custom ARKit preset | smile = `mouthSmileLeft/Right` + `cheekSquint`; hold ≥ 1.5 s; decay over 800 ms; cap intensity for "concerned" (no `sad` mood at full strength with children) |
| **barge-in** | `speech_started` during speech | mouth to rest in 80 ms; eyes to camera; small `browInnerUp`: "oh, you were saying?" |

The same states drive a later video avatar, through `FaceFrame` (sibling §5.1).

---

## 8. Tutor selection (multiple characters)

**One base, many tutors.** Build every character from **one MPFB base topology**:
- **Shared:** the same head topology, the 52+15 shape keys, the Mixamo skeleton and the retarget offsets.
- **Per character:**
  - proportions, through MPFB age, gender and weight sliders,
  - skin, eye and hair textures,
  - a hair mesh with dynamic bones,
  - an outfit (saree, kurta, salwar, shirt-and-sweater, lab coat),
  - accessories (bindi, specs, watch),
  - per-character `baseline` blend-shape offsets for personality (a resting smile for "Didi", a slight brow for "Sir").
- **Why:** lip, closure and emotion tuning happens once, and a per-character bug can only be a texture or mesh bug.

**Character manifest** (versioned, in the content repo):

```json
{ "id": "asha-didi", "rev": 3, "glb": "/avatars/asha-didi.r3.glb", "bytes": 2310000,
  "body": "F", "ageBand": "25-30", "style": "stylised",
  "voice": { "realtimeVoice": "<gpt-realtime voice id>", "speakerMeanHz": 220, "lipModel": "/lip/model-hi-swara.r1.bin" },
  "rest": { "baseline": { "mouthSmileLeft": 0.08, "mouthSmileRight": 0.08 }, "idleEyeContact": 0.45 },
  "camera": { "view": "upper", "y": 0.02 }, "thumb": "/avatars/asha-didi.r3.webp" }
```

**Picker UX on a ₹10k phone:**
- Show **static WebP thumbnails** (or ≤ 3 s pre-rendered MP4 loops), not live 3D. Loading 6 GLBs at 2 MB each plus
  morph textures would cost 12 MB down and ~80 MB GPU.
- Load the chosen GLB only, then cache it in Cache Storage under a key that includes `id` + `rev`.
- Put voice identity in the key too (`voice.realtimeVoice`, `lipModel` rev). Rejected #13 says the old voice kept
  playing from IndexedDB.
- **Character and voice are bound.** Switching tutor ends the realtime session and starts a new one. Never swap the
  face mid-utterance (rejected `engine-per-phrase`).

**Diversity.** Ship at least: a woman in her late 20s ("Didi"), a woman in her 40s ("Ma'am"), a man in his 30s
("Bhaiya/Sir"), an older man ("Dadaji" storyteller) and one stylised non-human (a friendly robot or animal) for
classes 1–3. Use regional variation in dress and skin tone rather than one "Indian" default **[U, design to validate
with parents]**.

---

## 9. Performance budget for ₹10k Android (WebView) and how to verify

The target SoCs in this band are MediaTek Helio G81/G85/G88 (Mali-G52 MC2), Dimensity 6100+/6300 (Mali-G57 MC2),
Snapdragon 4 Gen 2 / 4s Gen 2 (Adreno 613/611) and Unisoc T606/T7250 (Mali-G57 MP1). They have 4–6 GB RAM, 720p–1080p
screens and DPR 2–2.6 **[U: market knowledge, not re-verified this session; confirm in the device lab]**.

| knob | v1 setting | why |
|---|---|---|
| frame rate | `modelFPS: 30` (default) **[V]**; drop to 24 when hot | faces read fine at 30; halves GPU and CPU vs 60 |
| resolution | `modelPixelRatio = min(1, 1.5 / devicePixelRatio)` | DPR 2.6 at full res is 6.8× the pixels of DPR 1; the avatar box is ~40% of the screen |
| antialias | keep TalkingHead's `antialias:true` only if DPR ≤ 1.5 after capping, else off | MSAA on Mali tilers is cheap-ish but not free **[U]** |
| lights | ambient + 1 directional (TalkingHead defaults), spot off **[V]**; shadows off **[V]** | |
| geometry | ≤ 30k tris, ≤ 8 draw calls, morphs on head only (§3.1) | |
| textures | ≤ 1024², KTX2 ETC1S/UASTC via `KTX2Loader` (GPU-compressed) | WebP saves bytes, not GPU memory |
| pause | stop rendering when `document.hidden`, when the avatar is scrolled out, and during long non-speaking module screens | thermal; battery |
| fallback | WebGL2 missing, or measured p50 fps < 20 for 5 s → Rive 2D tutor (tech-and-market §2.3) driven by the same jaw/shape values | some WebGL2 drivers fail with > ~241 morph targets (three.js #24545, closed "not planned") **[S]**; we stay at 67 |
| WebGPU | **not for v1**: three.js WebGPURenderer morphs measured ~22× slower on GPU than WebGL (0.08 vs 1.80 ms) in an open issue (#29980) **[S]** | |

**Measured CPU on this container, and what it implies [M → U]:**
- The lip driver does RMS over 512 samples, one MFCC of 512 points and 50 Mahalanobis distances per frame.
  HeadAudio's processor measured 0.005 ms p50 and 0.08 ms p99 per quantum here; one classification per frame is a
  few of those.
- Assume a Cortex-A55 little core is 4–6× slower than this Xeon core **[U]**. That puts the driver at ≈ 0.1–0.5 ms per
  30 fps frame on the main thread, under 2% of a 33 ms frame.
- The cost that matters is GPU skinning plus morphs, and fill rate. Those must be measured on devices.

**Device verification (must pass before shipping):**
1. Run a headless-free device lab (BrowserStack or real phones), with 3 SoCs from the list.
2. Play a 45-minute scripted lesson. Log `requestAnimationFrame` deltas, `performance.memory` where available, and
   battery temperature through Capacitor.
3. Pass bars: p50 ≥ 28 fps, p95 frame ≤ 50 ms, no WebView OOM, and ≤ 6 °C rise over 45 min **[U, bars to confirm with owner]**.
4. **Run echosim** (the floor) before and after enabling the avatar. Its CPU contention is exactly the risk
   companion-tech §13 names.

---

## 10. Recommended v1 stack (decision)

| layer | choice | reverse if |
|---|---|---|
| renderer | **three.js r180, pinned to TalkingHead's peer** | a three.js upgrade is needed for KTX2/WebGL fixes. Bump both together |
| avatar runtime | **TalkingHead 1.7, vendored at a pinned commit**, standalone mode, mounted imperatively in React | we need multiple avatars or a custom scene. Switch to `avatarOnly` with our own renderer, same runtime |
| art | **stylised 3D, one MPFB base topology, commissioned Indian characters** (Faceit/MPFB shape keys) | a 5-child + 5-parent blind preference test prefers anime (→ VRoid → TalkingHead conversion) or 2D (→ Rive) |
| lip-sync | **RMS jaw (zero lag) + HeadAudio lip-shape classes (aa-fixed, per-voice `speakerMeanHz`, Hindi-retrained), main-thread tap** | the causal student (sibling §5.2) beats it on this bench: hi r ≥ 0.65, PP recall ≥ 70%, vowel false-close ≤ 12% |
| audio path | **unchanged `<audio>` playback; analysis-only tap; no delay** | never on the live path without an echosim pass |
| expression | Director intent → `emote` tool → TalkingHead moods / ARKit presets; autonomic layer from TalkingHead | n/a |
| picker | static thumbnails + a lazy single GLB, keys include `id`+`rev`+voice | n/a |
| later video-real | `FaceFrame` (ARKit-52 + pose + gaze) feeds a Gaussian head or a server video avatar | n/a |

**Not v1:** R3F (no gain), Babylon.js (5× JS, no face layer), model-viewer (no morph API), wawa-lipsync (220 ms lag,
no closures), any wav2vec/HuBERT model on device (402 MB, RTF ≈ 0.5 on a server core), Ready Player Me (dead),
Avaturn/MetaPerson (selfie generators at $300–800/mo), WebGPU renderer (morph regression), and a `DelayNode` on
audible audio (AEC).

---

## 11. Experiments that gate the decisions (with pass bars)

| id | experiment | pass bar | cost |
|---|---|---|---|
| E-1 | Retrain HeadAudio prototypes on 30–60 min of *our* gpt-realtime tutor voice with Hindi aligner marks; re-run `bench.mjs` | hi PP recall ≥ 70% **and** vowel false-close ≤ 20% **and** r not below as-shipped HeadAudio | 1 day |
| E-2 | Learned combiner: RMS jaw + HeadAudio log-distances → 6 mouth channels (logistic/GRU, < 50 k params) on the same bench | beats RMS r and HeadAudio PP recall at once | 2 days; feeds the sibling student |
| E-3 | Re-run the bench on **gpt-realtime-2.1** audio (`voice/hl-probe-2026-10-02` WAVs) with forced-aligned ground truth | same ranking as Azure-TTS bench (RMS > HA on r, HA > RMS on closure) | 1 day |
| E-4 | Human A/B, 20 clips × 3 arms (RMS-only / RMS + shape / student), 10 adults + 10 children, "which teacher's mouth looks right?" | chosen arm preferred ≥ 60% | 1 day |
| E-5 | Device lab: TalkingHead + lip driver on 3 ₹10k SoCs, 45 min (§9) + echosim before/after | §9 bars; echosim tables unchanged | 2 days |
| E-6 | Listening-nod A/B (visual only) vs still-attentive face | no drop in child turn length; preference ≥ 50% | 1 day |
| E-7 | Audio-to-glass offset per device class (click + flash, 240 fps camera; sibling §5.4) | lips within −20…+45 ms of audio | ½ day |

---

## 12. Candidate `context/rejected.md` entries from this research

- **`wawa-lipsync-on-live-audio`**:
  - **Tried:** the real 0.0.2 code on 14 hi/en utterances.
  - **Broke:** its best alignment lags the audio by 217–233 ms, and it closed on 0/34 English bilabials **[M]**.
  - **Reverse if:** a new version removes the analyser smoothing and history averaging, and re-benches below 60 ms lag.
- **`viseme-min-hold`**:
  - **Tried:** a 120 ms minimum viseme hold (HeadAudio #3) to stop chatter.
  - **Broke:** r fell 0.43 → 0.16 and closures fell 55 → 14 of 84 **[M]**. Smoothness bought by holding is wrong
    mouths held longer.
- **`wav2vec-on-device`**:
  - **Tried:** `wav2arkit_cpu` in onnxruntime-web.
  - **Broke:** 402 MB of weights, 491 ms per audio second on one Xeon thread, and 100–167 ms of anticipation that
    needs lookahead the WebRTC path doesn't have **[M]**.
- **`webaudio-playback-for-lipsync`** (preventive): HeadAudio's demo pattern of a muted `<audio>` + WebAudio playback
  takes the tutor's voice off Chromium's AEC reference **[S]**. Never adopt it without echosim.
- **`model-viewer-for-faces`** (preventive): it has no morph-target API **[V]**.

---

## Sources

Primary code read (cloned 2026-10-02):
- met4citizen/TalkingHead @ b3e277b (2026-09-25): `README.md`, `modules/talkinghead.mjs`, `examples/azure-audio-streaming.html`, `blender/*`. https://github.com/met4citizen/TalkingHead
- met4citizen/HeadAudio @ d3af5f9 (2025-12-10): `README.md`, `modules/{processor,classifier,headaudio,mfcc,parameters}.mjs`, `dist/headaudio.min.mjs`, `openai.html`. https://github.com/met4citizen/HeadAudio
- wass08/wawa-lipsync @ 312dc31 (2025-11-07): `packages/wawa-lipsync/src/lipsync.ts`. https://github.com/wass08/wawa-lipsync
- pixiv/three-vrm (HEAD 2026-09-09): `packages/three-vrm-core/src/expressions/VRMExpressionPresetName.ts`. https://github.com/pixiv/three-vrm
- google/model-viewer (HEAD 2026-10-01), `packages/model-viewer/src` (no "morph"). https://github.com/google/model-viewer
- three.js 0.180 `src/renderers/webgl/WebGLMorphtargets.js`, `ShaderChunk/morphtarget_vertex.glsl.js`.
- npm registry metadata for versions and dates: @react-three/fiber, three, @pixiv/three-vrm, @babylonjs/core, wawa-lipsync, @met4citizen/talkinghead, @met4citizen/headaudio, @google/model-viewer, wlipsync, onnxruntime-web (fetched 2026-10-02).
- myned-ai/wav2arkit_cpu model card and file listing: https://huggingface.co/myned-ai/wav2arkit_cpu
- aigc3d/LAM_Audio2Expression: https://github.com/aigc3d/LAM_Audio2Expression

Secondary:
- [Netflix acquires Ready Player Me (Variety, 2025-12)](https://variety.com/2025/digital/news/netflix-acquires-ready-player-me-games-avatar-creation-1236612915/)
- [Ready Player Me discontinued 2026-01-31 (Avatar SDK blog, a vendor)](https://avatarsdk.com/blog/2026/01/15/switch-from-ready-player-me-to-avatar-sdk-fast-familiar-production-ready/)
- [Avatar platforms in 2026: who's alive (Avatar SDK blog, vendor; discloses bias)](https://avatarsdk.com/blog/2026/08/31/avatar-platforms-2026-whos-alive-whos-gone/)
- [Avatar SDK pricing](https://avatarsdk.com/pricing-cloud/)
- [Avaturn pricing (Techjockey)](https://www.techjockey.com/detail/avaturn)
- [VRoid Studio guidelines](https://vroid.com/en/studio/guidelines)
- [Mixamo in 2026 (Cinevva)](https://app.cinevva.com/guides/mixamo-to-blender-2026)
- [Mixamo FAQ (Adobe)](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html)
- [Oculus Lipsync end-of-life (Meta docs)](https://developers.meta.com/vr/documentation/unreal/audio-ovrlipsync/)
- [wLipSync](https://github.com/mrxz/wLipSync)
- [rhubarb-lip-sync-wasm](https://github.com/danieloquelis/rhubarb-lip-sync-wasm)
- [NVIDIA Audio2Face-3D paper](https://arxiv.org/abs/2508.16401)
- [NVIDIA open-sources Audio2Face (2025-09)](https://gadgetbond.com/nvidia-audio2face-ai-voice-animation-open-source/)
- [Announcing Babylon.js 9.0 (Microsoft, 2026-03-26)](https://blogs.windows.com/windowsdeveloper/2026/03/26/announcing-babylon-js-9-0/)
- [three.js #24545 morph targets on mobile WebGL2](https://github.com/mrdoob/three.js/issues/24545)
- [three.js #29980 WebGPURenderer morph perf](https://github.com/mrdoob/three.js/issues/29980)
- [HeadAudio #3 lip timing (2026-08-15)](https://github.com/met4citizen/HeadAudio/issues/3)
- [Echo cancellation with Web Audio and Chromium (crbug 687574)](https://focused.io/lab/echo-cancellation-with-web-audio-api-and-chromium)
- [Browser voice AI pitfalls 2026 (AEC)](https://dev.to/orca_forge/browser-voice-interaction-ai-pitfall-guide-2026-16-common-traps-with-aec-getusermedia-and-40hd)
- [ITU-R BT.1359-1](https://www.itu.int/dms_pubrec/itu-r/rec/bt/R-REC-BT.1359-1-199811-I!!PDF-E.pdf)
