# India move: eastus2 → South India (southindia)

Owner directive, 2026-10-04: users are India-only, so compute moves to Azure South India. Foundry models stay in eastus2
only where South India's catalogue lacks them (gpt-image-2/2.5, gpt-4o-mini-tts, sora-2): nothing live waits on those.
The database moves to Azure Database for PostgreSQL Flexible Server in South India (owner chose option a). Neon prod
stays as the rollback copy and keeps the test branches.
This workflow builds and rehearses. The **main loop does the cutover** after Wave 1 deploys. Nothing here touches
`taxila-web` (eastus2) or writes to Neon prod.

Survey data: `node scripts/region/survey.mjs` (READ-ONLY ARM; prints no secret values) writes
`node_modules/.cache/india-move/survey.json`. Run date for everything below: 2026-10-04, from the US sandbox.

---

## §1 Inventory (names only, 2026-10-04)

Subscription: one (the Azure startup grant). The service principal has Contributor on it.
Taxila resource group: **`rg-raghavsharma1729-7190`**. The `vyakti-voice` RG (Central India) and
`rg-raghavsharma1729-6435` belong to other products. They are out of scope and stay where they are.

### 1.1 Compute, registry, storage, observability (rg-raghavsharma1729-7190)

| resource | type | region | notes |
|---|---|---|---|
| `taxila-env` | ACA managed environment | eastus2 | Consumption only, **no VNet**, static IP 20.88.123.49 |
| `taxila-web` | Container App | eastus2 | **LIVE PROD.** Today: Single revision mode, 0.5 vCPU / 1 Gi, replicas 1-5 (http 50 concurrent), image `taxilacr.azurecr.io/taxila-web:aa263ce`, external ingress :8080. Wave 1's deploy-azure.mjs moves it to Multiple mode, 1 vCPU / 2 Gi, 1 replica |
| `taxila-forge-untrusted` | ACA managed environment | eastus2 | the untrusted Forge sandbox env, no VNet |
| `forge-g2-runner` | ACA job (Manual) | eastus2 | `server/forge/g2/azure-job.js` hard-codes `location: "eastus2"` and env `taxila-forge-untrusted` |
| `taxila-probe-eus2`, `taxila-probe-adhoc` | ACA jobs | eastus2 (in `taxila-env`) | probe fleet |
| `taxila-probes-ci` / `taxila-probe-ci` | ACA env + scheduled job | **centralindia** | the Indian vantage point. Use it for the before/after latency check |
| `taxilacr` | Container Registry, **Basic** | eastus2 | Basic has no geo-replication |
| `taxilaforge` | Storage StorageV2 Standard_LRS | eastus2 | container `forge` (public blob read: game delivery) + G2 private/run/test containers |
| `taxila-logs` | Log Analytics workspace | eastus2 | |
| `taxila-web-5xx`, `taxila-turn-p90`, `taxila-worker-liveness`, `taxila-job-failures` | scheduled query alerts | eastus2 | |
| `taxila-replica-restarts` | metric alert | global | |
| `taxila-owner` | action group | global | |

### 1.2 Foundry / AIServices accounts

| account | kind | region | deployments |
|---|---|---|---|
| `raghavsharma1729-compan-resource` (projects `taxila`, `raghavsharma1729-companion`, `sales-enabler`) | AIServices S0 | eastus2 | **49**. This is the account the app calls today |
| `taxila-ai-southindia` | AIServices S0 | southindia | 2: `taxila-mai-tx2-stream` (MAI-Transcribe-2-Streaming, cap 10), `taxila-mai-image26` (MAI-Image-2.6, cap 2) |
| `taxila-ai-centralindia` | AIServices S0 | centralindia | 0. **Serves Azure Speech incl. DragonHD** (see §2.3) |
| `raghavsharma1729-5391-resource` | AIServices S0 | eastus2 | 0 (not Taxila) |

Deployments on the eastus2 account that the **app reads today** (taxila-web env, values not secret):

| env var | deployment | model@version | SKU | cap |
|---|---|---|---|---|
| DEPLOY_FAST (+ DEPLOY_REPLY default) | `taxila-fast` | gpt-5.6-luna@2026-07-09 | GlobalStandard | 500 |
| DEPLOY_BRAIN (+ DEPLOY_GRADE_FALLBACK default) | `taxila-brain` | gpt-5.6-sol@2026-07-09 | GlobalStandard | 500 |
| DEPLOY_CLASSIFY | `grok-4-1-fast-non-reasoning` | grok-4-1-fast-non-reasoning@1 | GlobalStandard | 500 |
| DEPLOY_GRADE (code default) | `DeepSeek-V4-Pro` | DeepSeek-V4-Pro@2026-04-23 | GlobalStandard | 500 |
| DEPLOY_REALTIME | `taxila-realtime` | gpt-realtime-2.1@2026-07-07 | GlobalStandard | 10 |
| DEPLOY_REALTIME_MINI | `gpt-realtime-2.1-mini` | gpt-realtime-2.1-mini@2026-07-07 | GlobalStandard | 30 |
| DEPLOY_TRANSCRIBE / TAXILA_STT_MODEL | `taxila-transcribe` | gpt-4o-transcribe@2025-03-20 | GlobalStandard | 100 |
| DEPLOY_TTS | `gpt-4o-mini-tts` | gpt-4o-mini-tts@2025-12-15 | GlobalStandard | 50 |
| DEPLOY_IMAGE | `taxila-image` | gpt-image-2@2026-04-21 | GlobalStandard | 4 |
| DEPLOY_CODEX | `taxila-codex` | gpt-5.3-codex@2026-02-24 | GlobalStandard | 500 |
| DEPLOY_SORA | `taxila-sora` | sora-2@2025-12-08 | GlobalStandard | 10 |

The eastus2 account also holds bench/router deployments that the router or other workflows may promote:
`taxila-live` (gpt-live-1, 10), `taxila-live-transcribe` (gpt-live-transcribe, 10), `taxila-gpt6` (gpt-6-sol),
`taxila-gpt6-luna`, `taxila-gpt61-sol`, `taxila-gpt6-astra`, `taxila-ds41` (DeepSeek-V4.1-Flash), `taxila-fast-bg`,
`taxila-studio-sol`, `taxila-realtime-dz` (gpt-realtime-2.1 DataZoneStandard, 10), `taxila-flux2`, `taxila-kontext`,
`taxila-image25-flare`, `taxila-image25-sunburst`, `taxila-embed-3l`, `text-embedding-3-small`, `taxila-oss120`,
`taxila-grok46`, `taxila-kimi-code`, `taxila-kimi26`, `taxila-mistral-m35`, `taxila-ocr4`, `taxila-cohere-embed4`,
`measure-cohere-embed5-pro`, `taxila-gpt-transcribe`, `taxila-rt-whisper`, `gpt-5.6-terra`, `gpt-4.1-mini`,
`gpt-4o-mini-transcribe`, `DeepSeek-V4-Flash`, `taxila-ds4f-0731`, grok-4.x variants, `Mistral-Large-3`,
`Cohere-command-a-plus-05-2026`.

### 1.3 Container App secrets on taxila-web (names only)

`acr-password`, `azure-openai-key` → AZURE_OPENAI_API_KEY, `database-url` → DATABASE_URL, `storage-key` →
AZURE_STORAGE_KEY, `forge-g2-child-salt` → FORGE_G2_CHILD_SALT. deploy-azure.mjs adds `taxila-ops-key` →
TAXILA_OPS_KEY when it is in .env.local.

### 1.4 Env vars the server reads for endpoints, keys and region-bound names

| var | read in | today | region-bound? |
|---|---|---|---|
| `AZURE_OPENAI_ENDPOINT` | server/azure.js `endpoint()`, voice/speech.js, voice/stt.js, forge/g2/model.js, forge/g2/safety.js (host reused for Content Safety) | `https://raghavsharma1729-compan-resource.openai.azure.com/openai/v1` | **yes. ONE endpoint for every lane, TTS and image included** (gap G1) |
| `AZURE_OPENAI_API_KEY` | same files | secret | yes |
| `DEPLOY_REALTIME`, `DEPLOY_BRAIN`, `DEPLOY_FAST`, `DEPLOY_REPLY`, `DEPLOY_CLASSIFY`, `DEPLOY_TRANSCRIBE`, `DEPLOY_TTS`, `DEPLOY_GRADE`, `DEPLOY_GRADE_FALLBACK`, `DEPLOY_CODEX`, `TAXILA_STT_MODEL` | server/azure.js `DEPLOY`, comprehension/grade/closed.js, forge/g2/*, voice/stt.js | deployment names | names only, resolved against the endpoint |
| `DATABASE_URL`, `DB_DRIVER`, `DB_POOL_MAX`, `DB_POOL_IDLE_MS` | server/db.js | Neon `c-13.us-east-1.aws.neon.tech/taxila`, sslmode=require | yes |
| `CONDUCTOR_TEST_DATABASE_URL` / `TEST_DATABASE_URL` | tests | Neon branch `conductor-test` (us-east-1) | stays on Neon |
| `AZURE_STORAGE_ACCOUNT`, `AZURE_STORAGE_KEY`, `AZURE_STORAGE_CONTAINER`, `FORGE_PUBLIC_BASE` | server/forge/blob.js, forge/g2/store.js, infra/* | `taxilaforge` / `forge` (eastus2) | yes |
| `AZURE_SUBSCRIPTION_ID`, `AZURE_RESOURCE_GROUP`, `AZURE_TENANT_ID`, `AZURE_SP_CLIENT_ID`, `AZURE_SP_SECRET` | infra/azure.mjs, forge/g2/azure-job.js | grant subscription, `rg-raghavsharma1729-7190` | RG only |
| `AZURE_CONTAINERAPPS_ENV` | .env.local only (scripts) | `taxila-env` | yes |
| `TAXILA_VOICE_<ID>` | compiler/characters/index.js | unset (character default voice) | voice name only |
| `AZURE_AI_SOUTHINDIA_{ENDPOINT,REGION,KEY}`, `AZURE_AI_CENTRALINDIA_{ENDPOINT,REGION,KEY}` | .env.local only (bench scripts). **Server reads neither** | the two India AIServices accounts | yes |
| `AZURE_FOUNDRY_PROJECT_ENDPOINT` | .env.local only | eastus2 project `taxila` | yes |

Hard-coded regions in code (not env-driven today): `server/forge/g2/azure-job.js` (`location: "eastus2"`,
env `taxila-forge-untrusted`), `infra/eyes.mjs` (`LOC = "eastus2"`), `infra/probes/deploy.mjs` (probe table),
`scripts/deploy-azure.mjs` (`taxilacr.azurecr.io`, app `taxila-web`; the RG comes from env). In comments only:
`server/forge/g2/model.js` (eastus2 ACA prices), `server/conductor/clock.js` (UTC), `server/db.js`.

### 1.5 Neon prod database

Project `taxila-us` (`royal-fire-14595065`), aws-us-east-1, **PostgreSQL 17.11**. Database `taxila` on branch
`main` (protected, default). Fixed 1 CU, never suspends. **DB size 101 MB** (`pg_database_size`; branch
logical size 129 MB). 55 public tables, 13 rows in `schema_migrations`. Extensions: `pgcrypto 1.3`, `plpgsql`. Other
branches: `conductor-test` (the test DB) and `restore-drill-2026-10-04` (expires 2026-10-05). The old Singapore
project `taxila` (`billowing-glitter-91836156`, PG17) is DATABASE_URL_SINGAPORE_OLD.
Measured with one read-only Neon SQL statement. A direct pg connection from the sandbox hangs because TCP 5432 does
not pass the proxy. So the dump/restore has to run from inside Azure, as an ACA job (see §3).

---

## §2 Gaps: what South India has, lacks, or needs first

### 2.1 Foundry models in southindia: catalogue and quota (usages API, 2026-10-04)

**Quota finding: most GlobalStandard quotas are pooled across the whole subscription, not per region.**
163 of 172 usage rows read identically in southindia and eastus2, including MAI-Transcribe-2-Streaming 10/10. That
model is deployed only in southindia, yet eastus2 reports it as used too. Only a few quotas are counted per region:
gpt-4o-transcribe, gpt-4o-mini-transcribe, FLUX.2-pro, FLUX.1-Kontext-pro, Kimi-K2.6, embed-v-4-0 and
gpt-4-turbo Standard. **A South India twin of a pooled model therefore uses the same pool as the eastus2
deployment it replaces.**

| model (deployment today, cap) | in SI catalogue | SI quota used/limit | twin at current cap fits? |
|---|---|---|---|
| gpt-5.6-luna (`taxila-fast` 500, `taxila-fast-bg` 500) | yes (GS) | 1000/2000 pooled | yes, both (→2000/2000, full) |
| gpt-5.6-sol (`taxila-brain` 500, `taxila-studio-sol` 500) | yes (GS, DZ) | 1000/2000 pooled | yes, both (→ full) |
| grok-4-1-fast-non-reasoning (500) | yes | 500/1000 pooled | yes (→ full) |
| DeepSeek-V4-Pro (500) | yes | 500/1000 pooled | yes (→ full) |
| gpt-5.3-codex (`taxila-codex` 500) | yes | 500/3000 | yes |
| gpt-6-sol / gpt-6-luna / gpt-6.1-sol (500 each), gpt-6-astra (100) | yes | 500/2000 each, astra 100/2000 | yes |
| DeepSeek-V4.1-Flash (`taxila-ds41` 200) | yes | 200/1000 | yes |
| gpt-4o-transcribe (`taxila-transcribe` 100) | yes | 0/400 **per region** | yes |
| text-embedding-3-small / -3-large (500) | yes | 500/2000 | yes |
| FLUX.2-pro (4), FLUX.1-Kontext-pro (10) | yes | 0/4, 0/30 per region | yes |
| **gpt-realtime-2.1 (`taxila-realtime` 10)** | yes | **10/10 pooled** | **NO: quota full** |
| **gpt-realtime-2.1-mini (30)** | yes | **30/30 pooled** | **NO** |
| **gpt-live-transcribe (`taxila-live-transcribe` 10)** | yes | **10/10 pooled** | **NO** |
| **gpt-live-1 (`taxila-live` 10)** | yes | **10/10 pooled** | **NO** |
| gpt-transcribe, gpt-realtime-whisper (10) | yes | 10/10 pooled | NO |
| MAI-Transcribe-2-Streaming | yes, already deployed in SI | 10/10 | already there |
| gpt-4o-mini-tts, gpt-image-2, gpt-image-2.5-*, sora-2 | **no** | n/a | stay on eastus2 (directive) |

Realtime voice and live transcription are exactly the lanes where proximity matters most. Their twins cannot be
created while the eastus2 deployments hold the whole pool. Two ways out:
(a) a **quota increase request** (portal, owner action) for gpt-realtime-2.1, gpt-realtime-2.1-mini,
gpt-live-transcribe and gpt-live-1 GlobalStandard to 20/60/20/20. Then both regions run in parallel through the
rehearsal and the cutover. This is preferred: no gap in service.
(b) at cutover, the main loop deletes the eastus2 bench copies first (`taxila-realtime-dz` is DataZoneStandard
and does not hold the GS pool; `taxila-live` and `taxila-live-transcribe` are bench deployments not read by prod)
and **reduces** eastus2 `taxila-realtime` to free capacity. That touches prod, so it is the main loop's call,
never this workflow's.

Caveat (unmeasured): GlobalStandard routes inference to any region with capacity, so a South India deployment
moves the *ingress* to India but does not promise processing there. The latency gain has to be **measured** from
the Central India probe (`taxila-probe-ci`): eastus2 endpoint vs southindia endpoint, TTFT/TTFB per lane, with n
stated. Do not assume it. DataZoneStandard is offered in SI for gpt-5.6-sol, gpt-6.1-sol, gpt-5.3-codex and
embeddings. Its quota is separate (0/667 etc.) and worth a bake-off if Global routing turns out to leave India.

### 2.2 Eastus2-only models (stay put, by directive)

gpt-4o-mini-tts (today's cascade TTS), gpt-image-2 / 2.5, sora-2. **G1: the server has one
`AZURE_OPENAI_ENDPOINT`/key for every lane.** Moving it to South India breaks TTS, image and sora unless
per-lane endpoint overrides exist. Planned fix (server config, env-driven, default = today's single endpoint):
`AZURE_OPENAI_ENDPOINT_TTS`, `AZURE_OPENAI_ENDPOINT_IMAGE` (+ matching `_API_KEY_*`), resolved per `post()`
kind in server/azure.js and voice/speech.js. Forge g2 model.js and safety.js keep the primary endpoint.
Content Safety (safety.js reuses the endpoint host) needs checking on the SI account (AIServices S0 includes it;
untested).
Cross-region TTS cost: the mouth's first byte gains the India↔eastus2 RTT (~200-250 ms, unmeasured from India)
while TTS stays in eastus2. **That is the strongest reason to land the router's proposed DragonHD lane (§2.3) with
the move.**

### 2.3 Speech DragonHD voices

- **southindia: not served.** `southindia.tts.speech.microsoft.com` voices/list → **503** (x2), synthesis of
  Diya/Arjun/Meera DragonHD → 503. The resource subdomain path → 501. South India is not an Azure Speech region.
  No new resource will fix that.
- **centralindia: available** on the existing `taxila-ai-centralindia`: voices/list 200 (916 voices), including
  `en-IN-Diya:DragonHDLatestNeural`, `en-IN-Arjun:DragonHDLatestNeural`, `en-IN-Meera:DragonHDLatestNeural` (plus
  Aarti, Lavanya and Neerja DragonHD, `hi-in-diya:DragonHDOmniIndicNeural`, and MAI-Voice-2.x Arjun/Kavya). One
  short synthesis each returned 200 PCM (n=1 each, from the US sandbox. The ms timings are not India latencies).
- Central India ↔ South India (Pune ↔ Chennai) is the nearest pair, about 1,100 km. This is the right home for the
  Speech lane. No new resource is needed: `AZURE_SPEECH_REGION=centralindia` + `AZURE_SPEECH_KEY` (secret
  `azure-speech-key`), once the TTS lane is built (router row "Cascade TTS", pending the panel pilot).

### 2.4 Container Apps in southindia

Available: Microsoft.App is registered and in the region. Workload profile types: Consumption (4c/8G), Flex,
D4-D32, E4-E32, GPU T4. **Plan: a new workload-profiles environment `taxila-env-si` in a VNet** (Consumption
profile only, so no dedicated plan fee). The infrastructure subnet must be at least /27 and delegated to
`Microsoft.App/environments`. The env gets a static outbound IP, which is the firewall fallback.
Today's `taxila-env` has no VNet and an environment cannot gain one after creation, so it has to be a new env.
`forge-g2-runner` and `taxila-forge-untrusted` are batch work and may stay in eastus2 (nothing live waits). Move
them later, through the env-driven location (gap G4).

### 2.5 PostgreSQL Flexible Server in southindia

Capabilities API: **PG 11-18 offered (17 matches Neon 17.11)**. Burstable B1ms-B20ms, General Purpose D2s_v3 to
D96ads_v6 (incl. **D2ds_v5 / D4ds_v5**), Memory Optimized E-series. Storage 32 GB-32 TB. Geo-backup Enabled.
**Zone-redundant HA: Disabled** (South India reports no availability zones), so same-zone HA is the only HA mode.
**Microsoft.DBforPostgreSQL and Microsoft.Network were NotRegistered.** Registration was requested 2026-10-04
(both returned `Registering`). The build step must check they read `Registered`.
Private access needs: a subnet delegated to `Microsoft.DBforPostgreSQL/flexibleServers` in the same VNet, and a
private DNS zone `<server>.private.postgres.database.azure.com` (or `privatelink.postgres.database.azure.com`)
linked to the VNet. Public network access stays Disabled. TLS: `require_secure_transport=on` (the default) and
`sslmode=require` in the URL, same as Neon today. Extension `pgcrypto` must be allow-listed
(`azure.extensions=PGCRYPTO`) before the migrations replay.

### 2.6 Other gaps

- **G2 data move path**: the sandbox cannot reach Postgres directly (5432 does not pass the proxy). Neon →
  Azure PG must run as an ACA job inside the SI VNet: `pg_dump` from Neon over TLS, `pg_restore` to the private
  server. 101 MB → minutes. Rehearse it on Neon branch `restore-drill-*` data, never by writing to Neon prod.
- **G3 ACR**: `taxilacr` is Basic in eastus2. A revision in SI pulls cross-region only at start. That is fine at
  first. A new Basic `taxilacrsi` (about $5/mo) is optional; geo-replication would need Premium.
- **G4 hard-coded `eastus2`** in server/forge/g2/azure-job.js and infra/eyes.mjs. Make it env-driven
  (`TAXILA_FORGE_JOB_LOCATION`, default eastus2) when Forge moves.
- **G5 Blob `taxilaforge` in eastus2** serves game assets to Indian children over about 250 ms RTT. A storage
  account in SI (`taxilaforgesi`) with `FORGE_PUBLIC_BASE` pointing at it is the clean move. Copy the containers
  with server-side copy. Not live-blocking, so it can follow the app.
- **G6 scripts/deploy-azure.mjs** hard-codes app `taxila-web`, `taxilacr.azurecr.io` and takes the RG from env.
  Make region, app, env and registry parameters, with defaults unchanged.
- **G7 Observability**: point the new env at `taxila-logs` (eastus2. Cross-region ingest works). Clone the four
  query alerts with the new app name.

---

## §3 Plan (for the build step; the main loop owns cutover)

1. Confirm the provider registrations. Owner files the quota raise for realtime-2.1, realtime-2.1-mini,
   live-transcribe and live-1 (§2.1a).
2. Build `scripts/region/` (idempotent ARM): VNet `taxila-vnet-si` (10.40.0.0/16) with subnets `aca-infra`
   (/23, Microsoft.App/environments) and `pg` (/28, DBforPostgreSQL), private DNS zone + link, PG Flexible
   `taxila-pg-si` (PG 17, General Purpose D2ds_v5, 64 GB, private access, TLS required, pgcrypto allow-listed,
   geo-redundant backup ON: SI's paired region is Central India, so backups stay in India), ACA env `taxila-env-si`
   (Consumption profile, `taxila-logs`), Foundry twins on `taxila-ai-southindia` (same deployment names as eastus2
   so DEPLOY_* need not change), and a rehearsal app `taxila-web-si`.
3. Server config: per-lane endpoint overrides (G1), env-driven only, defaults identical to today.
   `scripts/deploy-azure.mjs`: `--region/--app/--env/--registry` (G6).
4. Rehearse: ACA job dumps Neon (read-only) → restores to `taxila-pg-si` → `migrationsGate` → deploy
   `taxila-web-si` with `--scratch`-style smoke → probe from `taxila-probe-ci` (eastus2 vs SI, per lane, n stated).
5. Hand the main loop: the cutover runbook (freeze writes → final dump/restore → swap DATABASE_URL and
   AZURE_OPENAI_ENDPOINT → DNS/front door), with rollback to Neon + eastus2.

## §4 Created resources (names only)

| date | name | type | region | by |
|---|---|---|---|---|
| (none yet; Survey was read-only except two provider registrations: Microsoft.DBforPostgreSQL, Microsoft.Network) | | | | |

## §5 Spend estimates (Azure retail, South India, read 2026-10-04 from prices.azure.com; monthly = 730 h)

| item | price | est. / month |
|---|---|---|
| PG Flexible General Purpose D2ds_v5 (2 vCore, 8 GiB) | $0.2784/h | **~$203** |
| ...same-zone HA standby (optional; no zone-redundant HA in SI) | +$0.2784/h | +$203 |
| ...Burstable B2ms alternative (not recommended: credits throttle under load) | $0.098/h | ~$72 |
| PG storage 64 GB + backup (backup up to 100% of storage free; above that $0.144/GB-mo) | storage meter not read | ~$8-10 (unverified) |
| ACA `taxila-web-si` 1 vCPU / 2 GiB, 1 replica always active | $0.000024/vCPU-s + $0.000003/GiB-s | ~$78 (less when idle) |
| ACA workload-profiles env, Consumption profile only | no env fee (Environment Management $0.151/h applies to Dedicated profiles) | $0 |
| Private DNS zone + VNet | VNet free; zone ~$0.50 | ~$1 |
| ACR Basic in SI (optional) | $0.1666/day | ~$5 |
| Foundry twins (GlobalStandard) | per token, same prices as eastus2. No fixed cost | $0 fixed |
| DragonHD TTS (centralindia) | ~$22 / 1M chars (MODEL-ROUTER) | usage-based |
| **Fixed new spend** | | **~$290/mo** (~$495 with HA) |
| Rehearsal overlap | eastus2 stack keeps running until cutover | existing spend continues |
