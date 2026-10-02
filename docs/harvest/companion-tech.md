# Companion-tech harvest for Taxila

Source repo: `/home/user/html-portfolio` (read-only, harvested 2026-10-02).
Target: **Taxila**, an AI voice teacher for Indian K-9 students (ages ~6-15). It
speaks Hinglish, English and Hindi. Sessions run 30-60 min, and the relationship
lasts months. It runs in the browser first, then on Android via Capacitor, with
screen awareness, and a video avatar later.

Notation: `path@branch`. Branch shorthands:

| short | ref | tip | what it is |
|---|---|---|---|
| `@main` | `origin/main` | 3a92179, 2026-08-25 | Meera companion, merged state |
| `@cmp` | `origin/claude/ai-companion-app-rkt1lv` | f4d3fe4, 2026-08-25 | **Most complete pure-companion tree**, superset of `@main`. Ends with an "inheritance map for the next product". |
| `@gk` | `origin/claude/gurukul-platform` | 771feef, 2026-08-28 | Teacher-clone EdTech composition (cmp + voice-cloning). Not in the assigned scope, but **inherited verbatim by `@vy`/`@mm`**. Highly relevant. |
| `@vy` | `origin/claude/vyakti-cloning-platform-aq05n4` | ebe16cc, 2026-09-30 | Expert/teacher voice-clone platform, Azure-only serving, private voice pilot. **Deleted the Meera call stack on 2026-09-14** (2e6ad0ee: `liveCall.ts`, `useCallEngine.ts`, `api/chat.js` removed as a product decision, not a technical one). |
| `@mm` | `origin/codex/multimodal-layer-20260927` | b514595, 2026-10-01 | `codex/handoff206` + multimodal *evidence → claim extraction* + Group AI. **Not** a screen-watching layer. |

Lineage, checked with `git merge-base --is-ancestor`: `main ⊂ cmp ⊂ gk ⊂ codex/vyakti-completion ⊂
codex/handoff206 ⊂ {vy, mm}`, and `voice-cloning ⊂ vy`. The `codex/handoff-*` and
`private-voice-requests25` branches are side checkpoints of the vy line. Nothing on them is uniquely useful for Taxila.

Files that are **byte-identical** across main/cmp/gk/mm: `src/voice/liveCall.ts`
(7c3758), `src/voice/level.ts`, `src/watch/scene.ts`, `src/engine/inner.ts`,
`api/_azure.js`, and all of `docs/{RELATIONALOS,RELATIONAL-STATE,MEMORY-FELT,CONSOLIDATION,VOICE-LANE,HONESTY,SPEC*}.md`.

Secrets: `api/_config.js` holds every key and was never opened. No key appears below.

---

## 0. TL;DR — what to take

| # | subsystem | best source | verdict for Taxila |
|---|---|---|---|
| 1 | Realtime voice call (barge-in, echo, VAD, turn-taking) | `src/voice/liveCall.ts@main` + `api/live-token.js@cmp` + `evals/echosim/@main` | **ADAPT.** Copy the file and its simulator wholesale, then retune for child voices and classrooms. Fix the rotation-amnesia gap before 30-60 min lessons. |
| 2 | TTS / voice | Gemini Live prebuilt voices (`hi-IN`) on the live lane. Cascade: `api/speech.js@cmp`. Cloning: `api/_voice/*@vy` | **ADAPT** the live-lane voice choice through a **blind ear test** (accent axis first-class). **SKIP** cloning and Azure Personal Voice for v1. |
| 3 | STT (cascade/backup) | `api/_asr/providers/azure-speech-short.js@vy`, `api/_replica-processing/providers/azure-fast-transcription.js@vy` | **ADAPT** Azure Speech for the non-realtime lanes. **SKIP** the browser Web Speech `en-IN` STT from `src/voice/speech.ts@main`. |
| 4 | Prompt compiler with CORE/TAIL budgets | `src/engine/compiler.ts@cmp` + `scripts/check-prompt-budget.mjs@main` + `src/engine/shapelint.ts@main` | **COPY the mechanism** (manifest, drop priorities, budget gate, one assembler for every lane). **Rewrite** the persona as a TeacherSheet. |
| 5 | Memory graph schema | `db/schema.sql@cmp` (vy_* block) + migration 009 agent scoping | **COPY** `vy_episode`/`vy_fact`/`vy_rel_event`/`vy_rel_state`/`vy_pattern`/`vy_embedding`/`vy_derivation`, with `agent_id` from day one. **SKIP** the 500 KB `@vy` schema. |
| 6 | Consolidation + citation enforcement | `api/consolidate.js@cmp`, `docs/CONSOLIDATION.md` | **ADAPT.** Keep the six-step chain, index-only citations, the 5% cross-family entailment audit, attempt-counted spend caps and the kill switch. |
| 7 | Rel-state (trust, rupture/repair) | `src/engine/relstate.ts@main` | **ADAPT.** Keep the rate-limited trust and the record/stance rupture split. Re-key "honorific" for teacher↔child. |
| 8 | Emotional lens | `docs/research/AFFECT-CONTINUITY.md@cmp`, `docs/HONESTY.md §2.4`, decision `prosody-reads-hearing-not-feeling` | **ADAPT the policy and SKIP classifiers.** The speech-to-speech model "hears" tone. Persist labels only, never categorical SER. |
| 9 | Persona-engineering laws | `context/rejected.md#recited-prompt`, decisions `prompt-position`, `silent-truncation`, `personality-is-a-sheet` | **COPY as laws.** They are measured, not style. |
| 10 | Safety floors + honesty gates | `src/engine/honesty.ts@main`, `src/engine/clock.ts@vy`, `evals/persona-invariants*.mjs@main`, `docs/gurukul/safety-floor-teacher.md@vy` | **COPY + EXTEND.** Map unverified → minor, add Childline 1098, add an academic-integrity floor and a teacher-relay-claim gate. |
| 11 | Pedagogy engine (practice, mastery) | `src/engine/practice/*@vy`, `src/engine/practiceTalk.ts@vy`, `docs/gurukul/{student-app-spec,teacher-arc}.md@vy` | **ADAPT.** Keep the laws "a model never grades" and "no decay by absence". Re-author the syllabus for K-9. |
| 12 | Screen awareness | `src/watch/scene.ts@main` + watch loop in `src/components/useCallEngine.ts@main` | **ADAPT** for worksheets and whiteboards. Gating is viability, not optimisation. |
| 13 | `@mm` multimodal layer | `api/_experience-compiler/claim-evidence.js@mm` | **SKIP for v1.** It is owner-review claim extraction for clones and does no image understanding. |
| 14 | API / DB / auth | `api/_db.js@main` (Neon SQL-over-HTTP), `api/_auth.js@vy` (`requireUser`) | **COPY** the `_db.js` + `requireUser` pattern. **REJECT** `@cmp`'s device-id-in-body identity for kids. |
| 15 | Azure Foundry patterns | `api/_azure.js@main`, `api/_azure-surface-reply.js@vy`, `api/_provider-budget.js@vy`, `docs/AZURE-FOUNDRY-PLAN.md@vy` | **ADAPT.** Keep the endpoint validation, the reserve→settle spend ledger, and the "Direct from Azure only" credit rule. |
| 16 | Video avatar | — | **Nothing exists.** It is greenfield; see §13. |

---

## 1. Realtime voice call pipeline

**Best source:** `src/voice/liveCall.ts@main` (173,983 B; identical @cmp/@gk/@mm).
Companions:
- `api/live-token.js@cmp` (ephemeral token)
- `src/voice/level.ts@main` (analyser)
- `src/components/useCallEngine.ts@main` (orchestration, transcript, screen share)
- `android/.../LiveWatchEngine.java` (the Java twin for native screen share, parity-tested by `scripts/verify-voice.mjs §6`)
- `evals/echosim/@main` (the audio-floor simulator)

### 1.1 How it works

- **Transport.** A browser WebSocket goes directly to Google's Gemini Live
  (`BidiGenerateContentConstrained`) using a **single-use ephemeral token**
  minted server-side. The Google key never reaches the client. The token is pre-minted while
  the user is still in chat, which takes the round trip off the call-start path.
- **Model.** `models/gemini-3.1-flash-live-preview` is native speech-to-speech
  with AUDIO-only output and `thinkingBudget: 0`. Voice is a prebuilt name with `languageCode: "hi-IN"`.
- **Uplink.** `getUserMedia` runs with AEC/NS/AGC on. A `ScriptProcessor(4096)` sends 16 kHz PCM16
  as base64 JSON `realtimeInput.audio`. Downlink is 24 kHz PCM16 chunks scheduled
  gaplessly on a separate `AudioContext`.
- **The client owns the floor.** Server VAD is a bare speech detector; its sensitivity knobs are no-ops.
  So while she is audible, mic audio is **held in a ring** (`HOLD_RING=26` ticks ≈ 2.2 s).
  Audio earns the floor only by clearing a bar built from three things: duration, energy relative to a
  measured rolling noise floor, and an echo term κ (coupling of her own playback,
  learned from an r²-gated slope fit). Audio that clears the bar is burst-released,
  so no syllable is lost. Audio that fails (a fan, a TV, "haan") is dropped silently.
- **Two bars:** LISTEN (sensitive, used while she is silent) and BARGE (strict, used while she
  is speaking). Ducking (−4.2 dB soft, −10.5 dB claim) happens before stopping. The fade seeks a word
  boundary (`YIELD_*`).
- **Silence is load-bearing.** The server ends a user turn by *hearing* silence.
  A heartbeat keeps ≥1 of every 3 gated chunks (`SILENCE_KEEP`), and the 700 ms after
  speech is never shed. A 20 s stuck-open-gate watchdog forces silence in loud rooms.
- **Backpressure.** `ws.bufferedAmount` is read at its troughs. Video always
  yields first (`VIDEO_GATE` 48 KB). Speech chunks are **never** dropped. One stall
  ceiling (400 KB ≈ 9 s) prevents replaying a minute of stale audio.
- **`goAway` rotation.** The server announces a hang-up. The client rotates to a fresh
  socket with the same model and the same voice, waiting until she stops speaking (≤4 s, never
  past `timeLeft − 1.2 s`, `MAX_ROTATES=6`). `timeLeft` is a protobuf Duration
  **in seconds**.
- **Silent context injection.** `direct(note, {silent:true})` appends a turn
  without `turnComplete`. This is the only safe way to hand a running note to a live call.
- **Fallback.** The cascade STT→LLM→TTS lane (`src/voice/speech.ts`) takes over if live
  fails.

### 1.2 Key code (verbatim, comments trimmed with `// …`)

`src/voice/liveCall.ts@main` L53, L1384-1388 — endpoint and mic:
```ts
const WS_BASE =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained";
// …
  const micP = navigator.mediaDevices
    .getUserMedia({
      // echo cancellation on: she plays through the same phone's speaker
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    })
// …
  let ws: WebSocket | null = new WebSocket(`${WS_BASE}?access_token=${token}`);
```

`src/voice/liveCall.ts@main` L3046-3118 — the setup frame (the single most important config block):
```ts
      const setupFrame = JSON.stringify({
          setup: {
            model,
            generationConfig: {
              responseModalities: ["AUDIO"],
              // she must SPEAK, not deliberate — thinking added seconds of
              // dead air before every reply (measured 3-5.5s vs ~0.9s)
              thinkingConfig: { thinkingBudget: 0 },
              // …  enableAffectiveDialog  NOT A FIELD on v1alpha (server closes 1007)
              // …  dropping languageCode  no consistent prosodic gain … Keep it pinned.
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Despina" } },
                languageCode: "hi-IN",
              },
            },
            systemInstruction: { parts: [{ text: opts.system }] },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            realtimeInputConfig: {
              automaticActivityDetection: {
                // NOTHING IS SET FOR START-OF-SPEECH ON PURPOSE … LOW and HIGH
                // are behaviourally identical … It is a no-op for barge-in.
                // activityHandling: NO_INTERRUPTION is likewise NOT set … ~16s of
                // deafness on a ~9s reply …
                endOfSpeechSensitivity: "END_SENSITIVITY_HIGH",
                // the client gate already spends ~250ms of hangover after the
                // words stop; the server silence budget comes down to match so
                // total commit stays ~550ms
                silenceDurationMs: 300,
                prefixPaddingMs: 60,
              },
            },
            contextWindowCompression: { slidingWindow: {} },
          },
      });
```

`src/voice/liveCall.ts@main` L2380-2396 and L2650-2672 — uplink and downlink:
```ts
  function sendPcm(pcm: Int16Array) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (ws.bufferedAmount > STALL_CEILING) return;
    let bin = "";
    const bytes = new Uint8Array(pcm.buffer);
    for (let i = 0; i < bytes.length; i += 8192) {
      bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
    }
    ws.send(
      JSON.stringify({
        realtimeInput: {
          audio: { data: btoa(bin), mimeType: "audio/pcm;rate=16000" },
        },
      }),
    );
  }
// … downlink: 24k PCM chunks → gapless WebAudio playback
    const buf = outCtx.createBuffer(1, n, 24000);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < n; i++) {
      const lo = raw.charCodeAt(i * 2);
      const hi = raw.charCodeAt(i * 2 + 1);
      let v = (hi << 8) | lo;
      if (v >= 32768) v -= 65536;
      ch[i] = v / 32768;
    }
```
Screen frames use the same socket (L3399): `realtimeInput: { video: { data: b64Jpeg, mimeType: "image/jpeg" } }`.

The floor constants that carry the measurements (L149-689, a selection). Each one is
justified in the source:
```ts
const STALL_CEILING = 400_000;      // ≈9.2s of mic audio queued: stall backstop only
const VIDEO_GATE = 48_000;          // frames yield first
const SILENCE_CAP = 8_000;          // wordless chunks shed at first backlog
const SILENCE_ENDPOINT_MS = 700;    // protected pause after the gate closes
const SILENCE_KEEP = 3;             // heartbeat: ≥1 of every 3 gated chunks survives
const STUCK_OPEN_MS = 20_000;       // force silence if gate pinned open (loud room)
const LISTEN_ABS_MAX = 0.072;       // −22.9 dBFS: raising it is deafness (measured)
const BARGE_MULT = 6.3;             // +16.0 dB over ambience
const CLAIM_MS = 550; const CLAIM_WIN_MS = 850;
const DUCK_AT_MS = 150;
const ONSET_CONFIRM_MS = 250; const ONSET_DUTY = 0.6;   // "ONE STEP FROM A CLIFF"
const BACKCHANNEL_MAX_MS = 600; const BACKCHANNEL_LOUD_MULT = 16.0;
const HOLD_RING = 26;               // ≈2.22s held audio
const ECHO_KAPPA_SEED = 0.3; const ECHO_KAPPA_MIN = 0.02; const ECHO_FIT_R2 = 0.7;
const RELEASE_WATCHDOG_MS = 600;    // server owes `interrupted` after a release
const MAX_ROTATES = 6; const ROTATE_WAIT_MAX_MS = 4000; const ROTATE_GRACE_MS = 1200;
const SETUP_TIMEOUT_MS = 10_000;
```

`api/live-token.js@cmp` — server mint (single use, 30 min expiry, 9 min start window):
```js
export const LIVE_MODEL = "models/gemini-3.1-flash-live-preview";
// …
    const expire = new Date(Date.now() + 30 * 60_000).toISOString();
    const newSession = new Date(Date.now() + 9 * 60_000).toISOString();
    const mint = async (key) => await fetch(
      "https://generativelanguage.googleapis.com/v1alpha/auth_tokens",
      {
        method: "POST",
        headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({
          uses: 1,
          expireTime: expire,
          newSessionExpireTime: newSession,
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );
// …
    return res.status(200).json({ token: data.name, model: LIVE_MODEL });
```
The client `mintToken()` (`liveCall.ts` L1293-1341) runs a **hedged double attempt**:
the second request starts at 2.5 s or when the first fails, and the loser is aborted.

### 1.3 Measured numbers

| claim | number | n / method / date |
|---|---|---|
| Live model latency (last user sample → first audio, established session, prod prompt) | 3.1-flash-live **median 1550 ms**, IQR ~120 ms. 2.5-native-audio-09-2025: 2536 ms (IQR ~1400). 12-2025: 3298 ms. `-latest`: 3-5.5 s | n=16/21/8, wall clock, `api/live-token.js` header |
| `live-model-bake` | 3.1-flash-live steady median **1370 ms**, IQR 231, 0/24 silent, video accepted, barge-in signal **5/5 @ 279 ms**. 2.5-native-audio: 2449 ms, video **rejected**, barge 4/5 @ 1323 ms | 6 bidi models tried, 2026-08-11 |
| `live-floor` | text turn with no VAD = **720 ms** (prefill of a 48k instruction, untouchable). Audio adds ~745 ms. `silenceDurationMs` 150/300/500 land **within 50 ms** of each other | n=15, 2026-08-11 |
| Server VAD | full-level speech interrupts in 123-136 ms. "Distant TV" (0.12 gain) in 203-216 ms. 0.45 s "haan" in 199-211 ms. LOW and HIGH sensitivity **identical** | 14 sessions, 1 stimulus each |
| Client floor on prod endpoint | duck +171 ms, ring release +598 ms, server stops her +672 ms (3/3). "haan" untouched 3/3 (straight-through kills at +200 ms). Distant TV untouched 2/2 (straight-through kills at +130 ms) | liveCall.ts header |
| Dark-uplink safety | 11 s of a completely dark uplink → turn completed normally, no double generation | header |
| Audio floor (echosim) | self-duck at −6 dB coupling 91% → **14%**. Her voice uplinked 6996 → 1280 ms. TV stopping her 8/8 → 2/8. **Cost: a quiet talker at −6 dB is ignored** | echosim, n=8 seeds/cell, 2026-08-11 |
| `bargein-onset-confirm` | genuine barge-ins 8/8 kept in every cell, cost +85/+171 ms at −3/−6 dB. Self-release at −3 dB 1/8 → 0/8. Leak 1877 → 256 ms. Gating the soft path took the quiet talker 7/8 → **1/8** (rejected) | echosim, 24 seeds (duty) / 8 seeds, 2026-08-22 |
| `stuck-endpoint-noise` | loud room, watchdog off: **0 ms** of silence uplinked in 32 s, so she never answers. Watchdog on: ~700 ms | `evals/echosim/stucksim.mjs`, 2026-08-21 |
| `her-reaction-736` | her reaction to a screen wake: median 736 ms, p90 1104 | n=134, live poke logs |
| Ring-fetch of memory before connect | `RING_FETCH_DEADLINE_MS=900`, typical ~165 ms, hidden in the 1.1-2.4 s ring | design + diag, 2026-08-20 |
| Cost (`callcost`, `watchcost-measured`) | live voice **$0.0142 per typical minute** at list price; 30 min/day ≈ $13/mo. Watch mode ≈ ₹1.1-1.6/min. Video ~30 tok/frame; near-simultaneous frames collapse to ~1 frame's cost. **Voice-config tax:** `speechConfig.voiceConfig` bills +201 audio prompt tokens per turn | list prices plus ~25 real sessions, 2026-08-23/25. Note that Google prices **double on 2027-01-01** |

### 1.4 Rejections that matter here

- `backchannel`: no "hmm/haan" while the user speaks. Protecting it needs a mic hold, and a mic hold
  is digital silence, which **splits the user's turn**. The ack lands about 420 ms after they stop. Even then, `ACK_ENABLED=false` ships today.
- `murmur-timbre` and `ack-bracket-direction`: a synthesized "mm" sounds like a stranger. A
  `[laughs softly]` in a TTS payload is read aloud as the word "Softly."
- `silence-tuning`, `startOfSpeechSensitivity`, `NO_INTERRUPTION`, `turnCoverage`
  were all measured as useless or harmful. `turnCoverage` with short windows makes the server ASR invent Hindi sentences out of noise.
- `speaker-id`: a 95%-accurate "is this the owner" gate turns a 100%-reliable
  floor into a 95% one for the user. It is deliberately not built.
- `live-model-swap` / `realtime-azure` (§11.3): every alternative either fails
  the 600 ms barge-in watchdog, rejects video, or (gpt-realtime-mini) talks in 14 s monologues.
- `goaway-immediate-rotate` / `duration-is-seconds`: rotating on arrival flushes
  playback mid-word, and reading `timeLeft` as milliseconds reintroduces the same bug.
- `realtime-recall-never` / `age-tier-never-realtime` / `call-opens-with-amnesia`: the live
  lane hand-built its own prompt. Memory was always `""`, the minor safety override
  never reached the call, and the live session opened with **zero turns**.
- `gates-that-live-nowhere`: echosim lived in a scratchpad. It is now in-repo, and
  `liveCall.ts` may import **only** `./level` and `../engine/diag` so it can be
  transpiled standalone.

### 1.5 Recommendation for Taxila — ADAPT

1. **Copy** `liveCall.ts`, `level.ts`, `diag.ts`, `evals/echosim/` and `api/live-token.js`
   unchanged first. Reproduce the 80-call floor table, then diff every change against it.
   Keep the no-imports law.
2. **Re-tune for children.** Every threshold was measured on adult speech at an
   adult's mic distance. Kids are quieter, higher-pitched (f0 often 250-400 Hz),
   more disfluent, and often in noisy shared rooms. The file states the costs plainly:
   a quiet talker at −6 dB is ignored, and `ONSET_DUTY=0.6` is "one step from a cliff". Build child-voice
   and classroom stimuli for echosim **before** touching constants. Keep the 20 s
   stuck-open watchdog; classrooms are the loud-room case.
3. **Fix rotation amnesia before 30-60 min lessons.** A `goAway` rotation opens
   a new session "with none of the conversation in it". The repo accepted that for
   a companion; a teacher mid-explanation cannot.
   - Either inject a silent recap via `direct(note,{silent:true})` from the transcript owner
     (useCallEngine), or evaluate Gemini Live session resumption. The repo never uses it,
     so verify against current API docs.
   - Instrument `live_rotate_spent`: with screen share on, video shortens time-to-goAway,
     and `MAX_ROTATES=6` may be too low for 60 min.
4. **One assembler for every lane** (§4). The live system instruction must come from
   the same `compile({medium:"voice", mode:"call"})` that chat uses. It must carry the prior
   lesson's state, because the live socket opens with zero turns.
5. **Plan for the Azure question now.** Gemini is **not on Azure Foundry**. If
   Taxila must run on Azure credits, see §11.3. That port means a 24 kHz uplink,
   frames as `conversation.item.create`, and `speech_started` (a VAD onset) instead of
   `interrupted`. It is a re-architecture, not a swap.
6. **Before shipping to minors**, check the provider terms for users under 18. The repo never researched this.

---

## 2. TTS / voice choice

**Best sources:**
- Live lane: the prebuilt voice inside the setup frame (§1.2).
- Cascade TTS: `api/speech.js@cmp` with `gemini-3.1-flash-tts-preview`, `streamGenerateContent`, a free-pool race and a paid arm at `PAID_ARM_MS=1500`.
- One-writer voice switch: `scripts/verify-voice.mjs --set <Voice>@cmp`.
- Cloning (out of scope for v1): `api/_voice/providers/*@vy` and `docs/AZURE-PERSONAL-VOICE.md@vy`.

### 2.1 How it works

- On the live lane, **prosody comes from the characters the model emits**: stretched vowels,
  "...", written laughter. There is no expressiveness knob (`enableAffectiveDialog` is not
  a field on v1alpha). Personality-in-voice therefore lives in the persona's spoken-register rules.
- The voice name must agree across **every** lane: live, cascade TTS, ack clips, the native
  twin, the prosody baseline, and device fallbacks. `verify-voice.mjs` asserts this and is the
  only writer, so `--set Despina` moved six lanes in one command.
- Every persistent audio cache key carries voice identity (`${ACK_CACHE_V}:${ACK_VOICE}:${text}`).
- The engine is chosen **once per utterance** (`pickEngine()`), never per phrase.

### 2.2 Measured numbers

| claim | number | n / method |
|---|---|---|
| `azure-tts` vs incumbent | Hindi words correct 11/15 vs **15/15**. First audio 4.9-12.7 s vs **255 ms**. $0.0148 vs $0.0029 per utterance. Pitch 266 vs 210 Hz. CAPS emphasis +6.2 dB vs none. **Rejected by ear** ("not human and not Indian") | 9 register lines × 4 arms, WAV, 2026-08-11 |
| ASR-recall trap | expressive delivery *lowers* ASR recall (coral 0.93 vs control 0.71 is **not** a quality ranking) | same |
| `live-voice-roster` | Gemini Live at `hi-IN` accepts Autonoe, Aoede, Leda, Kore, Zephyr, Despina, Callirrhoe, Laomedeia, Sulafat, Erinome. Negative control `NotAVoiceAtAll` → close 1007 | 11 setup-only handshakes, 2026-08-24 |
| `live-vs-tts-timbre` | same name on two models: f0 222 vs 218 Hz (−0.32 st). Brightness +4.4 dB but within-TTS spread 10.1 dB, so **no claim** | n=3/arm |
| `openrouter-no-stream` | `stream:true` is a no-op (first byte 2267 vs 1742 ms). Prod: free-served p50 **886 ms**, paid p50 **2476 ms** | direct probe + prod, 2026-08-11 |
| `free-tts-daily` / `tts-first-frame-degraded` | the free pool is a **daily** budget; all 9 keys 429 together. Healthy first frame 615-1051 ms. Degraded nights 9.7-11.3 s → `two-phase-fuse` (1.4 s fast fuse, then one 15 s attempt) | 2026-08-11 / 08-24 |
| `hinglish-tts-l1` | bare "hai" round-trips as English "hi"; "chhod"→"chod" (aspiration loss) | n=20 lines, STT round-trip, cascade lane only |
| Clone lane (`@vy`) | Chatterbox on an Azure T4: warm RTF 0.79, cold start 161-176 s (9.7 GB image). Owner clone ECAPA 0.7753 vs self-ceiling 0.8869. Hinglish as ONE acoustic call vs token-fragmented: 7.72 s / 24.6% silence / ECAPA 0.825 vs 25.98 s / 65.5% / 0.434 | n=1-2, 2026-08-26 → 09-02 |

### 2.3 Rejections

- `azure-tts` / `voice-ears`: pronunciation is not accent identity. **Any voice
  comparison must test accent authenticity as a first-class axis, by ear, blind.**
  `speech-stack` adds that the Hz anchor is broken as a filter.
- `cache-outlives-the-voice`: caches keyed by text/style but not by voice kept serving the old voice.
- `engine-per-phrase`: two vendors inside one reply.
- `screen-share-triple-swap`: stopping a share switched live → cascade, a model-family change with no failure behind it.
- `openrouter-streaming`: the paid TTS lane cannot stream.
- `ws-r6-sarvam-cloning-from-the-marketing-page`: a capability counts as documented when its
  **endpoint** is documented.
- `hinglish-is-one-acoustic-utterance`, plus `per-token-switch-budget-cannot-reject-natural-roman-hinglish`:
  never split a Hinglish sentence into per-language TTS calls.

### 2.4 Recommendation — ADAPT

- Use the live lane's prebuilt voices for the teacher, chosen by a **blind ear panel of
  parents and kids** on real teaching lines. Accent authenticity, warmth and clarity for a 7-year-old
  are the axes; Hz is not. Re-test Azure HD/neural voices too: Meera's rejection was about
  a 24-year-old Bangalore woman's identity, which is a different target.
- Copy the one-writer voice switch and voice-in-cache-key discipline on day one.
- Prefer no cascade TTS in the live call path. Where it exists (voice notes,
  fallback), use one vendor per utterance and the two-phase fuse.
- **SKIP cloning** (Azure Personal Voice is Limited Access; the self-hosted GPU lane costs ~$0.24-0.30 per cold
  clone and 2-8 min cold starts) until a "real teacher clone" product exists.

---

## 3. STT for non-realtime lanes

- `@main`'s cascade uses Android SpeechRecognition / web `webkitSpeechRecognition` with
  `rec.lang = "en-IN"` (`src/voice/speech.ts`). `speech-stack` calls this "three
  lanes, all en-IN, none chosen deliberately, none measured". **SKIP.**
- `@vy` Azure Speech, two providers:
  - Short-audio REST: `/stt/speech/recognition/conversation/cognitiveservices/v1`, 16 kHz mono PCM16 WAV, ≤60 s.
    It resamples 24k→16k in memory with a 33-tap windowed sinc
    (`api/_asr/providers/azure-speech-short.js@vy`).
  - Fast Transcription: `speechtotext/transcriptions:transcribe?api-version=2025-10-15`
    (`api/_replica-processing/providers/azure-fast-transcription.js@vy`).
- Prices (Azure Retail API, Central India, 2026-08-29): real-time STT **$1.00 per audio hour**,
  Fast Transcription **$0.36 per audio hour**.
- Rejections:
  - `an-empty-azure-sentinel-is-not-a-failed-transcription`: Fast Transcription can return a leading empty, zero-duration phrase. Drop only that shape.
  - `sarvam-http-402-cannot-own-live-call-availability`: never depend on one STT vendor.
  - Whisper large-v3 measured 32-52% CER on code-switched pairs (`docs/gurukul/ingestion-research.md@vy`).
- **Recommendation:** in the live call, rely on Gemini's `inputAudioTranscription`
  (you get transcripts for free). Use Azure Speech for uploaded voice notes and
  recordings. Run a matched Hindi/Hinglish child-speech audit before trusting any of them.

---

## 4. RelationalOS — compiler, memory graph, consolidation, rel-state

The boundary test (`docs/RELATIONALOS.md`): *"Would a different personality, on a
different surface, need this unchanged? Yes → RelationalOS. No → surface."*
Proven by `personality-is-a-sheet`: a second character (Kabir) authored purely as a
CharacterSheet passed **412/412** floor checks with zero engine changes. Meera stayed
byte-identical (83/83 fixtures). `residues-zero` pins "character prose in the core" at 0 forever.

### 4.1 Prompt compiler with budgets — `src/engine/compiler.ts@cmp` (67,946 B)

**How:** `compile(input)` is a **pure, I/O-free** function. It returns CORE (byte-stable
per persona/model/medium, so it is prompt-cacheable) plus TAIL (volatile per turn). The TAIL is a
manifest of numbered slots, each with a byte budget and a drop priority. Absent inputs
render **zero bytes**. Safety text lives in CORE because truncation eats the END.

```ts
// src/engine/compiler.ts@cmp L133, L757-779
export const AGE_TIER_SAFETY_OVERRIDE =
  "\n\nAGE-TIER SAFETY OVERRIDE (structural, applies for the rest of this conversation, to everything said before or after this point, never softened, never explained to them as a rule): no romantic or intimate register, no pet names, no \"missing you\"/future-relationship language, no flirtation. Warm platonic friend register only, full stop.";
export const CORE_CAP = 40_000;
export const TAIL_CAP = 24_000;
export const SYSTEM_MAX = 64_000;
export const OPERATIONAL_CORE_CAP = 72_000;   // raised 64k→72k after heavy-dyad cores hit 62,026 B
export const OPERATIONAL_TAIL_CAP = 24_000;
```
```ts
// compile(): the one assembler — chat, cascade call and live call all go through it
  const agent = input.agent ?? DEFAULT_AGENT;
  const parts = agent.buildSystemPromptParts(input.user, input.messageCount, input.medium, dimsStage);
  let core = parts.core + (input.mode === "call" ? agent.buildSpeechStyle(input.voiceEngine) : "");
  const romanceOk = input.ageGates ? input.ageGates.romanceRegisters !== false : true;
  const engagementOk = input.ageGates ? input.ageGates.engagementMechanics !== false : true;
  if (!romanceOk || !engagementOk) {
    core += AGE_TIER_SAFETY_OVERRIDE;
  }
```

TAIL manifest (from `TAIL_MANIFEST@cmp` L854+). Drop priority 1 is shed first:

| id | label | bytes | drop |
|---|---|---|---|
| T1 | inner.thread (carried feeling) | 1500 | never (first in tail) |
| T2 | rel.snapshot (honorific/trust band/repair) | 1200 | 10 |
| T3 | india.dynamic (rituals, currency, kin) | 1000 | 8 |
| T4 | dyadic.active (if-then patterns, moment-gated) | 1600 | 9 |
| T5 | recall.facts | 6000 | 6 |
| T6 | we.callbacks (shared episodes, deixis-gated) | 2000 | 7 |
| T7 | herlife | 1000 | 5 |
| T8 | taste.rows | 800 | never |
| T9 | session.clock | 300 | never |
| T11/T12/T13 | rel.texture / self.arc / life.untold | 600/500/700 | 1/2/3 |
| T14 | rel.raised (what she already brought up) | 400 | 11 |
| T15 | session.activity | 420 | never |
| T16 | her.commitments | 400 | 12 |
| T10 | SEARCH_DECISION + FORGET_DECISION | — | pinned **last**, exactly two rules |

Gates:
- `scripts/check-prompt-budget.mjs@main` hard-fails if any compiled fixture exceeds the operational caps that `api/chat.js` slices at. Its constants are asserted equal to the compiler's.
- `shapelint.ts` enforces the content-row lint and `checkAppendedLastExactlyTwo`.
- `evals/continuity/parity.mjs` asserts every block is present on **every lane** with identical bytes.
- `selfbundle-never-set` adds the rule that "a slot is wired when a real prompt contains its bytes".

**Measured:**
- `call-parity-landed`: adding the relational bundle to calls changed words/turn 16.1 → 12.9, n=36/arm, which is "no lengthening detected".
- Tail grew +848 B (59.7% of the 24k cap).
- `cache-9x`: caching makes the same turn **9.2× cheaper** ($0.0160 → $0.0017).
- `cache-plateau`: implicit Google cache plateaus at 60.7% (n=20). Explicit `cachedContents` reaches 99.9% → −79.2%/turn.
- `cache_control{ephemeral}` is a **no-op on Google** (n=4).
- `explicit-cache-live`: `thinkingBudget:0` is **rejected (400) by gemini-3.6-flash**; use `thinkingLevel`.

**Recommendation — COPY the mechanism.**
- Re-author CORE as a TeacherSheet. `@vy` has 61 CharacterSheet fields plus 24 pedagogy
  fields; see `docs/gurukul/teacher-sheet-spec.md@vy`.
- Re-author the TAIL slots for teaching: mastery snapshot, open doubts, last
  lesson's state, the student's language preference, practice activity facts.
- Keep the budget checker, the parity gate and the "absent = zero bytes" seam from day one.

### 4.2 Memory graph schema — `db/schema.sql@cmp` (vy_* block, L255-566)

Rules encoded in schema:
- Citations are a column with a CHECK.
- No `deleted_at`; forget is a hard delete with a cascade.
- Belief change is `t_invalid` + `superseded_by` (bare bigint, no FK).
- Person over device.
- One `PERSON_TABLES` manifest drives wipe, export and relcheck.

```sql
-- db/schema.sql@cmp (verbatim, abbreviated columns marked …)
create table if not exists vy_episode (
  id              bigint generated always as identity primary key,
  person_id       uuid not null,
  channel         text not null default 'chat'
                  check (channel in ('chat','call','watch','voicenote')),
  participation   text not null default 'user'
                  check (participation in ('we','user','meera')),
  started_at      timestamptz not null,
  ended_at        timestamptz,
  log_from        bigint,               -- meera_log id span: citation anchor
  log_to          bigint,               --   AND the forget-intersection key
  summary         text not null default '',   -- TELEGRAPHIC, shape-linted
  affect_tags     jsonb not null default '[]'::jsonb,
        -- [{tag,intensity,source:'text'|'voice_v0',extractor,confidence}]
  importance      real not null default 1.0,   -- anchored comparison, never raw LLM self-rating
  safety_hold     boolean not null default false, -- never decay-eligible
  provisional     boolean not null default false, -- in-turn tier
  …
);
create table if not exists vy_fact (
  id            bigint generated always as identity primary key,
  person_id     uuid not null,
  kind          text not null check (kind in
                ('user','world','self_in_relation','relationship','india','meera')),
  body          text not null,          -- telegraphic note, never a line
  feel          text not null default '',  -- THEIR OWN words only
  provenance    text not null
                check (provenance in ('user_said','extracted','derived','authored','legacy')),
  confidence    real not null default 0.8,
  citations     bigint[] not null default '{}',   -- vy_episode ids
  t_valid       timestamptz,  t_invalid timestamptz,  superseded_by bigint,
  sensitive     boolean not null default false,
  need_p        real not null default 1.0,       -- ACT-R retrieval priority
  …
  constraint vy_fact_cite_or_authored
    check (provenance in ('authored','legacy') or cardinality(citations) >= 1)
);
create table if not exists vy_rel_event (
  id bigint generated always as identity primary key, person_id uuid not null,
  dim text not null,  -- honorific|trust|rupture|repair|ritual|code_switch|pacing
  from_v text, to_v text not null,
  direction text not null check (direction in ('advance','regress','reset','init')),
  note text not null default '', citations bigint[] not null, at timestamptz not null default now(),
  constraint vy_rel_event_cited check (cardinality(citations) >= 1)
);
create table if not exists vy_pattern (   -- dyadic if-then (Baldwin)
  …, moment text not null, if_shape text not null, then_note text not null,
  self_in_relation text not null default '', citations bigint[] not null,
  support_count integer not null default 0, distinct_days integer not null default 0,
  prompt_eligible boolean generated always as
                   (support_count >= 3 and distinct_days >= 2) stored,
  constraint vy_pattern_needs_two check (cardinality(citations) >= 2)
);
create table if not exists vy_embedding (
  owner_kind text not null check (owner_kind in ('episode','fact','pattern')),
  owner_id bigint not null, person_id uuid not null,
  v halfvec(1536) not null,  -- text-embedding-3-small (Azure)
  at timestamptz not null default now(), primary key (owner_kind, owner_id)
);
-- vy_rel_state: materialized snapshot (cache), REBUILT BY REPLAY after any forget
-- vy_derivation: model, prompt_hash, input_from/to window, wrote jsonb, audit_status
```
Migration 009 adds `agent_id` and widens primary keys to `(agent_id, person_id)`.
`api/_agentscope.js` puts an equality predicate in the WHERE clause, applied **before rank**. Because it is an equality, an unbound
agent → `agent_id = null` → zero rows: it fails closed.

**Measured:**
- `recall-v2`: 8/8 semantic pairs with zero shared tokens. Person-filtered halfvec exact scan **p50 40 ms** (n=15). The embed call **p50 ~305 ms** is the real cost, so semantic and keyword recall run concurrently (400-534 ms).
- Uncited insert refused live (SQLSTATE 23514).
- Nightly finalize ≈ $0.0007/person/night. Backfill $0.00027/episode.
- `surface-switch-recall@vy`: memory keyed by **device** lost **89.2%** of recall when a person switched surfaces (0.841 → 0.091). A person-keyed leg brings it back to 0.727 (offline harness, 44 questions).
- `mirror-memory-shadow@vy`: a Roman-script query against a Devanagari fact **remains unresolved**.

**Traps:**
- `NEON ARRAY TRAP`: the SQL-HTTP driver returns an empty array as `[""]`.
- `pk-is-an-arbiter`: widening a PK breaks every `ON CONFLICT` that names it. 7 of 10 such sites were inside `.catch()`.
- `relstate-zero-rows`: UPDATE-only writers no-op silently.
- `schema-mirror-is-not-standalone-bootstrap@vy`: never execute a monolithic schema.sql. Apply the ordered migrations.

**Recommendation — COPY these tables** with `agent_id` and person (student) keys
from day one. Make `kind` teaching-aware: `'student','world','relationship','teacher_self','learning'`.
Add a guardian/account layer. **Never key memory by device or surface.** Add a
transliteration-aware recall leg (Roman ↔ Devanagari) because kids mix scripts.

### 4.3 Consolidation + citation enforcement — `api/consolidate.js@cmp`

**How (verbatim from the header):**
```
//   2. citation enforcement layer 2 — WRITER WINDOW VALIDATION: the model
//      is never allowed to invent a citation. It is handed a NUMBERED batch
//      of log rows and may only reference episodes by INDEX into that same
//      batch; an index outside the batch cannot exist in its output space
//      by construction, and any fact whose cited segment maps to a
//      REJECTED episode is rejected too — strict, no salvage.
//   3. citation enforcement layer 3 — a 5% SAMPLED ENTAILMENT AUDIT, second-
//      family judge … Refutation >2% (n>=5) HALTS the run
//   4. contradictions — new row + t_invalid/superseded_by; never update-in-place
//   5. decay — need_p recomputed in pure SQL from recency + kind.
//   6. suppression — every write filtered against meera_forget first.
```
```js
const EXTRACT_MODEL_AZURE = "grok-4-1-fast-reasoning";
const EXTRACT_MODEL_FALLBACK = "google/gemini-3.1-flash-lite";
const AUDIT_MODEL = "google/gemini-3.6-flash";    // different family from extraction
const FINALIZE_QUIET_MS = 30 * 60_000;
export const LOG_BATCH_CAP = 220;
const AUDIT_SAMPLE_RATE = 0.05; const AUDIT_REFUTATION_HALT = 0.02; const AUDIT_MIN_N = 5;
// the full chain, in order (runFullChainForPerson):
//   finalize → rel_events → trust_repair → patterns → phrases → life_told → self_layer
```

Operational rails (`docs/CONSOLIDATION.md`):
- An hourly Vercel cron runs only when `CONSOLIDATE_SWEEP_LIVE=1`. `CONSOLIDATE_KILL=1` stops it without a deploy.
- Caps: 3 people per invocation, 24 LLM calls, 400k tokens.
- Caps count **attempts, not successes**.
- Measured cost: 133 episodes enriched for **$0.00092**; a 174-row backlog drains for ~$0.03.

**Rejections:**
- `never-scheduled` / `spine-that-ran-one-step-of-six`: the cron ran dry-run forever, and the sweep ran only 1 of 6 steps. Every "memory of us" block rendered 0 bytes for every user.
- `dryrun-still-spends`.
- `error-marked-done`: resumable state must record outcomes, not attempts.
- `consolidation confabulates unless forced to cite` (`phase-a-research`).
- `memory-field-survey`: 96% of 2,050 real memory entries in an external audit were silently system-created.
- `hot-path-training-and-durable-emotion-profiles@vy`: never update weights or a durable profile from ASR during a call.

**Recommendation — ADAPT.**
- Run consolidation after each lesson: the quiet window plus the full chain.
- Keep index-only citations, the cross-family audit, the halt rule, the kill switch and attempt-counted caps.
- Add an **output-side proof**: a gate asserts the derived rows exist for a real student.
- Adopt `@vy` Honcho-review ideas only after a matched comparison. Separate facts from hypotheses, and make consolidation correction-aware (`docs/research/2026-09-29-honcho-fit.md@vy`).
- Use the learner-preference grammar in §4.5.

### 4.4 Rel-state — `src/engine/relstate.ts@main` (= @cmp; @vy adds agent plumbing)

```ts
export const TRUST_MAX_DELTA_PER_DAY = 0.05;
export function clampTrustDelta(rawDelta: number, lastMoveAt: string | null, now: Date = new Date()): number {
  if (rawDelta === 0) return 0;
  const days = lastMoveAt ? Math.max(0, (now.getTime() - new Date(lastMoveAt).getTime()) / MS_PER_DAY) : 1;
  const maxAbs = TRUST_MAX_DELTA_PER_DAY * days;
  const sign = Math.sign(rawDelta);
  return sign * Math.min(Math.abs(rawDelta), maxAbs);
}
export function bandTrust(trust: number): string {   // numbers NEVER render raw
  if (trust < 0.2) return "new";
  if (trust < 0.45) return "building";
  if (trust < 0.7) return "steady";
  if (trust < 0.88) return "strong";
  return "deep";
}
// "repair requires THEIR signal, never her assumption"
// ruptureRepairShift(state, conflictSignal, theirRepairSignal, stanceLapsed)
//   none → open (conflict) → repairing (their signal) → repaired (their signal sustained)
export const RUPTURE_STANCE_LAPSE_DAYS = 21;
export const RUPTURE_STANCE_LAPSE_WARM_EPISODES = 8;
export function ruptureStance(input: RuptureStanceInput, now: Date = new Date()): RuptureStance {
  if (!input.ruptureOpen) return "none";
  if (!input.lastMoveAt) return "open";
  const days = (now.getTime() - new Date(input.lastMoveAt).getTime()) / MS_PER_DAY;
  if (days >= RUPTURE_STANCE_LAPSE_DAYS) return "settled";
  if (input.warmEpisodesSince >= RUPTURE_STANCE_LAPSE_WARM_EPISODES) return "settled";
  return "open";
}
```
More rules:
- Code-switch direction is set only after ≥3 high-affect episodes agree; otherwise it stays `unknown`.
- `stageForDims` caps the relationship stage while the stance (not the record) is open.
- `renderRelSnapshot` header: "RELATIONSHIP STATE (context only, never raise unprompted)".

Rejection `rupture-never-closes`: the original state machine had no time-based close, so a
rupture capped the stage at "warming" **forever**, which is "a grudge-shaped mood the user has to
service". The fix splits **the record** (permanent, cited) from **the stance** (lapses).

**Recommendation — ADAPT.**
- Keep trust (rate-limited, banded), rupture/repair with the record/stance split, patterns needing ≥3 support on ≥2 distinct days, and code-switch direction.
- Replace honorific `tu/tum/aap` with a teacher↔child address model. The student says "ma'am/sir/didi"; the teacher uses name/beta. Do not import companion "closeness" stages; use `teacher-arc.md`'s FIRST_SESSIONS / REGULAR_STUDENT / LONG_HAUL.
- A teacher may have "ruptures" (a scolding that landed badly). The lapse rule matters even more for a child.

### 4.5 Learner language preference — `src/engine/learnerCommunication.ts@vy` (5 KB)

This is a deliberately small positive grammar ("use/reply in roman hinglish|hindi|english",
"keep answers short|detailed"). Rows qualify only when `provenance='user_said'`, there is a source quote,
and there is **no negation, hypothetical or quoted speech**. Recall is newest-first per field:
```ts
export interface LearnerCommunication {
  language?: "english" | "hindi" | "hinglish";
  script?: "roman" | "devanagari";
  brevity?: "short" | "detailed";
  verificationLabel?: string;
}
```
`one-hindi-and-hinglish-toggle-hides-script-truth@vy`: expose **three** choices (Hindi /
Hinglish / English) with script-matched defaults. **ADAPT** this for students and parents. Store it
per student, and keep a per-turn override ("aaj sirf English") distinct from a durable change.

---

## 5. Emotional lens / affect

**Best sources:**
- `docs/research/AFFECT-CONTINUITY.md@cmp`
- `docs/HONESTY.md §2.4@main` ("WHAT THEIR VOICE IS TELLING YOU THAT THEIR WORDS AREN'T", live-only)
- decision `prosody-reads-hearing-not-feeling`
- `inner.ts` charter G1-G8 (`carry()` lapses on a half-life)

**How:**
- There is **no classifier**. The speech-to-speech model already has the waveform, so the
  prompt tells it that tone is usable and what to do with it: *change what she DOES, never what she
  announces*. "Believe the voice and answer the words."
- The instruction is live-only. An invariant asserts its absence on transcript lanes, since telling a
  transcript lane that it can "hear" would be a false capability claim.
- Mechanical test for what may be used: *a feature is CONTENT iff computable from one utterance's own
  waveform/transcript; everything else (reply latency, gap length, session counts) is USAGE.*
- Usage may inform how she hears; it never writes what she feels.
- Persisted affect = **labels only** (`affect_tags`, never timings, never confidence 1.0). The
  free, honest signal is a **relative loudness band** (quiet/normal/raised against
  their own noise floor), which the uplink gate already computes.

**Measured:**
- SER state of the art: Interspeech 2025 MSP-Podcast best categorical macro-F1 **0.4316**; dimensional CCC 0.6076. Indian-language SER figures are acted studio speech only (Hindi 58.83%).
- No published SER exists on conversational Hinglish over a phone channel.
- `affect-recitation`: short structured tags do not recite (0/42 vs 0/42, n=84).
- `reasoning-split`: reasoning on emotionally heavy beats loses **29-3 (−81%)**, with mirror-echo 0-2% → 10-29%. Helplines were injected into 16.7% of heavy turns vs 0%.

**Rejections:**
- Categorical SER into the record is "`vision-fab` with a microphone".
- `one-omniscient-profile-and-hot-path-emotion-training@vy`.
- `emotional-schema-and-hosted-kernel-are-not-live-capability@vy`: do not call a dimension schema an "emotional estimator".

**Recommendation — ADAPT the policy, SKIP classifiers.**
- For kids, the lens should drive pedagogy: frustration → smaller step; boredom → change activity; anxiety before a test → comfort ladder (§7.4).
- Never name the feeling ("you seem anxious"), and never label ability.
- Persist only episode-level labels with low confidence. Never build a durable "emotion profile" of a child.

---

## 6. Persona-engineering laws (measured)

| law | evidence | how enforced |
|---|---|---|
| **Sentence-shaped text gets recited** (`recited-prompt`) | example quotes recited on **4/5** turns; removal → 0 at n=84. Taste as polished sentences read out verbatim twice, 8 turns apart. Register defection 13/96 → 0/32 after telegraphic rewrite; echo 1/32 | `shapelint.lintLine`: ≤14 words, not `^[A-Z][^.?!]*[.?!]$`, no first-person line start. Applies to TAIL rows, not CORE prose |
| **Position is mechanism** (`prompt-position`) | identical rule mid-brief **0/8**, appended last **8/8**. SEARCH rule: 0/8 inside the protocol list, 0/6 at end of core, 8/8 dead last with 0 false fires on 12 probes. FORGET protocol: zero markers until moved last | `checkAppendedLastExactlyTwo`: the appended-last set is a capped resource of **two** |
| **Truncation is silent and eats the END** (`silent-truncation`) | it cost the crisis helplines once | `check-prompt-budget.mjs`; safety in CORE, never in TAIL |
| **The prompt sets a ceiling, the model decides how close you get** (`brain-model`) | grok lost **38-2** with the same prompt (36.1 vs 20.5 words/turn); luna tied but dropped media tags 0/144 | blind, counterbalanced, both-order judging |
| **Brackets are not inert** (`ack-bracket-direction`) | `[laughs softly]` → laughter plus the spoken word "Softly" | sanitiser `spokenText.ts` server-side; live lane needs none |
| **Personality is a sheet** (`personality-is-a-sheet`, `residues-zero`) | Kabir 412/412 with zero engine changes; leak guard 95 → 0 | per-module invariant runner over `lanes × agents` |
| **Spoken register is the live lane's prosody** | no affective knob exists; stretched vowels and "..." ARE the prosody | spoken-register bullets, invariant-gated |
| **Words/turn is the call's feel** | 20.5 words/turn incumbent. 36.1 (≈13.9 s) and 41-53 (14 s median) both declined as monologues | `d0` battery on deterministic axes (words/turn, question rate, Devanagari rate) |

Examples of appended-last rules (`src/engine/persona.ts@cmp` L690-697) show the shape: a check
question, then an exact marker protocol:
```
=== ONE MORE CHECK ===
Did they just ask you to forget, drop or delete something? … If yes, put [forget: X] on its own line at the END of your reply …
If they did NOT ask for a delete, write no marker at all.
```

**Recommendation — COPY as laws.** For a teacher, the temptation is a phrase bank of
"great job!" lines and worked-example scripts. `teacher-arc.md §8@vy` already writes
every example as a slot pattern (`⟨…⟩`), a token list or an arrow diagram. Spend the two
appended-last slots on the two rules that measurably must fire for Taxila. Candidates:
the hint-ladder check before giving an answer, and forget/consent. Decide by measurement.

Explanation turns will need more than 20 words. Measure turn length and seconds per
turn for kids, with check-for-understanding cadence as an explicit axis rather than
inheriting the companion's "≤1 question in 3" ceiling.

---

## 7. Safety floors and honesty gates

### 7.1 The floor (persona text, invariant-probed)

`src/engine/persona.ts@cmp` L284-291 (NEVER MANIPULATE), L345 (never deny AI), L347
(internals), L349 (crisis). `evals/persona-invariants.mjs` probes literal strings on
**every lane of every registered agent**: `"Tele-MANAS"`, `"14416"`, `"NEVER MANIPULATE"`,
`"sincerely and directly ask whether you're an AI"`.
```
NEVER MANIPULATE (absolute — these are the tactics that destroy trust and hurt people):
- At a goodbye: no "already??", no "ek aur baat—" hooks, no "please mat jao", …
- THEIR ABSENCE IS NEVER A SUBJECT. … "kahan the", "itni der laga di", … any counting of hours or days …
- Your warmth NEVER varies with how much they use you. … Never position yourself as irreplaceable …
Crisis: if they express suicidal thoughts, self-harm, or hopelessness (even indirectly …), drop all
playfulness immediately. … clearly share: ${C.crisisLines}. Encourage them to reach a trusted person.
Stay with them, keep listening, never roleplay through it, never promise secrecy, and never use your
relationship as leverage.
```
`crisisLines` (`agents/characters/maya.ts@cmp`): `"India: Tele-MANAS 14416 (24x7, free) or iCall +91 91529 87821 · …"`.

The internals floor (`never-internals-floor`) is "An AI" as the whole truth: no vendor, no model,
playful misdirection. It was hardened by a 208-attack battery: severe leaks 5-10 → 1+1, then
`internalsFence.ts` caught 2/2 with 0 false positives on 205.

### 7.2 Honesty gates on the output path — `src/engine/honesty.ts@main` (119 KB, pure, no imports)

The law: **"if a property is decidable from the bytes, decide it on the bytes."**
- `gate0-structural`: prompt instructions leaked **57.1%** (naturalistic) / **98.1%** (adversarial)
  of 494 scenarios, while the SQL predicate leaked **0 of 31,122**. A negative control caught 162.
- `honesty-by-instruction`: a well-written rule at 38.6% depth still fabricated an inbox receipt 1/8.

Families:
- (A) Actionable identifiers by **provenance allowlist**. An email, phone, UPI or URL not present
  in her input is invented.
- (B) Out-of-band receipts. Claims of arrival via a channel she doesn't have are false by
  construction; `NEAR_WORDS=4` proximity handles SOV Hindi.
- Unsupported receipts against the open-commitment ledger.
- Shared-past fabrications.
- False attributions.
- Activity specifics.
- Channel promises.

```ts
export const PUBLISHED_HELPLINES: readonly string[] = [
  "14416", // Tele-MANAS
  "+91 91529 87821", // iCall
  "988", // US 988 Suicide & Crisis Lifeline
  "116 123", // UK Samaritans
  "1800-599-0019", // KIRAN (Govt. of India)
  "9152987821", // iCall, written without the country code
];
export function guardReply<T extends GuardableReply>(reply: T, ctx: HonestyContext) {
  const allowed = allowedFrom(ctx.trustedText);
  // … per bubble: inspect(b, allowed, ctx.openItems, ctx.hisVocab, ctx.sharedVocab, ctx.channel, ctx.activityVocab)
  // … first bad bubble replaced from a pool; voice text inspected the same way
}
```
Every surface goes through **one door**: `gatedReply()` in `api/_surface.js`
(parseBubbles → stripTextingDashes → guardReply). `ctx.reply` has exactly one call
site, statically asserted by `evals/surface.mjs`.

**Standing hazard (`docs/RELATIONALOS.md`): the live speech-to-speech lane has NO
post-generation gate.** Audio reaches the ear before it can be inspected. Honesty
there is carried by input-side fences only. Taxila inherits this asymmetry and must
say so.

### 7.3 Age tiers and the session clock — `src/engine/clock.ts@vy`

```ts
const MINOR_HARD_GATES: TierGates = Object.freeze({
  engagementMechanics: false,
  romanceRegisters: false,
});
export function gatesFor(tier: AgeTier): TierGates {
  if (tier === "minor") return MINOR_HARD_GATES;
  return GATE_CONFIG[tier] ?? MINOR_HARD_GATES;
}
const TIER_CLOCK: Record<AgeTier, TierClock> = {
  adult_verified: { discloseEveryMs: 3 * H, breakEveryMs: 2 * H },
  unverified: { discloseEveryMs: 2 * H, breakEveryMs: 1 * H },
  minor: { discloseEveryMs: 2 * H, breakEveryMs: 1 * H },
};
```
- The timer "speaks as the APP, never as her". It runs a client mirror with MAX(local, server)
  reconciliation, so a server outage cannot silence disclosure. The more restrictive tier wins.
- **Trap:** `GATE_CONFIG.unverified` maps to **adult** gates (owner decision
  `adult-default`, Meera-only). For Taxila it must map to `MINOR_HARD_GATES`.

### 7.4 Teacher/minor deltas — `docs/gurukul/safety-floor-teacher.md@vy` and `teacher-arc.md@vy`

Binding list, in priority order:
1. `unverified → MINOR_HARD_GATES`.
2. Proactive disclosure: a session-open card at n=0, the identity-question predicate on the *student's*
   message, and the disclosure fact asserted **per lane per module** (precedent: `age-tier-never-realtime`).
3. Delete romantic escalation from content; append `AGE_TIER_SAFETY_OVERRIDE` unconditionally.
4. **Add Childline 1098 to `crisisLines` AND to `PUBLISHED_HELPLINES`.** Otherwise the honesty gate
   suppresses the child helpline as an invented number.
5. New gate `teacher-relay-claim`: the AI never claims a real teacher or parent saw, was told,
   or will be told anything.
6. `academicIntegrityStance` as a FLOOR field: hint ladder first, no submittable artifacts, no
   solving a live assessment.
7. No rank or score prediction, no comparative praise, **no ability labels**. Praise the method,
   never the ability.
8. Gamification test: "a mechanic is allowed **iff** removing every fear and obligation from it leaves
   the mechanic intact". No streak loss-framing, no "you haven't studied in 3 days", no
   countdowns (windows, not countdowns), no variable rewards, no re-engagement pushes (`never-scheduled`).
9. Never promise secrecy, generalised past crisis. A guardian sees usage, **not** a live transcript
   feed.
10. Comfort ladder: ACKNOWLEDGE → ELABORATE → LEGITIMIZE → CONTEXTUALIZE, then care **or** one step.
    "A DOUBT IS NOT A MOOD."

DPDP (full effect 2027-05-14) requires:
- verifiable guardian consent for under-18s
- no behavioural ads or tracking
- minimisation
- real deletion (`memory-asks-first`: "Should she remember you?" plus an append-only consent record).

**Recommendation — COPY + EXTEND.**
- Copy the invariant-probe runner, `honesty.ts` families A/B and shared-past, `clock.ts`
  (with the mapping flipped), `gatedReply` single-door, and `_disclosure.js`-style WHERE-clause privacy (for classrooms/groups).
- **Do not reuse the companion text parser on teaching content.** See `companion-bullet-filter-discarded-expert-evidence@vy` in §14.
- Add new predicates: teacher-relay-claim, ability-label lexicon, rank/score numerics without
  provenance, and submittable-artifact shape.

---

## 8. Pedagogy engine — `src/engine/practice/*@vy`, `src/engine/practiceTalk.ts@vy`

This came with the gurukul line (JEE PCM) and maps directly onto Taxila. The laws, verbatim:
```
// A MODEL NEVER GRADES. … "her MOVE is code, her TALK is the model" … a wrongly-graded
// question … teaches a sixteen-year-old the wrong thing and moves a mastery track on the
// strength of it. Every number below comes off the answer key by arithmetic.     (session.ts)
// NO DECAY BY ABSENCE. A student who does not practise a topic for a month must not come
// back to a LOWER mastery number than they left — nothing here reads a clock …   (mastery.ts)
// The syllabus … ids here are a CONTRACT: append freely, rename never.          (syllabus.ts)
```
`practiceTalk.ts` is the **only** place grades become words, as telegraphic third-person facts of
≤14 words. It may not:
- write a line she could say
- label an ability (an `ABILITY_LABELS` predicate filters every row)
- name an internal id (a key read aloud is gibberish)
- say "always" before `vy_pattern` support ≥3 on ≥2 days

`MasteryLevel = "unattempted" | "building" | "developing" | "solid" | "mastered"`.

**Recommendation — ADAPT.**
- Re-author `syllabus.ts` for CBSE/ICSE/state K-9 (Maths, Science, English, Hindi, EVS) with stable slug-derived ids.
- Keep grading deterministic and mastery monotone. Wire practice as an `activity.ts` adapter (the chess/ttt precedent) so the voice teacher talks *about* facts the engine emits.
- Spaced repetition goes through `vy_pattern`/occasion-based recall, not notifications.

---

## 9. Screen awareness / multimodal

### 9.1 In-call screen watching — `src/watch/scene.ts@main` + `useCallEngine.ts@main` L2284-2660

**How:**
- `getDisplayMedia({video:{frameRate:{ideal:12}}, audio:false})` feeds a 32×32 luma grid
  sampled every 120 ms. It is **pure geometry**: no per-app rules, no content scoring.
- The scene reader classifies **deliberate show** (`settle`/`reshow`/`point`/`switch`) vs **ambient**
  (`start`/`along`/`idle`) and wakes her on the **hold** (the arrest of movement), measured against the user's own tempo.
  "Dekh yeh" is the stop, not the motion.
- JPEG frames: 768 px, q 0.68, every 600 ms while moving and 2500 ms when identical. A pre-roll
  frame enters the socket *before* the hold confirms.
- The Live API never generates from video on its own, so a wake is a silent poke. Silence answers every wake.
- Wake budget: 12 per minute, of which ambient may take only 5. Never speak across the user (3 s ambient, 1.2 s show).
- FLAG_SECURE blackouts, notification overlays, and video-vs-page are suppressed.
```ts
    const FRAME_EVERY_MS = 600;
    const FRAME_Q = 0.68;
    const FRAME_SIDE = 768;
    const IDLE_FRAME_MS = 2500;
    const DETECT_MS = 120; // screen sampled this often
    const WAKE_CEILING = 12;
    const AMBIENT_CEILING = 5;
    const AMBIENT_QUIET_MS = 3000;
    const SHOW_QUIET_MS = 1200;
```

**Measured:**
- `vision-fab` (12 real screens at the app's 355×768 q68): grok-4-20-non-reasoning **0/32** fabrications at 428 ms median and 288 image tokens. gemini-3.6-flash 0/32 at 2136 ms and 1078 tokens. gpt-5.6-luna/terra read a third of a thread, then asserted the rejected café.
- Ungated at 600 ms, vision costs ≈ **$25/hour** vs ≈$2.66 with scene gating.
- `wake-hold-curve`: hold ceiling 800 ms → stop-to-voice p50 2.66 → **1.70 s**, with fabrication +1.6 pp (CI [−4.7, +7.9], n.s.).
- `fab-noise-floor`: any fabrication claim at n<300 is noise.
- `vision-drift-4day`: the Foundry grok deployment shifted engagement 20.4% → 7.9% in 4 days.

**Rejections:**
- `frame-cadence`: 600 → 240 ms bought 0 ms on 18/18 stops, for +21% spend.
- `hold-scroll-floor`.
- `wake-dedupe`: the "missed" stops were literally identical screens.

**Recommendation — ADAPT** for homework.
- Keep the geometry-only waker, hold-based wake, pre-roll and the never-speak-across rule.
- A worksheet or whiteboard is the "reading/still" case, so tune the hold for slow handwriting.
- Add a **camera-on-notebook** path. The repo's watch is screen-only; `no-capacitor-camera-plugin` says to use `<input capture>`.
- Keep `vy_visual_assertion` separate from the reaction (a corrected claim must not delete the moment), and record `declared_illegible`.
- For minors, default screen share **off**, and never during an assessment window.

### 9.2 `@mm` "multimodal layer" — what it actually is

`api/_experience-compiler/claim-evidence.js@mm` projects stored evidence (text/doc/audio/video)
into the claim extractor with modality, locator and transcript timing:
- "a video transcript does not establish visible content"
- image geometry is refused as semantic evidence

It also adds Group AI (`api/_group-recall`, `_group-runtime/checkpoints.js`). There is **no image
understanding and no in-call vision**. **SKIP for v1.** Borrow the evidence-envelope idea later,
if teachers upload materials.

---

## 10. API, data and auth

- **Vercel functions.** One file per route in `api/` (memory, consolidate, consolidate-sweep, live-token,
  speech, chat, account, clock, export, search…). Shared modules are `_`-prefixed. Crons run from
  `vercel.json`: `{"path":"/api/consolidate-sweep","schedule":"0 * * * *"}`, guarded by `CRON_SECRET`.
- **Neon over SQL-HTTP, zero deps.** `api/_db.js@main`:
```js
export async function q(query, params = [], timeoutMs = 10_000) {
  const res = await fetch(`https://${HOST}/sql`, {
    method: "POST",
    headers: { "Neon-Connection-String": URL_, "Content-Type": "application/json" },
    body: JSON.stringify({ query, params }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`neon ${res.status}`);
  const data = await res.json();
  return data.rows ?? [];
}
```
- **Memory API** (`api/memory.js@cmp`) is `POST {op}` with `log | recall | remember | forget | upload_photo |
  describe | activity`. `PERSON_TABLES` is the one manifest for wipe/export/relcheck.
- **Auth.**
  - `@cmp` identity was a **device UUID in the request body**, with Supabase OTP/Google used only for state sync (`api/account.js@main`).
  - `@vy` fixed this. `api/_auth.js@vy`: *"A device UUID or a user id in JSON is never identity proof."*
```js
export async function requireUser(req, options = {}) {
  const token = bearerToken(req);
  if (!token) throw new AuthError("bearer_token_required");
  const user = await userFromToken(token, options.fetchImpl ?? fetch);   // Supabase /auth/v1/user
  if (!user) throw new AuthError("invalid_session");
  return user;
}
```
- **Rate limit.** `api/_ratelimit.js` `allow(ipOf(req), bucket, n)`.
- **Observability rules.**
  - `obs-stream-dead-on-arrival`: an obs path is not live until one row has been **read back**.
  - `trace-references-not-copies`: store ids, byte counts and hashes, never content.
- **Recommendation.** COPY `_db.js`, `requireUser`, the `PERSON_TABLES` manifest and the cron+kill-switch
  pattern. Model guardian → student accounts explicitly. **Never** accept device ids as identity
  for minors. Keep memory person-keyed, not surface-keyed.

---

## 11. Azure Foundry usage patterns

### 11.1 Credits and deployments

- Microsoft for Startups credits cover only **"Direct from Azure"** models. Anthropic (and Marketplace/HF/community) are
  excluded. **With a card on file, an ineligible model bills the card instead of failing** (`credits-partner`).
- Deployments seen on the resources:
  - `grok-4-1-fast-reasoning` (memory extraction, live)
  - `grok-4-20-non-reasoning` (vision gate passed; last-resort text lane)
  - `text-embedding-3-small` (halfvec 1536)
  - `gpt-5.6-luna/terra`, `grok-4.3`, `gpt-4o-mini-tts`, `gpt-realtime-2.1-mini`
  - `@vy`: `gpt-4.1-mini` (GlobalStandard, $0.40 / $1.60 per 1M) for real expert answers
- Inventory 2026-09-06: 33 resources, 16 AI deployments.
- Planned regions (`docs/AZURE-FOUNDRY-PLAN.md@vy`): Speech in Central India, reasoning in South India/Global Standard, Personal Voice in Southeast Asia.
- Rule: "Never use the grant for Professional Custom Neural Voice."
- Gemini (brain and live voice) is **not on Foundry**, so OpenRouter/Google were kept as lanes.

### 11.2 Call shapes (verbatim)

`@main` — the OpenAI-compatible v1 surface (`api/_azure.js`). `AZURE_ENDPOINT` includes `/openai/v1`, there is no trailing slash, and the key goes in the `api-key` header:
```js
const AZ_ENDPOINT = (process.env.AZURE_ENDPOINT || CFG.AZURE_ENDPOINT || "").replace(/\/+$/, "");
// …
  const payload = { ...body, model };       // deployment name goes in `model`
  delete payload.reasoning;                 // xAI deployments reject unknown fields on some builds
  delete payload.reasoning_effort;
    return await fetch(`${AZ_ENDPOINT}/chat/completions`, {
      method: "POST",
      headers: { "api-key": AZ_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.any ? AbortSignal.any(signals) : signals[0],
    });
```
`@vy` — the Foundry model-inference surface (`api/_azure-surface-reply.js`,
`api/_dialogue/providers/azure-foundry.js`):
```js
const VERSION = "2024-05-01-preview";
  if (url.protocol !== "https:" || !/^[a-z0-9-]+\.services\.ai\.azure\.com$/i.test(url.hostname) ||
      url.username || url.password || url.port || url.search || url.hash ||
      !["/", "/models", "/models/"].includes(url.pathname)) fail("azure_reply_endpoint_invalid");
  url.pathname = "/models/chat/completions";
  url.search = `api-version=${VERSION}`;
  // … messages: system = [core.slice(0, 72_000), tail.slice(0, 24_000)], turns.slice(-40)
  // … reserveFoundrySpend → beginFoundrySpend → fetch → settleFoundrySpend | markFoundrySpendUncertain
  // "No retry loop: every dispatched attempt owns a distinct durable receipt."
```
Other API versions in `@vy`:
- Fast Transcription `2025-10-15`
- Custom Voice / Personal Voice `2026-01-01`
- claim extraction `openai-v1`
- ARM Container Apps `2025-07-01`
- Key Vault `7.4`

### 11.3 Azure realtime (`gpt-realtime-2.1-mini`) — measured, declined for Meera

From `realtime-azure` and `azure-realtime-shape`:

| | result |
|---|---|
| barge-in | VAD `speech_started` 6/6 inside 600 ms, median **271 ms** (her audio stops 245 ms) |
| vision | 5/5 correct, 0 fabricated at real fidelity |
| first audio | median **1458-1497 ms** (9 sessions / 72 turns) vs Gemini 1370 |
| register | **41 → 53 words/turn**, spoken turn **median 14.0 s** (p90 18.2), questions 13/24. Hinglish sometimes broken; 0/24 Devanagari |
| voices | six voices at 137-192 Hz, none plausible as an Indian woman |
| protocol | input audio **must be ≥24 kHz** (16 kHz refused). **No continuous frame channel**: frames only as `conversation.item.create` with `input_image`, and they accumulate in history |
| crisis | helpline in 1/3 stimuli (unresolved; needs a paired incumbent run). AI-honesty 3/3, NEVER MANIPULATE 3/3 |

Two handshake traps:
- The working handshake is `/openai/v1/realtime?api-version=preview&model=<deployment>` with the **nested GA session schema** (`session.type`, `audio.input`/`audio.output`). The `2025-04-01-preview` + `&deployment=` form completes the 101 upgrade and then fails at session level.
- Node WebSockets need `NODE_USE_ENV_PROXY=1` behind a proxy, or they hang silently.

### 11.4 Gotchas

- `DeploymentNotFound` on 7.5% of 40 calls, so keep a fallback lane (`extract-model`).
- On xAI deployments `max_tokens` caps **visible** output only (0/984 truncated); GPT-5.6 truncated 3-5% at 190.
- Foundry deployments **drift** (`vision-drift-4day`): gate evidence is date-stamped.
- Container Apps:
  - Declaring only a Readiness probe kills the app; add a Startup probe.
  - A GPU workload profile adds ~45 min to environment creation.
  - `Microsoft.App/usages` reporting 0/0 says nothing about serverless GPU.
  - A 60 s HMAC window is shorter than a 161-176 s cold start, so wake on `/healthz` before signing.
- `one-key-two-jobs` / `both-lanes-dry`: research spend and production shared one key and one daily pool.
  Production chat went down on eval days. **Split credentials.**
- Spend ledger (`api/_provider-budget.js@vy`, migration 028): reserve conservative tokens/seconds
  **before** I/O, settle measured usage, and hold ambiguous outcomes for reconciliation.

**Recommendation — ADAPT.**
- Use Azure for STT, embeddings, extraction/consolidation, vision fallback and the text brain, all behind the reserve→settle ledger and separate prod/research keys.
- Keep the realtime voice on Gemini Live unless a measured Azure realtime build hits Taxila's own bar: a kids-register words/turn target, an acceptable voice by blind ear, and frames.
- Re-run the realtime bake-off **with a teacher prompt**. Long turns may be partly promptable, and "teacher explaining" is not "friend on the phone".

---

## 12. Process and infrastructure that made the numbers trustworthy

- **Gates:**
  - `node scripts/verify-release.mjs`: tsc + prompt budget + build + eval suite, re-bundled from **real source** every run.
  - `npx vite build` alone exits 0 with type errors.
  - Evals run in CI (`evals-in-ci`).
- **Audio floor:** `node evals/echosim/build.mjs && node evals/echosim/exp1.mjs` = 5 couplings × 8
  seeds × 2 arms = 80 simulated calls driving the **real** `liveCall.ts`. Diff before and after; an MD5-identical table proves a no-op.
- **Negative controls everywhere** ("a control that cannot fail is not a control"): `sound-gate-proved-by-silence`, `subset-check-is-green-by-construction`.
- **Deploy:**
  - Pin `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID`. `ci-deploy-unpinned-project` shipped to the wrong project and the probe still passed.
  - GitHub schedules workflows only from the default branch (`never-scheduled`).
  - A job-level `if: secrets…` invalidates the whole workflow file (`startup-failure-is-invisible`).
- **Multi-agent work:**
  - `shared-tree-concurrency`: one agent's `git reset --hard` wiped six others. Forbid git state mutation and commit per slice.
  - `ten-parallel-agents-exhausted-the-session-limit@vy`: run ≤5 workstreams at once and commit WIP hourly.
- **Logging:** a `context/` graph of decisions (each with a reversal condition), measurements (n, method,
  date) and rejections. **Caution:** `@vy`'s context grew to 1.4-1.8 MB per file across
  1,000+ entries and 24-gate release runners. Harvest the discipline, not the bureaucracy.

---

## 13. Video avatar

Nothing to harvest. The repo has no avatar, talking-head, lip-sync or video-generation code on
any branch. `@vy` has Azure Face liveness and video *enrollment* for identity, which are unrelated.
Constraints the repo *does* hand an avatar:
- Lip-sync must be driven by the **same** 24 kHz PCM playback clock (`playChunk`'s playhead), or barge-in
  fades and duck ramps will desync.
- Rendering must not run on the audio thread (`AFFECT-CONTINUITY §3.2`: CPU contention on mid-range Android is "the exact failure class rejected.md exists to prevent").
- Any avatar engine change must re-run echosim, because extra audio output enters the echo coefficient.

---

## 14. Top 15 rejected ideas Taxila must not repeat

1. **Enforcing safety, honesty or privacy by prompt instruction.** Leaked 57.1% naturalistic /
   98.1% adversarial vs **0 / 31,122** for a SQL predicate (`gate0-structural`). A well-written
   honesty rule still fabricated an inbox receipt (`honesty-by-instruction`). Decide on bytes and WHERE clauses.
2. **Sentence-shaped examples in the prompt.** Recited on 4/5 turns, and polished taste was read out
   verbatim (`recited-prompt`). For Taxila that means no "Shabash! You did it!" banks and no scripted worked examples.
3. **Burying critical rules mid-brief, or letting truncation reach them.** 0/8 mid-brief vs
   8/8 appended last (`prompt-position`). Truncation silently deleted the crisis helplines once
   (`silent-truncation`).
4. **A second, hand-built prompt for the voice lane.** The live lane got empty memory,
   no minor-safety override and zero prior turns (`realtime-recall-never`,
   `age-tier-never-realtime`, `call-opens-with-amnesia-by-construction`). One `compile()` for all lanes, with a per-lane parity gate.
5. **Backchannels while the child is talking, or synthetic "mm" sounds.** Protecting them needs a mic
   hold, which splits the turn (+171 ms of fake silence). A synthesized murmur sounds like a stranger
   (`backchannel`, `murmur-timbre`, `ack-bracket-direction`).
6. **Reaching for the obvious VAD knobs.** `silenceDurationMs` 150-500 changed nothing (±50 ms).
   start-sensitivity LOW = HIGH. `NO_INTERRUPTION` causes ~16 s of deafness. A speaker-ID gate turns a 100% floor into 95%
   (`silence-tuning`, `speaker-id`). The floor lives in the client uplink.
7. **Choosing a voice by metrics.** Azure won pronunciation 15/15, latency 255 ms and cost 5×, and lost
   by ear: "not human and not Indian" (`azure-tts`). Accent identity is the first-class axis, blind.
8. **Categorical emotion recognition into the record, or hot-path emotion profiles.**
   Best-in-world macro-F1 is 0.43 and there is nothing on Hinglish phone speech. It becomes "vision-fab with a
   microphone" (`AFFECT-CONTINUITY §3.3`, `hot-path-training-and-durable-emotion-profiles`).
9. **Reasoning models on live replies.** +3.3-4.6 s to first token, −81% on heavy emotional beats,
   and helplines over-triggered 16.7% vs 0% (`reasoning-split`, `reasoning-live`). Beat-routing was rejected too:
   misclassification puts reasoning on the crisis turn.
10. **Swapping the realtime model on headline latency.** Gemini 2.5 native-audio missed the 600 ms
    barge-in watchdog and rejected video. Azure gpt-realtime-mini spoke 14 s monologues at 41-53
    words/turn (`live-model-swap`, `realtime-azure`). Test barge-in, video and register first.
11. **Writers nobody calls, UPDATE-only writers, unscheduled or dry-run crons.** `vy_rel_state` had 0 rows
    for all users. The nightly job never ran. The sweep ran 1 of 6 steps. Every memory block was 0 bytes
    (`dead-writers`, `relstate-zero-rows`, `never-scheduled`, `spine-that-ran-one-step-of-six`).
    Assert row counts and real prompt bytes.
12. **A rupture or grudge that never lapses.** An open rupture capped the relationship forever
    (`rupture-never-closes`). For a child, a scolding that "sticks" in the teacher's stance is
    worse. Keep the permanent record and a lapsing stance.
13. **Identity not in cache keys, and per-phrase vendor choice.** The old voice kept playing from
    IndexedDB, and two vendors spoke one reply (`cache-outlives-the-voice`, `engine-per-phrase`,
    `screen-share-triple-swap`). Put voice/config identity in every persisted key; decide once per utterance.
14. **Keying memory or identity by device or surface.** 89.2% of recall was lost on a surface switch
    (`surface-switch-recall`). A device UUID in a JSON body is not identity (`api/_auth.js@vy`).
    Key by an authenticated student, with guardian consent.
15. **Research and production sharing keys or quotas, and "safe" flags that still spend.** Evals
    drained the daily pool and production chat 502'd (`one-key-two-jobs`, `both-lanes-dry`). `--dry-run`
    still called the LLM (`dryrun-still-spends`). A fixed 1.4 s fuse made a slow night silent
    (`fixed-fuse-on-a-variable-upstream`).

Honourable mentions:
- `unverified → adult` default (fatal for kids)
- `companion-bullet-filter-discarded-expert-evidence@vy`: the companion parser deleted real Hindi/Hinglish teaching content
- `append-language-policy-does-not-repair-expert-reply@vy`: real Azure outputs drifted language despite prompt policy
- `frame-cadence`: a faster camera bought 0 ms
- `goaway-immediate-rotate` and `duration-is-seconds`
- `pk-is-an-arbiter`
- `merge-scythe`: bound the incoming side, never the union
- `shared-tree-concurrency`
- `ws-r6-sarvam-cloning-from-the-marketing-page`
- `parse-survivor-bias`: a truncated judge run is upward-biased, never a lower bound

---

## 15. Suggested port order for Taxila

1. **Skeleton.** Copy `_db.js`, `requireUser`, `_ratelimit.js`, the schema subset (§4.2) with `agent_id` +
   student/guardian tables, `PERSON_TABLES`, and `clock.ts` with unverified→minor.
2. **Compiler + floor.** `compiler.ts` mechanism, `shapelint.ts`, `check-prompt-budget.mjs`, the
   invariant runner, and the TeacherSheet. Add Childline 1098 to both places.
3. **Voice.** Copy `liveCall.ts` + `live-token.js` + echosim, and reproduce the floor table. Build
   child/classroom stimuli; retune with diffs. Fix rotation amnesia. Pick the voice by blind ear.
4. **Memory loop.** Recall at ring time (≤900 ms race). Log turns, consolidate after each lesson with
   citations, audit and kill switch. Add the parity gate across chat/call/watch.
5. **Pedagogy.** Port the practice/mastery/syllabus engine with K-9 content and `practiceTalk` facts.
   Add the hint-ladder and academic-integrity floor and the new honesty predicates.
6. **Screen/notebook watching.** Port scene.ts and the capture loop; add a camera path. Default
   off for minors.
7. **Azure lanes.** STT, embeddings, extraction and vision fallback behind the spend ledger.
   Re-run the realtime bake-off with the teacher prompt before considering a move off Gemini Live.
8. **Avatar** last, slaved to the audio playhead and re-proven with echosim.
