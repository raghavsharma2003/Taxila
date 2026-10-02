# Global AI tutors, 2024–2026: teardown for Taxila

**Date:** 2026-10-02. **Scope:** 16 global products the owner named: Khanmigo, Synthesis Tutor, SigIQ, Speak, Praktika, Duolingo Max / Video Call with Lily, Ello, Amira Learning, Brainly, Gauth, Photomath, Socratic, Alpha School / 2 Hour Learning, OKO, MagicSchool and Schoolhouse.world. The questions: what makes the best ones feel human, how they retain users, what they charge, and what efficacy evidence exists. **Companion docs:** `india-ai-native.md` (Indian players; same tag convention), `../tech-and-market.md` §5 (first-pass competitor table), `../learning-science.md` §3.3 (LLM-tutor RCTs: Kestin, Bastani, LearnLM×Eedi, Tutor CoPilot), and `../voice/human-likeness.md` (voice-level mechanisms).

**Evidence tags.** **[V]** = read at the primary source in this session: a paper PDF, an SEC filing, a company's own page or blog, or a live Google Play listing. A [V] on a vendor page means *the vendor says so*, not that the claim is true. **[S]** = secondary: press, Wikipedia, a critique, or a primary source cited by another paper but not read here. **[U]** = unverified, from memory, or my inference.

**Method and limits.** The shared WebSearch budget was exhausted before this task began (0 searches available). Everything below comes from direct page fetches of known primary URLs (~70, via WebFetch and curl), site sitemaps and blog indexes, SEC EDGAR filings, two PDFs parsed locally (Oreopoulos & Low 2026; Amira's Louisiana ESSA study; the Utah EISP state report), and live Google Play data pulled with `google_play_scraper`. Consequences: some 2025–26 press numbers (Speak ARR, Praktika's funding round, MagicSchool user counts, SigIQ's seed size, Gauth's ownership) could not be verified and are marked [U]. OpenAI's customer stories on Speak and Praktika returned 403. Brainly's site is behind Cloudflare.

**Data files written alongside this report** (all in this folder):
- `global-tutors-playstore-2026-10-02.json` and `global_tutors_playstore.py`: installs, ratings and IAP price ranges for 16 apps, US and IN storefronts.
- `global-tutors-review-themes-2026-10-02.json` and `global_tutors_review_themes.py`: the 600 newest English reviews per app, matched against 12 regex themes. **Caveat:** the scraper returned the same review set for the `us` and `in` country flags, so each app is one global English sample. Date windows vary from 18 days (Duolingo) to 15 months (Question.AI). Regex shares are relative signals between apps, not absolute rates.

---

## 0. The 14 findings that matter for Taxila

1. **The best independent evidence on a chat-style AI tutor is sobering, and the cause is engagement.** Khanmigo was tested in a two-year cluster RCT: 18 Tennessee middle schools, 53 grade clusters, remedial maths, 2024–26. Effects were **0.06 SD per year intent-to-treat (0.08 in year 2)**, and **0.14 SD** for a full year of active participation. That is the same as Khan Academy *without* AI. 96% of students tried the tutor. The median student messaged it on a third of practice days and in **only 17% of sessions where they made a mistake**. Only **14.5% of messages** contained a maths question or a reasoning step. The rest were bare answers (39.4%), suggested-prompt clicks (24.2%), "idk"-style messages (12.6%) and off-task chat (9.3%). Cost was about **$15 per student per year** **[V, Oreopoulos & Low, EdWorkingPaper 26-1551, Aug 2026]**.
2. **Khan's fix is to make the tutor lead, and to feed it structured learner state.** The 2026 redesign activates Khanmigo automatically during practice and prompts the student to explain how they got an answer **[V, Sal Khan, 27 Aug 2026]**. About 20 A/B tests across 15M+ tutoring threads (Oct 2025–Apr 2026) found:
   - a summary of the student's recent attempts raised next-item correctness by **+3.4%**, and a prerequisite-gap review by **+2.7%** (**+6.1%** combined);
   - the raw conversation log did **nothing** until it was converted from JSON to plain text and widened to the last 24 hours of threads on the skill (then **+5.09%** cognitive engagement);
   - latency work cut **0.3 s, 3 s and 0.4 s** off responses, and the last change also **halved answer give-aways** **[V, Khan blog, May 2026]**.
3. **The same researcher's India RCT shows what actually moves scores: structure plus a human who makes practice happen.** Plain Khan Academy (no AI) ran in 74 Uttar Pradesh residential schools (grades 6–8; 24 treatment schools, 50 control). Non-instructional "lab in-charges" visited twice a week to ensure two sessions. Hindi tests were aligned to CBSE and the UP Board. Result: **+0.44 to 0.47 SD** at about **47 minutes a week** **[V, Khan Academy India blog, Jan 2026; underlying paper not read]**. That is roughly 3× the Tennessee AI effect.
4. **Duolingo is the retention benchmark, and it is moving AI voice down-market, not up.** Q2 2026 figures **[V, 8-K shareholder letter]**:
   - **58.7M DAU and 140.6M MAU** (DAU/MAU 42%), **12.7M paid subscribers**;
   - **CURR (next-day return of current users) at an all-time high of 84%**;
   - **15.4M learners revived lost streaks** in a one-off June event.

   Video Call with Lily has been moved from the top Max tier into **Super**. Words spoken per Video Call user have **more than doubled** in a year **[V, Q4-25 and Q1-26 letters]**. AI costs are why gross margin was guided down from ~72% to ~69% **[V]**.
5. **"Feels human" is mostly turn-taking, latency and restraint, not voice timbre.**
   - **Turn-taking.** Speak found that the standard 300–500 ms silence threshold for end-of-turn breaks for learners, who pause to search for words. A "language tutor" framing on GPT-Live-1 cut interruptions during thinking pauses from **27.6% to 13.6%**. On 1–2 s pauses it interrupts **under 10%** of the time and responds about **1 s** after the learner stops **[V, Speak blog, Sep 2026]**.
   - **Restraint.** Lily "pauses while thinking" and does not correct grammar mid-call **[V, Duolingo blog]**.
   - **Latency.** Ello targets **<1 s** per conversational turn **[V]**.

   Children pause longer than adult learners [U, see `../voice/human-likeness.md` §2.1], so Taxila's turn detection cannot use a default VAD threshold.
6. **For children, ASR is the product, and it must report what the child said, not what they meant.**
   - Ello trained child-specific, patented speech recognition on **100,000+ hours of child speech** **[V]**.
   - Speak's ACL 2026 paper shows modern ASR "recovers what someone probably meant to say", which hides pronunciation and reading errors **[V]**.
   - Praktika's 1–2★ reviews say exactly this: "it just converts your speech into text… if you say something wrong it won't know" **[V, Play review, Sep 2026]**.

   For Hindi-accented class 1–3 readers, an intent-recovering ASR silently passes misread words.
7. **The category leader for young children explicitly refuses the "bonding companion" design.** Ello (ages 4–9) commits to these hard lines **[V, Ello AI-safety page and 6 Jul 2026 essay]**:
   - it will never tell a child it is real;
   - it will never say "I love you" back ("a startling number" of children say it first);
   - it will never call itself the child's friend, never keep a secret, and never coerce a return;
   - it frequently reminds the child that it is an AI and redirects sensitive topics to a trusted adult;
   - it complies with **California SB 243**.

   This collides with Taxila's "relational/emotional OS that bonds over months". It is the single biggest design-risk finding here (see §7.2).
8. **No product on this list has an independent RCT showing its own AI tutor causes learning gains.** The strongest vendor evidence:
   - **Amira**: a vendor-commissioned ESSA Level II quasi-experiment, **n = 79,084 matched K-5 students** in 12 Louisiana districts, with Hedges' g of **0.03–0.22**, larger in K–1 and dose-dependent **[V, PDF]**;
   - **Utah's state evaluation** of five reading programs combined: g **0.16** intent-to-treat in kindergarten, rising to **0.37** for students who met vendor usage targets **[V, PDF]**.

   Claims of "2×" or "top 1%" (Alpha) or "matches human tutoring" (Amira, citing Columbia) are not independently established. Alpha's public charter, Unbound Academy, reached **10% maths proficiency against a projected 60%** **[S]**.
9. **Answer engines own reach, and their default design harms learning.** Google Play installs **[V]**:
   - Brainly **298M**, Photomath **282M**, Gauth **123M**, Question.AI **27M**;
   - against Khan Academy **34M** and Khan Kids **12M**.

   Unguarded answer-giving raised practice scores but cut unaided exam scores by **17%** (Bastani et al., PNAS 2025) **[V, via `../learning-science.md`]**. Socratic is gone: socratic.org now 302-redirects to Google Lens homework help **[V]**. For classes 6–9 the real default competitor is a free photo-solver, so Taxila's photo-homework flow must turn into tutoring.
10. **Interactive visuals generated on the fly are becoming table stakes, but the tutor must react to what the child does with them.**
    - Khanmigo now uses Gemini to decide when a visual would help, generates an **interactive diagram**, and **responds when the student drags a segment** (Aug 2026; "preliminary signs" of better engagement and next-item correctness) **[V]**.
    - Gauth launched "Atlas", which turns any subject into a "visual adventure" **[V]**.
    - Synthesis still hand-builds its manipulatives **[V]**.

    Sal Khan, after three years: "AI is not good at generating standards-aligned content on the fly… far better when paired with our expert human-created content" **[V]**.
11. **Every high-effect, at-scale model has a human who drives usage.** UP lab in-charges (0.45 SD) and Alpha "guides" who provide "motivational and emotional support" **[V]**. Schoolhouse's thesis: "students often come for the tutoring and stay for the real human connection" **[V]**. OKO puts an AI facilitator in a *small group* **[V]**. In Utah, only about a third of grade-3 students met vendors' minimum usage **[V]**. Taxila's equivalent is the parent (and later the teacher) loop.
12. **The price band for consumer AI tutors is $4–35 a month; India's proven point is ₹299.**
    - Khanmigo $4/mo **[V]**;
    - Praktika about $8/mo **[V]**;
    - Speak $20/mo or $99/yr **[S]** (Play India IAP ₹1,199–₹26,000 **[V]**);
    - Synthesis $25–35/mo or $300/yr per child, with a family plan at $119/yr **[V]**;
    - Alpha's human-plus-software school costs $10k–75k/yr **[S]**;
    - SpeakX (India, voice): ₹299/mo, about 2 lakh paid **[S, `india-ai-native.md`]**.

    A Synthesis-class kids' tutor at US prices is about 8× the Indian proven point (≈₹2,400 vs ₹299 a month).
13. **Paywall friction is the dominant complaint for AI voice tutors.** Share of recent reviews that mention price, paywall or trial, with those reviews' mean stars **[V, review mining]**:

    | app | share of reviews | mean stars of those reviews |
    |---|---|---|
    | ELSA | 7.0% | 2.14★ |
    | Praktika | 6.8% | **1.71★** |
    | Speak | 5.5% | 3.15★ |
    | Photomath | 5.3% | 1.97★ |

    By contrast, "feels human" or "robotic" each appear in ≤0.3% of reviews. Praktika's recent-review mean (**4.03★**) is well below its lifetime 4.62★, with "next day it forgets" complaints. SigIQ's PadhAI drew backlash when it moved from free to paid **[V]**.
14. **Engagement design is diverging into two camps.** Duolingo optimises retention (streaks; the motivation/streak theme is 10.3% of its reviews). Ello says "when something boosts time in the app without moving learning, we treat it as a warning sign" **[V]**. Khan is adding Missions, Gems, class Gem Challenges and Khanmigo accessories **[V, 2 Oct 2026]**. For a child product under DPDP/SB 243-style scrutiny, Taxila should sit nearer Ello on metrics and nearer Duolingo on craft.

---

## 1. Landscape map

| product | category | ages / users | modality | "human" mechanism | price (USD) | scale (latest) | efficacy evidence (best available) |
|---|---|---|---|---|---|---|---|
| **Khanmigo** (Khan Academy) | Socratic tutor inside KA practice; teacher tools | K-12 | text-first; now generates interactive diagrams (Gemini) | coaches rather than tells; sees the problem; since 2026 auto-activates and prompts "explain your thinking" | learner/parent $4/mo or $44/yr; teachers free; districts custom **[V]** | "millions of practice sessions per day" **[V]**; KA app 33.8M installs **[V]** | independent 2-yr RCT: 0.06–0.08 SD/yr ITT, 0.14 active; = KA without AI **[V]** |
| **Duolingo Max / Video Call** | language app; AI voice call with Lily | teens and adults (Duolingo ABC for kids) | voice + 2D Rive avatar | Lily pauses to think, does not correct grammar, sass grows with level; calls run 1–3 min **[V]** | Video Call moving into Super; Play IAP $0.99–239.99 **[V]** | 58.7M DAU, 12.7M paid (Q2-26) **[V]**; 977M Play installs **[V]** | Duolingo-funded studies only **[S]** |
| **Speak** | spoken-language tutor | adults (Korea/Japan-heavy) | voice-first; live tutor on GPT-Live-1 | semantic turn detection; tutor framing; checkpoints; selective correction (~85% accurate) **[V]** | $20/mo or $99/yr **[S]**; IN IAP ₹1,199–26,000 **[V]** | 15M+ downloads **[V site]**; 19.6M practice hours in 2025 **[V]**; $162M raised, $1B valuation **[V]** | none independent found |
| **Praktika** | AI-avatar language tutor | adults | voice + animated avatars | named tutors "who remember your context"; selectable correction intensity; generative animation (4.0) **[V]** | ~$8/mo **[V]**; IN IAP ₹180–20,700 **[V]** | "30M learners" **[V site]**; 20.4M Play installs, 1.30M ratings **[V]** | none |
| **Synthesis Tutor** | K-5 maths tutor | 5–11 | voice narration + hand-built manipulatives | immediate, patient, step-level guidance; mastery micro-assessments; "not ChatGPT-based" **[V]** | $25–35/mo, $300/yr; family $119/yr; lifetime $999–1,499 **[V]** | 100,000+ students **[V]**; Android since May 2026 (1,894 installs) **[V]** | none published; testimonials **[V]** |
| **SigIQ** (EverTutor, PadhAI) | voice-first tutor (US K-12 MTSS, GRE); UPSC app (India) | K-12 US; adult exam takers | voice + screen share | real-time "Talkback"; curriculum-aligned intervention **[V]** | PadhAI Pro ₹349–400/mo **[V]**; EverTutor B2B | PadhAI 643k installs, 4.2★ **[V]**; "4 lakh+ aspirants" **[V site]** | none published |
| **Ello** | reading + maths tutor | 4–9 | voice; on-screen books | child-specific ASR on 100k+ h; <1 s turns; hierarchical teaching agent; I do / we do / you do **[V]** | free daily activities + premium (price not found) | 3.5M+ books read **[V]**; Android 2.0: 36.6k installs, 1.83★ (129 ratings) **[V]** | "88% read more after 4 weeks" (vendor claim) **[V]**; no RCT found |
| **Amira Learning** (merged with Istation) | AI reading tutor + assessment, B2B schools | K-5+, English and Spanish | listens to the child read aloud; micro-interventions | real-time oral-reading feedback **[V]** | district contracts (not public) | 5.5M+ students, 4k+ districts and schools **[V]** | vendor-paid ESSA II QED n=79k: g 0.03–0.22 **[V]** |
| **OKO** | AI facilitator for small-group maths | grades 3–9 | voice + gesture, group play | the agent prompts students to explain to *each other* **[V]** | school pilots | US schools (case studies) **[V]** | WestEd: 299 students, 11 classrooms, 2 weeks; fractions gain, less anxiety; ESSA III/IV **[V]** |
| **Brainly** | Q&A community turned AI learning companion | 10–18 | text, photo | community answers + AI | IAP $0.49–96 **[V]** | 298M installs **[V]**; 15M DAU (2024) **[S]** | none |
| **Gauth** | photo-solve + AI + human experts | 12–18 | photo, text; "Atlas" visual explorer | 50k "verified experts" on call **[V]** | IN IAP ₹7–10,000 **[V]** | 123M installs, 4.58★, 2.08M ratings **[V]**; ByteDance ownership reported **[U]** | none |
| **Photomath** (Google) | photo maths solver | 12–18+ | photo, animated steps | "how" and "why" tips **[V]** | Plus $9.99/mo or $69.99/yr **[V]** | 282M installs **[V]**; acquired by Google 2022–23 **[S]** | none |
| **Socratic** (Google) | homework helper | teens | photo/voice | n/a | n/a | **discontinued**: site redirects to Google Lens **[V]** | none |
| **Alpha School / 2 Hour Learning** | private school model: 2 h of app-based academics plus guides | K-12 | adaptive apps (Wikipedia: not mainly LLMs) **[S]** | human guides for motivation; an internal currency; "the gift of time" **[V]** | $10k–75k/yr, mostly ~$40k **[S]** | "30+ locations" **[V site]** vs 13 campuses Apr 2026 **[S]**; ~50 planned for 2026 **[S]** | internal MAP data only; methodology criticised **[S]** |
| **MagicSchool** | teacher AI platform + MagicStudent | teachers (K-12) | text | n/a (teacher tools) | Free; Plus $8.33/user/mo annual or $12.99 monthly; Enterprise custom **[V]** | user counts not verified **[U]** | vendor claims: 7–10 h/week saved, "28% improvement" in literacy (method unknown) **[V]** |
| **Schoolhouse.world** | free live peer tutoring on Zoom | mostly high school | human video | real peers; certified volunteer tutors | free **[V]** | 228k+ learners, 561k+ sessions **[V homepage]** (about page: 174k, 460k) | testimonials only; no evaluation found |

---

## 2. Deep dives

### 2.1 Khanmigo: what the two-year RCT actually says, and what Khan changed

**The trial [V, Oreopoulos & Low 2026].** Hamilton County, Tennessee ran a cluster RCT in 18 middle schools over 2024–25 and 2025–26. In each school, one or two of three grades were randomised to Khan Academy plus Khanmigo during daily 25–40-minute remedial maths (RTI) blocks. Control grades kept business as usual, which in 14 of 18 schools meant other edtech (Waggle, IXL, Zearn, DeltaMath) **[V, Sal Khan's response]**. More than a quarter of students had a special-education designation **[V]**.
- Practice rose by about **30 min a week**, and by over **45 min a week** in year 2 for students active in RTI.
- Scores rose **1.3 national percentile ranks per term**: **0.06 SD per year ITT**, **0.08** in year 2, and **0.14** implied for a full year of participation. Year 1 showed no reliable effect (rostering delays, a mid-year test switch).
- Benchmarks: Khan Academy without AI returns 0.0047 SD per annual hour on average, rising to 0.0086 in efficient classrooms (Eames et al. 2026). This deployment sits at the top of that range. "Nothing in the achievement data requires the AI tutor to explain it."
- Engagement detail: 9,362 of 56,362 mistake sessions contained a message. When a conversation happened it ran a median of 3 student messages (mean 6.5). Engagement was "rare rather than shallow".
- The authors flag as untested whether a tutor that is "more proactive, button driven, with voice, vision, or memory of the student" would elicit more engagement. That is Taxila's thesis, stated as an open question by the best study in the field.

**Khan's own account.** Leadership called the first Khanmigo "a non-event" for most students **[S, Chalkbeat, 9 Apr 2026, as cited by Oreopoulos & Low]**. Sal Khan's correction (27 Aug 2026) **[V]**:
- the tutor "had to be woven into" practice;
- "productive struggle [had to be] harder to sidestep";
- Khanmigo now "prompts a student to explain how they arrived at an answer… we have reduced the metacognitive load".

**The product-test programme (Oct 2025–Apr 2026) [V].** Three core metrics:
- **response latency**;
- **next-item correctness**: the next problem on the same skill, with no help;
- **cognitive engagement quality**: an automated passive / active / constructive rating.

Guardrail metrics: answer give-away, maths-error rate and interactions per thread. A change ships when its Bayesian "chance to win" is above 0.95 with no guardrail regression. The results are in finding 2. Two that matter for Taxila's learner-model design:
- **Structured state beats raw logs.** Recent-attempt summaries and prerequisite gaps helped. Raw JSON logs did not, until rendered as plain text over 24 hours. Khan now plans to "extract the pedagogically meaningful elements".
- **Prompt-stuffing examples did nothing.** Adding examples of different problem types had no effect.

**Multimodal [V].** In Aug 2026, with Google.org Fellows and Gemini, Khanmigo began generating interactive maths and science diagrams when it "detect[s] the moment when a visual may help". It reacts to the student's manipulation, for example where they drag a line segment.

**Motivation [V, 2 Oct 2026].** Missions (what to do next), Gems (effort), Khanmigo accessories bought with Gems, and class-wide Gem Challenges with teacher-chosen rewards. Pilot student: "Khan Academy is low key kinda fun now."

**India.** Teachers get Khanmigo free in English, Hindi, Odia and Marathi. There is no student-facing Khanmigo in India **[S, see `india-ai-native.md` §4.4]**. The UP RCT (finding 3) is the strongest Indian evidence that *structured practice plus facilitation* works with Hindi-medium students in grades 6–8.

**Read for Taxila.** Khan has the content, the trust and an experimentation engine. Its tutor still lives *beside* exercises, and it is text-first. The gap Khan names (proactive, voice, memory, vision) is the gap Taxila is built for. But Khan's data says the *learning* gains come from structured practice volume, so Taxila's voice teacher has to drive *practice*, not only conversation.

### 2.2 Duolingo Max and Video Call with Lily: the retention machine

**Metrics, Q2 2026 [V, 8-K EX-99.2].**
- **Users:** DAU 58.7M (+23% YoY); MAU 140.6M (+10%); paid 12.7M (+17%).
- **Money:** revenue $298.5M (+18%); subscription revenue $258.0M; Adjusted EBITDA margin 25.9% (31.2% a year earlier).
- **Growth levers:** in China, Indonesia and India, about two-thirds of social impressions come from influencer content. Longer free trials "yielded good early results".
- **Medium-term goal:** 100M DAU in 2028 **[V, Q1-26 letter]**.

**Retention mechanics [V].**
- The "Green Machine" tests hundreds of small changes and optimises three things in order: retention, learning outcomes, monetisation.
- The north-star leading indicator is **CURR** (next-day return of users active in the prior 7 days), now **84%**. Because CURR compounds, +1 point is material.
- Streaks are the emotional core: Streak Revival brought back 15.4M learners, nearly 8M of whom had no active streak.
- Backlash case: the Energy system that replaced hearts drew 2★ complaints such as "now it seems like the app only tries to milk you" **[V, Play review]**.

**Video Call design [V, Duolingo blog].**
- Lily "will pause while thinking about her answer".
- "You won't hear her correct your grammar."
- Her sarcasm and eye-rolls "emerge at advanced levels".
- She adapts to level, and learners can ask her to repeat or clarify.
- Calls last about 1 minute for beginners and up to 3 minutes for advanced learners.
- She runs on a Rive state machine with 20+ mouth shapes **[S, `../tech-and-market.md`]**.

Words spoken per Video Call user more than doubled in a year. Speaking practice is moving to *all* users via "spoken tokens" (say the answer instead of tapping), Flashcards and Speaking Adventures **[V, Q1-26 letter]**.

**Strategic shift [V, Q4-25 letter].** Video Call moves from Max into the cheaper Super tier, and Duolingo will "experiment with changes to … Duolingo Max". The cost shows in guidance: gross margin roughly 71% in Q1 and about 69% for the rest of 2026, "driven primarily by expanding access to AI-powered features for all users".

**Read for Taxila.** Three borrowable patterns:
1. A short, bounded, character-led call (1–3 min at first), not an open-ended session.
2. A personality that *unlocks* with progress.
3. A single compounding retention metric, measured daily.

One pattern to reject for children: streak loss-aversion as the main hook (see §7.3).

### 2.3 Speak: the best public engineering on learner-grade voice

**Scale [V].** $78M Series C at a $1B valuation (Dec 2024), $162M raised in total. The site claims 15M+ downloads, and Play shows 12.4M installs. Its 2025 "Wrapped" post reports:
- **3.74B lines spoken** (+111%);
- **19.6M practice hours** (+85%);
- **231M lessons** started;
- **80.3M personalised lessons** (+154%).

Average daily use is 10–20 minutes, and the consumer price is $20/mo or $99/yr **[S, TechCrunch Dec 2024]**. Revenue and ARR are not disclosed **[U]**.

**Voice-agent lessons [V, "Building Speak's voice agent platform"].**
1. Default VAD (300–500 ms) "breaks down for language learners". It fragments utterances, which hurts ASR, and it interrupts.
2. Where the learner taps to end a turn, the whole recording is treated as one utterance. This gives the best accuracy, and "manual turn detection… gives learners control and eliminates the anxiety of being cut off mid-thought".
3. Hands-free turns use **semantic** end-of-turn models, still "an open problem".
4. The latency budget is measured end to end: ASR time-to-final, LLM time-to-first-token, TTS time-to-first-byte, and faster-than-real-time synthesis. It is tracked per provider, language and region, **at P95/P99**, with automatic failover.
5. "Latency is a design problem, not just an infrastructure problem."

**Live tutor lessons on GPT-Live-1 (Sep 2026) [V].**
- Full duplex.
- The "language tutor" framing halves thinking-pause interruptions (13.6% vs 27.6% for a generic assistant).
- Across 27 sessions it delivered **476 of 477** authored lesson components while handling learner digressions. Lessons run up to 32 steps.
- It uses deliberate understanding checkpoints and selective correction, with about 85% correction accuracy.

**Read for Taxila.** This is the closest public blueprint for "a curriculum-locked voice teacher that still feels conversational": authored lesson graph, model-driven delivery, explicit checkpoints. Speak is adult-only. Children pause longer, self-correct more and code-switch, so every threshold must be re-measured on Hindi-English 6–12-year-olds.

### 2.4 Praktika: avatars and memory, and the cost of over-promising

**Scale [V].** The site claims **30M learners** and 4.8★ from 1.2M+ ratings. Play shows **20.4M installs** and 4.62★ lifetime. Named tutors (Tama, Raven, Skye, Noah) are "caring and supportive friends who remember your context". Learners choose correction intensity: soft, balanced or strict. Price is about **$8/mo**, against "~$400/mo" for a private tutor.

**Praktika 4.0 (19 Feb 2026) [V].** Skye and Tama are the first tutors on "generative AI animation technology". The Practice tab is tailored to interests, level and goals. A "multi-agent AI infrastructure" now analyses goals, tracks progress and adapts the plan.

**What reviews say [V, 600 newest reviews, 2 Sep–1 Oct 2026].**
- The recent mean is **4.03★**, against 4.62★ lifetime.
- Price, paywall or trial: 6.8% of reviews, at a mean of **1.71★**. Examples: "Start for Free requires a 1 yr pmt"; complaints about refunds.
- Memory: "even you tell it, next day it forgets"; "the AI forgets instructions easily".
- ASR: "not recording your pronunciation, it just converts your speech into text".
- The positive side is confidence: 1.8% of reviews, at 4.64★ ("Talking with Tama was great").

**Read for Taxila.** Selling a tutor as a friend who "remembers" makes memory failures feel like a broken promise. If Taxila claims memory, it must work across days and be visible to the parent. Correction intensity as a user setting is worth copying for older students and parents.

### 2.5 Synthesis Tutor: the craft benchmark for interactive maths

**Facts [V].** Born as a class at SpaceX's school. 100,000+ students. Ages 5–11, K-5 maths "and further for kids who are ready". Voice narration reads everything aloud for children under 7. Tactile, multisensory manipulatives. Micro-assessments inside every lesson, and no advance before mastery. Uses "AI where it helps", with lessons designed by educators and neuroscientists. The site says "Not ChatGPT-based" and aims to make kids "feel like they are learning with a real teacher". Pricing:
- **Individual:** $35/mo, or $300/yr ($25/mo); lifetime $999.
- **Family (up to 7 children):** $119/yr; lifetime $1,499.
- **Synthesis Teams (live, ages 8–14):** $95/mo.

The Android app only launched in May 2026 and has 1,894 installs (iOS and web-first).

**Efficacy.** None published; there are testimonials ("from hating math to asking to do Synthesis Tutor ALL. THE. TIME").

**Read for Taxila.** Synthesis proves parents pay premium prices for *interaction quality*, not for chat. Its manipulatives are hand-built, not generated. That matches `../tech-and-market.md`'s conclusion: curated or parameterised interactives in the live path, with generation offline.

### 2.6 Ello: the "teacher, not a chatbot" stack, and its child-safety stance

**Stack [V].** "A custom, low-latency AI stack, from child-specific speech perception to a hierarchical teaching agent, to expressive speech generation." The alternative, "stitching together off-the-shelf components optimized for adults", "can't actually teach a child".
- **Data and speed:** 100,000+ hours of child speech in training; patented child ASR; <1 s latency per turn; 3.5M+ books read; 6 teachers on staff.
- **Advisers:** Terry Winograd, Tim Shanahan (National Reading Panel), and Michael Auli (lead author of wav2vec).

**Teaching loop [V].**
- **Day 1:** the child reads a story that gets harder page by page, which places them precisely and starts an interest profile ("dinosaurs or pink princess unicorns").
- **Every day after:** a personalised "Quest" plan (a book, a phonics lesson, a maths puzzle, a co-created story).
- **Pedagogy:** I do / we do / you do. Support "changes based on what they need": a tricky word is split into sounds, a missed meaning triggers a comprehension prompt, and a repeated error triggers targeted practice.
- **Rewards:** stars, harder activities earning more, spent on a Learning Tree. The system is "calibrated so they feel a win in their very first session".
- **Safety:** real-time safety classifiers on both sides. Serious disclosures stop the session and the parent is texted.

**Safety stance [V, 6 Jul 2026 essay by co-founder Dr Elizabeth Adams, a clinical child psychologist].**
- "We are not trying to make a child need us. We are trying to make them not need us."
- Clinicians read real transcripts and judge the agent against learning goals, "not against usage charts".
- The real risk is "simulated intimacy, confusion about what a person is, exclusivity, and a child leaning on AI for what a human should provide", not warmth or character.
- A wildly non-human character may help a child "file the whole thing under cartoon, not real", where "a smooth, faceless, human-sounding voice might do the opposite".
- A worked example: a child said school made them "feel really dumb". Ello (1) acknowledged the feeling, (2) reminded the child that it is an AI, and (3) suggested a trusted grown-up.
- Children "will take a risk with our agent, sounding out a hard word and getting it wrong, when previously they were too embarrassed to try it in front of an adult".

**Gaps.** Pricing for premium was not found. The only outcome claim is "88% of children read more after 4 weeks" (vendor). The new Android app ("Ello 2.0") shows 36.6k installs and **1.83★ from 129 ratings** **[V]**, so the product is iOS-first and the Android launch is rough.

**Read for Taxila.** Ello is the closest architectural analogue to what Taxila wants (child ASR, a teaching agent, expressive TTS, daily plans). Its published hard lines are the most concrete child-AI relationship policy found anywhere in this sweep. Taxila should adopt them, or document precisely why not.

### 2.7 Amira Learning: what school-grade reading-tutor evidence looks like

**Product [V].** Amira listens as the student reads aloud, assesses (ISIP), plans instruction, and tutors one-to-one in English and Spanish ("Amira Lectura"). It reports 5.5M+ students and 4k+ districts and schools, and claims "68% faster reading growth".

**Louisiana ESSA Level II study, 2023–24 [V, PDF by Instructure, June 2025, commissioned by Amira].**
- **Design:** quasi-experimental; within-grade matched samples of 79,084 K-5 students (39,542 per arm) in 12 districts.
- **Results:** users beat matched non-users at every grade. Hedges' g was 0.11 and 0.21 (K), 0.10 and 0.22 (G1), 0.08 and 0.12 (G2), 0.05 and 0.09 (G3), 0.03 and 0.07 (G4), and 0.04 and 0.06 (G5).
- **Dose:** high-use versus low-use students showed g 0.19.
- **Caveats:** some grade samples failed baseline equivalence on one measure, and the comparison is users against non-users (self-selection).

**Utah EISP, 2022–23 [V, state evaluation by ETI].** This report pools five vendors (Amira 24,127 students; Core5 116,789). Hedges' g:

| grade | intent-to-treat | met 80% of usage target | met usage target |
|---|---|---|---|
| K | 0.16 | 0.32 | 0.37 |
| G1 | 0.10 | 0.15 | 0.18 |
| G2 | not significant | not significant | 0.03 |
| G3 | 0.04 | 0.10 | 0.13 |

Recommendation: "A notable portion of EISP students were unable to meet the minimum use recommendation."

**"Matches human tutoring in 30 sessions" (Columbia).** The vendor summary was read; the study itself was not **[V claim, S study]**.

**Read for Taxila.** Reading-aloud tutors show their largest effects in K–1 and fade by grade 4–5. Usage compliance is the lever, and even school-scheduled programs struggle to hit it. Taxila's class 1–3 Hindi and English reading module is where effects are most likely, and where ASR quality decides everything.

### 2.8 OKO: AI as a facilitator for small groups

**Facts [V].**
- **Format:** grades 3–9; groups of students on Chromebooks with camera and headset. The AI agent responds to **voice and gestures**, prompts students to explain their thinking to each other, and celebrates or supports.
- **Evidence:** WestEd study, 299 students in 11 classrooms, 2–3 sessions a week for two weeks. Statistically significant pre-post gains on a fractions battery, and lower maths anxiety (Lee, Feng & Miller, ISLS 2024). ESSA Tier III/IV badges.
- **Team:** co-founder Laurence Holt, who named the edtech "5 percent problem" (effects come from the few who use it).

**Read for Taxila.** Indian homes often have siblings and cousins together, and Indian classrooms run at 40+ students. A group mode (two or three children, one teacher voice that asks them to explain to each other) is a differentiated, under-built pattern. It is also a natural answer to "AI isolates children". The evidence is thin: two weeks, pre-post.

### 2.9 SigIQ: an Indian-founded team building the voice tutor for US schools

**Facts [V].** Founded by Karttikeya Mangalam (CEO) with Kurt Keutzer (strategy). Claims "70+ news outlets" of coverage. The seed amount is hidden behind an animated counter on the site **[U]**. Products:
- **EverTutor Live:** GRE prep with real-time "Talkback" voice and screen sharing; #1 Product of the Day on Product Hunt.
- **EverTutor for schools:** "voice-first, guided instructional delivery", curriculum-aligned, MTSS Tier 1–3, FERPA/COPPA; school partner the Greater Dayton School.
- **PadhAI:** UPSC prep with Indian newspaper summaries mapped to past papers, AI mains-answer evaluation, a doubt tutor that chats with NCERTs "with chapter-by-chapter citations", and live duels. Pro costs ₹349–400/mo. The site claims 4 lakh+ aspirants; Play shows 643k installs and 4.2★.

Reviews include "you guys made big mistake by upgrading to paid version… what should poor guy like me should do" **[V, Aug 2026]**.

**Read for Taxila.** An India-rooted team found Indian consumer willingness to pay thin at the exam-prep end, and took its voice tutor to US school budgets (B2B MTSS). The PadhAI pattern of "chat with NCERT with chapter citations" is directly reusable for grounding Taxila's answers in the child's textbook.

### 2.10 Answer engines: Brainly, Gauth, Photomath, Socratic (and Question.AI)

| app | Play installs **[V]** | lifetime ★ | recent-review mean ★ **[V]** | top recent complaint themes **[V]** | AI direction |
|---|---|---|---|---|---|
| Brainly | 297.7M | 4.49 | 4.30 | explanations 2.0%; wrong answers 0.5% | "AI Learning Companion" in the US from 2025; other countries still community-led **[S]** |
| Gauth | 122.7M | 4.58 (IN) | 4.69 | explanations 5.8%; occasional "blatantly wrong" | Gauth AI + 50k experts (98.5% satisfaction claim); "Atlas" visual explorer **[V]** |
| Photomath | 281.9M | 4.27 | **3.59** | price/paywall 5.3% (1.97★); wrong answers 1.3%; "turned into an ad for Gemini" | step explanations; $9.99/mo or $69.99/yr **[V]** |
| Question.AI | 27.5M | 4.61 | **3.71** | **wrong answers 3.2% (1.74★)**; ads; billing | general chatbot + photo |
| Socratic | n/a | n/a | n/a | n/a | **discontinued**: socratic.org redirects to Google Lens "step-by-step homework help" **[V]** |

**Read for Taxila.**
- Class 6–9 students will hold Gauth or Photomath in the other hand. A "snap your homework" feature that gives answers would be cheaper to copy than to differentiate.
- Bastani's −17% says it would also hurt learning.
- Taxila's version should: (a) accept the photo; (b) ask the child to attempt the first step; (c) hand back a *near-transfer twin problem* after the explanation. That is the "covertly check understanding" loop (see `../learning-science.md`).
- Accuracy is a visible failure mode in reviews (Question.AI 3.2%), so every maths step must be machine-verified. Khan built a separate "math agent" for this.

### 2.11 Alpha School / 2 Hour Learning: a motivation model, not AI evidence

**Model [V].** Two hours of morning "AI tutor" academics with "concept-based mastery". The afternoon goes to life skills, sports and entrepreneurship. Teachers become "Guides" who provide "motivational and emotional support"; a student describes "our own currency that motivates us to do more work". Results claimed: classes in the "top 1–2%", "2× in 2 hours", every middle-schooler in the top 5%, average SAT 1470+ **[V, 2hourlearning.com/the-results]**.

**Scrutiny [S].**
- **Tuition and scale:** $10k–75k a year, most campuses ~$40k; 13 campuses as of April 2026. Charter applications were denied in PA, NC, AR and UT, and approved in AZ (Unbound Academy) **[S, Wikipedia]**.
- **Growth claims:** the "2×–7×" figures divide individual gains by small expected gains; a 2-point gain can count as "9×" growth **[S, The Argument]**.
- **Unbound Academy year 1:** 28% ELA and 10% maths proficiency, against projected 65% and 60% **[S]**.
- **Mechanism:** the critique says it is "huge prizes, payouts, and incentives" (e.g., Nintendo Switches) plus affluent self-selection **[S]**.
- **Software:** mainly adaptive apps, not LLMs **[S, Wikipedia]**.

**Read for Taxila.** The marketable promise ("finish school work fast, get your afternoon back") is powerful, and Ello says almost the same thing. The causal ingredients are humans plus incentives plus selection, not the AI. Taxila can borrow the *time-gift* framing for parents ("20 focused minutes, then go play"). It must not cite Alpha as evidence.

### 2.12 MagicSchool: the teacher-side wedge

**Facts [V].** Calls itself "the AI operating system for schools": 80+ teacher tools (lesson plans, rubrics, IEPs, report-card comments, presentations), the Raina chatbot, and 50+ MagicStudent tools under teacher control. Plans:
- **Free:** $0.
- **Plus:** $8.33/user/mo billed annually, or $12.99 monthly.
- **Enterprise:** custom (SSO, SIS/LMS, data agreements, dashboards).

Homepage claims: "7–10 hours time saved per week", "88% of teachers say it helps them reach every learner", "28% improvement in students meeting literacy grade-level expectations" (no method shown). User and funding numbers could not be verified **[U]**.

**Read for Taxila.** The US pattern is teacher-free, district-paid. In India the analogues (Khanmigo for teachers; Microsoft's Shiksha Copilot, which saved 1,043 teachers 2.02 hours a week) are free or state-funded **[S, `india-ai-native.md`]**. A teacher tool is a distribution channel into schools, not a revenue line.

### 2.13 Schoolhouse.world: the free human alternative

**Facts [V].** Founded by Sal Khan in 2020. Free live small-group Zoom tutoring by certified volunteer peers. Portfolios are recognised by 50+ colleges. The homepage reports 228k+ learners and 561k+ sessions; the about page reports 174k students in 180+ countries and 460k sessions (different dates). SAT Bootcamp format: 4 weeks, 2 × 75-minute sessions a week, ≤10 learners, tutors from the top 5% of SAT scorers. **The "Indian Curriculum" course shows 0 tutors and no sessions** (2 Oct 2026) **[V]**.

**Read for Taxila.** Free human tutoring does not reach Indian K-9. Schoolhouse's framing ("come for the tutoring, stay for the connection") is a reminder that a portion of what parents buy from a human tuition teacher is social. Taxila should route that need *outward* (siblings, parent, peers, the class teacher) rather than absorb it into the AI.

---

## 3. What makes the best ones feel human: mechanisms ranked by evidence

| # | mechanism | who does it, with numbers | strength of evidence | Taxila action |
|---|---|---|---|---|
| 1 | **Learner-grade turn-taking** (do not cut off a thinking pause; reply about 1 s after the child stops) | Speak: default VAD fails; tutor framing 27.6% → 13.6% interruptions, <10% on 1–2 s pauses; tap-to-finish reduces anxiety **[V]**. Lily "pauses while thinking" **[V]** | vendor measurement, adult learners | semantic end-of-turn tuned on children's Hinglish speech + a big "I'm done" button for ages 6–8; log interruption rate on thinking pauses as a gate metric |
| 2 | **Latency treated as a pedagogy metric** | Khan: −0.3 s (1.35M threads), −3 s (352k), −0.4 s with half the give-aways **[V]**; Ello <1 s **[V]**; Speak P95/P99 per provider and region with failover **[V]** | A/B at scale (Khan) | track end-of-speech-to-first-audio at P95; budget it per pipeline stage |
| 3 | **Child-specific, surface-faithful ASR** | Ello 100k+ h of child speech, patented **[V]**; Amira oral-reading assessment **[V]**; Speak ACL 2026: ASR recovers intent and hides errors **[V]**; Praktika reviews complain **[V]** | strong (category leaders all built it) | for reading and pronunciation, a separate phoneme- or word-level alignment path, not the chat ASR; Hindi child speech collection is a moat item |
| 4 | **The tutor leads; the child does not have to ask** | Khanmigo: 17% of mistake sessions had a message **[V]** → auto-activation and "explain how you got it" prompts **[V]**; Speak checkpoints; Lily initiates; Ello daily Quest | independent RCT (negative case) + vendor redesigns | every turn ends with a specific, answerable question; no "ask me anything" home screen |
| 5 | **Structured memory of the learner, surfaced in plain language** | Khan: attempt history +3.4%, prerequisite gaps +2.7%, raw JSON logs null; plain text + 24 h window +5.09% engagement **[V]**; Praktika "forgets next day" complaints **[V]** | A/B at scale | the learner model feeds the tutor a short, plain-text "what I know about this child today" card, not transcripts |
| 6 | **Selective, delayed correction** | Lily does not correct grammar during the call **[V]**; Speak's selective correction ~85% accurate **[V]**; Praktika soft / balanced / strict **[V]** | design convergence, no outcome data | correct the target concept and let surface slips pass in flow; recap at the end |
| 7 | **Character with personality that unlocks, bounded by hard lines** | Lily's sass at advanced levels **[V]**; Praktika named avatars **[V]**; Ello's hard lines (never "I love you", never "I'm real") **[V]** | design convergence; the safety stance is an expert opinion | personality as craft (humour, callbacks, catchphrase-free); intimacy lines hard-coded (§7.2) |
| 8 | **Manipulatives and visuals the tutor reacts to** | Synthesis hand-built **[V]**; Khanmigo diagrams react to drags **[V]**; OKO voice + gesture **[V]** | early ("preliminary signs") | the tutor must *see* the interactive's state (events → learner model), not just display it |
| 9 | **An authored curriculum under the conversation** | Speak 476/477 authored steps delivered **[V]**; Synthesis "designed by educators" **[V]**; Sal Khan: AI "not good at generating standards-aligned content on the fly" **[V]** | strong convergence + Kestin-type RCTs (`../learning-science.md`) | NCERT and state-board lesson graphs as the spine; LLM fills delivery, never sequence |
| 10 | **A human somewhere in the loop for motivation** | UP lab in-charges (0.45 SD) **[V]**; Alpha guides **[V]**; Schoolhouse peers **[V]**; Utah usage compliance ~1/3 **[V]** | strongest causal evidence on this list | weekly parent ritual + nudges; the teacher dashboard later; never assume the child self-starts |

What does **not** show up as a driver: voice timbre or "realism" alone. "Feels human/natural" and "robotic" each appear in ≤0.3% of recent reviews, even for voice-first apps **[V, review mining]**. In the one preregistered voice-vs-text RCT (adults), voice doubled interaction but not learning, at 2.8× the cost **[V, via `../learning-science.md`]**. Users talk about confidence ("practice before speaking to someone real"), price and memory, not about the voice.

---

## 4. Retention and engagement benchmarks

| product | metric | value | tag |
|---|---|---|---|
| Duolingo | CURR (next-day return of 7-day actives) | **84%** (all-time high, +~1 pt YoY) | [V] |
| Duolingo | DAU / MAU | 58.7M / 140.6M = **42%** | [V] |
| Duolingo | paid / MAU | 12.7M / 140.6M = **9.0%** | [V, my division] |
| Speak | daily use | 10–20 min | [S] |
| Speak | 2025 practice hours | 19.6M h (+85% YoY) | [V] |
| SpeakX (India comparator) | monthly paid retention | ~30% | [S, `india-ai-native.md`] |
| Khanmigo (schools, mandatory time) | share of mistake sessions with any message | **17%**; median student messaged on 1/3 of practice days | [V] |
| Khan Academy (US, voluntary) | median annual practice | "a few hours per year" (Eames et al. 2026) | [S, via Oreopoulos & Low] |
| Khan Academy (UP RCT, facilitated) | practice | ~47 min/week | [V] |
| Utah EISP (reading software, schools) | grade 3 students meeting the vendor's minimum usage | ~35% | [V] |
| Ello | anecdotal session length | a parent reports a "10 min goal" stretching to 45 min | [V, testimonial] |
| Praktika | recent-review mean vs lifetime | 4.03★ vs 4.62★ | [V] |

**Patterns.**
- **Voluntary use collapses without structure.** This holds for Khan (median a few hours a year), Utah (two-thirds miss minimum usage) and Khanmigo (17%).
- **The products with consumer-grade retention are habit products**, built on streaks, short sessions and a character. Duolingo's CURR is a *language-app* number; no kids' K-9 curriculum tutor publishes one.
- **Taxila's target metric** should be a CURR analogue *for the parent-child unit*, plus "minutes of productive practice per week". Khan's UP study puts the dose that moves Indian scores at about 45–50 minutes a week.

---

## 5. Pricing ladder (USD → ₹ at ₹96/$, the FX assumption used across `docs/research`) [U for FX]

| product | price | ≈ ₹ per month | who pays | tag |
|---|---|---|---|---|
| Schoolhouse.world | free | 0 | donors | [V] |
| Khanmigo learner/parent | $4/mo or $44/yr | 384 (352 annual) | parent | [V] |
| MagicSchool Plus | $8.33–12.99 per teacher/mo | 800–1,247 | teacher/district | [V] |
| Praktika | ~$8/mo | ~768 | adult | [V] |
| PadhAI Pro (SigIQ, India) | ₹349–400/mo | 349–400 | adult aspirant | [V] |
| SpeakX (India) | ₹299/mo | 299 | family/adult | [S] |
| Photomath Plus | $9.99/mo or $69.99/yr | 960 (560 annual) | teen/parent | [V] |
| Speak | $20/mo or $99/yr | 1,920 (792 annual) | adult | [S] |
| Synthesis Tutor | $35/mo or $300/yr; family $119/yr | 3,360 (2,400 annual; 952 family) | parent | [V] |
| Synthesis Teams (live, human) | $95/mo | 9,120 | parent | [V] |
| Alpha School | $10k–75k/yr (~$40k typical) | ~3.2 lakh | parent | [S] |
| Google Play IAP ranges (India storefront) | Speak ₹1,199–26,000; Praktika ₹180–20,700; Gauth ₹7–10,000; Brainly ₹25–9,400; Photomath ₹90–2,900 | n/a | n/a | [V] |

**Read.** Global kids' AI tutors cluster at **$10–35 a month per child**; Khan holds the floor at $4. Indian evidence of willingness to pay for AI voice is **₹299 a month** (SpeakX) and **₹349–400** (PadhAI, adults). Family plans (Synthesis $119/yr for up to 7 children) suit Indian multi-child homes. Taxila's pricing decision belongs to the India doc, but globally nothing justifies more than ~₹500 a month without proof of outcomes.

---

## 6. Efficacy evidence ladder

| rung | product and study | effect | caveats | tag |
|---|---|---|---|---|
| 1. independent RCT, long horizon | Khanmigo, Tennessee, 2 years | 0.06–0.08 SD/yr ITT; 0.14 active | = KA without AI; low tutor use | [V] |
| 1. independent RCT (non-AI comparator) | Khan Academy, Uttar Pradesh, 7 months | **0.44–0.47 SD** | lab in-charges; ~47 min/week; underlying paper not read | [V blog] |
| 2. vendor-commissioned QED, large n | Amira, Louisiana 2023–24, n = 79,084 | g 0.03–0.22, dose-dependent | users vs non-users; partial baseline-equivalence failures | [V] |
| 2. state evaluation (pooled vendors) | Utah EISP 2022–23 | K: 0.16 ITT → 0.37 with full usage; G2–3: ≤0.13 | pooled across 5 products | [V] |
| 3. small pre-post or short | OKO, WestEd, 299 students, 2 weeks | significant fractions gain, less anxiety | no control reported on page | [V] |
| 4. vendor claims and surveys | Ello "88% read more"; MagicSchool "28%"; Amira "68% faster", "matches human tutoring in 30 sessions" | n/a | methods not shown or not read | [V claims] |
| 4. internal test data | Alpha / 2HL MAP "top 1–2%", "2×" | n/a | growth-multiple method criticised; Unbound 10% maths proficiency | [S] |
| 5. none found | Synthesis, Speak, Praktika, Gauth, Brainly, Photomath, Question.AI, Schoolhouse, SigIQ | n/a | n/a | n/a |
| (harm evidence) | unguarded GPT-4 answer help (Bastani, PNAS 2025) | −17% on the unaided exam | the relevant risk for answer engines | [V via `../learning-science.md`] |

**Four regularities.**
1. Independent long-horizon effects for software are about **0.05–0.15 SD**. Nobody has an independent result near "2 sigma".
2. Effect tracks **dose**, and dose depends on structure and humans.
3. Effects are **largest in the youngest grades** (K–1 reading).
4. **ITT is far below per-protocol**: 0.06 vs 0.14 in Tennessee, 0.16 vs 0.37 in Utah K.

Any Taxila outcome claim must be pre-registered with ITT as the headline.

---

## 7. Implications for Taxila

### 7.1 Build list (adopt, ranked)

1. **The teacher leads every exchange.** Auto-start, specific questions, "show me how you got that". The Oreopoulos result is the strongest single argument in this report.
2. **Turn detection and latency are first-class metrics with gates**, following Speak's design:
   - P95 end-of-speech-to-first-audio;
   - interruption rate on thinking pauses, measured on 6–12-year-old Hinglish speech;
   - a tap-to-finish control for ages 6–8.
3. **Two ASR paths**: conversational (intent) and reading/pronunciation (surface-faithful alignment). Collect consented Hindi-English child speech early; Ello's 100k hours are its moat.
4. **A plain-text learner card injected per turn** (recent attempts, prerequisite gaps, last-24-hour threads on this skill, interests), not raw logs. Khan's +6.1% / +5.09% is the measured upside.
5. **Authored NCERT and state-board lesson graphs as the spine.** LLM delivery is bounded by checkpoints, Speak-style (476/477). Generated visuals are welcome when the tutor can read their state. Live-path interactives stay curated or parameterised.
6. **The photo-homework flow turns into tutoring**: attempt the first step, verified maths, then a near-transfer twin problem. Never answer-first (Bastani −17%).
7. **A parent ritual as the "lab in-charge"**: weekly evidence plus nudges that protect about 45–50 minutes a week of practice, the dose behind UP's 0.45 SD.
8. **Bounded first calls** (Lily-style, a few minutes), with personality that unlocks with progress.
9. **A group or sibling mode** (OKO pattern) as a later differentiator for Indian homes and classrooms.

### 7.2 The relational-OS conflict: resolve before building

The owner's thesis says Taxila "bonds over months". Ello, the most child-specialised competitor, publishes the opposite: no "I love you", no "I'm real", no "best friend", no secrets, frequent AI reminders, and a redirect to adults. It frames simulated intimacy and exclusivity as the dependency mechanism. Regulation points the same way (SB 243 disclosure and break reminders; FTC 6(b); Common Sense "unacceptable risk" for companions; see `../learning-science.md` §8 and `../safety/`). A workable synthesis **[U, my recommendation]**:
- **Warmth and continuity, yes**: remembers interests and struggles, celebrates effort, calls back to last week.
- **Intimacy, no**: never claims feelings or a friendship, never asks the child to keep secrets, never discourages ending a session, and redirects emotional disclosures to parents.
- **Make the "bond" a three-way bond**: teacher-child-parent, with the parent seeing what the teacher "remembers".

Log this as a decision with a reversal condition, for example "an independent child-safety review finds that specific attachment cues improve learning without dependency markers".

### 7.3 Engagement without dependency

- **Borrow from Duolingo:** a single compounding retention metric, short sessions, character, rewards for effort.
- **Do not borrow:** streak loss-aversion as the main hook for 6–12-year-olds, or engagement as the success metric.
- **Report** both "minutes of productive practice" and "learning measured by transfer items". Adopt Ello's rule: time up without learning up is a regression.

### 7.4 Where Taxila can be first

No product on this list combines all four of:
1. a Hindi-English voice teacher for classes 1–9;
2. Indian-curriculum lesson graphs;
3. child-grade ASR for Indian accents;
4. an evidence-producing parent loop.

Khan has 2 (partially; English and Hindi exist for teachers only). Ello has 3 for US English. Synthesis has interaction craft but no voice teacher or Indian content. Schoolhouse has zero Indian-curriculum tutors **[V]**.

---

## 8. Threats and what would change these conclusions

| threat | likelihood | signal to watch | response |
|---|---|---|---|
| Khan turns on free student Khanmigo in Hindi, with voice and Gemini diagrams, in India | medium | Khanmigo pricing page lists India; KA India announces student access | position as "voice teacher for *your* textbook chapter + parent loop"; consider partnering on content |
| Duolingo extends Video Call and "spoken tokens" to maths (Duolingo Math) and to kids | low–medium | Duolingo Math gets Video Call; Duolingo ABC gets voice AI | compete on curriculum alignment and evidence, not on character |
| Google folds Photomath/Socratic into Gemini with a tutor mode for teens in India (free AI Plus for students) | high for classes 8–9 | Gemini "guided learning" in Hindi | focus on classes 1–7 and on voice-first, where the photo-solver habit is weak |
| Ello or Synthesis launch India English-reading or maths (Ello already teaches ESL "in other countries") | low–medium | India storefront pricing; Hindi support | Hindi-medium plus state boards plus ₹ pricing |
| A strong independent RCT shows a voice AI tutor at ≥0.3 SD for under-12s | unknown | LearnLM×Eedi scaled RCT results (ran Apr–Jun 2026, not yet public) | update §6; adopt that study's design features |
| Regulation hardens on child AI companions (India DPDP rules, US state laws) | high | DPDP child-data rules; more SB 243 clones | the §7.2 hard lines already comply |

---

## 9. Open questions and next measurements

1. **Hands-on teardown (1 day).** Script 10 Hinglish child utterances, recorded by 2–3 children aged 7–11 with consent, and run them through Speak Live, Praktika, Ello (iOS), Synthesis (web) and Khanmigo (US account). Measure turn-gap, interruption on 1.5 s pauses, correction of a deliberately misread word, and memory the next day.
2. **Read the underlying papers** for the UP RCT (Oreopoulos et al.) and Amira's Columbia study. Both are cited from vendor blogs here.
3. **Verify the [U] items with a fresh search budget:** Speak ARR and paid subscribers; Praktika's funding round; MagicSchool teacher count and funding; SigIQ seed size; Gauth ownership; Ello premium price.
4. **App Store (iOS) ratings** for Ello and Synthesis. Their Android numbers are not representative.
5. **Review mining by country.** Re-run `global_tutors_review_themes.py` with a scraper that separates country, and add Hindi-keyword themes for Indian parents.

---

## 10. Sources (all accessed 2026-10-02)

**Khanmigo / Khan Academy**
- Oreopoulos & Low (2026), *One Click Away: AI Tutoring with Khanmigo in a Two-Year School Experiment*, EdWorkingPaper 26-1551: https://edworkingpapers.com/sites/default/files/ai26-1551.pdf [V]
- Sal Khan, "Khanmigo's First Chapter Changed How I Think About AI" (27 Aug 2026): https://blog.khanacademy.org/khanmigos-first-chapter-changed-how-i-think-about-ai-a-note-from-sal-khan/ [V]
- Sal Khan, "What I found compelling in a new randomized trial…" (24 Aug 2026): https://blog.khanacademy.org/what-i-found-compelling-in-a-new-randomized-trial-of-khan-academy-in-math-intervention/ [V]
- "How Khan Academy Is Building a Better AI Tutor: Our Most Recent Learnings" (6 May 2026): https://blog.khanacademy.org/how-khan-academy-is-building-a-better-ai-tutor-our-most-recent-learnings/ [V]
- "What a Randomized Control Trial in Uttar Pradesh, India, Teaches Us…" (21 Jan 2026): https://blog.khanacademy.org/what-a-randomized-control-trial-in-uttar-pradesh-india-teaches-us-about-improving-math-learning-with-khan-academy/ [V]
- "New AI Tools Bring Interactive Diagrams…" (27 Aug 2026): https://blog.khanacademy.org/new-ai-tools-bring-interactive-diagrams-and-targeted-practice-thanks-to-khan-academys-partnership-with-google-org/ [V]
- "Five Ways Khan Academy Is Making Student Practice More Motivating" (2 Oct 2026): https://blog.khanacademy.org/five-ways-khan-academy-is-making-student-practice-more-motivating/ [V]
- Khanmigo pricing: https://www.khanmigo.ai/pricing [V]
- Barnum, "Why Sal Khan Is Rethinking How AI Will Change Schools", Chalkbeat, 9 Apr 2026 (cited in Oreopoulos & Low; not fetched) [S]

**Duolingo**
- Q2 2026 shareholder letter (8-K EX-99.2): https://www.sec.gov/Archives/edgar/data/1562088/000162828026053299/q2fy26duolingo6-30x26share.htm [V]
- Q1 2026 shareholder letter: https://www.sec.gov/Archives/edgar/data/1562088/000162828026029790/q1fy26duolingo3-31x26share.htm [V]
- Q4 2025 shareholder letter: https://www.sec.gov/Archives/edgar/data/1562088/000162828026012246/q4fy25duolingo12-31x25shar.htm [V]
- Video Call with Lily: https://blog.duolingo.com/video-call/ [V]
- Lily on Rive: https://x.com/guidorosso/status/1904374664388018403 [S]; Duolingo on Wikipedia: https://en.wikipedia.org/wiki/Duolingo [S]

**Speak**
- https://www.speak.com/ [V]; Series C: https://www.speak.com/blog/series-c [V]; Wrapped 2025: https://www.speak.com/blog/speak-wrapped-2025 [V]
- Voice agent platform: https://www.speak.com/blog/building-speaks-voice-agent-platform [V]
- Live tutor lessons on GPT-Live-1: https://www.speak.com/blog/live-tutor-lessons-powered-by-openais-gpt-live-1 [V]
- ACL 2026 note: https://www.speak.com/blog/what-acl-2026-confirmed-about-speech-ai-for-learning [V]
- TechCrunch, Dec 2024: https://techcrunch.com/2024/12/10/openai-backed-speak-raises-78m-at-1b-valuation-to-help-users-learn-languages-by-talking-out-loud/ [S]

**Praktika**: https://praktika.ai/ [V]; Praktika 4.0: https://praktika.ai/blog/praktika-4-0 [V]

**Synthesis**: https://www.synthesis.com/tutor ; https://www.synthesis.com/pricing ; https://www.synthesis.com/about [V]

**Ello**
- https://www.ello.com/ ; https://www.ello.com/how-it-works ; https://www.ello.com/our-teaching-approach ; https://www.ello.com/about (stats served at /research) [V]
- AI safety: https://www.ello.com/legal/ai-safety [V]
- "AI should make it clear what reality is": https://www.ello.com/blog/ai-should-make-clear-what-reality-is [V]

**Amira**
- https://amiralearning.com/ ; https://amiralearning.com/research [V]
- Louisiana ESSA II study PDF: https://explore.amiralearning.com/hubfs/Amira-Learning-Louisiana-Public-Schools-Research-Study.pdf [V]
- Utah EISP report PDF: https://explore.amiralearning.com/hubfs/Research/Utahs%20Early%20Interactive%20Reading%20Software%20Program%20Report%20(2).pdf [V]
- Columbia "30 sessions" summary: https://amiralearning.com/research/amira-vs-human-tutoring-matching-the-effectiveness-in-just-30-sessions [V claim]

**OKO**: https://www.okolabs.ai/ ; https://www.okolabs.ai/research ; https://www.okolabs.ai/about [V]

**SigIQ**: https://sigiq.ai ; https://evertutor.ai/ ; https://padhai.ai/ [V]

**Answer engines**
- Gauth: https://www.gauth.com/ ; https://www.gauth.com/aboutus [V]
- Photomath: https://photomath.com/ [V]; https://en.wikipedia.org/wiki/Photomath [S]
- Brainly: https://en.wikipedia.org/wiki/Brainly [S]
- Socratic: https://socratic.org/ (302 → https://lens.google/#homework → https://search.google/ways-to-search/lens/) [V]

**Alpha School**
- https://alpha.school/ ; https://2hourlearning.com/ ; https://2hourlearning.com/the-results/ [V]
- https://en.wikipedia.org/wiki/Alpha_School [S]
- https://www.theargumentmag.com/p/why-parents-love-a-school-with-bogus [S]
- Axios on expansion (403 on refetch; cited in `../tech-and-market.md`): https://www.axios.com/2026/08/02/alpha-schools-ai-expansion-50-campuses [S]

**MagicSchool**: https://www.magicschool.ai/ ; https://www.magicschool.ai/pricing [V]

**Schoolhouse.world**: https://schoolhouse.world/ ; https://schoolhouse.world/about ; https://schoolhouse.world/sat-bootcamp ; https://schoolhouse.world/course/india [V]

**Google Play listings and reviews** (fetched 2 Oct 2026 via `google_play_scraper`; raw data in this folder): `https://play.google.com/store/apps/details?id=` + org.khanacademy.android, org.khankids.android, com.duolingo, com.selabs.speak, ai.praktika.android, com.ellotechnology.learn, com.synthesis.tutor, com.ajeei.padhai, co.brainly, com.education.android.h.intelligence, com.microblink.photomath, com.qianfan.aihomework, com.google.android.apps.seekh, com.prathamInternational.padhAI, com.loora.app, us.nobarriers.elsa [V]

**Cross-referenced (not re-fetched)**: Bastani et al. 2025 PNAS; Kestin et al. 2025; LearnLM×Eedi 2025; Yang, Van Alstyne & Dellarocas 2026; SB 243 / FTC 6(b) / Common Sense Media. All in `../learning-science.md` with URLs.

## Fact-check

Adversarial pass on 2026-10-02. Primary sources re-fetched; PDFs read via pdftotext. WebSearch budget was exhausted, so claims needing a search stay unconfirmed.

| # | Claim | Verdict | Corrected value | Source |
|---|---|---|---|---|
| 1 | Khanmigo Tennessee RCT: 18 schools, 0.06 ITT/yr, 0.08 yr2, 0.14 full-year; 96% tried; median 17% of mistake sessions; 14.5% maths messages; ~$15/student/yr | supported (one nuance) | All numbers match. The paper says gains "resemble" Khan Academy practice, not that they are identical. The median student also messaged on only a third of practice days. Setting: daily remedial maths, 2024-25 and 2025-26. | https://edworkingpapers.com/sites/default/files/ai26-1551.pdf |
| 2 | Khan 2026 fixes: ~20 A/B tests, 15M+ threads, +3.4%, +2.7%, 6.1% combined, JSON to plain text +5.09%, latency cuts 0.3/3/0.4 s, last halved give-aways | partly | Mostly confirmed (Oct 2025-Apr 2026; 608k and 1.36M threads). The latency cuts were 0.3 s (math agent), 3 s (concise replies) and 0.4 s (narrower scope), and the 0.4 s change cut give-aways by 50%. The 5.09% was a cognitive-engagement metric, not correctness. The "auto-activates and prompts explanation" wording was not checked line by line. | https://blog.khanacademy.org/how-khan-academy-is-building-a-better-ai-tutor-our-most-recent-learnings/ |
| 3 | UP RCT: 74 schools, grades 6-8, lab in-charges, 2 sessions/wk, Hindi CBSE/UP tests, +0.44-0.47 SD, ~47 min/wk, ~3x Tennessee | partly | Facts confirmed (24 treatment and 50 control schools). "~3x" is the author's own arithmetic (0.45/0.14 is about 3.2x vs full-use, 7x vs ITT). "Strongest causal lever" is an inference, since the trial bundled structure, human and practice. The effect is on plain Khan Academy, not AI. Vendor blog; paper unread. | https://blog.khanacademy.org/what-a-randomized-control-trial-in-uttar-pradesh-india-teaches-us-about-improving-math-learning-with-khan-academy/ |
| 4 | Duolingo Q2 2026: 58.7M DAU, 140.6M MAU, 12.7M paid, CURR 84%, 15.4M streak revivals, Lily moved to Super, words spoken doubled, GM 72% to 69% | partly | DAU, MAU, paid, CURR 84% and the 15.4M event (nearly 8M had no active streak) are confirmed. DAU/MAU is 41.7%. Q2 2026 gross margin was 72.6% (72.4% a year earlier), and full-year 2026 guidance was raised to about 71.6%. The 69% figure was the Q4 FY25 guidance of "roughly 69% for the rest of the year", which is superseded. The Video Call move to Super was announced in the Q4 FY25 letter; Q2 says most new Super subscribers have it. The "words spoken more than doubled" claim was not found in either letter. | https://www.sec.gov/Archives/edgar/data/1562088/000162828026053299/q2fy26duolingo6-30x26share.htm ; https://www.sec.gov/Archives/edgar/data/1562088/000162828026012246/q4fy25duolingo12-31x25shar.htm |
| 5 | Speak/GPT-Live-1: 300-500 ms threshold breaks; 27.6% to 13.6%; under 10% on 1-2 s pauses; ~1 s reply; 476/477 steps; tap-to-finish; Lily pauses, no grammar correction | supported | Confirmed. The 476/477 figure comes from 27 lessons. Speak also reports ~85% appropriate corrections and ~80% of targeted errors identified, which is a caveat for "restraint". Vendor-reported. | https://www.speak.com/blog/live-tutor-lessons-powered-by-openais-gpt-live-1 ; https://www.speak.com/blog/building-speaks-voice-agent-platform ; https://blog.duolingo.com/video-call/ |
| 6 | Child ASR: Ello 100,000+ hrs, patented, <1 s; Speak ACL 2026; Praktika reviews | partly | The Speak ACL point is confirmed (ASR recovers intent and hides errors). The Ello figures could not be verified: the about page shows animated counters ("0+ hours", "<0s latency") that scraped as zeros, and "patented" is not shown. Mark [U]. The Praktika review quote was not re-checked. | https://www.speak.com/blog/what-acl-2026-confirmed-about-speech-ai-for-learning ; https://www.ello.com/about |
| 7 | Ello hard lines: never real, never "I love you" back, never friend, never secrets, reminds it is AI, trusted adults, SB 243, more time without learning = warning sign | supported | Confirmed. The blog has "never tell a child it is real", "never say I love you back", "never call itself the child's real friend", "never offer to keep a secret" and the warning-sign line. The safety page confirms the AI reminders, the redirect to adults and SB 243. The conflict with Taxila's bonding thesis is an inference, but a sound one. | https://www.ello.com/blog/ai-should-make-clear-what-reality-is ; https://www.ello.com/legal/ai-safety |
| 8 | No independent RCT of any listed AI tutor; Amira ESSA II n=79,084, g 0.03-0.22; Utah ITT 0.16 vs 0.37, ~35% of G3 | partly | Amira numbers confirmed: matched n=79,084, ESSA Level II, 12 Louisiana districts, run by Instructure but commissioned by Amira. The g range is 0.03-0.22, largest in G1 at high use, and the effect rises with usage. The Utah study pools five vendors, not just Amira (K ITT 0.16; 0.37 for those meeting the vendor recommendation). About 35% of 3rd graders met the recommendations, against about 40% in K-2. The Tennessee Khanmigo trial (claim 1) is itself an independent RCT of an AI tutor, though it finds no AI-specific effect. Reword "no independent RCT" as "no independent RCT showing the AI tutor itself causes gains". | https://explore.amiralearning.com/hubfs/Amira-Learning-Louisiana-Public-Schools-Research-Study.pdf ; https://explore.amiralearning.com/hubfs/Research/Utahs%20Early%20Interactive%20Reading%20Software%20Program%20Report%20(2).pdf |
| 9 | Alpha School: internal MAP data, meaningless growth multiple; Unbound 28% ELA / 10% maths vs 65% / 60%; causes are guides, incentives, self-selection; $10k-75k | partly | Unbound figures are confirmed (state averages 42% and 34%; Alpha claimed 1.8x growth). Tuition is "up to $75,000" per the article. The $10k floor and the causal attribution are not shown in the source (inference). The Wikipedia and 2hourlearning pages were not re-fetched. | https://www.theargumentmag.com/p/why-parents-love-a-school-with-bogus |
| 10 | Play installs: Brainly 297.7M, Photomath 281.9M, Gauth 122.7M, Question.AI 27.5M, Khan 33.8M, Khan Kids 12.3M; Socratic discontinued; Bastani -17% | partly | Installs match the local JSON exactly (realInstalls). socratic.org returns a 302 to lens.google/#homework, consistent with discontinuation. The Bastani -17% figure was not re-checked here (it lives in learning-science.md). | global-tutors-playstore-2026-10-02.json ; https://socratic.org/ |
| 11 | Interactive visuals: Khanmigo + Gemini diagrams since Aug 2026; Gauth Atlas; Synthesis hand-builds; Sal quote | partly | Khan post dated 27 Aug 2026: Gemini diagrams, reacts to dragging, "preliminary signs" of engagement and next-item correctness gains. Gauth Atlas exists. NOT found: the Sal Khan quote (absent from the cited post) and any statement that Synthesis hand-builds its manipulatives (the about page only says "interactive manipulatives"). Mark both [U]. | https://blog.khanacademy.org/new-ai-tools-bring-interactive-diagrams-and-targeted-practice-thanks-to-khan-academys-partnership-with-google-org/ ; https://www.gauth.com/ ; https://www.synthesis.com/about |
| 12 | Prices: Khanmigo $4/mo; Praktika ~$8; Speak $20/$99; Synthesis $35/mo or $300/yr, family $119/yr; PadhAI Rs 349-400; ~8x vs Rs 299 | partly | Khanmigo $4/mo ($44/yr) confirmed. Praktika ~$8/mo confirmed. Speak not re-checked. Synthesis is inconsistent across its own pages: pricing shows $35/mo monthly or $25/mo annual (=$300/yr) per child, and family $70/mo or $33.33/mo annual, while the about page says $29/mo or $119/yr for up to 7 kids. State that prices vary by promo. The PadhAI at Rs 349/mo is a UPSC-aspirant product (PadhAI.ai), not a K-9 tutor, so it is a weak India K-9 comparable. The 8x figure depends on the FX rate: $35 is about Rs 3,000 and $25 about Rs 2,200, so "~7-10x" is safer than "8x". | https://www.khanmigo.ai/pricing ; https://www.synthesis.com/pricing ; https://praktika.ai/ ; https://padhai.ai/ |
| 13 | Review mining: ELSA 7.0% @2.14, Praktika 6.8% @1.71, Speak 5.5% @3.15; human/robotic <=0.3%; Praktika 4.03 vs 4.62 | supported | Matches the local JSON exactly (n=600 each, 21 Aug-1 Oct 2026). Photomath is 5.3% @1.97 and PadhAI 4.2% @2.24, so the paywall theme is broad. The "one global sample" caveat applies: the in and us keys return identical data. 4.62 lifetime was not re-derived. | global-tutors-review-themes-2026-10-02.json |
| 14 | Every high-effect model has a human driver; OKO WestEd 299 students, 2 weeks; Schoolhouse India 0 tutors | partly | OKO: 299 students, 11 classrooms, 2-3 sessions per week for two weeks; fractions gains significant, lower maths anxiety. It was a short pre/post study with no stated control, so it is not a high-effect-at-scale model. Schoolhouse India page confirmed: "0 Indian Curriculum Tutors" and no sessions. Schoolhouse is free and peer-powered, and the grade range is not stated. "Every" is an overgeneralisation, and the 2hourlearning/Alpha link was not checked. | https://www.okolabs.ai/research ; https://schoolhouse.world/course/india ; https://schoolhouse.world/about |
