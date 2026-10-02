# Pricing and unit economics: what to charge, what a student-hour costs, and when a ₹1,500-3,000 tutor becomes replaceable

**Date:** 2026-10-02 · **Scope:** Taxila B2C (classes 1-9, CBSE/NCERT, RBSE, other boards), Azure-only compute ·
**Model:** `pricing_unit_econ_model.py` → `pricing-unit-econ-model-2026-10-02.json` (every **[D]** number below is
reproducible with `python3 docs/research/market/pricing_unit_econ_model.py`; it imports the sibling simulator
`../realtime-cost-model.py` for the realtime lanes).

| tag | meaning |
|---|---|
| **[V]** | verified today at the primary source (vendor pricing page data, filing, statute) |
| **[S]** | secondary source (press, aggregator, vendor claim) |
| **[U]** | unverified / judgement |
| **[D]** | derived in this file's model from [V]/[S] inputs |
| **[A]** | an explicit assumption, named in the model |
| **[M]** | measured by me today (scrape) |
| **-sibling** | verified or sourced today by a sibling report in `docs/research/**`; the sibling holds the primary link |

FX ₹96 = $1 (as in `../tech-and-market.md`) **[S]**. Consumer prices are GST-inclusive; revenue is net of 18% GST.
Web search was exhausted for this session, so new evidence here comes from direct fetches of primary pages (Azure
pricing HTML, Razorpay, Google Play help, UrbanPro, SEC EDGAR, the DPDP Act PDF) plus sibling reports.

---

## 0. Decision-relevant findings

1. **Price buys voice minutes, not features.** Two-way voice per hour of session time on Azure today costs about
   **₹28 cascade** (MAI-Transcribe-2 → GPT-6 Luna/terra → Azure Neural TTS, half the narration pre-rendered),
   **₹132 `gpt-realtime-2.1-mini`** with a 1-turn audio window, **₹299 GPT-Live-1**, **₹512 `gpt-realtime-2.1`**
   windowed, and **₹1,063 mini unpruned** **[D from V prices]**. The "exactly human" realtime lane costs **4.7×**
   the cascade per hour, GPT-Live 10.7× and rt-2.1 18×.
2. **The cascade floor matches the PhysicsWallah benchmark.** A luna-only cascade comes out at **$0.198/h**, and PW
   says it already delivers voice-to-voice tutoring at "~$0.20 per hour" **[S, MediaNama]**. So PW's cost is
   reachable on Azure first-party models. The rest of Taxila's stack costs very little in comparison: the tap
   lane (kit items with verified keys and cached narration) is **₹0.8/h** **[D]**.
3. **TTS, not the LLM, dominates the cascade.** Per hour: TTS $0.151, terra for the 15% of turns that need
   diagnosis $0.098, STT $0.025, GPT-6 Luna $0.018 **[D]**. Azure now lists **GPT-6 Luna at $0.10 in / $0.01
   cached / $0.50 out** per M tokens, half the price of gpt-5.6-luna **[V]**, so the conversational brain is
   close to free. The levers that matter are pre-rendering narration, buying TTS on commitment ($9.75/M chars at
   400M chars/month, vs $15 list **[V]**, cutting the cascade by 18%), and keeping terra calls rare.
4. **What each price can afford.** These are two-way voice minutes per month after fixed and content costs, at a
   55% / 65% gross margin, on a mature catalogue **[D]**:

   | price | cascade minutes | rt-mini minutes |
   |---|---|---|
   | ₹299 | 92 / 40 | 20 / 8 |
   | ₹699 | 388 / 265 | 82 / 56 |
   | ₹999 | 610 / 434 | 130 / 92 |
   | ₹1,499 | 980 / 716 | 208 / 152 |

   At ₹299 the realtime "live teacher" can only be a taste.
5. **Replacing a tutor hour for hour is not cheaper than the tutor, on any Azure voice lane.** Take 26 hours a
   month of two-way voice at a 55% gross margin. The GST-inclusive price would have to be **₹2,283** on the
   cascade, **₹10,106** on rt-mini and **₹22,653** on GPT-Live **[D]**. The cascade figure equals the ₹1,500-3,000
   tutor's fee. Taxila's price advantage comes from the **lane mix**: two-way voice is about 30-35% of minutes,
   and the rest is tap practice with cached narration. AI voice is not cheap per hour.
6. **A ₹999/month "Ghar Tutor" plan is where the cost floor and the replacement ceiling meet.** It costs 33-67% of
   a ₹1,500-3,000 tutor. Take a heavy class 8-9 user (22.8 learning hours a month): the plan gives **8.0 hours of
   two-way voice (60 minutes realtime + 420 cascade), unlimited tap within the day-cycle cap, and a 48% gross
   margin**. The blended margin for classes 5-7 is **57.5%** **[D]**. ₹699 can be a subject-level substitute. ₹1,499
   gives no price advantage against a ₹1,500 tutor.
7. **Year-1 content spend is the hidden margin killer at the bottom tier.** Suppose Forge spends $1.5 per active
   child-month on bespoke builds (the sibling estimate is $3-7 with no pre-build **[S-sibling]**). Then the ₹299
   plan's blended margin falls from **55% to 8.5%**, and contribution falls from **₹136 to ₹21 per payer-month**
   **[D]**. Pre-build the catalogue centrally, funded by the grant, before selling ₹299 at scale. Cap per-lesson
   personalisation at about $0.02 at ₹299 and $0.05 at ₹999.
8. **Payment channel and plan design move margin by 7-20 points.** Play billing at 15% costs about 7-8 points of
   gross margin against web UPI at 2.36% effective (Razorpay 2% even on UPI, plus 18% GST on the fee) **[V]**.
   India's alternative billing on Play saves only 4 points of Play's fee **[V]**. An annual plan at 8.4× monthly
   (₹2,499 for ₹299) yields a **37%** margin at full-year median usage, against **47% at 10× (₹2,999)** **[D]**.
9. **The free tier must be cache-only.** It costs real money per converted payer: free cost per MAU-month × free
   months ÷ conversion. At ₹6 per MAU, 2 months and 4% conversion, that is **₹285 per payer**. At ₹15 per MAU it is
   ₹750 **[D]**. The sibling GTM model puts the CAC ceiling at about ₹420 per payer at ₹299 **[D-sibling]**. Any
   live model call in the free tier, such as dynamic voice doubts, breaks the funnel. Ads are not an escape:
   **DPDP s.9(3) bans "targeted advertising directed at children"** **[V]**.
10. **Cap the voice in the trial, not its length.** A 14-day trial with 15 realtime and 60 cascade minutes costs
    **₹95 per trial, ₹223 per payer** at RevenueCat's 42.5% trial-to-paid rate for 17-32-day trials. Giving trial
    users the full ₹699 voice budget raises that to **₹654 per payer**, above the whole CAC ceiling **[D]**.
11. **Human tutor prices hardly vary with city tier. Actual spend does.** UrbanPro's hourly asks are ₹375-400 in
    T1 and ₹300 in T3 (n = 798 listings **[M-sibling]**). Top-ranked monthly asks run ₹1,250-5,000 for classes
    1-5 (median ₹3,000), ₹3,500-5,000 for classes 6-8 and ₹6,000 for class 9 (n = 6 per page **[M]**). The
    average tuition taker actually spends ₹401/month (rural primary) to ₹1,365 (urban secondary) **[D-sibling,
    CMS 2025]**. A ₹1,500-3,000 tutor is an upper-quartile spend, about ₹38-150 per child-hour.
12. **Benchmarks for these margins.** Duolingo ran a **72.6%** gross margin in Q2 2026 and guides **71.6%** for
    the year, "reflect[ing] our measured pace of AI-powered feature expansion" **[V, SEC]**. Taxila's
    voice-heavy plans reach **55-58%** with a mature catalogue and **35-46%** in year 1 **[D]**. Plan the P&L
    around the lower figure. Use Duolingo's ~71% as the reachable ceiling only once Azure TTS commitment pricing,
    narration caching and a mature catalogue are all in place.

---

## 1. What families pay today

### 1.1 EdTech and AI subscriptions (K-9 relevant), per month to the family

| product | price | what the money buys | tag / source |
|---|---|---|---|
| Khan Academy, DIKSHA, YouTube (PW, Magnet Brains) | ₹0 | video and practice | [V-sibling] `india-incumbents.md` §5 |
| ChatGPT Go (India) | ₹399/mo; **free for 12 months from 2025-11-04**; ads on Free/Go from Aug 2026, "not … under 18" | general assistant, 13+/18+ | [S-sibling] [TechCrunch](https://techcrunch.com/2025/10/27/openai-offers-free-chatgpt-go-for-one-year-to-all-users-in-india) |
| Google AI Plus (India) | ₹199 for 6 months, then ₹399, shared by up to 5 family members; students get 1 year free (redeem by 31 Dec 2026) | general assistant | [S/V-sibling] [TechCrunch](https://techcrunch.com/2025/12/10/google-launches-sub-5-ai-plus-plan-in-india-to-compete-with-chatgpt-go/), [Google India blog](https://blog.google/intl/en-in/products/start-the-academic-year-with-one-year-of-gemini-on-us/) |
| SpeakX (AI spoken English) | **₹299/mo**; about 2 lakh paid users; ₹45 cr FY26; ~30% monthly paid retention | voice-first AI coach, Hindi scaffolding | [S-sibling] [Inc42](https://inc42.com/buzz/exclusive-ms-dhoni-joins-edtech-startup-speakxs-cap-table/) |
| Seekho Jr / Kutuki | ₹99-999 in-app (₹1 trial → ₹199/₹799 auto-pay) / ₹99-299 | kids' edutainment video | [V-sibling] Play listings |
| Filo (human expert on demand) | ₹299-999 | instant 1:1 doubt help | [V-sibling] |
| Extramarks | "starting at ₹616/month" | self-serve content | [V-sibling] [Play](https://play.google.com/store/apps/details?id=com.Extramarks.Smartstudy) |
| PhysicsWallah (all online) | **ARPU ₹4,311/yr ≈ ₹359/mo** (Q1 FY27); 2.49M paid users | mostly test-prep video and live | [S] [MediaNama](https://www.medianama.com/2026/08/223-physicswallah-personal-ai-tutoring-services/) |
| PW CuriousJr Power Batch (class 6) | ₹30,000/yr, shown as "₹2,155/month" on EMI | live 2-teacher tuition, 400-500 per batch + mentor | [V-sibling] [pw.live / curiousjr.com](https://www.curiousjr.com/in/school-curriculum) |
| Vedantu | group courses from ₹9,000/yr (≈ ₹750/mo); **1:1 from ₹800-888/h** | live tutoring | [V-sibling] [vedantu.com](https://www.vedantu.com/cbse/class-8) |
| Cuemath (maths 1:1) | ₹610-900 per class + 18% GST; KG-5 12-month ≈ ₹74,880/yr ≈ ₹6,240/mo | premium human 1:1 | [V-sibling] [cuemath.com](https://www.cuemath.com/en-in/pricing/) |
| Khanmigo (learner/parent) | $4/mo or $44/yr; free for teachers | text-first Socratic tutor | [V-sibling] [khanmigo.ai](https://www.khanmigo.ai/pricing) |
| YoLearn.ai (closest AI-voice rival) | Free / Starter 500 / Pro 1,000+200 / Elite 2,000+500 **tokens**; the pricing page shows **no rupee prices** | voice tutor, "premium teacher avatars" on Elite | [V] [yolearn.ai/students/pricing](https://www.yolearn.ai/students/pricing) (fetched today); about $5-100/mo usage [S-sibling] |
| LEAD (school B2B) / Embibe (2023) | ≈ ₹943 / ₹500 per student per **year** | school-bundled | [D/S-sibling] |
| Duolingo (global benchmark) | subscription bookings $250.3M per quarter ÷ 12.7M paid ≈ **$6.6 per paid sub-month** | gamified learning plus AI voice | [D from V] [SEC Q2-26 letter](https://www.sec.gov/Archives/edgar/data/1562088/000162828026053299/q2fy26duolingo6-30x26share.htm) |

**Reading.**
- Indian parents' **AI** price expectation is anchored at ₹0-399 for a whole family, because general assistants
  are free or near-free. Their **tutoring** expectation sits elsewhere: ₹2,000-6,000/month for live or human help.
- Taxila has to be priced and framed as *tutoring*, not as an AI subscription. That depends on what it measurably
  does: attendance, homework done, chapter readiness and a parent report.
- PW's ₹359/month ARPU is the mass-market ceiling for "content plus some AI". SpeakX's ₹299 is the proven price
  for paid AI voice in the Hindi belt.

### 1.2 Human tutors by city tier

| source | T1 metros | T2 (Jaipur, Lucknow, Patna, Indore, Bhopal, Kanpur, Nagpur, …) | T3 (Varanasi, Ranchi, Gwalior, Meerut, Kota, …) | tag |
|---|---|---|---|---|
| UrbanPro hourly ask, class 6 (median, IQR) | ₹375 (298-500), n = 80 | ₹298 (182-400), n = 116 | ₹300 (200-399), n = 154 | [M-sibling] `market-size.md` §4.1 |
| UrbanPro hourly ask, class 9 | ₹400 (300-500), n = 89 | ₹350 (250-450), n = 181 | ₹300 (200-400), n = 178 | [M-sibling] |
| same, as a monthly bill at 3 h/week (13 h) | ₹4,900-5,200 | ₹3,900-4,550 | ₹3,900 | [D] |
| average coaching spend **per taker** (CMS 2025 spend ÷ incidence) | urban: primary ₹660, middle ₹894, secondary ₹1,365 /mo | — | rural: primary ₹401, middle ₹500, secondary ₹717 /mo | [D-sibling] `market-size.md` §2, [Careers360](https://news.careers360.com/27-of-students-rely-on-private-coaching-urban-participation-higher-cms-education-survey-2025/amp) |
| neighbourhood group tuition (Delhi low-income, 2014-15) | ₹200/mo for 6 days × 1.5-3 h | — | — | [V-sibling] [J-PAL](https://www.povertyactionlab.org/evaluation/pricing-private-education-urban-india) |
| premium online 1:1 (national) | Vedantu ₹800-888/h; Cuemath ≈ ₹700-1,030/h incl. GST | same | same | [V-sibling] |

**UrbanPro "Top Ranked Tutors & Institutes … with their fees", monthly asks (national pages, fetched today) [M]:**

| page | n | asks (₹/month) | median |
|---|---|---|---|
| [Class I-V](https://www.urbanpro.com/class-i-v-tuition-fees) | 6 | 1,250 · 1,300 · 2,000 · 4,000 · 4,000 · 5,000 | **3,000** |
| [Class 6](https://www.urbanpro.com/class-6-tuition-fees) | 6 | 1,500 · 3,000 · 3,000 · 4,000 · 5,000 · 6,000 | 3,500 |
| Class 7 | 6 | 1,500 · 3,000 · 4,000 · 4,000 · 5,000 · 7,000 | 4,000 |
| Class 8 | 6 | 1,500 · 3,000 · 5,000 · 5,000 · 6,000 · 7,000 | 5,000 |
| [Class 9](https://www.urbanpro.com/class-9-tuition-fees) | 6 | 5,000 · 5,000 · 6,000 · 6,000 · 8,500 · 10,000 | **6,000** |

**Caveats.**
- These are small, overlapping samples. The same Lucknow, Kolkata and Hyderabad tutors appear on several pages.
- They are asking prices from marketplace-listed tutors, not transaction prices.
- An answer on the Class I-V fee page quotes "100-180 per hour" for primary tuition **[M, anecdotal]**.

### 1.3 The ₹1,500-3,000 tutor the owner wants to replace

- **Who pays it.** The fee is **1.1-7.5×** the average per-taker spend (₹401-1,365) **[D]**. These are upper-quartile
  households: T2/T3 families with a home tutor for classes 1-8, or urban families paying for one subject.
- **What it is per hour.** At 1-1.5 h/day for 20-26 days (20-39 h/month), it works out to **₹38-150 per child-hour**
  **[D/A]**. The tutor is often semi-1:1, teaching 2-6 children at the tutor's home **[U]**.
- **What the money buys** (`tutor-substitution.md` J1-J9) **[S-sibling]**:
  - daily homework done and checked;
  - unit-test readiness;
  - custody, meaning a supervised hour;
  - a human who answers to the parent.
- **Consequence.** The AI must replace *jobs*, not hours. Hours are where it is weakest on cost (§5).

---

## 2. Azure unit prices used (read from the pricing-page data today) [V]

Source: `data-amount` attributes on [Azure OpenAI pricing](https://azure.microsoft.com/en-us/pricing/details/azure-openai/),
[Speech pricing](https://azure.microsoft.com/en-us/pricing/details/speech/),
[Container Apps](https://azure.microsoft.com/en-us/pricing/details/container-apps/),
[Bandwidth](https://azure.microsoft.com/en-us/pricing/details/bandwidth/) and
[Content Safety](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/content-safety/). Prices are
us-east-2 Global; the Central India rates I checked are identical.

| item | price | note |
|---|---|---|
| **GPT-6 Luna** (short ctx, Global) | **$0.10 in / $0.01 cached / $0.125 cache-write / $0.50 out** per M | **new**; not in `tech-and-market.md`; Hinglish quality untested [U] |
| GPT-6 Sol / GPT-6.1 Sol | $2.0 / $0.2 (6.1: $0.1) / $2.5 / $10 | alternative to terra for diagnosis |
| GPT-6 Astra | $10 / $1 / $12.5 / $50 | not needed for tutoring |
| gpt-5.6-luna / gpt-5.6-terra | $0.20/$0.02/$1.20 · $2.0/$0.2/$12 (flex: terra $1/$0.1/$6) | terra for misconception diagnosis and reports (flex/batch) |
| gpt-realtime-2.1-mini | text 0.6/0.06/2.4 · **audio 10 / 0.3 / 20** | the "live teacher" lane |
| gpt-realtime-2.1 | text 4/0.4/24 · audio 32/0.4/64 | premium only |
| GPT-Live-1 | ≈ $3/h voice + backend billed separately | [S] catalog snippet; the [Learn page](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/gpt-live) confirms voice and backend are billed separately [V] |
| Voice Live Standard (gpt-realtime-mini, gpt-5.6-luna) | Azure-speech audio **$15 in / $26 out** per M tokens; native audio $11/$22 | [V]; the [Voice Live doc](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live) gives ~10 tok/s in, ~20 tok/s out [V] |
| Voice Live Lite (gpt-5-nano, phi4-mm-realtime) | text $0.11/$0.04/$0.44; audio std $15/$25; phi4 native $4 in | Central India available |
| Azure TTS Neural / Neural HD | **$15 / $22 per M chars**; commitment 400M chars at $3,900/mo, overage **$9.75** | 0.5M chars free per month |
| MAI-Transcribe-2 / Fast / Batch / real-time STT | **$0.10/h** / $0.36/h / $0.18/h / $1.0/h | MAI-2 is listed beside Fast Transcription; streaming use [U] |
| gpt-4o-mini-transcribe / GPT-Transcribe / gpt-live-transcribe | $3/M audio tok (≈ $0.11/h) / $0.27/h / $1.02/h | |
| gpt-4o-mini-tts | $0.6/M text in, $12/M audio out | pin the 2025-12-15 GA version; 2025-03-20 retires 2026-10-15 [V-sibling] |
| gpt-image-2 / gpt-image-1-mini | image out $30/M ≈ $0.006 low / $0.053 medium / $0.211 high (1024²) [S]; mini image out $8/M | |
| Sora 2 | $0.10/s (720p); **retires 2026-10-15** | [V], [V-sibling] [retirement schedule](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/model-retirement-schedule) |
| Content Safety | $0.375 per 1k text records (1k chars); $0.75 per 1k images | Azure OpenAI's built-in filter has no separate charge [S] |
| Container Apps | $0.000024/vCPU-s, $0.000003/GiB-s; 180k vCPU-s + 360k GiB-s free/mo | |
| Internet egress, Asia source | first 100 GB free, then **$0.12/GB** (to 10 TB), $0.085 (to 50 TB) | |

---

## 3. AI cost per student-hour

### 3.1 By voice lane (USD and ₹ per hour of session time in that lane) [D]

Assumptions (`realtime-cost-model.py` plus this model) **[A]**:
- 60 exchanges per 45 minutes.
- The teacher speaks 40% of the time and the child 15%.
- 15% of turns go out-of-band to terra for diagnosis.
- Hinglish speech at 140 wpm × 6 chars per word.
- Half of teacher speech is pre-rendered narration, cached and shared across children.
- STT receives VAD-gated audio (25% of the session).

| lane | $/h | ₹/h | vs cascade | notes |
|---|---|---|---|---|
| tap (kit items with verified keys + cached narration + one luna hint per 2 min) | 0.008 | **0.8** | 0.03× | no model grading (CLAUDE.md law) |
| cascade, luna-only (no terra) | 0.198 | 19.0 | 0.68× | = PW's "~$0.20/h" [S] |
| cascade at TTS commitment price | 0.239 | 23.0 | 0.82× | needs ≈ 400M chars/month |
| **cascade (default)** | **0.292** | **28.1** | 1× | TTS 52%, terra 34%, STT 9%, luna 6% |
| cascade, no cached narration | 0.444 | 42.6 | 1.5× | every sentence synthesised live |
| Voice Live Standard (luna + Azure speech) | 1.00 | 96.0 | 3.4× | buys noise suppression, end-of-turn detection, `meera`/`diya` voices; costs 3.4× DIY |
| rt-2.1-mini, 1-turn audio window, with 70% cache hit | 1.157 | 111.1 | 4.0× | only if Azure starts caching (M1) |
| **rt-2.1-mini, 1-turn audio window** | **1.377** | **132.2** | **4.7×** | in range of 4,000 measured production sessions ($0.015-0.08/min) [S] [Hackernoon](https://hackernoon.com/openai-realtime-api-pricing-in-2026-real-world-data-from-4000-measured-sessions) |
| GPT-Live-1 (+ backend) | 3.116 | 299.1 | 10.7× | full duplex; flat per hour incl. silence |
| rt-2.1, 1-turn window | 5.332 | 511.8 | 18× | |
| rt-2.1-mini, no pruning, no cache | 11.07 | 1,062.8 | 38× | what a naive build ships |

**Three readings.**
1. **Pruning matters more than caching.** Caching cuts the pruned mini lane by only 16% (₹132 → ₹111). Pruning
   cuts it by 88% (₹1,063 → ₹132) **[D]**. Pruning is mandatory; Azure caching (M1 in `tech-and-market.md`) is a
   bonus.
2. **Voice Live is not the cheap path on Azure.** Its Azure-speech audio rates ($15/$26 per M tokens) make it
   3.4× the DIY cascade. Use it only if its turn detection measurably helps slow child speakers.
3. **Model choice barely moves the cascade.** Swapping gpt-5.6-luna for GPT-6 Luna saves about ₹2/h. Pre-rendered
   narration saves ₹14.5/h. TTS commitment saves ₹5/h.

### 3.2 Per learning-hour of a plan (all lanes blended), class 5-7 median user, mature catalogue [D]

| plan | COGS per learning hour | price per learning hour | compare |
|---|---|---|---|
| Saathi ₹299 | ₹8.7 | ₹27 (11.2 h/mo) | rural group tuition ₹10-15/h [D-sibling] |
| Tutor ₹699 | ₹18.8 | ₹62 | urban primary-middle tuition ₹33-45/h [D-sibling] |
| Ghar Tutor ₹999 | ₹26.3 | ₹89 (median) / ₹44 (heavy class 8-9, 22.8 h) | ₹1,500-3,000 tutor: ₹38-150/h |
| Pro ₹1,499 | ₹41.5 | ₹134 / ₹66 | UrbanPro 1:1 ask ₹300-400/h; Vedantu ₹800/h |

### 3.3 Content generation (Forge) per artefact and per child [S-sibling, V prices]

| artefact | marginal cost | reuse |
|---|---|---|
| in-lesson explainer (scene DSL, client-rendered) | ≈ $0.001-0.01 | per child |
| G1 game fill (template + cached assets) | **$0.01-0.15**, 3-25 s | per child |
| G2 bespoke game build (gpt-5.3-codex) | **$1.5-3.5**, P50 ~8 min | cache by misconception × concept × skin |
| G3 new mechanic | $10-30 + human review | catalogue |
| chapter video, 5 min (Manim/scene → MP4) | ≈ $0.2-1.5 + TTS $0.08 | amortised across all children on that chapter |
| gpt-image-2 medium image | ≈ $0.053 (low $0.006) | library |
| Sora 2 clip, 30 s | ≈ $3.20, wrong labels, retiring 2026-10-15 | do not use |
| one-off catalogue of game families × 5 skins | ≈ $7.5k for about 3,000 builds | then a child's game costs G1 money |

Sources: `../factory/llm-game-generation.md` §8, `../factory/video-animation-gen.md` §4,
`../factory/sandboxes-per-student.md` §9 **[S-sibling]**.

**Rules that follow [D]:**
- Personalise by **selection and parameterisation** (G1 fills, explainers, scene DSL), never by per-child pixels
  or video.
- Per-lesson personalisation budget:

  | plan | budget per lesson | 20 lessons a month | share of net revenue |
  |---|---|---|---|
  | ₹299 | ≤ $0.02 | ≈ ₹38 | 15% |
  | ₹999 | ≤ $0.05 | | 12% |

- Bespoke G2 builds are cached and shared. The model assumes the builds attributable to one active child cost
  **$1.5/month in year 1 and $0.3/month at maturity** **[A]**. That is below the sibling's no-pre-build range
  ($3-7, then $0.5-1), because it assumes a grant-funded pre-build of the top concepts.

### 3.4 Fixed per-child costs and revenue deductions

| line | per paid child-month | tag |
|---|---|---|
| Conductor (day plans, consolidation) on GPT-6 Luna | $0.12 | [D/A]; $0.25 on gpt-5.6-luna (`orchestration-architecture.md` §9.1) [S-sibling] |
| parent reports (4 weekly + monthly PTM summary, terra flex/batch) | $0.05 | [A] |
| infrastructure (ACA, blob, ops, egress) | $0.10 | $0.03-0.10 [S-sibling] |
| observability | $0.05 | [A] |
| WhatsApp utility messages (6 × ₹0.115 + GST) | ₹0.81 | [S-sibling] |
| content (Forge, attributable) | $1.5 year 1 / $0.3 mature | [A] |
| **GST** | price ÷ 1.18 | [S]; Cuemath prices show "+18% GST" [V-sibling] |
| payments, web | **2.36%** of price (Razorpay 2% platform fee even on UPI + 18% GST on the fee; UPI Autopay "on request") | [V] [razorpay.com/pricing](https://razorpay.com/pricing/) |
| payments, Play | **15%** of price (auto-renewing subscriptions); alternative billing in India = Play fee − 4 pts + your own PSP | [V] [Play help 112622](https://support.google.com/googleplay/android-developer/answer/112622) |
| support and refunds | 3% of net | [A]; Education refund rate 4.86% [V-sibling, RevenueCat] |

---

## 4. Gross-margin scenarios

Usage model (**[A]**, from `../conductor/day-cycle.md`):
- Planned minutes per day are 0.7 × the daily cap: B1 21, B2 28, B3 42, B4 52.5.
- The median payer is active 16 days a month and uses 70% of the voice budget. The heavy payer is active 26 days
  and uses all of it.
- All minutes not covered by a voice budget are tap.
- "Blended" means 70% median and 30% heavy payers.

### 4.1 The headline table: B3 (classes 5-7), web monthly, blended [D]

| plan (voice budget / month) | COGS mature | GM mature | contribution / payer-month | COGS year 1 | GM year 1 | contribution year 1 |
|---|---|---|---|---|---|---|
| Saathi ₹299 (90 cascade min) | ₹103 | **55.3%** | ₹136 | ₹218 | **8.5%** | ₹21 |
| Saathi ₹349 (120 cascade) | ₹114 | 57.5% | ₹165 | ₹229 | 17.4% | ₹50 |
| Tutor ₹699 (30 rt-mini + 300 cascade) | ₹230 | 57.0% | ₹329 | ₹345 | 37.0% | ₹214 |
| **Ghar Tutor ₹999 (60 rt-mini + 420 cascade)** | ₹325 | **57.5%** | **₹473** | ₹440 | 43.5% | ₹358 |
| Ghar ₹1,199 (90 + 480) | ₹399 | 56.6% | ₹559 | ₹514 | 45.0% | ₹444 |
| Pro ₹1,499 (150 + 540) | ₹520 | 54.9% | ₹678 | ₹635 | 45.6% | ₹563 |

### 4.2 Sensitivities (B3, mature unless stated) [D]

| lever | effect |
|---|---|
| heavy instead of median payer | GM falls 7-15 points (₹999: 61% → 49%; ₹299: 57% → 50%) |
| Play billing instead of web UPI | ₹299 55 → 48%; ₹999 57.5 → 50%; Play alternative billing recovers ~1 point |
| annual plan at 8.4× monthly (₹2,499) vs 10× (₹2,999) | ₹299 blended: 37% vs 47% at full-year median usage. Annual payers' usage usually decays after month 3, which lifts real GM [U, measure] |
| year-1 content ($1.5 vs $0.3 per child-month) | costs ₹115 per child-month: −47 pts at ₹299, −14 pts at ₹999 |
| class 8-9 heavy (B4) on ₹999 | 8.0 voice-h of 22.8 learning-h; GM 48% |
| TTS commitment price ($9.75/M) | cascade −18%; worth ≈ +2-4 pts on ₹699-999 |
| FX ₹90 instead of ₹96 | COGS in ₹ −6%; ≈ +2-3 pts |
| Azure realtime caching works (M1) | rt lane −16%; ≈ +1-2 pts on ₹999 (small, because rt minutes are budgeted) |

### 4.3 Hour-for-hour replacement is not a viable product [D]

The table shows monthly COGS for an all-voice tutor-length slot, and the GST-inclusive price needed for a 55% / 40%
gross margin (fixed and content costs included):

| hours of two-way voice per month | cascade (luna only) | cascade | rt-2.1-mini (1-turn window) | GPT-Live-1 |
|---|---|---|---|---|
| 20 h | ₹440 → **₹1,271** / ₹937 | ₹622 → **₹1,797** / ₹1,324 | ₹2,704 → ₹7,814 / ₹5,758 | ₹6,043 → ₹17,465 / ₹12,869 |
| 26 h | ₹554 → ₹1,600 / ₹1,179 | ₹790 → **₹2,283** / ₹1,682 | ₹3,497 → **₹10,106** / ₹7,447 | ₹7,838 → ₹22,653 / ₹16,691 |

**Reading.**
- A human tutor costs ₹38-150 per child-hour. A healthy-margin AI voice-hour is priced at ₹62-90 on the cascade
  and ₹390 on rt-mini.
- So the AI's per-hour price advantage over the tutor exists only on the cascade, and even there it is small.
  It is not why Taxila can be cheaper.
- Two things make Taxila cheaper:
  1. **The pedagogy:** most minutes are tap or cached-narration practice, which is also where retrieval and
     practice belong (`../learning-science.md`).
  2. **The family plan:** a tutor charges per child, while Taxila's marginal sibling is mostly voice minutes
     (`tutor-substitution.md` §4) **[S-sibling]**.

---

## 5. Free tier design

### 5.1 The arithmetic [D]

Free subsidy per converted payer = (free COGS per MAU-month × months a free user stays) ÷ free→paid conversion.

| free COGS per MAU-month | 2 months, 2% conversion | 2 months, 4% | 3 months, 6% |
|---|---|---|---|
| ₹3 | ₹300 | ₹150 | ₹150 |
| **₹6 (model: cache-only free)** | ₹570 | **₹285** | ₹285 |
| ₹15 (≈ 10 dynamic voice answers a month) | ₹1,500 | ₹750 | ₹750 |
| ₹50 (≈ 1 h cascade voice a month) | ₹5,000 | ₹2,500 | ₹2,500 |

Inputs:
- Download-to-paid at day 35 is **2.1%** for freemium and **10.7%** for a hard paywall, with "nearly identical"
  year-1 retention **[V-sibling, RevenueCat 2026]**.
- The CAC ceiling at ₹299 is **≈ ₹420 per payer** for LTV/CAC = 3 **[D-sibling, `gtm-distribution.md`]**.
- At the RevenueCat freemium rate, even a ₹6 free tier eats more than the entire CAC budget.

### 5.2 Design rules

1. **Free means cache hits only.** Free users get:
   - the placement diagnostic ("Kaise pata?", `gtm-distribution.md`);
   - unlimited kit-keyed practice inside the day-cycle cap, with the teacher's pre-rendered narration and hint
     audio. This is her real voice but one-way: synthesised once per item or hint, so the marginal cost is about
     zero;
   - one full chapter lesson per subject, pre-rendered;
   - a weekly parent summary in-app (a WhatsApp copy only on opt-in, at ₹0.14 per message).

   They get no dynamic TTS, no realtime and no bespoke Forge builds. Target **≤ ₹3-6 per MAU-month** **[D]**.
2. **Two-way voice is the paid wall.** She speaks for free and listens for money. The one thing a free user cannot
   do is talk back. This makes the upgrade moment the child's own question, which is the product's "aha".
3. **The trial is time-boxed and voice-capped.** It runs 14 days with 15 realtime and 60 cascade minutes:
   **₹95 per trial, ₹223 per payer** at 42.5% trial-to-paid. Paying for a trial that carries the full ₹699 voice
   budget (₹654 per payer) is ruled out **[D]**.
4. **No ads, ever.** DPDP Act s.9(3): "A Data Fiduciary shall not undertake tracking or behavioural monitoring of
   children or targeted advertising directed at children" **[V]**
   ([Act PDF](https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf)). OpenAI also
   says it will not serve ads to users it believes are under 18 **[S-sibling]**. An ad-funded free tier is not
   available to a child product.
5. **No ₹1-trial-to-auto-pay.** Seekho's "1 rupee bol kar abhi 799 kat rahe hai" reviews show what it does to
   trust **[V-sibling]**. Send a reminder 48 h before the first debit (`gtm-distribution.md`).

---

## 6. What price makes a ₹1,500-3,000 home tutor replaceable

**Price ceiling (demand side).**
- The family already pays ₹1,500-3,000.
- No Indian evidence shows how large a discount makes a family drop a *trusted* human, so this is untested
  **[U, test it]**.
- Two signals point to strong price sensitivity at the lower end:
  - a ₹100 price cut moved tuition take-up by about 25% (Berry and Mukherjee, Delhi, n = 5,439) **[V-sibling]**;
  - higher prices raised dropout at months 2-3 **[V-sibling]**.
- Working hypothesis: a switch needs **≥ 50% saving plus equal accountability**. That gives a ceiling of
  **₹750-1,500** **[U]**.

**Price floor (cost side).**
- A tutor-replacement user is class 5-9 and uses the product close to the daily cap (18-23 learning hours a month).
- That user needs about 7-9 hours of two-way voice, with mostly cascade and about 1 hour realtime.
- For about 55% blended / 48% heavy margin, that requires **≥ ₹999** (§4.1, §4.2) **[D]**.

**Intersection: ₹999/month (₹9,999/year).** It is 33-67% of the tutor's fee, leaving a ₹500-2,000/month saving.
Add a second child for **+₹499**. Two siblings then pay ₹1,498, against ₹3,000-6,000 for two tutored children.

**Non-price conditions without which no price works** (`tutor-substitution.md` J1-J9) **[S-sibling]**:
- daily homework done and checked;
- school-calendar test prep;
- a fixed daily slot;
- a weekly parent report and a monthly "PTM";
- a named teacher persona the child bonds with.

**Kill condition.** In a pilot cell with these features at ₹999, fewer than about 15% of tutor-paying families drop
the tutor within 90 days (the `tutor-substitution.md` P0 KPI). In that case the product is a *complement* priced
at ₹299-699, and "replace the tutor" waits for evidence that learning outcomes beat the tutor.

---

## 7. Recommended pricing tiers

| tier | price (web, GST incl.) | two-way voice / month | everything else | who it is for | GM blended B3 (mature / year 1) |
|---|---|---|---|---|---|
| **Shuru (free)** | ₹0 | 0 (one-way cached narration only) | diagnostic, kit practice within cap, 1 pre-rendered chapter per subject, weekly in-app parent summary | everyone; acquisition | cost ≤ ₹6 per MAU |
| **Trial** | ₹0, 14 days, UPI Autopay set up with a 48 h reminder | 15 realtime + 60 cascade | all of Tutor | conversion | ₹95 per trial |
| **Saathi** | **₹299/mo · ₹2,999/yr** | 90 min cascade | unlimited tap and cached lessons, all subjects, weekly report | no-tutor families, B1-B2, Hindi belt (first-tutor wedge) | 55% / 8.5% (launch only after the catalogue pre-build) |
| **Tutor** | **₹699/mo · ₹6,999/yr** | 300 cascade + 30 realtime ("live teacher") | + bespoke re-teach builds (cached), unit-test prep | subject-tutor substitute, B3-B4 | 57% / 37% |
| **Ghar Tutor** | **₹999/mo · ₹9,999/yr; +₹499 per sibling** | 420 cascade + 60 realtime | + daily slot guarantee, homework photo check (v2), exam-week boost, monthly PTM report | families paying a ₹1,500-3,000 tutor | 57.5% / 43.5% |
| Pro (later) | ₹1,499/mo | 540 cascade + 150 realtime, or GPT-Live minutes | + premium voice; optional human mentor call (CuriousJr pattern) | metro premium; only after M1/M9 are measured | 55% / 46% |
| top-up | ₹99 per +60 cascade min (exam weeks) | | | heavy users, instead of raising caps | ≈ 63% [D] |
| School Lite (B2B) | per school-year (sibling) | none | tap + reports | school seeding | COGS ≤ ₹30 per pupil-month [S-sibling] |

**Rules that come with the table.**
1. **Tiers are absolute voice budgets, enforced by the cost governor** (`orchestration-architecture.md` §9.2,
   `day-cycle.md` AR-1) **[S-sibling]**. When a budget runs out, the child degrades to cascade, then to tap. The
   lesson never stops, and the child is never shown a "minutes left" counter. The parent sees usage.
2. **Lead with the ₹999 tier for tutor-paying families and with ₹299 for first-tutor families.** Present ₹699 as the
   middle. Test a ₹499 cell, which buys 240 cascade minutes at 55% GM, as an alternative middle.
3. **Price annual plans at 10× monthly, not 8.4×,** until month-4+ usage of annual payers is measured. Annual plans
   retain 44% vs 17% at year 1 (global) **[V-sibling]**, so the annual plan should still be the plan the
   exam-results moment promotes.
4. **Web UPI checkout through the parent's WhatsApp link is the default rail.** Play billing is a fallback. It costs
   about 7-8 GM points.
5. **Do not ship the ₹299 tier at volume before the catalogue pre-build.** In year 1 its contribution is about
   ₹21 per payer-month **[D]**.

### 7.1 Grant runway (for planning the beta)

$5k of Azure credit buys **≈ 2,260 Saathi, ≈ 1,470 Tutor or ≈ 1,170 Ghar student-months** at B3 median usage with
year-1 content **[D]**. That is about 100-200 beta families for 6-12 months. It is not enough for an open free tier
and paid acquisition at the same time.

---

## 8. What would change these recommendations (reversal conditions)

| assumption | if measured otherwise | then |
|---|---|---|
| cascade voice is "human enough" for B1-B4 on Azure Neural hi-IN/en-IN voices [U] | children disengage on the cascade vs realtime (day-30 retention gap > 10 pts in an A/B) | raise rt budgets and move Ghar to ₹1,199-1,499, or wait for GPT-6-class realtime prices |
| rt-mini ≈ ₹132/h with 1-turn pruning (model) | the production cost ledger (M9) shows > ₹180/h | halve the rt budgets per tier |
| content ≤ $0.3 per child-month at maturity [A] | Forge ledger > $1 per child-month after 6 months | stop bespoke G2 builds below the Tutor tier |
| median payer active 16 days, 70% budget use [A] | > 22 days or > 90% budget use | tighten Saathi to 60 min or raise it to ₹349 |
| a switch needs ≥ 50% saving vs the tutor [U] | Gabor-Granger on tutor-paying parents accepts ₹1,299+ | move Ghar to ₹1,199 with more realtime |
| free→paid ≥ 4% with a cache-only free tier [U] | < 2% at day 60 | make free a 14-day trial only (hard paywall: 10.7% vs 2.1% download-to-paid) |
| Azure caching absent on realtime (MS Q&A) [S] | `cached_tokens > 0` | small gain (≈ 16% on the rt lane); no tier change |
| GST 18% on the subscription [S] | a ruling exempts curriculum-tied tutoring | +15 pts of net revenue: reinvest in voice minutes, not price cuts |

## 9. Measurements to run (in priority order)

1. **PU-1 cost ledger by lane.** Record ₹ per child-hour for cascade, rt-mini and tap from `cost_ledger`
   (`orchestration-architecture.md` §9.2). This checks every [D] row in §3.1 within the first 2 weeks of beta.
2. **PU-2 cascade vs realtime human-likeness A/B.** Same lesson, B2 and B3 children. Measure day-7 and day-30
   retention, minutes per session, and parent rating. This decides whether ₹699-999 can stay cascade-heavy.
3. **PU-3 Gabor-Granger / Van Westendorp** for tutor-paying parents in Lucknow, Jaipur and Patna, at ₹499, ₹699,
   ₹999, ₹1,299 and ₹1,499. Ask "would you drop the tutor?" per subject. Extend the `tutor-substitution.md` §9
   survey, which stops at ₹699.
4. **PU-4 free→trial→paid funnel**, cache-only free vs trial-only (hard paywall), with 2 cells × 2 cities.
5. **PU-5 annual-payer usage decay**: minutes per month at months 1-6, which sets the annual multiple.
6. **PU-6 Hinglish quality of GPT-6 Luna** vs gpt-5.6-luna on the kit dialog set. The price difference is small,
   so pick on quality.

## 10. Context-log candidates (for the main loop to merge)

- **Decision candidate:** price tiers are absolute monthly voice budgets by lane, with the governor degrading
  rt → cascade → tap. *Reverse if* PU-2 shows cascade-heavy plans lose > 10 pts of day-30 retention.
- **Decision candidate:** Ghar Tutor at ₹999 is the tutor-replacement SKU. *Reverse if* PU-3 or the P0 pilot shows
  < 15% tutor drop at ₹999 within 90 days.
- **Measurement:** Azure prices read from pricing-page data on 2026-10-02 (§2), n = 1 read, method = the
  `data-amount` attribute. New item: GPT-6 Luna at $0.10/$0.01/$0.50.
- **Measurement:** UrbanPro monthly asks, national fee pages, n = 6 per page × 6 pages, 2026-10-02 (§1.2).
- **Rejection candidate:** "replace the tutor hour for hour with realtime voice". 26 h of rt-mini costs ₹3,497
  COGS, needing a ₹10,106 price at 55% GM (§4.3).
- **Rejection candidate:** an ad-supported free tier is barred by DPDP s.9(3).
- **Rejection candidate:** Voice Live as the cost-saving path. Its Azure-speech audio rates make it 3.4× the DIY
  cascade.

---

## Sources

**Primary, read today [V]**
- Azure OpenAI pricing (GPT-6 Luna/Sol/Astra, gpt-5.6, realtime 2.1/mini, gpt-4o-mini-tts, transcribe, image, Sora 2): https://azure.microsoft.com/en-us/pricing/details/azure-openai/
- Azure Speech pricing (TTS Neural/HD and commitment tiers, MAI-Transcribe-2, Voice Live Pro/Standard/Lite, avatar): https://azure.microsoft.com/en-us/pricing/details/speech/
- Voice Live overview (tiers, model list, ~10/20 audio tokens per second): https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live
- GPT-Live concept (voice billed separately from backend; WebRTC 15 s minimum): https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/gpt-live
- Azure Container Apps pricing: https://azure.microsoft.com/en-us/pricing/details/container-apps/
- Azure bandwidth pricing: https://azure.microsoft.com/en-us/pricing/details/bandwidth/
- Azure Content Safety pricing: https://azure.microsoft.com/en-us/pricing/details/cognitive-services/content-safety/
- Razorpay pricing (2% platform fee incl. UPI; 18% GST on fee; UPI Autopay on request): https://razorpay.com/pricing/
- Google Play service fees (15% subscriptions; India alternative billing −4%): https://support.google.com/googleplay/android-developer/answer/112622
- YoLearn pricing page (token tiers, no ₹ prices shown): https://www.yolearn.ai/students/pricing
- UrbanPro fee pages: https://www.urbanpro.com/class-i-v-tuition-fees , https://www.urbanpro.com/class-6-tuition-fees , https://www.urbanpro.com/class-7-tuition-fees , https://www.urbanpro.com/class-8-tuition-fees , https://www.urbanpro.com/class-9-tuition-fees , https://www.urbanpro.com/class-10-tuition-fees
- Duolingo Q2 2026 shareholder letter (GM 72.6%; FY guide ~71.6%; 12.7M paid; subscription bookings $250.3M): https://www.sec.gov/Archives/edgar/data/1562088/000162828026053299/q2fy26duolingo6-30x26share.htm
- DPDP Act 2023, s.9(3): https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf

**Secondary [S]**
- PW AI tutor ~$0.20/h; online ARPU ₹4,311; 2.49M paid (MediaNama, Aug 2026): https://www.medianama.com/2026/08/223-physicswallah-personal-ai-tutoring-services/
- Realtime production cost study, 4,000 sessions: https://hackernoon.com/openai-realtime-api-pricing-in-2026-real-world-data-from-4000-measured-sessions
- ChatGPT Go free in India: https://techcrunch.com/2025/10/27/openai-offers-free-chatgpt-go-for-one-year-to-all-users-in-india
- Google AI Plus India: https://techcrunch.com/2025/12/10/google-launches-sub-5-ai-plus-plan-in-india-to-compete-with-chatgpt-go/
- SpeakX: https://inc42.com/buzz/exclusive-ms-dhoni-joins-edtech-startup-speakxs-cap-table/
- Azure model retirement schedule (Sora 2, gpt-4o-mini-tts 2025-03-20 → 2026-10-15): https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/model-retirement-schedule

**Sibling reports relied on (each holds its own primary links)**
- `../tech-and-market.md` §1.9 (realtime model, Azure caching Q&A); `../realtime-cost-model.py`
- `market-size.md` §2, §4 (CMS 2025 per-taker spend; UrbanPro n = 798); `urbanpro_fees_2026-10-02.json`
- `india-incumbents.md` §5 (price ladder: Vedantu, Cuemath, Extramarks, Seekho, LEAD, Embibe)
- `india-ai-native.md` (CuriousJr ₹30,000; SpeakX; ChatGPT Go and AI Plus for students)
- `gtm-distribution.md` §4-5 (RevenueCat 2026 conversion and trial data; LTV/CAC; ₹420 CAC ceiling; WhatsApp rates)
- `tutor-substitution.md` §1.3, §4, J1-J9 (jobs a tutor does; Berry and Mukherjee price RCT; family-plan logic)
- `global-ai-tutors.md` (Duolingo AI-cost guidance), `bigtech.md` (free AI bundles)
- `../conductor/day-cycle.md` (daily caps 30/40/60/75; AR-1 lane map), `../conductor/orchestration-architecture.md` §9 (governor, Conductor cost)
- `../factory/llm-game-generation.md` §8, `../factory/video-animation-gen.md` §4, `../factory/sandboxes-per-student.md` §9 (content and infra cost)
- `../safety/dpdp-deep.md` (s.9(3) analysis)

## Fact-check

Adversarial pass, 2026-10-02. Method: refetched every cited primary page (Azure OpenAI and Speech pricing pages parsed from their `data-amount` attributes, Razorpay, Google Play help, Duolingo 6-K, MediaNama, TechCrunch, Microsoft Learn Voice Live, UrbanPro, DPDP search), re-ran `pricing_unit_econ_model.py` (output byte-identical to the committed JSON) and recomputed the shares by hand. Verdicts: supported / partly / unsupported / wrong.

| # | claim | verdict | corrected value | source |
|---|---|---|---|---|
| 1 | Voice cost per hour: cascade $0.29/h (Rs28), luna-only $0.198/h (Rs19), rt-mini windowed Rs132 (4.7x), GPT-Live-1 Rs299 (10.7x), rt-2.1 windowed Rs512 (18x), mini unpruned Rs1,063 | **Partly** | Every lane reproduces from the model (28.1 / 19.0 / 132.2 / 299.1 / 511.8 / 1,062.8). Inputs verified on the Azure pages: realtime-2.1 audio $32/$64, mini audio $10/$20, text $4/$24 and $0.6/$2.4, MAI-Transcribe-2 $0.10/h, Neural TTS $15/M chars. **GPT-Live-1 is not verified**: the pricing page lists only GPT-Live-Transcribe ($1.02/h) and shows no GPT-Live-1 row. The $3/h voice rate is a "catalog snippet [S]" (model line 31), so Rs299 and 10.7x are unconfirmed. All lanes also rest on assumed VAD gating (25%), 15% terra routing and 50% pre-rendered narration. | https://azure.microsoft.com/en-us/pricing/details/azure-openai/ ; https://azure.microsoft.com/en-us/pricing/details/speech/ |
| 2 | Luna-only cascade ($0.198/h) matches PW's ~$0.20/h; PW online ARPU Rs4,311/yr (Rs359/mo), 2.49M paid | **Partly** | PW "~$0.20 per hour" for voice-to-voice, 2.49M paid users and "Average Collection Per User (Online): Rs 4,311" are confirmed. The article gives **no period** for Rs4,311, so "/yr" and "Rs359/mo" are the report's inference (the source tables it as a Q1 FY27 metric; it may be quarterly). PW's stack is not disclosed, so "reachable on Azure first-party models" is a modelled inference (the match is arithmetic coincidence, not evidence of the same architecture). | https://www.medianama.com/2026/08/223-physicswallah-personal-ai-tutoring-services/ |
| 3 | GPT-6 Luna $0.10/$0.01/$0.50 vs 5.6-luna $0.20/$0.02/$1.20; cascade split TTS 52 / terra 34 / STT 9 / luna 6; levers: pre-render (Rs14.5/h), TTS commitment $9.75 vs $15 "-18%" | **Partly** | Prices **verified** from `data-amount` (the visible text still shows "$-" and says Luna prices are "in processing", so a human reading the page will not see them). Split recomputed 51.7 / 33.5 / 8.6 / 6.2 (supported); pre-render saving Rs14.5/h supported. **Fix the "-18%"**: $9.75 vs $15 is **-35% on TTS**; -18% is the effect on the whole cascade lane (Rs28.1 to Rs23.0). The $9.75 tier needs a **400M-char/month commitment ($3,900/mo)**; the 80M tier is $12/M; HD and Azure-OpenAI voices are excluded. "Not the choice of LLM" is loose: terra + luna together are 40% of the cascade. | https://azure.microsoft.com/en-us/pricing/details/azure-openai/ ; https://azure.microsoft.com/en-us/pricing/details/speech/ |
| 4 | Affordable two-way voice minutes at 55% / 65% GM for Rs299, 699, 999, 1,499 | **Supported** (model output) | Reproduced exactly: 92/40 and 20/8; 388/265 and 82/56; 610/434 and 130/92; 980/716 and 208/152. Subject to the claim 1 caveats on inputs. | pricing_unit_econ_model.py output |
| 5 | Hour-for-hour: 26 h/mo needs Rs2,283 (cascade), Rs10,106 (rt-mini), Rs22,653 (GPT-Live) at 55% GM; "not cheaper than the tutor" | **Partly** | Figures reproduce. But Rs2,283 sits **inside** the Rs1,500-3,000 tutor range, so on the cascade AI voice is at par with a mid-priced tutor, not dearer; the claim holds only for the realtime lanes. GPT-Live figure inherits the unverified $3/h. | model `price_needed_hour_for_hour` |
| 6 | Rs999 "Ghar Tutor" = 33-67% of a Rs1,500-3,000 tutor; heavy user 8.0 h voice of 22.8 h at 48% GM; class 5-7 blended 57.5% / 43.5%; discount needed to switch unmeasured | **Supported** (arithmetic); the "makes a tutor replaceable" conclusion is a hypothesis | 999/3000 = 33%, 999/1500 = 67%; B4 heavy 8.0/22.8 h at 48.4% GM; blended 57.5 / 43.5. The report correctly tags the switching discount [U]. | model `tutor_replacement_B4_heavy`, `blended_B3` |
| 7 | At $1.5 per child-month Forge spend, Rs299 blended GM 55.3% to 8.5%, contribution Rs136 to Rs21; sibling estimate $3-7 | **Supported** (arithmetic); inputs **unverified** | 55.3 / 8.5 reproduce; contribution recomputed Rs136 / Rs21. The $1.5 and $0.3 content costs are assumptions [A]; the sibling doc itself tags its per-game cost [U] (about $1.6 per build) and I could not find a "$3-7 per active child" line in `llm-game-generation.md`, so that figure is not traceable. | model; ../factory/llm-game-generation.md §8 |
| 8 | Blended GM Rs299 55/8.5, Rs699 57/37, Rs999 57.5/43.5, Rs1,499 55/46; contribution Rs136/329/473/678; Duolingo Q2-26 GM 72.6%, FY ~71.6%, so Taxila ~15 points below | **Supported** | All reproduce (55.3/8.5, 57.0/37.0, 57.5/43.5, 54.9/45.6) and contribution recomputed Rs136/328/473/678. Duolingo 72.6% and ~71.6% confirmed. Gap is 15-17 points; not like-for-like (Duolingo GAAP COGS includes app-store fees, Taxila web figure excludes them). | https://www.sec.gov/Archives/edgar/data/1562088/000162828026053299/q2fy26duolingo6-30x26share.htm |
| 9 | Razorpay 2% even on UPI + 18% GST = 2.36%; UPI Autopay "on request"; Play 15% on subscriptions; India alt billing -4 pts; Play costs ~7-8 GM points vs web | **Partly** | Razorpay 2% flat on cards/UPI/netbanking and 18% GST on fees confirmed. Play 15% and "reduced by 4%" confirmed. The "UPI Autopay on request" line is **not on the fetched pricing page** (unverified). The 7-8 point gap reproduces (55.3 vs 47.7). Open: the model applies 15% to the GST-inclusive price; whether Play's fee base excludes GST in India is unconfirmed [U], and if it does, Play is overstated by up to about 2 points. | https://razorpay.com/pricing/ ; https://support.google.com/googleplay/android-developer/answer/112622 |
| 10 | Free tier cache-only: subsidy Rs285 (Rs6, 2 mo, 4%) and Rs750 (Rs15) vs CAC ceiling ~Rs420; DPDP s.9(3) bars targeted ads to children; RevenueCat freemium 2.1% vs hard paywall 10.7% | **Supported** with a rounding note | s.9(3) text confirmed: no tracking, behavioural monitoring or targeted advertising directed at children (contextual ads remain possible; educational-service exemptions apply to tracking, not to ads). RevenueCat 2026 10.7% vs 2.1% day-35 confirmed. Rs285 uses Rs5.7/MAU (Rs6 gives Rs300). Rs420 CAC ceiling is a sibling derivation, not re-derived here. | https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf ; https://www.revenuecat.com/state-of-subscription-apps |
| 11 | 14-day trial, 15 rt + 60 cascade min = Rs95/trial, Rs223/payer at 42.5% conversion; full Rs699 budget = Rs654/payer | **Partly** | Cost per trial reproduces (Rs95; Rs278 for the big budget; Rs654 per payer). **The 42.5% conversion is RevenueCat's figure for trials of 17+ days**; for a 14-day trial the nearer bucket is about 37.4% (5-9 days per sibling) to 42.5%. At 37.4% the cost is about Rs254 per payer. Treat Rs223 as a lower bound. | https://www.revenuecat.com/state-of-subscription-apps ; gtm-distribution.md fact-check row 5 |
| 12 | Tutor prices barely vary by tier: UrbanPro T1 Rs375-400, T2 Rs298-350, T3 Rs300 (n=798); monthly asks classes 1-5 Rs1,250-5,000 (median 3,000), class 9 Rs6,000; CMS-2025 spend Rs401-1,365; Rs1,500-3,000 tutor = Rs38-150 per child-hour | **Partly** | Hourly Rs300-400 and the class 9 page confirmed live. The class 9 page now shows monthly asks of Rs5,000 / 6,000 / 8,500 / 10,000 (four examples, median about 7,250, not 6,000), so "class 9 median Rs6,000" is stale or sample-dependent (n is tiny). The n=798 scrape and CMS figures come from the sibling and were not re-derived. | https://www.urbanpro.com/class-9-tuition-fees |
| 13 | Anchors: ChatGPT Go Rs399 (free 12 months from Nov 2025); Google AI Plus Rs199 then Rs399, 5-member family, **free for students for a year**; SpeakX Rs299; Vedantu Rs800-888/h, CuriousJr Rs2,155-2,500; YoLearn token tiers, no rupee prices | **Partly / wrong on Google** | ChatGPT Go Rs399 launch price and the 12-month free promo from 4 Nov 2025 confirmed (the promo is a sign-up window, so likely lapsing now). Google AI Plus: Rs199 for the first 6 months then Rs399, up to 5 family members: confirmed. **"Free for students for a year" is wrong as stated**: that offer was Google **AI Pro** (not AI Plus), for students **18+**, registration deadline 15 Sep 2025, so it does not reach Taxila's 6-15 age band. SpeakX Rs299/month confirmed. YoLearn: token tiers (Starter 500, Pro 1000+200, Elite 2000+500), no rupee prices: confirmed. Vedantu and CuriousJr prices not rechecked. | https://techcrunch.com/2025/12/10/google-launches-sub-5-ai-plus-plan-in-india-to-compete-with-chatgpt-go/ ; https://blog.google/intl/en-in/company-news/technology/students-in-india-just-got-a-gemini-upgrade/ ; https://www.yolearn.ai/students/pricing |
| 14 | Pruning beats caching: cache cuts pruned rt-mini by 16% (Rs132 to Rs111) vs 88% from pruning (Rs1,063 to Rs132); Voice Live Standard (luna + Azure speech audio $15/$26) is 3.4x the cascade | **Supported** | 132.2 to 111.1 = -16%; 1,062.8 to 132.2 = -87.6%; Voice Live Standard lane Rs96.0/h vs Rs28.1 = 3.4x. Voice Live Standard audio $15 in / $26 out, and gpt-5.6-luna in the Standard tier, confirmed on the Speech page and Microsoft Learn. The 3.4x depends on the 25% VAD gate and 40% teacher-speech assumptions. | https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live ; https://azure.microsoft.com/en-us/pricing/details/speech/ |

**Net:** no arithmetic errors found; the model is reproducible. Corrections to carry forward: (a) GPT-Live-1 $3/h is unverified; (b) TTS commitment is -35% per char (-18% on the cascade) and needs a 400M-char/month commitment; (c) PW Rs4,311 has no stated period; (d) Google's free student plan is AI Pro, 18+, expired Sep 2025; (e) trial conversion 42.5% is for 17+ day trials; (f) class 9 UrbanPro median is about Rs7,250 on today's sample; (g) Razorpay UPI Autopay "on request" and Play's GST fee base are unverified.
