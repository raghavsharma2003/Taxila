# Knowledge tracing for Taxila: algorithms, parameters, and a TypeScript module

**Date:** 2026-10-02 · **Question:** which knowledge-tracing (KT) algorithms can Taxila implement in TypeScript today, with what equations and default parameters? How do hint-ladder depth, probe likelihood ratios (LRs), and delayed retrieval feed into them? How do we cold-start from class level and a diagnostic?
**Builds on, does not repeat:** `docs/research/learning-science.md` §1.12 (BKT vs DKT vs LLM-KT), §6A rules 2 and 11 (the three-evidence mastery rule; the LLM labels, the model decides), §7 (probe catalogue P1-P24, LR bands, fusion rules), §8.3 (knowledge layer and states). Harvest law kept: `docs/harvest/gurukul.md` A2 says displayed mastery is never lowered by absence.
**Tags:** **[V]** checked this session against the primary source (paper PDF, code, or official docs). **[S]** secondary only (cited inside a [V] source, or a search summary). **[U]** unverified: from memory, or a Taxila design default that must be measured. Most numeric defaults below are [U] by construction; the literature anchors that justify them are tagged separately.

---

## 0. Decisions on one screen

| # | decision | why | what would reverse it |
|---|---|---|---|
| D1 | The ledger is **BKT-R**: BKT per (child, skill) with (a) categorical, evidence-class-specific emissions, (b) emissions gated by a retrievability term R from a per-skill memory model, (c) a per-child learning-speed offset η, and (d) priors from a subject-level ability θ | BKT suits sense-making KCs (Pelánek 2017 [V]). Its extensions (forgetting, ability) match DKT (Khajah 2016: AUC 0.73 → 0.83 with forgetting on ASSISTments [V]). It is interpretable, and every update is one Bayes step with a likelihood ratio, which is exactly the probe-LR language of learning-science §7 | A challenger (PFA, Elo, or a small neural KT) beats BKT-R by ≥ 0.02 AUC **on delayed items** for 2 consecutive monthly refits (K6) |
| D2 | **Fluency/memory skills** (topic types T1 verbatim and T2 vocabulary) are tracked per *item* with an FSRS memory model and an Elo/IRT prior, not BKT | For memory and fluency, a "gradual strength + forgetting" model fits better than a binary state, and timing matters (Pelánek 2017 KLI argument [V]). HLR and FSRS are built for this (Settles & Meeder 2016: −45% error [V]; FSRS-6 [V]) | Pooled BKT on T1 skills predicts delayed recall as well as FSRS item models (K3) |
| D3 | **Subject ability θ** per child is a Gaussian on a grade-equivalent (GE) scale. It is updated by assumed-density filtering (an exact likelihood on a 41-point grid, then re-fit to a Normal) and inflated over time as in Glicko step 1. Items/templates get the same treatment for difficulty b | Glicko gives uncertainty and time inflation [V]. Grid ADF handles 3PL guessing and the categorical outcomes exactly, at about 41 exponentials per update | Never, for cold start. Could be replaced by IRT re-calibration once item n ≥ 300 |
| D4 | The **diagnostic** is an IRT computerised adaptive test (CAT) over a grade-spanning anchor bank, with EAP scoring. It produces θ, and θ produces per-skill BKT priors | Indian classes span 5-6 grade levels (learning-science §5.2 [S]), so class is a weak prior | Placement agreement with an ASER-style oral test < 70% (learning-science E8) |
| D5 | **PFA/LKT is the offline challenger** and the multi-skill fallback, not the online ledger | PFA is slightly better than KT on log-likelihood (LL) and BIC, and natively multi-KC (Pavlik 2009 [V]). But it has no explicit "known" state to gate mastery on | PFA wins K6 |
| D6 | **"Mastered" requires P(L) ≥ 0.95 AND evidence diversity AND a delayed success**. The threshold alone is never enough | Thresholds and data sources matter more than the model (Pelánek & Řihák 2017 [V]). Three strong events take pL 0.39 → 0.996 (§2.6), so a threshold is reached long before understanding is shown | Delayed-item accuracy for "mastered" skills is ≥ 0.9 without the diversity rule (K7) |
| D7 | The **LLM never sets mastery**. It emits labelled evidence events; its measured confusion matrix is folded into the emissions | At 78% labeller accuracy, a correct answer's LR falls from 9.0 to 2.6 (§1.3). Unfolded labels would overstate each turn's evidence 2.3x in log-odds | Labeller agreement with teachers κ ≥ 0.9 on that class (K1) |

---

## 1. Evidence model: from a turn to a likelihood

### 1.1 The evidence event (the only input to the ledger)

```ts
// src/learner/kt/types.ts
export type SkillId = string;              // curriculum topic id, e.g. "c6-maths-ch01-t01" (data/curriculum/*.json)
export type TopicType = 'T1' | 'T2' | 'T3' | 'T4' | 'T5';  // learning-science §8.4
export type EvidenceClass =
  | 'item.open' | 'item.mcq2' | 'item.mcq3' | 'item.mcq4'   // structured items, graded by code
  | 'probe.why' | 'probe.teachback'                          // P2, P1: LLM rubric-graded
  | 'probe.transfer.near' | 'probe.transfer.far'             // P3, P4
  | 'probe.errorspot' | 'probe.predict'                      // P6, P5
  | 'para';                                                  // P18/P19, capped; feature-flagged (see §7.1)
export interface EvidenceEvent {
  id: string; childId: string; sessionId: string; at: string;  // ISO time; order = (at, seq)
  skillIds: SkillId[];            // length > 1 means a conjunctive item (§1.5)
  cls: EvidenceClass; outcome: number;   // index into OUTCOMES[cls]
  grader: 'code' | 'llm' | 'human'; graderVersion?: string;
  asrConf?: number;               // < ASR_MIN means the event is dropped (learning-science §7.2 rule 3)
  itemKey?: string;               // item id or generator template id (for difficulty b)
  latencyMs?: number; gaming?: boolean; teach?: boolean;  // teach = instruction only, no observation
}
```

### 1.2 Categorical outcomes instead of right/wrong

Binary KT discards the hint ladder. Taxila records **one observation per item**, taking the *final outcome class* of the ladder (pump → hint → prompt → bottom-out). Each evidence class has a categorical emission: k[o] = P(o | known) and u[o] = P(o | not known). The update uses only the ratio LR(o) = k[o]/u[o]. This is a multinomial generalisation of BKT guess/slip. It is fitted by the same EM (§2.5), and it is the "partial credit" idea (Wang & Heffernan 2013, cited in Pelánek 2017 [S]) without hand-tuning a credit function. Pelánek notes "an open issue is how to specify the credit function in a systematic way" [V]. Fitting the categorical emissions is that systematic way.

**Default emission table** (launch priors, [U]; refit by EM per cluster; LR bands align with learning-science §7.1: High ≈ 3-10, Medium 1.5-3, Low 1.1-1.5):

| class | outcomes o | k = P(o\|known) | u = P(o\|unknown) | LR(o) |
|---|---|---|---|---|
| item.open | C0 correct 1st try, no hint · C1 correct 2nd try, no hint · C2 correct after 1 rung · C3 correct after ≥ 2 rungs · C4 bottom-out / gave up | .80 .08 .06 .04 .02 | .10 .08 .17 .25 .40 | **8.0** 1.0 0.35 0.16 **0.05** |
| item.mcqK (first attempt only; retries carry no positive evidence because of elimination) | correct · wrong | .90 .10 | 1/K, 1−1/K | K=2: 1.8 / 0.20 · K=3: 2.7 / 0.15 · K=4: 3.6 / 0.13 |
| probe.why (P2) | full · partial · none · misconception | .60 .25 .12 .03 | .08 .22 .50 .20 | 7.5 1.14 0.24 0.15 |
| probe.teachback (P1, expectation coverage) | ≥ 0.8 · 0.5-0.8 · < 0.5 · misconception | .55 .30 .12 .03 | .08 .25 .47 .20 | 6.9 1.2 0.26 0.15 |
| probe.transfer.near (P3) | pass · fail | .85 .15 | .15 .85 | 5.7 / 0.18 |
| probe.transfer.far (P4) | pass · fail | .65 .35 | .08 .92 | 8.1 / 0.38 (fail is ambiguous, as in the catalogue) |
| probe.errorspot (P6) | caught+fixed · caught only · missed | .60 .15 .25 | .12 .13 .75 | 5.0 1.15 0.33 |
| probe.predict (P5) | right · misconception-mapped wrong · other wrong | .60 .15 .25 | .35 .35 .30 | 1.7 0.43 0.83 |
| para (P18/19) | fluent · hesitant | .60 .40 | .50 .50 | 1.2 / 0.8 (hard cap) |

Anchors for the shape: Corbett's bounds of guess ≤ 0.3 and slip ≤ 0.1, used in Pavlik 2009 [V]. TutorShop default guess 0.2 and slip 0.1 (Xia et al. 2025 [V]). With help given, Beck et al. 2008 measured guess rising from 0.655 to **0.944** and slip falling from 0.058 to 0.009 [V]. That is the scaffolding effect that makes hinted-correct outcomes weak evidence. Beck also reports that **guess is inflated when answers are scored by speech recognition** (Reading Tutor guess 0.66-0.69) [V]: direct evidence that voice grading needs its own noise model (§1.3).

**From a catalogue LR pair back to guess/slip** (to import learning-science §7 bands into a binary model, or to read pyBKT output): given LR+ = (1−s)/g and LR− = s/(1−g),

```
g = (1 − LR−) / (LR+ − LR−),      s = LR− · (1 − g)          // e.g. LR+ 5, LR− 0.2  →  g = s = 0.167
```

### 1.3 Grader noise is folded into the emission (D7)

If the grader (LLM rubric, or ASR then a code check) reports label ℓ for true outcome o with confusion matrix M[o][ℓ], the effective emission is k'[ℓ] = Σ_o k[o]·M[o][ℓ], and likewise u'. For a binary item with g = s = 0.1 and a symmetric labeller of accuracy a (computed this session):

| labeller accuracy a | 1.00 (code) | 0.95 | 0.90 | 0.80 | 0.78 (GPT-4o turn correctness, Scarlatos 2025 [V]) |
|---|---|---|---|---|---|
| LR+ / LR− | 9.0 / 0.11 | 6.1 / 0.16 | 4.6 / 0.22 | 2.9 / 0.35 | **2.6 / 0.38** |

With a 4×4 rubric confusion matrix (0.8 on the diagonal, the rest to adjacent grades [U]), probe.why's LRs shrink from 7.5/1.14/0.24/0.15 to **5.3/1.22/0.34/0.17**, and teach-back's to 4.8/1.25/0.36/0.17. Consequences:

1. **Prefer code-graded items wherever the answer is checkable.** This is the harvest law "a model never grades" (gurukul A1), now quantified: one code-graded item carries about 2.3x the log-odds evidence of an LLM-graded turn at a = 0.78.
2. M is stored per (class, graderVersion) in `kt_params` and re-estimated from the teacher-rated set (learning-science E2). It defaults to diagonal 0.8 until measured.
3. ASR: if `asrConf < ASR_MIN`, drop the event (no evidence). Otherwise fold a residual ASR error (default 0.05 [U], so LR+ ≈ 6.1) into M.

### 1.4 Modifiers that never create evidence

- `para`: clamp |log LR| ≤ log 1.2. Ships off by default (§7.1).
- `gaming`: temper every LR in the window, LR ← LR^0.25 (learning-science §7.2 rule 4) [U].
- `teach` events (explanation, worked example, animation): no observation, only the learning transition (Instructional Factors Analysis and Sao Pedro's scaffolding-aware BKT add instruction steps the same way, Pelánek 2017 [S]).
- Bottom-out (C4) is still an *opportunity*: learning can occur after it (in Beck's help model, help raised the learning rate by 8% relative, 0.083 → 0.088 [V]).

### 1.5 Multi-skill items (word problems, T5)

Use **conjunctive** KT (Koedinger et al. 2011, cited in Pelánek 2017 [S]): the item is "known" only if all its skills are. Assuming skills are independent, with p_j = P(L_j) and Π = Π_j p_j:

```
P(o)            = Π·k[o] + (1 − Π)·u[o]
P(L_i=1 | o)    = p_i · ( Π_{j≠i} p_j · k[o] + (1 − Π_{j≠i} p_j) · u[o] ) / P(o)
```

Worked example (computed): p = [0.9, 0.5] and outcome C0 gives posteriors [0.976, 0.88]. Outcome C4 gives [0.825, 0.127]: the blame lands on the weak skill. Cap at 3 skills per item. Beyond that, credit is too diffuse and the item should be treated as a transfer probe of the *target* skill only.

### 1.6 Misconceptions: a separate binary state per (child, misconception)

Diagnostic distractors map to misconception IDs (Eedi format, learning-science §1.13). Store `logit m` per (child, misconception) and add log LR per event. Defaults [U]: P(choose d_m | holds m) = 0.55, P(choose d_m | not) = 0.08, so LR = 6.9; a correct answer gives LR 0.49. The prior is the misconception's prevalence at the child's θ (default 0.15). One distractor hit moves p from 0.15 to 0.55; two move it to 0.89. Because hidden-misconception detectors produce about 8 false alarms per true hit (learning-science §7.2) [V], **p ≥ 0.7 only triggers a verifying probe** (P5/P7). "Resolved" needs p ≤ 0.2 after a discriminating probe *and* a delayed check.

---

## 2. BKT-R: the per-skill ledger (T3 concepts, T4 procedures, T5 problem-solving)

### 2.1 State and parameters

```ts
export interface SkillParams {        // one row per cluster (subject × topicType × classBand), see §2.4
  T: number;                          // P(learn) per opportunity
  F: number;                          // P(forget) per opportunity; 0 at launch, forgetting lives in R
  emis: Record<EvidenceClass, { k: number[]; u: number[] }>;
}
export interface MemoryState { S: number; D: number; lastReviewAt: string; reps: number; lapses: number } // FSRS card subset
export interface SkillState {
  pL: number; mem: MemoryState | null; n: number; lastAt: string | null;
  flags: { unaided: boolean; generative: boolean; delayed: boolean };
  ema: number;                        // shadow criterion, alpha = 0.9 (§3.3)
  oppSinceStart: number; run: number; // wheel-spinning counters
  display: 0 | 1 | 2 | 3;             // not-started | learning | learned | mastered; monotone in time
  refresh: boolean;                   // due-for-review or a delayed miss; never lowers display by itself
}
```

### 2.2 One update step (O(1), < 1 ms)

```
0. if asrConf < ASR_MIN → return (no evidence)
1. Δt = days since mem.lastReviewAt;  R = mem ? (1 + f·Δt/S)^(−w20) : 1,   f = 0.9^(−1/w20) − 1      [FSRS-6, V]
2. effective emission (grader-folded): k', u'
   retrieval gate:  k_R[o] = R·k'[o] + (1 − R)·u'[o]      // known but not retrievable behaves like unknown
3. LR = k_R[o]/u'[o]  (then the para cap / gaming temper)
4. posterior  q = pL·LR / (pL·LR + 1 − pL)        (conjunctive items: §1.5)
5. transition pL' = q·(1 − F) + (1 − q)·T_eff,   T_eff = σ(logit T + η_child)      (skip for 'para')
6. memory: if this is the first retrieval-type event for this skill in this session, update mem (§2.3)
7. flags / ema / counters / display (§2.6); write a Why record {eventId, LR, pL→pL'}
```

The R gate is what makes **delayed retrieval** informative in the right way (computed, S = 8.3 days). A fail (C4) at 60 days, where R = 0.72, has LR 0.31 instead of 0.05, so pL moves 0.98 → 0.94 rather than 0.98 → 0.71. The failure is mostly attributed to *forgetting* (S shrinks via the lapse formula), not to "never learned". A success at low R is strong evidence, and FSRS grows S most when R was low (the spacing effect, built into SInc [V]).

### 2.3 Memory sub-model (FSRS-6 via `ts-fsrs`)

- Formulas [V, FSRS wiki]: R(t,S) = (1 + f·t/S)^(−w20), with f chosen so that R(S,S) = 0.9. Success: S' = S·(e^{w8}·(11−D)·S^{−w9}·(e^{w10(1−R)} − 1)·[w15 if G=2]·[w16 if G=4] + 1). Lapse: S' = w11·D^{−w12}·((S+1)^{w13} − 1)·e^{w14(1−R)}. FSRS-6 defaults: w = [0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666, 0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542] [V].
- **Grade G is derived from evidence, never self-rated** (self-report is invalid evidence, learning-science §1.1). G = 1 for C3/C4 or any failed probe; 2 for C1/C2; 3 for C0; 4 for C0 plus a generative or transfer pass on the same skill in the same session [U].
- Memory starts at the first G ≥ 3 (acquisition). S0 = w[G−1], so 2.3 days for G=3 and 8.3 days for G=4. Default-curve retention (computed): S0 = 8.3 gives R = 0.98 / 0.91 / 0.79 / 0.72 at 1 / 7 / 30 / 60 days. S0 = 2.3 gives R = 0.95 / 0.81 / 0.67 / 0.60.
- Only the first retrieval of a skill per session updates S. Within-session practice would inflate S, and FSRS-6's same-day term (w17-w19) was fitted on adult flashcards, not tutoring [U].
- FSRS defaults come from adult Anki users. Treat them as a conservative scheduler prior (more checks than needed). Refit w (at least w0-w3 and w20) on Taxila's delayed-check log with `@open-spaced-repetition/binding` [V exists] once there are about 5k delayed checks per topic type (K3) [U].
- Library: `ts-fsrs` (MIT, FSRS v6, ESM/CJS/UMD) [V]. Keep a 2-line local `retrievability()` so the R gate does not depend on library internals.

### 2.4 Default parameters by topic type (launch priors)

| topic type | model | T (learn/opportunity) | F | pL0 if no ability estimate | notes |
|---|---|---|---|---|---|
| T1 verbatim/sequence (tables, poem lines, spellings) | item-level FSRS + Elo prior (§3.2) | n/a | n/a | n/a | latency enters G (fluency); skill mastery = mean predicted R of its items ≥ 0.9, every item seen with G ≥ 3 |
| T2 vocabulary/language | same as T1 | n/a | n/a | n/a | item = word × direction (L1→L2, L2→L1) |
| T3 concepts ("why") | BKT-R | **0.12** | 0 | on-grade 0.25 · below-grade 0.50 · above-grade 0.10 | generative probes carry most of the evidence |
| T4 procedures | BKT-R | **0.18** | 0 | as T3 | a wrong answer matching a `slip`-tagged distractor (gurukul A1 `slip` vs `conceptual`) updates BKT only, never the misconception tracker |
| T5 problem-solving | BKT-R + conjunctive | **0.10** | 0 | as T3 | multi-KC; the target skill gets transfer-class emissions |

Literature anchors (the defaults themselves are [U]): TutorShop defaults are p_init 0.25, p_learn 0.2, p_guess 0.2, p_slip 0.1, mastery 0.95 [V]. pyBKT's fit on ASSISTments "Polynomial Factors" gave prior 0.17, learn 0.13, guess 0.26 [V]. Beck's Reading Tutor learn rate was 0.077-0.088 [V]. Corbett's bounds of L0 ≤ 0.85 and T ≤ 0.3 were used in Pavlik 2009 [V]. KT-PPS's two-prior split is 0.90 if the first item is correct, else 0.15 (Pardos & Heffernan, replicated in pyBKT [V]); it is a fallback cold start when θ is missing.

**Parameter sharing:** fit per *cluster* (subject × topicType × class band 1-2/3-5/6-8/9), not per skill. Ritter et al. 2009 showed that a few parameter clusters suffice in Cognitive Tutor [S]. Graduate a skill to its own parameters once it has ≥ 50 students × ≥ 15 opportunities: pyBKT found 50 students enough for convergence to canonical parameters and 15 a reasonable sequence length [V]. Even then, shrink toward the cluster with a Dirichlet/Beta prior of strength 20 pseudo-observations [U].

### 2.5 Fitting (offline EM with MAP priors and constraints)

Forward-backward per (child, skill) sequence. The per-step emission is e_t(l) = P(o_t | L_t = l) after grader folding and the R gate; the transition is T_t = T_eff, with F = 0.

```
forward:   π_1(1) = pL0;   c_t = Σ_l π_t(l)·e_t(l);   α_t(l) = π_t(l)·e_t(l)/c_t;   π_{t+1}(1) = α_t(1) + α_t(0)·T_t
backward:  β_n(l) = 1;     β_t(0) = [(1−T_t)·e_{t+1}(0)·β_{t+1}(0) + T_t·e_{t+1}(1)·β_{t+1}(1)] / c_{t+1};   β_t(1) = e_{t+1}(1)·β_{t+1}(1)/c_{t+1}
posterior: γ_t(l) = α_t(l)·β_t(l);   ξ_t(0→1) = α_t(0)·T_t·e_{t+1}(1)·β_{t+1}(1)/c_{t+1};   logLik = Σ_t log c_t
M-step (Beta/Dirichlet MAP, priors = §1.2/§2.4 defaults × strength 20):
  pL0 = (Σ_seq γ_1(1) + a−1)/(N_seq + a + b − 2)          T = (Σ ξ_t(0→1) + a_T − 1)/(Σ_{t<n} γ_t(0) + a_T + b_T − 2)
  emissions with the R-gate mixture: r_t = R_t·k[o_t]/(R_t·k[o_t] + (1−R_t)·u[o_t])
     K_c[o] += γ_t(1)·r_t ;   U_c[o] += γ_t(0) + γ_t(1)·(1 − r_t) ;   k_c ∝ K_c + α_k,  u_c ∝ U_c + α_u
project: T ∈ [0.01, 0.30], pL0 ∈ [0.02, 0.85], LR(best outcome) ≥ 1.5, k[C0] ≥ u[C0] + 0.2;
  restarts: 5-20 random inits (pyBKT uses num_fits / random restarts [V]); keep the best MAP objective
```

- **Why constraints:** an update is "a correct answer never lowers the estimate" iff 1 − s ≥ g. That condition is necessary and sufficient (Shchepakin et al., EDM 2024 [V]). In their simulation, plain Baum-Welch returned **20% degenerate** estimates [V]. The categorical analogue is LR(best) ≥ 1, and Taxila requires 1.5.
- **Identifiability and bias:**
  - (a) Items served in rising difficulty confound learning with item difficulty (Pelánek 2017 [V]). Include template difficulty (KT-IDEM style: guess/slip per item class, +0.019 AUC in pyBKT [V]) and randomise order within a practice block.
  - (b) **Mastery attrition bias**: children leave a skill once they master it (Nixon et al. 2013, cited in Pelánek 2017 [S]). Keep about 10% post-mastery maintenance items; they double as delayed checks.
- **Individual learning speed η** (Yudelson et al. 2013: individualising the learning rate helps more than individualising the prior [S]; Doroudi & Brunskill: population parameters under-practise slower learners, an equity issue [S via pyBKT]). Nightly, for each child with ≥ 30 opportunities across ≥ 3 skills: η = argmax Σ_skills logLik(seq | σ(logit T + η)) + log N(η; 0, 0.5²), by golden-section search on [−2, 2] [U].
- **Parity test:** with the binary reduction (C0 = correct, others = wrong; multigs = evidence class), the TS EM must match pyBKT on synthetic data (500 students; pyBKT's own sanity case is prior 0.08, guess 0.15, slip 0.05, learn 0.3 [V]) within ±0.02 per parameter.

### 2.6 Mastery states, display, and stuck detection

| state (learning-science §8.3) | condition |
|---|---|
| introduced | ≥ 1 `teach` or evidence event |
| practising | ≥ 1 evidence event |
| **learned-today** | pL ≥ 0.95 AND `unaided` (≥ 1 C0 on item.open or item.mcq3+) AND `generative` (≥ 1 pass on why, teach-back, transfer or error-spot) AND ema ≥ 0.7 |
| **mastered** | learned-today, then a delayed success (≥ 20 h later, a different session, C0 or a transfer pass), with pL ≥ 0.95 after it |
| due-for-review | mastered AND R(now) < 0.9 (FSRS default target) → `refresh = true` |

Worked trace (computed, T = 0.15, η = 0, prior 0.39):
- C0 → 0.86
- LLM-graded "why: full" (folded LR 5.3) → 0.975
- near transfer pass → 0.996: learned-today
- next day, delayed C0 at R = 0.98 (LR 7.9) → 0.9995: mastered

A struggling child (C3, C2, C0, C3, C4) oscillates between 0.18 and 0.75 and never crosses the threshold. **The threshold alone is reached after two strong events, which is why D6 requires diversity plus a delayed success.**

- **Display (gurukul A2 law):** `display` = the maximum level ever reached. **Absence never lowers it; evidence can.** Two consecutive delayed misses demote by one level, and one miss only sets `refresh` [U]. The parent view shows the Why records behind each change (learning-science §8.1 claim: "you can see the evidence").
- **Shadow criterion:** ema ← 0.9·ema + 0.1·c, with c = 1 for C0, 0.5 for C1, 0.25 for C2 and 0 otherwise. An EMA with α = 0.9 and threshold 0.95 was the recommended compromise in Pelánek & Řihák 2017 [V]. Taxila uses it as a guard: if BKT says learned but ema < 0.7, hold and log a disagreement.
- **Wheel-spinning:** ≥ 10 opportunities with no 3-in-a-row C0 (Beck & Gong 2013 [S]) → change approach and probe the prerequisite with the lowest pL. Do not serve the 11th similar item.
- **Fast-forward:** if the diagnostic (§3.4) puts pL0 ≥ 0.85 on a skill, skip practice and go straight to one generative probe plus a delayed check. TutorShop simulations cut over-practice by up to 35.7% with fast-forwarding, without increasing under-practice [V].

---

## 3. Ability, items, and fluency: Elo, Glicko, IRT, PFA

### 3.1 Scale

Internal unit: **grade-equivalent (GE)**. θ = 6.0 means "performs like a typical start-of-Class-6 child". For skill k in class g_k, the first-attempt success probability is P = c + (1−c)·σ(a·(θ − b_k)), with a = 1.5 per GE and the prior b_k = g_k − 0.5 + offset_k [U: vertical scale to be calibrated, K4]. The Rasch/1PL model is this with a fixed and c = 0. Elo is an online estimator of the same model (Pelánek 2016 [V]).

### 3.2 Learner θ and item b: Glicko, generalised by grid ADF

Glicko-1 [V] in GE units with slope a. For one answer y against item (b, σ_b):

```
g(σ_b) = 1/√(1 + 3a²σ_b²/π²);   E = σ(a·g(σ_b)·(θ − b));   V = a²·g²·E(1−E)
θ' = θ + a·g·(y − E)/(1/σ² + V);   σ'² = 1/(1/σ² + V)              // Glickman's update, rescaled from base-10/400 units
time:  σ² ← min(σ² + c²·Δdays, σ0²)                                // Glicko step 1
```

Glickman recommends an RD floor (30 rating points, which is 0.17 logits) "so that ratings can change appreciably" [V]. Taxila floors σ at **0.12 GE**. To set c: Glickman picks c so a typical player returns to "unrated" uncertainty after a chosen period [V]. Taxila picks 365 days from σ = 0.3 back to σ0 = 1.5, which gives **c = 0.077 GE/√day** [U]. A 60-day summer break then takes σ from 0.30 to 0.67, so the first session after a break re-probes before trusting old estimates.

**Implementation: grid ADF.** One function serves both learner and item updates. It takes the Normal prior onto 41 points (±4σ), multiplies by the *exact* likelihood (3PL with c = 1/K for MCQ, and the categorical outcomes of §1.2 through θ-dependent emissions), and moment-matches back to N(μ', σ'²). Checked in Node this session: for an open binary item at σ = 0.3 it agrees with the closed-form Glicko step to 0.001 GE. At cold-start σ = 1.5 it gives 6.16 against Glicko's 6.09; Glicko's single-step approximation is cruder there. It also handles guessing exactly, where Glicko's closed form does not. Elo with the uncertainty function K(n) = a/(1 + b·n), a = 1, b = 0.05 (Pelánek 2016 [V]: "a good starting point") is the fallback for item b if the grid proves too slow. It will not be slow: about 41 exponentials per update.

**Items generated on the fly.** Every LLM-generated variant inherits b ~ N(b_template, 0.5²) from its template [U]. Its own updates refine b_template through a hierarchical average: template n accumulates, items are mostly n = 1. Never let a single child's answer move b by more than 0.1 GE [U].

### 3.3 Fluency (T1/T2): item-level memory plus an Elo prior

For a fact item i that child c has never seen, the initial recall prediction is σ(a·(θ_c − b_i)) (the Papoušek et al. 2014 geography approach: a global skill plus item difficulty gives the prior [S via Pelánek 2016]). After the first exposure, R(t, S) from FSRS governs. G uses latency: G = 4 if correct and faster than the child's own median for that item class [U].

Do **not** use Math Garden's "high speed, high stakes" score S = (2c−1)(a·d − a·t) (Klinkenberg et al. 2011 [S via Pelánek 2016]) unless the UI shows the deadline. Pelánek notes the rule fits when timing is visible, and that hidden timing needs a different rule [V]. Visible timers are a poor fit for 6-9-year-olds [U].

Alternative if FSRS underfits: PFAE (θ += γ(1−P) if correct, θ += δ·P if wrong, with δ < 0) [V]. Papoušek et al. found PFAE beat both PFA and BKT on facts [S via Pelánek 2016].

### 3.4 Diagnostic: IRT CAT with EAP

- **Model:** 3PL, P_j(θ) = c_j + (1 − c_j)·σ(a_j(θ − b_j)). Fisher information is I_j(θ) = a_j²·((P−c)/(1−c))²·(1−P)/P [U, textbook]. A 2-option tap item has c = 0.5 and its peak information is 0.36x an open item's (computed). For 6-9-year-olds, prefer open spoken numeric answers (code-graded) and picture choices with 3+ options.
- **Prior:** θ ~ N(class − δ_subj, σ0²), with δ_maths = 1.0 and δ_other = 0.5 GE, σ0 = 1.5 GE [U]. This sits well inside the Indian evidence: the Delhi Grade 6 average was 2.5 grades behind in maths, and a class spans 5-6 levels (learning-science §5.2 [S]). Taxila's users are likely less behind than government-school samples, so the diagnostic, not δ, must do the work.
- **Loop:** pick the anchor item maximising I_j(E[θ]) (content-balanced across strands). Update the grid posterior (exact; no Normal re-fit during the CAT). Stop when SD(θ) < 0.35 GE, or after 8 items (ages 6-9) or 12 items (ages 10-15) per subject [U]. Present it as "let's see where to start", never as a test score.
- **Calibration path:** anchor-item b starts from grade priors, is updated online by ADF, and is re-calibrated offline by marginal maximum likelihood 2PL (R `mirt` or Python) at ≥ 300 responses per item [U]. Hierarchical/Bayesian IRT matched or beat DKT on proficiency estimation (Wilson et al. 2016 [V]), so IRT can carry the placement job alone.

### 3.5 From θ to per-skill BKT priors (cold start)

```
pL0(k) = clamp( σ( a·(μ − b_k) / √(1 + π·a²·σ²/8) ), 0.02, 0.85 )          // probit approximation of E[σ(·)] [U, standard]
pL0(k) = min( pL0(k), min_{j ∈ prereq(k)} pL(j) + 0.15 )                     // a skill can't be far ahead of its prerequisites [U]
```

Computed for a Class 6 maths child before the diagnostic (θ ~ N(5.0, 1.5²)): Class-4 skills 0.79, Class-5 0.61, Class-6 0.39, Class-7 0.21, Class-8 0.10. After a diagnostic giving N(4.2, 0.4²): 0.73, 0.40, 0.14, 0.04, 0.02. Class level alone is a weak prior: the diagnostic changes on-grade priors by about 0.25.

**Prerequisite propagation** (curriculum JSON `prerequisites` edges): strong evidence on k (|log LR| ≥ log 3) also updates each direct prerequisite j with a tempered LR: LR^0.3 for success, LR^0.1 for failure [U]. Propagation goes one edge only, never sets flags, and never creates mastery. Failure mainly *schedules* a prerequisite probe rather than lowering pL(j).

### 3.6 PFA / LKT: the challenger and the multi-KC fallback

PFA [V, Pavlik 2009]: m = Σ_{j ∈ KCs(item)} (β_j + γ_j·s_ij + ρ_j·f_ij), P = σ(m), where s and f count prior successes and failures. Fit β, γ, ρ by logistic regression, bounded γ ≥ 0 (as in the paper). R-PFA, LKT recency features and spacing features (LKT R package v1.7.0, Pavlik & Eglington [V]) are the natural extensions. Roles:
- (a) the monthly **champion/challenger** on held-out *delayed* outcomes (K6);
- (b) an AFM-style learning-curve audit, since a skill whose error curve does not fall is a mis-specified KC to split [U];
- (c) a backup for items with > 3 KCs.

---

## 4. Where the LLM sits (dialogue → evidence)

Dialogue KT is hard. On MathDial, classic BKT reached **AUC 0.64** against **0.77** for fine-tuned LLMKT; on CoMTA, classic KT was near chance (BKT AUC 0.52 against LLMKT 0.66) (Scarlatos, Baker & Lan, LAK 2025 [V]). On structured question data, specialised KT models beat LLMs on accuracy and F1, at under 0.25 s per student and **600-12,000× lower cost** (Eedi, Bhattacharyya et al. 2026 [V]). So:

1. Most mastery-moving evidence should come from **structured, code-graded items** that the teacher embeds in the conversation (the gurukul A1 practice engine). Dialogue probes (why, teach-back) add generative evidence through §1.3 folding.
2. The labeller is a constrained call that returns {skillIds ⊂ the active lesson's skills, cls, outcome, conf}. It never chooses the update.
3. The tutor's context gets a **derived** textual summary (top weak prerequisites, active misconceptions, due reviews), regenerated from the ledger (learning-science §8.3). It is never written back.

---

## 5. TypeScript module design

```
src/learner/kt/
  types.ts        EvidenceEvent, SkillParams, SkillState, Normal, Why          (§1.1, §2.1)
  outcomes.ts     OUTCOMES + default emission table, toGrade(cls, outcome)   (§1.2, §2.3)
  emissions.ts    foldNoise(e, M), lrPairToGS(lrPos, lrNeg), gate(e, R)      (§1.2-1.3)
  bkt.ts          stepSkill(), stepConjunctive(), predict()                  (§2.2, §1.5)
  memory.ts       ts-fsrs wrapper + local retrievability()                   (§2.3)
  ability.ts      adf(), inflate(), p3pl(), info3pl(), cat()                 (§3.2-3.4)
  priors.ts       pL0FromAbility(), applyPrereqCap(), propagate()            (§3.5)
  misconception.ts stepMisconception()                                       (§1.6)
  mastery.ts      nextFlags(), state(), display fold, wheelSpin(), ema       (§2.6)
  replay.ts       fold(events, paramsVersion) → states (deterministic)
  fit/em.ts       forwardBackward(), mStep(), project(), fitCluster(), fitEta()  (§2.5; offline)
  fit/pfa.ts      IRLS logistic fit (offline challenger)                     (§3.6)
api/learner/evidence.ts   POST events → insert kt_evidence + update states in one transaction → return summary
api/cron/kt-refit.ts      nightly: EM per changed cluster, η per child, item b, labeller M; writes a new kt_params version
```

Core code (complete enough to implement against):

```ts
// emissions.ts
export const lrPairToGS = (lp: number, ln: number) => { const g = (1 - ln) / (lp - ln); return { g, s: ln * (1 - g) }; };
export function foldNoise(e: { k: number[]; u: number[] }, M: number[][]) {   // M[true][label]
  const f = (p: number[]) => M[0].map((_, l) => p.reduce((acc, pt, t) => acc + pt * M[t][l], 0));
  return { k: f(e.k), u: f(e.u) };
}
// memory.ts
export const retrievability = (days: number, S: number, w20 = 0.1542) =>
  Math.pow(1 + (Math.pow(0.9, -1 / w20) - 1) * days / S, -w20);
// bkt.ts
const sig = (x: number) => 1 / (1 + Math.exp(-x)), logit = (p: number) => Math.log(p / (1 - p));
export function stepSkill(st: SkillState, ev: EvidenceEvent, P: SkillParams, cx: Ctx): { st: SkillState; why: Why } | null {
  if (ev.asrConf !== undefined && ev.asrConf < cx.ASR_MIN) return null;          // no evidence
  const T = sig(logit(P.T) + cx.eta);
  if (ev.teach) return { st: { ...st, pL: st.pL + (1 - st.pL) * T }, why: { ev: ev.id, lr: 1 } };
  const e = foldNoise(P.emis[ev.cls], cx.confusion(ev.cls, ev.grader, ev.graderVersion));
  const R = st.mem ? retrievability(daysBetween(st.mem.lastReviewAt, ev.at), st.mem.S, cx.w20) : 1;
  const k = R * e.k[ev.outcome] + (1 - R) * e.u[ev.outcome], u = e.u[ev.outcome];
  let lr = k / u;
  if (ev.cls === 'para') lr = Math.min(1.2, Math.max(1 / 1.2, lr));
  if (ev.gaming) lr = Math.pow(lr, 0.25);
  const q = (st.pL * lr) / (st.pL * lr + 1 - st.pL);
  const pL = ev.cls === 'para' ? q : q * (1 - P.F) + (1 - q) * T;
  const next = mastery.advance({ ...st, pL, n: st.n + 1, lastAt: ev.at }, ev, cx);   // flags, ema, display, wheel-spin
  return { st: memory.maybeReview(next, ev, cx), why: { ev: ev.id, lr, before: st.pL, after: pL, R } };
}
// ability.ts — one function for learner θ and item b
export function adf(prior: Normal, lik: (x: number) => number, sdFloor = 0.12, n = 41): Normal {
  let s0 = 0, s1 = 0, s2 = 0;
  for (let i = 0; i < n; i++) {
    const z = -4 + (8 * i) / (n - 1), x = prior.mu + z * prior.sd, w = Math.exp(-z * z / 2) * lik(x);
    s0 += w; s1 += w * x; s2 += w * x * x;
  }
  const mu = s1 / s0;
  return { mu, sd: Math.max(sdFloor, Math.sqrt(Math.max(s2 / s0 - mu * mu, 1e-12))) };
}
export const inflate = (p: Normal, days: number, c = 0.077, sd0 = 1.5): Normal =>
  ({ mu: p.mu, sd: Math.min(sd0, Math.sqrt(p.sd * p.sd + c * c * days)) });
export const p3pl = (th: number, b: number, a = 1.5, c = 0) => c + (1 - c) * sig(a * (th - b));
```

`ts-fsrs` usage (API names [U]: check against the installed version):
- `const f = fsrs({ request_retention: 0.9, enable_fuzz: false })`
- `f.next(card ?? createEmptyCard(at), at, grade).card`, mapping G 1-4 to `Rating.Again..Easy`.

### 5.1 Storage (Neon Postgres; proposed `db/migrations/0xx_kt.sql`)

```sql
create table kt_evidence (            -- append-only; the source of truth
  id uuid primary key, seq bigserial, child_id uuid not null, session_id uuid not null,
  occurred_at timestamptz not null, skill_ids text[] not null, cls text not null, outcome smallint not null,
  grader text not null, grader_version text, asr_conf real, item_key text, latency_ms int,
  gaming boolean not null default false, teach boolean not null default false, params_version text not null);
create index kt_evidence_child_time on kt_evidence (child_id, occurred_at, seq);
create table kt_skill_state (child_id uuid, skill_id text, params_version text not null, p_l real not null,
  mem jsonb, n int not null, flags jsonb not null, ema real not null, display smallint not null,
  refresh boolean not null, updated_at timestamptz not null, primary key (child_id, skill_id));
create table kt_params (version text, scope text, key text, params jsonb not null, n_students int, n_obs int,
  fitted_at timestamptz not null, primary key (version, scope, key));   -- scope: cluster|skill|labeller|fsrs
create table kt_ability (child_id uuid, subject text, mu real not null, sd real not null, updated_at timestamptz,
  primary key (child_id, subject));
create table kt_item (item_key text primary key, template_key text, b_mu real, b_sd real, a real default 1.5,
  c real default 0, n int default 0);
create table kt_misconception (child_id uuid, misconception_id text, logit real not null, last_at timestamptz,
  resolved_at timestamptz, primary key (child_id, misconception_id));
create table kt_child (child_id uuid primary key, eta real not null default 0, eta_n int not null default 0);
```

- **Event-sourced.** State = fold(params version, events ordered by (occurred_at, seq)). Unlike Gurukul's commutative `foldMastery`, BKT is **order-dependent**, so the order key is mandatory.
- After a refit, states are re-folded lazily at the child's next session start. About 50 events a day for a year is about 18k events per child, which folds in tens of milliseconds [U].
- Updates run in the evidence API route, never in the realtime audio path.
- One open session per child, so a row lock on `kt_skill_state` is enough.

### 5.2 Invariants (tests, `node --test tests/`)

1. A correct C0 never lowers pL, for any fitted parameters (the projection guarantees LR(C0) ≥ 1.5; EDM 2024 monotonicity [V]).
2. An event with low ASR confidence leaves every table unchanged.
3. Time passing without evidence never changes `display` (gurukul A2).
4. `para` events move pL by at most a factor of 1.2 in odds.
5. Replay is deterministic and idempotent: same events + params gives byte-identical states.
6. EM recovers synthetic parameters within ±0.03 at 500 students, and matches pyBKT (binary reduction) within ±0.02.
7. `foldNoise` with the identity M is a no-op; with a fully uninformative M, every LR is 1.
8. No state reaches `mastered` without a delayed event ≥ 20 h after `learned-today`.

---

## 6. Open-source references: what to take

| project | what it is | take | leave | tag |
|---|---|---|---|---|
| **pyBKT** (CAHLR; Badrinath, Wang & Pardos, EDM 2021) | Python BKT: EM fitting, CV, random restarts; variants `multigs` (KT-IDEM), `multiprior` (KT-PPS), `forgets`, `multipair` (item order), `multilearn` (item/resource learn rates); about 30,000× faster than BNT | the reference implementation for the EM parity test; offline fits on pooled data; its "50 students × 15 opportunities" convergence guidance | the Python runtime in production | [V] |
| **OATutor** (CAHLR; Pardos et al., CHI 2023) | React + Firebase ITS; `BKT-brain.js` is the 10-line standard update (posterior, then learn); `bktParams` per KC; picks the problem with the lowest mastery; content CC BY 4.0 | the item/hint content format; A/B hooks; the open algebra content as test fixtures | lowest-mastery selection (it ignores delayed retrieval and prerequisites) | [V] code; paper [S] |
| **CTAT / TutorShop** (CMU) | example-tracing tutors with built-in BKT; defaults p_init 0.25, p_learn 0.2, p_guess 0.2, p_slip 0.1, mastery 0.95 | defaults as one anchor; fast-forwarding (−35.7% over-practice in simulation) | authoring stack | [V] (Xia et al. 2025) |
| **Eedi** | diagnostic MCQs whose distractors map to misconceptions; NeurIPS 2020 dataset of > 20 M answers (tasks: predict answers, question quality, personalised sequence); EDM 2026: KT models (DKT, SAKT) beat LLMs | the item + misconception format (§1.6); the dataset for structure pre-training (UK maths → map to NCERT); evidence for D7 | UK curriculum content | [V] |
| **ASSISTments** (WPI) | open datasets (2009-10 skill builder, 2012-13 with affect, 2015 skill builder, …) under WPI IRB-approved terms; partial-credit research | benchmark data for EM parity and for the champion/challenger harness | the 2009-10 duplicates that inflated DKT (Xiong 2016 [S]); skill-builder "3 in a row" as a mastery rule [U] | [V] site |
| **ts-fsrs** + `@open-spaced-repetition/binding` | MIT TypeScript FSRS v6; optimiser for training parameters from review logs | the memory sub-model and its refit | adult-flashcard default parameters as final values | [V] |
| **LKT** (R, CRAN 1.7.0, 2024) | logistic KT framework (Pavlik, Eglington, Harrell-Williams 2021) | offline feature exploration for the PFA challenger | R in production | [V] |
| **hmm-scalable** (Yudelson) | C++ BKT fitting with per-student parameters | a cross-check for η fits | n/a | [S] (cited by pyBKT) |

---

## 7. Measurements this design depends on (KT-specific; complements learning-science §9)

| id | question | method | blocks |
|---|---|---|---|
| K1 | Labeller confusion matrices per evidence class and grader version | 300+ child turns double-rated by teachers (shared with E2); fit M | §1.3 folding; D7 |
| K2 | Does EM recover parameters at Taxila's data shape (short sequences, many generated items)? | synthetic replay at 50/200/1000 children; parity with pyBKT | graduating clusters to per-skill parameters |
| K3 | Children's forgetting curves for concepts and facts (w20, S0 by topic type) | log every delayed check; refit FSRS with `binding` at about 5k checks per type | scheduler accuracy; D2 |
| K4 | Vertical GE scale: a, b offsets, δ by subject and board | diagnostic pilot, 2PL concurrent calibration across classes 1-9 | §3.1, §3.5 priors |
| K5 | Hint-ladder emission rows (C1-C4) per rung design | EM on the first 10k ladder items | §1.2 |
| K6 | Champion/challenger: BKT-R vs PFA vs Elo vs FSRS-only on **delayed** outcomes | monthly, held-out children; AUC, RMSE, calibration | D1, D5 |
| K7 | Does "mastered" predict 1- and 4-week delayed accuracy ≥ 0.9? | audit sample of mastered skills | D6 thresholds |

### 7.1 Constraints carried over

The `para` evidence class (latency and disfluency) is the most "behavioural" input in the ledger. It stays **off** (`KT_PARA_ENABLED=false`) until the DPDP §9(3) legal opinion (learning-science §4.3). With it off, the ledger stores only answers, outcomes and timestamps. Raw audio is never an input.

---

## 8. Sources

- Pelánek, R. (2017). Bayesian knowledge tracing, logistic models, and beyond (UMUAI). https://www.fi.muni.cz/~xpelanek/publications/umuai-overview.pdf [V]
- Pelánek, R. (2016). Applications of the Elo rating system in adaptive educational systems (C&E). https://www.fi.muni.cz/~xpelanek/publications/CAE-elo.pdf [V]
- Pelánek, R., & Řihák, J. (2017). Experimental analysis of mastery learning criteria. UMAP. http://www.fi.muni.cz/~xpelanek/publications/mastery-detection.pdf [V]
- Glickman, M. The Glicko system. http://www.glicko.net/glicko/glicko.pdf [V]
- Badrinath, A., Wang, F., & Pardos, Z. (2021). pyBKT. EDM. https://arxiv.org/abs/2105.00385 · https://github.com/CAHLR/pyBKT [V]
- Khajah, M., Lindsey, R., & Mozer, M. (2016). How deep is knowledge tracing? https://arxiv.org/abs/1604.02416 [V]
- Wilson, K. et al. (2016). Back to the basics: Bayesian extensions of IRT outperform neural networks. https://arxiv.org/abs/1604.02336 [V]
- Pavlik, P., Cen, H., & Koedinger, K. (2009). Performance Factors Analysis. AIED. https://files.eric.ed.gov/fulltext/ED506305.pdf [V]
- Beck, J., Chang, K., Mostow, J., & Corbett, A. (2008). Does help help? ITS. https://www.cs.cmu.edu/~listen/pdfs/beck%20Does%20help%20help.pdf [V]
- Settles, B., & Meeder, B. (2016). A trainable spaced repetition model (HLR). ACL. https://aclanthology.org/P16-1174.pdf [V]
- FSRS algorithm (v4-v6 formulas, FSRS-6 defaults). https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm [V] · ts-fsrs https://github.com/open-spaced-repetition/ts-fsrs [V]
- Shchepakin, D., Sankaranarayanan, S., & Zimmaro, D. (2024). Parametric constraints for BKT from first principles. EDM. https://educationaldatamining.org/edm2024/proceedings/2024.EDM-long-papers.2/index.html [V]
- Xia, Schmucker, Borchers, & Aleven (2025). Optimizing mastery learning by fast-forwarding over-practice steps (TutorShop defaults). https://arxiv.org/abs/2506.17577 [V]
- OATutor code: https://github.com/CAHLR/OATutor (`src/models/BKT/BKT-brain.js`) [V]; Pardos et al. (2023) CHI. https://doi.org/10.1145/3544548.3581574 [S]
- Scarlatos, A., Baker, R., & Lan, A. (2025). Knowledge tracing in tutor-student dialogues using LLMs. LAK. https://doi.org/10.1145/3706468.3706501 [V]
- Bhattacharyya, P., Mitton, J., … Woodhead, S. (2026). Specialised KT models outperform LLMs. EDM. https://arxiv.org/abs/2603.02830 [V]
- Wang, Z. et al. (2020). Diagnostic questions: the NeurIPS 2020 Education Challenge (Eedi). https://arxiv.org/abs/2007.12061 [V]
- ASSISTments datasets. https://sites.google.com/site/assistmentsdata/ [V] · LKT (CRAN). https://cran.r-project.org/package=LKT [V]
- Yudelson, Koedinger & Gordon (2013) individualized BKT; Ritter et al. (2009) reducing the KT space; Qiu et al. (2011) time in BKT; Doroudi & Brunskill (equity); Wang & Heffernan (2013) partial credit; Baker, Corbett & Aleven (2008) contextual guess/slip; Nixon et al. (2013) attrition bias; Koedinger et al. (2011) conjunctive KT; Klinkenberg et al. (2011) Math Garden; Papoušek et al. (2014) — all [S], via the [V] sources above.


---

## Review

**Reviewer:** skeptical pass (learning scientist + engineer), 2026-10-02. Method: read the whole file; re-computed the emission-table sums and LRs, the §1.3 labeller table, the FSRS R values, the Glicko c and the §3.5 priors by hand (all arithmetic checks out); re-fetched the abstracts for Khajah 2016, Xia 2025 and Bhattacharyya 2026. Verdict: the arithmetic is sound and the architecture (event-sourced, LR-based, grader-noise folding) is the right shape. But there are 6 correctness defects, 4 child-safety/legal gaps, and several [V] tags that are stronger than the evidence. Corrections are numbered R1-R28 and ordered by severity within each group.

### A. Defects that would produce wrong mastery (fix before any build)

- **R1. `ema ≥ 0.7` contradicts the §2.6 worked trace.** With ema ← 0.9·ema + 0.1·c, a child starting at ema = 0 needs 12 straight C0s to reach 0.7 (1 − 0.9^12 = 0.72). The trace claims "learned-today" after 3 events. Also unspecified: ema's initial value, and what c is for non-item probes. Fix: define ema's init (= pL0 or 0.5), define c for every class (probe pass = 1, partial = 0.5, fail = 0), and either use α = 0.6-0.7 (about 4-5 events to converge) or drop the ema guard and use the Beck/Pelánek "n of last m" rule. The Pelánek & Řihák α = 0.9 was tuned for adult-scale item counts; re-check the direction of their α before citing it [U until re-read].
- **R2. T is applied per event, but events are not opportunities.** Step 5 applies the learning transition on every evidence event, including each LLM-emitted probe and each `teach` event. One 30-second exchange can emit why + teach-back + transfer = 3 transitions. Repeated `teach` events raise pL with no observation at all (10 teach events at T = 0.12 gives pL ≈ 0.72 from pL0 = 0.25). That feeds fast-forward, the prerequisite cap and propagation. Fix: (a) apply T at most once per (skill, session, item-episode); (b) `teach` raises pL only on the first teach per session and is capped at +0.1 total; (c) fit T per episode, not per event.
- **R3. Same-session evidence is not independent, but the ledger multiplies LRs.** BKT assumes conditional independence. Rephrasings of one item, and probes in the same minute, share error sources (misreading, ASR, a lucky guess, a parent whispering). Three "strong" events take pL 0.39 → 0.996 (§2.6). Fix: a per-(skill, session) LR budget: |Σ log LR| ≤ log 12 within one session, with diminishing weight on the 2nd/3rd event (LR^0.7, LR^0.5) [U]. Then test the diversity rule (D6) against it.
- **R4. pL0 conflates P(correct) with P(known) (§3.5).** The formula uses σ(a(θ−b)), the 1PL success probability (which already includes guessing and slipping), as P(known). Fix: pL0 = clamp((P − g)/(1 − g − s), 0.02, 0.85) with the cluster's g and s (from §1.2 or the lrPairToGS conversion). Otherwise a child at b has pL0 = 0.5 and an expected success of 0.5·0.9 + 0.5·0.1, which double-counts. Also fix the scale: "b_k = g_k − 0.5 offset" means an on-grade child succeeds on on-grade items only about 50% of the time, which is not what teachers or the Taxila UI will mean by "on grade". Calibrate the b offset so that a typical on-grade child has P ≈ 0.7 (K4).
- **R5. Online and replayed states diverge (invariant 5 is false as designed).** The online fold applies events in arrival order. Replay orders by `(occurred_at, seq)`, where `occurred_at` is client-supplied and `seq bigserial` is insertion order, not commit order. An offline or late event (Capacitor APK, flaky Indian mobile networks) breaks equality. Fix: order key = server-assigned `seq` taken under a per-child advisory lock (`pg_advisory_xact_lock(hashtext(child_id))`), and treat `occurred_at` as advisory only. Lock on the child, not on `kt_skill_state`, because the row does not exist for a child's first events. Add a test: shuffled-arrival replay equals online for the same `seq` order.
- **R6. Mutable global tables break the "replay is deterministic" claim and create a feedback loop.** `kt_ability`, `kt_item`, `kt_misconception` and `kt_child.eta` are updated online and are not part of `fold()`. Item b is updated by each child's answers and then feeds every other child's pL0, while θ is updated against that same b. θ and b are not separately identified by single updates, so ratings drift. Fix: freeze b, a and c per `params_version` (the nightly job is the only writer). Online updates touch θ only. Put θ, misconceptions and η under the same event-sourced fold, or declare them derived caches with a rebuild job.
- **R7. Forgetting is only in the gate, so pL never decays and `mastered` is sticky in the wrong direction.** F = 0 and pL has no time dependence. A child whose R has fallen to 0.4 still has pL = 0.999, and the only signal is `refresh`. Combined with "display is the max ever reached", the parent sees "mastered" for a skill that is probably gone, until two consecutive misses. Fix: keep display monotone but add a separate `retention` field (current P(retrievable) = pL·R) that drives the tutor and the parent's "still solid?" indicator. Never show a stale "mastered" as the current state.
- **R8. The R gate is applied to skill-level memory built from heterogeneous items.** FSRS is fitted for one card = one item. Here S is per skill, updated by whichever item/probe came first in a session, graded G by outcome class. A near-transfer pass and a rote C0 are different "cards". Define which events count as the retrieval ("first retrieval-type event" is unspecified, step 6), and fix D0, which the file never initialises (needs w4, w5). Treat the skill-level S as a heuristic [U], not FSRS-6 validity. The fitted-on-adults warning is already there; add that 6-9-year-old forgetting is expected to be steeper at short intervals (K3 should not wait for 5k checks to alert on this: monitor calibration at n ≈ 500).

### B. Evidence overstated or tags too strong

- **R9. Khajah 2016 "AUC 0.73 → 0.83 with forgetting" [V].** The abstract I re-fetched says only that extended BKT is "indistinguishable from DKT". The 0.73 → 0.83 figures are not in the abstract; re-check them against the full PDF, and note that this paper used the ASSISTments 2009-10 data that §6 itself flags as duplicate-inflated for DKT (Xiong 2016). Downgrade to [S] until the table is re-read; the design conclusion (BKT extensions are competitive) survives.
- **R10. Bhattacharyya 2026 "under 0.25 s, 600-12,000× lower cost" [V].** The abstract supports "orders of magnitude slower/costlier" and better accuracy/F1; the specific 0.25 s and 600-12,000× figures are not there. Tag those two numbers [S] until located in the body. The task is predicting responses on UK Eedi MCQ data, not judging dialogue; it supports "code-graded items first" but not "LLMs cannot label".
- **R11. Xia 2025 "35.7%"** is "up to one third" in the abstract, from simulation, with a stated motivation caveat. Fine to use as a ceiling; do not write it as an expected saving for children, who disengage at higher difficulty (the paper's own caveat).
- **R12. Beck 2008 guess 0.655 → 0.944 with help** comes from Reading Tutor word reading, a different domain and a different help model than a math hint ladder. Present it as direction-only evidence for the "hinted-correct is weak" idea. It does not support the specific LRs 1.0/0.35/0.16 [U].
- **R13. Every emission, T, F, pL0, G-mapping, gaming exponent (0.25), propagation exponents (0.3/0.1), the 0.7 misconception gate and the 20 h delay is [U].** The file says so, but D6 and invariants 1 and 8 read as settled. Add a table "launch value → what measurement replaces it → what failure makes us act". Without that, [U] defaults will become dogma (CLAUDE.md: "a decision needs a reversal condition"). D2, D4 and D5 have reversal conditions that reference K-measurements that cannot run until real children exist; state the launch-day fallback explicitly (frozen defaults; no auto-refit before n thresholds).
- **R14. The 20-hour "delayed success" is retention evidence of one day.** The spacing literature (Cepeda et al. 2008 [S, from memory, not re-fetched]) puts the optimal gap at a fraction of the target retention interval; a 1-day check says little about a month. Split: `mastered` = delayed success ≥ 20 h; `durable` = a second success ≥ 7 d (and one at ≥ 30 d), and only `durable` is claimed to parents as "retained". K7 should audit at 1, 4 and 12 weeks.
- **R15. Testing recovery of synthetic parameters (invariant 6, K2) proves the code, not the model.** Data simulated from the same BKT-R, then recovered by the same EM, is circular. Add model-misspecification tests: simulate with a different generator (e.g. DKT-style or IRT-with-forgetting, and the persona simulators in `student-simulators.md`) and check that mastery calls and delayed-accuracy audits degrade gracefully. Report calibration (ECE) and AUC on delayed items, not only parameter error.

### C. Unsafe or risky for children; DPDP §9(3)

(Status of DPDP Act / Rules text was not re-fetched in this pass; everything here is [U] and needs counsel. The CLAUDE.md directive deprioritises compliance, so I split what is legal from what is plain child safety.)

- **R16. §7.1 says the ledger stores only answers, outcomes and timestamps when `para` is off, but the schema and algorithm do not follow that.** `latencyMs`, `gaming`, `asrConf` and `latency_ms` are stored; FSRS G = 4 uses latency (§3.3); the `gaming` LR-tempering is latency-derived; T1 "latency enters G". That is behavioural monitoring of a child by another name. Either (a) treat latency as `para`, drop it from the ledger and from G, and flag `gaming` only from outcome patterns (a rapid run of bottom-outs and gave-ups, which needs no timing), or (b) include latency in the legal opinion explicitly. The `KT_PARA_ENABLED` flag must gate the columns, not only the LR clamp.
- **R17. Event-sourced append-only log vs erasure and storage limitation.** "Source of truth, append-only" with years of events per child, plus labeller double-rating on stored child turns (K1), plus pooled EM across children. Needs: per-child crypto-shred key; a TTL/retention policy for raw evidence (keep fitted states and aggregates); a fold that survives deletion; a consent scope that explicitly includes using de-identified child data to refit shared parameters and to double-rate turns by teachers; no teacher access to identifiable transcripts without a processor agreement. Add a `delete_child(child_id)` test to §5.2.
- **R18. Profiling labels shown to parents and children.** θ in grade-equivalents, η ("learning speed"), and "mastered/learned" displays can produce shame or fixed-mindset effects, and parents may pressure the child ("2 grades behind"). Rule: θ and η are internal. Never show η at all. Show parents growth and next steps with Why records, and never a GE gap number to the child. Add this as an invariant on the parent/child view layer.
- **R19. The CAT is built to hit about 50% success.** Max-information item selection chooses items where P ≈ 0.5-0.6; for a 6-year-old, 4 of 8 items will feel like failure. Fix: (a) interleave deliberately easy "anchor wins" items that are excluded from the information calculation (they still carry a little evidence); (b) stop on any distress marker the Director raises (the Director, not a latency detector); (c) hard cap 6 items at age 6-7; (d) a final item must be one the child gets right with high probability. State this in the CAT loop.
- **R20. "Gave up / bottom-out" is penalised as hard as the strongest failure (LR 0.05) and honesty is not rewarded.** Children who say "I don't know" are showing good metacognition; training the child toward guessing is a product harm. Add an `idk` outcome (distinct from a wrong answer and from timeout), LR ≈ 0.4-0.6 (milder than a confident wrong answer), excluded from `gaming`, and never from a negative display. Also add a `non-attempt` outcome for refusals, tiredness and parent interruptions: no update at all.
- **R21. Gaming/latency false positives hit exactly the wrong kids.** A fast child is flagged "gaming" and all LRs are tempered by 0.25 power, so mastery is delayed and over-practice (the harm Xia 2025 fixes) is created for the strongest students. A weak child with low reading speed who taps randomly is flagged too, and loses evidence. The detector is not specified anywhere. Specify it (outcome-based, R16), measure its false-positive rate on the simulators, and cap tempering to once per session.
- **R22. Parent-in-the-loop answers are not modelled.** Many 6-10-year-olds are helped, or answered for, by a parent or sibling beside them; the `unaided` flag only means "no tutor hints". Mastery shown to parents as "the evidence" can therefore be parent-fed. Mitigation: always include a short cross-session check, accept the uncertainty, and word the parent view as "answers observed", not "knows". Note in K7.

### D. Fairness and missing model terms

- **R23. Dropping events with `asrConf < ASR_MIN` is not missing-at-random.** Child speech, regional accents and Hindi-English code-mixing have higher ASR error rates (rate not measured here [U]). Those children get fewer valid events, so they take longer to master and see more repeats. `ASR_MIN` is also never given a value. Fix: set ASR_MIN from child-speech validation (not adult confidences); log drop rate by age band, language, gender, board and device; if the gap is more than a threshold, switch to a tap or typed-answer fallback instead of dropping; and add Hindi number-word normalisation for numeric answers ("pachpan" vs 55), which is part of the code-graded path.
- **R24. No language-load term.** A child strong in maths but weak in English reading fails word problems because of language, and the ledger attributes that to the skill. Add `languageLoad` (item text language, reading level, spoken vs. text) as an item feature; fit separate b per language form or an additive language term for θ; for classes 1-2 use no-reading items. This is the largest India-specific threat to the validity of θ.
- **R25. θ has no growth drift.** The inflation term widens σ but keeps μ fixed; over a school term the child's μ lags the true value by up to 0.5-1 GE per year. Add a small positive drift during term time (about +0.002 GE/day, to be calibrated in K4) or a hierarchical growth prior.
- **R26. Fatigue / session-position effect.** Late-session items have lower accuracy for reasons unrelated to knowledge; no covariate exists. Add session position and time-of-day to the offline challenger and the contextual guess/slip (Baker-Corbett-Aleven 2008 [S]); do not use time per answer for it online (R16).

### E. Implementation gaps

- **R27. Gaps in the code and spec that block a build.**
  - `teach` events: the EM forward/backward does not say that a `teach` step has emission 1.
  - Posterior combination of conjunctive items with `teach`, `para` and the η term is never shown; `stepConjunctive` is listed but not written.
  - A single misconception-class outcome on `probe.why` changes both pL (LR 0.15) and the tracker (LR 6.9): decide whether this double-counts and say so.
  - `ts-fsrs` API names are tagged [U]; pin a version and write a golden test of the local `retrievability()` against the library.
  - EM projection after the M-step breaks the monotone-likelihood guarantee; use projected/constrained optimisation or log it as approximate.
  - MCQ guess = 1/K assumes uniform choice; distractors designed around a misconception are chosen more than 1/K by non-knowers and test-wise children eliminate; fit u per item class.
  - `labeller M` default "diagonal 0.8 [U]" is optimistic if the labeller is also the tutor model grading its own dialogue (correlated error); use 0.7 until K1.
- **R28. Missing test and eval items.**
  1. Online-vs-replay equality under shuffled arrival (R5).
  2. An erasure test (R17).
  3. A fairness report: ASR drop rate and time-to-mastery by age, language, device (R23).
  4. A held-out delayed-outcome calibration plot before any `mastered` claim reaches parents.
  5. A "hostile" simulator suite: parent-answering, rapid guessing, silent children, mixed-language, tired late-session.
  6. A rollback plan: `params_version` pinned per child so a bad refit can be reverted.

### Summary of changes to the decision table

| decision | change |
|---|---|
| D1 | keep BKT-R; add R2/R3 (one T per episode, per-session LR budget) and R7 (retention field) as conditions of the claim |
| D2 | keep; add R8 caveat, and that skill-level S is a heuristic |
| D3 | keep ADF; freeze b between nightly refits (R6); add drift (R25) |
| D4 | keep; add the success-floor and distress stop rules (R19); fix R4 |
| D6 | split `mastered` / `durable` (R14); fix ema (R1) |
| D7 | keep; set M default 0.7 (R27); note that the Eedi paper evidences accuracy/cost, not dialogue labelling (R10) |
| §7.1 | extend `para` to cover latency and gaming and the DB columns (R16) |
