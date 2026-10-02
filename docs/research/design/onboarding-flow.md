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
