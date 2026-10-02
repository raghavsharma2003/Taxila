# DPDP deep-dive: what India's data law means for a voice tutor for 6–15-year-olds

Status: research memo, 2026-10-02. **Not legal advice.** It is an engineering reading of primary texts, written so counsel can answer specific questions quickly. Every design rule here that depends on an interpretation says so, and §8 lists the questions for counsel.

Builds on (does not repeat): `docs/research/learning-science.md` §4.3 and rules 31–35, `docs/harvest/gurukul.md` §4, and `docs/harvest/companion-tech.md` §7.

## Evidence tags

- **[V]** Read in the primary text during this session: the DPDP Act (Gazette No. 25, 11 Aug 2023; MeitY PDF md5 `cf08dd32…`), the DPDP Rules (G.S.R. 846(E), Gazette No. 760, 13 Nov 2025, bilingual; MeitY PDF md5 `c7fd9319…`), the PDP Bill 2019 (No. 373 of 2019, as introduced), the CERT-In Directions of 28 Apr 2022, EDPB Guidelines 3/2018, GDPR Recitals 24 and 38, 16 CFR 312.2 (COPPA), and ICO Children's Code standard 12.
- **[S]** Secondary: law-firm notes, compliance trackers, news. These are dated, and the date is given where it matters.
- **[U]** Not verified. This covers my inferences, memory, and facts I could not fetch (for example, whether a DigiLocker age-token API is in production).

**Method note.** Every legal quotation below comes from the gazette text, extracted with `pdftotext`, not from a summary. The web-search budget ran out partway through, so a few 2026 status items rest on trackers last checked in August–September 2026, and §10 asks for them to be re-checked.

---

## 0. Bottom line

1. **Nothing in DPDP's substantive regime is in force yet.** Sections 3–17, including section 9, and Rules 3, 5–16, 22 and 23 start **18 months after 13 Nov 2025: 13 May 2027** (some sources say 14 May; treat 13 May as the deadline). [V for the Rules text; S for the Act's commencement notification G.S.R. 843(E)]
   - Until then, IT Act s.43A and the SPDI Rules 2011 still apply [S]. The CERT-In 6-hour incident reporting rule applies today [V].
   - Build to the DPDP standard from day one anyway. A child enrolled in 2026 is still a user in May 2027.
2. **The s.9(3) ban cannot be unlocked by consent.** *"A Data Fiduciary shall not undertake tracking or behavioural monitoring of children or targeted advertising directed at children."* [V]
   - Parental consent (s.9(1)) does not unlock it. Only a Fourth Schedule exemption (s.9(4) and Rule 12) or a s.9(5) "verifiably safe" notification does.
   - The Act defines neither "tracking" nor "behavioural monitoring" [V: s.2 has no such entry].
3. **The strongest argument that a learner model is banned comes from the Rules themselves.** The Fourth Schedule had to *exempt* educational institutions so they could do *"tracking and behavioural monitoring … for the educational activities of such institution"* [V].
   - That implies the government regards educational tracking of a child's learning as "behavioural monitoring".
   - On that reading, a direct-to-consumer (D2C) app outside the exemption may not do it.
4. **The strongest counter-argument comes from legislative history.** The PDP Bill 2019 barred *"profiling, tracking or behaviouraly monitoring"* [V]. The 2023 Act dropped the word "profiling".
   - This supports the view that inference or personalisation by itself is not banned. What is banned is monitoring of *behaviour*.
   - Comparative law agrees only in part: COPPA treats "personalize the content" as internal operations [V], and the ICO accepts profiling intrinsic to the core service [V], but the EDPB counts "personalised … analytics services" as behavioural monitoring [V].
5. **No authority has decided whether a D2C edtech app is an "educational institution".** The definition is *"an institution of learning that imparts education, including vocational education"* [V]. There is no Board, court or MeitY guidance [S: none found as of Sep 2026]. Treat a D2C claim to the exemption as a litigation position, not a design basis.
6. **The safest defensible launch design is "Narrow Mode M1 – Academic Record"** (§6). It persists only *what the child has demonstrated on curriculum items*: mastery, misconceptions and review due-dates, derived deterministically from graded answers.
   - Adaptation within a session is allowed and discarded at session end.
   - The following are never persisted: behaviour, engagement, affect, timing, prosody, "vibe" and relationship scores.
   - There are no third-party SDKs.
   - The full learner model (format efficacy, vibe, engagement) runs only in **School Mode M2** (Taxila acting as Data Processor for a school, under the school's exemption) or after a favourable written opinion.
7. **Rule 10 checks that the consenting person is an identifiable *adult*. It does not check that they are the *parent*** [V].
   - `tech-and-market.md` §7.4 and at least one tracker say otherwise. They are wrong.
   - Illustrations, Case 4 (a parent who is new to the platform opens the child's account) is Taxila's main flow. It requires checking *"by reference to identity and age details issued by an entity entrusted by law or the Government … or to a virtual token"*. DigiLocker is optional ("may") [V].
   - Self-declaring an age does not meet the illustrations.
8. **Rule 8(3) is a new minimum-retention duty, not present in the January 2025 draft** [S: Shardul].
   - It requires one year's retention of *"such personal data, associated traffic data and other logs of the processing"* [V].
   - Read literally, it collides with "audio is never stored" (ARCHITECTURE.md §1.7). This is the most urgent question for counsel after s.9(3).
9. **A section 9 breach costs up to ₹200 crore** [V]. The other caps are ₹250 crore (security safeguards, s.8(5)), ₹200 crore (breach notification), ₹150 crore (SDF duties) and ₹50 crore (anything else).
   - Two or more penalties can lead to **blocking** under s.37 [V], which would end the app.
   - A startup exemption, if notified under s.17(3), cannot cover s.9 [V].
10. **Significant Data Fiduciary (SDF) risk is real at scale but not imminent.** No SDF has been notified [S, Sep 2026]. A January 2026 MeitY proposal named "entities which operate AI systems" among likely SDFs and would have brought SDF duties forward to 13 Nov 2026. It had not been notified as of Aug 2026 [S].
11. **Cross-border transfers are lawful today.** Section 16 is a negative list and nothing is notified [S, Sep 2026]. Storage is currently Neon in Singapore, with inference on Azure eastus2. The risk is future (SDF data localisation under Rule 13(4), or a specific notification), so design for portability to an India region.

---

## 1. What is in force, and when

| date | what commences | source |
|---|---|---|
| 11 Aug 2023 | The Act is enacted; it commences only by notification (s.1(2)). | [V] |
| 13 Nov 2025 | **Act:** s.1(2), s.2, ss.18–26 (the Board), s.35, ss.38–43, s.44(1) and s.44(3). Notification G.S.R. 843(E), Gazette No. 757. **Rules:** 1, 2 and 17–21 (Board machinery). | Rules r.1(2) [V]; Act notification [S: dpdprules.org, cadp.in, Legal500, IFF, all consistent] |
| 13 Nov 2026 | **Act:** s.6(9) (Consent Manager registration) and s.27(1)(d). **Rules:** r.4 (Consent Managers). | r.1(3) [V]; Act [S] |
| **13 May 2027** | **Act:** ss.3–17 (all obligations, including **s.9**), the rest of s.27, ss.28–37, and **s.44(2)**, which omits IT Act s.43A and so ends the SPDI Rules regime. **Rules:** 3, 5–16, 22 and 23 (notice, security, breach, retention, **Rule 10 VPC**, **Rule 12 / Fourth Schedule**, SDF, rights, transfers). | r.1(4) [V]; Act [S] |

Ambiguities and pending items:

- **The 13 vs 14 May question.** The gazette is dated Thursday 13 Nov 2025, but the digital signature is timestamped 14 Nov 2025 10:43 [V].
  - Shardul and the dcomply tracker compute 14 May 2027; most others compute 13 May [S].
  - Engineering target: everything below is live by **1 Apr 2027**.
- **Proposal to compress the timeline** (MeitY stakeholder meeting, 23 Jan 2026; comments were due 4 Feb 2026) [S: Mondaq, 15 Apr 2026]. It would put SDF obligations in force by 13 Nov 2026, Rule 8(3) retention within 90 days of the amendment, and Rules 13(4) and 15 immediately. Trackers dated Aug–Sep 2026 do not report it as notified [S]. **Re-check before relying on May 2027.**
- **The Data Protection Board.** It is established on paper. Applications for Chairperson and four Members were invited in May 2026, and no appointments were found as of Aug 2026 [S]. In practice, enforcement will lag the commencement date. Legally, it does not.
- **Before May 2027 (if Taxila launches in 2026)** [U: SPDI text not fetched this session; verify]:
  - SPDI Rules 2011 apply: a privacy policy, a grievance officer, and written consent for "sensitive personal data".
  - Under SPDI, "biometrics" covers voice patterns only *for authentication purposes*. A tutoring voice stream is therefore probably not SPDI, unless Taxila adds speaker-ID (it must not).
- **CERT-In applies now** [V]: report cyber incidents within **6 hours**; keep ICT logs for a **rolling 180 days, maintained within Indian jurisdiction**; synchronise clocks to NIC/NPL NTP; designate a point of contact.
- **Transition (s.5(2))** [V]. Where consent was taken before commencement, the fiduciary must give a fresh notice "as soon as it is reasonably practicable". It may keep processing until consent is withdrawn.
  - Whether s.5(2) also cures children's consent that does not meet Rule 10 is unclear (counsel question Q12).
  - Removing the doubt is cheap: collect Rule-10-grade VPC from the first signup.

---

## 2. Section 9 and the definitions it relies on

### 2.1 Section 9 [V]

- **9(1)** — the fiduciary shall, *"before processing any personal data of a child … obtain verifiable consent of the parent … in such manner as may be prescribed."*
- **9(2)** — *"A Data Fiduciary shall not undertake such processing of personal data that is likely to cause any detrimental effect on the well-being of a child."*
- **9(3)** — *"A Data Fiduciary shall not undertake tracking or behavioural monitoring of children or targeted advertising directed at children."*
- **9(4)** — *"The provisions of sub-sections (1) and (3) shall not be applicable to processing … by such classes of Data Fiduciaries or for such purposes, and subject to such conditions, as may be prescribed."* This means **s.9(2) can never be exempted.**
- **9(5)** — where the government *"is satisfied that a Data Fiduciary has ensured that its processing of personal data of children is done in a manner that is verifiably safe"*, it may notify *"the age above which that Data Fiduciary shall be exempt"* from all or part of 9(1) and 9(3).
  - The exemption is specific to one fiduciary and is set by an age threshold.
  - No process or notification exists [S]. It is realistic only for older students (perhaps 13–17), and only after Taxila has a track record.

### 2.2 Definitions that change the analysis [V]

- **"Child":** *"an individual who has not completed the age of eighteen years"* (s.2(f)). Every Taxila learner is a child.
- **"Data Principal"**, where the individual is a child, *"includes the parents or lawful guardian"* (s.2(j)). Consequences:
  - The parent holds the rights of access (s.11), correction and erasure (s.12) and grievance (s.13).
  - The parent receives breach intimations (Rule 7).
- **"Processing"** includes *"collection, recording, … structuring, storage, adaptation, retrieval, use, alignment or combination, indexing …"* (s.2(x)). A child's live voice streamed to an ASR model is processing, even if nothing is stored.
- **Not defined:** "tracking", "behavioural monitoring", "targeted advertising", "detrimental effect" and "well-being".
  - "Advertisement" takes its meaning from the Consumer Protection Act 2019, but only for the Fourth Schedule (Schedule note (a)) [V].
- **Consequence of s.9(1)** [V text; U on how strictly it will be enforced]: VPC is needed before *any* processing. That means:
  - No "try a lesson first" with a child's voice before the parent has been verified.
  - The only processing allowed before VPC is the Rule 10 due-diligence flow itself (Fourth Schedule Part B, item 6; §4).

### 2.3 Drafting history (aids to interpretation, not binding)

- **PDP Bill 2019, s.16(5)** [V]: *"The guardian data fiduciary shall be barred from profiling, tracking or behaviouraly monitoring of, or targeted advertising directed at, children and undertaking any other processing of personal data that can cause significant harm to the child."*
  - s.3(32) defined profiling as processing *"that analyses or predicts aspects concerning the behaviour, attributes or interests of a data principal"*.
  - The 2019 ban applied only to *guardian data fiduciaries*: services directed at children, or those processing large volumes of children's data.
- **DPDP Act 2023, s.9(3)** [V] made two changes:
  1. It dropped "profiling".
  2. It widened the ban from guardian data fiduciaries to *every* Data Fiduciary.
- **Reading** [U]:
  - Change (1) narrows *what* is banned. Change (2) widens *who* is bound.
  - Indian courts give limited weight to lapsed bills [U]. So this is an argument for counsel to weigh, not a safe harbour.

---

## 3. Rule 10: verifiable parental consent, mechanism by mechanism

### 3.1 The text [V]

- **r.10(1).** The fiduciary *"shall adopt appropriate technical and organisational measures to ensure that verifiable consent of the parent is obtained before the processing of any personal data of a child and shall observe due diligence, for checking that the individual identifying herself as the parent is an adult who is identifiable if required in connection with compliance with any law for the time being in force in India, by reference to—*
  - *(a) reliable details of identity and age of the individual available with the Data Fiduciary; or*
  - *(b) details of identity and age, voluntarily provided — (i) by the individual; or (ii) through a virtual token mapped to such details, which is issued by an authorised entity."*
- **"Authorised entity"** (r.10(2)(b)) means:
  - an entity entrusted by law or by the Central or State Government with issuing identity and age details or tokens, or a person it appoints or permits; and
  - it *"also includes details of identity and age or token made available and verified by a Digital Locker Service Provider"*.

### 3.2 What Rule 10 does and does not require

| question | answer | tag |
|---|---|---|
| Must Taxila verify that the adult is the child's **parent**? | **No.** The due diligence is that "the individual identifying herself as the parent is an adult who is identifiable". The relationship is *declared*. | [V] |
| Is a self-declared age ("I am over 18") enough? | Probably not. Cases 2 and 4 require a check "by reference to identity and age details issued by an entity entrusted by law or the Government … or to a virtual token". r.10(1)(b)(i) means government-issued details that the individual hands over. | [V text; U interpretation] |
| Is DigiLocker mandatory? | No. *"P may voluntarily make such details available using the services of a Digital Locker service provider"* (Cases 2 and 4). | [V] |
| Does route (a), "details available with the DF", help a new company? | Only for parents Taxila has *already* verified, for example a second child on the same account (Cases 1 and 3). | [V] |
| Does processing done in order to run VPC itself need VPC? | No. Fourth Schedule Part B, item 6 exempts processing *"for confirmation … that the Data Principal is not a child and observance of due diligence under rule 10"*, restricted to what is necessary. | [V] |
| Must the ID document be stored? | Not by the text. "Identifiable if required in connection with compliance with any law" supports keeping a verification result plus a token reference, not the ID number. Rule 6(1)(a) names "virtual tokens mapped to that personal data" as a safeguard. | [V text; U design] |

### 3.3 Mechanisms for Taxila's Case-4 flow (a new parent opens a child account)

| # | mechanism | fits r.10? | data minimisation | status |
|---|---|---|---|---|
| M-a | DigiLocker: the parent shares an age or identity attribute or token (or an issued document such as a PAN or driving licence) | Yes, named in the text | Store: method, verified-adult boolean, token or reference ID, timestamp, issuer. **Never** the Aadhaar number. | **[U]** Whether DigiLocker offers a production "age-over-18 token" API to private fiduciaries was not verified. The document-pull route via DigiLocker requester onboarding is a fallback [U]. |
| M-b | Another authorised entity (e.g., a UIDAI offline-verification or age-attribute product, or an IDV vendor reading government IDs) | Plausibly, if the issuer or the "person permitted" is authorised | Same as M-a | [U] Aadhaar's limits on private-entity use need counsel (Q5). |
| M-c | Parent types in ID details that Taxila checks against an issuer API | r.10(1)(b)(i), if checked against the issuer | Store the result, not the number | [U] Depends on which APIs exist. |
| M-d | A card or UPI payment by the parent | **Not named.** A payment instrument does not establish age. | — | Do not rely on it alone (Q4). |
| M-e | Self-declaration with a checkbox | Fails the illustrations | — | Rejected as the sole mechanism. |
| M-f | **School Mode** | Not needed for exempt processing (Part A, item 3) | — | Only inside the school's exemption scope (§4). |

Build requirements regardless of mechanism [V obligations; U implementation]:

1. **The consent ledger is evidence.** s.6(10) puts the burden on the fiduciary to prove that notice was given and consent obtained.
   - Use an append-only `consent` table with versions per purpose (it already exists in ARCHITECTURE.md §1.7).
   - Add a `vpc_verification` row: method, result, issuer, token reference, timestamp, notice version hash.
2. **The parent attests to the relationship.** Store the attestation.
   - s.15(b) makes impersonation by a data principal a breach, with a penalty of up to ₹10,000 [V].
3. **Withdrawal must be as easy as giving consent** (s.6(4), Rule 3(c)(i)) [V]. On withdrawal:
   - stop processing, and cause processors to stop (s.6(6)); and
   - erase (s.8(7)), subject to the Rule 8(3) question (§7.5).
4. **Notice and consent are offered in English and Hindi**, with the option of any Eighth Schedule language (s.5(3), s.6(3)) [V].
5. **Re-consent when a learner turns 18** [U: the Act is silent]. At 18 the parent stops being "the Data Principal". Ask the now-adult learner to consent, or close the account.

---

## 4. Fourth Schedule exemptions [V, verbatim]

**Part A (classes)** — s.9(1) and 9(3) do not apply to:

1. A clinical establishment, mental health establishment or healthcare professional (health services only).
2. An allied healthcare professional (implementing a treatment or referral plan).
3. **"A Data Fiduciary who is an educational institution."** The condition reads:
   > *"Processing is restricted to tracking and behavioural monitoring—(a) for the educational activities of such institution; or (b) in the interests of safety of children enrolled with such institution."*
4. Crèche and day-care carers (safety tracking).
5. School-transport operators (location during travel).

**Part B (purposes)** — s.9(1) and 9(3) do not apply to processing for:

1. Duties under law in the interests of a child.
2. Subsidies or benefits under law, policy or public funds.
3. *"the creation of a user account for communicating by email"* (email use only).
4. *"the determination of real-time location of a child"* (safety only).
5. *"ensuring that any information, service or advertisement likely to cause any detrimental effect on the well-being of a child is not accessible to her"*.
6. Confirming that the user is not a child, and Rule 10 due diligence.

**Definition** (note (c)): *"'educational institution' shall mean and include an institution of learning that imparts education, including vocational education."*

### 4.1 Is D2C Taxila an "educational institution"? Three readings

| reading | what counts | for | against |
|---|---|---|---|
| **E-narrow** | Schools, colleges and universities recognised or affiliated under law; perhaps registered coaching centres | "Institution" suggests an establishment. Clause (b) says "children **enrolled** with such institution". The neighbouring rows (crèche, school transport) assume physical care settings. | "Mean and include" is a broad drafting formula, and "vocational education" deliberately reaches beyond schooling. |
| **E-middle** | Any entity that enrols students into structured, curriculum-bound instruction and "imparts education", whether online or offline | The functional words "imparts education". An online tutoring service with enrolment, curriculum and assessment does impart education. | There is no recognition requirement, so every app could claim it. A regulator will resist that because it empties s.9(3). |
| **E-broad** | Any edtech service | — | It would swallow the rule. Commentary leans against edtech qualifying [S: summarised in learning-science.md §4.3]. |

**Scope of the condition** [V text; U reading]. Even where the exemption applies, processing is *"restricted to tracking and behavioural monitoring … for the educational activities of such institution"* (or for safety).

- On the better reading, the condition *limits* the exemption: tracking and monitoring for teaching are exempt; anything else (ads, cross-product profiling, model training for other customers) is not.
- s.9(2) (detrimental effect) still applies in full.

### 4.2 The School Mode route (Taxila as Data Processor)

s.8(1) makes the fiduciary responsible for processing *"undertaken by it or on its behalf by a Data Processor"*, and s.8(2) permits processors *"only under a valid contract"* [V]. If a school is the Data Fiduciary (it decides purposes and means) and Taxila processes for it, the school's Part A item 3 exemption arguably covers Taxila's processing for that school's educational activities [U: needs an opinion, Q2]. Conditions that keep the route honest:

- **Contract.** A data processing agreement (DPA) with the school that sets purpose limitation, erasure on termination (s.8(7)(b)), security (Rule 6(1)(f)) and breach cooperation.
- **Separate data.** School-mode data is partitioned from consumer-mode data. There is no cross-use, and it is not used for Taxila's own model improvement unless the school is the fiduciary for that too.
- **The school controls it.** The school, not the parent, configures what is tracked. Parents still see their child's data through the school relationship.
- **The risk.** If Taxila sets the purposes (its own product roadmap, its own consumer upsell to the same child), it becomes a fiduciary in its own right and loses the school's cover.

### 4.3 A gap: safety monitoring in a D2C app

Part A item 3(b) exempts *safety* monitoring only for educational institutions [V]. A D2C app scanning a child's transcript for self-harm or abuse disclosures (ARCHITECTURE.md §1.6) fits only:

- Part B item 5, *"ensuring that any information, service … likely to cause any detrimental effect … is not accessible to her"* [V]. This plainly covers filtering what Taxila *outputs*. Whether it covers detecting what the child *says* is an open question.
- Or the argument that answering a disclosure *within a conversation* is not "monitoring" at all.

**Do not drop the safety scan.** Shape it so that it is defensible under both arguments (§6, NM-11), and put the question to counsel (Q7).

---

## 5. Does an adaptive learner model count as "behavioural monitoring"?

### 5.1 Three interpretations

**I1: literal and broad.** Any systematic observation of an identified child's behaviour over time is "behavioural monitoring", including correctness patterns, response timing, hint use, engagement and affect. The same is true when it is used to infer, predict or decide. Knowledge tracing is monitoring.

- **For:**
  - "Monitoring" in its plain sense means observing and checking over time.
  - The ban is absolute and cannot be cured by consent.
  - The **surplusage argument**: if tracking a learner "for the educational activities" were not behavioural monitoring, Part A item 3 would be pointless [V text].
  - The EDPB reads "monitoring of behaviour" to include *"Personalised diet and health analytics services online"* and profiling for *"analysing or predicting … personal preferences, behaviours and attitudes"* [V: EDPB 3/2018; GDPR Recital 24].
  - A penalty of up to ₹200 crore.
- **Against:**
  - Absurdity: a tutor that may not remember what a child got wrong yesterday cannot tutor. Parliament is presumed not to ban the core of a lawful service the parent asked for.
  - The Fourth Schedule could also be read as *clarifying* rather than implying.

**I2: purposive, harm-based.** Read alongside "targeted advertising", the ban aims at commercial surveillance: cross-context tracking, behavioural profiling for ads, engagement maximisation, sale of data. Processing a child's answers to provide the tutoring the parent consented to is the service itself, not "monitoring".

- **For:**
  - "Profiling" was dropped from the 2019 text [V].
  - s.9(2) is where well-being harm is policed.
  - COPPA's "support for internal operations" includes *"personalize the content on the website or online service"*, but bars use *"to amass a profile on a specific individual"* [V: 16 CFR 312.2].
  - The ICO says there is *"no point in offering a privacy setting if the profiling is essential to the provision of the core service that the child has requested"*, read narrowly as "completely intrinsic" [V: ICO std 12, as fetched].
- **Against:**
  - The surplusage argument.
  - The Act's "behavioural" wording catches persistent behaviour models however benign their purpose.
  - Regulators read child-protection provisions protectively.

**I3: graduated (my working synthesis)** [U]. Risk rises with three things:

- (i) **Persistence:** in-session only → across sessions.
- (ii) **Object:** performance on curriculum content → the child's *behaviour, dispositions or affect*.
- (iii) **Purpose:** teaching this child now → prediction or optimisation (engagement, retention, commercial).

Within-session responsiveness to an answer is not monitoring under any reading. An academic record of demonstrated content mastery is contested but defensible, by analogy to a gradebook or notebook. Persistent models of timing, engagement, affect, "vibe" or relationship are the core of what "behavioural monitoring" means. Cross-app or SDK tracking is "tracking" outright.

### 5.2 Taxila's layers (ARCHITECTURE.md §1.3 and Director §1.2) mapped to risk

| layer / signal | what it observes | I1 | I2 | I3 | narrow-mode treatment |
|---|---|---|---|---|---|
| Per-turn evidence classification, hint ladder, next move | the answer just given | low* | none | none | **Allowed** (session-scoped) |
| Knowledge (BKT per skill), stored | demonstrated mastery of curriculum items | **high** | low | medium | **M1: allowed as an academic record** with the constraints in §6 |
| Misconception flags, stored | content errors tied to item IDs | high | low | medium | M1: allowed, with content IDs only |
| Need (class, board, school position, exams) | parent-declared facts | low | none | none | Allowed; parent-entered |
| Format efficacy (Thompson sampling per format × topic) | which teaching formats work for this child | high | medium | **high** | **Off** in M1; on in M2, or M3 after an opinion |
| Vibe (pace, verbosity, humour uptake, language mix) | dispositions and behaviour style | high | high | **high** | **Session-only** in M1; parent-set preferences may persist |
| Affect-from-dialogue counters ("pata nahi" loops, minimal answers) | inferred frustration or disengagement | high | high | **high** | Session-only and never stored. A move can react within the session; no score survives it. |
| Relationship (trust rate, rupture record) | the child's relational behaviour towards the AI | high | high | **high** | **Not persisted** in M1. Replace with cited content memories (below). |
| Memory (cited episodic facts the child shares) | volunteered personal facts | medium | low | medium | Behind its own consent; parent-visible and deletable; capped; no sensitive categories |
| Interests (tags) | stated interests | medium | low | low–med | Parent-entered or child-stated and parent-confirmed; editable |
| Timing, latency, prosody, barge-in features | behaviour | high | medium | **high** | Never stored. Used only for live turn-taking. |
| Product analytics with child IDs | usage behaviour | high | high | high | Aggregate or first-party only; no child-level behavioural events kept beyond operational and security logs |
| Third-party analytics, attribution or ads SDKs, ad IDs | cross-context tracking | **banned** | **banned** | **banned** | Never on any child surface |
| Parent report: "distracted 40% of the time" | behaviour | high | medium | high | Never. Report learning outcomes, not conduct. |

\* Even under I1, banning a tutor from reacting to the answer it was just given would be absurd, so this row is low risk under every reading.

---

## 6. The narrow-mode design (safest, recommended as the consumer default)

### 6.1 Modes

- **M0 Stateless.** No persisted child-derived inference. Curriculum position is parent-set; within-session adaptation only. This is the fallback if counsel adopts I1. It must be *buildable at any time*, so M1 data must be deletable in one operation.
- **M1 Academic Record. Consumer default at launch.**
- **M2 School Mode.** The full learner model, under a school's Data Fiduciary exemption with a DPA.
- **M3 Full consumer model.** Only after a written opinion supports I2 or I3 for those layers, or after a s.9(5) notification.

### 6.2 Binding rules for M1 (NM = narrow mode)

- **NM-1: There is one legal-mode flag, and it is enforced in code.** `child.legal_mode ∈ {M0, M1, M2, M3}`.
  - The learner-model writer checks the flag on every write.
  - A layer not permitted for that mode has **no write path**. It is not merely hidden.
  - The flag is set once from (consent scope × mode), it can only be ratcheted down, and every change goes to `audit`.
  - Precedent: the frozen `MINOR_HARD_GATES` in `companion-tech.md` §7.3.
- **NM-2: Persisted learner state is about the curriculum, not about the child's behaviour.** Allowed fields:
  - `skill_id`, mastery state (`unseen…mastered/due`), `last_assessed_at`, `next_review_at`
  - `misconception_id` with an evidence count and a resolved flag
  - item outcomes (`item_id`, correct or incorrect, hint depth used, "with help" or "independent")

  Everything is derived deterministically from a verified answer key ("a model never grades").
- **NM-3: The following are never persisted** in any table, log or prompt cache that outlives the session: response latency, pauses, hesitation, prosody, barge-ins and time-of-day patterns; engagement or drop-off predictions; affect counters or inferred emotions; "vibe" estimates and relationship or trust scores; format-preference posteriors; free-text "about the child" notes. A unit test asserts that the schema has no such columns, and that the end-of-session consolidation writes none.
- **NM-4: Adaptation within a session is unrestricted, then discarded.** The Director may use any live signal to choose the next move. Session-scoped state is held in memory or in a row with a TTL, and it is hard-deleted when the lesson closes.
  - Only the fields allowed by NM-2 survive.
  - The lesson summary handed to the next session is generated *from the NM-2 fields*, never from the transcript's behavioural content.
- **NM-5: No tracking.** On every child surface (web and the Android WebView) there are no third-party analytics, attribution or ad SDKs, and no crash SDKs that collect device IDs; no AAID or IDFA and no fingerprinting; no cross-site cookies (first-party session cookie only); and no location collection beyond what the security logs need. A CI check fails the build if the bundle or the Android manifest pulls in a known tracking SDK [U: build this list].
- **NM-6: No advertising of any kind to children.** This includes contextual ads and cross-promotion inside the child experience. Marketing goes to the parent's own channel, with the parent's own consent.
- **NM-7: Memory and interests sit behind their own unbundled consent purposes.** "Remember things your child tells the teacher" is a separate, unticked choice, and every memory carries a citation.
  - Memories cover what was learned together and stated interests.
  - The following are never stored or inferred: religion, caste, health, family circumstances or location.
  - The parent can view, edit and delete each item.
- **NM-8: No optimisation for engagement.** No objective, bandit or experiment in consumer mode may use engagement or retention as its reward.
  - Nothing proactive is keyed to the child's behaviour or absence: no streak loss, no "you haven't studied", no pushes.
  - This also enforces s.9(2) (§7.2).
- **NM-9: Parent reports describe learning, never conduct.** They cover skills mastered and due for review, misconceptions worked on, and the minutes of tutoring delivered (an operational fact). They never include attention, mood, effort or personality, and never rank the child against other children.
- **NM-10: Purpose-scoped consents, itemised per Rule 3(b):** P1 tutoring service (required); P2 academic record across sessions (M1); P3 remembering personal details (optional); P4 anonymised research and product improvement (optional; §7.10); P5 format-efficacy personalisation (shown as unavailable until M3). Each purpose names its data items, uses and retention. Withdrawing P2 erases the NM-2 state, which makes the child M0.
- **NM-11: The safety scan is purpose-bound.** Each turn's transcript is scanned for safeguarding triggers, and a reply is shaped live.
  - A row is written only when a trigger fires (`incident`). It holds the minimum excerpt and the action taken.
  - There is no persistent per-child "risk score" and no trend modelling.
  - The parent is notified per the safeguarding protocol.
  - This keeps it within Part B item 5 and the "a reply is not monitoring" argument (§4.3).
- **NM-12: Audio is ephemeral by default.** It is streamed to ASR and the realtime model, and never written to Taxila storage. Processor terms require zero retention and no training [U: check the Azure terms].
  - If counsel reads Rule 8(3) as requiring audio retention, add an India-region (or nearest-region) encrypted legal-hold vault with **no product read path**, access only on a Seventh Schedule request, and automatic erasure at 1 year.
  - A schema is ready for this; it stays empty unless the opinion requires it.
- **NM-13: No processing of a child's data before VPC.** Before VPC, only the Part B item 6 flow runs: the declared age, a parent contact, and the verification exchange. There is no child voice demo. Parents may try a lesson themselves.

**What M1 costs the product** [U]:

- Format-efficacy personalisation is lost. `learning-science.md` §8.7 already predicts this layer may fail its kill criterion.
- So is cross-session "vibe" continuity. The teacher re-learns pace within each session from live cues, which a human tutor does too.
- The relational feel comes from cited content memories ("last week you cracked equivalent fractions with the pizza"), parent-approved interests, and a consistent persona. It does not come from a stored model of the child's personality.

---

## 7. The other obligations, briefly

### 7.1 Notice and consent mechanics [V]

- **s.5(1) and Rule 3: the notice must stand alone.** It must give *"an itemised description of such personal data"*, the specified purposes, and a *"specific description of the goods or services"*. It must also link to:
  - withdrawal (as easy as giving consent),
  - the rights, and
  - complaints to the Board.
- **s.6(1): consent must be "free, specific, informed, unconditional and unambiguous with a clear affirmative action"**, and limited to the data necessary for the purpose.
  - The telemedicine illustration shows that unnecessary bundled items are void.
  - So P3–P5 cannot be conditions of P1.
- **Rule 9: publish a contact.** This is the DPO's contact if Taxila is an SDF, otherwise a person who can answer questions about processing, and it goes in every rights response.

### 7.2 Detrimental effect (s.9(2)) [V text; U application]

It cannot be exempted and is not defined. Engineering reading — treat each of these as *likely* detrimental:

- addictive or loss-framed mechanics
- manipulative interface patterns
- ability labels and comparison with other children
- persona exclusivity or dependency hooks
- unsuitable content
- data uses that could surface later to the child's disadvantage, such as a "struggles with attention" note reaching a school

This ties to the existing gates (gurukul §4.6–4.7; learning-science rules 31–33). Also log a periodic well-being review as evidence of diligence.

### 7.3 Personal data breach [V]

The definition is broad: *"any unauthorised processing … or accidental disclosure, acquisition, sharing, use, alteration, destruction or loss of access"* (s.2(u)). Rule 7 sets the duties.

- **To each affected Data Principal (the parent).** Notify *"without delay"* through the account or a registered channel, covering nature, extent and timing, likely consequences, mitigation, steps they can take, and a contact.
- **To the Board.** First *"without delay"* a description. Then **within 72 hours** a detailed report covering facts, causes and mitigation, findings about the person who caused the breach, remediation, and a report on the intimations made to data principals.
- **To CERT-In.** Within **6 hours** for listed incidents (in force today).
- **Penalty exposure.** Notification failures: up to ₹200 crore. Security safeguards: up to ₹250 crore.
- **Runbook artifact.** One incident timeline drives all three clocks. Templates are pre-written in English and Hindi.

### 7.4 Security safeguards (Rule 6, the minimum) [V]

The minimum is: encryption, obfuscation, masking or virtual tokens; access control; logs with monitoring and review; backups and continuity; **logs and personal data retained for 1 year** for detecting and investigating unauthorised access (r.6(1)(e)); security clauses in processor contracts; and organisational measures. Map these to: Neon encryption and role separation; an audit table; at-rest encryption of transcripts; and key separation between the child-identity tables and the learning tables.

### 7.5 Retention and erasure [V text; U application]

- **s.8(7):** erase on withdrawal, or when *"it is reasonable to assume that the specified purpose is no longer being served"*, whichever is earlier, and cause processors to erase.
- **s.12(3):** erase on request, unless needed for the specified purpose or by law.
- **Rule 8(1)–(2) and the Third Schedule:** fixed inactivity periods (3 years) apply only to e-commerce (≥2 crore users), online gaming intermediaries (≥50 lakh) and social media (≥2 crore).
  - Taxila is outside them, unless its in-app games make it an "online gaming intermediary" (Q11).
  - Self-impose a policy anyway: after 12 months of inactivity, a 48-hour-notice email to the parent, then erasure.
- **Rule 8(3):** *"a Data Fiduciary shall retain … such personal data, associated traffic data and other logs of the processing for a minimum period of one year from the date of such processing, for the purposes as specified in the Seventh Schedule, after which the Data Fiduciary shall cause such personal data and logs to be erased"*.
  - The Seventh Schedule purposes are State access: sovereignty and security, functions under law, and SDF assessment.
  - Illustration, Case 1: the platform *"must retain … personal data, and logs … for at least one year … even if X deletes her account."*
  - **Two readings** (Q3):
    - (a) It covers *all* personal data processed, which would include transcripts and any audio.
    - (b) It covers the records needed to evidence the processing (who processed what and when): logs, plus the personal data needed to make sense of them.
  - **Design** [U]:
    - Account deletion splits into a *product erase* (immediate, with no read path anywhere in the product) and a *legal-hold remainder* (encrypted, access-logged, erased at one year from processing).
    - Disclose this split in the notice.
    - Audio stays unstored unless the opinion says (a) and covers audio that is never written down (§6, NM-12).

### 7.6 Rights [V]

- **Access (s.11):** a summary of the data and processing, and the identities of other fiduciaries and processors with whom data was shared. Keep a live processor list.
- **Correction and erasure (s.12).**
- **Grievance (s.13):** respond within a published period of at most **90 days** (Rule 14(3)). The data principal must use this route before going to the Board.
- **Nomination (s.14).**
- **Who acts:** for a child, the parent exercises all of these.
- **Recommended** [U]: honour a deletion request made by the child too. It is more protective, and nothing forbids it.

### 7.7 Cross-border transfer [V text; S status]

- **s.16(1): a negative list.** The government may restrict transfers to notified countries, and none are notified [S, Sep 2026].
- **s.16(2):** sectoral laws that are stricter still prevail.
- **Rule 15:** transfers are subject to requirements the government may set *"in respect of making such personal data available to any foreign State"*. None are specified [S].
- **Rule 13(4):** SDFs must keep government-specified data categories in India.
- **CERT-In:** logs must be maintained in India for 180 days [V].
- **Current architecture** (Neon Singapore, Azure eastus2, Vercel sin1) is lawful today [S]. Keep it migration-ready: a data map that tags every table and processor by region; children's tables that can move to an India region (`decisions.md#infra-segment` already names Mumbai as the reversal trigger); processor contracts that allow region pinning. **Ship CERT-In logs to an India-located sink now.**

### 7.8 Significant Data Fiduciary risk [V text; S status]

- **s.10(1) factors:** *"volume and sensitivity of personal data processed"* and *"risk to rights of Data Principal"*, among others. A national AI tutor holding years of learning records on millions of minors scores high on both.
- **SDF duties:** a DPO **based in India** and answerable to the board; an independent data auditor; an annual DPIA and audit, with significant findings reported to the Board (Rule 13(1)–(2)); **algorithmic due diligence** that *"technical measures including algorithmic software … are not likely to pose a risk to the rights of Data Principals"* (Rule 13(3)); and localisation of specified data (Rule 13(4)).
- **Penalty:** up to ₹150 crore.
- **Recommendation:** run a voluntary DPIA plus an algorithmic risk register for the learner model and Director before the public launch. It is cheap, it is evidence for s.33(2)(e) mitigation, and it is the SDF artefact if Taxila is notified.

### 7.9 Penalties and enforcement [V]

| breach | maximum |
|---|---|
| Security safeguards, s.8(5) | ₹250 crore |
| Breach intimation, s.8(6) | ₹200 crore |
| **Children's obligations, s.9** | **₹200 crore** |
| SDF duties, s.10 | ₹150 crore |
| Data principal duties, s.15 | ₹10,000 |
| Voluntary undertaking breach | the cap of the underlying breach |
| Anything else | ₹50 crore |

How the regime works:

- A penalty needs a "significant" breach (s.33(1)), weighed on gravity, duration, data type, repetition, gain, mitigation, proportionality and impact (s.33(2)). No aggregate cap is stated [V: none in the text]. Under s.42 the Schedule can be raised to at most **twice** the original amounts.
- **s.37:** after penalties in **two or more instances**, the government may order the service blocked. **s.32:** a voluntary undertaking bars further proceedings on what it covers, which makes it the practical settlement route. **s.39:** no civil-court jurisdiction.
- **s.17(3):** a startup exemption can lift s.5, s.8(3), s.8(7), s.10 and s.11, **never s.9**.

### 7.10 The research exemption, for efficacy studies

s.17(2)(b) and Rule 16 disapply the *whole Act* for processing *"necessary for research, archiving or statistical purposes if the personal data is not to be used to take any decision specific to a Data Principal"*, under the Second Schedule standards [V]: lawful, limited to the purpose, accurate, retained only as long as needed, secure and accountable. Applying this [U]:

- Pre-registered efficacy analyses on de-identified academic records (E-PROFILE, learning-science §8.7) may fit.
- Anything that feeds back into a specific child's teaching does not.
- Keep research extracts in a separate store, de-identified at export, never joined back.

---

## 8. Questions for counsel (precise, in priority order)

- **Q1 (s.9(3)).** When done by a D2C service with verified parental consent, is each of these "tracking or behavioural monitoring" of a child: (a) adaptation within a session from the child's answers; (b) a persisted, parent-visible academic record of demonstrated mastery and content misconceptions (NM-2); (c) persisted format-efficacy, engagement, affect, "vibe" or relationship models; (d) first-party aggregate product analytics? Please address the surplusage argument (Part A item 3) and the deletion of "profiling" from the 2019 text.
- **Q2 (Fourth Schedule A3).** Can a D2C online tutoring company that enrols learners into curriculum-aligned courses be an "educational institution"? If not, does Taxila, as a Data Processor for a recognised school (§4.2), inherit the school's exemption for processing "for the educational activities of such institution"? What contractual terms preserve that?
- **Q3 (Rule 8(3)).** Does "such personal data … for a minimum period of one year" require keeping (i) transcripts, (ii) audio that is streamed and never stored, and (iii) data the parent has asked to erase under s.12(3)? How does it interact with s.8(7) and s.9(2) for children? Can the retained set be limited to logs?
- **Q4 (Rule 10).** Which concrete mechanisms meet "due diligence" for a new parent (Case 4): a DigiLocker document or attribute share; an IDV vendor checking a government ID; card or UPI payment plus a declaration? Is it enough to store only the verification result and a token reference?
- **Q5 (Aadhaar).** May a private edtech use an Aadhaar-based age attribute (offline verification or a DigiLocker share) for VPC without becoming an authentication user agency? What must it never store?
- **Q6 (relationship).** Is a declared parent relationship enough, given that Rule 10 checks only adulthood? What attestation and liability language should Taxila use?
- **Q7 (safety scan).** Is the per-turn safeguarding scan of a child's transcript (NM-11) covered by Part B item 5? Is it "monitoring" at all? If neither, what is the lawful route for a D2C service? Does POCSO's reporting duty (ss.19–21) apply to Taxila staff who learn of abuse from a transcript? [U: POCSO not reviewed here]
- **Q8 (s.9(2)).** Which design features does counsel consider "likely to cause detrimental effect"? Is the gurukul §4.7 list complete?
- **Q9 (s.9(5)).** Is there a path, and a likely age threshold, for a "verifiably safe" notification? What evidence would MeitY expect?
- **Q10 (SDF).** Given the January 2026 proposal's mention of AI systems, what is the probability and timing of SDF designation for a children's AI tutor? Should Taxila appoint an India-based DPO pre-emptively?
- **Q11 (Third Schedule).** Could in-app educational games make Taxila an "online gaming intermediary" (and if so, would the ≥50 lakh threshold matter), either under Rule 8 or under the Online Gaming Act 2025? [U]
- **Q12 (transition).** For children enrolled before 13 May 2027, does s.5(2) let processing continue on the pre-commencement consent? Or must Rule 10 VPC be obtained afresh?
- **Q13 (age 18).** What happens to the parent's consent when the learner turns 18? Must the account be re-consented, and may the history be kept?
- **Q14 (processor terms).** Do the AI vendors' terms on under-18 users permit this service? Do the terms for zero retention and no training satisfy s.8(2) "valid contract" and s.8(7)(b)? [U: companion-tech.md flags that provider terms for minors were never researched]
- **Q15 (pre-May-2027 launch).** Under s.43A and the SPDI Rules, what is needed if Taxila launches in 2026? Is a tutoring voice stream "biometric information"?

---

## 9. Engineering actions now (no opinion needed)

1. Implement the `legal_mode` ratchet and per-layer write gates (NM-1). Default every consumer child to **M1**.
2. Reshape the learner-model schema to the NM-2 allowlist. Make vibe, affect, relationship and format layers session-scoped in consumer mode. Write the NM-3 schema test.
3. Build the consent ledger and the `vpc_verification` table. Write itemised notices for P1–P5 in English and Hindi. Make withdrawal as easy as consent.
4. Add a VPC adapter interface with two implementations (DigiLocker; a government-ID IDV vendor) behind one result type. Pick vendors after the Q4 and Q5 answers.
5. Add a CI tracker-SDK denylist for the web bundle and the Android build (NM-5).
6. Write the breach runbook with 6-hour, without-delay and 72-hour clocks. Pre-write parent templates in English and Hindi.
7. Ship CERT-In logs to an India sink. Keep a 1-year security log (Rule 6). Keep a region-tagged data map and processor list (s.11(1)(b)).
8. Split erasure into a product erase and a legal hold. Keep the audio legal-hold vault empty but designed (NM-12).
9. Run a voluntary DPIA and algorithmic risk register for the Director and learner model.
10. Write a School Mode DPA template and partition the data (M2).

## 10. Corrections to earlier Taxila docs, and re-checks

- **`tech-and-market.md` §7.4:** "proof that the consenter is … the parent or guardian" is wrong. Rule 10 verifies that the person is an **identifiable adult**; parenthood is declared [V].
- **`gurukul.md` §4.1 and `companion-tech.md` §7.4:** they say "full effect 2027-05-14". The computation is ambiguous (13 vs 14 May); plan against 13 May 2027 [V/S].
- **`learning-science.md` §4.3:** the ₹200 crore figure for s.9 is now **[V]**. Rule 12 and the Fourth Schedule wording are confirmed verbatim [V].
- **ARCHITECTURE.md §1.3:** "Vibe", "affect-from-dialogue counters" and "Relationship (trust …)" are high-risk layers under I1 and I3. They are session-only in consumer mode until Q1 is answered.
- **ARCHITECTURE.md §1.7:** "Audio is never stored" depends on Q3.
- **Re-check before relying on this memo** (status items that move): whether the timeline compression or any rule amendment was notified; Board appointments; any SDF notification; any s.16 negative list; a DigiLocker age-token API; any MeitY or Board FAQ on children or edtech. Next check: 2026-12-01.

## 11. Sources

Primary, read this session [V]:

- DPDP Act 2023 (Act 22 of 2023), Gazette of India Extraordinary Part II s.1, No. 25, 11 Aug 2023: https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf
- DPDP Rules 2025, G.S.R. 846(E), Gazette No. 760, 13 Nov 2025 (bilingual): https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf (English-only reprint: https://www.dpdpa.com/DPDP_Rules_2025_English_only.pdf)
- PDP Bill 2019, Bill No. 373 of 2019 as introduced: https://prsindia.org/files/bills_acts/bills_parliament/2019/Personal%20Data%20Protection%20Bill,%202019.pdf
- CERT-In Directions under s.70B(6), 28 Apr 2022: https://www.cert-in.org.in/PDF/CERT-In_Directions_70B_28.04.2022.pdf
- EDPB Guidelines 3/2018 on territorial scope (v2.1), §"monitoring of behaviour": https://www.edpb.europa.eu/sites/default/files/files/file1/edpb_guidelines_3_2018_territorial_scope_after_public_consultation_en_1.pdf
- GDPR Recital 24: https://gdpr-info.eu/recitals/no-24/ · Recital 38: https://www.privacy-regulation.eu/en/recital-38-GDPR.htm
- 16 CFR 312.2 (COPPA definitions): https://www.law.cornell.edu/cfr/text/16/312.2
- ICO Children's Code, standard 12 (profiling): https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/12-profiling/

Secondary [S]:

- Act commencement notification G.S.R. 843(E) and its phases: https://dpdprules.org/act · https://cadp.in/news/dpdp-act-commencement-and-data-protection-board-notified/
- Shardul Amarchand Mangaldas, on Rule 8(3) being new versus the draft, and the "authorised entity" change: https://www.amsshardul.com/insight/enforcement-of-the-dpdp-act-and-notification-of-the-dpdp-rules/
- S&R Associates: https://www.snrlaw.in/indias-digital-personal-data-protection-regime-takes-effect/
- MeitY compression proposal (Mondaq / S.S. Rana, 15 Apr 2026): https://www.mondaq.com/india/data-protection/1773554/
- 2026 status trackers (Board, SDF, s.16): https://www.mondaq.com/india/data-protection/1830402/ (14 Aug 2026) · https://cyberaube.com/blog/dpdp-consent-manager-deadline-november-2026-data-fiduciary-playbook (19 Aug 2026) · https://dpdpa.dcomply.in/faq/ (verified 8 Sep 2026; it misstates Rule 10 as verifying the parent–child link)
- MeitY Business Requirements Document for consent management (6 Jun 2025), as described: https://www.inhouseapac.com/insights/india-dpdpa-phased-rollout-consent-2026

Not verified [U]: a production DigiLocker age-token API for private fiduciaries; the SPDI Rules 2011 text; Aadhaar private-use limits; POCSO ss.19–21; vendor terms on minors; the Online Gaming Act 2025 definitions.
