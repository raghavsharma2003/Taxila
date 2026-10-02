# COMPREHENSION-ENGINE: build spec for covert understanding detection, re-teaching and vibe adaptation

**Date:** 2026-10-02 · **Status:** build spec v1, for the main loop. Nothing here has been run on children. ·
**Code home:** `server/comprehension/**`, plus small additive changes to `server/learner/kt/`, `server/compiler/`,
`shared/`, the Conductor and Forge. · **Owner decision it implements:** `comprehension-engine-program`, with
`voice-features-longitudinal`, `language-english-first-bilingual` and `language-core-hinglish-english-hindi`.

**Inputs:** `papers-2025-2026.md` (M1-M11), `products-live.md`, `game-stealth.md`, `conversation-probes.md` (C01-C36),
`reteach-personalisation.md` (RT1-RT12), `learning-science.md` §1, §6, §7 (P1-P24), §8, `learner/LEARNER-MODEL.md`
(§6.1-§6.7, §9-§11, §13), `learner/STUDENT-SIM.md`, `content/CONTENT-ENGINE.md` (bridge v2), `factory/FACTORY.md`
(§2.7, §4.4), `psychology/RESEARCH-PROGRAM.md`, and the shipped code in `server/learner/kt/*`, `server/director/*`,
`server/voice/features.js` and `server/compiler/compile.js`.

**Computed check:** `comp-engine-calc.mjs` → `comp-engine-calc-2026-10-02.json` (n = 20,000 simulated children per truth
type, seed 7). It imports the real launch emission tables (`server/learner/kt/outcomes.js`) and the BKT-R step
functions (`bktr.js`). Its simulated answers come from the same tables the engine inverts, so every accuracy it
prints is an **upper bound** (the inverse crime, STUDENT-SIM SIM2). It is good for showing which designs *cannot* work.
It is not evidence about any child.

**Tags.** [V] read in the primary source (via the sibling doc that verified it) · [S] abstract or secondary summary
only · [U] our design choice or starting value, to be tuned · [C] computed by `comp-engine-calc.mjs` · [LS] carried
from a sibling Taxila doc, which holds the citation.

---

## 0. The engine on one screen

| id | decision | why (short) | what would reverse it |
|---|---|---|---|
| CE1 | **One evidence log, one fold.** Every source (dialogue probe, teach-back, game, module, delayed/woven probe, transfer) becomes an `EvidenceEvent` in LEARNER-MODEL's closed set of 12 classes. The comprehension belief is computed **inside the same ledger fold** (`L.comp`), so replay always equals the online fold | No second statistical engine (game-stealth E2); replay and isolation properties already exist and are tested (LM §6.1, §13.1) | A class needs an emission shape the 12 classes cannot express (G-M2 shows game LRs need their own class) |
| CE2 | **Belief = five facets over one concept**: K (*does*: BKT-R pL, unchanged), U (*explains and evaluates*), T (*travels to new contexts*), D (*lasts*: FSRS retention plus delayed-check flags, unchanged), M (*wrong ideas*: the misconception layer, unchanged). Only U and T are new. They are logit accumulators that reuse the same emission tables, grader folding, retrieval gate and per-session budget as K | A right answer does not show the reasoning behind it: hidden-misconception detectors run at 4-8 false alarms per hit [V via papers #3]. A single pL cannot tell "does it" from "gets it" [C: the quiz-only K-rule below] | U and T add < 0.02 AUC over pL alone in predicting delayed far-transfer items on pilot data (CE-M10) |
| CE3 | **Five states by a code ladder**: `not_yet` → `shallow` → `fragile` → `understood` → `durable` (§2.4). `understood` requires the ledger's `mastered` (a delayed success ≥ 20 h later) plus U ≥ 0.75 and T ≥ 0.6. A state can never be above what the ledger display allows | Owner goal: "truly understood". Delayed and transfer success are the truth signal [LS rule 6; LearnLM×Eedi +5.5 pp on later topics, V via products #4] | CE-M1/M3 show a looser ladder keeps false mastery ≤ 5% under both truth families with faster detection |
| CE4 | **Covert probes come from a 36-shape library** (C01-C36). Each shape names one facet, one evidence class, one grading operator and one test weight. Shapes give structure, not lines: the voice model writes the words | Sentence-shaped prompt text gets recited (inherited law); the four covert reframes (conversation-probes §0.2) | M-PT shows a family is felt as a test by ≥ 15% of children: drop or redesign that family |
| CE5 | **Grading is classification, never free grading.** Three operators run in pure code (answer key, option → misconception, caught a planted error). Three are closed-label LLM calls, one kit expectation per call, with a quoted span checked by code; the grader is blind to the teacher's turns. "Partial" never scores: it schedules a follow-up from a different family | Free-form LLM diagnosis F1 < 0.5 across 18 models [V via papers #6]; graders degrade on part-right answers [V via papers #5]; graders give way to confident students [V via conversation-probes §5.2] | A grader beats the operator on κ against 300 human-labelled Indian-child turns per family (M-GRADE) |
| CE6 | **The probe scheduler is code, with a test-load budget.** It runs *mandatory* probes (verify after a first correct on a new skill, verify a suspected misconception, the delayed check at session open) and *optional* probes ranked by expected information gain per unit of test load. Every turn has a test weight, and windowed and session caps keep the lesson from feeling like an exam | Fusion rule 5 [LS]; children read a repeated, known-answer question as "you were wrong" [S via conversation-probes §1]; evaluative framing adds measurement error for anxious and low-SES children [S] | M-PT < 5% "test" at double the budget (then relax), or > 15% at this budget (tighten) |
| CE7 | **Checks "2-3 topics later" are woven in, not announced.** A learned skill enters a cross-topic queue. When the Conductor plans a topic 2-3 topics on that can host it as a necessary sub-step, the sub-step is graded as its own single event on the earlier skill. If no host turns up in time, it becomes a callback at the next session open | C32 / papers M7; LearnLM RCT outcome was novel problems on later topics [S]; delayed summaries G = 0.70 vs 0.29 immediate [S] | CE-M2 shows woven checks miss their window > 30% of the time, so they move to explicit callbacks |
| CE8 | **Voice and vibe features have zero weight in the belief at launch.** They may only (a) move an already-eligible probe one slot earlier, (b) break a tie between two equal re-teach arms toward the lighter one, and (c) set pace knobs. The 0.03 nudge cap in `features.js` stays as a ceiling that is not used | Children's disfluency tracks correctness, not confidence [S via papers #12]; prosody as a comprehension signal is untested anywhere [products #18]; R2h-I isolation needs byte-identical KT under permuted timing features | VF-M1 (per-child calibration, research E3) shows a feature adds ≥ 0.03 AUC on delayed items within skill: it may then enter as an `LR ≤ 1.1` event |
| CE9 | **Re-teach is chosen from this child's history of knowledge, not from a "learning style".** Failed representation classes are excluded, diagram fluency is a gate, the concrete-pictorial-abstract ladder moves by evidence, the kit's primary arm goes first for a confirmed misconception, a population bandit with a 0.2 exploration floor picks from the second re-teach on, and two failed arms send the lesson down to the weakest prerequisite | RT1-RT9 [V abs/S]; learning-style matching: crossover in only 26% of measures [V abs] | RT-M3 and RT-M6 (per-child affinity beats population best on delayed outcomes, under the HTE gate) |
| CE10 | **Vibe adapter = bounded knobs compiled as one key=value `VIBE` row**, placed after LESSON NOW and before PEDAGOGY NOW. Strain sits above preferences, re-teach turns suppress humour and decoration, and the persona never names a trait | VT/LM §6.6; RT10 (style is engagement, not learning); position is mechanism (inherited) | A Taxila MRT shows a per-child style arm moving y_delay (RT10) |
| CE11 | **Parents see "how we know" as evidence rows**, never state names or labels: what the child did, when, how much help, and whether a person, code or AI checked it. Until the K7 calibration gate passes, wording stays at "observed" | LM13; banned-lexicon gate | K7 passes; then the `durable` wording unlocks |
| CE12 | **The simulator gates mechanics, never efficacy.** STUDENT-SIM cards gain hidden comprehension truth (K/U/T/keep, verbal, deference). Every metric is reported under both truth families. An overt-quiz control must *fail* the test-load bar and a K-only rule must *fail* false mastery, or the battery is invalid | SIM1-SIM7 | A family passes the fidelity card F1-F8 on ≥ 300 consented pilot lessons |

### 0.1 What the computed check already says [C, matched-model upper bounds]

| policy (3 sessions unless noted) | macro accuracy | shallow children called `understood` | worst false-`understood` rate | understood children detected | probes per concept per session |
|---|---|---|---|---|---|
| **Overt quiz, K-only mastery rule** (4 items a session, no probes) | 0.431 | **0.862** | 0.862 | 0.861 | 0 |
| Overt quiz, facet ladder | 0.369 | 0 | 0 | 0 | 0 |
| **Covert adaptive, mixed graders (the spec)** | 0.639 | 0.001 | 0.015 | 0.407 | 1.83 |
| same, 5 sessions | 0.698 | 0.001 | 0.022 | 0.595 | 1.55 |
| same, LLM grader really 0.55 accurate when assumed 0.70 | 0.612 | 0.001 | 0.014 | 0.373 | 1.85 |
| U evidence only from LLM-graded why / teach-back | 0.525 | 0.001 | 0.009 | 0.238 | 2.06 |
| at most 1 U probe per concept per session | 0.436 | 0 | 0.002 | 0.067 | 1.28 |
| U evidence mainly from game predictions at w = 0.5 | 0.460 | 0 | 0.004 | 0.122 | 2.07 |
| (rejected) stop probing a facet once it reads low | 0.580 | 0 | 0.007 | 0.206 | 0.97 |

What follows for the build:
1. **A quiz-plus-KT tutor certifies the correct-answer trap.** 86% of "shallow" children (who get answers right but have no
   understanding behind them) reached `understood` under a K-only rule. The facet ladder holds that rate at ≤ 0.1%.
   This is the reason for CE2.
2. **The engine is cautious, so it is slow to certify.** Under launch emission tables, a child who really understands
   is certified in 41% of cases after 3 sessions and 60% after 5. The median time to certify is 2.6-3.5 sessions.
   False certification stays ≤ 2.2%. That trade is deliberate: a false `understood` stops teaching, a false
   `fragile` costs one more covert check. Parents see "checking" rows meanwhile (§7). The tables are launch priors;
   EM refits against delayed items (LM §6.1) are the lever, not looser thresholds.
3. **Code-graded U probes matter most.** Swapping the error-spot and prediction probes for LLM-graded explanation
   probes cut detection from 0.407 to 0.238. The scheduler prefers R-OPT / R-CATCH shapes for the second U probe (§3.3).
4. **One explanation probe per concept per session is too few.** Detection fell to 0.067. The budget allows two short U
   probes per concept per session, from different families (§3.4).
5. **A facet that reads low must still get one probe per session.** Otherwise one unlucky early miss marks an
   understander `shallow` for good (0.206 vs 0.407). This is now a rejection entry.
6. **Games alone cannot certify understanding.** Eight correct game predictions at w = 0.5 move K to 0.825 but U only
   to 0.342, so the state stays `shallow`. This matches game-stealth E4 from the other side.

### 0.2 Where it sits

```
 child turn / tap / game commit / module answer
   │                          (safety gate first: LM2)
   ▼
 classify (Director) ──► grade ops (code | closed-label LLM, span-checked) ──► EvidenceEvent{cls, outcome, grader, via, shapeId, ebo}
   │                                                                              │
   │ voice z-features (session) ──► tie-break signals only ────────┐              ▼
   │                                                              │      ledger.fold (BKT-R pL · FSRS · misconceptions · θ)
   │                                                              │      + facets.js (U, T)  ──► L.comp[skill]
   │                                                              │              │
   │                                                              ▼              ▼
   │                                       probe scheduler ◄── belief view: state ladder (§2.4) + open facets
   │                                       (mandatory + VOI/test-load)        │
   │                                              │                           ├──► re-teach selector (§5) ──► kit arm + engine
   │                                              ▼                           ├──► weave queue (§3.5) ──► Conductor / Forge want.subSkill
   ▼                                        PedagogyDecision{move, shapeId}   └──► parent "how we know" rows (§7)
 vibe adapter (§6) ──► VibeDirective ──► compile(): … LESSON NOW → VIBE → PEDAGOGY NOW → … → TURN SHAPE (last)
```

**Reused unchanged:** `outcomes.js` emissions and confusion folding, `bktr.js` gate/temper/spend/transition, FSRS,
`misconception.js`, `ledger.js` display ladder, the Director's why sampling (`whyConsolidating 0.4`, 100% on new
skills), `voice/features.js` `signalsFrom`, `compile.js` budget gates. **New:** `facets.js`, the state ladder, the
scheduler, the weave queue, the grading operators, the protégé state, re-teach selection, the vibe adapter section,
and the report rows.

---

## 1. Evidence sources and likelihood weights

### 1.1 Source table

LR = k/u for the outcome at launch, after grader folding (code = identity, LLM = diagonal 0.7), at retrievability R = 1.
These are the real values from `outcomes.js` [C]. `x` is the tempering exponent: LR ← LR^x.

| source | shapes / events | class → outcome | grader | LR (code) | LR (LLM 0.7) | x (source weight) | facets |
|---|---|---|---|---|---|---|---|
| Practice / role-play item | C21, C36, plain items, hint ladder | `item.open` C0 · C1 · C2 · C3 · C4 · IDK | code (R-KEY) | 8.03 · 1 · 0.35 · 0.16 · 0.05 · 0.5 | n/a | 1 (assisted 0.5, gaming 0.25, controllerEasy 0.5) | K |
| Spoken / tapped choice | C08, C11, C23, C30, P7 | `item.mcq2/3/4` first_correct · wrong | code (R-OPT) | 1.8/0.2 · 2.7/0.15 · 3.6/0.13 | n/a | 1; retries carry nothing | K (+M on a mapped wrong option) |
| Why after a correct answer | P2, C03, C06, C12, C14 follow-up | `probe.why` full · partial · none · misc | LLM closed (R-EXP) | 7.5 · 1.14 · 0.24 · 0.15 | 3.11 · 1.08 · 0.43 · 0.54 | 1 | K, **U** |
| Teach-back to a protégé | C01, C02, C33, C34 | `probe.teachback` high · mid · low · misc | LLM closed (R-EXP per expectation) | 6.88 · 1.2 · 0.26 · 0.15 | 2.91 · 1.12 · 0.45 · 0.54 | 1; C02 at home `assisted` → 0.5 | K, **U** |
| Planted error | C04, C05, C07, C15 | `probe.errorspot` caught_fixed · caught · missed | code (R-CATCH) + R-EXP for the reason | 5.0 · 1.15 · 0.33 | 2.22 · 1.05 · 0.51 (reason only) | 1; deference discount (§1.2 E9) | K, **U** |
| Prediction before a reveal | C16, P5, game commit I1 | `probe.predict` right · mapped_wrong · other | code (R-OPT) | 1.71 · 0.43 · 0.83 | n/a | 1 dialogue; **0.5 game** | K, **U** (+M) |
| Near transfer | C13, C19, C20, C26, C28, C29, woven sub-step in a novel host | `probe.transfer.near` pass · fail | code (R-KEY) | 5.67 · 0.18 | 1.78 · 0.56 (R-INST) | 1; game 0.5 | K, **T** |
| Far transfer | C17, C18, C22, C24, C25, C27, game far level | `probe.transfer.far` pass · fail | code or R-INST | 8.13 · 0.38 | 1.69 · 0.66 | 1; game 0.5; fail in an unfamiliar context 0.5 (§1.2 E8) | K, **T** |
| Solo round | SR solo (tutor silent) | `solo` C0 · C1 · fail | code | 8 · 1 · 0.05 | n/a | 1 | K |
| Forge module answer | bridge v2 `answer` (host-graded) | as the level declares (`LevelEbo.commitKind`) | code (host re-grade) | as the class | n/a | **0.75** until 50 sessions show host/kit agreement ≥ 0.98, then 1 (FACTORY §4.4) × game 0.5 | as the class |
| Module interaction facts | C28 manipulative state, `goal_met`, `stuck` | only through a declared EBO item; otherwise a `ComprehensionSignal` (no evidence) | code | — | — | 0 unless an EBO | nominates probes |
| Game process indicators | I4 systematic, I5 inconsistent, I6 under-par, I9 insight, G7/G8 | `ComprehensionSignal` | code | — | — | **0** until G-M3 ≥ 0.65 within-skill AUC | nominates probes |
| Delayed check (next session) | C31 callback, P10 warm-up | the original class with Δt (R < 1 gates the LR) | as the original | LR(C0) ≥ 1 for all R | | 1 | K, D (+U/T if the class is U/T) |
| Woven sub-step 2-3 topics later | C32 | `item.open` on the earlier skill, or `probe.transfer.near` if the host structure is novel (one event, never both) | code | as the class | | 1 | K, D (+T) |
| Protégé returns days later | C34 | `probe.teachback` with Δt | LLM closed | as teach-back | | 1 | K, U, D |
| Voice features | onset, pauses, disfluency, f0 slope, rate (z per child) | **none** | code | — | — | **0** (CE8) | tie-breaks only |
| Vibe / engagement / affect | knobs, acts, strain state | **none** | — | — | — | 0 | never |
| Self-report ("haan samajh gaya") | — | **none** | — | — | — | 0 | never [V via LS §7.1] |

### 1.2 Evidence rules (each one is a property test)

- **E1 First committed act only.** For games and modules, the first commit per (child, level, item) is the event.
  Retries follow the hint-ladder semantics; acts after a reveal are never evidence (game-stealth E1).
- **E2 Rule-0 drops** apply before any facet: safety fired, `asrConf < 0.5`, NA, `contaminated` (the key leaked).
  A dropped event changes no byte of K, U, T or M.
- **E3 Coincident items.** On a lucky-correct item (where a misconception gives the right answer anyway, kit
  `coincident: [misId]`), a correct answer carries `x = 0` for every facet. A wrong answer updates as usual. A why
  after it is mandatory (§3.2).
- **E4 No game-only mastery.** `understood` needs at least one non-game event on U and one on T, or a callback in a
  different archetype (game-stealth E4). Game evidence can at most take a concept to `fragile`.
- **E5 Partial never scores on U or T.** `probe.why = partial` and `teachback = mid` carry `x = 0` on U (their LR is
  about 1.1 anyway) and **schedule** a follow-up from a different family (CE5). K keeps the ledger's handling.
- **E6 One quoted span per positive verdict.** An R-EXP or R-INST "present" with no span that code can find in the child's
  transcript (transliteration-aware) becomes "absent". A missing span on a *negative* verdict is allowed.
- **E7 Woven single event.** A woven sub-step emits exactly one event on the earlier skill. A conjunctive event on the
  host item still blames the weakest skill (KT §1.5), but its target is the host skill, so the earlier skill gets pL
  evidence only from its own event (property: one child answer → at most one event per skill).
- **E8 Unfamiliar far-transfer context.** A far-transfer *fail* in a context the child has not seen gets `x = 0.5`.
  A failure may reflect the context, not the concept [LS P4]. A pass gets full weight.
- **E9 Deference discount.** If the session's yes-rate on true vs false character statements is > 0.8 on both
  (M-DEF), `probe.errorspot = missed` and `item.mcq2 = wrong` on puppet shapes carry `x = 0.5`. A child who agrees
  with every confident speaker gives little information when they agree with a planted error.
- **E10 Assisted.** A second voice (`assisted`) gives LR^0.5 on every facet (the ledger's rule 4, applied to U and T).
- **E11 Answer-seeking.** Two or more `ANSWER_REQUEST` acts on a step set `preAttemptHelp` on that step's events. They
  then cannot count as unaided or generative passes (products #9, Bastani: help-assisted success ≠ unaided).

### 1.3 Voice and vibe features: what they are allowed to do

| feature (per child z, `server/voice/features.js`) | allowed use | forbidden |
|---|---|---|
| `followUpProbe` (≥ 2 hesitation cues on a correct answer) | moves a sampled why (the 40% consolidating draw) to "ask now" **for this item only**, if the budget allows | creating a probe outside the budget; any facet or pL update |
| `gentlerHint` (≥ 3 cues on a wrong answer) | entry rung one gentler (pump instead of hint) | changing the C-outcome or the hint count |
| `slowerPace` | `waitNudgeSec` +1 s and `endpointSilenceMs` +20% for 6 turns (within the band cap) | anything the KT or facet fold reads |
| onset latency on think-questions | `waitNudgeSec` adaptation (§6) | fluency T1/T2 grades when a timer is not visible (LM §6.1 already) |
| any of these | break a tie between two re-teach arms within 0.05 expected reward, toward the lighter one (RT step 8) | triggering a re-teach (RT §3.1); naming any state |

Bound: the belief, the mandatory probe set and the arm choice outside the tie band must be byte-identical when every
voice and vibe input is permuted. This is the R2h-I extension in §8.

### 1.4 Contract additions (`shared/learner.ts`, additive)

```ts
export interface EvidenceEvent {
  /* … existing fields … */
  via?: 'dialogue' | 'game' | 'module' | 'callback' | 'weave';   // source; game/module set the source weight
  ebo?: string;                  // evidence-bearing opportunity id `${engine}:${level}:${item}` (game-stealth §5.1)
  shapeId?: ProbeShapeId;        // 'C01'…'C36'; novelty, M-PT and per-family calibration read it
  weaveHost?: SkillId;           // set on a woven sub-step: the topic's skill that hosted it
  coincident?: boolean;          // E3: a correct answer carries no positive evidence
  unfamiliarContext?: boolean;   // E8
  deferenceDiscount?: boolean;   // E9 (derived in code from held choice data only)
  spanOk?: boolean;              // E6 result, recorded for audit
}
```
Every new flag is a **held** input (LM §13.1): it comes from choice data, kit metadata or the grader. None comes from
timing, vibe or affect.

---

## 2. The per-concept belief model

### 2.1 Facets

| facet | meaning (parent-language gloss) | held by | new? |
|---|---|---|---|
| **K** | does it: answers and procedures right, unaided | BKT-R `pL` and `recent` (`ledger.js`) | no |
| **U** | explains or evaluates it: says why, teaches it, spots the wrong step, predicts | `L.comp[k].U` | **yes** |
| **T** | uses it in a new place: new numbers, a new context, a new representation | `L.comp[k].T` | **yes** |
| **D** | keeps it: delayed successes at ≥ 20 h, 7 d and 30 d; retention = pL·R | ledger `flags.delayed/durable7/durable30`, FSRS `mem`, `delayedMisses` | no |
| **M** | holds a wrong idea | `misconception.js` logits per (child, misconception) | no |

U and T are separate latents because the data separate them. Right answers can come from wrong reasoning
(papers #3). Interest-bound or concrete-only knowledge often fails to transfer (Kaminski 2008 [S], disputed by
Trninic 2020 [S]). Fluency with each representation is its own competency (Rau 2014 [V abs]). One observation can
inform two different latents. That is not double counting, which is about evidence for the same latent (LM §6.2).

### 2.2 Class → facet map

| class | K | U | T | M |
|---|---|---|---|---|
| item.open, item.mcqK, solo, para | ✓ | — (LR = 1) | — | mapped options only |
| probe.why, probe.teachback | ✓ | ✓ | — | `misconception` outcome (routed by `misRoute` for K; U always updates) |
| probe.errorspot | ✓ | ✓ | — | planted misc: `missed` with `discriminates` is not a hit |
| probe.predict | ✓ | ✓ | — | `mapped_wrong` → hit |
| probe.transfer.near / far | ✓ | — | ✓ | mapped fail options → hit |

### 2.3 Facet update equations (`server/learner/kt/facets.js`, pure)

For an event e on skill k, outcome o, grader g, informing facet f ∈ {U, T}:

```
R      = retrievability(mem_k, sessionStartAt)                      FSRS-6, as the ledger (rule 1)
k', u' = k·M_g , u·M_g                                              grader confusion fold (rule 2; code = identity)
Λ_e    = (R·k'_o + (1 − R)·u'_o) / u'_o                             symmetric retrieval gate (rule 3): LR(best) ≥ 1 for all R
x_e    = temper(e) · w_src(e) · [¬coincident ∨ wrong] · [¬partial] · (E8, E9 multipliers)
         temper = assisted 0.5 · gaming 0.25 · controllerEasy 0.5 · kitUnverified 0.5     (ledger rule 4)
         w_src  = 1 dialogue · 0.5 game · 0.75 forge module (until the agreement gate) · 1 callback/weave
j      = 1 + (# events of class cls on (k, f) this session)
S_f'   = clamp(S_f + x_e · log Λ_e / j , −C_f , +C_f) ,   C_U = C_T = log 20 ≈ 3.0   (K keeps ±log 50)
logit p_f ← logit p_f + (S_f' − S_f)
```

- **Prior.** `p_U0 = p_T0 = 0.2` [U], materialised at the skill's first evidence event and then frozen, like pL0
  (TH2). Placement never raises U or T: the CAT measures K.
- **No decay by absence** (inherited law). Time enters only through R in the gate: a failure at low R is weaker
  evidence against U (forgetting is not misunderstanding, RT9), and a success at low R still counts as success.
- **Teaching transition.** A re-teach or teach episode on k applies `p_f ← p_f + (1 − p_f)·τ_f`, τ_U = τ_T = 0.10
  [U], capped at +0.10 per episode (mirrors `teachStep`). This lets an earlier negative reading recover after
  teaching, without letting teaching alone certify anything (0.2 → 0.28 → 0.35 after two re-teaches).
- **Why the tighter cap (log 20 vs log 50).** Covert evidence is noisier and mostly LLM-graded. With the cap, the
  most a single session can move U from 0.2 is to 0.83. Certification therefore always crosses sessions [C].
- **Separation.** facets.js reads `pL` only for the ladder. It never writes pL. The ledger never reads U or T, so
  every existing KT property test is unchanged.

### 2.4 The state ladder (`server/comprehension/state.js`, pure)

Inputs per skill: ledger `display`, `pL`, `recent`, `delayedMisses`, `refresh`; facets U, T and whether each has a
non-game event; M* = max p over unresolved misconceptions linked to the skill; `verified` = M* ≥ 0.85 after a
verifying probe from a different family than the detector.

```
does  = (count(recent = 1) ≥ 2) ∨ (pL ≥ 0.6)
1  if M* ≥ 0.85 ∧ verified                                  → not_yet   (reason: wrong idea confirmed)
2  if U ≥ 0.6 ∧ delayedMisses ≥ 1                           → fragile   (refresh; forgot ≠ never understood, RT9)
3  if ¬does                                                  → not_yet
4  if U < 0.6 ∨ M* ≥ 0.7                                     → shallow   (does it; the why is not shown yet, or a wrong idea is being checked)
5  if display ≥ mastered ∧ U ≥ 0.75 ∧ T ≥ 0.6 ∧ M* < 0.3 ∧ nonGame(U) ∧ nonGame(T)
                                                             → step 6, else fragile
6  if display = durable ∧ ∃ success on U or T with Δt ≥ 7 d (C34, woven far transfer, callback)
                                                             → durable, else understood
```

- **Monotone in evidence, never in time.** Absence never lowers a state; only `refresh` turns on. Two consecutive
  delayed misses demote through the ledger (`demote()`), and the ladder follows. Step 2 keeps a child who once
  showed understanding at `fragile` instead of `not_yet`, so re-teach gets RT9's brief recap and not a new arm.
- **Never above the ledger.** `understood` ⇒ `display ≥ mastered`; `durable` ⇒ `display = durable` (invariant CEI2).
- **Open facets.** A facet is *open* while 0.1 < p < its threshold (U 0.75, T 0.7 for the scheduler's stop rule).
  The belief view exposes `open: ('U'|'T'|'D'|'M')[]`, which drives §3.
- **Thresholds are [U].** They were set so that false `understood` is ≤ 2.2% in the matched-model check [C]. They
  are re-tuned only under both STUDENT-SIM truth families, and the pilot recalibrates them against delayed items (CE-M6).

### 2.5 The belief record (`shared/learner.ts`)

```ts
export type CompState = 'not_yet' | 'shallow' | 'fragile' | 'understood' | 'durable';
export interface FacetState { p: number; S: number; byClass: Record<string, number>; nonGame: boolean; n: number; prior: number }
export interface ComprehensionBelief {
  skillId: SkillId; state: CompState; refresh: boolean;
  facets: { U: FacetState; T: FacetState };          // K, D, M are read from the ledger, never copied
  open: ('U' | 'T' | 'D' | 'M')[];                    // what evidence is still missing → scheduler
  reasons: BeliefReason[];                            // ≤ 8 newest state-moving events, for "how we know"
  paramsVersion: string;
}
export interface BeliefReason {
  evId: string; at: string; shapeId?: ProbeShapeId; cls: EvidenceClass; outcome: number;
  grader: 'code' | 'llm' | 'human'; via: EvidenceEvent['via']; help: 0 | 1 | 2 | 3 | 4; delayDays: number;
  moved: ('K' | 'U' | 'T' | 'D' | 'M')[];
}
```
`L.comp[skillId]` holds the facet states. The belief is derived on read (`beliefView(L, now)`), the same way `readSkill`
derives `refresh`. `ledgerDigest` gains `comp`, so replay = online fold covers the facets (property TP1-TP2 extended).
Legal mode: facets are academic record (derived from answers), so they have the same mode floor as KT (M1). No NM-3
value is an input.

### 2.6 Worked trajectories (deterministic expected-outcome scripts, prior pL 0.3) [C]

| child | events | K | U | T | state |
|---|---|---|---|---|---|
| understander | 2× C0 (code) | 0.929 | 0.200 | 0.200 | shallow |
| | why = full (LLM) | 0.971 | 0.437 | 0.200 | shallow |
| | error-spot caught+fixed (code) | 0.974 | 0.795 | 0.200 | fragile |
| | near transfer pass (code) | 0.977 | 0.795 | 0.586 | fragile |
| | *next session* delayed C0 (R = 0.9) | 0.997 | 0.795 | 0.586 | fragile |
| | far transfer pass (code) | 1.000 | 0.795 | 0.920 | **understood** |
| correct-answer trap | 3× C0 | 0.968 | 0.200 | 0.200 | shallow |
| | why = none (LLM) | 0.937 | 0.097 | 0.200 | shallow |
| | prediction mapped-wrong (code) | 0.880 | 0.044 | 0.200 | shallow |
| | *next session* delayed C0 | 0.984 | 0.044 | 0.200 | **shallow** (a K-only rule would say understood) |
| game only | 8× prediction right at w = 0.5 | 0.825 | 0.342 | 0.200 | shallow |
| two LLM whys, one session | why full, why full | 0.775 | 0.578 | 0.200 | shallow (the 1/j weight: the second why adds less) |

### 2.7 Fitting

- Facet emissions are the class tables (§1.1) at launch. The nightly EM refit (LM §6.1) gains a facet step: U and T
  are fitted against **delayed** U/T outcomes (C34 and woven far transfer), per cluster (subject × topic type ×
  band × language mix), with the same constraints: LR(best) ≥ 1.5, ≥ 50 children × 15 opportunities before
  per-skill parameters, and 20 pseudo-observations of shrinkage.
- Grader confusion M per (operator, graderVersion, language mix) comes from the M-GRADE human-labelled sets. Until
  κ ≥ 0.7, R-EXP stays at the 0.7 default diagonal (LS rule 11).
- Thresholds are never fitted to simulator output (SIM6). They move only on CE-M6 pilot calibration.

---

## 3. The probe scheduler

### 3.1 Where it runs

- **Director, per turn** (`server/comprehension/schedule.js`, pure, called from `server/director/state.js` where
  `probeFor` and the why sampling live now): `planProbe(view, session, kit, shapes, draw) → ProbePlan | null`.
- **Conductor, per session** (`server/conductor/planner.js` hook): `planChecks(child, dayPlan) → { openers: WeaveEntry[] (2-4),
  hosts: { topicId, subSkill }[] }`. Forge receives `ModuleRequest.want.subSkill` for woven game levels.

```ts
export interface ProbePlan { skillId: SkillId; shapeId: ProbeShapeId; facet: 'K'|'U'|'T'|'D'|'M'; mandatory: boolean;
  reason: 'verify_first_correct'|'verify_misconception'|'delayed_check'|'weave'|'voi'|'partial_followup'|'coincident_why';
  testWeight: number; skin?: CharacterSkinId; kitRefs: string[] /* expectation / misconception / item ids */ }
export interface WeaveEntry { childId: ChildId; skillId: SkillId; kind: 'woven'|'callback'|'protege_return'|'game_callback';
  anchorAt: string; earliestAt: string /* anchor + 20 h */; dueAt: string /* FSRS R = 0.9 */; topicsSince: number;
  hostCandidates: SkillId[]; status: 'queued'|'hosted'|'done'|'expired' }
```

### 3.2 Mandatory probes (budget-exempt, but they take the lowest-weight eligible shape)

| trigger | probe | source |
|---|---|---|
| first correct answer on a new (`introduced`/`practising`) skill | a why-family shape (C03/C06, or C10/C14 with a why in B1-B2 choice form) | LS rule 5; LM §6.5a rule 3 |
| correct answer on a coincident item | a why (`coincident_why`) | E3 |
| misconception p ≥ 0.7 (detector) | a verifier from a **different family** than the detector (C04, C09, C35, P7) | M2; LM §6.2 |
| `partial` verdict | one follow-up from a different family | E5 |
| skill due (ledger `due()`) at session open | 2-4 delayed checks woven into the warm-up (C31 or the director's P10 retrieval) | LS rule 5 |

Strain (`strained`) may never cancel, defer or retype a mandatory probe (LM §6.5a, BE2). It *can* defer optional
probes. The bounded test B-ENG allows mandatory probe counts per skill per lesson to differ by at most 1 between
the neutral and the strained arm.

### 3.3 Optional probes: which concept, which shape

1. **Candidates.** Skills taught or practised this session, plus queued weave entries the current item can host,
   plus due skills. For each, the open facets.
2. **Family by missing evidence** (conversation-probes §6.1): U open → A (C01, C03, C06), B (C04, C09), D (C16, C17), E
   (C20, C22); T open → F (C24-C27), D (C18), C (C13), G (C28); D open → H (C31-C34); M active → B or I verifiers.
   Novices (`introduced`) get only A, D16, G and I. No planted-error shape before `learned_today`.
3. **Filters.** Topic type × band fit (●/◐), the shape's display gate, `needsVisual` vs the current surface (tap
   fallback when ASR is risky), the kit inputs the shape needs actually exist and are verified, and the language
   (every shape is language-neutral; the kit must have the expectation in English for the grader).
4. **Score** (expected information per unit of test load):
   ```
   P(o)   = p_f·k̃_o + (1 − p_f)·ũ_o                  (folded, gated, tempered emissions of the shape's class)
   EIG    = H(p_f) − Σ_o P(o)·H(post_f(o))            bits, binary entropy on facet f
   score  = EIG · urgency(skill) · novelty(shape) · gradeBonus(op) / (testWeight(shape) · max(1, costSec/30))
   urgency: today's target 1.0 · weave candidate 0.8 · due review 0.6 · +0.3 if the facet gates the next state
   novelty: 0 if the shape was used twice this session or on this skill yesterday; 0.5 if the last probe was the same family
   gradeBonus: 1.5 for R-KEY/R-OPT/R-CATCH (code), 1.0 for LLM-closed operators   [C: code U probes doubled detection, §0.1]
   ```
5. **Pick.** The argmax; ties within 5% are broken by the counter-based draw
   `u01(hash(lessonSeed, 'probe', skillId, opportunityIdx))`, never the shared `lesson.rng` (LM §6.5a). A voice
   `followUpProbe` signal may move the top candidate *for the current item* forward one slot. It cannot add a probe.
6. **Skin.** The character (silly puppet, curious alien, cricket commentator, new classmate) comes from the vibe
   adapter (§6.4). It never changes the rubric.

### 3.4 The test-load budget ("never feels like a test")

**Test weight per turn** [U, to be tuned on M-PT]:

| turn | weight |
|---|---|
| plain known-answer question ("what is 3/4 of 8?") | 1.0 |
| shape with `testRisk = med` | 1.0 |
| shape with `testRisk = low` | 0.5 |
| shape with `testRisk = veryLow` (role reversal, story, preference, own-world, game commit) | 0.25 |
| a learning move that is also evidence (predict-before-reveal, teach-back) | × 0.5 on top of its risk weight |
| the same question again on the same item (outside the hint ladder) | **banned** (repeated-question effect) |
| "samjha?", "did you understand?", "quiz", "test", "check", marks or score words | **banned** (lexicon gate; no evidence) |

**Caps** (computed from about 2 child turns a minute [U]) [C]:

| band | session (min) | child turns | session test-weight cap (share) | per 10 child turns | other rules |
|---|---|---|---|---|---|
| B1 (Cl 1-2) | 15 | 30 | 6.0 (20%) | 1.5 | choice and tap forms; ≤ 1 U probe per concept unless both are veryLow |
| B2 (Cl 3-4) | 20 | 40 | 8.0 (20%) | 2.0 | |
| B3 (Cl 5-7) | 25 | 50 | 12.5 (25%) | 2.5 | |
| B4 (Cl 8-9) | 30 | 60 | 15.0 (25%) | 2.5 | |

Spacing and novelty rules:
- Never two probe turns in a row: at least one teaching, play or chat turn between them. None in the first 3 child
  turns except the session-open warm-up callbacks (weight 0.25).
- At most **2 U probes per concept per session**, from different families, at most one of them long-form
  (C01/C02/C17/C34). At most 1 T probe per concept per session in B1-B2 and 2 in B3-B4.
- No shape more than twice per session; never the same shape on the same skill on consecutive days.
- Covert probes target a predicted success of 0.7-0.85 (easy practice tests reduce anxiety most, g = −0.52 [V via
  conversation-probes]). Discrimination comes from the misconception trap, not from a hard item.
- Whys are sampled on right *and* wrong answers (100% on new skills, 40% on consolidating ones, as the Director does
  now), so a why never signals "you were wrong".
- **Stop rule:** a facet that reads high (U ≥ 0.75, T ≥ 0.7) stops being probed. A facet that reads low (≤ 0.1)
  still gets **one** probe per session, after a re-teach [C: freezing it cost half the detections, §0.1].
- When the cap is reached, optional probes stop and practice items move into covert shapes (role-play C21, story
  C20, game C35), which cost 0.25 instead of 1.0.

Load check [C]: the adaptive policy in §0.1 used about 1.8 probes and 2 practice items per concept per session. Two
concepts in a B2 session with practice inside role-play or story cost about 2 × (2 × 0.25 + 1.8 × 0.5) ≈ 2.8 of the
8.0 cap, which leaves room for warm-up callbacks and plain items.

### 3.5 Cross-topic delayed checks: "2-3 topics later" and the next session

1. **Enqueue.** When a skill reaches `learned_today` (or `fragile`), `weave.js` writes a `WeaveEntry`:
   `earliestAt = anchor + 20 h` (the ledger's `DELAY_MS`), `dueAt = FSRS nextReviewAt` (R = 0.9),
   `hostCandidates` = skills whose kit `weaveHosts` lists it, plus prerequisite-graph descendants within the subject.
2. **Host.** Each time the Conductor plans a topic, it counts `topicsSince` for every entry. It hosts an entry when
   `2 ≤ topicsSince ≤ 3 ∧ now ≥ earliestAt ∧ topic ∈ hostCandidates`. The host topic's item generator (kit
   isomorph, or Forge `want.subSkill`) builds a problem in which the earlier skill is a **necessary** sub-step.
   Fractions inside a ratio problem, or past tense inside a story task, are examples.
3. **Grade.** The sub-step is its own episode on the earlier skill, graded by R-KEY, as one event (E7): `item.open`, or
   `probe.transfer.near` when the kit marks the host structure as novel. It counts as the ledger's delayed check if
   it is the skill's first attempt in a later session, before any re-teach of it (`advanceDisplay` `isCheck`).
4. **Fallbacks.** If `topicsSince > 5`, or `now > dueAt + 2 d` with no host, the entry becomes a C31 callback at the
   next session open: a shared moment from TeacherMemory or the serial story, continued with a new twist that needs
   the idea, never "do you remember what X is".
5. **Protégé return (C34).** At 3-10 days, for skills whose U is open or which are `understood` but not yet durable,
   a different character "who missed the lesson" arrives. It is the strongest single durable-understanding probe,
   because it combines generating an explanation, a delay and no warning [U for the combination].
6. **Game callback (T8).** A level from a different archetype on the earlier skill, 2-3 topics later. It is the only
   game evidence that satisfies E4.
7. **Session open.** The Conductor passes 2-4 openers (B1: 2), drawn from due skills and expired weave entries in
   order of lowest retention.
8. **Outcomes.** A pass moves D (the ledger's delayed flag and re-anchoring) and K, plus T if the event was a transfer.
   A miss raises `refresh`; under RT9 the re-teach is a recap of the arm that worked, not a new explanation.

### 3.6 Pseudocode

```
planProbe(view, sess, kit, shapes, draw):
  if sess.safetyFired: return null
  m = mandatoryFor(view, sess)                        # §3.2, fixed order: misconception verify > coincident why > first-correct why > partial follow-up
  if m: return cheapestEligibleShape(m, kit, shapes, sess)
  if sess.lastTurnWasProbe or sess.childTurns < 3: return null
  if sess.engagement in {strained, stopped}: return null            # optional only
  if windowWeight(sess, 10) ≥ cap10[band] or sessionWeight(sess) ≥ capSession[band]: return null
  cands = [(s, f, shape) for s in candidates(view, sess.weaveQueue) for f in openFacets(s)
                          for shape in familyFor(f, s) if passesFilters(shape, s, sess, kit)]
  return argmax(cands, score, tiebreak = draw(lessonSeed, 'probe', s, opportunityIdx))
```

---

## 4. Probe library and grading by classification

### 4.1 Registry (`server/comprehension/probes/shapes.js`, pure data)

Record fields as conversation-probes §3 (`id, family, topicTypes, bands, gate, emits, kitInputs, grader, lrBand,
testRisk, costSec, confounds, needsVisual`), plus `facet` and `op`. An eval predicate checks that each record names
a kit input, a class from the closed set, and an operator from §4.2.

| id | shape | family | facet | emits | op | test risk |
|---|---|---|---|---|---|---|
| C01 | announced protégé teach-back | A role reversal | U | teachback | R-EXP | low |
| C02 | explain to a family member (voice note) | A | U | teachback | R-EXP (assisted ^0.5) | veryLow |
| C03 | protégé's naive "but why" | A | U | why | R-EXP | veryLow |
| C04 | protégé holds the child's misconception | A | U, M | errorspot | R-CATCH | veryLow |
| C05 | revoice with a twist | A | U | errorspot | R-CATCH | low |
| C06 | "say more" on the child's own word | A | U | why | R-EXP | veryLow |
| C07 | help me check my work (teacher slip) | B evaluate | U | errorspot | R-CATCH | low |
| C08 | silly-puppet statement (truth-value judgement) | B | K, M | mcq2 | R-OPT | veryLow |
| C09 | two friends disagree (concept cartoon) | B | U, M | mcq3 (+why) | R-OPT (+R-EXP) | low |
| C10 | would-you-rather where the concept decides | B | K (+U) | mcq2 (+why) | R-OPT | veryLow |
| C11 | spot the fake (two truths and a myth) | B | K, M | mcq3 | R-OPT | low |
| C12 | odd one out, with no single right answer | B | U | why | R-EXP | veryLow |
| C13 | sort by "same trick inside" | C compare | T | transfer.near | R-KEY (bins) | low |
| C14 | which way would you do it? | C | U | mcq2 → why | R-OPT + R-EXP | low |
| C15 | which one would trick a friend? | C | U | errorspot | R-CATCH | veryLow |
| C16 | prediction bet before the reveal | D predict | U, M | predict | R-OPT | veryLow |
| C17 | what would happen if… | D | T | transfer.far | R-EXP | low |
| C18 | make it happen (reverse design) | D | T | transfer.far | R-KEY | low |
| C19 | ballpark first | D | T | transfer.near | R-KEY (tolerance) | veryLow |
| C20 | story that stops where the concept decides | E story | T | transfer.near | R-KEY / R-EXP | veryLow |
| C21 | role-play shop, kitchen, station, match | E | K | item.open (in role) | R-KEY | veryLow |
| C22 | advice to a character in trouble | E | T | transfer.far | R-EXP | veryLow |
| C23 | choose-the-path adventure | E | K, M | mcq2/3 | R-OPT | veryLow |
| C24 | where have you seen this? | F own world | T | transfer.far | R-INST | veryLow |
| C25 | hunt in your house | F | T | transfer.far | R-INST (assisted ^0.5) | veryLow |
| C26 | interest-context remix (deep, not cosmetic) | F | T | transfer.near | R-KEY | veryLow |
| C27 | make a puzzle for me | F | T | transfer.far | R-KEY (solver) | veryLow |
| C28 | show me on the thing (translate representation) | G show | T (+repFluency) | transfer.near | R-KEY (manipulative state) | low |
| C29 | finish my drawing | G | T | transfer.near | R-KEY / R-INST (vision, closed) | low |
| C30 | act it out | G | K | mcq2 | R-OPT | veryLow |
| C31 | callback in passing | H delayed | D (+ original) | original class with Δt | as original | veryLow |
| C32 | woven sub-step 2-3 topics later | H | D, K (+T) | item.open / transfer.near | R-KEY | veryLow |
| C33 | headline for yesterday's episode | H | U, D | teachback (short) | R-EXP (expectation 0) | low |
| C34 | new protégé arrives | H | U, D | teachback | R-EXP | low |
| C35 | misconception trap level | I game | K, M (U if a predict commit) | mcqK / predict | host re-grade + R-OPT | veryLow |
| C36 | graduated-prompt new item | I | K | item.open (C0-C4) | R-KEY | low |

### 4.2 Grading operators (`server/comprehension/grade/*.js`)

| op | how | output | cost |
|---|---|---|---|
| **R-KEY** | code: the shared Hindi/English number normaliser (numerals, number words incl. irregulars, ₹, units, fractions as `MathValue`), exact or tolerance match; the kit solver checks child-made numbers (C18, C27) | correct / wrong / NA | 0 |
| **R-OPT** | code: chosen option → `correct` or its `misconceptionId` (kit `diagnostic.options`) | key / misc-id / other | 0 |
| **R-CATCH** | code: accepted or rejected the planted step, located it, fixed it; R-EXP judges only the reason | caught_fixed / caught / missed | 0 (+1 call) |
| **R-EXP** | closed-label LLM, **one expectation per call**: `{present, partial, absent, contradicted}` plus a quoted span; coverage = share present | why / teachback outcome | 1 call per expectation |
| **R-MIS** | retrieve → rerank into the kit's closed misconception list (papers M3); needs a span; a **detection** that only schedules a verifier | candidate misc-id | 1 call |
| **R-INST** | closed-label LLM `{valid_instance, invalid_misc, irrelevant}`, then code checks the kit's verified `instances[]`; valid unknown instances go to a human review queue, never straight into the kit | instance verdict | 1 call |

**Closed-label contract** (every LLM operator):
```ts
interface ClosedLabelRequest { op: 'R-EXP'|'R-MIS'|'R-INST'; childSpan: string /* the child's turn(s) only */;
  target: { id: string; textEn: string; textHi?: string } /* one kit expectation / misconception / concept */;
  labels: readonly string[]; lang: string /* the child's live mix, e.g. 'hi-Latn+en' */ }
interface ClosedLabelResult { label: string; span: string | null; graderVersion: string; model: string; ms: number }
```
- **Blind.** The request carries the child's span and the kit target only: never the teacher's turns, the child's
  confidence, previous verdicts or the child's name (EduFrameTrap sycophancy [V]).
- **Span check in code** (E6): a transliteration-aware substring of the child's transcript. If it fails, the label
  becomes absent (positive verdicts only).
- **Schema or parse failure → NA**, never wrong. Low ASR → NA (rule 0); prefer a tap fallback.
- **Language.** Meaning is judged in English, Hindi or Hinglish alike. Discourse markers ("matlab", "na", "achha")
  are not hedges. A Hinglish answer to an English prompt is never a fail on T3-T5. Only T2 English-vocabulary items
  make the answer's language the target.
- **Model routing** (Azure Foundry, Direct only, `server/models/router`): primary **DeepSeek-V4-Pro** (12/12, p50 822
  ms in `model-bakeoff-BC-2026-10-02`), fallback **gpt-5.6-sol** (11/12, 1,394 ms), then Mistral-Large-3. n = 12, so
  this is a direction, not a choice: the M-GRADE κ gate per language decides. Moderate reasoning effort, one sample
  (more effort helps, ensembling 1→7 does not [V via papers #14]). Off the reply path: verdicts land within the next
  turn. The why's *move* goes out at once; only the evidence waits.
- **Calibration gate.** κ ≥ 0.7 against 300 human-labelled Indian-child turns per family, stratified English and
  Hinglish, before an operator's LR leaves the 0.7-diagonal prior. Every verdict stores `(op, graderVersion, model,
  label, span, spanOk)` in `grade_audit`, which the nightly job uses to refit M.

### 4.3 Kit fields the operators need (kit schema, blind-verified; lint fails a kit that lacks them for a shape it enables)

`expectations[]` (EN required, HI recommended) · `misconceptions[].{belief, signs, diagnostic.options, characterView (C09), myth
(C11), coincidentItems, remediation[] (ReteachArmSpec, §5)}` · `instances[]` (R-INST) · `counterfactual` stem per T3 topic
(C17) · `weaveHosts[]` and `hostNovel` per item template (§3.5) · `representations[]` per item (repFluency) ·
`interestContexts[]` that change the structure, not only the names (Walkington [S]).

### 4.4 The protégé is held in code (`probes/protege.js`)

```ts
interface ProtegeState { characterId: string; skillId: SkillId; heldMisconception: MisconceptionId | null;
  phase: 'confused' | 'asked_why' | 'corrected' | 'returned'; correctedBy?: string /* evId */ }
```
The held misconception is frozen until a correction is graded `caught_fixed` (R-CATCH) with a reason graded
`present` (R-EXP). The LLM only voices the character's lines from shapes. It cannot "get it" sycophantically
(AlgoBo [S]). The character is openly pretend, and planted errors are always resolved in the same exchange (honesty
rule).

---

## 5. Re-teach selector: using this child's representation history

### 5.1 Triggers (from the belief, never from one wrong answer)

`misconception_confirmed` (M* ≥ 0.85 verified) · `wheel_spin` (≥ 6 opportunities without 3 C0 in a row: warn; 10:
change) · `two_fails_post_rung3` · `u_low_after_practice` (does = true, U ≤ 0.1 after ≥ 2 U probes: the shallow
child) · `transfer_fail` (T ≤ 0.1 after a near-transfer fail with K high) · `delayed_fail` (state 2 of the ladder →
recap, RT9). Voice and vibe never trigger one (CE8).

### 5.2 History the selector reads (knowledge, not style)

| record | table | written from | used for |
|---|---|---|---|
| `ReteachAttempt` (arm, repClass, representationId, surfaceId, trigger, outcome) | `reteach_attempts` | every re-teach, with the outcome resolved asynchronously | exclusions (RT1), "worked before" recap (RT9), no surface repeats in 30 days |
| `RepFluency.pRead` per representation | `rep_fluency` | P14 / C28 / C29 items and host-graded engine facts (number line placement, bar reading) | gate: an arm whose representation has pRead < 0.5 must teach the representation first (RT4) |
| CPA position of the last failure | derived from attempts | | step down from abstract after a failure; fade up before transfer (RT5) |
| relapse-prone misconceptions | misconception rows (`hits` after `resolvedAt`) | | counter-example arms first; earlier delayed check |
| prior level | ledger pL band | | expertise-reversal gate (worked or faded examples for low prior) |
| per-child arm affinity | — | **M3 only, after the HTE gate** | not at launch (RT3e, LM9) |

### 5.3 Selection (`server/comprehension/reteach.js`, pure, deterministic given state and seed)

```
selectReteach(trigger, skill, mis?, child):
 0 safetyFired → none
 1 delayed_fail ∧ an arm resolved this skill for this child → RECAP via that arm's representation + 1 retrieval item
 2 E ← kit arms (skill, mis) ∪ generic arms; filter band, expertise gate, language (language_switch only if the child's
     observed mix has Hindi, never first), device tier, time, counter-example where flagged
 3 exclude: arms used this lesson; repClasses that failed in the child's last 2 attempts on this skill; classes that
     failed twice on this concept family in 30 days (unless E is empty: logged); pRead < 0.5 representations
 4 ≥ 2 distinct failed arms this session → PREREQ_DESCENT to the weakest prerequisite with pL < 0.5; ≥ 3 → park, schedule a
     spaced re-teach with the excluded-class list, tell the Conductor
 5 CPA: last failure at A → prefer P or C; transfer_fail after a C success → fade-up arm + second-context transfer probe
 6 first re-teach of a confirmed misconception → the kit primary arm (deterministic, PZ A4)
 7 otherwise TS-PostDiff over eligible arms (population posteriors, partial pooling, exploration floor 0.2)
 8 top two within 0.05 → offer the child a two-way pick (voice tie-break may order the two options, lighter first)
 9 emit PedagogyDecision{move: 'reteach', armId, representation, engine, shapeId} + style suppression (§6.5)
```
**The two questions reteach-personalisation left open, resolved here:**
1. **Randomisation starts only at the second re-teach** (the first stays the kit primary arm). That keeps PZ A4's
   intent, which is never to gamble on the first fix for a known bug, and still gives the bandit its data. This is
   recorded as a decision with its own reversal condition.
2. **The kit schema change** (`remediation` → `ReteachArmSpec[]`, at least 3 classes per misconception) is
   **required**, and the loader accepts the old single-fix form. A single-arm kit simply never reaches step 7. It is
   logged as an open owner item, because it adds kit-authoring cost across every subject.

### 5.4 Credit and the re-check

- Reward for the bandit (RT7): `0.3·repaired_now + 0.3·resolved_next (unaided isomorph) + 0.4·resolved_delayed (covert
  probe ≥ 1 day, misconception absent)`. An induced bug scores 0; a contaminated attempt is dropped. With only the
  immediate parts, an arm is capped at 0.6.
- After a re-teach, the next check on the facet that triggered it uses a **different family** from the one that
  failed. That separates "fixed" from "learned to pass that shape" (conversation-probes §6.4), and it goes into the
  weave queue for a delayed check.
- `ReteachAttempt.outcome` resolves from the ledger (`resolved_delayed` = a C31/C32/C34 success, or the misconception
  is resolved with its delayed check passed).

---

## 6. Vibe-adaptive persona adapter (`server/comprehension/vibe/adapter.js` → `server/compiler`)

### 6.1 Inputs (closed list; all session-scoped in M1)

| input | source | notes |
|---|---|---|
| explicit preferences (child said, parent set) | `ExplicitPref` (LM §6.6) | removal honoured at once; an addition after a one-turn confirm, within the band ceiling |
| barge-ins per 10 turns; "tell me more" requests | turn events | turn length |
| onset latency on think-questions (z per child); `slowerPace` signal | `voice/features.js` | wait knobs only |
| humour uptake: the child builds on or starts humour; laughter tokens; "no jokes" | transcript acts | humour dose |
| child's own register: address terms used, terse vs chatty, diminutives accepted or rejected | transcript | register, address |
| accepts "harder" offers ≥ 3 of 5; retries after an error ≥ 0.7 | choice events | challenge framing |
| interest tags said **this session** (tier-B memory only under P3 + counsel) | MI acts | example domain |
| live code-mix (CMI, matrix language) | LM §6.9 | language mirror |
| engagement state (`strained`, `disengaging`) | LM §6.7 | strain suppression |

Excluded: any emotion label, any trait or personality inference, gender, any camera signal, and everything about
other children.

### 6.2 Knobs and bounds

| knob | values / range | band defaults (B1 · B2 · B3 · B4) | moves on | bound |
|---|---|---|---|---|
| `waitNudgeSec` | base…cap | 6 · 5 · 4 · 4, cap 8 (B1-B2) / 6 (B3-B4) | slower onsets, `slowerPace`, accommodations | never below base |
| `endpointSilenceMs` | ±30% of the band default | VAD defaults | continuation after a cut-off | |
| `teacherTurnWords` | soft target [lo, hi] | 10-18 · 12-18 · 14-25 · 16-25 (`TURN_WORDS` 18/25 are the caps) | barge-ins → shorter; "tell more" → upper third | lower third on re-teach turns |
| `humourDose` | off · light | light (off when strained) | uptake / "no jokes" | ≤ 1 item per 10 min, ≤ 2 per lesson; never within 2 turns of an error; never about the child; reviewed asset bank ids only |
| `register` [U, new] | playful · warm · matter_of_fact | playful · warm · warm · warm | the child's own register; explicit | B1-B2 never matter_of_fact; teacher uses tum, never tu |
| `address` | closed set {didi, ma'am, miss, sir, bhaiya, teacher, name}; teacher → name or name+beta (Cl 1-6) | name+beta · name+beta · name · name | child's usage; explicit | English-medium default `name` until VT M4 measures otherwise |
| `exampleDomain` | interest taxonomy id or none | none | session interest tags | faded before any transfer probe; never on a misconception's first re-teach; banned categories never inferred |
| `challengeFrame` | standard · dare | standard | accepts harder ≥ 3/5 | B3+ only; never on a re-teach's first item; off when strained |
| `energy` | calm · warm | warm | strained → calm | never "bright" during a re-teach |
| `languageMix` | mirror the child within 0.2 | parent tile | live CMI | key curriculum terms in English in every mix |
| `probeSkin` | character skin id | band-appropriate | humour, register | never changes a rubric |

**Precedence** (LM §6.6): invariants and safety → strain suppression → explicit preferences (parent ceiling, then
the child within it) → session state → slow knobs (M3) → band defaults.

### 6.3 Update rules

- A session knob moves **one step** after 2 consistent signals within 10 turns. At most one non-explicit step per 10
  minutes. It reverts toward the default on 2 contrary signals. Explicit removals apply the same turn.
- Slow knobs (cross-session) only in M3: Beta arms with prior strength 4, 60-day half-life, a step only after 2
  sessions on 2 distinct days with posterior > 0.9, `N_FLOOR = 8` (LM §6.6).
- The reward for any learned knob is engagement (voluntary continuation, return next day), bounded so that it can
  never cost learning: y_delay must not drop (RT10, PZ2). Knobs are never rewarded on learning outcomes they cannot move.

### 6.4 Compiled output

```ts
export interface VibeDirective {            // LM §6.6, extended
  waitNudgeSec: number; endpointSilenceMs: number; turnWords: [number, number]; humour: 'off' | 'light';
  register: 'playful' | 'warm' | 'matter_of_fact'; address: { childCallsTeacher: string; teacherCallsChild: 'name' | 'name+beta' };
  exampleDomain: string | null; challenge: 'standard' | 'dare'; energy: 'calm' | 'warm'; probeSkin: CharacterSkinId | null;
  suppressed: boolean /* true on re-teach turns */ }
```
`compile()` gains a `vibe` section between `lesson` and `move` (the tail order of LM §9.3: VIBE → PEDAGOGY NOW → SAFETY →
TURN SHAPE last), cap 60 tokens, drop priority 4. It is rendered as **one key=value row of shapes**, never as sentences:

```
VIBE turn 12-18 words · humour light · register warm · address name+beta · examples cricket · challenge standard · energy warm
```
Pace knobs (`waitNudgeSec`, `endpointSilenceMs`) go to the session config, not the prompt. The `BudgetError`
behaviour stays: if the section overflows, it sheds or throws; it never truncates.

### 6.5 Re-teach suppression and invariants

On a `reteach` move: humour off, turn words at the lower third, energy calm-warm, no decorative interest detail (an
interest skin only if the arm allows it), the representation on screen before the first sentence about it, and
`suppressed = true` in the log.

Invariants:
- **VI-1** Permuting every vibe input leaves the belief, the mandatory probe set and the re-teach arm identical,
  except the step-8 tie.
- **VI-2** No child-facing or parent-facing string contains a trait, style or emotion label (RTI10).
- **VI-3** Humour items = 0 on re-teach turns and within 2 turns of an error.
- **VI-4** The `VIBE` row contains only closed-vocabulary values.
- **VI-5** Strain suppression beats an explicit "more jokes".

---

## 7. Parent-facing "how we know"

### 7.1 One card per concept: evidence rows, not verdicts

Rows are shapes with slots, rendered by code in the parent's language (EN / HI / Hinglish). Every row expands to its
evidence ("Kaise pata?"), built from `belief.reasons`.

| internal state | parent row (EN shape) | Hinglish shape | shown when |
|---|---|---|---|
| not_yet (no misconception) | "Started ⟨concept⟩ this week." | "⟨concept⟩ is hafte shuru kiya." | ≥ 1 teach event |
| not_yet (misconception verified) | "Working on a common mix-up: ⟨belief, plain words⟩. Being checked." | "Ek aam confusion par kaam: ⟨belief⟩. Check ho raha hai." | p ≥ 0.85, verified |
| shallow | "Gets the answers on her own. Next we'll check that the idea behind them is clear." | "Answers khud se sahi. Ab dekhenge ki idea bhi clear hai." | does = true |
| fragile | "Explained it in her own words on ⟨date⟩. We'll check again in a few days." (+ "due for a quick refresh") | "⟨date⟩ ko apne shabdon mein samjhaya. Kuch din baad phir dekhenge." | U ≥ 0.6 |
| understood | "Still had it ⟨n⟩ days later, and used it in a new kind of problem." | "⟨n⟩ din baad bhi yaad tha, aur naye tarah ke sawaal mein lagaya." | state = understood |
| durable | "Kept it for a month." | "Ek mahine baad bhi pakka." | **K7 gate only** |

Before K7 passes (≥ 0.9 delayed accuracy at 1 and 4 weeks, ECE ≤ 0.05, n ≥ 200 children), no row uses *mastered*,
*learned*, *understood* or *can do*. The rows above already describe behaviour, not certified states.

### 7.2 Evidence chips (from `BeliefReason`)

`⟨date⟩ · ⟨what she did, from shapeId: "explained it to Golu the robot" / "spotted the mistake in a friend's work" /
"used it inside a new problem 3 days later" / "predicted what would happen before we showed it"⟩ · ⟨help: on her own /
after one hint / with a worked step⟩ · ⟨checked by: exact answer / AI-checked against the book's key idea / a
teacher⟩`. Parents can tap to see the child's own words (≤ 12 words, kept only while the transcript exists).

### 7.3 Rules

- **Banned in parent text** (LM §11 lexicon gate, EN + HI + Roman HI): rates of solo outcomes, engagement, mood,
  effort, personality, "weak/kamzor", "slow", rank, percentile, comparisons, predicted marks, voice-feature anything.
- **Transparency.** Onboarding and the report footer say in plain words that understanding is checked through
  conversation, games and later callbacks rather than tests, that the characters are pretend, and that planted
  mistakes are always corrected. Covert means not shaped like a test. It never means deceptive.
- **The child can see the same card** (a "what my parent sees" screen, MI R5.45).

---

## 8. Evaluation with the STUDENT-SIM harness

### 8.1 Persona extension (`evals/sim/card.ts`, additive)

```ts
knowledge[skillId].comp: {
  U0: 0 | 1; T0: 0 | 1;                 // bkt2: hidden bits at t0 (K is the existing L0)
  uLearn: number; tLearn: number;       // P(bit 0 → 1) per targeted re-teach (gain tables author/flat/inverted)
  keep: number;                         // P(retained at ≥ 20 h); cfrag: from fragileHalfLifeMin
  verbal: number;                       // P(says it | U = 1): verbal-weak understanders give partial/none (M-VERB)
  deference: number;                    // P(accepts a planted error | U = 1)
}
```
Under `cfrag`: U = 1 iff the dominant strategy is the concept's (not a surface heuristic), and T = 1 iff
`gammaSurface < 0.3`. Truth types: `not_yet`, `shallow` (the correct-answer trap, with an overt or trap bug),
`fragile_bound` (U without T), `fragile_forgets` (U, T, low keep), `understood`, and `durable` in G4 multi-day runs.
Covering-array factors gain `verbal` {low, high} and `deference` {low, high}.

### 8.2 Metrics (scope `compliance` unless noted; both truth families × three gain tables)

| id | metric | definition | bar [U] |
|---|---|---|---|
| CE-M1 | detection accuracy | macro accuracy of the final state vs the truth type, after 3 and 5 simulated sessions | ≥ 0.70 at 5 sessions, both families |
| CE-M2 | time to detect | sessions (and probes) from the first opportunity until state = truth and stays | median ≤ 3 sessions for `understood`; report the curve |
| CE-M3 | false mastery | P(state ∈ {understood, durable} \| truth ∉ them); shallow-specific line | ≤ 0.05 overall, ≤ 0.02 shallow (R2b-aligned) |
| CE-M4 | missed understanding by verbal ability | P(state ≤ shallow \| understood) for verbal-low minus verbal-high cards | ≤ 10 pp gap |
| CE-M5 | perceived test load | observer-coded cues per 10 child turns: known-answer questions, repeated question, evaluation lexicon, consecutive probes, "samjha"; compared with the band cap | ≤ cap; repeats = 0; lexicon = 0 (invariant) |
| CE-M6 | facet calibration | ECE of U and T vs truth bits on held-out delayed probes | ≤ 0.10 (bkt2); report cfrag |
| CE-M7 | isolation | R2h-I extended: facets, mandatory probe set and arm choice (outside the tie band) byte-identical under permuted vibe/voice/timing | identical (invariant) |
| CE-M8 | re-teach | R3a-R3h (latency ≤ 4, diversity, resolution precision ≥ 0.8, induced bugs ≤ 5%, repeat-failed-class = 0, exploration ≥ 0.2, descent latency ≤ 1) | as stated |
| CE-M9 | grader leniency | R4c per operator, with a simulated grader at κ 0.55 / 0.7 / 0.85 | code 0; LLM within its M |
| CE-M10 | facet value (pilot) | AUC of predicting delayed far-transfer success from pL vs pL + U + T | U/T must add ≥ 0.02 (else CE2 reverses) |

### 8.3 Controls and mutants (a run is valid only if each lands on the right side)

| control | does | must |
|---|---|---|
| `oracle-prober` | reads truth, asks the most informative eligible probe | near-ceiling CE-M1/M2 (defines 100%) |
| `quiz-bot` | 4 overt items per concept-session, K-only mastery rule | **fail CE-M3** (computed 0.862 shallow → understood) **and CE-M5** |
| `lecture` | teaches, never probes | fail CE-M1 |
| `samjha` | asks "samjha?" and advances on yes | fail CE-M3 and CE-M5 |
| `why-every-turn` | a why after every answer | fail CE-M5 |
| `no-delay` | never schedules delayed or woven checks | never reaches `understood`; fails CE-M2 under `cfrag` forgetters |
| `freeze-low` | stops probing a facet once it reads low | worse CE-M1 than the real scheduler (computed 0.580 vs 0.639) |

Mutants (each must be caught by at least one invariant): **VC1** voice z feeds U (fails CE-M7); **VC2** `partial`
scored as `full` (fails CE-M3); **VC3** grader request includes the teacher's turn (fails CE-M9 under the
`confident_wrong` card); **VC4** game w = 1 and no E4 (fails CE-M3 under `gamer` and rank-exploit policies);
**VC5** a woven sub-step emits two events (fails the one-event property); **VC6** a missing span accepted (fails CE-M9);
**VC7** a mandatory probe deferred by strain (fails BE2).

### 8.4 What the pre-simulator check covers and what it does not

`comp-engine-calc.mjs` (§0.1) is a matched-model Monte Carlo. It has independent latent bits, no learning within
sessions, no verbal or deference confounds and no ASR noise. It sets the starting thresholds and shows two
structural facts: the K-only rule fails, and code-graded U probes plus two U probes a session are needed. Its
numbers are upper bounds and say nothing about children. The STUDENT-SIM batteries (G5-stub on every Director or
learner commit, G5-sim at release, G4 multi-day for durability) replace it once `evals/sim/` exists.

### 8.5 What only real children can answer

E-COVERT (each family's LR against delayed items and an end-of-unit overt diagnostic; drop a family whose LR < 1.5
after n ≥ 200 child-episodes) · E-FRAME (covert vs overt framing of the same item, by anxiety proxy) · M-PT
(three-face "test / game / chat" tap after sampled sessions; < 15% "test" per family) · M-GRADE (κ ≥ 0.7 per
operator × language) · M-DEF and M-VERB · VF-M1 (does any voice feature add ≥ 0.03 AUC within skill) · CE-M10.

---

## 9. Build list (order, size, gate)

| # | item | files | size | gate |
|---|---|---|---|---|
| 1 | Contracts: `via, ebo, shapeId, weaveHost, coincident, unfamiliarContext, deferenceDiscount, spanOk`; `ComprehensionBelief`, `ProbePlan`, `WeaveEntry`, `ClosedLabel*`, `VibeDirective` ext., `ReteachArm`/`ReteachAttempt`/`RepFluency` | `shared/learner.ts`, `shared/contracts.ts` | S | `tsc -b` |
| 2 | Facets in the fold (U, T; gate, temper, 1/j, ±log 20, teach transition) + `ledgerDigest.comp` | `server/learner/kt/facets.js`, `ledger.js` | M | replay = online; drops change no byte; LR(best) ≥ 1 for all R; existing KT tests unchanged |
| 3 | State ladder + `beliefView` | `server/comprehension/state.js` | S | CEI1-CEI6 property tests |
| 4 | Shape registry (36) + lint | `server/comprehension/probes/shapes.js` | M | each record names a kit input, a class and an operator |
| 5 | Grading operators (code) + closed-label client + span check + `grade_audit` | `server/comprehension/grade/{ops,closed,span}.js` | M | R-KEY tables for EN/HI number words; schema-failure → NA test |
| 6 | Scheduler (mandatory, VOI, budget, stop rule) wired into the Director | `server/comprehension/schedule.js`, `budget.js`, `server/director/state.js` | M | B-ENG BE1/BE2; no planted error before `learned_today`; no back-to-back probes |
| 7 | Weave queue + Conductor host hook + Forge `want.subSkill` | `server/comprehension/weave.js`, `server/conductor/planner.js` | M | one-event property; ≥ 20 h; topicsSince window |
| 8 | Protégé state | `server/comprehension/probes/protege.js` | S | frozen until caught_fixed + present |
| 9 | Re-teach selector + bandit + repFluency | `server/comprehension/{reteach,bandit}.js`, `server/learner/repfluency.js` | M | RTI1-RTI10 |
| 10 | Vibe adapter + `vibe` compile section | `server/comprehension/vibe/adapter.js`, `server/compiler/compile.js` | S | G1 budget; VI-1…VI-5; TURN SHAPE stays last |
| 11 | Parent rows + evidence chips | `server/comprehension/report/howweknow.js`, `routes/parent.js` | S | lexicon gate EN/HI/Roman HI |
| 12 | Kit schema: expectations, misconceptions{characterView, myth, coincidentItems, remediation[]}, instances, counterfactual, weaveHosts/hostNovel, representations | `data/kits/SCHEMA.md`, kit lint | M (+ authoring) | blind verification |
| 13 | Migration `00X_comprehension.sql`: `reteach_attempts`, `rep_fluency`, `arm_posteriors` (no child id), `weave_queue`, `probe_log` (shape, skill, session: novelty + M-PT), `grade_audit` | `db/migrations/` | S | erasure cascade; mode ratchet test |
| 14 | Sim extension + metrics CE-M1…M9 + controls + mutants | `evals/sim/**` (never in the same commit as app code, SIM10) | L | §8.3 controls land correctly |

Order: 1 → 2 → 3 → 5 → 4 → 6 → 8 → 7 → 9 → 10 → 11; 12 runs in parallel in the kit workflow; 14 starts with 2.
The gates in CLAUDE.md (`npx tsc -b && npx vite build && npm test`) apply to every step.

**Invariants (eval predicates):**
- **CEI1** No voice, vibe or engagement value is an input to facets.js or state.js.
- **CEI2** state ≤ ledger display (understood ⇒ mastered; durable ⇒ durable).
- **CEI3** `understood` needs non-game U and T evidence.
- **CEI4** No positive U/T update from a coincident correct answer, a partial, or a span-less positive.
- **CEI5** One child answer → at most one event per skill.
- **CEI6** Absence never lowers a state.
- **CEI7** No banned lexicon in teacher or parent text.
- **CEI8** No repeated question on the same item outside the hint ladder.

---

## 10. Open items for the owner

1. **Certification speed vs false mastery.** Under launch tables the engine certifies about 41% of real understanders
   by session 3 and about 60% by session 5, with ≤ 2.2% false certification [C, upper bound]. The alternatives are more
   probe load or looser thresholds. Recommendation: keep it, and let EM refits on delayed items speed it up.
2. **Kit schema change** (§4.3, §5.3): required for re-teach steps 6-7 and several shapes. It adds kit-authoring cost.
3. **Second-re-teach randomisation** (§5.3): adopted. Reverse only if the owner wants zero randomisation on
   misconceptions, in which case the bandit learns from generic arms only.
4. **`register` knob** (§6.2) is new beyond VT's v1 set. It is bounded and closed-vocabulary, but it needs VT-style
   M4 measurement for English-medium children before it leaves `warm`.

## 11. Measurement backlog (log each with n, method and date when run)

CE-M1…M9 (simulator, before the scheduler ships) → M-GRADE (300 turns per family × EN/Hinglish; unblocks LLM LRs) →
M-PT and M-DEF (first pilot week) → E-COVERT and CE-M10 (≥ 200 child-episodes per family; unblocks keeping U/T) →
E-FRAME → VF-M1 (voice features) → RT-M2 (arm MRT) → K7 (parent wording).

## Sources

Every literature claim is cited in the sibling documents this spec consolidates: `papers-2025-2026.md`,
`products-live.md`, `game-stealth.md`, `conversation-probes.md`, `reteach-personalisation.md`,
`learning-science.md`, `learner/LEARNER-MODEL.md`, `learner/STUDENT-SIM.md`. Computed values: `comp-engine-calc.mjs` and
`comp-engine-calc-2026-10-02.json`. Model latencies and accuracies: `context/measurements.md#model-bakeoff-BC-2026-10-02`.
