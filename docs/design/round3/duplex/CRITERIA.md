# duplex (round 3) · the switch criteria, before and after, and exactly which pass

**Short answer:** duplex stays `TAXILA_DUPLEX=shadow` for everyone; the owner gets it live through the cohort switch.
Bars are round 2's (`docs/design/round2/duplex-real/CRITERIA.md`, unchanged). Scorer: `evals/duplex-r3/criteria.mjs`
(wraps `evals/duplex-real/criteria.mjs`). **Every row is REAL RECORDED ADULT SPEECH through the REAL Azure STT lane, replayed
deterministically from the socket events recorded live in round 2, from the US sandbox; nothing here is a child.** BEFORE =
the round-2 engine at HEAD (cadf527) replayed this round on the same events; AFTER = this tree. Same audio, same STT
output, same scorer.

## 1. The nine criteria

E1 = LiveKit eot-bench Hindi (CC BY 4.0, evaluation only): 400 real turns, 147 thinking pauses >= 500 ms, 674 >= 100 ms.
E2 = AMI (CC BY 4.0, evaluation only): 4 meetings, 16 headset channels, 48 her/child pairs, English incl. Indian-L1 adults.

| id | criterion (bar) | BEFORE | AFTER | met? |
|---|---|---|---|---|
| R1 | thinking-pause cut-offs <= 3 % AND <= silence-900 on the same pauses (India lane, MAI) | 19/147 = 12.9 % [8.4-19.3] | **6/147 = 4.1 %** [1.9-8.6] (silence-900 on the annotation 7/147 = 4.8 %; on the device's own silence clock 19/147) | **no** (<= silence-900 yes; <= 3 % no) |
| R1-D4 | the same on the production lane (D4, eastus2) <= 3 % | 12/147 = 8.2 % [4.7-13.7] | **7/147 = 4.8 %** [2.3-9.5] on the 2026-10-07 events; **4/147 = 2.7 %** [1.1-6.8] on a fresh LIVE run 2026-10-09 (old engine on those same events: 6/147 = 4.1 %) | **no** as a gate (met on one live run, not on the replay; the CIs overlap 3 %) |
| R1b | commits while the speaker is still voicing <= 1 % of turns (MAI) | 7/400 = 1.8 % | **4/400 = 1.0 %** | **yes** (at the bar) |
| R2 | decision gap p50 <= 350 ms on the India lane | 910 ms | 1,011 ms (free exchange 1,021; question to her 811; closed answers 451, n = 9) | **no** |
| R2b | turns never decided within 5 s <= 2 % | 1/400 | 1/400 | **yes** |
| R3 | keeps talking through continuers >= 90 % (E2) | 139/195 = 71.3 % [64.6-77.2] | **154/195 = 79.0 %** [72.7-84.1] | **no** |
| R4 | her audio stops (hush or yield) within 200 ms in >= 50 % of real barge-ins (E2) | 17/51 = 33.3 % (p50 among stopped 310 ms) | **24/51 = 47.1 %** [34.1-60.5] (p50 among stopped 160 ms, p90 740; stopped at all 35 → 36) | **no** (two barge-ins short) |
| R5 | false yields to other voices in the room <= 10 % (E2; adults, not a TV or a sibling) | 37/239 = 15.5 % [11.4-20.6] | **32/239 = 13.4 %** [9.6-18.3] (room bursts hushed 14 → 39 of 239) | **no** |
| R6 | self-yields on her own bleed <= 2 % (E2; headset bleed, harsher than a phone's AEC) | 116/730 = 15.9 % [13.4-18.7] | **101/730 = 13.8 %** [11.5-16.5] | **no** |
| R7 | child-safety floor never weaker (unit + replay suites) | green | green (§4) | **yes** |

## 2. E1 in detail (end of turn), TRAIN (chosen on) vs TEST (held out)

| lane | split | BEFORE cut-offs >= 500 ms | AFTER cut-offs | BEFORE gap p50 / p90 | AFTER gap p50 / p90 |
|---|---|---|---|---|---|
| MAI | TRAIN (even ids) | 12/77 = 15.6 % | 2/77 = 2.6 % | 912 / 1,080 | 1,012 / 1,220 |
| MAI | **TEST (odd ids)** | 7/70 = 10.0 % | **4/70 = 5.7 %** | 906 / 2,379 | 1,009 / 1,531 |
| D4 | TRAIN | 7/77 = 9.1 % | 3/77 = 3.9 % | 917 / 1,215 | 1,014 / 1,376 |
| D4 | **TEST** | 5/70 = 7.1 % | **4/70 = 5.7 %** | 931 / 2,377 | 1,024 / 1,537 |

By the engine's exchange context at the turn end (ALL, MAI / D4):

| context (n turns) | BEFORE cut-offs | AFTER cut-offs | BEFORE gap p50 / p90 | AFTER gap p50 / p90 |
|---|---|---|---|---|
| free (316) | 13/121 / 9/123 | 5/121 / 6/123 | 920 / 1,055 · 930 / 1,336 | 1,021 / 1,206 · 1,024 / 1,378 |
| question to her (52-53) | 6/20 / 3/18 | 1/20 / 1/18 | 434 / 549 · 752 / 962 | 811 / 880 · 828 / 995 |
| open question (20-22; wait time II, by design) | 0/5 | 0/5 | 2,446 | 2,446 |
| closed answer (9-10) | 0 | 0 | 451 / 541 · 732 / 1,389 | unchanged |

- No turn became worse: every changed turn went from 1 cut-off to 0 (MAI 13 turns, D4 5); none went 0 → 1.
- The eager end of turn (§4 of RESEARCH.md): fired on the EXACT committed words at 354/399 (D4) and 336/399 (MAI) turn ends,
  p50 280 ms (D4) / 560 ms (MAI) before the commit; 0.07 / 0.36 cancelled starts per turn (`results/r3-eager-*.json`).
  ESTIMATE of what it buys: the turn's model work (~2.5 s p50, round-2 latency) starts that much earlier, so speech end →
  her first sound falls by about the lead, once a consumer adopts it (APPLY.md §4).
- India lane from India is ESTIMATE only: MAI commit→final is 68 ms from Chennai vs 320 ms from the US, so the covered-words
  moment (and every gap that waits on it) is ~250 ms earlier there: closed answers ≈ 200 ms p50, the free exchange is wait-bound (1.1 s).

## 3. E2 in detail (overlap), `evals/duplex-real/results/r3-ami-after2.json` (the shipped tree; `r3-ami-after.json` = the same without `acousticYieldNeedsNonEcho`)

- **Continuers** 139 → 154/195. Revokes on a continuer 26 → 18 (the armed revoke); acoustic barge-in yields on a continuer
  26 → 21 (`acousticYieldNeedsNonEcho`: a burst within 3 dB of her bleed is left to its words); the 21 left are sustained
  bursts the hush never met on the AMI bleed rig, where her voice reaches his headset at −10 to −22 dB. Continuers hushed
  (her dip, then back) 79/195 = 41 %.
- **Barge-ins** 17 → 24/51 stopped within 200 ms (p50 among stopped 160 ms, p90 740); the rest never hushed for the same
  echo-like reason or because the open-loop rig had already yielded on that line (phase child_turn while her line continues:
  an artefact of open-loop replay; on a device she stops). Against the first after-run (25/51) `acousticYieldNeedsNonEcho`
  lost 3 barge-ins (two echo-like bursts that had been yielded on acoustics at 110 / 540 ms, one hushed at 110 ms whose line
  the rig had yielded earlier) and gained 2 (hushed at 140 / 150 ms): −1 net, inside the noise. Pauses within 1 s 26 → 17:
  the hush stands in for them.
- **Room voices** 37 → 32/239 false yields, but hushed 14 → 39: she dips under another adult's voice more often (an audible
  cost, not a criterion). No speaker model: TV / sibling rejection beyond pitch attribution is not solved (§5).
- **Her own bleed** 116 → 101/730: reasons sustained voice 38, G11 forced yield 30, lexical "open tail" 9 (her words through
  the bleed), prosody 6: a speakerphone with AEC leaks far less; this rig over-states echo (round 2 says the same).
- **SIMULATED TaxilaFDB TEST** (child-like TTS, 960 streams x 3 lanes): continuers 0.944 → 0.986 (D4), stop <= 200 ms
  unchanged 105/108, safety unchanged; pauses within 1 s fall with the 1,000 ms hushed sustain (§6).

## 4. R7: the safety floor

`tests/ship5-review-duplex-safety.test.mjs` 3/3, `tests/duplex-runtime.test.mjs` (G1 / G2 safety) green with patch 01,
`tests/round3-duplex-eot.test.mjs` (the eager start never fires under distress), `tests/duplex-real-*` green. The class waits,
the hush, the armed revoke and the overlap probe never touch G1 (safety_attend, sticky), G2 (no audio act before the
predicate saw text covering the audio) or the safeguard's own timing; an empty final now counts as coverage, which only
means "no words in that audio" (the predicate has nothing to read there either).

## 5. Why the bars that fail still fail, exactly

1. **R1 / R1-D4 (cut-offs <= 3 %) and R2 (350 ms) cannot both hold on open adult speech, and nobody's system does it.**
   LiveKit's audio-native end-of-turn v1, the best published, sits at 5 % false cut-offs at ~543 ms on the same benchmark
   family (all languages). On our pauses the words that look finished are ambiguous: 66 thinking pauses against 292 turn ends
   (MAI, complete-looking), separated by pitch at AUC 0.70, by the production fast model at AUC 0.57 and by the strong
   model at 0.80 in 1.2 s (`results/r3-sem-ceiling.json`). The 1,100 ms "complete" wait is the fastest setting that kept
   TRAIN at <= 3 %; TEST came out at 5.7 % on both lanes.
2. **The device's silence clock reads pauses ~200 ms longer than the annotation** (offset ~100 ms early, onset ~100 ms late).
   A device-side silence-900 cuts 12.9 % of these pauses, not 4.8 %. A better on-device VAD would move both the cut-offs and
   the gaps; it was not built this round.
3. **R2 is a closed-answer bar.** Closed answers decide as soon as their words cover the audio (MAI 451 ms from the US,
   n = 9 real turns; ≈ 200 ms from India [ESTIMATE]); eot-bench has almost none, and no real child closed-answer set exists.
4. **Nothing here is a child.** Children pause more (age 9: 85 % of >= 250 ms silences are holds). The pilot refits PAUSE_WAIT.
5. **Gate S (prod shadow) has no data, and cannot get any without voice lessons:** 512 lesson starts in 3 days, 5 duplex
   config reads, 0 real shadow summaries (Log Analytics, 2026-10-07..09). The owner cohort is the first source.

## 6. Ablations (AMI real speech, the same recorded events; which round-3 overlap rows earned their place)

| arm | meetings (pairs) | continuers kept | barge-ins stopped <= 200 ms | room false yields | bleed self-yields |
|---|---|---|---|---|---|
| BEFORE (round-2 engine) | 4 (48) | 139/195 | 17/51 | 37/239 | 116/730 |
| first after-run (all rows except `acousticYieldNeedsNonEcho`) | 4 (48) | 146/195 | 25/51 | 32/239 | 97/730 |
| same, armed revoke OFF | 4 (48) | 143/195 | 25/51 | 35/239 | 103/730 |
| first after-run | 2 (24): IS1008b, ES2004b | 72/103 | 11/22 | 12/101 | 79/421 |
| + `acousticYieldNeedsNonEcho` (adopted) | 2 (24) | 78/103 | 13/22 | 13/101 | 78/421 |
| **AFTER (shipped: every row on)** | 4 (48) | **154/195** | **24/51** | **32/239** | **101/730** |
| first after-run with `hushedSustainMs` 600 instead of 1,000 (rejected) | 2 (24) | 73/103 | 10/22 | 14/101 | 94/421 |

On all four meetings `acousticYieldNeedsNonEcho` bought +8 continuers for −1 barge-in and +4 bleed yields (2 meetings said −1
bleed): kept for the continuers, which is the larger and the child-facing failure (her stopping because he said "haan").
The armed revoke this time costs no barge-in stop (round 2's arming did: −2/51) and wins +3 continuers, −3 room and −6 bleed
yields; small, inside the noise, kept because it costs nothing. Simulated TaxilaFDB TEST: `acousticYieldNeedsNonEcho` changes
nothing; `hushedSustainMs` 600 raises "paused within 1 s" (D4 0.22 → 0.50) but real speech says otherwise, and the child-facing
stop (the hush, 105/108 within 200 ms) is the same either way.
