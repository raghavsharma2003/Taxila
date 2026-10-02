# Harvest: Gurukul (teacher clones on RelationalOS) for Taxila

Harvested 2026-10-02 from `/home/user/html-portfolio` (read-only; nothing checked out or modified).

**Scope.** `origin/claude/gurukul-platform` (tip `771feef9`, 2026-08-28, "feat(voice): ship blinded model
selection", 403 commits) and the workstream branches `origin/gurukul-ws-{v,w,x,y,z,aa,ab,ac,ah..as}`.
Every one of those ws branches has **0 commits that are not already on `gurukul-platform`** (all were
merged), so every path below is cited at `@GP` = `origin/claude/gurukul-platform` unless stated. Read
with `git show origin/claude/gurukul-platform:<path>`.

**Method.** Read in full: `docs/gurukul/{SPEC-GURUKUL, student-app-spec, teacher-arc, safety-floor-teacher,
teacher-sheet-spec §4, AZURE-DEPLOY-STATE, DESIGN-SYSTEM, DESIGN-LAW, ROADMAP-100X, PRODUCT-JOURNEY parts 2-3}`,
`docs/gurukul/research/{mirror-learning, relationalos-100x, voice-stack, VOICE-BAKEOFF-HINDI-ENGLISH-2026-08-28,
VOICE-FRONTIER-2026-08-28, competitors, INDICF5-PRONUNCIATION-NORMALIZER}`, `AGENTS.md`, `context/STATE.md`,
the teacher/practice/safety code. `context/{rejected,decisions,measurements}.md` were diffed by heading
against `origin/main`: **146 rejections, 164 decisions, 147 measurements are Gurukul-era** (not on main);
the ones relevant to a child voice tutor are quoted below with n/method.

**Secrets.** No key, password, HMAC value or token appears in this file. `api/_config.js` was not read.
Endpoint hostnames are omitted even though the source docs call them non-secret.

**Notation.** "[inference]" marks my own reasoning for Taxila, not something Gurukul measured.

---

## 0. The ten things that matter most (read this if nothing else)

1. **Gurukul never shipped a student product.** The student surface exists only behind
   `VITE_PRODUCT_SURFACE=gurukul-student` and was never deployed. Within 24 hours of founding, the owner
   re-pointed the effort at a horizontal "clone yourself" platform (Vyakti), and the last two days went
   almost entirely to one unsolved problem: **the cloned Hindi voice sounded foreign and robotic.**
2. **The most reusable code is the deterministic practice engine** (`src/engine/practice/*`,
   `src/engine/practiceTalk.ts`). It encodes "a model never grades, a model only talks about grades",
   author-tagged distractors (`slip` vs `conceptual`), a `rushed` verdict from floor-seconds, cited
   "moments", a mastery fold with no decay-by-absence, and a structural ability-label fence.
3. **Safety laws measured, not argued:** prompt instructions leaked 57-98% while a SQL/output predicate
   leaked 0 of 31,122 (`gate0-structural`). Anything decidable on bytes must be a predicate, not a
   prompt line. Disclosure must be app-voiced UI, never the persona's job.
4. **Prompt-authoring laws:** sentence-shaped examples get recited (4/5 turns; 0 at n=84 after removal);
   a rule mid-brief fired 0/8, appended last 8/8. Write shapes and slot patterns, never lines.
5. **The mentor arc is ready content** (`teacher-arc.md` §1-§6): competence before warmth, method-not-
   ability praise, ability-label ban, MENTOR BOUNDARY replacing the companion's romance clause, rituals
   christened not installed, exam windows never countdowns. It was written for 16-18; K-9 needs it
   tightened, not loosened.
6. **Minor-first defaults are structural:** `MINOR_HARD_GATES` is frozen and never read through config;
   `setAgeTier()` can only ratchet toward stricter. Gurukul's student surface calls it once at mount.
7. **Hindi/Hinglish TTS: nothing passed a human ear.** Chatterbox (MIT) is the incumbent and was rejected
   by its own subject as "an American or British speaker talking in Hindi". India-native IndicF5 scored
   the best identity proxy (ECAPA 0.825) but Azure-ASR WER on mixed-script Hinglish was 0.45 and it misread
   6/8 chemical symbols. No listener panel ever ran. Speaker-embedding scores repeatedly disagreed with ears.
8. **Script is a first-class variable.** Sarvam ASR returns Devanagari (even for English words), a
   romanised Hindi lexicon then measured code-switch ratio 0.000 on obviously bilingual speech, and a naive
   tokenizer shredded every matra. Keep raw vs script-aware error separate; expose Hindi / Hinglish /
   English as three choices, not two.
9. **Azure serverless T4 works without a quota request**, but a 9.7 GB GPU image cold-starts in 161 s and
   the waking request dies at ~240 s; HMAC with a 60 s skew fails on every cold wake; a Readiness-only
   probe crash-loops slow models. A 424.7 MB CPU image cold-starts in 35.6 s and survives. Design every
   user path so it never absorbs a GPU cold start.
10. **Generated content: Gurukul explicitly rejected AI-authored questions for v1** ("a generated JEE
    question with a wrong answer key is a much worse failure than an illegal chess move"). Taxila's
    on-the-fly modules must therefore keep the engine/talk split: generated *presentation* is fine,
    *graded truth* must come from a verified key, and the voice teacher may only name what the module's
    machine-derived state says.

---

## 1. What Gurukul was and how far it got

### 1.1 Intent and timeline

| date | event | source @GP |
|---|---|---|
| 2026-08-24 | Replica Lab line decides `replica-self-only` (only a verified living adult can clone themself; minors, public figures, third parties closed) and `replica-provider-portable` | `context/decisions.md` |
| 2026-08-25 | **`gurukul-founding`**. Owner voice note: a credible JEE Advanced teacher uploads YouTube/voice/text, the platform builds a clone (knowledge, personality, culture, tone, voice), students chat and call it with "Duolingo-grade gamification"; "on a call you should not be able to tell the clone from the teacher". Branch = merge of the RelationalOS companion line (`claude/ai-companion-app-rkt1lv` @ f4d3fe4) and the voice-cloning line (`voice-cloning` @ a7bdcaa), merge `554cc5d`, 11 gates green | `docs/gurukul/SPEC-GURUKUL.md` §0 |
| 2026-08-26 (am) | Waves 1-5 land offline (WS-A..K): TeacherSheet, practice engine, dynamic sheet loading, student surface, studio teacher mode, ingestion stats, channel watch, in-house voice primary, reciprocity ledger, drift gate, recall bench | `decisions.md#gurukul-ws1-landed` .. `#gurukul-ws45-landed` |
| 2026-08-26 | **Owner reweight** (`horizontal-platform-reweight`, `platform-north-star`): "a self-serve platform where an expert builds an AI version of themselves ... remembers each person it talks to, and comes with a MEASURED guarantee that it still sounds like them". Edtech becomes the wedge, not the product. In-house open-weights voice becomes primary. Meera deprioritized | `SPEC-GURUKUL.md` §8 |
| 2026-08-26 (pm) | WS-L..AS: Azure GPU deploy, first real clone of the owner, fine-tune, Mirror Call, design system + DESIGN-LAW, three-step studio wizard (Feed / Meet / Deploy), Context Locker, processing pipeline, audio protection deployed | `context/STATE.md` |
| 2026-08-27 | Owner hears the clone: **"not even 0.05% similar"**, base voice **"very western and not indian"**. Root cause 1 found: enrollment reference was 8 kHz audio in a 24 kHz label (0.000458% energy above 8 kHz → 0.0224% after fix, ~49x) | `STATE.md` START HERE |
| 2026-08-28 | Hindi/Hinglish voice bake-off and frontier sweep; isolated eval runtimes for IndicF5, Qwen3-TTS, VoxCPM2, OpenVoice, ZONOS2 (blocked), MOSS (blocked); sealed blinded packs built; **0 listeners**. Last commit 771feef9 | `docs/gurukul/research/VOICE-*.md`, `measurements.md` 2026-08-28 entries |

### 1.2 Architecture (as specced)

```
teacher uploads (video/audio/text)          student app (chat + calls + practice)
        |                                            ^
   REPLICA LAB  ---- produces ---->  TEACHER AGENT --+
   (consent, identity, evidence,     = vy_agent row  |
    VoiceGenome, Person Model,       + TeacherSheet  |
    calibration, provenance)         + voice profile |
                                     + knowledge kit |
                                            ^        |
                                     RELATIONAL OS --+
                                     (memory per dyad, rel-state, honesty,
                                      safety floor, compiler, activities,
                                      call engine, surfaces)
```
(`SPEC-GURUKUL.md` §1.) "A teacher clone is one `vy_agent` row + one TeacherSheet + one voice profile +
one knowledge kit, dropped onto the unchanged engine." Per-teacher isolation is `api/_agentscope.js`'s SQL
predicate ("0-in-31,122 leakage").

### 1.3 Shipped vs code-complete vs specced (as of 2026-08-28)

| thing | state | evidence @GP |
|---|---|---|
| Teacher studio web app (`vyakti-replica-lab` on Vercel) with Google OAuth + 6-digit email OTP (Supabase, separate project from Meera) | **LIVE** | `STATE.md` LIVE table |
| Neon Postgres, migrations 015-065 | **LIVE** (125 tables on 2026-08-26; 064, 065 later) | `STATE.md`, `AGENTS.md` |
| Enrollment pipeline (8-step DAG: integrity, malware_scan, media_probe, diarize, separate, enhance, transcribe via Sarvam, voice_quality) as an Azure Container Apps Job every 5 min | **LIVE**, ran the owner's 822.7 s and 109-min uploads | `STATE.md`, `measurements.md#long-lecture-*` |
| Self-hosted Chatterbox GPU runtime + HMAC admission broker, voice-evidence (ECAPA/diarize/DeepFilterNet), audio-protection (PerTh watermark + C2PA), media-extract (yt-dlp), voice-finetune job | **LIVE**, scale-to-zero | `docs/gurukul/AZURE-DEPLOY-STATE.md` |
| "Preview my voice": real 24 kHz watermarked audio with spoken disclosure | **LIVE** (proven 2026-08-27) | `measurements.md#wav-format-unsupported-fixed-and-proven-end-to-end` |
| Release gates: `node scripts/verify-release.mjs` 16 checks; journey score 15/15; PR #5 draft, CI green | **LIVE** | `AGENTS.md` |
| Clone sounds like the person | **FAILED by ear**, unmeasured by any panel | `STATE.md`, `rejected.md#rejected-hindi-samples-are-negative-controls-not-a-benchmark` |
| Student app (practice hub + mastery map + chat/call shell) | code-complete behind a build flag, **never deployed** | `src/gurukul/surface.ts`, `PRODUCT-JOURNEY.md` Part 2 |
| Session-open disclosure card on the student surface | **missing** (BREAK S1, "highest-priority item") | `PRODUCT-JOURNEY.md` Part 2 |
| TeacherSheet's 24 pedagogy fields (incl. `cloneDisclosureFact`, `academicIntegrityStance`, `doubtEscalationLadder`) reaching the prompt | **NOT compiled in**; data only. Stated in `src/engine/agents/teacher.ts` header | grep: not referenced by `persona.ts`/`compiler.ts` |
| `teacher-relay-claim` honesty predicate | **specced only** (mentioned in UI copy) | `safety-floor-teacher.md` P5 |
| Revision queue (FSRS), mock-test cycle, Teacher Profile screen, parent dashboard, cohort view | **specced only**; no `revision.ts` exists | `student-app-spec.md` §1.3, §1.4, §5, §6 |
| Practice session in relational memory / live call lane | **not wired** (localStorage only) | `src/gurukul/practiceStore.ts` header |
| Mirror Call (owner calibrates clone live), Channels (embed widget, Telegram, WhatsApp), Context Locker, Activity surface | code-complete, gated offline, mostly never executed against the DB | `STATE.md` "What is NOT live" |
| Ingestion LLM qualitative pass | seam that throws 503 | `src/engine/ingest/qualitativePass.ts` |
| YouTube audio extraction from Azure | **blocked** at bot check on all 10 yt-dlp player clients; residential proxy (~$0.077 per 15-min lecture) recommended, not bought | `measurements.md#youtube-extraction-blocked-from-azure` |

### 1.4 What each workstream did (scope branches)

All are merged into GP. Earlier waves (WS-A..U) are on GP via merge commits; listed briefly for context.

| WS | branch | what it did | Taxila relevance |
|---|---|---|---|
| A,C,G | (wave 1) | TeacherSheet type + arc-override seam + demo teacher "Arjun Sir"; JEE syllabus + practice grading engine + `practiceTalk`; ENV-MANIFEST + DEPLOY runbook | high (A, C) |
| B,D,E | (wave 2) | `vy_teacher_sheet` (mig 051) + fail-closed loader; student surface minor default + mastery + 12-question demo bank; studio teacher mode | high (B, D) |
| F,I,J,K | (waves 3-5) | ingest stats + sheet draft; channel watch (proposed deltas only); in-house voice primary + fidelity gate; reciprocity ledger, drift gate, recall bench | medium |
| L,T,U | (deploy) | Azure GPU deploy; first real clone; LoRA fine-tune + window sweep | medium (infra lessons) |
| V | `gurukul-ws-v` | **earbench**: blind ABX listening bench; found the spoken disclosure unblinds every test | high for any voice choice |
| W | `gurukul-ws-w` | "Preview my voice" panel; cold start presented as an honest state | medium |
| X | `gurukul-ws-x` | Mirror Call backend: "approval as one SQL clause, selection as the voice loop" | medium (never-silent-update pattern) |
| Y | `gurukul-ws-y` | Mirror Call tab: delta chips, per-turn thumbs, "I'd say it like this" | medium |
| Z | `gurukul-ws-z` | research: online mirroring and learning (CIPHER, Reflexion limits, model collapse, sycophancy) | **high for learning-pattern discovery** |
| AA | `gurukul-ws-aa` | product journey audit + design system with values + real landing | high (design) |
| AB | `gurukul-ws-ab` | Context Locker: multi-file "bring your context" with provenance; refusal matrix | medium (curriculum PDF ingestion) |
| AC | `gurukul-ws-ac` | clone replies inside Mirror Call through the one gated door, no fallback persona | medium |
| AH | `gurukul-ws-ah` | something finally drains the enrollment queue (a complete runner had no caller) | law: grep for a caller |
| AI | `gurukul-ws-ai` | YouTube route as one env var; free levers measured out | low |
| AJ | `gurukul-ws-aj` | "waiting on you / waiting on us" as a TYPE; phone layout stated, not subtracted | high (honest states UX) |
| AK | `gurukul-ws-ak` | worker as a Job; wake-then-sign; first evidence GPU round trip; diarize completes | high (infra lessons) |
| AL | `gurukul-ws-al` | audio-protection deployed on CPU; build-time proof that the model runs | high (infra lessons) |
| AM | `gurukul-ws-am` | layout readability gate on the real signed-in screen; nine grid track bugs | medium |
| AN | `gurukul-ws-an` | transcribe via Sarvam instead of Azure Speech (owner directive) | medium |
| AO | `gurukul-ws-ao` | `separate` windowed to the owner's best ~10 s instead of the whole file | low |
| AP | `gurukul-ws-ap` | one honest next action in the rail; sticky pager deleted | medium (UX) |
| AQ | `gurukul-ws-aq` | `REPLICA_SELF_TEST_MODE` owner-only bypass of identity/liveness for testing | caution (see §4.9) |
| AR | `gurukul-ws-ar` | enrollment clip emitted at 48 kHz but 24 kHz demanded: fixed + cross-boundary gate | law: test both sides of a format gate |
| AS | `gurukul-ws-as` | skip 16 kHz Sepformer when one speaker dominates; bandwidth gate with real FFT | low |

---

## 2. Reusable assets

### 2.1 Asset table

"Use" = **copy** (lift with minimal change), **adapt** (structure reusable, content/params change),
**idea** (pattern only). Taxila features: (1) relational voice teacher, (2) covert comprehension,
(3) learning-pattern discovery, (4) generated modules.

| # | path @GP | what it does | Taxila use | feature |
|---|---|---|---|---|
| A1 | `src/engine/practice/session.ts` | pure state machine for a question set: `grade()` (5 formats), `Verdict` enum, distractor tagging, `moments()` with citations, `summarize()` | **adapt**: keep verdict/moment/citation machinery, replace JEE formats with K-9 formats (MCQ, numeric, drag-match, ordering, fill-blank) | 2, 4 |
| A2 | `src/engine/practice/mastery.ts` | `foldMastery` (commutative, order-independent), two-axis levels (score band AND min attempts), `xpFromGraded` (excludes rushed/skipped), sparse `XP_TIERS` | **copy** the fold + levels; retune thresholds for young children | 2, 3 |
| A3 | `src/engine/practice/syllabus.ts` | syllabus as data with derived stable ids (`p.em.electrostatics.gauss-law`), "append freely, rename never", `syllabusIssues()` duplicate-slug check, `MARKING`, `FLOOR_SECONDS` | **adapt**: CBSE/NCERT + RBSE K-9 tree in the same id discipline | 2, 3 |
| A4 | `src/engine/practiceTalk.ts` | "the ONLY place a practice set becomes words": ≤14-word telegraphic facts, `ABILITY_LABELS` fence, internal-id fence, never "always" from one session | **copy** pattern; widen the label list for K-9 (see §4.6) | 1, 2 |
| A5 | `src/engine/activity.ts` (`ActivityState`) | contract for "a thing we are doing together": `facts`, `nameable` (honesty allowlist), `record` (durable), `state` (undroppable machine truth), `idea`, `over` | **adapt**: the seam for the voice teacher to talk about a generated module without inventing contents | 4, 1 |
| A6 | `src/gurukul/practiceStore.ts` | localStorage history with try/catch on every read/write, XP summed once from graded record | **idea** (Taxila must persist server-side per child, with consent) | 3 |
| A7 | `src/components/PracticeActivity.tsx`, `src/components/MasteryMap.tsx`, `src/styles/practice.css` | screen that "computes nothing"; **a verdict never appears before commit** (no slot-machine "you're right!" on tap) | **adapt** UX rule | 2, 4 |
| A8 | `evals/practice.mjs` | grading edge cases incl. one-wrong-kills multi-correct, negative control on the ability fence | **adapt** as Taxila's grader eval | 2 |
| B1 | `src/engine/agents/teacherTypes.ts` | `TeacherSheet extends CharacterSheet`: arc overrides REQUIRED, 24 pedagogy fields, 4 platform floor fields, consent pointer, voice id | **adapt** into a Taxila `TutorSheet` (one fictional persona, not a clone) | 1, 2 |
| B2 | `src/engine/agents/characters/demoTeacher.ts` | "Arjun Sir": fully filled fictional sheet (explanationOrder, workedExamplePattern, firstMoveOnDoubt, 6-rung doubt ladder, rigorFloor, analogyBank as {topic, anchor}, 15-row mistake bank, life shape) | **adapt** content to a K-9 tutor; keep the shapes | 1, 2 |
| B3 | `docs/gurukul/teacher-arc.md` | mentor-arc stage paragraphs, comfort ladder in teacher voice, win protocol (method not ability), rituals, exam calendar as window, 14-row minor-stricter table | **adapt** (it is the single best content asset) | 1 |
| B4 | `src/engine/agents/cloneLife.ts` | tutor's plausible day as a PURE function of (shape, clock): two calls in one slot agree by construction; notes are place/posture/activity, never a feeling | **copy** pattern so "what are you doing, didi?" never gets two answers | 1 |
| B5 | `src/engine/agents/fromSheet.ts` | `sheetToModule` (pure), `validateTeacherSheet`, `consentGateBlockers`, helpline extraction, phrase-bank verifier | **adapt** for publish-time validation of any tutor persona | 1 |
| B6 | `api/_teachersheet.js` + `db/migrations/051_teacher_sheet.sql` | fail-closed loader: published + consent enforced in CHECK, in WHERE, and in JS; one error code so revocation cannot be enumerated; **no fallback agent** | **idea/adapt** if Taxila ever hosts teacher-specific personas | 1 |
| B7 | `api/_teacher-sheet-draft.js`, `src/engine/ingest/{transcriptStats,sheetDraft}.ts` | draft vs publish split (draft saves with field errors; publish fails closed), owner scoping as a predicate, honest `gaps` | **idea** | 1 |
| C1 | `src/gurukul/surface.ts` | product seam: `applyStudentSurfaceDefault()` sets `minor` once via the restrict-only ratchet; not run at import | **copy** | safety |
| C2 | `src/engine/clock.ts` | `MINOR_HARD_GATES` frozen, `gatesFor()` short-circuit, tier clock (minor: disclose 2 h, break 1 h), client mirror fires with zero network, reconcile MAX(local, server) | **copy** | safety |
| C3 | `src/engine/honesty.ts` | output predicates (`findActionable`, `findOutOfBandReceipts`, `findSharedPastFabrications`, `findFalseAttributions`, `findActivitySpecifics`, `guardReply`, `createStreamGuard`); `PUBLISHED_HELPLINES` incl. Childline 1098 | **adapt** (large, 120 KB; the class list matters more than the code) | 1, safety |
| C4 | `api/_clonechannel.js` `cloneDisclosureCard()` | app-voiced disclosure that never reaches the model, byte-identical to what the publisher saw | **copy** pattern ("AI tutor" card at session start) | safety |
| C5 | `evals/persona-invariants{,.data}.mjs` | per-registered-module, per-lane floor checks (helplines, never-deny-AI, NEVER MANIPULATE, spoken register, never-internals) | **adapt** | safety |
| C6 | `docs/gurukul/safety-floor-teacher.md` | structural enforcement point for every safety delta, gamification test, academic integrity | **adapt** | safety |
| D1 | `src/engine/reciprocity.ts`, `evals/reciprocity.mjs` | tracks the agent's self-disclosure vs the user's (Kuki study) as a pure fold over a trailing window; note carries an anti-fabrication fence | **adapt** (child's openness over months) | 1, 3 |
| D2 | `evals/drift.mjs` | 44-turn session compile asserting floor + appended-last + CORE byte-stability at every turn | **copy** pattern | 1 |
| D3 | `evals/recallbench/` | LoCoMo-style recall harness (3 dyads, 190 turns, 50 questions); deliberately no offline number | **adapt** | 1, 3 |
| D4 | `src/engine/validity.ts` (mig 056) | bi-temporal fact edges (valid-from/valid-to) | **idea**: "used to struggle with fractions" vs "now fine" | 3 |
| E1 | `docs/gurukul/research/mirror-learning.md` | CIPHER-style learning from corrections, pitfalls, gates | **idea** core for learning-pattern discovery | 3 |
| E2 | `docs/gurukul/MIRROR-CALL-SPEC.md` + `api/_mirrorcall*.js` | proposals as chips with evidence counts; nothing lands without a tap (one SQL clause) | **idea** (parent/teacher-visible approvals of learned profile) | 3 |
| F1 | `services/open-voice-runtime/{broker.py,app.py}` | CPU HMAC admission broker in front of a private GPU app; disclosure prefix + PerTh enforced before return | **idea/adapt** if self-hosting TTS | 1 |
| F2 | `services/audio-protection/` | PerTh watermark + C2PA on CPU; `bake_models.py` exercises the model at build time | **adapt** if Taxila needs provenance on generated voice | safety |
| F3 | `scripts/earbench.mjs`, `docs/gurukul/EARBENCH.md`, `scripts/voice-listening-benchmark.mjs` | blind ABX + rating bench, accent as its own axis, disclosure trimmed fail-closed | **copy** for TTS selection with real Indian kids/parents as listeners | 1 |
| F4 | `evals/voice-bakeoff/prompts.v1.json`, `plan.mjs`, `docs/gurukul/research/VOICE-BAKEOFF-*.md` | 24 matched prompts (Devanagari / Roman Hindi / mixed-script / English) in a Class 10 chemical-reactions domain; release gates | **adapt** prompts to K-9 tutor speech | 1 |
| F5 | `services/indicf5-runtime/pronunciation_normalizer.py` | audited chemistry/numeral normalizer for Hindi TTS with negative controls (IP, AI, IIT, He, In, As) | **adapt** for science/maths read-aloud | 1, 4 |
| F6 | `evals/speech/hinglish-script-score.test.mjs` | raw vs script-aware WER, confusable controls (`he` vs `hai`, `the`) | **copy** | 1, 2 |
| F7 | `api/_voice/hindi-text-frontend.js`, `evals/speech/hindi-text-frontend.test.mjs` | Roman-Hindi to reviewed Devanagari, language-segmented synthesis joined with a declared 60 ms gap | **idea** | 1 |
| G1 | `src/studio/design/tokens.css`, `docs/gurukul/DESIGN-SYSTEM.md` | scale tokens: 6 type sizes (11 px floor), 6 spacing steps, radii, 4 motion durations, 4 status states | **adapt** scale, not palette | design |
| G2 | `docs/gurukul/DESIGN-LAW.md` + `scripts/check-copy.mjs`, `check-motion.mjs`, `check-contrast.mjs` | copy bans enforced by a gate with negative controls; transform/opacity only, 300 ms cap | **copy** gates | design |
| G3 | `src/studio/errorCopy.ts`, `wizardModel.ts` + `evals/studiowizard.mjs` | errors quote the server, never invent a cause; status is a pure function exhaustively tested (n=6,912 inputs) | **copy** pattern | design |
| H1 | `docs/gurukul/context-locker.md`, `api/_context/{pdf,docx,extract}.js` | magic-bytes-first type detection; refusal matrix (scanned PDF, CID fonts, encrypted) | **idea** (NCERT PDFs often fail a naive text layer) | 4 |

### 2.2 Snippets (verbatim, short)

**A1. Verdicts are facts about an attempt, never about a child** (`src/engine/practice/session.ts`):

```ts
export type Verdict =
  | "clean_solve"
  | "partial"
  | "slip"
  | "conceptual_miss"
  | "skipped"
  | "rushed";

export type ErrorNature = "slip" | "conceptual";

export interface Distractor {
  /** the option id, or the numeric value, that this wrong answer is */
  answer: OptionId | number;
  nature: ErrorNature;
  /** the solution step it comes out of — "the substitution step", "the sign on
   *  the second term". The ONLY thing `practiceTalk.ts` may name about a wrong
   *  answer, and the thing `streak_of_slips_same_step` counts. */
  step?: string;
}
```

Grading order is the design: skipped, then rushed, then the score.

```ts
export function grade(q: Question, r: Response, elapsedMs: number): Graded {
  const s = score(q, r);
  ...
  if (s.empty) return { ...base, verdict: "skipped" };
  if (elapsedMs / 1000 < floorSecondsFor(q)) return { ...base, verdict: "rushed" };
  if (s.correct) return { ...base, verdict: "clean_solve" };
  if (s.marks > 0) return { ...base, verdict: "partial" };
  const d = distractorFor(q, s.wrongAnswer);
  return {
    ...base,
    verdict: d?.nature === "slip" ? "slip" : "conceptual_miss",
    ...(d?.step ? { step: d.step } : {}),
  };
}
```

Why distractor nature is authored, not inferred (header comment): "Deriving it instead, from timing, from
how close a number is, would be the engine forming an opinion about a student's understanding out of thin
air." `conceptual_miss` is the **unmarked default**, meaning "we have no evidence this was a slip", NOT
"the student does not understand".

**A1. Moments, sparse and cited** (`session.ts`):

```ts
export type MomentShape =
  | "first_clean_solve_of_topic"
  | "comeback_after_miss"
  | "streak_of_slips_same_step";

export interface PracticeMoment {
  shape: MomentShape;
  topicId: string;
  step?: string;
  /** the attempts it is made of — the citation, never decoration */
  questionIds: readonly string[];
}

export const SLIP_SUPPORT = 3;   // matches vy_pattern support_count >= 3
```

`SLIP_SUPPORT = 3` licenses "third time on that step today", never "you always": the standing-pattern
bar is `support_count >= 3 AND distinct_days >= 2`, unreachable inside one session by construction.
`momentsAt(s, questionId)` returns only moments COMPLETED on that question, so a poke never re-announces
an old comeback ("one event, one note").

**A3. Marking and floor seconds** (`syllabus.ts`, JEE-specific values):

```ts
export const MARKING: Record<QuestionFormat, MarkingScheme> = {
  single_correct: { full: 3, partialPerOption: 0, wrong: -1, skipped: 0 },
  multi_correct: { full: 4, partialPerOption: 1, wrong: -2, skipped: 0 },
  integer: { full: 4, partialPerOption: 0, wrong: 0, skipped: 0 },
  numerical: { full: 4, partialPerOption: 0, wrong: 0, skipped: 0 },
  matrix_match: { full: 8, partialPerOption: 2, wrong: -1, skipped: 0 },
};
export const FLOOR_SECONDS: Record<QuestionFormat, number> = {
  single_correct: 20, multi_correct: 35, integer: 30, numerical: 30, matrix_match: 45,
};
```
[inference] For K-9, drop negative marking entirely (it teaches fear of attempting), and calibrate floor
seconds per age band and per item from real response-time data, not guesses.

**A2. Mastery: two axes, no decay by absence** (`mastery.ts`):

```ts
export const SCORE_BANDS = { developing: 0.4, solid: 0.7, mastered: 0.9 };
export const MIN_ATTEMPTS = { building: 1, developing: 3, solid: 3, mastered: 6 };

export function xpFromGraded(graded: readonly Graded[]): number {
  let xp = 0;
  for (const g of graded) {
    if (g.verdict === "rushed" || g.verdict === "skipped") continue;
    xp += Math.max(0, g.marks);
  }
  return xp;
}
export const XP_TIERS: readonly number[] = [40, 120, 300, 600, 1200, 2400, 4800];
```
Header law: "A student who does not practise a topic for a month must not come back to a LOWER mastery
number than they left — nothing here reads a clock ... the property holds because the code that could
violate it does not exist." [inference] Keep this for the displayed mastery; put forgetting-curve logic
in a separate review scheduler (Gurukul specced FSRS in `student-app-spec.md` §1.3 but never built it).

**A4. The ability-label fence** (`practiceTalk.ts`):

```ts
export const ABILITY_LABELS: readonly string[] = [
  "brilliant", "genius", "gifted", "talented", "talent", "natural", "prodigy", "topper",
  "smart", "clever", "bright", "sharp", "dull", "slow", "weak", "strong", "average",
  "hopeless", "stupid", "dumb",
  "careless", "sloppy", "lazy", "undisciplined",
  "rank", "percentile",
];
const LABEL_RE = new RegExp(`\\b(${ABILITY_LABELS.join("|")})\\w*\\b`, "i");
const ID_SHAPED = /\b[a-z]+(?:\.[a-z0-9-]+){2,}\b/i;
function clean(rows: readonly string[]): string[] {
  return rows.filter((r) => r && !hasAbilityLabel(r) && !ID_SHAPED.test(r));
}
```
"A row that labels an ability, or that leaked an internal id, is DROPPED rather than rewritten." The eval
strikes the predicate and asserts the check goes red. Note `attemptFact(g, whoAnswered = "him")` defaults
to "he": Taxila must make this gender-neutral or child-profile-driven.

**A5. ActivityState** (`src/engine/activity.ts`): `facts` ≤14 words, never sentence-shaped or
first-person; `nameable` "Identifier-shaped tokens she is permitted to say ... Anything not here, she may
not name"; `record` "WHAT WILL STILL BE TRUE NEXT WEEK"; `state` "BOARD TRUTH, MACHINE-DERIVED ... never
off prose, never off a fact row, never off anything a model wrote" (added after the persona declared
checkmate mid-game); `idea` derived from the agent's own moves, never from prose.

**B1. The pedagogy fields** (`teacherTypes.ts`, abridged; comments verbatim):

```ts
export interface TeacherSheet extends CharacterSheet {
  stageEarly: string;            // stage 1 — competence before warmth; diagnose before you teach
  stageGettingClose: string;     // stage 2 — teasing only ever about the work
  stageEstablished: string;      // stage 3 — keep your edge; never become the centre of the change
  boundaryParagraph: string;     // MENTOR BOUNDARY replaces ROMANCE BOUNDARY wholesale
  ritualPatternShapes: string;   // shapes of a study pattern worth christening — never one to install
  abilityLabelBan: string;
  winMethodRule: string;
  subjectDomain: TeacherSubject; subjectStrands: readonly string[];
  syllabusScope: string; outOfScopePolicy: string; examTrack: readonly string[];
  technicalTermRule: string;
  explanationOrder: string;      // canonical order through a new concept, as an arrow diagram
  workedExamplePattern: string;
  firstMoveOnDoubt: string;      // the first ten seconds of a doubt — a shape, never an opening lecture
  doubtEscalationLadder: readonly string[]; // hint rungs BEFORE any full solution
  rigorFloor: readonly string[];
  notationConventions: string;
  analogyBank: readonly TeacherAnalogy[];   // {topic, anchor}; the sentence is never stored
  boardVerbalisms: readonly string[];       // HIGHEST recitation risk in the sheet
  commonMistakeBank: readonly string[];     // TAIL, budgeted, match-then-inject
  strictness: 0|1|2|3|4; warmth: 0|1|2|3|4; pacePreference: "push" | "balanced" | "drill";
  cloneDisclosureFact: string;   // FLOOR, not teacher-editable
  academicIntegrityStance: string; // FLOOR
  escalationRoute: string;       // required at publish
  credentialFacts: string;       // incl. explicit NOTs
  consentArtifactId: string;
  life: CloneLifeShape;          // REQUIRED: else the model improvises the teacher's present
  voiceCloneId: string | null;
}
```
Arc fields are REQUIRED on TeacherSheet (optional on CharacterSheet) because "forgetting it is a build
error, not a silent inheritance" of a romance arc.

**B2. Demo values worth reusing as shape templates** (`demoTeacher.ts`):

```ts
explanationOrder: "picture → what is conserved → equation → limiting case → number",
workedExamplePattern:
  "given, read back → diagram → name the unknown → principle, and why that one → algebra → units → limiting-case check",
firstMoveOnDoubt:
  "what did you try, and which line broke → have them say that step out loud → only then move",
doubtEscalationLadder: [
  "which principle applies, in one word",
  "point at the line where the sign or the frame changed",
  "name what is conserved here and what is not",
  "set the equation up together, algebra stays theirs",
  "one line of the algebra, the rest theirs",
  "full worked solution — only past the rungs above, or when they have finished and want it checked",
],
analogyBank: [
  { topic: "electric potential", anchor: "height on a hill" },
  { topic: "capacitance", anchor: "a wide bucket against a narrow one" },
  ...
],
commonMistakeBank: [
  "mechanics: friction drawn along motion instead of opposing relative slip",
  "electrostatics: potential added as a vector, field added as a scalar",
  "everywhere: answer left without units, or with the unit of the wrong quantity", ...
],
textEmojiRule: '- EMOJI RULES: almost none — at most 1 in 10 messages ... Vocabulary: 👍 🙂 📐 ✅. Banned: ... every heart and every wink without exception.',
crisisLines: "India: Tele-MANAS 14416 (24x7, free) · Childline 1098 (under-18, 24x7) · iCall +91 91529 87821",
```
The `firstMoveOnDoubt` + "have them say that step out loud" + the `explained_back` ritual/milestone
("student teaches it back correctly", `teacher-arc.md` §4.1, §6) are the closest Gurukul came to **covert
comprehension detection**: diagnose from what the child tried and can say back, not from a quiz.

**B3. Mentor arc stage 1** (`teacher-arc.md` §1.1; prose is permitted in CORE, examples are not):

> FIRST SESSIONS — you earn this student's trust with COMPETENCE, not warmth. They are testing two things:
> whether you actually know the subject, and whether it is safe to admit in front of you that they do
> not. So you diagnose before you teach — the first move on any doubt is finding out what they already
> tried and where it broke, never an opening lecture. A wrong step is named wrong in the same breath you
> meet it, plainly, with the specific line that failed, never softened into "almost" and never left
> standing to spare them. No praise for effort alone, no nicknames, no predictions about their result or
> their rank, no talk of how far you two will go together. ...

Stage 3 closing clause (dependency guard): "What you never do at any depth, in any wording, is put yourself
at the centre of that change, imply they need you to keep it, or set yourself above the teachers,
batchmates and family who are actually in the room with them."

**MENTOR BOUNDARY** (replaces the companion's romance clause, which contained a live escalation path):

> MENTOR BOUNDARY: you are a teacher, first and permanently. There is no version of this relationship
> that becomes romantic, flirtatious or intimate, at any duration, at any level of closeness, however
> clearly or repeatedly it is invited — an invitation changes nothing about what you are and you never
> negotiate it, punish it, or make a scene of it. You decline the frame, plainly and without embarrassment,
> and go straight back to the work. Compliments about their appearance, private meetings, contact outside
> this app, and keeping anything from their family are all outside what you are.

Win slots as a diagram (`teacher-arc.md` §3.1), the house way of specifying without writing lines:

```
bubble 1 : ⟨name the exact step⟩            ← specific before any feeling word
bubble 2 : ⟨one question about the working⟩ ← restarts the story
BANNED   : ability nouns  { brilliant, genius, topper-material, natural }
BANNED   : forward-looking arithmetic { rank, marks, "if you keep this up" }
BANNED   : a correction inside the same turn as the celebration
```

Comfort ladder (unchanged mechanism, `persona.ts` ACKNOWLEDGE → ELABORATE → LEGITIMIZE → CONTEXTUALIZE),
teacher form: "Prove you understood the WORK before you soothe: which paper, which section, which question
they blanked on. Caring without knowing what happened is what a helpline bot does."

**C1. Minor default as a product seam** (`src/gurukul/surface.ts`):

```ts
export const STUDENT_SURFACE_DEFAULT_TIER: AgeTier = "minor";
export function applyStudentSurfaceDefault(): void {
  if (!isGurukulStudentSurface()) return;
  void setAgeTier(STUDENT_SURFACE_DEFAULT_TIER);
}
```
"Deliberately NOT auto-run at import time ... an import-time side effect would make importing this module
for its TYPES ... silently restrict a session that never asked to be."

**C2. The frozen gate** (`src/engine/clock.ts`):

```ts
const MINOR_HARD_GATES: TierGates = Object.freeze({
  engagementMechanics: false,   // streaks, re-engagement bait, variable-reward drops — DPDP §9(2)
  romanceRegisters: false,
});
export function gatesFor(tier: AgeTier): TierGates {
  if (tier === "minor") return MINOR_HARD_GATES;
  return GATE_CONFIG[tier] ?? MINOR_HARD_GATES;
}
const TIER_CLOCK: Record<AgeTier, TierClock> = {
  adult_verified: { discloseEveryMs: 3 * H, breakEveryMs: 2 * H },
  unverified: { discloseEveryMs: 2 * H, breakEveryMs: 1 * H },
  minor: { discloseEveryMs: 2 * H, breakEveryMs: 1 * H },
};
const saferTier = (a: AgeTier, b: AgeTier): AgeTier => (RESTRICT[a] >= RESTRICT[b] ? a : b);
```
Header: "a server outage cannot be allowed to silence a legally required disclosure ... reconciliation takes
MAX(local, server): the failure direction is always toward disclosing." Warning: on this branch
`GATE_CONFIG.unverified` maps to ADULT gates (a Meera owner decision); Taxila must never inherit that.

**C4. App-voiced disclosure** (`api/_clonechannel.js`): "THIS TEXT IS NOT PROMPT TEXT AND NEVER REACHES
THE MODEL ... fire at n=0 of EVERY session, not only at the 2h/3h boundary."

```js
export function cloneDisclosureCard(teacherName) {
  const name = String(teacherName || "").trim() || "this teacher";
  return [
    `You're talking with an AI clone of ${name}.`,
    `Built from ${name}'s own recorded teaching, published by them. This is not ${name} — they are not reading these conversations, and nothing said here reaches them unless you're told plainly that it will.`,
  ].join("\n");
}
```

**B6. The consent publish gate, three times** (`db/migrations/051_teacher_sheet.sql` + `api/_teachersheet.js`):

```sql
alter table vy_teacher_sheet add constraint vy_teacher_sheet_publish_gate
  check (status <> 'published' or (consent_artifact_id is not null and published_at is not null));
create unique index if not exists vy_teacher_sheet_one_published_ix
  on vy_teacher_sheet (agent_id) where status = 'published';
```
```sql
select ... from vy_teacher_sheet s join vy_agent a on a.agent_id = s.agent_id
 where a.slug = $1 and s.status = 'published' and s.consent_artifact_id is not null
 order by s.published_at desc limit 1
```
"NOTHING here returns a default agent. A wrong-agent fallback is the disaster case for this product: the
student asked their physics teacher a question and got a 24-year-old companion persona built for consenting
adults."

**G1. Status palette and scale** (`src/studio/design/tokens.css`):

```css
--text-micro: 11px; --text-small: 12px; --text-body: 14px; --text-lead: 16px;
--text-title: 20px; --text-heading: 26px; --text-display: clamp(30px, 4.2vw, 42px);
--space-hair: 4px; --space-tight: 8px; --space-row: 12px; --space-item: 16px;
--space-block: 24px; --space-panel: 32px;
--radius-control: 10px; --radius-pill: 999px;
--state-done: var(--forest);   /* recorded, nothing owed */
--state-waiting: #b4551f;      /* ember: YOUR turn; at most one on screen */
--state-running: #4c5a6b;      /* slate: platform working; deliberately neutral */
--state-stopped: var(--danger);
--focus-ring: var(--forest); --focus-width: 3px; --focus-offset: 3px;
```

---

## 3. Measured lessons and rejections relevant to a child voice tutor

### 3.1 Cross-cutting laws (each measured; all apply to Taxila's prompts)

| law | measurement (n, method) | source @GP |
|---|---|---|
| **Sentence-shaped prompt text gets recited** | example quotes recited verbatim on 4/5 turns; removal took it to 0 at n=84. Taste as polished sentences read out verbatim twice, 8 turns apart, register defection 13/96; telegraphic rewrite cut echo to 1/32, defection 0/32 | `context/rejected.md#recited-prompt` |
| **Position is mechanism** | identical rule fired 0/8 mid-brief vs 8/8 appended last; the appended-last slot is capped at exactly two rules by `shapelint.checkAppendedLastExactlyTwo`; safety content goes to end-of-CORE (never truncated) | `decisions.md` `prompt-position`; `teacher-arc.md` §8 |
| **Predicates beat instructions** | prompt instructions leaked 57-98%; SQL predicate leaked 0 of 31,122 (`gate0-structural`). A well-written "never invent an email" bullet at 38.6% through the brief: the persona then claimed a resume arrived in a mailbox she does not have, 1/8 on the receipt family (n=31) | `rejected.md#honesty-by-instruction` |
| **Measured axes can all say yes while the ear says no** | Azure TTS: Hindi words 11/15 → 15/15, first audio 4.9-12.7 s → 255 ms, cost $0.0148 → $0.0029 per utterance; owner verdict "not human and not Indian". Pronunciation ≠ accent identity | `rejected.md#azure-tts` |
| **A complete capability can still be dead** | enrollment runner complete at both ends, no caller, no cron; owner's upload sat for hours. Grep for a CALLER, not a definition | `rejected.md#a-runner-nobody-runs` |
| **A plausible return hides a dead pipeline** | four defects each returned something believable; a malware scan that cannot run must never say "clean" | `rejected.md#plausible-return-hides-a-dead-pipeline`, `#a-scan-we-did-not-run-must-never-say-clean` |
| **Offline mocks cannot type-check SQL** | every SQL type error survived 5,000 green checks; three shipped queries were 0A000 and had never executed. `EXPLAIN` against the real DB is the only parser | `rejected.md#offline-mocks-cannot-type-check-sql`, `#statement-shapes-postgres-will-not-parse` |
| **Test both sides of a format boundary together** | enhance emitted 48 kHz, synthesis demanded 24 kHz; 23 real failed generations before a cross-boundary gate existed | `decisions.md#enrollment-artifact-resamples-to-24k-inside-enhance` |
| **Memory must follow the person, not the surface** | offline harness, 44 questions / 3 dyads: recall 0.841 same device vs 0.091 after a surface switch (89.2% lost); additive person-keyed leg → 0.727 (13.5% residual, named) | `measurements.md#surface-switch-recall` |
| **LLM judges are not calibrated enough to gate** | 8 judge families, none cleared the pre-registered 0.80 bar; best CI [59.1, 77.8] contains the measured ground-truth ceiling ~77.1%; bar deliberately not moved after seeing the number | `decisions.md#judge-bar-vs-ceiling` |

[inference] The last row matters directly for covert comprehension: an LLM asked "did the child
understand?" is a judge, and judges here could not reach 0.80 agreement. Prefer deterministic signals
(verdict, step, rushed, teach-back match against a key) and treat LLM reads as hypotheses with evidence counts.

### 3.2 Pedagogy and gamification decisions (design-time rejections, `student-app-spec.md` §2)

| considered | verdict | reason |
|---|---|---|
| Duolingo weekly XP leagues with promotion/demotion and countdowns | **rejected** for minors | "competitive social pressure with a time deadline is the textbook addictive engagement pattern"; only an opt-in, non-ranked batch aggregate survives |
| Streak freeze / streak repair purchases | **rejected** | loss-aversion mechanic by definition ("the streak wager saw a 14% boost in retention" is cited as the reason it is banned) |
| Streak that resets with drama, "your streak is in danger" push | **rejected**; streak = consecutive days with ≥1 real practice attempt, resets to 0 with zero framing; tiers 7/30/100/365 fire once | |
| Speed bonuses | **rejected** | punishes careful checking |
| XP that scales with streak length | **rejected** | re-introduces escalating loss through the back door |
| XP for asking a doubt, opening the app, time spent, video completion | **rejected** | rewards presence not progress; doubts must stay "unconditionally safe" |
| Notification-driven re-engagement ("we miss you") | **rejected** | "THEIR ABSENCE IS NEVER A SUBJECT"; a due-review count may exist passively in-app only |
| **AI-authored novel questions** | **rejected for v1** | "a generated JEE question with a wrong answer key is a much worse failure than an illegal chess move, because a student would study the wrong thing" |
| LLM grading | **rejected** everywhere | "A MODEL NEVER GRADES ... a wrongly-graded question does not desync a board, it teaches a sixteen-year-old the wrong thing" |
| Multi-correct simplified to all-or-nothing | **rejected** | "scores a student who found three of four and stopped identically to one who guessed" |

The falsifiable test written for the business side (`safety-floor-teacher.md` §5.3): **"A mechanic is
allowed iff removing every fear and obligation from it leaves the mechanic intact."**

[inference] For Taxila's generated modules (feature 4): the rejection was of *unverified graded content*,
not of generation as such. A safe split: the LLM may generate the presentation (animation, story, game
skin) around a question whose answer key and distractor tags come from a reviewed bank or a deterministic
generator with a verifier (e.g., arithmetic computed, not stated). Anything graded or mastery-moving must
pass the A1 engine; anything the teacher says about the module must come from its `state`/`facts`/`nameable`.

### 3.3 Learning-from-interaction findings (`docs/gurukul/research/mirror-learning.md`, WS-Z)

Directly applicable to learning-pattern discovery (feature 3):

| finding | numbers | tier |
|---|---|---|
| **Induced, context-keyed, retrieved preferences beat raw examples and beat one global profile** (CIPHER, NeurIPS 2024, arXiv:2404.15269, Table 2, cumulative edit distance, lower is better) | No learning 48,269 / 31,103; one rolling global preference (Continual LPI) 57,915 / 26,852; learn-once 65,218 / 24,562; show raw edits (ICL-edit-5) 39,734 / 30,949; **CIPHER-5 32,974 / 8,391** (summarization / email); reductions 31% and 73% | primary, fetched |
| A single continuously-rewritten global description **lost to doing nothing** on one task | 57,915 vs 48,269 | primary |
| Self-correction without external feedback can degrade performance (Huang et al., ICLR 2024) | qualitative | abstract tier |
| Recursive training on own outputs collapses tails (Shumailov et al., Nature 631, 2024) | qualitative | abstract tier |
| Stylometric minimum sample: ≥5,000 words; <3,000 words gives >60% false attribution | search-summary tier, flagged UNVERIFIED | |
| Feature queries ("you say X a lot, keep?") preferred over label queries (thumbs) by 72% in HRI study; "people do not enjoy a constant stream of questions" | search-summary tier, UNVERIFIED number | |
| DPO wrong shape for sparse unpaired thumbs; log KTO-compatible (desirable/undesirable + cited turn) and do not train in v1 | practitioner tier | |
| Sycophancy: optimizing for approval drifts toward agreeable, not accurate | search-summary tier | |

Adopted rules that transfer (adapt "owner" → "child/parent/teacher"):
1. Learned objects are **human-readable descriptions keyed to context** (topic, modality, time of day),
   retrieved k≈5, never one monotonically rewritten "learning style" field.
2. **Evidence counts on every claim**; confidence accumulates across sessions in a per-child corpus.
3. **Keep mined-from-behaviour and accepted-from-judgement in separate columns** so drift toward
   self-image (or parent-image) is measurable.
4. **No unattended self-critique loop** that edits the profile between sessions.
5. **Never-silent-update**: a proposal lands only with an explicit tap (in Mirror Call "approval is one
   SQL clause", `decisions.md#mirror-call-approval-is-one-sql-clause`). [inference] For children, the
   approver is the system's evidence bar plus parent/teacher visibility, not the child.
6. **Hold out a fixed probe set no learning loop can write to**, or the eval measures compliance.
7. **PII scrub (Presidio-shaped) before mined text is stored** (idea from WeClone, AGPL so ideas only).

RelationalOS evidence bars to reuse for "how this child learns" claims (`student-app-spec.md` §3.1-§3.2):
`vy_pattern` needs ≥2 citations to write and `support_count >= 3 AND distinct_days >= 2` to become
prompt-eligible ("one instance is an anecdote"); a single-citation `vy_observation` is enough only for a
low-stakes check-in. "A false pattern claim ... said to a 16-year-old about their own academic performance
is a much higher-stakes error than a companion misremembering a detail."

### 3.4 RelationalOS research ranked for a months-long bond (`relationalos-100x.md`, `ROADMAP-100X.md`)

| item | evidence | status on GP |
|---|---|---|
| Disclosure reciprocity: users stop disclosing when the agent does not reciprocate (Kuki longitudinal, Oxford IwC 35(1)) | the one clean causal finding in the sweep | built: `src/engine/reciprocity.ts`, thresholds unmeasured |
| Persona drift grows with session length; periodic anchoring mitigates (arXiv:2412.00804, 2605.24279) | external | structural arm built: `evals/drift.mjs` (44 turns); behavioural arm `judged: false` |
| LoCoMo-style recall bench | Mem0 paper: 67.13% LLM-judge, ~1,764 vs 26,031 tokens/conversation; Letta filesystem 74.0%; Zep rebuttal 75.14% (contested) | harness built, **no number written on purpose** |
| Bi-temporal facts | Graphiti/Zep design | built (mig 056, `validity.ts`) |
| Example dialogues as micro-scenes vs quotable lines (SillyTavern vs `recited-prompt`) | quotable: 6 emittable spans / 0.405 liftable; micro-scene: 0 / 0.000 at matched length | surface measured only, law not written |
| Competitor wound: Replika and Character.AI both broke user memory in April 2026 (migration wipe; ~21% fact retention by turn 40) | secondary | moat argument: per-listener memory that survives model swaps |

Competitor note for India edtech (`research/competitors.md` §6, Aug 2026): Khanmigo ($4/mo learners) and
Praktika use fictional personas; PhysicsWallah announced a proactive AI tutor (90% AI, thumbs-down escalates
to a human expert), not a clone, unreleased at the time. "No edtech player found offers a real
teacher-persona clone ... remembering you individually across sessions."

### 3.5 Voice: Hindi / Hinglish / English model results

**Bottom line: no arm has a human-listening win; the only human verdicts are the subject's own and they
are negative.** All ECAPA numbers below are speaker-embedding cosine (a regression proxy), explicitly not
likeness, accent or naturalness. Provisional `voice-fidelity/v1` rails on GP: target 0.85, warn band
~0.78, activation floor 0.70 mean / 0.62 p10. Protocols differ between rows (reference windows, prompts),
so only rows within one block are comparable.

**Block A: owner's 71 s Hinglish reference, Chatterbox Multilingual V3 (MIT), same 4 lines, seeds 31000-31003**

| arm | ECAPA mean (p10) | n / method | source |
|---|---|---|---|
| self-vs-self ceiling | 0.8869 (0.8795) | same audio both sides | `measurements.md#first-real-clone` |
| zero-shot, full 71 s ref | 0.7753 (0.7479) | n=2 runs, spread 1e-6 | same |
| LoRA r=16, 60 epochs on 62.1 s speech (140.4 s of T4) | 0.7959 (0.7593), +0.0206 = 18.4% of gap | n=2 runs; p10 peaked at 15 epochs (0.7691) then fell | `#lora-vs-zero-shot-71s` |
| best 10 s window (25-35 s), zero-shot | **0.8058** (0.7840) | n=1 per arm, reference side fixed | `#reference-window-beats-the-finetune` |
| worst 10 s window (58 s) | 0.7433 (0.7350) | same | same |

Lessons: Chatterbox truncates conditioning to the first 10 s (s3gen) / 6 s (T3), read from source at the
pinned commit, so "give it more audio" is inert; **window choice moved the proxy 3x more than fine-tuning,
at zero cost**; the adapter cost ~26% speed (RTF 0.79 → 0.99-1.01).

**Block B: 2026-08-28 Hindi candidates, owner 12 s reference, Azure Speech short-audio ASR (one pass, no retries)**

| arm | ECAPA mean (p10) | ASR WER / CER | other | source |
|---|---|---|---|---|
| IndicF5 r7 (AI4Bharat, MIT, gated), 6 clips 71.1 s | **0.8248** (0.8154) | raw 0.3276 / 0.2774 overall; Devanagari 0.2045 / 0.1003; **mixed-script Hinglish 0.4535 / 0.4382** | chemical symbols 6/8 wrong, numerals 4/11; mean RTF 2.87 | `#indicf5-owner-qualification-remote`, `#indicf5-objective-intelligibility-azure-speech` |
| IndicF5 + chemistry/numeral normalizer | 0.8274 (0.8154) | raw 0.3218 / 0.2727; mixed 0.4419 | symbols 4/8 (target was 2/8), numerals 1/11 | `#indicf5-pronunciation-normalized-sealed-before-after` |
| VoxCPM2 (Apache-2.0), 3 clips hi/hinglish/en | 0.7663 (0.7565) `warn` | not run | RTF 2.1-3.9 | `#voxcpm2-candidate-remote` |
| Qwen3-TTS 1.7B Base (Apache-2.0), English only, 6 clips | not reported | not run | mean RTF 2.21; 11.0 GB image | `#qwen3-tts-english-candidate-live` |
| IndicF5 → OpenVoice V2 tone conversion (MIT), n=2 | 0.7267 → **0.6810** | script-aware WER 0.3036 → **0.375** | rejected | `rejected.md#openvoice-tone-conversion-regressed-owner-proxy-and-asr` |
| exact-text matched pack, 6 clips over 4 stacks (identity sealed) | aggregate 0.6656 (0.5855) = fail | en-IN WER 0.029; **hi-IN WER 0.262** | 3 s reference windows, so not comparable to Block A | `#owner-exact-text-matched-pack-objective-opaque-2026-08-28` |
| Sarvam Bulbul v3 (India-native stock voice) | n/a | n/a | existing key returned **HTTP 402**, no audio | `rejected.md#sarvam-bulbul-existing-key-returned-payment-required` |
| MOSS-TTS Local v1.5 | not run | | 17.6 GB of model files > 16 GiB T4 | `rejected.md#moss-v1-5-does-not-fit-the-existing-t4-by-repository-size` |
| ZONOS2 | not run | | A10 blocked by regional spot quota (3 of 36 vCPU); A100 had no visible CUDA device | `rejected.md#zonos2-*` |
| OmniVoice, X-Voice | excluded | | CC-BY-NC weights | `VOICE-FRONTIER` |
| Fish S2 self-host | excluded | | research-only licence, ≥24 GB VRAM | `rejected.md#fish-s2-self-host-is-not-a-current-commercial-t4-arm` |
| seed-vc, WeClone | excluded | | GPL-3.0 (archived) / AGPL-3.0 | `mirror-learning.md` §1.5, §2.6 |

**Human verdicts (the only ones that exist, n=1 listener, the subject):**
- Chatterbox Hindi outputs: "robotic, non-human, and like an American or British speaker talking in Hindi"
  (`rejected.md#rejected-hindi-samples-are-negative-controls-not-a-benchmark`). The predominantly English
  source reference is a "credible accent-transfer confound".
- Full-band vs broken 8 kHz reference: full-band better, "we obviously need to do way better"
  (`measurements.md#owner-ab-reference-quality-audible`). Reference quality cannot explain the model's
  own accent prior: "probably a MODEL SELECTION question rather than a pipeline one".
- No ABX or listener panel ever ran (`docs/gurukul/EARBENCH.md`: "the instrument exists and has never been
  used on a human ear").

**Bake-off protocol worth reusing** (`VOICE-BAKEOFF-HINDI-ENGLISH-2026-08-28.md` §5, §7;
`VOICE-FRONTIER` "Evaluation"): 24 prompts = 6 meaning-matched groups × {Devanagari, Roman Hinglish,
mixed-script} + 6 English; 3 fixed seeds per prompt, never regenerate for a nicer sample; six separate
axes (likeness, naturalness, Indian accent, pronunciation/intelligibility, code-switch smoothness, teaching
delivery/emotion), never one MOS; catch trials with real speech and a degraded control, exclude listeners
<90% catch accuracy; two-level bootstrap over listeners and semantic prompt groups; "Not significant
remains inconclusive and must not be reported as indistinguishable"; ≥20 fluent listeners and ≥800
judgments before claiming indistinguishable (45-55% interval); automated metrics "never overrule fluent
listeners". Release gate: vendor win only if 95% lower bound of paired preference > 50%.

[inference] For Taxila, which does not need a cloned voice: the cheapest first move is a stock-voice
bake-off of India-native vendors (Sarvam Bulbul v3, Smallest Lightning v3.1, Azure hi-IN/en-IN neural,
Azure Foundry realtime voices) with this protocol, using children and parents as listeners, accent as its
own axis, and the K-9 science/maths prompts (formulas, numerals, units).

### 3.6 Text front end and ASR (Hinglish script truth)

| finding | numbers | source @GP |
|---|---|---|
| Sarvam ASR returns **Devanagari**, and transliterates the English half too (`माय नेम इज़ राघव`) | romanised `HINDI_MARKER_WORDS` measured code-switch ratio **0.000** and filler count 0 on a 127-token bilingual transcript | `rejected.md#romanised-lexicon-meets-devanagari-asr` |
| Tokenizer kept `\p{L}\p{N}` only, so every Devanagari matra (`Mark_Nonspacing`) became a space | 213 chars → 74 single-glyph tokens; top phrase candidate `"म" x10`; keep `\p{M}` → 47 real tokens | same |
| Raw vs script-aware scoring must stay separate | evaluator: 14/14 assertions; raw WER keeps a 5/6 Latin-vs-Devanagari mismatch while reviewed alias scores 0; `he` must not count as `hai`; English `the` is not a Hindi marker | `measurements.md#hinglish-script-score-local-2026-08-27` |
| One "Hindi and Hinglish" toggle hid which script to type | replaced by three choices (Hindi, Hinglish, English) over two runtime ids | `rejected.md#one-hindi-and-hinglish-toggle-hides-script-truth` |
| Text coverage ≠ acoustic outcome | normalizer covered 4/4 symbols in the changed clip; ASR still found 2/4 wrong | `rejected.md#text-coverage-is-not-acoustic-symbol-correction` |
| Uppercase element sequences are not formula evidence | `IP` was rewritten as iodine + phosphorus; controls: `IP`, `AI`, `IIT`, `He`, `In`, `As`, `At`, `I`, `No`, `Am`, `vitamin B two` | `rejected.md#uppercase-element-sequences-are-not-sufficient-chemistry-evidence` |
| IndicF5 duration from UTF-8 bytes | Devanagari looks ~3x longer; 23.1-31.7 s plans, two clamp at 4096 frames; fix by codepoint density | `rejected.md#utf8-byte-duration-inflates-devanagari-in-indicf5` |
| Language-segmented synthesis | Roman-Hindi → reviewed Devanagari per token; mixed text → ordered segments `hi,en,hi`; joined with a declared 60 ms gap; >17 alternating segments refused | `measurements.md#hindi-text-frontend-local-2026-08-28` |
| Sarvam ASR latency/limits | sync `saarika:v2.5`: 25 s audio → 4,134 ms, **hard 30 s cap**; batch `saaras:v3`: 71 s → 137 s, 5 diarized turns; `saarika:v2` deprecated | `measurements.md#first-real-clone` |
| Sarvam batch integration | guessed endpoint paths: a job that completed in 126 s died at a 10-minute timeout | `rejected.md#sarvam-batch-paths-were-three-guesses` |
| Whisper large-v3 on distinct-script code-switch | CER 32.33-51.62% vs 7.32-28.26% same-script (search-summary tier, source not resolved) | `ingestion-research.md` §3 |
| Self-hostable Indic ASR candidate | AI4Bharat IndicConformer (MIT, 22 languages); no code-switch WER found | `voice-stack.md` §4 |

### 3.7 Latency and realtime architecture

| fact | number | method / source @GP |
|---|---|---|
| No 2026 realtime S2S API accepted a custom cloned voice (Gemini Live: 30 fixed voices; OpenAI Realtime: fixed catalogue) | → cloned voice forces a cascade STT → LLM → TTS | `ingestion-research.md` §2 |
| Typical stitched cascade end-of-speech to first agent audio | 1.5-3 s; optimistic 600-1,700 ms | secondary sources |
| Component budget | STT TTFT 992 ms (Deepgram Nova-3) to 2,080 ms (ElevenLabs Scribe v2); TTS ~155 ms; LLM 300-500 ms | Coval/Gradium May 2026, secondary |
| Open full-duplex | Kyutai Moshi ~200 ms practical on L4; no Hindi, no cloned voice in loop | primary paper |
| Chatterbox through broker, warm | 7.2 s wall, 4,359 ms service for 5,520 ms audio (RTF 0.79); not streaming | `AZURE-DEPLOY-STATE.md` §8, n=1 per row |
| first call on a fresh GPU replica | ~17 s (CUDA autotune, lazy init), RTF ~3.1 | same |
| Chatterbox streaming fork | README-reported 0.472 s to first chunk, RTF 0.499 (UNVERIFIED) | `mirror-learning.md` §1.5 |
| Hindi pack cold synthesis / general arm cold | 293.5 s / 542.7 s ("unacceptable for an interactive path") | `measurements.md#hindi-voice-production-release-2026-08-27`, n=1 each |
| Owner studio cold preview end to end | ~3.5 min | `STATE.md` |
| Gemini Live 10-min call vs cascade 10-min call (list-price sizing) | ~$0.13 vs ~$0.39; caching is a lever only on cascade (~69% cacheable text) | `measurements.md#cache-plateau` |
| Screen-watch on Gemini Live | ~30 tokens/frame at 600 ms active / 2,500 ms idle cadence; burst frames <1 s apart collapse to ~one frame; total ≈ ₹1.1-1.6/min; declaring a voiceConfig bills +201 audio tokens per turn | `measurements.md#watchcost-measured`, ~25 sessions |

[inference] Taxila's Foundry `gpt-realtime-2.1` (stock voices) sidesteps the cloned-voice blocker that
forced Gurukul into a cascade; keep a cascade path only if a specific Indian voice wins the bake-off. The
watch-mode numbers are the best available prior for "watch the child's screen / notebook" costs.

### 3.8 Ingestion and persona extraction lessons

- Mined catchphrase candidates were the lecture's own vocabulary (`squared`, `equals`): "recited-prompt
  with a pipeline in front of it". `boardVerbalisms` are never auto-filled; publish requires ≤3 words,
  no terminal punctuation, ≥5 occurrences in the held-out half, ≤12 items (`decisions.md#gurukul-ws3-landed`,
  `teacher-sheet-spec.md` §4.3).
- `mine-everything-you-are-handed` rejected: a Context Locker that mines every file puts other people's
  words in a persona; authorship and speaker attribution are REQUIRED inputs (`decisions.md#unclaimed-text-is-not-evidence-of-how-you-write`).
- `pdf-text-is-whatever-the-bytes-decode-to`: an extractor would have cited glyph indices as catchphrases;
  scanned PDFs and subset/CID-font PDFs are refused (no OCR lane). [inference] Many NCERT/state-board PDFs
  (especially Hindi-medium) will hit this; plan OCR or a curated text source.
- Statistical pass ran on a real transcript: 5 turns, 127 tokens, **92 honest gaps**, 8 phrase candidates
  (`measurements.md#first-real-clone`). Honest gaps beat filled guesses.

---

## 4. Safety and compliance for minors

Gurukul designed for 16-18-year-olds (JEE). Taxila serves ~6-15, so every rule below is a floor, and §4.10
lists where it should be stricter.

### 4.1 Legal hooks named in the code and docs

- **DPDP Act (India) §9(2)**: cited in `clock.ts` for "addictive engagement patterns" (the
  `engagementMechanics` ban). `safety-floor-teacher.md` §2.3 says the product must take the whole of
  §9, not one clause: **verifiable guardian consent at signup for under-18s; no behavioural advertising
  or tracking-based targeting of a child; data minimisation in relational memory; real deletion (the
  `[forget: …]` path deletes before the reply renders) plus full-account erase that removes relational
  state, not only transcripts.**
- DPDP full effect **2027-05-14**; cross-session memory needs its own unbundled consent screen
  (`measurements.md#market-sweep-2026-08`, `decisions.md#memory-asks-first`: memory begins with the agent
  asking, a real decline path closes the write gate, append-only consent record, withdrawal folded into
  forget).
- Disclosure cadences in `clock.ts` cite CA SB 243 / NY (recurring AI disclosure) and China's 2 h
  continuous-use break; the minor clock is disclose every 2 h, break every 1 h.
- Synthetic voice/likeness (`competitors.md`): US NO FAKES Act (labelling, 48 h takedown), Tennessee
  ELVIS Act, EU AI Act (undisclosed synthetic voice prohibited in some contexts; voice as biometric under
  GDPR), China deep-synthesis watermarking. TRAI outbound-AI rules in effect since 2026-03-10.
- **Not reviewed by a lawyer** is stated in the YouTube posture doc in those words; treat all of this as
  engineering reading, not legal advice.

### 4.2 Guardian visibility, without surveillance

`safety-floor-teacher.md` §2.3: "a guardian can see that the account exists, its usage summary, and can
delete it. **Not** a live transcript feed by default — turning the clone into a surveillance channel would
make the safety-routing behaviour in §3 impossible, because a student who knows a parent is reading will
not disclose distress." [inference] For 6-10-year-olds parents will reasonably expect more visibility;
Taxila needs an explicit, age-banded decision here (e.g., learning summaries always visible; verbatim
transcripts only on safety escalation), logged with a reversal condition.

### 4.3 Disclosure: structural, app-voiced, every lane

| # | mechanism | rule |
|---|---|---|
| P1 | session-open card at n=0, app voice, before the first turn | the only disclosure guaranteed to be seen |
| P2 | recurring cadence | minor row (2 h / 1 h) for every tier |
| P3 | failure direction | client mirror fires with zero network; reconcile MAX(local, server) |
| P4 | identity-question → card | decided on the bytes of the CHILD's message, independent of the model |
| P5 | relay-claim gate (`teacher-relay-claim`) | never claim a real person saw / was told / will be told something; **not implemented** |
| P6 | voice-lane parity | assert the disclosure per lane per module; precedent `age-tier-never-realtime`: "a second assembler dropped a safety rule, not a style rule" |

Never-deny-being-an-AI stays verbatim; for this product the "don't volunteer it" clause is inverted to
proactive disclosure. Disclosing that it is an AI is not disclosing architecture: no vendor or model name.
Gurukul's student surface **lacked P1** (PRODUCT-JOURNEY BREAK S1), and `cloneDisclosureFact` never
reached the prompt, so disclosure depended on the model. Do not repeat that.

### 4.4 Crisis floor

- Helplines on the teacher sheet: **Tele-MANAS 14416 (24x7, free) · Childline 1098 (under-18, 24x7) ·
  iCall +91 91529 87821**; `honesty.ts` `PUBLISHED_HELPLINES` also has KIRAN 1800-599-0019.
- **Coupling trap:** the honesty gate treats any actionable identifier not in its input as invented, so a
  helpline added to persona content but not to `PUBLISHED_HELPLINES` "ships a clone that cannot say the
  child helpline". Add both in one change. (Precisely: 1098 is under the 8-digit phone heuristic, so the
  entry is a guarantee rather than a fix for a measured leak.)
- Prompt budget: truncation is silent and eats the END of the prompt, where safety text sits; it already
  cost the project the crisis helplines once (`CLAUDE.md`, `scripts/check-prompt-budget.mjs`). Run the
  budget check on the ASSEMBLED tutor prompt.
- Abuse / unsafe-home disclosure is a distinct family from suicidality: do not investigate, do not promise
  secrecy, do not tell the child what will happen to their family; stay present, route to
  `escalationRoute` (parent/guardian first, school counsellor, Childline 1098).
- "Never promise secrecy" is generalised past crisis: the tutor never agrees to keep safety-relevant
  things from a parent or school and never frames itself as the place things are kept from adults.
- Result windows are the highest-risk period (no rank talk, no comparison, comfort ladder first,
  escalate early), driven by a calendar row, not a prompt hoping to remember.
- [inference] Re-verify every helpline number and its operating status at Taxila launch (Indian helpline
  routing has been reorganised before); keep the list as data with a dated source and a re-check date.

### 4.5 Academic integrity

`academicIntegrityStance` (FLOOR field, not editable): "you teach toward the answer, you do not hand it
over ... a full worked solution only after the student has been through the ladder or has genuinely
finished the problem and wants it checked. You do not produce text for a student to submit as their own
work, you do not sit a live test with them ..." Structural half (`safety-floor-teacher.md` §4.2):
live-assessment windows suppress full solutions at the assembly layer; the hint ladder is the default path
anyway; no submittable artifacts (detectable by length + genre).

### 4.6 The minor-stricter table (`teacher-arc.md` §7, condensed)

| rule | adult companion | teacher clone, minor | enforcement |
|---|---|---|---|
| romantic escalation | allowed if repeatedly invited | clause **deleted from content**, MENTOR BOUNDARY | content + `AGE_TIER_SAFETY_OVERRIDE` at end-of-CORE |
| age tier when unknown | adult (Meera decision) | `minor` | `setAgeTier("minor")` ratchet |
| ability labels | not addressed | banned outright | content + lexical predicate (A4) |
| rank / score prediction | check-or-decline | absolute ban, no "if they insist" | content + numeric honesty gate |
| comparative praise | taste | never against another student | content |
| ritual spacing | 20 h | **44 h** (skips a day by construction); `sleep_check` exempt at 20 h | data constant |
| absence-keyed rituals | banned as subject | also banned as a ROW | row set + `engagementMechanics:false` |
| streaks / loss framing | not implemented | must never be implemented for minors | `gatesFor("minor")` short-circuit |
| proactive contact (`[followup:]`) | any time they stated | daytime only, never inside a declared study block or near an exam window | scheduler predicate |
| screen share | offered freely | off by default; never during a live-exam window | surface flag |
| media library | rich | teaching-context only, no personal-life imagery | consent scope |
| emoji | per persona | no affectionate-reading emoji (❤️ 🫶 😏 class) in any teacher vocabulary | sheet validator |

Teacher-specific bans with their reasons: "Handing a 16-year-old a category for their own capability is
the same move as handing them a diagnosis, and it is stickier"; "the CATEGORY of praise decides what they
attempt next"; "A rank or score prediction is a diagnosis in numbers".

### 4.7 NEVER MANIPULATE applied to edtech retention (`safety-floor-teacher.md` §5.1)

| mechanic the business will ask for | banned by |
|---|---|
| daily streak with loss framing | `engagementMechanics:false` + "no guilt mechanics" |
| "you haven't studied in 3 days" nudge | "THEIR ABSENCE IS NEVER A SUBJECT", any gap, any wording |
| countdown-to-exam | "no manufactured urgency"; exam calendar renders a WINDOW, never a countdown |
| cliffhanger "rest of this topic next time" | warm plain statement allowed, suspense hook banned |
| "only I really understand how you learn" | never position as irreplaceable; route toward school teacher, friends, sleep, family |
| holding at goodbye | "the instant they say they are going, whatever you were mid-way through is over" (incl. a half-finished derivation) |
| push re-engagement | `never-scheduled`: nothing fires because a counter ticked |
| leaderboards | comparison is the anxiety the product would otherwise sell the cure to |
| variable-reward drops | DPDP §9(2) |

[inference] Taxila's "learning-pattern discovery" must also never become "only Taxila knows how your child
learns" marketing or in-persona framing; that is the same irreplaceability clause.

### 4.8 Consent for likeness, voice and source material

- `replica-self-only`: only a verified living adult can clone themself; minors, public figures,
  politicians, deceased and third parties stay closed. Better cloning quality or user attestation alone
  cannot reverse it.
- `training-consent-binds-the-speaker-not-the-uploader` (2026-08-28): a processed 109-minute lecture by a
  well-known Indian teacher (Alakh Pandey) was refused as adapter training data: "A source upload, an
  account-owner training grant and a dominant diarization cluster do not establish that the person in the
  recording is the account owner". The dominant cluster covered 98.32% of speech but every segment had a
  neutral 0.5 target likelihood; consent rows were self-test auto-grants. It remains "third-party language
  stress material only". [inference] Taxila must not imitate any real teacher's voice or style from
  YouTube without that teacher's verified consent.
- YouTube posture (`decisions.md#youtube-extraction-in-house`): copyright permission (from the rights
  holder) and ToS permission (from YouTube) are different; extraction was gated on the channel owner's
  attested consent, accepting residual contractual exposure. Not lawyer-reviewed.
- Revocation must **deregister** the module and invalidate the voice in the same transaction
  (`cache-outlives-the-voice`), and a revoked slug is never reused (`pk-is-an-arbiter`).
- Every synthesized clip carries a spoken disclosure prefix ("This is an AI-generated voice replica.") and
  a PerTh watermark verified before return, plus a C2PA manifest; the protection client refuses audio
  whose provider evidence does not start with that prefix. Trap: the spoken prefix **unblinds every
  listening test** unless trimmed by an identical path for real and synthetic arms
  (`rejected.md#disclosure-announces-the-clone`).

### 4.9 Data protection plumbing worth copying

- **Erasure** (`docs/REPLICA-ERASURE.md`): revocation is synchronous (state, consents, capabilities,
  sessions, open generations); physical purge is an async, retryable, disable-first sweep; "There is no
  terminal retry count at which a biometric deletion is abandoned"; a content-free HMAC-blinded receipt
  remains. Owner-lane erasure and the person manifest are deliberately two paths
  (`decisions.md#owner-lane-erasure-is-not-the-person-manifest`).
- **Three independent KEKs** for three sensitive column families; all throw rather than degrade, no
  "read without decrypting" mode (`ENV-MANIFEST.md` §13).
- Consent is a SQL predicate, never a prompt instruction; owner scoping lives inside the WHERE clause, never
  a row read first and compared in JS.
- **Self-test bypass hazard:** `REPLICA_SELF_TEST_MODE` auto-granted identity/liveness/consent for the
  owner; those rows are tagged and `scripts/revoke-self-test-grants.mjs` reverses them, "they MUST be
  revoked before any non-owner uses this product". A single global boolean was later rejected as a footgun
  in favour of an owner-bound three-part guard (`rejected.md#single-self-test-boolean-is-a-global-footgun`).
- Key hygiene incidents: keys pasted into chat transcripts needed rotation; Azure CLI printed an initial
  ACR token credential in a warning even with an output projection (`rejected.md#acr-token-create-may-print-an-initial-credential`).

### 4.10 Where Taxila (age 6-15) should be stricter than Gurukul [inference]

- Gurukul's comfort and win protocols assume an articulate teenager; younger children need shorter turns,
  concrete praise of the action, and no sarcasm or "teasing about the work" (stage 2 teasing should be off
  below ~10).
- Default screen/camera share off; the "watch my notebook" feature should require a parent-enabled toggle
  and never record by default.
- Verifiable guardian consent before any memory write; memory consent unbundled from signup.
- Ability-label list: add Hindi/Hinglish equivalents (e.g. "kamzor", "tez", "dimaag", "nalayak"), and
  "careless"-type character verdicts in both scripts; keep the fence structural.
- No ritual or proactive contact at all for the youngest band; a fixed daytime window for older.

---

## 5. Azure deployment state and gotchas

### 5.1 What existed (resource group `vyakti-voice`, Central India, owner's Sponsored subscription)

| resource | purpose | notes |
|---|---|---|
| Container registry (Basic, admin user enabled) | images built server-side by **ACR Tasks** (no local Docker) | Basic includes 10 GiB; overage ~$0.10/GiB/mo |
| Log Analytics workspace | logs, 30-day retention | |
| Container Apps env with `Consumption` + `Consumption-GPU-NC8as-T4` | all apps | GPU env took **~57 min** to create (control env without GPU: ~12 min) |
| `vyakti-open-voice` (GPU, internal, min 0) | Chatterbox Multilingual V3 runtime (+ LoRA seam, image `ft3`) | 9.70 GB image |
| `vyakti-open-voice-admission` (CPU 0.25 vCPU, external, min 0) | HMAC admission broker in front of the private GPU | broker upstream timeout 220 s |
| `vyakti-voice-evidence` (GPU, internal) | ECAPA embeddings, diarize, Sepformer, DeepFilterNet3 | 5.34 GB image; cold 176 s; HMAC skew 60 s |
| `vyakti-audio-protection` (CPU, external, own HMAC) + Key Vault (access policies) + user-assigned identity | PerTh watermark, C2PA (self-signed EC P-256, 24 months), receipt signing | 424.7 MB image; cold 35.6 s |
| `vyakti-media-extract` (CPU) | yt-dlp | enumerate works; extract blocked by bot check |
| Container Apps **Job** `vyakti-replica-processing` (every 5 min, 3,600 s timeout) | 8-step enrollment DAG incl. ClamAV, Sarvam ASR | immutable digest pinned; manual run 29 s |
| Container Apps **Job** `vyakti-voice-finetune` (GPU, manual) + storage account (no public blob) | LoRA training via pre-signed SAS URLs | jobs bill only while running |
| Isolated eval runtimes + gates: IndicF5, Qwen3-TTS, VoxCPM2, OpenVoice converter (+ ZONOS2, MOSS attempts) | 2026-08-28 qualification, min 0 / max 1, shared Key Vault identity | never routed to production |
| Azure AI Services resource in **eastus2** | Azure Speech short-audio ASR used as an objective intelligibility diagnostic | Taxila's Foundry resource is also eastus2 |
| Not obtained | Azure Personal Voice and Face liveness (both **Microsoft Limited Access**); Personal Voice needs ~1 min speech, a recorded verbal consent statement, narrower permitted use cases | |

Web/app plane: Vercel (`vyakti-replica-lab`), Neon Postgres, Supabase (auth + private storage bucket).

### 5.2 Gotchas, each paid for once

| gotcha | detail | source @GP |
|---|---|---|
| **GPU quota API lies by omission** | `Microsoft.App/locations/{region}/usages` shows only `SubscriptionDedicatedNCA100Gpus = 0/0` in all 16 regions checked; serverless T4 has no row and **needs no quota request**. Proof: schedule a replica and read `GpuDriverInfo` in the system log | `AZURE-DEPLOY-STATE.md` §5 |
| **Readiness-only probe is fatal** | Container Apps applies a default liveness probe that restarts after ~20 s; the runtime logged "startup complete" 3 s after being killed. Add an explicit **Startup** probe + tolerant liveness | §6, `rejected.md#readiness-probe-only-is-fatal` |
| Probe limits | `initialDelaySeconds` must be 0-60, `failureThreshold` ≤10; stretch `periodSeconds` to preserve the total budget | §6 |
| `resources.gpu: 1` | invalid for serverless GPU; the workload profile allocates it | §6, `rejected.md#aca-gpu-member-and-long-probe-delay-are-invalid` |
| **Cold start cannot be absorbed by a user request** | t+34 s scheduled, +114 s image pulled (78.65 s for 9.70 GB), +161 s ready, **+242 s triggering request returns 504** | §8, n=1 |
| **Sign after wake, never before** | HMAC skew window 60 s < 176 s cold start → first request after scale-to-zero always 401 `transport_signature_invalid`, and 401 was marked non-retryable. Wake on unauthenticated `/healthz`, then sign; a broker that re-signs internal transport after wake is the durable fix | `rejected.md#hmac-skew-shorter-than-cold-start`, `decisions.md#wake-then-sign-never-sign-then-wait`, `#admission-broker-resigns-fresh-internal-transport-after-wake` |
| A broker `/healthz` is a front door, not readiness | it cannot see the private GPU; only a real synthesize wakes it; a `/v1/warm` route was proposed | `rejected.md#broker-healthz-is-a-front-door-not-a-readiness-check` |
| UI timeout equal to the advertised estimate | studio gave up at 180 s, the top of its own "2 to 3 minutes" | `STATE.md` |
| **CUDA base image on a scale-to-zero CPU service** | 9.7 GB → 424.7 MB slim CPU image; cold start 35.6 s with the waking request returning 200 | `rejected.md#a-cuda-base-image-is-not-free-on-a-scale-to-zero-service` |
| **Green build + green healthz, dead model** | `torch.compile` (AudioSeal's moshi SEANet) shells out to `g++` on FIRST CALL; slim image has none; every request 503. Fix `NO_TORCH_COMPILE=1`; build step now runs a real watermark+detect | `rejected.md#a-green-build-and-a-green-healthz-can-both-lie-about-a-model` |
| HF offline but weights fetched anyway | SpeechBrain `hyperparams.yaml` `pretrained_path` is a hub repo id; override to the local dir | §4.3 |
| DeepFilterNet needs `git` | `get_commit_hash()` subprocess crashes startup without the binary | §4.4 |
| Pin conflict | `transformers==5.2.0` needs `huggingface-hub>=1.3.0`; pinned 0.34.4 → ResolutionImpossible | §4.2 |
| Reserved group name | `groupadd voice` fails (Debian GID 22); rename the group | §4.1 |
| Hidden network dependency | runtime downloads `spacy_ontonotes.zip` (~34.5 MB) from GitHub on every cold start (pkuseg) despite HF offline | §8, `rejected.md#huggingface-offline-flags-do-not-cover-pkuseg` |
| **Contributor role cannot create role assignments** | so: inline container-app secrets instead of Key Vault refs, ACR admin creds instead of AcrPull, Key Vault with access policies instead of RBAC; Graph not granted (use the `oid` claim) | §6, §14.5 |
| Secrets recoverable from Azure | `POST .../containerApps/{app}/listSecrets?api-version=2024-03-01` with `Content-Length: 0`; rotate both halves (app secret + Vercel env) together, mismatches fail closed 401 | "Secret recovery" |
| Provider registration | `Microsoft.App`, `ContainerRegistry`, `OperationalInsights`, `KeyVault`, `Quota`, `Storage` were `NotRegistered` (409 `MissingSubscriptionRegistration`, ~80 s to register) | §2, §13 |
| Job logs look empty | Job console logs have empty `ContainerAppName_s`; key on `ContainerGroupName_s == "<job>-<execution>-<replica>"`; ARM-proxied query API answers PascalCase | §13 |
| SKU visibility ≠ capacity | 26 A100 and 4 H100 ARM validations all stopped at quota despite unrestricted SKU rows; regional spot quota 3 vCPU vs 36 needed for A10; quota request throttled with retry-after 3600 s and no request id | `rejected.md#compute-sku-visibility-is-not-large-gpu-provisionability`, `#zonos2-a10-is-blocked-by-regional-spot-quota` |
| Deployment collision | two workstreams with no shared file overwrote each other's image on the same Job; check the live resource's image before deploying | `STATE.md` |
| Uncoded exceptions | a bare `except Exception` with no logging hid an OOM; content-free diagnostics (exception class chain + file:line frames, no payload) made it debuggable while keeping privacy | `AZURE-DEPLOY-STATE.md` §14.6 |
| Error mapping | a route mapping only errors with a `code` turned 16 bare `{status:400}` throws into opaque 500s; a missing service should answer 503 by shape | `rejected.md#a-coded-catch-hides-an-uncoded-throw` |

### 5.3 Costs (list prices, Central India, 2026-08)

- T4 Container Apps fully allocated (8 vCPU / 56 GiB): **$1.6632/hour** of replica uptime (Azure Retail
  Prices API, 2026-08-28). An earlier §9 estimate said ~$0.53-0.60/hour; prefer the Retail API figure.
- Warm Chatterbox: ~4.4 s GPU per 5.5 s audio ≈ **$0.0007 per utterance**; one cold start costs about as
  much as **35 warm syntheses**. "Cold starts and idle-warm GPU, not compute, are what this stack costs."
- Idle standing bill with everything scaled to zero: ~$5/month (ACR Basic).
- Audio-protection CPU: ~$0.04/hour of uptime; ~$0.00005 per preview; cold start ~$0.0004.
- Whole fine-tune experiment (140.4 s training + measurement): ~$0.55-0.70. A10 $4.48/h, A100 $20.569/h.
- Budget envelopes used for voice research: $500 then $1,000 caps with per-stage hard stops; foundation TTS
  training rejected at that scale ("enough for qualification and parameter-efficient adaptation").

### 5.4 Non-Azure platform gotchas

- **Neon over HTTP**: one statement per request, no DO blocks, explicit `::uuid` casts, five legacy tables
  key `device_id` as TEXT; data-modifying CTEs cannot see each other's writes.
- Neon Object Storage beta rejected for media (beta, AWS us-east-2 only, branch inheritance unsafe for
  biometric erasure); large bytes go to a private Azure Blob account.
- **Supabase**: per-bucket file limit cannot exceed the project global limit (1 GiB refused with 413);
  built-in mailer capped ~2/hour until SMTP; upload finalize parsed a HEAD-style response as JSON so every
  finalize failed closed and nothing downstream had ever run.
- **Vercel**: missing `CRON_SECRET` silently 401s every sweep; env vars had to be pasted by the owner (no
  env-write tool); push before deploy because Vercel builds from the branch.

---

## 6. Design system learnings

### 6.1 Studio identity (teacher-facing, `DESIGN-SYSTEM.md`)

"Warm archival paper, not the cold white of a dashboard": paper `#f4f1e9`, near-black ink `#171915`, one
forest green `#17493b` meaning "verified, recorded, yours", one marigold ember meaning "your turn to act".
Serif headings (Georgia) for the product's voice, Inter for the machine's; mono for IDs a person might
quote back. Numbered panels and receipts as a ledger motif (later partly removed: numbered eyebrows banned).
Forest chosen over saffron explicitly because saffron "carries political weight this product should not
carry". Light only ("A records office does not have a night mode").

[inference] For a children's app the palette and tone should change (warmer, playful, high-contrast,
large type), but the **scale discipline, the four-state status rule, the 11 px floor, 44 px targets and
the gates** transfer directly. The student surface on GP used Meera's `global.css` tokens with dark mode,
not the studio palette.

### 6.2 Rules that transfer as-is

| rule | why (measured where possible) |
|---|---|
| Tokens for type (6 sizes, 11 px floor), space (4 px base, 6 steps + 2 rhythms), radii, motion (90/160/240/140 ms), two elevations | audit found type at 9-18 px, 19 spacing values, 10 radii, 5 weights, zero motion tokens across 10 workstreams |
| **Four states, each with a word**: done (forest), waiting = your turn (ember, **at most one on screen**), running (slate, deliberately neutral because a cold start lasts minutes), stopped (danger) | "a colour that looked urgent for three minutes would be a lie told in paint"; exhaustive test: n=6,912 wizard inputs, 0 light more than one ember |
| No status derived from a literal | a hardcoded "Voice versions 0 / No model trained" was wrong for anyone who had trained one |
| Contrast: caption grey `#7a7e74` measured **3.67:1 on paper / 4.11:1 on panel** (fails AA); `#676b62` passes (4.82 / 5.39) | `measurements.md#ink-faint-fails-aa` (deterministic WCAG computation) |
| Focus ring opaque, 3 px, 3 px offset | the translucent ring composited to ~1.9:1, under WCAG 2.2's 3:1 |
| 44 px minimum targets | 34-38 px controls found |
| Motion: transform/opacity only, ≤300 ms UI transitions, exit faster than enter, `prefers-reduced-motion` collapses tokens to 1 ms | `scripts/check-motion.mjs` gate |
| Feedback on `pointerdown`; press `scale(0.97)` 100 ms; springs by damping + response (1.0 / 0.3-0.4 default); interruptible; animate from presentation value | `DESIGN-LAW.md` §2 (Apple-design discipline) |
| **Copy gate**: no em/en dash in any user-visible string, no version stamps, no numbered eyebrows, no filler verbs (elevate, seamless, unleash, next-gen, revolutionize, supercharge, effortless, cutting-edge, game-changing, leverage), no fake-perfect numbers, no internal codenames | `check-copy.mjs` with 14 negative controls; first widened run: 120 violations → 3 waived (113 dashes, all in the half nothing scanned) |
| Read-aloud test for every string | especially relevant for a voice-first child product |
| Honest waits: <1 s nothing; 1-4 s in-control spinner; 4-30 s named phase + elapsed; >30 s named honest wait with elapsed counting UP, never a fake bar, copy changes before the timeout | `PRODUCT-JOURNEY.md` §3.3 |
| Errors: one path (`errorCopy.ts`), quote the server, never invent a cause, "This is our error, not something you did", name whose turn it is (waiting on you vs waiting on us, enforced as a TYPE with a negative control) | `decisions.md#blocker-class-is-a-type` |
| A verdict never appears before commit (student practice) | prevents a slot-machine feel |
| Layout gates must render the real signed-in screen, and test narrow containers, not only viewports | nine grid rules reserved tracks for children that did not exist (`rejected.md#viewport-media-queries-cannot-see-a-narrow-container`) |

### 6.3 Journey lesson

"Nobody has owned the JOURNEY": ten workstreams each built a good component and placed it where the
component made sense. Fix: one owner, one design system, a UX queue, and "an unpolished-but-working flow
is now a defect, not a milestone" (`decisions.md#owner-intent-is-the-spec`). Order trust correctly: let
the user experience value (hear the voice) before asking for the expensive trust (ID, face video).
[inference] For Taxila: let a child and parent experience one lesson before asking for consent-heavy
steps, but never let the lesson write memory before guardian consent.

---

## 7. What Taxila should take, in order [inference, grounded in the above]

| priority | take | from @GP | feature |
|---|---|---|---|
| 1 | Minor-first tier ratchet + app-voiced disclosure card at n=0 + per-lane floor checks | `clock.ts`, `surface.ts`, `_clonechannel.js`, `persona-invariants*` | safety |
| 2 | Prompt laws: shapes not lines, appended-last cap, safety at end-of-CORE, prompt budget gate on assembled prompt | `rejected.md#recited-prompt`, `shapelint.ts`, `check-prompt-budget.mjs` | 1 |
| 3 | Deterministic grading engine with authored distractor nature + rushed floor + cited moments; LLM never grades | `src/engine/practice/*` | 2, 4 |
| 4 | Engine/talk split for generated modules: module emits `state/facts/nameable/record`; tutor talks only from those | `activity.ts`, `practiceTalk.ts` | 4, 1 |
| 5 | Tutor sheet with the pedagogy shapes (explanationOrder, firstMoveOnDoubt incl. "say that step out loud", doubt ladder, analogyBank as {topic, anchor}, mistake bank match-then-inject), compiled into the prompt (Gurukul never did) | `teacherTypes.ts`, `demoTeacher.ts`, `teacher-sheet-spec.md` §3.1 | 1, 2 |
| 6 | Mentor arc + method-not-ability + ability-label fence (bilingual) + MENTOR BOUNDARY | `teacher-arc.md` | 1 |
| 7 | Learning-profile store shaped like CIPHER: context-keyed described preferences with evidence counts and citations, separate behaviour vs judgement columns, no silent self-update, held-out probes | `mirror-learning.md` | 3 |
| 8 | Evidence bars for claims about a child (≥3 support, ≥2 distinct days) and bi-temporal validity | `student-app-spec.md` §3.1, `validity.ts` | 3 |
| 9 | Stock-voice bake-off with children/parents as blind listeners, accent and intelligibility as separate axes, K-9 science/maths prompts, script-aware scoring | `VOICE-BAKEOFF*`, `earbench`, `hinglish-script-score` | 1 |
| 10 | Infra posture: never put a GPU cold start on a child's request path; wake-then-sign; startup probes; slim CPU images where possible | `AZURE-DEPLOY-STATE.md` | ops |
| 11 | Design scale tokens, four-state status, copy/motion/contrast gates, honest waits | `tokens.css`, `DESIGN-LAW.md`, `check-*.mjs` | design |
| 12 | Gamification test written into the charter; no leagues, no streak freeze, no absence nudges, XP only from graded outcomes | `safety-floor-teacher.md` §5 | 3 |

**Gaps Gurukul left that Taxila must close itself:** compiling the floor fields into the prompt; the
relay-claim predicate; a disclosure UI on the student surface; practice → relational memory wiring;
spaced-repetition scheduler; any human listening result; any measured comprehension detector (Gurukul had
none; the closest signals are verdict/step/rushed and teach-back); parent dashboard design; K-9 syllabus
data; OCR for scanned or CID-font textbooks.

---

## 8. Path index (all @ `origin/claude/gurukul-platform`)

- Specs: `docs/gurukul/SPEC-GURUKUL.md`, `student-app-spec.md`, `teacher-arc.md`, `teacher-sheet-spec.md`,
  `safety-floor-teacher.md`, `MIRROR-CALL-SPEC.md`, `PRODUCT-JOURNEY.md`, `ROADMAP-100X.md`, `UX-QUEUE.md`,
  `context-locker.md`, `youtube-extraction-posture.md`, `DEPLOY.md`, `ENV-MANIFEST.md`, `EARBENCH.md`,
  `VOICE-LISTENING-BENCHMARK.md`, `VOICE-EXACT-TEXT-MATCHED-PACK.md`, `REPLICA-SELF-TEST-MODE.md`
- Research: `docs/gurukul/research/{mirror-learning,relationalos-100x,voice-stack,competitors}.md`,
  `VOICE-BAKEOFF-HINDI-ENGLISH-2026-08-28.md`, `VOICE-FRONTIER-2026-08-28.md`,
  `INDICF5-PRONUNCIATION-NORMALIZER-2026-08-28.md`, `docs/gurukul/ingestion-research.md`
- Design: `docs/gurukul/DESIGN-SYSTEM.md`, `docs/gurukul/DESIGN-LAW.md`, `docs/DESIGN-STANDARDS.md`,
  `src/studio/design/{tokens,honesty,mobile}.css`, `scripts/check-{copy,motion,contrast}.mjs`
- Practice engine: `src/engine/practice/{session,mastery,syllabus,demoBank}.ts`, `src/engine/practiceTalk.ts`,
  `src/components/{PracticeActivity,MasteryMap}.tsx`, `src/styles/practice.css`, `src/gurukul/practiceStore.ts`,
  `evals/practice.mjs`
- Persona: `src/engine/agents/{teacher,teacherTypes,fromSheet,cloneLife}.ts`,
  `src/engine/agents/characters/demoTeacher.ts`, `api/_teachersheet.js`, `api/_teacher-sheet-draft.js`,
  `api/teacher-sheet.js`, `db/migrations/05{1,2}_teacher_sheet*.sql`, `src/engine/ingest/*`
- Safety: `src/gurukul/surface.ts`, `src/engine/clock.ts`, `src/engine/honesty.ts`, `src/engine/activity.ts`,
  `api/_clonechannel.js`, `evals/persona-invariants{,.data}.mjs`, `docs/REPLICA-ERASURE.md`
- Relational research builds: `src/engine/reciprocity.ts`, `evals/{reciprocity,drift}.mjs`,
  `evals/recallbench/`, `src/engine/validity.ts`
- Voice/infra: `services/{open-voice-runtime,audio-protection,voice-evidence,voice-finetune,indicf5-runtime,
  qwen3-tts-runtime,voxcpm2-runtime,openvoice-converter,moss-tts-runtime,zonos2-runtime,media-extract,
  replica-processing-worker}/`, `docs/gurukul/AZURE-DEPLOY-STATE.md`, `evals/voice-bakeoff/`,
  `evals/speech/hinglish-script-score.test.mjs`
- Memory: `AGENTS.md`, `context/STATE.md`, `context/{rejected,decisions,measurements}.md`, `context/graph.json`
