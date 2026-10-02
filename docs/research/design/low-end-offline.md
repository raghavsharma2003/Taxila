# Low-end Android and patchy networks: engineering and UX rules for Taxila

**Date:** 2026-10-02 · **Scope:** the child's lesson (voice call, teacher on stage, modules), the profile picker, offline packs and the parent's data controls, on web + Android (Capacitor), shared family phones, a Helio G35 / 4 GB floor device and Indian mobile networks.
**Builds on (read first, not repeated):** `learning-science.md` (§5.5 devices; no reward economies; parent sees all), `gurukul.md` §6 (4-state status, one your-turn, 11 px floor, honest waits, copy gate), `kids-ux-ages.md` (bands, S1 picker, S5 offline card, G1-G10), `lesson-arc.md` (§3 floor model; §11 network stall at 8 s), `onboarding-flow.md` §10, `visual-identity.md` (tokens, 320 KB font budget), `avatar/web-3d-talking-heads.md` §9, `factory/game-kit-frameworks.md` §4.8, `voice/voices-hindi.md`, `context/decisions.md`.
**Evidence tags:** [V] primary source fetched this session · [M] measured this session (scripts below) · [P] measured earlier in this repo · [S] secondary · [I] inference · [U] assumption the device lab must replace.
**Method and limits.** The WebSearch budget was spent, so evidence comes from direct fetches: MediaTek, Alex Russell's 2026 budget post, Capacitor docs and Android source, Chromium's Android audio code, Android developer docs, MDN and its browser-compat-data JSON, RFC 7587, Azure and OpenAI realtime docs, web.dev, Vite. Three scripts were written and two run against Azure from the US build container:
- `low-end-cascade-probe.mjs` measures TTS bytes/kbps/first byte per format, STT latency for Opus vs WAV upload, text-model first token, and Opus re-encode sizes. Output: `low-end-cascade-probe-2026-10-02.json`, n=5 per arm (re-encode n=1 per bitrate).
- `low-end-data-budget.py` gives MB per lesson per voice rung (arithmetic on [M] and [U] inputs).
- Library sizes were measured by brotli/gzip over the jsdelivr builds.
Nothing here has run on a real phone. Every frame, memory, battery and India-latency number is a target until §14's device lab measures it.

---

## 0. The rules on one page

1. **The floor is a 2020-class phone, not the median.** Design for 8× Cortex-A53 + PowerVR GE8320 + 4 GB + eMMC (Helio G35) [V], handed down to a child. Russell's 2026 P75 device is already a Helio G99, and "no device in that part of the market has delivered meaningful CPU gains since 2020" [V].
2. **Pick a device tier once, then only step down.** Four tiers (§2) decide teacher fidelity, module renderer, DPR and frame cap. A frame-time governor downgrades mid-lesson. It never upgrades mid-lesson.
3. **The cold path is ≤ 120 KB brotli of JS.** Today's shell is 85 KB br [M]. Rive, three, Pixi, KaTeX and the game kit never load before the first teacher sound.
4. **Her first sound is local.** Every lesson opens with a pre-rendered clip from the pack within 1 s of the profile tap, while WebRTC connects across the Pacific (realtime runs only in East US 2 / Sweden Central [V]).
5. **Composite, don't paint.** UI motion uses transform and opacity only. Canvas engines draw static layers once, cap DPR at 1.5 on the floor tier, and never call `shadowBlur`, `filter` or `getImageData` per frame.
6. **The voice degrades in rungs, and every rung is still her.** L0 WebRTC → L1 WebSocket relay → L2 walkie-talkie clips → L3 text + recorded clips → L4 offline pack (§7). No rung lets a different voice impersonate the teacher.
7. **Switch rungs only at a turn boundary**, unless the link is dead. Never switch while SPEAKING. Step up at most once per 5 min, and only at a phase boundary.
8. **Background means pause.** When the app is hidden, the mic closes, the response is cancelled and lesson state stays server-side. There is no background microphone service: it is a child-safety rule as much as an engineering one.
9. **Handle the WebView dying.** Capacitor's default `onRenderProcessGone` lets the app crash [V]. Register a listener that returns `true`, rebuild the WebView and resume at the same item.
10. **The build target and the WebView floor are one number.** Vite targets `chrome111` by default [V], and Capacitor admits WebView ≥ 60 by default [V]. Set both to 111, set minSdk 29 (Chrome needs Android 10+ [V]), and show a bilingual "update Android System WebView" page below that.
11. **Packs are content-addressed, signed, ≤ 1.5 MB per chapter, and live in app-private files** (native) or Cache Storage + `persist()` (PWA). They download on Wi-Fi or at lesson end, with honest progress, never in a hidden background job the OEM will kill.
12. **Offline grading is safe because the key travels with the pack.** Taps are classified locally against the verified key (inherited law: a model never grades). Evidence is queued per child with idempotent ids and marked `offline-tap` modality.
13. **Data saver is a real mode, not a toggle in name only.** It caps the uplink at 16 kbps, re-encodes her TTS to 20 kbps Opus (70.7 → 18.5 kbps [M]), defers packs to Wi-Fi and drops video. 30 min of lesson: ~23 MB at defaults vs ~2.4 MB on L2 [I from M].
14. **One realtime session per child, torn down on every profile switch.** The session's instructions contain that child's brief, so a live call is never handed to a sibling. Per-child IndexedDB; shared, deduplicated content DB.
15. **Network trouble is an overlay outside the four states, in neutral colours.** It never uses `stop` or `turn`, never blames the child or the family's phone, and is said by a pre-rendered clip in her voice.

---

## 1. What we design for

| fact | value | tag |
|---|---|---|
| Helio G35 CPU / GPU | 8× Cortex-A53 up to 2.3 GHz; IMG PowerVR GE8320 at 680 MHz; 12 nm | [V MediaTek] |
| Helio G35 memory / storage / display | LPDDR3 or LPDDR4x, up to 4 GB / 6 GB; eMMC 5.1; up to 2400×1080 | [V MediaTek] |
| Typical G35 phones in Indian homes | 2020-21 entry phones (e.g. Redmi 9C, Realme C11), now passed to children; 720p, DPR ~2 | [U] |
| Russell 2026 P75 device | Galaxy A24 4G (Helio G99, 6 nm); the low end has been "frozen" since 2020 | [V] |
| Russell 2026 budgets, 3 s target | JS-heavy 0.62 MiB JS of 1.2 MiB total; JS-light 0.3 MiB JS of 2.0 MiB (compressed) | [V] |
| India P75 network (Russell) | 6.2 Mbps down, 2.1 Mbps up, 85 ms RTT ("among the slowest") | [V] |
| India median mobile download | ~131 Mbps (Ookla 2025): medians hide congestion, indoor coverage and data caps | [S via learning-science §5.5] |
| Phone ownership | ~90% of 14-16s have a smartphone at home; 27-38% their own (ASER 2024) | [S via learning-science §5.5] |
| Realtime model regions | global deployments in East US 2 and Sweden Central only | [V Azure WebRTC doc] |
| Realtime session cap | 60 minutes | [V OpenAI realtime docs] |
| Chrome on Android | requires Android 10 or later | [V Google Chrome help] |
| Today's measured voice gap | ~2.1-2.4 s child's last word → teacher's first sound, US container | [P `voice-turn-config`] |

**Read.** The bandwidth is mostly fine: L0 needs ~52 kbps each way and India P75 offers 2.1 Mbps up. "Patchy" means **drops, loss bursts, evening congestion and daily data caps**, plus a 200-300 ms floor to eastus2 [U]. The CPU is the hard limit: an all-A53 phone is the device where JS parse, GC pauses and canvas fill rate show [I].

---

## 2. Device tiers

| tier | detected as | teacher | modules | DPR cap | frame caps |
|---|---|---|---|---|---|
| **A** | ≥ 6 GB and big cores (A76 class or newer) | 3D TalkingHead (avatar §10) | everything; kit games 60 fps | 2 | teacher 30, UI 60 |
| **B** | 4-6 GB with some big cores (Helio G85/G88/G99, Unisoc T606/T7250 [U]) | 2D Rive | T1 engines 60; kit games 30-60 | 2 | teacher 30 |
| **C (floor)** | little cores only (A53/A55: Helio G35/G36/G25) or 3-4 GB, or microbench below the line | **flipbook**: WebP sprite sheet (idle / listen / think / speak + 5 mouth shapes) driven by the RMS jaw value | T1 Canvas2D/SVG at 60; kit games 30 fps cap, heavy archetypes swapped for the T1 engine | 1.5 | teacher 30 (24 when hot) |
| **D (lite)** | ≤ 2 GB, Android Go (`isLowRamDevice`), or thermal SEVERE | static portrait + 2-frame mouth | T1 engines only; no video | 1.25 | teacher 15 |

- **Detection order:** native plugin `DeviceTier` (Capacitor) reads `ActivityManager.MemoryInfo.totalMem`, `isLowRamDevice()`, `Build.SOC_MODEL` (API 31+) and per-core `cpuinfo_max_freq` [I]. Web reads `navigator.deviceMemory`, which from Chrome 147 on Android reports 1, 2, 4 or 8 [V BCD]. `hardwareConcurrency` is useless here: a G35 reports 8 [I]. Then a ≤ 300 ms microbench (JS integer loop + 200 sprite draws at DPR 1.5 × 20 frames) breaks ties.
- **Persist** the tier per install. It is a capability of the hardware, not an identity, so it never keys any child data (inherited law).
- **`FrameGovernor`:** if rAF p90 > 25 ms for 3 s inside a module, step that lesson down one visual level (60 → 30 fps, then DPR 1.5 → 1.25, then teacher flipbook → static). Log the step. Never step up until the next lesson.
- **Why a flipbook on the floor:** Rive costs 88 KB br of JS + 285 KB br of WASM (canvas-lite 2.44.0) [M], plus a WASM compile on A53 cores [U]. A sprite sheet in a CSS-transformed `<img>` costs near-zero JS and composites on the GPU. The four-state poses are the same on every tier, so the meaning never changes with fidelity (kids-ux §4.3) [I].

---

## 3. Performance budgets

| budget | value | today | enforced by |
|---|---|---|---|
| cold-path JS (boot → picker) | ≤ 120 KB brotli | 85.4 KB (main 26.3 + jsx-runtime chunk 59.0) [M, `dist/` 2026-10-02] | G-LE-1 |
| lesson route JS (stage, VoiceLink, status, flipbook, ModuleHost) | ≤ +150 KB br, lazy | 11.2 KB (`LessonDev`) [M] | G-LE-1 |
| one T1 engine | ≤ 30 KB br, lazy in the frame | 2.9 KB (`fractionBars`) [M] | G-LE-1 |
| game kit runtime | ≤ 340 KB gz, precached, never on the cold path | kit §4.8 [P] | kit CI |
| optional runtimes (never cold path) | Rive lite 88 + 285 WASM; three core+module 159; Pixi 8 189; KaTeX 63; lottie_light 40; Preact 4.4 KB br [M] | | review |
| fonts | ≤ 320 KB (bundled in APK) | 317 KB [P visual-identity] | G-VI-4 |
| PWA first visit to the picker | ≤ 600 KB br total, ≤ 6 requests on the critical path | | G-LE-1 |
| cold start, icon → picker usable | tier C ≤ 2.5 s p50, tier B ≤ 1.5 s | not measured | M-LE-1 |
| profile tap → first teacher sound | ≤ 1.0 s (local clip) | | M-LE-1 |
| profile tap → live voice joined (India) | ≤ 4 s p50 tier C | not measured | M-LE-1, M-LE-4 |
| main thread while LISTENING/SPEAKING | no task > 50 ms; ≤ 10 ms JS per animation frame ("all of your work needs to be completed inside 10 milliseconds" [V web.dev]) | | M-LE-2 trace |
| frames | UI 60 compositor-only; T1 canvas p50 60 fps, p95 ≤ 20 ms at DPR 1.5 on tier C; kit 30 on tier C | | G9, M-LE-2 |
| memory, tier C | app PSS ≤ 350 MB; JS heap ≤ 120 MB; decoded images ≤ 48 MB; GPU textures ≤ 64 MB; heap growth ≤ 10% over 45 min [U] | | M-LE-2 |
| battery / heat, tier C | ≤ 8% per 30 min; ≤ 6 °C rise over 45 min (avatar §9 bar) [U] | | M-LE-2 |
| APK download | ≤ 15 MB [U] | | release gate |
| data per 30-min lesson | ≤ 12 MB default; ≤ 3 MB in data saver [I] | §7.5 | M-LE-3 |
| content packs on device | ≤ min(150 MB, 5% of free space); no prefetch below 500 MB free | | PackStore |

**Rules behind the numbers.**
- Budgets are brotli bytes for transfer and *parse* cost for the APK. The APK loads from local storage, so transfer is free but parse, compile and execution on A53 cores are not [I].
- `framer-motion` is a dependency. It must not enter the cold-path chunk. UI motion tokens are CSS transitions; springs only where interruptibility matters (drag snap) [I].
- No layout thrash in the lesson: the stage is a fixed grid with absolutely positioned layers, so status changes are class swaps that composite [I].

---

## 4. 60 fps canvas on a PowerVR GE8320

The frame is 16.66 ms and the realistic work budget is 10 ms [V web.dev]. On A53 cores that is little JS. The GPU is a single small cluster where fill rate and readbacks hurt [U].

1. **Choose the cheapest renderer that fits.** ≤ ~30 moving objects: DOM/SVG + `transform`/`opacity` (compositor only). More, or particles: Canvas2D. WebGL (Phaser kit, three): tier ≥ B, or tier C at a 30 fps cap.
2. **Layers.** Draw static scenery once (an `<img>` or a separate canvas). The animated canvas covers only the moving region. Redraw dirty rectangles, not the full canvas.
3. **Backing store.** `canvas.width = cssWidth × min(devicePixelRatio, tierCap)`. On a 720×1600 DPR-2 phone, a full-screen canvas at DPR 2 is 4.6 MB per buffer; at 1.5 it is 2.6 MB [I].
4. **Banned in a render loop** (G-LE-10 static check): `shadowBlur`, `ctx.filter`, `getImageData`/`toDataURL` (GPU readback), `fillText` of static labels (pre-render to an `ImageBitmap` once), `new Path2D` for static shapes (cache them), per-frame allocation (GC pauses on little cores).
5. **Images.** WebP ≤ 1024 px; decode off the main thread with `createImageBitmap(blob, {resizeWidth})` at display size; atlas sprites; `bitmap.close()` on unmount.
6. **Simulation in a worker.** Physics and particle engines step in a Worker that owns an `OffscreenCanvas` (Chrome 69 [V]). The G35's eight slow cores make a worker real parallelism. The main thread keeps input, the status ring and lip-sync [I].
7. **Fixed timestep, governed render.** Simulate at 60 Hz and render with interpolation. If p90 > 20 ms over 2 s, render every other rAF: a steady 30 beats a jittery 45-60 [I].
8. **Input.** Pointer Events, `touch-action: none` on the canvas, `getCoalescedEvents()` for drags. Pointer-down feedback goes on a DOM layer within 100 ms (`motion.press`), never waiting for a canvas redraw.
9. **Stop drawing when unseen:** `document.hidden`, the module scrolled or collapsed out of view, or the stage in a non-module phase.
10. **One module frame, pre-mounted and reused** (`reset`, not destroy/create; lesson-arc pre-mounts during P2 [P]). A new iframe per module costs a document and a JS realm each time [I].
11. **Audio stays off the main-thread budget.** WebRTC playout runs on Chromium's audio threads [I]. The lip-sync tap is ≈ 0.1-0.5 ms per 30 fps frame [P avatar §9]. Any AudioWorklet is allocation-free.

---

## 5. WebView and Capacitor pitfalls

| # | pitfall | evidence | rule |
|---|---|---|---|
| W1 | Renderer killed for memory → **app crash** | Capacitor's `onRenderProcessGone` returns the listeners' result, default `false` [V source]; Android: return `true`, destroy the WebView, recreate; `didCrash()==false` means "killed because the system ran out of memory" [V] | `RendererRecovery` listener returns `true`, rebuilds, reloads the route, resumes at the same item from server state; counts incidents (crash-free ≥ 99.5%, india-incumbents) |
| W2 | Old WebView renders a blank page | `minWebViewVersion` default 60 [V]; Vite default target `chrome111` [V]; this repo sets `es2022` [M repo] | build target `chrome111`; `android.minWebViewVersion: 111`; `server.errorPath` → bilingual offline page with a Play link to "Android System WebView" (S-LE7); gate G-LE-2 |
| W3 | Android 8/9 WebViews are frozen | Chrome requires Android 10+ [V]; Capacitor 8 minSdk 24 [V] | `minSdkVersion 29` [I]; reverse per §15 |
| W4 | Changing the local origin wipes data | `androidScheme` default `https` [V]; origin = scheme + host [I] | pin `androidScheme`/`hostname` forever (G-LE-3); packs in native files, not only in origin storage |
| W5 | Edge-to-edge hides the your-turn button under the gesture bar | Capacitor 8 removed `adjustMarginsForEdgeToEdge` in favour of CSS `env()` + SystemBars [V]; target/compile SDK 36 [V source] | stage grid pads with `env(safe-area-inset-*)`; screenshot test at 3 navigation modes |
| W6 | Mic permission has two layers | Capacitor's `onPermissionRequest` maps WebView `AUDIO_CAPTURE` to `RECORD_AUDIO` + `MODIFY_AUDIO_SETTINGS` [V source] | ask with a why-line (onboarding); on permanent denial, deep-link to app settings and run the lesson in L3 meanwhile |
| W7 | Clips need a gesture on the web, not in the APK | Capacitor sets `setMediaPlaybackRequiresUserGesture(false)` [V source] | APK: clips play freely. Web/PWA: the profile tap unlocks one shared `AudioContext` and primes the `<audio>` element |
| W8 | Process death while the parent takes a call | [I] | write {lesson, phase, item, rung} to IndexedDB at every item boundary; on restore show S-LE10 (resume card) |
| W9 | Screen sleeps mid-lesson | Wake Lock: Chrome 84, BCD marks WebView as mirroring [V]; released when the document is inactive [V MDN] | acquire at lesson start, re-acquire on `visibilitychange`; native `FLAG_KEEP_SCREEN_ON` fallback via plugin (M-LE-12) |
| W10 | Background freezer and OEM killers | Xiaomi, OnePlus, Samsung, Oppo among the worst offenders [V dontkillmyapp]; microphone FGS cannot start from background [V] | rule 8: pause on hide; downloads run in the foreground at lesson end; WorkManager only as an opportunistic extra (unmetered + charging) |
| W11 | Background Fetch is missing in WebView | `BackgroundFetchManager`: WebView `false` [V BCD] | never depend on it |
| W12 | Debug builds leak | `webContentsDebuggingEnabled` default false [V] | on only in internal builds; the device lab uses it for traces |
| W13 | Service worker inside Capacitor | `resolveServiceWorkerRequests` default true [V]; kit M-K5 open [P] | no SW in the native build (assets are local); Forge kit games are downloaded into app files and served by Capacitor's local server |

---

## 6. Audio route and audio focus

- **Route choice is Chromium's, not ours.** In communication mode the default device is "wired headset first, then USB audio device, then Bluetooth and last the speaker phone" [V Chromium `CommunicationDeviceSelector`]. Chromium's `AudioManagerAndroid` switches the phone to `MODE_IN_COMMUNICATION` for call audio and restores the saved speakerphone state afterwards [V source]; when exactly it engages inside a WebView is [U] (M-LE-7).
- **Bluetooth needs a scary permission.** On Android 12+ Chromium logs "BLUETOOTH_CONNECT permission is missing" and cannot see Bluetooth devices without it [V source]. The "Nearby devices" prompt frightens parents [I]. Rule: request it only when the native `AudioRoute` plugin sees a connected BT headset, with a why-line. Otherwise use the speaker or wired earphones.
- **Bluetooth costs quality and time.** With the mic open, a BT headset drops to the hands-free profile (SCO) [I], and cheap earbuds add latency that pushes lip-sync and barge-in late [U]. Measure (M-LE-7). Until then, lip-sync lead/lag is retuned when the route is BT.
- **Two volumes.** During the call, her voice plays on the call stream; pre-call clips play on the media stream [I]. "I can't hear her" then means a volume at 0 on the other stream. Rule: do the hearing check *after* the mic opens, through the call path. Show a big volume picture (no numbers) when `AudioRoute` reports call volume < 30% [I].
- **Echo on loudspeakers.** If AEC fails, her own voice re-enters the mic, server VAD fires and she interrupts herself [I]. `EchoGuard` flags a barge-in as echo when the child transcript overlaps her last 3 s of speech by ≥ 60% of tokens. After 2 echo flags in a lesson: half-duplex for the rest of it (`interrupt_response: false` while she speaks; Young → tap-to-talk). Port Meera's echosim floor before touching the audio path (inherited law).
- **Incoming phone call.** The WebView gives JS no event [I]. `AudioRoute` holds audio focus with `USAGE_VOICE_COMMUNICATION` + `CONTENT_TYPE_SPEECH`; speech content is not auto-ducked [V Android audio focus]. On `AUDIOFOCUS_LOSS_TRANSIENT` it pauses the lesson (S-LE10 on return). This needs no `READ_PHONE_STATE` permission [I].
- **Sample rate.** Let `AudioContext` pick the device's native rate. Forcing 24 kHz costs resampling on A53 cores. Resample only on the relay path (§7.3) [I].
- **Loudness.** Pack clips are normalised to the live voice's measured loudness, so the clip-to-live handover does not jump in volume [I]. voices-hindi already logs raw LUFS per lane [P].

---

## 7. Voice call degradation ladder

### 7.1 Rungs (each is a `TeacherLink` implementation; `src/lesson/link.ts` already has VoiceLink and TextLink [M repo])

| rung | transport | who hears the child | her voice | child input | when |
|---|---|---|---|---|---|
| **L0 live** | WebRTC direct to Azure realtime (`VoiceLink`) | gpt-realtime-2.1 | realtime voice | open mic + server VAD (or tap-to-talk) | default |
| **L0-T tap-to-talk** | same session, `turn_detection: null`; `input_audio_buffer.clear` on press, `commit` + `response.create` on release [V OpenAI] | same | same | Young: tap to start / tap or 1.5 s local silence to stop (long-press is banned in Young, kids-ux row 6). Older: hold or tap | Class 1-2 default pending M-UX-3; noisy room; 2 echo flags |
| **L1 relay** | WebSocket (TCP 443) to `taxila-web`, which holds the realtime session over WS in the same region | same model | **same voice** | streamed Opus 16 kbps up; server decodes to PCM16 for `input_audio_buffer.append` | UDP blocked, or L0 red |
| **L2 walkie-talkie** | whole utterance recorded locally (Opus 16 kbps), uploaded, appended to the same realtime session | same model | same voice, 20 kbps Opus down | tap/hold to talk; upload retries | L1 red, or link < ~60 kbps sustained |
| **L2-C cascade** | STT → Director/compile → text model → TTS | gpt-4o-transcribe | gpt-4o-mini-tts `marin` **only if** the blind ABX says it is the same person (M-LE-10) | as L2 | realtime unavailable (10 RPM quota [P], outage) |
| **L3 text + clips** | `TextLink`, ~2 KB per turn [U] | Director (typed/tapped) | recorded clips from the pack; her words on the board | tap answers, choice chips | ASR/voice unusable but some data; or parent mutes voice |
| **L4 offline** | none (`PackLink`) | local classifier vs verified key | recorded clips | taps only, mic closed | no network |

**Same-voice law.** Narration and live voice must be the same voice on every lane (voices-hindi §2 [P]). Same-name voices across realtime and TTS are not guaranteed the same timbre (Meera `live-vs-tts-timbre` [P]). If L2-C fails the ABX, the ladder skips from L2 to L3. A child never hears a stranger speaking as her.

### 7.2 Measured cost of the degraded rungs [M, n=5 per arm (re-encode n=1 per target), US build container to eastus2, 2026-10-02]

| piece | result |
|---|---|
| STT, 6.95 s synthetic child clip | Ogg-Opus 16k **13,256 B → 514 ms** median (474-573); WAV 16 kHz 222,478 B → 582 ms. Both transcribed verbatim in Devanagari |
| text model (`taxila-fast`, reasoning `none`), first token | **1,043 ms** median (806-2,293). With default reasoning and a 120-token cap, 4 of 5 replies came back as 1-2 words, so set `reasoning_effort: none` and a real cap |
| TTS first byte (25-word Hinglish turn, `marin`) | opus 317 ms · aac 273 · mp3 263 · pcm 259 (medians); earlier median 283 ms, n=50 [P] |
| TTS bytes as served | opus **70.7 kbps** · aac 74.2 · mp3 128 · pcm 384 (12 s turn: 106 KB as Opus) |
| server re-encode (libopus, voip, 60 ms frames) | target 12/16/20/24/32k → 10.6 / 15.4 / **18.5** / 22.1 / 29.4 kbps; ~250 ms per 12 s turn including ffmpeg process start |

**Read.** Cascade compute is ≈ 0.5 + 1.0 + 0.3 s ≈ 1.8 s plus 2-3 India↔eastus2 round trips [I], close to L0's measured 2.1-2.4 s gap [P]. So the cascade's real cost is that it cannot hear tone and speaks with TTS prosody, not latency [I]. Its uplink is tiny (13 KB per 7 s utterance). Its downlink is wasteful as served: re-encode to 20k for a 3.8× saving.

### 7.3 Relay design (L1/L2)
- `WS /api/lesson/relay?lesson=…` authenticated with the **child-scoped token**. Frames carry a sequence number; the server keeps the last 10 s of teacher audio and the turn state, so a reconnect resumes without replaying a turn.
- Uplink encoder: WebCodecs `AudioEncoder` (Opus) where available, else `MediaRecorder` 250 ms webm/opus slices demuxed server-side [U: M-LE-5 verifies both in WebView].
- Downlink: PCM16 deltas from Azure → libopus 20 kbps 60 ms frames → client `AudioDecoder` → an adaptive 300-600 ms jitter buffer in an AudioWorklet [I]. TCP retransmits preserve content; beyond 600 ms of stall, drop to L2.
- Capacity: relay sockets count against `taxila-web`'s HTTP concurrency scale rule (50) [P]. Size replicas for relay streams separately [I].

### 7.4 `LinkSupervisor`: when to switch (thresholds are proposals for M-LE-5)
Sampled every 2 s from `getStats()`: `remote-inbound-rtp.roundTripTime` and `fractionLost`, `inbound-rtp.jitter`, concealment ratio = Δ`concealedSamples` / Δ`totalSamplesReceived`, mean buffer = Δ`jitterBufferDelay` / Δ`jitterBufferEmittedCount` [V W3C stat names].

| state | condition (6 s window unless noted) | action |
|---|---|---|
| green | RTT < 400 ms, loss < 3%, concealment < 2% | nothing |
| amber | RTT 400-800 ms, or loss 3-10%, or concealment 2-8% | stay; stretch YOUR TURN timers by RTT; pre-open the relay socket idle; prefetch the current item's L3 clips |
| red | RTT > 800 ms, or loss > 10%, or concealment > 8%, or THINKING > 8 s with no audio (lesson-arc §11) | switch down one rung at the next turn boundary |
| dead | ICE `failed`, or no inbound audio packets for 5 s, or ICE `disconnected` > 3 s | switch now (L1, else L2, else L3/L4); play the pack's connection clip; resume at the same item |
| recover | 60 s green on the active link's probes | step up at the next phase boundary; max 1 step-up per 5 min |

- Every switch re-seeds the new session from the Director: compiled instructions + child brief + the last 4-6 turns as text items. The Director already owns lesson state, so the switch changes transport, never the lesson [P ARCHITECTURE §1.2].
- Session rotation for the 60-min cap [V] lands on a phase boundary, through the same re-seed path.
- The first lesson connects with the profile tap. Token mint starts on `pointerdown` of the profile tile. The opening clip covers ~6 round trips of SDP, ICE and DTLS (~1.2-1.7 s at 200-280 ms RTT [I]).

### 7.5 Data per 30-min lesson (`low-end-data-budget.py`; teacher talks 45%, child 15% [U])

| rung | up MB | down MB | total |
|---|---|---|---|
| L0 defaults (Opus ~32 kbps, 20 ms packets, continuous both ways) [U] | 11.7 | 11.7 | **23.4** |
| L0 data saver (16 kbps, 60 ms packets, if Azure honours the offer's fmtp [U]) | 5.1 | 5.1 | 10.2 |
| L2, TTS Opus as served (70.7 kbps) [M] | 0.5 | 7.2 | 7.7 |
| L2, server re-encode 20k (18.5 kbps) [M] | 0.5 | 1.9 | **2.4** |
| L3 text + tap (clips already in the pack) [U] | 0.1 | 0.1 | 0.1 |

The L0 default exceeds the 12 MB budget, so M-LE-3 decides whether `maxaveragebitrate`, `ptime` and `usedtx` in our SDP offer are honoured. They are receiver preferences in RFC 7587 [V]. Uplink is capped with `RTCRtpSender.setParameters({encodings:[{maxBitrate}]})` [I]. If the downlink cannot be lowered on L0, data saver starts on L1 relay at 20 kbps.

### 7.6 UX per rung
- **L0 → L1:** invisible. Thinking may take a beat longer, and the honest-wait ladder already covers that.
- **L2:** the mic becomes `PttButton` (S-LE2). A pre-rendered clip in her voice explains the change once.
- **L3:** her words appear on the board as chalk text; for R0/R1 non-readers every line is a pack clip or the item is skipped. The `recorded` badge shows.
- **L4:** `recorded` badge; no LISTENING state at all (the mic is closed), only SPEAKING (clip) and YOUR TURN (tap).
- Never more than 3 s of silence without a visible state (gurukul honest waits).

---

## 8. Offline lesson packs

**Two layers.**
1. **Chapter pack** (shared, content-addressed, cacheable across devices and siblings): engine configs, the item bank with verified keys and distractor natures, hint-ladder steps, pre-rendered clips (item prompts, ladder rungs, protégé lines, connection and resume clips), WebP images, captions in both scripts. **≤ 1.5 MB** [I]: 4 min of clips at 18.5 kbps ≈ 0.55 MB, 10 images × 40 KB ≈ 0.4 MB, JSON ≈ 50 KB.
2. **Child overlay** (≤ 50 KB, per child): today's plan and order, retrieval items due, interest-themed variants, the name-greeting clip id. Downloaded at the end of the previous lesson.

**Format.** `manifest.json` lists `{path, sha256, bytes}` and is signed (Ed25519; the public key ships in the APK). Files are fetched by hash, resumable with HTTP Range, written to staging, verified, then swapped in atomically. Never half a pack.

**Storage.**
- Native: Capacitor Filesystem, `Directory.Data` (app-private), served to the WebView with `convertFileSrc` [I]. It survives "clear cache" cleaner apps, which are common on budget phones [U].
- PWA: Cache Storage, with `navigator.storage.persist()` after install [V BCD]. A Chromium origin may use up to 60% of disk, but best-effort data is evicted least-recently-used first [V web.dev].
- Indexes and queues live in IndexedDB. Batch writes: eMMC random I/O is slow [I].

**Download policy.**
- Prefetch the next 2 lessons on unmetered networks, or at lesson end on metered ones, with a visible honest progress counting up (S-LE4).
- With Android Data Saver on (`getRestrictBackgroundStatus() == ENABLED` [V]), or a metered network and the parent's Wi-Fi-only setting: packs download only on Wi-Fi or by an explicit parent tap.
- Free space < 500 MB (shared phones full of WhatsApp media [U]): stop prefetching, stream items just in time, and tell the parent (S-LE6).
- Eviction: LRU by lesson. Always keep the current chapter and the next due overlay.

**Offline grading and evidence.**
- Taps are classified locally against the verified key. This is deterministic and needs no model, which is exactly what the inherited law allows.
- Each evidence event `{eventId (uuid), childId, lessonId, itemId, answer, verdict, modality: "offline-tap", clientTs, seq}` is queued in that child's DB.
- Sync is idempotent (the server rejects duplicate `eventId`s), re-scores against the server's key version, and trusts server time. Offline evidence counts as tap evidence and never as an explanation [I].
- **Hindi offline ASR does not exist on Azure.** Embedded Speech STT lists en-IN but no hi-IN, needs limited-access approval, and embedded TTS costs 100-200 MB RAM [V]. So offline is tap-only. Revisit in v2.

**Honesty offline.** A recorded clip is never presented as live. In L3/L4 the `recorded` badge shows, the mic indicator is absent, and the Director's next live turn may refer back to offline work only from synced evidence.

---

## 9. Data-saver mode

| trigger | source |
|---|---|
| Android Data Saver on for the app | `ConnectivityManager.getRestrictBackgroundStatus()` + `ACTION_RESTRICT_BACKGROUND_CHANGED` [V] |
| metered network and the parent chose "kam data" | `isActiveNetworkMetered()` [V] |
| web: Save-Data | `navigator.connection.saveData` (Chrome 65 [V BCD]); the header is experimental [V MDN] |
| the parent's daily cap is reached | parent corner setting (default off) |

| effect | normal | data saver |
|---|---|---|
| voice | L0 | L0 at a 16 kbps cap, or L1 relay at 20 kbps if the downlink cap is not honoured (§7.5) |
| her TTS (L2-C, narration) | 20k re-encode | 16k re-encode |
| packs | prefetch 2 lessons | Wi-Fi only; current lesson streamed just in time |
| generated images | cache, prefetched | cache only; never generate live |
| video (Sora clips) | ≤ 480p, ≤ 30 s, ≤ 400 kbps [I] | off; the engine or animation version is used |
| telemetry, transcripts sync | batched per lesson | batched hourly |
| teacher, modules | local, unchanged | unchanged (they cost CPU, not data) |

**Parent data meter (S-LE5):** MB this week, per lesson; the mode and its trigger. All numbers are MB, never %.

---

## 10. Shared phone: several children, one device

- **Identity.** The guardian is authenticated on the device: a refresh token in Keystore-backed secure storage (native) or an httpOnly cookie (web). Picking a profile mints a **child-scoped token** (12 h TTL [I]) that every lesson call carries. The device is never the identity (inherited law).
- **Switching** (from the picker, kids-ux S1, every session):
  1. close the realtime session, peer connection and relay socket;
  2. flush the child's evidence queue;
  3. clear in-memory learner state and drop the token;
  4. open the next child's DB and mint their token.
  The live call is never carried over: its instructions contain the previous child's brief.
- **Local isolation.** One IndexedDB per child (`tx-child-<id>`). A shared content DB holds chapter packs, deduplicated by hash, so twins share bytes. Nothing child-specific goes in `localStorage`. "Remove from this phone" deletes that child's DB and overlays.
- **Sibling privacy.** The optional B3-B4 PIN is privacy, not security (kids-ux) [P]. The app sandbox already isolates other apps, so no extra encryption at rest is needed inside the app [I].
- **Wrong-child repair.**
  - The retrieval opener doubles as an identity check (kids-ux `ProfilePicker` hook).
  - On a mismatch the teacher asks who is there, using a shape, not a line, and evidence from that window is marked low-confidence.
  - Parent corner gets "this lesson was \<other child\>": the server moves that lesson's evidence rows, and the move is audited.
- **Mid-lesson grab.** A sibling's switch request goes through the leave guard (kids-ux). The partial lesson is saved.
- **Time limits** are enforced on the server. Offline they use the monotonic clock and are reconciled on sync.
- **Speed.** Profile tap → her local clip ≤ 1 s. Picker → live ≤ 4 s p50 on tier C (§3).

---

## 11. PWA install (the web channel)

- **Channels.** The Play Store APK is primary. The PWA serves families who will not or cannot install (full storage, Play reluctance), laptops and iOS. It is the same build, branched on `Capacitor.isNativePlatform()`.
- **Install criteria (Chrome)** [V web.dev]:
  - manifest `name`/`short_name`, 192 and 512 px icons, `start_url`, `display: standalone`, and `prefer_related_applications` absent or false;
  - HTTPS, one tap and 30 s of viewing.
  - `prefer_related_applications: true` would redirect installs to Play, so keep it false.
  - Use `getInstalledRelatedApps()` (Chrome 84; not in WebView [V BCD]) to hide the install card when the APK is present.
- **Prompt timing.** Capture `beforeinstallprompt` and show S-LE8 **to the parent, after a finished lesson**. Never show it mid-lesson or to the child.
- **Service worker.**
  - Precache the shell (≤ 300 KB br) and cache packs at runtime under versioned names.
  - A new SW activates **only on the picker screen**, never mid-lesson.
  - Call `navigator.storage.persist()` after install.
- **Not in the native build** (W13).

---

## 12. Screens and components

**Screens (tokens from visual-identity §3; overlays sit outside the four states):**
- **S-LE1 Connection chip.** Top-right of the stage; `surface-2` fill, `ink-2` glyph; never `stop`, never `turn`. It appears only for L2, L3 and L4. Young bands get a picture (her holding a walkie-talkie, or a small tape badge), no text. Older bands get a glyph + one word. Tapping it plays the explanation clip again.
- **S-LE2 `PttButton`.**
  - Size: bottom centre, 96 dp Young / 72 dp Older (≥ `hit.min`).
  - While talking, its ring follows `motion.listen` in `listen`. After release it turns into an upload ring in `think`, which is an honest wait.
  - At YOUR TURN it is *the* `YourTurn` element with the `turn` ring, so G4 still counts one.
  - Young: tap to start, tap or 1.5 s of local silence to stop.
- **S-LE3 Recorded mode.** The board shows her words as chalk text, plus the `recorded` badge, tap tiles and her clips. No mic glyph appears anywhere.
- **S-LE4 Saved lessons card (parent corner).** "Saved for no internet": count + MB. Wi-Fi-only switch. Download progress counts up. A remove action.
- **S-LE5 Data meter (parent corner).** This week's MB per lesson, the data-saver switch, an optional daily cap.
- **S-LE6 Storage low (parent).** Free space, what Taxila holds, one action to remove saved lessons. Never shown to the child.
- **S-LE7 WebView too old.** Native error page, offline, bilingual, spoken. Names the Play item "Android System WebView" and links to it.
- **S-LE8 Install card (web, parent).** After a lesson: what installing changes (works with weak internet, opens faster) and its size.
- **S-LE10 Resume card.** Her picture, one big continue tile to the same question, a small "stop for today". Shown after a call drop, process death or a phone call.

**Components:** `DeviceTier`, `FrameGovernor`, `LinkSupervisor`, `NetProbe`, `RelayLink`, `PackLink`, `PackStore`, `EvidenceQueue`, `EchoGuard`, `RendererRecovery`, `ProfileVault`, `InstallCard`. Native plugins: `AudioRoute` (devices, volumes, focus), `ThermalWatch` (`getThermalHeadroom()` at most every 10 s, API 30+ [V]: > 0.95 drops one visual level, > 1.0 goes to tier D), `KeepAwake`, `NetPolicy` (Data Saver, metered).

**New tokens:** `net.chip.bg = surface-2`, `net.chip.fg = ink-2`; `ptt.size = 96 / 72 dp`; `net.red.window = 6 s`; `net.dead.window = 5 s`; `net.stepup.min = 300 s`; `tier.dpr = 2 / 2 / 1.5 / 1.25`; `tier.teacher.fps = 30 / 30 / 30 (24 hot) / 15`.

---

## 13. Copy tone (notes, not lines)

- The problem is always **our connection**, never the child, never the family's phone or data plan. No "old phone", no "slow internet" as a judgement. Name the effect and the next step.
- Her spoken switch explanations are **pre-rendered product audio**, reviewed once and stored as data. They are not prompt text, so the recited-prompt law does not apply. No sentence goes into a prompt.
- For the parent: MB and minutes, never %; one idea per card; the *aap* register (onboarding §11); no jargon (sync, cache, WebView), except the Play item name the parent must find.
- `recorded` is said plainly in both languages. A recording is never implied to be live.
- No dashes in user-visible strings (gurukul copy gate). Every string passes the read-aloud test.

---

## 14. Gates and device-lab measurements

**Build gates (each with a negative control):**
- G-LE-1 bundle budgets (brotli over `dist/`): cold path 120 KB, lesson 150, engine 30, PWA critical 600.
- G-LE-2 `build.target` == `minWebViewVersion`.
- G-LE-3 pinned `androidScheme`/`hostname`.
- G-LE-4 `RendererRecovery` returns true; an instrumentation test kills the renderer.
- G-LE-5 profile switch: the realtime session is closed, and no state from child A is readable as child B.
- G-LE-6 offline e2e: Playwright offline completes a pack lesson; the replayed queue is idempotent.
- G-LE-7 `LinkSupervisor` replays synthetic stats traces: expected rungs, hysteresis, no switch while SPEAKING.
- G-LE-8 `EchoGuard` fixtures.
- G-LE-9 a tampered pack file or bad signature is rejected.
- G-LE-10 static ban on `shadowBlur`, `filter` and `getImageData` in engine render loops.
- Plus kids-ux G9 and the echosim floor.

| id | question | method | n (min) | decides |
|---|---|---|---|---|
| M-LE-1 | cold start, profile tap → clip, → live voice | Helio G35 4 GB, G85, G99 phones; Jio/Airtel 4G and throttled 3G | 30 runs per device per network | §3 budgets, tier lines |
| M-LE-2 | frame times, memory, heat and battery per tier | 45-min scripted lesson; rAF histogram, PSS, `ThermalWatch`, battery | 3 SoCs × 3 runs | tier table, governor thresholds |
| M-LE-3 | bytes per rung; are `maxaveragebitrate`/`ptime`/`usedtx` honoured | `getStats` bytes + relay counters | 10 lessons per rung | §7.5, data-saver default |
| M-LE-4 | India↔eastus2 RTT and first audio, peak (20-22 h) vs off-peak; Voice Live centralindia comparison | field phones on 3 carriers | 200 turns per carrier | region decision |
| M-LE-5 | ladder thresholds; WebCodecs and MediaRecorder in WebView | netem profiles (3/10/20% loss, 300/800 ms RTT, 2 s outages) on real phones; ASR accuracy and child completion per rung | 20 sessions per profile | §7.4 numbers |
| M-LE-6 | echo self-interrupt rate | loudspeaker vs wired, per device class | 30 lessons per class | EchoGuard thresholds, Young default |
| M-LE-7 | Bluetooth route, latency, SCO switch | 5 common earbuds | 10 each | BT policy |
| M-LE-8 | renderer OOM incidence and recovery | field crash logs | 2 weeks of beta | W1 |
| M-LE-9 | profile mix-ups and repair use | logs + parent confirmation (kids-ux M-UX-10) | 50 families | §10 |
| M-LE-10 | is TTS `marin` the same person as realtime `marin` | blind ABX with children and parents | 20 + 20 | L2-C allowed or skipped |
| M-LE-11 | pack download success; storage-full phones; OEM killers | field telemetry by vendor | 500 downloads | §8 policy |
| M-LE-12 | Wake Lock in the WebView | 3 vendors | 5 each | W9 |

---

## 15. Decisions and rejections to log (`context/inbox`)

| id | decision | reverse if |
|---|---|---|
| `le-floor-helio-g35` | tier C (Helio G35, 4 GB) is the design floor; flipbook teacher there | < 3% of active devices are in tier C after 3 months of field data |
| `le-minsdk-29-webview-111` | minSdk 29; build target and WebView floor `chrome111` | > 5% of target families are on Android 8/9 (ship a transpiled legacy bundle) |
| `le-no-background-mic` | hidden app = paused lesson; no microphone foreground service | parents ask for screen-off audio lessons and a visible FGS notification passes a parent test |
| `le-voice-ladder` | L0 → L1 relay → L2 clips → L3 → L4; same voice on every rung or no voice | M-LE-5 shows the relay no better than WebRTC under loss (drop L1) |
| `le-tts-reencode-20k` | server re-encodes TTS to 20 kbps Opus | a phone-speaker listening test hears the difference from 70 kbps |
| `le-packs-in-app-files` | native packs in `Directory.Data`, signed and content-addressed | M-LE-11 shows no loss from Cache Storage |
| `le-session-per-child` | realtime session torn down on every profile switch | never |

**Rejected at design time** (cheap now, expensive to re-learn):
- Keeping the call alive in the background: a hot mic on a child's phone, killed by OEMs anyway [V dontkillmyapp].
- Play Asset Delivery for packs: fast-follow and on-demand packs are invalidated on every app update [V], and the content cadence is not the app's.
- Android system TTS as her offline voice: a different voice is a different person.
- Background Fetch: absent in WebView [V].
- Azure Embedded Speech for offline Hindi: no hi-IN STT [V].

---

## 16. Open questions
1. Does Azure realtime's WebRTC answer honour our Opus fmtp, and does it send packets during her silence? (M-LE-3)
2. Does Azure offer TCP/TLS ICE candidates for networks that block UDP? If not, L1 is the only path on such Wi-Fi.
3. Should the realtime session move to Voice Live in centralindia (voices-hindi) to cut the India RTT, if the voice passes the blind ear test?
4. Does the 10 RPM realtime quota [P] count session creations? It sets when L2-C becomes a capacity path, not only a fallback.

## Sources
- MediaTek Helio G35: https://www.mediatek.com/products/smartphones-2/mediatek-helio-g35
- Russell, The Performance Inequality Gap 2026: https://infrequently.org/2025/11/performance-inequality-gap-2026/ ; 2024: https://infrequently.org/2024/01/performance-inequality-gap-2024/
- Capacitor config: https://capacitorjs.com/docs/config ; Capacitor 8 update: https://capacitorjs.com/docs/updating/8-0 ; source (Bridge, BridgeWebChromeClient, BridgeWebViewClient, build.gradle): https://github.com/ionic-team/capacitor/tree/main/android/capacitor
- Chromium Android audio: https://github.com/chromium/chromium/tree/main/media/base/android/java/src/org/chromium/media (AudioManagerAndroid, CommunicationDeviceSelector, CommunicationDeviceSelectorPostS)
- Android: WebView termination https://developer.android.com/develop/ui/views/layout/webapps/managing-webview ; FGS types https://developer.android.com/develop/background-work/services/fgs/service-types ; audio focus https://developer.android.com/media/optimize/audio-focus ; Data Saver https://developer.android.com/develop/connectivity/network-ops/data-saver ; Play Asset Delivery https://developer.android.com/guide/playcore/asset-delivery ; thermal https://developer.android.com/games/optimize/adpf/thermal ; app size https://developer.android.com/topic/performance/reduce-apk-size
- Chrome Android requirements: https://support.google.com/chrome/a/answer/7100626
- Azure realtime WebRTC: https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/realtime-audio-webrtc ; Embedded Speech: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/embedded-speech
- OpenAI realtime conversations (push-to-talk, 60-min cap): https://developers.openai.com/api/docs/guides/realtime-conversations ; VAD: https://developers.openai.com/api/docs/guides/realtime-vad ; TTS: https://developers.openai.com/api/docs/guides/text-to-speech
- RFC 7587 (Opus RTP/SDP): https://www.rfc-editor.org/rfc/rfc7587.html ; Opus settings: https://wiki.xiph.org/Opus_Recommended_Settings ; W3C WebRTC stats: https://www.w3.org/TR/webrtc-stats/
- web.dev: install criteria https://web.dev/articles/install-criteria ; storage https://web.dev/articles/storage-for-the-web ; rendering https://web.dev/articles/rendering-performance ; OffscreenCanvas https://web.dev/articles/offscreen-canvas
- MDN Save-Data https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Save-Data ; Wake Lock https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API ; compat data https://github.com/mdn/browser-compat-data
- Vite build target: https://vite.dev/config/build-options ; dontkillmyapp: https://dontkillmyapp.com/
- Measured here: `low-end-cascade-probe.mjs` → `low-end-cascade-probe-2026-10-02.json`; `low-end-data-budget.py`; library sizes from jsdelivr builds (Rive canvas-lite 2.44.0, three 0.186.1, pixi.js 8.22.0, lottie-web 5.13.0, katex 0.19.0, preact 11.0.0).

---

## Critique

**Reviewer:** design critic pass, 2026-10-02. **Method:** read-only review of this file against the inherited laws (no reward economies, no streak guilt, parent sees all, 4-state rule, 11 px floor, child-safety floor). No new device measurements. Items tagged [U] stay assumptions. Each item ends with a correction (C-n) that supersedes the text above it.

### Verdict
The engineering spine is sound: tiers that only step down, a same-voice ladder, per-child sessions, packs that carry their own key, and a no-background-mic rule. The weaknesses are on the child's side of the glass. The file designs for a 6-year-old on a weak phone and then reuses that child's affordances for 10-15s. It also gives the hardest-hit families, the ones on the oldest phones, a weaker teacher and a hard install wall, and it is silent on safeguarding and accessibility when the network is down.

### 1. Babyish for 10-15
1. **Walkie-talkie metaphor on L2.** S-LE1 and S-LE2 use "her holding a walkie-talkie" and a tape badge. A Class 8 child on a bad connection reads this as a toy. The metaphor is only defensible for the Young band. Older bands get "glyph + one word", but the 72 dp `PttButton` still behaves like a kid's ring button.
2. **The flipbook teacher on tier C is the age problem and the equity problem in one.** Tier A gets a 3D teacher, tier B a Rive teacher, tier C a nine-pose sprite sheet, tier D a static portrait with a 2-frame mouth. The brief is an "exactly human" teacher. A 12-15 year old on a G35 sees a puppet, and a child who sees a puppet while a classmate sees a person reads the family's phone as the problem. The doc's own "never blames the phone" copy rule is undone by the visual. Fidelity must track the device, but the tier is a hardware fact the child can see.
3. **"Stop for today" and the resume card** are phrased for a small child. Older children need an exit that does not feel like being put to bed (see C-3).
4. **Chalk text on the board (S-LE3)** is a classroom skin. Check it against the older bands' visual identity.

**C-1.** Split S-LE1/S-LE2 by band. Young keeps the picture (and gets a caption, see §3). Older bands get a neutral mic glyph + "Tap to talk" with no walkie-talkie art, and the same ring/size tokens. Add `ptt.art = picture / glyph` keyed by band.
**C-2.** The flipbook must be rendered from the same art direction and identity as the tier A/B teacher (same face, same wardrobe, same palette), so a child who moves between phones sees the same person at lower frame rate, not a different style. For Older bands on tier C/D, prefer a still, realistic portrait with a very small mouth and eye-blink set over a cartoon-like pose cycle. Add a gate: a blind side-by-side of tier A vs C poses reads as "the same teacher" for 10-15 testers (new M-LE-13). Never show the tier name or any "lite" wording to the child.
**C-3.** Older bands: exit and resume are one neutral "Pause" and "Continue", the wording chosen by the copy review, with no bedtime tone.

### 2. Inaccessible
1. **Live captions are absent.** Pack clips carry captions in both scripts (§8), but L0 live speech has none. Shared phones are used on a loudspeaker in crowded, noisy rooms, and some children are hard of hearing or have auditory-processing difficulty. Captions are an access need and also the fix for "I can't hear her" (§6 treats this as a volume problem only).
2. **Picture-only network state for Young (S-LE1)** relies on a tape badge nobody has been taught. Without text or sound it fails a deaf child and a child who does not recognise the icon. It must always be paired with the spoken clip and a caption.
3. **Contrast and colour.** `net.chip` is `surface-2` fill + `ink-2` glyph. Nothing here proves 4.5:1 for the glyph or 3:1 for the chip edge against the stage, in any theme. Neutral-on-neutral is the easiest pairing to get wrong, and it must not carry state by colour alone.
4. **TalkBack, font scale and reduced motion are not mentioned once.** Android users on low-end phones often run 130%+ font size, "remove animations" and TalkBack for a family member. The 11 px floor, the stage grid and the 96/72 dp PTT must survive 200% font scale. `prefers-reduced-motion` and the Android animator-scale setting must map to the `FrameGovernor` visual level, not just be ignored.
5. **PTT release rule.** "Tap or 1.5 s of local silence to stop" will cut off a 6-year-old who pauses to think, searches for a Hindi word mid-Hinglish, or has a stammer. A cut-off sentence is graded or answered as if it were the full thought, which is a fairness failure, and the child learns to hurry.
6. **Press-and-hold for Older** ("hold or tap") is hard for tremor, small hands or a cracked screen. Tap-to-toggle must always be available for every band, not a Young-only mode.
7. **Bluetooth permission** is requested only when a headset exists, which is good. But on permanent denial the doc routes the lesson to L3 silently. The child on a Bluetooth headset gets a different lesson from the parent's choice with no parent-visible reason.

**C-4.** Add live captions to L0/L1/L2 as a child setting, default on for the first lesson and for any child with the "hard to hear" flag, rendered from the transcript the Director already holds. Captions pass the 11 px floor and the copy gate.
**C-5.** S-LE1 for every band carries glyph + a text label + the spoken clip. The picture is an addition, never the only carrier.
**C-6.** Add a contrast gate (G-LE-11): all `net.*` and `ptt.*` tokens measured at 4.5:1 text / 3:1 non-text in every theme, with a colour-blind simulation screenshot test.
**C-7.** Add an accessibility block: 200% font scale layout test, TalkBack order on the stage (one "your turn" focus), reduced-motion mapping, all touch targets ≥ `hit.min`, and a switch-access check on S-LE2/S-LE10.
**C-8.** End-of-speech: the silence window is a ramp, not a constant. Young 3 s (with a visible, quiet countdown ring so the child can see it), Older 2 s, extended after a filler or a rising tone. Always tap-to-toggle; hold is optional. Log cut-offs (child resumed within 2 s of the stop) as a quality metric. Replace the Young "1.5 s" line, and rerun it in M-LE-5 with real child audio.
**C-9.** When a Bluetooth denial or any rung change alters the lesson, the parent corner records the reason in plain words.

### 3. Reward-economy creep
Mostly clean: no points, no streaks, no confetti on connection events. These items could creep in during build:
1. **Pack download progress "counting up" (S-LE4)** is correct for the parent. If it ever renders where a child sees it, it becomes a progress bar that rewards being online. Keep it in the parent corner only.
2. **Counts of saved lessons** ("N saved") are a collection mechanic if shown on the child's picker. Child surfaces show nothing about packs.
3. **"Step up at most once per 5 min"** has no child-visible equivalent, good. Do not make a recovered connection a celebrated event (no sound sting, no "you're back!" reaction).
4. **Resume card** with "one big continue tile" is a guilt-light nudge. Keep the "stop" action the same size and the same weight as the continue tile (not a small grey link). Honour the rule that the teacher never expresses disappointment on return.
5. **Retrieval items due** in the child overlay (§8) are the right mechanism, but "due" language must never reach the child as a count, a backlog or a streak at risk.
6. **Parent daily data cap** can become a hard cut-off mid-lesson that the child experiences as punishment. A cap reached mid-lesson finishes the current item, says it in her voice as a neutral pause, and never names the child's usage.

**C-10.** Add a rule to §12: no S-LE4/S-LE5/S-LE6 values appear on any child surface. Add G-LE-12, a static check that parent-corner components are not importable from the child route.
**C-11.** Resume card: continue and stop equal in size and weight, and no "you were doing so well" copy. Cap reached: finish the item, then a neutral pause.

### 4. Too text-heavy for 6-9
1. **L3 chalk text** is the weakest point. The doc says R0/R1 non-readers get only pack clips or the item is skipped. In practice, on a poor connection, a non-reading child may have most of a lesson skipped. The lesson looks empty, and no one is told.
2. **S-LE7 (WebView too old)** is spoken and bilingual, but it is a text page whose action ("find Android System WebView in Play") only a parent can do. The page should address the parent explicitly and the spoken clip should tell the child to hand the phone to a grown-up, so the child never stares at a wall of text.
3. **S-LE10 resume card** is already minimal. Keep it that way.
4. **Hinglish code-switching in chalk text** for early readers: Devanagari and Latin mixed on one line is slower to decode than either. Keep one script per line for R0/R1.

**C-12.** For R0/R1 every board item must be a picture or object-first (icon, count, shape), with her clip as the voice. Define a pack-lint gate: items without a clip are not shipped in a non-reader pack, and the picker shows the parent a "this lesson is audio-only and not ready offline" status instead of silently skipping.
**C-13.** S-LE7: first screen is one picture and one spoken sentence for the child, "give this to a grown-up". The parent text sits on the second screen.

### 5. Breaks on low-end Android
1. **`minSdk 29` is the biggest unexamined bet.** The reversal threshold (">5% of target families on Android 8/9") has no data behind it, and the target group is exactly the hand-me-down phone group. Android Go builds on 1-2 GB devices and many 2018-20 phones run Android 8/9/10 Go. The doc's own fallback for them is an "update WebView" page, which the child's family cannot act on if the phone no longer receives WebView updates. This turns the whole product off for them with a single error page. [U]
2. **Persisted tier + a 300 ms microbench at first launch.** Thermal state, a Play update running in the background or a WhatsApp backup can misclassify a phone and the result persists for the install. A B-class phone stuck on C or D is a permanent downgrade.
3. **Memory budget scope.** "App PSS ≤ 350 MB" on a 4 GB phone that also runs WhatsApp, Play Services and an OEM launcher leaves little headroom. A WebView renderer is a separate process and may not be inside the app's PSS number. The W1 recovery path covers a kill but not a lesson that dies every 10 minutes on a full phone. Tier D (≤ 2 GB) has no memory budget row at all.
4. **Storage.** 500 MB free is a high floor on 32 GB phones that are usually full. The doc says "stream just in time" below that, but then L0 data cost is borne by the family at the worst time.
5. **Data cost on a shared plan.** L0 defaults cost about 23 MB per 30 min [I]. At one lesson a day that is about 700 MB a month against the 1-1.5 GB/day or monthly caps common on prepaid plans [U]. The doc pushes the decision to M-LE-3 after launch. A first-week family sees the cost before the measurement exists.
6. **All measurements come from a US build container** with a synthetic 6.95 s clip. STT quality on a real child's voice, in a noisy room, through a cheap phone mic, is untested, and the thresholds in §7.4 are [U] proposals. The 806-2,293 ms first-token spread (n=5) shows the median is not stable enough to set a rung boundary.
7. **Never-upgrade `FrameGovernor`.** One GC pause or a notification shade drop permanently lowers the lesson's visual level. A hysteresis of "3 s p90 > 25 ms" will trigger on a single bad scene.
8. **OEM killers** are handled by "pause on hide", but the resume card depends on state written to IndexedDB at item boundaries. IndexedDB on eMMC under memory pressure can lose the last write, and the doc has no recovery for a partial write.
9. **Pack size [I].** 1.5 MB per chapter with 4 min of 18.5 kbps clips is plausible but never produced. Hindi + English clips for R0/R1 per item, per ladder rung and per hint could multiply this.

**C-14.** Do not hard-block Android 8/9. Ship the PWA as the supported path for them (the doc already builds it) with a lite bundle at `chrome80`-class syntax and tier D defaults, and keep minSdk 29 only for the native app. Replace S-LE7's dead end with a "use Taxila in your browser" action. Make the 5% threshold a pre-launch measurement from the beta, not a reversal condition.
**C-15.** Tier detection: run the microbench on three launches and take the median, store the tier with a timestamp and a "re-check after OS or WebView update" rule, and let the parent corner offer a one-time "try a better quality" re-test. Tier remains a hardware label that never reaches the child.
**C-16.** Memory: budget the WebView renderer process explicitly (total of app + renderer PSS), define tier D numbers, and run M-LE-2 on a 4 GB phone with WhatsApp and a game in the background, which is the real shape of a shared phone.
**C-17.** Data: until M-LE-3 returns, default cellular to data saver (16 kbps cap or relay at 20 kbps), show the parent a plain MB number on the first card, and let the parent switch to full quality on Wi-Fi. State that the figures in §7.5 are [I].
**C-18.** Replace the single-sample governor trigger with "p90 > 25 ms for 3 s, twice within 30 s", allow a step back up at the next item boundary (not the next lesson) if the p90 stays under 16 ms for 20 s, and treat the notification shade and any system overlay as excluded intervals.
**C-19.** Write IndexedDB checkpoints as two alternating records, and on restore pick the newest valid one. Add this to G-LE-6.
**C-20.** Treat the 1.5 MB and 4 min figures as targets, not facts. Add a pack-size gate and a first real chapter build before the number is quoted again.

### 6. Safety and shared-phone gaps
1. **The safeguarding floor is not carried through the ladder.** The inherited law says safety is a predicate, not an instruction. L0 has a live teacher. L2-C goes through STT then a text model. L3 and L4 have no live turn at all. A child who says or types something worrying while the network is down reaches no help, and the pack has no pre-rendered Childline 1098 / Tele-MANAS 14416 path. Nothing in §7 says the crisis predicate runs on the STT transcript of L2 and L2-C, or on the relay path.
2. **Child-scoped token TTL of 12 h** on a shared phone means a sibling who opens the app within the TTL, with the app only backgrounded, may land in the previous child's session without the picker. §10 clears state on a switch but not on a hand-over without a switch.
3. **Wrong-child repair** relies on a retrieval opener, which fails when the sibling answers correctly. Evidence from that window is mislabelled until a parent notices.

**C-21.** Add to §7 a row for every rung: where the safety predicate runs (L0 realtime tool + server predicate, L1/L2 on decoded transcript, L2-C on STT output, L3 on typed input, L4 n/a). Add a pre-rendered safeguarding clip and a static "talk to a grown-up / call 1098" affordance to every rung including L4, reachable by the child in one tap and never behind the connection chip. Add a gate (G-LE-13) that the L3/L4 builds contain the helpline assets and that a crisis fixture routes to them.
**C-22.** Require the picker again after the app has been backgrounded for more than 5 minutes or after a cold start, regardless of token TTL, and shorten the token TTL to the lesson length plus a margin.
**C-23.** Add a low-friction "not me" action to the child's first screen of a lesson, and lower the confidence of evidence in the first 2 minutes until the opener passes.

### 7. Evidence-tag corrections
- §1 and §2 mix [V], [I] and [U] in the same sentence in places (for example the tier table). Mark each tier row as [U] until M-LE-1/2 report, so no downstream doc cites "tier C = Helio G35" as measured.
- The STT result (514 ms) used a synthetic clip. Tag it "[M, synthetic audio]" and do not cite it as child-speech performance.
- "Typical G35 phones in Indian homes" is [U] and drives the floor decision. The reversal condition in `le-floor-helio-g35` should be tied to a number to be collected in beta, with a date.

**C-24.** Re-tag as above, and add M-LE-13 (tier A vs C teacher identity blind test, 10-15 raters), M-LE-14 (caption and large-font usability test with 6 children and 4 parents), and M-LE-15 (end-of-speech silence window on real child audio) to §14.

### 8. What to keep
- Rule 8 (no background mic), rule 14 (one session per child), same-voice law, offline tap grading against the verified key, the parent-only storage/data cards, neutral network colours, and the copy rules (our connection, never the child) are correct and should not be touched by the changes above.
