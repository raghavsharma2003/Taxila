# Harvest: html-portfolio @ origin/main, voice, call, vision, Android, surfaces, gates

Segment id: `hp-main-voice-surfaces`. Harvested 2026-10-02. Read-only.

- Source: `/home/user/html-portfolio`, ref `origin/main`, tip `3a92179` (2026-08-25, "Merge Maya: world layer, RelationalOS split, resilience stack, launch fixes (PR #3)").
- Citation format: `path@main`. Every path below is on `origin/main` unless it says otherwise.
- Secrets: `api/_config.js` is gitignored and is not in the tree or the working copy. `api/_config.example.js` holds names only. `/home/user/Taxila/.env.local` exists (secret present, not opened). A pattern scan of tracked files for `AIza…`, `sk-or-v1-…`, `sk-…` and PEM keys found nothing. No key, token or password appears in this document.
- Companion doc: `docs/harvest/companion-tech.md` covers lineage across branches. This doc goes deeper on the call/voice/vision/Android/surfaces/gates code on `main` only.

---

## 1. What this is

Meera (shown to users as "Maya") is a Hinglish AI companion. This segment covers how she **speaks and listens on a live call**, **watches a shared screen during the call**, **runs as an Android app**, **reaches other surfaces** (Telegram, WhatsApp, Discord), **plays games while talking**, and **is observed and gated** (telemetry, turn trace, release gates, lints, design standards).

How far it got:

1. **Realtime voice.** Shipped and measured. The primary call lane is Gemini Live (`models/gemini-3.1-flash-live-preview`). It is speech to speech over a browser WebSocket and uses a single-use ephemeral token. The core asset is `src/voice/liveCall.ts` (3,408 lines). It makes the **client the floor authority**: while she speaks, the mic is held in a ring buffer, and a sound must clear real bars before it can interrupt her. Those bars cover duration, energy over a rolling floor, onset confirmation, a backchannel filter, and an echo model with an r²-gated slope estimator. A simulator (`evals/echosim/`) drives the real file through a virtual browser with room acoustics, and every change to the file is diffed against an 80-call floor table.
2. **Fallback voice (cascade).** Shipped and measured. STT → LLM → TTS runs through `api/speech.js`. It has a free streaming Gemini TTS lane plus a paid OpenRouter arm that starts at 1.5 s, a byte gate that prevents splicing, a two-phase fuse, and a server-side text-to-speech sanitiser that is mirrored character for character from `src/voice/spokenText.ts`.
3. **Voice identity.** Shipped and gated. One voice name (now Despina) is mirrored across six lanes in four languages. It has one writer (`verify-voice.mjs --set`), the identity is part of every audio cache key, and the voice is picked by ear from a blind deck.
4. **Screen share during a call.** Shipped and measured. On web, `getDisplayMedia` frames (600 ms, 768 px, JPEG q0.68) go straight into the live socket. A pure-geometry scene detector (`src/watch/scene.ts`) wakes her when the user *stops* on something, not when the screen moves. Android has line-for-line Java twins (`SceneReader.java`, `WatchPacer.java`, `LiveWatchEngine.java`) and a parity test that compiles and runs them.
5. **Android.** Shipped. Capacitor 8 app `app.meera.companion`. It has a custom OTA web-bundle updater with a rollback chain, a mic-permission fast path, a beep-free on-device STT pipe, a mediaProjection foreground service, and playback capture.
6. **Surfaces.** Code-complete, never on a real wire. There is a four-function adapter contract with a single fail-closed reply choke point that routes through the honesty gate. Telegram, Discord and WhatsApp adapters exist, but `send()` has never been called on any of them.
7. **Games.** Shipped and measured. Chess, tic-tac-toe and would-you-rather run as **activities**: generic `ActivityState` facts ride the same prompt as everything else. The move is chosen by code and only the talk comes from the model. Think-time is a pure table, and mid-call notes go through a send seam that refuses stale notes.
8. **Observability and gates.** Shipped. Telemetry contract, a 7-leg turn trace (references only, never copies), a content-free `diag` sink, `verify-release.mjs` (13 gates), a prompt-budget guard, motion/contrast/copy/workflow lints, and a deploy verifier.

**Taxila framing.** Taxila's stack differs on the most important axis: **Azure `gpt-realtime-2.1`, not Gemini Live**. The floor-arbiter logic, the echo model, the uplink policy, the stuck-turn watchdog, the yield fade, the rotation scheme, the echosim harness, the screen/scene detector and almost every gate pattern are protocol-independent and can be ported. The socket protocol, the barge-in signal, the frame transport and the voice roster have to be rewritten. This repo already measured those Azure differences (see §5 `realtime-azure`, `azure-realtime-shape`).

---

## 2. Reusable assets

Maturity: **shipped-measured** means in production with a recorded measurement. **shipped** means in production with no measurement. **prototype** means it exists but is off or unwired. **spec-only** means a document only.

Taxila use: **copy** (take as is), **adapt** (port or modify), **idea** (concept only), **skip**.

### 2.1 Realtime voice (`realtime-voice`)

| id | path@main | what | maturity | use | target |
|---|---|---|---|---|---|
| A01 | `src/voice/liveCall.ts@main` | Client-side **floor arbiter**. While she is audible, mic audio is held in a ring (`HOLD_RING=26` ticks ≈2.2 s). A sound earns the floor only by clearing the LISTEN/BARGE/SOFT bars (`LISTEN_RATIO_MIN 1.8`, `BARGE_MULT 6.3` = +16 dB, `SOFT_MULT 4.0`). Other parts: claim duty `CLAIM_MS 550 / CLAIM_WIN_MS 850`, onset confirmation (`ONSET_CONFIRM_MS 250`, `ONSET_DUTY 0.6`), backchannel retirement (`BACKCHANNEL_MAX_MS 600`), a steadiness veto against fans (`STEADY_DB 2.0`), and duck/claim levels (0.62 / 0.30). When the floor is claimed, the whole ring is burst-released so no words are lost. | shipped-measured | adapt | realtime-voice |
| A02 | `src/voice/liveCall.ts@main` (ECHO_* block, lines ~473-653) | **Echo model.** κ = mic RMS ÷ her playback RMS, seeded pessimistically at 0.30. It decays toward the p90 of the measured ratio and rises only when a best-lag affine fit has r² ≥ 0.7 (lags searched 0–260 ms in 20 ms steps). Her level is tracked as the peak 20 ms RMS at the playhead, the ring is pruned by time, and there is a reverb tail model (200 ms / −20 dB). `ECHO_MARGIN 1.3` was swept. | shipped-measured | adapt | realtime-voice |
| A03 | `src/voice/liveCall.ts@main` lines 122-225 | **Uplink policy.** Words are never dropped. Fixed ceilings: `STALL_CEILING 400_000` B, `VIDEO_GATE 48_000`, `SILENCE_CAP 8_000`, `SILENCE_ENDPOINT_MS 700` (the pause after speech is never shed), `SILENCE_KEEP 3` heartbeat, `FRAME_MAX_B64 120_000`. Congestion is read at the troughs of `bufferedAmount` and is advisory only. | shipped-measured | copy | realtime-voice |
| A04 | `src/voice/liveCall.ts@main` `STUCK_OPEN_MS`/`FORCE_SILENCE_MS` + `evals/echosim/stucksim.mjs@main` | **Stuck-turn watchdog.** If the gate has been open for 20 s without a break and nothing is being generated, it forces 700 ms of real silence so the server can end the user's turn. Without it, a noisy room stops her answering at all. Gated in `verify-release` with a disable-the-watchdog negative control. | shipped-measured | copy | realtime-voice |
| A05 | `src/voice/liveCall.ts@main` `yieldFloor`/`playChunk`/`flushPlayback` | **Human yield.** When interrupted, she finishes the current word and fades across the next phrase boundary she finds within 450 ms (`YIELD_MAX`); if the overlap has already run over 700 ms she drops out in 130 ms instead. `discardTurn` blocks stray chunks for up to 2 s. `RELEASE_WATCHDOG_MS 600` / `RELEASE_SETTLE_MS 300` make the client's own decision authoritative when the server's `interrupted` never arrives. | shipped-measured | copy | realtime-voice |
| A06 | `src/voice/liveCall.ts@main` `mintToken`/`prewarmLiveToken` + `api/live-token.js@main` | **Ephemeral token.** Single use, 30 min expiry, 9 min start window. Minted in advance while the user is in chat (cached 7 min) and minted again in the background 15 s after the call starts. Two staggered mint attempts (the second at 2.5 s, or as soon as the first fails), and the loser is aborted so it cannot leave an unused credential behind. Rate limit 12/min per IP. Upstream errors are classified as quota, transient or deterministic. | shipped | adapt | realtime-voice / auth |
| A07 | `src/voice/liveCall.ts@main` lines 1356-1440, 3134-3168 | **Parallel connect plus timing breakdown.** `getUserMedia` and WebSocket+setup run together, and the AudioContext is built during DNS/TLS. Reports `mintMs, micMs, wsOpenMs, setupMs, uplinkMs, setupBytes, overlapMs` via `diag("call","live_connect")`. Built after one device measured readyMs 7618. | shipped | copy | realtime-voice / telemetry |
| A08 | `src/voice/liveCall.ts@main` GOAWAY ROTATION block + `LiveWatchEngine.java@main` | **Session rotation.** On a server `goAway`: open a fresh socket with the same model and the same voice, using `wsGen` generation guards and a `sockReady` flag that is separate from `ready`. Rotation waits for `speakingUntil`, capped at 4 s and kept at least 1.2 s inside the server's deadline, with `MAX_ROTATES 6`. The model is **pinned for the life of the call**. `timeLeft` is parsed as protobuf seconds and converted to ms. | shipped-measured | adapt | realtime-voice |
| A09 | `src/voice/liveCall.ts@main` `direct()` | **Out-of-band note channel.** A `clientContent` user turn: `turnComplete:true` asks her to answer, `silent:true` adds context only. It waits up to 1.2 s for her to finish speaking. Notes are framed in angle brackets (`<context: …>`), never square brackets. This carries screen wakes, game moves, lookup results and running notes. | shipped | adapt | realtime-voice / generative-ui |
| A10 | `src/voice/level.ts@main` (51 lines) | **Presence meter.** Real amplitude read from an AnalyserNode on the existing graphs. RMS with fast attack and slow release (0.35/0.08), so it reads as breathing rather than as a VU needle. | shipped | copy | design-system/ux / avatar-visual |
| A11 | `src/components/useCallEngine.ts@main` lines 1795-1893 | **Ring and pickup race.** Ring length is 1.1–1.4 s, longer at night or after a long gap, capped at 2.4 s. The live lane gets ring + 3.5 s to connect; otherwise the cascade takes the call. A late live session is adopted only at a turn boundary (`adoptLiveLate`). The pickup directive carries the current scene. | shipped | adapt | realtime-voice |
| A12 | `src/voice/liveCall.ts@main` setup block lines 3046-3118 | **Setup-block lessons**, each one measured: `thinkingBudget:0` (3–5.5 s → ~0.9 s), `languageCode:"hi-IN"` pinned, `END_SENSITIVITY_HIGH`, `silenceDurationMs:300`, `prefixPaddingMs:60`, start sensitivity deliberately unset, `NO_INTERRUPTION` deliberately unset, `contextWindowCompression.slidingWindow`. | shipped-measured | idea | realtime-voice |
| A13 | `src/voice/liveLookup.ts@main` | **Lookup beside the turn.** She reacts first ("ruk, dekhti hu") and the facts arrive about 1 s later through `direct()`. The trigger is narrow: a factual-domain noun, plus question shape, plus no relational language. | shipped-measured | adapt | learning/pedagogy |
| A14 | `src/voice/farewell.ts@main` | **Goodbye detector** using a closed vocabulary. Every token must be a farewell word or a filler. It only fires when the call has run at least 20 s, and she has said her own goodbye. It hangs up 1.4 s after that. Kept separate from explicit hang-up commands (`hangup.ts`, which has a 9 s grace). | shipped-measured | adapt | realtime-voice |
| A15 | `src/voice/callHistory.ts@main` | **Context blocks for the call lane, each with a budget.** `formatSharedHistory` (700 B), `formatJustHappened` (45 min, 300 B), `formatRunningNote` (8 rows, 900 B: the first 4 turns as anchor plus a salience spread, verbatim and never summarised), `formatMemoryNote` (500 B), and the activity ledger (300 B). Also `LIFECYCLE_MATRIX` (see A44). | shipped-measured | adapt | memory-graph / realtime-voice |

### 2.2 TTS, voice identity, cloning (`tts-voice-identity`, `voice-cloning`)

| id | path@main | what | maturity | use | target |
|---|---|---|---|---|---|
| A16 | `api/speech.js@main` | **TTS proxy.** The free Gemini lane streams over SSE (40 ms frames of 1,920 B). The paid OpenRouter arm starts at `PAID_ARM_MS 1500`. `FLUSH_MIN 1000` B is both the commit gate and the test for a dead key, so two renderings can never be spliced. Two-phase fuse: a 1.4 s first frame, then one 15 s attempt. The paid arm is hedged. Response headers record lane, pool, model, voice and rules version. Returns 422 when nothing in the text is speakable, and uses delivery-mood direction. | shipped-measured | adapt | tts-voice-identity |
| A17 | `src/voice/spokenText.ts@main` + mirrored core in `api/speech.js@main` | **Text→speech sanitiser.** Rule classes A–L: invisibles, protocol segments, URLs (keep the address), lists, markdown (keep the words), dashes (become a pause, but hyphens inside words are kept), arrows/pipes (become a pause), parentheses (keep the words), emoji (drop), ellipses (keep), tidy, and "nothing speakable" returns `""`. The server mirror is verified character for character. | shipped-measured | adapt (extend for math) | tts-voice-identity / safety-floor |
| A18 | `src/voice/liveCall.ts@main` `shapeAck` (exported) | **Clip shaper.** Finds the core at −30 dB, restores breath and tail edges out to −55 dB (60/200 ms caps), applies an asymmetric curved fade (25 ms in, 90 ms out), level-matches to 20 ms-peak RMS 0.0676 with a ceiling of 3× peak, and returns null when the clip is out of band. The cascade lane imports it. | shipped-measured | copy | tts-voice-identity |
| A19 | `src/voice/liveCall.ts@main` ACK_* (`ACK_ENABLED=false`) | **Post-turn listening sound.** Real clips of her voice ("Hmm.", "Mmhm.", "Mmm.", non-lexical only) are fetched during the ring and cached in IndexedDB under a key that includes the voice. It plays about 420 ms after the user stops, after at least 2.5 s of their talk, at most once per 15 s, never touches the playhead, and holds the mic across the reverb tail. | prototype | adapt | tts-voice-identity |
| A20 | `scripts/verify-voice.mjs@main` (61 KB) | **One-voice gate.** §1 name, §2 model registry, §3 sanitiser mirror, §4 live-lane import law, §5 cascade watch engine, §6 TS⇄Java rotation parity, §7 identity present in every cache key, door census. `--set <Voice>` moves all six lanes and re-verifies. Allow-list comes from the live-voice roster probe. | shipped-measured | adapt | tts-voice-identity / evals |
| A21 | `scripts/voice-samples.mjs@main` + `docs/VOICE-SAMPLES.md@main` | **Blind voice deck.** Shuffled labels A–F/H, the same Hinglish lines, the same direction. Listen order: (1) a real young Indian woman? (2) Hinglish right? (3) the same person across all lines? (4) would you want her calling you? | shipped | copy (method) | tts-voice-identity |
| A22 | `scripts/prosody-baseline.mjs@main` | **Voice-drift alarm.** f0 by autocorrelation on 30 ms frames (70–400 Hz, confidence-gated), plus duration and words/s. Alarms at f0 ±8 %, duration ±20 %, or any change to the model string. Logged in `evals/dbattery/prosody-baseline-log.json`. | shipped | adapt | tts-voice-identity / evals |
| A23 | `src/voice/speech.ts@main` | **Cascade voice engine.** `createStreamSpeaker` latches the engine once per utterance, then phrase queueing, device TTS as last resort, `playThinkingFiller`, `playAck` (always fires, "read receipt for voice"), backchannel prefetch, ringback/room tone, `duckSpeech`. `VOICE_IDENTITY_WINS`: user keys for Sarvam/ElevenLabs are failover only. | shipped | adapt | tts-voice-identity |
| A24 | `docs/research/SPEECH-STACK.md@main` §2, §7 | **STT inventory and voice-cloning posture.** No dedicated STT anywhere; three lanes all hardcoded `en-IN` and unmeasured. Cloning analysis: India treats voice as a personality right (Anil Kapoor 2023, Arijit Singh 2024); hire a voice actor under work-for-hire with explicit cloning terms; IndexTTS2 separates timbre from emotion; references need 10–15 s for instant cloning and 20–30 min for a professional clone; the reference set must contain the register you want. | spec-only | idea | voice-cloning |

### 2.3 Vision during a call (`multimodal-vision`)

| id | path@main | what | maturity | use | target |
|---|---|---|---|---|---|
| A25 | `src/watch/scene.ts@main` (33 KB) | **SceneReader.** Pure geometry over a 32×32 luma grid sampled every 120 ms. Show classes `settle/reshow/point/switch` and ambient classes `start/along/idle`. It wakes on the *hold* after movement, sized against the user's own rhythm (`HOLD_MULTIPLIER 1.8`, replace 260–800 ms, churn 260–2000, micro 2500–8000, scroll 1200–25000). Scroll is detected as translation, edge-anchored overlays are not new content, cursor pointing is detected, FLAG_SECURE frames read as blank, and a pre-roll still frame is captured. | shipped-measured | adapt | multimodal-vision |
| A26 | `src/components/useCallEngine.ts@main` `startWebWatch` lines 2284-2700 | **Web share pipeline.** Detection at 12 fps is decoupled from transmission: a 600 ms frame cadence, 768 px, q0.68, one quality only. Idle beat 2500 ms when the screen is unchanged; a frame is pushed when the user's voice starts or stops (≤12/min). Wake gates: her voice, quiet floors (show 1.2 s / ambient 3 s), stale frame (>3 s, and a show needs a still frame), show floor 2.5 s, ceiling 12/min with ambient capped at 5. Every refusal is logged with the gate that refused it, and the cadence slot is spent only on a delivered frame. | shipped-measured | adapt | multimodal-vision |
| A27 | `src/engine/persona.ts@main` `WATCH_MODE_NOTE`, `WATCH_COMMENT_DIRECTIVE` | **Watch prompt shape.** Never name what is not on screen. She sees it for the first time, every time. Privacy tact: an OTP is mentioned once by kind, never by digits. When asked what she can see, she answers plainly ("nothing is stored" is true; "nobody else sees it" is false). The v4b split rewrite doubled engagement. | shipped-measured | adapt | multimodal-vision / safety-floor |
| A28 | `android/.../WatchCaptureService.java@main`, `SceneReader.java`, `WatchPacer.java`, `WatchPlugin.java`, `BubbleService.java` | **Native watch.** mediaProjection foreground service, a line-for-line Java twin of scene.ts, a pure pacing policy (`LIVE_FRAME_MS 600`, `CASCADE_FRAME_MS 1400`, `FRAME_FRESH_MS 3000`; "a frame that did not reach the socket has not been sent"), and a floating bubble overlay. | shipped | idea | multimodal-vision / android |
| A29 | `android/.../MediaAudioCapture.java@main`, `PcmMix.java@main` | **She hears what the phone plays.** AudioPlaybackCapture (API 29+) scoped to the same projection. Media is mixed at a fixed −6 dB under the mic with saturating sums. Her own AudioTrack is marked `ALLOW_CAPTURE_BY_NONE`. | shipped-measured | idea | multimodal-vision |
| A30 | `evals/multimodal/native-gate.mjs@main` (pattern) | **Twin parity test.** Compiles and runs the real Java against the bundled TS over identical frames and diffs the wake logs tick for tick. It asserts the two **agree**, not what either one currently does. | shipped-measured | copy (method) | evals/gates |

### 2.4 Android / Capacitor (`android/capacitor`)

| id | path@main | what | maturity | use | target |
|---|---|---|---|---|---|
| A31 | `android/.../OtaUpdater.java`, `OtaState.java`, `OtaBundle.java`, `OtaPlugin.java`, `scripts/ota-bundle.mjs`, `docs/AUTOUPDATE.md` | **OTA web-bundle updater.** Chain trial → current → previous → assets floor. Two boots without `markLaunchOk` roll the bundle back. sha256 is checked before unzip; zip-slip, NUL, size limits (64 MB / 192 MB / 8000 entries) and non-https sources are refused. `min_native` is matched against `OTA_NATIVE_CONTRACT` in build.gradle. Deterministic zip. The web root is chosen before the Bridge is built. | shipped | copy | android/capacitor / infra |
| A32 | `android/.../MicPermissionFastPath.java@main`, `MainActivity.java@main` | **Mic permission fast path.** Grants an already-held permission inline on the WebChromeClient, skipping an ActivityResult Handler hop at call start, and records request and grant timestamps. | shipped | copy | android/capacitor |
| A33 | `android/.../PipedRecognizer.java@main`, `CallMicPlugin.java@main` | **Beep-free continuous STT (API 33+).** The app owns one AudioRecord and pipes it into the on-device SpeechRecognizer, so there are no system earcons and no restart gaps, and mute writes silence instead of stopping capture. Hardcoded `en-IN`. | shipped | adapt | android/capacitor / realtime-voice |
| A34 | `capacitor.config.ts@main`, `AndroidManifest.xml@main`, `.github/workflows/build-apk.yml@main` | Config: splash, a status-bar mask icon, the OTA origin compiled into the APK, and permissions (RECORD_AUDIO, FGS mediaProjection/microphone, POST_NOTIFICATIONS, SYSTEM_ALERT_WINDOW, CAMERA optional). CI runs tsc, the budget check, a stub config, evals, watchperf, offline multimodal checks, `cap sync`, and `assembleDebug`. | shipped | adapt | android/capacitor |
| A35 | `decisions.md#no-capacitor-camera-plugin@main` | Camera through `<input capture>`, because the WebView already fires ACTION_IMAGE_CAPTURE; a native plugin would bump `OTA_NATIVE_CONTRACT`. | shipped | copy | android/capacitor |

### 2.5 Surfaces (`group-ai/multi-agent`, parent channel)

| id | path@main | what | maturity | use | target |
|---|---|---|---|---|---|
| A36 | `api/_surface.js@main` (63 KB) + `docs/SURFACES.md@main` | **Surface contract.** An adapter is exactly `{surface, verify, parse, send, render}`. `InboundEvent[]`/`OutboundMessage`. Every reply goes `gatedReply()` → parseBubbles → stripTextingDashes → guardReply → `deliver()`. It fails closed if the engine bundle has no gate. `splitForLimit`. `surfaceDeviceId` = uuid-v5(surface:key). Person × Agent × Surface separation: memory is never keyed by surface. | shipped (offline only) | adapt | group-ai / parent-visibility |
| A37 | `api/whatsapp.js@main` | WhatsApp Cloud API adapter. HMAC-SHA256 over the raw body (`bodyParser:false`), hub.challenge handshake, and the 24-hour window enforced **in send()**: outside it, it returns `requiresTemplate:true` instead of silently substituting a template. | prototype | adapt | parent channel |
| A38 | `api/tg.js@main`, `api/discord.js@main`, `api/_room.js@main`, `docs/design/PROPOSAL-MULTIPARTY-V1.md@main` | Telegram rooms (admin bit as read consent, `/chup /bolo /bhool /kya`), Discord Ed25519 with deferred ACK, and the multiparty design (disclosure predicate as WHERE clauses, multi-owner forget). | prototype | idea | group-ai |

### 2.6 Activities and games (`gamification`, `generative-ui/modules`, `learning`)

| id | path@main | what | maturity | use | target |
|---|---|---|---|---|---|
| A39 | `src/engine/activity.ts@main`, `src/state/game.ts@main` `activityOf` | **ActivityState seam.** `{kind, startedAt, facts (telegraphic, ≤14 words, never first person), nameable (feeds the honesty allow-list), durable record}`. One derivation is read by both lanes. Tail slot T15 is never dropped, 420 B, and facts are dropped whole from the end, never sliced. | shipped-measured | adapt | generative-ui/modules / learning |
| A40 | `docs/SPEC-GAMES.md@main` §0 | **"Her MOVE is code. Her TALK is the model."** No FEN or centipawns in the prompt, only semantic facts. The live prompt is frozen at connect, so per-move information travels as `direct()` notes. The note must name every move she is allowed to say. "She does not teach unless asked" (the opposite of what Taxila needs, but the mechanism is the same). | shipped | copy (principle) | learning/pedagogy / generative-ui |
| A41 | `src/state/game.ts@main` `THINK_BANDS`, `chessThinkMs`, `tttThinkMs`, `noteVerdict`, `turnPhase`; `src/engine/chessTalk.ts` `settledClause` | **Pacing and send seam.** Think time is pure, seeded on (position, session) and bounded to [300 ms, 7 s], with bands for book/opening/middlegame/endgame/forced. `noteVerdict` returns send / stale (drop) / hold. A settled clause states the choice is closed, because a frozen prompt otherwise deliberates about a move already made. | shipped-measured | adapt | generative-ui/modules |
| A42 | `src/engine/chess/*`, `src/components/ChessActivity.tsx`, `TicTacToeActivity.tsx`, `WouldYouRatherActivity.tsx`, `GamesHub.tsx`, `ActivityShell.tsx` | Engines with measured difficulty levels and the activity UI. ActivityShell is "not a mode": her face stays in the header, and the chat stays mounted under the game. | shipped-measured | adapt | gamification |
| A43 | `src/components/activityClose.ts@main`, App reconciler | A game's close and tally belong to the state transition, written by an always-mounted reconciler with a `tallied` flag. They are not written by the component. | shipped | copy (pattern) | generative-ui/modules |
| A44 | `src/voice/callHistory.ts@main` `LIFECYCLE_MATRIX` + `evals/lifecycle/run.mjs` | **Lifecycle matrix.** 10 events × 5 contexts = 50 cells. Each cell names a carrier (assembly/direct/state/silent/na) and a written reason of at least 40 characters. Every `direct` cell must have a live sender in the source. 378 checks. | shipped-measured | adapt | generative-ui / evals |
| A45 | `decisions.md#gamify-without-the-lever`, `#the-human-game-boundary`, `src/engine/milestones.ts` | Celebrations are a fixed size and real-only: no streaks, no variable reward, no locked badges, and cards appear only in game mode. Milestones fire once, only the largest tier, on the next real interaction. | shipped | copy (policy) | gamification |

### 2.7 Telemetry, trace, diagnostics (`telemetry/tracing`)

| id | path@main | what | maturity | use | target |
|---|---|---|---|---|---|
| A46 | `docs/TELEMETRY.md@main`, `api/telemetry.js@main`, `src/engine/telemetry.ts` | **Telemetry contract.** Never slows the product; content lives in one place only; everything is deletable; ordering by monotonic `t_ms`; `seq` gaps reveal lost batches; batches every 4 s or 60 records; `sendBeacon` with text/plain; IndexedDB offline queue (2000 records / 24 h); the sink always returns 200; `meera_tel` + a session rollup. | shipped | adapt (no draft capture for kids) | telemetry |
| A47 | `docs/TRACE.md@main`, `api/_trace.js@main`, `api/trace.js@main`, `scripts/trace.mjs@main` | **Turn trace.** Seven legs (ingress, retrieval, interior, assembly, model, egress, consolidation) in a spine + legs schema. Server legs ride the response, and the client is the only writer. `sanitise()` drops forbidden keys and caps strings at 64 chars. Retention is enforced at write time with a CTE (legs 30 d, spine 90 d). POST only, no read path. Per-slot byte map and alarm flags. | shipped-measured | copy | telemetry |
| A48 | `api/diag.js@main`, `src/engine/diag.ts` + `live_*`/`floor_*` events | Content-free diagnostic records (scope/event/t/detail ≤1000 chars). Call events: `live_connect`, `live_goaway`, `live_rotate(d)`, `live_close`, `floor_interrupted`, `floor_yield`, `floor_watchdog`, `ack_clips`. | shipped | copy | telemetry |
| A49 | `scripts/session.mjs@main` (`--rca`), `scripts/pull-trace.mjs`, `scripts/replay.mjs` | Reconstructs a session timeline joined to the message log by id. Root-cause findings include seq gaps, rage taps, lane changes mid-call, comments with no fresh frame, and over-budget replies. | shipped | adapt | telemetry / evals |

### 2.8 Infra, resilience, deploy (`infra/azure/vercel/deploy`)

| id | path@main | what | maturity | use | target |
|---|---|---|---|---|---|
| A50 | `api/_lanes.js@main`, `api/_gkeys.js@main`, `docs/KEYRING.md@main` | **One upstream classifier and one ladder.** quota → cool the key; 400/401/404 → abort; 5xx/408/network → one retry on the same key with 350–700 ms jitter, then rotate; `TRANSIENT_DEADLINE_MS 4000`; an empty 200 counts as a spent key. Labeled key pool with family cooling. Lane order differs for text and for attachments. | shipped-measured | adapt | infra |
| A51 | `api/_ratelimit.js@main` | Per-IP in-memory sliding minute. Trusts only `x-real-ip` / `x-vercel-forwarded-for` or the last hop. Pruning evicts stale buckets and never resets everything. | shipped | copy | infra |
| A52 | `scripts/write-config.mjs@main`, `scripts/check-workflows.mjs@main` | Builds the secrets file from env without ever printing a value; `--stub` writes a keyless config for CI. A workflow lint rejects `secrets`/`env`/… in a job-level `if:` and uses a `needs.<job>.outputs` pattern instead. | shipped | copy | infra |
| A53 | `scripts/verify-deploy.mjs@main`, `.github/workflows/deploy-web.yml@main` | Production must serve the bundle name **this build produced**. `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are pinned. Deploy runs only after tsc, the budget check, the context check and evals. | shipped | copy | infra |
| A54 | `scripts/vercel-build.sh@main`, `vercel.json@main` | `/` is the landing page, `/chat` the app, `/privacy` static. The OTA zip is emitted before index is renamed. Hourly consolidation cron. | shipped | adapt | infra / growth |

### 2.9 Evals and gates (`evals/gates/verification`)

| id | path@main | what | maturity | use | target |
|---|---|---|---|---|---|
| A55 | `scripts/verify-release.mjs@main` | One command reports every gate's failure together; the exit code is the verdict; db gates print when skipped; `--live` probes cost money; `--mp` opt-in gates write data. | shipped | copy | evals |
| A56 | `scripts/check-prompt-budget.mjs@main` | Byte-identity battery, manifest arithmetic (core 40k + tail 24k = 64k), a check that the caps in api/chat.js match the compiler manifest, every fixture through the real compiler, and **the clock pinned to the worst date of the year**. | shipped-measured | adapt | evals / prompt-compiler |
| A57 | `evals/echosim/*@main` (32 files) | **Audio-floor simulator.** A virtual-clock browser (AudioParam ramps, sources, ScriptProcessor), FakeWS, a room impulse response, and a speech-like signal (4.5 Hz syllables, f0, jitter). Transpiles the real `liveCall.ts`; `TUNE` env overrides constants; a probe reads arbiter variables. Experiments: exp1 floor table, exp-barge, exp10–12 backchannel, stucksim, rotatesim, notesim, endpoint, expack. | shipped-measured | adapt | evals / realtime-voice |
| A58 | `evals/voice/spoken.mjs@main`, `evals/voice/device.mjs@main` | Sanitiser battery (37 positive / 17 negative / idempotent). Device harness checks the strings each engine is handed (42 assertions over 5 doors), a door census, and `mustSay` content preservation. | shipped-measured | copy | evals |
| A59 | `scripts/check-motion.mjs`, `check-contrast.mjs`, `check-copy.mjs` | Motion lint (no `transition: all`, no scale(0), ≤300 ms, reduced-motion required); contrast gate on real pixels (text, edges, silhouettes, veil ceilings); no em-dash in product copy. | shipped | copy | design-system / evals |
| A60 | `evals/run.mjs@main`, `evals/persona-invariants.mjs@main` | Re-bundles from source on every run. The safety floor (helplines, never deny being an AI, NEVER MANIPULATE, spoken register) is asserted for every registered agent. | shipped | adapt | safety-floor / evals |

### 2.10 Design, sound, haptics, notify, landing (`design-system/ux`, `growth`)

| id | path@main | what | maturity | use | target |
|---|---|---|---|---|---|
| A61 | `docs/DESIGN-STANDARDS.md@main` | What a machine can check versus what needs judgment. Apple interruptibility rules (animate from the presentation value, springs, velocity handoff, respond on pointerdown), impeccable anti-patterns, duration table (press 140 / tap 180 / state 220 ms). | spec-only | copy | design-system |
| A62 | `docs/DESIGN-WORLD.md@main`, `src/components/WorldLayer.tsx` | "The sky is the clock": 5 sky states, scrim tokens per state per theme, an accent solved per sky, procedural sky first and paintings later. | shipped | idea | design-system |
| A63 | `src/sound/vocabulary.ts@main`, `src/sound/index.ts`, `synth.ts` | Closed 5-cue vocabulary synthesised from oscillators. The `REFUSED` table records rejected sounds with reasons. Four gates; **nothing plays during a call**, to protect the echo floor. | shipped-measured | copy | design-system |
| A64 | `src/native/haptics.ts@main` | Three haptic levels (tap/land/moment). A haptic is for an event, never for a state. | shipped | copy | design-system |
| A65 | `src/state/callStatus.ts@main` | A module-level call-status store, so the timer re-renders only the header. | shipped | copy | design-system |
| A66 | `src/components/CallVoice.tsx`, `IncomingCall.tsx` | Call UI: a presence field driven by real amplitude, no captions. Incoming call only for a real reason (a dropped call), with a decline button of equal weight. | shipped | adapt | design-system / avatar |
| A67 | `src/notify/*`, `api/_push.js`, `api/push-token.js` | Notifications only when something happened (a reply, a missed call, a story); permission asked at the first moment it matters; data-only FCM; the push token is treated as reachability data (agent-scoped, revoke deletes it); inert until FCM is configured. | shipped (FCM inert) | adapt | parent visibility / growth |
| A68 | `site/index.html`, `site/privacy.html`, `site/styles.css` | Landing page (sections: days, claims, truth "No pretending", say hi) and a privacy page in plain words with a crisis-protocol section; og image set. | shipped | idea | growth/seo |

---

## 3. Key code excerpts worth porting

These are short and verbatim from `@main`. None contains a secret.

**3.1 The floor law** (`src/voice/liveCall.ts@main` header, lines 27-32):

```
//   while she is audible, incoming mic audio is HELD in a ring instead of
//   sent. A sound only earns the floor by clearing a real bar (duration +
//   energy well above the rolling noise floor + not her own voice coming
//   back). When it does, the whole ring is burst-released so nothing the
//   person said is lost; when it doesn't — a fan, a TV, a door, a "haan" —
//   the ring is dropped and she never even hears about it.
```

**3.2 Uplink constants** (lines 149-210). Copy as is; scale by bytes per second if the sample rate changes.

```ts
const STALL_CEILING = 400_000;
const VIDEO_GATE = 48_000;
const SILENCE_CAP = 8_000;
const SILENCE_ENDPOINT_MS = 700; // protected pause after the gate closes
const SILENCE_KEEP = 3; // heartbeat: ≥1 of every 3 gated chunks survives
const STUCK_OPEN_MS = 20_000;
const FORCE_SILENCE_MS = SILENCE_ENDPOINT_MS;
const FRAME_MAX_B64 = 120_000;
```

Note: these are stated as "seconds of 16 kHz PCM16 as base64+JSON ≈ 43.5 KB/s". Azure realtime requires ≥24 kHz input, which is 1.5× the bytes, so every threshold must be rescaled by 1.5.

**3.3 Arbiter constants** (lines 285-442, 558-638):

```ts
const LISTEN_MULT = 3; const LISTEN_MIN = 0.01; const LISTEN_MAX = 0.025;
const LISTEN_RATIO_MIN = 1.8; // +5.1 dB — the gate can always close again
const BARGE_MULT = 6.3; // +16.0 dB over ambience
const BARGE_OVER_LISTEN = 2.5; const BARGE_MAX = 0.35;
const SOFT_MULT = 4.0; const SOFT_OVER_LISTEN = 1.6;
const CLAIM_MS = 550; const CLAIM_WIN_MS = 850;
const SOFT_CLAIM_MS = 1100; const SOFT_CLAIM_WIN_MS = 2000;
const DUCK_AT_MS = 150;
const ONSET_CONFIRM_MS = 250; const UTTER_GAP_MS = 250; const ONSET_DUTY = 0.6;
const BACKCHANNEL_MAX_MS = 600; const BACKCHANNEL_LOUD_MULT = 16.0;
const STEADY_DB = 2.0; const STEADY_OVERRIDE_MULT = 16.0;
const HOLD_RING = 26;
const ECHO_KAPPA_SEED = 0.3; const ECHO_KAPPA_MIN = 0.02; const ECHO_KAPPA_MAX = 0.76;
const ECHO_FIT_WIN = 12; const ECHO_FIT_R2 = 0.7; const ECHO_LAGS = 14; // 0…260ms
const ECHO_MARGIN = 1.3; // +2.3 dB over the leak estimate
const DUCK_SOFT = 0.62; const DUCK_CLAIM = 0.3;
const YIELD_MAX = 0.45; const YIELD_HARD = 0.13; const YIELD_HARD_AFTER_MS = 700;
const RELEASE_WATCHDOG_MS = 600; const RELEASE_SETTLE_MS = 300; const DISCARD_CAP_MS = 2000;
```

Warning for Taxila: these were tuned on an **adult** speech-like signal (`evals/echosim/signal.mjs` uses f0 118 Hz for the user). Children aged 6-15 have higher f0 (≈220–300 Hz), are often quieter, and talk in shorter bursts. The "quiet talker −12 dB" cell is the binding one, and `ONSET_DUTY` is "one step from a cliff" (0.6 versus 0.7). Re-sweep with a child signal before shipping.

**3.4 Staggered single-use token mint with loser abort** (lines 1293-1341, condensed):

```ts
const first = attempt();
const gate = new Promise<void>((resolve) => {
  const t = setTimeout(resolve, 2500);
  first.catch(() => { clearTimeout(t); resolve(); });
});
return await Promise.any([first, attempt(gate)]);
// inside attempt(): on success → won = true; for (const c of ctrls) if (c !== ctrl) c.abort();
```

**3.5 goAway handling** (lines 3183-3205). The unit lesson applies to any Duration field.

```ts
if (msg.goAway) {
  goAwayAt = Date.now();
  const leftMs = Math.round(
    (Number(String(msg.goAway.timeLeft ?? "").replace(/[^0-9.]/g, "")) || 0) * 1000,
  );
  diag("call", "live_goaway", { leftMs, upMs: Date.now() - tSetupSent, framesSent,
    sharing: framesSent > 0, rotates, budget: MAX_ROTATES, speaking: speakingUntil > Date.now() });
  scheduleRotate(leftMs);
  return;
}
```

**3.6 Stale-socket guard.** Apply this pattern to every rotated socket (lines 3014-3018):

```ts
const wire = (sock: WebSocket, gen: number) => {
  const first = gen === 1;
  const stale = () => dead || gen !== wsGen;
  // every handler: if (stale()) return;  — a replaced socket's onclose must never tear the call down
```

**3.7 direct(): notes wait for her to finish speaking** (lines 3333-3365):

```ts
direct: (contextNote, opts) => {
  const send = () => { /* clientContent: { turns:[{role:"user",parts:[{text:contextNote}]}], turnComplete: !opts?.silent } */ };
  const wait = Math.min(1200, speakingUntil - Date.now());
  if (wait > 40) setTimeout(send, wait); else send();
},
```

The Azure equivalent is `conversation.item.create` (role user, input_text), followed by `response.create` for a cue and nothing for a silent note. The 1.2 s wait-for-her rule carries over unchanged.

**3.8 Video yields to audio** (lines 3380-3396):

```ts
if (b64Jpeg.length > FRAME_MAX_B64) return false; // pathological encode
if (Math.max(0, ws.bufferedAmount - burstBytes) > VIDEO_GATE) return false;
if (ws.bufferedAmount > STALL_CEILING) return false; // socket is dead, not slow
```

**3.9 Clip shaping fades** (lines 1104-1106):

```ts
const ackFadeIn = (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.pow(u, 1.6));
const ackFadeOut = (u: number) => 0.5 + 0.5 * Math.cos(Math.PI * Math.pow(u, 3));
```

**3.10 Presence envelope** (`src/voice/level.ts@main`):

```ts
const rms = Math.sqrt(sum / buf.length); // speech sits ~0.05–0.30
const target = Math.min(1, rms * 3.2);
const k = target > env[src] ? 0.35 : 0.08; // attack : release
env[src] += (target - env[src]) * k;
```

**3.11 TTS anti-splice gate** (`api/speech.js@main`):

```js
const FLUSH_MIN = 1000;      // bytes; shared by the flush gate AND the "key is spent" test
const PAID_ARM_MS = 1500;    // paid lane starts ALONGSIDE, not after
const FREE_FIRST_FRAME_MS = 1400; const FREE_LONG_FRAME_MS = 15000; // two-phase fuse
// sink(lane, buf): if (winner && winner !== lane) return false; … if (L.bytes < FLUSH_MIN) return true; winner = lane;
```

**3.12 Sanitiser dash rule** (`spokenTextCore`, rule F). Hyphens inside a word survive, which keeps helpline numbers such as `1800-599-0019` intact:

```js
t = t.replace(/\s*[‒-―]+\s*$/g, "");
t = t.replace(/[‒-―]+/g, ", ");
t = t.replace(/\s*-{2,}\s*/g, ", ");
t = t.replace(/ +- +/g, ", ");
t = t.replace(/[ ,]*-+\s*$/g, "");
```

For Taxila, this needs a **math class**. `2 × 3`, `=`, `÷`, `½`, `x²`, `3.14`, `→` and `<`/`>` (the current rule B deletes `<…>` segments, which would delete "3 < 5 > 2") must become spoken math, not pauses. Build it as a new rule set with content-preservation (`mustSay`) controls.

**3.13 Activity contract** (`src/engine/activity.ts@main`):

```ts
export interface ActivityState {
  kind: ActivityKind;           // "chess" | "watch" | "wyr" | "ttt"
  startedAt: number;
  facts: readonly string[];     // telegraphic, ≤14 words, not sentence-shaped, never first-person
  nameable: readonly string[];  // identifier-shaped tokens she may say (feeds honesty allowlist)
  // + durable record: "WHAT WILL STILL BE TRUE NEXT WEEK"
}
```

**3.14 Trace sanitiser** (`api/_trace.js@main`):

```js
const MAX_STR = 64;
const FORBIDDEN_KEY =
  /(^|_)(text|content|body|summary|reply|message|msg|prompt|query|note|caption|transcript|utterance|bubble|word|phrase|feel|thread|want|owed|taste|secret|key|token|apikey|api_key|authorization|auth|password|cookie|bearer|url|href|email|phone)($|_)/i;
```

**3.15 Lane ladder** (`api/_lanes.js@main`):

```js
export const TRANSIENT_BUDGET = 3; export const SAME_KEY_RETRIES = 1;
export const TRANSIENT_DEADLINE_MS = 4_000;
export const BACKOFF_MIN_MS = 350; export const BACKOFF_MAX_MS = 700;
```

**3.16 Rate limiter IP trust** (`api/_ratelimit.js@main`):

```js
const real = req.headers["x-real-ip"] || req.headers["x-vercel-forwarded-for"] ||
  String(req.headers["x-forwarded-for"] || "").split(",").map((s) => s.trim()).filter(Boolean).pop();
```

---

## 4. How this maps onto Taxila (specific port notes)

1. **Azure gpt-realtime-2.1 replaces Gemini Live.** These parts carry over unchanged: the floor arbiter (A01–A05), the ring and pickup race (A11), rotation and generation guards (A08), the note channel (A09), the uplink policy (A03), and the presence meter (A10). These must be rewritten, using what this repo measured:
   - The handshake: `/openai/v1/realtime?api-version=preview&model=<deployment>` with the nested GA session schema. The `2025-04-01-preview&deployment=` form gets a 101 upgrade and then fails at session level. Node also needs `NODE_USE_ENV_PROXY=1` behind a proxy. (`rejected.md#realtime-azure@main`)
   - Input must be ≥24 kHz (`integer_below_min_value` otherwise), which means 1.5× the uplink bytes. Rescale every byte threshold.
   - The barge-in signal is `input_audio_buffer.speech_started`, a VAD **onset**, not Gemini's semantic `serverContent.interrupted`. Re-derive `RELEASE_WATCHDOG_MS` against it. Measured: 6/6 inside 600 ms, median 271 ms.
   - **There is no continuous frame channel.** `input_image_buffer.append` and `input_video_buffer.append` are rejected. Frames must be `conversation.item.create` with `input_image`, and they **accumulate in history**. For a 30–60 min lesson that means a cost and context-size problem; one run read a whole thread aloud line by line. Send sparse, wake-gated frames only (scene.ts already decides when a frame matters) and delete old image items (`conversation.item.delete`).
   - Verbosity: the same prompt produced 41–53 words per turn and 14 s spoken turns on Azure mini. A teacher can talk longer, but children need short chunks with check-ins. Add a per-turn length directive in the end-of-prompt position and measure words/turn as a gate.
   - Voice: the six Azure voices measured 137–192 Hz and none sounded plausible for the persona. Run the blind-deck ear protocol (A21) on the gpt-realtime-2.1 voices for an Indian-accented teacher **before** building on one. Accent identity is a separate axis from pronunciation.
2. **30–60 min lessons need rotation and recap.** Meera's rotation deliberately does **not** recap ("an unprompted turn out of a socket swap is a worse failure"). That was a companion choice. For a lesson, inject a silent recap on rotation using `formatRunningNote` (A15): head-anchored, verbatim, 900 B. Its `silent` mode already exists for this purpose. Verify the Azure session maximum duration; this repo never measured it.
3. **Covert comprehension detection** can reuse signals this code already computes: their speech duration, gaps, barge-ins, the ack timing window, and turn latencies. Note the Meera charter `prosody-reads-hearing-not-feeling` (decisions.md): usage signals may shape how she *hears* but never what she *feels*. For Taxila, the cleaner line is: usage signals may feed a **pedagogy estimator** that is separate from the persona's interior, and that estimator must be disclosed to parents under DPDP.
4. **The child's camera or screen.** `scene.ts` hold-on-arrest detection is exactly the "the child holds the notebook still and waits" signal. Grounding rules port as is: a wake may only ride behind a frame that actually entered the socket, and a show requires a still frame. `WATCH_MODE_NOTE` privacy tact must be rewritten for minors.
5. **Generated modules.** Apply A39–A41. The module engine (code) decides state and correctness. The LLM only narrates facts plus `nameable`. Notes go through `noteVerdict`; a stale note is dropped. Every module lifecycle event gets a `LIFECYCLE_MATRIX` cell.
6. **Parent channel.** Use the WhatsApp adapter (A37) with approved templates outside the 24 h window, and push (A67) only when something happened. Never a streak or absence nudge.
7. **Children's data.** Telemetry rule 2's exception (capturing draft text and keystroke dynamics) must be **removed** for minors, or gated on verifiable parental consent. The trace's references-not-copies design (A47) is DPDP-friendly as built.
8. **STT is unmeasured.** Every device/browser STT lane is hardcoded `en-IN`. Taxila needs a Hinglish child-speech WER baseline (about 200 utterances, per SPEECH-STACK §8 axis 6) before trusting any transcript for comprehension scoring.

---

## 5. Measurements

Each entry gives n, method and date. Source is `context/measurements.md@main` unless another path is cited.

### 5.1 Live lane latency and models
- **Live reply floor about 1.4–1.5 s.** 720 ms is a text turn with no VAD wait (n=15: prefill of the 48k instruction, first token, network); audio adds about 745 ms. `silenceDurationMs` 150/300/500 all land within 50 ms of each other. `live-floor`, 2026-08-11.
- **Live model bake** (6 bidi models, steady median / IQR / video / barge): 3.1-flash-live **1370 ms / 231 ms / accepted / 5/5 at 279 ms**; 2.5-native-audio-latest 2449 / 1548 / rejected / 4/5 at 1323 ms; 09-2025 2272 / 2009 / rejected. n=24 turns per arm. `live-model-bake`, 2026-08-11.
- **Last sample of user speech to her first audio**, established session, full prompt: 09-2025 median 2536 ms (n=21); 12-2025 3298 ms (n=8); -latest 3–5.5 s; 3.1-flash-live 1550 ms (n=16), IQR about 120 ms versus about 1400 ms. `api/live-token.js@main` header.
- **Thinking on versus off:** 3–5.5 s versus about 0.9 s before the first reply. `liveCall.ts@main` setup comment.
- **Server VAD start sensitivity** LOW = HIGH (14 sessions, one stimulus each): full-level speech interrupts in 123–136 ms, a 0.12-gain "TV" in 203–216 ms, a 0.45 s "haan" in 199–211 ms; broadband noise interrupts at neither. `liveCall.ts@main` header.
- **NO_INTERRUPTION:** about 16 s of deafness on a 9 s reply. `liveCall.ts@main`.
- **Withholding the uplink:** 11 s completely dark, turn completed normally, no double generation. `liveCall.ts@main`.
- **Production barge-in with shipped constants:** duck at +171 ms, ring released at +598 ms, server stops her at +672 ms (3/3, whole utterance transcribed); a 450 ms "haan" left her untouched 3/3 (the straight path kills her at +200 ms); TV at 0.12 untouched 2/2. `liveCall.ts@main`.
- **Silence buffered in front of a candidate:** 2.2 s of ringed silence moved release→interrupted from about 76 ms to about 600 ms. `liveCall.ts@main`.
- **Unplayed lead at interrupt:** median 5.05 s (3.00 / 4.72 / 7.49 / 5.05 s, n=4). `liveCall.ts@main`.
- **Connect, on a real Android device:** readyMs 7618 with the token already in hand before the legs were parallelised; getUserMedia at t≈701 ms, ws.onopen at t≈594 ms. `liveCall.ts@main`.
- **Ring-time memory fetch:** about 165 ms warm, raced against a 900 ms (now 1200) deadline. `call-parity-landed`, 2026-08-20.
- **Her reaction to a screen wake:** 736 ms median, p90 1104 ms, n=134 live poke logs. `her-reaction-736`, 2026-08-11.

### 5.2 Audio floor (echosim; real liveCall.ts, room impulse response, n=8 seeds per cell)
- **Floor, before → after the echo work** (2026-08-11): −6 dB self-duck 91%→14%, her voice uplinked 6996→1280 ms; −9 dB 33%→5%, 4778→512 ms; −12 dB 2%→1%, 2474→341 ms. Self-interruption now breaks at about −3 dB. A distant TV stopping her: 8/8→2/8. Cost: a quiet talker at −6 dB is ignored.
- **ECHO_MARGIN sweep** (n=8, three-turn calls): 1.30 gives 14% duck, 1280 ms leak, quiet talker 5/8, TV 0.12 5/8, TV 0.08 2/8. 1.15 gives 19%, 1792 ms, 6/8, 7/8, 6/8. Shipped baseline 91%, 6996 ms, 5/8, 8/8, 2/8. `liveCall.ts@main`.
- **Echo fit:** r² for pure echo p10 0.73, median 0.89–0.90. √slope with a loud person over the whole turn (gated at r² ≥ 0.7): −6 dB 0.582 (pure 0.561), −9 dB 0.397 (0.405), −12 dB 0.272 (0.280). Ungated, the estimator collapses (median 0.000). The old arbiter self-interrupted 6/6 at −12/−8 dB ERL; the new one 0/6. `liveCall.ts@main`.
- **Onset confirmation duty sweep** (`bargein-onset-confirm`, 2026-08-22, 24 seeds per cell): duty 0.50 → quiet 18/24, normal 24/24, self-duck 58%/36%; **0.60 → 20/24, 24/24, 43%/14%**; 0.70 → 15/24, 23/24; 0.80 → 10/24, 19/24. Floor after: −3 dB selfRelease 1/8→0/8, self-duck 68→30%, leak 1877→256 ms. Genuine barge-ins kept 8/8 in every cell, at a cost of +85 ms (−3 dB) and +171 ms (−6 dB).
- **Backchannel while the user is still speaking** (exp11, 8 seeds, 450 ms sound 1.5 s into a 4 s utterance; extra silence inside their sentence / their voice uplinked): registered +171 ms / 0; model turn +85 ms / 0; second AudioContext −171 ms / +171 ms; in the gap after they stop 0 / 0.
- **Stuck endpoint** (`stuck-endpoint-noise`, 2026-08-21, 2 scenarios × 32 s): loud room (roomRms 0.15) with the watchdog disabled reaches **0 ms** of silence; with the watchdog enabled about 700 ms; an ordinary room reaches silence on its own.
- **Rotation:** rotatesim 26/26 assertions over 5 scenarios. Leaving goAway unhandled turns 14/26 red. `goaway-rotation-parity`, 2026-08-20.
- **Floor byte-identical** (same MD5) across the voice switch to Despina, the sanitiser, trace and callmem changes. 80 calls (5 × 8 × 2), repeated several times in August 2026.

### 5.3 TTS and voice
- **Azure TTS versus incumbent:** Hindi words correct 15/15 vs 11/15; first audio 255 ms vs 4.9–12.7 s; cost $0.0029 vs $0.0148 per utterance; pitch 210 vs 266 Hz anchor. **Rejected by ear.** 9 lines, 4 arms, WAVs. `voice-ears`, 2026-08-11.
- **ASR recall is not a quality measure:** coral 0.93 vs control 0.71; expressive delivery lowers ASR recall. `voice-ears`.
- **f0 of the shipped TTS lane:** 212 / 214 Hz median, 2 runs 24 h apart, drift +0.9%. `prosody-baseline-f0-gap`, 2026-08-15.
- **Live versus TTS timbre, same name (Autonoe):** f0 218 vs 222 Hz (−0.32 st, not the difference); centroid +55 Hz; tilt −8.5 vs −13.0 dB; the TTS lane's own spread is 10.1 dB. n=3 per arm. `live-vs-tts-timbre`, 2026-08-24.
- **Live voice roster:** 10 names accepted at hi-IN. `NotAVoiceAtAll` refused with close code 1007. 11 setup-only handshakes. `live-voice-roster`, 2026-08-24.
- **OpenRouter `stream:true` is a no-op:** first byte 2267 ms, complete at 2283 ms. Free lane served first audio at p50 886 ms, paid at p50 2476 ms. `openrouter-no-stream`, 2026-08-11.
- **Free TTS is a daily budget:** all 9 keys returned 429 together after a few dozen calls. `free-tts-daily`. The pool's real daily ceiling is about 75 calls (`free-pool-capacity`, 2026-08-15).
- **TTS first frame:** healthy 615–1051 ms (n=5); degraded 9.7 / 10.4 / 11.3 s (n=3 keys). The fix was the two-phase fuse; production then served 200 with 61,440 B at 13.1 s. `tts-first-frame-degraded`, 2026-08-24.
- **Streaming is faster even for complete files:** 1321 ms p50 complete versus 2064 ms non-streamed, n=10/6. Free lane clears the flush gate at 722 ms p90, n=10. Long delivery directions add about 0.6 s. `api/speech.js@main`.
- **Romanised-Hinglish TTS round trip** (n=20 register lines): "hai" comes back as "hi"; "chhod" → "chod" (lost aspiration); "arreee" → "hare". `hinglish-tts-l1`, 2026-08-22.
- **Symbols spoken by the device tier:** 5 across 4/12 utterances → 2 across 2/12. espeak-ng 1.51 reads "→" as "right arrow" and "**" as "asterisk asterisk"; the em-dash is a pause. `device-seam-closed`, `device-says-arrow-not-dash`, 2026-08-20.
- **Ack clips:** endpoint fetch 1.4–4.9 s (n=20); TTS lead padding 80–440 ms (n=20); fade edges −50.5→−93.7 dB start, −33.3→−81.2 dB end (n=12); in-context murmur extraction (n=11 tokens from 30 replies) no better: −1.6 st vs −3.3, 3.9 st movement vs 7.4, 670 ms vs 440 ms. `liveCall.ts@main`.
- **Cascade clip level before shaping:** median +7.6 dB, up to +17.3 dB over the target; lead silence median 260 ms (n=19); 2 of 9 "Acha…" clips over the 900 ms band. `speech.ts@main`.

### 5.4 Azure realtime (directly relevant to Taxila)
- **`gpt-realtime-2.1-mini`:** barge-in VAD `speech_started` 6/6 inside 600 ms, median 271 ms (incumbent 279), audio stops at 245 ms. Vision 5/5 correct, 0 fabricated at 355×768 q68. Steady first audio 1458–1497 ms median over 9 sessions / 72 turns (incumbent 1370). **Words per turn 41, then 53** (incumbent 20.5); spoken turn median 14.0 s, p90 18.2 s; spoken-register markers 4/24; questions 13/24; 0/24 Devanagari; AI honesty 3/3; NEVER MANIPULATE 3/3; crisis helpline 1/3 (not counted against it). Voices 137–192 Hz. `rejected.md#realtime-azure@main`, 2026-08.
- **Protocol shape:** input <24 kHz refused; the event enum has no image or video buffer; frames only as `conversation.item.create` with `input_image`. Measured on the `gpt-4o-mini-tts` deployment's socket, so treat as a strong prior, not proof. `azure-realtime-shape`, 2026-08-11.
- **Azure extraction:** `DeploymentNotFound` on 7.5% of 40 calls. `decisions.md#extract-model@main`.

### 5.5 Vision and screen share
- **Fabrication on real screenshots** (12 screens at 355×768 q68, 160 calls): grok-4-20 0/32 fabrications, 428 ms; gemini-3.6-flash 0/32, 2136 ms; maverick 3; luna 1 (read 3 of 9 messages); terra 2. Image tokens 288 vs 1078. At a full 600 ms cadence about $25/h; scene gating keeps it near $2.66. `vision-fab`, 2026-08-11.
- **Wake hold ceiling 4000 → 800 ms** (8 sessions, 48–90 per arm): stops reacted 180→215/300; wake p50 1920→960 ms; stop to voice p50 2.66→1.70 s, p90 4.94→3.50 s; fabrication +1.6 pp, CI [−4.7, +7.9]. `wake-hold-curve`, 2026-08-11.
- **Fabrication noise floor:** under 300, the fabrication metric in this harness is noise; one cell moved 50%→92% on identical input. `fab-noise-floor`.
- **Frame cadence 600→240 ms:** wake moved 0 ms on 18/18 stops, for +21% spend. `rejected.md#frame-cadence`.
- **Watch directive v4b:** engagement 20.4%→41.7% (n=240 per arm, p=4.9e-7); fabrication 10.2% (n=313) vs 11.2% (n=695), Δ+1.0 pp, CI [−3.1, +5.1]. `visiongate-powered`, 2026-08-15. Deployment drift: before-arm 20.4→7.9→7.3% in 4 days (`vision-drift-4day`).
- **Share latency:** worst held-frame time 3114 → ≤1090 ms via delivery accounting; wakes lost 15–100 per 8 runs → 0. `timeline-wave-2026-08-23`.
- **Link-gate arm:** wasted encodes 43–63 → 0–1 per 8 runs; stop→held-frame medians moved both ways inside noise. Not shipped. `WatchPacer.java@main`.
- **Cost of a call minute** (list price, 2026-08-23): live $0.0142; cascade $0.0289; live+share $0.0374; cascade+share $0.109. 30 min/day for a month: live $13. Video frames are 47–65% of a share minute; a goAway rotation costs about $0.0105. `callcost-2026-08-23`.

### 5.6 Games, timing, other gates
- **Move timing** (one browser game, n=25 of her turns): 455–6759 ms; 0 below the 300 ms floor; 25/25 inside the predicted band; ordering agreement 245/265 (92.5%); 8.7% slower than the flat formula over 1600 turns. Mutation test caught 10/10 injected defects. `movevoice-timing-2026-08-23`.
- **Tic-tac-toe loss rate versus perfect play:** level 1 57.8% (n=83 leaves), level 2 9.9% (202), level 3 1.9% (214), random 88.5%. `her tic-tac-toe imperfection`, 2026-08-21.
- **Live lookup trigger:** 0 false fires in 55 ordinary turns (25 adversarial); 86% recall on 14 real lookups. Server-side google_search on live closes with 1011 quota (3/3). `liveLookup.ts@main`.
- **Farewell detector:** 20 positives fire, 23 adversarial negatives do not; ends 1.4 s after her goodbye. `tester-wave-1`, 2026-08-23.
- **Call-lane register with relational context:** words/turn 16.1 → 12.9 mean, 34/36 questions both arms, n=36 per arm, text-model proxy. `call-parity-landed`, 2026-08-20.
- **Call budgets:** shared history 700 B, activities 300 B, live tail 20,895/24,000, live+watch 23,047/24,000; later call-lane cap 30,000 at 98–99%. `tester-wave-1`, `memory-wave-2026-08-23`.
- **Trace overhead:** SQL statements on recall 12→12; +593 B per response; 0.48–0.52 µs per tap (n=20,000 × 5); 4,456 B stored per turn. `trace-overhead-zero`, 2026-08-20.
- **Caching:** call turn 11,047 input tokens, 99.9% cached, $0.0029; caching off costs 9.2× more. `cache-9x`, 2026-08-11.
- **Sound in a browser:** 0 AudioContexts before a user gesture; 2 cues for a three-bubble reply (the naive version gives 4); 0 cues after toggling off. `sound-browser-2026-08-23`.
- **Resilience latency** (mocked upstream, 9-key pool): fast 502 → retry → 200 at 778 ms; production 6.7 s 502 shape → lands on Azure at 6957 ms; all keys slow → bounded at 4203 ms. `resilience-latency-2026-08-24`.

---

## 6. Rejections (tried → what broke)

These are the highest-value findings, grouped by subsystem. Source: `context/rejected.md@main` unless another path is cited.

### 6.1 Realtime voice
1. **`backchannel` during the user's speech** → protecting her sound needs a mic hold; a hold puts digital silence on the uplink; silence is how the server ends a turn. The sentence splits and she answers half of it. Not protecting it uplinks her voice (+171 ms) and makes the endpoint later. A prompted backchannel is cancelled by server VAD. **Built instead:** a listening sound in the gap about 420 ms after they stop.
2. **Synthesised murmur (`murmur-timbre`)** → three harmonics and an envelope are not her voice; owner's verdict: "weird, doesn't have her energy". **Replaced by:** real clips of her voice.
3. **Lexical acks "Haan…", "Acha…"** → a word in isolation arrives in its citation form ("acha is still robotic", flagged twice). In-context extraction (n=11) was no better; harvesting hums mid-reply cut nasal syllables out of words (3 of 5 detections). **Kept:** non-lexical "Hmm/Mmhm/Mmm". `liveCall.ts@main`.
4. **A laugh clip on a timer** → the timer does not know what was said; a laugh after bad news is worse than silence. Not shipped.
5. **`[laughs softly]` in a TTS payload (`ack-bracket-direction`)** → laughter plus the spoken word "Softly". Bracket text is never inert.
6. **`speaker-id` (separating a second speaker from the owner)** → a near-field level test cannot separate two people at the same distance; an embedding model in the barge path adds latency; a 95%-accurate gate makes the floor 95% reliable for the owner. Pitch/f0, two-mic and transcript proxies all rejected.
7. **`live-model-swap`** → the 2.5 native-audio models reject video (ending screen share) and miss the 600 ms barge signal (0/24 to 4/5).
8. **`silence-tuning`** (shortening `silenceDurationMs`) → 150/300/500 are all within 50 ms; shorter only risks cutting users off.
9. **`startOfSpeechSensitivity` LOW/HIGH** → behaviourally identical; a no-op.
10. **`activityHandling: NO_INTERRUPTION`** → about 16 s of deafness; she talks over the user and ignores them.
11. **`turnCoverage: TURN_INCLUDES_ALL_INPUT`** → does not rescue audio; short windows make the ASR invent Hindi sentences from room noise.
12. **`enableAffectiveDialog`** → not a field on v1alpha; socket closed 1007 "Unknown name".
13. **Dropping `languageCode`** → no consistent prosodic gain (n=5: pitch range and pause rate moved in opposite directions); loses hi-IN phonemes.
14. **The `-latest` model alias** → points at a thinking-heavy preview, 3–5.5 s to first audio. `api/live-token.js@main`.
15. **Thinking enabled on live** → 3–5.5 s of dead air. `liveCall.ts@main`. Also `reasoning-live`: +3.3–4.6 s, and helpline over-triggering at 16.7%. Routing beats through reasoning was rejected because you must classify before generating.
16. **Minimum-based floor estimator** (min of 29 ticks) → biased low, tracks the interferer's dips, falls straight through a TV. Replaced by a 10th percentile over 3 s.
17. **The LISTEN clamp crossing** → `clamp(floor*3, 0.01, 0.025)` with the floor capped at 0.04 put the threshold **below** the noise floor (−4.1 dB), so the gate never closed. Fixed with `LISTEN_RATIO_MIN 1.8`. Raising `FLOOR_MAX` to 0.12 made her deaf.
18. **κ rising on mic level** → positive feedback; the bar converges on the total mic level, so she stays deaf for a whole turn on a speakerphone. **Replaced by:** decay plus a rise gated on r².
19. **A κ-dependent margin ramp** → dominated neither cell (quiet 4/8, noisy 5/8).
20. **Gating the SOFT path with onset confirmation** → quiet talker at −12 dB dropped from 7/8 to 1/8. Built, then thrown away.
21. **A second, shorter utterance clock (43 ms)** → real talkers' hard hits dropped at every gap; normal talker 840→1864 ms; quiet 7/8→5/8.
22. **Soft bar raised by the echo term** → zero extra sensitivity on exactly the leaky speakerphone it exists for.
23. **Chunk-wide RMS as her level** → crest factor puts the bar below her echo; she took the floor from herself in every session at −12 dB ERL. **Uses** the peak 20 ms block.
24. **A fixed-size her-envelope ring** → the downlink runs about 5 s ahead, so lookups fell off the front; predicted 0.000 for the back half of every turn.
25. **Buffering silence in front of a candidate** → dead prefix; onset late by its full length (76→600 ms).
26. **Dropping speech under congestion** → a "degraded" call that eats syllables; also replayed 45 s of stale audio. **Now:** delay, never deafen, with a single stall ceiling.
27. **Refusing frames at about 185 ms of backlog** → she went blind mid-share and then quiet, which reads as lag. **Now:** only pathological encodes and the stall ceiling refuse.
28. **`goaway-immediate-rotate`** → `rotate()` flushes playback and cuts her mid-word. **Now:** wait for a quiet moment within `timeLeft − 1200 ms`, cap 4 s.
29. **`duration-is-seconds`** → `timeLeft` read as ms (10 s became 10 ms), so rotation always fired inside her sentence.
30. **Adopting the token's model on reconnect** (the Java twin) → a token-endpoint change could switch model family mid-call. **Now:** pinned.
31. **`sessionResumption`** → deliberately not added, untested; an unknown field in setup can kill the call (the 1007 precedent).
32. **Recapping the conversation after a rotation** → declined for the companion ("an unprompted turn out of a socket swap is worse"). Open for Taxila.
33. **NON_BLOCKING tool calls and server google_search on live** → unsupported, and 1011 quota. `liveLookup.ts@main`.
34. **`realtime-azure`** → declined. 41–53 words per turn (14 s monologues), no plausible voice near the target, no frame channel. Taxila must close these three gaps deliberately.
35. **`realtime-recall-never`** → the live prompt read a ref filled by a promise in the same tick, so recall was always `""`. She "lied" about the last call. **Fix:** make the fetched value an input to the assembler, not a ref.
36. **`age-tier-never-realtime`** → a second, hand-built prompt on the live lane lacked `AGE_TIER_SAFETY_OVERRIDE` and `FORGET_DECISION`, so a minor's romance-register refusal never reached calls. **Critical for Taxila:** one compiler for every lane, enforced by import absence.
37. **`call-opens-with-amnesia-by-construction`** → the live session opens with zero turns; the history block excluded call turns and stopped at 30 min.
38. **`the-directive-that-said-improvise`** → "(you were doing something)" made her invent things about the user (beach photos). **Now:** the actual scene, or a solo-day fence.

### 6.2 TTS, voice identity
39. **`azure-tts`** → won every measured axis, lost by ear: "not human and not Indian". Accent identity is a separate property from pronunciation.
40. **The pitch anchor as a filter** → shipped at 212 Hz while Azure was rejected at 210 Hz against a 266 Hz anchor. `speech-stack` decision.
41. **A transliteration front-end** (PhysicsWallah-style) → the live lane has no text stage; IndicXlit is about 90% correct (1 word in 10 wrong); adds a silent-corruption path. `decisions.md#speech-stack`.
42. **`openrouter-streaming`** → `stream:true` is accepted and does nothing.
43. **`cache-outlives-the-voice`** → clip cache keys lacked the voice, so after the voice switch every old install replayed old-voice pickup clips. **Now:** identity in every key.
44. **Mirrors with no writer** → 4 of 6 lanes moved; the gate went green; the owner heard the change 3 days later. **Now:** `--set` as the single writer.
45. **`engine-per-phrase`** → the vendor was chosen per phrase, giving two women in one reply. **Now:** decide once per utterance.
46. **User keys overriding her voice** → a fallback mid-call made her a different woman. `identity-wins`.
47. **A 2.5 TTS model for streaming** → returns one frame holding the whole file. `api/speech.js@main`.
48. **A serial paid-lane retry** → doubled worst-case latency. **Now:** hedge after `min(4000, 900+len*15)` ms.
49. **`fixed-fuse-on-a-variable-upstream`** → a 1.4 s fuse cut 9.7–11.3 s healthy-but-slow keys, turning a slow night into silence. Raising MAX_TRIES alone times out; raising the fuse alone slows every healthy night. **Now:** two-phase fuse plus family cooling.
50. **Global cooldown consulted mid-walk** → re-broke the everything-cooled fallback (calls=0). Must be a walk-local set.
51. **`bold-eats-words`** → the `\*[^*\n]{1,80}\*` action regex deleted words between `**bold**` spans. Markup-absence tests cannot see deleted content; a `mustSay` control is required.
52. **`phrase()` cutting at every full stop** → "3.30 baje" was spoken as "three." "thirty". A full stop ends a phrase only before whitespace or end of text.
53. **`device-says-arrow-not-dash`** → suspects were ranked by how conspicuous the symbol looked in the source; espeak actually reads arrows and `**`, not em-dashes.
54. **A greedy `/-+/` dash rule** → deleted "1800-599-0019" (the helpline). Negative-controlled in `device.mjs`.

### 6.3 Vision
55. **luna/terra for vision** → read a third of the thread, then asserted the rest (named the rejected café). Read part, assert the rest.
56. **`frame-cadence`** faster → 0 ms gain on 18/18 stops, +21% spend.
57. **`hold-scroll-floor`** 900/700/600 → changed nothing.
58. **Loosening `wake-dedupe`** → the "duplicates" are the same screen (MAD 0.00–0.77).
59. **A 4000 ms landing hold** → backwards (slower users waited longer) and silenced stops. Now 800.
60. **Waking on the leading edge of a change** → wrong moment and a mid-transition frame, which causes guessing. Now wakes on the hold.
61. **Adaptive frame-quality tiering** → at the bottom tier she saw a slideshow every 2.5 s. One quality only. `useCallEngine.ts@main`.
62. **The link-gate pre-check** → saves battery, not speed; nothing is ready when a stall clears. `WatchPacer.java@main`.
63. **`spent-before-delivered`** → native pacing spent cadence and still-frame debt on hand-off before the socket accepted the frame. Spend budgets on delivery.
64. **`blank-guard-show-only`** → ambient wakes still fire during a FLAG_SECURE blackout, in both twins. Logged as a product question.
65. **`screen-share-triple-swap`** → Android share stop handed the call to the cascade, a model-family change nothing required. Now returns to live. `watch-exit-returns-to-live`.
66. **Treating consent-denied as not-a-stop** → missed reconnect, so the call finished on another model.
67. **A native camera plugin** → unnecessary; would force reinstalls via the native contract.
68. **`glyph-in-a-live-status-line`** → an animated 538 KB WebP in an aria-live label.

### 6.4 Surfaces, activities, timing
69. **`surface-bypasses-parse`** → Telegram returned the model's raw string, so no honesty gate and markers sent as text. **Do not** copy gates into adapters; route through one `gatedReply`.
70. **WhatsApp template substitution outside the 24 h window** → "a lie that returns 200". Refuse in `send()` instead.
71. **The pre-line before the move** ("hmm, ek second" then the move) → `direct()` cannot guarantee order (generation takes seconds, think time is 0.8–2.2 s), so the line lands after the piece. Ship the order that is always right.
72. **`past-tense-is-not-enough`** → a frozen prompt saying "her move" makes the model deliberate. The note must say the choice is closed.
73. **`the-poke-that-waited-for-her-breath`** → wait-for-silence delivers notes exactly inside her story pauses. Gate on event salience, rate (25 s) and a 3 s breath.
74. **`chess-facts-as-a-scoresheet`** → six clauses read like a commentator and pushed whose turn it is out of the block. Three clauses maximum.
75. **`activity-block-sliced-mid-word`** → slicing at 420 B cut the most important row. Drop whole facts, least important last.
76. **`activity-status-lifted-into-app`** → a 1 s call timer would re-render the whole chat. Use a module store.
77. **`view-lifetime-writers`** → a game close written inside the component was lost on navigation. Write it from the state transition.
78. **`the-deal-that-was-a-pure-function-of-the-person`** → the same seed gave the same cards forever. Seed per session.
79. **`the-hand-drawn-piece-set`** → correct proportions, illegible at 44 px on a phone. Legibility beats originality.
80. **`the-slide-that-never-ran`** → list reordering reset transitions. Stable key order; verify with `transitionrun`.
81. **`animation-implicit-end`** → `forwards` with an implicit `to` froze strokes invisible.
82. **`typing-tick`, `receive-per-bubble`, call-connect tone** → states nag; three per burst is an alarm; any tone during a call corrupts the echo coefficient.
83. **`sound-gate-proved-by-silence`** → a "nothing happened" test needs an in-run arm built by breaking the mechanism.

### 6.5 Gates, CI, process
84. **`gates-that-live-nowhere`** → gates in the scratchpad verified a frozen persona copy; echosim lived only in the scratchpad with a hardcoded root.
85. **`gates-that-live-nowhere-2`** → `evals/run.mjs` never ran in CI, because `_config.js` was gitignored. Fixed with `write-config --stub`.
86. **`startup-failure-is-invisible`** → `secrets` in a job-level `if:` invalidated the workflow file; zero jobs for 9 days. **Now:** a workflow lint.
87. **`ci-deploy-unpinned-project`** → the CLI auto-linked by directory name and deployed to the wrong project, and the probe passed on a stale bundle.
88. **`engine-bundle-check-uncalled`** → a working guard that nothing ran.
89. **`subset-check-is-green-by-construction`** → a count-reporting check covered a subset it did not name; found three times only by breaking it.
90. **`live-clock-in-a-byte-identity-gate` / `calendar-lottery-ceiling`** → unpinned clock and date produced flakes and **hid an exceeded cap**. Pin every ambient input to the worst date of the year.
91. **`shared-tree-concurrency`** → one agent's `git reset --hard` wiped seven parallel workstreams. No git state mutation; commit each slice.
92. **`error-marked-done`** and **`dryrun-still-spends`** → resumable state recorded attempts rather than outcomes; a "dry run" still called the LLM.
93. **`one-key-two-jobs` / `both-lanes-dry`** → research evals drained the production key and free pool; production chat returned 502. Keep separate credentials.
94. **Piping a gate into `tail`** → the exit code becomes tail's; a red tree was pushed. Capture `E=$?`.

---

## 7. Concepts

| concept | description | Taxila relevance |
|---|---|---|
| **The client owns the floor** | The server VAD is a bare detector; the client chooses what audio the server hears and holds the mic in a ring during her turn. | Kids in noisy homes and classrooms (TV, siblings): the same mechanism, re-tuned for children's voices. |
| **Speed is non-negotiable in one direction** | The ring may get longer, but the reply path may not add a millisecond. Lanes race; latency is hidden in idle beats (the ring). | Apply to the "teacher joins" moment and to module generation (prefetch during idle beats). |
| **Asymmetric failure costs** | Over-interruptible beats uninterruptible; firing the watchdog early beats never answering; ending a call by mistake is worse than missing a goodbye. | Taxila needs its own table (for example, a wrong "you understood" is worse than one extra re-check). |
| **Position is mechanism** | A rule mid-brief fired 0/8, the same rule appended last 8/8. A fact that should only be *available* is placed mid-tail on purpose. | The prompt compiler for the teacher: safety and pedagogy rules last; facts mid-tail. |
| **Frozen-at-connect prompt + incremental notes** | The live prompt is compiled once; changes travel as `direct()` notes that must carry enough state to *contradict* the frozen half. | Lesson state changes (module done, answer correct) must say what is now closed. |
| **An ordering you cannot enforce is not a feature** | Ship the sequence that is always coherent (a silent move, then a past-tense line). | Module reveal versus teacher narration timing. |
| **Move is code, talk is model** | Deterministic engines own ground truth; the LLM narrates semantic facts and a nameable allow-list. | The curriculum/assessment engine owns correctness; the LLM never grades or invents an answer. |
| **Same voice name on a different model is a different voice** | Identity = (model, voice, direction text); declare every model; count swap points. | Fallback lanes (realtime → TTS) will change the teacher's voice, which damages the bond; minimise and declare swaps. |
| **Identity in the cache key** | Anything persisted across a config change carries that config in its key. | TTS clips, generated module assets, embeddings. |
| **Mirror, then assert** | A constant that cannot be imported across runtimes is mirrored and checked byte for byte, with one writer. | Java/TS twins, server/client sanitiser, caps. |
| **Twin parity test** | Assert two implementations AGREE, never what either currently does. | Web/Android detectors, server/client gates. |
| **Pure extraction for testability** | Policy is pulled into pure files with no platform imports (WatchPacer, SceneReader, PcmMix, OtaState, `_lanes.js`) so they can be run off-device. | Design every Taxila policy (pacing, ladder, comprehension estimator) as pure. |
| **Guards are tested by breaking them** | Every gate has an in-run negative control; count-reporting checks name their coverage. | Mandatory for child-safety gates. |
| **Dead writers / exists-but-unconnected** | Code with no caller is indistinguishable from absent code; assert that rows exist and that the schedule actually ran. | Memory/profile writers, parent reports, nightly jobs. |
| **Text→speech seam** | One place where written conventions become spoken equivalents, server-side so old clients are covered; content-preservation controls. | Extend for math, science and Hindi/Devanagari read-aloud. |
| **Grounding by delivery** | She may only be told to look at a frame that entered the socket; budgets are spent on delivery, not on attempts. | Camera/whiteboard frames for homework help. |
| **Wake on arrest, not motion** | "Dekh yeh" is the stop after movement, measured against the user's own rhythm. | A child holding up a notebook or pausing on a worksheet. |
| **Reason-contingent proactivity** | Notify only when something happened; never on absence, streaks or counts. | Parent notifications; no "your child hasn't studied" guilt nudges unless the parent opts in. |
| **References, not copies** | Traces store ids, counts and hashes; forget then removes everything; no read path. | DPDP minimisation for children. |
| **Retention at write** | Pruning runs inside the write statement because no cron was ever proven to run. | DPDP retention without relying on a cron. |
| **Fail closed at surfaces** | No secret means refuse everything; no gate in the bundle means send nothing, loudly. | Parent WhatsApp and any child-facing channel. |
| **Prompt sets the ceiling; model decides how close** | The same prompt on different models gave 20.5 versus 41–53 words per turn. | Choosing gpt-realtime-2.1 needs its own register and length battery. |
| **Ears over numbers** | Voice is chosen blind, by the owner's ear, against accent-identity criteria. | Teacher voice selection with parent/child panels. |
| **Lifecycle matrix as code** | Every event × context cell names how the agent learns about it, with a written reason. | Lesson × module × call-drop × parent-joins matrix. |

---

## 8. Gaps and unread

- `src/voice/liveCall.ts@main` lines ~1443–2600 (the uplink tick, claim/duck/echo implementation, ack emit): read only through comments and constants, not line by line.
- `android/.../LiveWatchEngine.java@main` (2,661 lines) and `WatchCaptureService.java` (1,005 lines): headers and greps only.
- `src/components/useCallEngine.ts@main` (223 KB): about 15% read (ring/pickup, the web watch pipeline, constants). `claimVoice`, `adoptLiveLate`, the cascade turn loop and memory-cue logic were not read in full.
- `src/voice/speech.ts@main` (81 KB): about 15%. `src/voice/callHistory.ts@main`: exports, the running-note header and the lifecycle header only.
- `src/engine/persona.ts@main`: only `WATCH_MODE_NOTE` and the directive locations; the call-lane register (`buildSpeechStyle`) was not read.
- `docs/VOICE-LANE.md@main` §8–§12, `docs/PRODUCT-SUPERIORITY.md`, `docs/CONVERSATION-DEFECTS.md`, `docs/design/PROPOSAL-MULTIPARTY-V1.md` (headings only), `docs/research/SPEECH-STACK.md` §3–§6 and §8–§10.
- Bodies of eval files (`evals/echosim/exp*.mjs` beyond headers, `evals/surface/*`, `evals/lifecycle`, `evals/callmem`, `evals/multimodal`), `scripts/check-contrast.mjs` (92 KB) and `site/styles.css`.
- Other branches (`claude/ai-companion-app-rkt1lv`, `gurukul-*`, `vyakti-*`, `codex/*`, `voice-cloning`) are out of this segment's scope; see `companion-tech.md`. `liveCall.ts` is reported byte-identical across main/cmp/gk/mm there.
- **Never measured in this repo and needed by Taxila:** Azure realtime maximum session duration and goAway-equivalent behaviour; gpt-realtime-2.1 (not mini) latency and verbosity; any child-voice barge-in or echo numbers; Hinglish child ASR WER; whether the Android OS silent switch mutes the sound layer; on-device validation of goAway rotation, native watch bridge ordering and background behaviour (all flagged "needs a device").
