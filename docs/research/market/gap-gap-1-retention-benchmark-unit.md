# Gap 1: the retention benchmark and the churn that depends on it

*Research date: 2026-10-02. Scope: what SpeakX's "~30%" actually measures, which India/IN-SEA subscription
benchmarks exist at primary source, and what monthly churn, paid months, LTV, CAC ceiling and base SOM follow under each
defensible reading.*

- **Model:** `retention_benchmark_model.py` → `retention-benchmark-model-2026-10-02.json`. It imports
  `gtm_funnel_model.py` unchanged (price, GST, fees, COGS, annual logic, channel CACs) and swaps only the retention
  inputs. The original `gtm_funnel_model.py` was also re-run and still reproduces ₹1,267 / ₹422.
- **Tags:**
  - [V]: read at the primary source this session.
  - [S]: secondary source, or a company claim relayed by press.
  - [U]: unverified.
  - [D]: derived here.
  - [A]: assumption.
- **Survival notation** (RevenueCat 2026 definitions [V]):
  - S0 = 1 is the first paid month.
  - S_k is the share of first payments that went on to make k renewals.
  - **S3 ("M3, 3 renewals")** is RevenueCat's 3-month retention.
  - **S2 ("paying in month 3")** is the looser reading a founder might mean.

---

## 0. Verdict

1. **The two SpeakX figures are different metrics from different dates, and neither one is defined.**
   - Outlook Business, 16 Oct 2025: *"35% retention at month three"*. It does not say "paid".
   - Inc42, 1 Sep 2026: *"Its paid user retention stands at around 30% on a monthly basis."*
   - The thesis merged them into "~30% M3 paid retention". Read literally, the Inc42 wording means 70% monthly churn,
     which SpeakX's own numbers rule out (§1.3).
   - Also, SpeakX sells **monthly, quarterly and yearly** plans [V, T&C]. Quarterly payers cannot lapse before day 90,
     so a blended "month-three" figure is inflated by plan mix.
   - **SpeakX is therefore not a floor. It is an unaudited, mix-inflated, adult self-payer number.**
2. **The thesis carries three churn figures that do not agree:**
   - 15% flat (§3.3 SOM). This implies M3 = 61%.
   - 30% for 3 months, then 12% (GTM LTV). This gives 5.05 paid months.
   - ~33% (the task's "30% at M3", i.e. 1 − 0.3^(1/3) = 33.1%; the brief wrote this as "0.7^(1/3)").
3. **The primary-source benchmark is RevenueCat 2026, and it points lower** [V]:
   - IN/SEA monthly first renewal: **46%**.
   - Global monthly renewals: 53–61% / 65–77% / 73–82%.
   - Monthly Y1 median: **8%**.
   - These give **S3 ≈ 23% (IN/SEA) to 32% (global)** and **3.4–4.2 paid months** on a monthly plan.
   - The stock-equivalent churn is **24–30%, not 15%**.
4. **Re-derived unit economics.** Blended contribution LTV falls from ₹1,267 to **₹949–1,031**. This uses an annual
   renewal of 30%, the global first-annual median, instead of the model's 45%. IN/SEA's own first-annual figure is
   22% [V]. The LTV/CAC = 3 ceiling falls from **₹422 to ₹316–344**.
5. **The ≥35% M3 gate survives, re-specified.**
   - Definition: monthly-plan cohorts, subscription level, S3, trials excluded.
   - It sits above the global median (32%) and about 1.5× the IN/SEA median (23%), so it is a top-third bar, not a
     floor.
   - At the base click-to-WhatsApp (CTWA) CAC of ₹333, it is **sufficient**: S3 ≥ 28.5% is enough for LTV/CAC 3.
   - At the base school (₹818) and paid-social (₹1,000) CACs, **no M3 is enough** under the median tail.
6. **The 400k base SOM does not survive as written.**
   - "60k/month at 15%" needs S3 ≈ 55% under the RevenueCat tail. That is effectively impossible.
   - With a top-quartile tail (93% late renewal, which matches RevenueCat 2025's pooled 17% monthly Y1), it needs
     S3 ≈ 33%.
   - Realistic monthly-only inflow is **95–118k new payers a month**.
   - With a 35% annual mix, inflow is **~46–49k a month**, but about 70% of the payer stock is then on discounted
     annual plans. Gross revenue falls from **₹218 cr to ~₹170–175 cr** [D].
   - **Restated: 400k average payers is reachable only through an annual-heavy mix. Base year-3 gross is ~₹172 cr,
     not ₹218 cr.**

---

## 1. What SpeakX actually said

### 1.1 The exact wording

| source | date | exact wording (primary page) | metric as stated | tag |
|---|---|---|---|---|
| [Inc42](https://inc42.com/buzz/exclusive-ms-dhoni-joins-edtech-startup-speakxs-cap-table/) (Palak Sharma) | 01 Sep 2026 | "Its paid user retention stands at around 30% on a monthly basis, Mittal said." Also: "around 2 Lakh active paid subscribers"; "freemium model"; "priced at ₹299 per month"; FY26 "₹45 Cr", FY27 "₹70-80 Cr"; "EBITDA profitable in FY26" | Undefined. "On a monthly basis" may mean month-on-month (MoM) renewal, a monthly-cohort figure, or a monthly snapshot. No month index and no cohort basis are given. | wording [V]; the number is a founder claim [S] |
| [Outlook Business](https://www.outlookbusiness.com/corporate/speakxai-raises-16-mn-from-westbridge-capital-eyes-regional-language-expansion-amid-profitable-growth) | 16 Oct 2025 | "a customer-acquisition-cost payback of one day, a 3.7x LTV/CAC within six months, and 35% retention at month three." Also: "more than 1 million monthly learners"; "roughly 200,000 active paying subscribers"; "annual recurring revenue of about $7.5 million"; "70% of its current users are Hindi-speaking"; "EBITDA-positive since April 2025" | "Month three" is stated. "Paid" is **not** stated, nor are the cohort basis or plan mix. | wording [V]; the number is a company claim [S] |
| [Elevation Capital](https://www.elevationcapital.com/perspectives/speakx-building-india-largest-ai-language-learning-app) | 22 Oct 2025 | "over 2 lakh paid subscribers and clocks $7M ARR with just 20 people". No retention figure. | — | [S] (investor) |
| [SpeakX T&C](https://speakx.ai/terms-conditions) | live 2026-10-02 | "you agree to a monthly, quarterly, or yearly fee that will be automatically charged to your linked UPI account" | Plan mix includes quarterly and yearly plans. | [V] |
| [CXO DigitalPulse](https://www.cxodigitalpulse.com/speakx-surpasses-10000-paid-subscribers-monthly-achieves-500000-arr-in-under-8-months/) | 26 Sep 2024 | "surpassing 10,000 paid subscribers monthly"; "$500,000 ARR"; "currently focused on improving retention and engagement to achieve product-market fit" | — | [S] |

### 1.2 How earlier Taxila docs used the figures

- `india-ai-native.md` row 6 is **partly wrong**. It says "35% at month 3 not confirmed", but it *is* in Outlook
  Business, worded "35% retention at month three". That figure is 11 months older than the Inc42 one, and it is not
  stated to be paid.
- What is true is that **"30% at month 3" is confirmed nowhere.**
- `gtm-distribution.md`:136 and :478 ("~30–35% month-3") merge the two figures.
- `MARKET-THESIS.md` §2 row 19, §3.3, §4.3 and `failures.md`:226 ("as a floor") all repeat the merged figure.

### 1.3 Which readings survive SpeakX's own numbers

- **(E) Literal "30% of paid users renew each month" (70% churn).** Rejected [D].
  - Paid months per payer would be 1.43.
  - A stock of about 200k would need about 140k new payers a month. That is 14% of the 1M monthly learners converting
    afresh every month.
  - For comparison, RevenueCat IN/SEA day-35 download-to-paid is 0.7% median and 1.9% top quartile [V].
  - It is also incompatible with "3.7x LTV/CAC within six months" at ₹299, unless CAC is below about ₹60.
- **(F) "30%" was churn, so MoM renewal is 70%.** Possible [U]. It gives 3.33 paid months, about the same as the
  IN/SEA median curve.
- **(C) 35% as S3 (Oct 2025)** and **(D) 30% as S3 (Sep 2026)** are both possible [S]. If both are true, retention
  has declined as SpeakX scaled. That is consistent with RevenueCat's finding that IN/SEA first renewals trail and
  only "converge by the 3rd renewal" [V].
- **Revenue cross-check [D]:**
  - $7.5M ARR ÷ 200k subscribers is about $37.5 per subscriber per year, roughly ₹262/month at ₹84/$.
  - That is close to ₹299 net of GST (₹253).
  - So the stock is priced near monthly list. This fits either a mostly-monthly base or ARR computed as MRR × 12.
  - It cannot tell (C) from (D) from (F).
- **"Payback of one day" [U, inference].** This almost certainly reflects quarterly or yearly upfront plans plus
  celebrity organic traffic. It is not a monthly-plan property.

---

## 2. Primary-source benchmarks (2024–2026)

### 2.1 RevenueCat, State of Subscription Apps 2026

- Source: [revenuecat.com/state-of-subscription-apps](https://www.revenuecat.com/state-of-subscription-apps/) [V].
- Coverage: 115k+ apps and $16B+ revenue; 2025 data, with 2024 cohorts for Y1.
- The retention metric is subscription-level: "12 monthly renewals for 12-month retention".

| metric | value | relevance |
|---|---|---|
| monthly 1st / 2nd / 3rd renewal, by-category medians | **53–61% / 65–77% / 73–82%** | the shape of the early-churn curve |
| **monthly 1st renewal by geography** | NA 55%, W. Europe 55%, **IN/SEA 46%** | the only India-specific renewal number at primary source |
| yearly 1st renewal by geography | NA 26%, WE 28%, **IN/SEA 22%** | replaces the model's 45% annual renewal |
| 1st annual renewal, by category | median 23–40% | — |
| convergence | "IN/SEA trails by 10 to 15 percent on 1st renewals but every geography generally converges by the 3rd renewal"; 3rd renewals cluster at 77–81% | the late tail is not India-specific |
| monthly 6-month retention | median 14–26%, top quartile 30–50% | — |
| **monthly Y1 retention** | **median 8%** (2024 cohort; 10% for 2023); freemium 8% vs hard paywall 9%; by category 6–14% | anchors a late renewal of ≈ 0.86 [D] |
| active renewal rate, monthly | 39.2% overall; "below 35% signals weak retention" | — |
| IN/SEA trial-to-paid | **15.2%** median (NA 34.2%) | — |
| IN/SEA D35 download-to-paid | **0.7%** median, 1.9% top quartile (global 2.0%); a different chart gives 1.37–1.4% | inconsistent within the report; use 0.7–1.4% |
| IN/SEA Y1 realised LTV per payer | **$14** (global $23, NA $32) | — |
| Education | 59–66% of plans annual (with Travel and Shopping); Education month-1 share of annual cancellations ~30% | — |
| churn reasons (Google Play survey) | "Cost related" 25–45%; "Not enough usage" 26–40% | — |

### 2.2 RevenueCat, State of Subscription Apps 2025

- Source: [revenuecat.com/state-of-subscription-apps-2025](https://www.revenuecat.com/state-of-subscription-apps-2025/)
  [V].
- Y1 retention: yearly **44.1%**, monthly **17.0%**, weekly **3.4%**.
  - This is the figure `gtm-distribution.md`:374 uses.
  - It is roughly double the 2026 report's monthly median of 8%, almost certainly because of a different
    aggregation (pooled vs per-app median).
  - Treat 17% as the top-quartile tail and 8% as the median tail.
- First annual renewal **61.7%** (vs 64.9%).
- "Nearly 30% of annual subscriptions are canceled in the first month".
- "High-priced monthly plans? Just 6.7% stick around."

### 2.3 Indian analogues (none publishes a renewal curve)

| company | disclosed | why it does not substitute | tag |
|---|---|---|---|
| **Kuku FM / Kuku TV** | "over 90% of the startup's subscribers remain active month over month"; 10M+ paid; ₹199/mo, ₹499/qtr, ₹1,499/yr; "the quarterly plan is the most popular" | "Active" is usage among current subscribers, not renewal. A quarterly-heavy mix hides monthly churn. It shows the same definitional slippage as SpeakX. | [S] [TechCrunch 15 Oct 2025](https://techcrunch.com/2025/10/15/indias-kuku-snags-85m-as-mobile-content-wars-intensify/) |
| **Seekho** | FY25 revenue ₹141.5 cr; advertising ₹134.2 cr (75% of expenses); ~4M current paid subscribers | ₹141.5 cr ÷ 4M is about ₹354 per subscriber per year [D, mixing a point-in-time count with a flow]. That implies short tenure or a low price. Ad spend ≈ revenue. | [S] [Entrackr via Dailyhunt](https://m.dailyhunt.in/news/india/english/entrackr+english-epaper-entrackr/seekho+spends+rs+134+cr+on+advertising+for+rs+142+cr+revenue+in+fy25-newsid-n704222899); [Inc42](https://inc42.com/startups/how-seekho-escaped-a-near-death-blow-to-build-an-inr-600-cr-edutainment-powerhouse/) |
| **PhysicsWallah** | 4.46M paid users FY25, 4.13M of them online; no retention rate disclosed | It sells batch or course purchases, not auto-renewing subscriptions, so there is no renewal curve. | [S] [Kotak UDRHP](https://investmentbank.kotak.com/downloads/physicswallah-UDRHP.pdf) (PDF not parsed this session) |
| **Duolingo** | Q2-26: 12.7M paid, 58.7M DAU, CURR 84% | No India split is disclosed in the letter. CURR measures DAU, not paid retention. | [V] [SEC 8-K Q2-26](https://www.sec.gov/Archives/edgar/data/0001562088/000162828026053299/q2fy26duolingo6-30x26share.htm) |
| Sensor Tower / AppsFlyer via aggregators | education D30 *install* retention 2–8.4% | Install retention, not paid. Aggregator pages, not primary. Not used. | [U] [Business of Apps](https://www.businessofapps.com/data/education-app-benchmarks/) |

**Gap that remains.** No India-specific consumer *education* paid-renewal curve exists at primary source. Sensor
Tower and data.ai India education reports are paywalled and were not reached [U]. The best available proxy is
RevenueCat IN/SEA (all categories) for the first renewal plus the global tail.

---

## 3. Re-derivation

Fixed inputs, unchanged from `gtm_funnel_model.py`:
- ₹299 monthly or ₹2,499 annual;
- 18% GST, 2% web UPI fee, 40% COGS;
- 35% of payers on the annual plan.

Annual renewal is set to **0.30** in the headline column. That is the middle of RevenueCat's global first-annual
median (23–40%). IN/SEA's own figure is 22%.

| reading | S2 | **S3 (M3)** | Y1 | avg churn M1–M3 | late churn | **paid months (monthly plan)** | stock-equivalent flat churn | monthly-plan LTV | **blended LTV** (annual 0.30) | blended LTV (annual 0.45 / 0.22) | **CAC ceiling (3×)** | 400k SOM inflow/month, monthly only / blended |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A. IN/SEA median (RC26) [V→D] | 30% | **23%** | 5.9% | 39% | 14% | **3.39** | 29.5% | ₹505 | **₹949** | ₹1,106 / ₹887 | **₹316** | 118k / 49k |
| B. global median (RC26) [V→D] | 41% | **32%** | 8.1% | 32% | 14% | **4.23** | 23.6% | ₹630 | **₹1,031** | ₹1,187 / ₹968 | **₹344** | 95k / 46k |
| C. SpeakX 35% as S3 (Oct-25) [S] | 44% | 35% | 11% | 29% | 12% | 4.94 | 20.2% | ₹736 | ₹1,100 | ₹1,256 / ₹1,037 | ₹367 | 81k / 43k |
| D. SpeakX 30% as S3 (Sep-26) [S] | 38% | 30% | 7.7% | 33% | 14% | 4.05 | 24.7% | ₹603 | ₹1,013 | ₹1,170 / ₹951 | ₹338 | 99k / 46k |
| E. literal 30% MoM (rejected) [D] | 9% | 2.7% | 0% | 70% | 70% | 1.43 | 70% | ₹213 | ₹760 | ₹916 / ₹697 | ₹253 | 280k / 58k |
| F. 30% = churn [U] | 49% | 34% | 1.4% | 30% | 30% | 3.33 | 30% | ₹496 | ₹944 | ₹1,100 / ₹881 | ₹315 | 120k / 49k |
| G. current GTM base [A] | 49% | 34% | 11% | 30% | 12% | 5.05 | 19.8% | ₹752 | ₹1,110 | **₹1,267** / ₹1,048 | ₹370 (₹422 at 0.45) | 79k / 43k |
| H. SOM's 15% flat [D/A] | 72% | **61%** | 14% | 15% | 15% | 6.67 | 15% | ₹994 | ₹1,267 | ₹1,424 / ₹1,204 | ₹422 | **60k** / 39k |

**Reading the table [D]:**

- **The SOM's 15% (row H) is the outlier.**
  - It needs S3 = 61%, about twice the global median.
  - Under the RevenueCat curve shape (later renewals 71% / 78% / 86%), even a 100% first renewal only reaches S3 = 55%
    for 6.67 paid months.
  - Only a top-quartile tail of **93% late renewal** gets there, at S3 ≈ 33%. A 93% tail is what RevenueCat 2025's
    pooled 17% monthly Y1 implies.
- **The GTM base (row G) is internally coherent.** Its S3 is 34%, close to SpeakX's 35%.
  - However, its 12% late churn is better than RevenueCat's median of about 14%.
  - Its 45% annual renewal is twice IN/SEA's 22% [V].
  - Under the median tail, reproducing ₹1,267 needs **S3 ≈ 40%**, the same as the §5.3 "scale" gate.
- **Paid months per payer.** The defensible base is **3.4–4.2** (IN/SEA to global). The SpeakX readings sit at
  4.0–4.9.
- **What the annual mix does.** At 35% annual, about 65–73% of the payer *stock* is on annual plans. The ₹2,499 annual
  price is 0.70× twelve monthly payments, so stock ARPU falls about 21%. The ₹544 × 10 SOM ARPU then overstates
  revenue by about 21%.
- **Revenue consequence.** The base 400k at ₹218 cr becomes **~₹170–175 cr gross** at the same headcount. The alternative
  is monthly-only inflow of 95–118k new payers a month, about 1.1–1.4M a year. That is 5.7–7× SpeakX's current paid
  stock acquired *every year*.

### 3.1 Required M3 by target

Curve family: r2 = 0.71, r3 = 0.78, late = 0.86 (RevenueCat 2026 medians); r1 is solved.

| target | S3 needed (late 0.86) | S3 needed (late 0.90) | S3 needed (late 0.93) |
|---|---|---|---|
| 6.67 paid months (the SOM's 15%) | 55% (r1 = 1.0, infeasible) | 43% | 33% |
| 5.05 paid months (GTM base) | 40% | 31% | 24% |
| 4.0 paid months | 29% | 23% | 18% |

### 3.2 Gate test: M3 needed for blended LTV/CAC ≥ 3 at each channel's base CAC

Annual renewal 0.30, annual mix 0.35, median tail.

| channel | base CAC | LTV needed | S3 needed |
|---|---|---|---|
| parent referral | ₹220 | ₹660 | ~3% (always passes) |
| CTWA diagnostic | ₹333 | ₹1,000 | **28.5%** |
| school-seeded, parent pays | ₹818 | ₹2,455 | **unreachable** (needs about 6.7 blended paid months) |
| paid social → app | ₹1,000 | ₹3,000 | **unreachable** |

---

## 4. Do the gates and the SOM survive?

**≥35% M3 gate (§4.3, `failures.md`:226).** It survives, with three changes.

1. **Definition.** "M3" means **S3: the share of first monthly payments that make 3 consecutive renewals**,
   measured at subscription level, by monthly-plan cohort. It excludes quarterly and annual plans, free trials and
   school-paid seats. Without this definition the gate can be passed by plan mix alone.
2. **Benchmark wording.** Replace "SpeakX's reported figure … as a floor" with: "top third of global apps
   (RevenueCat 2026 median ≈ 32%); ~1.5× the IN/SEA median (≈ 23%); SpeakX claims 35% at month three
   (Oct 2025, undefined) and ~30% 'on a monthly basis' (Sep 2026)".
3. **Kill line.** Set it at **S3 < 23%** (the IN/SEA median), replacing `gtm-distribution.md`'s < 25%. That line
   passes CTWA and referral economics only. It cannot carry school or paid social at their base CACs.

**≥40% M3 "scale" gate (§5.3, `gtm-distribution.md`:478).** Keep it. It is now *derived*: 40% is the S3 that
reproduces the GTM base LTV of ₹1,267 under the median tail.

**400k base SOM (§3.3).** It does not survive as written.
- Restate the inflow as either:
  - **~95–118k gross new payers a month, monthly-only** (stock-equivalent churn 24–30%, not 15%); or
  - **~46–49k a month with a 35% annual mix**, with year-3 gross revenue lowered to **~₹170–175 cr** (from ₹218 cr).
- Either way, 400k now needs either top-quartile retention, or an annual-heavy mix that India's 22% first-annual
  renewal [V] makes fragile in year 2.
- Keep 400k as the "if M3 ≥ 35% and annual mix ≥ 35%" case. A retention-honest base is about **250–300k average
  payers** [A]: 60k a month gross inflow at 4.2 paid months is about 250k monthly-only.

**GTM LTV and CAC ceiling (`gtm-distribution.md`:60–61, :411).**
- Base blended LTV: **₹1,031** (global-median curve, annual renewal 0.30), not ₹1,267.
- IN/SEA case: ₹949.
- LTV/CAC = 3 ceiling: **₹316–344**, not ₹422.
- The model's `ANNUAL_RENEW` base of 0.45 should become 0.30 (pessimistic 0.22 [V], optimistic 0.40).

---

## 5. What would change this

- The first two Taxila monthly cohorts' S1–S3, with n, logged to `context/measurements.md`. They replace every row
  above.
- SpeakX disclosing its cohort basis and plan mix: an RoC filing, or a founder interview that defines the metric.
- The RevenueCat 2027 report breaking out IN/SEA × Education, or a Sensor Tower or data.ai India education
  paid-retention cut [U, paywalled].
- A ₹2,499 annual first renewal ≥ 40% in Taxila's own data. That would restore the ₹1,267 base.
