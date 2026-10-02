# STT routing (2026-10-02)

This file is a pointer. The measurement and its rationale are in `../voice/v2/stt-hinglish.md`, and the
earlier E0 run is in `../voice/asr-kids-hinglish.md`. All numbers are from synthetic speech; E1 with real
children decides.

| lane | model | config | measured (synthetic, n=180) | price |
|---|---|---|---|---|
| L live (default) | `taxila-live-transcribe` (gpt-live-transcribe 2026-07-28) | `keywords` = lesson terms + answer numbers; prompt = speaker+script, no vocabulary | cerNorm 0.026, numbers 92/96, 0 hallucination | $1.02/h streamed |
| L fallback | Azure Speech real-time | continuous LID hi-IN+en-IN | cerNorm 0.071, answers 74/78, 0 hallucination | $1.00/h |
| G second opinion | Azure Fast Transcription | locales hi-IN+en-IN | cerNorm 0.072, answers 73/78, 262 ms | ~$0.36/h |
| excluded | gpt-4o-transcribe, gpt-4o-mini-transcribe | — | fabricate text on white noise and on silence | — |
| to test | gpt-transcribe, gpt-realtime-whisper-2 (ask the owner to deploy them); MAI-Transcribe-2 (needs a Central India resource) | — | not measured | gpt-transcribe $0.27/h |
