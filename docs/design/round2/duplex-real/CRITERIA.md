# duplex-real · the exact criteria for switching duplex from shadow to live, and whether they are met (2026-10-07)

Short answer: **not met, and not close on real speech.** Duplex stays `TAXILA_DUPLEX=shadow`. Every number below is
measured; adult numbers are labelled ADULT; nothing here is a child result. The scorer is `evals/duplex-real/criteria.mjs`.

## 1. What prod shadow actually records today: nothing

- `CascadeLink` constructs `CascadeDuplex` without a `log` sink, there was no route and no table for engine rows, so the
  engine's shadow decisions on prod were computed and dropped on the device. Zero prod lessons carry "what the engine would
  have done vs what happened". Proof: `tests/prod/round2-duplex-real.mjs` on taxila.dev today: `POST /api/duplex/shadow`
  → 404 and the served bundle has no telemetry (1/7); on a local server with this stream applied: 10/10.
- Built now: `src/duplex/shadowTelemetry.ts` (one content-blind summary per lesson: per child turn the engine gap, the
  shipped gap, whether the engine WOULD have cut the child off, whether the shipped path did; per overlap the engine yield
  vs the shipped stop; safety rows; fallbacks), flushed by `CascadeDuplex.close()` as a beacon to `POST /api/duplex/shadow`
  (`server/duplex/shadowLog.js`: sanitized to numbers and closed codes, lesson id salted-hashed like the access log, one
  stdout line → Log Analytics; no migration). Report: `evals/duplex-real/shadow-report.mjs`.
- **Shadow fidelity limits (state them with every shadow number):**
  1. shadow never sends the engine's micro-commit probes (they would split the shipped path's finals), so in shadow the
     engine reads text that arrives on the shipped 900 ms server VAD: shadow `eg` (engine gap) is PESSIMISTIC vs live;
  2. after a SPEAK the shadow governor believes it spoke; the record therefore scores only the first decision per turn and
     the cut-off ("the child went on after the engine's SPEAK, before the shipped final");
  3. the shipped path's own cut-offs are measured with the same device voicing ruler (so the two are comparable), but that
     ruler is an RMS gate, not a human annotation.

## 2. Gate R: real recorded speech through the real STT (this stream's harness; required before anyone hears it live)

Harness: `evals/duplex-real/eot.mjs` (E1, eot-bench Hindi, CC BY 4.0, 400 real adult turns, 147 thinking pauses >= 500 ms,
674 >= 100 ms, streamed in real time to the production socket with the live bridge and its probes in the loop) and
`evals/duplex-real/ami-real.mjs` (E2, AMI CC BY 4.0, 4 meetings / 16 headset channels / 48 speaker pairs, English incl.
Indian-L1 adults, the real gpt-live-transcribe events recorded live and replayed open loop with "her" = another participant).

| id | criterion (bar) | measure | before (HEAD) | after (this tree) | met? |
|---|---|---|---|---|---|
| R1 | thinking-pause cut-offs <= 3 % AND <= silence-900 on the same pauses (PLAN, V5.1) | E1 India lane (MAI), holds >= 500 ms | 37/147 = 25.2 % [18.8-32.8] | 19/147 = 12.9 % [8.4-19.3]; silence-900 7/147 = 4.8 %, silence-640 41/147 = 27.9 % | **no** |
| R1-D4 | same on the eastus2 lane in production today | E1 D4 | 33/147 = 22.4 % [16.5-29.8] | 12/147 = 8.2 % [4.7-13.7] | **no** |
| R1b | commits while the speaker is still voicing <= 1 % of turns | E1 | MAI 28/400, D4 12/400 | MAI 7/400 (1.8 %), D4 4/400 (1.0 %) | MAI no, D4 borderline |
| R2 | decision gap p50 <= 350 ms on the India lane (V5.1), measured FROM INDIA | E1 MAI, from the US sandbox (an upper bound: US→South India commit→final 320 ms vs 68 ms from Chennai) | 2,474 ms (233/400 waited for the backstop: the coverage bug, §4) | 910 ms (the open-turn wait is 1,100 ms: §3) | **no** |
| R2b | turns never decided within 5 s <= 2 % | E1 | 1/400 | 1/400 | yes |
| R3 | keeps talking through continuers >= 90 % (V5.1) | E2 | 138/195 = 70.8 % [64.0-76.7] | 139/195 = 71.3 % [64.6-77.2] | **no** |
| R4 | barge-in: her audio stops (hush or yield) within 200 ms in >= 50 % of real barge-ins, i.e. p50 over ALL barge-ins <= 200 ms (V5.1) | E2 | 18/51 = 35 % (p50 among the 36 stopped: 180 ms) | 17/51 = 33 % (p50 among the 35 stopped: 310 ms; one item changed) | **no** |
| R5 | false yields to other voices <= 10 % (V5.1 "TV / sibling") | E2: other adults in the room (third / fourth speaker bleed). NOT a sibling or a TV next to the phone | 38/239 = 15.9 % | 37/239 = 15.5 % | **no** |
| R6 | self-yield on her own echo <= 2 % (PLAN W2.5-8) | E2: her line is another participant's headset bleed (-10..-22 dB), harsher than a phone's AEC | 116/730 = 15.9 % | 116/730 = 15.9 % | **no** (and the rig over-states echo) |
| R7 | child-safety floor never weaker | unit + replay suites: `ship5-review-duplex-safety`, `duplex-runtime` G1/G2, TaxilaFDB test safety detected / non-safety speech after distress | D4 84/84 0, FAST 84/84 0, MAI_HOME 82/84 2 | D4 84/84 0, FAST 84/84 0, MAI_HOME 83/84 1 | yes (no regression) |

Supplementary (E2 turns pass, live, other speakers masked, English, free context, this tree): held-out pauses >= 500 ms
cut 19/111 = 17.1 % [11.2-25.2] (silence-640 99/111, silence-900 79/111 on the same pauses; p1-duplex with SIMULATED STT
17/111); 1,071 turn ends, 729 decided within 8 s, gap p50 1,770 / p90 6,590 ms, 7 within 350 ms (human next speaker p50
140 ms). No HEAD live run of this pass exists (the first attempt was CPU-bound and discarded: rj-dxr-ami-turns-floor-sort).

All of R must hold on the shipped config, on the India lane, with n at least as above, before stage L1.

## 3. Gate S: prod shadow on real lessons (after this stream deploys; still shadow)

| id | criterion | source | today |
|---|---|---|---|
| S0 | >= 300 child turns over >= 30 lessons in shadow | `shadow-report.mjs` | 0 (nothing recorded) |
| S1 | engine would-cut-off rate <= 3 % (Wilson upper <= 5 %) AND <= the shipped path's own rate | `engine_cutoff` vs `shipped_cutoff` | no data |
| S2 | turns the engine never decided before the shipped final <= 8 % | `engine_undecided` | no data |
| S3 | 0 unexplained safety disagreements (engine safety rows vs the server's safeguards, joined by lesson hash, reviewed) | `engine_safety_rows` + server incidents | no data |

## 4. Stage L1 (live for internal adult testers on the India lane) → L2 (children)

- L1 needs R and S. It is the ET-1 adult-actor study the PLAN already names (10 actors, real homes); its numbers replace E1/E2.
- L2 (children, consented pilot, PLAN ET-2) needs L1 plus: annotated child cut-offs <= 3 % (<= 5 % for the shy three),
  missed <= 8 %, 0 safety incidents mishandled. VALUES-100: anything below precision 0.80 on children stays shadow.

## 5. Why the bars are not met, exactly (the numbers say where)

1. **Open speech at the pause is genuinely ambiguous.** On E1 the remaining cut-offs are clause-final pauses inside longer
   turns ("…बैठा था। [1.5 s] और कहीं न कहीं…", digit dictation "सात शून्य तीन [0.9 s] छह") with final prosody and a complete
   clause. The sweep (TRAIN half) shows the trade-off every product reports (eot-bench: 9.9 % false cuts at 300 ms, 4.5 % at
   600 ms for LiveKit's trained model): cut-offs only fall as the wait approaches tuned silence, and the gap rises with it.
   No threshold on stage A's rules reaches <= 3 % AND a sub-second gap on open adult turns.
2. **The semantic estimate does not rescue it as wired.** Real Azure calls (grok-4-1-fast-non-reasoning, p50 570 ms) in the
   open_explanation context changed nothing (MAI 50/147 cut either way): the estimate is asked while words are still growing
   and is stale (text hash moved) by the pause.
3. **Overlap on real STT.** Continuer failures are half acoustic (AMI "yeah" bursts of 330-1,000 ms crossing the 600 ms
   sustain) and half G7 revokes (a "yeah" just after her reply starts revokes it). Arming the revoke until the overlap reads
   as a barge-in was tried and reverted (+4/195 continuers, -2/51 barge-ins stopped).
4. **The 350 ms gap is a closed-answer number.** eot-bench has no closed answers; the only closed-answer gap evidence is
   simulated (TaxilaFDB MAI_HOME 370 ms after this stream, 320 at HEAD). A real-speech closed-answer set (ET-1 scripts)
   does not exist yet.
5. **Nothing here is a child.** Children pause more and longer (age 9: 85 % of >= 250 ms silences are holds).
