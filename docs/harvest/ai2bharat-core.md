# Harvest: ai2bharat-core

Segment id: `ai2bharat-core`. Harvested 2026-10-02. Source repo: `/home/user/ai2bharat` (GitHub `raghavsharma2003/ai2bharat`, private). The repo was only read, through `git show`, `git ls-tree`, `git log`, `git diff` and `git archive` into a scratch directory. Nothing was checked out, committed or pushed.

| | |
|---|---|
| `@main` | `origin/main` = `a11c521` (2026-09-14, "Round 21 logged …"). It has 79 commits and is a **re-rooted history**: its root is `c63efe0` (2026-09-13, "Safar: the ladder drawn in the studio…"). It shares no git ancestry with the four branches below. |
| `@community` | `origin/claude/ai2bharat-community-u6o28e` = `df2866c` (2026-09-01). 249 commits, root `4083c09`. |
| `@opp` | `origin/codex/opportunity-ingestion` = `22ce046` (2026-09-01). 199 commits, root `4083c09`. |
| `@rlhf` | `origin/codex/rlhf-learning-onboarding` = `fe6ac72` (2026-09-01). 240 commits, root `4083c09`. |
| `@neon` | `origin/codex/neon-member-platform` = `2e72358` (2026-08-28). 19 commits, root `0dd1bc2` (the 2026-08-27 baseline). |
| Branch value | The file trees on all four branches are **path subsets of `@main`**. `comm` over `ls-tree` found 0 files that exist only on a branch. So the branches add value only as **history**: their commit bodies are the only place many rejections and measurements from 2026-08-27 to 09-01 survive, and `git diff @rlhf @main` shows how the prompt evolved (for example, the "ask before telling" slot that had no bound). Most `@neon` commit bodies are empty, and its migrations are byte-identical to `@main`. |
| Not in my segment | `origin/r21/*` (e0, e1, e2, f1, m1, m2, m3, m4) are merged into `@main` and belong to another segment. |
| Secrets | No `.env`, `_config.js` or keyfile is tracked. `.env.example` holds placeholders only, plus long comments. `tests/support.test.ts:877` holds one secret-*shaped* string (an `AIza…` literal). It looks like a synthetic redaction-test fixture. I did not copy it, and I recorded it here only as "secret-shaped string present". `README.md` and `context/registry.json` R-001/R-013 record that a production DB password was once shared outside a secret manager and has since been rotated. |
| Licence | Platform code (`app/`, `components/`, `lib/`, migrations) is **AGPL-3.0**. `evals/` and `tests/` are **Apache-2.0**. Lesson content is **CC BY-SA 4.0** (`GOVERNANCE.md@main`). Copying platform code into Taxila is fine only because the same owner holds the copyright and can relicense. Confirm there are no third-party contributions before you port. |

Ref shorthand used below: `path@main` means `origin/main@a11c521`.

---

## 0. TL;DR for Taxila

**What it is.** AI2Bharat is a production Next.js + Neon community. It teaches adults in Bharat AI human-feedback work (rubrics, pairwise ranking, factuality, Hinglish language judgement) in English and Hindi. The catalog has 21 pathways, 164 lessons and 46 quests across five levels of *content*. Inside every lesson sits an AI learning guide called **Saathi**, and Saathi is the most heavily engineered and measured part of the repo:
- a byte-stable prompt compiler;
- a server-side academic-integrity stage gate;
- 13 fatal mechanical output gates plus 4 rewrite rules, each paired with a negative-control battery;
- a six-kind, no-affect, member-visible memory;
- Hinglish push-to-talk voice input that is never auto-sent;
- a photo-of-homework path with an EXIF strip done by canvas re-encode and a fabrication gate;
- a paid-model-lane assertion;
- a DB-backed daily spend cap.

Every one of these has a measurement or a written rejection behind it.

**Why it matters more than any other non-voice repo.** It is the only repo in the estate that solves *teaching* rather than *companionship*. It shows, in shipped code, how to turn the Meera companion's relational engine (honorific arc, name use, bubble pacing, memory ranking, register shapes) into a tutor. It records the **six deliberate inversions** that make a companion into a tutor, and it measures what breaks when they are skipped. Its learning loop and check-authoring rules also do something Taxila's goal 2 needs: they detect understanding *without test-like scoring*. The loop is recall → worked example → calibration → changed-situation transfer → work sample → three self-checks. The check rules are near-miss distractors, first-try-vs-eventual correctness, and a level check that blocks nothing.

**Three places where AI2Bharat deliberately refuses what Taxila wants.** Each one has a written reversal condition, and Taxila must either meet that condition or consciously overrule the decision:

1. **No affect is ever stored** (D-057, `lib/saathi/memory/never-store.ts`, plus a DB CHECK in migration `202608310022`). Distress is read *per turn*, changes the reply, and is never written down. Taxila wants an emotional OS that bonds with the child over months. Reversal: *"a measured teaching benefit that cannot be obtained from the six existing kinds, AND a way to show an affect row to a learner that does not read as a judgement of them, AND a reviewed answer to who is accountable for that judgement."*
2. **Live voice calls are "declined, not deferred"** (D-061). Two reasons are given. First, "a realtime lane has twice been measured to drop rules the text lane keeps — once a safety rule, once recall". Second, a cascade floor of about 1.4–1.5 s. Taxila is gpt-realtime-first. Reversal: *"a realtime lane accepts the same compiled CORE bytes as the text lane, proven by a byte-identity assertion."* `lib/saathi/lane-identity.ts` is the digest mechanism to reuse for that assertion.
3. **"Saathi may sound like a person and may never be one"** (`boundary.saathi-is-not-a-person`). It has no face, avatar, backstory or cloned voice. A cloned voice is called "a claim of personhood". Taxila plans a human-feeling teacher, and later a video avatar. The AI disclosure, "never deny being an AI", is shared with Meera's own invariants and should survive in Taxila even if the persona does not.

**DPDP flag (repo research, `docs/strategy/05-technology.md@main` §8):**
- A child is anyone under 18. Verifiable parental consent is mandatory; DigiLocker-based verification is the named method.
- **Behavioural monitoring of children is prohibited (s.9(3)).**
- The Fourth Schedule exemption covers schools and creches, not an independent online product.
- Full compliance is due 2027-05-13.

AI2Bharat chose an 18+ declaration gate (migration `202609010024`). Taxila cannot do that. Its emotional OS and covert comprehension detection must be designed against s.9(3) with legal review.

**Top takes:**

| # | Take | From | Use |
|---|---|---|---|
| 1 | CORE/TAIL prompt compiler: byte caps, loud truncation, the learner's turn last, exactly 2 appended-last slots | `lib/saathi/prompt.ts`, `pedagogy.ts` | adapt → prompt-compiler |
| 2 | The answer is never shown to the model, and a server-side stage gate keys on stage as well as intent | `lib/saathi/stage-gate.ts`, `prompt.ts` (TAIL `withheld-because-it-is-a-live-answer`) | adapt → pedagogy/safety |
| 3 | The output-gate family with **discard-never-edit** and an authored fallback (Phase A) | `lib/saathi/output-gate.ts`, `phase-a.ts` | adapt → safety-floor |
| 4 | Negative-control batteries plus the per-model law (n≥300 register battery before any model change) | `evals/saathi/*` | copy → evals |
| 5 | Near-miss distractor authoring rule (right rule / wrong step, wrong source, half applied) | `docs/learning/checks.md` | copy method → covert comprehension |
| 6 | First-try correctness columns, never shown, never revised | migration `202609010021` | copy → db-schema / comprehension |
| 7 | The lesson schema and mastery loop (recall → example → calibrate → transfer → make → 3 self-checks) | `lib/learning-journey.ts` types | adapt → curriculum |
| 8 | Six-kind memory, pull-only recall SQL rank, hard-delete + forget term | `lib/saathi/memory/*`, migration `…022` | adapt → memory-graph |
| 9 | Spaced retrieval 2/7/21/60 days with no `skipped` field | `lib/learning/spacing.ts` | copy → pedagogy/retention |
| 10 | Feature router + DB daily cap that fails closed + paid-data-terms assertion | `lib/ai/router.ts`, `budget.ts`, `lib/saathi/lane.ts` | copy → infra/azure |
| 11 | Outbound shape gate (no re-engagement, elapsed-time, streak or loss language), at both the code and DB layer | `lib/outbound/shape-gate.ts` | copy → parent notifications |
| 12 | The NEVER MANIPULATE four-question audit, written into every gamification file header | `lib/community-progress.ts`, `spacing.ts` | copy as a review gate → gamification |

---

## 1. What this is

### 1.1 Product and stack
- **Stack:** Next.js App Router (a version with breaking changes, per `AGENTS.md`), TypeScript, Tailwind v4, Motion, Phosphor icons, Vercel, Neon Postgres + Neon Auth (Google OAuth + Google-Workspace email OTP), and pnpm. AI runs on Azure AI Foundry. On 2026-09-13 the default Saathi lane became `grok-4-1-fast-non-reasoning` on the `/openai/v1` route; `gpt-4.1-mini` serves feedback and translation, and `text-embedding-3-small` serves embeddings. A Gemini lane is the legacy path, and Sarvam `saarika:v3` handles ASR.
- **Production:** `ai2bharat.com` and `ai2bharat.vercel.app`. The population was tiny: on 2026-09-01 there were "15 onboarded members, 11 learning rows, 0 practice-complete" (`context/timeline.md@main`).
- **Surfaces:**
  - Public: landing, `/learn` + `/hi/learn` (a crawlable lesson library with one EN and one HI URL per lesson), `/guide`, `/languages`, `/pulse`, `/help`.
  - Signed in: Commons (Today · Learn · Work · Messages · More), the Learning Studio, Saathi, My Trail, circles, Discussion, Projects, People, rooms, the Funding Desk, the Action Atlas and the Work list.
  - Admin: `/admin/analytics`, `/admin/community`, `/admin/support` and `/admin/opportunities`.
- **Process:**
  - Founder-driven "rounds" (Rounds 5–21), each executed by parallel agents and logged to `context/`.
  - More than 1,500 tests; Round 13 counted 1,583.
  - Rollback-only migration verifiers.
  - A responsive-audit instrument that checks 2,912 cells per run.

### 1.2 The learning system (`LEARNING.md@main`)
- **Journey:** Awareness → Orientation → Plan → Understand → Observe → Practise → Revise → Make → Connect → Build evidence.
- **Learner levels:** Explore, Starter and Expert. These change the support given, never the person's worth.
- **Ladder:** five levels of **content**: L0 Shuruaat, L1 Buniyaad, L2 Kaam, L3 Mahir and L4 Ustaad (`lib/learning-catalog/types.ts@main` `LADDER_LEVELS`). Two rules govern them:
  - "A level is of content, never of a person."
  - Nothing is locked: `lib/learning/safar.ts` has no function that returns "locked".
- **Quest:** 3–5 consecutive modules inside one pathway, ending in the work sample ("parcha") of the last module. A quest milestone is earned only by finished modules plus a saved sample.
- **A lesson (`LearningLesson`)** has these parts:
  - `outcome` and `why`;
  - 3 `concepts`;
  - `workedExample {brief, weak, strong, reviewerNote}`;
  - `artifactPrompt` and `artifactHint`;
  - `conceptCheck` (recall; 3 options; answer = `concepts[0]`);
  - `transferCheck` (a changed situation; answer = `concepts[1]`);
  - `practice` (calibration, with 3–4 options and a rationale), which lives on the module;
  - 3 visible rubric self-checks.
- **Completion** needs all three checks aligned, 3 rubric ticks and a draft of at least 40 characters, recomputed on the server.
- **Catalog after wave D (14 Sep):** "21 pathways, 164 lessons, 46 quests, 42 with a published rubric, 11 with a worked exemplar" (`context/measurements.md@main`). Each lesson has 335–412 English words of authored text. All content is about AI work for adults (scams/deepfakes, rubric writing, Indic data craft, agents, open models). **None of it is CBSE content.** Taxila can reuse the schema, loop and authoring rules, not the lessons.
- **Evidence states:** Exposed → Practised → Calibrated → Reviewed → Published. Only the first three are live. Reviewed and Published are held off on three human gates:
  - published rubrics (met);
  - a calibration set with κ ≥ 0.6 and ≥ 90% agreement over ≥ 20 items (not met);
  - a named accountable owner (`lib/evidence/owner.ts` ships `null`).

### 1.3 Saathi, the guide
A per-lesson sheet that explains more simply, gives one hint at a time, and asks the learner to explain in their own words. It will not answer a checked step, never scores, and never reviews.

**Request order:** `origin → configured → identity → bounded body → parse → rate limit → stage gate → engine` (`lib/saathi/handler.ts@main`).

**Engines:**
- **Phase A** is authored, offline and deterministic.
- **Glossary-first** answers word questions from authored entries.
- The **hint ladder** answers when the step is checked.
- The **model lane** handles everything else, behind the output gates.

**Humanisation (H1, 2026-08-31):**
- Hinglish register rows written as shapes.
- Per-intent word bands.
- An `aap→tum` honorific at 40 lifetime turns; `tu` is unreachable.
- The learner's first name about one turn in five, never inside a correction.
- Up to 3 bubbles paced 400–900 ms apart, capped at 1.8 s in total.
- A celebration licence: only client-recorded events.
- Pull-only context windows (board exams, results season, Diwali).
- Sound-alike transcription correction.

**Memory, voice and photo:** memory (H2), voice input (H4) and photo (H3) are each described in §2.

### 1.4 Platform pieces relevant to Taxila
- **Neon member platform:**
  - private-by-default profiles;
  - a stable handle with history;
  - ordered 1–4 intents (learn/earn/build/belong);
  - learning sync with optimistic versions and idempotency receipts;
  - RLS everywhere, with writes only through `security definer` functions in `private.`;
  - a Bharat Jeev avatar genome (4,096 deterministic SVG animals).
- **Gamification:**
  - **Sahyog Trail.** Points come only from finished work. It has a permanent level floor and an append-only milestone ledger, synced to the server with a trigger so nothing can fall.
  - **Weekly practice** is opt-in and cannot see last week.
  - **Circles** show presence, never performance, with a 5-member floor.
  - **Spaced review.**
- **Privacy-safe analytics:** opt-in, GPC/DNT honoured, 28-day raw retention, 13-month aggregates, and k≥5 suppression on every cell.
- **AI engine:** a closed feature table (saathi/feedback/translate/embed/transcribe/classify), a $12/day cap from a $5,000 grant, 0.5 of it to Saathi, and a DB ledger that fails closed.
- **The `bol` Indic behaviour benchmark** (`evals/indic-benchmark/`) covers eight behaviour dimensions. Its public predicate file is imported *by* the product's gates.
- **Design system:** `DESIGN.md` covers forest ink on off-white, one vermilion signal, Manrope + Noto Sans Devanagari, the one-viewport shell, 44 px targets and a "matra-safe" Hindi rule. It also has self-hosted fonts for 13 scripts.

---

## 2. Reusable assets

Maturity uses four levels: **shipped-measured**, **shipped**, **prototype** and **spec-only**. "Use" uses four values: **copy**, **adapt**, **idea** and **skip**.

### 2.1 Prompt compiler, persona engineering, safety floor

| ID | path@ref | what | maturity | use | target |
|---|---|---|---|---|---|
| AIC01 | `lib/saathi/prompt.ts@main`, `lib/saathi/contract.ts@main` (`SAATHI_PROMPT_BUDGET`) | CORE/TAIL compiler. CORE (8,000 B cap) is byte-stable and learner-independent, with the two must-fire rules re-appended *after* any trim. TAIL (6,000 B) holds stop rows, authored lesson rows filtered for live answers, `[REMEMBERED]`, `[PHOTO]`, `[WINDOW]` (dropped from the oldest end first) and `[NOW]` (the learner's turn always last). Truncation is reported on the trace. | shipped-measured | adapt | prompt-compiler/persona-engineering |
| AIC02 | `lib/saathi/pedagogy.ts@main` | The tutor sheet as telegraphic `key: value` / `a -> b` rows in sections WHO, REGISTER, HOW-TO-TEACH, ON-A-MOMENT, NOT-BUILT, USING-MEMORY and FLOOR, plus ALWAYS: exactly 2 must-fire-last rules. It includes `firstMoveOnDoubt: ask-what-was-tried -> restate-back -> then content`, `explanationOrder … -> hand-back-the-next-move`, the hint ladder, `onWrongAttempt`, `afterAFeeling`, the closed 8-glyph emoji set and the banned affection set. Every row carries an inline note on what was measured. | shipped-measured | adapt | prompt-compiler + learning/pedagogy |
| AIC03 | `lib/saathi/shapelint.ts@main` | A lint that every sheet row and every memory row must pass. It rejects first-person rows, sentence-shaped rows (`^[A-Z][^.?!]*[.?!]$`), and any segment over 14 words. | shipped | copy | prompt-compiler |
| AIC04 | `lib/saathi/stage-gate.ts@main` | The academic-integrity spine. `checkedStepsForStage` (understand→conceptCheck; practice→practice+transferCheck; apply→rubricChecks) feeds `classifyIntent`, which re-derives intent server-side from regex shapes in English and Hinglish, which feeds the `refusalFor` table. `judge-my-work` and `judge-my-readiness` are always blocked. | shipped-measured | adapt | learning/pedagogy + safety-floor |
| AIC05 | `lib/saathi/output-gate.ts@main` | Fatal gates: empty-200, leaked-answer (literal + normalized), verdict-shaped (EN/HI regexes, with the option-letter fix), ability-praise, unlicensed-celebration, register (Devanagari the learner did not open), emoji-banned / off-vocabulary, cut-off (`endsUnfinished`), and Round-13 question-trim for two intents. Rewrites are limited to stripping non-allowlisted URLs, em/en/double dashes (the ASCII hyphen is preserved) and a second use of the learner's name. | shipped-measured | adapt | safety-floor/honesty + evals |
| AIC06 | `lib/saathi/ladder.ts@main` | Doubt escalation ladder: rung 1 *orient* (re-read named section) → rung 2 *authored constraint* → rung 3 *how options were built* (near-miss explanation) → stop + "a wrong answer costs nothing". The rung is derived server-side from history, rungs are leak-filtered, and the full answer is never a rung. | shipped | adapt | learning/pedagogy |
| AIC07 | `lib/saathi/phase-a.ts@main`, `lib/saathi/local-engine.ts@main` | Phase A: answers from the authored lesson with no model and no network. Retrieval is deterministic: a question shape picks a candidate list, and the first non-leaking authored candidate wins. It is the fallback for every gate trip, missing credential or ledger failure. | shipped | adapt | learning/pedagogy (offline/fallback floor for realtime-voice) |
| AIC08 | `lib/saathi/glossary-first.ts@main`, `lib/saathi/glossary.ts@main` | A word question gets the authored glossary entry verbatim, ahead of the hint ladder. Its provenance is labelled `glossary` or `glossary-other` ("Words from another lesson"). | shipped-measured | adapt | curriculum (CBSE term glossary) |
| AIC09 | `lib/saathi/distress.ts@main` (+ `prompt.ts` `reasoningEffortFor`) | Distress regexes in English, Hinglish and Devanagari, each with negative controls. One list has three callers: the prompt (reasoning OFF on distress), never-store (refuse to write) and the panel (renders the helpline from `copy.ts`, keyed on the learner's words). The FLOOR row names Tele-MANAS 14416 and KIRAN 1800-599-0019. | shipped-measured | adapt | emotional-lens/affect + safety-floor |
| AIC10 | `lib/saathi/context-windows.ts@main` | An authored, month-keyed table (board-exam-season, semester-end, results-and-admissions, Diwali, Eid, hiring-season). It is matched only against the learner's live turn, emits one telegraphic TAIL row, and can never produce a countdown. Results season forces reasoning off as a *policy* ("self-harm risk … peaks"). | shipped | adapt | relational-os (kid calendar: exams, results, holidays) |
| AIC11 | `lib/saathi/register.ts@main` | Honorific as state: `honorificFor(lifetimeGuideTurns)` returns aap, or tum once turns ≥ 40. The type has two members, so `tu` is unreachable. The row lives in TAIL so it never splits the CORE cache. | shipped | adapt | relational-os |
| AIC12 | `lib/saathi/learner-name.ts@main` | First name derived server-side from the profile, re-guarded for injection. TAIL row only. The gate removes a second use and any use inside a correction or refusal; the correction predicate leans inclusive. | shipped | adapt | relational-os |
| AIC13 | `lib/saathi/contract.ts@main` (`SAATHI_MOMENTS`), `lib/saathi/moments.ts@main` | Celebration licence. There are four client-recorded events: first-attempt-after-stuck, work-sample-saved, stage-advanced, returned-after-a-gap. With no `moment:` row, celebration shapes are discarded. Saathi celebrates **events, never quality**, praises method, never ability, and never forecasts. | shipped | adapt | gamification + emotional-lens |
| AIC14 | `lib/saathi/bubbles.ts@main`, `components/saathi/bubble-pacing.ts@main`, `SAATHI_PACING` | Deterministic bubble split *after* the gate: max 3 bubbles, split only above 140 chars, protected spans for URLs, code and quotes. Pacing: 66 ms/char, 400–900 ms, jitter 0.8–1.3, first bubble immediate, total capped at 1.8 s. The model is never told bubbles exist. | shipped | copy | design-system/ux (text chat lane) |
| AIC15 | `lib/saathi/sound-alikes.ts@main` | A 12-pair table of catalog words → their ASR mishearings (`rubric←lubric`, `calibration←celebration`). Pulled only on voice turns whose transcript contains the wrong half, and emitted as one `heard-by-voice:` TAIL row. | shipped | adapt | realtime-voice (CBSE term mishearing table) |
| AIC16 | `lib/saathi/lane-identity.ts@main` | A `promptDigest(core, tail)` that is length-prefixed SHA-256 over the bytes extracted back out of the **serialized wire body**. The handler discards a turn on mismatch (`prompt-fork`). This is the mechanism the realtime-lane reversal condition needs. | shipped-measured (0 forks / 320 × many runs) | copy | prompt-compiler + realtime-voice |
| AIC17 | `lib/saathi/register-predicates.ts@main` → `evals/indic-benchmark/lib/properties.mjs@main` | One shared predicate file (`endsInQuestion`, emoji, Devanagari, em-dash, shortform, word count) used by the public benchmark, the register battery and the output gate, so the gate and the eval cannot disagree. | shipped | copy | evals/gates |
| AIC18 | `lib/support/claims.ts@main`, `lib/support/*` | The help assistant (Sahayata). It answers from a written handbook, and a claims gate runs over model output, canned copy and the *grounding fact set*. Negation-aware. | shipped | adapt | company-brain/knowledge-ingestion (parent help) |

### 2.2 Memory, relational continuity, consent

| ID | path@ref | what | maturity | use | target |
|---|---|---|---|---|---|
| AIC19 | `lib/saathi/memory/kinds.ts@main` | Six closed kinds, each with its own rules: weak-topic (event, 12, decays), misconception (statement, 20, ≤14 words), explanation-style (statement, 1 row, enum example-first/rule-first/smallest-case-first), goal (3), context-given (6, keys calls-me/language/role/studying/works-on/state), term-asked (event, 20). The total cap is 62 = the sum of the per-kind caps. `source` is a closed union, `explicit-learner-statement` or `recorded-learning-event`, and there is no `model-inference`. | shipped | adapt | memory-graph/consolidation |
| AIC20 | `lib/saathi/memory/never-store.ts@main` + migration `202608310022_saathi_memory.sql@main` | The no-affect boundary in two layers. The app filter reuses the `distressShapes` list. A DB CHECK applies a word-boundary affect vocabulary (EN + romanized + Devanagari) to `note`, and to `subject` for learner-text kinds, plus a verdict vocabulary (score/grade/smart/employable…). Field scoping is deliberate: `trainer-pairwise-rank` contains "rank". | shipped | adapt (Taxila must decide what affect it stores) | memory-graph + safety-floor |
| AIC21 | `lib/saathi/memory/extract.ts@main` | Deterministic extraction with no second model call. Filter order: authored shape → word cap (fail, never trim) → never-store → forget terms → dedupe → cap. At most 2 rows per turn. Includes authored Hinglish shapes for style, goal, context and misconception ("X ka matlab Y hai"). | shipped | adapt | memory-graph |
| AIC22 | `lib/saathi/memory/rank.ts@main` (`SAATHI_RECALL_SQL`), `recall.ts@main` | RANK = salience × RECENCY (decaying kinds fall to a 0.25 floor over 90 days) × (1 + 0.35·ln(1+mentions)) × SPACED (0.6 if recalled <20 h ago, 1.25 if untouched >21 d). The "matched" column is a word-boundary regex against the **live turn only**. One reserved seat goes to the oldest row with salience ≥ 2.0 and is dropped first. A test greps the SQL for any due-branch outside the ORDER BY. | shipped | adapt | memory-graph |
| AIC23 | `lib/saathi/memory/forget-intent.ts@main`, `reset.ts@main`, `route-handler.ts@main`, migration `…022` (`member_saathi_forget`, `saathi_memory_delete*`) | Forgetting has one concept and three doors (one row, everything, stop remembering). Each is a hard delete plus a forget term in one transaction, and no table has `deleted_at`. "ye bhool jao" is classified by narrow authored shapes and acted on **before** the reply. The receipt is three-branch: worked / nothing there / failed. | shipped | adapt | memory-graph + auth/accounts/consent |
| AIC24 | migration `…022` (`member_saathi_consent` + append-only trigger) | Append-only consent ledger with no content column. UPDATE is blocked; DELETE is allowed so an erasure can cascade. | shipped | copy | auth/accounts/consent (parental consent ledger) |
| AIC25 | `components/saathi/saathi-memory-panel.tsx@main`, `saathi-memory-copy.ts@main`, `saathi-memory-line.tsx@main` | Member-visible memory: "every row shown in the words it is stored in", the never-store list printed beside it, and both consent choices at equal weight. The memory line on the home screen shows the top recall row verbatim, before the lesson. | shipped | adapt | relational-os + parent visibility |
| AIC26 | `lib/saathi/handler.ts@main` (`SaathiMemoryDeps`, `noRecallSlot`, `EMPTY_RECALL_ROWS`) | Memory is an injected, optional slot. With memory off, the TAIL is **byte-identical** to a build without memory, and the prompt-budget test asserts it per module, stage and locale ("declining costs nothing"). | shipped | adapt | memory-graph + consent |

### 2.3 Voice, vision, model lanes, AI infrastructure

| ID | path@ref | what | maturity | use | target |
|---|---|---|---|---|---|
| AIC27 | `components/saathi/voice-input.ts@main`, `asr-client.ts@main` | A push-to-talk state machine with **no send event**: idle/arming/recording/transcribing/transcript/error. There is a 45 s self-enforced cap and cancel discards the clip. The sheet probes `/api/saathi/asr` first, so there is never a dead microphone. | shipped | adapt (idea for realtime barge-in UX) | realtime-voice |
| AIC28 | `lib/saathi/asr.ts@main`, `asr-handler.ts@main`, `lib/credential-pool.ts@main` | A Sarvam ASR seam (`saarika:v3`). The pool rotates only on 402/429 or a credit message, not on transport failures, and tries each key at most once. Failures are named (no-key, pool-exhausted, unsupported-audio, size, network, deadline, http_status, empty). No audio is ever persisted. | shipped | adapt | realtime-voice (STT fallback lane) |
| AIC29 | `components/saathi/photo-attach.ts@main`, `lib/saathi/photo.ts@main` | Photo of homework. EXIF is stripped **by canvas re-encode** (pixels only). `createImageBitmap` applies orientation. JPEG/WebP only; HEIC is refused. The same caps are validated on client and route. Nothing is stored. | shipped | copy | multimodal-vision (homework photos of minors) |
| AIC30 | `lib/saathi/vision-gate.ts@main` | Photo predicates. An illegibility claim beside an ungrounded assertion discards the whole turn. Identifiers not found in typed words or the lesson are stripped. Handwriting commentary and transcription are refused. The stage gate withholds the image on checked steps. | shipped | adapt | multimodal-vision |
| AIC31 | `lib/saathi/lane.ts@main`, `lib/model-data-terms.ts@main`, `context/model-data-terms.json@main` | A paid-lane assertion. No provider is built unless `MODEL_LANE_DATA_TERMS=paid` **and** a data-terms record exists (terms URL, date read, `paidTierTrainingUse=false`). An interim unpaid acknowledgement expires after 60 days and marks every trace. Data-terms record R-027: Foundry's default abuse monitoring allows human review, so apply for modified abuse monitoring before sending minors' photos. | shipped | adapt | infra/azure + safety-floor |
| AIC32 | `lib/saathi/provider-foundry.ts@main`, `lib/foundry-pool.ts@main`, `lib/gemini-pool.ts@main` | Foundry `v1` chat lane with a 12 s fuse. It reads `finish_reason` (length → fail) and reports cached tokens and estimated USD on every turn. Paid pools rotate on a daily spend estimate, not on status codes. | shipped-measured | adapt | infra/azure |
| AIC33 | `lib/ai/router.ts@main` | One table maps feature → deployment via `AI2_MODEL_<FEATURE>`, and no model name appears in code. It refuses Saathi by name (Saathi has its own compliance lane), never retries except one 404 fallback, and keeps keys out of traces. | shipped | copy | infra/azure/vercel/deploy |
| AIC34 | `lib/ai/budget.ts@main`, `lib/ai/spend-store.ts@main`, migration `202609130032_model_spend_daily.sql@main` | Daily USD cap per feature from a DB ledger: grain (day, feature), no member column, additive security-definer writer, 60 s hot cache. It **fails closed** to authored content when the ledger is unreadable and never spends on an unpriced deployment. Shares: saathi 0.5, feedback 0.2, translate 0.15, embed/classify/transcribe 0.05 each. | shipped | copy | infra + telemetry |
| AIC35 | `lib/model-spend.ts@main` | Price table, `estimateTurnCostUsd` (upper bound, no cache discount) and env price overrides. | shipped | adapt | telemetry/tracing |
| AIC36 | `lib/saathi/contract.ts@main` `SaathiTrace` | A per-turn trace attached to the response: served-by, gate, degraded reason, digest, cached tokens, usd, elapsed, trimmed flags. It carries no text, and only text-free fields reach analytics. | shipped | adapt | telemetry/tracing |

### 2.4 Learning, pedagogy, curriculum, covert comprehension

| ID | path@ref | what | maturity | use | target |
|---|---|---|---|---|---|
| AIC37 | `lib/learning-journey.ts@main` (types), `lib/learning-catalog/types.ts@main` | The lesson + module + quest + pathway schema described in §1.2, with EN/HI `LocalizedLearningText`, plus the per-module record (`conceptSelectedOption`, `*Aligned`, `*Attempts`, `artifactDraft`, `rubricChecks`, stage, status). | shipped | adapt | learning/pedagogy/curriculum |
| AIC38 | `components/learning-studio.tsx@main`, `components/learning/public-stop-loop.tsx@main` | The studio's 4-stage loop (understand/example/practice/apply), with the recall rules hidden in a disclosure until the recall is answered (Round 15), plus a public no-account first lesson ending on a shareable parcha. | shipped-measured | adapt | learning/pedagogy + design-system/ux |
| AIC39 | `docs/learning/checks.md@main`, `tests/learning-near-miss-checks.test.ts@main` | The near-miss check rule. A scene prompt of 8–25 words from daily Indian life must not contain the answer's distinctive words. The 2 distractors are near-misses of the same rule (right rule/wrong step; wrong source; half applied). Each distractor shares <60% of the answer's content words, and none equals any concept bullet in the corpus. The rationale names each near-miss by position. A test enforces all of it, with EN/HI parity. | shipped-measured | copy (method) | learning/pedagogy (covert comprehension detection) |
| AIC40 | migration `202609010021_learning_record_truth.sql@main`, `lib/learning-sync.ts@main` | A server-true record: aligned flags are recomputed from the stored option against `correctIndex`. `concept_first_try`, `practice_first_try` and `transfer_first_try` are decided once, never revised, never returned by GET, and never shown. Unearned completions are repaired back to `practising` with a NOTICE. | shipped | copy | db-schema + comprehension signal |
| AIC41 | `lib/learning-sync.ts@main`, `app/api/learning/route.ts@main`, migration `202608290004_learning_journey.sql@main`, `lib/learning/device-journey.ts@main`, `lib/learning/member-journey.ts@main` | Device ↔ account sync with optimistic `snapshot_version`, idempotency receipts (sha256 request hash) and an explicit "use account / keep device" conflict choice. The read merge is monotone, so finished work never disappears. | shipped | adapt | db-schema + android (offline) |
| AIC42 | `lib/learning/ladder.ts@main`, `lib/learning/safar.ts@main`, `docs/learning/ladder.md@main`, `components/safar/*` | Level, quest and band arithmetic (`levelLessonCount` vs `levelQuestBandLessonCount`, with a reconciliation identity), the Safar map and quest/level milestone ids. | shipped | adapt | curriculum (class bands 1–9) + gamification |
| AIC43 | `lib/learning-journey.ts@main` `planPathwayOrderFrom`, `learningRouteReasons` | A deterministic, explainable route plan. It reads only aim + experience + catalog. Every position carries one of 6 bilingual reasons (you-chose-this, builds-the-basics, continues-from, same-family, fits-your-time, open-to-everyone). Nothing is hidden or scored. | shipped | adapt | learning profile / curriculum sequencing |
| AIC44 | `components/safar/level-check.tsx@main`, `lib/learning/safar.ts@main` (`memberLevelCheck`) | A level check: 5 authored questions plus one written answer. It **blocks nothing, scores nothing and writes nothing**, and it marks questions from unopened lessons as such. | shipped | adapt | covert comprehension (diagnostic probe) |
| AIC45 | `lib/learning/spacing.ts@main`, `components/learning/spaced-review-card.tsx@main`, migration `202609010030_member_learning_review.sql@main` | Spaced retrieval over finished modules on 2/7/21/60-day intervals. Outcomes are `kept`/`faded` only, with no skipped, streak or dueSince field. Overdue items are rescheduled forward to today. The item type carries no date. Questions are the authored checks, verbatim. | shipped | copy | learning/pedagogy (retention) |
| AIC46 | `lib/learning/feedback-contract.ts@main`, `feedback-gates.ts@main`, `feedback.ts@main`, `app/api/learning/feedback/route.ts@main` | Criterion-named AI feedback on a draft: 2–4 items of {criterion copied from the lesson, observation, nextStep}. There is no score field. Gates: parse, authored criterion (the authored string is served), verdict/score-number vocab EN+HI, ≤40 words, no >15-word run foreign to the draft and lesson, quote cap, no "write in language X", register, no URL. Discard the whole turn and fall back to authored. Never stored. | shipped-measured | adapt | learning/pedagogy + safety-floor |
| AIC47 | `lib/evidence/rubric.ts@main`, `rubric-catalog.ts@main`, `quest-rubrics.ts@main`, `/learn/rubrics` | Rubrics of exactly 3 criteria with 0–5 anchors in EN/HI, version pins (`id vN`) as composite FKs, and published pages. Each criterion is verbatim a line the quest's lessons teach. | shipped | adapt | learning/pedagogy + evals (parent/teacher view) |
| AIC48 | `lib/evidence/quest-exemplars/*@main`, `docs/evidence/exemplars.md@main` | Worked exemplars beside the rubric: a strong and a weaker artefact for the same brief, with margin notes keyed to criteria (met/partly/not-met chips, no numbers), a fingerprint pinned to `authoredOn`, and the boundary sentence "This is a reference, not an answer…". | shipped | adapt | learning/pedagogy |
| AIC49 | `lib/evidence/calibration.ts@main`, `scripts/evidence-calibration.mjs@main`, `docs/evidence/calibration.md@main` | Cohen's κ + percent agreement + Wilson interval. It prints `SYNTHETIC` on self-test and refuses to repair bad input. | shipped (self-test 5/5) | copy | evals/gates/verification |
| AIC50 | `lib/evidence/states.ts@main`, `gates.ts@main`, `triage.ts@main`, `reviewers.ts@main`, migrations `…020`, `…025` | An evidence state machine (exposed→…→published, withdraw terminal), three human gates read from code, founding-reviewer credentials (named admin, ≤183 days, ≤3 per field), and model triage whose routing type is number-free. | prototype (flag off) | idea | evals + parent/teacher review loop |
| AIC51 | `lib/learning/lesson-translations.ts@main`, `translation-validate.ts@main`, `scripts/translate-lessons.mjs@main`, `content/lesson-translations/*.json@main` | Build-time machine translation into 19–21 locales. Units are keyed by field path against a per-module source hash, and a changed source drops the unit and records it as a `source-changed` gap. There are script-ratio and Latin-leakage checks. Output is labelled "machine-translated beta". | shipped-measured | adapt | curriculum (multilingual CBSE/RBSE) |
| AIC52 | `scripts/probe-translation-quality.mjs@main`, `docs/evals/translation-quality.md@main` | Two-judge translation quality scoring (adequacy/fluency 1–5), stratified sampling, and κ. | shipped-measured | adapt | evals |
| AIC53 | `docs/learning/hindi-terms.md@main`, `tests/bharat-languages.test.ts@main` | A Hindi register glossary (287 strings reviewed) and a "no Latin inside a Hindi string" gate with an allowlist. | shipped | idea | curriculum (Hindi-medium terms) |
| AIC54 | `tests/plain-english.test.ts@main`, `tests/plain-english-sentences.ts@main` | Readability gate: no sentence over 20 words, applied across the lesson corpus and UI copy. | shipped | adapt (kid reading levels per class) | evals/gates |
| AIC55 | `lib/vocabulary-lock.ts@main`, `lib/evidence/vocabulary.ts@main` | "One word per thing" lock: banned phrase patterns matched against rendered literals (comments stripped), plus the "certificate" lock. | shipped | copy | design-system/ux (copy discipline) |

### 2.5 Gamification, retention, outbound, analytics

| ID | path@ref | what | maturity | use | target |
|---|---|---|---|---|---|
| AIC56 | `lib/community-progress.ts@main`, `lib/trail/*@main`, `components/trail/*@main`, migration `202609010023_member_trail_ledger.sql@main` | Sahyog Trail. Points come only from finished work (practice module, project brief, collaboration card); no points for visits, time, streaks or money. The permanent `levelFloor` means no demotion, `CATALOG_V1_MODULE_COUNT` is frozen at 18, and the ledger is append-only with a server trigger. Level names: beej→sthapak. | shipped | adapt | gamification |
| AIC57 | `lib/trail/weekly-practice.ts@main`, `components/trail/weekly-quest-card.tsx@main` | Opt-in weekly suggestions that structurally cannot see a previous week. Load-bearing copy: "Pick one if it is useful. Nothing happens if you skip it." | shipped | adapt | gamification |
| AIC58 | `lib/circles/*@main`, migration `202608310019_learning_circles.sql@main` | Circles: presence, never performance. Opt-in, one tap to leave, a server-enforced 5-member floor, real counts only, no DM. | shipped | idea | group-ai/multi-agent (cohort presence for kids, only if safe) |
| AIC59 | headers of `lib/community-progress.ts@main`, `lib/learning/spacing.ts@main`, `lib/trail/weekly-practice.ts@main`, `docs/strategy/03-retention.md@main` §9 | The **NEVER MANIPULATE** four-question audit: (1) is anything taken away on absence? (2) any nag or shame if ignored? (3) any rank vs others? (4) is the reward inspectable work, not attention? A mechanic passes only if removing fear and obligation leaves it intact. | shipped | copy | gamification + safety-floor |
| AIC60 | `lib/outbound/shape-gate.ts@main`, `contract.ts@main`, `compose.ts@main`, `adapters/resend.ts|smtp.ts@main`, migration `202609010028_member_outbound.sql@main` | Outbound channel (email, with a WhatsApp adapter slot). Four event kinds only. A composer with no free-text parameter. A shape gate refusing re-engagement, elapsed-time, streak and loss language in EN+HI, mirrored as DB checks. No `scheduled_for` and no digest. | shipped | copy | parent notifications (auth/consent + growth) |
| AIC61 | `lib/analytics-*.ts@main`, `components/analytics/privacy-choice*.ts(x)@main`, migrations `202608300009`…`013`, `026` | Privacy-safe analytics: opt-in, GPC/DNT → essential-only, allowlisted semantic events, no typed content, coordinates or UA. 28-day raw retention, 13-month aggregates, k<5 suppression, withdrawal tombstone, a rollback-only verifier. | shipped-measured | adapt | telemetry/tracing (DPDP) |
| AIC62 | migration `202609010022_member_activity_cohorts.sql@main` | A weekly cohort aggregate of counts only, sealed at day 30, answering day-7 and day-30 retention without per-member rows. | shipped | adapt | telemetry |
| AIC63 | `lib/tour/*@main`, `components/tour/spotlight.tsx@main` | Guided tour: 7 "moments" of ≤8 words each, fired only from real product state (a test forbids timers), once per device and once per member, replayable. | shipped | adapt | design-system/ux (child onboarding) |
| AIC64 | `components/share/*@main`, `lib/parcha/*@main`, migrations `…027`, `…036`, `…037` | "Kaam ka parcha": a finished piece of work gets an opt-in public page and a WhatsApp-sized canvas card. Attributable, with no count or rank. | shipped | adapt | growth (parent share of a child's work, consented) |

### 2.6 Accounts, DB, infra, design, process

| ID | path@ref | what | maturity | use | target |
|---|---|---|---|---|---|
| AIC65 | migrations `202608280001_member_platform.sql@main`, `…002`, `…003`, `…006` | Profiles (private default, handle regex, terms version/time pair), journeys with ordered intents, handle history, rooms/messages with fail-closed attachments (scan_state), avatar genome, RLS + revoke + security-definer writers. | shipped | adapt | db-schema + auth |
| AIC66 | `lib/auth/config.ts@main`, `lib/auth/session.ts@main`, `app/auth/complete/page.tsx@main`, `lib/auth-redirect.ts@main` | Neon Auth that fails closed in production when the URL or cookie secret is incomplete (a per-process random placeholder secret). A deterministic `/auth/complete` router exchanges the verifier and routes to onboarding or home. Safe `next=` destinations refuse 21 shapes. A failed session lookup is distinguished from signed-out. | shipped-measured | adapt | auth/accounts/consent |
| AIC67 | `lib/auth/embedded-browser.ts@main`, `components/signin-experience.tsx@main` | Detects in-app browsers (`; wv)`, FBAN, Instagram, WhatsApp, iOS without a Safari token) and hides Google OAuth there, because Google returns 403 `disallowed_useragent`. Email OTP is offered instead. | shipped | adapt | android/capacitor (WebView sign-in) |
| AIC68 | migration `202609010024_member_age_declaration.sql@main`, `app/api/member/route.ts@main` | An 18+ declaration gate: `age_declared_at` only, no DOB collected, never backfilled. | shipped | skip (Taxila needs verifiable parental consent instead) / idea | auth/accounts/consent |
| AIC69 | `lib/request-security.ts@main`, `proxy.ts@main`, `next.config.ts@main` (headers) | Same-origin mutation check, bounded streamed JSON with strict media type, UUID validation before DB casts, per-member rate limits, plus CSP/HSTS/COOP/CORP headers. | shipped | copy | infra/azure/vercel/deploy |
| AIC70 | `scripts/verify-*-migration.mjs@main`, `scripts/apply-neon-migration.mjs@main`, `scripts/check-neon-migration.mjs@main` | Rollback-only verifiers that prove each migration's claims against real Postgres (privileges, triggers, CHECKs). Migrations are applied as a whole file through the Neon WebSocket client, with a branch guard. | shipped | copy | db-schema + evals |
| AIC71 | `context/graph.json|registry.json|timeline.md|measurements.md@main`, `scripts/context.mjs@main` | A durable context memory: nodes/edges, decisions D-###, questions Q-###, risks R-###, a dated timeline, and measurements with n/method/date. The logger rejects credential-shaped values. | shipped | adapt | evals/process (matches Taxila `context/`) |
| AIC72 | `DESIGN.md@main`, `.impeccable/design.json@main`, `app/redesign.css@main`, `app/commons/commons.css@main`, `app/globals.css@main` | Tokens: page `#f4f6f1`, forest `#16342b`, action vermilion `#b8341d`, a semantic dark remap, radii (12 control / 14 card / 20 sheet), the 44 px target floor, 16 px inputs, a one-viewport shell, and the matra-safe rule for Hindi. | shipped | idea | design-system/ux (Taxila is kid-facing; use the discipline, not the palette) |
| AIC73 | `public/fonts/*@main`, `lib/bharat-languages.ts@main`, `app/layout.tsx@main` | Self-hosted fonts for 13 Indic scripts (Devanagari, Bengali/Assamese, Gujarati, Gurmukhi, Kannada, Malayalam, Meetei Mayek, Ol Chiki, Odia, Tamil, Telugu, Nastaliq). A 23-language catalog with BCP-47 tags, native names and direction (ur/ks/sd RTL). | shipped | copy | design-system/ux (i18n) |
| AIC74 | `tools/responsive-audit/*@main` | A Playwright instrument covering surfaces × 18 viewports × en/hi/ur × light/dark, 10 checks (overflow, clipped text, 44 px targets, text floors, empty bands, occlusion, short-viewport reachability, contrast ≥4.5:1, RTL). It writes a ranked defect index and a contact sheet, and has its own test fixtures. | shipped-measured | copy | evals/gates + design-system |
| AIC75 | `lib/avatar.ts@main`, `components/bharat-avatar.tsx@main`, `components/bharat-jeev-traits.tsx@main` | The Bharat Jeev avatar genome: 4,096 deterministic SVG combinations (8 Indian animals × 8 earth palettes × 4 markings × 4 backdrops × 4 moods). Repo-native, with no photo or biometric service, and respects reduced motion. | shipped | adapt | avatar-visual (child profile avatar, no child photos) |
| AIC76 | `lib/funding-catalog/search.ts@main`, `synonyms.ts@main`, `embeddings.ts@main`, `embedding-index.json@main` | Hybrid lexical + 256-dim embedding search with EN/HI/Hinglish synonyms (chhatravritti, sarkari). The normaliser keeps `\p{M}`. Precomputed vectors are committed. | shipped-measured | adapt | company-brain/knowledge-ingestion (lesson search) |
| AIC77 | `app/sitemap.ts@main`, `app/robots.ts@main`, `app/llms.txt/route.ts@main`, `lib/seo.ts@main` | Public lesson SEO/AEO: EN/HI URLs per lesson, reciprocal alternates, `LearningResource` JSON-LD describing only visible text, GPTBot disallowed separately from search bots. | shipped | adapt | growth/seo |
| AIC78 | `docs/strategy/03-retention.md@main`, `05-technology.md@main`, `01-product-audit.md@main` | Sourced research: retention baselines, learning-science technique table, DPDP, Indic stack, voice cost, auto-grading bias. | spec-only | idea | learning/pedagogy + infra |
| AIC79 | `docs/ux/journey-study.md@main` | A "first ninety seconds" study as a Tier-2 first-timer, with 12 ranked frictions, a words-in-fold counter and before/after numbers. | spec-only (method) | adapt | design-system/ux |
| AIC80 | `scripts/export-curriculum.mjs@main`, `docs/curriculum-export.md@main` | Exports the CC BY-SA curriculum as a standalone publishable folder. | shipped | idea | curriculum |
| AIC81 | `lib/learning-features.ts@main` | Feature flags with a written reason per flag; evidenceLadder is held false on human gates. | shipped | idea | infra |
| AIC82 | `evals/saathi/register.mjs@main`, `gates.mjs@main`, `shapes.mjs@main`, `run.mjs@main` | Three batteries in cost order: shapes → gates (every predicate paired with a must-not-trip real string) → register (per-intent word bands, question share per band, emoji, Devanagari, em-dash, shortform, lane health, prompt forks, cost meter). The model arm reports NOT RUN when no paid lane exists. | shipped-measured | adapt | evals/gates/verification |
| AIC83 | `evals/indic-benchmark/*@main`, `docs/evals/bol/*@main` | `bol` benchmark: 8 dimensions (register, code-switch, script fidelity, honest uncertainty, refusal quality, question-vs-statement pedagogy, plain language, cultural grounding), 4 task formats, a canary, contamination checks, judge prompt, eval card. The seed has 132 items. | prototype | adapt | evals (Hinglish tutor behaviour eval for kids) |
| AIC84 | `evals/ai/feedback-cost.mjs@main`, `feedback-script-parity.mjs@main` | Matched-pair EN vs romanised-Hindi pass-rate parity eval and a cost probe. | shipped-measured | copy | evals |
| AIC85 | `supabase/migrations/*@main`, `app/api/discussions|projects|people|rooms|atlas|funding|opportunities/*@main`, `lib/opportunit*@main`, `research/opportunities/*@main` | The adult community and work-marketplace layer: discussion, projects, people, rooms, events, funding, opportunity ingestion with an editorial publication door, and historical Supabase. | shipped | skip (out of scope for children; the governance patterns are an idea only) | — |

---

## 3. Key code excerpts worth porting

These are short, verbatim and contain no secrets.

**3.1 The two appended-last slots** (`lib/saathi/pedagogy.ts@main`). The bound inside slot 2 is the measured fix (see §5).
```ts
export const saathiMustFireLast: readonly string[] = [
  "MUST: never give or confirm the answer to a checked step. Hint from the ladder, one rung per turn, then stop.",
  "MUST: ask before telling. The ask opens a turn; close on a statement; the last character is never a question mark.",
];
```

**3.2 Pedagogy rows written as shapes, not lines** (`pedagogy.ts@main`):
```ts
"firstMoveOnDoubt: ask-what-was-tried -> restate-back -> then content",
"explanationOrder: plain-restate -> one-anchor -> smallest-case -> hand-back-the-next-move",
"doubtEscalationLadder: rung1 orient-where-to-look -> rung2 authored-constraint -> rung3 how-options-were-built -> stop",
"onWrongAttempt: name what the attempt got right first, then the one thing to redo",
"onCorrectAttempt: ask for the reason, not more praise",
"afterAFeeling: one turn only -> prove you took in the actual thing -> name the work-shaped part -> hand the floor back",
"comprehension-tag: samajh-aaya, samjhe, clear-hua, got-it, makes-sense, theek-hai-na",
"comprehension-tag-never: as a closing line; it asks nothing and teaches nothing",
"distress: acknowledge -> no diagnosis -> point to a person: Tele-MANAS 14416 or KIRAN 1800-599-0019, free, 24h; no reasoning-mode, no analysis",
```
*Taxila note:* before reuse, verify that the KIRAN number still operates, because it may have been merged into Tele-MANAS. Unverified. For children, add CHILDLINE 1098 / ERSS 112 after checking them too.

**3.3 CORE assembly: must-fire re-appended after trimming** (`lib/saathi/prompt.ts@main`):
```ts
const mustFire = section("ALWAYS", saathiMustFireLast);
const budget = SAATHI_PROMPT_BUDGET.coreMaxBytes - byteLength(`\n\n${mustFire}`);
const trimmed = trimToBytes(body, budget);
const finalText = `${trimmed.text}\n\n${mustFire}`;
```
In TAIL, the authored lesson rows that would leak a live answer are **omitted**, and the omission is stated:
```ts
if (leaksAnswer(row.value, forbidden)) omitted.push(row.key);
...
kept.push(`withheld-because-it-is-a-live-answer: ${omitted.join(",")}`);
```

**3.4 The academic-integrity map from stage to live checks** (`lib/saathi/stage-gate.ts@main`):
```ts
switch (stage) {
  case "understand": return ["conceptCheck"];
  case "example":    return [];
  case "practice":   return ["practice", "transferCheck"];
  case "apply":      return ["rubricChecks"];
}
```

**3.5 Verdict shape and option-letter fix** (`lib/saathi/output-gate.ts@main`). Under `/i`, `[abc]\b` matched the article "a":
```ts
const optionLetter = String.raw`(?:option\s+[abcABC]\b|[ABC]\b|[bc]\b)`;
// e.g.
/\b(?:your|this)\s+(?:draft|work|sample|answer)\s+(?:is|looks)\s+(?:good|correct|right|fine|ready|complete|enough)\b/i,
/\bsahi\s+(?:jawab|option|hai)\b/i,
```

**3.6 Ability praise, banned as a shape** (`output-gate.ts@main`):
```ts
/\byou(?:'re| are)\s+(?:so\s+)?(?:brilliant|smart|clever|sharp|a natural|talented|gifted)\b/i,
/\b(?:fast|quick|slow)\s+learner\b/i,
/\b(?:aap|tum)\s+(?:bahut\s+)?(?:tez|hoshiyaar|hoshiyar|intelligent)\b/i,
```

**3.7 Dash strip that cannot eat a helpline** (`output-gate.ts@main`):
```ts
function stripDashesInSegment(segment: string) {
  return segment.replace(/[ \t]*(?:[—–]|--)[ \t]*/g, " ");
}
```

**3.8 Honorific as state** (`lib/saathi/register.ts@main`):
```ts
export type SaathiHonorific = "aap" | "tum";
export const HONORIFIC_TUM_AT_TURNS = 40;
export function honorificFor(lifetimeGuideTurns: number): SaathiHonorific {
  if (!Number.isFinite(lifetimeGuideTurns)) return "aap";
  return lifetimeGuideTurns >= HONORIFIC_TUM_AT_TURNS ? "tum" : "aap";
}
```

**3.9 Per-intent bands and the question-share ceiling** (`lib/saathi/contract.ts@main`):
```ts
export const SAATHI_REGISTER_BANDS = {
  "doubt-support": { center: 20, max: 32 },
  "ask-me-a-question": { center: 20, max: 32 },
  "give-a-hint": { center: 24, max: 40 },
  "define-a-word": { center: 30, max: 55 },
  "explain-simpler": { center: 55, max: 95 },
  refusal: { center: 26, max: 45 },
} as const;
export const SAATHI_QUESTION_SHARE_CEILING = 0.35;
```

**3.10 The no-affect floor in SQL** (migration `202608310022_saathi_memory.sql@main`, abridged by me):
```sql
check (
  note !~* '\m(feel|feels|feeling|...|panic|anxious|scared|stress|worried|...|darr|ghabrahat|pareshan|dukhi|gussa|udaas)\M'
  and note !~ '(डर|घबरा|परेशान|दुखी|उदास|गुस्सा|तनाव|शर्म|चिंता|भावना)'
),
check (
  note !~* '\m(employability|...|smart|clever|dumb|incapable|percentile|score|scored|marks|grade|graded|rating)\M'
)
```

**3.11 Pull-only recall rank** (`lib/saathi/memory/rank.ts@main` `SAATHI_RECALL_SQL`, abridged by me):
```sql
salience
  * (case when kind in (<non-decaying>) then 1.0
          else greatest(0.25, 1.0 - extract(epoch from (now() - updated_at)) / (86400.0 * 90)) end)
  * (1.0 + 0.35 * ln(1.0 + mentions))
  * (case when last_recalled is null then 1.0
          when now() - last_recalled < interval '20 hours' then 0.6
          when now() - last_recalled > interval '21 days' then 1.25 else 1.0 end) as rank,
exists (select 1 from regexp_split_to_table(lower($2), '[^[:alnum:]]+') as word
        where length(word) >= 4
          and (subject || ' ' || note || ' ' || coalesce(module_id, '')) ~* ('\m' || word || '\M')) as matched
```

**3.12 First-try correctness** (migration `202609010021@main`):
```sql
alter table public.member_learning_module_records
  add column concept_first_try boolean,
  add column practice_first_try boolean,
  add column transfer_first_try boolean;
-- 'Decided once and never revised ... Never shown to a learner and never returned by the sync GET.'
```

**3.13 Spaced review that cannot nag** (`lib/learning/spacing.ts@main`):
```ts
export const SPACED_REVIEW_INTERVAL_DAYS = [2, 7, 21, 60] as const;
export type SpacedReviewOutcome = "kept" | "faded";
export type SpacedReviewRecord = {
  readonly moduleId: LearningModuleId;
  readonly nextDueOn: string;      // never rendered
  readonly step: number;           // never rendered, never called a level
  readonly lastOutcome: SpacedReviewOutcome | null;
};
```

**3.14 Feedback with no field a grade can live in** (`lib/learning/feedback-contract.ts@main`):
```ts
export type FeedbackItem = {
  readonly criterion: string;   // copied from the lesson; the AUTHORED string is what is served
  readonly observation: string;
  readonly nextStep: string;    // an instruction, never a rewritten answer
};
```

**3.15 The wire-byte digest** (`lib/saathi/lane-identity.ts@main`):
```ts
hash.update(`core:${encoder.encode(core).byteLength}:`);
hash.update(core, "utf8");
hash.update(` tail:${encoder.encode(tail).byteLength}:`);
hash.update(tail, "utf8");
```

**3.16 Voice events, none of them a send** (`components/saathi/voice-input.ts@main`):
```ts
export type VoiceEvent =
  | { type: "press" } | { type: "armed" } | { type: "tick"; seconds: number }
  | { type: "release" } | { type: "cancel" }
  | { type: "transcribed"; transcript: string } | { type: "failed"; error: VoiceError };
```

**3.17 Outbound never-send list** (`lib/outbound/shape-gate.ts@main`):
```ts
export const OUTBOUND_NEVER_SEND_CATEGORIES: readonly string[] = [
  "asking a member to come back, in any wording",
  "how long it has been, in days, weeks or months",
  "streaks, runs, consecutive days, or anything that can be broken",
  "expiry, scarcity, urgency, or anything a member could lose",
  "anything that did not already happen to this member",
];
```

**3.18 Near-miss shapes** (`docs/learning/checks.md@main`):

| shape | what it looks like |
|---|---|
| Right rule, wrong step | does the correct thing one move too late, or after the irreversible act |
| Right rule, wrong source | checks — but against a second guess, the sender's own number, the same page |
| Right rule, half applied | covers the easy half and drops the half that costs something |

---

## 4. Measurements

Unless marked otherwise, every row is from `context/measurements.md@main`. Rows marked **(imported)** were measured in the Meera companion and cited in AI2Bharat source comments. Their n and method live in the Meera repo (see `meera-repo.md` / `hp-main-engine.md`).

| # | claim | n | method | date |
|---|---|---|---|---|
| M01 | grok-4-1-fast-non-reasoning, first register run: 5/5 bands in; question share **67.8%** (ceiling 35%); off-vocab and affection emoji 2.2% each; 0 prompt forks; latency 0.7–1.9 s; **$0.000371/turn ≈ ₹0.035** | 314 served / 320 | `evals/saathi/register.mjs` model arm, Azure Foundry v1, real CORE (5,712 B) + TAIL, conc 6 | 2026-09-01 |
| M02 | DeepSeek-V4-Flash: 133/320 served (**58% lane failures**); 5/5 bands out (doubt-support 46.9 words vs 32) | 320 planned | same | 2026-09-01 |
| M03 | Prompt cache on the Foundry grok lane: cached 157 → **1,666** on a 1,512-token prompt (the reported count is not a subset); latency 1.90 s cold → 1.10–1.32 s | 4 calls | identical system prompt, different user turns | 2026-09-01 |
| M04 | Vision probe: DeepSeek-V4-Flash **fabricated** "A man in a suit stands in a library" for a gradient image at prompt_tokens 16; grok described it correctly | 1 synthetic image × 3 deployments | data-URI image_url | 2026-09-01 |
| M05 | After the emoji gate: off-vocab/banned emoji 2.2% → 0.0%, *by construction*; emoji gate-trip rate **8/320 = 2.50%**; 0 lane failures | 309/320 | same battery | 2026-09-01 |
| M06 | gpt-4.1-mini: question share **86.9%**; 0 gate trips; 0 emoji; shortform 26.9% vs grok 77.3%; $0.000803/turn (2.16× grok); cached tokens a true subset at 79.6% | 320/320 | same | 2026-09-01 |
| M07 | Bounding slot 2 ("close on a statement…"): grok question share 68.0% → **41.5%** (rerun 44.7%; read as ~43% ±5.5); gate trips 3.44% → 0.94%; gpt-4.1-mini 86.9% → 75.0% | 320 per run | same | 2026-09-01 |
| M08 | Per-band question share after the fix (grok): define-a-word 58%, give-a-hint 45%, ask-me-a-question 41%, doubt-support 40%, explain-simpler 23% | 316 | same | 2026-09-01 |
| M09 | Round 12 baseline grok 42.7%. Adding a clause naming two bands in slot 2 → **48.3% (worse)**; ask-me-a-question 35% → 64% and doubt-support 28% → 45% regressed | 319/320 | same | 2026-09-13 |
| M10 | Direct provider latency at the 12 s fuse: grok p50 1,026 / p90 1,411 / p95 1,437 ms; gpt-4.1-mini p50 1,305 / p95 1,764 ms; **0/40 fuse hits** each | 40 per model | `createSaathiLane().provider.generate`, conc 6 | 2026-09-13 |
| M11 | Round 13 question-trim gate: grok question share **23.2% / 25.8%** (two runs), 5/5 bands, latency mean 967 / median 923 / p90 1,287 ms; trim rates define-a-word 65.6% (avg 4.8 words dropped), give-a-hint 47.6%; 0 discards. gpt-4.1-mini still 50.3%. **Foundry became the default.** | 314 and 318 / 320 | same + trim gate | 2026-09-13 |
| M12 | Production Gemini lane, off-lesson word question: 3/5 replies were mid-word fragments before the cut-off gate. With a thinking budget of 640 outside the answer budget: 11/19 served whole, 0 cut off, **8/19 at the 12 s fuse**; served p50 ≈ 5.3 s | 5 + 5; 19 | POST /api/saathi, demo member | 2026-09-02 |
| M13 | Production after the lane flip: 4/6 model-path turns served at 0.7–1.6 s; 1 verdict-gate trip → authored | 6 | production probe | 2026-09-14 |
| M14 | `endsUnfinished` cost: 50/51 uncut model replies already ended on a terminator | 51 | DeepSeek via Foundry, all published stops | 2026-09-02 |
| M15 | Feedback route: local p50 1,555 ms, p95 1,962 ms, $0.000439/call, model-served 16/20; production p50 model time 4.4 s | 20 local, 3 production | gpt-4.1-mini | 2026-09-13 |
| M16 | Feedback gate pass rate: EN 71.9% → **89.1%**, romanised Hindi 71.9% → **87.5%** after the option-letter fix; the "verdict" gate had been matching the article "a" | 64 per arm each way | `evals/ai/feedback-script-parity.mjs`, 16 matched pairs | 2026-09-13 |
| M17 | Transfer-check answers that were verbatim concept bullets: **49/58** (all `concepts[1]`, both languages) | 58 modules | string compare | 2026-09-01 |
| M18 | The old checks: 139/139 recall prompts used one of two stems, and 139/139 answers shared ≥50% of their content words with the rules printed above them; 69/139 EN and 54/139 HI answers overlapped the description by ≥50% | 139 lessons | journey audit counters | 2026-09-13 |
| M19 | Near-miss batch 1: retired stems 18/21 → 0/21; distractor restating another lesson 20/21 → 0/21; answer-on-screen 21/21 → 10/21 EN | 21 | content-word overlap script | 2026-09-13 |
| M20 | Near-miss batch 6 (legacy 18): scene prompt 0/18 → 18/18; `correctIndex` preserved 36/36 | 18 | same | 2026-09-13 |
| M21 | First-timer journey at 390×844: taps to first interactive element 4 → **1**; scroll 1,574 → 0 px; Work list first paint 1,484,284 → 25,461 B; Saathi-open words 100 → 21; Today words 123 → 54 | 1 load per cell | Playwright, corrected DOM counter | 2026-09-02 |
| M22 | Today paint: LCP 2,756 → **408 ms** (390×844), FCP 1,192 → 408 ms after a Suspense boundary | 5 warm | production, demo member | 2026-09-14 |
| M23 | Responsive audit: distinct defect classes 1,170 → 689 → 570 → 510 → 439 across five production runs | 2,912 cells per run | `tools/responsive-audit` | 2026-09-13/14 |
| M24 | Mobile composer: microphone and send overlapped by **42 px at 360 px** (hidden at 390 px) | 1 layout fact | Playwright at 360/390 | 2026-08-31 |
| M25 | Contrast of the Work primary action: **1.82:1 light, 2.06:1 dark**; it survived several reviews | — | per-node contrast sweep (R-022) | 2026-08-31 |
| M26 | First register battery: the guide's *authored* voice carried em-dashes at **34.6%**; ask-me-a-question ran 35.2 words vs a 32 cap | authored arm, n>300 | `register.mjs` | 2026-08-31 (commit `e1eda0e`@community) |
| M27 | Lesson translation run 1: 59 lessons × 21 locales ≈ $3.50, ~3.7M tokens; drop rates **Manipuri 99.55%**, **Santali 100%**, other 19 locales 0.36%. Run 2: 80 lessons × 19 locales $7.17, Bodo 15.74%, Kashmiri 5.45% | ~30k and ~67k units | gpt-4.1-mini, structural checks | 2026-09-13/14 |
| M28 | Translation quality: mean adequacy 4.61 / 4.52, fluency 4.57 / 4.55; κ ≤ 0 for 13/19 locales (mean 0.053) despite a median raw agreement of 92.5%; weakest Bodo and Kashmiri; $0.09 | 760 units × 2 judges | `probe-translation-quality.mjs` | 2026-09-13 |
| M29 | Funding search: 38/38 expected programmes in the top 3 on the seed (36 at rank 1); query embedding 120–360 ms; index of 140 vectors, 344 KB, built in 3.3 s | 38 queries (18 EN, 8 HI, 12 Hinglish) | production build | 2026-09-10 |
| M30 | First real day-7 retention: **2 of 6** (week of 24 Aug) | 6 | `member_activity_cohorts` | 2026-09-01 |
| M31 | Population: 15 onboarded members, 11 learning rows, 0 practice-complete | census | production DB | 2026-09-01 |
| M32 | Cohen's κ self-test 5/5 (κ = 0.400 on Cohen's example; 82.0% agreement with κ = 0) | 175 synthetic pairs | `evidence-calibration.mjs --self-test` | 2026-09-01 |
| M33 | Google sign-in outage of **10 days** (31 Aug–10 Sep): the proxy dropped the OAuth query, and analytics logged `signin_google` success at redirect start, so the impact is unmeasurable | — | production probes | 2026-09-10 |
| M34 | Model-spend total per round: Round 12 ≈ $0.58; Round 13 $0.5274; daily cap $12, of which Saathi gets $6 | — | run meters | 2026-09-13 |
| M35 | Icon sprite: shell HTML 112,932 → 107,772 B; render median 45 → 20 ms; an all-35-icon sprite was *larger* (117,557 B) | 5 warm | local | 2026-09-14 |
| M36 | bol seed corpus: 95 → 132 items; an always-A model scores 100% → 50% on the pairwise half | 132 items | rebalance | 2026-09-14 |
| M37 | DeepSeek accidental run: 154/320 served, question share 47.4%, median latency 138 ms (TLS resets) — not reportable | 154 | register battery | 2026-09-14 |
| M38 | Cost model (computed from list prices, not billed): gemini-3.6-flash ₹0.21/turn, doubling from 2027-01-01; speech-to-speech ≈ **₹1.16/learner-minute ≈ 9× text** | arithmetic | `docs/strategy/05-technology.md` | 2026-09-01 |
| M39 | (imported) A prompt instruction to withhold leaked in **57.1%** of ordinary turns and **98.1%** of adversarial ones; as a code predicate it leaked **0 / 31,122** | 31,122 trials | Meera measurement, cited in `output-gate.ts` | pre-2026-08-31 |
| M40 | (imported) A rule mid-brief fired **0/8**; appended last it fired **8/8**. Example quotes were recited 4/5; structured tags did not recite at **n=84** | 8; 5; 84 | Meera, cited in `pedagogy.ts`, `kinds.ts` | — |
| M41 | (imported) A reasoning mode helped light turns by ~55% and hurt emotional ones by ~81%; mirror-echo 0–2% → 10–29%; crisis over-triggering 16.7% vs 0 | — | Meera, cited in `prompt.ts` | — |
| M42 | (imported) Authored structured state raised self-consistency from 27% to 63%; the companion's measured conversational turn is 20.5 words; the losing profile in a blind 38-2 run ran 36.1 words, 1.74 questions/turn, 63% ending in a question | — | Meera, cited in `kinds.ts`, `contract.ts` | — |
| M43 | (imported) Vision: 12 screens, 160 calls, 5 models; 2 models declared sections illegible and then invented content; the same input spread 13.6 pp across arms | 160 | Meera, cited in `vision-gate.ts`, Q-026 | — |
| M44 | (stated, no n in repo) Generic multilingual ASR shows **32–52% CER** on code-switched Hinglish; the cascade floor is ~1.4–1.5 s and STT-bound | — | cited in `asr.ts`, D-059, D-061 | — |
| M45 | Lesson authoring cost: 335–412 English words per lesson; near-miss checks take about **20 min per lesson** for both checks in both languages | 80 lessons / 5 agents | Round 12 and `checks.md` | 2026-09-13 |

---

## 5. Rejections: what was tried and what broke

"(imported)" means AI2Bharat inherited the lesson from the Meera companion and cites it.

### 5.1 Prompt and persona
1. **Asking the model to withhold the answer** (imported). It leaked in 57.1% of ordinary turns and 98.1% under pressure. The fix: never put the answer in TAIL (`withheld-because-it-is-a-live-answer`) and back it with code predicates. `prompt.ts`, `output-gate.ts`.
2. **A persona written as prose, with example quotes** (imported). It was recited in 4 of 5 turns, and polished taste lines were read out verbatim twice, eight turns apart. The fix: telegraphic rows plus `shapelint.ts`.
3. **Rules placed mid-brief** (imported). They fired 0 of 8 times. The fix: exactly two appended-last slots. A third slot is refused because "it weakens the two that matter".
4. **An unbounded `MUST: ask before telling. The learner attempts first…` in slot 2.** Question share came out at 66.9% / 68.0% / 86.9% on three vendors. The diagnosis: "three vendors failing one property identically is not model selection, it is the prompt". The fix: bound it inside the rule ("close on a statement; the last character is never a question mark"). `measurements.md` 2026-09-01; `git diff @rlhf @main -- lib/saathi/pedagogy.ts`.
5. **Five slot-2 variants, measured.**
   - "1 question max…" scored 65.4% (n=80).
   - "ask opens a turn, never closes it. Last line is a statement" scored 74.7%.
   - Adding a banned comprehension tag scored 77.2%.
   - "close on the next move they make" scored 64.2% at n=320. Losing the abstract clause cost 23 points, even with the mechanical clause kept.
   - "every turn closes on a statement" scored 41.8%, but pushed doubt-support to 33.5 words against a 32 cap.

   All were rejected.
6. **Mid-CORE rows `askWhatWasTried: opening move only…` plus rewording `afterLadder`.** They scored 47.0% vs 44.7%, which is inside the interval, and were **reverted**. "Bytes that buy nothing are still bytes."
7. **Round 12: a clause naming define-a-word / give-a-hint inside slot 2.** The aggregate went from 42.7% to 48.3%, and the untargeted bands regressed (35% → 64%, 28% → 45%). It was reverted. "A fourth clause inside an already-maximal slot redistributes attention". The replacement was a structural question-trim gate scoped to the two bands (Round 13). It reached 23–26%.
8. **A gate that discards every reply ending in a question.** It would have discarded about two turns in three and "reported a register no learner was served". It was never built; only the scoped trim shipped.
9. **`explanationOrder … -> check-back`.** The model read it as "end with *samajh aaya?*". It was replaced by `hand-back-the-next-move`, and the comprehension tag became a banned shape.
10. **The emoji vocabulary as a prompt row only.** 2.2% off-vocabulary and affection glyphs reached learners. It became two fatal gates (R-028). Read the zeroes together with the gate-trip row.
11. **A greedy em-dash strip** (imported). It deleted the hyphens in the crisis helpline `1800-599-0019`, and nothing failed. The fix: only replace em, en and double hyphens, and pair every gate with a negative control.
12. **Model-emitted bubble separators (`---`)** (imported). A lazy quantifier truncated an emoji to half a surrogate pair, and a voice-note payload was cut at its first `]`, which put "a clip of pure laughter into a crisis conversation". Four of four replies were malformed on one model, and two of five on the shipped one. The fix: a deterministic split after the gate (`bubbles.ts`).
13. **Deliberate typos for liveness** (the companion used about 1 in 15 messages). A typo in "rubric" is a teaching error. Shortforms and rhythm replaced them.
14. **An improvised self/life for the guide** (the companion's chai, deadlines and mother). It "diverges per listener and cannot be made coherent" when learners compare notes. It was replaced by pull-only windows drawn from the learner's own calendar.
15. **A `tu` register reachable at depth** (the companion allowed it). That is peer register, "a friend impersonating a teacher". The type now has two members only.
16. **The authored refusals carried em-dashes in 34.6% of turns.** The predicate had only ever run on model output. The authored copy was fixed (commit `e1eda0e`@community).
17. **A distress tier with no helpline in product copy.** This was a strategy-audit finding on 2026-09-01. The helplines were added to the FLOOR row, and the panel now renders them from `copy.ts`, keyed on the learner's words, so a discarded turn cannot drop them.

### 5.2 Memory
18. **Storing affect** (the companion's `feel` column). Rejected (D-057): it is an unreviewed judgement, it cannot honestly be shown, and the pedagogy never uses it.
19. **Model inference as a memory source.** Rejected, because "a guide that records what it concluded about someone has become a reviewer".
20. **Soft delete with `deleted_at`.** Rejected. Deleting the row alone "buys exactly one turn of forgetting", because the extractor re-reads the turns still on screen. The fix is a hard delete plus a forget term.
21. **Forgetting after the reply.** "On serverless a promise made after a response is one that will sometimes silently not be kept." Forgetting now happens before rendering.
22. **A second model call to extract memory.** It doubles cost and adds a fabrication surface. Extraction is now deterministic, from authored shapes.
23. **Trimming an over-length candidate.** "A truncated sentence is still a sentence and recites just as well." Such candidates now fail.
24. **Substring recall (`ilike '%rate%'`).** It matched "corporate". Word-boundary `\m…\M` replaced it.
25. **A weight to keep old rows visible.** "A weight big enough to lift a March row past five fresh ones would lift it past everything." A reserved seat replaced it.
26. **The `explanation-style` history.** It would become "a record of how they have changed", so only 1 row is kept.

### 5.3 Voice, vision, lanes and cost
27. **Auto-sending the ASR transcript.** At 32–52% CER on Hinglish it "asks the guide a different question, which it then answers correctly and confidently". The state machine now has no send event (D-059).
28. **A `webkitSpeechRecognition` fallback.** Its Hinglish quality is the documented failure, and a silent fallback means sometimes good and sometimes bad output with nothing saying which. It is not wired in, and a test asserts its absence (D-060).
29. **Live voice calls / a realtime lane.** It dropped rules the text lane keeps twice (a safety rule, then recall), and the cascade floor is 1.4–1.5 s. Declined (D-061). The reversal condition is a byte-identical CORE.
30. **A cloned voice.** Called "a claim of personhood"; refused at every step.
31. **Speech-to-speech for cost.** About ₹1.16/learner-minute, roughly 9× text, which would be about ₹35 crore at 10 lakh members × 30 min (`05-technology.md`).
32. **Parsing EXIF to strip it.** Being wrong once ships GPS. A canvas re-encode replaced it.
33. **Pooled free-tier Gemini keys.** The terms allow training use and human review, and the lane carried photos of minors' notebooks. Fixed with the paid-lane assertion (D-068).
34. **The comment "9× cheaper, ~90% hit rate" for the cache.** It was never measured, and Gemini's 4,096-token implicit-cache floor means it almost certainly never hit. The comment was deleted and the cache is now measured per turn.
35. **Inflating CORE to reach the cache floor.** It would dilute the two slots. Rejected.
36. **A thinking budget inside the 320-token answer envelope.** 3/5 replies were MAX_TOKENS fragments, served as success. The budget moved outside the envelope and the cut-off gate was added. The Gemini lane still hit the 12 s fuse on 8/19 turns, so the lane changed.
37. **DeepSeek-V4-Flash.** 58–71% lane failures, all bands out, and a fabricated image description. Disqualified.
38. **gpt-4.1-mini for Saathi.** Question share 86.9%, then 75%, then 50.3% even with the trim gate; less Hinglish; 2.2× the cost. Not the default.
39. **An in-process spend ledger.** That is a cap per lambda instance, which resets on cold start. A DB table with a 60 s cache that fails closed replaced it.
40. **Retry ladders on a billed key.** "How a budget becomes a bill." One call, plus a single 404 fallback.
41. **An unpaid acknowledgement that never expires.** "The same as no assertion." It now expires after 60 days and marks every trace.
42. **On-device Saathi (Gemma 4 E2B/E4B).** A 1–3 GB download levied on the poorest users, 4 GB+ RAM, and a new fabrication surface. Don't build (`05-technology.md`).
43. **A model score on a learner record (auto-grading).** Non-native phrasing costs −1.35 / −0.90 points on essays (arXiv 2603.18765), with κ≈0.58 human agreement. Triage only; never a number.
44. **Video or liveness identity verification.** Defeated by real-time face-swap. Identity is bound to work provenance instead.
45. **Krutrim.** It halted model work in May 2026. Do not build on it.

### 5.4 Learning content and checks
46. **Checks generated from catalog array offsets.** Reordering silently changed every stored answer index. Checks are now authored and frozen (commit `34b1ee2`@rlhf).
47. **Distractors that were merely false.** "A learner who rejects a false statement learns nothing about the skill". Distractors were then taken from other lessons' rules. That was **also rejected**: learners eliminated options by register, because 139/139 distractors carried vocabulary from another field. The near-miss rule replaced both.
48. **A recall stem ("Which working rule belongs to this lesson?") with the three rules printed above it.** 139/139 had the answer on screen. The fix: scene prompts, plus the rules hidden in a disclosure until the recall is answered.
49. **A transfer answer equal to the concept bullet.** That tests reading, not the skill. 49/58 were grandfathered on a shrink-only allowlist, and new lessons must state the rule in new words.
50. **An option-letter regex `[abc]\b` under `/i`.** It matched the article "a", so feedback containing "not a…" was discarded: 27% of replies, 14 of 17 gate trips. On the input side, "is it a scam?" was classified as answer-seeking.
51. **Client-asserted `*_aligned` booleans.** The record was a client claim. The server now recomputes alignment from `correctIndex`, and unearned completions were repaired.
52. **Glossary answers only for words this lesson uses.** An off-lesson word fell through to a model that could not finish. The fix: serve the entry with a "Words from another lesson" label.
53. **Treating "samajh nahi" as a hint request.** A learner asking about a *word* was told to re-read a section. Glossary-first now runs ahead of the ladder.
54. **A milestone derived from the live catalog.** It would have revoked "catalog-v1-complete" when the catalog grew. The count is frozen at 18 and a level floor was added (D-053).
55. **Hardcoded counts (6 pathways / 18 modules).** They became false claims on `/learn` and in the help handbook. Every count now derives from `publishedCatalogTotals` (R-023).
56. **Two diagrams of the four-step track.** A reviewer read them as two products. There is now one definition in `lib/learning-track.ts` (D-050).
57. **Translating Meetei Mayek and Ol Chiki.** Drop rates were 99.55% and 100%. Both are excluded from the pipeline.

### 5.5 UI, infra and ops
58. **Following "cut text, fewer boxes" literally.** It deleted every animation, and the founder rejected three surfaces in a row ("basic shit it is. lazy work"). "A short flat page is the failure, not the goal" (commit `69f4a31`@community).
59. **A boolean `data-extras` column template.** At 360 px the microphone sat 42 px under Send. The template now keys on *which* flags are set (D-062).
60. **A root-layout `html {scroll-snap-type: y mandatory}`.** It applied snapping on every route. It is now scoped to `html:has(.a2-site)` (R-025).
61. **A disabled sticky CTA at 62% opacity.** It was "a window: legible through and untappable under". It now uses a solid muted fill inside an opaque bar.
62. **A proximity snap on a 6-item tab rail.** It cancelled programmatic scroll.
63. **A spinning 112 px ring.** Its bounding box grew by √2 and caused horizontal page scroll.
64. **Judging contrast by eye, in one theme.** The 1.82:1 primary action survived. A per-node contrast sweep is now in every theme (R-022).
65. **A tap-target sweep that trusted rects.** A closed `<details>` keeps a layout box (false 43 px readings). It now uses `checkVisibility`.
66. **Google OAuth inside in-app browsers.** It fails with 403 `disallowed_useragent`, unseen and unloggable. The fix: detect the in-app browser and offer email OTP.
67. **Logging `signin_google` success at redirect start.** It made a 10-day outage unmeasurable.
68. **Reading a failed session lookup as "signed out"** (`dd16dc2`@community).
69. **Parallel agents choosing the same migration number.** Migrations had to be renumbered before applying. A hand-written SQL splitter also failed on dollar-quoted bodies, so whole files are now run through the Neon WebSocket client.
70. **Removing a worktree directory while its bind mount was live.** It emptied `node_modules` twice. The procedure is now: unmount, verify, then remove.
71. **An analytics CHECK that never allowed the guide's events.** Every batch containing one was rejected, so Saathi usage was never stored.
72. **A sprite of all 35 icons.** It was larger than inline. A 16-icon sprite shipped instead.
73. **Supabase as the member identity.** Superseded by Neon. Two identity systems are forbidden (D-031).
74. **Rejected as process (D-063): the founder waived the 60-photo fabrication pilot for `saathiPhoto`.** Live gate-trip monitoring replaced it. Q-026 still owes the measured rate.

---

## 6. Concepts

- **Structural gates beat prompt rules.** "A rule a model is asked to follow is a preference. A rule checked in code is an invariant." Every must-hold property (answer withholding, verdicts, emoji, register, celebration, photo honesty) is a predicate over output or a filter over input.
- **Discard, never edit, and build the authored floor first.** "Half a leaked answer is still an answer." Phase A (authored, offline) exists so that every gate trip has an honest fallback.
- **Position is mechanism.** Exactly two appended-last slots. The learner's turn always goes last in TAIL. In Round 12, internal clause order inside a slot also proved to matter.
- **Anything sentence-shaped in a prompt gets recited.** Rows are shapes (`a -> b`, `key: value`, `never: x`), enforced by a lint. Sentences the learner may read live in `copy.ts`, which the model never sees.
- **Byte-stable CORE, volatile TAIL, loud truncation.** The cache key is a byte property. A per-learner byte belongs in TAIL.
- **Absent means absent.** A feature that is off, a declined consent, or an unmatched context window leaves TAIL byte-identical. Declining "costs nothing", and a test asserts it.
- **Never show the model what it must not say.**
- **The six inversions from companion to tutor:** honorific as state, not mood; a closed work emoji set with affection banned; no self, backstory or day; no deliberate typos; no opener, notification or re-engagement; no reaction on learner work ("a tick is a verdict with no words").
- **Celebrate events, never quality; praise method, never ability.** Ability praise "is the one praise category measured to change what a learner attempts next".
- **Pull-only context.** Windows, memory, sound-alikes and context rows enter only when the learner's live words match them. "Due-ness" is a rank modifier, never a trigger.
- **If a row cannot be shown, it must not be stored.** This is the test for memory, and it is why affect is excluded.
- **Two layers, and the schema is the floor.** App filters are mirrored by DB CHECKs (affect vocabulary, outbound language, closed kinds, closed features, the publication boundary).
- **Levels of content, never of people.** Nothing is locked. Every level check blocks nothing.
- **Growth may never take something back.** Append-only ledgers, a permanent level floor and frozen historical counts.
- **NEVER MANIPULATE**, as a four-question audit that lives in the file header of every mechanic.
- **Covert comprehension signals that are not scores:**
  - near-miss distractor choice (which misconception);
  - first-try vs eventual correctness;
  - a changed-situation transfer;
  - self-explanation ("explain in your own words");
  - hint-ladder re-entry (weak-topic);
  - glossary re-lookups (term-asked);
  - spaced kept/faded.

  None of these is shown as a number.
- **The per-model law.** Any change of model or lane re-runs the register battery at n≥300 before the flag flips. "A byte-identical prompt lost 38-2 on a different model."
- **The negative control is the battery.** Every gate case is paired with a real string that must not trip it.
- **Read zeroes with the gate-trip row.** A zero produced by a gate says nothing about the model.
- **Fail closed on money and compliance.** An unreadable ledger or unpriced deployment means no spend. An unpaid lane means no learner content sent. "There is never a dead microphone": an unconfigured state is a complete, honest product state.
- **One list, many callers.** Distress shapes, emoji sets and question predicates each have exactly one definition, shared by prompt, gate, eval, memory filter and UI.
- **Measurement discipline.** Every number carries n, method and date. "Not measured" is written as such. A dated lesson in `timeline.md` saved a later pass from re-litigating a false positive.
- **Evidence is gated on people, not code.** Rubrics, a calibration set (κ) and a named accountable owner; until all three exist, the database itself refuses a submission.
- **An exemplar beside the rubric**, never an answer key and never a number.
- **The vocabulary lock: one word per thing.**
- **DPDP posture.** Minimisation and purpose limitation are enforced by DB constraints. The repo argues that the six-kind memory list plus the never-store list *are* a DPDP notice.

---

## 7. How this maps onto Taxila's five goals

**Goal 1 — a human-feeling voice teacher with a relational OS and an emotional OS.**
- **Take:**
  - the honorific arc (AIC11), name rules (AIC12), the celebration licence (AIC13) and `afterAFeeling`;
  - per-turn distress handling with reasoning off on distress turns (AIC09) — for children, rewrite the shapes and helplines;
  - pull-only context windows: for kids, exam weeks, results, school holidays and festivals (AIC10);
  - memory surfaced before the lesson (AIC25);
  - bubble pacing for the text lane (AIC14).
- **Conflict:** D-057 (no affect), D-061 (no realtime) and not-a-person.
- **Recommended Taxila position:**
  - *(a)* Keep affect **ephemeral per session** by default, the way AI2Bharat reads distress per turn.
  - *(b)* If affect must persist for bonding, store it **only in words a parent can be shown without harm**, under a closed kind list with a DB CHECK.
  - *(c)* Get legal review against DPDP s.9(3) before any longitudinal affect model.
  - *(d)* For gpt-realtime, implement the reversal condition literally: compile the same CORE bytes for `session.update` instructions and the text lane, digest them as `lane-identity.ts` does, and re-run a register battery on the realtime lane. AI2Bharat measured realtime lanes dropping a safety rule and recall.

**Goal 2 — covert comprehension detection.**
- Port the near-miss authoring rule (AIC39). Each wrong option maps to a named misconception shape, so *which* distractor the child picks tells the teacher what to re-explain.
- Port the first-try columns (AIC40).
- Port the transfer-check design: the same rule in a changed scene (AIC37).
- Port the level check that blocks nothing (AIC44) and the weak-topic and term-asked event counts (AIC21).
- In voice, the analogue of "explain in your own words" is the pedagogy row `firstMoveOnDoubt: ask-what-was-tried -> restate-back`.
- Keep AI2Bharat's rule that nothing becomes a visible score. The signal steers re-explanation, not a report card.

**Goal 3 — learning-profile discovery.**
- AI2Bharat has **only** `explanation-style` (a 3-value enum, written only from an explicit statement) plus a deterministic route plan (AIC43). The onboarding branch `@rlhf` is "RLHF-first learning onboarding": it onboards learners *into human-feedback work*. **It does not use RLHF to learn the learner.** Its onboarding asks for name, goal (Seekhna/Kamana/Banana/Judna), language and consent, and holds experience and minutes at neutral values.
- So Taxila must build profile discovery itself. Re-use the guardrails: a closed enum of modalities (visual, story, rhyme-song, game, long-form…) with a DB CHECK; sources limited to *what the child did or said*, unless inference is explicitly labelled and shown to the parent; and explainable reasons per recommendation, never a hidden score.

**Goal 4 — generated learning modules (HTML/JS, games, diagrams).**
- AI2Bharat is **authored-first**. Spaced items, level checks, hints, glossary and exemplars are "NOTHING here is generated".
- The transferable pattern is the gate stack: validate generated artefacts with code predicates before render, discard rather than patch, and keep an authored fallback module per concept.
- The feedback contract's "no field a grade can live in" applies to generated quiz or game payloads too.

**Goal 5 — parent visibility, child safety, DPDP.**
- Take:
  - the memory panel rule: every row shown verbatim, the never-store list printed (AIC25);
  - the append-only consent ledger (AIC24);
  - the outbound shape gate for parent notifications, telling a parent what happened and never pressuring a return (AIC60);
  - privacy-safe analytics with k≥5 suppression (AIC61);
  - the EXIF strip and zero persistence for photos (AIC29);
  - the paid-lane plus data-terms assertion, with R-027 (apply for modified abuse monitoring on Azure before minors' content) (AIC31);
  - the in-app browser sign-in fallback for the Android WebView (AIC67).
- Replace the 18+ gate (AIC68) with verifiable parental consent (DigiLocker per the repo's research).

---

## 8. Gaps and unread

- **`origin/r21/*` branches.** Another segment covers them; they are merged into `@main`.
- **Not read line by line:**
  - `lib/learning-journey.ts` (547 KB; I read the types plus the first 3 lessons);
  - `lib/learning-lessons/wave-*.ts`;
  - `lib/learning-catalog/*.ts` content;
  - `components/saathi/saathi-panel.tsx` (49 KB);
  - `components/learning-studio.tsx`;
  - `lib/saathi/handler.ts` past its header;
  - `lib/saathi/provider*.ts`;
  - `lib/saathi/lane.ts` body;
  - `lib/evidence/*` bodies;
  - most of the 200+ test files.
- **Not read:** migrations 020 (evidence review, 915 lines), 025, 036–041; `docs/evals/bol/first-100-items.md` and `harness-spec.md`; `docs/strategy/02,04,06`; the `market/` reports; `FOUNDER_PRODUCT_GUIDE.md` beyond its first section; `docs/learning/review-round19/*`; `docs/ux/journey-round18*`.
- **Not opened:** `tools/demo-video/*` (25 files), `deliverables/*.pptx` and `public/fonts`.
- **Not verified:**
  - the measured sources for the imported Meera numbers (M39–M43); see the Meera and hp harvests;
  - 32–52% Hinglish CER (M44), which has no n in this repo;
  - whether the KIRAN helpline still operates;
  - the DPDP rule citations, which are second-hand from `05-technology.md`.
- **Not run:** no tests, evals or builds were executed. Every number above is quoted from the repo's own logs.
- **A count inconsistency inside the repo.** `LEARNING.md` says "35 rubrics and 4 listed exceptions" for 46 quests, while `measurements.md` (14 Sep) says "46 quests, 42 with a published rubric". I did not resolve it.

## Verification

Adversarial check of ai2bharat@origin/main (a11c521) claims, 2026-10-02. Method: git ls-tree/show against the cited ref; existence, size, import list, spot-checks of cited constants (prompt caps, 62 memory cap, 2/7/21/60, 4096 avatars, 12 sound-alikes, honorific 40). Secret scan over all cited files: no hits (only .env.example exists in the tree; no api/_config). Nothing was executed (no tests/builds). All 75 verified claims exist at the ref and are implemented, not stubs.

Cross-cutting findings:
- Everything is written for ai2bharat's ADULT AI-skills learner on Next.js (app router, proxy.ts, @/ alias, next/headers, Neon Auth). Taxila is Vite/React + plain-JS server for children 6-15. Almost nothing is a literal copy.
- Child safety gaps: distress.ts has no self-harm/abuse patterns; helpline copy is Tele-MANAS 14416 + KIRAN only, no Childline 1098.
- Policy conflict: AIC20 never-store forbids storing affect; Taxila's emotional OS needs a deliberate decision first.
- Many files import lib/learning-journey.ts (3,485 L), human-feedback-learning.ts, lesson-index.ts, credential-pool.ts, neon-db.ts, which were not claimed; extract by function, not by file.
- AIC32/31 are the most directly applicable to Azure (Foundry lane, modified abuse monitoring for minors).

| id | quality | corrected use | note |
|---|---|---|---|
| AIC01 | 4 | adapt | Real (391+747 lines); CORE 8,000 B / TAIL 6,000 B caps exist in SAATHI_PROMPT_BUDGET; loud truncation flag on trace. Imports 11 saathi siblings + learning-journey (3,485 L adult AI-skills catalog) via contract.ts. Take the compile/budget mechanism, not the files. |
| AIC02 | 3 | adapt | Real, 316 L, no imports. Content is Saathi (adult AI-literacy guide) pedagogy; the key:value/a->b shape and 2 MUST-last slots transfer, the rows must be re-authored for child teacher. |
| AIC03 | 4 | copy | Real, 71 L, zero imports, pure function. Only caveat: >14-word limit tuned for English rows; verify against Hinglish/Devanagari rows. |
| AIC04 | 3 | adapt | Real, 200 L. Depends on LearningStage (understand/example/practice/apply) and checked-step types from learning-journey/contract. Header cites "leaked 0 in 31,122 trials" as inherited, not measured here. Taxila needs its own stage vocabulary. |
| AIC05 | 3 | adapt | Real, 658 L, imports 6 siblings incl vision-gate, lesson-index, pedagogy. Gates keyed to Saathi answer keys; port predicates, rewire to Taxila kits. |
| AIC06 | 3 | adapt | Real, 132 L; imports human-feedback-learning, copy, lesson-index (authored-lesson shapes). Ladder logic is portable, content is not. |
| AIC07 | 3 | adapt | Real, 182+241 L. local-engine pulls bubbles, ladder, glossary-first, request, stage-gate: a bundle, not a unit. Concept (authored no-model fallback) is the value. |
| AIC08 | 3 | adapt | Real, 164+161 L; glossary.ts imports human-feedback-learning. Needs Taxila glossary source (NCERT terms). |
| AIC09 | 2 | adapt | Real, 37 L, zero imports, with negative controls. But shapes are adult-learner distress only: NO self-harm/abuse/bullying patterns, and helpline copy is Tele-MANAS 14416 + KIRAN only: NO Childline 1098 (Taxila floor requires it). Must be rewritten for children, not copied. |
| AIC10 | 2 | adapt | Real, 149 L, zero imports. Month table is for adult exam/results/festival windows; Taxila needs board-exam/school-calendar rows. Mechanism only. |
| AIC11 | 2 | adapt | Real, 47 L; HONORIFIC_TUM_AT_TURNS=40 confirmed. aap->tum, tu unreachable is an adult-teacher stance; for a 6-15 child tutor the register policy differs (likely tum/tu with warmth). Idea reusable, constants not. |
| AIC12 | 3 | adapt | Real, 224 L, zero imports. Rule (max once, never in correction) transferable; check against Taxila relational-OS naming. |
| AIC13 | 3 | adapt | Real, 97 L; imports contract + human-feedback-learning; one import string is actually prose in a comment. Four events are Saathi-specific. |
| AIC14 | 4 | adapt | Real; bubbles.ts 166 L imports contract (maxBubbles 3). Source comment says upstream ships 3 hard cap 4. Small, but needs the contract type stubbed; downgrade copy to adapt. Irrelevant to voice lane. |
| AIC15 | 2 | adapt | Real, 80 L, 12 pairs confirmed, but pairs are AI-literacy vocabulary (rubric/pairwise/rationale). Not reusable data; idea (pull-only ASR fix table) is valid for NCERT terms. 32-52% CER cited from elsewhere. |
| AIC16 | 4 | copy | Real, 124 L; node:crypto sha256 length-prefixed core/tail, only a type import from model-data-terms. Portable to Vercel/Azure node. Wire extractors must match Taxila request shapes. |
| AIC17 | 3 | adapt | Real, but dependency is inverted: lib/saathi/register-predicates.ts imports from evals/indic-benchmark/lib/properties.mjs (238 L). Fine as concept; restructure so product code does not import evals. |
| AIC18 | 3 | adapt | Real, claims.ts 391 L no imports, handbook.ts 745 L Saathi/Sahayata-specific content. Take claims gate; handbook is content. |
| AIC19 | 3 | adapt | Real, 194 L, zero imports; sum 12+20+1+3+6+20=62 confirmed. Kinds are adult-learner; Taxila needs child learner-model kinds (and affect decision, see AIC20). |
| AIC20 | 2 | adapt | Real. App filter imports prompt.ts distressShapes; SQL CHECK has module_id enum hard-coded to ai2bharat modules. CONFLICT: this design deliberately forbids storing affect, but Taxila owner wants an emotional OS/affect lens. Decide policy before copying; keep the DB-CHECK-as-floor idea. |
| AIC21 | 3 | adapt | Real, 270 L, imports contract/glossary/kinds/never-store. Deterministic, no second model call; shapes authored for Saathi. |
| AIC22 | 3 | adapt | Real, 149+128 L; rank formula in TS plus SQL. Imports contract/kinds. Good reference for pull-only recall; Neon-compatible. |
| AIC23 | 3 | adapt | Real, 101+54+163 L; route-handler imports request-security, store.ts (not claimed) and Next route style. Reset imports human-feedback-learning. Hard-delete semantic is the value. |
| AIC24 | 3 | adapt | Real in memory migration (append-only trigger, delete allowed). Not a standalone file: shares a 509 L migration, FKs to member platform tables (AIC65). Extract the ledger table only; not copy as is. |
| AIC25 | 2 | adapt | Real, 242+245 L React. memory-line imports interface-messages, bharat-languages, saathi-memory-copy, phosphor. Adult-facing; Taxila needs parent-facing view of child memory. |
| AIC26 | 2 | idea | Real but handler.ts is 914 L importing ~20 siblings; unportable. The test/principle (memory off => TAIL byte-identical) is the only reusable part. |
| AIC27 | 2 | adapt | Real, 229+110 L. Push-to-talk text transcript never auto-sent is a typed-chat ASR aid; Taxila's lane is realtime voice. asr-client imports lib/saathi/asr-handler (not claimed). Low relevance. |
| AIC29 | 4 | adapt | Real, 136+120 L; canvas re-encode EXIF strip is browser-standard and portable. Imports contract for caps; inline the caps. Check minors-photo policy for children. |
| AIC30 | 3 | adapt | Real, 304 L, zero imports. Gate rules (ungrounded identifiers) are generic; tuned to homework photos of adult course work. |
| AIC31 | 3 | adapt | Real. lane.ts 306 L imports provider-foundry/provider/model-spend; unpaid 60-day ack is Gemini-lane specific. JSON includes Azure modified-abuse-monitoring text, which is directly relevant for minors on Azure. Taxila is Azure-only so drop the Gemini branch. |
| AIC32 | 4 | adapt | Real, 257+354 L, imports credential-pool, model-spend. 12 s fuse and finish_reason handling present. Needs v1 endpoint verified against current Azure OpenAI deployments; credential pool is Saathi infra. |
| AIC33 | 3 | adapt | Real, 508 L (not small), imports credential-pool and model-spend. Closed feature->env table concept is good. Not a drop-in copy. |
| AIC34 | 4 | adapt | Real, 422+88 L plus 117 L migration under private schema; imports router and neon-db. Fail-closed cap is a strong fit for Azure grant. Needs porting off router/neon-db helpers. |
| AIC35 | 2 | adapt | Real, 329 L, zero imports. Price table is stale by definition; Azure prices differ. Keep structure, re-price. |
| AIC36 | 3 | adapt | Real as part of 747 L contract.ts, not a standalone file. Extract trace type only. |
| AIC37 | 3 | adapt | Real: learning-journey.ts 3,485 L includes content and imports 15+ lesson waves; types.ts 234 L imports opportunities.ts. Lift the type shapes only. |
| AIC38 | 2 | idea | Real but 1,438 + 739 L components with 15+ app-specific imports (analytics, commons-handoff, tour bus, css modules). Not portable; loop concept only. |
| AIC39 | 3 | adapt | Docs rule real (272 L). Enforcing test is 888 L and imports the whole lesson catalog and allowlist. Copy the rule text, rewrite the test against Taxila kits. |
| AIC40 | 3 | adapt | Real: 370 L migration + sync lib that imports learning-journey. Schema idea (server recomputes aligned, first_try columns) is portable; table names/modules are Saathi. |
| AIC41 | 3 | adapt | Real. API route is Next app router with @/lib aliases, Neon Auth, request-security. Idempotency/optimistic-version pattern is portable; code is not. |
| AIC42 | 3 | adapt | Real. ladder.ts imports learning-catalog and opportunities; safar is ai2bharat's adult map. Arithmetic identity idea reusable. |
| AIC43 | 3 | adapt | Real, inside the 3,485 L file; requires catalog. Pattern only. |
| AIC44 | 3 | adapt | Real, 284 L TSX imports safar-copy, learning-journey. Fits a placement-check idea; content is adult. |
| AIC45 | 4 | adapt | Real, 370+243+155 L. SPACED_REVIEW_INTERVAL_DAYS=[2,7,21,60] confirmed. Imports learning-journey/catalog types; pure logic could be rewired quickly. Downgrade copy to adapt; children's intervals need Taxila measurement. |
| AIC46 | 3 | adapt | Real, 173+615+68 L. Gates import saathi/output-gate and lesson-index; route is Next. Keep contract and gate predicates. |
| AIC47 | 3 | adapt | Real; rubric-catalog 414 L, quest-rubrics 534 L are ai2bharat quest content. Pattern/anchor structure only. |
| AIC48 | 2 | idea | Real index of 12 exemplar modules; content is ai2bharat quests. Idea only. |
| AIC49 | 5 | copy | Real, 595 L, zero imports, SYNTHETIC label confirmed in script; script imports ai2bharat rubrics so rewrite its inputs. Library file is a clean copy for kappa/Wilson. |
| AIC51 | 3 | adapt | Real, script 438 L zero imports; validator 191 L imports bharat-languages. Depends on field-path unit layout of lessons and a model provider env. |
| AIC52 | 3 | adapt | Real, 612 L imports bharat-languages, calibration, learning-journey, lesson-fields. Needs judge-model on Azure only. |
| AIC54 | 3 | adapt | Real, 269 L test; imports learning-journey and a sentences file. 20-word cap is English; define for Hindi. |
| AIC55 | 3 | adapt | Real, 101+189 L; evidence/vocabulary imports verification.ts. Cheap to retarget. |
| AIC56 | 2 | adapt | Real, community-progress 486 L imports people/projects/safar (adult community). Ledger migration is a good pattern; mechanic is adult-community, risky for children. Rethink for gamification. |
| AIC57 | 3 | adapt | Real, 246 L imports learning-journey. Opt-in suggestion concept only. |
| AIC59 | 4 | copy | Real doc (163 L) and in headers. Four-question audit is text; copy as a checklist. Strategy doc is Saathi-specific. |
| AIC60 | 3 | adapt | Real, 189+155 L plus migration; shape-gate has zero imports (the "come back" import is a comment). Taxila notifications go to parents; re-author events and bans. |
| AIC61 | 3 | adapt | Real, 222 L client + 65 L + 318 L migration. Imports analytics-path, @/lib alias. DPDP for children: Taxila needs stricter (parent consent); opt-in design transfers. |
| AIC62 | 3 | adapt | Real, 148 L migration, counts-only. Depends on member tables. |
| AIC63 | 2 | idea | Real, 122 L + 298 L; 9 id entries found vs claimed 7 moments (count unverified). Spotlight is react-dom portal UI. Low value for a voice-first child product. |
| AIC64 | 2 | idea | Real; share-sheet imports canvas-card, avatar, analytics. A public work page for children is a privacy risk; idea only. |
| AIC65 | 3 | adapt | Real, 183+28 L SQL, RLS + security-definer writers. Members/handles/intents model is adult community; take RLS pattern, not tables. |
| AIC66 | 3 | adapt | Real: config 27 L, session 115 L imports @neondatabase/auth/server and next/headers (Next-only); auth-redirect 205 L. Test counts 3 literal-shaped rows in auth-redirect test; 21 shapes not confirmed. Taxila uses child id identity; port only redirect sanitiser. |
| AIC67 | 4 | adapt | Real, embedded-browser 72 L zero imports; TSX imports next/link, next/navigation. Detector is directly useful for Capacitor/WhatsApp. Parent sign-in only. |
| AIC69 | 3 | adapt | Real: request-security 100 L zero imports (clean copy); proxy.ts and next.config.ts are Next 16 specific. Copy only request-security, adapt headers to Container Apps/Express-style router. |
| AIC70 | 3 | adapt | Real, 385 L + 22 L, uses pg. Verifier is specific to Saathi memory migration; pattern (rollback transaction proofs) portable. Taxila has its own migrate.mjs. |
| AIC71 | 2 | skip | Real but Taxila already has scripts/context.mjs and graph.json from the same lineage (see Taxila CLAUDE.md); nothing to add. Registry content is ai2bharat history. |
| AIC73 | 4 | copy | Real: public/fonts has 12 woff2 (+OFL.txt), not 13 scripts; Latin likely separate. 33 language-code matches in 11 kB bharat-languages.ts. Font licence OFL. Verify subset coverage for Hindi-first UI. |
| AIC74 | 3 | adapt | Real, 257 L + 940 L page-checks. run.mjs imports surfaces/config/report specific to ai2bharat routes; page-checks self-contained. Needs Playwright dependency. |
| AIC75 | 3 | adapt | Real, 99 L zero imports, AVATAR_COUNT=4096 confirmed; component uses @/ alias. Child-appropriate (no photos) but brand-specific animals; fits as selectable avatar idea. |
| AIC76 | 2 | idea | Real, but embeddings.ts imports credential-pool and a 344 KB funding-specific embedding-index.json; search is tied to funding catalog. Synonym/normaliser idea only. Embedding model likely not Azure. |
| AIC77 | 3 | adapt | Real; sitemap imports 5 app libs, Next metadata routes. Taxila is Vite SPA: needs SSR/prerender decision first. |
| AIC79 | 2 | idea | Real doc 238 L; insights are for an adult landing page. Method (words-in-fold) reusable. |
| AIC82 | 3 | adapt | Real, shapes 73 L, gates 609 L, register 492 L; gates import copy/lesson-index/output-gate/pedagogy. Runs only with those; register battery needs a live lane (NOT RUN when none). Not run by me. |
| AIC83 | 3 | adapt | Real, run.mjs 200 L imports its own lib; design doc 562 L. 132-item seed unverified by me. Benchmark is for Indic LLM behaviour generally, re-seed for tutoring. |
| AIC84 | 3 | adapt | Real, 285+199 L; imports lib/ai/router and learning/feedback.ts (not claimed), so not standalone. Copy downgraded to adapt. |
