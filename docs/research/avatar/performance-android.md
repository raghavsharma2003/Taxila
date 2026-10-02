# 3D tutor avatar on ₹10k Android: performance budgets, fallback tiers and device-tier detection (measured where possible)

Date: 2026-10-02. Scope: what it costs to run the Taxila 3D tutor face inside Capacitor's Android WebView on Helio G35 /
Helio G85 / Snapdragon-with-Adreno-610 phones (3–4 GB RAM), next to a live gpt-realtime WebRTC call and a generated
module iframe. It ends with the budgets each tier must meet and the code that picks the tier.

Builds on, and does not repeat:
- `web-3d-talking-heads.md`: three.js + TalkingHead v1 stack, MPFB characters, asset spec (§3.1), lip driver (§6), and a first perf table (§9).
- `audio-to-face-ml.md`: the `FaceFrame` protocol (§5.1) that every renderer tier below consumes.
- `../tech-and-market.md` §2: Rive 2D was the v1 pick before the owner asked for 3D. It survives here as a fallback tier.
- `../../harvest/companion-tech.md` §13:
  - lip-sync is slaved to the playback clock,
  - nothing heavy runs on the audio thread,
  - any change to the audio output path re-runs echosim.

Tags:
- **[M]** measured here (scripts and raw JSON in `bench/perf/`, method in §3).
- **[V]** verified in source code or a primary document.
- **[S]** secondary source.
- **[U]** unverified or estimated. Every [U] has a device-lab item in §10.

Everything [M] ran on a 4-core Xeon at 2.1 GHz in this container, not on a phone. When I scale a number to a phone,
the scaled number is tagged **[M→U]**.

---

## 0. TL;DR: findings that change decisions

1. **Android WebView has no WebGPU in 2026. Build on WebGL2 only.**
   - **Chrome for Android:** WebGPU since Chrome 121, on Android 12+ with Qualcomm or ARM GPUs **[V, Chrome blog]**. Imagination (PowerVR, which is the Helio G35's GE8320) needs Android 16+ and Chrome 139 **[V, gpuweb Implementation Status]**.
   - **Android WebView:** chromestatus has **no WebView milestone at all** for WebGPU, and caniuse marks Android WebView 154 as unsupported **[V]**.
   - The APK runs in WebView, so WebGPU is not an option there, whatever three.js's WebGPURenderer can do. The sibling also found a morph-target perf regression in that renderer (three.js #29980).
   - All three target GPUs are GLES 3.x parts and expose WebGL2.
2. **Module iframes share the avatar's main thread in WebView.**
   - "Site Isolation is not yet supported in Android WebView" **[V, chromium.org]**, so there are no out-of-process iframes.
   - A generated module that runs a 50 ms physics step steals 50 ms from the avatar, the React shell and the main-thread lip tap alike.
   - Measured with a same-process iframe busy 50 ms in every 100 ms **[M]**:

     | lip data route | p99 gap | max gap |
     |---|---|---|
     | via the main thread | **≈ 76 ms** | **136–303 ms** |
     | AudioWorklet port straight to a render worker | **35–40 ms** | **42–66 ms** |

     The figures are over 4 runs of 10 s each.
   - Frames over 50 ms fell from a median of 20.5 to about 10 per 10 s (pooled over both worker arms) when rendering moved to an OffscreenCanvas worker, but the effect is noisy (§3.4).
   - **Design: render in a worker on an OffscreenCanvas, and feed lips from a worklet port.** Keep the main-thread path as the fallback.
3. **Use meshopt, not Draco, for face avatars [M].**
   - Draco (KHR_draco_mesh_compression) compresses only base attributes. **Morph targets stay raw.** Draco GLBs came out at 2.15–19.6 MB against 0.96–2.86 MB for meshopt (raw: 2.3–20.4 MB).
   - Morphs are 80–91% of a face avatar's geometry bytes (1.1 of 1.3 MB on brunette, 13.7 of 15.1 MB on MPFB).
   - Meshopt also decodes faster: 2.0–7.9 ms against 5.9–17 ms for Draco, both single-thread, and it decodes the morphs too.
   - The decoder is smaller too: 6.5 KB gz against 100 KB gz for Draco.
   - After brotli, all three formats are within ±10% on the wire. The win is parse time and memory, not download.
4. **Use KTX2 ETC1S for colour, not WebP and not UASTC [M].**
   - **GPU memory:** a 1024² WebP becomes **5.59 MB** of RGBA8 + mips on the GPU. ETC1S transcodes to ETC1 (**0.70 MB**) or ETC2 RGBA / ASTC (**1.40 MB**).
   - **CPU:** the ETC1S transcode takes **3–5 ms**. WebP decode takes 22–31 ms, and UASTC→ASTC takes 12–27 ms.
   - **Size:** ETC1S files were ~105 KB. UASTC+zstd was ~650 KB, 6× larger, for a stylised face that does not need it.
   - **Cost:** the basis transcoder is **260 KB gz** (wasm + JS) once. That is free inside the APK and cached on the web.
5. **Measured T2 character [M].** These are the pipeline results on TalkingHead samples, with brunette and avaturn as stand-ins for an MPFB character:

   | pipeline | GLB | resident GPU + JS memory |
   |---|---|---|
   | as shipped by TalkingHead, KTX2 (T3) | 4.2–8.5 MB | 17–41 MB |
   | **T2**: drop the 15 Oculus visemes, drop morph *normals*, drop normal/ORM maps, one 1024² ETC1S | **0.87–1.44 MB** | **10–17 MB** |
   | T2-lite: 28 morphs, 512² | 0.5–0.8 MB | 4.6–6.7 MB |

   - three.js packs morph *normals* only when they are present (`vertexDataCount` 1 vs 2) **[V, WebGLMorphtargets.js]**, so dropping them halves morph memory.
6. **TalkingHead's defaults are desktop defaults [V].**
   - Its constructor sets `antialias: true, alpha: true`, ACES tone mapping and a PMREM `RoomEnvironment` IBL. It also builds a WebAudio graph with a convolver reverb, and needs `AudioContext`, `Audio`, `ResizeObserver` and `window` (`talkinghead.mjs` L822–868, L919–975).
   - **None of that can run in a worker, and the IBL + MSAA is the wrong default for a Mali-G52.**
   - Use `avatarOnly` mode with our own renderer, and add a 10-line worker shim (§5.2).
7. **GPU index for the target band, from detect-gpu 5.0.70's GFXBench-derived table [S], normalised as fps × pixels.**

   | GPU | SoC examples | Mpx/s | index (GE8320 = 1.0) |
   |---|---|---|---|
   | PowerVR GE8320 | Helio G35 | **22** | 1.0 |
   | Adreno 610 | SD 662 / 680 | **35** | 1.6 |
   | Mali-G52 MC2 | Helio G85 | **≈50** | 2.3 |
   | Mali-G57 MC2 | Dimensity 6100+ | ≈85 | 3.8 |
   | Adreno 618 | | ≈88 | 4.0 |

   - The ₹10k band spans **4×** in GPU throughput. One budget cannot fit it, hence tiers.
   - The Helio G35 also has only Cortex-A53 cores, so it is weak on both CPU and GPU.
8. **Tiers.**

   | tier | content | default for |
   |---|---|---|
   | **A** | 3D-full | |
   | **B** | **3D-lite** | G85 / Adreno 610: the ₹10k design target |
   | **C** | 2.5D sprite rig | G35, or a failed probe |
   | **D** | static portrait + mouth | |
   | **E** | voice-only | |

   - **Tier C is pre-rendered offline from the same 3D character,** so a child's chosen tutor looks like the same person on every phone.
   - Rive is a C alternative, not the default. Its runtime alone is **368 KB gz** (canvas-lite) to **821 KB gz** (canvas) of WASM **[M]**, which is more than three.js + TalkingHead (204 KB gz, sibling).
9. **How the tier is chosen:**
   1. Static facts from a Capacitor plugin (RAM, SoC, Android SDK, WebView version, thermal API) and WebGL facts (renderer string, compressed formats) pick a starting tier.
   2. A **2-second probe of the real tier-B avatar** on the tutor-picker screen confirms or demotes it.
   3. A **runtime governor** steps down on any of: fps, long frames, thermal status, battery saver, or **WebRTC audio concealment rising**.
   4. Tier switches happen only in silence, with a 200 ms crossfade. The governor steps down fast and up slow.
   - `navigator.hardwareConcurrency` (8 on every target) and `navigator.deviceMemory` (power-of-two buckets) cannot separate these phones.

---

## 1. Target devices and what they are

| SoC | CPU | GPU | typical RAM / screen | detect-gpu entry [S] | Mpx/s | index |
|---|---|---|---|---|---|---|
| **Helio G35** | 8× Cortex-A53 @ 2.3 GHz [U] | PowerVR GE8320 | 3–4 GB, 720×1600 | 21 fps @ 1465×720 (Galaxy A12) | 22 | 1.0 |
| **Snapdragon 662/680** (Adreno 610) | 4× A73 + 4× A53 [U] | Adreno 610 | 4 GB, 720p–1080p | 33 fps @ 1557×678 (Moto G30) | 35 | 1.6 |
| **Helio G85/G88** | 2× A75 @ 2.0 + 6× A55 @ 1.8 [U] | Mali-G52 MC2 | 4 GB, 720p–1080p | 43 @ 1543×688; 19–23 @ 1080p (6 devices) | ≈50 | 2.3 |
| reference: Dimensity 6100+ | 2× A76 + 6× A55 [U] | Mali-G57 MC2 | 4–6 GB | 35–39 @ 1080p | ≈85 | 3.8 |
| reference: SD 720G/732G | | Adreno 618 | | 31–40 @ 1080p | ≈88 | 4.0 |

Notes:
- **The index is a ranking aid, not a frame-time predictor.** detect-gpu says its scores are "framerate, normalized by
  resolution" from gfxbench.com, which it stopped updating in December 2025 **[S]**. GFXBench scenes are much heavier
  per pixel than a stylised face, so §4 sets budgets in pixels and draw calls and leaves the probe to measure the rest.
- **CPU:**
  - Chrome's renderer main thread runs on whatever core the scheduler gives it. On the G85 and SD 680 that is a big core (A75/A73) when busy. On the G35 it is always an A53.
  - My working assumption: a G85/SD 680 big core is ≈3× slower single-thread than this container's Xeon core, and a G35 A53 is ≈5–6× slower **[U; confirm with the §10 probe]**.
  - So §3's CDP CPU-throttle runs at 4× and 6× bracket G85 and G35 respectively.
- **Refresh rate:**
  - Many 2025–26 ₹10k phones ship 90 Hz or 120 Hz LCDs **[U]**.
  - rAF fires at the panel rate, so the fps cap must be a divisor of it, or frames pace unevenly: 30 on 60/90/120 Hz, then 20 on 60/120 Hz or 22.5 on 90 Hz.

---

## 2. Platform facts that constrain the design

| fact | status Oct 2026 | consequence |
|---|---|---|
| WebGPU in Chrome for Android | 121+, Android 12+, Qualcomm/ARM; Imagination Android 16+ (Chrome 139); Samsung Xclipse ~154; others TBD **[V]** | irrelevant to the APK; maybe a web-only tier-A path later |
| WebGPU in Android WebView | no milestone on chromestatus; caniuse "Android Browser 154: not supported" **[V]** | **WebGL2 only** in the APK |
| WebGL2 on GE8320 / Adreno 610 / Mali-G52 | GLES 3.2-class parts **[U on blocklists]** | probe at startup; tier D when the context fails |
| Site isolation / OOPIF | "not yet supported in Android WebView", and absent on Chrome Android below 2 GB RAM **[V]** | **module iframes run on the avatar's main thread** |
| WebView renderer death | the system may kill the renderer under memory pressure; `onRenderProcessGone` must destroy and recreate the WebView **[V, Android docs]** | keep the avatar's resident memory small (§4.3); handle it natively and resume audio-only |
| `setRendererPriorityPolicy(RENDERER_PRIORITY_BOUND, true)` | lowers the renderer to WAIVED when the WebView is invisible **[V]** | when backgrounded, the call keeps going, so stop rendering on `visibilitychange` |
| OffscreenCanvas + WebGL in a worker | caniuse marks Chrome Android and Android WebView 154 supported **[V]**; GPU-accelerated worker WebGL on these WebView drivers **[U]** | feature-detect plus a context probe in the worker; fall back to the main thread |
| `navigator.deviceMemory` | power of two, clamped, HTTPS only **[V, MDN]** | useless between 3 and 4 GB; use native `ActivityManager.MemoryInfo.totalMem` |
| `navigator.hardwareConcurrency` | 8 on every target | useless |
| Thermal API | `getThermalHeadroom()` from API 30, **at most once per 10 s or it returns NaN**; status listener; on older devices `getCurrentThermalStatus()` may always say NONE **[V, Android ADPF docs]** | poll headroom every 10 s from native code and push it to JS (§7) |
| `Build.VERSION.MEDIA_PERFORMANCE_CLASS` | API 31+; 0 when the device declares no class **[S]** | ₹10k phones report 0. Use it only as a positive signal for tier A |
| WebRTC inbound-rtp stats | `concealedSamples`, `totalSamplesReceived`, `jitterBufferDelay` exposed by Chrome **[S]** | **the governor's audio-health signal** (§6.3) |

---

## 3. Measurements [M]

Reproduce with `bench/perf/README.md`. Inputs are the TalkingHead sample avatars, already characterised in sibling §3.1.
Brunette is CC BY-NC: it is used here for measurement only and must never ship.

### 3.1 Geometry codec (`asset.mjs`, `codec.mjs`)

Each input started from the sibling's meshopt + WebP 1024 file. I wrote three variants with identical textures:
- **raw:** meshopt removed.
- **meshopt:** reorder + quantize + `EXT_meshopt_compression` at level "high".
- **draco:** edgebreaker.

Codec time is the pure decoder over every compressed bufferView or primitive, with no glTF-graph overhead. It is the
median of 15 runs on one thread: `MeshoptDecoder.decodeGltfBuffer` for meshopt, as GLTFLoader calls it, and
`draco3d.Decoder` for Draco, as DRACOLoader's worker calls it.

| avatar | morph share of geometry bytes | raw MB (brotli) | **meshopt MB** (brotli) | draco MB (brotli) | meshopt decode | draco decode (base attributes only) |
|---|---|---|---|---|---|---|
| brunette 13k tris | 1.06 / 1.31 MB = 81% | 2.31 (0.73) | **0.96** (0.69) | 2.15 (0.69) | **2.0 ms** (1.7 MB out) | 5.9 ms |
| avaturn 31k | 2.65 / 3.33 = 80% | 5.54 (1.80) | **2.12** (1.67) | 5.13 (1.71) | **2.5 ms** | 10.2 ms |
| vroid 40k | 4.58 / 5.47 = 84% | 6.06 (0.90) | **1.80** (0.81) | 5.38 (0.79) | **3.1 ms** | 16.7 ms |
| avatarsdk 47k | 6.09 / 7.01 = 87% | 10.49 (2.32) | **2.70** (2.07) | 9.83 (2.16) | **5.5 ms** | 17.0 ms |
| mpfb 78k | 13.67 / 15.08 = 91% | 20.42 (1.86) | **2.86** (1.75) | 19.64 (1.78) | **7.9 ms** (19.8 MB out) | 16.5 ms |

What it means:
- Draco "succeeded" on every primitive (all were compressed), yet the files stayed 89–96% of raw. **Draco does
  not touch morph targets**, and on a face the morph targets *are* the payload.
- Brotli shrinks raw morph data almost as well as meshopt, because face morphs are mostly zero deltas. On the wire
  the three formats come out within ±10%. Inside the APK, assets sit in the zip and are read raw, so the uncompressed
  size is what gets read and parsed.
- Meshopt's decoder is 24.8 KB raw / **6.5 KB gz**. Draco's is 286 KB wasm + 59 KB wrapper = **100 KB gz**, plus a worker [M].
- Scaled to a G85 big core (≈3×): meshopt is 6–24 ms and Draco 18–50 ms, in a worker, plus worker start-up **[M→U]**.

**Decision: meshopt + `KHR_mesh_quantization` for every tier. Draco never.**

### 3.2 Textures (`tex.mjs`)

Input: each avatar's largest base-colour texture (1024²). Arms:
- WebP as emitted by the sibling's pipeline.
- KTX2 ETC1S (quality 128, mips).
- KTX2 UASTC + RDO + zstd (mips).

Decoders: `sharp`/libwebp for WebP, and **three r180's own `basis_transcoder.wasm`** for KTX2, which is what
`KTX2Loader` runs in its workers. Figures are the median of 9 runs on one thread.

| avatar | WebP KB / decode ms | GPU MB (RGBA8 + mips) | **ETC1S KB** | ETC1S→ETC1 RGB ms / GPU MB | ETC1S→ETC2 RGBA ms / GPU MB | ETC1S→ASTC4x4 ms | UASTC KB | UASTC→ASTC ms | UASTC→ETC2 ms |
|---|---|---|---|---|---|---|---|---|---|
| brunette | 48 / 26.8 | 5.59 | **107** | **4.1 / 0.70** | 5.4 / 1.40 | 8.6 | 646 | 26.5 | 21.2 |
| avaturn | 26 / 31.4 | 5.59 | **111** | **3.0 / 0.70** | 3.4 / 1.40 | 5.5 | 674 | 11.7 | 20.5 |
| avatarsdk | 24 / 22.5 | 5.59 | **105** | **3.5 / 0.70** | 4.0 / 1.40 | 6.8 | 647 | 17.3 | 20.0 |
| mpfb | 37 / 26.4 | 5.59 | **105** | **3.6 / 0.70** | 4.4 / 1.40 | 7.4 | 614 | 13.0 | 21.7 |

Notes:
- three's `KTX2Loader` picks the target format by priority. **ETC1S goes to ETC2 (priority 1), then ETC1, BC7 or DXT.
  UASTC goes to ASTC first** **[V, KTX2Loader.js L755–835]**.
- On Mali-G52 and Adreno 610, ETC1S therefore lands as ETC1 RGB (0.5 B/px) for opaque textures, or ETC2 RGBA (1 B/px) when there is alpha.
- The transcoder is 527 KB wasm + 58 KB JS = **260 KB gz** **[M]**.
- **Decision: ETC1S for colour, emissive and the hair-alpha atlas.** Use UASTC only for a normal map, and only in tier A.

### 3.3 Tiered character pipeline (`pipeline.mjs`)

All three arms run `prune` → `dedup` → resize → ETC1S (colour) / UASTC (normal and ORM) → reorder → quantize → meshopt.
Resident memory = decoded geometry + the morph `DataArrayTexture` + its retained JS `Float32Array` copy (three keeps
`entry.buffer`) + textures at 1 B/px with mips (conservative).

| avatar | arm | GLB MB | tris | morph targets | morph tex MB (×2 incl. JS copy) | texture GPU MB | **resident MB** |
|---|---|---|---|---|---|---|---|
| brunette | T3 (all 72 targets, pos + normal, UASTC normal maps) | 4.23 | 13.3k | 72 | 2.86 (5.72) | 11.2 | 17.1 |
| brunette | **T2** (drop `viseme_*`, drop morph normals, no normal/ORM maps) | **0.87** | 13.3k | 57 | 2.27 (4.54) | 5.2 | **10.0** |
| brunette | T2-lite (28 ARKit, 512²) | 0.50 | 13.3k | 28 | 1.11 (2.22) | 2.1 | 4.6 |
| avaturn | T3 | 8.49 | 31.2k | 72 | 9.58 (19.2) | 21.2 | 41.0 |
| avaturn | **T2** | **1.44** | 31.2k | 57 | 3.67 (7.34) | 8.8 | **16.9** |
| avaturn | T2-lite | 0.80 | 31.2k | 28 | 1.75 (3.50) | 2.5 | 6.7 |

The pipeline did not decimate. Triangle budgets (§4.1) are an art-side job: MPFB proxies, or a Blender decimate on the
body only. They are not something to automate on the face.

Dropping morph normals has a visible cost: lighting does not follow the deformation, so a smile does not darken the
cheek crease. With stylised, softly lit shading that is acceptable **[U: check in the E-P4 blind A/B]**.

### 3.4 Frame cadence and the iframe problem (`run-web.mjs`, `web/`)

Setup:
- Chromium 141 with SwiftShader WebGL2, launched with `--disable-site-isolation-trials` and `--disable-features=IsolateSandboxedIframes,SitePerProcess` so that the iframe shares the renderer, as in WebView.
- The render loop mirrors TalkingHead's per-frame work: 14 active ARKit morphs, a blink, head and neck bone motion, a 30 fps timestamp cap, and a 360×400 canvas at DPR 1.
- "work" is the JS time of update + `renderer.render()`.
- Each run is 10 s.

**(a) Avatar cost on the main thread.** SwiftShader rasterises on the same 4 CPUs, so the fps here means nothing for a
phone GPU. The work column is the useful one.

| avatar | CPU throttle | work p50 / p95 ms | GLB load ms | first frame (shader compile) ms |
|---|---|---|---|---|
| brunette 13k, 8 draws | 1× | 0.6 / 2.1 | 135 | 183 |
| avatarsdk 47k | 1× | 1.0 / 2.9 | 198 | 370 |
| mpfb 78k | 1× | 1.4 / 10.0 | 185 | 480 |
| brunette | **4× (≈G85)** | **3.9 / 19.4** | 721 | 527 |
| brunette | **6× (≈G35)** | **7.1 / 32.8** | 632 | 690 |
| mpfb | 4× | 4.1 / 36.5 | 586 | **1771** |
| tiny probe (1 draw, 14 morphs) | 1× / 4× / 6× | 0.2 / 0.5 → 1.0 / 2.1 → 1.5 / 3.4 | | |

How to read it:
- A tier-B avatar costs about **4 ms p50 of main-thread JS on a G85-class core and about 7 ms on a G35** **[M→U]**.
- The p95 tail (19–33 ms) is partly SwiftShader contention, but it shows why the avatar should not share the main thread with a module.
- **Shader compile is the worst single stall: 0.5–1.8 s at 4×.** Compile during the tutor picker with `renderer.compileAsync()`, never on the first spoken word.

**(b) Same-process iframe load, main thread vs OffscreenCanvas worker.**
- Tiny scene, so raster cost is negligible.
- **heavy** = the iframe busy-waits 50 ms in every 100 ms.
- The lip source is an AudioWorklet posting an envelope every 8 quanta (≈21 ms). It goes either through the main thread ("relay") or straight to the worker over a transferred `MessagePort` ("direct").
- Runs: 4 for each heavy arm, 2 for each no-load arm; each cell lists one value per run.

| arm | fps | frames > 50 ms (of ~270) | lip gap p99 ms | lip gap max ms |
|---|---|---|---|---|
| no load, main | 29.6, 29.8 | 2, 1 | 30.9 (n=1) | 130 (n=1) |
| no load, worker + direct | 30.0, 30.0 | 0, 0 | 30.4 (n=1) | 44 (n=1) |
| **heavy, main + relay** | 22.3, 26.0, 27.9, 26.3 | **44, 20, 18, 21** | **75–77** | **136–303** |
| heavy, worker + relay | 24.1, 29.0, 29.4, 27.9 | 35, 8, 3, 8 | 73–86 | 79–113 |
| **heavy, worker + direct** | 26.3, 26.2, 28.0, 28.2 | **21, 22, 12, 9** | **35–40** | **42–66** |

What it shows:
- **The lip-data path is the robust result.** Routing the envelope around the main thread halves p99 staleness and cuts the worst case 3–5×.
  - A 136–303 ms lip freeze is visible: ITU-R BT.1359's acceptability bound is +90 ms (sibling §6.1).
  - So is a 50 ms one, but only just.
- **Worker rendering helps frames, but noisily.** It took the median frames > 50 ms from 20.5 to about 10 (median of all 8 worker runs; 16.5 for the direct arm alone, 8 for relay).
  - The leftovers are CPU contention on 4 cores (SwiftShader's GPU threads, the busy iframe, the worker and the audio thread), not main-thread blocking.
  - A phone with 8 cores and a real GPU should do better. That is unproven **[U → §10 E-P2]**.
- Light load (16 ms in every 100 ms) cost the main-thread arm 10 frames > 50 ms against 14 for the worker. At that load the arms are indistinguishable.
- **Caveats:** this is n = 2–4 runs per arm, desktop Chromium rather than WebView, and SwiftShader rather than a mobile GPU. It is a scheduling demonstration, not a phone measurement.

### 3.5 Runtime sizes [M]

| component | gz |
|---|---|
| three + GLTFLoader + meshopt (sibling) | 145 KB |
| + TalkingHead (sibling) | 204 KB |
| basis transcoder (js + wasm) | 260 KB |
| Rive `@rive-app/canvas-lite` 2.44.0 wasm | **368 KB** |
| Rive `@rive-app/canvas` 2.44.0 wasm | **821 KB** |
| Tier-C sprite compositor (our code, §8.2) | ~3 KB (est.) |

---

## 4. Budgets

### 4.1 Asset budget per tier (hand this to the artist)

| item | **A: 3D-full** | **B: 3D-lite (₹10k target)** | B-lite (G35 when promoted) |
|---|---|---|---|
| framing | head + shoulders + hands | **head + shoulders bust** (no legs, hands only when gesturing) | bust |
| triangles in view | ≤ 30k | **≤ 15k** (head ≤ 8k, hair ≤ 3k) | ≤ 8k |
| draw calls | ≤ 8 | **≤ 4** (body+outfit, head, eyes, hair) | ≤ 3 |
| bones | Mixamo + ≤ 16 dynamic | Mixamo upper body, **no dynamic bones** | no dynamic bones |
| morph targets | 52 ARKit + 15 Oculus, pos + normal | **52 ARKit, position only, head + teeth + tongue only** | 28 ARKit (the §3.3 list), pos only |
| morph vertices (head + teeth) | ≤ 8k | **≤ 6k** → 6k × 52 × 16 B = **5.0 MB** (×2 with the JS copy) | ≤ 4k → 1.8 MB |
| textures | 1024² colour (ETC1S) + normal + ORM (UASTC) | **one 1024² ETC1S atlas** + a 256² hair alpha atlas; **no normal map**; lighting partly baked into the albedo | one 512² atlas |
| material | MeshStandard + 32² prefiltered env | **MeshLambert or a toon/matcap shader**, 1 directional + hemisphere light | matcap |
| hair | alpha-test cards, sorted once | **alpha-test (`alphaTest: 0.5`), never alpha-blend**; no per-frame sort | painted-on shell |
| GLB over the wire | ≤ 2.5 MB | **≤ 1.5 MB** (measured 0.87–1.44 MB in §3.3) | ≤ 0.8 MB |
| resident (GPU + JS) | ≤ 45 MB | **≤ 20 MB** (measured 10–17 MB) | ≤ 8 MB |

### 4.2 Runtime budget per tier

| knob | A | **B** | B-lite |
|---|---|---|---|
| fps cap: speaking / listening / idle | 30 / 30 / 30 | **30 / 30 / 20**: idle with no audio either way drops to 20 (blinks and breathing read fine) | 24 or 22.5 / 20 / 15 |
| canvas pixels | ≤ 0.5 Mpx (DPR ≤ 1.5) | **≤ 0.22 Mpx**: `pixelRatio = min(1.25, sqrt(0.22e6 / cssW·cssH))` | ≤ 0.12 Mpx (DPR 1.0) |
| antialias | MSAA ×4 if DPR ≤ 1.25 | **off**. The higher DPR is cheaper than MSAA on tilers, and there is no post-FXAA | off |
| context flags | `alpha:false, powerPreference:"high-performance"` | **`alpha:false, antialias:false, depth:true, stencil:false, powerPreference:"low-power", preserveDrawingBuffer:false`** | same |
| tone mapping / colour | ACES or Neutral | **none at runtime**: bake the look into the textures | none |
| shadows, post, SSS | contact shadow plane only | **none** | none |
| main-thread JS per frame (if not in a worker) | ≤ 4 ms | **≤ 4 ms p50, ≤ 8 ms p95** (measured ≈ 3.9 / 19 ms at 4×: hence the worker) | ≤ 7 ms p50 |
| GPU time per frame | ≤ 8 ms | **≤ 6 ms**, measured by the probe (§6.2) | ≤ 6 ms |
| first render after the picker | < 300 ms (precompiled) | **< 300 ms**: `compileAsync` during the picker | same |

### 4.3 Memory budget on a 3–4 GB phone

Android starts killing background apps, then the WebView renderer, long before RAM is "full". Assume Taxila's
renderer gets **≈ 300–450 MB** before pressure on a 3 GB phone, and ≈ 500–700 MB on 4 GB **[U, measure: E-P3]**.

| consumer | tier B budget |
|---|---|
| avatar (GPU + JS, §3.3) | **≤ 20 MB** |
| canvas back buffers: 0.22 Mpx × (4 B colour + 4 B depth) × 3 compositor buffers | ≈ 5 MB |
| three.js + TalkingHead + app JS heap | ≤ 40 MB |
| module iframe (its own heap + canvas) | ≤ 120 MB, enforced in the module SDK's rules |
| WebRTC + audio + `<audio>` | ≈ 20–30 MB [U] |
| **headroom for GC spikes and the next tutor's GLB** | ≥ 100 MB |

Rules:
- Load **one character at a time**. The picker shows static thumbnails (sibling §8). Dispose the old character's geometry, textures and morph textures before parsing the new one.
- **Never keep two WebGL contexts alive for the avatar.** The worker owns the only one.
- Modules that use WebGL get their own context, so lose the avatar's context gracefully when a module needs the GPU (§5.3).

### 4.4 Frame budget alongside WebRTC and a module (tier B, 30 fps = 33.3 ms)

| thread | who | budget per frame |
|---|---|---|
| renderer **main** | React shell, data channel handling, module iframe JS, `postMessage` bridge | shell ≤ 4 ms; **module ≤ 16 ms per task** (module SDK rule: no task > 16 ms, chunk physics with `scheduler.yield()` or `setTimeout`) |
| **render worker** | TalkingHead-in-worker: FaceFrame mixing + `renderer.render` | ≤ 6 ms (§3.4 scaled) |
| **audio render thread** | the AudioWorklet RMS tap (≤ 128 multiply-adds per quantum) | ≤ 1% of the 2.67 ms quantum; sibling measured a heavier processor at p99 0.08 ms |
| WebRTC network / decoder / AEC threads | Opus decode, AEC3, jitter buffer | other cores; watch `concealedSamples` (§6.3) |
| GPU | avatar ≤ 6 ms, module canvas ≤ 15 ms, compositor ≤ 5 ms | total ≤ 26 ms of 33 |
| compositor (browser / viz) | composites the OffscreenCanvas, iframe and DOM | `alpha:false` on the avatar canvas removes one blend |

---

## 5. Architecture for tier A/B

### 5.1 Threads and data flow

```
<audio srcObject=remote>  ← playback = AEC reference path, unchanged (sibling §6.1 rule 1)
remote MediaStream ─► MediaStreamSource ─► AudioWorklet "lipTap" (numberOfOutputs: 0; analysis only)
                                               │ port2 (transferred MessagePort; bypasses main thread)
                                               ▼
main thread ── FaceFrame intents (emote, listen, think) ──► render worker (OffscreenCanvas, three + TalkingHead avatarOnly)
     ▲                                                          │ stats every 1 s: fps, p95 frame, GPU probe
     └──────────── governor (§6.3) ◄────────────────────────────┘
```

- **Only the jaw/RMS envelope and the MFCC-class lip shapes cross from audio to render.** They travel at about 47 Hz (every 8 quanta), as `Float32Array(8)` messages: rms, 6 shape weights and the audio clock.
- The worker interpolates to its own rAF time, so lips stay slaved to the playback clock (companion-tech §13) via the stamped `currentTime`.
- **Rule conflict, made explicit:** companion-tech §13 says "nothing heavy on the audio thread". An RMS tap is 128 MACs per quantum, which is not heavy, but it *is* custom code in the render quantum.
  - The sibling chose a main-thread `AnalyserNode` to keep zero custom code there. §3.4(b) shows the cost of that: 136–303 ms lip freezes under module load.
  - **Ship the worklet tap only after E-P1 (echosim before/after plus on-device underrun counts) passes.** Until then, keep the sibling's `AnalyserNode` and relay through the main thread.
- A worklet with `numberOfOutputs: 0` must still be pulled by the audio graph. Chromium is believed to treat output-less worklets as automatically pulled **[U]**. If it does not, connect the node to a zero-gain `GainNode` into `destination`, and **re-run echosim, because that touches the output graph**.
- The MFCC classifier runs where the sibling put it, on the main thread at ≤ 30 Hz, *or* inside the worker on a 512-sample window the worklet forwards every 4th message. The worker option keeps classification off the main thread. Choose by E-P1.

### 5.2 TalkingHead in a worker: the shim

TalkingHead's `avatarOnly` mode skips its own renderer, camera, `ResizeObserver` and OrbitControls **[V, L833–869]**.
The remaining DOM touch points are:
- `new Audio()`, only if `ttsEndpoint` is set (we leave it unset),
- `initAudioGraph()` → `new AudioContext()`,
- `window.devicePixelRatio`,
- `window.innerWidth/innerHeight` in its eye-contact maths (L4085).

```js
// render-worker.js (module worker). Run TalkingHead in avatarOnly mode with our own renderer.
self.window = self; self.innerWidth = 360; self.innerHeight = 640; self.devicePixelRatio = 1;   // set from main on init/resize
class NullNode { connect() {} disconnect() {} }
self.AudioContext = class { constructor() { this.state = "running"; this.destination = new NullNode(); this.sampleRate = 48000; }
  createBufferSource() { return new NullNode(); } createGain() { return Object.assign(new NullNode(), { gain: { value: 1 } }); }
  createAnalyser() { return Object.assign(new NullNode(), { fftSize: 256 }); } createConvolver() { return new NullNode(); } close() {} };
import * as THREE from "three"; import { TalkingHead } from "./vendor/talkinghead/talkinghead.mjs";
let head, renderer, scene, camera, lip = new Float32Array(8);
onmessage = async ({ data }) => {
  if (data.init) {
    const { canvas, tier, port } = data.init;
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, stencil: false, powerPreference: "low-power" });
    renderer.setPixelRatio(tier.pixelRatio); renderer.setSize(tier.cssW, tier.cssH, false);
    scene = new THREE.Scene(); scene.background = new THREE.Color(tier.bg);
    camera = new THREE.PerspectiveCamera(12, tier.cssW / tier.cssH, 0.1, 20);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x886655, 1.6)); const d = new THREE.DirectionalLight(0xffffff, 1.4); d.position.set(0.5, 1, 1.5); scene.add(d);
    head = new TalkingHead(null, { avatarOnly: true, avatarOnlyScene: scene, avatarOnlyCamera: camera, modelFPS: tier.fps, lipsyncModules: [] });
    await head.showAvatar({ url: tier.glbUrl, body: tier.body, avatarMood: "neutral" });
    await renderer.compileAsync(scene, camera);                       // precompile before the first word (§3.4: 0.5–1.8 s at 4×)
    port.onmessage = (m) => { lip = m.data; };                          // worklet → worker, no main-thread hop
    loop(performance.now());
  }
  if (data.face) applyFaceFrame(head, data.face);                       // FaceFrame intents from the Director (sibling §5.1)
  if (data.tier) retier(data.tier);                                     // governor: fps cap, pixelRatio, or "stop"
};
let last = 0, frameMs = 1000 / 30; const stats = [];
function loop(now) {
  self.requestAnimationFrame(loop);
  if (now - last < frameMs - 2) return;
  const s = performance.now(); const dt = now - last; last = now;
  driveLips(head, lip, dt);                                             // jaw = RMS, shapes = classifier (sibling §6.2 maths)
  head.animate(dt);                                                     // avatarOnly: TalkingHead takes a delta
  renderer.render(scene, camera);
  stats.push(performance.now() - s); if (stats.length >= 30) { postMessage({ stats: stats.splice(0) }); }
}
```

- The constructor signature `new TalkingHead(node, opt)` and `animate(dt)` in avatarOnly mode are from source **[V, L128, L2401–2416]**.
- Whether `showAvatar` and `lookAtCamera` touch any other DOM API in our pinned commit must be checked when vendoring. A grep for `document.` and `window.` turns up only the lines above **[V]**.
- `applyFaceFrame`, `driveLips` and `retier` are ours (sibling §5.3 and §6.2; §6.3 here).

### 5.3 Sharing the GPU with modules

- **Module in focus** (full-screen sim or game):
  - shrink the avatar to a **picture-in-picture bust of ≤ 160×160 CSS px at 20 fps** (≈ 0.03 Mpx), or
  - switch to tier C if the module itself uses WebGL and the probe class is B-lite or lower.
  - The voice continues either way. The avatar must never compete with the thing the child is manipulating.
- **Context loss:**
  - `webglcontextlost` → show the tier-D portrait at once.
  - Then `webglcontextrestored` → reload from the cached GLB `ArrayBuffer` (keep it, ≤ 1.5 MB), or stay on D if it happens twice in a session.
- **Visibility:**
  - `document.visibilitychange` → stop the worker's loop.
  - Native `onPause` → the same, plus `setRendererPriorityPolicy(RENDERER_PRIORITY_BOUND, true)`.

---

## 6. Device-tier detection

### 6.1 Stage 1: static facts (native plugin plus WebGL, < 50 ms, before any 3D download)

```kotlin
// android/app/src/main/java/in/taxila/DeviceTierPlugin.kt  (Capacitor 6/7)
@CapacitorPlugin(name = "DeviceTier")
class DeviceTierPlugin : Plugin() {
  private val pm by lazy { context.getSystemService(Context.POWER_SERVICE) as PowerManager }
  @PluginMethod fun facts(call: PluginCall) {
    val am = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    val mi = ActivityManager.MemoryInfo().also { am.getMemoryInfo(it) }
    val wv = WebViewCompat.getCurrentWebViewPackage(context)
    val dm = context.resources.displayMetrics
    val refresh = (context.getSystemService(Context.DISPLAY_SERVICE) as DisplayManager).getDisplay(0).refreshRate
    call.resolve(JSObject().apply {
      put("totalMemMB", mi.totalMem / 1048576); put("lowRam", am.isLowRamDevice); put("memClassMB", am.memoryClass)
      put("sdk", Build.VERSION.SDK_INT); put("socModel", if (Build.VERSION.SDK_INT >= 31) Build.SOC_MODEL else Build.HARDWARE)
      put("mpc", if (Build.VERSION.SDK_INT >= 31) Build.VERSION.MEDIA_PERFORMANCE_CLASS else 0)
      put("webview", wv?.versionName ?: ""); put("powerSave", pm.isPowerSaveMode)
      put("thermalHeadroom", if (Build.VERSION.SDK_INT >= 30) pm.getThermalHeadroom(10).toDouble() else -1.0)
      put("screenPx", dm.widthPixels * dm.heightPixels); put("refreshHz", refresh.toDouble())
    })
  }
  // Thermal + battery push (§7). Headroom is rate-limited: once per 10 s or it returns NaN [V].
  private val handler = Handler(Looper.getMainLooper())
  private val tick = object : Runnable { override fun run() {
    val bat = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
    notifyListeners("thermal", JSObject().apply {
      put("headroom", if (Build.VERSION.SDK_INT >= 30) pm.getThermalHeadroom(10).toDouble() else -1.0)
      put("status", if (Build.VERSION.SDK_INT >= 29) pm.currentThermalStatus else -1)
      put("batteryTempC", (bat?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, -1) ?: -1) / 10.0)
      put("batteryPct", bat?.let { it.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) * 100 / it.getIntExtra(BatteryManager.EXTRA_SCALE, 100) } ?: -1)
      put("charging", (bat?.getIntExtra(BatteryManager.EXTRA_PLUGGED, 0) ?: 0) != 0)
      put("currentNowUA", (context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager).getLongProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW))
      put("powerSave", pm.isPowerSaveMode)
    }); handler.postDelayed(this, 10_000) } }
  @PluginMethod fun startThermal(call: PluginCall) { handler.post(tick); call.resolve() }
  @PluginMethod fun stopThermal(call: PluginCall) { handler.removeCallbacks(tick); call.resolve() }
}
```

```ts
// tier.ts: stage 1 (static). On the web build, DeviceTier is absent, so fall back to WebGL facts only.
export type Tier = "A" | "B" | "Blite" | "C" | "D" | "E";
const GPU_CLASS: [RegExp, Tier][] = [                 // seeded from §1; extend from field telemetry
  [/adreno \(tm\) (6[4-9]\d|7\d\d|8\d\d)|mali-g(68|7\d|6[1-9]\d)|immortalis|xclipse/i, "A"],
  [/adreno \(tm\) (61[0-9]|62\d)|mali-g(52 mc2|57|5[4-9])/i, "B"],
  [/powervr.*ge83|mali-g52(?! mc2)|mali-g51|adreno \(tm\) 50\d/i, "Blite"],
  [/powervr.*ge8[01]|mali-t|adreno \(tm\) [34]\d\d/i, "C"],
];
export async function staticTier(native?: any): Promise<{ tier: Tier; why: string[]; gpu: string; etc: boolean; astc: boolean }> {
  const why: string[] = []; const c = document.createElement("canvas");
  const gl = c.getContext("webgl2", { antialias: false, powerPreference: "low-power", failIfMajorPerformanceCaveat: true }) as WebGL2RenderingContext | null;
  if (!gl) return { tier: "D", why: ["no-webgl2-or-major-caveat"], gpu: "", etc: false, astc: false };
  const dbg = gl.getExtension("WEBGL_debug_renderer_info");
  const gpu = String(gl.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
  const etc = !!gl.getExtension("WEBGL_compressed_texture_etc"), astc = !!gl.getExtension("WEBGL_compressed_texture_astc");
  const vtex = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) as number;   // morph textures need ≥ 1
  gl.getExtension("WEBGL_lose_context")?.loseContext();
  let tier: Tier = GPU_CLASS.find(([re]) => re.test(gpu))?.[1] ?? "C"; why.push(`gpu:${gpu}→${tier}`);  // unknown GPU → C until probed
  if (!vtex) { tier = "C"; why.push("no-vertex-textures"); }
  if (!etc && !astc) { why.push("no-etc/astc→webp-fallback"); }
  const f = native ? await native.facts() : null;
  if (f) {
    if (f.totalMemMB < 3300 || f.lowRam) { tier = worse(tier, "Blite"); why.push(`ram:${f.totalMemMB}`); }
    if (f.totalMemMB < 2300) { tier = worse(tier, "C"); }
    if (f.mpc >= 33 && f.totalMemMB >= 5500) { tier = better(tier, "A"); why.push(`mpc:${f.mpc}`); }
    if (f.powerSave) { tier = worse(tier, step(tier)); why.push("power-save"); }
  }
  return { tier, why, gpu, etc, astc };
}
const ORDER: Tier[] = ["A", "B", "Blite", "C", "D", "E"];
const worse = (a: Tier, b: Tier) => (ORDER.indexOf(a) >= ORDER.indexOf(b) ? a : b);
const better = (a: Tier, b: Tier) => (ORDER.indexOf(a) <= ORDER.indexOf(b) ? a : b);
const step = (t: Tier) => ORDER[Math.min(ORDER.length - 1, ORDER.indexOf(t) + 1)];
```

- `failIfMajorPerformanceCaveat: true` rejects software rendering (SwiftShader). On a phone that only happens when the driver is blocklisted, and the right answer then is tier D.
- The renderer strings follow Chrome's ANGLE-less Android form: "Adreno (TM) 610", "Mali-G52 MC2", "PowerVR Rogue GE8320" **[U: confirm on the 3 lab phones]**.
- **Do not trust the regex table alone.** It only picks the *starting* tier for stage 2.

### 6.2 Stage 2: the probe (2 s, on the tutor-picker screen, cached)

The picker already shows the tutor, so show the **real tier-B GLB of the default tutor** in the worker. Run 60 frames and
measure:
1. `work` p50/p90: JS time per frame, from the worker stats.
2. **GPU time:** `EXT_disjoint_timer_query_webgl2` where it exists. It is often absent or disabled on Android **[U]**.
   Otherwise time 10 frames bracketed by `gl.finish()`. The probe is the only place `finish()` is allowed.
3. rAF interval p90 at the 30 fps cap.

| result | decision |
|---|---|
| GPU ≤ 6 ms **and** work p90 ≤ 8 ms **and** interval p90 ≤ 40 ms | keep B; if all three are at most half, try A next session |
| GPU ≤ 10 ms, work p90 ≤ 12 ms | B-lite (DPR 1.0, 24 fps, 28 morphs: the same GLB with targets disabled at runtime) |
| worse, or context creation fails in the worker | C |

- Cache `{tier, probe}` in Capacitor `Preferences`, keyed by `socModel + webview major + app avatar-pipeline rev`.
- Re-probe when the key changes or after 3 governor demotions in one week.
- Telemetry: send `{socModel, gpu, tier, probe, demotions}` (no PII) so the regex table can be replaced by observed data.

### 6.3 Stage 3: runtime governor (every 1 s; hysteresis)

```ts
// governor.ts: step down fast, step up slow, never mid-utterance.
type Sig = { fpsP50: number; long50: number; workP95: number; concealPct: number; thermal: number; headroom: number; powerSave: boolean; batteryPct: number; charging: boolean };
export function govern(cur: Tier, s: Sig, hist: { badSince?: number; goodSince?: number; lastChange: number }, now: number, speaking: boolean): Tier {
  const hard = s.thermal >= 3 /*SEVERE*/ || (s.batteryPct >= 0 && s.batteryPct < 10 && !s.charging);
  if (hard) return s.thermal >= 4 ? "E" : worse(cur, "D");                    // immediate: thermal SEVERE→D, CRITICAL→E
  const bad = s.fpsP50 < 24 || s.long50 > 4 || s.concealPct > 1.0 || s.thermal === 2 /*MODERATE*/ || s.headroom > 0.85 || s.powerSave;
  const good = s.fpsP50 >= 29 && s.long50 === 0 && s.concealPct < 0.2 && s.thermal <= 1 && (s.headroom < 0 || s.headroom < 0.6) && !s.powerSave;
  if (bad) { hist.goodSince = undefined; hist.badSince ??= now; } else if (good) { hist.badSince = undefined; hist.goodSince ??= now; }
  if (speaking) return cur;                                                    // switch only in silence (crossfade 200 ms)
  if (hist.badSince && now - hist.badSince > 5_000) { hist.badSince = undefined; hist.lastChange = now; return step(cur); }
  if (hist.goodSince && now - hist.goodSince > 120_000 && now - hist.lastChange > 300_000) { hist.goodSince = undefined; hist.lastChange = now; return up(cur); }
  return cur;
}
const up = (t: Tier) => ORDER[Math.max(0, ORDER.indexOf(t) - 1)];
```

- **Before changing tier, step down within it:** fps 30 → 24 → 20, then DPR 1.25 → 1.0, then the PiP size. A tier change is the last resort.
- **`concealPct`** is the share of audio samples concealed in the last 5 s, from `pc.getStats()` → `inbound-rtp` audio:
  `Δ concealedSamples / Δ totalSamplesReceived × 100`.
  - It is the only signal that tells you the *voice* is suffering, which matters more than frames.
  - The 1% threshold is a starting value **[U: calibrate on a no-avatar baseline in E-P2]**.
- **No promotion above the probe tier within a session.** Promotion back up happens only after a demotion, and only with
  2 minutes of good signals and at least 5 minutes since the last change, so the face does not flicker between tiers.

---

## 7. Thermal throttling and battery

**What is known and what is not:**
- Low-end SoCs on 12 nm (G35/G85) and 6 nm (SD 680) have low power density, so they throttle less violently than flagships.
- They sit in plastic bodies with no vapour chamber, though, and a 45-minute lesson is sustained load.
- I have **no measured throttle curve** for these chips in a WebView **[U]**. The policy is therefore built on the OS signal, not on a guess.

| signal | source | action |
|---|---|---|
| `THERMAL_STATUS_LIGHT` (1) or headroom > 0.85 | plugin push every 10 s | fps cap −1 step (30 → 24/22.5), DPR 1.0 |
| `MODERATE` (2) or headroom > 0.95 | | one tier down at the next silence (B → B-lite → C) |
| `SEVERE` (3) | | tier D now (DOM only, no GPU) |
| `CRITICAL`+ (4+) | | tier E (voice-only); tell the Conductor, which may shorten the lesson |
| battery saver on | `isPowerSaveMode` | start one tier down; cap at 20 fps |
| battery < 15% and not charging | | tier D; < 10% → E |
| battery temperature rise > 6 °C over a session | `EXTRA_TEMPERATURE` | log only (E-P3 pass bar) |

- The headroom thresholds follow Android's ADPF guidance: "≤ 0.85: reduce workload"; "> 0.95 could indicate MODERATE" **[V]**.
- A NaN or 0 first reading means the API is unsupported. Then rely on `currentThermalStatus` plus battery temperature.

**Battery model (to be replaced by E-P3 numbers):**
- A typical ₹10k phone has a 5,000–6,000 mAh pack, ≈ 19–23 Wh **[U]**.
- A 45-minute lesson at a device draw of P watts costs `P × 0.75 / 19.3 × 100` %.
- With screen, WebRTC audio, WebView and module at ≈ 2.0–2.5 W, that is 8–10% **[U]**.
- **Budget: the avatar adds ≤ 0.4 W, or ≤ 1.6% battery per 45-minute lesson.** That is ≈ 20% of the lesson's total. Measure it by
  `currentNowUA × voltage`, with the avatar on vs tier E, on the same lesson script.
- If tier B exceeds 0.4 W on a device class, its probe threshold tightens, and the device class defaults to B-lite.

---

## 8. Fallback tiers in detail

All tiers consume the **same `FaceFrame`** (sibling §5.1: ARKit-52 weights + head pose + gaze + state). The Director,
the lip driver and the governor never know which renderer is active.

### 8.1 Tier A / B / B-lite: 3D

As above. B-lite is the B asset with morphs restricted at runtime (inactive influences cost nothing in the shader,
because the shader skips zero weights **[V, sibling §3.1]**), plus DPR 1.0 and a 24 fps cap. A separate 512² texture
download is optional.

### 8.2 Tier C: 2.5D sprite rig, pre-rendered from the 3D character

**Offline bake** (Blender, the same MPFB rig, one script per character):
- **Head angles:** 3 yaw (−12°, 0°, +12°) × 2 pitch (0°, −6°).
- **Layers per angle:**
  - face base with eyes open,
  - eye layer: open, half, closed, and look-L/R/up as UV-shifted iris sprites,
  - brow strip: neutral, up, down, inner-up,
  - **mouth atlas: 9 shapes**, on the same axes the lip driver outputs: closed/PP, slightly open, open (aa), wide (E/I), round (O), pucker (U), FF, TH/DD, smile-closed.
- **Size:** 256² mouth cells in one ETC1S or WebP atlas. Measured analogues suggest about 150–300 KB per character **[U]**.
- **Runtime:** Canvas2D in the same worker, or the DOM with CSS transforms.
  - Head yaw cross-fades between the nearest two angle plates with a ±3 px parallax on the hair layer. Brow and eye layers are offset and blended. The mouth is the nearest atlas cell for the dominant shape, opened by the jaw value through a vertical scale of 0.9–1.15.
  - Cost: 4–6 `drawImage` calls per frame at 0.1 Mpx, which is negligible on any GPU **[U]**.
- **Why not Rive here:**
  - The runtime is 368–821 KB gz [M].
  - It needs a separate hand-authored character per tutor.
  - It would not look like the same person as the 3D tutor.
  - Rive stays the alternative if the art direction moves to 2D for every tier (sibling §10 reverse condition).

### 8.3 Tier D: static portrait + animated mouth

- **Assets:** one WebP portrait (≈ 40–60 KB), a 5-cell mouth strip (closed, small, open, round, wide) of ≈ 15 KB, and a blink overlay.
- **Runtime:** DOM only. The mouth is a background-position swap driven by the jaw value with hysteresis, so it does not chatter; blinks every 2–6 s; a 2% breathing scale on the plate.
- **Data:** the lip tap feeds it on the main thread at ≤ 20 Hz (no GPU, no worker needed).
- Use D for: no WebGL2, context loss, thermal SEVERE, battery < 15%.

### 8.4 Tier E: voice-only

The avatar is hidden and an audio-reactive ring follows RMS. Use it for thermal CRITICAL or battery < 10%, or when the
child or parent opts in for "data saver / quiet screen".

### 8.5 Transitions

- Switch only while neither side is speaking (`output_audio_buffer.stopped` and no `speech_started`), with a 200 ms crossfade.
- Pre-load the next-lower tier's assets once the session starts, so a demotion never waits on the network: C ≈ 0.3 MB, D ≈ 75 KB.
- Never auto-promote within a session (§6.3).

---

## 9. Asset pipeline (implementable, pure npm, no `toktx` binary)

```js
// tools/build-tutor.mjs: one source character GLB → tier A/B/B-lite GLBs (+ C/D sprite bake runs in Blender separately)
import { NodeIO } from "@gltf-transform/core"; import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, dedup, textureCompress, reorder, quantize, meshopt } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer"; import sharp from "sharp"; import { ktx2 } from "ktx2-encoder/gltf-transform";
// keepTargets(doc, keep, dropNormals) and the T2/T2-lite target lists: bench/perf/pipeline.mjs (measured in §3.3)
await doc.transform(prune(), dedup(),
  textureCompress({ encoder: sharp, targetFormat: "png", resize: [1024, 1024] }),
  ktx2({ isUASTC: false, qualityLevel: 128, generateMipmap: true, isPerceptual: true, isSetKTX2SRGBTransferFunc: true, slots: /^(baseColor|emissive)/, imageDecoder }),
  reorder({ encoder: MeshoptEncoder }), quantize(), meshopt({ encoder: MeshoptEncoder, level: "high" }));
```

CI gates on every character build. Fail the build when any is exceeded:
- tris in view ≤ the tier budget,
- draw calls (primitives) ≤ the budget,
- morph targets ≤ 52 (B) or 28 (B-lite),
- morph-normal attributes = 0 for B,
- resident estimate ≤ 20 MB (B),
- GLB ≤ 1.5 MB (B),
- every texture is KTX2 except the D/E plates.

The `glbstat.mjs` (sibling) and `pipeline.mjs` (here) maths already compute all of these.

---

## 10. Device lab and experiments (with pass bars)

Phones: one each of a Helio G35, a Helio G85 (or G88) and an SD 662/680, plus one Mali-G57 MC2 phone as the tier-A boundary.

| id | experiment | pass bar | cost |
|---|---|---|---|
| **E-P1** | Worklet RMS tap vs `AnalyserNode` relay. echosim before/after; 45-min call; count audio underruns (`concealedSamples`) and glitches heard | echosim tables unchanged; concealment Δ ≤ 0.1 pp vs no-avatar baseline | 1 day |
| **E-P2** | Main-thread vs OffscreenCanvas-worker rendering in the real APK, with a real module (a canvas physics sim) busy 30–50 ms per 100 ms | worker arm: frames > 50 ms ≤ 2 per 10 s; lip gap p99 ≤ 45 ms; voice concealment ≤ baseline + 0.2 pp | 1 day |
| **E-P3** | 45-min scripted lesson per tier per phone: rAF intervals, worker work, `currentNowUA`, battery and thermal status every 10 s; a 3 GB phone with 5 background apps | B: p50 ≥ 28 fps, p95 frame ≤ 50 ms; avatar ≤ 0.4 W above tier E; no renderer kill; battery temperature +≤ 6 °C | 2 days |
| **E-P4** | Blind A/B, 10 children + 5 parents: B with morph normals vs without; B vs C (sprite) on the same tutor | "no normals" not worse than parity; C acceptable (≥ 40% prefer or no difference) for the fallback | 1 day |
| **E-P5** | Confirm renderer strings, `WEBGL_compressed_texture_etc/astc`, `MAX_VERTEX_TEXTURE_IMAGE_UNITS`, `EXT_disjoint_timer_query_webgl2` and OffscreenCanvas WebGL in a worker on all 4 phones | facts recorded; regex table corrected | ½ day |
| **E-P6** | Probe validity: probe tier vs E-P3 tier | probe never assigns a tier that fails E-P3 | ½ day |
| **E-P7** | Shader compile: `compileAsync` on the picker vs first-word compile | first spoken frame stall ≤ 50 ms | ½ day |

---

## 11. Candidate `context/` entries

**Candidate `context/rejected.md` entries:**
- **`draco-for-face-avatars`**:
  - **Tried:** KHR_draco_mesh_compression on 5 face avatars.
  - **Broke:** files stayed 89–96% of raw, because Draco leaves morph targets uncompressed, and morphs are 80–91% of the geometry. Decode was 2–5× slower than meshopt (while decoding less), and the decoder is 15× larger **[M]**.
  - **Reverse if:** a Draco version compresses morph targets *and* beats meshopt decode time on device.
- **`webp-textures-for-gpu`** (preventive): WebP saves wire bytes but lands as RGBA8, 4–8× the GPU memory of ETC1S, with a 6–10× slower decode than the ETC1S transcode **[M]**.
- **`webgpu-in-the-apk`** (preventive): Android WebView has no WebGPU milestone **[V]**.
  - **Reverse if:** chromestatus lists a WebView milestone *and* a WebView build on the lab phones exposes `navigator.gpu`.
- **`avatar-on-the-main-thread-with-modules`** (pending E-P2): WebView has no OOPIF, and a 50%-busy module iframe freezes the main-thread lip path for 136–303 ms **[M, desktop proxy]**.
- **`hardwareConcurrency-deviceMemory-tiering`** (preventive): both return the same values across a 4× GPU spread.

**Candidate `context/measurements.md` rows:** §3.1–§3.5, each with its n, method and the date (2026-10-02).

**Candidate `context/decisions.md` entries:**
1. WebGL2 only, with three.js + TalkingHead in `avatarOnly` mode inside an OffscreenCanvas worker.
2. Meshopt + KTX2 ETC1S.
3. Tier-B budget (§4.1, §4.2).
4. Five tiers sharing one `FaceFrame`, with C pre-rendered from the 3D rig.
5. A three-stage tier detection.

- **Reverse 1** if E-P2 shows no benefit from the worker on device.
- **Reverse 3** if E-P3 fails on the G85 (then tighten the budget) or passes with more than 2× headroom (then loosen it).

---

## Sources

- Chrome blog, "What's New in WebGPU (Chrome 121)": WebGPU on Android 12+ with Qualcomm/ARM GPUs. https://developer.chrome.com/blog/new-in-webgpu-121
- gpuweb wiki, Implementation Status: Android ARM/Qualcomm/Intel Android 12+ (121), Imagination Android 16+ (139), Samsung Xclipse ~154. https://github.com/gpuweb/gpuweb/wiki/Implementation-Status
- chromestatus WebGPU feature JSON (no WebView milestone). https://chromestatus.com/api/v0/features/6213121689518080
- caniuse WebGPU (Android WebView 154: not supported). https://caniuse.com/webgpu
- caniuse OffscreenCanvas (Chrome Android and Android WebView 154 supported). https://caniuse.com/offscreencanvas
- web3dsurvey WebGPU (74.31% of Android visitors, browser not broken down). https://web3dsurvey.com/webgpu
- Chrome WebGPU troubleshooting (Chrome 121+ on Android; `requestAdapter` null cases). https://developer.chrome.com/docs/web-platform/webgpu/troubleshooting-tips
- Chromium Site Isolation: "not yet supported in Android WebView". https://www.chromium.org/Home/chromium-security/site-isolation/
- Android, Managing WebView objects (renderer termination, `setRendererPriorityPolicy`). https://developer.android.com/develop/ui/views/layout/webapps/managing-webview
- Android ADPF Thermal API (headroom semantics, 10 s rate limit, NaN). https://developer.android.com/games/optimize/adpf/thermal
- MDN `navigator.deviceMemory` (power-of-two, clamped). https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory
- pmndrs/detect-gpu 5.0.70 (MIT): tiers, and the GFXBench-derived benchmark tables in `dist/benchmarks/m-*.json`, read locally. https://github.com/pmndrs/detect-gpu
- meshoptimizer README (decoder 3–6 GB/s desktop; EXT/KHR_meshopt_compression). https://github.com/zeux/meshoptimizer
- three.js r180 source: `src/renderers/webgl/WebGLMorphtargets.js` (morph texture layout; normals optional), `examples/jsm/loaders/KTX2Loader.js` (format priorities), `examples/jsm/libs/basis/`, `libs/draco/`, `libs/meshopt_decoder.module.js` (sizes). https://github.com/mrdoob/three.js
- met4citizen/TalkingHead at b3e277b (2026-09-25), `modules/talkinghead.mjs`: avatarOnly path, renderer defaults, audio graph, `animate(dt)`. https://github.com/met4citizen/TalkingHead
- ktx2-encoder 0.6.0 (MIT; basis encoder wasm; gltf-transform plugin). https://github.com/gz65555/ktx2-encoder
- Rive web runtimes 2.44.0 (`@rive-app/canvas`, `@rive-app/canvas-lite`), wasm sizes measured from the npm tarballs. https://www.npmjs.com/package/@rive-app/canvas
- Sibling docs: `web-3d-talking-heads.md` (§3.1, §6, §9, three.js #29980 and #24545), `audio-to-face-ml.md` (§5.1 FaceFrame), `../tech-and-market.md` §2, `../../harvest/companion-tech.md` §13.
