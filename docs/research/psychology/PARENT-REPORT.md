# Taxila Parent Report Specification: weekly, monthly and term

**Date:** 2026-10-02 · **Status:** synthesis v1, for the Conductor parent loop (`conductor/parent-loop.md`, PL) and the parent surfaces (`design/parent-experience.md`, PX). · **Scope:** parents of children in classes 1-9 (ages ~6-15).

**This file supersedes `parent-reports.md` (PR) §4-§8 wherever they differ.** PR keeps the evidence review and is still the source for the evidence behind each decision. This file folds in the PR methodologist review (R1-R15, C1-C18) and the reviewed thresholds of the sibling psychology documents. It also folds in the new computations in `research-program-synthsim.py` (§A, §B, §F). Construct ids refer to `RESEARCH-PROGRAM.md` §3.

**What it specifies:**
1. the sections of each report and the construct that feeds each one;
2. the thresholds before anything is claimed;
3. the uncertainty language rules;
4. the banned claims;
5. the layouts (ASCII wireframes);
6. the generation pipeline: structured data → gate → a writer constrained to cited evidence → validators → render.

**Two laws inherited from the html-portfolio products apply throughout:**
- **Anything sentence-shaped in a prompt gets recited.** Every shape below is written as a slot pattern ⟨…⟩, not as a sentence. Wireframes are layouts and are never pasted into a prompt.
- **Safety by predicate, not instruction.** Every rule that matters is a code check.

---

## 0. Decisions on one screen

| # | decision | why (evidence) | what would reverse it |
|---|---|---|---|
| RR-D1 | **The report is an intervention on the parent and is evaluated like one** (= PR-D1). Its success measures are: calibrated parent beliefs, autonomy-supportive parent behaviour, and the child's delayed learning and wellbeing. Parent satisfaction is not a success measure. | Feedback is large on average and highly heterogeneous (Wisniewski 2019, d = .48 [V]). Detailed information corrected parents' beliefs and raised achievement (Bergman 2015 [V]). Barnum text is liked whatever its truth (Forer 1949 [S]). | Never for the principle. |
| RR-D2 | **Fact-first by design.** Most of every report is L0 counts and L1 ledger facts. L2 patterns and L3 change are rare, and the layout expects them to be rare. | *Computed* (synthsim §A): with a calibrated two-groups prior, realistic data (12-40 comparisons per arm) admit 0-1.5 within-child pattern claims a month and find only 0-16% of real effects. Time to first claim (§F): calibration tables ~8 weeks, durability ~27 weeks, at 4 sessions a week. | PRM5 shows that higher-yield gates stay calibrated on held-out delayed checks. |
| RR-D3 | **Describe learning and actions in situations, never the learner.** Compare the child only with herself and the syllabus (= PR-D2, PR-D3). | Person praise and identity framing predict entity beliefs and lower persistence (Pomerantz & Kempner 2013 [V]; Rhodes 2019 [V], for *girls'* persistence, C7). Peer comparison caused quitting in adults (Rogers & Feller 2016 [V], adult MOOC, C5). | Never. |
| RR-D4 | **Every pattern or change claim passes a code gate and a report-level false-claim budget.** Posteriors come from a **two-groups (spike-and-slab) hierarchical model per menu item**. Each section has a fixed, pre-registered menu of at most 6 candidate claims a month, and the number screened is logged. The budget Σ(1 − Pᵢ) ≤ ε is validated on simulated nulls and sparse mixtures before launch. | PR review R1. *Computed* §A: independent weak priors put 4.9 false claims in a null report while the budget believed 0.2. Normal-normal pooling believed 0.17 where there were 2.22. Two-groups pooling believed 0.12 where there were 0.10. | PRM5 calibration on real held-out delayed checks. |
| RR-D5 | **Counts plus five fixed frequency words.** Never percentages, adjectives or scores. *Pakka* is reserved for the mastery state. "About half the time" needs n ≥ 20, and the most specific word wins a tie. | Verbal probability terms are read inconsistently (Wintle 2019 [V]). Numbers cost little trust (van der Bles 2020 [V]). PR review R10 on minimum n and overlaps. | PRM6 shows parents misread the count format more than words. |
| RR-D6 | **No per-child "how she learns best" claim in v1.** The section shows the population-best formats Taxila uses for each topic type, what the child *chose* (labelled as preference), and an active "Trying" comparison when one is running. | LAM-D7: ρ = .70 needs 78-487 delayed comparisons per arm. Format allocations from a bandit or the child's choice are biased (PR R5). Style matching fails the crossover test (LS §2). | LAM3 shows τ ≥ .5 logit for some format × topic-type pair, *and* the child accumulates enough randomised comparisons. |
| RR-D7 | **No causal word without a manipulation.** "What helped", "because" and "works better for her" appear only for moves allocated by micro-randomisation with logged propensities. Otherwise the line is a count with no comparison. | PR review R4 (policy confounding by indication). | None. |
| RR-D8 | **No time-of-day claim from ordinary data.** Within-session patterns appear only as *population* design notes, not facts about this child. A time-of-day line appears only after a parent-opted n-of-1 alternation, with a directional rule and a precision requirement. The expected individual result is "no detectable difference". | PR review R6 and R7: the two-sided rule fired in 19% of null families. Break effects are endogenous. Clock time is confounded with who holds the phone (RP-D8). | Never for observational time-of-day claims. |
| RR-D9 | **One home action per report.** It is a talk, listening or everyday task, never homework help or checking. It is paired with a process cue ("name what she did, then ask how") and, after any parent-entered result, a failure-response cue (= PR-D9). | How parents are involved matters more than how much (Moroni 2015 [V]). Behavioural involvement such as checking homework was less effective (Pinquart & Ebeling 2020 [V], C12). Parents' failure mindsets reach children (Haimovitz & Dweck 2016 [V]). The process cue is grounded in *information value*, not mindset change (C9: Li & Bates 2019; Macnamara & Burgoyne 2023). | PL6 reversal measures (PLM3, PLM5). |
| RR-D10 | **Pressure-proof by construction** (= PR-D10): no countdown, predicted mark, "behind", rank, risk score or aspiration talk. An exam shape applies inside confirmed test windows. A failure-response card follows every parent-entered result. | Pressure turns mothers controlling (Grolnick 2002, experimental [V]). Higher expectations predicted more anxiety a year later in German grades 5-10, while the same-year association was positive (Sakaki 2026 [V], C13). Indian exam stress is high (Deb 2014 [V]). | Never. |
| RR-D11 | **No trait, type, diagnosis, attributed emotion or personality wording at any layer.** Enforced by lexicon, semantic and structure predicates. | The label ban rests on accuracy (Taxila cannot diagnose) and precaution. Kashikar 2023 was a *null* replication of label effects (C1). Essentialism risks (Haslam 2004 [V]; Rhodes 2025 [V]). | Never. |
| RR-D12 | **Three cadences.** Weekly: ≤ 5 lines and 60-90 s of voice. Monthly: the psychology report and PTM agenda. Term: a learning story with an HPC-compatible competency page. The weekly dose is **[U] for classes 1-9**, because the dose and timing studies are early-childhood (C3) or high-school credit recovery (C4). | Cortes 2021, Doss 2017 and Doss 2022 [V] are parents of 4-5-year-olds. Kraft & Rogers [V] is high-school credit recovery. | PRM8 (open rates) and the R-REPORT cadence arm. |
| RR-D13 | **"Kaise pata?" on every line, and "what would change our mind" on every L2/L3 line** (= PR-D13). | Transparency barely dents trust (van der Bles 2020 [V]). | PRM2: comprehension < 60% → simplify, but keep the link. |
| RR-D14 | **Validity is tested predictively, not by parent recognition.** A section ships only if its claims predict the child's own held-out behaviour better than a *synthetic* decoy section does. Parent recognition is secondary and is read alongside the parent's prior beliefs. | PR review R8: recognition rewards echoing the parent. Using another child's record as a decoy discloses that child. | Never for the test. |
| RR-D15 | **Adolescent autonomy.** For B4 (13-15), sections S6-S10 reach the parent only with the adolescent's opt-in. The default is competency rows plus the home action. The child sees what the parent sees. | PR review D1. Disclosure, not surveillance, carries the benefit (Stattin & Kerr, via PL [V, sib]). | An R-REPORT arm shows opt-in reduces benefit without reducing harm. |

### What changed from `parent-reports.md`

| PR element | status here | reason |
|---|---|---|
| independent weak priors (a₀ + b₀ ≤ 4) for the budget | replaced by a two-groups pooled prior, fixed menus and simulated-null validation | R1; synthsim §A |
| Spearman-Brown ρₙ ≥ .70 gate for L2 | replaced by a contrast posterior, distinctiveness, an in-deployment ρ ≥ .80 for level claims, and ≥ 70% claim-type re-appearance | R2; TV C3 |
| cross-domain "relative strength" shape | deleted | R3 (profile scatter replicates at chance) |
| "what helped" teaching-move row | randomised allocations only; otherwise counts | R4 |
| format "Found" / "no difference" lines | disabled in v1 | R5; LAM-D7 |
| within-session "{name}'s answers dipped after minute t" | population design note only; randomised break timing | R6 |
| n-of-1 two-sided rule | directional rule plus posterior SD < δ_min | R7 |
| anti-Barnum by parent recognition | predictive test with synthetic decoys | R8 |
| parent predictions {yes / not sure / no} | 5-point probability, proper score, skills not stated in reports, ≥ 3-item outcome | R9 |
| "about half" at n ≥ 10 | n ≥ 20, with a precedence rule | R10 |
| "her reasoning, shown as sensible" | hedged; diagnostic item set required | R11 |
| *Pakka* after 1 delayed success | ≥ 2 delayed successes on distinct items, or a KT posterior with slip and guess | R12 |
| calibration change line | removed in v1 (MS P9); later only difficulty-matched and model-based | R13; MS P9 |
| growth edges ≤ strengths | fixed cap (≤ 3 monthly) | R14 |
| level band ribbon (GE-like) | criterion-referenced outcome rows, plus a θ trajectory on an unlabelled scale at term | LOT R6 |
| B1 calibration table with normalising note | no B1 calibration table | MS E2 |
| per-kind help counts (answer requests) | not shown in v1 | MS E1 |
| "own questions, most about {topic}" at q ≥ 3 | counts; topic contrast only via a within-child cross-domain contrast | MH R14 |
| change after "≥ 3 windows" | RP-D6 term rule | MS P2; MH R8; synthsim §B |

---

## 1. What the report is for

**Four jobs** (from PR §3):
1. **Calibrate** parent beliefs in both directions.
2. **Channel** expectation and worry into autonomy-supportive action.
3. **Make learning visible as a process**, so difficulty reads as ordinary.
4. **Give hope backed by evidence**: then → now in the child's own record. The message is "practice helps every child; children who start behind usually need more practice". It is never "will close the gap" (LOT R18).

**Three harms to prevent:**
1. labels, including positive ones;
2. pressure;
3. Barnum text.

**Audiences:**
- the parent, who may be low-literacy or Hindi-only, and who often cannot check the maths. This is where expectancy risk concentrates: domains the parent cannot observe (PR C10);
- the child, who shares the phone (PX8: write every string as if the child will read it);
- the other guardian, who receives forwards;
- for B4, the adolescent, as a co-reader.

---

## 2. Cadence and section map

| # | section (title shown to parents) | weekly card + voice | monthly app + PDF + PTM agenda | term learning story | required? |
|---|---|---|---|---|---|
| S1 | header and the week in numbers | yes | yes | yes | required |
| S2 | **Strengths** | 1 line, first | first block, ≤ 3 | first block | required |
| S3 | **What {name} can now do** | ≤ 2 rows | ≤ 6 rows + chapter counts | all outcome rows + trajectory | required |
| S4 | **Holding up over time** | — | L0 counts; L2 rare | L0 + L2 + L3 | monthly optional |
| S5 | **How Taxila is teaching {name}** | "Trying" line only | population formats + her choices + Trying | the same + term summary | optional |
| S6 | **When it gets hard** | ≤ 1 line | counts + Taxila's actions | + change rows | optional |
| S7 | **Curiosity and interests** | ≤ 1 line | counts + question thread + tags | the term's question thread | optional |
| S8 | **How sure** (calibration, B2+) | — | the table, after the gate | the table | optional |
| S9 | **Routine** | 1 count line | counts + design note | + n-of-1 result if run | optional |
| S10 | **How learning with Taxila goes best lately** (style lines) | — | ≤ 6 gated lines with toggles | the same | optional |
| S11 | **The tricky part** (growth edges) | 1 | ≤ 3 | ≤ 3 + what resolved | required (monthly and term) |
| S12 | **At home this week** | 1 activity + praise cue | the month's plan + failure cue | the term plan | required (weekly and monthly) |
| S13 | **What we're trying next** | when an experiment starts | required | required | required (monthly and term) |
| S14 | **Then → now** | — | only at a term boundary, ≤ 2 rows | ≤ 4 rows | term |
| S15 | **A note about routine and rest** (wellbeing card) | when a threshold fires | when a threshold fires | — | conditional |
| S16 | fixed copy (cross-context note; what these reports are not; how to read "Kaise pata?") | — | once | once | required (monthly and term) |
| S17 | **exam shape** (replaces the weekly card in a confirmed test window) + failure-response card | inside a window | — | — | conditional |
| S18 | **her voice / your voice** (term) | — | — | B2+ quote (consented); optional parent line | term |

**Not in any report:**
- the flag-for-professional message, which has its own reviewer-gated channel (CD §7.3);
- safeguarding, which follows its own route (PL §8.3);
- research findings, which go on an aggregate page "on average" after publication;
- anything the child asked to keep private.

**Caps per report:**
- weekly: ≤ 5 lines and 60-90 s of voice;
- monthly: one screen per section and ~3 minutes of voice [U];
- term: 2-4 PDF pages and ~5 minutes of voice [U].

---

## 3. Construct → section matrix

This matrix is the contract between the estimators and the report. Anything not listed here never reaches a parent.

| construct (RESEARCH-PROGRAM §3) | section | highest level allowed | bands | earliest typical appearance (4 sessions/week, *computed* §F, [U] rates) |
|---|---|---|---|---|
| KT-1 skill state | S2, S3, S11, S17 | L1 | all | week 1 (*Aa gaya*); *Pakka* after the 2nd delayed success (~1-3 weeks) |
| KT-2 misconception (hedged) | S11 | L1 hedged | all | after a diagnostic item set passes |
| counted actions (`effortActions`: explained in own words, tried again, asked a question) | S2, S6, S7 | L0 | all | week 1 |
| LOT-C1 prior knowledge | S3 ("started at: {outcome}") | L0 curricular content | all | onboarding |
| LOT-C3 durability | S4 | L2 (rare), L3 (term) | all | ≥ 27 weeks per topic type; L0 counts from week 2 |
| LOT-C7 relearning | S4, S11 | L1 fact | all | after a break |
| LOT-C8 transfer | S2 (example), S3 | Example | all | when it occurs |
| LOT-C9 growth trajectory | S3 (term) | trajectory display only | all | term 1 (ribbon); no growth-rate statement < 12 months |
| CD-flu, CD-nl, CD-symcmp, CD-frac, CD-aksh, CD-pa, CD-orf, CD-vocab | S3 subrows | L1 facts; learning-metric change with a practice-adjusted RCI | per subject | month 1-2 |
| CD-reason, CD-strat, CD-flex (item version) | S2, S11 (examples) | Example | all | when they occur |
| CD-wm, CD-attn | S5 (teaching adjustment), S9 (population design note) | design note only | all | — |
| MS-S1 calibration offset | S8 | table (descriptive) | **B2+** | ~8 weeks per domain |
| MS-S4 self-correction | S6 | L0 counts | all | after MS5 passes |
| MS-S6 help (when stuck) | S6 | L0 counts, restricted (no per-kind answer counts) | all | ~1-2 weeks |
| MS-S7 planning, MS-S9 strategy choice | S6, S7 | L0 counts | **B3+** | after rubric agreement (S7); c ≥ 10 (S9) |
| MH-M1 self-initiated sessions | S9 | L0 counts | all (silent at extremes in B1) | week 2 (n ≥ 8 sessions) |
| MH-M2 interest | S7 | L0; contrast L2 | all | 2-3 weeks |
| MH-M3 challenge choices, ISP7 | S6 | L0; change L3 | all | ~5 weeks (n ≥ 10 offers) |
| MH-M4 / ISP6 unprompted retries | S6 | L0; change L3 | all | ~1 week (e ≥ 10) |
| MH-M9 regularity | S1, S9 | L0 | all | week 4 (D28) |
| MH-M12 compulsion markers | S15 | facts + one suggestion | all | when a threshold fires |
| ISP1, 2, 3, 8, 9 | S10 | L2 style line (gated) | all (B4 opt-in) | rarely before month 2-3; many never |
| PF-3 home-activity uptake | S12 | L0 (to the parent themselves) | all | week 2 |
| everything in RESEARCH-PROGRAM §3.8 | — | never | — | — |

---

## 4. The claim model and the gates

### 4.1 Claim object (extends PR §4.1)

```ts
// shared/parent/report.ts (proposed)
export type ClaimLevel = 'L0_count' | 'L1_status' | 'L2_pattern' | 'L3_change';
export interface Claim {
  id: string; section: SectionId; construct: string;        // RESEARCH-PROGRAM §3 id
  shapeId: string;                                          // an approved slot pattern (§5); never free text
  slots: Record<string, string | number>;                   // typed values from the ledger only
  counts?: { k: number; n: number };                        // behind any frequency word
  window: { from: string; to: string };
  scope: { subject?: string; topicType?: string; skillIds?: string[]; condition?: string; withTaxila: true };
  level: ClaimLevel;
  menuItemId?: string;                                      // the pre-registered candidate this claim instantiates (L2/L3)
  posterior?: number;                                       // P(claim correct) from the two-groups model (L2 contrasts) or level model
  reliability?: { rho: number; cardId: string };            // in-deployment card at this claim's interval (L2 level claims)
  distinctiveness?: number;                                 // P(|child − band default| > δ)
  replicationRate?: number;                                 // claim-type re-appearance in non-overlapping windows (PRM11)
  randomised?: { decisionIds: string[]; propensitiesLogged: true };   // required for any contrast with a causal reading
  systemExplanationsChecked?: string[];                     // schedule, item level, KC, grader, ASR, prerequisites (LOT §6.1)
  knobState?: string;                                       // the knob setting in force (ISP lines, TV R8)
  taxilaAction: string;                                     // required for L2, L3 and growth edges
  reviseIf?: string;                                        // required for L2 and L3
  factIds: string[];                                        // ledger rows behind "Kaise pata?"
  band: Band; visibility: 'parent' | 'parent_if_teen_opt_in';
}
```

### 4.2 Gate pipeline (pure code, before any wording)

```
estimators ─► candidate claims (only from each section's pre-registered menu; screened count logged)
  ─► G-a  level rule and construct thresholds (§4.3)
  ─► G-b  reliability: in-deployment card ρ ≥ .80 at this claim's interval (L2 level claims only)
  ─► G-c  distinctiveness ≥ .90 (L2 level claims); two-groups P(claim correct) ≥ .90 (L2 contrasts)
  ─► G-d  randomisation present for any contrast that would read causally (RR-D7)
  ─► G-e  system explanations ruled out by rule (durability and fades-faster patterns)
  ─► G-f  band and visibility rules (B1 no calibration; B4 opt-in; exam window)
  ─► G-g  action present; reviseIf present (L2/L3)
  ─► G-h  report budget: order admitted L2/L3 by a FIXED pre-declared priority (has an action > recently passed > menu order),
          admit while Σ(1 − Pᵢ) ≤ ε (weekly .2, monthly .3, term .3); L0/L1 are outside the budget
  ─► G-i  section caps (strengths first; growth edges ≤ 3 monthly; style lines ≤ 6; change rows ≤ 2 monthly / ≤ 4 term)
  ─► fallbacks for required sections that come out empty ("still learning …" shapes)
```

The priority order in G-h is fixed **before** the posterior check. Ordering by "matches a parent worry" is a selection step and would have to happen before screening (PR R1(d)). Parent worries instead feed S13 as "you asked about {worry}; here is what we found / will check by {date}", using L0/L1 facts.

### 4.3 Thresholds before claiming anything (consolidated)

| claim | minimum data | statistical rule | other gates | where |
|---|---|---|---|---|
| skill row *Pakka* | ≥ 2 delayed successes on distinct items (≥ 1 day apart), or a KT posterior that includes slip and guess | KT | "last checked {date}" always shown; "due for a check" after 60 days unchecked [U]; display never falls through absence (LOT inv 3) | S3 |
| skill row *Aa gaya / Seekh rahi / Abhi nahi* | KT state | KT | — | S3 |
| curricular level line | KT skill coverage | none (a fact) | outcome language from NCERT learning outcomes. **No grade equivalent, no "behind", no single level number** | S3 |
| trajectory (term) | ≥ 3 occasion-specific θ estimates | ribbon = 80% interval | unlabelled scale; no slope number; no growth-rate words < 12 months | S3 term |
| fluency change (CD-flu) | ≥ 20 correct responses on the same item family in each window | practice-adjusted RCI > 1.96 on matched item sets | same accuracy band; ≥ 2 months apart | S3 |
| number-line, fraction, akshara, ORF change | calibrated item set per window | RCI on the calibrated scale; difficulty held fixed | ORF on equated passages, human-audited; one-pair claims banned | S3 |
| durability L0 | any | — | counts of delayed checks after ≥ 7 days | S4 |
| durability L2 | ≥ the LT6 floor (expected ≥ 80 randomised-lag checks per topic type) | P(u_c,tt > .3 \| data) ≥ .9 (or < −.3), card ρ ≥ .80 | LT3: σ_u,tt ≥ .25 on real data; same sign under exponential-plus-floor, power and horizontal forms; school-exposure adjusted; system explanations ruled out | S4 |
| retry counts | e ≥ 10 errors on items with pSuccess ≥ .4 | none | unprompted re-attempts only | S6 |
| "when stuck after two tries, asked for help" | q ≥ 10 | none | no per-kind answer counts in v1 | S6 |
| self-correction counts | ≥ 10 W→R opportunities | none | MS5 precision ≥ .9 passed | S6 |
| harder-option choices | ≥ 10 offers with a perceptible contrast | none | randomised option order | S6 |
| "Taxila switched to {action} {n} times" | any | none | system action, never a child trait | S6 |
| contingency line ("after {move A} she retried {k₁}/{n₁}, after {move B} {k₂}/{n₂}") | ≥ 10 randomised allocations per arm | two-groups P(claim correct) ≥ .9 | M-FB randomised only; in v1 the population policy is the default (ISP5), so expect almost none | S6 |
| own-question count | any (with window) | none | — | S7 |
| "mostly about {topic}" | ≥ 6 sessions in each domain compared | within-child cross-domain contrast P ≥ .9 | child-started exposure only | S7 |
| calibration table | ≥ 30 bets **and** ≥ 10 wrong-answer bets in the domain | none (descriptive) | **B2+**; cells with n < 5 suppressed; difficulty mix shown; reading slot describes one bet level only; no resolution sentence; no change line in v1 | S8 |
| D28 and who started | ≥ 28 days; n ≥ 8 sessions for the `startedBy` split | none | a "was {n′}" comparison only if \|n − n′\| ≥ 2·SEM_diff (~7 days; MH R7). Silent at extremes in B1 | S9 |
| session-design note | population | — | written as "Taxila offers a break after {t} minutes for children in Class {c}" | S9 |
| time-of-day result | completed alternation of ≥ 8 one-week blocks | directional P(δ > δ_min) ≥ .9 **and** posterior SD < δ_min | parent opted in; the null shape is planned | S9 |
| style line (ISP) | effective sessions such that ρ ≥ .80 | card ρ ≥ .80; distinctiveness ≥ .90; non-overlapping window agreement r ≥ .50 | stratified by the knob state in force and naming it; status changes from the child's own data only; no first-week comparison; changepoint false alarms < 5% a month | S10 |
| growth edge | KT `working` skill or a hedged misconception | misconception needs a diagnostic item set at threshold | three parts: task feature, hedged reasoning, Taxila action + re-check date | S11 |
| change row (then → now) | each window meets its row's own threshold | RP-D6: pre-declared direction, once per term, magnitude floor, P ≥ .95 (≥ .975 with > 4 candidate rows) | matched information; SRL rows need a transfer check; band drift as context; no row may span the faces → words switch (MS P4) | S14 |
| wellbeing card | marker-specific minimum count | absolute rate floor | replay-estimated false-alarm rate ≤ 5% of children a year with no true change [U]; never "addicted" | S15 |

### 4.4 Strengths without the winner's curse (PR §4.2, corrected by R3 and R14)

Strengths come only from:
- **L1 facts**: skills *pakka* after delayed checks, and transfer passes;
- **L0 counted actions**: explained in her own words {k} times, tried again on her own {r} times, asked {q} of her own questions.

**Every child has counted actions, so every report can open with a true strength without inflation.** The cross-domain "relative strength" shape is deleted. Strength wording is modest and specific, never superlative (Brummelman 2014 [V]).

### 4.5 Misconceptions, hedged (PR R11)

A misconception appears only when a **diagnostic item set** has run: items whose answers separate the misconception from a slip. The shape is ⟨answers like {k} of {n} fit a common way of thinking: {kitchen-table description}⟩. It is never "she thinks…". Below threshold, the growth edge names only the task feature.

---

## 5. Section specifications

Shapes are slot patterns in ⟨⟩. Braces are typed slots filled from claim objects. Each language (Hindi, Hinglish, English) has its own reviewed template per shape; templates are never generated per report. Pronoun slots use the child's recorded pronoun (PR review D4).

### S1. Header and the week in numbers (L0)
- Shape: ⟨{name} · Class {c} · {dates}⟩ ⟨{lessons} lessons · {days} days · {min} min⟩.
- A zero-lesson week still sends, with no guilt copy (PX7, PL §5.3) and the latest *pakka* skill as the strength.

### S2. Strengths (required, first)
- Sources: KT-1 *pakka* rows, LOT-C8 transfer passes, counted actions, CD reasoning or strategy examples.
- Shapes:
  - ⟨{skill, outcome language} is now *pakka*: right again after {d} days⟩
  - ⟨explained {topic} in {pronoun} own words {k} times⟩
  - ⟨used {strategy, e.g. "make a ten"} without being shown, {k} times⟩ (Example)
  - ⟨solved a {real-life context} problem about {topic}⟩ (Example)
- Banned: talented, gifted, naturally good at, best in, better than, "a maths person", "a reader", superlatives, exclamation hype.

### S3. What {name} can now do (required)
- Sources: KT-1; CD domain constructs; LOT-C1 (onboarding); LOT-C9 (term).
- Shapes:
  - ⟨{outcome} · {state word} · checked again {d} days later⟩
  - ⟨chapter {x}: {pakka} of {total} skills *pakka*⟩
  - ⟨now working on: {outcome} (from the Class {y} syllabus); next: {outcome}⟩
  - learning-metric change rows, when the §4.3 rule passes: ⟨{skill family}: answers in about {x} s, was {y} s in {month}, same accuracy⟩; ⟨places numbers up to {scale} within about {e} of the right spot, was {e′}⟩
  - term only: ⟨{subject} progress⟩ + trajectory ribbon (an unlabelled scale; a caption shape says "Taxila's own measure, not a mark").
- Rules: no grade equivalents; no "behind"; no single level number; never "lost" or "forgot" (a drop is a review, S11).
- Fallback: the week's counted actions.

### S4. Holding up over time (monthly and term)
- Sources: LOT-C3 (L0, L2), LOT-C7.
- Shapes:
  - L0: ⟨{N} checks of {topic type} after a gap of a week or more; {M} right⟩
  - L1: ⟨{skill}: back to *pakka* after {k} reviews following the break⟩
  - L2, rare: ⟨for {topic type}, what {name} learns with Taxila has been holding up over 1-2 weeks, {k} of {n} delayed checks⟩ + ⟨Taxila now spaces reviews {d} days apart⟩ + ⟨reviseIf⟩
  - "needs a quick review" variant: ⟨for {topic type}, a quick review after about {d} days helps it hold; Taxila schedules that⟩. Wording is about the topic and the schedule, never memory.
- Fallback: ⟨still learning how {topic type} holds up for {name}; {n} delayed checks so far⟩.
- Fixed normalising copy (once per term): forgetting is how memory works for everyone, and review is the design, not a remedy.
- Banned: memory words about the child ("her memory", "weak memory", *yaad nahi rehta isko*), "forgets", "slow learner", "fast learner", learning-speed scores, sleep or tiredness inferences, predictions.
- Home cue (only when S4 has content): ⟨ask {pronoun} to explain {topic} to you the next day⟩ (retrieval plus teach-back). Never "study in the evening" (LOT R12).

### S5. How Taxila is teaching {name} (optional; replaces "how they learn best")
- Sources: LS formatFit *population* β per topic type; preference and engagement layers; active comparisons.
- Shapes:
  - ⟨for {topic type}, Taxila starts with {format family in plain words}, the way that works best for most children learning this⟩
  - ⟨when offered a choice, {name} picked {story / picture / game} {k} of {n} times; Taxila keeps offering it⟩ (labelled "what {pronoun} chose", never "how {pronoun} learns")
  - ⟨Trying: {A} and {B} for {topic type} until {date}⟩
  - teaching adjustments from knobs: ⟨Taxila is giving instructions in shorter steps in {activity}⟩. Never a span number and never an efficacy claim (CD R4).
- **v1 has no "Found" and no "no-difference" per-child format lines** (RR-D6).
- Banned: visual / auditory / kinaesthetic learner, "learns best by", "her style", any format claim from immediate correctness.

### S6. When it gets hard (optional; never titled "frustration")
- Sources: MH-M4 / ISP6, MS-S4, MS-S6 (restricted), MH-M3, M-FB contrasts (randomised only), MS-S8 system actions.
- Shapes:
  - ⟨tried again on {pronoun} own after {r} of {e} mistakes⟩
  - ⟨fixed {pronoun} own mistake before being told {k} of {n} times⟩
  - ⟨when stuck after two tries, asked for help {p} of {q} times; Taxila gives hints before answers⟩
  - ⟨given a harder option, chose it {h} of {o} times⟩
  - ⟨when answers got very quick and mostly wrong, Taxila switched to {action} {n} times⟩
  - randomised contingency only: ⟨after a mistake on a new kind of problem, retried {k₁}/{n₁} when Taxila asked about the step, {k₂}/{n₂} when it explained the step; Taxila now uses the question way⟩
- Banned: gives up easily, low resilience, grit, frustrated child, careless, lazy, impulsive, "doesn't ask for help", "too dependent", "what helped" without randomisation, any persistence score.
- Fallback (monthly): ⟨Taxila is watching what helps {name} when a problem gets hard⟩.

### S7. Curiosity and interests (optional)
- Sources: MH-M2, ISP4, ISP11, interest tags (parent-editable), MEM §7.3.
- Shapes:
  - ⟨asked {q} of {pronoun} own questions this month⟩
  - ⟨{pronoun} question about {thread} became the start of {lesson}⟩ (Example)
  - ⟨chose {topic tag} examples {k} of {n} times⟩
  - contrast only after the gate: ⟨asked more of {pronoun} own questions in {domain A} than in {domain B} this month: {k₁} vs {k₂}⟩
  - interest tags, shown as an editable list
  - B3+: ⟨chose "quiz me" {c₁} of {c} times when offered⟩
- Banned: very curious, curious child, "not interested in {subject}", *padhai mein mann nahi lagta*.
- Home cue: ⟨ask {pronoun} to teach you what {pronoun} found out about {topic}⟩.

### S8. How sure (B2+, after the gate)
- Sources: MS-S1 (descriptive table).
- Layout: a three-row table, *pakka / shayad / andaaza* × {right}/{total}, plus a ⟨mix of easy and hard questions: {e}/{m}/{h}⟩ line.
- Reading slot: one bet level only, from a fixed set, e.g. ⟨when {pronoun} said "pakka", {pronoun} was right {a} of {n} times⟩. No comparison between levels below the resolution threshold (MS P10). No resolution sentence at any band in v1 (MS P1). No change line in v1 (MS P9).
- Parent cue: ask "how sure are you, and how could we check?" rather than "is it right?" (Fyfe 2022, grades 1-2 [V, sib MS]).
- Banned: overconfident, underconfident, low confidence, self-doubt, calibration percentages, gendered framing of confidence.
- Fallback: ⟨still collecting {pronoun} "how sure" answers in {subject}; {n} of 30 so far⟩.

### S9. Routine (optional)
- Sources: MH-M9, MH-M1, PR session counts, population design notes, the n-of-1 result.
- Shapes:
  - ⟨sessions on {n} of the last 28 days; {k} at the time you chose⟩
  - ⟨{child} started {a} of {s} sessions; you or the plan started {b}⟩
  - ⟨usual session about {m} min; ended early {e} times⟩
  - population design note: ⟨Taxila offers a short break after {t} minutes for children in Class {c}⟩
  - n-of-1 result: ⟨over {w} weeks of trying both times, {slot A} sessions went better: {counts}; you may want to keep {slot A}⟩, or the planned null ⟨both times worked about the same, so pick whichever suits the family⟩
  - return after a break: ⟨after {break}, back to the routine in {d} days⟩
- Banned: tired, morning person, night owl, sleep words, attention-span scores, "habit formed", streaks, days missed, "{child} skipped", calendar grids of missed days.

### S10. How learning with Taxila goes best lately (style lines, ≤ 6, gated)
- Sources: ISP1, ISP2, ISP3 (words and pace only), ISP8, ISP9.
- Shape (all lines): ⟨with Taxila, lately⟩ + ⟨verb + condition⟩ + ⟨count or natural-unit range⟩ + ⟨what Taxila does, under knob setting {knob}⟩ + [toggle].
  - Example of the slot pattern: ⟨with Taxila, lately⟩⟨takes {a}-{b} warm-up turns before answering freely⟩⟨Taxila starts with quick tap questions⟩[toggle].
- Status shown: `consistent` or `changing` ("this has changed recently; Taxila is adjusting", no reason given).
- Never shown:
  - barge-ins or "answers before Taxila finishes" (TV C6);
  - first-week comparisons (TV R9);
  - negative-affect lines;
  - humour style;
  - comparisons with other children.
- Fixed copy (with S16): children behave differently with different people and on different days; what you see at home is just as real.
- Kill switches, at the section level (TV §11): if every dimension fails its gate in a band, if R-VIBE shows no benefit, or if R-VIGNETTE shows that behavioural lines raise parent essentialism.

### S11. The tricky part (growth edges)
- Sources: KT `working` skills, KT-2 hedged misconceptions, LOT patterns after system explanations are ruled out, exam readiness counts.
- Shape, always three parts:
  1. ⟨the tricky step, as a feature of the task⟩;
  2. ⟨hedged reasoning, e.g. "answers like {k} of {n} fit a common way of thinking: {description}"⟩, shown only after the diagnostic gate;
  3. ⟨what Taxila is doing + the re-check date⟩.
- After a break: ⟨{k} skills from before the holiday are being refreshed this week⟩.
- Caps: 1 weekly, ≤ 3 monthly, ≤ 3 at term plus "what resolved". Not tied to the strengths count.
- Banned: weakness, weak in, problem area, behind, careless mistakes, needs to concentrate, *kamzor*.

### S12. At home this week (required weekly and monthly)
- Source: PL §6.3 `pickHomeActivity` (one catalogue item, tied to a ledger fact, `parentNeedsMaths: false`), the PL §6.4 praise cue, and the failure-response cue.
- Shape (the fact → tip → encouragement triple): ⟨what {pronoun} is learning⟩ → ⟨one activity: object + a question to ask + what a good answer sounds like⟩ → ⟨praise cue: the action to name⟩ → ⟨if it goes wrong: ask what {pronoun} tried and what {pronoun}'d try next⟩.
- Age split: B1-B2 use everyday objects and listening to the child explain. B3-B4 use value talk and teach-back; the parent asks, and the child decides how much to share.
- Banned: homework help, checking, "make her practise", extra worksheets, "you should".

### S13. What we're trying next (required monthly and term)
- Shapes:
  - ⟨next: {skills}; re-check {skill} on {date}⟩
  - ⟨trying: {A} vs {B} for {topic type} until {date}; you'll see what we found⟩
  - ⟨you asked about {worry}; here is what we found / will check by {date}⟩
- Honesty rule: experiments are disclosed in plain words, and the annual debrief link sits here.

### S14. Then → now (term; monthly only at a term boundary)
- Rows: only rows that passed RP-D6. ≤ 2 in a monthly report, ≤ 4 at term. Each row: ⟨{construct shape} {month A} → {month B}⟩ + ⟨Taxila action⟩ + ⟨Kaise pata?⟩.
- Plus a **still learning** list: constructs without enough data, named plainly.
- Band drift is context: if the band mean moved by the same amount, the row says what changed without implying that Taxila caused it.

### S15. A note about routine and rest (wellbeing card; conditional)
- Sources: MH-M12, with false-alarm-budgeted thresholds.
- Shapes:
  - ⟨{k} sessions started after the bedtime you set, in the last 14 days⟩ + ⟨you can change the bedtime in Parent corner⟩
  - ⟨sessions have been getting longer: median {m} → {m′} min⟩ + ⟨Taxila has gone back to a shorter plan⟩
- Banned: addicted, "too much screen time" as a judgement, alarm styling.
- Distress signals never appear here. They go to the safeguarding route only.

### S16. Fixed copy (once per monthly and term report)
- TV PC7: the cross-context note.
- What these reports are not: not a test score, not a comparison with other children, not a prediction.
- How to read "Kaise pata?" and "still learning".

### S17. Exam shape and the failure-response card
- **Inside a confirmed test window** (NG), this replaces the weekly card. Shapes:
  - ⟨test chapters: {chapter}: {pakka}/{total} skills *pakka* · {k} being refreshed this week⟩
  - ⟨Taxila this week: review of {skills}, no new topics⟩
  - ⟨at home: keep the usual time; after the test ask which question {pronoun} liked and which was tricky⟩
  - ⟨if marks disappoint: ask what {pronoun} tried and what {pronoun}'d do next; Taxila will re-check {skills}⟩
- Nothing new is flagged within 3 days of a test [U].
- **After any parent-entered result**, the next report opens with the failure-response card, whatever the marks (Haimovitz & Dweck 2016 [V]).

### S18. Her voice / your voice (term)
- B2+: the child's own reflection, collected by the teacher with an open prompt *shape*. It is quoted in ≤ 20 words with consent, revocable, never edited into praise, and never a private request.
- Optional parent line, stored as `parent_said`, never as evidence.

---

## 6. Uncertainty language rules

### 6.1 Principles
1. **Counts before words.** Every frequency statement shows {k} of {n} and a window. The word is a gloss on the count.
2. **Only the five frequency words in §6.2.** No other frequency adverbs: not "often", "rarely" or "tends to".
3. **Reserved words.** *Pakka, Aa gaya, Seekh rahi, Abhi nahi* belong to the mastery ladder only. "Sure", "definitely", "guaranteed" and "100%" are banned in every language.
4. **"Still learning" is a first-class state**, shown for required sections on cadence.
5. **Scope is part of the claim.** "With Taxila", the subject or topic type, and the window appear on every L2/L3 line. Never "is" or "always".
6. **No guessed reasons.** "Because" and "since" appear only where Taxila manipulated the cause (RR-D7).
7. **What would change our mind** appears on every L2/L3 line, in the evidence view.
8. **No percentages, decimals, probabilities, scores or intervals in parent text.** The posterior lives in "Kaise pata?" as ⟨Taxila is fairly confident (about 9 in 10)⟩ [U: PRM6 tests whether this helps].
9. **The same rule in every language.** Translations are native-reviewed templates, never generated per report.
10. **Population facts are labelled as population facts.** Normative development (optimism at 6-7; within-session decline in young children) uses fixed normalising copy ("this is typical at this age"), never "Taxila has found" (PR review D3).

### 6.2 Frequency vocabulary (beta-binomial posterior with a weak band prior; corrected by PR R10) [U: calibrate in PRM6]

| word (en) | Hindi / Hinglish shape [U: native review] | rule | min n |
|---|---|---|---|
| every time so far | *ab tak har baar* | k = n | 5 |
| usually | *zyaadatar* | P(p > .6) ≥ .9 | 10 |
| about half the time | *lagbhag aadhi baar* | P(.35 < p < .65) ≥ .8 | **20** |
| sometimes | *kabhi-kabhi* | P(.1 < p < .5) ≥ .8 | 10 |
| not yet seen | *abhi tak nahi dekha* | k = 0 | 5 |
| (otherwise) | — | count only: ⟨{k} of {n}⟩ | any |

**Precedence:** when two words qualify, use the most specific one ("every time so far" and "not yet seen" first, then "about half the time", then "usually" or "sometimes"). If two still tie, show the count only.

The count always appears. This matters because "usually" means 9 of 10 at n = 10 but 22 of 30 at n = 30 (PR R10).

### 6.3 Confidence tiers

| tier | rule | wording shape | appears in |
|---|---|---|---|
| Fact | L0 count or L1 status | plain statement + date | all cadences |
| Found | an L2/L3 claim that passed gate and budget | ⟨Taxila has found⟩ + scope + count + reviseIf in the evidence view | monthly, term |
| Trying | an active randomised comparison | ⟨Taxila is trying … to find out⟩ + end date | weekly (one line), monthly |
| Typical | population or normative copy | ⟨this is typical for children in Class {c}⟩ (fixed copy) | monthly, term |
| Still learning | below threshold | ⟨still learning how {construct} goes for {name}⟩ | monthly, term (required sections) |
| Never | traits, types, ranks, predictions, diagnoses, emotions | — | — |

---

## 7. What a family sees over time (the onboarding curve)

This section designs the reports around the computed data budgets (RESEARCH-PROGRAM §6.3), so that parents are not promised what the evidence cannot yet give.

| when | what appears | what is "still learning" |
|---|---|---|
| week 1 | S1 facts; S2 counted actions; S3 first *Aa gaya* rows; S12 one activity | everything else (not shown weekly) |
| week 2-4 | first *Pakka* rows (2nd delayed success); retry and help counts (S6); own-question counts (S7); D28 from week 4 (S9) | calibration, holding up, style |
| month 1 report | strengths; can-do rows + chapter counts; counts in S6, S7, S9; one growth edge; "still learning" list | S4 L2, S8 (unless reached), S10 |
| month 2-3 | S8 table for B2+ in the most-practised domain (~8 weeks); first possible style lines (rare); choice counts (≥ 10 offers) | durability patterns; change rows |
| term 1 report | learning story; trajectory ribbon; first then → now rows (if they passed RP-D6); her voice (B2+) | durability L2 in most topic types |
| term 2-3 | possible durability L2 lines for the most-practised topic types (≥ 27 weeks at 4 sessions a week) | per-child learning rate, format effects, personality: **never** |

**Fixed copy in the first monthly report:** ⟨in the first weeks Taxila mostly reports what {name} did and can do; patterns take longer to be sure about, and Taxila only says them when it is⟩.

---

## 8. Banned claims (enforced at every layer by predicate)

### 8.1 Categories

| category | examples (EN) | examples (HI / Hinglish) [U: native list] | source |
|---|---|---|---|
| traits and character | lazy, careless, stubborn, naughty, sensitive, shy, introvert, extrovert, impulsive, hyper, moody, nervous, anxious, "gives up easily", "too dependent", "doesn't think" | *aalsi, kaamchor, laaparwah, ziddi, shararti, sharmila/sharmili, sust, nazuk, ghabraata/ghabraati, dheela* | TVI1, MS §7.4, MH §6 |
| ability labels, including positive ones | smart, intelligent, IQ, gifted, genius, talented, a natural, "a maths person", "a reader", slow learner, fast learner, weak, below average, "weak memory" | *tez dimaag, kamzor, kamzor dimaag, yaad nahi rehta isko* | CD §8.2, LOT §7, PR §5.4 |
| styles and types | visual / auditory / kinaesthetic learner, "learns best by", "her style", "type of child", "kind of learner", personality, temperament | *swabhav, fitrat, "nature hi aisa"* | LS §2, TV |
| diagnoses and near-diagnoses | ADHD, dyslexic, dyscalculic, learning disability or disorder, deficit, attention span (score), "struggles to focus", "finds it hard to sit still" | — | CD8 |
| attributed emotions and mindsets | frustrated child, bored child, anxious, low confidence, low self-esteem, overconfident, fixed/growth mindset, "not interested in {subject}" | *padhai mein mann nahi lagta* | MH §6, MS §7.4, PX5 |
| comparison | most children, other children, for his age, better than, best in, percentile, rank, top, sibling comparisons | *baaki bachche, class mein sabse* | PR-D3, CD4, TVI5 |
| prediction and aspiration | topper, will score, on track for, "doctor/engineer material", "will struggle in higher classes", behind, falling behind, catch up with class, IIT/NEET talk | — | PR §5.4, RR-D10 |
| urgency and pressure | only {n} days left, must, should immediately, revise harder, red or alarm styling, countdowns | — | RR-D10 |
| superlatives and inflation | excellent, outstanding, amazing, brilliant, exclamation hype | — | Brummelman 2014 |
| person-level summaries | doing great, good child, needs to work harder | — | Kluger & DeNisi [S] |
| parent supervision | you should help her with, check her homework, make her practise | — | PL §6.1 |
| usage judgements | addicted, habit formed, habit score, streak, days missed, "{child} skipped" | — | MH §6, MHI8 |
| certainty | definitely, guaranteed, 100%, sure (outside the bet words) | — | §6.1 |
| sleep and time inferences | tired, late nights, morning person, night owl | — | LOT §7, RP-D8 |
| privacy breaches | anything the child asked to keep private; the child's statements about adults; fear-of-harm content | — | MH R19-R20 |

### 8.2 Predicates (all run on every rendered string, every language, Devanagari and Roman)

- **P-LEX:** union lexicon, case-insensitive and script-insensitive, with morphological variants. 100% catch on the list, checked against 1,000 adversarial template-bug generations (TV TM6).
- **P-SEM:** a semantic classifier for trait attribution, deficit framing, cross-child comparison, prediction or aspiration, diagnosis-adjacent wording, attributed emotion, causal claims without manipulation, and urgency. It catches the paraphrases a word list misses ("a bit slow with numbers", "struggles to focus", CD R4). It is audited on a labelled set per language, and its recall and precision are reported (PRM13).
- **P-STRUCT:**
  - every frequency word has its count in the same sentence;
  - every L2/L3 line has scope, window and reviseIf;
  - every number in text equals a slot value from a claim;
  - every sentence maps to a claim id (PL4);
  - growth edges have three parts;
  - section caps hold.
- **P-CHILD:** "would this hurt if the child read it?" — a classifier plus a rule set for growth-edge and S15 text (PX8).
- **P-PRONOUN:** pronoun consistency with the child record.
- **P-BAND:** B1 has no S8; B4 sections S6-S10 need an opt-in record; no change row may span the faces → words wording switch.
- **P-EXAM:** inside a confirmed window, only the exam shape renders.

A failure blocks the send of that segment, triggers the deterministic fallback, and writes an incident.

---

## 9. Layout wireframes (layouts with slots; never prompt text)

### 9.1 Weekly card (WhatsApp image + ≤ 5 lines; PX §8 extended)

```
┌ {Name} · Class {c} · {dates} ──────────────────────────────────┐
│ {lessons} lessons · {days} days · {min} min                      │
│ ★ {strength: counted action or pakka skill}                      │
│ PAKKA    {skill}  (right again after {d} days)                   │
│ AA GAYA  {skill}                                                 │
│ TRICKY   {task feature} → Taxila: {action}, re-check {day}       │
│ GHAR PAR {object}: ask "{question shape}" · praise: {action}     │
│ {optional: TRYING {A} and {B} for {topic type} till {date}}      │
│ Taxila AI teacher · Kaise pata? in the app                       │
└──────────────────────────────────────────────────────────────────┘
```

**Voice note (60-90 s), segment order (PL §5.2):**
1. AI-teacher disclosure;
2. week facts;
3. one concrete action the child took;
4. 1-2 can-do rows (*pakka* vs *aa gaya*);
5. the answer to an open parent commitment;
6. the tricky bit plus what Taxila is doing;
7. **your part**: activity and praise cue;
8. optional one-tap question;
9. close.

If over budget, drop from the end in this order: school line, second can-do, tricky detail. The home activity and commitment results are never dropped.

### 9.2 Monthly report (app; one card per section)

```
{Name} · {month} · "How {Name} is learning with Taxila"          [Listen 3 min] [Book PTM]
──────────────────────────────────────────────────────────────────────────────────────
1 STRENGTHS          ★ {strength 1}   ★ {strength 2}                          [Kaise pata?]
2 CAN NOW DO         {subject}: {pakka}/{total} skills pakka · now working on: {outcome}
                     {skill family}: answers in about {x}s (was {y}s), same accuracy   [only if RCI passes]
3 HOLDING UP         {N} checks after a week or more: {M} right
                     STILL LEARNING how {topic type} holds up · {n} checks so far
4 HOW TAXILA TEACHES for {topic type}: starts with {format, plain words} (works best for most children)
                     {pronoun} chose: story {k} · picture {k} · game {k}   (what {pronoun} chose)
                     TRYING {A} and {B} till {date}
5 WHEN IT GETS HARD  tried again on {pronoun} own after {r} of {e} mistakes
                     when stuck after two tries, asked for help {p} of {q} times
6 CURIOSITY          {q} own questions · "{thread}" became the start of {lesson} · tags: {tags} [edit]
7 HOW SURE (B2+)     said pakka {n1}: right {a1} · shayad {n2}: right {a2} · andaaza {n3}: right {a3}
                     questions were {e} easy / {m} medium / {h} hard
8 ROUTINE            {n} of 28 days · {k} at your chosen time · {child} started {a} of {s}
                     Taxila offers a short break after {t} min for Class {c}            [try both times? →]
9 WITH TAXILA, LATELY {≤ 6 gated style lines, each: verb + condition + count + what Taxila does} [toggle]
10 THE TRICKY PART   {task feature} · {hedged reasoning} · Taxila: {action} · re-check {date}
11 AT HOME           this month: {activity} · praise: {action} · if it goes wrong: {cue}
12 NEXT              {skills} · re-check {dates} · trying {experiment} · your question: {answer or date}
──────────────────────────────────────────────────────────────────────────────────────
Children behave differently with different people and on different days; what you see at home is real too.
These reports are not a test score, not a comparison with other children, not a prediction.
Every line: [Kaise pata?] → items, dates, {pronoun} words, and what would change this.
```

### 9.3 "Kaise pata?" evidence drawer (per line)

```
┌ Kaise pata? · {line, as shown} ─────────────────────────────────┐
│ Window: {from} – {to} · scope: with Taxila, {subject/topic type} │
│ Evidence: {date} {item, as asked} → {outcome}                    │
│           {date} {item} → {outcome}      … [{n} more]            │
│ {Pronoun} words (if spoken, ASR-confident, not private):         │
│           "{≤ 20-word excerpt}"                                  │
│ How sure Taxila is: {fairly confident (about 9 in 10)}   [L2/L3] │
│ What would change this: {reviseIf}                       [L2/L3] │
│ What Taxila is doing: {taxilaAction}                             │
└──────────────────────────────────────────────────────────────────┘
```

### 9.4 Term report (PDF + 5-minute voice; a learning story)

```
Page 1  {Name} · Class {c} · Term {t} ({dates})
        {Subject} progress: ribbon ▁▂▃▅▆ (Taxila's own measure, not a mark; the band shows how sure)
        This term's story (one episode of each type, chosen by recency among claim-backed events):
          ① {date} · a question {pronoun} asked   → shows: {task/process statement} → next: {step}
          ② {date} · a hard problem {pronoun} got through → shows: {…}           → next: {…}
          ③ {date} · a tricky idea that resolved   → shows: {…}                  → next: {…}
Page 2  Then → now (passed rows only): {construct shape} {month A} → {month B} · Taxila: {action}
        Still learning: {constructs without enough data, named plainly}
        Holding up: {L2 line if passed, else L0 counts}
        {Pronoun} voice (B2+, consented): "{≤ 20-word quote}"
        Your note (optional): {parent_said}
Page 3  Competency rows (HPC-compatible): {outcome} · {state word} · {date checked}     [no psychological sections]
Page 4  Next term: focus {skills} · routine {anchor} · one home habit {habit} · how we will know {checks}
```

Episode selection is audited by talk-volume decile, so that quieter children are not systematically left with thinner stories (PR R14).

### 9.5 Exam shape and failure-response card

```
{Name} · {subject} test {date range}
Test chapters: {chapter}: {pakka}/{total} skills pakka · {k} being refreshed this week
Taxila this week: review of {skills}, no new topics
At home: keep the usual time · after the test ask "which question did you like, which was tricky?"
If marks disappoint: ask what {pronoun} tried and what {pronoun}'d do next · Taxila will re-check {skills}
```

```
┌ After the {subject} test ─────────────────────────────────────────┐
│ Whatever the marks: ask what {pronoun} tried, and what {pronoun}'d │
│ try next time. Taxila will re-check {skills} this week.           │
└───────────────────────────────────────────────────────────────────┘
```

### 9.6 B4 (13-15) opt-in and co-view

```
To {Name} (shown in the child app):
  Your parent gets: your skills, the chapter counts, and one home idea each week.
  You choose whether they also see: when it gets hard · curiosity · how sure · routine · with Taxila, lately
  [share these] [keep these to me]          You can change this any time. You will see what they see.
```

### 9.7 Month-1 report for a new family (mostly still learning)

```
{Name} · {month} · first month with Taxila
1 STRENGTHS   ★ explained {topic} in {pronoun} own words {k} times
2 CAN NOW DO  {skill} aa gaya · {skill} pakka (right again after {d} days) · now working on: {outcome}
3 COUNTS      tried again on {pronoun} own after {r} of {e} mistakes · {q} own questions
4 ROUTINE     {n} of 28 days
STILL LEARNING: how things hold up over weeks · how sure {pronoun} is · what helps when it gets hard
In the first weeks Taxila mostly reports what {name} did and can do; it says patterns only when it is sure.
```

### 9.8 Wellbeing card

```
┌ A note about routine and rest ──────────────────────────────────┐
│ {k} sessions started after the bedtime you set (last 14 days).  │
│ Taxila does not start new lessons after that time.              │
│ You can change the bedtime in Parent corner.     [Parent corner] │
└──────────────────────────────────────────────────────────────────┘
```

---

## 10. Generation pipeline

### 10.1 Stages

```
(1) snapshot      ledger + estimator outputs at the cadence boundary (pure function of: ledger snapshot id, params version,
                  template version, writer seed) → stored for replay and audit
(2) candidates    estimators emit Claim candidates from each section's pre-registered menu (screened count logged per menu)
(3) gate          §4.2 G-a … G-i (code only) → admitted claims + fallbacks
(4) plan          ReportPlan: sections in cadence order, caps applied, voice-time budget, variant arm (R-REPORT), language, pronoun
(5) write         Lane A (deterministic templates) for every claim line; Lane B (constrained writer) for joins, ordering,
                  episode clauses and voice flow only (§10.2)
(6) validate      §8.2 predicates + numeric fidelity + claim-id coverage + budget re-check + band/exam/visibility checks
(7) render        card image (server, design tokens), WhatsApp template text (≤ 5 lines), voice (TTS of validated text only),
                  app view, PDF (term; the competency page carries no psychological sections)
(8) send          Notifier gate (consent, caps, quiet hours, safety hold, B4 opt-in) → send → receipts → button replies
(9) log           ParentEvent{report_rendered: claimIds, variantArm, budgetUsed, fallbacks, validator results}; incidents
```

### 10.2 The writer, constrained to cited evidence

- **Lane A (default, deterministic).** Every L1, L2 and L3 line, every count line, every style line, the calibration table, the wellbeing card, the exam shape, the failure-response card and all fixed copy are rendered from **reviewed templates**: one per (shape × status × language), with typed slots. No model is involved. Templates are UI strings, not prompt text, but they are still reviewed against §8 (TV §6.5).
- **Lane B (constrained LLM writer).** An Azure first-party model only (azure-only-compute). The CONDUCTOR uses `taxila-fast` (gpt-5.6-luna) for letters, on standard deployments; Azure Batch is not used, per the conductor inbox rejection of Batch for reports. It does three jobs only:
  1. order and join Lane A segments for the voice script inside the 60-90 s budget, by choosing among **approved connective ids**;
  2. write the term learning-story "what happened" clause (≤ 25 words) from one dated cluster of fact ids;
  3. PTM turns, governed by PL §7.

```ts
interface WriterInput {
  language: 'hi' | 'hinglish' | 'en'; pronoun: string; band: Band; cadence: 'weekly' | 'monthly' | 'term';
  segments: Array<{ claimId: string; shapeId: string; renderedText: string; mustKeep: boolean }>;   // Lane A output
  connectives: Array<{ id: string; text: string }>;                                                 // approved joins
  episodes?: Array<{ episodeId: string; factIds: string[]; facts: Array<{ date: string; what: string }> }>;
  voiceBudgetSec: number;
}
interface WriterOutput {
  order: Array<{ claimId: string } | { connectiveId: string }>;          // permutation + joins; no new claims
  dropped: string[];                                                      // claimIds dropped for time (never mustKeep)
  episodeClauses?: Array<{ episodeId: string; text: string; citedFactIds: string[] }>;   // ≤ 25 words each
}
```

**Writer rules:**
- The writer never sees raw transcripts, other children's data, or any banned construct.
- Its prompt contains **shape descriptions and constraints, never example sentences** (the inherited recitation law).
- Its output is accepted only if:
  - every claim it uses is in the input;
  - every `mustKeep` segment is present;
  - every episode clause cites only its own fact ids and introduces no number, name or claim not present in those facts;
  - every string passes P-LEX, P-SEM, P-STRUCT, P-CHILD and P-PRONOUN.
- If Lane B fails twice, the report ships Lane A in default order. The family always receives a correct report, and an incident is written.

### 10.3 Validation suite (the evals that gate releases)

| eval | what | bar |
|---|---|---|
| E-R1 simulated-null budget | children with no true contrasts, at the real data shape | admitted false claims per report ≤ ε, and observed ≈ believed |
| E-R2 sparse-mixture calibration | 10-30% real effects (as in synthsim §A) | false claims within the 90% interval of Σ(1 − P) |
| E-R3 false change rows | simulated null trajectories over a year | < 0.1 false rows per child-year (RP-D6) |
| E-R4 lexicon recall | 1,000 adversarial template-bug generations, three languages | 100% on the list |
| E-R5 semantic predicate | labelled paraphrase set per language | recall ≥ .95 at precision ≥ .8 [U] |
| E-R6 claim-checker | 300 hand-labelled reports and voice scripts | unbacked-claim recall ≥ .95 (PLM7) |
| E-R7 numeric fidelity | fuzzed slot values | 0 mismatches |
| E-R8 band and visibility fixtures | B1, B4 not opted in, exam window, zero-lesson week, after an entered result | 100% |
| E-R9 replay | the same snapshot renders identical Lane A text | 100% |

---

## 11. Evaluating the report (it is an intervention)

### 11.1 Measurements (PR §12, corrected)

| id | what | method | decides |
|---|---|---|---|
| PRM1 | comprehension | 5-item read-back quiz by language and literacy, including a voice-only arm | layout; ≥ 80% target [U] |
| PRM2 | "Kaise pata?" use and comprehension | open rate; 2-item check | keep or simplify the drawer |
| PRM3 | parent belief calibration | 5-point probability predictions on skills **not stated** in recent reports; ≥ 3-item outcome; Brier with Murphy decomposition; opt-in, rare, game-framed | RR-D2, RR-D5; RR-D4 framing |
| PRM4 | parent pressure markers | report-triggered scolding or extra sessions (parent-reported); PL10 decline-request rate; child-stated pressure lexicon | RR-D10 guard |
| PRM5 | posterior calibration of L2/L3 | of claims stated at P ≈ .9, the share later confirmed on held-out delayed checks | ε; gate thresholds |
| PRM6 | frequency-word interpretation | parents map each word to a number, in Hindi, English and Hinglish | §6.2 table |
| PRM7 | n-of-1 yield | share of opted-in families reaching the directional rule | keep or drop the S9 time-of-day line |
| PRM8 | monthly open and PTM rates | product logs | RR-D12 |
| PRM9 | contingent-worth prevalence | consented sub-study | framing defaults |
| PRM10 | predictive anti-Barnum, per section | own section vs synthetic decoy predicting the child's held-out behaviour (AUC) | section ships |
| PRM11 | claim-type re-appearance | share of "Found" claims of a type that reappear in the next independent window | ≥ 70%, else the type is hidden |
| PRM12 | false-row audit | E-R3 on real data with shuffled windows | RP-D6 |
| PRM13 | semantic-predicate audit | labelled set per language | P-SEM release |

### 11.2 The report-variant RCT (R-REPORT)

- **Arms** (factorial, randomised by family; PR §11.3):
  - A: process framing vs outcome framing;
  - B: uncertainty display (counts + tiers + "Kaise pata?") vs plain statements;
  - C: strength-first vs chronological order. Strength-first is tagged [U]; PR-D4's citations concern accuracy of parent beliefs, not section order (PR R14).
- **Primary outcome:** children's delayed retention on **fixed scheduled assessments delivered to all arms**, so that usage differences do not create differential practice or missingness (PR R15).
- **Parent outcomes:** PRM3, home-activity completion, person vs process responses (an adapted Barger 2022 measure [U]), PTM use.
- **Harm outcomes:** MH-M12 markers, PRM4, opt-outs.
- **Power:** 1,570 families per arm at d = .10; 6,279 at .05; 17,442 at .03 (synthsim §E), before clustering and attrition. Pre-register a smallest effect of interest of ≥ .10 with an equivalence test, or plan for tens of thousands of families.
- **Harm rule:** a variant that raises an engagement metric *and* raises PRM4 or MH-M12 beyond threshold fails, whatever its other effects.
- **Folded in:** the wellbeing gates LT10, MH10 and MS10 (does an L2 report change parent behaviour or child stress?). These are an arm: L0/L1 only vs L0/L1 + L2.
- **Report reactivity (R-REACT):** parents coach what is reported. One research-only indicator family is never reported. The shift at first report exposure is estimated by regression discontinuity, and post-exposure changes in reported behaviours are not read as motivation change (MH R15).

### 11.3 Publishable outputs from the report programme

1. Parent-belief calibration as an outcome of AI reports in Indian families.
2. A predictive anti-Barnum test: structured, counted, scoped claims vs fluent LLM profiles.
3. The report-variant RCT.
4. n-of-1 time-of-day alternations as a *population* study (τ_δ). The individual verdicts are expected to be null.

---

## 12. Indian context and wellbeing rules (from PR §9-§10, corrected)

1. **The marks question** is answered with skills-secure counts for the test chapters plus what is being refreshed. A predicted mark is never given.
2. **Aspiration language is declined, not argued with.** "Will she get into Navodaya?" → what she can do now, what comes next, and how long the next step usually takes. "Usually" here is a population fact framed as typical, never as a forecast.
3. **Exam windows** switch to the exam shape. Growth edges outside the test chapters are deferred.
4. **Joint families and multiple guardians** get one report per child, forwardable as an image. Guardian views never differ in content about the child.
5. **Shared phone:** every string passes P-CHILD.
6. **Gender:** no gendered framing of confidence, maths or persistence. Every child gets the same sections, which equalises attention.
7. **Language:** Hindi-first where chosen, with English school nouns. A voice note for low-literacy parents. Native-reviewed vocabulary.
8. **Tuition and coaching** are never criticised or competed with. Taxila reports only its own evidence. School and tuition exposure is a model covariate, never a parent message.
9. **NEP and HPC:** the term competency page uses outcome language compatible with the HPC [M: map to the current PARAKH template]. Psychological sections never leave the family (no school-facing export).
10. **Expectancy risk is concentrated where parents cannot check** (Raudenbush 1984 [V], read in the right direction, C10): maths for a parent who cannot do the maths, and in-app behaviour. Those domains get the strictest hedging.
11. **Distress** is never inferred into a report. It goes to the safeguarding route (Childline 1098 / Tele-MANAS 14416 floor).
12. **Bad weeks** still send, with facts, no guilt, and a strength from the record.

---

## 13. Invariants (eval-gated; "if your change trips them, your change is wrong")

| id | invariant | test |
|---|---|---|
| RRI1 | every rendered sentence about the child maps to an admitted claim id with fact ids | claim-checker (E-R6) |
| RRI2 | every frequency word has its count in the same sentence and satisfies §6.2, including min n and precedence | P-STRUCT unit tests |
| RRI3 | every L2/L3 claim has P ≥ .9 from the two-groups or level model, scope, window, `taxilaAction` and `reviseIf`; its menu item is pre-registered | gate unit tests |
| RRI4 | Σ(1 − Pᵢ) ≤ ε per cadence, validated on simulated nulls and sparse mixtures | E-R1, E-R2 |
| RRI5 | no lexeme from §8.1 in any language or script; P-SEM passes | P-LEX, P-SEM |
| RRI6 | no comparison with other children, siblings, norms or "most children" (fixed "typical" copy excepted) | lexicon + structure |
| RRI7 | no predicted marks, ranks, countdowns or aspiration talk; the exam shape applies inside confirmed windows | template tests with test-window fixtures |
| RRI8 | no per-child format claim in v1; choice lines are labelled as preference | fixture |
| RRI9 | no causal wording on any contrast without randomised allocations with logged propensities | gate test |
| RRI10 | no time-of-day claim without a completed n-of-1 record passing the directional precision rule | gate test |
| RRI11 | strengths come first, from L1 facts or counted actions; there is no cross-domain relative-strength shape | renderer test |
| RRI12 | growth edges have three parts and are capped (1 / 3 / 3), independent of the strengths count | renderer test |
| RRI13 | exactly one home activity, `parentNeedsMaths: false`, with no homework-help or checking verbs | catalogue + lexicon |
| RRI14 | every report is sent on schedule, including zero-lesson weeks, with no guilt or "come back" copy | fixture |
| RRI15 | psychological sections never appear in the school-facing PDF or HPC page | export test |
| RRI16 | B1 has no calibration table; B4 sections S6-S10 need an opt-in record; the child sees what the parent sees | band fixtures |
| RRI17 | *Pakka* rows need ≥ 2 delayed successes on distinct items and show "last checked" | renderer test |
| RRI18 | no grade-equivalent band and no growth-rate statement under 12 months | lexicon + structure |
| RRI19 | nothing the child asked to keep private, and no fear-of-harm content, appears in any report | dataflow + fixture |
| RRI20 | Lane B output introduces no claim, number or name absent from its input | writer validator |

---

## 14. Open questions

1. **Prior strength for the frequency words** per band: too weak a prior makes "usually" flip from week to week. PRM5 and PRM6 decide.
2. **Does strength-first ordering lower calibration** for anxious parents, who skim to the growth edge? R-REPORT arm C decides.
3. **Feasibility of n-of-1 alternation** for families with fixed routines (maybe weekends only) [U].
4. **What happens when parent and Taxila disagree** ("she never asks questions at home")? Show both, use the fixed cross-context copy, store `parent_said`, and never adjudicate.
5. **HPC mapping without importing a school grading scale** [M].
6. **Co-authorship by B3+ children** of one monthly line: good for autonomy, but it risks performative self-reports [U].
7. **How to explain the "still learning" curve** (§7) to parents who expect insight in week 1. A comprehension test in PRM1.
8. **Whether "fairly confident (about 9 in 10)" in "Kaise pata?"** helps or harms Hindi-only parents (PRM6).
