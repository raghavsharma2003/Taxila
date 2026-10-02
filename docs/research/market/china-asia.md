# China & Asia adaptive learning: what transfers to India, what failed

**Date:** 2026-10-02. **Scope:** Squirrel AI, Zuoyebang, Yuanfudao, iFlytek AI learning machines, Gaotu (and TAL / Youdao as the listed comparators), Ruangguru (Indonesia), Riiid/Santa and Mathpresso/QANDA (Korea), Korea's AI Digital Textbook, atama+ (Japan, brief), and what China's 2021 tutoring ban did. **Question:** which lessons transfer to Taxila (AI tutor, classes 1-9, CBSE/NCERT + state boards, Hindi-English voice, result-focused), and which models failed.

**Companion docs:** `india-incumbents.md` (Byju's, PW, Vedantu), `india-ai-native.md` (Mindspark evidence bar, Indian price anchors), `global-ai-tutors.md` (Gauth, Question.AI, Brainly review themes), `../learning-science.md` (ITS / LLM-tutor RCTs).

**Tags.** **[V]** checked at a primary source: the policy text, an SEC 20-F, a company's own release, a live Play listing, or the paper itself. **[V-vendor]** means it is verified that the company *makes* the claim, not that the claim is true. **[S]** is secondary: journalism, Wikipedia, a company quote reported by others. **[U]** is unverified, from memory or a single weak source. **[D]** is derived arithmetic on the cited figures.

**Method and limits.** The shared WebSearch budget was exhausted before this task started (0 searches available). Everything here comes from about 110 direct fetches of known URLs, three SEC 20-F filings parsed locally (Gaotu FY2025, TAL FY2026, Youdao FY2025), and live Google Play data pulled with `google_play_scraper`. The data is in `china-asia-playstore-2026-10-02.json` (script: `china_asia_playstore.py`). Reuters, The Guardian, SCMP, The Economist and Tech in Asia blocked fetches, and Baidu Baike returned empty pages. Zuoyebang and Yuanfudao are private, so their numbers are [S] at best. iFlytek's education segment figures are [S], because its A-share filings could not be fetched. Gaps are listed in §13.

---

## 0. Bottom line (decision-relevant)

1. **China banned for-profit academic tutoring for exactly Taxila's band.** The 2021 "Double Reduction" opinion covers compulsory education, grades 1-9 **[V]**. Banned items included: new for-profit licences, weekend/holiday classes, listings and capital raising, and photo-search answer tools, which it called "惰化学生思维能力" (making students' thinking lazy) **[V]**. Online classes were capped at 30 min, with 10-min breaks, ending by 21:00 **[V]**. India has no equivalent today. The precedent is that a state can delete this category overnight once it is framed as an anxiety/inequality machine. Taxila's public framing and pricing should never look like that machine.
2. **The ban killed the business model, not the demand.** TAL fell to **22.7%** of its pre-ban revenue (FY2023 vs FY2021) and recovered to **66.9%** by FY2026 **[D from V]**. Gaotu fell to **38%** in 2022 and was back to **94%** of 2021 revenue by 2025, but still lost RMB 323M **[D from V]**. Parents kept paying for the same goal (exam results) through other channels: in-person "enrichment", high-school classes, devices, and reported underground tutoring.
3. **Hardware was the loophole, not the moat.** The ban text never mentions devices **[V]**. TAL's devices are growing: learning-content revenue was **$1.06B** in FY2026 (+48%), with **2.0M weekly active devices**, up from 1.1M **[V]**. Youdao's are shrinking: smart-device revenue fell **18.2%** in 2025 and **31.5%** YoY in Q2 2026 **[V]**. The premium anchor is iFlytek's T20 Pro at **RMB 8,999 ≈ $1,255** **[S]**, and a 2025 parent paid ">$1,500" **[S]**. Entry-level tablet prices were not fetched **[U]**. At ~₹87/$ [U], $1,255 is ≈₹1.09 lakh, about 3.6-4.5 years of Indian live tuition at ₹2,000-2,500/mo [D]. **India should get a phone-first product, not a device.**
4. **Pre-recorded video inside devices goes largely unwatched.** A former Gankao contractor reported "most video classes have an under 20% open rate and an under 10% completion rate" **[S]**. Parents complained that content was "made in a rush" and that handwritten-essay scanning "worked about half of the time" **[S]**. This supports Taxila's thesis: generated, interactive, *checked* content, not a video library.
5. **Squirrel AI's efficacy evidence is weaker than its marketing.** The best study is an RCT run by SRI in which two of the seven authors are Squirrel AI employees **[V]**. It found 8th graders in two provinces gained more in maths than with expert teachers, but the abstract gives no sample size, duration or effect size **[V]**. The 2017 headline study was "self-funded", **4 days, 78 students** **[S]**. Today's site claims "43 million users" and a "51.3 points average score gain" with no denominator or method **[V-vendor]**. Copy the knowledge-point granularity (10,000+ maths points vs a textbook's ~3,000 **[S]**). Do not copy the claims practice. The Indian bar is Mindspark's independent RCTs (`india-ai-native.md` §3.4).
6. **Every survivor kept humans in the loop, and the humans are the cost.** Squirrel AI centres put a teacher with a live dashboard in each room **[S]**. Gaotu runs a "dual-teacher system" **[V]**, and in 2025 it employed **7,762 sales and marketing staff, more than its 2,576 instructors and 3,928 tutors combined** (6,504) **[V]**. Selling expenses were **78% of revenue in 2021 and 54% in 2025** **[D from V]**. The tutor's job, in Gaotu's words, is answering queries, correcting exercises, after-class support and "instilling discipline in the students to attend the classes and learn" **[V]**. **Taxila's AI has to do that accountability job, and growth has to come from outcomes and referrals rather than a sales floor.** Otherwise it inherits this P&L.
7. **Korea's state AI textbook is the clearest recent failure of rushed AI-in-classroom.** It cost ₩1.2T in government spend plus ₩0.8T by publishers (≈$1.4B) **[S]**. It was built on compressed cycles: 12/3/3 months for development/review/preparation vs 18/9/6 for print **[S]**. Adoption fell from 37% to 19% of schools within one semester, and lawmakers stripped its textbook status in August 2025, citing inaccuracies, teacher workload and poor personalisation **[S]**. Quality gates matter more than launch dates.
8. **Narrow, outcome-measurable domains monetise best.** Riiid's Santa (TOEIC) is the most durable Korean product: 7M users claimed, "average +165 points at 1 h/day" **[V-vendor]**, a refund class paying back "up to 500%" **[V-vendor]**, and an official ETS content partnership **[V-vendor]**. Riiid's 2021 plan for ACT, GMAT, LatAm, the Middle East and Indian partners **[S]** has since narrowed to English tests under a new name (Socra AI) and a new CEO **[V]**. **For Taxila: launch where the result is measurable (school/board exams, NCERT chapter tests) before broadening.**
9. **Answer engines are commoditised, regulated in China, and already in India in Hindi.** Gauth has 122.7M installs and Question.AI 27.5M; Question.AI's Indian listing title is in Hindi ("गृहकार्य सहायक") **[V]**. QANDA has 81.5M installs **[V]** and claims "95 million students" **[V-vendor]**. A "snap and get the answer" feature cannot be Taxila's wedge. The relational, diagnostic tutor is the gap.
10. **Deep knowledge-tracing models are not a moat.** Riiid's own Transformer model (SAINT) improved AUC by **1.8%** over prior models **[V]**. The NeurIPS 2022 pyKT benchmark found "the improvement of many DLKT approaches is minimal" and flagged label-leakage inflation **[V]**. Extended BKT matched DKT in 2016 **[V]**. Spend modelling effort on the content graph, diagnosis UX and re-teaching, not on a fancier tracer.

---

## 1. Scoreboard

| Company (country) | Model at peak | Peak signal | Status 2025-26 | Independent efficacy evidence | Verdict for Taxila |
|---|---|---|---|---|---|
| **Squirrel AI** (CN) | AI adaptive engine in franchised self-study centres + B2G licensing | 2,000 centres / 200 cities, 1M+ students, $180M+ raised (2019) **[S]** | Claims 43M users, 3,000+ centres worldwide; opening California/New York centres, PreK-5 maths **[V-vendor]** | 1 RCT co-authored with the vendor (SRI 2020) **[V]**; 4-day n=78 self-funded study **[S]** | Copy knowledge-point graph + "AI teaches, human supervises"; reject claims practice |
| **Zuoyebang** (CN) | Photo-search homework app → live classes | 35,000 staff before cuts **[S]**; $5.9B raised in 2020 with Yuanfudao **[S]** | ~20,000 staff after Aug 2021 cuts **[S]**; sells "millions" of AI tablets **[S]**; Question.AI is reported as linked **[U]** | none found | Answer engine is a liability; device pivot is not portable |
| **Yuanfudao** (CN) | Live tutoring + photo-search (小猿搜题) + Zebra (early years) | $15.5B valuation **[S]**; ~50,000 staff **[S]** | ~37,000 after 2021 cuts **[S]**; pivoted to AI "learning machines" **[S]**; invested in a down-jacket company **[S]** | none found | Same as Zuoyebang |
| **iFlytek** (CN) | Speech AI → B2G smart education + premium tablets | Education devices/services 29.14% of revenue, 48.64% GM (2023) **[S]**; 768 stores opened 2022 **[S]** | 50,000+ schools, 130M teachers and students (1.3亿) **[S]**; T20 Pro RMB 8,999 **[S]** | none independent found | Voice + B2G channel is instructive; content-safety incident is a warning |
| **Gaotu** (CN, NYSE) | Online large-class live tutoring, dual-teacher | 2020 revenue RMB 7.1B **[S]**; stock $149 → $2.40 in 6 months (−98%) **[S]** | 2025 revenue RMB 6.15B (+35%), net loss RMB 323M **[V]** | none | Shows human-heavy, sales-led P&L even after recovery |
| **TAL** (CN, NYSE) | Offline Peiyou small classes + online | FY2021 $4.50B, 1,098 centres in 110 cities **[V]** | FY2026 $3.01B; devices/content $1.06B; 2.0M weekly active devices **[V]** | none | Device + offline hybrid works in China at Chinese price points |
| **Youdao** (CN, NYSE) | Dictionary pens, tutoring, ads | — | Devices RMB 740M (−18%) in 2025; AI subscriptions +50% **[V]** | none | Software AI subscription outgrew hardware |
| **Riiid / Socra AI** (KR) | Santa TOEIC adaptive app + B2B platform | $175M SoftBank VF2 (2021), 2.5M users **[S]** | Renamed Socra AI, new CEO, Santa TOEIC/TOEFL, ETS partner **[V]** | Vendor claims only; strong public datasets/papers **[V]** | Narrow + measurable + refund guarantee is the model; broad platform ambition failed to materialise |
| **Mathpresso / QANDA** (KR) | Photo-search maths, 85% of users outside Korea | 12M MAU, 45M registered (2021) **[S]** | 81.5M installs, "95M students" **[V]/[V-vendor]** | none | Proves SE Asia/India demand for snap-solve; not Taxila's wedge |
| **Korea AIDT** (KR govt) | Mandatory AI textbooks (maths, English, CS) | Launched Mar 2025, ≈$1.4B total spend **[S]** | Demoted to "supplementary material" Aug 2025; 19% adoption **[S]** | none | Rushed quality and teacher burden kill adoption |
| **Ruangguru** (ID) | Video + live + photo-search + offline centres | 22M users, 300k teachers, "profitable 2020" **[S]** | 26.9M installs, 4.52★; 15+ product lines **[V]** | none found | Closest India analog; went hybrid and diversified |
| **atama+** (JP) | AI teaches; juku staff coach | — | 100+ own juku locations; Sundai online mock exam 500k+ takers **[V-vendor]** | none found | "AI does content, human does motivation" in a cram-school economy |

---

## 2. China's 2021 ban: what it said and what it did

### 2.1 The text ([gov.cn, 2021-07-24](http://www.gov.cn/zhengce/2021-07/24/content_5627132.htm)) **[V]**

| Clause | Content | Taxila relevance |
|---|---|---|
| Scope | Compulsory education (grades 1-9) academic subjects; existing institutions re-registered as **non-profit** | Same band as Taxila |
| Online limits | "每课时不超过30分钟，课程间隔不少于10分钟，培训结束时间不晚于21点" (≤30 min per lesson, ≥10 min breaks, end by 21:00) | Good default session shape for 6-15-year-olds anyway |
| Answer tools | Online institutions may not provide or spread "拍照搜题" (photo-search) or similar tools that weaken independent thinking | Regulatory precedent for "teach toward the answer, never just give it" |
| Calendar | No academic tutoring on holidays, weekends, or winter/summer breaks | — |
| Capital | No listing, no capitalisation; listed firms cannot invest in academic tutoring | — |
| Pricing | Government-guided price for compulsory-stage academic tutoring | Price is a political variable |
| Homework | Grades 1-2 no written homework; grades 3-6 ≤60 min; middle school ≤90 min | — |
| Devices | **No device restriction**, only a general instruction to control screen time and protect eyesight | The hardware loophole (§3) |

The Gaotu 20-F adds the implementation detail. Foreign capital may not control academic tutoring institutions through VIEs or franchising. Online institutions had to be re-approved or lose their ICP licence. A February 8, 2024 MoE **draft** Administrative Regulation on Off-campus Tutoring would keep non-profit registration for compulsory-stage academic tutoring. It also "no longer emphasize[s]" applying the rules to grades 10-12 by reference. It was still not in force at the April 2026 filing ([Gaotu 20-F FY2025](https://www.sec.gov/Archives/edgar/data/1768259/000119312526168211/gotu-20251231.htm)) **[V]**. Guangdong issued provincial standards for academic tutoring institutions in November 2024 **[V, via 20-F]**. The direction since 2024 is cautious normalisation, not reversal.

### 2.2 Effects

| Effect | Number | Source |
|---|---|---|
| Market value lost (TAL, Gaotu, New Oriental) | ≈$100B | [TechNode 2022](https://technode.com/2022/02/03/lunar-new-year-special-the-turmoil-following-chinas-crackdown-on-private-tutoring/) **[S]** |
| Marketable hours cut | ~80% | same **[S]** |
| Gaotu share price | $149.05 (2021-01-27) → $2.40 (2021-07-26), −98.4%; it was already under short-seller fraud allegations and an SEC probe | [Wikipedia](https://en.wikipedia.org/wiki/Gaotu_Techedu) **[S]** |
| Staff cuts by Aug 2021 | Yuanfudao ~50k→37k; Zuoyebang 35k→20k; TAL >70k→~50k; "at least 48,000 jobs" | [TechNode/LatePost](https://technode.com/2021/08/26/china-edtech-giants-cut-tens-of-thousands-of-jobs-report/) **[S]** |
| New Oriental | 60,000 dismissed, operating income −80% (Jan 2022); pivot to livestream commerce (East Buy) | [Wikipedia](https://en.wikipedia.org/wiki/New_Oriental) **[S]** |
| Institutions | Licences revoked for 96% of offline and 87.1% of online firms | [Rest of World 2024](https://restofworld.org/2024/china-student-tablet-ai/) **[S]**; Wikipedia cites SCIO at −83.8% / −84.1% **[S]** |
| Homework-search apps | MoE suspended approvals of homework answer-search apps (Dec 2021) | [TechNode 2022](https://technode.com/2022/02/03/lunar-new-year-special-the-turmoil-following-chinas-crackdown-on-private-tutoring/) **[S]** |
| Student mental health (n=28,398, grades 5-8, two waves) | Depression 9.9%→9.4%, anxiety 7.4%→7.1%; >8 h sleep cut new-onset depression odds 67% | [Wang et al. 2022, CAPMH](https://pmc.ncbi.nlm.nih.gov/articles/PMC9707210) **[V]** |
| Fertility intention | Ban raised expected total fertility by 7-8%; main channel is perceived lower education competition | [Meng et al. 2025, Economic Journal](https://academic.oup.com/ej/advance-article/doi/10.1093/ej/ueaf096/8266522) **[V abstract via Crossref]** |
| Teachers | After-school duties raised teacher burden and anxiety (qualitative, n=45) | [Yue et al. 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10074598) **[V]** |
| Demand | "the strong demand for tutoring remains constant"; parents hired tutors covertly or tutored themselves | [International Ed News, Nov 2021](https://internationalednews.com/2021/11/03/surprise-controversy-and-the-double-reduction-policy-in-china/) **[S]** |

**Revenue trajectories (primary filings)**

| | Pre-ban | Trough | Latest | Latest / pre-ban |
|---|---|---|---|---|
| TAL (FY ends Feb) | FY2021 $4,495.8M ([release](https://www.prnewswire.com/news-releases/tal-education-group-announces-unaudited-financial-results-for-the-fourth-fiscal-quarter-and-the-fiscal-year-2021-301274537.html)) | FY2023 $1,019.8M, −76.8% ([release](https://www.prnewswire.com/news-releases/tal-education-group-announces-unaudited-financial-results-for-the-fourth-fiscal-quarter-and-the-fiscal-year-2023-301809431.html)) | FY2026 $3,008.9M, op. income $276M ([release](https://www.prnewswire.com/news-releases/tal-education-group-announces-unaudited-financial-results-for-the-fourth-fiscal-quarter-and-the-fiscal-year-2026-302751537.html)) | **66.9%** [D] |
| Gaotu (calendar FY) | 2021 RMB 6,561.7M (2020: 7,125M [S]) | 2022 RMB 2,498.2M | 2025 RMB 6,146.8M, net loss RMB 323.3M; H1 2026 RMB 3,359.5M (+16.6%) ([20-F](https://www.sec.gov/Archives/edgar/data/1768259/000119312526168211/gotu-20251231.htm), [Q2 2026](https://www.prnewswire.com/news-releases/gaotu-techedu-announces-second-quarter-2026-unaudited-financial-results-302861439.html)) | **93.7%** of 2021; 86% of 2020 [D] |

All figures above are **[V]** unless marked. What came back is different from what left. TAL's growth is Xueersi Peiyou in-person classes (+26.9%) and devices/books (+48.4%) **[V]**. Gaotu has "ceased offering ... compulsory education academic subject tutoring services since the end of 2021". It now sells "traditional learning services" (high school), non-academic tutoring, and college/adult courses **[V]**.

**Lesson for India.** In China, parent anxiety (exam competition) is the demand, and it survives regulation. Taxila's "result-focused" positioning fits that demand. But China shows the political failure mode clearly: venture-funded customer acquisition, "anxiety marketing", and a sales floor bigger than the teaching staff. India's own 2024 coaching-centre guidelines reportedly bar enrolling under-16s in coaching centres **[U]** (see `india-incumbents.md` §open items). Whether they reach an online AI tutor for classes 1-9 is the open legal question.

---

## 3. The post-ban rebuild: devices and AI

**The forecast.** Squirrel AI's founder said in Sept 2021: "The education and training market will shrink from 1 trillion yuan to 300 billion yuan", while "the learning equipment market is expected to rise from 10 billion yuan to 200 billion yuan" ([China Daily](https://global.chinadaily.com.cn/a/202109/16/WS6142fa9ca310e0e3a6822120.html)) **[S]**. Frost & Sullivan projected a **$20B** Chinese educational-device market in 2026 ([RoW](https://restofworld.org/2024/china-student-tablet-ai/)) **[S]**. Changjiang Securities projects an "AI+education" market of RMB 160B by 2027 and ~180B by 2030 ([Xinhua, 2025-06-09](http://www.news.cn/tech/20250609/d168be922c8449e0bf91b94a97c67403/c.html)) **[S]**. Xinhua also reports "smart learning machines" as the fastest-growing category on one shopping platform (什么值得买) during 618 2025, with keyword-product GMV up >10× **[S, weak: one platform, keyword-matched]**.

**What the listed companies actually report [V]**

| Metric | TAL ([20-F FY2026](https://www.sec.gov/Archives/edgar/data/1499620/000110465926073410/tal-20260228x20f.htm)) | Youdao ([20-F FY2025](https://www.sec.gov/Archives/edgar/data/1781753/000119312526155933/dao-20251231.htm); [Q2 2026](https://www.prnewswire.com/news-releases/youdao-reports-second-quarter-2026-unaudited-financial-results-302856265.html)) | Gaotu ([20-F FY2025](https://www.sec.gov/Archives/edgar/data/1768259/000119312526168211/gotu-20251231.htm)) |
|---|---|---|---|
| Device/content revenue | Learning content solutions $1,061.9M (+48.4%), 35% of revenue [D] | Smart devices RMB 739.6M (−18.2%), "declined demands of smart learning devices"; Q2 2026 RMB 86.8M (−31.5%) | "Educational content & digitalized learning products" RMB 77.1M, 1.3% of revenue |
| Device engagement | **2.0M weekly active devices** (last week Feb 2026) vs 1.1M a year earlier | n/a | n/a |
| Device gross margin | n/d | 46.4% (2025, new dictionary pen); 32.8% (Q2 2026) | n/a |
| Software AI | "AI-driven features" in content; own LLM | "Other learning services" (AI-driven subscriptions) **+50.1%** to RMB 544.3M; LLM "Confucius"; *Hi Echo* digital-human oral-English coach; *Mr. P AI Tutor* | "AI tutor mobile app, which operates without the involvement of human teachers ... 24/7" |
| Risk the filing names | Memory/semiconductor price volatility pressuring device gross margins | New devices "have not generated significant revenues" | — |

**What parents and insiders say.** All quotes are from Rest of World ([2024](https://restofworld.org/2024/china-student-tablet-ai/), [2025](https://restofworld.org/2025/ai-china-childhood/)) **[S]**.
- Video content goes unwatched: "under 20% open rate and an under 10% completion rate" (ex-Gankao contractor).
- "These tablets don't offer much beyond resources already available online" (a tutor and former Squirrel AI employee).
- "the content feels like it's made in a rush and lacks quality control" (a parent).
- Handwritten-essay scanning "only worked about half of the time" (a parent).
- A $1,500+ iFlytek tablet was "still cheaper than in-person classes" (a parent, 2025).
- "People are buying things randomly because it's AI" (Yong Zhao, University of Kansas).

**Content-safety incident.** In October 2023, parents found an essay on an iFlytek learning machine that "诋毁伟人毛泽东" (defamed Mao). iFlytek's shares fell about 10%. The chairman called it "an accident" caused by insufficient content review before user trials ([zh.wikipedia](https://zh.wikipedia.org/wiki/科大讯飞); [en.wikipedia](https://en.wikipedia.org/wiki/IFlytek), citing [Reuters](https://www.reuters.com/technology/shares-chinas-iflytek-tumble-after-reports-ai-powered-device-criticised-mao-2023-10-24/)) **[S]**. In India the equivalent tripwires are national leaders, religion, caste, and especially **maps and borders**. A generated diagram that draws India's borders wrong is a national story.

**State push (2025).** The State Council's "AI+" opinion (Guo Fa [2025] No. 11, 2025-08-21) orders AI integrated "into all elements and processes of education and teaching". It promotes "智能学伴、智能教师" (intelligent learning companions and intelligent teachers) in "human-machine collaborative" models. It targets >70% intelligent-agent penetration in priority sectors by 2027 and >90% by 2030 ([gov.cn](https://www.gov.cn/zhengce/content/202508/content_7037861.htm)) **[V]**. Shandong targets 100% AI-course coverage in schools within 3-5 years ([Xinhua](http://www.news.cn/edu/20250904/1d85d41b369d48b1b3bc108a5ff82b47/c.html)) **[S]**. The MoE's May 2025 generative-AI guidance for schools reportedly bars primary pupils from independent use of open-ended generation **[U, not fetched]**.

**Transfer verdict.** China's device wave rests on four things India lacks: (a) a ban that removed the human alternative, (b) willingness to pay $1,000-1,500+ for a child's device, (c) a gifting/618 retail culture, and (d) a state endorsement of "AI teachers". India has the opposite on (a), and Byju's tablet-plus-loan bundles are a reputational scar there (`india-incumbents.md`). The *features* transfer: OCR of handwritten work, error notebooks, voice oral practice, parent dashboards. The device does not.

---

## 4. Squirrel AI: claims vs evidence

| Claim | Evidence | Tag |
|---|---|---|
| Middle-school maths split into 10,000+ "knowledge points" vs ~3,000 in textbooks and ~1,000 in ALEKS; "diagnose a student's gaps ... as precisely as possible" | [MIT Technology Review, Karen Hao, 2019-08-02](https://www.technologyreview.com/2019/08/02/131198/china-squirrel-has-started-a-grand-experiment-in-ai-education-it-could-reshape-how-the/) | [S] |
| Beat experienced teachers | "a self-funded four-day study with 78 middle school students" (Oct 2017) | [S] |
| RCT vs expert teachers | Wang, Christensen, **Cui, Tong (Squirrel AI)**, Yarnall, Shear, Feng. *Interactive Learning Environments* 31(2), 2020/2023. Grade 8, two provinces, randomized vs whole-class and small-group. "greater gains on a mathematics test". Abstract gives no n, duration or effect size; 243 citations ([Crossref](https://api.crossref.org/works/10.1080/10494820.2020.1808794); [Semantic Scholar](https://api.semanticscholar.org/graph/v1/paper/DOI:10.1080/10494820.2020.1808794?fields=title,abstract,citationCount)) | [V] |
| Replications | No independent replication among citing papers in the Semantic Scholar listing (reviews and bibliometrics only) | [V, absence] |
| Scale | 2019: 2,000 centres / 200 cities, 1M+ registered, 80% year-over-year return [S]. 2021: "60,000 public schools ... 1200 cities" [S]. 2026 site: "43 Million" users, "3,000+" centres, "51.3 points average score gain", "Large Adaptive Model" (Jan 2024), first US centres in CA and NY, PreK-5 maths ([squirrelai.com](https://www.squirrelai.com/)) | [S]/[V-vendor] |
| Revenue mix (2021) | ~93% technology service fees, rest tuition ([China Daily](https://global.chinadaily.com.cn/a/202109/16/WS6142fa9ca310e0e3a6822120.html)) | [S] |
| US entity | US arm "separate from the Chinese company to avoid regulatory hurdles" ([Wikipedia](https://en.wikipedia.org/wiki/Squirrel_AI); flagged for promotional content) | [S] |

**Critiques worth importing** (MIT TR) **[S]**.
- Chris Dede separates *adaptive* learning (what the student knows) from *personalized* learning (interests, preferred ways of learning).
- Jutta Treviranus: "It only makes it more efficient to bring all of the students to the same standardized place."
- A student: "I wish we had more interaction with our human teachers."
- The centre model: "In each room, a teacher monitors the students through a real-time dashboard."

**For Taxila.** Squirrel AI shows that the adaptive *engine* is not the product. Its centres were a supervised study hall with a dashboard, sold through franchising. Its evidence never cleared an independent bar. Taxila's thesis (vibe, motivation, relationship, covert understanding checks) sits on Dede's "personalized" side of that line, the side Squirrel AI was criticised for skipping. The knowledge-point graph is the part to copy: decompose NCERT chapters into atomic, prerequisite-linked points (see `../learning-science.md`).

---

## 5. Zuoyebang and Yuanfudao: from photo-search to tablets

- **Capital.** Together they raised **$5.9B in 2020**, as much as the whole sector raised in the prior four years ([TechNode](https://technode.com/2021/07/26/chinese-edtech-upended-by-sweeping-regulations/)) **[S]**. Yuanfudao was valued at $15.5B ([RoW 2026](https://restofworld.org/2026/edtech-funding-collapse-k12-startups-ai-workforce/)) **[S]**.
- **Origin product = answer engine.** Xiaoyuan Souti searches a bank of 80M+ problems in under 1 s. It claimed 80-90% accuracy; an independent 2015 test found ~70% ([zh.wikipedia](https://zh.wikipedia.org/wiki/猿辅导)) **[S]**. Zuoyebang started as a Baidu homework Q&A product, founded 2014-01 ([zh.wikipedia](https://zh.wikipedia.org/wiki/作业帮)) **[S]**. In November 2025 a Zuoyebang app was found carrying problematic content about student suicide and pulled it after a complaint ([zh.wikipedia](https://zh.wikipedia.org/wiki/作业帮)) **[S]**.
- **Regulatory hit.** Photo-search was named in the ban text **[V]**, and approvals of homework-search apps were suspended in December 2021 **[S]**.
- **Pivot.** Both moved into AI learning tablets ("millions" sold, [RoW 2025](https://restofworld.org/2025/ai-china-childhood/)) **[S]**. Yuanfudao also kept Xiaoyuan Kousuan (arithmetic checking), Zebra/Dolphin "AI learning" for young children, and coding ([yuanfudao.com](https://www.yuanfudao.com/)) **[V-vendor]**.
- **Overseas.** The answer-engine model went abroad.

| App (Play, live 2026-10-02) | Installs | Rating | India IAP range | Notes |
|---|---|---|---|---|
| Gauth (GauthTech Pte, ByteDance per [a16z](https://a16z.com/100-gen-ai-apps-3/) [S]) | 122.7M | 4.58 | ₹7-10,000 | released Jan 2022 |
| Question.AI (D3 Dimension Technology Pte) | 27.5M | 3.80 (IN) | ₹55-10,900 | **India title in Hindi**; Zuoyebang link reported **[U]** |
| QANDA (Mathpresso, KR) | 81.5M | 4.16 (IN) | ₹20-30,000 | "95 million students"; AI feedback on handwritten solutions |
| Solvely (Aignite) | 6.0M | 4.74 | ₹310-74,700 | — |
| Brainly | 297.7M | 4.45 | ₹25-9,400 | comparator |

Source: `china-asia-playstore-2026-10-02.json` **[V]**. Installs are global.

**For Taxila.** China's regulator and Taxila's pedagogy agree on one thing: answer tools make thinking lazy. These apps are already in Indian students' other hand (`global-ai-tutors.md` §2.10). Taxila should take the *photo input* (OCR of the child's own working, as QANDA and iFlytek do) and refuse the *answer output*.

---

## 6. Gaotu and TAL: the human-heavy P&L that survived

**Gaotu FY2025, from its 20-F [V]**

| Line | 2021 | 2025 | Note |
|---|---|---|---|
| Net revenues (RMB M) | 6,561.7 | 6,146.8 | 98.2% "learning services" |
| Selling expenses (RMB M) | 5,129.3 (**78.2%** of revenue [D]) | 3,289.1 (**53.5%** [D]) | 2025 rise "due to the expansion of ... learning advisers and marketing personnel" |
| R&D (RMB M) | 1,252.9 | 626.9 (10.2% [D]) | R&D halved while sales stayed dominant |
| Net result | — | −323.3 (2024: −1,049.0) | still loss-making in Q2 2026 (−135.8) |

**Headcount on 2025-12-31 (17,483 total):** sales & marketing **7,762 (44%)**, tutors 3,928 (22%), instructors 2,576 (15%), tech & content R&D 1,432 (8%), G&A 1,785, plus 1,395 contract tutors **[V]**.

- **Dual-teacher model.** "expert instructors lead classes, and a team of trained tutors offers real-time guidance in smaller groups" **[V]**.
- **The tutor's job description** is the relational/accountability layer Taxila must automate: "addressing students' in-class queries, correcting students' post-class exercises, providing support to students after class, and instilling discipline in the students to attend the classes and learn" **[V]**.
- **AI framing.** "AI is designed to complement, not replace, human roles". Yet Gaotu also ships an "AI tutor mobile app, which operates without the involvement of human teachers" **[V]**. It says AI personalisation "substantially increased conversion rates" in marketing **[V]**.
- **Funnel.** Low-priced trial courses run over three to six days, taught "by the same high-quality instructors" **[V]**.

**TAL FY2026.** Selling & marketing was $889.1M, **29.5%** of revenue [D]. Growth came from "enrollment growth of Xueersi Peiyou as a result of the expansion of our capacity" (+26.9%) and devices/books (+48.4%). Full-time staff were 26,100 plus ~1,800 contract teachers **[V]**. FY2025 management: "By integrating in-person teaching, interactive online programs, and smart learning tools, we are confident in TAL's full-stack capability" ([release](https://www.prnewswire.com/news-releases/tal-education-group-announces-unaudited-financial-results-for-the-fourth-fiscal-quarter-and-the-fiscal-year-2025-302437140.html)) **[V]**.

**For Taxila.** China's recovered winners are *not* AI-native. They are human-teaching companies with AI bolted on, spending 30-54% of revenue on sales. That is the gap an AI-native tutor exploits. It only works if the AI does the "tutor" job above well enough that parents renew without a learning adviser calling them. That makes renewal and referral the core metrics, not sign-ups.

---

## 7. iFlytek: voice-first, B2G, premium hardware

- **School footprint.** Education products deployed in all 32 provincial regions, "5万余所学校、1.3亿师生" (50,000+ schools, 130 million teachers and students). A "Spark teacher assistant" covers 2,000+ schools and 150,000+ teachers. Vendor efficiency claims: lesson design +56.52%, teacher approval 93% ([Xinhua 2025](http://www.news.cn/tech/20250609/d168be922c8449e0bf91b94a97c67403/c.html)) **[S/V-vendor]**.
- **Consumer business.** Education devices/services were 29.14% of revenue with a 48.64% gross margin (2023). It opened 768 stores in 2022 (+100%), and the reporter verified 1,103 locations ([RoW 2024](https://restofworld.org/2024/china-student-tablet-ai/)) **[S]**.
- **LLM.** Spark LLM was released September 2023 after state approval; Spark 4.0 in 2024 ([Wikipedia](https://en.wikipedia.org/wiki/IFlytek)) **[S]**.
- **Risk.** US sanctions (Oct 2019, Xinjiang surveillance allegations) **[S]**. The 2023 Mao-essay incident (§3).

**For Taxila.** iFlytek's edge is that speech (oral English scoring, dictation, reading aloud) was its core competence before LLMs. Its tablets sell on "AI that listens to your child". That is the closest Asian precedent for Taxila's Hindi-English voice tutor. Two caveats. First, the B2G channel (schools first, then consumer devices) took a decade of state relationships. Second, its weakest public moments came from *content* review, not from AI capability.

---

## 8. Korea: Riiid/Santa, QANDA, and the AI textbook

### 8.1 Riiid → Socra AI
- **2021.** $175M from SoftBank Vision Fund 2 ($250M total), 2.5M Santa users in Korea and Japan. Plans covered ACT, GMAT, LatAm college entrance, the Middle East, real-estate/insurance exams, and B2B ([TechCrunch 2021-05-24](https://techcrunch.com/2021/05/24/riiid-ai-education-softbank/)) **[S]**. Partners included Kaplan, ConnectMe, and India's **BasicFirst** ([TechCrunch 2021-10-07](https://techcrunch.com/2021/10/07/softbank-backed-korean-edtech-startup-riiid-acquires-langoo-to-expand-further-to-japan/)) **[S]**. CEO then: YJ Jang.
- **2026.** The company is **Socra AI**, CEO Sooyoung Park; riiid.com redirects to corp.socra.ai. Products: Santa (TOEIC/TOEFL), Real Academy/Class/Speaking (English), Vestway (stocks). Research lines: "Socra Twin" (diagnosis) and "Socra Tutor" (Socratic dialogue). It claims 26 peer-reviewed papers and 150+ patents ([corp.socra.ai](https://corp.socra.ai/en/about)) **[V-vendor]**.
- **Santa's Korean Play listing.** "700만이 선택한" (7M users), "하루 1시간 ... 평균 토익 점수 165점 상승" (+165 avg at 1 h/day), a refund class "최대 500%까지" (up to 500% back), and a 24/7 GPT tutor "Lumi". The English listing: "official ETS-partnered TOEFL iBT prep app"; 3.0M installs, 4.52★ **[V-vendor]**.
- **Science.** EdNet holds 784,309 students and 131,441,538 interactions over 2 years ([arXiv 1912.03072](https://arxiv.org/abs/1912.03072)) **[V]**. SAINT improved AUC by 1.8% ([arXiv 2002.07033](https://arxiv.org/abs/2002.07033)) **[V]**. pyKT: "the improvement of many DLKT approaches is minimal" ([arXiv 2206.11460](https://arxiv.org/abs/2206.11460)) **[V]**. Khajah et al.: extended BKT is "indistinguishable" from DKT ([arXiv 1604.02416](https://arxiv.org/abs/1604.02416)) **[V]**.

**Reading.** Riiid built the best open knowledge-tracing science in Asia. What lasted commercially was a narrow test-prep app with a score guarantee and the test owner's content. The planned horizontal "AI for every exam" platform contracted. Layoffs were reported but are not verified here **[U]**.

### 8.2 Mathpresso / QANDA
- **2021:** 45M registered, 12M MAU in 50 countries, 10M photos uploaded daily, >85% of users outside Korea (Japan, SE Asia), $105M raised, Google as investor ([TechCrunch 2021-11-09](https://techcrunch.com/2021/11/09/south-korean-edtech-startup-mathpresso-adds-google-as-an-investor/)) **[S]**.
- **2026:** 81.5M installs. It now markets "Real-Time AI Feedback": photograph your *handwritten solution* and AI "corrects mistakes" **[V-vendor]**. This is the step from answer engine to working-checker that Taxila wants.

### 8.3 AI Digital Textbook (AIDT), 2025
All figures from [Rest of World, Junhyup Kwon, 2025-10-15](https://restofworld.org/2025/south-korea-ai-textbook/) **[S]**.
- **Scope and money.** Launched March 2025 for maths, English and CS under President Yoon. Government spent "more than 1.2 trillion won ($850 million)" and publishers "around 800 billion won ($567 million)".
- **Rushed build.** "Traditional print textbooks take 18 months to develop, nine months for review, and six months for preparation. But the AI textbooks took only 12, three, and three months, respectively."
- **Complaints.** Factual inaccuracies, screen time, privacy, technical delays, weak personalisation ("didn't provide lessons tailored to my level"), and more teacher workload.
- **Collapse.** Reclassified as "supplementary material" in August 2025. Adoption fell from 37% to 19%, and only 2,095 schools remained, about half.

**For Taxila.** The failure was not the AI concept. It was the review window being cut by two-thirds while the product was mandated onto teachers who had not asked for it. Taxila's equivalents are a content QA gate that cannot be skipped for a launch date, and never making a school teacher's day harder.

---

## 9. Indonesia: Ruangguru

- **Scale.** 6M users (2017) → 13M (2018) → 15M (2019) → 22M (end-2020) ([id.wikipedia](https://id.wikipedia.org/wiki/Ruangguru)) **[S]**. The company claimed 300,000 teachers and "turned a profit for the first time" in 2020 ([KrASIA](https://kr-asia.com/indonesias-edtech-sector-remains-red-hot-as-ruangguru-snags-another-usd-55-million)) **[S]**.
- **Funding.** $150M Series C (Dec 2019, General Atlantic) and $55M (Apr 2021, Tiger Global) ([Wikipedia](https://en.wikipedia.org/wiki/Ruangguru)) **[S]**.
- **Government work.** Partner in Kartu Prakerja (pre-employment card) training and a free online school for 10M students during COVID **[S]**. A conflict-of-interest controversy over the founder's presidential staff role (2020) **[U, source page empty]**.
- **Product (Play listing, live) [V].**
  - Video lessons with "Adapto", which matches videos to the student's level.
  - Live "Brain Academy" with "Star Master Teacher" and a video-call "Homework Clinic".
  - **Brain Academy Offline, 30+ branches**.
  - Roboguru photo-solve; avatar "Adventure" and "Pet Mission" gamification.
  - "Study Progress Reports accessible by parents".
  - 26.9M installs, 4.52★, IAP Rp 3,000-3,767,000.
- **Sprawl.** 15+ product lines including coding (Kalananti), study abroad (Schoters), a kids' brand and job skills ([ruangguru.com](https://www.ruangguru.com/)) **[V-vendor]**.
- **Context.** Global edtech VC fell from $16.7B (2021) to under $3B (2025), and new edtech companies from ~10,500 (2020) to 645 (2025) (Tracxn via [RoW 2026](https://restofworld.org/2026/edtech-funding-collapse-k12-startups-ai-workforce/)) **[S]**. Ruangguru layoffs in 2022-23 are widely reported but not verified here **[U]**.

**For Taxila.** Ruangguru is the nearest analog: a national curriculum, mid-income parents, mobile-first, and a vernacular-plus-English context. What it shows is that Asian K-12 leaders drifted toward **live human teachers + offline centres + many product lines** to grow revenue per user. That is the same drift as PW and Byju's in India. Taxila's counter-bet is that one excellent AI tutor relationship can hold revenue per user without the sprawl. No Asian company has proven that bet yet.

---

## 10. Japan, briefly: atama+

atama plus (founded 2017-04-03, Tokyo) sells an "AI教材" (AI textbook) that diagnoses stumbling points and sequences lecture → exercise → review. Its own juku chain (100+ locations) combines "learning analysis AI × real-time progress management × flat-rate unlimited attendance". It runs an online mock exam with Sundai that has had 500k+ cumulative takers ([atama.plus](https://www.atama.plus/), [corp.atama.plus](https://corp.atama.plus/company/)) **[V-vendor]**. Partner-juku and classroom counts could not be verified **[U]**. The model ("AI teaches, the human coach manages motivation and progress") is the same as Squirrel AI's centres, inside a cram-school economy like India's coaching belt.

---

## 11. Transfer matrix

| Asian pattern | Evidence | Transfers to India? | Taxila action |
|---|---|---|---|
| Fine-grained knowledge graph (10k+ points) | Squirrel AI [S]; EdNet scale [V] | **Yes** | Atomise NCERT/state-board chapters into prerequisite-linked points; diagnose at point level |
| Fancy deep knowledge tracing | SAINT +1.8% AUC; pyKT "minimal" [V] | **Low value** | Use BKT/IRT-class tracing; put the effort into diagnostic items and re-teach variety |
| Photo of the *child's working* → error feedback | QANDA, iFlytek OCR [V-vendor/S]; OCR "half of the time" complaint [S] | **Yes, if accurate** | Ship handwriting check only above a measured accuracy bar; fall back to voice ("tell me your step") |
| Answer engine (snap → answer) | Banned in China [V]; commoditised (Gauth 123M) [V] | **No** | Never output final answers to homework; teach toward them |
| Pre-recorded video library | <20% open, <10% completion [S] | **No** | Generated, short, interactive, checked content; video only as a clip inside a dialogue |
| Premium learning tablet | TAL growing, Youdao shrinking [V]; $1,255+ price [S] | **No** (price, Byju's scar) | Phone/shared-family-device first; low-end Android performance budget |
| AI + human supervisor in a room | Squirrel AI, atama+ [S/V-vendor] | **Partly** | Later B2B2C: tuition centres or schools run Taxila with a human monitor; a parent is the home "supervisor" |
| Dual-teacher / tutor accountability layer | Gaotu 20-F [V] | **Yes, as AI** | Taxila must do the tutor's job: chase attendance, correct exercises, after-class support, discipline, parent updates |
| Sales-floor customer acquisition | Gaotu 53-78% of revenue on selling [D/V] | **No** | Referral and result-led growth; free diagnostic as the "trial course" |
| Outcome guarantee | Santa refund "up to 500%" [V-vendor] | **Yes, carefully** | Consider a "chapter-test improvement or money back" for paid tiers once outcome data exist; never promise ranks (India's coaching rules reportedly bar misleading promises [U]) |
| Official content partnership | Santa × ETS [V-vendor] | **Yes** | NCERT/DIKSHA licensing, state SCERT alignment, board sample papers |
| Voice-first oral practice / digital human | Youdao Hi Echo, iFlytek [V/S] | **Yes, core** | Hindi-English voice tutor is the differentiator; measure pronunciation/fluency scoring separately |
| State mandate of AI in classrooms | China AI+ [V]; Korea AIDT reversal [S] | **Risky** | Do not depend on mandates; never add to teacher workload; quality gate before school pilots |
| Generated-content safety review | iFlytek Mao essay [S]; Zuoyebang suicide content [S] | **Yes, critical** | India-specific sensitive-topic gate (maps/borders, leaders, religion, caste, self-harm) on every generated asset |
| Session limits | ≤30 min, 10-min break, end by 21:00 [V] | **Yes (good practice)** | Default session ≤25-30 min for classes 1-5; wind-down after 21:00 |

---

## 12. What failed, and why

| Failure | Mechanism | Evidence | Guardrail for Taxila |
|---|---|---|---|
| China online K-9 tutoring (2021) | VC-funded customer-acquisition race + parent-anxiety marketing + inequality narrative → political deletion | ban text [V]; $5.9B raised in 2020 [S]; −98% Gaotu [S] | Price within reach of the median parent; no fear marketing; publish learning outcomes |
| Gaotu governance | Short-seller revenue-inflation allegations and SEC probe before the ban | [S] | Audited, conservative metrics; no vanity "users" |
| Photo-search apps | Answer copying; regulator called it thinking-lazy | [V]/[S] | No answer output |
| Device video content | Passive, low completion; rushed content | [S] | Interactive generation + a QA gate |
| Youdao hardware | Demand for smart learning devices fell in 2025 | [V] | Don't make hardware the revenue line |
| Squirrel AI evidence | Vendor-linked, short, small studies; unaudited scale claims | [V]/[S] | Pre-registered independent RCT against the Mindspark bar |
| Korea AIDT | Review cycle cut, mandate imposed on teachers, inaccuracies | [S] | Content QA gate; teacher-optional |
| Riiid horizontal expansion | Domain-agnostic "AI for every test" plans narrowed to English test-prep | [S]/[V] | Depth before breadth: one board, a few grades, maths + one language first |
| Ruangguru-style sprawl | 15+ product lines to grow revenue per user | [V-vendor] | One tutor relationship across subjects rather than many brands |
| iFlytek content incident | Third-party/unreviewed content on a child device → stock −10% | [S] | Every asset passes the sensitive-topic gate, including licensed content |

---

## 13. Gaps and items to verify (fresh search budget needed)

1. **Zuoyebang/Yuanfudao 2024-26 numbers:** revenue, device units, profitability, LLM names (Zuoyebang's "Galaxy"), and whether Question.AI is Zuoyebang's **[U]**.
2. **Chinese learning-tablet market data** from IDC/Runto: units, ASP, brand shares 2023-2025. Only the Frost & Sullivan projection and one 618 data point are cited **[S]**.
3. **iFlytek education segment** from its 2024/2025 annual reports (cninfo) **[S only]**.
4. **Underground tutoring after 2021:** prevalence and price changes (e.g. Bray et al.; CIEFR household surveys). Only qualitative reports are cited **[S]**.
5. **The SRI Squirrel AI RCT full text:** n, duration, effect sizes. The paywall blocked it **[U]**.
6. **MoE (China) May 2025 generative-AI guidance** for primary pupils **[U]**.
7. **Riiid/Socra layoffs, rename date, Santa revenue; Ruangguru layoffs and current profitability; Kartu Prakerja controversy** **[U]**.
8. **India's 2024 coaching-centre guidelines:** do they apply to online AI tutoring for under-16s? **[U]** (shared with `india-incumbents.md`).
9. **Korea hagwon spending 2024-25** (KOSTAT): did AIDT or AI apps dent private-education spend? **[U]**.

---

## 14. Implications for Taxila (proposed decisions, each with a reversal condition)

1. **No hardware SKU in year 1; phone-first.** *Reverse if* Indian parents in pilots show >20% willingness to buy a sub-₹10k dedicated device *and* TAL-style weekly-active rates (>50% of units) hold in an Indian test.
2. **Never return final answers to homework; accept photos of the child's working.** *Reverse* only the photo-check part, if measured OCR accuracy on Indian handwriting (Devanagari + English) stays below 90% after tuning. Then switch to voice step-explanation.
3. **The AI owns the "tutor job" (Gaotu's definition) end to end:** attendance nudges, exercise correction, after-class help, discipline, and the parent report. *Reverse* (add paid human tutors) if 90-day renewal of AI-only cohorts is below the live-tuition benchmark by more than 15 points.
4. **Growth budget cap.** Selling and marketing ≤25% of revenue, with no outbound sales floor. *Reverse if* referral coefficients stay below 0.3 after 6 months of outcome-led marketing.
5. **Content QA gate with India-specific sensitive categories** (maps/borders, national figures, religion, caste, self-harm), applied to generated *and* licensed assets. No launch date overrides it. *Never reverse*. Adjust thresholds from audit data only.
6. **Evidence plan.** A pre-registered, third-party-run study against the Mindspark bar (~0.2 SD over 18 months) before making any score-gain claim. *Reverse* (publish earlier) only with an independent evaluator.
7. **Default session shape** for classes 1-5: ≤30 min with a 10-min break and wind-down after 21:00 (China's rule as a free safety default). *Reverse if* engagement data show shorter or longer blocks raise mastery without fatigue signals.
8. **Narrow launch.** One board (CBSE/NCERT), a contiguous grade band, maths + one language, with a measurable result (chapter tests / school exams), and an outcome guarantee once data exist. *Broaden* when a cohort shows a measured gain.
9. **Framing.** Publicly "the best tutor at home", not "replacing teachers". China's and Korea's histories show that framing against teachers or parents' anxiety invites regulatory and teacher backlash. *Reverse* only if the Indian policy direction (e.g. NEP/state AI programmes) explicitly invites AI teaching agents.

---

## Sources

**Primary [V]**
- Double Reduction opinion text: http://www.gov.cn/zhengce/2021-07/24/content_5627132.htm
- State Council "AI+" opinion, 2025: https://www.gov.cn/zhengce/content/202508/content_7037861.htm
- Gaotu 20-F FY2025: https://www.sec.gov/Archives/edgar/data/1768259/000119312526168211/gotu-20251231.htm
- Gaotu releases: https://www.prnewswire.com/news-releases/gaotu-techedu-announces-second-quarter-2026-unaudited-financial-results-302861439.html ; https://www.prnewswire.com/news-releases/gaotu-techedu-announces-first-quarter-2026-unaudited-financial-results-302788046.html ; https://www.prnewswire.com/news-releases/gaotu-techedu-announces-third-quarter-2025-unaudited-financial-results-302626466.html ; https://www.prnewswire.com/news-releases/gaotu-techedu-announces-second-quarter-2025-unaudited-financial-results-302538474.html ; https://www.prnewswire.com/news-releases/gaotu-techedu-announces-fourth-quarter-and-fiscal-year-2023-unaudited-financial-results-302072129.html
- TAL 20-F FY2026: https://www.sec.gov/Archives/edgar/data/1499620/000110465926073410/tal-20260228x20f.htm
- TAL releases FY2021/2023/2025/2026/Q1 FY2027: https://www.prnewswire.com/news-releases/tal-education-group-announces-unaudited-financial-results-for-the-fourth-fiscal-quarter-and-the-fiscal-year-2021-301274537.html ; https://www.prnewswire.com/news-releases/tal-education-group-announces-unaudited-financial-results-for-the-fourth-fiscal-quarter-and-the-fiscal-year-2023-301809431.html ; https://www.prnewswire.com/news-releases/tal-education-group-announces-unaudited-financial-results-for-the-fourth-fiscal-quarter-and-the-fiscal-year-2025-302437140.html ; https://www.prnewswire.com/news-releases/tal-education-group-announces-unaudited-financial-results-for-the-fourth-fiscal-quarter-and-the-fiscal-year-2026-302751537.html ; https://www.prnewswire.com/news-releases/tal-education-group-announces-unaudited-financial-results-for-the-first-fiscal-quarter-ended-may-31-2026-302838894.html
- Youdao 20-F FY2025: https://www.sec.gov/Archives/edgar/data/1781753/000119312526155933/dao-20251231.htm ; Q2 2026: https://www.prnewswire.com/news-releases/youdao-reports-second-quarter-2026-unaudited-financial-results-302856265.html ; FY2024: https://www.prnewswire.com/news-releases/youdao-reports-fourth-quarter-and-fiscal-year-2024-unaudited-financial-results-302381231.html
- SRI/Squirrel AI RCT metadata: https://api.crossref.org/works/10.1080/10494820.2020.1808794 ; https://api.semanticscholar.org/graph/v1/paper/DOI:10.1080/10494820.2020.1808794?fields=title,abstract,citationCount
- Mental health after the ban: https://pmc.ncbi.nlm.nih.gov/articles/PMC9707210 ; teachers: https://pmc.ncbi.nlm.nih.gov/articles/PMC10074598 ; fertility: https://api.crossref.org/works/10.1093/ej/ueaf096
- Knowledge tracing: https://arxiv.org/abs/1912.03072 ; https://arxiv.org/abs/2002.07033 ; https://arxiv.org/abs/2206.11460 ; https://arxiv.org/abs/1604.02416
- Vendor sites (claims only): https://www.squirrelai.com/ ; https://corp.socra.ai/en/about ; https://www.ruangguru.com/ ; https://www.atama.plus/ ; https://corp.atama.plus/company/ ; https://www.yuanfudao.com/ ; https://www.zuoyebang.com/
- Google Play live listings: `china-asia-playstore-2026-10-02.json`

**Secondary [S]**
- MIT Technology Review on Squirrel AI (2019): https://www.technologyreview.com/2019/08/02/131198/china-squirrel-has-started-a-grand-experiment-in-ai-education-it-could-reshape-how-the/
- China Daily on Squirrel AI (2021): https://global.chinadaily.com.cn/a/202109/16/WS6142fa9ca310e0e3a6822120.html
- Rest of World: https://restofworld.org/2024/china-student-tablet-ai/ ; https://restofworld.org/2025/ai-china-childhood/ ; https://restofworld.org/2025/south-korea-ai-textbook/ ; https://restofworld.org/2026/edtech-funding-collapse-k12-startups-ai-workforce/ ; https://restofworld.org/2026/ai-education/
- TechNode: https://technode.com/2021/07/26/chinese-edtech-upended-by-sweeping-regulations/ ; https://technode.com/2021/08/26/china-edtech-giants-cut-tens-of-thousands-of-jobs-report/ ; https://technode.com/2022/02/03/lunar-new-year-special-the-turmoil-following-chinas-crackdown-on-private-tutoring/
- Xinhua: http://www.news.cn/tech/20250609/d168be922c8449e0bf91b94a97c67403/c.html ; http://www.news.cn/edu/20250904/1d85d41b369d48b1b3bc108a5ff82b47/c.html
- TechCrunch: https://techcrunch.com/2021/05/24/riiid-ai-education-softbank/ ; https://techcrunch.com/2021/10/07/softbank-backed-korean-edtech-startup-riiid-acquires-langoo-to-expand-further-to-japan/ ; https://techcrunch.com/2021/11/09/south-korean-edtech-startup-mathpresso-adds-google-as-an-investor/
- KrASIA on Ruangguru: https://kr-asia.com/indonesias-edtech-sector-remains-red-hot-as-ruangguru-snags-another-usd-55-million
- a16z consumer AI lists: https://a16z.com/100-gen-ai-apps-3/ ; https://a16z.com/100-gen-ai-apps-4/
- Wikipedia: https://en.wikipedia.org/wiki/Double_Reduction_Policy ; https://en.wikipedia.org/wiki/Squirrel_AI ; https://en.wikipedia.org/wiki/Gaotu_Techedu ; https://en.wikipedia.org/wiki/New_Oriental ; https://en.wikipedia.org/wiki/IFlytek ; https://zh.wikipedia.org/wiki/科大讯飞 ; https://zh.wikipedia.org/wiki/作业帮 ; https://zh.wikipedia.org/wiki/猿辅导 ; https://en.wikipedia.org/wiki/Ruangguru ; https://id.wikipedia.org/wiki/Ruangguru ; https://ko.wikipedia.org/wiki/뤼이드
- Other: https://internationalednews.com/2021/11/03/surprise-controversy-and-the-double-reduction-policy-in-china/ ; https://www.voanews.com/a/east-asia-pacific_voa-news-china_chinas-crackdown-pricey-tutoring-schools-upsets-parents/6208069.html
