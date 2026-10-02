# Harvest: misc-repos

Segment id: `misc-repos`. Harvested 2026-10-02. This was a light but complete sweep of seven small repos. Every repo was only read, using `git show`, `git ls-tree`, `git log` and `git diff` against refs. Nothing was checked out, committed or pushed.

## Repos covered

| repo | refs | verdict |
|---|---|---|
| `/home/user/raghavsharma2003/hihi` | 6 branches. **`@echo` = `origin/claude/voice-notes-app-calendar-f0d541` @ `2033e98`** (2026-07-29). Also `@prime` = `origin/claude/prime-sum-algo-optimization-lkry0q` @ `a04fea2`, `@codex-races` = `origin/codex/weighted-races-focused-flagship` @ `2f8058a`, `@prana` = `origin/claude/pranawatt-landing-build-l6h9ew` @ `7485b6b`, `@ncr` = `origin/claude/ncr-battery-leads-scraper-xyqrfv` @ `6275e48`, and `origin/main` (1 empty initial commit). | **Echo is reusable (patterns).** prime/codex-races are maths research, useful only for verification lessons and an explainer format. prana gives a few UX components and tests. ncr is irrelevant except for its provenance rules. |
| `/home/user/raghavsharma2003/shivaji_sarthi` ("PDA-Saathi") | `main` @ `03c3601` (2 commits, 2026-02-28) | Mock-only political-engagement dashboard. Useful only for its Hindi/English i18n pattern. Otherwise **irrelevant**. |
| `/home/user/naukri_bi_copilot` | `main` @ `2bbbe89` (13 commits, 2026-03-19..31) | **Reusable.** It has an LLM-pipeline discipline: code-computed numbers with a narrative validator, sanitised context, a run cache, one-retry validation, and lint-enforced forbidden imports. |
| `/home/user/routine_carbonsettle_intel` | `main` (`.gitkeep` only) plus 29 `claude/*` branches, each holding exactly one `briefings/YYYY-MM-DD.md` | Daily CBAM briefing routine output. The content is **irrelevant**. It carries one **high-value rejection**: the routine had no memory across runs. |
| `/home/user/raghavsharma2003/vyakti-product` | `origin/main` @ `fd6bdee` (2023 static portfolio). `origin/claude/ai-companion-app-rkt1lv` @ `9fddcd2` is a **shallow 60-commit copy of the Meera companion repo**, 2026-08-18..20, 769 files. | `main` is **irrelevant**. The companion branch is **superseded by html-portfolio** (covered by the `meera-repo` / `hp-*` segments), but its commit bodies are the only local narrative for 2026-08-18..20, because the html-portfolio clone is shallow from 2026-08-22. Its rejections are extracted below. |
| `/home/user/raghavsharma2003/vyakti-products` | no commits at all ("No commits yet", remote `raghavsharma2003/vyakti-products`) | **Empty.** It was the planned target of a Meera move that was reversed on 2026-09-14 (see R-27). |
| `/home/user/sales-enabler` | `main`, `claude/blissful-mayer-icwe2j`, `origin/main` and `origin/claude/blissful-mayer-icwe2j`. All four hold exactly one commit, `319a84b` "Initialize repository" (2026-09-21). | **Confirmed empty.** Every one of the 4 refs holds only `.gitkeep`. |

**Secrets:** I did not open any secret file.
- hihi: `.env.example` (template) is present on `@echo`, `@prime` and `@codex-races`.
- naukri: `.env.example` is present as a template. Its key *names* include Neo4j, OpenRouter, Astra, AWS S3, Tableau and NextAuth. I did not read the values. If any are real, treat them as "secret present at `/home/user/naukri_bi_copilot/.env.example@main`" and rotate.
- vyakti-product companion branch: `api/_config.example.js` and `api/_gkeys.js` are present. `_gkeys.js` was scanned for `AIza…` literals and none were found. It is a key-pool helper.
- Edge functions in `@echo` read `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` from Supabase secrets. No literal key is in the tree.

**Azure-only reminder.** Several assets here call Anthropic, OpenAI-direct, OpenRouter, Supabase or Whisper. Under Taxila's 2026-10-02 directive, **only the patterns port**. Any model call must be re-pointed at Azure OpenAI (gpt-5.6 structured outputs, gpt-realtime-2.1, Azure transcription). Supabase RLS and Storage map onto Neon Postgres RLS and Azure Blob SAS.

---

## 1. What this is

### 1.1 Echo (`hihi@echo`): voice-first notes app, Expo/React Native

Echo is an iOS/Android voice-notes app on **Expo SDK 57, React Native 0.86, React 19.2, expo-router, expo-sqlite (local-first) and Supabase** (Postgres + RLS + private Storage + Deno edge functions). There are 52 files and 3 commits: init, app, CI.

You talk and the app keeps both the audio and the live transcript. A Claude edge function extracts a title, summary and action items. With Google connected, actions become Calendar events or Gmail *drafts*; the app never sends mail. Everything is optional and layered: recording, transcription, search and playback all work on-device with an empty `.env`.

Architecture (`README.md@echo`):
- `src/capture/useVoiceCapture.ts`: one recogniser session produces both the transcript and a persisted WAV.
- `src/db/client.ts`: SQLite with append-only migrations via `PRAGMA user_version`.
- `src/services/orchestrator.ts`: a 30 s background loop that enriches, then syncs.
- `src/services/sync.ts`: last-write-wins sync where a dirty local edit wins. Also tombstones and a pull cursor.
- `supabase/functions/enrich-note`: structured-output extraction.
- `supabase/functions/transcribe-audio`: Whisper fallback that reads storage *with the caller's JWT*.
- `supabase/migrations/20260729000000_init.sql`: RLS (4 explicit policies) and a private bucket whose path's first segment is the auth uid.
- `.github/workflows/ci.yml`: tsc, then eslint, then `expo export` for Android and iOS.

**Maturity:** the code is complete, and CI typechecks and bundles both platforms. No device test, no unit test and no measurement exists in the repo. Treat it as a carefully reasoned **prototype**.

### 1.2 Other hihi branches

- **`@prime`** (62 commits, 2026-07-29..08-18) and **`@codex-races`** (56 commits, branched from `@prime` v4 `1b00bc2`): both still carry the Echo app tree, and `algorithms/` is added on top. They are analytic number-theory research ("weighted prime races"). It has C sieves, Python/Arb certification, LaTeX papers, LinkedIn/Medium drafts and interactive explainers (`algorithms/prime-sum/worked-by-hand.html`, `weight-dial.html`, `site/*.html`). The final commit, `a04fea2`, marks the repo superseded. `SESSION-LOG.md@prime` (157 lines) is a dense log of independent audits. Its *verification failures* are the reusable part (R-20..R-24).
- **`@prana`**: PranaWatt landing page on Next 14, Tailwind, GSAP ScrollTrigger and Lenis. It has a live savings calculator with an **honest-fail state** and vitest formula tests (`tests/calculator.test.ts`).
- **`@ncr`**: NCR battery-lead scraper in Python. Its rules are robots.txt-gated fetches, "never fabricate lead data; every row needs real `source_urls`", and a `CLAUDE.md` Sonnet-for-mechanical-work policy.

### 1.3 PDA-Saathi (`shivaji_sarthi@main`)

A Next 16.1.6 / React 19.2.3 / Tailwind 4 / Recharts / framer-motion dashboard for a political leader: Questions queue, Posts, District map, Voter-app phone mock. **All data is hardcoded mock** (`lib/data.ts`). The "AI insights" are three fixed strings in `lib/i18n.ts`, and no model is called. **About 350 of the 399 tracked files are the committed `.next/` build output.**

The reusable piece is the bilingual layer: `lib/i18n.ts` (`strings.en` and `strings.hi`), `lib/hooks/useLanguage.tsx` (context plus localStorage `pda-lang`, defaulting to `hi`), and `next/font` `Noto_Sans_Devanagari` + Inter + JetBrains Mono in `app/layout.tsx`.

### 1.4 Naukri BI Copilot (`naukri_bi_copilot@main`)

A metadata-first BI copilot: Next 16.2, React 19.2, Zustand, Neo4j graph, Qdrant (optional), Athena, Tableau, and an "Astra" external LLM plus a "Llama" internal LLM. OpenRouter (o3-mini-high + Claude 3.7 Sonnet) was added in `fbf9ef6`.

An admin portal curates verticals, products, tables, columns, joins and KPIs as a graph. The chat runs a **14-step pipeline**, tabled in `docs/final-deep-audit.md@main` §2.2: intent parse → follow-up detection → turn merge → graph traverse → rank → dimension resolve → assemble + compact → plan → generate SQL → post-validate → safety validate → execute → analyst loop (≤3 iterations) → hybrid insight (template by the external model, fill computed by code, then validate).

There are 30 route handlers, 28,982 TS lines, and 5 test files with 15 jest tests. The runtime is mostly mock-degraded (see Measurements).

### 1.5 routine_carbonsettle_intel

There are 29 one-file branches. Each is the output of one scheduled "CarbonSettle CBAM Dispatch" run between 2026-06-29 and 2026-07-26: 112–229 lines of markdown with tagged stories (`[NEW]`, `[UPDATE]`, `[WATCH]`, `[DEADLINE]`), each with a Source URL and a "Why it matters" line, plus a Regulation Watch and a 60-day Compliance Calendar. Nothing is ever merged to `main`, which holds only `briefings/.gitkeep`.

### 1.6 vyakti-product

- `origin/main`: Raghav's 2023 HTML portfolio (movie-ranking, birthday-invite pages). **Irrelevant.**
- `origin/claude/ai-companion-app-rkt1lv` @ `9fddcd2`: a shallow (60-commit) mirror of the Meera companion work branch from html-portfolio, with Capacitor Android, `api/`, `evals/` and `context/`. Its last commit writes `docs/TRANSFER.md`, the manifest for moving the repo to `Vyakti-products`. That move was reversed on 2026-09-14 (`html-portfolio@16fae19f`: "Owner directive revised: Vyakti stays in this repo and Meera moves out").
- **Code: skip.** Use html-portfolio, which other segments harvested. **Commit bodies:** read. They are richer than most `context/` entries, and Taxila should cross-check that each one landed in the html-portfolio `context/` graph. Spot-check: `dead-writers`, `never-scheduled`, `pk-is-an-arbiter`, `dryrun-still-spends`, `life-per-person`, `selfbundle-never-set`, `blank-guard-parity`, `startup-failure-is-invisible` and `gates-that-live-nowhere` all appear in `html-portfolio@origin/claude/ai-companion-app-rkt1lv:context/*`.

---

## 2. Reusable assets

| # | path@ref | what | maturity | Taxila use | target subsystem |
|---|---|---|---|---|---|
| A1 | `src/capture/useVoiceCapture.ts@echo` | One mic stream yields the live transcript and a persisted WAV. It restarts the Android recogniser transparently after a silence end (max 12 restarts), shifts segment timings by a session offset so tap-to-seek lines up, and finalises only after BOTH `end` and `audioend`. A 4 s stop watchdog covers a missing `end`. `no-speech` is suppressed during continuous pauses. | prototype | **adapt.** The patterns go into the Capacitor native mic / offline "voice note to teacher" fallback. The RN hook itself is not portable. | realtime-voice, android/capacitor |
| A2 | `useVoiceCapture.ts@echo` `normalizeVolume` | Square-root map of the recogniser's −2..10 level to 0..1. Speech sits at 1–4 and a linear map looks flat. 100 ms live sampling, 250 ms stored waveform samples, 42-bar trail. | prototype | **copy** (idea-level code) for the child-facing "teacher is listening" level meter | design-system/ux, realtime-voice |
| A3 | `useVoiceCapture.ts@echo` `start()` | Android intent extras `EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS=4000` (room to think mid-sentence). iOS `playAndRecord` + `defaultToSpeaker`/`allowBluetooth` + `measurement` mode. | prototype | **idea.** Children pause longer than adults, so a long silence window is needed in any on-device STT fallback. | realtime-voice, android/capacitor |
| A4 | `src/capture/storage.ts@echo` | Recordings live in the document dir, never the cache dir, because the OS evicts cache. `adoptRecording` moves the capture to its note-id name and returns the original URI on failure ("a recording in the wrong place still beats no recording"). Storage bytes are surfaced in Settings. | prototype | **idea** for any on-device lesson audio or offline cache | android/capacitor |
| A5 | `src/db/client.ts@echo` | Local SQLite with WAL, foreign keys on, and append-only migrations keyed by `PRAGMA user_version`, one transaction per migration ("never edit a statement that has shipped"). `getDb()` resets the cached promise on failure. There is a revision counter and listener set instead of polling. | prototype | **adapt** for an offline-first Android lesson/progress queue (rural connectivity) | db-schema, android/capacitor |
| A6 | `src/services/sync.ts@echo` | Push, then pull. LWW on client-owned `updated_at`, **except an unpushed dirty local edit always wins**. Soft-delete tombstones are hard-deleted only after they reach the server. Pull cursor on `updated_at`. Audio upload failure is non-fatal and retried. Signed URLs for 1 h. | prototype | **adapt** for syncing offline module attempts and voice notes to Neon | db-schema, android/capacitor |
| A7 | `src/services/orchestrator.ts@echo` | A background loop every 30 s plus immediately on AppState→active. A `running` re-entrancy guard. Per-item exponential backoff capped at 15 min. **If the backend is unconfigured, items are marked `skipped` so the UI never shows an eternal spinner.** `requestEnrichment(id)` nudges the loop right after save. | prototype | **adapt** for Forge job polling on the client and the parent-app sync loop | generative-ui/modules, telemetry |
| A8 | `orchestrator.ts@echo` `coerceEnrichment` | The client re-validates model JSON even though the server used structured outputs. Enum allow-list (`task/event/email/reminder`), `""` and `0` sentinels mapped back to null, 12-item and 6-tag caps, title sliced to 120. | prototype | **copy** (pattern). Never trust model JSON at the consumer. | prompt-compiler, evals/gates |
| A9 | `supabase/functions/enrich-note/index.ts@echo` | Structured-output extraction with a **flat, non-nullable schema** (`""`/`0` mean "not mentioned"). Field descriptions carry the rules ("Never guess a time that was not said"). `recordedAt` and the speaker time zone are passed so "tomorrow at 9" resolves. The transcript is clipped to 24k chars rather than refused. A `stop_reason === 'refusal'` check runs before reading content. Effort is `medium`. | prototype | **adapt** onto Azure OpenAI gpt-5.6 `json_schema`. Use for parent-message / homework / "what did the child say" extraction. | prompt-compiler, learning/pedagogy |
| A10 | `supabase/migrations/20260729000000_init.sql@echo` | RLS with **four explicit per-verb policies rather than one `for all`** ("an accidental permissive write policy is easier to spot"). Client-generated UUID PK so rows exist offline. `touch_updated_at` trigger that respects a client-owned `updated_at`. GIN FTS index. Private bucket with a 100 MB cap and mime allow-list. Storage RLS: `(storage.foldername(name))[1] = auth.uid()::text`. | prototype | **adapt** to Neon RLS and Azure Blob paths `<child_id>/<item>`. Children's voice is as sensitive as "a diary entry". | db-schema, auth/accounts/consent |
| A11 | `supabase/functions/transcribe-audio/index.ts@echo` | Downloads the recording **with the caller's own JWT so storage RLS still applies. The service-role key is never used to read a user's recording.** The BCP-47 tag is mapped to an ISO-639-1 code for the STT. | prototype | **adapt.** The server reads child media on behalf of an authenticated principal, never with god credentials. | auth/accounts/consent, safety-floor |
| A12 | `supabase/functions/_shared/http.ts@echo` | `requireAuthHeader` on every function: "a leaked anon key alone cannot spend the project's model budget". | prototype | **copy** (pattern) for every Azure model-spending route | infra/azure, auth |
| A13 | `src/services/auth.ts@echo` | Email **6-digit OTP instead of magic links**. It works whether mail is opened on this phone or another device, and needs no deep-link plumbing. | prototype | **adapt** for parent login (parents often read mail on a different device than the child's tablet) | auth/accounts/consent |
| A14 | `.github/workflows/ci.yml@echo` | tsc, eslint, and **`expo export` for both platforms**, "the only check that catches a module that type-checks but cannot be resolved by Metro". Concurrency cancel-in-progress. | prototype | **idea.** Add `npx cap sync android && ./gradlew assembleDebug` to Taxila CI for the same reason. | evals/gates, android/capacitor |
| A15 | `src/theme/tokens.ts@echo` + README "Design notes" | **One accent = one meaning.** Ember is live voice only, sage is machine-authored content only, gold is pinned. A serif for user-authored text, a sans for chrome. The record button sits in the tab-bar centre for either thumb. | prototype | **idea.** Give one colour exclusively to "teacher is listening/speaking" and one to "AI-generated content" (parent transparency). | design-system/ux |
| A16 | `app.json@echo` | Permission strings, `UIBackgroundModes: audio`, Android `RECORD_AUDIO`/`MODIFY_AUDIO_SETTINGS`, `androidSpeechServicePackages: com.google.android.googlequicksearchbox` | prototype | **idea** for the Android manifest checklist | android/capacitor |
| A17 | `algorithms/prime-sum/worked-by-hand.html`, `weight-dial.html`, `site/*.html@prime` | Single-file interactive HTML explainers. Section shape: concrete small example ("The flip, in nine primes"), then mechanism, then **"The thing people get wrong"**, then how it was computed, then what is proved vs open. One page has a live dial. | shipped (static site with `site/vercel.json`) | **idea.** This is the template for Forge-generated explainers: a misconception section and an honest "what's still open" coda. | generative-ui/modules, learning/pedagogy |
| A18 | `algorithms/prime-sum/SESSION-LOG.md@prime` (independent_verifier audit) | Fail-closed verifier. 11 of 12 tests assert REJECTION of corrupted input. The auditor ran 15 extra mutations: 13 were rejected and 2 were correctly accepted. It also states that it certifies soundness, not sharpness. | shipped-measured (in that repo) | **idea.** Mutation and negative-control discipline for Taxila kit answer-key gates. | evals/gates/verification |
| A19 | `tests/calculator.test.ts`, `lib/calculator.ts@prana` | Formulas are re-derived in the test line by line. An **honest-fail** test: below ₹10k diesel the result is `viable: false` and the UI refuses a rosy number and routes elsewhere. | shipped (vitest) | **idea.** Parent reports and progress claims get an honest-fail state ("not enough evidence yet") with a unit test on the threshold. | evals/gates, design-system/ux |
| A20 | `components/Reveal.tsx@prana` | A scroll reveal that fires once. Threshold 0 with a −10% bottom rootMargin, because a percentage threshold never resolves for an element taller than the viewport. Stagger is capped at 240 ms. Reduced-motion renders the final state. | shipped | **copy** | design-system/ux |
| A21 | `config/business.ts@prana` | The brand name and every calculator constant live in one file ("Brand name (it WILL change)"). `/design-tokens` route renders the design system live. | shipped | **idea** | design-system/ux, growth/seo |
| A22 | `ncr_leads/robots.py`, `CLAUDE.md@ncr` | Every fetch is gated by robots.txt. "Never fabricate lead data; every row needs real `source_urls`; unknown fields stay blank." | shipped | **idea** for curriculum/NCERT ingestion provenance: every kit fact cites a source and unknowns stay blank | company-brain/knowledge-ingestion |
| A23 | `lib/i18n.ts`, `lib/hooks/useLanguage.tsx`, `app/layout.tsx@shivaji_sarthi/main` | A typed `strings.{en,hi}` object (`StringsType = typeof strings.hi`), a LanguageProvider with a localStorage toggle defaulting to Hindi, and `Noto_Sans_Devanagari` via next/font. | prototype | **adapt.** Taxila needs a Hindi/English UI toggle. Fix the hydration flash (default `hi`, then `useEffect` reads storage) by reading the preference before first paint or server-side. | design-system/ux |
| A24 | `components/dashboard/*@shivaji_sarthi/main` | MetricCard, SentimentBar, BarChart (recharts), a rotating AIInsights card, PhoneFrame mock | prototype (mock data) | **idea** for parent-dashboard layout only | design-system/ux |
| A25 | `lib/analyst-loop/insight-validator.ts` + `template-filler.ts` + `insight-template-builder.ts@naukri` | **Model writes the template, code computes the numbers, validator traces every number.** The external LLM writes a narrative template with `{{placeholders}}`. Code (`computeFilledInsight`) computes every value from query results. `validateInsight` recomputes, compares (tolerance max(1%, 0.5)), and flags every narrative number not traceable to a filled placeholder as `hallucinated_number`. `sanitizeInsightNarrative` drops the sentences that carry unverified tokens and appends "Some calculations could not be verified and were omitted." | shipped (mock-runtime) | **adapt.** This is exactly the right shape for **parent reports and progress dashboards**: the model never writes a number, and code computes from the learner model. It matches the inherited law "a model never grades". | learning/pedagogy (parent reports), evals/gates, safety-floor/honesty |
| A26 | `lib/context-engine/safe-context.ts@naukri` `sanitizeContextForExternalLLM` | An explicit **allow-list projection** of every field before context leaves for an external model. Raw result rows are never included, and it is rebuilt field by field rather than spread. | shipped | **adapt.** Build a child-PII minimiser before any prompt or Forge job: name, age band, and learner-model features only, never raw transcripts unless the lane needs them. | safety-floor, auth/consent, prompt-compiler |
| A27 | `lib/context-engine/run-cache.ts` + routes accepting `runId@naukri` | The assembled context package is cached under a `runId` (TTL 10 min). Downstream steps reference the id instead of re-posting large JSON. This cut the client's 18 requests with full-context bodies. | shipped (in-process Map; see R-3) | **adapt, but keep it in Postgres or Redis.** The Director assembles lesson context once per turn, and Forge jobs reference it by id. | prompt-compiler, generative-ui/modules |
| A28 | `lib/analyst-loop/orchestrator.ts@naukri` | The loop runs plan → generate → validate. On failure there is **exactly one retry, with the validator's errors appended to the plan notes**, then a hard throw. Then execute → evaluate (`should_try_another`) → graph-aware re-angle, with `max_iterations` 3 and per-provider call counters returned. | shipped | **adapt** for Forge generation: generate module, then static validate, then one retry carrying the validator errors, then fail closed. Return call counts for cost telemetry. | generative-ui/modules, telemetry |
| A29 | `lib/validators/sql-validator.ts` + `cost-guard.ts@naukri` | Static gate before execution: must start with `SELECT/WITH`, balanced parens, a deny-list regex of DDL/DML verbs, `SELECT *` blocked, plus a cost estimate that can block | shipped | **idea.** A static validator for LLM-generated module JS/HTML before it runs in the sandbox (deny `fetch`/`eval`/storage, size cap). | generative-ui/modules, safety-floor |
| A30 | `eslint.config.mjs` + `lib/safety/s3-guard.ts@naukri` | **Lint-enforced forbidden imports.** `no-restricted-imports` blocks `PutObjectCommand`/`DeleteObjectCommand`/`CopyObjectCommand`/`Upload`, and the file carries a `// @safety NO_S3_WRITES` header. | shipped | **copy** (pattern). Enforce the **Azure-only directive mechanically**: ban `@anthropic-ai/sdk`, `elevenlabs`, `openai` with non-Azure base URLs, Sarvam, Simli and others via `no-restricted-imports` plus a grep gate. | infra/azure, evals/gates |
| A31 | `lib/conversation/followup-detector.ts`, `turn-merger.ts` + `__tests__@naukri` | Rule-based follow-up detection: a regex table with confidences, new-topic patterns, a scope-change reset, a "self-contained question" heuristic, and a merge only when confidence > 0.7. Jest tests cover drill-down, a self-contained new topic, and a short metric-less refinement. | shipped (3+ tests) | **idea.** Detect "same but for…" refinements in a child's questions so the Director carries lesson scope. Use cheap rules before any model. | learning/pedagogy, prompt-compiler |
| A32 | `lib/context-engine/context-compaction.ts@naukri` | A staged compaction ladder (chars/4 token estimate, then truncate, then drop columns, then cap tables, then strip context) with a before/after log | shipped | **idea only.** Taxila's law is that budget gates *throw*. Use a declared drop-priority manifest (Meera TAIL) instead of silent compaction. See R-9. | prompt-compiler |
| A33 | `docs/final-deep-audit.md@naukri` | An audit format: the pipeline table has an explicit **Fallback** column and a Config column, plus a security-boundary table (boundary, enforced in, what it prevents) | shipped (doc) | **idea** for Taxila `context/architecture.md` | evals/gates/verification |
| A34 | `deploy/systemd`, `deploy/nginx`, `ecosystem.config.cjs`, `scripts/native-preflight.ts@naukri` | Native same-server deploy plus a preflight that checks env/backends before start | shipped | **skip.** Taxila deploys to Azure Container Apps. The preflight idea is worth keeping. | infra |
| A35 | `lib/adapters/openrouter-client.ts@naukri` | OpenRouter fetch plus a JSON extractor (strip fences, then slice from the first `{` to the last `}`) | shipped | **skip.** Azure-only, and structured outputs replace brace-scraping. | — |
| A36 | `briefings/*.md@routine_carbonsettle_intel/claude/*` | Daily dispatch format: tagged items (`[NEW]`/`[UPDATE]`/`[WATCH]`/`[DEADLINE]`), each with a Source URL and a one-line "Why it matters", plus a rolling 60-day calendar | shipped (29 runs) | **idea** for the Conductor's daily parent digest format. Do not copy the memory model (R-1). | learning (Conductor/parent reports) |
| A37 | `docs/TRANSFER.md@vyakti-product/claude/ai-companion-app-rkt1lv` | A move manifest "written before the move so the check is a check". It lists what git carries and what it silently will not (gitignored `api/_config.js`, Actions secrets in repo settings, the Vercel project link), with post-move verification commands (`ls-remote` equals `rev-parse`, `rev-list --count`, then run the gates in a fresh clone). | spec-only | **adapt now.** Taxila is moving Vercel → Azure Container Apps. Write the same manifest: secrets, ACR webhook, custom domain, cron jobs, env. | infra/azure/vercel/deploy |
| A38 | `scripts/check-workflows.mjs@vyakti-product/claude/ai-companion-app-rkt1lv` | A lint over `.github/workflows` YAML: `secrets`/`env`/`steps`/`runner`/`job`/`matrix`/`strategy` are illegal in a job-level `if:`. It is a line scanner, deliberately not a YAML parse. | shipped (negative-tested, in verify-release) | **copy** (also in html-portfolio). Taxila's ACR/Azure deploy is GitHub-triggered. | evals/gates, infra |
| A39 | `scripts/verify-voice.mjs`, `src/voice/spokenText.ts@vyakti-product/claude/ai-companion-app-rkt1lv` | A mirrored-constant check that every lane names the same voice and declares its model. One `spokenText` seam where text becomes speech, with `mustSay` assertions so a sanitiser that deletes words fails. | shipped-measured | **adapt.** Use the html-portfolio copy, which is newer. | tts-voice-identity, evals/gates |
| A40 | `vyakti-product@origin/main` (2023 portfolio), `vyakti-products` (empty), `sales-enabler` (`.gitkeep` ×4 refs), `shivaji_sarthi/.next/**` | — | — | **skip** | — |

---

## 3. Key code excerpts worth porting (verbatim, no secrets)

### 3.1 Finalise only when both halves have reported (`src/capture/useVoiceCapture.ts@echo`)

```ts
  /**
   * Resolves the pending `stop()` once both the recogniser and the audio writer
   * have reported in. Waiting for only one of them yields either a truncated
   * transcript or a zero-byte file.
   */
  const tryFinalize = useCallback(() => {
    if (!finalizeRef.current) return;
    if (!recognitionEndedRef.current) return;
    // `audioend` never fires if the session failed before audio started.
    if (!audioEndedRef.current && audioUriRef.current !== null) return;
```

### 3.2 Android silence restart without a second file writer (`useVoiceCapture.ts@echo`)

```ts
  useSpeechRecognitionEvent('end', () => {
    // On Android, continuous mode still ends the session after a long silence.
    // If the user has not asked to stop, transparently start another one so a
    // pause mid-thought does not truncate the note.
    if (wantsListeningRef.current && !stoppingRef.current && restartCountRef.current < 12) {
      restartCountRef.current += 1;
      sessionOffsetRef.current = Date.now() - startedAtRef.current;
      try {
        ExpoSpeechRecognitionModule.start({
          lang: languageRef.current,
          interimResults: true,
          continuous: true,
          addsPunctuation: true,
          volumeChangeEventOptions: { enabled: true, intervalMillis: VOLUME_INTERVAL_MS },
          // Audio already began in the first session; asking to persist again
          // would open a second writer and truncate the first file.
          recordingOptions: { persist: false },
        });
        return;
```

### 3.3 Dirty local edit beats the server (`src/services/sync.ts@echo`)

```ts
    // An unpushed local edit is the user's most recent intent — never let a
    // stale server row overwrite it. It will win on the next push instead.
    if (local && (local.sync_status === 'dirty' || local.updated_at > remoteUpdated)) continue;
```

### 3.4 Storage RLS keyed on the path's first segment (`supabase/migrations/20260729000000_init.sql@echo`)

```sql
-- Objects are keyed "<user-id>/<note-id>.<ext>", so the first path segment is
-- the authorisation check.
create policy "read own recordings"
  on storage.objects for select
  using (bucket_id = 'recordings' and (storage.foldername(name))[1] = auth.uid()::text);
```

### 3.5 Read user media with the caller's token, never the service role (`supabase/functions/transcribe-audio/index.ts@echo`)

```ts
  // Download through the caller's own token so storage RLS still applies — the
  // service role key is never used to read a user's recording.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
```

### 3.6 Flat, non-nullable output schema (`supabase/functions/enrich-note/index.ts@echo`)

```ts
/**
 * Structured outputs guarantee the response parses. Times are ISO strings and
 * "unknown" is the empty string rather than null — a flat, non-nullable schema
 * is markedly more reliable than one built out of anyOf branches, and the
 * client normalises the empty cases anyway.
 */
...
          dueAt: {
            type: 'string',
            description:
              'ISO 8601 datetime resolved against the recording time and time zone given in the prompt. Empty string if no time was mentioned. Never guess a time that was not said.',
          },
```

"Markedly more reliable" is asserted, not measured in this repo. Taxila should measure it on gpt-5.6 before relying on it.

### 3.7 Every narrative number must trace to a code-computed value (`lib/analyst-loop/insight-validator.ts@naukri`)

```ts
  for (const number of extractNarrativeNumbers(filledInsight.narrative)) {
    const normalized = normalizeNumericString(number);
    if (!normalized) {
      continue;
    }

    if (!verifiedNumbers.has(normalized)) {
      issues.push({
        type: "hallucinated_number",
        description: `Narrative number "${number}" could not be traced back to a filled placeholder.`,
        severity: "warning",
      });
    }
  }
```

Port this with the severity raised to `error` for parent-facing reports. A parent should never see an untraceable "improved 30%".

### 3.8 One retry with validator feedback, then fail closed (`lib/analyst-loop/orchestrator.ts@naukri`)

```ts
    if (!validation.is_valid) {
      const retryPlan = {
        ...planForIteration,
        query_plan: {
          ...planForIteration.query_plan,
          notes: `${planForIteration.query_plan.notes}\n${buildValidationMessage(validation.errors)}`,
        },
      };

      generated = await external.generateSQL(retryPlan, config.context_package);
      astraCalls += 1;
      validation = validateSQL(generated.sql, config.context_package);
      ...
      if (validation.blocked || !validation.is_valid) {
        throw new Error(
          validation.block_reason ??
            `Generated SQL remained invalid after one retry. ${validation.errors.join(" ")}`.trim(),
        );
      }
    }
```

### 3.9 Lint-enforced forbidden imports (`eslint.config.mjs@naukri`)

```js
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@aws-sdk/client-s3",
              importNames: ["PutObjectCommand", "DeleteObjectCommand", "CopyObjectCommand"],
              message: "S3 writes are forbidden in this project. Use read-only access only.",
            },
```

Taxila version, as a sketch to write ourselves: `paths: [{ name: "@anthropic-ai/sdk", message: "Azure-only directive 2026-10-02" }, { name: "elevenlabs" … }]`. Pair it with a grep gate over `server/` for `api.openai.com`, `openrouter.ai` and `api.elevenlabs.io`.

### 3.10 Honest-fail threshold test (`tests/calculator.test.ts@prana`)

```ts
  it("fails honestly below ₹10k diesel", () => {
    expect(calculate({ ...input, diesel: 9999 }).viable).toBe(false);
    expect(calculate({ ...input, diesel: 10000 }).viable).toBe(true);
  });
```

### 3.11 Job-level `if:` context lint (`scripts/check-workflows.mjs@vyakti-product/claude/ai-companion-app-rkt1lv`)

```js
// Contexts GitHub does NOT evaluate in a job-level `if:`. `secrets` is the one
// that has actually bitten us; ...
const ILLEGAL_IN_JOB_IF = ["secrets", "env", "steps", "runner", "job", "matrix", "strategy"];
```

---

## 4. Measurements

Only numbers that carry a method are listed. Most of this segment is unmeasured prototype code. That absence is itself a finding: **Echo has zero tests and zero device measurements**, and its reliability claims are reasoning, not data.

| claim | n / method / date | source |
|---|---|---|
| 28 of 29 CBAM briefings open with "First edition" / "First dispatch. No prior briefings on file". The 29th (`2026-07-03`) also says "First dispatch". So effectively **29/29 runs had no memory of any prior run**, and the `[UPDATE]` tag and de-duplication never fired. 2026-06-29 was produced 3 times on 3 branches. | n=29 branches. Method: `git show <branch>:briefings/*.md \| head -5`, grep for "first edition\|no prior". Run 2026-10-02 by this harvest. | `routine_carbonsettle_intel@origin/claude/eloquent-cerf-*`, `affectionate-cori-a72ywn`, `epic-hopper-kpuw1k` |
| Briefing length 112–229 lines (median ≈142) | n=29, `wc -l`, 2026-10-02 | same |
| BI Copilot: 30 route handlers, 155 TS/TSX files, 28,982 lines, **5 test files / 15 tests**, 4 git commits at audit time | Static inventory plus `npm run typecheck`/`lint`, live API checks. 2026-03-22 (audit generated 2026-03-22T22:18+05:30). | `docs/final-deep-audit.md@naukri` "Snapshot" |
| BI Copilot runtime at audit: health **degraded**. Vector backend **mock**, query engine **mock**, embeddings mock-only, external/internal LLMs "with fallback". | live `/api/health` plus env inspection, 2026-03-22 | same, §Snapshot and §10.3 |
| Graph data: 1 vertical, 3 products, 6 tables, 12 KPIs, 5 joins, **0** active business relationships, 279 active columns, **`dimension_values` curated for only 21/279 columns**. Full traverse 471 nodes / 115 links. | live graph inventory, 2026-03-22 | same, §Snapshot and §10.2 |
| A single three-step analyst query costs **18 HTTP requests** (1 assemble + 1 plan + 3×(generate + validate-and-fix + validate + execute + evaluate) + 1 compile + 1 conversation write), each re-posting the full context package | code-path count, 2026-03-22 | `docs/architecture-audit.md@naukri` §1b |
| Insight validator tolerance: a value matches if `abs(delta) <= max(1% of expected, 0.5)`. Within tolerance it is a warning, outside it is an error. | code constant | `lib/analyst-loop/insight-validator.ts@naukri` |
| Conversation memory TTL 30 min, max 20 turns. Run cache TTL 10 min. Follow-up merge threshold confidence > 0.7. | code constants | `lib/conversation/memory.ts`, `run-cache.ts`, `safe-context.ts@naukri` |
| Echo capture constants: live level every 100 ms, stored waveform sample every 250 ms, 42-bar trail, ≤12 auto-restarts, 4,000 ms stop watchdog, 4,000 ms Android silence window, 30 s background poll, enrichment backoff capped at 15 min, transcript clipped at 24,000 chars, 100 MB bucket cap ("comfortably past an hour of 16 kHz mono speech") | code constants (not tuned by any measurement) | `useVoiceCapture.ts`, `orchestrator.ts`, `enrich-note/index.ts`, `init.sql@echo` |
| prime-sum `verify_variance_identity.py` **fails in place (exit 1)**. The true worst error is 4.23e-6 against a printed 3.3e-6. This was masked because the section sat under `except ImportError`. | auditor re-run, 2026-08-18 | `algorithms/prime-sum/SESSION-LOG.md@prime` |
| independent_verifier: 11/12 tests assert rejection. Auditor's 15 mutations gave 13 rejected and 2 correctly accepted. **Inflating every radius 1000× still passes** (soundness, not sharpness). | mutation testing, 2026-08-18 | same |
| Meera (from vyakti-product commit bodies; canonical copies in html-portfolio `context/`): agent isolation **0 cross-agent rows across n=320 scoped retrievals, negative control catches 656** | eval G-E1, 2026-08-18 | `vyakti-product@072a2dd` |
| Meera: OpenRouter key limit 25, usage 25.021, remaining −0.0211. Production `/api/chat` still returned 200 in 4.81 s via the free Google pool. | key endpoint plus live probe, 2026-08-20 | `vyakti-product@e381bf2` |
| Meera: deploy workflow invalid for **15 consecutive runs**, 2026-08-11..20, each with `total_jobs 0` and `created_at == run_started_at == updated_at` | GitHub Actions API, 2026-08-20 | `vyakti-product@112fc7d` |
| Meera: 16 rejection/measurement entries existed in the prose files with **no row in graph.json** | scan, 2026-08-20 | `vyakti-product@112fc7d` |
| Meera: production at audit had 2,358 log rows across 41 devices but 2 episodes, 8 facts, and 0 rows in rel_state and 9 other derived tables. **Scheduled workflow runs all-time: 0.** | live DB plus Actions API, 2026-08-18 | `vyakti-product@a084edd` |
| Meera: symbol words spoken went from 5 across 4/12 utterances to 2 across 2/12 after the spokenText seam. persona.ts has 307 em-dashes (not the 208 claimed). | espeak-ng 1.51 harness, n=12 utterances, 2026-08-20 | `vyakti-product@2d5ad85` |
| Meera: 720 ms of the 1,370 ms voice latency floor is untouchable prefill, so a 10× latency gain is not available. Shipped TTS lane f0 is 212–214 Hz, against a 266 Hz anchor that had been used to reject Azure at 210 Hz. | speech-stack survey, 2026-08-19 | `vyakti-product@1c8ad5f` |
| Meera research citations: LoCoMo has 6.4% key error and its judge accepts 62.81% of vague-adjacent answers. Best 2025 naturalistic SER macro-F1 is 0.4316 over 8 classes. visiongate measured 10–11% fabrication. | literature plus prior eval, 2026-08-19 | `vyakti-product@bde53ca`, `@f05b2fb` |
| Meera: G-C7 call-lane length 16.1 → 12.9 words/turn at n=36/arm, but the direction flipped at n=12. Honest claim: "no regression detected". | eval, 2026-08-20 | `vyakti-product@8d28ee5` |

---

## 5. Rejections (tried → what broke)

### From this segment's own repos

- **R-1 Scheduled routine with no durable memory** (`routine_carbonsettle_intel`; the outlier `eloquent-cerf-oou6hi` header also reads "*First dispatch.*"). *Tried:* a daily scheduled agent that should tag items `[UPDATE]` against prior briefings and de-duplicate. *Broke:* each run wrote to its own fresh `claude/*` branch, and nothing merged to `main`. The next run read `main`, found only `.gitkeep`, and declared itself the "first edition" every time (28/29 explicit, 29/29 effective). One date ran 3 times. The prompt's memory feature was dead for 4 weeks and nobody noticed, because each output looked correct on its own. *Taxila:* the Conductor's day cycle and parent digests must write state to a store the next run actually reads (Neon). Add a gate asserting run N+1 saw run N, by counting rows rather than trusting the prose. This is the same family as Meera's `never-scheduled`.
- **R-2 Silent mock fallback makes "end-to-end works" meaningless** (`naukri`, `lib/adapters/internal-llm.ts` lines ~497–558, `final-deep-audit.md`). *Tried:* every provider (Astra, Llama, Athena, Qdrant, embeddings) falls back to a mock on failure so the demo always completes. *Broke:* at audit, the vector store, query engine and embeddings were all mock and both LLMs were "degraded from this environment", yet the analyst loop "completes end-to-end". A pass no longer says anything about the real system. *Taxila:* fallbacks must be loud. Tag each response with its served lane and assert the lane in evals, as Meera's `last_served_model` does. A mock must never be reachable in production builds.
- **R-3 In-process `Map` for conversation memory and the run cache** (`naukri`, `lib/conversation/memory.ts`, `run-cache.ts`). *Broke:* both are lost on restart and not safe across instances or tabs. Rated **high** severity by the project's own audit (§10.1). *Taxila:* Azure Container Apps scales replicas, so session/lesson state lives in Postgres and nothing lives in module scope.
- **R-4 Client-orchestrated multi-step pipeline** (`naukri`, `architecture-audit.md` §1b). *Broke:* 18 requests per 3-step query, the full context re-posted each time, and the client-side step timeline "can drift from backend reality". *Fix adopted:* a server `runId` cache. *Taxila:* the Director orchestrates server-side and streams state. The client renders, it does not drive.
- **R-5 Auth removed, routes unauthenticated** (`naukri`). Empty `app/api/auth/` and `lib/auth/` directories. "All routes are currently unauthenticated" (high), "No rate limiting" (high), "No multi-tenant isolation" (high). *Taxila:* identity is an authenticated child id from day one, with a rate limit on every model-spending route.
- **R-6 Raw server-error leakage** (`naukri`, `architecture-audit.md`). `serverError()` returned raw errors. This was fixed to "`500` with sanitized public error body and correlation id" (`final-deep-audit.md`).
- **R-7 Turbopack dev flag added for perf then reverted** (`naukri@5b3e5aa` → `81ac44c`). The reason is not recorded. *Lesson for logging:* a revert without a reason is a rejection that will be retried.
- **R-8 react-force-graph-2d dropped** (`naukri@5b3e5aa`, "remove unused react-force-graph-2d"). The graph explorer was rebuilt as an SVG/canvas component (`0132394`). Low value.
- **R-9 Silent context compaction** (`naukri`, `context-compaction.ts`). This is a design risk, not a measured failure here. It degrades in four stages, dropping relationships, columns, tables, previous SQL and descriptions, and only logs `before/after`. Meera measured that silent truncation once removed the crisis helplines. *Taxila:* budget overflow throws, and drop order is declared per block (drop-priority manifest), never inferred by a generic ladder.
- **R-10 Two mic consumers** (`echo`, README "One microphone, two outputs"). *Tried (implicitly):* a recorder and a recogniser side by side. *Broke:* "iOS audio sessions are exclusive, and on Android the second opener gets silence". *Fix:* one capture session that persists audio while recognising. This is stated, not measured in the repo. *Taxila:* the realtime voice lane and any local VAD or recorder must share one `getUserMedia`/AudioRecord stream.
- **R-11 Android recogniser truncates on silence** (`echo`). It ends a continuous session after a long silence. *Fix:* restart with a session offset and a cap of 12. *Second trap:* restarting with `persist: true` "would open a second writer and truncate the first file".
- **R-12 Recogniser never emits `end`** when stopped during a network round-trip, leaving the user on a spinner with an unsaved note. *Fix:* a 4 s watchdog resolves with what exists.
- **R-13 Finalising on one signal** gives "either a truncated transcript or a zero-byte file". Wait for both.
- **R-14 Nullable / `anyOf` output schemas** were judged less reliable than flat non-nullable schemas with `""`/`0` sentinels (asserted, unmeasured).
- **R-15 Magic links** were rejected for 6-digit email OTP: deep-link plumbing, and the mail may be opened on another device.
- **R-16 Cache directory for recordings** was rejected because the OS evicts cache under pressure and "losing the audio half of a note the user believes is saved is not a recoverable failure".
- **R-17 Caching a rejected DB-open promise** would "brick the session". `getDb()` resets on failure.
- **R-18 Dependency and platform caveats** (`echo`, README "Known constraints"). `expo-speech-recognition` is published for SDK 56 but used on SDK 57 (pinned deliberately). Speech recognition does not work in Expo Go. Segment timings are available only on Android API 34+ with on-device recognition. Gmail scopes need Google verification. CI needs `npm ci --legacy-peer-deps` because a transitive react-dom peers on a newer React.
- **R-19 Not trusting model JSON** is a rejection of the "structured outputs means safe" assumption: "a client that trusts a model's JSON without checking is one bad response away from a crash" (`orchestrator.ts`).
- **R-20 Gate silently skipped by `except ImportError`** (`@prime`, SESSION-LOG). `verify_variance_identity.py` section I was skipped whenever an import was missing, so the paper printed a wrong bound (3.3e-6 against a true 4.23e-6) for several versions. *Taxila:* a gate whose dependency is missing must fail, never skip. Same family as Meera's `gates-that-live-nowhere`.
- **R-21 Determinism mistaken for correctness** (`@prime`). A prior audit's "to the last digit" check of a density table "only proved seed determinism" of a single seeded Monte Carlo draw. It was replaced with a deterministic computation implemented twice independently (cells agree to 1e-6). *Taxila:* a re-run that matches is not a check of truth. Kit answer keys need independent derivation (blind solve), not re-run equality.
- **R-22 CI jobs that never ran, cited as evidence** (`@prime`). The Lean formalisation CI jobs "have NEVER RUN". `ci.yml` triggered on main/PR, and the Codex branch had no PR. The only build evidence was a self-authored release log. The rule recorded was "MUST build locally before ANY claim".
- **R-23 Overclaim language** (`@prime`). External review forced "certified" to become "validated enclosures with explicit analytic error bounds", "partial answer" to become "contributing computational evidence toward", and "entire function" to be corrected (it has poles). *Taxila:* parent-report language needs the same review. "Understood fractions" is a claim, and "answered 4 of 5 near-miss checks correctly" is evidence.
- **R-24 Verifier proves soundness but not sharpness** (`@prime`). Inflating every radius 1000× still passed. A gate that cannot fail in one direction is half a gate. Meera's version of the rule is "a gate which always suppresses is an outage, not a gate".
- **R-25 Percentage IntersectionObserver threshold** (`@prana`, `components/Reveal.tsx`). A percentage threshold "never resolves for an element taller than the viewport (a phone reading a full-height section would wait forever)". Use threshold 0 with a −10% rootMargin. A stagger above 240 ms "reads as the page loading, not as rhythm".
- **R-26 Committed build output and mock-as-product** (`shivaji_sarthi`). About 350/399 tracked files are `.next/`, and the "AI insights updated every 6 hours" subtitle sits over three hardcoded strings. There is no backend. Do not mistake it for a working analytics product.
- **R-27 Repository move planned then reversed** (`vyakti-product@9fddcd2` `docs/TRANSFER.md`, then `html-portfolio@16fae19f` 2026-09-14). The Meera work was to move into `Vyakti-products`. The owner reversed it ("Vyakti stays in this repo and Meera moves out"), and `vyakti-products` remains with 0 commits. The manifest's durable insight is what a push does not move: gitignored `api/_config.js`, repo-settings Actions secrets, and the Vercel project's repo link, "each would fail quietly". It also notes that GitHub registers `schedule:` triggers only from the default branch. *Taxila:* the Vercel → Azure move needs this manifest.

### From the vyakti-product companion branch (Meera, 2026-08-18..20)

These are cross-references to html-portfolio `context/`. They are listed because they bear directly on Taxila.

- **R-28 Second prompt assembler missed safety rules** (`@8d28ee5`). The call lane hand-assembled its prompt and never called `compile()`. The live prompt had **no `AGE_TIER_SAFETY_OVERRIDE` and no `FORGET_DECISION`**: "A minor's romance-register refusal has never reached the realtime lane." Recall was also always `""` because `recallRef.current` was read in the same synchronous tick as its `.then()`. *Taxila:* one `compile()` for every lane is already law. Add an import-diff gate so a second assembler cannot return.
- **R-29 Workflow file invalid for nine days** (`@112fc7d`, `@d22a0e1`). `if: ${{ secrets.X != '' }}` at job level invalidates the whole file, and zero jobs run, the reporter included. Gate: `check-workflows.mjs` (A38).
- **R-30 One-direction index check** (`@112fc7d`). `--check` validated that every node has prose, but not that every prose entry has a node. 16 entries, "disproportionately the newest and highest-value rejections", were invisible to the graph query. *Taxila:* `scripts/context.mjs --check` must check both directions.
- **R-31 Gates that live nowhere** (`@5d00719`). The documented gates lived in an ephemeral scratchpad, and one verified a frozen persona bundle: "A gate reading months-old bytes is worse than no gate, because it lies in the safe direction."
- **R-32 Sanitiser ate her words** (`@2d5ad85`). A roleplay-strip regex turned "yeh **sach** mein hua" into "yeh * * mein hua", and a phrase splitter cut at every full stop ("meera-silk." "vercel."). Every gate asked "is the markup gone", and "a sanitiser returning "" would have scored full marks." *Fix:* `mustSay` assertions so the speaker's own words must arrive at the engine. There were eleven text-to-audio paths, not three.
- **R-33 Units bug in a lifecycle field** (`@9732c9c`). `goAway.timeLeft` is a protobuf Duration in **seconds** but was parsed as ms, a 1000× error that was inert until something consumed it. *Taxila:* realtime session rotation should rotate on the same model and voice, never cross-family fall back mid-lesson ("a different woman answering").
- **R-34 Shared credential between research and production** (`@e381bf2`). A research run exhausted the only OpenRouter key, and production degraded silently: TTS fell to the free pool, then device TTS, so the voice changed mid-call. "An experiment is bursty and finishes, a product is continuous and cannot." *Taxila:* separate Azure deployments or keys and quotas for evals and production, plus a balance/quota alarm on production.
- **R-35 `--dry-run` still spends** (`@05a57c8`). The flag skipped the write but not the LLM call. *Fix:* dry-run paths that never call the model, and dry-run as the default.
- **R-36 Widening a PK breaks every `ON CONFLICT` naming it** (`@9088011`, `@8f58ba6`). Ten upsert sites, seven inside `.catch()` swallows, would have silently stopped writing. "A default fills a value and an arbiter needs an index." The fix was transitional compat unique indexes. Migration 010 then exposed 13 writers that named no `agent_id` (`@072a2dd`).
- **R-37 Nothing scheduled ever ran** (`@a084edd`). Workflows existed only on a non-default branch, so scheduled runs all-time were 0 and the derived memory layer was empty in production. "A deploy is not an execution and a committed cron is not a scheduled cron." This is the same mechanism as R-1.
- **R-38 Dead writers** (`@a084edd`, `@eb4e9d1`, `@b1aca68`). Correct code with no caller looks identical to absent code: a declared enum `voice_v0` that nothing wrote, a `selfBundle` that nothing set, and a `sourceStatus: "wired"` string "checked by nothing". Assert by **row count**, never by inference.
- **R-39 Life scoped per listener** (`@a084edd`, `@60775aa`). The AI's improvised self-facts were locked per *person*, so two users could hear contradictory versions. Fixed by agent scope. *Taxila:* the tutor persona's backstory must be one canonical, agent-scoped record, because classmates compare notes.
- **R-40 Drop-priority direction inverted in the spec** (`@36ca669`, `@ae53c70`). Read backwards, the newest low-value blocks would have been the most protected and recall would have been dropped. The renumber was landed alone, proven byte-neutral, and permutation-asserted.
- **R-41 `git add -A` with workstreams mid-edit** (`@27c92f7`, `@9d522e1`). CI went red on half-written source. *Fix:* path-scoped `git add`, and compile the **staged** tree (`checkout-index` into a temp dir), not the working tree.
- **R-42 Byte-identity cited as a persona guard** (`@b1aca68`). It compares two implementations reading the same persona file, so both move together. Only invariants guard persona content.
- **R-43 Vision claims with no correction path** (`@f05b2fb`). The photo lane writes **no content-bearing claim** to facts, because visiongate measured 10–11% fabrication and no nightly pass could ever correct a photo-content claim. Separately, item-scope forget deleted the description but left the JPEG in storage. *Taxila:* a homework photo is evidence for this turn, not a stored fact about the child, and forget must reach the blob.
- **R-44 Rupture never closes** (`@f05b2fb`). `rupture_open` cleared only on the user's repair signal, so it became a permanent grudge capping relationship stage. This was hidden because the table had zero rows. *Taxila:* emotional OS states must lapse, separating a permanent RECORD from a STANCE that expires, and never put a repair burden on a child.
- **R-45 Lexical-only forget matching** (`@bde53ca`). A regex per stored term misses Hinglish restatements ("woh ladki", "us waali"). Fix at mutation time, never by recall-time filtering. LoCoMo is rejected as a benchmark (6.4% key error, a lenient judge).
- **R-46 Transliteration front-end not built** (`@1c8ad5f`). In answer to the PhysicsWallah code-mixed TTS approach: speech-to-speech has no text step to transliterate, IndicXlit is about 90%, and pronunciation correctness differs from accent identity. Also, the pitch anchor is broken as a filter.
- **R-47 The em-dash was specified behaviour** (`@71abb8b`). Three persona rules demanded the dash on calls, and the text ban exempted calls. "There was no point in this codebase where text stopped being TEXT and became SPEECH." The seam was the fix.

---

## 6. Concepts

- **Local-first with layered optional backends** (Echo). The core loop works with nothing configured, and each backend (sync, assistant, calendar) is independent and optional. *Taxila:* a degraded-network lesson mode where the child can still practise. Modules and kits are cached, and attempts queue for sync.
- **One stream, two outputs** (Echo). Never let two components own the microphone.
- **Finalise on both signals** (Echo). An async capture is done only when every producer has reported, with a watchdog for the one that never does.
- **The device owns identity and time for offline rows** (Echo). Client UUIDs and client `updated_at` as the conflict key, with "dirty local beats server".
- **Accent semantics** (Echo). Each colour has exactly one meaning, so state reads without labels.
- **The model writes words, code writes numbers, the validator traces numbers** (naukri). This is the core of honest parent reporting.
- **Allow-list projection before any external model call** (naukri). Build the outgoing context field by field.
- **Lint as a safety boundary** (naukri). Forbidden capabilities fail at `eslint`, not at review.
- **One retry with machine feedback, then fail closed** (naukri). This bounds cost and avoids infinite self-repair.
- **Honest-fail UI** (PranaWatt). Refuse to show a flattering number below an evidence threshold, and test the threshold.
- **Misconception-first explainers** (prime-sum). Every explainer carries "The thing people get wrong" and "what's still open".
- **Fail-closed verification with negative controls and mutations** (prime-sum, Meera). A gate is trusted only after it has been seen to fail.
- **Memory must be read back, not just written** (CBAM routine, Meera never-scheduled). A scheduled job's state is real only if the next run demonstrably consumed it.
- **Manifest before migration** (TRANSFER.md). Enumerate what the transport cannot carry, before moving.

---

## 7. Gaps / unread

- **`hihi@echo` UI screens not read line by line:** `app/(tabs)/*.tsx`, `app/capture.tsx`, `app/note/[id].tsx`, `src/components/*` (Waveform, AudioPlayer tap-to-seek, Shimmer, NoteCard swipe), `src/services/googleApi.ts`/`googleAuth.ts`, `src/db/notes.ts`/`hooks.ts`. Only the capture, DB, sync, orchestrator, auth, edge functions, schema, CI, tokens and app.json were read.
- **`hihi@prime` / `@codex-races`:** the mathematics, LaTeX, Python certification scripts, the Lean formalisation tree on the Codex branch, and the explainer HTML bodies beyond their headings. Only SESSION-LOG grep hits were read for rejections.
- **`hihi@ncr`:** the scraper code (`ncr_leads/*`), data and docs were not read beyond `CLAUDE.md` and the branch log.
- **`hihi@prana`:** HeroScene, GSAP narratives, `lib/calculator.ts` in full, `app/api/lead/route.ts`.
- **`naukri`:** not read in full: `assembler.ts`, `relevance-ranker.ts`, `dimension-resolver.ts`, `graph-traverser.ts`, `intent-parser.ts`, `re-angler.ts`, `result-evaluator.ts`, `external-llm.ts`, the three post-validators, the Neo4j store, seeds, admin UI, chat UI, and the remaining ~1,200 lines of `final-deep-audit.md` (only the snapshot, pipeline, security, caching, memory and limitations sections were read). Test files other than `followup-detector.test.ts` were not opened (`turn-merger`, `dimension-resolver`, `dialect-normalizer`, `sql-business-validator`).
- **`routine_carbonsettle_intel`:** only 3 of 29 briefings were read past their headers. The routine's prompt or config is not in the repo, so the exact memory instruction it failed to honour is inferred from the briefing headers.
- **`vyakti-product` companion branch:** none of the 769 files were read except `docs/TRANSFER.md` (head), `scripts/check-workflows.mjs` (head) and `api/_gkeys.js` (header plus a secret scan). The code is superseded by html-portfolio, which other segments harvested. Commit bodies were read in full (60 commits). I did not check whether every rejection in those bodies has a row in html-portfolio's `context/graph.json`, beyond spot-checking 10 ids.
- **Not measured by this harvest:** Echo's flat-schema reliability claim, its Android restart behaviour, and the single-stream claim. None of these has data in the source repo either.

## Verification

Adversarial pass over 20 claims. Every path exists at its cited ref (checked with `git show <ref>:<path>`), so existence is not the issue. The problems are portability, a few overstated behaviours, and one claim (A12) that the code contradicts. No secret values were seen. Only names appear in `vyakti-product@9fddcd2:docs/TRANSFER.md` and `hihi@2033e98:.env.example`. No tests exist for any hihi item.

| id | exists | impl | entanglement / portability | Q | verdict |
|---|---|---|---|---|---|
| A1 | yes (482 lines) | yes | `expo-speech-recognition`, `react-native-reanimated`, an Expo file-storage module. Not Vite/Capacitor. The restart cap of 12 and the 4s watchdog are real, but Android `EXTRA_*` silence flags are Expo-specific. No tests, and the harvest notes admit no restart data exists. | 3 | **idea** (re-derive on Web Speech or Capacitor speech-recognition) |
| A2 | yes | yes | 3 lines: `sqrt(clamp(v,0,8)/8)`. The -2..10 scale belongs to expo-speech-recognition volume events. Azure realtime in a browser uses WebAudio RMS, so the constants do not transfer. | 2 | **idea** (use sqrt-compression of RMS, retune) |
| A5 | yes | yes | `expo-sqlite`. Capacitor needs `@capacitor-community/sqlite` or IndexedDB. The `user_version` migration loop is ~15 lines of pattern. | 3 | **idea** |
| A6 | yes | yes | Hard-wired to the supabase-js client and Expo FileSystem. Last-writer-wins on client clocks is vulnerable to clock skew (a child's tablet clock). A failed push is only marked 'failed', and I did not confirm anything retries it. | 3 | **idea** (use server-assigned versions for Taxila) |
| A7 | yes | yes | RN `AppState`; the browser equivalent is `visibilitychange`. The backoff and re-entrancy guard are generic and small. | 3 | **idea** |
| A8 | yes | yes | Specific to the action-item shape (`VALID_KINDS`, `dueAt`). About 30 lines. The principle is sound, but Taxila should do this with its own contract validators in `shared/contracts.ts`. | 3 | **idea** (the claimed "copy" is wrong: it is note-specific) |
| A9 | yes | yes | Uses `@anthropic-ai/sdk`, `ANTHROPIC_API_KEY`, `output_config.effort`, and the Anthropic `stop_reason==='refusal'`. That violates Taxila's Azure-only directive and its Deno edge runtime. Only the flat non-nullable schema idea ports (Azure strict json_schema wants every field required). | 3 | **idea** |
| A10 | yes | yes | Depends on Supabase `auth.uid()` and `storage.buckets`/`storage.foldername`. Neon has no `auth.uid()`, and Azure Blob has no RLS. Policy is owner = uid, but Taxila's access model is parent → child, so the policies do not map. The 4-verb split and client-UUID PK are the only portable parts. | 2 | **idea** |
| A11 | yes | yes | Supabase storage download with the caller's token. The STT fallback calls public OpenAI `whisper-1`, not Azure. The principle (read media as the caller) is right, but nothing can be copied. | 2 | **skip** (keep as a design principle) |
| A12 | yes | **no, it does not do what is claimed** | `requireAuthHeader` only checks that the header starts with `Bearer ` and is non-empty. It never verifies the JWT. The Supabase anon key is itself a Bearer JWT, so a leaked anon key passes this check, which is the exact threat it claims to stop. CORS is `*`. | 1 | **skip. Do NOT copy**; it gives false assurance. Taxila must verify the child/parent session server-side. |
| A13 | yes | yes | A thin wrapper over Supabase `signInWithOtp`/`verifyOtp`. The OTP generation, hashing and rate limiting live inside Supabase and are not in this repo. | 2 | **skip** (Taxila must build its own OTP; only the "OTP over magic link" decision is reusable) |
| A20 | yes (61 lines) | yes | Needs `"use client"` removed. It depends on `.reveal` / `.is-in` CSS in `globals.css`, which is not in the file. Reduced-motion is handled in that CSS, not in the component as the claim says. IntersectionObserver config is correct. | 3 | **adapt** (small; bring the CSS along) |
| A23 | yes | partial | The hydration flash is **not fixed**: the default is `hi` and `localStorage` is read in `useEffect`, so it flashes. `<html lang="en">` is hard-coded. `next/font` is Next-only (Taxila uses Vite). The strings are political-analytics copy. | 2 | **skip** (a roughly 40-line provider is faster to rewrite; do not inherit the bug) |
| A25 | yes | **partially** | Typed to `ContextPackage`/`QueryResult`/SQL iterations. `template-filler.ts` is 560 lines. In `insight-validator.ts` an untraceable narrative number is only severity **"warning"**, and `sanitizeInsightNarrative` drops sentences only for "error" issues. So hallucinated numbers are **flagged but not removed**, which contradicts the claim. The number regex also treats years and ids as numbers. | 3 | **idea** (build model-never-writes-a-number with fail-closed stripping) |
| A26 | yes | yes | Tied to the `ContextPackage` type and its 100-line builder. It is an explicit allow-list, so new fields are dropped by default, which is good. It still passes `sample_values`/`dimension_values`, i.e. real data values. "Raw rows never leave" is true, but values do. | 3 | **idea** |
| A27 | yes | yes | A process-local `Map` with a 10 min TTL, unsafe on serverless (separate instances) and unbounded. The claim already says to use Postgres. About 60 lines, so nothing to copy. | 2 | **idea** |
| A28 | yes | yes | Hard-wired to SQL adapters (`external`/`internal`/`engine`, `validateSQL`). "Retry once with validator errors appended, then throw" is about 15 lines. Counters are named `total_astra_calls`. | 3 | **idea** |
| A30 | yes | yes, but narrow | The ESLint rule only restricts named imports of 3 S3 write commands from 2 packages. It would **not** catch `require`, dynamic `import()`, `fetch` to a banned base URL, or namespace imports. Banning `@anthropic-ai/sdk` or elevenlabs needs `paths` entries without `importNames`, plus a grep gate on `package.json`/env URLs. | 2 | **idea** (re-write; the `@safety` header convention is cosmetic) |
| A37 | yes | yes (document) | A Meera-specific git-remote move manifest. The structure (what git cannot carry: gitignored config, CI secrets, host project link, schedule-from-default-branch) transfers. Its Vercel→Azure content does not. Secret names only, no values. | 3 | **adapt** (template for a Vercel→Azure Container Apps manifest) |
| A38 | yes (89 lines) | yes | Pure Node, no dependencies, standalone. It is a 4-space-indent line scanner, so it relies on conventional YAML formatting. The ILLEGAL list matches GitHub's job-level `if` context rules. The wiring into `verify-release` is real (`verify-release.mjs:53`). I did not locate the negative test it claims. | 4 | **copy** (only if Taxila has `.github/workflows`; paths are relative to cwd) |
| A39 | yes | yes | `verify-voice.mjs` (655 lines) greps Meera-specific files (`api/speech.js`, `liveCall.ts`, `WatchEngine.java`, `useCallEngine.ts`) and Gemini voice names (Aoede/Leda), which are non-Azure. I found no `mustSay` in `spokenText.ts`, so that part of the claim is unverified. The "mirror the constant, assert agreement" idea is sound. | 3 | **idea** (small Taxila script: one voice constant, assert all lanes agree and declare their model) |

### Net
- Only A38 is a true copy, and A20 and A37 are small adaptations. Everything else is a pattern to re-implement.
- A12 is wrong and should be dropped. A25 overstates the behaviour (hallucinated numbers are warnings, not stripped). A23 does not fix the hydration flash it claims to fix. A30 is too narrow to enforce the Azure-only rule as written.
- Anything from hihi is Expo/Supabase/Anthropic-bound. None of it runs in Taxila's stack without a rewrite.
