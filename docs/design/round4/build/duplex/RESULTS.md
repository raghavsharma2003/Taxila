# duplex (round 4, stream 4B) · RESULTS

**Status (2026-10-10):** 5 of 9 criteria met (R1 on both lanes, R1b, R2b, R4, R7), up from 3. R2, R3, R5 and R6 still
fail (§12). The hands-free "cut off mid-sentence" report was a harness artefact. The one real case found on the real
transcriber (1,000 ms pauses in closed answers, 2/72) is fixed (0/72). Nothing deployed. Production stays
`TAXILA_DUPLEX=shadow` + the owner cohort.

**What every number here is:** REAL RECORDED ADULT SPEECH replayed through the engine, deterministically, from the real
STT socket events recorded live in round 2 (eot-bench Hindi, LiveKit, CC BY 4.0; AMI Meeting Corpus, CC BY 4.0, English
incl. Indian-L1 adults; evaluation only). From the US sandbox. **No child has used any of this.** Simulated TaxilaFDB rows
(child-like TTS) are labelled SIMULATED.

BEFORE = the round-4 base (`ceaf9420`, = the round-3 engine) replayed this round; it reproduces round 3's files byte for byte
(E1: 0 of 400 turns differ on either lane; AMI: every row identical). AFTER = this branch. Same audio, same STT events,
same scorer (`evals/duplex-r3/criteria.mjs` → `evals/duplex-real/criteria.mjs`, unchanged).

Splits: E1 TRAIN = even row ids (77 thinking pauses >= 500 ms), TEST = odd (70). AMI TRAIN = ES2004b + IS1008b (the
meetings round 3 ablated on), TEST = ES2005b + IS1004b. Every parameter this round was chosen on TRAIN.

## 1. The nine criteria

| id | criterion (bar) | BEFORE | AFTER | met? |
|---|---|---|---|---|
| R1 | thinking-pause cut-offs <= 3 % and <= silence-900 (MAI) | 6/147 = 4.1 % [1.9-8.6] | **3/147 = 2.0 %** [0.7-5.8] (silence-900: 7/147) | **yes** |
| R1-D4 | the same, production lane | 7/147 = 4.8 % [2.3-9.5] | **4/147 = 2.7 %** [1.1-6.8] | **yes** |
| R1b | in-speech commits <= 1 % (MAI) | 4/400 | 4/400 | yes (unchanged) |
| R2 | decision gap p50 <= 350 ms, India lane | 1,011 ms | 1,012 ms | no (see §4) |
| R2b | undecided within 5 s <= 2 % | 1/400 | 1/400 | yes |
| R3 | keeps talking through continuers >= 90 % (AMI) | 154/195 = 79.0 % [72.7-84.1] | **160/195 = 82.1 %** [76.1-86.8] | no |
| R4 | stops within 200 ms on >= 50 % of real barge-ins | 24/51 = 47.1 % | **31/51 = 60.8 %** (stopped at all 36; p50 among stopped 150 ms) | **yes** |
| R5 | false yields to other voices <= 10 % | 32/239 = 13.4 % [9.6-18.3] | 33/239 = 13.8 % [10.0-18.8] (one worse) | no |
| R6 | self-yields on her own bleed <= 2 % | 101/730 = 13.8 % [11.5-16.5] | 96/730 = 13.2 % [10.9-15.8] | no |
| R7 | safety floor never weaker | green | green (§5) | yes |

## 2. R1 in detail (eot-bench Hindi, TRAIN vs TEST)

| lane | split | BEFORE cut-offs | AFTER cut-offs | BEFORE gap p50 / p90 | AFTER gap p50 / p90 |
|---|---|---|---|---|---|
| MAI | TRAIN | 2/77 = 2.6 % | 0/77 = 0.0 % | 1,012 / 1,220 | 1,012 / 2,241 |
| MAI | **TEST** | 4/70 = 5.7 % | **3/70 = 4.3 %** | 1,009 / 1,531 | 1,009 / 1,607 |
| D4 | TRAIN | 3/77 = 3.9 % | 1/77 = 1.3 % | 1,014 / 1,376 | 1,014 / 1,456 |
| D4 | **TEST** | 4/70 = 5.7 % | **3/70 = 4.3 %** | 1,024 / 1,537 | 1,026 / 1,582 |

- **What changed:** a `dictation` pause class (`src/duplex/markers.ts` `dictating`, `engineRules.ts` `pauseClass`,
  `config.ts PAUSE_WAIT.dictation` 2,400 ms). A dictation noun in the turn (नंबर, पता, फ्लैट, pin, id, …) and an unclosed
  tail that is the noun or a number. 6 of the 13 pauses round 3 still cut on the two lanes were read-outs
  ("टेबल नंबर [1.5 s] है", "मोबाइल नंबर है सात सौ [1.2 s] सिक्स…", a phone number in groups [2.2 s] then "मेरा ईमेल").
- **Chosen on TRAIN** by `evals/duplex-r4/eot-sweep-r4.mjs` (policy simulator on the round-3 pause tables, calibrated:
  it reproduces the engine's cut-offs exactly) as the least wait with the fewest TRAIN cut-offs on both lanes. Then
  confirmed on the real engine replay (`eot-replay.mjs`, `results/r4-after-{MAI,D4}.json`).
- **No turn got worse:** per hold, MAI 3 holds changed (all 1 → 0), D4 3 (all 1 → 0); 0 went 0 → 1.
- **The cost (said plainly):** 21/400 MAI and 10/400 D4 turn ends that END on a read-out are decided ~1.2 s later
  (MAI gap p90 1,480 → 2,241 ms). p50 does not move.
- **What still cuts (TEST, both lanes):** "…कैसे चलेगा ना?" (a question to her, then "जी"; 800 ms), "…आवेदन किया था।"
  (a closed sentence, then more; 1,000 ms), "…उस पे।" (a full stop after a postposition, 1,400 ms). Plus D4 TRAIN: a
  10-digit phone number closed with "।" and then an email (2,200 ms). The last-but-one is a candidate rule (a terminal mark
  after a postposition is not a turn end), but it was SEEN on TEST, so it is not built this round: it needs fresh data.
- Honesty note: the failure listing that motivated the class was printed for both splits (the round-3 docs already
  named those turns); the parameter itself was chosen on TRAIN only.

## 3. The eager end of turn for stream 3 (R1-qualified)

`PrepareHint` (on every `think/prepare` command) now also carries `eagerClass` (complete / question / idk) and
`eagerDecideAt`: the session time at which the R1-qualified floor decision lands if the child stays quiet (the last offset
+ `PAUSE_WAIT[class]`). The eager START stays a prefetch signal (cheap, cancellable). **Nothing audible before
`eagerDecideAt` is R1-qualified**: speaking at the eager start would cut the pauses the wait protects. A read-out never
starts the eager turn. Tests: `tests/r4-duplex-eot.test.mjs`.

## 4. Why R2 does not move

R2 (350 ms p50 on the India lane) is still a closed-answer bar measured on open adult speech (round 3 §5). The free
exchange is wait-bound by design (complete 1,100 ms). Nothing this round shortens it, because every faster setting cut
more thinking pauses on TRAIN.

## 5. R7: the safety floor

No safety file touched. The partial-safety predicate still reads every word. The eager start never fires under distress
(unit test). The overlap changes only change WHEN her audio is hushed or paused, never the safeguard's timing (G1 / G2).

## 6. Overlap (AMI), TRAIN vs TEST

`evals/duplex-r3/ami-overlap.mjs` (unchanged runner and scorer), `results/r4-ami-base.json` (BEFORE, on a frozen
`git archive` of the base) and `results/r4-ami-after.json`. Split scorer: `evals/duplex-r4/ami-split.mjs`.

| split | R3 continuers kept | R4 barge-ins stopped <= 200 ms | R5 room false yields | R6 bleed self-yields |
|---|---|---|---|---|
| TRAIN (ES2004b, IS1008b) BEFORE | 78/103 = 75.7 % | 13/22 | 13/101 = 12.9 % | 78/421 = 18.5 % |
| TRAIN AFTER | 84/103 = 81.6 % | 17/22 | 12/101 = 11.9 % | 77/421 = 18.3 % |
| **TEST (ES2005b, IS1004b) BEFORE** | 76/92 = 82.6 % | 11/29 | 19/138 = 13.8 % | 23/309 = 7.4 % |
| **TEST AFTER** | **76/92 = 82.6 %** | **14/29** | **21/138 = 15.2 %** | **19/309 = 6.1 %** |
| ALL BEFORE | 154/195 = 79.0 % | 24/51 = 47.1 % | 32/239 = 13.4 % | 101/730 = 13.8 % |
| ALL AFTER | 160/195 = 82.1 % | 31/51 = 60.8 % | 33/239 = 13.8 % | 96/730 = 13.2 % |

What changed (each found with `evals/duplex-r4/ami-trace.mjs` on TRAIN, kept only if TRAIN improved):
1. **The hush meets a burst whose reflex duck was released at onset** (`OVERLAP.hushAfterRelease`). A burst too short to
   carry its own pitch inherits the last attribution; when that was "not the child" (another voice in the room), her
   reflex duck was released at the onset and the host never tried the hush for that burst again. Once its own pitch said
   "the child", a plain "yeah" met the bare 600 ms sustain and paused her, and real barge-ins sounded under her full voice.
   TRAIN: continuers 78 → 79, barge-ins 13 → 15.
2. **A hush give-up lasts 60 s, not the lesson** (`OVERLAP.hushGiveUpForMs`). The echo-like give-up still fired within
   minutes on real meetings and then held for the whole session. TRAIN: continuers 79 → 82, barge-ins 15 → 17. 15 / 30 /
   60 s were identical on TRAIN; 60 s is the most conservative.
3. **The sustain and the 1 s forced yield count only voice above her echo level** (`OVERLAP.sustainCountsNonEcho`,
   `nonEchoDb` 3). After a 660 ms "yes" her own voice bled into the headset ~25 dB under her level, the device VAD kept
   "voicing", and the forced yield fired at 1 s. TRAIN: continuers 82 → 84.

Tried and rejected (context/inbox/r4-duplex.json): a lexical-turn echo gate (bleed 77 → 56/421 on TRAIN, but it swallowed
a real barge-in's words in the ship5 B3 rig, because her "echo level" is her OUTPUT level, not a measured echo); a longer
hushed sustain (1,300 / 1,600 ms: no change at all, G11 binds).

**R5 got one worse** (TEST 19 → 21/138 room false yields). It is inside the noise, but it is a regression and it is reported.

**The open-loop rig.** Her line is another participant's real speech, played to its end whatever the engine does. On a
device, once the engine has yielded or committed, her audio has stopped. `evals/duplex-r4/ami-artefact.mjs` labels the
failures whose onset fell while the governor's phase was NOT her floor: **16 of the 35 remaining continuer failures and
13 of the 20 late barge-ins** (BEFORE: 18 of 41 and 13 of 27). These still count in the official rows above. On a device
those 16 continuers were not "over her" at all, but the rig cannot say what would have happened instead, so no corrected
rate is claimed.

## 7. The hands-free mid-sentence report (main session, 2026-10-10)

Stream 3's page-clock run reported the engine committing mid-utterance on 4/6 hands-free turns ("Mujhe lagta hai dabbe").
Reproduced on a local production build (`tests/prod/r4-timeline`, owner-cohort TEST child, class 4; a SYNTHETIC child-like
TTS clip with exactly 450 / 700 / 1,000 ms between phrases, `evals/duplex-r4/synth-midpause.mjs`; fake ASR with a fixed
750 ms commit → final; not a child):

| fake transcriber | clip (mid-sentence pauses) | turns | sent truncated | engine decision after speech end p50 | decision → turn POST p50 / p90 |
|---|---|---|---|---|---|
| original `driver.mjs` | 450 ms × 2 | 6 | **6/6** | (words never complete) | – |
| patch 01 | 450 ms × 2 | 6 | **0/6** | 1,404 ms | 375 / 1,200 ms |
| patch 01 | 700 ms × 2 | 6 | **0/6** | 1,436 ms | 347 / 861 ms |
| patch 01 | 1,000 ms × 2 | 6 | **0/6** | 1,722 ms | 283 / 1,099 ms |

- **The cause was the harness.** The engine's micro-commit probe (an `input_audio_buffer.commit` at a 150 ms pause, by
  design, to fetch words sooner) made the fake finalise the item with the words so far and never transcribe the rest. The
  real gpt-live-transcribe opens a new item for the audio after a commit: 205 of 206 commits in the recorded round-2 D4
  events. The same engine sends every turn whole once the fake does that (patch 01, a request to the main session).
- **What stays real:** speech end → turn POST is p50 ~2.1-2.5 s on this harness. The engine decides at p50 1.4-1.7 s
  (half on the class wait, half on the silence backstop; this fake transcript carries no punctuation, which the real lanes
  do, so it reads fewer clauses as finished than production would). The decision → POST step (p50 ~0.3 s, ~1.1 s on 5 of
  18 turns) is after the commit, in `src/lesson` (stream 3), not in the engine.

### 7.1 The same check on the REAL transcriber (the main session's confirmation ask)

`evals/duplex-r4/realstt-midpause.mjs`: the same SYNTHETIC clips streamed in real time to the REAL production transcription
socket (D4, gpt-live-transcribe, the server's `sttSession` shape with the 1,500 ms VAD backstop) from the US sandbox, the
engine in the loop, its probes live. 4 Director contexts × 6 utterances per pause length (n = 72). (The browser link
cannot reach Azure WebRTC from this sandbox; the browser path is covered by the patched-fake rows above.)

| pause | context | BEFORE truncated | AFTER truncated | AFTER speech end → commit p50 |
|---|---|---|---|---|
| 450 ms | open question / open explanation | 0/12 | 0/12 | 2,560 ms (wait time II, by design) |
| 450 ms | closed phrase / closed number | 0/12 | 0/12 | 1,165 / 800 ms (BEFORE 790 / 775) |
| 700 ms | all four | 0/24 | 0/24 | 1,125-2,525 ms |
| 1,000 ms | open question / open explanation | 0/12 | 0/12 | 2,534 ms |
| **1,000 ms** | **closed phrase / closed number** | **2/12** | **0/12** | 1,334 / 794 ms |
| **all** | | **2/72** | **0/72** | |

- **The 2 BEFORE cuts:** once a value is heard ("चार"), the closed-answer silence backstop was max(700 ms, the child's hold
  p50), sized for a bare "62". On the second 1,000 ms pause the real final for "…चार कॉर्नर।" covered the audio in time
  and the backstop fired. **Fix:** a closed answer longer than a short answer (more than 3 words) gets at least the free
  exchange's class wait as its backstop (`governor.ts` backstopMs, `config.ts CLOSED_ELABORATION`). A complete short answer
  still ends at once on the engine's own turn end.
- **Cost:** closed phrase answers longer than 3 words are decided ~+375 ms later (790 → 1,165 ms at the 450 ms clip).
  SIMULATED TaxilaFDB TEST: turns decided more than 2 s after the end +1.3 to +1.5 points (D4 10.4 → 11.9 %, FAST 8.7 →
  10.0 %, MAI_HOME 9.7 → 11.2 %); TRAIN unchanged; attribution by ablation: this row alone (§8). The main session's rule
  for this round: a teacher who waits 300 ms longer beats one who cuts the child off.
- n = 6 per cell; 2/12 → 0/12 is small, but the mechanism is exact (the trace shows the 700 ms backstop firing).

## 8. SIMULATED TaxilaFDB (child-like TTS voices, mixed echo / noise, reactive STT model; not children, not real speech)

`evals/duplex-r3/fdb.mjs` (unchanged), 3 lanes. BEFORE = the frozen base, AFTER = this branch.

| split | lane | cut-offs (thinking) | gap p50 / p90 | missed (> 2 s) | paused within 1 s of a barge-in | stopped <= 200 ms | continuers kept | safety (unsafe / detected) |
|---|---|---|---|---|---|---|---|---|
| TEST | D4 | 2.7 % → 2.7 % | 1,160 / 1,590 → 1,160 / 1,560 | 10.4 → 11.9 % | 22.2 → 8.3 % | 105/108 → 105/108 | 98.6 → 98.6 % | 0/84, 84/84 → same |
| TEST | FAST | 2.7 → 2.7 % | 570 / 1,500 → 560 / 1,490 | 8.7 → 10.0 % | 68.5 → 60.2 % | 104/108 → 104/108 | 97.2 → 97.2 % | 0/84, 84/84 → same |
| TEST | MAI_HOME | 3.4 → 3.4 % | 540 / 1,514 → 470 / 1,500 | 9.7 → 11.2 % | 43.5 → 38.0 % | 105/108 → 105/108 | 98.6 → 98.6 % | 1/84, 83/84 → same (pre-existing) |
| TRAIN | D4 / FAST / MAI | 1.1 / 1.8 / 1.1 % → same | p90 FAST 1,348 → 1,400 | 4.0 / 1.9 / 3.1 % → same | 16.7 / 74.2 / 45.0 → 7.5 / 71.7 / 35.0 % | 115 → 116 / 115 / 115 of 120 | | |
| DEV | all | 1.0 % → same | same | 0 → 0 | (no overlap items) | | | |

Ablations on TRAIN (`results/fdb-r4-abl-*.json`): "paused within 1 s" falls only because of `hushAfterRelease` (off →
exactly the BEFORE row): the hush now meets those bursts, so the pause waits for the hushed sustain (1 s) while she is
already inaudible (-26 dB). The child-facing number (her audio down within 200 ms) is equal or better. Round 3 made the
same trade (the hush stands in for the pause). On TEST, "missed" rises only because of `CLOSED_ELABORATION`
(off → exactly BEFORE). The safety rows do not move; MAI_HOME's 1 undetected of 84 is in the BEFORE run too.

## 9. R5 and R6: what they would take (not faked)

Both rows ask "who is speaking?", and the engine cannot answer that today:
- **R5 (room false yields 13.8 %):** another adult's voice over her is told from the child only by pitch (≥ 5 semitones
  below the child's own median) and by level. On AMI the "other voices" are adults at the same table, often in the
  child's pitch range.
- **R6 (bleed self-yields 13.2 %):** her "echo level" is her OUTPUT level, not a measured echo path. On the AMI headset rig
  her own voice reaches the mic at -10 to -22 dB, harsher than a phone with AEC. That is also why the lexical echo gate
  had to be rejected (§6).

What would do it, and what it costs:
1. **A target-speaker gate (personal VAD, X3 in `docs/research/duplex/ARCHITECTURE.md`).** The child's voice is enrolled
   once (a short "apna naam bolo" sample at onboarding). A small on-device speaker-embedding model (ECAPA-class) scores each
   overlap onset against it, and the score feeds `OverlapFeatures.targetSpeaker`, which the classifier, the hush and G11
   already read. The published reference is FireRedChat's pVAD: false barge-ins down to 10.2 % (MODELS-PAPERS.md).
   It needs:
   - an Azure-hosted or on-device model: no third-party API. The voicesig stream's ONNX runtime path
     (`src/voicesig/ort.ts`) can host it;
   - an enrolment step (a stream 2 / onboarding patch, plus consent copy);
   - a children's evaluation set (sibling / TV / own voice), which does not exist;
   - research-sized work, not a rule change.
2. **The AEC reference for R6.** Read the device echo canceller's residual (or run our own reference-correlated echo
   estimate over her PCM, which the player already has) instead of her output level. Then "is this her echo?" is measured,
   and the lexical-turn gate rejected in §6 becomes safe. This is a client audio change in the link (stream 3's file):
   a seam patch.
3. Until then, both rows are reported as they are. A phone with AEC leaks far less than the AMI headset rig, so R6 on
   AMI over-states the device. Only shadow telemetry from real lessons can say how much.

## 10. Where the engine's time goes (the trail, the engine half)

Real transcriber (§7.1), speech end → the engine's commit, p50:
- **Closed answers:** 0.8-1.3 s.
- **Her open question / an explanation:** ~2.5 s. This is wait time II for teach-backs (`CONTEXT.open_explanation`,
  2.5-3.5 s; TaxilaFDB had 49/440 mid-explanation pauses of 2.2-2.8 s cut at 2-3 s).
- **Free exchange:** 1.0 s (E1, eot-bench, R2 row).

The open-question wait is the largest single engine delay a child feels. Shortening it needs proof on CHILD explanation
pauses, which only the pilot has. On adult speech the free exchange's 1,100 ms class wait already cuts 2-3 % of thinking
pauses, and children pause longer. **It is not changed this round.** The eager start (§3) already lets the turn's model
work begin on the covered words before the commit; `eagerDecideAt` tells stream 3 when the commit will land.

## 11. Gates (this branch, merged with base 6166d0a, 2026-10-10)

| gate | result |
|---|---|
| `npx tsc -b`, `npx vite build` | pass |
| `npm test` (own Neon branch) | 2,548 / 2,613 pass. The 60 failures are all `tests/engines-browser.test.mjs`: this container's Chromium 141 words a CSP refusal differently from the test's dev-noise filter (needs Chromium 1243, which cannot be installed here). Nothing in this diff is loaded by that suite. CI on GitHub (`gates`) runs that suite green. |
| duplex unit and replay suites | 152 / 152 |
| `scripts/check-prompt-budget.mjs` | PASS |
| `scripts/lint-ui.mjs --json` | 353 (baseline 353), 0 duplex findings |
| `tests/prod/round3-duplex.mjs`, local production build, `TAXILA_DUPLEX=shadow` + `TAXILA_DUPLEX_LIVE_FOR` = a fresh TEST account | **15/15** (the harness has 15 checks, not 18). Config, everyone-shadow, the owner cohort "on", the owner browser arm end to end (no talk button, the engine commits spoken turns hands-free), everyone-browser shadow, slow switch stays shadow, shadow telemetry, and the bundle carries engine `2026-10-10.r4` |
| `tests/prod/p1-duplex-acceptance.mjs`, local production build | with production's flags (`shadow`): 10/16; the 6 FAILs are its ship5-era premise that duplex is ON for everyone (a fresh non-cohort account correctly stays on today's path). With `TAXILA_DUPLEX=on` on the local build only: **16/16**. With `P1_SAFETY=1`: the safety-pending seam passes (a clean final carrying `duplex.safetyPending` gets the safeguarding move with Childline 1098 and Tele-MANAS 14416); its 1 FAIL is the expected cleanup refusal (`erase_review` on my own Neon branch) |
| cohort path (local production build, `TAXILA_DUPLEX=shadow` + `TAXILA_DUPLEX_LIVE_FOR`) | owner TEST account → `{ duplex: "on", cohort: "owner" }`, a plain account → `{ duplex: "shadow" }`; hands-free lesson live for the owner child (§7) |

## 12. What still blocks "on" for everyone

Met on the same recorded events: **R1 (both lanes), R1b, R2b, R4, R7: 5 of the 9 criteria** (round 3: 3 of 9).

Not met:
- **R2 (decision gap p50 ≤ 350 ms on the India lane).** A closed-answer bar measured on open adult speech from the US;
  it needs the India lane measured from India and a children's closed-answer set.
- **R3 (continuers kept ≥ 90 %): 82.1 %.** Of the 35 failures left, 16 started while, on a device, her audio had already
  stopped (open-loop rig); the rest are sustained bursts and her own words leaking back.
- **R5 and R6.** They need a target-speaker model and the AEC reference (§9).

And, as in round 3: nothing here is a child, and Gate S (prod shadow telemetry from real lessons) has no data until voice
lessons are run. **Recommendation: stay `TAXILA_DUPLEX=shadow` with the owner cohort.** The owner's hands-free test is
the next real evidence.

## 13. Owner decisions needed

1. **The extra patience is accepted** (main session, 2026-10-10). It costs:
   - read-outs: +1.2 s on turns that end on a number or address;
   - closed answers longer than 3 words: about +375 ms.

   Confirm it stays if the owner's own hands-free test finds it slow.
2. **Whether to fund the target-speaker gate (X3).** It is the only path to R5 and R6. It needs an enrolment step with
   consent, an on-device model, and a children's sibling / TV evaluation set.
