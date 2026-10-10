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
| step 0 baseline reproduced | done: 5,183 / 6,712 ms (n = 58) on PRODUCTION STT, within 15 % of 6,070 |
| per-stage turn trace | done: `evals/latency/stages.mjs` over first-sound rows (server marks + model calls) |
| dock "Thinking… N s" counter | patch request 01 (stream 2's file), applied on this branch as a `[patch-request]` commit |
| L1 levers | built and measured. **After, n = 117: reply audible p50 4,238 / p90 5,718 ms** (from 5,183 / 6,712: −945 / −994). Tap-to-talk page clock (n = 12): 5,005 → 3,452 after two client bug fixes |
| reply bar p50 ≤ 3,000 / p90 ≤ 4,500 | **NOT met** (4,238 / 5,718 at n = 117). Why, and what would meet it: "The floor" below |
| L2 echo instant | `TAXILA_ACK_AT_MS=1000` holds the ack-leak bars (n = 48 graded); 850 leaks. Echo audible p50 2,971 → **2,285 ms** (n = 17 played); ≤ 1,500 **NOT met** (floor below) |
| L3 shadow | early distress read measured (below); echo-at-900 counterfactual below |
| 900 ms (V4.3) | **NOT met** (0 of 400+ measured turns ≤ 900 ms) |

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

## Instrument fix: the preload did not use production's STT

`tests/prod/r4-timeline/preload.mjs` set production's classify routing but not `TAXILA_STT_MODEL`; production eastus2
transcribes the cascade with **gpt-live-transcribe** (`scripts/deploy-azure.mjs`). On gpt-4o-transcribe the deltas arrive
with the final (~25 ms before it), so the device prefetch never fired (0/37 turns, arm `l1-config-pf-np-ta`). The preload
now sets `TAXILA_STT_MODEL=taxila-live-transcribe`; the baseline of record is the re-run on it (5,183 / 6,712 ms, n = 58):
its final lands later (1,599 vs 1,390 ms) but the deltas are complete at ~850 ms, which is what the prefetch needs.

## Before / after, the stage table (same harness, same script; after = every lever and recommended flag on)

**After** (`runs/after-a.json` + `runs/after-b.json`, 2026-10-10, n = 117 turns, `TAXILA_TURN_PREFETCH=on TAXILA_EXACT_SPEC=on
TAXILA_ACK_AT_MS=1000 TAXILA_TTS_FIRST_SENTENCE=shadow`, the edgeTrim fix and the speculative Studio row; this stream's
battery only, 3 parallel lessons, 0 × 429):

| stage | n | p50 | p90 | min | max |
|---|---|---|---|---|---|
| end of speech → server VAD stop | 117 | 1073 | 1120 | 851 | 1645 |
| → final transcript | 117 | 1569 | 1658 | 1376 | 3283 |
| → turn POST | 117 | 1569 | 1658 | 1377 | 3284 |
| server @prefetch_adopted | 114 | 59 | 72 | 42 | 223 |
| server @classified | 117 | 407 | 725 | 43 | 1690 |
| server @noted | 109 | 1138 | 1667 | 67 | 2030 |
| server @planned | 117 | 1096 | 1615 | 86 | 2032 |
| server @replied | 117 | 2081 | 3606 | 115 | 5282 |
| server @stored | 117 | 2140 | 3693 | 188 | 5366 |
| server total | 117 | 2140 | 3693 | 188 | 5366 |
| turn round trip (client) | 117 | 2143 | 3695 | 191 | 5370 |
| → turn response | 117 | 3788 | 5245 | 2305 | 6976 |
| response → first PCM byte | 117 | 393 | 449 | 26 | 1370 |
| TTS prewarm age at tts-stream | 117 | 61 | 89 | 48 | 165 |
| → first PCM byte | 117 | 4125 | 5608 | 2610 | 7398 |
| → reply audible (+60 lead +50 nominal out) | 117 | 4238 | 5718 | 2720 | 7508 |
| → echo audible (played only) | 17 | 2285 | 2494 | 2045 | 3393 |
| → first sound (echo or reply) | 117 | 4160 | 5718 | 2045 | 7508 |
| SHADOW reply audible, s1 early | 117 | 4235 | 5718 | 2669 | 7508 |
| SHADOW gain on locked turns | 53 | 57 | 84 | 47 | 145 |
| first sound, graded answers | 24 | 2426 | 4772 | 2045 | 5718 |
| first sound, non-answers | 93 | 4339 | 5955 | 2720 | 7508 |
| model grok-4-1-fast-non-reasoning (prefetch) | 109 | 809 | 1061 | 403 | 2113 |
| model grok-4-1-fast-non-reasoning | 3 | 764 | 1322 | 549 | 1322 |
| model taxila-fast (speculative) | 113 | 1237 | 1502 | 793 | 1650 |
| model taxila-fast | 43 | 1210 | 1630 | 869 | 2775 |
| model taxila-gpt6 (prefetch) | 2 | 1610 | 1610 | 1507 | 1610 |
| model taxila-gpt6 | 3 | 1669 | 1966 | 1337 | 1966 |
{"turns":117,"speculation":"85/117 hit","prefetchAdopted":"114/117","rewrites":34,"echoPlayed":"17/24 graded","earlyLocked":"53/117 locked, 52 kept s1","earlyWhy":{"no_pinned_question":26,"turn_kind":22,"s1_script":2,"s1_screen":7,"s1_leak":1,"min_same":2,"min_long":2,"s1_praise":1,"min_bare":1},"under900":"0/117 reply ≤ 900 ms"}

**Before** (`runs/baseline-live-prefetch-off.json`, n = 58, prefetch off, base tree):

| stage | n | p50 | p90 | min | max |
|---|---|---|---|---|---|
| end of speech → server VAD stop | 58 | 1084 | 1107 | 1038 | 3355 |
| → final transcript | 58 | 1599 | 1661 | 1520 | 4029 |
| → turn POST | 58 | 1599 | 1662 | 1520 | 4030 |
| server @classified | 58 | 848 | 1104 | 60 | 1384 |
| server @noted | 54 | 1429 | 1925 | 695 | 2248 |
| server @planned | 58 | 1430 | 1923 | 107 | 2251 |
| server @replied | 58 | 2629 | 4081 | 1162 | 4802 |
| server @stored | 58 | 2689 | 4155 | 1219 | 4856 |
| server total | 58 | 2689 | 4155 | 1219 | 4856 |
| turn round trip (client) | 58 | 2699 | 4162 | 1224 | 4860 |
| → turn response | 58 | 4317 | 5837 | 2886 | 8039 |
| response → first PCM byte | 58 | 785 | 847 | 71 | 1654 |
| TTS prewarm age at tts-stream | 58 | 60 | 78 | 51 | 97 |
| → first PCM byte | 58 | 5073 | 6602 | 3301 | 8909 |
| → reply audible (+60 lead +50 nominal out) | 58 | 5183 | 6712 | 3411 | 9019 |
| → echo audible (played only) | 10 | 2971 | 3122 | 2910 | 3182 |
| → first sound (echo or reply) | 58 | 5134 | 6302 | 2910 | 9019 |
| first sound, graded answers | 13 | 2995 | 4221 | 2910 | 4737 |
| first sound, non-answers | 45 | 5271 | 6994 | 3411 | 9019 |
| model grok-4-1-fast-non-reasoning | 54 | 771 | 960 | 621 | 1309 |
| model taxila-fast (speculative) | 28 | 1192 | 1454 | 790 | 1512 |
| model taxila-fast | 51 | 1280 | 1582 | 918 | 2042 |
| model taxila-gpt6 | 53 | 1361 | 1859 | 1089 | 2403 |
{"turns":58,"speculation":"17/54 hit","prefetchAdopted":"0/58","rewrites":15,"echoPlayed":"10/13 graded","under900":"0/58 reply ≤ 900 ms"}

## L1 — levers, each measured on the same harness (first-sound, 3 lessons × 20 turns, ack on, 2026-10-10)

| arm | n | reply audible p50 | p90 | final transcript p50 | server p50 | response→first PCM p50 | spec hit | rewrites | echo audible p50 (played) |
|---|---|---|---|---|---|---|---|---|---|
| baseline (prod STT live-transcribe), prefetch off | 58 | 5,183 | 6,712 | 1,599 | 2,689 | 785 | 17/54 | 15 | 2,971 (10) |
| + `TAXILA_TURN_PREFETCH=on` (device prefetch) | 59 | 4,630 | 6,580 | 1,602 | 2,059 | 784 | 19/57 | 21 | 2,550 (9) |
| + edgeTrim tail fix (code) | 56 | **4,164** | **5,354** | 1,550 | 2,080 | **408** | 23/54 | 11 | 2,579 (4) |
| + speculative Studio row (code + patch 02) | 58 | 4,454 | 5,795 | 1,547 | 2,368 | 395 | 21/53 | 18 | 2,431 (7) |
| + `TAXILA_EXACT_SPEC=on` | 52 | 4,413 | 5,788 | 1,552 | 2,190 | 390 | **36/52** | 17 | 2,420 (9) |
| + device debounce 100 ms (not kept) | 58 | 4,185 | 5,915 | 1,573 | 2,285 | 395 | 39/58 | 13 | 2,505 (5) |
| v1 baseline (gpt-4o-transcribe: not prod STT) | 59 | 5,065 | 6,319 | 1,390 | 2,819 | 762 | 18/55 | 16 | 2,731 (7) |

Load: this stream's battery only, ≤ 3 parallel lessons, 0 × 429. The L3 distress eval (4 parallel calls) overlapped the
debounce arm. Rewrites (a second ~1.2 s reply call) vary 11-21 per 52-59 turns between runs and move the p50 by about
±250 ms, so arms within ~300 ms of each other are not distinguishable at this n.

What each lever did:
- **Prefetch on** (existing, `dec-r3rh-prefetch-on`): the perceive stage starts on the stable partial (~1,050-1,100 ms after
  speech end) instead of the final (~1,550-1,600): adopted 57-58/59. −553 ms p50. Model calls per turn rise
  (taxila-fast ~5 → ~7.6 per turn with EXACT on); 0 × 429 at this load, prod quota not checked from here.
- **edgeTrim tail fix** (`server/voice/expressive/pauses.js`, a bug): part 0 of every multi-part reply held back the last
  800 ms of ALL audio before its first byte. Now only the trailing quiet run is held. Response → first PCM 784 → 408 ms;
  the warm-socket DragonHD first byte from this host is 413 ms (`evals/latency/dhd-ttfb-region.mjs`, SIN; Central India
  449 ms), so the TTS hop is now at the engine's own floor and **the DragonHD socket pool is already warm** (lever
  "keep the DHD pool warm": nothing left to win; the prefetch route opens the socket).
- **Speculative Studio row**: the real turn adds the "on screen now" row after its kernel; speculative replies never had
  it. Pure-row misses 10 → 1, but the hit rate did not move: the remaining misses are plan changes the UNDERSTAND note makes.
- **EXACT speculation** (`TAXILA_EXACT_SPEC`, default off): on the prefetch, the reply for the turn's own plan starts the
  moment classify (and on a non-answer the note) is in. Hits 21/53 → 36/52. The p50 barely moves, because on a hit the
  reply was still not ready when the turn planned (reply model ~1.3 s, prefetch only ~550 ms ahead of /turn).
- **Device debounce 100 ms**: the prefetch fires 210 ms sooner but 2.4 prefetches per turn instead of ~2 and adoption
  drops (47/58); within noise. The device rule stays 250 ms.
- **Note-parallel** (`TAXILA_NOTE_PARALLEL`): superseded by EXACT on the prefetch path (EXACT starts the right plan's reply,
  note-parallel starts the no-note plan's); not measured separately on prod STT.
- **Turn-audio fold** (client `voice.turnAudio`, existing): locally the client hop is ~0 (localhost), so the harness cannot
  show its gain (it saves one India ↔ eastus2 round trip plus the tts-stream auth on production). Switching the client
  default on broke 2 browser tests owned by other streams (they stub `/api/lesson/turn`); left OFF, listed as a main
  decision below.

## The floor: why p50 ≤ 3,000 is not reachable on this harness under today's rules

Clean speculation hits (no rewrite), n = 36: final transcript 1,547 → the note decides the plan at +830 ms into /turn →
the reply is ready at +1,152 → stored +1,205 → first PCM +398 → p50 audible 3,607 ms. Every stage on that path is a model
or the transcript, not our code:

| stage | p50 | owner |
|---|---|---|
| gpt-live-transcribe final after speech end (900 ms server-VAD silence, `voice-turn-config`) | 1,550 | rule (children are cut off below 900 ms) |
| UNDERSTAND note on a non-answer (taxila-gpt6), from the prefetch | ~1,370 | 4A |
| reply model (taxila-fast, effort none), from its start | ~1,250-1,350 | model routing |
| a guard rewrite (a second reply call) on 25-35 % of turns | +1,200 | 4A guards |
| DragonHD first byte, warm socket | ~400 | engine floor |

The turn cannot start before the final transcript (the words the child said are the words the turn commits; committing on
the stable partial is the L3 decision). With the reply written in parallel from the prefetch, the best case is
prefetch (~1,100) + max(note ~1,370, reply ~1,300) + commit 50 + TTS 400 + 110 ≈ **3,000 ms on a clean hit**; misses and
rewrites put the p50 at ~4,200-4,450. Meeting 3,000 / 4,500 needs at least one of: a faster note and reply model (≤ ~700 ms
each), fewer rewrites, TTS-first-sentence released live on rewrite turns (shadow-built, below), or committing the turn on
the stable partial (L3).

## Page clock: the timeline harness on a local production build (tests/prod/r4-timeline, 2026-10-10)

The browser path the first-sound harness does not model. Local production build (`server/serve.mjs`, `NODE_ENV=production`,
the r4-timeline preload = prod routing), every "after" flag on, Playwright phone 360 × 800, fake transcription call with a
FIXED 750 ms commit → final (driver.mjs), a synthesised child clip (gpt-4o-mini-tts ×1.2; not a child). Small n: indicative.

**Tap-to-talk** (the default path for every child outside the duplex cohort), plain account, class 7, the child taps Done
0.7 s after speaking, same 12 lines each:

| build | n | reply audible p50 (page clock) | prefetch sent | turn-ack asked | echo granted |
|---|---|---|---|---|---|
| branch before the client fixes | 12 | 5,005 | 0/12 | 0/12 | 0 |
| + Done tap → prefetch (`cascadeLink.talkEnd`) | 12 | 4,392 | 12/12 | 0/12 | 0 |
| + press opens the echo's turn (`cascadeLink.talkStart`) | 12 | **3,452** | 12/12 | 12/12 | 2 (both graded, decided ~2.1 s) |

Two client bugs, both fixed in `src/lesson/cascadeLink.ts` (tests/r4-latency-ptt-prefetch.test.mjs fails on the old link):
- the prefetcher's "child stopped" signal came only from the energy VAD, which tap-to-talk does not use, so tap-to-talk never
  prefetched. gpt-live-transcribe does stream the words during push-to-talk speech (`evals/latency/ptt-deltas.mjs`, real
  Azure, n = 8: deltas before the commit 8/8, last delta p50 +711 ms after speech end, final +1,286, deltas = final 8/8);
- `talkStart` emitted `child_speech_start` straight to the runtime, so the AckClient never reopened its turn after her reply
  and refused to ask: the echo was never requested on tap-to-talk (0/24 here; round 3 saw 0 in 21).

**Hands-free (duplex cohort)**, owner account, class 4, n = 8 + 6, for stream 4B (read-only to this stream):
- with a clip that has natural ~410-465 ms pauses at commas (6 turns), the engine committed MID-UTTERANCE on 4/6 turns (commit
  0.2-2.8 s before the child finished) and sent truncated words ("Mujhe lagta hai dabbe", "Achha, aur corner woh", "Mujhe nahi
  pata, ek"); her reply then came 4.7-12.1 s after the child stopped. Children pause mid-sentence; this is a correctness issue,
  not only latency;
- with a continuous clip (no pause ≥ 150 ms, 8 turns) the words were whole and the engine committed +250-530 ms after speech end,
  but the turn POST trailed the final transcript by 6-1,450 ms (p50 ~800), only 2/8 turns prefetched, and reply audible p50
  was ~4.9 s. Both belong to 4B's engine (`src/duplex/**`); reported to the main session, not changed here.

## L2 — the echo's fixed instant (`evals/relational-human/ack-leak.mjs`, 70 answers per arm, 9 topics, seed 11, prefetch on, prod routing, US container, 2026-10-10; the gate run overlapped these arms, which loads right and wrong equally)

| `TAXILA_ACK_AT_MS` | graded (R / W) | P(echo \| right) | P(echo \| wrong) | gap (bar ≤ 0.15) | AUC right decided sooner (bar ≤ 0.65) | "late" refusals R / W | verdict |
|---|---|---|---|---|---|---|---|
| 1,200 (today) | 56 (27 / 29) | 19/27 [0.52, 0.84] | 14/29 [0.31, 0.66] | 0.22 | 0.49 | 0 / 0 | the gap is the governor's consecutive / window / not-an-answer refusals, not timing (0 late) |
| **1,000** | 48 (28 / 20) | 17/28 [0.42, 0.76] | 14/20 [0.48, 0.85] | −0.09 | 0.58 | 0 / 1 | **holds both bars** |
| 850 | 53 (27 / 26) | 22/27 [0.63, 0.92] | 8/26 [0.17, 0.50] | 0.51 | 0.57 | 3 / 21 | **leaks**: wrong answers are still being classified at 850 ms |

Recommendation: `TAXILA_ACK_AT_MS=1000` (−200 ms on every echo). The code default stays 1,200 (release-flag rule); the main
session switches it, and must re-run ack-leak if the classify deployment, its hedge or prod load changes
(`dec-r3rh-ack-fixed-instant`). n is just over 40 and the CIs are wide.

**Echo p50 ≤ 1,500 ms is not reachable under the hard rule.** The echo is decided at the perception start + T; the perception
starts on the prefetch (~1,050-1,100 ms after speech end: gpt-live-transcribe's deltas are complete at ~850 ms, plus the
device's 250 ms quiet rule), and T must cover classify's tail (its model distress read: grok p50 ~860 ms from the prefetch).
Best case ≈ 1,100 + 1,000 + 110 = **~2,200 ms** (measured played echoes at T = 1,200: p50 2,420-2,580). Reaching 1,500 needs
the words (and a distress read) by ~400 ms after speech end: that is L3.

## L3 — SHADOW only (never live; needs an owner + safety decision, BUILD-PLAN §5 decision 1)

**Early distress read** (`evals/latency/l3-early-distress.mjs`, run `runs/l3-early-distress.json`, 2026-10-10, US container,
adult-written text): the code predicate plus one distressCheck-shaped model call, on 265 labelled distress lines (the
safety-robust red-team + held-out sets) and 100 plain hard negatives.

| model read | latency p50 / p90 | ≤ 300 ms | recall (predicate OR model) | false positives (plain negatives) |
|---|---|---|---|---|
| grok-4-1-fast-non-reasoning (prod classify) | 480 / 585 ms | 0/365 | 265/265 | 3/100 |
| taxila-fast | 1,154 / 1,473 ms | 0/365 | 265/265 | 4/100 |

The predicate alone recalls 265/265 here, but these lines were used to TUNE it (DEV data, not held out): this says nothing
about a child's unseen phrasing. 33 / 52 calls errored (kinds now recorded; a content-filter block counts as distress, as
classify fails closed). No model read is within 300 ms from this host.

**"Would have sounded at"** for an echo under L3 (EOT ≤ 400 ms on the words + an early distress read), from the measured
stages: 400 (EOT) + 480 (grok read p50) + 110 (lead + nominal output) ≈ **~990 ms** at best, IF the words were final at
400 ms. They are not: gpt-live-transcribe's joined deltas are complete only at p50 ~850 ms after speech end (n = 110), so
with today's transcriber the same path gives ≈ 850 + 480 + 110 ≈ **~1,440 ms**. The 900 ms bar needs both a faster
transcript (4B's word-aware EOT) and a sub-300 ms distress read; neither exists today.

## Model bake-off for the note and the reply (main-session decision 4: Azure Direct only; speed and quality are never traded)

**UNDERSTAND note** (`evals/latency/note-bakeoff.mjs`, a copy of the bake-off of record with the never-measured Azure Direct
arms added; the same 355-case battery and policy-move scoring; 2026-10-10, US container, concurrency 4;
`runs/note-bakeoff/`):

| arm | policy-move accuracy | distress recall | p50 / p90 ms | verdict |
|---|---|---|---|---|
| gpt-6-sol (taxila-gpt6, today, control) | 330/355 (93%) [91-95%] | 9/10 | 1,542 / 1,870 | keep |
| gpt-6.1-sol | 333/355 (94%) | 9/10 | 2,101 / 2,780 | slower |
| gpt-6-astra | 335/355 (94%) | 9/10 | 2,364 / 3,485 | slower |
| deepseek-v4-flash (ds4f) | 163/355 (46%), 172 errors | 0/10 | 813 / 1,206 | quality: rejected |
| kimi-2.6 | 2/355, 353 errors | 0/10 | — | unusable on this call |
| *2026-10-04, same battery:* grok-4-1-fast / taxila-fast / gpt-6-luna | 313 / 313 / 316 of 355 (88-89%) | 7 / 9 / 9 of 10 | 861 / 1,141 / 1,242 | faster but lose 14-17 cases: rejected |

No Azure Direct model is faster than gpt-6-sol at its accuracy. The note stays.

**Reply model**: the 2026-10-04 text-lane refresh (model-judged, so labelled so) already ranks the faster models below today's
taxila-fast on the production prompt (grok-4-20 −0.33, mistral −0.29, ds4f −0.08 with 22/36 guard fires) and gpt-6-luna
above it (+0.53 [0.11, 1.00]) at +226 ms first token but FEWER guard fires (12/36 vs 16/36): fewer rewrites could make it
faster end to end. That arm is measured on this harness below (in progress).

## Gates (this branch, 2026-10-10)

| gate | result |
|---|---|
| `npx tsc -b` | pass |
| `npx vite build` | pass |
| `npm test` | merged with base 9920f21: 2,563 pass, 60 fail. The 60 = `tests/engines-browser.test.mjs`: the frame's CSP refuses Vite's HMR websocket (`connect-src 'none'`), a console error in this container (the base tree check is below). 0 other fails |
| full-suite-only fails, root-caused (031724d3) | `tests/index.js` runs EVERY test file in ONE process, so module state is shared and a root-level `before()`/`after()` holds for the whole run. `r4-latency-spec-row` put seam fakes in at import time (then in a root `before()`), replacing `p4-content-seam`'s evidence writer ("host-graded kt_evidence event" never seen); `voice-player-clock` and `p2-face-player` each pinned `performance.now` to their own virtual clock in a root `before()`, and the later one froze the other ("re-anchor cuts"). Not load. Reproduced deterministically: the five files in one process fail 2 before, 0 after (3/3). Each test body now installs and restores its fakes / clock |
| check-prompt-budget | PASS |
| lint-ui | 353 findings = the baseline (0 new) |
| adversarial (`docs/design/round3/adversarial`) | 22/23: all 13 blocking pass; N1 (non-blocking, owner decision) fails as before |
| persona invariants | 70/70 |
| w2i-safety (local production build, every flag above on) | **39/39** |
| verify-release (static gates; npm test run separately) | 9/10: typecheck, prompt-budget, kit-budget, persona-invariants, never-rules, pii, spoken, context, web-build pass; lint-ui exits 1 on its 353-finding baseline (none in this stream's files, 0 new) |
| engines-browser on the BASE tree (worktree of `claude/blissful-mayer-icwe2j`) | 0/60 in this container too (frame load timeout): the 60 npm-test fails are the container's, not this branch's |

Container note: Playwright here expects `chromium_headless_shell-1243`; only 1194 is installed. A container-local shim
(`/opt/pw-browsers/chromium_headless_shell-1243/...` → the 1194 headless shell) makes the browser tests run; nothing in
the repo depends on it.

## TTS first sentence: measured in shadow, live mode NOT built (rejected on its numbers)

The lock (`server/brain/say.js lockFirstSentence`, `TAXILA_TTS_FIRST_SENTENCE=shadow`) ran on all 117 after-turns: s1 locked on
53/117 (the final reply kept s1 on 52/53), but 44 of the 53 were speculation hits whose reply was already final when the turn
picked it, and only **2 of the 34 rewrite turns** could lock (15 were closing / check-in / why / thinking turns, 9 teaching
turns with no pinned question, the rest failed a per-sentence guard on s1). Estimated gain of speaking s1 at the lock: **p50
57 ms** on locked turns, reply audible p50 4,238 → 4,235. A live mode would need the client to play audio before the turn
response and would let a child hear s1 of a turn that then fails to commit (409). Not worth it at these numbers: the shadow
stays as the instrument (it re-measures if the guards or the rewrite rate change). Locking more of the rewrite turns would
mean locking s1 on closing or safety-adjacent turns, which this stream will not do.

## Owner / main-session decisions needed

1. **`TAXILA_TURN_PREFETCH=on`** (already shipping with round 3) and **`TAXILA_EXACT_SPEC=on`**: switch on when prod shows 0
   hot-lane 429s from them (taxila-fast ~7.6 calls per turn with both on, local).
2. **`TAXILA_ACK_AT_MS=1000`**: holds the leak bars at n = 48 graded (above).
3. **Client turn-audio fold default on** (`src/lesson/ttsStream.ts turnAudioEnabled`): saves one India ↔ eastus2 round
   trip per reply on prod (not measurable locally). Two other streams' browser tests stub `/api/lesson/turn` and fail with
   it on, so it needs either those fixtures updated or `VITE_TURN_AUDIO=1` at build.
4. **TTS first sentence live**: measured in shadow and NOT recommended (−57 ms p50, 2/34 rewrite turns lockable).
5. **The 3,000 ms reply bar** is out of reach without a faster UNDERSTAND note / reply model (4A / model routing) or fewer
   guard rewrites (4A), see "The floor". The 900 ms bar needs L3 (decision 1 in BUILD-PLAN §5).
