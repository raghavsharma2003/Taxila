# Model scout 2026-10-04: challengers per use case (synthesis)

Synthesis of the four scout workstreams run on 2026-10-04 (scout, images, speech, text-build) against today's
primaries. Sources: `docs/research/models/SCOUT-2026-10-04.md`, `evals/model-scout-2026-10-04/{images,speech,text-build}/results/`,
`evals/model-refresh-2026-10-04/scout/results/`. No new model calls were made for this synthesis (spend USD 0).

**Coordination with the refresh bench.** `evals/model-refresh-2026-10-04/ROUTER-CHANGES.md` did not exist when this
was written. To avoid a second, conflicting routing table, the "today's primary" column below is MODEL-ROUTER §1 as
amended by the refresh bench's own proposals (`context/inbox/model-refresh-text-lanes.json`, merged
`model-refresh-studio`, `image-default-flare-low-2026-10-04`). This file only adds scout arms; it does not re-rank the
refresh arms (gpt-6 family, DeepSeek V4/V4.1, Kimi, MAI-Transcribe, gpt-image-2.5, FLUX.2-flex, orchestrator). When
ROUTER-CHANGES.md lands, this file is its addendum: "scout arms that beat or tie a primary".

**Switch rule used here** (same as `SCOUT-PROCEDURE.md`): a challenger *beats* a primary only with non-overlapping
80% Wilson intervals on the lane's pass metric (or a judge CI that excludes 0); otherwise it *ties*, and a tie is
broken by latency then cost. A model that would speak to a child must also pass the floor probe. Wilson intervals
below are computed with Z = 1.2816 (same `wilson()` as `evals/model-refresh-2026-10-04/studio/analyze-lib.mjs`).

## Headline

**No scout challenger beats or ties-and-wins against any primary today.** Two things stop the AWS half from being a
real test: Bedrock per-model tokens/day quotas are 0 and not adjustable through the API (ap-south-1 and us-east-1), and
Kimi K3 and grok-4.7 return 403 "not available for this account" (measured 2026-10-04, about 12:00-12:35 UTC). Every
AWS model that *could* be called (Transcribe, Polly) lost on a measured metric. The only Azure scout arms measured
(MAI-Image-2.6-Flash, MAI-Image-2.6, MAI-Image-2.5-Pro, MAI-Thinking-1) tie on some quality metric but lose the
tie-break or the delivery/latency gate.

## Per use case

| use case | today's primary | scout challenger (measured) | result vs primary (n, method, 2026-10-04) | verdict | platform / India region | cost | needs AWS path? |
|---|---|---|---|---|---|---|---|
| Live teacher reply | `taxila-fast` (refresh proposes gpt-6-luna / gpt-6-sol, gated) | MAI-Thinking-1 | T n=20, 3 blind judges re-scoring the refresh replies together: +0.36 [80% CI 0.07, 0.64] vs fast (beats fast on quality, below gpt-6-sol +0.72); TTFT p50 21.4 s vs 0.71 s; 1/20 romance-register floor hit ("meri jaan") | **loses** (latency gate, floor hit, 100x cost, retires 2026-11-04) | Azure southindia (Preview) | $8.12 / 1k replies vs $0.08 | no |
| Live teacher reply | same | Kimi K3, grok-4.7, Nova 2 Lite (Bedrock) | not callable: 403 per-account (Kimi, grok), 429 tokens/day = 0 (Nova) | untestable | AWS ap-south-1 (sold by AWS) | Kimi $3.30/$16.50, grok $2.20/$6.60 per 1M [V] | yes |
| Premium speech-to-speech | `taxila-realtime` (gpt-realtime-2.1), 776 ms first audio | gpt-live-1 | not deployable: southindia quota 0 | untestable | Azure southindia | $3/h [V] | no |
| Premium speech-to-speech | same | Nova 2 Sonic | concurrency quota 0, not adjustable; us-east-1 only | untestable; adds ~200-250 ms each way from India [estimate, not measured] | AWS us-east-1 only (no India region) | per 1k tokens: speech in $0.003, out $0.012 [V] | yes |
| Live child STT | `taxila-live-transcribe` D4 (fallback Azure RT LID R4) | Amazon Transcribe, best mode (multi-language ID) | n=180 synthetic clips, stt-hinglish v2 scorer: answers 64/78 [0.76, 0.87] vs R4 74/78 [0.91, 0.97] and D4 76/78 [0.94, 0.99]; final text 2.28 s vs 0.88 / 1.32 s | **loses** (non-overlapping vs both) | AWS ap-south-1 | $0.60/h vs $1.02/h | yes |
| Cascade TTS | DragonHD Diya | Polly Kajal generative / neural | AI judge (weak instrument), 5 lines x 2: humanlike 4.50 / 4.10 vs Diya 4.50 / 4.11 (tie); pairwise 0 wins of 40 votes, 33 ties; owner blind A/B already overrules this judge | **ties on the judge, loses on pairwise**; one female voice only, no Mumbai generative engine | AWS us-east-1 (generative), ap-south-1 (neural) | $30 / $16 per 1M chars | yes |
| Answer classification | `taxila-fast` (refresh: mistral-m35 40/40 on real classify()) | MAI-Thinking-1 | C n=40: 40/40 [0.96, 1.00] ties; p50 6.5 s vs 0.99 s; no JSON modes | **tie, loses tie-break** (latency, $2.69 vs $0.07 per 1k) | Azure southindia | see left | no |
| Distress / safety | predicate floor + `taxila-fast` | MAI-Thinking-1 | S+S2 16/16 each, 0 false alarms; but within production's 4 s cut 2/16 [0.05, 0.27] vs fast 16/16 [0.91, 1.00] | **loses** (non-overlapping at the production cut) | Azure southindia | - | no |
| Distress / safety | same | gpt-oss-safeguard-120b / -20b | 429 tokens/day = 0 | untestable | AWS ap-south-1 (sold by AWS) | $0.18 / $0.71 per 1M [V] | yes |
| Studio build (game/sim code) | race gpt-6-sol + gpt-5.6-terra + gpt-6-luna (refresh) | MAI-Thinking-1 | fraction_game n=5: 5/5 after repairs [0.75, 1.00] ties gpt6-luna-low 5/5; time to playable p50 102 s vs 22.7 s; within 75 s 0/5 [0.00, 0.25] | **tie on pass, loses tie-break** | Azure southindia | $0.072 vs $0.0011 per passed build | no |
| Studio build | same | mai-code-1.1-flash; Qwen3-coder, GLM-5 (Bedrock) | mai-code: MAI quota tier blocks deploy; Bedrock 429 | untestable | Azure / AWS | - | Bedrock arms: yes |
| Labelled diagrams (offline, human label check) | `taxila-image` gpt-image-2 medium (default now flare-low per `image-default-flare-low-2026-10-04`) | MAI-Image-2.6-Flash | eye check n=8 delivered diagrams: 6/8 [0.52, 0.89] vs 10/10 [0.86, 1.00] (overlap); labels 30/34 [0.79, 0.94] vs 44/44 [0.96, 1.00] (**non-overlapping**); delivered 16/20 [0.66, 0.89] vs 20/20 [0.92, 1.00] (**non-overlapping**) | **loses** on labels and filter refusals | Azure southindia (Preview) | $0.0197 vs $0.053 | no |
| Labelled diagrams | same | MAI-Image-2.6 | labels 34/34 [0.95, 1.00] ties; diagrams 6/8 (circuits wired to the bulb glass); delivered 16/20 | **loses** on delivery (non-overlapping) | Azure southindia (Preview) | $0.0396 | no |
| Text-free illustrations | flare-low default (`image-default-flare-low-2026-10-04`); router §1 listed FLUX.2-pro | MAI-Image-2.6-Flash | pictures 8/8 [0.83, 1.00] ties gpt-image-2 10/10; 16.6 s p50, but 4/20 requests refused (courtyard prompt 7/7 across MAI) | **tie on quality; no tie-break win** against the flare default: the refresh run log shows flare-low at roughly 13-16 s and ~$0.007 per image (indicative, refresh-bench rows, not re-scored here) | Azure southindia (Preview; Early Access status unconfirmed) | $0.0197 | no |
| Any image | - | MAI-Image-2.5-Pro, FLUX.2-pro (labels) | diagrams 5/8 and 0/10 | rejected | Azure | $0.109 / $0.030 | no |
| Images on AWS | - | Nova Canvas, Stability SD3.5 / Core / Ultra | Nova Canvas in none of 7 regions; Stability us-west-2 only, Marketplace agreement not accepted, quota 0 | unavailable | AWS us-west-2 only | - | yes |
| Rerank / embeddings / homework OCR | text-embedding-3-small; no reranker; `taxila-brain` OCR | Cohere-rerank-v4.0-pro, Cohere-Embed-V5-Fast, Cohere-parse-v5 | not benched | unmeasured queue (Azure, no AWS needed) | Azure | parse-v5 $1.50 / 1k pages [V] | no |

[V] = vendor list price, not measured. Latency for Azure arms was timed from a US container; India-hosted numbers are
not measured yet.

## What adopting any AWS model would add

This is the cost of the AWS path even after a model wins; it counts in the tie-break and must be stated in any switch
proposal.

1. **A second cloud in the live path.** Taxila web runs on Azure Container Apps (target southindia per
   `owner-india-region-2026-10-04`); a Bedrock call goes Azure Chennai -> AWS Mumbai over the public internet. The
   added round-trip has NOT been measured from an India host; measure it (one Container Apps job in southindia calling
   ap-south-1) before any live-lane proposal.
2. **SDK / signing.** Either `@aws-sdk/client-bedrock-runtime` as a new server dependency, or the dependency-free
   SigV4 + event-stream adapter `evals/model-scout-2026-10-04/text-build/bedrock.mjs` promoted into `server/`. Its
   reply parsing has never seen a successful Bedrock stream (unverified).
3. **Credentials in the Container App.** A least-privilege IAM user or role (`bedrock:InvokeModel*` on named model ARNs
   only, never the admin `claude-taxila` user) stored as an ACA secret. Known trap: Node env loaders that do not
   override keep the container's placeholder `AWS_*` values (`rj-node-env-loader-aws-placeholders`).
4. **Egress and billing.** Text payloads are small, so Azure internet egress is negligible for text lanes; audio lanes
   (Transcribe, Nova Sonic) stream about 0.1 MB per minute of 16 kHz mono PCM per direction (estimate). Credits:
   AWS-sold Bedrock models are credit-eligible; Marketplace sellers (OpenAI, Anthropic, Cohere, Stability) only under
   Activate terms s1.2 (`scout-2026-10-04-aws-credit-eligibility`). Check the first bill.
5. **Safety parity.** Bedrock has no Azure content filter. Today the distress check treats an Azure filter block on a
   self-harm turn as a signal (`open-distress-check-fails-open-on-filter`). A Bedrock arm in any child-facing lane must
   re-run S/S2 and the floor probe P with that signal absent, and Bedrock Guardrails is not a substitute for the
   `floorViolations` predicate (safety by predicate, not instruction).
6. **Operations.** A second quota system (per-model tokens/day, currently 0), second logs (CloudTrail / CloudWatch), a
   second budget alarm (the existing $100/month alarm from `aws-setup-2026-10-03`).

## Spend for the scout workflow (list-price estimates; billing lags 24-48 h)

| workstream | Azure (cap 30) | AWS (cap 60) |
|---|---|---|
| scout (catalogue, MAI-Image, Transcribe hi/en) | ~$1.0 | ~$0.65 |
| images | ~$7.40 | $0 |
| speech | <= ~$2.50 | ~$0.70 |
| text-build | ~$5.5 | $0 |
| synthesis (this file) | $0 | $0 |
| **total** | **~$16.4** | **~$1.35** |

## Context nodes

Proposed in `context/inbox/model-scout-synthesis.json`:

- `owner-aws-credit-funded-india-first-2026-10-04` (decision): the owner directive itself.
- `scout-synthesis-no-challenger-2026-10-04` (decision): no scout arm switches a lane today; queue below.
- `scout-synthesis-tally-2026-10-04` (measurement): the per-lane tally above, with the Wilson intervals.
- `rj-mai-image-flash-for-labels` (rejection): MAI-Image-2.6-Flash for labelled diagrams.
- `open-bedrock-quota-and-enablement` (open): the Bedrock quota and per-account enablement blocker.
- `weekly-model-scout` (decision): the standing procedure in `docs/research/models/SCOUT-PROCEDURE.md`.

## Queue: first runs once access opens (owner actions in brackets)

1. Bedrock text arms (Kimi K3, grok-4.7, Nova 2 Lite, gpt-oss-safeguard-120b) on T, TP, C, S, S2, P, W2 and Studio
   via `bench-mai.mjs BR=... TAG=-bedrock` and `studio-run.mjs --arms br:...` [support case: per-model tokens/day in
   ap-south-1; Sales enablement for Kimi K3 and grok-4.7].
2. gpt-live-1 against `taxila-realtime` on first audio from India and the floor probe [southindia quota].
3. Nova 2 Sonic: safety battery, first audio from India, Hinglish quality [us-east-1 concurrency quota].
4. Cohere-rerank-v4.0-pro, Cohere-parse-v5 (Azure, no blocker).
5. MAI-Image-2.6-Flash on 20 house-style prompts, blind human comparison against flare-low (not gpt-image-2, which is
   no longer the default) [confirm Early Access vs standard Preview first].
