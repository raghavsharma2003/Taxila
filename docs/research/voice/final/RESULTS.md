# Final voice pick — results (2026-10-04)

The page has 3 long Hinglish passages with emotion changes (60-120 s each) × 3 voices, scored 1-5 on "real teacher talking to me", with a
required final pick. Two raters completed all 9 clips; the owner listened partially and has not scored yet. Names and raw ratings stay out of git.

| voice | rater A | rater B | equal-weight | final pick |
|---|---|---|---|---|
| **DragonHD Diya** (`en-IN-Diya:DragonHDLatestNeural`, plain SSML) | 3.33 | 3.67 | **3.50** | **2 of 2** |
| MAI-Voice-2.1 Priya (express-as excited/softvoice) | 1.67 | 2.00 | 1.83 | 0 |
| gpt-4o-mini-tts marin (acting instructions) | 1.00 | 2.00 | 1.50 | 0 |

Rater notes, paraphrased:
- **Diya:** the most natural, least robotic or dramatic, most consistent tone, and the emotion fits. It is slightly too fast and rushed, and needs tiny natural pauses at commas, full stops and between phrases, plus a little more emphasis. The amusement on the joke is weak.
- **Priya:** "too dramatic", "overdoes the emotion", "choppy and way too slow", "sounds a little old".
- **marin:** "robotic", "reading", English-accented Hindi, accent switches, pronunciation errors.

## Decision `voice-final-diya-2026-10-04`
Diya stays the production voice. The owner asked to stop TTS hunting; no config flip is needed. What to tune next, inside RS-7:
1. **Pace:** a small slowdown. Production runs -35% on Roman script, which was measured before the Devanagari step; re-tune it after the Devanagari step lands, by ear on these passages.
2. **Phrase pauses:** use natural, punctuation-led phrasing (Devanagari "।", commas placed where a speaker breathes) rather than SSML `<break>`, which on DragonHD is always ≥ 300 ms and read as choppy in round 3 (`rj-ssml-delivery-plan-2026-10-04`).
3. **Emphasis and amusement:** come from the words (TALKING-RULES), not from markup.
4. **The Devanagari step** (RS-7 `server/voice/translit/**`) is the prerequisite for any live gain.

**Reverse if:** the owner's own scores, when they arrive, put another voice ahead.
