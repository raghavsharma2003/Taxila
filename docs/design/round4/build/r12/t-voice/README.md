# r12 T-voice: the voice events of the flight recorder (stream 4B)

Brief: `../TRACKING-BRIEF.md`; decision `dc-r12-flight-recorder`. Branch `claude/r4-duplex`, from base 84bc6050.
**No behaviour change**: every hook goes through `src/voice/trace.ts`, which is wrapped, fire-and-forget, and does
nothing until the client bus installs a sink.

## The events (contract `shared/trace.ts` v1; `src: "client"`, tier 1 unless marked)

| kind | when | data (beyond the lane) |
|---|---|---|
| `mic.mode` | tap or hands-free, whenever it or its reason changes | `mode` tap/duplex; `reasons[]` (every gate that held: `not_older_family`, `talk_pref_tap`, `no_headset_detected`, `echo_probe_not_built`, `echo_demoted`, `duplex_off`, `duplex_shadow_only`, `duplex_not_resolved_yet`, `duplex_not_live`, `duplex_fallback:<r>`, `transcription_call_unavailable`, `no_microphone`, `paused`); every input; `duplexSource` |
| `mic.duplex` | the lesson's duplex mode resolved | `mode`; `source` (device_key, server, server_shadow, server_unknown, server_off); `device`; `server`; `build`; `asks[]` (each /api/duplex/config answer: status, ms, duplex, retry, cohort) |
| `mic.duplex.start` | the engine's start | `mode`; `live`; `why` it is not live |
| `duplex.fallback` | the engine stepped aside | `reason` (no_frames, stt_unavailable, stt_rate_limited, engine_error, killed); frames; phase |
| `duplex.decision`, `duplex.commit` | the engine's YIELD / HUSH / SPEAK / CUT_IN (also in shadow, where nothing acts: `acted:false`) | `action`; `reasons`; `phase`; `detail`; `mode` |
| `mic.state` | open (track label; echoCancellation / noiseSuppression / AGC as applied; rates), denied / error, transport (webrtc / recording / typed, and why), tap / hands_free, closed | |
| `vad.start`, `vad.end`, `vad.sustain` | `source`: server (the transcriber's VAD), local (the device energy VAD), tap (the child's press / release) | `itemId`; `audioStartMs` / `audioEndMs`; `speechMs`; `herPlaying` |
| `asr.config` | the transcription session config | `model`; `language`; `promptChars`; `turnDetection` |
| `asr.partial` | at most every 300 ms per item, plus the last before the final | `itemId`; `text`; `msFromSpeechStart` |
| `asr.final` | the transcript (or `failed`) | `text`; `empty`; `confidence` (null: this lane returns no logprobs, see WHY-TAP §2); `unsure[]` ({word, p} under 0.6); `alternatives` [] (the lane returns one hypothesis); `language`; `model`; `msFromSpeechEnd`; `msFromSpeechStart` |
| `tts.request` | her reply goes to the speech stream | `replyId`; `seq`; `text`; `chars` (the voice is chosen server-side) |
| `tts.start` | her first sample sounds | `msFromRequest` |
| `tts.end` / `tts.error` | the reply ended | `status`; `playedFully`; `msUnplayed`; `msFromStart`; `error` |
| `tts.interrupt` | paused / resumed / stopped | `kind`; `by`; `byChild`; `msLeft` |
| `bargein` | each step | `step`: server_speech_start, local_duck, local_pause, local_unconfirmed, verdict (turn / silent / backchannel / echo), engine_hush, engine_yield, engine_resume, engine_revoke; `acted` |
| `audio.mic.chunk` **tier 2** | one clip per child utterance, from the link's OWN mic stream (MediaRecorder; never a second getUserMedia) | blob (webm/opus); `utterance`; `itemId`; `source`; `ms` |
| `audio.tts.clip` **tier 2** | what she actually played (her player's output node through a MediaStreamDestination, so a cut reply is recorded as cut) | blob; `replyId`; `seq`; `status`; `ms` |

`data` is fitted to the 8 KB limit (long text cut, marked `truncated`). No key uses a name `shared/trace.ts` masks.

## For T-client (the bus) — what the sink must provide

```ts
import { setVoiceTraceSink } from "../voice/trace.ts";
setVoiceTraceSink({
  emit: (kind, data, { tier, turn }) => bus.push({ kind, data, tier, turn }),
  full: () => bus.tier === 2,
  blob: (kind, blob, data) => bus.blob(kind, blob, data),   // POST /api/trace/blob, then an event with data.blob = ref
});
```

Or publish the same object as `globalThis.__taxilaTrace` (the evidence runs do this). With `full()` false, no clip
recorder is ever constructed.

## Files

- **Mine:**
  - `src/voice/trace.ts` (new);
  - `src/duplex/live.ts`, `flags.ts`, `cascadeDuplex.ts` (decision, mode and fallback events).
- **Patch requests:** `patches/01` (`src/lesson/cascadeLink.ts`) and `patches/02` (`src/child/lesson/LessonScreen.tsx`),
  see `patches/APPLY.md`. Also committed as one `[patch-request]` commit.
- **Tests:** `tests/r12-voice-trace.test.mjs`. It re-runs `tests/voice-cascade.test.mjs` and
  `tests/p1-duplex-live.test.mjs` under two recorders:
  - one that throws on every call;
  - a tier-1 recorder that fails the run on any blob or audio byte.

  Fixture: `tests/fixtures/r12-trace-sink.mjs`.
- **Evidence:** `voice-turn.mjs` plus `evidence/run-*.{json,txt}`. These are scripted turns on a local production build
  (r4-timeline driver; Chromium fake mic; fake transcriber):
  - cohort tier 1: hands-free; 38 events, 0 blobs;
  - cohort tier 2: 2 `audio.tts.clip` (117 / 105 KB) and 1 `audio.mic.chunk` (58 KB);
  - non-cohort tier 1: tap, with its reasons; 0 blobs.
- **Why tap:** `WHY-TAP.md`.

## Budget

Measured on the sandbox CPU, Node 22: a transcript delta costs 0.44 µs to trace, a final with 12 logprobs 6.6 µs. A
turn emits about 30-40 voice events, so well under 1 ms per turn: far inside the 2 % main-thread budget. Tier 2 adds
one MediaRecorder per utterance and per reply. Encoding runs in the browser's media pipeline, not on the main thread.

## Not yet (needs the other streams)

- `scripts/trace.mjs --session` over these events needs T-client's bus (`src/trace/**`) and T-server's
  `/api/trace/batch`. Neither is on a branch yet; only `shared/trace.ts` is (T-server e376d62f). The evidence runs use a
  test-only page sink instead. Rerun `voice-turn.mjs` once both land.
- **Server voice routes** (`server/routes/voice.js`: which TTS voice / engine, the first-byte time, the cache hit) need
  T-server's writer. Today `tts.request` says the voice is chosen server-side.
- **The realtime lane** (`src/lesson/realtime.ts`, lane A) is not hooked. The owner's lessons ran the cascade lane.
