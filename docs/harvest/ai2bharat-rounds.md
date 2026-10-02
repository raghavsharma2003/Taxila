# Harvest: ai2bharat Round 21 branches, and the measured record of Rounds 1–21 (segment ai2bharat-rounds)

**Repo:** `/home/user/ai2bharat`. I worked read-only. I used `git log`, `git show`, `git diff`, `git merge-base` and `git cherry` against remote refs, read files from the main worktree (which sits clean on `main` = `origin/main`), and ran four existing test files plus one throwaway read-only measurement script from the Taxila scratchpad. I did not check anything out, commit anything or push anything. `git status` was clean before and after.

**Secrets:** none were found. The repo tracks only `.env.example`, which holds placeholders. `context/README.md@main` forbids secrets in `context/` and records only environment-variable names, and I saw no key values anywhere I read.

**Ref shorthand**

| tag | ref | tip | what it is |
|---|---|---|---|
| `@main` | `origin/main` | `a11c521` | "Round 21 logged". 79 commits in total |
| `@base` | shared fork point of every r21 branch | `2c82d28` | "Exemplar contract for the quest rubrics" (adds `lib/evidence/quest-exemplars/contract.ts` + `index.ts`) |
| `@E0` | `origin/r21/e0` | `d1b42f3` | exemplar page, index chip, lesson link, the 17-test gate, the Seva fixture exemplar |
| `@E1` | `origin/r21/e1` | `48e384a` | 5 exemplars: domain-expert quests |
| `@E2` | `origin/r21/e2` | `608759d` | 5 exemplars: trainer, language, data quests |
| `@F1` | `origin/r21/f1` | `1ce777b` | shell residues: height-gated rail, hidden closed disclosure, icon sprite |
| `@M1` | `origin/r21/m1` | `4df3c3a` | money lessons: GST/presumptive tax, 3 payment rails, dated pay reading, worked pace |
| `@M2` | `origin/r21/m2` | `926b030` | open-models worked run, real trace record, pairwise rubric |
| `@M3` | `origin/r21/m3` | `6e2d644` (+`311af3b`) | multimodal top rung (wave D, 3 lessons), count reconciliation 164/46/42, migration 0041 |
| `@M4` | `origin/r21/m4` | `2e240d8` | 22 homepage-only sources replaced, feed snapshot printed from a dated file, content-safety dropped |

**Dates:** Rounds 1–21 run from 2026-08-27 to 2026-09-14. Every r21 commit is dated 2026-09-14.

---

## 1. What this is

### 1.1 The product

AI2Bharat (`ai2bharat.com`) is a bilingual community platform. It runs in English and Hindi, with 19 more machine-translated locales. It teaches people in India to do the human side of AI work, such as rating, annotation, evaluation, rubric writing and domain-expert tasks, and then connects them to source-listed work. The stack is Next.js 16, Neon Postgres and Vercel, with Azure AI Foundry as the paid model lane.

The parts that matter to Taxila:

- **The Learning Studio.** As of `@main` it holds 21 pathways, 164 lessons, 46 quests and 42 quest rubrics (11 with a worked exemplar), all bilingual. Lessons sit on a five-rung ladder of *content*, not of people: Shuruaat, Buniyaad, Kaam, Mahir, Ustaad. Each lesson follows Understand → Observe (a weak and a strong worked example) → recall check → practice → transfer check → a private work sample checked against three visible rules.
- **Saathi, the AI learning guide.** It speaks Hinglish, uses a stage gate and code output gates, keeps a six-kind memory with no affect stored, takes voice as input only, and accepts photos of homework. The prompt engineering behind it is measured at n=320 per run.
- **The evidence ladder.** Rubrics, Cohen's κ calibration and a named human owner are all gated. It is switched off on purpose.
- **A measurement culture.** `context/measurements.md` carries n, method and date on every number, and records bad results as well as good ones.

### 1.2 Round 21, branch by branch

All eight branches fork from `@base` (2c82d28), the commit that added the exemplar contract. Seven of them landed on `@main` in full. **`@M4` landed almost entirely missing** (§5, R1).

I checked each branch's added lines against `@main` with `grep -F`:

| branch | files | added lines present on @main | merge commit |
|---|---|---|---|
| @E0 | 13 | 100% (298/300 in the test file; the 2 missing lines were fixed later in 8544cb1) | fast-forward via the chain |
| @E1 | 6 | 100% | 9930558 |
| @E2 | 6 | 100% | a68ae15 |
| @F1 | 4 | 100% | f181b43 |
| @M1 | 4 | 100% | 7e5ffad |
| @M2 | 4 | 100% | c7f2e5b |
| @M3 | 19 (+4 in 311af3b) | 100% | 3f9eca6 |
| **@M4** | **40** | **≈0%**. The only change that landed is the Aadhaar→voter-list scene in `human-layer-service.ts`. 0/32 lines in `first-steps-with-ai.ts`, 0/400 in `feed-snapshot-2026-09-14.json`, 0/29 of the new ladder-doc test | **6986880**: a single-parent squash touching 1 file |

**@E0 / @E1 / @E2: the exemplar beside the rubric.** This answers Round 19 backlog item #12, which the depth review ranked "the single change that most alters what a learner can do alone" (`docs/learning/review-round19/review.md@main` L823).

The problem: a learner finishes a quest, holds their work sample against a three-rule rubric, and has nothing to compare it with. The AI feedback route may never give a verdict, and no reviewer reads practice work.

The fix is in four parts:

1. A typed contract, `lib/evidence/quest-exemplars/contract.ts@base`.
2. Eleven exemplars, one per file: Seva (@E0), five domain-expert (@E1) and five trainer/language/data (@E2).
3. A 17-test gate, `tests/evidence-quest-exemplars.test.ts@E0`: ten contract rules, two integrity tests and five surface tests.
4. The exemplar printed on `/learn/rubrics/<id>` with margin notes and Met/Partly/Not-met chips. The index row carries a chip and the work-sample lesson links to it (`app/learn/rubrics/[id]/page.tsx@E0`, `rubric.css@E0`, `rubric-index.tsx@E0`, `components/public-learning.tsx@E0`).

**@M3: the multimodal pathway's top rung.** `lib/learning-lessons/wave-d-1.ts@311af3b` adds three near-miss lessons:

- Judge generated media in four buckets: asked / artefact / style across the set / fit for the place.
- Write a robotics scenario a stranger with a camera can score.
- Adapt "helpful, safe, complete" into four anchored criteria, tested on 20 cases by two raters twice.

The sources are the annotation papers themselves (RichHF arXiv:2312.10240, BEHAVIOR-1K arXiv:2403.09227, RoboArena arXiv:2506.18123). @M3 also adds migration `202609130041_learning_catalog_wave_d_multimodal_top.sql`, the quest plan in `quest-rubrics.ts`, count pins 164/46/42 across docs and tests, and the top trail rung retuned 11,200→11,500.

**@M1: money lessons made concrete** (backlog #6, #20, #25, #26).

- The tax lesson now carries the whole shape of the job:
  - zero-rated export of services;
  - the registration turnover line (20 lakh, 10 lakh in some states);
  - the annual undertaking;
  - presumptive taxation (half of receipts counted as profit), which decides how much to set aside;
  - the inward-remittance paper (FIRC/FIRA).
- Three payment rails (platform payout, transfer service, SWIFT), each with the paper it leaves, and RBI purpose codes P0802/P0803.
- A dated pay reading: on 13 Sep 2026, 31 of 172 listings stated a rate. It is kept in `lib/ai-work-reality.ts`, out of lesson strings, because of an existing no-dollar-figure gate.
- A worked pace: 60 lines an hour; the fourth hour is faster and twice as wrong.

**@M2: technical depth** (backlog #27, #28, #29).

- One real open-model run: Llama 3.2 1B is 2,358 MB at fp16 and 1,127 MB as a 4-bit QLoRA build; a free T4 has 16 GB; Gemma 3 1B tuned at LoRA r4 over 1,000 examples took 923 s.
- The five licence families, named.
- One printed agent trace step, with the two things a summary hides: an empty result reported as success, and a retry loop.
- The pairwise worked example now follows from a rubric the learner is handed, which includes "safe".

**@M4: every source is a page** (backlog #17, #30). The branch did four things:

- replaced 22 bare-domain-root `sourceUrl`s with the page that carries the claim;
- printed the ladder's feed block from `docs/learning/feed-snapshot-2026-09-14.json`, a listings-only, 5-field, dated file, through `scripts/print-ladder.mjs --fetch/--write`;
- removed `content-safety`, which had zero listings, from the last three quests;
- added a doc test that fails if the feed sentence is ever typed by hand again.

**On `@main` none of this exists.** It still has 22/165 bare-root lesson sources and the stale sentence "about 1,000 listings, dominated by … content-safety". I re-counted this on 2026-10-02 with `git show` and `grep`.

**@F1: three shell residues, each measured and fixed.**

- The rail void is a function of viewport *height*, not width, so the rule is gated at `min-height: 930px`.
- The closed account disclosure gets `visibility: hidden`, which removes six phantom rows.
- An icon sprite holds only the 16 chrome icons drawn twice or more per page, chosen by arithmetic on the real render (`components/commons-icons.tsx@F1`, `tests/round21-shell-residue.test.ts@F1`).

**Logged:** `context/timeline.md@main` L870–880 and `context/measurements.md@main` L1243–1275 (a11c521).

---

## 2. Reusable assets

**Maturity key:** *shipped-measured* means live with numbers; *shipped* means live but not measured; *prototype*; *spec-only*.

| id | path@ref | what | maturity | Taxila use | target subsystem |
|---|---|---|---|---|---|
| A01 | `lib/evidence/quest-exemplars/contract.ts@base(2c82d28)` | Typed exemplar shape. Brief, standard, strong and weaker sides as paragraphs, three margin notes per side keyed to rubric criterion ids, marks `met/partly/not-met` as words, a takeaway, `authoredOn`, and a single `EXEMPLAR_BOUNDARY` sentence. The header states the 10 rules | shipped | **adapt**. "A worked example at this standard, beside a weaker one, notes in the margin" is exactly the self-check a child (or parent) can use without a grade | learning/pedagogy/curriculum |
| A02 | `tests/evidence-quest-exemplars.test.ts@E0` (fixed in `8544cb1@main`) | 17 tests. Rubric pinned live; notes in rubric order; strong all met, weaker never all-met and never all-not-met; a note is ≥8 words and never restates the rule; weaker body ≥60 words; no sentence over 20 words; EN/HI parity plus the Latin-word rule parsed from one source; vocabulary lock; no real names, handles, Work-list companies or money figures; FNV fingerprint pinned to a date; brief must not equal any lesson string | shipped-measured (31/31 with near-miss on @main, run 2026-10-02) | **adapt**. Gate for generated or authored exemplars of child work (e.g. "a good explanation of photosynthesis vs a hurried one") | evals/gates/verification |
| A03 | `lib/evidence/quest-exemplars/seva-do-it-properly.ts@E0`, plus 10 sibling files @E1/@E2 | Worked exemplar content. The weaker side is "categories not cases; refuses the right things, then reads the assistant's answer aloud anyway" | shipped | **idea**. The authoring pattern (weaker = competent hurried attempt, never a strawman) for Taxila's "show two answers" moments | learning/pedagogy |
| A04 | `app/learn/rubrics/[id]/page.tsx@E0`, `rubric.css@E0`, `rubric-index.tsx@E0` | Exemplar rendering. Paragraph-by-paragraph EN then HI; notes under the paragraphs on phones and beside them from 760px (`grid-template-columns: minmax(0,1fr) Npx`); mark chips themed for light and dark; the index row carries a chip *inside* its single link | shipped | **adapt** | generative-ui/modules, design-system/ux |
| A05 | `lib/evidence/quest-rubrics.ts@main` | Rubric criteria are *read* from the quest's own lessons at module load (a concept line or the artifact hint), never authored, so "a criterion a learner never saw" cannot exist. `criteriaFingerprint` (FNV-1a) pins the text; any change requires a new version. A `notGradeable` rule with a written reason per quest. `questRubricCoverage()` measures gate 1 | shipped-measured (42 rubrics + 4 exceptions = 46 quests) | **adapt**. Covert-comprehension criteria must come only from what the teacher actually taught that session | learning/pedagogy; evals/gates |
| A06 | `lib/evidence/calibration.ts@main` (+ `scripts/evidence-calibration.mjs --self-test`) | `cohensKappa` over a fixed category list. Returns null with a reason when undefined (`no-pairs`, `no-variation`). Wilson interval for agreement; Fleiss–Cohen–Everitt asymptotic CI for κ, clamped, with a `largeSample` flag below 30 pairs. `calibrationNumberVerdict` against floors (90% agreement, κ≥0.6 on every criterion, ≥20 items) | shipped (5/5 synthetic fixtures; no real set exists) | **copy**. For inter-rater agreement between the comprehension-judge LLM and human teachers, between two judge models, and for parent-report QA | evals/gates/verification |
| A07 | `docs/learning/checks.md@main` | The near-miss check rule. The prompt is a scene from the learner's life (8–25 words). The answer is the lesson's own rule. Two distractors are plausible *wrong applications of the same rule in the same scene*, using a taxonomy: right rule wrong step / right rule wrong source / right rule half applied. The rationale names each near-miss by position and never names the answer | shipped-measured | **copy** (as an authoring rule for any MCQ Taxila generates, and as the shape of the misconception probes in covert comprehension) | learning/pedagogy/curriculum |
| A08 | `tests/learning-near-miss-checks.test.ts@main` | Exported counters: `contentWords` (EN/HI stop-lists, danda cut out of the Devanagari class), `distinctiveWords` (≥6 base letters, Hindi counted without matras), `answerOverlap`, `sceneWordCount`. `nearMissFailures()` covers retired stems, a scene that gives away the answer's words, distractor overlap ≥60%, a distractor that is (or paraphrases at ≥60%) any catalog bullet, a rationale of ≤60 characters, and Hindi parity. Negative controls run against the real pre-change objects | shipped-measured | **adapt**. Gate LLM-generated quiz items and on-the-fly module checks before a child sees them | evals/gates/verification |
| A09 | `lib/learning-journey.ts@main` L88–140 (`LearningLesson`, `LearningConceptCheck`), `lib/learning-catalog/types.ts@main` | Lesson schema: `outcome, why, concepts[3], workedExample{brief,weak,strong,reviewerNote}, artifactPrompt, artifactHint, conceptCheck, transferCheck, checkStyle`. Module schema: `level, prerequisiteLevel, sourceProvider/sourceUrl, evidenceArtifact, practice{scenario, options, correctIndex, rationale}, draft?, newSince?`. The record stores option *indexes* (smallint 0–2), never answer text | shipped | **adapt** for Taxila's lesson/module data model. Add CBSE/NCERT chapter ids, age band and modality variants | db-schema; learning/curriculum |
| A10 | `lib/learning/ladder.ts@main`, `docs/learning/ladder.md@main`, `LEARNING.md@main` | A five-rung ladder of content, never people. Quests are 3–5 consecutive lessons ending in a work sample, tiling each pathway exactly. `prepares` may be empty on purpose. `levelLessonCount` vs `levelQuestBandLessonCount`, with the reconciliation identity `questBand = lessons − carriedOut + carriedIn` held by test | shipped-measured | **adapt**. Week-sized finishable units, and no "you are level X" | learning/curriculum; gamification |
| A11 | `scripts/print-ladder.mjs@main` (+ `--fetch` snapshot mode `@M4`), `tests/learning-ladder-doc.test.ts@main/@M4` | Docs carry `<!-- BEGIN GENERATED … -->` blocks printed from the catalog. A test fails if prose types a count. @M4 adds a dated listings-only snapshot (5 fields per listing, checked by key set) and a demand table printed beside it | shipped (counts) / prototype (feed block, @M4 only) | **adapt**. Print a syllabus-coverage table (NCERT chapter × modules × checks) from a dated syllabus snapshot; never type counts | evals/gates; learning/curriculum |
| A12 | `docs/learning/feed-snapshot-2026-09-14.json@M4` + the feed block in `docs/learning/ladder.md@M4` | A demand→curriculum mapping: each role family's listing count beside the number of quests that prepare for it. It exposed domain-expert at 82 listings / 12 quests, software-research at 1 listing / 13 quests, and content-safety at 0 listings while 5 quests named it | prototype (stranded on @M4) | **idea**. Same table for "board-exam weightage × Taxila coverage" | learning/curriculum; growth/seo |
| A13 | `tests/plain-english-sentences.ts@E0` | One sentence splitter and word counter (`MAX_WORDS=20`, stepping over decimals and initials) shared by every reading-level gate, so two instruments cannot disagree | shipped | **copy**. Re-tune the ceiling per class band (e.g. 8–10 words for class 1–2, 12–15 for class 3–5) | evals/gates |
| A14 | `tests/bharat-languages.test.ts@main` (`allowedSourceOrTechnicalTerms`) as parsed by A02 rule 7 | No Latin tokens inside Hindi strings except an allow-list. The allow-list is parsed out of one file so every gate uses the same list. Paired with `docs/learning/hindi-terms.md@main` (the screen-term rule and glossary) | shipped-measured | **adapt**. Hindi/Hinglish register policy for children: which English terms stay (e.g. "photosynthesis" vs "प्रकाश संश्लेषण" per NCERT Hindi-medium books) | learning/pedagogy; prompt-compiler |
| A15 | `lib/evidence/vocabulary.ts@main` (`findBannedEvidenceWords`), `lib/vocabulary-lock.ts@main` | A tiered banned-word lock (e.g. certificate/guarantee/degree/नौकरी पक्की). Latin terms match on word boundaries, Devanagari as substrings | shipped | **adapt**. Ban test-like words ("test", "exam", "marks", "wrong answer") from covert comprehension turns, and ban promise words in parent reports | safety-floor/honesty |
| A16 | FNV-1a fingerprint + `FROZEN_EXEMPLARS` in A02; `criteriaFingerprint` in A05 | "A document has a date". A content change without a new date or version fails the build, and the failure message prints the exact pin line to add | shipped | **copy**. Pin published lessons, rubrics and parent-report templates | evals/gates |
| A17 | `tests/learning-transfer-allowlist.ts@main` | A dated, frozen, **shrink-only** allowlist. Every module is gated, and the known offenders are named with the date they were measured. A fixed module still listed fails the build. Nothing may be added | shipped | **copy** (pattern for grandfathering known defects without a fake-green gate) | evals/gates |
| A18 | `lib/saathi/pedagogy.ts@main` | The tutor CORE written as telegraphic rows (`key: value`, `a -> b`, `never: x`). Exactly **two appended-last MUST slots**: integrity (no answer to a checked step; one hint rung per turn) and ask-before-telling with its own bound. Also includes `firstMoveOnDoubt`, `explanationOrder`, `doubtEscalationLadder`, `onWrongAttempt`, `afterAFeeling`, celebration of events and never quality, refused mechanics with reasons, and a safety floor with Tele-MANAS 14416 / KIRAN 1800-599-0019 | shipped-measured | **adapt**. Base for Taxila's teacher CORE. The kid-specific inversions need owner decisions (§6) | prompt-compiler/persona-engineering |
| A19 | `lib/saathi/output-gate.ts@main` (`questionTrim`), `lib/saathi/register-predicates.ts@main` → `evals/indic-benchmark/lib/properties.mjs@main` | Seven code gates: empty, leaked answer, verdict shape, register/provenance, emoji, whole-reply (cut-off), and question-trim scoped to two intents. **Discard, never edit**, with a fallback to authored content. The gate and the eval import the *same* deliberately naive `endsInQuestion` | shipped-measured | **adapt**. Text-side gates for Taxila's gpt-5.6 turns, and post-transcript checks on realtime turns | safety-floor/honesty; prompt-compiler |
| A20 | `evals/saathi/register.mjs@main`, `lib/saathi/contract.ts@main` L170–235 (`SAATHI_REGISTER_BANDS`, `SAATHI_QUESTION_SHARE_CEILING=0.35`, `SAATHI_PACING`) | Register battery. Two arms: authored (offline) and model (only when a paid lane exists, otherwise reported NOT RUN). 290 distinct prompts + 30 repeats = n=320. Per-intent word bands, question share overall and per band, emoji/script/em-dash rates, gate-trip rate printed beside the register table, cached tokens, cost per turn | shipped-measured | **adapt**. Run Taxila's teacher register battery per model and per lane (text and realtime) before any flag flips | evals/gates/verification |
| A21 | `lib/saathi/memory/kinds.ts@main`, `never-store.ts@main`, `reset.ts@main`, `forget-intent.ts@main`, migration `202608310022_saathi_memory.sql@main` | A closed list of 6 memory kinds (weak topic, misconception, explanation style, goal, context given, term asked), enforced in TS + a DB CHECK + a test. Only two sources: an explicit learner statement in their own words, or a recorded event. **No affect stored.** Forgetting is a hard delete plus a forget term; there is no `deleted_at`; "ye bhool jao" is acted on before the reply renders | shipped | **adapt**. The "explanation style" and "misconception" kinds map directly to Taxila's learning profile. The no-affect rule conflicts with Taxila's emotional OS and needs a decision (§6) | memory-graph/consolidation; auth/consent |
| A22 | `lib/saathi/lane.ts@main`, `lib/saathi/lane-identity.ts@main`, `context/model-data-terms.json@main` | The lane refuses to build unless `MODEL_LANE_DATA_TERMS=paid` and a terms record exists (URL, date read, `paidTierTrainingUse=false`). A byte-identical CORE+TAIL digest is read back from the serialized wire body, and any mismatch is a `prompt-fork` discard | shipped-measured (0 forks / 320, several runs) | **adapt**. Mandatory for minors' data under DPDP. The digest idea is the reversal condition for realtime (D-061) | infra/azure/vercel/deploy; safety-floor |
| A23 | `lib/ai/router.ts@main`, `lib/ai/budget.ts@main`, migration `202609130032_model_spend_daily.sql@main` | Every model call goes through a feature router. Daily USD cap per feature from a DB ledger, failing closed to authored content | shipped-measured (feedback route ledger, 3 calls $0.001323) | **adapt** | infra/azure; telemetry |
| A24 | `lib/learning/feedback-gates.ts@main`, `lib/learning/feedback.ts@main` | Criterion-named AI feedback on a draft. 2–4 items; the criterion must be one of the lesson's own lines (the authored text is served); no verdict, no score-like number, ≤40 words of generated prose, no run of >15 consecutive words found in neither the draft nor the lesson (an answer-leak test); nothing stored | shipped-measured (72%→89% EN pass after the option-letter fix) | **adapt**. Feedback on a child's spoken or written explanation without grading | learning/pedagogy; safety-floor |
| A25 | `lib/learning/spacing.ts@main` | Spaced retrieval at 2/7/21/60 days, with a NEVER MANIPULATE audit in the header. No skipped/streak/seenAt field; `rescheduleMissed` moves dates forward so elapsed time cannot be expressed; the surface type carries no date; the card is absent when nothing is due | shipped | **adapt**. Taxila revisits concepts across sessions. Copy the structural no-guilt design | memory-graph; gamification |
| A26 | `lib/community-progress.ts@main` (four-question audit), D-053 level floor | Every mechanic answers four questions: does anything decay, does it nag, does it compare, does it reward only inspectable work. `levelFloor` means growth never demotes | shipped | **adapt** | gamification |
| A27 | `scripts/translate-lessons.mjs@main`, `lib/learning/lesson-translations.ts@main`, `docs/lesson-translations.md@main` | Build-time MT. Per-unit cache keyed by a per-module source hash; structural checks (option order and correctIndex never translated, target-script ratio, placeholders, echo refusal); a failing unit falls back to English and is recorded as a gap; changed source becomes a `source-changed` gap | shipped-measured | **adapt** for regional-language lesson packs (RBSE Hindi, later Marathi/Tamil…) | learning/curriculum; growth |
| A28 | `scripts/probe-translation-quality.mjs@main`, `docs/evals/translation-quality.md@main` | Two judges that did not translate. Adequacy and fluency 1–5, stratified sampling by seed, κ computed with A06 | shipped-measured | **adapt** (judge generated Hindi explanations) | evals/gates |
| A29 | `tools/responsive-audit/@main` | 10 checks (overflow, clipped text, 44px targets with 8px spacing, text floors, empty bands >160px, occlusion via elementFromPoint, desktop width, short-viewport reachability, reduced motion, contrast) plus RTL, run over 35 surfaces × 18 viewports × locales × themes = 2,912 cells. A check it cannot measure reports "unmeasured" | shipped-measured | **adapt** for Taxila's web and Capacitor surfaces | design-system/ux; android/capacitor |
| A30 | `components/commons-icons.tsx@F1`, `tests/round21-shell-residue.test.ts@F1` | Sprite membership decided by arithmetic: a symbol costs its geometry plus ~20 B, each `<use>` ~140 B, so a ~300 B path pays its way from two uses. The library's own `<svg>` elements are referenced, never copied paths. The CSS rule is gated on height | shipped-measured | **idea** | design-system/ux |
| A31 | `lib/learning-lessons/wave-d-1.ts@311af3b` (`multimodal-judge-generated-media`) | A four-bucket fault taxonomy for generated images: *asked* (a prompt word missed), *artefact* (no camera would show it), *style across the set*, *fit for the place* (a cultural mismatch drawn cleanly, e.g. a mangalsutra drawn as a plain chain, or snow on a Diwali rooftop). Each bucket routes to a different fix | shipped | **adapt**. A QA rubric for Taxila's gpt-image-2 lesson images and generated modules, since Indian cultural fit is a real failure mode | generative-ui/modules; multimodal-vision |
| A32 | `lib/ai-work-reality.ts@main` (+ the @M1 row) | A fact table: `claim{en,hi}, statedBy, sourceName, sourceUrl, sourceKind, checkedOn, assumption`. A dated reading lives here and never inside lesson strings | shipped | **idea**. A fact table for curriculum claims (NCERT page refs, dates checked) | learning/curriculum; company-brain |
| A33 | `docs/learning/review-round19/{review,accuracy,hindi-sample,work-fit}.md@main` | The depth-review method. Each pathway gets a 1–5 score on one question: "does a working professional recognise something real at the top rung". Every source is run through curl; checkable facts are verified against the live feed; 20 lessons are read in Hindi on an A/B/C scale; a ranked backlog orders items by (listings affected × depth gained ÷ effort) | shipped | **adapt**. A content-review protocol for generated modules ("would a CBSE teacher of class 7 recognise this as right and at level?") | learning/curriculum; evals |
| A34 | `docs/evals/bol/design.md@main`, `evals/indic-benchmark/@main`, D-073 | Public Indic behaviour benchmark. Items enter only by revocable post-completion donation; nothing is gamified; no composite score; every number carries n + CI beside the human ceiling; position and answer balance are audited (always-A scores 50%) | prototype | **idea**. A Hinglish kid-tutor behaviour benchmark built from donated, consented sessions | evals/gates |
| A35 | `lib/saathi/stage-gate.ts@main` | The server refuses on `stage` as well as on intent, so a client that forgets cannot obtain a checked step's answer. Photos are withheld from the model on checked steps | shipped | **adapt**. During covert comprehension probes, the teacher must never leak the probe answer | safety-floor/honesty |
| A36 | `LEARNING.md@main` "Evidence states" | Exposed → Practised → Calibrated → Reviewed → Published. Only the first three are automatable | shipped | **idea**. A comprehension-state ladder for each concept per child (heard → attempted → explained-back → transferred → parent-visible) | learning/pedagogy; relational-os |
| A37 | `lib/saathi/register.ts@main` (honorific arc) | The honorific is *state*, not mood: aap→tum by turn count, and `tu` is unreachable by type | shipped | **adapt**. Address register for children (tum/aap, didi/bhaiya teacher persona) as state | relational-os; prompt-compiler |
| A38 | `neon/migrations/202609130041_learning_catalog_wave_d_multimodal_top.sql@M3` | Catalog-row migration for 3 lessons | shipped | **skip** (domain-specific) | db-schema |
| A39 | @M1/@M2 lesson content (`wave-b-5.ts`, `wave-b-1.ts`, `wave-b-2.ts`) | Tax, payment-rail, open-model and trace lessons | shipped | **skip** (domain). Keep the pattern of "one real worked run with named values, read on a date" | learning/curriculum |

---

## 3. Key code excerpts worth porting (verbatim, short, no secrets)

### 3.1 The exemplar contract's core types and boundary (`lib/evidence/quest-exemplars/contract.ts@base`)

```ts
export const EXEMPLAR_MARKS = ["met", "partly", "not-met"] as const;
export type ExemplarNote = {
  readonly criterionId: string;
  readonly mark: ExemplarMark;
  /** Points at a line of the artefact. Never a restatement of the rule. */
  readonly note: LocalizedLearningText;
};
export type ExemplarSide = {
  readonly body: readonly LocalizedLearningText[];
  readonly notes: readonly [ExemplarNote, ExemplarNote, ExemplarNote];
};
...
export const EXEMPLAR_BOUNDARY: LocalizedLearningText = {
  en: "This is a reference, not an answer. Your brief is your own, and nobody is compared to this page. Hold your work beside it and read the notes in the margin.",
```

### 3.2 Rule 3: the weaker side must be an attempt, not an absence (`tests/evidence-quest-exemplars.test.ts@E0`)

```ts
const strong = exemplar.strong.notes.map((note) => note.mark);
assert.deepEqual(strong, ["met", "met", "met"], `${exemplar.questId}: the strong side is marked [${strong.join(", ")}], so it is not the reference`);
const weaker = exemplar.weaker.notes.map((note) => note.mark);
assert.ok(weaker.some((mark) => mark !== "met"), `${exemplar.questId}: the weaker side is met on all three, so nothing is lost anywhere`);
assert.ok(weaker.some((mark) => mark !== "not-met"), `${exemplar.questId}: the weaker side is not-met on all three, which is an absence rather than an attempt`);
```

### 3.3 A criterion can only be a line the lesson taught (`lib/evidence/quest-rubrics.ts@main`)

```ts
function criterionFrom(source: QuestRubricCriterionSource): QuestRubricCriterion {
  const lesson = lessons.get(source.moduleId);
  if (!lesson) throw new Error(`quest rubric: no lesson for module ${source.moduleId}`);
  const line = source.kind === "artifact-hint" ? lesson.artifactHint : lesson.concepts[source.index];
  if (!line) throw new Error(`quest rubric: ${source.moduleId} has no ${source.kind} at the named position`);
```

The `notGradeable` rule, verbatim from the header:

> "A quest is not gradeable when a criterion drawn from its own lessons would require the reviewer to know what ANOTHER NAMED PERSON said or did, and the sample cannot show it."

### 3.4 Kappa and Wilson (`lib/evidence/calibration.ts@main`)

```ts
export const CALIBRATION_AGREEMENT_FLOOR = 0.9;
export const CRITERION_KAPPA_FLOOR = 0.6;
export const CALIBRATION_PUBLISHED_MINIMUM_ITEMS = 20;
...
export function wilsonInterval(successes: number, n: number, z: number = Z_95): ConfidenceInterval | null {
  if (!Number.isFinite(n) || n <= 0) return null;
  const p = successes / n;
  const denominator = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denominator;
  const half = (z / denominator) * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
...
  if (1 - pe <= PE_TOLERANCE) {
    return { n, agreed, percentAgreement: po, po, pe: 1, kappa: null, undefinedReason: "no-variation", percentAgreementCi, kappaCi: null };
  }
  const raw = (po - pe) / (1 - pe);
  const kappa = Math.abs(raw) < 1e-12 ? 0 : raw;
```

### 3.5 Near-miss counters (`tests/learning-near-miss-checks.test.ts@main`)

```ts
export function contentWords(value: string, lang: "en" | "hi"): string[] {
  if (lang === "hi") return (value.match(/[ऀ-ॣ०-ॿ]{2,}/g) ?? []).filter((word) => !HI_STOP.has(word));
  return (value.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? [])
    .map((word) => word.replace(/['-]+$/, ""))
    .filter((word) => word.length >= 3 && !EN_STOP.has(word));
}
export function answerOverlap(answer: string, option: string, lang: "en" | "hi"): number {
  const answerWords = [...new Set(contentWords(answer, lang))];
  if (answerWords.length === 0) return 0;
  const optionWords = new Set(contentWords(option, lang));
  return answerWords.filter((word) => optionWords.has(word)).length / answerWords.length;
}
const MAX_SCENE_WORDS = 25;
const MIN_SCENE_WORDS = 8;
const MAX_DISTRACTOR_OVERLAP = 0.6;
```

### 3.6 The two appended-last slots (`lib/saathi/pedagogy.ts@main`)

```ts
export const saathiMustFireLast: readonly string[] = [
  "MUST: never give or confirm the answer to a checked step. Hint from the ladder, one rung per turn, then stop.",
  "MUST: ask before telling. The ask opens a turn; close on a statement; the last character is never a question mark.",
];
```

Plus selected CORE rows (shapes, never sentences):

```ts
"firstMoveOnDoubt: ask-what-was-tried -> restate-back -> then content",
"explanationOrder: plain-restate -> one-anchor -> smallest-case -> hand-back-the-next-move",
"doubtEscalationLadder: rung1 orient-where-to-look -> rung2 authored-constraint -> rung3 how-options-were-built -> stop",
"onWrongAttempt: name what the attempt got right first, then the one thing to redo",
"onCorrectAttempt: ask for the reason, not more praise",
"comprehension-tag: samajh-aaya, samjhe, clear-hua, got-it, makes-sense, theek-hai-na",
"comprehension-tag-never: as a closing line; it asks nothing and teaches nothing",
"afterAFeeling: one turn only -> prove you took in the actual thing -> name the work-shaped part -> hand the floor back",
```

### 3.7 Per-intent register bands (`lib/saathi/contract.ts@main`)

```ts
export const SAATHI_REGISTER_BANDS = {
  "doubt-support": { center: 20, max: 32 },
  "ask-me-a-question": { center: 20, max: 32 },
  "give-a-hint": { center: 24, max: 40 },
  "define-a-word": { center: 30, max: 55 },
  "explain-simpler": { center: 55, max: 95 },
  refusal: { center: 26, max: 45 },
} as const;
/** Question-share ceiling across a battery, from the losing profile above. Never per turn. */
export const SAATHI_QUESTION_SHARE_CEILING = 0.35;
```

### 3.8 The question-trim gate (`lib/saathi/output-gate.ts@main`)

```ts
function questionTrim(intent: SaathiIntent | undefined, text: string): QuestionTrimOutcome {
  if (!intent || !QUESTION_TRIM_INTENTS.has(intent)) return { applies: false };
  const trimmed = text.trim();
  if (!endsInQuestion(trimmed)) return { applies: false };
  ...
  if (terminators.length < 2) return { applies: true, ok: false };
  const boundary = terminators[terminators.length - 2]!;
  const rest = trimmed.slice(0, boundary + 1).trim();
  const dropped = trimmed.slice(boundary + 1).trim();
  if (rest.length === 0 || endsUnfinished(rest)) return { applies: true, ok: false };
  return { applies: true, ok: true, text: rest, trimmedWords: wordCount(dropped) };
}
```

### 3.9 One reading-level instrument (`tests/plain-english-sentences.ts@E0`)

```ts
export const MAX_WORDS = 20;
export function sentencesIn(value: string): string[] {
  return value
    .replace(/(\d)\.(\d)/g, "$1\u0001$2")
    .split(/(?<=[.?!])["'”’)\]]?\s+/)
    .map((part) => part.replace(/\u0001/g, ".").trim())
    .filter((part) => part.length > 0);
}
```

### 3.10 A typed fact never comes back (`tests/learning-ladder-doc.test.ts@M4`, NOT on @main)

```ts
// Listings only, five fields each. No member data can be in the file because no other key can.
for (const listing of snapshot.listings) {
  assert.deepEqual(Object.keys(listing).sort(), ["family", "id", "pay", "provider", "title"], `${listing.id}: extra field in the snapshot`);
}
...
assert.match(feed, /\| `content-safety` \| 0 \| 0\.0% \| \d+ \|/);
```

---

## 4. Measurements

Every row gives its n, method and date. Rows marked **[mine]** I measured during this harvest; all others are quoted from the repo.

### 4.1 Round 21 (14 Sep 2026)

| claim | n / method / date | source |
|---|---|---|
| Catalog after wave D: 21 pathways, 164 lessons, 46 quests, 42 with a published rubric, 11 with a worked exemplar | derived from `lib/learning-catalog`, 14 Sep 2026 | `context/measurements.md@main` L1263 |
| "homepage-only sources 22 → 0; feed snapshot 172 listings (content-safety 0)" | recorded 14 Sep; **true on @M4 only** | `context/measurements.md@main` L1266 |
| **[mine]** @main still has 22 bare-domain-root lesson `sourceUrl`s (23 of 165 counting one in `types.ts`); @M4 has 0 lesson ones (1/162, the same `types.ts` entry) | grep `sourceUrl: "https?://[^/"]+/?"` over `git show <ref>:lib/learning-catalog/*.ts`, 2026-10-02 | this harvest |
| The typed feed sentence ("about 1,000 listings") overstated the feed 5.8× (172 actual). content-safety, named as dominant, had 0 listings; domain-expert had 82 (47.7%) | live feed `api/opportunities?limit=200`, 172 items, 13 Sep 2026 | `docs/learning/review-round19/accuracy.md@main` A1; `ladder.md@M4` |
| Listings vs quests that prepare for each family: language-evaluation 35/12, data-annotation 12/15, search-relevance 16/5, speech-ai 3/5, content-safety 0/0 (after the drop), domain-expert 82/12, physical-ai 5/2, software-research 1/13, other 18/— | snapshot fetched 2026-09-14 01:30Z, 172 listings | `docs/learning/ladder.md@M4` generated block |
| Pay reading: 31 of 172 listings stated a rate, $2.40–$16.50/h, most often $3.00–$4.50; the top tier is ~4× the common one, driven by domain and language depth, not speed | count over the whole feed, 13 Sep 2026 | `lib/ai-work-reality.ts@M1` (`work-list-pay-reading-2026-09-13`) |
| Shell HTML 112,932 → 107,772 B with a 16-icon sprite (9,593 B, 47 `<use>`); geometry-carrying `<svg>` 88 → 57; shell render median 45 → 20 ms | n=5 warm, local build, same document (Today, EN, light), 14 Sep | `context/measurements.md@main` L1255; `components/commons-icons.tsx@F1` |
| Sprite of all 35 icons: 117,557 B, **larger**, rejected. 128 pixel comparisons: 74 byte-identical, max difference 49/255 | same | same |
| Production baseline: 112,118 B, 88 `<svg>`, 48,587 B of SVG of which only 16,629 B is distinct geometry | production `/commons`, demo member, 14 Sep | same |
| Rail void C5 failing cells (of 40 per width), strip answered: 1760×990 6→0, 1760×1100 5→0, 1920×1080 6→0, 2560×1440 12→0. With the strip up, the counts cannot fall because the instrument counts the fixed strip's descendants | local audit, 14 Sep | `context/measurements.md@main` L1243 |
| Rail foot top 889 → 708 px at 1920×1080, 1249 → 708 at 2560×1440. A first gate at 1000px left a 241px band at 1760×990 | local audit | `tests/round21-shell-residue.test.ts@F1` header |
| Translation passes this round: $0.36 + $0.19 + $0.18 (19 locales); round spend ≈ $1.60 | run meters | `context/measurements.md@main` L1266, timeline L878 |
| Accidental Saathi model arm (DeepSeek-V4-Flash): 154/320 served, question share 47.4%, ask-me-a-question 88%, 4/5 bands over; **not reportable** | n=154, 14 Sep, TLS resets the same hour | `context/measurements.md@main` L1269 |
| **[mine]** Saathi TAIL bytes, Hindi vs English, same lesson: remote-money-from-abroad 5,305 vs 3,217; remote-tax-basics-bharat 5,273 vs 3,294; earn-ai-work-reality 5,234 vs 2,713; openml-run-it-free 5,322 vs 2,617 (cap 6,000). Same content costs ~1.6–2× the bytes in Devanagari, which is why @M1 compressed its Hindi | `compileTail` @main, understand stage, empty history, max-length question, n=4 lessons, 2026-10-02 | this harvest (scratchpad script) |
| **[mine]** Gates on @main pass: exemplar + near-miss 31/31; ladder-doc + quest-rubrics 25/25. They pass *while* @main carries the stale feed sentence, because @M4's guarding test did not land | `node --test`, 2026-10-02 | this harvest |

### 4.2 Learning design (Rounds 12–20)

| claim | n / method / date | source |
|---|---|---|
| Old checks: 139/139 recall prompts were one of two stems, answered by `concepts[0]` verbatim; 139/139 answers shared ≥50% of their content words with the rules printed directly above the question; 69/139 EN and 54/139 HI shared ≥50% with the one-line description; 139/139 had a distractor that was another lesson's bullet | live tree, journey audit, 13 Sep 2026 | `docs/learning/checks.md@main` |
| Near-miss conversion across 100 lessons: retired stem 70%→0; a distractor restating another lesson's rule 99%→0; a distractor sharing ≥60% of the answer's words 0→0 | gate's own counters, batches 2–5 (n=13/26/32/29), 13 Sep | timeline Round 15; measurements L1067 |
| Batch 1 (n=21): retired stem 18/21→0; borrowed-rule distractor 20/21→0; answer overlapping what the studio prints above it 21/21→10/21 EN, 9/21 HI (through the disclosure) | same script over `git show HEAD:` vs the converted tree, 13 Sep | `docs/learning/checks.md@main` |
| Batch 6 (n=18 legacy): scene of 8–25 words in both languages 0/18→18/18; correctIndex unchanged 36/36; answer text unchanged 36/36 | same | same |
| Recall prompt length (b2): 7–12 words (median 10) → 20–24 (median 22) | n=13 | measurements L1080 |
| Public page with the description open above the unanswered check: answer overlap ≥50% in 75/139 EN, 62/139 HI → title only: 4/139 EN, 2/139 HI | gate counters, 139 lessons, Round 16 | measurements L1142 |
| Transfer answers that repeat `concepts[1]` verbatim: 49 of 58 (both languages) | all 58 published modules, 2026-09-01 | measurements L76; `tests/learning-transfer-allowlist.ts@main` |
| Worked examples: 44 of 139 had a weak side under 8 content words; mean weak-side length by pathway 4.8 (ai-trainer-essentials) vs 10.4 (human-layer-service) | Round 19 review, 139 lessons | `review.md@main` §"three structural facts" |
| Worked-example leak: strong side vs the practice's correct option overlap: system-preference-signal 1.00, system-sft 0.90, agentops-report-in-numbers 0.94 …; 15/139 over 0.50 | content-word overlap, Round 19 | same |
| Fix: weak side <12 content words 53→0 (59 original lessons) and 48→0 (48 wave-b lessons); strong overlap ≥0.6 4→0 and 17→0 | gate counters, 14 Sep | measurements L1206, L1229 |
| Depth review: mean 3.35/5 over 20 pathways, no 5; 14/20 never reach ustaad; catalog 2,714 min ≈ 45 h; 9 pathways under 100 min | one reviewer, all 139 lessons in EN, 20 in HI, 13 Sep | `review.md@main` |
| Hindi sample: 20 lessons (~480 units), 11 A / 9 B / 0 C. Every B stiffens at a screen term the no-Latin rule forced into a coinage | line-by-line read, Round 19 | `hindi-sample.md@main`; timeline Round 19 |
| Sources: 75/81 distinct `sourceUrl`s return 200; 6 return 403 (an openai.com bot-block) | `curl -sIL`, 13 Sep | `accuracy.md@main` |
| Authoring cost: ~20 min per lesson for both near-miss checks in both languages | stated estimate | `docs/learning/checks.md@main` |
| Round 12 authoring: 5 agents × 16 lessons; EN words per lesson min 335, median 365–394, max 412; 16 sources replaced after being opened | agent reports, 13 Sep | measurements L947 |
| Day-7 retention: 2 of 6 (week of 24 Aug) | `member_activity_cohorts`, 1 Sep | timeline L800 |
| Population at the Round 12 retune: 15 onboarded, 11 learning rows, 0 practice-complete | DB count, 1 Sep | measurements L962 |

### 4.3 Tutor register and models (Saathi, register battery, n=320 per run unless noted)

| claim | n / method / date | source |
|---|---|---|
| Question share against a 35% ceiling. grok-4.1-fast: 67.8% → 68.0% (emoji gate) → 41.5/44.7% (bounded slot 2) → 42.7% → 48.3% (rejected clause) → **23.2% / 25.8%** (question-trim gate). gpt-4.1-mini: 86.9 → 75.0 → 76.7 → 50.3% | register.mjs model arm, Azure Foundry v1, concurrency 6, 290 distinct prompts + 30 repeats, 1–13 Sep | measurements L95–934 |
| Three vendors failed identically (66.9/68.0/86.9%), so the cause was the prompt, not the model. The cause: an unbounded "MUST: ask before telling" in the strongest slot | same | measurements L401 |
| "close on a statement" is the operative clause: replacing it with "close on the next move they make" (keeping "last character is never a question mark") cost 23 points (41.5% → 64.2%) | n=320 each; n=80 pilots pointed the wrong way twice | measurements L489–517 |
| Mid-CORE rows had no detectable effect: 47.0% vs 44.7% (inside the interval). Reverted | n=320, 1 Sep | same |
| Question-trim cost: define-a-word trimmed 65.6–68.8% of turns (avg ~5 words dropped), give-a-hint 45.3–47.6%, 0 discards on grok | two n=320 runs, 13 Sep | measurements L838 |
| Position law: a rule mid-brief fired 0/8; the identical rule appended last fired 8/8 | n=8, a companion product's measurement, cited | `lib/saathi/pedagogy.ts@main` header |
| Prompt rule vs code predicate: leaked in 57.1% of ordinary and 98.1% of adversarial turns as a prompt; 0 leaks in 31,122 trials as a predicate | n=31,122; date and method not recorded in this repo | `lib/saathi/output-gate.ts@main` header; D-052 |
| Emoji: off-vocabulary and banned glyphs 2.2% → 0.0% *by construction*; the model's real rate is the emoji gate-trip rate, 8/320 = 2.50% | n=320, 1 Sep | measurements L268 |
| Register centre: the companion's measured 20.5 words per turn. The loser of a blind 38-2 head-to-head ran 36.1 words, 1.74 questions per turn and ended 63% of turns on a question | companion product, cited | `lib/saathi/contract.ts@main` L170 |
| A byte-identical prompt lost 38-2 on a different model and drifted 41→53 words per turn against a 20.5 target, hence the per-model law: any model or lane change re-runs the battery | cited | `evals/saathi/register.mjs@main` header |
| Hinglish romanized costs 1.63–1.77 tokens per word | n=3, DeepSeek-V4-Flash, 2026-09-02 | `contract.ts@main` maxOutputTokens note |
| Cost per turn: grok ₹0.035–0.037; gpt-4.1-mini ₹0.076–0.082 (list price, upper bound, no cache discount) | meters, 1–13 Sep | measurements |
| Latency: grok p50 1,026 / p95 1,437 ms; gpt-4.1-mini p50 1,305 / p95 1,764; 0/40 fuse hits each. Unpaid Gemini: p50 ≈ 5.3 s, 8/19 turns at the 12 s fuse | n=40 direct provider calls, 13 Sep; n=19 production, 10 Sep | measurements L726–756, L593 |
| Production after the lane flip: 4/6 model-path turns served by grok at 0.7–1.6 s | n=6, 14 Sep | measurements L992 |
| Gemini thinking: 326–429 thinking tokens spent against a 128 budget, cutting answers mid-word (4/6). At 640: 0/19 cut-offs, but one turn spent 787 | production, n=6 / n=19, 2 Sep | measurements L585–604 |
| Cache: grok reports cached tokens 1,666 > prompt tokens 1,512 (not a subset, so ratios are meaningless). gpt-4.1-mini reports a genuine subset at 79.6% | n=4 identical requests; n=320 | measurements L176, L361 |
| Vision: DeepSeek-V4-Flash returned a confident invented description ("a man in a suit…") of a synthetic gradient at prompt_tokens 16. Across 160 calls on 5 models, 2 models declared a section illegible and then invented content anyway | 1 synthetic JPEG per model, 1 Sep; 160 calls, 31 Aug | measurements L207; timeline L665 |
| Feedback gate pass rate: 71.9% → 89.1% EN and 87.5% romanized Hindi after the option-letter fix; no script penalty existed | 16 matched pairs, n=64 per arm, 13 Sep | measurements L1181 |
| Feedback route: p50 1,555 ms, p95 1,962; $0.000439 per call; 16/20 model-served | n=20 local (10 EN / 10 HI), 13 Sep | measurements L964 |
| Generic multilingual ASR: 32–52% CER on code-switched Hinglish | cited | D-059; LEARNING.md |
| Cascade voice floor ~1.4–1.5 s; a realtime lane twice dropped rules the text lane keeps (once safety, once recall) | cited | D-061 |

### 4.4 Translation, evaluation instruments and UX

| claim | n / method / date | source |
|---|---|---|
| MT drop rate (gpt-4.1-mini): first run 0.36% (108/30,177 units) over 19 locales; Manipuri 99.55%, Santali 100% (cannot write the script); second run Bodo 15.74%, Kashmiri 5.45%, the rest ≤2.42% | 139 modules × 19 locales, 13–14 Sep; $7.17 | measurements L984–1036 |
| MT quality: adequacy 4.61/4.52, fluency 4.57/4.55 from two judges; **κ ≤ 0 in 13/19 locales despite a median 92.5% raw agreement** (the high-agreement/zero-κ artefact) | 40 units × 19 locales = 760 units, 1,520 judgments, 13 Sep, $0.09 | measurements L1087 |
| Kappa arithmetic self-test: 5/5 fixtures incl. Cohen's 2×2 (κ=0.400), and an 82%-agreement set where κ is exactly 0 | 175 synthetic pairs, 1 Sep | measurements L63 |
| Reviewer agreement: **not measured**. No real set exists | — | measurements L45 |
| bol corpus: better-reply-is-B 0/28 → 28/56 pairs; an always-A model's score 100% → 50% | 132 items, 14 Sep | measurements L1236 |
| Responsive audit over 5 production runs: distinct defects 1,170 → 689 → 570 → 510 → 439; C3 passing cells 25 → 1,520 of 2,818 | 2,912 cells each, 13 Sep | measurements L1038–1204 |
| Today paint: FCP 1,192 → 408 ms (phone) and LCP 2,756 → 408. A Suspense boundary *alone* moved FCP by zero; moving the stylesheet was the second half | n=5 warm, production, 14 Sep | measurements L1214 |
| First-timer journey: taps to the first interactive element 4 → 1; Work list first paint 1,484,284 → 25,461 B; Saathi open 100 → 21 words | Playwright 390×844, n=1 per cell, 2 Sep | measurements L532 |

---

## 5. Rejections (tried → what broke)

This is the highest-value section. Ids are local to this file.

| # | tried | what broke / why rejected | source |
|---|---|---|---|
| R1 | **Squash-merging @M4 into main** (6986880, titled "every homepage-only source replaced, the ladder's feed snapshot printed, content-safety dropped") | The merge carried **1 of 40 files**. The 22 source replacements, the feed snapshot JSON, the `print-ladder.mjs` feed mode, the content-safety drop, 21 locale translation updates and the gating test were all lost. `context/measurements.md` then logged "homepage-only sources 22 → 0", which @main does not satisfy. The gates still pass because the gate itself was lost. **Lesson for Taxila: verify a merge by content (added-line presence or a tree diff), never by the merge message, and log measurements only from the merged tree.** | `git show 6986880`; line-presence check (§1.2); [mine] |
| R2 | A sprite of all 35 shell icons | The document grew 112,932 → 117,557 B. An icon used once costs its geometry plus a wrapper and saves nothing. Rejected for arithmetic-chosen membership (16 icons) | `commons-icons.tsx@F1` |
| R3 | A `<symbol>` holding Phosphor's nested `<svg>` | It differed from the inline icon by hundreds of device pixels per size. Rejected for a `<use>` of the library's own `<svg>` | same |
| R4 | A rail-foot rule gated at 1000px of height | A 241px band remained at 1760×990. Re-gated at 930px from measured band heights (bands need 782px; the gap crosses 160px at 942px) | `round21-shell-residue.test.ts@F1` |
| R5 | The exemplar gate's first form | It flagged Hindi sentences ending on the danda, and an English artefact quoting a Marathi transcript line. Both were *test* bugs, not content bugs; fixed in 8544cb1 | timeline L872 |
| R6 | Authoring quest rubric criteria separately from lessons | "A rubric line a learner never saw is a trap." Rejected; criteria are read from lesson lines at module load, so there is only ever one copy | `quest-rubrics.ts@main` header |
| R7 | Letting an agent hand-write 105 anchor triples (210 Hindi sentences) | They would be the weakest Hindi in the product, sitting inside the instrument reviewers must agree on. Framed anchors were shipped instead, with a measured reversal: any criterion under κ 0.6 gets hand-written anchors in a new version | same |
| R8 | A synthetic calibration set to close gate 2 | "Would pass every check in this file and prove nothing about any reviewer." `publishedCalibrationSets` stays empty | `calibration.ts@main` |
| R9 | Recall checks with a bare stem whose answer is `concepts[0]` verbatim, with the rules printed above | 139/139 had the answer on screen; learners matched strings | `checks.md@main` |
| R10 | Distractors borrowed from other lessons' bullets | Learners eliminated by register ("sounds like a different job"). Annotation vocabulary landed inside a pension lesson | same |
| R11 | Exact-equality ban on borrowed distractors | Paraphrases got through. Replaced by a ≥60% content-word floor over bullets of ≥4 content words, which caught a batch-1 distractor on its first run | timeline Round 15 |
| R12 | A literal list of retired stems | 13/13 batch-2 prompts were bare stems in other words and passed. Fixed by adding an 8-word scene floor | `checks.md@main` |
| R13 | Hindi tokenizer `[ऀ-ॿ]+` and code-unit length | "है।" became a content word; six-code-unit nouns counted as "distinctive". Fixed: the danda is cut from the class and length counts base letters | near-miss test comments |
| R14 | Printing the module description above an unanswered check on the public page | 54% EN / 45% HI of lessons showed half the answer. Now a closed disclosure, opened by the correct answer | timeline Round 16 |
| R15 | Freezing 18 legacy lessons' whole option lists | Too broad. The freeze was narrowed to correctIndex plus the answer text, after a file-by-file read proved nothing else reads distractor text | `checks.md@main` |
| R16 | Hand-typed counts and feed facts in docs ("about 1,000 listings") | 5.8× wrong, and named a family with zero listings. Counts are now generated (landed). The feed block is generated only on @M4 (lost, R1) | `accuracy.md` A1; `ladder.md@M4` |
| R17 | `prepares` naming content-safety on 5 quests | Zero listings in the feed. Dropped in Rounds 19–21; the last three drops are on @M4 only | `ladder.md@M4` |
| R18 | A pairwise worked example decided on "safety", which the lesson's rules did not list | A learner could not derive the verdict from the lesson. Fixed by handing the learner a rubric that includes safe (@M2) | `review.md` #29; @M2 |
| R19 | The charge-first scene saying an Aadhaar address update is free | False at a centre. Replaced with a voter-list check, which is free. This is the one @M4 change that landed | 6986880 |
| R20 | Two `why`s making stronger claims than their source carried | Softened on @M4 (lost with R1) | timeline L874 |
| R21 | An unbounded "MUST: ask before telling" in the strongest slot | 66.9–86.9% question share across 3 vendors; the comprehension tag ("samajh aaya?") was most of it | measurements; `pedagogy.ts` |
| R22 | Five slot-2 wordings | Pilots at n=80 pointed the wrong way twice; "close on the next move" gave 64.2%; "every turn closes on a statement" pushed doubt-support to 33.5 words against a 32 cap | measurements L489 |
| R23 | Mid-CORE rows (`askWhatWasTried: opening move only`…) | 47.0% vs 44.7%, no effect. Reverted: "bytes that buy nothing are still bytes" | same |
| R24 | A fourth clause inside slot 2 naming the two worst bands (Round 12) | The aggregate got worse (42.7% → 48.3%). Targeted bands improved but untargeted ones regressed (ask-me 35 → 64%, doubt 28 → 45%). Clause order inside a slot is mechanism too. Reverted | measurements L685 |
| R25 | A gate discarding every question-ending reply | It would have discarded two turns in three and reported a register no learner was served. Replaced by a trim scoped to 2 intents | `pedagogy.ts` "WHY NOT A GATE" |
| R26 | A third appended-last slot | It dilutes the two that matter. Capped at exactly 2 by the budget test | `pedagogy.ts` header |
| R27 | The emoji vocabulary enforced only as a prompt row | 2.2% leaked. Became two fatal gates | measurements L231 |
| R28 | Deliberate typos for liveness (the companion's ~1 per 15 messages) | "A typo in rubric is a teaching error." Banned; liveness comes from rhythm and shortforms instead | timeline L647 |
| R29 | Affection emoji, persona backstory, face, openers, re-engagement, reactions on work | Inverted for a tutor with no age verification. A tick on work is a verdict with no words | `boundary.saathi-is-not-a-person` |
| R30 | Storing affect ("panics before practice") in memory | A durable unreviewed judgement; cannot be shown honestly on a privacy screen; not needed to teach. Refused in code + DB CHECK (D-057) | D-057 |
| R31 | Soft delete for forgetting | Deleting a row alone buys one turn before the conversation re-teaches it; `deleted_at` invites wrong filters. Hard delete + forget term instead (D-058) | D-058 |
| R32 | Auto-sending voice transcripts | At 32–52% CER the guide answers a different question confidently. Transcript-to-box only; there is no send event in the state machine (D-059) | D-059 |
| R33 | `webkitSpeechRecognition` as a silent fallback | Its Hinglish quality is poor, and a sometimes-bad lane with nothing on screen saying so is worse than none (D-060) | D-060 |
| R34 | Live voice calls | The cascade floor is ~1.4–1.5 s and a realtime lane dropped rules twice (safety, recall). Declined until the realtime lane accepts byte-identical CORE (D-061). **Taxila's realtime plan must meet this reversal condition explicitly** | D-061 |
| R35 | A cloned human voice for the tutor | "A claim of personhood." Refused at any step | D-061 |
| R36 | DeepSeek-V4-Flash as a lane | 58–71% lane failures, 4–5/5 bands out, and a fabricated image description | measurements |
| R37 | gpt-4.1-mini as the tutor lane | Question share 75–87%, a give-a-hint band failure, and 2.2× the cost | measurements |
| R38 | Unpaid Gemini keys | Terms permit training use and human review of learner content (photos of minors' notebooks), plus an 8/19 fuse-hit latency tail. A paid-lane assertion replaced them (D-068) | D-068 |
| R39 | A provider thinking budget of 128 inside a 320-token envelope | Gemini ignored the budget (326–429 thinking tokens) and served mid-word fragments. Fixed by a cut-off gate plus budget 640 outside the answer allowance | measurements L566 |
| R40 | The code comment claiming "~9× cheaper, ~90% cache hit" | Never measured. Deleted, then instrumented. Inflating CORE to reach a cache floor was refused | `boundary.core-cache-discount-unmeasured` |
| R41 | A case-insensitive option-letter regex in the feedback and stage gates | It matched the article "a" and discarded 1 in 4 feedback replies | timeline Round 18 |
| R42 | Text normalisers keeping letters and digits but dropping `\p{M}` | Every Devanagari vowel sign was deleted; Hindi glossary and search never matched. **Found twice** (Rounds 9 and 11). Rule: keep `\p{M}` | timeline L816 |
| R43 | Analytics "signin_google succeeded" emitted at redirect start | It hid a 10-day sign-in outage. Rule: an outcome event must be emitted by the code that observes the outcome | timeline L815 |
| R44 | Word counts and tap sweeps including closed `<details>` | Overstated (141 vs 123 words); phantom 42.68px targets. Use `checkVisibility()` | timeline L619, L805 |
| R45 | "Cut text, fewer boxes" followed literally (Round 5) | Every reveal and animation was deleted; the page passed its checks and failed its reader. Words fall only as structure and motion rise | timeline L756 |
| R46 | A coloured left-rail card motif | The founder said it read as a generic AI website. Replaced by ruled rows | timeline L766 |
| R47 | Top-aligning the ID card at very wide screens | The empty band widened 333 → 698 px. Sizing beats moving | timeline L867 |
| R48 | A Suspense boundary alone for Today's paint | FCP changed by zero until the stylesheet moved too | timeline L867 |
| R49 | Parallel agents picking migration numbers | Collisions (0021 ×3, 0035 ×2). Renumber at merge | timeline L776, L832 |
| R50 | Each content agent editing count pins and union migrations | Main went red. One scaffold file per agent plus one reconciliation script | timeline L823, L862 |
| R51 | Negative controls reading `git show HEAD:` | Correct in the worktree, wrong after the merge. Pin to the branch-base commit | timeline L837 |
| R52 | Shared node_modules bind mounts across worktrees | Removing a worktree emptied the deps mid-session; this happened three times | timeline L766, L805 |
| R53 | Machine-translating Manipuri and Santali with gpt-4.1-mini | 99.55% and 100% drop. Excluded from every run (they re-request every unit) | measurements L984 |
| R54 | Level name "kaarigar" | It collided with an existing Trail member-level DB check. Renamed "mahir" before any id was written | timeline L823 |
| R55 | "Un-draft a pathway on its last lesson" | A draft pathway may not hold a published module. Publish on the first lesson | timeline L823 |
| R56 | A pre-launch photo pilot (60 photos) | **Waived by the founder** (D-063), not rejected technically. Runtime gates remain and the fabrication rate is watched from live gate trips | D-063 |

---

## 6. Concepts (with Taxila relevance)

1. **The exemplar beside the rubric ("the missing middle").** Grading nothing leaves a learner unable to tell whether their work is good. The answer is a reference at a stated standard next to a competent-but-hurried weaker attempt, with margin notes that point at lines. *Taxila:* when the teacher shows a model answer, always pair it with a plausible weaker one and say which line made the difference. That is the non-test way to teach standards to a 10-year-old, and parents can see the same pair.

2. **The weaker side is an attempt, never an absence or a strawman.** The test enforces it: never all-not-met, a body of at least 60 words. *Taxila:* generated "wrong" examples must be the mistakes children of that age actually make (misconception-driven), not obviously silly ones.

3. **Criteria are lesson lines.** One copy of the text, fingerprinted; any change requires a new version. *Taxila:* a covert comprehension judgement may only use criteria the teacher actually taught or stated in that session. Otherwise the child is judged against a rule they never heard.

4. **Not gradeable is a real answer.** If judging would require seeing what another person did, the item gets no rubric and a written reason instead. *Taxila:* parent reports must not claim things the system could not observe (e.g. "explained it to a sibling").

5. **Near-miss distractors.** There are three shapes: right rule wrong step, right rule wrong source, right rule half applied. The scene must not give away the answer's distinctive words, and the rationale names why each near-miss fails *here*. *Taxila:* this is the shape of a misconception probe. Covert comprehension should present near-miss explanations ("so the moon makes its own light?") rather than test stems.

6. **The screen is half the defect.** Content rules cannot fix an answer printed above the question. *Taxila:* generated modules must not render the explanation's key sentence next to the check that tests it.

7. **Levels are of content, never of people.** Quests are week-sized finishable units, and milestones come only from finished work. *Taxila:* never "you are level 3"; show the child what they made.

8. **NEVER MANIPULATE as a four-question audit**, held structurally (types without `streak`, `missed` or `dueSince` fields). *Taxila:* children are the most manipulable users. Port the audit into every gamification mechanic, and ban streak-loss and countdowns by type.

9. **Celebrate events, never quality.** Celebration is licensed only by a client-recorded moment, and ability praise ("brilliant", "genius") is banned. *Taxila:* growth-mindset praise of method; this is research-aligned for children.

10. **Position is mechanism; shapes, not sentences.** Exactly two appended-last MUST slots. Clause order inside a slot is measured mechanism too. *Taxila:* the teacher CORE should reserve its last bytes for "never leak the probe answer" and "ask before telling, close on a statement". The realtime instructions need the same discipline, and must be measured on the realtime model, not assumed.

11. **A prompt rule is a preference; a code predicate is an invariant.** Discard rather than edit, and always keep an authored fallback (Phase A). *Taxila:* every child-safety rule needs a code gate on the transcript or text and an authored fallback utterance.

12. **One predicate shared by the gate and the measurement**, deliberately naive, so the two cannot drift. *Taxila:* the comprehension-signal extractors used in evals and in production must be the same code.

13. **Measurement discipline.**
    - Every number carries n, method and date.
    - Read a stochastic result as a band, not a point (two n=320 runs: 23.2/25.8).
    - Print the gate-trip row beside every property a gate enforces, because a zero bought by discards is not the model's behaviour.
    - The per-model law: any model or lane change re-runs the battery.
    - Two arms (authored and model); a model arm that cannot run is reported NOT RUN, never approximated.

14. **High agreement with zero κ.** With skewed marginals, 92.5% agreement can carry κ ≤ 0. *Taxila:* when validating an LLM comprehension judge against teachers, report κ (with Wilson and FCE intervals), not percent agreement.

15. **Generated docs from data, and dated snapshots.** Never type a count or a market fact. *Taxila:* coverage of the NCERT syllabus should be a printed table from a dated syllabus snapshot.

16. **Demand-to-curriculum mapping.** Listings vs preparing quests exposed mismatches (82/12 against 1/13). *Taxila:* map board-exam weightage and common-misconception frequency against lesson coverage.

17. **Shrink-only dated allowlists.** A gate is real for everyone, and known offenders are named, dated and can only be removed. *Taxila:* use this for legacy generated content.

18. **A document has a date.** Fingerprint pins, where any change requires a new authoredOn or version. *Taxila:* published lessons, rubrics, parent-report templates and consent text.

19. **No-affect memory (D-057) against Taxila's emotional OS.** AI2Bharat refuses to store affect for three reasons: an unreviewed judgement, unshowable on a privacy screen, and unnecessary to teach. Taxila's mandate (an emotional OS that bonds over months) is the opposite. The harvest recommends that Taxila adopt the *test*: every stored row is shown to the parent and child in the words it is stored in, and anything that cannot pass that test is not stored. A per-session affect *read* that changes delivery without persistence satisfies D-057's logic. Any persisted affect needs owner sign-off, DPDP review for minors and parent visibility.

20. **Memory kinds closed in three places** (an enum, a DB CHECK and a test), with only two sources (stated or recorded event) and **forget = hard delete + forget term**. *Taxila:* the learning profile ("learns best by story or rhyme") maps to the `explanation style` kind. "Misconception" and "weak topic" are directly reusable.

21. **The honorific is state, not mood.** *Taxila:* the teacher's warmth arc (aap→tum, or the name-use frequency of about 1 turn in 5, never in a correction) becomes a relational-OS state machine.

22. **The paid-lane data-terms assertion plus byte-identical prompt digest.** *Taxila:* for minors this is non-negotiable. Azure terms are recorded with their date, and the realtime session instructions are byte-compared against the compiled CORE (D-061's reversal condition).

23. **Merge verification by content.** The M4 lesson: a squash or merge with a claimful message can silently drop a branch, after which measurements get logged against code that is not on main.

24. **Optimisation chosen by arithmetic on the real render** (the sprite), and **layout rules gated on the dimension that actually varies** (height, not width).

25. **Depth review: "would a working professional recognise it."** A scoring rubric for content depth (procedure + numbers + named failure mode + document convention). *Taxila:* "would a good class-7 science teacher recognise this explanation as correct, age-right and NCERT-aligned".

---

## 7. Gaps and unread

- **Out of segment:** branches `claude/ai2bharat-community-u6o28e`, `codex/neon-member-platform`, `codex/opportunity-ingestion` and `codex/rlhf-learning-onboarding`.
- **Exemplars:** I read only the Seva exemplar in full. The other ten exemplars (@E1/@E2) were verified by diff stats and line presence, not read line by line.
- **wave-d-1 (@M3):** I read lesson 1 (`multimodal-judge-generated-media`) in full. Lessons 2–3 (`physical-ai-write-a-scenario`, `physical-ai-adapt-a-rubric`) I read only through the header and the timeline.
- **@M1/@M2:** I read through diffs and extracted English strings. The Hindi halves were sampled, not fully reviewed.
- **Not read:**
  - `app/learn/rubrics/[id]/page.tsx` beyond `ExemplarSide`, and `rubric.css`;
  - `docs/evidence/calibration.md`, `docs/evals/bol/{design,harness-spec,first-100-items,sources}.md`;
  - `docs/learning/review-round19/work-fit.md`, and most of the per-pathway verdicts in `review.md`;
  - `docs/strategy/*` (six strategy reports, plus 07-humanizer-direction);
  - the `tools/responsive-audit/` source.
- **Saathi internals:** read only through headers, LEARNING.md, the registry and the timeline. That covers `handler.ts`, `stage-gate.ts`, `vision-gate.ts`, `memory/*`, `asr.ts`, `register.ts`, `bubbles.ts`, `context-windows.ts` and `distress.ts`. A dedicated Saathi harvest would extract the vision-gate predicates, the extractor shapes and the hint-ladder authoring.
- **Not inspected:** the migrations (the 0041 SQL included) and the 21 locale translation JSONs.
- **Tests:** I did not run the full suite. I ran 4 test files (56 tests, all passing on @main, 2026-10-02).
- **The leak measurement:** "57.1% / 98.1% / 0 in 31,122" has no date or method recorded in this repo. It appears to come from an earlier companion-product study. I treat it as cited, not reproduced.
- **D-061 ("realtime lane twice dropped rules")** has no attached n or date in this repo.
- **Not confirmed:** whether translations for the @M4-changed `why` strings (0790d1a, "Sources … translated") translated text that never reached main. The pipeline keys translations by a per-module source hash, so they would be stale or absent rather than wrong.
