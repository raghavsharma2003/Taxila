# Tutor substitution: what Indian parents buy from a tuition teacher, and what Taxila can replace

**Date:** 2026-10-02 · **Scope:** Taxila, classes 1-9 (ages ~6-15), CBSE/NCERT, RBSE and other state boards.
**Question:** When Indian parents pay a tuition teacher or home tutor, what are they buying? The candidates are homework
completion, exam marks, discipline and accountability, safe supervised time, doubt clearing, parent communication and
test prep. For each one: can an AI tutor replace it now, does it need product features first, or can it not be replaced
yet? The answer sets the order of the "replace tutors" roadmap.

**Builds on, does not repeat:** `../design/parent-experience.md` (parent asks, PX rules, PTM), `../conductor/parent-loop.md`
(parent agent), `../conductor/school-sync-homework.md` (homework ladder, OCR gates SS1-SS14), `../conductor/day-cycle.md`
(anchor slot DC1), `../learner/need-goals.md`, `../learning-science.md`, `india-ai-native.md` (PW, SpeakX, YoLearn
prices), `india-incumbents.md`, `china-asia.md` (Gaotu's "tutor job"), `market_size_model.py` (CMS and ASER inputs).

**Evidence tags.** **[V]** read this session at the primary source (report PDF, press release, paper text or publisher
abstract). **[V-abs]** the abstract only. **[S]** secondary: a citation inside a [V] source, a sibling Taxila doc, or
Wikipedia. **[U]** unverified: memory or an assumption. **[D]** derived here by arithmetic from tagged inputs. **[I]**
inference or judgement. **[M]** measured here (script and JSON in this folder).

**Method and limits.** The shared WebSearch budget was used up (200/200) before this report began, so there was no
open web discovery. Evidence came from: direct fetches of known primary documents (PIB CMS:E release, ASER 2024 full
report and annexures, BaSE 2025 full report, NBER Mindspark paper, IZA Azam paper, NCERT School Bag Policy 2020, J-PAL
evaluation page, Sujatha 2014); Crossref, Semantic Scholar and Unpaywall lookups for known Indian shadow-education papers
(abstracts only; Wiley, SAGE, Elsevier, T&F and the HKU repository returned 403); and two Play Store review-mining
scripts written for this report (`tutor_substitution_reviews.py`, `curiousjr_review_themes.py`). Reddit and Quora could
not be fetched, so **no parent-forum corpus is included**. The Play reviews stand in for it and are mostly written by
children. **No Indian survey found here asks parents of class 1-9 children to rank the jobs they hire a tutor for.**
The job weights in §2.4 are therefore inference from revealed behaviour. §9 gives the survey that would replace them.

---

## 0. The answer on one screen

1. **Tuition is normal, not remedial.** 27.0% of students took private coaching in the current academic year (CMS:E
   2025, Apr-Jun 2025; urban 30.7%, rural 25.5%) **[V, PIB]**. In low-resource households in 10 states the figure is 38%
   (BaSE 2025, N = 12,500) **[V]**. Yet 61% of BaSE parents call in-school education "completely sufficient" **[V]**.
   Over 1986-2008, demand was income-inelastic at every stage, "a necessary good" **[V, Azam]**. Parents buy tuition
   because it is part of the schooling package, not because they have diagnosed a deficit.
2. **Parents are not buying measured learning gains.** A Pratham-run after-school group tutoring programme in Delhi
   (6 days a week, about 2-3 h a day, grade-level content) had **no impact on test scores** after a year **[V, J-PAL;
   Mindspark paper]**. 82% of that sample's families had used tuition centres in the past year **[V]**. Whatever keeps the
   neighbourhood tuition market alive, it is not test gains **[I]**.
3. **What they do buy, in order of evidence:** (a) **exam marks and credential competition**: 43% of government-school
   and 40% of private-school class 9-10 students named passing or scoring higher as their reason (Sujatha, n = 4,031)
   **[V]**, and credentialism was "the main driver" in Bengaluru (Ghosh & Bray 2018) **[V-abs]**; (b) **someone who can
   teach what the parent cannot**: 43.2% of rural mothers have no schooling or stopped at Std V or below (ASER 2024)
   **[V]**; (c) **daily homework completion and monitoring**: 83% of at-home help is homework, 51% is monitoring
   schoolwork (BaSE) **[V]**; (d) **supervised, scheduled time**: the typical format is a 1.5-3 h daily group batch
   **[V, Mindspark/Pratham designs]**; (e) **insurance with the school teacher**: 19.8% of class 9-10 tuition was from
   the pupil's own school teacher **[V, Sujatha]**.
4. **Doubt clearing is the most replaceable job, and it is already being replaced.** 73% of children who use GenAI use
   it for doubt solving and practice. A Kerala Grade 10 student: "There is a fear of asking doubts to teachers. But AI
   feels like a friend" (BaSE) **[V]**. Doubt clearing is a feature, not a moat.
5. **"AI is cheaper than a tutor" is false for the median Indian family.** A tuition-taking child costs about ₹401/month
   (rural primary) to ₹894/month (urban middle) **[D from CMS]**. That is **≈ ₹8-34 per hour** of group time at 26-52 h/month **[D]**,
   the same range as PW's reported voice-AI cost (~$0.20/h ≈ ₹18/h) **[S]** and below Taxila's modelled cascaded voice
   (~₹42/h) **[D]**.
   At ₹299-699/month Taxila is **cheaper only than 1:1 home tutors** (UrbanPro median ₹300-400/h ≈ ₹3,900-5,200/month)
   **[M-sibling/D]** **and mass-live tuition** (CuriousJr ₹2,155-2,500/month) **[V-sibling]**.
6. **The cheapest tutor sells the hardest jobs to replace.** Neighbourhood group tuition at ₹400-600/month sells custody,
   routine and homework done: physical, daily, 60-90 minutes. Premium 1:1 tutors sell explanation, personal attention and
   reporting. Those are what AI does best. **Replacement therefore starts at the top of the price ladder and with
   non-consumers. It does not start with the ₹400 neighbourhood didi.** **[I]**
7. **The only rigorous Indian evidence of technology beating tuition is a blend: AI plus a local adult.** Mindspark
   after-school centres (fee set to local tuition, ₹200/month) gave +0.36σ maths and +0.22σ Hindi in 4.5 months (ITT)
   at 58% attendance. A locally hired instructor ran attendance, supervision and "supervised homework support" **[V]**.
   The authors: "the presence of an adult may be essential to ensure student adherence" **[V]**. At home, that adult is
   the parent. In the market it can be a paid local supervisor.
8. **Early AI adopters are tuition users, so the first sale is an add-on, not a replacement.** BaSE "ambitious power
   users" (35% of EdTech users) attend tuition at 64%, against 28% for beginners **[V]**. 37% of EdTech-using families
   (parents answering for ages 6-13, children themselves for 14-18; N = 7,866) say technology "can fully replace
   tuitions" and 51% say it can partially replace or support them **[V]**. Among teachers it is 30% **[V]**. Measure **per-subject
   displacement** (the maths tutor dropped), not whole-tutor replacement.
9. **Geography decides which job you are replacing.** Rural paid-tuition rates in ASER 2024 range from 66-80% (West
   Bengal, Bihar, Tripura, Odisha private) to **3.8-9.1% in Rajasthan** **[V]**. In RBSE-Rajasthan Taxila is a
   **first tutor** (non-consumption). In Bihar it is a **replacement** (Hindi; 66-75% tuition among government
   *and* private pupils) **[I]**.
10. **Not replaceable yet:** physical custody and childcare, the school-teacher relationship, coercive discipline,
    hands-on project and craft homework for young children, and checking Hindi handwriting (Azure has no Hindi
    handwriting OCR, SS4) **[S-sibling]**. Do not market against these. Route them to the parent, or later to a human
    supervisor layer.

### Proposed decisions (each with a reversal condition; §8 has the full set)

| # | decision | why | what would reverse it |
|---|---|---|---|
| TS1 | **Launch position: "the teacher who explains, checks and reports", sold beside tuition, not "replace your tutor"** | Power users are tuition users (64%) [V]; demand is necessary and inelastic [V]; replacement of the custody job is impossible at home [I] | ≥ 25% of paying families report dropping all tuition by day 90 with no fall in homework completion |
| TS2 | **Beachheads: (a) families with no tutor (first-tutor), (b) premium 1:1 and mass-live buyers (subject displacement)**; not low-income families with ₹400 group tuition | price ladder §1.3 [D]; Berry: ₹100 price cut take-up by 25% [V] | a ₹199-299 rural cohort shows ≥ 40% day-90 retention and ≥ 20% tutor drop |
| TS3 | **Own the replaceable jobs end-to-end before claiming replacement:** doubt clearing, explanation, practice, exam readiness, parent reporting | §3 matrix | none; order changes only if §9 survey ranks differ |
| TS4 | **Homework is a Phase-1 job (photo + school sync + ladder + "done" status), never answer output** | homework is the #1 home-support job (83%) [V]; integrity (SS7) [S] | ≥ 30% of churn reasons cite "homework not getting done" → speed up the ladder, never relax the leak guard |
| TS5 | **Voice minutes are budgeted (~20-30 min/day); the rest of a tuition-length slot is non-voice practice and notebook work** | voice cost per tuition-hour exceeds group-tuition price [D]; phone time ~0.9-1.6 h/day [V] | voice cost falls below ₹10/h on Azure first-party models |
| TS6 | **Phase-3 option: B2B2C "Taxila room", one local supervisor with 15-20 children** | Mindspark design is the evidence [V]; human-only group tuition had zero effect [V] | home-only cohorts match room cohorts on attendance and test gains |

---

## 1. What is being replaced: size, geography, price, format

### 1.1 Incidence

| source | population | paid tuition / coaching | tag |
|---|---|---|---|
| CMS:E 2025 (NSS, Apr-Jun 2025) | all students, India | **27.0%** "taking or had taken" this academic year; urban 30.7%, rural 25.5% | [V, PIB 26 Aug 2025] |
| CMS:E 2025 by level (all areas) | primary / middle / secondary | **22.9% / 29.6% / 37.8%** (urban 26.6 / 31.0 / 40.2) | [S: sibling read the PIB charts, `market_size_model.py`] |
| ASER 2024 (rural, Sep-Dec 2024) | Std I-V govt / pvt; Std VI-VIII govt / pvt | **30.4 / 28.5; 32.9 / 24.5** (2018: 24.8 / 26.6; 29.7 / 23.8) | [V, Annexure 3] |
| BaSE 2025 (CSF; 12,500 households, 10 states, govt + affordable private) | children grades 1-12 | **38%** (private-school 42%, govt 35%; no difference by gender, settlement or grade) | [V] |
| IHDS 2012 | ages 11-17 | 43% | [S, via Mindspark paper] |
| Sujatha 2014 (2005-06 data, 49 schools, 4 states) | class 9-10 | 44.7% (class 9: 32%, class 10: 58.8%) | [V] |

Rural tuition rose between 2018 and 2024, mainly in government primary schools (+5.6 pp) **[V]**. CMS counts
"taking or had taken" in a survey run Apr-Jun, at the start of the academic year; ASER counts "takes tuition" in Sep-Dec. ASER runs
higher **[S, sibling calibration]**.

### 1.2 Geography: the tuition belt is east, not the Hindi heartland (ASER 2024, rural, % paid tuition)

| state | Std I-V govt | Std I-V pvt | Std VI-VIII govt | Std VI-VIII pvt | what Taxila is there [I] |
|---|---|---|---|---|---|
| West Bengal | 73.8 | 70.9 | 79.9 | 75.9 | replacement (needs Bengali) |
| Tripura | 67.0 | 81.0 | 75.0 | 78.8 | replacement (needs Bengali) |
| Bihar | 66.3 | 67.9 | 75.1 | 66.6 | **replacement, in Hindi** |
| Odisha | 54.7 | 78.5 | 59.5 | 75.3 | replacement (needs Odia) |
| Jharkhand | 44.8 | 48.2 | 52.1 | 46.1 | replacement, in Hindi |
| Uttar Pradesh | 17.5 | 26.8 | 15.9 | 24.8 | mixed |
| Madhya Pradesh | 13.0 | 14.9 | 15.3 | 15.5 | mostly first tutor |
| **Rajasthan (RBSE)** | **3.8** | **9.1** | **4.7** | **8.3** | **first tutor** |
| All India (rural) | 30.4 | 28.5 | 32.9 | 24.5 | — |

All rows **[V, ASER 2024 Annexure 3]**. In Bihar and West Bengal, government-school primary children take tuition at
rates *equal to or above* private-school children. There, tuition is a substitute for school teaching, not a top-up for
the affluent **[I]**. Urban rates are not in ASER.

### 1.3 The price ladder a family actually faces

| tutor type | what the family pays | per hour of the child's time | source |
|---|---|---|---|
| Average coaching spend per **taking** child, rural primary | ₹4,810/yr ≈ **₹401/mo** | ≈ ₹10-15/h at 26-39 h/mo | [D from CMS spend ÷ incidence] |
| same, all-India primary / middle / secondary | **₹478 / ₹616 / ₹922 per month** | ≈ ₹12-24/h (primary-middle); up to ₹35/h (secondary) | [D] |
| same, urban primary / middle / secondary | ₹660 / ₹894 / ₹1,365 per month | — | [D] |
| Pratham / Mindspark-benchmarked group tuition, Delhi low-income, 2014-15 | ₹200/mo for 6 days × 1.5-3 h | ≈ ₹3-5/h | [V; per-hour D] |
| 1:1 home tutor, UrbanPro listings (class 6: T1 ₹375, T2 ₹298, T3 ₹300; class 9: ₹400 / ₹350 / ₹300 median per hour) | ≈ **₹3,900-5,200/mo** at 3 h/week | ₹300-400/h | [M-sibling, `urbanpro_fees_2026-10-02.json`, listing prices] |
| Mass live online (CuriousJr class 6 Power Batch, 400-500 per batch + mentor) | ₹30,000/yr ≈ **₹2,155-2,500/mo** | — | [V-sibling, india-ai-native] |
| PW online ARPU | < ₹4,000/yr, "₹10 per day cost of tutoring" | — | [V-sibling, PW transcript] |
| **Taxila planned band** | **₹299-699/mo** | — | [S-sibling] |

Notes. CMS reports "average annual household expenditure on private coaching per student" (urban ₹3,988, rural ₹1,793;
from ₹525 at pre-primary to ₹6,384 at higher secondary) **[V]**. Dividing by incidence assumes the average is over all
enrolled students. That is how the sibling model reads it **[S]**. The release does not say how much of the year the
spend covers **[U]**. If it covers part of a year, the monthly figures above are underestimates. The 26-39 hours/month
range assumes daily 1-1.5 h batches **[U; Mindspark/Pratham designs are 1.5-3 h × 6 days, V]**. The sibling comparator
of "human 1:1 ₹800-1,030/h" (`orchestration-architecture.md` §9.1) is a premium-online rate. It is about 2.5× the
UrbanPro median, so use the UrbanPro range for the mass market.

**Taxila at ₹299 is 0.75× the rural-primary tuition spend. At ₹499 it is 1.04× the national-primary spend. At ₹699 it
is 1.46× national primary, 0.32× CuriousJr and 0.16× a 1:1 home tutor** **[D]**. Taxila undercuts only the expensive
end.

### 1.4 Format and provider

- **Daily, in groups, after school.** Mindspark's intensity and fee were "designed to be comparable to after-school
  private tutoring, typically conducted in groups of students, which is common in India" **[V]**. Pratham's centres ran
  3 h, six days a week, with classes segregated by gender **[V, J-PAL]**.
- **Who provides (class 9-10, 2005-06):** tutorial or coaching centres 77.1%, the pupil's **own school teacher 19.8%**,
  home tuition 3.1% **[V, Sujatha]**. School teachers tutoring their own pupils is common even though the RTE Act
  prohibits private tuition by teachers for ages 6-14 **[S, Wikipedia RTE]**. In Nepal, teachers who tutor cover less
  material in class to create demand, and are 7.1 pp less likely to teach the full period (Jayachandran 2014) **[S, via
  Azam]**. In West Bengal, "substantial proportions of shadow education emanate from and are fostered by school
  systems" (Ghosh & Bray 2020, qualitative) **[V-abs]**.
- **Mathematics dominates:** 94.8% of rural and 88.8% of urban class 9-10 tuition takers were tutored in maths
  **[V, Sujatha]**.
- **Role changes with grade:** private tutoring "progressively expands from the lower to the higher grades" and by
  Classes 11-12 "seems to supplant rather than supplement" school (Bhorkar & Bray 2018, urban Maharashtra) **[V-abs]**.
  Provider roles are complementary, accommodating, competing or substitutive, and "dynamic … blurred" (Bhorkar 2023,
  37 providers) **[V-abs]**.

### 1.5 Demand properties that shape substitution

| property | evidence | implication for Taxila [I] |
|---|---|---|
| Necessary good, income-inelastic, persistent since 1986-87 | Azam (NSS 42nd, 52nd, 64th rounds) **[V]** | demand will not disappear; it can be redirected |
| Large share of education spend for takers | tutoring was 47.5% (primary) and 41.7% (middle) of private education spending for takers in 2007-08 **[V, Azam]** | the wallet exists. Taxila must displace part of it, not add to it |
| Price-elastic at low income | free → 69% take-up; ₹100 cut enrolment by ~17 pp (25%); higher prices meant +6 pp attendance but +12 pp dropout after 2-3 months (Berry & Mukherjee, n = 5,439, Delhi) **[V, J-PAL]** | rural price ≤ ₹299; churn shows up at month 2-3 |
| Pro-male bias | lower willingness to pay for girls (by ₹10, Berry) **[V]**; pro-male bias in both decisions (Azam) **[V]**; pro-girl at ages 15-20 in West Bengal (Sengupta & Ghosh 2022) **[V-abs]** | an at-home AI may reach girls whom families do not send out [I; measure by gender] |
| Rises with stakes | 22.9% primary → 37.8% secondary (CMS) **[S]**; class 9 32% → class 10 58.8% **[V, Sujatha]**; tutoring rose near annual exams (Mindspark controls) **[V]** | class 8-9 and exam months carry the highest willingness to pay |
| Complement to school-type choice | WTP for tutoring ₹50 lower when the child is in private school **[V, J-PAL]** | private-school parents treat school fees and tuition as one budget |

---

## 2. What parents buy: the jobs, and the evidence for each

### 2.1 Stated reasons

**Sujatha 2014, class 9-10, 4 states, 2005-06, n = 4,031, reasons given by students** **[V]**:

| reason | govt / aided | private unaided |
|---|---|---|
| to pass examinations | **43%** | 1% |
| higher marks / edge over others | 10% | **40%** |
| do not understand teaching at school | 27% | 18% |
| teachers do not teach well | 12% | 7% |
| friends also go | 11% | 18% |
| parents' decision | 7% | 16% |

The author on parents: "a growing feeling of inability to academically guide their children" and "for many a
middle-class parent, association of their wards in reputed private tutorial/coaching centers is a matter of social
prestige" **[V]**. These are student answers, 20 years old, for classes 9-10 only. Nothing comparable was found for
classes 1-8.

**Ghosh & Bray 2018 (Bengaluru, grades 8-10, survey n = 687 + 51 interviews, two boards):** "Competition emanating
from credentialism was the main driver", with no difference between the lighter and heavier board **[V-abs]**. **Ghosh &
Bray 2020 (West Bengal, qualitative):** schools are "breeding grounds" for tutoring **[V-abs]**. **Kumar, Pandita &
Singh 2024** ("'To be on the seventh sky': … key factors in Indian parents' choice for shadow education", *Education
3-13*) and **Bhorkar 2026** ("double whammy … hierarchical access and provisioning of private tutoring in India",
*Compare*, CC-BY) are the two most on-point recent papers. Both titles were verified via Crossref. **Neither could be
read (403)** **[U, content]**. Read these first when access allows.

### 2.2 Revealed behaviour (stronger than stated reasons)

| observation | evidence | which job it points to [I] |
|---|---|---|
| Grade-level group tuition of the common kind showed no test effect, yet tuition-centre use was near-universal in the same population | Pratham tutoring: no impact on maths or language after a year; 82% of the sample's families had used tuition centres in the past year [V] | not learning gains: custody, routine, homework, "doing something" |
| 61% call school "completely sufficient", yet 38% pay for tuition | BaSE [V] | tuition is part of normal schooling, not a repair |
| Parents cannot help academically | rural mothers in 2024: 29.4% no schooling, 13.8% Std I-V, 37.3% Std VI-X, 19.5% above Std X; Rajasthan 44.8% and UP 39.5% no schooling [V, ASER Annexure 6] | "someone who can teach what I cannot": explanation, doubts, checking |
| Home help is mostly homework | 87% get home support (mother 64%, father 48%); of these, homework 83%, studying/doubts 60%, checking what was done in school 51%, learning activities 31% [V, BaSE] | homework completion and monitoring is the household job that tuition takes over |
| Homework load is large by Class III | in the School Bag Policy survey, students reported 0-2 h/day in Classes I-II and **2-5 h/day from Class III** (self-report), against a policy of ≤ 2 h/week for III-V and ≤ 1 h/day for VI-VIII [V, NCERT 2020] | a daily homework-completion service has real demand |
| AI users are tuition users | BaSE power users: 64% tuition, 91% "better than peers" [V] | first sale is an add-on; replacement is per subject |
| Doubt-solving is already moving to AI | 35% of EdTech-using children use GenAI; 69% of them daily; 73% for doubt solving and practice; drivers: easy explanations 45%, speed 41%, "feels like chatting with a person" 40% [V, BaSE] | doubt clearing is the first job to go |

### 2.3 Parent voice from Play reviews [M]

`tutor_substitution_reviews.py` pulled the newest ≤ 1,000 reviews per app for 12 Indian K-12 apps: **11,245 reviews**,
mostly May-Oct 2026 (Cuemath and Infinity K5 go back further). Only **183 (1.6%) are parent-voiced** by a regex ("my
son/daughter", "as a parent", "meri beti"…). Among those 183, marks or exams appear in 18.6% (mean ★4.06), doubts or
explanation in 8.7% (★4.50), **parent updates/reports in 4.9% (★3.44)**, teacher bond or attention in 4.9% (★4.56),
routine or discipline in 3.8%, homework in 2.2%, and tuition comparison in 1.1%. Across all 11,245 reviews,
parent-update mentions carry the **lowest mean rating (★2.97, n = 107)**: reporting is a promise apps break. Only
**41 reviews mention tuition at all**, and only one says "no need of tuition" **[M]**. Read these as weak relative
signals: the sample is self-selected and the regex is crude.

`curiousjr_review_themes.py`, CuriousJr only (PW live tuition for classes 1-9), 2,000 reviews, 22 May-1 Oct 2026, ★4.65
**[M]**: teacher/sir/ma'am 14.6%, **mentor 6.6%**, doubt 3.8%, tests/marks 2.7%, PTM/parent 1.4% (★3.89), fee/EMI 1.0%
(★3.75), 1:1/personal 0.9%. The market leader for classes 1-9 has already split the tutor into **teaching at 1:500**
plus a **mentor for accountability, homework and doubts**, and reviewers name the mentor about half as often as the
teacher. Representative short excerpts from public reviews (trimmed, no names): "dedicated mentors who take your ward's
educational progress as a personal responsibility rather than a professional obligation"; "helps my child stay
connected with classes, complete homework, and revise"; "all things are available like live, homework, PTM"; "School
fee + tuition fees = high fee together is burden for parents" **[M, Play, Sep 2026]**. In school-linked apps (LEAD,
Infinity K5) the low-star reviews that mention homework are about **homework not being updated or hard to find**: homework sync is
a hygiene factor **[M]**.

### 2.4 Synthesis: the jobs, with estimated weight by class band

Weights are **[I]**: judgement from §1-§2, ranked within each band (H high, M medium, L low). §9 replaces them with data.

| # | job the parent hires the tutor for | 1-2 | 3-5 | 6-8 | 9 | strongest evidence |
|---|---|---|---|---|---|---|
| J1 | **Homework done** (daily, checked, notebook complete, school teacher satisfied) | M | **H** | H | M | BaSE 83%; School Bag 2-5 h/day; LEAD/Infinity reviews |
| J2 | **Exam marks / pass / rank** (unit tests, half-yearly; class 9 internals) | L | M | **H** | **H** | Sujatha 43%/40%; Ghosh & Bray credentialism; CMS rise with level |
| J3 | **Someone who can teach what I can't** (explanation, doubts) | M | **H** | **H** | H | ASER mothers' schooling; Sujatha 18-27% "don't understand at school" |
| J4 | **Discipline, routine, accountability** (sits daily, a "strict" adult) | H | H | M | M | BaSE monitoring 51%; Mindspark instructor's role; CuriousJr mentors |
| J5 | **Safe, supervised time** (occupied 1-3 h, near home, while parents work) | **H** | H | M | L | daily 1.5-3 h group format [V]; India-specific demand **unmeasured [U]** |
| J6 | **Parent communication** (how is she doing, what to do) | M | M | M | M | parent-update reviews ★2.97; PTM in CuriousJr; Kraft & Rogers [V-sibling] |
| J7 | **Test prep / exam-season cramming** | L | M | M | **H** | Mindspark: tutoring rises near annual exams; class 10 58.8% |
| J8 | **Insurance with the school teacher** (tuition from own teacher; internals) | L | L | M | **H** | Sujatha 19.8%; Ghosh & Bray 2020; Jayachandran |
| J9 | **Social norm and prestige** ("friends go", reputed centre) | L | M | M | M | Sujatha 11-18%; prestige quote |

---

## 3. Substitution matrix: what AI can replace now, with features, or not yet

| job | what the human tutor actually does | AI now? | product features required | hard blockers | already designed in | metric that proves substitution |
|---|---|---|---|---|---|---|
| **J3 explanation and doubts** | re-explains the chapter in Hindi; answers doubts | **Yes**: core; children value that AI does not judge them (BaSE quote; PW transcript) [V/S]; only 2% of GenAI-using children do not prefer AI tools [V] | Hindi-English voice; several explanations per concept; misconception diagnosis; grounding in verified kits | hallucinated maths (keys needed: "a model never grades"); class 1-2 voice-only literacy | learning-science; school-sync SS5/SS9; kits | share of doubts closed without a human; re-ask rate; correct-on-own follow-up item |
| **J2 marks** | drills the school's test format; notes; "important questions" | **Partly**: practice and spaced revision can beat typical tuition (Berry 0 vs Mindspark +0.36σ) [V] | exam calendar (datesheet photo); chapter readiness; school-format mock papers; written-answer practice with photo check; graded-test ingestion | cannot touch internal marks; presentation and handwriting; Hindi handwriting OCR gated (SS4) | need-goals §4.4; school-sync §6-§7 | school test score before/after (photo of the graded paper, teacher's mark as truth, SS10) |
| **J7 exam-season prep** | extra sessions before exams | **Yes, with a mode** | exam-season plan; daily revision queue; sample papers; parent "exam week" card | compute spike in Feb-Mar and Sep [I] | day-cycle §1.1 habit breakers | exam-window retention; mock-to-school score correlation |
| **J6 parent communication** | tells the parent what happened; a monthly "PTM" | **Yes, likely better than most humans**: consistent and ledger-based | weekly Hindi voice note and WhatsApp card; monthly PTM call; "homework done" status; alerts on missed sessions | trust in an AI's judgement; must always disclose AI (PL2) | parent-experience §8-§9; parent-loop §5, §7 | report open rate; parent replies; Bergman-style behaviour change (attendance, homework) before score change |
| **J1 homework done** | sits beside the child until the homework is finished; often supplies answers [U] | **Partly; needs features** | photo capture of diary/worksheet; school sync (class WhatsApp screenshots, timetable); the HL ladder; a "done ✓" list per day; "check my working"; parent sign-off | integrity: Taxila never outputs the answer (SS7). Parents may want "done" over "learned". Craft and project homework needs hands. Hindi handwriting checking blocked (SS4) | school-sync §5; need-goals §6 | % of school homework items finished by the child on time (parent-confirmed); parent "homework stress" item |
| **J4 discipline and routine** | fixed time and place; an adult who checks; mild sanction | **Weak alone**: AI can schedule, call and report, not compel. Mindspark attendance was 58% even with a free voucher and an adult instructor [V] | anchor slot as if-then (DC1); voice "call" at slot time; missed-session alert to the parent; weekly regularity count; parent as home supervisor (5-minute check); sibling mode | no physical presence; no streaks or loss framing (MH-D6); a "strict" register conflicts with the relational OS and child safety | day-cycle DC1, DC8; motivation-habits MH-D2 | days with a session per 28 days (r = 0.83-0.88 reliable, MH-D2); share started without a parent prompt |
| **J5 supervised time** | physical custody for 1-3 h near home | **No** | at most "AI-orchestrated offline time": the child works in a notebook while an audio tutor checks in (low screen) | custody is physical; screen guidance (IAP < 2 h/day for ages 5-10) [S]; phone available only ~0.9-1.6 h/day [V] | — | not a target metric; track as a churn reason |
| **J8 school-teacher insurance** | keeps the school teacher's goodwill; internal marks | **No**, and should not try | none. Never contradict the school teacher (SS11) | relational and political good; tuition by school teachers persists despite the RTE ban and state bans (19.8% of class 9-10 tuition) [V/S] | school-sync SS11 | — |
| **J9 social norm / prestige** | "reputed" centre; peers attend | **Partly** | visible chapter progress; a shareable monthly card; sibling and family plan | needs brand time | parent-experience §8 | referral rate |

**What the matrix says [I].** Four jobs are replaceable by AI with features that are mostly already designed: J3, J2,
J7 and J6. They are what a premium 1:1 tutor sells. J1 is replaceable only with the school-sync and photo pipeline, and
only for parents who accept "done by the child". Its main risk is policy (no answers), not technology. J4 is replaceable
only *through the parent*. J5 and J8 are not replaceable. **For classes 1-5, three of the top four jobs (J1, J4, J5) are
the hard ones. For classes 6-9, three of the top four (J2, J3, J7) are the easy ones.** Substitution will therefore
come first in classes 6-9, which conflicts with any plan to win primary first.

---

## 4. Economics: why the voice tutor cannot simply fill the tuition hour

**Cost of voice minutes per month (26 days)** **[D]**. Per-hour inputs: PW reported ~$0.20/h **[S]**; Taxila's modelled
cascaded lite mode $0.35 per 45 min, gpt-realtime-2.1-mini $0.96 and gpt-realtime-2.1 $3.9 per 45 min
(`orchestration-architecture.md` §9.1) **[S-sibling]**; ₹90/$ **[U]**.

| voice stack | 20 min/day | 40 min/day | 90 min/day (a tuition-length slot) |
|---|---|---|---|
| PW-level (~$0.20/h) | ₹156 | ₹312 | ₹702 |
| Taxila cascaded lite | ₹364 | ₹728 | ₹1,638 |
| realtime-mini | ₹998 | ₹1,997 | ₹4,493 |
| realtime (full) | ₹4,056 | ₹8,112 | ₹18,252 |

Against a ₹299-699 price and a ₹401-616 incumbent, **a 90-minute daily voice slot is unaffordable on every Taxila stack**.
Only a PW-level cost reaches parity, and even then the contribution margin is zero **[D]**. The tuition hour is cheap
because one human supervises 15-20 children. Voice AI is billed per child-minute. Consequences **[I]**:

1. **Budget voice at about 20-30 minutes a day** (cascaded by default). Fill the rest of the slot with near-zero-cost
   modalities: generated practice, games, reading, and notebook work checked by photo.
2. **Phone time is the second constraint.** BaSE: the child gets the phone for ~0.9 h/day (beginners, ages 6-13) to
   ~1.6 h/day (adolescents) **[V]**. 72% of children access the household smartphone, and for 68% it is shared
   **[S-sibling, parent-experience §1.1]**. A tuition-length
   screen session for a 7-year-old breaks both the device budget and IAP screen guidance. Design an "audio while
   writing" mode for classes 1-5.
3. **The family plan is a structural edge over tuition [I].** A tutor charges per child. Taxila's marginal cost per
   sibling is voice minutes only. Price a second child at ≤ 50%, so a two-child household's bill falls below one
   neighbourhood tuition.
4. **Where Taxila wins on price:** against 1:1 home tutors (0.07-0.16× their cost) and mass-live tuition (0.14-0.32×)
   **[D]**. That is the urban and premium beachhead, and it is also the segment whose jobs (J3, J2, J6) are most
   replaceable.

---

## 5. What the Indian evidence says about technology replacing tuition

| study | design | result | what it means for substitution |
|---|---|---|---|
| **Mindspark centres, Delhi** (Muralidharan, Singh & Ganimian; NBER w22923 / AER 2019) | lottery, n = 619, grades 6-8; 45 min adaptive software + 45 min instructor-led group, 6 days/wk; fee ₹200/mo "benchmarked to … private tutoring in the vicinity" | ITT **+0.36σ maths, +0.22σ Hindi** in 4.5 months (IV for 90 days: 0.59 / 0.36); average attendance 58% (≈ 50 of 86 days); no differential change in other tutoring [V] | the replacement unit with evidence is **AI teaching plus a cheap local adult**. The adult handled attendance, monitoring and "supervised homework support" [V] |
| **Pratham after-school tutoring, Delhi** (Berry & Mukherjee) | price RCT, n = 5,439, upper primary, 21 neighbourhoods; ₹0-250/mo | **no test-score impact**; strong price sensitivity; dropout at months 2-3 [V, J-PAL] | grade-level human group tutoring is a weak learning product; the incumbent is beatable on learning, not on custody |
| **Mindspark Rajasthan** (NBER w34205, Sep 2025) | at 20× the original trial's scale | +0.22σ maths, +0.20σ Hindi in 18 months; "gains proportional to student time on the platform" [V-sibling] | dosage drives effect. Time-on-task is the key operating metric, and in RBSE the AI is the first tutor |
| **ASER data** (Dongre & Tewary 2015) | observational, rural | positive effect of tutoring on learning levels, grades I-VIII [S, via Azam] | typical tutoring is not worthless; selection is unresolved |
| **Jha 2021 review** | literature review | "neither 'positive' nor 'null' effect"; "toxic by-products" for school [V-abs] | the learning case for tuition is contested |
| **Kumon/Sylvan chains, US** (Goodman & Nitkin, NBER w35671, Aug 2026) | staggered DiD | district-wide +0.02-0.03σ when the first chain centre opens; users concentrated in the top income decile [V-abs] | worksheet-routine centres move scores a little; the effect is mostly a routine product |
| **LLM tutoring generally** | RCTs reviewed in `learning-science.md` | human-in-the-loop studies dominate positive results; **no RCT of fully autonomous LLM tutoring for young children** [S-sibling] | "replace the tutor" is an untested claim. Do not make it in marketing before Taxila's own pre-registered study (china-asia §14.6) |

---

## 6. What cannot be replaced yet, and what to do instead

| job / element | why AI cannot do it (now) | what to do instead [I] |
|---|---|---|
| Physical custody and childcare (J5) | needs a body in the room; screen guidance limits young children | do not sell it. Anchor "after tuition" or "after tea" (DC1). Later: the B2B2C room (TS6) |
| Coercive discipline (J4, partly) | no sanction power. A "strict" AI conflicts with the relational OS and the child-safety floor | make the parent the enforcer: a 5-minute "home supervisor" check, missed-session alerts, weekly regularity |
| School-teacher insurance (J8) | relational and political; the school teacher controls internal marks | never compete; never contradict the teacher (SS11); a neutral "worth asking" note to the parent only |
| Hands-on project and craft homework (J1, classes 1-5) | materials, scissors, glue, models | plan the project step by step and narrate while the child makes it; never produce it (school-sync §1.1) |
| Hindi handwriting checking | no Azure first-party Hindi handwriting OCR; VLMs "fix" errors 42-66% of the time | read-aloud fallback through ASR (SS4); measure M-SS1 before enabling |
| A human face for parents who require one | some parents will not trust an AI's judgement; disclosure is mandatory | monthly AI PTM. A later option: a human mentor add-on (CuriousJr pattern) for a fee |
| Credential competition itself (J2's relative part) | marks are a rank game; Taxila cannot promise rank | promise skills ("9 of 12 skills pakka"), never rank or marks (PX) |

---

## 7. The "replace tutors" roadmap

| phase | positioning | target segment | jobs owned | features that must exist | gate to the next phase (measure as in §9) |
|---|---|---|---|---|---|
| **P0 launch (0-6 mo)** | "your child's own teacher: explains, checks, reports", sold **beside** tuition | (a) no-tutor families (Rajasthan, MP, UP-west: first tutor); (b) urban class 6-9 families paying a 1:1 maths tutor or for mass-live | J3, J2 (practice and readiness), J6, J7 | voice tutor with kits; placement; chapter readiness; weekly Hindi voice report; monthly PTM; exam calendar | day-90 retention ≥ 35% (sibling baseline: month-3 retention 30-35%, SpeakX ~30% monthly paid) [S]; ≥ 15% of tuition-paying families drop at least one subject tutor |
| **P1 homework (6-12 mo)** | "homework done, by the child, every day" | add Bihar/Jharkhand government-school families with group tuition; class 3-8 | **J1**, J4 via the parent | diary/worksheet photo capture; class WhatsApp screenshot ingestion; HL ladder with leak guard; daily "done ✓" card; anchor-slot voice call; missed-session alert; family plan | parent-confirmed homework completion ≥ 80% of school days; ≥ 25% of tuition families drop all tuition with no fall in completion → enables TS1 reversal |
| **P2 accountability layer (12-24 mo)** | "a teacher plus a guardian" | primary (1-5) | J4, part of J5 | parent "home supervisor" mode; sibling mode; optional paid human mentor (1:many, CuriousJr pattern); audio-while-writing mode for classes 1-5 | regularity ≥ 16 of 28 days for the median child; mentor add-on attach ≥ 10% without hurting retention |
| **P3 replace (24 mo+)** | "replaces tuition" (only with evidence) | all; B2B2C rooms with local supervisors in tuition-belt towns | J5 via the room, J2 claims | pre-registered third-party study (≥ 0.2σ on independent tests over 12-18 mo, the Mindspark bar); outcome guarantee on chapter tests; board-exam extension (class 10) | published effect; room cohorts ≥ home cohorts on attendance |

Ordering logic **[I]**: claim replacement for a job only after the in-product metric shows it is done at least as
well as tuition does it. Lead with the jobs where AI is better (J3, J6) and cheaper (vs 1:1). Add the jobs that need
the school-sync pipeline (J1). Treat custody (J5) as a channel problem (rooms), not a software problem.

---

## 8. Decisions to log (proposed ids for `context/inbox/`, each with a reversal condition)

| id | decision | rationale | reversal condition |
|---|---|---|---|
| TS1 | Launch as a complement to tuition, not a replacement claim | power users = tuition users (64%); demand inelastic; custody is unreplaceable at home | ≥ 25% of paying families drop all tuition by day 90 with homework completion ≥ 80% |
| TS2 | Beachheads: first-tutor families plus premium 1:1 / mass-live displacement; not ₹400 group-tuition households at launch | price ladder (§1.3); Berry price elasticity | a ₹199-299 rural cohort reaches ≥ 40% day-90 retention and ≥ 20% tutor drop |
| TS3 | Replacement is measured **per job and per subject**, never as one "replaced tutor" flag | jobs differ in replaceability (§3) | none (measurement design) |
| TS4 | Homework (J1) enters at P1 through photo + school sync + ladder + "done ✓"; the no-answer rule never relaxes | 83% of home help is homework; integrity floor SS7 | churn surveys: ≥ 30% cite homework → change ladder speed and parent visibility only |
| TS5 | Voice budget ~20-30 min/day by default; tuition-length slots filled with non-voice modalities | §4 cost table; phone ~0.9-1.6 h/day | Azure first-party voice < ₹10/h measured, and screen-time evidence allows more |
| TS6 | Family plan: second child ≤ 50% | per-child tuition vs near-zero marginal cost [I] | sibling plans cannibalise > 30% of single-child revenue with no retention gain |
| TS7 | Geographic order: Hindi-belt first-tutor states plus Bihar/Jharkhand as the Hindi replacement market; Bengali/Odia later | ASER 2024 state table | §9 survey shows Rajasthan/MP non-users will not pay ≥ ₹199 |
| TS8 | No "replaces tuition" marketing claim before a pre-registered independent result | no autonomous-LLM RCT for children; China's anxiety-marketing failure (china-asia §12) | an independent evaluation reports ≥ 0.2σ |

---

## 9. Measurement plan: replacing the inference in §2.4 with data

**A. Jobs-to-be-done survey (before the P0 build freezes).** n ≥ 400 parents: 3 states (Bihar, Rajasthan, UP) × tuition
users and non-users × class bands 1-2, 3-5, 6-8, 9. Voice-administered in Hindi. Items:
1. Does the child take tuition? Subjects, hours/day, days/week, group size, fee, who the tutor is (school teacher /
   neighbour / centre / online).
2. **Allocate 10 coins across J1-J9** ("what you pay the tuition for"). Then: "if the tutor stopped doing X but kept
   everything else, would you keep paying?" for each job (a deletion test).
3. Who checks homework now; what time the phone is free; whether a working adult is home at 4-6 pm (sizes J5).
4. Would you drop the tutor for an AI teacher at ₹199 / ₹299 / ₹499 / ₹699 (Gabor-Granger), per subject?
5. "What would make you trust a report from an AI teacher?" (open, voice).
Log with n, method and date in `context/measurements.md`.

**B. In-product substitution metrics (from day 1).**
- `tuition_status` per subject at onboarding and every 30 days (parent tap): `none / keeps / reduced / dropped`.
  Report the tutor-drop rate per subject at day 90.
- Homework completion: school items captured vs marked done by the child, parent-confirmed.
- Regularity: sessions per 28 days; share started by the child (MH-D2, MH-D4).
- School test delta: graded paper photos, teacher's mark as truth (SS10). Compare chapters covered in Taxila with
  chapters not covered (within-child).
- Churn reason taxonomy, mapped to J1-J9.

**C. Gates.** TS1 reverses when B shows ≥ 25% all-tuition drop with completion ≥ 80%. P1 → P2 needs regularity
≥ 16/28 for the median child. P3 needs the external study.

---

## 10. Tensions with existing Taxila docs, and open questions

1. **Tuition as anchor vs tuition as target.** `day-cycle.md` says "tuition is an anchor candidate, not a competitor".
   The owner's goal is to replace tutors. Both hold if phased: P0-P1 coexist and displace subjects; P2-P3 replace.
   This resolves it. The owner should confirm the order.
2. **"Homework help is not a parent feature"** (parent-experience §1.2) versus J1 being the top home job. Recommend
   making *homework status* (done, stuck, ask the teacher) a parent feature while help itself stays child-side and
   answer-free.
3. **Primary first vs 6-9 first.** For classes 1-5, three of the top four jobs (J1, J4, J5) are hard; for classes
   6-9, three of the top four (J2, J3, J7) are easy (§3). If the build starts at primary, its value proposition must be
   "first tutor + homework + report", not "replace tuition".
4. **Reference period of CMS spend** (annual vs partial academic year) **[U]**. Read the MoSPI report tables before
   using ₹401-922/month in pricing.
5. **2024 coaching-centre guidelines.** These reportedly restrict under-16 enrolment in centres. Do they push class
   1-9 demand to home tutors, online or AI? Do they cover online AI tutoring? **[U]**, shared with `india-incumbents.md`
   and `china-asia.md`.
6. **Gender.** Families pay less to tutor girls (Berry, Azam). Does an at-home AI change girls' access? Stratify B by
   gender.
7. **Unread papers:** Kumar, Pandita & Singh 2024; Bhorkar 2026; Ghosh & Bray 2020 full text; Bhorkar & Bray 2018
   full text; Dongre & Tewary 2015; the Pratichi education reports (Wikipedia cites 60% of primary pupils in West
   Bengal tutored **[S]**). **Highest-value gap:** a parent-side ethnography of Hindi-belt home tutors (shared with
   need-goals §12).

---

## 11. Sources

Primary documents read this session
- MoSPI/NSO, *Comprehensive Modular Survey: Education 2025* (Apr-Jun 2025), PIB release, 26 Aug 2025 — https://www.pib.gov.in/PressReleasePage.aspx?PRID=2160863 [V]; sample 52,085 households / 57,742 students via Careers360 — https://news.careers360.com/27-of-students-rely-on-private-coaching-urban-participation-higher-cms-education-survey-2025/amp [S]
- ASER Centre, *ASER 2024* full report, Annexure 3 (paid tuition by school type) and Annexure 6 (mothers' schooling), digital-literacy section — https://asercentre.org/wp-content/uploads/2022/12/ASER_2024_Final-Report_13_2_24.pdf [V]
- Central Square Foundation, *BaSE: Bharat Survey for EdTech 2025* (12,500 households, 2,500 teachers, 10 states) — https://www.edtechbase.centralsquarefoundation.org/BaSE%20Report%202025.pdf ; landing page https://www.edtechbase.centralsquarefoundation.org/base-2025 [V]
- Muralidharan, K., Singh, A., & Ganimian, A. *Disrupting Education? Experimental Evidence on Technology-Aided Instruction in India*, NBER w22923 — https://www.nber.org/system/files/working_papers/w22923/w22923.pdf [V] (published AER 109(4), 2019)
- J-PAL, *Pricing of Private Education in Urban India: Demand, Use and Impact* (Berry & Mukherjee) — https://www.povertyactionlab.org/evaluation/pricing-private-education-urban-india [V]; AEA RCT registry 10.1257/rct.652 [S]
- Azam, M. (2016). Private tutoring: evidence from India. *Review of Development Economics* 20(4), 10.1111/rode.12196; IZA DP 8770 — https://docs.iza.org/dp8770.pdf [V]
- Sujatha, K. (2014). Private tuition in India: trends and issues. *Revue internationale d'éducation de Sèvres*, colloque 2014 — https://journals.openedition.org/ries/3913 [V]
- NCERT/MoE, *Policy on School Bag 2020* — https://ncert.nic.in/pdf/Final%20School%20Bag%20Policy%202020.pdf [V]
- Goodman, J., & Nitkin, S. (2026). *Kumon Up: Private Tutoring Centers and Student Achievement*, NBER w35671 — https://www.nber.org/papers/w35671 [V-abs]

Abstracts read (publisher full text returned 403)
- Ghosh, P., & Bray, M. (2018). Credentialism and demand for private supplementary tutoring. *IJCED* 20, 33-50 — https://doi.org/10.1108/ijced-10-2017-0029 [V-abs]
- Ghosh, P., & Bray, M. (2020). School systems as breeding grounds for shadow education … West Bengal. *Eur. J. Educ.* 55, 342-360 — https://doi.org/10.1111/ejed.12412 [V-abs]
- Bhorkar, S., & Bray, M. (2018). The expansion and roles of private tutoring in India: from supplementation to supplantation. *IJED* 62, 148-156 — https://doi.org/10.1016/j.ijedudev.2018.03.003 ; repository http://hdl.handle.net/10722/252120 [V-abs]
- Bhorkar, S. (2023). Variegated roles of and relationships between private tutoring and schooling (Maharashtra). *ECNU Rev. Educ.* 7, 66-88, CC BY-NC — https://doi.org/10.1177/20965311231167186 [V-abs]
- Sengupta, I., & Ghosh, P. (2022). Intra-household gender disparity in private tuition: West Bengal. *Indian J. Human Dev.* 16, 352-366 — https://doi.org/10.1177/09737030221123178 [V-abs]
- Jha, S. K. (2021). The three E's of private tuition in India. *Journal of Education* — https://doi.org/10.1177/00220574211032345 [V-abs]
- Kaur & Sharma (2025). Shadow education amid privatisation. *Millennial Asia* — https://doi.org/10.1177/09763996251353508 [V-abs]

Titles verified, content not read [U]
- Kumar, S., Pandita, P., & Singh, K. (2024). 'To be on the seventh sky': … Indian parents' choice for shadow education. *Education 3-13* — https://doi.org/10.1080/03004279.2024.2412993
- Bhorkar, S. (2026). The double whammy of schooling–tutoring inequalities … India. *Compare* (CC BY) — https://doi.org/10.1080/03057925.2026.2639753
- Dongre, A., & Tewary, V. (2015). Impact of private tutoring on learning levels: evidence from India — https://doi.org/10.2139/ssrn.2401475 [S, via Azam]
- Jayachandran, S. (2014). Incentives to teach badly. *J. Dev. Econ.* 108 — https://doi.org/10.1016/j.jdeveco.2014.02.008 [S, via Azam]

Secondary
- Wikipedia, RTE Act 2009 (prohibition of private tuition by teachers) — https://en.wikipedia.org/wiki/Right_of_Children_to_Free_and_Compulsory_Education_Act,_2009 [S]; Shadow education (West Bengal 60% primary) — https://en.wikipedia.org/wiki/Shadow_education [S]

Measured here [M]
- `tutor_substitution_reviews.py` → `tutor-substitution-reviews-2026-10-02.json` (12 apps, 11,245 reviews, 183 parent-voiced)
- `curiousjr_review_themes.py` → `curiousjr-review-themes-2026-10-02.json` (2,000 reviews)
- Sibling data reused: `urbanpro_fees_2026-10-02.json` (UrbanPro listing rates), `market_size_model.py` (CMS level charts, ASER inputs)

Sibling Taxila docs cited
- `india-ai-native.md` (PW voice cost, CuriousJr price, SpeakX ₹299 and ~30% retention, Mindspark Rajasthan w34205); `china-asia.md` §11-§14 (Gaotu tutor job, failure modes); `../design/parent-experience.md` §1-§2 (Kraft & Rogers, Bergman & Chan, Botswana); `../conductor/school-sync-homework.md` SS4, SS7, SS10, SS11, SS14; `../conductor/day-cycle.md` DC1, §1.4 (IAP screen guidance); `../conductor/orchestration-architecture.md` §9.1 (voice costs); `../psychology/motivation-habits.md` MH-D2, MH-D4, MH-D6; `../learning-science.md` §1 (human-in-the-loop, no autonomous-LLM child RCT).
