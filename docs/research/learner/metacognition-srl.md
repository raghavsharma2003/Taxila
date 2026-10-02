# Teaching self-regulation and fading the tutor: teacher moves, fading controllers, and a crutch-risk metric (ages 6-15)

**Date:** 2026-10-02 · **Scope:** Taxila, classes 1-9, voice-first Hindi/English/Hinglish teacher run by the server-side Director.
**Question:** What metacognition and self-regulated learning (SRL) can an AI tutor *teach* children aged 6-15 (planning, monitoring, help-seeking, calibration)? How does Taxila fade itself so the child becomes independent? How does it avoid the over-reliance harm Bastani et al. measured? This file specifies the teacher moves, the fading controllers and a dependency-risk metric, as code-level designs.

**Builds on, does not repeat** (read these first):
- `psychology/metacognition-srl.md` (**MS**) covers how to *measure* SRL: calibration offset κ and resolution ψ (MS-D1..D3), help-need coupling λ (MS-D4), "try first" and "help never costs" (MS-D5..D7), the age-gated training table (§5.3), and the parent statement shapes (§7). This file adds what MS leaves open: what the teacher *does*, how support *fades*, and how *dependency* is detected and prevented.
- `learning-science.md` (**LS**): rules 8 (wait time), 10 (confusion on a timer), 14-16 (lesson state machine, answer withheld until the ladder is exhausted, expertise reversal), P6 and P12-P16.
- `learner/kt-algorithms.md` (**KT**): outcome classes C0-C4 and wheel-spinning. `learner/dialogue-affect.md` (**DA**): the GAME and IMPASSE detectors and teacher responses. `voice/relational-os-teacher.md` (**RO**): the inverted arc, gradual release at S3, and the *emotional*-dependency overlay RO-9. `voice/indian-teacher-discourse.md` (**ID**): CUED-SLOT and DL12. `conductor/observability-evals.md` (**OE**): the DRS-7 north star. `conductor/day-cycle.md` (**DC**): DC5 homework flow.

**Evidence tags.**
- **[V]**: checked this session against the primary abstract (ERIC, Europe PMC or arXiv API).
- **[V-full]**: the full text was read this session. That covers Bastani 2025, Darvishi 2024, Stadler 2024, Lehmann 2025, MathDial and MetaCLASS.
- **[V, sib]**: verified by a sibling file on the same date, not re-fetched.
- **[S]**: secondary source (a title record, a citation inside a [V] source, or a preprint under critique).
- **[U]**: unverified, or a Taxila design default that must be measured.
- *computed*: from `metacognition-srl-depsim.py` in this folder (numpy, seed 7, ~15 s). Its generative assumptions are [U]; its arithmetic is reproducible.

**Method.** The session's WebSearch budget was already exhausted (200/200). Discovery used the ERIC, Europe PMC, arXiv, Crossref, Unpaywall and Semantic Scholar APIs, and six full-text PDFs. No study found here tests fading, SRL teaching or dependency prevention **with an LLM voice tutor for Indian children aged 6-15**. Direct evidence on minors and generative AI is scarce: of 46 primary studies in a 2026 review, 8 included under-18s (Fan, Li & Zhang 2026) [V]. Everything below about Taxila's population is extrapolation plus the measurement plan in §8.

---

## 0. Decisions on one screen

| # | decision | why | what would reverse it |
|---|---|---|---|
| SR-D1 | **Dependency is defined as success that does not survive the tutor's absence.** Its instrument is the **solo round**: an isomorphic twin of an item just practised with help, with the tutor silent until the child commits. A session has ≥ 3 solo rounds (B1: 2) | Bastani's harm was invisible in practice (+48%) and visible only on unassisted, matched exam items (−17%). Every exam problem matched a practice problem (Bastani 2025) [V-full]. Practice performance alone would have reported a win | Solo rounds raise MH §7 avoidance or anxiety markers beyond threshold (SR-M2). Then drop to 2 per session and lean on DRS-7 |
| SR-D2 | **Silence is decided in code, not by the LLM.** WAIT (no content utterance) is the default on every help-eligible window until the wait timer expires or the child asks. The LLM is called to *render* a move only once code has selected one | LLM coaches chose "no intervention" in 4.2% of turns where it was correct in 41.7%, and produced "8-10 times more interventions than appropriate" (MetaCLASS 2026) [V-full]. LLMs reveal solutions too early (MathDial 2023) [V-full]. Even human tutors default to "preemptive prompts" (Hedin & Gaffney 2013) [V] | An LLM move-selector matches expert "stay silent" labels on Taxila transcripts at ≥ .80 agreement per band (SR-M1) |
| SR-D3 | **Two fading ladders per child.** *Domain support* F5→F0 per skill (§3.1); *SRL prompting* P3→P0 per move (§3.3). Steps change one level at a time by the **contingent-shift rule**: failure → one level more support, independent success → one level less | Contingency, fading and transfer of responsibility are scaffolding's three defining features (van de Pol et al. 2010) [V]. Adaptive fading beat fixed fading, which beat problem solving (Salden et al. 2010, two experiments) [V]. Wood's graded intervention levels (Hedin & Gaffney 2013) [V] | A micro-randomised trial (SR-M4) finds fixed fading non-inferior on DRS-7 and solo success |
| SR-D4 | **Frequent help is general; specific help is rare.** At support levels ≥ F3 (help on most steps), hints are capped at Wood level W2 until the child fails the step twice | With frequent help, *low*-contingency support beat high-contingency support on achievement and effort. With long independent working time, high-contingency support won (van de Pol, Volman & Oort 2015, ages 12-15, N = 768) [V]. The transfer to an AI tutor is [U] | SR-M4 arm comparison |
| SR-D5 | **Fade on evidence of self-initiation, never on time.** A prompt level drops only when the child performs the move *unprompted* (posterior ≥ .6 over ≥ 8 opportunities), measured by periodic probe-down trials | Faded self-question prompts beat fixed prompts at a 3-month follow-up in grade 4 (Gidalevich & Kramarski 2019, n = 134) [V]. Long-term prompting added nothing over short-term prompting (Gentner et al. 2024) [V]. Students relied on AI prompts and did not learn from them; behaviour fell when the prompts were removed (Darvishi et al. 2024, N = 1,625) [V-full] | SR-M4 |
| SR-D6 | **Wait time grows with independent starts** (a progressive delay) and resets on failure | Teachers who extended wait time from 1.9 to 4.4 s changed discourse and achievement (Tobin 1984; Tobin & Capie 1980) [V]. In special education, prompt-delay procedures fade prompts without "prompt dependence" (Walker 2008; Brown & Cariveau 2024) [V]: an analogue population | SR-M5 shows no gain in child-initiated starts, or a loss on DRS-7 |
| SR-D7 | **The crutch-risk index (CRI) is need-adjusted. Raw help counts are never a dependency feature** | *Computed:* raw help rate correlates r = −.45 to −.47 with ability, even when dependency is generated independent of ability. 58% of raw-count flags land in the lowest-ability quartile (chance .25). The need-adjusted composite: r(·, θ) = −.06, 35% (§5.4) | A fleet analysis shows that raw counts predict next-month solo transfer better than CRI does, net of θ |
| SR-D8 | **Outcome-level dependency is a fleet guard, not a per-child statement.** The per-child solo-transfer residual is used only after ≥ 200 solo rounds (≈ 16 weeks), and only as confirmation | *Computed:* the ability-conditioned transfer residual has test-retest .14 at 48 solo rounds and .38 at 192. At fleet level, a policy that halves episode gain is detected with ~316 children per arm in 2 weeks (§5.4) | SR-M3 measures per-child reliability ≥ .6 at ≤ 100 solo rounds |
| SR-D9 | **Tutor Over-Help (TOH) is a release gate.** A release fails if it raises tutor step share, Telling@k or help-before-wait, or lowers solo-round success, beyond the thresholds in §5.6 | Bastani's harm came from the *tool's* design. Tutor CoPilot's +4 pp mastery came with fewer answer give-aways (Wang et al. 2024, 900 tutors, 1,800 K-12 students) [V]. MathDial defines Telling@k [V-full] | Never for the gate. Thresholds are re-fitted on SR-M9 |
| SR-D10 | **A high CRI changes the move schedule, never the words.** First check TOH: if the tutor over-helped, fix the policy for that child. Otherwise the overlay applies (§5.5). No label ever enters the prompt (= RO-9) | Dependency is a child × policy property (Bastani: same students, two tools, two outcomes) [V-full]. A label in the brief changes tone in unmeasured ways (RO §7.4) [I] | Never |
| SR-D11 | **Calibration training is process-oriented:** checking methods, the confidence → action contract (§2.6), and standards to compare against. It is not bet-scoring practice | In grade 5, comprehension-monitoring training improved calibration. Adding response-oriented accuracy training *raised overconfidence* (Huff & Nietfeld 2009) [V]. A semester of monitoring practice left accuracy stable (Nietfeld et al. 2005) [V]. Weekly feedback alone did not fix calibration (LeCount & Fox 1992) [V] | Taxila micro-RCT (SR-M6) shows that a bet-feedback arm improves resolution ψ more than the process arm |
| SR-D12 | **Unsolicited help is age-gated and framed as task difficulty.** B3-B4 get *offers*, after ≥ 1 failed attempt and the wait timer. B1-B2 may get proactive support | Children aged 4-12 read unsolicited help as a low-ability cue (Graham & Barker 1990, N = 170) [V]. With age (grades 2-5), children increasingly see parental help as signalling incompetence (Pomerantz & Eaton 2000) [V]. Intrusive support produced success but also fostered failure in low achievers (Pomerantz & Eaton 2001) [V] | SR-M2 shows no efficacy or avoidance cost of proactive help in B3-B4 |
| SR-D13 | **"Problem first, instruction after" is B3+ only for new concepts.** B1-B2 get instruction first. "Attempt before help" on practice items holds for every band (MS-D5) | Productive failure: g = .36 overall (up to .58 at high fidelity). Effects reversed for grades 2-5, favouring instruction first (Sinha & Kapur 2021, 53 studies) [V] | A Taxila micro-RCT in B2 favours problem-first on DRS-7 |
| SR-D14 | **Trust calibration through CATCH-ME (planted tutor slips).** B2+ only, on skills with pL ≥ .7, ≤ 1 per session, always resolved within 2 turns. The child's challenge rate is logged | Children aged 4-6 preferred and trusted a voice assistant's explanations over a teacher's or a peer's (Haber et al. 2026, N = 310) [V]. 7-9-year-olds conformed to robots' wrong answers; adults did not (Vollmer et al. 2018) [V]. 3-year-olds trusted *accurate* robots, more so when the robots seemed agentic (Brink & Wellman 2020) [V]. Novices adopt planted errors [V, LS] | Ethics review (SR-M7) rejects it, or the challenge rate does not rise over 8 weeks |
| SR-D15 | **CHECK is always available and is verify-only (LOCATE-DON'T-FIX).** It says whether the answer is right and which step is wrong. It never says the fix | GPT Tutor students could check their answers, and the harm was "largely mitigated" (Bastani 2025) [V-full]. Children hold photo-solvers in the other hand (`market/global-ai-tutors.md` §2.10). Certainty without the answer is the competitive move | SR-M6 shows locate-only loses to worked correction on the next isomorphic item's C0 |
| SR-D16 | **SRL moves live inside subject content. There is no "learning to learn" lesson** | EEF's guidance report: about +7 months "when used well". It says strategies should be taught with specific subject content because pupils struggle to transfer generic tips (Quigley, Muijs & Stringer 2018) [V] | Never |
| SR-D17 | **Perceived learning is never an input to any decision** | GPT Tutor students *perceived* better exam performance that did not exist. GPT Base students did not perceive their loss (Bastani 2025) [V-full]. LLM access raised perceived learning beyond actual learning (Lehmann et al. 2025) [V-full] | Never |

---

## 1. Executive summary

1. **The harm is a design property, and it is invisible during practice.**
   - Bastani (~1,000 students in grades 9-11, four 90-minute sessions): GPT Base raised practice grades 48% and cut unassisted exam grades 17%. Practice tracked GPT's own 51% correctness, which shows students were copying. 67% of GPT Base first interactions in session 1 were "superficial" (repeat the question, ask for the answer), against 37% for GPT Tutor. Students did not perceive the loss [V-full].
   - Darvishi (N = 1,625): students "tended to rely on rather than learn from AI assistance" [V-full]. Lehmann: substitution lowered understanding, complementing did not, and the prior-knowledge gap widened [V-full]. Stadler: lower load, shallower reasoning [V-full].
   - **Taxila's answer:** measure the absence (solo rounds), gate the policy (TOH), and fade the tutor deliberately.
2. **Children are more exposed than these university and high-school samples.** They over-trust voice assistants and robots (Haber 2026; Vollmer 2018; Brink & Wellman 2020) [V]. Their monitoring is optimistic and their control is weak (MS §1). A humanlike Hindi voice is exactly the agentic informant children trust most. **Trust calibration (CATCH-ME, CHECK, "the teacher can be wrong") is part of independence, not an add-on.**
3. **LLMs talk too much by default.** The only robust fix is architectural: code owns WAIT, the ladder and solo rounds; the LLM renders language (SR-D2; LS rule 14).
4. **Fading is well understood in human tutoring and ITS research, and it can be implemented directly** as two state machines. The ingredients are Wood's levels and contingent shift; backward-faded worked examples with self-explanation prompts (medium-to-large transfer at no extra time; Atkinson, Renkl & Merrill 2003) [V]; adaptive over fixed fading (Salden 2010) [V]; faded SRL prompts (Gidalevich & Kramarski 2019) [V]; and overt → covert self-instruction (Meichenbaum & Goodman 1971; Schunk & Rice 1993) [V]. The new piece is **probe-down measurement of self-initiation**, so fading responds to what the child actually does unprompted.
5. **What can be taught, by age** (§2.5). B1: experiential moves only (postdiction, checking with the answer, a modelled "first/then"). B2: the child verbalises the strategy; verbalisation helped grades 3-4, not grade 2 (Schunk & Rice 1983) [V]. B3-B4: explicit planning, self-questioning, help-request localisation, theory-based memory explanations, MCII goals (+60% practice questions; Duckworth et al. 2011) [V].
6. **Calibration training should teach *how to check*, not *how to bet*.** Response-oriented accuracy training can *raise* overconfidence (Huff & Nietfeld 2009) [V]. Taxila trains the **confidence → action bridge** (pakka → commit; shayad → run one check; andaaza → ask for a kind of help), which is where children are weakest (MS §1.2).
7. **Dependency must not be confused with needing help.** The *computed* result is clear: raw hint counts mostly measure low ability. CRI uses need-adjusted process signals and ability-conditioned transfer, and it is checked against TOH first, because the tutor is often the cause.
8. **Per-child outcome-level dependency is slow to estimate. Fleet-level detection is fast.** About 316 children per arm detect a halving of transfer in 2 weeks (*computed*). So TOH and the solo-round fleet metric gate every release, while per-child CRI changes the teacher's schedule.

---

## 2. Evidence compressed to design consequences

### 2.1 Bastani 2025, read in full: what exactly failed and what fixed it
- **Design** [V-full]:
  - Each session had three parts: a teacher review, assisted practice (the randomised part), then a closed-book exam. Each exam problem corresponded to a practice problem.
  - GPT Tutor's prompt had two guardrails. First, give hints and never the answer. Second, include teacher-written correct solutions and common mistakes, so its feedback is right.
  - The correction notice (PNAS e2518204122, Aug 2025) only fixes an author affiliation [V]. This resolves the "content not checked" note in sibling files.
- **Mechanism** [V-full]:
  - GPT Base answered correctly 51% of the time (logical errors 42%, arithmetic 8%), and practice performance moved with those errors. Students were copying.
  - Message clusters split into superficial ("repeat question text", "ask for answers") and substantive ("attempted answers", "ask for help").
  - Superficial share of first interactions in session 1: Base 67%, Tutor 37%. GPT Tutor students learned to engage more substantively over time.
  - Heterogeneity by ability, resources or effort was limited.
- **Perception** [V-full]: Base students did not perceive that they did worse. Tutor students perceived that they did *better*, though they did not.
- **Consequences for Taxila:** (1) the solo round reproduces Bastani's matched-item exam inside every session (SR-D1); (2) the superficial clusters become CRI's `expedient` feature (§5.3); (3) verified solutions in context are already law (LS rule 14); (4) perceived learning is never evidence (SR-D17); (5) even the guarded tutor produced an illusion of competence, so B3+ children are shown the *standard* (§4, STANDARD).

### 2.2 The wider over-reliance evidence
| study | sample | finding | design consequence |
|---|---|---|---|
| Darvishi et al. 2024, *C&E* [V-full] | 1,625 university students, 10 courses; 4 weeks of AI prompts, then 4 randomised arms (AI / none / self-monitoring checklist / both) | reliance, not learning. Checklists partly substituted for AI prompts, but less well than AI; AI + checklist was no better than AI alone | scaffolds must be *designed to be removed*. Measure behaviour after removal (probe-down, SR-D5) |
| Lehmann, Cornelius & Sting 2025 [V-full] | 2 preregistered lab experiments + a field study, coding | no average effect. Substitution (generating solutions) raised topic volume and lowered understanding; complementing (explanations) raised understanding. Gap between low and high prior knowledge widened; perceived learning inflated (p = .044) | equity check on CRI and TOH by prior knowledge (§5.6). "Explain-again" requests are good help |
| Stadler, Bannert & Sailer 2024 [V-full] | 91 university students, ChatGPT vs Google | lower cognitive load, lower-quality justifications | low effort is not success. Never reward speed of completion |
| Chen et al. 2025 (arXiv 2509.16778) [V] | 148 university students, proof writing | homework up, exams not. Lower self-efficacy predicted more chatbot use, which partly mediated lower midterms | dependency tracks low efficacy. The remedy is mastery experiences (efficacy-safe solo rounds), not restriction (MH M5) |
| Fan et al. 2025 [V, sib] | university | "metacognitive laziness"; SRL sequences changed | — |
| Feng et al. 2026 (arXiv 2607.01692) [V] | 12 junior-high students preparing for the Zhongkao | under time pressure, students resisted Socratic dialogue and used answer-first as a diagnostic checkpoint | exam-season mode: worked solution only *after* a committed attempt, then a mandatory solo twin (§4, EXAM-TWIN) |
| Kosmyna et al. 2025 preprint [S] | 54 adults (18 in session 4), EEG | weaker connectivity and lower essay ownership with an LLM. Methods criticised (Stankovic et al. 2026 comment) [S] | not used for decisions |

### 2.3 Why children are more exposed
- **Over-trust:** see SR-D14 (Haber 2026; Vollmer 2018; Brink & Wellman 2020) [V].
- **Help carries a social meaning:** unsolicited help is a low-ability cue (Graham & Barker 1990) [V], and older children read helping as a sign of incompetence (Pomerantz & Eaton 2000) [V]. Help-seeking already declines and turns expedient across grades 3-7 (MS §4.4) [V, sib].
- **Over-help is the cultural default.** Mainstream Indian pedagogy leans on transmission and the cued slot, which "tests the last-heard word, not understanding" (ID §2, DL12) [V/M, sib]. Parents' homework help is often answer-giving (MS §7.3) [V, sib].
- **Over-help looks like care.** In MathDial, human teachers drift toward Telling as conversations go on [V-full]. The tutor's own drift is a monitored variable (TOH).

### 2.4 Fading: the mechanics that have evidence
| mechanism | evidence | Taxila implementation |
|---|---|---|
| contingent shift: more help after failure, less after success, one level at a time | Wood's levels: general verbal → specific verbal → specific verbal + nonverbal → preparation for action → demonstration (Hedin & Gaffney 2013, grade 6) [V]. Contingent tutoring is a computer-tutor design principle (Wood & Wood 1999) [V] | the hint ladder W1-W5 (§3.2), mapped onto LS rule 15's pump → hint → prompt → assertion |
| contingency × frequency | van de Pol 2015 (SR-D4) [V] | specificity cap at high support (SR-D4) |
| backward fading of worked steps + self-explanation prompts | Atkinson, Renkl & Merrill 2003 [V]. Fading reduces *unproductive* learning events (Renkl, Atkinson & Grosse 2004) [V]. Grade 6 geometry in ASSISTments: fading had the largest pre-post effect, moderated by prior knowledge (Miller-Cotto & Medrano 2026, N = 114) [V] | F4 SHARE level. Kits carry `fadedVersion` (factory/multimodal-orchestration) |
| adaptive fading | Salden et al. 2010 [V]. Rapid dynamic assessment (a first-step probe) to tailor instruction (Kalyuga & Sweller 2005) [V] | the entry level comes from KT pL plus a first-step probe (§3.2) |
| faded SRL prompts | Gidalevich & Kramarski 2019 [V]. Metacognitive prompts in computer-based environments: g = .50 on SRL and .40 on outcomes, moderated by feedback, specificity and adaptivity (Guo 2022) [V] | P3 → P0 per move with probe-down (§3.3) |
| overt → covert self-instruction | Meichenbaum & Goodman 1971 (impulsive children; tiny n; gains held at 1 month) [V]. Fading to covert speech plus feedback linking strategy to success raised efficacy and comprehension in grade 5 (Schunk & Rice 1993, n = 44) [V] | the voice-native SELF-TALK fade (§3.3). Whisper detection is [U] (SR-M8) |
| prompt dependence (correct after prompts, never alone) | named and treated in applied behaviour analysis: differential reinforcement, prompt fading, extended response interval. The best fix was individual (Gorgan & Kodak 2019) [V]. Across 22 studies, progressive-delay studies showed fewer errors to criterion than constant-delay studies, an indirect comparison (Walker 2008) [V] | CRI feature `waitRescue`, and the progressive-delay wait (§3.4). Populations are disability samples: analogue only |
| gradual release of responsibility (I do → we do → you do) | a 35-year practice tradition (Webb et al. 2019) [V]; Pearson & Gallagher 1983 [S] | F5 → F1 maps onto it. F0 adds self-check and teach-back |

### 2.5 What an AI tutor can teach, by band
| skill | B1 6-7 | B2 8-9 | B3 10-12 | B4 13-15 | key evidence |
|---|---|---|---|---|---|
| **planning** | the tutor models a two-step "first/then" plan aloud as a *coping* model (it slips and fixes) | the child says the first step before starting | the plan prompt (MS §4.5): first step plus a check step | weekly MCII goal with if-then plans (Conductor); child-ordered revision (RO S3) | coping models beat a single mastery model for children who struggle with maths (Schunk et al. 1987) [V]; peer and coping models raised efficacy (Schunk & Hanson 1985) [V]; MCII +60% practice questions (Duckworth 2011) [V] |
| **monitoring** | postdiction → show the answer (MS); "check together" | SELF-TALK spoken aloud; bets with counts (MS) | self-explanation; erroneous examples; delayed keywords before a JOL (MS) | self-questioning (IMPROVE); concept maps (MS) | erroneous examples d = .33 at a 1-week delay, though students liked them less (McLaren et al. 2015, n = 390) [V]; self-explanation g = .55 [V, sib] |
| **help-seeking** | a tap menu of help *kinds* (explain again / hint / check); forced-choice localisation (step 1 or step 2?) | + free localisation ("where are you stuck?") | + localisation required before W3+ hints | + evaluating the help received ("did that hint help?") | grade 9 wrote more explicit help requests than grade 6 (Puustinen 2009) [V, sib]; MetaCLASS's UNCERTAINTY_PROBE and PROMPT_RESOURCE moves [V-full] |
| **calibration → control** | none beyond postdiction (Kolloff null at 6) [V, sib] | confidence → action contract, tutor-prompted | the contract faded to a cue; checking methods per domain | own "pakka-meter", opt-in; the STANDARD view | §2.6 |
| **evaluation** | "kaisa raha?" shape compared with the record | + "what helped?" (one per session at most) | same | + choosing next week's focus | REFLECT is over-produced by LLMs (+19.3 pp bias, MetaCLASS) [V-full], so cap it |
| **learning by teaching** | — | TEACH-ME on a mastered skill | TEACH-ME + the tutor's "student" makes a planted error | teach a sibling or parent (RO HOME-TEACH-BACK) | the protégé effect, largest for lower achievers (Chase 2009) [V]; teachable agents cut feedback neglect for lower achievers (Silvervarg et al. 2021, n = 285) [V] |

Generic caveats:
- Reciprocal-teaching gains were usually significant on experimenter-made tests and non-significant on standardised ones. Explicit strategy instruction *before* the dialogue helped (Rosenshine & Meister 1993, 19 studies) [V].
- SRSD writing instruction for elementary pupils: ES = 1.17 (Graham, McKeown & Kiuhara 2012) [V]. Its stage structure (model → memorise → support → independent) is a fading template [S].
- **Expect SRL process indices to move slowly while DRS moves faster** (MS §5.1).

### 2.6 Calibration training that works for children
- **Process beats response.**
  - Grade 5: comprehension-monitoring training improved calibration. Adding confidence-accuracy practice raised overconfidence (Huff & Nietfeld 2009) [V].
  - Strategy training improved performance, confidence and calibration together (Gutierrez & Schraw 2015, adults) [V].
  - In grade 4, faded prompts improved metacognitive knowledge but *not* calibration (Gidalevich & Kramarski 2019) [V]. Calibration is the hardest thing to move.
- **Misconceptions manufacture confidence.** Activating inaccurate prior knowledge made primary-school children overconfident, and they then dropped those concepts from further study (van Loon, de Bruin & van Gog 2013) [V]. So a confident error routes to misconception diagnosis first (KT §1.6, MS §1.3).
- **Calibration as a trait is real but domain-bound.** Resistance to overconfidence correlated across domains; resolution did not (Dentakos et al. 2019, adults) [V]. This matches MS's domain-scoped κ.
- **Design: the confidence → action contract.** Each bet level maps to one control action the child learns to take (pakka → commit; shayad → one check; andaaza → ask for a kind of help).
  - The child is taught the check methods per domain (inverse operation, estimate, substitute back, reread the question, unit check), shipped in kits [U].
  - The trained quantity is the bridge, κ_ctrl = P(check | shayad) − P(check | pakka). A high κ_ctrl means monitoring drives control, which is the gap children show (Metcalfe & Finn 2013; Bayard 2021) [V, sib].
  - "Useful calibration" = P(correct | committed after a check) − P(correct | committed without one), at equal pL.

---

## 3. The independence model: fading as two state machines

### 3.1 Levels
| domain support (per child × skill) | what the tutor does | what the child does | the child-facing frame |
|---|---|---|---|
| **F5 MODEL** | worked example; think-aloud as a coping model | watches, predicts the next step | "watch me, catch me if I slip" shape |
| **F4 SHARE** | does the early steps; the last k steps are left blank (backward fading) | completes the faded steps, self-explains one | co-solve |
| **F3 GUIDE** | one general prompt per step (≤ W2, SR-D4) | does every step | steps with the teacher alongside |
| **F2 ON-CALL** | silent until asked or until the wait timer; contingent hints W1-W5 | the whole item | "I'm listening" |
| **F1 SOLO** | silent until commit, then CHECK (verify and locate only) | the whole item, then commits | "apne-aap round" (a game frame, B1-B3) |
| **F0 OWN** | confirms, or asks one "why" | checks own work before committing; may teach it back | "you check, I'll confirm" |

| SRL prompting (per child × move ∈ {plan, check, locate, confAction, explain, selfTalk}) | form |
|---|---|
| **P3 EXPLICIT** | a full prompt shape at every opportunity |
| **P2 CUE** | a one-token cue or an icon on screen |
| **P1 WAIT** | an expectant pause plus the icon, with no words |
| **P0 NONE** | nothing; spontaneous use is recorded |

### 3.2 Domain-support controller (pure, replayable)
```ts
// server/director/fade.ts (proposed). Pure; inputs from KT and the lesson state machine. Thresholds [U] → SR-M4.
export type Band = 'B1' | 'B2' | 'B3' | 'B4';
export type F = 0 | 1 | 2 | 3 | 4 | 5;                        // F0 OWN … F5 MODEL
export type KTClass = 'C0' | 'C1' | 'C2' | 'C3' | 'C4';        // KT §1.2
export interface FadeState { level: F; indepStreak: number; failStreak: number; firstStepProbe?: 'pass' | 'fail' }
export interface ItemResult { cls: KTClass; wheelSpin: boolean; selfCheckedBeforeCommit: boolean }

export function entryLevel(pL: number, band: Band, newConcept: boolean, probe?: 'pass' | 'fail'): F {
  if (newConcept) return band === 'B1' || band === 'B2' ? 5 : 4;   // SR-D13: instruction first in grades 2-5
  let l: F = pL < 0.3 ? 5 : pL < 0.6 ? 3 : pL < 0.85 ? 2 : 1;       // expertise reversal (LS rule 16)
  if (probe === 'pass' && l > 1) l = (l - 1) as F;                  // rapid dynamic assessment (Kalyuga & Sweller 2005)
  if (probe === 'fail' && l < 5) l = (l + 1) as F;
  return l;
}
const K_DOWN: Record<F, number> = { 5: 1, 4: 2, 3: 2, 2: 1, 1: 2, 0: Infinity };   // independent successes needed to fade one level

export function nextSupport(s: FadeState, r: ItemResult, pL: number, band: Band): FadeState & { route?: 'prerequisite' } {
  if (r.wheelSpin) return { ...s, route: 'prerequisite' };          // KT §2.6 / MS-D13: a pedagogy problem, not a fade decision
  const floor = Math.max(0, entryLevel(pL, band, false) - 1) as F;  // never fade more than one level past what pL supports
  const independent = r.cls === 'C0' || (r.cls === 'C1' && s.level <= 2);
  if (independent) {
    const streak = s.indepStreak + 1;
    const toOwn = s.level === 1 && !r.selfCheckedBeforeCommit;      // F0 needs observed self-checking
    if (streak >= K_DOWN[s.level] && s.level > floor && !toOwn)
      return { level: (s.level - 1) as F, indepStreak: 0, failStreak: 0 };
    return { ...s, indepStreak: streak, failStreak: 0 };
  }
  if (r.cls === 'C3' || r.cls === 'C4')                              // contingent shift: ONE level up, never a jump to F5
    return { level: Math.min(5, s.level + 1) as F, indepStreak: 0, failStreak: s.failStreak + 1 };
  return { ...s, indepStreak: 0 };                                   // C1/C2 at a supported level: hold
}

// Within an item: Wood's levels W1 general verbal … W5 demonstration (= assertion, then an isomorphic item; LS rule 15).
export function nextRung(prev: 0 | 1 | 2 | 3 | 4 | 5, lastAttempt: 'fail' | 'none', level: F, failsOnStep: number): 1 | 2 | 3 | 4 | 5 {
  let rung = Math.min(5, prev + (lastAttempt === 'fail' || prev === 0 ? 1 : 0)) as 1 | 2 | 3 | 4 | 5;
  if (level >= 3 && failsOnStep < 2) rung = Math.min(rung, 2) as 1 | 2;  // SR-D4: frequent help stays general
  return rung;
}
// On the next item, help starts one rung below where the last success needed it (Wood: success → less help).
```

### 3.3 SRL-prompt controller with probe-down
```ts
export type P = 0 | 1 | 2 | 3;
export type SrlMove = 'plan' | 'check' | 'locate' | 'confAction' | 'explain' | 'selfTalk';
export interface PromptFade { level: P; spont: number; missed: number; opps: number; last6: boolean[] }

/** Called at each opportunity for move m. Returns the level to USE now. Every 5th opportunity probes one level down. */
export function levelForOpportunity(p: PromptFade): P {
  return p.opps % 5 === 4 && p.level > 0 ? ((p.level - 1) as P) : p.level;
}
/** observed: did the child perform the move without a prompt at this opportunity (only countable when level used ≤ 1)? */
export function updatePrompt(p: PromptFade, usedLevel: P, observed: 'spontaneous' | 'prompted' | 'missed', outcomeDrop: boolean): PromptFade {
  const countable = usedLevel <= 1;
  const spont = p.spont + (countable && observed === 'spontaneous' ? 1 : 0);
  const missed = p.missed + (countable && observed === 'missed' ? 1 : 0);
  const last6 = countable ? [...p.last6, observed === 'spontaneous'].slice(-6) : p.last6;
  const mean = (1 + spont) / (2 + spont + missed);                     // Beta(1,1) posterior mean of self-initiation
  let level = p.level;
  if (mean >= 0.6 && spont + missed >= 8 && level > 0) level = (level - 1) as P;            // SR-D5: fade on evidence
  const recent = last6.length >= 6 ? last6.filter(Boolean).length / 6 : 1;
  if ((recent < 0.3 || outcomeDrop) && level < 3) level = (level + 1) as P;                // revive
  return { level, spont: level !== p.level ? 0 : spont, missed: level !== p.level ? 0 : missed, opps: p.opps + 1, last6 };
}
```
- **SELF-TALK fade (voice-native):** tutor models the routine aloud → child and tutor say it together → child says it aloud alone → child whispers → silence, with only "which step are you on?" asked.
  - B1 stops at the "together" stage, because verbalisation did not help grade 2 (Schunk & Rice 1983) [V].
  - Each fade step is paired with feedback that links strategy use to success, about the task and never the self (Schunk & Rice 1993) [V].
- `outcomeDrop` = the solo-round success rate for the skills where the move applies falls ≥ 15 pp below its 4-week mean [U].

### 3.4 Wait time and the progressive delay (how silence is decided)
```ts
export const WAIT_BASE_MS: Record<Band, number> = { B1: 6000, B2: 5000, B3: 4000, B4: 4000 }; // [U]; measured from TTS end on device (LS rule 8)
export function waitMs(band: Band, indepStarts: number): number {
  const base = WAIT_BASE_MS[band];                      // VT waitNudgeSec is the floor; never shorter
  return Math.min(base * 2.5, base * (1 + 0.25 * indepStarts));   // grows with consecutive independent starts; reset to 0 on a fail
}
```
- A **help-eligible window** (MS §3.4) is any window in which the timer runs without tutor content. These windows are both the WAIT action and the denominator for `waitRescue` (§5.3).
- Non-content backchannel (hmm, a nod animation) is allowed during WAIT [U: does it read as pressure? SR-M5].

### 3.5 Solo rounds
1. **Count:** B1 2, B2-B4 3 per session [U]. At least one of them is an isomorphic twin of an item practised *with help* in this session. The others come from LOT's delayed schedule (which also feeds DRS-7).
2. **Efficacy-safe selection:** predicted P(correct) ∈ [.6, .9]. A solo round is a mastery experience first and a measurement second (MH M5) [U for the band].
3. **Silence:** no content utterance before commit (invariant SRI1). After commit: CHECK (LOCATE-DON'T-FIX). A fix after the locate counts as C1.
4. **Frame:** a game ("apne-aap round") for B1-B3. For B4 it is a plain "exam-style" frame. It is never framed as a test of the child.
5. **Declining is allowed.** It is logged as `soloAvoid`. Declined rounds are re-offered in the next session at a higher predicted p.

---

## 4. Teacher-move catalogue (shapes, not lines)

Code selects the move. The LLM renders it in the persona's register. Every shape is a slot structure; none is a sentence the model could recite (inherited law). `pL` comes from KT; `F` and `P` from §3.

| id | SRL phase | bands | trigger predicate (code) | shape | fades via | logs | evidence |
|---|---|---|---|---|---|---|---|
| WAIT | all | all | help-eligible window, timer not expired, no child request | (no content) + listening cue | the timer grows (§3.4) | `eligible` window | MetaCLASS NI [V-full]; Tobin [V] |
| TRY-FIRST | control | all | the child asks for help before any attempt on a practised skill, pL ≥ .4 | ⟨invite one attempt at the first step only⟩ + ⟨promise help right after⟩ | P-level on `locate` | `preHelp` | Roll 2014 [V, sib]; DA "just tell me" row |
| LOCATE | monitoring / help | B1 forced choice; B2+ open | any child help request at F ≤ 3 | ⟨ask which step is stuck⟩ (B1: ⟨step A or step B?⟩) | P3 → P0 | `locate` spontaneous or prompted | Puustinen 2009 [V, sib]; MetaCLASS UP [V-full] |
| KIND-OF-HELP | help | all | a help request with no kind given | ⟨offer three kinds: explain again / hint / check⟩. *Answer* is never on the menu | tap menu → voice only | `reqType` | MS-D7; Bastani's superficial clusters [V-full] |
| HINT-Wn | help | all | `nextRung()` | W1 ⟨general pointer to the goal⟩ · W2 ⟨name the relevant idea⟩ · W3 W2 + ⟨on-screen highlight⟩ · W4 ⟨step set up, child completes⟩ · W5 ⟨worked step⟩ → isomorphic twin. OFFER-HINT = the same rung, offered and framed as task difficulty (SR-D12) | contingent shift | `rung`, `dwellAfterMs` | Wood levels [V]; LS rule 15 |
| CHECK | monitoring | all | the child commits, or asks "is it right?" | ⟨right/wrong⟩ + ⟨which step⟩ — never the fix | always available | `check` | SR-D15 |
| CONF-ACTION | calibration → control | B2+ | bet = shayad or andaaza (MS P12) | ⟨connect the bet level to its action⟩ (shayad → ⟨pick a check method⟩) | P3 → P0 | κ_ctrl (§2.6) | Huff & Nietfeld [V]; MS §5 |
| CHECK-METHOD | monitoring | B2+ | before a commit on a multi-step item at P ≥ 2 | ⟨name one domain check: inverse, estimate, substitute, reread, units⟩ | P3 → P0 | `check` spontaneous | process-oriented training [V] |
| PLAN | forethought | B1 modelled; B2 child names a first step; B3+ first step + check step | a multi-step item, ≤ 1 per session | ⟨ask how they'll start⟩ (B1: tutor models ⟨first … then …⟩) | P3 → P0 | plan rubric (MS §4.5) | Schunk 1987 [V]; MS |
| MODEL-COPING | modelling | all; mandatory at F5 | F5 MODEL | ⟨think aloud⟩ + ⟨a slip⟩ + ⟨notice and fix it⟩ | F5 → F4 | — | coping > mastery model [V]; RO FLIP |
| SELF-EXPLAIN | monitoring | B2+ | after a faded step (F4) or a W4/W5 hint | ⟨ask why this step works, in their words⟩ | P3 → P0 | explain rubric | Atkinson 2003 [V]; g = .55 [V, sib] |
| FIND-MY-MISTAKE | monitoring | B2+ | pL ≥ .6 (novices adopt planted errors) | ⟨worked solution with one error⟩ + ⟨find and fix it⟩ | — | P6 catch | McLaren 2015 [V]; LS P6 |
| CATCH-ME | trust calibration | B2+ | pL ≥ .7, ≤ 1 per session, verifiable maths step only | ⟨tutor makes one slip in its own working⟩ → the child flags it, or the tutor reveals and fixes it within 2 turns | rate falls as the challenge rate rises | `challenge` | SR-D14 |
| TEACH-ME | evaluation / transfer | B2+ | mastered skill (KT learned-today) | ⟨tutor plays the confused learner⟩ + ⟨child explains⟩ | — | teach-back rubric (LS P1) | Chase 2009 [V]; Silvervarg 2021 [V] |
| SOLO | independence | all | §3.5 scheduler | ⟨frame the round⟩ → silence → CHECK | count per band | solo outcome | SR-D1 |
| STEP-BACK | independence | all | F drops a level | **no announcement** (RO: stage changes are never announced); the next item simply starts at the new level | — | `fade` event | RO §3 |
| STANDARD | calibration | B3+, monthly, opt-in in B4 | ≥ 10 solo and ≥ 10 assisted results in the window | ⟨show alone vs with-help counts on the same skills⟩ + ⟨one task-focused next step⟩ | — | viewed | Lipko 2009 [V, sib]; SR-D17 |
| MEMORY-THEORY | strategy choice | B3+ | before a "quiz me / explain again" choice | ⟨one clause on why retrieval feels harder and works better⟩ | once per month | choice share (MS S9) | Koriat & Bjork 2006 [V, sib] |
| MCII | forethought | B4 (B3 opt-in) | weekly Conductor planning | ⟨wish⟩ → ⟨obstacle⟩ → ⟨if-obstacle-then-action⟩, child-authored | — | goal met | Duckworth 2011 [V] |
| REFLECT | evaluation | all; ≤ 1 per session | session close | ⟨what helped today⟩ compared with the record | — | postdiction match (MS S10) | capped: LLM over-production [V-full] |
| EXAM-TWIN | independence | B3-B4, exam windows | the child requests a full worked solution under time pressure | worked solution *after* a committed attempt → a mandatory solo twin | — | `examTwin` | Feng 2026 [V]; Bastani [V-full] |
| HOMEWORK-TWIN | independence | all (DC5) | photo-homework item | ladder on an *isomorphic* item; the child writes their own answer to the school item | — | `hwTwin` | DC5; school-sync |

**Move selector:**
```ts
export function selectMove(st: TurnState): MoveId {
  if (st.solo && !st.committed) return 'WAIT';                                   // SRI1
  if (st.childRequest) {
    if (st.childRequest === 'answer') return st.attemptsOnStep === 0 && st.pL >= 0.4 ? 'TRY-FIRST' : 'KIND-OF-HELP'; // MS-D7
    if (!st.stepLocated && st.F <= 3) return 'LOCATE';
    return 'HINT';                                                                // rung from nextRung()
  }
  if (st.committed) return st.bet && st.bet !== 'pakka' && st.prompt.confAction > 0 ? 'CONF-ACTION' : 'CHECK';
  if (st.eligible && st.msSinceQuestion < waitMs(st.band, st.indepStarts)) return 'WAIT';  // SR-D2: code owns silence
  if (st.attemptsOnStep >= 1 && (st.band === 'B1' || st.band === 'B2')) return 'HINT';   // proactive help allowed B1-B2
  if (st.attemptsOnStep >= 1) return 'OFFER-HINT';                                // SR-D12: offer, framed as task difficulty
  return 'WAIT';
}
```

---

## 5. Dependency risk: the Crutch Risk Index (CRI) and Tutor Over-Help (TOH)

### 5.1 Construct
- **Dependency:** the child's success relies on the tutor's presence beyond what their knowledge state predicts.
- **It is not:**
  - needing help, which is legitimate and need-coupled (MS-D4)
  - emotional attachment (RO-9 overlay: a separate signal set)
  - gaming (DA GAME: an evidence-validity problem)

  All four can co-occur. They are computed and acted on separately.
- **Dependency is a property of child × policy.** Bastani showed the same population behaving differently under two tools [V-full]. Hence three layers:

| layer | what it measures | per child? | horizon | owner |
|---|---|---|---|---|
| **L1 outcome**: solo-transfer residual τ | solo-round success minus the ability-conditioned expectation | only after ≥ 200 solo rounds (SR-D8) | 16 weeks | fleet guard + validation criterion |
| **L2 process**: CRI | need-adjusted pre-attempt help, expedient share, click-through, wait-for-rescue | yes | 28-day window, evaluated weekly | Director overlay |
| **L3 policy**: TOH | tutor step share, Telling, help-before-wait, leaks | yes, and fleet | per release + per child weekly | release gate + per-child policy fix |

### 5.2 Features (all within help-eligible windows unless stated)
- `preHelpResid` = mean over items of [h_pre − ĥ(pL, band)]. h_pre = 1 when the child asks for help before any attempt. ĥ is a fleet logistic model on KT pL and band (a "need-adjusted" observed-minus-expected).
- `expedient` = (answer + repeat-question requests + 1) / (child help requests + 4). This is Beta(1,3) shrinkage of Bastani's superficial share.
- `click` = share of help events where the dwell after a rung is < τ_read(band) and the next rung is requested (MS §4.4) [U: τ_read].
- `waitRescue` = share of eligible windows where the child takes no action until the nudge, minus a fleet expectation given pL. This is the operational form of prompt dependence (Gorgan & Kodak 2019) [V].
- Research-only until SR-M3:
  - `reassure`: "is it right?" requests before committing on items with pL ≥ .8
  - `soloAvoid`: declined or stalled solo rounds
  - `echo`: child answers that are a cued-slot completion of the tutor's last turn (ID DL12)
- Outcome: `transferRes` = −mean(solo − ŝ(pL, θ̂_c, band)). θ̂_c is the child's ability estimated from *unaided first attempts only*. Without θ̂_c, KT noise makes low-ability children look dependent (*computed*, §5.4).
- TOH components, per child and per release:
  - `tss` = tutor-authored steps / all solution steps. A CUED-SLOT fill counts as tutor-authored.
  - `helpBeforeWait` = content utterances inside an unexpired eligible window.
  - `telling` = the final answer stated before the ladder is exhausted (= leak, MSI5).
  - Telling@k on the simulator battery (MathDial) [V-full].

### 5.3 Index
```ts
// server/learner/cri.ts (proposed). Band reference distributions refit monthly from the fleet (median/MAD), shrunk to priors.
export interface CriFeatures { preHelpResid: number; expedient: number; click: number; waitRescue: number; nEligible: number; nHelp: number }
export interface BandRef { med: Record<keyof Omit<CriFeatures, 'nEligible' | 'nHelp'>, number>; mad: Record<string, number>; q90: number; q75: number }
const W = { preHelpResid: 0.25, expedient: 0.25, click: 0.25, waitRescue: 0.25 };   // equal priors; refit in SR-M3 (keep only incremental validity > 0)
const N0 = 40;                                                                        // shrinkage pseudo-count [U]

export function criScore(f: CriFeatures, ref: BandRef): number {
  let s = 0;
  for (const k of Object.keys(W) as (keyof typeof W)[]) s += W[k] * (f[k] - ref.med[k]) / (1.4826 * ref.mad[k] || 1);
  return s * (f.nEligible / (f.nEligible + N0));                                     // little data → near 0, never a flag
}
/** Hysteresis: ON after 2 consecutive weekly scores > q90; OFF after 2 consecutive < q75. Needs ≥ 60 eligible windows and ≥ 10 help events. */
export function criFlag(history: number[], ref: BandRef, prev: boolean, f: CriFeatures): boolean {
  if (f.nEligible < 60 || f.nHelp < 10) return false;
  const [a, b] = history.slice(-2);
  if (!prev) return a > ref.q90 && b > ref.q90;
  return !(a < ref.q75 && b < ref.q75);
}
```

### 5.4 *Computed* properties (`metacognition-srl-depsim.py`; N = 3,000; 12 practice items + 3 solo rounds per session, 4 sessions a week; dependency δ generated **independent** of ability θ)

| index | r(·, θ) at 2 / 4 / 8 wk | r(·, δ) at 2 / 4 / 8 wk | test-retest at 2 / 4 / 8 wk |
|---|---|---|---|
| raw help rate | −.45 / −.47 / −.47 | .81 / .83 / .84 | .90 / .95 / .97 |
| `preHelpResid` (need-adjusted) | −.11 / −.12 / −.12 | .91 / .93 / .95 | .88 / .93 / .97 |
| `expedient` | −.07 / −.07 / −.08 | .83 / .89 / .92 | .79 / .89 / .94 |
| `click` | +.07 / +.06 / +.04 | .70 / .82 / .88 | .65 / .79 / .88 |
| transfer residual, *not* ability-conditioned | −.38 / −.51 / −.58 | .16 / .26 / .29 | .18 / .33 / .47 |
| `transferRes` (ability-conditioned) | −.08 / −.07 / −.06 | .21 / .35 / .42 | .05 / .14 / .22 |
| **CRI composite** | **−.06 / −.06 / −.07** | **.86 / .90 / .92** | **.83 / .88 / .92** |

| flag = top 10% at 4 weeks | share of flags in the lowest-ability quartile (chance .25) | hit rate on top-10% δ |
|---|---|---|
| raw help rate | .58 | .61 |
| `preHelpResid` | .39 | .78 |
| transfer residual (unconditioned) | .64 | .20 |
| CRI | .35 | .80 |

- **`transferRes` against the number of solo rounds:** test-retest .00 (12), .04 (24), .13 (48), .24 (96), .38 (192). Validity r(·, δ) at 192 rounds is .57.
- **Fleet A/B** (2 weeks, mean solo success per child, child-level SD ≈ .19):
  - a policy that cuts episode gain to 0.8× moves solo success .577 → .557 and needs ~1,374 children per arm (80% power, α .05)
  - at 0.5× (a Bastani-sized harm) it moves .577 → .534 and needs ~316 per arm.
  - Covariate adjustment on the pre-period solo rate would shrink these numbers [U, not computed]. Compare OE's DRS-7: ≈ 1,470 households per arm for +5 pp.
- **Read honestly.** The high process validities (.8-.9) are *by construction*: the simulator generates the process signals from δ. Three results are robust to that: (1) raw counts are ability-confounded; (2) need adjustment and ability conditioning remove most of the confound; (3) outcome-level dependency is unreliable per child at Taxila's volume. Whether the process signals actually predict learning harm in Indian children is an empirical question (SR-M3). Bastani's superficial-message share is the only field evidence that they do, and it is group-level [V-full].

### 5.5 What happens when the CRI flag is ON (an overlay that changes the schedule only)
1. **Check TOH first.** If this child's `tss` or `helpBeforeWait` exceeds the band q75, the per-child policy is tightened before the child overlay runs: WAIT base +25%, rung cap W2 at F ≥ 2, and the CUED-SLOT share halved. Then CRI is re-evaluated after 2 weeks.
2. **Child overlay:** TRY-FIRST always; LOCATE prompted at P3 regardless of its fade state; +1 solo round at predicted p ≈ .8, so it succeeds and builds efficacy; KIND-OF-HELP instead of direct hints; TEACH-ME on one mastered skill per session; STANDARD at the next monthly slot for B3+. No change in warmth (NEVER MANIPULATE; RO).
3. **Parent card** (§7): counts plus one home suggestion; never a label.
4. **Never:** fewer hints for the child as punishment, a visible "help budget", a shaming counter (MS-D6, SR invariant SRI5).

### 5.6 TOH release gate (eval suite, `verify-release --sim`, student-simulators battery)
| metric | definition | fail if [U thresholds; fitted on SR-M9] |
|---|---|---|
| tutor step share `tss` | tutor-authored steps / all steps, per band | +3 pp over the last release |
| Telling@k | % of simulated dialogues where the final answer is stated within k turns before the ladder is exhausted (MathDial) | any increase above 0.5% at k = ladder length |
| help-before-wait | content turns inside unexpired eligible windows | > 2% of eligible windows |
| WAIT agreement | selector picks WAIT where expert labels say silent | < .80 (SR-M1) |
| solo-round success (sim) | the `leaky` control must fail and the release must not | release < baseline − 2 pp |
| equity | TOH and solo success split by prior-knowledge tercile | the low-tercile gap widens > 2 pp (Lehmann) |

---

## 6. Data contract and storage (proposed additions; extends MS §6.1)
```ts
// shared/contracts.ts
type FadeEvent  = { kind: 'fade'; skillId: string; from: F; to: F; reason: 'indep' | 'fail' | 'entry' | 'prereq'; pL: number };
type PromptEvt  = { kind: 'prompt'; move: SrlMove; usedLevel: P; observed: 'spontaneous' | 'prompted' | 'missed'; probeDown: boolean };
type SoloEvent  = { kind: 'solo'; itemKey: string; twinOf?: string; predictedP: number; outcome: KTClass; declined: boolean; latencyMs: number };
type WaitEvent  = { kind: 'wait'; windowMs: number; childActedMs?: number; nudged: boolean; band: Band };
type TrustEvent = { kind: 'catchMe'; skillId: string; flaggedByChild: boolean; turnsToResolve: 1 | 2 };
type StepAuthor = { kind: 'step'; problemKey: string; stepIdx: number; author: 'child' | 'tutor' | 'cued_slot' };
// every help event (MS §6.1) additionally carries: supportLevel: F; promptLevel: P; rung: 1..5
```
```sql
-- db/migrations (Neon Postgres)
create table vy_fade_state  (child_id uuid, skill_id text, level smallint check (level between 0 and 5),
  indep_streak smallint not null default 0, fail_streak smallint not null default 0, updated_at timestamptz not null,
  primary key (child_id, skill_id));
create table vy_prompt_fade (child_id uuid, move text, level smallint check (level between 0 and 3),
  spont int not null default 0, missed int not null default 0, opps int not null default 0, last6 boolean[] not null default '{}',
  primary key (child_id, move));
create table vy_dep_window  (child_id uuid, window_end date, lane text check (lane in ('lesson','homework')),
  pre_help_resid real, expedient real, click real, wait_rescue real, transfer_res real, n_solo int, n_eligible int,
  tss real, help_before_wait real, cri real, cri_flag boolean, ref_version text, primary key (child_id, window_end, lane));
```
- **The homework lane is computed separately.** Answer pressure is highest there (DC5).
- **CRI is behavioural profiling of a child**, which falls in the DPDP §9(3) risk zone (LS §0 item 10). It is used only for pedagogy, it is parent-visible, it never feeds ads, ranking or third parties, and it needs the legal opinion LS already calls for. Compliance is deprioritised by owner directive; this is noted, not solved.

---

## 7. Parents and child-facing (adds to MS §7; every MS §7.1 contract rule applies)
| row | shape (slots) | threshold |
|---|---|---|
| independence | solved {a} of {n} apne-aap rounds this month (was {a′} of {n′}) | n ≥ 10 per window; MS §6.3 growth rules for any change claim |
| stepping back | started {k} topics on her own this month that needed the teacher alongside in {month} (F ≤ 2 now vs ≥ 3 then) | k ≥ 2 |
| help kinds | = MS §7.2 help-by-kind row | — |
| when the CRI overlay is on | "Taxila is giving more try-it-yourself rounds in {domain}" + one suggestion: ⟨let her try the first step before helping⟩ or ⟨ask where she is stuck before explaining⟩ or ⟨ask her to teach it to you⟩ | flag ON for ≥ 2 weeks |

- **Banned** (extends MS §7.4 and MSI1), in English, Hindi and Roman Hindi: dependent, relies on AI, addicted, can't work alone, spoon-fed, *nirbhar*, *sahare*, lazy about thinking, crutch, any CRI or TOH number, any "independence score".
- **Child-facing:**
  - B1-B3 see the apne-aap round as a game with their own streak of *rounds tried*, not rounds right. Trying is the behaviour being reinforced, and nothing is lost for a wrong answer.
  - B4 may opt into STANDARD.

---

## 8. Measurements and experiments this design depends on
| id | question | method | decides | bar |
|---|---|---|---|---|
| SR-M1 | Can an LLM ever own WAIT? | 300 Taxila turns per band labelled by 3 expert teachers ("stay silent / speak"); gpt-5.6 selector vs the code policy | SR-D2 | LLM ≥ .80 agreement *and* ≥ code policy |
| SR-M2 | Do solo rounds and offer-only help cost affect or efficacy? | micro-randomised trial (MRT): 2 vs 3 solo rounds; proactive vs offer help in B3-B4; MH §7 markers, `soloAvoid`, M5 efficacy | SR-D1, SR-D12 | no rise beyond MH thresholds |
| SR-M3 | Incremental validity of CRI features | fleet: next-month `transferRes` and DRS-7 residual on features, net of θ̂ and band; test-retest of CRI on real windows | §5.3 weights; SR-D7, SR-D8 | keep features with ΔR² > 0 (CI excludes 0); CRI retest ≥ .7 at 4 weeks |
| SR-M4 | Adaptive vs fixed fading; the specificity cap | MRT at item level: `nextSupport` vs a fixed schedule; cap on vs off | SR-D3..D5 | adaptive ≥ fixed on DRS-7 and solo success |
| SR-M5 | Progressive wait | MRT: fixed vs progressive wait; child-initiated starts, DRS-7, frustration markers (DA) | SR-D6 | more independent starts, no DRS loss |
| SR-M6 | LOCATE-DON'T-FIX vs worked correction; process vs bet-feedback calibration | MRT: next isomorphic item's C0; ψ and κ_ctrl change at 8 weeks | SR-D11, SR-D15 | locate non-inferior; process ≥ bet-feedback on κ_ctrl |
| SR-M7 | CATCH-ME ethics and effect | ethics review with a child-safeguarding advisor; child cognitive interviews on the AI notice; challenge-rate trajectory | SR-D14 | approved; challenge rate rising; no trust collapse (efficacy, enjoyment) |
| SR-M8 | Hinglish SELF-TALK in voice | ASR on spoken-aloud and whispered routine words by band; human-coded subsample | §3.3 | whisper detection precision ≥ .8, or the whisper stage is dropped |
| SR-M9 | TOH baselines on gpt-5.6 and gpt-realtime-2.1 | simulator battery (`leaky`, `sycophant` controls) + 200 real sessions per band | §5.6 thresholds | thresholds set at baseline + measured noise |
| SR-M10 | CRI fairness | flag share by ability quartile, gender, language, device | SR-D7 | lowest quartile ≤ 1.3× chance; no gender gap |

---

## 9. Invariants (eval-gated; if a change trips them, the change is wrong)
| id | predicate | method |
|---|---|---|
| SRI1 | No tutor content utterance during a solo round before commit | lesson-state-machine unit test + log audit |
| SRI2 | In an unexpired help-eligible window with no child request, the Director makes no content LLM call | trace audit (OE spans) |
| SRI3 | Support level changes by ≤ 1 per item and never goes below entry(pL) − 1 | property test on `nextSupport` |
| SRI4 | CRI never reads raw help counts; every help-derived feature is need-adjusted against pL and band | unit test + code audit (= MSI2 pattern) |
| SRI5 | CRI and TOH never appear as words in any prompt, child string or parent string; no help budget or counter is ever shown | lexicon gate (shared with MSI1); prompt-assembly test |
| SRI6 | CATCH-ME runs only on verifiable maths steps with pL ≥ .7, B2+, ≤ 1 per session, and is resolved within 2 turns; never on health, safety or world facts | Director predicate test + log audit |
| SRI7 | CHECK output never contains the final answer or the corrected step | code-level leak check (= MSI5, LS rule 15) |
| SRI8 | Every help event carries `initiator`, `eligible`, `supportLevel`, `promptLevel`, `rung` | schema test |
| SRI9 | A release that trips any §5.6 row does not ship | `verify-release --sim` |

---

## 10. Open questions
1. **Fading across personas and devices.** Should `vy_fade_state` be keyed by child only, as the learning store is (RO §3), so a persona switch does not reset independence? Proposed: yes. Fade state is learning, not relationship.
2. **The parent beside a B1 child.** A parent who answers *for* the child lowers `preHelpResid` and inflates solo success. Should a "parent present" flag (MS open question 3) void solo rounds? [U]
3. **The cultural reading of WAIT.** Will a silent adult-like voice read as disapproval to Indian children used to rapid IRF and cued slots (ID)? The non-content backchannel design needs a test (SR-M5).
4. **CATCH-ME versus never-deny-being-an-AI honesty.** A planted slip is a benign deception. Is the app-voiced notice ("the teacher sometimes slips on purpose to see if you catch it") enough for 8-year-olds? (SR-M7)
5. **When should F0 OWN be allowed to stick?** Should mastered skills stay at F0 for good, with only DRS checks, or periodically probe back up to F2 to catch silent forgetting? KT's forgetting model may already decide this.
6. **Does independence transfer across subjects?** The SRL literature says metacognition becomes more general by 12-15 (MS §3.6). Should P-levels be shared across domains in B4 but domain-specific in B1-B2?
7. **What do we do when a child moves to an outside answer engine** (photo-solver use visible in homework, e.g. a perfect answer with no working)? There is no in-app signal. Should the homework lane's solo-twin gap be the only proxy?

---

## 11. Proposed `context/` entries (for `context/inbox/`)
- **decision** SR-D1..SR-D17, each with its reversal condition from §0. The most load-bearing:
  - `solo-round-is-the-dependency-instrument` (SR-D1)
  - `code-owns-silence` (SR-D2)
  - `need-adjusted-cri-not-raw-hints` (SR-D7)
  - `toh-release-gate` (SR-D9)
  - `calibration-training-process-not-bets` (SR-D11)
- **measurement** `dependency-sim-2026-10-02`. n = 3,000 simulated children; method `learner/metacognition-srl-depsim.py`, seed 7.
  - raw help rate r(·, θ) = −.47 at 4 weeks, with 58% of flags in the lowest-ability quartile
  - CRI r(·, θ) = −.06, test-retest .88 at 4 weeks
  - ability-conditioned transfer residual test-retest .14 at 48 solo rounds and .38 at 192
  - fleet A/B needs ~316 children per arm for a 0.5× gain policy and ~1,374 for 0.8×
  - generative assumptions [U].
- **measurement** (external) `bastani-2025-mechanism`:
  - GPT Base correct 51% (logical errors 42%, arithmetic 8%)
  - superficial first interactions in session 1: Base 67%, Tutor 37%
  - perceived learning mismatched actual in both arms
  - the correction notice is affiliation-only [V-full].
- **measurement** (external) `metaclass-2026-no-intervention`: gold silence 41.7%, predicted 4.2%; best model accuracy 43.2%; 8-10× over-intervention [V-full; LLM-simulated learners].
- **rejected**:
  - `raw-hint-count-as-dependency`: ability-confounded (computed)
  - `llm-decides-when-to-speak`: compulsive intervention bias (MetaCLASS)
  - `per-child-transfer-gap-in-weeks`: unreliable below ~200 solo rounds (computed)
  - `bet-scoring-calibration-drills`: raised overconfidence (Huff & Nietfeld 2009)
  - `permanent-srl-prompts`: no added effect, reliance not learning (Gentner 2024; Darvishi 2024)
  - `productive-failure-for-grades-2-5-new-concepts`: effect reversed (Sinha & Kapur 2021)
  - `study-mode-toggle`: a guardrail the child can switch off is not a guardrail (Bastani's Base arm *is* the toggle-off condition) [inference].

---

## 12. References

**Children, trust and help.** Haber AS et al. 2026, *Behav Sci* 16:661, doi:10.3390/bs16050661 [V] · Vollmer AL, Read R, Trippas D, Belpaeme T 2018, *Sci Robot*, doi:10.1126/scirobotics.aat7111 [V] · Brink KA, Wellman HM 2020, *Dev Psychol*, doi:10.1037/dev0000884 [V] · Graham S, Barker GP 1990, *J Educ Psychol*, ERIC EJ442289 [V] · Barker GP, Graham S 1987, ERIC EJ348468 [V] · Pomerantz EM, Eaton MM 2000, *Merrill-Palmer Q*, ERIC EJ606985 [V]; 2001, *Dev Psychol*, ERIC EJ628460 [V] · Puustinen M et al. 2009; Roll I et al. 2014; Marchand & Skinner 2007; Ryan & Shim 2012 [V, sib: MS]

**Scaffolding, fading and prompting.** van de Pol J, Volman M, Beishuizen J 2010, *Educ Psychol Rev*, ERIC EJ924182 [V]; 2011, ERIC EJ906376 [V] · van de Pol J, Volman M, Oort F 2015, *Instr Sci*, ERIC EJ1071539 [V] · Wood H, Wood D 1999, *Comput Educ*, ERIC EJ608445 [V] · Wood D 2003, ERIC EJ966143 [V] · Hedin LR, Gaffney JS 2013, *Read Psychol*, ERIC EJ1004759 [V] · Salden RJCM, Aleven V, Schwonke R et al. 2010, *Instr Sci*, ERIC EJ880294 [V] · Salden, Koedinger & Renkl 2010, ERIC EJ906658 [V] · Atkinson RK, Renkl A, Merrill MM 2003, *J Educ Psychol*, ERIC EJ678596 [V] · Renkl A, Atkinson RK, Grosse CS 2004, ERIC EJ732331 [V] · Kalyuga S, Sweller J 2005, *ETR&D*, ERIC EJ732688 [V] · Miller-Cotto D, Medrano J 2026, *Br J Educ Psychol*, ERIC EJ1496086 [V] · Gidalevich S, Kramarski B 2019, *Instr Sci*, ERIC EJ1204598 [V] · Guo L 2022, *J Comput Assist Learn*, ERIC EJ1333210 [V] · Gentner NM, Respondek L, Seufert T 2024, *Instr Sci*, ERIC EJ1447855 [V] · Engelmann K, Bannert M, Melzner N 2021, ERIC EJ1285658 [V] · Meichenbaum DH, Goodman J 1971, *J Abnorm Psychol*, doi:10.1037/h0030773 [V; details ERIC ED073834] · Schunk DH, Rice JM 1983, ERIC ED233816 [V]; 1993, *J Spec Educ*, ERIC EJ472747 [V] · Schunk DH, Hanson AR 1985, ERIC ED254397 [V] · Schunk DH et al. 1987, *J Educ Psychol*, ERIC EJ348467 [V] · Gorgan EM, Kodak T 2019, *JABA*, ERIC EJ1232342 [V] · Walker G 2008, *J Autism Dev Disord*, ERIC EJ783919 [V] · Brown A, Cariveau T 2024, *J Behav Educ*, ERIC EJ1418390 [V] · Cengher M, Kim JY, Fienup DM 2020, ERIC EJ1430877 [V] · Rowe MB 1986, *J Teach Educ*, ERIC EJ333700 [V] · Tobin K 1984, *JRST*, ERIC EJ308967 [V] · Tobin KG, Capie W 1980, ERIC ED196860 [V] · Webb S, Massey D, Goggans M 2019, *Read Teach*, ERIC EJ1220339 [V] · Pearson PD, Gallagher MC 1983 [S] · Collins A, Brown JS, Newman SE 1989 (cognitive apprenticeship) [S] · Burns S 1985 (graduated prompts), ERIC ED313112 [V] · Caffrey E, Fuchs D, Fuchs LS 2008, ERIC EJ796864 [V]

**What can be taught; calibration.** Quigley A, Muijs D, Stringer E 2018 (EEF), ERIC ED612285 [V] · Muijs D, Bokhove C 2020, ERIC ED612286 [V] · Rosenshine B, Meister C 1993, ERIC ED356456 [V]; 1994, *RER*, ERIC EJ500529 [V] · Graham S, McKeown D, Kiuhara S 2012, *J Educ Psychol*, ERIC EJ994038 [V] · Sun T, Wang C, Wang Y 2022, ERIC EJ1353571 [V] · Duckworth AL, Grant H, Loew B 2011, *Educ Psychol*, ERIC EJ911106 [V] · Sinha T, Kapur M 2021, *RER*, ERIC EJ1308129 [V] · Kapur M 2011, ERIC EJ928190 [V] · McLaren BM, Adams DM, Mayer RE 2015, *IJAIED*, ERIC EJ1078813 [V] · Chase CC et al. 2009, ERIC EJ855299 [V] · Silvervarg A, Wolf R, Blair KP 2021, *JRTE*, ERIC EJ1289181 [V] · Huff JD, Nietfeld JL 2009, *Metacogn Learn*, ERIC EJ847526 [V] · Nietfeld JL, Cao L, Osborne JW 2005, ERIC EJ726373 [V] · Nietfeld JL, Schraw G 2002, ERIC EJ648182 [V] · Gutierrez AP, Schraw G 2015, ERIC EJ1060472 [V] · LeCount J, Fox PW 1992, ERIC ED346121 [V] · van Loon MH, de Bruin ABH, van Gog T 2013, *Learn Instr*, ERIC EJ1002053 [V] · Dentakos S, Saoud W, Ackerman R 2019, ERIC EJ1236442 [V] · Hattie J 2013, ERIC EJ1002061 [V] · Koriat & Bjork 2006; Metcalfe & Finn 2013; Bayard et al. 2021; Fyfe et al. 2022; Lipko et al. 2009; Kolloff et al. 2025 [V, sib: MS]

---

## Review

**Reviewer:** skeptical pass (learning science + engineering), 2026-10-02. **Limits of this review:** I read the whole file and the code in it. I did not re-fetch the cited papers or re-run `metacognition-srl-depsim.py`. Several sources are dated 2026 (Haber, Feng, MetaCLASS, Fan/Li/Zhang) and are only as good as this file's [V-full] claims, so the spot-check in R1 is a precondition for shipping, not optional. Corrections are numbered R1..R30 and ordered by severity within each group.

### A. Unsafe or legally risky (fix before anything ships)

- **R1. Evidence base is adult/teen, English, text, and mostly simulated.** Bastani is grades 9-11. Darvishi, Lehmann, Stadler and Chen are university students. MetaCLASS's 4.2% vs 41.7% silence figure comes from LLM-simulated learners in text. Nothing is on children aged 6-12 with a voice tutor. Downgrade every SR-D rationale resting on these to "[S] extrapolation" and add a column "population match: none / adjacent / direct". The §0 table currently reads as if the bands were evidence-backed. Before relying on any [V-full] claim, spot-check three load-bearing numbers against the primary text: Bastani 51% / 67% vs 37%, MetaCLASS 41.7% / 4.2%, Haber N = 310.
- **R2. DPDP §9(3) is under-treated.** §6 says "noted, not solved". §9(3) bars tracking or behavioural monitoring of children (and targeted advertising). A persistent per-child CRI, ranked against a fleet percentile and stored by `child_id` and date, is behavioural monitoring in the plain reading. The Rules' exemption for educational institutions [S, not verified this session; confirm against the notified Rules] may not cover a private edtech app. "Compliance is deprioritised" does not cover this, because it is a prohibition on the data design, not a paperwork item. Corrections:
  - Default `cri_persist=false` (fail closed) until counsel signs off. Compute CRI only as session-scoped adaptation state, not a stored profile.
  - Drop `vy_dep_window` rows to aggregates after N days. Add `retention_days` and a deletion test.
  - Persisted fade state (`vy_fade_state`, `vy_prompt_fade`) is learning state and is likelier to be defensible. Keep it, but record the purpose limitation in the migration comment.
  - No parent-visible inference such as "overlay on" (see R9).
  - Add an invariant SRI10: CRI/TOH data never feeds engagement ranking, notifications, upsell or any third party.
- **R3. Invariants SRI1/SRI2 override the child-safety floor.** "No content utterance in a solo round" and "no content LLM call in an unexpired eligible window" have no exception. If a child says something that trips the safeguarding or crisis predicate (distress, abuse disclosure, "mujhe nahi karna"), silence is a harm, and the project's own law is that the helplines and the safeguarding hand-off are product. Add: the safety predicate preempts SRI1/SRI2/WAIT. Add an eval: the crisis battery run inside a solo round must still pass.
- **R4. `selectMove` ignores an explicit help request during a solo round.** Its first line returns WAIT whenever `st.solo && !st.committed`, even if `st.childRequest` is set. A 7-year-old who says "help" gets silence. Fix: an explicit request ends the solo round, which is logged as assisted (a C1-equivalent for the independence stats, never a penalty), and the move is KIND-OF-HELP or HINT. Add a property test: any child request is answered within one turn.
- **R5. Silence on a voice channel is not like classroom wait time.** Tobin's 3-5 s is face-to-face with visible teacher presence. `waitMs` grows to 2.5x base: B1 reaches 15 s of audio silence. On a call this reads as a dropped line, a frozen app or disapproval (open question 3 admits this). Corrections:
  - Cap wait at about 8 s for B1-B2 and 6 s for B3-B4 [U].
  - Keep a non-verbal presence signal alive (avatar listening state), and treat a mic-level/ASR-silent child differently from a network gap.
  - Distinguish silence from disconnect by heartbeat. A dropped connection must never accumulate as `waitRescue`.
  - Children with slower processing, ADHD, dyslexia or L2-heavy Hinglish are penalised by a uniform base. Make the base per-child adaptable by observed response latency and allow a caregiver setting.
- **R6. CATCH-ME (planted tutor slips) is deception of a minor by a persona that must never deny being an AI.** The evidence cited shows children over-trust voice agents. It does not show that planted errors calibrate trust, and the file's own LS note says novices adopt planted errors. Even at pL ≥ .7 and "resolved within 2 turns", misinformation can persist. Correction: ship OFF, gated on SR-M7. Add a non-deceptive substitute that needs no ethics gate: the tutor expresses real uncertainty, or asks the child to verify a claim by a method. Open question 4 should be a blocking decision, not an open question.
- **R7. SR-M4/M5/M2 are experiments on children that withhold or delay help, with no safeguards.** Add: a floor (no arm may reduce support below W-ladder completion, i.e. the answer assertion at the end of the ladder is always reachable), stopping rules on frustration/disengagement markers, parent-consent text covering experimentation, and a pre-registered sample size. Without this, SR-M5 (longer silence in one arm) is the riskiest arm in the plan.
- **R8. TRY-FIRST / KIND-OF-HELP can loop on a child who keeps saying "bata do".** There is no terminal state in the move selector. Define: after two declined offers, or any distress marker, go up the W ladder; cap total refusals per item. Homework-deadline and exam-window children (EXAM-TWIN) especially will hit this. Withholding the answer from a stressed child is the most likely real-world churn and harm path.
- **R9. The parent and child-facing surfaces contradict the stated principle.** "Never a label, never a number" is broken in three places:
  - the parent row "solved a of n apne-aap rounds" is a dependency score under another name, in a market with strong parental pressure on marks. Children can be punished for failing solo rounds;
  - the stepping-back row leaks internal levels ("F ≤ 2 vs ≥ 3");
  - the overlay message ("more try-it-yourself rounds in {domain}") is a CRI flag disclosed to the parent, and the STANDARD view shows B3 children (10-12) their alone-vs-with-help counts, which is the dependency metric itself. Evidence for this view (Lipko 2009) is a lab memory study, not a self-comparison dashboard for 10-12-year-olds.
  Correction: parent surfaces show topic-level capability ("can now do X unaided") only, never a rate or a count of solo outcomes. STANDARD becomes opt-in for B4 only, B3 removed, and requires SR-M2 evidence on efficacy. Remove CRI overlay text from the parent card entirely.
- **R10. The "streak of rounds tried" for B1-B3 is a gamified retention loop.** Streaks can compel use and anxiety. Reinforce the behaviour without a counter, or make it non-loss-bearing (no streak break). The Taxila business incentive (session length) conflicts with fading. Add a governance rule: independence metrics outrank engagement in release decisions, and the fade ladder is not tuned against session-time KPIs.

### B. Rules that lack the evidence claimed

- **R11. SR-D1: an immediate isomorphic twin is not Bastani's exam.** Bastani's exam was closed-book after the session. A twin minutes after a hinted item measures short-term near transfer, helped by working memory and pattern-copying. Correction: solo rounds must include a delayed twin (next day or later, from LOT), and the dependency instrument should use only delayed items. The immediate twin is a within-session mastery check and must be labelled as such. Also, the claim that practice would "have reported a win" assumes the tutor is Bastani's Base; Taxila's gated tutor did not show exam gain over control in that study, only parity. State that the bar "no worse than no-tutor" is low, and the trial needs a no-tutor/textbook arm to claim learning gain.
- **R12. Efficacy-safe solo selection (predicted p in [.6, .9]) biases the instrument.** Selecting on predicted success restricts range and removes exactly the hard items where dependence shows. Predicted p comes from KT fit on help-aided data. Declining is allowed, and the decliners are likely the dependent children (`soloAvoid` is research-only), so non-random missingness inflates solo success among the rest. Corrections: randomise a fraction of solo items across the difficulty range for measurement and keep the efficacy-safe items for pedagogy only. Treat `declined` as a censored outcome, not missing at random.
- **R13. `transferRes` and CRI use θ̂_c "from unaided first attempts only".** A dependent child makes few unaided attempts, so θ̂ is missing or biased exactly for the target group. The same applies to `ĥ(pL, band)`: pL is itself depressed or inflated by help-aided trajectories, so the "need adjustment" is circular. The sim (§5.4) reports r(·, θ) = -.06; verify that it injects measurement error into pL and θ̂ and that dependent agents reduce unaided attempts. If not, the headline confound removal is optimistic. Add that to the sim and report both.
- **R14. §5.4's validity numbers are by construction** (the file admits it) and so are not evidence for CRI. Remove the "CRI r(·, δ) = .9" column from the decision rationale for SR-D7. Keep only the confound result, and only after R13. State in the table header that the r(·, δ) column is a self-consistency check.
- **R15. Fleet-percentile flagging flags about 10% of children forever.** The `q90` threshold is relative, so CRI measures rank, not dependency. If a release makes the whole fleet more dependent, the flag rate does not change (this is why TOH is a separate gate, but the child-level overlay still trains on the shifted reference). The reference also contains the tutor's own over-help. Corrections: use an absolute, versioned reference frozen at a baseline release, report drift against it, and define the flag in terms of outcome-validated thresholds after SR-M3.
- **R16. `click` depends on dwell/reading time (τ_read), but Taxila is voice-first**, and B1-B2 are often not yet readers. Replace with a voice-native signal (interrupts the tutor's hint, asks the next hint within X ms of its end) or drop it until SR-M3. Its simulated validity (.88) is meaningless without that.
- **R17. Equal weights W = .25 on four features with different scales, skew and zero-inflation.** Median/MAD of a zero-inflated feature gives MAD = 0 for many children, so the `|| 1` fallback silently changes the scale. Add a quantile transform or logit scale, handle MAD = 0 explicitly, and test it.
- **R18. SR-D4 (cap hints at W2 when support ≥ F3) extrapolates a human-teacher interaction** (van de Pol 2015: frequency x contingency, ages 12-15). Applying it to F3 children (pL .3-.6) and 6-7-year-olds may prolong failure. Cap at W2 only for a second attempt, release on first sign of frustration (DA IMPASSE), and make B1 exempt until SR-M4 says otherwise.
- **R19. SR-D13 / D12 bands lean on single-effect-size studies** (Sinha & Kapur is a meta-analysis of mostly secondary/college math; the "reversal in grades 2-5" is a thin subgroup). Tag as [S], keep instruction-first as the default for all new concepts in B1-B3 (a conservative choice), and test problem-first only in B4.
- **R20. SR-D11 (process not bet calibration) rests on two small studies of grade 5** and adult work. It is a reasonable prior, but "rejected: bet-scoring drills" in §11 should read "unproven; not chosen" until SR-M6 runs. Entering a `rejected` entry from one study contradicts the repo's "tried and failed" meaning.
- **R21. `entryLevel` pL cut-points (.3 / .6 / .85) and `K_DOWN` are untested numbers** with no KT calibration for Indian classes 1-9. Mark as [U] in code comments and gate on KT's calibration curve (ECE) per skill.

### C. Unimplementable, buggy, or untestable

- **R22. Deadlock in the prompt fader.** `levelForOpportunity` probes only one level down, and a probe is countable only if `usedLevel <= 1`. At level 3 the probe uses level 2, which is not countable, and at level 2 only 1-in-5 opportunities probe. So P3 can never accumulate evidence to fade, and P2 does so only at 20% of opportunities. With `spont + missed >= 8` required and PLAN allowed at most once per session, fading a move takes dozens of sessions. Fix: make the evidence rule level-aware (count the least-prompted observation available, or allow a probe two levels down every N), raise the opportunity rate by pooling moves that share a skill family, and simulate sessions-to-fade.
- **R23. `nextSupport` counts C1 at F ≤ 2 as "independent"**, so a child fading from F2 while still needing hints is promoted, which contradicts SR-D5 ("fade on self-initiation, never on time"). Require C0 for any fade, or make C1 count half. Also: F5/F4 fade after 1-2 successes where the success is trivially watching or completing a prepared step; the `floor` ignores `probe`; `failStreak` is written but never read (no escalation to F5 or remediation after repeated C3/C4 except via `wheelSpin`). The in-code comment "help starts one rung below where the last success needed it" is not implemented in `nextRung`.
- **R24. `selfCheckedBeforeCommit` is undefined** and F0 depends on it. A child's silent check is unobservable by voice. If it is inferred from time, a child who waits is credited; if it is spoken, the child learns to say "checked". F0 may be unreachable or gamed. Define the observable (e.g. the work shows a substitution step, or an unprompted correction before commit) and validate against human coding on a sample.
- **R25. "Child performs the move unprompted" is not measurable for plan, check and self-talk in Hinglish ASR** without a coded gold set. SR-M8 covers only whispering. Add an annotation task: 200 turns per move with two raters, require kappa ≥ .7 and detector precision ≥ .8 per band before any fade decision uses it. Until then, P-levels fade by time-in-level with a conservative cap, and this must be stated.
- **R26. Enforcing code-owned silence with gpt-realtime-2.1 needs a concrete mechanism.** Realtime sessions auto-respond on voice activity. SR-D2/SRI2 require `create_response` disabled and every response created only on a server `response.create` for a selected move, plus handling of barge-in and tool-call timing. Add this to §3.4 and a trace test for "model spoke without a selected move". Also specify the clock: wait is measured from device-side TTS end, while SRI2 audits on the server. Network jitter will make the audit disagree unless device timestamps are logged (`WaitEvent` needs `ttsEndDeviceTs`).
- **R27. TOH gate thresholds (+3 pp tss, Telling@k > 0.5%, help-before-wait > 2%) have no noise estimate** and are set before SR-M9. They gate releases off LLM student simulators that are unvalidated against children, the same simulator type MetaCLASS flags. Before use, validate the simulator's Telling@k and WAIT behaviour against the 200 real sessions per band. Until then a TOH failure is a review trigger, not an automatic block, and a pass is not evidence of safety. Report confidence intervals, not point thresholds.
- **R28. SR-M1..M10 bars are not testable as written.** SR-M1 needs inter-rater agreement among the three experts and a baseline to beat before ".80 agreement" means anything. SR-M4's bar ("adaptive ≥ fixed") needs a margin, a primary endpoint and a power calculation; the sim's 316/arm uses an assumed SD of .19. SR-M6 asks for "non-inferior" without a margin. SR-M10's ≤ 1.3x chance on the lowest quartile will be hard to hit with n small in the tails. State primary endpoints, margins and sample sizes, and say which are DRS-7-powered (about 1,470 households per arm) versus solo-success-powered; most will be underpowered at launch volume.
- **R29. Identity within a session is unknown.** A parent or sibling answering for the child corrupts solo rounds, `preHelpResid` and every outcome metric. The file leaves it as open question 2. Make it a design item: a presence heuristic (speaker change/voice-activity diarisation if permissible under DPDP; otherwise a pre-round "just you?" prompt), and void or flag rounds with a second voice. Also: shared devices, so identity = authenticated child id (repo law) but not actor.
- **R30. Smaller issues.** (a) `criFlag` uses `history.slice(-2)` with ambiguous inclusion of the current week and `undefined` for new children. (b) `STEP-BACK` says "no announcement" but SR-D5 and the parent card expose the change. (c) Cold start: new children have no band reference, fade state or KT, so state the default (F by band, P3, no CRI). (d) Add a global kill switch and rollback for fading (feature flag per band). (e) Add a teacher/parent override to restore support for a child in exam week. (f) Time budget: 2-3 solo rounds plus twins per session need a session-length budget. (g) §11's `rejected` entries should be split into "evidence-backed" and "design choice not yet tested".

### D. What is missing

1. A decision on **delayed vs immediate independence measurement** (R11).
2. **Stakeholder-facing safety and ethics**: a child-safeguarding review before any experiment, and a documented DPDP position (R2, R7).
3. **Regional language and accessibility**: Hindi-only and regional-language children, children with learning differences, and low-bandwidth/silent-drop handling (R5).
4. **Governance**: an owner for independence metrics versus engagement metrics (R10).
5. **Reversal conditions with numbers** for SR-D6, SR-D8 and SR-D12; several currently read "SR-M# shows no gain" without a threshold.
6. A **no-tutor control** in at least one trial arm (R11).

### E. Verdict

Keep: SR-D1 (with a delayed instrument), SR-D2 (with the mechanism in R26 and the safety override in R3), SR-D7 (once R13 is tested), SR-D9 (as a review gate first), SR-D15, SR-D16, SR-D17. Hold until evidence or ethics: SR-D14 (CATCH-ME), STANDARD for B3, any parent-visible solo rate, persistent CRI, progressive wait beyond the R5 caps. Rewrite: §3.3 (deadlock), §3.2 `nextSupport` (R23), §3.5 selection (R12), `selectMove` (R4, R8).
