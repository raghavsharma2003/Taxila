# STAGECRAFT Study B: speculative and anticipatory execution applied to content

2026-10-05 · research workstream (Study B) · status: **research input for the Stagecraft design**. No existing file was
edited. This study makes no product or code change and ran no live builds ($0 Azure spend).

**Owner ask this serves.** OWNER-RESET item 17 (2026-10-05): *"on the go content build and showcased without fail; in
the content creation we need similar to the duplex architecture where in parallel we are building various content
while the convo is going on and how it changes, and then accordingly showing the student the right one."* Also items 3
and 4 (real-time games, cinematic animation), 9 (zero visible failure), 12 (proper diagrams) and 14 (frequent adaptive
generation).

**Question.** What do other fields already know about four things?
- doing work before you know you need it;
- keeping several guesses alive at once;
- choosing which guess to show, and when;
- what generated visuals actually do to learning, and how they go wrong?

The output is a list of mechanisms that have measured results and that Taxila's speculative Studio ("Stagecraft") can
adopt. Each one is mapped to the existing code.

**Labels.**

| label | meaning |
|---|---|
| [P] | paper: the abstract or HTML was read this session; the numbers are quoted from it |
| [P-sec] | the number comes from a secondary summary of the paper (a search-result digest); re-check before citing in a decision |
| [V] | vendor or practitioner case study |
| [K] | well-known result taken from background knowledge and not re-opened this session; the number is approximate, so treat it as a lead |
| [T] | from another Taxila file (path given) |
| [E] | estimate made here |

No [M] rows: this study measured nothing new. Every Taxila-facing number below is [T] or [E].

---

## 0. The answer on one page

1. **Speculation is safe only when it is lossless, and it pays only through breadth.** Speculative decoding
   (Leviathan et al. 2023; Chen et al. 2023) [K] and Speculative Actions (2025) [P] share one shape:
   - a cheap drafter guesses;
   - an authoritative check decides;
   - a wrong guess is thrown away, and the output is the same as if no one had guessed.

   For agents, top-1 next-action accuracy is low, but **top-3 roughly doubles it**: HotpotQA ≈ 20% → 46%, chess 54.7%
   with 3 branches. End-to-end latency fell by ≤ 20%; the single-step ceiling is 50% [P].

   **For Stagecraft:**
   - keep about 3 candidate pieces per live intent family, plus one always-ready safe default;
   - a candidate may reach the stage only if the authoritative check passes at the turn boundary. That check is the
     kernel's choice + `validateSpec` + the stage contract.
   - Speculation must change *when* a piece is ready. It must never change *which* piece the policy would pick
     (§3.1, SC-1).
2. **Guess the intent, not the value.** In Taxila's own M-B1 measurement, grading from a partial was wrong 38-45% of
   the time. The answer value is the last thing a child says, so an oracle saves a median of 0 words
   [T: `docs/research/duplex/MODELS-PAPERS.md` §6]. Streaming intent is a different matter: it stabilises early, with
   73.9% of CRAG questions "streamable" [P], and SLU systems spot intents early in >30-68% of utterances [P-sec].
   - **Late binding.** Build the *shape* during the turn: archetype, layout, strings, misconception target. Bind the
     child's actual numbers at commit. The engines already recompute every truth from the kit, so binding late costs
     about 0 ms (SC-4).
3. **Spend in tiers, the way the web's Speculation Rules do.** Chrome ties eagerness to cost: prefetch freely, prerender
   only on strong signals, and cap concurrent prerenders [V/K]. Prerendered navigations reach LCP an order of magnitude
   faster [V].

   Map Taxila's cost ladder onto eagerness:

   | tier | cost [T] | when to start it |
   |---|---|---|
   | spec JSON | ≈ 3 s, < $0.001 | eagerly, on a weak signal |
   | flare-low image | ≈ 15 s, $0.0066 | once the intent has stabilised |
   | live code build | 34-54 s, $0.05-0.23 | only from the beat plan's ≥ 90 s lookahead, never from a partial |

   (SC-3)
4. **Showing is an expected-utility decision, and agents overact.**
   - **Horvitz's mixed-initiative rule [K]:** act when P(need) clears a threshold set by the asymmetric costs of a
     wrong show versus a missed show. Between "act" and "don't", there is an "offer" band.
   - **Current proactive-agent benchmarks:** LLMs "frequently trigger proactive actions when no intervention is
     required" (ProEvent) [P-sec].
   - **For Stagecraft:** the reveal decision stays in code, with an asymmetric threshold. The default is *don't
     switch*. A child's request sets P(need) = 1. A middle band makes the teacher offer ("dikhaun?") instead of
     swapping the stage (SC-5).
5. **Timing and focus matter more than polish.** Mayer's medians [P-sec]:

   | principle | experiments supporting it | median effect size |
   |---|---|---|
   | temporal contiguity | 9/9 | d = 1.22 |
   | coherence | 23/23 | d = 0.86 |
   | signalling | 24/28 | d = 0.41 |

   Seductive details cost about g = −0.12 to −0.33 [P-sec].
   - **For Stagecraft:** reveal a piece *together with* the teacher's sentence that refers to it, never "when it
     finished building". Highlight what she names. Never show a fun but off-target piece just because it was ready.
     Taxila already measured that last failure: `rj-studio-fraction-mention-as-topic` put a pizza game into a litres
     lesson, 6/23 [T] (SC-6, SC-7).
6. **The right piece depends on the learner and on the child's age.** The candidate set must be conditioned on learner
   state, not only on topic.
   - **Animations:** they beat static pictures mostly for procedural content (Höffler & Leutner 2007: d ≈ 1.06
     procedural vs ≈ 0.40 representational) [K].
   - **Worked examples:** they help novices and stop helping as expertise grows (the expertise-reversal effect) [K].
   - **Productive failure (problem first):** it helps conceptual transfer overall (d = 0.36; 0.58 at high fidelity)
     but **reverses for grades 2-5**, where instruction first wins [P-sec].
   - **For Stagecraft:**
     - Classes 1-5 get worked examples or demonstrations first.
     - Classes 6-9 may get an explore-first candidate.
     - The game candidate is raised only after untimed accuracy is shown (SC-8).
7. **Schedule by value of information under a budget.**
   - **Rational metareasoning (Russell & Wefald) [K]:** compute only while the expected gain beats the cost.
   - **Web prefetching (Padmanabhan & Mogul 1996, ≈ 45% latency cut for ≈ 60% more traffic) [K]:** waste is the
     price of latency, so it has to be budgeted explicitly.
   - **Formula:** score = P(needed at the next boundary) × learning value × P(ready in time) × freshness − cost. Fill
     a per-turn knapsack with hard caps, as `PREPARE_CAPS` already does for reply drafts (SC-9).
8. **Bandits choose archetypes across children, not inside a turn.**
   - ZPDES (400 children aged 7-8) used learning progress as the bandit reward, and children reached the hardest
     exercises sooner [P-sec].
   - Bandits used to run educational experiments bias their estimates and inflate false positives (Rafferty et al.
     2019) [K]. Keep a uniform exploration floor.
   - The reward is host-graded evidence. It is never engagement or time-on-piece, because that would reward seductive
     details.
   - The per-turn choice stays a code policy (`llm-beat-proposer-live` [T]) (SC-10).
9. **Freshness comes from the premise, not from a clock.**
   - **Cho & Garcia-Molina [K]:** pages that change faster than you can refresh them are best not refreshed at all.
   - **For Stagecraft:**
     - Every candidate carries a premise key: lesson, item, beat, misconception id, hint level, learner band.
     - Any change to the key kills the candidate.
     - Intents that churn faster than their build time are not built at that tier.
     - A loser that passed the gate goes to the library instead of the bin (LIVE-STUDIO D5) (SC-11).
10. **Generated educational visuals fail quietly and convincingly, and the harm is real.**
    - **What models get wrong:** MLLMs draw gravity the wrong way and miss the open circle on a number line
      [P-sec].
    - **Feedback errors:** ChatGPT's maths feedback was wrong on 32% of problems, and erroneous feedback raised
      learners' confusion [P-sec].
    - **Video:** Veo3 scored 2.5 versus 86.0 for agentic Manim on TeachQuiz [T: `generated-media-carries-facts`].
    - **Judges:** LLMs cannot spot maths errors even with the solution in hand [P-sec].
    - **What Taxila already has right:**
      - truth comes from the kit;
      - images are art, never facts;
      - no model grades;
      - a safety turn quarantines every speculative artefact.
    - **What Stagecraft adds:** the last law must cover the *pool*. A safety turn drops every candidate, in flight or
      ready. Nothing is revealed until the safeguard has finished (SC-13).

**What this means for the design, in one line:** run a small pool of speculative, premise-keyed, late-bound candidates
across cost tiers. A code VOI scheduler starts them. A lossless commit rule picks among them at the turn boundary. The
reveal is fused to the teacher's next sentence. The stage contract, the validators and the safety quarantine sit in
front of everything. Bandits learn the priors across children.

---

## 1. Method and scope

- **Sources.** Web searches and reads this session (2026-10-05) for 2025-2026 work on speculative agents, proactive
  agents, streaming intent, generated maths visuals, LLM error rates in tutoring and the multimedia meta-analyses.
  Classic results (speculative decoding, Horvitz, Mayer, Cho & Garcia-Molina, Padmanabhan & Mogul, VanLehn, Höffler &
  Leutner) are from background knowledge and are marked [K].
- **Repo context read:**
  - `docs/research/duplex/{ARCHITECTURE.md, PLAN.md, MODELS-PAPERS.md}`;
  - `server/duplex/{triage,buildIntent,speculator}.js`;
  - `docs/design/superhuman/LIVE-STUDIO.md` §0/§7/§14;
  - `docs/design/reset/STUDIO-V2.md` §0/§7-9/§14;
  - `docs/design/reset/DESIGN-V3.md` §6 (stage contract);
  - `docs/design/signals/SIGNALS-SPEC.md` (outline);
  - `docs/research/models/MODEL-ROUTER.md` §0;
  - `shared/studio-spec.ts`;
  - the relevant `context/rejected.md` entries.
- **Out of scope.** Product teardowns (Tavus, Griffin and other avatar or tutor products) belong to the product study.
  Architecture and code belong to the Stagecraft design docs; this file only supplies their evidence.
- **Limits.**
  - Several 2025-2026 numbers come from abstracts or secondary digests ([P-sec]).
  - Mayer's effect sizes are lab medians, mostly from adults in short sessions. A 2025 meta-analysis (*Educational
    Research Review*, "searching for boundary conditions") exists and should be read before any principle is
    quantified for classes 1-9.
  - No result here was measured on Indian children or in Hinglish.

---

## 2. The literature, family by family

Each entry gives the mechanism, the measured result and what transfers. "Transfer" points at Taxila code or docs.

### 2.1 Speculative decoding and speculative execution (the lossless template)

- **Speculative decoding** (Leviathan, Kalman, Matias 2023; Chen et al., DeepMind 2023) [K].
  - **Mechanism:** a small model drafts γ tokens; the large model verifies them in one parallel pass; a rejection
    sampling rule keeps the output distribution *identical*.
  - **Result:** about 2-3× speed-up on T5-XXL and Chinchilla-70B. The speed-up is governed by the acceptance rate α,
    and widening the tree (Medusa, EAGLE) raises the effective α.
  - **Transfer:** the value of speculation is α × (time saved per hit) − (cost per miss). Stagecraft needs its own α:
    the **candidate hit rate** at the turn boundary. The verifier must be authoritative and cheap, and Taxila has one
    in code: `validateSpec` + engine truth recomputation + the stage contract, all measured at microseconds
    [T: STUDIO-V2 §8].
- **Speculative Actions: a lossless framework for faster agentic systems** (arXiv 2510.04371, Oct 2025) [P].
  - **Mechanism:** faster models predict the agent's next API calls and execute them in parallel; a prediction is
    committed only when it matches the authoritative action.
  - **Results:**

    | domain | result |
    |---|---|
    | chess | 54.7% accuracy with 3 branches; 19.5% time saved |
    | e-commerce API prediction | 22-38%, better with a multi-model ensemble than with a larger k from one model |
    | HotpotQA | top-1 ≈ 20% → top-3 ≈ 46% |
    | end to end | up to 20% latency reduction; the single-step breadth ceiling is 50% |
    | lossy extension (OS tuning, last-write-wins) | both cost and latency fell |
  - **Transfer:**
    1. **k ≈ 3 is the knee**: going from top-1 to top-3 doubles hits.
    2. **Diversity beats more samples**: a multi-model ensemble did better than a larger k. For Stagecraft, the 3
       candidates should be *different archetypes or modalities* (an animation, a game, the board) rather than 3 specs
       of one archetype.
    3. The theorem's cost term grows with the number of *distinct* guesses, so dedupe candidates by premise key
       (`BuildIntents.seen` already does this per turn [T]).
- **Speculate with Memory** (arXiv 2607.12236, Jul 2026) [P].
  - **Mechanism:** the speculator keeps three online memories built from past trajectories: a contrastive transition
    table, episodic retrieval and a confusion tracker that suppresses repeated mispredictions.
  - **Result:** 19-39% relative gain in action-prediction accuracy over a stateless speculator; up to 2.5× on
    observation prediction where actions repeat; gains grow as the memory fills; still lossless.
  - **Transfer:** lesson arcs are highly repetitive across children (same kit, same beats, same misconception ids).
    A *transition table* (beat × misconception × band → which piece was actually revealed and graded useful) is cheap,
    code-only and should be the first prior (SC-12). The confusion tracker maps to "never re-speculate an archetype
    that missed on this premise twice in this lesson".
- **PASTE / "Act While Thinking"** (arXiv 2603.18897, 2026) [P].
  - **Mechanism:** tool calls are predicted from recurring patterns and run *while the LLM is still generating*.
    Speculative results stay isolated until confirmed, and the scheduler co-plans tool and LLM work so the bottleneck
    does not just move.
  - **Result:** 43.5% shorter task completion and 1.8× lower observed tool latency on deep-research, coding and
    science agents.
  - **Transfer:** isolate first, then commit. Speculative artefacts live in a quarantine namespace (not
    `RevealQueue`) until committed. Schedule them jointly with the voice lane so speculation never steals capacity from
    the reply path. That matters because Foundry deployments are capacity-limited [T: MODEL-ROUTER; FLUX capacity 1
    rejected 2 of 4 calls at 3-way concurrency, LIVE-STUDIO §14.7].
- **Related 2026 work, not read in full:** AOSpec (action and observation co-speculation, 2608.00881) and SpecHop
  (continuous speculation for multi-hop retrieval, 2605.21965). Both report that speculation keeps paying when it is
  re-issued as the input evolves. That is the duplex case.

### 2.2 Prefetching and predictive pre-rendering (web, CDN, mobile, games)

- **Speculation Rules API (Chrome)** [V/K].
  - **Mechanism:** a page declares prefetch or prerender candidates with an *eagerness* level:
    - `immediate` / `eager`: as soon as the rule is seen;
    - `moderate`: on hover for about 200 ms;
    - `conservative`: on pointer-down.
  - **Caps [K]:** Chrome caps concurrent speculations per tier (roughly 50 immediate prefetches, about 10 immediate
    prerenders, and 2 FIFO for moderate and conservative). Prerender is an order of magnitude dearer than prefetch.
  - **Results [V]:**

    | site | result |
    |---|---|
    | Ray-Ban PLP | mobile LCP 4.69 s → 2.66 s with moderate prerender |
    | Monrif | −17.9% LCP, +8.9% engagement in some segments |
    | Google Search | −67 ms LCP on Android |
    | Shopify (conservative prefetch, platform-wide) | −130 to 180 ms |
    | Cloudflare Speed Brain | −45% LCP where a prefetch succeeded |

    A practitioner aggregate reports p75 LCP of 320 ms for prerendered navigations versus 1,800 ms for normal ones
    [V, secondary].
  - **Transfer:** **eagerness is a function of cost.**
    - Cheap work is speculated broadly on weak signals.
    - Expensive work is speculated narrowly on strong signals.
    - Each tier has its own cap, and FIFO eviction applies to the low-confidence tiers.
    - "Prerender until script" (render the markup, defer the scripts) is the web's version of **late binding** (SC-4).
- **Classic web prefetching** (Padmanabhan & Mogul, SIGCOMM CCR 1996) [K].
  - **Mechanism:** a server-side dependency graph of "after A, B is fetched within w seconds with probability p";
    prefetch above a threshold.
  - **Result:** about 45% lower latency for about 60% more traffic. The threshold traces a latency-versus-waste curve.
  - **Transfer:** waste is the *price* of latency. Choose the threshold from a measured curve, not by taste. That is
    E-SC2 in §5.
- **Mobile app prefetching** [P-sec].
  - **Result:** practical predictors reach about 22% precision and about 47% recall (one study); a preference-based
    web prefetcher hit about 60%. Waste on metered mobile data is the binding cost.
  - **Transfer:** Taxila's children are on budget Android phones on metered data. Speculation stays **server-side**:
    specs and images are built on Azure, and only the chosen piece ships to the device (engines are already precached
    with the shell [T: STUDIO-V2 §9]). Never push speculative candidates to the phone.
- **CDN and edge caches: popularity-driven pre-warming** [K]. Pre-positioning the head of a Zipf-like popularity
  distribution gives most of the hit rate for little storage. Transfer: LIVE-STUDIO's offline pre-warm of every
  admissible identity (about $1.2k one-time) and the ≥ 90% library hit-rate target [T §7] are this mechanism.
  Stagecraft should speculate *live* only on the tail the library misses.
- **Games: client-side prediction, dead reckoning, speculative frames** [K].
  - Multiplayer games simulate the likely next state locally and reconcile with the authoritative server.
  - Outatime (Lee et al., MobiSys 2015) rendered speculative frames for the likely future inputs of cloud-game
    players. Its user studies report masking well over 100 ms of network latency [K: number not re-verified].
  - **Transfer:**
    1. **Reconcile, don't trust**: the server-authoritative state is the kit and the host grader.
    2. A speculative frame is shown only if the real input lands inside its predicted envelope. That matches "steering
       knobs" on a running engine ("harder", "slower", "again": instant parameter changes [T: STUDIO-V2 §7]). These
       need no speculation at all, because the engine *is* the predictor.

### 2.3 Anticipatory computing and intent prediction from partial input

- **Mixed-initiative interfaces** (Horvitz, CHI 1999; Lumière 1998; LookOut) [K].
  - **Mechanism:** infer P(goal | evidence). Act autonomously when P exceeds p\*. Offer, by dialogue, in a middle
    band. Do nothing below. p\* comes from the utilities: p\* = cost of a false action ÷ (cost of a false action +
    benefit of a correct one). Also: time the action to the user's attention (wait for a natural break).
  - **Transfer:** this is the formal basis for SC-5. For a child, the cost of a false action is high: a wrong piece
    steals attention, splits focus and turns the stage into a distractor. So p\* is high, and the "offer" band ("main
    tumhe dikhaun?") carries most of the proactive volume.
- **Interruption at breakpoints** (Adamczyk & Bailey CHI 2004; Iqbal & Bailey 2008) [K].
  - **Result:** interruptions at coarse task boundaries cost less resumption time and less annoyance than
    interruptions mid-task.
  - **Transfer:** the duplex `RevealQueue.drain()` reveals only at turn boundaries [T: `server/duplex/triage.js`], and
    DESIGN-V3's rule that nothing new enters while the child holds the floor already encodes this. Stagecraft keeps
    it: a ready candidate waits.
- **Streaming intent stabilisation.**
  - *When Does Streaming Tool Use Help?* (arXiv 2606.20113) [P]: a retrieval query issued during typing or speech
    converges on the right results before the input ends. **73.9% of CRAG (n = 1,371) is "streamable"** at realistic
    operating points. A model-agnostic bound H (input cadence × tool delay) gives the hideable fraction as a floor.
  - Streaming SLU (Potdar et al., IJCAI 2021; Shivakumar et al., SLT 2021) [P-sec]: intents are spotted before the
    utterance ends in more than 30% (single-intent) and 68% (multi-intent) of cases, with streaming accuracy of about
    98-99% on the benchmark sets.
  - **Taxila counter-evidence:**
    - M-B1: *values* commit wrong 38-45% of the time from prefixes, and the oracle saves 0 words
      [T: MODELS-PAPERS §6].
    - The duplex candidate-speculation hit rate for replies is 64/243 = 0.26 [T: ARCHITECTURE.md §4].
  - **Transfer:** intent (which topic, which misconception family, "show me" versus "tell me") stabilises early.
    Values and verdicts do not. Stagecraft keys speculation on intent and binds values late. The bound H gives an
    a-priori hideable fraction per tier:

    | tier | build time | hidden by a typical 3-10 s child explanation [E] |
    |---|---|---|
    | spec | ≈ 3 s | mostly |
    | flare image | ≈ 15 s | partly |
    | live code build | 34-54 s | never |
- **Delegation on knowledge boundaries** (SALMONN-duo, Realtime-Venus) [T: MODELS-PAPERS §5.9]. The front end learns
  *when to delegate*. Training aware of its knowledge boundary avoids unnecessary delegation. Transfer: code knows
  whether a library piece exists, so no model decides "build or not".

### 2.4 Proactive dialogue agents: when to show without being asked

- **Inner Thoughts** (Liu et al., arXiv 2501.00383, CHI 2025) [P].
  - **Mechanism:** a continuous covert train of thought runs in parallel with the conversation. Each thought gets an
    intrinsic-motivation score, and the agent speaks when the motivation is high and the moment fits.
  - **Result:** higher ratings than baselines on anthropomorphism, coherence, intelligence and turn-taking
    appropriateness. The numbers are in the full paper, not the abstract.
  - **Transfer:** the "thoughts" are the candidate pool. The "motivation score" is the VOI score. The "appropriate
    moment" is the turn boundary plus the beat.
- **ProactiveEval** (2508.20973; 22 LLMs × 328 environments), **ProEvent** (2607.17701), **ProactBench**
  (2605.09228) and **PASTABench** (2609.28197: whether / when / what, with an "Optimal Intervention Window") [P-sec].
  - **Consistent finding:** LLM agents **over-act**. They trigger proactive actions when none is needed and handle
    cancellation badly.
  - **Transfer:**
    1. Do not let a model decide to reveal. This is the same verdict Taxila reached in `llm-beat-proposer-live` [T].
    2. **Cancellation is a first-class path.** A candidate whose premise died must be retracted silently.
    3. PASTABench's Optimal Intervention Window is the right metric shape: was the piece revealed inside the window
       where it helps (from the end of the child's turn that raised the need to the end of the beat), not merely
       "was it revealed"?

### 2.5 Multimodal learning with generated visuals: what helps, what harms

**Mayer's principles** (Mayer 2009/2014/2020 medians [P-sec via the 2014 chapter]):

| principle | experiments supporting it | median d | Stagecraft rule |
|---|---|---|---|
| temporal contiguity: animation with narration, not one after the other | 9/9 | **1.22** | the reveal is fused to the teacher's referring sentence (SC-6). "Shown when ready, mentioned later" breaks it |
| coherence: drop extraneous material | 23/23 | **0.86** | one piece on stage; no decorative candidates; strings minimal (SC-7) |
| signalling: cue the organisation | 24/28 | 0.41 | the teacher's pointer and highlight cue at reveal (DESIGN-V3 cues) |
| spatial contiguity | [K] about 22/22, about 1.1 | — | labels anchored to their referent: G4 [T: LIVE-STUDIO §14.5, 4/10 to 4/13 passed builds failed anchoring] |
| modality: narration over on-screen text | [K] about 0.7-0.8 | — | the teacher speaks; the stage carries few words |
| segmenting, pre-training | [K] about 0.75-0.8 | — | explainer beats are segmented and child-paced |

- **Boundary conditions.** A 2025 meta-analysis of Mayer's own research (*Educational Research Review*, 2025) looked
  for boundary conditions across media types. Read it before citing these medians as product effects.
- **Seductive details.**
  - Rey 2012 [K]: about d = 0.30 on retention and 0.48 on transfer, against the detail.
  - Sundararajan & Adesope 2020 [P-sec]: small-to-moderate negative g over 68 effect sizes.
  - A 2025 multilevel meta-analysis [P-sec]: comprehension g = −0.19, recall −0.17, transfer −0.12.
  - A 2026 study on the *amount* of seductive detail exists (*Instructional Science*) [P-sec].
  - **Transfer:** an engaging but off-target candidate is negative value, not zero. The scorer's learning-value term
    must be signed (SC-7).
- **Animation versus static** (Höffler & Leutner 2007 [K]):
  - overall d ≈ 0.37;
  - representational animations d ≈ 0.40;
  - procedural-motor content d ≈ 1.06.

  Berney & Bétrancourt 2016 [K]: g ≈ 0.23 overall. **Transfer:** the animation candidate's prior is high for *process*
  ideas (moon phases, the water cycle, long division steps) and low for static facts. That is STUDIO-V2's "explain beat
  on a process or spatial idea → animation" rule [T §7], now with an effect-size reason.
- **Worked examples and expertise reversal.**
  - Sweller & Cooper 1985; Barbieri et al. 2023 meta-analysis in mathematics [K]: about g = 0.48.
  - Kalyuga 2007 [K]: the advantage shrinks or reverses as expertise grows.
  - **Transfer:**
    - For a child below the mastery threshold, raise the worked-example and explainer candidates.
    - For a child above it, raise practice and game candidates.
    - The signal is the learner model's mastery estimate, never an engagement proxy.
- **Productive failure** (Sinha & Kapur 2021, *Review of Educational Research*: 53 studies, 166 comparisons,
  more than 12k participants) [P-sec].
  - **Result:** problem solving before instruction beats instruction first on conceptual knowledge and transfer:
    d = 0.36 [0.20, 0.51]; 0.37-0.58 at high fidelity; about 0.87 after a publication-bias adjustment.
  - **But for grades 2-5 the effects favoured instruction first.**
  - **Transfer:** Taxila serves classes 1-9. Explore-first candidates (an open simulation before the explanation) are
    eligible in classes 6-9 only, unless a measurement in Taxila overturns this. For classes 1-5, a demonstration or
    worked example comes first and exploration after (SC-8).
- **Simulations and games.**
  - D'Angelo et al. 2014 (SRI) [K]: simulations improved STEM achievement by about g = 0.6 over no simulation.
  - Clark, Tanner-Smith & Killingsworth 2016 [K]: digital games about g = 0.33 over non-game conditions; games with
    augmented, scaffolded designs did better.
  - **Transfer:** games are a sound candidate type when they are scaffolded and carry graded items. Raw fun is not the
    goal (`in-game-success-as-mastery` [T]).
- **Generated maths diagrams.**
  - *From Text to Visuals* (arXiv 2503.07429) [P]: SVG as an intermediate representation for maths hint diagrams.
  - *Agentic workflows for maths visual aids* (2607.09839) [P]: VLM critique loops improve diagrams only
    "preliminarily", and weak spatial reasoning remains.
  - **Transfer:** Taxila's diagrams come from code (engines and the board), and models fill specs. That is consistent
    with the evidence: VLM critique is not a correctness gate (`generated-media-carries-facts`: the OCR gate read what
    it expected [T]).

### 2.6 Adaptive hypermedia and adaptive tutoring (what to show to whom)

- **Brusilovsky's taxonomy** (2001) [K]: adaptive *presentation* (what goes on the page) and adaptive *navigation
  support* (what comes next), each driven by a user model. ELM-ART and its successors showed adaptive navigation
  support helps novices most. **Transfer:** Stagecraft is adaptive presentation driven by the learner model, and the
  candidate scorer is its selection rule.
- **ITS effectiveness.**
  - VanLehn 2011 [K]: step-based tutoring d ≈ 0.76, near human tutoring (≈ 0.79); answer-based CAI ≈ 0.31.
  - Kulik & Fletcher 2016 [K]: median ES ≈ 0.66.
  - **Transfer:** granularity is what helps. A candidate that grades *steps* (engine items with host-graded answers)
    is worth more than a passive one, so the scorer's learning-value term should favour pieces that emit host-graded
    evidence (LIVE-STUDIO D12 [T]).

### 2.7 Value-of-information scheduling under budgets

- **Value of information** (Howard 1966) and **rational metareasoning** (Russell & Wefald 1991; Horvitz's flexible
  computation) [K].
  - **Mechanism:** a computation is worth doing only if its expected improvement in the eventual decision beats its
    cost (time, money, attention).
  - **Transfer:** each candidate build is a computation whose "decision improvement" is P(it is the one shown) × (its
    learning value − the value of the default that would show otherwise). That subtraction matters: when the
    archetype default is already good, speculating a variant is worth little.
- **Budgeted selection is a knapsack, not a sort.** Under a per-turn cap (`PREPARE_CAPS`: ≤ 3 generations, 300 ms
  debounce, ≥ 1 new word [T]) and a per-child spend cap (LIVE-STUDIO §7: ≤ 3 live builds per lesson, ≤ $0.60 per day,
  ≤ $8 per month [T]), greedy-by-ratio (score ÷ cost) is near-optimal when items are small relative to the budget [K].
  Spec calls are tiny, so ratio-greedy is fine for the spec tier. Live builds are lumpy, so take them from the beat plan
  only.
- **Waste accounting** (the prefetching literature).
  - **Report:** precision (candidates revealed ÷ candidates built), recall (boundaries needing a piece that had one
    ready ÷ all such boundaries), and waste in dollars.
  - **Starting targets [E]:**

    | tier | precision | recall |
    |---|---|---|
    | spec | ≥ 0.25 (k ≈ 3, about one in three used) | ≥ 0.7 (matches duplex D9's ≥ 70% ready-at-TRP target [T]) |
    | image | ≥ 0.5 | — |
    | live code build | ≥ 0.8 (every build reused at least once by the library) | — |

### 2.8 Bandits for choosing which candidate to build

- **ZPDES** (Clément, Roy, Oudeyer, Lopes, JEDM 2015) [P-sec].
  - **Mechanism:** a bandit over activity types, rewarded by *empirical learning progress*, restricted to a zone of
    proximal development.
  - **Result:** in a study with about 400 children aged 7-8 (number decomposition with money), students reached the
    hardest exercise types sooner than with an expert sequence.
  - **Transfer:** for the across-children prior (which archetype for this premise), use a learning-progress reward
    computed from host-graded evidence before and after the piece. The fraction-game and Landfall archetypes already
    emit graded items [T].
- **Bandits in educational experiments** (Liu et al. EDM 2014, on Treefrog Treasure; Williams et al. 2016 on MOOClets;
  Rafferty, Ying & Williams 2019) [K].
  - **Result:** Thompson sampling raises learner outcomes during an experiment, but it biases effect estimates and
    inflates false-positive rates.
  - **Transfer:**
    1. Keep a uniform exploration floor (for example 10-20% [E]) so the library's quality score stays estimable.
    2. Never use time-on-piece or taps as reward. Engagement rewards seductive details (§2.5).
    3. Run bandits **offline and across children** (nightly prior updates). Per-turn selection is code policy over
       those priors (`llm-beat-proposer-live` [T]).

### 2.9 Staleness and freshness

- **Web crawler refresh** (Cho & Garcia-Molina, TODS 2003) [K].
  - Uniform refresh beats refreshing in proportion to change rate for average freshness.
  - Elements that change too fast should get less effort, because you cannot keep them fresh anyway.
- **Age of information** (Kaul, Yates, Gruteser 2012; cache-update work by Bastopcu & Ulukus 2021) [P-sec/K].
  - Freshness is maximised at an *interior* update rate. Updating as fast as possible causes queueing and makes
    things staler.
- **Transfer:**
  1. **Premise-keyed invalidation instead of TTL.** The duplex speculator already keys drafts by
     `(lessonId, turnSeq, itemId, gen, textHash)` and promotes only on hash identity [T: `speculator.js`]. A content
     candidate's key is coarser and lasts longer: `(lessonId, itemId | topicId, beat, misconceptionId?, hintLevel,
     band, lang)`. Words do not invalidate a content candidate; a change of intent does.
  2. **Do not chase churn.** If an intent changes more than once per build time at a tier, stop speculating at that
     tier for the rest of the turn and stay with the cheaper tier.
  3. **Rate cap.** Re-launching on every partial makes things staler, not fresher. Keep the 300 ms debounce and the
     per-turn caps.
  4. **Library salvage.** A candidate that passed the gate but lost keeps its value as a library variant. This is
     LIVE-STUDIO D5 for live builds, and it applies to specs too: a validated spec keyed by structure is a reusable
     asset.

### 2.10 Safety of generated educational content

- **Error rates.**
  - ChatGPT's maths feedback was wrong on 32% of problems [P-sec].
  - Hallucination errors were found in 22% of cases and model calculation errors in 17% [P-sec].
  - In a controlled study, learners given 50-100% erroneous LLM feedback reported more confusion and lower perceived
    usefulness (EDM 2025) [P-sec].
- **Visual-specific failures.**
  - MLLMs mislabelled the direction of gravity and normal forces and drew a closed circle for a strict inequality
    [P-sec].
  - Polished visuals "give the impression of precision".
  - Taxila's own measurements [T: `generated-media-carries-facts`]:
    - gpt-image-2 placed Hindi leader lines on the wrong part 5/32 times;
    - 3/3 "closed circuits" showed an open switch;
    - Sora drew 3 + 3 = 6 under "3 + 4 = 7".
- **Judges cannot be graders.** *LLMs cannot spot math errors, even when allowed to peek into the solution* (arXiv
  2509.01395) [P-sec].
- **Transfer (all already law in Taxila; Stagecraft must not weaken any):**
  - truth only from verified kits;
  - images never carry facts;
  - labels drawn by code;
  - the host grades;
  - every artefact passes the stage contract and its validators before it is eligible;
  - **a safety turn quarantines the whole candidate pool, including ready and in-flight items, and blocks reveals
    until the safeguard flow ends.** The duplex `BuildIntents.onSafety()` already drops queued work for the turn [T].
    Stagecraft extends that to every tier and to items built in *earlier* turns that are waiting for a boundary.

---

## 3. Mechanisms for Stagecraft (each sourced, each testable)

Each mechanism lists its evidence, the Taxila mapping and how to test it.

### SC-1 Lossless commit

- **Rule.** A candidate may be revealed only if all of these hold at the turn boundary:
  1. its premise key equals the committed state's key;
  2. it passed `validateSpec` and the engine truth recomputation;
  3. it fits the stage contract (DESIGN-V3 §6);
  4. the kernel's code policy would have chosen this piece (or its archetype) with no speculation at all.

  Speculation changes readiness, never the choice.
- **Evidence:** speculative decoding; Speculative Actions; PASTE's isolation [§2.1].
- **Mapping:** the `RevealQueue` gains a commit check. The kernel stays the decider.
- **Test:** a shadow arm. Run the policy with speculation off and on over the same replayed lessons. Selected
  `(archetype, premise)` must be identical in 100% of boundaries; only time-to-ready may differ.

### SC-2 Breadth, about 3, diverse

- **Rule.** At most 3 live candidates per intent family per turn, chosen across *different* modalities or archetypes,
  plus the archetype default and the board, which are always ready.
- **Evidence:** top-1 → top-3 roughly doubles hits; an ensemble beats more samples from one model [§2.1].
- **Mapping:** the same limit as `PREPARE_CAPS.maxGenerationsPerTurn`, applied to specs.
- **Test:** E-SC1 measures hit@1, @2, @3 and @5 on replayed transcripts. Keep k at the knee.

### SC-3 Eagerness by tier

- **Rule.** Start each tier on a signal of matching strength.

  | tier | started on | build time / cost [T] |
  |---|---|---|
  | spec | weak intent (one partial note) | ≈ 3 s, < $0.001 |
  | text-free image (flare-low) | a *stable* intent: the same key across ≥ 2 partials or ≥ 1.5 s [E] | 15.1 s, $0.0066 |
  | live code build | beat-plan lookahead ≥ 90 s only; never a partial | 34-54 s |

  Each tier has its own concurrency cap and FIFO eviction.
- **Evidence:** Speculation Rules eagerness and caps [§2.2].
- **Mapping:** `buildIntent.js` → per-tier launchers. The image lane must respect Foundry capacity, because 429s hurt
  the reply path.
- **Test:** E-SC2 sweeps thresholds and plots ready-at-boundary against dollars wasted.

### SC-4 Late binding

- **Rule.** Speculate on the intent-shaped spec (archetype, items, misconception target, strings). Bind the child's own
  values at commit. Never speculate on a verdict.
- **Evidence:** M-B1 (values are wrong 38-45% from prefixes); intent stabilisation (73.9% streamable); "prerender until
  script" [§2.2-2.3].
- **Mapping:** the engines recompute truth from the kit, so binding costs about 0. Verdict timing is governed by
  `verdictNotBefore`.
- **Test:** the share of committed reveals whose bound values differ from those at speculation time. This must not
  cause a stale reveal.

### SC-5 Expected-utility reveal

- **Rule.** Reveal if P(need) ≥ p\*_reveal. Offer by voice if P(need) is between p\*_offer and p\*_reveal. Otherwise
  stay silent. Start with p\* high (for example 0.7 to reveal and 0.4 to offer [E]). A child's request means P = 1.
  Safety means P = 0.
- **Evidence:** Horvitz; proactive-agent over-action [§2.3-2.4].
- **Mapping:** code in the kernel; no model call.
- **Test:** the share of "offers accepted" (a calibration signal) and of off-target reveals, which must be 0.

### SC-6 Fused reveal

- **Rule.** A piece appears *together with* the teacher's sentence that names it, and a cue highlights what she names.
  A piece that is ready but has no sentence yet waits, invisibly.
- **Evidence:** temporal contiguity d = 1.22; signalling 0.41; breakpoint interruptions [§2.3, §2.5].
- **Mapping:** `StudioFacts` and the telegraphic status row feed her reply [T: LIVE-STUDIO D9]. The reveal is
  scheduled on her TTS clock.
- **Test:** the gap between reveal and her referring word. Target ≤ 500 ms [E].

### SC-7 Coherence filter

- **Rule.** One piece on stage. A candidate's learning value is signed: off-target or off-topic is negative. Never
  reveal "because it was ready".
- **Evidence:** coherence d = 0.86; seductive details g = −0.12 to −0.33 [§2.5].
- **Mapping:** the topic guard (`w2h-fraction-archetype-topic-guard` [T]) applies to every candidate.
- **Test:** off-topic reveals must be 0 on the replay set. Rejected precedent: 6/23 off-topic admissions.

### SC-8 Learner- and age-conditioned priors

- **Rules:**
  - procedural or process idea → animation;
  - below mastery → worked example or explainer;
  - above mastery (accuracy shown untimed) → game;
  - explore-first only in classes 6-9.
- **Evidence:** Höffler & Leutner; expertise reversal; productive failure for grades 2-5 [§2.5].
- **Mapping:** STUDIO-V2 §7's trigger table, with these as priors.
- **Test:** a review of the policy table; learning effect only in E2 or later.

### SC-9 VOI knapsack

- **Rule.** score = P(need at boundary) × (value − default value) × P(ready by boundary) × freshness − cost. Pick
  ratio-greedy under the caps.
- **Evidence:** metareasoning; Padmanabhan & Mogul [§2.7].
- **Mapping:** `PREPARE_CAPS` and the LIVE-STUDIO §7 caps.
- **Test:** E-SC2.

### SC-10 Offline bandit priors

- **Rule.** Learn archetype priors per premise across children, with a learning-progress reward from host-graded
  evidence and a uniform exploration floor. Nightly only.
- **Evidence:** ZPDES; Rafferty 2019 [§2.8].
- **Mapping:** the library's quality score (LIVE-STUDIO D11).
- **Test:** a simulated-student check, then real children.

### SC-11 Premise invalidation

- **Rule.** A key change kills a candidate. A churning intent drops to the cheaper tier. A gated loser goes to the
  library.
- **Evidence:** Cho & Garcia-Molina; age of information [§2.9].
- **Mapping:** the `speculator.js` hash promotion pattern, applied at a coarser key.
- **Test:** stale reveals must be 0 on replay.

### SC-12 Memory-augmented speculator

- **Rule.** A transition table (beat × misconception × band → the piece revealed and judged useful) plus a confusion
  tracker. Code only.
- **Evidence:** Speculate with Memory, +19-39% relative [§2.1].
- **Mapping:** new code.
- **Test:** E-SC1 hit@k with and without the table.

### SC-13 Pool-wide safety quarantine

- **Rule.** A safety turn drops every candidate at every tier, in any state. No reveal until the safeguard ends. Specs
  and images are never built from the words of a distress turn.
- **Evidence:** Taxila v1 law 5; §2.10.
- **Mapping:** `BuildIntents.onSafety` and `Speculator` quarantine, extended to cover the pool.
- **Test:** on the safety battery, reveals during a safety turn must be 0/N.

### SC-14 Metrics

- **What to report:** precision, recall, waste in dollars, ready-at-boundary, the reveal-to-reference gap, off-target
  reveals, stale reveals and safety-turn reveals. Also an intervention-window metric: the reveal falls inside the
  child-need window.
- **Evidence:** the prefetching literature and PASTABench [§2.2, §2.4].
- **Mapping:** `evals/stagecraft/**`.
- **Test:** every experiment in §5.

---

## 4. Things this evidence says not to do (proposed `context/rejected.md` entries, by evidence rather than trial)

| id (proposed) | do not | because |
|---|---|---|
| `rj-sc-reveal-when-ready` | reveal a speculative piece the moment it finishes building | temporal contiguity d = 1.22 and breakpoint research: an unannounced mid-turn change splits attention; Taxila's `rj-studio-reveal-on-clock-only` already broke this way in 2/2 probes [T] |
| `rj-sc-value-speculation` | speculate on the child's final value or verdict and pre-build value-specific content | M-B1: 38-45% wrong from prefixes, oracle saves 0 words [T]; intent is the stable part |
| `rj-sc-model-decides-reveal` | let an LLM decide whether or when to show | proactive-agent benchmarks: LLMs over-act and handle cancellation badly [P-sec]; `llm-beat-proposer-live` [T] |
| `rj-sc-engagement-reward` | reward the archetype bandit with taps, time-on-piece or replays | seductive details are engaging and lower learning (g −0.12 to −0.33) [P-sec]; bandit estimates are biased without an exploration floor [K] |
| `rj-sc-device-prefetch` | push speculative candidates to the child's phone | metered data; mobile prefetch precision is about 22% [P-sec]; engines are already precached, so only the chosen spec needs to travel [T] |
| `rj-sc-live-build-from-partial` | start a live code build (34-54 s) from a partial-utterance intent | the build time exceeds any child turn; it violates `forge-live-codegen-race` and `live-free-generation` [T]; the duplex ARCHITECTURE already says prefetch only [T] |
| `rj-sc-explore-first-young` | default to problem-first or explore-first candidates for classes 1-5 | productive-failure effects reverse for grades 2-5 [P-sec] |
| `rj-sc-same-archetype-k` | fill the k candidate slots with variants of one archetype | ensemble or diverse guesses beat more samples of one kind [P] |

---

## 5. Experiments for `evals/stagecraft/` (to be designed by the build workstream; listed so the claims above have a test)

| id | question | method | n | ship bar [E] |
|---|---|---|---|---|
| **E-SC1** intent stabilisation and hit@k | how early, in a child's turn, does the content intent (topic, misconception family, show versus tell) stabilise, and what is hit@1/3/5 for the candidate set? | offline replay of TaxilaFDB and duplex E1 transcripts word by word with kit misconception tags; candidates from the code policy with and without the SC-12 transition table | ≥ 100 misconception turns plus ≥ 50 "show me" turns | recall (ready-at-boundary) ≥ 0.7 at k ≤ 3; stabilisation before the turn end on ≥ 50% |
| **E-SC2** waste curve | the ready-at-boundary versus dollars-wasted curve per tier and threshold | simulate on E-SC1's timelines with measured build-time distributions per tier [T: plan 3.25 s p50; flare 15.1 s; race 34-54 s] | same | choose the knee; spec waste ≤ $0.01 per lesson [E] |
| **E-SC3** small real-build arm (within the $25 cap) | do k = 3 parallel spec builds plus one flare image meet their p90 under real Foundry concurrency, without 429s on the reply lane? | 20 replayed turns × k = 3 specs (`taxila-fast`) + 20 flare-low images, run concurrently with a synthetic reply load | 60 specs, 20 images | spec p90 ≤ 4 s, all schema-valid after repair; image 429s on the reply deployment 0 |
| **E-SC4** lossless shadow | is speculation lossless? | speculation off versus on over the same replays | all E-SC1 boundaries | chosen `(archetype, premise)` identical at 100%; stale reveals 0; safety-turn reveals 0 |
| **E-SC5** fused reveal timing | the gap between reveal and the teacher's referring word | instrument the TTS clock in the lesson harness | ≥ 50 reveals | p90 ≤ 500 ms |
| **E-SC6** learning effect (later, children) | does speculative readiness change learning versus non-speculative Studio? | within-child A/B in the ET-2 style [T: duplex PLAN §3] | 12+ children | no harm on host-graded post-items; child-initiated pieces ≥ 25% (STUDIO-V2 target) |

**Cost estimate for E-SC3 [E]:**
- 60 specs at ≤ $0.001 ≈ $0.06;
- 20 flare-low images at $0.0066 ≈ $0.13;
- synthetic reply load ≈ $0.5.

That is well inside the $25 cap. No live code builds are needed for this question.

---

## 6. Proposed context entries (for the main loop's merge)

- **decision `sc-lossless-commit`:** speculation may change only readiness, never the selected piece. Reverse if E-SC4
  shows that a non-lossless policy (speculation influences choice) improves host-graded outcomes in E-SC6 with no
  safety or off-target regressions.
- **decision `sc-intent-not-value`:** speculate on intent and bind values late. Reverse if real-child partial streams
  show prefix value accuracy ≥ 95% (today 55-62% [T]).
- **decision `sc-tiered-eagerness`:** spec on a weak signal, image on a stable one, live build from lookahead only.
  Reverse per tier when that tier's measured build p90 falls below the median child-turn length on E1.
- **decision `sc-k3-diverse`:** k ≤ 3 diverse candidates. Reverse if E-SC1 shows hit@5 − hit@3 ≥ 0.15 at a spec waste
  under $0.01 per lesson.
- **decision `sc-young-instruction-first`:** classes 1-5 get no explore-first candidates. Reverse on a Taxila A/B
  showing explore-first is no worse on host-graded transfer for classes 4-5.
- **measurements:** none from this study (literature only); §5 lists the experiments that would produce them.
- **rejections:** the 8 rows in §4, marked "by evidence, not by trial".

---

## 7. Sources (accessed 2026-10-05)

**Speculative execution for agents**
- Speculative Actions: A Lossless Framework for Faster Agentic Systems, arXiv 2510.04371 — https://arxiv.org/abs/2510.04371, https://arxiv.org/html/2510.04371 [P]
- Speculate with Memory: Lossless Acceleration for LLM Agents, arXiv 2607.12236 — https://arxiv.org/abs/2607.12236 [P]
- Act While Thinking / PASTE: pattern-aware speculative tool execution, arXiv 2603.18897 — https://arxiv.org/html/2603.18897v1 [P]
- AOSpec, arXiv 2608.00881 — https://arxiv.org/pdf/2608.00881 (title only)
- SpecHop, arXiv 2605.21965 — https://arxiv.org/pdf/2605.21965 (title only)
- Leviathan et al. 2023, speculative decoding; Chen et al. 2023, speculative sampling [K]

**Streaming intent and proactive agents**
- When Does Streaming Tool Use Help? Tool-intent stabilization in streaming RAG, arXiv 2606.20113 — https://arxiv.org/pdf/2606.20113 [P]
- A Streaming End-to-End Framework for SLU (IJCAI 2021) — https://arxiv.org/pdf/2105.10042 [P-sec]
- RNN-based incremental online SLU (SLT 2021) — https://arxiv.org/pdf/1910.10287 [P-sec]
- Proactive Conversational Agents with Inner Thoughts, arXiv 2501.00383 — https://arxiv.org/html/2501.00383v2 [P]
- ProactiveEval, arXiv 2508.20973 — https://arxiv.org/pdf/2508.20973 [P-sec]
- ProEvent, arXiv 2607.17701 — https://arxiv.org/html/2607.17701 [P-sec]
- ProactBench, arXiv 2605.09228 — https://arxiv.org/pdf/2605.09228 [P-sec]
- PASTABench, arXiv 2609.28197 — https://arxiv.org/abs/2609.28197v1 [P-sec]
- Horvitz 1999, Principles of mixed-initiative user interfaces; Adamczyk & Bailey 2004; Iqbal & Bailey 2008 [K]

**Prefetching and pre-rendering**
- How Google Search uses speculation rules — https://developer.chrome.com/blog/search-speculation-rules [V]
- Ray-Ban speculation rules case study — https://web.dev/case-studies/rayban-speculation-rules [V]
- Monrif case study — https://web.dev/case-studies/monrif-cwv [V]
- Speculation rules overview and aggregates — https://www.corewebvitals.io/pagespeed/speculation-rules [V]
- Practical prediction and prefetch for mobile apps (Parate et al.) — https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/ubi1443-parate.pdf [P-sec]
- Network-agile preference-based prefetching — https://arxiv.org/pdf/1208.0054 [P-sec]
- Padmanabhan & Mogul 1996; Lee et al. 2015 (Outatime) [K]

**Learning science**
- Mayer, Principles for reducing extraneous processing (coherence, signalling, redundancy, spatial and temporal contiguity) — https://edtechuvic.ca/wp-content/uploads/sites/11/2022/09/principles-for-reducing-extraneous-processing-in-multimedia-learning-coherence-signaling-redundancy-spatial-contiguity-and-temporal-contiguity-principles.pdf [P-sec]
- A meta-analysis of Richard Mayer's multimedia learning research: boundary conditions (2025) — https://www.sciencedirect.com/science/article/pii/S1747938X25000673 (not read in full)
- Sundararajan & Adesope 2020, Keep it Coherent — https://www.researchgate.net/publication/339511797 [P-sec]
- Seductive details multilevel meta-analysis and MASEM (2025) — https://link.springer.com/article/10.1007/s10648-025-10099-z [P-sec]
- Sinha & Kapur 2021, When Problem Solving Followed by Instruction Works — https://janfasen.nl/wp-content/uploads/2023/05/Sinha-and-Kapur-PS-I.pdf [P-sec]
- Clément et al., Multi-Armed Bandits for Intelligent Tutoring Systems — https://arxiv.org/pdf/1310.3174 [P-sec]
- Höffler & Leutner 2007; Berney & Bétrancourt 2016; Barbieri et al. 2023; Kalyuga 2007; D'Angelo et al. 2014; Clark et al. 2016; VanLehn 2011; Kulik & Fletcher 2016; Brusilovsky 2001; Rafferty et al. 2019 [K]

**Generated content safety and visuals**
- From Text to Visuals: LLMs generating maths diagrams with vector graphics, arXiv 2503.07429 — https://arxiv.org/abs/2503.07429 [P]
- Exploring agentic workflows for high-quality maths visual aids, arXiv 2607.09839 — https://arxiv.org/pdf/2607.09839 [P]
- When LLMs Hallucinate: erroneous feedback in maths tutoring (EDM 2025) — https://educationaldatamining.org/EDM2025/proceedings/2025.EDM.doctoral-consortium-papers.254/index.html [P-sec]
- Beyond Text: K-12 educators on multimodal LLMs, arXiv 2507.20720 — https://arxiv.org/pdf/2507.20720 [P-sec]
- LLMs cannot spot math errors, even when allowed to peek into the solution, arXiv 2509.01395 — https://arxiv.org/pdf/2509.01395 [P-sec]

**Freshness**
- Information Freshness in Cache Updating Systems (Bastopcu & Ulukus) — https://arxiv.org/pdf/2004.09475 [P-sec]
- Cho & Garcia-Molina 2003, Effective page refresh policies for web crawlers; Kaul, Yates, Gruteser 2012 [K]

**Taxila files cited [T]**
- `docs/research/duplex/{ARCHITECTURE.md, PLAN.md, MODELS-PAPERS.md}`
- `server/duplex/{triage,buildIntent,speculator}.js`
- `docs/design/superhuman/LIVE-STUDIO.md`
- `docs/design/reset/{STUDIO-V2.md, DESIGN-V3.md}`
- `docs/research/models/MODEL-ROUTER.md`
- `context/rejected.md` (`live-free-generation`, `generated-media-carries-facts`, `forge-live-codegen-race`,
  `rj-studio-reveal-on-clock-only`, `rj-studio-fraction-mention-as-topic`, `llm-beat-proposer-live`,
  `rj-reset-w2h-library-as-visual-answer`, `rj-w2b-cache-only-prewarm-for-150ms`)
