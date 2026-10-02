# India AI-native tutors, 2024–2026: competitive teardown for Taxila

**Date:** 2026-10-02. **Scope:** Indian AI-native tutoring products and public/NGO AI-in-education programmes relevant to Taxila (classes 1–9, CBSE/NCERT + state boards, Hindi-English voice tutor). **Companion docs:** `../tech-and-market.md` §5 (global competitor table, which this file deepens for India) and `../learning-science.md`.

**Evidence tags.** **[V]** = read at the primary source in this session (company filing or letter, app-store listing, vendor pricing page, paper, government release). **[S]** = secondary source (press, trade media, aggregator), or a vendor's self-reported claim seen via press. **[U]** = unverified, from memory, or inferred. A **[V]** on a vendor page means *the vendor says so*, not that the claim is true. FX: **₹96 = $1** (same as `tech-and-market.md`).

**Method and limits.** I used about 25 web searches (the shared session search budget ran out partway), about 45 page fetches, direct reads of the PhysicsWallah Q4 FY26 shareholder letter and earnings-call transcript (PDF), the NBER Mindspark paper, the Shiksha Copilot paper, and live Google Play listings fetched on 2026-10-02. I could **not** confirm by hand whether PW's AI Tutor had publicly launched by 2026-10-02. I did not install or test any product, so every claim about voice quality below is a claim, not a measurement. The smaller AI-tutor startups (Edzy, Supernova, Stimuler and others) are **not covered**; I found them too late to search.

---

## 0. The 12 findings that matter for Taxila

1. **PhysicsWallah is the real threat, not YoLearn.** PW has its own stack: *Aryabhata*, a 20B model with about 3B active parameters; *ConceptGuru*, which teaches in "teacher-like Hinglish" from NCERT-aligned data and which PW calls "10x cheaper than GPT-4o mini"; and *Awaaz*, a TTS model "trained on 1000 hrs of high-quality teachers' voice data" **[V, PW Q4 FY26 letter]**. It has 3.3M DAU at 104 min a day **[V]**. Its next product is a "Socratic AI Tutor" that "will remember all of your past mistakes… six months before" and "act as a true companion for the kids" **[V, May-2026 earnings call]**. That is Taxila's thesis, said out loud by a listed company with 89M app downloads.
2. **PW's cost anchor is ~$0.20/h (≈₹19/h) for voice-to-voice tutoring** **[S, PW Q1 FY27 letter via Medianama]**. Its price frame is "less than ₹4,000 [ARPU]… comes down to a ₹10 per day cost of tutoring" **[V, transcript]**. A cascade built on off-the-shelf Sarvam APIs costs **₹68–126/h ($0.71–1.31/h), 3.5–6.5× more than PW**, and **TTS is 65–80% of that cost** (my calculation, §5.3). So a Taxila that bills ₹299–699/mo cannot offer uncapped live voice on API TTS. It needs cached narration audio, its own or an open TTS, or metered minutes.
3. **PW's K-12 presence below class 9 is human-led, not AI-led.** CuriousJr (classes 1–9) is live 2-teacher tuition in batches of **400–500 students**, at **₹30,000/yr** for a class-6 Power Batch **[V, pw.live / curiousjr.com]**. It is growing fast: enrolments +67% and collections +150% in Q1 FY27 **[S]**. PW has said it will make **no capital allocation for K-12 M&A** and has **"no plans to run schools"** **[V, transcript]**. That leaves an opening for an AI-first product for classes 1–8 today, but PW is likely to fold its AI Tutor into CuriousJr. Expect this to happen within 6–12 months **[U, inference]**.
4. **YoLearn.ai is the closest product match, with small traction.** It offers a voice-first tutor, a live sketchpad, teacher avatars and claims 22 languages **[S]**. On Google Play it has **1L+ (100k+) downloads, 4.2★ from 375 reviews** (updated 19 Sep 2026) **[V]**, against the "200k+ cumulative users" it claims **[S]**. Usage concentrates in **grades 9–12** **[S]**. Pricing is token packs, with Play in-app items at **₹4–₹18,000** **[V]**. Its strategic move is **B2B2C through publishers**: ABP Education took equity and is turning the Headword and KIPS school textbooks into AI tutors for the 2026–27 session **[S]**. Textbook publishers are becoming a distribution channel for AI tutors.
5. **Hindi-belt families pay for voice AI, at ₹299/mo.** SpeakX (spoken-English AI): **₹299/mo**, about 2 lakh paid subscribers, **₹45 cr FY26 revenue**, ₹70–80 cr projected FY27, EBITDA-positive, **~30% monthly paid retention**, "no human touchpoint" **[S, Inc42 Sep 2026]**. It had about 20 staff at $7M ARR **[S, Elevation]**. Hindi speakers were 80% of users and now about half, as other languages were added **[S]**. This is the clearest Indian proof of B2C willingness to pay for an AI-only voice product. It is adults and teens learning English, not children learning school subjects.
6. **No student-facing generative-AI tutor in India has published learning-outcome evidence.** The only rigorous Indian evidence is for **pre-LLM adaptive software**. Mindspark in Rajasthan, at 20× the scale of the original trial: **+0.22 SD maths and +0.20 SD Hindi after 18 months**, and "gains were proportional to student time on the platform" **[V, NBER w34205, Sep 2025]**. Andhra Pradesh PAL (ConveGenius): about 1.9 "years of schooling" in 17 months, $20–25 per student per year **[S, vendor and press]**. This is the bar Taxila has to beat, and time-on-task is its leading indicator.
7. **Government and NGO AI is assessment and teacher tools, not tutors for children.** Examples: Wadhwani AI oral-reading-fluency checks (7.9M students, 2 states **[V]**); Shiksha Copilot lesson plans (1,043 teachers, 2.02 h/week saved **[V]**); Khanmigo free *for teachers* in English, Hindi, Odia and Marathi **[S]**; AskDIKSHA Q&A over NCERT books **[V]**; Pratham's Claude-powered test generator (6,000 learners **[V]**). The one generative child-facing tutor at scale is **Rocket Learning's Appu**, for ages 3–6, voice-first, Hindi first, with about 1 lakh users at launch **[S]**.
8. **Under-13s are structurally unserved by big tech.** ChatGPT for Teens covers 13–17 **[S]**. The free ChatGPT Go year (from Nov 2025) **[S]** and the free Google AI Plus year for students (redeem by 31 Dec 2026) **[V]** are general assistants, not curriculum tutors, and are not built for 6–12-year-olds. Telcos have given away AI at the scale of 360M Airtel subscribers (Perplexity Pro, closed Jan 2026) **[S]**. So the **parents** of Taxila's users already have free AI. What they have not been given is a **safe, curriculum-mapped, Hindi-voice tutor for the child**.
9. **Children's Hindi-accented ASR and the reading level of replies are the documented failure modes.** A 2026 Delhi study of a Whisper → GPT-4o-mini → Google TTS voice bot with grade 7–8 Hindi-dominant students found that **nearly all students hit ASR errors**, **~35% needed help with the mic button**, and bot replies averaged a **Flesch-Kincaid grade of 12 against student level ~2** **[V, arXiv 2601.19304; n=23, 6 days]**. Taxila's register control and its kid-speech ASR are product features, not polish.
10. **Sarvam is a vendor, not a competitor, for now.** STT ₹30/h, TTS ₹3 per 1k characters, Sarvam-105B at ₹29/₹73 per M input/output tokens **[V]**. It lists **no edtech customers** on its homepage **[V]**. TTS covers 11 Indic languages and STT 12 **[V]**. It raised $234M at a $1.5B valuation in Jun 2026 **[S]** and works with IIT Madras on *Bodhan AI* (the education AI Centre of Excellence) **[S]**. That is the path by which a free public tutor stack could appear.
11. **Krutrim is not a viable dependency.** It shut its Kruti assistant (<500k users), paused Krutrim 3, cut headcount from about 550 to 150–160, and pivoted to cloud **[S]**. Jio's education AI runs through **Embibe**, absorbed into Jio Platforms in Apr 2025 after about 300 layoffs **[S]**. Embibe's historic school-B2B price was **₹500 per child per year** **[S, 2023]**. It is a distribution threat if Jio bundles a tutor, not a product threat today.
12. **Trust is still the opening.** CuriousJr's Trustpilot reviews are polarised: 21 reviews, 52% 5★ and 48% 1★, with refund and EMI complaints, ₹25k–28k course fees, and a ₹4,999 registration fee **[S]**. BYJU's is still in insolvency (see `tech-and-market.md`). A transparent monthly plan with no sales calls is a real differentiator in the Hindi belt.

---

## 1. Landscape map

| player | type | target classes | student-facing gen-AI tutor? | Hindi voice | multimodal/interactive | price to family | traction (latest) |
|---|---|---|---|---|---|---|---|
| **PhysicsWallah** (Alakh AI, AI Guru, Ask AI, Gyan Guru; AI Tutor beta) | listed edtech | 6–12 + exams; CuriousJr 1–9 (human) | AI Guru/Ask AI inside paid batches; **1:1 Socratic AI Tutor in beta** | **yes**: Ask AI voice bot; Awaaz TTS on 1,000 h of teacher voice **[V]** | text/image/speech doubts; PW Books; AI Grader | online ARPU ₹4,104/yr **[S]**; CuriousJr ₹30k/yr **[V]** | 5.34M paid users FY26 **[V]**; 3.3M DAU **[V]**; AI Guru 99.45M queries **[V]** |
| **YoLearn.ai** | seed startup (Noida/Gurugram) | claims 1–12 **[V, site schema]**; usage 9–12 **[S]** | **yes**: real-time voice tutor | claims Hindi, Hinglish and 22 languages **[S]**; quality untested | **live sketchpad**, diagrams, flashcards, mind maps **[V, Play]** | token packs; IAP ₹4–18,000 **[V]** | 1L+ Play downloads, 4.2★/375 **[V]**; "200k+ users" **[S]** |
| **SpeakX** | VC-backed, profitable | teens/adults (English) | yes (English speaking only) | Hindi-medium scaffolding **[S]** | role-play voice sims | **₹299/mo** **[S]** | ~2L paid, ₹45 cr FY26 **[S]** |
| **ProLearn** | pre-seed | K-12 + exams | planned | not stated | not stated | "affordable" | $4.07M pre-seed, Jun 2026, pre-launch **[S]** |
| **ConveGenius SwiftChat / SwiftPAL** | B2G edtech | 1–10 (govt schools) | chatbots + adaptive PAL; "Doubt Clearance Bot" | multi-language bots; voice companion "Swiftee" **[V, vendor]** | bots, adaptive drills | free to students (state-paid) **[V]**; PAL ₹1,700–2,100/student/yr **[V, vendor]** | 5M+ Play downloads, 4.1★/17.4K **[V]**; "150M+ children" **[V, vendor]** |
| **Rocket Learning – Appu** | NGO | ages 3–6 | **yes**, voice-first | **Hindi first**; 20 languages planned **[S]** | animated elephant, rhymes, activities **[S]** | free | ~1 lakh users at launch; 3M children in programmes **[S]** |
| **Wadhwani AI** | non-profit AI lab | primary (ORF) | no (assessment) | reads Gujarati/Hindi aloud to assess | n/a | free to states | 15M+ assessments, 7.9M students, 2 states **[V]** |
| **Pratham** | NGO | school + Grade-10 second chance | test machine (ATM, Claude) | not stated | handwritten-answer grading | free | 6,000 learners piloted; +15,000 in 2026 **[V]** |
| **Khan Academy India / Khanmigo** | non-profit | all | Khanmigo for **teachers** in India; learner plan $4/mo globally | Khanmigo in English, Hindi, Odia, Marathi **[S]** | KA exercises | teachers free; learners $4/mo **[V]** | KA app 1Cr+ (10M+) downloads **[V]**; Maharashtra 10 lakh registered **[S]** |
| **Shiksha Copilot** (MSR India + Sikshana) | research → state | teachers, classes 5–10 | no (teacher lesson plans) | Kannada/English | lesson-plan blocks | free | 1,043 teachers, 757 schools, 35 districts **[V]** |
| **Sarvam AI** | Indic model vendor | n/a | no edu product | STT/TTS 12/11 Indic languages **[V]** | n/a | API (see §5.3) | $1.5B valuation **[S]** |
| **DIKSHA / Bhashini / Bodhan AI** | government | K-12 | AskDIKSHA over NCERT books **[V]** | read-aloud; Bhashini MT/ASR/TTS | content library | free | DIKSHA 5Cr+ downloads **[V]** |
| **Ola Krutrim** | AI lab | n/a | none | 22-language LLM claim **[S]** | n/a | n/a | Kruti shut; pivot to cloud **[S]** |
| **Jio / Reliance (Embibe, AI Classroom)** | telco conglomerate | K-12 (Embibe) | Embibe AI "assistant teacher" in testing **[S]** | unknown | Embibe 3D/analytics **[U]** | schools ₹500/child/yr (2023) **[S]** | Embibe absorbed into Jio Apr 2025 **[S]** |
| **Airtel** | telco | n/a | none (Perplexity bundle) | n/a | n/a | free Perplexity Pro for 12 months to 360M subs, closed Jan 2026 **[S]** | n/a |

---

## 2. Deep dives: commercial players

### 2.1 PhysicsWallah (PW): the incumbent that is building Taxila's thesis

**AI stack, from PW's own Q4 FY26 shareholder letter** **[V]** ([letter PDF](https://www.medianama.com/wp-content/uploads/2026/05/PhysicsWallah-Q4-shareholder-letter.pdf)):

| model | what PW says |
|---|---|
| **Aryabhata** | "20B model with efficient ~3B active parameters", trained on a proprietary academic dataset, "10x/7x lower inference cost than Gemini 2.5 Flash / GPT-5 Mini" |
| **ConceptGuru** | "Delivering teacher-like Hinglish conceptual learning using NCERT-aligned Indian educational datasets", "10x cheaper than GPT-4o mini", "mnemonics, examples" |
| **Awaaz** | "Advanced multilingual text to speech enabling natural, instructional Indic-language capabilities", "Trained on 1000 hrs of high-quality teachers' voice data" |

**Application layer and usage, cumulative to 31 Mar 2026** **[V, same letter]**:

| product | role | usage |
|---|---|---|
| Ask AI | "Second teacher in class", a voice bot that solves doubts | 3.05M+ doubts, 91% satisfaction |
| AI Guru | "Grounded doubt solver", step-by-step, **Hinglish** | 99.45M+ queries resolved |
| PW Books | smart digital books | 1.4M+ downloads, 4.7★ |
| AI Grader | subjective answer evaluation | 1.43M+ copies graded, ~4.4/5 |
| AI Mentor | academic plus well-being support | 0.52M+ users, open to non-PW students |

Platform: **89.4M+ app downloads, 3.3M+ DAU, 104+ min daily engagement** (FY26) **[V]**. The Play listing for `xyz.penpencil.physicswala` shows 50M+ downloads and 4.7★ **[V]**.

**The AI Tutor (the direct threat).**
- Beta proof of concept: "95% lesson-level accuracy, <1% hallucination/error rate, response latency of 1.8–2.2 seconds". It has been tested with 300+ students and more than 1,000 queries. Voice-to-voice tutoring "currently being delivered ~$0.20 per hour". Launch is planned for "next quarter", i.e. Q2 FY27 (Jul–Sep 2026) **[S]** ([Medianama, Aug 2026](https://www.medianama.com/2026/08/223-physicswallah-personal-ai-tutoring-services/)). In the Q1 FY27 call it was called a "one-to-one Socratic AI tutor" priced affordably, plus an "AI companion for children" **[S]** ([Investing.com transcript](https://www.investing.com/news/transcripts/earnings-call-transcript-physicswallah-q1-2027-revenue-rises-24-as-online-gains-93CH-4861014)).
- Positioning, from the May 27, 2026 earnings call **[V]** ([BSE filing](https://www.bseindia.com/xml-data/corpfiling/AttachHis/e79d6f62-6a34-4be4-bdf3-1403a853ab7f.pdf)):
  - "it will remember all of your past mistakes. For example, six months before you have done any question wrong… It will have that memory… it will act as a true companion for the kids."
  - "if any AI tutor has to be built for Indian student, it has to be very affordable… average ARPU of our online course is less than INR4,000, that comes down to a INR10 per day cost of tutoring."
  - "the course completion rates of AI Tutor is very high… because it is truly acting as a companion"; "Gen Alphas… are more comfortable to asking a doubt to a AI than a human being because AI don't judge them."
- **Critical read.** A 95% lesson-level accuracy figure measured on about 1,000 queries leaves a 5% error rate. For a tutor that has to be trusted by parents of 8-year-olds, that is high. "<1% hallucination" and "95% accuracy" together imply that much of the error is pedagogical rather than factual **[U, inference]**. The claim about completion rates has no denominator. None of this is outcome evidence.

**K-12 posture.**
- In Q4 FY26 PW stopped putting capital into K-12 acquisitions. Quotes: "there will be no capital allocation for M&A in terms of K-12 domain"; "there are no plans to run schools at PW" **[V, transcript]** ([Medianama, May 2026](https://www.medianama.com/2026/05/223-physicswallah-u-turn-school-ai-for-growth-q4-fy26/)).
- Online K-12 is growing. In Q1 FY27: K-12 online enrolments went from 0.55M to 0.78M (+41%) and revenue from ₹56 cr to ₹105 cr (+88%). CuriousJr enrolments rose 67% and collections 150%. State-board coverage widened from 7 to 14 states. Vernacular grew 1.7× **[S, transcript summary]**.
- FY26: State Boards plus vernacular reached 393k enrolments, EBITDA-positive in year one, "TAM in excess of 60M students" **[V, letter]**.
- **CuriousJr** is human live tuition for classes 1–9: a "Master Teacher" plus a mentor, batches of "400–500 students", bilingual (Hindi + English) or English, CBSE/ICSE/J&K board **[V]** ([curiousjr.com](https://www.curiousjr.com/in/school-curriculum)). A class-6 Power Batch lists at ₹35,000, discounted to ₹30,000, shown as "₹2,155/month" on EMI **[V]** ([pw.live](https://www.pw.live/curious-jr/batches/power-batch-class-6th-[school-jee-neet]-2026-||-f0611eb-950941)). The app has 50L+ downloads, 4.7★ from 31.7K reviews **[V, Play]**. Trustpilot has 21 reviews, polarised, with refund complaints **[S]** ([Trustpilot](https://www.trustpilot.com/review/www.curiousjr.com)).

**History.**
- Alakh AI launched in Dec 2023 (AI Guru, Sahayak, NCERT Pitara) and reached 1.5M users in under two months **[S]** ([Inc42](https://inc42.com/buzz/physics-wallah-rolls-out-ai-education-suite-garners-1-5-mn-users/)).
- Gyan Guru: RAG over Azure OpenAI covering 1M+ Q&As and 10M+ solved doubts **[S, Microsoft case study]** ([Microsoft](https://www.microsoft.com/en-in/aifirstmovers/physicswallah)).
- PW worked with Microsoft Research on Phi-based small models and "150,000 high-quality math reasoning traces". In Feb 2025 PW said that LLM accuracy "is not up to the mark… all the time" **[S]** ([MSR blog](https://www.microsoft.com/en-us/research/blog/microsoft-research-and-physics-wallah-team-up-to-enhance-ai-based-tutoring/)).
- PW says 90% of doubts are solved by AI, with thumbs-down answers escalated to humans **[S]** ([BusinessToday](https://www.businesstoday.in/technology/story/why-physicswallah-believes-it-can-beat-openai-google-in-indias-ai-tutor-race-534212-2026-06-01)).

**Side signal: voice agents in sales.** PW's AI voice bots "handle more than 6,000 calls daily at ~₹2.7 per minute" (₹162/h), "reducing counselling costs by ~75% vs human-led calling" **[V, letter]**. Sales calls are a different workload from tutoring, but ₹162/h is a real Indian production number. It is about 8× the ~₹19/h tutoring claim, which suggests the tutoring figure leans on PW's in-house TTS and model and probably on cached audio **[U, inference]**.

**What PW lacks for classes 1–8 (inference)**
- (a) Its brand and pedagogy were built for test prep, aimed at 15–18-year-olds.
- (b) Its batches are huge, with no 1:1 for under-10s except through mentors.
- (c) It has shown no interactive simulations or games.
- (d) It has published no under-13 safety design. **[U]**

### 2.2 YoLearn.ai: closest product, small scale, publisher-led distribution

- **Product.** The Play listing **[V]** ([Play](https://play.google.com/store/apps/details?id=com.yolearn.student&hl=en)) describes "Real-time voice AI tutor", "Voice call your AI tutor", photo doubts, "NCERT-based learning", quizzes, flashcards, summaries and mind maps, an "AI study mentor", "AI Co-Teacher Avatar" for teachers, and "Multi-language support (English + Indian languages)". It markets itself as "emotionally intelligent". The website schema now says "Class 1–12" **[V]** ([yolearn.ai](https://www.yolearn.ai/students/pricing)). Press says it has a live interactive sketchpad, 22 Indian languages "including Hindi and Hinglish", "AI Avatar versions of real school teachers for partner institutions", K-12 coverage with usage highest in grades 9–12, and claims "100% syllabus accuracy" **[S]** ([Indian Startup Times, Jun 2026](https://www.indianstartuptimes.com/investment/yolearn-ai-raises-500k-pre-seed-funding-to-expand-voice-first-ai-tutoring-platform/)).
- **Pricing.** Free tier (daily token limit), Starter (500 tokens/mo), Pro (1,000 + 200), Elite (2,000 + 500). Tokens roll over. The pricing page renders no INR figures without JavaScript **[V]**. Play in-app items run ₹4.00–₹18,000.00 **[V]**.
- **Traction.** Play shows **1L+ downloads, 4.2★, 375 reviews, updated 19 Sep 2026** **[V]**. Claimed: 200k+ cumulative users across platforms **[S]**. Funding: $500k pre-seed at $5M post-money (Jun 2026) **[S]**, then a strategic investment of undisclosed size from ABP Education (Sep 2026) **[S]** ([Republic](https://www.republicworld.com/initiatives/abp-education-invests-in-yolearnai-to-expand-personalized-learning-for-250-million-indian-students-noida-3rd-september-2026-2026-09-05-136388)).
- **Distribution move.** ABP's Headword Publishing and KIPS Learning will launch "Headword.ai" and "kipslearning.ai" built on YoLearn for 2026–27, aimed at a combined network of "~100 million learners" and "~25,000 schools" **[S, press release]**. Privacy claims: India-hosted data, "live voice processing (no storage)", DPDP compliance **[S]**.
- **Inconsistencies.** Founding date is given as Jan 2025 in press, "2023" in the site schema, and 2025 on Tracxn. HQ is given as Noida in press and Gurugram on Tracxn. Sarvam's TTS covers 11 Indic languages **[V]**, so a "22-language voice" claim implies either another vendor or text-only support in some languages **[U]**.
- **Implication.** YoLearn validates the product shape. It has not proven B2C demand: 100k Play installs in about 18 months. Its bet is B2B2C through publishers' school networks. Taxila should **test YoLearn's Hindi voice for children by hand** before claiming any superiority (§8).

### 2.3 SpeakX: proof of B2C willingness to pay for AI voice in middle India

- **Product.** A GenAI conversational English coach that runs role-plays (interviews, workplace), corrects speech live and scaffolds from vernacular to English, with no human touchpoint **[S]** ([Outlook Business](https://www.outlookbusiness.com/corporate/speakxai-raises-16-mn-from-westbridge-capital-eyes-regional-language-expansion-amid-profitable-growth); [Inc42](https://inc42.com/buzz/exclusive-ms-dhoni-joins-edtech-startup-speakxs-cap-table/)).
- **Numbers.**

| period | metric |
|---|---|
| Oct 2025 | 1M+ monthly learners, ~200k paid, $7.5M ARR, EBITDA-positive since Apr 2025, CAC payback of "one day", LTV/CAC 3.7× within six months, **35% retention at month 3** **[S]** |
| Sep 2026 | ₹299/mo, FY26 revenue ₹45 cr, FY27 projected ₹70–80 cr, about 30% monthly paid retention, MS Dhoni as investor and ambassador, >$20M raised in total **[S]** |
| team | about 20 people at $7M ARR **[S]** ([Elevation](https://www.elevationcapital.com/perspectives/speakx-building-india-largest-ai-language-learning-app)) |

- **Language mix.** Hindi speakers were 70–80% of users and are now about half, after Bengali, Tamil, Telugu, Malayalam, Kannada and Marathi were added **[S]**.
- **Implication.** ₹299/mo is a **proven price** for AI voice in the Hindi belt. Month-3 retention of about 30–35% is a realistic B2C baseline for Taxila's retention model. A team of about 20 at $7M ARR shows an AI-only product can run lean.

### 2.4 ProLearn, Embibe/Jio and the rest of the commercial field

- **ProLearn** raised $4.07M pre-seed (BEENEXT lead; Eximius, Antler) in Jun 2026. Its founder is Ravneet Singh, formerly of Vedantu. The product is an "AI-powered learning companion" for K-12 and exams (JEE, NEET, UPSC, CAT). It is pre-launch, with no stated voice or Hindi plan **[S]** ([Dealroom](https://dealroom.co/news/130878-prolearn-raises-30-crore-pre-seed-to-build-an-ai-tutor-for-indias-k-12-a/)).
- **Embibe (Jio Platforms).** Reliance invested about $180M for 72.69% in 2018. Embibe was absorbed into Jio Platforms in Apr 2025, with about 300 layoffs **[S]** ([TelecomTalk](https://telecomtalk.info/jio-platforms-to-absorb-edtech-firm-embibe/993175/)). Earlier Jio-style school pricing reached "as low as Rs 500 ($6.68) per child per year" against an industry Rs 3,000–4,000 **[S, The Ken 2023]** ([Embibe repost](https://www.embibe.com/in-en/embibe-in-news/reliance-jiofy-edtech-embibe/)). A search snippet says an Embibe AI "assistant teacher" was in background testing in early 2026 and due to reach students about six months later **[U, no primary seen]**.
- **Jio AI Classroom** is a free 4-week AI-literacy course on JioPC with Jio Institute, launched at IMC in Oct 2025. It is **not a tutor**. JioBharat child-safety phones start at ₹799 **[S]** ([ETV Bharat](https://www.etvbharat.com/en/!technology/imc-2025-jio-launches-ai-classroom-course-powered-by-jiopc-and-new-safety-first-jiobharat-phones-enn25100803161)). From memory, Jio users were also given free Google AI Pro under a Reliance–Google deal in late 2025 **[U, not re-verified]**.
- **Airtel** offered free Perplexity Pro for 12 months to 360M subscribers from Jul 2025 **[S]** ([TechCrunch](https://techcrunch.com/2025/07/17/perplexity-sees-india-as-a-shortcut-in-its-race-against-openai)). Reports say the offer closed to new users in Jan 2026 **[S]**. Airtel has no education product.
- **Ola Krutrim.** Kruti launched in Jun 2025 and was pulled in Apr 2026 after reaching "less than 500,000 users worldwide" (SensorTower). Krutrim 3 is halted, and headcount fell from >550 (Aug 2025) to about 150–160 (Mar 2026) **[S]** ([Medianama](https://www.medianama.com/2026/04/223-olas-krutrim-shuts-down-agentic-ai-assistant-kruti/); [Inc42](https://inc42.com/buzz/krutrim-cuts-nearly-half-of-remaining-workforce-in-fresh-layoffs/)). There is no education product. **Do not build on Krutrim models.**

---

## 3. Deep dives: Indic AI vendors and public infrastructure

### 3.1 Sarvam AI

- **Pricing** **[V]** ([sarvam.ai/api-pricing](https://www.sarvam.ai/api-pricing)):

| service | price |
|---|---|
| STT | ₹30/h (real-time, streaming or batch); ₹45/h with diarization |
| TTS (Bulbul) | ₹3 per 1,000 characters |
| Sarvam-105B | ₹29.28 / ₹10.98 / ₹73.20 per M tokens (input / cached / output) |
| Gemma-4 31B | ₹36.60 / ₹13.73 / ₹91.50 |
| translation | ₹0.005 per character |

- **Coverage.** The homepage lists TTS in 11 Indic languages, STT in 12 and translation in 23. Products include Samvaad voice agents (cart recovery, EMI reminders, appointments). **No edtech or school customers are listed** **[V]** ([sarvam.ai](https://www.sarvam.ai/)).
- **Models and company.** Sarvam-30B and 105B MoE (Feb 2026); the *Indus* consumer chatbot beta (Feb 2026); Sarvam-M 24B under Apache 2.0 (May 2025); Saaras v3 STT. It was selected for the IndiaAI Mission sovereign LLM (Apr 2025) and raised a **$234M Series B at $1.5B** led by HCLTech (Jun 2026) **[S]** ([Wikipedia](https://en.wikipedia.org/wiki/Sarvam_AI)).
- **Education footprint.** IIT Madras's *Bodhan AI*, the "sovereign, AI-driven education ecosystem", is being built "in collaboration with Sarvam AI" **[S, headline only]** ([CSR Journal](https://thecsrjournal.in/iit-madras-launched-bodhan-ai-create-sovereign-ai-driven-education-ecosystem-collaboration-with-sarvam-ai/)). This sits with the ₹500 cr Centre of Excellence in AI for Education in Union Budget 2025–26 **[S]** ([Modern Adhyapak](https://modernadhyapak.com/ai-in-indian-classrooms-in-2026/)) and the MoE "Bharat Bodhan AI Conclave", 12–13 Feb 2026 **[V, PIB]** ([PIB](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2234853&reg=3&lang=1)). Sarvam also has a Goa AI Mission CoE (including a Konkani LLM) **[S]** and an ICAI MoU **[S]**.
- **Read.** Sarvam is Taxila's likeliest Indic speech vendor (see `tech-and-market.md` §6). The risk to watch is a **free government tutor** built on Sarvam and Bodhan and shipped through DIKSHA. If that happens, Taxila's B2G path closes and the B2C value has to rest on relationship and quality, not access.

### 3.2 DIKSHA, Bhashini and the government AI stack

- **DIKSHA.** 5Cr+ downloads, 4.1★. AI features: **AskDIKSHA**, which lets users "query the NCERT books" and "easily get concepts cleared", plus Read Aloud **[V]** ([diksha.gov.in](https://diksha.gov.in/); [Play](https://play.google.com/store/apps/details?id=in.gov.diksha.app&hl=en_IN)). PIB describes DIKSHA's AI as "AI-based keyword search in videos and read-aloud feature for visually impaired students" **[V]**. NCERT "used AI/ML to translate Grade 1–2 textbooks into 22 Indian languages" **[V, PIB]**. DIKSHA content licences are non-commercial (CC BY-NC-ND / NC-SA), so Taxila cannot reuse it (see `tech-and-market.md` §8).
- **Bhashini** launched in Jul 2022 and offers 300+ pretrained models through Open Bhashini APIs, with a Digital India Bhashini Division for startup collaboration **[S]** ([Wikipedia](https://en.wikipedia.org/wiki/Bhashini)). I found no education-specific Bhashini deployment for students **[U]**.
- **Policy.** AI and Computational Thinking will be introduced from **Class 3 in 2026–27** **[S]**. CBSE already offers a 15-hour AI module from Class VI **[V, PIB]**. This creates demand for AI-literacy content. It is not a tutoring channel.

### 3.3 ConveGenius (SwiftChat, SwiftPAL)

- **Product.** SwiftChat is a chatbot super-app: "53+ conversational AI chatbots", "13 regional languages" **[S]**. The site lists attendance, assessment, adaptive learning, language (with Google Read Along), maths and science, and GK bots. It is "a free platform for students and teachers", reaching "150M+ children", "15+ states" **[V, vendor]** ([swiftchat.ai](https://swiftchat.ai/)). The Play listing (`ai.convegenius.app`) has **50L+ downloads, 4.1★, 17.4K reviews** and is general-purpose ("learn a new language, get live news and sports updates…") **[V]**.
- **Government deployments** **[V, vendor]** ([ConveGenius impact](https://convegenius.com/impact.html)):
  - Andhra Pradesh: a Doubt Clearance Bot on 5 lakh+ student tablets and 1 lakh+ interactive panels **[S]**.
  - Rajasthan: Mission Buniyaad, 5 lakh girls in about 3,700 schools.
  - Jharkhand: 35,000 schools.
  - Himachal remedial programme: 2 lakh+ students.
  - Also: Wadhwani's ORF integrated into SwiftChat in Gujarat **[V, Wadhwani]**.
- **Evidence.** AP's PAL (Classes 6–9) was evaluated in an RCT by the Development Innovation Lab (Kremer) from 2023 to 2025: 2 × 40-minute maths sessions a week on 30 tablets per school; vendor-reported gains of "2.3×"; "1.9 years of schooling in 17 months"; girls gained more because they used it more; **$20–25 per student per year** including hardware **[S, press]** ([VisionIAS summary of The Hindu](https://visionias.in/current-affairs/upsc-daily-news-summary/article/2025-09-10/the-hindu/society/personalised-adaptive-learning-in-ap-led-to-better-math-learning-outcomes-finds-study)). The vendor cites ₹1,700–2,100 per student per year and ₹500 per student for HP LEP 2.0 **[V, vendor]** ([ConveGenius](https://convegenius.com/india-learning-vaccine.html)). I did not read the DIL paper; I could not locate it before the search budget ran out.
- **Read.** This is the B2G incumbent. It shows states will pay ₹500–2,100 per student per year for adaptive learning backed by evidence. Its products are drill-and-bot, not a relational voice tutor.

### 3.4 Educational Initiatives Mindspark: the evidence bar (not on the brief list, but it sets the benchmark)

- **NBER w34205** (Muralidharan & Singh, Sep 2025) **[V]** ([NBER](https://www.nber.org/system/files/working_papers/w34205/revisions/w34205.rev0.pdf)). Mindspark PAL was built into Rajasthan government school timetables, in a sample "over 20 times larger than the original study". "After 18 months, treated students scored **0.22 [SD] higher in Mathematics and 0.20 higher in Hindi**, a 50–66% productivity increase over the control group. Learning gains were **proportional to student time on the platform**." The original small trial (2019) found 0.23 / 0.37 SD in 4.5 months, in after-school centres.
- **Implication.** Pre-LLM adaptive drills already deliver about 0.2 SD a year and a half at government scale, and dose drives the effect. Taxila's outcome claims must be benchmarked against this, with time-on-task as the first leading indicator. See `learning-science.md` for the global LLM-tutor evidence.

---

## 4. Deep dives: NGOs, labs and teacher-side AI

### 4.1 Rocket Learning: Appu, the only child-facing generative voice tutor at scale

- **Launch.** 21 Mar 2025, for ages 3–6. "Launches with Hindi", 20 languages planned (Marathi, Punjabi). Funded by a $1.5M Google.org grant plus six months of Google.org Fellows' time. Target: 50M families by 2030, through Anganwadis and preschools. Rocket Learning's programmes already reach 3M children **[S]** ([BusinessToday](https://www.businesstoday.in/technology/news/story/rocket-learning-unveils-appu-ai-tutor-with-googleorg-support-aiming-to-reach-50-million-indian-families-by-2030-468765-2025-03-21); [Google India blog](https://blog.google/intl/en-in/transforming-early-childhood-education-with-appu-the-genai-powered-learning-companion/)).
- **Design.** "Voice-first", runs on basic smartphones, "one structured session per day to limit screen time" **[S]**. The character is "a playful, animated elephant" using "rhymes, and hands-on activities". It is **co-used with a caregiver or Anganwadi worker**, covers "200 key learning objectives", and handles dialects such as Marwadi **[S]** ([Rocket Learning](https://rocketlearning.org/empowering-every-childs-learning-journey-with-human-centric-ai/)). It has parental-supervision prompts and restricted themes **[S]**.
- **Traction and evidence.** About 1 lakh users at launch and "thousands" piloting. The evidence is parent anecdotes (shy children starting conversations after about 15 min a day) **[S]**. There is no outcome study. A separate AI worksheet autocorrection tool serves about 1.2M children daily at >90% grading accuracy **[S]**.
- **What Taxila takes from it.** A named animated character, a single daily session, caregiver co-presence and a Hindi-first voice is the design the most credible early-childhood NGO arrived at with Google.org. It is the lower-age version of Taxila's "Didi". It is not a competitor for classes 1–9.

### 4.2 Wadhwani AI

- **Product.** Vachan Samiksha oral-reading-fluency (ORF) assessment, built with Gujarat's education department and running since Jul 2023 inside G-Shala and SwiftChat. 1.2 lakh teachers have assessed 2.5M students in Gujarati across about 30,000 schools. NIPUN benchmarks: Hindi 35–54 correct words per minute **[V]** ([Wadhwani](https://www.wadhwaniai.org/vaachan-samiksha-leveraging-ai-to-bridge-the-literacy-divide/)).
- **Scale.** The homepage shows ORF at 15M+ assessments, 7.9M students, 2 states **[V]** ([wadhwaniai.org](https://www.wadhwaniai.org/)). A Jul 2026 report (with Bridgespan and Google.org) says 27M assessments across 8.5M students, plus a Spoken English Assessment & Practice tool **[S]** ([CIOL](https://www.ciol.com/tech/wadhwani-ai-report-india-ready-to-scale-ai-in-public-education-12137567)).
- **Read.** This is proven **children's read-aloud ASR in Hindi and Gujarati at state scale**. It is the strongest Indian evidence that children's Indic speech assessment works in production. It is a candidate partner or benchmark for Taxila's reading-fluency check in classes 1–3.

### 4.3 Pratham

- **Anthropic partnership** (16 Feb 2026): the "Anytime Testing Machine" (Claude) generates curriculum-aligned tests, digitises handwritten answers, and grades with feedback. Pilots reached 6,000 learners, with 15,000 more planned in 2026. "Tech in TaRL" is an AI teacher-support system with "a randomized controlled trial planned for several thousand students". No voice is mentioned **[V]** ([Pratham](https://www.pratham.org/2026/02/16/pratham-partners-with-anthropic-to-enable-ai-learning-tools-for-learners/)).
- **Other.** BaalSakhi, a WhatsApp chatbot for early-childhood guidance **[S]**, and a "PadhAI platform" cited by Wadhwani's report **[S]**.
- **Read.** The upcoming Tech-in-TaRL RCT will be the first rigorous Indian evidence on LLM-assisted *teaching at the right level*. Track it. TaRL's level-grouping logic matches Taxila's diagnostic placement.

### 4.4 Khan Academy India / Khanmigo

- **Teachers.** Khanmigo has been free for all teachers in India since 14 Nov 2024, in English and Hindi **[S]** ([ScooNews](https://scoonews.com/news/khan-academy-launches-khanmigo-ai-tool-for-teachers-in-india/)). Marathi was added in Dec 2025 alongside Odia. In Maharashtra 1.8 lakh students are active and 10 lakh registered across 30,000+ government schools, supported by Shell and Cognizant Foundation **[S]** ([Live Nagpur](https://thelivenagpur.com/2025/12/09/khan-academy-launches-free-ai-teaching-assistant-khanmigo-in-marathi-for-teachers-in-maharashtra/)).
- **Learners.** $4/mo or $44/yr, with a family plan and moderation alerts. India is not named on the pricing page **[V]** ([Khanmigo pricing](https://www.khanmigo.ai/pricing)). Indian users are asking for localised student access **[S]** ([KA community](https://support.khanacademy.org/hc/en-us/community/posts/38569868648205-Bring-Khanmigo-to-Indian-Students)).
- **Reach.** The Khan Academy app has 1Cr+ downloads, 4.4★ **[V, Play]**.
- **Read.** Khan has the trust and the NCERT-aligned content but no student-facing AI tutor in India, and its tutor is text-first. If Khan turned on free Khanmigo for Indian students in Hindi, that would be the largest single change to Taxila's market **[U, watch item]**.

### 4.5 Microsoft Research India: Shiksha Copilot

- **Deployment.** Karnataka government schools, classes 5–10. English and Kannada lesson plans are co-created by 23 curators with AI, then customised by teachers. The mixed-methods study covers **1,043 teachers** in **757 schools across 35 districts**. Teachers **saved 2.02 h a week** on lesson planning (σ = 4.1). 0.34% of plans were unusable because of technical errors. The stack is GPT-4o, Azure AI Search and Azure Form Recognizer. The tool also "lowered teaching-related stress" and shifted teaching toward activity-based pedagogy, but staffing shortages limited wider change **[V]** ([arXiv 2507.00456](https://arxiv.org/pdf/2507.00456v2)). Further coverage: [MSR blog](https://www.microsoft.com/en-us/research/blog/teachers-in-india-help-microsoft-research-design-ai-tool-for-creating-great-classroom-content/), [GKToday](https://www.gktoday.in/karnataka-launches-ai-tool-shiksha-copilot-for-teachers/).
- **Read.** This is teacher-side, not a competitor. Two design lessons carry over: human-curated base content plus AI customisation keeps errors low, and lesson plans built from NCERT-chapter "blocks" are a workable content unit.

### 4.6 Teacher and student adoption context

- About 70% of Indian teachers use AI tools for lesson planning (2025 CENTA survey). About 50% of Delhi private-school students use GenAI several times a week. 57.2% of schools had computers and 53.9% had internet in 2023–24 **[S, aggregated]** ([Modern Adhyapak](https://modernadhyapak.com/ai-in-indian-classrooms-in-2026/)).

---

## 5. Cross-cutting analysis

### 5.1 Hindi voice capability: who actually has it

| player | Hindi voice in | Hindi voice out | children-tuned | evidence quality |
|---|---|---|---|---|
| PW Ask AI / AI Tutor | yes (voice bot) | **own TTS, 1,000 h of teacher voice** | aimed at teens | **[V]** that it exists; quality untested |
| YoLearn | claimed | claimed (22 languages) | aimed at 9–12 | **[S]** |
| SpeakX | Hindi scaffolding | yes | adults/teens | **[S]** |
| Rocket Learning Appu | yes | yes | **ages 3–6** | **[S]** |
| Wadhwani ORF | **children's read-aloud ASR, Gujarati/Hindi** | n/a | **yes, at state scale** | **[V]** |
| Khanmigo | text (Hindi) | none in India found | no | **[S]** |
| DIKSHA | Read Aloud | TTS | no | **[V]** |
| Sarvam (vendor) | 12 languages STT | 11 languages TTS | not child-specific | **[V]** pricing; vendor-run benchmarks |

**Takeaway.** No one has shown a **Hindi-English, full-duplex voice tutor tuned for children aged 6–12**. The nearest are Appu (younger, voice-first, simple turns) and PW (older, test prep, its own TTS). The Delhi ChatFriend study is the only published look at Indian children using a voice LLM. It found ASR failures on Hindi-accented English, mic-UX problems for about 35% of children, and replies pitched about 10 grade levels too high **[V]** ([arXiv 2601.19304](https://arxiv.org/html/2601.19304v2)).

### 5.2 Price ladder (₹ per month to the family)

| offer | ₹/mo | what you get | tag |
|---|---|---|---|
| ChatGPT Go (free year, from Nov 2025); Google AI Plus for students (free year, redeem by 31 Dec 2026) | 0 | general assistant, 13+/18+ | **[S]**/**[V]** |
| DIKSHA, SwiftChat, Khan Academy | 0 | content, bots, exercises | **[V]** |
| SpeakX | **299** | AI voice English coach | **[S]** |
| PW online batch (ARPU ₹4,104/yr) | **≈342** | live and recorded lectures plus AI Guru / Ask AI | **[S]** |
| Khanmigo learner ($4) | ≈384 | text Socratic tutor (India not listed) | **[V]** |
| YoLearn token plans | unknown; IAP ₹4–18,000 per item | voice tutor, sketchpad | **[V]** range |
| CuriousJr Power Batch class 6 (₹30,000/yr; "₹2,155/mo" on EMI) | **≈2,155–2,500** | live 2-teacher tuition, batches of 400–500 | **[V]** |
| Local private tutor (Hindi belt, classes 1–8) | not measured here | 1:1 or small group | see `tech-and-market.md` |

The market has two clear anchors: **₹299–350/mo** for app-only AI and **₹2,000–2,500/mo** for live human tuition. Taxila's ₹299–699 band sits on the AI anchor. To justify the upper end it needs visible human-like teaching and parent reporting, with CuriousJr as the comparison point.

### 5.3 Unit economics: what a voice hour costs

This is my calculation using Sarvam list prices **[V]**. Assumptions per tutoring hour:
- STT: ₹10 (only the child's turns sent, with voice-activity detection) to ₹30 (always streaming).
- Tutor talk time: 25–35 min at 130–150 Hinglish words per minute, about 5.5 characters per word.
- Sarvam-105B: 60–120 turns at ~4k input tokens each (75% cached) and 200 output tokens.

| scenario | STT | TTS | LLM | **₹/h** | **$/h** | TTS share | 5 h/mo | 20 h/mo |
|---|---|---|---|---|---|---|---|---|
| low | 10 | 53.6 | 4.6 | **68** | 0.71 | 79% | ₹341 | ₹1,365 |
| mid | 30 | 69.3 | 6.9 | **106** | 1.11 | 65% | ₹531 | ₹2,124 |
| high | 30 | 86.6 | 9.2 | **126** | 1.31 | 69% | ₹629 | ₹2,517 |
| **PW claim** | | | | **≈19** | **0.20** | | ₹96 | ₹384 |
| PW sales voice bots (₹2.7/min) **[V]** | | | | 162 | 1.69 | | | |

**Implications**
1. On API TTS, **₹299/mo covers about 3–4 live voice hours** before any other cost. PW can offer about 15.
2. TTS is the dominant cost. The levers, in order:
   - (a) pre-render and cache curriculum narration (deterministic lesson segments) so only the dynamic turns are synthesised live;
   - (b) shorter tutor turns, which also fixes the reading-level problem in §5.1;
   - (c) an open or self-hosted Indic TTS for routine turns, with premium TTS kept for the "Didi" voice;
   - (d) a metered "live call" mode alongside unlimited text and interactive mode.
3. A speech-to-speech realtime path (see `tech-and-market.md` §1) is a separate cost curve. This table covers only the cascade.

### 5.4 Learning-outcome evidence in India

| intervention | design | result | tag |
|---|---|---|---|
| Mindspark PAL, Rajasthan govt schools | RCT, 18 months, 20× the original sample | +0.22 SD maths, +0.20 SD Hindi; gains ∝ time on platform | **[V]** |
| AP PAL (ConveGenius), classes 6–9 | RCT (DIL, Kremer), 17 months, ~14,000 students in 120 schools **[S]** | "1.9 yrs of schooling in 17 months", "2.3×"; $20–25 per student per year | **[S]** |
| PW AI Tutor beta | 300+ students, 1,000+ queries | 95% lesson accuracy, <1% hallucination; **no outcome measure** | **[S]** |
| Appu | pilot | parent anecdotes | **[S]** |
| ChatFriend (Delhi, voice LLM) | 6-day qualitative, n=23 | student-initiated questions 36% → 65%; English-dominant speech 29% → 77%; no pre/post test | **[V]** |
| Pratham Tech-in-TaRL | RCT *planned* | none yet | **[V]** |

**No Indian generative-AI tutor has an RCT showing learning gains.** Taxila could be the first to publish one. That would be a moat in parent trust and in B2G procurement, where states already buy PAL on RCT evidence.

### 5.5 Distribution channels that are working

| channel | who uses it | evidence |
|---|---|---|
| YouTube teacher brand → app funnel | PW: YouTube views +58% YoY; ">91% of our paid learners engage with us through online channels" | **[V]** |
| State procurement of tablets and ICT labs | ConveGenius, Mindspark; target "all 1.2 lakh ICT labs" | **[V, vendor]** |
| **Publisher textbooks → AI tutor** | YoLearn × ABP (Headword, KIPS) for 2026–27 | **[S]** |
| WhatsApp, low-literacy parents | Appu, BaalSakhi, SwiftChat bots | **[S]** |
| Celebrity and performance marketing, one-day CAC payback | SpeakX (MS Dhoni) | **[S]** |
| Telco bundles | Airtel–Perplexity, Jio–Embibe / AI Classroom | **[S]** |

---

## 6. White space for Taxila (ranked by confidence)

1. **An AI-first Hindi-English voice tutor for classes 1–8 at about ₹299–699/mo** *(high confidence that it is unserved today)*.
   - PW serves these classes with human mega-batches (CuriousJr) at about ₹2,155–2,500/mo.
   - YoLearn's usage is grades 9–12.
   - Big-tech assistants are 13+.
   - Government AI is assessment and teacher-side.
   - Appu stops at age 6.
2. **Interactive and experiential multimodal content tied to NCERT/NCF-SE chapters** *(high)*. No Indian player shows simulations or games generated or selected per chapter. YoLearn has a sketchpad and diagrams. PW has books and video. ConveGenius has drills.
3. **Covert understanding checks plus re-teaching in a different modality** *(medium-high)*. PW's AI Tutor claims memory of mistakes, but its stated metrics are answer accuracy, not understanding. PAL systems re-sequence drills but do not change explanation modality. Learning-science support is in `learning-science.md`.
4. **A relational and safety layer for under-13s** *(medium)*. PW, YoLearn and Appu all use "companion" framing, so warmth alone will not differentiate. What could: under-13 safety by design (DPDP verifiable parental consent, no data retention by default, caregiver co-presence like Appu), plus **parent reports in Hindi voice**.
5. **Published outcome evidence** *(high value, slow)*. A pre-registered RCT or quasi-experiment against the Mindspark bar (~0.2 SD per 18 months) would be unique among Indian AI tutors. It would also open state procurement at the ₹500–2,100 per student per year price point.
6. **State boards and Hindi-medium (RBSE first)** *(medium)*. PW doubled its state-board business and went from 7 to 14 states, so the demand is proven. But PW is moving fast here and the window is short.

## 7. Threats, and what would change these conclusions

| threat | likelihood (12 mo) | what would confirm it | what Taxila does |
|---|---|---|---|
| PW ships the AI Tutor inside CuriousJr / Foundation (classes 3–8) at about ₹10/day | **high** | PW Q2 FY27 letter (≈Nov 2026) reports AI Tutor revenue or K-8 availability | compete on child-tuned UX, interactives, outcomes evidence, trust; do not compete on price per hour |
| Khan Academy opens free Hindi Khanmigo to Indian students | medium | KA India announcement; Khanmigo pricing page lists India | become the "voice plus your exact textbook chapter" layer; consider partnering |
| Free government tutor (Bodhan AI / Sarvam / AskDIKSHA) for government schools | medium | MoE/IIT-M launch of a student tutor on DIKSHA | focus on private-school and low-fee-private B2C; offer B2G only with RCT evidence |
| YoLearn's publisher channel captures 25,000 schools | medium | Headword.ai / kipslearning.ai live with usage numbers | stay B2C-first; treat publishers as a channel Taxila can also court |
| Big-tech kid modes (Gemini in Classroom for all ages, Aug 2026) | medium | Gemini or ChatGPT consumer apps lowering the age floor in India | safety plus curriculum plus Hindi voice is the moat; generic assistants cite no NCERT pages |
| Jio bundles Embibe AI tutor free with JioBharat / JioTV | low-medium | Embibe student-facing AI launch | same as above |

**Reversal conditions for the white-space claims**
- If a teardown (§8) shows **YoLearn's or PW's Hindi voice already handles 8-year-olds well** (low ASR error, short turns, warm register), white-space claim 1 weakens to an execution race.
- If PW's AI Tutor launches for **classes 1–8 at ≤₹349/mo**, Taxila's price band is squeezed and differentiation has to come from claims 2–5.

## 8. What to measure next (cheap, decisive)

1. **Hands-on teardown, 1 day.** Install YoLearn, PW (Ask AI / AI Guru; the AI Tutor if live), SpeakX and SwiftChat. Run the same 10 scripted Hinglish child utterances recorded by 2–3 children aged 7–11 (with consent). Score:
   - ASR correctness;
   - time to first audio;
   - reply length and reading level;
   - whether the product checks understanding or just answers;
   - interruptibility (barge-in);
   - price per hour once free tokens run out.

   This is the only way to move the voice-quality cells in §5.1 from [S] to [V].
2. **PW Q2 FY27 shareholder letter (≈Nov 2026).** Has the AI Tutor launched, at what price, for which grades, with what usage?
3. **Read the DIL Andhra Pradesh PAL paper** (Kremer et al.) for SD effect sizes and dose. It is cited here only through the vendor and press.
4. **YoLearn real plan prices.** Read them from the in-app paywall. The web page renders no INR figures.
5. **SpeakX cohort retention by language.** If Hindi-speaking users retain better than others, that supports Hindi-first.
6. **Price test.** ₹299 versus ₹499 versus ₹699 with 5 h/mo of live voice, against the CuriousJr ₹2,155/mo anchor, using landing-page smoke tests in UP and Rajasthan.

---

## Sources (all accessed 2026-10-02)

**PhysicsWallah**
- Q4 FY26 shareholder letter (primary): https://www.medianama.com/wp-content/uploads/2026/05/PhysicsWallah-Q4-shareholder-letter.pdf
- Q4 FY26 earnings-call transcript, BSE filing (primary): https://www.bseindia.com/xml-data/corpfiling/AttachHis/e79d6f62-6a34-4be4-bdf3-1403a853ab7f.pdf
- Q1 FY27 transcript summary: https://www.investing.com/news/transcripts/earnings-call-transcript-physicswallah-q1-2027-revenue-rises-24-as-online-gains-93CH-4861014
- AI tutor beta metrics: https://www.medianama.com/2026/08/223-physicswallah-personal-ai-tutoring-services/
- K-12 U-turn: https://www.medianama.com/2026/05/223-physicswallah-u-turn-school-ai-for-growth-q4-fy26/
- PW versus OpenAI and Google: https://www.businesstoday.in/technology/story/why-physicswallah-believes-it-can-beat-openai-google-in-indias-ai-tutor-race-534212-2026-06-01
- Alakh AI launch: https://inc42.com/buzz/physics-wallah-rolls-out-ai-education-suite-garners-1-5-mn-users/
- Gyan Guru: https://www.microsoft.com/en-in/aifirstmovers/physicswallah
- MSR collaboration: https://www.microsoft.com/en-us/research/blog/microsoft-research-and-physics-wallah-team-up-to-enhance-ai-based-tutoring/
- CuriousJr: https://www.curiousjr.com/in/school-curriculum , https://www.pw.live/curious-jr/batches/power-batch-class-6th-[school-jee-neet]-2026-||-f0611eb-950941 , https://www.trustpilot.com/review/www.curiousjr.com
- Wikipedia: https://en.wikipedia.org/wiki/Physics_Wallah

**YoLearn**
- https://play.google.com/store/apps/details?id=com.yolearn.student&hl=en
- https://www.yolearn.ai/students/pricing
- https://www.indianstartuptimes.com/investment/yolearn-ai-raises-500k-pre-seed-funding-to-expand-voice-first-ai-tutoring-platform/
- https://www.republicworld.com/initiatives/abp-education-invests-in-yolearnai-to-expand-personalized-learning-for-250-million-indian-students-noida-3rd-september-2026-2026-09-05-136388
- https://tracxn.com/d/companies/yolearn/__YrMAqnT7McBQ5ivbe6yHM6US9d6V3lkxwsWCKaVr_G8

**SpeakX**
- https://www.outlookbusiness.com/corporate/speakxai-raises-16-mn-from-westbridge-capital-eyes-regional-language-expansion-amid-profitable-growth
- https://inc42.com/buzz/exclusive-ms-dhoni-joins-edtech-startup-speakxs-cap-table/
- https://www.elevationcapital.com/perspectives/speakx-building-india-largest-ai-language-learning-app

**Other commercial**
- ProLearn: https://dealroom.co/news/130878-prolearn-raises-30-crore-pre-seed-to-build-an-ai-tutor-for-indias-k-12-a/
- Embibe and Jio: https://telecomtalk.info/jio-platforms-to-absorb-edtech-firm-embibe/993175/ , https://www.embibe.com/in-en/embibe-in-news/reliance-jiofy-edtech-embibe/
- Jio AI Classroom: https://www.etvbharat.com/en/!technology/imc-2025-jio-launches-ai-classroom-course-powered-by-jiopc-and-new-safety-first-jiobharat-phones-enn25100803161
- Airtel and Perplexity: https://techcrunch.com/2025/07/17/perplexity-sees-india-as-a-shortcut-in-its-race-against-openai , https://lumichats.com/blog/perplexity-ai-free-airtel-india-2026-review-activate
- Krutrim: https://www.medianama.com/2026/04/223-olas-krutrim-shuts-down-agentic-ai-assistant-kruti/ , https://inc42.com/buzz/krutrim-cuts-nearly-half-of-remaining-workforce-in-fresh-layoffs/ , https://restofworld.org/2026/india-frugal-ai-sarvam-krutrim-sovereign/
- ChatGPT Go free in India: https://techcrunch.com/2025/10/27/openai-offers-free-chatgpt-go-for-one-year-to-all-users-in-india
- Google AI Plus for students: https://blog.google/intl/en-in/products/start-the-academic-year-with-one-year-of-gemini-on-us/

**Vendors and government**
- Sarvam: https://www.sarvam.ai/api-pricing , https://www.sarvam.ai/ , https://en.wikipedia.org/wiki/Sarvam_AI , https://thecsrjournal.in/iit-madras-launched-bodhan-ai-create-sovereign-ai-driven-education-ecosystem-collaboration-with-sarvam-ai/ , https://en.wikipedia.org/wiki/Goa_AI_Mission_2027
- PIB, AI in Education: https://www.pib.gov.in/PressReleasePage.aspx?PRID=2234853&reg=3&lang=1
- DIKSHA: https://diksha.gov.in/ , https://play.google.com/store/apps/details?id=in.gov.diksha.app&hl=en_IN
- Bhashini: https://en.wikipedia.org/wiki/Bhashini
- Policy aggregate: https://modernadhyapak.com/ai-in-indian-classrooms-in-2026/ , https://thenewsmill.com/2026/09/india-integrates-ai-into-education-amid-evolving-teacher-student-roles/

**NGOs, labs and evidence**
- ConveGenius: https://swiftchat.ai/ , https://convegenius.com/impact.html , https://convegenius.com/india-learning-vaccine.html , https://convegenius.com/pal-works-coalition.html , https://play.google.com/store/apps/details?id=ai.convegenius.app
- AP PAL RCT press: https://visionias.in/current-affairs/upsc-daily-news-summary/article/2025-09-10/the-hindu/society/personalised-adaptive-learning-in-ap-led-to-better-math-learning-outcomes-finds-study , https://www.idreameducation.org/blog/michael-kremer-on-andhra-pradesh-pal-study/
- Mindspark at scale: https://www.nber.org/system/files/working_papers/w34205/revisions/w34205.rev0.pdf
- Rocket Learning: https://www.businesstoday.in/technology/news/story/rocket-learning-unveils-appu-ai-tutor-with-googleorg-support-aiming-to-reach-50-million-indian-families-by-2030-468765-2025-03-21 , https://blog.google/intl/en-in/transforming-early-childhood-education-with-appu-the-genai-powered-learning-companion/ , https://rocketlearning.org/empowering-every-childs-learning-journey-with-human-centric-ai/ , https://rocketlearning.org/the-future-of-early-learning-ai-chat-buddies-as-caregiver-allies/
- Wadhwani AI: https://www.wadhwaniai.org/vaachan-samiksha-leveraging-ai-to-bridge-the-literacy-divide/ , https://www.wadhwaniai.org/ , https://www.ciol.com/tech/wadhwani-ai-report-india-ready-to-scale-ai-in-public-education-12137567
- Pratham: https://www.pratham.org/2026/02/16/pratham-partners-with-anthropic-to-enable-ai-learning-tools-for-learners/
- Khan Academy: https://www.khanmigo.ai/pricing , https://scoonews.com/news/khan-academy-launches-khanmigo-ai-tool-for-teachers-in-india/ , https://thelivenagpur.com/2025/12/09/khan-academy-launches-free-ai-teaching-assistant-khanmigo-in-marathi-for-teachers-in-maharashtra/ , https://play.google.com/store/apps/details?id=org.khanacademy.android
- Shiksha Copilot: https://arxiv.org/pdf/2507.00456v2 , https://www.microsoft.com/en-us/research/blog/teachers-in-india-help-microsoft-research-design-ai-tool-for-creating-great-classroom-content/ , https://www.gktoday.in/karnataka-launches-ai-tool-shiksha-copilot-for-teachers/
- Voice chatbot study, Delhi schools: https://arxiv.org/html/2601.19304v2

## Fact-check

Adversarial pass, 2026-10-02. Verdicts: supported / partly / unsupported / wrong. "Unsupported" = could not confirm in this pass (web-search budget was exhausted, so several secondary claims were not independently re-sourced).

| # | Claim | Verdict | Corrected value | Source |
|---|---|---|---|---|
| 1 | PW AI stack: Aryabhata 20B/~3B active, 10x/7x cost; ConceptGuru 10x cheaper than GPT-4o mini; Awaaz 1000 hrs; Ask AI 3.05M+ doubts 91%; AI Guru 99.45M+; 3.3M DAU; 104 min | Partly | All numbers match the Q4 FY26 letter. Caveats: 3.3M DAU and 104 min are FY26 PW app+web averages (not AI users); metrics are as of 31 Mar 2026; "104 Min+" | https://www.medianama.com/wp-content/uploads/2026/05/PhysicsWallah-Q4-shareholder-letter.pdf (read locally) |
| 2a | AI Tutor "will remember all of your past mistakes… six months before"; ARPU <INR4,000 = INR10/day | Supported | Verbatim in the 27 May 2026 call transcript (filed 3 Jun 2026) | https://www.bseindia.com/xml-data/corpfiling/AttachHis/e79d6f62-6a34-4be4-bdf3-1403a853ab7f.pdf |
| 2b | PW says "no plans to run schools" | Wrong | That was the analyst's wording. Management replied "we are already running schools", moving to asset-light, "couple of brownfield tie-ups" taking over sick schools, single-digit count, <1% revenue. "No M&A capital in K-12" is supported | same |
| 3 | AI Tutor beta 95% accuracy, <1% hallucination, 1.8-2.2s, 300+ students/1,000+ queries, ~$0.20/h, launch Q2 FY27 | Supported | Matches Medianama. These are company-reported (not independent); the Rs19/h conversion is the author's own | https://www.medianama.com/2026/08/223-physicswallah-personal-ai-tutoring-services/ |
| 4 | CuriousJr: 400-500 batches, master teacher + mentor, bilingual; Power Batch Rs30,000 (35,000), Rs2,155/mo EMI; +67% enrolments, +150% collections; Play 50L+/4.7 | Partly | Batch size, dual-teacher, bilingual, +67%/+150% confirmed. Price confirmed but the fetched page is the 2025-26 listing (class start 6 Apr 2025), not 2026-27. Play figures not re-checked. Note the Q4 call also cited ~4x CuriousJr revenue jump (FY26) | https://www.curiousjr.com/in/school-curriculum ; https://www.pw.live/curious-jr/batches/power-batch-class-6th-[school-jee-neet]-2026-||-f0611eb-950941 ; https://www.investing.com/news/transcripts/earnings-call-transcript-physicswallah-q1-2027-revenue-rises-24-as-online-gains-93CH-4861014 |
| 5 | YoLearn Play: 100k+, 4.2, 375 reviews, updated 19 Sep 2026; IAP Rs4-18,000; 200k users; 22 languages incl Hinglish; sketchpad; grades 9-12; ABP stake, Headword.ai, kipslearning.ai | Partly | Play confirmed: 100K+, 4.23 from 375 ratings, updated Sep 19 2026 (IAP range not confirmed). ABP equity stake, 22 languages, diagrams/sketching, Headword/kips for 2026-27 confirmed. Not confirmed: 200k users, Hinglish, avatars, grade 9-12 skew | https://play.google.com/store/apps/details?id=com.yolearn.student&hl=en ; https://www.republicworld.com/initiatives/abp-education-invests-in-yolearnai-to-expand-personalized-learning-for-250-million-indian-students-noida-3rd-september-2026-2026-09-05-136388 |
| 6 | SpeakX: Rs299/mo, ~2 lakh paid, FY26 Rs45cr (FY27 70-80cr), EBITDA+, ~30% monthly retention, "no human touchpoint", Hindi 80% to ~half | Partly | ~200k paid, FY26 Rs45cr, FY27 Rs70-80cr, EBITDA+, ~30% retention confirmed (Inc42). Outlook Business says 70% of users Hindi-speaking, and EBITDA+ since Apr 2025; the "80% to about half" shift, Rs299 and 35% at month 3 not confirmed. "Minimal human intervention" not "no human touchpoint" | https://inc42.com/buzz/exclusive-ms-dhoni-joins-edtech-startup-speakxs-cap-table/ ; https://www.outlookbusiness.com/corporate/speakxai-raises-16-mn-from-westbridge-capital-eyes-regional-language-expansion-amid-profitable-growth |
| 7 | Mindspark Rajasthan: +0.22 SD maths, +0.20 SD Hindi at 18 months; gains proportional to time; no Indian GenAI tutor outcome evidence | Partly | Effects and quote confirmed (NBER w34205; 40 treated + 40 control schools, ~6,500 students, 4 districts; "50-66% productivity increase"). "No Indian generative-AI tutor has published outcome evidence" is a negative universal, not verifiable: unsupported | https://www.nber.org/system/files/working_papers/w34205/revisions/w34205.rev0.pdf (read locally) |
| 8 | Sarvam prices STT Rs30/h, TTS Rs3/1k chars, 105B Rs29.28/Rs73.20 per M; cascaded cost Rs68-126/h; 3.5-6.5x PW's Rs19/h; TTS 65-80%; Rs299 covers 3-4 h | Partly | List prices confirmed exactly. Cost model not re-derived here (author's assumptions); ratios depend on chars/hour assumption and an FX rate. PW's $0.20/h is a company claim of unknown scope. Treat as [U] | https://www.sarvam.ai/api-pricing |
| 9 | Delhi voice-LLM study (n=23, 6 days, Whisper/GPT-4o-mini/Google TTS, ~35% mic help, FK grade 12 vs grade 2) | Supported | Confirmed. Nuance: ASR errors were mainly proper nouns and Hindi loanwords; FK 12 applies to English output; students' utterances graded ~2, 85% CEFR A1 | https://arxiv.org/html/2601.19304v2 |
| 10 | Rocket Learning Appu: launched 21 Mar 2025, only child-facing GenAI voice tutor at scale, 3-6, Hindi first, 20 languages, elephant, ~1 lakh users at launch, $1.5M Google.org, no outcome study | Partly | Ages 3-6, Hindi first, 20 languages planned, $1.5M Google.org confirmed. "Only ... at scale", 1 lakh users, elephant and "no outcome study" not confirmed (superlative: unsupported). Target is 50M families by 2030 | https://www.businesstoday.in/technology/news/story/rocket-learning-unveils-appu-ai-tutor-with-googleorg-support-aiming-to-reach-50-million-indian-families-by-2030-468765-2025-03-21 |
| 11 | Public/NGO AI: Wadhwani 15M+/7.9M/2 states; Shiksha Copilot 1,043 teachers/757 schools/2.02h; Pratham 6,000 learners + RCT planned; AskDIKSHA; Khanmigo free for teachers in India, $4 learner plan, India not listed | Partly | Pratham confirmed (6,000 learners, 15,000 more planned 2026, RCT "several thousand students", powered by Claude). Khanmigo $4/mo ($44/yr) and "free for teachers" confirmed; India-specific teacher access and India exclusion not on pricing page. Wadhwani, Shiksha Copilot, AskDIKSHA not re-checked | https://www.pratham.org/2026/02/16/pratham-partners-with-anthropic-to-enable-ai-learning-tools-for-learners/ ; https://www.khanmigo.ai/pricing |
| 12 | ConveGenius: AP PAL ~1.9 "years of schooling" in 17 months at $20-25; Rs1,700-2,100; Rs500 HP; SwiftChat 50L+, 4.1 | Partly | Rs1,700-2,100/student/yr and Rs500 HP confirmed (vendor page). Vendor says "2 equivalent years in 17 months"; 1.895 is LAYS per $100 invested (GEEAP "Good Buy"), not years of schooling: wrong unit. $20-25 and Play stats not re-checked | https://convegenius.com/india-learning-vaccine.html |
| 13 | Sarvam: no edtech customers; TTS 11, STT 12 languages; $234M at $1.5B Jun 2026; Bodhan AI Rs500cr | Partly | Languages (11/12), no edtech logos on homepage, $234M Series B at $1.5B in Jun 2026 (HCLTech $150M lead) confirmed. Bodhan AI with Sarvam confirmed by headline; Rs500cr budget not confirmed. "No edtech customers" = none listed, not none | https://www.sarvam.ai/ ; https://en.wikipedia.org/wiki/Sarvam_AI ; https://thecsrjournal.in/iit-madras-launched-bodhan-ai-create-sovereign-ai-driven-education-ecosystem-collaboration-with-sarvam-ai/ |
| 14 | Krutrim: Kruti shut (<500k users), Krutrim 3 halted, staff 550 to 150-160, cloud pivot; Embibe absorbed into Jio Apr 2025, ~300 layoffs, Rs500/child/yr; Airtel Perplexity reached 360M subscribers | Partly | Kruti shut down, Krutrim 3 suspended, cloud struggling confirmed; "<500k" is downloads not users; Medianama cites ~200 layoffs in 2025, the 550 to 150-160 figure unconfirmed. Embibe: ~300 laid off, absorption by Jio Platforms described as under due diligence in that article (Apr 2025 date and Rs500 unconfirmed). Airtel: 360M is the eligible base for a free 12-month Pro offer, not subscribers reached: wrong framing | https://www.medianama.com/2026/04/223-olas-krutrim-shuts-down-agentic-ai-assistant-kruti/ ; https://telecomtalk.info/jio-platforms-to-absorb-edtech-firm-embibe/993175/ ; https://techcrunch.com/2025/07/17/perplexity-sees-india-as-a-shortcut-in-its-race-against-openai |
