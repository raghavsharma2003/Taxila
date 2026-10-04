# Human-voice blind A/B, owner + 1 rater (2026-10-04)

Method: blind-test page (40 A/B pairs, 6 voices x 5 Hinglish teacher lines, per-listener shuffled order and sides; vote unlocked only after >80% of
both clips played). Raters: owner (Raghav) and Gaurav, 40/40 each; equal weight. Two further raters did not finish and are excluded by owner decision.
Unblinded with blind-key.json. Rater names and raw ratings are kept out of git (scratchpad backup).

## Votes (winner counts, both raters pooled, n = 10 votes per row)
| voice (blind label) | comparison | result |
|---|---|---|
| gpt-4o-mini-tts marin (V1) | plain vs expressive | plain 8, expressive 1, tie 1 |
| DragonHD Diya (V2) | plain vs expressive (with spliced breath/hum/laugh clips) | plain 7, expressive 2, tie 1 |
| DragonHD Diya (V2) | expressive without clips vs with clips | no-clip 5, clip 2, tie 3 |
| DragonHD Arjun (V3) | plain vs expressive (clips) | plain 7, expressive 3 |
| DragonHD Arjun (V3) | no-clip vs clip | no-clip 4, clip 3, tie 3 |
| DragonHD Omni Diya (V4) | plain vs expressive | expressive 7, tie 3 |
| MAI-Voice Priya (V5) | plain vs expressive | plain 5, expressive 2, tie 3 |
| gpt-realtime-2.1 marin (V6) | plain vs expressive | expressive 8, plain 1, tie 1 |

## What the written remarks say (the important part)
- `voice-blind-spliced-breaths-rejected`: the spliced breath/exhale/hum clips read as "random exhale", "moaning out of nowhere", "not matching the voice",
  flagged on most clip renders by both raters. Clips lose to the same voice without them. The one exception: an in-context laugh on the joke line (L2)
  was liked by both raters on Diya and Arjun, but the hand-off into the next sentence was awkward ("felt like two different sentences").
- `voice-blind-none-human-2026-10-04`: no voice passed as a human teacher for either rater. Recurring defects:
  reading not talking ("just read the statement"); English-accented Hindi and an accent switch between English and Hindi words ("English woman
  speaking Hindi", "dual accent"); voice/timbre changes mid-line; wrong numbers and words (27, 35, "total", "10", "rukte"); pauses placed on random
  words to fake emphasis; MAI reads punctuation aloud ("dot dot"); some lines too slow, others rushed.
- Prose direction helps the speech-to-speech/Omni voices (gpt-realtime expressive 8-1, Omni expressive 7-0) but they keep the accent problem.

## Consequences
1. Spliced non-verbal clips are OFF for all voices (HUMAN-VOICE O-1 answered: no). A laugh only where the engine produces it natively, in context.
2. Numbers and terms must be normalised to spoken Hindi words before TTS, plus a pronunciation lexicon; never send digits or "..." to TTS.
3. The voice bar is not met by any Azure voice tested. Next round explores other very human Hindi/Hinglish/English voices (see VOICE-V3).
