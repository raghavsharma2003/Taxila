# LEARNER-MODEL: the complete student model for Taxila

**Date:** 2026-10-02 · **Status:** synthesis spec, ready to implement against · **Owner of truth for:** every per-child state Taxila keeps or computes, who may write it, who may read it, and how it is tested.

**Synthesises (and overrides where they conflict):** `../learning-science.md` (LS), and in this folder `kt-algorithms.md` (KT), `vibe-temperament.md` (VT), `need-goals.md` (NG), `motivation-interest.md` (MI), `onboarding-diagnostic.md` (OD), `dialogue-affect.md` (DA), `llm-memory-child.md` (TM), `metacognition-srl.md` (SR), `personalisation-2026.md` (PZ), `student-simulators.md` (SS), and every `## Review` section in those files. Cross-references: `../safety/dpdp-deep.md` (NM-1..NM-13, legal modes M0-M3), `../conductor/observability-evals.md` (OE: O5 DRS, O7, gates G1-G8), `shared/contracts.ts`, `server/learner/*.js`. Companion spec: `STUDENT-SIM.md` (the harness that gates this model).

**Tags.** **[V]** checked against a primary source by the sibling doc that cites it (the sibling's own tag is carried; reviewers asked that abstract-only [V] be read as "abstract seen once"). **[S]** secondary or abstract-only where the sibling's reviewer downgraded it. **[U]** a Taxila default, estimate or inference that must be measured before it is quoted outside the team. **computed** = arithmetic run this session or by a sibling's committed script. Every threshold in this file is [U] unless tagged otherwise; that is deliberate, and §13-§14 name the measurement that replaces each.

**What this file adds beyond its inputs.** (1) One legal-mode ratchet that gates every layer's writes (the siblings each invented their own flag: `KT_MODE`, `VibeMode`, `PP_MODE`, `profile_enabled`, `cri_persist`). (2) One band table, one grade-equivalent scale, one engagement state machine, one safety pre-emption point, one `compile()` order. (3) The reviews' blocking corrections applied to the equations, not just listed. (4) The event→layer matrix, the consolidated Neon schema, the child brief as a byte-budgeted renderer, the Director's typed view, the parent view, and a per-layer evaluation plan with ship gates.

---

## 0. Decisions on one screen

| # | decision | why (evidence, short) | what would reverse it |
|---|---|---|---|
| LM1 | **One `legal_mode` ratchet (M0/M1/M2/M3) gates every learner-layer write in code.** Launch default M1 (academic record). A layer not permitted in a mode has *no write path*. M0 (stateless) is buildable at any time and is the narrow-mode fallback | DPDP s.9(3) bars "tracking or behavioural monitoring of children"; whether a D2C app is an "educational institution" under the Fourth Schedule is unsettled [V statute via LS §4.3; S commentary]. Every sibling review independently found its own layer inside that exposure (KT R29, VT R2, MI R3.19, DA R1, TM R1, SR R2, PZ D26) | Counsel's written opinion on dpdp-deep Q1 permits a layer in a higher mode, or a s.9(5) notification; then that layer's mode floor moves, nothing else does |
| LM2 | **A single safety gate runs first on every child and parent utterance and pre-empts every layer** (distress, self-harm, abuse/secrecy disclosure, unsafe adult). Its output is never learner state | Each sibling's review added the same missing hook separately (NG R1.1, MI R2.9-2.10, DA R3, OD R4, SR R3, PZ C18, SS C5). Inherited law: safety by predicate, not instruction | Never |
| LM3 | **Code decides; a model only labels a turn into a closed set or voices a code-chosen move.** No LLM writes mastery, picks pedagogy, picks silence, or writes free text about the child | StratL: LLM-chosen intents degraded fidelity [V via PZ]; MetaCLASS: LLM coaches chose "no intervention" in 4.2% of turns where 41.7% was right [V-full via SR]; CUPID: LLMs infer user preferences at < 50% precision [V via VT]; at 78% labeller accuracy a correct answer's LR falls 9.0 → 2.6 (computed, KT §1.3) | Per decision, a measured LLM policy beats the code policy on delayed outcomes (PZ PZM5, SR SR-M1) |
| LM4 | **Knowledge = BKT-R per (child, skill)** with categorical hint-ladder outcomes, grader-confusion folding, an FSRS-6 retrievability gate, ability-derived priors, and the review fixes: one learning transition per item-episode, a per-(skill, session) evidence budget, `pL0 = (P−g)/(1−g−s)`, a separate `retention = pL·R`, `idk`/non-attempt outcomes, `learned_today` vs `mastered` vs `durable` | KT D1-D7; Pelánek 2017 [V]; Beck 2008 (help inflates guess to 0.94) [V]; KT review R1-R4, R7, R14, R20, R30 | PFA/Elo/neural challenger beats BKT-R by ≥ 0.02 AUC on delayed items in 2 consecutive monthly refits (K6) |
| LM5 | **One grade-equivalent scale, origin GE 0 = start of Class 1**, one θ implementation (grid posterior, 4PL with slip), used by onboarding, need gap-to-grade and KT priors | Three siblings used three scales (KT "6.0 = start of Class 6", NG "0 = start of Class 1", OD pinned 0 = Class 1) [OD §9] | Cross-class 2PL calibration pilot (K4) shows a non-linear grade scale fits ≥ 0.05 log-lik better |
| LM6 | **Placement is a success-first Bayesian CAT with a mixture prior, provisional until ~16 items per strand** (session 1 + just-in-time items in lessons 2-3); it can seed skills only up to `practising` | Computed (OD sim, 1,500-3,000 sim children per row): SD < 0.35 unreachable in 12 items (mean SD 0.52-0.63); success-first cuts 3+-wrong runs 44% → 8% at +0.13 GE RMSE; single class prior placed 28% of far-behind children > 1 GE too high vs 7% with the mixture. Sim is circular (OD R1): figures are upper bounds | M-OD-1 placement vs a trained ASER-style tester < 70% agreement |
| LM7 | **One engagement state machine at launch: VT's 5 states** (warming, engaged, strained, disengaging, stopped), driven by DA's rule detectors and the diagnostic choice. MI's 11-moment filter is a v2 behind MM2. Strain suppression sits *above* explicit preferences | MI review R6 ("build the 5-state version first"); VT review (explicit "more jokes" must not beat strain); DA: at base rates 4-6% a boredom flag acted on directly has PPV ≈ 0.20 (computed, DA §6.1) | MM2 shows the 11 causes are separable at κ ≥ 0.6 and change the right move |
| LM8 | **No affective, vibe, timing, engagement or trust value is persisted in M1** (dpdp-deep NM-3). Session state lives in memory on the call's owner and is discarded at close | NM-3/NM-4; DA review R1: "recompute, don't store" is not a legal shield, so the shield is *not processing beyond the session* | Counsel permits persisted behavioural layers (M3) |
| LM9 | **Format-efficacy personalisation (the "learning profile") is population-level at launch** (one posterior per age band × topic type, hard pedagogical constraints, choice offers when formats tie). Per-child format deviation needs M3 *and* the HTE gate *and* E-PROFILE | Matching to learning styles: d ≈ 0.04 [S via LS §2]; per-student bandits ≈ population bandits, HTE detection 7-10% (Schmucker 2025) [V via PZ]; NM-10 P5 unavailable until M3 | E-PROFILE (LS §8.7) shows per-child allocation beats population-best on 1- and 4-week delayed outcomes |
| LM10 | **Rewards are delayed and unaided only:** `y_next` (next same-skill item, first attempt, unaided, difficulty-adjusted), `y_delay` (DRS, OE O5), `y_transfer`. Never reattempt success, never engagement | Reattempt correctness r = 0.04 with next-question correctness (Schmucker 2025, 1M students) [V via PZ]; NM-8 bans engagement rewards | OE anchor test shows `y_next` tracks external gains as well as DRS |
| LM11 | **Dependency is measured by absence** (solo rounds: tutor silent until commit) and gated at the *policy* level (Tutor Over-Help, TOH); the per-child crutch-risk index is session-scoped in M1 | Bastani 2025: +48% practice, −17% unassisted exam [V-full via SR]; raw help counts correlate r ≈ −.46 with ability and put 58% of flags in the bottom ability quartile (computed, SR depsim, N = 3,000) | SR-M3 shows raw counts predict next-month solo transfer better than the need-adjusted index |
| LM12 | **The realtime teacher sees one compiled, ≤ 600-token CHILD brief of key=value rows, plus rung-gated LESSON NOW, plus a fixed tail: VIBE → PEDAGOGY NOW → SAFETY → TURN SHAPE (last).** The brief never contains a level, a gap, a day count, a label, an internal id, or a sentence she could say | Inherited laws: sentence-shaped text gets recited; position is mechanism; truncation is silent (G1); prompted GPT-4o leaked the solution in 35.2% of dialogues [V via PZ] | G1/G6 show a different order fires the safety and pedagogy rules more often on the TTB |
| LM13 | **Parents see learning, never conduct** (NM-9): skills and topics with the evidence behind each change ("Kaise pata?"), worded "answers observed" until the KT calibration gate passes. No rates of solo outcomes, no engagement, no comparisons | KT R32 (no calibration gate before mastery claims); SR R9 (solo-round counts become a dependency score under parental pressure); BYJU'S diagnosing children as weak to sell to them [S via NG] | K7 passes (≥ 0.9 delayed accuracy at 1 and 4 weeks, ECE ≤ 0.05, n ≥ 200 children): then "can do on their own" wording unlocks |
| LM14 | **Memory (TeacherMemory) is tiered by consent:** tier A (learning_moment, commitment, open_thread) under P2 in M1; tier B (interest, favourite, preference) under P3 + counsel; tier C (person, upcoming, joke) not built | TM review R6 TM1; NM-7; stored profiles raised agreement sycophancy up to 45% [V via TM]; CareCall: long-term memory raised disclosure and privacy problems [V via TM] | Counsel + TME-P1 shows personal kinds beat learning-only memory on closeness without raising S2 writes |
| LM15 | **Need: facts come from people and papers; level comes only from probes.** A parent's or child's claim about level becomes a probe request, never evidence | Chi, Siler & Jeong 2004: tutors "dismal" at diagnosing alternative understanding [V-abs via NG]; Dizon-Ross 2019: parents' beliefs about their child's level are often inaccurate [V-abs via NG] | MN1 shows parent claims predict probe outcomes at AUC ≥ 0.65 (NG R3.1) |
| LM16 | **Language mix stored = the parent's tile; the estimator's output is a once-per-session suggestion.** The teacher follows the child's live mix inside the session | OD review R4: a parent-confirmed setting derived from monitoring speech is still derived from monitoring; LLM tutoring quality drops 9-10 pp in Hindi (Gupta 2025) [V via PZ] | Counsel permits; then the estimator writes a proposed setting the parent confirms |
| LM17 | **The simulator gates mechanics, never efficacy.** Every metric is reported under two truth families and labelled with its validity scope (`STUDENT-SIM.md`) | LLM sims flip on 50-97% of feedback regardless of relevance (Do 2026) [V via SS]; matched-model inference is an inverse crime (SS review B1) | A simulator family passes the fidelity card F1-F8 on ≥ 300 consented pilot lessons |
| LM18 | **Bands and the GE scale derive from `classLevel` only** (no date of birth). One table, one test | VT review ("age bands by class, avoiding DOB collection"); SS review B11 (two band mappings disagree at age 9) | Never; the table changes only with a migration and its test |

---

## 1. Conflicts between the sibling docs, and the ruling

| # | conflict | sources | ruling here |
|---|---|---|---|
| X1 | GE origin: "6.0 = start of Class 6" vs "0 = start of Class 1" | KT §3.1, NG §4.5, OD §3.1 | GE 0 = start of Class 1, so θ = 5.0 is the start of Class 6 (LM5). KT §3.1 is amended |
| X2 | CAT stop: SD < 0.35 vs SD < 0.6 or 6 items vs SD < 0.55 after ≥ 4 items | KT §3.4, NG §5.5, OD §3.5 | OD's stop set (§6.3 and OD §3.5); SD < 0.35 is a computed rejection |
| X3 | First-session feedback: neutral acknowledgement vs asymmetric (celebrate right, silent on wrong) vs symmetric neutral for 6-9 | onboarding-flow, OD OD6, OD review R3 | Symmetric neutral feedback in B1-B2 during scoring; celebration only at the first-win phase; B3-B4 light immediate correctness feedback (Ling 2017 [V-abs]). M-OD-5 decides |
| X4 | Engagement state: VT computes `strained`; MI derives it from an 11-moment filter; DA adds detectors | VT §4.6, MI §2.1, DA §2 | One machine (LM7). DA detectors → suspicion → verifying move → VT 5-state. MI moments are v2 |
| X5 | Who may say "last" in the prompt | VT (VIBE line last), PZ (PEDAGOGY last), CLAUDE.md (SEARCH/FORGET last), OE G1 (turn-shape rule last) | Fixed tail order (§9.3), each with a token budget; the budget gate throws |
| X6 | Bands: VT A/B/C by age 6-8/9-11/12-15; OD B1-B4 by age; contracts `"6-9" \| "10-15"` by class ≤ 4 | VT, OD, `server/learner/model.js` | One class-based table (§3) with derived views; `ageBandFor` keeps its current contract mapping |
| X7 | Misconception persistence: KT R29 narrow mode drops it; NM-2 allows `misconception_id` + count + resolved in M1 | KT review, dpdp-deep | NM-2 governs: allowed in M1 as counts + logit derived from verified keys; dropped in M0 |
| X8 | Wait time: VT `waitNudgeSec` 8/6/5 s cap 12; SR progressive wait to 2.5× base (15 s in B1) | VT §4.2, SR §3.4, SR review R5 | Two timers: endpoint patience (VAD adapter) and nudge delay. Nudge ≤ 8 s (B1-B2) / 6 s (B3-B4), with a non-hint presence cue at ~3 s; a heartbeat separates silence from a dropped line |
| X9 | Interest decay 45-day half-life (MI, OD) vs a 60-day half-life for vibe arms (VT) | MI §2.7, VT §4.5 | Interest records only exist in M3; 45 d. Vibe arms only in M3; 60 d. Neither runs in M1 |
| X10 | Memory packet 2.6 KB (≈ 740 tokens) vs a ≤ 600-token brief | TM §4.1, task brief | In M1 only tier A exists; the brief carries ≤ 1 opener + ≤ 2 items (≤ 120 tokens). Everything else is pull-only via `notebook_lookup` |
| X11 | CRI: persisted weekly windows vs fail-closed | SR §6, SR review R2 | Session-scoped in M1 (`cri_persist = false`); the policy-level TOH gate needs no child data |
| X12 | Exam window: from 14 days for everyone vs off for young children | NG §4.4, NG review R1.2 | Off for classes 1-2, parent opt-in for 3-4, on for 5-9; exam share ≤ 0.5; opening and closing segments never exam-scoped for classes 1-6 |
| X13 | `selfCheckedBeforeCommit` gates F0 but is unobservable by voice | SR §3.2, SR review R24 | F0 requires an observable: an unprompted correction before commit, or a substitution/check step on a module; else the ladder stops at F1 |

---

## 2. Floors that no layer may cross (each is an eval predicate)

1. **Safety first.** `safetyGate(utterance)` runs before evidence extraction, need extraction, memory candidates and every detector. A fired gate produces a `safeguard` move (Childline 1098 / Tele-MANAS 14416 where required), suspends every MRT arm, solo round, wait timer and verify budget for the rest of the lesson, and writes only an `incident` row (NM-11). Simulated traffic (`sim=true`) routes to a sink, never to a human or helpline (SS review C4).
2. **Never deny being an AI;** no romance or companion register; no "I missed you", guilt, exclusivity or secrecy (LS §4.5; TM banned uses).
3. **A model never grades** what code can check; LLM labels enter only through measured confusion matrices (KT D7).
4. **No labels.** No ability noun, trait, type, diagnosis, emotion or "learning style" in any prompt, child string or parent string (`ABILITY_LABELS` fence in `server/learner/brief.js`, extended with SR/MI/VT lexicons; Devanagari + Roman variants; child-referent patterns only, so "weak acid" passes).
5. **Shapes, not lines.** Nothing sentence-shaped about the child or about how to talk enters the prompt.
6. **Self-report is never evidence** ("samjha?" → no update; LS §1.1, Graesser & Person 1994 [V]).
7. **Low ASR confidence is no evidence** and never a wrong answer; ASR-dropped turns are logged by cohort for the fairness audit (KT R23).
8. **Vibe and affect inputs never change KT evidence, the probe set, the hint-ladder order or whether an error is located** *(restated, gap-fill G2-floor8-permutation-untestable)*. The original wording ("permute vibe/affect inputs → bit-identical KT posteriors and probe schedule") contradicted four couplings this spec itself allows: the GAME window and `controllerEasy` temper LRs (§6.1 rule 4), challenge bands pick item difficulty by `EngagementState` (§6.7), `strained` triggers `tell_then_try` and so teach transitions (§6.5a rule 5), and DA costly moves change which items get probed (§6.7). The floor is therefore two tests over a typed input partition (§13.1): **(I) isolation, byte-identical:** for a fixed (episode stream, outcome stream, held flags), permuting anything in `KT_PERMUTED_INPUTS` leaves KT posteriors, misconception logits, θ and the probe set per (skill, outcome history) byte-identical; **(II) bounded coupling:** engagement may change *which items arrive* and whether a tell happens, but per-skill mandatory probe counts under `strained` vs `engaged` differ by ≤ 1 per lesson and R2e verification after a first correct answer is never suppressed by strain. Strain may truncate the ladder (jump to rung 3 via rule 5); it never reorders it.
9. **No engagement optimisation** (NM-8): no streaks, counters, push nudges to the child, "one more?" after exit intent, or rewards keyed to return.
10. **Purpose limitation.** Learner state is read only by teaching, parent reporting and safety code. Paywall, upsell, notification and marketing modules cannot import it (lint rule; NG N12).

---

## 3. Bands, scales and identifiers (`shared/bands.ts`, pure)

```ts
export type ClassLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Band4 = 'B1' | 'B2' | 'B3' | 'B4';          // diagnostic, SRL, item caps
export type Band3 = 'A' | 'B' | 'C';                    // vibe/register knobs
export type ContractBand = '6-9' | '10-15';             // shared/contracts.ts ChildBrief.ageBand (unchanged)
export const BANDS: Record<ClassLevel, { b4: Band4; b3: Band3; contract: ContractBand; typicalAge: [number, number] }> = {
  1: { b4: 'B1', b3: 'A', contract: '6-9',  typicalAge: [6, 7] },   2: { b4: 'B1', b3: 'A', contract: '6-9',  typicalAge: [7, 8] },
  3: { b4: 'B2', b3: 'A', contract: '6-9',  typicalAge: [8, 9] },   4: { b4: 'B2', b3: 'B', contract: '6-9',  typicalAge: [9, 10] },
  5: { b4: 'B3', b3: 'B', contract: '10-15', typicalAge: [10, 11] }, 6: { b4: 'B3', b3: 'B', contract: '10-15', typicalAge: [11, 12] },
  7: { b4: 'B3', b3: 'C', contract: '10-15', typicalAge: [12, 13] }, 8: { b4: 'B4', b3: 'C', contract: '10-15', typicalAge: [13, 14] },
  9: { b4: 'B4', b3: 'C', contract: '10-15', typicalAge: [14, 15] },
};
// A parent may move a child one band toward younger (never older) for register knobs only; KT, items and caps follow class.
export type GE = number;            // grade-equivalent; 0.0 = start of Class 1; 5.0 = start of Class 6; months ≈ 0.1
export type SkillId = string;       // data/curriculum/*.json topic/skill id, e.g. "c4-maths-ch05-t01-s2"
export type MisconceptionId = string; export type Strand = `${'maths'|'science'|'evs'|'english'|'hindi'|'sst'}:${string}`;
```
Test: every class maps to exactly one value per view; `ageBandFor(classLevel)` in `server/learner/model.js` equals `BANDS[c].contract`.

---

## 4. Legal modes and per-layer write gates (`server/learner/mode.js`)

`child.legal_mode` is set once from consent scope × deployment and can only ratchet **down**; every change is an `audit` row (NM-1). Consent purposes are dpdp-deep NM-10: P1 tutoring (required), P2 academic record, P3 personal details, P4 anonymised research, P5 format personalisation.

| layer · table(s) | M0 stateless | **M1 academic record (launch)** | M2 school mode (DPA) | M3 full consumer (after opinion) |
|---|---|---|---|---|
| Knowledge: `kt_evidence`, `kt_skill_state` | session only (TTL row, hard-deleted at close) | persisted (NM-2 fields; P2) | persisted | persisted |
| Misconception: `kt_misconception` | session only | persisted counts/logit (NM-2) | persisted | persisted |
| Ability/placement: `kt_ability`, `placement` | parent-set class only | persisted [U: counsel Q1(b)] | persisted | persisted |
| Learning speed `kt_child.eta` | — | **not written** | persisted | persisted |
| Need facts: books, calendar, homework, goals, constraints | parent-entered only | persisted (academic record) | persisted | persisted |
| Need beliefs `need_parent_belief`, child-said rows | — | probe requests only, no belief rows | persisted | persisted |
| Format efficacy, per child `pz_knob_posterior.child_id` | — | — (population posteriors only, no child id) | per school policy | after HTE gate |
| Independence: `vy_fade_state` | session | persisted (it is "with help / independent" per skill, NM-2) | persisted | persisted |
| Independence: CRI windows `vy_dep_window` | — | — (session-scoped CRI) | aggregates | persisted, 90 d |
| Vibe explicit `vibe_explicit` (closed values) | session | persisted (child_said/parent_set, closed set only) | persisted | persisted |
| Vibe slow knobs, session aggregates | — | — | — | persisted (`persisted_adaptive`) |
| Motivation interest records, value arms | — | — | — | persisted, TTL 180 d |
| Child threads (child's own question) | — | tier A memory (`open_thread`) under P2 | yes | yes |
| Memory tier A | — | P2 | yes | yes |
| Memory tier B | — | P3 + counsel only | P3 | P3 |
| Memory tier C | — | not built | not built | after TME-P1 |
| Language: parent tile | yes | yes | yes | yes |
| Language: estimator output | session | session (one suggestion to parent) | persisted | persisted |
| Affect, timing, engagement, trust | session | session | session | session (never persisted in any mode, NM-3) |
| Research log (pseudonymous, no free text) | — | P4 only, TTL 30 d | P4 | P4 |
| Per-turn pedagogy ledger `pz_decision/pz_outcome` | — | only the structured fields KT needs; MRT logging off | P4 + ethics | P4 + ethics |

```ts
// server/learner/mode.js (JSDoc-typed JS; shapes in shared/learner.ts)
const M1 = ['kt','mis','ability','need_fact','fade','vibe_explicit','mem_A','lang_tile'];
const M2 = [...M1, 'eta','need_belief','cri_agg','mem_B','lang_est'];
const M3 = [...M2, 'vibe_slow','interest','value_arms','pz_child','cri'];
export const WRITES = Object.freeze({ M0: new Set(['session']), M1: new Set(['session', ...M1]),
  M2: new Set(['session', ...M2]), M3: new Set(['session', ...M3]) });
// 'research' (research_log) is not a mode layer: it requires consent.P4 in any mode except M0.
export function assertWritable(child, layer) {           // called by the ONE writer module; throws, never warns
  const allowed = WRITES[child.legal_mode];
  if (!allowed.has(layer)) throw new Error(`legal_mode ${child.legal_mode} forbids ${layer}`);
  if (layer === 'mem_B' && !child.consent.P3) throw new Error('P3 consent required');
}
```
- **Narrow-mode fallback (M0).** If counsel adopts the strict reading, `ratchetDown(child, 'M0')` runs one transaction: delete every persisted learner row for the child (cascade from `child_id`), keep consent and audit rows, and switch the brief renderer to parent-set curriculum position + session-only state. A test builds an M0 child from an M1 child and asserts zero learner rows remain. What M0 costs: no cross-session mastery (each session starts from the parent-set chapter plus a 3-item warm-up placement), no memory, no spaced review schedule (reviews are re-derived each session from a short retrieval check). What survives: everything inside a session (NM-4), the persona, and the parent-set facts.
- **Schema test (NM-3).** A migration test fails if any table in the learner schema has a column named or typed like latency, pause, prosody, affect, mood, engagement, trust, vibe score or free-text-about-child, outside the explicitly listed M3 tables, which are created only when `LEARNER_M3_TABLES=1` at migration time.

---

## 5. Architecture

```
child audio ─► realtime (gpt-realtime-2.1, Azure) ─► transcript + timing ─► POST /api/lesson/turn (taxila-web, ACA)
                                                                              │
   ┌──────────────────────────────────────────────────────────────────────────┘
   ▼
 safetyGate ──fired──► safeguard move, incident row, freeze adaptive layers ─────────────────────────────┐
   │ clear                                                                                              │
   ▼                                                                                                    │
 turn labeller (gpt-5.6, closed set, 2-sample agreement) ─► TurnEvent ─► EvidenceEvent(s) ─► KT step  │
   │                                    │                                   (writer, advisory lock)    │
   │                                    ├─► detectors (GAME, IMPASSE/SPIN, CONFUSION clock,            │
   │                                    │    FRUSTRATION, DRIFT) ─► arbiter ─► EngagementState         │
   │                                    ├─► fade controller (support F, prompt P)                      │
   │                                    └─► memory candidates (session only)                           │
   ▼                                                                                                    │
 PP.decide(StepState) ─► Move + rung ceiling ─► VibeDirective ─► compile() ─► session.update ─────────────┘
 session close ─► consolidation job (memory tier A, mode-gated aggregates) · nightly ACA job ─► KT refit, FSRS, decay, TTL sweeps
```

- **Hosting (Azure-only directive).** Turn path: `server/routes/lesson.js` → `server/learner/*` on Azure Container Apps `taxila-web`. Nightly: an ACA scheduled job (`taxila-learner-nightly`) runs KT EM refits, labeller confusion refits, memory decay and TTL sweeps (KT review R31). Nothing on Vercel.
- **Latency budget per child turn** [U]: safety lexicon + classifier ≤ 80 ms; labeller ≤ 300 ms p90 with a previous-shape fallback on timeout (DA review R25); KT step < 1 ms; detectors < 5 ms; compile ≤ 20 ms; DB writes in one transaction ≤ 30 ms on the pooled `pg` connection (measured 9 ms/query, `db-driver-latency-2026-10-02`).
- **Ordering and concurrency.** Evidence is ordered by the server-assigned `seq` under `pg_advisory_xact_lock(hashtext(child_id))` in the write transaction, not by client `occurred_at` (KT review R5). Replay folds by `seq`. A shuffled-arrival test asserts online fold = replay.
- **Session state home.** In memory on the replica that owns the call's WebSocket (ACA session affinity). On restart or scale-in: rebuild from the last 3 turn events of the open lesson (kept in the lesson's TTL rows), set engagement to `warming`, and use explicit-only vibe for 3 turns (DA review R2, MI R4.26). Test: kill the process mid-lesson; assert the next turn has a valid state and no persisted affect.

---

## 6. Layer specifications

### 6.1 Knowledge (KT): what the child can do

**Purpose.** What to teach next, when to review, and the only source for any claim that the child "can" do something.

```ts
// shared/learner.ts (types) · server/learner/kt/*.js (implementation; JS ESM with JSDoc)
export type TopicType = 'T1'|'T2'|'T3'|'T4'|'T5';
export type EvidenceClass = 'item.open'|'item.mcq2'|'item.mcq3'|'item.mcq4'|'probe.why'|'probe.teachback'
  |'probe.transfer.near'|'probe.transfer.far'|'probe.errorspot'|'probe.predict'|'solo'|'para';   // para: M3 + KT_PARA_ENABLED only
export interface EvidenceEvent {
  id: string; seq?: number /* server-assigned */; childId: string; sessionId: string; episodeId: string;  // episode = one item attempt chain
  at: string; skillIds: SkillId[] /* ≤ 3, conjunctive */; cls: EvidenceClass; outcome: number;        // index into OUTCOMES[cls]
  grader: 'code'|'llm'|'human'; graderVersion: string; asrConf?: number; itemKey: string;
  teach?: boolean; assisted?: 'parent'|'sibling'|null; controllerEasy?: boolean; preAttemptHelp?: boolean /* G1 §6.3.1 */;                        // see rules 9, 10
}
export interface SkillState {
  pL: number; retention: number;                 // retention = pL × R(now); the tutor and parent read this, not pL
  mem: { S: number; D: number; lastReviewAt: string; reps: number; lapses: number } | null;
  n: number; lastAt: string | null; paramsVersion: string;
  flags: { unaided: boolean; generative: boolean; delayed: boolean; durable7: boolean; durable30: boolean };
  recent: (0|1)[];                               // last 3 unaided-scored outcomes (replaces the α=0.9 EMA, KT R1)
  opp: number; run: number;                      // wheel-spin counters
  display: 'unseen'|'introduced'|'practising'|'learned_today'|'mastered'|'durable';   // monotone except §6.1 rule 8
  refresh: boolean;
}
export interface KtView { skill(id: SkillId): SkillState | undefined; pSuccessNext(itemKey: string): number;
  weakestPrereq(id: SkillId): SkillId | null; due(now: string, k: number): SkillId[]; }
```

**Outcome classes and default emissions** (launch priors [U], refit by EM per cluster subject × topic type × class band; KT §1.2 plus review R20):

| class | outcomes (index order) | LR = k/u at launch |
|---|---|---|
| item.open | C0 first try · C1 second try · C2 after 1 rung · C3 after ≥ 2 rungs · C4 bottom-out · IDK said "pata nahi" before attempting · NA no attempt | 8.0 · 1.0 · 0.35 · 0.16 · 0.05 · **0.5** · **(no update)** |
| item.mcqK | first-attempt correct · wrong (retries carry no positive evidence) | K=2 1.8/0.20 · K=3 2.7/0.15 · K=4 3.6/0.13 |
| probe.why | full · partial · none · misconception | 7.5 · 1.14 · 0.24 · 0.15 (before folding) |
| probe.teachback | ≥ .8 · .5-.8 · < .5 · misconception coverage | 6.9 · 1.2 · 0.26 · 0.15 |
| probe.transfer.near / far | pass · fail | 5.7/0.18 · 8.1/0.38 |
| probe.errorspot / predict | caught+fixed · caught · missed / right · mapped-wrong · other | 5.0·1.15·0.33 / 1.7·0.43·0.83 |
| solo (SR solo round, tutor silent) | C0 · C1 (fix after locate) · fail | as item.open C0/C1/C4 |

**Update rules (one evidence event).**
```
0  if safety fired this turn, or asrConf < ASR_MIN[cohort], or outcome = NA     → no update (log drop by cohort)
1  R = (1 + f·Δt/S)^(−w20), f = 0.9^(−1/w20) − 1, w20 = 0.1542 (FSRS-6 default [V via KT]); R = 1 if no mem
2  fold grader noise: k' = k·M, u' = u·M  (M per class × graderVersion; default diagonal 0.7 for LLM, KT R27; code = identity)
3  retrieval gate (symmetric, KT R30 ruling): kR[o] = R·k'[o] + (1−R)·u'[o];  LR = kR[o]/u'[o]
   → invariant: LR(C0) ≥ 1 for all R ∈ (0,1] (C0 never lowers pL). A late success is weaker evidence of knowing;
     its value is carried by stability growth S, not by pL.
4  modifiers: assisted ≠ null → LR ← LR^0.5 ; gamingWindowKt → LR ← LR^0.25 ; controllerEasy → LR ← LR^0.5 (MI R7.47)
   (gap-fill G2-floor8-permutation-untestable) both flags are HELD inputs (§13.1) and must be derived only from held
   fields: gamingWindowKt = gameKt(episodes, outcomes, taskActs) uses G1′ (wrong → different answer on the same step,
   no onset clause), G2 (no-attempt request clause only, no 20 s clause), G3 (item-aware), G5; never G1-onset, G4-dwell
   or G6-rapid, which are timing features and may raise only the engagement GAME suspicion (DA R23 already halves them).
   controllerEasy = (pSuccessAtSelection ≥ 0.85), recorded on the episode at selection time; never read from
   EngagementState. Within a session R(now) in rule 1 uses sessionStartAt, so timing knobs (waitNudgeSec,
   endpointSilenceMs) that shift event timestamps by seconds cannot move retention bytes.
5  session budget (KT R3): w_j = 1/j for the j-th event of the same class on this (skill, session);
   Σ_session w·log LR is clamped to ±log 50  [U]  → in-session pL from a 0.39 prior tops out at 0.970 (computed)
6  posterior q = odds(pL)·LR^w / (1 + odds(pL)·LR^w)   (conjunctive items: KT §1.5, blame on the weakest skill)
7  transition once per item-episode, not per event (KT R2): pL' = q + (1−q)·T_eff, T_eff = σ(logit T + η·[M2+]);
   teach-only episodes: pL' = pL + (1−pL)·T_eff, capped at +0.10 per episode
8  memory (FSRS) update only on the first retrieval-type event per skill per session; grade from evidence, never self-rating:
   1 = fail/C3/C4 · 2 = C1/C2 · 3 = C0 · 4 = C0 + passed transfer/why in the same episode
9  retention = pL' × R(now)
```
Defaults per opportunity: T = 0.12 (T3), 0.18 (T4), 0.10 (T5); F = 0 (forgetting lives in R). Parameters are shared per cluster until a skill has 50 children × 15 opportunities, then shrunk with 20 pseudo-observations (KT §2.4). EM: forward-backward, 5-20 restarts, constraints T ≤ 0.3, prior ∈ [0.02, 0.85], LR(best) ≥ 1.5; teach events are non-emitting steps (KT R34).

**Cold-start prior per skill** (KT R4 fix): `P = p4pl(θ, b_skill)` on the GE grid with the skill's b recalibrated so that an on-grade child has P ≈ 0.7; then `pL0 = clamp((P − g)/(1 − g − s), 0.02, 0.85)` with g, s from the cluster (example: P = 0.7, g = 0.2, s = 0.1 → 0.714, computed); then cap at `min(pL_prereq) + 0.15`. pL0 is the exact grid expectation, not a probit shortcut, because the onboarding posterior can be bimodal (OD §3.6). *(gap-fill G1-theta-lesson-update)* θ here is always the **epoch base** (θ frozen at session open), never in-session θ. pL0 is materialised once, at the skill's first evidence event and before that event is applied, and then frozen. Skills with n = 0 are virtual and read the current base. A skill with n > 0 is never re-priored (§6.3.1 TH2-TH3).

**States (display).**
| display | condition |
|---|---|
| introduced | ≥ 1 teach or evidence event |
| practising | ≥ 1 evidence event (placement can seed at most this, NG N9) |
| learned_today | pL ≥ 0.95 ∧ `unaided` (≥ 1 C0 on item.open or mcq3+) ∧ `generative` (≥ 1 pass on why, teach-back, transfer or error-spot) ∧ ≥ 2 of `recent` = 1 |
| mastered | learned_today, then a delayed success ≥ 20 h later in another session (C0 or transfer pass), pL ≥ 0.95 after it |
| durable | mastered ∧ unaided successes at ≥ 7 d and ≥ 30 d after learned_today (KT R14) |
| refresh (flag) | R(now) < 0.9, or one delayed miss. Absence never lowers display (Gurukul A2); two consecutive delayed misses demote one level, shown as "let's refresh", never as a drop (KT R33) |

**Other rules.**
- **Wheel-spin:** ≥ 6 opportunities without 3 C0 in a row → early warning → probe the weakest prerequisite; ≥ 10 → change approach and route to the prerequisite (DA DA5; Beck & Gong 2013 [S]).
- **Fast-forward** only if the CAT prior ≥ 0.85 *and* one code-graded unaided item on the skill is C0; then one generative probe plus a delayed check (KT R33).
- **Fluency (T1, T2):** per-item FSRS + Elo prior, not BKT (KT D2). Response time affects the grade only when no timer is visible.
- **Frozen globals:** item difficulty b, cluster parameters and labeller M change only in the nightly job, which writes a new `params_version`; states re-fold lazily at the next session start (KT R6).
- **Gaming detector** feeding rule 4 is outcome-based (DA §5.1), capped once per session, and never lowers LRs for fast correct answers (KT R21).

### 6.2 Misconceptions

Separate binary state per (child, misconception); `logit m += log LR` per event. Diagnostic distractor hit LR 6.9, a correct answer on a discriminating item LR 0.49; prior = prevalence at the child's θ (default 0.15) [U, KT §1.6]. Two hits take p 0.15 → 0.89 (computed, KT).
- **p ≥ 0.7 only triggers a verifying probe** (P5/P7 or a contrast case), never a verdict, because hidden-misconception detectors run at ~8 false alarms per hit in Eedi data [V via LS §7.2].
- **Resolved** = p ≤ 0.2 after a discriminating probe ∧ a scheduled delayed check. `resolved` is never set without the check being scheduled (SS R3c).
- **No double counting** with `probe.why = misconception`: that outcome updates the misconception state *or* the skill LR's misconception row, chosen by the kit mapping, not both (KT R27).
- **Induced misconceptions.** A re-teach without a counter-example can create an over-correction ("smaller denominator is always bigger"); kits list induced-bug ids and the next delayed check tests for them (SS review D2).

### 6.3 Ability and placement (shared by onboarding, need and KT)

```ts
export interface Normal { mu: GE; sd: number }
export interface StrandPosterior { strand: Strand; grid: Float32Array /* GE −2..12 step .05 */; mean: GE; sd: number;
  q25: GE; q30: GE; q40: GE; modes: GE[]; ambiguous: boolean /* modes differ > 1.5 GE */; nItems: number;
  stop: 'exit'|'strain'|'time'|'cap'|'precise'|'pser'|'bracket'; engineVersion: string }
```
- **Item model:** 4PL `P = c + (1 − c − s)·σ(a(θ − b))`, a = 1.7 per GE, s ≈ 0.08, c = 1/K for MCQ else 0.02 (NG R4.4).
- **Prior (mixture, OD OD4):** `0.6·N(enrolled − 0.5, sd0²) + 0.4·N(enrolled − gapFar, sd0²)`, sd0 = 1.5 (Classes 3-9) or 1.0 (Classes 1-2); gapFar maths = max(0.5, 0.6·(class − 1.8)), language = clamp(0.67·class − 3.5, 0.3, 2.5). Weights and gapFar are a versioned config row [U, 2 points] (OD R2).
- **Session-1 caps and stops (OD §3.5 with review fixes):** per strand ≤ 6 items (B1), 7 (B2), 8 (B3-B4), plus ≤ 4 on the current chapter for B3-B4; total ≤ 12 (classes 1-4) / 16 (5-9). Stop on the first of: child exit intent; 2 consecutive strain turns or 3 of the last 4 wrong (unconditional, NG R1.3); strand time cap; item cap; SD < 0.55 after ≥ 4 items; predicted SD reduction < 0.03; confirmed ladder bracket. Except on exit, close with one real item at P ≈ 0.9 if the last was wrong (logged rate). First targeting P 0.85, then 0.70 after right / 0.80 after wrong. A first oral miss is re-offered as a tap before it counts; a low-confidence ASR transcript or "pata nahi" is not a failure. Hard session cap 15 min with a degrade order (drop the reading comprehension extra, then the notebook photo, then the chapter check; `degraded = true`) (OD R5).
- **Update:** exact grid posterior (281 points) per item; EAP mean; ADF re-fit to a Normal only for `kt_ability` storage. Between sessions: Glicko inflation `sd² ← sd² + c²·days`, c = 0.077 GE/√day, cap at sd0 (KT §3.2), plus term-time drift +0.08 GE/month on μ [U] (KT R25).
- **Starting point:** teaching starts at the posterior's q30 (classes 1-6) or q40 (classes 7-9), held provisional (OD R2). Borrowing across strands: `μ_B ← μ0_B + ρ·(μ_A − μ0_A)`, ρ = 0.6 maths-maths, 0.4 maths-reading, shift capped at ±0.5 GE until M-OD-4 (OD R5).
- **Foundation lock-in exit:** two sessions at P > 0.9 on foundation items trigger an on-grade probe (OD R5).
- **The child never hears a level, gap, comparison or class label below their own** (NG N2); θ and the GE gap are internal and parent-only through the "level bridge" with evidence (KT R18).
- **In-lesson θ updates and the θ → KT coupling:** §6.3.1 *(gap-fill G1-theta-lesson-update)*. The "Update" and "Borrowing" bullets above govern placement only; once placement closes, §6.3.1 governs.

#### 6.3.1 In-lesson evidence → θ, and θ → KT priors *(gap-fill G1-theta-lesson-update)*

**Gap.** §7 said `EvidenceEvent` item/probe feeds θ and §10 `foldLayers` folds θ every turn, but only binary, calibrated `PlacementItem`s had a likelihood. Without a rule, an implementer has to guess which of the 30+ (class × outcome) cells enter θ, which b to use for an uncalibrated kit item, and how to stop one answer being counted in pL_k, again in θ, and a third time when θ re-priors k. That would be the classic BKT + IRT double count: the latent-factor + KT integration (Khajah et al. 2014 [S]) and prior-per-student BKT (Pardos & Heffernan 2010 [S]) both work because the student factor is a *prior* on each skill, not a second likelihood term for the same response.

**Rulings (each with a reversal condition).**
| id | ruling | why | reverse if |
|---|---|---|---|
| TH1 | θ uses only **cold, first-attempt, unaided, code-graded, single-strand** item and solo events, each counted once (`thetaObs` below). Probes, LLM/human-graded events, assisted, gaming, controllerEasy, contaminated and post-teach attempts never enter θ. They are excluded, not tempered | θ is the strand position on the GE scale and must keep the meaning it had in placement (cold binary items against a b). Post-teach and probe outcomes measure today's learning of skill k, and pL_k already holds them. Tempering (KT rule 4) has no calibrated meaning on the 4PL and would let the same weak signal into two layers | G5-sim R2i shows θ coverage < 0.80 or RMSE worse than placement-only because too few events qualify (median < 2 eligible events per strand per session) → admit near-transfer probes once code-graded with calibrated b (n ≥ 300) |
| TH2 | Within a session θ changes, but **KT priors read θ only from the epoch base** (the posterior frozen at session open). `pL0(k)` is materialised from `θ_base` at k's first evidence event and frozen; skills with n = 0 are virtual (computed on read from `θ_base`) | It removes every within-session θ → pL path, so no event can reach pL twice, and the order of events on different strands cannot change any pL | M-OD-10: first-item P(correct) on new skills in sessions 2-3 falls outside [.5, .9] more often with `θ_base` than with live θ, by ≥ 5 pp, in a paired sim and in the pilot |
| TH3 | θ never reads pL, and pL_k with n_k > 0 never reads θ again (not at session open, not at a nightly re-fold) | A one-way, one-shot coupling cannot drift or ratchet | never (a structural invariant; a hierarchical joint model would replace both layers instead) |
| TH4 | Within an epoch each strand accumulates an **exact log-likelihood grid** (281 points, the placement grid). Cross-strand borrowing ρ lives only in the epoch base's covariance and is combined in closed form. Glicko inflation and term drift run only at epoch open | Grid log-likelihood sums commute, so within-epoch θ is exactly invariant to event order and to strand order. Inflation is diagonal, so it also commutes across strands | the epoch combine step costs > 2 ms p95 per turn (not expected: ≤ 4 strands per subject) |

**(a) Which events enter θ, and their 4PL likelihood.**
```ts
// server/learner/kt/ability.js (types in shared/learner.ts)
export interface ItemMeta { itemKey: string; strand: Strand | null /* null = multi-strand → never θ */; skillIds: SkillId[];
  b: { source: 'item_mml'|'item_online'|'template'|'skill'; mu: GE; sd: number /* σ_b */ }; K?: 2|3|4 /* MCQ */;
  entryRung: 0|1|2|3|4 /* rung at presentation */; contaminated: boolean /* §6.5 leak scan */ }
export interface ThetaObs { evId: string; strand: Strand; y: 0|1; b: GE; a: number; c: number; s: number; w: number }

const S_SLIP = 0.08, A_GE = 1.7, C_OPEN = 0.02, THETA_STRAND_CAP = 6 /* Σw per strand per session [U] */;
const gAtten = (sb: number) => 1 / Math.sqrt(1 + 3 * A_GE ** 2 * sb ** 2 / Math.PI ** 2);   // Glicko g(σ_b), KT §3.2

export function thetaObs(ev: EvidenceEvent, item: ItemMeta, sess: SessionLedger): ThetaObs | null {
  // gates shared with KT rule 0
  if (sess.safetyFiredThisTurn || (ev.asrConf ?? 1) < ASR_MIN[sess.cohort]) return null;
  // TH1 gates, in order; each returns a logged drop reason
  if (ev.grader !== 'code') return drop('not_code');                         // no grader folding needed: code M = identity (KT rule 2)
  if (ev.assisted != null || sess.gamingWindow || ev.controllerEasy) return drop('modified');  // KT rule 4 cases: excluded, not tempered
  if (item.strand == null || item.contaminated || item.entryRung > 0) return drop('item');
  if (ev.teach || item.skillIds.some(k => sess.taughtBeforeThisAttempt(k))) return drop('post_teach');  // cold = no TeachEvent on any
                                                                            // of its skills earlier in this session
  if (!sess.firstEventOfEpisode(ev)) return drop('not_first');               // retries, re-asks and isomorph follow-ups of the same episode
  const y = firstTry(ev); if (y == null) return drop('censored');            // IDK, NA, help before any attempt
  const j = sess.thetaCountOnSkills(item.skillIds) + 1;                      // testlet discount: j-th θ event on these skills this session
  const w = Math.min(1 / j, THETA_STRAND_CAP - sess.thetaWeight(item.strand));
  if (w <= 0) return drop('strand_cap');
  const { mu: b, sd: sb } = item.b;
  return { evId: ev.id, strand: item.strand, y, b, a: A_GE * gAtten(sb), c: item.K ? 1 / item.K : C_OPEN, s: S_SLIP, w };
}
function firstTry(ev: EvidenceEvent): 0|1|null {      // value of the FIRST unaided attempt; KT LR tables are not used here
  const o = OUTCOMES[ev.cls][ev.outcome];
  switch (ev.cls) {
    case 'item.open': return o === 'C0' ? 1 : (o === 'IDK' || o === 'NA' || ev.preAttemptHelp) ? null : 0;  // C1-C4: first try wrong
    case 'item.mcq2': case 'item.mcq3': case 'item.mcq4': return o === 'first_correct' ? 1 : 0;           // retries ignored (no 2nd event)
    case 'solo': return o === 'C0' ? 1 : 0;                                    // C1 (fixed after locate) = first commit wrong
    default: return null;                                                      // probe.*, para: never θ (TH1)
  }
}
// likelihood on the grid: L(θ) = P^y (1−P)^(1−y),  P = c + (1 − c − s)·σ(a(θ − b)),  entered as w·log L (power weight)
```
New field: `EvidenceEvent.preAttemptHelp?: boolean`, set by `toEvidence` when a rung was delivered before any child attempt. Such a C2-C4 is censored, not a failure. That is the in-lesson twin of OD's "a hint before trying is not a miss".

| class × outcome | θ | likelihood | note |
|---|---|---|---|
| item.open C0 | y = 1 | 4PL, c = .02 | only if cold, entry rung 0, first event of the episode |
| item.open C1 · C2 · C3 · C4 | y = 0 | 4PL | first try was wrong; the ladder depth after it is KT evidence (LR .35/.16/.05), not θ evidence |
| item.open C2-C4 with `preAttemptHelp` | censored | — | the child never attempted unaided |
| item.open IDK · NA | censored | — | as in placement ("pata nahi is not a failure"). Known bias: θ reads high for children who say IDK when they don't know. Measured by R2i on `idk_heavy` cards; reversal: bias > 0.25 GE → IDK enters as y = 0 at w = 0.5 |
| item.mcqK first-correct · wrong | y = 1 · 0 | 4PL, c = 1/K | K = 2 is allowed (low information is handled by the likelihood) |
| solo C0 · C1 · fail | y = 1 · 0 · 0 | 4PL | solo is unaided by construction; still has to be cold (delayed twins, review items) |
| probe.why / teachback / transfer / errorspot / predict | excluded | — | LLM-graded or not on the GE scale; they live in pL_k and the misconception layer (TH1 reversal) |
| any event with `assisted`, a gaming window, `controllerEasy`, `contaminated`, entry rung > 0, `teach`, LLM/human grader, multi-strand item | excluded | — | **KT rules 2-4 are deliberately not mirrored**: θ admits only events for which those rules would be the identity |
| `ModuleEvent` graded by code | as item.open | 4PL | only with an `ItemMeta` carrying b; otherwise excluded |

KT rule 3 (the retrieval gate) is also not mirrored. θ predicts *current* cold performance against b, forgetting included, which is what both placement and `pL0` need. Between-session decay of θ itself is handled by inflation, not by R. KT rule 5 (session budget) is replaced by the testlet discount w = 1/j per skill set plus the per-strand cap Σw ≤ 6. Repeated items on one skill in one session are locally dependent given θ, because they share pL_k. Worked example, computed (TH4 grid, base N(4.0, 0.6²), b = 4.2, σ_b = 0.5): three cold C0s on *different* skills take θ to 4.59 ± 0.49. The same three on *one* skill (w = 1, ½, ⅓) take it to 4.41 ± 0.53. One cold miss gives 3.82 ± 0.57.

**(b) b and a for an in-lesson item with no IRT calibration.** The first source available wins, and every item carries `b.source` so the report can stratify by it:
1. `item_mml`: the item has ≥ 300 responses, calibrated by 2PL MML in the nightly job (KT §3.4); σ_b = its SE.
2. `item_online`: an anchor item with ADF-refined b (KT §3.2), frozen between nightly refits (KT R6); σ_b = its posterior SD.
3. `template`: an LLM-generated variant or kit item inherits `b ~ N(b_template, 0.5²)` (KT §3.2); σ_b = √(σ_template² + 0.5²).
4. `skill`: the skill's curricular GE (NCERT class + chapter position/10), recalibrated per KT R4 so that an on-grade child has P ≈ 0.7; σ_b = 0.75 [U].

The slope is attenuated by b uncertainty with Glicko's g: `a_eff = 1.7·g(σ_b)` = 1.70 / 1.64 / 1.54 / 1.39 at σ_b = 0 / 0.3 / 0.5 / 0.75 (computed). A guessed b therefore moves θ less. s = 0.08; c = 1/K for MCQ, 0.02 for open answers. A child's in-lesson answers never move b online. b moves only in the nightly job, capped at 0.1 GE per child (KT §3.2), and only from events that pass `thetaObs`, so b and θ share one admissible set.

**(c) No double counting.** The order inside `foldLayers` for one event:
```ts
function foldEvidence(view: LearnerView, ev: EvidenceEvent, item: ItemMeta, sess: SessionLedger): LearnerView {
  if (view.seen.has(ev.id)) return view;                                     // idempotent: at-least-once delivery, replays
  for (const k of ev.skillIds)
    if (view.kt.n(k) === 0) view = view.kt.materialisePrior(k, priorFromTheta(view.ability.base, k),   // TH2: θ_BASE, never live θ
                                                            { epochId: view.ability.epochId });       // stored for audit/replay
  view = view.kt.update(ev);                                                 // §6.1 rules 0-9 (the only path into pL_k)
  const o = thetaObs(ev, item, sess); if (o) view = view.ability.add(o);     // the only path into θ; ev.id recorded in o
  return view.markSeen(ev.id);
}
const priorFromTheta = (base: EpochBase, k: SkillId) =>               // §6.1 cold-start prior, exact grid expectation
  capByPrereqs(k, clamp((gridExpect(base.marginal(strandOf(k)), t => p4pl(t, bSkill(k))) - g(k)) / (1 - g(k) - s(k)), 0.02, 0.85));
```
Consequences, all asserted by tests (§13 Ability row). (i) Each event id enters at most one θ log-likelihood term and one pL update. (ii) The prior that k receives at its first event is computed from a θ that cannot contain that event, or any event of the current session. (iii) A skill with n > 0 is never re-priored by θ: not when θ changes, not at session open, not on a nightly re-fold (the re-fold replays the log from placement onward, so priors re-materialise at the same seq points from the same re-folded bases). (iv) Virtual priors for siblings with n = 0 do change at the next epoch open to include today's θ evidence. That is the intended borrowing (one count, into a skill that has no evidence of its own), not a double count. (v) `capByPrereqs` reads `min pL_prereq + 0.15` from KT, so θ never reads pL, but a virtual prior may. That is a one-way read and is allowed.

**(d) Borrowing ρ, Glicko inflation, drift, and in-lesson updates (epochs).**
```ts
export interface EpochBase { epochId: string; openedAt: string; strands: Strand[];   // canonical order = sorted strand ids
  m: Float64Array; S: Float64Array /* joint Normal over a subject's strands, ≤ 4×4 */ }
export interface EpochAbility { base: EpochBase; ll: Record<Strand, Float32Array /* 281-pt Σ w·log L */>; seen: Set<string>; nObs: Record<Strand, number> }

// OPEN (lazily, at the first turn of a session; idempotent per (child, subject, sessionId))
function openEpoch(prev: EpochAbility, now: string, termDays: number): EpochAbility {
  const post = combine(prev);                                   // close the previous epoch (below)
  const days = daysBetween(prev.base.openedAt, now);
  const S = post.S.slice();
  for (const i of idx) S[i*n+i] = Math.min(S[i*n+i] + C_GLICKO ** 2 * days, SD0[i] ** 2);   // Glicko step 1, per strand, cap sd0
  const m = post.m.map((mu, i) => mu + DRIFT_GE_PER_DAY * termDays);                       // +0.08 GE/month, term days only [U]
  return { base: { epochId: newId(), openedAt: now, strands: post.strands, m, S }, ll: zeros(), seen: new Set(), nObs: zeros() };
}
// ADD (every θ-eligible event): exact, commutative
function add(e: EpochAbility, o: ThetaObs) { if (e.seen.has(o.evId)) return e;
  GRID.forEach((t, i) => { e.ll[o.strand][i] += o.w * Math.log(lik(t, o)); }); e.seen.add(o.evId); e.nObs[o.strand]++; return e; }
// COMBINE (on read and at close): per-strand Gaussian site from its own LL against the base MARGINAL, then exact Gaussian product
function combine(e: EpochAbility): { m: Float64Array; S: Float64Array } {
  let tau = new Float64Array(n), h = new Float64Array(n);
  e.base.strands.forEach((s, i) => {
    const prior = { mu: e.base.m[i], v: e.base.S[i*n+i] };
    const post = momentMatch(GRID, t => normalPdf(t, prior) * Math.exp(e.ll[s][idxOf(t)]));   // exact grid, then ADF to N
    tau[i] = Math.max(0, 1 / post.v - 1 / prior.v);                                           // site precision, clipped ≥ 0
    h[i]   = tau[i] === 0 ? 0 : post.mu / post.v - prior.mu / prior.v;
  });
  const P = inv(e.base.S); for (const i of idx) P[i*n+i] += tau[i];                   // Σ⁻¹ + diag(τ)
  const S = inv(P); const m = matVec(S, add(matVec(inv(e.base.S), e.base.m), h));     // standard Gaussian product
  return clampBorrow(e, { m, S });                                                    // OD R5 cap, below
}
```
- **ρ lives only in the base covariance.** At placement close, the base is built from each strand's *own-evidence* site (the placement posterior without the OD R5 shift, divided by its mixture prior's Normal fit, τ ≥ 0) combined with `Σ0[i][j] = ρ_ij·sd0_i·sd0_j` (ρ = 0.6 maths-maths, 0.4 maths-reading, 0 otherwise [U]). OD R5's `μ_B ← μ0_B + ρ·(μ_A − μ0_A)` is the limiting case of this conditional when A is known exactly. The Gaussian form also shrinks the borrowed shift by A's remaining uncertainty and by B's own evidence, so borrowing fades as B accumulates its own events. Borrowing is never applied as a second, stored mean shift; it is recomputed from the covariance on every read.
- **Cap (until M-OD-4):** `clampBorrow` limits `|E[θ_B | all] − E[θ_B | base_B, site_B only]| ≤ 0.5 GE` per epoch. The clamped mean is what is read and what is absorbed at close.
- **Inflation and drift run only in `openEpoch`**, with real elapsed days. Nothing inflates inside a session; `SessionClose` only marks the epoch closable, and the §7 "inflate" cell means this. Because `S` is a joint covariance, inflating the diagonal also lowers the cross-strand correlation after long gaps, which is right: after a summer, maths-A no longer says as much about maths-B as it did.
- **Order-freedom.** Within an epoch the posterior depends on the *multiset* of `ThetaObs` (log-likelihood sums commute; `combine` is a closed-form product over a canonically sorted strand list). Across epochs it depends only on the per-epoch multisets and the open timestamps. Persisted: `kt_ability_epoch` (base m, S, epochId, openedAt) plus the marginal `kt_ability` rows (written by the same writer, for the brief and parent views). In-epoch `ll` is not persisted; on resume it is rebuilt by replaying that session's θ-eligible events (tens of events at most, < 1 ms).
- **Fluency (T1/T2) Elo priors** read θ the same way (base only, TH2).

**Reversal summary.** TH1-TH4 above; and if real-child K4 refits show the in-lesson θ moving by more than 0.3 GE per session on average with no change on the next session's cold items, lower THETA_STRAND_CAP from 6 to 4 before changing anything else.

### 6.4 Need: what the child needs from Taxila now

**Purpose.** Which topics this week, how much foundation vs school track, and whether an assessment window applies. Need is *facts*, not inference about the child.

```ts
// shared/need.ts (from NG §4.1, with the review fixes)
export interface NeedModel {
  childId: string; classLevel: ClassLevel; board: 'CBSE'|'RBSE'|'ICSE'|'state'|'other'; medium: 'hindi'|'english'|'other';
  books: BookRef[]; pace: SyllabusPace[]; events: AssessmentEvent[]; homework: HomeworkItem[];
  placements: StrandPosterior[];                         // §6.3
  goals: Goal[];                                         // parent goals: pick-list only (no free-text note, NG R2.6)
  constraint: StudyConstraint;                           // renamed from `constraint` (reserved word, NG R4.10)
  probeRequests: { skillId: SkillId; reason: 'parent_belief'|'photo_mark'|'photo_error'|'child_said'; at: string }[];
  version: number;                                       // compare-and-swap on write (NG R4.3)
}
export interface SyllabusPace { subject: Subject; book: BookRef; nTopics: number; taught: Set<number>;   // out-of-order teaching (NG R4.1)
  p: number; v: number; P: [number, number, number, number]; at: string; lastObs?: { source: NeedSource; at: string } }
```

**Update rules.**
- **Pace filter (per subject; constant velocity in school-weeks).** Predict first (NG R4.2): `p ← p + v·Δw; P ← F P Fᵀ + Q(Δw)`, Q = diag(0.25, 0.01)·Δw [U]. Observation y (topic index) with variance σ²(source) from the reliability matrix (NG §3.2 [U]). Gate only low-reliability sources (handwritten, printed page, diary, child-said): if `(y − p)²/S > 9` hold as revision; two agreeing outliers re-initialise. **Hard re-initialise, no gate,** on parent onboarding, parent one-tap and confirmed datesheet (NG R4.1). Keep P symmetric, clamp P₀₀ ≥ 0.25.
- **Staleness:** three weeks with chapter confidence < 0.6 drop the school-track weight to 0.3 and queue one parent check-in (NG R6).
- **Assessment urgency:** linear ramp `u(d) = clamp((14 − d)/14, 0, 1)` for confirmed events with weight wKind ≥ 0.6; unconfirmed datesheet dates ≤ 7 days out give a soft window with weight ≤ 0.5·wKind and no urgency language (NG R3.5, R4.6). Test: scope retrieval share ≥ 0.3 at d = 14 for classes 5-9.
- **Exam-window mode:** classes 5-9 only by default (§1 X12); exam share ≤ 0.5; spaced, interleaved retrieval over the confirmed scope weighted by (1 − readiness). Day counts never reach the child or the model; the brief carries buckets {this week, next week, in 2-3 weeks, later}.
- **Two-track planner:** foundation share `= clamp(0.2 + 0.15·gap, 0.2, 0.7)` per prerequisite strand, halved in exam mode, floor 0.5 if the parent's top goal is `catch_up_basics`; prerequisite-first is hard (minutes allocated in (prerequisite, target) pairs; depth-3 test); homework ≤ 40% of a session [U, NG R3.2]; ≥ 1 retrieval item every session. Every score term in the planner is normalised to [0, 1] (NG R4.9).
- **Parent claims about level** become `probeRequests` only (LM15). Parent check-in handlers cannot import the KT writer (lint, NG N4).
- **Homework photos:** on-device face detection and EXIF/GPS strip before upload; streamed in memory to gpt-5.6 vision; deleted in `finally`; Blob soft-delete and versioning off; 5-minute sweeper as backstop (NG R2.4-2.5). Extracted dates need a parent-gated one-tap confirm (PIN/OTP token, NG R1.6) shown as weekday + date. Handwriting and red-pen marks become probe requests, never evidence (FERMAT GPT-4o error detection 0.65 balanced accuracy [V via NG]). Azure OpenAI abuse-monitoring retention is disclosed or modified-monitoring is applied [U: verify] (NG R2.3).
- **Goals:** child goals are proximal (this or the next lesson for classes 1-4; ≤ 3 days classes 5-6; ≤ 7 days classes 7-9; NG R3.3) chosen from 2-3 options; if-then plans for classes 7-9 only. Aspiration is child-stated and stored only as tier-B memory; never changes difficulty; gender is never a planner input (an analytics-only table holds it for the parity audit, NG R1.5).

### 6.5 LearningProfile: how to teach this child (format, guidance, independence)

Three parts, all code: **(a)** the per-turn pedagogy decision (PZ), **(b)** format allocation (LS §8.4), **(c)** independence: support fading and solo rounds (SR).

**(a) Pedagogy decision (`server/director/pedagogy.js`, pure, versioned table, PZ §3.2 with review fixes).**
```ts
export type ErrorClass = 'correct_explained'|'correct_unexplained'|'correct_flawed_suspect'|'slip'|'misconception'
  |'procedural'|'idk'|'no_attempt'|'gaming'|'off_task'|'low_asr';
export interface StepState { skillId: SkillId; itemKey: string; pKnownBand: 'low'|'mid'|'high' /* <.35 | .35-.70 | >.70 */;
  b3: Band3; errorClass: ErrorClass; misconceptionId?: MisconceptionId; rung: 0|1|2|3|4; qStreak: number;
  turnsOnStep: number; strained: boolean; strainTellsThisLesson: number; newSkillFirstItem: boolean;
  helpRequested: boolean; isomorphAvailable: boolean; safetyFired: boolean }
export interface PedagogyDecision { strategy: Strategy; move: MoveKind; rung: 0|1|2|3|4; ceiling: 0|1|2|3|4;
  thenIsomorphic: boolean; attrs: PedAttr[]; mrt?: { factor: string; arm: string; p: number } }
```
Order of rules: (0) `safetyFired` → `safeguard`, no MRT (PZ15). (1) `low_asr` → re-ask once or offer tap; does not count toward `qStreak`. (2) `gaming`/`off_task` → change task. (3) correct answers: explained → affirm specifically; unexplained → `ask_why` on new concepts and 30-50% on consolidating skills (LS §7.2 rule 5); `correct_flawed_suspect` → verify, never a verdict. (4) **Misconceptions always go to kit remediation** (contrast case, then alternate representation) and are never randomised (PZ review A4). (5) Socratic budget: `qStreak ≥ QMAX[b3]` (A 2, B 3, C 4) or `turnsOnStep ≥ TMAX` (6/8/10) or `strained` → `tell_then_try` at rung ≥ 3, then an isomorphic item; a strain-triggered tell at most once per 3 items and only after the previous isomorph was answered unaided (PZ review B12). (6) Entry rung by prior knowledge: low band + new skill → worked step (rung 3); mid band → pump or hint (the only MRT-eligible branch, M2+/P4 only); high → pump. (7) A new correct sub-step does not escalate the rung (PZ review E38).

*(gap-fill G2-floor8-permutation-untestable)* Rule (3) is evaluated before rule (5) and `strained` is not an input to it: the probe kind and the probe draw come only from `probeFor(skill, outcomeHistory, skillState, b3, draw)` (§13.1), so strain can cause a tell after failures but can never cancel, defer or retype a verification probe after a correct answer. Randomised probe choices (the 30-50% consolidating `ask_why`) use the counter-based draw `draw = u01(hash(lessonSeed, 'probe', skillId, opportunityIdx))`, never the shared `lesson.rng`, so a humour pick or a verifying move consuming a draw cannot shift the probe stream.

**Rung-gated context** (PZ §3.5): the realtime context holds support only up to the ceiling; the answer appears only at ceiling 4. Because a capable model can solve the item without the key (PZ review E31), the post-turn transcript scan (numerals, Hindi number words including irregular forms, fractions, units, Devanagari digits) marks the item `contaminated` (evidence weight 0, isomorph replaces it); in voice this is detection after the fact, which is why the ceiling exists upstream. Whether per-turn gating fits the voice budget (`create_response: false` → classify → `session.update` → `response.create`) is measurement PZM1b; fallback is the post-hoc guard plus the withholding attribute.

**(b) Format allocation (population-level in M1).** Format families F1-F8 and topic types T1-T5 as in `shared/contracts.ts`. Hard constraints first: expertise-reversal gate (low prior → F2 worked/faded example; F8 attempt-first only at mid/high prior and classes 7-9 for new concepts, SR-D13 with review R19), F5 chant only for T1/T2, retrieval and spacing never bandit arms. Among eligible formats: Thompson sampling on the *population* posterior `logit P(y_delay) = d_skill + β[format, topicType, b3]` with a ≥ 20% uniform exploration floor (LS §8.4; Rafferty 2019 [S]); when the top two are within 0.1, offer the child the choice (2 options + teacher's pick). Per-child deviation `u[child, format, topicType]` exists only in M3 after the HTE gate (PZ §3.9) and E-PROFILE; it decays with a 90-day half-life toward 0. Parent wording before posterior ≥ 0.9 on ≥ 8 delayed comparisons: "still learning what works best for ⟨topic type⟩" (LS §8.4).

**(c) Independence (SR §3, with review fixes).**
```ts
export type F = 0|1|2|3|4|5;     // OWN · SOLO · ON-CALL · GUIDE · SHARE · MODEL (per child × skill)
export type P = 0|1|2|3;         // NONE · WAIT · CUE · EXPLICIT (per child × SRL move: plan, check, locate, confAction, explain, selfTalk)
export interface FadeState { level: F; indepStreak: number; failStreak: number }
```
- **Entry:** new concept → F5 (classes 1-6) or F4 (7-9); otherwise by pL: < .3 → F5, < .6 → F3, < .85 → F2, else F1; a first-step probe moves one level.
- **Contingent shift:** C3/C4 → one level more support; fade one level only on **C0** (not C1; SR review R23) after K_DOWN successes {F5:1, F4:2, F3:2, F2:1, F1:2}; never more than one level past what pL supports; `failStreak ≥ 3` at F ≥ 3 → remediation via the weakest prerequisite. F0 needs an observable self-check (§1 X13).
- **Frequent help stays general:** at F ≥ 3, hints capped at Wood level W2 until the second failure on the step, released at the first IMPASSE suspicion; classes 1-2 exempt (SR review R18).
- **SRL prompts:** level-aware evidence rule (SR review R22 deadlock fix): every 5th opportunity probes down to level ≤ 1 directly (not one level), so P3/P2 can accumulate countable observations; fade at Beta(1,1) mean ≥ .6 over ≥ 8 countable opportunities; revive on recent < .3 or a ≥ 15 pp solo drop. Until the move detectors pass SR-M8/R25 (κ ≥ .7, precision ≥ .8 per band), prompt levels fade by time-in-level with a conservative cap, and the brief says so.
- **Solo rounds:** 2 (classes 1-2) or 3 per session; at least one delayed twin from the review schedule (the dependency instrument uses delayed items only; SR review R11); 20% of solo items are drawn across the difficulty range for measurement, the rest at predicted P ∈ [.6, .9] for efficacy (R12); declining is allowed and logged as censored; **an explicit child help request ends the solo round** and is answered within one turn (R4); safety pre-empts (R3).
- **Wait:** nudge delay `min(cap, base·(1 + 0.25·indepStarts))`, base 6/5/4/4 s by B4 band, cap 8 s (B1-B2) / 6 s (B3-B4), non-hint presence cue at ~3 s, heartbeat-separated from disconnects; per-child base adjustable by parent accommodation (R5).
- **CHECK is locate-don't-fix** (SR-D15). **CATCH-ME planted slips ship OFF** until SR-M7 ethics review; the substitute is honest uncertainty ("check my step with a method") (SR review R6).
- **CRI (crutch risk)** is computed inside the session only in M1: need-adjusted pre-attempt help, expedient-request share (Beta(1,3) shrinkage), voice-native rapid-next-hint (replaces dwell-based `click`, R16), wait-rescue. It changes the move schedule (TRY-FIRST, KIND-OF-HELP, +1 efficacy-safe solo round), never the words, never a label (SR-D10). Its persisted, need-adjusted form is M2/M3 with an absolute frozen reference (R15) and quantile-transformed features (R17).
- **TOH release gate** (policy-level; no child data): tutor step share, Telling@k, help-before-wait, solo success vs baseline, equity by prior-knowledge tercile (SR §5.6) — run by `STUDENT-SIM.md` battery G5.
  - *(gap-fill G3-sim-no-assistance-cost)* That gate can fail for its real reason (LM11, Bastani −17% unaided) only because simulator truth now charges for help. `STUDENT-SIM.md` §4.4a splits each skill into assisted and unaided components. Tutor-sourced gains, including cued-slot fills, reach the unaided component only at `(1 − h)^κ · (1 − 0.6·σ(1.5δ))`, where h is the episode's tutor step share and δ is drawn independently of ability, as in the SR depsim.
  - Child generation earns full gain.
  - TOH-5 splits into 5a (inflation) and 5b (truth `P_u` on delayed solo twins and the assist gap).
  - The `over-helper` control must fail 5b in all 6 family × gain-table cells, or the run is invalid (§11.2). H2f unit-tests the gap.
  - The fade controller (§6.5c) is therefore tested against a child whose unaided learning really does depend on fading.

### 6.6 Vibe: how she talks to this child

**Definition.** Fit between the teacher's style and this child's responses (Thomas & Chess goodness of fit [S via VT]); never a temperament or personality label (legitimacy tests L1-L5, VT §2).

**v1 knobs (VT review R5.36):** `waitNudgeSec`, `endpointSilenceMs` (abstract knob; adapters for server_vad silence_duration_ms and semantic_vad eagerness, confirmed on Azure GA before use), `teacherTurnWords` (soft target with measured compliance; house data 64 → 25 words/turn only when brevity is structural, `realtime-teacher-bakeoff-2026-10-02`), `humourDose ∈ {off, light}` (items from the reviewed asset bank, by asset id), `address` (closed set {didi, ma'am, miss, sir, bhaiya, teacher, name}; teacher calls child name or name+beta for classes 1-6; the teacher uses tum, never tu), and `energy ∈ {calm, warm}` (never flat; strained → calm). Deferred: dare, per-child errorFrame switching, slangEcho, humourKinds beyond silly/riddle, praiseRate sparse (default regular for all), speechRate (explicit only, after the API exposes speed).

```ts
export type VibeMode = 'explicit_only'|'session_adaptive'|'persisted_adaptive';   // M1 → explicit_only + session safety moves
export interface ExplicitPref { knob: 'address'|'humourDose'|'waitNudgeSec'|'teacherTurnWords'|'speechRate';
  value: string /* closed vocabulary per knob */; provenance: 'child_said'|'parent_set';
  evidenceCode: string /* templated canonical string, never the verbatim utterance (VT review) */; saidAt: string; revokedAt?: string }
export interface VibeDirective { waitNudgeSec: number; endpointSilenceMs: number; turnWords: [number, number];
  humour: 'off'|'light'; address: { childCallsTeacher: string; teacherCallsChild: 'name'|'name+beta' }; energy: 'calm'|'warm' }
```
- **Precedence (VT review fix):** invariants and safety → **strain suppression** → explicit (parent ceiling, then child within it) → session state → slow knobs (M3) → class-band defaults. For classes 1-6 the parent setting is a ceiling with a direction-limited allow-list (gentler only).
- **A child's request to remove something is honoured immediately;** a request to add is honoured within the band ceiling after a one-turn confirmation (shared phone; no speaker verification, which would be biometric).
- **Session adaptation (in memory):** strained → humour off, energy calm, ramp long; humour never within 2 turns of an error, never about the child; ≤ 1 light humour item per 10 min and ≤ 2 per lesson.
- **Slow knobs (M3 only):** Beta arms with prior strength 4, 60-day half-life decay to the band prior, ≤ 3 updates per arm per session, advance only after ≥ 2 sessions on ≥ 2 distinct days with posterior > 0.9, ≤ 1 non-explicit advance per session, `N_FLOOR = 8`, null-simulation of the spurious move rate before ship (VT review R4). Talk volume, latency, volunteering and question-asking never enter KT (Hughes & Coplan 2010: shyness lowered teacher ratings, not test scores [V via VT]).
- **Distress lexicon belongs to the safety gate,** which pre-empts vibe (VT review).

### 6.7 Motivation and engagement (session layer, never persisted)

**Signal layer (DA).** `TurnEvent` per child turn (DA §3.1): transcript, ASR confidence, script mix, played-frame-aligned onset latency (client end-of-playback → first `speech_started`, barge-ins excluded, RTT > 400 ms discarded), words, act labels. Normalised features: robust z in the log domain per child × item class × modality, shrunk to the band prior (κ = 5), against a session baseline from the first 3 engaged items (DA DA3). **Voice timing weights are halved** relative to keyboard ITS literature (DA review R23); `asrConf` may not be exposed by the realtime path, so proxies (words/sec, repeated-token ratio, script mix) stand in [U] (R24).

**Labeller contract.** Closed set (≤ 8 acts at launch, DA review R27): `ATTEMPT`, `HEDGED_ATTEMPT`, `IDK`, `CLARIFY_Q`, `ANSWER_REQUEST`, `OFF_TASK`, `META` (break/stop/slow/repeat), `AFFECT_SELF`; plus `addressesQuestion: boolean` and `taskValence ∈ {neutral, ease, hard, bored}` (R26). Two samples must agree; per label × band × language mix: κ (lower 95% CI) < 0.60 never fires; 0.60-0.80 folded through sensitivity/specificity; ≥ 0.80 used unfolded. Acts never update mastery.

**Detectors (rules, DA §5, with review fixes):** GAME (patterns G1-G6 over the last 8 items, threshold calibrated to ≤ 1 false suspicion per 3 sessions, each pattern counted once, item-aware MCQ repeats; log-only if measured base rate < 3% of items, R34); IMPASSE (2 questioning moves with no progress → next move addresses the error; configurable default, not an invariant, until DA-M6 on children, R14); SPIN (6 warn / 10 confirm); CONFUSION as a clock (2 hint steps or 90 s; 30 s in classes 1-3, with cheap moves from the start, R15); FRUSTRATION (goal-blockage indicators, Mindspark-style; Rajendran 2019 [S via DA]); DRIFT (7 indicators incl. accuracy drop vs KT expectation on easy items; session-position prior after 10 graded items or 12 min, DA9). **DISTRESS is not a detector here:** it is the safety gate (R3).

**Arbiter → engagement state.**
```ts
export type EngagementState = 'warming'|'engaged'|'strained'|'disengaging'|'stopped';
export interface EngagementSession { b3: Band3; turn: number; state: EngagementState; pataNahiRun: number; withdrawals: number;
  suspicions: { kind: 'GAME'|'IMPASSE'|'FRUSTRATION'|'DRIFT'; at: number; pending: boolean; expiresAt: number }[];
  lastVerifyTurn: number /* init −∞ */; verifiesIn10min: number; easyRun: number; strainTells: number }
```
- A detector raises a suspicion; a suspicion buys at most one **verifying move** from an allow-list that is useful under every hypothesis (two-way choice "harder / different way / teacher's pick", name the task's difficulty, smaller step, a check-question on on-screen parts). Only question-type verifying moves count against the budget (≤ 1 per 4 child turns, ≤ 3 per 10 min, never two in a row, none in the first 3 turns); soothing moves are unbudgeted (DA R4).
- Suspicions expire after 6 turns unresolved; a confirmed state expires after 8 turns or on disconfirming evidence (DA R20 bug list).
- **Costly moves** (difficulty change, prerequisite detour, break offer, ending) need the child's explicit pick or a confirmed state with posterior odds above τ = C_FA/(C_FA + C_miss): change representation .35, lower difficulty .50, prerequisite .60, break or close-win .70 (DA §6). For boredom and frustration, verification alone does not unlock a costly move; the child's pick does (DA R10).
- **Child-initiated META** (break, stop, slow down, repeat) is honoured the same turn and is never a suspicion (DA R5). Exit intent → `stopped` within one teacher turn, ending on a success; never "one more?".
- **State mapping:** `strained` ← pataNahiRun ≥ 3, or 2 withdrawals, or a confirmed FRUSTRATION, or IMPASSE confirmed twice; `disengaging` ← confirmed DRIFT or GAME; back to `engaged` on an unaided correct attempt or a child-chosen option taken up.
- **Easy-run cap:** ≤ 6 consecutive easy-band turns, then a fresh diagnostic choice or a prerequisite probe; easy-band outcomes carry `controllerEasy` (KT rule 4) (MI R7.47).
- **Challenge bands (target P(success) per state) [U, MM4]:** warming/strained .85-.95; engaged .70-.85; under-challenged (child picked harder) .50-.70 or test-out (three constructed-response items plus a spaced re-check before any permanent skip, MI R4.37).
- *(gap-fill G2-floor8-permutation-untestable)* Challenge bands, costly moves (difficulty change, prerequisite detour) and strain tells are the **only** engagement → KT paths, and all three act through *which episodes occur*, never through how an episode is scored. They are covered by the bounded test B-ENG (§13.1), not by the byte-identical isolation test. Every selected item records `pSuccessAtSelection` and `selectedBy ∈ {plan, band, costly_move, easy_cap, review}` so the bounded test can attribute differences.
- **Motivation moves (MI §3, shapes):** competence-first; teacher's pick in every offer; every offered option executable; praise skill-specific and KT-backed ("then → now" only when the child's own history shows a gain, MI R1.8); no normative comparison or performance-avoidance framing; never name an inferred state, but mirroring the child's *stated* feeling is required (MI R2.11). Utility-value telling only for classes 8-9 after elicitation fails (MI R1.1). Curiosity gaps sized to KT pSuccess .3-.6, suppressed when strained, closed in-session.
- **Return without rewards:** a child-chosen next-time thread (the child's own spontaneous question only, ≤ 1, expires in 14 days, stored as tier-A `open_thread`), a capability statement, parent-set routine slots, fresh-start re-entry with no mention of missed days. Banned list as MI §5 (streaks, points, mystery boxes, child pushes, countdowns, guilt through parents).

### 6.8 Memory (TeacherMemory): the shared history

```ts
export type MemKind = 'learning_moment'|'commitment'|'open_thread'            // tier A (M1, P2)
                    | 'interest'|'favourite'|'preference'                      // tier B (P3 + counsel)
                    | 'person'|'upcoming'|'joke';                              // tier C (not built)
export type Sensitivity = 'S0'|'S1'|'S2'|'S3';   // store · store pull-only · never store · safety incident path
export interface MemItem { id: string; childId: string; kind: MemKind; slot?: string /* one active per slot */;
  body: string /* closed vocabulary for A/B except open_thread ≤ 120 chars, classified before storing */;
  cite: { lessonId: string; turnIdx: number[]; quote?: string /* ≤ 12 words, kept only while the transcript exists */ };
  sensitivity: 'S0'|'S1'; tValid: string; tInvalid?: string; supersededBy?: string; lastSaidAt: string;
  timesRaised: number; lastRaisedSession?: number; source: 'child_said'|'parent_added'|'shared_work' }
```
- **Write path (after the lesson, never on the reply path):** the LLM proposes ADD/UPDATE/SUPERSEDE/NOOP with cited child-turn indices; code validates: quote is a transliteration-aware substring of a cited child turn; content words came from the child, not the teacher; sensitivity classifier (Roman + Devanagari, negative controls) passes; no imperatives, second person or URLs in any kind (memory-injection defence, TM review); S2 has no write path; S3 goes to the safety incident path, never memory. A judge model audits a sample; refutation rate > 2% halts writes (TM §3.3).
- **Truth decay:** per-kind half-life since the child last said it; truth < 0.6 → only re-asked as a question; < 0.3 → withheld; < 0.1 or 12 months → deleted (TM). Accessibility ranking uses `pTrue × occasion × relevance`; activation retired unless TME shows it helps (TM review R6 TM5). Reinforcement only from a child re-mention or confirmation, or a parent confirmation; no response-based labels (`no_signal` dropped, TM review).
- **Callbacks:** ≤ 1 proactive callback per session, a 3-session cooldown per item, none in the first two sessions, none while strained, during repair, or in school mode. Occasions (a promise kept, a question answered) outrank everything. Banned: "missed you", absence guilt, "our secret", leverage, sibling comparison.
- **Claim check:** the teacher may only claim memories that appear in the brief or a `notebook_lookup` result; a two-layer post-hoc checker (marker lexicon + closed-set slot check) opens an incident and corrects next turn.
- **Forget:** the child's "bhool jao" hard-deletes before the reply renders, with suppression hashes (TTL); withdrawal of P2/P3 erases all memory rows in the same request; a per-store fate table covers Azure abuse-monitoring retention, Neon PITR/branch history and logs (TM review).
- **Current code bugs to fix** (TM §11): `source_turn` set to null leaves uncited rows; `superseded_by` never written; recall = 3 newest rows; ASCII-only SENSITIVE regex; consent withdrawal leaves rows; no parent per-item route; `vibeFrom()` infers behaviour across sessions from raw transcripts (violates NM-3, remove); `rel_state.trust` rises with attendance (remove; relationship stage = session count only).

### 6.9 Language

```ts
export interface LanguageSetting { parentTile: 'hi'|'hinglish'|'en'|'other'; teacherMix: { matrix: 'hi'|'en'; enInsertion: 'low'|'mid'|'high';
  terms: 'en_labels'|'medium_terms' } /* stored: derived from the tile + medium only */; receptiveEnCheck: 'ok'|'partial'|'no'|'untested' }
export interface LanguageSession { nUtt: number; enTokenRate: number; cmiMedian: number; pMatrixEn: { a: number; b: number } }  // in memory
```
- Stored setting = parent tile + school medium (LM16). In session: script-aware token language ID over ASR-confident child utterances, code-mixing index `Cu = 100·[0.5·(N − max t_L) + 0.5·P]/N` [V via OD], matrix-language rule (Hindi auxiliaries, postpositions, light verbs); estimates need ≥ 6 utterances or ≥ 40 tokens and must beat a rule baseline (OD R3). One receptive-English instruction check per child: a fail → no English-matrix teacher turns for the session.
- **Reply language follows the child's live mix,** `|cs_teacher − cs_child| ≤ 0.2` [U]; pedagogy directives are in English, but "reply language = child's" is a checked attribute (PZ review B15). Hindi verb agreement uses gender-neutral phrasing unless a grammar-only parameter is set by the parent; gender never enters feedback logic (PZ review C23).
- **Reading support** R0/R1/R2 (OD §6.1) is a UI setting from the reading ladder; the ASR path can raise a reading level, never lower it; tap confirmation precedes any promotion to story level; no auto-R0 after class 6 (OD review R3, R6).
- Hindi number-word normaliser (paintalees/paintis, saade teen, dhai, unnis…) is one module with a test table, shared by grading, the leak scan and the simulator (OD review R5).

---

## 7. Events, and which layer each one feeds

Every event is produced by code from the turn pipeline; the LLM contributes only closed-set labels inside `TurnEvent`.

| event (producer) | KT | Mis | Ability | Need | Profile/PP | Indep. | Vibe | Engagement | Memory | Language | persisted in M1? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `SafetyTrigger` (safety gate) | freeze | freeze | — | — | no MRT | ends solo/wait | suppress | → `strained`/hand-off | never | — | `incident` row only |
| `TurnEvent` (transcript, timing, acts) | via Evidence | via Evidence | — | child-said facts → probe req. | errorClass | CRI features | V-signals | detectors | candidates | mix estimate | no (TTL lesson rows) |
| `EvidenceEvent` item/probe (code or folded LLM) | **yes** | **yes** | θ only via `thetaObs` (§6.3.1): cold, first-attempt, unaided, code-graded items; probes never (gap-fill G1-theta-lesson-update) | readiness | `y_next`/`y_delay` | fade step | — | easy-run, DRIFT accuracy | learning_moment cite | — | yes |
| `EvidenceEvent` solo | yes | yes | θ via `thetaObs` if cold (§6.3.1) | — | — | **solo outcome** | — | — | — | — | yes |
| `TeachEvent` (worked example, explanation, animation) | transition only | — | — | — | format allocation | support level | — | — | — | — | yes (as `teach`) |
| `ModuleEvent` answer/goal_met/stuck | yes if graded by code | yes | as item.open via `thetaObs` if code-graded with b (§6.3.1) | — | — | step author | — | GAME/IMPASSE | — | — | outcome only |
| `PlacementItem` (onboarding/JIT) | prior | probe req. | **yes** | gap-to-grade | — | entry level | explicit picks | — | — | reading, receptive EN | yes |
| `NeedObservation` (parent, photo, datesheet) | — | — | — | **yes** | — | — | — | — | — | — | yes (facts) |
| `ParentBelief` | probe request | — | — | probe request | — | — | — | — | — | — | M2+ |
| `ExplicitPref` (child said / parent set) | — | — | — | — | — | — | **yes** | — | tier-B preference (M2+) | tile | yes (closed values) |
| `ChildChoice` (diagnostic pick, offer taken) | — | — | — | goal pick | format choice | — | — | **strong evidence** | open_thread if own question | — | no |
| `SessionClose` | params fold | — | epoch closable; inflation + drift at next `openEpoch` (§6.3.1d) | staleness | episode credit | fade persist | M3 aggregates | discard | consolidation | discard | as per mode |

---

## 8. Storage (Neon Postgres; `db/migrations/003_learner.sql`, consolidated)

Conventions: every table has `child_id uuid not null references child(id) on delete cascade`; every persisted row has `legal_mode_at_write`, `purpose` (P1-P5) and, where data is not academic record, `expires_at`; one writer module (`server/learner/writer.js`) owns every insert/update and calls `assertWritable` (§4); every writer asserts its row count (inherited "dead writers" rejection, already in `model.js`).

```sql
-- Knowledge (event-sourced; replaces evidence/skill_state of 001_core over a migration that re-folds them)
create table kt_evidence (
  seq bigint generated always as identity primary key,       -- the order key (server-assigned)
  id uuid unique not null, child_id uuid not null references child(id) on delete cascade,
  session_id uuid not null, episode_id uuid not null, occurred_at timestamptz not null,
  skill_ids text[] not null check (cardinality(skill_ids) between 1 and 3),
  cls text not null, outcome smallint not null, grader text not null check (grader in ('code','llm','human')),
  grader_version text not null, item_key text not null, teach boolean not null default false,
  assisted text check (assisted in ('parent','sibling')), controller_easy boolean not null default false,
  gaming_window boolean not null default false, params_version text not null,
  purpose text not null default 'P2', legal_mode_at_write text not null);
-- no latency, asr_conf or timing columns: ASR-dropped events are never written (they are counted in metric_daily by cohort)
create index kt_evidence_child_seq on kt_evidence (child_id, seq);
create table kt_skill_state (child_id uuid references child(id) on delete cascade, skill_id text,
  params_version text not null, p_l real not null check (p_l between 0 and 1), retention real not null,
  mem jsonb, n int not null, flags jsonb not null, recent smallint[] not null default '{}',
  opp int not null default 0, run int not null default 0, display text not null, refresh boolean not null,
  next_review_at timestamptz, updated_at timestamptz not null, primary key (child_id, skill_id));
create table kt_misconception (child_id uuid references child(id) on delete cascade, misconception_id text,
  logit real not null, hits int not null default 0, last_at timestamptz, resolved_at timestamptz,
  check_scheduled_at timestamptz, primary key (child_id, misconception_id));
create table kt_ability (child_id uuid references child(id) on delete cascade, strand text, mu real not null, sd real not null,
  engine_version text not null, updated_at timestamptz not null, primary key (child_id, strand));
-- (gap-fill G1-theta-lesson-update) joint epoch base per subject (§6.3.1d); kt_ability stays the marginal view, same writer
create table kt_ability_epoch (child_id uuid references child(id) on delete cascade, subject text, epoch_id uuid not null,
  opened_at timestamptz not null, strands text[] not null /* sorted */, m real[] not null, s real[] not null /* row-major n×n */,
  engine_version text not null, primary key (child_id, subject));
-- kt_skill_state gains: prior_pl0 real, prior_epoch_id uuid, prior_seq bigint  (the frozen pL0 and where it was materialised, TH2)
create table kt_params (version text, scope text check (scope in ('cluster','skill','labeller','fsrs','item')), key text,
  params jsonb not null, n_children int, n_obs int, fitted_at timestamptz not null, primary key (version, scope, key));
create table kt_child (child_id uuid primary key references child(id) on delete cascade,   -- M2+ only (writer gate)
  eta real not null default 0, eta_n int not null default 0);

-- Placement (onboarding + JIT)
create table placement_run (id uuid primary key, child_id uuid not null references child(id) on delete cascade,
  kind text check (kind in ('intake','jit','relevel')), band4 text not null, minutes real, completed text,
  degraded boolean not null default false, engine_version text not null, bank_version text not null,
  consent_id uuid not null, app_version text not null, at timestamptz not null);
create table placement_item (run_id uuid references placement_run(id) on delete cascade, idx int, strand text, item_key text,
  answer_norm text,                                          -- normalised value ("47", "B"), never a transcript
  correct boolean, hint_depth smallint, independent boolean, scored boolean, unscored_reason text, primary key (run_id, idx));

-- Need (facts; academic record)
create table need_book (child_id uuid references child(id) on delete cascade, subject text, book_id text, map_by text, primary key (child_id, subject));
create table need_pace (child_id uuid references child(id) on delete cascade, subject text, n_topics int, taught int[] not null default '{}',
  p real, v real, cov real[4], at timestamptz, version int not null default 0, primary key (child_id, subject));
create table need_event (id uuid primary key, child_id uuid not null references child(id) on delete cascade, kind text, subjects text[],
  win_start date, win_end date, scope_topic_ids text[], scope_conf real, source text, confirmed boolean not null default false,
  confirmed_by text check (confirmed_by in ('parent','school')), gate_token_id uuid, status text, result_said text, marks real, max_marks real);
create table need_homework (id uuid primary key, child_id uuid not null references child(id) on delete cascade, subject text,
  topic_ids text[], questions_text text[], due date, source text, status text, expires_at timestamptz not null);
create table need_goal (id uuid primary key, child_id uuid not null references child(id) on delete cascade, owner text, kind text,
  rank smallint, target jsonb, status text, created_at timestamptz);          -- no free-text note column
create table need_observation (id bigint generated always as identity primary key, child_id uuid not null references child(id) on delete cascade,
  source text not null, claim text not null, payload jsonb not null /* structured only */, changed jsonb, at timestamptz not null,
  expires_at timestamptz);                                    -- append-only until TTL or erasure (NG R2.2)
create table need_probe_request (child_id uuid references child(id) on delete cascade, skill_id text, reason text, at timestamptz,
  served_at timestamptz, primary key (child_id, skill_id, reason));

-- Independence
create table vy_fade_state (child_id uuid references child(id) on delete cascade, skill_id text, level smallint check (level between 0 and 5),
  indep_streak smallint not null default 0, fail_streak smallint not null default 0, updated_at timestamptz not null,
  primary key (child_id, skill_id));                         -- learning state (with help / independent), NM-2
create table vy_prompt_fade (child_id uuid references child(id) on delete cascade, move text, level smallint check (level between 0 and 3),
  spont int not null default 0, missed int not null default 0, opps int not null default 0, updated_at timestamptz not null,
  primary key (child_id, move));                             -- M1: levels only; detector-gated (SR-M8)

-- Vibe (explicit, closed vocabulary)
create table vibe_explicit (child_id uuid references child(id) on delete cascade, knob text, value text not null,
  provenance text check (provenance in ('child_said','parent_set')), evidence_code text not null, said_at timestamptz not null,
  revoked_at timestamptz, primary key (child_id, knob, provenance));

-- Memory (tier A in M1)
create table tm_item (id uuid primary key, child_id uuid not null references child(id) on delete cascade, kind text not null,
  tier char(1) not null check (tier in ('A','B','C')), slot text, body text not null, sensitivity text check (sensitivity in ('S0','S1')),
  cite_lesson uuid not null, cite_turns int[] not null check (cardinality(cite_turns) >= 1), quote text,
  t_valid timestamptz not null, t_invalid timestamptz, superseded_by uuid references tm_item(id),
  last_said_at timestamptz not null, times_raised int not null default 0, last_raised_session int, source text not null);
create unique index tm_one_active_per_slot on tm_item (child_id, kind, slot) where t_invalid is null and slot is not null;
create table tm_forget (child_id uuid, tuple_hash bytea, expires_at timestamptz not null, primary key (child_id, tuple_hash));

-- Language and accommodations (settings, never labels)
create table learner_setting (child_id uuid primary key references child(id) on delete cascade, parent_tile text,
  teacher_mix jsonb, reading_support text, receptive_en text,
  accommodations text[] not null default '{}' check (accommodations <@ array['more_wait','larger_text','read_aloud','tap_only','slower_speech']),
  register_band_shift smallint not null default 0 check (register_band_shift in (-1, 0)));

-- Mode, consent, audit, research
create table learner_mode_audit (id bigint generated always as identity primary key, child_id uuid not null, from_mode text, to_mode text,
  reason text, actor text, at timestamptz not null);
create table research_log (id bigint generated always as identity primary key, pseudo_id bytea not null,   -- P4 only, no child_id join key
  kind text, payload jsonb not null, expires_at timestamptz not null default now() + interval '30 days');
create table directive_log (lesson_id uuid, turn int, directive_hash text, knobs jsonb, policy_version text,
  primary key (lesson_id, turn));                            -- the compiled settings a child received (VT R8.60); no child text
-- M3-only tables (vibe_slow, vibe_session_agg, interest_record, value_arms, vy_dep_window, pz_knob_posterior.child_id rows)
-- are created only when LEARNER_M3_TABLES=1; their DDL is in 003b_learner_m3.sql with expires_at not null.
```
- **Erasure test:** `delete from child where id = $1` leaves zero rows in every learner table and in `kt_params` contributions is handled by refit (pooled parameters keep no child id). Crypto-shred of the child's DEK must not live in the PITR'd project (context rejection `dek-in-pitr-database`).
- **TTL sweeper** (ACA job, hourly): deletes `expires_at < now()` across tables; tests on a frozen clock.
- **Retention defaults [U]:** academic record (KT, misconception, placement, need facts, fade, explicit vibe, tier-A memory) while the account is active and P2 holds; `need_homework` 60 d after due; `need_observation` payload 180 d; research_log 30 d; lesson TTL rows (session state, transcripts per dpdp-deep) per the transcript retention decision.

---

## 9. What the realtime voice teacher sees

### 9.1 The CHILD brief (≤ 600 tokens, key=value rows, rendered by code)

Rules: telegraphic `KEY value · value` rows; no first person; no sentences she could read out; no ability labels (`ABILITY_LABELS` fence plus "solid/shaky"-style state words only); no internal ids (skill titles in the child's language instead); no day counts, levels, GE numbers, class gaps or percentages; a row that fails a check is **dropped, never rewritten** (`cleanRows`). The estimator is `ceil(chars/3.5)` (existing `estimateTokens`); the cap is checked on the rendered string *including* Devanagari titles, so Hindi-script titles count at their real length [U: replace the estimator with the deployment tokenizer once pinned].

| row | content (from layer) | budget (tokens) | drop order (lower first; ∅ never) |
|---|---|---|---|
| `CHILD` | first name · class · B4 band · address both ways · sessions together (count only) | 30 | ∅ |
| `LANG` | matrix · English insertion · term style · "reply in child's mix" | 25 | ∅ |
| `READ` | support R0/R1/R2 · read prompts aloud yes/no | 15 | ∅ |
| `ACCOM` | parent-set accommodations | 15 | ∅ |
| `TODAY` | topic title · track split (foundation/school) | 25 | ∅ |
| `SKILLS solid` | ≤ 3 titles with `retention ≥ .8`, refresh marks | 40 | 6 |
| `SKILLS learning` | ≤ 3 titles · entry support (worked step / hint first) | 45 | 7 |
| `PREREQ` | ≤ 1 weakest-prerequisite title if pL < .5 | 20 | 8 |
| `WATCH` | ≤ 2 misconception *beliefs* (kit text), "verify before naming", seen-count | 50 | 9 |
| `REVIEW` | 2-4 warm-up titles, "no warning" | 35 | 5 |
| `NEED` | school chapter title · window kind + bucket · scope chapters | 40 | 4 |
| `GOAL` | the child's chosen proximal goal (pick-list text) | 20 | 3 |
| `INTEREST` | ≤ 2 tags for validated contexts only (tier B; absent in M1 unless P3) | 15 | 2 |
| `SUPPORT` | fade level shape for today's skill (model/share/guide/on-call/solo) · solo rounds n · nudge s | 30 | ∅ |
| `NOTEBOOK` | ≤ 1 opener (occasion first) + ≤ 2 tier-A items, "one callback at most" | 120 | 1 |
| `SESSION` | cap minutes · "stop on exit intent" · school mode yes/no | 15 | ∅ |
| **total** | | **≤ 580** | |

```js
// server/learner/brief.js (extends the existing renderer; same drop-not-rewrite contract)
export const BRIEF_TOKEN_CAP = 600;
export function renderChildBrief(v /* DirectorView */) {
  const rows = [
    row('CHILD', [v.child.firstName, `class ${v.child.classLevel}`, v.bands.b4, `calls you ${v.vibe.address.childCallsTeacher}`,
                  `call ${v.vibe.address.teacherCallsChild === 'name+beta' ? 'name or beta' : 'name'}`, `sessions ${v.rel.sessions}`], null),
    row('LANG', [`matrix ${v.lang.teacherMix.matrix}`, `english ${v.lang.teacherMix.enInsertion}`, v.lang.teacherMix.terms === 'en_labels' ? 'terms english' : 'terms school-medium', 'reply in child mix'], null),
    // … one row() per table entry above; row() returns null when its source is empty (0 bytes) or fails cleanRows
  ].filter(Boolean);
  return fitByDropOrder(['CHILD-BRIEF', ...rows], BRIEF_TOKEN_CAP);   // throws if the ∅ rows alone exceed the cap
}
```
Worst-case size (computed this session on a 17-row filled example with Roman-script titles): 1,086 chars ≈ 311 estimated tokens, leaving headroom for Devanagari titles and the NOTEBOOK row. G1 asserts the cap on a 2× fixture.

Example of the **format** (keys and values only; content invented, Roman script):
```
CHILD-BRIEF
CHILD Tara · class 4 · B2 · calls you didi · call name or beta · sessions 14
LANG matrix hi · english mid · terms english · reply in child mix
READ support R1 · prompts aloud yes
TODAY Comparing fractions · foundation 30 school 70
SKILLS solid halves and quarters · equivalent fractions (refresh)
SKILLS learning comparing unlike fractions (entry worked step)
WATCH bigger denominator means bigger fraction · seen 2 · verify before naming
REVIEW place value to 1000 · multiply by 10 · no warning
NEED school Fractions ch 5 · window unit test next week · scope ch 4-5
SUPPORT on-call silent until asked · solo rounds 3 · nudge 6 s
NOTEBOOK opener: last time she asked why pizza slices get smaller · one callback at most
SESSION cap 25 min · stop on exit intent
```

### 9.2 LESSON NOW (per turn, rung-gated)

Item prompt (child's language), the child's last answer verbatim, misconception id → kit belief and remediation *shape*, and support up to the current ceiling only (PZ §3.5 table). The answer and its one-line reason appear only at ceiling 4. Grading never needs the answer in the teacher's context: `classify.js` grades against the key in code.

### 9.3 Compile order and the tail (one `compile()` for every lane)

```
[PERSONA]                      fixed, byte-stable per teacher (cached)
[CHILD-BRIEF]                  §9.1, byte-stable for the session (cached; rebuilt only at session start or a mode ratchet)
[LESSON NOW]                   §9.2, per turn
── tail (appended last, in this order; each has a token budget and the G1 gate throws on overflow) ──
[VIBE]          ≤ 40 tok       one line: wait · endpoint · turn words · humour off|light:<asset id> · address · energy
[PEDAGOGY NOW]  ≤ 80 tok       PIF-style attributes for the code-chosen move (ONE_QUESTION, NO_ANSWER, MAX_WORDS n, ADDRESS_MISCONCEPTION, CONCRETE, CHILD_STATES_NEXT, TELL_BRIEF_THEN_TRY, LET_THEM_GO)
[SAFETY]        ≤ 60 tok       AI disclosure floor, no companion register, crisis routing pointer (full crisis set lives in the persona; this is the recency copy)
[TURN SHAPE]    ≤ 30 tok       last: one question max · words band · end on a question or a handover
```
Why this order: OE G1 requires the turn-shape rule last; "position is mechanism" (a rule buried mid-brief fired 0/8, the same rule last fired 8/8, inherited [H]) puts the rules that must fire at the end; VIBE is least safety-relevant so it is first in the tail. A safeguarding hand-off replaces PEDAGOGY NOW with `SAFEGUARD NOW` and sets `speakNow: "interrupt"`. The directive contains no name, gender or identity attribute: address is a separate slot in `CHILD`, so the counterfactual identity swap leaves `renderDirective()` byte-identical (PZ review A5).

---

## 10. What the Director sees

```ts
// shared/learner.ts — the Director's read-only view, assembled once per turn from layer modules (no DB reads inside policy code)
export interface DirectorView {
  child: { id: string; firstName: string; classLevel: ClassLevel; legalMode: 'M0'|'M1'|'M2'|'M3'; schoolMode: boolean };
  bands: (typeof BANDS)[ClassLevel];
  safety: { firedThisLesson: boolean; lastTrigger?: 'distress'|'disclosure'|'unsafe_adult'|'self_harm' };
  kt: KtView;                                         // §6.1; pSuccessNext uses retention, not pL
  mis: { active: { id: MisconceptionId; p: number; needsVerify: boolean }[] };
  need: { plan: SessionPlan; window?: { kind: AssessmentKind; bucket: 'this_week'|'next_week'|'2_3_weeks'|'later'; confirmed: boolean };
          homework?: HomeworkItem; probeRequests: SkillId[]; stale: boolean };
  placement: { provisional: boolean; startAt: Partial<Record<Strand, GE>>; jitItemsDue: number };
  pedagogy: { step: StepState; lastDecision?: PedagogyDecision };
  format: { eligible: FormatFamily[]; pick: FormatFamily; offerChoice?: [FormatFamily, FormatFamily] };
  independence: { fade: Record<SkillId, FadeState>; prompts: Record<SrlMove, P>; soloRoundsLeft: number; criOverlay: boolean; waitMs: number };
  engagement: EngagementSession;                      // §6.7; in memory
  vibe: VibeDirective;                                // §6.6
  memory: { opener?: MemItem; items: MemItem[]; lookupEnabled: boolean };
  lang: LanguageSetting & { session: LanguageSession };
  budget: { minutesLeft: number; probesLeft: number; verifiesLeft: number };
}
```
Per-turn pipeline (`server/director/turn.js`; pure except the two I/O edges marked):
```ts
async function turn(req: TurnRequest, lesson: LessonCtx): Promise<TurnResponse> {
  const s = safetyGate(req.childText, lesson);                       // 1. pre-empts everything
  if (s.fired) return safeguardResponse(s, lesson);                   //    incident row; adaptive layers frozen
  const ev = await labelTurn(req, lesson);                            // 2. I/O: closed-set labeller, 2 samples, ≤ 300 ms, fallback
  const evidence = toEvidence(ev, lesson.item, lesson.kitKey);        // 3. code grading against the verified key
  const view = foldLayers(lesson.view, ev, evidence);                 // 4. KT, mis, θ (foldEvidence §6.3.1c: dedupe → materialise priors from θ_base → KT → thetaObs; most turns no θ change), detectors→arbiter→engagement, fade, CRI, lang
  const ped = decide(view.pedagogy.step, lesson.rng);                 // 5. PZ table (§6.5a)
  const move = chooseMove(view, ped);                                 // 6. lesson state machine: plan, solo rounds, wait, review, need track
  const vibe = compileVibe(view);                                     // 7. precedence §6.6
  const instructions = compile({ persona, brief: lesson.brief, lessonNow: lessonNow(view, ped.ceiling), vibe, ped, move }); // 8.
  await writer.commit(lesson.child, evidence, view.persistable());    // 9. I/O: one transaction, advisory lock, assertWritable
  return { instructions, move, moduleCommands: move.modules, ui: move.ui, end: move.kind === 'wrap' && view.engagement.state === 'stopped' };
}
```
Invariant: steps 4-8 are deterministic given (view, events, seed); OE L2 replay of a recorded lesson reproduces every move and the compiled instructions byte for byte.

---

## 11. What the parent sees

Report rows are *shapes with slots*, rendered by code, in the parent's language; every row links to its evidence ("Kaise pata?": item, date, answer, help depth). NM-9 governs.

| row | slots | threshold to show |
|---|---|---|
| topics worked on | ⟨topic titles⟩ this week, minutes of tutoring (operational fact) | always |
| answers observed | "⟨skill⟩: answered on her own ⟨k⟩ of the last ⟨n⟩ times, including one a day later" | n ≥ 3; until K7 passes, never the words *mastered/learned/can do* |
| can now do on their own | ⟨skill⟩ (unlocks only after K7, and only for `durable`) | K7 gate |
| working on | misconception *belief* in parent language, "being checked", "cleared after a check a day later" | p ≥ 0.7 verified / resolved |
| coming up | school chapter, confirmed window (weekday + date), scope | confirmed events only |
| next for review | ≤ 3 skills due | refresh flag |
| what Didi remembers | tier-A items with date; quote on tap; edit/hide/delete/add (parent-added items never become "the child said") | P2 |
| settings | language tile, accommodations, address term, humour on/off; each with one-line counted evidence for non-default values | always |
| level bridge (parent only) | "working on ⟨class N⟩ ⟨strand⟩ ideas", with evidence; never a gap number in session 1 | placement not provisional |
| one home suggestion | one autonomy-supportive talk task (never "help with the maths"; Patall 2008 rule-setting [S via NG]) | weekly |

**Banned in parent text** (lexicon gate in English, Hindi and Roman Hindi): any rate of solo outcomes, independence score, CRI/TOH number or overlay notice (SR review R9); attention, mood, effort, personality, engagement, "dependent", *nirbhar*, *sahare*, lazy, weak/kamzor, slow, topper, rank, percentile, comparisons with other children; predicted marks; any effect size from research. A child-visible "what my parent sees" screen mirrors the report (MI review R5.45).

---

## 12. DPDP-safe minimisation and the narrow-mode fallback (summary of binding rules)

1. **Mode ratchet** (§4) with no write path for disallowed layers; default M1; M0 buildable in one transaction.
2. **NM-3 list never persisted:** latency, pauses, hesitation, prosody, barge-ins, time-of-day, engagement, affect, vibe estimates, trust, format posteriors, free text about the child. Schema test enforces it.
3. **Session state** in memory; lesson TTL rows hard-deleted at close (NM-4); the next session's brief is built from NM-2 fields only.
4. **No audio stored** (NM-12); transcripts per the transcript retention decision; homework images deleted in `finally`.
5. **Consent purposes** P1-P5 unbundled; withdrawing P2 erases academic record (child becomes M0); withdrawing P3 erases tier B memory.
6. **Purpose limitation** lint: learner modules importable only from `server/director`, `server/routes/lesson.js`, `server/routes/parent.js`, `server/safety`.
7. **Research telemetry** separate (`research_log`, P4, pseudonymous, no free text, 30 d) and the only source for MM2/DA-M1/PZM3 analyses; no turn-level child data in `eval_*` tables except consented, de-identified TTB items (OE §11).
8. **Counsel questions that gate mode floors:** dpdp-deep Q1 (a)-(d), Q7; Fourth Schedule eligibility of school deployments (M2); s.9(2) detrimental-effect review of humour, social turns, callbacks and solo rounds. Until answered, M1 is the ceiling for consumer children.

---

## 13. Evaluation plan, per layer

Gates are OE G1-G8 plus `STUDENT-SIM.md` batteries. "Sim" results are mechanics only (LM17). Pilot measurements carry n, method and date into `context/measurements.md` when run.

| layer | unit / property tests (every commit, G3) | simulator battery (G5, `STUDENT-SIM.md`) | calibration / validity (pilot) | ship gate | reversal / kill |
|---|---|---|---|---|---|
| Knowledge | LR(C0) ≥ 1 ∀R; ASR-dropped event changes nothing; absence never lowers display; replay = online under shuffled arrival; one T per episode; budget clamp; every class × outcome has emission, FSRS grade and `recent` value; `mastered` needs ≥ 20 h delayed event; EM recovers synthetic params ±0.03 and matches pyBKT ±0.02 | R2b false mastery ≤ 5% under **both** truth families; R4c grader leniency; delayed-item AUC per family | K1 labeller confusion per class (≥ 300 teacher-rated child explanations); K3 forgetting refit (~5k delayed checks per topic type); K7 delayed accuracy of `mastered` at 1/4/12 weeks, ECE ≤ 0.05, n ≥ 200 children | parent mastery words only after K7 | K6 challenger wins 2 refits |
| Misconception | p ≥ .7 → verify move only; resolved ⇒ check scheduled; no double count | R2a covert detection recall ≥ .7 within 6 turns; R2c kit-level trap catch; R3c resolution precision ≥ .8 | real-child SFS (SM4) for flip bands; misconception prevalence by class | — | — |
| Ability / placement | GE origin test; mixture prior weights versioned; ambiguous flag when modes > 1.5 GE apart; every non-exit stop ends on a P≈.9 item; **θ-lesson properties TP1-TP8 (§13.2, gap-fill G1-theta-lesson-update)** | OD sim re-run with a non-monotone-responder population (15-20%) and a bracket-rung ASER arm (OD R1); within-0.5-GE rates reported; **R2i θ recovery vs card truth, both families** (`STUDENT-SIM.md` §9.2) | M-OD-1 vs trained ASER-style tester (2 testers on 20%, κ reported, n ≥ 150); M-OD-10 first-lesson P(correct) in [.5, .9] | placement wording "provisional" until 16 items | agreement < 70% |
| Need | pace predict-then-update; CAS on version; confirmed sources never gated; urgency ramp share ≥ .3 at d = 14; day counts never in brief | synthetic need harness: 200 children, reordered chapters, 20% wrong parents, DD/MM swaps; MAE ≤ 1.5 topics; zero false rejects of confirmed observations (NG R5.1) | MN1 reliability per source; MN2 photo date exact-match ≥ .95 else suggestions only; MN10 need-aware planner vs generic on DRS | exam mode off for classes 1-2 test | MN6/MN7 null on delayed retention |
| Profile: pedagogy | `decide()` pure; rung 4 ⇒ thenIsomorphic; qStreak ≤ QMAX in replays; misconceptions never randomised; no MRT on safety turns; KNOBS registry satisfies PZI7 | R1a/R1b/R1c leaks; R3a re-teach latency ≤ 4; R7 behaviour handling; TOH gate | PZM1 leakage with key present/absent/rung-gated (1,000 adversarial Hinglish turns per arm + human-reviewed real transcripts); PZM3 strain hazard vs qStreak by band | G5 leak bars | PZ reversal column |
| Profile: format | constraints never violated; exploration floor ≥ 20%; offer when tied | allocation logs only (sim cannot test efficacy) | E-PROFILE (LS §8.7), preregistered, ≥ 2× bandit power inflation | per-child formats only after HTE gate + E-PROFILE + M3 | kill per LS §8.7 |
| Independence | SRI1-SRI9 incl. safety pre-empts solo; help request answered within 1 turn; support changes ≤ 1 level per item; C0-only fading | TOH gate (tss, Telling@k, help-before-wait, solo success, tercile equity); `leaky` control must fail | SR-M2 affect/efficacy cost of solo rounds; SR-M3 CRI incremental validity; SR-M8 move detectors κ ≥ .7 | TOH must pass every release | SR-M4 fixed fading non-inferior |
| Vibe | precedence order; strain above explicit; closed address set; vibe never leaks into KT: isolation test I over the typed partition (byte-identical ledger, held episode/outcome/flag streams) + bounded test B-ENG for the engagement → item-selection path, both killing mutants VK1-VK6 (§13.1, gap-fill G2-floor8-permutation-untestable); VI1-VI11 with child-referent lexicons | R5 register; knob compliance detectors M9 ≥ 85% per knob (humour by asset id, length histogram, address) | M1 extractor precision; M4 register norms (blind paired audio, 3 bands, ≥ 3 regions); dropped-call perception before longer waits | `explicit_only` + session safety moves only in v1 | E-VIBE non-inferiority (0.2 SD margin, ~310/arm, household randomised) |
| Engagement | arbiter: suspicion expiry, no costly move without pick/confirmation, verify budget, META honoured same turn, easy-run cap, never names inferred state, stated feeling may be mirrored | R7; DAS2-style disengaged cards (gamer, silent, storyteller); verify-budget counts | DA-M1 labeller κ per label × band (stratified ≥ 50 positives per label, lower CI bound); DA-M2 detector precision with an independent ground-truth channel (observer or delayed retention, not accuracy); DA-M10 fairness by accent/device/board | labels below κ .60 never fire | DA-M7: halving budget loses nothing |
| Memory | DB-enforced citation; one active per slot; S2 no write path; S3 → incident; forget before reply renders; consent withdrawal erases; claim checker; injection fixtures for every kind | TaxiMemEval (TME) battery: extraction faithfulness, supersession, abstention, forgetting, injection (MINJA-style) | TME-H2 ask-before-remember (default off); TME-P1 personal kinds vs learning-only on closeness, 4-week retention, parent trust | refutation rate > 2% halts writes | TME-P1 null → tier B stays off |
| Language | normaliser test table; estimator needs ≥ 6 utt / 40 tokens; must beat rule baseline; reply-language attribute checked | `asr-noise` channel with script flips and Hindi number words; cs convergence card | PZM2 Hindi vs English directives on teacher-labelled Hinglish turns (≥ 500); E1 child ASR WER by cohort | — | — |
| Whole model | G1 brief cap on 2× fixture; G2 lexicons fire on planted strings; M0 ratchet leaves zero rows; erasure cascade; schema NM-3 test; kill-switch per knob | full G5 battery under two truth families and three gain tables; dev-sealed gap | anchor test vs DRS (OE O5), quarterly; fairness audit of placement error and early-stop by gender (analytics table), board, medium, device, noise | every release: G1-G6 + TOH | — |

### 13.1 Vibe/affect isolation: input partition, isolation test I, bounded test B-ENG, mutants (gap-fill G2-floor8-permutation-untestable)

**Why the old test could not be written.** "Permute vibe/affect → bit-identical KT and probe schedule" fails on a correct Director, because affect legitimately moves `EngagementState` (FRUSTRATION reads `AFFECT_SELF`, DA F3), and the state legitimately moves item difficulty (§6.7 bands), item choice (costly moves), teach events (§6.5a rule 5) and LR tempering (via easy runs, §6.1 rule 4). A test that fails on correct code is either deleted or ignored; either way the floor has no gate. MI review 27 already flagged the same defect in MI8 ("arms see different child responses") [V, MI §review]. The fix splits the claim at the seam where the coupling is legitimate: **scoring** of a given episode stream must be affect-blind (byte-identical); **selection** of the stream may be affect-aware (bounded).

**Partition (`shared/learner.ts`, pure data; a type test fails the build if a key is in both lists or a `KtInput` field is in the permuted list).**
```ts
// shared/learner.ts — (gap-fill G2-floor8-permutation-untestable)
/** Inputs the isolation test PERMUTES. None may reach KT scoring, misconception logits, θ or probeFor(). */
export const KT_PERMUTED_INPUTS = [
  // vibe knobs (§6.6) and their explicit preferences
  'vibe.waitNudgeSec', 'vibe.endpointSilenceMs', 'vibe.teacherTurnWords', 'vibe.humourDose', 'vibe.humourAssetId',
  'vibe.energy', 'vibe.address', 'vibe.interestTheme' /* render-time skin; itemKey must be theme-independent */,
  'prefs.explicit.child', 'prefs.explicit.parent',          // any explicit pref over the knobs above
  // timing features (§6.7 signal layer), including intra-session wall-clock offsets (KT orders events by seq instead)
  'timing.onsetLatencyMs', 'timing.zChildOnset', 'timing.wordsPerSec', 'timing.dwellAfterHintMs', 'timing.rapid',
  'timing.repeatedTokenRatio', 'timing.scriptMix', 'timing.bargeIn',
  'timing.intraSessionOffsetMs' /* wall-clock offset of an event from sessionStartAt; knobs move it by seconds */,
  // affect labels (§6.7 labeller)
  'acts.AFFECT_SELF', 'acts.taskValence',
  // derived affect: EngagementState itself is downstream of both lists, so it is never an input to KT, only to selection
  'derived.engagementState', 'derived.suspicions.FRUSTRATION', 'derived.suspicions.DRIFT',
] as const;

/** Inputs HELD FIXED (replayed from the recording). These are allowed to move KT. */
export const KT_HELD_INPUTS = [
  // the episode stream: which items, in what order, which were teach-only (strain tells live here once they happened)
  'episode.itemKey', 'episode.skillIds', 'episode.cls', 'episode.teach', 'episode.pSuccessAtSelection',
  'episode.selectedBy', 'episode.seq' /* order only */, 'session.sessionStartAt' /* the only clock KT reads */,
  // the outcome stream
  'outcome.outcome', 'outcome.answerText', 'outcome.grader', 'outcome.graderVersion', 'outcome.asrConf',
  'outcome.contaminated',
  // task acts (not affect): they are what the child did, not how the child felt
  'acts.ATTEMPT', 'acts.HEDGED_ATTEMPT', 'acts.IDK', 'acts.CLARIFY_Q', 'acts.ANSWER_REQUEST', 'acts.HINT_REQUEST',
  'acts.OFF_TASK', 'acts.META', 'acts.addressesQuestion',
  // detector flags that legitimately temper LRs (§6.1 rule 4), each derived only from held fields
  'flag.gamingWindowKt', 'flag.controllerEasy', 'flag.assisted', 'flag.safetyFired',
  // frozen globals and seeds
  'params.paramsVersion', 'seed.lessonSeed',
] as const;
export type PermutedInput = typeof KT_PERMUTED_INPUTS[number];
export type HeldInput = typeof KT_HELD_INPUTS[number];

/** The ONLY argument shape the KT/misconception/θ/probe code receives. Built by projecting the turn onto HeldInput. */
export interface KtReplayInput {
  episodes: { itemKey: string; skillIds: SkillId[]; cls: EvidenceClass; teach: boolean; pSuccessAtSelection: number;
    selectedBy: 'plan'|'band'|'costly_move'|'easy_cap'|'review'; seq: number }[];   // no wall-clock field
  outcomes: { episodeIdx: number; outcome: number; answerText: string | null; grader: 'code'|'llm'|'human';
    graderVersion: string; asrConf?: number; contaminated: boolean }[];
  taskActs: { turnIdx: number; act: Exclude<ActLabel, 'AFFECT_SELF'>; addressesQuestion: boolean }[];
  flags: { gamingWindowKt: boolean[]; controllerEasy: boolean[]; assisted: ('parent'|'sibling'|null)[]; safetyFired: boolean[] };
  sessionStartAt: string; paramsVersion: string; lessonSeed: string;
}
/** Pure; no vibe, timing, affect or EngagementState parameter exists, by construction. */
export type ProbeFor = (skillId: SkillId, outcomeHistory: readonly number[], s: SkillState, b3: Band3, draw: number)
  => ProbeKind | null;    // draw = u01(hash(lessonSeed, 'probe', skillId, opportunityIdx)), §6.5a
```
Type-level checks (`shared/__tests__/partition.test-d.ts`, runs in `tsc -b`): `Extract<keyof Flatten<KtReplayInput>, PermutedInput>` is `never`; the two lists are disjoint; every field the KT modules import from `DirectorView` appears in `KT_HELD_INPUTS` (a lint rule, `no-restricted-imports` on `engagement`, `vibe`, `timing` inside `server/learner/kt/**`, `server/learner/misconception/**`, `server/learner/ability/**`, `server/director/probe.js`).

**Test I — isolation (byte-identical; every commit, G3; `server/learner/__tests__/vibe-isolation.prop.test.js`).**

*Property.* For every recorded lesson L = (H, V) with held part H and permuted part V, and every permutation generator π:
`ledger(forcedReplay(H, V)) ≡ ledger(forcedReplay(H, π(V)))` as bytes, where
`ledger = canonicalJSON({ skillStates after every event (pL, retention, mem, n, recent, opp, run, display, flags, refresh), misconception logits after every event, θ posterior grid, probeSet })` and
`probeSet = sorted set of (skillId, sha256(outcomeHistory prefix), opportunityIdx, probeKind)` collected from every `probeFor` call.
`forcedReplay` runs the **real Director end to end** (not the KT module alone, so leaks via module state or the shared RNG are reachable), with item selection and child outcomes overridden by H and everything in V fed to the vibe, timing and engagement code as live. Engagement may compute any state it likes; its outputs that would change the episode stream are recorded as `wouldSelect`/`wouldTell` diagnostics and discarded, because H is fixed.

*Generators π* (fast-check, 200 runs per commit, failing seeds logged): (a) shuffle each permuted field across turns within the lesson; (b) swap the whole V with another card's V; (c) draw each field uniformly from its domain (closed sets for knobs and acts, log-uniform 50 ms-20 s for latencies); (e) re-time the lesson: regenerate every `intraSessionOffsetMs` as the knobs in V would (each child turn shifted by the new `waitNudgeSec`/`endpointSilenceMs`, each teacher turn by `teacherTurnWords` at 2.5 words/s), order preserved; (d) extremes: `AFFECT_SELF` negative on every turn, `taskValence = bored` everywhere, `humourDose = light` at every legal slot, `endpointSilenceMs` at both adapter limits. Fixtures: ≥ 40 recorded lessons (sim ledgers under both truth families, plus pilot lessons when they exist), including ≥ 10 with a strain tell, ≥ 10 with a GAME window, ≥ 10 with an easy run.

*Power check (the test must be able to fail).* Each run also perturbs one random field of H (one outcome, one `gamingWindowKt`, one `controllerEasy`, one `teach`) and asserts the ledger **differs**; a held perturbation that leaves the ledger identical marks that field as dead weight in the partition and fails the run (a field the KT never reads does not belong in `KT_HELD_INPUTS`).

*Derived-flag check (pipeline level).* On the same fixtures, recompute `gamingWindowKt` and `controllerEasy` from H ∪ π(V) with the live detector code and assert they equal the recorded values: permuting timing must not move them. This is the check that catches a GAME detector whose KT-facing output reads onset or dwell.

**Test B-ENG — bounded engagement → selection coupling (G5-sim, every battery; `evals/sim/b-eng.mjs`).**

*Design.* Paired arms on the same card, seed and common random numbers (STUDENT-SIM §11.4): arm E with the card's affect channel neutral; arm S with the affect channel driven to `strained` by permuted inputs only (`AFFECT_SELF` negative on 2 of every 6 turns and `taskValence = hard`), so the simulated child's truth and answer policy are identical and only the Director's view differs. ≥ 36 cards × 3 seeds × every lesson kit in the battery. Classify every probe by `probeFor` origin: **mandatory** = R2e first-correct verification on new trap-eligible concepts, misconception verify (p ≥ .7), wheel-spin prerequisite probe; **optional** = the 30-50% consolidating draw.

*Bounds (per (card, seed, skill, lesson) triple seen in both arms).*

| id | metric | bar | scope |
|---|---|---|---|
| BE1 | \|mandatory probes_S − mandatory probes_E\| | ≤ 1 on every triple [U: proposed bound, revisit after first battery] | invariant |
| BE2 | R2e suppression: first-correct answers on new trap-eligible concepts whose R2e draw says "probe" but get no verification probe of any type (isomorph, why, transfer) within the same episode or the next item on that skill, in arm S | 0 | invariant |
| BE3 | optional-probe rate per eligible correct answer, S vs E | \|Δ\| ≤ 0.10 pooled, and identical per (skill, opportunityIdx) draw because the counter RNG is shared | compliance |
| BE4 | strain tells per lesson in S | ≤ ⌈items/3⌉ and each after an unaided isomorph (§6.5a rule 5) | invariant |
| BE5 | false mastery R2b in S minus E (inflation from sustained .85-.95 targets, MI review 27) | ≤ +2 pp; `controllerEasy` share of the evidence that crossed `learned_today` reported | compliance |
| BE6 | consistency: re-running Test I's `forcedReplay` on arm S's own recorded H reproduces arm S's ledger | byte-identical | invariant |

BE1 is a bound, not a proof: the strained arm sees easier items, so it can reach a first-correct on a new concept one item earlier or later; it cannot create or delete the obligation. BE6 ties the two tests together: every KT difference between E and S must be explained by a different H, never by V.

**Mutants (wired into STUDENT-SIM §11.2 "vibe leaking into KT"; each must be killed, a survivor is a test bug).**

| id | injected fault (one line in the real Director) | killed by |
|---|---|---|
| **VK1** (the canonical "vibe leaking into KT") | in KT rule 4: `if (view.engagement.state === 'strained') LR = LR ** 0.5;` (tempers by affect state instead of `controllerEasy`) | I (gen. a/d flip `strained` on fixed H → pL bytes differ) |
| VK2 | humour selection draws from `lesson.rng` before `probeFor`'s draw (shared RNG) | I (probeSet differs under gen. d) |
| VK3 | `gamingWindowKt` includes G6 `rapid` or G1's onset clause | derived-flag check; I under gen. c |
| VK4 | `decide()` rule 5 placed before rule 3, or `if (step.strained) skip ask_why` | BE2 (and BE1 on most triples) |
| VK5 | `controllerEasy = engagement.state !== 'engaged'` instead of `pSuccessAtSelection ≥ .85` | I (gen. a) and derived-flag check |
| VK6 | retention in rule 1 uses each event's wall-clock time (`sessionStartAt + intraSessionOffsetMs`) instead of `sessionStartAt` | I under gen. e (R shifts in the last float digits; byte identity catches it) |

Also required: a **legitimacy control** — the unmodified Director must pass I on all fixtures and pass B-ENG; if it fails I, the partition is wrong, and the fix is to move a field between the lists with a written reason in `context/decisions.md`, never to loosen byte identity.

### 13.2 θ-lesson property tests (gap-fill G1-theta-lesson-update)

`evals/learner/theta.prop.test.ts`, fast-check, ≥ 500 runs each, generators over synthetic logs: placement run → 1-6 sessions → 5-40 evidence events per session over 1-4 strands and 1-12 skills, with every `EvidenceClass` × outcome × flag combination and random gaps of 0-90 days. Fixtures assert byte identity (`Float32Array` equality, or ≤ 1e-12 where noted for floating-point summation).
| id | property | how |
|---|---|---|
| TP1 | **replay idempotence** | `fold(log)` twice → identical (θ base, ll, every pL); `fold(log ++ shuffleDup(log))` (re-delivered ids) = `fold(log)` |
| TP2 | **online = offline** | per-turn `foldEvidence` over the log = batch re-fold from placement, including every materialised `prior_pl0` and `prior_epoch_id` |
| TP3 | **no drift apart under repeated re-fold** | 5 successive nightly re-folds with the same `params_version` → identical (θ, pL). Then, with a *new* params_version, re-fold twice → identical to re-fold once (no ratchet). For every skill, `prior_pl0 = priorFromTheta(base at its materialisation)` recomputed independently |
| TP4 | **one-way coupling** | (i) perturb every pL, KT param and FSRS state before re-fold → θ bases byte-identical (θ never reads pL; `capByPrereqs` affects only priors). (ii) after k's first event, perturb θ (any base) → pL_k trajectory byte-identical (TH3) |
| TP5 | **count once** | instrument `add()` and `kt.update()`: every ev.id appears ≤ 1 time in each; no ev.id of the current session contributes to any prior materialised in that session; `thetaObs` returns non-null for no probe.*, para, assisted, gaming, controllerEasy, contaminated, entry-rung > 0, post-teach, non-first or LLM-graded event (exhaustive table test over the (a) matrix) |
| TP6 | **strand permutation** | (i) relabel/reorder strands (permute the strand array, the ρ matrix and the event→strand mapping consistently) → identical posteriors per strand and identical pL for every skill. (ii) within an epoch, permute the interleaving of events on *different* strands (per-skill order kept, as BKT is sequential) → identical θ (≤ 1e-12) and byte-identical pL (TH2 makes priors order-free in-session) |
| TP7 | **epoch algebra** | `openEpoch` at the same timestamp twice = once; with no events between, `open(open(x, d1), d2) = open(x, d1 + d2)` (diagonal inflation and drift commute; the sd0 cap is a min); inflating never raises a correlation |
| TP8 | **monotone, bounded** | adding a y = 1 obs never lowers its strand's mean; the borrowed shift on any strand ≤ 0.5 GE; a strand with nObs = 0 in every epoch has posterior mean = prior + bounded borrow only |

Mutants that must be killed: TM1 priors read live θ (TP6-ii, TP5); TM2 `thetaObs` admits C1 as y = 1 (TP5 table); TM3 θ updated before priors are materialised (TP5); TM4 borrowing written back as a mean shift each turn (TP6-ii, TP1); TM5 inflation applied at `SessionClose` and again at open (TP7); TM6 re-prior of n > 0 skills at epoch open (TP4-ii).

---

## 14. Measurement backlog in priority order (what unblocks what)

1. **E1 child ASR** (WER, endpointing, drop rate by cohort) — every speech-derived signal; `open-real-child-audio`.
2. **K1 / E2 labeller confusion** on Indian child transcripts per evidence class (≥ 300 explanations, two teacher raters) — sets every dialogue probe's weight.
3. **DA-M1 act labeller reliability** (stratified, lower-CI gate) — decides which detectors may fire.
4. **PZM1 / PZM1b leakage and the voice gating loop latency** — decides rung-gated context vs post-hoc guard.
5. **M-OD-1 placement agreement + M-OD-9 time per item** — placement caps and the 15-minute budget.
6. **SM1/SM2 + SM6 simulator self-tests and control separation** (`STUDENT-SIM.md`) — before any G5 bar is trusted.
7. **K7 calibration audit** — unlocks parent mastery words.
8. **SR-M2, MM4, PZM3** (solo rounds, challenge bands, Socratic budget) — first pilot MRTs, only with P4 consent and ethics review.
9. **E-PROFILE, E-VIBE, TME-P1** — only after counsel; they decide whether M3 layers are worth building at all.

---

## 15. Build order

1. **B0 (now):** `shared/bands.ts`, `server/learner/mode.js` + writer gate, safety gate wiring at the top of `turn()`, schema `003_learner.sql` (M1 tables), remove `vibeFrom()` and `rel_state.trust`, fix the memory bugs (TM §11), brief renderer v2 with the tail order.
2. **B1:** KT module (`server/learner/kt/*`: outcomes, emissions, bkt, memory, ability, priors, misconception, mastery, replay) with every §13 property test; the evidence route in `server/routes/lesson.js`; nightly ACA job skeleton (EM, params versions).
3. **B2:** PZ `decide()`, rung-gated LESSON NOW, transcript leak scan + Hindi number normaliser; independence controller (fade, solo rounds, wait, CHECK); TOH metrics.
4. **B3:** DA labeller (≤ 8 acts), detectors, arbiter, 5-state engagement; vibe v1 (5 knobs + energy, explicit_only).
5. **B4:** onboarding CAT + reading ladder (Azure pronunciation assessment, sentence chunks ≤ 30 s) + language estimator (session); need facts, pace filter, planner, photo pipeline.
6. **B5:** TeacherMemory tier A with consolidation validators and parent page.
7. **Each step lands with its `STUDENT-SIM.md` battery** (simulator changes never in the same commit as model changes).

---

## 16. Open questions (owner or counsel)

1. Counsel: dpdp-deep Q1 (a)-(d) and Q7; is M1 itself defensible for a D2C app, or is M0 the consumer floor? Fourth Schedule eligibility for school deployments.
2. Owner: persona address default (didi vs ma'am) — informs the closed address set and M4; safeguarding review of didi+beta against the no-companion-register floor.
3. Owner: keep a `person` memory kind ever (tier C)? It departs from a literal NM-7 reading.
4. Engineering: can `turn_detection` silence/eagerness be changed mid-session via `session.update` on Azure GA? Does the realtime path expose ASR confidence? Does transcription emit laughter tokens for children?
5. Engineering: can two labeller calls per turn stay ≤ 300 ms p90 from India-adjacent regions; if not, does a one-turn lag break verification timing?
6. Research: real Indian children's selective-flip behaviour (SM4) — if generic "galat" makes most children switch answers, R4/R2 bars must be read against that.
7. Research: does `teacher's pick` read as autonomous to Indian children (Iyengar & Lepper transfer [U])?
8. Data: ~200 real datesheets across boards to replace the calendar priors; ethnography of 10-20 home tutors' first meetings.

---

## 17. Sources
- *(gap-fill G1-theta-lesson-update)* Khajah, Wing, Lindsey & Mozer 2014, Integrating latent-factor and knowledge-tracing models to predict individual differences in learning, EDM 2014. https://www.semanticscholar.org/paper/0534a2e9872e77bdfb00fcc3049f60908ab94605 [S]. Pardos & Heffernan 2010, Modeling individualization in a Bayesian networks implementation of knowledge tracing, UMAP 2010. https://web.cs.wpi.edu/~nth/pubs_and_grants/papers/2010/PardosUser%20Modeling2010.pdf [S]. Glicko g(σ) attenuation and step 1 as in KT §3.2 [V via KT].


Primary evidence is cited inside each sibling doc with its tag; the load-bearing items here, as carried: Bastani et al. 2025 (PNAS; GPT Base −17% unassisted) [V-full via SR]; Pelánek 2017 and Pelánek & Řihák 2017 [V via KT]; Beck et al. 2008 help model [V via KT, review: direction only]; FSRS-6 / ts-fsrs [V via KT]; Khajah 2016 [S per KT review R9]; Schmucker et al. 2025 (r = 0.04; HTE 7-10%) [V via PZ]; Major, Francis & Tsapali 2021 (0.35 vs 0.18, between-study moderator) [V-abs via PZ]; Dinucu-Jianu et al. 2025 (35.2% leakage) [V via PZ, SS]; StratL [V via PZ]; MetaCLASS 2026 [V-full via SR]; Baker et al. 2008, 2010; Paquette & Baker 2019 [V-full via DA]; Ahtisham et al. 2026 [V-abs via DA, review R16]; Chen et al. 2021 [V-abs via DA]; Hughes & Coplan 2010; O'Connor et al. 2014 (INSIGHTS) [V via VT]; Kory Westlund 2017 [V via VT]; CUPID [V via VT]; Chi, Siler & Jeong 2004; Dizon-Ross 2019 [V-abs via NG]; Bandura & Schunk 1981; Duckworth et al. 2011 [V-abs via NG]; FERMAT (AI4Bharat) [V via NG]; Caraeni et al. 2024 [V via NG]; ASER 2024 assessment criteria; Mindspark NBER Appendix C; TaRL NBER [V via OD]; Ling et al. 2017 [V-abs via OD]; Azure AI Speech pronunciation assessment docs [V via OD]; Ligthart et al. 2022; CareCall CHI 2024; LoCoMo; LongMemEval; HaluMem; memory sycophancy +45% [V via TM]; Do, Sonkar & Sachan 2026; Scarlatos et al. 2026 [V via SS]; DPDP Act 2023 s.9 and DPDP Rules 2025 Rule 10, Rule 12/Fourth Schedule [V via LS §4.3]; dpdp-deep NM-1..NM-13. In-repo measurements: `realtime-teacher-bakeoff-2026-10-02`, `realtime-audio-in-2026-10-02`, `db-driver-latency-2026-10-02`; computed: KT worked traces, OD `onboarding-cat-sim.mjs` (seeded, byte-identical), SR `metacognition-srl-depsim.py` (seed 7, N = 3,000), DA PPV arithmetic, and this file's brief-size and evidence-budget arithmetic (§6.1 rule 5, §9.1).
