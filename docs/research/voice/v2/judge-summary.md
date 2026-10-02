# Voice v2: AI-judge summary (proxy, experiments only)

2026-10-02. Data: `judge-results.json` (raw, per clip and judge), `judge-summary.json` (computed by `analyze-judge.py`).
Harness: `judge-voices.mjs`. **This is an AI judge acting as a stand-in for listeners. Before choosing a production voice, run a blind
test with human Indian listeners (`samples/` and `make-blind-page.py`). Earlier work in this project already saw a voice that won on a metric lose when people listened (companion-tech.md §2).**

## Method
- 278 clips: 183 Azure sweep clips (KEY.json), 90 OpenRouter reference clips (`ref-*`, KEY-ref.json, all flagged
  **reference-not-for-production**), and 5 human anchors (IndicTTS-Hindi: native speakers reading studio prose).
- Every clip was re-encoded the same way before judging: two-pass linear loudnorm to -24 LUFS, mp3 at 64 kbps, mono, 24 kHz. That way loudness or codec cannot reveal which vendor made a clip. Judges hear only the audio and the intended
  script. They never see a file name, vendor or voice.
- Judges (OpenRouter, models that accept audio): `google/gemini-3.1-pro-preview`, `qwen/qwen3.8-omni-flash`, `openai/gpt-audio`.
  Temperature 0, JSON rubric. Scores: native_indian, naturalness, hindi_pronunciation and warmth_child (each 1-5),
  plus english_accent_leakage (yes/no), human_or_synthetic, mispronounced words and script_deviation.
- About 15% of clips (and all human anchors) were judged a second time by Gemini-Pro to check test-retest consistency.
- Negative control: the Gemini-3.8 Kore voice deliberately directed to speak with an **American accent** on the same 5 passages.

## Coverage: PARTIAL (the budget ran out)
| | clips |
|---|---|
| rated by all 3 judges | 148 |
| rated by 2 judges | 30 |
| **not rated** | **100** (all Azure) |

The OpenRouter key has a $10 spending cap and only $0.27 is left. Audio requests need at least $0.50 of balance, so every retry got
HTTP 402. Judge spend was **$4.19**; reference generation used the rest.
**Every MAI-Voice-2.1 arm (HD and Flash × 6 voices), Diya DragonHD (`dhd-plain:Diya`) and every reference arm is fully rated (5/5 passages).**
Missing are most en-IN DragonHD voices (Aarti, Neerja, Meera, Lavanya, Arjun), the gpt-realtime `omni:*` arms,
gpt-4o-mini-tts and Swara. To finish: raise the cap and re-run `judge-voices.mjs` (it resumes only the missing slots).

## Calibration: only one judge can tell voices apart
| judge | negative control (American): native_indian / leak rate | share of TTS clips rated naturalness 5 | human anchor judged "human" |
|---|---|---|---|
| gemini-3.1-pro | **2.4 / 80%** | 42% | 0% |
| qwen3.8-omni-flash | 4.4 / 20% | 49% | 100% (but 94% of TTS also judged "human") |
| gpt-audio | 5.0 / 0% | 89% | 100% (95% of TTS too) |

- **gpt-audio cannot be used as a judge.** It gave the American-accented control 5.0 for "native Indian". The headline below leaves it out.
- **qwen-omni has a ceiling problem.** It judges almost everything "human" and mostly misses the accent leak.
- **Gemini-Pro is the only judge that catches the American control.** Its test-retest Spearman is 0.94 (n=26), with 54% of retest scores identical.
- Agreement between Gemini-Pro and qwen: Spearman 0.57 per clip and 0.73 per arm.
- Human anchors scored *low* (Gemini 3.25; naturalness 2.4). These are studio read-prose corpus recordings with old-corpus audio quality, and the judges penalised that "read-aloud" register. **So the absolute scale does not measure "sounds human". Only the ranking means anything.**
- **Possible self-preference:** Gemini-Pro gives Gemini TTS an average of 4.94 and everything else 3.57. qwen's gap is smaller (4.79 vs 4.25).
  The clean gap between with and without the director note (below) suggests the effect is not only family bias, but it cannot be ruled out.

## Ranking by Gemini-Pro judge (arms with ≥4 rated clips; composite of the 4 axes)
| arm | n | comp | native | natural | hindi | warmth | leak | "human" |
|---|---|---|---|---|---|---|---|---|
| REF gemini-3.8-flash-tts (Kore/Leda/Sulafat/Despina/Achernar/Aoede), director note | 5 each | **5.00** | 5.0 | 5.0 | 5.0 | 5.0 | 0 | 0.6-1.0 |
| REF gemini-3.8-flash-lite-tts Sulafat | 5 | 5.00 | 5.0 | 5.0 | 5.0 | 5.0 | 0 | 1.0 |
| REF gemini-3.1-flash-tts-preview Kore/Sulafat | 5 | 4.95 | 5.0 | 4.8 | 5.0 | 5.0 | 0 | 0.4-0.6 |
| **AZ MAI-Voice-2.1 HD Priya** | 5 | **4.85** | 5.0 | 4.6 | 5.0 | 4.8 | 0 | 0.6 |
| **AZ DragonHD Diya (en-IN, no lang tag)** | 5 | 4.70 | 5.0 | 4.2 | 5.0 | 4.6 | 0 | 0.0 |
| AZ MAI-Voice-2.1 Flash Dhruv | 5 | 4.65 | 5.0 | 4.4 | 5.0 | 4.2 | 0 | 0.4 |
| REF gemini-3.8-flash-tts Sulafat **without director note** | 5 | 4.45 | 4.2 | 4.6 | 4.2 | 4.8 | 0.2 | 0.4 |
| AZ MAI HD Harper / HD Kavya / Flash Kavya / Flash Grant | 5 | 4.05-4.10 | 4.4-4.8 | 3.2-3.8 | 4.2-4.8 | 3.4-4.0 | 0-0.2 | 0-0.4 |
| AZ MAI Flash Priya, HD Grant, HD Dhruv, Flash Harper, Flash/HD Arjun | 4-5 | 3.50-3.85 | 4.2-4.6 | 2.5-3.0 | 4.0-4.6 | 3.0-3.6 | 0-0.2 | 0-0.25 |
| REF grok-voice-tts ara / eve | 5 | 3.50-3.55 | 3.8-4.0 | 3.0-3.2 | 4.0 | 3.0-3.2 | 0.2 | 0 |
| HUMAN anchor (studio read prose) | 5 | 3.25 | 4.2 | 2.4 | 4.2 | 2.2 | 0 | 0 |
| REF NEGATIVE CONTROL (American accent) | 5 | 2.95 | 2.4 | 3.2 | 2.4 | 3.8 | **0.8** | 0 |
| REF minimax-2.8-hd / fish-s2.1-pro / kokoro-82m / seed-audio-1.0 | 5 each | 1.65-2.55 | 2.0-3.0 | 1.0-2.0 | 2.4-3.0 | 1.2-2.2 | 0.2-0.4 | 0 |

## What this says (proxy-level)
1. **The best Azure voice is close to the Gemini reference.** MAI-Voice-2.1 HD **Priya** (4.85) and Diya DragonHD (4.70) sit just
   below directed Gemini-3.8-flash-tts (5.00). For both Azure voices the gap is all in *naturalness* (4.6 / 4.2 vs 5.0). Native-Indian
   and Hindi pronunciation are already 5.0, with no English-accent leak in 10/10 clips.
2. **Most of Gemini's edge comes from the director note.** With no note, the same Gemini voice drops to 4.45, below Priya and
   Diya, and leaks English accent in 1/5 clips. The style direction is doing a lot of the work. The Azure-side equivalent is MAI
   styles, SSML prosody, and the gpt-4o-mini-tts `instructions` field. Those arms are mostly unrated (budget).
3. **Choice of MAI voice matters more than HD vs Flash.** Priya and Dhruv lead. Arjun, Harper and Grant trail by about 1 point, mostly on
   naturalness and warmth. Flash Dhruv (4.65) beats most HD voices, so the faster tier is not automatically worse.
4. Grok, MiniMax, Fish, Kokoro and Seed are clearly worse at Hinglish/Hindi than either Azure leader. They are not worth chasing even as references.
