# Gap 2 — the K-8 live-class and self-study competitors the 37-product matrix missed

**Date:** 2026-10-02 · **Scope:** PlanetSpark, BrightChamps, Tata Studi, the student-facing AI in Teachmint and
Classplus, plus Indian K-8/K-12 AI launches from 2025-26 that the existing reports do not cover (Arivihan, Sparkl,
Codingal; Jio and Airtel kids' bundles re-checked). · **Feeds:** `MARKET-THESIS.md` §2 (matrix), §4 (price frame),
§5 (Patna CTWA cell).

**Tags:**
- **[V]** verified at the primary source: a filing, the company's own page, a Play pull, or an annual report.
- **[S]** secondary source: Entrackr, Inc42, a trade press article, or a data aggregator.
- **[U]** unverified.
- **[D]** derived by arithmetic in this file.
- **[A]** assumption.

**Data files written for this gap (all in this folder):**
- `gap2_playstore_meta.py` → `gap2-playstore-2026-10-02.json`: Play metadata plus the newest-review stats, pulled
  2026-10-02.
- `gap2-reviews-2026-10-02.json`: the output of `playstore_snapshot.py`, run unchanged (newest 400, `lang=en`,
  `country=in`, the same theme regexes as every other report).

**Method limits (read first):**
1. **Not every app had 400 reviews to sample.** PlanetSpark's current app was only released 2025-05-30, so its
   "newest-400" is every review it has (n=343). BrightChamps Learner has only 193 reviews in total, going back to
   2021. Tata Studi's newest 400 span 2022-03 to 2026-09, which means it gets few reviews.
2. **The "refund/money" regex is broad.** It also matches *money*, *fraud*, *scam* and *paisa*. Read it as
   "money-grievance share". It is the same regex as the sibling reports, so the numbers compare across reports, but it
   is not a clean count of refund requests.
3. **No checkout was completed.** PlanetSpark publishes **no price** on its site (checked by curl on 2026-10-02; there
   is no pricing route and no ₹ figure in the HTML). Its prices therefore come from parents' own statements in
   reviews, plus one secondary source.
4. **The Meta Ad Library was not queried.** It needs a logged-in session or a token. Marketing intensity comes from
   filings only.
5. **Filings are missing for three companies.** BrightChamps FY24 and FY25, Classplus FY25 and PlanetSpark's FY25
   cost lines are not on Entrackr or Inc42 as of today. Tofler and Tracxn returned 403. Each gap is stated in the
   tables below rather than filled.

---

## 0. Answer in five lines

1. **The "nobody combines all three for classes 1–9 at home" claim survives.** None of the seven products added here
   has a two-way Hindi or Hinglish voice tutor. None infers understanding covertly. None generates content per child
   for the curriculum.
2. **PlanetSpark is the closest new analogue.** It sells K-8 parents a bundle where human teachers are a minority and
   AI sessions fill the rest (company figure "60:40 human:AI" [S]). Parents report that only 20–24 of every 120–200
   sessions are taught by a human [V, reviews]. But it teaches English communication in English, not the school
   curriculum in Hinglish.
3. **The Ghar Tutor ₹999 frame survives, but it is squeezed from both sides:**
   - **From above:** live-class sellers cost **₹3,800–6,200 per month-equivalent**, paid **₹35,000–90,000 up
     front** [V/D]. ₹999 is 16–26% of that.
   - **From below:** **Tata Studi** charges **₹899 a month** (₹933 a month on the annual plan) for self-study videos
     under a household brand [V].
   - **At the bottom:** Arivihan sells a whole Hindi-belt board syllabus for **₹51** [V].

   Ghar Tutor therefore has to be sold as *a tutor at a third of the price*, never as *an app*. App-like positioning
   lands it next to Studi's ₹899, and Studi is a product Tata has nearly written off (§3.3).
4. **PlanetSpark sets the paid-social benchmark the Patna cell bids against:**
   - Marketing was **155% of revenue in FY22, 69% in FY23 and 27% in FY24** [S, Entrackr].
   - Advertising spend works out to **≈₹10,000 per paying family** [D, using a ₹38k ticket].
   - Half its learners are in tier-2 to tier-4 towns [S].

   It can outbid a ₹333-CAC CTWA plan many times over, so the Patna cell needs a cost-per-conversation kill line, not
   just a conversion-rate one (§6).
5. **Live-class sellers have the worst money-grievance rates in any of our pulls.** BrightChamps is 15.0% of all
   newest reviews and PlanetSpark 12.2%, against 0.75% for PW CuriousJr and 1.75% for Vedantu. Their low-star text is
   dominated by counsellor mis-selling of the human-to-AI session mix. This directly confirms the
   `mk-no-sales-no-emi-monthly` decision.

---

## 1. Scoreboard

The Play figures were pulled on 2026-10-02 [V]. *Newest* is the newest-n sample from `playstore_snapshot.py`.

| product | class band | Hindi / Hinglish | AI voice or tutor | price (per month · per class) | FY revenue / loss | marketing % revenue | Play installs · lifetime ★ · newest mean ★ (n) | % low ★ | money-grievance share (all · low) | sales-pressure share (all · low) |
|---|---|---|---|---|---|---|---|---|---|---|
| **PlanetSpark** (`com.newplanetspark.native_android`) | ages 4–14 [S]; "early primary to early high school" [V listing]; plus adults (~18% of customers [S]) | English is the product. No Hindi offering found; teacher code-switching [U] | AI speaking-practice sessions, "SparkX" video analysis that scores clarity, grammar and pace [S]; "60:40 human:AI" [S] | No public price [V]. Parent-reported packages ₹35,000, ₹38,000 (80 classes), ₹42,000 (62 "learning classes") [V reviews]; ₹13k–65k per course [S]. **≈₹475–677 per session; ≈₹3,800–5,400/month at 8 sessions [D]**; ≈₹1,580 per *human-taught* session where 24 of 120 are human [D, one review] | FY23 ₹42 cr / −₹89.5 cr; FY24 ₹67 cr op (₹68.4 cr total) / −₹26.6 cr [S Entrackr]; FY25 ₹81.2 cr total / −₹28.8 cr [S Inc42]; FY26 guided ₹145–150 cr, "first profitable year" [S, company claim] | FY22 155% (₹46.6/30 cr); FY23 69% (₹29/42 cr); FY24 27% (₹18/67 cr) [S→D]; FY25 not disclosed | 192k · 4.47 · **3.72 (343, all reviews)** | 29% | **12.2% · 42.4%** | 7.0% · 24.2% |
| **PlanetSpark Parent App** | — | — | progress view | — | — | — | 2.2k · 4.36 · 4.57 (35) | 9% | 5.7% · 66.7% | 0 |
| **BrightChamps Learner** (`com.brightchamps.learner`) | grades 1–12 (4 bands: 1, 2–3, 4–6, 7–12) [V]; ages 6–16 [S] | None. The site has 0 mentions of "Hindi" [V, curl] | ChatGPT-based virtual tutor, launched UAE 2023-10 [S]; nothing India-specific found | **₹600–772 per class + GST**, packages of 50–150 sessions at **₹38,600–89,999** (list ₹50,600–1,20,000) [V, brightchamps.com/en-in/courses, 2026-10-02]; ≈₹4,800–6,200/month + GST at 8 per month [D] | India entity: FY22 ₹22.5 cr / −₹98.6 cr; FY23 ₹17.4 cr op / −₹159.5 cr [S Inc42]; FY24 "₹50–100 cr" (range only) [S Tracxn]; FY25 not found | FY22 188%; FY23 **334%** (₹58.2/17.4 cr) [S→D]. The India entity carries global costs, so these ratios overstate India intensity | 146k · 3.94 · **3.31 (193, all since 2021)** | 37% | **15.0% · 40.3%** | 1.0% · 2.8% |
| **Tata Studi** (`com.tce.studi`) | CBSE 1–10; ICSE 5–10; RBSE, UP and MP boards 9–10 only [V listing] | Hindi as a *subject* only. Reviews ask for Hindi medium ("only for English medium students") [V reviews] | No AI tutor. "Adaptive Studi Planner", spaced practice, self-tests [V] | **₹899/month; quarterly ₹2,999; yearly ₹11,200 (₹933/month); 36 months ₹31,800**. "We do not offer a refund"; card EMI [V, tatastudi.com/plansandpricing] | Tata ClassEdge Ltd (Studi + B2B ClassEdge, not split): FY25 ₹97.9 cr [S Tracxn]; **FY26 turnover ₹101.8 cr, PBT −₹26.6 cr, PAT −₹21.8 cr** [V, Tata Industries AR FY26, AOC-1]. After-School content impaired to a ₹0.45 cr net block [V] | **<1%**: the whole Tata Industries consolidated ad line is ₹0.72 cr (FY26) and ₹0.55 cr (FY25) [V] | 1.47M · 3.56 · **3.21 (400, 2022-03 to 2026-09)** | 42% | 0.5% · 1.2% | 5.0% · 12.0% (mostly 2022 "calls daily") |
| **Tata Studi Live** (`com.tce.studi.live`) | — | — | live classes | — | — | — | 27k · 4.08; last updated 2023-03-29 (dormant) [V] | — | — | — |
| **Teachmint** (`com.teachmint.teachmint`) | any tutor or school class | not stated [U] | student-facing **"AI Tutor"** that is scheduled and solves doubts (a 2026-07 review complains it "keeps going in circles" and the schedule can't be changed) [V review]; teacher-side AI homework and quiz generation [V listing] | Free to students. Revenue comes from Teachmint X/X2 classroom hardware [S] | FY25 ₹74.2 cr op / −₹46.6 cr; **FY26 ₹205.3 cr / −₹28.9 cr** before SBC [S Entrackr 2026-10-01] | not broken out ("advertising, outsourcing and other overheads", total cost ₹148 cr FY25) [S] | **20.5M** · 4.46 · 4.03 (400, 2026-06 to 10) | 18% | 0.2% · 1.4% | 0 |
| **Classplus** (`my.classroom.app`) | tutors' and coaching centres' own apps (white-label) | per tutor | no student AI tutor found [U]. Revenue is 96.6% SaaS [S] | SaaS ₹13k–50k/yr per educator + 15% commission [S Inc42] | FY24 ₹205.5 cr op (₹264 cr total) / −₹110.4 cr [S Entrackr]; FY25 not found | ad spend −7.3% YoY in FY24, amount not given [S] | 2.73M · 3.95 · 3.91 (400) | 26% | 5.8% · 22.1% | 5.8% · 22.1%. Note: these complainants are **educators**, not parents |
| **Arivihan** (`arivihan.technologies.doubtbuzzter2`) | classes 10–12 (MP, UP, RBSE, Bihar boards) + NEET [V listing] | **Hindi-belt, Hindi-medium**; listing partly in Hindi [V] | "AI Doubt Solving" by photo [V]; "fully automated tutoring" [S] | **"Full syllabus at just ₹51"** [V listing] | not found; $10M Series A (Accel, Prosus), 2026-09-30; >$15M total; 80% of subscribers in tier-3 or rural areas [S] | not found | **1.87M** · 4.75 · 4.79 (400 in **15 days**) | 4% | 0 · 0 | 0 · 0 (a high-velocity, uniformly 5★ sample: possible solicitation [U]) |
| **Sparkl** (`me.sparkl.student`) | grades 6–12, IB and Cambridge [S] | no | "AI-enhanced pedagogy" plus human tutors [S] | not found | $4M seed (2024-12) [S] | — | 805 installs · 4.27 [V] | — | — | — |
| **Codingal** (`app.codingal`) | K-12 coding | no | "AI & Coding" courses | not checked | not checked | — | 3.6k installs (app released 2026-05) [V] | — | — | — |

**Comparators already in the 37-product matrix, from the same regexes** [V, `playstore-snapshot-2026-10-02.json`]:

| product | newest mean ★ | % low ★ | money-grievance share (all reviews) |
|---|---|---|---|
| PW CuriousJr | 4.72 | 6% | 0.75% (3/400) |
| Vedantu | 4.52 | 9% | 1.75% (7/400) |
| Seekho Jr | 4.52 | 10% | 1.0% |

**Jio, Airtel and Leverage Edu (re-checked 2026-10-02):**
- No Jio or Airtel kids' AI-tutor bundle was found beyond what `india-ai-native.md` §2.4 already covers: Jio AI
  Classroom, which is a 4-week AI-literacy course (Oct 2025) [S, businesstoday.in]; Embibe inside Jio; and Airtel's
  Perplexity offer, which closed in Jan 2026.
- No Leverage Edu kids' pivot was found. Its Play apps are study-abroad, IELTS and TOEFL [V, search].
- **Outcome: no change.**

---

## 2. PlanetSpark — the one that matters most

### 2.1 What it sells
- It sells live 1:1 public speaking, creative writing and spoken English to ages 4–14 [V meta description; S age
  band].
- The live sessions are **packaged with AI sessions**:
  - The company describes the split as "60:40 human- and AI-driven training" [S, hdfcsky 2025-09/10].
  - Inc42 reports that ~25% of modules are AI-developed and that AI is used "for scoring, personalisation and
    conducting classes" [S, inc42 2025-03-29].
- **What parents say was actually delivered** [V, Play reviews 2025-07 to 2026-06]:
  - "120 sessions, but only 24 sessions by teachers, others like practice or AI sessions"
  - "200 classes, 20 class is trainer based, 40 classes are Practical … the rest 40 is AI based, which will only
    increase the screen time"
  - "only four classes held in month rest of classes are ai based"
  - "promised me … 80 class in the amount of 38000 but they just given me 40 classes"
  - "I paid ₹42,000 and received only 62 learning classes"
- **Why this matters for Taxila:**
  - The first large Indian K-8 seller to substitute AI sessions for human ones did it **inside a pre-paid human
    package, without making the mix clear**.
  - The backlash is specifically about *undisclosed AI substitution* plus counsellor promises.
  - That is a rejection Taxila should log: **never sell AI time as if it were human time, and never bundle the two in
    a pre-paid count** (§7).

### 2.2 Money
| FY | op revenue | net loss | A&P | A&P / revenue | source |
|---|---|---|---|---|---|
| FY22 | ₹30 cr | −₹109.4 cr | ₹46.64 cr | 155% | [S] [Entrackr 2023-03](https://entrackr.com/2023/03/edtech-company-planetspark-spent-rs-139-5-cr-to-make-rs-30-cr-in-fy22/) |
| FY23 | ₹42 cr | −₹89.5 cr | ₹29 cr | 69% | [S] [Entrackr 2025-01](https://entrackr.com/fintrackr/fiitjee-backed-planetspark-trims-losses-by-70-in-fy24-8626682) |
| FY24 | ₹67 cr | −₹26.6 cr | ₹18 cr | 27% | same; EBITDA −35%; teacher pay ₹11 cr; employee benefits ₹47 cr |
| FY25 | ₹81.2 cr (total) | −₹28.8 cr | n/a | n/a | [S] [Inc42 datalabs](https://inc42.com/company/planetspark/financials/) |
| FY26 | guided ₹145–150 cr; "first full-year profitable" | — | — | — | [S, company claim] [hdfcsky](https://hdfcsky.com/news/winspark-innovations-parent-of-planetspark-targets-ipo) |

**FY24 teacher cost.** Teacher pay was ₹11 cr on ₹67 cr of revenue, so **16% of revenue went to the people
customers think they are buying**. By comparison, A&P was 27% and other employee costs (including the counsellor
floor) were 70% [D].

**FY24 CAC estimate [D/A]:**
- Assume an average ticket of ₹38,000 [A]. That is the median of three parent-reported packages, and revenue is
  recognised over delivery, so this is rough.
- That gives ≈17,600 package-equivalents.
- A&P per paying family is then ≈ **₹10,200**.
- Counsellor salaries are on top. If even a third of the ₹47 cr employee line is sales, the fully loaded figure is
  ≈ **₹19,000 per payer**.

**Who it reaches.** "50% of our learners come from Tier 2, Tier 3, and Tier 4 towns" and "84% of income from
middle-income groups" [S, Inc42 2025-03].

### 2.3 Matrix score
| Voice Hindi? | Covert assess? | Generative? | Threat |
|---|---|---|---|
| **No.** AI voice exists but is English-only, and the product *is* English | **No.** AI scores performance explicitly | **Partial.** AI practice sessions and feedback on video; not the curriculum | **M for the wallet and the auction; L for the product** |

---

## 3. The other four, briefly

### 3.1 BrightChamps
- **What it is.** A global, multi-country seller (30 countries [S]) of coding, maths, financial literacy, robotics
  and communication classes for grades 1–12 [V].
- **India prices:**
  - **₹600–772 per class + GST**, sold only as **50–150-session packages costing ₹38,600–89,999**.
  - The ₹50,600–1,20,000 "list" prices are struck through on the page [V, curl 2026-10-02].
  - Course cards carry "Group" labels, so the 1:1 or group format per course was not confirmed [U].
- **Losses.** In FY23 the India entity spent **₹10.35 per ₹1 of operating revenue** [S Inc42].
- **AI.** It launched a ChatGPT-based tutor in the UAE in Oct 2023 [S, arabianbusiness]. Nothing was found for India,
  in Hindi, or in voice.
- **Reviews:**
  - It has the **highest money-grievance share of any app we have pulled: 15.0%**.
  - The sample is old (most reviews are from 2022) and small (n=193), so it is low-confidence.
- **Matrix score:** No / No / No / **L**. It sells a different job (enrichment) and its India footprint is small. It
  matters only as a co-bidder for parents of 6–14-year-olds on Meta and YouTube.

### 3.2 Teachmint (student-facing AI)
- **Business.** It is now a hardware-led **school classroom** business:
  - FY26 revenue was ₹205 cr, "largely led by demand for Teachmint X, its AI-powered connected classroom device"
    [S Entrackr 2026-10-01].
  - In FY25, hardware sales were the "sole revenue source" [S].
- **Student AI.** The app ("Teachmint: AI study app", 20.5M installs) exposes a **scheduled "AI Tutor"** to students.
  Its quality is criticised in reviews: "keeps going in circles", and the schedule is fixed [V review 2026-07-25].
- **Matrix score:** voice Hindi unknown [U] / No / teacher-side generation only / **M as a channel rival**.
- **Why it rates M.** It is already inside the classrooms that the Lucknow–Kanpur *school-seeded, parent-paid* cell
  wants to enter. A school that has bought Teachmint X boards has an incumbent "AI" vendor to compare Taxila with.
  Ask about it in qualifying school visits.

### 3.3 Tata Studi
- **What it is.** The household-brand self-study app: CBSE 1–10 plus state boards for 9–10 only, with **₹899 a
  month** and a **no-refund** plan [V].
- **Why it fails as a business:**
  - Newest reviews average 3.21★ with 42% low-star [V].
  - Review velocity is very low: the newest 400 span 4.5 years [V].
  - The Studi Live app has been dormant since 2023 [V].
  - Most decisively, Tata Industries' FY26 annual report shows the **"After School & Early Child Education" content
    asset impaired from a ₹90.3 cr gross block to a ₹0.45 cr net block**. The report says "value in use … is lower
    than the carrying amount" [V, AR FY26 note 14].
  - Group ad spend is under ₹1 cr [V].
- **Reading.** Tata itself has marked Studi down as a business that will not earn its cost back.
- **Lesson for Taxila.** This is the cleanest Indian evidence that **₹899 a month for curriculum video, a planner and
  tests does not sell, even with the Tata brand**. A brand does not substitute for a teacher.
- **Matrix score:** No / No (adaptive planner only) / No / **L**.

### 3.4 Classplus
- **What it is.** A white-label app builder for tutors. 96.6% of operating revenue is SaaS, and Testbook makes up
  most of the consolidated group [S].
- **AI.** No student-facing AI tutor was found [U].
- **Reviews.** Its 5.8% sales-pressure share comes from **educators complaining about Classplus's own sales team**,
  not from parents.
- **Matrix score:** n/a / No / No / **L as a product**. It is, however, a **channel**: the 1:1 and group tutors that
  Ghar Tutor would replace already pay Classplus ₹13k–50k a year to look professional (`gtm-distribution.md` §3).
  That makes "Taxila as the tutor's co-teacher" a plausible later B2B2C lane. This is not a 2026 priority.

### 3.5 New 2025-26 AI launches not covered elsewhere
- **Arivihan.**
  - Hindi-belt state boards, classes 10–12, "full syllabus at just ₹51", AI photo doubt-solving [V].
  - Raised a **$10M Series A on 2026-09-30** (Accel, Prosus) to enter new states and CBSE and to build "vernacular
    capabilities" [S, telecomtalk].
  - 1.87M installs, 4.75★ [V].
  - It sits above the wedge (classes 10–12) but in exactly the Bihar, UP and Rajasthan geography.
  - Two effects for Taxila:
    1. It anchors Hindi-belt parents' sense of what "a whole year of syllabus" costs at **near zero**.
    2. It is the most likely funded player to move down into classes 8–9 with an automated tutor.
  - **Matrix score:** No voice (photo plus video) / No / No / **M (geography and price anchor)**.
- **Sparkl** (IB and Cambridge, 6–12, human-led) and **Codingal** (K-12 coding, an app with 3.6k installs) are
  **L**.

---

## 4. Does anything here weaken the thesis?

### 4.1 "Nobody combines all three for classes 1–9 at home"
**The claim holds; no new product is "yes" on Hindi voice.** The closest new entries:

| | Hindi voice tutor | covert assessment | per-child generative content | 1–9 at home |
|---|---|---|---|---|
| PlanetSpark | ✗ (English AI voice) | ✗ | partial (non-curriculum) | ✓ (ages 4–14) |
| Teachmint AI Tutor | ? | ✗ | ✗ (student side) | partial (school-led) |
| Arivihan | ✗ (Hindi text and video) | ✗ | ✗ | ✗ (10–12) |
| Tata Studi | ✗ | ✗ (planner) | ✗ | ✓ |

**One caveat to add to the thesis.** PlanetSpark already runs the operating model Taxila's thesis assumes is novel:
AI sessions replace a majority of human sessions for K-8 children and are sold to tier-2 and tier-3 parents at
scale. It does this profitably (company claim) with a ~₹145 cr FY26 run-rate [S]. It could add a Hinglish
curriculum lane, such as English grammar for school or maths, faster than PW could build CuriousJr AI.
- Probability by Oct 2028: **~15% [U, author judgement]**.
- Signal to watch: a PlanetSpark course page for "school English/maths tuition" or "Hindi".

### 4.2 The Ghar Tutor ₹999 price frame

| reference point | monthly-equivalent | relation to ₹999 | tag |
|---|---|---|---|
| BrightChamps (8 classes/month, ex-GST) | ₹4,800–6,200 | ₹999 = 16–21% | [V price; D monthly] |
| PlanetSpark (8 sessions/month at ₹475–677) | ₹3,800–5,400 | ₹999 = 18–26% | [V reviews; D] |
| 1:1 home tutor (existing matrix) | ₹1,500–3,000 | 33–67% | [D] |
| PW CuriousJr batch (existing) | ~₹2,500 | 40% | [V] |
| **Tata Studi** | **₹899 (monthly) / ₹933 (annual)** | **≈ equal** | [V] |
| Arivihan (10–12 Hindi belt) | ₹51 per syllabus | ~0 | [V] |

**Verdict: the frame is not weakened, but it is constrained.**
- **The live-class sellers make ₹999 look cheap.** But they are bought as *enrichment* (speaking, coding) and paid
  for in one large upfront purchase. They are not a monthly tuition substitute, so do not cite them as the anchor.
  The anchor stays the ₹1,500–3,000 local tutor.
- **Studi at ₹899 is the risk.** If a parent files Taxila under "app", the nearest branded comparison costs the same
  and is visibly failing (§3.3). Ghar Tutor's page and onboarding therefore have to *show* a live teacher, a weekly
  parent report and a re-teach event in the first session. This is the same conclusion as `rj-passive-tutor`, now
  with a ₹90 cr Indian write-off behind it.
- **Arivihan's ₹51 caps what can be charged for content.** Only *teaching time and proof* can be priced in the Hindi
  belt.
- **No change to the tiers is proposed.** The positioning rule tightens: *₹299 Saathi is the app-comparable tier;
  ₹999 Ghar Tutor is only ever compared with a human tutor.*

### 4.3 The CAC benchmark for the Patna CTWA cell
**The gap: competitors can pay ~30× more per payer than the plan assumes [D].**
- The base plan assumes **₹20 per conversation and ₹333 per payer** (`gtm-distribution.md` §5).
- PlanetSpark's spend works out to about ₹10k per payer in A&P alone, or ~₹19k fully loaded [D]. Its 27%-of-revenue
  A&P ratio, on tickets of ₹35–42k, means it can bid ~30× Taxila's payer CAC.
- BrightChamps' India entity spent 3.3× its revenue on A&P in FY23 [S→D].

**Why that matters for Patna.** These sellers buy the same Meta audiences: mothers of 6–14-year-olds in tier-2
cities, with "English-speaking / confident child" creatives. In the auctions they enter, Taxila's CPMs will be set by
them, not by its own budget.

**Mitigations already in the plan:**
- CTWA plus a WhatsApp diagnostic sells *Hindi maths/science homework help*, a different intent from "spoken
  English".
- Hindi-language creatives should sit in auctions where English-first sellers bid less.

**Unmeasured.** The overlap of these auctions has not been tested. Pull Ad Library counts for PlanetSpark,
BrightChamps and CuriousJr ads targeting Bihar before the Patna spend starts. Owner: GTM; a manual task.

---

## 5. Matrix additions (rows #38–#44)

| # | product | segment | voice Hindi? | covert assess? | generative content? | price (family) | traction | threat | our angle |
|---|---|---|---|---|---|---|---|---|---|
| 38 | **PlanetSpark** | ages 4–14 English communication, live 1:1 + AI sessions | No (English AI voice) | No | Partial (AI practice, video scoring) | ₹35–42k packages; ≈₹475–677/session; no public price [V reviews] | FY25 ₹81 cr, −₹29 cr; FY26 guide ₹145–150 cr, profitable [S]; 192k installs; newest 3.72★, 12% money-grievance [V] | **M** (wallet + Meta auction) | Disclosed AI/human mix; monthly; no counsellor; curriculum in Hinglish |
| 39 | **BrightChamps** | grades 1–12 coding/maths/finance, global | No | No | No (UAE ChatGPT tutor [S]) | ₹600–772/class + GST; ₹38.6–90k packages [V] | India entity FY23 ₹17 cr, −₹160 cr [S]; 146k installs; 3.31★, 15% money-grievance [V] | L | Not the same job; co-bidder only |
| 40 | **Tata Studi** | CBSE 1–10 self-study (+ state boards 9–10) | No (Hindi subject only) | No (adaptive planner) | No | ₹899/month; ₹11,200/yr; no refund [V] | ClassEdge FY26 ₹102 cr, PAT −₹22 cr; After-School asset impaired to ₹0.45 cr [V]; 1.47M installs, 3.21★ newest [V] | L | Proof that ₹899 of passive content does not sell; never be positioned as "an app like Studi" |
| 41 | **Teachmint (AI Tutor)** | schools/tutors; student AI tutor | Unknown | No | Teacher-side only | free to students; hardware to schools | FY26 ₹205 cr, −₹29 cr [S]; 20.5M installs, 4.03★ newest [V] | **M (school channel)** | Ask in school visits; be the at-home layer that complements the board, not a rival board |
| 42 | **Classplus** | white-label tutor apps | n/a | No | No | ₹13–50k/yr per tutor [S] | FY24 ₹205 cr op, −₹110 cr [S]; 2.7M installs [V] | L | Later B2B2C: Taxila as the tutor's co-teacher |
| 43 | **Arivihan** | Hindi-belt boards 10–12 + NEET | No (Hindi video/text) | No | No | ₹51 per syllabus [V] | $10M Series A 2026-09-30 [S]; 1.87M installs, 4.75★ [V] | **M** (geography, price anchor, may move down) | Classes 1–9 voice teacher; content cannot be priced, teaching can |
| 44 | **Sparkl / Codingal** | IB-Cambridge 6–12 / coding | No | No | No | — | <4k installs each [V] | L | — |

---

## 6. Proposed changes for the main loop

These go into `context/inbox/market.json`; the main loop decides.

### 6.1 Rejection (new): `rj-undisclosed-ai-substitution`
- **Tried by:** PlanetSpark, 2025-26.
- **What was tried:** pre-paid packages of N "sessions" in which most sessions are AI-led or group practice, sold by
  counsellors as if they were human-taught.
- **What broke:**
  - Newest reviews average 3.72★ against 4.47★ lifetime.
  - 42% of low-star reviews are money grievances, and 24% name the counsellors.
  - Parents counted the human sessions themselves: 24 of 120, and 20 of 200 [V, n=343].
- **Rule for Taxila:**
  - Every Taxila session is AI, and that is said plainly.
  - Any human time (the Ghar Tutor monthly human check-in, if adopted) is a separate, named line item.
  - Never sell a pre-paid count that mixes the two.

### 6.2 Measurement (new): `mk-live-class-competitor-economics`
- PlanetSpark A&P as a share of revenue: 155%, 69% and 27% (FY22–24).
- PlanetSpark ad spend per payer: ≈₹10k [D, ₹38k ticket].
- BrightChamps: ₹600–772 per class.
- Tata Studi: ₹899 a month, with its asset impaired to ₹0.45 cr.
- Money-grievance share in the newest reviews: 12–15% for live-class sellers against 0.75–1.75% for PW and Vedantu.
- **Method:** this file; Play n as stated; pulled 2026-10-02.

### 6.3 Decision refinement (to `mk-year1-lead-699-999`)
**Positioning rule:** Ghar Tutor is compared only with the human tutor, at ₹1,500–3,000. Saathi ₹299 is the tier
that may be compared with apps.

**Reversal condition:** a price smoke test (open question Q1) shows that parents shown the "tutor" frame convert no
better than parents shown the "app" frame.

### 6.4 Patna KPI addition
| metric | target | kill or redirect if | why |
|---|---|---|---|
| cost per CTWA conversation | ≤ ₹20 | > ₹40 for 2 consecutive weeks | the auction is being set by live-class sellers; switch the Hindi-intent creative or move budget to the school cell |

### 6.5 Watch item (new): `op-planetspark-curriculum-lane`
- **Trigger:** PlanetSpark launches a school-curriculum English or maths course, or a Hindi or Hinglish lane.
- **Response:** re-score #38 to H.

---

## Sources
- PlanetSpark:
  - FY24, FY23 and FY22 financials: [Entrackr FY24](https://entrackr.com/fintrackr/fiitjee-backed-planetspark-trims-losses-by-70-in-fy24-8626682) ; [Entrackr FY23](https://entrackr.com/2024/03/planetspark-posts-rs-41-cr-revenue-and-rs-90-cr-loss-in-fy23/) ; [Entrackr FY22](https://entrackr.com/2023/03/edtech-company-planetspark-spent-rs-139-5-cr-to-make-rs-30-cr-in-fy22/)
  - FY25 financials: [Inc42 datalabs](https://inc42.com/company/planetspark/financials/)
  - Break-even, tier mix and the AI share of modules: [Inc42 break-even feature, 2025-03-29](https://inc42.com/features/planetspark-breakeven-profit-ipo-edtech-funding-winter/)
  - FY26 guidance and the 60:40 human:AI ratio: [hdfcsky Winspark](https://hdfcsky.com/news/winspark-innovations-parent-of-planetspark-targets-ipo)
  - Course price range: [speakingfever fees guide](https://speakingfever.com/spoken-english-course-fees-india/)
  - Site checked for a public price: [planetspark.in](https://www.planetspark.in/) (curl 2026-10-02; no price shown)
- BrightChamps:
  - Prices: [brightchamps.com/en-in/courses](https://brightchamps.com/en-in/courses) (curl 2026-10-02) ; [coding page](https://brightchamps.com/en-in/courses/coding-classes-for-kids)
  - FY23 financials: [Inc42 FY23](https://inc42.com/buzz/edtech-soonicorn-brightchamps-spent-inr-10-to-earn-every-inr-1-from-ops-in-fy23/)
  - FY22 financials: [StartupStory FY22](https://startupstorymedia.com/insights-edtech-startup-brightchamps-reports-loss-despite-heavy-advertising-spend-acquires-schola-for-15-million-to-expand-in-southeast-asia/)
  - UAE AI tutor: [Arabian Business AI tutor](https://www.arabianbusiness.com/business/education/brightchamps-launches-worlds-first-chatgpt-based-virtual-tutor-platform-in-the-middle-east)
  - FY24 revenue range: [Tracxn](https://tracxn.com/d/legal-entities/india/brightchamps-tech-private-limited/__4UFUgYzfF9GAnrORn31E6lnjgoUM0EZYubgh72r0-jU) (search snippet; the page itself returned 403)
- Tata Studi:
  - Prices and refund policy: [plans and pricing](https://www.tatastudi.com/plansandpricing/)
  - FY26 AOC-1, note 14 impairment and the consolidated ad line: [Tata Industries Annual Report FY2025-26](https://www.tata.com/content/dam/tata/pdf/tata-industries/TataIndustriesAnnualReportFY2025-26.pdf)
  - FY25 revenue: [Tracxn](https://tracxn.com/d/legal-entities/india/tata-classedge-limited/__K6XNvCJjE8C45OYtZAIBB93Uyddd5nj2KoUw8sbbEc8) (snippet)
- Teachmint: [Entrackr FY26](https://entrackr.com/fintrackr/teachmint-revenue-jumps-28x-to-rs-205-cr-in-fy26-12612591) ; [Entrackr FY25](https://entrackr.com/fintrackr/teachmints-revenue-jumps-43x-in-fy25-10550884) ; [Play listing](https://play.google.com/store/apps/details?id=com.teachmint.teachmint)
- Classplus: [Entrackr FY24](https://entrackr.com/2024/10/classplus-revenue-spikes-2x-to-rs-260-cr-in-fy24-cuts-losses-by-57/) ; [Inc42 pivot feature, 2025-07-11](https://inc42.com/features/classplus-flips-its-edtech-playbook/) ; [Play](https://play.google.com/store/apps/details?id=my.classroom.app)
- Arivihan: [TelecomTalk 2026-09-30](https://telecomtalk.info/arivihan-raises-10-million-for-ai-tutoring/1012350/) ; [YourStory](https://yourstory.com/2026/09/arivihan-10m-as-ai-led-edtech-targets-indias-smaller-cities) (403; headline only) ; [Play](https://play.google.com/store/apps/details?id=arivihan.technologies.doubtbuzzter2)
- Sparkl: [Inc42 seed](https://inc42.com/buzz/aakash-chaudhrys-sparkl-edventure-bags-4-mn-from-zomato-zerodha-founders/)
- Jio AI Classroom: [BusinessToday IMC 2025](https://www.businesstoday.in/technology/news/story/jio-launches-safety-first-jiobharat-phones-and-ai-classroom-course-at-india-mobile-congress-2025-497431-2025-10-09)
- Play data: `gap2-playstore-2026-10-02.json` and `gap2-reviews-2026-10-02.json` (this folder), from google-play-scraper with `country=in` and `lang=en`.
