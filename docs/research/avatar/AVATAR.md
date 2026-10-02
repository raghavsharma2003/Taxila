# AVATAR.md: build spec for the Taxila 3D tutor (v1), with the v2 video path

Date: 2026-10-02. Status: **build spec**, synthesised from the seven avatar research docs in this folder and their
adversarial graphics reviews. Where a review corrected its doc, this spec follows the review. Where two docs
disagreed, this spec decides and says so in §12.

Inputs (read for detail; this file does not repeat their evidence):

| doc | what it settled |
|---|---|
| `web-3d-talking-heads.md` (+ R-1…R-10, addendum C-1…C-3, N-1…N-4) | renderer stack, the Hindi lip-sync bench, avatar sources, WebRTC wiring |
| `audio-to-face-ml.md` (+ G-1…G-8) | `FaceFrame`, teacher-on-server / student-on-phone, sync model, A2F-3D licence |
| `character-creation.md` (+ R-0…R-10) | S2 stylisation, shared MPFB topology, cast, headless-Blender factory, gates G1–G12 |
| `performance-android.md` (+ P-0…P-8) | tier budgets, meshopt/KTX2, worker renderer, tier detection, governor |
| `behaviour-expressiveness.md` (+ GR-1…GR-10) | floor FSM, gaze/blink/nod/smile rules, controller prototype and invariants |
| `tutor-selection-ux.md` (+ G-0…G-8) | picker flow, previews, identity and memory model, data model |
| `video-avatar-v2.md` (+ R1…R6) | video options under the Azure-only directive, economics, v2 gates |

Tags carried from the sources: **[M]** measured (script in this folder), **[V]** verified in source or a primary
document, **[S]** secondary, **[U]** unverified or estimated. **[D]** marks a decision this spec makes.
All [M] numbers were measured on a 4-core 2.1 GHz Xeon container, not on a phone, unless stated.

---

## 0. The spec on one screen

1. **Owner directive: the launch face is 3D** (2026-10-02). This supersedes PRODUCT-DESIGN §3.5 "illustrated 2D Rive
   launch face". M-UX-6 (illustrated vs realistic) is replaced by **M-AV-1**, which tests the stylisation *level*
   (S1/S2/S3) per band, not 3D against 2D. **[D]**
2. **Stack:** three.js **0.180.0** + **TalkingHead 1.7.0 vendored at `b3e277b`** in `avatarOnly` mode with our own
   renderer and loader, + **HeadAudio vendored at `d3af5f9`** (MFCC + classifier modules only). WebGL2 only. No R3F,
   Babylon, model-viewer, WebGPU or Rive. Assets are meshopt + `KHR_mesh_quantization` + KTX2 ETC1S.
3. **Audio floor:** playback stays on VoiceLink's unmuted `<audio>` element. Lip analysis is a second `AnalyserNode`
   on the **`MediaStreamAudioSourceNode` VoiceLink already creates**, never connected to `destination`. v1 phase 1 adds
   **no AudioContext, no output node, no worklet and no DelayNode**. Delay the face, never the audio.
4. **Lips v1:** the **jaw follows the RMS envelope** (best openness at zero lag: r 0.563 hi / 0.697 en [M]). Lip
   *shape* comes from patched, Hindi-retrained HeadAudio classes mapped to ARKit through a per-character matrix, at
   reduced weight. **Speech start and stop come from the tap's own VAD.** `output_audio_buffer.*` events are hints only.
5. **Sync:** a signed, per-output-route `faceDelay` is applied as a delay line on the face stream. The face is
   expected to *lead* on Bluetooth by 100–250 ms [U]. Pass bar after compensation: **−125 ms ≤ offset ≤ +45 ms**
   (ITU-R BT.1359), measured per route (E-P8).
6. **Behaviour:** a client controller owns gaze, blinks, brows, head and lean. TalkingHead keeps lips, breathing,
   pose and rendering, and its random liveliness is switched off. The floor FSM is driven by **local** signals first.
   Nods happen only in open turns, THINKING is verdict-neutral, and there is an expressive budget. Invariants from
   `behaviour-proto/sim.mjs` plus a mutation check are a CI gate.
7. **Characters:** S2 "feature-animation stylised", all built on **one MPFB (CC0) base topology**, with expression keys
   **baked through each character's identity**. Each ships **52 ARKit morphs, position-only**, on a separate head
   primitive. Four launch tutors, bounded by how many voices pass the ear test. Canonical ids are `asha`, `arjun`,
   `nandini` and one senior man whose name is not yet chosen (§5.1).
8. **Tiers:** v1 ships **face tier B** (3D-lite: ≤15k tris, ≤4 draws, GLB ≤1.5 MB, resident ≤20 MB, 30/30/20 fps).
   **B-lite** is runtime knobs on the same GLB. **D** is an illustrated plate plus mouth strip rendered from the same
   GLB. **E** is voice-only. **C (sprite rig) is cut from v1.** Tier selection has three stages: static facts, a 2 s
   probe, and one runtime governor.
9. **Selection:** the child picks at onboarding C1b from 2 / 2–3 / 2–4 tutors (B1 / B2 / B3–B4). Order is shuffled
   with a per-child seed and there is no default. Previews are muxed MP4s rendered *by the runtime itself*. **Memory is
   scoped to the child↔Taxila relationship** (`scope='taxila'` + `voiced_by`), so a switch empties nothing. Switching
   happens only between lessons. Parents get an allow-list with no reason field.
10. **v2:** pre-rendered narration video first (MuseTalk 1.5, MIT, Spot A100: ≈ $200 per character for a
    30,000-minute library [M]). Live video only as a gated premium tier. **Nothing commercially usable fits full live
    lessons at any price tier** [M + R1.3]. The Azure TTS avatar is rejected for lessons ($450 per student-month, and
    it does not take our audio).
11. **Build order:** M0 is a talking head in the dev lesson screen with the CC0 `mpfb.glb` behind a flag (days). Then
    lip shape, the controller, tiers, character 1 plus M-AV-1, the roster plus the picker, then the student model.
    Start the long poles today: GPU quota, the voice ear tests, name clearance, the art director, and the device lab (§9).

---

## 1. v1 stack: exact libraries and versions

### 1.1 Runtime (shipped to the child)

| layer | package / source | version (pin) | licence | size (min+gz) [M] | notes |
|---|---|---|---|---|---|
| renderer | `three` | **0.180.0** exact | MIT | 179 KB if all of three is imported (TalkingHead does) | TalkingHead lists `three` ^0.180.0 as a *dependency* (R-4.9). Vendor it with a bare `three` import resolved by the app, so Forge modules can never pull a second copy. Bump three and TalkingHead together |
| avatar runtime | `met4citizen/TalkingHead` `modules/talkinghead.mjs` + `dynamicbones.mjs` | **commit `b3e277b`** (v1.7.0, 2026-09-25), vendored into `src/stage/vendor/talkinghead/` | MIT (keep the © notice; it is modified) | +36 KB; **217.5 KB with three** | `avatarOnly: true` always; the patch list is in §1.3 |
| lip classes | `met4citizen/HeadAudio` `modules/{mfcc,classifier,parameters,ringbuffer}.mjs` | **commit `d3af5f9`** (0.1.0), vendored | MIT | ~5 KB + 14 KB model | the worklet processor is **not** used in phase 1 (§3) |
| loaders | `three/examples/jsm/loaders/{GLTFLoader,KTX2Loader}.js`, `libs/meshopt_decoder.module.js` | from three 0.180.0 | MIT | meshopt decoder 6.5 KB | `ktx2.setWorkerLimit(1)` (the default pool of 4 spins up 4 basis wasm instances, P-2.11) |
| texture transcoder | `three/examples/jsm/libs/basis/basis_transcoder.{js,wasm}` | from three 0.180.0 | Apache-2.0 (NOTICE in the in-app OSS screen) | **260 KB** | fetched once and cached; bundled in the APK |
| React glue | our `src/stage/TutorStage.tsx` | n/a | ours | ~10 KB [U] | mounted imperatively in `useEffect`; the rAF loop never touches React state |

The avatar chunk is **lazy-loaded outside the lesson-route JS budget** (PRODUCT-DESIGN §7.3, "≤ +150 KB br"). The
budget table gains a separate line: avatar JS ≤ 230 KB br plus the transcoder at 260 KB, fetched in parallel with the
picker. On the web this costs ≈ 2 MB once, on the first lesson (JS + transcoder + one 1.5 MB GLB). In the APK it is all
bundled. **[D]**

### 1.2 Build-time (character factory and preview renderer; never shipped)

| tool | version | licence | used for |
|---|---|---|---|
| Blender (headless) | **4.2 LTS** binary, or the `bpy==4.2.0` wheel | GPL (tool only) | S2–S9 (§5.3); `bpy` ran headless here [M] |
| MPFB 2 (MakeHuman for Blender) | pin the commit at clone | code GPLv3 (offline only); assets and output **CC0** [V] | the shared base mesh, macro sliders, Faceunits 01 / Visemes 02 packs (CC0) |
| ICT FaceKit **Light** | pin | MIT [V] | expression-quality reference only; never mix in Full-model data (different USC licence) |
| `@gltf-transform/{core,extensions,functions,cli}` | **4.5.x** | MIT | prune, dedup, reorder, quantize, meshopt; target stripping (`bench/perf/pipeline.mjs`) |
| `meshoptimizer` | lockfile pin | MIT | encoder |
| `ktx2-encoder` | **0.6.0** | MIT (basis: Apache-2.0) | ETC1S/UASTC with no `toktx` binary |
| `sharp` | lockfile pin | LGPL-3.0 (libvips): build only | texture resize |
| Playwright Chromium | 1.63 (already a devDependency) | Apache-2.0 | headless renders: QA sheets, D plates, previews, the G11 smoke test |
| ffmpeg / libx264 | 6.x | GPL (tool only); never ship `libfdk_aac` | preview mux, loudnorm |
| Faceit (Blender add-on) | per seat | paid tool | artist correctives only (an interactive human step) |
| onnxruntime-web | 1.30 | MIT | **parity reference for the v1.5 student only**. Not shipped: its wasm is 14.24 MB raw / 3.66 MB gz [M] |

### 1.3 Vendored patch list (carried in-tree, re-verified on any bump)

| id | file | patch | why |
|---|---|---|---|
| TH-1 | talkinghead.mjs `animate()` l.2411–2415 | frame cap `dt < animFrameDur − 3`; `animTimeLast += animFrameDur`, re-anchored after gaps > 2 frames | the shipped cap delivers ≈ 23 fps with judder on 60 Hz, not 30 [M-sim, R-1, C-3] |
| TH-2 | `animate()` l.2680 | keep the dt clamp for *integrators only*; pass wall time (`performance.now()` or the stamped audio clock) to `opt.update` | a clamped-dt clock loses 0.47–1.39 s per turn under long frames, and yields are dropped [M, GR-1.5, N-3] |
| TH-3 | `showAvatar()` l.1232–1242 | `opt.gltfLoader` injection (ours: KTX2Loader + MeshoptDecoder) | the stock loader has no KTX2Loader, so `KHR_texture_basisu` GLBs fail to load [V, R-3.3, P-3.1] |
| TH-4 | constructor, `start()` l.4297, `initAudioGraph`, `setMixerGain` | `opt.noAudio`: skip the AudioContext, the reverb graph, `resume()` and AudioParam automation | we never play audio through TalkingHead. Its context would also start `suspended` and throw in a worker [V, R-4.5, P-3.1] |
| TH-5 | `lookAt()` l.4051–4055 | `opt.viewportRect()` replacing `nodeAvatar.getBoundingClientRect()` | `node = null` in avatarOnly mode, so the call crashes on speech start and gestures [V, P-3.1] |
| TH-6 | `animate()` l.2683–2688 | guard `if (this.mtRandomized.length)`; we then set `mtRandomized = []` | emptying the array without the guard crashes every frame (`mtAvatar[undefined]`) [V+M, GR-1.1] |
| TH-7 | `animMoods.*.anims`, `pose` template l.424–430 | strip the `head/eyes/blink/mouth/misc` templates; pin pose `straight` (change only on idle) | uncontingent random motion, micro-frowns and shoulder shifts [V, §4.7, GR-4.4] |
| TH-8 | `Math.random` call sites | inject a seeded RNG | reproducible previews, D plates and golden frames (G11, G-PREV) [G-7] |
| HA-1 | headaudio `_onmessage` / any caller | `if (viseme !== null && viseme !== undefined)` | id 0 (`viseme_aa`) is falsy and never activates [V] |
| HA-2 | `classifier.mjs` `RingBuffer(6)` | ring of 3 at a 30 Hz cadence | keeps the vote window near 100 ms [V, web-3d §6.2] |
| HA-3 | model | `model-hi-<voice>.bin` retrained on our own tutor-voice audio (E-1) | the shipped model is trained on English Kokoro voices and loses about 0.1 r on Hindi [M] |

### 1.4 Not used in v1, and why

- **R3F:** no gain, because TalkingHead owns its loop. Its marginal cost is ≈ 87 KB, not the 298 KB once quoted; skip it anyway (R-4.8).
- **Babylon 9:** 777.8 KB gz and no face layer [M].
- **model-viewer:** has **no morph-target API** [V].
- **WebGPU:** Android WebView has no WebGPU milestone [V].
- **Rive:** 368–821 KB gz of wasm, and it would be a different-looking person; tier D replaces it.
- **wawa-lipsync:** 217–233 ms lag [M].
- **wav2vec/HuBERT models on device:** 402 MB of weights [M].
- **Draco:** morphs left unquantized; meshopt wins [M, P-2.1].
- **WebP textures:** 5.59 MB of GPU memory per 1024² [M].
- **Asset sources:** Ready Player Me is dead (2026-01-31). Avaturn, MetaPerson and VRoid are excluded on licence and directive grounds.

### 1.5 Licence denylist (CI hash-blocklist on every build)

- **Avatars:** everything in TalkingHead `avatars/` except `mpfb.glb` (brunette, brunette-t, avaturn, avatarsdk and vroid are non-commercial). HeadAudio's `julia.glb` and `david.glb` (no per-asset licence).
- **Animation:** raw Mixamo FBX at runtime (bake with legal sign-off, or author idles in-house). Mixamo renders are never used as ML training data.
- **MakeHuman CC-BY packs** (Hair 02/03, Glasses 02, Shirts 02/03, Dress 02/03, Hats, Shoes, Suits), unless attributed in-app. Prefer the CC0 packs (Glasses 01, Shirts 01).
- **Image-to-3D:** TRELLIS.2's stock pipeline (nvdiffrast/nvdiffrec are research-only). Hunyuan3D 2.1.
- **Third-party services:** Meshy, Tripo, Rodin and Polywink (Azure-only directive).
- **Behaviour rules:** Greta's GPL rule files and NVBG's XSL. Use the ideas only.
- **Models and tools:** InsightFace models. The MMS aligner (CC-BY-NC). Audio2Emotion. detect-gpu's JSON tables (do not ship them).
- **Notices to ship:** TalkingHead MIT, HeadAudio MIT, three/meshoptimizer MIT, Basis Apache-2.0 NOTICE, and, from v1.5, "Licensed by NVIDIA Corporation under the NVIDIA Open Model License".

---

## 2. `<TutorStage>`: component API and events

### 2.1 Placement and threading

- `<TutorStage>` lives inside the existing `StageFrame` (PRODUCT-DESIGN §3.5). It renders into its own `<canvas>`, and the
  layout solver gives it the frame rect and the named gaze-target rects.
- **Phase 1 (M0–M3): main thread.**
  - The rAF loop belongs to our renderer. TalkingHead is called with `animate(dt)` in `avatarOnly` mode.
  - The lip driver and the behaviour controller run in the same tick, on the same clock.
- **Phase 2 (after E-P1, E-P2 and the audio-floor gate pass):**
  - The renderer, TalkingHead, the lip driver, the controller and the compositor all move to an **OffscreenCanvas
    worker**.
  - An AudioWorklet `lipTap` (`numberOfOutputs: 0`, which Chromium pulls automatically [V-src]) sends features to the
    worker over a transferred `MessagePort`.
  - The main thread posts link, Director and module events, and sends a clock bridge every second.
  - The motivation is measured but desktop-only: under module-iframe load, the main-thread relay froze lips for
    136–303 ms, against 42–66 ms worker-direct [M, desktop proxy].
- **The public API is identical in both phases.** The phase is an implementation detail behind `TutorStageController`.

### 2.2 What the stage consumes

| from | signal | how it gets there | used for |
|---|---|---|---|
| **VoiceLink** (voice lane) | **the teacher tap**: the `MediaStreamAudioSourceNode` and `AudioContext` VoiceLink already builds in `onRemoteStream()` | **new, small:** `LevelMeter.attach(analyser, source)` stores the source, and `levels.teacher.onTap(fn)` re-fires on every reconnect (each new remote stream creates a new source) | jaw RMS, lip shapes, her VAD, prosody accents |
| VoiceLink | **the mic tap**: `levels.mic` source (local `getUserMedia` stream) | same `onTap` | child onset and offset (echo-gated), continuer-nod pauses |
| VoiceLink | `LinkEvent`s: `teacher_audio_start/end` (= `output_audio_buffer.*`), `child_speech_start/end` (PTT press/release = local; VAD = server), `teacher_interrupted`, `teacher_delta`, `teacher_done`, `response_start/done`, `connection` | `link.on()` | **hints** for the floor FSM (§4.1); the praise lexicon on her transcript; TurnClock length |
| TextLink (text lane) | the teacher tap = its `createMediaElementSource` node (there, the element *is* routed through WebAudio) | same `onTap` | same lip and behaviour pipeline |
| runtime `statusOf()` | `listening / thinking / speaking / your_turn` | prop | a cross-check only. Telemetry asserts that the face state and the UI ring agree within 300 ms (`ds-status-carriers`) |
| **Director** (`TurnResponse`) | `ui.affect` (`neutral / insight / effort`), `ui.handover`, `ui.cues[]` with `act: 'face'/'gaze'`, `move.kind` / `move.hintLevel`, `ui.layout`, `ui.apply` | `stage.direct()` | lesson affect and the hand-over type, **armed** for the next audible onset (§4.4) |
| **ModuleHost** | `ready`, `interaction`, `answer` (with the engine's `correct?`), `goal_met`, `stuck`, `error`; host command `highlight { target }` | `stage.module()` | joint attention, watching, verdict-neutral THINKING, current-answer valence |
| **layout solver** | rects for the named targets `child` (the camera axis), `canvas`, `ledge`, `protege`, `down-think`, `module:<id>`; the stage rect; DPR | `stage.setTargets()`, on layout change only | gaze geometry via `camera.unproject` onto the glass plane, with clamps (§4.3) |
| DeviceTier | the stage 1 + 2 decision (§6.3) | prop | tier, fps caps, pixel ratio |
| settings | `presentation: face / small / voice` (`ds-band-fork-older`), `reducedMotion`, `gentleFace`, `slowerVoice` | props | §6.5 |

### 2.3 Types (proposed additions to `shared/contracts.ts`)

```ts
export const ARKIT_52 = [/* canonical ARKit order, browDownLeft … tongueOut (wav2arkit_cpu config order) */] as const;
export type FaceState = "idle" | "speaking" | "yielding" | "your_turn" | "listening" | "thinking";
export type FaceEmotion = "warm" | "curious" | "excited" | "concerned" | "proud";    // the only legal ui.cues[].program values
export type GazeTarget = "child" | "canvas" | "ledge" | "protege" | "down-think" | `module:${string}`;
export type FaceTier = "B" | "Blite" | "D" | "E";                                   // v1 ships these (§6)

/** The one face interface. All sources write it; all renderers (GLB, plate, later Gaussian or video) read it. */
export interface FaceFrame {
  t: number;                         // seconds on the teacher tap's AudioContext.currentTime
  bs: Float32Array;                  // 52 ARKit weights, canonical order. Azure's 55-value order is mapped explicitly
  head: [number, number, number];    // pitch, yaw, roll in degrees, additive to the rest pose (≤ 20° each)
  gaze: [number, number];            // eye-in-head yaw, pitch in degrees, clamped ±25 / +20…−25
  state: FaceState;
}
export interface FaceFrameTrack { fps: 30; frames: Uint8Array /* 52 × n, quantised 0..255 */; head?: Int8Array; durationMs: number }
export interface FaceCue { when: "audio_start" | "word" | "audio_end"; match?: string[]; act: "face" | "gaze" | "point";
  program?: FaceEmotion; intensity?: 1 | 2; target?: GazeTarget }
```

### 2.4 Component and handle

```tsx
// src/stage/TutorStage.tsx: a thin React wrapper over a framework-free controller
export interface TutorStageProps {
  character: TutorRuntime;      // manifest subset: id, look.rev, glb/plate refs, faceStyle, behaviour, lipMatrix, lipModel, voice.cps, faceDelay table
  band: Band;
  link: TeacherLink;            // VoiceLink or TextLink: events + levels.{teacher,mic}.onTap
  layout: "L1" | "L2" | "L3" | "L4" | "L5";        // framing preset: medium (L1, L5), medium close-up (L2), close-up (L3, L4, PiP)
  presentation: "face" | "small" | "voice";
  motion: { reduced: boolean; gentle: boolean; slowerVoice: boolean };
  tier: FaceTierDecision;       // { tier, pixelRatio, msaa, fpsCaps, why[] } from DeviceTier
  onEvent?: (e: TutorStageEvent) => void;
}
export interface TutorStageHandle {
  /** Director output for one turn. Armed, then fired on the next *audible* onset (tap VAD), or at once if apply === "now". */
  direct(d: { responseId?: string; affect?: "neutral" | "insight" | "effort"; handover?: Handover; cues?: FaceCue[];
              move?: Pick<Move, "kind" | "hintLevel">; apply: "at_next_audio" | "now" }): void;
  module(ev: ModuleEvent | { type: "highlight"; target: string }): void;
  setTargets(t: Partial<Record<GazeTarget, DOMRectReadOnly>>, stage: DOMRectReadOnly, dpr: number): void;
  /** A cached clip (name greeting, recorded explanation) on this head. Audio-floor rule: allowed only while the uplink
   *  track is disabled or before the session connects (§3.7). */
  playClip(c: { buffer: AudioBuffer; track?: FaceFrameTrack; rate?: number }): Promise<"ended" | "interrupted">;
  /** Load and warm up a GLB (fetch → parse → compileAsync → one hidden render) without showing it. Used by the picker (§7.3). */
  warm(character: TutorRuntime): Promise<void>;
  frame(): FaceFrame;           // the latest composited frame, for tier swaps and plate registration
  dispose(): void;              // frees geometry, textures and morph textures; keeps the GLB ArrayBuffer for context loss
}
export const TutorStage = forwardRef<TutorStageHandle, TutorStageProps>(/* useEffect mounts TutorStageController on a div ref */);

export type TutorStageEvent =
  | { type: "ready"; tier: FaceTier; loadMs: number; firstRenderMs: number }       // E-P7 needs compile and first render split
  | { type: "state"; state: FaceState; source: "tap" | "mic" | "event" | "module" } // for the ring-agreement test
  | { type: "tier"; from: FaceTier; to: FaceTier; reason: string }               // only in local silence ≥ 300 ms
  | { type: "stats"; fpsP50: number; intervalP95: number; long50: number; workP95: number; gpuMs?: number; faceDelayMs: number }
  | { type: "contextlost" } | { type: "error"; message: string; fatal: boolean };
```

**Rules for callers:**
- Never set `audioEl.muted` and never route playback through WebAudio. Chromium only feeds a remote stream to WebAudio
  while an unmuted element consumes it (crbug 933677 class), so either change gives a dead face and an un-cancelled
  echo path.
- Never send sentence-shaped text to the stage. Programs are enums.
- The stage never reads `tutor_switch`, the brief, or anything about the child beyond `band`.

### 2.5 Contract tests (CI, `tests/avatar-*.mjs`)

1. **No output node.** A static check plus a runtime spy: no `AudioNode` created by `src/stage/**` ever connects to
   `ctx.destination`, and no `DelayNode` or `MediaElementSource` exists there.
2. **Events suppressed.** A fixture lesson runs with all `output_audio_buffer.*` events dropped. The FSM still reaches
   speaking, stopped and your_turn from the tap, within 300 ms of the fixture's ground truth (G-8.2, GR-2.1).
3. **Reconnect.** A new remote stream re-attaches the tap within one frame, and the face does not freeze.
4. **Worker smoke** (phase 2). Headless Chromium boots the worker, loads a KTX2 + meshopt GLB, renders 30 frames, and
   checks region-masked eye and mouth pixels.

---

## 3. Lip-sync from the WebRTC remote stream

### 3.1 Signal chain (phase 1)

```
Azure gpt-realtime-2.1 ──RTP/Opus──► NetEq ──► <audio srcObject> (unmuted) ──► speaker / wired / A2DP     ← what the child hears
                                        └──► MediaStreamAudioSourceNode (VoiceLink's, existing)
                                                 ├──► AnalyserNode fftSize 1024 (existing LevelMeter, UI meters)
                                                 └──► AnalyserNode fftSize 2048, smoothing 0 (NEW, TutorStage)   never to destination
rAF tick (≤ 30 fps):  getFloatTimeDomainData(2048)
   ├─ RMS over the last 512 samples (10.7 ms @48k) ─► level-normalised gate/gain ─► one-pole τ (benched) ─► jaw
   ├─ last 1536 samples ─► fractional resample to 16 kHz (windowed-sinc; correct at 44.1 and 48 kHz) ─► pre-emphasis 0.97
   │     ─► HeadAudio MFCC(512) ─► tanh ─► Classifier.predict EVERY frame (ring 3) ─► viseme id
   │     ─► output gated by jaw energy (jaw < 0.02 → sil) ─► per-character lipMatrix[15×14] ─► mouth-shape ARKit deltas × shapeGain (< 1)
   ├─ VAD: voiced ≥ 2 frames → "her onset"; unvoiced ≥ 250 ms → "her offset"   (the canonical speaking signal)
   └─ push {tCtx, jaw, shape[14], voiced} into the lip ring (64 entries)
render: sample the ring at (ctx.currentTime − analyserLag − faceDelay), with min-hold on closure keys across the frame window
     ─► FaceCompositor (§4.5) ─► TalkingHead mtAvatar ─► WebGLRenderer
```

Corrections applied from the reviews:
- The jaw filter is the **benched** symmetric τ until the bench is re-run against *unsmoothed* ground truth. The
  shipped 40/80 ms attack/release was never benched (R-2a, R-7.1). [D]
- Prediction runs every frame, so the vote ring never carries the previous utterance's stale votes (N-2).
- Resampling is fractional, so a 44.1 kHz device no longer shifts the mel bands by 8% (R-4.4).
- Closure goes through the matrix's authored PP mix, with **`mouthClose ≤ jawOpen` clamped every frame**. Without the
  clamp, the old driver overlapped the lips by 2.5–2.8 cm on closure frames [M, N-1].
- The gate and gain are **normalised to a running voiced-level reference** (p90 over 10 s), because the received level
  after Opus and AGC is unknown and the accent and jaw gates are level-dependent [M, GR-9].

### 3.2 Per-tutor calibration (data, in `runtime.json`)

`speakerMeanHz` (female 200–250, male 100–130 [V]), `jawGain`, `jawCeiling` (Hindi dentals expose the mouth cavity),
`shapeGain`, `lipMatrix` (least-squares fit from the character's 15 authored viseme shapes onto the 14 shipped mouth
channels; R-3.6), the HeadAudio model file, and `cps` for the TurnClock (§4.2).

### 3.3 Latency budget and sign (speaker vs Bluetooth) [U, to be replaced by E-P8]

Network and NetEq are common to both branches, so they cancel. Offset = face-path latency − playback-path latency.
Positive means audio leads.

| term | speaker | A2DP earbuds | source |
|---|---|---|---|
| playback: WebRTC playout → device output | 40–100 ms | **150–300 ms** | G-2e [U] |
| face: MediaStream → WebAudio FIFO | 10–40 | 10–40 | G-2e [U] |
| face: analysis window centre + jaw filter at onsets | ≈ 55 | ≈ 55 | R-2a [U] |
| face: shape classes (vote) | +33–50 for shapes only | same | [M] |
| face: frame wait at 30 fps (mean) + render | ≈ 17 + 4–8 | same | [M→U] |
| face: compositor + SurfaceFlinger (+1 vsync in WebView) | 33–67 | 33–67 | P-4.2 [U] |
| **net offset before compensation** | **≈ 0 to +85 ms** (audio slightly leads) | **≈ −25 to −200 ms** (face leads) | |
| bar (BT.1359) | ≤ +45 detectable, ≤ +90 acceptable | ≥ −125 detectable, ≥ −185 acceptable | |

Consequences:
1. **When the face leads (Bluetooth), delay the face.** `faceDelay = clamp(routeOffset[route] + playoutDelayStats −
   visualPipelineMs, 0, 400)` is applied in the ring read.
   - `routeOffset` comes from `AudioManager.getDevices()` (Capacitor) on the APK, or a conservative default on the web.
   - `playoutDelayStats` is `media-playout.totalPlayoutDelay / totalSamplesCount` from `getStats()`, as an EWMA every
     10 s [S].
   - The table starts as {speaker 0, wired 0, A2DP 150 ms} [U] until E-P8 fills it. It is re-derived on `devicechange`.
2. **When audio leads (speaker), shorten the face path; never delay audio.** Use a faster attack chosen by the re-bench,
   the worker path (phase 2), and later the v1.5 student's forecast head, with Δ chosen per route and possibly 0.
3. Prosody-locked behaviour (accent nods, phrase blinks, brow flashes) reads the **same delayed clock** (GR-2.7).

### 3.4 Drift control

| risk | control |
|---|---|
| render clock ≠ audio clock | every lip sample and every behaviour timer is stamped on the tap's `AudioContext.currentTime`. The controller never integrates clamped dt (TH-2) |
| frame cap judder (≈ 23 fps) | TH-1. E-P5 logs rAF and render intervals separately |
| closures falling between frames | ring + min-hold over the frame window; a 40–60 ms closure is never skipped (P-3.3) |
| long tasks (module iframes share the main thread in WebView) | module SDK rule: no task > 16 ms. Phase 2 worker renderer |
| WebRTC playout vs AudioContext ppm drift over 45 min | `faceDelay` EWMA from `media-playout`; offset logged at 0/15/45 min (E-P1); pass < 20 ms drift (E-P8) |
| main ↔ worker clocks (phase 2) | every 1 s the main thread posts `getOutputTimestamp()` `{contextTime, performanceTime + timeOrigin}`; the worker maps through its own `timeOrigin` (P-3.4) |
| reconnects | `onTap` re-attach; the ring is flushed; the face holds rest pose for ≤ 1 frame |
| `slowerVoice` (realtime `speed`, if Azure exposes it [U]) | lips are derived from received audio, so they stay in sync automatically |

### 3.5 Speaking, stopping and barge-in

- **Canonical:** the tap VAD. `teacher_audio_start` *arms* (state programs are prepared) and the first voiced tap frame
  *fires*.
  - The event leads the audible sound by the jitter buffer plus the output path: ≈ 60–200 ms on a speaker and
    200–400 ms on A2DP [U, G-8.3].
  - The event family is also undocumented [V, G-8.2].
- **Stop:** local silence ≥ 250 ms *and* (`teacher_audio_end` hint, or ≥ 1.2 s of silence without the hint).
- **Barge-in:** the mouth follows the audio, so the RMS release closes it when the sound stops.
  - `teacher_interrupted` or `speech_started` switches only the *upper face* to listening (G-3.3).
  - `output_audio_buffer.cleared` acts as a backstop with a 300 ms timeout.

### 3.6 Bench gates (every lip change)

- Run `bench/bench.mjs` against the Azure hi-IN viseme ground truth, re-scored per R-7:
  - **unsmoothed** ground truth, each arm with its own filter;
  - speech-only r reported next to all-frame r;
  - one fixed lag per arm.
- Report r(open), bilabial closure recall, vowel false-closure and lag.
- **A change that raises closure recall by adding vowel chatter is not an improvement.**
- E-3 adds received WebRTC audio, looped through a real PeerConnection on gpt-realtime-2.1 voices.

### 3.7 Cached clips on the head (greeting, recorded explanations)

- A cached clip played locally is **not in the AEC far-end reference** (G-3.5). So `playClip()` is legal only while the
  uplink track is disabled, or before the session connects.
- The face track is keyed to `AudioContext.currentTime − start`, offset by `outputLatency`, and scaled by `rate`.
- **Per-child name greetings have no offline A2F track**, because their audio does not exist offline. The live driver
  runs on the decoded clip client-side instead (G-7).
- Offline A2F-3D tracks (v1.5) are only for clips identical for every child.

### 3.8 v1.5: the distilled student (behind the `FaceFrame` seam; not at launch)

- **Model:** causal, **≈ 0.2–0.3 M params**, 20 ms hop, log-mel in → 26 mouth/jaw/tongue channels out. A hand-written
  WASM kernel is the default; ORT-web is too big. Budget: p95 < 2 ms per 20 ms frame on an A55, cold start ≤ 1.5 s
  (G-2a/b, G-7).
- **Teacher labels:**
  - NVIDIA Audio2Face-3D v3.0 + v2.3 (NVIDIA Open Model License: commercial use and distillation allowed) plus Azure
    en-IN blend shapes, on 10–20 h per voice of our own tutor-register audio.
  - The run costs ≈ 6.6 GPU-h on a 4090, or ≈ $20–35 per voice on a T4 (G-2c).
  - Alignment uses Azure Speech word timestamps, never MMS.
  - LAM-A2E is a droppable secondary teacher (undisclosed training data).
  - **GPU quota is the critical path** (E-0 / G-2c).
- **Training:** augment with Opus encode/decode plus NetEq time-stretch and PLC. Add a closure loss and an onset-pulse
  rule, because causal models close /p b m/ 50–100 ms late (G-3.1/2).
- **Ships when:** hi r ≥ 0.65, PP recall ≥ 70%, vowel false-close ≤ 12% on the bench; student closure rate measured per Δ;
  a blind A/B against v1 at ≥ 65% preference (E-3).
- **Effort:** ≈ 12–15 engineer-weeks for the full student plus behaviour stack (G-6). Do not promise it at launch.

---

## 4. Behaviour controller (gaze, blink, nod, brows, expressions)

Source: `behaviour-proto/controller.mjs` (256 lines, seeded, with no dependencies) **plus the GR-1 fixes**. It runs in the
renderer tick (main thread in phase 1, worker in phase 2). Its output is the upper-face blend shapes, head
[p, y, r], gaze [y, p] and lean, which feed the compositor. Its cost is negligible (p99 8.4 µs per update [M]). The real
cost of the behaviour layer is the 6–14 morph influences it keeps non-zero.

### 4.1 Floor FSM: the master switch

| state | entered on (**canonical local signal**) | hint that may arm earlier | gaze | blinks | head / lean | brows / mouth |
|---|---|---|---|---|---|---|
| **idle** | session start; her offset with `handover = chain` and no module turn | none | contact 1.14 s, breaks every 7.2 s, to the module if one is mounted | 17/min | drift 1° | rest baseline |
| **speaking** | her tap onset | `teacher_audio_start` | starts averted if coming from THINKING; re-gaze 0.75 ± 0.3 s after onset; intimacy aversions 1.96 s every 4.75 s; floor aversions on her pauses ≥ 150 ms (p 0.35, sideways, return 1.27 ± 0.51 s after she resumes) | 26/min, phrase-locked | accent nods 1.5–3° (substepped, peak-normalised); gaze-follow 30% below 15° with 250 ms lag | **brow flash in the first 300 ms of a move**; the armed emotion fires here |
| **yielding** | TurnClock remaining < 2.41 s and `handover ≠ chain` | none | **direct, no aversions** | 20/min | nods continue | held brow 0.14 for a question hand-over |
| **your_turn** | her offset with `handover ≠ chain` | `teacher_audio_end` | the ring target: the child (mic or choice), or the module (`try`: 2.5 s, then check back); module glances 1.14 s every 7.2 s | 18/min, ≤ 250 ms | **lean-in** (pitch −3° + forward); stillness ×0.5 | brow held from the yield; on module `idle`: look at the child + soft brow 0.12. **No escalation, ever** |
| **listening** | child onset: PTT press (local), or mic tap voiced and echo-gated (child RMS > k × her RMS while she speaks) | `child_speech_start` (server VAD) | contact ≤ 0.7, breaks only to the module; continuous mutual gaze ≤ 4 s (G12) | 18/min, **≤ 250 ms** | tilt 4°; stillness ×0.7; **continuer nods only if `handover = open`** (pause ≥ 300 ms after ≥ 0.7 s of speech, p 0.5, ≤ 1 per 3 s, 2.5°) | `browInnerUp` +0.08 |
| **thinking** | child offset: PTT release, local silence ramp (3 s Young / 2 s Older), or mic silence ≥ 300 ms; module `answer` | `child_speech_end` | **cognitive aversion** +0.3 ± 0.1 s, up 45% / side 35% / down 20% (B3–B4: side or down), ≤ 3.5 s; **head-led ≥ 10–15° on small tiles** | 22/min | drift; lean 0.2 | **every expression released within 300 ms (verdict-neutral)**. The only exception is `goal_met` |
| *barge* (transient) | child voiced (echo-gated) while she is speaking or yielding | `teacher_interrupted` | to the child within 1–2 frames of the *local* onset | none | nod velocity zeroed | release 200 ms; brow 0.15 "oh?"; the mouth follows audio |

THINKING onset is local. On the wire, `speech_stopped` arrives after `silence_duration_ms` (900 ms in
`voice-turn-config`) plus one network leg, i.e. about 1.1–1.5 s late (GR-2.2). If the server has not confirmed within
silence + 300 ms, the face reverts to soft contact.

### 4.2 Schedulers

| scheduler | rule | fix applied |
|---|---|---|
| **blink** | gamma inter-blink intervals (k = 3) at the per-state rate; a 250 ms total blink; 12% doubles. An event (phrase boundary ≥ 150 ms, gaze shift > 15°) **advances** a scheduled blink within 0.6–1.0 mean intervals instead of adding one. On a state change the pending interval is **time-warped, never redrawn** | redrawing halved the rate in short states; adding inflated it to 31/min [M, sim §8.3] |
| **gaze** | Andrist 2014 distributions (cognitive 3.54 s, intimacy 1.96/1.14 s, floor 2.30 s) and Ho 2015 timing; every shift carries a function label (`contact`, `yield`, `cognitive:side`, `module:watch`, `shared-attention`, …). Nothing is random in *whether* a shift happens | **clamp eye-in-head to ±25° yaw / +20…−25° pitch; the remainder goes to the head (≤ 20°), then the bust.** Targets are computed in 3D with `camera.unproject` (the L2/L3 layouts produced ±64° eye pitch, GR-1.4) |
| **head** | a damped spring (k 120, ζ 0.6) integrated in **fixed 4 ms substeps**, with the impulse normalised so the peak equals the requested degrees. Head motion is written through `headRotate*` pseudo-morphs, never raw bones (dynamic hair would lag a frame) | the old code gave 0.75° for "3°" at 30 fps and 0.24° at 15 fps [M, GR-1.2] |
| **brow** | a flash at each move start; accent-locked flashes only p 0.35 on strong accents, refractory 1.2 s; questions get a held 0.14 | none |
| **TurnClock** | remaining = spoken units / rate − elapsed. Units: numerals expanded to words, Devanagari counted by graphemes × a per-voice factor. Rate: an online per-session estimate (chars / tap-voiced seconds), seeded from `voice.cps`. `response.done` audio-token usage as an exact length is [U] | ±15% was too narrow: measured 9.3–17.6 cp/s fails E-B3 (45/670 yields under 1 s) [M, GR-2.4] |
| **eyes** | eye bones rotate; `eyeLook*` morphs are driven at **lid-follow gain only**. Per-character deg → morph calibration lives in `behaviour` | resolves the three-way conflict (GR-4.2) |

### 4.3 Level of detail by on-screen face size (§4.6 geometry)

| face height | rule |
|---|---|
| ≥ 220 px (L1, large L2) | micro-saccades of 1.5–3°; eye-led intimacy aversions |
| < 220 px (L3, L4, PiP) | no micro-saccades (they shimmer at DPR 1); every gaze shift ≥ 10° with ≥ 50% carried by the head; nod gain ×1.3; floor and cognitive aversions head-led |

### 4.4 Expressions: shapes, envelopes and valence sources

| emotion | ARKit deltas at full intensity (before band scale) | head | contact | envelope (attack / hold / release, ms) |
|---|---|---|---|---|
| warm | `mouthSmile` 0.28, `cheekSquint` 0.12, `eyeSquint` 0.10 | tilt 2°, gain 0.9 | 0.70 | 600 / 1500 / 900 |
| curious | `browInnerUp` 0.28, `browOuterUp` 0.22, `mouthSmile` 0.08 | tilt 6° | 0.85 → capped 0.7 while listening | 350 / 1800 / 700 |
| excited | `mouthSmile` 0.55, `cheekSquint` 0.35, `eyeSquint` 0.2, `browOuterUp` 0.25, `eyeWide` 0.12 | gain 1.35 | 0.70 | 350 / 1200 / 900 |
| concerned | `browInnerUp` ≤ **0.30**, `browDown` 0.06, `mouthPress` 0.12. **Never sad** | tilt 5°, gain 0.7 | 0.75 | 700 / 2500 / 1200 |
| proud | `mouthSmile` 0.45, `cheekSquint` 0.32, `eyeSquint` 0.22, plus one slow nod | tilt 3° | 0.85 → 0.7 cap | 550 / 1600 / 1000 |

- **Every smile carries `cheekSquint` and a lower-lid raise** (the Duchenne marker). Cosine envelopes, never steps.
- **A new emotion cross-fades:** the outgoing level decays as its own layer. A cue swap used to drop `mouthSmile` by
  0.19 in one frame (GR-1.3).
- **Each program has a variant pool** of at least 3–5 parameterised versions, with habituation decay, so 40–80 praise
  moments per lesson never repeat one face (G-5.3).

**Valence, ranked by latency.** The Director runs off the critical path, so its arm is one turn late for *this* answer.

| source | latency | maps to |
|---|---|---|
| module `answer.correct` (the engine owns the verified key) | ≈ 0 | correct → proud 2 or warm 1 (under the praise cap); wrong → curious 1 (the error is information). Armed for her next onset |
| `goal_met` | ≈ 0 | excited 2, even in THINKING (the engine already revealed the outcome) |
| praise lexicon on **her** transcript deltas (*shabash, bahut badhiya, wah, bilkul sahi, perfect, well done* → proud or warm; *socho, kya lagta hai* → curious) | delta lead [U, E-8] | placed at `speakT0 + units/rate`; additive, capped at 1; subject to the praise cap |
| Director `ui.cues[]` with `act: 'face'` and `program ∈ FaceEmotion` (`when: audio_start / word / audio_end`) | one turn (armed) | as given, validated against the enum; unknown programs are dropped and logged |
| Director `ui.affect` | one turn | `insight` → curious 1 at audio start; `effort` → warm 1, upgraded to proud only if the engine verdict was correct; `neutral` → nothing |
| `move.kind` / `move.hintLevel` | one turn | hint 1–2 → warm 1; hint ≥ 3 or the `repair` kind → concerned 1; `show_module` → mount glance 0.6–0.9 s; `celebrate` → excited 1–2 (budgeted); `wrap` / `break` → warm 2 (budgeted) |

**Budget and band scale.**
- At most **one big expression** (scaled intensity ≥ 0.6) per 30 s; extras are demoted to 0.45.
- A **proud ≥ 2** face at most once per 5 turns, the same cap as spoken praise.
- The band scale is B1 1.0 / B2 0.9 / B3 0.7 / B4 0.55. It applies to **amplitudes only**, never to gaze or
  turn-taking timing.

**Never:** head shakes (ambiguous with the Indian wobble, and a scold); a sad face; mimicry of the child; emotion
recognition of anyone; face programs that show longing or "missing you"; any impatience escalation in YOUR TURN.
`concerned` is reserved for content difficulty. The roll-wobble continuer is a per-character option, shipped only if
E-B6 passes in a region.

### 4.5 FaceCompositor: one place for every priority rule

```
final = clamp01( rest_c + intent(t) + prosody(t) + autonomic(t) + lipGain_c ⊙ lip(t − faceDelay) )
  - lip owns jawOpen, mouthClose/Press/Roll/Funnel/Pucker/Stretch/UpperUp/LowerDown, tongueOut; intent never attenuates jawOpen
  - mouthClose ≤ jawOpen (every frame); jawOpen ≤ jawCeiling_c
  - closure factor (smoothed: ≥ 60 ms attack, ≥ 120 ms release) scales ONLY mouthSmile* by down to ×0.4; cheek/eye squint untouched
  - eyeBlink = max(autonomic blink, intent squint), applied to both lids equally; never summed
  - per-frame |Δ| ≤ 0.06 on every key except blinks and lip keys (anti-snap)
  - gaze and head clamps (§4.2); weights < 0.01 → 0 (the shader skips zero influences)
  - teeth / tongue / mouth-bag darkening uniform driven by jawOpen (Lambert teeth glow otherwise)
  - smile-crease AO blend driven by mouthSmile (position-only morphs lose the cheek shading)
```

TalkingHead moods are replaced by a single `taxila` mood whose baseline is the character's rest set. Mood keys can
therefore never collide with lip keys (R-4.2).

### 4.6 CI gate: `behaviour-proto/sim.mjs` grows into `tests/avatar-behaviour.mjs`

- **Invariants:**
  - I1 verdict-neutral THINKING
  - I2 no nod on closed or choice answers
  - I5 expressive budget
  - I6 thinking aversion present and on time
  - I7 barge gaze ≤ 100 ms and release ≤ 300 ms
  - **I8 nod amplitude** within ±20% at 15/24/30 fps
  - **I9 per-frame delta cap**
  - **I10 eye-in-head clamp**
  - **I11 L/R symmetry bound**
  - **I12 longest mutual-gaze run ≤ 4 s per 60 s**
  - **I13 the blink closing phase is visible at the active fps cap**
  - **I14 events-suppressed run**
- **Sim arms added:**
  - heavy-tailed dt (5/10/20% of frames at 50–200 ms);
  - the real voice rates (9.3–17.6 cp/s);
  - THINKING measured from the child's last voiced frame.
- **Mutation check:** every invariant has a mutation that must trip it. 6/6 trip today [M]; the new invariants each
  need their own mutation.

---

## 5. Character roster, art direction and production pipeline

### 5.1 Canonical identities (resolves the name collisions in tutor-selection-ux §6.5) [D]

- Ids carry no address term.
- Role chips (didi / bhaiya / ma'am / sir) appear only in child-facing UI, and the child confers the address per pair.
- Two existing ids are kept: `asha` and `arjun` (code + voice sheets). The avatar briefs' looks are re-homed onto them.
  "Anaya" and "Kabir" are retired as names.
- The 42-year-old man brief was "Arjun Sir". That name collides, so he gets a **new name before any asset work**.
  Placeholder id `senior-m`; the owner picks a name, then real-person and trademark clearance runs.

| id | apparent age, gender | MST | look (brief) | silhouette hook | faceStyle (runtime) | voice slot | offer / serve classes |
|---|---|---|---|---|---|---|---|
| `asha` | 24, F | 6 | kurti over jeans, denim jacket or cardigan; high ponytail; small studs | ponytail + jacket collar | smile 0.8, head 1.1, lively brows | F-A | **1–6** / 1–7 |
| `arjun` | 26, M | 7 | half-sleeve check shirt over a plain tee; curly hair; round glasses (from CC0 Glasses 01) | curls + round frames | smile 0.7, head 1.2, quick nods | M-A | **1–8** / 1–9 |
| `nandini` | 36, F | 8 | handloom cotton saree with a thin contrasting border; low bun; wristwatch; small bindi optional, after community review | bun + pallu on the shoulder | smile 0.55, head 0.8, expressive brows | F-B | 4–9 / 4–9 |
| `senior-m` (name TBD) | 42, M | 5 | plain kurta, or a formal shirt with rolled sleeves; salt-and-pepper side hair; trimmed beard; rectangular glasses | glasses + beard edge | smile 0.6, head 0.7; "steady" = fewer, shorter aversions, **never > 4 s mutual gaze** | M-B | 5–9 / 5–9 |
| W2 `zoya` | 29, F | 6 | salwar-kameez with a draped dupatta; side braid | dupatta + braid | smile 0.7 | F-C | languages fit; offer must reach class 9 |
| W2 `harpreet` | 45, M | 5 | dastaar + full beard; sweater-vest over a shirt (community review) | turban shape | smile 0.65, slow head | M-C | 5–9 |
| W2 `siami` | 25, F | 4 | Mizo-inspired woven shawl over a sweater; short bob (community review) | bob + shawl stripes | smile 0.75 | **F-D** (not shared with Zoya) | 3–9 |

The wave-2 offer ranges are proposals [D]. Lint them before concept work starts.

What the roster has to satisfy:
- **Lint:** `roster-lint.mjs` with these fits gives **0 of 9 classes failing** [M]. Every class shows ≥ 2 tutors, both
  genders, and at least one tutor at MST ≥ 6.
- **Voices:** slots are filled by the blind "human and Indian" ear test. Candidates are among the realtime catalogue
  (marin and cedar are singled out for quality) [U]. **The cast size is bounded by passing voices.** If only two pass,
  ship `asha` + `arjun` with offer ranges widened to 1–9; the band layer carries the register.
- **Skin tone:** MST 9 is not yet in the cast. One W2 brief must carry it. At least half the cast is MST ≥ 6. The picker
  never orders tutors light to dark.
- **Character vs band:** a character is a *person* (voice, face, `faceStyle`, humour kind, taste, first-person grammar).
  Pedagogy is the band layer. Uma's exam-calm becomes a *mode* any tutor can enter, and Golu belongs to the band layer.
- **No non-human tutor in v1.** It stays an M-AV-1 arm only.

### 5.2 Art direction (S2: "feature-animation stylised", tested against S1 and S3)

- **Proportions:** real adult proportions with a slightly large head. Eyes ×1.15–1.2, **with stylised eye materials in
  step**: painted iris, simplified sclera, and a painted or matcap catch-light. MPFB's photographic eyes are repainted
  (MacDorman 2009 [V]). S3 arms get no eye enlargement.
- **Surfaces:**
  - Hand-painted albedo with **AO, cavity and colour variation only, never a painted directional light** (it would
    turn with the head).
  - No pore normals. Lambert, toon or matcap shading.
  - The smile-crease AO blend. Teeth darkened by `jawOpen`. A dark mouth bag. A modelled tongue and simplified teeth.
- **Hair:** a **solid sculpted shell plus a few alpha-tested fringe cards**. Never alpha-blended cards (Mali loses
  Early-Z and FPK [V]). No long open hair.
- **Garments:** sarees, pallus, dupattas and turbans are rigid or skinned meshes, with no cloth simulation and no dynamic
  bones on tier B. They are full custom models; none exist in the CC0 packs.
- **Age:** older characters show age through hair, glasses, proportions and slower motion, never through wrinkle morphs
  (they look rubbery).
- **Look and conduct:** no glamour and minimal make-up. Each tutor is identified by a 64 px silhouette plus a signature
  colour. No studio names in prompts or briefs. No resemblance to real people. Religious and community markers ship only
  after review by that community.
- **Realism promise:** a polished stylised real-time character on a Mali-G52, not "feature film". M-AV-1 stimuli are
  therefore **voiced tier-B real-time captures with the real driver**, never Cycles renders.

### 5.3 Production pipeline (the character factory)

| stage | what | owner | tool | gate / output |
|---|---|---|---|---|
| S0 brief | `characters/<id>/brief.json`: role, age, MST band, style level, voice slot (**voice must have passed first**), attire, markers, faceStyle, tier-B budgets | agent | n/a | schema lint; name cleared |
| S1 concept | turnaround, expression sheet, 15-viseme mouth sheet, colour script, portrait | agent drafts with Azure `gpt-image-2`; **art director picks** | Foundry | provider and terms version recorded in `provenance.json` |
| S2 base | MPFB `create_human` + macro sliders (1.3 s headless [M]); Faceunits 01 + Visemes 02 (CC0); bust trim; helper eyes, teeth and tongue kept | agent | `bpy` 4.2 | `base.blend` |
| S3 sculpt | identity delta on the shared topology, stored as one `identity` key. **Eyeballs scaled rigidly about their pivots; lids and socket warped; eye bones moved** | **artist** (2–4 d [U]) | Blender | art director sign-off |
| S4 bake | each key k → `identity(neutral + δk)`; **bake the basis to `identity(neutral)` and delete the macro and identity keys** | agent | `bpy` | lid leak 0.0% baked vs 1.3–8.1% naive [M]; exact only at weight 1 → test partial weights |
| S5 correctives | **QA sheet rendered in headless Chromium with the shipping Lambert/matcap shader, using poses sampled from the real driver on Opus-degraded Hinglish audio**; a vision agent flags issues; the artist fixes them (Faceit or sculpt); in-between correctives for blink 0.5, `jawOpen + mouthClose` and smile + jaw | artist + agent loop | Faceit, Playwright | G1–G6, G12 green; art director sign-off |
| S6 hair, garments, accessories | hand-authored shell and cards; garments custom; glasses from CC0 Glasses 01; AI image-to-3D for concept blockouts only | **artist** | Blender | ≤ 3k tris hair |
| S7 textures | one 1024² colour atlas (ETC1S) + 256² hair alpha; catch-light; no normal map on tier B | artist + agent | Blender, `ktx2-encoder` | G9 on the *rendered* skin |
| S8 rig | TalkingHead MPFB skeleton (`talkinghead.mpfbskel` + `.mhw`); Mixamo-compatible names, root `Armature`; bust bones only | agent | `bpy` | n/a |
| S9 export | subdivision baking **off**; **morphed head primitive split from an unmorphed torso** at the collar; brows painted, or moved by 2–4 bones; lashes carry blink/squint/wide only; drop all-zero targets; clear custom split normals + shade smooth (102,530 → 27,956 GPU verts [M]); **52 ARKit, position-only**; visemes kept as authoring targets → `lipMatrix` fit | agent | `bpy` + `build-tutor.mjs` (prune, dedup, ETC1S, reorder, quantize, meshopt high) | GLB ≤ 1.5 MB |
| S10 gates | G1–G12 + perf CI (§6.1), **run on the decoded, quantised GLB** (quantisation error is ≈ 0.1–0.2 mm, close to G5's bar) | agent | Playwright + three | all green or the build fails |
| S11 runtime | `runtime.json`: faceStyle, behaviour block (deg → morph gains, per-shape gains, asym seed), lip calibration, faceDelay defaults, voice ids, portrait and plate refs, licences | agent | n/a | schema lint |
| S12 derived media | D plate + 5-cell mouth strip + blink overlay, **rendered in headless Chromium from the B GLB with the B shader**, registered pixel-for-pixel to idle frame 0; previews (§7.3) | agent | Playwright, ffmpeg | G-PREV |

**Gates** (character-creation §5 with R-8 changes):

| gate | check |
|---|---|
| G1 | exact 52 names on every morphed mesh |
| G2 | every key moves ≥ 0.2 mm, and `tongueOut` is authored |
| G3 | mirrored-delta symmetry (deltas, not positions) |
| G4 | render-based lid seal (emissive red eyeball, 4× resolution) at weights 0.25 / 0.5 / 0.75 / 1 combined with gaze extremes; 0 red pixels at 1.0 |
| G5 | lip seal ≤ 0.3 mm on the shipped PP mix, with `jawOpen` ∈ {0.1, 0.3} sweeps |
| G6 | no intersections at the driver's top 50 observed poses, and for gaze bone + `eyeLook*` + blink together |
| G7 | tier-B budgets; subdivision level 0; every morphed mesh counted |
| G8 | GPU verts / Blender verts ≤ 1.3 |
| G9 | rendered sRGB → L* inside the MST band, colour space asserted |
| G10 | licence per MakeHuman pack; hash-blocklist |
| G11 | load through our own loader; region-masked eye and mouth checks; SSIM as a coarse regression check only |
| G12 | mutual gaze ≤ 4 s; blink closing phase visible at the fps cap |

**Who does what:**
- **Agents:** every deterministic stage (S0, S2, S4, S8–S12) and the review loop in S5.
- **Art director (0.3–0.5 FTE):** concept selection and sign-off on S1, S3 and S5.
- **Contracted 3D character artist:** sculpt, correctives, hair, garments, textures. The contract must assign copyright.
- **Panels:** community review for markers; parents, teachers and children (by age band) for M-AV-1/2.

**Effort [U, R-7]:** 5–7 weeks for character 1 (including the 2–3 week pipeline shakedown) and 3–4 weeks for each later
character. That is ≈ 15–20 artist-weeks for the launch four. **Build one character to S2, warp-derive its S1 and S3
arms, and run M-AV-1 before sculpting the other three.**

---

## 6. Asset budgets, device tiers and fallbacks

### 6.1 Face tiers (v1)

| face tier | what renders | default for (stage 1, then confirmed by the probe) | assets |
|---|---|---|---|
| **B: 3D-lite** | the GLB, Lambert/matcap, 1 directional + hemisphere light | everything not known-bad; the ₹10k target (G85/G88, SD 662/680, D6300/T7250 with G57) | one tier-B GLB per character |
| **B-lite** | the same GLB with runtime knobs: DPR 1.0, 20 fps, no micro-saccades, PiP framing allowed | probe class below B; G35 / GE8320 / Exynos 850 if the probe passes | same GLB; **budget stays 20 MB** (zeroed influences save fetches, not memory) |
| **D: plate** | illustrated still + 5-cell mouth strip driven by the jaw with hysteresis + blink overlay; DOM only; ≤ 20 Hz from the main-thread tap | no WebGL2 or `failIfMajorPerformanceCaveat`; context lost twice; thermal SEVERE; battery < 15%; `lowRam && sdk < 30` (in-process renderer); probe fails B-lite | ≈ 75 KB per character, preloaded at session start |
| **E: voice-only** | an RMS ring + name + "AI teacher" | thermal CRITICAL; battery < 10%; the data-saver or quiet-screen choice; the Older `voice` presentation mode | none |
| ~~C: sprite rig~~ | **cut from v1** | build only if telemetry shows > 15% of sessions below B-lite (P-7) | n/a |
| A: 3D-full | v1.5: normal maps (UASTC), MeshStandard + small env, dynamic bones, ≤ 30k tris, ≤ 45 MB | devices with `mpc ≥ 33` and ≥ 5.5 GB RAM | v1 shows B assets there with DPR ≤ 1.5 + MSAA |

**Mapping to PRODUCT-DESIGN §7.2 device tiers:**

| design device tier | face tier |
|---|---|
| A | B (high knobs) |
| B | B |
| C (floor) | B-lite if the probe passes, else D. This replaces the flipbook |
| D (lite) | D or E |

There is **one governor**: PRODUCT-DESIGN's FrameGovernor and this one are merged (§6.4).

### 6.2 Tier-B asset and runtime budget (CI-enforced in S10)

| item | budget | basis |
|---|---|---|
| triangles in view | ≤ 15k (head ≤ 8k, hair ≤ 3k) | perf §4.1 |
| draw calls | ≤ 4 (body + outfit, head, eyes + teeth + tongue opaque, hair + brows + lashes alpha-test atlas) | |
| morphs | 52 ARKit, position-only, on head + teeth + tongue (+ lashes blink/squint/wide); **0 morph-normal attributes** | perf §3.3 |
| morphed vertices | ≤ 6k → 6k × 52 × 16 B = **5.0 MB GPU + 5.0 MB JS texel copy + ≈ 1.9 MB Int16 morphAttributes** | C-1 corrected formula: GPU 16k + JS 16k + 6–9 B per vertex per target |
| textures | one 1024² ETC1S atlas (0.70 MB as ETC1, 1.40 MB as ETC2/ASTC) + 256² hair alpha; no normal or ORM maps | [M] |
| GLB | **≤ 1.5 MB** (T2 measured 0.87–1.44 MB [M]) | |
| resident (GPU + JS) | **≤ 20 MB** (T2 measured 10–17 MB [M]) | |
| fps cap (speaking / listening / idle) | **30 / 30 / 20**. The cap divides the panel rate; the APK **pins lessons to 60 Hz** natively (`preferredDisplayModeId` / `Surface.setFrameRate`), so the real steps are 30 / 20 / 15 | P-2.9 |
| canvas | ≤ 0.22 Mpx. **Default {DPR 1.0 + MSAA ×4 + `alphaToCoverage` on hair and lashes}; the alternative {DPR 1.25, no AA} is decided by E-P5** | P-2.6: MSAA is near-free on tilers |
| context | `alpha:false, depth:true, stencil:false, powerPreference:"low-power", preserveDrawingBuffer:false`; no tone mapping, IBL, shadows or post | |
| GPU per frame | ≤ 6 ms (probe) | |
| main-thread JS (phase 1) | ≤ 4 ms p50 / 8 ms p95. Measured 3.9 / 19.4 ms at 4× throttle [M], which is why phase 2 exists | |
| first render after the picker | < 300 ms: `compileAsync` **plus one hidden warm-up render** (morph-texture packing happens on the first render, not in compile) | P-2.2 |
| catch-light | required on tier B (painted, or a camera-space sprite, or matcap on the cornea) | P-6.1 |
| battery | the avatar adds ≤ 0.4 W (≈ 1.6% per 45-min lesson) against tier E; measured as fuel-gauge Δ% over 3 runs + calibrated `currentNowUA` | E-P3 |
| memory | one character resident; the previous one is disposed first; never two avatar WebGL contexts; the GLB `ArrayBuffer` is kept for context loss | |

### 6.3 Tier detection (three stages)

1. **Static facts** (< 50 ms target; realistically 100–400 ms for the first GL context, so it runs inside the worker
   that will render, or off the first screen's critical path).
   - A Capacitor `DeviceTier` plugin reports: `totalMem`, `isLowRamDevice`, `SOC_MODEL`, `MEDIA_PERFORMANCE_CLASS`, SDK,
     WebView version, power save, supported display modes, and the audio route.
   - WebGL2 reports: the unmasked renderer, ETC/ASTC support, `MAX_VERTEX_TEXTURE_IMAGE_UNITS`,
     `failIfMajorPerformanceCaveat`.
   - **The regex sends only known-bad GPUs down; everything else starts at B.** (The original regex sent Mali-G71/G72
     to A and could not tell G57 MP1 from MC2.)
   - `navigator.hardwareConcurrency` and `deviceMemory` are never used.
2. **Probe** (2 s, 60 frames).
   - It runs on the **chosen** tutor's GLB during warm-up, not on a default. It runs for every start tier except D.
   - It measures worker JS p90, GPU time (`EXT_disjoint_timer_query_webgl2`, else `gl.finish()` brackets, the only
     allowed use of `finish()`), and the interval p90.
   - Results are cached per `socModel + WebView major + pipeline rev`.
3. **Governor** (every 1 s), §6.4.

### 6.4 The governor (fixed per P-3.5, P-3.6, P-4.5, P-6.7)

- **Bad signals:**
  - fps p50 < 24;
  - more than 4 long frames over 50 ms per 10 s;
  - **`media-playout.synthesizedSamplesDuration` rising** (device underrun). `concealedSamples` is network loss: use it
    for telemetry labels only, never to demote;
  - thermal MODERATE, or headroom > 0.85.
- **Battery saver** applies **once**, to the start tier and the fps cap. It is not a repeating bad signal; that version
  ratcheted to voice-only within a minute.
- **Order inside a tier:** pixels first (DPR → PiP size), then fps. Changing tier is the last resort.
- **Timing:**
  - Step down after 5 s of bad signals.
  - Step up only after 120 s of good signals and ≥ 300 s since the last change. Never above the probe tier within a session.
  - At most one non-thermal demotion per lesson.
  - **Switch only in local RMS silence ≥ 300 ms**, with a 200 ms crossfade (also for the hard path).
- **Thermal:** read `getThermalHeadroom` from **one cached native caller** at most every 10 s. The sentinels are −1
  (unsupported) and −2 (rate-limited), never NaN, which Capacitor silently drops. "Unsupported" is decided only after
  two readings ≥ 10 s apart.

| condition | action |
|---|---|
| LIGHT, or headroom > 0.85 | fps −1 step |
| MODERATE, or headroom > 0.95 | one tier down at the next silence |
| SEVERE | D now |
| CRITICAL | E, and tell the Conductor |
| battery < 15% and not charging | D |
| battery < 10% | E |

### 6.5 Presentation, motion and module sharing

| situation | behaviour |
|---|---|
| Older modes (`ds-band-fork-older`) | `face` (normal), `small` (PiP ≤ 160 × 160 CSS px at 20 fps), `voice` (tier E look) |
| module in focus | PiP ≤ 160 px at 20 fps. On B-lite, if the module uses WebGL, the face goes to D. The avatar never competes with the thing the child is manipulating |
| reduced motion ("kam halchal") | keep lip-sync and blinks; head drift and expressions ×0.3; no tile pulse |
| **gentle face** | head motion and *lower-face* expression ×0.5. **Never touches brows, blinks or visemes**: limited upper-face motion reads as uncannier (Tinwell 2011 [S]). Children who need less face get the still-portrait mode instead |
| hidden / backgrounded | stop the loop on `visibilitychange`; `RENDERER_PRIORITY_BOUND` natively |
| `webglcontextlost` | D at once; reload from the cached GLB on restore; after a second loss in the session, D for the rest of it |
| tier changes | plates are rendered from the B GLB with the B shader, so B → D keeps the same person |

---

## 7. Tutor selection UX and data model

### 7.1 Flow (amends onboarding-flow §3 and PRODUCT-DESIGN §3.5 "launch cast") [D]

```
P0/P1  parent meets "Taxila's teachers" (plural; house voice or rotating tutors; AI disclosure)
P6     child profile → background: name-greeting audio in each eligible tutor's REALTIME voice (2-4 × ~3 s, ≈ $0.003/child [U])
P7     parent controls: Teachers row (aap-register preview per tutor, allow-list, switch policy free | ask | locked)
C1a    child picks their own avatar
C1b    "who will teach you?"  → picker → choose → greeting ON THE 3D HEAD → C2 spoken by the chosen tutor
```

| band | options | frame | preview start | confirm target | switch default |
|---|---|---|---|---|---|
| B1 (cl. 1–2) | exactly 2 | app voice + a picture | sequential auto-intro ≤ 5 s each after the handover tap; pause and replay visible | ≥ 112 dp "choose" under the playing tile | **ask parent** |
| B2 (cl. 3–4) | 2–3 | + a 3-word style chip | same | ≥ 96 dp | free |
| B3 (cl. 5–7) | 2–4 | + a ≤ 8-word style note | tap to hear | ≥ 64 dp | free |
| B4 (cl. 8–9) | 2–4 (+ "more teachers") | same; tile at lesson size, not enlarged | tap to hear | ≥ 48 dp | free |

Picker rules:
- Order is shuffled from a stable per-child seed, with **no pre-highlighted default**. A fixed order plus a fixed
  default distorted shares to 54 / 15 / 15 / 16% for equally liked tutors; shuffled gave ≈ 25% each [M, n = 4,000/arm].
- "Pick for me" draws uniformly at random. The child is never auto-advanced.
- Eligibility follows the child's *class*, never their content level.
- Accessibility: a `radiogroup` with separate *Hear* and *Choose* controls; keys 1–4; captions in the school-medium
  script; no autoplay before a gesture.

### 7.2 The tutor never speaks from a still face (G-0.1) [D]

1. When a tutor's preview has played to ≥ 80%, `stage.warm()` fetches, parses, runs `compileAsync` and does one hidden
   render of that GLB. At most one head is warm at a time.
2. On *choose*:
   - **If the head is warm,** the name greeting plays on it through `playClip()`. The uplink is not yet live, so the
     audio-floor rule holds. The live driver generates the clip's face track client-side.
   - **If it is not warm,** the *app voice* fills with a confirmation and a non-face animation, and the tutor's greeting
     waits for the head.
3. The greeting is decoded to an `AudioBuffer` at picker entry. The bar is choose → audible ≤ 200 ms on speaker or wired;
   Bluetooth is reported, not gated.
4. The hand-off to the live lesson happens after local silence ≥ 300 ms past `ended + outputLatency`.
5. The choose → live-face bar is **≤ 3 s** on the APK, and on the web only with the speculative warm-up. A cold web load
   is ≈ 3.5–4.5 s [U].

### 7.3 Previews

| property | spec |
|---|---|
| format | **one MP4 per language**, containing every tutor's segment with an IDR at each segment start and 300 ms of padding; loaded once as a **Blob URL** (Capacitor's local server mishandles media Range requests); a tap is a keyframe seek; one decoder for the picker's lifetime; `requestVideoFrameCallback` drives the caption and the 48-bar waveform |
| encoding | **512², H.264 Main, CRF 26–28, AAC at 48 kHz**; ≤ 200 KB per tutor segment (stress proxy ≈ 160 KB muxed with Main; ≈ 220 KB with Baseline [M]) |
| content | one shared script skeleton, ≤ 6 s: name, "AI teacher", one teaching-style note, one tiny inviting question. No catchphrase, no friendship claim, no other tutors. Durations within ±10% |
| loudness | matched to the **measured live realtime output loudness** (not −24.5 LUFS, which is ≈ 4 LU quieter than the live voice), ±0.5 LU across tutors, true peak ≤ −1 dBTP |
| voice | **the realtime voice itself** (a scripted out-of-band response, checked by ASR). A `ttsTwin` only if an ABX test shows ≥ 70% "same person" (n ≥ 20) |
| render | **headless Chromium with the tier-B GLB, the shipped shaders and lights, and the live lip driver**, at lesson framing. ≥ 1 blink, gaze breaks, catch-light, gaze cap. The preview must never be better than the lesson |
| fairness gate G-PREV | loudness, duration, skeleton diff, captions, licence manifest; **lip parity** (each tutor's bilabial capture within ±10 pp and jaw r within ±0.1 of the cross-tutor mean); blink present; gaze ≤ 4 s |
| sizes | APK bundles **child previews only** (≈ 1.9–2.4 MB for 4 tutors × 3 languages); parent previews are fetched on demand; first web picker ≈ 0.8 MB; thumbnails 384 px (or `srcset`) ≤ 30 KB |

### 7.4 Switching and parent controls

- **Where:** "My teacher" on Home only. Never on the lesson stage, never offered by a tutor, never prompted, never asked
  why. The reversibility notice is stated once (B3+).
- **When:** only between lessons. `POST /api/child/:id/tutor` returns **409** during a live session (the API itself
  forbids changing voice after first audio [V]).
- **Parents:** an allow-list per child plus a switch policy (free / ask / locked), with **no reason field**. The child is
  always told when their options narrow. If only one tutor is allowed, the picker is skipped ("your family chose ⟨name⟩")
  rather than shown as a fake single-tile choice.
- **Never:** gating tutors by payment, rewards, streaks or seasons; customisable faces; real-person likeness; voice clones.
- **Lifecycle:** at the class boundary, keep the tutor unless their `serve` range ends. Retirement or a failed voice ABX
  goes through the identity-change flow (child and parent told, memory carried over).

### 7.5 Data model

```ts
// shared/contracts.ts (proposed). The catalogue is a versioned static manifest, not DB rows.
export interface TutorCharacter {
  id: string; status: "draft" | "panel_review" | "community_review" | "live" | "paused" | "retired";
  displayName: { roman: string; deva: string };
  roleChips: ("didi" | "bhaiya" | "maam" | "sir")[];          // UI only; never compiled into prompts
  styleNote: Record<Lang, string>;                            // ≤ 8 words, teaching style, reviewed copy
  fit: { offerClasses: [number, number]; serveClasses: [number, number]; maturity: "S1" | "S2" | "S3" };
  look: {
    rev: number;                                              // GLB + plates cache key (persona edits never touch media)
    presentedGender: "F" | "M"; apparentAge: number; mst: number;
    markers: { kind: string; communityReviewId: string }[];
    silhouetteHook: string; signatureColorToken: string;
    thumb: AssetRef; tiers: { B: AssetRef; D: AssetRef; A?: AssetRef };   // a character goes live only with B and D
    faceStyle: { smile: number; headGain: number; browGain: number; blinkPerMinSpeaking: number; idleEyeContact: number /* ≤ 0.7 */ };
    behaviour: { restSmile: number; nodGain: number; tiltBias: number; avertSide: "left" | "right"; wobble: boolean;
                 asymSeed: number; degToMorph: Record<string, number>; shapeGain: Record<string, number> };
    licences: { asset: string; licence: string; url: string; attribution?: string }[];   // G10 + preview attribution
  };
  voice: {
    realtimeVoice: string; ttsTwin?: string; identityRev: number;   // identityRev bumps only on a failed ABX
    earTestId: string; grammaticalGender: "f" | "m"; cps: number;
    lip: { speakerMeanHz: number; model: AssetRef; jawGain: number; jawCeiling: number; shapeGain: number; lipMatrix: number[][] };
    faceDelayMs?: Partial<Record<"speaker" | "wired" | "a2dp" | "le_audio", number>>;   // overrides from E-P8
  };
  persona: { sheetId: string; sheetVersion: string };
  preview: Record<Lang, { segment: { file: AssetRef; startMs: number; durationMs: number }; lufs: number; peaks: string;
                          captions: { tMs: number; text: string }[]; scriptVersion: string; parent?: AssetRef }>;
  safety: { nameCheckId: string; panelIds: string[]; disclosureClipId: string };
}
interface AssetRef { url: string; bytes: number; sha256: string }
// cache keys: GLB/plates = id@look.rev · previews = id@look.rev+voice.identityRev+scriptVersion · greetings = id+voice.identityRev+childId
```

```sql
-- db/migrations/00x_tutor_choice.sql (sketch)
alter table child add column tutor_picker_seed int not null default floor(random()*2147483647);
create table child_tutor_pair (child_id uuid references child(id) on delete cascade, character_id text not null,
  address_term text check (address_term in ('didi','bhaiya','maam','sir','name','teacher')),
  introduced_at timestamptz, primary key (child_id, character_id));
create table tutor_switch (id bigint generated always as identity primary key,
  child_id uuid not null references child(id) on delete cascade, from_id text, to_id text not null, to_rev int not null,
  source text not null check (source in ('child','child_random','parent','system_retire','class_change')),
  shown text[] not null, positions int[] not null, previews_played text[] not null default '{}', ms_to_choose int,
  at timestamptz not null default now());                     -- analytics only; never read by brief/affect/vibe/Director
create table parent_tutor_policy (child_id uuid primary key references child(id) on delete cascade, allow text[],
  switch_mode text not null default 'free' check (switch_mode in ('free','ask','locked')),
  updated_at timestamptz not null default now());             -- deliberately no reason column
-- memory: tm_* rows move from teacher_id to scope text not null default 'taxila' (fail-closed predicate kept);
-- add voiced_by text ('id@rev') to tm_episode, tm_callback, turn, and commitment rows.
```

```js
// server/compiler/characters/eligible.js. Replaces teacherFor()'s `class_level <= 4 ? asha : arjun`.
export function eligibleTutors(child, catalogue, policy) {
  const cls = child.class_level, [min, max] = CHOICE[bandOfClass(cls)];      // B1 [2,2] B2 [2,3] B3/B4 [2,4]
  let el = catalogue.filter((t) => t.status === "live" && cls >= t.fit.offerClasses[0] && cls <= t.fit.offerClasses[1]
                                && (policy.allow == null || policy.allow.includes(t.id)));   // NO device-tier term (G-3.1)
  if (el.length < min) return { mode: el.length === 1 ? "family_chose" : "fallback_default", tutors: el };
  return { mode: "picker", tutors: pickCovering(seededShuffle(el, child.tutor_picker_seed), max) }; // ≥1 per gender, ≥1 MST≥6 when available
}
```

**Memory invariants (CI; if one trips, the change is wrong):**
- A switch changes zero memory rows (hashes before and after are equal).
- The NOTEBOOK packet bytes are identical under every live character, apart from the `HANDOVER` slot.
- No cross-tutor retelling (said-ledger), with a negative control that must fail.
- No comparison or absence talk.
- "Bhool jao" (forget) is global.
- 409 during a live session.
- `tutor_switch` is never read by the brief, affect, vibe or Director code.
- Director moves are byte-equal across characters on the fixture set (pedagogy parity, rubric spread ≤ 0.3).

The notebook is "the child's notebook" (not "Didi ki notebook"), with a tutor portrait on each entry. A new tutor's
opener cites the notebook ("I have your notebook"), never "just knowing".

---

## 8. v2: the video avatar path and its economics

### 8.1 What can be built under the Azure-only directive

- **Buildable:** (a) the Azure TTS avatar (Voice Live); (b) open-source models self-hosted on Azure GPUs.
- **Benchmarks only:** Simli, HeyGen LiveAvatar, Tavus, D-ID, Anam, Synthesia and Beyond Presence.
  - Correction to tech-and-market §2.1: Tavus (Echo mode), D-ID (Echo Sessions), Anam and Synthesia (LiveKit plugins)
    *do* take our audio. Hedra has no realtime product.
- **Escalate to the owner, not decided here:** Beyond Presence on-prem on our Azure GPUs.

### 8.2 The architectural rule

Whoever renders the video owns the audio clock. The child must hear the **renderer's** audio. Three consequences:
- **Truncation on barge-in** uses the **client-reported playout position** (`getSynchronizationSources`/`getStats`), not
  the model's generated offset and not the renderer's sent position.
- **Barge-in to silence ≤ 150 ms** needs a *client-side* VAD that mutes the video element immediately, with every
  pipeline queue flushed and 2–3 mouth-closing frames rendered.
- **The renderer is a single point of failure for the voice.** It needs a hot-standby audio track and, on failure, a
  held last frame, not a mid-sentence swap to 3D (a different-looking person).

### 8.3 Economics (`video-avatar-v2-cost.py` [M], with the review's corrections)

| option | $/session-min | full 45-min lessons, $/student-mo | hybrid 12 min | moments 2 min |
|---|---|---|---|---|
| Azure standard avatar (RT) | 0.50 (+ $0.60/h hosting per custom endpoint) | **450** | 120 | 20 |
| MuseTalk 1.5 on A100 VM, **sessions pinned (2/GPU)** | ≈ 0.044 | ≈ 40 | ≈ 10.4 | ≈ 1.74 |
| Ditto on A100 VM (1/GPU; weights have no declared licence; InsightFace) | ≈ 0.086 | ≈ 77 | ≈ 20.7 | ≈ 3.45 |
| Wav2Lip-256 on ACA T4 | **not commercially usable** (non-commercial code and weights) | n/a | n/a | n/a |
| **pre-rendered narration (v2a)**, MuseTalk on Spot A100 ($0.95/h) | one-time ≈ **$198 per character** for 30,000 video-min; ≈ $0.0066/video-min | + ≈ $0.12 egress | | |

What the table means:
- **Budget:** at 20% of revenue the avatar can spend $0.69 (₹299) to $6.89 (₹2,999) per student-month.
- **Live lessons:** **nothing commercially usable fits full live lessons at any tier.**
  - With sessions pinned, MuseTalk hybrid ($10.4) fits **no current tier**. ₹2,999 allows $6.89; hybrid would need
    ≈ ₹4,500, or a per-utterance GPU-pool scheduler that brings it back to ≈ $6.14 and so fits ₹2,999.
  - MuseTalk moments ($1.74) fit ₹999+. Ditto moments ($3.45) fit only ₹1,499+.
  - Peak-hour fleet allocation raises costs further: ≈ $11.6–19k/month per 1,000 hybrid students.
  - A warm floor of one A100 costs $3,754/month.
- **Encoding:** the A100 has **no NVENC**. Encode with x264 on the CPU, or use A10 / T4 / RTX PRO 6000 slices (E-13).
- **Latency:** MuseTalk "tuned" is more likely 450–700 ms than 250–350 ms [U]. E-3 is the likely kill test.

### 8.4 Decision rule [D]

- **Now (v1, v1.5):** no live video.
- **v2a: pre-rendered narration video.** Trigger: v1 narration caching exists *and* the Hindi lip-sync check (E-5), the
  throughput check (E-7) and the children's preference test stratified by age (E-8) pass.
  - **Render** with MuseTalk 1.5 (MIT). Not LatentSync (InsightFace detector) and not Ditto until its detector is swapped
    and the weights are licensed.
  - **Character video assets:** a filmed consenting actor, a self-hosted OSS image-to-video model, or a single portrait.
    **Azure Sora 2 rejects input images with human faces** [V].
  - **Cache key:** `(segmentId, characterId, voiceId, renderVersion)`.
  - **Playback** only while the realtime session is idle *and the uplink is disabled*, framed as "her recorded
    explanation" with the live 3D tutor present.
  - **Labelling:** a persistent AI label plus C2PA provenance (MeitY IT Amendment Rules 2026 [S]).
  - **Effort:** ≈ 1.5–2 engineer-months plus content.
- **v2b: live "Studio" tier.** Ship only when **all** of these hold:
  - a ≥ ₹2,999 tier (hybrid) *with* the per-utterance GPU-pool scheduler built, or moments-only use in ≥ ₹999 plans;
  - ≥ 600 subscribers on that tier;
  - an A/B lift over the 3D tutor;
  - added first-audio ≤ 250 ms p50 / ≤ 400 ms p95;
  - barge-in ≤ 150 ms;
  - Hindi lip-sync passing E-5 (≥ 90% bilabial closure);
  - the audio-floor gate unchanged;
  - GPU quota granted.
  - Run it as a one-week E-3 spike first. Effort if it passes: ≈ 5–7 engineer-months plus 5–10 weeks of content.
- **v3:** an on-device photoreal head driven by the same `FaceFrame`. Blocked today: estimated ≈ 3–5 FPS on a
  Mali-G52 [U]; FLAME, VFHQ and NeRSemble licensing.
- **Child safety for any photoreal tier:** a persistent AI badge, a spoken AI introduction, no human backstory, a
  parent-visible stylised option, and for ages 6–8 a "is she a real person?" probe at ≥ 95% correct. Never send the
  child's camera or microphone to a renderer.

**Contract** (keeps every door open; `shared/contracts.ts`, when v2 starts):

```ts
export interface VideoTutorRenderer {
  open(o: { sessionId: string; characterId: string; region: "centralindia" }): Promise<{ joinUrl: string; token: string }>;
  pushAudio(u: { utteranceId: string; pcm16_24k: Int16Array }): void;
  endUtterance(utteranceId: string): void;
  interrupt(): Promise<{ utteranceId: string | null; sentMs: number }>;   // truncate at min(sentMs − downstream, clientPlayedMs)
  setState(s: { state: FaceState; emotion?: FaceEmotion; gazeTarget?: GazeTarget }): void;
  on(ev: "speak_started" | "speak_ended" | "speak_interrupted" | "starved", cb: (e: { utteranceId: string; t: number }) => void): void;
}
```

---

## 9. Build order

### 9.1 Start these now (long poles; none blocks M0)

| item | owner | why it is critical path |
|---|---|---|
| Azure GPU quota (NCas T4, NVads A10, NC A100 v4) | main loop → owner | the student-model teacher data (v1.5) and v2a depend on it; startup subscriptions often start at zero |
| blind voice ear tests for slots F-A, M-A, F-B, M-B, with realtime vs `ttsTwin` ABX | voice workstream | **the cast size is bounded by voices**; no sculpting before a voice passes |
| names: the `senior-m` name, plus real-person and trademark clearance for all four | owner + counsel | names are baked into captions, previews and audio |
| hire: art director (0.3–0.5 FTE) + contracted character artist (copyright assignment) | owner | ≈ 15–20 artist-weeks for the launch four |
| device lab: Helio G35, **Exynos 850** (below the GE8320 floor), Helio G85, SD 680, **Dimensity 6300**, **Unisoc T7250**, plus cheap A2DP TWS earbuds and a 240 fps camera | main loop | E-P1…E-P9, E-B7/8, M-SEL-6 |
| legal sign-offs: Mixamo bake (or author idles in-house), NVIDIA OML notice, training on gpt-realtime outputs | counsel | v1.5 |

### 9.2 Milestones

| # | milestone | contents | exit criteria |
|---|---|---|---|
| **M0** | **a talking 3D head on the lesson screen** (days) | vendor three 0.180.0 + TalkingHead b3e277b + HeadAudio d3af5f9 with TH-1…TH-8 and HA-1/2. Strip the **CC0 `mpfb.glb`** with `build-tutor.mjs`: drop visemes, morph normals, all-zero targets and brow/lash targets except blink/squint/wide; ETC1S; meshopt. `LevelMeter.onTap` in VoiceLink and TextLink. `<TutorStage>` mounted in `src/pages/LessonDev.tsx` (and in the lesson route's `StageFrame` behind the `face3d` flag). **Jaw from RMS only**; states from the tap VAD + `statusOf()`; minimal controller (gamma blinks, idle and contact gaze, no random liveliness) | it talks and blinks in a live VoiceLink lesson on desktop and one G85 phone; contract tests 1–3 green; no output node; `tsc -b`, `vite build` and `npm test` green. **Internal only: `mpfb.glb` is a realistic MakeHuman, not a Taxila character, and never reaches children** |
| M1 | lip shape | HeadAudio classes → `lipMatrix` (an MPFB-derived matrix for M0); N-1 clamp, N-2 predict-every-frame, fractional resample, level normalisation; bench re-scored per R-7; E-3 on received WebRTC audio; E-1 Hindi retrain | r(open) within 0.02 of RMS-only (shapes must not hurt openness); E-1 bars: PP recall ≥ 70%, vowel false-close ≤ 20% |
| M2 | behaviour controller | port `controller.mjs` with the GR-1 fixes; FSM on local signals; TurnClock fixes; compositor rules; Director `direct()` + module `module()` wiring; invariants I1–I14 + mutation check in CI | CI green; E-B3 (TurnClock); E-B4 (accents on real audio) |
| M3 | tiers, fallbacks, sync | DeviceTier plugin, static tier, probe, merged governor; D and E tiers; `faceDelay` + route table + clock discipline; E-P5, E-P7, E-P8, E-P3, E-P9 on the lab phones; **then** the worklet + worker renderer (phase 2) behind E-P1/E-P2 | tier-B bars hold at **minute 30** (interval p95 ≤ 40 ms, < 1% of frames > 50 ms, ≤ 20 MB avatar resident, ≤ 0.4 W); signed offset within −125…+45 ms on every route; audio-floor gate unchanged (§10) |
| M4 | character 1 + M-AV-1 | `asha` (or whichever F-A voice passes first) through S0–S12; all gates green; warp-derived S1/S3 arms; **M-AV-1** with voiced tier-B captures, kids' panels split ≤ 9 / ≥ 10; M-AV-2 voice-face fit; E-B1 | M-AV-1 bars (S2 "weird" ≤ S1 + 5 pp in classes 1–4 and ≤ 15% in classes 5–9). **Stop rule:** if no level passes for B3–B4, those bands default to `small` / `voice` presentation and the owner is told |
| M5 | roster + selection | the remaining three characters; previews (G-PREV); picker C1b + My teacher + parent controls; memory scope migration + invariants; `eligibleTutors()`; speculative warm-up; greeting on the head | M-SEL-6 timings on the lab phones; memory invariants green; roster-lint 0/9 failing; M-AV-6 instrumentation live |
| M6 | v1.5 student | teacher labels on Azure GPU; student + hand kernel; E-2/E-3/E-4 | §3.8 bars; ships behind the `FaceFrame` seam |
| M7 | v2a | pre-rendered narration video | §8.4 v2a triggers |

**Effort to launch (M0–M5) [U, summed from the reviews]:**
- **Engineering:** ≈ 16–22 engineer-weeks. That is renderer and patches 3–4, behaviour 2–3, tiers, governor and sync 4–5,
  selection and previews 5–7, factory tooling 2–3.
- **Art:** ≈ 15–20 artist-weeks, plus art direction.
- **Calendar:** 4–8 weeks of child and parent studies (M-AV-1, E-B1/2/6) on the critical path.
- **Not included:** the student (M6) adds ≈ 8–11 engineer-weeks.

---

## 10. Consolidated gates and experiments (log each result to `context/measurements.md` with n, method and date)

**The audio-floor gate (AF).** Taxila has no `echosim`; that harness simulates html-portfolio's `liveCall.ts`, and Taxila
relies on browser AEC over WebRTC. So AF here is four checks:
- (a) contract test 1 (no avatar audio node reaches `destination`);
- (b) the `evals/webrtc` harness with the avatar on and off;
- (c) an **on-device E-5b / M-LE-6 run**: self-interrupt rate, `synthesizedSamplesDuration` and the echo the model
  reports, on speaker, wired and A2DP, avatar on vs off;
- (d) a check that `createMediaStreamSource(remoteStream)` gives non-silent samples in the WebView.

AF runs before any change to the audio graph, including the phase-2 worklet.

| id | question | pass bar | when |
|---|---|---|---|
| bench | lip change vs Azure hi-IN ground truth (§3.6) | no r loss; closure gains without vowel chatter | every lip change |
| E-1 | HeadAudio retrained on our Hindi tutor voice | hi PP recall ≥ 70%, vowel false-close ≤ 20%, r ≥ as-shipped | M1 |
| E-3 (web-3d) | bench on received gpt-realtime WebRTC audio | same ranking as the Azure-TTS bench | M1 |
| E-P1 / AF | worklet tap vs analyser relay | AF unchanged; underrun Δ ≤ 0.1 pp; offset logged at 0/15/45 min | before phase 2 |
| E-P2 | worker vs main thread with a busy module, in the real APK | frames > 50 ms ≤ 2 per 10 s; lip gap p99 ≤ 45 ms | before phase 2 |
| E-P3 | 45-min lesson per tier per phone, measured at minute 30 | interval p95 ≤ 40 ms, < 1% > 50 ms; ≤ 0.4 W; no renderer kill; ≤ +6 °C | M3 |
| E-P5 | GL facts + MSAA arms + renderer strings | facts recorded; MSAA decision made | M3 |
| E-P7 | compile vs first render timed separately | first spoken frame stall ≤ 50 ms | M3 |
| **E-P8** | **signed A/V offset per route** (240 fps camera, click + jaw flash through a real PeerConnection) | **−125 ≤ offset ≤ +45 ms** after compensation on speaker, wired and A2DP; drift < 20 ms over 45 min | M3 |
| E-P9 | ≈ 35 °C ambient and while charging | if MODERATE fires in most runs, add a hot-weather fps budget inside B | M3 |
| E-B1 | controller vs lips-only vs TalkingHead defaults (B2, B4, parents; adds an eye-roll / annoyance probe) | controller ≥ defaults on "real teacher" and ≤ on "weird" | M4 |
| E-B2 | continuer nods on vs off | open-turn length ≥ off; no rise in "she thought I was right" on wrong answers | M4 |
| E-B3 / E-B4 | TurnClock; accents on real Hindi audio | yield ≥ 1 s before stop in ≥ 95%; accents within ±120 ms ≥ 60% | M2 |
| E-B6 | head-wobble continuer by region | ≥ 60% preference in a region before shipping it there | after launch |
| E-B7 / E-B8 | controller cost on device; passive mic tap AEC/AGC A/B | p99 ≤ 0.5 ms; no measurable change | M3 |
| M-AV-1 | creepiness and appeal by band, S1/S2/S3 (voiced tier-B captures) | S2 "weird" ≤ S1 + 5 pp (cl. 1–4) and ≤ 15% (cl. 5–9) | M4 |
| M-AV-2 | voice-face fit | ≥ 70% correct blind pairing | M4 |
| M-AV-5 | Hindi lip believability, with +120 / −200 ms offset controls, on tier-B phones + a BT arm | ≥ 4/5 natural; controls detected | M4 |
| M-AV-6 / M-SEL-3 | choice distribution, position-adjusted | no tutor < 10% after adjustment (redesign, never drop) | after launch |
| M-SEL-6 | picker timings (tap → frame ≤ 150 ms; greeting ≤ 200 ms speaker/wired; live face ≤ 3 s APK) + preview A/V marker | bars met | M5 |
| M-SEL-11 | preview-to-live "same teacher?" | ≥ 85% | M5 |
| E-3 (v2) | live MuseTalk latency on an A100 in centralindia, over 4G | ≤ 250 / 400 ms; barge-in ≤ 150 ms | v2b spike |

---

## 11. Not v1 / rejected (consolidated; each is in a source doc with its evidence)

| item | what broke or why | source |
|---|---|---|
| wawa-lipsync on live audio | best alignment 217–233 ms late; 0 of 34 English bilabial closures [M] | web-3d §5 |
| 120 ms viseme min-hold | r 0.43 → 0.16; closures 55 → 14 of 84 [M] | web-3d §5 |
| wav2vec/HuBERT face models on device | 402 MB of weights; 491 ms per audio-second on one Xeon thread; 100–167 ms of lookahead [M] | web-3d, a2f |
| playback through WebAudio / DelayNode for lookahead | leaves Chromium's AEC reference path | all |
| Draco on face avatars (morphs unquantized) | files 89–96% of raw; 2–5× slower decode [M] | perf |
| WebP textures on the GPU | 5.59 MB per 1024², against 0.70 MB for ETC1S [M] | perf |
| naive shape-key delta transfer under stylisation | 1.3–8.1% cornea visible at blink [M] | char §6 |
| decimating a realistic head for mobile | lids and lips break [M] | char §6 |
| export without clearing split normals | 3.95× GPU vertices [M] | char §6 |
| redrawing blink timers on state change | rate halved in short states [M] | behaviour §8.3 |
| `concealedSamples` as an avatar-load signal | it measures network loss, which the avatar neither causes nor fixes | perf P-4.5 |
| `compileAsync` alone for the first-render stall | morph packing happens on the first render | perf P-2.2 |
| TalkingHead's built-in liveliness, coin-flip gaze, head shakes, sad face, mimicry, emotion recognition | uncontingent, ambiguous or shaming | behaviour |
| a fixed picker order with a default; per-character memory scope; band-bound personas; a tutor speaking over a still portrait; previews better than the runtime | §7 | selection |
| a live 3D picker; tutors gated by payment or rewards; customisable or real-likeness faces; the "friend" framing | §7 | selection |
| the Azure TTS avatar for lessons; per-character custom Azure avatars "just in case"; playing direct audio with separate video; InsightFace / Wav2Lip / LatentSync in a paid product | §8 | v2 |
| R3F, Babylon, model-viewer, WebGPU, Rive, Ready Player Me, Avaturn/MetaPerson, VRoid, TRELLIS.2 / Hunyuan / Meshy / Tripo for shipped assets, the MMS aligner, Audio2Emotion | §1.4–1.5 | all |

---

## 12. Conflicts this spec resolves

| topic | conflict | resolution |
|---|---|---|
| launch face | PRODUCT-DESIGN §3.5 (2D Rive; 3D behind M-UX-6 on tier A) vs owner 2026-10-02 (3D) | 3D on tier B and up; D plate rendered from the same 3D character; M-AV-1 replaces M-UX-6 |
| launch cast | PRODUCT-DESIGN / `ds-band-fork-older` (two characters, woman and man) vs character-creation (4 + 2) | 4 launch if four voices pass, minimum 2 (`asha` + `arjun`, widened); amends the "two characters" clause only |
| who picks in B1–B2 | PRODUCT-DESIGN (parent picks at P6) vs selection-ux (child picks at C1b) | the child picks at C1b in every band; the B1 switch policy defaults to "ask parent" |
| names | Asha / Anaya / asha-didi; Arjun (young) vs Arjun Sir (42) | §5.1: `asha`, `arjun`, `nandini`, `senior-m` (new name) |
| main thread vs worker | web-3d / behaviour (main-thread AnalyserNode) vs perf (worklet → worker) | phase 1 main thread on the existing tap; phase 2 worker behind E-P1/E-P2/AF |
| morph set | 67 (52 + 15 visemes) vs 52 | ship 52; visemes are authoring targets for `lipMatrix` |
| eye rotation | bones vs `eyeLook*` | bones rotate; `eyeLook*` for lid-follow only |
| budgets | character-creation §7 (25k tris, 6 draws, 2.5 MB, 15 fps idle) vs perf §4 | perf tier B (15k, 4, 1.5 MB, 30/30/20) |
| tier C | perf §8.2 (2.5D sprite) vs its own review | cut from v1 |
| speaking/stop signal | `output_audio_buffer.*` events vs tap VAD | the tap VAD is canonical; events are hints |
| AA | DPR 1.25 without MSAA vs MSAA on tilers | default DPR 1.0 + MSAA×4 + A2C; E-P5 decides |
| B-lite | separate 28-target GLB at 8 MB vs runtime knobs | runtime knobs; 20 MB budget |
| preview | 320² Baseline + ttsTwin + −24.5 LUFS vs review | 512² Main, the realtime voice, live-matched loudness |
| eligibility | device-tier filter | removed; a character goes live only with B and D assets |
| lesson-route JS budget | +150 KB br vs 217.5 KB gz avatar chunk | the avatar chunk is a separate lazy budget line (§1.1) |

---

## Sources

The seven sibling docs and their reviews, as listed at the top, plus:
- the bench and prototype folders: `bench/` (`bench.mjs`, `bench-result.json`, `glbstat.mjs`, `perf/`, `review/`,
  `student-ort/`), `behaviour-proto/`, `character-pipeline-proto/`, `selection-proto/`, `video-avatar-v2-cost.py`;
- the code read: `src/lesson/{link,voiceLink,textLink,level,status,realtime,moduleEvents}.ts` and `shared/contracts.ts`;
- design and context: PRODUCT-DESIGN §3.5, §3.15 and §7.2–7.3; `context/decisions.md` (`azure-only-compute`,
  `voice-realtime-model`, `voice-turn-config`, `ds-mic-tap-default`, `ds-band-fork-older`, `ds-status-carriers`).

Primary external sources are cited in each sibling doc (TalkingHead @ b3e277b, HeadAudio @ d3af5f9, three.js 0.180.0,
NVIDIA A2F-3D, ITU-R BT.1359-1, W3C webrtc-stats, Android ADPF, Azure Retail Prices API, and others).
