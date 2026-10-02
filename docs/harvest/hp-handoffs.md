# Harvest: html-portfolio Codex handoff branches (segment hp-handoffs)

**Repo:** `/home/user/html-portfolio`. I worked read-only and used only `git show`, `git log`, `git diff`, `git ls-tree` and `git merge-base` against remote refs. Nothing was checked out, committed or pushed.
**Product in these branches:** Vyakti. It turns an expert into an editable AI version of themselves. The flow is **Feed it → Meet it → Deploy it**: the expert's knowledge, voice and personality, plus a memory scoped to each person they talk to. It is served from Azure only, and Hindi, Hinglish and English are first-class.
**Dates covered:** 2026-09-07 to 2026-09-09.

**Ref shorthand used throughout**

| tag | ref | tip |
|---|---|---|
| `@VC` | `origin/codex/vyakti-completion` (parent lineage; covered by other segments) | `6260611e` |
| `@B` | shared base of all four handoff branches = `git merge-base --octopus` | `57eda53a` (VC + 159 commits) |
| `@P` | `origin/codex/handoff-processing204` | `e913ffcb` |
| `@V` | `origin/codex/handoff-voice-comparison106` | `0b47b2b8` |
| `@H` | `origin/codex/handoff206` (the main handover branch) | `20263775` |
| `@A` | `origin/codex/handoff-history-20260909` (archive-only) | `7a8ad90d` |

**Secrets:** none of the four branches tracks `api/_config.js`, `.env*`, `*.pem` or `*.key`; I checked this with `ls-tree`. Two places hold non-value references only:
- `docs/handoff/2026-09-09/evidence/voice-asr106-key.py@H` contains an Azure Key Vault *secret reference URL*, which is a pointer and not a value.
- `api/_replica-processing/gpu-admission.js@P` hardcodes Azure subscription, resource and internal-hostname identifiers. Receipts under `docs/handoff/.../evidence/` repeat them.

I did not copy any of these identifiers into this report.

---

## 1. What this is

### 1.1 Branch topology (computed, not taken from docs)

```
@VC 6260611e ──159 commits (27 on 09-07, 106 on 09-08, 26 on 09-09)──► @B 57eda53a
   @B ─► +4  ─► @P  e913ffcb   processing GPU authority (identical api/_replica-processing tree later merged into @H via f928c80c)
   @B ─► +7 shared (e2176fb6..7bfa08d4) ─► +1 0b47b2b8 ─► @V   synthetic stock voice-comparison job source (NOT in @H)
   @B ─► +7 shared ─► +13 ─► @H 20263775   memory/communication backend, processing integration, math/dash fixes, handoff archive
   @H@31833cdf ─► octopus merge with 14 historical parents ─► @A 7a8ad90d   tree == @H@31833cdf, "do not merge as product"
```

Commit counts:

| branch | total commits | commits beyond `@VC` | commits beyond `@B` |
|---|---|---|---|
| `@P` | 1126 | 163 | 4 |
| `@V` | 1130 | 167 | 8 |
| `@H` | 1142 | 179 | 20 |
| `@A` | 1144 | 181 | 22 |

`@A` adds five fix commits as separate objects: `cff35f04`, `200daa3f`, `c171234c`, `cf5748be` and `1877ce29`. Their content already sits in `@H` through `b0b9aeda`. I confirmed that `scoped_learner_preferences` and `ensureInertConfigModule` are both present at `@H`.

### 1.2 What the 159 shared commits (`@VC..@B`) built

From `@VC` to `@H`, 1,387 files changed, with about 253k insertions. The work groups into these themes:

1. **Expert text Room ("Meet").**
   - Teacher-sheet publication flow.
   - Private text rehearsal with durable authority and cancellation.
   - Owner correction → review → selection → changed reply.
   - Room-only memory consolidation, scoped visitor continuity, and source erasure that also retires the profiles built on it.
   - It runs on Azure Foundry. Models seen: `gpt-4.1-mini`, `Mistral-Large-3`, and the dialogue lane pinned to `gpt-5.6-terra-2026-07-09`.
2. **Voice.**
   - Issued voice-challenge contracts.
   - Hindi text frontend v3 orthography.
   - One-utterance Hinglish synthesis.
   - Default-disabled voice lifecycle.
   - Comparison-reference preparation, and GPU allocation budget windows.
3. **Processing pipeline.** An 8-stage audio DAG on Azure: Fast Transcription, short-audio ASR, ClamAV, diarization, separation, enhancement and voice quality. It also has GPU admission and an Azure Container Apps manual-job controller.
4. **Experience compiler.** Immutable evidence leads to short-lived expression observations, then source-cited candidates, then an owner decision, then a versioned materialization.
5. **Infra.**
   - Azure CPU web adapter that runs the Vercel handlers on Container Apps (not deployed).
   - Bicep templates.
   - Azure-only egress policy.
   - Isolated development database with an identity check.
6. **Gates.** About 24 release gates, many mounted UI suites, and "actual SQL" parser/EXPLAIN proofs against a development Neon database.

### 1.3 What each handoff branch adds

- **`@P` handoff-processing204 (4 commits).**
  - Binds uploaded-source GPU stages (`diarize`, `separate`, `enhance`, `voice_quality`) to a shared GPU allocation window with a microUSD reservation. Uses `db/migrations/161_processing_gpu_authority.sql`.
  - Pins Azure app and active-revision metadata independently.
  - Leaves a planned scale-down tail after dispatch closes.
  - Allows a short-lived pinned metadata snapshot for a scoped canary.
  - Evidence: one synthetic upload completed all eight stages.
- **`@V` handoff-voice-comparison106 (8 commits).**
  - Seven UI and eval integrations are shared with `@H`: comparison permission reset, private-draft focus, remembered-things correction, token adoption barrier, Account CSS, and save/permission eval repairs.
  - The unique commit is `0b47b2b8`. It is a frozen, supervised synthetic comparison of **Chatterbox Multilingual V3** and **VoxCPM2**, run as two Azure Manual GPU Jobs: 6 held-out texts per arm, the same stock reference, and n=1 per cell.
  - Both jobs **succeeded** and produced 12 integrity-verified clips. No one has listened to or rated them.
- **`@H` handoff206 (20 commits).**
  - Learner communication memory (language, script, depth) with `db/migrations/162_fact_communication.sql`, a classifier corpus and Account memory UI.
  - The processing runtime integration.
  - Scientific-notation preservation (brackets, ASCII dashes) and transcript chronology.
  - Removal of conflicting language defaults, and an inert dev config.
  - The **handoff archive** `docs/handoff/2026-09-09/`, about 19.8 MB: 63 files, including 12 WAVs, a listening page, evidence receipts and a full snapshot of the context root.
- **`@A` handoff-history-20260909.** An object-preservation merge only. It exists so tests that read historical Git objects still work after a fresh clone.

### 1.4 Honest status at handoff (`docs/handoff/2026-09-09/START-HERE.md@H`)

The handoff states plainly: "**Not ready for production.**" Its own table of what works:

| area | works | not done |
|---|---|---|
| Processing | Synthetic upload: 8/8 stages. Reference is 10 s mono 24 kHz with 8 kHz+ energy preserved. | Real owner enrollment and likeness. |
| Memory | Real 7-call trial (213): Roman Hinglish preference recalled, Hindi correction stored correctly, forget cleared. | **The corrected-Hindi reply came back entirely English.** The fix was never re-run live. |
| Text | Concentration brackets survive. Dashes become ASCII hyphens. | No fresh end-to-end trial after the punctuation fix. |
| Voice | 2 Azure jobs, 12 verified clips. | No human ratings, likeness, winner or intelligibility screen. |
| Login | Local account-handler fault (missing config module) diagnosed and fixed in the launcher. | Real OAuth, OTP and the authenticated journey. |
| Release | Last full release (203) passed 23/24 gates. | Full gate on the final candidate. Nothing deployed. |

`NEXT-AGENT.md@H` names the prioritisation failure directly:

> "Too much coordination, repeated source freezing, defensive test infrastructure and handoff bookkeeping accumulated before a single real signed-in journey and owner listening result."

That is the single most important process lesson for Taxila.

### 1.5 Bottom line for Taxila

Two kinds of value sit in this segment:
1. **Evaluation instruments.** A blind A/B listening page, a listening benchmark library, Hinglish switch-adjacent WER, held-out physics TTS prompts with critical units, and a teaching-answer rubric.
2. **Hard-won negative results.** Persona post-processing destroyed educational content. A saved learner language preference lost to the persona's language default. Prompt-appended language policies did not change real outputs. Token-level code-switch TTS fan-out wrecked prosody. Scale-to-zero T4s are not real-time.

Directly portable code:
- the Azure Foundry strict-JSON adapter;
- the dialogue delivery-plan schema;
- the learner diagnosis prompt shape;
- the learner communication preference contract;
- the safe KaTeX renderer;
- the Azure-only egress guard;
- the fail-closed spend ledger;
- the closed observable-expression feature set.

---

## 2. Reusable assets

Maturity uses the four values from the brief: `shipped-measured`, `shipped`, `prototype`, `spec-only`. Taxila use is `copy`, `adapt`, `idea` or `skip`.

| ID | path@ref | what | maturity | use | target subsystem |
|---|---|---|---|---|---|
| HPH01 | `docs/handoff/2026-09-09/listening/index.html` + `manifest.json` @H | Static blind A/B listening page. One pair per screen with progress, a collapsed reference, and "Listen for: <critical units>". Preference A/B/tie/cannot_judge. Optional per-clip naturalness, accent and pronunciation (1–5), spoken-disclosure full/partial/absent, and a free-text box for wrong words/numbers/negation/switches. Ratings persist in localStorage; export to JSON; `automaticWinner:null`. | prototype (5 usability checks at 390/1440, 0 errors) | adapt | evals/gates; tts-voice-identity (choosing the tutor voice with teachers and parents) |
| HPH02 | `evals/voice-listening-benchmark/lib.mjs`, `server.mjs`, `page.html`, `browser-check.mjs`, `run.mjs` @H | Listening benchmark library. HMAC opaque IDs; keyed shuffle; attention catch trials (tone/speech/silence); rating and sheet validation; matched-cell grouping by language+text hash, with a scoped `recorded/v1` key; common-RMS normalisation under a 0.92 peak ceiling with fades; strict 24 kHz mono PCM16 WAV parse/wrap. | shipped (eval tool) | copy | evals/gates |
| HPH03 | `evals/voice-listening-benchmark/recorded-pack.mjs`, `recorded-run.mjs`, `recorded-cli.mjs`, `RECORDED-PACK.md` @H | Versioned recorded-pack adapter. A run manifest binds the corpus, each attempt's outcome (failures stay in the denominator) and the comparison scope (subject, conditioning group, listening-reference manifest, recipe), so cells from different speakers cannot merge. | prototype (71 offline groups, 2026-09-08) | adapt | evals/gates |
| HPH04 | `evals/voice-code-switch-frontier/quality-metrics.mjs` @H | Hinglish TTS QA metrics: switch-adjacent WER (radius 2, reviewed language spans or script heuristic), full alignment ops, repeated-insertion count, prolonged-word detector (≥800 ms and ≥2.5× median ms per grapheme), and switch-boundary gap measurement. | prototype (18 named checks, 29 adversarial plans) | copy | evals/gates; tts-voice-identity |
| HPH05 | `evals/voice-code-switch-frontier/corpus.v2.json` @H | Adversarial Hinglish corpus with risk tags: roman_hindi, dense_switch, initialism, english_confusable ("he hai", "is"), mixed_script, borrowings, warm_emphasis. | prototype | adapt | evals/gates |
| HPH06 | `evals/voice-stock-comparison/prompts.v1.json` @V | Six held-out science TTS prompts (2 Hindi, 2 mixed-script Hinglish, 2 English) about a pendulum and Ohm's law. Each has `criticalUnits` (negation "नहीं बढ़ता", "4 ओम", "Small-angle approximation"), `languageSpans` and a `meaningCheck`. | prototype (generated, unrated) | adapt | evals/gates; learning/pedagogy (class 6–9 science spoken-accuracy checks) |
| HPH07 | `evals/voice-stock-comparison/plan.mjs` @V | Pure plan compiler: language balance 2/2/2, a reference SHA and geometry pin, deterministic request/generation IDs. `scoringManifest()` holds the rules: missing output counts in the denominator, numbers judged by spoken value, switch-adjacent errors reported separately, disclosure full/partial/absent, paired descriptive results only at n=1, and blinding with a fresh private key after receipt verification. | prototype | adapt | evals/gates |
| HPH08 | `services/voice-stock-comparison/entrypoint.py`, `capture.mjs`, `collect.py`, `job-plan.mjs`, `observer.mjs`, `README.md` @V | Fixed offline GPU batch entrypoint. Inputs are baked into an immutable overlay. A Python socket guard blocks the network. Each output is validated (geometry, SHA binding, watermark score 0.5–1, model commitment). Results are zlib+base64 chunked JSONL on stdout, collected from Log Analytics, and fail closed on a missing or duplicate chunk. | prototype (1 successful run per arm, 2026-09-09) | idea | generative-ui/modules (Forge batch rendering on Azure GPU); voice-cloning |
| HPH09 | `services/azure-gpu-job/controller.mjs`, `supervisor.mjs`; `scripts/stock-jobs106.mjs`, `stock-jobs106-observer.mjs`, `prepare-stock-jobs106.mjs` @V/@H | Azure Container Apps Manual Job controller. Create-only PUT; T4, 8 vCPU, 56 GiB; retry 0; parallelism 1; immutable image digest; execution-template commitment; a detached observer that may only observe, recover or stop and never retries generation; durable window state machine (`start_claimed` → `running` → `terminal_observed`). | prototype (2 real successful executions) | idea | infra/azure (Forge batch jobs) |
| HPH10 | `api/_gpu-allocation-budget.js`, `api/_replica-processing/gpu-admission.js`, `gpu-observer.js`, `canary-observer.js`, `db/migrations/161_processing_gpu_authority.sql` @P | GPU allocation windows. Before a GPU stage runs it reserves `rate × contingency × planning_seconds` microUSD, binds the window to the leased job and its source SHA, and releases only after observing natural zero replicas. The plan's `hard_invoice_cap` must be `false`, so the code never pretends to be a hard cap. | prototype (processing204 8/8) | idea | infra/azure; payments (cost governance) |
| HPH11 | `api/_provider-budget.js`, `docs/PROVIDER-BUDGET.md` @H | Fail-closed paid-provider ledger. Request commitment → atomic reservation (input reserved at one token per UTF-8 byte, output at the enforced `max_tokens`) → one-way in-flight marker → provider call → settle measured usage. An unknown outcome keeps the reservation held, and no content goes into the ledger. Covers Azure Foundry tokens and Speech per-second billing. | shipped (used by every real call in range) | adapt | infra; payments (per-student daily spend caps) |
| HPH12 | `api/_dialogue/providers/azure-foundry.js` @H | Azure AI Foundry chat-completions adapter. Strict `json_schema`; body read streamed and bounded at 512 KB; deadline with abort; redirect refused; retryable = 408/409/429/5xx; usage required. The `gpt-5.6-terra` dialect: `max_completion_tokens:700`, `reasoning_effort:"none"`, response-model pin, reasoning-token sanity check, `system_fingerprint` format check. | shipped | copy | prompt-compiler; realtime-voice text lane (Taxila gpt-5.6) |
| HPH13 | `api/_dialogue/contracts.js` @H (`replica-dialogue/v2`, commit 48bf4123) | Reply plus delivery plan `{mode: grounded/warm/playful/direct/repair, pace, intensity 0–1, language_hint, nonverbals ≤3}`; `dialogueSpeechStyle()` turns it into a ≤240-char speaking-style instruction. Also: **turn language precedence** and **learner diagnosis shape** laws; `dangerousReply` blocks OTP/password/payment requests and "I am human"; Unicode surrogate hygiene; 20-turn/16k-char history cap. | shipped | adapt | prompt-compiler; tts-voice-identity (realtime instructions); safety-floor/honesty; learning/pedagogy |
| HPH14 | `api/_learner-communication-contract.js` (+ `.d.ts`), `src/engine/learnerCommunication.ts`, `db/migrations/162_fact_communication.sql` @H | Learner communication preference: `language` (english/hindi/hinglish), `script` (roman/devanagari, independent of language) and `brevity` (short/detailed, which also means explanation depth), each with a per-field `scope` boolean. Includes the LLM extraction rule and JSON schema with field meanings, a deterministic positive grammar that refuses negated/quoted/hypothetical text, newest-first per-field projection, and a DB CHECK constraint. | prototype (actual213: recall and classification worked; reply adherence failed) | adapt | learning/pedagogy (explicit learning-profile fields); memory-graph |
| HPH15 | `evals/room-memory-authority/communication-corpus.json`, `evals/fixtures/communication-depth212.json` @H | Labelled en/hi/hinglish preference sentences with expected `{language, script, brevity}`, e.g. "Aage se Hindi ko Roman letters mein likhna, detail mein samjhana" → hindi/roman/detailed. | prototype | copy | evals/gates; learning/pedagogy |
| HPH16 | `src/engine/expertTextCompiler.ts` (`SAVED_COMMUNICATION_POLICY`, commit c171234c) @H | Prompt compiler with a presentation-selection order: explicit current request > saved fields > language of the question > approved default. The teacher's language default is **removed** whenever a saved language exists. Also: a temporary override never edits memory; scientific notation stays exact; "detailed" means developed reasoning, not padding. | prototype (31 offline checks; no live run after the fix) | adapt | prompt-compiler/persona-engineering |
| HPH17 | `api/_room-memory-authority.js` (`ROOM_MEMORY_FACTS_SQL` / `CORRECT_SQL` / `RETRACT_SQL`, commit 91aada0f) @H | Learner-visible "things I remember". A correction inserts a new `user_said` fact with its own episode and supersedes the old one (`t_invalid`, `superseded_by`). Single-item retract via `retracted_at`. Whole forget via `memory_epoch`. Gated on `memory_consent_at` **and `age_attested_at`**. No model call on correction. | prototype (real SQL proofs; actual213 forget verified) | adapt | memory-graph; auth/accounts/consent (parent visibility) |
| HPH18 | `api/_room-memory-consolidation.js`, `api/_room-memory-reclassification.js` @H | Metered LLM consolidation per (agent, person). Lease, schema-readiness SQL, budget-readiness preflight, reservation-bound lease release, and exact-snapshot reclassification of unclassified communication facts. | prototype | adapt | memory-graph/consolidation |
| HPH19 | `api/_experience-compiler/*` + `README.md` @H (commit 630e18dd) | Experience compiler. Immutable sources lead to observations (transcript, speaker, acoustic, expression), then cited candidates, then an owner accept/reject/defer/edit decision (an edit creates a new candidate that supersedes the old), then a versioned materialization and rollback. Reuses existing tables. `relational-materializer.js` writes one cited episode/fact per accepted claim, idempotently, under an advisory lock. | prototype (82 checks + 1000 property trials; materializer 23) | adapt | relational-os; memory-graph |
| HPH20 | `api/_experience-compiler/expression-observation.js` (`EXPRESSION_FEATURES`) + `expression-observation-store.js` @H | **Closed set of 20 measurable delivery features**: speech_rate_wpm, articulation_rate_sps, pause_ratio, mean_pause_ms, pause_count, turn_latency_ms, turn_duration_ms, overlap_ratio, interruption_count, backchannel_count, laughter_ratio/count, energy_rms_db, pitch_median/range_hz, voiced_ratio, emphasis_rate, code_switch_ratio, token/syllable_count. Rules: `may_claim_inner_emotion:false`, a 24 h TTL, dyad and turn scope, and producer/epistemic pairing (observed ⇒ measured or human-annotated). | prototype (39 ledger checks) | copy | emotional-lens/affect; learning/pedagogy (covert comprehension signals) |
| HPH21 | `api/_experience-compiler/mirror-expression.js` @H | Rule-derived per-turn features from a settled transcript and window: duration, token count, wpm, adjacent Latin/Devanagari transition ratio; plus RMS dBFS. Consent-scope gated and hash-bound to the ruleset. | prototype (29 checks) | copy | emotional-lens/affect |
| HPH22 | `src/studio/ExpertAnswer.tsx`, `answerMath.ts`, `expert-answer.css` @H | Safe LLM answer renderer. Only `\[..\]`/`\(..\)` go to a lazily loaded local KaTeX, MathML output. `trust` always refused; fresh macros; `maxExpand:200`, `maxSize:10`; ≤64 expressions and ≤4096 chars each; any refusal or unsupported command (detected by its error colour) keeps the exact source. `**bold**` and backtick code inline; currency and Hindi stay literal; wide equations scroll accessibly. | shipped (44 mounted groups at 320/390/1440) | copy | generative-ui/modules; design-system/ux |
| HPH23 | `src/engine/brain.ts` (`parseExpertAnswer`, `normalizeExpertDashes`, `EXPERT_MATH_SPAN`, `stripReplyBrackets`, commits f4235c68/200daa3f/1877ce29) @H | A separate educational output lane. Brackets and multiline LaTeX are preserved; Unicode dashes become ASCII "-" so bonds, subtraction and ranges survive; a 4000-char cap. The companion stage-direction stripping and dash removal stay on the chat lane only. | prototype | adapt | prompt-compiler; safety-floor (post-processing) |
| HPH24 | `evals/room-expert-answer-math.mjs` (14), `evals/room-expert-answer.mjs` (19), `evals/expert-answer-render/*`, `evals/room-expert-answer/retained-grounding28-math.json` @H | Regression suites built from real retained Azure outputs, checking that equations, brackets and lists survive delivery. | shipped (offline) | copy | evals/gates |
| HPH25 | `api/_voice/hindi-text-frontend.js` @H | Deterministic Hindi TTS text frontend (`vyakti-curated-hi-in-orthography/v3`). Reviewed Roman-Hindi → Devanagari table (~150 words). Indian-English borrowings, including classroom words: chapter, physics, chemistry, formula, equation, NCERT, JEE, NEET, student. Spelled-out letter names; a context rule for "is"; unknown uppercase or Latin words left untouched and audited; UTF-16 spans; signed plan. | prototype (26/26 frontend + 73/73 contract checks) | adapt | tts-voice-identity (Azure TTS lexicon or prompt hints; non-realtime narration) |
| HPH26 | `api/_asr/providers/azure-speech-short.js` @H | Azure Speech short-audio REST ASR. 24 kHz → 16 kHz resample with a 33-tap Hamming-windowed sinc filter (in-memory derivative, source unchanged); ≤60 s; byte/SHA binding; bounded response; Azure-origin assertion. | shipped (production canary) | adapt | realtime-voice (fallback ASR, transcript QA) |
| HPH27 | `api/_replica-processing/providers/azure-fast-transcription.js` @H | Azure Fast Transcription (api-version 2025-10-15). Locales; per-second metering; drops only the exact empty sentinel phrase; spans derived from word evidence; bounded response size. | shipped-measured | adapt | company-brain/knowledge-ingestion (teacher lecture audio); evals (TTS intelligibility screen) |
| HPH28 | `api/_replica-processing/pipeline.js`, `contracts.js`, `queue.js`, `worker.js`, `runtime.js`, `sweep.js`, `storage.js` @P=@H | Durable 8-stage audio DAG: integrity → malware_scan → media_probe → diarize → separate → enhance → transcribe → voice_quality. Stable UUIDs; derived paths of the form `owner/replica/source/derived/<ver>/<stage>-<id>`; monotonic attempts in 5-attempt cycles; exponential backoff with deterministic jitter; integrity or malware failures → blocked. | shipped-measured | adapt | company-brain/knowledge-ingestion; voice-cloning |
| HPH29 | `api/_replica-processing/reference-window.js` @P | Picks the best 10 s voice reference. Takes the dominant diarized cluster; merges runs across gaps ≤1.2 s; ≤900 s extraction budget; **skips neural separation when dominant share ≥0.90**; scores at 16 kHz but **re-cuts the winning window at 24 kHz from the original file**; fallback for a ≤60 s single-speaker self-recording. | shipped-measured | adapt | voice-cloning (a licensed teacher or narrator voice, never a child) |
| HPH30 | `src/studio/QuickVoiceCapture.tsx`, `src/studio/wavCapture.ts` @H | Guided browser recording: 12 s min, 30 s target, 60 s max; script per language (en-IN, hi, Hinglish); live level and audible-frame tracking; mic opens only on Start; review/retake; 24 kHz WAV. | shipped (10/10, later 21/21 checks) | adapt | realtime-voice (mic UX, level meter); android/capacitor |
| HPH31 | `scripts/dev-expert.mjs` (commit cf5748be), `scripts/azure-only-fetch.mjs` @H | Loopback dev server running the real Vercel handlers alongside Vite middleware. Creates an inert `_config.js` from a template if absent, without overwriting. Requires a named isolated dev DB and checks `current_database()` before serving. A global fetch allowlist covers Azure, the exact Neon `/sql` host and the Supabase auth paths, with `redirect:'error'`. | shipped | copy | infra/vercel; evals |
| HPH32 | `api/_model-serving-policy.js` @H | `VYAKTI_MODEL_SERVING=azure_only` provider boundary. Azure host allowlist; any non-Foundry reply provider is denied. | shipped | copy | safety-floor; auth/consent (DPDP data residency) |
| HPH33 | `services/azure-web/*` (README, `server.mjs`, `routing.mjs`, `build.mjs`, `infra/main.bicep`, `cron-runner.mjs`) @H | Hosts the Vite frontend and Vercel-style Node handlers on Azure Container Apps. Compiles the Vercel rewrite/header subset; no SPA fallback; hash-verified manifest; crons from `vercel.json`, disabled by default; Key Vault references; exact-origin host check. | prototype (not deployed) | idea | infra/azure (India-region fallback off Vercel) |
| HPH34 | `docs/handoff/2026-09-09/START-HERE.md`, `NEXT-AGENT.md`, `PROGRESS.md`, `MANIFEST.json`, `REMOTE-RECOVERY-CHECK.md`, `remote-recovery-result.json` @H | Handoff template. A "what works / what does not" table; ordered next actions; **"consumed identities — do not replay"** (paid runs, windows, migrations); money and dependency ledger; local URLs are not deployment evidence; a manifest with SHA-256 and size per file; recovery verified from a fresh bare clone. | shipped | copy | evals/gates; telemetry (context logging process) |
| HPH35 | `origin/codex/handoff-history-20260909@7a8ad90d` | An archive ref. An octopus merge keeps historical commits reachable without merging them into the product; its tree equals `@H@31833cdf`. | shipped | idea | infra (repo hygiene) |
| HPH36 | `docs/gurukul/research/NATIVE-PUBLICATION-QUALITY-RUBRIC-20260908.md` @H | Rubric written before the call for one teaching answer: correct period, correct frequency, fixing the misconception, teaching the distinction, absent data, language preference, useful delivery, honest provenance. Each row is observed, failed or not assessable, with an excerpt. Raw and delivered replies are reviewed separately. | spec-only (applied once) | adapt | evals/gates; learning/pedagogy |
| HPH37 | `docs/gurukul/research/expert-fidelity-20260907/voice-listening-corpus.json`, `voice-listening-methodology.md` @H | 60 authored prompts: 20 Hindi, 20 Roman Hinglish, 20 en-IN, sharing 20 intents. Method: the utterance is the independent unit; never pool across languages; translations are not matched inputs; the owner sets acceptance before generation; failures stay in the denominator; record time to first playable audio separately. | spec-only (authored, unrendered) | adapt | evals/gates; tts-voice-identity |
| HPH38 | `docs/gurukul/research/HINDI-HINGLISH-VOICE-QUALITY-FRONTIER-2026-08-30.md` @H | Plan for Hindi/Hinglish TTS: a pronunciation planner with four authorities; switch-local evaluation; prosody intents; a **reference bank by role** (neutral, explanatory classroom, energetic, calm correction/empathy); routing by measured capability; proposed release rails (24 prompts × 3 seeds, ≤5% switch-adjacent WER, ≥20 listeners/800 judgments, ≥90% catch accuracy). | spec-only | idea | tts-voice-identity; avatar-visual (delivery roles) |
| HPH39 | `docs/gurukul/research/GROUPAI-RELATIONAL-INTEGRATION-2026-09-06.md` @H | Audit of GroupAI branches. Mechanisms worth keeping: recipient-aware disclosure, derived-permission intersection, scoped context capsule, immutable turn binding, durable model-ambiguity ledger, ordered delivery, follow-through, shadow pilot. A 10-row acceptance matrix with a negative/race test per slice. | spec-only | idea | group-ai/multi-agent; relational-os |
| HPH40 | `api/_voice/preview-panel.js` (+ decision `ordinary-preview-needs-durable-cross-tab-idempotency`) @H | Durable idempotent generation intent. One owner-scoped intent; token-bound execution lease; only observer-side retries; immutable protected-result replay; terminal after three failures; an explicit Regenerate key is the only authorised duplicate. | shipped-measured | adapt | generative-ui/modules (never render a module, game or image twice on a retry) |
| HPH41 | `src/room/AccountPage.tsx`, `roomApi.ts`, `copy.ts`, `hiTalkCopy.ts`, `room.css` @H | "Things I remember" UI with correct/forget per item, English and Hindi copy, honest unsaved/uncertain states. | prototype | adapt | design-system/ux; auth/consent (parent and child memory view) |
| HPH42 | `api/_replica-claims.js` (ordering fix c0eeca5d), `docs/CLAIM-EXTRACTION.md` @H | Cited claim extraction from transcript and context evidence, now ordered by source, then span_start_ms, then span_end_ms (it was created_at). | shipped | adapt | company-brain/knowledge-ingestion |
| HPH43 | `api/_replica-dialogue-history.js`, `evals/dialogue-history*.mjs` (commit cff35f04 @A; equivalent code in @H) | Restores owned private conversation history after navigating away. | prototype | idea | relational-os (session continuity) |
| HPH44 | `docs/handoff/2026-09-09/evidence/voice-asr106-screen.mjs` (+ `VOICE-ASR106-DISABLED.json`) @H | **Disabled** ASR intelligibility screen for TTS clips. Pinned inputs; at most 12 posts; 50,000 microUSD cap; reserve → begin → settle per clip; WER refused when scripts are mixed or differ ("requires linguistic review"); `likeness_measured:false`. | spec-only (never run) | adapt | evals/gates |
| HPH45 | `docs/handoff/2026-09-09/evidence/PROCESSING204-TRANSCRIPT-ASSESSMENT.md` @H | Method for scoring Hindi ASR: an unordered token-multiset recall, plus explicit orthographic equivalences (ज़/ज, ँ/ं, joined reduplication), plus a separate sequence WER with the ordering caveat. | spec-only | adapt | evals/gates |
| HPH46 | `docs/handoff/2026-09-09/evidence/room-semantic213-actual-dialogue-review.json` @H | Live memory-trial harness output: a rubric written before the calls; full request messages, raw text and delivered text for each of 7 calls; memory readback after each phase; an assessment per dimension; accounting. | shipped (artifact) | idea | evals/gates (live memory trials) |
| HPH47 | `scripts/check-layout.mjs`, `scripts/check-performance.mjs`, `scripts/run-hindi-observer-pair.mjs` @H | Five viewport classes (360×640 to 1355×800); touch targets ≥44 px measured on visible labels; readable-copy floor; budgets LCP 2500 ms and first Hindi paint 800 ms; a missing browser now counts as a failure, not a pass. | shipped | adapt | design-system/ux; evals/gates (Devanagari performance) |
| HPH48 | `docs/gurukul/research/VOICE-NEXT-EXPERIMENT-20260908.md`, `VOICE-FRONTIER-NEXT-EXPERIMENT-20260907.md`, `voice-frontier-20260907/claim-source-ledger.json` @H | Primary-source checks of TTS vendor claims. Chatterbox V3 is multilingual (Turbo/Nano are English-only). IndicF5 covers 11 Indic languages, not English, and needs reference text. Qwen3-TTS has no Hindi. Fish's Hindi table trades speaker similarity against WER. Azure GPU bills while allocated. | spec-only | idea | tts-voice-identity |
| HPH49 | `docs/gurukul/research/PERSONAL-CLONE-ONBOARDING-AND-EVOLUTION-UX-2026-09-01.md`, `VOICE-CLONE-PRODUCT-UX-2026-08-30.md` @H | Onboarding/evolution UX research: one full-viewport state at a time, a two-action create, one task at a time in Meet. Sizes 47 KB and 6 KB; **headings only, not fully read**. | spec-only | idea | design-system/ux |
| HPH50 | `services/voice-evidence/identity_audio.py`, `test_identity_audio.py`; `api/_liveness/*` @H | Speaker-identity audio decoding, plus the issued voice-challenge and liveness authority used for adult owner enrollment. | prototype | skip | (children must not be voice-cloned; only relevant if a consenting adult teacher voice is enrolled) |
| HPH51 | `docs/gurukul/design/expert-entry/DESIGN.md` @H | Adult brand tokens (Instrument Sans, mineral green). | shipped | skip | design-system/ux |

---

## 3. Key code excerpts worth porting

All excerpts are short and verbatim, and none contains a secret.

**3.1 Learner diagnosis and language precedence laws** (`api/_dialogue/contracts.js@H`). This is the core of covert-comprehension questioning without making it feel like a test:

```js
"Turn language precedence: explicit language/script request in the current user's own message > language/script of their own question > approved teacher defaults when ambiguous. Scope: entire reply, including explanation, caveats, examples and closing; technical notation retained where useful. Excluded language authority: quotations, retrieved knowledge, relationship memory and previous turns. Safety and identity laws remain higher priority.",
"Learner diagnosis shape: observed answer or shown step -> supported discrepancy -> relevant teacher check -> brief correction. Attribution: learner evidence only; teacher conventions and examples remain teacher context. Wrong final answer without working: cause uncertain; possible mechanism marked as a possibility, or one targeted request for the missing step. No invented intermediate calculation or asserted motive. Grounded teaching method retained; answer and necessary uncertainty before optional expansion.",
```

There is no live adherence measurement for this text (`docs/gurukul/research/MEET180-INTEGRATION-NOTE.md@H`: "do not establish measured model adherence"). Per the Meera rule that "position is mechanism", Taxila should A/B its position in the prompt.

**3.2 Delivery-plan schema that drives TTS style** (`api/_dialogue/contracts.js@H`):

```js
const MODES = new Set(["grounded", "warm", "playful", "direct", "repair"]);
const PACES = new Set(["slow", "natural", "brisk"]);
const NONVERBALS = new Set(["breath", "soft_laugh", "pause", "sigh"]);
...
delivery: { type: "object", additionalProperties: false,
  required: ["mode", "pace", "intensity", "language_hint", "nonverbals"],
  properties: { mode: { type: "string", enum: [...MODES] }, pace: { type: "string", enum: [...PACES] },
    intensity: { type: "number", minimum: 0, maximum: 1 }, language_hint: { type: "string", maxLength: 32 },
    nonverbals: { type: "array", maxItems: 3, items: { type: "string", enum: [...NONVERBALS] } } } },
```

`dialogueSpeechStyle()` renders this as text such as `"gentle, accountable, and unhurried; slow pace; expression intensity 0.40; allowed nonverbals pause"`. That form can feed gpt-realtime `instructions` or an Azure TTS style.

**3.3 Azure Foundry gpt-5.6 dialect** (`api/_dialogue/providers/azure-foundry.js@H`):

```js
...(protocol ? {max_completion_tokens:700, reasoning_effort:"none"} : {temperature:0.45, max_tokens:700}),
response_format: { type: "json_schema", json_schema: { name: "vyakti_replica_dialogue", strict: true, schema: DIALOGUE_OUTPUT_SCHEMA } },
...
if (payload.model !== protocol.expectedModel) refuse("dialogue_azure_response_model_mismatch");
if (!choice || choice.finish_reason !== "stop" || typeof choice.message?.content !== "string") { /* incomplete; retryable only on "length" */ }
```

The endpoint must match `*.services.ai.azure.com`, routed to `/models/chat/completions?api-version=2024-05-01-preview`. The response body is read streamed and capped at 512 KB.

**3.4 Learner communication fields** (`api/_learner-communication-contract.js@H`). The schema descriptions repaired a real classification miss: Hindi "विस्तार से" was not being read as "detailed".

```js
brevity:'Explicit recurring answer length OR explanation depth. short means concise, condensed or brief answers; detailed means thorough, elaborated, in-depth explanations with reasoning developed rather than compressed. A request to explain in detail is detailed even without a word meaning long. Hindi and Roman Hindi semantic equivalents count equally. Examples or step ordering alone do not establish depth. Null when depth/length is unspecified, only negated, or only requested for this turn.',
```

and the projection rule (`src/engine/learnerCommunication.ts@H`): "Recall is newest-first; each field can have a different supporting fact." A value of `null` on a scoped field **blocks** older values for that field.

**3.5 Remove the conflicting persona default** (`src/engine/expertTextCompiler.ts@H`, c171234c):

```ts
const languageDefault = conditionalLanguage && !communication.preferences.language ? material("APPROVED LANGUAGE DEFAULT JSON", { ... }) : "";
```

The root cause in actual213 was that the teacher persona's approved language rule and the saved learner preference were both in the prompt. The model followed the persona and answered in English.

**3.6 Closed observable expression features** (`api/_experience-compiler/expression-observation.js@H`):

```js
// Closed by design. Adding a feature is a schema change with an eval, not a
// model-written label. Every value is a directly measurable delivery or
// interaction mechanic; none names mood, intent, personality or inner state.
export const EXPRESSION_FEATURES = Object.freeze({
  speech_rate_wpm: ..., articulation_rate_sps: ..., pause_ratio: ..., mean_pause_ms: ..., pause_count: ...,
  turn_latency_ms: ..., turn_duration_ms: ..., overlap_ratio: ..., interruption_count: ..., backchannel_count: ...,
  laughter_ratio: ..., laughter_count: ..., energy_rms_db: ..., pitch_median_hz: ..., pitch_range_hz: ...,
  voiced_ratio: ..., emphasis_rate: ..., code_switch_ratio: ..., token_count: ..., syllable_count: ... });
...
expression: { turn_id, claim_target: "delivery_cue", interpretation: "observer_interpretation", may_claim_inner_emotion: false },
```

**3.7 Switch-adjacent WER** (`evals/voice-code-switch-frontier/quality-metrics.mjs@H`):

```js
export function switchAdjacentIndexes(tokens, radius = 2, annotation, referenceText) {
  const languages = languageRuns(tokens, annotation, referenceText);
  const indexes = new Set();
  for (let index = 1; index < languages.length; index += 1) {
    const left = languages[index - 1]; const right = languages[index];
    if (left === "neutral" || right === "neutral" || left === right) continue;
    for (let offset = -radius; offset <= radius - 1; offset += 1) {
      const candidate = index + offset;
      if (candidate >= 0 && candidate < tokens.length) indexes.add(candidate);
    } }
  return indexes; }
```

**3.8 Safe KaTeX** (`src/studio/ExpertAnswer.tsx@H`):

```tsx
const html = katex.renderToString(part.expression!, {
  output: "mathml", displayMode: part.display, throwOnError: true,
  trust: () => { refusedCommand = true; return false; },
  errorColor: REFUSED_MATH_COLOR, strict: "error", maxExpand: 200, maxSize: 10, macros: {},
});
if (active && !refusedCommand && !html.includes(REFUSED_MATH_COLOR)) setMarkup(html);
```

**3.9 Educational dash handling** (`src/engine/brain.ts@H`):

```ts
// Expert punctuation can encode bonds, subtraction, ranges or prose. Preserve
// the separator without guessing the subject, using the permitted ASCII form.
function normalizeExpertDashes(text: string): string { return text.replace(/[–—]+/g, "-"); }
```

**3.10 Separation skip and full-bandwidth re-cut** (`api/_replica-processing/reference-window.js@P`):

```js
export const SEPARATION_DOMINANT_SHARE_THRESHOLD = 0.90;
export function shouldSkipSeparation(owner) { return owner.dominantShare >= SEPARATION_DOMINANT_SHARE_THRESHOLD; }
...
const wavBytes = await extractWindow(originalStartMs, originalEndMs, { rate: ENROLLMENT_SAMPLE_RATE }); // 24 kHz from ORIGINAL, never from the 16 kHz scoring buffer
```

**3.11 Azure-only egress guard** (`scripts/azure-only-fetch.mjs@H`):

```js
const AZURE_HOST = /^(?:[a-z0-9-]+\.(?:openai\.azure\.com|services\.ai\.azure\.com|cognitiveservices\.azure\.com|blob\.core\.windows\.net)|[a-z0-9.-]+\.azurecontainerapps\.io|[a-z0-9-]+\.(?:stt|tts)\.speech\.microsoft\.com)$/i;
...
return fetchImpl(input, { ...init, redirect: 'error' });
```

**3.12 Offline GPU job network guard** (`services/voice-stock-comparison/entrypoint.py@V`):

```python
def forbid_network():
    def denied(*args,**kwargs): refuse('stock_job_network_forbidden')
    socket.socket.connect=denied
    socket.socket.connect_ex=denied
    socket.create_connection=denied
```

**3.13 Deterministic retry backoff** (`api/_replica-processing/pipeline.js@P`):

```js
const exponential = Math.min(3_600_000, 2_000 * 2 ** (normalizedAttempt - 1));
// Stable jitter avoids worker herds without making offline replay nondeterministic.
const jitter = Number.parseInt(sha256Hex(`${failureCode}:${normalizedAttempt}`).slice(0, 4), 16) % 751;
```

---

## 4. Measurements

Every number below gives n, method and date. "Ledger" means the internal reservation ledger, not an Azure invoice.

### 4.1 Voice

- **Voice106 Azure GPU jobs (2026-09-09, @H evidence).**
  - Setup: n=6 clips per arm, Chatterbox Multilingual V3 vs VoxCPM2 (Apache-2.0); the same 26.6125 s synthetic stock Hindi reference; T4 Manual Jobs; retry 0. Both executions `Succeeded` and 12/12 artifacts passed integrity checks (`runner.result.json`).
  - **Real-time factor (RTF).** I derived these from the in-job fields `real_time_factor` and `job_call_elapsed_ms` in `stock106-artifacts/*.json`, not from wall time:
    - Chatterbox warm RTF 0.764–0.787. The first clip was 1.789 (warm-up). Elapsed 7.6–9.5 s per 9.6–12.6 s clip.
    - VoxCPM2 warm RTF 2.134–2.162 (first 3.282). Elapsed 20.1–26.4 s (first 36.2 s).
    - PerTh watermark score was 1.0 on all 12.
  - Chatterbox flagged `hindi_reference_language_unverified_cfg_disabled` and `legacy_app_language_contract_unverified` on every Hindi/Hinglish clip.
  - **Human ratings: 0. Automatic winner: null.**
- **Voice106 cost planning (2026-09-09, `VOICE-JOBS106-HANDOFF.md@H`).** A retail query gave 462 microUSD per allocation-second. Each arm reserved 1260 planning-seconds = 582,120 microUSD, 1,164,240 for both. This is a planning reserve, not an invoice.
- **Owner reference ECAPA (2026-08-29, `context/measurements.md#owner-current-reference-general-hindi-hinglish-2026-08-29@H`).** One 10 s owner reference, 192-dimensional ECAPA.
  - General Chatterbox Hindi: mean 0.858449, worst 0.838685 (n=2). The Hindi-specific pack scored 0.832045 (n=2).
  - Fragmented Hinglish: 25,980 ms, ECAPA 0.433967. One-pass: 7,720 ms, 0.825082.
  - Azure short ASR WER: 0.652174 fragmented vs 0.434783 coalesced (n=3 calls).
- **Silence analysis (2026-09-02, `#hindi-hinglish-code-switch-frontier-2026-09-02`).** Method: 40 ms frames, 10 ms hop, near-silence at RMS < 0.008. Fragmented: 65.47% near-silence. One-pass: 24.58%. n=2 artifacts. The Hindi frontend passed 26/26 checks and the contract 73/73.
- **LoRA vs zero-shot (historical, cited in `GROUPAI-RELATIONAL-INTEGRATION-2026-09-06.md@H`).**
  - Training: a 71 s source (62.1 s transcribed), 60 epochs on a T4, 140.4 s.
  - ECAPA 0.775278 → 0.795857 (+0.020579). The reference-self ceiling was 0.886850. Synthesis was about 26% slower.
  - One speaker, 2 runs per arm, no held-out set and no blind test.

### 4.2 Voice runtime and economics

- **Cold-start path (2026-08-29, n=1, `#voice-preview-stale-warmth-baseline-2026-08-29`).** Runtime startup took 138.788 s. Synthesis was not authorised until 587.593 s, so the runtime sat ready but unused for **383.773 s** while separate Vercel processes kept reporting it as warming.
- **Mirror-call canary (2026-08-29, n=1).** A cold T4 reached live in **291 s** (server estimate 480 s). Azure short ASR returned a 77-character transcript in **6,618 ms** for a 7,650 ms window.
- **Concurrency (2026-08-30).**
  - 5 clients sending the same intent made 50 HTTP requests and got exactly 1 generation; every client replayed the same WAV.
  - 5 distinct intents in parallel each succeeded on the first attempt in 29.7, 31.6, 33.4, 36.0 and 41.2 s.
- **False failures (2026-08-29).** 45 of 58 preview generations marked failed were really scale-to-zero lifecycle states: 32 warming, 12 wake in flight, 1 dispatched.
- **Unit economics (2026-08-29, live retail meters, Central India).**
  - T4 costs USD 0.000102/GPU-s; the full T4 profile costs USD 1.6632/h.
  - Azure STT real-time costs USD 1.00/audio-h; Fast Transcription USD 0.36/audio-h.
  - The warm marginal cost of one web conversation minute (30 s user, 30 s clone speech, 2 turns) is USD 0.030–0.042.
  - A cold first call adds USD 0.23–0.35. An always-on replica costs USD 773–1,214 per 730 h.
  - Cold readiness measured 291–418 s; Chatterbox warm RTF 0.79.
- **Long-audio ASR (2026-08-29, n=3 sources of 351–378 s).** All completed after the empty-sentinel fix; USD 0.3324 settled on the ledger. A 6 min 18 s WAV produced 19 spans and 738 words. A 109.5-minute lecture settled USD 0.6572.
- **Azure Speech catalogue (2026-09-07).** 770 voices, including **18 hi-IN and 20 en-IN**. One REST sample took 2,737 ms.

### 4.3 Processing

- **Processing204 (2026-09-09, n=1 synthetic source, `PROCESSING204-OUTPUT-VERIFY-V2-DIAGNOSTIC-ADDENDUM.md@H`).**
  - 8/8 jobs completed, and all 16 scoped comparisons were true.
  - Reference: mono 24 kHz, 240,000 samples, 10,000 ms. Fraction of energy at ≥8 kHz: 0.014087, against a minimum of 0.00003.
- **Hindi ASR on processing204 (n=1 source, 2 spans, `PROCESSING204-TRANSCRIPT-ASSESSMENT.md@H`).**
  - The reference had 58 words and the ASR 57. Unordered exact recall was 54/58 (93.1%). After three orthographic equivalences it was 58/58.
  - The raw sequence WER of 27/58 (46.6%) is an artifact of spans being ordered by created_at.
- **Owner enrollment bandwidth (cited in the `reference-window.js@P` comments).** The old 16 kHz path put 79.61% of energy at 0–1 kHz, 10.43% at 1–4 kHz, 9.50% at 4–8 kHz and **0.46% above 8 kHz**.
  - The owner lecture had a dominant cluster of 663.5 s (231 segments) vs a 25.9 s second voice, so dominantShare was 0.9624.
  - Running separation on the whole 822.72 s / 32.9 MB file failed every time with `voice_evidence_failed`.
- **Short-primary fragmentation (2026-08-29, production, n=2).** Two WAVs (20,992 ms and 32,683 ms) failed at `separate` with `reference_window_no_candidate`. After the fallback was deployed, the recovery executions succeeded in 94 s and 91 s.

### 4.4 Text and memory

- **Memory trial semantic213 (2026-09-09, 7 real calls, 25,595 microUSD, `room-semantic213-actual-dialogue-review.json@H`).**
  - The remembered Roman Hinglish preference was applied to a fresh English question.
  - The Hindi correction was classified hindi/devanagari/detailed.
  - **The corrected-language reply was entirely English: FAILED.**
  - Forget left an empty recall.
  - Brackets survived in 5/5 delivered replies. The Unicode bond dash was lost in 2 replies ("R–X" became "R X").
- **Memory trial semantic211 (n=4 calls, USD 0.008863).** It exposed a missing `detailed` classification and bracket deletion.
- **Final offline checks (2026-09-09).** 64 checks: compiler 31, math 14, Room answer 19. Zero model, database or cloud calls.
- **Text ledger at handoff.** Spent 246,480 of 1,000,000 microUSD, reserved 0.
- **Model pair (2026-09-07).** 12 calls: 6 gpt-4.1-mini vs 6 Mistral-Large-3, counterbalanced; 13,731 microUSD.
  - Latency including Room, gates and ledger: GPT 2.5–6.8 s vs Mistral 4.7–18.0 s.
  - Both models got the core facts. Mistral overextended source scope in 2 of 6.
- **Lean prompt (2026-09-07).** 6 calls on gpt-4.1-mini; 2.2–7.5 s; 5,353 microUSD. Quality failed:
  - Hindi changed "15 minutes" to "five to fifteen".
  - Hinglish missed an explicit exclusion.
  - Delivered lists lost durations.
- **Paired language policy (2026-09-07).** 12 calls; 65,821 microUSD. The policy arm drifted language and corrupted an identifier ("PINE-63" became "pne-63"). Gates reported zero findings on some wrong answers.
- **Public knowledge (6 calls).** Latency 2.1–4.5 s. The unsupported Hindi case answered in Roman Hindi despite a Devanagari question.
- **Private rehearsal (3 calls, 1,475 microUSD).** About 950 input and 68 output tokens per call. Language, script and numeric order were correct in English, Hindi and Hinglish.
- **Presentation refinement (n=2 corrected outputs).** The saved `explanationOrder` was ignored 2/2.
- **Factorial (12 calls).**
  - Mention order: prose-owner 0/3, atomic 3/3, direct-user 6/6.
  - All 12 quantities were correct.
  - The English prose-user answer implied a reversed chronology.
- **Grounding28 (16 calls, 11,659 microUSD).** All numeric results and languages passed. The candidate's delivery step **lost 4 correct equation lines**.
- **Native27 pendulum answer.** It invented about 1.55 m of length by assuming an unstated ideal pendulum with g = 9.8. The error was already in the raw output.

### 4.5 Memory architecture, UI and recovery

- **Experience compiler (2026-08-30).** 82 checks plus 1000 property trials. The expression ledger passed 39 checks, the Mirror producer 29 and the materializer 23. Migration 068 was applied twice idempotently.
- **Mirror memory shadow (2026-09-07).** 52 scenarios × 2 arms = 104 real SELECTs. Required evidence was missing in 6 baseline cases vs 1 lexical-shadow case. Roman-query → Devanagari-fact remains unresolved.
- **UI performance.**
  - Studio entry modulepreload went from 639.60 kB raw / 186.22 kB gzip to 417.98 / 129.39 (−34.7% / −30.5%).
  - Image preload (n=3 cold runs): discovery 1565 → 411 ms, but **LCP went 2076 → 2156 ms**, so it was reverted.
  - Hindi observer53: LCP 2732 ms and first Hindi paint 1710.9 ms, against budgets of 2500 and 800.
- **Recovery check.** 55/55 archived files matched hash and size; 33/33 historical lookups matched; 10/10 deliberately absent paths stayed absent.
- **Listening page usability.** 5 checks at 390 and 1440 px, 0 errors.

---

## 5. Rejections (what was tried → what broke)

Sources are `context/rejected.md@H` entry IDs unless another path is given.

**Voice**

1. **Synthesising each Hindi or English token run separately and joining with 60 ms silence** (`per-token-voice-fanout-and-flat-identity-anchor`). Each switch reset seed, conditioning, breath and emphasis. The clip was 3.36× longer with 65.47% near-silence and ECAPA 0.434. A crossfade cannot recover co-articulation.
2. **`identity_anchor` as the default preset** (exaggeration 0.2, CFG 0.78, temperature 0.6; same entry). The owner heard it as flat and robotic. Replaced by neutral defaults 0.5/0.5/0.8.
3. **A per-token switch budget that rejected previews with more than 16 switches** (`per-token-switch-budget-cannot-reject-natural-roman-hinglish`). A normal Hinglish paragraph was rejected before reaching the GPU, and retries were deterministic.
4. **Routing Hindi automatically to the Hindi-specific pack** (`hindi-pack-and-segmented-hinglish-cannot-be-promoted-from-this-pack`). It scored lower: 0.832 vs 0.858 (n=2).
5. **Calling structural passes a quality win** (`structural-code-switch-passes-cannot-certify-perceptual-voice-quality`). 29 prompt plans, the orthography table and ECAPA proximity do not listen to the audio. Chatterbox still takes one language tag per utterance.
6. **Vendor rankings as "best model"** (`vendor-ranking-is-not-owner-hinglish-acceptance-20260907`). Fish's Hindi table improves speaker similarity but worsens WER; naturalness was scored by an automated evaluator; Qwen excludes Hindi.
7. **Replacing the call brain with PhoneLLM** (`phonellm-b200-benchmarks-cannot-certify-hindi-or-t4`). It is an English text model with a 63.17 GB BF16 closure, benchmarked on a B200 serving 88 agents. Nothing about it predicts a T4 or Hindi.
8. **Treating more upload hours as a stronger clone** (`long-audio-duration-is-not-the-conditioning-unit`). Generation conditions on one 10 s reference. A 109-minute lecture still sounded wrong.
9. **Running sepformer separation on every recording** (`reference-window.js@P` comments). Its 16 kHz Nyquist erases the 8–12 kHz band that carries speaker identity. This was the owner's "not even 0.05% similar" complaint.
10. **Reusing the 16 kHz scoring buffer as the delivered reference** (same file). Only 0.46% of energy remained above 8 kHz, so the model fell back to its own base timbre.
11. **Short self-recordings rejected because the diarizer split them into small clusters** (`diarizer-cluster-contiguity-cannot-veto-primary-microphone-samples`). 2 production replicas stopped at `separate`.
12. **Treating an ASR intelligibility score as human likeness or naturalness** (`START-HERE.md@H`, ASR106 packet). The ASR screen was deliberately left disabled.
13. **Copying borrowed pack IDs, inventing protection flags or relaxing counts so the old listening loader would accept new data** (`old-listening-pack-loader-does-not-accept-new-corpus-20260907`, `generic-voice-cells-cannot-borrow-reference-20260908`). That would compare unlike recordings and reuse another person's reference player.
14. **Requiring equal reference and output duration** (`equal-reference-duration-is-invented-prerequisite-20260908`). An invented blocker that was removed after a signed refusal control.

**Memory and the experience compiler**

15. **Hot-path weight training, silent memory writes from ASR, and durable emotion profiles** (`hot-path-training-and-durable-emotion-profiles`, `one-omniscient-profile-and-hot-path-emotion-training`). Transcription and attribution errors became permanent; relationship scope leaked; a moment of expression was stored as an inner trait; nothing could be reversed.
16. **Calling the relationship dimension schema an "EmotionalOS"** (`emotional-schema-and-hosted-kernel-are-not-live-capability-20260906`). A schema validates shape, not feelings. A GroupAI SQL pass is not a complete kernel.
17. **Lexical retrieval across Roman and Devanagari** (`lexical-retrieval-does-not-bridge-roman-and-devanagari-20260907`). Roman queries miss Devanagari facts. On a no-match query the fallback returns unrelated facts, which is not abstention.
18. **Treating stored vectors as approved memory** (`stored-vectors-are-not-connected-approved-mirror-memory-20260907`). There is no embedding writer for approved claims, and vectors carry no revision commitments.
19. **Saving a learner preference while the persona language default stays in the prompt** (c171234c; START-HERE). Actual213's corrected-Hindi reply came back entirely English. The fix (suppress the default) has **never** been verified live.
20. **Feedback endpoint sent FormData** (`declared-learning-loop-had-unusable-feedback-20260907`). The active endpoint returned 415, so the "learning loop" never received ratings.
21. **The Room logged the current question, read history, then appended it again** (`room-replayed-current-question-and-masked-writes-20260907`). The question was duplicated in context, and INSERT errors were hidden.
22. **Putting public expert answers into follower memory** (`public-knowledge-is-not-shared-past-20260907`). It authorised fabricated "we talked before" statements.
23. **Assuming competitors lack memory** (`competitor-memory-absence-is-not-supported-20260907`). Delphi explicitly claims remembered conversations.

**Text and pedagogy quality**

24. **Treating transport or source-contract success as multilingual quality** (`successful-source-contract-is-not-language-quality-20260907`). 2 of 6 real replies were in the wrong language or script. The teacher persona overrode language when there was no per-turn output contract.
25. **Appending a language policy to the prompt** (`append-language-policy-does-not-repair-expert-reply-20260907`). It passed 13 structural, 39 taste and 329 leak checks, yet real outputs drifted language, corrupted identifiers and made unsupported claims.
26. **Leaving the companion bullet filter on expert answers** (`companion-bullet-filter-discarded-expert-evidence-20260907`). Bullets over 40 characters, or containing "short", "style", "format" and similar words, were dropped, removing real Hindi and Hinglish source values.
27. **Slicing to the first 4 bubbles** (`presentation-segments-can-discard-expert-answer-20260907`). The requested worksheet label was in segment 5, so it was never delivered or inspected.
28. **Unconditional `[...]` stage-direction stripping** (`expert-math-is-not-stage-direction29-20260908`, `expert-grounding28-gate-deletes-equations`). Four correct display equations became bare backslashes, while the gate reported `gated:true, findings:[]`.
29. **KaTeX `trust:false` alone** (`expert-math-ui-refusal-content-loss`). It can consume a refused command's label. Fixed by also checking the refusal colour.
30. **Companion dash cleanup on expert text.** "R–X" became "R X" and "C–leaving" became "C leaving". Fixed by mapping Unicode dashes to ASCII "-" (1877ce29).
31. **A lean prompt to stop invention** (`lean-prompt-does-not-fix-facts-or-delivery-loss-20260907`). Hindi still hallucinated a duration, and delivery removed bullets.
32. **Treating a saved teaching refinement (`explanationOrder`) as adaptation** (`saved-refinement-does-not-prove-adaptation-20260907`, `static-presentation-tail-does-not-establish-adaptation-20260907`). 0 of 2 corrected outputs followed it.
33. **Treating a correct mention order as correct meaning** (`mention-order-success-can-reverse-event-meaning-20260907`). "followed by" implied a reversed chronology.
34. **Treating an operationally successful answer as grounded** (`published-grounding-unsupported-model28-20260908`). The answer derived a pendulum length from an unstated model.
35. **Ignoring each case's language field when building the first paired comparison** (`expert-grounding28-ignored-language-input`). Caught before any provider call.

**Runtime, operations and cost**

36. **Treating a browser retry as permission for another GPU synthesis** (`browser-retry-is-not-permission-for-another-gpu-synthesis`). 6 different WAV hashes for one text and seed.
37. **Settling cold-GPU wake attempts as model failures** (`cold-gpu-attempts-cannot-be-model-failures`). 45/58 false failures that taught the owner to retry.
38. **Per-process warming memory as readiness** (`per-process-warming-memory-is-not-runtime-readiness`). 383.8 s of idle readiness.
39. **The HTTP startup probe as the only gate** (`gpu-http-startup-probe-cannot-be-the-only-routing-gate`). Azure marked a healthy CUDA app unstarted, even at 45 s. Fixed with a delayed TCP probe plus an app-level `/healthz`.
40. **One flat voice price** (`one-flat-voice-price-cannot-hide-cold-gpu-and-carrier-cost`). Warm is about 1 cent per 30 s, while a cold request costs 23–35 cents.
41. **One idle canary as proof of 5-user capacity** (`one-idle-worker-canary-cannot-certify-five-user-clone-capacity`). Different queues; no 5-user number exists.
42. **Treating Azure's empty phrase sentinel as a failure** (`an-empty-azure-sentinel-is-not-a-failed-transcription`). 3 paid, complete calls were rejected and the UI stuck at 38%.
43. **Buffering 250 MiB of audio, or resetting the attempt counter** (`large-private-audio-cannot-be-buffered-or-reset-to-attempt-zero`). Exceeded the 64 MiB / 250 MB limits, and the ledger rejected the reused request key.
44. **Sarvam as the only live ASR** (`sarvam-http-402-cannot-own-live-call-availability`). An HTTP 402 dropped a call window.
45. **Fixed-percentage progress and "queued means running"** (`milestone-percent-silent-auth-reset-and-queued-means-running`). Progress sat at 33–38%, and a cold start was called late at 5 minutes when 8 minutes was normal.
46. **Waiting for microphone permission before rendering the call session** (`mirror-call-session-cannot-wait-behind-microphone-permission`). The page stayed on "Opening" after the server returned HTTP 201.
47. **A four-tap post-recording flow and a long stacked Meet page** (`four-action-recording-and-stacked-meet`); **desktop density with eager advanced labs on phone** (`desktop-density-and-eager-advanced-labs-on-phone`). A 640 kB preload, 9 px copy and targets under 44 px.
48. **Early image preload** (`early-image-preload-did-not-improve-paint-20260907`). LCP 2076 → 2156 ms; reverted.
49. **A missing browser or skipped performance check returning exit 0** (`performance-skip-zero-was-not-a-valid-release-pass-20260907`, `missing-browser-is-not-a-passing-layout-gate-20260906`).
50. **Release pass taken as provider or listening proof** (`release-pass-does-not-certify-provider-or-listening-20260907`); **agent parallelism taken as quality** (`expert-parallelism-not-quality-evidence`).
51. **Writing paid outputs after the accounting readback** (`accounting-readback-must-not-discard-paid-output-20260906`). A SQLSTATE 42703 discarded outputs that had already been paid for.
52. **A verifier asserting `manifest.parameters.sample_rate`** (`PROCESSING204-OUTPUT-VERIFY-V2-DIAGNOSTIC-ADDENDUM.md@H`). The field cannot exist in the manifest contract, so the run hit ERR_ASSERTION after all 16 real comparisons had passed. The right fix was to the verifier, not to production metadata.
53. **Ordering transcript spans by `created_at`** (c0eeca5d). It moved the last sentences to the front of the extraction context.
54. **Treating deployed-job inspection as execution shape** (`gpu-execution36-job-shape-not-execution`). Defaults differ between job GET and execution GET (`initContainers` null vs [], `imageType`), which caused a false mismatch.
55. **Processing observer timeout taken as worker failure** (START-HERE). A later readback showed natural zero replicas. Do not restart the worker.
56. **Semantic209's stale starting-spend guard** (START-HERE). The run stopped before any provider call. The 2,700 microUSD difference was real settled transcription.

**Process**

57. **"Too much coordination, repeated source freezing, defensive test infrastructure and handoff bookkeeping"** before a single real signed-in journey or listening result (`NEXT-AGENT.md@H`). The primary outcomes, the full journey and owner voice quality, were never verified. Rejection IDs carry release and candidate numbers up to 208, which shows the churn.
58. **Handoff marked publish-ready** (`handoff206-not-publish-ready`); **local Git objects taken as remote proof** (`handoff206-local-objects-not-remote-proof`). Recovery was re-verified from a fresh bare clone.
59. **`--import C:/...` on Windows** (`handoff207-windows-import-url`). It failed with `ERR_UNSUPPORTED_ESM_URL_SCHEME`; the fix is a `file:///` URL. Two local commands were auto-rejected (`Rejected(command)`) and must not be described as having run.

---

## 6. Concepts

- **Evidence hierarchy.** Each step is weaker than the next: transport success, source contract, offline test, structural pass, live raw output, delivered output, human judgment. Every rejection above enforces one rung. For Taxila: an eval passing is not a child understanding, and an ECAPA or ASR score is not a voice that feels like a person.
- **Consumed identities.** A paid run, cohort or holdout used once becomes regression material. Never replay it as fresh evidence and never tune on it. Handoffs list them explicitly as "do not replay".
- **Prospective rubric, raw vs delivered.** Write pass criteria before the call, then judge the model's raw text and the post-processed delivered text separately. Several of the worst defects (equations, lists, dashes, labels) happened after the model, in delivery.
- **Two output lanes.** The persona/chat lane may strip stage directions, dashes and long bullets. The educational lane must preserve brackets, LaTeX, signs and lists. Taxila's tutor needs both: spoken warmth and exact educational content.
- **Learner communication dimensions.** Language, script and depth are independent fields. Script never follows from language. Precedence: explicit current request > saved > question language > persona default. A temporary override never edits memory. A conflicting default must be **removed**, not merely outranked.
- **Learner diagnosis shape.** Observed answer → supported discrepancy → teacher check → brief correction. When the cause is unknown, ask one targeted question for the missing step; never invent the learner's working or motive. This maps directly onto covert comprehension.
- **Experience compiler.** Fast turns stay responsive while durable changes are cited, reviewable, versioned and erasable. Expression is observable delivery mechanics with a 24 h TTL and never an inner emotion. For Taxila the "owner" reviewing changes could be the parent or teacher, or an automated calibrated policy that must beat explicit review on false-write rate. That second option is this repo's own reversal condition.
- **One acoustic utterance per code-mixed sentence.** Keep language spans in an audit plan, never split them into separate model calls.
- **Reference bank by delivery role.** Neutral, explanatory, energetic and empathetic references, one selected per utterance. More minutes of audio is not better conditioning.
- **Switch-adjacent WER.** Measure errors within ±2 tokens of a language boundary; whole-utterance WER hides the defect.
- **Cold vs warm economics.** Price the scale-from-zero window separately from warm marginal cost, and keep carrier and telephony separate.
- **Fail-closed metering.** Reserve → begin → settle. An uncertain outcome stays held, a retry is never free, and paid output is written before accounting.
- **Durable idempotent intents.** One logical request maps to one paid generation. Retries only observe; regeneration needs an explicit key.
- **Azure-only serving boundary.** An egress allowlist plus a response-model pin, and redirects refused.
- **Archive refs and recoverable handoffs.** Preserve objects without merging them, keep a manifest with SHA-256s, and verify recovery from a fresh clone.

---

## 7. Gaps and unread

- **`context/` additions in range.** 364 rejections, 348 decisions and 419 measurements (about 216, 222 and 327 KB). I listed every heading and read roughly 70 entries in full. Most release/candidate and authority entries (release 23–208) were triaged by title only.
- **`docs/handoff/2026-09-09/context-root/`.** The full archived graph, decisions, measurements, rejected and STATE (about 2.6 MB). I read only the head of STATE.
- **Long research docs not read in full.**
  - `MULTIMODAL-HUMAN-EXPERIENCE-COMPILER-2026-08-30.md` (51 KB)
  - `CONTINUOUS-HUMAN-CLONE-FRONTIER-2026-08-29.md` (42 KB)
  - `PERSONAL-CLONE-ONBOARDING-AND-EVOLUTION-UX-2026-09-01.md` (47 KB)
  - `VOICE-FRONTIER-NEXT-EXPERIMENT-20260907.md` (26 KB)
  - `EXPERT-PILOT-DISTRIBUTION-20260907.md`, `HINDI-HINGLISH-RETRIEVAL-CHECKPOINT24-20260907.md`
  - About 150 other `docs/gurukul/research/*` handoff notes (titles only).
- **UI source.** `src/creatorStudio/*` (77 files), `src/studio/*` (about 68 added, 54 modified) and `src/room/*` were only spot-read: ExpertAnswer, answerMath, QuickVoiceCapture header, AccountPage diff.
- **Database.** 41 migrations were added in range; I read only 161 and 162. `db/schema.sql` was not read.
- **Identity, liveness and verification.** `api/_liveness/*`, `services/azure-verifier/*` (Face, Document Intelligence) and `services/voice-evidence/identity_audio.py` were not read (skipped as adult-identity scope).
- **Code read partially.** `services/azure-gpu-job/controller.mjs` and `supervisor.mjs` (head only); `services/azure-web/*` (README only); `api/_replica-processing/worker.js`, `runtime.js`, `queue.js`, `native-tools.js`, `chunked-diarization.js` (not read); the teacher-sheet and text-publication backends (docs only).
- **Audio.** The 12 WAVs and the reference were not listened to (no human ratings exist in the repo either). The private A/B mapping (`voice-listening106-public.private.json`) and the ASR106 inventory, which reveals the arm for each clip, are committed in the same archive. A listener who reads the repo is no longer blind.
- **Nothing executed.** No eval or test code was run; every number above is quoted from repo artifacts. The voice RTF and elapsed figures in §4.1 I extracted from the artifact JSON fields.
