# Environment keys (names only — no values in git)

All 83 keys below are needed in `.env.local` (repo root, gitignored). In the new cloud environment the owner
adds them as environment variables (paste the `KEY=value` lines into the environment's settings), then:

```
node scripts/handoff/write-env-local.mjs      # writes .env.local from the process environment; reports any missing key
```

Never commit `.env.local`, never print a value, load it with `node --env-file=.env.local`.

| Key | Kind | What it is for |
|---|---|---|
| `AZURE_OPENAI_ENDPOINT` | config / id | Azure OpenAI main account (raghavsharma1729-compan-resource, eastus2) |
| `AZURE_OPENAI_API_KEY` | secret | Azure OpenAI main account (raghavsharma1729-compan-resource, eastus2) |
| `AZURE_FOUNDRY_PROJECT_ENDPOINT` | config / id | Foundry project endpoint |
| `DEPLOY_REALTIME` | config / id | Azure deployment name for a lane |
| `DEPLOY_REALTIME_MINI` | config / id | Azure deployment name for a lane |
| `DEPLOY_BRAIN` | config / id | Azure deployment name for a lane |
| `DEPLOY_FAST` | config / id | Azure deployment name for a lane |
| `DEPLOY_IMAGE` | config / id | Azure deployment name for a lane |
| `DEPLOY_TRANSCRIBE` | config / id | Azure deployment name for a lane |
| `DEPLOY_TTS` | config / id | Azure deployment name for a lane |
| `DATABASE_URL` | secret | Neon PRODUCTION database |
| `DATABASE_URL_SINGAPORE_OLD` | secret | old Neon Singapore DB (do not use) |
| `AZURE_STORAGE_ACCOUNT` | config / id | storage account (assets, handoff archives) |
| `AZURE_STORAGE_KEY` | secret | storage account (assets, handoff archives) |
| `AZURE_STORAGE_CONTAINER` | config / id | storage account (assets, handoff archives) |
| `FORGE_PUBLIC_BASE` | config / id | Forge settings |
| `DEPLOY_CODEX` | config / id | Azure deployment name for a lane |
| `DEPLOY_SORA` | config / id | Azure deployment name for a lane |
| `AZURE_SUBSCRIPTION_ID` | config / id | subscription id |
| `AZURE_RESOURCE_GROUP` | config / id | main resource group |
| `AZURE_CONTAINERAPPS_ENV` | config / id | Container Apps environment |
| `AZURE_TENANT_ID` | config / id | tenant id |
| `AZURE_SP_CLIENT_ID` | config / id | service principal for ARM / Cost Management / deploy |
| `AZURE_SP_SECRET` | secret | service principal for ARM / Cost Management / deploy |
| `TAXILA_URL` | config / id | production URL |
| `OPENROUTER_API_KEY` | secret | OpenRouter key (not allowed by the Azure-only rule; research only) |
| `CONDUCTOR_TEST_DATABASE_URL` | secret | Neon TEST branch for conductor DB tests |
| `FORGE_G2_CHILD_SALT` | secret | Forge settings |
| `TEST_DATABASE_URL` | secret | Neon TEST branch |
| `AWS_ACCESS_KEY_ID` | secret | AWS (legacy build bucket; not used by the Azure-only product) |
| `AWS_SECRET_ACCESS_KEY` | secret | AWS (legacy build bucket; not used by the Azure-only product) |
| `AWS_ACCOUNT_ID` | config / id | AWS (legacy build bucket; not used by the Azure-only product) |
| `AWS_DEFAULT_REGION` | config / id | AWS (legacy build bucket; not used by the Azure-only product) |
| `AWS_BUILD_BUCKET` | config / id | AWS (legacy build bucket; not used by the Azure-only product) |
| `TAXILA_OPS_KEY` | secret | ops endpoint key |
| `AZURE_AI_CENTRALINDIA_ENDPOINT` | config / id | Azure AI Services account taxila-ai-centralindia (Speech) |
| `AZURE_AI_CENTRALINDIA_REGION` | config / id | Azure AI Services account taxila-ai-centralindia (Speech) |
| `AZURE_AI_CENTRALINDIA_KEY` | secret | Azure AI Services account taxila-ai-centralindia (Speech) |
| `AZURE_AI_SOUTHINDIA_ENDPOINT` | config / id | Azure AI Services account taxila-ai-southindia (models, SIN overflow) |
| `AZURE_AI_SOUTHINDIA_REGION` | config / id | Azure AI Services account taxila-ai-southindia (models, SIN overflow) |
| `AZURE_AI_SOUTHINDIA_KEY` | secret | Azure AI Services account taxila-ai-southindia (models, SIN overflow) |
| `REFRESH_DEPLOY_GPT6_LUNA` | config / id | deployment names from the 2026-10-04 model refresh |
| `REFRESH_DEPLOY_GPT61_SOL` | config / id | deployment names from the 2026-10-04 model refresh |
| `REFRESH_DEPLOY_GPT6_ASTRA` | config / id | deployment names from the 2026-10-04 model refresh |
| `REFRESH_DEPLOY_DS4F_0731` | config / id | deployment names from the 2026-10-04 model refresh |
| `REFRESH_DEPLOY_KIMI26` | config / id | deployment names from the 2026-10-04 model refresh |
| `REFRESH_DEPLOY_MISTRAL_M35` | config / id | deployment names from the 2026-10-04 model refresh |
| `REFRESH_DEPLOY_OCR4` | config / id | deployment names from the 2026-10-04 model refresh |
| `REFRESH_DEPLOY_IMAGE25_FLARE` | config / id | deployment names from the 2026-10-04 model refresh |
| `REFRESH_DEPLOY_IMAGE25_SUNBURST` | config / id | deployment names from the 2026-10-04 model refresh |
| `REFRESH_DEPLOY_EMBED_3L` | config / id | deployment names from the 2026-10-04 model refresh |
| `REFRESH_DEPLOY_COHERE_EMBED4` | config / id | deployment names from the 2026-10-04 model refresh |
| `REFRESH_DEPLOY_COHERE_EMBED5_PRO_MEASURE` | config / id | deployment names from the 2026-10-04 model refresh |
| `REFRESH_DEPLOY_GPT_TRANSCRIBE` | config / id | deployment names from the 2026-10-04 model refresh |
| `REFRESH_DEPLOY_RT_WHISPER` | config / id | deployment names from the 2026-10-04 model refresh |
| `REFRESH_DEPLOY_MAI_TX2_STREAM` | config / id | deployment names from the 2026-10-04 model refresh |
| `REFRESH_DEPLOY_MAI_IMAGE26` | config / id | deployment names from the 2026-10-04 model refresh |
| `AZURE_OPENAI_ENDPOINT_SIN` | config / id | Azure OpenAI endpoint, south India |
| `AZURE_OPENAI_API_KEY_SIN` | secret | Azure OpenAI key, south India account |
| `AZURE_AI_SERVICES_ENDPOINT_SIN` | config / id | AI services endpoint (south India) |
| `AZURE_SPEECH_REGION_SIN` | config / id | Azure Speech (south India) |
| `AZURE_SPEECH_KEY_SIN` | secret | Azure Speech (south India) |
| `AZURE_PG_SIN_USER` | config / id | Azure Postgres taxila-cin-pg (India move; unused by prod) |
| `AZURE_PG_SIN_PASSWORD` | secret | Azure Postgres taxila-cin-pg (India move; unused by prod) |
| `AZURE_IMAGE_UAEN_ENDPOINT` | config / id | image-model deployments by region (Forge / Studio pictures) |
| `AZURE_IMAGE_UAEN_KEY` | secret | image-model deployments by region (Forge / Studio pictures) |
| `AZURE_IMAGE_UAENORTH_ENDPOINT` | config / id | image-model deployments by region (Forge / Studio pictures) |
| `AZURE_IMAGE_UAENORTH_KEY` | secret | image-model deployments by region (Forge / Studio pictures) |
| `AZURE_IMAGE_WESTUS3_ENDPOINT` | config / id | image-model deployments by region (Forge / Studio pictures) |
| `AZURE_IMAGE_WESTUS3_KEY` | secret | image-model deployments by region (Forge / Studio pictures) |
| `AZURE_IMAGE_SWEDENCENTRAL_ENDPOINT` | config / id | image-model deployments by region (Forge / Studio pictures) |
| `AZURE_IMAGE_SWEDENCENTRAL_KEY` | secret | image-model deployments by region (Forge / Studio pictures) |
| `AZURE_IMAGE_POLANDCENTRAL_ENDPOINT` | config / id | image-model deployments by region (Forge / Studio pictures) |
| `AZURE_IMAGE_POLANDCENTRAL_KEY` | secret | image-model deployments by region (Forge / Studio pictures) |
| `AZURE_PG_SIN_HOST` | config / id | Azure Postgres taxila-cin-pg (India move; unused by prod) |
| `AZURE_PG_SIN_DATABASE` | config / id | Azure Postgres taxila-cin-pg (India move; unused by prod) |
| `AZURE_PG_SIN_URL` | secret | Azure Postgres taxila-cin-pg (India move; unused by prod) |
| `VERCEL_TOKEN` | secret | Vercel (paused project) |
| `VERCEL_TEAM_ID` | config / id | Vercel (paused project) |
| `ACS_CONNECTION_STRING` | secret | Azure Communication Services (email) |
| `ACS_SENDER` | config / id | Azure Communication Services (email) |
| `VOICESIG_SUBJECT_KEY` | secret | voice signature key |
| `TAXILA_PLAY_KEY` | secret | play/games signing key |
