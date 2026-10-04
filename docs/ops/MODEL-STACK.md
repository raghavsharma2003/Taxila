# MODEL-STACK: which model runs each use case at each stage, with its cost and latency (2026-10-04)

**The owner's question:** "For which use case and stage are we using what model, and why? And what are the
per-minute and per-hour cost and latency?"

**How this doc was made.** It is a synthesis only. No model was called to write it, and nothing in `server/` or
`src/` was changed. Sources are named inline. Two rules for the numbers:
- A **[M]** number was measured and comes from the cited file.
- An **[estimate]** shows its arithmetic.

Prices are Azure retail (`evals/model-refresh-2026-10-04/setup/results/prices-2026-10-04.json`, pulled from
prices.azure.com on 2026-10-04). Each price cites the first 8 characters of its meter ID. ₹88 = $1 throughout.

**Owner decisions this doc applies:**
1. Cascade voice is the default: STT → text LLM → TTS. No speech-to-speech model is the default.
   - `gpt-live-1` is dropped. Its meter is "Live 1 Gl Unit" at **$3/h** (`1c6d7ed2`; `owner-drop-gpt-live-1-2026-10-04`).
2. Azure first. AWS is used only where it is clearly better.
   - No AWS model won anywhere (`speech-aws-none-adopted-2026-10-04`, `bedrock-text-build-none-adopted-2026-10-04`).
3. Images: `gpt-image-2.5-flare` at **low** quality is the default. `gpt-image-2` **medium** is used for a labelled
   diagram only when flare gets a label wrong.
4. Live STT in the India app: `MAI-Transcribe-2-Streaming` is the primary, with `gpt-live-transcribe` as the fallback
   (`stt-mai2-stream-primary-india-2026-10-04`).
5. The voice (TTS) is not chosen yet.
   - DragonHD Diya is the current candidate. No tested Azure voice passed as a human teacher
     (`voice-blind-none-human-2026-10-04`).
   - A new voice search is running. The TTS rows below price DragonHD, and gpt-4o-mini-tts costs the same per
     character of lesson text.

**Where production differs from the router.** These were read from ARM on 2026-10-04 (`MODEL-ROUTER.md` §0,
`evals/model-refresh-2026-10-04/ROUTER-CHANGES.md`):
- **Live STT is still `taxila-transcribe` (gpt-4o-transcribe@2025-03-20).** This is the largest measured gap: CER
  0.236-0.294 vs 0.028 for the routed arm. The fix is ROUTER-CHANGES A3.
- **Classify** runs on `grok-4-1-fast-non-reasoning` with a 1.5 s hedge.
- **TTS is `gpt-4o-mini-tts`.** No DragonHD lane exists in server code yet (`server/endpoints.js` `speechConfig`).
- **Reply, classify and distress have no model fallback in code.** Every fallback below is a routing intention until
  ROUTER-CHANGES C3 lands.
- **The Studio race and the image lane are not in `server/` yet** (W2 stream).
- **All gpt-6 rows wait on the REASONING_FAMILY regex fix** (ROUTER-CHANGES A1). Until then every gpt-6 call returns
  HTTP 400.

**Account and region names used in the tables:**
- **E2** = Foundry account `raghavsharma1729-compan-resource` (eastus2, GlobalStandard).
- **SI** = `taxila-ai-southindia`.
- **CI-Speech** = Azure Speech on `taxila-ai-centralindia`.
- Every chat lane stays on E2, even for the India app. The SI account was 349 ms slower on taxila-fast TTFT from
  Chennai (`india-ai-lanes-eastus2-2026-10-04`).

**Latency labels:**
- **US** = a US container or sandbox calling eastus2.
- **CHN** = an ACA job in Chennai (`taxila-sin-env`).
- Almost every per-call number is US. Only the CHN rows are India numbers.

---

## 1. Model per use case, per stage

Unit prices are $ per 1M tokens unless the row says otherwise. Cost per call = tokens × price.

### 1.1 Onboarding and first meeting (parent onboarding, then Hello ≤ 90 s, then lesson 1)

| use case | model · deployment · region | fallback | why (evidence, n) | latency p50 / p90 (where) | unit price (meter) | cost per call |
|---|---|---|---|---|---|---|
| Parent onboarding screens | none (code) | — | No model call (STUDENT-FLOW §3.1) | — | — | $0 |
| Hello lines, AI card, helpline hand-off | Pre-rendered narration in the teacher's voice. Today `gpt-4o-mini-tts` (E2) cache; the plan is the chosen cascade voice, cached | gpt-4o-mini-tts | The safety hand-off is pre-rendered and digit-checked by ASR (VOICE-CHOICE §4) | Cache hit, ≈ 0 model time | DragonHD "Neural HD TTS" $22/1M chars (`ad55d150`, E2 and CI) | ≈ $0.0024 per 111-char line, once per line, ever [estimate: 111 × $22/1M] |
| Name check (H3, NameSayer), spoken picks | The live STT lane (§1.2) | as §1.2 | as §1.2 | as §1.2 | as §1.2 | as §1.2 |
| Lesson 1 start (hook line, placement warm-up) | `taxila-fast` (gpt-5.6-luna, E2), then the turn loop | none in code | Same reply lane as §1.2. Day 1 uses library Studio pieces only, never a live build (STUDENT-FLOW §1) | **Lesson start, CHN, India app + eastus2 AI: 1610 / 1814 ms** (n=20, INDIA-MOVE §4) | as reply | ≈ $0.0003 [estimate: one reply call] |

### 1.2 Live lesson turn loop (the hot path; child stops speaking → first teacher audio)

| use case | model · deployment · region | fallback | why (evidence, n) | latency p50 / p90 (where) | unit price (meter) | cost per call |
|---|---|---|---|---|---|---|
| **Live STT, eastus2 app** | **Prod today: `taxila-transcribe` = gpt-4o-transcribe (E2).** Routed: **`taxila-live-transcribe`** (gpt-live-transcribe, E2) + script prompt, with keywords once wired (D4) | Azure Speech real-time, LID hi-IN/en-IN (R4) | D4 CER 0.028, answers 76/78, 0/12 output on non-speech. gpt-4o-transcribe arms: CER 0.236-0.294, worse on 30/30 items. n=180 + 12 synthetic clips (`stt/results/tables-2026-10-04.md`) | Cascade stt stage, gpt-4o-transcribe: **354 / 432 ms** (US, n=12, `evals/results/cascade-latency-2026-10-03-integration-after.json`). live-transcribe commit→final: 557 ms p50 (US); **753 / 914 ms (CHN)** (n=20) | gpt-live-transcribe **$1.02/h** (`a3bfb6e0`). gpt-4o-transcribe $6/1M audio-in tokens (`1d21486d`). R4: S1 STT $1/h (`3bd267f0`) + Enhanced $0.30/h (`4c8e8932`) | live-tx ≈ $0.017 per streamed minute. 4o-transcribe ≈ $0.0036-0.006 per minute [estimate: 600-1,000 audio tokens/min, not measured here] |
| **Live STT, India app** | **`taxila-mai-tx2-stream`** (MAI-Transcribe-2-Streaming, SI). Not wired yet | `taxila-live-transcribe` (E2) | Accuracy ties D4: dCER -0.007 [-0.017, 0.003], answers 78/78. **Final text 68 vs 753 ms from Chennai** (n=20). Preview model, no lesson keywords, first partial at 2.6 s vs 1.4 s (barge-in check pending) | commit→final **68 / 75 ms (CHN)**, 320 ms (US). Socket open 111 / 167 ms (CHN) | **No retail meter** (MAI is not in the price pull). Placeholder: Fast Transcription $0.36/h (`e366297b`) [estimate, unconfirmed until Cost Management 2026-10-06] | unknown. $0.006/min at the placeholder |
| Answer classification + signals + model distress read | **`grok-4-1-fast-non-reasoning`** (E2), hedge 1.5 s (prod) | `taxila-fast` (other family; 37/40, S2 16/16). No code path yet | Real `classify()`, n=40: 38/40 [0.89, 0.98], 0 graded wrong. S+S2 16/16 each (`synthesis/results/`). Ties mistral 40/40 and fast 37/40 | **726 / 914 ms** (US, n=40, `classify-h2h-2026-10-04.json`) | Grok 4.1 Glbl in $0.20 (`39dc9a3a`), out $0.50 (`92ba57e1`) | **$0.00020** [estimate: ~900 in / ~45 out, `synthesis/results/spend.json`] |
| Distress floor | `scanSafety()` predicate (code), then the classify model. A filter block counts as distress | `DeepSeek-V4-Pro` (intention only) | grok-4-1 S 16/16 [0.91, 1.00], 16/16 inside the 4 s cut. **Predicate gap:** misses "I don't want to wake up tomorrow" and "main na rahun toh" (ROUTER-CHANGES A2) | grok **463 / 576 ms** (US, n=64). Predicate ≈ 31 µs | as classify | $0 predicate. Model read is inside the classify call. A separate `distressCheck` (low-ASR or failed turns) ≈ $0.0001 [estimate: ~300 in / 5 out] |
| **Teacher reply** (speculative ×3 + real reply on a miss) | **`taxila-fast`** (gpt-5.6-luna, E2), effort none, streamed. Candidate: `taxila-gpt6-luna` | `taxila-mistral-m35` (routed, no code path) | TP on the production `compile()` prompt (n=36): 0 leaks, TTFT 712/889. gpt-6-luna +0.53 [0.08, 1.00] but +226 ms. It waits on the ear panel and a guarded-turn latency run (`text-lanes/results/tables.md`) | TTFT **712 / 889 ms** (US, n=36). taxila-fast TTFT **878 / 1107 ms (CHN)**, n=20. Director stage on the turn (classify ∥ speculative replies → guard): **1562 / 2328 ms** (US, n=12) | in $0.20 (`1e606a78`), cached in $0.02 (`97d64f6e`), out $1.20 (`0edf673f`) | **$0.00023** measured on TP (961 in / 33 out; $0.23 per 1k). With lesson history ≈ **$0.00034** [estimate: 1,500 in / 35 out] |
| Guard rewrite (leak / drift / shape) | `taxila-fast` | — | Rewrites 0-2 of 12 live turns (cascade-latency). TP guard fires 16/36 | +1.3-1.8 s on that turn (`cascade-latency-2026-10-02`) | as reply | ≈ $0.00034 |
| **Cascade TTS** (teacher's mouth) | **Prod today: `gpt-4o-mini-tts`** `marin`/`cedar` (E2). Candidate: **Azure Speech `en-IN-Diya:DragonHDLatestNeural`** (CI-Speech for India). Voice search still running | gpt-4o-mini-tts | Diya: GA, proxy judge 4.70, 0/70 leaks. Owner blind A/B: no tested voice passed as human (2 raters × 40 pairs). Same $ per lesson text as mini-tts (VOICE-CHOICE §5) | First byte: DragonHD **228 / 287 ms**, gpt-4o-mini-tts **688 / 931 ms** (US, n=20, `hv-latency-2026-10-04`). Cascade TTS stage with prewarm, mini-tts: **219 / 230 ms** (US, n=12). India not measured | DragonHD $22/1M chars (`ad55d150`). mini-tts $12/1M audio-out tokens (`8e1fa134`), ≈ $21.7/1M chars equivalent | **$0.0024 per reply** [estimate: 111 chars mean (n=72 replies, cascade-latency 10-03 runs) × $22/1M] |
| Closed comprehension grading (R-EXP / R-MIS on why-answers; off the reply path) | `DeepSeek-V4-Pro` (E2) | `taxila-brain` (coded) | Blind closed-label grader, `server/comprehension/grade/closed.js`. Hedge duplicate at 1.8 s (6/46 tail events) | V4-Pro classify-type calls **739 / 1068 ms** (US, C bench n=40) | in $1.74 (`953a1f53`), out $3.48 (`5a66215b`) | ≈ $0.0008 [estimate: 400 in / 30 out] |
| Forge G1 flavour pick (skin / hook inside enums) | `taxila-fast` effort none | code pick | Writes no truth; a wrong pick costs taste only (`server/forge/generator.js`) | 1.88 s p50 (genui-bench n=10, cited in generator.js) | as reply | ≈ $0.0002 [estimate: ~1k in / 20 out] |
| Turn / beat decision | **code kernel** | — | 23/24, 0 hard breaks, 24/24 reproducible. The best model (gpt-6-sol) was 69/72 and added 1.4 s (`orchestration/results/tables.md`) | ≤ 10 ms | — | $0 |
| Premium speech-to-speech (budgeted minutes only; **not the default**) | `taxila-realtime` (gpt-realtime-2.1, E2) | cascade | Kept for budgeted tiers only. gpt-live-1 is dropped | First audio 776 ms median (US, voices-hindi) | audio in $32 (`34344c3d`), out $64 (`b75a1221`) | ≈ $0.082 per minute of teacher speech, before context re-processing (VOICE-CHOICE §5). ₹512/h windowed (MARKET-THESIS §4.1) |

### 1.3 Live content built during a lesson (off the reply path; a skeleton covers the wait)

| use case | model · deployment · region | fallback | why (evidence, n) | latency p50 / p90 (where) | unit price (meter) | cost per call |
|---|---|---|---|---|---|---|
| Studio plan (strings, cue) | `taxila-fast` none | — | 8/8 schema-valid (LIVE-STUDIO §14) | 3.25 s p50 (US) | as reply | < $0.001 (LIVE-STUDIO §7) |
| **Studio library mount** (expected 90% of pieces) | none: promoted build + G-mount re-gate | live race | Transfer re-gate: fraction 20/21, photosynthesis 12/13 (LIVE-STUDIO §3.11) | ≤ 1 s mount + 5-12 s background re-gate | gate compute only | $0 model |
| **Studio live build race** (game, animation, chart; ≥ 90 s lead) | Routed: **`taxila-gpt6`** (gpt-6-sol) low ∥ **`gpt-5.6-terra`** low ∥ `taxila-gpt6-luna` low (third arm). Today's pair: terra + `taxila-brain`. Not in server yet | `taxila-codex`, on a 429 only | P(passed build by 60 s): 15/15 [0.90, 1.00] vs 10/15 [0.50, 0.80] for today's pair. n=15 pooled, n=5 per archetype, below the n=10 ship bar (`studio/out/summary.md`) | Time to playable **26.7 / 48.7 s** (3-arm). Today's pair 42.0 / 70.8 s (US) | 6-sol in $2 (`2997301e`), out $10 (`1bb3a4f8`). terra in $2 (`23202329`), out $12 (`52393741`). 6-luna in $0.10 (`80f11337`), out $0.50 (`7735b966`) | **$0.125 per race** (3-arm) vs $0.213 for today's pair. gpt-6-sol alone $0.048 per passed build |
| **Images** (text-free and English-labelled) | **`taxila-image25-flare`** (gpt-image-2.5-flare, E2), quality **low** | `taxila-image` (gpt-image-2) low on a 429 or a filter refusal. `gpt-image-2` **medium** for a labelled diagram when flare mislabels (owner rule). Sunburst-low when correctness outweighs ~28 s | flare-low diagrams 10/10 [0.86, 1.00], labels 44/44, 9/9 illustrations, 1/10 refused (`refresh-images-2026-10-04`, n=10 per arm, by eye, not blind). Human label check stays. Hindi labels never baked in | flare-low **15.1 s** p50. gpt-image-2 low 18.5 s, medium 42.2 s (US, arms concurrent). **Quota: flare 4 RPM subscription-wide** | image-out $30/1M on both models (`a5d64cf5` flare, `3189a0eb` image-2). Text in $5/1M | **$0.0066** low (196 out-tokens). gpt-image-2 medium **$0.053** (1,756 tokens) |
| Vision judge (advisory) | `taxila-brain` + mandatory human label check | none qualifies | Diagram false passes, n=80: brain 3, kimi 8, mistral 22 | not timed | sol in $4 (`f7d036c6`), out $20 (`3b6e8e21`) | unmeasured |

### 1.4 Practice and Ask (lesson purposes `practice`, `doubt`)

| use case | model · deployment · region | fallback | why (evidence, n) | latency p50 / p90 (where) | unit price (meter) | cost per call |
|---|---|---|---|---|---|---|
| Tap practice | none: `classifyFast` decides by the bytes | — | Tap answers skip the model classify (TEACHER-BRAIN §5.2) | ≤ ms | — | $0 |
| Spoken practice / Ask (doubt) turns | the §1.2 loop (STT, then grok classify, then fast reply, then TTS) | as §1.2 | same | as §1.2 | as §1.2 | as §1.2 |
| Text lane (typed, no STT) | `taxila-fast` reply; tts-stream optional | — | text-voice: first audio byte after the turn response 213 / 250 ms (local, n=20, not a timing gate) | **/turn 1562 / 2020 ms (CHN**, India app + India DB + eastus2 AI, n=60) | as reply | as reply |
| Homework-photo OCR | Routed: `taxila-brain`. **Not in server** | grok-4-20-nr | Ceiling on synthetic fonts: brain CER 0.009 (§1 history). Not re-measured | brain 2.0 s (US, 10-02) | sol $4 / $20 | unmeasured |

### 1.5 End of lesson

| use case | model · deployment · region | fallback | why (evidence, n) | latency p50 / p90 (where) | unit price (meter) | cost per call |
|---|---|---|---|---|---|---|
| Lesson-end record (summary, parentNote, ≤ 3 cited memories; `routes/lesson.js` lesson end) | **Prod today: `taxila-fast`.** Routed: **`taxila-gpt6`** (gpt-6-sol), its own `DEPLOY_WRITE` role, after the A1 regex fix | `taxila-brain` | W2 hard sheet (n=10 per model per judge, out-of-family judges): gpt-6-sol vs brain +0.40 [0.20, 0.60], fast vs brain -0.35 [-0.50, -0.20]. 0/10 internal-note leaks | gen **5981 ms** gpt-6-sol, 4545 ms fast (US, W2 p50) | 6-sol $2 / $10 | **$0.008** gpt-6-sol (W2 measured $7.99/1k). fast $0.0009 |
| Memory consolidation | inside the lesson-end call (the `memory.consolidate` job only re-checks consent) | — | `server/conductor/handlers.js` | — | — | in the call above |
| Late settles / held verdicts | closed grader (§1.2) | brain | `w1c-settle-beside-classifier` | ≤ 2.5 s cap | as grader | as grader |

### 1.6 Overnight and background jobs

| use case | model · deployment · region | fallback | why (evidence, n) | latency | unit price (meter) | cost per call |
|---|---|---|---|---|---|---|
| Conductor day plan, wakeups, folds | code | — | `server/conductor/*` | — | — | $0 |
| Forge G2 nightly (games): designer, critic, Q8 safety; builder | `taxila-brain` (designer, critic, Q8) + `taxila-codex` (builder), E2 / ACA job eastus2. **Paused** (`w1d-forge-nightly-paused`) | DeepSeek-V4-Pro (builder, routed) | codex game code 6/6 (§1 history). Bench gpt-6-sol as builder next | offline | codex in $1.75 (`c6d293b0`), out $14 (`5939e5eb`) | per `server/forge/g2/model.js` usage; unmeasured per child |
| Studio library pre-warm (batch, same gate) | batch arms (codex / brain / gpt-6-sol). No deadline | — | Makes the 90% hit rate possible | offline | as Studio | **≈ $1.2k one-time per studio-kit version** [estimate: ~5k identities × ~$0.25, LIVE-STUDIO §7, U] |
| Mini-kit for a topic with no kit (blind solve + check) | `taxila-brain` + `taxila-fast` | — | `server/content/minikit.js` | offline | sol / luna | one-time per topic, unmeasured |
| Background twins (quota isolation) | `taxila-fast-bg`, `taxila-studio-sol` | — | Hot lanes never share a pool with background lanes (TEACHER-BRAIN §12) | — | same meters | — |

### 1.7 Parent reports

| use case | model · deployment · region | fallback | why (evidence, n) | latency | unit price (meter) | cost per call |
|---|---|---|---|---|---|---|
| Report Lane A (templated rows from verified evidence) | code | — | `server/reports/*`; the family always gets a correct report | — | — | $0 |
| Report Lane B (orders approved segment ids for the spoken script; no free text) | **Prod today: `[taxila-brain, taxila-fast]`.** Routed: **`taxila-gpt6`** then `taxila-brain`, after A1 and a Lane B validity replay | Lane A order (code) | Cost tie-break among presumed ties (W/W2 measure free writing, not ordering) | brain W gen 4421 ms (US, a proxy for this call) | 6-sol $2 / $10. brain $4 / $20 | ≈ $0.005 gpt-6-sol, $0.010 brain [estimate: W bench $/1k as a proxy: $5.55 and $10.39] |
| Spoken parent card (`/api/parent/speak`) | `gpt-4o-mini-tts` (E2) today | — | `server/routes/parent.js` | mini-tts first byte 688 ms (US) | ≈ $21.7/1M chars equivalent | ≈ $0.03 per 60-90 s weekly script [estimate: ~207 words ≈ 1.2k chars × ~$22/1M] |

### 1.8 Weekly and ops

| use case | model · deployment · region | why | cost |
|---|---|---|---|
| Weekly model scout + refresh benches (T/TP/C/S/S2/D/W/W2, classify, STT, images, Studio) | contestants + judges `taxila-brain`, `grok-4-20-reasoning`, `taxila-kimi26` | `weekly-model-scout`. Switch only on non-overlapping intervals | Refresh 2026-10-04 **≈ $33** (MODEL-ROUTER §0). Scout Azure ≈ $16.4, AWS ≈ $1.35 (`scout-synthesis-tally-2026-10-04`) |
| Studio router bench (n=10 per archetype weekly) | race arms | sets `routes.json` | 189 builds = $12.39 (`studio-refresh-bench-2026-10-04`) |
| Probe fleet (prod smoke, latency from Azure) | prod lanes | `w1d-probe-fleet-first-run-2026-10-04` | small; not read from the bill |
| Fixed infra, not per child | ACA app ~$78/mo, PG `taxila-cin-pg` ~$183/mo, Studio gate app ~$78/mo | INDIA-MOVE App. C, LIVE-STUDIO §7 | **~$340/mo** fixed [estimate: the sum] |

---

## 2. Cost and latency of a child's live lesson (cascade lane)

### 2.1 Assumptions (every one is labelled)

| # | input | low | expected | high | source |
|---|---|---|---|---|---|
| A1 | child turns per lesson-hour | 60 | **80** | 150 | low: 20 turns per 20-min lesson (TEACHER-BRAIN §21.2). Expected: 60 turns / 45 min (`pricing_unit_econ_model.py`). High: MODEL-ROUTER R3 [U] |
| A2 | share of turns the model must classify (the bytes do not decide) | 50% | **75%** | 100% | [estimate]; unmeasured in prod |
| A3 | reply calls per turn | 2 spec + 5% miss | **3 spec + 8% miss**; bytes-decided turns 1; rewrites 10% | 4 spec + 15% miss; rewrites 44% | `TAXILA_SPECULATE` default 3 (`routes/lesson.js`). Hit rate 11/12 (cascade-latency 10-03). Rewrites 3/20 (G) and 1/20 (H2); TP guard fires 16/36 as the high case |
| A4 | tokens per reply call | 961 in / 33 out | **1,500 in / 35 out** | 2,500 in / 35 out | TP measured 961/33 with one prior turn (n=36). History growth [estimate] |
| A5 | classify call | 900 in / 45 out | same | same | `synthesis/results/spend.json` estimate |
| A6 | graded why-turns × targets per hour | 5 × 1 | **10 × 2** | 20 × 4 | [estimate]. +13% hedge duplicates (6/46, `w1c-grader-hedge`) |
| A7 | teacher speech, characters per hour | 8.9k | **17.3k** | 26k | Expected: owner basis (VOICE-CHOICE §5: 40% of the hour at 720 chars/min). Low: measured replies 80 × 111 chars (n=72). High: +50% if SSML markup is billed (HUMAN-VOICE §7, U) |
| A8 | STT audio billed per lesson-hour | 15 min | **60 min** | 60 min on Azure RT + LID | Hands-free keeps the mic track on for the whole lesson (`src/lesson/cascadeLink.ts` `setMicEnabled`). **The billing basis of streaming sessions is unverified** [estimate] |
| A9 | STT price | gpt-live-transcribe $1.02/h | **$1.02/h** | R4 $1.30/h | meters `a3bfb6e0`, `3bd267f0`+`4c8e8932` |
| A10 | lessons per hour; Studio pieces per lesson; library hit rate | 3; 1.0; 95% | **3; 1.5; 90%** | 3; 1.5; **0%** (cold library), at today's pair | LIVE-STUDIO §7 (1.5 pieces, ≥ 90% target [U]). Race $0.125 (3-arm) or $0.213 (today's pair) |
| A11 | generated images per lesson | 0 | **1, flare-low $0.0066** | 3, gpt-image-2 medium $0.053 | [estimate]. Prices measured (`refresh-images-2026-10-04`) |
| A12 | lesson-end record | gpt-6-sol $0.008 × 3 | same | brain $0.017 × 3 | W2 $/1k |
| A13 | other small calls (flavour picks, Studio plans, low-ASR distress checks) | $0.005 | **$0.01** | $0.02 | [estimate: 10 × $0.0002 + 4.5 × < $0.001 + 5 × $0.0001 ≈ $0.007] |

### 2.2 Cost per lesson-hour and per lesson-minute (eastus2 app, routed lanes)

[estimate] = the A1-A13 arithmetic. Script: `reply = turns × [A2 × (fan + miss) + (1 − A2) × 1 + rewrites] × $/call`.

| component | low $/h | **expected $/h** | high $/h | expected arithmetic |
|---|---|---|---|---|
| Live STT (gpt-live-transcribe) | 0.255 | **1.020** | 1.300 | 60 min × $1.02/h |
| TTS (DragonHD or mini-tts, same $/char) | 0.196 | **0.381** | 0.571 | 17,300 × $22/1M |
| Teacher replies (taxila-fast, speculation) | 0.022 | **0.073** | 0.373 | 80 × 2.66 calls × $0.000342 |
| Classify (grok-4-1-fast-nr) | 0.006 | **0.012** | 0.030 | 60 × $0.000203 |
| Comprehension grading (V4-Pro) | 0.005 | **0.018** | 0.072 | 20 × $0.0008 × 1.13 |
| Studio live builds | 0.019 | **0.056** | 0.959 | 3 × 1.5 × 10% × $0.125 |
| Images | 0 | **0.020** | 0.477 | 3 × $0.0066 |
| Lesson-end records | 0.024 | **0.024** | 0.051 | 3 × $0.008 |
| Other small calls | 0.005 | **0.010** | 0.020 | A13 |
| **Total per lesson-hour** | **$0.53 · ₹47** | **$1.61 · ₹142** | **$3.85 · ₹339** | |
| **Per lesson-minute** | $0.0089 · ₹0.78 | **$0.0269 · ₹2.37** | $0.064 · ₹5.65 | ÷ 60 |

Where the expected dollar goes:

| component | share of the expected $1.61/h |
|---|---|
| STT | 63% |
| TTS | 24% |
| All text LLM calls (reply, classify, grading, records, other) | 8% |
| Studio and images | 5% |

The LLM choice barely moves the bill. The audio meters do.

**India app variant.** Live STT moves to MAI-Transcribe-2-Streaming, which has **no meter yet**.
- If it bills at the Fast Transcription rate of $0.36/h (a placeholder [estimate]), the expected hour is **$0.95 ·
  ₹84** (1.614 − 1.02 + 0.36).
- On the gpt-live-transcribe fallback it stays at $1.61.

Notes:
- Today's prod lanes (gpt-4o-transcribe, gpt-4o-mini-tts, taxila-fast record) cost about the same or less: 4o-transcribe
  is ≈ $0.22-0.36/h [estimate, A9 note]. But that STT is the arm measured CER 0.24-0.29.
- **Excluded:**
  - the premium realtime lane: ₹512/h with context re-processing (MARKET-THESIS §4.1);
  - Content Safety calls (unmeasured);
  - fixed infra (§1.8).
- **This model is above MARKET-THESIS's ₹28/h cascade.** Two assumptions differ:
  - that model sends only 25% of audio to STT at an assumed $0.10/h MAI price;
  - it pre-renders 50% of narration at $15/1M Neural.

  Neither is measured. They are levers 1 and 2 in §4.

### 2.3 Turn latency budget: child stops speaking → first teacher audio (cascade)

Stage values are medians and p90s. Summing p90s gives a pessimistic bound, not a real p90.

| stage | today: eastus2 app, measured from the US sandbox | today: Indian child on the eastus2 app | India app (SI compute + CI PG + eastus2 AI + MAI STT) | source |
|---|---|---|---|---|
| 0. endpoint (true speech end → server VAD, 900 ms silence) | **1069 / 1105** | 1069 / 1105 [estimate: silence-bound, same] | 1069 / 1105 [estimate; MAI server VAD not measured] | cascade-latency 10-03 integration-after, n=12 |
| 1. STT final | gpt-4o-transcribe **354 / 432** | ≈ 608 / 686 [estimate: +254 ms, the CHN − eastus2 delta of live-transcribe 753 − 499] | **MAI 68 / 75 [M CHN]**. Fallback live-tx 753 / 914 [M CHN] | same; INDIA-MOVE §4 |
| 2. Director `/turn` (classify ∥ 3 speculative replies → guards → commit) | **1562 / 2328** | ≈ 1773 / 2539 [estimate: +211 ms RTT, M] | **1562 / 2020 [M CHN, arm B, typed turns n=60]** | same |
| 3. TTS first byte (prewarmed stream) | mini-tts **219 / 230** | ≈ 430 / 441 [estimate: +211 RTT] | DragonHD CI ≈ 228 / 287 [M US → eastus2; CHN → CI unmeasured]. mini-tts on E2 ≈ 430 [estimate] | cascade-latency; hv-latency n=20 |
| **first byte, total** | **3206 / 3900 [M end to end, n=12]** | **≈ 3,880 p50** [estimate: the sum] | **≈ 2,930 p50**, p90 bound ≈ 3,490 [estimate: the sum]. With the live-tx fallback ≈ 3,610 | |
| first sound (+60 ms start lead + 50 ms nominal output) | 3316 / 4010 [M] | ≈ 3,990 | ≈ 3,040 | cascade-latency `sound` |

**Gates and targets** (TEACHER-BRAIN §5.1, §5.4):
- Regression floor: p50 ≤ 3.2 s, p90 ≤ 3.9 s.
- Target for the first reply audio: p50 ≤ 2.5 s, p90 ≤ 3.2 s.
- Target for the first audible sound (prelude or clip): p50 ≤ 1.6 s.

**Readings:**
- No production turn from India has been measured end to end.
- The India app with MAI STT is the only configuration whose estimate meets the floor with headroom.
- Even that estimate misses the 2.5 s target. The 900 ms endpoint silence and the ~1.5 s Director stage are the
  remainder.

**Off-path latencies (they never block a turn):**
- Studio race: 26.7 / 48.7 s.
- Image: flare-low 15.1 s.
- Lesson-end record: ~6 s on gpt-6-sol.
- Library mount: ≤ 1 s.

---

## 3. Per child per month vs the ₹299-399 price points

Net revenue per payer-month = price ÷ 1.18 (GST) × (1 − 2.36% Razorpay) (MARKET-THESIS §4.1). That gives **₹247**
at ₹299 and **₹330** at ₹399. The voice AI cost is the §2.2 rate × hours.

| lesson-hours / month | low | **expected** | high | India app, expected (MAI at the $0.36/h placeholder) |
|---|---|---|---|---|
| 20 h | $10.6 · ₹935 | **$32.3 · ₹2,840** | $77.1 · ₹6,782 | $19.1 · ₹1,679 |
| 26 h | $13.8 · ₹1,216 | **$42.0 · ₹3,692** | $100.2 · ₹8,816 | $24.8 · ₹2,183 |
| expected cost ÷ net revenue at ₹299 (20 h / 26 h) | 3.8× / 4.9× | **11.5× / 14.9×** | 27× / 36× | 6.8× / 8.8× |
| expected cost ÷ net revenue at ₹399 (20 h / 26 h) | 2.8× / 3.7× | **8.6× / 11.2×** | 21× / 27× | 5.1× / 6.6× |

**Two-way voice hours a plan can carry at a 45% COGS ceiling** (the 55% gross margin in MARKET-THESIS):

| plan | expected | low |
|---|---|---|
| ₹299 | **0.78 h/month** | 2.4 h |
| ₹399 | **1.05 h/month** | 3.2 h |

Reading:
- **20-26 hours of live voice a month cannot be sold at ₹299-399 on any measured configuration.** Even the low case
  costs 3-5× the net price.
- This matches MARKET-THESIS §4.2. The ₹299 Saathi plan carries 90 cascade minutes. The rest of the child's time is
  tap practice with cached narration (≈ ₹0.8/h).
- The ₹699 and ₹999 tiers carry 300-420 cascade minutes, which is about 5-7 h at ₹142/h ≈ ₹710-990 [estimate].
  At the expected rate that is still above those plans' net prices. Only the low-case levers (§4) bring the hour
  near ₹47.

---

## 4. Biggest levers, and what is still unmeasured

**Cost levers.** Each Δ is against the expected $1.61/h.

| # | lever | Δ $/h | basis | latency effect |
|---|---|---|---|---|
| 1 | **Stop streaming the whole lesson to STT**: send only child-turn windows, or mute while the teacher speaks and keep barge-in on the device VAD | **−0.77** at 25% | 60 → 15 min at $1.02/h | Risks barge-in and the endpoint. Measure first |
| 2 | **Price MAI-Transcribe-2-Streaming** | −0.66 if $0.36/h; unknown otherwise | Placeholder only. It is also **−685 ms** p50 in India | Faster |
| 3 | **TTS characters**: measured replies are 111 chars, and cache or pre-render recurring narration | −0.19 (8.9k vs 17.3k chars); −0.19 more at 50% pre-render | A7 | none |
| 4 | **Studio library hit rate** (pre-warm $1.2k one-time) | 0% hits → 90% hits: −0.50 | A10 | Library mount ≤ 1 s vs a 27-49 s race |
| 5 | Studio race on the 3-arm set, not today's pair | −0.04 at 90% hits; −0.40 cold | $0.125 vs $0.213 | p50 26.7 vs 42.0 s |
| 6 | SSML markup billing (DragonHD) | up to +0.19 if billed | HUMAN-VOICE §7 [U] | — |
| 7 | gpt-6-luna reply (if it passes the ear panel) or a speculation fan-out cut | −0.04 / −0.05 | $0.00017 vs $0.00034 per call | +226 ms TTFT for luna |

**Latency levers:**
- **The India app with MAI STT** (−685 ms STT, −211 ms per round trip).
- **A shorter or predictive endpoint**: 900 ms → ~450-550 ms (TEACHER-BRAIN §5.4 L1). This is the largest fixed
  block and is unmeasured on children.
- **Speculation from the endpoint candidate**, not from the final commit.
- **A grounded uptake prelude** (L3).
- **DragonHD over gpt-4o-mini-tts**: 228 vs 688 ms first byte unprewarmed.
- **Keep chat on E2**: the SI account is +349 ms TTFT.

**Unmeasured. Everything in this list is an estimate until it is measured:**
1. MAI-Transcribe-2-Streaming price and meter (Cost Management re-check 2026-10-06).
2. Whether streaming STT bills session time or speech time (A8).
3. The SSML markup billing rule.
4. Any production cascade turn from India. Every cascade-latency run so far was US-sandbox, in-process, synthetic
   speech.
5. TTS first byte from Chennai to centralindia (DragonHD).
6. Production reply prompt tokens with real lesson history (A4).
7. The share of turns the model must classify (A2).
8. Speculation hit rate and rewrite rate on production traffic.
9. Turns per lesson-hour on real children (A1).
10. Library hit rate (LIVE-STUDIO S7) and images per lesson (A10, A11).
11. Lane B and report tokens per call.
12. Content Safety call volume.
13. Real-child STT accuracy (E1) for D4 vs MAI, and the effect of MAI's 2.6 s first partial on barge-in.
14. The Hindi ear panel for gpt-6-luna and for the voice.
15. Whether gpt-4o-transcribe tokens per audio minute put prod's STT at $0.22 or $0.36 per hour.
