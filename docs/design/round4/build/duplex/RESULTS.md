# duplex (round 4, stream 4B) · RESULTS

**Status (2026-10-10, in progress):** R1 met on both lanes on the same recorded events; overlap work under way on AMI
TRAIN. Nothing deployed. Production stays `TAXILA_DUPLEX=shadow` + the owner cohort.

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
| R3 | keeps talking through continuers >= 90 % (AMI) | 154/195 = 79.0 % | _pending TEST re-score_ | |
| R4 | stops within 200 ms on >= 50 % of real barge-ins | 24/51 = 47.1 % | _pending_ | |
| R5 | false yields to other voices <= 10 % | 32/239 = 13.4 % | _pending_ | |
| R6 | self-yields on her own bleed <= 2 % | 101/730 = 13.8 % | _pending_ | |
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

_(Overlap sections, gates and owner decisions follow as they are measured.)_
