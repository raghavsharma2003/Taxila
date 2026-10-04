# Endpoints (model-refresh 2026-10-04, setup)

Names only. Keys live in gitignored `.env.local` and nowhere else.

## Accounts

| account | region | kind / sku | endpoint host | env vars (.env.local) |
|---|---|---|---|---|
| raghavsharma1729-compan-resource (existing) | eastus2 | AIServices S0 | `raghavsharma1729-compan-resource.openai.azure.com`, `.cognitiveservices.azure.com`, `.services.ai.azure.com` | `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY` (unchanged) |
| **taxila-ai-centralindia** (new 2026-10-04) | centralindia | AIServices S0 | `taxila-ai-centralindia.cognitiveservices.azure.com` | `AZURE_AI_CENTRALINDIA_ENDPOINT`, `AZURE_AI_CENTRALINDIA_REGION`, `AZURE_AI_CENTRALINDIA_KEY` |
| **taxila-ai-southindia** (new 2026-10-04) | southindia | AIServices S0 | `taxila-ai-southindia.cognitiveservices.azure.com` | `AZURE_AI_SOUTHINDIA_ENDPOINT`, `AZURE_AI_SOUTHINDIA_REGION`, `AZURE_AI_SOUTHINDIA_KEY` |

Both new accounts are in the existing resource group, tagged `project=taxila, purpose=model-refresh-2026-10-04`.
S0 has no fixed fee; they cost only per call.

## New deployments

| deployment | account | model@version | sku / capacity | env var |
|---|---|---|---|---|
| taxila-gpt6-luna | eastus2 | gpt-6-luna@2026-09-22 | GlobalStandard 500 | `REFRESH_DEPLOY_GPT6_LUNA` |
| taxila-gpt61-sol | eastus2 | gpt-6.1-sol@2026-09-29 | GlobalStandard 500 | `REFRESH_DEPLOY_GPT61_SOL` |
| taxila-gpt6-astra | eastus2 | gpt-6-astra@2026-09-03 | GlobalStandard 100 | `REFRESH_DEPLOY_GPT6_ASTRA` |
| taxila-ds4f-0731 | eastus2 | DeepSeek-V4-Flash-0731@2026-07-31 | GlobalStandard 125 | `REFRESH_DEPLOY_DS4F_0731` |
| taxila-kimi26 | eastus2 | Kimi-K2.6@2026-04-20 | GlobalStandard 100 | `REFRESH_DEPLOY_KIMI26` |
| taxila-mistral-m35 | eastus2 | mistral-medium-3-5@1 | GlobalStandard 200 | `REFRESH_DEPLOY_MISTRAL_M35` |
| taxila-ocr4 | eastus2 | mistral-ocr-4-0@1 | GlobalStandard 30 | `REFRESH_DEPLOY_OCR4` |
| taxila-image25-flare | eastus2 | gpt-image-2.5-flare@2026-09-08 | GlobalStandard 2 | `REFRESH_DEPLOY_IMAGE25_FLARE` |
| taxila-image25-sunburst | eastus2 | gpt-image-2.5-sunburst@2026-09-08 | GlobalStandard 2 | `REFRESH_DEPLOY_IMAGE25_SUNBURST` |
| taxila-embed-3l | eastus2 | text-embedding-3-large@1 | GlobalStandard 500 | `REFRESH_DEPLOY_EMBED_3L` |
| taxila-cohere-embed4 | eastus2 | embed-v-4-0@1 | GlobalStandard 50 | `REFRESH_DEPLOY_COHERE_EMBED4` |
| measure-cohere-embed5-pro | eastus2 | Cohere-Embed-V5-Pro@1 (**MEASUREMENT ONLY**: no retail meter) | GlobalStandard 50 | `REFRESH_DEPLOY_COHERE_EMBED5_PRO_MEASURE` |
| taxila-gpt-transcribe | eastus2 | gpt-transcribe@2026-07-28 | GlobalStandard 10 | `REFRESH_DEPLOY_GPT_TRANSCRIBE` |
| taxila-rt-whisper | eastus2 | gpt-realtime-whisper@2026-05-06 | GlobalStandard 10 | `REFRESH_DEPLOY_RT_WHISPER` |
| taxila-mai-tx2-stream | southindia | MAI-Transcribe-2-Streaming@2026-08-06 | GlobalStandard 10 | `REFRESH_DEPLOY_MAI_TX2_STREAM` |
| taxila-mai-image26 | southindia | MAI-Image-2.6@2026-07-31 | GlobalStandard 2 | `REFRESH_DEPLOY_MAI_IMAGE26` |

## Speech features (no deployment)

| feature | where it works | how to call it |
|---|---|---|
| MAI-Transcribe-2, MAI-Transcribe-1.5 | **centralindia only** of the three accounts (eastus2: "Enhanced mode with model is currently not supported yet"; southindia: 404) | `POST https://taxila-ai-centralindia.cognitiveservices.azure.com/speechtotext/transcriptions:transcribe?api-version=2025-10-15`, multipart `audio` + `definition={"enhancedMode":{"enabled":true,"model":"MAI-Transcribe-2"}}` |
| DragonHD voices | centralindia lists 88 DragonHD voices, including en-IN Diya, Lavanya, Meera, Aarti, Arjun, Neerja | `https://centralindia.tts.speech.microsoft.com/cognitiveservices/v1` |
| MAI-Voice-2 / 2.1 (+Flash) | centralindia lists hi-IN Arjun, Dhruv, Grant, Harper, Kavya, Priya | same TTS endpoint |

## Call routes that are not obvious

- **Cohere-Embed-V5-Pro**: works only on `POST https://<account>.services.ai.azure.com/providers/cohere/v2/embed` (body: `model`, `texts`, `input_type`, `embedding_types`). `/openai/v1/embeddings` and `/models/embeddings` return 404 `api_not_supported`.
- **MAI-Transcribe-2-Streaming**: the OpenAI realtime transcription socket works on the southindia account: `wss://taxila-ai-southindia.cognitiveservices.azure.com/openai/v1/realtime?intent=transcription`, with `session.audio.input.transcription.model = "taxila-mai-tx2-stream"`.
- **MAI-Image-2.6**: `POST https://taxila-ai-southindia.cognitiveservices.azure.com/mai/v1/images/generations` (`model`, `prompt`, `width`, `height`). The OpenAI images route did not return an image.
- **mistral-ocr-4-0**: `POST https://raghavsharma1729-compan-resource.services.ai.azure.com/providers/mistral/azure/ocr`.
- **gpt-6.1-sol, gpt-6-astra**: reject `reasoning_effort: "none"`. The lowest effort they accept is `low`. gpt-6-luna and gpt-6-sol accept `none`.
- **Kimi K2.6 and K2.7-Code**: both reason before answering. A 400-token cap returned empty content with `finish_reason: length`, so give them about 3000 tokens.
