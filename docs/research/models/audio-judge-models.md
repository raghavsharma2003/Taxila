# Audio-input judge models (for voice evals): measured 2026-10-02

These are for experiments only, used through OpenRouter. A judge never ships in product. Source: `docs/research/voice/v2/judge-summary.md`.

| model | catches American-accent control? | ceiling (share of TTS rated naturalness 5) | test-retest | verdict |
|---|---|---|---|---|
| google/gemini-3.1-pro-preview | yes: native 2.4, leak 80% | 42% | Spearman 0.94, n=26 | **use as primary judge**; may favour Gemini TTS (4.94 vs 3.57 for others) |
| qwen/qwen3.8-omni-flash | weakly: native 4.4, leak 20% | 49%; calls 94% of TTS "human" | n/a | secondary only; cheap ($0.0006 per clip) |
| openai/gpt-audio | **no**: native 5.0, leak 0% | 89% | n/a | **reject as a judge** |

- Absolute 1-5 ratings bunch up at the top of the scale. Use the ranking, or pairwise comparisons on the same passage, plus a negative control in every batch.
- Real human studio-read anchors (IndicTTS-Hindi) scored *below* good TTS, so these judges do not measure "sounds like a real person".
  Human Indian listeners remain the decision instrument.
- Cost: about $4.2 for 530 audio judgments. The OpenRouter key's $10 cap blocks audio requests once the remaining balance drops below $0.50.
- Azure-side option, not built: gpt-realtime can take audio input and could serve as an Azure-billed judge. It is untested as a judge.
