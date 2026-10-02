# Edtech post-mortems: 15 failure patterns Taxila must avoid

*Research date: 2026-10-02. Scope: BYJU'S (and WhiteHat Jr, Toppr, Epic, Tynker inside it), Lido Learning, Vedantu, Unacademy, Doubtnut, Chegg, 2U, Khanmigo. Adjacent cases where they sharpen a pattern: AltSchool, Replika / Character.AI, China's 2021 tutoring ban, Korea's AI textbook. Companion files, not repeated here: `india-incumbents.md` (Play Store complaint data, current BYJU'S/Unacademy/Toppr status), `india-ai-native.md` (PW, SpeakX), `global-ai-tutors.md` and `../learning-science.md` (Khanmigo RCT in full), `china-asia.md` (China ban), `bigtech.md` (free ChatGPT/Gemini study modes), `../safety/dpdp-deep.md` (DPDP s.9(3)).*

**Tags.** **[V]** = checked at the primary source this session (SEC EDGAR XBRL, company IR release, ASCI PDF, the RCT paper, a regulator or court record). **[S]** = secondary source (Entrackr/Inc42 reports of RoC filings, press, Wikipedia; the URL given is the one I read, and for Wikipedia the underlying citation is named). **[U]** = unverified: from memory, conflicting, or not fetched. **[D]** = derived by me from tagged inputs (the arithmetic is shown).

**Method and limits.**
- The session's web-search budget (200 calls) was already spent when this task started. Every source here was reached by **direct fetch** of a known URL: Wikipedia wikitext (to recover the primary citations), SEC EDGAR XBRL, Chegg's IR site, Entrackr and Inc42 pages, Rest of World, Context (Thomson Reuters Foundation), ASCI's complaint-report PDFs, and the Khanmigo RCT PDF.
- These domains refused the fetch tool: economictimes.indiatimes.com, ndtv.com, reuters.com, wired.com, indianexpress.com, web.archive.org. These returned 403: cnbc.com, businesswire.com, fastcompany.com, education.gov.in. Claims that rest only on those outlets are tagged [S] via Wikipedia, or [U].
- SEC numbers can be re-pulled with `failures_sec_pull.py`, which writes `failures-sec-2026-10-02.json`.
- Reddit and consumer forums were not reached (403, as in `india-incumbents.md`).

---

## 0. Bottom line

1. **No Indian K-12 edtech failure was caused by bad content.** BYJU'S videos are still remembered fondly [V, review quoted in `india-incumbents.md` §3]. The companies died of a **go-to-market and capital structure**: fear-based selling, loan-financed multi-year bundles, revenue booked up front, growth bought at ₹2.4–18 of cost per ₹1 of revenue, and acquisitions paid for with that growth. Taxila could build a far better tutor and still die the same way if it copies this commercial model.
2. **The BYJU'S machine, in numbers.**
   - Sales staff had weekly targets of ₹2 lakh and told parents "your son can be nothing in life" without the course [S, RoW 2021].
   - 54 of 110 complainants analysed did not know they had signed a loan; the average loan was ₹66,000 [S, RoW 2021].
   - About 20% of new users asked for refunds inside the trial, and 30% stopped paying their instalments [S, RoW 2025].
   - The result: $22B (March 2022) → a $225M rights issue (2024), −99% [S]. Tynker was sold for $2.2M after being bought for $200M, and Epic for $95M after $500M [S]. Prosus wrote off its $493M stake [S].
3. **The rest of the Indian cohort shows the same unit-economics disease.** Spend per ₹1 of revenue:
   - WhiteHat Jr ₹4.49 (FY21), with ads alone at 1.84× revenue.
   - Unacademy ₹5.1 (FY21).
   - Lido ≈₹6.2 (FY21).
   - Doubtnut ₹17.96 (FY22).
   - Toppr ₹3.54 (FY21), and its revenue fell 40% in the pandemic boom year.
   - All [S, Entrackr/Inc42] or [D].
   - Vedantu's founder, looking back: "Unit economics was non-existent" [S].
4. **Chegg is the AI-era warning, and it is fully verified.** Revenue went from $776M (2021) to $377M (2025), −51% [V, SEC]. Public float went from $11.8B (June 2021) to $126M (June 2025), −98.9% [V, SEC]. Headcount went from 2,071 to 595 [V, 10-K]. Chegg's own 10-K says students see "ChatGPT and others as strong alternatives to vertically specialized solutions" and that Google AI Overviews "keeps users on Google search results" [V]. **A library of answers, plus search-engine traffic, is not a moat once a general model gives the same answer for free.**
5. **Khanmigo is the AI-tutor product failure, also verified.** In a 2-year RCT in 18 schools, the median student messaged the tutor in only **17% of the exercise sessions where they made a mistake**. The effect was 0.06–0.08 SD per year, "similar to Khan Academy practice without AI assistance" [V]. Sal Khan's verdict on the first version: it "did not change student learning as much as many of us hoped" [V]. **A tutor that waits to be asked is not used.**
6. **Regulators were a proximate cause in more cases than founders admit.**
   - The Department of Consumer Affairs (2022), ASCI (it pulled WhiteHat ads) and the Supreme Court (BYJU'S insolvency) all acted [S].
   - Education was ASCI's top violating sector "for the past few years" before 2022-23 [V]. In 2022-23 it was still 16.5% of the 7,581 ads that needed modification [V].
   - China's ban cut TAL to 22.7% of its pre-ban revenue [D from V, `china-asia.md`].
   - Italy's privacy regulator stopped Replika from processing users' data in February 2023 [S].
   - **Taxila's CLAUDE.md says "compliance is deprioritised".** The evidence here says that is a failure pattern in its own right (P6). DPDP s.9(3) bans behavioural monitoring of all under-18s from 13 May 2027 [V via `dpdp-deep.md`], seven months from today.
7. **Several parts of Taxila's own thesis walk into these patterns** (§5):
   - "Replace all tutors" invites over-claiming (B7).
   - "Covert understanding detection" is the same instrument BYJU'S turned into a sales weapon (B1), and it is what DPDP s.9(3) restricts (P6).
   - "Bonds over months" is the Replika and Character.AI risk surface (P4, P6).
   - "Generate everything on the fly" is a reliability and COGS risk (P3, B4).
   - Each needs a hard rule, not a value statement.
8. **The survivors share four traits:** low prices without coercion (PW at ₹4,104 per paid user per year), a free funnel that is not the product, a channel that carries trust (YouTube teachers, schools), and costs that stay near revenue (§6). That is the shape Taxila should copy.

---

## 1. Case files

### 1.1 Summary table

| company | peak | outcome (as of 2026-10-02) | proximate cause | root cause | key numbers |
|---|---|---|---|---|---|
| **BYJU'S** | $22B (Mar 2022) [S] | insolvency; app frozen since 2024-06; delisted May 2025 over unpaid AWS bills [S] | $1.2B TLB default; ₹158 cr BCCI sponsorship dues triggered NCLT (Jul 2024) [S] | fear-based hard sell + loan-financed bundles + up-front revenue + ~$2.8B of acquisitions [S] | 60k → 14k staff [S]; FY22 revenue ₹5,298 cr, loss ₹8,245 cr [S] |
| **WhiteHat Jr** (BYJU'S) | bought for $300M (2020) [S] | rebranded / folded (2023) [S] | losses; mass layoffs | ad-led selling of "coding prodigies"; ASCI pulled 5 TV ads; the "Wolf Gupta" child was fictional [S] | FY21: ₹484 cr revenue, ₹2,175 cr spent, ₹891 cr ads, −₹1,690 cr [S] |
| **Lido Learning** | ~$24M raised [S] | shut Feb 2022; IBC s.10 insolvency Sep 2022 [S] | lead investor withdrew; Temasek round failed [S] | live small-group K-9 classes priced at ₹50k–1.4L (Entrackr calls this "monthly"; more likely a package price [U]), with no margin [S] | FY21: ₹11.3 cr revenue, ₹70 cr spend, −₹58.7 cr [S]; parents' auto-debits continued after closure [S] |
| **Vedantu** | $1B (Sep 2021) [S] | survived, small: FY25 ₹227 cr revenue, ₹1.96 spend per ₹1 [S] | collections ₹230 cr (FY22) → ₹95 cr (FY23), −59% [S] | ~8,000 peak staff; ad blitz; "unit economics was non-existent" [S] | ~1,600 laid off [S]; FY22 −₹696 cr [S] |
| **Unacademy** | $3.44B (2021–22) [S] | sold to upGrad for $200M all-stock, closed 2026-09-01 (~94% below peak) [S] | funding winter; cash conservation [S] | 10+ acquisitions, "super-app" sprawl, star-teacher costs (₹1–10 cr packages), exited K-12 [S] | FY21 −₹1,537 cr; employee costs ×6.25 in a year [S]; ~1,000 laid off in 2022 [S] |
| **Toppr** | bought by BYJU'S for ~$150M (2021) [S] | absorbed; original app 404; toppr.com certificate expired [V, `india-incumbents.md`] | "inability to scale and raise follow-on capital" [S] | undifferentiated K-12 app losing a marketing war | revenue −40% in FY21 (₹84 cr → ₹51 cr) while edtech boomed; ₹3.54 spend per ₹1 [S]; 300+ laid off after acquisition [S] |
| **Doubtnut** | ~32M monthly reach [S] | bought by Allen for ~$10M (Dec 2023); app 404 [S]/[V] | could not fund the burn; costs cut 80% (Apr 2023) [S] | free photo-to-answer at scale; monetisation an afterthought | FY22: ₹10.8 cr revenue vs ₹194.5 cr spend (₹17.96 per ₹1) [S] |
| **Chegg** | $11.8B public float (Jun 2021) [V] | standalone after a failed sale review; 56% of staff cut in 2025 [V] | ChatGPT (2023) and then Google AI Overviews (from Aug 2024) cut traffic [V] | answer library + SEO acquisition; commoditised by free general AI | revenue −51% (2021→2025) [V]; non-subscriber traffic −49% YoY (Jan 2025) [V] |
| **2U** | ~$4B market cap (Feb 2021) [S]; $4.1B float (2018) [V] | Chapter 11 (Jul 2024); >$450M of debt eliminated [S] | ~$908M of long-term debt [V] | never one profitable year (2012–2023) [V]; edX bought for $800M on pandemic demand; partner and lawsuit fallout [S] | cumulative net loss ≈$1.48B (2012–2023) [D from V] |
| **Khanmigo** | flagship of the "AI tutor for every child" idea | relaunched in 2026 with auto-activation [V] | students did not use it | passive "ask me" design | 0.06–0.08 SD per year; 17% of mistake sessions had any message [V] |

### 1.2 BYJU'S: the full kill chain

| stage | evidence | tag |
|---|---|---|
| **Lead generation** | Leads came from chai stalls, school gates, phone lists and 15-day free-trial installs | [S, RoW 2021](https://restofworld.org/2021/inside-india-edtech-byjus/) |
| **Fear-based close** | Associates told parents "Your son can be nothing in life if he doesn't go with Byju's" and made children look inadequate during home visits. RoW 2025: associates asked "deliberately tricky questions" | [S, RoW 2021](https://restofworld.org/2021/inside-india-edtech-byjus/), [S, RoW 2025](https://restofworld.org/2025/byjus-owner-byju-raveendran-comeback-fraud-case/) |
| **Targets** | Weekly targets of ₹2 lakh; associates worked until midnight | [S, RoW 2021] |
| **Who was sold** | ₹50,000 subscriptions sold to low-income families. A carpenter on ₹20k/month bought a ₹36k course; "a dozen" cancellation visits later he was still being debited ₹4,000 a month | [S, RoW 2021]; [S, Context 2022-12-14](https://www.context.news/money-power-people/loss-after-loss-indian-parents-say-byjus-pushed-them-into-debt) |
| **Financing** | 54 of 110 complainants did not know they had signed a loan; average loan ₹66,000. BYJU'S took the full fee up front while the parent kept paying EMIs, and "the subscription is not canceled even if they are dissatisfied" | [S, RoW 2021]; [S, Wikipedia citing Context/consumer forums](https://en.wikipedia.org/wiki/Byju's) |
| **Refunds** | About 20% of new users requested refunds inside the trial; 30% stopped paying bank instalments; refund and subscription systems "were not linked" | [S, RoW 2025] |
| **Complaint load** | 3,759 ConsumerComplaints.in complaints (2,362 unresolved), against fewer than 350 each for Vedantu, Unacademy, Simplilearn and Lido | [S, Context 2022] |
| **Accounting** | Multi-year contracts were recognised as revenue at contract start. The auditor sought Ind-AS 115 treatment, and revenue moved to recognition over the term from Sept 2022. FY21 accounts were 17 months late; Deloitte resigned in June 2023; FY23–FY25 audited accounts were never filed | [S, Wikipedia citing ET/FT/Bloomberg](https://en.wikipedia.org/wiki/Byju's); [S, Entrackr](https://entrackr.com/news/byjus-forced-to-sell-epic-and-tynker-in-distressed-deal-9350885) |
| **Capital** | At least $2.8B spent on about a dozen acquisitions (Aakash $950M, Epic $500M, WhiteHat $300M, Tynker $200M, Osmo $120M, GeoGebra $100M); $1.2B Term Loan B (Nov 2021); $533M of loan proceeds sent to Camshaft Capital, whose listed address was a Miami IHOP; a US court found contempt | [S, Wikipedia](https://en.wikipedia.org/wiki/Byju's); [S, RoW 2025] |
| **Marketing liabilities** | Indian cricket jersey, FIFA 2022 and celebrity campaigns. The **₹158 cr of unpaid BCCI sponsorship dues** is what triggered the NCLT insolvency admission (July 2024) | [S, Wikipedia citing Mint/BT](https://en.wikipedia.org/wiki/Byju's) |
| **Regulators** | The Department of Consumer Affairs raised "aggressive sales practices and deceptive marketing" at the India Edtech Consortium (24 June 2022). The NCPCR summoned the CEO over hard-selling to parents (Dec 2022) | [S, Wikipedia citing ET/Outlook]; NCPCR [U, not fetched] |
| **Collapse** | 60,000 staff (2022) → about 14,000 (early 2024); a 4,000-person round in Sept 2023; valuation $22B → $225M; Prosus fair-value loss of $493M; Tynker sold for $2.2M, Epic for $95M (May 2025) | [S, RoW 2025]; [S, Inc42 tracker](https://inc42.com/features/indian-startup-layoffs-tracker/); [S, Entrackr Prosus](https://entrackr.com/2024/06/prosus-writes-off-500-mn-investment-in-byjus/); [S, Entrackr Epic/Tynker] |
| **The customer at the end** | Android app delisted in May 2025 over unpaid AWS bills, so paid lessons became inaccessible. The app has not been updated since 2024-06-11. Newest-400 review mean 2.39; Trustpilot 1.3/5 | [S, Wikipedia citing Mint]; [V, `india-incumbents.md`] |

A former CEO (2023–24) described "absolutely no control on cost" and investments made "in optimism and exuberance rather than deep business insights" [S, RoW 2025].

### 1.3 The other Indian cases (only what adds to the table)

- **WhiteHat Jr.**
  - FY21 cost structure: employee benefits ₹932 cr (42.9% of spend), advertising ₹891 cr (41%) [S, [Entrackr](https://entrackr.com/2022/04/whitehat-jr-spends-rs-2175-cr-to-earn-rs-484-cr-in-fy21/)].
  - India was only 46.7% of revenue; the US was 40.8% [S].
  - ASCI flagged its ads, and WhiteHat withdrew five TV ads over misleading claims [S, Wikipedia citing ET].
  - It filed a ₹20 cr defamation suit against a critic, then withdrew it [S, [Entrackr tag](https://entrackr.com/tags/whitehat-jr)]. Suing your critics is how the story went national.
  - Founder exit one year after acquisition; mass layoffs and a rebrand to "Byju's Future School" in 2023 [S, [Entrackr](https://entrackr.com/2023/09/amid-mass-layoffs-byjus-plans-to-rebrand-whitehat-jr/)].
- **Lido Learning.**
  - Raised a $10M round led by Unilazer and was shut within months: staff learnt at a townhall on 2022-02-04 [S, [Entrackr](https://entrackr.com/2022/02/exclusive-ronnie-screwvala-backed-lido-learning-shuts-down-operations/)].
  - Its insolvency petition names ex-employees, **customers**, vendors and lenders as unpaid. Salaries promised "within 90 days" were still unpaid months later [S, [Inc42](https://inc42.com/buzz/ronnie-screwvala-backed-edtech-startup-lido-learning-to-file-for-insolvency/)].
  - A taxi driver's family lost ₹30,000+, and auto-debits continued after the company closed [S, Context 2022].
  - **Lesson:** prepaid tuition plus a lender's EMI outlives the company that sold it.
- **Vedantu.**
  - Peak headcount was about 8,000. Its growth came from radio blitzes, brand ambassadors and digital campaigns [S, [Open](https://openthemagazine.com/business/untold-vamsi-krishna-vedantu-and-the-night-it-nearly-fell-apart)].
  - When schools reopened, collections fell 59%.
  - The founder: "Raising more money can be a curse — it makes you do nonsensical things" [S].
  - A 2026 Play review describes "extreme mis-selling": a Hindi-comfortable child was put in an English-only batch [V, `india-incumbents.md`].
- **Unacademy.**
  - Acquired Rheo TV, PrepLadder, Mastree, Spayee, CodeChef, Swiflearn, Kreatryx, TapChief and others.
  - Spun up Graphy, Relevel, Cohesive and offline centres. Its USMLE product closed **5 months after launch** [S, [Inc42](https://inc42.com/features/unacademy-product-acquisition-blitz-downward-spiral/)].
  - Edtech funding in H1 2022 was $2.1B, down 55% from H2 2021. Test-prep funding fell 99% from Q1 to Q2 2022 [S, Inc42].
  - Learners complained that educators were "removed from the system, leaving the syllabus mid-way" [S, Wikipedia].
  - Unacademy still has **34 "sales calls" complaints in its newest 400 Play reviews (2026)** [V, `india-incumbents.md`].
- **Toppr.** The cautionary middle case. It was not killed by fraud. It simply could not win a marketing war against BYJU'S and Vedantu, even during the pandemic boom (revenue −40% in FY21) [S, [Entrackr](https://entrackr.com/2022/01/toppr-scale-shrinks-40-in-fy21-while-losses-increase-13/)]. It was absorbed and hollowed out (§4.4 of `india-incumbents.md`).
- **Doubtnut.**
  - FY21: about ₹2 cr of revenue for ₹105 cr of spend, about 52× [D from S].
  - FY22: ₹10.8 cr of subscriptions for ₹194.5 cr, 17.96×. Employees were 37% of spend [S, [Entrackr](https://entrackr.com/2023/03/doubtnut-spent-rs-194-cr-to-make-rs-10-cr-revenue-in-fy22/)].
  - Free answers built reach. They never built a willingness to pay.
- **Sector.** Inc42's tracker counts **14,816 people laid off by about 25 edtech startups**, the most of any sector, and all seven edtech unicorns made cuts [S, [Inc42](https://inc42.com/features/indian-startup-layoffs-tracker/); the tracker version is undated, about 2024].

### 1.4 The global cases

- **Chegg** (all [V] unless marked; sources in §9).
  - **Revenue:** 2021 $776.3M → 2022 $766.9M → 2023 $716.3M → 2024 $617.6M → 2025 $376.9M [V, SEC XBRL].
  - **2023:** it acknowledged ChatGPT's impact on new sign-ups, and the stock fell about 38% in a day [S, Wikipedia citing Bloomberg].
  - **Q4 2024:** 3.6M subscribers (−21% YoY). Non-subscriber traffic was **−49% in January 2025**, against −8% in Q2 2024 [V, IR].
  - **2024:** $677M of impairments and an $837M net loss [V, IR].
  - **2025:** it sued Google over AI Overviews (Feb). It cut about 640 roles (56%) in May and October. Revenue fell 39% to $376.9M [V, 10-K/IR].
  - **Its own diagnosis:** Chegg says it "built large language models" and offers "personalized, step-by-step learning support powered by AI" [V, 10-K]. **Adding AI to an answer business did not save it**, because the customer's job ("give me the solution") was now free elsewhere.
  - **Reputation:** a regulator (Australia's TEQSA) won a 2026 case against it as a cheating service [S]. A 2022 shareholder suit said growth was "largely due to the facilitation of cheating" [S].
- **2U.**
  - Revenue rose from $412M (2018) to a $963M peak (2022), then went flat [V, SEC XBRL].
  - It lost money in every year from 2012 to 2023 (about −$1.48B cumulative) [D from V] and carried about $908M of long-term debt [V].
  - It bought edX for $800M in 2021, on the assumption that pandemic demand would last [S, [Higher Ed Dive](https://www.highereddive.com/news/2u-bankruptcy-restructuring-opms-education-department/722580/)].
  - Its causes, in its own filing: students returned to campus, tech layoffs hit bootcamps, AI adoption arrived faster than expected, and lawsuits damaged its reputation (USC rankings; social-work degree "equivalence") [S].
  - Public float fell from $4.1B (2018) to $0.28B (2023) [V].
  - **Lesson:** revenue that holds up does not save a company whose costs and debt never matched it.
- **Khanmigo** (all [V], [Oreopoulos & Low 2026](https://edworkingpapers.com/sites/default/files/ai26-1551.pdf)).
  - Design: a cluster RCT in 18 Tennessee middle schools over 2 years, with daily remedial blocks. The tutor was configured to coach, not answer.
  - Effect: 1.3 national percentile ranks per term, about 0.06–0.08 SD per year (0.14 for a full year of active participation), "similar to Khan Academy practice without AI assistance".
  - Usage: 96% tried it. The median student messaged it on 33% of practice days, in 14% of sessions and in 17% of mistake sessions. The median number of messages, even in a mistake session, was zero.
  - Messages were "mostly bare answers or clicks on suggested prompts".
  - The paper's conclusion: "The binding constraint appears to be engagement."
  - The paper also cites the "5 percent problem" (effects concentrate in a small self-selected minority of heavy users) and says the median US Khan Academy user logs "only a few hours of practice per year".
  - Khan leadership called v1 "a non-event" for most students (Barnum 2026, as cited) [S]. Sal Khan: "did not change student learning as much as many of us hoped"; the fix "prompts a student to explain how they arrived at an answer" [V, [blog](https://blog.khanacademy.org/khanmigos-first-chapter-changed-how-i-think-about-ai-a-note-from-sal-khan/)].
- **AltSchool** [S, [Wikipedia](https://en.wikipedia.org/wiki/Altitude_Learning)].
  - Ran personalised-learning microschools built on student "playlists", with progress streamed to parents.
  - Raised $33M (2014) and $100M (2015), and ran 6 schools by 2016.
  - Stopped operating schools in 2019, pivoted to software as Altitude Learning, and ceased operations in 2025.
  - Why it failed was not verified this session [U]. It is the canonical case of "hyper-personalisation as the thesis" not surviving contact with cost and with parents.
- **Replika** [S, [Wikipedia](https://en.wikipedia.org/wiki/Replika) citing Reuters/Bloomberg].
  - Italy's Garante barred it from processing users' data in February 2023, citing risks to emotionally vulnerable people and minors.
  - Within days Replika removed a core behaviour, which caused user distress (Bloomberg: "Reddit panic"). It partly reversed in May 2023.
  - **Lesson:** a relationship product cannot change the personality people bonded with without a backlash, and the regulator decides when it has to change.
- **Character.AI** removed open-ended chat for under-18s by 25 November 2025 [S via `../learning-science.md`].

---

## 2. The burn table: spend per ₹1 of revenue

| company, year | revenue | spend | **spend per ₹1** | largest cost line | tag |
|---|---|---|---|---|---|
| Doubtnut FY21 | ₹2 cr | ₹105 cr | **≈52** | n/a | [D from S] |
| Doubtnut FY22 | ₹10.8 cr | ₹194.5 cr | **17.96** | employees 37% | [S] |
| Lido FY21 | ₹11.3 cr | ₹70 cr | **≈6.2** | n/a | [D from S] |
| Unacademy FY21 | — | ₹2,030 cr | **5.1** | employees ₹748 cr | [S] |
| WhiteHat Jr FY21 | ₹484 cr | ₹2,175 cr | **4.49** | employees 43%, ads 41% | [S] |
| Toppr FY21 | ₹50.6 cr | — | **3.54** | employees ₹109 cr | [S] |
| BYJU'S FY22 | ₹5,298 cr | — | **≈2.6** (revenue + loss, over revenue; includes impairments) | n/a | [D from S] |
| Vedantu FY25 | ₹227 cr | — | **1.96** | n/a | [S, `india-incumbents.md`] |
| Seekho FY25 | ₹142 cr | ads ₹134 cr | ads alone 0.94 | ads | [S, `india-incumbents.md`] |

**Reading.** Every K-9 company that died spent more than ₹3.5 per ₹1 of revenue during its growth phase. Vedantu survived by shrinking to about ₹2. The two big cost lines were **human teachers and salespeople** (employee benefits) and **ads**. An AI tutor removes most of the first and adds inference COGS. The trap is replacing teacher salaries with ad spend and sales commissions. Taxila's own model (`gtm_funnel_model.py`, `../realtime-cost-model.py`) should be held to the threshold in pattern B4.

---

## 3. The 15 failure patterns

Each pattern has: the evidence, why it kills, **Taxila's rule** (a testable commitment), and an **early-warning signal** with a threshold. B = business, P = product.

### B1. Fear-based, commission-driven selling to parents
- **Evidence.**
  - BYJU'S: ₹2 lakh weekly targets, "your son can be nothing", tricky questions put to children [S, RoW].
  - WhiteHat Jr: the fictional "Wolf Gupta" and ASCI-pulled ads [S].
  - Vedantu: English-batch mis-selling [V].
  - It is still happening in 2026: Unacademy has 34 sales-call complaints in its newest 400 reviews, and Infinity Learn has 41 refund complaints in 156 reviews [V, `india-incumbents.md`].
  - The Department of Consumer Affairs warned the sector in 2022 [S].
- **Why it kills.** It converts a parent's anxiety into revenue that later becomes a refund, a chargeback, a consumer case and a press story. The sales cost sits outside the product, so the product never has to earn the sale.
- **Taxila rule.**
  - No outbound sales team paid per conversion.
  - No "counsellor" home or phone visits.
  - The learner model and diagnostic are **never** used to tell a parent their child is weak in order to sell. Diagnostics go to the parent only alongside a plan and a free next step.
  - Every claim a salesperson could make must already be in writing on the plan page.
- **Early warning.** "Sales call", "mis-sold" or "pressure" themes in reviews or support tickets above 1%. Any compensation plan tied to conversion of K-9 parents.

### B2. Loan-financed, multi-year prepaid bundles with revenue booked up front
- **Evidence.**
  - BYJU'S: 54 of 110 complainants were unaware of the loan, the average loan was ₹66k, and EMIs continued after cancellation [S].
  - Ind-AS 115 forced revenue to be spread over the course term [S].
  - Lido: auto-debits outlived the company [S].
  - Infinity Learn parents report packages of ₹35k–75k [V reviews].
- **Why it kills.** Revenue looks great and cash comes in up front, so the company scales ahead of retention. Once delivery degrades, the parent has nothing to cancel: the lender owns the payment. The booked revenue, the valuation built on it, and the debt raised against that valuation all go together.
- **Taxila rule.**
  - Monthly plans, plus at most an annual plan with a stated pro-rata refund.
  - **No NBFC or EMI partnerships.** No tablet or device bundles.
  - Revenue recognised ratably.
  - A continuity commitment: if Taxila winds down, prepaid balances are refunded first.
- **Early warning.** A share of revenue from plans longer than 12 months above 30%. Any lender integration in checkout.

### B3. Cancellation friction, refund opacity and dark patterns
- **Evidence.**
  - BYJU'S refund and subscription systems "were not linked", and about 20% of new users requested refunds [S, RoW 2025].
  - Refund/fraud is 10% of all low-star K-9 reviews [V, `india-incumbents.md`].
  - Seekho (2026): "they said ₹1, and now ₹799 is being deducted". Seekho Jr (2026): "the ₹1 plan ran out, then the ₹199 one ran out in 5 days" [V reviews, `india-incumbents.md`].
  - India's Guidelines for Prevention and Regulation of Dark Patterns (CCPA, 30 Nov 2023) name subscription traps, drip pricing and false urgency [U, not fetched this session].
- **Why it kills.** In a parent market, one unfair debit gets retold in the WhatsApp group. The free-content alternatives (YouTube, PW, free ChatGPT/Gemini) mean trust is the only switching cost.
- **Taxila rule.**
  - Cancel in two taps, in the app, in Hindi or English.
  - Pro-rata refunds paid within 7 days.
  - No ₹1-trial that renews at full price without a fresh, explicit confirmation from the parent.
  - The price is shown in rupees before any payment screen.
- **Early warning.** Refund-request rate above 5% of new payers. Chargebacks above 0.5%. The "auto-pay" or "refund" theme above 2% of reviews.

### B4. Growth bought at negative unit economics
- **Evidence.** The burn table (§2): ₹3.5–18 per ₹1 for the companies that died. Vedantu: "unit economics was non-existent" [S]. Unacademy's employee costs rose 6.25× in one year [S].
- **Why it kills.** The business depends on the next round. When funding fell 55% (H1 2022) and test-prep funding fell 99% in a quarter [S], every one of these companies had to cut 20–75% of staff.
- **Taxila rule.** Do not scale paid acquisition until three conditions hold, and each cohort must pass them:
  - (a) a cohort's contribution margin after inference COGS is positive by month 3;
  - (b) CAC payback is under 6 months;
  - (c) M3 paid retention is at least 35% (SpeakX's reported figure, [S] in `india-ai-native.md`, as a floor).
- **Early warning.** Spend per ₹1 of revenue above 2.0 after month 12. Ad spend above 50% of revenue.

### B5. Treating a demand shock as a structural shift
- **Evidence.**
  - Vedantu collections −59% when schools reopened [S].
  - BYJU'S went from 60k to 14k staff [S].
  - 2U bought edX for $800M on pandemic demand and then went bankrupt [S].
  - Toppr shrank even inside the boom [S].
  - Edtech made 14,816 layoffs, the most of any sector [S].
- **Why it kills.** Hiring, offline centres and acquisitions get sized to a peak, and fixed costs outlive the demand.
- **Taxila's version of the shock.**
  - (a) The AI-hype moment.
  - (b) Seasonal spikes around board exams and the April school-year start.
  - (c) Free promotions by big tech: ChatGPT Go was free for a year from Nov 2025, and Google AI Plus is free for students [S, `bigtech.md`]. These can inflate trial numbers, or suck demand away.
- **Taxila rule.**
  - Capacity (people and committed cloud spend) is sized to the **trailing 3-month paid base**, not to signups.
  - No offline footprint before product-market fit.
- **Early warning.** Signups growing more than 3× faster than paid users. Headcount growing faster than paid users.

### B6. Acquisition sprees, product sprawl and roll-ups
- **Evidence.**
  - BYJU'S spent at least $2.8B on about 12 acquisitions; Tynker went from $200M to $2.2M and Epic from $500M to $95M [S].
  - Toppr and Meritnation apps have disappeared [V].
  - Unacademy made 10+ acquisitions and shut USMLE within 5 months [S].
  - 2U/edX [S].
  - Asia shows the same drift into live classes, offline centres and 15+ product lines (Ruangguru) [S, `china-asia.md`].
- **Why it kills.** Each vertical needs its own CAC and retention, and management attention is the scarcest resource. Acquired brands rot inside the roll-up.
- **Taxila rule.**
  - One product (classes 1–9 core subjects, a Hindi-English voice teacher) until paid retention is proven.
  - No acquisitions before PMF.
  - Every new surface (exam prep, class 10, a coding course, offline) needs a written kill criterion before launch.
- **Early warning.** More than one paid SKU line before M6 retention is known.

### B7. Misleading outcome claims and celebrity or sponsorship marketing
- **Evidence.**
  - Education was ASCI's top violating sector "for the past few years" until 2022-23 [V, ASCI 2022-23].
  - Traditional education plus edtech was 16.5% of the 7,581 ads needing modification in 2022-23, and 14% in 2023-24 [V, ASCI].
  - WhiteHat's "Wolf Gupta" [S].
  - BYJU'S cricket, FIFA and celebrity spending, where the unpaid BCCI dues triggered insolvency [S].
  - 2U's rankings and "equivalence" lawsuits [S].
- **Why it kills.** Outcome claims are what Indian parents buy. When results don't match the claim, the claim becomes evidence in a consumer case. Sponsorships are fixed liabilities that do not shrink when revenue does.
- **Taxila rule.**
  - Publish only outcome claims measured on Taxila's own cohorts, with n, method and date (the html-portfolio "measurement" discipline).
  - No guaranteed marks or ranks.
  - No celebrity endorsement without ASCI due diligence. ASCI found celebrities failed to provide evidence of due diligence in 97% of cases [V, ASCI 2022-23].
  - Total marketing commitments that cannot be cancelled are capped at 3 months of revenue.
  - Set expectations with real effect sizes: the best large AI-tutor RCT gives 0.06–0.14 SD [V]. "Replace your tutor" is a hypothesis to test, not a slogan.
- **Early warning.** Any ad claim without a linked measurement entry. Any multi-year sponsorship.

### B8. Governance, opaque finances and debt-financed growth
- **Evidence.**
  - BYJU'S: FY21 accounts 17 months late; auditor resignation; no audited FY23–25; a $1.2B Term Loan B; $533M sent to a fund with an IHOP address [S].
  - 2U: about $908M of debt on a business that never made a profit [V].
  - Lido's investor pulled out and staff and customers went unpaid [S].
- **Why it kills.** Debt converts a slow decline into a sudden death, and opacity removes the time to fix things.
- **Taxila rule.**
  - No debt to fund growth.
  - Monthly management accounts.
  - Board-visible cohort data.
  - Customer prepayments held in a clearly separate ledger.
- **Early warning.** Any covenant-bearing loan. Accounts filed late.

### B9. Reach without monetisation (free answers as the growth engine)
- **Evidence.**
  - Doubtnut had about 32M monthly reach and was sold for about $10M after a 17.96× burn [S].
  - Toppr's Scan Quest has not been updated since December 2023 [V].
  - The category is now free and global: Gauth has 122.7M installs, QANDA 81.5M, and Question.AI is listed in Hindi in India [V, `china-asia.md`].
- **Why it kills.** A free answer trains users to expect free answers, and the users it attracts are students with a homework emergency, not parents buying a teacher.
- **Taxila rule.**
  - The free tier is a **trial of the relationship**: a real lesson with the teacher plus the parent report. It is not an unlimited doubt-solver.
  - Price is visible from day one.
  - The vanity metric is reach. The metric that counts is paid parents.
- **Early warning.** Free MAU growing while paid conversion stays below 2% after 90 days.

### P1. A moat made of answers and content, commoditised by general AI (plus single-channel dependency)
- **Evidence.**
  - Chegg: revenue −51%, float −98.9%, non-subscriber traffic −49% YoY, its 10-K blaming ChatGPT and AI Overviews, and its own LLMs did not save it [V].
  - Doubtnut [S].
  - Free study modes from OpenAI and Google: ChatGPT Study mode (Jul 2025), ChatGPT for Teens with Study Mode on by default (Aug 2026), Gemini Guided Learning (Aug 2025) [S, `bigtech.md`].
- **Why it kills.** If the job the customer hires you for can be done by a free general model, your content library is worth zero. If your acquisition depends on one platform (Google search, the Play Store), that platform can turn off your traffic.
- **Taxila rule.** The moat must consist of things a general assistant does not have:
  - (a) the longitudinal learner model (months of misconceptions and what re-taught each one);
  - (b) the exact textbook-chapter and board alignment;
  - (c) the parent loop and reports;
  - (d) the teacher relationship;
  - (e) measured outcomes.
  - Run a **monthly substitution test**: for 20 sampled Taxila sessions, would ChatGPT for Teens or Gemini Guided Learning have done as well? If yes for more than half, the moat is not there.
  - No single acquisition channel above 50% of new payers.
- **Early warning.** Substitution test failing. Organic or search share of acquisition above 50%.

### P2. A passive tutor that waits to be asked
- **Evidence.**
  - Khanmigo: messages in only 17% of mistake sessions; effect equal to Khan Academy without AI; v1 was "a non-event" [V/S].
  - The "5 percent problem" and medians of a few hours a year [V, paper].
  - The `global-ai-tutors.md` finding that voluntary use collapses without structure.
  - AltSchool's playlists [S] are a softer instance: personalisation without a driving teacher.
- **Why it kills.** Children cannot formulate the questions a conversational tutor needs. Mean usage hides a median of zero.
- **Taxila rule.**
  - The teacher leads every turn; no "ask me anything" home screen.
  - Every mistake triggers a tutor move.
  - Sessions are scheduled in the Conductor's day plan.
  - Report **medians**, never means.
- **Early warning.** Tutor dialogue in fewer than 80% of mistake moments (Khanmigo was 17%). Median weekly active minutes per paid child below the dose the pilot showed works.

### P3. The promise–delivery gap after the sale (including reliability)
- **Evidence.**
  - "Very Aggressive At Marketing Before You Enroll But Lord Knows What They Do After Enrollment" (Unacademy, 2026) [V].
  - BYJU'S Premium: "Not picking calls … classes haven't happened for last 2 weeks" [V].
  - Bugs, login and OTP failures are the **#1 complaint at 22% of 1,895 low reviews** [V, `india-incumbents.md`].
  - BYJU'S paid lessons went dark when AWS was unpaid [S].
  - Korea's AI textbook, rushed for quality, was demoted to "supplementary" with 19% adoption [S, `china-asia.md`].
- **Why it kills.** The parent pays for continuity. A single broken week (no class, an OTP that never arrives, a wrong answer from a generated diagram) undoes months of trust.
- **Taxila rule.**
  - Reliability SLOs are product features: login success at least 99.5%, with a non-OTP fallback; first lesson audio within 2 s.
  - Every generated artefact (Forge) has a verified fallback kit, so a generation failure never reaches the child as an error or a wrong fact.
  - A delivery log is visible to the parent ("what your child did today").
  - Model answers are graded against verified keys, never by a model (an inherited law in CLAUDE.md).
- **Early warning.** Any reliability theme above 5% of tickets. Factual-error reports above 1 per 1,000 sessions.

### P4. The teacher the child bonded with changes or disappears
- **Evidence.**
  - Human-teacher platforms lost star teachers or removed educators mid-syllabus (Unacademy) [S]. Star packages of ₹1–10 cr made teacher supply the cost centre [S].
  - Replika: a regulator-forced behaviour change caused user distress and a partial reversal [S].
- **Why it kills.** Taxila's thesis is a teacher who bonds over months. For an AI teacher, the equivalents of a teacher leaving are a model upgrade that changes the voice or personality, a forced safety change, or a pricing change that removes features.
- **Taxila rule.**
  - The persona (voice, name, catchphrase shapes, memory of the child) is versioned and frozen.
  - Model upgrades ship only after persona-regression evals on recorded sessions.
  - Memory survives model changes.
  - Any change a child would notice is announced to the parent first.
  - Never design a dependency the company could not keep supplying.
- **Early warning.** Child or parent reports along the lines of "she sounds different". Retention dips after model deploys.

### P5. Wrong language, medium or curriculum context
- **Evidence.**
  - Vedantu put a Hindi-comfortable child in an English-only batch [V].
  - Khan Academy in India gets "US-centric" complaints [V, `india-incumbents.md`].
  - Korea's AIDT was rushed [S].
  - Hindi-first products have the healthiest review means: PW 4.45, Seekho Jr 4.52 [V].
- **Why it kills.** A child who does not understand the medium cannot show whether they understood the content, so the learner model measures the wrong thing.
- **Taxila rule.**
  - Medium is detected and set per child: Hindi, English or code-switched.
  - Content is matched to the exact board, class and chapter the child's school uses (CBSE, RBSE and others).
  - The pilot cohort includes Hindi-medium government and low-fee private school children, not only metro English-medium ones.
- **Early warning.** Comprehension-check failure rates that differ by medium. Parents asking for "Hindi mein".

### P6. Child safety, privacy and emotional dependency treated as compliance to deprioritise
- **Evidence.**
  - Replika: Italy barred it from processing data over risks to vulnerable people and minors [S].
  - Character.AI: ended open-ended chat for under-18s (Nov 2025) [S].
  - FTC 6(b) orders and California SB 243 [S, `../learning-science.md`].
  - China's ban: TAL fell to 22.7% of revenue [D from V].
  - NCPCR summoned BYJU'S [U].
  - **DPDP s.9(3) bans tracking or behavioural monitoring of children from 13 May 2027, and consent does not lift it** [V via `../safety/dpdp-deep.md`].
- **Why it kills.** Taxila's two signature features, covert understanding detection and a relationship OS that bonds over months, are exactly what regulators of child AI target. In India the regulator can also be the NCPCR or a state commission responding to one viral story.
- **Taxila rule.**
  - Treat the DPDP design (School Mode under the educational-institution exemption, Narrow Mode for D2C, per `gtm-distribution.md`) as a **launch blocker for 13 May 2027**, not a later compliance task.
  - Keep the child-safety floor in CLAUDE.md.
  - Write a dependency policy: session caps set by the parent; no guilt-tripping or "I'll miss you" register; the teacher actively points the child to humans.
  - Publish a plain-language "what we measure about your child and why" page.
- **Early warning.** Any feature that needs behavioural data and has no lawful-basis note. Any parent asking "is it recording my child?" without an immediate, clear answer.

---

## 4. One-line index of the 15 patterns

| # | pattern | archetype | single strongest number | tag |
|---|---|---|---|---|
| B1 | fear-based commission selling | BYJU'S, WhiteHat | ₹2 lakh weekly target; "your son can be nothing" | [S] |
| B2 | loan-financed multi-year bundles, revenue up front | BYJU'S, Lido | 54 of 110 complainants unaware of the loan | [S] |
| B3 | cancellation and refund friction, dark patterns | BYJU'S, Seekho | ~20% of new users asked for refunds | [S] |
| B4 | negative unit economics | Doubtnut, WhiteHat, Unacademy | ₹17.96 spent per ₹1 of revenue | [S] |
| B5 | demand shock read as a trend | Vedantu, 2U | collections −59% when schools reopened | [S] |
| B6 | acquisitions and sprawl | BYJU'S, Unacademy | Tynker $200M → $2.2M | [S] |
| B7 | misleading claims, celebrity/sponsor liabilities | WhiteHat, BYJU'S | education was ASCI's top violator; 16.5% of modified ads (2022-23) | [V] |
| B8 | opacity and debt | BYJU'S, 2U | 2U: no profitable year 2012–2023, ~$908M debt | [V] |
| B9 | reach without monetisation | Doubtnut | 32M monthly reach → sold for ~$10M | [S] |
| P1 | answer/content moat commoditised; single channel | Chegg | revenue −51%, float −98.9% | [V] |
| P2 | passive tutor | Khanmigo | 17% of mistake sessions with any message | [V] |
| P3 | promise–delivery gap, reliability | BYJU'S Premium, Unacademy | bugs/login/OTP = 22% of low reviews | [V] |
| P4 | teacher or persona discontinuity | Unacademy educators, Replika | forced behaviour change → user distress | [S] |
| P5 | wrong language, medium or curriculum | Vedantu, Korea AIDT | AIDT 19% adoption, demoted | [S] |
| P6 | child safety and privacy deprioritised | Replika, Character.AI, China | DPDP s.9(3) live 13 May 2027 | [V] |

---

## 5. Thesis stress test: where Taxila's own plan meets these patterns

| owner thesis element | pattern it walks into | how it fails | the rule that defuses it |
|---|---|---|---|
| "replace all Indian tutors/teachers" (goal) | B7, P6, AltSchool | an external "replace your teacher" claim invites ASCI and consumer cases if marks don't move; teacher unions, schools and NCPCR become opponents; AltSchool shows "replace the school with personalisation" failing on cost and trust [S] | keep "replace" as an internal north star; externally promise "your child's own teacher at home, measured"; publish measured outcomes only (B7 rule) |
| "understand the student deeply, covertly detect understanding" | B1, P6 | (a) the same diagnostic BYJU'S weaponised ("tricky questions") to frighten parents [S]; (b) DPDP s.9(3) "behavioural monitoring" for D2C [V via dpdp-deep] | diagnostics never feed sales; learner model scoped per School/Narrow Mode; "covert" means non-test-like formative checks, never hidden from the parent |
| "hyper-personalised multimodal content on the fly" | P3, B4 | a generated game or diagram that is wrong or broken in front of a child is worse than a static video; per-child generation COGS can recreate the burn table | verified-kit fallback for every generated artefact; cache and reuse generated artefacts across children with the same misconception; COGS per child-hour is a release gate |
| "exactly human-like Hindi-English voice teacher that bonds over months" | P4, P6 | model or persona drift breaks the bond; companion-style dependency is now the highest-regulated child-AI surface (Character.AI, SB 243) [S] | persona freeze + regression evals; dependency policy; never deny being an AI (already in CLAUDE.md) |
| "result-focused" | B7, P2 | realistic AI-tutor effects are 0.06–0.14 SD [V]; if parents are promised more, the gap becomes refunds | expectation-setting in onboarding; report medians and per-chapter mastery, not a promised mark jump |
| "launch everywhere at once (CBSE, RBSE, other boards, classes 1–9, all subjects)" | B6, P3 | breadth before reliability; kit verification debt | sequence by board × class × subject; each cell launches only when its verified kits exist |
| "compliance is deprioritised" (CLAUDE.md) | P6, B3 | regulators were a proximate cause in BYJU'S, WhiteHat, China, Replika | treat DPDP 13 May 2027 and CCPA dark-pattern rules as product requirements |

---

## 6. What the survivors have in common (the positive control)

| survivor | what it did differently | evidence | tag |
|---|---|---|---|
| **PW (PhysicsWallah)** | low price (online ARPU ₹4,104/yr); free YouTube teaching as the funnel, not the product; teacher-founder trust; IPO Nov 2025 (₹3,480 cr, listed +33%) | `india-ai-native.md`; [Wikipedia](https://en.wikipedia.org/wiki/Physics_Wallah) | [S] |
| **PW CuriousJr** | two-teacher model (expert + mentor) with parent updates; newest-review mean 4.72 | `india-incumbents.md` | [V] |
| **LEAD Group** | B2B through affordable private schools, about ₹943 per student per year; 100% NRR; EBITDA-positive | `india-incumbents.md` | [S] |
| **Vedantu** | survived by cutting to about ₹2 of spend per ₹1 | [Open](https://openthemagazine.com/business/untold-vamsi-krishna-vedantu-and-the-night-it-nearly-fell-apart); `india-incumbents.md` | [S] |
| **Khan Academy** | admitted v1 failed, ran about 20 A/Bs, and redesigned so the tutor leads | [Sal Khan blog](https://blog.khanacademy.org/khanmigos-first-chapter-changed-how-i-think-about-ai-a-note-from-sal-khan/); `global-ai-tutors.md` | [V] |

The common traits are prices a family can sustain without a loan, a trust channel that does not depend on a salesperson, costs near revenue, and a willingness to measure and admit failure. None of the survivors grew through financed bundles.

---

## 7. Early-warning dashboard (proposed; thresholds are judgement, not measured) [D]

| signal | threshold that triggers a stop-and-review | pattern |
|---|---|---|
| spend per ₹1 of revenue (trailing quarter, after month 12) | > 2.0 | B4 |
| CAC payback | > 6 months | B4 |
| M3 paid retention | < 35% | B4, P2 |
| refund requests / new payers | > 5% | B3 |
| chargebacks | > 0.5% | B3 |
| "sales call / mis-sold / auto-pay" themes in reviews and tickets | > 1–2% | B1, B3 |
| revenue from plans longer than 12 months | > 30% | B2 |
| tutor dialogue in mistake moments | < 80% | P2 |
| median (not mean) weekly minutes per paid child | below the pilot's effective dose | P2 |
| login success | < 99.5% | P3 |
| factual-error reports | > 1 per 1,000 sessions | P3 |
| substitution test vs free ChatGPT/Gemini study modes | Taxila not better in > 50% of sampled sessions | P1 |
| any single acquisition channel | > 50% of new payers | P1 |
| signups growing faster than paid users | > 3× | B5, B9 |
| retention change after a model or persona deploy | any significant drop | P4 |
| days to 13 May 2027 with DPDP mode incomplete | < 120 | P6 |

---

## 8. Gaps and unverified items [U]

- **NCPCR summons of BYJU'S (Dec 2022).** Recalled, not fetched (ndtv and ET blocked).
- **CCPA Dark Patterns Guidelines (30 Nov 2023) and the MoE coaching-centre guidelines (Jan 2024).** Those guidelines are recalled to include a minimum enrolment age of 16, a ban on rank or mark guarantees, and pro-rata refunds. The education.gov.in PDF returned 403. Read both before finalising B3/B7 rules.
- **BYJU'S FY21–22 advertising spend.** Not found in fetched sources; the FY22 breakdown "couldn't be ascertained" [S, Entrackr].
- **Chegg peak subscriber count.** Not extracted. Revenue, float, headcount and Q4 2024 subscribers are [V].
- **AltSchool's reasons for failing.** Not fetched (Fast Company 403). Only the timeline is [S].
- **The Inc42 layoff tracker.** The version read is undated (about 2024), so the edtech total of 14,816 is a floor.
- **The RoW 2025 figures** (20% refund requests, 30% stopped instalments) are from internal accounts reported by journalists, not audited [S].
- **No Indian parent interviews.** All parent voice comes from Play reviews (n=41 parent-authored, low confidence) and press. A 10-parent interview round in the Hindi belt about "what made you stop paying for BYJU'S/Vedantu/a tutor" would test B1–B3 directly.
- **The early-warning thresholds in §7 are proposals.** They should be logged as decisions with reversal conditions once pilot data exist.

---

## 9. Sources

**Primary (verified this session) [V]**
- Chegg SEC XBRL company facts: https://data.sec.gov/api/xbrl/companyfacts/CIK0001364954.json (pulled by `failures_sec_pull.py` → `failures-sec-2026-10-02.json`)
- Chegg 10-K FY2025: https://www.sec.gov/Archives/edgar/data/1364954/000136495426000021/chgg-20251231.htm ; 10-K FY2022: https://www.sec.gov/Archives/edgar/data/1364954/000136495423000013/chgg-20221231.htm
- Chegg Q4/FY2024 results: https://investor.chegg.com/Press-Releases/press-release-details/2025/Chegg-Reports-2024-Fourth-Quarter-and-Full-Year-Financial-Results/default.aspx
- Chegg Q4/FY2025 results: https://investor.chegg.com/Press-Releases/press-release-details/2026/Chegg-Reports-2025-Fourth-Quarter-and-Full-Year-Financial-Results/default.aspx
- Chegg standalone decision and 388 roles (Oct 2025): https://investor.chegg.com/Press-Releases/press-release-details/2025/Chegg-to-Remain-a-Standalone-Public-Company-to-Maximize-Shareholder-Value/default.aspx
- 2U SEC XBRL company facts: https://data.sec.gov/api/xbrl/companyfacts/CIK0001459417.json
- Oreopoulos & Low (2026), *One Click Away: AI Tutoring with Khanmigo in a Two-Year School Experiment*, EdWorkingPaper 26-1551: https://edworkingpapers.com/sites/default/files/ai26-1551.pdf
- Sal Khan, "Khanmigo's first chapter…" (2026): https://blog.khanacademy.org/khanmigos-first-chapter-changed-how-i-think-about-ai-a-note-from-sal-khan/
- ASCI Complaints Report 2022-23: https://www.ascionline.in/wp-content/uploads/2023/05/Complaints-Report-2022-23.pdf ; 2023-24: https://www.ascionline.in/wp-content/uploads/2024/05/Annual-Complaints-Report-2023-24.pdf ; 2025-26: https://www.ascionline.in/wp-content/uploads/2026/05/annual-complaints-report-25-26-final.pdf

**Secondary [S]**
- BYJU'S: Wikipedia (wikitext, with citations to ET, FT, Bloomberg, Mint, Reuters, TechCrunch): https://en.wikipedia.org/wiki/Byju's ; Byju Raveendran: https://en.wikipedia.org/wiki/Byju_Raveendran
- Rest of World (2021), "Inside India's edtech…": https://restofworld.org/2021/inside-india-edtech-byjus/
- Rest of World (2025), Byju Raveendran comeback / fraud case: https://restofworld.org/2025/byjus-owner-byju-raveendran-comeback-fraud-case/
- Context / Thomson Reuters Foundation (2022-12-14), "Loss after loss: Indian parents say Byju's pushed them into debt": https://www.context.news/money-power-people/loss-after-loss-indian-parents-say-byjus-pushed-them-into-debt
- Entrackr: BYJU'S FY22 https://entrackr.com/2023/11/byjus-reports-2-3x-revenue-growth-in-fy22-reduces-ebitda-loss/ ; Prosus write-off https://entrackr.com/2024/06/prosus-writes-off-500-mn-investment-in-byjus/ ; Epic/Tynker sale https://entrackr.com/news/byjus-forced-to-sell-epic-and-tynker-in-distressed-deal-9350885 ; tag pages https://entrackr.com/tags/byjus , https://entrackr.com/tags/whitehat-jr , https://entrackr.com/tags/doubtnut , https://entrackr.com/tags/toppr , https://entrackr.com/tags/lido-learning
- Entrackr, WhiteHat Jr FY21: https://entrackr.com/2022/04/whitehat-jr-spends-rs-2175-cr-to-earn-rs-484-cr-in-fy21/ ; WhiteHat rebrand and layoffs: https://entrackr.com/2023/09/amid-mass-layoffs-byjus-plans-to-rebrand-whitehat-jr/
- Entrackr, Lido shutdown: https://entrackr.com/2022/02/exclusive-ronnie-screwvala-backed-lido-learning-shuts-down-operations/ ; Inc42, Lido insolvency: https://inc42.com/buzz/ronnie-screwvala-backed-edtech-startup-lido-learning-to-file-for-insolvency/ ; Inc42 company page: https://inc42.com/company/lido-learning/
- Entrackr, Doubtnut FY22: https://entrackr.com/2023/03/doubtnut-spent-rs-194-cr-to-make-rs-10-cr-revenue-in-fy22/
- Entrackr, Toppr FY21: https://entrackr.com/2022/01/toppr-scale-shrinks-40-in-fy21-while-losses-increase-13/
- Inc42, Unacademy downward spiral: https://inc42.com/features/unacademy-product-acquisition-blitz-downward-spiral/ ; Inc42 layoffs tracker: https://inc42.com/features/indian-startup-layoffs-tracker/
- Open Magazine, Vedantu: https://openthemagazine.com/business/untold-vamsi-krishna-vedantu-and-the-night-it-nearly-fell-apart
- Wikipedia (wikitext): Unacademy https://en.wikipedia.org/wiki/Unacademy ; Vedantu https://en.wikipedia.org/wiki/Vedantu ; Chegg https://en.wikipedia.org/wiki/Chegg ; 2U https://en.wikipedia.org/wiki/2U_(company) ; Altitude Learning (AltSchool) https://en.wikipedia.org/wiki/Altitude_Learning ; Replika https://en.wikipedia.org/wiki/Replika ; Physics Wallah https://en.wikipedia.org/wiki/Physics_Wallah
- Higher Ed Dive, 2U bankruptcy: https://www.highereddive.com/news/2u-bankruptcy-restructuring-opms-education-department/722580/ ; USC split: https://www.highereddive.com/news/2u-usc-part-ways-online-degrees/699413/
- TechCrunch, Chegg sues Google (2025-02-24): https://techcrunch.com/2025/02/24/chegg-sues-google-over-ai-search-summaries/

**Internal cross-references (each with its own sources):** `india-incumbents.md` (Play Store complaint themes, BYJU'S/Toppr/Doubtnut status, Unacademy sale), `india-ai-native.md` (PW, SpeakX retention), `global-ai-tutors.md` (Khanmigo redesign, voluntary-use collapse), `../learning-science.md` (SB 243, FTC 6(b), Character.AI), `china-asia.md` (China ban, Korea AIDT, answer-engine installs), `bigtech.md` (free study modes), `gtm-distribution.md` and `../safety/dpdp-deep.md` (DPDP s.9(3), School/Narrow Mode).
