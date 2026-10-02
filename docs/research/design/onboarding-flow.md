# Onboarding flow: teardown and design (Taxila)

2026-10-02 · scope: first run, from cold app open to the parent's first summary. Parent-first signup and consent, child profile, meet the teacher, playful diagnostic, first win, parent summary. Builds on, and does not repeat: `docs/research/learning-science.md` (rules 1, 13-16, 22-29, 31-35; §5.2-5.5; §7 probes), `docs/harvest/gurukul.md` §3.2 and §6, `docs/research/design/parent-experience.md` (§6 O1-O9 sketch, PX rules, tokens), `docs/research/design/kids-ux-ages.md` (bands B1-B4, reading axis R0-R2, tokens, S1-S10), `docs/research/safety/dpdp-deep.md` (NM-1..NM-13, Rule 10). This doc is the detailed version of parent-experience §6; where they differ, §13 says which and why.

Evidence tags: **[V]** read this session in the primary source (the product's own page, store listing, official doc, or reviews pulled by the scripts below) · **[S]** secondary source or an earlier Taxila doc's [S] · **[M]** prior knowledge, not re-checked · **[I]** design inference · **[U]** untested.

**Method and limits.** The session's web-search budget was exhausted before this task started, so nothing here comes from new search results. Evidence comes from: about 33 direct fetch attempts, about 20 of them usable (product sites, App Store listings, Android and WhatsApp developer docs, the ASER 2024 assessment-tasks PDF, two teardown pages); two reproducible Play Store review passes written for this doc (`onboarding_reviews.py`, `onboarding_login_themes.py`, outputs `onboarding-reviews-2026-10-02.json`, `onboarding-login-themes-2026-10-02.json`, India storefront, newest reviews, crude regex coding, read the samples before trusting a count); and the repo docs above. **I did not install or walk through any competitor app.** Screen orders marked [M] come from memory of those apps and must be re-walked on a budget Android phone before anyone quotes them.

---

## 0. The decisions on one screen

1. **Two clocks, both short.** The *parent* hears the teacher within 5 s of cold open, before giving any data (pre-rendered audio, no network needed). The *child* hears her own name from the teacher within 5 s of handover and makes a first two-way exchange within 60 s. Neither clock waits on the realtime session: it warms up in the background.
2. **Value before expensive trust.** Gurukul's journey lesson (hear the voice before the ID step) is met by an optional **60-90 s live "parent taste"**: the parent talks to the teacher as if they were the child. This also lets an adult grant the mic permission. It stays valid when verification is switched on, because DPDP NM-13 allows it ("parents may try a lesson themselves").
3. **The front door is the biggest risk, and it is OTP.** In BYJU'S newest 400 India reviews, **85 of 256 low-star reviews (33%) mention OTP** (window 2025-11-18 to 2026-09-28) [V, script]. OTP goes WhatsApp-first (one-tap autofill), with SMS Retriever and a voice call as fallbacks.
4. **The phone-number field carries the sales-call fear.** It sits next to a plain no-sales-calls promise. "They call every day two to three times... to sell their course" (Unacademy, Sep 2026) is the pattern Indian parents expect [V, script].
5. **Adult verification (DPDP Rule 10) is built as a slot and is off at launch.** The owner's directive of 2026-10-02 (`CLAUDE.md`: "Compliance is deprioritised for now") rules it out of the launch flow, while the child-safety floor stays: AI disclosure, helplines, no companion register. Rule 10 binds from 13 May 2027. When the flag turns on, the step sits at P4, runs once per family, can be resumed from a WhatsApp link, never blocks hearing or trying the teacher, and is skipped for a second child (route (a), dpdp-deep §3.2). It is the step most likely to lose parents [U], so it gets measured before it is switched on.
6. **The child profile has six taps and no free text.** Nickname (Khan Kids: "we recommend using a nickname" [V]), class, board, school medium, home language, and how the teacher should address them (*tum* or *aap*). There is no "tell us about your child" box (NM-3) and no learning-style quiz (rule 22).
7. **The teacher says the child's name correctly the first time.** The parent hears a TTS preview of the name at profile time and can fix it. That audio is cached for the handover greeting.
8. **The first exchange cannot be lost.** It asks what the child likes (picture tiles), works by voice *or* tap, and doubles as the mic check. Failing ASR in the first minute is how voice products embarrass themselves: "the whole conversation goes into trying to get Lili to understand what I just said" (Duolingo review, Sep 2026) [V, script].
9. **The diagnostic is ASER-shaped and dressed as a story.** It starts in the middle, the child picks which item to try (ASER does this [V]), it moves up or down one rung, and it always ends on a success. It shows no score or timer and never uses the word "test". Caps: 4 / 6 / 8 / 10 min by band.
10. **The first win is real, at the edge of what the child can do, and the child shows it to the parent.** The handback *is* the teach-back (probe P1 with a real human). The parent sees evidence happen before reading any summary.
11. **The parent summary is three lines with "Kaise pata?"** It says where we start (level and the school chapter it leads to), what the child did on their own today ("aa gaya", never "pakka"), and what happens next. The risk to manage is placement shock ("Class 4? She is in Class 6"), not boredom.
12. **No payment, no notification permission and no streak anywhere in onboarding.** Price is shown early (trust page). Payment comes later, to the parent only. Reports go over WhatsApp, so Android's `POST_NOTIFICATIONS` prompt is not needed on day one. Google advises against asking at first launch anyway [V].

---

## 1. Constraints this flow must satisfy

| source | constraint | where it bites |
|---|---|---|
| owner directive 2026-10-02 (`CLAUDE.md`) | compliance deprioritised; child-safety floor stays; **Azure-only for paid compute and AI** | VPC slot off at launch (P4); TTS and realtime on Azure; messaging vendors flagged (§13) |
| DPDP s.9(1), Rule 10; dpdp-deep NM-13 (binding 13 May 2027) | verifiable consent of an *identifiable adult* before any child data; relationship is declared, not verified [V via dpdp-deep] | when the flag is on: VPC before the child profile; parent taste is adult-only |
| dpdp-deep NM-2/3/7/10 (legal-mode design, deferred) | persist only curriculum state (with P2); no behaviour, latency, affect or free-text notes; interests only with P3; purposes unbundled | kept at launch where it is also trust (consent rows, no free-text box); the legal-mode flag can switch on later without redesign |
| learning-science rule 28, §5.2-5.3 | place by diagnosed level, not class; within-grade spread is 5-6 levels; Grade 6 average about 2.5 levels behind (Mindspark Delhi) [S] | diagnostic start point, R1 copy |
| learning-science rule 1, §7 | "Samjha?" is never evidence; low ASR confidence = no evidence | diagnostic scoring, first exchange |
| learning-science rules 22, 27 | no style quiz, no style labels, no points or unlock economies | diagnostic and first win |
| kids-ux §3 row 9, TIDRC #38 | no in-app tutorial for 7-11 year olds; the teacher demonstrates inside the task [V via kids-ux] | no coach-mark carousel for the child |
| kids-ux §1 | never show a grade label below the child's own class to the child | diagnostic and first win copy |
| gurukul §6.2 | honest waits; one your-turn element per screen; copy gate; read-aloud test | every screen |
| Android permissions doc | ask "in context, when the user starts to interact with the feature"; after two denials the system dialog is never shown again [V] | the mic ask happens once, at the right moment, with the parent present |
| parent-experience PX9, gurukul P1 | disclosure that she is an AI at n=0, to both parent and child | P1 and C2 |
| shared family phone (learning-science §5.5) | the parent installs it; the child may not be there right now | handover can be "later" |

---

## 2. Teardown

### 2.1 What each product does at first run

| product | first-run shape | first voice / first real task | where signup and money sit | evidence |
|---|---|---|---|---|
| **Duolingo** | mascot intro → choose course → "How much [language] do you know?" → motivation → daily goal → placement test *or* start from scratch → first lesson → signup prompted "at logical moments... after users complete a language lesson" | first exercise inside the first couple of minutes [M]; placement "starts off easy and gets harder according to performance" | signup optional and deferred; Super trial offered later | goodux.appcues [V]; Duolingo blog "add a new course" [V]; screen order [M] |
| **Khan Academy Kids** | adult sets up; "We ask for a name and age at setup, and we recommend using a nickname. We never ask your child for personal information directly"; multiple child profiles; Kodi leads; path adapts by age and mastery | first activity right after the profile [M]; narrated by Kodi | free, "no ads, no subscriptions" | khanacademy.org/kids FAQ [V]; App Store listing [V] |
| **Speak** | "a few questions at the very beginning and sets up your lessons based on your responses"; promise of "speaking... out loud on day 1"; 7-day free trial | the user speaks in the first lesson [V]; mic asked just before [M] | paywall early: "you have to pay after 2 lessons" (review); "Automatically signs you up for a year 'premium free trial'" (review); forced Google login (review) | App Store [V]; speak.com [V]; reviews [V, script] |
| **Cuemath trial** | "Get Started" → questions about the child → "our admissions counselor will call you to match your child with the right tutor, and schedule a free trial class as per your availability" → live 1:1 on Cuemath Leap (55-min classes) → "choose a plan and make the payment" | hours to days later, human-gated | counsellor call first; plan and payment after the trial | cuemath.com/en-in [V]; reviews: "if you book a trial class they should connect to you immediately.. but no assistance", "a marketing platform to fish for customer information" [V, script] |
| **YoLearn.AI** | student-first; "selecting their educational board and class level"; Class 3-12 + JEE/NEET; voice "as if they are speaking to a teacher on the phone" with a sketch board; Tutor, Coach and Buddy personas; Hinglish | voice call available from the free plan [V]; flow not walked | free plan with a "basic daily token limit"; paid tiers in tokens (500 / 1,000+200 / 2,000+500) | yolearn.ai and pricing [V]; reviews: a country-name field blocked login (Hinglish review), "it doesn't recognize my grade at the final step" [V, script] |

Store context (Play, India, 2026-10-02) [V, script]: Duolingo 4.58 (49.3M ratings); Khan Kids 4.47 (57k); Speak 4.60 (124k); Cuemath 4.56 (41.6k); YoLearn 4.23 lifetime vs 4.84 on its newest 245 reviews, several of which read like marketing copy, so treat its recent rating as weak evidence [I].

### 2.2 What to take, what to reject

| product | take | reject, and why |
|---|---|---|
| Duolingo | value before signup; a *choice* between placement and starting simply; adaptive placement that starts easy | the gem wager ("increased Day-7 retention by +14%", growth.design [V]) and streaks: loss-aversion mechanics, already banned (gurukul §3.2). Caveat worth keeping: Duolingo's own growth came mainly from *current-user* retention, not onboarding (CURR had "5x the impact", Lenny's [V]). Week-2 lesson quality matters more than polishing screen 3 |
| Khan Kids | adult sets up, nickname and age only, child never asked for personal data, one profile per child, the character teaches inside the task | free-roam home and reward collections (kids-ux §9). Review pain to design out: a parent could not delete a child profile created with the wrong age [V, script]; Hindi requests ("language kese change kare bhai hindi main kese chalega") [V, script] |
| Speak | speaking in the first minute; a short personalisation before the first lesson | early hard paywall and auto-enrolled trials: they read as a trap to Indian parents (96% want cancellation and refund policy upfront, LocalCircles, via parent-experience [S]); forced single sign-in method |
| Cuemath | the **demo-class ritual** Indian parents already trust; a named teacher; a report after the trial | counsellor gating and the sales call it implies; booking errors and dead time between interest and value. Taxila can give the demo now, with no human in the loop |
| YoLearn | board and class first; voice-call metaphor; Hinglish accepted | student-first with no visible parent consent path (from its pages; not verified in-app) [I]; tokens as the unit (a child cannot reason about them, a parent gets meter anxiety [I]); an "AI Buddy" persona conflicts with teacher-not-friend (learning-science rule 31); extra fields (country) that can break login |

### 2.3 Cross-cutting lessons

- **Getting in is where Indian edtech loses people.** Among low-star reviews in the newest 400 per app: BYJU'S 85 OTP mentions of 256; Extramarks 2 OTP + 6 login of 143; Cuemath 5 login of 56; Unacademy 7 "called after I signed up" of 126 [V, script; crude regex]. Samples: "tried 27 times but once also didn't get the otp"; "stuck at OTP page with no options for resend otp or get otp on call".
- **Users decide in days.** The average Android app lost 77% of DAUs within 3 days and 90% by 30 days (Quettra, 125M+ devices, 2015, via Andrew Chen) [V]. Top apps differ mostly in where they *start* on day 1, not in the slope after. The first session is the product's audition.
- **Placement errors show up as "too easy".** Duolingo low-star: "too easy. need difficulty option"; Khan Kids: "idiotic and useless, unusable and too easy" [V, script]. In India the bigger error runs the other way (grade-level content for a child 2-3 levels behind), and it is silent: the child just stops (learning-science §5.2) [I].
- **Nobody in this set asks for parent consent in a way DPDP would accept, then plays the teacher inside 60 s.** That combination is Taxila's to own [I].

---

## 3. The flow at a glance

```
PARENT holds phone                          (p50 about 3 min with VPC off; 4.5 min with it on)
P0 Language + her voice ─ P1 Meet her (AI disclosure) ─┬─ P1b Parent taste (optional, live, 60-90 s)
   first audio ≤ 5 s        20 s                       │
                                                       ▼
P2 Number + OTP ─ P3 Trust page ─ P4 Verify adult (VPC) ─ P5 Consent rows ─ P6 Child profile
   WhatsApp-first   price, no calls   flag OFF at launch  unbundled          6 taps + name check
                                                                              │  [preload diagnostic pack,
P7 Controls (defaults, 1 tap) ─ P8 Handover: "Abhi" or "Baad mein" ◄──────────┘   warm realtime session]

CHILD holds phone (parent nearby for the first minute)  (p50 about 8-13 min by band)
C1 Pick avatar, teacher says the name (≤ 5 s) ─ C2 "I am a computer teacher; Mummy-Papa can see"
C3 First exchange: what do you like? (voice or tap; mic ask here) ── first answer ≤ 60 s
C4 Diagnostic story (ASER-shaped, ends on a success) ─ C5 First win (module + child solves alone)
C6 "Show your parent": child explains what they did ── phone goes back

PARENT again
R1 Summary: 3 lines + Kaise pata? + path to the school chapter ─ R2 Report day; first WhatsApp card sent
```

---

## 4. Parent screens

Each block: purpose · content notes · budget (p50 / p90) · drop-off risk → mitigation · evidence.

**P0 Language and her voice** · 8 s / 20 s
- Teacher illustration (kids-ux: illustrated face, M-UX-6 pending) and three large tiles: हिन्दी · Hinglish · English. On Android, her 3 s greeting auto-plays at about 1 s. On web, autoplay needs a gesture, so each tile plays its sample on tap. The chosen tile sets UI, voice and report language.
- A small "I am a student" link at the bottom routes to §4.1 (teen installs alone).
- Risk: a parent who cannot read the tiles → every tile speaks; the icons are not flags.
- Assets: three Opus clips at about 24 kbps, about 9 KB each, bundled in the APK [I].

**P1 Meet her** · 20 s / 30 s
- 15-20 s greeting addressed to the *parent*, register *aap*. She says she is an AI teacher in the first sentence (gurukul P1; PX9), with a transcript under it. Shape: who she is, what a lesson is like, that the parent sees everything.
- Two buttons, one your-turn: primary "Bachche ke liye shuru karein"; secondary "Pehle khud baat karke dekhein (1 min)" → P1b.
- Risk: a long monologue loses the parent → cap at 20 s; replay button; captions.

**P1b Parent taste (optional)** · 75 s / 120 s
- A live realtime session in which the parent plays the child. A fixed mini-lesson for the class they tap (one 3-tile class-band picker), so it shows the module appearing. Adult data only, so no VPC is needed (NM-13). A one-line notice ("we do not store your voice") plus the affirmative tap counts as consent for this purpose [U: counsel to confirm wording].
- **The mic permission is requested here, in context**, by an adult. The grant then persists for the child on that device (Android grants per app, not per profile [M]). That avoids asking a 6-year-old to read a system dialog.
- Risk: realtime cold start (token mint, WebRTC, first audio). Measured first audio is about 1 s after `response.create` (realtime bakeoff, n=6) [V, measurements.md]; connect time is not measured → honest-wait ladder (gurukul §6.2). If the session has not connected in 8 s, fall back to the pre-rendered demo.
- Logged as an arm: taste vs no taste → D7 return (M-ONB-8).

**P2 Your number + OTP** · 35 s / 120 s
- One field (+91 prefilled) and one line beside it, shaped as a promise: this number gets the weekly report, Taxila never calls to sell, and the parent can remove it. The parent's name is optional (used in the teacher's greeting to the parent).
- **OTP channel order:** WhatsApp authentication template with one-tap autofill ("preferred... without leaving the app" [V]) → SMS via the SMS Retriever API ("without requiring any extra app permissions" [V]) → voice call. Resend unlocks at 20 s, and "edit number" is always visible. On web, use copy-code plus WebOTP where supported [M].
- Risk: OTP never arrives (BYJU'S 33% of low-star) → three channels; measure success per channel (M-ONB-2). SMS needs DLT template registration in India [M]; do that before launch, not after.
- Risk: sales-call fear → the promise is product policy, and any sales call is a sev-1 incident (parent-experience M7).
- Auth model: phone + OTP, not email + password (conflicts with ARCHITECTURE §API; see §13).

**P3 Trust page** · 15 s / 40 s
- One scroll, speaker button at the top, read-aloud version about 25 s. Contents follow parent-experience O6: price in rupees, what is free, cancel in 2 taps, refund policy in full, "no sales calls, no loans or EMI, no ads", what is kept and never kept (audio is not stored), data location, grievance contact.
- **No card is asked for to start.** The trial or free allotment is a business decision [U], but it must never auto-renew into a paid plan without a fresh affirmative act (Speak reviews).
- Risk: parents skip it → fine. It exists so the promise is on record before the parent spends effort on VPC. It is also reachable from every later screen.

**P4 Verify you are an adult (VPC)** · 90 s / 240 s [U, unmeasured] · **built, flag off at launch** (owner directive); with the flag off, P3 goes straight to P5
- Why line, spoken and written: the law asks a family to confirm once that an adult is setting this up. Primary route: DigiLocker share of an age or identity token (Rule 10(1)(b)(ii)) [V via dpdp-deep]. Alternative route per dpdp-deep §3.3 M-b/M-c once a vendor is chosen [U]. Then the relationship attestation: one checkbox row, "I am this child's parent or lawful guardian" (s.15(b)).
- Stored: method, verified-adult boolean, token reference, timestamp, notice-version hash. **Never the Aadhaar number** (dpdp-deep §3.3).
- Risk: highest-uncertainty step. Parents may not have a DigiLocker login, fear Aadhaar misuse, or leave the app and not come back. Mitigations:
  - (a) state exactly what Taxila receives ("only that you are over 18");
  - (b) deep-link return to the same screen;
  - (c) "Baad mein" saves progress and sends one WhatsApp utility message with a resume link (the parent's own number, the parent's choice);
  - (d) the parent can still replay P1/P1b while unverified;
  - (e) a second child, or the same family on a new device, reuses the verification.
- Launch-date note: Rule 10 applies from 13 May 2027, and dpdp-deep advises building to the standard from day one. The owner has chosen otherwise for launch. So the step ships as code behind `vpc.enabled=false`, with its funnel measured on a pilot arm (M-ONB-3) before the date, and the choice is logged as a decision, not left as a UI shortcut.

**P5 Consent rows** · 35 s / 70 s
- One screen, at most five rows, each a plain sentence + speaker + toggle (parent-experience `ConsentRow`), mapped to NM-10:
  - P1 lessons: required, shown as on.
  - P2 "remember what she has learned across days": recommended and preselected at launch (owner decision; re-check before the VPC flag turns on) [U]; a real "no" keeps learning state session-only.
  - P3 "remember things she tells the teacher, such as favourite games": off.
  - P4 anonymised research: off.
  - Report channel: primary button "Haan, WhatsApp par bhejo", secondary "Sirf app mein".
  - Voice-clip retention and P5 are **not shown at onboarding**: off by default and unavailable, reachable in Controls. Fewer rows, less fatigue [I].
- The standalone notice (Rule 3 itemised description) is one tap away and is read aloud.
- Risk: consent fatigue → each row is one tap, and Bergman's evidence favours a simplified choice that is the primary button (parent-experience §2) [S].

**P6 Child profile** · 50 s / 90 s
- Six inputs on one screen, all tiles except the name:
  1. **Name or nickname** (Roman or Devanagari keyboard). On blur, the teacher says it aloud (TTS) and the parent taps "Sahi hai" or "Badlo" (type it the way it sounds) [I]. The confirmed audio is cached for C1.
  2. **Class** 1-9 (9 tiles; no date of birth; the band comes from the class, and the age chip is optional for band edges, kids-ux §11.4).
  3. **Board**: CBSE / NCERT books · State board (pick state) · ICSE · Not sure. Only NCERT/CBSE are mapped (`boards.json`: rbse, icse, other-state have no classes) [V repo]. Unmapped boards get an honest note that lessons follow NCERT books for now and chapter names are matched where possible. Never block.
  4. **School medium**: Hindi · English · Other. This sets the caption script (kids-ux §8.1).
  5. **Language at home** (what the child speaks most easily): Hindi · Hinglish · English · Other (name it). This sets the teacher's starting mix. The child's actual mix is adapted within the session only (NM-3).
  6. **How should she address the child**: *tum* · *aap* (indian-teacher-discourse §4.1: "parent onboarding asks") [V repo].
- Optional seventh row, one tap: which subject first (Maths default · English · Hindi · Science/EVS).
- Not asked: photo, school name, DOB, gender, "about your child" text, learning style.
- Risk: a typo in class or board → editable any time in Parent corner, and deletable (Khan Kids review pain).
- While the parent fills this screen, the client downloads the **diagnostic pack** for that class (§10) and pre-synthesises the name greeting.

**P7 Controls** · 10 s / 40 s
- One card: parent gate (device credential on Android API 30+, PIN on web and older devices; §13); daily time and allowed hours prefilled by class (parent-experience §10). Primary "Theek hai"; "Badlo" expands. Most parents accept defaults [I], so defaults must be safe.

**P8 Handover** · 5 s / 15 s
- Shape: hand the phone to the child now and stay close for one minute. Two choices: "Abhi" (the realtime session warms) · "Baad mein" (the profile shows "ready" on the profile picker; optionally the parent sets one reminder time for *themselves*, not the child, NM-8).
- Risk: the child is not home (the parent installs at work) → "Baad mein" is first-class, not a failure state. Measure the split (M-ONB-7).

### 4.1 Edge flows

- **A student installs it alone (common in Classes 8-9; YoLearn is student-first).** "I am a student" → she greets them (no mic, no data) → the student enters a parent's number (parent contact is allowed before VPC) → the parent gets a WhatsApp link that opens P2-P7 on the *parent's* phone or on this one. Until a parent finishes setup the student can only replay the greeting (parent-first is a product rule, so it holds with the VPC flag off). With the flag off, a teen claiming to be the parent is caught only by the OTP to the parent's number, which is weak. With it on, the Rule 10 adult check catches them [I].
- **Second child:** P6 → P8 only; VPC and P5 reuse (route (a)); P5 asks only the per-child rows.
- **Grandparent or older sibling sets up:** any identifiable adult guardian passes Rule 10 [V via dpdp-deep]. The relationship row covers "lawful guardian".
- **Web first, app later:** the OTP login on the second surface lands on the profile picker, with no second onboarding.

---

## 5. Child screens

**C1 Who is learning + hello** · 15 s / 30 s
- The avatar pick is the first cheap choice: 2 options (B1), 3 (B2), 4 (B3-B4) (kids-ux `choices.max`). The teacher says the child's name from the cached P6 audio within 5 s of the screen appearing, so this works even while the realtime session is still connecting.
- Gestures and targets follow kids-ux bands (64-112 dp tiles in B1-B2).

**C2 Who I am, who can see** · 12 s / 15 s
- Fixed, reviewed disclosure lines per band (kids-ux §7): Young, concrete ("a computer teacher, not a person"); Older, plain plus the "what your parent can see" chip (kids-ux S9). These are product copy checked by the persona invariants, not improvised.
- Shown as her speech with captions. No buttons except replay. It moves on by itself.

**C3 First exchange: "what do you like?"** · 25 s / 45 s → **first child answer ≤ 60 s from handover (p50)**
- She asks which of 2-4 picture tiles the child likes (for example cricket, drawing, animals, cooking, trains, building things). There are **no festival or religion tiles** (NM-7 sensitive categories). The child answers by voice or by tapping. There is no wrong answer.
- **The mic permission is asked here if the parent skipped P1b.** Order: her spoken line plus a picture of the mic, then a pre-permission card for the parent ("tap Allow so she can hear"), then the system dialog. Denied → tap mode, fully working, with no nagging; one later chance from Parent corner settings. After two denials Android stops showing the dialog [V], so the app never asks speculatively.
- Low ASR confidence or a mismatch → she shows the 2-3 tiles she thinks she heard (kids-ux S4). After a second miss she switches to taps for the rest of onboarding and says so lightly. She **never** says she did not understand twice.
- The chosen interest colours the diagnostic story and the first win (interest context, rule 25, retention g = 0.48 [S]). It is stored only with P3; otherwise it is discarded at session end.

**C4 Playful diagnostic** · B1 ≤ 4 min · B2 ≤ 6 · B3 ≤ 8 · B4 ≤ 10 (caps, not targets)

*Purpose:* a provisional placement (which rung of the prerequisite chain to start on), the reading-support level (R0/R1/R2, kids-ux §1, a UI setting and not a judgement), and nothing else. It does not produce a score, a style, a speed measure, or anything shown to the child as a result.

*Shape (ASER 2024 floor-test logic, adapted)* [V for ASER; I for the adaptation]:
- ASER "is a 'floor test'... designed to record the highest level that each child can comfortably achieve"; testers "build rapport"; children get "sufficient time"; the test "is adaptive... so that she does not have to attempt all the levels"; the child chooses which paragraph, words or problem to attempt; 4 of 5 is the criterion for letters, words and numbers; a careless mistake gets "another chance with the same question"; testing starts at the middle (paragraph; subtraction) and moves up or down [V].
- **Start rung:** one class below the enrolled class for Classes 3-9, at the enrolled class for 1-2. This follows the Indian base rate (Grade 6 about 2.5 levels behind, wide spread) [S]. It is a prior, not a verdict.
- **Each rung** is a skill node from the curriculum chain that leads to the current school chapter (maths engine map, P0 engines: number line, collections, place value, fractions) [V repo]. The child picks one of two equivalent items (ASER's choice; also autonomy, rule 26).
- **Pass a rung:** 2 of 2 on 3-option items (chance pass 11%), or 4 of 5 on recognition sets (chance under 5% with 3 options) [I, arithmetic]. Pass → up one rung. Fail → down one rung. Stop when a pass at rung k and a fail at k+1 are both confirmed, or at the cap.
- **Two strands for Classes 6-9:** the foundation chain (place value → operations → fractions → integers or algebra readiness) and **one probe on the current school chapter**. This gives the parent both "where the foundation is" and "where the school chapter is". Without the second strand, R1 loses parents who came for school help [I].
- **Reading strand for Classes 1-5** (and for any older child whose answers suggest R0/R1): ASER order in the school-medium script (paragraph → story or words → letters). Read-aloud scoring uses ASR only with high confidence. Otherwise it uses receptive items ("tap the word she says"). Child ASR is the weakest link (learning-science §5.4); Vachan Samiksha shows oral-reading ASR can work at state scale [S], but it must be measured on Taxila's children before it decides anything.
- **Items are diagnostic, not just correct or incorrect.** Each wrong option maps to a known misconception (probe P7, rule 12). In B3-B4 a "how did you know?" follows a correct answer on about half of items, as a choice ("because A or because B?"), to separate guesses (P2). There is never "Samjha?".
- **Story wrapper:** the interest from C3 becomes a frame (setting up a stall, packing for a match, feeding the animals). Each item is a task the story needs, rendered by the module engines. A game wrapper is allowed; points, coins, stars and unlocks are not (rule 27).
- **Feedback during the diagnostic** [U]: every answer gets the same warm acknowledgement and a neutral earcon. Correctness feedback and teaching are deferred to C5, so a run of misses never feels like failing. Test this against children finding no feedback strange (M-ONB-6).
- **Stop early** on two "pata nahi" or minimal-answer turns in a row (P20), on a request to stop, or at the cap. Partial placement is fine: the retrieval openers of the next 3 lessons continue placing (rule 18).
- **Always end on a success:** the last item is from the highest passed rung. It is a true success, not a fake easy item (ASER: "the best that each child can do").
- **Never shown to the child:** rung names, class labels below their class (kids-ux §1), counts, timers, "test", "exam", "pariksha".
- **Persisted** only with P2: item outcomes (item, correct, hint depth, independent) and the derived skill states (NM-2). Without P2: placement lives for the session and becomes the parent-confirmed starting point at R1 (M0 "curriculum position is parent-set").

**C5 First win** · 3 min / 4 min
- **Target:** the first *failed* rung's smallest sub-step, taught as worked example → faded example → the child solves an isomorphic item alone (rules 15-16). The module appears as she teaches (for example fraction bars, the number line, place-value blocks), with concrete objects from the child's interest first (concreteness fading, rule 19).
- **Teaching expectancy up front** (rule 4): she says at the start that the child will show their parent at the end.
- If the child still fails, she drops one more sub-step. The win is always on a real independent success somewhere on the chain (the competence need, §3.7).
- **Payoff:** concept-shaped and specific (the stall's bill now adds up). She names the step the child did, not a trait (rule 20). No reward screen.
- Ends **inside** the parent's time cap, with no cliffhanger.

**C6 Show your parent** · 30 s / 60 s
- She asks the child to call the parent and show what they did: the child explains, with the module still on screen. This is outward-pointing relatedness (learning-science §4.5) and a teach-back probe (P1) with a real listener. For B1-B2 the module replays the steps and the child narrates or points.
- She says goodbye without guilt or a streak. She names the next lesson's topic so the next session's retrieval opener has a referent, not so the child feels obliged.

---

## 6. Back to the parent

**R1 Summary** · 45 s / 90 s (child-safe copy, PX8; the child may be reading over a shoulder)
- Three lines, each with "Kaise pata?" (parent-experience `EvidenceSheet`), plus a speaker:
  1. **Where we start:** the skill, then how it links to the school chapter (`LevelBridge`: start skill → N steps → current chapter), stated in lessons, never in years. Grade terms belong to the parent only.
  2. **Today:** what the child did on their own vs with a hint (NM-2 item outcomes); state word *aa gaya*, never *pakka* (PX2 needs a delayed check).
  3. **Next:** the next lesson's topic and the confirmation window. Shape: a first estimate, checked again over the next three lessons.
- "Kaise pata?" opens the actual items, the child's answers (transcript lines, not audio), the date, and when each will be re-checked.
- **Placement shock is the risk to design for.** Parents overestimate their children's level (Dizon-Ross: off by more than 1 SD; Bergman: about 30%) [S via parent-experience]. Mitigations:
  - (a) the bridge always ends at the school chapter;
  - (b) every lesson includes a short slice of the current school chapter [U: product decision, test it];
  - (c) copy names the method, never the child (PX4: no "weak", no "behind");
  - (d) "Doesn't look right?" opens a one-tap choice to re-check in the next lesson, never a silent override to grade level. TaRL failed wherever level-grouping did not actually happen (learning-science §5.3).
- No effort or attention claims (NM-9). This conflicts with parent-experience's "Mehnat" row; see §13.

**R2 Reports** · 15 s / 30 s
- Report day and time (default Sunday 10:00), voice note on or off. **The first WhatsApp card is sent now**, as a utility message with a voice version, so the parent sees the channel works and saves the number (parent-experience §2: utility only). It counts toward the ≤2 per week cap.
- End state: Parent corner home with one your-turn element (nothing pending, or "finish verification").

---

## 7. Timing budget

| step | p50 | p90 | cumulative p50 | clock |
|---|---|---|---|---|
| P0 language | 0:08 | 0:20 | 0:08 | **first teacher audio ≤ 0:05** (Android) |
| P1 meet her | 0:20 | 0:30 | 0:28 | |
| P1b taste (optional) | 1:15 | 2:00 | (excluded) | first live exchange for the parent |
| P2 number + OTP | 0:35 | 2:00 | 1:03 | |
| P3 trust | 0:15 | 0:40 | 1:18 | |
| P4 VPC | 1:30 | 4:00 | 2:48 | [U] largest variance |
| P5 consent | 0:35 | 1:10 | 3:23 | |
| P6 profile | 0:50 | 1:30 | 4:13 | |
| P7 controls | 0:10 | 0:40 | 4:23 | |
| P8 handover | 0:05 | 0:15 | **4:28 parent setup** (2:58 with VPC off, the launch default) | |
| C1 avatar + hello | 0:15 | 0:30 | 0:15 | **name spoken ≤ 0:05** |
| C2 disclosure | 0:12 | 0:15 | 0:27 | |
| C3 first exchange | 0:25 | 0:45 | 0:52 | **first child answer ≤ 1:00** |
| C4 diagnostic | 4 / 6 / 8 / 10 min cap by band | cap | 4:52 to 10:52 | |
| C5 first win | 3:00 | 4:00 | 7:52 to 13:52 | |
| C6 show parent | 0:30 | 1:00 | 8:22 to 14:22 | |
| R1 + R2 | 1:00 | 2:00 | | |

Total for the family: about 14 min (B1) to 20 min (B4) at p50, of which the parent is active for about 5.5. That is shorter than the 55-min Cuemath class it replaces as a "demo" [V], and the child's part *is* a lesson [I]. Budgets are proposals until M-ONB-1 measures them on a 2-3 GB phone over 4G and congested 3G.

---

## 8. Drop-off risk register (ranked by likelihood × cost; all [I] until measured)

| # | risk | where | mitigation | metric |
|---|---|---|---|---|
| 1 | OTP not received | P2 | WhatsApp one-tap → SMS Retriever → call; resend at 20 s; edit number; DLT registered | per-channel success (M-ONB-2) |
| 2 | VPC abandonment (when the flag is on) | P4 | why-line; once per family; resume via WhatsApp link; alternative route; never block P1/P1b | completion and time (M-ONB-3) |
| 3 | placement shock | R1 | bridge to school chapter; school slice; method-not-child copy; re-check, not override | comprehension and acceptance interviews (M-ONB-9) |
| 4 | first exchange fails on ASR | C3 | tiles of what she heard; taps after the second miss; low confidence = no evidence | tap-fallback rate (M-ONB-10) |
| 5 | mic denied | P1b/C3 | ask in context with the parent; tap mode is complete; no re-nag | grant rate (M-ONB-10) |
| 6 | sales-call fear | P2 | promise beside the field; sev-1 policy | "calls" in reviews and tickets |
| 7 | child not present | P8 | "Baad mein" is first-class; profile ready on the picker | later-start share and later completion (M-ONB-7) |
| 8 | diagnostic feels like an exam | C4 | story wrapper, child choice, no score or timer, end on success, caps | early-stop rate by band (M-ONB-6) |
| 9 | name mispronounced | C1 | P6 preview and fix | "Badlo" rate; parent-rated correctness |
| 10 | network drop | C4/C5 | offline pack in tap mode, resume at the same item | resume success |
| 11 | board not mapped | P6 | honest note, never block | board mix (demand signal) |
| 12 | low-end device jank or APK size | all | static teacher fallback; transform/opacity motion | frame time on reference device (kids-ux G9) |
| 13 | trial or paywall distrust | P3 | price upfront; no card; no auto-renew | refund tickets |
| 14 | consent fatigue | P5 | ≤5 rows; speaker per row; unavailable purposes hidden | time on P5; P2 opt-in rate |

---

## 9. Components and tokens (onboarding additions)

Tokens are inherited, not new: the child surface uses kids-ux §4 (band sizes, `turn` + `turn-ring`, timeouts); the parent surface uses parent-experience §13 (type, `--yourturn-text`, 13 px caption floor). Onboarding-only rules:

| component | contract |
|---|---|
| `VoiceTile` | language tile that plays a sample on pointer-down (≤100 ms feedback); tile = one tap selects and plays |
| `TeacherIntro` | pre-rendered clip + transcript + replay; no network dependency; disclosure in sentence 1 |
| `TasteSession` | live session with an 8 s connect budget, then falls back to the clip; adult-only flag on the session |
| `OtpField` | channel ladder state machine (whatsapp → sms → call); visible number; resend timer counts down; never clears what was typed |
| `NoCallsPromise` | fixed reviewed copy; rendered beside every phone-number field in the product |
| `VpcCard` | route picker, why-line, resume token; stores result row only; deep-link return |
| `ConsentRow` | reuse parent-experience; speaker per row; primary-button opt-in for the report row |
| `NameSayer` | TTS preview on blur; "Sahi hai" / "Badlo"; caches the confirmed greeting audio |
| `TilePicker` | class (9), board, medium, home language, address form; one your-turn at a time (gurukul four-state rule) |
| `HandoverCard` | "Abhi" / "Baad mein"; starts the pack download and session warm-up |
| `MicAsk` | spoken line → pre-permission card → system dialog; denial → tap mode; never shown twice in a session |
| `InterestTiles` | fixed vetted set (no sensitive categories); voice or tap; feeds the story frame |
| `DiagnosticStage` | `TeacherStage` + module + `AnswerTile`; rung engine in code (Director), not in the prompt (rule 14); neutral ack earcon |
| `FirstWin` | lesson state machine: worked → faded → solo item; drop-a-step rule; ends inside the cap |
| `PlacementCard` | R1: 3 lines + `EvidenceSheet` + `LevelBridge`; state words only *abhi nahi / seekh rahi / aa gaya* |
| `StepDots` | parent progress: 4 dots (Hear · Number · Family · Child), never a percentage bar |

Gates (extend kids-ux §10.1): **G-ONB-1** with `vpc.enabled=true`, no network call carries a child field before a `vpc_verification` row exists (integration test with a negative control; it runs in CI even while the flag is off, so the slot cannot rot). **G-ONB-2** the diagnostic copy lint bans "test / exam / pariksha / score / marks" in child strings. **G-ONB-3** no `POST_NOTIFICATIONS` request on the first-run path. **G-ONB-4** the first-audio asset is in the APK, and the cold-open-to-audio time is asserted in a device test.

---

## 10. Patchy data and low-end devices

- **In the APK** (works offline): the three language clips, the P1 intro clip, the teacher Rive file and static fallback, the trust page text and audio, the consent notice audio [I].
- **Downloaded during P5-P7** (about 60-90 s of parent time): the class diagnostic pack (items, module configs, the interest-frame images, captions in the school-medium script) and the cached name greeting. Size target ≤ 1.5 MB [I, measure]. If it is not complete at P8, the diagnostic starts with the items already downloaded and streams the rest.
- **The realtime session warms at P8 "Abhi"**, not earlier. Warming at P0 would spend money and an ephemeral key on parents who leave [I].
- Network loss in C4/C5 → the same item in tap mode from the pack. Her voice falls back to cached clips for fixed lines and to on-screen text for the rest, using the honest-wait ladder (kids-ux S5). Resume at the same rung.
- Images never sit on the critical path: image generation took 23 s (n=1) [V, measurements.md]. Diagnostic visuals are pre-made module renders, not generated.

---

## 11. Copy tone (notes, not lines)

> Anything sentence-shaped in a prompt gets recited (repo law). These are register notes for UI strings
> and for shapes in the Director. The fixed disclosure and promise lines are product copy reviewed once
> and stored as data, never pasted as examples into a prompt.

- **To the parent:** *aap*, a respectful school teacher at a PTM; short; one idea per screen; every screen has a speaker; numbers in rupees and minutes, never "%"; no hype, no exclamation marks, no dashes (gurukul copy gate).
- **Promises are concrete and checkable:** what we never do (calls, ads, loans), what we keep and for how long, how to leave. A promise the product cannot keep is not written.
- **Why-lines before asks** (number, VPC, mic): one sentence on what it is for and what Taxila receives. This follows Google's "users are much more comfortable... if they know why" [V].
- **To the child:** the kids-ux §7 registers by band. The diagnostic is spoken of as finding where to start the story, never as a test. Wrong answers in C4 get no verdict. In C5, mistakes are named plainly and softly, about the step.
- **Placement copy:** name the skill and the path to the school chapter. Never "behind", "weak", "gap of N years", or a grade label to the child.
- **Uncertainty said plainly:** "first estimate", "checking again on Thursday".

---

## 12. Instrumentation and measurements

**Instrumentation within NM-5/NM-3:** first-party only, no SDKs, no device IDs. Per-step counters (entered, completed, abandoned, duration bucket, network type) aggregated daily and **not keyed to a child**. Child-side steps report only completion and duration bucket. [U: counsel to confirm that aggregate onboarding funnel counts fall outside "behavioural monitoring"; if not, the child-side counters go.]

| id | question | method | n (min) | decides |
|---|---|---|---|---|
| M-ONB-1 | cold open → first audio; handover → name; handover → first answer | device test on a 2-3 GB Android, 4G and throttled 3G | 30 runs per network | §7 budgets, asset placement |
| M-ONB-2 | OTP success within 60 s by channel | server logs, per channel and carrier | 500 sends | channel order |
| M-ONB-3 | VPC completion and time by route | funnel + usability sessions (≥4 parents with ≤Class 8 schooling) | 200 families; 15 usability | route order, resume design |
| M-ONB-4 | does the parent taste change D7 return? | randomised: offer vs not | 2 × 300 families | keep or drop P1b |
| M-ONB-5 | diagnostic validity | same child, a trained ASER-style human tester within 48 h; agreement within one rung (target ≥80%, proposed) | 60 children across bands, Hindi and English medium | rung rules, caps |
| M-ONB-6 | diagnostic comfort | early-stop rate; post-session "was it fun or hard?" picture scale; neutral-ack vs correctness-feedback arm | 40 children per band | feedback rule, caps |
| M-ONB-7 | "Abhi" vs "Baad mein" and later completion | funnel | 500 families | handover design |
| M-ONB-8 | first-session → D1/D7 child session | funnel by arm | as M-ONB-4 | the overall bet |
| M-ONB-9 | placement shock | interviews after R1: can the parent restate where we start and why; acceptance | 15 parents (≥5 below-grade placements) | R1 copy, school slice |
| M-ONB-10 | mic grant rate; ASR fallback rate in C3 | funnel + low-confidence counts | 500 children | MicAsk, C3 design |

---

## 13. Decisions to log, and conflicts with other docs

| id (proposed) | decision | reverse if |
|---|---|---|
| `onb-voice-before-data` | her voice plays before any field, from a bundled clip | M-ONB-1 shows the asset costs >300 KB of APK, or parents skip it at >80% (then shorten, not remove) |
| `onb-parent-taste` | optional live taste for the parent before VPC | M-ONB-4 shows no D7 gain and cost per taste above the budget [U thresholds] |
| `onb-vpc-slot-off-at-launch` | VPC is built behind `vpc.enabled`, off at launch (owner directive 2026-10-02); when on, no child field leaves the device before VPC | the owner re-prioritises compliance, a school or partner requires it, or 13 May 2027 approaches (switch on with M-ONB-3 data in hand) |
| `onb-otp-whatsapp-first` | WhatsApp auth → SMS → call | M-ONB-2 shows SMS faster and more reliable on target carriers |
| `onb-mic-in-context` | mic asked by an adult at the first speaking moment | a measured grant rate <70% that a different moment beats |
| `onb-aser-shaped-diagnostic` | floor-test logic, child picks items, 2/2 on 3-option items, ends on success | M-ONB-5 agreement <70% within one rung |
| `onb-neutral-ack-in-diagnostic` | no correctness verdict in C4 | M-ONB-6 shows children confused or less comfortable than with feedback |
| `onb-handback-is-teachback` | the child shows the parent in C6 | parents are absent in >50% of handovers (then use the protégé character) |
| `onb-no-payment-no-notif` | no payment step, no notification permission in onboarding | a business model that needs card-on-file, decided with the trust page rewritten first |
| `onb-no-freetext-no-style-quiz` | no free-text about the child, no style questions | none expected (NM-3, rule 22) |

**Conflicts to resolve (owner: whoever writes the spec):**
1. **Auth.** ARCHITECTURE.md §API specifies guardian email + password (scrypt). This doc and parent-experience O3 use phone + OTP. Recommendation: phone + OTP primary; email optional for receipts. Reason: WhatsApp is the parent surface, and the phone is already the identity [I].
2. **Parent gate.** parent-experience O7/§13 use a 4-digit PIN; kids-ux S8 uses the device credential, with OTP re-auth for consent-grade actions. Recommendation: device credential where available, PIN on web and API ≤ 29 without a keyguard, OTP for consent-grade actions. Both docs are partly right.
3. **"Mehnat" (effort) in parent reports** (parent-experience §0 item 8, `EffortRow`) vs dpdp-deep NM-9 ("never include attention, mood, effort"). R1 here uses only item outcomes. The parent-experience owner should reconcile: retries and own-words explanations are item outcomes, so they may survive if reworded as what was done on items [I].
4. **parent-experience O5 consent rows** (lessons, memory, WhatsApp, voice moments, transcripts) vs NM-10 purposes P1-P5. P5 here merges them; voice moments move to Controls.
5. parent-experience O1-O9 order is kept (hear her before number). P3 (trust) moves *before* VPC, so the price is known before the most effortful step.
6. **Azure-only directive vs messaging and TTS.** The pre-rendered clips, `NameSayer` and the parent taste must use Azure (Azure OpenAI TTS and realtime, or Azure AI Speech), never a third-party voice API. WhatsApp and SMS OTP are messaging rather than compute or AI, but they are paid. Check whether Azure Communication Services (SMS; Advanced Messaging for WhatsApp [M]) covers Indian numbers before choosing a WhatsApp BSP or SMS gateway. If it does not, the owner rules on the exception.
7. **dpdp-deep's narrow mode vs the deprioritisation.** This doc keeps the NM rules that double as trust (consent rows, no free-text box, interests only with permission, first-party counters). Legal-mode gating (M0/M1) of the diagnostic outputs is described but not required at launch.

---

## 14. Open questions

- [U] Does any production DigiLocker route return an age-over-18 token to a private fiduciary, and how long does it take on a budget phone? (dpdp-deep §3.3 M-a is unverified.) The P4 budget is a guess until then.
- [U] Is P2 consent preselected acceptable as "clear affirmative action" if the parent taps the primary button on that screen? Counsel.
- [U] Should the diagnostic run in the parent's chosen first subject when that is Science/EVS/SST? This doc runs the maths or reading floor instead, because reading level gates everything. Test parent reaction.
- [U] Hindi-medium children reading English-term labels inside Devanagari captions during the diagnostic (kids-ux §8.1): does it confuse the reading strand?
- [M] Re-walk Duolingo, Khan Kids and Speak on a budget Android phone (India storefront) and record screen counts and time to the first exercise; replace the [M] cells in §2.1.
- [M] DLT template registration lead time for SMS OTP; WhatsApp authentication template approval and per-message cost in India.

---

## 15. Sources

Fetched this session [V]:
- Duolingo onboarding (Appcues GoodUX): https://goodux.appcues.com/blog/duolingo-user-onboarding
- Duolingo, how to add a new course: https://blog.duolingo.com/add-new-course/
- Growth.Design, Duolingo case study: https://growth.design/case-studies/duolingo-user-retention
- Lenny's Newsletter, How Duolingo reignited user growth: https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth
- Khan Academy Kids: https://www.khanacademy.org/kids ; App Store https://apps.apple.com/us/app/khan-academy-kids/id1378467217
- Speak: https://www.speak.com/ ; App Store https://apps.apple.com/us/app/speak-language-learning/id1286609883
- Cuemath: https://www.cuemath.com/ ; https://www.cuemath.com/en-in/ ; https://www.cuemath.com/blog/how-to-know-if-math-tutoring-is-working/
- YoLearn.AI: https://www.yolearn.ai/ ; https://www.yolearn.ai/students/pricing
- Android runtime permissions: https://developer.android.com/training/permissions/requesting
- Android notification permission: https://developer.android.com/develop/ui/views/notifications/notification-permission
- SMS Retriever API: https://developers.google.com/identity/sms-retriever/overview
- WhatsApp authentication templates: https://developers.facebook.com/docs/whatsapp/business-management-api/authentication-templates
- ASER 2024 assessment tasks: https://asercentre.org/wp-content/uploads/2022/12/ASER-2024-assessment-tasks.pdf
- Andrew Chen, Quettra retention data: https://andrewchen.com/new-data-shows-why-losing-80-of-your-mobile-users-is-normal-and-that-the-best-apps-do-much-better/
- Google Play reviews and metadata (India storefront), pulled 2026-10-02 with `docs/research/design/onboarding_reviews.py` and `onboarding_login_themes.py`; raw outputs in the JSON files beside them. App IDs: com.duolingo, org.khankids.android, com.selabs.speak, com.cuelearn.cuemathapp, com.yolearn.student, com.byjus.thelearningapp, com.vedantu.app, com.curiousjr, xyz.penpencil.physicswala, com.Extramarks.Smartstudy, com.unacademyapp, com.seekhojunior.android, com.infinitylearn.learn.

Tried, not usable: useronboard.com Duolingo teardown (slides not in text); khankids.zendesk.com (403); cuemath.com/faq and /free-trial-class (404); screensdesign Speak (not found); teachingattherightlevel.org and the J-PAL TaRL case study (no assessment detail).

Repo sources (their own tags apply): `docs/research/learning-science.md`; `docs/research/safety/dpdp-deep.md`; `docs/research/design/parent-experience.md`; `docs/research/design/kids-ux-ages.md`; `docs/research/voice/indian-teacher-discourse.md`; `docs/harvest/gurukul.md`; `docs/ARCHITECTURE.md`; `context/measurements.md`; `data/curriculum/boards.json`; `docs/research/content/maths-engine-map.json`; `docs/research/market/playstore-snapshot-2026-10-02.json`.


---

## Critique

2026-10-02 · design critic pass (senior children's product designer stance). Scope: the five attacks requested (babyish for 10-15, accessibility, reward-economy creep, text load for 6-9, low-end Android), plus anything else that broke on reading. Evidence tags as above. **Method limit:** this critique is a desk read of this document against the repo docs it cites. No new web search was run and no device was used. Claims about WCAG 2.2, TalkBack and Android process behaviour are **[M]** (prior knowledge, not re-checked this session) and each correction that rests on one says so. The doc's own [U]/[I] items are not upgraded by anything here.

**Verdict.** The parent half is strong: the evidence-led OTP and trust work is the best part of the doc. The child half is written for one 7-9 year old and then stretched across four bands by changing tile counts. It has no honest-framing path for teens, a diagnostic that confounds reading with numeracy, a voice-only assumption that excludes some children outright, and a first-run chain (WhatsApp, DigiLocker, WebRTC, Rive, module engines) that a 2 GB phone will kill midway. None of these needs a redesign. Each is a correction below.

### A. Babyish for 10-15 (bands B3-B4)

| # | where | attack | correction |
|---|---|---|---|
| A1 | C1 avatar pick, C3 picture tiles, C4 story wrapper | The child path is one shape for ages 6-15: avatar pick, picture tiles, "stall" or "feeding the animals" stories. A 13-15 year old in Class 8-9 reads this as a toy, and "a toy" is the verdict that ends a 30-day relationship before it starts [I]. §5 only varies tile *count* by band. | Split the child path into two skins at the band edge. **B1-B2:** as written. **B3-B4:** no avatar step (name only, an optional initial badge later); interest is asked as two or three plain options in text plus voice ("cricket / music / coding / drawing / something else, say it"), no illustrated tiles; the diagnostic frame is the real task (a mixed set of problems from the chapter chain) with the teacher as a fast, dry, respectful adult, not a story. Reuse the same rung engine; only the wrapper changes. Add band-skin as an explicit field on `DiagnosticStage` and `InterestTiles`. |
| A2 | §5 C4 "never use the word test" for all bands | For B1-B2 a story frame is kind. For B3-B4 it is a small lie that a 12 year old sees through within two items, and the neutral earcon after every answer (no verdict) makes the lie obvious. Being caught being coy costs more trust than the word "check" ever would. | For B3-B4 say what it is, in the register of respect: she is finding what the child already knows so she does not waste their time, it is not marked, no one sees a score. This still obeys the no-score, no-timer, no-class-label rules. G-ONB-2 should ban "test/exam/pariksha/score/marks" for B1-B2 strings only and require an honest-purpose line in B3-B4 strings. |
| A3 | C6 "call your parent and show them" | Outward-pointing relatedness is good for B1-B2. For B3-B4 it is performing for a parent on demand, and many teens will refuse or lie. Parents are also often absent (the doc already guesses >50% as a reverse condition). | B3-B4: C6 is **optional and addressable to anyone** ("show whoever is around, or tell me in your own words"); the teach-back to the teacher is the evidence, the parent audience is a bonus. Keep the P1 teach-back probe either way. Never let the flow wait on a parent being present. |
| A4 | P6 item 6 "tum or aap" set only by the parent | A parent picks *tum* by default for a 14 year old, and the teen experiences being talked down to. Autonomy for the child is also a stated learning-science need (rule 26). | Make the child the owner of this one choice from B3 up: after C1, the teacher offers the choice and the answer overrides the parent's. Parent default for B3-B4 is *aap* (suggest, not mandate). |
| A5 | C3 interest set ("cricket, drawing, animals, cooking, trains, building things") | The list reads young and gendered by implication. It also trains the product to stereotype. | Vet one gender-neutral set per skin, test it with children before launch. Never imply a default by order (randomise tile order per session or alphabetise in the school-medium script). |
| A6 | P6 "Class 1-9" 9 tiles | A Class 8-9 child who is working at Class 5 level is placed correctly by the engine but sees a childish first win. | The first win (C5) for B3-B4 starts from the *skill* but is framed with Class-8-9 contexts (money, speed, data), which concreteness fading permits (rule 19). Add the same attention to the R1 bridge: show path to the school chapter first for B3-B4, since for them the school chapter is the product. |

### B. Accessibility

| # | where | attack | correction |
|---|---|---|---|
| B1 | whole flow | The doc has no accessibility section. A voice-first child flow with an auto-advance and an earcon-only acknowledgement has no non-audio path for a deaf or hard-of-hearing child, and the spoken teacher is a barrier in a quiet or crowded room. Captions exist on P1 and C2, but not as a contract for every teacher line. | Add an a11y contract: every teacher utterance has a synchronised caption (script chosen by school medium); every earcon has a visual equivalent (a small mark on the answer tile, not a score); every speaker button has a visible text label. Add as **G-ONB-5**: caption coverage 100% of fixed lines, asserted in a build test. |
| B2 | P0 `VoiceTile` "plays on pointer-down (≤100 ms)" | Activating on pointer-down breaks TalkBack's explore-then-double-tap model and fails the pointer-cancellation expectation (WCAG 2.2 2.5.2) [M]. A parent with low vision using TalkBack could not select a language. | Pointer-**up** activation with an immediate pressed-state change (<100 ms visual feedback) and audio start on activation. For TalkBack, each tile's accessible name is the language name, activation plays the sample. |
| B3 | C2 "moves on by itself", C1-C3 timers | Auto-advance with no pause fails WCAG 2.2.1/2.2.2 intent [M] and also fails a slow reader, a child with a motor or processing delay, and a parent who is interrupted. | Auto-advance only after the audio and caption have both finished plus a hold of at least 3 s, with a visible pause/continue control and a replay. No path in onboarding may time out into a different state. |
| B4 | P0 "greeting auto-plays at about 1 s" on Android | Unrequested audio at app open on a shared family phone: at work, in a bus, next to a sleeping baby. WCAG 1.4.2 expects a control for audio that plays automatically [M]. It also surprises with no way to stop. | Autoplay once, short (≤3 s), under a visible stop, and respecting the device's silent/vibrate mode (show a "tap to hear her" state instead). Never autoplay on P3+. |
| B5 | tiles (class, board, home language) | The doc gives target sizes only by reference to kids-ux bands. The parent surface has no stated minimum target, and the adult path includes older users with low dexterity. | Adult-surface floor: 48 dp targets with 8 dp spacing (WCAG 2.2 2.5.8 sets a lower bound of 24 px; Android guidance is 48 dp) [M]. Class tiles in a 3x3 grid on a 360 dp-wide screen satisfy this; assert it in the design-token test. |
| B6 | colour and state | State words (*abhi nahi / seekh rahi / aa gaya*) are specified, colour is not. | Never colour alone: each state also has a shape and the word. Contrast gates inherited from gurukul §6 apply to parent and child skins both. |
| B7 | C4 reading strand | A dyslexic or low-vision child is placed "low" because the screen is hard to read, not because the reading is weak, and then R1 tells the parent. | Add an accessibility prompt in P6 (optional, one tap, "does she need larger text or a calmer screen?") that sets text size and removes distractor motion, and mark any placement made under it as "provisional" in R1. Do not name a condition. |
| B8 | mic denial | Tap mode is "fully working" but the doc does not say that every voice-only interaction has a tap equivalent, including *answering* the diagnostic. | Make "voice or tap" a hard invariant on every child screen, tested by running the whole flow in tap mode and in voice mode in CI. |

### C. Reward-economy creep (low, but four places to close)

The doc is mostly clean (no points, coins or streaks, as its rules say). Creep arrives through the side door.

| # | where | attack | correction |
|---|---|---|---|
| C1 | C4 neutral earcon after *every* answer | A consistent chime after each answer is an operant reward cue even when it carries no verdict: children learn "answer, hear the sound", and the sound becomes the goal. It also reads to an older child as a vending machine. | Make the acknowledgement the teacher's own varied, spoken or visible response to the *content* of the answer, not a fixed chime. If an earcon is kept for B1-B2, use it for "item received" and keep it identical after correct and incorrect answers, **A/B it against no earcon** in M-ONB-6. |
| C2 | C1 avatar choice | Avatar customisation is the on-ramp to collectible wardrobes (kids-ux §9 already rejects free-roam collections). | Keep it a single, fixed, non-changing choice that serves identity (which profile is whose). Say in the contract that avatar options are never unlockable, never extended by progress. Drop it entirely for B3-B4 (A1). |
| C3 | C5 "teaching expectancy up front: the child will show their parent" | Used well, it is teach-back motivation. Used as written it is a performance contract: the child learns that the lesson is a rehearsal for an audience. The pressure is the same mechanism as a streak (social loss if you cannot show). | Say it as an invitation, with a graceful no ("or show me, I am listening"), and never record "did not show" anywhere. See A3. |
| C4 | P8 "profile shows ready", R2 "next lesson's topic", `StepDots`, default report day | A "ready" badge, a named next lesson and a fixed Sunday card are the skeleton of a come-back loop. Individually fine; together with a reminder time they are a habit funnel the doc says it does not run. | State the principle: the parent chooses all return cues. No "ready" badge on the child's picker (a neutral list of profiles only). `StepDots` is for the *parent's* setup only and must not appear on any child screen. Keep the next-topic mention in the teacher's farewell, not as a UI element. |
| C5 | "always end on a success" | Not a reward, but a manufactured emotional beat. If the highest passed rung is far below the school chapter, "success" is real but the child feels the lesson was easy; if the engine inserts an easier item after a failure to end well, that is a fake win, which the doc forbids. | Keep as written (final item from the highest *passed* rung) and add an assertion that the engine never selects an item below the highest passed rung to manufacture a finish. Log how often the last item was a repeat; if above 30%, the rung ladder is too coarse [U]. |

### D. Too text-heavy for 6-9 (B1-B2)

| # | where | attack | correction |
|---|---|---|---|
| D1 | C4 wrapped word problems, captions | Class 1-2 children (6-7) cannot decode captions or word problems. A child who fails a story-wrapped maths item is mis-placed as weak at maths when the failure is reading. This confounds the two strands the doc itself separates. | **Numeracy items for B1-B2 must be language-light**: numerals, quantities on screen, spoken prompt, tap answers (ASER's arithmetic is numerals only [V via doc §5 C4, ASER 2024]). Story text is decoration only and must never be needed to solve the item. Add an item-property flag `reading_load: none|low|high`; the numeracy strand may only use `none`/`low` below Class 4, and a failed `high` item is never evidence about maths. |
| D2 | R0 readers in C4 reading strand | Using captions and read-aloud in the school-medium script while testing reading makes the captions a cheat sheet, and reading the prompt aloud *to* the child contaminates the item. | During the reading strand, suppress captions on the target text; the teacher's prompt names the *task* only. Receptive tap items stay (doc already has them). |
| D3 | C2 disclosure and P1 monologue | Young child sees "who I am" as a spoken block with replay only. Twelve seconds of talking at a 6 year old with no interaction, followed by C3, is two screens of passive listening. | Make C2 one gesture: the teacher says it and the child taps the teacher (or a picture of a phone and a speaker) to hear again. For B1-B2, no caption is needed; an icon strip (teacher = computer, parent = eye) carries the meaning. Keep the fixed reviewed lines. |
| D4 | C3 "which do you like?" | 2-4 picture tiles are fine for 6-9 *if* the pictures are unambiguous; stock icons for "building things" or "trains" are not. | Test the interest tiles with 6-9 year olds for recognisability (name them cold; target ≥90% [proposed]) before shipping; fall back to fewer and more concrete tiles. |
| D5 | text in the parent half | The parent half is text-light by design and speakers everywhere. Good. The risk is that a Class 1-2 child *is* the one holding the phone at P0 on a shared device. | Cover that: P0 and P1 should be safe for a child to be tapping through (no data entered, no commitments), and P2 onward should refuse to proceed without a parent gesture that a young child will not do by accident (a deliberate slide-and-hold, not a tap). |

### E. Breaks on low-end Android and patchy data

| # | where | attack | correction |
|---|---|---|---|
| E1 | P2 OTP, WhatsApp-first | On a **shared family phone** the parent's WhatsApp, or the parent's SIM, may not be on this device at all (feature-phone parent, second SIM in another phone, borrowed phone). One-tap WhatsApp autofill and SMS Retriever both assume the OTP lands on this device [M]. The doc's ladder is right but its default path is wrong for the stated users. | Always show a manual "type the code" field first-class, with a visible line "code goes to this number, on whichever phone has it". Add "Send to another phone's WhatsApp" as the explicit first fallback and measure the share (M-ONB-2 by device-has-SIM). Autofill is an enhancement, never the only path. |
| E2 | app switching: WhatsApp, DigiLocker | On 2 GB devices, switching to WhatsApp or DigiLocker is exactly when Android's low-memory killer ends the app in the background [M]. The doc says "deep-link return" and "resume token" but not process death. A parent returns to a cold start and loses P2-P6. | Persist onboarding state to local storage after every field (not on submit), restore on cold start to the same screen, and test by killing the process at each step in a device test (add **G-ONB-6**). Applies to P2, P4 and the diagnostic. |
| E3 | P1b realtime connect budget "8 s" | WebRTC connect through carrier-grade NAT on congested 3G or 4G can need TURN over TCP 443; 8 s may fail often, and the fallback is a clip, which defeats the point of the taste. Connect time is **not measured** (the doc says so). | Keep the 8 s as a hypothesis, not a spec. Require a measured connect-time distribution (M-ONB-1 gains "realtime connect p50/p90 by network") **before** P1b is built. Plan TURN-TCP fallback. If p90 exceeds 8 s on 3G, P1b is offered only on Wi-Fi or a good 4G signal and otherwise replaced by the pre-rendered demo, honestly labelled as a recording. |
| E4 | concurrent load in C4/C5 | Rive teacher + module engine (SVG or canvas simulation) + realtime audio + ASR + captions run simultaneously on a 2 GB, low-end SoC. The doc budgets *size* and *frame time* but not memory or heat. Throttling mid-lesson is the failure users blame on "the app". | Add a device-tier decision at P0 (RAM, SoC class, WebGL support) that picks the **static teacher** (still frames, no Rive) and a reduced module set on low tiers, silently, with no shaming "low-end" label. Budget peak RAM per screen in the device test (propose ≤250 MB on a 2 GB device [U, measure]). |
| E5 | room acoustics | A shared phone on a speaker in a noisy home: echo, siblings, TV. The first exchange (C3) is the *worst* moment for ASR to fail, and the doc's fix is "tiles of what she heard" which assumes ASR returned something. Echo of the teacher's own voice into the mic is the more likely failure on loudspeaker. | Default to the earpiece-or-headset-friendly volume with an on-screen "hold the phone near" hint for B1-B2; use hardware echo cancellation and measure double-talk on a real phone; make push-to-talk (hold a button) the default for B1-B2 in C3 until ASR is proven in a noisy-home test. Add the noisy-home condition to M-ONB-10. |
| E6 | data cost | The doc budgets the diagnostic pack (≤1.5 MB) but not realtime audio. A 15 minute session over 4G is real data on a prepaid daily cap, on a phone the family also uses for other things. | Estimate and publish session data use (measure it; M-ONB-1) and show the parent a plain line before "Abhi" on cellular ("a lesson uses about N MB"). Offer a lower-bitrate mode. Do not guess N; the doc has no number. |
| E7 | web autoplay, WebOTP | Fine as written but the doc's own assumption is that web is secondary. Many low-end users arrive on Chrome from a link, not the APK. | State which first-run steps are the same on the web (all) and which assets are not bundled there (P0 clips): preload with a "tap to hear her" state. |
| E8 | APK size | Bundling clips, Rive file, trust audio and consent audio in the APK is right for first audio, but no APK size budget is stated, and a bloated APK is itself a drop-off on 1-2 GB storage and slow 4G. | Set a hard APK size budget (proposed ≤25 MB download [U]) and assert it in CI; keep audio at the stated 24 kbps Opus. |

### F. Other breakages found on reading

1. **The diagnostic statistics are weaker than the doc's confidence.** "2 of 2 on 3-option items, chance 11%" is fine as a *pass*, but a single miss at n=2 fails the rung, which is a one-item verdict, and ASER's own rule gives careless errors a retry ("another chance with the same question") [V per §5]. Recognition (tap) items also overstate production ability, and ASER measures production [I]. **Correction:** allow one same-skill isomorphic retry after a first miss before moving down; track `tap-pass vs produce-pass` separately; M-ONB-5's "within one rung" bar should be read as a lower bound until measured, and the rung change (±1) should not be applied on the first item of a strand.
2. **Time caps vs the parent's daily cap.** A 10 minute B4 diagnostic, a 4 minute first win and onboarding chat could exceed a default daily cap prefilled at P7. **Correction:** the P7 default for the first day must be at least the sum of the child path, or the flow cuts off mid-diagnostic, which the doc forbids ("ends inside the cap").
3. **Placement shock mitigation (b)** "every lesson includes a short slice of the current school chapter" is marked [U] but R1 depends on it. If it fails the bridge promise is empty. **Correction:** promote to a decision with a reverse condition, or write R1 copy that does not promise a school slice.
4. **P5 preselected memory consent.** The doc itself marks this [U: counsel]. Even with compliance deprioritised, a preselected "recommended" row on a child's data is a dark-pattern risk to the trust the P3 page just built. **Correction:** make P2 an explicit primary-button choice with the plain no ("only this session") given equal visual weight, rather than preselecting it. Cost is a small opt-in drop; benefit is not contradicting "parent sees all".
5. **Timing table.** The arithmetic is consistent, but p50 values are guesses (the doc says so). Do not quote "about 14-20 minutes" externally until M-ONB-1 has run.

### G. Corrections, in priority order (to carry into the spec and `context/`)

1. **Split the child path into B1-B2 and B3-B4 skins**; B3-B4 get no avatar step, honest purpose framing, plain interest options and a dry, respectful teacher (A1, A2, A6).
2. **Make numeracy items language-light and flag `reading_load`**, so a failed word problem is never maths evidence (D1, D2).
3. **Manual code entry is first-class; WhatsApp and SMS autofill are enhancements**; OTP may go to another phone (E1).
4. **Persist onboarding state per field and test process death** at each step (E2, G-ONB-6).
5. **Accessibility contract and gates**: captions for every teacher line, visual equivalents for earcons, pointer-up activation, no auto-advance without a pause, TalkBack names, adult target floor 48 dp (B1-B6, G-ONB-5).
6. **Replace the fixed earcon with a content-aware response**, A/B against none; fix avatars as non-unlockable; remove `StepDots` and "ready" badges from child surfaces (C1, C2, C4).
7. **C6 and the teach-back are optional and audience-flexible** for B3-B4 and never recorded as "did not show" (A3, C3).
8. **Measure realtime connect time before building P1b**, and add a device-tier switch (static teacher, reduced modules) with a peak-RAM budget (E3, E4).
9. **Add retry-before-drop, tap-vs-produce tracking and a daily-cap default that fits the first session** (F1, F2).
10. **Child owns *tum/aap* from B3 up**, parent default *aap* for B3-B4 (A4).
11. **Do not preselect the memory consent row** (F4).

New proposed decisions for §13: `onb-band-skins` (reverse if M-ONB-6 shows B3-B4 prefer the story frame), `onb-numeracy-language-light` (reverse never expected), `onb-otp-manual-first` (reverse if M-ONB-2 shows autofill success above 90% across device-has-SIM), `onb-state-persist-per-field` (no reversal expected), `onb-no-fixed-earcon` (reverse if the A/B shows comfort gain without outcome change). New gates: **G-ONB-5** caption and visual-equivalent coverage, **G-ONB-6** process-kill resume at every onboarding step.

Sources for this critique: this document and the repo docs it cites; WCAG 2.2 (W3C), Android accessibility and low-memory behaviour, and TalkBack interaction model, all **[M]**, to be verified against the primary pages before any gate quotes a criterion number.
