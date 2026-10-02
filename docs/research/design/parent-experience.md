# Parent experience: research, teardown and design (Taxila)

2026-10-02 · scope: what Indian K-9 parents need to see and control, how competitors do it, and the
parent surfaces (onboarding, dashboard, weekly WhatsApp report, monthly "PTM", controls, alerts).
Builds on, and does not repeat: `docs/research/learning-science.md` (rules 22, 28, 30-35; §8 profile),
`docs/harvest/gurukul.md` §4 (minor safety) and §6 (design system), `docs/research/tech-and-market.md`.

Evidence tags (same as learning-science.md): **[V]** read in the primary source · **[S]** secondary
source / summary read · **[M]** needs verification before build · **[U]** untested hypothesis ·
**[inference]** my reasoning from the cited evidence, not a finding.

---

## 0. The decisions on one screen

1. **WhatsApp is the parent's primary surface; the app is the depth.** India has ~535M monthly WhatsApp
   users [S]; 90% of low-income households own a smartphone but children mostly use a *shared* one,
   most often the mother's (BaSE 2025) [S]. A separate parent app is friction most parents never pay.
2. **The weekly report is a utility message with zero selling in it.** Utility costs ₹0.1150 vs ₹0.8631
   for marketing (+18% GST) [S]; promotional content would reclassify it. Trust and cost point the same way.
3. **Every claim about the child carries "Kaise pata?" (how do we know).** Tap → the check, the date, the
   child's own words, and when it will be re-checked. Parents' beliefs about their child's level are
   wrong by >1 SD on average (Dizon-Ross, Malawi) [S]; ~30% overestimate maths grades (Bergman) [S].
   The report's job is calibration, not reassurance.
4. **"Pakka" (secure) is only claimed after a delayed re-check** (next session or later). Same-day success
   is "aa gaya" (got it today). This is the evidence-based differentiator and the core trust signal.
5. **One at-home action per week, specific and doable by a parent who cannot do the maths.**
   Improvement-focused, actionable teacher-to-parent messages cut course failure most (Kraft & Rogers
   2015, 15.8% → 9.3%) [V]; extra parent asks crowd out other useful parent behaviour (Robinson et al.
   2022) [S]. So: exactly one, and it replaces rather than adds.
6. **Cadence cap: ≤2 learning messages per week** (report + optional milestone). Parents preferred 3
   texts/week; 5/week and complex texts raised opt-out (Cortes, Fricke, Loeb, Song) [S].
7. **Reports default on via a one-tap choice, not a buried opt-in.** Opt-in take-up <1%, simplified
   opt-in 11%, opt-out 95% (Bergman, Lasky-Fink, Rogers, n=6,976) [S]. DPDP consent must be an
   affirmative act, so the lever is simplification: the primary button *is* the opt-in [inference].
8. **Effort is shown as actions, not minutes.** "Tried again after a mistake 4 times; explained in her
   own words 3 times; asked 2 questions". Minutes appear, secondary. No streaks, points, ranks.
9. **Level is shown against the syllabus, never against other children.** "Class 6; building the Class
   4 fraction steps first, then the Class 6 chapter". No percentile, no rank, no score prediction.
10. **One child on screen at a time; no sibling comparison anywhere.** Dizon-Ross: information made
    parents shift schooling investment toward the higher-performing child [S]; CMS 2025: households
    already spend more on boys [S]. The product must not become the instrument of that reallocation.
11. **Write every parent string as if the child will read it** (shared phone). **Parents see all
    learning; the child is told so up front** (age bands in §12). Safety alerts cannot be switched off.

---

## 1. What Indian parents want, and what Taxila can honestly show

### 1.1 Who the parent is in this product

- **Buyer, consenter, device owner.** DPDP requires verifiable parental consent for every under-18
  (Rule 10 applies from 13 May 2027) [V, via learning-science.md]. 72% of children access the household
  smartphone; 68% shared, 4% dedicated; sharing is likelier with the mother (BaSE 2025, n=12,500
  households, 10 states) [S]. Sessions happen when the phone is handed over [S].
- **Often not able to check the work.** ASER 2016: 46.7% of randomly surveyed rural mothers had never
  been to school [S]; in a rural India study only 16% of parents helped with homework [S]. Reports must
  work read aloud, in Hindi, with no maths needed to act on them.
- **Already paying for help outside school.** 27.0% of students take private coaching (25.5% rural,
  30.7% urban), up from 19.8% in 2017-18; coaching is ~41% of spend for those who take it (NSS CMS
  Education 2025, n=57,742 students) [S, secondary summary; check the PIB table]. Taxila competes with the tuition teacher, so it is judged on
  what tuition gives: a person who knows the child, syllabus coverage, test readiness, a remark.
- **Burned by edtech.** NCPCR summoned BYJU'S CEO in Dec 2022 over hard-selling, loans in parents'
  names, and bought phone numbers of children [S]. LocalCircles 2023: 81% of edtech users faced refund,
  trust or transparency issues; 32% of those named BYJU'S; 96% want cancellation and refund policies
  disclosed upfront [S]. BaSE 2025: 60% of EdTech-using families see risks (overuse, wrong
  information), and >66% who knew GenAI believe AI amplifies them [S].

### 1.2 The asks, mapped to honest evidence

| parent asks for (Indian school frame) | what Taxila shows instead of / alongside it | why |
|---|---|---|
| Marks, percentages | per chapter check: "8 of 10 on her own, 2 with a hint"; never a predicted exam mark | "on her own" vs "with help" is the evidence; a score prediction is a diagnosis in numbers (gurukul §4.6) |
| Rank in class | nothing comparative; level vs syllabus (§7 Level bridge) | comparison is the anxiety the product would sell the cure to (gurukul §4.7) |
| Syllabus coverage ("kitna course hua") | school chapter list from `data/curriculum/*.json`, four-state per topic, synced to what school is teaching now | the familiar frame; maps 1:1 to NCERT chapter and outcome IDs already in the repo |
| Time spent | minutes and days, as plain facts, secondary row | minutes reward screen time, not learning [inference] |
| Effort ("mehnat") | counted actions: retries after a mistake, own-words explanations, questions asked, "one more" chosen | process praise of the action; learning-science §3.6-3.7 |
| Teacher remarks | 2-3 sentence teacher note naming a skill and an observed action; "can do better" is banned | Kraft & Rogers: actionable, specific messages were the ones that worked [V] |
| PTM | a monthly voice "PTM" with the AI teacher, from the ledger only (§9) | PTM is a familiar ritual; Cuemath runs bookable PTMs [S] |
| Exam readiness | "Chapter 5: 9 of 12 skills pakka, 3 left" + a test-week window, never a countdown | gurukul §4.7: exam calendar renders a window |
| Homework help | not a parent feature; the child's teacher teaches toward the answer | academic integrity floor (gurukul §4.5) |

### 1.3 The NEP shift parents are meeting at school

NCERT PARAKH's Holistic Progress Card (classes 1-8) replaces marks-only cards with descriptive,
evidence-based feedback plus self-, peer- and parent input; parents comment on homework completion,
classroom engagement, and balancing screen time [S]. [inference] Taxila's monthly card can speak the
same competency language (outcome statements from the NCERT books) while still giving the chapter
counts parents want, and a parent can carry it to a real PTM.

---

## 2. What the parent-messaging evidence says

| study | finding | rule for Taxila |
|---|---|---|
| Bergman & Chan, JHR 2021, 22 schools, >1,000 households [S] | weekly automated alerts on missed work, grades, absences: course failures −27%, attendance +12%; no test-score effect; 32,000 texts for $63 | automate from the ledger; expect behaviour effects before score effects |
| Kraft & Rogers, EER 2015, n=435 [V] | weekly one-sentence teacher messages: failure 15.8% → 9.3%; *improvement* messages beat *positive* ones; they were actionable, slightly longer, about things parents could monitor outside class; they changed the *content* of parent-child talk, not its frequency | the home task is improvement-framed, specific, monitorable |
| Robinson, Chande, Burgess, Rogers, EEPA 2022, n=2,212 [S] | science-question texts raised science talk at home, no score effect, and *reduced* other parent behaviours (TV off, monitoring study) | one ask per week; the ask must be worth the parent's scarce attention |
| Cortes, Fricke, Loeb, Song (EFP) [S] | parents preferred 3 texts/week; 1 or 5 raised opt-out; more and more complex texts raised opt-out | ≤2 learning messages/week, short, one idea each |
| Bergman, Lasky-Fink, Rogers 2019, n=6,976 [S] | opt-in <1%, simplified opt-in 11%, opt-out 95%; only automatic enrolment moved achievement | the WhatsApp choice is the primary button at onboarding |
| Dizon-Ross, Malawi RCT [S] | parents' beliefs off by >1 SD; 30% wrong about which of two children performs better; information changed investment between siblings | calibrate beliefs with evidence; never show siblings side by side |
| Angrist, Bergman, Matsheng, Botswana (Nature Hum. Behav. 2022) [S] | SMS alone: no significant effect; SMS + 15-20 min weekly phone call with parent and child: +0.12 SD | a voice conversation (the PTM) is where effect may live; text alone may not [inference: their calls were human facilitators] |
| Rocket Learning, India, WhatsApp groups [S] | 5M children via parents; external eval: parents doubled play-based learning time; ~30% still engaged at 18 months; uses weekly report cards and public recognition | WhatsApp works at Indian scale; do **not** copy public recognition (comparison) |

---

## 3. Competitor teardown

| product | what the parent sees | cadence | what works | what fails or is risky | take / reject |
|---|---|---|---|---|---|
| **BYJU'S Parent Connect** (2017-) [S] | chapter-level progress per subject; graphs of time spent per subject; test and practice performance; recent achievements; "suggested actions" per subject | real-time | chapter structure matches the school syllabus; a single place for the parent | time-on-app is the hero metric [inference]; separate app; the brand's trust collapsed through sales conduct (NCPCR 2022), not the dashboard | take chapter frame; reject time-as-headline and any "suggested action" that is a purchase |
| **Cuemath Parent** [S] | session notes from the tutor after every class; monthly MathFit score on a 3-10 scale (fluency, understanding, application, reasoning; app listing adds memory); bookable PTMs; attendance; message the tutor; billing | per session + monthly | "Parents don't have to ask. The report arrives."; the PTM ritual; a named human tutor | one composite score invites ranking [inference]; iOS parent app 2.4/5 (n=9, update-loop bugs, "support chat bot is horrible") [S] | take auto-delivered report + PTM; reject composite score |
| **Toddle Family** (school LMS, 1000+ schools) [S] | attendance, assignments, timetable, gradebook, PDF progress reports, portfolio of photo/video/audio evidence, 1:1 teacher chat; AI drafts report comments from assessment data, teacher reviews before publish | school cycle | evidence embedded *in* the report; downloadable PDF; AI remark grounded in data | requires the school; built for literate, engaged parents [inference] | take evidence-in-report, PDF card, data-grounded remarks |
| **Khan Academy parent dashboard + Khanmigo** [S] | learning minutes, skills practised, skills mastered; Attempted / Familiar / Proficient / Mastered; up to 10 children; assign content; Khanmigo: chat history and moderation alerts | on demand | a mastery ladder parents can read; chat-history visibility and flagged-content alerts are industry precedent for an AI tutor | minutes as headline; dashboard needs a motivated parent; no time controls found on the parent page | take ladder idea (our 4 words), transcript access, moderation alerts |
| **ClassDojo** [S] | Class Story photos; child portfolio; messaging auto-translated to 35+ languages; behaviour points; Plus (paid): home points, progress reports with *point streaks*, Homework Helper AI, read receipts | daily | photo stories and translation reach low-engagement parents | points: research describes surveillance, performative compliance, public shaming, quieter children getting fewer points (Williamson; Manolev et al.) [S]; streaks sold to parents | take translation and photo-story warmth; reject points, streaks, home rewards |

**What nobody does** [inference from the above]: claim "secure" only after a delayed check; show
*how* each claim is known; give one parent action per week; speak the report in Hindi for a parent who
cannot read it; promise no sales calls in the product itself.

---

## 4. Parent-surface rules (PX)

- **PX1 Evidence or silence.** No sentence about the child without a ledger row behind it. "Taxila found
  what works best for her" needs the §8.4 threshold in learning-science.md; otherwise "still learning what
  works for [topic type]".
- **PX2 Four words for learning state**, never colours alone, never red: *Abhi nahi* (not yet) · *Seekh
  rahi* (practising) · *Aa gaya* (got it today) · *Pakka* (still right a week later). Maps to the
  ledger states unseen/introduced → practising → learned-today → mastered.
- **PX3 One "your turn" per screen** (gurukul four-state rule): the home task, or a consent step, or a
  payment fix. Never two.
- **PX4 No labels.** Bilingual ban list as a lint, shared with the tutor fence: weak/kamzor, slow, tez,
  dimaag/"dimaag nahi", nalayak, careless, lazy, "visual learner", any style label. Name the method,
  never the ability.
- **PX5 No affect claims.** Report behaviour ("asked for a break twice"), never inferred feelings
  ("was frustrated"). Learning-science §8.6 stores no inferred emotion; the report cannot invent it.
- **PX6 No comparison.** No rank, percentile, "ahead of X% of children", sibling view, or leaderboard.
- **PX7 No pressure on the parent either.** No absence alerts, no "falling behind" fear copy, no
  countdowns, no limited-time offers, no streaks. Nothing fires because a counter ticked.
- **PX8 Child-safe copy.** Every parent string passes "would this hurt if the child read it?".
- **PX9 Honest AI.** The teacher is introduced to the parent as an AI teacher. No string implies a human
  reviewed, was told, or will call (gurukul P5 relay-claim gate; must be implemented, it was not).
- **PX10 Read-aloud first.** Every report has a spoken version; every control has a speaker button.

---

## 5. Surfaces and information architecture

```
WhatsApp (primary, push)        Taxila app: Parent corner (depth, pull)       Voice (ritual)
- weekly report card + voice    - Home (this week)                             - monthly PTM call
- milestone (opt, ≤1/wk)        - Syllabus map                                 - "abhi baat karo"
- safety / account / payment    - Evidence ("Kaise pata?")
                                - Lessons + transcripts
Print / PDF                     - Controls · Data & privacy · Family
- monthly progress card         - Help, grievance, plan & billing
```

- **One APK, two modes.** Child mode is the default on the device. *Parent corner* sits behind a 4-digit
  parent PIN set at onboarding, OTP to the parent's number as recovery. A maths-question gate is rejected:
  a Class 6-9 child solves it [inference].
- **Deep links** from WhatsApp land in Parent corner (PIN still required); web `/parent` mirrors it (OTP).

---

## 6. Onboarding (parent first, value before trust)

Order follows gurukul §6.3: let them hear the teacher before the consent-heavy steps; never write
memory before consent.

| # | screen | content (notes, not lines) | evidence / rule |
|---|---|---|---|
| O1 | Language | three large tiles: हिन्दी · Hinglish · English, each plays a 3 s voice sample; chosen language sets report language too | low literacy; PX10 |
| O2 | Hear her | 20 s greeting from the teacher to the *parent*, starts with "I am an AI teacher"; transcript under it; "Aage" | disclosure at n=0 (gurukul P1) |
| O3 | Your number | mobile + OTP; this number receives reports | WhatsApp identity |
| O4 | Your child | name or nickname, class, board (from `boards.json`), medium of instruction, languages at home; school optional; no photo | data minimisation |
| O5 | Consent | verifiable parental consent via a Rule 10 route (DigiLocker token or verified adult identity) [M: legal]; then **unbundled** rows, each with a speaker button: lessons (required) · learning memory across days (recommended, real "no") · weekly WhatsApp report (primary button "Haan, WhatsApp par bhejo"; secondary "Sirf app mein") · voice moments (off) · who sees transcripts (§12, shown, not a toggle for under-10) | DPDP; Bergman defaults; gurukul `memory-asks-first` |
| O6 | Trust page | price per month in rupees, cancel in 2 taps, refund policy in full, "We never make sales calls", no EMI or loans, what we keep / never keep, data stored in Singapore (Neon ap-southeast-1, per `decisions.md#infra-segment`), grievance contact with 7-day acknowledgement | LocalCircles 96%; NCPCR; DPDP Rule 14 (90-day max) [S] |
| O7 | Parent PIN + limits | set PIN; daily time and allowed hours prefilled by class (§10), editable | |
| O8 | Handover | "Ab phone [child] ko dijiye"; child picks avatar, meets the teacher, who says parents can see what they learn; first lesson doubles as the oral placement diagnostic | learning-science rule 28; §12 honesty to child |
| O9 | Back to parent | first placement summary in level terms, 3 lines, "Kaise pata?" on each; report day and time picker (default Sunday 10:00) | Dizon-Ross calibration |

Drop-off guard: O1-O4 ≤ 90 s. Consent (O5) cannot be skipped, but each row is one tap.

---

## 7. Dashboard (Parent corner, Home)

```
┌───────────────────────────────────────────┐
│ [Riya  v]  Class 4 · CBSE        [speaker] │  child switcher: one child at a time
├───────────────────────────────────────────┤
│ IS HAFTE                                   │
│ 4 lessons · 3 days · 96 min                │  facts, ink-2
│ Mehnat: 5 retries after a mistake,         │  counted actions
│ 3 own-words explanations, 2 questions      │
├───────────────────────────────────────────┤
│ AB KAR SAKTI HAI                           │
│ [Pakka] Subtract 2-digit numbers with      │  outcome text from curriculum JSON
│         borrowing          Kaise pata? >   │
│ [Aa gaya] Read time on a clock to 5 min    │
│         re-check on Thu    Kaise pata? >   │
├───────────────────────────────────────────┤
│ ABHI SEEKH RAHI                            │
│ [Seekh rahi] Which fraction is bigger      │
│  Tricky bit: thinks 1/4 > 1/3 since 4 > 3  │  misconception, plain words
├───────────────────────────────────────────┤
│ ▌GHAR PAR EK KAAM            (your turn)   │  the only marigold block
│ ▌At dinner, cut a roti in 3 and in 4.      │
│ ▌Ask which piece is bigger and why.        │
│ ▌[Ho gaya]  [Is hafte nahi]                │  both are fine answers
├───────────────────────────────────────────┤
│ SCHOOL MEIN ABHI: Ch 5 Sharing and         │  school sync (Maths Mela,
│ Measuring [badlo] · 4 of 6 topics, 2 pakka │  c4-maths-ch05)
├───────────────────────────────────────────┤
│ TEACHER KI BAAT  (AI teacher)              │  2-3 sentences, specific
├───────────────────────────────────────────┤
│ Syllabus  ·  Lessons  ·  Controls  ·  Data │
└───────────────────────────────────────────┘
```

**Kaise pata? (evidence sheet).** Opens bottom sheet: the skill (outcome ID + text); each piece of
evidence as a row: date · probe type in plain words ("explained it to me in her own words", "spotted my
deliberate mistake", "got it right a week later") · the child's own words (transcript excerpt ≤ 25
words) · help used (hint ladder depth) · next re-check date. If audio moments are on, a play button.

**Syllabus map.** School chapters for the child's class and board, each with topic rows in PX2 states;
a header line shows chapters touched / topics pakka. **Level bridge** where diagnosed level < class:
a 3-step path ("Class 3 step · Class 4 step · Class 6 chapter"), current step filled. Copy frames it as
building the foundation first, never as "behind" (PX8). Learning-science rule 28 mandates reporting in
both terms.

**School sync.** "What is school teaching now?": pick a chapter from the curriculum JSON, or photograph
the school diary / homework page (OCR → chapter guess → parent confirms) [M: OCR quality on diaries,
gurukul flags CID-font textbooks]. Test dates entered here render as a *test week* window.

**Lessons.** Reverse-chronological list: date, minutes, topics, one-line summary; tap → summary +
transcript per §12. Delete per lesson.

---

## 8. Weekly report

**WhatsApp (utility template, parent's language, parent-chosen day, send window 08:00-20:00).**

- Header: **image** card 1080×1350, ≤300 KB, rendered server-side (works on any phone, survives
  forwarding to the other parent). Template headers support image/video/document; audio is not a header
  type [M: verify against Meta template docs], so the voice note follows as a service message after the
  parent taps "Suno", which opens the 24 h window.
- Body ≤ 5 short lines: name + week facts · 1-2 "can now do" · 1 working-on · the home task · nothing else.
- Buttons (3): *Suno (1 min)* (quick reply → voice note) · *Poori report* (URL → Parent corner) · *Ghar
  ka kaam ho gaya* (quick reply, logs it). Reply "STOP" or "Band karo" ends reports, confirmed in one
  message [M: Meta opt-out handling].
- No offers, prices, renewal nudges or referral asks, ever (keeps it utility and keeps it trusted).
- Week with zero lessons: the report still goes on its day, says so plainly with no guilt, and offers
  nothing to "fix" it (PX7).

**Card layout (mock, layout only; this is not prompt text and must never be pasted into a prompt):**

```
┌ Riya · Class 4 · 21-27 Sep ─────────────────┐
│ 4 lessons · 3 days · 96 min                 │
│ PAKKA     Subtracting with borrowing        │
│ AA GAYA   Reading a clock to 5 minutes      │
│ SEEKH RAHI  Comparing fractions             │
│ GHAR PAR: roti in 3 and 4, which is bigger? │
│ Taxila AI teacher · details in app          │
└─────────────────────────────────────────────┘
```

**Voice note (60-90 s, teacher's voice, parent's language).** Opens with "Taxila ki AI teacher" (every
synthesized clip carries a disclosure, gurukul §4.8); then shape: one concrete thing she did this week
(an action, not a trait) → what is pakka → what is tricky, in kitchen-table words → the home task with
the exact question to ask and what a good answer sounds like → close. Generated from ledger facts only
(engine/talk split, gurukul §7 row 4); passes PX4/PX5/PX9 lint before send.

**Cost** [S, Meta rates, inference on volume]: utility ₹0.1150 + GST ≈ ₹0.136/report → ≈ ₹0.59 per
parent per month; from 1 Oct 2026 service messages (the voice note) bill at the utility rate after
1,000 free per business number per month [S]. ≈ ₹1.2/parent/month before BSP markup (10-30% [S]), <0.5% of a ₹299 plan.
Marketing classification would cost 7.5× per message.

**WhatsApp policy constraint** [S]: since 15 Jan 2026 Meta bans general-purpose AI assistants on the
Business API; task-specific bots remain allowed. So WhatsApp carries reports and button replies only;
open-ended parent questions go to the in-app PTM. [M: confirm with BSP that a scoped "ask about your
child's progress" reply flow is permitted before adding one.]

**In-app weekly view** = the Home screen frozen at the week boundary, plus a "compare to last week"
toggle that compares the child only with her own past.

---

## 9. Monthly "PTM" with the AI teacher

- Parent taps *PTM karo* any time, or books a slot; 5-8 minute voice conversation in the parent's
  language with the month's card on screen. Disclosed as AI at the start.
- Agenda shape: 3 can-do with evidence · 1-2 tricky bits · what school is teaching vs what is pakka ·
  one home task · parent's questions.
- The teacher answers **only from the ledger**. Questions she must decline, with what she can say
  instead: predicted marks or rank (→ skills pakka out of total for the test chapters); comparisons with
  other children (→ her own past month); "is she intelligent / weak" (→ what she can do and the method
  that is helping). Never promises a human will follow up.
- Ends with a summary pushed to WhatsApp (utility) and saved in Lessons.
- **Printable monthly progress card (PDF)**: competency rows in outcome language (HPC-compatible),
  chapter counts, teacher note, no transcripts, no misconception detail; safe to show a school teacher.
- [U] Whether parents use a PTM with an AI at all is untested. Angrist et al. suggest the voice
  conversation is where the effect lives, but their caller was a human.

---

## 10. Controls

| control | default | notes |
|---|---|---|
| Daily lesson time | Class 1-2: 20 min · 3-5: 30 · 6-9: 45 [inference, no dose evidence] | at the limit the teacher closes at the next natural stop; no cliffhanger; +10 min needs parent PIN on the device |
| Natural break | every ~15 min (6-9 yrs), ~25 min (10-15) [inference] | stricter than SB 243's 3 h and gurukul's 1 h minor clock |
| Allowed hours | 07:00-20:30 | outside: child mode shows a calm "teacher is resting" screen |
| Language mix | from O1; slider Hindi-heavy · mix · English-heavy; on-screen script Devanagari / Roman / English | English-medium parents often want more English [U] |
| School sync + test week | off until set | renders a window, never a countdown |
| Notebook camera / screen view | off | parent-enabled; never recorded (gurukul §4.10) |
| Learning memory | from O5 | off = session-scoped only; withdrawal folds into delete |
| Voice moments (keep child audio clips) | off | separate opt-in, auto-delete 30 days [M: DPDP opinion]; default is transcript-only, audio deleted after transcription (rule 35) |
| Interest tags | learned in conversation | parent views, edits, deletes; sensitive categories never stored (§8.5) |
| Reports | weekly on; milestone on (≤1/wk); voice note on | day, time, language, channel (WhatsApp / app only) |
| Family | owner only | invite co-parent (full view + controls) or viewer (weekly report only, e.g. grandparent) by WhatsApp link |
| Data | | view all · export (readable PDF + JSON) · delete a lesson · delete transcripts · reset learning profile · delete child · delete account |

**Delete flow.** Two steps: plain statement of what goes and what stays (a content-free receipt) → hold
to confirm 2 s + OTP. Revocation is synchronous, physical purge async and retried until done, receipt
shown (gurukul §4.9). DPDP Rule 14 allows 7-day acknowledgement and 90-day completion [S]; the target is
immediate revocation, purge within 24 h [inference].

---

## 11. Alerts

| class | trigger | channel | cap | parent can turn off? |
|---|---|---|---|---|
| **Safety** | crisis, self-harm, abuse disclosure, or a moderation flag (Khanmigo precedent) | WhatsApp + push; in-app detail behind PIN | none | **No** |
| Account security | new device, PIN reset, export or deletion requested | WhatsApp | per event | No |
| Payment | renewal 3 days ahead; failure | WhatsApp | per event | No |
| Milestone | a skill turned *Pakka* that the parent asked about, or a chapter completed | WhatsApp | ≤1/week | Yes |
| Weekly report | schedule | WhatsApp | 1/week | Yes |
| Time limit reached | | in report only | | |
| Absence, streaks, "come back" | **never** | | | |

Quiet hours 20:30-08:00 for everything except safety.

**Safety alert design.** The WhatsApp text never quotes the child (the child may hold that phone; the
parent may be the risk). It says a safety-relevant moment happened, gives Childline 1098 and Tele-MANAS
14416 [M: re-verify numbers at launch], and points to Parent corner. A safeguarding-expert-defined branch
**suppresses parent notification** when the disclosure concerns a family member and routes to
Childline instead (learning-science rule 33: that judgment is not an engineer's). The child is never
promised secrecy (gurukul §4.4).

---

## 12. Visibility policy (what the parent can see, by age)

| | Class 1-4 (≈6-9) | Class 5-9 (≈10-15) |
|---|---|---|
| Skills, evidence, summaries | always | always |
| Full lesson transcripts | visible by default | available on parent request in Parent corner |
| Child told | at handover (O8) and via a persistent "Mummy-Papa dekh sakte hain" chip | same, plus an in-lesson line when transcripts are opened that week [U: test whether this helps trust or hurts disclosure] |
| Safety transcripts | shared on escalation unless suppressed (§11) | same |
| Live listen-in | no | no |

Rationale: learning-science rule 32 (parents see everything by default) vs gurukul §4.2 (a teen who
knows a parent reads will not disclose distress). The split age and the per-open notice are
**[inference]**, logged as a decision with reversal conditions in §15.

---

## 13. Design tokens and components (parent surface)

Inherits gurukul §6.2 scale discipline (6 type sizes, 4 px base, motion 90/160/240/140 ms,
reduced-motion collapse, 44 px targets, opaque 3 px focus ring, copy gate). Parent-specific choices:

**Type.** Body 16 px Latin / 17 px Devanagari, line-height 1.6 for Devanagari (matras and conjuncts clip
at 1.3) [inference]; caption floor 13 px on the parent surface (older eyes, low-end screens), stricter
than the 11 px system floor. Font stack `"Noto Sans", "Noto Sans Devanagari", system-ui`: Android ships
both, so the parent surface costs zero font bytes [M: confirm on Android 9-10 Go devices].

**Colour tokens** (WCAG ratios computed 2026-10-02 with the standard relative-luminance formula, script
in scratchpad; all pass AA 4.5:1 for body text):

| token | light | on paper `#FFFBF5` | dark | on paper `#16130F` | meaning |
|---|---|---|---|---|---|
| `--ink` | `#1F1B16` | 16.61 | `#F4EEE6` | 16.06 | text |
| `--ink-2` | `#5A5148` | 7.53 | `#C9BFB3` | 10.22 | facts, secondary |
| `--ink-3` | `#6B6158` | 5.86 | `#A99E92` | 7.05 | captions; also *Abhi nahi* outline |
| `--pakka` | `#1E6B47` | 6.27 | `#6FCF97` | 9.74 | secure |
| `--learning` | `#2F5DA8` | 6.26 | `#8DB4F5` | 8.80 | Seekh rahi / Aa gaya (neutral, in progress) |
| `--yourturn-text` | `#8A4B00` | 6.60 | `#FFC15E` | 11.50 | the one action; fill `#FFD27A` with ink = 12.03 |
| `--alert` | `#B3261E` | 6.34 | `#FF8A80` | 8.11 | safety and payment **only**, never learning |

State is always word + colour (PX2). *Aa gaya* vs *Pakka*: same chip shape, Pakka filled, Aa gaya
outlined, so the difference survives greyscale and colour-blindness.

**Components.** `ChildSwitcher` (one child, no side-by-side) · `WeekFacts` · `EffortRow` (counted
actions) · `SkillChip(state)` · `EvidenceSheet` · `MisconceptionNote` · `HomeTaskCard` (the only
your-turn) · `SchoolSyncBar` · `LevelBridge` · `TeacherNote` (AI badge) · `SyllabusList` ·
`ConsentRow` (toggle + plain sentence + speaker) · `TimeStepper` · `DeleteFlow` (hold + OTP) ·
`ReportCardImage` (server-rendered, same tokens) · `ParentGate` (PIN).

---

## 14. Copy tone (notes)

- Register: a respectful school teacher talking to a parent at PTM; "aap", never chummy; Hindi first
  where chosen, English nouns where the school uses them (fraction, chapter).
- Concrete nouns over adjectives: name the skill, the action, the date. "Good progress" alone is banned.
- Process praise of actions; no traits, no ability (PX4).
- Misconceptions in kitchen-table words with the child's reasoning ("4 is bigger than 3, so she thinks
  a quarter is bigger"), which shows the parent the mistake is sensible, not careless.
- Home task: one object from the house, one question to ask, what a good answer sounds like. Doable
  without knowing the maths.
- Uncertainty said plainly: "abhi pata nahi", "still checking", "re-check on Thursday".
- Never: "falling behind", "don't miss", "only N days left", "upgrade", exclamation-mark hype, emoji
  hearts, em/en dashes in UI strings (gurukul copy gate).
- Generated copy is produced from **shapes** in the prompt, not example sentences: anything
  sentence-shaped in a prompt gets recited (html-portfolio `CLAUDE.md`). This doc's mocks are layout only.

---

## 15. Decisions to log, with reversal conditions

| id (proposed) | decision | reverse if |
|---|---|---|
| `px-whatsapp-primary` | WhatsApp report is the main parent surface | in pilot, <40% of parents open ≥2 of 4 reports while the app view outperforms [U thresholds] |
| `px-utility-only` | no promotional content in reports | Meta changes category rules, or the report must carry legally required billing notices |
| `px-pakka-needs-delay` | "Pakka" only after a delayed success | delayed checks prove so sparse that parents see no Pakka for >3 weeks of regular use |
| `px-one-home-task` | exactly one home task per week | an A/B shows two tasks raise delayed retention without raising opt-out |
| `px-no-comparison` | no rank, percentile or siblings | none expected; a parent demand alone does not reverse it (same logic as gurukul streak ban) |
| `px-effort-as-actions` | effort as counted actions, minutes secondary | parents cannot interpret the counts in usability tests (n≥12, ≥4 with ≤Class 8 schooling) |
| `px-transcripts-by-age` | under-10 default-visible, 10+ on request with notice | safeguarding expert advises otherwise, or 10+ disclosure rates drop after a parent open |
| `px-cadence-cap` | ≤2 learning messages/week | opt-out stays <5% at 3/week in an A/B |

---

## 16. Measurement plan

- **M1 reach**: delivered / read / voice-note plays per report (WhatsApp receipts).
- **M2 trust probing**: "Kaise pata?" taps per active parent per week (read alongside M5).
- **M3 home task**: one-tap completion rate; A/B (task vs none) on delayed retention of *that* skill.
  This is the Kraft-Rogers mechanism tested in India.
- **M4 belief calibration**: quarterly, before showing evidence, ask the parent one yes/no per skill
  ("can she subtract with borrowing?"); score against the ledger. Reports should reduce the gap over
  time (Dizon-Ross). The parent never sees this framed as a test.
- **M5 opt-out** by cadence arm (Cortes).
- **M6 report comprehension**: after the voice note, can the parent state one thing the child can do and
  the home task? Usability n≥12 parents incl. ≥4 with ≤Class 8 schooling, Hindi and English.
- **M7 complaints**: grievance tickets per 1,000 families; refund requests; any "sales call" report is a
  sev-1 trust incident.

---

## 17. Open questions and verification list

- [M] WhatsApp template header types (audio?), button mix limits, opt-out handling; confirm with BSP.
- [M] Legal opinion on DPDP §9(3) covering the parent dashboard's evidence view and voice moments;
  Taxila is not an "educational institution" under Schedule IV Part A, so that exemption does not apply
  as-is [S]; a school-partnership route might.
- [M] DigiLocker / Rule 10 consent flow UX on low-end Android; drop-off at O5.
- [M] Re-verify helplines and Childline-112 integration at launch.
- [U] Do Indian parents accept "no rank"? Test with the printable card and PTM, not by adding rank.
- [U] Hindi voice note listen-through rate vs image card read rate.
- [U] Whether an AI "PTM" is used, trusted, or resented.

---

## 18. Sources

Indian parents, market, trust
- BaSE 2025 (CSF): https://www.edtechbase.centralsquarefoundation.org/base-2025 ; https://www.centralsquarefoundation.org/articles/beyond-access-the-next-phase-of-edtech-and-ai-in-bharat ; https://www.business-standard.com/industry/news/base-2025-report-parents-teachers-edtech-ai-risks-126021901324_1.html
- NSS CMS Education 2025: https://www.pib.gov.in/PressReleasePage.aspx?PRID=2160863 ; https://news.careers360.com/27-of-students-rely-on-private-coaching-urban-participation-higher-cms-education-survey-2025/amp ; https://news.careers360.com/mospi-survey-families-spend-more-boys-private-school-coaching-tuition-fees-cms-education-2025-nsso-data-gender/amp
- NCPCR and BYJU'S: https://www.businesstoday.in/latest/corporate/story/byjus-ceo-summoned-by-child-rights-body-ncpcr-over-allegations-of-hard-selling-its-courses-356747-2022-12-16 ; https://www.business-standard.com/article/companies/byju-s-allegedly-buying-contacts-of-children-threatening-parents-ncpcr-122122001233_1.html
- LocalCircles: https://www.localcircles.com/a/press/page/edtech-platforms-survey ; https://www.business-standard.com/companies/news/81-of-edtech-platform-users-face-refund-trust-issues-localcircles-survey-123062500591_1.html
- ASER 2016 mothers' schooling, homework help: https://palnetwork.org/parental-perceptions-and-parental-involvement-in-childrens-education-in-rural-india-lessons-for-the-current-covid-19-crisis/ ; https://www.povertyactionlab.org/evaluation/maternal-literacy-and-participation-programs-child-learning-india
- PARAKH HPC: https://parakh.ncert.gov.in/blog/more-report-card-idea-behind-holistic-progress-cards ; https://forumias.com/blog/holistic-progress-card-hpc/
- WhatsApp in India: https://techcrunch.com/2025/12/14/whatsapps-biggest-market-is-becoming-its-toughest-test/ ; https://backlinko.com/whatsapp-users

Parent messaging evidence
- Bergman & Chan: https://jhr.uwpress.org/content/56/1/125 ; https://www.learningcollider.org/research-library/leveraging-parents
- Kraft & Rogers 2015 (abstract, introduction and mechanism sections read): https://www.matthewakraft.com/s/Kraft-Rogers-2015-The-underutilized-potential-of-teacher-to-parent-communication-EER.pdf
- Robinson, Chande, Burgess, Rogers 2022: https://doi.org/10.3102/01623737211030492 · Cortes, Fricke, Loeb, Song: https://users.nber.org/~cortesk/NBER_w24827_1-3-5_texts.pdf
- Bergman, Lasky-Fink, Rogers: https://www.learningcollider.org/research-library/defaults-affect-adoption-and-impact-of-technology · Dizon-Ross: https://www.nber.org/system/files/working_papers/w24610/w24610.pdf
- Angrist, Bergman, Matsheng: https://www.nature.com/articles/s41562-022-01381-z · Rocket Learning: https://rocketlearning.org/how-rocket-learning-is-using-whatsapp-to-end-learning-poverty/ ; https://solve.mit.edu/solutions/42354

Competitors
- BYJU'S Parent Connect: https://www.indianweb2.com/2017/05/byjus-launches-parent-connect-app_24.html ; https://momlifeandlifestyle.com/2021/10/be-a-companion-in-your-childs-progress-byjus-parent-connect-app/
- Cuemath: https://www.cuemath.com/blog/how-to-know-if-math-tutoring-is-working/ ; https://play.google.com/store/apps/details?id=com.cuelearn.cuemathparentapp&hl=en ; https://apps.apple.com/in/app/cuemath-parent/id6776177723
- Toddle: https://www.toddleapp.com/product/progress-reports-transcripts/ ; https://support.toddleapp.com/en/articles/8612344-how-to-navigate-toddle-on-the-app-as-a-family-member
- Khan Academy / Khanmigo: https://support.khanacademy.org/hc/en-us/articles/360039664491-What-can-I-do-from-the-Khan-Academy-Parent-Dashboard ; https://blog.khanacademy.org/2025-khan-academy-updates-every-parent-should-know/ ; https://www.khanmigo.ai/parents
- ClassDojo: https://www.classdojo.com/plus/ ; https://help.classdojo.com/hc/en-us/articles/360018137732-ClassDojo-Plus-FAQ ; https://theconversation.com/digitally-tracking-student-behaviour-in-the-classroom-encourages-compliance-not-learning-110181 ; https://www.tandfonline.com/doi/full/10.1080/17439884.2025.2553184

Platform and law
- WhatsApp pricing: https://developers.facebook.com/docs/whatsapp/pricing/ ; https://whautomate.com/whatsapp-business-api-pricing-india ; https://360dialog.com/blog/whatsapp-service-message-charging-october-2026/
- WhatsApp general-purpose AI ban: https://respond.io/blog/whatsapp-general-purpose-chatbots-ban
- DPDP Schedule IV: https://www.dpdpa.com/schedule/schedule4.html ; Rule 14 timelines: https://ruleexpert.com/guides/dpdp-rules-2025/
