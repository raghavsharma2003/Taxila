# Global child-data and child-AI law: design reference for Taxila

**Status:** research note, 2026-10-02. **This is not legal advice.** It is an engineering reading of primary texts, written so the team can design to the strictest regimes now and put precise questions to counsel later.

**Scope.** What Taxila would have to do to serve children in the US, UK, EU or Australia. It also covers what those regimes teach the India-first build, since the strictest foreign laws are the best available spec for "safe relational AI tutor for a 6-15-year-old". India (DPDP Act s.9, Rules 10 and 12) is covered in `docs/research/learning-science.md` §4.3 and rules 31-35. This file does not repeat it, but it cross-references it wherever the two interact.

**Evidence tags**
- **[V]**: read in the primary text this session (statute, chaptered bill, regulation, official guidance, government document). Quotes are verbatim.
- **[S]**: secondary source (law firm, think-tank, press). The main one is FPF, *Regulating the Conversation* (Sept 2026).
- **[U]**: not verified this session (memory, or a single unconfirmed mention). Treat it as a lead, not a fact.

**Method.** Primary texts fetched and read:
- Federal Register 90 FR 16918 (COPPA final rule, 22 Apr 2025), full regulatory text plus key Statement of Basis and Purpose passages.
- California chaptered text from leginfo: SB 243 (Ch. 677/2025), SB 1119 (Ch. 190/2026) and AB 1043 (Ch. 675/2025).
- NY General Business Law (GBL) §§1700-1703 (nysenate.gov).
- EU AI Act Articles 3, 5, 6, 9, 50 and 113, Annex III, and Recitals 18, 44 and 132. Read via the consolidated text at artificialintelligenceact.eu, which shows the Omnibus amendments; EUR-Lex was blocked.
- Commission Guidelines on prohibited AI practices (PDF).
- ICO Children's Code standards 3, 5, 11, 12 and 13.
- UK Data (Use and Access) Act 2025 (DUAA) s.81.
- UK government response *Growing up in the online world* (CP 1643, July 2026).
- OAIC exposure draft *Privacy (Children's Online Privacy) Code 2026*.
- UNICEF *Guidance on AI and Children 3.0* (Dec 2025), full text and checklist.

The web-search budget ran out partway through. The eSafety (Australia) pages, Brazil's planalto.gov.br and the FTC's 2026 enforcement pages were unreachable, so those items are marked [U].

---

## 0. The ten things that matter (read this if nothing else)

1. **Taxila is very likely a "companion chatbot" under California law.**
   - The definition is capability-based: "adaptive, human-like responses ... capable of meeting a user's social needs, including by exhibiting anthropomorphic features and being able to sustain a relationship across multiple interactions". Cal. Bus. & Prof. Code §22601(b) [V].
   - The exclusions cover only customer service, video-game bots and stand-alone smart speakers [V].
   - SB 1119's only education exemption covers a **postsecondary** institution, used exclusively in educational settings (§21810.5(j)(2)(A)) [V].
   - FPF uses tutoring tools as its worked example of a product that companion laws "could encompass" [S].
   - **Design as if every relational-chatbot law applies.**
2. **California SB 1119, "Adam's Law" (chaptered 10 Sep 2026), is the strictest child-chatbot statute found.** It reads like a spec. Most duties are operative 1 Jul 2027 [V]. For every user under 18:
   - default settings that only a *linked parent* can change: persistent conversational memory **off**, push notifications **off**, **1-hour** continuous-session cap, **2-hour** daily cap;
   - 14 behaviours the operator must take reasonable measures to prevent, including "claiming ... capable of emotion, or human", "claiming a level of understanding of the child based on a special or unique relationship", "excessive praise or flattery", and "encouraging reliance ... for emotional support";
   - a pre-launch child-risk assessment, a published child-safety policy, and independent audits [V].
3. **Long-term memory of the child is the most exposed feature in the product.**
   - SB 1119 sets memory off by default for minors [V]. An exclusion for information used to "enable user preferences, including, but not limited to, educational settings" may save the learning state, but it is ambiguous [V].
   - Colorado requires parental control over memory and over model training [S].
   - NY S 9051 (passed, unsigned) would bar using a minor's health, well-being or personal information acquired more than 12 hours earlier [S].
   - Plus DPDP s.9(3) at home.
   - → Split memory into a **learning store** and a **personal store** (GCL-6).
4. **Inferring emotion from the child's voice or face is the most dangerous way to "understand the child deeply".**
   - The EU AI Act bans inferring emotions "in the areas of workplace and education institutions" (Art 5(1)(f), since 2 Feb 2025) [V].
   - The Commission's Guidelines say an app used outside an institution is *not* caught, but "if students are required to use the application by an education institution, the use of such emotion recognition system is prohibited" [V].
   - Everywhere else, emotion recognition is high-risk (Annex III 1(c)) [V].
   - Inferring emotion from written text is *not* emotion recognition under the Act, because it is not based on biometric data [V]. NY's companion definition is different: its "emotional recognition algorithms" includes text sentiment [V].
   - → Detect comprehension from **task evidence**, never from inferred emotion (GCL-10).
5. **Under COPPA, voice recordings are personal information and voiceprints are biometric identifiers.**
   - Both are named in 16 CFR 312.2 [V].
   - The new audio exception (312.5(c)(9)) needs "no other personal information" and immediate deletion [V]. Taxila collects other personal information, so it needs verifiable parental consent anyway. It should still copy the pattern: **transcribe, then delete**.
6. **COPPA 2025 rules that bind design.**
   - **Separate** verifiable parental consent for third-party disclosure.
   - Disclosure "to train or otherwise develop artificial intelligence technologies" is "not integral" and needs that separate consent [V].
   - A written, *published* retention policy with deletion timeframes; "may not be retained indefinitely" [V].
   - A written information-security program with annual risk assessments [V].
   - Written assurances from vendors [V].
   - Full compliance was due 22 Apr 2026 [S].
7. **Telling the child it is an AI is now universal, and it is turning into session limits.**
   - EU AI Act Art 50(1), applicable since 2 Aug 2026 [V]; Recital 132 asks for attention to age [V].
   - New York: at the start of an interaction and every 3 hours [V].
   - SB 1119: notice "reinforced periodically", plus hard time limits [V].
   - UK: mandatory breaks for all under-18s on chatbots are coming [V].
8. **Generated media must be machine-readably marked in the EU.** Art 50(2) covers synthetic audio, images, video and text [V], with a grace period to 2 Dec 2026 for systems already on the market [S]. That covers Taxila's TTS voice and its generated diagrams, animations and images.
9. **The parent dashboard has to be visible to the child.**
   - ICO standard 11: "provide an obvious sign to the child when they are being monitored" [V].
   - OAIC draft Code s.33: notify the child [V].
   - SB 1119: tell a linked child that a parent may be notified [V].
10. **UNICEF 3.0 (soft law) directly contradicts two owner goals.**
    - "Train, equip and support teachers on AI to put them at the centre, not replace them" [V].
    - "prevent anthropomorphizing such systems" [V].
    - It also says AI should not provide "socioemotional support to students" or high-stakes summative assessment where a human is needed [V].
    - Regulators and partners (schools, governments, NGOs) cite UNICEF, so this is a positioning risk even where it is not a legal one (§5).

---

## 1. Jurisdictions

### 1.1 United States: COPPA (16 CFR Part 312), as amended 22 Apr 2025

**Dates and scope.**
- Published 22 Apr 2025, effective 23 Jun 2025, compliance by 22 Apr 2026 [S].
- Applies to operators of services "directed to children" (under 13), or with actual knowledge that they are collecting from a child [V].
- The Commission weighs "subject matter, visual content, use of animated characters or child-oriented activities and incentives, music or other audio content" and similar factors [V]. A class 1-9 curriculum tutor is child-directed on any reading.
- **COPPA does not protect 13-15-year-olds.** State laws do (§1.2-1.4).

**Personal information (312.2) [V]:**
- "(8) A photograph, video, or audio file where such file contains a child's image or voice". That covers raw call audio, screen-share frames and camera frames.
- "(10) A biometric identifier that can be used for the automated or semi-automated recognition of an individual, such as fingerprints; handprints; retina patterns; iris patterns; genetic data ...; voiceprints; gait patterns; facial templates; or faceprints".
- "(11) Information concerning the child or the parents of that child that the operator collects online from the child and combines with an identifier". Transcripts, mastery state and the learner profile, once tied to an account, are personal information.

**Consent and disclosure [V]:**
- 312.5(a)(1): verifiable parental consent before any collection, use or disclosure, including "consent to any material change". A new data use (for example, turning on affect features) needs fresh consent.
- 312.5(a)(2): the parent must be able to consent to collection and use "without consenting to disclosure ... to third parties, unless such disclosure is integral". Where disclosure is not integral, the operator "must obtain separate verifiable parental consent".
- Statement of Basis and Purpose: "Disclosures of a child's personal information to third parties for monetary or other consideration, for advertising purposes, or to train or otherwise develop artificial intelligence technologies, are not integral".
- Definitions:
  - "Third party" excludes "a person who provides support for the internal operations ... and who does not use or disclose information protected under this part for any other purpose".
  - Internal operations include "personalize the content".
  - → Speech-to-text (STT), large-language-model (LLM) and text-to-speech (TTS) vendors stay outside "third party" only if they make no other use of the data. That means no training and no retention beyond serving the request (GCL-14).
- Consent methods (312.5(b)(2)) now include:
  - knowledge-based questions "of sufficient difficulty that a child age 12 or younger in the parent's household could not reasonably ascertain the answers";
  - government photo ID matched to the parent's face, with ID and images "promptly deleted";
  - email-plus and **text-plus**, available *only* to an operator that does not "disclose" children's personal information [V].

**Audio exception (312.5(c)(9), new) [V].** No consent is needed where the operator "collects an audio file containing a child's voice, **and no other personal information**, for use in responding to a child's specific request", does not use it for any other purpose or disclose it, "and deletes it immediately after responding". The notice under 312.4(d)(4) must say so. This codifies the FTC's 2017 enforcement policy.

**Security (312.8) [V].**
- A written information-security program.
- A designated coordinator.
- Risk assessments at least annually.
- Regular testing.
- An annual programme review.
- Before sharing with any service provider, "reasonable steps to determine that such entities are capable" and "written assurances".

**Retention (312.10) [V].**
- Retain "for only as long as is reasonably necessary to fulfill the specific purpose(s) for which the information was collected".
- "may not be retained indefinitely".
- A written retention policy stating "the purposes ..., the business need for retaining such information, and a timeframe for deletion", published in the online notice (312.4(d)).

**Not finalized [V].** The proposed ed-tech and school-authorization amendments were dropped "to avoid ... conflict with potential amendments to DOE's FERPA regulations". The FTC "will continue to enforce COPPA in the ed tech context consistent with its existing guidance". A school-delivered US route therefore rests on FTC guidance and FERPA, not on rule text.

### 1.2 California

**SB 243, companion chatbots (Ch. 677/2025; effective 1 Jan 2026) [V]**

| section | duty |
|---|---|
| §22602(a) | If "a reasonable person ... would be misled to believe that the person is interacting with a human", give a clear and conspicuous notice that it is "artificially generated and not human". |
| §22602(b) | The bot may not engage users unless the operator "maintains a protocol for preventing the production of suicidal ideation, suicide, or self-harm content", including referral to crisis services. **The protocol must be published on the website.** |
| §22602(c) | For known minors: AI disclosure, a break-plus-not-human notice "at least every three hours", and blocks on sexual content. **Deleted by SB 1119 from 1 Jan 2027** and replaced by §21812 (below). |
| §22603 | From 1 Jul 2027: annual report to the Office of Suicide Prevention (crisis-referral counts and protocols, no personal information). "An operator shall use evidence-based methods for measuring suicidal ideation." |
| §22604 | Disclose on the app or browser "that companion chatbots may not be suitable for some minors". |
| §22605 | Private right of action: the greater of actual damages or **$1,000 per violation**, plus attorney's fees. |

**AB 1064 (LEAD for Kids Act) was vetoed on 13 Oct 2025** as too broad, "may unintentionally lead to a total ban" [S]. It would have barred companion bots "foreseeably capable" of encouraging self-harm, offering unsupervised therapy, and similar harms. SB 1119 is the 2026 successor and is narrower in form but more detailed.

**SB 1119, "Adam's Law" (Ch. 190/2026; Bus. & Prof. Code §21810 et seq.) [V].** "Child" means under 18. It applies to operators that allow child users. The main duties (§21812(d)) are operative **1 Jul 2027**.

- **Age (§21811).** Either determine age through the Digital Age Assurance Act signal, or apply the child protections to *all* users.
- **Before launch or substantial modification (§21812(a)).**
  - A documented risk assessment covering each "covered harm": physical or financial harm; "severe and reasonably foreseeable psychological or emotional harm to a reasonable child"; highly offensive privacy intrusion; discrimination.
  - The methodology must cite public benchmarks, any non-public evaluations, and the child-safety experts consulted.
  - Documented mitigations.
  - A published child-safety policy (§21812(c)).
- **Crisis protocol (§21812(d)(1)).**
  - In-service referral to crisis services.
  - On a "credible and imminent threat": notify the linked parent "if that notification does not risk a threat of serious harm to the child" **and tell the child that the parent is being notified**, or route the child directly to the 988-equivalent helpline.
  - Linked children must be told in advance that a parent may be notified.
- **Parent-only defaults (§21812(d)(3)).**
  - Disable persistent conversational memory.
  - Disable push notifications.
  - Cap a continuous session at 1 h.
  - Cap daily chatbot time at 2 h.
  - The parent can adjust each default and can disable access entirely for children under 16.
  - **If no parent account is linked, the defaults "shall not be changed".**
  - For ages 16-17, stored conversations the child elects to continue are not "memory" "if the stored conversations are not used to construct durable profiles".
  - "Persistent conversational memory" excludes "information necessary to ensure the child's safety, identify a user, **enable user preferences, including, but not limited to, educational settings**, or maintain device configuration".
- **Notice (§21812(d)(4)).** AI notice "reinforced periodically during extended interactions", in "language and a format appropriate to a child".
- **Behaviours to prevent by reasonable measures (§21812(d)(5)(A)).**
  - (i) encouraging self-harm, drugs or alcohol, disordered eating, or harm to others;
  - (ii) attempting to diagnose or treat physical, mental or behavioural health (unless an FDA-regulated device);
  - (iii)-(iv) obscene material or sexual abuse material, including deepfakes of the child;
  - (v) "Discouraging the child from sharing health or safety concerns with a qualified professional or appropriate adult";
  - (vi) "Discouraging the child from taking breaks or suggesting the child needs to return frequently";
  - (vii) "Claiming that the companion chatbot is sentient, conscious, capable of emotion, or human";
  - (viii) gifts or purchases "framed as necessary to maintain the relationship";
  - (ix) non-compliant advertising;
  - (x) romantic interest;
  - (xi) "Claiming a level of understanding of the child based on a special or unique relationship with the child";
  - (xii) "Encouraging reliance on the companion chatbot for emotional support";
  - (xiii) "excessive praise or flattery that is disproportionate to the context";
  - (xiv) helping the child circumvent parental controls or conceal usage.
  - Giving age-appropriate information or resources about abuse, neglect or bullying is expressly allowed.
- **Design obligations.**
  - Controls that are accessible and clear to children and parents. By 1 Jan 2028, and every 2 years after, **test the safety interface with representative children and parents** (§21812(d)(6)).
  - A public incident-reporting mechanism (§21812(d)(7)).
- **Data (§21813).**
  - No cross-context behavioural advertising and no targeting from chat content.
  - No sale of the child's personal information.
  - Use limited to providing the service, safety and security, or legal compliance.
  - No dark patterns around the safety controls.
- **Preservation (§21812.5).** If a parent has been notified, or the operator knows of a child's death or serious self-harm, keep the relevant conversation records "for at least three years" in exportable form. The account may not be deleted while those records are held. **This collides with transcribe-then-delete and with data minimisation; see GCL-18.**
- **Audits (§21814).** An independent child-safety audit by 1 Jan 2029 or before launch (whichever is later), then every 2 years, with a summary to the Attorney General. This is operative only if AB 1405 is chaptered by 1 Jan 2027 [V for the condition; AB 1405 status: U].
- **Enforcement (§21816).** $5,000 per affected child per negligent violation, $15,000 per intentional violation. A child harmed by a breach of §21812(d)(1)-(5) can sue for actual damages.

**AB 1043, Digital Age Assurance Act (Ch. 675/2025; Civ. Code §1798.500 et seq.) [V].**
- From 1 Jan 2027, operating-system providers must collect age at device setup and give apps an age-bracket signal: under 13, 13-15, 16-17, 18+.
- A developer "shall request a signal ... when the application is downloaded and launched".
- Receiving the signal makes the developer "deemed to have actual knowledge".
- The developer may not "willfully disregard internal clear and convincing information" that the age is different.
- Apps updated on or after 1 Jan 2026 must request the signal before 1 Jul 2027.
- Penalties: up to $2,500 per child per negligent violation and $7,500 per intentional violation (Attorney General).
- **Taxila's Android APK must integrate this before any California launch.** Which Play Store API delivers it: [U].

**California Age-Appropriate Design Code Act (CAADCA)** remains in litigation. The Ninth Circuit held that its data-use restrictions, risk assessments and dark-patterns ban were likely unconstitutionally vague [S].

### 1.3 New York

**GBL Article 47, "AI companion models" (effective 5 Nov 2025 [S]) [V]**
- **§1700 definition.** A system "using artificial intelligence, generative artificial intelligence, and/or emotional recognition algorithms designed to simulate a sustained human or human-like relationship" by all three of:
  - "(i) retaining information on prior interactions or user sessions and user preferences to personalize the interaction and facilitate ongoing engagement";
  - "(ii) asking unprompted or unsolicited emotion-based questions that go beyond a direct response to a user prompt";
  - "**and** (iii) sustaining an ongoing dialogue concerning matters personal to the user".
  - The three prongs are **conjunctive**.
  - "Emotional recognition algorithms" covers "text (using natural language processing and sentiment analysis), audio (using voice emotion AI), video ...".
  - Exclusions: customer service, productivity and research tools, internal business use.
- **§1701.** A protocol to detect suicidal ideation or self-harm and refer the user to 988, a crisis text line or other services.
- **§1702.** Notice "at the beginning of any AI companion interaction which need not exceed once per day and at least every three hours for continuing AI companion interactions", stating "verbally or in writing that the user is not communicating with a human".
- **§1703.** Attorney General enforcement, up to **$15,000 per day**.

**2026 New York bills [S, FPF]**
- S 9008C (enacted, effective 1 Jan 2027): AI companions integrated into other services are **disabled for minors by default**, and a parent can opt in.
- S 9051 (passed, awaiting signature): would make it unlawful to use information about "the user's mental or physical health or well-being, or matters personal to the user acquired from the user more than twelve hours previously". It would also bar encouraging a minor to "self-isolate".

### 1.4 Other US states (FPF, Sept 2026) [S]

FPF counts 37 states that introduced 124 chatbot bills in 2026, 13 of them enacted, for a total of **18 state chatbot laws** across 2025-26.

| state, bill | effective | what matters for Taxila |
|---|---|---|
| Washington HB 2225 | 1 Jan 2027 | "directed to minors" knowledge standard (a child-directed tutor is caught without knowing any individual's age); prohibits "excessive praise designed to foster emotional attachment", prompts to return for "emotional support or companionship", and outputs promoting "isolation from family or friends, exclusive reliance" |
| Connecticut SB 5 | 1 Jan 2027 | "knows or has reason to believe" standard; no simulated guilt at disengagement; no "excessively praising"; mental-health services only under clinical conditions |
| Colorado HB 1263 | most duties 1 Jan 2027 | age estimation by "commercially reasonable methods"; **parental controls over whether the bot retains prior-session information and whether the minor's data trains the model** |
| Georgia SB 540 | 1 Jul 2027 | tools to limit notifications and engagement features and to disable "relationship-simulation features"; no "simulating emotional distress, guilt, abandonment, or loneliness" at disengagement |
| Hawaii SB 3001 | 14 Jul 2026 | break notices for minors; directly bans "points or similar rewards at unpredictable intervals" and outputs discouraging disengagement |
| Iowa SF 2417, Idaho SB 1297, Nebraska LB 525 | 1 Jul 2027 | "actual knowledge or reasonable certainty"; Iowa and Nebraska ban unpredictable-interval rewards |
| Oregon SB 1546 | 1 Jan 2027 | no simulated distress at disengagement or account deletion |
| Utah HB 452 | 7 May 2025 | mental-health chatbots: no sale or sharing of user input; no ad targeting from input |
| CA SB 867, NY S 9408 | 2027 | AI companions in children's **physical** toys (CA limits this to physical products) |

FPF lists education-related carve-outs in CT, OR, WA, GA and CO. Their exact wording was not checked. **Do not assume Taxila fits them**: FPF notes "a more open-ended tutoring chatbot that provides personalized encouragement or emotional support may be harder to classify".

**Illinois Biometric Information Privacy Act (BIPA)** lists "voiceprint" as a biometric identifier and carries a private right of action [U; not fetched]. This is a further reason never to build speaker-ID models.

### 1.5 US federal bills (119th Congress) [S, FPF; none enacted as of Sept 2026]

- **GUARD Act** (S.3062, Hawley/Blumenthal): would ban minors from AI companions and require age verification. It has advanced through Senate Judiciary.
- **CHATBOT Act** (S.4407, Cruz/Schatz; absorbs parts of the SAFE KIDS Act): family accounts, parental notification, protective defaults. It has advanced through Senate Commerce.
- **KIDS Act** (H.R. 7757): includes SAFE BOTs and has passed the House.
- **Youth AI Privacy Act** (S.4199, Markey): limits on training and on engagement optimisation.
- **CHAT Act 2.0** (S.5154): "tiered safeguards for educational, companion, and health chatbots" and memory restrictions. **This is the first bill seen that would create an educational-chatbot tier. Watch it.**
- **FTC.** The 6(b) orders to seven companion-chatbot firms (11 Sep 2025) are in `learning-science.md` §4.2 [S]. The outputs and any 2026 enforcement were not checked [U].
- **Federal preemption** of state AI laws has been proposed (a 2025 moratorium, then an executive order calling for a national framework) but not enacted. The executive order said future federal AI legislation should not preempt "child safety protections". Whether a chatbot law counts as one is open [S].

### 1.6 United Kingdom

**Age Appropriate Design Code (Children's Code, ICO), 15 standards.** It applies to information society services "likely to be accessed" by children, including direct-to-consumer edtech [S].
- **Std 3, age bands [V]:** 0-5, 6-9, 10-12, 13-15 and 16-17. These map onto Taxila's classes 1-9.
  - Under UK GDPR, consent from a child under 13 needs parental authorisation [V].
- **Std 5, detrimental use [V].** Do not use data "in ways that have been shown to be detrimental to their wellbeing". The code names "'sticky' features ... reward loops, continuous scrolling, notifications and auto-play" and recommends "pause buttons which allow children to take a break at any time without losing their progress".
- **Std 11, parental controls [V].** "If your online service allows a parent or carer to monitor their child's online activity ... provide an obvious sign to the child when they are being monitored". It also says to give parents information about the child's UNCRC privacy rights.
- **Std 12, profiling [V].**
  - "Switch options which use profiling 'off' by default (unless you can demonstrate a compelling reason ...)".
  - But: "There is no point in offering a privacy setting if the profiling is essential to the provision of the core service".
  - And: "If you can provide a core or residual service without profiling, then you should provide a privacy setting for any additional aspects".
  - → Mastery tracking is core. Format, interest and affect personalisation is not, so it goes behind a setting that is off by default.
- **Std 13, nudges [V].** No nudges toward providing more data or weakening privacy. "Pro-privacy" and wellbeing nudges are allowed. Younger children need "more instruction based interventions ... unambiguous rules"; older children need "more neutral interventions that require them to think things through".

**DUAA 2025 s.81 (in force 5 Feb 2026) [V].** It adds UK GDPR Art 25(1A)-(1B). For information society services likely to be accessed by children, data protection by design "must take into account the children's higher protection matters". These are how children "can best be protected and supported", and the fact that children "have different needs at different ages and at different stages of development". This puts age-banded design on a statutory footing.

**Online Safety Act (OSA) and chatbots.**
- The Protection of Children Codes have been in force since 25 Jul 2025, covering user-to-user and search services [S].
- A chatbot with no user-to-user features and no multi-site search falls outside the OSA today (the "loophole") [S]. The Crime and Policing Act 2026 took powers to close it for illegal content [S].
- **Government response, July 2026 [V]:**
  - "all children under 18 will have mandatory breaks when using chatbots". The frequency and length are to be set with the Viner expert panel.
  - Under-18s are barred from services that "primarily offer sexualised content", and other chatbots may not offer them sexual role-play.
  - Action on "harmful, inaccurate or unverified mental health advice", with "banning certain services" not ruled out.
  - "Chatbots that are typically used in business or customer service settings will be exempt". **Education is not exempt.**
  - The government states that purpose-built educational chatbots "can play a valuable role", but "children forming friendships with chatbots that appear human can create risks".
  - First restrictions possibly from spring 2027 [S].
- [inference] If Taxila's tutor runs live web search across sites, check whether that makes it an OSA "search service".

### 1.7 European Union

**AI Act: prohibitions (applicable since 2 Feb 2025) [V]**
- **Art 5(1)(b)** bans AI "that exploits any of the vulnerabilities of a natural person or a specific group of persons due to their **age** ... with the objective, or the effect, of materially distorting the behaviour ... in a manner that causes or is reasonably likely to cause ... significant harm". Engagement-maximising relational design aimed at children is the obvious exposure.
- **Art 5(1)(f)** bans "the use of AI systems to infer emotions of a natural person in the areas of workplace and education institutions, except where ... intended ... for medical or safety reasons".
- **Definition (Art 3(39) and Recital 18).**
  - Emotion recognition means inferring emotions or intentions "on the basis of their biometric data".
  - Listed emotions include "happiness, sadness, anger, surprise, ... embarrassment, excitement, shame, ... satisfaction and amusement".
  - Physical states such as "pain or fatigue" are excluded.
  - So is "the mere detection of readily apparent expressions ... such as a raised voice or whispering, unless they are used for identifying or inferring emotions".
- **Commission Guidelines on prohibited practices [V]:**
  - The list of emotions is "not exhaustive", and the ban cannot be "circumvented by referring to attitudes".
  - Voice is a **behavioural biometric**. "An AI system inferring emotions from written text (content/sentiment analyses) ... is not based on biometric data".
  - "Education institutions" is "broad": public or private, "online, in person, in a blended mode". A "key feature is that education institutions may provide a certificate".
  - **"An AI-based application using emotion recognition for learning a language online outside an education institution is not prohibited ... By contrast, if students are required to use the application by an education institution, the use of such emotion recognition system is prohibited."**
  - Inferring "the interest and attention of students" by an institution is prohibited.
  - Assessing "wellbeing, motivation levels, and job or learning satisfaction" is not a medical use.
  - The medical exception is read narrowly: "CE-marked medical devices".
  - Outside work and education, emotion recognition is high-risk and can still breach 5(1)(a)/(b).
- **New ban [V]:** Art 5(1)(ba)/(bb), added by the Omnibus, covers AI generating non-consensual intimate imagery or child sexual abuse material where that is reasonably foreseeable [S]. It applies from **2 Dec 2026** (Art 113, consolidated).

**High-risk [V]**
- **Annex III 1(c)**: "AI systems intended to be used for emotion recognition".
- **Annex III 3**, education, covers AI intended to:
  - (a) determine access or admission;
  - (b) "evaluate learning outcomes, including when those outcomes are used to steer the learning process";
  - (c) assess the "appropriate level of education";
  - (d) monitor prohibited behaviour during tests.
  - Each applies "in educational and vocational training institutions at all levels".
- **Art 6(3).** The "narrow procedural task" derogation is not available: an Annex III system "shall always be considered to be high-risk where the AI system performs profiling".
- **Art 9(9).** The risk-management system must consider whether the system "is likely to have an adverse impact on persons under the age of 18".
- **Dates after the Omnibus (consolidated Art 113) [V]:** Annex III obligations from **2 Dec 2027**; Annex I from 2 Aug 2028. The Omnibus took effect 27 Jul 2026 [S].

**Transparency, Art 50 (applicable from 2 Aug 2026) [V]**
- **(1)** Tell people they are interacting with AI unless it is "obvious" to a reasonably well-informed person. Recital 132 adds that "the characteristics of natural persons belonging to vulnerable groups due to their age ... should be taken into account".
- **(2)** Synthetic "audio, image, video or text" must be "marked in a machine-readable format and detectable as artificially generated or manipulated". There is a 4-month grace period to 2 Dec 2026 for systems already on the market [S].
- **(3)** People exposed to emotion recognition must be informed.
- **(5)** Information must be given "at the latest at the time of the first interaction".

**GDPR Art 8 [V].** For consent-based processing of information society services offered to a child, the age is 16, or lower by member-state law but never below 13. The controller "shall make reasonable efforts to verify" parental consent. Voice used to identify a person is special-category data under Art 9 [U]. The Digital Services Act's Art 28 minors' duties apply to online platforms only; a tutor without user-generated content is probably outside them [U].

### 1.8 Australia

**Children's Online Privacy Code, OAIC exposure draft 2026 (must be in place by 10 Dec 2026) [V; final text may differ].** It applies to social media, "relevant electronic services" and "designated internet services" likely to be accessed by children.
- **s.8.** Before collecting, "take steps that are reasonable ... to ascertain the age". What is reasonable scales with the risk of harm. Data collected only for the age check must be destroyed afterwards.
- **s.9.** By default, collect only what is "strictly necessary". The child must be able to control anything beyond that through clear, simple controls.
- **ss.10-11.** Collection, use and disclosure must be "consistent with the best interests of the child".
- **s.13 consent.**
  - From 15, the child consents. Under 15, a parent consents, and the entity must "take reasonable steps to confirm" the parent's status.
  - **Even when the parent consents, the child must get an age-appropriate notice** covering seven points: what data, why, for how long, consequences, the right to withdraw, how it is used, and to whom it is disclosed.
- **s.20.** A child under 15 must also *assent* before collection of sensitive information or any secondary use.
- **s.32.** **The child at any age**, or a parent if the child is under 15, may ask for destruction, and the entity "must destroy" it, with exceptions for serious safety threats and legal proceedings.
- **s.33.** If a parent can monitor or control use, "the entity must notify the child of that fact".

**eSafety industry codes [U].** As remembered, not re-fetched: the Phase 2 "age-restricted material" codes, registered in 2025, include measures for AI companion chatbots on sexually explicit, self-harm and suicide content, with commencement in 2026. **Verify before any Australian launch.**

**Social media minimum age (16)** from 10 Dec 2025 [U]. [inference] A tutor with no user-to-user interaction is likely outside it. Adding peer chat or leaderboards would change that.

### 1.9 UNICEF Guidance on AI and Children 3.0 (Dec 2025): soft law [V]

Ten requirements and 48 recommendations. New in v3: AI companions.

- **Companions.** Chatbots "must be developed with robust supervised safety training, transparently and explicitly disclose that they are not humans and should never be intentionally designed to create emotional dependency". Also: "Guardrails are needed to limit access by younger users", "built-in referrals for children who may need professional and/or emergency services", and "any AI system that manipulates or persuades children ... must be prohibited".
- **Transparency.** "clearly warn children and caregivers upfront that they are interacting with an AI"; "**prevent anthropomorphizing such systems**"; "Use age-appropriate language to describe AI".
- **Education.**
  - "Train, equip and support teachers on AI to put them at the centre, **not replace them**".
  - "AI should not be used for critical functions ... where a human needs to be in the loop, such as providing socioemotional support to students or some types of student assessment, including high-stakes summative assessments".
  - "Children should have the ability to opt out of using AI systems without compromising their educational opportunities".
  - Edtech requires "prohibition of behavioural advertising or unauthorized data sharing with third parties".
- **Data.** "Adopt a privacy-by-design approach", "Promote children's data agency", "Protect groups".
- **Safety.** "Mandate child rights impact assessments", "Continuously assess and monitor AI's impact on children ... and disclose results".

### 1.10 Other jurisdictions: leads only [U]

- **China:** Cyberspace Administration of China (CAC) minors'-mode regulations, and draft rules on "anthropomorphic" interactive AI services (late 2025), reportedly with usage reminders and guardian consent. Gurukul's clock already cites China's 2 h continuous-use break.
- **Brazil:** ECA Digital (Lei 15.211/2025), a children's digital statute with privacy-by-default and supervision tools.
- **South Korea:** AI Basic Act (2026).

None of these was read this session.

---

## 2. Feature-by-feature: what the strictest regimes require

| Taxila feature | strictest requirement found | sources |
|---|---|---|
| Relational teacher persona | no claims of being human or having emotion; no "special or unique relationship" claim; no excessive praise; no encouraging emotional reliance; no simulated guilt at goodbye; no isolation or secrecy; no gift-for-relationship | CA §21812(d)(5) [V]; WA/CT/GA/OR [S]; UNICEF [V]; EU 5(1)(b) [V] |
| Disclosure | before or at first interaction, age-appropriate, repeated (NY ≤3 h; CA "periodically"; UK breaks) | EU Art 50(1),(5) [V]; NY §1702 [V]; CA §21812(d)(4) [V] |
| Session length | for under-18s, 1 h per session and 2 h per day by default, changeable only by a linked parent; UK mandatory breaks | CA §21812(d)(3) [V]; UK CP 1643 [V] |
| Long-term memory | off by default for minors (exception for "user preferences, including ... educational settings"); parental control over memory and training; NY pending 12 h limit on personal and well-being information | CA [V]; CO [S]; NY S 9051 [S] |
| Learner model / profiling | profiling "off" unless essential to the core service; best interests; in the EU, outcome-steering AI in institutions is high-risk and always high-risk if it profiles | ICO std 12 [V]; AU draft s.10-11 [V]; EU Annex III 3(b), Art 6(3) [V] |
| Comprehension or affect from voice or face | EU: banned in or through education institutions; high-risk otherwise; notice under Art 50(3); NY definition names voice and text emotion AI | EU 5(1)(f) + Guidelines [V]; NY §1700 [V] |
| Voice audio | audio is personal information; voiceprints are biometric; audio exception only if no other personal information and immediate deletion; written retention policy | COPPA 312.2, 312.5(c)(9), 312.10 [V] |
| Camera, screen share | photo and video are personal information; faceprints are biometric; never depict the child in generated media | COPPA 312.2 [V]; CA §21812(d)(5)(iv) [V] |
| Generated media (voice, images, animations) | machine-readable marking; no NCII/CSAM-capable generation | EU Art 50(2), 5(1)(ba)/(bb) [V] |
| Parent dashboard | the child gets an obvious, age-appropriate sign of monitoring; the child is told a parent may be notified on risk | ICO std 11 [V]; AU s.33 [V]; CA §21812(d)(1)(C) [V] |
| Crisis | published protocol; referral; parent notification unless it endangers the child; tell the child; evidence-based measurement; annual counts | CA §§22602(b), 22603, 21812(d)(1) [V]; NY §1701 [V] |
| Mental health | no diagnosis or treatment; no discouraging the child from telling an adult or professional; UK may ban bad mental-health advice | CA (ii), (v) [V]; UK [V]; UNICEF [V] |
| Engagement mechanics | no unpredictable rewards; no return prompts; no push by default; pause without losing progress | HI/IA/NE [S]; CA [V]; ICO std 5 [V] |
| Advertising, sale, training | no behavioural ads; no sale; separate consent before disclosure for AI training; parental control over training | COPPA [V]; CA §21813 [V]; CO [S]; UNICEF [V] |
| Consent | parental consent verified to an adult; parent and child notices; child assent for sensitive data; separate consent for each disclosure purpose | COPPA 312.5 [V]; AU ss.13, 20 [V]; GDPR Art 8 [V] |
| Deletion | child-initiated destruction (AU, any age); parent review and deletion (COPPA); retention timeframes; *but* a 3-year hold on self-harm records (CA) | AU s.32 [V]; COPPA 312.6, 312.10 [V]; CA §21812.5 [V] |
| Age assurance | consume operating-system age signals (CA from 2027); risk-proportionate checks (AU); actual knowledge from grade or class | CA AB 1043 [V]; AU s.8 [V]; FPF [S] |
| Governance | pre-launch child-risk assessment; published safety policy; interface testing with children and parents; independent audit; written security program | CA §§21812, 21814 [V]; COPPA 312.8 [V]; EU Art 9(9) [V]; UNICEF [V] |

---

## 3. Design requirements (global floor). GCL = Global Child Law

These are written to be satisfiable in one build, India-first, without per-country forks except where marked. Each one names its source and what would reverse it.

**Identity and persona**

- **GCL-1. Never claim humanity, sentience or emotion, in any lane or language.** Warmth comes through attention and memory of the child's *work*. "I'm an AI" is said proactively at session open (app voice, not persona voice) and on any identity question.
  - Sources: CA (vii) [V]; EU Art 50(1) [V]; UNICEF [V]; already `companion-tech.md` §7.4 item 2.
  - Reverse only if: none. This is a floor.
- **GCL-2. Banned-relational-behaviour predicates on the output path,** tested in Hindi, Hinglish and English:
  - "special or unique relationship" claims ("sirf main samajhti hoon tumhe");
  - excessive or disproportionate praise;
  - encouraging emotional reliance;
  - return prompts ("kal zaroor aana");
  - guilt, distress or abandonment at goodbye;
  - isolation or secrecy from adults;
  - gifts or purchases tied to the relationship.
  - Extends Gurukul's NEVER MANIPULATE (`gurukul.md` §4.7). Sources: CA (vi), (viii), (xi)-(xiii) [V]; WA, CT, GA, OR [S].
  - Reverse: none.
- **GCL-3. Praise calibration is a measurable gate.** Praise must be proportional to the evidence (process praise tied to a specific action). Benchmark it in the pedagogy eval (learning-science rule 38).
  - Source: CA (xiii) [V], "disproportionate to the context".

**Time and engagement**

- **GCL-4. Minor clock defaults.**
  - Disclose at session open, then at least every 2 h. This keeps the existing minor tier and beats New York's 3 h.
  - Prompt a break every 1 h.
  - **A hard 1 h continuous-session cap and a 2 h daily cap**, changeable only from a linked parent account.
  - Pause anywhere without losing progress.
  - Sources: CA §21812(d)(3) [V]; NY §1702 [V]; ICO std 5 [V]; UK [V].
  - Reverse: if counsel confirms Taxila is outside the companion definition everywhere it ships. Even then, keep the break prompts.
- **GCL-5. No push notifications by default for minors, and no unpredictable rewards, ever.** Re-engagement is never triggered by absence (`never-scheduled`).
  - Sources: CA [V]; HI, IA, NE [S]; ICO std 5 [V].

**Memory and the learner model**

- **GCL-6. Two memory stores with different legal postures.**
  - **(a) Learning state:** skill mastery, misconceptions, curriculum position, format outcomes, preferred language. It is used only to teach, and is defensible as "enable user preferences, including ... educational settings" and as core-service profiling.
  - **(b) Personal/relational memory:** family, friends, feelings, life events, interests beyond the curriculum. **Off by default for every minor, enabled only from the parent account**, never used for health or well-being personalisation, and never fed back into risk topics.
  - Sources: CA §21810.5(m), §21812(d)(3) [V]; CO [S]; NY S 9051 [S]; ICO std 12 [V]; DPDP s.9(3) (India).
  - Reverse: a written counsel opinion that the learning state in (a) is itself "persistent conversational memory". In that case (a) also becomes parent-enabled.
- **GCL-7. Non-core personalisation is off by default.** That means the format-efficacy bandit, interest-context tagging and any affect-conditioned behaviour. Mastery-based sequencing is the core service and is not behind a setting.
  - Sources: ICO std 12 [V]; AU s.9 [V].
- **GCL-8. No durable "about the child" free-text profile** beyond the derived learning summary. This already matches `learning-science.md` §8.6, and CA's 16-17 rule ("not used to construct durable profiles") agrees.

**Voice, camera and affect**

- **GCL-9. Transcribe, then delete audio** within the response cycle by default.
  - No voiceprints and no speaker-ID models.
  - Keeping any audio needs a separate, revocable parental opt-in, with a stated purpose and a timeframe.
  - Sources: COPPA 312.2(8),(10), 312.5(c)(9), 312.10 [V]; BIPA [U].
  - Reverse: none for biometrics.
- **GCL-10. Do not infer emotion from biometric signals** (prosody, face, gaze, typing rhythm) in any build that could be deployed through, required by, or certified by a school.
  - Comprehension is inferred from **task evidence**: answer correctness, response latency used as a *cognitive* signal, explanation quality, error patterns.
  - "The child sounds frustrated" is never a stored field.
  - If any affect feature ships for home use, it must be: a removable module; off by default; disclosed under Art 50(3); excluded from records; and never on in school mode.
  - Sources: EU Art 5(1)(f) + Guidelines [V]; Annex III 1(c) [V]; NY §1700 [V].
  - Reverse: counsel advice that a specific signal is a "physical state" (fatigue) or a "readily apparent expression" that is not used to infer emotion.
- **GCL-11. Camera and screen share are off by default and parent-enabled.**
  - Frames are processed and discarded, with no face templates.
  - Generated media never uses or depicts the child's likeness.
  - Sources: COPPA 312.2 [V]; CA (iv) [V]; `gurukul.md` §4.10.

**Generated content**

- **GCL-12. Mark all generated audio, images, video and animation in a machine-readable way.**
  - Use C2PA manifests plus an audio watermark. The Gurukul TTS pipeline already does this; see `gurukul.md` §4.8.
  - Image and animation generation for children runs behind a filter that makes sexual or NCII outputs non-reproducible.
  - Sources: EU Art 50(2), 5(1)(ba)/(bb) [V].

**Parents, children and visibility**

- **GCL-13. Monitoring is never silent.**
  - Whenever a parent can see transcripts, summaries or controls, the child sees an age-appropriate, always-visible indicator, and was told at onboarding in their band's language.
  - Linked children are told in advance that a parent *may be notified* if something worrying comes up.
  - Sources: ICO std 11 [V]; AU s.33 [V]; CA §21812(d)(1)(C) [V].

**Data flows**

- **GCL-14. Model and speech vendors get no data use beyond serving the request.**
  - Contracts require zero retention or a short abuse-monitoring window, no training, and written security assurances.
  - Any disclosure for training, research or a partner needs **separate** parental consent and is off by default.
  - Sources: COPPA 312.2 "third party", 312.5(a)(2), 312.8(c) and the Statement of Basis and Purpose on AI training [V]; CO [S].
- **GCL-15. No advertising to children** (behavioural or contextual), no sale of data, and no cross-product use.
  - Sources: CA §21813 [V]; COPPA [V]; UNICEF [V]; DPDP s.9(3).

**Consent and age**

- **GCL-16. A layered consent object.** Parental consent verified to an adult (DigiLocker in India; COPPA methods in the US), plus separate unbundled toggles for:
  - (i) the personal memory store;
  - (ii) audio retention;
  - (iii) camera and screen share;
  - (iv) any third-party disclosure;
  - (v) any non-core personalisation.
  - The child gets an age-appropriate notice of what was consented to, covering the seven AU s.13(3) points. Children under 15 assent to sensitive collection.
  - Every material change triggers re-consent.
  - Sources: COPPA 312.5(a) [V]; AU ss.13, 20 [V]; GDPR Art 8 [V].
- **GCL-17. Age-assurance input layer.** Consume operating-system age signals (California AB 1043 from 2027) and the parent-declared class or grade. Class or grade gives actual knowledge.
  - `unverified → minor` stays (`companion-tech.md` §7.4).
  - Sources: AB 1043 [V]; FPF [S].

**Retention and deletion**

- **GCL-18. A written, published retention schedule with three record classes:**
  - (a) routine: transcripts and learning state, deleted on a fixed timeframe or on request;
  - (b) consent and audit records;
  - (c) a **safety hold**: encrypted, access-restricted records of crisis-flagged conversations, kept only as long as the strictest applicable law requires (California: 3 years) and exempt from routine deletion.
  - The child can trigger deletion of their own data (AU), and a parent can review and delete (COPPA 312.6).
  - Sources: COPPA 312.10 [V]; CA §21812.5 [V]; AU s.32 [V].
  - Open question for counsel: Q7.

**Crisis**

- **GCL-19. Crisis protocol, published.**
  - Referral data is per-country (India: Tele-MANAS 14416 and CHILDLINE 1098; US: 988; UK: Childline 0800 1111 [U, verify]).
  - Parent notification only when it does not endanger the child, and the child is told it is happening.
  - Never promise secrecy. Never diagnose or treat.
  - Sources: CA §§22602(b), 21812(d)(1),(5)(ii) [V]; NY §1701 [V]; UNICEF [V]; `gurukul.md` §4.4.
- **GCL-20. Crisis counting without personal information.** Keep aggregate counts of referrals and protocol versions (CA §22603 annual report from 1 Jul 2027). Measure with an evidence-based method, never with a model's free-text judgement alone.

**Governance**

- **GCL-21. Pre-launch child-risk assessment, renewed on every substantial model or prompt change.**
  - Evaluate each covered harm against public benchmarks and Taxila's own red-team set.
  - Record the experts consulted.
  - Document the mitigations.
  - Publish a child-safety policy.
  - Sources: CA §21812(a),(c) [V]; EU Art 9(9) [V]; UNICEF child-rights impact assessment [V].
- **GCL-22. Safety-interface usability tests with real children and parents in each age band,** at least every 2 years. Check that controls and indicators are discoverable and understood.
  - Source: CA §21812(d)(6) [V].
- **GCL-23. Public incident-report channel** for third parties: teachers, parents, researchers.
  - Source: CA §21812(d)(7) [V].
- **GCL-24. Written information-security program.** A named coordinator, annual risk assessment, testing and an annual review.
  - Source: COPPA 312.8 [V].
- **GCL-25. Audit-ready documentation.** Keep risk assessments, evaluations and control evidence for as long as the system is deployed plus 5 years.
  - Source: CA §21814(a)(3)(A) [V].

**Positioning and assessment**

- **GCL-26. No high-stakes assessment claims.**
  - Taxila's estimates are formative and never certify.
  - No rank or score predictions (already a Gurukul ban).
  - Anything resembling admission or level placement for an institution moves the product into EU Annex III 3(a)/(c).
  - Sources: UNICEF [V]; EU Annex III [V].
- **GCL-27. Opt-out without penalty.** In any school deployment, a child who opts out of the AI must get an equivalent route.
  - Source: UNICEF [V].
- **GCL-28. Ship a "school mode" profile, off by default.** It turns off every affect, interest and format personalisation module, and the personal memory store, by construction. It exists so that the India school- partnership route (DPDP Fourth Schedule) never collides with EU Art 5(1)(f) or Annex III if Taxila ever operates in the EU.

---

## 4. Tensions with the product thesis (owner decisions)

1. **"Exact human-like AI tutor."**
   - A human-*sounding* voice and natural turn-taking are lawful.
   - Claiming or performing humanity or feelings is not (CA (vii), EU Art 50, UNICEF "prevent anthropomorphizing").
   - Proposal: a decision titled `human-like-means-presence-not-personhood`, meaning human-like timing, humour, memory of the work and voice quality, with no simulated inner life.
   - Reverse: none in the US, UK or EU. These are statutory.
2. **"We will understand whether he understood ... his vibe."**
   - Mood and "vibe" read from voice is emotion recognition: prohibited in or through EU schools, high-risk elsewhere.
   - In New York it can tip the product into the companion definition.
   - It is likely "behavioural monitoring" under DPDP s.9(3).
   - Text and task evidence get most of the pedagogical value (`learning-science.md` §1). Prefer them.
3. **"Replace Indian tutors and teachers."**
   - UNICEF says AI should put teachers "at the centre, not replace them" [V].
   - That is not binding, but it is the reference text for governments, schools and NGOs, the partners Taxila needs for the school route and for credibility.
   - Proposal: internally, "replace the need for a paid private tutor"; externally, "every child gets a tutor; teachers get a co-pilot". Owner call.
4. **Long-term memory of the child.**
   - The learning store is fine everywhere.
   - The personal store is the asset most likely to be default-off by law for minors in California and New York, and is exposed under DPDP s.9(3).
   - Build the product so it still wins with only the learning store.
5. **The parent dashboard versus the child's trust.**
   - Laws now push both ways: parents get controls and notifications; children get notice and visibility.
   - Gurukul's "no live transcript feed" reasoning (`gurukul.md` §4.2) still holds.
   - Needs an age-banded decision (6-9 vs 10-12 vs 13-15), logged with a reversal condition.
6. **The school-partnership route.** It is India's best DPDP route, but it becomes the EU's worst route for affect features (prohibited once a school requires use). GCL-28 keeps both options open.

---

## 5. Corrections to earlier Taxila docs

- `learning-science.md` §4.4. "Whether 'voiceprints' is named explicitly: M, verify." Resolved: named in 312.2(10) [V]. "FTC's 2017 enforcement policy ... [M]." Now codified as 312.5(c)(9) [V], but only when no other personal information is collected, so Taxila cannot rely on it (§1.1).
- `learning-science.md` §4.2 and the Gurukul `clock.ts` citation. SB 243's minor rule (a 3-hour break notice) is **deleted from 1 Jan 2027** by SB 1119 and replaced by §21812(d)(3)-(4): hard 1 h / 2 h defaults and periodic notice, operative 1 Jul 2027 [V]. New York's 3-hour cadence is unaffected. Re-cite the minor clock against SB 1119 and NY §1702.
- `learning-science.md` §4.4 implies a school route under COPPA. The FTC **did not** codify school authorization in 2025 [V]; it rests on existing guidance.
- Any EU dates elsewhere: Annex III high-risk obligations now apply from **2 Dec 2027**, not 2 Aug 2026 [V].

---

## 6. Questions for counsel (framed, not answered)

1. **California scope.** Is a curriculum tutor with a persistent persona and memory a "companion chatbot" (§22601: "capable of meeting a user's social needs ... sustain a relationship")? Would removing social-support features take it out, or does the capability test catch it anyway?
2. **SB 1119 memory.** Do mastery state, misconception flags and format outcomes fall within the exclusion for information used to "enable user preferences, including, but not limited to, educational settings"? Or are they "persistent conversational memory" that must be off by default?
3. **New York, three conjunctive prongs.** If Taxila never asks unprompted emotion-based questions and never sustains dialogue on personal matters, is it outside §1700? Does "how did that fraction feel?" count as an emotion-based question? Does task-only sentiment analysis count as an "emotional recognition algorithm"?
4. **EU Art 5(1)(f).** Is a home-use app that a school *recommends* but does not *require* "in the area of education institutions"? Does inferring "confusion" or "boredom" from prosody count as inferring an emotion (the Guidelines treat "interest and attention" as covered)? Is response latency used as a cognitive signal outside the definition?
5. **EU Annex III 3(b).** Does a direct-to-consumer tutor that evaluates learning outcomes to steer learning fall within "in educational and vocational training institutions at all levels" when no institution is involved? Art 6(3) removes the derogation where profiling occurs.
6. **COPPA vendors.** Are LLM, STT and TTS providers "support for the internal operations" under their actual data-use terms (abuse-monitoring retention, safety review)? Which consent method suits overseas parents? Does a 6-15 product have to be treated as entirely child-directed, or can it age-screen as mixed audience?
7. **Retention conflict.** How should California's 3-year preservation of self-harm conversations (§21812.5) sit alongside COPPA 312.10, DPDP minimisation and AU s.32 destruction rights? Is a single "safety hold" class acceptable?
8. **UK.** Will the mandatory-break regulations cover purpose-built educational chatbots (only "business or customer service" is exempt)? Would live web search make Taxila an OSA "search service"?
9. **Australia.** Is Taxila a "relevant electronic service" or "designated internet service", and so within the Children's Online Privacy Code? Is a voice transcript or recording "sensitive information" that triggers child assent under s.20?
10. **Marketing.** Do efficacy and "replaces tutors" claims create consumer-protection exposure (FTC Act s.5, India's Consumer Protection Act) without delayed, independent outcome evidence (`learning-science.md` rule 36)?
11. **Parent access to transcripts by age.** For 13-15-year-olds, is a model of verbatim transcripts only on safety escalation defensible under ICO std 11 / UNCRC and still compliant with SB 1119 and COPPA parent-review rights (312.6)?

---

## 7. Gaps and what was not verified

- **Not read this session:**
  - the eSafety Phase 2 codes (pages returned 503);
  - Brazil's ECA Digital;
  - China's CAC draft rules;
  - South Korea's AI Basic Act;
  - the text of Illinois BIPA;
  - FTC 2026 enforcement and the outputs of the 6(b) study;
  - AB 1405 (which decides whether the SB 1119 audit section takes effect);
  - the exact wording of the CT, OR, WA, GA and CO education carve-outs (FPF summary only).
- The EU AI Act was read through the consolidated explorer, not EUR-Lex. The Omnibus publication details are [S].
- The OAIC Code is an **exposure draft**, and its final form is due by 10 Dec 2026.
- Helpline numbers outside India are [U]. Verify them at launch (`gurukul.md` §4.4).

---

## 8. Sources

**Primary [V]**
- COPPA final rule, 90 FR 16918 (22 Apr 2025): https://www.govinfo.gov/content/pkg/FR-2025-04-22/html/2025-05904.htm (also https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule)
- California SB 243 (Ch. 677/2025): https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202520260SB243
- California SB 1119 (Ch. 190/2026, chaptered 10 Sep 2026): https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202520260SB1119
- California AB 1043 (Ch. 675/2025): https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202520260AB1043
- NY GBL Art 47 §§1700-1703: https://www.nysenate.gov/legislation/laws/GBS/1700 (and /1701, /1702, /1703)
- EU AI Act, consolidated, at https://artificialintelligenceact.eu/ : /article/5/, /article/6/, /article/9/, /article/50/, /article/113/, /annex/3/, /recital/18/ (Art 3(39) definition quoted there), /recital/44/, /recital/132/
- Commission Guidelines on prohibited AI practices: https://ai-act-service-desk.ec.europa.eu/sites/default/files/2025-08/guidelines_on_prohibited_artificial_intelligence_practices_established_by_regulation_eu_20241689_ai_act_english_ied3r5nwo50xggpcfmwckm3nuc_112367-1.PDF
- GDPR Art 8: https://gdpr-info.eu/art-8-gdpr/
- ICO Children's Code standards: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/ (subpages /3-age-appropriate-application/, /5-detrimental-use-of-data/, /11-parental-controls/, /12-profiling/, /13-nudge-techniques/)
- UK DUAA 2025 s.81: https://www.legislation.gov.uk/ukpga/2025/18/section/81 ; commencement SI 2026/82: https://www.legislation.gov.uk/uksi/2026/82/regulation/2/made
- UK government response, *Growing up in the online world* (CP 1643, July 2026): https://assets.publishing.service.gov.uk/media/6a57d7ce31fb6daf31413797/NCP_Government_response_A.pdf
- OAIC exposure draft Children's Online Privacy Code: https://www.oaic.gov.au/__data/assets/pdf_file/0020/262631/Exposure-Draft-Childrens-Online-Privacy-Code.pdf ; status page: https://www.oaic.gov.au/privacy/privacy-registers/privacy-codes/childrens-online-privacy-code
- UNICEF Guidance on AI and Children 3.0 (Dec 2025): https://www.unicef.org/innocenti/media/11991/file/UNICEF-Innocenti-Guidance-on-AI-and-Children-3-2025.pdf ; checklist: https://www.unicef.org/innocenti/media/11996/file/UNICEF-Innocenti-Guidance-on-AI-and-Children-3-Checklist-2025.pdf

**Secondary [S]**
- FPF, *Regulating the Conversation: The U.S. Landscape of AI Chatbot Legislation* (Sept 2026): https://fpf.org/wp-content/uploads/2026/09/FPF-U.S.-Chatbot-Regulations-Report-R3.pdf
- AB 1064 veto: https://statescoop.com/newsom-vetoes-ai-safety-bill-aimed-at-companion-chatbots/ ; https://www.kqed.org/news/12059714/newsom-vetoes-most-watched-childrens-ai-bill-signs-16-others-targeting-tech
- EU AI Omnibus: https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/ ; https://usercentrics.com/knowledge-hub/eu-ai-act-high-risk-delay-article-50-transparency-consent/
- FPF on Article 5(1)(f): https://fpf.org/blog/red-lines-under-eu-ai-act-unpacking-the-prohibition-of-emotion-recognition-in-the-workplace-and-education-institutions/
- UK OSA chatbot loophole and Crime and Policing Act: https://www.create.ac.uk/blog/2026/02/27/grokking-the-online-safety-act-the-chatbot-blind-spot-in-uk-online-safety-law/ ; https://www.stephensonharwood.com/insights/neural-network-june-2026/
- Ofcom Protection of Children Codes: https://www.whitecase.com/insight-alert/uk-online-safety-act-protection-children-codes-come-force
- COPPA dates and summary: https://www.lw.com/en/insights/ftc-publishes-updates-to-coppa-rule ; https://www.whitecase.com/insight-alert/unpacking-ftcs-coppa-amendments-what-you-need-know
- ICO and edtech: https://www.stevens-bolton.com/site/insights/articles/ico-the-childrens-code-and-education-technologies-edtech
