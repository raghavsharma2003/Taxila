# Motivation and interest: a MotivationState and teacher moves for Taxila

**Date:** 2026-10-02 · **Scope:** classes 1-9 (ages ~6-15), voice-first Hindi/English/Hinglish teacher, server-side Director.
**Builds on, does not repeat:** `learning-science.md` (LS) §1.11 (affect dynamics, behaviour-only inference, never stored), §3.5-3.8 (praise, growth mindset, SDT summary, age table), §8.4-8.5 (format bandit, engagement as a constraint), rules 25-27 (interest contexts, 2-4 choices, no reward economy). `learner/vibe-temperament.md` (VT): `EngagementState`, knobs, `moveOutcomeCoder`, `scaffoldStretch`, invariants VI1-VI11, modes. `learner/kt-algorithms.md` (KT): pSuccess, categorical outcomes, stuck detection. `design/kids-ux-ages.md`: no streaks, leaderboards or fake peers. This file adds the *why* of a child's (dis)engagement and what the teacher does about each cause.

**Tags.** **[V]** checked this session against the primary abstract or text (ERIC, Europe PMC, Crossref, arXiv, publisher or regulator page). Most are abstract-level, so effect sizes not in an abstract are not quoted. **[S]** secondary only (a review, a title, or a fetched summary). **[U]** unverified: prior knowledge or a Taxila design default that must be measured. Every numeric threshold in §2-§3 is [U] by construction.
**Method.** The shared WebSearch budget was already spent when this ran. Discovery used the ERIC, Europe PMC, Crossref and arXiv APIs (about 45 queries), plus direct fetches (EU Commission, OUP, arXiv, PMC full text). OpenAlex was rate-limited, and nature.com redirected to a login page.

---

## 0. Decisions on one screen

| # | decision | why | what would reverse it |
|---|---|---|---|
| D1 | A per-session **moment filter** with 11 causes of (dis)engagement refines VT's 5-state `EngagementState`. Nothing affective is persisted. | The fix depends on the cause: boredom from too-easy work and boredom from too-hard work need *opposite* difficulty moves (§1.6). VT's `strained`/`disengaging` cannot tell them apart. | MM2: filter macro-F1 < majority baseline + 0.10 → collapse to VT's states + the diagnostic choice (D3) |
| D2 | **Competence is the first lever.** A success-rate controller per moment, plus learning-progress (LP) activity selection with child choice | Competence is the strongest predictor of autonomous motivation (Bureau 2022) [V]. LP sequencing plus choice raised intrinsic motivation *and* learning in 7-8-year-olds; choice inside a fixed sequence *lowered* learning (Clément 2024, n=265 RCT) [V] | MM5: no gain over the fixed sequence in an Indian pilot |
| D3 | **"Boring" is never acted on directly.** An ambiguous boredom/struggle posterior triggers a two-way *diagnostic choice* before any difficulty change | Among grades 5-9, 13% were bored because over-challenged and 21% because under-challenged (Schwartze 2024, n=1,407) [V]. MAC model: boredom has attention and meaning components (Westgate & Wilson 2018) [V] | MM2: features alone separate under- from over-challenge at ≥ 0.85 accuracy |
| D4 | **No reward economy, no streaks, no loss-framed returns.** Children return through a *child-chosen open thread*, a routine and visible capability | Tangible and expected rewards undermine free-choice motivation, more so in children (Deci 1999) [V]. A streak becomes a goal in itself, and a broken one lowers engagement (Silverman & Barasch 2022) [V]. EU DSA Art. 28 guidelines say to disable streaks by default for minors [V]. People do tend to resume interrupted tasks (Ovsiankina effect; Ghibellini & Meier 2025) [V] | Tokens and streaks: never (ethical floor). Threads: MM7 compulsion markers rise |
| D5 | **Utility value is elicited before it is told**, and never *told* to a low-expectancy or anxious child | Told utility undermined low-confidence learners; self-generated utility helped (Canning & Harackiewicz 2015) [V]. In one field trial it backfired for struggling students (Canning 2019) [V] | MM6: told ≥ elicited in band C, including children with low pSuccess |
| D6 | **Praise attribution is age-banded.** Skill-specific capability statements, with evidence, for all ages. Effort-only praise is banned in band C, and "you didn't even need to try" praise at every age | Ability feedback tied to a skill beat effort feedback for 3rd graders (Schunk 1983) [V]. Effort praise backfires in adolescence (Amemiya & Wang 2018) [V]. Older children read praise as a sign of low ability (Barker & Graham 1987) [V]. Low-effort praise taught 5-year-olds to devalue effort (Zhao 2022) [V] | An Indian band-C pilot finds no attribution difference (MM9) |
| D7 | **Performance talk is channelled into personal-best goals**, never into normative or avoidance framing | Performance-approach goals overtake mastery goals from grade 5 (Bong 2009, Korea) [V]. Personal-best goals predict engagement, deep learning and flow (Martin & Liem 2010; Liem 2012) [V]. Students adopt the goals of the climate around them (Bardach 2020 meta) [V] | Normative framing: never. PB framing: dropped if it raises avoidance-talk counts |
| D8 | **Interest phase** (Hidi-Renninger 1-4) is tracked per domain from counted behaviours. It changes the *kind of support*, never the standards | The four-phase model is cyclical and needs different supports per phase (Hidi & Renninger 2006 [V]; Yan 2025 review [S]) | Phase fails to predict 30-day self-initiated return (MM8 AUC < 0.6) |
| D9 | **"Teacher's pick" is a first-class option in every choice** | Asian-American children were *most* motivated when a trusted adult chose (Iyengar & Lepper 1999) [V]. Choice motivates only when culturally congruent (Katz & Assor 2007) [V] | Uptake < 5% and no difference in continuation |
| D10 | **Curiosity teasers are sized to the verge of knowing** (KT pSuccess 0.3-0.6) and suppressed while the child is anxious | Curiosity predicted memory for surprising answers 1-2 weeks later (Kang 2009) [V]. Generating a prediction raises curiosity (Brod & Breitwieser 2019) [V]. Learning is best on the verge of knowing (Chen 2025) [V]. A gap with low coping potential produces anxiety and avoidance (Erdemli 2025) [V] | MM4/MM6 show no delayed-recall benefit for teaser items |

---

## 1. Evidence, compressed to what changes a design

### 1.1 Self-determination theory: deeper than LS §3.7
- **The needs are not equal.** Across 144 studies and more than 79,000 students, competence predicted self-determined motivation most strongly, then autonomy, then relatedness. *Teacher* autonomy support predicted need satisfaction more strongly than parental support (Bureau, Howard, Chong & Guay 2022) [V]. **Reading:** Taxila's motivational engine is a success-rate controller plus true capability feedback, not charm. Warmth (VT §3.3) buys liking. Competence buys returning.
- **Which kind of motivation pays off.** Across 344 samples and 223,209 students: intrinsic motivation went with success and well-being, and identified regulation (personal value) went with persistence. Introjected regulation (ego, guilt, shame) went with persistence *and* ill-being. External regulation did not predict performance and went with lower well-being (Howard et al. 2021) [V]. **Reading:** the cheapest Indian lever is introjection: "mummy will be proud", "don't disappoint" [U]. It works in the short run and costs well-being, so it is banned (MI3). For 10-15-year-olds the target is identified regulation ("this matters *to me*").
- **The decline is the default.** Intrinsic motivation fell linearly from grade 3 to grade 8 (n=797). Extrinsic motivation stayed flat and correlated *negatively* with grades (Lepper, Corpus & Iyengar 2005) [V]. Within a single year it fell further, but less where the school emphasised mastery goals (Corpus et al. 2009, n=1,051) [V]. Competence beliefs and values also decline from grade 1 to 12 (Jacobs et al. 2002, n=761) [V]. **Reading:** for 12-15-year-olds, holding motivation flat is already a win, and the climate (D7) is the mechanism.
- **Rewards.** Engagement-, completion- and performance-contingent rewards undermined free-choice intrinsic motivation (d = −0.40, −0.36, −0.28). Positive feedback enhanced it (d = +0.33). "Tangible rewards tended to be more detrimental for children than college students, and verbal rewards tended to be less enhancing for children" (Deci, Koestner & Ryan 1999, 128 studies) [V]. Contested by Reiss 2005 on measurement grounds [V]. Rebuttal: Deci, Ryan & Koestner 2001 [V]. **Reading:** even verbal praise is a weak lever in children, which is one more reason to rely on competence.
- **Autonomy support is teachable.** Training programmes for autonomy support had a weighted effect of 0.63 (Su & Reeve 2011, 19 studies) [V]. Across 51 interventions (38 RCTs), autonomy-supportive teaching proved malleable and beneficial (Reeve & Cheon 2021) [V]. Its behaviours include taking the student's perspective, building on their interests, giving rationales, acknowledging negative feelings, invitational rather than controlling language, and patience [U: the itemised list is from memory; the abstract confirms "seven"]. **Reading:** each behaviour becomes a move shape (§3) and a lexicon gate (MI3, MI5).
- **Choice: what kind, and from whom.** Choice boosted intrinsic motivation most for children, with 2-4 successive choices, and with instructionally *irrelevant* choices (Patall et al. 2008, 41 studies) [V]. Grade 3 children offered a (deceptive) choice of story comprehended better (d = 0.52) and enjoyed it more (d = 0.23) (Fridkin & Hurry 2025, n=110) [V]. Asian-American children were most motivated when trusted adults or peers chose for them (Iyengar & Lepper 1999) [V]. Volition, not *perceived choice*, marks self-determination (Reeve, Nix & Hamm 2003) [V]. Contextualising, personalising and offering choice all raised 4th-5th graders' motivation and learning (Cordova & Lepper 1996, n=72) [V]. **Reading:** offer real choices (MI9), always include "teacher's pick" (D9), and pair choice with adaptivity (D2).
- **India.** Among 363 Indian adolescents in India, only intrinsic motivation mediated the link from school self-concept to grades (Areepattamannil 2012) [V]. Among Kolkata private-school students in grades 10 and 12 (n=400), 35% reported high academic stress and 37% high exam anxiety, and stress was higher for lower-graded students (Deb, Strodl & Sun 2014) [V; older than Taxila's range, so treat it as a ceiling].

### 1.2 Interest: the four-phase model
- **Phases** (Hidi & Renninger 2006) [V]: (1) triggered situational, (2) maintained situational, (3) emerging individual, (4) well-developed individual. The model is cyclical, so even a phase-4 interest needs a fresh trigger each time [S: Yan et al. 2025 review, full text].
- **Supports by phase** [S: Yan 2025; U: details]:
  - Phase 1 needs novelty, surprise, incongruity, hands-on work, and others who carry the engagement.
  - Phase 2 needs repeated, meaningful, manageable engagement and some personal value.
  - Phase 3 learners pose their own curiosity questions. They need those questions honoured and answered, and feedback that respects their ideas.
  - Phase 4 learners self-regulate and persist. They need challenge, resources and an expert role.
- **Utility value: the strongest and riskiest interest tool.**
  - Writing about relevance raised interest, most for low-expectancy students (Hulleman et al. 2010) [V].
  - *Directly told* utility **undermined** interest and performance for low-confidence learners. Self-generated utility helped, and combining the two was synergistic (Canning & Harackiewicz 2015) [V].
  - In two-year colleges, struggling students became *less* interested under utility conditions (Canning, Priniski & Harackiewicz 2019) [V].
  - Among German 9th graders (82 classrooms, n=1,916), *evaluating quotations* from real people beat writing one's own text (Gaspard et al. 2015) [V]. The writing condition raised triggered interest but lowered homework completion in the first week (Flunger et al. 2021) [V].
  - Choice raised in-session attention and interest. Utility raised *behaviour beyond the session*: students requested further resources (Asher & Harackiewicz 2025, 7 experiments, n=2,019 undergraduates) [V].
  - **Reading:** choice is the in-session lever and utility is the between-session lever. Elicit first; when giving examples, use real, reviewed testimony assets, never fabricated peers (kids-ux).
- **Curiosity and interest by age.** At ages 10-14, high curiosity before the answer improved memory in both children and adolescents. Interest *after* the answer added more for adolescents (Fandakova & Gruber 2021, n=60) [V]. **Reading:** for younger children the lever is the gap before the answer. For older children it is the follow-up after the answer.

### 1.3 Achievement goals
- **Age shift.** Korean students in grades 1-4 endorsed mastery-approach goals most; grades 5-9 endorsed performance-approach goals. Young children's goals were barely differentiated (Bong 2009, n=1,196) [V]. In the US, task goals fell from grade 5 to 7 and academic efficacy "dramatically decreased" across the middle-school transition (Anderman & Midgley 1996) [V].
- **Climate → goals.** Each personal goal related most strongly to its matching classroom goal structure (Bardach et al. 2020, k=68, N=47,975) [V]. A mastery-oriented classroom puts the focus on effort rather than ability (Ames 1992) [V]. Ames's TARGET levers are task, authority, recognition, grouping, evaluation and time [U: list from memory].
- **Which performance goal.** Performance-approach scales built on normative items correlated r = .14 with performance. Scales built on appearance or evaluation items correlated r = −.14 (Hulleman et al. 2010, 243 studies) [V]. Approach goals that compare oneself with one's own past are the safe form: personal-best goals predicted engagement and achievement (Martin & Liem 2010, n=1,866) [V], and deep learning, flow and buoyancy (Liem et al. 2012) [V]. **Reading:** Indian marks talk among 12-15-year-olds [U] gets *redirected* to the child's own past, never suppressed with a lecture and never fed with rank.

### 1.4 Expectancy-value and self-efficacy
- **E and V multiply.** Among 2,508 students, an Expectancy × Value product term predicted achievement over and above the additive terms (Trautwein et al. 2012) [V]. High value cannot rescue zero expectancy, and the reverse also holds. Emotional cost had the largest effect on performance among cost types (Flake et al. 2017) [V].
- **Effort and ability are a developmental moving target.** Children's causal schemes for effort and ability change between ages 5 and 13 (Nicholls 1978, 1984) [V]. Young children treat trying hard as being smart. Adolescents read high effort as low capacity [U: age boundaries]. The oldest children (to about 12) inferred *lower* ability from praise for success (Barker & Graham 1987) [V]. Effort praise "often stops working and even backfires by adolescence" (Amemiya & Wang 2018) [V]. One counterpoint: effort feedback raised 8th graders' self-efficacy most (Jain et al. 2007, n=192) [V]. The evidence is mixed, so test it (MM9).
- **What builds self-efficacy in children.**
  - Proximal sub-goals produced faster mastery, higher self-efficacy and more *interest* than a distal goal or no goal (Schunk 1980, n=40, mean age 8.4) [V].
  - Watching a peer model raised self-efficacy more than watching a teacher model (Schunk & Hanson 1985, ages 8-10) [V]. Coping models, or several models, beat a single mastery model (Schunk et al. 1987) [V].
  - Skill-specific ability feedback beat effort feedback for 3rd graders (Schunk 1983) [V]. Giving ability feedback *first* worked best (Schunk 1984) [V].
- **Normalising difficulty.** A 10-minute reframe, "difficulty means learning", improved working-memory span and reading comprehension in sixth graders (Autin & Croizet 2012, n=310) [V].
- **Planning for teens.** Mental contrasting with implementation intentions led to 60% more exam-practice questions (Duckworth et al. 2011, n=66) [V], but showed little advantage over good planning in a later trial (Abdulla & Woods 2021) [V]. Small, optional, and for band C only.

### 1.5 Curiosity: the information gap
- **The gap.** Curiosity is a felt knowledge gap (Loewenstein 1994 [S]). It recruits reward circuitry, makes people pay to learn the answer, and predicted recall of *surprising* answers 1-2 weeks later (Kang et al. 2009) [V]. Generating a prediction first raises curiosity, and curiosity predicts memory (Brod & Breitwieser 2019) [V]. This is LS probe P5 doing double duty.
- **Size of the gap.** Curiosity peaks at low-to-medium knowledge confidence, and learning is best "on the verge of knowing" (Chen et al. 2025) [V]. A gap that feels relevant but beyond one's coping produces anxiety and information avoidance (Erdemli et al. 2025) [V].
- **In children.** 5-8-year-olds learned more when more curious (Ziv et al. 2026, n=60) [V]. Kindergarten curiosity predicted reading and maths, more strongly at low SES (Shah et al. 2018, n=6,200) [V]. Four-year-olds chose activities by learning progress and novelty (Poli et al. 2025, n=102) [V]. Adults also track learning progress (Ten et al. 2020 preprint) [V]. Children's questions are a learning mechanism (Chouinard 2007) [V]. Curiosity is "almost completely absent from classrooms" (Engel 2011) [V]. **Reading:** licensing and answering the child's own questions is a core move, and it is also the strongest indicator of phase 3 interest.
- **Unfinished business.** A meta-analysis found *no* memory advantage for unfinished tasks (Zeigarnik), but a general tendency to *resume* them (Ovsiankina) (Ghibellini & Meier 2025) [V]. Drop the "cliff-hanger aids memory" claim. Keep "an open question the child chose brings them back", with the ethics in §5.

### 1.6 Boredom versus frustration (beyond LS §1.11)
- **Two components.** Boredom comes from attention mismatch (under- *or* over-stimulation) or from meaning mismatch, and each produces it independently (Westgate & Wilson 2018) [V]. Over-challenge boredom carries a self-focused "dissatisfied and frustrated" factor (Acee et al. 2010) [V]. Boredom correlates with academic outcomes at r = −.24 (Tze et al. 2016, 29 studies) [V].
- **Frustration is not failure.** In ASSISTments, frustration and engaged concentration were *both* associated with better end-of-year exam outcomes, and so was boredom *during scaffolding* (Pardos et al. 2014) [V]. Engagement/flow was the most frequent state across 24 studies (D'Mello 2013) [V]. **Reading:** do not rescue at the first sign of struggle (§3, `struggle`).
- **Wheel-spinning is a prerequisite problem.** Wheel-spinning means ≥ 10 attempts at a skill without 3 correct in a row (Beck & Gong 2013, as used by Park 2023) [V]. It occurred 50% of the time for students in the bottom 20% of prerequisite knowledge, against 10% for the top 20% (Wan & Beck 2015) [V]. Gaming the system has motivational and attitudinal antecedents (Baker et al. 2008) [V]. **Reading:** frustration that persists → route to the prerequisite, using the KT graph.

### 1.7 What brings children back without a reward economy
| driver | evidence | Taxila form |
|---|---|---|
| Competence you can see | proximal goals → interest (Schunk 1980) [V]; competence is the top need (Bureau 2022) [V] | capability statement backed by a KT diff, once per session |
| Adaptivity plus agency | Clément 2024 [V] | LP selection + 2-3 offered options |
| Relationship with a character | parasocial relationships and contingent replies predicted 4-5-year-olds' maths learning and transfer (Calvert et al. 2020, n=217) [V; younger than Taxila's range] | warm teacher with memory of the child's *work*; never claims feelings (LS §4.5) |
| Novelty that fades | novelty effects wear off in long-term robot interaction (Leite et al. 2013 survey [S]; Kanda et al. 2004 [U]) | adaptivity and memory, not novelty, carry weeks 3+ |
| Resumption of the child's own open question | Ovsiankina (Ghibellini & Meier 2025) [V] | child-chosen "next time" thread (§5) |
| Need satisfaction rather than rewards in games | Ryan, Rigby & Przybylski 2006 [S: title] | game wrappers satisfy competence and autonomy; no loot |
| Routine | habit research is adult-only [U] | parent-set routine slots in the Conductor |
| Fresh starts | temporal landmarks speed task completion (Min et al. 2024, adults) [V]; Dai et al. 2014 [U] | re-entry after absence: new-week framing, zero mention of missed days |
| **Rejected:** streaks, points, coins, unlocks, FOMO | Silverman & Barasch 2022 [V]; Deci 1999 [V]; EU DSA Art. 28 guidelines (14 Jul 2025) [V]; ICO: 10-12-year-olds "particularly susceptible to reward based systems" (kids-ux [V]) | MI1, MI2 |

---

## 2. MotivationState specification

### 2.1 Layers and placement in the Director
```
child turn ─► extractors (lexicon, timing, KT outcome, module events, VT moveOutcomeCoder label) ─► TurnFeatures
TurnFeatures ─► stepMoment()  (HMM forward step, in-memory)  ─► MomentPosterior ─► engagementState() ─► VT knobs
             ─► session counters (selfDoubt, normTalk, avoidTalk, curiosityQs, choices) [in-memory]
session close ─► aggregate counts ─► InterestRecord / ValueArms (mode-gated, VT §4.10) ; child_threads (child's own words)
Director step 3 (choose move) ← chooseMotiveMove(MotivationSession, KtView, VibeDirective)  → move shape + targetP + offers
```
**One state machine, not two.** VT's `onChildTurn` derives `state` from `engagementState(post)` (mapping below) instead of computing `strained` separately. Its suppression rules (no humour, dare or slang while strained) then apply unchanged. *Proposal for `LEARNER-MODEL.md`.*

| Moment | VT EngagementState | | Moment | VT EngagementState |
|---|---|---|---|---|
| warming | warming | | boredUnder, boredMeaning, gaming, fatigued | disengaging |
| flow, curious, struggle | engaged | | exit intent (VT V18) | stopped (absorbing) |
| frustrated, boredOver, anxious | strained | | | |

### 2.2 Legitimacy (VT's L1-L5 test applied)
| construct | observable (L1) | knob it changes (L2) | stored? |
|---|---|---|---|
| moment posterior | features in §2.4 | difficulty target, move family | **never** (session memory only) |
| selfDoubt / normTalk / avoidTalk | lexicon counts | framing (PB, private practice, reframe) | session counts only; never a trait |
| interest phase per domain and tag | counted indicators I1-I8 | support type (§3.3) | mode-gated counts + phase |
| value-channel uptake | outcome label after a framing move | which framing to offer | mode-gated Beta arms |
| child threads | the child's own question | next session opener | yes, ≤ 120 chars, parent-visible, deletable |
No construct is a type ("unmotivated child", "performance-oriented"). Banned inferences follow VT §4.9. The owner's 2026-10-02 directive deprioritises compliance work. The mode switch stays in code anyway, because it is cheap and the DPDP 9(3) exposure (LS §4.3) has not changed.

### 2.3 Types
```ts
// src/learner/motivation/types.ts — pure; no I/O
import type { SkillId } from '../kt/types'; import type { BetaArm, AgeBand } from '../vibe/types';
export type Moment = 'warming'|'flow'|'curious'|'struggle'|'frustrated'|'boredUnder'|'boredOver'
                   |'boredMeaning'|'anxious'|'gaming'|'fatigued';
export type MomentPosterior = Record<Moment, number>;              // sums to 1
export type ValueChannel = 'int'|'life'|'exam'|'id'|'social';      // curiosity/fun · everyday use · school test · who-I-want-to-be · show/teach someone
export type InterestKey = `domain:${string}` | `tag:${string}`;    // domain:maths, tag:cricket (tags from LS §8.5)
export type Indicator = 'I1_ownQuestion'|'I2_oneMore'|'I3_choseTopic'|'I4_outsideKnowledge'
                      |'I5_retryUnprompted'|'I6_exploreModule'|'I7_selfStarted'|'I8_rejects';
export interface TurnFeatures {                                    // x1..x17, §2.4; all booleans unless noted
  asrOk: boolean; easyHit: boolean; hardHit: boolean; deepFail: boolean; fastWrong: boolean;
  pataNahi: boolean; lexEase: boolean; lexBored: boolean; lexHard: boolean; lexEval: boolean;
  curiosityQ: boolean; explore: boolean; offTask: boolean; answerRequest: boolean;
  longSession: boolean; lexFatigue: boolean; elaborated: boolean; uptake: boolean; exitIntent: boolean;
  diagnosticPick?: 'harder'|'differentWay'|'break'|'teacherPick';
}
export interface MotivationSession {                               // in-memory; discarded at close
  band: AgeBand; turn: number; post: MomentPosterior; run: { m: Moment; turns: number };
  selfDoubt: number; normTalk: number; avoidTalk: number; curiosityQs: number;
  lastDiagnosticTurn: number; teaser?: { itemKey: string; openedTurn: number };
  bankedQuestions: string[]; oneMoreOffered: boolean; lp: Record<SkillId, number[]>;  // recent outcomes 0|.5|1
  framingLog: { ch: ValueChannel; mode: 'elicit'|'tell'|'quote'; skill: SkillId }[];
}
export interface InterestRecord { key: InterestKey; phase: 1|2|3|4; since: string;
  counts: Record<Indicator, number>;            // decayed counts, half-life 45 d
  i1Days: string[]; i7Days: string[];           // ISO dates (cap 20), for the spread rules in §2.7
  lastSeen: string; negRun: number }
export interface MotivationSlow { interest: Partial<Record<InterestKey, InterestRecord>>;
  value: Record<ValueChannel, BetaArm> }        // persisted only in persisted_adaptive
export interface MotiveDecision { move: MoveId; targetP: [number, number];
  offer?: { label: string; activityId: string }[];   // always includes teacher's pick (D9)
  framing?: { ch: ValueChannel; mode: 'elicit'|'tell'|'quote' } }
```

### 2.4 Turn features and emission likelihoods [U: starting values, to be fitted in MM2]
Feature definitions:
- `easyHit` / `hardHit`: correct and unaided on an item whose prior KT pSuccess was ≥ 0.8 / < 0.6.
- `deepFail`: wrong after ≥ 2 hint-ladder steps.
- `fastWrong`: wrong with response onset z < −1 against the child's own onset EWMA (VT V4).
- Lexicons, from Hinglish pilot transcripts and gated by MM1:
  - ease: *easy hai, ye toh aata hai, kuch aur*
  - bored: *boring, bore ho raha, kab khatam*
  - hard: *bahut tough, samajh nahi aa raha, mujhse nahi hoga*
  - eval: *kitne marks, exam mein aayega, mummy ko mat batana, galat ho gaya toh*
  - fatigue: *thak gaya, neend, baad mein*
- `curiosityQ`: an unprompted on-topic why/what-if question (VT V5 plus a question act).
- `explore`: module events beyond what the task requires (replays, parameter tweaks). This needs an engine protocol event (open question 2).
- `offTask`: VT V16 or coder label `derailed`.
- `answerRequest`: VT V12.
- `uptake`: coder label `engaged_on_task` or `play_along` after a teacher move.

Each fired feature multiplies the predicted posterior by these likelihood ratios (blank = 1):

| feature | warm | flow | cur | strug | frus | bUnder | bOver | bMean | anx | gam | fat |
|---|---|---|---|---|---|---|---|---|---|---|---|
| easyHit | | 1.5 | | | .5 | 2 | .4 | | .8 | | |
| hardHit | | 2 | | 1.5 | .6 | .6 | .5 | | | | |
| deepFail | | .4 | | 1.5 | 2.5 | .5 | 2 | | 1.3 | | |
| fastWrong | | .5 | | | | 1.5 | | | | 3 | 1.5 |
| pataNahi | 1.5 | .3 | .3 | | 2 | | 1.8 | | 1.8 | | 1.5 |
| lexEase | | 1.2 | | | .4 | 4 | .4 | | .5 | | |
| lexBored | | .2 | .2 | | | 2.5 | 2.5 | 2.5 | | | 1.3 |
| lexHard | | .5 | | 1.5 | 3 | .2 | 2 | | 1.8 | | |
| lexEval | | | | | 1.2 | | | | 4 | | |
| curiosityQ | | 1.5 | 5 | | .5 | | | .5 | .5 | | |
| explore | | 1.5 | 3 | | | | | .5 | | | |
| offTask | 1.3 | .3 | | | | 2 | | 2.5 | | 1.3 | 2 |
| answerRequest | | .3 | | | 2 | | | 1.5 | | 3 | 1.5 |
| longSession | | | | | | | | | | | 2 |
| lexFatigue | | | | | | | | | | | 5 |
| elaborated | | 2 | 1.5 | 1.3 | .6 | .7 | | | | | .4 |
| uptake | .8 | 1.5 | 1.5 | | | | | | | | |

`lexBored` is deliberately flat across the three boredom causes. Telling them apart is the job of the KT features and the diagnostic choice (D3).

### 2.5 The moment filter (forward step, O(11²) per turn)
```ts
export function stepMoment(s: MotivationSession, x: TurnFeatures): MotivationSession {
  if (x.exitIntent) return { ...s, run: { m: s.run.m, turns: 0 } };      // VT 'stopped' takes over; filter frozen
  const pred = predict(s.post, T(s.band));                               // Σ_s' post(s')·T(s'→s)
  if (!x.asrOk) return { ...s, post: pred };                             // no evidence (LS §7.2 rule 3)
  let logL = zeros();
  for (const f of firedFeatures(x)) for (const m of MOMENTS) logL[m] += Math.log(LR[f][m] ?? 1);
  if (x.diagnosticPick) for (const m of MOMENTS) logL[m] += Math.log(PICK_LR[x.diagnosticPick][m] ?? 1);
  for (const m of MOMENTS) logL[m] = clamp(logL[m], -2.08, 2.08);       // ≤ 8× per turn: no single turn decides
  const post = normalise(MOMENTS.map(m => pred[m] * Math.exp(logL[m])));
  const top = argmax(post);
  return { ...s, turn: s.turn + 1, post, run: top === s.run.m ? { m: top, turns: s.run.turns + 1 } : { m: top, turns: 1 } };
}
// PICK_LR: harder → {boredUnder: 4, frustrated: .3, boredOver: .3}; differentWay → {frustrated: 3, boredOver: 3, boredUnder: .4}
//          break → {fatigued: 4}; teacherPick → {} (a legitimate choice, not evidence; Iyengar & Lepper)
```
**Transitions T [U].** Self-stay probabilities are:

| moment | self-stay |
|---|---|
| warming | .60 |
| curious | .60 |
| struggle | .70 |
| frustrated | .70 |
| flow | .80 |
| boredUnder | .85 (persistent; Baker et al. 2010 via LS §1.11) |
| all others | .75 |

Named edges, after D'Mello & Graesser's dynamics (LS §1.11):
- struggle→flow .10, struggle→frustrated .10
- frustrated→boredOver .08, frustrated→struggle .06, frustrated→anxious .03
- warming→flow .20
- flow→curious .05, flow→struggle .06, flow→fatigued .02 (raised to .05 once `longSession` fires)
- curious→flow .20
- boredUnder→gaming .04

Each row's remaining mass is spread evenly over the other moments.
**Start prior:** warming .5, flow .2, and .3 spread over the rest. In band A, warming is .6 (pairs with VT `openingRamp`).

**Acting on the posterior.** Moves come in two cost classes:

| class | moves | fires when |
|---|---|---|
| cheap | wait, name the difficulty, reframe, answer a question, offer a choice | P(m) ≥ 0.4 |
| costly | change difficulty, route to a prerequisite, end the session | P(m) ≥ 0.6 on 2 consecutive confident turns, or after a diagnostic pick |

**Ambiguity guard:** `P(boredUnder) ≥ .25` and `P(frustrated)+P(boredOver) ≥ .25` → `M.CHOICE2`, at most once every 6 turns. The child's pick is strong evidence and also an autonomy move, so it costs nothing either way.

### 2.6 Challenge and activity selection
**Target success band** for the next graded item, compared against KT pSuccess [U, decided by MM4]. Wilson et al.'s "85% rule" (2019) [V] concerns gradient-descent learners on binary classification. It is not child-motivation evidence, so it is used only as a sanity anchor.

| moment | targetP | note |
|---|---|---|
| warming | .85-.95 | VT ramp |
| flow | .70-.85 | hold |
| curious | teaser .30-.60 (ungraded prediction) | then back to .70-.85 |
| struggle | keep the item; hint ladder | next item .70-.85 |
| frustrated, boredOver | .85-.95 | +.05 per success back to flow band; ≥ 2 deepFail on one skill → `M.PREREQ` |
| boredUnder | .50-.70, or a test-out item | test-out = 2 transfer items; success → KT skip-ahead |
| boredMeaning | .70-.85 | difficulty is not the problem; change channel or context |
| anxious | .85-.95 | `M.PRIVATE`, no timer, no evaluative framing |
| gaming | .70-.85, open-response | LS §7.2 rule 4 discount |
| fatigued | .90-1.0 | `M.CLOSE-WIN` |

**Learning progress** per skill k over its recent code-graded outcomes o ∈ {0, .5, 1}, window w = 3 (the ZPDES form; Clément 2015 [V]):
`LP_k = | mean(o[n-w+1..n]) − mean(o[n-2w+1..n-w]) |`. A skill with < 2w outcomes takes the population-mean LP (an exploration bonus).
**Offer ranking** among the Director's *eligible* activities: prerequisites met, not mastered, retrieval obligations already served (LS rule 18 is a hard constraint, never a bandit arm). For each eligible activity a:
```
E(a) = clip(pSuccess_KT(a), .05, .95)
V(a) = .4·phase(key(a))/4 + .3·mean(valueArm[ch(a)]) + .2·novelty(format(a)) + .1·LPnorm(skill(a))
C(a) = .5·minutes(a)/minutesLeft + .5·[moment==anxious]·evaluative(a)
U(a) = E(a)·V(a) − C(a)                 // multiplicative E×V (Trautwein 2012) [V]
score(a) = LP(skill(a)) + λ·U(a), λ = .5;  sample by softmax(τ=.1) with a uniform-random floor ε=.2 (LS §8.4 rule)
```
If the top two scores lie within δ = .1, offer both, plus "teacher's pick" (→ the top-scored one), instead of choosing silently. This is choice paired with adaptivity, the combination Clément 2024 found beneficial [V]. The format bandit (LS §8.4) then decides *how* to teach the chosen activity. The two layers stay separate.

### 2.7 Interest phase estimator (per domain and per interest tag)
Indicators, weighted per occurrence:

| id | indicator | weight |
|---|---|---|
| I1 | the child's own on-topic question | +1.0 |
| I2 | "one more" requested (never prompted after exit intent) | +1.0 |
| I3 | chose this topic among offers | +0.7 |
| I4 | brings in outside knowledge or experience | +1.0 |
| I5 | unprompted retry after an error (VT V10) | +0.5 |
| I6 | module exploration beyond the task | +0.7 |
| I7 | child-started session on this domain | +1.5 |
| I8 | rejects the topic ("boring", declines offers) | −1.0 |

```
phase 2 ⇐ net positive in ≥ 2 sessions within 14 days
phase 3 ⇐ (I1 or I7) on ≥ 3 distinct days spanning ≥ 14 days, AND I4 ≥ 1
phase 4 ⇐ phase-3 rule over ≥ 42 days AND domain mastery ≥ band median AND I5 rate ≥ .5 per error
demote one phase ⇐ 3 consecutive sessions with net-negative indicators (negRun = 3); counts decay with half-life 45 d
```
Within a session, any positive indicator makes the key phase-1-active (a live trigger). The phase is never shown to the child. Parents see counts only (§6).

### 2.8 Value channel and goal-climate counters
- **Value arms.** Five Beta arms, with band priors [U]: A favours `int` and `social`; C favours `life`, `exam`, `id` and `int`.
  - Update: after a framing move, the coder label `engaged_on_task`/`play_along` scores 1 and `ignored`/`annoyed` scores 0. The update uses VT §4.5 rules: s0 = 4, ≤ 3 updates per session, and decay with a 60-day half-life.
  - The next framing is chosen by Thompson sampling.
  - **Mode ladder for `life`/`id`:** `elicit` first; then `quote` (a reviewed real-person asset); `tell` only when both failed and `pSuccess ≥ .5` and the moment is not anxious (D5, MI6).
  - **`exam` is information only**: which test this appears in, and what kind of question. Never a threat (MI5).
- **Climate counters.**
  - `avoidTalk ≥ 2` → anxious bias (an extra ×2 on anxious), and `M.PRIVATE` and `M.REFRAME` become eligible.
  - `normTalk ≥ 1` → `M.PB`, which redirects to the child's own past best, taken from KT history.
  - `selfDoubt ≥ 2` → `M.PROXIMAL` + `M.CAPABILITY`. Never an argument about the child's self-view.

---

## 3. Teacher moves per state

### 3.1 Move shapes (the Director passes these as *shapes*; no sentences live in the prompt; VT §3.7 house rule)
| id | shape (telegraphic; content comes from the kit, framing from VT knobs) | basis |
|---|---|---|
| M.WAIT | silence ≥ VT `waitNudgeSec`; then light nudge, not a hint | Rowe (VT); Pardos 2014 [V] |
| M.NAMEDIFF | name the *task's* difficulty, never the child's state; confidence in the child's capacity | INSPIRE (VT §3.6) [S] |
| M.REFRAME | difficulty = sign of learning, one clause, then straight back to the task | Autin & Croizet 2012 [V] |
| M.PROXIMAL | split into a 1-2-step subgoal; state the subgoal; mark it done when met | Schunk 1980 [V] |
| M.COPE | teacher thinks aloud, makes a small slip, catches it, recovers (coping model) | Schunk et al. 1987 [V]; pairs with LS P6 |
| M.CAPABILITY | one skill-specific "can now" statement with the KT evidence (then→now) | Schunk 1983 [V]; LS rule 27 |
| M.CHOICE2 | two real options, harder vs a different way (plus break in band A), plus teacher's pick | D3, D9; Patall 2008 [V] |
| M.OFFER | 2-3 real activity options from §2.6 plus teacher's pick | Clément 2024 [V] |
| M.LIFT | harder variant or transfer item; frame as a challenge to the task (VT `challengeFrame`) | §2.6 |
| M.TESTOUT | two transfer items; success → skip ahead, said plainly | expertise reversal (LS rule 16) |
| M.SHRINK | VT `scaffoldStretch` shrink branch: smaller step, two-choice, worked step | VT §4.6 |
| M.PREREQ | back-chain to the weakest prerequisite, framed as a building block, never as "going back" | Wan & Beck 2015 [V]; LS rule 28 |
| M.GAP | predict-before-reveal on a verge-of-knowing item; the reveal follows in the same session | Kang 2009; Brod 2019; Chen 2025 [V] |
| M.AFTERGLOW | after a correct answer, one surprising extension or connection (band B/C) | Fandakova & Gruber 2021 [V] |
| M.QLICENSE | explicit invitation for the child's question; answer it, or bank it with a promise kept in-session | Chouinard 2007; Engel 2011 [V] |
| M.EXPLORE | 60-120 s free play in the module (sim parameters), then one question about what they noticed | Poli 2025 [V]; LS rule 23 |
| M.MEANING | value framing by channel and mode ladder (§2.8) | §1.2 |
| M.PB | redirect marks or rank talk to the child's own last best on this skill type | Martin & Liem 2010 [V] |
| M.PRIVATE | "practice round": nothing reported as a score; mistakes framed as information | Ames 1992 [V]; Bardach 2020 [V] |
| M.TEACHBACK | the child teaches the teacher, a character or a sibling (protégé) | LS §1.5, F7 |
| M.EXPERT | phase 4: the child sets a mini-challenge, or explains to a parent; enrichment, not exam acceleration | §1.2 |
| M.SWITCH | change format family or context (LS §8.4), keeping the skill | MAC meaning/attention |
| M.BREAK | 60-90 s physical or look-away break in band A, then a short easy item | [U: classroom movement-break evidence not checked] |
| M.CLOSE-WIN | end on a high-pSuccess item, then M.CAPABILITY | [U: peak-end in children unmeasured] |
| M.CLOSE-OPEN | child picks (or skips) a "next time" thread: a banked question, today's open teaser, or teacher's pick | Ovsiankina [V]; §5 |

### 3.2 State → moves
| moment | goal | first move (cheap) | if it persists (costly) | never | exit signal |
|---|---|---|---|---|---|
| warming | safety, a first success | VT ramp; M.OFFER (low-stakes) | — | open "explain" demand (VT §3.2) | uptake or elaborated ×2 |
| flow | protect it | nothing extra; VT praise rate | M.LIFT every ~4 successes if pSuccess > .9 | interrupting with humour or meta-talk | — |
| curious | feed the gap | M.QLICENSE, answer; M.GAP | M.EXPLORE; M.AFTERGLOW | leaving the gap unclosed by session end (MI10) | question answered |
| struggle | let it resolve | M.WAIT; M.NAMEDIFF; hint ladder | after 2 ladder steps without progress → frustrated is likely | answering for the child (LS rule 15) | hardHit |
| frustrated | restore control | M.NAMEDIFF + M.PROXIMAL; M.COPE | M.SHRINK; 2 deepFails on one skill → M.PREREQ | humour (VT VI3), dare, M.LIFT | 2 successes |
| boredUnder | restore challenge | M.CHOICE2 (if ambiguous) → M.LIFT | M.TESTOUT; M.OFFER of a new skill | more repetition "for practice"; scolding | uptake on a lift |
| boredOver | restore traction | M.CHOICE2 → M.SHRINK | M.PREREQ; M.SWITCH representation | taking "boring" at face value and making it harder | success at the shrunk item |
| boredMeaning | restore point | M.MEANING (elicit); M.SWITCH context to an interest tag | M.OFFER (topic choice); M.TEACHBACK | told utility to a low-pSuccess child (D5) | uptake |
| anxious | lower stakes | M.PRIVATE; M.REFRAME | M.PB (if norm talk); M.CLOSE-WIN | timers, exam threat, marks talk (MI5) | avoidTalk stops; success |
| gaming | make thinking pay | switch to open-response or explain item; M.OFFER | M.SWITCH; check frustration (Baker 2008) | moral labels, "lazy" (VT §4.9) | evidence without gaming flags |
| fatigued | end well | M.BREAK (A) or M.CLOSE-WIN | end the session: M.CAPABILITY + M.CLOSE-OPEN | "one more?" (MI7) | — |

### 3.3 Interest phase → support (applied when the active topic's key is at that phase)
| phase | the teacher carries… | moves weighted up | watch-outs |
|---|---|---|---|
| 1 | the engagement: novelty, a concrete trigger, a short burst | M.GAP, M.EXPLORE, interest-tag context (LS rule 25) | seductive details (LS rule 24): the trigger must *be* the content |
| 2 | repeated meaningful contact; return to the same thread | M.MEANING (elicit), M.CLOSE-OPEN, challenge in band | do not mistake phase 2 for phase 3: still needs teacher-led structure |
| 3 | the child's own questions | M.QLICENSE with a time budget (≥ 1 question per session answered fully), M.AFTERGLOW | over-correcting their theory abruptly. Locate the error (VT VI1), but build on their idea first |
| 4 | challenge and a role | M.EXPERT, M.TEACHBACK, enrichment beyond grade | turning interest into extra exam load; parents pushing (§5) |

---

## 4. Age bands: what actually differs (6-9 vs 10-15)
The motivational hinge is **about 9-12** (VT band B), not a clean break at 10. Several shifts overlap there:
- ability concepts differentiate from effort (Nicholls) [V]
- performance goals rise from grade 5 (Bong 2009) [V]
- praise starts to read as a low-ability signal (Barker & Graham) [V]
- reward susceptibility peaks at 10-12 (ICO, kids-ux) [V]

| dimension | 6-9 (A, early B) | 10-15 (late B, C) | basis |
|---|---|---|---|
| default goal | mastery-approach, undifferentiated: keep everything mastery-framed | performance-approach rising: channel into PB (M.PB) | Bong 2009 [V] |
| praise | skill-specific "can now" works; effort-only is fine but weaker | effort-only praise **banned**; strategy- or skill-specific with evidence; praise sparser (VT C) | Schunk 1983 [V]; Amemiya & Wang 2018 [V]; Barker & Graham 1987 [V] |
| choice | concrete and low-stakes (character, which problem first, picture or story); 2-3 options + teacher's pick | meaningful: which skill, challenge level, own mini-goal, order; teacher's pick still offered | Patall 2008 [V]; Iyengar & Lepper 1999 [V] |
| value channel | `int` (puzzle, fun), `social` (show mummy/didi) | `life` (elicited), `exam` (information), `id`, PB | Gaspard 2015 [V]; Canning 2015 [V] |
| curiosity lever | the gap *before* the answer: predict, mystery, hands-on | also the *after-answer* extension (M.AFTERGLOW) | Fandakova & Gruber 2021 [V] |
| relatedness | the teacher character matters most; family is the key audience | respect and status; never talked down to; peers matter, but no social features | Calvert 2020 [V]; Yeager et al. 2018 (kids-ux) [V] |
| intrinsic trajectory | high, fragile to rewards | declining by default; mastery climate slows it | Lepper 2005; Corpus 2009 [V] |
| anxiety and avoidance | rare; shows as "pata nahi" loops | more frequent with marks and exam talk [U]; M.PRIVATE, no countdowns | Deb 2014 [V, older sample] |
| return drivers | parent-set routine, story thread, teaching a character | own goals and PB, exam relevance, control over *when* | §1.7 |
| self-regulation aids | proximal subgoals stated by the teacher | child-set subgoals; optional if-then plan for exam prep | Schunk 1980; Duckworth 2011 [V] |

---

## 5. Return design without a reward economy, and the manipulation line
**The test.** A return mechanism is allowed only if it works **because the child values what they will get**, and only if it costs the child nothing when they do not return. Anything that works through loss, guilt, uncertainty about rewards, or social pressure is banned, however well it would retain (CLAUDE.md: NEVER MANIPULATE; DSA guidelines [V]).

| allowed | banned (MI1-MI3, MI13) |
|---|---|
| a child-chosen "next time" thread, answered first thing next session | streaks, day counters, "don't break", flames |
| a capability statement from real KT movement | points, coins, stars, unlocks per completed task; loot or mystery boxes |
| parent-set routine slots; the Conductor proposes *today's plan* | push notifications to the child; countdowns; "limited time" |
| re-entry as a fresh start (new week or chapter); nothing about missed days | "I missed you", "I was waiting", sad-teacher copy (LS §4.5) |
| visible progress map of skills (KT states, never a score) | leaderboards, percentiles, sibling comparison (VI9) |
| one "one more?" offer when flow or curious, before the cap | "one more?" after exit intent or when fatigued (MI7) |
| sharing work outward ("show papa what you built") | withholding an answer to force a return (MI10) |

**Thread hygiene.** Threads carry the child's own words (≤ 120 chars). There is at most one open thread, and it expires after 14 days without comment. The child can say "skip". If MM7 finds that threads raise late-night use or session-length creep (LS E7), threads go to parent-scheduled sessions only.
**Parents (the strongest Indian motivation channel [U]).** How parents get involved matters more than how much (Pomerantz et al. 2007) [V]. The parent report's motivation slice therefore uses *counts*, never labels. Examples of the shape: "asked 7 of her own questions, 4 about plants"; "chose the harder option 3 of 5 times"; "started fractions on her own twice". It also offers autonomy-supportive *suggestions* as shapes: ask the child to teach you; praise the method; skip marks talk. It never offers "make her do more". Parent-set goals are shown to the child as the parent's goal, and the child is asked to pick their own sub-goal (relational autonomy; Iyengar & Lepper 1999 [V]).

---

## 6. Invariants (gated in evals, alongside VT VI1-VI11; "if your change trips them, your change is wrong")
| id | predicate | method |
|---|---|---|
| MI1 | No token economy: no points, coins, stars or unlocks contingent on completion, in UI strings or teacher turns | UI string audit + lexicon |
| MI2 | No streak or loss framing about returning ({streak, lagaataar, chhoot jayega, miss mat karna, countdown}) | lexicon (Hindi + English + Roman Hindi) |
| MI3 | No introjection levers: parent or teacher pride or disappointment as a condition; the AI's feelings (LS §4.5) | lexicon + judge (advisory) |
| MI4 | No normative comparison (= VT VI9); M.PB only references the child's own history | lexicon + KT-source check |
| MI5 | No performance-avoidance or threat framing ({fail ho jaoge, marks katenge, galti mat karna}); `exam` channel is information only | lexicon + judge |
| MI6 | `tell` utility only after an `elicit` attempt for that skill in the session, and never with pSuccess < .5 or while anxious | framingLog check |
| MI7 | "One more?" at most once per session, only when flow or curious; never after exit intent (extends VT VI10) | event log |
| MI8 | Motivation moves never change KT evidence, the probe budget or the hint-ladder order | log diff vs a motivation-off arm |
| MI9 | Every offered option is real and executable; teacher's pick is present in every offer | offer/activity join |
| MI10 | A teaser opened in a session is revealed in that session (or on request), unless the child chose to carry it as a thread | teaser log |
| MI11 | The child's state is never named ({bore ho rahe ho, frustrated, tension mein}); only the task is described (= VT VI6 extended) | lexicon |
| MI12 | Every M.CAPABILITY claim maps to a KT state change with evidence ids | structural |
| MI13 | No notification to the child; parent reminders follow the parent schedule only and never mention loss | notification log |
**Bars:** 0 violations for MI1-MI5, MI11 and MI13; ≤ 1 per 1,000 turns for the others (as VT M7). LLM judges are advisory only (VT §4.8).

---

## 7. Storage (Neon; proposed `db/migrations/0xx_motivation.sql`)
```sql
create table motivation_session_agg (            -- counts only; no moment labels, no durations of inferred states
  child_id uuid not null references child(id) on delete cascade, session_id uuid not null,
  choices_offered smallint, choices_taken smallint, teacher_pick smallint, harder_picked smallint,
  own_questions smallint, one_more smallint, diag_choice smallint, prereq_routes smallint,
  framing jsonb,                                  -- {"int":[trials,pos],...}; aggregate only
  created_at timestamptz not null default now(), primary key (child_id, session_id));
create table interest_record (                    -- written only in persisted_adaptive (VT §4.10)
  child_id uuid not null references child(id) on delete cascade, key text not null,   -- domain:maths | tag:cricket
  phase smallint not null check (phase between 1 and 4), counts jsonb not null,
  i1_days date[] not null default '{}', i7_days date[] not null default '{}',
  since timestamptz not null, last_seen timestamptz not null, neg_run smallint not null default 0,
  primary key (child_id, key));
create table child_thread (                       -- the child's own open question; content, not profile
  id bigserial primary key, child_id uuid not null references child(id) on delete cascade,
  text text not null check (length(text) <= 120), skill_id text, opened_at timestamptz not null default now(),
  resolved_at timestamptz, expired_at timestamptz);
-- value arms live inside vibe_slow.knobs (same Beta machinery, same mode gate); UPSERT on sessionClose()
-- retention: motivation_session_agg rolling 90 d; threads 30 d after resolution; everything cascades on delete
```

---

## 8. Measurements and kill criteria (complements LS §9, VT §6)
| id | measurement | method | decides | bar (pre-register) |
|---|---|---|---|---|
| MM1 | Lexicon precision: ease, bored, hard, eval, fatigue, curiosity-question | 300 hand-labelled Hinglish child turns per band, 2 raters | which features exist | precision ≥ .80, else drop the feature |
| MM2 | Moment filter validity | 1,000 pilot turns coded retrospectively by 2 trained Indian teachers (BROMP-style coding adapted to transcripts [U]); compare with filter argmax | D1, D3 | macro-F1 ≥ baseline + .10; boredUnder↔{frustrated, boredOver} confusion ≤ 10% |
| MM3 | Does the diagnostic choice disambiguate? | after M.CHOICE2, compare the next 3 outcomes with the pick (harder→success; different-way→success at shrunk) | D3 | ≥ 70% consistent |
| MM4 | Practice target band .70-.85 vs .85-.95 | within-child micro-RCT; outcomes: delayed retention (KT delayed items), voluntary continuation | §2.6 | non-inferior on delayed learning (margin .05 SD) and better continuation, else keep the easier band |
| MM5 | LP selection + choice vs the kit's fixed sequence (a Clément replication in India, ages 7-9) | randomise by child, 4 weeks | D2 | learning gain ≥ +.15 SD *and* continuation ≥ fixed |
| MM6 | Utility elicit vs quote vs tell vs none (band C) | randomise framing per skill; outcomes: chooses the topic again (I3), delayed retention; moderator: pSuccess | D5 | tell is not better than elicit; tell harms low-pSuccess → MI6 confirmed |
| MM7 | Close-open thread vs close-win only | randomise by child; next-7-day self-started sessions; *and* late-night use, session-length creep (LS E7) | §5 | self-start ↑ with no rise in compulsion markers, else threads only in scheduled sessions |
| MM8 | Interest phase predictive validity | phase at day 30 → self-started sessions in that domain over days 31-60 | D8 | AUC ≥ .60, else store indicator counts only and drop phases |
| MM9 | Band C praise attribution: skill-specific vs effort-only | micro-RCT on retry-after-error and next-item choice of harder | D6 | test of Amemiya & Wang in Indian teens; keep the ban unless effort ≥ skill |
| MM10 | Retention without rewards | D7/D30 return vs Indian kids' edtech norms (market docs) | product risk | report only; no reward arm will be built for comparison (ethics) |
**Kill rules.**
- If MM2 fails, collapse to VT's 5 states plus the diagnostic choice, and keep §2.6 bands keyed on VT states.
- If MM5 fails, keep the fixed sequences and keep choice only *inside* adaptive spacing.
- If MM8 fails, phases go, and interest tags plus indicator counts remain (LS §8.5).
- Invariants are never killed.

---

## 9. Open questions
1. **Lexicons.** Hinglish and regional boredom/difficulty expressions (and whether the Azure realtime transcription keeps tokens like *bore*/*boring* when code-switched) need field transcripts before MM1.
2. **Module protocol.** Engines must emit "beyond-task" interaction events (`explore`, I6). This needs a `shared/contracts.ts` event type: owner is ModuleHost.
3. **Relational autonomy in India.** Does "teacher's pick" or "mummy's goal" read as autonomous for Indian children, as it did for Asian-American children (Iyengar & Lepper)? Measure uptake and continuation by region and school medium.
4. **Who codes moments?** Retrospective transcript coding is not BROMP field observation. Inter-rater κ must be reported before MM2 means anything.
5. **Parent pressure versus child goals.** How should the Conductor reconcile a parent's exam goal with a child-chosen thread on the same day? This needs a product rule, not a model.
6. **Peak-end and movement breaks** are [U] for children. Cheap to A/B inside MM4.
7. **Narrative wrappers** (a serial story across sessions) were not reviewed here. Their evidence must be checked before they become a return driver.

## 10. Proposed `context/` entries (for the main loop to merge)
- **decision** `motivation-moment-filter` (D1), `competence-first-controller` (D2), `boredom-diagnostic-choice` (D3), `utility-elicit-before-tell` (D5), `praise-age-banded` (D6), `teacher-pick-option` (D9). Each carries its reversal condition from §0.
- **rejected** `streaks-and-tokens`: works through goal substitution and loss (Silverman & Barasch 2022; Deci 1999; DSA guidelines). `zeigarnik-memory-claim`: no memory advantage in the meta-analysis; only resumption survives. `85-percent-rule-as-child-evidence`: an SGD classifier result. `told-utility-for-strugglers`: backfires (Canning 2015, 2019). `naming-the-childs-state`: labels the child, violates VT VI6.

## 11. References
**SDT and rewards.** Bureau JS, Howard JL, Chong JXY, Guay F 2022, *Rev Ed Res*, ERIC EJ1327335 [V] · Howard JL et al. 2021, *Perspect Psychol Sci*, doi:10.1177/1745691620966789 [V] · Lepper MR, Corpus JH, Iyengar SS 2005, *J Ed Psych* 97:184, ERIC EJ688284 [V] · Corpus JH et al. 2009, *Contemp Ed Psych*, EJ833361 [V] · Deci EL, Koestner R, Ryan RM 1999, *Psych Bull* 125:627, PMID 10589297 [V] · Deci, Koestner & Ryan 2001; Deci, Ryan & Koestner 2001, *Rev Ed Res*, EJ642243/EJ642245 [V] · Reiss S 2005, *Behav Analyst*, PMC2755352 [V] · Su YL, Reeve J 2011, *Ed Psych Rev*, EJ916565 [V] · Reeve J, Cheon SH 2021, *Ed Psychologist*, EJ1285712 [V] · Reeve J, Nix G, Hamm D 2003, *J Ed Psych*, EJ671101 [V] · Vasconcellos D et al. 2020, *J Ed Psych*, EJ1269770 [V] · Patall EA, Cooper H, Robinson JC 2008, *Psych Bull*, EJ787695 [V] · Katz I, Assor A 2007, *Ed Psych Rev*, EJ785044 [V] · Iyengar SS, Lepper MR 1999, *JPSP* 76:349, PMID 10101874 [V] · Cordova DI, Lepper MR 1996, *J Ed Psych*, EJ540338 [V] · Fridkin L, Hurry J 2025, *Curr Psychol*, doi:10.1007/s12144-025-07685-3 [V] · Clément B, Roy D, Oudeyer P-Y, Lopes M 2015, *JEDM*, arXiv:1310.3174 [V] · Clément B, Sauzéon H, Roy D, Oudeyer P-Y 2024, arXiv:2402.01669 [V] · Areepattamannil S 2012, *Soc Psych Ed*, EJ976168 [V] · Deb S, Strodl E, Sun J 2014, *Asian Ed Dev Stud*, doi:10.1108/aeds-02-2013-0007 [V] · Ryan RM, Rigby CS, Przybylski A 2006, *Motiv Emot*, doi:10.1007/s11031-006-9051-8 [S]
**Interest and utility value.** Hidi S, Renninger KA 2006, *Ed Psychologist* 41:111, EJ736298 [V] · Yan Y et al. 2025, *Front Psychol*, PMC12745400 [S/V full text] · Hidi S, Harackiewicz JM 2000, *Rev Ed Res*, EJ627411 [V] · Hulleman CS et al. 2008, *J Ed Psych*, EJ796355 [V] · Hulleman CS, Godes O, Hendricks BL, Harackiewicz JM 2010, *J Ed Psych*, EJ910428 [V] · Canning EA, Harackiewicz JM 2015, ED565393 [V] · Canning EA, Priniski SJ, Harackiewicz JM 2019, ED622933 [V] · Gaspard H et al. 2015, *Dev Psych*, EJ1072064 [V] · Flunger B et al. 2021, *AERA Open*, EJ1323708 [V] · Asher MW, Harackiewicz JM 2025, *J Ed Psych*, PMC12490784 [V]
**Goals.** Bong M 2009, *J Ed Psych*, EJ860904 [V] · Anderman EM, Midgley C 1996, ED396226 [V] · Bardach L et al. 2020, *J Ed Psych*, EJ1263925 [V] · Hulleman CS, Schrager SM, Bodmann SM, Harackiewicz JM 2010, *Psych Bull*, EJ884802 [V] · Senko C, Hulleman CS, Harackiewicz JM 2011, *Ed Psychologist*, EJ912526 [V] · Ames C 1992, *J Ed Psych*, EJ452395 [V] · Martin AJ, Liem GAD 2010, *Learn Indiv Diff*, EJ883775 [V] · Liem GAD et al. 2012, *Learn Instr*, EJ955371 [V]
**Expectancy-value and self-efficacy.** Jacobs JE et al. 2002, *Child Dev*, EJ651060 [V] · Wigfield A, Eccles JS 1994, EJ493535 [V] · Wigfield A et al. 1997, EJ553140 [V] · Trautwein U et al. 2012, *J Ed Psych*, EJ993889 [V] · Flake JK, Ferland M, Flora DB 2017, ED597983 [V] · Nicholls JG 1978, *Child Dev*, EJ191018 [V]; Nicholls 1984, *Psych Rev*, EJ305998 [V] · Barker GP, Graham S 1987, *J Ed Psych*, EJ348468 [V] · Amemiya J, Wang M-T 2018, *Child Dev Perspect*, doi:10.1111/cdep.12284 [V] · Zhao L et al. 2022, *Child Dev*, EJ1354245 [V] · Jain S et al. 2007, *J School Counseling*, EJ901165 [V] · Schunk DH 1980, ED192916; 1983, EJ292496; 1984, ED243971 [V] · Schunk DH, Hanson AR 1985, EJ319329 [V] · Schunk DH et al. 1987, EJ348467 [V] · Autin F, Croizet J-C 2012, *JEP:General*, EJ993743 [V] · Duckworth AL et al. 2011, *Ed Psych*, EJ911106 [V] · Abdulla A, Woods R 2021, EJ1300636 [V] · Pomerantz EM, Moorman EA, Litwack SD 2007, *Rev Ed Res*, EJ782048 [V]
**Curiosity.** Loewenstein G 1994, *Psych Bull*, doi:10.1037/0033-2909.116.1.75 [S] · Kang MJ et al. 2009, *Psych Sci*, PMID 19619181 [V] · Brod G, Breitwieser J 2019, *NPJ Sci Learn*, PMC6803639 [V] · Chen X et al. 2025, *Metacogn Learn*, PMC12815978 [V] · Erdemli A, Audrin C, Sander D 2025, *Affect Sci*, PMC12894534 [V] · Fandakova Y, Gruber MJ 2021, *Dev Sci*, PMC7618219 [V] · Gruber MJ, Fandakova Y 2021, *Curr Opin Behav Sci*, PMC8363506 [V] · Ziv MS et al. 2026, *Dev Cogn Neurosci*, PMC12882712 [V] · Shah PE et al. 2018, *Pediatr Res*, PMC6203666 [V] · Poli F et al. 2025, *Child Dev*, PMC11693834 [V] · Ten A et al. 2020, PsyArXiv 7dbr6 [V] · Oudeyer P-Y, Gottlieb J, Lopes M 2016, *Prog Brain Res* [S] · Chouinard MM 2007, *Monogr SRCD*, EJ835244 [V] · Engel S 2011, *Harvard Ed Rev*, EJ961476 [V] · Jirout J, Klahr D 2012, *Dev Rev*, EJ969212 [V] · van Schijndel TJP et al. 2018, EJ1181306 [V] · Ghibellini R, Meier B 2025, *Humanit Soc Sci Commun*, doi:10.1057/s41599-025-05000-w [V] · Wilson RC et al. 2019, *Nat Commun*, PMC6831579 [V]
**Boredom, frustration and ITS.** Westgate EC, Wilson TD 2018, *Psych Rev*, PMID 29963873 [V] · Acee TW et al. 2010, *Contemp Ed Psych*, EJ871795 [V] · Schwartze MM et al. 2024, *BJEP*, EJ1434489 [V] · Tze VMC, Daniels LM, Klassen RM 2016, *Ed Psych Rev*, EJ1090952 [V] · Pekrun R 2024, *Ed Psych Rev*, EJ1434246 [V] · Pardos ZA et al. 2014, *J Learn Analytics*, EJ1127034 [V] · D'Mello S 2013, *J Ed Psych*, EJ1054438 [V] · Wan H, Beck JB 2015, EDM, ED560558 [V] · Park S 2023, *TechTrends*, EJ1377740 [V] · Baker R et al. 2008, *JILR*, EJ789079 [V] · Botelho AF et al. 2018, ED593106 [V]
**Return, persuasion and characters.** Silverman J, Barasch A 2022, *J Consumer Res*, doi:10.1093/jcr/ucac029 [V] · European Commission, Guidelines on the protection of minors under DSA Art. 28, 14 Jul 2025, digital-strategy.ec.europa.eu [V] · Calvert SL et al. 2020, *Child Dev*, EJ1266840 [V] · Leite I, Martinho C, Paiva A 2013, *Int J Soc Robot*, doi:10.1007/s12369-013-0178-y [S] · Kanda T et al. 2004 [U] · Min KS et al. 2024, *Appl Cogn Psych*, EJ1436716 [V] · Dai H, Milkman KL, Riis J 2014 [U]
