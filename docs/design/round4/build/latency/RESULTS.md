# Round 4 · stream 3 · LATENCY — results

Branch `claude/r4-latency` (from `claude/blissful-mayer-icwe2j` @ 8e438f04). Owner bar VALUES V4.3: her first sound
p50 ≤ 900 ms after the child finishes. Stream acceptance (BUILD-PLAN §3.3): reply first audible p50 ≤ 3,000 / p90 ≤
4,500 ms on the same harness and n; echo on graded answers p50 ≤ 1,500 ms with the ack-leak bars held; 0 safety
regressions; L3 shadow numbers reported.

**No child has used any of this.** Every number below is from a local in-process server on this cloud container (US),
synthetic child speech (gpt-4o-mini-tts, pitch ×1.2), real Azure models + real DragonHD TTS, real gpt-live-transcribe
over WebSocket from this host. "Audible" = first PCM byte + 60 ms player lead + a NOMINAL 50 ms device output latency.

## Status

| item | state |
|---|---|
| step 0 baseline reproduced | done (see below; 5,065 ms is 17 % under the 6,070 timeline number, explained) |
| per-stage turn trace | done: `evals/latency/stages.mjs` over first-sound rows (server marks + model calls) |
| dock "Thinking… N s" counter | patch request 01 (stream 2's file), applied on this branch as a `[patch-request]` commit |
| L1 levers | in progress |
| L2 echo instant | not started |
| L3 shadow | not started |
| 900 ms (V4.3) | **NOT met** (0/59 turns ≤ 900 ms at baseline) |

## Instrument

`evals/relational-human/first-sound.mjs` (the batch first-sound harness; README of `tests/prod/r4-timeline` names it the
better instrument for n ≥ 48), run through `tests/prod/r4-timeline/preload.mjs` for production model routing
(`DEPLOY_CLASSIFY=grok-4-1-fast-non-reasoning`, `TAXILA_CLASSIFY_HEDGE_MS=1500`, Neon TEST = this stream's own branch,
`NODE_ENV=production`), 3 lessons in parallel × 20 turns, `--ack` (the device's echo rules), topic c4-maths-ch01-t01.
Speech: `AZURE_SPEECH_REGION_SIN` (Diya DragonHD) **from a US container** — production speaks from an India container.
New in this stream: `--turn-audio` (the device's round-trip fold) and per-turn model calls in each row.

    node --env-file=.env.local --import ./tests/prod/r4-timeline/preload.mjs evals/relational-human/first-sound.mjs \
      --lessons 3 --turns 20 --ack [--prefetch] [--turn-audio] --out run.json
    node evals/latency/stages.mjs run.json [--md]

## Step 0 — baseline (2026-10-10, base 8e438f04, prefetch OFF, n = 59 turns, 1 skipped for an STT socket stall)

Load: this stream's battery only (3 parallel lessons); other streams share the Azure quota (0 × 429 seen).
Run file: `runs/baseline-prefetch-off.json`.

| stage (ms after the child's speech end; server rows: ms after /turn arrived) | n | p50 | p90 |
|---|---|---|---|
| end of speech → server VAD stop | 59 | 1,075 | 1,108 |
| → final transcript | 59 | 1,390 | 1,596 |
| → turn POST | 59 | 1,390 | 1,597 |
| server: ctx + kit read | 59 | 60 | 89 |
| server: classified (grok-4-1-fast, model distress read) | 59 | 818 | 1,162 |
| server: noted (UNDERSTAND note wait on non-answers) | 49 | 1,519 | 2,264 |
| server: planned | 59 | 1,422 | 2,257 |
| server: replied (reply model + guards + rewrites) | 59 | 2,773 | 3,959 |
| server: stored (one transaction) | 59 | 2,819 | 4,021 |
| → turn response | 59 | 4,287 | 5,441 |
| response → first PCM byte (prewarm already 55 ms old) | 59 | 762 | 819 |
| **→ reply audible** | 59 | **5,065** | **6,319** |
| → echo audible (played, 7 of 9 graded) | 7 | 2,731 | 2,766 |
| first sound, graded answers | 9 | 2,734 | 4,174 |
| first sound, non-answers | 50 | 5,229 | 6,339 |

Speculative reply hit 18/55; rewrites 16/59; 0/59 replies ≤ 900 ms.

Reproduction check: the brief asks for ±15 % of 6,070 ms. This run is 5,065 (−17 %). The round-3 number came from the
page-clock timeline with a FIXED 750 ms fake commit→final (final at 1,792 ms); this harness transcribes for real and the
final lands at 1,390 ms (−400 ms). From the final transcript on, the stages match the round-3 breakdown (turn ~2.8-3.0 s,
then ~0.8-0.9 s to audible). All "after" numbers are on this same harness, same n, same script.

Where the time goes (p50): ~1.4 s waiting for the transcript, ~0.8 s classify, ~0.7 s waiting for the UNDERSTAND note
(non-answers only, 49/59 turns), ~1.35 s reply model and guards, ~0.05 s commit, ~0.76 s to DragonHD's first byte.

## L1 (in progress)

## Owner / main-session decisions needed

- (none yet)
