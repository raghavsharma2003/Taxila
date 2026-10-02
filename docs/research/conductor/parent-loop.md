# The parent loop: the parent-facing agent, its conversations, alerts and policies

**Date:** 2026-10-02 · **Question:** reports are not enough. What should Taxila's parent-facing agent do from the
first conversation to the end of the year: intake (goals, worries, the child's history), the weekly voice or
WhatsApp summary, getting parents involved in ways that help (home activities, praise guidance), a "PTM" where
the parent talks to the AI teacher about the child, alerts (struggle, disengagement, wellbeing) and controls?
What do parental-involvement research and Indian parents' priorities say, and what policies bind the agent?

**Builds on, does not repeat:** `design/parent-experience.md` (PX1-PX10, O1-O9, dashboard, weekly report card,
PTM sketch §9, controls §10, alerts §11, visibility §12, cadence evidence §2), `learner/need-goals.md` (§5.3
parent "first meeting" slots S0-S7, §8 VOI check-ins, invariants N1-N12, Barger and Patall findings),
`learner/motivation-interest.md` §5 (parents as the motivation channel; MI1-MI13), `psychology/learning-over-time.md`
§6.3-§7 (claim thresholds L0-L3, banned wording), `conductor/orchestration-architecture.md` (C1-C9, event
envelope, Notifier, authority order §5.9), `conductor/day-cycle.md` (DC2, DC8, DC9, §10 notification caps),
`conductor/school-sync-homework.md` (SS12 PTM remarks, `ptm_note`), `safety/dpdp-deep.md` (NM-9).

**Owner directives applied:** Azure-only AI. The parent agent runs on Azure OpenAI first-party models only
(gpt-realtime-2.1 for voice, gpt-5.6 luna/sol for text, gpt-4o-mini-tts or Azure TTS for voice notes). The
task brief lists Claude on Foundry; `Taxila/CLAUDE.md` (2026-10-02) forbids it, and the CLAUDE.md wins.
Compliance is deprioritised. The child-safety floor (AI disclosure, Childline 1098 / Tele-MANAS 14416,
safeguarding hand-off) is product, and it binds this agent too.

**Tags:** **[V]** primary-source abstract or page read this session · **[S]** secondary or from memory of the
primary, not re-read this session · **[M]** must be verified before build · **[U]** Taxila design default or
estimate, to be measured · **[I]** my inference from the cited evidence. Web search was exhausted this session,
so sources were fetched directly through Europe PMC, the ERIC API and publisher pages. Numbers I could not
re-read are tagged [S] or [M], never [V].

---

## 0. Decisions on one screen

| # | decision | why | reverse if |
|---|---|---|---|
| PL1 | **The parent agent coaches the parent's role. It is not a reporting pipe.** Its job is to move parents toward the involvement that helps (talking about learning and its value, routines, process praise, a calm response to failure) and away from what hurts (doing or re-teaching homework, marks pressure, comparison). | Across 50 studies, middle-school involvement related positively to achievement *except homework help*, and academic socialization had the strongest association (Hill & Tyson 2009) [V]. Homework assistance r = −.15 with achievement across 448 studies (Barger et al. 2019) [V]. Math-anxious parents who helped often produced children who learned less maths (Maloney et al. 2015) [V]. | A micro-RCT shows that coaching content (praise cards, talk prompts) does not change parent behaviour (PLM4) *and* does not move delayed retention (PLM3) after 12 weeks; then cut to the report alone. |
| PL2 | **One character, two registers.** The parent talks to the child's own AI teacher, in a parent register ("aap", PTM tone), not to a separate "assistant". She is disclosed as an AI in every conversation and every voice note. | Indian parents judge tuition by "a person who knows my child" (parent-experience §1.1) [I]. A second persona would be a second assembler and a second floor to keep in step (inherited rule: one `compile()`). | A blind parent test (PLM9) prefers a separate "Taxila parent guide" voice, or parents report confusion about who teaches the child. |
| PL3 | **The parent agent is a worker under the Conductor, never a second decider.** It writes `parent.*` events and *proposals* (focus requests, schedule changes, goals). The Conductor validates and adopts them. It cannot edit the plan, the learner model or a lesson. | Orchestration C1 and C6 (agents emit events; only the Conductor decides) [repo]. Need-goals N4: parent beliefs are not evidence [repo]. | Never for the authority order. Latency complaints about proposals → make adoption synchronous inside the same request, not give the agent write access. |
| PL4 | **Every sentence about the child is grounded in a ParentBrief fact id**, and a code claim-checker runs on every agent turn (voice transcripts too). An unbacked claim forces a correction on the next turn and writes an incident. | PX1 "evidence or silence" [repo]. Parents' beliefs about their children are often wrong (Dizon-Ross, via need-goals §1) [S], so the agent must calibrate beliefs, not echo them. "A model never grades" [repo]. | Never removed. The checker's precision and recall are measured (PLM7), and the rule stays even if the checker is noisy. |
| PL5 | **Intake is a conversation that collects facts, worries and history, then turns each worry into a check.** A worry becomes a `probe_request` plus a dated `commitment` ("I will check fractions this week and tell you on Sunday"). It never becomes a label or a skill state. | Need-goals §5.3 and N4 [repo]. Tutors and parents misdiagnose (Chi 2004; Dizon-Ross) [S]. A promise that is then kept is how trust is built with a burned customer (LocalCircles 81% trust issues, via parent-experience) [S, I]. | Parents do not complete intake (PLM1 < 50% reach P5) → shorten it to the three highest-VOI slots. |
| PL6 | **One home activity and one praise cue per week, specific and doable without the maths**, chosen from a verified catalogue by code, tied to a ledger fact, and adapted to what the parent says they can do. | Kraft & Rogers 2015: actionable, improvement-focused messages cut failure 15.8% → 9.3% [S, via parent-experience]. Brief parent-child maths story time raised achievement, especially for children of math-anxious parents (Berkowitz et al. 2015, n = 587) [V], though a re-analysis disputes the main effect (Frank 2016) [V]. Process praise predicts later motivation (Gunderson 2013, 2018) [V]. Indian mothers' home-activity programme: +0.032 SD maths, cheap (CHAMP, Banerji/Berry/Shotland, J-PAL) [V]. | PLM3 A/B (activity vs none) finds no delayed-retention gain *and* PLM5 opt-out rises; then make it opt-in only. |
| PL7 | **The PTM is on demand, voice or text, in the app, and ends in written commitments.** WhatsApp carries only scoped, button-led flows plus one narrowly scoped "ask about your child" lane after a BSP check. | Angrist et al. (Botswana): SMS alone no effect, SMS plus a weekly call +0.12 SD [S, via parent-experience]. Meta bans general-purpose AI chatbots on the WhatsApp Business API from 15 Jan 2026; task bots "ancillary to a legitimate business service" stay allowed [V, respond.io summary]. Jeynes 2025: technology-based parent-teacher communication showed no significant effect except partly in elementary school (31 studies, >20,000 students) [V]. So a channel alone does not produce the effect, and the content of the conversation has to carry it [I]. | PTM use < 15% of active parents per month after 3 months (PLM6) and the users show no PLM3/PLM4 difference; then fold the PTM into the weekly voice note. |
| PL8 | **Alerts come in five classes with different owners:** safety (protocol-owned, cannot be turned off), wellbeing (child-stated only, gated by age and consent), struggle (learning, with a parent action), routine change (facts, folded into the weekly letter), and commitments (a promise fulfilled). **There is no absence push and no "come back".** A long gap appears as a neutral fact plus one "change the time or pause?" button inside the weekly letter that is sent anyway. | DC2 and PX7 are floors [repo]. Rogers & Feller 2018: parents underestimate absences, and *information* that corrects the belief cut chronic absenteeism ≥10% (n = 28,080) [V]. So facts belong in the report. Nagging belongs nowhere. | Never for the bans. The weekly-letter gap line is removed if it raises opt-out (PLM5). |
| PL9 | **Wellbeing is never inferred.** Only explicit child statements, classified by the safety monitor into a wellbeing tier, can produce a wellbeing alert. For ages 10-15 the teacher first encourages the child to tell the parent, and asks before telling. Family-related content goes to the safeguarding protocol. | Vibe-temperament: no affect inference, no trait diagnosis [repo]. Adolescents' parents learn mainly through the child's own disclosure, not surveillance (Stattin & Kerr 2000, n = 703) [V]. OpenAI's teen alerts are human-reviewed before parents are contacted (TechCrunch, 2025-09-29) [V]. Character.AI shares time and characters with parents but "not … chat content", and only when the teen opts in (2025-03-25) [V]. | A safeguarding advisor specifies otherwise, or PLM8 shows that 10-15 disclosures drop after a parent alert. |
| PL10 | **Parent requests that would harm the child are declined with an alternative**: threats ("tell him he'll fail"), pressure scripts, comparison, extra hours past the band cap without a PIN override, "report what she says about me", reward bribes. | MI3 and MI5 (no introjection, no threat framing) [repo]. NCERT 2022: 81% of students in grades 6-12 named studies, exams and results as their cause of anxiety [V, via need-goals]. Parents who see failure as debilitating focus on performance, and their children come to believe intelligence is fixed (Haimovitz & Dweck 2016) [V]. | None. Same logic as the streak ban. |
| PL11 | **Transparency to the child is part of the loop.** The teacher tells the child what the parent will receive this week ("I've asked Papa to ask you about fractions"). A 10-15 child can open "What Mummy-Papa see". | Stattin & Kerr: disclosure, not tracking, carries the benefit [V]. Parent-experience §12 visibility split [repo]. | PLM8 finds that the transparency line lowers child engagement or disclosure. |
| PL12 | **The agent never sells, never claims a human reviewed anything, and never promises a human callback that no rota backs.** Billing and complaints go to a named human support queue with an SLA, and the agent says so plainly. | NCPCR/BYJU'S hard-selling history [S]. PX9 relay-claim gate [repo]. N12 no diagnosis-to-sell [repo]. | None. |

---

## 1. Evidence, compressed to what changes the design

### 1.1 Parental involvement: what kind matters more than how much

| study | finding | design consequence |
|---|---|---|
| **Hill & Tyson 2009**, *Dev Psych* 45(3):740-763, 50 studies, middle school [V abstract] | "Parental involvement was positively associated with achievement, with the exception of parental help with homework. Involvement that reflected academic socialization had the strongest positive association". Academic socialization means talking about the value and utility of education, linking schoolwork to the child's goals, aspirations, and learning strategies. Reported pooled correlations: academic socialization r ≈ .39, school-based r ≈ .19, home-based r ≈ .03 [M: re-read the paper's Table 2] | For classes 6-9 the agent coaches **talk**: "ask him what he's learning and where it shows up", linking a skill to the child's *own* stated interest (need-goals §4.6 aspiration stays child-stated). It does not coach supervision or checking. |
| **Barger, Kim, Kuncel & Pomerantz 2019**, *Psych Bull*, 448 studies, 480,830 families [V] | involvement r = .13-.23 with academic adjustment, also with social (.12) and emotional (.17) adjustment; homework assistance r = −.15 with achievement; "little variation due to age, ethnicity, or socioeconomic status" | Parent involvement is worth building for every family. "Help with homework" is the one thing the agent never asks for. Homework help lives with the AI teacher (school-sync §5). |
| **Jeynes 2005 / 2007 / 2012 / 2024 / 2025** (ERIC EJ690782, EJ748034, EJ969713, EJ1402483, EJ1473584) [V abstracts] | urban elementary: involvement ≈ 0.70-0.75 SD across academic variables (41 studies). Urban secondary: ≈ 0.50-0.55 SD (52 studies). **Involvement *programmes***: ≈ 0.3 SD (51 studies). Parental *expectations* component significant across ages, races and nationalities (54 studies, 2024). **Technology-based communication: no significant effect except "to some degree at the elementary school level"** (31 studies, 20,000+ students, 2025) | Correlations of naturally occurring involvement (0.5-0.75) are much larger than what programmes achieve (0.3), so selection inflates the natural figure [I]. Plan for programme-sized effects. Messaging alone shows no effect, so a message is only the delivery vehicle, and the parent-child interaction it prompts has to do the work (PL6, PL7). |
| **Pomerantz, Moorman & Litwack 2007** [S, via motivation-interest §5] | the *how* (autonomy-supportive, process-focused, positive affect, positive beliefs about the child's potential) matters more than the *how much* | Praise guidance and the failure-response cue are the agent's core content. |
| **Patall, Cooper & Robinson 2008** [S, via need-goals §1.6] | rule-setting had the strongest association with homework outcomes; direct help was negative in middle school and for maths | The routine (anchor time, a quiet place, phone handed over) is the parent's lever, as in DC1 |

### 1.2 Home activities, maths anxiety, praise, failure, comparison

- **Maloney et al. 2015**, *Psych Sci*, grades 1-2 [V]: children of math-anxious parents "learn significantly
  less math … but only if math-anxious parents report providing frequent help with math homework". So home
  activities never ask the parent to *teach or check* maths. The parent *listens* while the child explains,
  or runs a short everyday activity with the answer built in.
- **Berkowitz et al. 2015**, *Science*, n = 587 [V]: app-delivered maths story time raised achievement
  "especially for children whose parents are habitually anxious about math". Frank 2016 [V] re-analysed and
  found "no significant effect … on math performance" as a main effect. Honest reading: the benefit is most
  plausible for children of anxious parents. Taxila measures its own effect (PLM3) and does not quote this as proof.
- **CHAMP / MLAP, Bihar and Rajasthan** (J-PAL/Pratham, ~9,000 households) [V]: weekly home visits with
  workbooks for mothers gave +0.032 SD maths (+0.056 with literacy classes). Mothers were 3.0-4.1 pp more
  likely to say they were responsible for the child's education. This is the closest Indian evidence. Effects
  were small and cheap, and the programme moved the mother's sense of her role. Expect no more than this [I].
- **Process praise** predicts motivational frameworks and later achievement (Gunderson 2013, n = 53; 2018
  4th-grade follow-up). Perceived *process* praise predicts learning goals, and *person criticism* predicts
  fixed theories (Gunderson et al. 2018, *JECP*) [V]. **Caution:** a preregistered test (Bennett-Pierre et al.
  2024, n = 150) found no person-vs-process difference in its primary analysis. Exploratory analyses found
  process praise beat no praise on persistence (d = .61) [V]. So the cue is "name the specific thing she did",
  and it is not sold as a mindset intervention (learning-science rule 21).
- **Failure mindsets** (Haimovitz & Dweck 2016) [V]: children perceive their parents' *failure* mindsets, and
  parents who see failure as debilitating "focus on their children's performance and ability rather than on
  their children's learning". The most useful single cue is **how to react to a wrong answer or a bad test**,
  so it is offered after every test result the parent enters (need-goals §8.2) [I].
- **Comparison discourages**: exposure to exemplary peers "caused a large proportion of students to quit" a
  course (Rogers & Feller 2016) [V]. This backs PX6 and the decline of "how does she compare to her cousin?".

### 1.3 Monitoring, disclosure, teens, AI-product precedents

- **Stattin & Kerr 2000**, n = 703 [V]: "parental knowledge came mainly from child disclosure", and disclosure
  was the source most tied to lower delinquency. Monitoring rules *backfired* for adolescents who felt
  overcontrolled (Tilton-Weaver et al. 2013) [V]. So for ages 10-15 the agent optimises for the child telling
  the parent (PL9, PL11), and transcripts stay on-request with notice (parent-experience §12).
- **ChatGPT parental controls (29 Sep 2025)** [V, TechCrunch]: parents get quiet hours and voice, memory and
  image toggles. Acute-distress signs are reviewed by "a small team of specially trained people", and parents
  are then contacted by email, SMS and push. Whether parents see transcripts was not stated in the source read [M].
- **Character.AI Parental Insights (25 Mar 2025)** [V]: weekly time and top characters, "not … chat content",
  opt-in by the teen. **Reading [I]:** the industry pattern is that parents get time, activity and safety
  signals, teens keep their conversations, and a human reviews before a distress alert goes out. Taxila shows
  more (learning evidence, all transcripts under 10) and keeps that pattern for teens' personal talk.

### 1.4 What Indian parents value, and the pressure risk that comes with it

- **They already pay for help.** 27.0% of students take private coaching (NSS CMS 2025) [S, parent-experience
  §1.1]. Taxila replaces the tuition teacher, so it is judged on the tuition ritual: syllabus coverage, test
  readiness, a remark, a PTM, and a teacher who "knows" the child.
- **They are anxious about exams, and so are the children.** NCERT 2022 (n = 3,79,842) found 81% of students
  named studies, exams and results as the source of anxiety [V, need-goals §1.7]. Deb, Strodl & Sun 2015
  (Kolkata high schoolers) reported about two-thirds feeling parental pressure for better marks [S: not
  re-read; verify before quoting a number].
- **Many cannot check the work.** ASER 2016: 46.7% of rural mothers surveyed had never been to school, and
  only 16% of parents in a rural study helped with homework [S, parent-experience §1.1]. That is not a deficit
  for Taxila's design: Maloney and Barger say homework help is the wrong lever anyway. Talk, routine and praise
  need no schooling. The agent must work fully by voice, in Hindi, with zero maths.
- **They are burned by edtech.** LocalCircles 2023: 81% faced refund or trust issues. NCPCR 2022: BYJU'S
  hard-selling and "diagnosed weak to sell" [S]. Trust is earned by kept promises and no selling (PL5, PL12).
- **Engagement with school predicts staying in school** (India, panel; parents not attending PTA meetings
  1.15× dropout risk, not discussing progress with teachers 1.14×) (Paul, Rashmi & Srivastava 2021, *PLoS
  One*) [V abstract; correlational]. The PTM habit is worth building even though causality is unknown.
- **[I] The design move:** Indian parents' high expectations are an asset (Jeynes 2024: the expectations
  component is significant across nationalities [V]). They turn harmful when expressed as marks pressure and
  comparison. The agent's job is to *channel* expectation into academic socialization ("what are you
  learning, why does it matter for what *you* want to do") and into a calm response to failure. It does not
  argue the parent out of caring about marks. It answers the marks question with the skills-pakka count for
  the test chapters (parent-experience §9).

---

## 2. Where the parent agent sits

```
            parent channels                         PARENT AGENT (worker; per-conversation state)              Conductor
 ┌──────────────────────────────┐       ┌────────────────────────────────────────────────────────┐    (sole decider)
 │ WhatsApp: template + buttons │──────►│ Inbound router (code): button / scoped Q / STOP / other │──events──►┌──────────┐
 │ App: Parent corner, PTM text │──────►│ ParentConversation FSM (intake | ptm | ask | debrief)    │           │ decide() │
 │ App: PTM voice (WebRTC)      │◄─────►│   ├─ ParentBrief (read model, fact ids)                  │◄─brief────│          │
 │ Voice note (TTS, outbound)   │◄──────│   ├─ tools: ledger lookups, propose_* (never write)      │           └────┬─────┘
 └──────────────────────────────┘       │   ├─ compile() parent lane (same assembler, parent core) │                │
                                        │   ├─ claim-checker + PX lint (code, every turn)          │   jobs: report.weekly,
                                        │   └─ commitments ledger                                  │   parent.letter, alert.*,
                                        └────────────────────────────────────────────────────────┘   home.pick, ptm.prep
   safety protocol ──(wellbeing/safety tier, suppression branch)──► Notifier gate (before any parent send)
```

- **Lanes.** PTM voice is synchronous on gpt-realtime-2.1 (the same voice as the teacher, parent register in
  the compiled core). PTM text and the scoped WhatsApp "ask" lane use gpt-5.6-luna with function tools, and no
  reasoning model on the live reply (inherited law). Batch work (weekly letter, PTM prep, home-activity pick
  explanations) uses luna on the Batch lane with a standard-API deadline fallback (orchestration §5.4).
- **One assembler.** `compile({lane: 'parent', ...})` builds the parent lane from the same character core plus
  a *parent floor* section (PP rules in §8), the ParentBrief, the conversation step as a shape, and the
  language rule. The turn-shape rule goes LAST. Budget gate throws.
- **Authority.** The parent agent sits below the Conductor plan in orchestration §5.9 for *child* matters. For
  *parent-facing wording* it is bounded by the safety protocol, consent and PX lints. It can propose, and only
  the Conductor adopts.

---

## 3. What the agent knows about the parent (ParentModel)

The parent is also a data principal, so the model holds only what the conversation needs. Everything is
parent-visible and editable in Parent corner → "What Taxila knows about you".

Types are in `parent-loop.contracts.ts` (`shared/parent/model.ts`): `GuardianProfile` (language, script,
`prefersVoice` as a parent-declared preference and never an inferred literacy level, address term,
channels, cadence, report slot), `InvolvementPlan` (minutes per week 0/5/15/30, when, who is at home
without names, `capacityDial` 0-2), `AlertPrefs` (`struggleSooner`, wellbeing detail level, quiet hours),
`ParentWorry` (kind + mapped topic ids; **the parent's verbatim words are never stored**, PX4),
`ChildHistory` (prior tuition, school or medium changes, accommodations menu, never a diagnosis),
`CareNote` (§4.3) and `Commitment` (§7.4).

**ParentBrief** (read model built by `brief.refresh` for the parent lane; every element carries a `factId` that
resolves to a ledger row; ≤ 900 tokens [U]):

```ts
export interface ParentBrief {
  child: { firstName: string; classLevel: number; board: string; band: 'B1'|'B2'|'B3'|'B4' };
  week: { lessons: number; days: number; minutes: number; factId: string };
  canDo: Array<{ skillId: string; outcomeText: string; state: 'aa_gaya'|'pakka'; lastCheck: string; factId: string }>;
  working: Array<{ skillId: string; outcomeText: string; misconceptionPlain?: string; whatTaxilaDoes: string; factId: string }>;
  effortActions: Array<{ kind: 'retry_after_mistake'|'own_words'|'question_asked'|'chose_harder'; n: number; factId: string }>;
  school: { chaptersNow: Record<string, string>; testWindows: Array<{ subject: string; from: string; to: string }>;
            readiness?: Array<{ eventId: string; pakka: number; total: number; factId: string }> };
  worries: ParentWorry[]; commitments: Commitment[]; careNotes: Array<Pick<CareNote,'id'|'effect'|'expiresAt'>>;
  lastHomeActivity?: { id: string; outcome?: HomeFeedback };
  transcriptAccess: 'default_visible' | 'on_request' ;    // by band, parent-experience §12
  safetyHold: boolean;                                    // true → the agent discusses no lesson content; protocol script only
}
```

---

## 4. Onboarding conversation (intake)

### 4.1 Shape

Need-goals §5.3 defined the school and goals slots (S0-S7). This section adds worries, the child's history,
the home-learning plan and alert preferences, and fixes the order. The conversation is an optional voice call
(or text, same slots) offered at O9 and again in Parent corner. It is a slot machine: the next slot is the
highest-VOI unfilled one, every slot accepts "pata nahi" or "baad mein", and the parent can stop at any slot.
Budget ≤ 8 minutes. If the call runs over 6 minutes, P8-P9 drop and are asked later through the weekly letter
button row.

| slot | teacher move (shape, not a line) | extracts to | policy |
|---|---|---|---|
| P0 open | ⟨AI disclosure⟩ → ⟨purpose: get to know the child's school and the family's goals; ~6 min⟩ → ⟨ask how to address them⟩ | `address` | AI disclosure first, always (PP1) |
| P1 school now (= S1) | ⟨chapter per subject they know⟩ → ⟨read back as chapter titles⟩ | position obs | facts from people |
| P2 coming up (= S2) | ⟨tests soon, what they cover⟩ → ⟨offer datesheet photo later⟩ | unconfirmed events | dates need a tap (N6) |
| P3 worries | ⟨ask: what worries you most about her studies right now⟩ → ⟨reflect the worry back as a *question* to check⟩ → ⟨say how and when it will be checked⟩ | `ParentWorry` + `probe_request` + `Commitment(check_skill, due ≤ 7 days)` | never reassure without evidence ("don't worry, she'll be fine" is banned); never agree with a label; at most 2 worries become commitments, others are logged as open |
| P4 history | ⟨ask: has she had tuition before; what helped, what didn't⟩ → ⟨ask: any change of school or medium⟩ → ⟨offer accommodations as a menu, without naming any condition⟩ | `ChildHistory` | no diagnosis fields (N10); a parent-volunteered diagnosis is mapped to accommodations only, and the word itself is not stored |
| P5 success (= S3) | ⟨what would make the next 3 months feel good, in their words⟩ → ⟨reflect as goal⟩ | goals (rank 1-2) | goals are closed set + note (need-goals §4.6) |
| P6 routine (= S5, S6) | ⟨school hours, tuition, when the phone is free⟩ → ⟨propose the anchor slot (DC1) as an if-then⟩ → ⟨homework norm: teacher teaches toward the answer⟩ | constraint, anchor | homework integrity stated once |
| P7 your part | ⟨explain the one weekly home activity and its size⟩ → ⟨ask when and who could do it⟩ → ⟨offer the praise cue⟩ | `InvolvementPlan` | "zero minutes" is a full answer; the parent is never told they *should* teach |
| P8 how I tell you | ⟨explain the weekly letter, the PTM, and what would make me message sooner⟩ → ⟨ask about "tell me sooner" for struggles⟩ → ⟨state: safety messages always come⟩ | `AlertPrefs`, cadence | safety cannot be opted out; say so plainly |
| P9 care (optional) | ⟨ask: anything going on at home that the teacher should be gentle about, for a few weeks; it's fine to say no⟩ | `CareNote` (TTL ≤ 30 d) | §4.3; never asked again unless the parent opens it |
| P10 close (= S7) | ⟨week-1 plan from NeedModel⟩ → ⟨read back the commitments with days⟩ → ⟨what they'll get and when⟩ → ⟨no outcome promise⟩ | none | commitments read back = the first trust test |

### 4.2 Extraction contract

Each parent turn goes to `taxila-fast` (gpt-5.6-luna, JSON schema, `unknown` allowed). The schema has **no
fields** for income, caste, religion, family structure, health, disability labels or the parent's verbatim
adjectives about the child (N10, PX4). A classifier pass drops such content from the transcript excerpt kept
for the parent's own view.

```ts
export interface ParentIntakeExtract {
  slot: 'P1'|'P2'|'P3'|'P4'|'P5'|'P6'|'P7'|'P8'|'P9';
  positions?: Array<{ subject: string; chapterGuess: string; confidence: number }>;
  events?: Array<{ subject?: string; kind: 'unit_test'|'periodic'|'half_yearly'|'annual'|'other'; roughWeek?: string }>;
  worries?: Array<{ kind: ParentWorry['kind']; topicCandidates: string[]; intensity: 'mentioned'|'emphasised' }>;
  history?: Partial<ChildHistory>;
  goals?: Array<{ goal: string; rank: 1|2; note?: string }>;
  involvement?: Partial<InvolvementPlan>;
  alertPrefs?: Partial<AlertPrefs>;
  careNote?: { text: string; effect: CareNote['effect'] };
  declined?: boolean;                                     // "pata nahi" / "baad mein" → suppress slot 21 days
  safetySignal?: 'none' | 'parent_distress' | 'child_risk_reported';   // → §8.3 routing, not stored here
}
```

### 4.3 The care note (a narrow exception to "no family situation")

Parents sometimes say "her nani passed away last month" or "we just moved". The teacher should be gentle
without being told why, and must never raise it with the child. N10 forbids *labels and fields* about family
situation. The care note is different: it is parent-authored free text, shown back verbatim, time-limited
(≤ 30 days, renewable once), never inferred, never shown to the child, and it reaches the ChildBrief only as
an effect (`gentle_mode` = vibe `challenge: reassure-first`, success-first openers, no "how was your week"
openers; or `avoid_topic` = a content filter for, say, a family-tree EVS chapter). **[U]** Logged as decision
`pl-care-note` with a reversal condition: a safeguarding advisor objects, or audits find care notes used for
anything but the effect.

### 4.4 Worry handling protocol

1. Reflect the worry as a checkable question ("whether she can compare fractions with different
   denominators"). Use the parent's topic, not their adjective.
2. If the ParentBrief already has evidence: give it with "Kaise pata?" and the date. If the evidence
   contradicts the worry, say what was seen and offer one more check. The agent does not argue (Dizon-Ross:
   calibration happens over weeks; need-goals §5.5).
3. If not: create `probe_request` + `Commitment(check_skill)` due in ≤ 7 days, and say when the answer will come
   (the next weekly letter).
4. Worries about non-academic things (screen time, friends, "he lies about homework", anger) get one line of
   general, evidence-based guidance from the guidance library (§6.4) and an offer to talk in the PTM. They are
   never turned into a probe on the child.
5. Parent distress (crying, "I don't know what to do", hopelessness): care first, no problem-solving rush,
   offer the PTM later. If there are signs of the parent's own crisis, give Tele-MANAS 14416 (it serves all
   ages) [M: re-verify at launch]. The agent is not the parent's counsellor and says so kindly (PP9).

---

## 5. The weekly letter (WhatsApp card + voice note + app)

Parent-experience §8 fixed the card, the template category, buttons and cost. This section specifies the
agent pipeline and the new content (involvement block, commitment results, routine facts).

### 5.1 Pipeline

```
facts (ledger, ParentBrief @ week boundary) ─► WeekStory (structured, code) ─► slot fill (luna, Batch)
   ─► lints (PX4-PX9, banned wording LT §7, claim-checker, N8 one question) ─► renders:
        card image (server, tokens §13) · template text (≤5 lines) · voice script (60-90 s) · app view
   ─► Notifier gate (consent, caps, quiet hours, safety hold) ─► send ─► receipts ─► replies (buttons)
```

```ts
export interface WeekStory {                              // built by code; the model only fills wording slots
  childId: string; isoWeek: string; zeroLessonWeek: boolean;
  facts: ParentBrief['week'];
  highlight: { kind: 'action'; factId: string };          // one concrete thing she did (an action, not a trait)
  canDo: Array<{ factId: string }>;                       // ≤ 2
  working: { factId: string } | null;                     // ≤ 1
  commitmentResults: Array<{ commitmentId: string; factIds: string[] }>;   // "you asked; here's what I found"
  homeActivity: { activityId: string; renderedSlots: Record<string, string> } | null;
  praiseCue: { factId: string } | null;                   // the action to praise, from effortActions
  routineFact?: { kind: 'gap_days' | 'ended_early' | 'time_shift'; value: number; factId: string };   // §7.4
  needQuestion?: NeedAsk;                                 // need-goals §8.2, ≤ 1 (N8)
  schoolLine?: { subject: string; chapterId: string };
}
```

### 5.2 Content order (shape)

Text and voice use the same order, which gives the parent the one action without overwhelming them:
⟨AI teacher disclosure (voice only)⟩ → ⟨week facts⟩ → ⟨one concrete action she took⟩ → ⟨1-2 can-do, with the
pakka/aa-gaya distinction⟩ → ⟨answer to the parent's open commitment, if any⟩ → ⟨one tricky bit, in
kitchen-table words, plus what Taxila is doing⟩ → ⟨**your part**: the home activity and the praise cue⟩ →
⟨optional one-tap question⟩ → close. Voice notes run 60-90 s. If the order would exceed that, it drops content
from the end: the school line first, then the second can-do, then the tricky bit's detail. The home activity
and commitment results are never dropped.

### 5.3 Buttons and replies

Buttons (≤ 3, quick reply): *Suno (1 min)* · *Ghar ka kaam ho gaya* · *Poori report*. When a need question or
gap line is present, it replaces *Poori report*, and the URL moves into the body. Inbound replies route by code:

| inbound | handler | result |
|---|---|---|
| quick reply (known payload) | code | `parent.home_activity_feedback` / `parent.reply_received` event |
| "STOP", "Band karo" | code | `parent.setting_changed{reports:false}`, confirmed in one message |
| short free text | scoped "ask" lane (§7.5), only after the BSP check [M]; else → "PTM in the app" link | answer from ParentBrief or a hand-off |
| distress or risk words | safety classifier first | §8.3 routing; never a template reply |

**Zero-lesson week.** The letter still goes on its day: "no lessons this week" stated plainly, no guilt, no
"come back". After ≥ 14 days with no lessons, following a period of regular use, it carries one routine line
and the button *Time badlein / Pause karein* (§8.4). Nothing else changes.

### 5.4 Voice note production

- Script = WeekStory slots rendered by luna with a shape prompt (no example sentences: "anything
  sentence-shaped gets recited"), then the lints, then audio.
- Audio: **the teacher's own voice is required** (PL2). Option A: gpt-realtime-2.1 out-of-band response
  rendering a fixed script (≈ 90 s × 20 tok/s × $64/M ≈ $0.12 per note) [U]. Option B: gpt-4o-mini-tts with
  the closest voice (≈ $0.02) [U]. Choose by a blind parent ear test (PLM9). Metrics do not choose voices
  (inherited law).
- Every clip opens with the AI disclosure. Audio files expire after 30 days. The text script is kept with the
  letter row.

---

## 6. Involving parents: the home loop

### 6.1 What the agent asks parents to do, ranked by evidence

| rank | parent action | evidence | ages | the agent never asks |
|---|---|---|---|---|
| 1 | **Listen while the child explains** a thing she learned this week (teach-back at home) | academic socialization (Hill & Tyson) [V]; teach-back with expectancy (learning-science rule 4) [S]; Kraft & Rogers (changed the *content* of parent-child talk) [S] | all; B1-B2 with an object | to correct the method or quiz for marks |
| 2 | **A 5-minute everyday activity** with the answer built in (roti fractions, bus-ticket change, reading a signboard, a weekend shopping list) | Berkowitz 2015 (with Frank's caveat) [V]; CHAMP India [V]; concreteness fading (rule 19) | B1-B3 mainly | to teach new content, or buy anything |
| 3 | **Process praise of a named action** the ledger saw ("tried again after a mistake 4 times on fractions") | Gunderson 2013/2018 [V]; Bennett-Pierre 2024 caution [V] | all | "you're so smart", praise tied to marks, money or rewards (MI1) |
| 4 | **A calm reaction to a wrong answer or a bad test**: ask what she tried, what she'd do next | Haimovitz & Dweck 2016 [V] | all, offered after any test result | scolding scripts, "you'll fail" (MI5) |
| 5 | **Value talk** for 10-15: connect the skill to *her* stated interest or plan | Hill & Tyson [V]; aspiration is child-stated (need-goals §4.6) | B3-B4 | a parent's career plan for the child (N11 spirit) |
| 6 | **Routine**: protect the anchor time and the quiet place | Patall 2008 rule-setting [S]; DC1 | all | surveillance of the child's chat |

**Never asked, ever:** help with homework, re-teaching a method, checking answers, comparing with siblings or
cousins, extra worksheets, rewards for marks. If the parent asks "how can I teach her fractions?", the
agent explains why listening works better and offers a rank-1 or rank-2 activity (Maloney: frequent help from
an anxious parent hurts; Barger r = −.15) [V].

### 6.2 The catalogue

Activities are content, versioned in git (`data/home/*.json`) and reviewed by a teacher. The model never
invents one. It may only fill slots (the child's name, the object, the exact question in the parent's
language).

```ts
// shared/parent/home.ts
export interface HomeActivity {
  id: string; version: number;
  rank: 1|2|3|4|5|6;                                      // §6.1 kind
  skillIds: string[];                                     // must intersect the week's ledger facts
  bands: Array<'B1'|'B2'|'B3'|'B4'>;
  minutes: 2 | 5 | 10; when: Array<InvolvementPlan['when']>;
  materials: Array<'none'|'roti'|'coins'|'clock'|'newspaper'|'calendar'|'utensils'|'plants'|'phone_calculator'>;
  parentNeedsMaths: false;                                // type-level: an activity that needs it cannot exist
  answerVisibleToParent: boolean;                         // the card shows what a good answer sounds like
  slots: string[];                                        // e.g. ['childName','object','question']
  shapes: Record<string, string>;                         // per language: shape notes, never a recitable line
  doNot: string[];                                        // per activity: e.g. 'do not correct; ask why'
  sourceRef: string;                                      // the evidence row or kit this derives from
}
export type HomeFeedback = 'done' | 'skipped' | 'too_hard' | 'child_loved' | 'child_refused' | 'no_time';
```

### 6.3 Selection (pure code, in `plan.week`)

```ts
export function pickHomeActivity(b: ParentBrief, plan: InvolvementPlan, hist: Array<{ id: string; fb?: HomeFeedback; week: string }>,
                                 cat: HomeActivity[]): HomeActivity | null {
  if (!plan.homeActivity || plan.minutesPerWeek === 0) return null;
  if (b.safetyHold) return null;
  const facts = new Set([...b.working.map(w => w.skillId), ...b.canDo.filter(c => c.state === 'aa_gaya').map(c => c.skillId)]);
  const recent = new Set(hist.slice(-6).map(h => h.id));
  const maxRank = plan.capacityDial === 0 ? 1 : plan.capacityDial === 1 ? 3 : 6;
  const pool = cat.filter(a => a.bands.includes(b.child.band) && a.rank <= maxRank && a.minutes <= plan.minutesPerWeek
    && (a.when.includes(plan.when) || plan.when === 'any') && !recent.has(a.id) && a.skillIds.some(s => facts.has(s)));
  // prefer the 'aa_gaya' skill due for its delayed check (home retrieval doubles as spacing), then the working skill
  return pool.sort((x, y) => score(y, b) - score(x, b))[0] ?? null;    // null is a valid outcome (silence)
}
```

**Capacity dial (adapts to the parent, never scolds).** Two consecutive `no_time`/`skipped` → dial −1 and a
single in-app line offering a smaller version. Three `done` in four weeks → offer (once) to go up. A
`too_hard` → that activity is retired for the family and the catalogue row gets a review flag. A
`child_refused` → switch to rank 1 talk-only for two weeks, and the teacher, not the parent, takes up the topic.
No counters, streaks or "you did 5 home tasks!" are shown (MI1, MI2).

**Closing the loop with the child (PL11).** At the next lesson's open, the Director's brief carries
`homeLoop: {activityId, told: 'parent_will_ask'}`, and the teacher mentions it as a shape: ⟨your Papa may ask
you about ⟨skill⟩⟩. If the parent tapped *Ho gaya*, the teacher may ask one light question about it. If not,
the topic is not raised (no guilt in either direction).

### 6.4 Praise and guidance library

- **Praise cue** = one ledger action + the instruction shape "name what she did, then ask how she did it". It
  is generated from `effortActions` only, so it is always true (PX1). Banned: ability, comparison, marks,
  money, "proud of you *because* you got full marks" (contingent regard, MI3).
- **Guidance cards** (fixed, reviewed, ≤ 40 words each, in every supported language) for recurring parent
  questions: screen time, "he won't sit", "she cries at tests", "should I put him in tuition too", "Hindi
  medium to English medium", "how much should I help with homework". Each card names its evidence row. The
  agent can *select* a card and explain it in the PTM. It cannot improvise advice outside the library on
  health, development, diagnosis or discipline (PP9).

---

## 7. The PTM: the parent talks to the AI teacher

### 7.1 Modes and budget

| mode | where | model | budget [U] | notes |
|---|---|---|---|---|
| **PTM voice** | app, WebRTC | gpt-realtime-2.1, teacher voice, parent register | ≤ 10 min; ≤ 2 per child per month included; ≈ $0.07-0.09/min on 2.1 → ≤ $1.8/month worst case (realtime-cost-model ratios) | the monthly ritual; card on screen; transcript shown live |
| **PTM text** | app (Parent corner → "Teacher se baat") | gpt-5.6-luna + tools | rate limit 30 turns/day | any time; same policy |
| **Scoped ask** | WhatsApp free text | luna + tools, narrower tool set | ≤ 5 Q/day | only after BSP confirms policy fit [M] |
| **Monthly prep** | Batch | gpt-5.6-sol (offline synthesis, not a live reply) | ≈ $0.02 | builds the agenda and the two-column school view |

The voice PTM lane obeys the cost governor (orchestration C7). When the month's parent budget is used, the
parent is offered text PTM, and nothing is degraded silently.

### 7.2 PTM state machine

```
            ptm.start (disclosure line compiled first)
   idle ───────────────────────────────────────────► opening ──► agenda ──► questions ◄──┐
                                                       │           │  (items 1..4)   │   │ parent asks
                                                       │           ▼                 ▼   │
                                                       │       commitments ◄──── answering ┘
                                                       │           │   (≤ 2 new; read back with dates)
                                                       ▼           ▼
                                                  safety_route   closing ──► summarised (job: report.ptm_summary)
   any ── parent leaves / 10 min ──► closing (graceful: read back commitments in ≤ 20 s)
   any ── safety.incident or child-risk disclosure by parent ──► safety_route (protocol script; no lesson talk)
```

Agenda (prefilled by `ptm.prep`; the parent can skip to questions at any point): (1) one concrete action and
2-3 can-do with evidence; (2) 1-2 tricky bits with what Taxila is doing; (3) school vs Taxila, as two columns
without a verdict (school-sync §7); (4) open worries and commitment results; then questions; then at most one
home activity and a goals refresh if due (need-goals §8.2).

### 7.3 Tools (function calling; every result carries `factId`s; none of them write learner state)

```ts
export const PTM_TOOLS = {
  get_skill_evidence:    { in: { skillId: 'string' }, out: 'EvidenceRow[] (date, probe kind in plain words, help used, next re-check)' },
  get_lesson_summary:    { in: { lessonId: 'string?', dateRange: 'string?' }, out: 'LessonSummary[]' },
  get_transcript_excerpt:{ in: { lessonId: 'string', around: 'string' }, out: 'Excerpt | {denied: "band_policy"|"safety"|"not_requested"}' },
  get_school_mirror:     { in: {}, out: 'SchoolMirror (chapters, windows, ptm notes academic clauses only)' },
  get_test_readiness:    { in: { eventId: 'string' }, out: '{pakka, total, skills[]}' },          // never a predicted mark
  find_guidance_card:    { in: { topic: 'string' }, out: 'GuidanceCard | null' },
  propose_focus:         { in: { skillIds: 'string[]', reason: 'string' }, out: '{proposalId}' },   // → parent.focus_requested
  propose_schedule:      { in: { anchor: 'string?', dailyMin: 'number?', pauseUntil: 'string?' }, out: '{proposalId}' },
  record_worry:          { in: { kind: 'string', topicCandidates: 'string[]' }, out: '{worryId}' },
  create_commitment:     { in: { kind: 'string', refs: 'string[]', dueAt: 'string' }, out: '{commitmentId} | {denied: "cap"}' },
  open_support_ticket:   { in: { kind: '"billing"|"complaint"|"bug"|"data_request"' }, out: '{ticketId, slaHours}' },
} as const;
```

`get_transcript_excerpt` enforces parent-experience §12 in code. For B1-B2 children (under 10) excerpts are
available. For B3-B4 they are available only if the parent has turned on transcript access, which notifies
the child that week. Safety-held lessons are always `denied: 'safety'`, and the protocol owns those.

### 7.4 Answer policy (what the teacher may say in a PTM)

| question class | detector | answer shape | example of the class |
|---|---|---|---|
| fact in the brief | tool hit | the fact + "Kaise pata?" (date, probe kind, the child's words if allowed) | "can she do long division now?" |
| fact not yet known | tool miss | "not checked yet" + offer a commitment with a day | "does she know the tables of 7?" |
| prediction / rank / comparison | lexicon + classifier | decline once, plainly, then give the honest alternative (skills pakka out of total; her own past month) | "how many marks will she get?", "is she behind her class?" |
| ability or trait | lexicon | decline the label; name what she can do and the method that is helping (PX4) | "is he weak in maths?", "is she intelligent?" |
| how can I help | intent | §6.1 ranks; a catalogue activity; a guidance card | "should I teach her at night?" |
| parent asks the teacher to pressure the child | intent + MI lexicon | decline with care; offer what the teacher *will* do (PL10) | "tell him he'll fail if he doesn't study" |
| parent asks what the child said about family or friends | intent | learning yes; personal talk follows the band policy; safety content never | "what does she tell you about me?" |
| health, development, diagnosis | lexicon | no opinion; suggest the school counsellor or a paediatrician; accommodations menu | "does he have ADHD?" |
| billing, refund, complaint | intent | `open_support_ticket`, state the SLA, no retention offer, no upsell | "cancel my plan" |
| parent distress | safety classifier | care; Tele-MANAS 14416 if crisis signs; no rush | "I can't handle him anymore" |
| child at risk (parent reports abuse, self-harm) | safety classifier | `safety_route`: protocol script, helplines (Childline 1098), human safeguarding queue | — |

**Commitments.** At most two new per PTM and four open per child (`create_commitment` returns `denied: cap`).
Each is read back with a day. Fulfilment is code: when the due date arrives, the Conductor checks the ledger
for the referenced skills and fills `resultFactIds`. The weekly letter then reports the result, including
"I couldn't check it this week because there were no lessons; I'll do it in the next lesson". A missed
commitment is reported honestly, never hidden. A `human_followup` commitment can only be created when the
support rota has capacity and an SLA (PL12).

### 7.5 Grounding and post-checks (every turn, voice included)

1. **Claim-checker (code).** Every agent turn is parsed for child claims: skill names, state words
   (pakka/aa gaya/seekh rahi), counts, dates and quoted words. Each must match a `factId` in the tool results or
   the ParentBrief of this conversation. For voice, the check runs on the teacher's output transcript after the
   turn. A miss forces a correction instruction on the next turn ("correct the last statement to the fact")
   and writes an `incident(kind='parent_unbacked_claim')`.
2. **PX lint** on every turn: labels, comparison, prediction, affect claims ("she was frustrated"), human
   relay claims ("our team will call"), selling, countdowns, em/en dashes in UI text.
3. **Leak guard for teens:** a B3-B4 child's personal (non-learning) words cannot appear in output unless
   `transcriptAccess` is on and the excerpt tool returned them.
4. **Summary:** `report.ptm_summary` (luna, from the conversation's tool results only, not the free
   transcript) → in-app record + one WhatsApp utility message with the commitments.

---

## 8. Alerts

### 8.1 Classes

| class | trigger (pure code over events and ledger) | channel | cap | can the parent turn it off? | owner |
|---|---|---|---|---|---|
| **S safety** | `safety.incident` (crisis, self-harm, abuse disclosure, moderation flag) | WhatsApp + push; detail behind PIN | none | **no** | safeguarding protocol (suppression branch when a family member is implicated) |
| **W wellbeing** | `child.wellbeing_statement` from the safety monitor's non-crisis tier: explicit child statements about bullying, fear of punishment over marks, loneliness, persistent "I hate school", sleep loss *stated* by the child | in-app note + WhatsApp "a note from the teacher is in the app" (no content in the push) | ≤ 1/week, coalesced | detail level only; existence no | protocol table §8.3 |
| **L struggle** | wheel-spin (rule 10) on a skill that is a parent worry, a parent focus or in a confirmed test window, persisting across ≥ 2 sessions *after* an approach change; or readiness < 50% pakka with ≤ 7 days to a confirmed test | default: weekly letter. With `struggleSooner`: one push that names the topic and *what Taxila is doing* + one parent action (confirm chapter / talk to school teacher / PTM) | ≤ 1 per 14 days; counts in the ≤ 2 learning messages/week cap | yes | parent agent |
| **R routine** | facts only: ≥ 14 days without lessons after ≥ 3 weeks of regular use; ≥ 3 of the last 5 lessons ended by `child_left` before the half; ≥ 3 of the last 5 closes `strained` | **weekly letter line only**, never a push | in the letter | yes (hide routine lines) | parent agent |
| **C commitment** | a commitment due date reached | weekly letter (or the PTM summary) | in the letter | no (it's the answer the parent asked for) | parent agent |
| **A account / payment** | as parent-experience §11 | WhatsApp | per event | no | billing |

**"Disengagement" is class R**, a routine fact with an offer. It is not a push, and it carries no affect
claim. The letter states what happened ("3 of the last 5 lessons ended early"), what Taxila is changing
(shorter segments, the child picks the first topic, a different time), and one button (*PTM karo* or *Time
badlein*). It never says "he seems bored", "she lost interest" or "falling behind" (PX5, NM-9, MI11). The
justification for including it at all is Rogers & Feller's: parents misjudge accumulated patterns, and plain
information corrects that [V]. The bans (DC2, PX7) cover nagging and pressure, not facts.

### 8.2 Detectors (code; run in `decide` on `lesson.ended` and at the weekly boundary)

```ts
export function detectStruggle(skill: SkillView, n: NeedView, prefs: AlertPrefs, now: Date): AlertCandidate | null {
  const relevant = n.worrySkills.has(skill.id) || n.focusSkills.has(skill.id) || n.testWindowSkills.has(skill.id);
  if (!relevant) return null;
  const spinning = skill.wheelSpin && skill.sessionsSinceSpin >= 2 && skill.approachChangedSinceSpin;
  const testRisk = n.daysToConfirmedTest(skill.id, now) <= 7 && n.readiness(skill.id) < 0.5;
  if (!spinning && !testRisk) return null;
  return { cls: 'L', childId: skill.childId, refs: [skill.id], factIds: skill.evidenceIds.slice(-5),
           parentAction: testRisk ? 'confirm_scope_or_ptm' : 'ptm_or_school_teacher',
           route: prefs.struggleSooner ? 'push' : 'letter', dedupe: `L:${skill.id}:${isoWeek(now)}` };
}
export function detectRoutine(last5: LessonClose[], gapDays: number, regularBefore: boolean): AlertCandidate[] {
  const out: AlertCandidate[] = [];
  if (gapDays >= 14 && regularBefore) out.push(letterLine('gap_days', gapDays));
  if (last5.filter(l => l.reason === 'child_left' && l.minutes < l.planned / 2).length >= 3) out.push(letterLine('ended_early', 3));
  if (last5.filter(l => l.vibeClose === 'strained').length >= 3) out.push(letterLine('ended_early', 3));  // worded as facts, never as mood
  return out;
}
```

The Conductor reacts to its own detectors before telling the parent. A routine candidate first triggers a
re-plan (shorter segments, choice-first opener, success-first targeting; motivation-interest §3). The letter
line then reports both the fact and the change.

### 8.3 Wellbeing and safety routing (protocol table; the safeguarding advisor owns the final version)

| child statement class (explicit only) | B1-B2 (6-9) | B3-B4 (10-15) | always |
|---|---|---|---|
| crisis / self-harm / abuse | S: immediate parent alert (no quote) + helplines; human safeguarding queue; suppression branch if a family member is implicated → Childline 1098, no parent alert | same | teacher gives care + a trusted-adult nudge, never promises secrecy |
| bullying, persistent fear, loneliness | W: parent note (summary in kitchen-table words, no quote by default) | teacher encourages the child to tell a parent and asks "shall I let Mummy/Papa know?". Yes → W note. No → recorded; W note only if repeated in ≥ 2 sessions within 14 days, and the child is told first | never inferred from voice, latency or score |
| fear of parent's reaction to marks | W note framed as guidance (§6.1 rank 4 card), *not* "your child is scared of you" | ask-first as above; if the child declines, no note; the general rank-4 card goes in the next letter (untargeted wording) | protocol checks the suppression branch if punishment sounds physical |
| "I hate maths/school" once | none (teacher handles it in the moment) | none | becomes a motivation signal only (MI) |
| child asks the teacher not to tell | honour within the floor: learning stays visible; non-safety personal talk follows the band policy; safety is never secret, and the child is told so gently | same | gurukul §4.4: never promise secrecy |

**Human review.** S-class content release (what the parent may read beyond "a safety moment happened") goes
through a human safeguarding queue, as in OpenAI's precedent [V]. The immediate parent notice with helplines
does not wait for review, unless the suppression branch fires. W-class notes are template-driven and need no
human, but every W note is sampled for audit (10% [U]).

### 8.4 Alert lifecycle and gate

```
 detected ─► candidate ─► gated ─┬─► suppressed (reason: consent | cap | quiet | dedupe | safety_hold | suppression_branch)
                                 ├─► folded_into_letter ─► sent_in_letter
                                 └─► queued ─► sent ─► delivered ─► acknowledged (button / app open) ─► resolved
                                                         └─► failed ─► retry (S: alternate channel within 5 min)
```

```ts
export function gateAlert(c: AlertCandidate, s: ConductorState, p: GuardianProfile, protocol: ProtocolView, now: Date): GateResult {
  if (c.cls === 'S') return protocol.suppressParent(c) ? { out: 'suppressed', reason: 'suppression_branch', route: 'childline' }
                                                       : { out: 'queued', channels: ['whatsapp', 'push'], ignoreQuiet: true };
  if (s.safety.holdIncidentId) return { out: 'suppressed', reason: 'safety_hold' };
  if (c.cls === 'W') return protocol.wellbeingAllowed(c, s, p) ? { out: 'queued', channels: ['app', 'whatsapp_pointer'] }
                                                              : { out: 'suppressed', reason: 'consent' };
  if (c.cls === 'R' || c.cls === 'C' || c.route === 'letter') return { out: 'folded_into_letter' };
  if (inQuiet(now, p.alertPrefs) || s.notify.learningMsgsThisWeek >= 2 || recentlySent(c.dedupe, 14)) return { out: 'folded_into_letter' };
  return { out: 'queued', channels: ['whatsapp'] };
}
```

---

## 9. Controls (additions to parent-experience §10)

| control | default | guard |
|---|---|---|
| Report cadence | weekly push; daily note pull (DC9) | `daily_push` replaces the milestone in the ≤ 2/week cap |
| Voice note | on | language follows the parent, not the child |
| Home activity size (capacity dial) | from P7; adapts (§6.3) | off allowed; never nags back on |
| Praise cue | on | — |
| "Tell me sooner about struggles" | off | ≤ 1 push / 14 days |
| Routine lines in the letter | on | hiding them keeps the facts in the app |
| Wellbeing detail level | summary | existence of a W note is not configurable; S is not configurable |
| Focus requests | ≤ 2 active | become plan weights through the Conductor; a focus on a topic whose prerequisites are below `practising` is accepted as *prerequisite first* and explained (N1) |
| Care note | none | ≤ 30 days; parent-visible; never shown to the child |
| Transcript access (B3-B4) | off | turning it on notifies the child that week (parent-experience §12) |
| Co-parent / viewer | owner only | §10.3 |
| "Don't raise topic X with my child" | none | allowed for non-curricular topics (care note `avoid_topic`); a curricular chapter cannot be blocked except through test-week planning |
| Daily time beyond the band maximum | blocked | needs a PIN each day; logged; DC11 reversal watches the rate |

### 9.1 Requests the agent declines (PL10), with the alternative it offers

| parent asks for | declined because | offered instead |
|---|---|---|
| "be strict, scold him when he's wrong" | MI5, MI3 | a firmer structure: shorter segments, fewer choices, the hint ladder |
| "tell her she'll fail / we'll be ashamed" | MI3, MI5 | the readiness count and the test-window plan |
| "compare her with her cousin / the class topper" | PX6, Rogers & Feller 2016 [V] | her own past month |
| "give him stars / tell him he gets a phone if he finishes" | MI1, LS-27 | a capability statement when a skill turns pakka |
| "just give her the homework answers, she's tired" | homework integrity (DC5, N7) | a shorter homework session tonight; the teacher teaches toward the answer |
| "tell me everything she says about her friends" (B3-B4) | band policy, Stattin & Kerr [V] | the learning view; how to invite disclosure (guidance card) |
| "make her study 3 hours before the exam" | DC7, DC11 | the exam-window mix inside the cap |

### 9.2 What the child sees about the parent loop

- Under 10: the "Mummy-Papa dekh sakte hain" chip and the home-loop mention (§6.3).
- 10-15: a "What Mummy-Papa see" page listing the categories (learning, the weekly letter, safety alerts, and
  transcripts only if turned on, with the week they were turned on), plus the home-loop mention.

### 9.3 Multiple guardians

- **Roles:** owner (consent, billing, all controls), co-parent (view + controls except consent and deletion),
  viewer (weekly letter only).
- **Conflicting settings** (e.g. two daily limits): the stricter value applies until the owner resolves it,
  and both see one neutral line.
- **The agent never relays one guardian's private words to another.** Worries, care notes and PTM
  transcripts are visible to all full-role guardians and labelled with who authored them. The agent says so
  at P0. There is no "secret" guardian channel, and the agent does not mediate disputes between guardians.
  It offers the support ticket for account issues (separation, custody) [M: legal on custody orders].

---

## 10. The parent-agent rulebook (PP rules; compiled into the parent floor, enforced by predicates)

- **PP1 AI disclosure** at the start of every conversation and every voice note. Never deny being an AI, never
  claim a human reviewed something, never imply a person will call unless a ticket with an SLA exists.
- **PP2 Evidence or silence**: every child claim is backed by a fact id (claim-checker). "Abhi pata nahi" is a
  full answer.
- **PP3 Learning, not the learner**: no traits, labels, ability, learning speed, IQ-like or percentile
  language, no inferred feelings (PX4, PX5, LT §7 banned list, NM-9).
- **PP4 No comparison and no prediction**: no rank, no sibling or peer, no predicted marks.
- **PP5 One ask per message**: at most one home activity, one praise cue and one need question per week (N8).
- **PP6 Never sell**: no prices, upgrades, renewals, referrals or retention offers in any agent conversation;
  billing goes to tickets (N12).
- **PP7 Child-safe**: every parent string passes "would this hurt if the child read it?" (shared phone). No
  child quotes in pushes.
- **PP8 Child floor outranks parent wishes**: PL10 declines; authority order §5.9.
- **PP9 Scope**: no medical, developmental, legal or family-counselling opinions; guidance only from the
  reviewed library; care plus helplines for distress.
- **PP10 Promises are kept or reported**: every commitment is fulfilled or reported as missed, with the reason.
- **PP11 Register**: "aap", respectful school-teacher tone, the parent's language; Hindi-first when chosen; no
  emoji, no exclamation stacks, no em/en dashes in UI strings.
- **PP12 Shapes, not lines**: the parent lane prompt carries no example sentences. Mocks in docs are layout
  only.

---

## 11. Contracts

### 11.1 Events

The `ParentLoopEvent` union in `parent-loop.contracts.ts` adds: `parent.conversation_started/ended`,
`parent.intake_slot`, `parent.worry_recorded`, `parent.focus_requested`, `parent.schedule_proposed`,
`parent.care_note_set/expired`, `parent.commitment_created/closed`, `parent.home_activity_assigned/feedback`,
`parent.letter_sent`, `parent.voice_note_played`, `parent.reply_received`, `parent.support_ticket`,
`child.wellbeing_statement` (emitted by the safety monitor only, with `askedToShare`), and
`alert.candidate/gated/acknowledged`. All use the orchestration §3.1 envelope (`source: 'parent' | 'agent' | 'safety'`).

New job kinds: `parent.intake_extract` (fast), `parent.letter` (Batch → standard fallback, replaces
`report.weekly` for rendering), `parent.voice_note` (slow), `ptm.prep` (Batch, sol), `report.ptm_summary`
(existing), `home.pick` (code, inside `plan.week`), `commitment.fulfil` (code, on wakeup). New `WakeReason`:
`commitment_due`, `care_note_expiry`. New `NotifyIntent`: `wellbeing_note`, `struggle`, `commitment_result`.

### 11.2 Ownership (adds to orchestration §6)

| fact | owner (only writer) | readers |
|---|---|---|
| guardian profile, involvement plan, alert prefs | parent API (and the agent via proposals the parent confirms) | Conductor, Notifier, agent |
| worries, commitments | parent agent | Conductor (probe requests via events), letter writer |
| care notes | parent API (parent action only; the agent may draft, the parent confirms) | ChildBrief builder (effect only) |
| home activity assignments and feedback | Conductor (assign), parent API (feedback) | letter writer, Director (home-loop mention) |
| alerts | Conductor (candidates, gate) + Notifier (delivery) | ops, parent history |
| parent conversations and turns | parent agent | parent (own view), audit |

### 11.3 SQL

Tables in `parent-loop.sql` (proposed `db/migrations/0xx_parent_loop.sql`): `guardian_profile`,
`parent_conversation`, `parent_turn` (text only, with `fact_ids`, claim-check and lint results per turn),
`parent_worry`, `parent_commitment` (open-cap of 4 enforced in the insert transaction), `care_note`
(160-char text, `expires_at <= created_at + 30 days` as a CHECK), `home_activity_assignment` (PK
`(child_id, iso_week)` enforces one per week, PLI4), `weekly_letter` (unique per child-week, with `ledger_hash`
for idempotent re-render), `parent_alert` (unique `(child_id, dedupe)`).

---

## 12. Invariants (gated in evals; "if your change trips them, your change is wrong")

| id | predicate | method |
|---|---|---|
| PLI1 | No parent-agent output contains a child claim without a matching fact id | claim-checker over a 500-conversation simulated battery + every production turn (sampled audit) |
| PLI2 | No absence push, streak, "come back", countdown or loss wording in any parent message | lexicon (Hindi, Roman Hindi, English) + notification log; negative control |
| PLI3 | No home activity requires the parent to teach, check answers or do maths | type `parentNeedsMaths: false` + catalogue review checklist |
| PLI4 | Exactly 0 or 1 home activity per child per week | `home_activity_assignment` PK |
| PLI5 | No wellbeing alert without a `child.wellbeing_statement` event from the safety monitor | module boundary: the alert builder cannot import vibe/motivation state |
| PLI6 | S-class sends ignore parent opt-outs; and when the suppression branch fires, no message reaches any guardian | protocol test matrix |
| PLI7 | B3-B4 personal words never appear in parent output unless transcript access is on | leak test with seeded personal utterances |
| PLI8 | The parent lane cannot write `kt_*`, `skill_state`, `conductor_state` or plans | static import check (as N4) |
| PLI9 | No price, plan, upgrade or referral tokens in agent turns or letters | lexicon + module boundary (N12) |
| PLI10 | Every commitment closes (fulfilled, missed or cancelled) within due + 8 days and is reported | sweeper test |
| PLI11 | Declined-request battery (§9.1): 100% decline + alternative | scripted parent simulator, per language |
| PLI12 | Every conversation and voice note opens with the AI disclosure | transcript check |

Bars: 0 violations for PLI2, PLI5-PLI9, PLI12; ≤ 1 per 1,000 turns for PLI1 in production sampling (the
checker blocks before send in text lanes; voice is post-checked and corrected).

---

## 13. Cost per family per month [U]

| item | volume | unit | ≈ USD |
|---|---|---|---|
| weekly letter render (luna, Batch) | 4 | ~3k in / 600 out tokens | 0.005 |
| voice note | 4 × 75 s | option A realtime render $0.12 · option B mini-tts $0.02 | 0.08-0.48 |
| WhatsApp utility messages | ~6 | ₹0.136 each (parent-experience §8) | 0.01 |
| PTM voice | 1-2 × 8 min | ≈ $0.08/min on 2.1 | 0.64-1.28 |
| PTM text / scoped ask | ~15 turns | luna | 0.01 |
| PTM prep (sol, Batch) | 1 | — | 0.02 |
| **total** | | | **≈ $0.77-1.80** against ≈ $3.1 revenue |

The parent loop costs 25-60% of revenue, so it is not free. The two levers are the voice-note option (B saves
$0.40) and the PTM cap. Both are decided by PLM6 and PLM9, not by reasoning. If the PTM is where the effect
lives (Angrist), it is the last thing to cut [I].

---

## 14. Measurements (log each with n, method, date in `context/measurements.md`)

| id | question | method | decides |
|---|---|---|---|
| PLM1 | Intake completion and duration | slot reach P0-P10, minutes, "baad mein" rate; n ≥ 100 parents, both languages | slot order, budget (PL5) |
| PLM2 | Commitment kept rate and trust | % fulfilled on time; post-letter 1-item trust rating ("did Taxila do what it said?") | PL5, PP10 |
| PLM3 | Home activity effect | micro-RCT per family-week: activity vs none, randomised over eligible skills; outcome = delayed (≥ 7 d) independent success on *that* skill; preregistered | PL6 keep/kill |
| PLM4 | Parent behaviour change | quarterly 4-item parent self-report (talk about learning, praise of an action, reaction to a wrong answer, homework help frequency) + child-report for 10-15; arm = praise/guidance cards on vs off | PL1 |
| PLM5 | Opt-out and mute | by arm (activity, routine lines, struggle-sooner); Cortes-style cadence | caps, routine lines |
| PLM6 | PTM use and value | % active parents using voice/text PTM monthly; minutes; questions by class; downstream PLM3/PLM4 among users vs matched non-users (observational, flagged) | PL7, cost cap |
| PLM7 | Claim-checker quality | 300 hand-labelled parent-agent turns (Hindi, Hinglish, English): precision/recall of unbacked-claim detection | PL4 tuning |
| PLM8 | Teen disclosure after parent alerts or transcript opens | wellbeing-statement rate per 100 sessions, before/after, B3-B4 | PL9, PL11 |
| PLM9 | Voice-note voice | blind ear test: option A vs B vs a human-read control, parents n ≥ 30 across ≥ 3 regions | §5.4 |
| PLM10 | Belief calibration | parent-experience M4 (quarterly yes/no per skill vs ledger) | whether the letter calibrates |

---

## 15. Decisions to log (for `context/inbox/`)

One entry per row of §0, with the reversal condition stated there: `pl-coach-not-pipe` (PL1),
`pl-one-character` (PL2), `pl-agent-proposes` (PL3), `pl-claims-grounded` (PL4), `pl-worry-to-commitment` (PL5),
`pl-home-activity-catalogue` (PL6), `pl-ptm-in-app` (PL7), `pl-disengagement-as-fact` (PL8),
`pl-wellbeing-explicit-only` (PL9), `pl-decline-harmful-requests` (PL10), `pl-child-transparency` (PL11),
`pl-no-sell-no-human-claim` (PL12), plus `pl-care-note` (§4.3; reverse on safeguarding objection or misuse in audit).

---

## 16. Open questions and risks

1. **[M] WhatsApp scoped "ask" lane.** Is a progress-question bot "ancillary to a legitimate business
   service" under Meta's 2026 policy? Confirm with the BSP before building §7.1's third row.
2. **[M] Hill & Tyson pooled r values** (≈ .39 / .19 / .03): re-read Table 2 before any external claim.
3. **[U] The age split for ask-first wellbeing sharing** (10+) needs the safeguarding advisor. Indian norms
   may expect parents to be told more, and NCERT's anxiety data cut both ways.
4. **[U] The care note** sits close to N10. It needs a legal and safeguarding read, plus audit sampling.
5. **[I] Fathers.** Indian schooling communication often defaults to fathers for "results" and to mothers for
   daily routine. The agent addresses whoever is on the call and never assumes a role by gender. Whether to
   suggest the activity to "whoever is home at dinner" rather than a named parent needs a usability test.
6. **Parent pressure versus child goals** (motivation-interest open Q5). Proposed rule: parents weight *what*
   (focus requests within the two-track plan), the child chooses *which first and how*, and the teacher tells
   the child that it is the parent's goal (relational autonomy). This needs a logged decision.
7. **PTM with a child present.** If the child is in the room, the teacher must not discuss tricky bits in
   front of them (need-goals §5.1 dropped briefing "within the child's earshot"). The agent asks at the start
   ("is [name] with you right now?") and switches to the can-do-only agenda if yes. **[U]** whether parents
   answer honestly.
8. **Cost** (§13) needs real PTM minutes before pricing is fixed.

---

## 17. Sources

Parental involvement
- Hill & Tyson 2009, *Developmental Psychology* 45(3):740-763, doi:10.1037/a0015362 (PMID 19413429), abstract via Europe PMC: https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=AUTH:%22Hill%20NE%22%20AND%20AUTH:%22Tyson%20DF%22
- Barger, Kim, Kuncel & Pomerantz 2019, *Psychological Bulletin*, doi:10.1037/bul0000201
- Jeynes 2005 (EJ690782), 2007 (EJ748034), 2012 (EJ969713), 2024 expectations (EJ1402483), 2024 relational (EJ1425093), 2025 communicative technology (EJ1473584), ERIC: https://api.ies.ed.gov/eric/?search=author:Jeynes
- Paul, Rashmi & Srivastava 2021, *PLoS One*, doi:10.1371/journal.pone.0251520
- Pomerantz, Moorman & Litwack 2007; Patall, Cooper & Robinson 2008 (via `learner/motivation-interest.md`, `learner/need-goals.md`)

Home activities, praise, failure, comparison
- Maloney, Ramirez, Gunderson, Levine & Beilock 2015, *Psychological Science*, doi:10.1177/0956797615592630
- Berkowitz et al. 2015, *Science*, doi:10.1126/science.aac7427; Frank 2016 comment, doi:10.1126/science.aad8008; reply doi:10.1126/science.aad8555
- J-PAL, Maternal literacy and participation programs (Bihar, Rajasthan): https://www.povertyactionlab.org/evaluation/maternal-literacy-and-participation-programs-child-learning-india
- Gunderson et al. 2013, *Child Development*, doi:10.1111/cdev.12064; Gunderson et al. 2018, *Dev Psych*, doi:10.1037/dev0000444; Gunderson, Donnellan, Robins & Trzesniewski 2018, *JECP*, doi:10.1016/j.jecp.2018.03.015; Bennett-Pierre et al. 2024, *JECP*, doi:10.1016/j.jecp.2024.106032
- Haimovitz & Dweck 2016, *Psychological Science*, doi:10.1177/0956797616639727; 2017 *Child Development*, doi:10.1111/cdev.12955
- Rogers & Feller 2016, *Psychological Science*, doi:10.1177/0956797615623770; Rogers & Feller 2018, *Nature Human Behaviour*, doi:10.1038/s41562-018-0328-1

Monitoring, disclosure, AI-product precedents, platform
- Stattin & Kerr 2000, *Child Development*, doi:10.1111/1467-8624.00210; Tilton-Weaver et al. 2013, *Dev Psych*, doi:10.1037/a0031854
- OpenAI parental controls (TechCrunch, 2025-09-29): https://techcrunch.com/2025/09/29/openai-rolls-out-safety-routing-system-parental-controls-on-chatgpt/
- Character.AI Parental Insights (2025-03-25): https://blog.character.ai/introducing-parental-insights-enhanced-safety-for-teens/
- WhatsApp Business general-purpose AI ban, 15 Jan 2026 (respond.io summary): https://respond.io/blog/whatsapp-general-purpose-chatbots-ban

Repo (not repeated here): `docs/research/design/parent-experience.md` (Kraft & Rogers, Bergman, Cortes, Angrist,
Dizon-Ross, Rocket Learning, CMS 2025, ASER 2016, LocalCircles, NCPCR, WhatsApp pricing),
`docs/research/learner/need-goals.md` (NCERT 2022 survey, Barger, Patall, Chi), `docs/research/realtime-cost-model.py`.

---

## Architect review

**Date:** 2026-10-02 · **Reviewer stance:** adversarial systems architect. I read this file against
`docs/ARCHITECTURE.md`, the repo `CLAUDE.md` binding constraints (Azure-only, hosting on Azure Container Apps),
`conductor/orchestration-architecture.md` and its Architect review (R1-R9, A1-A19), `conductor/day-cycle.md`
Architect review (AR-1), `design/parent-experience.md` §8-§12, `design/onboarding-flow.md` (O5-O9) and the
sibling contracts and SQL. Tags as in the header. The cost and capacity numbers come from
`conductor/parent-loop-review-cost.py`. It is reproducible, takes its prices from `realtime-cost-model.py` and
tech-and-market §744, and every number it prints is a model **[I]/[U]**.

**Verdict.** The pedagogy and the policy layer are the strongest part of the parent design so far. PL1, PL4,
PL8-PL10 and the decline table should survive unchanged. The plumbing under them has seven defects that block
a build. The worst is a **safety race**: §8.3 sends the S-class parent alert "immediately", but the suppression
branch depends on whether a family member is implicated, and that is often only said turns later, or never
said outright. The other blockers are:
- a commitment cap that does not hold under concurrency,
- a voice note whose audio is not the text that passed the lints,
- a voice PTM with no transport for its tools and checks,
- a routine detector that writes a false sentence into the letter,
- an alert gate whose 14-day cap can never fire,
- one WhatsApp number carrying the "cannot be turned off" safety promise.

v1 is also about twice the needed scope (five alert classes, a WhatsApp ask lane, sol prep, two voice-note
options, an adaptive capacity dial). Several child-side moments are not designed: the home activity at the
dinner table, the struggle alert that makes a parent anxious, a pause the child was not told about, and the
teen who wonders whether the teacher reports to Papa.

**Host note.** The task brief describes Vercel functions (sin1). The repo's binding decision
`hosting-azure-container-apps` has superseded that: `taxila-web` on ACA, scales on HTTP, SIGTERM then SIGKILL
after 30 s on scale-in, plus a `taxila-worker` app (orchestration R1). Below, "cannot run on a request" means it
fits neither a Vercel function nor a `taxila-web` replica, and it goes on the worker.

### PA0. Findings on one screen

Severity follows orchestration R0. **P0** = fix before this lane ships. **P1** = fix before ~1k families or
the named milestone. **P2** = simplify.

| id | sev | finding | fix |
|---|---|---|---|
| PA1 | P0 | **S-alert race.** §8.3/§8.4 send the S parent alert immediately and evaluate `protocol.suppressParent(c)` at gate time. In real disclosures the perpetrator is named late ("I'm scared to go home" … three turns later "Papa hits me"), indirectly, or not at all. By the time the branch knows, the implicated parent already has a push. S candidates also carry no dedupe key, so an at-least-once redelivery of `safety.incident` sends a second alert | Split S by category, add a settle window, route `unknown` to a human, dedupe on `incidentId` (PA-1) |
| PA2 | P0 | **The "cannot be turned off" promise rides one WhatsApp number plus an optional app push.** A parent who blocks the number, or a number whose quality rating drops, or a web-only parent with no push token, gets no S alert. Nothing escalates on non-delivery. P8 tells the parent "safety messages always come", which is a promise no mechanism backs (PL12's own rule) | Delivery confirmation plus an escalation ladder; reword P8 to what the system actually guarantees (PA-2) |
| PA3 | P0 | **Voice PTM has no server path.** On WebRTC the realtime tool calls and output transcripts arrive at the *client*. §7.3's tools, §7.5's claim-checker and the "correction on the next turn" all need a server, and the doc names none. A server sideband (`wss://…/realtime?call_id=` [V Azure]) is a 10-minute WebSocket, which fits neither a request nor a `taxila-web` replica | Client-relayed per-turn route in v1, like the Director; the sideband only from `taxila-worker` later (PA-3) |
| PA4 | P0 | **Voice note: the audio is not the linted text.** Option A asks a conversational realtime model to "render a fixed script", and such models paraphrase and add. The lints passed a script that is not what the parent hears. Also, WhatsApp template headers support text, image, video, document and location but not audio [V Meta], so a weekly voice note cannot go out in the template at all. It can only be sent as a free-form message inside a service window opened by the parent's *Suno* tap. And `parent-loop.sql` line 2 says "Audio is never stored" while `weekly_letter.voice_asset` and §5.4 store it for 30 days | Option B (TTS, text = audio) is the default; render lazily on the tap; option A only with STT-diff before send; fix the storage rule's wording (PA-4) |
| PA5 | P0 | **The commitment cap is write skew.** `insert … where (select count(*) … status='open') < 4` under READ COMMITTED lets two concurrent transactions both read 3 and both insert: two guardians on PTMs at once, text PTM plus WhatsApp, or a luna response with two *parallel* `create_commitment` tool calls. "≤ 2 per conversation" has the same hole | Serialise on the child's row (PA-5) |
| PA6 | P0 | **The routine detector writes a false sentence.** `detectRoutine` maps "≥ 3 of the last 5 closes `strained`" to `letterLine('ended_early', 3)`. Lessons that finished on time but closed strained get reported as "3 of the last 5 lessons ended early", which breaks PL4. The trigger is also a vibe inference reaching the parent, which PL9, PP3 and vibe-temperament forbid however it is worded | Delete the third rule from parent output; keep it Conductor-internal (PA-6) |
| PA7 | P0 | **`gateAlert` bugs.** (a) `recentlySent(c.dedupe, 14)` with the week-scoped dedupe `L:${skill}:${isoWeek}` never matches the previous week, so the "≤ 1 per 14 days" cap cannot fire. (b) W ignores quiet hours and its own "≤ 1/week coalesced" cap. (c) A test-risk L alert during quiet hours folds into a letter up to 6 days away, after the test. (d) The weekly letter is rendered at cutoff and sent hours later, but nothing re-checks the safety hold, consent, STOP or a deleted lesson at send | Corrected gate (PA-7) |
| PA8 | P1 | **PTM voice cost is about 1.3-2× the doc's figure.** The parent lane carries core + ParentBrief + agenda (~4k text tokens) plus accumulating tool results, at $4/M text-in on rt-2.1. The model gives **$0.10-0.15/min**, so 2 × 10 min = **$2.0-3.1/month, 64-99% of revenue** [I]. That sits on top of child lessons that already exceed revenue on rt-2.1 (day-cycle AR-1). The text lane's "30 turns/day" is per guardian with no monthly cap: two guardians at the cap cost $3.6/month | 1 included voice PTM per month, 8 min; prune tool items; test rt-2.1-mini by ear; monthly text cap per child (PA-8) |
| PA9 | P1 | **WhatsApp's sending tier caps the Sunday letter.** New portfolios start at **250 unique users per 24 h**, and 2,000 only after a scaling path that itself needs high-quality template sends [V Meta]. With Sunday 10:00 as the default `reportSlot`, family 251 gets nothing, and a burst of blocks at launch lowers quality, which also hurts the S channel (PA2) | Spread default report days, run a tier-aware send scheduler, alarm on quality rating (PA-9) |
| PA10 | P1 | **Inbound webhooks are unspecified.** ACS delivers through Event Grid at least once. Nothing dedupes by message id, nothing acks before the luna call, quick-reply payloads do not carry the letter or week (a *Ho gaya* on last week's card lands on this week's assignment), and STOP does not cancel already-queued outbox rows | Dedupe, ack-then-enqueue, versioned payloads, STOP cancels the outbox (PA-10) |
| PA11 | P1 | **Commitment due dates race the letter.** A commitment due on Saturday evening falls after the 30 h data cutoff (orchestration R3.4), so the Sunday letter says nothing about it, or reports it "missed" even though the check happened at 17:00. `weekly_letter.ledger_hash` "for idempotent re-render" contradicts R3.4 | Snap `dueAt` to the letter cutoff and close commitments inside the letter job (PA-11) |
| PA12 | P1 | **Proposal adoption is asynchronous, but the agent speaks as if it were done.** After `propose_schedule` the agent will say "theek hai, 7 baje kar diya" before the Conductor has adopted it, or after it has rejected it (cap, band rule, school hours) | `propose_*` runs one inline `step()` and returns `adopted` / `rejected{reason}` / `pending`; the wording shape follows the result (PA-12) |
| PA13 | P1 | **The claim-checker as a "code parser" of free Hindi, Hinglish and English is not buildable to the PLI1 bar.** Skill names, state words, counts and dates in free text cannot be matched to fact ids by regex. It would quietly become a second model, and its failure mode (error, timeout) is undefined | Structured cited output in text lanes; a brief-bounded lexicon check in voice; fail closed (PA-13) |
| PA14 | P1 | **The teen leak guard (§7.5.3) depends on a per-utterance "personal vs learning" label that no component produces** | Make it structural: B3-B4 data never reaches the parent lane unless transcript access is on (PA-14) |
| PA15 | P1 | **Two writers for the capacity dial.** §11.2 makes the parent API the only writer of `guardian_profile.involvement`, while §6.3 auto-adjusts `capacityDial` from feedback | The effective dial becomes a pure function; no stored writer (PA-15) |
| PA16 | P1 | `care_note`: "renewable once" is unenforced, because any number of `renewed=true` rows can be chained. Expiry depends on a `care_note_expiry` wakeup, a timer whose loss leaves `gentle_mode` on forever | `renewed_from` with a unique FK; filter on `expires_at > now()` at read (PA-16) |
| PA17 | P1 | **PTM voice competes with children for realtime.** It shares the 10 RPM session-start bucket and the TPM with child lessons (orchestration R3.3), and parents are free at the same 19:00-21:00 peak | Admission priority below child lessons and reconnects; when busy, offer text or a booked slot (PA-17) |
| PA18 | P1 | **`ptm.prep` on sol cannot serve an on-demand PTM.** The parent taps "Teacher se baat" and a reasoning model has not run yet. The agenda is already structured data in the ParentBrief | Code-built agenda; drop sol from v1 (PA-18) |
| PA19 | P1 | **The support SLA is a single person.** `open_support_ticket` returns `slaHours`, and the agent says it aloud. With one human on support (orchestration R4) the SLA is a promise nobody backs | SLA read from a rota table; an honest fallback line (PA-19) |
| PA20 | P2 | v1 over-scope: WhatsApp ask lane, `struggleSooner` push, the full alert lifecycle, option A voice, sol prep, the 6-rank catalogue, the adaptive dial, three guardian roles, `avoid_topic` | PA-20 |
| PA21 | P1 | Child-experience gaps: weak skills sent home, alerts the child never hears about, a voice note overheard on speaker, a parent's worry hijacking lessons, a pause the child did not see coming, the teen's trust that the teacher is not Papa's informant, intake blocking the handover | PA-21 |

---

### PA-1. Safety alerts: split by category, settle, then send (PA1)

The child-side floor does not move. The teacher gives care and helplines (Childline 1098, Tele-MANAS 14416)
on the turn the statement arrives, as gurukul §4.4 and §8.3 say. Only the *parent* notice changes:

| S category (safety monitor) | parent notice | human |
|---|---|---|
| `self_harm` / `suicidal_ideation`, and **no family mention** in the incident window | sent at **settle**: when the protocol's in-lesson script closes, or 10 min after the incident opened [U: advisor sets the window], whichever is first | queue entry for content release (unchanged) |
| any category where the monitor's `familyImplicated ∈ {yes, unknown}`, or category `abuse` / `neglect` / `violence_at_home` | **never auto-sent.** Human queue first, paged on entry, 2 h escalation to a second named adult (orchestration R4) | the human decides whether to contact the parent, Childline or both |
| `moderation_flag` (content, not disclosure) | none | audit sample |

"Unknown" is the honest default. Most disclosures do not name a person, and a code default of "not implicated"
is the dangerous direction. The settle window exists so that an implication arriving in the next turns can
still flip the branch. Implementation:

```ts
// shared/parent/safety-gate.ts — runs on safety.incident AND safety.incident_updated; idempotent per incident
export interface SafetyIncidentView {
  incidentId: string; category: 'self_harm'|'suicidal_ideation'|'abuse'|'neglect'|'violence_at_home'|'moderation_flag'|'other';
  familyImplicated: 'yes'|'no'|'unknown';      // monitor output; 'no' only with an explicit non-family referent or none needed
  openedAt: string; protocolScriptClosedAt?: string; humanDecision?: 'notify_parent'|'childline_only'|'no_contact';
}
export function safetyParentNotice(i: SafetyIncidentView, now: Date): 'wait' | 'send' | 'human' | 'none' {
  if (i.category === 'moderation_flag') return 'none';
  if (i.humanDecision) return i.humanDecision === 'notify_parent' ? 'send' : 'none';
  if (i.familyImplicated !== 'no' || ['abuse','neglect','violence_at_home'].includes(i.category)) return 'human';
  const settled = !!i.protocolScriptClosedAt || now.getTime() - Date.parse(i.openedAt) >= 10 * 60_000;
  return settled ? 'send' : 'wait';               // 'wait' schedules a wakeup at openedAt + 10 min
}
// dedupe for every S candidate: `S:${incidentId}` → parent_alert unique(child_id, dedupe) makes redelivery a no-op
```

A `safety.incident_updated` that flips `familyImplicated` to `yes` *after* a send is the residual risk. It
writes a P0 incident and pages the human. The doc should say plainly that this case exists.

**Shared phone (PP7).** The S push text names nothing ("Taxila: please open the app and enter your PIN"). The
content sits behind the PIN. Even a child who sees the notification on Papa's phone learns nothing from it.

### PA-2. A safety channel that can actually reach the parent (PA2)

```
S notice ─► WhatsApp utility template (pointer only) + app push (if token) ─► wait for delivered receipt (ACS Event Grid)
   ├─ delivered + opened in app within 30 min ─► acknowledged
   ├─ not delivered within 5 min (failed / blocked / no token) ─► second channel: SMS [M: TRAI DLT sender + template
   │     registration has a lead time; start it now] or ACS outbound PSTN call with a fixed recorded message [M: India PSTN availability on ACS]
   └─ nothing acknowledged within 30 min ─► human queue "parent unreachable"; the child keeps the helplines in-app
```

P8 is reworded as a shape: ⟨safety messages are sent even if reports are off⟩ ⟨if WhatsApp is blocked we
try SMS/call⟩. It must not say "always come". A promise the system cannot keep is the PL12 failure mode.
Add PLM14: time from incident to delivered parent notice, and the unreachable rate.

### PA-3. Voice PTM transport (PA3)

| need | v1 (client-relayed, stateless) | later (sideband) |
|---|---|---|
| tool call | client receives `response.function_call_arguments.done` on the data channel → `POST /api/parent/ptm/tool {convId, callId, name, args}` → server runs the tool (scoped to `convId`'s guardian and child) → client sends `conversation.item.create{function_call_output}` + `response.create` | `taxila-worker` holds `wss://<res>.openai.azure.com/openai/v1/realtime?call_id=…` [V Azure WebRTC doc]; the client never sees tool results |
| claim check + PX lint | client posts each `response.output_audio_transcript.done` to `POST /api/parent/ptm/turn`; the server checks it and returns `{instructions?}`; the client applies it with `session.update` (the same contract as the Director, ARCHITECTURE §1.2) | the worker sends `session.update` directly |
| hard stop at 10 min | server-minted ephemeral session carries the expiry; the server refuses tool calls after `startedAt + 10 min`, and the client closes | the worker closes the call |
| trust | tool args are untrusted. The server binds `convId` → guardian → child from the auth cookie, never from args. A modified client can only skip the checks on its own session, and `report.ptm_summary` is rebuilt server-side from tool results (§7.5.4), so it cannot be forged | moot |

Latency: every tool call is a dead-air round trip, India → eastus2 → Neon → back (~250-400 ms [U, CM13]).
The opening agenda and the whole ParentBrief therefore go into the compiled instructions at session start.
Tools are only for drill-down (`get_skill_evidence`, `get_transcript_excerpt`), and the turn-shape rule says to
⟨acknowledge before looking something up⟩. Prune function-call items from the realtime context after use with
`conversation.item.delete`. The same pruning that keeps lessons cheap keeps the PTM cheap (PA8).

### PA-4. Voice notes: TTS by default, rendered on tap (PA4)

- **Delivery reality.** The template card carries an image header (allowed), the text and the *Suno (1 min)*
  quick reply. The tap opens the 24 h service window, and inside that window a free-form audio message is
  allowed and free, as are utility templates [V Meta pricing]. So the note is sent as a reply to the tap. In
  the app it plays from the letter view.
- **Render lazily.** Render when *Suno* is tapped or the app view opens, on `taxila-worker`, and cache it on
  `weekly_letter` for the 30-day TTL. At a 20-70% play rate that is $0.02-0.06/month for option B instead of
  $0.08 pre-rendered, and $0.08-0.29 instead of $0.42 for option A [I, cost script §B]. The tap-to-audio wait
  (TTS of 75 s takes a few seconds [U]) is acceptable for a voice note, and the reply can first send "1 minute"
  as a typing indicator.
- **Text equals audio.** Option B (gpt-4o-mini-tts, or Azure neural TTS) speaks the lint-passed script
  verbatim. Option A stays a candidate only if it wins PLM9 by ear. In that case every render is
  re-transcribed (MAI-Transcribe, ≈ $0.002) and diffed against the script with a normalised token edit
  distance. Above 0.1, or on any added claim-lexicon token, the render is discarded and option B is used.
  Same voice (PL2): whether gpt-4o-mini-tts offers the teacher's realtime voice name is **[M]**. If it does
  not, PLM9 must include "is this the same teacher?" as an outcome.
- **Storage rule wording.** "Audio is never stored" means *child and parent audio*. Generated teacher audio
  is an asset with a TTL. Change the SQL header to say exactly that, or the next reviewer deletes
  `voice_asset`.

### PA-5. Commitment cap that holds (PA5)

```sql
-- replaces the comment at parent-loop.sql:37-39; runs inside the create_commitment transaction
create or replace function create_commitment(p_child uuid, p_guardian uuid, p_conv uuid, p_kind text,
  p_refs text[], p_due timestamptz) returns uuid language plpgsql as $$
declare v_id uuid := gen_random_uuid();
begin
  perform 1 from child_seq where child_id = p_child for update;          -- serialises per child (orchestration R2.1 row)
  if (select count(*) from parent_commitment where child_id = p_child and status = 'open') >= 4 then return null; end if;
  if p_conv is not null and (select count(*) from parent_commitment where created_in = p_conv) >= 2 then return null; end if;
  insert into parent_commitment (id, child_id, guardian_id, kind, refs, due_at, created_in)
  values (v_id, p_child, p_guardian, p_kind, p_refs, p_due, p_conv);
  perform ingest_event(p_child, gen_ulid(), 'parent.commitment_created', 'agent', 'commit:'||v_id, now(),
                       coalesce(p_conv::text, v_id::text), null,
                       jsonb_build_object('commitmentId', v_id, 'kind', p_kind, 'dueAt', p_due, 'refs', p_refs));
  return v_id;                                                            -- null → tool returns {denied:'cap'}
end $$;
```

`ingest_event` takes the same `child_seq` row lock, so there is no lock-order inversion. Parallel tool calls
from one luna response are executed **sequentially** by the tool runner for any `create_*` or `propose_*`
tool. Invariant PLI13 is a simulator test with 8 concurrent creators that never ends above 4 open.

### PA-6. Routine lines are facts or nothing (PA6)

```ts
export function detectRoutine(last5: LessonClose[], gapDays: number, regularBefore: boolean): AlertCandidate[] {
  const out: AlertCandidate[] = [];
  if (gapDays >= 14 && regularBefore) out.push(letterLine('gap_days', gapDays));
  const early = last5.filter(l => l.reason === 'child_left' && l.minutes < l.planned / 2).length;
  if (early >= 3) out.push(letterLine('ended_early', early));              // the real count, not a constant
  return out;                                                              // 'strained' closes → Conductor re-plan only
}
```

The strained-close signal stays a Conductor input (re-plan: shorter segments, choice-first). It never
produces a parent line, so PLI5's module boundary ("the alert builder cannot import vibe state") holds for R
as well as W. Add that to PLI5.

### PA-7. Corrected gate (PA7)

```ts
export function gateAlert(c: AlertCandidate, s: ConductorState, p: GuardianProfile, protocol: ProtocolView,
                          sent: SentIndex, now: Date): GateResult {
  if (c.cls === 'S') return { out: 'queued', channels: ['whatsapp', 'push'], ignoreQuiet: true };  // only after safetyParentNotice()==='send' (PA-1)
  if (s.safety.holdIncidentId) return { out: 'suppressed', reason: 'safety_hold' };
  if (c.cls === 'W') {
    if (!protocol.wellbeingAllowed(c, s, p)) return { out: 'suppressed', reason: 'consent' };
    if (sent.countSince('W', c.childId, days(now, -7)) >= 1) return { out: 'folded_into_letter', reason: 'cap' };
    return { out: 'queued', channels: ['app', 'whatsapp_pointer'], notBefore: quietEnd(now, p.alertPrefs) };
  }
  if (c.cls === 'R' || c.cls === 'C' || c.route === 'letter') return { out: 'folded_into_letter' };
  if (sent.countSince('L', c.childId, days(now, -14)) >= 1) return { out: 'folded_into_letter', reason: 'cap' };  // by class, not dedupe key
  if (s.notify.learningMsgsThisWeek >= 2) return { out: 'folded_into_letter', reason: 'cap' };
  return { out: 'queued', channels: ['whatsapp'], notBefore: quietEnd(now, p.alertPrefs) };    // delay to morning, don't fold
}
```

Add `notBefore` to `GateResult`. Letters get their own send-time gate in the Notifier, not at render:
re-read `safety.holdIncidentId`, the consent version, `reports` on/off, and whether every `factId` in
`story` still resolves (a lesson deleted between render and send drops the letter to re-render). Invariant
PLI17.

### PA-8. Cost (PA8)

From `parent-loop-review-cost.py` [I]:

| item | doc §13 | model | v1 recommendation |
|---|---|---|---|
| voice PTM | $0.08/min, 1-2 × 8 min | rt-2.1 $0.10 (70% text cache) to $0.15/min (no cache); mini $0.034/min | **1 included per month, 8 min**. Prune tool items. Add rt-2.1-mini as a PLM9 arm (parents are adults, and the PTM is not the child's teacher voice in a lesson). The owner's quality rule stands, and the ear decides |
| voice note | $0.08-0.48 | lazy: $0.02-0.06 (B), $0.08-0.29 (A) | B, lazy |
| text PTM | $0.01 | $0.03 typical; $1.8 per guardian at the doc's daily cap | **300 turns per child per month** across guardians; past it, the PTM is offered by voice or next month. Never cut off mid-answer |
| missing lines | — | intake call once (≈ 8 min voice ≈ $0.8, one-off), extraction per intake turn, claim/lint pass per text turn, safety classifier on every inbound | listed in the script; small except intake |
| total | $0.77-1.80 (25-58%) | — | **≈ $1.09 (35%)** with one cached rt-2.1 PTM, ≈ $0.43 with mini |

The "last thing to cut" reasoning (Angrist) stands. But the parent loop sits on top of a child lane that
already costs more than revenue (day-cycle AR-1), so the PTM cap is a pricing decision for the owner and not
a research default. Log it as `pl-ptm-cap` with reversal "PLM6 users show PLM3/PLM4 gains at ≥ 2/month".

### PA-9. WhatsApp sending tier and quality (PA9)

- **Default report day is spread.** New guardians get `reportSlot.weekday = hash(guardianId) mod 7`, and
  10:00 is offered as a time, not a day. Choosing Sunday is one tap. At the starting tier this is the
  difference between 250 and 1,750 families a week [I, script §D].
- **Tier-aware scheduler.** The Notifier reads the current limit from the webhook field
  (`max_daily_conversations_per_business`, v24+ [V Meta]) and never plans more business-initiated sends in a
  24 h window than 90% of it. Order: S first, then letters, then everything else. Overflow letters move to
  the next day with the app copy available on time. Letter sends are spread over the parent's chosen hour
  (orchestration R3.2 jitter).
- **Quality alarm.** Block/report rate and template quality are ops metrics with a page threshold (PLM13),
  because a quality drop throttles the S channel too. A second, safety-only sender number is **[M]**: it
  depends on whether Meta and the BSP allow a separate number per use case under one portfolio.
- **Template discipline.** Content changes need re-approval. Templates are therefore variable-only shells
  ("{{1}}'s week: {{2}}"), and every wording change ships through the variables, which the lints cover. A
  template that Meta categorises as marketing is billed as marketing at time of use [V Meta]. The ops
  dashboard shows each template's current category.

### PA-10. Inbound handling (PA10)

```
ACS Event Grid ─► POST /api/wa/inbound (taxila-web, ≤ 1 s): verify signature → insert wa_inbound(message_id PK) on conflict do nothing
               → if STOP/Band karo: in the same transaction set reports=false and cancel queued outbox rows for that guardian
               → enqueue parent.inbound (fast lane) → 200
taxila-worker: parent.inbound → safety classifier → button payload | scoped lane (deferred, PA-20) | "PTM in the app" link
```

Quick-reply payloads are versioned: `ha:{letterId}:{assignmentKey}:done`. A payload whose letter is not the
child's latest is still recorded, against *its own* week. Recipients are keyed by BSUID once ACS supports it
(orchestration R3.7) [V ACS].

### PA-11. Commitments close inside the letter job (PA11)

- `dueAt` is snapped to the cutoff of the letter that will report it: `cutoffAt(next letter after created +
  ≥ 3 lesson days)`. The promise shape then says ⟨in your next letter⟩, not a weekday that can drift.
- `parent.letter` for (child, isoWeek) first runs `commitment.fulfil` for every open commitment with
  `due_at <= cutoffAt`, in the same job, then builds the WeekStory. No wakeup ordering is involved.
- `weekly_letter` is idempotent on `unique(child_id, iso_week)`. `ledger_hash` is audit only (orchestration
  R3.4). A re-render is an explicit operator action that bumps `render_version`.
- `human_followup` commitments are outside this rule. They close on the ticket.

### PA-12. Proposals answer with what actually happened (PA12)

```ts
type ProposalResult = { status: 'adopted'; effectiveFrom: string } | { status: 'rejected'; reason: 'band_cap'|'school_hours'|'bedtime'|'focus_cap'|'prereq_first' }
                    | { status: 'pending'; reviewBy: string };   // pending only if the inline step lost the lease
```

`propose_*` ingests the event and runs one inline `step()` (inline lane ≤ 10 s, orchestration R1), then
returns the result. The answer shapes map one-to-one: ⟨done, from tomorrow⟩, ⟨can't, because X; offer Y⟩,
⟨asked; you'll see it in the app by Z⟩. `effectiveFrom` is never "today" for anything shown to the child
(PA-21 C9).

### PA-13. A claim-checker that can be built (PA13)

- **Text lanes (PTM text, letters, summaries).** The model returns
  `{segments: Array<{text, cites: factId[]}>}` (JSON schema). Code then does three things:
  - (1) verifies that every cited `factId` is in this conversation's ParentBrief or tool results;
  - (2) for each segment, extracts claim tokens with a small per-language lexicon (state words pakka/aa
    gaya/seekh rahi/mastered…, numbers, dates, skill-name aliases from the curriculum graph) and requires each
    one to agree with a cited fact's fields;
  - (3) rejects any uncited segment that contains a claim token.
  A failure triggers one regeneration with the failing segment named. A second failure, or a checker error,
  falls back to a fixed shape: ⟨I'd rather check than guess; it will be in your next letter⟩ plus
  `create_commitment`. Fail closed, never send unchecked.
- **Voice.** No structured output is possible. The instructions carry only brief facts. The post-check runs
  the same lexicon over the output transcript against the ParentBrief plus this call's tool results.
  Correction stays as designed, but it is worded as the teacher's own self-correction shape, not an
  announcement.
- PLM7 measures the lexicon's recall on the hand-labelled set. Where recall is low, the fix is more lexicon
  entries, not a free-grading model ("a model never grades").

### PA-14. Teen privacy by construction (PA14)

For B3-B4 children, `brief.refresh(lane:'parent')` and every PTM tool exclude child utterances, memories and
lesson summaries' quoted lines unless `transcriptAccess === 'on'`. When access is on, the excerpt tool returns
the excerpt as stored. It does not try to sort "personal" from "learning" talk. The parent turned access on
and the child was told (§9.2). PLI7 then becomes a static test: the parent-lane builders cannot read
`turn.text` for B3-B4 without the access row. A classifier is not involved.

### PA-15. Capacity dial with one writer (PA15)

```ts
// pure; computed at pick time; guardian_profile stores only the parent's declared ceiling
export function effectiveDial(declared: 0|1|2, hist: Array<{ fb?: HomeFeedback; week: string }>): 0|1|2 {
  const last2 = hist.slice(-2).map(h => h.fb);
  const backOff = last2.length === 2 && last2.every(f => f === 'no_time' || f === 'skipped');
  return Math.max(0, declared - (backOff ? 1 : 0)) as 0|1|2;
}
// "go up" is a parent tap that raises the declared ceiling through the parent API, the only writer of guardian_profile
```

### PA-16. Care note SQL (PA16)

```sql
alter table care_note drop column renewed,
  add column renewed_from uuid unique references care_note(id),
  add constraint care_note_one_renewal check (renewed_from is null or renewed_from <> id);
-- renewal: insert only if the source row itself has renewed_from is null (checked in the API transaction under the child_seq lock)
-- readers: ChildBrief builder selects effect where expires_at > now(); the wakeup only emits parent.care_note_expired for the parent's view
```

### PA-17. Realtime admission for parents (PA17)

The admission priority from orchestration R3.3 is extended: child reconnect (0) > child lesson start (1) >
**PTM voice (2)** > everything else. When the bucket is saturated, the PTM screen offers ⟨text now⟩ or ⟨book
a time⟩ (a slot outside 18:00-21:30 IST). The parent never takes a child's session.

### PA-18. Code-built PTM agenda (PA18)

The agenda is four lists that already exist in the ParentBrief and SchoolMirror (§7.2). `ptm.prep` becomes
a code function on the inline lane, ≤ 50 ms. sol is reintroduced only if PLM6 shows parents want a synthesis
that code cannot produce. Remove the sol row from §7.1 and §13.

### PA-19. Honest SLAs (PA19)

`open_support_ticket` reads `support_rota(kind, hours_ahead_covered, sla_hours)`. If no row covers the next
`sla_hours`, the tool returns `{ticketId, slaHours: null}` and the shape becomes ⟨your request is logged; you
will get a reply by email⟩, with no number. A stated SLA is checked daily against tickets past due (PLI9's
sibling: PLI19, "no stated SLA is breached without an apology message").

### PA-20. v1 cut (PA20)

| item | v1 | why |
|---|---|---|
| intake (voice or text), weekly letter (card + text), voice note B lazy, text PTM, 1 voice PTM/month, S + W routing, R lines in the letter, commitments, home activity (ranks 1-3) | **keep** | the loop the evidence supports |
| WhatsApp scoped ask lane | **defer** (policy [M], plus a second tool surface to secure) | the "PTM in the app" link covers it |
| L push (`struggleSooner`) | **defer to M2**; L goes in the letter only | pressure risk (PA-21 C2) without a measured benefit |
| alert lifecycle `acknowledged → resolved` | **keep `sent/failed/acknowledged` for S only** | others are letter lines |
| option A voice note, sol `ptm.prep` | **drop** (PA-4, PA-18) | cost and correctness |
| 6-rank catalogue, 9 materials | **~20 activities, ranks 1-3**, materials `none/roti/coins/clock` | content review is human time |
| adaptive dial + "offer to go up" | `effectiveDial` only (PA-15) | — |
| guardian roles owner/co_parent/viewer | **owner + viewer** | co-parent controls bring the conflict rules (§9.3) |
| care note `avoid_topic` | **drop**; keep `gentle_mode` | `avoid_topic` needs a curriculum content filter and sits closest to N10 |
| PLM3 per-family-week micro-RCT | **run once ≥ 500 active families** | underpowered before that |

### PA-21. Child-experience gaps (PA21)

- **C1 Only successes go home.** `pickHomeActivity` draws from `working` skills, which puts the child's weak
  point on the dinner table in front of a parent who may be maths-anxious (Maloney). The child's
  "explain it to Papa" moment should be one she can win. Rank 1-2 activities draw only from
  `canDo` (`aa_gaya` due for spacing, or `pakka`), never from `working`. The working skill stays with the
  teacher. Invariant PLI18.
- **C2 A struggle note is told to the child too (PL11).** When an L line or W note goes to the parent, the
  next lesson's brief carries `parentToldAbout: {topic}`. The teacher mentions it as a shape: ⟨I told Papa
  this one is tricky and normal, and what we're doing⟩. Every L line carries the rank-4 calm-reaction cue. No
  L content is sent within 24 h before a confirmed test, the hours when a pressure conversation does most harm
  [I]. It goes in the post-test letter.
- **C3 Assume the child overhears.** WhatsApp audio on a family phone plays on speaker. Voice notes and
  pushes pass a stricter version of PP7: nothing in the audio would embarrass the child if she heard it.
  Tricky bits are phrased as ⟨what we're working on together⟩ and never as ⟨what she can't do⟩.
- **C4 A parent's worry never takes over a lesson.** `probe_request` from a worry is a plan *weight* subject
  to N1 prerequisites. At most one parent-originated probe per lesson, placed after the success-first opener.
  A commitment never forces a probe. When the plan cannot reach it, the honest "I couldn't check yet" line is
  the right outcome (PP10).
- **C5 Pauses and time changes the child can see coming.** *Pause karein* or *Time badlein* from a WhatsApp
  button takes effect at the next day boundary, never mid-lesson. The child's home screen shows a warm "aaj
  chhutti" card (orchestration R7.10). At the next lesson the teacher says ⟨the family changed our time⟩
  without blame.
- **C6 The teacher does not carry tales from the PTM.** One character for both audiences (PL2) is a real cost
  to a teen's trust. Rule: nothing the parent *said* in intake or the PTM reaches the ChildBrief except as plan
  weights, care-note effects and the `homeLoop` mention. The teacher never says ⟨Mummy told me you…⟩. This is a
  static import check (PLI15), parallel to SS12's `ptm_note` isolation. PLM8 gets a B3-B4 item: "do you think
  the teacher tells your parents what you say?"
- **C7 Intake never blocks the child.** O8 hands the phone to the child, and the first lesson is the diagnostic
  (onboarding-flow). The intake call is offered at O9 *after* that lesson, or booked for later. If the parent
  starts it while the child is waiting, the call opens with ⟨is [name] waiting to use the phone?⟩ and offers
  ⟨later⟩.
- **C8 Child in the room during the PTM** (open question 7). Keep the ask. Also show a persistent "child
  present: can-do only" toggle on the PTM screen that the parent can flip at any time. Do not rely on one
  answer at minute 0.
- **C9 Plan stability.** Adopted focus or schedule proposals take effect from the next unshown slot or the
  next day (orchestration R7.2), so the child's screen never reshuffles because Papa had a PTM.

### PA-22. Amendments to §12 and §14

**New invariants** (each with a negative control):

| id | predicate |
|---|---|
| PLI13 | open commitments per child ≤ 4 and per conversation ≤ 2 under 8 concurrent creators (simulator) |
| PLI14 | no S notice reaches any guardian while `familyImplicated ≠ 'no'` and there is no human decision; S notices are unique per `incidentId` |
| PLI15 | no parent-authored text (intake extract, PTM turns, worries) is readable by the ChildBrief builder except `CareNote.effect` and plan weights |
| PLI16 | every sent voice note's transcript matches its lint-passed script (option B: by construction; option A: STT diff) |
| PLI17 | every letter send re-gates hold, consent, STOP and fact resolution at send time |
| PLI18 | no rank 1-2 home activity targets a skill not in `canDo` |
| PLI19 | no SLA is stated without a covering `support_rota` row |
| PLI5+ | the R and W builders cannot import vibe or motivation state |

**New measurements** (n, method, date):

| id | measure | decides |
|---|---|---|
| PLM11 | voice-note play rate (tap or app) by language and band | lazy-render economics, voice-note value |
| PLM12 | real PTM $/min and minutes per PTM, first 50 PTMs | PA-8 cap |
| PLM13 | WhatsApp block/report rate per 1k sends, template quality, tier over time | PA-9 |
| PLM14 | incident → delivered parent notice p95; unreachable rate; human ack time for `human` routes | PA-1, PA-2 |
| PLM9+ | add rt-2.1-mini and "same teacher?" as outcomes | PA-4, PA-8 |

### PA-23. Where each piece runs

| work | host | why |
|---|---|---|
| text PTM turn (luna + checker, ≤ 2 calls) | `taxila-web` inline, ≤ 10 s budget, else the fixed fallback shape | request-shaped |
| `/api/parent/ptm/tool`, `/api/parent/ptm/turn`, proposals with inline `step()` | `taxila-web` inline | stateless per turn |
| WhatsApp inbound | `taxila-web` ack + enqueue; `taxila-worker` processes | at-least-once, fast ack |
| letter build (commitment fulfil → WeekStory → render → card image) | `taxila-worker` fast lane, jittered per child | fan-out, CPU for the card image |
| voice-note render on tap | `taxila-worker` | seconds of TTS, optional STT diff |
| S settle wakeup, escalation ladder | `taxila-worker` ticker | timers |
| realtime sideband (later) | `taxila-worker` only | a 10-minute WebSocket survives neither a request nor an HTTP-scaled replica's 30 s SIGTERM |
| none of the above | Vercel | paused by `hosting-azure-container-apps`. If it were revived, the sideband and the ticker could not run there at all, and the letter fan-out would need an external queue |

### Sources for this review

- Meta, WhatsApp Business Platform messaging limits (250 unique users/24 h at start; 2,000 via scaling path;
  `max_daily_conversations_per_business` from webhooks v24) — https://developers.facebook.com/docs/whatsapp/messaging-limits [V]
- Meta, template components (header formats: text, image, video, document, location; GIF marketing only; no
  audio) — https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/components [V]
- Meta, pricing ("Utility templates delivered within an open customer service window are free"; "All
  non-template messages are free … only … within an open customer service window"; charges follow "the
  category applied to the template at time of use") — https://developers.facebook.com/docs/whatsapp/pricing [V]
- Microsoft, Azure OpenAI Realtime via WebRTC (server WebSocket to the same call:
  `wss://<resource>.openai.azure.com/openai/v1/realtime?call_id=<call_id>`) —
  https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/realtime-audio-webrtc [V]
- Microsoft, ACS Advanced Messaging for WhatsApp (Event Grid inbound, delivery reports, BSUID breaking change)
  — https://learn.microsoft.com/en-us/azure/communication-services/concepts/advanced-messaging/whatsapp/whatsapp-overview [V]
- Repo: `conductor/orchestration-architecture.md` Architect review (R1 lanes and ACA SIGTERM, R2.1 `child_seq`,
  R3.3 admission, R3.4 letter key, R4 SPOFs, R7), `conductor/day-cycle.md` AR-1, `realtime-cost-model.py`,
  `tech-and-market.md` §744 (luna price), `design/onboarding-flow.md` O8-O9, `design/parent-experience.md` §8, §12.
