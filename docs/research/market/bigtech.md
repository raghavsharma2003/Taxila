# Big tech in education AI, 2025–2026: can Google, OpenAI, Anthropic, Microsoft or Meta kill Taxila?

**Date:** 2026-10-02. **Scope:** what the five largest AI platforms shipped for learners in 2025–2026, what they can legally and commercially reach in India, and where Taxila (classes 1–9, ages ~6–15, CBSE/NCERT plus RBSE and other state boards, Hindi-English voice tutor) can and cannot hold ground.
**Companion docs (not repeated here):** `../tech-and-market.md` §5 (global competitor table), `india-ai-native.md` (PW, YoLearn, Appu, Sarvam), `india-incumbents.md`, `../learning-science.md` (RCT evidence), `../safety/dpdp-deep.md` and `../safety/global-child-law.md` (law).

**Evidence tags.** **[V]** = read at the primary source in this session (vendor page, terms of service, paper). A [V] on a vendor page means *the vendor says so*, not that it is true. **[S]** = secondary (TechCrunch, Wikipedia, other docs in this repo that cite secondary sources). **[U]** = unverified: memory, inference, or my judgement. Every probability below is **[U, judgement]**.

**Method and limits.** The session's web-search budget was already used up when this task started (0 searches available), so I worked by direct page fetches: about 75 fetches of vendor blogs, help centres, terms of service, arXiv abstracts, and TechCrunch tag-index pages. I used the tag indexes to find dated 2025–2026 articles. **openai.com, help.openai.com, reuters.com, theverge.com, web.archive.org and pib.gov.in returned 403 or were unreachable.** So every OpenAI product fact here is **[S]** via TechCrunch, and OpenAI's API policy on minors is **[U]**. I did not use any product as a child would, so nothing here measures quality for children.

---

## 0. The findings that matter for Taxila

1. **Generic AI study help is already free at the scale of a billion users, so do not build a business on it.** ChatGPT has ~1B weekly users and gave free users **unlimited text chats** on 2026-08-06; voice stays metered **[S]** ([TC](https://techcrunch.com/2026/08/06/openai-brings-unlimited-chatgpt-text-chats-to-free-users/)). "More than **140 million** people use ChatGPT each week for help with math and science" **[S]** ([TC](https://techcrunch.com/2026/03/10/chatgpt-can-now-create-interactive-visuals-to-help-you-understand-math-and-science-concepts/)). Already shipped and free: Socratic study modes (OpenAI study mode Jul 2025, Gemini Guided Learning Aug 2025, Claude learning mode Apr 2025, Copilot Study and Learn 2026), flashcards and quizzes, practice exams, interactive visuals for 70+ topics, and textbook-to-podcast or textbook-to-video tools.
2. **The under-13 wall is real for four of the five, but Google has already crossed it.** ChatGPT is 13+, and ChatGPT for Teens (2026-08-18) is a teen product **[S]**. Claude's consumer app is **18+** **[V]**. Microsoft's Copilot Chat "is not available for students under 13" **[V]**. WhatsApp's pre-teen accounts have **no Meta AI** **[S]**. Google is the exception:
   - The Gemini app works for under-13s **with a parent's approval** **[V]**.
   - From **2026-08-10, Gemini in Google Classroom is on by default for "K-12 … students of all ages"**, rolled out globally. Admins have to build a separate org unit to switch it off for under-18s **[V]** ([Workspace Updates](https://workspaceupdates.googleblog.com/2026/08/gemini-in-google-classroom-is-expanding-to-users-of-all-ages-with-contextualized-Gemini-starter-prompts-for-students.html)).
   - So `india-ai-native.md` finding 8 ("under-13s are structurally unserved by big tech") is **only partly right**. They are unserved by a *curriculum tutor built for children*. They are not unserved by big-tech AI.
3. **Google is the only credible "killer", because it already owns every component of Taxila:**
   - the pedagogy model: LearnLM, preferred by experts **+31% over GPT-4o** **[V]**, and Gemini 2.5 Pro, preferred in **73.2%** of arena matchups **[V]**;
   - textbook-to-personalised-multimodal content: Learn Your Way, **+11 pp retention, n=60, ages 15–18** **[V]**;
   - narrated video and audio lessons: NotebookLM, Classroom audio lessons **[V]**/**[S]**;
   - Hindi reading ASR on children's speech: Read Along "Diya", English plus 7 Indic languages, offline on 1 GB phones, in UP/Telangana/Gujarat state programmes **[V]**;
   - Android and Play distribution, a Jio bundle (AI Pro free for 18 months **[S]**), and **118M Indian Gemini MAU** **[S]**;
   - and Google says India has "the highest global usage of Gemini for learning" **[S]** ([TC](https://techcrunch.com/2026/01/29/india-is-teaching-google-how-ai-in-education-can-scale/)).
   - What Google has *not* done is put these together into one child-facing, curriculum-mapped, voice-first tutor that answers to parents.
4. **Big tech's stated position is "augment the teacher, never replace".** Google's education GM: "The teacher-student relationship is critical. We're here to help that grow and flourish, not replace it" **[S]**. Microsoft: "Educators remain in control and at the center" **[V]**. This is partly politics and partly liability, and it leaves the "results-accountable private-tutor substitute" position open. 27% of Indian students already pay for private coaching **[S, NSS CMS 2025 via `design/parent-experience.md`]**. "Replace the tuition teacher" is a sharper and safer claim than "replace teachers" **[U, inference]**.
5. **Big tech's own evidence does not cover Taxila's core user.** Every big-tech positive result is for teens or adults, or keeps a human in the loop:
   - Eedi × LearnLM: 165 UK secondary students, tutor-approved drafts **[V]**;
   - Learn Your Way: n=60, ages 15–18, Chicago **[V]**;
   - World Bank Nigeria with Copilot: SS1 students with teacher facilitation, 0.31 SD **[S]**.
   - No big-tech RCT of an *autonomous* tutor for children under 13 exists **[S, `learning-science.md` §1]**.
   - Common Sense Media rated Gemini's Under-13 and Teen tiers **"High Risk"**: "adult versions with added safety filters", not built for children **[S]** ([TC](https://techcrunch.com/2025/09/05/google-gemini-dubbed-high-risk-for-kids-and-teens-in-new-safety-assessment/)).
6. **The relational OS that "bonds over months" is the exact product shape big tech is retreating from under legal pressure.**
   - OpenAI: wrongful-death litigation (Raine), under-18 restrictions in Sep 2025, age prediction in Jan 2026, parent "Trusted Contact" alerts **[S]**.
   - Meta: a Reuters exposé of chatbots allowed "romantic" talk with children (Aug 2025), teen access to AI characters paused globally (Jan 2026), and New Mexico child-safety penalties totalling **$942M** (2026) **[S]**.
   - Google: Gemini named in a wrongful-death suit (Mar 2026) **[S, Wikipedia]**.
   - They avoid this space because of risk, not lack of capability. Taxila has to build the bond as a **bounded teacher relationship**, never a companion (consistent with `voice/human-likeness.md`).
7. **New and binding today: Taxila's own AI supplier forbids the obvious way to "read the child's vibe".** Microsoft's AI Code of Conduct (v4.0, 2026-05-01) applies to all Azure OpenAI and Azure Speech customers. It says customers must NOT use the services "**to attempt to infer people's emotional states from their physical, physiological, or behavioral characteristics (e.g., facial expressions, facial movements, or speech patterns)**" **[V]** ([Microsoft Learn](https://learn.microsoft.com/en-us/legal/ai-code-of-conduct)).
   - Taxila is Azure-only by owner directive (`CLAUDE.md`). Prosody- or voice-based emotion inference is therefore a **contract breach today, in India**. It is not just a future EU-law concern.
   - The same code bans exploiting "vulnerabilities of a person due to their age". It also requires disclosing that voices are synthetic.
8. **Google's developer API is closed to products for children.** The Gemini API terms: "you will not use the Services as part of a … service … that is **directed towards or is likely to be accessed by individuals under the age of 18**" (updated 2026-04-28) **[V]** ([terms](https://ai.google.dev/gemini-api/terms)).
   - I found no such clause in Google Cloud's general Service Specific Terms **[V, absence; Vertex-specific terms not checked]**.
   - Anthropic's API allows products for minors if the organisation adds age verification, moderation, AI disclosure and COPPA-grade compliance **[V]**.
   - Google serves children itself and bars developers from doing the same on its API. That asymmetry also stops Taxila from switching to Gemini Live as a fallback voice stack.
9. **India's DPDP law helps the school channel more than it helps Taxila.** Section 9(3) bans "tracking or behavioural monitoring of children" (all under-18s) from 13 May 2027, and consent cannot waive it. The Fourth Schedule exempts *educational institutions* **[V, via `safety/dpdp-deep.md`]**.
   - When a school uses Google Classroom, the school is the fiduciary and the exemption plausibly covers it **[U, legal inference]**.
   - A direct-to-consumer app has no such cover.
   - The law that keeps generic consumer AI away from Indian children also pushes personalisation into schools, where Google is strongest. It is not a moat for D2C Taxila.
10. **Free and low-cost bundles set the parent's price expectation at ₹0–₹399 a month for the whole family.**
    - Google AI Plus in India costs **₹199/mo for 6 months, then ₹399**, shared with up to **5 family members** **[S]** ([TC](https://techcrunch.com/2025/12/10/google-launches-sub-5-ai-plus-plan-in-india-to-compete-with-chatgpt-go/)).
    - Students get one year of AI Plus free (redeem by 31 Dec 2026) **[V]**.
    - ChatGPT Go was free for a year from 2025-11-04 **[S]**. Ads start on Free and Go in India from Aug 2026, though OpenAI says it will "not serve ads to users it believes are under the age of 18" **[S]**.
    - Taxila's ₹299–699 *per child* must be justified by things a family plan does not give: a teacher who knows the child, coverage of the syllabus, and reports to the parent.
11. **India is big for big tech by users and small by revenue, so a dedicated K-7 consumer product does not fit their P&L.**
    - Indian MAU (Jan 2026): ChatGPT 180M, Gemini 118M, Perplexity 19M, Meta AI 12M (app-level).
    - India is ~20% of global GenAI downloads but **~1% of GenAI in-app revenue** **[S]** ([TC](https://techcrunch.com/2026/02/24/india-ai-boom-pushes-firms-to-trade-near-term-revenue-for-users/)).
    - ChatGPT had 29M Indian downloads in 90 days but only $3.6M in in-app purchases **[S]**.
    - Their India education moves are distribution partnerships: OpenAI with IIT Delhi, IIM-A, AIIMS, PW, upGrad, and 5 lakh licences; Microsoft with PW and Shiksha Copilot; Anthropic with Pratham; Google.org with Rocket Learning and Wadhwani AI. None is a K-7 consumer tutor **[S]/[V]**.
12. **The realistic big-tech threat over 24 months is indirect.** Three routes:
    - (a) an Indian partner such as PhysicsWallah ships a K-8 tutor on OpenAI or Microsoft models, which amplifies the PW threat in `india-ai-native.md`;
    - (b) free teen study modes absorb class 8–9 homework demand, which is already happening;
    - (c) Google gradually adds Learn Your Way, Read Along and Gemini Live features to Family Link and Classroom.
    - I put a direct, full-stack Google India K-7 tutor launch at **~25% by Oct 2028**, and an OpenAI under-13 consumer product at **~10%** **[U, judgement]**.
13. **The bigger tech players' child-safety tooling has become the baseline parents will compare Taxila to:**
    - quiet hours and parent-set **study-mode-by-default** (ChatGPT for Teens) **[S]**;
    - weekly topic "Insights" for parents (Meta, Apr 2026, not in India yet) **[S]**;
    - parent alerts on self-harm conversations (OpenAI Trusted Contact; Meta, Jul 2026) **[S]**.
    - Taxila's parent layer must at least match these on safety and then go past them on *learning* evidence, which none of them report.

---

## 1. Landscape at a glance (as of 2026-10-02)

| company | learner-facing AI (launch) | youngest age it reaches | India reach and price | evidence it publishes | what it means for Taxila |
|---|---|---|---|---|---|
| **Google** | LearnLM folded into Gemini; Guided Learning (2025-08-06); Learn Your Way (Labs, 2025-09-16); NotebookLM Video Overviews (2025-07-29); Gemini in Classroom (all ages, 2026-08-10); SAT practice (2026-01-22); JEE Main prep **[S]**; Read Along | **under 13**: Gemini app with parent approval **[V]**; Classroom "students of all ages" **[V]**; Read Along aimed at grades 1–3 reading **[V]** | 118M MAU **[S]**; AI Plus ₹199→399 per family **[S]**; student AI Plus free until 31 Dec 2026 **[V]**; Jio AI Pro for 18 months **[S]** | arena and preference evals **[V]**; Eedi RCT with human tutor **[V]**; Learn Your Way RCT n=60 **[V]** | **primary threat**; also a reference design to learn from |
| **OpenAI** | Study mode (2025-07-29); interactive visuals, 70+ topics (2026-03-10); ChatGPT for Teens (2026-08-18); ChatGPT Edu | 13 (teens 13–17 with parental consent) **[S]** | 100M WAU, #2 market **[S]**; Go free year (from Nov 2025, now ended **[S]**); ads from Aug 2026 **[S]** | none for study mode **[S]** | free substitute for classes 8–9; supplier of Taxila's realtime voice (via Azure) |
| **Anthropic** | Claude for Education with learning mode (2025-04-02); Claude for Teachers (US, teacher-only) | **18** consumer **[V]**; API for minors allowed with safeguards **[V]** | no consumer push; Pratham assessment tool, 6,000 learners **[V]** | Education Report: 47% of student chats "direct" **[V]** | not a competitor; blocked as a supplier by the Azure-only directive |
| **Microsoft** | Copilot Study and Learn agent (2026); Learning Zone (Copilot+ PCs); Teach; Reading Coach | **13**, admin-gated, off by default for K-12 **[V]** | $17.5B India investment 2026–29, 20M people AI-skilled by 2030 **[V]**; Shiksha Copilot for teachers **[V, india-ai-native]**; PW on Azure OpenAI **[S]** | district anecdotes **[V]**; Nigeria RCT 0.31 SD **[S]** | **Taxila's landlord**; its Code of Conduct binds Taxila **[V]** |
| **Meta** | Meta AI in WhatsApp, Instagram and Facebook; teen AI with PG-13 defaults | teens; **pre-teen WhatsApp accounts have no Meta AI** **[S]** | WhatsApp is the parent channel; Meta AI app 12M Indian MAU **[S]** | none | gatekeeper for parent communication; not a tutor competitor |

---

## 2. Google: the only player that could assemble Taxila

### 2.1 The pedagogy model: LearnLM, now inside Gemini

- **What it is.** The authors reframe "AI for learning" as **"pedagogical instruction following"**: training examples include system-level instructions describing pedagogy attributes, so that teachers or developers can specify the behaviour they want **[V]** ([arXiv 2412.16429](https://arxiv.org/abs/2412.16429), v3 2025-08-22).
- **Claimed results.** Experts preferred LearnLM by **+31% over GPT-4o, +11% over Claude 3.5 Sonnet and +13% over Gemini 1.5 Pro** **[V]**.
- **Arena.** In "Evaluating Gemini in an arena for learning", 189 educators role-played and 206 pedagogy experts judged blind. Excluding ties, Gemini 2.5 Pro was preferred in **73.2%** of matchups against Claude 3.7 Sonnet, GPT-4o and o3 **[V]** ([arXiv 2505.24477](https://arxiv.org/abs/2505.24477)).
- **Classroom RCT.** Eedi × LearnLM: 165 students in 5 UK secondary schools. Expert tutors approved **76.4%** of drafts with zero or minimal edits. Students solved **66.2%** of novel next-topic problems against **60.7%** with human tutors alone **[V]** ([arXiv 2512.23633](https://arxiv.org/abs/2512.23633)).
- **Critique.**
  - Arena preference is expert *taste* on role-played turns, not learning.
  - The RCT kept a human in the loop and studied 11–16-year-olds in English maths.
  - A scaled 4-arm RCT ran Apr–Jun 2026, with results not public yet **[V, per `learning-science.md`]**.
  - None of this is Hindi, voice-first, or under 11.
- **Meaning for Taxila.** The model gap with Google is real but rentable: Taxila's GPT-realtime and GPT-5.x stack is in the same class. A lead in pedagogy has to come from **platform-enforced structure** (verified kits, step order, misconception probes). `learning-science.md` §1 shows that structure, not the model, drove the positive RCTs.

### 2.2 Study features in the Gemini app and Search

- **Guided Learning** (2025-08-06) breaks problems down step by step and adds "images, diagrams, videos, and interactive quizzes", plus flashcards and study guides. It launched one week after ChatGPT's study mode **[S]** ([TC](https://techcrunch.com/2025/08/06/google-takes-on-chatgpts-study-mode-with-new-guided-learning-tool-in-gemini/)).
- **The Indian student offer page** lists "study notebooks — personalized learning that uses diagnostic quizzes to identify strengths and knowledge gaps". Search can "generate interactive visuals … take a practice quiz for any subject (including standardized tests), and learn step-by-step with Lens" **[V]** ([Google India](https://blog.google/intl/en-in/products/start-the-academic-year-with-one-year-of-gemini-on-us/)).
  - That is a free diagnostic-to-practice loop, which is the core of most Indian edtech apps.
- **Practice exams.** Free SAT practice exams were built with the Princeton Review (2026-01-22) **[S]** ([TC](https://techcrunch.com/2026/01/22/google-now-offers-free-sat-practice-exams-powered-by-gemini/)). AI-powered JEE Main preparation is offered in India **[S]** ([TC](https://techcrunch.com/2026/01/29/india-is-teaching-google-how-ai-in-education-can-scale/)).
  - The pattern is a vetted content partner plus Gemini, aimed at high-stakes exams. Primary-school board exams are not on the list.
- **Languages.** The Gemini web app supports 70+ languages, including Hindi, Bengali, Marathi, Tamil, Telugu, Kannada, Malayalam, Gujarati, Punjabi, Odia, Assamese and Urdu **[V]** ([help](https://support.google.com/gemini/answer/13575153?hl=en)). Gemini Live's Hindi quality for children is **[U]**.

### 2.3 Learn Your Way: the closest thing to Taxila's content engine

- Learn Your Way generates "immersive text, section-level quizzes, slides & narration, audio lessons, and mind maps" from a textbook, adjusts reading level, and swaps generic examples for the student's interests ("sports, music, food") **[V]** ([Google Research](https://research.google/blog/learn-your-way-reimagining-textbooks-with-generative-ai/), 2025-09-16).
- **RCT.** n=60, ages 15–18, Chicago, one session of up to 40 minutes against a PDF reader. Scores were **+9%** immediately; retention after 3–5 days was **78% vs 67%** **[V]**.
- **Status.** Labs examples only (immune system, economics, sociology). It has no Indian-language or India-specific deployment **[V]**.
- **Meaning for Taxila.** NCERT and state-board textbooks are public PDFs, so turning a textbook into personalised multimodal content is **not a durable moat**. Google has already shown a working version.
  - **Defensible:** what Learn Your Way lacks, namely (a) a live teacher who decides *when* to switch formats, (b) covert understanding checks tied to a misconception bank, and (c) children under 13 with Hindi narration.
  - **Early warning:** Learn Your Way leaving Labs, or appearing inside Classroom or Family Link.

### 2.4 NotebookLM and Classroom content tools

- **NotebookLM Video Overviews** (2025-07-29) are "narrated slides" that pull "images, diagrams, quotes and numbers from your documents". They launched in English only, with more languages "coming soon" **[V]** ([blog](https://blog.google/technology/google-labs/notebooklm-video-overviews-studio-upgrades/)).
- **Age.** NotebookLM is open to **any age on Workspace for Education** and 13+ for personal accounts. Under-18s get stricter content policies, and chats "are not reviewed by humans or used for AI training" **[S]** ([TC](https://techcrunch.com/2025/08/05/googles-notebooklm-is-now-available-to-younger-users-as-competition-in-the-ai-education-space-intensifies/)).
- **Gemini for Education** (ISTE, 2025-06-30) is free on all Workspace for Education editions. It includes 30+ teacher features and teacher-made "Gems" that act as custom AI tutors over class materials **[S]** ([TC](https://techcrunch.com/2025/06/30/google-embraces-ai-in-the-classroom-with-new-gemini-tools-for-educators-chatbots-for-students-and-more/)).
- **Classroom audio lessons** (2026-01-07): teachers generate "podcast-style audio lessons" with settings for grade level, objectives and number of speakers **[S]** ([TC](https://techcrunch.com/2026/01/07/google-classrooms-new-tool-uses-gemini-to-transform-lessons-into-podcast-episodes/)).
- **Teacher pilot.** In Northern Ireland, 100 teachers using Gemini and NotebookLM reported saving "an average of 10 hours per week" over a 6-month pilot (self-report) **[V]** ([blog](https://blog.google/innovation-and-ai/models-and-research/google-deepmind/ai-classroom-northern-ireland/)).

### 2.5 Google and children

| surface | age rule | source |
|---|---|---|
| Gemini mobile app | "you must be 13 (or the applicable age in your country) or over"; "if you are under 13, your account needs a parent's approval" | **[V]** [help](https://support.google.com/gemini/answer/14579026?hl=en) |
| Gemini in Classroom (2026-08-10 web, 08-17 mobile) | "K-12 and higher education students of all ages"; setting **On by default**; to turn it off for under-18s, "create an OU with only those users and turn off access"; global rollout | **[V]** [Workspace Updates](https://workspaceupdates.googleblog.com/2026/08/gemini-in-google-classroom-is-expanding-to-users-of-all-ages-with-contextualized-Gemini-starter-prompts-for-students.html) |
| NotebookLM | any age (Education), 13+ personal | **[S]** TC |
| Read Along (Diya) | early readers; English + Hindi, Marathi, Tamil, Telugu, Bengali, Gujarati, Urdu; offline; 1 GB RAM | **[V]** [readalong.google](https://readalong.google/intl/en_in/fln/) |
| Gemini API (developers) | developers 18+; no apps "likely to be accessed by individuals under the age of 18" | **[V]** [terms](https://ai.google.dev/gemini-api/terms) |

- **Common Sense Media (2025-09-05)** rated both Gemini tiers **High Risk**. It found inappropriate content on sex, drugs, alcohol and unsafe mental-health advice, and no difference in guidance between young children and teens. Google said some responses "weren't working as intended" **[S]**. The same review rated Meta AI "Unacceptable", ChatGPT "Moderate", and Claude (18+) "Minimal" **[S]** ([TC](https://techcrunch.com/2025/09/05/google-gemini-dubbed-high-risk-for-kids-and-teens-in-new-safety-assessment/)).
- **Read Along in India.** It is integrated into UP's Mission Prerna, Telangana's learning-recovery programme and Gujarat's Saathe Vaanchiye. In Tamil Nadu, "18+ lakh children read 1+ crore stories" **[V, vendor]**.
  - **Google already has the hardest data asset Taxila lacks: Hindi oral reading by young Indian children, at state scale.** `india-ai-native.md` §9 records nearly universal ASR errors on Hindi-accented children's English in a Delhi voice-bot study **[V]**.

### 2.6 Google in India

- **Users.** Gemini has 750M MAU globally (Q4 2025) **[S]** ([TC](https://techcrunch.com/2026/02/04/googles-gemini-app-has-surpassed-750m-monthly-active-users/)) and 118M in India (Jan 2026) **[S]**. That puts India at about 16% of Gemini MAU *(my arithmetic)*.
- **Learning usage.** India has "the highest global usage of Gemini for learning" **[S]**.
- **Programmes.** A nationwide training programme for **40,000 Kendriya Vidyalaya** teachers, partnerships on vocational and higher education, and an "AI-enabled state university" **[S]** ([TC](https://techcrunch.com/2026/01/29/india-is-teaching-google-how-ai-in-education-can-scale/)).
- **Constraints Google names itself:** "uneven device access", "shared or teacher-led devices rather than one-to-one", and state-level curriculum variation **[S]**.
  - These are the same constraints that make *the parent's phone at home* the K-7 channel, and that is a consumer channel.
- **Pricing.** AI Plus costs ₹199 then ₹399 a month for a 5-member family. The earlier cheapest plan was ₹1,950. Jio users on qualifying plans get AI Pro free for 18 months **[S]**.
- **Philanthropy instead of product** for the youngest children:
  - Google.org funded Rocket Learning's *Appu* (ages 3–6, Hindi-first, $1.5M grant) **[S, india-ai-native]** and Wadhwani AI's oral-reading-fluency work **[S]**.
  - Google funds Indian NGOs to build child-facing AI rather than shipping its own Indian child tutor.

### 2.7 What stops Google, and how solid each barrier is

| barrier | evidence | durability |
|---|---|---|
| Liability and safety for under-13 open-ended AI | Common Sense "High Risk" **[S]**; wrongful-death suit (Mar 2026) **[S]**; its own API bans under-18 apps **[V]** | **medium**: Google already ships under-13 Gemini, so the issue is how much risk it accepts, not whether it is allowed |
| Positioning: "not replace" teachers | education GM quote **[S]** | **medium-high**: Google sells to schools and governments, so a D2C "replace your tutor" product would conflict with that channel |
| Business model | DPDP s.9(3) bans targeted ads to children **[V]**; India is ~1% of GenAI in-app revenue **[S]** | **high** for a paid D2C K-7 tutor; **low** for free features inside Classroom or Family Link |
| Curriculum operations across 30+ boards and Hindi-medium books | Google cites state curriculum variation as a challenge **[S]**; it uses partners (Princeton Review for SAT) for vetted content **[S]** | **medium**: Learn Your Way can ingest any PDF, but verified item banks and misconception maps cost money for each board |
| Accountability to parents for results | no Google product reports mastery to parents **[U, none found]** | **high**: tools-not-outcomes is a deliberate Google stance |
| History of starting and stopping edtech products (Socratic folded into Lens; Bolo became Read Along) | **[U, memory]** | n/a: signals that Google tends to ship *features*, not durable child products |

**Net.** Google will keep shipping study *features* to all ages through Classroom, Search, Lens and Gemini, free. It is unlikely to ship a paid, parent-accountable, board-specific K-7 Hindi voice tutor in India within 24 months (**~25%**, **[U, judgement]**). It is very likely to make such a tutor's *content* and *Q&A* features look free next to Taxila (**~90%**, **[U]**).

---

## 3. OpenAI: the free substitute for teenagers, and Taxila's model supplier

### 3.1 Products

- **Study mode** (2025-07-29): ChatGPT "asks users questions to test understanding and may refuse direct answers". Launched on Free, Plus, Pro and Team **[S]**.
  - Students can switch back to normal chat, and OpenAI said it was "not offering tools for parents or administrators to lock students into Study Mode" **[S]** ([TC](https://techcrunch.com/2025/07/29/openai-launches-study-mode-in-chatgpt/)).
  - That changed in Aug 2026 for teen accounts (§3.2).
- **Interactive visuals** (2026-03-10): **70+** maths and science topics (Pythagoras, Ohm's law, Hooke's law, compound interest and others) for all logged-in users **[S]**. `tech-and-market.md` reads these as curated modules, not generated on the fly **[S]**.
- **Free tier** (2026-08-06): unlimited text, a "Think" button, GPT-5.6 Luna as the default model, "separate limits for … voice" **[S]**.
  - Voice, the modality Taxila is built on, is still the expensive and rationed one at OpenAI. That supports Taxila's premise that voice is a paid experience **[U, inference]**.
- **Avatars and devices.**
  - "Dots" (2026-09-29) are cartoon-like agent personas for **Pro and Business only**, aimed at work tasks **[S]** ([TC](https://techcrunch.com/2026/09/29/openai-launches-dots-its-bubbly-agentic-avatar/)).
  - A home smart speaker is reported at **$300–400** **[S]** ([TC](https://techcrunch.com/2026/08/06/openais-new-ai-smart-speaker-will-reportedly-sell-for-between-300-and-400/)).
  - Neither is a kids' product today. Watch whether the device gets a family or child profile.

### 3.2 Teen safety: OpenAI's response to litigation

| date | change | source |
|---|---|---|
| 2025-09-16 | Under-18 restrictions: no flirtatious talk, stronger suicide safeguards, and in severe cases an attempt to contact parents or authorities; parent-linked accounts; "blackout hours"; announced alongside a Senate hearing and the Raine wrongful-death suit | **[S]** [TC](https://techcrunch.com/2025/09/16/openai-will-apply-new-restrictions-to-chatgpt-users-under-18/) |
| 2026-01-16 | Ads on Free and Go; "not to serve ads to users it believes are under the age of 18" | **[S]** [TC](https://techcrunch.com/2026/01/16/chatgpt-users-are-about-to-get-hit-with-targeted-ads/) |
| 2026-01-20 | Age prediction from account age, typical activity times, and "behavioral and account-level signals"; predicted minors get filters; adults misclassified as minors can verify with a selfie via Persona | **[S]** [TC](https://techcrunch.com/2026/01/20/in-an-effort-to-protect-young-users-chatgpt-will-now-predict-how-old-you-are/) |
| 2026-07-11 | Hiring a product manager for families, caregivers and older adults; "Trusted Contact" self-harm alerts to caregivers; Sensor Tower: Gemini reaches 32% of US parent smartphone users, ChatGPT 24%, Claude 4%, Copilot 2% | **[S]** [TC](https://techcrunch.com/2026/07/11/openai-bets-on-families-as-chatgpt-goes-deeper-into-households/) |
| 2026-08-18 | **ChatGPT for Teens**: parents manage settings, get safety notifications, set Quiet Hours and "**decide when Study Mode is enabled by default**"; homework reminders that "discourage cheating and redirect to Study Mode"; quizzes and visualisations; behaviour governed by "Under-18 Principles in our Model Spec" | **[S]** [TC](https://techcrunch.com/2026/08/18/openai-launches-a-safer-chatgpt-for-teens-years-after-teens-started-using-it/) |

- **Under-13.** No OpenAI consumer product. The terms ask users to attest they are over 13, and 13–17s need parental consent **[S]** ([Wikipedia](https://en.wikipedia.org/wiki/ChatGPT)).
- **Meaning for Taxila.**
  - Class 8–9 students (13–15) now have a free, parent-configurable study tutor from the most-used AI brand. For that band Taxila competes head-on with ChatGPT for Teens and needs *curriculum and accountability*, not *tutoring*, to win.
  - For classes 1–7, OpenAI is absent by policy, and given the litigation that is unlikely to change soon (**~10%** for an under-13 consumer product by Oct 2028, **[U, judgement]**).

### 3.3 OpenAI in India

- **Scale.** "Over 100 million" weekly active users, and India is "the second-largest user base after the U.S." **[S]** ([TC](https://techcrunch.com/2026/02/18/openai-pushes-into-higher-education-as-india-seeks-to-scale-ai-skills/)). Against ~1B global weekly users **[S]**, India is about 10% *(my arithmetic)*.
- **Price.**
  - ChatGPT Go launched below $5 in Aug 2025 **[S]**.
  - It was free for a year to every Indian user who signed up from 2025-11-04 **[S]** ([TC](https://techcrunch.com/2025/10/27/openai-offers-free-chatgpt-go-for-one-year-to-all-users-in-india)). TC lists that promotion as no longer available in Feb 2026 **[S]**.
  - Ads on Free and Go in India were announced on 2026-08-27, starting with 50 brands and a minimum daily budget of ₹725 **[S]** ([TC](https://techcrunch.com/2026/08/27/openai-to-start-showing-ads-on-chatgpts-free-and-go-tiers-in-india/)).
- **Education partnerships.**
  - The 2025 "Learning Accelerator" offered 5 lakh free ChatGPT licences to teachers and students **[S, headline]** ([Business Standard](https://www.business-standard.com/technology/tech-news/openai-to-provide-5-lakh-free-chatgpt-licences-to-teachers-students-125082501056_1.html)).
  - Feb 2026: IIT Delhi, IIM Ahmedabad, AIIMS Delhi and others, targeting 100,000+ students, faculty and staff in a year. Course partnerships with **Physics Wallah, upGrad and HCL GUVI** **[S]**.
  - The India education head is Raghav Gupta (ex-Coursera APAC) **[S]**.
  - All of this is higher-education and skills work. No K-12 student product was found.
- **Meaning for Taxila.** OpenAI's route into Indian K-12 runs through PW. PW already builds on Azure OpenAI and plans a "Socratic AI Tutor … true companion for the kids" **[V, india-ai-native]**. The OpenAI threat to Taxila is therefore mostly the **PW threat with frontier models behind it**.

---

## 4. Anthropic: an 18+ consumer brand, and permissive API terms for minors

- **Claude for Education** (2025-04-02) is a university product. Its learning mode uses "Socratic questioning" ("How would you approach this problem?"). Launch partners were Northeastern (50,000 users), LSE, Champlain and Canvas/Instructure **[V]** ([Anthropic](https://www.anthropic.com/news/introducing-claude-for-education)).
- **Claude for Teachers** gives US K-12 educators "free access to premium Claude features" after verification. Training is "off by default". It has FERPA-aligned terms, is built to the AFT privacy standard, and uses curriculum connectors (Learning Commons, Illustrative Mathematics, OpenSciEd, Eedi). It is **teacher-facing and US-only** **[V]** ([claude.com](https://claude.com/solutions/teachers)).
- **Consumer age.** "You must be at least 18 years old" **[V]** ([terms](https://www.anthropic.com/legal/consumer-terms)). An age and identity verification policy (Persona) took effect 2026-07-08 **[S]** ([TC](https://techcrunch.com/2026/06/22/anthropic-says-claude-may-want-to-see-your-id/)).
- **API for minors.** Allowed, with "age verification systems", "content moderation and filtering", "monitoring and reporting", COPPA-grade compliance, the recommended child-safety system prompt, and disclosure that users "are interacting with an AI system rather than a human". Anthropic "will audit compliance" **[V]** ([support](https://support.claude.com/en/articles/9307344-responsible-use-of-anthropic-s-models-guidelines-for-organizations-serving-minors)).
- **Usage evidence.** Across 574,740 student conversations, ~47% were "Direct", meaning they sought answers with little engagement **[V]** ([report](https://www.anthropic.com/news/anthropic-education-report-how-university-students-use-claude)). This is the cheating baseline that study and learning modes try to fix.
- **India.** The partnership with Pratham (2026-02-16) builds the "Anytime Testing Machine": curriculum-aligned tests, digitised handwritten answers and feedback. 6,000 learners so far, 15,000 planned, and a planned RCT with "several thousand students" **[V]** ([Pratham](https://www.pratham.org/2026/02/16/pratham-partners-with-anthropic-to-enable-ai-learning-tools-for-learners/)).
- **Meaning for Taxila.** Anthropic has no intent to build a children's product and is not a competitor. It is a plausible *future supplier*, the only lab whose API terms explicitly allow building for minors, but the owner's Azure-only directive currently rules it out (`context/decisions.md` `azure-only-compute`).

---

## 5. Microsoft: Taxila's landlord, not a rival

- **Copilot for students.** The Study and Learn agent ("purpose-built for education": flashcards, quizzes, matching, fill-in-the-blank, step-by-step help) runs on A1/A3/A5 education licences.
  - "For student accounts in primary and secondary education, Copilot Chat is off by default, and only an IT administrator can enable it, using age-gating controls for learners aged 13 to 17. **Copilot Chat is not available for students under 13**" **[V]** ([Microsoft Education](https://www.microsoft.com/en-us/education/blog/2026/07/study-and-learn-ai-built-for-learning-in-microsoft-365-copilot/)).
- **Learning Zone** is an on-device Windows app for Copilot+ PCs, in English and Spanish, with more languages "planned for 2026". Teach (lesson plans, quizzes, rubrics) is included at no extra cost **[V]** ([Microsoft Education](https://www.microsoft.com/en-us/education/blog/2026/01/introducing-microsoft-innovations-and-programs-to-support-ai-powered-teaching-and-learning/)).
  - Copilot+ PCs are not an Indian K-7 home device.
- **Policy posture.** Five commitments, including "Educators remain in control" and "AI designed to support students' learning, not replace their thinking" (2026-09-16). An AFT/UFT "National AI Safety & Privacy Standard" for US schools (Sep 2026) **[V]** ([Microsoft](https://blogs.microsoft.com/blog/2026/09/16/microsofts-commitment-for-ai-in-education/)).
- **India.**
  - **$17.5B** over 2026–2029, on top of $3B by end-2026. AI skills for **20 million** people by 2030, with 5.6M trained since Jan 2025. A Hyderabad cloud region from mid-2026 **[V]** ([Microsoft](https://news.microsoft.com/source/asia/2025/12/09/microsoft-invests-us17-5-billion-in-india-to-drive-ai-diffusion-at-population-scale/)).
  - Shiksha Copilot covers 1,043 Karnataka teachers, saving 2.02 h a week **[V, india-ai-native]**.
  - PW's Gyan Guru runs on Azure OpenAI **[S]**.
- **Evidence.** The World Bank Edo State pilot used Copilot (GPT-4) with teacher facilitation: **0.31 SD** in 6 weeks, with larger gains for stronger students **[S, learning-science.md §1]**.
- **The clause that binds Taxila** (AI Code of Conduct v4.0, 2026-05-01, applies to Azure OpenAI and Azure Speech) **[V]** ([Microsoft Learn](https://learn.microsoft.com/en-us/legal/ai-code-of-conduct)). Customers must NOT use the services:
  - #7 "to exploit any of the vulnerabilities of a person due to their age … with the objective, or the effect, of materially distorting the behavior";
  - #12 "**to attempt to infer people's emotional states from their physical, physiological, or behavioral characteristics (e.g., facial expressions, facial movements, or speech patterns)**";
  - #13 for "chatbots that … are erotic, romantic … or are personas of specific people without their explicit consent". A teacher avatar modelled on a real teacher needs that teacher's consent.
  - Responsible-AI requirement #3: disclose "the synthetic nature of generated voices".
  - There is **no age floor** for customers' end users in this code **[V, absence]**. So under-13 products on Azure are allowed, subject to law.
- **Meaning for Taxila.**
  - Microsoft does not compete for Indian under-13 consumers; its own student AI starts at 13 and is admin-gated.
  - It is the **sole supplier** of Taxila's models and compute, so its terms and pricing are a single point of failure.
  - The #12 clause makes "vibe from voice" a contractual non-starter. Detect understanding and engagement from **task evidence and the child's own words**, not from prosody. This matches GCL-10 in `safety/global-child-law.md`. Whether *text* sentiment counts as "behavioral characteristics" is unclear; ask Microsoft or counsel **[U]**.

---

## 6. Meta: the gatekeeper of the parent's inbox

- **Scale.**
  - Meta AI has about **1 billion** monthly users across Meta's apps **[S]** ([TC](https://techcrunch.com/2026/02/04/googles-gemini-app-has-surpassed-750m-monthly-active-users/)).
  - The standalone Meta AI app has only **12M** Indian MAU **[S]**. The gap between the two figures is mostly the definition (embedded in WhatsApp versus the app) **[U]**.
- **Child-safety record.**
  - Reuters (Aug 2025) reported that internal "GenAI: Content Risk Standards" allowed romantic conversations with children; one example had a bot telling an 8-year-old "Every inch of you is a masterpiece". Meta said the examples had been removed, and Sen. Hawley opened an inquiry **[S]** ([TC](https://techcrunch.com/2025/08/15/sen-hawley-to-probe-meta-after-report-finds-its-ai-chatbots-flirt-with-kids/)).
  - Common Sense rated Meta AI "Unacceptable" **[S]**.
  - New Mexico penalties: $375M (Mar 2026) plus $567M (Aug 2026), with court-ordered limits on minors' usage and night-time notifications **[S]** ([TC](https://techcrunch.com/2026/08/07/new-mexico-court-orders-meta-to-pay-additional-567m-in-child-safety-case/)).
- **Teen AI controls.**
  - PG-13 defaults and parental controls were previewed in Oct 2025. Parents **cannot** switch off Meta AI itself, and the controls were English-only in US/UK/CA/AU **[S]** ([TC](https://techcrunch.com/2025/10/17/meta-previews-new-parental-controls-for-its-ai-experiences/)).
  - Teen access to AI characters was paused globally (2026-01-23). The new version is to be limited to "education, sport, and hobbies" **[S]** ([TC](https://techcrunch.com/2026/01/23/meta-pauses-teen-access-to-ai-characters-ahead-of-new-version/)).
  - A parent "Insights" tab showing topic categories launched 2026-04-23 in the US, UK, AU, CA and BR, **not India** **[S]** ([TC](https://techcrunch.com/2026/04/23/meta-will-now-allow-parents-to-see-the-topics-their-child-discussed-with-meta-ai/)).
- **WhatsApp.**
  - Pre-teen, parent-linked accounts (2026-03-11) are messaging and calling only: "No access to Meta AI" **[S]** ([TC](https://techcrunch.com/2026/03/11/whatsapp-is-launching-parent-linked-accounts-for-pre-teens/)).
  - Teen-account parental controls arrived 2026-09-30, with Meta AI content settings "13+" or "Limited Content" **[S]** ([TC](https://techcrunch.com/2026/09/30/whatsapp-adds-new-parental-controls-for-teen-accounts/)).
- **The WhatsApp Business API ban on general-purpose AI chatbots**:
  - phase 1 on 2025-10-15, phase 2 for all users on **2026-01-15**;
  - customer support, notifications and other structured flows remain allowed **[S]** ([respond.io](https://respond.io/blog/whatsapp-general-purpose-chatbots-ban));
  - Italy and Brazil forced exclusions **[S]** ([TC](https://techcrunch.com/2026/01/15/after-italy-whatsapp-excludes-brazil-from-rival-chatbot-ban/)). India has no exclusion **[U, none found]**.
- **Meaning for Taxila.**
  - Meta is not a tutor competitor, and parents have the most reason to distrust it with children.
  - It controls the channel Taxila plans for parent reports. Template-based progress messages and voice notes are business messaging and allowed **[S]**.
  - A "tutor on WhatsApp" with open Q&A risks being classed as general-purpose **[U]**, so keep tutoring in the app and use WhatsApp only for structured parent updates.

---

## 7. Others worth a line

- **Amazon Alexa+** is in beta in India in Hindi, with explicit attention to "code-mixed" Hindi-English. It is free with Prime **[S]** ([TC](https://techcrunch.com/2026/06/22/amazon-is-testing-alexa-in-india-with-hindi-support/)). No kids or learning features were mentioned. It could become a home voice-tutor surface; low threat for now **[U]**.
- **Market share** (Sensor Tower, May 2026): ChatGPT 46.4%, Gemini 27.7%, Claude 10.3%; ChatGPT 1.1B MAU, Gemini 662M, Claude 245M **[S]** ([TC](https://techcrunch.com/2026/06/16/chatgpts-market-share-slips-below-50-for-first-time/)). Indian AI-assistant downloads fell in Q1 2026 **[S]**.

---

## 8. Threat analysis

### 8.1 Already commoditised: no moat in any of these

| capability | free big-tech equivalent | source |
|---|---|---|
| Socratic "don't just give the answer" chat | ChatGPT study mode, Gemini Guided Learning, Claude learning mode, Copilot Study and Learn | **[S]/[V]** |
| Flashcards, quizzes, diagnostic practice | Gemini study notebooks; Copilot; ChatGPT for Teens quizzes | **[V]/[S]** |
| Interactive sliders and visuals for standard topics | ChatGPT (70+ topics); Search interactive visuals | **[S]/[V]** |
| Textbook to audio, video or mind map | NotebookLM, Classroom audio lessons, Learn Your Way (Labs) | **[V]/[S]** |
| Photo-of-question to step-by-step answer | Lens "learn step-by-step" | **[V]** |
| Practice exams for high-stakes tests | Gemini SAT and JEE Main | **[S]** |
| Parent safety controls (quiet hours, alerts, topic insights) | ChatGPT for Teens, Meta | **[S]** |

### 8.2 The age wall, by Taxila class (class 1 ≈ age 6 **[U, typical entry age]**)

| classes (≈age) | ChatGPT | Gemini consumer | Gemini via school | Claude | Copilot (students) | Meta AI | DPDP status |
|---|---|---|---|---|---|---|---|
| 1–7 (6–12) | no | **yes, with parent approval [V]** | **yes, on by default [V]** | no | no **[V]** | no (pre-teen WhatsApp) **[S]** | child: verifiable parental consent; no tracking or behavioural monitoring (from 13 May 2027) |
| 8–9 (13–15) | **yes: ChatGPT for Teens [S]** | yes | yes | no | yes, if admin enables **[V]** | yes, PG-13 **[S]** | still a child (<18) under DPDP **[V via dpdp-deep]** |

- Seven of Taxila's nine grades sit below the consumer age floor of OpenAI, Microsoft, Meta and Anthropic.
- Only Google reaches them, through a general assistant that Common Sense rated High Risk, or through school accounts.
- India's DPDP law treats *all* nine grades as children. From May 2027, big tech's teen products in India also need verifiable parental consent and cannot behaviourally monitor 13–17s **[V via dpdp-deep, applied by inference]**.
- The regulatory burden is therefore **symmetric**. It is not an advantage for Taxila, except where Taxila is better designed for it (Narrow Mode M1, `safety/dpdp-deep.md` §6).

### 8.3 Where they will not go, ranked by how much Taxila can rely on it

1. **Accountability to parents for results (strong).** No big-tech product reports *mastery* or *syllabus coverage* to parents, issues a teacher's remark, or puts its name to exam readiness **[U, none found]**.
   - Their parent features are about safety: quiet hours, alerts, topic categories.
   - Their public stance is augmentation and "educators remain in control" **[V]/[S]**.
   - This is what tuition teachers sell, and it is Taxila's real product.
2. **Board-specific depth, Hindi medium, classes 1–7 (medium).**
   - The content itself can be ingested easily (public PDFs plus Learn Your Way).
   - What is defensible is the *verified* layer: blind-solved answer keys (`data/kits/`), misconception banks mapped to NCERT and RBSE chapters, board-pattern assessments, and Hindi-medium terminology.
   - Google uses partners to vet exam content (Princeton Review) **[S]**, which suggests it would partner rather than build each board's layer.
3. **A child-tuned voice teacher for ages 6–12 (medium, and an execution race).**
   - Big tech's child tiers are "adult versions with added safety filters" **[S]**.
   - Google, though, holds the best Indian child-speech data (Read Along) **[V]**.
   - The moat is register, turn length, warmth and kid ASR tuned to Hindi-belt children, as in `india-ai-native.md` §9. It lasts only as long as Taxila stays ahead in measured quality.
4. **A long-term relational bond with a minor (weak as a moat, high as a liability).** Big tech is moving away from this shape (§0.6). Taxila can occupy it only as a bounded *teacher* relationship with the safety floor in `CLAUDE.md`.

### 8.4 Where big tech can go and Taxila cannot

- **School channel under the DPDP exemption.** Gemini in Classroom is on by default for all ages **[V]**. The school is the fiduciary, and the educational-institution exemption plausibly allows learner tracking there **[U, legal inference]**.
- **Distribution.** Android and the Play Store, YouTube, Lens and Search, Jio bundles **[S]**, and WhatsApp.
- **Price of ₹0.** Free features paid for by other businesses (Workspace, Search, ads to adults).
- **Proprietary children's data.** Read Along's Hindi oral-reading data at state scale **[V]**. YouTube's learning video corpus **[U]**.
- **Model quality and cost.** Pedagogy-tuned frontier models **[V]**, rented to Taxila at a margin.

### 8.5 Scenarios to Oct 2028 (all probabilities **[U, judgement]**)

| # | scenario | prob. | impact on Taxila | early-warning signal |
|---|---|---|---|---|
| S1 | Free study features absorb class 8–9 homework demand | **~90%** (already under way) | medium: acquisition in classes 8–9 gets harder | ChatGPT for Teens and Guided Learning usage among Indian teens; Taxila class 8–9 trial-to-paid conversion vs classes 3–7 |
| S2 | An Indian partner ships a K-8 AI tutor on OpenAI or Microsoft models (PW is the most likely) | **~60%** | high | PW Q2/Q3 FY27 letters; OpenAI–PW co-announcements |
| S3 | Google brings Learn Your Way, Gemini Live in Hindi or Read Along into Family Link or Classroom for Indian K-7 | **~35%** for some of these | medium-high | Learn Your Way leaves Labs; NCERT/CBSE MoU with Google; Google for India event (usually Q4) |
| S4 | Google launches a full child tutor in India: voice, NCERT-mapped, parent reports | **~25%** | **severe** | Gemini app "kids" mode with progress reports; Hindi kid ASR in Gemini Live; Indian board content partner |
| S5 | OpenAI ships an under-13 consumer product | **~10%** | high (would hit classes 5–7 first) | output of the families PM role; device with child profiles; a COPPA-compliant product |
| S6 | Supplier friction: Azure enforces the code (emotion inference), changes realtime pricing or region, or adds a minors clause | **~30%** | medium | Code of Conduct version notes (v5); Azure OpenAI product-terms changes |
| S7 | Meta makes WhatsApp parent messaging more expensive or more restricted | **~40%** | low-medium | WhatsApp pricing notices (see the 360dialog note in `parent-experience.md`) |

**Answer to "can they kill Taxila?"**
- They can kill a *generic* Taxila: an explainer and homework helper for teens. That is largely done already (S1).
- They are unlikely within 24 months to kill a Taxila that is:
  - (a) a voice teacher designed for 6–12-year-olds;
  - (b) mapped to the child's actual board and textbook, Hindi medium included, with verified answer keys;
  - (c) accountable to the parent for measured learning;
  - (d) backed by outcome evidence.
- Two caveats. Google is the one player that could change this, and scenario S4 should be reviewed every quarter. The nearer killer is an Indian company using big-tech models (S2), not big tech itself.

### 8.6 Supplier and landlord risks (they cut both ways)

- **Single-vendor dependence.** Under the owner directive, every model Taxila runs is Azure OpenAI. OpenAI's own teen product competes for the same 13–15 users, and Microsoft's code governs Taxila's features **[V]**.
- **The Gemini API is closed to under-18 products** **[V]**, so a Gemini Live fallback is unavailable unless counsel confirms Vertex terms differ **[U]**.
- **OpenAI's direct-API policy on minors could not be checked** (openai.com returned 403) **[U]**. Re-check it before any multi-vendor plan.
- **Prices fall, which helps Taxila.** Each new model generation lowers inference cost (GPT-5.6 Luna is the free default **[S]**; GPT-6 Sol and Luna launched 2026-09-22 "boasting lower cost" **[S]**). That makes PW's ~$0.20/h voice benchmark reachable.

---

## 9. Implications for Taxila (proposed decisions; each has a reversal condition in §10)

1. **Beachhead on classes 1–7. Treat classes 8–9 as retention, not acquisition.** Four of five platforms are absent below 13 by policy, and Google's presence there is an adult assistant with filters or a school tool **[V]/[S]**.
2. **Position against the tuition teacher, not against ChatGPT.** Sell what big tech will not: a named teacher who knows the child, coverage of the actual board syllabus, test readiness, and a weekly Hindi-voice report to the parent. 27% of students already pay for coaching **[S]**.
3. **Do not count content transformation as a moat.** Learn Your Way, NotebookLM and ChatGPT visuals show it is reproducible **[V]/[S]**. Put moat effort into verified kits, misconception banks, the learner model, and the teacher's in-lesson decisions on *when* to switch formats.
4. **Make "vibe" work under Azure's code.** Infer engagement and understanding from task evidence, latency to answer as a task metric (not as emotion), and what the child says, with explicit check-ins. Never classify emotion from voice or face (Code of Conduct #12 **[V]**; GCL-10). Log this in `context/decisions.md` as a constraint with its source.
5. **Keep the Gemini Developer API out of any path a child can reach** **[V]**. Record it in `context/rejected.md` as "contractually excluded", so nobody proposes Gemini Live as a fallback without checking.
6. **Publish outcome evidence for under-13s.** Big tech has none for autonomous tutoring of children; its RCTs are 15–18 (n=60) or human-in-the-loop (n=165) **[V]**. An Indian RCT on ages 8–12 against the Mindspark bar (~0.2 SD over 18 months, `india-ai-native.md` §6) would be unique and would open state procurement.
7. **Keep model access swappable and stay partner-able.** Big tech enters Indian education through partners: Google.org with Rocket Learning and Wadhwani AI, Anthropic with Pratham, OpenAI with PW and upGrad, Microsoft with Sikshana and PW **[S]/[V]**. A clean, model-agnostic, compliance-ready Taxila is a candidate partner (or acquisition) for any of them.
8. **Match big tech's parent-safety baseline**: quiet hours, self-harm alerts to a trusted adult, and topic transparency, all at launch. Then go beyond it with *learning* reports. Parents will compare Taxila with ChatGPT for Teens and Meta Insights **[S]**.
9. **Use WhatsApp only for structured parent updates.** Run no open-ended tutoring there (the 2026-01-15 general-purpose bot ban **[S]**).

## 10. What would reverse these conclusions

- **Google ships a Gemini kids mode in India with parent progress reports, or NCERT/board alignment.** Then §9.1–9.2 shrink to an execution race. Taxila's edge becomes Hindi-belt voice quality, accountability guarantees and outcome evidence, and it should seek a school or state channel quickly.
- **An OpenAI under-13 product appears.** Then classes 5–7 face the same squeeze as 8–9, so Taxila should move its emphasis down to classes 1–4 and to Hindi medium.
- **Microsoft states in writing that text-only affect inference is allowed, or that it does not cover pedagogical engagement signals.** Then §9.4 can relax for text, never for voice or face.
- **Counsel or the Data Protection Board rules that a D2C edtech app counts as an "educational institution".** Then the DPDP asymmetry in §0.9 disappears.
- **A teardown shows Gemini Live already handles Hindi-speaking 8-year-olds well** (low ASR error, short turns, age-appropriate register). Then the child-voice moat (§8.3.3) is gone.

## 11. Cheap checks to run next

1. **Gemini under-13 teardown in India.** On a Family Link child account on an Android phone, run a scripted class-4 NCERT maths and EVS session in Hindi and Hinglish. Measure ASR error, turn length, Flesch-Kincaid grade, curriculum accuracy, and refusal or safety behaviour. Repeat with ChatGPT for Teens on a 13-year-old profile. This is the head-to-head parents will actually make. **[not done; method only]**
2. **Gemini in Classroom check.** In an Indian Workspace for Education tenant, confirm the default-on behaviour and see what a class-5 student can access.
3. **Supplier terms.** Get written answers from Microsoft (Code #12 scope) and confirm OpenAI's direct-API minors policy and Vertex AI's terms on minors.
4. **Quarterly watchlist.** Google for India; the Google Labs Learn Your Way page; Workspace Updates (Classroom); OpenAI teen and family posts; PW quarterly letters; the WhatsApp Business policy changelog.

---

## Sources

**Google**
- Gemini in Classroom, all ages (2026-08): https://workspaceupdates.googleblog.com/2026/08/gemini-in-google-classroom-is-expanding-to-users-of-all-ages-with-contextualized-Gemini-starter-prompts-for-students.html [V]
- Gemini mobile app age requirements: https://support.google.com/gemini/answer/14579026?hl=en [V]; languages: https://support.google.com/gemini/answer/13575153?hl=en [V]
- Gemini API terms (under-18 clause): https://ai.google.dev/gemini-api/terms [V]; Google Cloud Service Specific Terms (no minors clause found): https://cloud.google.com/terms/service-terms [V, absence]
- LearnLM tech report: https://arxiv.org/abs/2412.16429 [V]; arena: https://arxiv.org/abs/2505.24477 [V]; Eedi RCT: https://arxiv.org/abs/2512.23633 [V]
- Learn Your Way: https://research.google/blog/learn-your-way-reimagining-textbooks-with-generative-ai/ [V]
- NotebookLM Video Overviews: https://blog.google/technology/google-labs/notebooklm-video-overviews-studio-upgrades/ [V]
- Google India student AI Plus offer: https://blog.google/intl/en-in/products/start-the-academic-year-with-one-year-of-gemini-on-us/ [V]
- Read Along FLN page: https://readalong.google/intl/en_in/fln/ [V]
- AI and learning (2025-11-06): https://blog.google/products-and-platforms/products/education/ai-and-learning/ [V]; Ben Gomes speech (2025-11-17): https://blog.google/products-and-platforms/products/education/ben-gomes-speech-transcript/ [V]; Northern Ireland pilot: https://blog.google/innovation-and-ai/models-and-research/google-deepmind/ai-classroom-northern-ireland/ [V]
- TechCrunch: Guided Learning https://techcrunch.com/2025/08/06/google-takes-on-chatgpts-study-mode-with-new-guided-learning-tool-in-gemini/ · NotebookLM for younger users https://techcrunch.com/2025/08/05/googles-notebooklm-is-now-available-to-younger-users-as-competition-in-the-ai-education-space-intensifies/ · Gemini for Education (ISTE) https://techcrunch.com/2025/06/30/google-embraces-ai-in-the-classroom-with-new-gemini-tools-for-educators-chatbots-for-students-and-more/ · Common Sense "High Risk" https://techcrunch.com/2025/09/05/google-gemini-dubbed-high-risk-for-kids-and-teens-in-new-safety-assessment/ · AI Plus India https://techcrunch.com/2025/12/10/google-launches-sub-5-ai-plus-plan-in-india-to-compete-with-chatgpt-go/ · Classroom audio lessons https://techcrunch.com/2026/01/07/google-classrooms-new-tool-uses-gemini-to-transform-lessons-into-podcast-episodes/ · SAT practice https://techcrunch.com/2026/01/22/google-now-offers-free-sat-practice-exams-powered-by-gemini/ · India and Google education https://techcrunch.com/2026/01/29/india-is-teaching-google-how-ai-in-education-can-scale/ · Gemini 750M MAU https://techcrunch.com/2026/02/04/googles-gemini-app-has-surpassed-750m-monthly-active-users/ [S]
- Gemini wrongful-death suit mention: https://en.wikipedia.org/wiki/Gemini_(chatbot) [S]

**OpenAI** (openai.com returned 403, so everything here is secondary)
- Study mode https://techcrunch.com/2025/07/29/openai-launches-study-mode-in-chatgpt/ · under-18 restrictions https://techcrunch.com/2025/09/16/openai-will-apply-new-restrictions-to-chatgpt-users-under-18/ · Go free in India https://techcrunch.com/2025/10/27/openai-offers-free-chatgpt-go-for-one-year-to-all-users-in-india · ads plan https://techcrunch.com/2026/01/16/chatgpt-users-are-about-to-get-hit-with-targeted-ads/ · age prediction https://techcrunch.com/2026/01/20/in-an-effort-to-protect-young-users-chatgpt-will-now-predict-how-old-you-are/ · India higher ed https://techcrunch.com/2026/02/18/openai-pushes-into-higher-education-as-india-seeks-to-scale-ai-skills/ · interactive visuals https://techcrunch.com/2026/03/10/chatgpt-can-now-create-interactive-visuals-to-help-you-understand-math-and-science-concepts/ · families https://techcrunch.com/2026/07/11/openai-bets-on-families-as-chatgpt-goes-deeper-into-households/ · unlimited free text https://techcrunch.com/2026/08/06/openai-brings-unlimited-chatgpt-text-chats-to-free-users/ · smart speaker https://techcrunch.com/2026/08/06/openais-new-ai-smart-speaker-will-reportedly-sell-for-between-300-and-400/ · ChatGPT for Teens https://techcrunch.com/2026/08/18/openai-launches-a-safer-chatgpt-for-teens-years-after-teens-started-using-it/ · ads in India https://techcrunch.com/2026/08/27/openai-to-start-showing-ads-on-chatgpts-free-and-go-tiers-in-india/ · GPT-6 https://techcrunch.com/2026/09/22/openai-launches-gpt-6-sol-and-luna/ · Dots https://techcrunch.com/2026/09/29/openai-launches-dots-its-bubbly-agentic-avatar/ [S]
- Learning Accelerator (headline only): https://www.business-standard.com/technology/tech-news/openai-to-provide-5-lakh-free-chatgpt-licences-to-teachers-students-125082501056_1.html [S]
- ChatGPT age terms and weekly users: https://en.wikipedia.org/wiki/ChatGPT [S]

**Anthropic**
- Claude for Education https://www.anthropic.com/news/introducing-claude-for-education [V] · Higher-education page https://claude.com/solutions/education [V] · Claude for Teachers https://claude.com/solutions/teachers [V] · consumer terms https://www.anthropic.com/legal/consumer-terms [V] · minors guidelines https://support.claude.com/en/articles/9307344-responsible-use-of-anthropic-s-models-guidelines-for-organizations-serving-minors [V] · Education Report https://www.anthropic.com/news/anthropic-education-report-how-university-students-use-claude [V] · Pratham https://www.pratham.org/2026/02/16/pratham-partners-with-anthropic-to-enable-ai-learning-tools-for-learners/ [V] · ID verification https://techcrunch.com/2026/06/22/anthropic-says-claude-may-want-to-see-your-id/ [S]

**Microsoft**
- Study and Learn (13+, not under 13) https://www.microsoft.com/en-us/education/blog/2026/07/study-and-learn-ai-built-for-learning-in-microsoft-365-copilot/ [V] · Jan 2026 innovations (Learning Zone, Teach) https://www.microsoft.com/en-us/education/blog/2026/01/introducing-microsoft-innovations-and-programs-to-support-ai-powered-teaching-and-learning/ [V] · commitments (2026-09-16) https://blogs.microsoft.com/blog/2026/09/16/microsofts-commitment-for-ai-in-education/ [V] · India $17.5B https://news.microsoft.com/source/asia/2025/12/09/microsoft-invests-us17-5-billion-in-india-to-drive-ai-diffusion-at-population-scale/ [V] · **AI Code of Conduct v4.0** https://learn.microsoft.com/en-us/legal/ai-code-of-conduct [V] · Education blog index https://www.microsoft.com/en-us/education/blog/ [V]

**Meta**
- Hawley probe after the Reuters report https://techcrunch.com/2025/08/15/sen-hawley-to-probe-meta-after-report-finds-its-ai-chatbots-flirt-with-kids/ · parental controls preview https://techcrunch.com/2025/10/17/meta-previews-new-parental-controls-for-its-ai-experiences/ · AI characters paused for teens https://techcrunch.com/2026/01/23/meta-pauses-teen-access-to-ai-characters-ahead-of-new-version/ · WhatsApp bot-ban exclusions https://techcrunch.com/2026/01/15/after-italy-whatsapp-excludes-brazil-from-rival-chatbot-ban/ · pre-teen WhatsApp https://techcrunch.com/2026/03/11/whatsapp-is-launching-parent-linked-accounts-for-pre-teens/ · topic Insights https://techcrunch.com/2026/04/23/meta-will-now-allow-parents-to-see-the-topics-their-child-discussed-with-meta-ai/ · New Mexico https://techcrunch.com/2026/08/07/new-mexico-court-orders-meta-to-pay-additional-567m-in-child-safety-case/ · teen WhatsApp controls https://techcrunch.com/2026/09/30/whatsapp-adds-new-parental-controls-for-teen-accounts/ [S]
- WhatsApp Business general-purpose chatbot ban: https://respond.io/blog/whatsapp-general-purpose-chatbots-ban [S]

**Market and other**
- Indian AI usage and revenue https://techcrunch.com/2026/02/24/india-ai-boom-pushes-firms-to-trade-near-term-revenue-for-users/ · India downloads 2025 https://techcrunch.com/2026/01/21/indias-app-downloads-rebounded-to-25-5-billion-in-2025-fueled-by-ai-assistants-and-microdrama-boom/ · market share May 2026 https://techcrunch.com/2026/06/16/chatgpts-market-share-slips-below-50-for-first-time/ · Alexa+ Hindi https://techcrunch.com/2026/06/22/amazon-is-testing-alexa-in-india-with-hindi-support/ [S]
- Internal: `../learning-science.md` §1 (Kestin, Bastani, Nigeria, Eedi) · `india-ai-native.md` §0, §5, §7 · `../safety/dpdp-deep.md` §0 · `../safety/global-child-law.md` GCL-10 · `../design/parent-experience.md` (NSS CMS 2025) · `/home/user/Taxila/CLAUDE.md` and `context/decisions.md` (Azure-only).

## Fact-check

Adversarial pass on 2026-10-02 (primary pages re-fetched; WebSearch budget exhausted, so no independent searches).

| # | Claim | Verdict | Corrected value | Source |
|---|---|---|---|---|
| 1 | Gemini in Classroom on by default 2026-08-10 web / 08-17 mobile, all ages, global; separate OU needed for under-18 | supported | Page: "On by default for teachers and students of all ages"; admins "create an OU with only those users and turn off access for that OU only" | https://workspaceupdates.googleblog.com/2026/08/gemini-in-google-classroom-is-expanding-to-users-of-all-ages-with-contextualized-Gemini-starter-prompts-for-students.html |
| 2 | Under-13 Gemini app with parent approval; minimum 13 or local age | supported | Verbatim match | https://support.google.com/gemini/answer/14579026?hl=en |
| 3 | Other platforms stay out of under-13 consumer use (MS, Claude, WhatsApp, ChatGPT teens) | partly | MS quote, Claude 18+ ("or minimum age to consent in your location, whichever is higher"), WhatsApp pre-teen no Meta AI, ChatGPT for Teens Study Mode default + quiet hours (2026-08-18) all confirmed. Not confirmed: that ChatGPT is 13+ (article states no age) and the "every other platform" universal. Microsoft's 13-17 gate applies to school IT-admin accounts, not consumer use | MS blog URL; https://www.anthropic.com/legal/consumer-terms ; https://techcrunch.com/2026/03/11/whatsapp-is-launching-parent-linked-accounts-for-pre-teens/ ; https://techcrunch.com/2026/08/18/openai-launches-a-safer-chatgpt-for-teens-years-after-teens-started-using-it/ |
| 4 | MS AI Code of Conduct v4.0 (2026-05-01) bans emotion inference from speech etc.; Taxila Azure-only so voice emotion inference is a breach today | partly | Quote (item 12), v4.0 date, age-vulnerability ban (item 7, qualified: "materially distorting behavior ... significant harm") and synthetic-voice disclosure all verified. "Breach today" is a conditional: it bites only if Taxila attempts to infer emotion from speech/face. The code lists no education exception; the only exception is safety-system evaluation | https://learn.microsoft.com/en-us/legal/ai-code-of-conduct |
| 5 | Gemini API bars services likely accessed by under-18s (updated 2026-04-28); Anthropic allows minor products with safeguards | supported | Verbatim clause and date. Anthropic: guidelines require age verification, moderation, AI disclosure, COPPA-type compliance, enforced via suspension. They are framed as guidelines, not a contract grant | https://ai.google.dev/gemini-api/terms ; https://support.claude.com/en/articles/9307344-responsible-use-of-anthropic-s-models-guidelines-for-organizations-serving-minors |
| 6 | Google pedagogy evidence: +31% vs GPT-4o; 73.2% arena (189 educators, 206 judges); Eedi 165 students 66.2 vs 60.7; Learn Your Way n=60, ages 15-18, 78 vs 67; no big-tech RCT on autonomous under-13 tutor | supported | All numbers match. Note 66.2 vs 60.7 is vs human tutors alone, not vs no tutoring. The "no RCT" negative was not independently searchable | https://arxiv.org/abs/2412.16429 ; https://arxiv.org/abs/2505.24477 ; https://arxiv.org/abs/2512.23633 ; https://research.google/blog/learn-your-way-reimagining-textbooks-with-generative-ai/ |
| 7 | Read Along: Diya, English + 7 Indic languages, offline on 1 GB RAM, UP/Telangana/Gujarat, TN 18 lakh+ children, 1 crore+ stories | partly | Facts confirmed. "Holds Hindi reading-speech data at state scale" is an inference not on the page (data retention not stated) | https://readalong.google/intl/en_in/fln/ |
| 8 | Jan 2026 MAU 180M/118M/19M/12M; India ~20% downloads, ~1% revenue; ChatGPT 100M+ weekly users in India, #2 market; Gemini highest learning usage | partly | MAU, download/revenue split and Gemini learning claim confirmed. Wrong metric: Altman's figure is "100 million monthly active users" in India (TechCrunch 2026-02-18), not 100M+ weekly. #2 market confirmed | https://techcrunch.com/2026/02/24/india-ai-boom-pushes-firms-to-trade-near-term-revenue-for-users/ ; https://techcrunch.com/2026/02/18/openai-pushes-into-higher-education-as-india-seeks-to-scale-ai-skills/ ; https://techcrunch.com/2026/01/29/india-is-teaching-google-how-ai-in-education-can-scale/ |
| 9 | Price expectation near zero: AI Plus Rs199 x6 then Rs399, 5 family; Jio AI Pro 18 months free; student year free by 31 Dec 2026; ChatGPT Go free from 11-04; unlimited free text 2026-08-06, voice metered | partly | All confirmed except voice: article says only "separate limits for files, images, voice, and image generation", no detail on how voice is metered. Jio offer is limited to "a certain carrier plan". Student offer converts to $4.99/mo (local equivalent) after the year | https://techcrunch.com/2025/12/10/google-launches-sub-5-ai-plus-plan-in-india-to-compete-with-chatgpt-go/ ; https://blog.google/intl/en-in/products/start-the-academic-year-with-one-year-of-gemini-on-us/ ; https://techcrunch.com/2025/10/27/openai-offers-free-chatgpt-go-for-one-year-to-all-users-in-india ; https://techcrunch.com/2026/08/06/openai-brings-unlimited-chatgpt-text-chats-to-free-users/ |
| 10 | 140M weekly maths/science users; visuals for 70+ topics; Socratic study modes free everywhere (OpenAI Jul 2025, Gemini Aug 2025, Claude Apr 2025, Copilot 2026) | partly | 140M and 70+ confirmed verbatim; OpenAI Study Mode free from 2025-07-29 confirmed. Gemini Guided Learning and Claude learning mode dates/free status not re-fetched; Copilot Study and Learn is NOT available to under-13 and is school-admin-gated, so "free everywhere" overstates | https://techcrunch.com/2026/03/10/chatgpt-can-now-create-interactive-visuals-to-help-you-understand-math-and-science-concepts/ ; https://techcrunch.com/2025/07/29/openai-launches-study-mode-in-chatgpt/ |
| 11 | Big tech positions AI as supporting teachers; no product reports mastery to parents; parent features are safety controls; Meta Insights not in India | partly | Google quote ("not replace it") and MS ("Educators remain in control") verified. Meta Insights launched in US/UK/AU/CA/BR with "global rollout in coming weeks"; India not named at launch, so "not available in India" is unconfirmed as of today. The "no product reports mastery" negative is unverified | https://techcrunch.com/2026/01/29/india-is-teaching-google-how-ai-in-education-can-scale/ ; https://blogs.microsoft.com/blog/2026/09/16/microsofts-commitment-for-ai-in-education/ ; https://techcrunch.com/2026/04/23/meta-will-now-allow-parents-to-see-the-topics-their-child-discussed-with-meta-ai/ |
| 12 | Emotional AI relationships with minors are what regulators punish: Common Sense ratings; Meta pause; $942M New Mexico; OpenAI restrictions after Raine | wrong (in part) | Common Sense ratings and Meta teen AI-characters pause confirmed. $942M New Mexico case is about social media harms (addictive design, exploitation), not AI companions, so it does not support the claim. Age prediction article only loosely ties to teen suicides; Raine causation is implied, not stated | https://techcrunch.com/2025/09/05/google-gemini-dubbed-high-risk-for-kids-and-teens-in-new-safety-assessment/ ; https://techcrunch.com/2026/08/07/new-mexico-court-orders-meta-to-pay-additional-567m-in-child-safety-case/ ; https://techcrunch.com/2026/01/23/meta-pauses-teen-access-to-ai-characters-ahead-of-new-version/ |
| 13 | WhatsApp Business ban on general-purpose bots from 2026-01-15; structured flows allowed; Italy and Brazil excluded | supported | New users bound since 2025-10-15, existing users 2026-01-15. TechCrunch frames Jan 15 as the start of a 90-day grace period. The "templated parent updates only" advice is a recommendation, not a fact | https://respond.io/blog/whatsapp-general-purpose-chatbots-ban ; https://techcrunch.com/2026/01/15/after-italy-whatsapp-excludes-brazil-from-rival-chatbot-ban/ |
| 14 | Big tech enters via partners: OpenAI (IIT Delhi, IIM-A, AIIMS, PW, upGrad, 5 lakh licences); MS $17.5B 2026-29, 20M by 2030, PW on Azure OpenAI; Anthropic-Pratham 6,000; Google 40,000 KV teachers, Rocket Learning's Appu | partly | MS $17.5B/2026-29/20M-by-2030 verified. Pratham ATM 6,000 learners verified (15,000 more planned 2026). IIT Delhi/IIM-A/AIIMS, PW, upGrad, 40,000 KV teachers verified. OpenAI's 5 lakh licences are not in the cited TechCrunch page (only the Business Standard headline, 2025); PW partnership is for AI courses, and "PW on Azure OpenAI" plus Rocket Learning/Appu grant could not be re-verified (search budget exhausted) | https://techcrunch.com/2026/02/18/openai-pushes-into-higher-education-as-india-seeks-to-scale-ai-skills/ ; https://news.microsoft.com/source/asia/2025/12/09/microsoft-invests-us17-5-billion-in-india-to-drive-ai-diffusion-at-population-scale/ ; https://www.pratham.org/2026/02/16/pratham-partners-with-anthropic-to-enable-ai-learning-tools-for-learners/ |
| 15 | Scenario probabilities to Oct 2028 (90/60/35/25/10%) | unsupported | Author judgement [U]; no external source can confirm or refute. Treat as priors, not facts | bigtech.md section 8.5 |
