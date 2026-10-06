# p1-duplex: apply order and proof (hands-free duplex teacher, priority 1)

2026-10-06 · stream p1-duplex · base **HEAD 8006902**. Every patch passes `git apply --check` on 8006902.

**How the patches were checked:** they were applied to a throwaway copy of the tree under the stream scratchpad. On
that copy:
- `tsc` is clean and `vite build` passes;
- the tests below are green;
- a local server (`server/serve.mjs`, Neon TEST branch via `TAXILA_DB=test`) passed the browser acceptance. Results are
  at the end of this file.

The main tree was not touched in any hot file.

## What ships, and how it turns off

- **Default:** ON. A spoken (cascade) lesson is hands-free.
  - There is no talk button.
  - A transcription final is not a turn: the engine commits the turn after deciding every 100 ms on the mic frames and
    the streaming partials.
  - The server VAD (1,500 ms) is only a backstop.
- **Kill switches.** Any one of them restores today's path on the next lesson:
  - runtime: `TAXILA_DUPLEX=0` on the Container App (`GET /api/duplex/config`, no rebuild);
  - build time: `VITE_DUPLEX=0`;
  - per device: `?duplex=0`, which sticks in localStorage; `?duplex=default` clears it.
  - `shadow` is also accepted: the engine runs beside today's path and only logs.
- **Automatic fallback to today's path,** with no child-facing error:
  - a quota or capacity error on the transcription call (`gpt-live-transcribe`, quota 10): the engine steps aside and
    the token's VAD comes back;
  - no AudioWorklet;
  - a tap that delivers no frames for 3 s;
  - any engine fault.
  - Then the UI's own talk policy applies again: tap-to-talk on a loudspeaker phone, open mic with a headset.
  - A refused token mint (502 or 429) was already today's push-to-talk recording fallback, and that is unchanged.
- **Safety floor: unchanged.** The server still runs `scanSafety` and the model distress read on every committed turn.
  The engine adds `TurnRequest.duplex.safetyPending`, its sticky partial predicate, which the server
  (`server/brain/turn.js`, already at HEAD) only ever ORs into a safeguard.

## Order

| # | file(s) | patch | what it does | proven by |
|---|---|---|---|---|
| 01 | `src/lesson/link.ts` | `patches/01-link-duplex-field.diff` | `child_final` may carry `duplex` (TurnRequest.duplex, type only) | `npx tsc -b` |
| 02 | `src/lesson/runtime.ts` | `patches/02-runtime-duplex-summary.diff` | a spoken final's `duplex` rides to `POST /api/lesson/turn` as `TurnRequest.duplex` | `tests/p1-duplex-link.test.mjs` "runtime: …" (skips until applied); `tests/client-runtime.test.mjs` unchanged |
| 03 | `src/lesson/cascadeLink.ts` | `patches/03-cascade-duplex.diff` | option `duplex` (mode or resolver) + `onDuplex` + `duplexFace`. When the call is up, `CascadeDuplex` starts on the ONE lesson mic tap. Transcription events are teed to it; finals stop being turns; the old barge-in pause and merger stand aside while it decides; pause / resume / stop / duck / micro-commit are wired; a quota error steps it aside; the recording fallback degrades it; absent or `"off"` = byte-for-byte today | `tests/p1-duplex-link.test.mjs` (6 link tests, skip until applied); `tests/voice-cascade.test.mjs` green |
| 04 | `server/index.js` | `patches/04-server-duplex-config.diff` (on 8006902), **or** `patches/04b-server-duplex-config.after-p2face-p3.diff` after p2-face 03 + p3-voicesig 06b | registers `GET /api/duplex/config` (`server/duplex/config.js`). `...duplex` sits before `...lane`, so `tests/w2d-voice-lanes.test.mjs` "…lane }" stays true on 04 | `tests/p1-duplex-live.test.mjs` "kill switch"; `tests/w2d-voice-lanes.test.mjs` |
| 05 | `src/lesson/uiBridge.ts` | `patches/05-uibridge-duplex.diff` | the production cascade link gets `duplex: resolveDuplexMode` and the face seam (`withPuppet`, `puppetDuplexDetach`; FACE-BRIDGE.md); bridge state gains `duplexLive` and `duplexFallback` | tsc; acceptance "browser (scripted STT)" |
| 06 | `src/child/lesson/useDesk.ts` | `patches/06-desk-handsfree.diff` | `openMic = ctx.openMic \|\| bs.duplexLive`: no talk button while the engine decides; the screen's policy is back the moment it steps aside | acceptance "no talk button" and "?duplex=0 → talk button is back" |

**Other streams' patches on the same files:**
- `p3-voicesig/10-runtime-factory.diff` and patch 02 apply in either order (checked).
- `p2-face/02-client-visemes.diff` touches only `ttsStream.ts`.
- Nothing else in ship5 touches 01, 03, 05 or 06.

## New code: direct, duplex paths only

| file | what it is |
|---|---|
| `src/duplex/cascadeDuplex.ts` | the link glue (surface, captions folded per turn, quota / no-frames / fault fallback, revoked replies dropped, 1,500 ms backstop VAD) |
| `src/duplex/live.ts` | `DuplexLive`: the engine host for a live lesson, its port, `TranscriptionTap`, `EchoCoupling`, the context from the Director's ui (the FORM, never the key) |
| `src/duplex/liveTap.ts` | frames from `src/voicesig/lessonTap.ts` (`acquireFrontEnd`; never a second worklet) plus her output level |
| `src/duplex/flags.ts` | mode resolution: device > server kill switch > build > on |
| `server/duplex/config.js` | `GET /api/duplex/config` |
| `src/duplex/host.ts` | engine changes (2026-10-05/06), all measured below: the hush, burst-local echo, own-words safety check, speaker attribution carry-over, tone rule, child-pitch learned only from committed turns |
| `src/duplex/overlap.ts` | engine change: acoustic yields wait for the sustain |
| `src/duplex/turnPolicy.ts` | engine change: listening-token sets |
| `src/duplex/audio.ts` | engine change |
| `src/duplex/config.ts` | engine change |
| `tests/p1-duplex-live.test.mjs` | 17 tests |
| `tests/p1-duplex-link.test.mjs` | 7 tests; they skip until patches 02 / 03 are applied |
| `tests/duplex-runtime.test.mjs` | one assertion updated for `waitForSustain` |
| `tests/prod/p1-duplex-acceptance.mjs` | acceptance |
| `tests/prod/fixtures/p1-duplex-child-answer.wav` | fixture |
| `evals/p1-duplex/ami-frames.mjs` | real adult speech harness |
| `evals/p1-duplex/ami.mjs` | real adult speech harness |

## Gates after applying

```
npx tsc -b && npx vite build && npm test
node --test tests/p1-duplex-live.test.mjs tests/p1-duplex-link.test.mjs tests/voice-cascade.test.mjs tests/client-runtime.test.mjs tests/w2d-voice-lanes.test.mjs
node evals/persona-invariants.mjs                         # 70/70 on the patched copy
TAXILA_BASE=http://localhost:PORT node tests/prod/p1-duplex-acceptance.mjs      # then against taxila.dev
```

**Acceptance on the patched copy** (local server, Neon test branch, Chromium with a fake mic, final engine): **18/18
PASS** with `P1_ARMS=scripted,killed`. An earlier full run (all arms) was 19/20, and the one failure is fixed in patch 03.

| arm | result | what it proves |
|---|---|---|
| config / bundle | PASS | the switch ships ON; the engine ships in the client (lazy chunk `cascadeDuplex-*.js`, 211 kB raw / 74 kB gz) |
| seam | PASS | a turn carrying `TurnRequest.duplex` is accepted. With `P1_SAFETY=1`, a clean final with `safetyPending` got the safeguard with 1098 and 14416 (run once; that test account is held for safeguarding review, `erase_review`, as with `w2i-safety`) |
| browser, scripted STT | PASS: 5 spoken turns in 75 s, no click | real AudioWorklet tap on the fake mic → engine → `POST /api/lesson/turn` with `duplex`. The decision gap was 1,154 ms after the voice, because the scripted words arrive ~0.9 s after speech (D4-like). The 1,500 ms backstop VAD was sent. No Devanagari appears in the summary |
| browser, real STT | WARN + PASS | from this sandbox WebRTC cannot reach Azure (UDP), so the graceful path was checked: the talk button came back and the lesson went on. **Run this arm from a runner with UDP to Azure against taxila.dev** |
| browser, `?duplex=0` | PASS | the talk button is back; no turn carries `duplex` |

## Measured vs simulated (details in `context/inbox/p1-duplex.json`)

**Labels:**
- **[SIM]** TaxilaFDB TEST: TTS child-like voices and a simulated STT. Re-rendered 2026-10-06. Engine at 8006902 vs
  final, same streams, world `childLevel=0`.
- **[ADULT]** AMI real adult meeting speech: real frames and timing, simulated STT. Held-out meetings only.

None of this is children. Every bar below is "engineering-complete, unproven on children" at best.

| V5 bar | result | met? |
|---|---|---|
| barge-in yield p50 ≤ 200 ms | **[SIM]** Her audio drops 26 dB (the hush) at p50 140 ms on all lanes (was 676-1,190); stops ≤ 200 ms on 104-105/108 (was 0-11). The full yield decision is p50 700-716 ms (was 676-1,190). **[ADULT]** Her audio stopped on 78/152 real floor-taking barge-ins; of those, stop p50 200 ms (D4) / 300 ms (FAST) | hush yes [SIM]; yield decision no; real speech detects only ~half the barge-ins |
| keeps talking through "haan / acchha" ≥ 90% | **[SIM]** 68-70/72 = 94-97% (was 16-48/72). **[ADULT]** 204/269 = 75.8% (CI 70-81) | yes [SIM], no [ADULT] |
| false yields to TV / sibling ≤ 10% | **[SIM]** sibling 24/24 on every lane (not fixed). Cooker 6-8/24, worse than the base on D4 and FAST; the tone rule's TEST number is not independent. TV (TRAIN, mid-lesson prior) 2-4/24. **[ADULT]** other adults in the room 16/209 = 7.7% | no |
| thinking-pause cut-offs ≤ tuned silence and ≤ 3% | **[SIM]** 0/732, 0/732, 5/732. **[ADULT]** D4 17/111 = 15.3% vs silence-640 99/111 and silence-900 79/111. FAST: 28/111 | ≤ silence yes; ≤ 3% only [SIM] |
| decision gap p50 ≤ 350 ms (India lane) | **[SIM]** FAST 360 ms, MAI 330 ms (closed answers dominate), D4 1,150 ms. **[ADULT]** open English, other talkers masked: 1,870 (D4) / 1,910 (FAST) ms p50, 7 / 39 of 1,071 ends ≤ 350 ms | [SIM] on MAI only; not on real speech |

**Not changed by this stream (it was already true at HEAD):**
- safety detection [SIM] 84 / 84 / 82 of 84 (was 84 / 82 / 76);
- non-safety speech after distress [SIM] 0 / 0 / 2 of 84 (was 0 / 2 / 6);
- echo self-trigger 0/80; hold violations 0/48; verdicts on a repaired value 0/40.
