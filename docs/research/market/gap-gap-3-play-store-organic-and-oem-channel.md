# Gap 3: the Play Store organic channel, the device-preload channel, and the Play-policy limit on web-UPI checkout

Date: 2026-10-02.
Scope: the channel that no market report covers. Grepping the corpus for ASO, organic install, Play search, OEM and
preinstall returns nothing, yet Taxila ships an Android app and the whole funnel assumes web or WhatsApp UPI checkout
(MARKET-THESIS §7.2, Q9).

**Tags**
- **[V]**: verified at the primary source, fetched today.
- **[S]**: secondary source (press or aggregator).
- **[U]**: unverified, or from memory.
- **[M]**: measured in this session by a script in this folder.
- **[D]**: derived from tagged inputs.
- **[A]**: assumption.

**Data files** (all in this folder)
- `gap3_play_search.py` → `gap3-play-search-2026-10-02.json`: the top 30 Play results per query, pulled with
  google-play-scraper using country=in and lang=en/hi.
- `gap3_play_summary.py` → `gap3-play-search-summary-2026-10-02.json`.
- `gap3_trends.py` and `gap3_trends_b.py` → `gap3-trends-2026-10-02.json` and `gap3-trends-b-2026-10-02.json`.
  These are Google Trends indices for **web** search in India, 2024-01-01 to 2026-09-30, pulled with pytrends.
- `gap3_channel_model.py` → `gap3-channel-model-2026-10-02.json`.

**Method limits.** Google publishes no Play-search volume data, and Trends measures web search, not Play search. So
query demand below is a proxy: how large the top incumbents are, plus relative web interest. It is not an absolute
query count. The scraper sees the store as a logged-out user in India. It cannot see the Kids tab.

---

## 0. Answers (read this first)

1. **Policy constraint on the web-UPI plan: allowed, but only as a consumption-only app.** The app must not sell or
   point to the sale [V].
   - Google's Payments-policy FAQ: "Google Play allows any app to be consumption-only, even if it is part of a paid
     service… a user could log in when the app opens and access content paid for somewhere else." Also: "Outside of
     your app, you are free to communicate with your users about alternative purchase options" (email, and by
     extension WhatsApp) [V].
   - Inside the app, the rule is: **no link, no button, no webview checkout, no price-bearing call to action, and no
     sign-up flow that leads to payment.** A consumption-only app may show unlinked text such as "Go to our website to
     upgrade your subscription to Premium" [V].
   - The **in-app "Pay on web" link is NOT allowed in India.** The new billing-choice program, which allows external
     web links at a 10% fee on subscriptions, covers only AU, JP, UK, EEA and US. India is not listed as of
     2026-10-02 [V].
   - India's only in-app alternative is **user choice billing (UCB)** [V]:
     - Taxila's own UPI (an embedded webview is allowed) shown *alongside* Play Billing;
     - a service fee of 15% − 4 = **11% on subscriptions**, plus the gateway fee (Razorpay about 2.36%), ≈ 13.4% in
       all;
     - transactions must be reported within 24 h.
   - UCB saves only about 1.6 points against Play's 15%. Consumption-only saves about 12.6 points.
   - Regulatory risk is live:
     - CCI's March 2024 prima-facie order called the free ride for consumption-only apps "not reasonable" [S];
     - the Supreme Court admitted cross-appeals in August 2025 [S].
     - So the 0% consumption-only path could later carry a fee. Model the base case at 0% and the downside at 11%.
2. **Organic Play does not get a phase-1 cell.** It gets a zero-budget hygiene item, plus one instrumented metric.
   - Year-1 estimate [D, model]: **~8k–62k organic installs → ~27–830 payers, base ~170.** That is 0.3–8% of the
     10k target.
   - Marginal CAC: **₹300–9,200, base ~₹1,500.** That is above the ₹316–344 LTV/CAC ceiling, except in the high case.
   - The wedge queries are owned by ad-funded "NCERT solutions" apps. The searchers want answers, not tutors.
   - Web interest in "ncert solutions" fell ~45% in two years while "chatgpt" rose 3.7× [M].
3. **Preload does not get a phase-1 cell.** Defer it with the telco item (at ~100k payers).
   - Modelled CAC on a per-device fee: **~₹15k–57k per payer, with a best-case bound of ~₹3.7k** [D]. That is 10–170×
     the ceiling.
   - The obvious slots are closed or shrinking:
     - Jio folded its own edtech, Embibe, into Jio Platforms (April 2025) [S];
     - Lava now sells "zero bloatware" as a feature (2025–26) [S];
     - the one Indian edtech preload precedent (Lava × Doubtnut, February 2023) was a **free one-year subscription**
       bundle, which gives the revenue away [S].
   - The cheap adjacent move is a **free Indus Appstore listing**: 0% commission on payments, any payment method,
     100M+ devices claimed [S].

---

## 1. Play search: demand and competition for the wedge keywords [M]

The top 30 results per query (fewer when Play returns fewer), pulled 2026-10-02 with country=in. Install counts are
Play's lower-bound buckets.

| query (lang=en) | n | median installs | ≥ 1M | ≥ 10M | < 100k | mean ★ | answer/notes/book titles | AI/tutor titles |
|---|---|---|---|---|---|---|---|---|
| class 5 maths | 30 | 50k | 6 | 3 | 18 | 4.03 | 10 | 0 |
| kaksha 6 vigyan | 30 | 50k | 2 | 0 | 20 | 4.24 | 19 | 1 |
| कक्षा 6 विज्ञान (Devanagari) | 10 | 10k | 0 | 0 | 9 | 4.17 | 7 | 0 |
| NCERT solutions class 7 | 18 | 100k | 4 | 1 | 7 | 4.25 | 18 | 0 |
| hindi medium class 8 | 12 | 100k | 1 | 0 | 5 | 4.21 | 12 | 0 |
| AI teacher Hindi | 30 | 10k | 8 | 2 | 20 | 4.16 | 0 | 29 |
| tuition app | 30 | 100k | 11 | 3 | 13 | 4.31 | 0 | 12 |
| ai tutor | 30 | 1M | 19 | 6 | 7 | 4.48 | 0 | 28 |

Reading the table:

- **Class- and subject-specific Hindi queries are long-tail and lightly defended.**
  - Each query is owned by solution/notes apps with 10k–1M installs:
    - Tiwari Academy (`immwit.tiwari.class6sciencehindi`, 100k+; `imm.tiwariacademy.maths8hindi`, 500k+);
    - EduRev class apps (1M+ each);
    - `com.class8.ncertsolutionhindi` (1M+).
  - Play returned **only 10–12 results** for the Devanagari and "hindi medium" queries. That points to thin inventory
    and weak matching, not strong competition.
  - A well-built Hindi listing can plausibly rank in the top 5 on many of these queries [A]. But each query's
    lifetime pool is small:
    - the #1 app in a class×subject slot has 100k–1M installs, accrued over years;
    - that is roughly **1–15k installs a month per slot** [D, assuming 5–8 years of accrual].
- **The intent is answer-seeking.**
  - 10–19 of the top 30 titles in the curriculum queries are "solutions / notes / book / guide" apps;
  - **no K-8 Hindi voice tutor appears in any curriculum query.**
  - These users want the answer to exercise 4.2 tonight. That is the population RevenueCat's IN/SEA median (0.7%
    D35 download-to-paid) describes, or worse [V, RevenueCat 2026].
- **"AI teacher Hindi" is a vacant slot with no demand signal.**
  - 29 of 30 results are generic AI chat or language-learning apps (Supernova, Talkpal, Mondly, assorted "AI Teacher"
    clones at 1k–10k).
  - The only scaled K-12 items are CK-12 Flexi (5M+), Teachmint (10M+, a teacher tool) and Professor Curious (1M+).
  - Holding the top spot here is cheap, and probably worth little: Trends puts "ai teacher" at an index of 1–3 (below).
- **"tuition app" is a supply-side query.**
  - The results are mostly tutor-management and tutor-marketplace apps (UrbanPro for Tutors, Classplus, TCMS) plus the
    giants (BYJU'S 100M+, Vedantu 50M+, PW CuriousJr 5M+).
  - It is not a parent-demand query worth chasing.
- **"ai tutor" (English) is crowded with global players**:
  - Brainly 100M+;
  - Nerd AI 10M+;
  - Praktika 10M+;
  - Buddy.ai 50M+;
  - median 1M.
  - This is not winnable organically in year 1 [D].

## 2. Google Trends (web search, India, 2024-01 → 2026-09) [M]

**Regional mix**, set A. In a multi-term Trends request, each state's values are that state's split across the
terms.

| state | class 5 maths | ncert solutions | tuition | ai teacher | kaksha 6 vigyan |
|---|---|---|---|---|---|
| Uttar Pradesh | 9 | **72** | 18 | 1 | 0 |
| Bihar | 10 | 69 | 20 | 1 | 0 |
| Madhya Pradesh | 19 | 67 | 12 | 1 | 1 |
| Rajasthan | 14 | 65 | 19 | 1 | 1 |
| Jharkhand | 11 | 66 | 22 | 1 | 0 |
| Chhattisgarh | 16 | 65 | 18 | 1 | 0 |
| Haryana | 12 | 67 | 20 | 1 | 0 |
| Delhi | 15 | 61 | 23 | 1 | 0 |
| Maharashtra | 10 | 48 | 40 | 2 | 0 |
| Karnataka | 7 | 54 | 38 | 1 | 0 |
| Kerala | 11 | 37 | **51** | 1 | 0 |

**Quarterly, India.** Index values are relative within each set.

| quarter end | ncert solutions (A) | tuition (A) | ai teacher (A) | chatgpt (B) | ncert solutions (B) |
|---|---|---|---|---|---|
| 2024-09 | 84.4 | 25.7 | 1.0 | 13.1 | 1.0 |
| 2025-09 | 68.2 | 24.1 | 1.2 | 32.2 | 1.0 |
| 2026-09 | **46.5** | 34.8 | **3.4** | **33.8** | 0.8 |

Findings:

1. **The Hindi belt searches for answers, not tuition.**
   - "ncert solutions" takes 61–72% of the set's share in every Hindi-belt state, against 37–54% in the South, West
     and Kerala.
   - "tuition" is the reverse: 12–23% in the belt, 38–51% in the South and West.
   - Fit for Taxila: belt parents do not look for a tutor online. Their children look for answers. This supports the
     school and WhatsApp channels over store search [D].
2. **Answer-search is collapsing into general AI.**
   - "ncert solutions" fell **~45% (Q3 2024 → Q3 2026)**. Over the same period "chatgpt" rose ~2.6× (13.1 → 33.8),
     and from Q4 2023 it rose ~3.7× (9.0 → 33.8).
   - In set B, "chatgpt" is **~40× "ncert solutions"** in Q3 2026.
   - Implication: the long-tail Play pool in §1 is shrinking, and the general-AI apps are taking the intent [D].
     "ai teacher" tripled, but from an index of 1.
3. **Devanagari and romanised-Hindi queries are negligible.**
   - "kaksha 6 vigyan" scores 0–1 everywhere.
   - "कक्षा 6" is about 2–3% of "class 6" nationally. It peaks in Rajasthan (9 vs 63) and MP (6 vs 64).
   - **Do ASO in Latin-script English class/subject terms, plus "hindi medium".** Devanagari is a secondary listing
     language, not the keyword strategy [D].

## 3. Benchmarks: organic share and organic install-to-payer

| item | figure | tag | source |
|---|---|---|---|
| Education, Indian subcontinent, Android UA ad spend | **+184%**; paid installs **+66% YoY** (Oct 2024–Feb 2026, AppsFlyer State of Subscriptions for Marketers 2026) | [S] | https://mediabrief.com/appsflyers-state-of-subscriptions-for-marketers-2026/ |
| India affiliate-fraud concentration | 65%; 28% of global Android fraud (AppsFlyer 2026) | [S] | https://securitybrief.asia/story/appsflyer-flags-fraud-shift-to-organic-traffic-in-asia |
| Download → paid D35, IN/SEA (all categories) | median **0.7%**, top quartile **1.9%** | [V] | https://www.revenuecat.com/state-of-subscription-apps/ |
| Education download → trial D30 (global) | median **6.5%**, top quartile > 13.5%; Day-0 trial share 28.5% (lowest of all categories) | [V/S, extracted from report charts] | same |
| Education download → paid D35 (global) | ~2.0% | [U, read off a chart; not stated in the text] | same |
| Indus Appstore installs that are "discovery-led" | 50%+; 100M+ devices | [S, PhonePe claim] | https://indianstartupnews.com/article/why-indian-app-developers-are-ditching-old-school-app-stores-for-phonepes-indus-appstore-10975905 |
| How children find EdTech | school 63%, friends 58%, tuition teachers 22%, ads 6%; app-store discovery not a reported category | [V, BaSE 2025 via MARKET-THESIS §5.1] | — |

What could not be found (stated, not papered over):

- **No 2024–26 public AppsFlyer or Adjust India *education* organic-vs-paid split.** The AppsFlyer 2026 India
  releases cover shopping, short-drama and subscription spend. Adjust's H1 2026 release covers shopping.
- The organic-share benchmark therefore stays **[U]**. The common industry claim that organic is about 50–70% of
  installs for content-led Indian edtech is unsourced and must not be used as fact.
- The usable numbers point the same way:
  - paid education UA in India is rising fast (+184% spend), so paid CPIs are inflating;
  - IN/SEA install-to-payer is a third of the global median;
  - children's discovery runs through school and friends, not the store.

## 4. OEM, telco and kids-zone placement

| route | what exists | terms or figures | tag | verdict |
|---|---|---|---|---|
| **Lava × Doubtnut (February 2023)** | Doubtnut preloaded on the Yuva 2 Pro (₹7,999), with "a free subscription to Doubtnut's course material for classes 9th to 12th (worth up to Rs 12,000 for one year)" | commercial terms undisclosed; the model is a **content-as-handset-feature bundle**, so the edtech gives away year-1 revenue | [S] https://www.indiatoday.in/technology/news/story/indian-phone-brand-lava-launches-yuva-2-pro-with-price-much-under-rs-10000-2337613-2023-02-21 ; https://telecom.economictimes.indiatimes.com/news/lava-launches-yuva-2-pro-smartphone-at-rs-7999/98154417 | precedent only |
| **Lava, 2025–26** | Agni 4, Bold N2 and Virat V1 marketed as "no bloatware / no ads" | the slot is shrinking at the one domestic OEM that did edtech preloads | [S] https://www.indiatoday.in/technology/features/story/if-you-want-instagram-download-it-sunil-raina-on-why-lava-agni-4-refuses-to-serve-you-ads-and-bloatware-2822909-2025-11-20 ; https://www.mobigyaan.com/lava-virat-v1-5g-india | no |
| **Jio (JioBharat / JioPhone)** | JioBharat ships Jio's own apps (JioPay/UPI, JioTV, JioSaavn, SoundPay) | Jio Platforms is integrating its majority-owned **Embibe** (April 2025), so the edu slot is captive. JioBharat is a feature phone (KaiOS-class) and cannot run Taxila's voice and WebGL stack | [S] https://www.business-standard.com/technology/gadgets/jiobharat-j1-4g-with-pre-installed-jio-apps-for-upi-tv-and-more-launched-124073000433_1.html ; https://yourstory.com/2025/04/jio-platforms-fully-fold-majority-owned-edtech-embibe-ril | no |
| **JioSphere (browser)** | an edu placement on Jio's browser start page is conceivable | no public program or terms found | [U] | ask at ~100k payers |
| **Samsung Kids** | Samsung's kids mode, with its own curated app set | no India K-8 curriculum partner or public terms found | [U] | no |
| **Indus Appstore (PhonePe)** | preinstalled on new Xiaomi phones (from March 2025, replacing GetApps); deals with Lava and Alcatel; claims 100M+ devices | 0% listing fee in year 1; **zero commission on in-app payments, any payment gateway allowed** | [S] https://techcrunch.com/2025/03/13/xiaomi-to-preinstall-phonepes-app-store-on-smartphones-sold-in-india/ ; https://timesofindia.indiatimes.com/business/india-business/phonepes-indus-appstore-offers-free-first-year-listing-zero-commission-on-payments/articleshow/103884349.cms ; https://m.economictimes.com/tech/technology/indus-appstores-role-in-broadening-indias-app-economy/articleshow/125998742.cms | **list it (₹0)** |
| **Government device schemes** | AP gave students 5.18 lakh tablets preloaded with BYJU'S content (December 2022) | a B2G procurement, not a consumer channel | [S] newsmeter.in (Dec 2022; the page is now 404) | covered by the B2G deferral |
| **Google Play Teacher Approved / Kids tab** | "All apps that comply with Google Play Families policies can opt in to be rated for the Teacher Approved program, but we cannot guarantee… inclusion" [V]. Teachers rate apps on "age-appropriateness, quality of experience, enrichment, and delight" [V, 2022 blog] | **whether the Kids tab and badge exist in India is unconfirmed.** The program launched in the US in 2020; Google's 2022 post names no countries | [V] https://support.google.com/googleplay/android-developer/answer/9893335 ; https://android-developers.googleblog.com/2022/11/helping-kids-and-families-find-high-quality-apps-for-kids.html ; [U] India availability | opt in (₹0) |

**Families policy obligations.** These bind regardless of the Teacher Approved decision, because the app targets
under-13s [V, answer/9893335]:

- Target audience declared accurately. Child-appealing imagery can override the declaration.
- No AAID, IMEI, MAC or SSID from children. Do not request `AD_ID` at API 33+.
- **Microphone and camera data count as children's sensitive information and must be disclosed.**
- Only Families-certified ad SDKs (Taxila shows no ads).
- **No "shocking or emotionally manipulative tactics to encourage… in-app purchases".** This matches the
  never-a-fear-trigger rule in §5.4.
- An app "must not merely provide a webview of a website". A Capacitor shell must be a real app.

**Pricing preload.** No Indian OEM preload rate card is public [U]. `gap3_channel_model.py` brackets it at ₹10–40 per
device:

| case | fee/device | open rate | child household | opened → payer | payers per 100k devices | CAC |
|---|---|---|---|---|---|---|
| low | ₹10 | 5% | 35% | 1% | 18 | ₹57,143 |
| base | ₹25 | 10% | 40% | 2% | 80 | ₹31,250 |
| high | ₹40 | 20% | 45% | 3% | 270 | ₹14,815 |
| best-case bound (₹10 fee, best funnel) | | | | | | **₹3,704** |

All funnel inputs are [A] or [U]. Even the bound is about 11× the ₹316–344 ceiling. The structural reason is that
preload pays for **every** device buyer, and only about 40% of buyer households have a 6–15-year-old [A]. A
rev-share-only deal (no fixed fee) removes the cash CAC, but OEMs that take that deal demand a free bundle, as Lava ×
Doubtnut shows. That converts CAC into lost year-1 revenue.

## 5. Organic Play: volume and CAC against the §5.2 channels

`gap3_channel_model.py` inputs:

- steady-state organic installs per month once ranked: 1k / 3k / 8k [A, from §1 slot sizes × ~20 queries];
- 6-month ramp at 30%;
- conversion: RevenueCat IN/SEA 0.7% / 1.2% / 1.9% [V for the ends];
- consumption-only leak: ×0.5 / 0.6 / 0.7. There is no in-app purchase, so the parent must be reached outside the
  app [A];
- incremental ASO cost: ₹2.5 lakh a year (Hindi listing creative, screenshot and video A/B tests, review-reply ops)
  [A].

| channel | year-1 payers | CAC per payer | vs LTV/CAC = 3 ceiling (₹316–344) | source |
|---|---|---|---|---|
| referral | 2,500 (plan) | ₹220 | passes | §5.2 |
| CTWA (Patna) | 2,500 (plan) | ₹333 | at the line | §5.2 |
| school-seeded | 5,000 (plan) | ₹818 | fails | §5.2 |
| **organic Play: low** | 27 | ₹9,158 | fails | [D] |
| **organic Play: base** | **168** | **₹1,484** | fails | [D] |
| **organic Play: high** | 830 | ₹301 | passes | [D] |
| **OEM preload (base)** | 80 per 100k devices | ₹31,250 | fails by ~90× | [D] |
| Indus listing | unknown, small | ≈ ₹0 marginal | n/a | [S] |

Interpretation:

- Organic Play matters as a **sink** more than a source: it is where school-, WhatsApp- and YouTube-driven parents land
  when they search "Taxila". Brand-search installs will dominate "organic" in any MMP report, so organic share will
  look high whether or not ASO works.
- So the metric to instrument is **non-brand organic installs** (Play Console → Acquisition → search terms), not
  total organic.

## 6. Decision: does this deserve a phase-1 cell?

**No, for both channels.** Do these four zero- or near-zero-cost items instead:

1. **Ship the Android app as consumption-only.**
   - Login with parent OTP. No price, purchase button, webview checkout or "upgrade" link anywhere in the APK.
   - Payment and the UPI Autopay mandate happen in WhatsApp or on the web, which is §5.4 as written.
   - **Counsel check (closes Q9):** WhatsApp and web checkout links must not be triggered *by the in-app sign-up
     flow*. The policy bans "in-app user interface flows, including account creation or sign-up flows, that lead users
     from an app to a payment method other than Google Play's billing system" [V].
   - Safe pattern: the payment offer comes from the school or CTWA conversation that preceded the install, or on a
     schedule decoupled from the sign-up event [I].
   - Keep **UCB at 11%** as a fallback if Google or the courts end the free consumption-only path. That adds about
     4 GM points of cost against the current plan [D].
2. **ASO hygiene (~₹2.5 lakh a year, not a cell).**
   - A Hindi plus English listing on Latin-script terms: "class 5 maths hindi medium", "ncert class 6 science hindi",
     "hindi medium class 8".
   - Devanagari as a listing language.
   - Track non-brand organic installs per month in Play Console.
3. **Opt in to Families and Teacher Approved review** (₹0). Confirm whether the India Kids tab exists. If the badge is
   granted, use it in school and parent creative, where it may convert better than in the store [A].
4. **List on Indus Appstore** (₹0, zero commission, any gateway). This avoids the Play-policy question entirely on
   100M+ devices. Measure installs; do not plan on them.

**Reverse the "no" if**:

- non-brand organic installs exceed **5k a month** with install→payer ≥ 1.5% by phase-1 end (the high case beats the
  ceiling); or
- an OEM offers a **CPA or rev-share deal with no free-bundle term** and a per-payer cost ≤ ₹300; or
- the India Kids tab exists and Taxila is badged. Then re-run §5 with a measured Kids-tab install rate.

**Re-check at each quarter's research sweep**: whether Google adds India to the billing-choice program. If it does,
an in-app "Pay on web" link at 10% on subscriptions becomes allowed. That is about 3 points cheaper than UCB, and it
fixes the consumption-only conversion leak.

## 7. Sources

Google Play primary [V], fetched 2026-10-02:
- Payments policy: https://support.google.com/googleplay/android-developer/answer/9858738
- Payments policy FAQ (consumption-only, communication outside the app, 1:1 human services): https://support.google.com/googleplay/android-developer/answer/10281818
  - The 1:1 exemption requires "between two individuals", so an AI tutor does not qualify.
- India alternative billing program (4% reduction, embedded-webview web payments allowed, 24 h reporting): https://support.google.com/googleplay/android-developer/answer/13306652
- User choice billing overview (India listed): https://support.google.com/googleplay/android-developer/answer/13821247
- Billing choice program with external web links (markets AU, JP, UK, EEA, US; India absent; fee table): https://support.google.com/googleplay/android-developer/answer/17161464
- US alternative billing (June 30 2026 new-install fees): https://support.google.com/googleplay/android-developer/answer/16497028
- Service fees (15% on subscriptions; India alternative billing −4%): https://support.google.com/googleplay/android-developer/answer/112622
- Families policy: https://support.google.com/googleplay/android-developer/answer/9893335
- Billing announcement, 24 June 2026 ("will continue expanding availability to additional markets"; no India date): https://android-developers.googleblog.com/2026/06/play-expanded-billing.html
- Teacher Approved and Kids tab, 2022: https://android-developers.googleblog.com/2022/11/helping-kids-and-families-find-high-quality-apps-for-kids.html
- Teacher Approved and Kids tab, 2020 launch: https://blog.google/products-and-platforms/platforms/google-play/teacher-approved-apps/

India regulatory [S]:
- CCI March 2024 probe of UCB (11%/26% fees; consumption-only free ride "does not appear reasonable"): https://www.medianama.com/2024/03/223-summary-cci-investigation-google-play-new-billing-policy/ ; https://www.business-standard.com/companies/news/cci-terms-google-s-users-choice-billing-system-unfair-orders-probe-124031500791_1.html
- NCLAT, 28 March 2025 (upheld abuse; penalty ₹936.44 cr → ₹216.69 cr): https://legal.economictimes.indiatimes.com/news/litigation/nclat-upholds-cci-ruling-against-google-in-play-store-case-reduces-penalty-to-rs-216-cr/119666869 ; https://www.thehindubusinessline.com/info-tech/nclat-upholds-cci-order-google-play-payment-system-anti-competitive/article69386373.ece
- NCLAT, 1 May 2025 (data directions reinstated): https://www.moneycontrol.com/news/business/google-play-store-case-nclat-reinstates-two-more-directions-from-cci-order-13011866.html
- Supreme Court admits the cross-appeals (August 2025): https://www.thehindu.com/business/Industry/sc-admits-google-appeal-of-nclat-decision-in-anti-competition-case/article69909271.ece ; https://www.medianama.com/2025/07/223-google-play-store-billing-supreme-court-cci/
- March 2024 delistings over the UCB fee dispute: https://www.goodreturns.in/news/over-200-apps-delisted-on-play-store-indian-startups-rally-against-app-removal-what-google-said-1334601.html
- The status of the 2024 CCI UCB investigation in 2026 was not found [U].

Benchmarks and channels: see the inline URLs in §3 and §4.
