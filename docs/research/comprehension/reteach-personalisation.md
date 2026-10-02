# Re-teaching and style personalisation: picking the next representation from this child's history, and adapting the tutor to the child's vibe

Date: 2026-10-02. Scope: what Taxila does once the comprehension engine decides the child **did not understand**,
and how the tutor's style (pace, humour, formality, verbosity, examples, challenge framing) adapts to the child.
Feeds `server/comprehension/**` (re-teach selector), `server/director/pedagogy.js` (LEARNER-MODEL §6.5a),
kits (`data/kits/SCHEMA.md`), Forge (FACTORY §4.9 remediation media), STUDENT-SIM battery R3, and the VibeProfile.

**Builds on, does not repeat:** `learning-science.md` (LS) §1.13, §2, §3.4-3.5, §7 (P1-P24), §8.4 (format bandit);
`learner/personalisation-2026.md` (PZ1-PZ15, the L/F/X knob classes); `learner/vibe-temperament.md` (VT §4.2 knobs);
`learner/LEARNER-MODEL.md` §6.5-6.6; `learner/STUDENT-SIM.md` R3a-R3d; `comprehension/products-live.md` M4
(Mindspark dissonance re-teach); `comprehension/conversation-probes.md`; `comprehension/game-stealth.md`.

## Evidence tags

| tag | meaning |
|---|---|
| **[V]** | Checked this session in the primary source: full text (`pdftotext`) or the publisher/arXiv/ERIC abstract (*abs*). Numbers are from that text. |
| **[S]** | Search-engine summary, secondary page, or a sibling doc's [V] that was not re-read here. Direction reliable; re-check numbers before a `context/` entry. |
| **[U]** | Our inference, extrapolation (to Indian children 9-13, voice, English/Hindi/Hinglish), or an uncalibrated starting value. A hypothesis. |

**Governing caveat.** No study found re-teaching *choice* on Indian children in voice. Every effect size below is from
US/European/East-Asian samples, mostly text or classroom. The one Indian RCT (Mindspark) tests a whole system, not
a remediation choice. Treat every number as an upper bound until Taxila measures its own.

**Inherited law applies.** Everything in this doc that the teacher might say is written as a **shape** (⟨angle-bracket
slots⟩), never as a sentence. Kits and arms carry shapes; the realtime model voices them.

---

## 0. The answer on one screen

| id | decision | evidence (short) | reverse if |
|---|---|---|---|
| RT1 | **A re-teach is never a repeat.** The next attempt must change the *representation class* (not the wording) of a failed attempt. A class that failed for this child on this skill is excluded until a different class has been tried | Remediation that only rejects ("no, try again") scored worst in human tutoring corpora; locating the error specifically scored best (Callaway & Moore 2007, 198 remediations) [V]. STUDENT-SIM R3b already gates lexical diversity | an MRT shows same-class re-explanation resolves as often as a class change on delayed probes |
| RT2 | **Misconception first, then representation.** A confirmed misconception routes to its kit-verified remediation arms (contrast, counter-example, predict-reveal). Generic re-explanation is the fallback for "no specific bug" | Eedi: misconception-targeted dialogue 91-93% vs 65.4% static hints [S via PZ]. Refutation text g = 0.41 (44 comparisons, n = 3,869) [S]. Contrasting cases d = 0.50 (57 experiments) [S]. Erroneous examples: immediate null, **delayed d = 0.33** (n = 390) [V abs] | none (structural) |
| RT3 | **History gives four things reliably, a fifth only after a gate.** Reliable: (a) what failed, (b) representational fluency (which representations the child can already read), (c) relapse-prone misconceptions, (d) prior-knowledge level. Gated: (e) a per-child *preference* for a representation class | Per-student heterogeneity in assistance effects was "too small" for contextual bandits to beat a tuned one-for-all bandit (1M students; Schmucker et al. 2025) [S via PZ]. Learning-style matching g = 0.31 but only **26% of measures** showed the crossover the hypothesis needs (Clinton-Lisell & Litzinger 2024, 21 studies) [V abs] | the HTE gate (PZ §3.9) passes for representation class |
| RT4 | **Representational fluency is knowledge, not style.** Track `repFluency[child, representationId]` (number line, area model, bar model, ratio table, circuit diagram) from `translate_rep` items (P14) and engine telemetry. A re-teach may use a representation only if the child can read it, or it first teaches the representation | Interleaving fraction representations beat blocking, and fluency with each representation is a separate competency (Rau, Aleven & Rummel 2014, n = 230, grades 4-5) [V abs]. Analogies need the source to be familiar and the mapping cued (Richland, Zur & Holyoak 2007) [S] | RT-M3 shows repFluency adds no predictive value for re-teach success beyond pL |
| RT5 | **Move along the concrete-pictorial-abstract ladder by evidence.** A failed abstract attempt drops one level (to pictorial or a manipulative engine). A concrete success then *fades up* before the transfer check | Concreteness fading gave better transfer than concrete-only or abstract-only; low-prior children benefited most (Fyfe et al. 2014 review; Fyfe, McNeil & Borjas 2015) [S]. Concrete-only instantiation can block transfer (Kaminski et al. 2008, *Science*) [S], though later replications dispute this (Trninic et al. 2020) [S] | RT-M5 finds no transfer difference between faded and non-faded interest contexts |
| RT6 | **The arm choice is a population bandit with an adaptive exploration floor (TS-PostDiff), restricted to kit-verified arms.** The first re-teach for a confirmed misconception is deterministic (the kit primary arm, as PZ review A4 requires). Randomisation begins only at the second re-teach and only among arms the kit verifies | TS-PostDiff mixes uniform assignment with Thompson sampling in proportion to the posterior chance that the arms differ by less than *c*. It cut false positives and raised power when differences were small, while keeping reward when they were large (simulation) [V abs]. A stochastic LLM strategy router beat a greedy one, 28.1% vs 19.1% exercise conversion (359 high-school students) [V abs] | the bandit's arm effects converge (posterior P(\|Δ\| < c) > 0.95 for every pair): then freeze to the best arm and drop to the 20% floor |
| RT7 | **Credit an arm on delayed resolution, not immediate repair.** Reward = unaided isomorph next (y_next) **and** misconception absent on a covert delayed probe at ≥ 1 day (y_delay) **and** no induced bug. Immediate repair earns only partial credit | Erroneous examples: no immediate difference, d = 0.33 delayed, and students rated the *less* effective arm as more satisfying (d = 0.21) [V abs]. Reattempt correctness correlated r = 0.04 with next-question correctness (Schmucker) [S via PZ8] | the OE anchor test shows immediate repair predicts delayed outcomes as well as y_delay does |
| RT8 | **Two distinct failed arms trigger a descent to the weakest prerequisite, not a third attempt at the same concept.** At most 3 distinct re-teaches per concept per session; then park the concept, schedule a spaced re-teach with a new arm, and tell the Conductor | Mindspark's level-adaptive remediation: +0.37 SD maths, +0.23 SD Hindi in 4.5 months, with larger relative gains for weaker students (Muralidharan, Singh & Ganimian 2019, AER) [V abs]. Prerequisite-graph remediation is the shipped ASSISTments PLACEments pattern [S]. Wheel-spinning (LS P21) | RT-M2 shows a third same-concept arm resolves more often than prerequisite descent |
| RT9 | **Forgot is not never-understood.** A delayed failure after a confirmed resolution gets a brief retrieval of the arm that worked, which is not a repeat of a failure. A never-resolved concept gets a new arm | Retrieval and spacing are the strongest evidence-based core (LS §3.5); a re-teach after successful learning wastes time and risks the expertise-reversal penalty (LS §2.5) [U for the split rule] | RT-M2 shows the split adds nothing |
| RT10 | **Style is mostly F (engagement), adapted inside L-safe bounds.** The one style lever with learning evidence, conversational register, is a **default for everyone**, not a per-child knob. During a re-teach, style knobs that add load are suppressed: humour off, no decorative interest detail, turn length at the lower third | Conversational style: retention d = 0.30, transfer d = 0.54, but null in sessions > 35 min (Ginns, Martin & Marsh 2013) [V abs]. Seductive details g ≈ −0.16 (Sundararajan & Adesope 2020) [S]. Social + pitch-entraining robot vs social-only robot, learning p = .6; rapport did not differ and did not correlate with gain, r = −.115 (Lubold et al. 2018, n = 69) [V] | a Taxila MRT shows a per-child style arm moving y_delay |
| RT11 | **Interest contexts are an arm modifier, not an arm.** An interest skin (cricket, kitchen, trains) can wrap any arm. It must be faded to a generic or second context before the transfer probe, and is never used on the first re-teach of a misconception | Personalisation by interest: interest g = 0.55, retention g = 0.48, transfer g = 0.36 (34 publications, 2024 meta) [S]. Concrete context can block transfer (RT5). LLM personalisation fails most on authenticity and realism (PZ11) | RT-M5 |
| RT12 | **Language is a representation for bilingual children only.** For a child whose observed mix includes Hindi, one arm is "same move, fuller Hindi/Hinglish, English key terms kept". For English-only children it is never used. Key curriculum terms stay in English in every arm | Translanguaging evidence is supportive but mostly observational (Indian classroom studies of language mixing in maths) [S]. CBSE English-medium assessment uses English terms [U]. Owner directive `language-core-hinglish-english-hindi` | RT-M4 shows no resolution gain over the English arm for bilingual children |

---

## 1. Why this matters, and what the owner asked for (in testable form)

The owner's ask: when the child has not understood, "teach him again in the way that he might understand, which we
have derived from all the experience we had with the child". It decomposes into four testable claims:

1. **Changing the representation after a failure resolves more often than repeating it.** Strong prior support (RT1,
   RT2). Taxila enforces it as an invariant, not a learned preference.
2. **Some representations work better than others for a given misconception.** Supported at the population level:
   contrast, refutation, erroneous examples and predict-reveal all beat plain re-explanation for *known* bugs. The
   bandit learns which arm is best per (misconception × age band).
3. **The child's history predicts which representation will work for this child.** Partly supported. History predicts
   well through knowledge-like variables: what failed, which representations the child can read, prior-knowledge
   level, relapse-prone bugs. The literature does not support it through *style-like* variables ("he's a visual
   kid"). RT3 makes the split structural.
4. **Adapting the tutor's style to the child's vibe helps learning.** Mostly unsupported as a learning claim; well
   supported as an engagement and comfort claim. Engagement is the binding constraint at scale (products-live §0),
   so style adaptation is worth building, bounded, and never claimed as learning (RT10).

What Taxila can honestly say to a parent, once measured: *"She noticed Aarav finds fractions easier on a number line
than as a pie, so she switched."* That is RT4 (repFluency) plus RT1 (no repeat), and it is defensible. What Taxila
must never say: *"Aarav is a visual learner."* (LS §8.6, PZ7.)

---

## 2. The re-teach arm catalogue (representation classes)

Each class is a **teaching move with its own evidence**. A kit arm is a (class, representation, move shape, engine,
counter-example flag) tuple for one skill or misconception.

| class | what changes | best for | evidence | class tag | notes for Taxila |
|---|---|---|---|---|---|
| `contrast_pair` | two cases side by side, one fits the concept and one does not; the child names the difference; the principle comes *after* | category boundaries, "looks similar" bugs (1/3 vs 1/4, mass vs volume) | d = 0.50 [.44, .56], 57 experiments, moderated by stating the principle and by the test lag (Alfieri et al. 2013) [S] | L | the default first arm for boundary bugs; principle stated after the comparison |
| `predict_reveal` | the child predicts, the engine shows the outcome, the child explains the gap | science misconceptions, "bigger number = bigger" bugs | Mindspark dissonance pattern (products-live M4); POE (LS §1.6) [S] | L | needs an engine or animation that shows the outcome honestly; resolved in the same turn |
| `refutation` | state the wrong belief as a common one, refute it, explain the right one | science conceptual change | g = 0.41 (44 comparisons) [S]; larger pooled conceptual-change g = 1.10 (218 studies, Pacaci 2024), likely inflated [S] | L | voice shape: ⟨common idea⟩ → ⟨why it seems right⟩ → ⟨counter-case⟩ → ⟨right idea⟩. Never attribute the belief to the child |
| `erroneous_example` | the child finds and fixes a worked solution containing the target bug | maths procedural bugs, after basic exposure | delayed d = 0.33, immediate null, n = 390 middle school (McLaren, Adams & Mayer 2015) [V abs] | L | **feel goes down** (satisfaction d = 0.21 lower). Log it in the divergence monitor (PZ13). SR's CATCH-ME stays off; this arm uses a *fictional peer's* work, never the teacher's |
| `worked_example` / `faded_example` | full steps, then steps with blanks | novices, low pL | g = 0.48 maths (LS §3.5); worked examples are a top moderator in the K-12 ITS meta, g = 0.271 overall (18 studies) [V abs] | L | the expertise-reversal gate decides it, not the bandit |
| `concrete_manip` | engine manipulative: place-value blocks, fraction strips, balance | low prior; first re-teach after an abstract failure | concreteness fading (RT5) [S]; manipulatives meta (Carbonneau et al. 2013) [S] | L | T1 engines (CONTENT-ENGINE §2.2) |
| `pictorial` | diagram, number line, bar model | the step between concrete and abstract | Rau 2014 [V abs] | L | only representations with repFluency ≥ τ, or teach the representation first |
| `abstract_symbolic` | the notation itself, re-sequenced or segmented | after a concrete success | Fyfe 2014 [S] | L | the fade-up target |
| `analogy` | a familiar source domain mapped onto the concept | T3 science "why" concepts | analogies work when the source is familiar and the mapping is cued visually or by gesture; US teachers rarely gave such cues (Richland et al. 2007) [S]. LLM analogies helped in biology but not physics, with overconfidence (2025, CHI) [V abs] | L? | **only kit-authored, reviewed analogies** with a stated limit of the mapping; never a live-generated analogy (physics failure; hidden subtle errors the students missed) |
| `story_context` | the concept inside a short scenario | T5 word problems | interest personalisation [S] (RT11) | L (small) / F | a modifier more than a class |
| `game_engine` | a Forge game whose mechanic *is* the concept | practice and misconception exposure | stealth game telemetry (game-stealth.md) [S] | L? | arm reward is still the delayed covert probe, never in-game success |
| `animation` | a short explainer animation | processes (water cycle, digestion) | multimedia principles (LS) [S] | L? | near-line or pre-built only (content-live-tiers) |
| `teach_back_peer` | the child teaches a confused character the idea just re-taught | consolidation after a resolution | protégé effect (LS §1.5) [S] | L | doubles as the resolution probe (P1) |
| `language_switch` | same arm, fuller Hindi/Hinglish, English key terms kept | bilingual children whose mix includes Hindi | [S]/[U] (RT12) | L? | never for English-only children; never the first arm |
| `prereq_descent` | leave the concept; repair the weakest prerequisite | two failed arms, or prerequisite pL < .5 | Mindspark, TaRL, PLACEments [V abs]/[S] | L | a route, not a representation (RT8) |

**Arms with no evidence that ship as defaults:** "explain it again more slowly", "explain it again more simply".
Both are permitted only as the *voice-level* adjustment of a class change (shorter turns, slower pace), never as the
re-teach itself.

---

## 3. How the next arm is chosen (`server/comprehension/reteach.js`, pure)

### 3.1 Triggers (from the comprehension belief, not from a single wrong answer)

| trigger | source | meaning |
|---|---|---|
| `misconception_confirmed` | misconception posterior ≥ 0.7 after a verifying probe (LS §7.2: a detector triggers a probe, never a verdict) | known bug |
| `wheel_spin` | P21: no 3-in-a-row within ~10 opportunities | current approach is not working |
| `two_fails_post_rung3` | two unaided failures after a worked step | the explanation did not land |
| `teachback_gap` | P1/P11 missing a required `expectations[]` component | partial model |
| `transfer_fail` | near-transfer (P3) failed after practice success | instance-bound knowledge (RT5 fade-up case) |
| `delayed_fail` | P10 failed on a concept marked resolved | **forgot**, not never-understood (RT9) |

Voice/vibe features (latency, disfluency, f0) **never trigger** a re-teach on their own. They may only (a) bring a
verifying probe forward, or (b) break a tie between two eligible arms toward the lower-load one
(`voice-features-longitudinal`; LS rule 7).

### 3.2 Types

```ts
// shared/contracts.ts additions (sketch)
export type RepClass = 'contrast_pair'|'predict_reveal'|'refutation'|'erroneous_example'|'worked_example'
  |'faded_example'|'concrete_manip'|'pictorial'|'abstract_symbolic'|'analogy'|'story_context'|'game_engine'
  |'animation'|'teach_back_peer'|'language_switch';
export type Cpa = 'C'|'P'|'A';
export interface ReteachArm {
  armId: string;                 // stable: `${kitTopicId}:${misconceptionId ?? 'gen'}:${n}`
  skillId: SkillId; misconceptionId?: MisconceptionId;
  repClass: RepClass; cpa: Cpa;
  representationId?: string;     // 'number_line' | 'area_model' | 'bar_model' | 'fraction_strip' | ...
  engine?: string; tier: 'T1'|'T2a'|'diagram'|'animation'|'voice';   // never T2b/T3 live
  moveShape: string;             // shape, never a script
  counterExample: boolean;       // required where the misconception has induced-bug risk (STUDENT-SIM D2)
  bands: Band3[];                // A/B/C eligibility
  minPrior?: 'low'|'mid'|'high'; maxPrior?: 'low'|'mid'|'high';   // expertise-reversal gate
  langs: string[];               // language parameter, never a hard en/hi pair
  costSec: number; evidence: 'L'|'L?'|'F';
  primary?: true;                // the kit's first arm for this misconception (PZ review A4)
}
export interface ReteachAttempt {
  childId: ChildId; skillId: SkillId; armId: string; repClass: RepClass; representationId?: string;
  surfaceId: string;             // the context/numbers used, for cross-session no-repeat
  at: string; trigger: string;
  outcome: 'pending'|'repaired_now'|'resolved_next'|'resolved_delayed'|'not_resolved'|'abandoned'|'contaminated'|'induced_bug';
}
export interface RepFluency { childId: ChildId; representationId: string; pRead: number; n: number; updatedAt: string }
```

### 3.3 Selection policy (order matters; code, not LLM)

```
selectReteach(trigger, skill, misconception?, child):
 0. safetyFired → no re-teach (safeguard path).
 1. trigger = delayed_fail AND an arm resolved this skill for this child before
      → RETRIEVE: brief recap through that arm's representation + one retrieval item. Not a re-teach. (RT9)
 2. E ← kit arms for (skill, misconception) ∪ generic arms for skill.
    Filter: band; expertise-reversal gate (low prior → worked/faded/concrete only; no attempt-first);
            language (language_switch only if the child's observed mix includes Hindi, and never first);
            tier available on this device now (low-end cascade); time budget; counterExample required when flagged.
 3. Hard exclusions (RT1):
      - any arm already used this lesson for this skill;
      - any repClass that failed for this child on this skill in the last 2 attempts;
      - any repClass that failed twice on this concept family in 30 days (unless E would be empty);
      - pictorial/analogy arms whose representation has repFluency.pRead < 0.5, unless the arm first
        teaches the representation (RT4).
 4. Count distinct failed arms this session for this concept:
      ≥ 2 → PREREQ_DESCENT to the weakest prerequisite with pL < 0.5 (RT8); if none, park + schedule.
      ≥ 3 → park: stop this concept today, schedule a spaced re-teach with a new arm, notify Conductor.
 5. CPA positioning (RT5): last failure at A → prefer P or C; trigger = transfer_fail after a C success → prefer
    the fade-up arm (P→A) and a second-context transfer probe.
 6. First re-teach of a confirmed misconception → the kit primary arm, if not excluded (PZ review A4: deterministic).
 7. Otherwise choose among eligible arms with a population bandit (§3.4).
 8. If the top two have expected reward within 0.05, offer the child a two-way choice framed as a game-like
    pick (autonomy at no learning cost; ZPDES + choice, §5).
 9. Emit a PedagogyDecision with move = 'reteach', the arm's moveShape, the representation and engine to mount,
    and the voice directive (§6.4 re-teach style suppression).
```

### 3.4 The bandit (population first, per PZ9)

Per arm *a* and context *k* = (misconception or skill × age band × prior band):

```
reward r ∈ [0,1]:  r = 0.3·repaired_now + 0.3·resolved_next + 0.4·resolved_delayed      (RT7)
                   r = 0 on induced_bug; contaminated attempts are dropped, not scored
posterior: θ_{a,k} ~ Beta(α0 + Σ r, β0 + Σ (1 − r)),   α0, β0 from the class prior in §2 (strength 4)
hierarchical pooling: when n_{a,k} < 8, borrow from the misconception-family level and then the class level
                   (partial pooling; the family is the kit's concept family tag)
choice (TS-PostDiff):  φ = max(0.2, P(|θ_best − θ_second| < c)),  c = 0.05
                   with prob. φ: uniform over the top-3 eligible arms; else Thompson sample
```

- **Why the 0.2 floor.** Thompson sampling alone starves weaker-looking arms, so their effects stay unestimable and
  later analyses are biased (Rafferty et al. 2019; LS §8.4) [S]. A stochastic router beat a greedy one in the field
  (RT6) [V abs].
- **Why delayed reward.** It arrives days later. The bandit therefore updates asynchronously from the outcome ledger
  (PZ §3.7); immediate parts update at once and the delayed part when its probe resolves. An arm with only
  immediate data is capped at 0.6 expected reward [U].
- **Per-child arm affinity** `u[child, repClass]` exists **only in M3, after the HTE gate** (PZ §3.9), with
  shrinkage toward 0 and a 90-day half-life (LEARNER-MODEL §6.5b). Until then, the child's history enters only
  through steps 1, 3, 4 and 5, which are knowledge, not preference.

### 3.5 Representational fluency (RT4)

`pRead` is a small BKT-style estimate per (child, representation), updated from:
- `translate_rep` kit items (P14) on any skill using that representation;
- engine telemetry: correct placement on a number line, reading a bar model, setting a fraction strip
  (game-stealth §6 indicators), weighted by the bridge's host-graded facts only;
- **not** from preference, talk volume or vibe (LEARNER-MODEL floor 8 isolation applies).

It carries across concepts, because a child fluent with the number line in whole numbers is fluent with it for
fractions. This is the honest version of "what worked for similar concepts". Rau's result that each
representation is its own competency [V abs] is the reason it is a separate row and not part of pL.

### 3.6 No-repeat at the word and surface level

- Lexical: STUDENT-SIM R3b (word 3-gram Jaccard ≤ 0.5 between consecutive re-teach turns) stays the gate.
- Surface: `surfaceId` (numbers, story, objects) is never reused for the same child and skill within 30 days.
- The realtime model receives the **arm shape and the previous arm's class**, never the previous re-teach's text,
  so it has nothing to paraphrase. A sentence-shaped prompt gets recited (inherited law).

---

## 4. Kit schema change (blocking for RT1-RT8)

Today `misconceptions[].remediation` is a single `{representation, moveShape}`. One arm cannot satisfy RT1 (no
repeat) or RT6 (choice). Proposed change:

```ts
remediation: ReteachArmSpec[]      // 3-5 arms per misconception, ≥ 3 distinct repClass, ≥ 1 at C or P level
// ReteachArmSpec = Omit<ReteachArm, 'armId'|'skillId'|'misconceptionId'> plus
//   counterCase?: { prompt_en: string; prompt_hi: string; answer: string }   // verified by the blind solver
//   limit?: string        // for analogies: where the mapping breaks (shape)
genericReteach: ReteachArmSpec[]   // per skill, for triggers with no specific misconception
```

Backward compatibility: a single-object `remediation` is read as `[{...remediation, primary: true}]`. The kit
workflow lints: at least 3 classes, a primary flag, counter-cases on every arm of a misconception that lists an
`induced` bug, and blind-solver agreement on every `counterCase.answer`. Forge's nightly H1 queue (FACTORY §H1)
already pre-builds remediation media per listed misconception; it should key on `armId`.

---

## 5. Evidence on choosing remediation (what the 2010-2026 ITS literature says)

1. **Specific beats generic.** Hint-error-location-specific had the best outcome score among 9 remediation strategies
   in human-human tutoring, R = 0.23 with success; reject-only had the worst score (−21 single) (Callaway & Moore
   2007, 33 dialogues, 198 remediations) [V]. Small corpus, outcome = repair, not learning. Direction agrees with
   Eedi [S via PZ].
2. **Heterogeneity is small; population policies capture most of the value.** 1M-student CK-12 bandits [S via PZ].
   Clinton-Lisell 2024 [V abs]. Hence RT3 and PZ9.
3. **Adaptive policies help weaker students most.** Mindspark relative gains [V abs]. An RL narrative tutor gave the
   largest benefit to the lowest-pretest students, in two populations (2023) [V abs]. Proactive initiative helped
   below-median students (PZ10) [S].
4. **Adaptivity plus choice beats either alone.** ZPDES (a learning-progress bandit) improved learning and experience
   for 265 children aged 7-8. Adding choice to ZPDES raised intrinsic motivation and learning, and adding the same
   choice to a fixed linear curriculum *hurt* learning (Clément et al. 2024) [V abs]. Step 8 of §3.3 follows this.
5. **Adaptive sequencing pays off on unassisted tests through engagement.** +0.15 SD on the unassisted final exam
   over 5 months, 10 Taipei high schools, mediated by engagement (2026) [V abs]. This is the closest LLM-era analogue
   of an arm-selection policy with a hard outcome.
6. **Exploration has a statistical price and a learning price; adapt the floor.** TS-PostDiff [V abs]. 2606.20138
   stochastic router [V abs].
7. **LLM-generated remediation needs a verified key.** Mistake-remediation alignment (SFT + DPO) improves pedagogy
   metrics, but the authors report that "reliably evaluating tutoring quality" is itself unsolved (2026) [V abs].
   LLM analogies carried subtle errors students did not notice [S]. Hence kit-authored arms, live voicing only.
8. **Repetition of failed help is the common failure of shipped tutors.** Khanmigo's low uptake after mistakes
   (products-live §0) and Eedi's 44.3% pacing edits (PZ4) are both cases of the tutor persisting with an approach
   that was not working [S via siblings].

---

## 6. Adapting the tutor to the child's vibe: what the evidence supports

### 6.1 Verdict per style axis

| axis | best evidence found | learning | feel | class | Taxila rule |
|---|---|---|---|---|---|
| Conversational register (2nd person, direct address, polite, personality shows) | Ginns 2013 meta: retention d = 0.30, transfer d = 0.54; **null beyond 35 min** [V abs] | yes, short sessions | + | **L, universal** | default for everyone; not a per-child knob. Lessons are segmented below 35 min anyway |
| Politeness / indirect face-saving feedback | lab: helped low-prior learners; classroom replication: no benefit (McLaren et al. 2011) [S]. Wang et al. 2008 politeness effect [S] | mixed | + | F | VT `errorFrame` stays question-first for bands A/B; never at the cost of naming the step |
| Prosodic entrainment (matching pitch/loudness) | social + entraining robot beat a non-social robot (p = .005) but **not** a social-only robot (p = .6); rapport unchanged (Lubold 2018, n = 69) [V] | not isolated | ± | F | **do not build** pitch entrainment; TTS control is coarse and the effect is not separable from social dialogue |
| Affective policy learned per child (RL on detected affect) | preschool, 2 months: personalised policy kept positive valence up while the non-personalised one declined; no learning difference reported (Gordon et al. 2016, AAAI) [V] | none shown | + | F (and **X as built**: camera affect sensing) | the idea survives only as F-class knobs on dialogue-observable engagement, never on detected emotion (VT §4.9; Azure Code of Conduct) |
| Bundled robot personalisation (name, friendly wording, gaze, mastery-based repeat) | 59 children aged 7-8: gain on a novel task .253 vs −.376; null on a familiar task (Baxter et al. 2017, PLOS One) [V] | yes, but a bundle that includes mastery repetition | + | L? (unattributable) | cannot be credited to style; the mastery part is already in KT |
| Personality matching (similar vs complementary persona) | mixed: complementary sometimes wins; conscientious/neutral personas best for cognitive engagement in LLM maths (LAK 2025) [S] | unclear | ± | F | no personality inference about the child (VT §4.9); one stable teacher persona per character |
| Humour | instructor humour meta: heterogeneous; relevant humour relates to *perceived* learning; one study found humour −13.5% exam [S] | unclear, can hurt | + | F | VT `humourDose` caps; **off during re-teach** (RT10) |
| Interest examples | 2024 meta g = 0.36-0.55 [S] (RT11); LLM personalisation +learning in a semester deployment (PAGE, 2025) [V abs, no numbers in abstract] | small-moderate | ++ | L (small) / F | modifier with fading; never seductive detail during a re-teach |
| Decorative detail | seductive details g ≈ −0.16 [S] | negative | + | X during re-teach | suppressed in re-teach turns |
| Verbosity | longer replies went with *lower* next-turn understanding (Sharmin 2026, observational) [S via PZ12] | − when long | ± | L-safe bound | `teacherTurnWords` lower third during re-teach |
| Speech rate | slowed speech helped children's offline comprehension of *complex* sentences, hurt online processing (Dutch study) [S] | conditional | ± | L? | no global slowing; a pause after the key term and segmenting instead (VT `speechRate` deferred) |
| Voice vs text modality | within-student weekly alternation, 86 MBA students: voice doubled interaction, cost 2.8×, mastery equivalent, students preferred voice (2026) [V abs] | none | + | F | voice is Taxila's product choice for reach and engagement; not a learning claim |
| Learning-style matching | g = 0.31, crossover in 26% of measures (2024) [V abs] | no | + | X if labelled | never |

**Net.** Style adaptation that moves learning is either universal (conversational register, brevity, concrete
elaboration) or is really knowledge adaptation in disguise (mastery repetition, prior-knowledge-gated guidance).
Per-child style adaptation is for comfort, trust and staying in the session. That is valuable, because children
who leave learn nothing, but its reward is engagement, bounded so it can never cost L (PZ2).

### 6.2 Which signals drive which knobs (dialogue- and voice-observable only)

This adds evidence to VT §4.2/§4.3 and does not add new knobs, except one modifier (`exampleDomain`).

| knob (VT) | signals (all per-child z-scored against own baseline) | direction | reward | notes |
|---|---|---|---|---|
| `teacherTurnWords` | barge-ins per 10 turns; "aur batao"/"tell more" requests; ASR-confident onset latency after long turns | barge-ins → shorter; explicit "more" → upper third | engagement (voluntary continuation, return next day) | re-teach turns forced to lower third |
| `waitNudgeSec` / `endpointSilenceMs` | median onset latency on think-questions; continuation-after-cutoff events | slower child → longer wait | fewer cut-offs; no change in correctness | Rowe wait time (VT) [S] |
| `humourDose` / `humourKinds` | child builds on or initiates humour; laughter tokens in transcript; explicit "no jokes" | as VT | engagement | off in re-teach and within 2 turns of an error |
| `energy` | session `strained` state (P20 loops, pata-nahi runs, rising latency z) | strained → calm | strain resolution | never matches distress upward |
| `challengeFrame` | accepts harder options ≥ 3/5; retry-after-error ≥ .7 | → dare allowed | engagement + y_next unchanged | never on a re-teach's first item |
| `address` / register | child's own usage; explicit preference | follow the child within the band | none (explicit) | tum never tu; closed vocabulary |
| `exampleDomain` (**new modifier**) | interest tags learned in conversation (MI), parent-editable | picks the skin for story_context and interest-wrapped arms | engagement; y_delay checked by RT-M5 | faded before transfer; banned categories never inferred (LS §8.5) |
| language mix | observed code-mix ratio per turn | mirror the child (decision) | none | also gates `language_switch` (RT12) |

**Voice features stay tie-breakers.** Pitch, energy, rate, pauses and latency feed the session `strained` state and the
wait knobs. They never change KT, never choose a re-teach arm, and never become emotion labels
(`voice-features-longitudinal`; LEARNER-MODEL floor 8). The Lubold and Gordon results show why this is not a loss:
neither prosodic adaptation nor detected-affect personalisation produced an attributable learning gain [V].

### 6.3 English-first, Hindi and Hinglish equal

- Every arm carries `langs`, and its move shape must be voiceable in English, Hindi and Hinglish. The kit lint fails
  an arm whose counter-case exists in one language only.
- The style knobs' defaults were set for Hinglish register (VT §5). English-medium children need their own measured
  defaults for `address` and humour (VT §6 M4). Until then, English defaults use the same caps with `address = name`.
- Re-teach quality is measured per language in RT-M2 (the arm × language interaction). LLM tutoring quality drops
  9-10 pp in Hindi (Gupta 2025, via PZ) [S], so a language-specific arm effect is expected and must not be pooled away.

### 6.4 Re-teach style suppression (compiled into the directive, appended last)

During a `reteach` move the compiled voice directive overrides vibe knobs as follows: humour off; turn words at the
lower third of the band; energy calm-warm (never bright); one concrete elaboration per turn (PZ12); an interest
skin only if the arm allows it; the representation mounted on screen before the first spoken sentence about it
(teacher-visual sync). The ordering follows the inherited law (position is mechanism): these lines go after the
persona and before the safety tail.

---

## 7. Invariants (eval predicates; if a change trips them, the change is wrong)

| id | predicate |
|---|---|
| RTI1 | No re-teach uses a repClass that failed for this child on this skill in its last 2 attempts (unless E would otherwise be empty, which is logged) |
| RTI2 | The first re-teach of a confirmed misconception is the kit primary arm when eligible (no randomisation; PZ review A4) |
| RTI3 | Exploration share among second-or-later re-teaches is ≥ 0.2 over any 500-decision window (population) |
| RTI4 | No arm is rewarded on immediate repair alone (r ≤ 0.6 without the delayed component) |
| RTI5 | ≥ 2 distinct failed arms → the next decision is prerequisite descent or park, never a third same-concept arm in the session |
| RTI6 | Voice/vibe inputs permuted → arm choice identical, except the tie-break in step 8 (extends LEARNER-MODEL §13.1) |
| RTI7 | No `analogy` arm is voiced that is not kit-authored with a `limit` field |
| RTI8 | `language_switch` never selected for a child whose observed mix has no Hindi tokens; never the first arm |
| RTI9 | During `reteach`, humour items = 0 and turn words ≤ band lower third + 2 |
| RTI10 | No child-facing or parent-facing string contains a learning-style or trait label |

---

## 8. Measurements to run (none run yet)

| id | question | method | unblocks |
|---|---|---|---|
| RT-M1 | Does the selector comply under both truth families? | STUDENT-SIM battery R3 plus new **R3e** (repeat-failed-class rate = 0), **R3f** (exploration share ≥ 0.2), **R3g** (prerequisite descent latency ≤ 1 decision after the 2nd failed arm), **R3h** (resolution under `cfrag`, labelled upper bound). Add an `oracle-arm` control that knows the true best arm, and a `repeat-tutor` control that must fail R3b/R3e | build gate for `reteach.js` |
| RT-M2 | Which arm resolves which misconception, by band and language? | population MRT on second-or-later re-teaches only, TS-PostDiff with c = 0.05; outcome y_delay; pre-registered per misconception family | bandit priors; reversal of RT6 |
| RT-M3 | Does repFluency predict re-teach success beyond pL? | logistic model on real ledgers: resolved_delayed ~ pL + pRead(representation) + arm class + band | RT4 |
| RT-M4 | Does the language_switch arm help bilingual children? | within-child randomisation at the third arm, bilingual children only; y_delay and English-term retention | RT12 |
| RT-M5 | Do interest skins need fading before transfer? | 2-arm MRT: faded vs non-faded interest context; outcome far-transfer item in a new context | RT11 |
| RT-M6 | Does per-child arm affinity beat population best? | E-PROFILE (LS §8.7) extended with repClass; HTE gate | RT3 (e) |
| RT-M7 | Is re-teach style suppression neutral on engagement? | MRT factor: suppression on/off during re-teach; outcomes y_next, session continuation | RT10 |

The simulator measures whether Taxila follows its own policy, not whether the arms work on children (STUDENT-SIM
circularity note). No simulator number may be quoted as an efficacy claim.

---

## 9. Proposed `context/` entries (for `context/inbox/reteach-personalisation.json`)

- **decision `reteach-class-change`**: RT1 + RT2 + RT8; reverse per RT1/RT8 columns.
- **decision `reteach-history-knowledge-not-style`**: RT3 + RT4 (history enters as exclusions, repFluency, CPA
  position, prior level; per-child preference only after the HTE gate); reverse if RT-M3 is null or the HTE gate passes.
- **decision `reteach-bandit-postdiff`**: RT6 + RT7; reverse per RT6.
- **decision `style-is-F-suppressed-in-reteach`**: RT10 + §6.4; reverse if RT-M7 shows engagement loss with no y_delay gain.
- **rejected `prosodic-entrainment`**: tried in the literature (Lubold 2018), effect not separable from social dialogue; not built.
- **rejected `detected-affect-personalisation`**: Gordon 2016 moved valence only, and needs camera emotion sensing (banned).
- **kit schema change**: `remediation` becomes `ReteachArmSpec[]` (≥ 3 classes), plus `genericReteach`.

---

## 10. Implementable mechanisms (build list)

1. `shared/contracts.ts`: `RepClass`, `ReteachArm`, `ReteachAttempt`, `RepFluency` (§3.2).
2. `data/kits/SCHEMA.md` + kit lint: `remediation[]` arms, counter-cases verified by the blind solver (§4).
3. `server/comprehension/reteach.js` (pure): `selectReteach()` per §3.3, deterministic given (state, seed); counter-based draws, as in LEARNER-MODEL §6.5a.
4. `server/comprehension/bandit.js`: Beta posteriors per (arm, context), partial pooling, TS-PostDiff with a 0.2 floor, async delayed rewards from the outcome ledger.
5. `server/learner/repfluency.js`: pRead updates from `translate_rep` items and host-graded engine facts.
6. Director: `reteach` move compiles the arm shape + representation mount + style suppression (§6.4), appended last.
7. Conductor hook: `park` → spaced re-teach job with an excluded-class list; parent report line "still working on ⟨concept⟩, trying a different way".
8. Forge H1: pre-build media keyed by `armId` for predicted topics.
9. Evals: RTI1-RTI10 in `evals/`; STUDENT-SIM R3e-R3h + `oracle-arm` / `repeat-tutor` controls.
10. Migration sketch: `reteach_attempts(child_id, skill_id, arm_id, rep_class, representation_id, surface_id, trigger, outcome, at)`, `rep_fluency(child_id, representation_id, p_read, n, updated_at)`, `arm_posteriors(arm_id, context_key, alpha, beta, n, updated_at)`. Population tables hold no child id.

---

## Sources

Read this session:
- Callaway, C. & Moore, J. (2007). Determining tutorial remediation strategies from a corpus of human-human tutoring dialogues. ENLG. https://aclanthology.org/W07-2319.pdf [V full]
- Lubold, N., Walker, E., Pon-Barry, H. & Ogan, A. (2018). Automated pitch convergence improves learning in a social, teachable robot for middle school mathematics. AIED. https://par.nsf.gov/servlets/purl/10075841 [V full]
- Gordon, G. et al. (2016). Affective personalization of a social robot tutor for children's second language skills. AAAI. https://cdn.aaai.org/ojs/9914/9914-13-13442-1-2-20201228.pdf [V full]
- Baxter, P. et al. (2017). Robot education peers in a situated primary school study: personalisation promotes child learning. PLOS One. https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0178126 [V]
- McLaren, B. M., Adams, D. M. & Mayer, R. E. (2015). Delayed learning effects with erroneous examples: a study of learning decimals with a web-based tutor. IJAIED. https://eric.ed.gov/?id=EJ1078813 [V abs]
- Rau, M., Aleven, V. & Rummel, N. (2014). How should intelligent tutoring systems sequence multiple graphical representations of fractions? IJAIED. https://eric.ed.gov/?id=EJ1036905 [V abs]
- Ginns, P., Martin, A. & Marsh, H. (2013). Designing instructional text in a conversational style: a meta-analysis. Ed Psych Review. https://researchers.westernsydney.edu.au/en/publications/designing-instructional-text-in-a-conversational-style-a-meta-ana/ [V abs]
- Clinton-Lisell, V. & Litzinger, C. (2024). Is it really a neuromyth? A meta-analysis of the learning styles matching hypothesis. https://pmc.ncbi.nlm.nih.gov/articles/PMC11270031/ [V abs]
- Muralidharan, K., Singh, A. & Ganimian, A. (2019). Disrupting education? AER 109(4). https://www.aeaweb.org/articles?id=10.1257%2Faer.20171112 [V abs]
- Li, T., Nogas, J., ..., Rafferty, A., ..., Williams, J. J. TS-PostDiff: algorithms for adaptive experiments that trade off statistical analysis with reward. https://arxiv.org/abs/2112.08507 [V abs]
- Clément, B. et al. (2024). Improved performances and motivation in ITS: combining machine learning and learner choice. https://arxiv.org/abs/2402.01669 [V abs]
- Learning to Prompt: improving student engagement with adaptive LLM-based high-school tutoring (2026). https://arxiv.org/abs/2606.20138 [V abs]
- Effective personalized AI tutors via LLM-guided reinforcement learning (2026). https://arxiv.org/abs/2608.16907 [V abs]
- When AI tutors speak: evidence from a randomized field experiment (2026). https://arxiv.org/abs/2609.23958 [V abs]
- Reinforcement learning tutor better supported lower performers in a math task (2023). https://arxiv.org/abs/2304.04933 [V abs]
- Do intelligent tutoring systems benefit K-12 students? Meta-analysis and HTE (2025). https://arxiv.org/abs/2511.04997 [V abs]
- Towards pedagogically aligned LLM tutors for math mistake remediation (2026). https://arxiv.org/abs/2606.21502 [V abs]
- Unlocking scientific concepts: how effective are LLM-generated analogies? (CHI 2025). https://arxiv.org/abs/2502.16895 [V abs]
- Examining student and AI generated personalized analogies in introductory physics (2025). https://arxiv.org/abs/2511.04290 [V abs]
- Learning in context: personalizing educational content with LLMs (PAGE, 2025). https://arxiv.org/abs/2509.15068 [V abs]
- Investigating learner-aware design of LLM-generated educational feedback (2026, n = 321). https://arxiv.org/abs/2602.11650 [V abs]
- TASA: teaching according to students' aptitude (2025, workshop). https://arxiv.org/abs/2511.15163 [V abs; no evaluation details]

Search summaries or secondary only:
- Alfieri, L., Nokes-Malach, T. & Schunn, C. (2013). Learning through case comparisons: a meta-analytic review. Ed Psychologist 48(2). https://www.tandfonline.com/doi/full/10.1080/00461520.2013.775712 [S]
- Fyfe, E., McNeil, N., Son, J. & Goldstone, R. (2014). Concreteness fading in mathematics and science instruction: a systematic review. https://link.springer.com/article/10.1007/s10648-014-9249-3 [S]; Fyfe, McNeil & Borjas (2015) https://www.sciencedirect.com/science/article/abs/pii/S0959475214000942 [S]
- Kaminski, J., Sloutsky, V. & Heckler, A. (2008). The advantage of abstract examples in learning math. Science 320. https://www.science.org/doi/10.1126/science.1154659 [S]; Trninic et al. (2020) The disappearing advantage. https://onlinelibrary.wiley.com/doi/10.1111/cogs.12851 [S]
- Richland, L., Zur, O. & Holyoak, K. (2007). Cognitive supports for analogies in the mathematics classroom. Science. http://learninglab.uchicago.edu/Publications_files/6%20Richland%20(2007)%20Cog%20supports%20for%20Analogies.pdf [S]
- Refutation text meta-analyses: https://link.springer.com/article/10.1007/s10648-021-09656-z ; https://eric.ed.gov/?id=EJ1456277 ; Pacaci et al. (2024) JRST https://onlinelibrary.wiley.com/doi/full/10.1002/tea.21887 [S]
- Sundararajan, N. & Adesope, O. (2020). Keep it coherent: a meta-analysis of the seductive details effect. https://www.researchgate.net/publication/339511797 [S]
- Personalized learning by interest meta-analysis (2024). https://link.springer.com/article/10.1007/s10648-024-09933-7 [S]
- McLaren, B. et al. (2011). Polite web-based intelligent tutors: can they improve learning in classrooms? https://www.sciencedirect.com/science/article/abs/pii/S0360131510002824 [S]; Wang, N. et al. (2008) The politeness effect. https://www.sciencedirect.com/science/article/abs/pii/S1071581907001267 [S]
- Schmucker, R. et al. (2025). Learning to optimize feedback for one million students. https://arxiv.org/abs/2508.00270 [S here; V in personalisation-2026]
- Chi, M., VanLehn, K., Litman, D. & Jordan, P. (2011). Empirically evaluating the application of RL to the induction of effective and adaptive pedagogical strategies. IJAIED. [S]
- Rafferty, A., Ying, H. & Williams, J. (2019). Statistical consequences of using multi-armed bandits to conduct adaptive educational experiments. JEDM. [S via LS]
- PLACEments (ASSISTments prerequisite remediation). https://www.neilheffernan.net/projects/pilot-projects/placements [S]
- Teachable AI agents' personality traits in mathematics (LAK 2025). https://dl.acm.org/doi/10.1145/3706468.3706532 [S]
- Instructional humour (Martin et al. 2006 meta; Segrist & Hupp 2015). https://www.teachpsych.org/Resources/Documents/otrp/resources/segrist15.pdf [S]
- Speech rate and children's comprehension. https://www.researchgate.net/publication/258100949 [S]
- Translanguaging in Indian science/maths classrooms. https://journals.indexcopernicus.com/api/file/viewByFileId/2418520 [S]
