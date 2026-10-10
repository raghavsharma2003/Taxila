# r4-timeline — the round 3 review timeline harness (latency baseline instrument)

Moved here from the round 3 review scratchpad (BUILD-PLAN §2 S0.2) so cloud sessions can reproduce
`ms-r3fix-latency-breakdown-2026-10-10` and `ms-r3rv-silence-after-answer-2026-10-10`
(end of child speech → her first audible word p50 6,070 / p90 7,583 ms, n = 48-50, local production build).

It is an interactive browser driver, not a batch test: a small HTTP command server on 127.0.0.1:5199 holds
Playwright sessions and a reviewer (or a script) drives them one JSON command at a time. The automated
first-sound harness, `evals/relational-human/first-sound.mjs`, measures the same end-to-end number in batch
(local before-arm 6,107 / 7,856 ms, n = 90; prod 5,991 / 6,780 ms, n = 20) — use it for n ≥ 48 runs, and
this driver for the per-stage page-clock timeline.

## What is real and what is faked

- Real: the local production build (`node server/serve.mjs` + `server/worker.mjs`, `NODE_ENV=production`),
  prod model routing (`preload.mjs`), real Azure models and DragonHD TTS, the cascade link, duplex engine,
  turn, ack, TTS stream and Desk.
- Faked: the microphone (a speech clip played for the utterance's length) and the transcription WebRTC call
  (a fake that emits gpt-live-transcribe's events with a FIXED 750 ms commit → final, the measured
  taxila-live-transcribe p50). Label every number from it "local build, fixed 750 ms fake ASR, not a child".

## speech.wav is not committed

The round 3 clip's provenance is unknown, so it is not in git (`.gitignore`). Synthesise a child-like clip
the way `evals/relational-human/first-sound.mjs` does (gpt-4o-mini-tts, pitch 1.2×), save it as
`tests/prod/r4-timeline/speech.wav` (or point `RV_SPEECH` at it), and re-measure the baseline with the new
clip before any "after" number. The clip only drives the VAD and the page clock; the words come from the
fake transcript.

## Run

```
# Neon: preload.mjs forces TAXILA_DB=test and deletes DATABASE_URL — your .env.local TEST_DATABASE_URL must be
# YOUR stream's Neon branch, never production.
tests/prod/r4-timeline/serve.sh 5190 /tmp/web.log web &
tests/prod/r4-timeline/serve.sh 5191 /tmp/worker.log worker &
node tests/prod/r4-timeline/accounts.mjs make          # TEST accounts; cookies in run/ (gitignored, mode 600)
node tests/prod/r4-timeline/driver.mjs &               # command server on :5199
tests/prod/r4-timeline/r "$(node tests/prod/r4-timeline/openchild.mjs owner golu s1 phone360 /c/{cid})"
# then drive it: {"op":"say",...}, {"op":"tap",...}, {"op":"wait",...}, {"op":"timeline",...}, {"op":"shot",...}
```

Shots go to `docs/design/round4/build/latency/timeline-shots` (override with `RV_SHOTS`). Read `driver.mjs`
for the command set (`open`, `say`, `tap`, `wait`, `timeline`, `shot`, …).
