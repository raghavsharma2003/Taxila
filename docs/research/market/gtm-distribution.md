# Distribution and go-to-market for Taxila (India, classes 1-9)

*Research date 2026-10-02. Scope: WhatsApp-first funnels, YouTube teacher channels, school B2B2C and affordable
private schools (APS), government programmes (DIKSHA, PM eVidya, state MoUs), telecom bundles, referral, Hindi-belt
vernacular marketing, freemium vs trial, payments (UPI Autopay), CAC benchmarks, and a recommended wedge. This file
builds on `market-size.md`, `india-incumbents.md`, `india-ai-native.md`, `china-asia.md`, `bigtech.md`,
`../design/parent-experience.md`, `../design/onboarding-flow.md` and `../safety/dpdp-deep.md`. It does not repeat them.*

**Evidence tags.** **[V]** = read at the primary source in this session (a filing, shareholder letter, official doc,
survey PDF or vendor doc). A [V] on a vendor page means *the vendor says so*. **[S]** = secondary (press, aggregator,
Wikipedia, or an earlier Taxila doc's [S]). **[U]** = unverified (memory, or no source reached). **[D]** = derived by
me from tagged inputs. **[A]** = an assumption with no source, to be replaced by a measurement. FX **₹96 = $1**.

**Method and limits.** The session's WebSearch budget (200 calls) was already used up when this task started, so
**nothing here comes from new search results**. Evidence comes from about 45 direct fetches of known URLs (Meta,
Google Play, NPCI-adjacent and Razorpay docs; the PW Q4 FY26 shareholder letter; the BaSE 2025 and IAMAI-Kantar 2024
survey PDFs; UDISE+ 2025-26; the CSF private-schools report; Entrackr; RevenueCat; ConveGenius; PIB). It also uses
two reproducible scripts written for this file:
- `yt_channels_snapshot.py` → `yt-channels-2026-10-02.json`: subscriber counts for K-12 YouTube channels.
- `gtm_funnel_model.py` → `gtm-funnel-model-2026-10-02.json`: LTV, CAC by channel and break-even conversions.

**Gaps that search would have closed:**
- named Rajasthan and UP edtech MoUs after 2024;
- Click-to-WhatsApp cost-per-conversation benchmarks for India;
- YouTube creator sponsorship rates;
- telco revenue-share terms.

These are marked [U] and listed in §8.

---

## 0. Bottom line: the 13 findings that decide the GTM

1. **Indian children find EdTech through school and friends, not ads.** In BaSE 2025 (N = 7,866 EdTech-using children in low-resource households, 10 states), children first adopted EdTech through:
   - school or teachers: **63%**
   - friends or classmates: **58%**
   - relatives: 23%
   - tuition teachers: **22%**
   - on their own: 10%
   - **advertisements or news: 6%**
   - government campaigns: 4%
   - "a private education company": 3%

   **[V]** ([BaSE 2025](https://www.edtechbase.centralsquarefoundation.org/BaSE%20Report%202025.pdf), Fig. 14). Trusted adults and peers are the distribution. Paid media is a small door.
2. **The default EdTech is free and generic.** Among EdTech-using children:
   - YouTube 94%, WhatsApp 67%, Google 49%;
   - only **6%** use any dedicated EdTech app, and **DIKSHA reaches 2%**.

   Among EdTech-using teachers (N = 2,186), YouTube and WhatsApp are 61% each and DIKSHA is 21% **[V, BaSE]**. A government platform is not where children are. YouTube and the class WhatsApp group are.
3. **Ads-led Indian edtech burns cash; content-led edtech does not.**

   | company | period | acquisition spend | tag |
   |---|---|---|---|
   | PhysicsWallah | FY26 | marketing ₹354 cr = **9% of revenue** (₹3,900 cr), with a 142M social-media community | [V, PW Q4 FY26 letter] |
   | Seekho | FY25 | ads ₹134 cr on ₹142 cr revenue (**95%**) | [S] |
   | Cuemath | FY24 | ₹2 spent per ₹1 of revenue | [S] |
   | Gaotu (China) | — | 53-78% of revenue on selling | [D, `china-asia.md`] |

   PW spent about **₹663 of marketing per paid user** (₹354 cr ÷ 5.34M) **[D]**.
4. **The CAC ceiling at ₹299/month is low: about ₹420 per payer for LTV/CAC = 3.**
   - Base case: blended contribution LTV ≈ **₹1,267** per payer. Assumptions: web UPI Autopay; SpeakX-like retention giving about 5 paid months on the monthly plan; 35% of payers on a ₹2,499 annual plan; 40% COGS **[D/A, §5]**.
   - Check: RevenueCat measures India/SEA year-1 realised LTV per payer at **$14 ≈ ₹1,344** **[V, RevenueCat 2026]**.
   - So paid app-install ads would need **≈9.5% install-to-payer** to hit 3×. The global median is 10.7% for hard-paywall apps and 2.1% for freemium **[V]**. **Paid social cannot be the engine.**
5. **WhatsApp is the parent channel, not the classroom.**
   - India rates per delivered message: marketing **₹0.8631**, utility, authentication and (from 1 Oct 2026) service **₹0.115**, plus 18% GST **[S, rate aggregators consistent with Meta's page [V]]**.
   - Click-to-WhatsApp ads open a **72-hour free window** **[V, Meta]**.
   - **General-purpose AI chatbots are banned** on the Business API since 15 Jan 2026. AI "in a supporting role" (support, lead qualification) is allowed **[S]**.
   - **Per-user marketing caps apply in India.** They are based on the user's read rate. Error 131049; the EEA, UK, Japan and Korea are exempt **[V, Meta]**.
   - So run structured diagnostics, reports and billing on WhatsApp, never open-ended tutoring.
6. **Hindi K-9 YouTube is saturated by free teacher-persona channels.** Magnet Brains has **14.5M** subscribers and 61K videos; Dear Sir **22.8M**; PW Foundation 6.75M; PW Little Champs (classes 6-8) 1.3M. Khan Academy's Hindi-medium channel has **68.6K** **[V, snapshot 2026-10-02]**. Content is not scarce. A trusted face and a *check that the child understood* are. Taxila should use YouTube to *demonstrate the check to parents*, not to compete as a lecture library.
7. **Affordable private schools are a large, concentrated, reachable channel.**
   - **3,41,689** private unaided recognised schools, **1,07,905 of them in UP** (32%) **[V, UDISE+ 2025-26 Table 3.5]**. That is about 205 K-9 pupils per school **[D]**.
   - 70% of private-school pupils pay under ₹1,000/month in fees; 45.5% pay under ₹500 **[V, CSF 2020 on MoSPI 2019]**.
   - Proven school prices: LEAD **≈₹943/pupil/yr**, 100% NRR, EBITDA-positive **[S]**; Embibe ₹500 **[S]**; ConveGenius (states) ₹500-2,100 **[V vendor]**.
8. **Under DPDP, the school channel is also the compliance channel.**
   - From 13 May 2027, s.9(3) bans "tracking or behavioural monitoring of children or targeted advertising directed at children", and consent cannot lift the ban **[V via `dpdp-deep.md`]**.
   - The Fourth Schedule exempts educational institutions for "educational activities". Taxila acting as a school's processor ("School Mode M2") is the defensible home for the full learner model.
   - Marketing must target **parents and teachers**, never children.
9. **Government channels pay little, slowly, and on evidence.**
   - States buy adaptive learning at ₹500-2,100/pupil/yr. Examples: ConveGenius in AP (325k pupils), HP (₹500/pupil), Rajasthan (Mission Buniyaad, ~5 lakh girls) **[V, vendor]**. Mindspark runs in Rajasthan government schools, backed by a 0.2 SD RCT **[V, via `india-ai-native.md`]**.
   - DIKSHA and PM eVidya are free *content* rails used by 2% of children **[V]**, not sales channels.
   - B2G is a year-2-3 channel that needs a published outcome study.
10. **Telcos give AI away to whole subscriber bases, but they pick global brands.** Airtel gave Perplexity Pro free for 12 months to 360M subscribers **[S, TechCrunch]**. Jio (524M subscribers) has a Google AI bundle **[S, Wikipedia; details inconsistent]**. Embibe was folded into Jio Platforms in 2025 **[S]**. This is a reach deal for after Taxila has proof and brand, not a wedge.
11. **Trials beat freemium, and long trials beat short ones. In India, the ₹1-trial-to-auto-pay pattern burns trust.**
    - Download-to-paid (RevenueCat 2026): hard paywall **10.7%**, freemium **2.1%**, with "nearly identical year-one retention" **[V]**.
    - Trial-to-paid: 17-32-day trials **42.5%**, ≤4-day trials **25.5%** **[V]**.
    - Seekho reviews: "1 rupee bol kar abhi 799 … kat rahe hai" **[V, via `india-incumbents.md`]**.
12. **UPI Autopay removes payment friction at Taxila's price points.**
    - Mandates run up to ₹1,00,000. Debits **≤ ₹15,000 go through with no extra authentication**. Registration can be ₹1; there is a pre-debit notice and debits are retried **[V, Razorpay docs]**.
    - Card debits are raised 24 h ahead and need extra authentication above ₹15,000 **[V, Razorpay docs]**.
    - Google Play takes **15%** on subscriptions; India user-choice billing cuts that by 4 points **[V, Google]**. A web or WhatsApp-link checkout at about 2% recovers about 13% of revenue **[D/A]**.
13. **Recommended wedge: school-seeded, parent-paid, carried on WhatsApp.**
    - Where: mid-fee APS (₹500-2,000/month fees) in Lucknow-Kanpur (UP).
    - Who and what: classes 4-8, maths and science, Hinglish voice.
    - Funnel: a free "Kaise pata?" diagnostic, then a 14-21-day trial, then ₹299/mo or ₹2,499/yr on UPI Autopay.
    - Retention and referral: the weekly Hindi WhatsApp report.
    - Test both offers: free-to-school (parents upgrade) against school-paid "Lite" (₹600-1,200/pupil/yr, LEAD band).
    - Supporting cells: a direct-to-parent cell in Patna (YouTube plus CTWA), the tuition-replacement market.
    - Deferred: B2G until there is an RCT; telco until about 100k payers.

    Details, KPIs and reversal conditions are in §6.

---

## 1. Where the child and the parent actually are

| measure | value | source |
|---|---|---|
| EdTech discovery channel (children) | school/teacher 63%, friends 58%, relatives 23%, tuition teacher 22%, self 10%, community influencer 7%, ads/news 6%, govt campaign 4% | BaSE 2025 Fig. 14, N = 7,866 **[V]** |
| why they keep using it | better learning 49%, future-ready 43%, convenient 42%, fun 26%, **mandated by teacher/school/tuition 23%**, free or cheap 22% | BaSE Fig. 15 **[V]** |
| tools used (children) | YouTube 94%, WhatsApp 67%, Google 49%, WhatsApp/Meta AI 14%, Gemini 8%, ChatGPT 6%, DIKSHA 2%, Duolingo 1% | BaSE Table A1.2.5 **[V]** |
| tools used (teachers) | YouTube 61%, WhatsApp 61%, Google 56%, DIKSHA 21%, NISHTHA 13%, E-pathshala 12% | BaSE Fig. 13, N = 2,186 **[V]** |
| teacher discovery of GenAI | school or fellow teachers 50%, ads/news 28%, students 24% | BaSE **[V]** |
| would recommend EdTech | 84% of respondents; 88% of EdTech-using teachers | BaSE **[V]** |
| "tech could fully replace tuition" | 37% (51% "a helpful support") | BaSE, via `market-size.md` **[V]** |
| phone the child uses | 68% shared, 4% own; **mother's phone in 48%** of cases | BaSE, via `market-size.md` **[V]** |
| internet users / Indic | 886M active (488M rural); **98% (870M) used the internet in an Indic language**; 57% of urban users prefer Indic; 140M voice-command users, 55% rural | IAMAI-Kantar ICUBE 2024 **[V]** |
| WhatsApp in India | about 535M monthly users | `parent-experience.md` **[S]** |

**Read.**
- The buyer is the mother, on her phone, in Hindi.
- The influencers are the class teacher, the tuition didi and other parents in the class.
- Every channel below is judged by how directly it reaches that triangle.

---

## 2. What acquisition has cost Indian edtech

| company (period) | acquisition or selling spend | revenue | ratio | what it says | tag |
|---|---|---|---|---|---|
| **PhysicsWallah** (FY26) | marketing ₹354 cr | ₹3,900 cr | **9%**; ≈₹663 per paid user (5.34M) | YouTube-community funnel: 142M "learner community", 91% of paid learners online, "YouTube views grew 58% YoY" | [V] letter; [D] |
| PW Vishwas Diwas (28 Feb + 3 weeks, 2026) | event-led launch | ₹205 cr collections, 439.6k orders, ACPU ₹4,658 | — | vernacular orders 22k (+106%), State Boards 24k (+178%), CuriousJr + Power Batch 6.7k; "fresh 1,500+ pin codes" | [V] |
| **Seekho** (FY25) | ads ₹134.2 cr | ₹141.5 cr | **95%**; ads were 75% of all expenses | Hinglish micro-subscriptions bought with performance ads | [S] [Entrackr](https://entrackr.com/fintrackr/seekho-spends-rs-134-cr-on-advertising-for-rs-142-cr-revenue-in-fy25-11205187) |
| **Cuemath** (FY24) | total spend ₹2 per ₹1 revenue | ₹126 cr | — | premium 1:1 with a teacher supply cost on top of CAC | [S] [Entrackr](https://entrackr.com/fintrackr/google-funded-cuemath-posts-flat-revenue-in-fy24-shrinks-losses-by-43-7452541) |
| **Doubtnut** (FY22) | ads ₹194 cr | ₹10 cr | 19× | free doubt-solving with no paid product fit | [S] via `india-incumbents.md` |
| **SpeakX** (FY26) | "CAC payback of one day", LTV/CAC 3.7× in 6 months | ₹45 cr | — | AI voice at ₹299; celebrity investor-ambassador (MS Dhoni); ~30-35% month-3 retention | [S] via `india-ai-native.md` |
| **Gaotu** (China, 2024→2025) | selling 78.2% → 53.5% of revenue | — | — | learning-adviser sales floor | [D] via `china-asia.md` |
| **LEAD Group** (FY26) | school sales force (not disclosed) | ₹386.6 cr | — | ≈₹943/pupil/yr, 9,000+ schools, adds about 1,000 a year, NRR 100% | [S] via `india-incumbents.md` |
| RevenueCat IN/SEA (2025 data) | — | D60 revenue per install **$0.11**; Y1 realised LTV per payer **$14** (global $23, NA $32) | — | the market's revenue ceiling per install | [V] [RevenueCat 2026](https://www.revenuecat.com/state-of-subscription-apps/) |

**Read.**
- There are two ways to scale profitably in Indian K-12: **content-led** (PW at 9%) and **institution-led** (LEAD, through schools).
- Ad-led consumer models (Seekho, Doubtnut, Cuemath) are funded by investors, not by the unit economics.
- A *possible* third way is SpeakX's mix of performance marketing and celebrity. It is adults buying English, which is a higher-intent purchase than a parent buying "study help". A one-day payback almost certainly reflects multi-month upfront plans **[U, inference]**.

---

## 3. Channel by channel

### 3.1 WhatsApp-first funnels

**What it costs.** India, per delivered message, from 1 Oct 2026 **[S]** ([whautomate](https://whautomate.com/whatsapp-business-api-pricing-india); [360dialog](https://360dialog.com/blog/whatsapp-service-message-charging-october-2026/)). The model is consistent with [Meta's pricing page](https://developers.facebook.com/docs/whatsapp/pricing/) **[V]**.

| category | ₹ / message (+18% GST) | Taxila use |
|---|---|---|
| marketing | **0.8631** | re-engagement and offers, sparingly (7.5× utility) |
| utility | **0.115** (now billed even inside the 24 h window) | weekly report, trial reminder, billing notice, homework summary |
| authentication (domestic) | 0.115 | WhatsApp OTP (international-sender OTP costs ₹2.4971) |
| service | 0.115 after 1,000 free per number per month (from 1 Oct 2026) | parent replies, support |
| inside a CTWA / Page-CTA entry point | **free for 72 h** after the business replies **[V, Meta]** | the whole structured diagnostic flow |

Meta moved India to INR billing on 1 Jan 2026. Existing WABAs must migrate by 31 Dec 2026 **[V, Meta]**.

**Rules that shape the funnel.**
- **No open-ended AI tutoring on WhatsApp.** General-purpose AI chatbots are banned on the Business API: for new users from 15 Oct 2025, for everyone from 15 Jan 2026. "AI in a supporting role" (support, bookings, lead qualification) remains allowed **[S]** ([respond.io](https://respond.io/blog/whatsapp-general-purpose-chatbots-ban)). Italy and Brazil forced exclusions; India has none **[S, `bigtech.md`]**.
- **Marketing messages are capped per user**, "based on … recent marketing message read rate and how many messages they currently have in their inbox". Undelivered messages return error 131049. A reply opens a 24 h window that does not count toward the cap. India is not exempt **[V]** ([Meta](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/marketing-templates/per-user-limits/)). Blasting parents degrades deliverability. Low read rates are punished.
- **WhatsApp is a parent channel only.** Pre-teen parent-linked accounts (Mar 2026) are messaging and calling only, with no Meta AI **[S, `bigtech.md`]**.

**Cost at scale [D].**

| message | volume | cost |
|---|---|---|
| weekly utility report | 100k parents | 100k × ₹0.136 = **₹13.6k/week** (≈₹0.59 per parent per month) |
| marketing broadcast | 100k parents | **₹1.02 lakh** each time |

The marketing cost, not the utility cost, is what needs a budget line.

**Who has shown WhatsApp works in Indian education.**
- Rocket Learning reaches "6 million children and parents" through "self-help peer groups on WhatsApp" run by 4 lakh Anganwadi workers **[V, vendor]** ([rocketlearning.org](https://rocketlearning.org/)).
- ConveGenius runs teacher support on SwiftChat/WhatsApp in J&K: 65,000+ teacher registrations **[V, vendor]** ([impact](https://convegenius.com/impact.html)).
- Both are free and institution-led. **I found no published Indian K-12 *paid* conversion data for Click-to-WhatsApp (CTWA) funnels [gap]**.

**Design of the Taxila WhatsApp funnel** (all structured, all buttons):
1. **Entry points:**
   - a CTWA ad to mothers in the pilot pin codes;
   - a school's class WhatsApp group link;
   - a parent's shared report card.
2. **Inside the 72 h free window:**
   - "Which class? Which board?" (2 taps);
   - a 60-second Hindi voice note from the teacher;
   - a link to the app for the child's diagnostic (the diagnostic runs in-app; it is voice and needs the child);
   - a "Kaise pata?" summary back on WhatsApp.
3. **After that:** utility only. Weekly report (≤2 learning messages a week; `parent-experience.md`), trial-ending reminder 48 h before the first debit, payment receipts, and a one-tap "cancel" link.
4. **Never:** offers inside the report (that reclassifies it as marketing and breaks trust), or open chat with the AI.

### 3.2 YouTube teacher channels

**Snapshot (subscribers, videos), fetched 2026-10-02** **[V]** (`yt-channels-2026-10-02.json`):

| channel | focus | subscribers | videos |
|---|---|---|---|
| Dear Sir | school maths and English, Hindi | **22.8M** | 1.6K |
| Magnet Brains | free full K-12 curriculum, Hindi + English | **14.5M** | 61K |
| Physics Wallah – Alakh Pandey | JEE/NEET origin channel | 14.3M | 1.7K |
| Physics Wallah Foundation | classes 9-10 | 6.75M | 4.1K |
| Doubtnut | doubt videos (Hindi) | 3.99M | 1.2M |
| Manocha Academy | science 6-10 (English) | 1.56M | 493 |
| Magnet Brains Hindi Medium | Hindi-medium K-12 | 1.33M | 14K |
| PW Little Champs | classes 6-8 | 1.3M | 1.8K |
| Let'stute | K-10 | 1.22M | 1.4K |
| Khan Academy India – Hindi medium | non-profit, NCERT-aligned | **68.6K** | 4.5K |

**Read.**
- The Hindi K-9 lecture library is free, enormous and personality-led. **Khan's Hindi channel has about 0.5% of Magnet Brains' audience despite comparable intent.** In this market a teacher persona beats an institutional brand **[D/inference]**.
- PW's own letter makes the same point: "Our YouTube views grew 58% YoY … trusted educators remain central" **[V]**.
- **Taxila cannot win YouTube as another lecture channel.** What no channel offers is *proof that this child understood*. YouTube's job for Taxila is to show that proof to parents.

**How to use YouTube.**
1. **An owned parent-facing channel in Hindi**, addressed to mothers, not to children:
   - real (consented) children doing a covert check ("she got the answer, but did she understand?");
   - the "Kaise pata?" report;
   - one-minute "is your child really understanding fractions?" diagnostics with a link to the WhatsApp flow.

   Keep it off "made for kids". The audience and the buyer is the parent. Child-directed ads become illegal under DPDP s.9(3) on 13 May 2027 **[V via `dpdp-deep.md`]**. (YouTube restricts features on made-for-kids content; the specific list was not read this session **[U]**.)
2. **Creator integrations as a measured test, not a pillar.** The test unit is mid-tier Hindi K-8 teachers (100k-1M subscribers), with tracked links to the WhatsApp diagnostic.
   - **No India creator rate card was read this session [U].**
   - The model's base case (₹40k per integration, 25 payers) gives a CAC of ≈₹1,600, about 4× the ceiling. Run one integration and measure it before committing a budget.
3. **The deeper option: a licensed teacher persona.** PW trains its Awaaz TTS on "1000 hrs of high-quality teachers' voice data" **[V, via `india-ai-native.md`]**. A real Hindi-belt teacher could license her face, name and voice to a Taxila persona for a revenue share, and bring her audience with her.
   - This must stay within the Azure-only directive (Azure custom voice requires Microsoft's limited-access approval **[U]**).
   - It must keep the never-deny-being-an-AI floor. Treat it as a phase-2 experiment.

### 3.3 Schools: affordable private schools as the B2B2C channel

**Size and shape.**

| measure | value | source |
|---|---|---|
| private unaided recognised schools, India | **3,41,689** | UDISE+ 2025-26 Table 3.5 **[V]** |
| … Uttar Pradesh / Rajasthan / Madhya Pradesh / Bihar | **1,07,905** / 33,903 / 27,214 / 12,317 (Bihar undercounted: unrecognised schools are missing) | same **[V]** |
| K-9 pupils in private unaided schools | 70.1M (37.9% of K-9) | `market-size.md` **[D from V]** |
| pupils per private unaided school | ≈289 overall; ≈205 K-9 | **[D]** (98.9M ÷ 341,689; 70.1M ÷ 341,689) |
| fee bands (private-school pupils) | 70% pay under ₹1,000/month; 45.5% under ₹500 | CSF *State of the Sector* (2020, on MoSPI 2019) **[V]** ([PDF](https://www.centralsquarefoundation.org/State-of-the-Sector-Report-on-Private-Schools-in-India.pdf)) |
| fee bands (low-income private families, BaSE) | under ₹200: 23%; ₹200-500: 36%; ₹501-1,000: 27%; ₹1,001-2,000: 12%; over ₹2,000: 2% | BaSE **[V]** |
| smartphone access by fee band | 64% (fee under ₹500), 74% (₹500-1,000), 87% (over ₹1,000) | BaSE **[V]** |

**Proven prices in the channel.**

| provider | price | proof | tag |
|---|---|---|---|
| LEAD | ≈₹943/pupil/yr | 9,000+ schools, NRR 100% | [S] |
| Embibe | ₹500 | — | [S] |
| ConveGenius HP LEP 2.0 | ₹500 | — | [V vendor] |
| ConveGenius PAL | ₹1,700-2,100 | — | [V vendor] |
| LEAD Fluento | ≈₹2,000 | — | [S] |

LEAD's Ms Curie (an animated AI tutor, English only, classroom) targets 1,000+ schools **[S]**. **LEAD is the incumbent in this channel and will be the competitor or the partner.**

**Why the school channel fits Taxila specifically.**
1. **Trust and discovery.** Schools are the #1 discovery source (63%), and "mandated by teacher/school" is a 23% reason for continued use **[V, BaSE]**. A teacher assigning Taxila homework is the strongest acquisition *and* retention signal available.
2. **Curriculum sync.** The school supplies the chapter calendar, so "what is due this week" is known. This is the homework-sync design in `../conductor/school-sync-homework.md`.
3. **Compliance.** School Mode M2 runs the full learner model under the school's Fourth Schedule exemption. Narrow Mode M1 is the defensible D2C mode **[V via `dpdp-deep.md`]**. B2C-only Taxila would have to drop vibe and engagement modelling after 13 May 2027 or litigate.
4. **Density for referral.** One school puts 20-40 parents per class in a single WhatsApp group. Friends and classmates are the #2 discovery source (58%).

**Two offers to test, per school (§6).**

| | **A. Free for school, parent upgrades** | **B. School-paid "Lite" (LEAD band)** |
|---|---|---|
| school gets | teacher dashboard; homework practice + diagnostics for every child; weekly class report | same, paid at ₹600-1,200/pupil/yr, recovered through fees |
| parent gets | Lite free; full voice teacher at ₹299/mo or ₹2,499/yr | Lite included; voice upgrade as in A |
| school incentive | 0-15% of parent subscriptions (test 0 vs 15) | margin on the fee line; branded "AI homework teacher" |
| model result (base) | ≈11 payers per school; CAC ≈₹818/payer; LTV/CAC ≈1.3-1.5× (with or without a 15% school share) | ≈₹1.37 lakh net revenue per school-year vs ≈₹9k acquisition; contribution ≈₹83k if Lite COGS ≤ ₹30/pupil/month |
| risk | not enough payers (needs 21/school for 3×) | slow sales, price-sensitive owners, LEAD competition; Lite COGS above ₹50/pupil/month erases margin |

**Sales mechanics** (from LEAD and general APS practice; mostly [U] beyond what is cited):
- School owners buy for the next session in **January-April**.
- Parent orientation evenings and PTMs are the conversion events.
- Textbook publishers are an alternative route to schools: YoLearn and ABP Education are turning Headword/KIPS textbooks into AI tutors for 2026-27 **[S, via `india-ai-native.md`]**. DIKSHA's QR-in-textbook pattern shows the mechanism works at national scale **[S]**.
- LEAD app reviews complain about textbook-barcode registration **[V, via `india-incumbents.md`]**. Make a QR scan open the WhatsApp flow, not an account form.

### 3.4 Tuition teachers and coaching centres

- 22% of children discovered EdTech through a tuition teacher **[V, BaSE]**, and 38% of BaSE children attend paid tuition **[V]**.
- Classplus (white-label apps for tutors and coaching centres) reached ₹260 cr revenue in FY24 (2× YoY) **[S]** ([Entrackr](https://entrackr.com/tags/classplus)). Tutors adopt tools that make *them* look better.
- **This is the incumbent Taxila aims to replace, so the channel conflicts by design.** Tutors will promote Taxila only as their assistant, never as their replacement.
- Use it only as a contained experiment: "Taxila centres" in Bihar, a tutor supervising 15-30 children on Taxila, as in Squirrel AI and atama+ in `china-asia.md`. Measure whether parents later drop the human. *Reversal:* if tutor-led cells retain children at 1.5× the direct cells, the "assistant" positioning wins on economics.

### 3.5 Government programmes (DIKSHA, PM eVidya, state MoUs)

**What exists.**
- **PM eVidya** bundles four rails, claiming "nearly 25 crore school going children" **[V]** ([pmevidya.education.gov.in](https://pmevidya.education.gov.in/)):
  - DIKSHA;
  - SWAYAM;
  - SWAYAM Prabha TV ("12 dedicated TV channels one each from Class 1 to 12" via DD, Dish TV and Jio TV);
  - radio and podcasts.

  The 2022 "one class one channel" expansion to 200 channels was not re-verified **[U]**.
- **DIKSHA**'s AI is "AI-based keyword search in videos and read-aloud" **[V, PIB 3 Mar 2026]** ([PIB](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2234853&reg=3&lang=1)). Its content licences are non-commercial **[S]**. Its child reach among EdTech users is 2% **[V, BaSE]**.
- **State procurement of adaptive learning**, from ConveGenius's own list **[V, vendor]** ([impact](https://convegenius.com/impact.html)):
  - AP SwiftPAL: 1,200+ schools, 325k+ pupils, classes 6-9, tablets; "1.9 years of schooling in 17 months".
  - HP: 14,600+ schools; LEP 2.0 at "₹500 per student".
  - **Rajasthan Mission Buniyaad**: about 3,700 schools, about 5 lakh girls, ICT labs; outcomes "rose ~20%".
  - Jharkhand: 35,000 schools.
  - Uttarakhand: through AWS CSR.
- **Mindspark** runs inside Rajasthan government timetables: +0.22 SD maths and +0.20 SD Hindi after 18 months **[V, via `india-ai-native.md`]**.
- The Centre is funding an AI-for-education CoE (Bodhan AI, IIT Madras with Sarvam) and the Bharat Bodhan AI Conclave **[V/S, via `india-ai-native.md`]**. That is the path to a **free government tutor**.

**Rajasthan and UP MoUs specifically.**
- Verified this session: the Rajasthan deployments above.
- **I could not verify any named UP edtech MoU for classes 1-9 since 2024 [gap; search unavailable].**
- From memory, AP gave BYJU'S content to government pupils in 2022 alongside a state tablet purchase **[U]**. It is the cautionary case: a free MoU bought headlines, not revenue. BYJU'S is now in insolvency **[S]** ([Wikipedia](https://en.wikipedia.org/wiki/Byju's)).

**Read.**
- B2G prices sit in the same ₹500-2,100 band as APS.
- The cycle is tender-based and payment can be delayed **[U]**. The state chooses the classroom, the hardware and the timetable, not the evening at home.
- States buy on RCT evidence (ConveGenius AP, Mindspark Rajasthan).
- **Entry route:** a free, CSR- or philanthropy-funded district pilot with an independent evaluator, then a paid state programme.
- **Never** a free statewide MoU without an evaluation design.
- *Watch item:* a free DIKSHA tutor built on Bodhan AI and Sarvam would close B2G and squeeze B2C on price, not on relationship.

### 3.6 Telecom bundles

| deal | terms | tag |
|---|---|---|
| Airtel × Perplexity | free 12-month Perplexity Pro ("normally worth $200") to **360M** subscribers, exclusive, from Jul 2025 | [S] [TechCrunch](https://techcrunch.com/2025/07/17/perplexity-sees-india-as-a-shortcut-in-its-race-against-openai) |
| Jio × Google | up to 18 months of complimentary Google AI for eligible 5G/AirFiber users; Jio has 524M subscribers (Jun 2026) | [S] [Wikipedia](https://en.wikipedia.org/wiki/Jio) (feature details on the page are inconsistent; re-verify) |
| Jio × Embibe | Embibe absorbed into Jio Platforms (Apr 2025); historic school price ₹500/child/yr | [S] via `india-ai-native.md` |

**Read.**
- Telcos use AI giveaways to defend ARPU and churn, and they choose brands with global recognition.
- A bundle gives Taxila reach but brings **low-intent users who still cost compute**. A tutor's COGS is per minute of voice, unlike a search assistant.
- The right ask is not "free for 360M". It is:
  - carrier billing (charges added to the phone bill, so no UPI step);
  - zero-rated data for lesson audio, since high data cost is a 19% challenge for EdTech-using children **[V, BaSE]**;
  - a co-marketed discounted plan.
- Pursue it after about 100k payers, when Taxila has the outcome data that makes it a credible brand for the telco. Revenue-share norms were not found **[U]**.

### 3.7 Referral and word of mouth

- **The evidence that word of mouth is the main channel is strong:** friends and classmates 58%, relatives 23%, and 84% of respondents would recommend EdTech **[V, BaSE]**.
- **China's recovered winners** treat renewal and referral as the core metrics. The proposed reversal condition is a referral coefficient below 0.3 after 6 months **[`china-asia.md`]**.
- **Mechanics fitted to Indian parents and DPDP:**
  - **Share the parent's report, not the child's data.** The parent chooses to share a card ("Riya ne fractions *samajh* liye. Kaise pata? …"). It shows a first name only, no photo, no school, and an opt-in toggle.
  - **Reward both sides with one free month.** Cash rewards attract fraud and "referral farming" **[U]**. A free month costs only its COGS: ≈₹100 at base COGS, ₹65-150 across the model cases **[D]**.
  - **Use class-level social proof**, without ranking children: "12 parents in Class 5-B use Taxila".
  - **Hold an "invite your class" moment at the PTM.** In a school cell, the teacher's endorsement does the selling.
- **Model base:** about ₹220 per referred payer, the cheapest channel by roughly 2× **[A]**. *Measure:* referred payers per payer within 90 days. Target ≥0.3.

### 3.8 Hindi-belt vernacular marketing

**Evidence that Hindi-first works:**
- 98% of Indian internet users have used Indic-language content **[V, IAMAI-Kantar 2024]**.
- PW's vernacular orders grew +106% and State Boards +178% in Vishwas Diwas 2026. Its State Boards and vernacular business reached 393k enrolments and was "EBITDA positive in the first year of operations" **[V, PW letter]**.
- SpeakX's users were 70-80% Hindi speakers **[S]**.
- Seekho Jr reached 9.8M installs in 17 months with Hindi kids' videos **[V, via `india-incumbents.md`]**.

**What to do:**
1. **Speak to mothers, in Hindi, with the teacher's actual voice.** A 20-second voice note beats a banner: 140M Indians already use voice commands, 55% of them rural **[V, IAMAI]**.
2. **Run proof creatives, not promise creatives.** A real covert check on screen. "Kaise pata?" is the brand line.
3. **Use event-led selling peaks.** Use the Indian academic calendar: Vishwas Diwas-style launches before the April session; half-yearly results in October; finals in February-March. PW shows that one 3-week window yields 439.6k orders **[V]**.
4. **Make the no-sales-calls promise explicit.** Aggressive calling is the top Indian edtech complaint **[V, via `onboarding-flow.md`, `india-incumbents.md`]**. Celebrity (Dhoni for SpeakX) works for adults' aspiration **[S]**. For children's learning, the teacher and the result are the celebrity.
5. **Never target children.** From 13 May 2027, targeted advertising directed at children is unlawful even with consent **[V via `dpdp-deep.md`]**. Build all ad audiences on parents now so nothing has to be torn down.

---

## 4. Monetisation mechanics

### 4.1 Freemium vs trial vs hard paywall

| benchmark (RevenueCat, global medians) | value | tag |
|---|---|---|
| download-to-paid, day 35: hard paywall / freemium | **10.7% / 2.1%** (2026 report, 115k apps, $16B); 12.1% / 2.2% (2025) | [V] |
| year-1 retention, hard paywall vs freemium | "nearly identical" | [V] |
| trial-to-paid: 17-32 days / 5-9 days / ≤4 days | **42.5% / 37.4% / 25.5%** | [V] |
| year-1 retention: annual / monthly / weekly | **44.1% / 17.0% / 3.4%**; first annual renewal 61.7% | [V, 2025] |
| refund rate, Education | 4.86% (hard paywall 5.8%, freemium 3.4%) | [V, 2025] |
| India/SEA | **36% of plans weekly**; D60 RPI $0.11; Y1 LTV per payer $14 | [V] |

**Recommendation.**
- **No B2C free-forever tier.** The free layer is: the onboarding diagnostic, the first win, and the "Kaise pata?" summary (as designed in `onboarding-flow.md`), plus the school Lite tier in school cells.
- **Paywall after demonstrated value**, then a **14-21-day trial**.
- Test **opt-in** (no mandate) against **transparent opt-out**: a ₹1 UPI mandate, the full price shown at mandate time, a WhatsApp reminder 48 h before the first debit, and one-tap cancel.
- Kill the opt-out arm if refund or complaint rates exceed 2× the opt-in arm **[A threshold]**.
- Do not copy Seekho's ₹1 → ₹199 → ₹799 ladder. Its reviews are an Indian trust tax **[V]**.

### 4.2 Payments: UPI Autopay, cards, Play billing

| rail | rule | tag |
|---|---|---|
| UPI Autopay mandate | creation up to **₹1,00,000**; **frictionless debits ≤ ₹15,000** (all merchants; ₹1 lakh for BFSI only); "1 Rupee Registrations"; 60+ UPI apps; pre-debit notification; retries ("8% more debit collections") | [V, Razorpay docs](https://razorpay-881012b3.mintlify.app/docs/payments/subscriptions/supported-payment-methods.md), [product page](https://razorpay.com/upi-autopay/) |
| NPCI controls from 1 Aug 2025 | "a regulated processing window for autopay mandate scheduling", plus API caps | [S, Wikipedia UPI](https://en.wikipedia.org/wiki/Unified_Payments_Interface); exact windows [U] |
| cards (e-mandate) | debit raised **24 h in advance** with a bank pre-debit notice; ≤ ₹15,000 auto; above ₹15,000 needs extra authentication per debit (link valid 72 h) | [V, Razorpay FAQ](https://razorpay-881012b3.mintlify.app/docs/payments/subscriptions/faqs.md) |
| Google Play billing | **15%** on auto-renewing subscriptions outside the listed markets | [V](https://support.google.com/googleplay/android-developer/answer/112622) |
| Play user-choice billing (India) | service fee "reduced by 4%" when the user picks an alternative billing system | [V](https://support.google.com/googleplay/android-developer/answer/13821247) |
| UPI scale | 241.62B transactions in FY26 | [S, Wikipedia] |

**Read.**
- Both price points (₹299/mo, ₹2,499/yr) sit far below ₹15,000, so renewals need no parent action. Churn becomes an active cancel, not a failed payment.
- **Margin lever:** taking payment through a web checkout reached from the parent's WhatsApp, outside the app, at ≈2% instead of 15% raises base LTV from ₹1,099 to ₹1,267 (+15%) **[D, model]**.
- Whether Play policy permits this for a subscription consumed in an Android app must be confirmed with counsel before launch **[U]**. Fallback: Play user-choice billing at 11% plus gateway.
- **Price architecture:** lead with the **annual ₹2,499**, offered at exam-results moments. Annual plans keep 44% vs 17% at year 1 (globally) and turn CAC payback into day-1 cash, which is probably SpeakX's "one-day payback". Keep ₹299 monthly as the low-commitment door.

---

## 5. Unit economics (from `gtm_funnel_model.py`; all non-[V] inputs are [A])

**LTV per payer, contribution after GST (18%), fees and COGS** **[D/A]**:

| case | paid months (monthly plan) | monthly-plan LTV | annual-plan LTV | blended (web UPI) | blended (Play 15%) |
|---|---|---|---|---|---|
| pessimistic (60% COGS, 38%→16% churn) | 3.5 | ₹347 | ₹1,270 | **₹532** | ₹461 |
| **base** (40% COGS, 30%→12% churn, 35% annual) | 5.0 | ₹752 | ₹2,222 | **₹1,267** | ₹1,099 |
| optimistic (25% COGS, 22%→8% churn) | 8.3 | ₹1,540 | ₹3,285 | **₹2,413** | ₹2,092 |

The base case's gross revenue on the monthly plan (₹1,509) sits close to RevenueCat's IN/SEA Y1 LTV of ₹1,344 **[V]**, which is a sanity check.

**CAC by channel, ₹ per payer** **[A; the break-even is the useful output]**:

| channel | optimistic | **base** | pessimistic | conversion needed for CAC ≤ ₹422 (3×) |
|---|---|---|---|---|
| paid social → app (CPI ₹25 / 40 / 80) | 312 | **1,000** | 4,000 | **9.5%** install → payer |
| CTWA → WhatsApp diagnostic → app (₹10 / 20 / 40 per conversation) | 100 | **333** | 1,333 | 4.7% conversation → payer |
| school-seeded, parent pays (₹6k / 9k / 18k per school) | 333 | **818** | 3,000 | **21 payers per school** |
| YouTube creator integration (₹15k / 40k / 1L) | 250 | **1,600** | 12,500 | — |
| parent referral (free month both sides) | 150 | **220** | 350 | — |
| school-paid Lite (per school-year) | contribution ₹2.25 lakh | **₹83k** | ₹1k | Lite COGS must stay ≤ ₹30/pupil/month |

**What the model says.**
1. **Paid installs only work with a hard paywall and India-beating conversion.** Use them for geo-density and retargeting, capped at 15% of the acquisition budget.
2. **CTWA is the best paid channel on paper**, because the 72 h window lets the diagnostic do the selling. But no Indian benchmark was found, so it is the first number to measure.
3. **School-seeded parent-pay is roughly break-even at 1.5× on parent revenue alone.** It becomes strongly positive only if:
   - schools pay for Lite (Offer B); or
   - school-anchored usage lowers churn (the 23% "mandated" effect); or
   - each school seeds referrals beyond its own pupils.

   This is exactly what the pilot must measure.
4. **Referral is the cheapest payer by far, and the weekly report drives it.** So the report is a growth feature, not just a retention one.

---

## 6. Recommended GTM wedge

### 6.1 The wedge

**School-seeded, parent-paid, carried on WhatsApp, in mid-fee affordable private schools in Lucknow-Kanpur (UP). Start with classes 4-8 maths and science in Hinglish voice.**

| choice | why | reversal condition |
|---|---|---|
| **UP first** | 1,07,905 private unaided schools (32% of India's), 49% private share, 33.5M K-9 children, high tuition spend (`market-size.md`) | UP school sign rate below 15% of qualified visits after 60 visits → move the school cell to Rajasthan (6M private-school children, fewer tuition-takers) |
| **mid-fee APS (₹500-2,000/month fees)** | smartphone access 74-87% (vs 64% below ₹500); ₹299 is 15-60% of the fee, not 60-150% | conversion in the ₹500-1,000 band within 30% of the ₹1,000-2,000 band → widen downward |
| **classes 4-8, maths and science** | maths and science are the top EdTech subjects (74% and 57%, BaSE); access 67-74%; covert understanding checks are most legible in maths; PW is strongest from class 9 | if 1-3 parents ask more (reading and fluency), add the ORF track sooner |
| **parent-paid, school-seeded** | school = 63% discovery + 23% "mandated" retention + DPDP School Mode; parent pays for the voice teacher, whose COGS a school price cannot carry | Offer B (school-paid Lite) beats Offer A on contribution per school-year by more than 1.5× → lead with B |
| **WhatsApp as the carrier** | 67% of child EdTech users and 61% of teachers already use it; utility messages cost ₹0.136; it carries the free diagnostic, the reports, billing and referral | Meta raises India utility pricing above ₹1, or bans AI-generated reports → move reports in-app, with SMS for alerts |

**Supporting cell.** Patna (Bihar) runs direct to parent: an owned Hindi YouTube channel plus CTWA to mothers, with the same diagnostic, trial and price.
- Bihar has the highest tuition incidence (~60%) and few recognised private schools. It is the "replace the tutor" market (`market-size.md`).
- Compare its CAC and month-3 retention with the UP school cell.

### 6.2 Timeline (today is 2026-10-02)

| when | what | gate |
|---|---|---|
| Oct-Nov 2026 | sign **20 pilot schools** (Lucknow, Kanpur), ~3,600 pupils; 10 on Offer A, 10 on Offer B priced at ₹600-900 for the pilot year; launch the Patna direct cell with a ₹2-3 lakh CTWA + YouTube test | LOIs signed; WhatsApp WABA in INR billing (deadline 31 Dec 2026) |
| Nov 2026-Mar 2027 | run through half-yearly-to-final exams; weekly reports; referral loop on; opt-in vs opt-out trial A/B | KPIs in §6.3 |
| Jan-Apr 2027 | sell session 2027-28 to 150-300 schools with pilot data; event-led launch before 1 April | pilot KPIs met |
| **13 May 2027** | DPDP s.9 in force: School Mode M2 in school cells; Narrow Mode M1 for D2C | `dpdp-deep.md` |
| 2027-28 | independent outcome study (matched classes) → B2G pilot proposal (Rajasthan or UP district, CSR-funded) | an effect ≥0.2 SD in a term, the Mindspark bar |
| at ~100k payers | telco conversation (carrier billing, zero-rating, co-marketing) | outcome data published |

### 6.3 Pilot KPIs and kill criteria (all [A], to be replaced by measurements)

| stage | target | kill or redirect if |
|---|---|---|
| school sign rate (qualified visits) | ≥ 25% | < 15% after 60 visits |
| parent activation (diagnostic done within 14 days of the school push) | ≥ 40% of eligible pupils | < 20% |
| trial start (of activated) | ≥ 40% | < 20% |
| trial → paid | ≥ 30% (RevenueCat 17-32 days: 42.5%) | < 15% |
| payers per school (Offer A) | ≥ 15 (LTV/CAC ≈ 2×) | < 7 (below 1×) |
| month-3 paid retention | ≥ 40% (SpeakX ~30-35%) | < 25% |
| referred payers per payer (90 days) | ≥ 0.3 | < 0.1 |
| CTWA conversation → payer (Patna) | ≥ 4.7% | < 2% |
| Lite COGS per pupil-month | ≤ ₹30 | > ₹50 |
| learning (pre/post vs matched classes) | ≥ 0.2 SD in a term | no difference at term end → fix the product before any scale-up |

### 6.4 What the wedge is *not*

- Not a national app-install campaign. The model and Seekho/Doubtnut say no.
- Not a free statewide government MoU (the BYJU'S/AP pattern).
- Not a telco giveaway.
- Not open-ended tutoring on WhatsApp (policy).
- Not "replace your teacher" messaging inside schools. Channel partners will not promote their own replacement. To schools it is "an AI homework teacher who reports to you". To parents it is "tuition-quality help at home, with proof".

---

## 7. Risks and what would change the recommendation

| risk | likelihood (12 mo) | effect on GTM | early signal | response |
|---|---|---|---|---|
| PW folds its Socratic AI Tutor into CuriousJr at "₹10/day", sold through a 142M community | high **[U]** | B2C price ceiling; Patna cell CAC rises | PW Q2 FY27 letter, app changelog | lean on school cells and the evidence report; PW has said it will not run schools **[V via `india-ai-native.md`]** |
| LEAD extends Ms Curie to maths and science, Hindi, at home | medium | APS channel competition at ₹943 | LEAD press, school churn | partner offer: Taxila as LEAD schools' at-home voice layer |
| free government tutor (Bodhan AI / AskDIKSHA) | medium over 24 mo | B2G closes; parents anchor on ₹0 | MoE launch | compete on the relationship and the weekly proof, not access |
| WhatsApp re-prices or reclassifies AI-written reports | ~40% (S7 in `bigtech.md`) | parent channel cost ×7.5 if marketing | Meta changelog | keep reports factual and utility; have the in-app inbox and SMS fallback ready |
| Play blocks web-paid subscriptions | medium **[U]** | −13% margin | Play policy review | user-choice billing (11% + gateway) |
| school owners demand payment to promote (kickbacks) | medium **[U]** | CAC per school doubles | pilot sales notes | cap the revenue share; prefer Offer B, where the school earns via fees transparently |
| child-directed marketing found in the funnel after May 2027 | low if designed now | ₹200 cr exposure (s.9) | audit of audiences | parent-only audiences from day one |

---

## 8. Gaps and the measurements that close them

| gap | why it matters | how to close |
|---|---|---|
| CTWA cost per conversation and conversion, India K-12 | the best paid channel on paper; unmeasured | ₹2-3 lakh Patna test, 4 creatives, pin-code targeting (§6.2) |
| named Rajasthan/UP edtech MoUs since 2024; procurement terms and payment cycles | the B2G route and price | rerun with search; RTI or the Samagra Shiksha PAB minutes for ICT lines **[U]** |
| YouTube creator rates (Hindi K-8, 100k-1M subscribers) | creator channel CAC | 5 quotes plus one tracked integration |
| school sign rate and revenue-share expectations in UP APS | Offer A vs B | 60 qualified visits in Oct-Nov 2026 |
| exact NPCI autopay execution windows (Aug 2025) | billing-run scheduling | NPCI circular via the PA (Razorpay or Cashfree account manager) |
| Play policy on web-purchased subscriptions used in-app (India) | 13-point margin | Play policy counsel |
| telco revenue-share norms for bundled consumer apps | the phase-3 channel | Jio or Airtel partnerships desk, after traction |
| Google's Jio AI bundle (current terms) | competitive free AI in parents' hands | re-verify at Reliance or Google primary sources |

---

## 9. Sources

**Primary, read this session [V]**
- BaSE 2025 (Central Square Foundation), Figs. 13-15, Table A1.2.5, executive summary: https://www.edtechbase.centralsquarefoundation.org/BaSE%20Report%202025.pdf
- PhysicsWallah Q4 FY26 shareholder letter (marketing ₹354 cr, 142M community, Vishwas Diwas, 91% online, State Boards/vernacular 393k): https://www.medianama.com/wp-content/uploads/2026/05/PhysicsWallah-Q4-shareholder-letter.pdf
- IAMAI-Kantar *Internet in India 2024* (ICUBE): https://www.iamai.in/sites/default/files/research/Kantar_%20IAMAI%20report_2024_.pdf
- UDISE+ 2025-26 booklet, Table 3.5 (private unaided schools by state): https://dashboard.udiseplus.gov.in/report2026/static/media/UDISE+2025_26_Booklet_existing.edd7cd16d934a10377ba.pdf
- CSF, *State of the Sector Report: Private Schools in India* (2020): https://www.centralsquarefoundation.org/State-of-the-Sector-Report-on-Private-Schools-in-India.pdf
- Meta WhatsApp pricing: https://developers.facebook.com/docs/whatsapp/pricing/
- Meta per-user marketing template limits: https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/marketing-templates/per-user-limits/
- RevenueCat *State of Subscription Apps 2026*: https://www.revenuecat.com/state-of-subscription-apps/ ; 2025 edition: https://www.revenuecat.com/state-of-subscription-apps-2025/
- Razorpay Subscriptions, supported methods and FAQ (UPI Autopay and card limits, pre-debit): https://razorpay-881012b3.mintlify.app/docs/payments/subscriptions/supported-payment-methods.md ; https://razorpay-881012b3.mintlify.app/docs/payments/subscriptions/faqs.md ; https://razorpay.com/upi-autopay/
- Google Play service fees: https://support.google.com/googleplay/android-developer/answer/112622 ; India user-choice billing: https://support.google.com/googleplay/android-developer/answer/13821247
- PM eVidya: https://pmevidya.education.gov.in/
- PIB, AI in education (3 Mar 2026): https://www.pib.gov.in/PressReleasePage.aspx?PRID=2234853&reg=3&lang=1
- ConveGenius state deployments (vendor): https://convegenius.com/impact.html
- Rocket Learning (vendor): https://rocketlearning.org/
- YouTube channel headers (snapshot script, `yt-channels-2026-10-02.json`): https://www.youtube.com/@MagnetBrainsEducation/about , https://www.youtube.com/@DearSir/about , https://www.youtube.com/@PhysicsWallah/about , https://www.youtube.com/@PW-Foundation/about , https://www.youtube.com/@PWLittleChamps/about , https://www.youtube.com/@KhanAcademyHindi/about (and others in the JSON)

**Secondary [S]**
- WhatsApp India rates: https://whautomate.com/whatsapp-business-api-pricing-india ; https://360dialog.com/blog/whatsapp-service-message-charging-october-2026/
- WhatsApp general-purpose AI chatbot ban: https://respond.io/blog/whatsapp-general-purpose-chatbots-ban
- Seekho FY25: https://entrackr.com/fintrackr/seekho-spends-rs-134-cr-on-advertising-for-rs-142-cr-revenue-in-fy25-11205187
- Cuemath FY24: https://entrackr.com/fintrackr/google-funded-cuemath-posts-flat-revenue-in-fy24-shrinks-losses-by-43-7452541
- Unacademy FY25 (₹826 cr income, ₹305 cr EBITDA loss): https://entrackr.com/exclusive/exclusive-unacademy-narrows-ebitda-losses-by-38-in-fy25-reports-rs-826-cr-income-10513191
- Classplus FY24: https://entrackr.com/tags/classplus
- Airtel × Perplexity: https://techcrunch.com/2025/07/17/perplexity-sees-india-as-a-shortcut-in-its-race-against-openai
- Jio subscribers and the Google bundle: https://en.wikipedia.org/wiki/Jio
- UPI volumes and NPCI Aug 2025 controls: https://en.wikipedia.org/wiki/Unified_Payments_Interface
- PhysicsWallah history: https://en.wikipedia.org/wiki/Physics_Wallah ; BYJU'S: https://en.wikipedia.org/wiki/Byju's
- Earlier Taxila files (each with its own sources): `market-size.md`, `india-incumbents.md` (LEAD, Seekho reviews, Doubtnut), `india-ai-native.md` (SpeakX, ConveGenius, Mindspark, Embibe/Jio, Bodhan AI), `china-asia.md` (Gaotu), `bigtech.md` (WhatsApp pre-teen accounts, the S7 risk), `../safety/dpdp-deep.md` (s.9(3), Fourth Schedule), `../design/parent-experience.md`, `../design/onboarding-flow.md`

**Scripts and data (this directory)**
- `yt_channels_snapshot.py` → `yt-channels-2026-10-02.json`
- `gtm_funnel_model.py` → `gtm-funnel-model-2026-10-02.json`

## Fact-check

Adversarial pass, 2026-10-02. Primary PDFs were downloaded and text-searched (BaSE 2025, PW Q4 FY26 letter, UDISE+ 2025-26, CSF 2020, IAMAI-Kantar 2024); other pages were fetched live. YouTube cannot be re-fetched live from this environment, so claim 10 rests on the dated snapshot JSON.

| # | Claim (short) | Verdict | Corrected value / caveat | Source |
|---|---|---|---|---|
| 1 | BaSE discovery: school 63, friends 58, relatives 23, tuition 22, self 10, ads/news 6, govt 4; 23% mandated | **Supported** | All figures match Fig. 14 and the drivers text (N=7,866). Add: "community influencer" is 7%, above ads. Sample is low-resource settings, not all India. | [BaSE 2025](https://www.edtechbase.centralsquarefoundation.org/BaSE%20Report%202025.pdf) |
| 2 | Child tools YouTube 94, WhatsApp 67, Google 49, EdTech app 6, DIKSHA 2; teachers (N=2,186) YouTube 61, WhatsApp 61, DIKSHA 21 | **Supported** | Exact match (Fig. 13, Fig. 19). Google among teachers is 56%. GenAI is a second tier: ChatGPT 8%, WhatsApp AI/Meta AI 14%. | same |
| 3 | PW FY26: marketing 354 cr = 9% of 3,900 cr; ~₹663/paid user; 142M community; 91% online; YouTube +58%; Vishwas Diwas 439.6k orders, 205 cr, vernacular +106%, State Boards +178% | **Supported** | All figures confirmed in the shareholder letter. 354/5.34M = ₹663 is correct but is the whole-company marketing line divided by all paid users, offline included. 142M is "total subscribers", not learners. Vishwas Diwas window is 3 weeks from 28 Feb 2026. | [PW Q4 FY26 letter](https://www.medianama.com/wp-content/uploads/2026/05/PhysicsWallah-Q4-shareholder-letter.pdf) |
| 4 | Seekho ₹134.2 cr ads on ₹141.5 cr (95%); Cuemath ₹2 per ₹1 revenue in FY24 | **Partly** | Seekho confirmed (94.8%). Cuemath is wrong as an ad figure: Entrackr's ₹2 is TOTAL expenses (₹252.6 cr) per ₹1 of operating revenue (₹126.4 cr). No marketing line is disclosed there. Do not cite Cuemath as ad burn. | [Seekho](https://entrackr.com/fintrackr/seekho-spends-rs-134-cr-on-advertising-for-rs-142-cr-revenue-in-fy25-11205187) ; [Cuemath](https://entrackr.com/fintrackr/google-funded-cuemath-posts-flat-revenue-in-fy24-shrinks-losses-by-43-7452541) |
| 5 | RevenueCat 2026: 115k apps; D35 10.7% vs 2.1%; trial 42.5% vs 25.5%; IN/SEA LTV $14, D60 RPI $0.11 | **Supported, one wording fix** | Report says "17+ days" (not "17-32"); "4 days or less" is not the exact comparator wording in the summary I could fetch, treat 25.5% as the short-trial figure. $14 is "realised LTV per payer after year one" (global $23, NA $32). $0.11 matches. | [RevenueCat](https://www.revenuecat.com/state-of-subscription-apps/) |
| 6 | Model: ₹1,267 LTV, ₹422 ceiling, 9.5% / 4.7% / 21 payers (base 11) | **Partly** | Arithmetic reproduces from `gtm-funnel-model-2026-10-02.json` (40/422 = 9.5%; 20/422 = 4.7%; 9,000/422 = 21.3; 9,000/818 = 11). But it is a model on assumed retention, not evidence. Its base gross LTV (₹1,509 on the monthly plan) is 12% above the RevenueCat IN/SEA realised ₹1,344, so the base case is mildly optimistic against the only external benchmark. Label every output [D]. | `gtm_funnel_model.py` |
| 7 | WhatsApp India from 1 Oct 2026: marketing ₹0.8631; utility/auth/service ₹0.115 (service after 1,000 free per number); +18% GST; CTWA 72h free | **Supported (S for rates)** | Rates and the 1,000 free/number match whautomate; 360dialog confirms the 1 Oct 2026 service charging and the 72h free entry point (its India figure is $0.0014 ≈ ₹0.115). Meta's own page confirms per-message billing and the 72h window but did not show INR rates in the fetch. Whautomate says utility inside the 24h window becomes billable; Meta's page says utility templates in-window are free. Conflict unresolved, budget conservatively. BSP markups of 10-30% are extra. | [Meta](https://developers.facebook.com/docs/whatsapp/pricing/) ; [whautomate](https://whautomate.com/whatsapp-business-api-pricing-india) ; [360dialog](https://360dialog.com/blog/whatsapp-service-message-charging-october-2026/) |
| 8 | General-purpose AI chatbot ban from 15 Jan 2026; AI in support role allowed; per-user limits (131049) apply in India | **Supported, conclusion is inference** | Ban: new users 15 Oct 2025, existing users 15 Jan 2026; allowed uses confirmed; test is "ancillary to a legitimate business service". Per-user limits: exemptions are EEA, UK, Japan, South Korea, India not exempt; limits use a "dynamic view" of recent marketing read rate. The step "so WhatsApp cannot carry open-ended tutoring" is the author's reading, not Meta's text; a tutor that is the centrepiece of the interaction is the risky case. Get Meta/BSP written confirmation. | [respond.io](https://respond.io/blog/whatsapp-general-purpose-chatbots-ban) ; [Meta limits](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/marketing-templates/per-user-limits/) |
| 9 | 3,41,689 private unaided schools; 1,07,905 in UP (32%); ~205 K-9 pupils each; 70% pay < ₹1,000, 45.5% < ₹500 | **Supported, dated fee data** | Counts confirmed (UDISE+ 2025-26: 341,689; UP 107,905 = 31.6%). Enrolment 98.86M all levels = 289/school; the 205 figure needs ~70.1M, roughly classes 1-9 (63.0M classes 1-8 plus about half of the 13.7M class 9-10), so label it "classes 1-9", not "K-9" (pre-primary 10.6M is excluded). Fee shares are from the 2020 CSF report using 2019 NSS and UDISE data, so nominal ₹ thresholds are about 6 years old. | [UDISE+](https://dashboard.udiseplus.gov.in/report2026/static/media/UDISE+2025_26_Booklet_existing.edd7cd16d934a10377ba.pdf) ; [CSF](https://www.centralsquarefoundation.org/State-of-the-Sector-Report-on-Private-Schools-in-India.pdf) |
| 10 | Proven prices: LEAD ~₹943, Embibe ₹500, ConveGenius ₹500-₹2,100; AP SwiftPAL 325k; Mission Buniyaad ~5 lakh; "states buy on RCT evidence" | **Partly** | ConveGenius page confirms ₹500 (HP), 325,000+ AP students, ~500,000 girls in Rajasthan, and a Kremer-led RCT; the ₹1,700-2,100 range was not on the cited page (earlier file attributes it to a vendor page, unverified here). LEAD ₹943 is derived (₹386.6 cr / 41 lakh) and is NOT a software price: ~71% of LEAD revenue is products (books, devices); LEAD says "nearly 4M students, 8,500+ schools" (press release), not 9,000+. 100% NRR is self-reported. Embibe ₹500 is an "as low as" 2023 figure; industry average quoted as ₹3,000-4,000. "Proven" overstates vendor claims; "states buy on RCT evidence" is one RCT (AP) generalised. | [ConveGenius](https://convegenius.com/impact.html) ; [LEAD/The Wire](https://m.thewire.in/article/ptiprnews/lead-group-achieves-ebitda-breakeven-secures-arr-of-rs-415-cr-for-ay-25-26) |
| 11 | Hindi K-9 YouTube saturated: Dear Sir 22.8M, Magnet Brains 14.5M (61K videos), PW Foundation 6.75M, PW Little Champs 1.3M; Khan Academy Hindi 68.6K | **Supported (snapshot only)** | Numbers match `yt-channels-2026-10-02.json`; live re-fetch blocked, so unverified independently. "Hindi K-9" is interpretive: Dear Sir and Magnet Brains are broad school channels, and PW Foundation is mostly class 9-12 / exam prep; only Little Champs is strictly 6-8. | `yt_channels_snapshot.py` |
| 12 | UPI Autopay ₹1,00,000 mandate, ≤₹15,000 frictionless, ₹1 registration, pre-debit, retries; cards 24h pre-debit, AFA above ₹15,000; Play 15% subs; India user-choice -4 pts | **Supported with fixes** | Razorpay: mandate ₹1,00,000; frictionless ₹15,000 generally (₹1,00,000 only for BFSI/certain MCCs, education is not among them); ₹1 is "typically". Cards: debit initiated 24h ahead, AFA above ₹15,000. Google: 15% applies to auto-renewing subscriptions; India alternative billing reduces fee by 4 points (so about 11%), and the cut is for alternative billing, not a Play-billing discount. Fee page has regional variants (10%+5% in EEA/UK/US/AU/JP), so re-check before launch. | [Razorpay methods](https://razorpay-881012b3.mintlify.app/docs/payments/subscriptions/supported-payment-methods.md) ; [FAQ](https://razorpay-881012b3.mintlify.app/docs/payments/subscriptions/faqs.md) ; [Play fees](https://support.google.com/googleplay/android-developer/answer/112622) ; [UCB India](https://support.google.com/googleplay/android-developer/answer/13821247) |
| 13 | From 13 May 2027 s.9(3) bans tracking/behavioural monitoring/targeted ads to children, consent does not lift it; educational institutions exempt (Fourth Schedule) so school-processor mode is defensible; ads must target parents/teachers | **Partly** | Date: 18 months after 13 Nov 2025 gazette = 13 May 2027 (some trackers say 14 May); a MeitY proposal to compress some timelines was reported and should be re-checked. Exemption is for the educational institution as fiduciary, limited to tracking/monitoring "for educational activities" or child safety; it does not exempt targeted advertising and does not cover a direct-to-parent B2C app unless it qualifies as an institution (contested in `dpdp-deep.md`). "Defensible" is a legal opinion, not a verified fact; needs counsel. | [Fourth Schedule](https://dpdprules.org/rules/fourth-schedule) ; `../safety/dpdp-deep.md` |
| 14 | Airtel gave Perplexity Pro free 12 months to 360M; Jio 524M subs and Google AI bundle; Embibe absorbed into Jio Platforms Apr 2025; no telco rev-share terms found | **Partly** | Airtel 360M and 12 months confirmed, deal is exclusive in India and no revenue share was disclosed. Jio 524M (Jun 2026) confirmed; the Google bundle is Google One AI Premium/Gemini for "up to 18 months" to eligible 5G/AirFiber users, not the whole base. Embibe: April 2025 reports say Jio Platforms is to fully fold it in, due diligence ongoing, ~300 layoffs; "absorbed" is reported intent, completion not confirmed here. The exclusivity clause matters: a second telco cannot offer Perplexity, which suggests telco bundles are exclusive and global-brand led. | [TechCrunch](https://techcrunch.com/2025/07/17/perplexity-sees-india-as-a-shortcut-in-its-race-against-openai) ; [Jio](https://en.wikipedia.org/wiki/Jio) ; [YourStory](https://yourstory.com/2025/04/jio-platforms-fully-fold-majority-owned-edtech-embibe-ril) |
| 15 | 98% of 886M internet users (870M) used Indic languages in 2024; 57% of urban users prefer Indic content; 140M voice users, 55% rural | **Supported** | Report text: "870 Million internet users (98%)", "57% ... prefer accessing internet content in Indic languages in Urban India" (chart: Indic 57% vs English 43%), voice users 140M with a 55% figure on the voice-users chart (rural share, labelled by the chart column; read from layout text). Note the 98% base is 886M active users; 842M is the Indic-user count on the chart. | [IAMAI-Kantar](https://www.iamai.in/sites/default/files/research/Kantar_%20IAMAI%20report_2024_.pdf) |

**Net effect on the thesis:** nothing here overturns the GTM direction (school and friend referral lead discovery; paid social is not the engine). Fix before citing: drop Cuemath as ad burn, do not call LEAD's ₹943 a software price, soften "Embibe absorbed" and "proven" prices, and label the funnel model's base LTV as above the RevenueCat benchmark.
