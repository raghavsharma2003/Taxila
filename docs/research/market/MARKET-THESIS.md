# Taxila — Market Thesis (synthesis)

**Date:** 2026-10-02 · **Role:** synthesis of the nine market reports in this folder, using each report's fact-check
section. **Status:** proposal for the main loop. Decisions are drafted for `context/` via
`context/inbox/market.json`, and each one has a reversal condition.

**Inputs (all in `docs/research/market/`):** `india-incumbents.md`, `india-ai-native.md`, `global-ai-tutors.md`,
`bigtech.md`, `china-asia.md`, `market-size.md`, `tutor-substitution.md`, `gtm-distribution.md`, `failures.md`,
`pricing-unit-econ.md`, plus the JSON/py data files beside them. The earlier `../tech-and-market.md` and
`../learning-science.md` are also used.

**Evidence tags**, as in the source reports:
- **[V]** verified at the primary source.
- **[S]** secondary source.
- **[U]** unverified.
- **[D]** derived: arithmetic on [V]/[S] inputs, using a model in this folder.
- **[A]** assumption.

A claim that a fact-check marked *partly* or *wrong* is used here only in its corrected form. §7.3 lists every
number that failed fact-check.

**Method limit (read first).** The shared WebSearch budget (200 calls) was used up before most of the reports were
written. So:
- The evidence comes from direct fetches of known URLs, SEC filings, government PDFs and Play Store pulls run on
  2026-10-02.
- Reddit, Trustpilot, consumer forums, ET, Reuters and openai.com were blocked (403).
- No competitor product was tested hands-on.

This synthesis did no new searching. Each claim cites the sibling report section that holds the URL, plus the key
primary URL inline where it carries the claim.

---

## 1. The thesis on one page

### 1.1 Why now

1. **The old Indian K-12 model is dead, and the parents it burned are still in the market.**
   - BYJU'S is in insolvency. Its app has not been updated since 2024-06-11, and its newest-400 Play reviews
     average 2.39★ against 4.05 lifetime [V, `india-incumbents.md` §2].
   - upGrad bought Unacademy for $200M all-stock, about 94% below the 2021 peak [S, businesstoday.in
     2026-09-04].
   - Doubtnut and Meritnation are off the Play Store [V].
   - What killed these companies was selling and financing, not content [S/V, `failures.md` §0–§2]:
     fear-based commission sales, EMI loans, revenue booked up front, and ₹2.4–18 spent per ₹1 of revenue.
   - Demand did not go away. 27.0% of all students took paid coaching in 2025 (CMS:E, n=57,742 households) [V, PIB
     PRID=2160863]. Among low-resource households the figure is 38% (BaSE 2025) [V,
     edtechbase.centralsquarefoundation.org].
2. **Voice AI is now cheap enough on Azure first-party models to sell at Indian prices**, provided voice is a budget
   and not an open line.
   - A DIY cascade (MAI-Transcribe-2 → GPT-6 Luna/terra → Azure Neural TTS, with half the narration pre-rendered)
     models at **₹28 per session-hour**. Realtime-mini with a 1-turn audio window models at ₹132/h [D from V prices,
     azure.microsoft.com/pricing/details/speech + /azure-openai; `pricing-unit-econ.md` §3].
   - The luna-only cascade comes to $0.198/h. That is the ~$0.20/h PhysicsWallah says its own voice tutor costs [S,
     medianama.com 2026/08].
3. **Big tech has made generic study help free, and is staying out of under-13 consumer products by policy.**
   - ChatGPT for Teens and Study Mode, Gemini guided learning, and 70+ interactive visuals are all free [V/S,
     `bigtech.md`].
   - Claude is 18+. Copilot Chat is not offered to students under 13. WhatsApp pre-teen accounts have no Meta AI
     [V].
   - Google is the exception. Gemini in Classroom has been on by default for all ages since 2026-08-10 [V,
     workspaceupdates.googleblog.com 2026/08].
   - **So the age-6–12 band is the open segment, and classes 8–9 are already being absorbed by free tools.**
4. **The window is about 6–12 months.**
   - PW has a Socratic AI Tutor in beta that "remembers mistakes from six months ago" [S, MediaNama]. The "₹10/day"
     figure is not a stated tutor price: it is the price frame implied by PW's ARPU of under ₹4,000/yr.
   - Below class 9, PW still sells human mega-batches: CuriousJr, 400–500 students per batch, about ₹30k/yr [V,
     pw.live].
   - LEAD's Ms Curie (April 2026, K-8, classroom 1:1, Indian accents) is in 1,000+ schools [S, tribuneindia.com,
     cxodigitalpulse.com]. Today it is spoken English only.
   - **Expect a PW AI tutor in K-8 within 6–12 months.** This is an inference, not a disclosed plan
     [`india-ai-native.md`]. Treat PW's Q2 FY27 letter (about Nov 2026) as the trigger to re-plan.

### 1.2 Why Taxila wins, if it does

Taxila wins only where the two empty columns of the competitor matrix (§2) meet. No product found does both, and
none does them for ages 6–12 at home:

- **(a)** covert understanding checks that **re-teach in a different modality**;
- **(b)** a **Hinglish voice teacher who leads the session**.

Four moats compound on top of that:

1. **Verified, chapter-mapped teaching kits and misconception banks** for NCERT and state boards. Content
   transformation itself is *not* a moat: Learn Your Way, NotebookLM and ChatGPT visuals reproduce it [V,
   `bigtech.md`].
2. **An interpretable learner model that persists for months.** It is the thing a free study mode does not have.
3. **The parent loop**: weekly Hindi voice notes, a monthly PTM-style report, and homework *status*. This is the job
   tutors most often fail at. In 11,245 coded reviews, the parent-updates theme had the lowest rating (2.97★, n=107)
   [V, `tutor-substitution.md`].
4. **Published, pre-registered outcomes.** No Indian generative-AI tutor has any.
   - The bar is Mindspark: +0.36σ maths in 4.5 months in Delhi (ITT, 58% attendance) [V, NBER w22923 via
     `tutor-substitution.md`].
   - In Rajasthan government schools Mindspark gave +0.22σ maths and +0.20σ Hindi over 18 months [V,
     `india-ai-native.md`].
   - Independent AI-tutor effects are about 0.06–0.14σ (Khanmigo two-year RCT) [V,
     edworkingpapers.com/ai26-1551].

**What will *not* differentiate:**
- Warmth and memory: PW has said both out loud.
- Content generation.
- Answer engines: Gauth has 123M installs, Photomath 282M, Brainly 298M [V, Play].
- Hardware.

### 1.3 The wedge

| axis | choice | evidence |
|---|---|---|
| **class band** | **classes 4–7 core (ages 9–12), enrolment open 3–8.** Classes 8–9 are for retention, not acquisition. | Big tech covers 13+ for free [V]. Maths and science are the top EdTech subjects (74% / 57%, BaSE) [V]. PW is strongest from class 9 [S]. Covert checks are easiest to read in maths [`gtm-distribution.md` §6.1]. Phone access is 67–74% in this band [V, BaSE]. |
| **board** | **CBSE/NCERT graph first.** RBSE is the second board, mainly through B2B2C. | NCERT is the largest common spine. Rajasthan has 51% private-school share but only 6% tuition, so it suits B2B2C [D, `market-size.md` §7]. Korea's AI textbook shows what a broad launch costs [S, `china-asia.md`]. |
| **subject** | **maths + science** (EVS for classes 3–5), with the Hindi/English reading track added when classes 1–3 parents ask for it | BaSE subject demand [V]. Launch narrow and measurable [`china-asia.md` lesson 7]. |
| **language** | **Hinglish voice**: Hindi grammar with English technical terms. Hindi-medium vocabulary switch. | Hindi belt is 93.5M of 185.1M K-9 children (50.5%) [V, UDISE+ 2025-26]. 57% of urban internet users prefer Indic languages [V, IAMAI-Kantar 2024]. |
| **geography / city tier** | **Tier-2 Hindi-belt cities.** Two cells: **Lucknow–Kanpur** (school-seeded, parent-paid) and **Patna** (direct to parent). | UP has 1,07,905 private unaided schools, 32% of India's [V, UDISE+]. Bihar has about 60% tuition incidence and alone accounts for 37% of SAM-1 [D, `market-size.md` §5.4]. |
| **household** | **mid-fee affordable private school families (₹500–2,000/month fees)**, either paying for a tutor or with no tutor | Smartphone access is 74–87% here vs 64% below ₹500 fees [V, BaSE]. ₹299 is 15–60% of the fee [D]. Taxila is *not* cheaper than ₹400/month group tuition, so that household is not the beachhead [D, `tutor-substitution.md`]. |

**Where the reports disagree, and how this synthesis settles it.**

- *Rural low-income Bihar group-tuition families.* `market-size.md` points to Bihar + UP B2C as the largest pool.
  `tutor-substitution.md` argues these are the hardest households to win: they buy custody and routine at ₹8–34/h,
  which Taxila cannot match.
  - **Resolution:** urban Patna becomes a measured D2C cell, not the launch market. Rural Bihar comes later,
    possibly through supervised "Taxila rooms".
- *Class band.* `bigtech.md` says classes 1–7, `india-ai-native.md` says 1–8, `gtm-distribution.md` says 4–8.
  - **Resolution:** 4–7 is the core because three reports converge there. The product stays usable from class 3.

### 1.4 The "replace the tutor" ladder

The external message is **"your child's own teacher at home, measured"**, never "replace your teacher". Schools will
not promote their own replacement, and outcome-overclaiming is failure pattern B7 [`failures.md`]. The ladder below is
for internal planning.

| rung | tutor job replaced (`tutor-substitution.md` J1–J9) | product mechanism | gate to climb to the next rung |
|---|---|---|---|
| **1. Coexist (launch)** | J3 explanation and doubts; J7 practice and revision; J6 parent reporting | Teacher-led voice sessions; covert check → re-teach in another modality; weekly Hindi voice note | Month-3 paid retention ≥ 35–40%; tutor dialogue present in ≥ 80% of mistake moments |
| **2. Homework** | J1 homework done; J2 exam readiness | Diary and worksheet photo capture → help ladder with a leak guard (never the final answer); daily "done" card for the parent; exam-week boost | Homework completion ≥ 80% (parent-confirmed); unit-test delta vs. the child's own baseline |
| **3. Accountability** | J4 routine and attendance (through the parent) | Anchor slot; voice call at slot time; missed-session alert; regularity reported out of 28 days | ≥ 25% of paying families drop all tuition for a subject by day 90, with homework at ≥ 80% (TS1 reversal) |
| **4. Replace, with evidence** | J2/J4 for whole subjects; J5 custody, only in B2B2C | Ghar Tutor ₹999 plan; "Taxila room" with one local supervisor per 15–20 children (the Mindspark pattern) | Pre-registered independent result of ≥ 0.2σ in a term or year |
| **never** | J5 custody at home; J8 insurance with the school teacher | Do not market against these | — |

---

## 2. Competitor matrix (37 products)

**Columns:**
- **Voice Hindi?** Does a two-way Hindi or Hinglish *voice* tutor exist?
- **Covert assess?** Does it infer understanding without an explicit test and act on that, for example by
  re-teaching?
- **Generative content?** Does it make content on the fly per child?
- **Threat:** H (high), M (medium) or L (low) inside Taxila's wedge over the next 24 months.

Sources are the scoreboards in `india-incumbents.md` §1–2, `india-ai-native.md` §1, `global-ai-tutors.md` §2,
`bigtech.md` and `china-asia.md`. Tags follow those tables. Play figures are from the 2026-10-02 pulls [V].

| # | product | segment | voice Hindi? | covert assess? | generative content? | price (family) | traction | threat | our angle |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **PW (Ask AI, AI Guru, Socratic AI Tutor beta)** | classes 6–12 + exams | **Yes**: Ask AI voice bot; Awaaz TTS trained on 1,000 h of teacher voice [V] | Partial: AI Tutor "remembers mistakes" [S]; nothing shown on re-teaching in another modality | Text/image doubt answers; AI Grader | ₹4,104 average collection per user (period not stated) [V]; AI Tutor cost ~$0.20/h [S] | 5.34M paid users; 3.3M DAU (all PW) [V] | **H** | Ages 6–12 child voice; chapter-mapped interactive kits; parent loop; outcomes. Beat them to K-8. |
| 2 | **PW CuriousJr** | classes 1–8 (Play listing) live human | Human Hinglish teachers | No | No | ~₹30k/yr for a batch [V]; ₹29 demo | 5.5M installs; newest 4.72★, 6% low [V]; 4× revenue YoY [S] | **H** | 1:1 attention vs batches of 400–500; covert checks; ₹699–999 vs ~₹2,500/month |
| 3 | **LEAD Group (Ms Curie)** | K-10 affordable private schools, B2B | English speaking only today [S] | No (analytics) | Animated tutor claim [U] | ~₹943/student/yr through schools (derived; not comparable to an ARPU) | FY26 ₹386.6 cr revenue, EBITDA +₹30 cr, net −₹34.5 cr; ~41 lakh students [S] | **H** (B2B2C) | Evening at-home companion to the school book; possible partner. Watch Ms Curie going Hindi. |
| 4 | **Vedantu (Ved AI mentor)** | classes 1–12 live + 1:1 | Human | No | No | Group from ₹9,000/yr; 1:1 ₹800–888/h [V] | FY25 ₹227 cr, PBT −₹210 cr [S]; 50.3M installs [V] | M | 30–40× cheaper per tutor-equivalent month; no sales calls |
| 5 | **BYJU'S** | classes 4–10 + Early Learn | No | No | No | Legacy bundles | Insolvent; 127.8M installs; newest 2.39★ [V] | L | Win its burned parents with transparency: monthly plans, one-tap cancel |
| 6 | **Unacademy (upGrad)** | test prep | No | No | No | ₹4–18,000 in-app [V] | Acquired at $200M; FY25 loss ₹435 cr [S, corrected] | L | Not in K-9 |
| 7 | **Toppr** | after-school 5–12 | No | No | No | n/a | Absorbed by BYJU'S; Toppr Ask package still live at 1.69★ [V] | L | — |
| 8 | **Extramarks** | K-12 schools + B2C | No | No | No | ₹616/month [S; fact-check: unverified] | FY24 ₹233 cr (−37%) [S]; 14.6M installs, 3.42★ newest [V] | L–M | Its weak student app (36% low-star) is the gap |
| 9 | **Embibe (Jio)** | school + test prep | Unknown | Analytics only | 3D videos | ₹500/student/yr "as low as" (2023) [S] | 6.1M installs; 3.53★; paywall top complaint [V] | M (Jio distribution) | Product pull; avoid the free-to-paid paywall backlash |
| 10 | **Aakash / Meritnation** | foundation 8–10 | No | AI SWOT analysis [S] | No | coaching fees | FY26 ₹2,041 cr, EBITDA ₹15.3 cr [S] | L | Above the wedge |
| 11 | **ALLEN (Doubtnut)** | 6–12 photo doubts, Hindi | No | No | No | freemium | Doubtnut spent ₹194 cr to earn ₹10 cr (FY22) [S] | L | Shows that reach is not revenue (B9) |
| 12 | **Infinity Learn (Sri Chaitanya)** | 6–12 | No | No | No | courses + EMI | 1.4M installs; 3.32★; refund is the top complaint [V] | L | Anti-pattern |
| 13 | **Cuemath** | maths 1:1, K-12, US-led | Human, English | Human teacher | No | ₹610–900/class + GST; 12-month G3-5 ₹83,200 + GST [V, corrected] | FY25 ₹156.6 cr, net −₹46.9 cr [S, corrected] | M (premium urban) | Ghar Tutor ₹999/month is about 1 Cuemath class |
| 14 | **Seekho Jr** | kids' Hindi edutainment | No (video) | No | No | ₹99–999 in-app [V] | 9.8M installs; 4.52★ [V]; parent Seekho spends 95% of revenue on ads [S] | L–M | Placement by diagnosed level (Seekho Jr complaint) |
| 15 | **Kutuki** | preschool 3–7 | No | No | No | ₹99–299 [V] | 5.5M installs; dormant since 2025-04 [V] | L | — |
| 16 | **Vidyakul** | Hindi state boards 9–12 | Human video | No | No | courses | 7.8M installs, 4.28★ [V] | L | Above the wedge; proves Hindi-board demand |
| 17 | **Filo** | instant human tutor doubts | Human | No | No | in-app | 7.2M installs, 4.39★ [V] | L–M | Live human on demand vs a teacher who knows the child |
| 18 | **YoLearn.ai** | claims 1–12; usage skews 9–12 [S] | Claims Hindi/Hinglish + 22 languages [S]; untested | Not shown | **Yes**: sketchpad, diagrams, mind maps [V] | Token packs; in-app ₹4–18,000 [V] | 100k+ installs; 4.23★ (375 ratings; newest suspected gamed) [V]; ABP stake [V] | M | Closest feature match, small traction. Beat it on child voice and K-7 focus. |
| 19 | **SpeakX** | English speaking, teens/adults | Hindi-medium scaffolding [S] | No | Role-play voice | ₹299/month [S] | ~2 lakh paid; FY26 ₹45 cr; ~30% retention [S] | L (different job) | Proves the Hindi belt pays ₹299/month for AI-only voice. It is the retention baseline. |
| 20 | **ConveGenius SwiftChat / PAL** | government schools 1–10, B2G | Multilingual bots [V vendor] | Adaptive PAL | Bots | Free to students; PAL ₹1,700–2,100/student/yr [V vendor] | 5M+ installs [V] | M (B2G) | B2G after an RCT |
| 21 | **Rocket Learning – Appu** | ages 3–6, NGO | **Yes**, Hindi first [S] | No | Activities | Free | ~1 lakh users at launch [U] | L (age band) | Hand-off from age 6; possible partner |
| 22 | **Wadhwani AI (ORF)** | primary reading assessment, B2G | Listens to Hindi/Gujarati reading | Assessment only | No | Free to states | 7.9M students assessed [V] | L | Its ORF methods inform the reading track |
| 23 | **DIKSHA / AskDIKSHA / Bodhan AI** | government K-12 | Read-aloud; Bhashini | No | No | Free | DIKSHA 5 Cr+ downloads; 2% child reach (BaSE) [V] | M (if Bodhan ships a free student tutor) | Closes B2G if it ships; watch |
| 24 | **Khan Academy / Khanmigo** | K-12, global | Khanmigo in Hindi for teachers [S] | Partial: prompts "explain your thinking" | Gemini diagrams (Aug 2026) [V] | $4/month learner [V] | KA 33.8M installs [V]; RCT 0.06–0.08σ ITT [V] | M | The tutor must lead. Its 17% engagement is the anti-pattern. |
| 25 | **Duolingo Max / Video Call** | language | No | No | AI calls | Super/Max tiers | 58.7M DAU, 12.7M paid, CURR 84%, GM 72.6% (Q2-26) [V] | L | Retention benchmark (CURR, DAU/MAU 41.7%) |
| 26 | **Speak** | adult English speaking | No | Error identification ~80% [V vendor] | Voice lessons | ₹1,199–26,000 in-app [V] | $1B valuation [V] | L | Turn-taking craft benchmark (tap-to-finish; 476/477 steps delivered) |
| 27 | **Praktika** | adult language avatars | No | No | Avatars | ~$8/month [V] | 20.4M installs [V] | L | Paywall complaints are the anti-pattern |
| 28 | **Synthesis Tutor** | K-5 maths, US | No (English) | Mastery micro-assessments [V] | Manipulatives (hand-built claim [U]) | $25–35/month; family plan (price varies) [V] | 100k+ students [V] | L | Family-plan pattern |
| 29 | **Ello** | reading 4–9, US | No (English) | Reading assessment | Books | Premium (price not found) | Small on Android [V] | L | Safety lines to adopt: no "I love you", no "I'm real" |
| 30 | **Amira** | K-5 reading, B2B US | No | Oral-reading assessment | No | District contracts | 5.5M students [V]; g 0.03–0.22 (vendor-paid) [V] | L | ASR "faithful" path for reading |
| 31 | **Gauth (ByteDance [U])** | 12–18 photo-solve | No | No | Atlas visuals [V] | ₹7–10,000 in-app [V] | 123M installs global [V] | M (classes 8–9 homework) | Never answer-first; photo → attempt → verified steps |
| 32 | **Photomath (Google)** | photo maths | No | No | Animated steps | $9.99/month [V] | 282M installs [V] | M | Same as Gauth |
| 33 | **Brainly** | Q&A, 10–18 | No | No | AI companion (US) | in-app | 298M installs [V] | L–M | Same as Gauth |
| 34 | **Question.AI / QANDA** | photo-solve; Hindi listing | No | No | No | in-app | 27.5M / 81.5M installs global [V] | M | Answer engines are commoditised, which is why the China ban targeted photo-search |
| 35 | **ChatGPT (Teens, Study Mode, Go)** | 13+ | Voice mode; Hindi quality untested | No learner model | Visuals | Free; Go ₹399 free for 12 months from 2025-11-04 [V] | 100M MAU in India [S, corrected from "weekly"] | **H for classes 8–9**, L for 6–12 | Do not fight here; under-13 is closed by policy |
| 36 | **Google Gemini (app, Classroom, LearnLM, Read Along)** | all ages with Family Link; Classroom on by default | Gemini Live Hindi (Family Link status [U]) | LearnLM pedagogy; no learner model shown | Learn Your Way, NotebookLM [V] | Free; AI Plus ₹199 → ₹399 [V] | 118M Indian MAU [S] | **H (latent)**: ~25% chance of an assembled K-7 tutor by Oct 2028 [U, author judgement] | Watch quarterly; be partnerable |
| 37 | **Squirrel AI (China)** | K-12 adaptive | No | Knowledge-point tracing | No | Hardware + centres | 43M users claimed [V claim] | L (not in India) | Copy the granularity, not the efficacy claims |
| — | **Neighbourhood group tuition** | all classes | Human, Hindi | Human, informal | No | ₹400–900/month per child (~₹8–45/h) [D, CMS:E] | 49.6M K-9 takers [D] | **The real incumbent** | Do not compete on price; compete on explanation + reporting + proof |
| — | **1:1 home tutor (UrbanPro asks)** | all classes | Human | Human | No | ₹300–400/h asking price across tiers (n=798) [M]; ₹1,500–3,000/month typical | — | The replacement target for Ghar Tutor | ₹999 is 33–67% of the fee [D] |
| — | **Free Hindi YouTube (Magnet Brains, Dear Sir)** | classes 6–12 lectures | One-way Hindi | No | No | Free | 14.5M / 22.8M subscribers [V snapshot] | M (attention) | 94% of child EdTech use is YouTube [V, BaSE]. Use it as a proof channel, not a library. |

**What the matrix shows:**
- Only PW (#1) is "yes" on Hindi voice and moving towards covert assessment.
- YoLearn (#18) is the only one "yes" on generative content and claimed Hindi voice, but it is small and skews to
  grades 9–12.
- Nobody combines all three for classes 1–9 at home.
- The negative claim (that nobody does this) cannot be proven. It rests on the products examined here [S/U].

---

## 3. Market size (bottom-up; only fact-checked numbers)

Model: `market_size_model.py` (re-run in fact-check; reproduces). FX is ₹88/$ [A].

### 3.1 Inputs that survived fact-check

| input | value | tag |
|---|---|---|
| K-9 enrolled (UDISE+ 2025-26) | **185.1M** (class 9 estimated at 52% of classes 9–10, ±0.8M) | [V] + [A] |
| private unaided share | 37.9% (70.1M) | [V] |
| Hindi belt (11 states/UTs) | 93.5M (50.5%): UP 33.5M, Bihar 16.7M, Rajasthan 11.8M, MP 11.3M | [V] |
| primary enrolment trend | classes 1–5: −2.4% YoY | [V] |
| coaching incidence and spend | CMS:E 2025 (n=57,742; fieldwork Apr–Jun 2025); per enrolled student ₹1,313/2,189/4,183 by level | [V; reference period open, see §7] |
| rural tuition by state (ASER 2024) | Bihar ~59%, UP ~18%, Rajasthan 3.8–9.1%, MP 13.0–15.5% | [V] |
| child phone access (BaSE 2025) | 67% / 74% / 81% by grade band; 48% use the mother's phone | [V] |

### 3.2 Layers

| layer | definition | heads | value / yr |
|---|---|---|---|
| **TAM-0** | all K-9 enrolled | 185.1M | — |
| **TAM-1** | current K-9 household spend on coaching | 49.6M takers (26.8%) | **₹35,554 cr (~$4.0B)** [D] |
| **SAM-1 (core)** | Hindi-belt K-9 tuition-takers with phone access (16.3M) + non-Hindi-belt CBSE takers with phone access (2.8M) | **19.1M** (22.1M on the raw ASER basis) | They spend **₹12.3–14.5k cr** today [D, corrected lower bound]. At Taxila prices: ₹5,716 cr (₹299×10 months) to ₹9,539 cr (₹499×10) [D]. |
| **SAM-2 (expansion)** | SAM-1 + private-school non-takers with phones | 47.2M (upper-biased: the overlap is assumed independent) | ₹14.1–23.5k cr [D] |
| **B2B2C lens** | private unaided K-9 × ₹500–943 per student per year | 70.1M | ₹3.5–6.6k cr [D] |
| **Wedge (beachhead)** | private-school children in classes 4–7 in UP + Bihar urban, mid-fee band, with phones [A: ~4 of 9 class-years, ~30% urban, ~60% in the mid-fee band, 74–87% phone access] | **~2.0–2.5M** [D/A, this synthesis; not modelled in `market_size_model.py`] | ₹600–750 cr at ₹299×10; ~₹1,300–1,600 cr at a blended ₹650×10 [D/A] |

### 3.3 SOM (year 3) — restated consistently

`market-size.md` priced the SOM at 12 months but the SAM at 10, which overstates the ratio by about 20% (fact-check
12/13). Restated here on **10 billed months** and on a **tier-mix ARPU** rather than a single price:

- **Tier mix [A]:** 50% Saathi ₹299, 35% Tutor ₹699, 15% Ghar Tutor ₹999. That gives a blended list ARPU of
  **₹544/month**, or ₹461 net of 18% GST.

| scenario | avg payers | gross revenue/yr (₹544 × 10) | net of GST | % of SAM-1 heads | benchmark |
|---|---|---|---|---|---|
| conservative | 150k | ₹82 cr ($9.3M) | ₹69 cr | 0.8% | below SpeakX's ~2 lakh paid [S] |
| **base** | **400k** | **₹218 cr ($24.7M)** | ₹184 cr | 2.1% | about half of PW's 0.78M K-12 online *enrolments* (not unique students) [S] |
| aggressive | 1.2M | ₹653 cr ($74M) | ₹553 cr | 6.3% | 1.5× PW's K-12 online count; treat as a ceiling |

**Reading:**
- The market is not the constraint. ₹35.5k cr is already being spent, and the wedge alone is about 2M children.
- The binding constraints are unit economics (§4) and distribution (§5).
- The base SOM needs about 60k new payers a month at 15% monthly churn [D/A]. That works only if retention beats
  SpeakX (~30% at month 3) [S].
- Model a 1–2%/yr headcount decline, since primary enrolment is shrinking. Grow through ARPU and class span instead
  (class 10 per-taker spend nearly doubles) [D].

---

## 4. Pricing and unit economics

Model: `pricing_unit_econ_model.py` (reuses `../realtime-cost-model.py`; reproduces in fact-check).

### 4.1 Cost facts that drive everything

- **Two-way voice cost per session-hour on Azure** [D from V]. The figures rest on assumed VAD gating, terra share
  and pre-render share.
  - DIY cascade: ₹28.
  - Luna-only cascade: ₹19.
  - rt-2.1-mini with a 1-turn window: ₹132.
  - rt-2.1: ₹512.
  - mini unpruned: ₹1,063.
  - GPT-Live-1 at ₹299/h is **unverified**, because $3/h is not on the Azure pricing page.
- **TTS is about 52% of the cascade cost; the LLM is about 6%.** The levers [V]:
  - pre-render narration;
  - commit to TTS volume ($9.75 vs $15 per M characters, which needs a 400M-character/month commitment). That is
    −35% on TTS and −18% on the whole cascade lane;
  - keep terra calls rare.
- **Hour-for-hour tutor replacement is at best at par with the tutor.**
  - 26 h/month at 55% gross margin would need ₹2,283 on the cascade. That is *inside* the ₹1,500–3,000 tutor range.
  - On rt-mini it would need ₹10,106 [D].
  - Taxila is cheaper only because of the **lane mix**: about 30–35% two-way voice, the rest tap practice with
    cached narration (₹0.8/h). That mix is also where retrieval practice belongs pedagogically.
- **Year-1 content spend is the hidden killer at ₹299.**
  - At Forge content spend of $1.5 per child-month [A], the ₹299 plan's gross margin falls from 55.3% to 8.5%, and
    contribution falls from ₹136 to ₹21 per payer-month [D].
- **Payment rail.**
  - Web UPI via Razorpay costs 2.36% effective [V]; Play billing costs 15%.
  - That gap is worth 7–8 gross-margin points.

**Superseded cost figures in sibling reports (do not reuse):**
- ₹68–126/h on Sarvam list prices (`india-ai-native.md`). This is also out of scope under the Azure-only directive.
- ₹85–140/h "realtime-mini" (`market-size.md`).
- ₹42/h cascade (`tutor-substitution.md`).

All three predate the `pricing-unit-econ.md` Azure model that uses GPT-6 Luna prices.

### 4.2 Recommended tiers (adopted from `pricing-unit-econ.md` §7, with three synthesis changes)

| tier | price (web, GST incl.) | two-way voice / month | GM blended B3: mature / year 1 [D] | role |
|---|---|---|---|---|
| **Shuru** (free) | ₹0 | 0: one-way cached narration only; diagnostic; 1 chapter per subject; weekly summary | cost ≤ ₹6/MAU | acquisition, cache-only |
| **Trial** | 14 days; UPI Autopay mandate with a 48 h reminder | 15 realtime + 60 cascade min | ₹95 per trial; ~₹254 per payer at a 37.4% trial conversion (₹223 is a lower bound) | conversion |
| **Saathi** | ₹299/mo · **₹2,999/yr** | 90 cascade | 55% / **8.5%** | no-tutor families, B1–B2 |
| **Tutor** | ₹699/mo · ₹6,999/yr | 300 cascade + 30 realtime | 57% / 37% | subject-tutor substitute |
| **Ghar Tutor** | ₹999/mo · ₹9,999/yr · **+₹499 per sibling** | 420 cascade + 60 realtime | 57.5% / 43.5% | families paying a ₹1,500–3,000 tutor |
| Pro (later) | ₹1,499 | 540 cascade + 150 realtime | 55% / 46% | metro premium, after measurement |
| Top-up | ₹99 per +60 cascade min | | ~63% | exam weeks |
| School Lite (B2B) | ₹600–1,200 per pupil per year | none (tap + reports) | COGS must stay ≤ ₹30 per pupil-month | school seeding (Offer B) |

**Synthesis changes:**
1. **Annual Saathi is ₹2,999 (10× monthly), not ₹2,499.** `gtm-distribution.md` proposed ₹2,499. At 8.4× monthly
   the margin is 37% vs 47% at full-year median usage [D]. Keep 10× until month-4+ usage of annual payers is
   measured.
2. **In year 1, lead with Tutor ₹699 and Ghar ₹999; do not push ₹299 at volume.**
   - The GTM model's ₹1,267 LTV and ₹422 CAC ceiling assume 40% COGS at ₹299.
   - The pricing model's year-1 ₹299 COGS is about 73% of the ex-GST price (8.5% GM).
   - Year-1 ₹299 contribution is ₹21 × ~5 paid months ≈ **₹105 LTV**, so the CAC ceiling is **≈ ₹35** at 3× [D,
     this synthesis].
   - ₹299 at volume is gated on the central catalogue pre-build.
3. **Voice budgets are absolute and enforced by the cost governor.**
   - The degrade path is realtime → cascade → tap. The lesson never stops.
   - The child never sees a counter; the parent does.
   - This is a product invariant, not a pricing detail.

### 4.3 Unit-economics guardrails (gates, not targets)

| metric | gate | source |
|---|---|---|
| contribution margin after inference, by cohort | positive by month 3 | `failures.md` B4 |
| CAC payback | < 6 months | `failures.md` B4 |
| month-3 paid retention | ≥ 35% (SpeakX ~30% [S]) | `failures.md`, `india-ai-native.md` |
| blended LTV/CAC | ≥ 3 before scaling any paid channel | `gtm-distribution.md` |
| spend per ₹1 revenue | < ₹1.5. Every K-9 company that died spent > ₹3.5 [S] | `failures.md` §2 |
| Forge cost per lesson | ≤ $0.02 (₹299 tier) and ≤ $0.05 (₹999 tier) | `pricing-unit-econ.md` |
| sales and marketing / revenue | ≤ 25% (Gaotu 53.5%, Seekho 95%) [V/S] | `china-asia.md` |
| gross margin plan | plan on 35–46% (year 1); 55–58% mature; Duolingo's ~71.6% is the ceiling [V] | `pricing-unit-econ.md` |

**Grant runway.** $5k of Azure credit buys about 1,170 Ghar or 2,260 Saathi student-months [D]. That is a beta of
100–200 families for 6–12 months, not an open free tier.

---

## 5. GTM plan for the first 10,000 paying students

Base: `gtm-distribution.md` §6, with funnel numbers from `gtm_funnel_model.py`. All conversion rates are **[A]**
until the pilot measures them.

### 5.1 The facts the plan rests on

- How children find EdTech [V, BaSE 2025, N=7,866]:
  - school or teachers: 63%;
  - friends: 58%;
  - tuition teachers: 22%;
  - ads: 6%.
- Where they use it: YouTube 94%, WhatsApp 67%, DIKSHA 2% [V].
- Content-led PW spends 9% of revenue on marketing; ad-led Seekho spends 95% [V/S].
- Paid installs would need about 9.5% install-to-payer to hit CAC ≤ ₹422. The global medians are 2.1% (freemium) and
  10.7% (hard paywall) [V, RevenueCat 2026]. **So paid social is not the engine. Cap it at ≤ 15% of the acquisition
  budget.**
- WhatsApp's general-purpose AI chatbot ban (all users from 2026-01-15; India not exempt) [V] means WhatsApp carries
  **structured flows only**: the diagnostic, reports, billing and referral cards. Never tutoring.
- DPDP s.9(3) (from 13 May 2027) bans targeted ads directed at children [V, meity.gov.in DPDP Act PDF]. All
  audiences are parents and teachers, from day one.

### 5.2 Phased plan (today is 2026-10-02)

| phase | when | channel and cell | target paying students | gate to proceed |
|---|---|---|---|---|
| **0. Closed beta** | Oct–Dec 2026 | 100–200 grant-funded families from Lucknow and Patna, recruited through 3–5 friendly schools and tutors | 0 paid (instrumentation) | ASR word-error and latency gates on 7–11-year-olds' Hinglish; crash-free ≥ 99.5%; OTP-less login |
| **1. School pilot** | Nov 2026 – Mar 2027 (through finals) | 20 mid-fee APS in Lucknow–Kanpur (~3,600 pupils): 10 on **Offer A** (free to the school; parent upgrades; 0–15% revenue share), 10 on **Offer B** (school-paid Lite at ₹600–900 for the pilot year). Plus the **Patna D2C cell**: ₹2–3 lakh of CTWA + owned Hindi YouTube to mothers. | **~500** (20 schools × 15–20 = 300–400, plus Patna ~100–150) | §5.3 KPIs; choose A vs B by contribution per school-year |
| **2. Session sale** | Jan–Apr 2027 (sold before 1 April) | 150–300 schools (UP first; Rajasthan for B2B2C if UP sign rate is below 15%); referral loop on; annual plan promoted at results time | **~5,000** (250 schools × 20) | pilot KPIs met; learning pre/post vs matched classes |
| **3. Compounding** | Apr–Sep 2027 | referral (target 0.3 referred payers per payer at 90 days); CTWA scale-up in Patna and Lucknow if conversation → payer is ≥ 4.7%; one tracked YouTube creator test | **+2,500 referral, +2,500 D2C → ~10,000 cumulative paying by ~Sep 2027** | M3 retention ≥ 35%; positive cohort contribution after inference |
| deferred | — | B2G: only after an independent ≥ 0.2σ result, via a CSR-funded district pilot, never a free statewide MoU. Telco: at ~100k payers (carrier billing, zero-rating, never a free giveaway). | — | — |

**Acquisition budget to 10k payers** [D from base CAC, `gtm_funnel_model`]:
- school channel: 5,000 × ₹818 ≈ ₹41 lakh;
- CTWA: 2,500 × ₹333 ≈ ₹8 lakh;
- referral: 2,500 × ₹220 ≈ ₹5.5 lakh.

**Total ≈ ₹55 lakh (~$62k).** This is cash, not Azure credit, and its source must be decided. All CAC inputs are [A].

### 5.3 Pilot KPIs and kill criteria (from `gtm-distribution.md` §6.3)

| stage | target | kill or redirect if |
|---|---|---|
| school sign rate (qualified visits) | ≥ 25% | < 15% after 60 visits |
| parent activation (diagnostic within 14 days) | ≥ 40% | < 20% |
| trial start (of activated) | ≥ 40% | < 20% |
| trial → paid | ≥ 30% | < 15% |
| payers per school (Offer A) | ≥ 15 | < 7 |
| month-3 paid retention | ≥ 40% | < 25% |
| referred payers per payer at 90 days | ≥ 0.3 | < 0.1 |
| CTWA conversation → payer (Patna) | ≥ 4.7% | < 2% |
| Lite COGS per pupil-month | ≤ ₹30 | > ₹50 |
| learning (pre/post vs matched classes) | ≥ 0.2σ in a term | no difference → fix the product before scaling |

### 5.4 Funnel mechanics

1. **Free diagnostic: "Kaise pata?" ("How do we know?").**
   - Inside the 72 h CTWA window or after the school push.
   - The result goes to the parent **with a plan and a free next step, never as a fear trigger** (BYJU'S "tricky
     questions", B1).
2. **14-day voice-capped trial** with a UPI Autopay mandate, the full price shown, a 48 h WhatsApp reminder and
   one-tap cancel.
   - A/B test this opt-out trial against an opt-in trial.
   - Never copy Seekho's ₹1 → ₹799 ladder.
3. **Plans:** monthly, or annual at 10× with a stated pro-rata refund.
   - No EMI, no multi-year plans, no device bundles, no sales calls.
4. **Weekly Hindi WhatsApp voice note** (utility template, about ₹0.59 per parent per month) [S].
   - Plus a human reply within 24 h.
   - The report is the referral surface: first name only, parent-shared.
5. **Messaging:**
   - To schools: "an AI homework teacher who reports to you".
   - To parents: "tuition-quality help at home, with proof".

---

## 6. Top 15 failure patterns and Taxila's guardrails

From `failures.md` §3–4. Patterns B1–B9 are business patterns; P1–P6 are product patterns. Where the report marked a
threshold as judgement [D], it stays judgement until measured.

| # | pattern | evidence (tag) | product / business guardrail | early-warning metric |
|---|---|---|---|---|
| **B1** | fear-based, commission-driven selling to parents | BYJU'S ₹2 lakh weekly targets; "your son can be nothing" [S] | No outbound sales team paid per conversion and no counsellor visits. **The learner model and diagnostic never sell**: a diagnostic reaches the parent only with a plan and a free step. | parent-complaint share mentioning "call", "pressure" or "sales" > 1% of low reviews |
| **B2** | loan-financed multi-year prepaid bundles; revenue booked up front | BYJU'S: 54 of 110 complainants unaware of the loan [S]; Lido kept auto-debiting after shutdown [S] | Monthly plans, or annual with pro-rata refund. Revenue recognised over the term. No EMI or NBFC partners. | any EMI or loan partner proposal is an automatic no |
| **B3** | cancellation and refund friction, dark patterns | ~20% of new BYJU'S users asked for refunds [S]; Seekho ₹1 trial → auto-pay [V reviews] | One-tap cancel; 48 h pre-charge reminder; full price shown at mandate; CCPA dark-pattern audit before launch | refund-request rate > 5%; involuntary-charge complaints > 0 |
| **B4** | growth bought at negative unit economics | ₹17.96 spent per ₹1 of revenue (Doubtnut-class); death above ₹3.5 per ₹1 [S] | §4.3 gates: cohort contribution positive by M3; payback < 6 months; paid social ≤ 15% | spend per ₹1 revenue > 1.5 |
| **B5** | treating a demand shock as a structural shift | Vedantu collections −59% when schools reopened [S] | Size on tuition behaviour, not on pandemic or launch spikes. Cohort plans assume exam-season and summer churn (10 billed months). | M3 retention by cohort start month |
| **B6** | acquisition sprees, product sprawl | BYJU'S Tynker $200M → $2.2M [S] | One wedge (classes 4–7, maths + science, Hinglish) until the KPIs pass. No M&A before product-market fit. Content buys (BYJU'S/Toppr assets) only after an NCF-2023 and IP audit. | number of subjects × boards live before M3 ≥ 35% |
| **B7** | misleading outcome claims, celebrity marketing | Education was ASCI's #2 violator in 2022-23, 16.5% of modified ads; 97% of celebrity ads in violation (2022-23) [V] | Claims only from Taxila's own measured cohorts, with n, method and date. Never guarantee marks. Set expectations against 0.06–0.14σ. No celebrity ads. | any outcome claim without a `context/measurements.md` entry |
| **B8** | opaque finances, debt-financed growth | 2U: no profitable year 2012–2023, ~$908M debt [V]; BYJU'S FY23–25 unfiled [V] | Audited, on-time filings; no venture debt for customer acquisition; unit-economics dashboard shared with investors | late filing; debt for CAC |
| **B9** | reach without monetisation | Doubtnut 32M monthly reach → sold for ~₹83 cr [S] | The free tier is cache-only and conversion is instrumented. No answer-engine growth loop. | free MAU growth with flat payers for 2 months |
| **P1** | an answer/content moat commoditised by general AI; single-channel dependency | Chegg revenue −51%, market value −98.9% [V] | The moat is the learner model, verified kits, the parent loop and outcomes. Monthly substitution test against free ChatGPT/Gemini study modes. No channel > 50% of new payers. | the substitution test loses on any core job |
| **P2** | a passive tutor that waits to be asked | Khanmigo: students messaged in 17% of mistake sessions; effect equal to KA without AI [V] | The tutor leads every exchange: auto-start, specific answerable questions, "show me how you got that". Sessions scheduled by the Conductor; no "ask me anything" home screen. | tutor dialogue in < 80% of mistake moments (report the median, not the mean) |
| **P3** | promise–delivery gap; unreliability | bugs/login/OTP = 22% of 1,895 low reviews across 20 apps (overlapping regex) [V] | Reliability is a launch gate: OTP-less login (WhatsApp/Truecaller), crash-free ≥ 99.5%, offline or degraded mode, a verified fallback kit for every generated asset, and a delivery log the parent can see | crash-free < 99.5%; login success < 99.5% |
| **P4** | the teacher the child bonded with changes or disappears | Unacademy educator exits; Replika's forced behaviour change → user distress [S] | Freeze and version the persona; persona-regression evals before any model upgrade; memory survives model changes; parents told of any change the child would notice | persona-eval drift; post-upgrade churn |
| **P5** | wrong language, medium or curriculum | Korea AIDT adoption 37% → 19% and demoted in one semester [S]; Vedantu Hindi gap [S] | Hindi-belt Hinglish first; exact NCERT chapter mapping; placement by diagnosed level, not grade (ASER); kid-speech ASR WER gate | WER on child Hinglish; reading-level cap breaches |
| **P6** | child safety, privacy and emotional dependency treated as compliance to deprioritise | Replika Garante order (Feb 2023), Character.AI under-18 ban (Nov 2025) [V]; DPDP s.9 in force 13 May 2027 [V] | **Warmth and continuity yes, simulated intimacy no** (Ello lines: never "I love you", never "I'm real", regular AI reminders). Bond is three-way: teacher, child, parent. Parent-set session caps; no guilt-tripping. DPDP s.9 + CCPA are **launch blockers**. No emotion inference from voice or face (Azure Code of Conduct). | any intimacy-register output in red-team evals; DPDP readiness |

**Thesis stress test** (`failures.md` §5). Five owner-thesis phrases walk into these patterns. Each needs explicit
wording in `context/decisions.md`:

| thesis phrase | pattern it walks into | how to keep it safely |
|---|---|---|
| "replace all tutors" | B7 | Internal ladder only (§1.4) |
| "detect understanding covertly" | B1 | Never used to sell |
| "bond over months" | P6 / P4 | Warmth without intimacy; persona versioning |
| "generate everything on the fly" | B4 (cost) / P3 | Pre-build catalogue; verified fallbacks |
| "compliance deprioritised" | P6 | **Owner to revisit**, at least for DPDP s.9 and CCPA dark patterns |

---

## 7. Risks, open questions, and numbers that failed fact-check

### 7.1 Top risks (ranked)

1. **PW ships a K-8 AI tutor at about ₹10/day-equivalent pricing with YouTube-scale distribution** (inference,
   6–12 months). *Mitigation:* be first in classes 4–7 Hinglish voice with outcomes data and a parent loop. Re-plan
   on PW's Q2 FY27 letter.
2. **Google assembles the product**: Gemini Live Hindi for Family Link children plus Learn Your Way plus Classroom.
   The chance by Oct 2028 is about 25% [U, author prior]. *Mitigation:* stay model-agnostic and partnerable; watch
   quarterly.
3. **Unit economics at ₹299 in year 1** (8.5% GM). *Mitigation:* tier-mix lead (§4.2); grant-funded catalogue
   pre-build; TTS commitment.
4. **Distribution.** The school-seeded parent-pay channel is roughly break-even at 1.5× on parent revenue alone [D].
   *Mitigation:* the Offer B test; referral; the M3 retention gate.
5. **Human-likeness on the cascade lane is unmeasured.** If children and parents reject cascade voice, the ₹699–999
   plans cannot stay cascade-heavy. *Mitigation:* run the cascade-vs-realtime A/B (PU-2) first.
6. **Kid-speech ASR.** The only Indian study found near-universal ASR errors on proper nouns and Hindi loanwords, and
   replies about 10 grade levels too hard (FK 12, English output) [V]. *Mitigation:* WER and reading-level gates;
   consented child speech corpus.
7. **Regulation.**
   - DPDP s.9 (verifiable parental consent; no tracking or targeted ads to children) from 13 May 2027 [V]. The
     timeline may be compressed [S].
   - Whether the MoE 2024 coaching guidelines (under-16 restriction, misleading promises) reach online AI tutoring
     is **unverified**.
   - CCPA Dark Patterns Guidelines 2023: not yet fetched.
8. **Shrinking primary cohort** (classes 1–5 −2.4% YoY) [V].

### 7.2 Open questions (each with the measurement that closes it)

| # | question | measurement | priority |
|---|---|---|---|
| Q1 | Willingness to pay at ₹199 / 299 / 499 / 699 / 999 / 1,499, by tuition status | Parent jobs survey, n ≥ 400 (Bihar, Rajasthan, UP), 10-coin job allocation + Gabor-Granger; price smoke test in Patna and Lucknow | P0 |
| Q2 | Does cascade voice pass as "a real teacher" for 7–12-year-olds? | PU-2 A/B, cascade vs realtime, on retention + child preference + parent rating | P0 |
| Q3 | Kid Hinglish ASR WER and latency | Consented recordings of children aged 7–11; P95 end-of-speech → first audio | P0 |
| Q4 | CTWA conversation → payer in India K-12 | Patna ₹2–3 lakh test | P1 |
| Q5 | Offer A vs B contribution per school-year | 20-school pilot | P1 |
| Q6 | Does the CMS:E Apr–Jun fieldwork make TAM-1 a floor (partial-year reference)? | CMS:E full report, state tables and reference-period wording | P2 |
| Q7 | Effective tuition price per hour (group vs 1:1) | 30-household tuition diary | P2 |
| Q8 | Do the MoE 2024 coaching guidelines apply to online AI tutoring for under-16s? | Fetch the guidelines + counsel | P1 |
| Q9 | Is web/WhatsApp UPI checkout for an Android app compliant with Play policy? | Counsel + Play policy text; fallback is user-choice billing (~11% + gateway) | P1 |
| Q10 | Is a text-only affect signal (what the child says, task evidence) allowed under the Azure Code of Conduct? | Ask Microsoft in writing | P1 |
| Q11 | Hands-on teardown of YoLearn, PW AI Tutor, SpeakX, SwiftChat | One day with recorded child utterances (consented) | P1 |
| Q12 | Gaps the exhausted search budget left | NSS CMS:E private-tuition microdata; CuriousJr pricing (mystery shop); Extramarks/Embibe FY25; Reddit and consumer-forum complaints; LEAD Ms Curie roadmap | P2 |

### 7.3 Numbers that failed or were corrected in fact-check (do not reuse in their original form)

| original claim | status | use instead |
|---|---|---|
| Cuemath 12-month G3-5 = ₹63,458 + GST | **wrong** | ₹83,200 + 18% GST |
| Cuemath FY25 net loss ₹45.9 cr | **wrong** | ₹46.9 cr |
| Unacademy FY25 loss ₹436 cr | minor error | ₹435 cr |
| PW ₹4,104 "per paid user per year" / ₹342 per month | period **unstated** | "average collection per user", period not stated; per-month figures are [U] |
| LEAD 100% NRR | self-reported | tag [S, self-reported] |
| LEAD ₹943/student/yr | derived; not an ARPU | use as a B2B per-pupil ballpark only |
| LEAD Ms Curie animated character, ₹2,000 Fluento, 40% AI revenue | **not found** in sources | [U] |
| Human tutor "30–40× more expensive" | derived, not sourced | "Taxila ₹999 = 33–67% of a ₹1,500–3,000 tutor" [D] |
| UrbanPro asks "5–15×" the average taker's hourly price | corrected | ~4–20×; asks are not transacted prices |
| SAM-1 current spend ₹11.5–14.5k cr | lower bound wrong | ₹12.3–14.5k cr |
| SOM at 12 paying months vs SAM at 10 | inconsistent (~20% overstatement) | restated at 10 months (§3.3) |
| PW 0.78M K-12 online "students" | wrong unit | enrolments, not unique students |
| ChatGPT India "100M weekly users" | **wrong** | 100M monthly active users |
| "Google AI free for students for a year" | **wrong** | Google AI Pro, students 18+, deadline 15 Sep 2025 |
| Duolingo gross margin 69% | **wrong (superseded guidance)** | Q2 2026 72.6%; FY26 guidance ~71.6% |
| Duolingo "words spoken more than doubled" | not found | drop |
| Cuemath "₹2 of ad spend per ₹1" | **wrong** | ₹2 of *total* expenses per ₹1 of revenue |
| ConveGenius "1.9 years of schooling in 17 months" | **wrong unit** | 1.9 LAYS per $100 (GEEAP) |
| Airtel Perplexity "360M subscribers reached" | **wrong framing** | 360M eligible base |
| "Emotional AI with minors is what regulators/courts punish" (incl. $942M New Mexico) | **wrong** | NM penalties concern social-media harms; cite Garante/Replika and the Character.AI ban instead |
| Riiid "Indian partners" | unsupported | drop |
| Sal Khan quote on on-the-fly visuals; Synthesis "hand-builds" | not found | [U] |
| Khan Academy UP RCT "~3×" Tennessee; "strongest causal lever" | author arithmetic / inference | ~3.2× vs full use, ~7× vs ITT; plain Khan Academy plus a human, not AI |
| Mindspark as evidence of "tech beating tuition"; "the only rigorous evidence" | **overclaim** | control group was lottery losers, not tuition; other RCTs exist |
| Pratham Delhi "₹100 price cut" | wording wrong | a ₹100 price (vs free) cut enrolment ~17 pp |
| GPT-Live-1 $3/h → ₹299/h | **unverified** (not on the Azure page) | [U]; plan on rt-mini ₹132/h for the realtime lane |
| Trial cost ₹223 per payer | lower bound | ~₹254 at a 37.4% 14-day trial conversion |
| BYJU'S 60k → 14k staff | unconfirmed | Context: ~50k; 14k is the Indian entity |
| BYJU'S NCLT stay, K3 ₹16 cr vs ₹150 cr | unverified (Business Standard 403) | [U] |
| Seekho Jr "9-year-old" review | not found | drop |
| Rocket Learning Appu "only at scale", 1 lakh users | unsupported | [U] |
| Sarvam / Bodhan AI ₹500 cr | unsupported | drop the figure |
| Big-tech scenario probabilities (90/60/35/25/10%) | author judgement | priors, not facts [U] |
| 22% "bugs is the top complaint" | method caveat | overlapping English regexes; "a leading theme", not proven top |
| Parent-authored = 2% of low reviews | low confidence | loose regex (matches "beta"); directional only |
| Sarvam as "primary Indic speech vendor" | **conflicts with the Azure-only directive (2026-10-02)** | rejected; Azure Speech / MAI-Transcribe only |

---

## 8. Proposed context entries

These are drafted in `context/inbox/market.json`:

- **Decisions:**
  - `mk-wedge-k4-7-hinglish-tier2`
  - `mk-no-sales-no-emi-monthly`
  - `mk-tiers-as-voice-budgets`
  - `mk-year1-lead-699-999`
  - `mk-school-seeded-parent-paid`
  - `mk-warmth-not-intimacy`
- **Measurements:**
  - `mk-tam-k9-tuition`
  - `mk-azure-voice-cost-per-hour`
  - `mk-discovery-channels-base2025`
- **Rejections:**
  - `rj-paid-install-engine`
  - `rj-hour-for-hour-realtime`
  - `rj-passive-tutor`

The "never answer-first" homework rule is already in §6 (P1) and `tutor-substitution.md` TS-rules, so it is not a
separate node here.

**Interaction with an existing node.** `voice-realtime-model` says "Live teacher voice = gpt-realtime-2.1 full". On
the Azure model, gpt-realtime-2.1 costs about ₹512 per session-hour [D]. Paid tiers can therefore afford it only as a
budgeted minority lane. `mk-tiers-as-voice-budgets` carries a `constrains` edge to that node, and the main loop
should reconcile the two.
- **Constraints:**
  - `ct-no-voice-emotion-inference`
  - `ct-no-gemini-api-for-minors`
- **Open:**
  - `op-pw-k8-ai-tutor-watch`

---

## Addendum: gap-1-retention-benchmark-unit

*2026-10-02. Full workings: `gap-gap-1-retention-benchmark-unit.md`. Model: `retention_benchmark_model.py` →
`retention-benchmark-model-2026-10-02.json`. This addendum supersedes the retention inputs in §2 row 19, §3.3, §4.3
and §5.3. It does not replace their text.*

1. **SpeakX's "~30% M3 paid retention" was two figures merged.**
   - Inc42, 01 Sep 2026: *"paid user retention stands at around 30% on a monthly basis"*. No month index or cohort
     basis is given [wording V, number S]
     ([Inc42](https://inc42.com/buzz/exclusive-ms-dhoni-joins-edtech-startup-speakxs-cap-table/)).
   - Outlook Business, 16 Oct 2025: *"35% retention at month three"*. It is not stated to be paid [wording V,
     number S]
     ([Outlook Business](https://www.outlookbusiness.com/corporate/speakxai-raises-16-mn-from-westbridge-capital-eyes-regional-language-expansion-amid-profitable-growth)).
   - SpeakX sells monthly, quarterly and yearly plans [V] ([T&C](https://speakx.ai/terms-conditions)), so a blended
     "month three" figure is inflated by plan mix.
   - The literal reading of the 30% (70% monthly churn) is inconsistent with SpeakX's own stock and LTV/CAC [D].
   - **SpeakX is a claim, not a floor.**
2. **The primary benchmark is RevenueCat 2026** [V]
   ([report](https://www.revenuecat.com/state-of-subscription-apps/)):
   - monthly first renewal: IN/SEA **46%**; global category medians 53–61%;
   - second and third renewals: 65–77% and 73–82%;
   - monthly Y1 median: 8%;
   - yearly first renewal: IN/SEA **22%**.
   - These imply **M3 (3 renewals) ≈ 23% (IN/SEA) to 32% (global median)** and **3.4–4.2 paid months**.
   - Stock-equivalent monthly churn is **24–30%, not the 15% in §3.3** [D].
3. **Unit economics restated** [D]:
   - blended contribution LTV: **₹949–1,031**, replacing ₹1,267. The annual renewal input moves from 45% to 30%,
     and IN/SEA's own first-annual figure is 22% [V].
   - LTV/CAC = 3 CAC ceiling: **₹316–344**, replacing ₹422.
   - ₹1,267 is reproduced only at M3 ≈ 40%.
4. **§4.3 gate: M3 ≥ 35% stays, re-specified.**
   - Definition: S3 is the share of first *monthly* payments that make 3 consecutive renewals. It is measured at
     subscription level and excludes annual and quarterly plans, trials and school seats.
   - Benchmark: top third of global apps; about 1.5× the IN/SEA median.
   - Kill line: **< 23%**.
   - It is sufficient for CTWA (S3 ≥ 28.5% gives LTV/CAC 3 at ₹333 CAC) and for referral.
   - At their base CACs (₹818 and ₹1,000), school-seeded and paid social cannot reach 3× at any M3 under the median
     tail.
   - The §5.3 scale gate (≥ 40%) stays. It is now derived: 40% is the M3 that reproduces the GTM base LTV.
5. **§3.3 base SOM (400k): the inflow is restated.**
   - "60k/month at 15% churn" needs M3 ≈ 61%, i.e. 15% flat churn. Under the RevenueCat curve shape a 6.67-month
     life needs ≥ 55% even with a perfect first renewal. That is infeasible unless late renewal is ≥ 93%.
   - Realistic inflow is **95–118k new payers a month, monthly-only**, or **~46–49k a month with a 35% annual mix**.
   - With the annual mix, about 70% of the stock is on discounted annual plans, so year-3 gross is **~₹170–175 cr,
     not ₹218 cr**.
   - A retention-honest base is **~250–300k average payers** [A]. Keep 400k as the "M3 ≥ 35% and annual mix ≥ 35%"
     case.
6. **Docs to correct on their next edit.** Each carries the merged SpeakX figure; the corrected wording is in the
   gap file §4.
   - `failures.md`:226 ("as a floor");
   - `gtm-distribution.md`:61, :136, :374 (17% is the 2025 pooled monthly Y1; the 2026 per-app median is 8%), :411
     and :478;
   - `india-ai-native.md`:17 and row 6 ("35% at month 3" *is* in Outlook Business).

---

## Addendum: gap-2-missed-kids-live-and-selfstudy-competitors

*Added 2026-10-02.*
- **Full file:** `gap-gap-2-missed-kids-live-and-selfstudy-competitors.md`.
- **Data:** `gap2-playstore-2026-10-02.json` and `gap2-reviews-2026-10-02.json`. These were produced by
  `playstore_snapshot.py`, run unchanged, and by `gap2_playstore_meta.py`.
- **Tags:** as in §0.

**Products added to the §2 matrix.** Rows #38–#44 cover:
- **PlanetSpark** (M);
- **BrightChamps** (L);
- **Tata Studi** (L);
- **Teachmint AI Tutor** (M, as a school channel);
- **Classplus** (L);
- **Arivihan** (M);
- **Sparkl / Codingal** (L).

**None of them is "yes" on two-way Hindi voice, covert assessment, or per-child curriculum generation.** The §2
claim that "nobody combines all three for classes 1–9 at home" therefore **stands**. One caveat applies:
- PlanetSpark already sells K-8 parents packages in which AI sessions replace most human sessions. The company calls
  this "60:40 human:AI" [S]. Parents count only 20–24 human sessions out of every 120–200 [V, reviews].
- PlanetSpark is profitable by its own claim, with ~₹145 cr guided for FY26 [S].
- It could add a Hinglish curriculum lane. The estimated chance is ~15% by Oct 2028 [U]. The watch item for this is
  `op-planetspark-curriculum-lane`.

**Price frame (§4).** The Ghar Tutor ₹999 tier survives, but it is squeezed from both sides:

| reference point | price | relation to ₹999 | tag |
|---|---|---|---|
| BrightChamps | ₹600–772 per class + GST, in packages of ₹38.6–90k | ₹999 is 16–21% of the ≈₹4,800–6,200 monthly equivalent | [V/D] |
| PlanetSpark | ≈₹475–677 per session, in packages of ₹35–42k | ₹999 is 18–26% of the ≈₹3,800–5,400 monthly equivalent | [V reviews/D] |
| Tata Studi (self-study) | ₹899 per month | about the same | [V] |
| Arivihan (Hindi belt, classes 10–12) | ₹51 for a full syllabus | near zero | [V] |

The live-class sellers are enrichment products paid in one upfront lump. They are not the anchor; the ₹1,500–3,000
human tutor remains the anchor.

Tata Studi is the warning:
- Its newest reviews average 3.21★ [V].
- Tata Industries' FY26 annual report shows its "After School" content asset impaired to a net block of ₹0.45 cr
  (gross ₹90.3 cr) [V].
- The report states that "value in use … is lower than the carrying amount".

Even with the Tata brand, ₹899 a month for passive curriculum content did not sell. **Positioning rule (refines
`mk-year1-lead-699-999`):**
- Ghar Tutor is only ever compared with a human tutor.
- Saathi ₹299 is the only tier that may be compared with apps.
- **Reversal condition:** the Q1 price smoke test shows that the "tutor" frame converts no better than the "app"
  frame.

**CAC (§5).** PlanetSpark's advertising and promotion (A&P) fell from 155% of revenue (FY22) to 69% (FY23) and then
27% (FY24) [S→D]:
- A&P per payer works out to about ₹10k [D, assuming a ₹38k ticket], or about ₹19k fully loaded once counsellors are
  included [D/A].
- 50% of its learners are in tier-2 to tier-4 towns [S].
- BrightChamps' India entity spent 3.3× its revenue on A&P in FY23 [S→D].

These sellers can therefore bid about 30× the ₹333 payer CAC assumed for the Patna CTWA cell, in overlapping Meta
audiences. **Add a §5.3 KPI:**

| metric | target | kill or redirect if |
|---|---|---|
| cost per CTWA conversation | ≤ ₹20 | > ₹40 for 2 consecutive weeks |

Before any Patna spend, pull Meta Ad Library counts for these sellers' ads targeting Bihar. This has not been done,
because the Ad Library needs a logged-in session.

**Complaint evidence (confirms `mk-no-sales-no-emi-monthly`).** Share of the newest reviews that are money
grievances, using the same regexes as §2:

| product | share of newest reviews | sample |
|---|---|---|
| BrightChamps | 15.0% | n=193 (all its reviews), so low confidence |
| PlanetSpark | 12.2% | n=343 (all reviews); 42% of its low-star reviews |
| Vedantu | 1.75% | newest 400 |
| PW CuriousJr | 0.75% | newest 400 |

PlanetSpark's low-star text is about counsellors mis-stating how many sessions are taught by humans. **New rejection
for `context/` — `rj-undisclosed-ai-substitution`:**
- Never sell AI time as if it were human time.
- Never sell a pre-paid session count that mixes AI and human sessions.
- Any human time is a separately named line item.

**Not found (stated as gaps, not filled):**
- BrightChamps FY24/FY25 filings;
- Classplus FY25 filings;
- PlanetSpark FY25 cost lines;
- PlanetSpark's public price list (none exists on its site);
- any Jio or Airtel kids' AI-tutor bundle beyond `india-ai-native.md` §2.4;
- any Leverage-Edu-style kids pivot.
