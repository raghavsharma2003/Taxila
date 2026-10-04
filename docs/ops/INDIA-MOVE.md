# India move: eastus2 → South India (southindia)

Owner directive, 2026-10-04: users are India-only, so compute moves to Azure South India. Foundry models stay in eastus2
only where South India's catalogue lacks them (gpt-image-2/2.5, gpt-4o-mini-tts, sora-2): nothing live waits on those.
The database moves to Azure Database for PostgreSQL Flexible Server in South India (owner chose option a). Neon prod
stays as the rollback copy and keeps the test branches.
This workflow builds and rehearses. The **main loop does the cutover** after Wave 1 deploys. Nothing here touches
`taxila-web` (eastus2) or writes to Neon prod.

**Map:** §1 Inventory · §2 Gaps · §3 What was built · §4 Measured latency · §5 Cutover runbook · §6 Owner actions.
Work logs follow as appendices; scripts and earlier reports that cite the old numbers map as §3→App. A (plan),
§4→App. B (created resources), §5→App. C (spend), §6→App. D (Foundry twins), §7→App. E (port), §8→App. F (rehearse).

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
not pass the proxy. So the dump/restore has to run from inside Azure, as an ACA job (see App. A).

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

> **Correction (Provision, 2026-10-04, after the provider registered):** the southindia capabilities call now returns
> `restricted: Enabled`, reason "Subscriptions are restricted from provisioning in this region ... open a support
> request with Issue type 'Service and subscription limits'", and **no versions or SKUs**. The PUT for
> `taxila-sin-pg` fails with `ParameterOutOfRange: Version should be in: []`. The 11-18 list above was read before the
> provider registered and is not valid for this subscription. Central India reads `restricted: Disabled` with PG
> 11-18 and D2ds_v5/D4ds_v5 offered (n=1 read). Options for the main loop:
> 1. Owner files the support request (quota type "Service and subscription limits", PostgreSQL Flexible, South India,
>    GeneralPurpose D2ds_v5, PG 17). Then re-run `scripts/region/provision.mjs`. Nothing else changes.
> 2. Put the server in centralindia: a centralindia VNet + delegated /28, peered with `taxila-sin-vnet`, and the
>    private DNS zone linked to both. The cost is a Chennai-Pune hop on every query. The RTT is not measured, so
>    measure it before choosing this option.
> 3. Move the whole compute stack to centralindia instead. Foundry has no models we use there, but GlobalStandard
>    deployments on the southindia account can be called from any region.

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

## §3 What was built (2026-10-04)

Everything below exists and was exercised. Resource names in full: Appendix B. Spend: Appendix C.

| piece | state | where it is written up |
|---|---|---|
| RG `taxila-sin` (southindia): `taxila-sin-vnet` (subnets `aca` /23, `pg` /28), private DNS zone `taxila-sin.private.postgres.database.azure.com` (+ links `taxila-sin-vnet-link`, `taxila-cin-vnet-link`), `taxila-sin-logs`, ACA env `taxila-sin-env` (VNet, static outbound IP 20.235.16.222), identity `taxila-sin-pull` | **up** | App. B |
| `taxila-cin-vnet` (centralindia) peered both ways with `taxila-sin-vnet` (`sin-to-cin`, `cin-to-sin`) | **up** | App. F.1 |
| PostgreSQL **`taxila-cin-pg`** (centralindia, PG 17.11, D2ds_v5, 64 GB, private access only, public access Disabled, TLS ≥1.2 required, geo-backup on, pgcrypto allow-listed, database `taxila` collation `C` = Neon's sort order). Not in southindia: the subscription is **restricted** there (§2.5, `open-india-pg-southindia-restricted`). Decision `india-move-southindia-azure-pg-2026-10-04`; Neon offers no India region (`rj-neon-india-region`) | **up, holds a verified copy of prod** | App. F.1, F.2 |
| 17 Foundry twins on `taxila-ai-southindia` under the eastus2 names (+ pre-existing `taxila-mai-tx2-stream`). Realtime/live twins NOT deployed (pooled quota full) | **up** | App. D |
| Staging app **`taxila-sin-staging`** (prod image `aa263ce`, India env, India DB) | **running** (~$39/mo; delete after cutover) | App. F.3 |
| `server/endpoints.js`: per-lane account selection (`AZURE_OPENAI_ENDPOINT_<LANE>` + key); defaults identical to today. `server/db.js` / `server/conductor/sweep.js`: `DB_DRIVER=pg` path with verified TLS, no Neon import | **in tree**, swept into git by another session's checkpoint commits; gates green (tsc, vite build, `npm test` 1207 pass) | App. E.1, E.2 |
| `scripts/deploy-azure.mjs`: `--rg/--region/--env/--registry/--create/--set/--secret/--profile india/--db azure/--migrations-evidence`; defaults unchanged; India values in NEW secret names so `--rollback` stays one traffic PATCH | **in tree** | App. E.4 |
| `scripts/region/`: `survey.mjs`, `provision.mjs`, `foundry-si.mjs`, `pg-cin.mjs`, `db-copy.mjs` + `db-copy.sh`, `staging.mjs`, `latency.mjs` + `latency-job.mjs` (all idempotent; none prints a secret) | **in tree** | App. A-F |
| Neon → Azure copy, in-VNet job, one snapshot, per-table count + md5, sequences, migrations | **OK: 57/57 tables, 1,814 rows, 16/16 migrations, 90 s** (`india-db-copy-2026-10-04`) | App. F.2 |

Not built (outside this workflow's files): `scripts/migrate.mjs`, `infra/gate.mjs`, `infra/restore-drill.mjs` are
Neon-HTTP only; `server/forge/g2/azure-job.js` and `infra/eyes.mjs` hard-code eastus2; `taxilaforge` blob and `taxilacr`
stay in eastus2; the 4 query alerts are not cloned for an India app; no reverse-copy path (Azure PG → Neon) exists.

## §4 Measured latency (2026-10-04)

Method: `node scripts/region/latency.mjs --staging <url> --n 20 --lessons 20` (context node `india-latency-2026-10-04`)
runs `latency-job.mjs` as ACA jobs in `taxila-sin-env` (Chennai) and `taxila-env` (eastus2) concurrently, 12:20-12:55
UTC. First call per target dropped as cold; keep-alive after. p50 / p90 ms. Lessons ran against staging only (smoke
accounts, all deleted). Two arms on the same India app + India DB + image `aa263ce`: arm A = every model lane on
`taxila-ai-southindia`, arm B = every model lane on the eastus2 account (`staging.mjs --ai eastus2`).
Reports: `node_modules/.cache/india-move/latency-2026-10-04T12-32-32-766Z.json` (A), `...T12-41-10-567Z.json` (B).

| what | from Chennai | from eastus2 | n | delta that matters |
|---|---|---|---|---|
| `/api/health`, app in South India | 4 / 5 | 232 / 233 | 20 | |
| `/api/health`, app in eastus2 (prod) | 215 / 215 | 4 / 4 | 20 | **−211 ms per HTTP round trip** for an Indian user when the app is in India |
| DB per query: India app → `taxila-cin-pg` (Chennai → Pune) | 22 / 24 | | 25 | **+14 ms/query** vs today |
| DB per query: prod app → Neon us-east-1 | 8 / 9 | | 25 | (≈ +140 ms on a ~10-query turn, estimate) |
| `taxila-fast` TTFT, southindia account | 1227 / 1343 | 1461 / 1562 | 20 | **SI account +349 ms p50** even from India |
| `taxila-fast` TTFT, eastus2 account | 878 / 1107 | 602 / 764 | 20 | |
| live STT commit→final, `taxila-live-transcribe` (eastus2) | 753 / 914 | 499 / 530 | 20 | |
| live STT commit→final, `taxila-mai-tx2-stream` (MAI-Transcribe-2-Streaming, SI) | 68 / 75 | 260 / 282 | 20 | **−685 ms p50** (different model: quality vs gpt-live-transcribe not measured here) |
| lesson turn, arm A (SI AI) | 2046 / 3083 | 2260 / 2434 | 60 | |
| lesson turn, arm B (eastus2 AI) | **1562 / 2020** | — | 60 | **arm B −484 ms p50 / −1063 ms p90** vs arm A |
| lesson start, arm A / arm B | 1912 / 2071 · 1610 / 1814 | 2270 / 2657 · — | 20 | |

**Not measured:** a production lesson turn from India (it writes Neon prod; the Neon A/B branch was not used), so
"India app + India DB + eastus2 AI" vs "today's prod" end to end has no number yet. Neon Singapore from Chennai, and a
South India PG (none can exist), are also unmeasured. The US-sandbox TTFTs in App. D.1 prove only that twins answer.

Reading: compute in India wins every HTTP round trip; the southindia **Foundry account** loses on chat (GlobalStandard
on that account is not served faster for India); MAI streaming STT is the one AI lane that is clearly better in India.
Hence decision `india-ai-lanes-eastus2-2026-10-04`: cut over with arm B's lane placement.

## §5 Cutover runbook (main loop; exact order)

Shell vars used below: `SHA` = the gated Wave 1 commit already serving `taxila-web`; `EVID` = the report path printed by
`--check-migrations`; `SIN=https://taxila-web-sin.calmsmoke-60bec78e.southindia.azurecontainerapps.io` (the FQDN ARM
returns on create; confirm it). All `node` commands from `/home/user/Taxila` with `NODE_USE_ENV_PROXY=1`. Nothing in
this runbook has run against prod yet; steps marked **(unrehearsed)** need a dry pass first.

### 5.0 Preconditions (all must hold; T-1 day)

1. Wave 1 is deployed on `taxila-web` by `deploy-azure.mjs` (Multiple revision mode, so `--rollback` works) and its
   canary smoke passed.
2. Neon prod carries every migration of `SHA`:
   `node scripts/region/db-copy.mjs --check-migrations --target DATABASE_URL --sha $SHA` → `ok: true` (read-only).
3. Public URL decided (§6 item 4). Today users reach `taxila-web.nicebay-a0d3a12f.eastus2.azurecontainerapps.io`
   and there is **no custom domain**, so there is no DNS record to flip. With a domain: lower its TTL to 300 s now.
4. Rehearsal copy + India prod app (no user traffic yet):
   ```
   node scripts/region/db-copy.mjs --sha $SHA --replace                 # must print status OK
   node scripts/region/db-copy.mjs --check-migrations --sha $SHA        # → EVID
   node scripts/deploy-azure.mjs --app taxila-web-sin --rg taxila-sin --env taxila-sin-env --region southindia \
     --create --db azure --image-tag $SHA --migrations-evidence $EVID --dry-run     # read the plan
   node scripts/deploy-azure.mjs --app taxila-web-sin --rg taxila-sin --env taxila-sin-env --region southindia \
     --create --db azure --image-tag $SHA --migrations-evidence $EVID
   ```
   No `--profile india`: `--create` copies `taxila-web`'s env, so every model lane stays on the eastus2 account (arm B,
   §4). Move single lanes later with `--set AZURE_OPENAI_ENDPOINT_<LANE>=… --secret AZURE_OPENAI_API_KEY_<LANE>=…`
   only after a re-measure. Then run the 5.3 smoke against `$SIN`. Smoke accounts land in `taxila-cin-pg`; the final
   copy replaces them.
5. Run `latency.mjs --staging $SIN` once more; arm-B numbers within ±20 % of §4 or stop.
6. Pick the window at India's lowest traffic (proposal 02:00-02:30 IST = 20:30-21:00 UTC; traffic pattern not
   measured). Measured copy time: 90 s for a 54.8 MB dump; budget 15 min.

### 5.1 Freeze writes (T0) **(unrehearsed)**

```
-- Neon prod, branch main, database taxila (Neon SQL; owner-approved prod write)
ALTER DATABASE taxila SET default_transaction_read_only = on;
```
Then restart the serving `taxila-web` revision so pooled connections reopen read-only (ARM
`POST …/containerApps/taxila-web/revisions/<active>/restart?api-version=2024-03-01`), and suspend every scheduled ACA
job in `rg-raghavsharma1729-7190` that carries a `database-url` secret (list them with
`node scripts/region/survey.mjs`; re-enable them only in rollback R1). Check the freeze took:
`SELECT current_setting('default_transaction_read_only')` from a NEW session → `on`. From here, lesson writes on
`taxila-web` fail; that is the window. Rehearse this statement on a Neon branch first.

### 5.2 Final copy with verification

```
node scripts/region/db-copy.mjs --sha $SHA --replace            # status OK: every table count+md5, sequences, migrations
node scripts/region/db-copy.mjs --verify-only --sha $SHA        # OK again against the frozen live source
node scripts/region/db-copy.mjs --check-migrations --sha $SHA   # → new EVID (≤ 6 h old at deploy)
```
Any non-OK → rollback R1. Do not hand-patch rows.

### 5.3 Fresh revision on the India app + smoke

```
node scripts/deploy-azure.mjs --app taxila-web-sin --rg taxila-sin --env taxila-sin-env --region southindia \
  --db azure --image-tag $SHA --migrations-evidence $EVID                     # new revision, canary smoke, /api/health
node scripts/verify-release.mjs --live $SIN --only live-probes,prod-smoke   # 2/2, 11/11 probes
node scripts/prod-smoke.mjs $SIN text
node scripts/prod-smoke.mjs $SIN cascade
```
Plus the three voice routes that were red on staging under SI AI (App. F.3), each must be 200 with a smoke session:
`/api/tts`, `/api/voice/tts-stream`, `/api/realtime/token`. Any red → rollback R1.

### 5.4 Move users

Depends on §6 item 4 (no domain exists today):
- **Custom domain (recommended):** bind it to `taxila-web-sin` (ACA managed certificate), switch the CNAME from
  `taxila-web`'s FQDN to `taxila-web-sin`'s. Rollback = CNAME back (TTL 300).
- **No domain:** users hold the eastus2 FQDN, which cannot be re-pointed. The only moves are a redirect revision on
  `taxila-web` (code, not built) or Azure Front Door Standard (~$35/mo, an extra hop, latency not measured). Neither is
  ready; do not cut over on this branch without a decision.

Keep Neon prod **read-only** after the move: it is the frozen rollback copy, and read-only stops split-brain if any old
client still reaches `taxila-web`.

### 5.5 After the move (first 24 h)

- Re-measure from Chennai (`latency.mjs --staging $SIN --prod $SIN`, n ≥ 20): lesson turn p50/p90 vs §4 arm B.
- Watch 5xx and turn p90 (the four `taxila-*` query alerts are bound to `taxila-web`; clone them for `taxila-web-sin`
  or watch `taxila-sin-logs` by hand).
- Re-point `scripts/prod-smoke.mjs` and `tests/prod/lib.mjs` defaults to the new public URL (not this workflow's files).

### 5.6 Rollback

- **R1, before users move (5.1-5.3 fail):** `ALTER DATABASE taxila SET default_transaction_read_only = off;` on Neon
  prod, restart the `taxila-web` revision, re-enable the suspended jobs. Nothing is lost: no user wrote to Azure PG.
- **R2, after users move:** stop India writes first (set `taxila-web-sin` ingress `ipSecurityRestrictions` to deny all,
  or scale to 0), then: the writes made on `taxila-cin-pg` since 5.4 are **lost on rollback** unless copied back, and no
  tool copies Azure PG → Neon prod (`db-copy.mjs` refuses Neon prod as a target by design; building it needs owner
  approval). Then do R1 and flip the CNAME back. Decide before T0 how long R2 is acceptable (proposal: 24 h).
- `deploy-azure.mjs --app taxila-web-sin --rg taxila-sin --rollback` reverts a bad India revision without leaving India.

### 5.7 When to decommission eastus2 compute

All of: ≥ 7 days on India with no R2; India lesson turn p50 and p90 (n ≥ 20, from Chennai) at or below the pre-cutover
prod baseline; a restore drill of `taxila-cin-pg` passed (needs `infra/restore-drill.mjs` ported to pg); alerts
cloned. Then: scale `taxila-web` to 0, delete it a week later (image stays in `taxilacr`). **Keep** `taxila-env` (probe
jobs) and `taxila-forge-untrusted` / `forge-g2-runner` (Forge batch, gap G4), the eastus2 Foundry account (chat,
realtime, TTS, image lanes run there, §4), `taxilacr` and `taxilaforge`. Delete SI Foundry twins no lane uses
(`taxila-fast-bg`, `taxila-studio-sol` first) to give the pooled quota back. Neon prod: keep read-only ≥ 30 days, then
the owner decides (Neon deletes need owner approval). Delete `taxila-sin-staging` at cutover. If South India PG is
ever allowed, `provision.mjs` builds `taxila-sin-pg`, the same runbook (5.1-5.4 with `--target`) moves the data, and
`taxila-cin-pg` becomes the rollback copy.

## §6 Owner actions

| # | action | exact values | needed for |
|---|---|---|---|
| 1 | Quota increase (portal → Azure AI Foundry → Quotas; GlobalStandard; pools are subscription-wide) | `gpt-realtime-2.1` 10 → **20**; `gpt-realtime-2.1-mini` 30 → **60**; `gpt-live-1` 10 → **20**; `gpt-live-transcribe` 10 → **20**. Optional headroom: `gpt-5.6-luna` and `gpt-5.6-sol` 2000 → **3000**; `grok-4-1-fast-non-reasoning` and `DeepSeek-V4-Pro` 1000 → **1500** | Not the cutover (realtime stays on eastus2). Needed to *measure* SI realtime twins, and to unblock other workflows: 7 pools are full (App. D.1) |
| 2 | Azure support request, issue type "Service and subscription limits" | PostgreSQL Flexible Server, region South India, General Purpose Standard_D2ds_v5, PG 17 | Moves the DB from Pune to Chennai (−~20 ms/query, estimate); `open-india-pg-southindia-restricted` |
| 3 | Role assignment (needs Owner or User Access Administrator; the SP is only Contributor) | AcrPull on `taxilacr` to principal `25e26486-2c49-479e-8496-c9fb340b5913` (`taxila-sin-pull`) | India apps pull without the ACR admin password |
| 4 | Public URL | A custom domain (CNAME to the India app, ACA managed cert), or approve Front Door Standard (~$35/mo) | §5.4; `open-india-public-url`. Without it there is no cutover |
| 5 | Approve the prod freeze and the rollback policy | `ALTER DATABASE taxila SET default_transaction_read_only = on` on Neon prod for the window; R2 data-loss window (proposal 24 h) or a reverse-copy build | §5.1, §5.6 |

Auto-expiring leftovers (no action): Neon branch `india-ab-2026-10-04` (expires 2026-10-06 12:00 UTC); database
`dbcopy_rehearsal` on `restore-drill-2026-10-04` (expires 2026-10-05).

### Context nodes (proposed in `context/inbox/india-move.json`)

Decisions `india-move-southindia-azure-pg-2026-10-04`, `india-ai-lanes-eastus2-2026-10-04`; measurements
`india-latency-2026-10-04`, `india-db-copy-2026-10-04`; rejections `rj-centralindia-compute-home`,
`rj-neon-india-region`, `rj-southindia-account-chat-lanes`; open `open-india-pg-southindia-restricted`,
`open-india-public-url`.

---

## Appendix A · Plan (for the build step; the main loop owns cutover)

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

## Appendix B · Created resources (names only)

| date | name | type | region | by |
|---|---|---|---|---|
| 2026-10-04 | (provider registrations only) Microsoft.DBforPostgreSQL, Microsoft.Network | provider | subscription | Survey |
| 2026-10-04 | taxila-sin | resource group | southindia | Provision |
| 2026-10-04 | taxila-sin-vnet (10.60.0.0/16; subnet `aca` 10.60.0.0/23 → Microsoft.App/environments; subnet `pg` 10.60.2.0/28 → flexibleServers) | virtual network | southindia | Provision |
| 2026-10-04 | taxila-sin.private.postgres.database.azure.com + link taxila-sin-vnet-link | private DNS zone | global | Provision |
| 2026-10-04 | taxila-sin-logs (PerGB2018, 30 d) | Log Analytics workspace | southindia | Provision |
| 2026-10-04 | taxila-sin-env (workload profiles: Consumption; VNet-integrated, external ingress; static outbound IP 20.235.16.222) | ACA managed environment | southindia | Provision |
| 2026-10-04 | taxila-sin-pull | user-assigned managed identity (AcrPull role assignment FAILED, see below) | southindia | Provision |
| NOT CREATED | taxila-sin-pg (PG 17, D2ds_v5, 64 GB autogrow, 14 d backup, private only, TLS) | PostgreSQL Flexible | southindia | blocked: region restricted for subscription (§2.5) |

**Provision failures (2026-10-04):**
- **AcrPull on taxilacr for taxila-sin-pull → 403 AuthorizationFailed.** The SP is Contributor, and Contributor
  cannot write `Microsoft.Authorization/roleAssignments`. Fix: the owner (or anyone with User Access Administrator or
  Owner) assigns AcrPull on `taxilacr` to principal `25e26486-2c49-479e-8496-c9fb340b5913`. Until then, an app in
  `taxila-sin-env` can pull the way `taxila-web` does today, with the ACR admin user and the `acr-password` secret.
- **taxila-sin-pg was not created** (§2.5 correction). The admin creds `AZURE_PG_SIN_USER` and `AZURE_PG_SIN_PASSWORD`
  are already in `.env.local` and get reused on re-run. `AZURE_PG_SIN_HOST`, `_DATABASE` and `_URL` are added once
  the server exists. Once created, the script sets `azure.extensions=PGCRYPTO,UUID-OSSP,CITEXT,PG_STAT_STATEMENTS`
  (the migrations need only pgcrypto), `require_secure_transport=ON` and `ssl_min_protocol_version=TLSv1.2`, and
  creates database `taxila`.

Script: `scripts/region/provision.mjs` (safe to re-run; `--dry` checks only the providers). Machine report:
`node_modules/.cache/india-move/provision.json`.

Created by later steps (Provision AI, Port, Rehearse):

| date | name | type | region | by |
|---|---|---|---|---|
| 2026-10-04 | `taxila-ai-southindia` (REUSED, pre-existing AIServices S0; not created) | Cognitive Services account | southindia | Provision AI |
| 2026-10-04 | `taxila-fast` | Foundry deployment on `taxila-ai-southindia` | southindia | Provision AI (scripts/region/foundry-si.mjs) |
| 2026-10-04 | `taxila-brain` | Foundry deployment on `taxila-ai-southindia` | southindia | Provision AI (scripts/region/foundry-si.mjs) |
| 2026-10-04 | `grok-4-1-fast-non-reasoning` | Foundry deployment on `taxila-ai-southindia` | southindia | Provision AI (scripts/region/foundry-si.mjs) |
| 2026-10-04 | `DeepSeek-V4-Pro` | Foundry deployment on `taxila-ai-southindia` | southindia | Provision AI (scripts/region/foundry-si.mjs) |
| 2026-10-04 | `taxila-transcribe` | Foundry deployment on `taxila-ai-southindia` | southindia | Provision AI (scripts/region/foundry-si.mjs) |
| 2026-10-04 | `text-embedding-3-small` | Foundry deployment on `taxila-ai-southindia` | southindia | Provision AI (scripts/region/foundry-si.mjs) |
| 2026-10-04 | `taxila-gpt6` | Foundry deployment on `taxila-ai-southindia` | southindia | Provision AI (scripts/region/foundry-si.mjs) |
| 2026-10-04 | `taxila-gpt6-luna` | Foundry deployment on `taxila-ai-southindia` | southindia | Provision AI (scripts/region/foundry-si.mjs) |
| 2026-10-04 | `taxila-codex` | Foundry deployment on `taxila-ai-southindia` | southindia | Provision AI (scripts/region/foundry-si.mjs) |
| 2026-10-04 | `gpt-5.6-terra` | Foundry deployment on `taxila-ai-southindia` | southindia | Provision AI (scripts/region/foundry-si.mjs) |
| 2026-10-04 | `DeepSeek-V4-Flash` | Foundry deployment on `taxila-ai-southindia` | southindia | Provision AI (scripts/region/foundry-si.mjs) |
| 2026-10-04 | `grok-4-20-non-reasoning` | Foundry deployment on `taxila-ai-southindia` | southindia | Provision AI (scripts/region/foundry-si.mjs) |
| 2026-10-04 | `taxila-oss120` | Foundry deployment on `taxila-ai-southindia` | southindia | Provision AI (scripts/region/foundry-si.mjs) |
| 2026-10-04 | `taxila-flux2` | Foundry deployment on `taxila-ai-southindia` | southindia | Provision AI (scripts/region/foundry-si.mjs) |
| 2026-10-04 | `taxila-kontext` | Foundry deployment on `taxila-ai-southindia` | southindia | Provision AI (scripts/region/foundry-si.mjs) |
| 2026-10-04 | `taxila-fast-bg` | Foundry deployment on `taxila-ai-southindia` | southindia | Provision AI (scripts/region/foundry-si.mjs) |
| 2026-10-04 | `taxila-studio-sol` | Foundry deployment on `taxila-ai-southindia` | southindia | Provision AI (scripts/region/foundry-si.mjs) |
| 2026-10-04 | `taxila-sin-dbcopy` (created and DELETED by each `db-copy.mjs` run; 3 runs: 1 drill copy (auth failed), 2 migrations checks (1 TLS-check false negative, fixed; 1 OK)) | ACA job (Manual) in taxila-sin-env | southindia | Port |
| 2026-10-04 | `dbcopy_rehearsal` (empty database on Neon branch `restore-drill-2026-10-04`; it goes away when the branch expires 2026-10-05 08:00 UTC; not deleted by hand: Neon deletes need owner approval) | Neon database | aws-us-east-1 | Port |
| 2026-10-04 | `taxila-cin-vnet` (10.61.0.0/16; subnet `pg` 10.61.2.0/28 → flexibleServers) | virtual network | **centralindia** | Rehearse (scripts/region/pg-cin.mjs) |
| 2026-10-04 | peerings `sin-to-cin` (on taxila-sin-vnet) + `cin-to-sin` (on taxila-cin-vnet), both Connected | VNet peering (global) | southindia ↔ centralindia | Rehearse |
| 2026-10-04 | `taxila-cin-vnet-link` (link of zone taxila-sin.private.postgres.database.azure.com to taxila-cin-vnet) | private DNS link | global | Rehearse |
| 2026-10-04 | **`taxila-cin-pg`** (PG 17.11, GeneralPurpose Standard_D2ds_v5, 64 GB autogrow, 14 d backup, geo-redundant backup Enabled, public access Disabled, TLS required ≥1.2, pgcrypto allow-listed) + database `taxila` (UTF8, collation `C`) | PostgreSQL Flexible | **centralindia** (southindia is restricted, §2.5) | Rehearse |
| 2026-10-04 | `taxila-sin-dbcopy` (3 more runs, each deleted after: copy FAIL at verify (collation sort bug, fixed), copy FAIL (sort fix typo, fixed), copy `--replace` **OK**) | ACA job (Manual) | southindia | Rehearse |
| 2026-10-04 | **`taxila-sin-staging`** (image taxila-web:aa263ce, Multiple revision mode, 0.5 vCPU / 1 Gi, 1 replica, external ingress; secrets acr-password, azure-openai-key, storage-key, forge-g2-child-salt, azure-openai-key-sin, database-url-sin, azure-speech-key-sin) | Container App | southindia (taxila-sin-env) | Rehearse (scripts/region/staging.mjs). **Left running** |
| 2026-10-04 | `taxila-sin-latency`, `taxila-eus2-latency` (created and DELETED per run; 2 runs SI, 1 run eastus2) | ACA jobs (Manual) | southindia (taxila-sin-env), eastus2 (taxila-env) | Rehearse (scripts/region/latency.mjs) |
| 2026-10-04 | Neon branch `india-ab-2026-10-04` (`br-proud-lake-b7s2jtgy`, endpoint suspended, **expires 2026-10-06 12:00 UTC**). Created for an eastus2 A/B twin; UNUSED (the branch's role password differs from prod's and I did not pull a credential into the session) | Neon branch | aws-us-east-1 | Rehearse |

## Appendix C · Spend estimates (Azure retail, South India, read 2026-10-04 from prices.azure.com; monthly = 730 h)

| item | price | est. / month |
|---|---|---|
| PG Flexible General Purpose D2ds_v5 (2 vCore, 8 GiB) | $0.2784/h | **~$203** |
| ...same-zone HA standby (optional; no zone-redundant HA in SI) | +$0.2784/h | +$203 |
| ...Burstable B2ms alternative (not recommended: credits throttle under load) | $0.098/h | ~$72 |
| PG storage 64 GB + backup (backup up to 100% of storage free; above that $0.144/GB-mo) | storage meter not read | ~$8-10 (unverified) |
| ACA `taxila-web-si` 1 vCPU / 2 GiB, 1 replica always active | $0.000024/vCPU-s + $0.000003/GiB-s | ~$78 (less when idle) |
| ACA workload-profiles env, Consumption profile only | no env fee (Environment Management $0.151/h applies to Dedicated profiles) | $0 |
| Log Analytics taxila-sin-logs (PerGB2018, SI) | ~$2.76/GB ingested (retail, not read for SI) | ~$3-15 at expected volume (unmeasured) |
| Private DNS zone + VNet | VNet free; zone ~$0.50 | ~$1 |
| ACR Basic in SI (optional) | $0.1666/day | ~$5 |
| Foundry twins (GlobalStandard), 17 created 2026-10-04 | per token, same prices as eastus2. No fixed cost. Verification run cost < $1 (≈100 tiny chat/embed/STT calls + 2 images: FLUX.2-pro 512² ≈ $0.03, Kontext 1024² ≈ $0.04) | $0 fixed |
| DragonHD TTS (centralindia) | ~$22 / 1M chars (MODEL-ROUTER) | usage-based |
| `taxila-sin-dbcopy` job runs (1 vCPU / 2 GiB, ~1-3 min each; a full 101 MB copy estimated ~5-10 min) | ACA Consumption per second | < $0.05 per run (unmeasured bill; 3 runs so far) |
| **Rehearse, actual:** PG `taxila-cin-pg` D2ds_v5 in **centralindia** (2 vCore × $0.125/vCore-h, read 2026-10-04) | $0.25/h | **~$183/mo** (replaces the SI D2ds_v5 line above while SI is restricted) |
| ...backup storage beyond 100% of provisioned (centralindia LRS) | $0.095/GB-mo | ~$0 at 55 MB dump size |
| Global VNet peering SI ↔ CI (data both ways) | ~$0.035/GB (retail list, not read today) | < $1 at rehearsal volume |
| `taxila-sin-staging` 0.5 vCPU / 1 Gi, 1 replica always on | Consumption | ~$39/mo gross (≈ $1.30/day); delete when the rehearsal ends |
| Rehearse runs: 3 db-copy jobs + 3 latency jobs + ~110 staging lessons (≈440 model calls) + 60 TTFT + 60 transcription calls | per call / per second | **< $3 total** (estimate; not read from the bill) |
| **Fixed new spend** | | **~$290/mo** (~$495 with HA) |
| Rehearsal overlap | eastus2 stack keeps running until cutover | existing spend continues |

## Appendix D · Provision AI: South India Foundry twins (2026-10-04)

Script: `node scripts/region/foundry-si.mjs --deploy --verify --env` (idempotent ARM; copies model, version, format,
SKU, capacity, upgrade option and RAI policy `Microsoft.DefaultV2` from the live eastus2 deployment of the same
name; checks the SI usages row before every PUT and skips a twin that does not fit). Results JSON:
`node_modules/.cache/india-move/foundry-si-*.json`. Account: the existing `taxila-ai-southindia` (reused).
Nothing on the eastus2 account or `taxila-web` was changed.

**Env names added to .env.local (values not shown):** `AZURE_OPENAI_ENDPOINT_SIN` (`https://taxila-ai-southindia.openai.azure.com/openai/v1`),
`AZURE_OPENAI_API_KEY_SIN`, `AZURE_AI_SERVICES_ENDPOINT_SIN` (`https://taxila-ai-southindia.services.ai.azure.com`, for FLUX.2 and MAI),
`AZURE_SPEECH_REGION_SIN` (= `centralindia`), `AZURE_SPEECH_KEY_SIN` (the `taxila-ai-centralindia` key). South India serves
no Azure Speech, so the Speech/DragonHD lane for the India stack is Central India by design.

**Speech DragonHD, re-verified:** `en-IN-Diya`, `en-IN-Arjun`, `en-IN-Meera` `:DragonHDLatestNeural` on
`centralindia.tts.speech.microsoft.com` → 200 PCM each (n=1, from the US sandbox).

### D.1 Deployments and verification (TTFT from the US sandbox; NOT India latency)

Method: one SI call then one eastus2 call to the same deployment name, interleaved, n=3 pairs (images n=1, SI only).
Chat lanes use streamed chat completions (`reasoning_effort: none` on gpt-5.6/gpt-6), TTFT = first content delta. Codex
uses streamed Responses (effort low). Transcribe and embeddings are total time. MAI-Transcribe-2-Streaming is measured
from commit to transcript.completed on the realtime transcription socket. The sandbox sits in the US, so SI is expected
to be slower here; these numbers only prove each twin answers. The India comparison has to come from `taxila-probe-ci`.

| deployment | model | cap SI (= eastus2) | pooled quota after | verify | SI median ms (n) | eastus2 median ms (n) |
|---|---|---|---|---|---|---|
| taxila-fast | gpt-5.6-luna | 500 | 2000/2000 FULL | ok | 1521 TTFT (3) | 592 (3) |
| taxila-brain | gpt-5.6-sol | 500 | 2000/2000 FULL | ok | 1115 (3) | 979 (3) |
| grok-4-1-fast-non-reasoning | grok-4-1-fast-non-reasoning | 500 | 1000/1000 FULL | ok | 1505 (3) | 479 (3) |
| DeepSeek-V4-Pro | DeepSeek-V4-Pro | 500 | 1000/1000 FULL | ok | 1435 (3) | 792 (3) |
| taxila-transcribe | gpt-4o-transcribe | 100 | 100/400 (per region) | ok (404 for ~6 min after create) | 1311 total (3) | 472 (3) |
| text-embedding-3-small | text-embedding-3-small | 500 | 1000/2000 | ok (same propagation delay) | 734 total (3) | 169 (3) |
| taxila-gpt6 | gpt-6-sol | 500 | 1000/2000 | ok | 2339 (3) | 960 (3) |
| taxila-gpt6-luna | gpt-6-luna | 500 | 1000/2000 | ok | 1434 (3) | 983 (3) |
| taxila-codex | gpt-5.3-codex | 500 | 1000/3000 | ok | 2385 (3) | 1574 (3) |
| gpt-5.6-terra | gpt-5.6-terra | 1000 | 2000/2000 FULL | ok | 1785 (3) | 726 (3) |
| DeepSeek-V4-Flash | DeepSeek-V4-Flash | 125 | 250/250 FULL | ok | 832 (3) | 673 (3) |
| grok-4-20-non-reasoning | grok-4-20-non-reasoning | 500 | 1000/1000 FULL | ok | 1386 (3) | 297 (3) |
| taxila-oss120 | gpt-oss-120b | 200 | 400/5000 | ok | 1134 (3) | 739 (3) |
| taxila-flux2 | FLUX.2-pro | 4 | 4/4 (per region) | ok | 8644 total, 512² (1) | — |
| taxila-kontext | FLUX.1-Kontext-pro | 10 | 10/30 (per region) | ok | 9150 total, 1024² (1) | — |
| taxila-fast-bg | gpt-5.6-luna | 500 | 2000/2000 FULL | ok | 2945 (3) | 788 (3) |
| taxila-studio-sol | gpt-5.6-sol | 500 | 2000/2000 FULL | ok | 1337 (3) | 845 (3) |
| taxila-mai-tx2-stream | MAI-Transcribe-2-Streaming | 10 (pre-existing) | 10/10 | ok | 320 commit→final (3) | no eastus2 twin |
| taxila-realtime | gpt-realtime-2.1 | **NOT DEPLOYED** | 10/10 | quota | — | — |
| gpt-realtime-2.1-mini | gpt-realtime-2.1-mini | **NOT DEPLOYED** | 30/30 | quota | — | — |
| taxila-live | gpt-live-1 | **NOT DEPLOYED** | 10/10 | quota | — | — |
| taxila-live-transcribe | gpt-live-transcribe | **NOT DEPLOYED** | 10/10 | quota | — | — |

**Pooled quota is now full for gpt-5.6-luna, gpt-5.6-sol, gpt-5.6-terra, grok-4-1-fast-non-reasoning,
grok-4-20-non-reasoning, DeepSeek-V4-Pro and DeepSeek-V4-Flash** (eastus2 deployments + SI twins). Any other workflow
that tries to create or scale up one of these models in ANY region will now get a quota error until either a raise lands
or the main loop deletes the eastus2 copies at cutover. If that blocks a bench, the fix is to scale down
`taxila-fast-bg` / `taxila-studio-sol` (SI), which are background lanes. Do not touch the eastus2 copies.

### D.2 Quota requests for the owner (portal → Azure AI Foundry → Quotas, subscription of the grant)

| model | region | SKU | quota row | today | request | why |
|---|---|---|---|---|---|---|
| gpt-realtime-2.1 | southindia (pool is subscription-wide) | GlobalStandard | OpenAI.GlobalStandard.gpt-realtime-2.1 | 10 | **20** (+10) | `taxila-realtime` twin, cap 10 |
| gpt-realtime-2.1-mini | southindia | GlobalStandard | OpenAI.GlobalStandard.gpt-realtime-2.1-mini | 30 | **60** (+30) | `gpt-realtime-2.1-mini` twin, cap 30 |
| gpt-live-1 | southindia | GlobalStandard | OpenAI.GlobalStandard.gpt-live-1 | 10 | **20** (+10) | `taxila-live` twin, cap 10 |
| gpt-live-transcribe | southindia | GlobalStandard | OpenAI.GlobalStandard.gpt-live-transcribe | 10 | **20** (+10) | `taxila-live-transcribe` twin, cap 10 |
| optional headroom: gpt-5.6-luna, gpt-5.6-sol | southindia | GlobalStandard | OpenAI.GlobalStandard.gpt-5.6-{luna,sol} | 2000 | 3000 | the pools are full; benches need room |
| optional headroom: grok-4-1-fast-non-reasoning, DeepSeek-V4-Pro | southindia | GlobalStandard | AIServices.GlobalStandard.* | 1000 | 1500 | same |

After a raise lands, re-run `node scripts/region/foundry-si.mjs --deploy --verify --only 'realtime|live'`. It creates the four
missing twins under the same names. Realtime voice verification is not wired in the script yet (the live-transcribe
twin is verified through the transcription socket).


## Appendix E · Port: code that makes the move env-only (2026-10-04)

Nothing here touched `taxila-web` or wrote to Neon prod. Nothing was committed or pushed.

### E.1 Server: one endpoint config module

`server/endpoints.js` is now the only place the server picks an Azure account for a model lane. Every reader of
`AZURE_OPENAI_ENDPOINT` goes through it: `server/azure.js` (chat, realtime client secret, batch TTS),
`server/voice/speech.js` (streamed TTS, batch transcription), `server/routes/lesson.js` and `server/routes/voice.js`
(the `base` returned to the browser), `server/forge/g2/model.js` (Responses) and `server/forge/g2/safety.js` (Content
Safety host).

| lane | used by | India setting |
|---|---|---|
| CHAT | reply, classify, grade, reports, content (`chat()`) | primary (southindia) |
| REALTIME | `mintRealtimeSecret` for a voice session + its browser `base` | **eastus2** until the realtime quota raise (App. D.2); then southindia |
| TRANSCRIBE | the cascade transcription session (mint + `base`) and push-to-talk batch transcription | primary (`taxila-transcribe` twin exists) |
| TTS | gpt-4o-mini-tts batch and streamed | **eastus2** (not sold in southindia) |
| IMAGE | gpt-image-2 / sora (no server caller today) | **eastus2** |
| RESPONSES | Forge builder (`taxila-codex`) | primary |
| SAFETY | Azure AI Content Safety | primary. Checked: `contentsafety/text:analyze` returned 200 on `taxila-ai-southindia` (n=1, 2026-10-04) |

Env: `AZURE_OPENAI_ENDPOINT_<LANE>` + `AZURE_OPENAI_API_KEY_<LANE>`. **With none set, every lane resolves to exactly
`AZURE_OPENAI_ENDPOINT` + `AZURE_OPENAI_API_KEY`, so behaviour is unchanged.** A lane override on another host
without its own key throws a config error instead of sending one account's key to another. The realtime `base` always
comes from the same lane that minted the ephemeral key (`realtimeLane(session)`): a key minted on one account does not
open calls on the other. Speech (DragonHD) env is `AZURE_SPEECH_REGION` + `AZURE_SPEECH_KEY` (`speechConfig()`). No
server lane calls Speech yet.
The test is `tests/endpoints.test.mjs` (8 cases).

### E.2 Database driver

- `DB_DRIVER=pg` works with Azure Database for PostgreSQL and `sslmode=require`. pg 8.23 treats `require` as
  verify-full: it checks the certificate chain and the hostname against Node's CA store, which holds the DigiCert G2
  and Microsoft 2017 roots Azure PG presents.
- `server/db.js` now imports `@neondatabase/serverless` only on the non-pg path, and exports `pgPoolConfig()`. That
  function refuses `sslmode=disable/allow/prefer`.
- `server/conductor/sweep.js` (the nightly ops job's test-account sweep) used Neon HTTP unconditionally. Under
  `DB_DRIVER=pg` it now runs the same statements in one pg BEGIN/COMMIT.
- Measured locally against a TLS-only PostgreSQL 16 with a private CA, with a module hook that throws if
  `@neondatabase/serverless` is resolved:
  - `server/db.js` queries succeeded, and `pg_stat_ssl` reported TLSv1.3.
  - The sweep deleted 1 of 1 eligible test guardians and kept the young one.
  - With the CA not trusted, the connection was refused ("unable to verify the first certificate").
- **Not measured: no Azure PG server exists yet (§2.5).**
- Still Neon-HTTP-only, in files outside this workflow: `scripts/migrate.mjs`, `infra/gate.mjs` `migrationsGate`
  and `infra/restore-drill.mjs`. They cannot reach a private server anyway. `deploy-azure.mjs` takes migrations
  evidence from inside the VNet instead (App. E.4). Running `migrate.mjs` against Azure PG needs it ported to pg AND run
  from inside the VNet. The restored `schema_migrations` already carries the applied set.

### E.3 `scripts/region/db-copy.mjs` (+ `db-copy.sh`, the in-job half)

This is a one-off ACA job `taxila-sin-dbcopy` in `taxila-sin-env` (VNet), running image
`docker.io/library/postgres:17`. The script creates the job, starts it, reads the `DBCOPY_*` lines back from
`taxila-sin-logs`, and deletes the job and its secrets afterwards (`--keep-job` keeps them).

Modes:
- **copy** (the default) checks that the target has no public tables (`--replace` drops and recreates `public`).
  It then installs the source's extensions, runs `pg_dump -Fc -n public` with `--snapshot`, and runs `pg_restore`
  with `--single-transaction --exit-on-error`, then verifies.
- `--verify-only` compares only.
- `--check-migrations` reads the target only. Its report is what `deploy-azure.mjs --migrations-evidence` accepts.

Guarantees:
- **The source is read-only.** Every source session sets `default_transaction_read_only=on`. The dump and the source
  checksums share ONE exported snapshot, so they describe the same instant while prod keeps writing.
- **Target writes happen only in copy mode.** The verify and migrations sessions are read-only, and copy mode refuses
  the Neon prod host.
- **Verification** covers, per table, the row count plus an order-independent md5 of every row's text form (UTC, ISO
  DateStyle). It also compares sequence `last_value`s, checks that target `schema_migrations` covers db/migrations of
  `--sha`, and checks that the source and target migration sets are equal.
- **TLS** is verify-full against the roots embedded from Node's store (ISRG X1/X2, DigiCert Global Root CA/G2/G3,
  Microsoft RSA/ECC 2017), confirmed client-side with `\conninfo`. `pg_stat_ssl` reads `f` behind Neon's
  TLS-terminating proxy, so it is reported and not required.

Measured:
- **Local, PG16 with TLS (verify-full against a private CA), 57 tables from all 16 migrations, 500 guardians and 500
  children:**
  - copy OK: 57 of 57 tables matched, sequences matched, dump 0.17 MB, 3 s total.
  - A second copy without `--replace` was refused (`target_not_empty`).
  - After one row of the target was tampered with, verify flagged exactly `child`.
  - `--replace` copy was OK.
  - With the wrong CA: `connect_target` "certificate verify failed".
  - With 015 deliberately unrecorded, copy reported `missingMigrations: 015_open_now.sql` and `ok:false`.
- **In the VNet (taxila-sin-env, 2026-10-04):**
  - The image pulled, egress to Neon worked, and the result lines came back through Log Analytics. The job was
    deleted after every run.
  - **`--check-migrations --target DATABASE_URL` (Neon prod, read-only)** read client TLSv1.3 (verify-full) and
    server 17.11, with 13 migrations applied. Missing against HEAD 12219a9: `012_pending_grade.sql`,
    `013_reteach_resolution.sql`, `015_open_now.sql`. That agrees with `deploy-azure.mjs`'s own migrations gate from
    the sandbox (the default dry-run refused on the same three files). **Prod must have these applied (Wave 1)
    before the final copy, or the copy carries the same gap.**
  - **A copy rehearsal from branch `restore-drill-2026-10-04` into `dbcopy_rehearsal` failed at authentication.**
    The branch's `taxila_owner` password is not the one in `DATABASE_URL`. I did not pull a branch credential into
    the session. Plumbing up to and including TLS is proven, but **a real dump/restore of the 101 MB database inside
    Azure has NOT run yet.** It needs either the PG server (§2.5) or a branch URL in `.env.local`, for example
    `NEON_DRILL_URL`, then:
    `node scripts/region/db-copy.mjs --source NEON_DRILL_URL --target <throwaway> --allow-neon-target`.

Commands:
```
NODE_USE_ENV_PROXY=1 node scripts/region/db-copy.mjs --dry-run                       # plan only
NODE_USE_ENV_PROXY=1 node scripts/region/db-copy.mjs                                 # Neon prod → $AZURE_PG_SIN_URL, verify
NODE_USE_ENV_PROXY=1 node scripts/region/db-copy.mjs --replace                       # cutover: re-copy after the write freeze
NODE_USE_ENV_PROXY=1 node scripts/region/db-copy.mjs --check-migrations [--sha REV]  # deploy evidence
```
Reports go to `node_modules/.cache/india-move/db-copy-<mode>-<ts>.json`. They hold hosts, counts and checksums,
never a URL or password.

### E.4 `scripts/deploy-azure.mjs`

With no new flag, the deploy is unchanged. Re-checked with `--dry-run`: it reached the same gate as before, which
refused because prod lacks 012/013/015.

New flags:
- `--rg`, `--region` and `--env` are asserted against the app. `--registry` defaults to `taxilacr`.
- `--create [--create-from taxila-web]` creates a rehearsal app. It only READS taxila-web's env and secrets, and it
  refuses `taxila-web` as a target.
- `--set NAME=VALUE` and `--secret NAME=LOCALVAR` set env and secrets one by one.
- `--profile india` applies the E.1 table: the primary goes to `_SIN`, and TTS/IMAGE (plus REALTIME unless
  `--realtime-account southindia`) are pinned to eastus2. It also sets Speech from the `_SIN` vars and
  `TAXILA_REGION`.
- `--db azure` sets DATABASE_URL from `$AZURE_PG_SIN_URL`.
- `--migrations-evidence FILE` is required when the target DB is a private `*.postgres.database.azure.com`. The file
  must be a db-copy report for the same host, at most 6 h old, covering every migration of the sha.
- **Rollback-safe secrets:** the India values go into NEW secret names (`azure-openai-key-sin`,
  `azure-speech-key-sin`, `database-url-sin`). An app-scoped secret change therefore never alters what the previous
  revision reads, and `--rollback` stays one traffic PATCH back to eastus2 and Neon.
- **Lane check before any write:** every DEPLOY_* name (and every code default) must exist on the account its lane
  resolves to. Checked with dry-runs:
  - `--profile india` passed (11 names).
  - `--realtime-account southindia` was refused (`taxila-realtime`, `gpt-realtime-2.1-mini` not deployed on
    taxila-ai-southindia). This is the quota gap in App. D.2.
- The post-deploy `/api/health` serving check and the canary smoke are unchanged.

Rehearsal app (not created yet: it needs the PG server for `--db azure`. Without `--db azure` it would run against
Neon prod from India, which is a valid latency rehearsal but writes prod through the smoke):
```
NODE_USE_ENV_PROXY=1 node scripts/region/db-copy.mjs --check-migrations > /dev/null   # → report path
NODE_USE_ENV_PROXY=1 node scripts/deploy-azure.mjs --app taxila-web-si --rg taxila-sin --env taxila-sin-env \
  --region southindia --create --profile india --db azure --migrations-evidence <report> [--gate | --image-tag SHA]
```
Planned dry-run (verified 2026-10-04): lane check OK, then "create taxila-web-si in taxila-sin/taxila-sin-env".
The app pulls from `taxilacr` with the copied `acr-password` (the AcrPull grant for `taxila-sin-pull` is still
pending, App. B).

### E.5 Cutover outline (main loop) — superseded by §5

1. Wave 1 deployed, and prod has every migration applied.
2. PG server exists. A rehearsal `db-copy.mjs` run is OK, and `taxila-web-si` passes the smoke and the
   `taxila-probe-ci` latency comparison.
3. Freeze writes, then run `db-copy.mjs --replace` (OK required), then `--check-migrations`.
4. Run `deploy-azure.mjs --profile india --db azure --migrations-evidence …` on the India app, then move DNS.
5. Rollback is DNS back to taxila-web (eastus2, Neon). Neon prod has not been written since the freeze, so any India
   writes after the cutover are lost on rollback unless they are copied back. Decide the window before cutting over.

## Appendix F · Rehearse (2026-10-04): copy, staging, smoke, latency from India

Nothing here touched `taxila-web` (it was only READ: its template, and `listSecrets` to copy the ACR password, storage
key and salt) or wrote to Neon prod (the copy reads it inside one read-only snapshot). Nothing committed or pushed.

### F.1 Database: Azure PG lives in Central India for now

South India still answers `restricted: Enabled` for PostgreSQL Flexible (re-read 2026-10-04 12:00 UTC). So the
rehearsal took §2.5 option 2: `scripts/region/pg-cin.mjs` built `taxila-cin-pg` in **centralindia**, private access
only, in `taxila-cin-vnet`, peered both ways with `taxila-sin-vnet`, and linked the existing private DNS zone to both.
The India-stack URL is in `.env.local` as `AZURE_PG_SIN_URL` (name kept so `deploy-azure.mjs --db azure` and
`db-copy.mjs` need no change; the comment above it says the server is in centralindia). When the SI restriction is
lifted (owner support request, §2.5 option 1), `scripts/region/provision.mjs` builds `taxila-sin-pg` and the same
copy moves the data again; `taxila-cin-pg` then becomes the geo/rollback copy or is deleted.

**Collation.** Neon prod's database is `C.UTF-8` (builtin provider). The first Azure database was `en_US.utf8`,
which would silently reorder every text `ORDER BY` after the move. Recreated as collation `C` (ARM refuses
`C.UTF-8`: 400 InvalidParameterValue). `C` sorts by code point exactly like `C.UTF-8`; the ctype differs only for
non-ASCII `upper()/lower()` (no measured caller). The same mismatch broke the copy's own verification (lists
sorted by each side's collation compared unequal), so every text sort in `db-copy.sh` is now `COLLATE "C"`.

### F.2 Copy Neon prod → taxila-cin-pg (ACA job inside the VNet)

`node scripts/region/db-copy.mjs --sha aa263ce --replace`, 2026-10-04 12:13 UTC
(report `node_modules/.cache/india-move/db-copy-copy-2026-10-04T12-13-23-961Z.json`):

| check | result |
|---|---|
| status | **OK** (job Succeeded, 90 s end to end in the job) |
| dump / restore | 54.8 MB custom-format dump in 46 s, restore 14 s (`--single-transaction --exit-on-error`) |
| tables | **57 / 57 match** on row count AND order-independent md5 of every row (1,814 rows total; largest: audit 950, asset_cache 497, turn 134) |
| sequences | all `last_value`s match |
| migrations | source = target = 16 (prod now carries 012/013/015: Wave 1 applied them since the App. E.3 check); none missing vs aa263ce (13) |
| snapshot | dump and source checksums from ONE exported snapshot |
| TLS | target TLSv1.3, server-side `pg_stat_ssl` = t, verify-full against DigiCert/Microsoft roots; source TLSv1.3 client-verified (Neon proxy terminates TLS, so its `pg_stat_ssl` reads f) |
| PG versions | 17.11 → 17.11 |

### F.3 Staging app `taxila-sin-staging`

`node scripts/region/staging.mjs` (not `deploy-azure.mjs --create`, which correctly refuses `aa263ce`: that image
has no gate stamp; staging reuses the exact image production runs, so no unreviewed code ships).
URL: `https://taxila-sin-staging.calmsmoke-60bec78e.southindia.azurecontainerapps.io`.
Env = taxila-web's, minus the Neon `database-url` secret (never copied), plus: `AZURE_OPENAI_ENDPOINT` =
taxila-ai-southindia, `DATABASE_URL` ← `database-url-sin` (taxila-cin-pg), `AZURE_OPENAI_ENDPOINT_{TTS,IMAGE,REALTIME}`
= eastus2 with their keys (for images that contain server/endpoints.js), Speech = centralindia, `TAXILA_REGION`,
`TAXILA_STAGING=1`. Same size as prod (0.5 vCPU / 1 Gi) so the A/B compares like with like. It shares prod's
`taxilaforge` storage account (asset cache writes are content-addressed). `--ai eastus2` flips every model lane to
the eastus2 account (the A/B arm below); the script deactivates superseded revisions.

| gate (against staging, SI AI config) | result |
|---|---|
| `verify-release.mjs --live <staging> --only live-probes,prod-smoke` | **2/2 pass** (11/11 probes; health, DB reach, app shell, 6 auth fences, JSON 404) |
| `prod-smoke.mjs <staging> text` | **PASS** (start, 3 turns, end; floor predicate clean; account deleted) — run 3 times |
| `prod-smoke.mjs <staging> cascade` | **PASS** — but this smoke never calls TTS (the reply audio is a separate request) |
| `/api/tts` (text-mode voice), `/api/voice/tts-stream` (cascade voice) | **RED: 502 "speech service unavailable"** |
| `/api/realtime/token` (voice lane) | **RED: 500** |
| `/api/voice/stt-token` | 200 |

**Why the voice lanes are red, and why no config fixes them on this image:** `aa263ce` predates
`server/endpoints.js`: it sends EVERY lane to `AZURE_OPENAI_ENDPOINT`. South India does not sell gpt-4o-mini-tts, and
`taxila-realtime` is not deployed there (quota, App. D.2). The per-lane overrides are already set on staging; the first
image that contains `server/endpoints.js` turns them green with no config change. Proof that config is not the
problem: with `--ai eastus2` the same image on the same India app/DB returned `/api/tts` 200 (185 KB mp3),
`tts-stream` 200 (480 KB PCM), `realtime/token` 200 (n=1 each).
Staging is left on the requested SI-AI config.

### F.4 Latency from an India vantage point (ACA jobs, 2026-10-04 12:20-12:55 UTC)

`node scripts/region/latency.mjs --staging <url> --n 20 --lessons 20` runs `latency-job.mjs` (node:22) as a job in
`taxila-sin-env` (Chennai) and in `taxila-env` (eastus2) at the same time. First call per target is dropped (cold);
keep-alive connections after that, like a browser. p50/p90 in ms. Production is only READ (`/api/health`,
`/api/health?db=1`); lessons run against staging only (smoke accounts, all deleted: 0 left).
Reports: `node_modules/.cache/india-move/latency-2026-10-04T12-32-32-766Z.json` (arm A) and
`latency-2026-10-04T12-41-10-567Z.json` (arm B).

| metric | from South India | from eastus2 | n |
|---|---|---|---|
| `/api/health` staging (SI) | **4 / 5** | 232 / 233 | 20 |
| `/api/health` prod (eastus2) | **215 / 215** | 4 / 4 | 20 |
| → network RTT India ↔ eastus2 per HTTP round trip | **≈ 211 ms** | | |
| DB per query, staging app → taxila-cin-pg (Chennai → Pune) | 22 / 24 | | 25 |
| DB per query, prod app → Neon us-east-1 | 8 / 9 | | 25 |
| taxila-fast TTFT, **southindia account** | 1227 / 1343 | 1461 / 1562 | 20 |
| taxila-fast TTFT, **eastus2 account** | **878 / 1107** | 602 / 764 | 20 |
| live STT commit→final: `taxila-live-transcribe` (eastus2; no SI twin, quota) | 753 / 914 | 499 / 530 | 20 |
| live STT commit→final: `taxila-mai-tx2-stream` (MAI-Transcribe-2-Streaming, SI) | **68 / 75** | 260 / 282 | 20 |
| live STT socket open, eastus2 / SI account | 1003 / 1111 vs **111 / 167** | 67 / 139 vs 902 / 975 | 20 |
| batch STT `taxila-transcribe` total, SI / eastus2 | 750 / 2132 vs 2203 / 2249 | 2604 / 2893 (1×404) vs 332 / 365 | 20 |
| **staging lesson start, arm A (SI AI)** | 1912 / 2071 | 2270 / 2657 | 20 |
| **staging lesson turn, arm A (SI AI)** | **2046 / 3083** | 2260 / 2434 | 60 |
| staging lesson start, arm B (India app + India DB, **eastus2 AI**) | 1610 / 1814 | — | 20 |
| **staging lesson turn, arm B (eastus2 AI)** | **1562 / 2020** | — | 60 |

What the numbers say (measured, n as stated):
1. **The southindia Foundry account is slower than eastus2 for gpt-5.6-luna, even from India**: TTFT +349 ms p50
   from Chennai (1227 vs 878). Subtracting the ~211 ms RTT, SI-account processing is ~560 ms slower than eastus2.
   GlobalStandard on the SI account does not mean "served in India". End to end, India compute with **eastus2 AI
   beats SI AI by 484 ms p50 / 1063 ms p90 per lesson turn** (1562/2020 vs 2046/3083). For the chat lanes, keep the
   eastus2 account (or bake off SI DataZoneStandard, §2.1) until a re-measure says otherwise.
2. **Live transcription is the big India win**: MAI-Transcribe-2-Streaming on the SI account finalises 68 ms after
   commit from Chennai, vs 753 ms for gpt-live-transcribe on eastus2 (and its socket opens in 111 vs 1003 ms). The
   STT lane belongs in India.
3. Each HTTP round trip from India to the app saves ~211 ms when the app is in India.
4. Central India PG costs 22 ms per query from the SI app, vs 8 ms for prod → Neon today. A turn that runs ~10
   sequential queries pays ~140 ms more than prod. A South India PG (support request) would be ~1-2 ms
   (not measured: none exists).
5. **Missing: a production lesson turn from India.** Not measured, because a lesson against prod writes Neon prod.
   An eastus2 twin on a Neon branch was prepared (`india-ab-2026-10-04`) but not used (its role password differs
   from prod's; not pulled into the session). `taxila-web` (aa263ce) writes no access log, so its server-side turn
   time could not be read from Log Analytics either.

### F.5 Still red / open

- Voice lanes on staging (TTS, realtime) with SI AI: code-bound to aa263ce (App. F.3). Green on the first image that
  contains `server/endpoints.js`, or now with `--ai eastus2`.
- PG in South India: subscription restriction (support request). Central India works but costs +14 ms/query vs today.
- Chat on the SI account is measurably slower (App. F.4, point 1). The `--profile india` preset in `deploy-azure.mjs` points
  the primary/CHAT lane at SI. Revisit that before cutover: the measured best per lane is CHAT/TTS/REALTIME on eastus2,
  TRANSCRIBE on SI (MAI-Transcribe-2).
- Realtime/live quota raise (App. D.2), and AcrPull for `taxila-sin-pull` (App. B) are still owner actions.
- `scripts/migrate.mjs` and `infra/gate.mjs` are still Neon-only (App. E.2).
