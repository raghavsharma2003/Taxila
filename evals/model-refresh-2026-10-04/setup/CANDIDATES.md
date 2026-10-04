# Candidates: billing, licence and callability (setup, 2026-10-04)

**Method.** All data was pulled on 2026-10-04:
- ARM `/locations/{r}/models` in 16 regions → `results/regions-models.json`
- account `/models` and `/deployments` → `results/account-models.json`, `deployments-before.json`
- Foundry catalogue (`api.catalog.azureml.ms` asset-gallery, exact-name filter) → `results/foundry-catalog-names.json`. Its fields `isDirectFromAzure` and `hostedOn` are used as evidence.
- Azure retail prices API, 52,854 meters pulled → `results/prices-2026-10-04.json`, filtered
- Cost Management `ActualCost` from 2026-09-15 to 10-04: which meters actually billed → `results/cost-*.json`
- one smoke call per candidate (n=1 each), recorded in `results/smoke-2026-10-04.json`.

A smoke-call latency is a single call made from a US container. It is not a benchmark.

**Meter test (MODEL-ROUTER R5).** A model counts as Direct when the catalogue says `isDirectFromAzure: true` and `hostedOn: Azure`, and either:
- a retail meter exists under a first-party product ("Azure OpenAI*", "Azure Deepseek Models", "Azure Kimi", "Azure Mistral Models", "Cohere Models", "MAI Models", "Azure Grok Models", "Azure Speech"), or
- Cost Management shows charges on such a meter.

"Azure Fireworks Models" meters mean the model runs on Fireworks infrastructure as a partner host.

## Table

| model | deployment | meter | licence ok? | callable | evidence / reason |
|---|---|---|---|---|---|
| gpt-6-luna | taxila-gpt6-luna | Direct (Azure OpenAI GPT6 "6-luna") | yes (Azure OpenAI terms) | **yes** | 2489 ms, effort none |
| gpt-6-sol | taxila-gpt6 (existing) | Direct (GPT6 "6-sol") | yes | **yes** | 1401 ms |
| gpt-6.1-sol | taxila-gpt61-sol | Direct (Azure OpenAI first-party; catalogue Direct). **No public retail meter yet** | yes | **yes** | needs effort >= low; 2776 ms |
| gpt-6-astra | taxila-gpt6-astra | Direct (GPT6 "6-astra", $10 / $50 per 1M) | yes | **yes** | needs effort >= low; 2334 ms |
| DeepSeek-V4.1-Flash | taxila-ds41 (existing) | **Direct, contrary to R5**: see note A | custom (Foundry terms; record AUP and min-age, R7) | **yes** | 3630 ms |
| DeepSeek-V4.1-Pro | none | n/a | n/a | **no** | not in the ARM catalogue (16 regions) or the Foundry catalogue |
| DeepSeek-V4-Flash-0731 | taxila-ds4f-0731 | Direct (Azure Deepseek "V4 Flash 0731") | custom | **yes** | 1246 ms |
| DeepSeek-V4-Pro-0813 | none | not in the retail API | custom | **no** | ARM lists it in swedencentral only, so it cannot be deployed on the eastus2 account |
| DeepSeek-V4-Pro / V4-Flash | existing | Direct | custom | yes | billed on the "V4 Pro" and "V4 Flash" Direct meters (Cost Mgmt) |
| Kimi K3 | none | **Fireworks only** (FW-Kimi-K3, `hostedOn: Fireworks infrastructure`, "Azure Fireworks Models" meters, $3 / $15) | modified-MIT family | **no** | the measurement-only PUT returned `SpecialFeatureOrQuotaIdRequired: subscription does not have access` (GS and DZ). A first-party "Kimi-K3" is not in any catalogue, and PUT returned `DeploymentModelNotSupported` |
| Kimi K2.7 (non-code) | none | n/a | n/a | **no** | does not exist; only K2.7-Code |
| Kimi-K2.7-Code | taxila-kimi-code (existing) | Direct: billed on the "Azure Kimi / K2.7 Code" meters (Cost Mgmt, 10-02 and 10-03) | modified-MIT | **yes** | reasons; needs about 3000 tokens; 3794 ms |
| Kimi-K2.6 (Thinking) | taxila-kimi26 | Direct ("Azure Kimi K2.6") | modified-MIT | **yes** | reasons; 8222 ms |
| MAI-Transcribe-2 | none (Speech feature) | Direct (Azure Speech, first-party; no separate retail meter found, probably the "S1 Speech to Text Enhanced Feature Audio" meter, [U]) | Preview, custom | **yes, centralindia only** | 2551 ms on a 5.4 s Hindi clip, Devanagari with digits ("3 बटा 8") |
| MAI-Transcribe-1.5 | none (Speech feature) | Direct (Azure Speech) | Preview | **yes, centralindia only** | 3264 ms |
| MAI-Transcribe-2-Streaming | taxila-mai-tx2-stream (southindia) | Direct per catalogue (`isDirectFromAzure: true`). **No retail meter published** | Preview, custom | **yes** | OpenAI realtime transcription socket; not in eastus2 or centralindia (GS regions: centralus, eastus, southindia, swedencentral, westus) |
| gpt-live-transcribe | taxila-live-transcribe (existing) | Direct ($1.02/h) | yes | yes | |
| gpt-transcribe | taxila-gpt-transcribe | Direct ($0.27/h) | yes | **yes** | 1204 ms |
| gpt-realtime-whisper | taxila-rt-whisper | Direct ($1.02/h) | yes | **yes** | |
| gpt-realtime-whisper-2 | none | n/a | n/a | **no** | not in any catalogue today (stt-hinglish.md expected it) |
| MAI-Code-1.1-Flash | none | Direct ("MAI Models Code 1.1 Flash", $0.2 / $1.2) | other, Preview | **no** | PUT returned `SpecialFeatureOrQuotaIdRequired` (catalogue `minQuotaTier: 1`). A quota-tier request is needed, and this workflow may not make one |
| MAI-Voice-2 / 2.1 (+Flash) | none (Speech voices) | Direct (Azure Speech) | Preview: not for minors in production (router) | **yes** | hi-IN Arjun, Dhruv, Grant, Harper, Kavya, Priya are listed in centralindia; Arjun MAI-Voice-2.1 synthesised |
| DragonHD (en-IN) | none (Speech voices) | Direct (Azure Speech "Neural HD") | GA | **yes in centralindia** | 6 en-IN DragonHD voices (Diya, Lavanya, Meera, Aarti, Arjun, Neerja); Diya synthesised |
| MAI-Image-2.6 | taxila-mai-image26 (southindia) | Direct ("MAI Models Image 2.6") | Preview | **yes** | `/mai/v1/images/generations`; not offered in eastus2 |
| MAI-Thinking-1 | not deployed | Direct | Preview | deployable | **retires 2026-11-04**, so it was skipped |
| grok newest = grok-4.6 | taxila-grok46 (existing) | Direct (Azure Grok "4.6") | custom | yes | 33 s on the smoke call (router already notes timeouts); no grok-5 exists |
| mistral-medium-3-5 (newest Mistral chat) | taxila-mistral-m35 | Direct ("MM3.5") | custom | **yes** | 891 ms |
| mistral-ocr-4-0 | taxila-ocr4 | Direct ("OCR 4", $4 per 1k pages) | custom | **yes** | |
| gpt-image-2.5-flare | taxila-image25-flare | Direct (OpenAI Media) | yes | **yes** | 10.7 s at quality low |
| gpt-image-2.5-sunburst | taxila-image25-sunburst | Direct (OpenAI Media) | yes | **yes** | 23.3 s at quality low |
| text-embedding-3-large | taxila-embed-3l | Direct ($0.13 per 1M) | yes | **yes** | 3072 dimensions |
| Cohere embed-v-4-0 | taxila-cohere-embed4 | Direct ("Cohere Models Embed v4", $0.12 per 1M) | custom | **yes** | 1536 dimensions |
| Cohere-Embed-V5-Pro | measure-cohere-embed5-pro | **MEASUREMENT ONLY**: catalogue Direct but no retail meter | custom | **yes** | only `/providers/cohere/v2/embed` works |

## Note A: taxila-ds41 bills on a Direct meter. This reverses MODEL-ROUTER R5's premise.

There are two different catalogue assets for V4.1-Flash:
- `azureml-deepseek/DeepSeek-V4.1-Flash`: `isDirectFromAzure: true`, `hostedOn: ["Azure"]`, format `DeepSeek`.
- `azureml-fireworks/FW-DeepSeek-V4.1-Flash`: `hostedOn: "Fireworks infrastructure"`.

The "FW DS-V4.1-Flash" retail meters that R5 read belong to the **FW-** asset.

Evidence that taxila-ds41 is not the Fireworks asset:
1. The deployment's format is `DeepSeek`, not `Fireworks`.
2. Deploying the Fireworks asset on this subscription fails (`SpecialFeatureOrQuotaIdRequired`), so taxila-ds41 cannot be it.
3. Cost Management for 2026-09-15 to 10-04 shows **no "Azure Fireworks Models" charge at all**, although ds41 was called on 10-02 and 10-03. In those same days, two unnamed meters appear under the Direct product "Azure Deepseek Models":
   - "DS30 1M Tokens": 0.566M units, ₹0.544
   - "DS31 1M Tokens": 0.097M units, ₹0.093
   - V4-Flash and V4-Pro bill on their own named meters, so DS30 and DS31 are almost certainly V4.1-Flash input and output.
   - Caveat: their effective rate (about ₹0.96 per 1M) is far below the FW list price ($0.375 / $1.50). This is consistent with unpublished preview pricing, but it is not confirmed.

**Confirm** by making one call with a known token count to taxila-ds41 and checking that DS30/DS31 grow by the same amount 24-48 h later. Run `node cost-daily.mjs`.

## Spend (this setup step)

About 40 billable calls in all:
- 16 chat calls, mostly under 500 tokens each
- 3 images at low/default quality
- 1 OCR page
- 8 transcriptions of 5.4 s audio
- 2 short TTS clips
- 3 embedding calls

Deployments and the S0 accounts have no idle cost. **Estimated spend is under USD 0.50** [U, from list prices]. Cost Management lags 24-48 h, so re-check with `node cost.mjs 2026-10-04T00:00:00Z 2026-10-05T23:59:59Z`. The subscription total for 09-15 to 10-04 before this step was ₹22,526, across all projects.

## Scripts (run from this folder: `NODE_USE_ENV_PROXY=1 node --env-file=../../../.env.local <script>`)

- `inventory.mjs`, `regions.mjs`: catalogue pulls
- `catalog2.mjs`: Foundry catalogue lookup
- `prices.mjs`: retail prices
- `cost.mjs`, `cost-daily.mjs`: billed meters
- `usages.mjs`: quota
- `deploy.mjs`: idempotent; also takes `PLAN_JSON`, `ACCT_ID_OVERRIDE`
- `create-account.mjs`
- `write-keys.mjs`: keys go to `.env.local` only
- `smoke.mjs`, `e5.mjs`
