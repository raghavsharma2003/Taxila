# r12 T-voice patch requests (files outside src/duplex/**, src/voice/**, src/voicesig/**)

Both are also committed on `claude/r4-duplex` as one `[patch-request]` commit, so the branch builds and tests as it will
after main applies them. They are hooks only: every call goes to `src/voice/trace.ts`, which is wrapped and does
nothing until the client bus (src/trace/**, T-client) installs a sink. No behaviour change. Proved by
`tests/r12-voice-trace.test.mjs`, which re-runs `tests/voice-cascade.test.mjs` and `tests/p1-duplex-live.test.mjs` under
a recorder that throws on every call, and under a tier-1 recorder that fails the run if one blob or audio byte is handed
over.

| # | file | what |
|---|---|---|
| 01 | `src/lesson/cascadeLink.ts` | one `VoiceLinkTrace` per link. Hooks at: mic open / denied (`connect`); transport (webrtc / recording / typed); the transcription config (`open`); every raw transcription event (the data channel, before the duplex engine and the protocol see it); local VAD edges; tap start / end; push-to-talk changes; reply requested (with her player's output node, for the tier-2 clip of what actually played); pause / resume / stop; the barge-in steps (server speech start, local duck, local pause, unconfirmed, the transcript's verdict); the duplex engine's start (live or not, and why); close |
| 02 | `src/child/lesson/LessonScreen.tsx` | `traceMicMode(...)` in an effect over the gates that decide tap vs hands-free (older, talk pref, headset, echo demotion, duplexLive, duplexFallback, transport, push-to-talk). The Kaksha skin wraps this same Desk, so this covers both |

Apply: `git apply docs/design/round4/build/r12/t-voice/patches/0{1,2}-*.diff` on base 84bc6050 (or cherry-pick the
`[patch-request]` commit). T-client also hooks `src/child/lesson/**`; patch 02 adds 6 lines next to `useHeadset()` and an
import, so a conflict there is textual only.
