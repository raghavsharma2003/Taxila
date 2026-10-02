# Audio-driven facial animation ML for the Taxila 3D tutor

Date: 2026-10-02. Question: which audio-to-face models can drive a 3D Indian tutor's face (lip-sync, blinks,
gaze, brows, head, smiles, listening and thinking) from Azure `gpt-realtime-2.1` audio, which arrives as a
WebRTC `MediaStream` with no visemes? What runs in a phone browser or Android WebView on a ₹10k phone, what
needs a GPU server, and how big is the quality gap? How do the Director's moves become expressions?

Evidence tags (same scheme as `../tech-and-market.md`):
- **[V]**: verified from a primary source I read: the repository source, model card, config file, license text or paper.
- **[S]**: secondary source or vendor claim, not reproduced.
- **[U]**: unverified. This covers my estimates and arithmetic, and anything that needs a measurement before a decision relies on it.

Builds on: `../tech-and-market.md` §2 (2D Rive v1 recommendation, video-avatar prices) and
`../../harvest/companion-tech.md` §13 (lip-sync must be slaved to the playback clock, rendering must stay off
the audio thread, and any change to the audio path must re-run echosim).

---

## 0. TL;DR: the findings that change decisions

1. **No heavyweight audio-to-face model runs in real time in a ₹10k phone's browser, and none needs to.** Every
   strong model is built on wav2vec2 or HuBERT, with 95–180 M parameters:
   - NVIDIA Audio2Face-3D v3.0 has 180 M parameters and requires TensorRT and CUDA 12.8 **[V]**.
   - The "1.8 MB CPU" `wav2arkit_cpu` ONNX export ships a **402 MB** external weight file (`wav2arkit_cpu.onnx.data`, 402,063,360 bytes) **[V]**.

   The design that works is **teacher on the server, student on the phone**. A2F-3D (and/or LAM-A2E and Azure TTS
   blend shapes) labels hours of *our own tutor voices* offline. A ~0.3–1 M-parameter causal student
   (log-mel → ARKit mouth/jaw channels) runs in a Worker at roughly 5–10% of one little core **[U, estimate §3]**.
2. **Audio2Face-3D is open and commercially usable.** It was released on 2025-09-24 **[V]**:
   - The SDK and training framework are MIT and Apache-2.0 **[V]**.
   - The weights are under the NVIDIA Open Model License: commercial use is allowed, and *you own derivative models*. Outputs are explicitly not derivative models **[V]**. Distilling a student from its outputs is therefore allowed.
   - Audio2Emotion is the exception: its weights carry a custom license that is "restricted to Audio2Face use" **[V]**. Do not build on it.
   - **Limits:**
     - It was trained on **3 actors** in **English and Mandarin** **[V]**. Hindi lip accuracy is unknown **[U, measure]**.
     - Its own paper says upper-face and eye motion "lack semantic grounding" and that it produces no idle or listening motion **[V]**.
3. **A2F could run server-side on Azure, and it is cheap**, at roughly $0.001–0.005 per stream-minute **[U]**:
   - NIM batch sizes are 32 diffusion streams per A10G and 16 per L4 **[S]**.
   - An NV36ads_A10_v5 in Central India costs $4.48/h, and an NC4as_T4_v3 costs $0.579/h **[S]**.

   **But our transport defeats it.** Over WebRTC the tutor's audio goes straight from Azure to the browser, so a
   server never sees it. Server-side A2F only makes sense for **offline** work: teacher-data generation, and
   pre-baked face tracks for cached audio such as greetings, intros and narration.
4. **Over WebRTC, the lip model has no lookahead unless we delay the audio, and delaying the audio is a trap.**
   - Routing remote audio through WebAudio to add a `DelayNode` takes it off Chromium's AEC reference path. That is the known "WebAudio output isn't echo-cancelled" class of bug **[S]**, and it is exactly the echosim failure class.
   - So the student must be **causal and trained to forecast** (predict the pose 30–60 ms ahead).
   - The analysis branch is analysis-only: it never connects to `destination`.
   - The ITU-R BT.1359 thresholds when audio leads video are +45 ms (detectable) and +90 ms (acceptable) **[S]**. That is the budget.
5. **Most of "feels like a real person" sits in the layers no audio-to-face model produces:**
   - expression driven by intent,
   - prosody-driven brows and nods,
   - blinks clustered at pauses,
   - gaze aversion when thinking,
   - listening behaviour while the child talks.

   Taxila's Director already knows the intent of every turn. **Drive emotion from the Director's move, not from
   recognising emotion in audio.** Categorical audio emotion recognition was already rejected in the portfolio
   (macro-F1 0.43, `tech-and-market` rejected #8). A2E is license-locked anyway.
6. **Photoreal 3D (Gaussian heads) is real, but not on ₹10k phones yet:**
   - LAM-20K reports **110+ FPS on a Xiaomi 14** (Snapdragon 8 Gen 3) **[S]**. A ₹10k Mali-G52/G57-class GPU is an order of magnitude weaker **[U]**.
   - LAM depends on FLAME, and its repository has an open, unanswered licensing issue (#111, 2026-09-15) about which FLAME edition it ships **[V]**.
   - GaussianAvatars is CC BY-NC-SA, GaussianTalker uses the Inria non-commercial Gaussian-Splatting license, and Meta's audio2photoreal and Ava-256 are CC BY-NC **[V]**.

   **Make ARKit-52 + head pose + gaze the face protocol (`FaceFrame`).** A stylised GLB, a later Gaussian head
   (LAM WebRender consumes ARKit blend shapes **[V]**) and a server video avatar can then all be driven by the same stream.
7. **Hindi-specific risk is concentrated in a handful of sounds:**
   - Bilabial closures (/p b m/ plus the aspirated /pʰ bʰ/) are the single most-noticed lip error. A2F's paper scores exactly this, as a "bilabial sound score" **[V]**.
   - Hindi /ʋ/ (व) may come out wrongly rounded like English /w/.

   Measure closure rate on Hinglish before trusting any teacher **[U]**.

---

## 1. Constraints this design must satisfy

| constraint | source | consequence |
|---|---|---|
| Audio is a WebRTC remote `MediaStream`; gpt-realtime emits no visemes | product brief; `tech-and-market` §2.2 | lip motion must be inferred from audio on the client (or from text, which has no timestamps) |
| ₹10k Android phones, in Chrome and in an Android WebView (Capacitor) | brief | WASM + WebGL2 baseline. WebGPU is stable in Android Chrome 121+ on Android 12+ with Qualcomm/ARM GPUs, but **WebView availability is unconfirmed** **[S]**, so do not depend on it |
| Lip-sync slaved to the playback clock; no rendering on the audio thread | `companion-tech` §13 | features in the AudioWorklet (cheap), inference in a Worker, pose sampled by timestamp in rAF |
| Any extra audio path re-runs echosim | `companion-tech` §13 | the analysis branch must be analysis-only (no output) and must not reroute playback |
| Several selectable characters (gender, age, style; Indian) | brief | rig-agnostic output (ARKit-52), with per-character style as parameters rather than per-character models |
| Speed and quality are never traded away | inherited owner directive | no added audio delay. Quality comes from distillation and forecasting, not lookahead |
| Children aged 6–15 watch | brief | stylised over hyper-real at v1 (uncanny valley). Never fake recognition of the child's emotion |

---

## 2. The landscape: what each system is, and whether Taxila can use it

### 2.1 Summary table

Abbreviations used in the table:
- "AR" means autoregressive.
- "Code" and "weights" licences are listed separately because they usually differ.
- "Data-encumbered" means the released weights were trained on non-commercial datasets (VOCASET, BIWI, 3D-ETF, RAVDESS and similar). That is a legal risk for a commercial product even when the code is MIT **[U, legal review]**.

| system | year | output | real-time? where | code / weights licence | Taxila verdict |
|---|---|---|---|---|---|
| **NVIDIA Audio2Face-3D v2.3** (regression, Mark / Claire / James) | 2025 OSS | 272- or 140-d skin PCA + tongue + jaw + eyes, then a **52-pose blend-shape solve** **[V]** | GPU (TensorRT): 453 FPS single track on an RTX 4090 **[V]** | SDK MIT; weights NVIDIA OML **[V]** | **Teacher.** Fixed 520 ms window centred on the frame, so **260 ms lookahead** **[V]** |
| **NVIDIA Audio2Face-3D v3.0** (diffusion, multi-identity) | 2025-09-24 | per-frame vertex deltas (skin 72,006, tongue 16,806, jaw 15, eyes 4), then a blend-shape solve **[V]** | GPU: 3,269 FPS single track, 1,250 FPS with 8 tracks on a 4090, 2 diffusion steps **[V]** | weights NVIDIA OML **[V]** | **Primary teacher.** 1 s buffer, 0.5 s hop, 15-frame right truncation, so roughly 0.5–1 s algorithmic latency **[V/U]**. Offline only |
| NVIDIA Audio2Emotion v2.2 / v3.0 | 2025 | 10 emotion weights | GPU | custom licence, "use allowed with Audio2Face only" **[V]** | **No.** We know the intent, so we don't need to infer it |
| **LAM-A2E** (Alibaba Tongyi) | 2025 | ARKit-52 (adapted to FLAME) **[V]** | GPU. Streaming in 1 s chunks over a 64-frame (2.13 s) context **[V]** | Apache-2.0 **[V]** (training data undisclosed) | **Second teacher.** Its ARKit output is native |
| `myned-ai/wav2arkit_cpu` (fused wav2vec2-base + LAM-A2E) | 2025 | ARKit-52 at 30 fps **[V]** | "~45 ms per 1 s of audio" on an unspecified desktop CPU **[S]**; **402 MB weights** **[V]** | Apache-2.0 **[V]** | Server-CPU option only. Too big for a phone |
| `myned-ai/avatar-chat-server` | 2025 | OpenAI Realtime → wav2arkit → WebSocket `sync_frame` at 30 fps (PCM + blend shapes) **[S]** | server CPU, "4+ cores", RTF < 1 **[S]** | MIT **[V]** | Reference for the "server relays audio + face" design (§8) |
| FaceFormer | CVPR 2022 | vertex offsets on the VOCA (FLAME) or BIWI mesh | not streaming (AR transformer over the whole utterance) | code MIT **[V]**; weights data-encumbered | Research baseline only |
| CodeTalker | CVPR 2023 | vertices via a VQ codebook | AR, not low-latency | code MIT **[V]**; weights data-encumbered | Baseline only |
| SelfTalk | ACM MM 2023 | vertices, with a lip-reading consistency loss | offline | CC BY-NC 4.0 **[V]** | No (NC) |
| EmoTalk (+ 3D-ETF dataset) | ICCV 2023 | **52 blend shapes** with emotion level and personal style **[S]** | GPU | CC BY-NC 4.0 **[V]** | No (NC). Its ideas (emotion-level input) carry into our student |
| UniTalker | ECCV 2024 | multi-head: one head per dataset topology, including a 3D-ETF blend-shape head **[V]** | GPU | code Apache-2.0 **[V]**; weights trained on BIWI, VOCASET, meshtalk and 3D-ETF (NC sets) **[V]** | No for weights. Multi-head training is a useful pattern |
| ARTalk | SIGGRAPH Asia 2025 | FLAME expression (100) + pose (6), **including blinks and head pose** **[V]** | 0.01 s per 1 s of audio on an A100; 0.057 s on an M2 Pro **[V]** | code MIT **[V]**; needs FLAME weights and TFHP training data | Shows that full-head motion (blinks, pose) from audio works. Encumbered for us |
| DiffPoseTalk | SIGGRAPH 2024 | FLAME + head pose, diffusion | offline | research | Baseline only |
| **HeadAudio** (met4citizen) | 2025 | 15 Oculus visemes **[V]** | **phone browser**: MFCC 0.025 ms + classifier 0.005 ms per frame **[V]**; 50–100 ms latency **[V]**; 14 kB model **[V]** | MIT **[V]** | **Day-1 fallback.** Retrain on Hindi/Hinglish (§5.6) |
| TalkingHead (met4citizen) | 2023–25 | full-body GLB driver: moods, blinks, eye contact, head moves, emoji expressions, gestures incl. `namaste` **[V]** | phone browser (three.js) | MIT **[V]** | **Harvest its procedural layer** (§6) |
| Azure TTS viseme / blend shapes | GA | 22 viseme IDs; **55-value blend shapes at 60 fps** **[V]**. `hi-IN`: viseme ID only; `en-IN`: viseme ID + blend shapes **[V]** | cloud TTS | paid service | **Third teacher** (clean labels on Azure voices), plus phoneme-aligned Hindi viseme labels |
| LiveSpeechPortraits | SIGGRAPH Asia 2021 | photoreal 2D video, person-specific | 30+ fps on a desktop GPU **[V]** | code MIT **[V]**; per-person training | No: per-person, image-to-image GAN, server GPU |
| GaussianTalker | ACM MM 2024 | person-specific 3DGS talking head | up to ~120 FPS on a 4090 **[S]** | Inria Gaussian-Splatting licence (non-commercial) **[V]** | No (licence, and per-person training) |
| GaussianAvatars | CVPR 2024 | 3DGS rigged to FLAME | GPU | CC BY-NC-SA 4.0 **[V]** | No (NC) |
| SplattingAvatar | CVPR 2024 | Gaussians embedded on a mesh; driven by blend shapes or skeleton | ">300 FPS on a modern GPU and 30 FPS on a mobile device" **[V]** | no LICENSE file in the repo **[V]**, so treat as all rights reserved | Proves that mesh-embedded splats driven by blend shapes run on mobile. Not usable as-is |
| **LAM** (Large Avatar Model) + LAM_WebRender | SIGGRAPH 2025 | one-image → FLAME-rigged Gaussian head driven by ARKit **[V]** | 562.9 FPS on an A100; **110+ FPS on a Xiaomi 14** **[S]**; WebGL renderer (npm `gaussian-splat-renderer-for-lam`) **[V]** | Apache-2.0 / MIT **[V]**, **but** FLAME licensing is unresolved (issue #111) **[V]** | v3 candidate for "video-real" on mid/high phones. Needs a legal check |
| TaoAvatar (Alibaba) | CVPR 2025 | full-body 3DGS, distilled to an MLP + blend shapes | 90 FPS on Apple Vision Pro **[S]** | research | Shows the distil-to-blend-shapes path |
| Meta Codec Avatars / SqueezeMe | 2024–25 | Gaussian full body, linear decoder | 3 avatars at 72 FPS on Quest 3; **0.45 ms** decoder on the NPU; 60k Gaussians **[S]**; driven by keypoints, **not audio** **[S]** | paper CC BY 4.0; datasets and code (audio2photoreal, Ava-256) CC BY-NC **[V]** | Not available. Validates "linear blend-shape-like decoders are what makes mobile possible" |
| Universal Gaussian Head Avatars (UniGAHA) | SIGGRAPH Asia 2025 | audio → expression space covering geometry *and appearance* (mouth interior, gaze, brows) **[S]** | not reported | not stated | Watch. This is the direction of "video-real from audio" |

### 2.2 NVIDIA Audio2Face-3D in detail

**What was released**, on 2025-09-24 **[V]**:

| piece | licence |
|---|---|
| C++/CUDA SDK, with Maya and UE5 plugins | MIT |
| Training framework (Docker, Python) | Apache-2.0 |
| Models on Hugging Face: v2.3 Mark, v2.3.1 Claire, v2.3.1 James, v3.0 | NVIDIA Open Model License |
| Audio2Emotion v2.2 and v3.0 | custom, A2F-only |
| Claire sample dataset | evaluation only |
| NIM microservice | NVIDIA SLA |

**Architecture**, from the paper (arXiv 2508.16401) and `network_info.json` **[V]**:

- **v2.3 regression.** A CNN over autocorrelation and wav2vec2 features, with an auxiliary phoneme head.
  - The input is a fixed `buffer_len` of 8,320 samples (520 ms at 16 kHz) with `buffer_ofs` of 4,160. The frame is produced at the window centre, so the model needs 260 ms of future audio.
  - Output is 140 skin PCA dimensions (272 for Mark) + 10 tongue + 15 jaw + 4 eyes, plus a 16-d implicit emotion and a 10-d explicit emotion input. The explicit emotions are amazement, anger, cheekiness, disgust, fear, grief, joy, out-of-breath, pain and sadness.
- **v3.0 diffusion.**
  - Built from a HuBERT encoder, a 2-layer GRU (latent 256) and 2 diffusion steps.
  - It has 3 identities (Claire, James, Mark). Each inference consumes a 1 s buffer (with 1 s padding on each side) and emits 60 frames, of which the 30 centre frames are kept. The step is 0.5 s, and the model is stateful across steps.
  - It has 1.80 × 10⁸ parameters, was trained on fewer than 10,000 hours of audio, and is ONNX → TensorRT only. Supported GPUs run from Pascal to Blackwell; the OS is Linux or Windows.
- **Blend-shape solve.** A post-process (GPU or CPU) fits the generated geometry to a 52-pose rig (`bs_skin_config_*.json`: `numPoses: 52`, L1/L2 regularisation, temporal smoothing 0.15, symmetry 100). Output is ARKit-style weights on the actor's rig **[V]**. A custom character is driven by *semantic* retargeting of these 52 weights; its geometry is never fed in.
- **Eyes.** The SDK post-processes eye rotations and "applies a saccade behaviour" **[V]**.
- **Training data and limits** **[V]**:
  - 3 actors, 50–70 sentences each, in 11 emotional states, in English and Mandarin. It was augmented with voice conversion, TTS + DTW, and generated silence.
  - The model card's bias section: "Measures taken to mitigate against unwanted bias: None".
  - Stated limits: noisy or non-verbal audio, upper face and eyes with "no semantic grounding", and no idle or listening motion.

**Can it run on Azure?** Yes. It needs CUDA ≥12.8, <13, TensorRT ≥10.13, and at least 4 GB of VRAM **[V]**. Every Azure
NVIDIA SKU (T4, A10, A100, H100) is in the supported architecture list **[V]**.

| | figure | tag |
|---|---|---|
| NIM optimised batch, A10G | 35 regression / 32 diffusion streams | [S] |
| NIM optimised batch, L4 | 30 regression / 16 diffusion streams | [S] |
| NIM GPU memory | ~2.2 GB for 1 stream, ~4.2 GB for 10 | [S] |
| NC4as_T4_v3, Central India | $0.579/h | [S] |
| NV36ads_A10_v5 (full A10), Central India | $4.48/h | [S] |
| A10 at 32 streams | ≈ $0.0023 per stream-minute | [U] |
| A10 at 50% utilisation | ≈ $0.005 per stream-minute | [U] |
| T4 (stream count unpublished; assume ~8–12) | ≈ $0.001 per stream-minute | [U] |

Even the worst case is about **$0.2 per 45-minute lesson**, against roughly $3.9 for the voice
(`../tech-and-market.md`, `../realtime-cost-model.py`). Cost is not the blocker. Transport and latency are (§8).

**Can it be distilled?** Legally, yes:
- The OML says "You are and will be the owner of Your Derivative Models".
- Derivative Models "exclude outputs generated by using the models".
- Distribution needs the Agreement plus a "Licensed by NVIDIA Corporation under the NVIDIA Open Model License" notice.
- Bypassing guardrails terminates the licence.
- (OML text last updated 2025-10-24.) **[V]**

So a student trained on A2F outputs is ours. Add the NVIDIA notice anyway; it costs nothing **[U, legal sign-off]**.

Technically, yes as well. The open dataset `myned-ai/audio2face-emotion-arkit-teacher` was built for this purpose **[S]**:
- 14,082 clips labelled by both A2F v2.3.1-James and LAM-A2E;
- 52-channel ARKit output;
- "condensing heavy GPU-bound audio2face teacher models into small student networks that run in real time on CPU".

Its audio comes from CREMA-D, TESS, JL and RAVDESS. Several of those carry NC/ND licences, so it is a
reference, not training data for us **[U]**.

### 2.3 Accuracy of the academic models (what "SOTA" buys)

ARTalk's comparison on TFHP (lower is better). LVE is lip vertex error, FFD is upper-face dynamics deviation, and
MOD is mouth-opening distance **[V]**:

| method | LVE | FFD | MOD | user preference for ARTalk (lip sync) |
|---|---|---|---|---|
| ARTalk | 9.34 | 18.15 | 1.81 | n/a |
| DiffPoseTalk | 10.39 | 20.15 | 2.07 | 63.1% |
| CodeTalker | 11.78 | 20.39 | 2.43 | 84.5% |
| SelfTalk | 12.07 | 23.74 | 2.57 | n/a |
| FaceFormer | 12.72 | 22.06 | 2.73 | 75.0% |

UniTalker reports a 9.2% LVE reduction on BIWI and 13.7% on VOCASET from scaling data to 18.5 h with a unified
multi-head model **[S]**.

**Reading:** across five years of papers, lip error improved by about 25%. The bigger perceptual wins came from
*head pose, blinks and style* (ARTalk's 86–93% preference on expression and style versus CodeTalker) **[V]**.
That supports TL;DR #5: the non-lip layers carry the realism.

---

## 3. What can run where: compute arithmetic for a ₹10k phone

Reference class: a Helio G81/G85/G99 or Snapdragon 4 Gen 2 SoC (2× Cortex-A75/A76 plus 6× A55), a Mali-G52/G57
MC2 or Adreno 613 GPU, 4 GB of RAM, and Android 13–14 **[U, pick 3 real devices for the bench, §10]**.

| workload | compute (estimate) | memory / download | verdict on a ₹10k phone |
|---|---|---|---|
| Amplitude RMS → `jawOpen` | ~0 | 0 | yes; it is the floor |
| HeadAudio (MFCC + Mahalanobis, 15 visemes) | 0.03 ms per frame **[V, desktop]** | 14 kB | yes; trivially |
| **Distilled student** (causal TCN/GRU, 0.3–1 M params, 80-bin log-mel at 100 Hz) | ~2 × params FLOPs per 10 ms frame, so 60–200 MFLOP/s; **≈5–10% of one A55 core** in WASM SIMD **[U]** | 0.3–1 MB int8 | **yes.** This is the v1 target |
| wav2vec2-base model (wav2arkit, LAM-A2E) | ≈ 2 × 95 M × 50 frames/s ≈ **10 GFLOP per second of audio**, plus the conv front-end **[U]**. 45 ms per second of audio on a desktop CPU **[S]**, extrapolated to **0.7–2 s per second of audio** on A55/A75 WASM **[U]** | 402 MB fp32 (≈100 MB int8) **[V/U]** | **no.** Not real time, and the download and RAM are unacceptable on a 4 GB phone |
| A2F-3D v3.0 (HuBERT, 180 M, TensorRT) | GPU only | 4 GB VRAM | **no.** Server GPU only |
| ARKit-52 morph-target face in three.js (≈5–15k vertices) | GPU vertex work; morph textures | a few MB of GLB | yes at 30 fps if the shader is lean **[U, the renderer research owns this]** |
| Gaussian head (LAM-20K) in WebGL | 110+ FPS on a Snapdragon 8 Gen 3 **[S]**; ≈ 10–25 FPS expected on Mali-G52-class **[U]** | tens of MB | **not for ₹10k at v1.** Plausible on ₹20k+ phones. Measure (§10 E-6) |

Threading (inherited §13 rule: nothing heavy on the audio thread):

```
WebRTC remote track ──► <audio> element (plays; stays on Chromium's AEC reference path)
                   └──► AudioContext MediaStreamSource ──► AudioWorklet "faceTap"   (analysis only, NOT connected to destination)
                              │  16 kHz resample, pre-emphasis, 25 ms window / 10 ms hop log-mel (80),
                              │  RMS, F0 (YIN, coarse), voicing; stamps each frame with context.currentTime
                              ▼  port.postMessage(Float32Array(84), t)   (≈ 100 msgs/s, < 0.5 KB each)
                         Web Worker "faceNet"   onnxruntime-web (wasm-simd, 1 thread) or a hand-written int8 kernel
                              │  student(mel, emotionVec, styleId) → 26 mouth/jaw/tongue channels + forecast Δ
                              ▼  ring buffer of {t, channels}
                         Main thread rAF (30 fps cap on low-end) ── FaceCompositor (§5.3) ── three.js morph weights
```

A SharedArrayBuffer ring would avoid message churn, but it needs cross-origin isolation. Whether a Capacitor
WebView can provide that is unknown **[U]**, so plain `postMessage` is the default.

---

## 4. The quality gap, tier by tier

| tier | what the viewer sees | what it misses | cost |
|---|---|---|---|
| T0 amplitude | the jaw flaps with loudness ("puppet") | lip closure on /p b m/, rounding (/u o/), spreading (/i e/); it opens on fricatives | 0 |
| T1 HeadAudio visemes | recognisable mouth shapes | 50–100 ms lag; English-trained prototypes; jittery at low SNR (our TTS audio is clean, which is the good case) **[V]** | 0 |
| **T2 distilled student → ARKit mouth** | coarticulated, smooth, closes for bilabials, scales to every character | some teacher error; the lag budget forces forecasting | 1–2 weeks of ML work; ~$100–300 of teacher data per voice **[U]** |
| T3 server A2F-3D live → ARKit | teacher quality, plus tongue and jaw transform | lost detail in the 52-pose solve; needs an audio relay (§8) | GPU at ≈$0.001–0.005/min, plus a transport rewrite |
| T4 neural-rendered photoreal (Gaussian, video vendors) | skin, mouth interior, teeth, wrinkles | ₹10k phones (Gaussian), or $0.01–0.50/min (video) | v2/v3 |

On a *stylised* character, the gap between T2 and T3 is mostly invisible. Rig quality (how good the 52 morphs are)
caps lip fidelity before the model does **[U, verify by blind A/B in E-3]**.

The gaps that viewers report most are about behaviour, not lips:
- a dead stare while listening,
- metronomic blinks,
- no brow motion on stressed words,
- the face not changing when the tutor praises.

§6 targets these gaps.

---

## 5. Recommended design: "teacher on the server, student on the phone"

### 5.1 Face protocol (`FaceFrame`): the one interface every renderer consumes

```ts
// 30–60 Hz, timestamped on the AudioContext clock of the analysis graph.
interface FaceFrame {
  t: number;                    // seconds, AudioContext.currentTime domain
  bs: Float32Array;             // 52 ARKit weights in canonical ARKit order (browDownLeft … tongueOut)
  head: [number, number, number];   // pitch, yaw, roll (rad), additive to the idle pose
  gaze: [number, number];           // yaw, pitch (rad) target; the eyes solver adds saccades
  state: "idle" | "listening" | "thinking" | "speaking";
}
```

Every source writes into this frame: the student, HeadAudio, A2F tracks, the procedural layers. Every renderer reads
it: a three.js GLB now, a LAM Gaussian head later (it takes ARKit), and a video vendor never needs it. The canonical
ARKit order is the one in `wav2arkit_cpu/config.json` **[V]**. Azure's 55-value order differs and adds
`headRoll` and eye rolls **[V]**, so map it explicitly.

### 5.2 Student model

- **Input.** 80-bin log-mel, 25 ms window, 10 ms hop, at 16 kHz; plus log-RMS and coarse F0 and voicing. The
  conditioning inputs are:
  - `emotion[10]`, the A2F explicit emotion space reused as a continuous vector (§6.1);
  - `style[k]`, a learned embedding per teacher identity (Claire, James, Mark, LAM-ID, Azure).
- **Network.**
  - 4–6 causal dilated 1-D conv layers (128–192 channels, kernel 3, dilations 1-2-4-8), receptive field ≈ 300 ms of *past*.
  - Then 1 GRU (128) and a linear head.
  - **Right context is 2 frames (20 ms) at most.** About 0.3–1 M parameters.
- **Output.** About 26 channels:
  - `jawOpen`, `jawForward`, `jawLeft/Right`;
  - every `mouth*` channel;
  - `tongueOut`;
  - a learned `cheekPuff`.

  Upper-face channels are deliberately *not* predicted. They come from the intent and prosody layers (§6), which
  A2F itself says it cannot ground **[V]**.
- **Forecast head.** Train with targets shifted earlier by Δ ∈ {0, 20, 40, 60} ms, as multiple output heads, and
  pick Δ by blind A/B. Visible articulation leads acoustic onset in real speech, so a forecast is physically
  plausible. The literature value for that lead is not verified here **[U]**.
- **Losses.**
  - L1 on weights, plus a velocity loss (first difference), plus a closure loss.
  - The closure loss is up-weighted BCE on `mouthClose`/`mouthPress` around frames that the forced aligner marks as /p b m pʰ bʰ/.
  - A small jitter penalty (high-frequency energy).
- **Export.** ONNX opset 17 → onnxruntime-web `wasm` EP (simd, 1 thread), int8 dynamic quantisation, with a
  fixed-shape streaming graph that carries GRU state in and out. A hand-written WASM kernel is the fallback if
  ORT-web's startup or size hurts (≈ 1–2 MB) **[U]**.
- **Budget gates** (fail the build, like the prompt budget):
  - p95 inference per 10 ms frame **< 2 ms** on the slowest reference phone;
  - model ≤ 1.5 MB;
  - Worker heap ≤ 20 MB **[U, set after E-2]**.

### 5.3 FaceCompositor: how the layers combine on the main thread (rAF)

```
final = clamp01(
   neutral_c                                  // per-character neutral offsets
 + L_intent(t)      ⊕ masks                   // §6.1 director move → expression program (brows, cheeks, smile, eyes)
 + L_prosody(t)                               // §6.2 brow flashes on F0 peaks, nod impulses on stressed syllables
 + L_autonomic(t)                             // blinks, saccades, breathing, micro head drift
 + gain_c ⊙ L_lip(t − latencyComp)            // student (or HeadAudio fallback), per-character gains
)
with priority rules:
  - bilabial closure wins: if L_lip.mouthClose > 0.5, scale intent's mouthSmile*/mouthStretch* by 0.4
    (a smiling mouth must still close for "p/b/m", or the speech reads as dubbed)
  - jawOpen from the lip layer is never attenuated by intent (expressions ride on top of speech)
  - eyeBlink from the autonomic layer is max()-combined with intent's eye squint, never summed
```

Per-character style is data, not a model:

```json
{ "id": "didi", "lipGain": {"jawOpen":0.85,"mouthStretch*":1.1}, "smileBaseline": 0.12,
  "blinkPerMin": {"speaking":24,"listening":18}, "headAmp": 1.0, "nodGain": 0.8,
  "styleId": 1, "smoothingMs": {"lip":35,"intent":180} }
```

An older "Sir" or "Dadi" character gets lower `headAmp` and `lipGain`, slower intent attack, and a different teacher
`styleId`. A young energetic "Bhaiya" gets the opposite. All characters share one student.

### 5.4 Sync on the WebRTC path (zero added audio delay)

- **The analysis tap.** Use `createMediaStreamSource(remoteStream)` into the `faceTap` worklet only. Playback stays
  on the `<audio>` element, which already exists in the HeadAudio/OpenAI demo as the Chromium workaround **[V]**.
  This keeps playback on the browser's AEC reference path.
- **Do not** connect the remote audio to `ctx.destination` through a `DelayNode`. Chromium does not reliably
  echo-cancel WebAudio output. The documented workaround is a local WebRTC loopback **[S]**, which is a second audio
  path and needs an echosim run. That is the "audio floor" failure class the portfolio exists to prevent.
- **Expected mouth lag**, measured from when samples reach the worklet **[U]**:

  | contribution | ms |
  |---|---|
  | half the analysis window | 12.5 |
  | right context | ≤ 20 |
  | inference | ~2 |
  | message | ~2 |
  | rAF quantisation at 30 fps (average) | ~16 |
  | **total** | **≈ 50 ms** |

  A Δ = 40 ms forecast brings the effective lag to about 10 ms. For reference, ITU-R BT.1359 puts detectability at
  +45 ms and acceptability at +90 ms when audio leads **[S]**.
- **The unknown offset** between the `<audio>` element's output latency and the analysis graph's clock is device
  dependent **[U]**. Measure it once per device class:
  - play a click-train plus a flash rendered from `FaceFrame`;
  - film the screen and speaker with the phone's 240 fps slow-motion camera;
  - store `latencyComp` per UA/model bucket.
- **Barge-in.** `input_audio_buffer.speech_started` (via the data channel) and track silence must collapse
  `L_lip` to rest within 80 ms (exponential release), so a truncated response doesn't leave the mouth open.
- **Alternative: WebSocket transport (portfolio-style PCM `playChunk`).** Audio deltas arrive before playback
  **[U, measure; gpt-realtime typically generates faster than real time]**. The student could then run with real
  lookahead on audio that is already buffered and key frames to the `playChunk` playhead. That gives better quality
  at zero lag, but it is a transport decision with echosim consequences. It belongs to the voice-stack owner, not the
  avatar.

### 5.5 Teacher-data pipeline (offline, Azure GPU, about a day per voice)

1. **Audio.**
   - Generate 10–20 h per tutor voice of Hinglish/Hindi/English *tutor-register* speech, using the same
     `gpt-realtime-2.1` voice and the actual lesson prompts (praise, hints, explanations, stories, numbers, Hindi
     science terms). Only tutor-side synthetic audio is used: **no child audio** is used or retained.
   - Cost is roughly $100–300 per voice at realtime audio-out prices **[U, use `realtime-cost-model.py`]**.
   - Add Azure `en-IN` TTS (which has native blend shapes) and `hi-IN` (viseme IDs) as a second domain **[V]**.
2. **Forced alignment.** Hindi/English phone alignment (for example an MMS-based aligner) produces /p b m pʰ bʰ ʋ u o/
   time marks for the closure loss and for evaluation **[U, pick the aligner]**.
3. **Teachers.**
   - A2F-3D v3.0, all 3 identities × a grid of explicit emotions (neutral, joy 0.3/0.6, amazement 0.4, cheekiness 0.3, sadness 0.3). Its throughput is 3,269 FPS on a 4090 **[V]**. 20 h is 2.16 M frames, about 11 minutes on a 4090 and roughly an hour on a T4 **[U]**: under $1.
   - Add A2F-3D v2.3 per actor, LAM-A2E (12 streaming identities **[V]**), and Azure `en-IN` blend shapes where they exist.
   - Solve to ARKit-52 with the SDK's blend-shape solver on each actor's rig **[V]**.
4. **Teacher agreement as a quality filter.** Drop segments where the teachers disagree on closure, or where
   any teacher misses a closure that the aligner marks. Teacher labels are "not gold annotations" **[S]**.
5. **Train the student**, then evaluate against teachers and the aligner (§10 E-3), and against human A/B.

### 5.6 HeadAudio-Hindi fallback (day 1, while the student trains)

- HeadAudio's prototypes were trained on Kokoro English voices with phoneme timestamps from HeadTTS **[V]**.
- Retrain it with our tutor-voice audio and the aligner's Hindi phone marks mapped to the 15 Oculus visemes.
  The compile step takes about 30 s and the model is about 14 kB **[V]**.
- Set `speakerMeanHz` per voice (female 200–250, male 100–130) **[V]**.
- Map the Oculus visemes onto ARKit mouth channels with a fixed 15×26 matrix so the compositor sees one interface.

### 5.7 Pre-baked tracks for cached audio

- Greetings, lesson intros, celebrations and any pre-generated narration are known audio. Run full A2F-3D v3.0
  offline, solve to ARKit, and ship `FaceFrame` tracks (≈ 52 × 30 fps × 1 byte ≈ 1.6 kB/s) alongside the audio.
- Cached lines then play at teacher quality (T3) for $0 at runtime.
- The track is keyed to the cached clip's own playback start, so there is no inference lag.

---

## 6. Expression from intent, prosody and state (the part the models don't do)

### 6.1 Director move → expression program

The Director chooses the move *before* the teacher's next turn (`docs/ARCHITECTURE.md` §1.2: continue, probe,
hint-ladder step, re-teach, show module, retrieval, teach-back, break, wrap-up). It sends a compact `face` field with
`session.update` over the data channel. The client arms that face program and fires it on
`output_audio_buffer.started` for the next response.

```ts
type FaceMove = { program: FaceProgram; intensity: 0|1|2|3; emotion?: Partial<Record<A2FEmotion, number>> };
// FaceProgram = envelope (attack/hold/release ms) × target ARKit deltas × head/gaze directives
```

| Director move / moment | face program (shape, not a line to say) | student `emotion[]` |
|---|---|---|
| correct answer: `continue` + praise | Duchenne smile (mouthSmile 0.5, cheekSquint 0.4, eyeSquint 0.3), brow flash at onset, small head tilt, one nod | joy 0.4 |
| `probe` (why-after-correct, predict) | brows up (browInnerUp 0.3, browOuter 0.2), lean-in (head pitch −3°), eye contact 0.9, closed-mouth half-smile in the final 300 ms | amazement 0.2 |
| hint ladder step 1–2 | warm and encouraging: soft smile 0.25, slight nod on the hint word (prosody), eye contact 0.7 | joy 0.15 |
| hint ladder step 3+, or "pata nahi" loop | empathy: browInnerUp 0.4, mouth corners neutral, slow blink, head tilt 6°, slower speech (the voice does that) | sadness 0.1 (concern, not sorrow) |
| re-teach with a different representation | "let's try another way": brow raise, gaze to the module (yaw towards the module panel), then back to the child | neutral |
| show module | gaze and head turn to the module region for 600–900 ms, then return; eyebrows up | amazement 0.15 |
| retrieval / teach-back | expectant: eye contact 0.9, small smile, stillness (reduce head drift by 50%) | neutral |
| break / wrap-up | relaxed smile, slower blinks, a "namaste" or wave gesture where the character has one | joy 0.3 |
| teacher "thinks" before a hard answer (`response.created` → no audio for more than 400 ms) | gaze aversion up/sideways 8–12°, browDown 0.15, mouthPress 0.2 | n/a |

Rules:
- **No emotion recognition drives the face.** Neither the child's emotion (rejected #8 in `tech-and-market` §14)
  nor the tutor's, via Audio2Emotion (licence-locked **[V]**, and its labels would flicker).
- The `face` field is an **enum plus intensity**, never text. This follows the inherited rule that anything
  sentence-shaped in a prompt gets recited. The face vocabulary must stay out of the instructions entirely; the
  client, not the voice model, owns it.
- Within a turn, the realtime transcript deltas run ahead of the audio **[U, measure the lead]**. A tiny client-side
  lexicon can spike a smile at "shabash / बहुत बढ़िया / perfect / well done". Place each spike using the delta's
  character offset × the voice's measured characters-per-second. The spike is additive and capped at intensity 1.
  This is the only text-derived cue.
- Do not use function calling (`set_mood` in the HeadAudio demo **[V]**) as the primary channel. It puts face
  control inside the voice model's turn and spends tokens. The Director already knows the move.

### 6.2 Prosody layer (audio-derived, cheap, already in the worklet)

- **Brow flashes.** About 71% of rapid rise-fall eyebrow movements coincide with F0 rises (Cavé et al. 1996)
  **[S]**. Trigger a 250–400 ms browOuterUp/browInnerUp pulse (0.15–0.3) on F0 peaks that are more than 1.5
  semitones above the running phrase mean. Refractory period 1.2 s.
- **Head nods and beats.** Head motion correlates strongly with prosody (r ≈ 0.8 with MFCCs at sentence level,
  Busso et al. 2007; up to 73–88% of F0 variance recoverable from head motion) **[S]**. On each energy-and-F0
  accent, add a damped pitch impulse of 1.5–3° (spring k ≈ 120, ζ ≈ 0.6). Phrase-final falls get a slightly larger
  downward settle.
- **Phrase boundaries** (more than 150 ms of silence; HeadAudio uses the same 150 ms "new sentence" heuristic **[V]**)
  get a blink with probability 0.6, a re-acquire of eye contact, and a small breath (chest/shoulder).

### 6.3 Autonomic layer

- **Blinks.** About 17/min at rest and 26/min in conversation (Bentivoglio et al. 1997, n=150) **[S]**.
  - Sample inter-blink intervals from a gamma distribution, not uniform jitter. TalkingHead uses uniform 1–8 s delays **[V]**.
  - About 85% are single blinks and the rest double blinks, which matches TalkingHead's template **[V]**.
  - Bias blinks towards phrase boundaries and gaze shifts. Suppress them during the stressed syllable of a praise word.
- **Gaze.**
  - Eye contact while speaking is 0.5–0.7 (TalkingHead's defaults are 0.5 while speaking and 0.2 idle **[V]**).
  - Use micro-saccades of 0.5–1° every 0.5–2 s and break gaze at phrase starts.
  - Avert gaze while "thinking". Gaze aversion tracks cognitive load and is rare while listening (Glenberg et al. 1998) **[S]**.
- **Breathing and drift.** Use 3–5 s breath cycles and Perlin head drift at about 1°. Reduce drift during
  retrieval and teach-back, where stillness reads as attention.

### 6.4 Listening state (the child is talking)

- **Trigger.** `input_audio_buffer.speech_started` → `state = listening`:
  - eye contact 0.85,
  - head tilt 3–5° towards the child,
  - soft smile 0.1,
  - blink rate down to about 18/min.
- **Silent visual backchannels.** One small nod on each child pause longer than 300 ms, at most 1 per 3 s.
  - This is the visual analogue of the rejected audio backchannel. It needs no mic hold and adds no audio, so it
    cannot split the turn or touch the echo path (`tech-and-market` §14 #5).
  - The nod frequency still needs a blind check so it doesn't read as impatience **[U]**.
- **When the child is thinking** (a long silence after a probe): soften eye contact to 0.5 and look down or towards
  the module. A child who averts gaze to think (Doherty-Sneddon et al. **[S]**) should not be stared at.

---

## 7. Licence matrix (commercial use in a paid product for minors)

| component | code | weights / data | usable commercially? |
|---|---|---|---|
| A2F-3D SDK, training framework | MIT / Apache-2.0 **[V]** | n/a | yes |
| A2F-3D v2.3 / v3.0 weights | n/a | NVIDIA OML **[V]** | **yes** (attribution notice; derivative models ours; outputs not derivative) |
| Audio2Emotion | n/a | custom, A2F-only **[V]** | avoid |
| A2F Claire sample dataset | n/a | evaluation only **[V]** | no |
| LAM-A2E, LAM, OpenAvatarChat | Apache-2.0 **[V]** | LAM ships FLAME-derived files with MPG notices; edition unclear (issue #111, unanswered) **[V]** | A2E: probably yes **[U]**. LAM Gaussian heads: only after FLAME clarity |
| FLAME | n/a | **FLAME 2023 Open is CC-BY-4.0; 2017/2019/2020 are non-commercial** **[V]** | only the 2023 Open edition |
| HeadAudio, TalkingHead, LAM_WebRender | MIT **[V]** | HeadAudio model trained on Kokoro (Apache-2.0) voices **[V]** | yes |
| FaceFormer, CodeTalker, LiveSpeechPortraits | MIT **[V]** | trained on VOCASET/BIWI (research licences) **[U]** | code yes; weights no |
| UniTalker | Apache-2.0 **[V]** | NC datasets **[V]** | weights no |
| EmoTalk, SelfTalk | CC BY-NC 4.0 **[V]** | NC | no |
| GaussianAvatars | CC BY-NC-SA **[V]** | NC | no |
| GaussianTalker | Inria GS licence (NC) **[V]** | n/a | no |
| SplattingAvatar | no licence file **[V]** | n/a | no (all rights reserved by default) |
| Meta audio2photoreal, Ava-256 | CC BY-NC **[V]** | NC | no |
| ARTalk | MIT **[V]** | needs FLAME + TFHP | weights no |

Our distilled student, trained on our own synthetic tutor audio with A2F, LAM-A2E and Azure labels, is the one
artefact with a clean chain **[U, legal sign-off]**.

---

## 8. Server-side A2F on Azure: when it would be right

**Architecture, if ever needed.** Move the tutor's audio through our server instead of browser-direct WebRTC:

```
Azure realtime (WebSocket) → relay (GPU VM, Central India) → A2F-3D v3.0 TensorRT + CPU blend-shape solve
                           → WebSocket to client: {pcm16 chunk, FaceFrame[]} keyed to the same sample index
                             (the myned-ai avatar-chat-server `sync_frame` pattern, 30 fps [S])
```

Consequences:
1. The transport changes from WebRTC to WebSocket, plus WebAudio playback. That needs AEC re-validation (echosim) and
   a jitter strategy, and it takes on everything WebRTC gave us for free.
2. It adds a hop's latency (an India VM sits between Azure's region and the child).
3. It needs a GPU fleet with autoscaling. A2F's own lookahead (260 ms for v2.3, about 0.5–1 s for v3.0 diffusion)
   is only free because realtime audio arrives faster than playback **[U]**.

**Verdict:** worth it only for a premium "Studio" tier on a high-end 3D head, where tongue and jaw detail and
A2F's full skin motion are visible. Its cost (≈$0.001–0.005/min) is negligible; the engineering and audio-floor risk
are not. For v1/v1.5, use A2F **offline** (§5.5, §5.7).

---

## 9. The path to "video-real" (v2/v3) stays open

- **Video vendors** (Simli, LiveAvatar LITE, Beyond Presence) take our audio and return video
  (`tech-and-market` §2.1). They don't need `FaceFrame`. The Director's `face` moves can still map onto any
  vendor emotion API **[U, vendor-dependent]**.
- **On-device photoreal:**
  - LAM-style FLAME-rigged Gaussian heads accept ARKit-52 **[V]**. The student and compositor drive them unchanged.
  - Gate this on (a) FLAME 2023 Open/licence clarity and (b) E-6 FPS on reference phones. Ship it as an "HD tutor"
    option for capable devices only.
  - SqueezeMe's result (a linear decoder, 0.45 ms on a Quest 3 NPU, 60k Gaussians **[S]**) suggests that a
    per-character *linear* Gaussian blend-shape model could reach mid-range phones. That is a research bet, not a plan.
- **Per-character photoreal training** (GaussianTalker, LiveSpeechPortraits style) needs a consenting filmed actor
  per tutor and NC-free code. It is not available today.

---

## 10. Experiments to run before committing (in priority order, with pass bars)

| id | experiment | method | pass bar |
|---|---|---|---|
| E-1 | **Is A2F a good Hinglish teacher?** | Generate 30 min of tutor-voice Hinglish. Run A2F v3.0 (3 identities), v2.3 and LAM-A2E. Compute the closure rate on aligner-marked /p b m pʰ bʰ/ (closure = `mouthClose`+`mouthPress` ≥ 0.4 within ±40 ms) and /ʋ/ rounding errors, and have 3 Hindi-speaking raters label 100 clips | closure ≥ 90% for the best teacher; raters prefer it to HeadAudio on ≥ 70% of clips |
| E-2 | **Phone budget** | Bench the int8 student (0.3 M, 0.6 M, 1 M variants) in onnxruntime-web wasm-simd in Chrome and in the Capacitor WebView on 3 reference ₹10k phones, with the call running and the GLB rendering | p95 < 2 ms per 10 ms frame; no audio underruns; ≤ 3% battery per 10 min over the voice-only baseline |
| E-3 | **Student vs teacher vs HeadAudio vs amplitude** | Blind 2AFC with the same character and audio, n ≥ 30 adults plus a supervised kids' panel, under consent | student ≥ HeadAudio by ≥ 65% preference; student vs A2F-offline is not distinguishable (≤ 55%) |
| E-4 | **Lag and forecast Δ** | Slow-motion camera (240 fps) measurement of the audio→mouth offset per device. A/B of Δ ∈ {0, 20, 40, 60} ms | median net offset within +45 ms (audio leading); chosen Δ wins the A/B |
| E-5 | **Echo floor unchanged** | echosim before and after adding the analysis-only `faceTap` branch (it should be a no-op), and separately for any playback rerouting | tables identical for analysis-only; any rerouting must match or beat baseline |
| E-6 | **Gaussian head on ₹10k** | Run the LAM_WebRender demo avatar on the 3 reference phones and 2 ₹20k phones | ≥ 30 fps sustained for 5 min without thermal throttling, otherwise v3 stays high-end only |
| E-7 | **Intent layer is worth it** | Blind A/B of the same lesson clip with the intent, prosody and listening layers on versus off | ≥ 70% prefer "on"; no rater calls it "overacting" (watch nod frequency) |
| E-8 | **Transcript lead** | Measure the transcript-delta lead over audio playback on gpt-realtime-2.1 WebRTC | lead ≥ 150 ms makes the §6.1 lexicon cue viable; otherwise drop it |

Log every result into `context/measurements.md` with n, method and date, per the inherited logging rule.

---

## 11. Not recommended, and why (candidates for `context/rejected.md` if tried)

1. **Running wav2vec2 or HuBERT models in the phone browser** (wav2arkit, LAM-A2E, A2F): ~10 GFLOP per second of
   audio and 100–400 MB of weights **[V/U]**. The "1.8 MB" label is the graph only; the weights are in a 402 MB
   sidecar file **[V]**.
2. **Delaying playback through WebAudio to buy lookahead.** It takes audio off the AEC reference path **[S]** and
   adds latency the owner forbids. Use the forecast head instead.
3. **Audio2Emotion, or any audio emotion classifier, as the expression driver.** The licence is A2F-only **[V]**, the
   Director already knows the intent, and the categorical-emotion approach was already rejected (F1 0.43).
4. **Function calls from the voice model to set expressions.** They put face control in the model's turn, cost
   tokens, and risk the prompt-recitation class of bug. Use the Director's out-of-band `face` field.
5. **Text-driven visemes from the realtime transcript.** There are no word timestamps, so alignment would be a
   guess. Only coarse smile cues (§6.1) are safe.
6. **Shipping weights trained on VOCASET, BIWI, 3D-ETF or MEAD, or anything built on pre-2023 FLAME**, in a paid
   product. These are non-commercial chains **[V/U]**.
7. **Upper-face motion from the lip model.** A2F states that it lacks semantic grounding there **[V]**. Brows and
   eyes come from the intent, prosody and autonomic layers.

---

## Sources

NVIDIA Audio2Face-3D
- A2F-3D hub repo (components and licences): https://github.com/NVIDIA/Audio2Face-3D **[V]**
- SDK (MIT; CUDA 12.8–<13, TensorRT 10.13–<11; docs/README on regression and diffusion windows, blend-shape solve, saccades): https://github.com/NVIDIA/Audio2Face-3D-SDK **[V, source read]**
- Training framework (Apache-2.0): https://github.com/NVIDIA/Audio2Face-3D-training-framework **[V]**
- Model card v3.0 (180 M params, HuBERT, release 2025-09-24, test GPUs, bias "None"): https://huggingface.co/nvidia/Audio2Face-3D-v3.0 **[V]**
- v3.0 `network_info.json` and `bs_skin_config_Claire.json`: https://huggingface.co/nvidia/Audio2Face-3D-v3.0/tree/main **[V]**
- v2.3 Mark (`network_info.json`: buffer_len 8320, buffer_ofs 4160): https://huggingface.co/nvidia/Audio2Face-3D-v2.3-Mark **[V]**
- v2.3.1 Claire and James: https://huggingface.co/nvidia/Audio2Face-3D-v2.3.1-Claire , https://huggingface.co/nvidia/Audio2Face-3D-v2.3.1-James
- Paper, "Audio2Face-3D: Audio-driven Realistic Facial Animation For Digital Avatars" (FPS, data, emotions, languages, limits): https://arxiv.org/abs/2508.16401 **[V]**
- NVIDIA Open Model License (updated 2025-10-24): https://www.nvidia.com/en-us/agreements/enterprise-software/nvidia-open-model-license/ **[V]**
- A2F-3D NIM support matrix (A10G 35/32 and L4 30/16 batch; memory per stream): https://docs.nvidia.com/ace/audio2face-3d-microservice/latest/text/support-matrix.html **[S, via search excerpt; the page returned 403]**

LAM and its derivatives
- LAM_Audio2Expression (Apache-2.0; streaming config and source read): https://github.com/aigc3d/LAM_Audio2Expression **[V]**
- LAM (Xiaomi 14 110+ FPS; A100 562.9 FPS): https://github.com/aigc3d/LAM **[V for README; S for numbers]**
- LAM FLAME licensing issue #111: https://github.com/aigc3d/LAM/issues/111 **[V]**
- LAM paper: https://arxiv.org/abs/2502.17796
- LAM_WebRender (MIT, WebGL, ARKit input): https://github.com/aigc3d/LAM_WebRender **[V]**
- OpenAvatarChat (Apache-2.0): https://github.com/HumanAIGC-Engineering/OpenAvatarChat **[V]**
- wav2arkit_cpu (file listing shows the 402 MB `.onnx.data`; README; config): https://huggingface.co/myned-ai/wav2arkit_cpu **[V]**
- Teacher dataset: https://huggingface.co/datasets/myned-ai/audio2face-emotion-arkit-teacher **[S]**
- avatar-chat-server: https://github.com/myned-ai/avatar-chat-server **[S]**

Academic audio-to-3D-face models
- FaceFormer: https://github.com/EvelynFan/FaceFormer (MIT) **[V]**
- CodeTalker: https://github.com/Doubiiu/CodeTalker (MIT) **[V]**
- SelfTalk: https://github.com/psyai-net/SelfTalk_release (CC BY-NC 4.0) **[V]**
- EmoTalk: https://github.com/psyai-net/EmoTalk_release (CC BY-NC 4.0) **[V]**; https://arxiv.org/abs/2303.11089
- UniTalker: https://github.com/X-niper/UniTalker (Apache-2.0; datasets D0–D7) **[V]**; https://arxiv.org/abs/2408.00762
- ARTalk: https://github.com/xg-chu/ARTalk (MIT) **[V]**; paper with speed, comparison table and user study: https://arxiv.org/abs/2502.20323 **[V]**

Browser lip-sync and procedural animation
- HeadAudio (README, training, `openai.html` WebRTC demo source read): https://github.com/met4citizen/HeadAudio **[V]**
- TalkingHead (`modules/talkinghead.mjs` moods, blink templates, eye contact and gestures read): https://github.com/met4citizen/TalkingHead **[V]**
- Azure TTS viseme and blend shapes (55 values at 60 fps): https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis-viseme **[V]**
- Azure viseme locale table (`hi-IN` viseme ID; `en-IN` + blend shapes): https://github.com/MicrosoftDocs/azure-ai-docs/blob/main/articles/ai-services/speech-service/includes/language-support/viseme.md **[V]**

Photoreal and Gaussian avatars
- LiveSpeechPortraits: https://github.com/YuanxunLu/LiveSpeechPortraits (MIT) **[V]**
- GaussianTalker: https://github.com/cvlab-kaist/GaussianTalker (Inria GS licence) **[V]**; https://arxiv.org/abs/2404.16012
- GaussianAvatars: https://github.com/ShenhanQian/GaussianAvatars (CC BY-NC-SA) **[V]**
- SplattingAvatar (abstract: 300 FPS GPU, 30 FPS mobile): https://arxiv.org/abs/2403.05087 **[V]**; https://github.com/initialneil/SplattingAvatar
- TaoAvatar: https://arxiv.org/abs/2503.17032 **[S]**
- SqueezeMe (Meta): https://arxiv.org/html/2412.15171 **[S]**; https://www.uploadvr.com/meta-squeezeme-mobile-ready-distillation-of-gaussian-full-body-avatars/
- Meta audio2photoreal (CC BY-NC): https://github.com/facebookresearch/audio2photoreal **[V]**
- Ava-256 (CC BY-NC): https://github.com/facebookresearch/ava-256 **[V]**
- UniGAHA, "Audio-Driven Universal Gaussian Head Avatars": https://arxiv.org/abs/2509.18924 **[S]**
- WebSplatter (WebGPU 3DGS): https://www.alphaxiv.org/abs/2602.03207 **[S]**
- Visionary (WebGPU 3DGS + ONNX): https://arxiv.org/pdf/2512.08478 **[S]**

Licensing
- FLAME licence page (2023 Open is CC-BY-4.0; others non-commercial): https://flame.is.tue.mpg.de/modellicense.html **[V]**

Browser platform
- WebGPU on Android: https://en.wikipedia.org/wiki/WebGPU **[S]**
- WebGPU in major browsers: https://web.dev/blog/webgpu-supported-major-browsers **[S]**
- Chromium AEC vs WebAudio output, and the loopback workaround: https://dev.to/focused_dot_io/echo-cancellation-with-web-audio-api-and-chromium-1f8m **[S]**
- Chromium issue 40871060 (Chrome-wide echo cancellation): https://issues.chromium.org/issues/40871060 **[S]**
- ITU-R BT.1359-1 (+45/−125 ms detectability; +90/−185 ms acceptability): https://www.itu.int/dms_pubrec/itu-r/rec/bt/R-REC-BT.1359-1-199811-I!!PDF-E.pdf **[S]**

Azure pricing (Central India, Linux pay-as-you-go)
- NC4as_T4_v3: https://www.azurespeed.com/AzureVmPricing/Standard_NC4as_T4_v3 **[S]**
- NV36ads_A10_v5: https://www.azurespeed.com/AzureVmPricing/Standard_NV36ads_A10_v5 **[S]**

Behavioural science
- Bentivoglio et al. 1997, blink rates (17 rest / 26 conversation / 4.5 reading, n=150): https://movementdisorders.onlinelibrary.wiley.com/doi/abs/10.1002/mds.870120629 **[S]**
- Eyebrow–F0 (Cavé et al. 1996) and head–prosody (Busso et al. 2007) summarised in: https://www.sciencedirect.com/science/article/abs/pii/S0167639313000691 **[S]**
- Glenberg, Schroeder and Robertson 1998, gaze aversion: https://link.springer.com/article/10.3758/BF03211385 **[S]**
- Doherty-Sneddon et al., children's gaze aversion: https://dspace.stir.ac.uk/bitstream/1893/361/1/gazeaversionpaper9.pdf **[S]**

---

## Graphics review

Reviewer: an adversarial real-time graphics and audio engineer, 2026-10-02. The job was to break this document. I checked the
load-bearing claims against primary sources and ran one micro-bench of my own (`bench/student-ort/`). Tags are as above, plus
**[M]** for a number I measured myself, with n and method given in place.

**Overall verdict.** The architecture holds up: `FaceFrame` = ARKit-52 + head + gaze; a teacher offline and a student on the phone;
upper face driven by intent and prosody rather than by the lip model; no added audio delay. But five things are wrong in ways
that would bite:

1. The phone compute estimate is about 4–6× optimistic.
2. The ORT-web size is about 7× understated.
3. The sync model assumes the mouth lags the audio. On Android it is at least as likely to **lead**, and it varies with the
   output route, so a static per-device `latencyComp` is the wrong design.
4. Two playback-adjacent features, pre-baked cached audio (§5.7) and barge-in collapse (§5.4), create the very
   audio-floor or desync bugs the document says it avoids.
5. The suggested Hindi aligner (MMS) is non-commercial.

The effort estimate is off by roughly 5–8×.

### G-1. Verified as stated (no change)

| claim | check | result |
|---|---|---|
| `wav2arkit_cpu.onnx.data` is 402,063,360 B; the graph is 1.86 MB | HF tree API | **[V]** exact |
| A2F v3.0: 3,269 FPS (1 track) and 1,250 FPS (8 tracks); v2.3: 453 and 413; RTX 4090, TensorRT; these are throughput, not latency | arXiv 2508.16401 HTML | **[V]** |
| A2F v3.0 `network_info.json`: 2 diffusion steps, 2-layer GRU of 256, buffer 16,000 samples with 16,000 padding on each side, 15/30/15 frame truncation | file fetched | **[V]**. The file's `id.version` reads **"3.2"**, not 3.0 |
| A2F v3.0 is a **725 MB** fp32 `network.onnx` (≈181 M params) | HF tree API | **[V]**. This supports "server only" |
| HeadAudio: MFCC 0.025 ms + classifier 0.005 ms per frame; ~14 kB model; the node has no audio output | README | **[V]**. But README says end-to-end latency is "approximately **50 ms**", not "50–100 ms" |
| Azure viseme support: `en-IN` has viseme ID and blend shapes; `hi-IN` has viseme ID only | MicrosoftDocs viseme.md | **[V]** |
| LAM-20K reaches 562.9 FPS on an A100 and "110+FPS" on a Xiaomi 14 | LAM README table | **[V]** that the README says it. The phone column is "(A & R)" and does not say WebGL or native **[U]** |

### G-2. Wrong perf claims

**(a) The student's phone cost: "≈5–10% of one A55 core" is optimistic by about 4–6×.**

I built the §5.2 student as a real streaming ONNX graph:
- 5 causal conv layers (kernel 3, dilations 1-2-4-8-16) with explicit conv-state tensors in and out;
- 1 GRU;
- a linear layer to 26 outputs.

I ran one 10 ms frame per `session.run` on onnxruntime-web 1.30.0, `wasm` EP, 1 thread, SIMD, Node 22, on a 2.1 GHz Xeon cloud
core. Each model had 300 warm-up runs, then n = 2000 timed runs **[M]**:

| params | median | p95 | share of one Xeon core at 100 Hz |
|---|---|---|---|
| 3.5 k (fixed-overhead probe) | 0.078 ms | 0.21 ms | 0.8% |
| 194 k | 0.32 ms | 0.52 ms | 3% |
| 463 k | 0.49–0.64 ms | 0.79–0.82 ms | 5–6% |
| 905 k | 1.11 ms | 1.49 ms | 11% |

The effective throughput is about 1.5–1.9 GFLOP/s, well below SIMD peak. Small-tensor kernels in ORT-web are overhead- and
memory-bound, so the document's "2 × params FLOPs" arithmetic is the wrong model for this workload.

A Cortex-A55 is in-order, with one 128-bit NEON pipe. For WASM it is plausibly **4–6× slower** than this Xeon core, and an
A75/A76 about 2× slower **[U, must be measured on the E-2 phones]**. Extrapolated:

| model | on an A55 | on an A75/A76 |
|---|---|---|
| 0.5 M | ≈2–4 ms per frame, so **20–40% of the core** | ≈1–1.3 ms |
| 1 M | ≈5–7 ms per frame, so **50–70% of the core** | n/a |

What this means:
- The §5.2 gate (p95 < 2 ms on the slowest phone) **fails for ≥0.5 M on little cores**, and the 1 M variant is not viable there.
- Android's scheduler decides which core the Worker lands on, not us. On a 2+6 SoC that is already decoding Opus, running the
  WebRTC stack, three.js and the compositor, assume little cores for the p95.

Fixes, in order:
1. Cap the student at ≈0.2–0.3 M.
2. Run the network at a **20 ms hop** (50 Hz). Mouth shapes do not need 100 Hz, and rendering is 30 fps.
3. Feed 2 frames per `run` only if the added ≤10 ms fits the lag budget.
4. Keep the hand-written WASM kernel (§5.2) as a real option, not a footnote. A fused conv/GRU with no per-op dispatch is
   plausibly 3–5× faster at this size **[U]**.

Also:
- ORT's dynamic int8 quantisation has a dedicated LSTM path (`DynamicQuantizeLSTM`) but I know of no GRU equivalent, and
  quantise/dequantise overhead can make int8 *slower* than fp32 at this scale **[U]**. Bench fp32 first. At 0.3 M params, fp32
  is only 1.2 MB.
- The worklet's "coarse YIN" is not free. A time-domain YIN over a 400-sample window with a 400-lag search is about 16 M
  multiply-adds per second in JS on the audio thread **[U, arithmetic]**. Derive F0 from the FFT you already compute for the mel
  spectrum (autocorrelation via the power spectrum), or move F0 into the Worker. The audio thread must stay trivially light.
  That is the §13 rule this document cites.

**(b) "ORT-web startup or size … (≈ 1–2 MB)" is wrong.**

`onnxruntime-web@1.30.0/dist/ort-wasm-simd-threaded.wasm` is **14,239,897 B raw and 3,659,936 B gzip -9** **[M, downloaded
from jsDelivr, 2026-10-02]**. The JSEP and asyncify builds are 26–28 MB. The npm package unpacks to 144.6 MB.

Consequences:
- **Web.** First-lesson download is about 3.7 MB before the face can move.
- **APK.** About 14 MB is added.
- **Low-end phones.** V8 compile time and code-space memory for a 14 MB module are on the order of a second and tens of MB
  **[U]**. The "Worker heap ≤ 20 MB" gate is therefore unlikely to pass with ORT-web at all **[U]**.

This moves the hand-written kernel (≈ tens of kB) from fallback to **default**, with ORT-web kept as the training-parity
reference.

**(c) Teacher-labelling cost: "20 h ≈ 2.16 M frames, about 11 minutes on a 4090, under $1" is wrong twice.**

1. The SDK docs say the diffusion model "generates 60 frames per second" **[V, Audio2Face-3D-SDK docs/README.md]**. So 20 h is
   **4.32 M** frames, about 22 minutes **per pass**.
2. §5.5 asks for 3 identities × 6 emotion settings = **18 passes**. That is ≈6.6 GPU-hours on a 4090, and on a T4 (5–8× slower
   **[U]**) ≈35–55 h, so **≈$20–35 per voice** at $0.579/h. The blend-shape solve is extra.

It is still cheap, but not "under $1". The real blocker is different: **Azure startup subscriptions usually start with zero
GPU-family vCPU quota** (NCas_T4_v3, NVadsA10_v5), and a quota request can take days or be refused **[U, check the
subscription's quota now]**. Put the quota request on the critical path, ahead of E-1.

**(d) The Gaussian head on a ₹10k phone: "≈10–25 FPS on Mali-G52-class" is probably 3–5× too high.**

The Snapdragon 8 Gen 3's Adreno 750 against a Mali-G52 MC2 is a **≈25–40× gap** in fp32 throughput and a similar one in
bandwidth **[U, vendor-spec arithmetic]**, not "an order of magnitude". Splatting is fill-rate- and sort-bound. 110 FPS ÷ 30
gives ≈3–5 FPS, not 10–25. The verdict ("not for ₹10k") stands, more strongly. E-6 should still run, but expect it to fail on
the ₹10k phones.

**(e) The §5.4 lag table is incomplete, and its sign is unknown.**

It counts only the analysis side. It omits:
- (i) the `MediaStreamAudioSourceNode` input FIFO from Chrome's WebRTC renderer into WebAudio, variable at about 10–40 ms **[U]**;
- (ii) display latency after rAF: compositor plus SurfaceFlinger, typically 1–3 vsyncs (17–50 ms), with WebView adding a frame
  **[U]**;
- (iii) the most important term: the **`<audio>` element's own output latency**. On low-end Android in communication mode this
  is typically 40–100 ms, and on **Bluetooth A2DP earbuds 150–300 ms** **[U]**. Cheap BT earbuds are common among the target
  users.

Because the analysis path receives samples *before* the element plays them, the face can **lead** the sound. On BT it would
lead by ≈100–250 ms, past BT.1359's −125 ms detectability and near its −185 ms acceptability. Adding a 40 ms forecast makes
a lead worse.

Correct design:
1. `latencyComp` is a **signed, per-output-route runtime value**, not a per-UA bucket.
2. Initialise it from `AudioContext.outputLatency` + `baseLatency` of a context on the same sink **[U, how well this tracks the
   element's path on Android must be measured]**.
3. Re-derive it on `devicechange` (BT connect or disconnect).
4. Add a **delay line on the FaceFrame ring**, since delaying the *face* is free and delaying audio is forbidden.
5. E-4 must test speaker, wired and BT routes separately, on at least 3 phones.
6. Forecast Δ should be chosen *per route*, and may be 0.

### G-3. Lip-sync and desync risks on the WebRTC path

1. **The forecast head is physically limited exactly where it matters.** In a bilabial stop the lips close during the
   **silent** closure, before the burst. A causal model sees silence there, and silence is ambiguous with /t k/ closures and
   with pauses. Its only early cue is the labial formant transition (falling F2/F3) at the end of the preceding vowel. Expect the
   student to close **late** on /p b m/ by roughly the closure duration (≈50–100 ms **[U]**), however good the teacher is.

   Changes:
   - Add a **student closure-rate metric to E-3**, using E-1's definition (`mouthClose`+`mouthPress` ≥ 0.4 within ±40 ms of the
     aligner mark), measured per Δ. Today E-1 gates only the teacher.
   - Budget an **onset rule**: a short closure pulse on burst detection, which reads better than missing the closure.
2. **Runtime audio is not training audio.** At runtime the student hears Opus at the realtime bitrate, then NetEq jitter
   buffering with **accelerate / preemptive-expand time-stretching and packet-loss concealment**. The teacher data is clean PCM.
   The student will animate PLC artefacts and drift on stretched segments.

   Changes:
   - Train with an Opus encode/decode round trip plus simulated loss and jitter (libopus with a NetEq-like stretcher) as
     augmentation **[U]**.
   - Gate L_lip on an energy/voicing VAD so that comfort noise and PLC tails do not flutter the lips.
3. **Barge-in collapse on `input_audio_buffer.speech_started` creates desync.** When the server truncates, audio that is
   already in the jitter buffer and the output path keeps playing for tens to a few hundred ms. Forcing the mouth shut on the
   *event* produces a closed mouth over an audible voice, which is the most obvious possible dub error.
   - The lip layer is audio-driven, so let **the audio** close the mouth: release on the faceTap VAD going silent.
   - Use `speech_started` only to switch the **upper-face** state to `listening`.
   - Use `output_audio_buffer.cleared` (a WebRTC-only event) as a backstop with a 300 ms timeout.
4. **Firing the Director's face program on `output_audio_buffer.started`** (§6.1) leads the audible audio by the full network,
   jitter-buffer and output path, roughly 100–300 ms **[U]**, so the praise smile arrives before the praise.
   - Arm the program on the event.
   - **Fire it on the first faceTap voiced frame after arming**, then apply the same `latencyComp`.
5. **A new playback path that §5.7 does not mention.** Cached greetings and narration with pre-baked tracks must play
   *locally*. A local `<audio>`/WebAudio clip played while the mic track is live is **not** in Chrome's software-AEC3 far-end
   reference: the reference is WebRTC playout, and system-wide echo cancellation is the open Chromium issue 40871060 that this
   document itself cites. Low-cost Android devices frequently lack an effective hardware AEC **[U]**. The realtime model would
   then hear its own greeting through the mic, triggering false `speech_started`, self-barge-in, or a transcript of the tutor as
   the child. This is the audio-floor failure class.
   - Rule: play cached clips **only while the uplink track is disabled** (`track.enabled = false`, or before the session
     connects). Otherwise they need their own echosim and on-device run.
   - **Treat §5.7 as an audio-path change, not an avatar feature.**
6. **E-5 as written cannot prove the faceTap is a no-op.** Echosim simulates the portfolio's `liveCall.ts` logic, not the
   Android audio HAL. Creating an extra `AudioContext` on Android opens its own output stream, even with nothing connected to the
   destination. That can affect audio mode, routing or volume stream, and BT SCO/A2DP selection, in ways a simulator cannot see
   **[U]**.
   - Add an **on-device E-5b**: a 10-minute call on each reference phone over speaker, wired and BT, with and without the tap,
     comparing tutor self-interruptions, `concealedSamples`/`totalSamplesReceived`, and the echo the model reports.
   - Also verify on the Android WebView that `createMediaStreamSource(remoteStream)` yields non-silent samples. Chromium has a
     long history of remote-stream-in-WebAudio silence, which is why the `<audio>` element workaround exists.
   - Use `numberOfOutputs: 0` on the worklet so it is an automatically pulled node and nothing connects to `destination`
     **[U, verify Chromium pulls it in WebView]**.

### G-4. Licence traps that were missed or understated

| item | the document says | the reality | action |
|---|---|---|---|
| Hindi forced aligner (§5.5 step 2: "an MMS-based aligner") | unspecified | fairseq MMS README: "The MMS code and model weights are released under the **CC-BY-NC 4.0** license" **[V]**. torchaudio's `MMS_FA` bundle is the same model | **Do not use MMS** for the commercial label pipeline. Use Azure Speech word timestamps (first-party, so it fits the Azure-only directive) plus Azure TTS viseme events where the audio is Azure TTS. Montreal Forced Aligner or a commercially licensed Hindi acoustic model are alternatives **[U, licence per model]** |
| LAM-20K Gaussian heads | blocked only on FLAME (#111) | the published LAM-20K checkpoint row says it was trained on **VFHQ + NeRSemble**; both are distributed for research via access forms **[V for the training-data row; U for their exact terms]**, so these weights carry the same data encumbrance §2.1 applies to VOCASET/BIWI | the v3 gate needs **(a) the FLAME edition, (b) the dataset terms, (c) or retraining on licensed captures** |
| LAM-A2E as a teacher | "probably yes" | Apache-2.0 weights with **undisclosed** training data **[V]**. Output use is probably fine; the problem is that "clean chain" (§7) cannot be asserted for undisclosed data | keep LAM-A2E as a *secondary* teacher; confirm the student meets E-3 with **A2F + Azure labels only**, so LAM can be dropped if challenged |
| Training a student on gpt-realtime output audio | not discussed | Azure OpenAI terms restrict using output to develop competing models **[U, read the current Product Terms]**. A lip model is very unlikely to "compete", but it is a sign-off item | add it to the §7 legal list |
| A2F identities | "derivative models ours" | correct **[V]**. But the student learns Claire/James/Mark's *articulation style*; that is no licence issue, only a style issue | the per-character `styleId` should not be marketed as any actor's likeness |
| Character faces (all tiers) | n/a | for a children's product, no selectable tutor may resemble a real person (teacher, celebrity) without a signed likeness release | add to the character pipeline |

### G-5. Uncanny-valley risks specific to children

1. **The audience spans the age at which uncanny feelings appear.** Brink, Gray and Wellman (2019, *Child Development*,
   n = 240, ages 3–18) found that children **older than about 9** judged a very human-like robot creepier than a machine-like
   one, and younger children did not. The effect was predicted by how human-like a mind the children attributed to the robot
   **[V, abstract]**. Classes 1–9 cover ages ≈6–15, and parents watch too. The older half of the users is in the sensitive
   band, and an "exactly-human" voice *raises* mind attribution. This strengthens "stylised at v1" and argues against pushing
   the 10–15 cohort to "video-real" before a kids' panel (E-3/E-7) is split by age band (≤9 versus ≥10).
2. **Face–voice realism mismatch is itself uncanny.** Mitchell et al. (2011, *i-Perception*): "a mismatch in the human realism
   of a character's face and voice causes it to be evaluated as eerie" **[V, abstract]**. A human-grade gpt-realtime voice on a
   cartoon face is that mismatch. Mitigations:
   - pick a *semi*-stylised art direction, with believable skin and eyes and simplified proportions, rather than a toon;
   - make motion quality (the non-lip layers) match the voice's quality;
   - add an **E-9 face–voice congruence A/B** with each character's actual voice.
3. **Repetition reads as robotic faster than imperfection does.** A child may answer 40–80 items in a lesson, and §6.1 fires
   the same Duchenne program on every correct one. Changes:
   - **variant pools** of at least 3–5 parameterised versions per program, with randomised timing, asymmetry and amplitude;
   - **habituation decay**: intensity drops with repetitions in a window and resets on a streak or milestone;
   - a cap on full-intensity praise faces per minute.
4. **Stare risk.** Eye contact of 0.85–0.9 while listening or probing, on a camera-facing avatar, can feel like being watched
   for a shy child. Children are also commonly taught to lower their gaze before teachers **[U]**. Cap listening eye contact at
   about 0.7, break gaze every 2–4 s, and include "felt watched or scolded" as a rated item in E-7 for the kids' panel.
5. **Morph-only ageing is a trap for "Dadi" and "Sir".** Wrinkles and skin folds do not deform under blend shapes without
   corrective shapes or wrinkle normal maps. An older face that stays smooth while smiling looks rubbery. Signal age with
   stylised cues (hair, glasses, proportions, slower motion) and keep the realism level equal across characters.
6. **Mouth interior.** The student predicts `jawOpen` and the `mouth*` channels, and the only tongue channel is `tongueOut`.
   Hindi dentals (त द, tongue tip visible at the teeth) and wide `jawOpen` × `lipGain` > 1 expose a dark, empty cavity on
   stylised rigs. Every character therefore needs:
   - modelled teeth and tongue;
   - a darkened mouth-cavity gradient;
   - a `jawOpen` ceiling per character.

### G-6. Production effort: "1–2 weeks of ML work" for T2 is about 5–8× low

Here is a realistic plan for one strong ML and graphics engineer, assuming GPU quota is granted **[U, my estimate]**:

| work | engineer-weeks |
|---|---|
| A2F SDK + TensorRT build on an Azure GPU VM, blend-shape solve per actor, ARKit retarget validation on our rigs | 1.5–2 |
| Licence-clean Hindi/Hinglish alignment (MMS is excluded) and closure-mark QA | 1 |
| 10–20 h of tutor-register audio per voice, with Opus/NetEq augmentation | 1 |
| Student training: forecast heads, closure loss, a streaming export with state I/O, the hand-written kernel | 3–4 |
| faceTap worklet, Worker, compositor, route-aware `latencyComp`, barge-in, VAD gating | 2–3 |
| Device work: E-2, E-4 and E-5b on at least 3 phones × 3 output routes | 1.5–2 |
| Blind A/B with adults and a consented kids' panel, split by age band | 2 (elapsed) |

The total is **≈12–15 engineer-weeks** for the lip and behaviour stack. That excludes per-character rigs, where 52 quality
ARKit shapes plus correctives, teeth and tongue per character are the dominant cost (see `character-creation.md`). HeadAudio-Hindi
(§5.6) plus the procedural layers (§6) can ship first, in about 3–4 weeks, and the student can replace HeadAudio later behind the
`FaceFrame` seam. **Sequence it that way, and do not promise T2 at launch.**

### G-7. Changes to the experiment table

- **E-1:** also report the per-pass GPU time on the actual Azure SKU (this replaces the "11 min" arithmetic).
- **E-2:** pass bars are p95 per **20 ms** frame on the *little* core, with the Worker pinned by load and not by hope; the
  Worker's total memory includes the WASM module; and **cold start ≤ 1.5 s** to the first `FaceFrame`.
- **E-3:** add the student closure rate per Δ, and split the kids' panel by age band (≤9 versus ≥10).
- **E-4:** measure each output route (speaker, wired, BT) separately; the pass bar is **−125 ms ≤ offset ≤ +45 ms**, with the
  sign recorded.
- **E-5b (new):** an on-device audio-floor run with and without the faceTap, and with cached-clip playback.
- **E-9 (new):** face–voice congruence per character, with the actual voice.

Sources added in this review
- A2F-3D SDK `docs/README.md` (diffusion "generates 60 frames per second", 15/30/15 truncation): https://github.com/NVIDIA/Audio2Face-3D-SDK **[V, read]**
- A2F-3D v3.0 file listing (`network.onnx` 724,844,664 B) and `network_info.json`: https://huggingface.co/nvidia/Audio2Face-3D-v3.0/tree/main **[V]**
- onnxruntime-web 1.30.0 dist files: https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/ **[M]**
- fairseq MMS licence: https://github.com/facebookresearch/fairseq/blob/main/examples/mms/README.md **[V]**
- LAM README (training data and mobile FPS rows): https://github.com/aigc3d/LAM **[V]**
- Brink, Gray and Wellman 2019, "Creepiness Creeps In: Uncanny Valley Feelings Are Acquired in Childhood", *Child Development*, doi:10.1111/cdev.12999 **[V, abstract]**
- Mitchell et al. 2011, "A Mismatch in the Human Realism of Face and Voice Produces an Uncanny Valley", *i-Perception*, doi:10.1068/i0415 **[V, abstract]**
- Micro-bench: `bench/student-ort/` (`mk.py`, `b.mjs`, README) **[M]**
