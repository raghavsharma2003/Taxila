# Why the owner's phone was in tap-to-talk (r12 T-voice, 2026-10-11)

**The owner, release 11, Android phone:** "for the mic also I have to press". Hands-free is on for their account
(`TAXILA_DUPLEX=shadow` + `TAXILA_DUPLEX_LIVE_FOR`). The Me page said "Plug in headphones to use open mic".

**Short answer.** The code has **two separate roads to hands-free**, and the headset message belongs to the other one.
- **The open-mic setting** needs a headset. That is what the Me page reports.
- **The live duplex engine** (the owner cohort) needs no headset at all.

So "I had to tap" means the duplex engine **was not live** in that lesson. Today nothing records which of five causes
it was. Release 12 records every one of them (§4). **No behaviour changes in this release.**

## 1. The code path (one lesson UI; Kaksha is a skin over the same Desk)

| step | code | what decides |
|---|---|---|
| the open-mic rule | `src/child/lesson/headset.ts:40` `openMicAllowed` | `older && talk === "open" && (headset \|\| probePassed) && !echoDemoted`. `probePassed` is never set (the EchoProbe is not built). On a loudspeaker phone this is **false**. |
| the Me page hint | `src/child/screens/Me.tsx:96-100`, `copy.ts:104` | shown for any "older" child with no headset label. It describes **only** the open-mic rule, says nothing about duplex, and showed for the cohort too (misleading, not causal) |
| the Desk | `src/child/lesson/useDesk.ts:379-396` | `openMic = ctx.openMic \|\| bs.duplexLive`; `setPushToTalk(!openMic \|\| paused)`. **A live duplex engine turns tap-to-talk off with no headset.** |
| duplex mode | `src/duplex/flags.ts` `resolveDuplexMode` | a device key `tx.flag.duplex` wins; otherwise `GET /api/duplex/config`. An unknown answer (2 × 8 s) gives **shadow** |
| the server | `server/duplex/config.js` `modeFor` | with `shadow`: `{duplex:"on", cohort:"owner"}` only if there is a `tx_session` cookie, the guardian lookup answers within 2.5 s, and **sha256(guardian.email)** is in `TAXILA_DUPLEX_LIVE_FOR`. Too slow gives `retry`; anything else gives `shadow` |
| the engine | `src/lesson/cascadeLink.ts` `startDuplex` | not started if the mode is off or the transport is not `webrtc`. Once started it is live only in mode `on`. Fallbacks (`src/duplex/live.ts:82`): `no_frames`, `stt_unavailable`, `stt_rate_limited`, `engine_error`. Each restores tap-to-talk |

The research pass (file:line detail) found **no chicken-and-egg**. The engine starts whatever the push-to-talk state is.
It turns push-to-talk off itself, and `duplexLive` then keeps it off.

## 2. What was measured

All on a LOCAL production build, desktop Chromium with a fake mic. The transcriber is the r4-timeline fake (fixed 750
ms commit → final). TEST accounts on this stream's Neon branch. Not a phone, not a child.
`docs/design/round4/build/r12/t-voice/evidence/`.

| run | `/api/duplex/config` answer | mode | engine | Desk |
|---|---|---|---|---|
| cohort account (`run-cohort-tier1.txt`) | `{duplex:"on", cohort:"owner"}` in 46-106 ms | `on`, `source=server` | `mic.duplex.start live=true` 7.4 s after the lesson screen opened (once the transcription call was up) | `mic.mode duplex`, reasons `[]`. **Hands-free with no headset** |
| non-cohort account (`run-tap-tier1.txt`) | `{duplex:"shadow"}` | `shadow`, `source=server_shadow` | `live=false why=shadow_never_decides` | `mic.mode tap`, reasons `talk_pref_tap, no_headset_detected, echo_probe_not_built, duplex_shadow_only` |

So the switch works end to end on desktop Chromium when the cohort matches. The owner's phone did not reach it.

**From production (read-only RCA export, `rca/owner-lessons-2026-10-11.json`):**
- **Spoken turns:** 16 of the 17 child turns in the two lessons were spoken (1 typed).
- **No confidence recorded:** 0 of 16 carry `asr_conf`. The live transcriber accepts the logprobs request but returns
  none (documented at `server/voice/stt.js:17-25`). A mishearing like "recording rules" for "recursive rules"
  therefore has no confidence signal today. Release 12 records the transcript's least-sure words when the lane returns
  logprobs. In tier 2, the mic clip can be re-transcribed offline.
- **No talk mode recorded:** no turn row says which talk mode the lesson ran in. That is the gap this release closes.
- **Lane:** both lessons ran the cascade lane (`lesson.state.mode = "cascade"`; brain_trace lane cascade, 17/17).
- **"Unclear":** the Director's talk mix marked 8 of the 17 child turns `unclear` (6 + 2). Without the audio there is no
  way to tell a mishearing from an unclear child. Tier 2 keeps the mic clip for exactly this.

## 3. The candidates, most likely first (all UNCONFIRMED until a release-12 lesson is recorded)

1. **The cohort answer was `shadow`.** Three ways this can happen:
   - The signed-in guardian's email does not match the env list exactly. The match is
     sha256(lower(trim(email))). Accounts are always created with an email (`server/routes/account.js:34`).
   - The phone is signed in to a different account.
   - The lookup timed out twice and the client fell back to shadow.
2. **A device key.** `tx.flag.duplex` was set to `shadow` or `0` on that phone by an earlier `?duplex=` visit, and it
   wins over the server. `flags.ts:20-22` records the same symptom in an earlier test: "1 of 3 owner lesson starts
   ran tap-to-talk with no sign of why".
3. **The engine fell back on Android.** `no_frames` (the AudioWorklet or mic tap failed, or delivered no frames for
   3 s) or `stt_unavailable` (the transcription call dropped, so the link moved to the recording fallback, which is
   always tap).
4. A `VITE_DUPLEX` build flag.

## 4. What release 12 records, so the next lesson says which one

Owner-tapped lessons will answer this from `scripts/trace.mjs --session <lesson>`:

| event | fields | settles |
|---|---|---|
| `mic.duplex` | `mode`; `source` (device_key / server / server_shadow / server_unknown / server_off); `device`; `server`; `build`; `asks[]` (status, ms, duplex, retry, cohort) | 1, 2, 4 |
| `mic.duplex.start` | `live`; `why` (mode_off, transport_recording / typed, shadow_never_decides, engine_fallback:\<reason\>, engine_error) | 3 |
| `duplex.fallback` | `reason`, frames seen, phase | 3 |
| `mic.mode` | `mode` (tap / duplex), every gate that held (`reasons`), the inputs, the duplex source | the whole chain in one row |
| `mic.state` | open (track label, echoCancellation / noiseSuppression / AGC as the browser applied them), denied, transport, tap / hands_free | permission and device |

## 5. What it would take to go hands-free on a phone speaker

**A. For the owner cohort (no product decision changes; release 13 candidates, each a small patch):**
- Make the cohort match robust. Match the guardian id (or a phone hash) as well as the email. Return
  `cohort: "owner"` to the client so the Me page can say "Hands-free (owner test)" instead of the headset hint.
- Show `duplexFallback` and the resolved mode on screen for cohort accounts (or rely on the trace).
- The engine already runs on a loudspeaker: it relies on the browser's echo cancellation (`echoCancellation: true` in
  `cascadeLink.ts`) plus its own echo handling.
  - Simulated phone-like echo: 0/240 self-triggers (round 4 RESULTS §14).
  - Real AMI headset bleed: 13.2 %, which is not a phone measure.
  - The owner's own phone is the first real measurement. Release 12 records it (tier 2 keeps the clips).

**B. For every child (reverses `ds-mic-tap-default`; needs a decisions.md entry):**
- Build the EchoProbe (10 s; `probePassed`).
- Or let the live duplex engine own the floor for everyone. Duplex "on" still fails R2, R3, R5 and R6 (round 4
  RESULTS §12).
- Shadow telemetry (Gate S) from real lessons first.
- **Risks:**
  - Android echo cancellation varies by device: her own voice heard as the child, so she interrupts herself.
  - Siblings and the TV.
  - A thinking pause cut off.
  - Bluetooth labels misread.
