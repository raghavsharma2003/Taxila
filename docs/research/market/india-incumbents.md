# Indian K-12 incumbents: teardown for Taxila (classes 1–9)

*Research date: 2026-10-02. Scope: BYJU'S, Vedantu, Unacademy, Toppr, Extramarks, LEAD Group, Meritnation/Aakash, Doubtnut/Allen, Embibe, Cuemath, Seekho (and Seekho Jr), Kutuki, PW CuriousJr, plus other K-9 players (Infinity Learn, Vidyakul, Filo, YoLearn, Khan Academy, Teachmint/Next). This file adds to `../tech-and-market.md` §5 and does not repeat it.*

**Tags:** **[V]** = checked at the primary source (company site, Play Store listing, or my own Play Store pull). **[S]** = secondary source, such as press reports of RoC filings (Entrackr, Inc42) or Wikipedia. **[U]** = unverified, conflicting, or inferred. A company's description of its own product is tagged [V] *as a claim*; it does not mean the claim is true.

**Method and limits (read before trusting any number):**
- **Play Store data [V, measured].** I pulled data with `google-play-scraper` 1.2.7 on 2026-10-02 (country=in, lang=en).
  - For each app I took the listing metadata and the **400 newest reviews**; YoLearn had only 245.
  - "Low" means 1–2 stars. Complaint themes are regex matches on low-star text.
  - Scripts and raw numbers are next to this file: `playstore_snapshot.py`, `playstore_themes_aggregate.py`, `playstore-snapshot-2026-10-02.json`.
  - Regex theme tagging is crude. A review can match several themes, and English-language reviews skew toward students rather than parents.
  - The scraper's pagination sometimes returns duplicate reviews.
  - The newest 400 can cover anything from 3 days (PW, Seekho) to 3 years (Cuemath, Kutuki), depending on review volume. The window is shown for each app.
- **Reddit:** the API and pages returned **403** from this environment, so there is no Reddit evidence. **Trustpilot:** 403 for every domain except BYJU'S (through uk.trustpilot.com). **Consumer forums:** not reached.
- **Search budget.** The session-wide web-search budget (200 calls) ran out partway through. After that I could only fetch URLs I already knew. Gaps this leaves are marked [U] in §9.

---

## 0. Bottom line (decision-relevant)

1. **The sales-led, high-ticket, EMI-financed B2C K-12 model is dead.**
   - BYJU'S is in insolvency. On 2026-09-05, NCLT stayed a ₹16 cr sale of BYJU'S K3 assets that were claimed to be worth about ₹150 cr ([BS](https://www.business-standard.com/companies/news/nclt-stays-16-cr-sale-of-byju-s-k3-linked-assets-flags-valuation-concerns-126090500806_1.html)) [S].
   - Unacademy was sold to upGrad for **$200M all-stock**, about **94% below** its 2021 peak (closed 2026-09-01) ([BusinessToday](https://www.businesstoday.in/technology/news/story/unacademys-sale-to-upgrad-is-the-final-act-of-indias-edtech-boom-553343-2026-09-04)) [S].
   - Toppr, Meritnation and Doubtnut have been absorbed into larger players, and their own apps are gone from the Play Store [V, §4].
2. **Three models survived, and they set Taxila's price anchors:**
   - **Mass, low-ARPU:** PW averages **₹4,104 per paid user per year (about ₹342 a month)** across 5.34M paid users [S].
   - **B2B through affordable private schools:** LEAD earns about **₹943 per student per year** (₹386.6 cr ÷ 41 lakh students) [derived from S]. It is EBITDA-positive with 100% net revenue retention [S].
   - **Premium human 1:1:** Cuemath charges **₹610–900 per class** plus 18% GST [V]. Vedantu's 1:1 tutoring starts at **₹800–888 per hour** [V].
3. **Human 1:1 online tutoring costs about ₹700–1,030 per hour** including GST [V, derived]. A ₹499/month AI tutor used 20 hours a month works out to about ₹25 per hour, which is **roughly 30–40× cheaper**. The "replace the tutor" price argument holds. The trust argument is what is unproven.
4. **What students complain about most is reliability, not pedagogy.** Across 1,895 low-star reviews from 20 apps, the largest theme is **bugs, login and OTP failures at 22%**. Next come paywall (13%) and refund/fraud (10%) [V, measured].
   - BYJU'S is the extreme case. Its lifetime rating is 4.05, but its newest-400 mean is **2.39**, 64% of those reviews are 1–2 stars, and most of them say "OTP never arrives" [V].
5. **Parents complain about trust: mis-selling, refunds, unresponsive support and classes not held.**
   - Only **41 of 1,895 low reviews (2%)** are visibly written by parents, so the parent buyer is almost silent on the store [V, measured].
   - In that small set: sales or mis-selling 34%, paywall 32%, teacher quality 32%, unresponsive support 29%, refund 27% [V, n=41, low confidence].
6. **Incumbent AI today is mostly doubt-solving (photo to answer), analytics and "mentors".** Three products are closest to Taxila's thesis:
   - **LEAD's "Ms Curie"** (April 2026): an animated AI tutor character for K-8 that handles Indian accents and is used in classrooms. It is targeting 1,000+ schools and 400k students within 12–18 months [S]. Today it is only a spoken-English product (Fluento, about ₹2,000 per student per year) [S].
   - **PW's voice-to-voice AI tutor:** in beta with 300+ students, with full launch planned for Q2 FY27 (July–September 2026) at about $0.20 per hour [S].
   - **YoLearn:** a small competitor of about 127k installs, whose ratings look questionable [V].
   - **No incumbent publicly shows covert understanding checks followed by re-teaching in a different modality, in Hinglish voice, for classes 1–9.** This window is closing. PW reaches Hindi-belt homes, and LEAD reaches K-8 classrooms.
7. **Reach does not equal revenue in Hindi-first, free-content K-12.**
   - Doubtnut had about 30M+ monthly reach but spent **₹194 cr to earn ₹10 cr** in FY22 ([Entrackr](https://entrackr.com/tags/doubtnut)) [S]. Allen bought it for about $10M [S].
   - Seekho spent **₹134 cr on ads for ₹142 cr of revenue** in FY25 ([Entrackr](https://entrackr.com/fintrackr/seekho-spends-rs-134-cr-on-advertising-for-rs-142-cr-revenue-in-fy25-11205187)) [S].
   - For Indian consumer edtech, CAC is the business model.
8. **Hindi and Hinglish demand is real and under-served in K-9.**
   - Hindi-first products have healthy newest-review means: PW 4.45, Vidyakul 4.28, Seekho Jr 4.52 with **9.8M installs** within 17 months of launch [V].
   - One Vedantu complaint describes "extreme mis-selling": a Hindi-comfortable child was put into a strictly English batch [V, review].
9. **Store ratings are a weak signal and are gamed.**
   - YoLearn has 232 five-star reviews out of 245, and its 1-star reviews allege "paid … reviews" [V/U].
   - Lifetime averages hide collapse (BYJU'S 4.05 lifetime against 2.39 newest).
   - Taxila should track its **newest-N mean and its share of parent-authored complaints**, not the lifetime star rating.

---

## 1. Scoreboard (status as of 2026-10-02)

| player | K-9 focus | 2026 status | latest revenue | latest loss / EBITDA | scale | entry price (₹) | AI shipped |
|---|---|---|---|---|---|---|---|
| **BYJU'S** (Think & Learn) | classes 4–10 app, LKG–3 Early Learn | insolvency; bidding paused; app frozen since June 2024 | FY22 ₹5,298 cr [S] (no later audited figures) | FY22 −₹8,245 cr [S] | 127.8M installs [V]; claimed 150M registered (2023) [S] | historical bundles, see §4.1 | BADRI/MathGPT/WIZ (2023) [U]; "BYJU'S 3.0" AI is an announcement only [S] |
| **Vedantu** | classes 1–12 live; 1:1 | alive; raised $11M from insiders (Sept 2025) [S] | FY25 ₹227 cr (+23%) [S] | FY25 PBT −₹210 cr [S] | 50.3M installs [V] | group full-year from ₹9,000; 1:1 from ₹800–888/h [V] | **Ved** AI mentor (Nov 2025, free) [S] |
| **Unacademy** | test prep, no material K-9 | **acquired by upGrad**, $200M all-stock (2026-09-01) [S] | FY25 ₹826 cr total income [S] / ₹702 cr consolidated revenue [S] | FY25 −₹436 cr [S] | 109M installs [V] | in-app ₹4–18,000 [V] | Airlearn (language), ARR ~$3M [S] |
| **Toppr** | after-school 5–12 | absorbed by BYJU'S (2021); the Toppr developer account now publishes the BYJU'S apps; toppr.com TLS cert expired [V] | n/a | n/a | Scan Quest 7.1M installs, not updated since Dec 2023 [V] | n/a | photo doubt-solver (Scan Quest) [V] |
| **Extramarks** | K-12 schools + B2C app | B2C cut back in 2023 (300 layoffs) [S]; app still updated [V] | FY24 ₹233 cr (−37%) [S]; "₹284 cr (2025)" per Wikipedia [U] | FY24 −₹48 cr [S] | 14.6M installs [V] | **₹616/month** [V] | "Extra Intelligence" school AI suite (July 2025) [S] |
| **LEAD Group** | K-10 affordable private schools | growing; EBITDA-positive [S] | FY26 ₹386.6 cr (+10%) [S] | FY26 EBITDA +₹30 cr; net −₹34.5 cr [S] | 9,000+ schools, 41 lakh students [S] | about ₹943 per student per year [derived] | **Ms Curie** AI tutor (April 2026); Socrates; TechBook [S] |
| **Aakash** (+ Meritnation) | foundation 8–10, NEET/JEE | Manipal holds ~73%; BYJU'S 13.74% [S]; Meritnation app not on the Play Store [V] | FY26 ₹2,041 cr (flat) [S] | FY26 EBITDA ₹15.3 cr (0.75%) [S] | myAakash 1.8M installs [V] | n/a | Aakash Digital 2.0 "AI SWOT analysis" [S] |
| **Doubtnut** (Allen) | photo to video doubts 6–12, Hindi | absorbed: doubtnut.com redirects to allen.in/dn [V]; app not on the Play Store [V] | FY23 ~₹26.6 cr [S]; now under ₹10 cr standalone [S/U] | FY22 −₹179 cr [S] | ~32M monthly reach at acquisition (Dec 2023) [S] | freemium | image-match to video solutions |
| **Embibe** (Reliance) | school + test prep | Reliance-owned (73%, 2018); ₹590 cr invested by 2023 [S] | under ₹10 cr (FY25, Tracxn) [U] | n/a | 6.1M installs [V] | **₹500 per student per year to schools** (2023) [S] | "MB" AI mentor; 3D videos; analytics [V claim] |
| **Cuemath** | maths 1:1, K-12 (global) | alive; global/US-led [V] | FY25 ₹155–157 cr (+17–19%) [S] | FY25 −₹45.9 cr [S]; FY24 loss conflicting (₹46.9 cr vs ₹134.5 cr) [U] | 200k parents in 80+ countries (claim) [V] | **₹610–900/class + GST** [V]; US from $20/class [V] | none central; human 1:1 on the "Cuemath Leap" platform [V] |
| **Seekho / Seekho Jr** | adult upskilling; **Jr = kids' Hindi edutainment** | fast-growing; $28M Series B at $180M (Sept 2025) [S] | FY25 ₹141.5 cr (12.3×) [S] | FY25 −₹38.8 cr; ads ₹134.2 cr [S] | 185M installs; Jr 9.8M since April 2025 [V] | in-app ₹99–999 [V]; ₹1 trial to auto-pay [V, reviews] | none visible |
| **Kutuki** | preschool, ages 3–7, 9 languages | dormant? App not updated since 2025-04-16; site unreachable [V/U] | n/a | n/a | 5.5M installs [V] | ₹99–299 in-app [V] | none |
| **PW CuriousJr** | classes 1–9 live | **4× revenue YoY** (Q4 FY26) [S] | part of PW (FY26 ARPU ₹4,104) [S] | n/a | 5.5M installs; claims 15M students [V claim] | ₹29 demo; course price not public [V] | PW AI stack (§6) |

---

## 2. Play Store health snapshot (measured 2026-10-02; n = 400 newest reviews each)

The **newest mean** is the average rating of the 400 newest reviews; the window column shows the dates those reviews span. **Low %** is the share of those 400 rated 1–2 stars. The newest mean is the better health metric because the lifetime rating lags.

| app (package) | installs | lifetime ★ | newest mean | low % | window of 400 newest | last update | top low-star themes |
|---|---|---|---|---|---|---|---|
| BYJU'S (`com.byjus.thelearningapp`) | 127.8M | 4.05 | **2.39** | **64%** | 2025-11 → 2026-09 | **2024-06-11** | bugs/login/OTP 127, refund 27, paywall 18, sales calls 15 |
| Think & Learn Premium | 2.2M | 3.89 | **2.03** | **72%** | 2024-06 → 2026-09 | 2024-02-22 | bugs 83, paywall 62, refund 37, support 33 |
| Vedantu | 50.3M | 4.38 | 4.52 | 9% | 2026-07 → 2026-10 | 2026-09-25 | bugs 9, refund 7, teacher 6 |
| Unacademy | 109.2M | 4.12 | 3.67 | 32% | 2026-08 → 2026-10 | 2026-10-02 | **sales calls 34**, paywall 31, support 15 |
| Extramarks | 14.6M | 3.82 | 3.42 | 36% | 2025-11 → 2026-09 | 2026-09-16 | bugs 28, paywall 23, refund 9 |
| LEAD Group Student App | 3.5M | 4.59 | 4.34 | 11% | 2026-07 → 2026-09 | 2026-09-22 | bugs 8 (textbook-code registration) |
| myAakash | 1.8M | 4.32 | 3.78 | 24% | 2026-06 → 2026-09 | 2026-10-01 | bugs 15, teacher 9, support 7 |
| Embibe | 6.1M | 3.93 | 3.53 | 35% | 2024-04 → 2026-09 | 2026-08-23 | **paywall 39**, bugs 23 |
| Cuemath | 2.7M | 4.56 | 4.31 | 14% | 2023-10 → 2026-09 | 2026-07-09 | bugs/UX 5, teacher 5 |
| Seekho | 185.1M | 4.47 | 4.05 | 22% | 2026-09-23 → 10-01 | 2026-10-01 | paywall 23, refund/auto-pay 15 |
| Seekho Jr | 9.8M | 4.46 | 4.52 | 10% | 2026-09-24 → 10-01 | n/a | paywall 6, refund 4 |
| Kutuki | 5.5M | 4.27 | 4.01 | 20% | 2023-09 → 2026-10 | **2025-04-16** | paywall 18, bugs 15 |
| PW | 58.4M | 4.72 | 4.45 | 12% | 2026-09-28 → 10-01 | 2026-10-01 | bugs 17, teacher 7 |
| **PW CuriousJr** | 5.5M | 4.66 | **4.72** | **6%** | 2026-09-11 → 10-01 | 2026-09-26 | refund 3 |
| ALLEN | 9.9M | 4.55 | 4.27 | 15% | 2026-08 → 2026-10 | 2026-10-01 | teacher 8, content 8 |
| Infinity Learn (Sri Chaitanya) | 1.4M | 3.75 | **3.32** | **39%** | 2026-02 → 2026-10 | 2026-09-30 | **refund 41**, teacher 25, sales 18, EMI 6 |
| Vidyakul (Hindi state boards 9–12) | 7.8M | 4.48 | 4.28 | 16% | 2026-08 → 2026-10 | 2026-10-01 | teacher 8, bugs 6 |
| Filo | 7.2M | 4.43 | 4.39 | 10% | 2026-09 → 2026-10 | 2026-09-29 | paywall 7 |
| YoLearn.AI | 0.13M | 4.23 | 4.84 | 4% | 2026-01 → 2026-09 | 2026-09-19 | (232 of 245 five-star; "fake reviews" alleged) |
| Khan Academy | 33.8M | 4.38 | 3.79 | 27% | 2026-04 → 2026-10 | 2026-08-12 | bugs 26; US-centric curriculum |
| Not on the Play Store (404) | `com.meritnation.school`, `com.doubtnutapp`, `haygot.togyah.app` (Toppr) | | | | | | |

Source for every row: Google Play via `google-play-scraper` (see the method note) [V]. Listing pages, e.g. [BYJU'S](https://play.google.com/store/apps/details?id=com.byjus.thelearningapp&hl=en_IN), [Vedantu](https://play.google.com/store/apps/details?id=com.vedantu.app), [CuriousJr](https://play.google.com/store/apps/details?id=com.curiousjr), [Extramarks](https://play.google.com/store/apps/details?id=com.Extramarks.Smartstudy).

**How to read it.**
- PW CuriousJr, Vedantu and Seekho Jr have the healthiest recent reviews in K-9. BYJU'S, Infinity Learn, Extramarks and Embibe have the sickest.
- CuriousJr's and Seekho Jr's recent 5-star reviews are often very short and generic, e.g. "it changed my child life" and "very nice for my child" [V]. This pattern fits in-app review prompting. Treat it as a measure of satisfaction at onboarding, not of learning.

---

## 3. What families complain about

### 3.1 All low-star reviews (n = 1,895 across 20 apps, newest 400 each) [V, measured]

| theme (regex) | share of low reviews |
|---|---|
| bugs / login / OTP / crash | **22%** |
| paywall ("everything needs subscription") | 13% |
| refund / money / "fraud" / "scam" | 10% |
| teacher or class quality | 7% |
| support unresponsive | 7% |
| sales calls / counsellor / mis-selling | 6% |
| class not held / schedule changes | 3% |
| price "expensive" | 2% |
| loan / EMI / auto-pay deductions | 2% |
| language (Hindi/regional) | 1% |
| AI | 1% |

### 3.2 Parent-authored low reviews (n = 41, i.e. 2% of low reviews) [V, measured, low confidence]

A review counts as parent-authored if it contains a phrase such as "my son", "my daughter", "my child", "beta" or "as a parent".

| theme | share of parent low reviews |
|---|---|
| sales calls / counsellor / mis-selling | **34%** |
| paywall | 32% |
| teacher / class quality | 32% |
| support unresponsive | 29% |
| refund / money | 27% |
| bugs / login | 22% |
| class not held | 12% |
| loan / EMI / auto-pay | 7% |

### 3.3 Representative verbatims (all [V], Play Store, dates as posted)

- **Classes not held (Infinity Learn, 2026-08-26):** "for the last approximately 1.25 months, regular classes for my daughter have not been conducted by the assigned teacher."
- **Payment for the wrong grade, ₹75,000 (Infinity Learn, 2026-04-12):** "We paid 75000 … taken class 7th, 8th and 9th subscription but its showing class 6, 7 and 8."
- **Mis-selling on language (Vedantu, 2026-07-26):** "Extreme Misselling! I took admission in Foundation batch, but it is strictly in English. Due to the language barrier, I cannot understand anything … Counselors misguided me."
- **Sales before enrolment, silence after (Unacademy, 2026-09-01):** "Very Aggressive At Marketing Before You Enroll But Lord Knows What They Do After Enrollment."
- **Zombie product (BYJU'S Premium, 2024-09-07):** "Purchased 3 year package but … Not picking calls … My kids classes haven't happened for last 2 weeks." Another parent: "I had brought the tablet by paying rs 15k but … no classes booked" (2025-05-18).
- **Auto-pay dark pattern (Seekho, 2026-09-25):** "1 rupee bol kar abhi 799 paisa kat rahe hai. plz autopay band kardo" ("they said ₹1, and now ₹799 is being deducted; please stop the auto-pay"). Seekho Jr, 2026-09-24: "first rs 1 Wala khatm … FIR uske bad 199 ka 5 din mein khatm" ("the ₹1 plan ran out, then the ₹199 one ran out in 5 days").
- **Double billing (Extramarks, 2026-07-27):** "I ended up paying for two subscriptions for one child. Despite numerous emails, calls and cancellation requests, nothing was resolved."
- **Good teacher, bad app (Cuemath, 2026-01-21):** "teachers are good however the interface is very poorly designed … No accountability … behind a veil of digital tools."
- **Content without placement (Seekho Jr, 2026-10-01):** "My child age is 9 years and maths, English, science portion is like 6 years aged group childrens … please move syllabus forward." This is a direct signal for diagnosed-level placement.
- **What parents remember fondly about BYJU'S (2024-07-28):** "a great memory of my childhood when I always used to watch the videos and realise and visualise things." The visual content was valued; the commercial model was what broke trust.

**Off-store evidence:**
- BYJU'S Trustpilot score is **1.3/5 from 271 reviews, 93% one-star**. Themes are teacher no-shows, refunds, loans continuing after cancellation, and fake promises ([Trustpilot](https://uk.trustpilot.com/review/byjus.com)) [S].
- Rest of World reports BYJU'S sales staff "asked children deliberately tricky questions to make them appear academically weak" ([RoW](https://restofworld.org/2025/byjus-owner-byju-raveendran-comeback-fraud-case/)) [S].
- The Department of Consumer Affairs raised concerns in June 2022, and ASCI removed misleading WhiteHat Jr ads ([Wikipedia](https://en.wikipedia.org/wiki/Byju's)) [S].

---

## 4. Teardowns

### 4.1 BYJU'S (Think & Learn) — the cautionary tale

**Product (still listed) [V].**
- "BYJU'S – The Learning App" covers classes 4–10 in Maths, Science and Social Studies, for CBSE, ICSE and 9 state boards.
- It advertises "50,000+ learning videos, available in 6+ languages", a two-teacher live class, "Ask a Doubt" (photo or typed), and adaptive practice modes (Warm Up, Sprint, Race).
- The listing is now published under the **"Toppr"** developer account and was **last updated 2024-06-11** ([Play](https://play.google.com/store/apps/details?id=com.byjus.thelearningapp&hl=en_IN)).
- byjus.com still advertises "Online LIVE school tuitions for Academic year 2024-25" ([byjus.com](https://byjus.com/)) [V].
- In May 2025 the Android app was delisted over unpaid AWS bills, and paid lessons became inaccessible ([Techloy](https://www.techloy.com/byjus-play-store-exit-marks-a-deeper-unraveling-of-indias-edtech-giant/), [Inc42](https://inc42.com/buzz/byjus-app-goes-offline-on-play-store/)) [S]. It is listed again as of 2026-10-02 [V].
- Reviews since November 2025 are dominated by "OTP never arrives" and "can't log in" [V].

**Corporate status [S].**
- **Insolvency.** Think & Learn entered insolvency in July 2024 over BCCI dues. The Supreme Court reinstated it in October 2024.
- **Bidding stalled.** Resolution Professional Shailendra Ajmera ran an EoI process; Manipal, which wants Aakash, and upGrad submitted EoIs ([BS](https://www.business-standard.com/companies/news/ronnie-screwvala-upgrad-buy-byujs-assets-think-learn-acquisition-insolvency-125111501118_1.html)). NCLT paused bidding until 2026-08-31 while the founders challenged GLAS Trust's claim, which carries 99% voting rights ([BS](https://www.business-standard.com/companies/news/nclt-pauses-byju-s-insolvency-bidding-till-aug-31-giving-founders-relief-126072301153_1.html), [Asianet](https://newsable.asianetnews.com/business/byjus-insolvency-nclt-halts-bid-process-amid-founders-challenge-articleshow-72z1b1a)).
- **Aakash settlement.** Lenders sought about 30% of Aakash in a settlement in June 2026 ([BS](https://www.business-standard.com/companies/news/byju-s-lenders-seek-30-stake-in-indian-education-group-in-settlement-126062601140_1.html)).
- **K3 assets.** In September 2026 NCLT stayed the ₹16 cr auction of BYJU'S K3 assets, which were claimed to be worth about ₹150 cr ([BS](https://www.business-standard.com/companies/news/nclt-stays-16-cr-sale-of-byju-s-k3-linked-assets-flags-valuation-concerns-126090500806_1.html)).
- **Comeback talk.** The founder's "BYJU'S 3.0" promises AI "one personal tutor for every student" at "half the cost" and compensation for students ([BS](https://www.business-standard.com/companies/start-ups/byju-raveendran-apologises-students-compensation-ai-byjus-3-0-comeback-125051800300_1.html)). No product was found [U].

**Numbers [S].**
- FY21: revenue ₹2,280 cr, loss −₹4,558 cr. FY22: revenue ₹5,298 cr, loss −₹8,245 cr.
- Valuation went from $22B (March 2022) to "worth zero" (October 2024).
- Peak claims: 150M registered students and about 3M annual paid subscribers ([Wikipedia](https://en.wikipedia.org/wiki/Byju's)).

**Pricing (historical).**
- A competitor blog lists the app at about ₹12k/yr, live classes at ₹24k/yr, tuition centres at ₹36k/yr, and premium bundles at ₹30k–3L ([MEB blog](https://www.myengineeringbuddy.com/blog/byjus-in-2025-review-pricing-alternatives-future/)). Low confidence: the source is biased [U].
- Parents' reviews mention multi-year packages, a ₹15k tablet, and SD-card content packs [V].
- The refund window was about 15 days [S].

**What worked.**
- Cinematic visual explanations. The brand became a verb, and parents still recall the videos fondly.
- Tablet and SD-card distribution for low-connectivity homes.
- The two-teacher live model, which CuriousJr copied.

**What broke.**
- Commission sales that diagnosed children as weak in order to sell them.
- Loans that continued after cancellation.
- Delivery could not scale with sales: teacher no-shows.
- Opaque refunds.
- An app that now physically fails.

**Lesson for Taxila.** The demand for "visualise it" content was real. The failure was a trust failure created by the go-to-market. Every BYJU'S complaint theme has a Taxila counter-design (§8).

### 4.2 Vedantu — survived, small, now AI-wrapped

**Product [V].**
- Live classes for classes 1–12, JEE/NEET and all boards.
- Group full-year courses from **₹9,000**. One-to-one from **₹800/h** (CBSE class 8 page) to **₹888/h** (homepage). JEE/NEET 1:1 from ₹1,049/h; IB/IGCSE from ₹1,249/h ([vedantu.com](https://www.vedantu.com/), [class 8](https://www.vedantu.com/cbse/class-8)).
- Courses are branded "AI Live".

**AI [S].**
- **Ved**, launched 2025-11-14 and free: "LearnList" playlists of videos, SmartNotes and quizzes matched to the student's understanding, plus InstaSolve photo doubts.
- Positioning: "does not replace the teacher; it amplifies" ([Entrepreneur India](https://www.entrepreneurindia.com/blog/en/news/vedantu-launches-ved-to-deliver-ai-driven-personalised-learning-across-india.57826)).
- A user (2026-08-06): "The new ai also doesn't know their [teachers'] names and other basic" [V].

**Numbers [S].**
- FY25 revenue ₹227 cr (+23%); online tutoring is 87% of it.
- PBT loss −₹210 cr. Employee cost ₹219 cr (49% of expenses). Ads ₹27 cr.
- Cash ₹40 cr. It spends ₹1.96 per ₹1 of revenue ([Entrackr](https://entrackr.com/fintrackr/vedantu-posts-rs-227-cr-revenue-in-fy25-losses-increase-25-11038680)).
- Raised $11M from internal investors (September 2025) ([Entrackr](https://entrackr.com/tags/vedantu)).
- History: collections fell from ₹230 cr (FY22) to ₹95 cr (FY23), and about 1,600 people were laid off in 2022–23 ([Open](https://openthemagazine.com/business/untold-vamsi-krishna-vedantu-and-the-night-it-nearly-fell-apart)).

**Complaints.** Low share (9%). The themes are app bugs, refund problems and **mis-selling of English-only batches** [V].

**Lesson.** ₹800–888/h is the posted market price for human 1:1 online tutoring in K-10. It is the clearest anchor for Taxila's "tutor replacement" value story.

### 4.3 Unacademy — exited, not a K-9 player

- **No meaningful K-9 product.** The listing is "UPSC, IIT, NEET, GATE, CAT, Bank" with in-app prices of ₹4–₹18,000 [V].
- **Sold.** upGrad acquired it for $200M all-stock; CCI cleared the deal in July 2026 and it closed on 2026-09-01. The brands stay separate ([BusinessToday](https://www.businesstoday.in/technology/news/story/unacademys-sale-to-upgrad-is-the-final-act-of-indias-edtech-boom-553343-2026-09-04)) [S].
- **FY25:** total income ₹826 cr, EBITDA −₹305 cr, net −₹436 cr, cash ₹1,238 cr ([Entrackr](https://entrackr.com/exclusive/exclusive-unacademy-narrows-ebitda-losses-by-38-in-fy25-reports-rs-826-cr-income-10513191)) [S]. Business Today and Inc42 give consolidated revenue of ₹701–702 cr [S].
- **Reset:** offline centres moved to franchise by April 2026; Relevel closed; Airlearn ARR went from about $0.2M to about $3M during 2025 ([Inc42 via Dailyhunt](https://m.dailyhunt.in/news/india/english/inc42-epaper-inc/unacademy+hits+reset+again-newsid-n697461901)) [S].
- **Complaints:** the newest 400 reviews are 32% low, and **sales calls are the #1 theme (34 of 126 low reviews)** [V].
- **Lesson.** Even a test-prep brand with excellent educators is punished for hard selling and poor service after enrolment.

### 4.4 Toppr — absorbed and hollowed out

- BYJU'S acquired Toppr in July 2021 ([Wikipedia](https://en.wikipedia.org/wiki/Byju's)) [S].
- Today the Toppr developer account publishes the BYJU'S app, "Scan Quest" (photo homework help, 7.1M installs, last updated 2023-12-14), the Aakash JEE/NEET app (13.9M installs, last updated 2023-12-30) and "BMath Early Learn" (rated 2.2) [V].
- The original Toppr package returns 404. www.toppr.com serves an **expired TLS certificate** (observed 2026-10-02) [V].
- RP sale documents list Toppr as a separable asset ([BS](https://www.business-standard.com/companies/news/ronnie-screwvala-upgrad-buy-byujs-assets-think-learn-acquisition-insolvency-125111501118_1.html)) [S].
- **Lesson.** Acquired content brands die inside roll-ups. The Toppr and Meritnation question banks, video libraries and app shells may be cheap to acquire or license from the RP [U].

### 4.5 Extramarks — retreat to schools, B2C on life support

**Product [V].**
- K-12 with JEE/NEET. "Learn–Practice–Test", 3D animated videos, games and quizzes.
- "AI-powered personalised recommendations" using Bloom's taxonomy.
- Plans "starting at just **₹616/month**" ([Play](https://play.google.com/store/apps/details?id=com.Extramarks.Smartstudy)).

**AI [S].** "Extra Intelligence" launched 2025-07-31 ([Tribune](https://www.tribuneindia.com/news/extra-intelligence/extramarks-launches-extra-intelligence-a-global-leap-in-ai-powered-education)). It includes:
- AI-evaluated pen-and-paper tests designed to resist cheating;
- a Teacher Assistant that customises lessons;
- AI engagement tracking in live classes.

It also had an "Alex" chatbot in 2019 ([Wikipedia](https://en.wikipedia.org/wiki/Extramarks)).

**Numbers [S].**
- FY24 revenue ₹233 cr, down 37%. Subscriptions were ₹179 cr (+18.5%); one-time product sales fell 75% to ₹54 cr.
- Loss fell from −₹330 cr to −₹48 cr ([Entrackr](https://entrackr.com/fintrackr/extramarks-losses-drop-by-85-to-rs-48-cr-in-fy24-revenue-slips-37-8713664)).
- Fired 300+ staff and "shut B2C" in April 2023 ([Inc42](https://inc42.com/company/extramarks/financials/)).
- Reliance-linked: Infotel took 38.5% in 2011 [S].

**Complaints [V].** The newest 400 reviews are 36% low: paywall on every video, bugs, sales calls followed by no support, double billing, and missing chapters.

**Lesson.** A content library alone, sold B2C with a paywall, decays. The value Extramarks has kept is in schools.

### 4.6 LEAD Group — the profitable K-8 incumbent and the most direct AI threat

**Model [S].**
- An integrated "learning system" for affordable private schools: curriculum, books, smart-class devices, teacher training, and the TechBook "AI+AR textbook".
- Revenue is 71% products (books, devices) and 29% platform services.

**Numbers [S].**
- FY26 operating revenue ₹386.6 cr (+10%). EBITDA +₹30 cr (up from ₹4 cr). Net loss −₹34.5 cr. Cash ₹55 cr.
- 9,000+ schools, 41 lakh students, 65k teachers, 400+ towns ([Entrackr](https://entrackr.com/fintrackr/edtech-unicorn-lead-group-posts-rs-387-cr-revenue-in-fy26-losses-narrow-20-12431698)).
- ARR ₹415 cr for AY25-26 (+30%). **Net revenue retention 100%** ([The Wire/PTI](https://m.thewire.in/article/ptiprnews/lead-group-achieves-ebitda-breakeven-secures-arr-of-rs-415-cr-for-ay-25-26)).
- Adds about 1,000 schools a year and is targeting 1,200 in 2026 ([BS](https://www.business-standard.com/companies/start-ups/ed-tech-firm-lead-group-targets-partnering-with-1-200-schools-in-2026-126010700826_1.html)).
- Expects AI to contribute **40% of revenue in 3–5 years** ([BS via Magzter](https://www.magzter.com/stories/newspaper/Business-Standard/EDTECH-SOLUTIONS-PROVIDER-LEAD-GROUP-EXPECTS-AI-TO-CONTRIBUTE-40-TO-REVENUE-IN-35-YRS)).
- Derived revenue per student: **₹943/yr** (₹386.6 cr ÷ 41 lakh), or ₹1,037 on an ARR basis.

**AI: "Ms Curie" (April 2026) [S].**
- One-to-one AI tutoring *inside classrooms*, for K-8.
- Recognises diverse Indian accents with "very low latency".
- Built around an **animated character**. LEAD's own finding, as reported: children in classes 1–8 "feel friction" with functional software, but "the moment an animated character comes … they are able to interact."
- First programme: **Fluento** spoken English, about ₹2,000 per student per year.
- Pilot: about 1,000 students in 10 schools, with a self-reported "~2×" gain in conversation ability.
- Rollout target: 1,000+ schools and 400k+ students in 12–18 months.
- Also: Socrates (lesson-prep assistant) and Code.AI.
- Sources: [CXO Digitalpulse](https://www.cxodigitalpulse.com/lead-group-launches-ms-curie-an-ai-tutor-enabling-11-personalised-learning-in-classrooms/), [Tribune](https://www.tribuneindia.com/news/schools/ms-curie-brings-ai-tutoring-to-schools/), [Inshorts](https://inshorts.com/en/news/edtech-startup-lead-introduces-ai-powered-tutor--ms-curie--1775582654546), [Forbes India](https://www.forbesindia.com/article/ai-tracker/ai-who-will-teach-the-teachers/2988533/1).

**App [V].** LEAD Group Student App: 3.5M installs, newest mean 4.34. Complaints are about registering with textbook barcodes and "no chapters available".

**Lesson.** LEAD has already validated, in the market, two of Taxila's design bets: a named, animated tutor persona, and accent-robust voice for K-8. It reaches children through school distribution at about ₹1,000 per student per year with 100% net revenue retention. Its gaps are that it is English-only today, its AI is a pilot stage, and it serves the classroom rather than the evening at home. **Taxila must decide whether to compete with LEAD, sell into schools like LEAD, or partner with it.**

### 4.7 Aakash and Meritnation — Meritnation has disappeared

**Aakash [S].**
- FY24 ₹2,438 cr, FY25 ₹2,032 cr, FY26 ₹2,041 cr. FY26 EBITDA ₹15.3 cr (−65%).
- Manipal holds about 73%, BYJU'S 13.74% ([Entrackr](https://entrackr.com/analysis/aakash-struggles-break-free-from-byju-era-as-topline-stagnates-for-three-years-12486185)).
- Aakash Digital 2.0 (March 2025) offers "AI-based performance analysis" (SWOT) and up to 10 hours a day of doubt support for NEET/JEE/Olympiads ([Careers360](https://news.careers360.com/aesl-expands-aakash-digital-20-offer-ai-powered-coaching-for-neet-jee-olympiads)).
- myAakash: newest mean 3.78, 24% low. Complaints: recordings disappear, results are delayed [V].

**Meritnation.**
- Acquired by Aakash for about ₹50 cr on 2020-01-03 ([Inc42](https://inc42.com/buzz/aakash-educational-to-acquire-meritnation-for-inr-50-cr/)) [S]. Its old claim was "2.5 crore students across all major boards" [S].
- As of 2026-10-02, `com.meritnation.school` returns 404 on the Play Store and no Meritnation app appears in Play search [V]. meritnation.com was unreachable from this environment [U].
- **Lesson.** India's oldest K-10 content site, once owned by the dominant coaching chain, did not survive as a product.

### 4.8 Doubtnut (now Allen) — huge reach, no revenue

- Product: photo of a question → a matched short video solution, strong in Hindi.
- **Monthly reach was about 32M at acquisition** (December 2023, about $10M / ₹83 cr) ([BS](https://www.business-standard.com/companies/news/allen-career-institute-acquires-ai-enabled-edtech-platform-doubtnut-123120400620_1.html)) [S].
- Economics [S]:
  - FY21: spent ₹105 cr to earn ₹2 cr.
  - FY22: spent ₹194 cr to earn ₹10 cr.
  - April 2023: cut costs by 80% ([Entrackr](https://entrackr.com/tags/doubtnut)).
- Today doubtnut.com 302-redirects to **allen.in/dn**, and `com.doubtnutapp` returns 404 [V]. The ALLEN app ("Class 6-10, JEE, NEET") has 9.9M installs and a newest mean of 4.27 [V].
- **Lesson.** Free, Hindi, photo-to-answer is a feature that LLMs have now commoditised (Gauthmath, ChatGPT). Families do not pay for it on its own. Taxila's monetisable unit must be *a relationship and outcomes*, not answers.

### 4.9 Embibe (Reliance) — deep pockets, weak product pull

- **Ownership and funding:** Reliance took 73% in 2018 and had invested ₹590 cr by 2023. It has acquired small edtechs (Funtoot, OnlineTyari) ([Embibe/The Ken](https://www.embibe.com/in-en/embibe-in-news/reliance-jiofy-edtech-embibe/), [Entrackr](https://entrackr.com/tags/embibe)) [S].
- **School pricing:** "as low as **₹500 per student annually** (vs. industry average of Rs 3,000–4,000)", with a field sales force selling to schools (The Ken, July 2023) [S].
- **Product [V claim]:** 3D videos, personalised journeys for "345+ exams in English and Hindi", and an "MB" AI mentor.
- **Revenue:** under ₹10 cr for FY25 per Tracxn ([Tracxn](https://tracxn.com/d/companies/embibe/__bNxse3FZdlFDBuTtOqS9EkYG_9Ze9sRXDa7dYu108Oo)) [U, low confidence].
- **App:** 6.1M installs, newest mean 3.53, 35% low. The dominant complaint is that it **went paid** ("I loved the app very much previously. But now we have to pay…") [V].
- **Lesson.** Distribution and money (Jio) did not make Embibe a habit. A free-to-paid switch without a felt step-up in value produces backlash.

### 4.10 Cuemath — premium human 1:1 that went global

**Product and pricing [V]** ([pricing](https://www.cuemath.com/en-in/pricing/)):
- Live 1:1 maths on the proprietary **"Cuemath Leap"** platform, 2–3 classes a week. Sessions are 40 minutes (KG–G2) or 55 minutes (G6–G8).
- KG–G5: ₹678/class on a 6-month plan; **₹610/class on a 12-month plan (₹63,458 + 18% GST ≈ ₹74,880/yr ≈ ₹6,240/month)**.
- G6–G8: ₹900/class (6-month) or ₹800/class (12-month, ₹83,200 + GST ≈ ₹98,176/yr).
- "Full refund of the unused classes."
- US pricing from $20/class. Claims 200k parents in 80+ countries ([cuemath.com](https://www.cuemath.com/en-in/)).

**Numbers [S].**
- FY25 revenue ₹155–157 cr (+17–19%), loss −₹45.9 cr ([Inc42](https://inc42.com/company/cuemath/financials/)).
- FY24 revenue is ₹126.4 cr per Entrackr but ₹131.9 cr per Inc42; the FY24 loss figures also conflict [U].
- Laid off about 100 staff twice in 2023 ([Entrackr](https://entrackr.com/tags/cuemath)).

**App [V].** 2.7M installs, newest mean 4.31. Parents praise individual teachers by name and criticise the app's UX and scheduling. One parent paid ₹54,000 for a year (2023).

**Lesson.** Indian parents do pay ₹60–100k a year for a trusted 1:1 human maths tutor. Cuemath's shift toward the US market also suggests the Indian premium segment is thin. The emotional bond is with the *named teacher*, which supports Taxila's persona thesis.

### 4.11 Seekho and Seekho Jr — Hinglish micro-subscriptions, bought with ads

- **Seekho [S]:** short Hinglish videos on tech, money and English, i.e. adult upskilling, not K-12.
  - FY25 revenue ₹141.5 cr (12.3×), mostly subscriptions. **Ads ₹134.2 cr (95% of revenue).** Loss −₹38.8 cr.
  - Raised a $28M Series B (Bessemer) at $180M ([Entrackr](https://entrackr.com/fintrackr/seekho-spends-rs-134-cr-on-advertising-for-rs-142-cr-revenue-in-fy25-11205187)). Monthly revenue was about $4M in April 2025 [S].
  - 185M installs; in-app ₹99–999 [V].
- **Seekho Jr [V]:** "India's first Edutainment OTT platform for kids", with Hindi videos on alphabets, numbers, stories and rhymes. Launched 2025-04-23; 9.8M installs; newest mean 4.52.
- **Complaints [V]:** ₹1 trial followed by auto-pay of ₹199/₹799, and "khud he pysy kat lyty h" ("they deduct money on their own").
- **Lesson.** Hindi-belt families do adopt kids' learning content in Hindi at scale, and fast. But the trial-to-auto-pay funnel harvests refunds and anger. Also, video consumption is not learning, and nothing in the product checks understanding.

### 4.12 Kutuki — preschool, multilingual, apparently stalled

- Product: ages 3–7, 3,000+ stories, rhymes, books and activities in **9 Indian languages**; ₹99–299 in-app; 5.5M installs ([Play](https://play.google.com/store/apps/details?id=com.soniqmantra.kutuki)) [V].
- Funding: $2.2M from Omidyar Network India and others in February 2021 ([Inc42](https://inc42.com/company/kutuki/)) [S].
- Signs of stalling: the app was **last updated 2025-04-16**, and kutuki.com was unreachable on 2026-10-02 [V/U].
- A parent (2024): "not at all suitable for learning hindi … don't fall for the trail" [V].
- **Lesson.** Indian-context, multilingual content wins parents' affection ("made in Indian context and is so much more relatable", 2026-07-26) but is hard to fund at ₹99–299 a month.

### 4.13 PW CuriousJr — the K-9 incumbent to beat

**Product [V].**
- Classes 1–9 (the site says 1–10). Live small-group after-school classes six days a week in English, Maths, Science and SST, for CBSE, ICSE and state boards.
- Mental Maths uses 10–15 learners per class; Cambridge English uses 4–5.
- **Two-teacher model** (an educator plus a "personal mentor"), 24×7 mentor support, daily progress tracking, and PTMs.
- **₹29 demo class.** Claims "15 Million students on the app" ([pw.live/curious-jr](https://www.pw.live/curious-jr), [curiousjr.com](https://www.curiousjr.com/)).
- App: 5.5M installs, newest mean **4.72**, only 6% low reviews.

**Business [S].**
- CuriousJr revenue grew **4× YoY**; PW's State Boards revenue grew **9×**.
- PW overall: 5.34M paid users, ARPU ₹4,104/yr.
- PW dropped school acquisitions in favour of an asset-light K-12 strategy ([Medianama](https://www.medianama.com/2026/05/223-physicswallah-u-turn-school-ai-for-growth-q4-fy26/)).

**AI [S]** ([Medianama](https://www.medianama.com/2026/08/223-physicswallah-personal-ai-tutoring-services/)):
- AI Guru: 99.45M text queries.
- Ask AI: 3.05M voice doubts.
- AI Grader: 1.43M answer copies.
- AI Mentor: 0.52M users.
- **1:1 AI tutor**: beta with 300+ students; 95% lesson-level accuracy; under 1% errors; 1.8–2.2 s latency; about $0.20/h voice-to-voice; full launch planned for Q2 FY27.
- PW co-founder: online ARPU is "less than Rs 4,000", so PW invests in small models.

**Complaints [V].** Few. One parent says admission agents "promise a lot … after admission no one receive calls". A child complains about per-action ₹9 charges.

**Lesson.** PW is Taxila's real competitor for families in the Hindi belt, especially for classes 6–9. It already has the trust brand, the price point (₹342/month on average), Hindi-speaking teachers, and a voice AI tutor about to launch. Taxila's differentiation cannot be "an AI tutor in Hindi". It has to be *understanding detection plus multimodal re-teaching plus relationship* that is measurably better on learning outcomes.

### 4.14 Others worth knowing (K-9 relevance)

| player | what | evidence | relevance |
|---|---|---|---|
| **Infinity Learn** (Sri Chaitanya) | live classes for grades 1–12, JEE/NEET; Meta Jr for K-5 | newest mean **3.32**, 39% low; refund theme 41/156; parents report paying ₹35,400 and **₹75,000** [V] | shows the BYJU'S-style sales model is still running at Sri Chaitanya scale |
| **Vidyakul** | Hindi/English classes for Bihar, UP, Gujarat boards 9–12 | 7.8M installs, newest mean 4.28 [V] | proof of state-board, Hindi-medium demand (RBSE adjacent) |
| **Filo** | instant 1:1 human expert, ₹299–999 | 7.2M installs, newest mean 4.39; "Instead use chatgpt" complaints [V] | human-on-demand is being squeezed by LLMs |
| **YoLearn.AI** | real-time voice AI tutor, photo solve, teacher avatar | 127k installs; 232 of 245 recent reviews are 5★; "all fake reviews" and "just a wrapper" alleged [V/U] | closest AI-native rival (see tech-and-market.md); traction unproven |
| **Khan Academy** | free; NCERT-aligned; Khanmigo | 33.8M installs; newest mean 3.79; bugs and US-centric complaints [V] | free floor; weak India UX |
| **Teachmint / NextOS** | school OS and "AI connected classes" | 20.5M / 2.3M installs [V] | possible school-distribution partners or rivals |
| **"Leap"** | no K-9 "Leap" brand found; **"Cuemath Leap"** is Cuemath's tutoring platform [V]; LEAP Scholar is study-abroad (out of scope) | — | treated under Cuemath |

---

## 5. Price ladder: what an Indian family pays (₹, 2026)

| tier | example | price | per hour of tutoring (derived) | source |
|---|---|---|---|---|
| free | Khan Academy, DIKSHA, YouTube PW | ₹0 | ₹0 | [V] |
| micro-subscription | Seekho Jr / Kutuki / Filo | ₹99–999 in-app; ₹1 trial → ₹199/₹799 auto-pay | n/a (video) | [V] |
| school B2B | Embibe (2023) / LEAD (2026) | ₹500 / about ₹943–1,037 per student per year | n/a | [S]/[derived] |
| self-serve content | Extramarks | ₹616/month (about ₹7.4k/yr) | n/a | [V] |
| mass live coaching | PW ARPU; Vedantu group | ₹4,104/yr average; from ₹9,000/yr | about ₹20–50/h in a group [U] | [S]/[V] |
| spoken-English AI | LEAD Fluento | about ₹2,000 per student per year | — | [S] |
| premium live packages | Infinity Learn; historical BYJU'S | ₹35k–75k (multi-year); ₹30k–3L | — | [V reviews]/[U] |
| **human 1:1** | **Vedantu; Cuemath** | **₹800–888/h; ₹610–900 per class + GST (≈₹63k–98k/yr)** | **≈ ₹700–1,030/h** | **[V]** |

**Implications for the Taxila price.**
- ₹299–699/month (as proposed in tech-and-market.md §5.1) sits *between* PW's average (₹342) and Extramarks (₹616). That is credible.
- Against a human 1:1 tutor at about ₹800/h it is 1–2 tutoring hours a month for the price.
- Marketing should frame it as hours: "a personal tutor every day for the price of one hour a month."

---

## 6. AI feature landscape among incumbents

| player | doubt-solving | adaptive practice / analytics | AI mentor / planner | voice tutor | animated persona | understanding checks + re-teach in a new modality | Hindi/Hinglish voice for K-9 |
|---|---|---|---|---|---|---|---|
| PW | AI Guru (text), Ask AI (voice) [S] | AI Grader [S] | AI Mentor [S] | **beta, launch Q2 FY27** [S] | none found | "proactively engages … questioning" [S]; depth unknown [U] | likely (Hindi-first brand) [U] |
| LEAD | — | TechBook, analytics [S] | Socrates (teacher-facing) [S] | **Ms Curie, classroom, Indian accents** [S] | **yes** [S] | "adapts … instant feedback" [S]; not shown [U] | English only today [S] |
| Vedantu | InstaSolve [S] | LearnList [S] | **Ved** [S] | no | no | playlists "based on understanding" [S] | no |
| Extramarks | doubt AI [V claim] | Bloom's-taxonomy recommendations [V claim] | teacher assistant [S] | no | no | no | no |
| Embibe | — | deep test analytics [V claim] | "MB" mentor [V claim] | no | no | no | Hindi text [V] |
| Aakash | 10 h/day human doubts [S] | AI SWOT [S] | — | no | no | no | no |
| BYJU'S | Ask a Doubt (photo) [V] | Warm Up / Sprint / Race [V] | (BADRI/WIZ, 2023) [U] | no | no | no | no |
| Doubtnut / Allen | photo → video [S] | — | — | no | no | no | Hindi video [S] |
| YoLearn | photo [V] | — | "AI study mentor" [V claim] | **yes, real-time** [V claim] | teacher avatar (for teachers) [V claim] | not shown | 22 languages claimed [S] |
| Cuemath / Seekho / Kutuki | — | Cuemath: MathFit diagnostic [V] | — | no | no | no | Kutuki: 9 languages, video only [V] |

**Takeaway.**
- Every column except the last two is crowded.
- "Understanding checks + re-teach in a new modality" and "Hinglish voice for classes 1–9 at home" are open. No incumbent can show either working at scale.
- The **animated named persona** has been validated by LEAD, but only for English speaking practice in classrooms.

---

## 7. What worked and what failed (patterns)

| worked | evidence |
|---|---|
| very low price at very large volume, built on teachers with personal brands and free YouTube | PW 5.34M paid users at ₹4,104/yr; 4.72 lifetime rating [S/V] |
| B2B through affordable private schools: bundled books, devices and training at about ₹1,000 per student per year | LEAD EBITDA +₹30 cr, NRR 100% [S] |
| a named human tutor, 1:1, with refunds for unused classes | Cuemath reviews praise teachers by name; 4.31 newest mean [V] |
| two-teacher model (expert plus mentor) with daily parent updates | BYJU'S originated it; CuriousJr runs it at 4.72 [V] |
| Hindi-first, state-board content | Vidyakul 4.28; PW State Boards 9×; Seekho Jr 9.8M installs in 17 months [V/S] |
| Indian-context, multilingual early-years content | Kutuki parents: "made in Indian context … relatable" [V] |
| cinematic visual explanations | BYJU'S nostalgia reviews [V] |

| failed | evidence |
|---|---|
| commission sales, multi-year prepaid bundles, EMI loans | BYJU'S insolvency; Trustpilot 1.3; loans continuing after cancellation [S] |
| sales promises the delivery side cannot keep (classes not held, teacher churn) | Infinity Learn and BYJU'S Premium parent reviews [V] |
| free-to-paid switch without a felt step-up in value | Embibe backlash; Extramarks "asking for money for every video" [V] |
| reach without monetisation | Doubtnut ₹194 cr spent for ₹10 cr revenue [S] |
| growth bought with ads | Seekho: ads = 95% of revenue [S] |
| roll-ups of content brands | Toppr and Meritnation apps gone [V] |
| login friction and app instability | 22% of all low reviews; BYJU'S OTP failures [V] |
| deceptive trials and auto-pay | Seekho/Seekho Jr ₹1 → ₹799 [V] |
| a content library without placement by level | Seekho Jr "my 9-year-old gets 6-year-old content" [V] |

---

## 8. Implications for Taxila (proposed decisions; each has a reversal condition)

1. **No sales calls, no multi-year prepaid plans, no EMI, no ₹1-trial auto-pay.** Use a monthly plan, cancel in one tap, and refund the unused balance pro-rata, as Cuemath does.
   - *Why:* the top three parent complaint themes are mis-selling, paywall and refunds (§3.2), and the BYJU'S collapse.
   - *Reverse if:* a measured A/B test shows assisted sales raise 90-day retained paid users without raising refund requests above about 5%.
2. **Treat reliability and login as product-critical.** Use OTP-less login (WhatsApp or Truecaller), keep sessions alive across app restarts, provide a degraded offline mode, and set a crash-free target of ≥99.5%.
   - *Why:* this is the #1 complaint theme at 22%, and BYJU'S-style OTP failure is reputationally fatal.
   - *Reverse if:* low-star reviews, sampled the same way, show bugs/login under 5%.
3. **Price at ₹299–699/month and frame it against tutor hours.** The human 1:1 market price is ₹800–1,030/h (§5); PW's average is ₹342/month.
   - *Reverse if:* willingness-to-pay tests in Hindi-belt tier-2 cities clear below ₹299 at the target conversion.
4. **Build the moat in the two empty columns of §6:** covert understanding checks with re-teaching in a different modality, and a Hinglish voice persona for classes 1–9 at home. Publish learning-outcome evidence, because every incumbent's AI claims are unmeasured.
   - *Watch:* PW's AI tutor general availability (planned for Q2 FY27, i.e. now) and whether LEAD's Ms Curie expands from English into maths and science.
   - *Reverse if:* PW ships comparable understanding detection with outcome data.
5. **Decide the channel question explicitly: B2C at home, B2B2C through schools (the LEAD model, about ₹1,000 per student per year, 100% NRR), or both.**
   - The school channel is where profit has been demonstrated in K-8. It is also where LEAD is shipping Ms Curie.
   - **Possible wedge:** Taxila as the *evening, at-home companion* to the school's textbook. LEAD and Extramarks are classroom-first, and their student apps rate 4.34 and 3.42 newest.
6. **The parent is a silent buyer.** Only 2% of low reviews are written by parents.
   - Do not rely on store reviews to hear from them. Run a proactive parent channel (weekly Hindi WhatsApp voice notes, as in tech-and-market.md §5.1) and a direct complaint line answered by a human within 24 h. This is the opposite of the "no one receives calls after admission" pattern.
7. **Place children by diagnosed level, not by age or grade.** Seekho Jr's complaint (§3.3), together with the ASER evidence in learning-science.md, supports this.
8. **Measure health with honest metrics:** newest-200 review mean, low-star share, parent-authored complaint share, refund-request rate, and 30/90-day retention. Never solicit reviews in-app in a way that would make the CuriousJr/YoLearn pattern meaningless.
9. **Opportunistic, not core:** BYJU'S (50,000+ videos in 6+ languages), Toppr and Meritnation content may be cheap to license or buy through the RP. The K3 assets auction (₹16 cr against a claimed ₹150 cr) shows prices are low. Feasibility and IP chain-of-title are [U]. This only makes sense if a content audit shows NCF-2023-aligned material is reusable.
10. **Copy what worked from the two-teacher model, for an AI:** an "expert explainer" mode plus a "personal mentor" persona that does homework help, check-ins and parent updates. Parents already understand and value this split (BYJU'S Classes, CuriousJr).

---

## 9. Open questions / to verify

- **No Reddit or consumer-forum evidence.** Reddit returned 403. Next step: a human-run read of r/india, r/IndianParenting (if it exists) and r/JEENEETards, and of consumercomplaints.in and NCH data. [U]
- **Private tuition market size and spend per child** (NSS CMS:E 2025) was not fetched because the search budget ran out. It is needed for TAM and should be sourced from the MoSPI release. [U]
- **Coaching regulation:** the Ministry of Education's 2024 "Guidelines for Regulation of Coaching Centres" reportedly bar enrolling under-16s in coaching centres. The PDF returned 403. Check whether the guidelines apply to online AI tutoring for classes 1–9. [U]
- **CuriousJr full pricing** is not public. A mystery-shop is needed. [U]
- **Extramarks FY25 and Embibe financials:** Wikipedia's "₹284 cr (2025)" and Tracxn's "<₹10 cr" are unverified. [U]
- **BYJU'S AI products** (BADRI, MathGPT, WIZ, 2023) were not verified this session. [U]
- **Meritnation and Kutuki:** both domains were unreachable through the proxy. Confirm from a normal network. [U]
- **PW AI tutor:** has it reached general availability, and does it cover classes 1–9 or only 9–12? Re-check after PW's Q2 FY27 results (expected in November 2026).
- **LEAD Ms Curie:** subjects beyond English, Hindi support, and whether there is an at-home student-app mode.

---

## 10. Sources (all fetched or queried 2026-10-02)

**Primary / measured [V]**
- Google Play listings and 400 newest reviews per app via google-play-scraper: [BYJU'S](https://play.google.com/store/apps/details?id=com.byjus.thelearningapp&hl=en_IN), [Vedantu](https://play.google.com/store/apps/details?id=com.vedantu.app), [Unacademy](https://play.google.com/store/apps/details?id=com.unacademyapp), [Extramarks](https://play.google.com/store/apps/details?id=com.Extramarks.Smartstudy), [LEAD](https://play.google.com/store/apps/details?id=com.leadschool.parentapp), [Embibe](https://play.google.com/store/apps/details?id=com.embibe.student), [Cuemath](https://play.google.com/store/apps/details?id=com.cuelearn.cuemathapp), [Seekho](https://play.google.com/store/apps/details?id=com.seekho.android), [Seekho Jr](https://play.google.com/store/apps/details?id=com.seekhojunior.android), [Kutuki](https://play.google.com/store/apps/details?id=com.soniqmantra.kutuki), [PW](https://play.google.com/store/apps/details?id=xyz.penpencil.physicswala), [CuriousJr](https://play.google.com/store/apps/details?id=com.curiousjr), [ALLEN](https://play.google.com/store/apps/details?id=digital.allen.study), [Infinity Learn](https://play.google.com/store/apps/details?id=com.infinitylearn.learn), [Vidyakul](https://play.google.com/store/apps/details?id=com.vidyakul), [Filo](https://play.google.com/store/apps/details?id=com.filo.student), [YoLearn](https://play.google.com/store/apps/details?id=com.yolearn.student), [Khan Academy](https://play.google.com/store/apps/details?id=org.khanacademy.android), [myAakash](https://play.google.com/store/apps/details?id=com.aakash.myaakashapp). Raw numbers: `playstore-snapshot-2026-10-02.json`.
- Company sites: [vedantu.com](https://www.vedantu.com/), [Vedantu class 8](https://www.vedantu.com/cbse/class-8), [Cuemath India pricing](https://www.cuemath.com/en-in/pricing/), [cuemath.com/en-in](https://www.cuemath.com/en-in/), [pw.live/curious-jr](https://www.pw.live/curious-jr), [curiousjr.com](https://www.curiousjr.com/), [byjus.com](https://byjus.com/), doubtnut.com → allen.in/dn (redirect observed), toppr.com (expired certificate observed).

**Secondary [S]**
- BYJU'S: [Wikipedia](https://en.wikipedia.org/wiki/Byju's); [BS: NCLT stays K3 sale](https://www.business-standard.com/companies/news/nclt-stays-16-cr-sale-of-byju-s-k3-linked-assets-flags-valuation-concerns-126090500806_1.html); [BS: bidding paused](https://www.business-standard.com/companies/news/nclt-pauses-byju-s-insolvency-bidding-till-aug-31-giving-founders-relief-126072301153_1.html); [BS: upGrad EoI](https://www.business-standard.com/companies/news/ronnie-screwvala-upgrad-buy-byujs-assets-think-learn-acquisition-insolvency-125111501118_1.html); [BS: lenders and Aakash stake](https://www.business-standard.com/companies/news/byju-s-lenders-seek-30-stake-in-indian-education-group-in-settlement-126062601140_1.html); [BS: BYJU'S 3.0](https://www.business-standard.com/companies/start-ups/byju-raveendran-apologises-students-compensation-ai-byjus-3-0-comeback-125051800300_1.html); [Rest of World](https://restofworld.org/2025/byjus-owner-byju-raveendran-comeback-fraud-case/); [Techloy](https://www.techloy.com/byjus-play-store-exit-marks-a-deeper-unraveling-of-indias-edtech-giant/); [Inc42 Play Store](https://inc42.com/buzz/byjus-app-goes-offline-on-play-store/); [Trustpilot](https://uk.trustpilot.com/review/byjus.com); [MEB blog (pricing, low confidence)](https://www.myengineeringbuddy.com/blog/byjus-in-2025-review-pricing-alternatives-future/).
- Vedantu: [Entrackr FY25](https://entrackr.com/fintrackr/vedantu-posts-rs-227-cr-revenue-in-fy25-losses-increase-25-11038680); [Entrackr tag](https://entrackr.com/tags/vedantu); [Ved launch](https://www.entrepreneurindia.com/blog/en/news/vedantu-launches-ved-to-deliver-ai-driven-personalised-learning-across-india.57826); [Open Magazine](https://openthemagazine.com/business/untold-vamsi-krishna-vedantu-and-the-night-it-nearly-fell-apart); [Wikipedia](https://en.wikipedia.org/wiki/Vedantu).
- Unacademy: [BusinessToday](https://www.businesstoday.in/technology/news/story/unacademys-sale-to-upgrad-is-the-final-act-of-indias-edtech-boom-553343-2026-09-04); [Entrackr FY25](https://entrackr.com/exclusive/exclusive-unacademy-narrows-ebitda-losses-by-38-in-fy25-reports-rs-826-cr-income-10513191); [Inc42 reset](https://m.dailyhunt.in/news/india/english/inc42-epaper-inc/unacademy+hits+reset+again-newsid-n697461901); [Inc42 K-12 Techno](https://inc42.com/features/unacademy-k-12-techno-merger-acquisition-edtech-losses/); [Wikipedia](https://en.wikipedia.org/wiki/Unacademy).
- Extramarks: [Entrackr FY24](https://entrackr.com/fintrackr/extramarks-losses-drop-by-85-to-rs-48-cr-in-fy24-revenue-slips-37-8713664); [Tribune: Extra Intelligence](https://www.tribuneindia.com/news/extra-intelligence/extramarks-launches-extra-intelligence-a-global-leap-in-ai-powered-education); [Wikipedia](https://en.wikipedia.org/wiki/Extramarks); [Inc42](https://inc42.com/company/extramarks/financials/).
- LEAD: [Entrackr FY26](https://entrackr.com/fintrackr/edtech-unicorn-lead-group-posts-rs-387-cr-revenue-in-fy26-losses-narrow-20-12431698); [The Wire/PTI ARR](https://m.thewire.in/article/ptiprnews/lead-group-achieves-ebitda-breakeven-secures-arr-of-rs-415-cr-for-ay-25-26); [BS 1,200 schools](https://www.business-standard.com/companies/start-ups/ed-tech-firm-lead-group-targets-partnering-with-1-200-schools-in-2026-126010700826_1.html); [BS/Magzter AI 40%](https://www.magzter.com/stories/newspaper/Business-Standard/EDTECH-SOLUTIONS-PROVIDER-LEAD-GROUP-EXPECTS-AI-TO-CONTRIBUTE-40-TO-REVENUE-IN-35-YRS); [CXO Digitalpulse Ms Curie](https://www.cxodigitalpulse.com/lead-group-launches-ms-curie-an-ai-tutor-enabling-11-personalised-learning-in-classrooms/); [Tribune Ms Curie](https://www.tribuneindia.com/news/schools/ms-curie-brings-ai-tutoring-to-schools/); [Inshorts](https://inshorts.com/en/news/edtech-startup-lead-introduces-ai-powered-tutor--ms-curie--1775582654546); [Forbes India](https://www.forbesindia.com/article/ai-tracker/ai-who-will-teach-the-teachers/2988533/1); [Wikipedia](https://en.wikipedia.org/wiki/LEAD_School).
- Aakash / Meritnation: [Entrackr Aakash](https://entrackr.com/analysis/aakash-struggles-break-free-from-byju-era-as-topline-stagnates-for-three-years-12486185); [Careers360](https://news.careers360.com/aesl-expands-aakash-digital-20-offer-ai-powered-coaching-for-neet-jee-olympiads); [Inc42 Meritnation](https://inc42.com/buzz/aakash-educational-to-acquire-meritnation-for-inr-50-cr/).
- Doubtnut: [BS Allen acquisition](https://www.business-standard.com/companies/news/allen-career-institute-acquires-ai-enabled-edtech-platform-doubtnut-123120400620_1.html); [Entrackr tag](https://entrackr.com/tags/doubtnut).
- Embibe: [The Ken via Embibe](https://www.embibe.com/in-en/embibe-in-news/reliance-jiofy-edtech-embibe/); [Entrackr tag](https://entrackr.com/tags/embibe); [Tracxn](https://tracxn.com/d/companies/embibe/__bNxse3FZdlFDBuTtOqS9EkYG_9Ze9sRXDa7dYu108Oo).
- Cuemath: [Inc42 financials](https://inc42.com/company/cuemath/financials/); [Entrackr tag](https://entrackr.com/tags/cuemath).
- Seekho: [Entrackr FY25](https://entrackr.com/fintrackr/seekho-spends-rs-134-cr-on-advertising-for-rs-142-cr-revenue-in-fy25-11205187); [Entrackr tag](https://entrackr.com/tags/seekho).
- Kutuki: [Inc42](https://inc42.com/company/kutuki/).
- PW: [Medianama Q4 FY26](https://www.medianama.com/2026/05/223-physicswallah-u-turn-school-ai-for-growth-q4-fy26/); [Medianama AI tutor](https://www.medianama.com/2026/08/223-physicswallah-personal-ai-tutoring-services/).


## Fact-check

Adversarial pass, 2026-10-02. Primary pages re-fetched; Play Store numbers and the low-star theme aggregate re-run live. Verdicts: supported / partly / unsupported / wrong. Business Standard and Magzter returned 403 and the WebSearch budget was exhausted, so claims resting only on those stay unverified.

| # | Claim | Verdict | Corrected value / note | Source |
|---|---|---|---|---|
| 1 | Human 1:1 ~₹700-1,030/h; Vedantu ₹800 (class-8) / ₹888 (home); Cuemath ₹610-678 KG-G5, ₹800-900 G6-8 + 18% GST; 12-mo G3-5 ₹63,458 + GST (~₹74,880); AI 30-40x cheaper | partly | Vedantu ₹800 and ₹888 confirmed. Cuemath page shows only "from ₹610" (KG-G5) and "from ₹800" (G6-8) on 12-month plans, which are 20% discounted; ₹678 and ₹900 upper ends are not on the fetched page. 12-mo = 104 classes, platform fee waived, so 104 x 610 = ₹63,440, consistent with ₹63,458. The ₹700-1,030 range and the 30-40x ratio are derived, not sourced. | vedantu.com/cbse/class-8; vedantu.com; cuemath.com/en-in/pricing/ |
| 2a | PW ₹4,104 per paid user per year across 5.34M paid users | partly | 5.34M paid users (+20% YoY) confirmed. ₹4,104 is "average collection per user (online)", up 11%; the article does not define the period or denominator, so "per paid user per year" and "~₹342/month" are an assumption. "Cheapest proven paid channels" is a judgment. | medianama.com/2026/05/223-physicswallah-u-turn-school-ai-for-growth-q4-fy26/ |
| 2b | LEAD ₹943/student/yr (₹386.6 cr / 41 lakh); FY26 EBITDA +₹30 cr; 100% NRR | partly | ₹386.6 cr, ~41 lakh students, EBITDA ₹30 cr (from ₹4 cr) confirmed. 100% NRR confirmed in a LEAD press release (The Wire/PTI, 'nearly 4M' students, 8,500+ schools), which is self-reported and covers AY25-26. Caveat: 71% of revenue is products (books, devices), so ₹943 is not a comparable subscription ARPU. The same release gives FY25 revenue ₹367 cr versus Entrackr's ₹351.5 cr. Net loss ₹34.5 cr, so "EBITDA positive" is not profit. | entrackr.com (LEAD FY26); m.thewire.in (LEAD PR) |
| 3 | LEAD Ms Curie (Apr 2026): K-8 1:1 in classrooms, animated character, Indian accents, Fluento ~₹2,000/student/yr, 1,000+ schools / 400k students in 12-18 months, AI = 40% revenue in 3-5 years | partly | Confirmed: April 2026 launch, K-8, 1:1 in classroom, Indian-accent recognition, 1,000+ schools / ~400k students in 12-18 months, Fluento spoken English built on it. Not found in the sources I could read: animated character, "engagement once the character appears", ₹2,000 price, 40% (Magzter 403). Pilot: ~1,000 students, 10 schools, ~2x conversational improvement, self-reported. LEAD is B2B2C and sells to schools. "Most direct threat" is opinion. | cxodigitalpulse.com; tribuneindia.com/news/schools/ms-curie-brings-ai-tutoring-to-schools/ |
| 4 | PW CuriousJr: newest-400 mean 4.72, 6% low, 5.5M installs; revenue 4x; State Boards 9x; voice AI tutor beta 300+ students, 95% lesson accuracy, ~$0.20/h, Q2 FY27 launch | mostly supported | Re-pulled: mean 4.72, 6% low, 5,473,795 installs (displayed "5M+"). 4x and 9x confirmed. Beta 300+ students (and 1,000+ queries), 95% lesson-level accuracy, <1% error, $0.20/h, Q2 FY27 confirmed. Corrections: the Play listing is titled "Class 1st-8th" and the article says classes 1-10, not 1-9. "Healthiest in K-9" is wrong as stated: YoLearn newest mean is 4.84 (but suspected gamed, see #11) and Vedantu is 4.52, Seekho Jr 4.54. The ₹29 demo was not checked. | play.google.com (com.curiousjr, scraper); medianama.com/2026/08/223-physicswallah-personal-ai-tutoring-services/ |
| 5 | 1,895 low reviews, 20 apps; bugs/login/OTP 22%, paywall 13%, refund/fraud 10%, teacher 7%, support 7%, sales 6%, language ~1%, AI ~1% | supported (with method caveat) | Re-run gives 1,893 low reviews (drift of 2 from new reviews) and identical percentages: bugs 22, paywall 13, refund 10, teacher 7, support 7, sales 6, language 1, AI 1. Caveats: themes are overlapping English regexes (the paywall regex includes "free" and "paid"; the bugs regex includes "slow", "error", "lag"). Pull is lang=en, so Hindi/Hinglish reviews are under-read, which likely understates the language theme. Treat these as keyword-match rates, not mutually exclusive topics. | playstore_themes_aggregate.py (re-run) |
| 6 | Only 41 of 1,895 low reviews (2%) visibly by parents; themes sales 34, paywall 32, teacher 32, support 29, refund 27, not held 12 | supported as reproduced; definition weak | Re-run reproduces 41 and all listed percentages. But "parent" is a regex that also matches "parents", "beta", "bachche" anywhere, so it is neither a precise nor a "visible" authorship test. The high-parent-density apps are Infinity Learn (53 parent mentions), Cuemath (30), Kutuki (29), CuriousJr (25). Conclusion "parents are silent" rests on the low-star subset only; parent-mean stars are high (CuriousJr 4.92, Seekho Jr 4.88). | playstore_themes_aggregate.py (re-run) |
| 7 | BYJU'S zombie: NCLT paused bidding to 2026-08-31, Sept 2026 stayed ₹16 cr K3 sale (~₹150 cr worth); app under Toppr dev, not updated since 2024-06-11; mean 2.39 (64% low) vs 4.05; most complaints OTP; Trustpilot 1.3, 93% 1-star | mostly supported | Confirmed live: developer "Toppr", updated 2024-06-11 (timestamp 1718117564), lifetime 4.05, newest mean 2.39, 64% low, 127.8M real installs; Trustpilot 1.3/5 (271 reviews), 93% 1-star. NOT verified: NCLT stay, ₹16 cr/₹150 cr, bidding pause (Business Standard 403, no search budget). "Most recent complaints are OTP": in the newest 100 reviews, 20 of 63 low-star mention OTP (about 32%), so a leading theme, not "most". | scraper (com.byjus.thelearningapp); uk.trustpilot.com/review/byjus.com; business-standard.com (unverified) |
| 8a | upGrad bought Unacademy for $200M all-stock, closed 2026-09-01, ~94% below $3.4B; FY25 net loss ₹436 cr | mostly supported | Confirmed: ~$200M (₹2,000 cr), all-stock, closed 2026-09-01, 94% below $3.4B peak. Net loss is ₹435 cr (article), not ₹436 cr; FY25 revenue ₹702 cr (-16%). | businesstoday.in (Unacademy-upGrad) |
| 8b | Doubtnut redirects to allen.in/dn; Doubtnut, Meritnation, and original Toppr packages 404 | partly / one wrong | com.doubtnutapp and com.meritnation.school return 404 (confirmed). The original Toppr package com.toppr.toppr_ask is LIVE: "Toppr", 7.1M installs, newest mean 1.69, 82% low. The allen.in redirect was not re-checked. "Consolidation is complete" overstates: Aakash, PW, Vedantu, Extramarks, Embibe, LEAD and others remain independent operators. | scraper app() calls |
| 8c | Manipal ~73% of Aakash; FY26 revenue flat ₹2,041 cr; EBITDA ₹15.3 cr | supported | Confirmed. Add: EBITDA fell 65% from ₹43.3 cr; BYJU'S stake 13.74%. | entrackr.com/analysis/aakash-struggles-break-free-from-byju-era-as-topline-stagnates-for-three-years-12486185 |
| 9 | Doubtnut ~32M reach, ₹194 cr spend for ₹10 cr revenue FY22, sold to Allen ~$10M; Seekho ₹134.2 cr ads on ₹141.5 cr revenue FY25 (95%) | partly | ₹194 cr / ₹10 cr (FY22) confirmed. Allen acquisition confirmed (Nov 2023) but the price was not in the sources read, so ~$10M is unverified, as is 32M MAU. Seekho ₹134.2 cr marketing and ₹141.5 cr revenue confirmed (95% ratio is correct; marketing is 75% of total expenses; net loss ₹38.8 cr). Seekho is adult and general-skills short video, so it is a weak proxy for Hindi K-12. The ₹1 to ₹199/₹799 auto-pay complaint was not checked. | entrackr.com/tags/doubtnut; entrackr.com (Seekho FY25) |
| 10 | Seekho Jr 9.8M installs, newest 4.52; Vidyakul 7.8M, 4.28; Vedantu "extreme mis-selling" English-only review; Seekho Jr parent says 9-year-old gets 6-year-old content | mostly supported | Installs 9,793,565 and 7,764,292 confirmed. Newest means now 4.54 and 4.29 (drift). Launch 2025-04-23 confirmed. Vedantu review confirmed verbatim ("Extreme Misselling! ... strictly in English"). The Seekho Jr 9-year-old review was not found in the newest 400 (only "Pure Garbage and Ai Slop" and "average" matched), so it is unconfirmed. Vidyakul's listing is "Classes 9-12th", outside the K-9 target. Rapid adoption is shown by installs, not by retention or revenue. | scraper (com.seekhojunior.android, com.vidyakul, com.vedantu.app) |
| 11 | Incumbent AI is doubt-solving/analytics; Vedantu Ved (Nov 2025), Extramarks Extra Intelligence (Jul 2025), Embibe MB, Aakash SWOT, PW AI Guru 99.45M queries; no incumbent shows covert understanding check plus re-teach in Hinglish voice for 1-9 | partly | AI Guru 99.45M text queries confirmed, along with Ask AI 3.05M voice doubts, AI Grader 1.43M, AI Mentor 0.52M. The Vedantu/Extramarks/Embibe/Aakash launches were not re-fetched. The negative claim cannot be proven, and the evidence argues against it being safe: PW's beta voice tutor "proactively poses questions", and LEAD's Ms Curie "adapts to level in real time" with Indian accents for K-8. Neither shows covert checks plus modality-switch re-teach publicly, so say "not publicly evidenced", not "none". | medianama (PW May and Aug 2026); tribuneindia.com (Ms Curie) |
| 12 | Embibe: Reliance ₹590 cr, ₹500/student/yr to schools, newest mean 3.53, 35% low, paywall top; Extramarks: from ₹616/month, FY24 ₹233 cr (-37%), B2C cut 2023, mean 3.42, 36% low | mostly supported | Embibe ₹590 cr confirmed; ₹500 is "as low as" a discounted figure, not the standard price, and the article is dated (2018 stake, 73%). Means 3.53 / 3.42 and 35% / 36% low confirmed. Extramarks ₹233 cr, -37% from ₹369 cr confirmed; consumer business discontinued Sept 2023. The ₹616/month price was not verified. Embibe's "paywall top" is plausible but not separately re-run. The "free to paid backlash" causality is an inference. | embibe.com (Reliance article); entrackr.com (Extramarks FY24); scraper |
| 13 | Store ratings gamed: YoLearn 232 of 245 five-star, 1-star "all fake reviews", "just a wrapper"; CuriousJr/Seekho Jr 5-stars short and generic; BYJU'S 4.05 vs 2.39 | supported on counts, inference on cause | YoLearn 232/245 five-star (n=245, 4% low, mean 4.84) confirmed. Quotes "all fake reviews, worst app ever" and "Just a wrapper ! No value add" confirmed. BYJU'S 4.05 vs 2.39 confirmed. Short generic 5-stars are visible but proving in-app prompting or purchased reviews is not possible from this data. Tag [U] is correct. | scraper (com.yolearn.student, com.byjus.thelearningapp) |
| 14 | Parents pay ₹60-100k/yr for named human maths tutor; Cuemath now US-led ('from $20/class', 200k parents, 80+ countries); FY25 revenue ₹155-157 cr, loss ₹45.9 cr; Indian premium thin | partly / one wrong | "From $20/class", 80+ countries, 200,000+ families confirmed (global site, not specifically parents). FY25 revenue ₹156.6 cr (+18.7%) confirmed. Net loss is ₹46.9 cr, not ₹45.9 cr. The ₹60-100k/yr is not on the cited page: the India pricing page implies ₹63k-75k incl. GST for G3-5 on 12 months, and for G6-8 about 104 x ₹800 = ₹83k before GST, so the range is roughly right but should be labelled derived. "Indian premium segment is thin" is inference: the same India page still sells 12-month plans and expenses fell 22% to ₹199.7 cr, so Cuemath is cutting costs, which is not the same as the India market being small. | cuemath.com/en-in/; cuemath.com/en-in/pricing/; inc42.com/company/cuemath/financials/ |

### Corrections to carry forward
- Cuemath FY25 net loss: ₹46.9 cr (not ₹45.9 cr). Unacademy FY25 net loss: ₹435 cr (not ₹436 cr).
- Toppr (com.toppr.toppr_ask) is live, not 404; Doubtnut and Meritnation are 404.
- PW ₹4,104 is "average collection per user (online)" with no stated period. CuriousJr is classes 1-8 on Play, 1-10 in PW's results article.
- LEAD: animated character, ₹2,000 Fluento price and 40% AI revenue are unverified; ₹943 mixes books and devices into the numerator.
- Unverified (source blocked or not located): NCLT K3 stay and bidding pause, Doubtnut ~$10M sale price and 32M MAU, Extramarks ₹616/month, CuriousJr ₹29 demo, the Seekho Jr 9-year-old review, the Seekho ₹1 to ₹199/₹799 auto-pay complaints, and the Vedantu/Extramarks/Embibe/Aakash AI launch dates.
- Theme percentages are English-regex keyword rates with overlap, and "parent" is a loose regex.
