# Taxila market size: K-9 supplemental learning in India (bottom-up TAM / SAM / SOM)

**Date:** 2026-10-02 · **Scope:** classes 1-9, India, with the Hindi belt and CBSE/RBSE as the launch wedge
**Model:** `market_size_model.py` (same folder; every number below that is not quoted from a source comes out of it)
**Raw measurement:** `urbanpro_fees_2026-10-02.json` + `urbanpro_fees_scrape.py` (tutor fee asks, 28 cities)

**Tags.** **[V]** read at the primary source in this session. **[V†]** read at the primary source today by a
sibling report (`india-incumbents.md`, `india-ai-native.md`); not re-fetched here. **[S]** secondary source.
**[U]** unverified. **[D]** derived by me from tagged inputs (method shown). **[A]** assumption (stated, with range).
**[M]** measured by me in this session (n and method given).

**Method note.** The session's WebSearch budget was already spent (200/200) when this report started. Everything
here comes from directly fetching primary documents: the UDISE+ 2025-26 and 2024-25 booklets (pulled from the
UDISE+ dashboard bundle), the PIB release and its chart images for NSS CMS:E 2025, the NSS 75th-round Key
Indicators PDF, the ASER 2024 India report and Annexure 3, the BaSE 2025 report, the HCES 2022-23 factsheet, the
CBSE 2026 Class XII press release, and the UrbanPro fee pages. Where a number could not be reached, it is marked as
such and not filled in from memory.

---

## 0. Bottom line (read this if nothing else)

1. **There are 18.5 crore children in classes 1-9** (UDISE+ 2025-26: classes 1-5 10.19 cr, 6-8 6.32 cr, class 9
   about 1.99 cr) **[V; class 9 D]**. **The Hindi belt holds 50.5% of them (9.35 cr)**, and UP alone has 3.35 cr **[D from V]**.
2. **The cohort is shrinking.** Enrolment in classes 1-5 fell **2.4% in one year** (10.44 cr in 2024-25 to 10.19 cr in
   2025-26) **[V]**. The demographic tailwind is gone. Growth has to come from share and ARPU, not headcount.
3. **About 26.8% of K-9 children pay for tuition, about 4.96 crore children** **[D]**. CMS 2025 incidence is
   22.9% in primary, 29.6% in middle and 37.8% in secondary **[V]**.
4. **What Indian households already spend on K-9 coaching is ₹35,554 cr a year (about $4.0B)** **[D]**: UDISE+
   enrolment × CMS 2025 spend per enrolled student. This is TAM-1, the wallet that "replacing the tutor" competes for.
   The full school-age coaching wallet (pre-primary to class 12) is about ₹60-62k cr ($6.8-7.1B) **[D]**.
5. **Mass tuition is cheap.** The average rural primary child who takes tuition spends about **₹401/month**. An
   urban middle-school child spends about **₹894/month**. A class-9 urban child spends about **₹1,365/month**
   **[D = CMS spend ÷ CMS incidence]**. At about 20 hours a month **[A]**, that is **₹20-70 per hour**. Listed 1:1
   tutor asks are **₹300-400 per hour** in every city tier **[M, n=798 listings]**. **So Taxila's real competitor
   is group or neighbourhood tuition at about ₹20-45/h, not a ₹400/h 1:1 tutor.** The "30-40× cheaper than a human
   tutor" framing in `india-incumbents.md` holds only against the premium 1:1 segment.
6. **Hindi-belt tuition is extremely uneven.** In rural areas, CMS-calibrated: Bihar about 59%, Jharkhand 41%, UP
   18%, MP 13%, **Rajasthan 6%, Chhattisgarh 6%** **[D from ASER 2024 V]**. **Bihar alone has about 9.9M K-9
   tuition takers, about 43% of all such children in the Hindi belt.** Rajasthan (RBSE) is close to a tuition
   desert, but 51% of its K-9 children are in private unaided schools **[V]**. The two halves of the planned launch
   (CBSE/NCERT and RBSE) are therefore different businesses: one replaces a habit people already pay for, the
   other has to create a new one.
7. **Device access is close to universal at the household level and shared at the child level.** 90% of
   low-resource households own a smartphone. **67% of children in classes 1-5 and 74% in classes 6-8 can access
   one; only 4-5% have their own** (BaSE 2025, n=12,500) **[V]**. **Only 6% of children who use EdTech use a
   dedicated EdTech app; 94% use YouTube** **[V]**. Distribution, not devices, is the bottleneck.
8. **SAM-1 (core): 1.9 crore heads.** These are Hindi-belt K-9 children who already pay for tuition and can access
   a phone, plus CBSE tuition-takers outside the belt (2.2 cr on an ASER basis) **[D]**. They spend about
   ₹11.5-14.5k cr a year on coaching now **[D]**. Priced at ₹299-499 for 10 months, the SAM is **₹5,700-9,500 cr
   ($0.65-1.1B)**. **SAM-2 (expansion), which adds private-school children who do not take tuition, is 4.7
   crore heads and ₹14-24k cr** **[D]**. SAM-2 overstates willingness to pay at the bottom: 59% of low-income
   private-school families pay a school fee of ₹500 a month or less (BaSE) **[V]**.
9. **SOM (average paying students in year 3): base case 400k, giving ₹144-240 cr ARR ($16-27M).** That is about 2%
   of SAM-1. The conservative case is 150k (₹54-90 cr); the aggressive case is 1.2M (₹431-719 cr). The anchors are
   SpeakX (about 2 lakh paid at ₹299, ₹45 cr in FY26) **[S]** and PW's online K-12 enrolments of 0.78M after years
   of a YouTube funnel **[S]**.
10. **At mass prices, unit economics, not market size, is the binding constraint.** Azure realtime voice costs about
   **₹85-140 per hour** on the mini tier with windowing or text-in **[D, `../realtime-cost-model.py`]**. That is
   2-7× the ₹20-45/h a mass-market family pays for tuition today. **₹299/mo buys about 1-2 hours of live voice at
   a 50-60% gross margin.** "Exactly human voice, hour for hour" fits ₹999+/mo urban buyers. Below that, voice
   time has to be rationed and mixed with cheaper modes.

---

## 1. Student counts (UDISE+)

### 1.1 National, by level and management (UDISE+ 2025-26, reference date 31 Mar 2026)

UDISE+ 2025-26 is the newest release. The task asked for 2024-25; both are shown. Source: Table 1 and Tables 5.1-5.5 of each booklet **[V]**.

| level | 2024-25 | 2025-26 | Δ | Govt 25-26 | Aided 25-26 | Pvt unaided 25-26 | Other 25-26 |
|---|---|---|---|---|---|---|---|
| Pre-primary (in schools only) | 14,047,080 | 14,912,909 | +6.2% | 3.54M | 0.34M | 10.64M | 0.39M |
| **Primary (1-5)** | 104,381,347 | **101,915,874** | **−2.4%** | 53.72M | 4.77M | 40.68M | 2.74M |
| **Upper primary (6-8)** | 63,695,100 | **63,241,424** | −0.7% | 33.35M | 6.42M | 22.32M | 1.15M |
| Secondary (9-10) | 37,165,436 | 38,290,413 | +3.0% | 16.99M | 7.18M | 13.73M | 0.38M |
| Higher secondary (11-12) | 27,643,717 | 28,859,146 | +4.4% | 11.30M | 5.91M | 11.48M | 0.17M |
| **Total** | 246,932,680 | **247,219,766** | +0.1% | 118.9M | 24.6M | 98.9M | 4.8M |

- **Class 9 alone is not published in the booklet**, which reports levels only. I take class 9 as **52% of the
  9-10 figure, about 19.9M** **[A, range 50-54%]**. Class 9 is a little larger than class 10 because of
  repetition and dropout in class 9 (secondary dropout is 9.5% [V, Table 1]). Moving the share across 50-54%
  shifts the K-9 total by only ±0.8M.
- **K-9 total ≈ 185.1M** (184.3-185.8M) **[D]**. **37.9% are in private unaided recognised schools (70.1M)**,
  51.8% in government schools, and 8.1% in aided schools **[D from V]**.
- UDISE+ counts **recognised** schools only. Unrecognised low-fee private schools (material in Bihar, UP and
  Jharkhand) are missing or show up under "Others". So private shares in Bihar (14%) and Jharkhand (15%) are
  probably too low **[U]**.
- The fall in primary enrolment (−2.4% in a year) combined with rising secondary enrolment is the **demographic
  wave passing through**: smaller birth cohorts at the bottom, better retention at the top **[D]**. UDISE+ also
  attributes part of the fall to de-duplication through the student registry and Aadhaar seeding (90.2% seeded) **[V]**.
  For planning: **assume K-9 headcount declines 1-2% a year through 2030** **[A]**.

### 1.2 The Hindi belt (UDISE+ 2025-26, K-9 = 1-5 + 6-8 + 52% of 9-10)

| state | K-9 (M) | private unaided share | ASER 2024 rural smartphone at home, ages 14-16 [V] |
|---|---|---|---|
| Uttar Pradesh | **33.47** | 49% | 86.8% |
| Bihar | **16.74** | 14% (likely undercounted) | 82.5% |
| Rajasthan (RBSE) | **11.79** | 51% | 91.7% |
| Madhya Pradesh | **11.27** | 43% | 87.0% |
| Jharkhand | 5.79 | 15% | 85.1% |
| Chhattisgarh | 4.29 | 31% | 93.8% |
| Haryana | 4.18 | 61% | 92.4% |
| Delhi | 3.20 | 45% | n/a (urban) |
| Uttarakhand | 1.68 | 60% | 93.0% |
| Himachal Pradesh | 0.91 | 46% | 96.7% |
| Chandigarh | 0.16 | 38% | n/a |
| **Hindi belt** | **93.5 (50.5% of India)** | **40% (37.4M)** | |

Sources: UDISE+ 2025-26 Tables 5.1 and 5.4 **[V]**; ASER 2024 India rural, Table 16 **[V]**.

Language context: Hindi is the first language of 43.6% of Indians (52.8 cr) and is spoken by 57.1% when second
and third languages are included. English is spoken by 10.6% in total, almost entirely as a second or third
language (Census 2011) **[S, Wikipedia summary of the Census tables]**. **A Hindi-English product covers the
majority of India by language. English alone covers about a tenth.**

### 1.3 Boards (CBSE, RBSE, others)

- **UDISE+ does not publish enrolment by board.** No primary class-wise board split could be reached **[gap]**.
- **Proxy:** CBSE's 2026 Class XII exam had **18,57,517 registered students from 19,967 schools** (CBSE press
  release, 13 May 2026) **[V]**. UDISE+ 2025-26 has 28.86M in classes 11-12, so roughly 14M per class. **CBSE
  therefore holds about 13% of a class-12 cohort** **[D]**. In the model I use **12% of K-9 outside the Hindi belt** for
  CBSE **[A, range 8-16%]**. Inside the belt, CBSE is already counted in the state totals.
- **RBSE ≈ Rajasthan minus its CBSE schools.** Rajasthan's K-9 is 11.8M. If about 10-15% of those children are in
  CBSE schools **[A]**, the RBSE K-9 base is about **10-10.6M** **[D]**.
- Many Hindi-belt state boards use NCERT or NCERT-derived textbooks in at least some classes **[U, not verified this
  session; see `content/` research]**. For the SAM, I treat Hindi-belt state boards as reachable from one
  NCERT-aligned content graph with board-specific chapter maps. That is a product assumption, not a fact.

### 1.4 Urban/rural split

CMS 2025: government schools hold 66.0% of rural students, 30.1% of urban students and 55.9% overall **[V]**.
Solving for the rural share gives **about 72% of school students rural and 28% urban**, which is about 133M rural
and 52M urban K-9 children **[D]**.

---

## 2. Private tuition: who pays and how much

### 2.1 NSS CMS:E 2025 (80th round), the anchor

The survey covered **52,085 households and 57,742 students**, fieldwork April-June 2025, using CAPI **[V, PIB]**.
The incidence and spend figures below are read from the release's chart images **[V]**.

| level | % taking coaching: rural / urban / all | spend per **enrolled** student, ₹/yr: R / U / all | **per taker**, ₹/yr (₹/mo): R / U / all **[D]** |
|---|---|---|---|
| Pre-primary | 10.7 / 13.6 / 11.6 | 420 / 783 / 525 | |
| **Primary** | **21.6 / 26.6 / 22.9** | 1,039 / 2,108 / 1,313 | **4,810 (401) / 7,925 (660) / 5,734 (478)** |
| **Middle** | **29.1 / 31.0 / 29.6** | 1,745 / 3,326 / 2,189 | **5,997 (500) / 10,729 (894) / 7,395 (616)** |
| **Secondary** | **36.7 / 40.2 / 37.8** | 3,159 / 6,585 / 4,183 | **8,608 (717) / 16,381 (1,365) / 11,066 (922)** |
| Higher secondary | 33.1 / 44.6 / 37.0 | 4,548 / 9,950 / 6,384 | |
| All | 25.5 / 30.7 / 27.0 | 1,793 / 3,988 / 2,409 | |

- **The "per student" figure is averaged over all enrolled students, including those who pay nothing.** Two things
  confirm this. The chart title reads "per student currently enrolled". And CMS's gender table reports separately a
  "per reported student" (takers only) spend of **₹8,601 for girls and ₹9,285 for boys**, against ₹2,227 and ₹2,572
  per student **[S, Careers360]**. My derived all-level per-taker figure, 2,409 ÷ 0.27 = ₹8,922, falls inside that
  range, which validates the method **[D]**.
- **Other spend context [V]:** household spend per student across all school costs is ₹2,863 in government
  schools, **₹28,693 in private unaided schools** (urban ₹35,758), and ₹12,616 overall. Course fees are ₹15,143
  urban and ₹3,979 rural. School spending is about **5× coaching spending**. That is the wallet behind the
  "eventually replace teachers" ambition, and it is much harder to capture.
- **Caveats.** (a) The fieldwork in April-June falls at the start of the academic year for April-start boards, so
  "taking or had taken this academic year" may undercount tuition that starts later in the year **[U]**. This is
  my explanation for CMS running below ASER (see 2.3). (b) The PIB release warns that CMS totals should not be
  extrapolated to absolute counts. **I apply CMS rates to UDISE+ headcounts, not to CMS's own totals**, which is
  the standard way to handle this. Even so, every TAM rupee here inherits CMS sampling error, and state-level cells
  have high relative standard error (RSE) **[V, PIB caveat]**.

### 2.2 Trend: NSS 75th round (2017-18)

- In 2017-18, private coaching was **11.8% of basic-course spend** per general-course student (rural 11.2%, urban
  12.3%), on an average spend of ₹8,331 per student. That implies about ₹980 per student on coaching **[V, KI
  Statements 20-21; D]**. Incidence was **19.8%** **[S, cited in `design/parent-experience.md` and
  `conductor/day-cycle.md`]**.
- CMS 2025 puts it at ₹2,409 per student and 27.0% incidence. MoSPI warns that the two rounds are **not strictly
  comparable**: the 75th round counted anganwadis differently and bundled coaching into course spend **[V, PIB
  caveat]**. Directionally, though, **incidence rose by about 7 points and spend per student roughly 2.5× in
  nominal terms in seven years** **[D, low confidence]**. Tuition is a growing habit, not a fading one.

### 2.3 ASER 2024 (rural), state by state

The figures are % of children in paid tuition, from Annexure 3 **[V]**. All-India rural: classes I-V 30.4% (govt) /
28.5% (private); classes VI-VIII 32.9% / 24.5%. Rates have risen since 2018 (24.8 / 26.6 / 29.7 / 23.8).

| state (rural) | I-V govt | I-V pvt | VI-VIII govt | VI-VIII pvt | read |
|---|---|---|---|---|---|
| **Bihar** | 66.3 | 67.9 | 75.1 | 66.6 | tuition is the norm |
| **Jharkhand** | 44.8 | 48.2 | 52.1 | 46.1 | high |
| **Uttar Pradesh** | 17.5 | 26.8 | 15.9 | 24.8 | mid; up from 8.4% (govt I-V) in 2018 |
| Haryana | 16.1 | 26.8 | 13.4 | 24.2 | mid |
| Uttarakhand | 12.2 | 33.6 | 11.1 | 32.3 | private-school-led |
| **Madhya Pradesh** | 13.0 | 14.9 | 15.3 | 15.5 | low |
| Himachal Pradesh | 11.3 | 16.5 | 12.0 | 20.3 | low |
| **Rajasthan** | **3.8** | **9.1** | **4.7** | **8.3** | **almost no paid-tuition habit** |
| Chhattisgarh | 4.9 | 12.6 | 3.7 | 11.4 | almost none |
| *comparators:* West Bengal | 73.8 | 70.9 | 79.9 | 75.9 | highest in India |
| Odisha | 54.7 | 78.5 | 59.5 | 75.3 | high |
| Tripura | 67.0 | 81.0 | 75.0 | 78.8 | high |

**Reconciling ASER and CMS.** ASER all-India rural, blended for classes I-V, is about 29.8%, while CMS rural
primary is 21.6%. For classes VI-VIII the figures are about 30.4% and 29.1%. ASER was fielded from September to
December and asks about "paid tuition". CMS was fielded from April to June. **I report the Hindi belt two ways:
using raw ASER rates (the upper bound), and with ASER rates scaled to CMS (×0.72 for primary, ×0.96 for middle,
the lower bound)** **[D]**.

### 2.4 Hindi-belt tuition takers (model §4)

| state | K-9 (M) | takers, ASER basis | takers, CMS-calibrated |
|---|---|---|---|
| Bihar | 16.74 | 11.84M (71%) | **9.88M (59%)** |
| Uttar Pradesh | 33.47 | 7.26M (22%) | **5.98M (18%)** |
| Jharkhand | 5.79 | 2.83M (49%) | 2.37M (41%) |
| Madhya Pradesh | 11.27 | 1.69M (15%) | 1.41M (13%) |
| Delhi | 3.20 | 0.95M (30%) | 0.95M (30%) (CMS urban rate) |
| Haryana | 4.18 | 0.92M (22%) | 0.76M (18%) |
| Rajasthan | 11.79 | 0.79M (7%) | **0.66M (6%)** |
| Uttarakhand | 1.68 | 0.43M (25%) | 0.35M (21%) |
| Chhattisgarh | 4.29 | 0.30M (7%) | 0.24M (6%) |
| HP + Chandigarh | 1.07 | 0.19M | 0.17M |
| **Hindi belt** | **93.5** | **27.2M (29.1%)** | **22.8M (24.4%)** |

- The state rate is ASER rural, weighted by the UDISE+ private-unaided share. Class 9 takes the class 6-8 rate ×
  1.28 (the CMS ratio of secondary to middle), capped at +10 points **[D/A]**.
- **Rural rates are applied to urban children as well**, which understates UP and MP cities. Their tuition rates
  are probably 5-10 points higher, following CMS's urban-rural gap **[A]**.
- **Hindi-belt coaching wallet ≈ ₹13,200 cr at rural per-taker prices, or ₹16,200 cr at all-India prices** **[D]**.
  Bihar's prices are probably below the national rural average: Bihar's rural MPCE is ₹3,384 against India's
  ₹3,773 **[V, HCES 2022-23]**.

### 2.5 BaSE 2025 (low-resource households in 10 states)

- **38% of children attend paid private tuition** (42% of private-school children, 35% of government-school
  children) **[V]**. The sample of 12,500 households covers 10 states, including UP, MP and Uttarakhand, and is
  skewed to "low-resourced settings". That incidence is higher than CMS's, which is consistent with the timing
  explanation in 2.3.
- **37% of respondents believe technology can fully replace tuition, and 51% see it as a helpful support** **[V]**.
  That is a demand signal for "replace the tutor" that parents state themselves. It is stated preference, not
  payment.

---

## 3. Smartphone access for children

| measure | value | source |
|---|---|---|
| ages 14-16 (rural): smartphone at home | **89.1%** (88.8% at 14, 90.0% at 16) | ASER 2024 Table 10 **[V]** |
| ages 14-16: can use one | 82.2% (boys 85.5%, girls 79.4%) | ASER 2024 **[V]** |
| ages 14-16: own their own phone (of those who can use one) | **27.0% at 14, 37.8% at 16**; boys 36.2%, girls 26.9% | ASER 2024 **[V]** |
| ages 14-16: used a phone for education in the past week | 57.0% (social media 76.0%) | ASER 2024 **[V]** |
| low-resource households owning ≥1 smartphone | **90%** (57% own ≥2; mean 1.74) | BaSE 2025 **[V]** |
| **children with smartphone access, by grade** | **classes 1-5: 67%; 6-8: 74%; 9-12: 81%**; urban 78%, rural 69% | BaSE 2025 **[V]** |
| shared vs own access | 68% shared, 4% own; the phone belongs to the mother in 48% of cases, the father in 36% | BaSE 2025 **[V]** |
| children using any EdTech | 63% (urban 71%, rural 58%) | BaSE 2025 **[V]** |
| **EdTech users on a dedicated EdTech app** | **6%** (YouTube 94%, WhatsApp 67%, Google 49%) | BaSE 2025 **[V]** |
| EdTech users who use GenAI for learning | 35%; aware of AI: 36% (classes 1-5), 49% (6-8) | BaSE 2025 **[V]** |
| Hindi-belt states below the national average for "phone at home" | Bihar 82.5%, Jharkhand 85.1%, UP 86.8%, MP 87.0% | ASER 2024 Table 16 **[V]** |

The model uses BaSE's grade-band access rates (67% / 74% / 81%) as the "can use the product" filter.
**Implication:** the buyer is the mother's phone, and sessions start when she hands it over (see
`design/parent-experience.md`). Smartphone access rises with school fees: 64% where the fee is under ₹500, 74% at
₹500-1,000, and 87% above ₹1,000 **[V, BaSE]**.

---

## 4. Prices people already pay

### 4.1 Home tutor fee asks by city tier (UrbanPro listings, measured 2026-10-02) **[M]**

Method: I fetched UrbanPro's city listing pages for Class 6 and Class 9 tuition across 28 cities and parsed every
"₹X per hour" profile on the first page. **n = 798 listings.** These are **asking prices from tutors who list
themselves on a marketplace** (mostly educated, many teaching online), not transaction prices. Bangalore,
Hyderabad and Pune returned too few listings to count.

| tier (cities with data) | class 6: n, median ₹/h (IQR) | class 9: n, median ₹/h (IQR) |
|---|---|---|
| T1 (Delhi, Mumbai, Chennai, Kolkata; class 9 also Bangalore, Pune) | 80 · **₹375** (298-500) | 89 · **₹400** (300-500) |
| T2 (Jaipur, Lucknow, Patna, Indore, Bhopal, Kanpur, Nagpur, Ahmedabad, Chandigarh) | 116 · **₹298** (182-400) | 181 · **₹350** (250-450) |
| T3 (Varanasi, Ranchi, Gwalior, Prayagraj, Meerut, Jodhpur, Kota, Dehradun, Agra, Gorakhpur, Bikaner, Udaipur) | 154 · **₹300** (200-399) | 178 · **₹300** (200-400) |

- UrbanPro's own national estimate is "**₹300 to ₹400 per hour**" for classes I-V, 6 and 9. Monthly asks on its
  fee pages run **₹1,500-6,000/month** **[V]**.
- **Tier makes surprisingly little difference to the asks** (₹300 in T3 vs ₹375-400 in T1). Marketplace tutors
  price against a national online rate.
- **The gap that matters:** a listed 1:1 rate of ₹300-400/h is about ₹6,000-8,000/month at 20 hours. The average
  tuition-taker actually spends **₹401-1,365/month** (CMS, §2.1). **So most paid tuition is group or neighbourhood
  tuition at about ₹20-70 per hour** **[D, with the 20 h/month assumption, A]**:

| CMS segment | ₹/month per taker | effective ₹/h at 20 h/mo |
|---|---|---|
| primary, rural | 401 | **20** |
| primary, urban | 660 | 33 |
| middle, rural | 500 | 25 |
| middle, urban | 894 | 45 |
| secondary, rural | 717 | 36 |
| secondary, urban | 1,365 | 68 |

### 4.2 EdTech and AI price ladder (₹ per month to the family)

| offer | ₹/mo | notes | tag |
|---|---|---|---|
| ChatGPT Go (free for a year in India), Google AI Plus for students (free year) | 0 | general assistants, 13+ / 18+ | [S]/[V†] |
| DIKSHA, Khan Academy, YouTube | 0 | the default "EdTech" for 94% of child users | [V] BaSE |
| Spotify Premium Standard / Student | 139 / 69 | the mass digital-subscription anchor | [V] spotify.com/in-en |
| Seekho / Seekho Jr | 99-999 IAP; "₹1 trial then auto-pay" | ₹134 cr ads for ₹142 cr revenue in FY25 | [V†]/[S] |
| **SpeakX** (AI voice English) | **299** | about 2 lakh paid; ₹45 cr FY26; about 30% monthly paid retention | [S] |
| **PW online ARPU** | **≈342** (₹4,104/yr) | "average ARPU of our online course is less than INR4,000" (PW call) | [V†]/[S] |
| Khanmigo learner | ≈384 ($4) | India not listed | [V†] |
| Extramarks | 616 | "starting at" | [V†] |
| **PW CuriousJr Power Batch, class 6** | **≈2,155-2,500** (₹30,000/yr) | live, 400-500 per batch, Hindi+English | [V†] |
| Vedantu 1:1 | ₹800-888 **per hour** | | [V†] |
| Cuemath 1:1 (KG-5, 12-month plan) | **≈6,240** (₹74,880/yr incl. GST) | premium urban | [V†] |
| B2B: LEAD Group | ≈79 (₹943/student/yr, school pays) | EBITDA-positive, 100% NRR | [S, derived in `india-incumbents.md`] |
| B2B: Embibe to schools | ≈42 (₹500/student/yr) | | [S] |

### 4.3 Affordability against household consumption (HCES 2022-23, MPCE fractiles) **[V]**, with my assumptions

The household is assumed to have 5 members and MPCE is uplifted 10% to 2025-26 prices **[A]**.

| household (MPCE fractile) | household ₹/mo | ₹299 as % | ₹499 as % | ₹999 as % |
|---|---|---|---|---|
| rural 20-30% | 13,497 | 2.2% | 3.7% | 7.4% |
| **rural 40-50% (median)** | 17,017 | **1.8%** | 2.9% | 5.9% |
| rural 80-90% | 29,458 | 1.0% | 1.7% | 3.4% |
| urban 20-30% | 20,691 | 1.4% | 2.4% | 4.8% |
| **urban 40-50% (median)** | 27,297 | **1.1%** | 1.8% | 3.7% |
| urban 80-90% | 52,701 | 0.6% | 0.9% | 1.9% |

For comparison, a rural primary tuition-taker already spends ₹401/month, which is 2.4% of the rural median
household **[D]**. **₹299 is inside what tuition-paying families already spend. ₹999 is a premium urban price.**

There is a second, harder anchor: among low-income private-school families, **monthly school fees are below ₹200
for 23%, ₹200-500 for 36%, ₹501-1,000 for 27%, ₹1,001-2,000 for 12%, and above ₹2,000 for 2%** (BaSE) **[V]**. For
59% of these families, a ₹299 app would cost 60-150% of the school fee.

---

## 5. TAM / SAM / SOM

### 5.1 Assumptions (all live in `market_size_model.py`)

| # | assumption | value (range) | basis |
|---|---|---|---|
| A1 | class 9 share of classes 9-10 | 0.52 (0.50-0.54) | repetition and dropout; ±0.8M on K-9 |
| A2 | Hindi belt | UP, Bihar, MP, Rajasthan, Jharkhand, Chhattisgarh, Haryana, Delhi, Uttarakhand, HP, Chandigarh | launch language and geography |
| A3 | state tuition rate | ASER 2024 rural, weighted by private share; CMS-calibrated version is the base | §2.3 |
| A4 | per-taker spend | CMS national; rural prices for the Hindi-belt low case | §2.1 |
| A5 | child phone access | BaSE 67% / 74% / 81% by grade band | §3 |
| A6 | CBSE share of K-9 outside the Hindi belt | 12% (8-16%) | CBSE XII 2026 ≈ 13% of a cohort |
| A7 | CBSE homes: tuition rate / phone access | 30% / 85% | CMS urban incidence; BaSE ≥₹1,000 fee band = 87% |
| A8 | billed months per paying year | 10 (8-12) | exam-season churn, summer break |
| A9 | price points | ₹299 and ₹499 / month | SpeakX / PW anchors (§4.2) |
| A10 | FX | ₹88 = $1 | a planning rate, not a forecast |
| A11 | SAM-2 union | tuition-taker OR private-school, assumed independent | upper-biased: the two overlap positively |

### 5.2 Results

| layer | definition | heads | value / yr | $ |
|---|---|---|---|---|
| **TAM-0** | all K-9 enrolled (UDISE+ 2025-26) | **185.1M** | — | — |
| **TAM-1** | current household spend on K-9 coaching, all India | **49.6M takers (26.8%)** | **₹35,554 cr** | **$4.04B** |
| *context* | same, pre-primary to class 12 | | ₹59.6-62.4k cr | $6.8-7.1B |
| *context* | Hindi-belt K-9 coaching wallet | 22.8M (CMS-cal) to 27.2M (ASER) takers | ₹13.2-16.2k cr | $1.5-1.8B |
| **SAM-1 (core)** | Hindi-belt K-9 **tuition-takers with phone access** (16.3M; 19.3M ASER basis) + non-Hindi-belt CBSE tuition-takers with phone access (2.8M) | **19.1M** (22.1M) | they spend ₹11.5-14.5k cr now; at Taxila prices: ₹5,716 cr at ₹299×10, **₹9,539 cr at ₹499×10** | $0.65-1.08B |
| **SAM-2 (expansion)** | SAM-1 + private-school children who do not take tuition, with phone access (28.0M) | **47.2M** | ₹14,101 cr at ₹299×10; ₹23,532 cr at ₹499×10 | $1.6-2.7B |
| *B2B2C lens* | all private-unaided K-9 × ₹500-943/student/yr (LEAD/Embibe pricing) | 70.1M (Hindi belt 37.4M) | ₹3,507-6,615 cr (Hindi belt ₹1,868-3,523 cr) | $0.4-0.75B |

**SOM: average paying students in year 3 (ARR = payers × price × 12)**

| scenario | payers | ₹299/mo | ₹499/mo | % of SAM-1 | % of SAM-2 | the benchmark it implies |
|---|---|---|---|---|---|---|
| conservative | 150k | ₹54 cr ($6.1M) | ₹90 cr ($10.2M) | 0.8% | 0.3% | under SpeakX (about 2 lakh paid at ₹299) |
| **base** | **400k** | **₹144 cr ($16.3M)** | **₹240 cr ($27.2M)** | 2.1% | 0.85% | about half of PW's K-12 online enrolments (0.78M) |
| aggressive | 1.2M | ₹431 cr ($48.9M) | ₹719 cr ($81.7M) | 6.3% | 2.5% | about 22% of PW's paid users (5.34M, all ages) |

### 5.3 Why the SOM is set where it is, not higher

- **Paid conversion in Indian consumer EdTech is low and expensive.** Seekho spent ₹134 cr on ads to earn ₹142 cr
  (FY25), and Doubtnut spent ₹194 cr to earn ₹10 cr (FY22) **[S, via `india-incumbents.md`]**. Only 6% of child
  EdTech users touch a dedicated app at all **[V]**.
- **Retention math.** At SpeakX's roughly 30% month-3 paid retention **[S]**, holding 400k average payers at a
  steady-state monthly churn of about 15% needs about 60k new payers a month **[D/A]**. At a blended CAC of
  ₹1,000-2,000 per payer **[A, unmeasured]**, that is ₹6-12 cr a month of acquisition spend. The base case is
  financeable only if retention beats SpeakX's. Making it beat SpeakX is the whole point of the learner model and
  the parent report.
- **Free substitutes.** ChatGPT Go and Google AI Plus are free for a year in India, and PW's 1:1 AI tutor is due
  around Q2 FY27 at "very affordable" prices (PW has quoted about ₹10/day, i.e. under ₹4,000/yr) **[V†/S]**. All
  of these cap list prices.

### 5.4 Sensitivity (what moves the answer)

| lever | change | effect |
|---|---|---|
| class 9 share (A1) | 0.50 → 0.54 | K-9 184.3 → 185.8M; TAM-1 ₹35.2 → 35.9k cr (±1%) |
| tuition basis | CMS-calibrated → raw ASER | Hindi-belt takers 22.8 → 27.2M; SAM-1 19.1 → 22.1M (+16%) |
| urban uplift for Hindi-belt cities | +5-10 pp on about 22% of children | SAM-1 +0.7-1.5M **[D, rough]** |
| CBSE share outside the belt (A6) | 8% → 16% | SAM-1 ±0.9M |
| billed months (A8) | 8 → 12 | SAM value ±20% |
| price | ₹299 → ₹499 | SAM value +67%; conversion effect unmeasured |
| **Bihar** | removing Bihar | SAM-1 falls by 7.1M (−37%) |

**The answer is most sensitive to Bihar and to price, not to the census-type inputs.** Bihar's roughly 60% tuition
rate makes it the single largest pool of "already paying for this job" children in the Hindi belt, larger than UP
despite having half UP's enrolment.

---

## 6. Critical reading: where this could be wrong

1. **CMS timing bias (April-June fieldwork).** If tuition starts later in the academic year, CMS understates both
   incidence and annual spend. Then TAM-1 is a floor, and the ASER-basis SAM is closer to the truth. *Test:* the
   CMS full report's question wording (not reached this session).
2. **Spend is averaged across levels and states.** CMS state-level coaching spend exists in the full report but
   was not reachable (the MoSPI site is a single-page app; guessed report URLs returned 404). The Hindi-belt wallet
   uses national per-taker prices, so it is probably too high for Bihar and UP and too low for Delhi.
3. **UrbanPro is a biased sample.** Its asks describe the upper end of the human market, not the neighbourhood
   *didi* at ₹300-800/month for a group. The ₹20-45/h effective rate is derived from CMS at an assumed 20 h/month.
   **No source on tuition hours per month was found** **[gap]**.
4. **The SAM-2 union is upward-biased.** Private-school children are more likely to take tuition (BaSE: 42% vs
   35%), so treating the two as independent double-counts some children. More importantly, private-school families
   in the bottom fee bands may not pay ₹299.
5. **Board split is a proxy.** I have no primary count of CBSE or RBSE enrolment in classes 1-9. The CBSE XII
   share (about 13%) is applied downward to younger classes; CBSE's share of primary may be higher (CBSE schools
   that start at nursery) or lower (state-board government schools dominate primary).
6. **Recognised schools only.** UDISE+ misses unrecognised low-fee private schools, which concentrate in exactly
   the high-tuition states (Bihar, UP, Jharkhand). Headcount is a slight undercount; private shares there are
   understated.
7. **A stated preference is not payment.** "37% think tech can fully replace tuition" (BaSE) has never been tested
   with money. Before scaling, the ₹299/₹499/₹699 price test proposed in `india-ai-native.md` §7 is the
   measurement that has to replace this assumption.

---

## 7. Implications for Taxila (decisions this supports)

1. **Lead with Bihar + UP (+ Jharkhand) on a CBSE/NCERT-aligned graph. Do not lead with Rajasthan.** These three
   states hold about 18M K-9 children who already pay for tuition (CMS-calibrated), about 80% of the Hindi belt's
   total. Rajasthan (RBSE) has 0.7M tuition-takers but 6M private-school children, so it is a better **B2B2C**
   market (sell through affordable private schools) than a B2C tuition-replacement market. *Reversal:* a price
   test showing Rajasthan B2C conversion within 30% of UP's.
2. **The price point is set by group tuition at ₹400-900/month, not by 1:1 tutors.** ₹299-499/mo sits at or below
   what tuition-takers spend now (₹401 for rural primary, ₹616-894 for middle). ₹999+ is credible only for urban
   CBSE families, where it competes with CuriousJr (≈₹2,155) and Cuemath (≈₹6,240). *Reversal:* evidence that
   tuition-paying families do not see an AI tutor as a substitute for tuition, i.e. they keep paying the tutor and
   treat Taxila as an extra.
3. **"Replace the tutor" has to be sold as replacing the tuition *job*: homework done, test ready, a teacher who
   knows the child. It cannot be sold as tutor-hours.** At ₹299/mo and Azure realtime prices (₹85-140/h on the
   mini tier), the budget covers about 1-2 hours of live voice a month at a healthy margin **[D]**. Mass tuition
   delivers about 20 hours. The product has to deliver tuition outcomes with **minutes** of live voice per day,
   with pre-rendered narration and interactive or text modes doing most of the work. *Reversal:* realtime voice
   cost falls below about ₹25/h, or a ₹999 tier converts at more than 1% of SAM-1.
4. **Distribution is the moat question, not market size.** The SAM is large (19-47M heads), but 94% of child
   EdTech use is YouTube and 6% is dedicated apps. Budget for a YouTube/WhatsApp funnel, or a school or tuition-centre
   channel, from day one. Seekho and Doubtnut show what happens when ads are the funnel.
5. **Plan for a shrinking K-9 cohort.** Primary enrolment is down 2.4% in a year. Model a 1-2% annual headcount
   decline and grow through ARPU (parent-visible outcomes) and class span (extending to 10).
6. **Design for the mother's phone.** 95% of child access is shared, and 48% of shared phones belong to the
   mother. This is consistent with `design/parent-experience.md`; the market data adds that it is not a
   rural-only fact.
7. **Keep a B2B2C option open.** The private-unaided K-9 base of 70M at LEAD-like ₹500-943/student/yr is a
   ₹3.5-6.6k cr channel, already priced and proven by LEAD's 100% NRR **[S]**. It sidesteps B2C CAC entirely.

---

## 8. Gaps and how to close them

| gap | why it matters | how to close it |
|---|---|---|
| CMS:E 2025 full report: state tables, question wording, reference period | Hindi-belt wallet, timing bias | fetch from mospi.gov.in when reachable; the PIB release names the report but not its URL |
| enrolment by board, and class 9 alone | CBSE/RBSE SAM | UDISE+ open API (`api.udiseplus.gov.in/open-services/v1.1`, seen in the dashboard bundle) or state board exam registrations |
| medium of instruction (Hindi vs English medium) | voice and language mix | UDISE+ school-level data or the dashboard "medium" reports |
| tuition hours per month, group vs 1:1 share | the effective ₹/h comparison | 30-household tuition diary in Patna and Lucknow (cheap, decisive) |
| real conversion and CAC at ₹299 / ₹499 / ₹699 | turns the SOM from assumed to measured | landing-page smoke test plus a 2-week paid pilot (as in `india-ai-native.md` §7) |
| HCES 2023-24 fractiles | affordability at current prices | MoSPI release (factsheet URL not found this session) |

---

## 9. Sources

**Primary, read this session [V]**
- UDISE+ 2025-26 booklet (existing structure): https://dashboard.udiseplus.gov.in/report2026/static/media/UDISE+2025_26_Booklet_existing.edd7cd16d934a10377ba.pdf (Table 1, Tables 5.1-5.5)
- UDISE+ 2024-25 booklet: https://dashboard.udiseplus.gov.in/report2026/static/media/UDISE+2024_25_Booklet_existing.118ba29d4773e6372f72.pdf (Table 1)
- UDISE+ 2025-26 booklet (NEP structure): https://dashboard.udiseplus.gov.in/report2026/static/media/UDISE+2025_26_Booklet_nep.94ceae1e8c2210549d21.pdf
- PIB, "Results of Comprehensive Modular Survey: Education, 2025" (26 Aug 2025): https://www.pib.gov.in/PressReleasePage.aspx?PRID=2160863 ; charts: incidence https://static.pib.gov.in/WriteReadData/userfiles/image/image0051UWG.png ; coaching spend https://static.pib.gov.in/WriteReadData/userfiles/image/image006MAHM.png ; school spend by type https://static.pib.gov.in/WriteReadData/userfiles/image/image003NOOR.png ; spend by item https://static.pib.gov.in/WriteReadData/userfiles/image/image004RVVH.png
- NSS 75th round Key Indicators, Household Social Consumption on Education (2017-18): https://mospi.gov.in/sites/default/files/publication_reports/KI_Education_75th_Final.pdf (Statements 20-22)
- ASER 2024 Annexure 3, paid tuition by school type: https://asercentre.org/wp-content/uploads/2022/12/Annexure_3.pdf
- ASER 2024 India (rural) report card: https://asercentre.org/wp-content/uploads/2022/12/India-2.pdf (Tables 1, 10, 16)
- ASER 2024 national findings: https://asercentre.org/wp-content/uploads/2022/12/ASER-2024-National-findings.pdf
- BaSE 2025, Bharat Survey for EdTech (Central Square Foundation): https://www.edtechbase.centralsquarefoundation.org/BaSE%20Report%202025.pdf
- HCES 2022-23 factsheet (MoSPI): https://mospi.gov.in/sites/default/files/publication_reports/Factsheet_HCES_2022-23.pdf (Statement 4, state MPCE)
- CBSE, Class XII results 2026 press release (13 May 2026): https://www.cbse.gov.in/cbsenew/documents/PRESS_RELAESE_CLASS_XII_2026_MAIN_13052026.pdf ("Size of examination" table)
- UrbanPro fee pages: https://www.urbanpro.com/class-i-v-tuition-fees ; https://www.urbanpro.com/class-6-tuition-fees ; https://www.urbanpro.com/class-9-tuition-fees ; city listings https://www.urbanpro.com/delhi/class-6-tuition (pattern `/{city}/class-{6|9}-tuition`, 28 cities, raw data in `urbanpro_fees_2026-10-02.json`)
- Spotify India premium plans: https://www.spotify.com/in-en/premium/

**Primary, read by sibling reports today [V†]** (see `india-incumbents.md`, `india-ai-native.md`)
- PW Q4 FY26 call (BSE filing, ARPU "less than INR4,000"): https://www.bseindia.com/xml-data/corpfiling/AttachHis/e79d6f62-6a34-4be4-bdf3-1403a853ab7f.pdf
- CuriousJr class-6 Power Batch: https://www.pw.live/curious-jr/batches/power-batch-class-6th-[school-jee-neet]-2026-||-f0611eb-950941
- Cuemath pricing: https://www.cuemath.com/en-in/pricing/ · Vedantu: https://www.vedantu.com/cbse/class-8 · Extramarks: https://play.google.com/store/apps/details?id=com.Extramarks.Smartstudy · Khanmigo: https://www.khanmigo.ai/pricing

**Secondary [S]**
- CMS 2025 coaching spend by gender, per student vs per reported student (Careers360): https://news.careers360.com/mospi-survey-families-spend-more-boys-private-school-coaching-tuition-fees-cms-education-2025-nsso-data-gender/amp
- CMS 2025 summary (Careers360): https://news.careers360.com/27-of-students-rely-on-private-coaching-urban-participation-higher-cms-education-survey-2025/amp
- Census 2011 language totals (Wikipedia summary): https://en.wikipedia.org/wiki/List_of_languages_by_number_of_native_speakers_in_India
- PW Q1 FY27 transcript (K-12 online 0.78M enrolments): https://www.investing.com/news/transcripts/earnings-call-transcript-physicswallah-q1-2027-revenue-rises-24-as-online-gains-93CH-4861014
- SpeakX (₹299/mo, revenue): https://inc42.com/buzz/exclusive-ms-dhoni-joins-edtech-startup-speakxs-cap-table/
- LEAD FY26: https://entrackr.com/fintrackr/edtech-unicorn-lead-group-posts-rs-387-cr-revenue-in-fy26-losses-narrow-20-12431698
- Seekho FY25 ad spend: https://entrackr.com/fintrackr/seekho-spends-rs-134-cr-on-advertising-for-rs-142-cr-revenue-in-fy25-11205187
- Embibe ₹500/student to schools (The Ken, via Embibe): https://www.embibe.com/in-en/embibe-in-news/reliance-jiofy-edtech-embibe/

**Internal**
- `../realtime-cost-model.py` (Azure realtime $/45 min; prices verified 2026-10-02 per its header)
- `india-incumbents.md`, `india-ai-native.md`, `../design/parent-experience.md`, `../learning-science.md`
