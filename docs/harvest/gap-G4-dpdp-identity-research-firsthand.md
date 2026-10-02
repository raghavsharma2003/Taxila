# Gap G4: DPDP and identity research, read first-hand

Gap-fill, 2026-10-02. Read-only on every source repo (`git show <ref>:<path>`, no checkout). No secrets were read.
Secret present at `api/_config.js` (html-portfolio, gitignored); it was not opened.

**Refs used.**
- `@vy` = html-portfolio `origin/claude/vyakti-cloning-platform-aq05n4@ebe16cc0` (2026-09-30)
- `ai2b@main` = ai2bharat `origin/main@a11c521`
- Taxila working tree, 2026-10-02

**Primary legal texts, re-read for this gap on 2026-10-02.**
- DPDP Act 2023 s.9(1)-(5), via the dpdpa.com section reproduction. This is the same page `safety-reg.md` cites. I
  compared it word for word with Taxila's own gazette reading in `docs/research/safety/dpdp-deep.md` §2.1, and they
  match.
- DPDP Rules 2025, G.S.R. 846(E), "New Delhi, the 13th November, 2025". I took the English reprint from
  `dpdpa.com/DPDP_Rules_2025_English_only.pdf` (md5 `09f1edb7…`), ran `pdftotext`, and read r.1, r.10, r.12 and the
  Fourth Schedule verbatim.

Tags: **[V]** means I read it in primary text today. **[R]** means the claim as a repo states it. **[U]** means my
inference.

---

## 0. Bottom line

1. **The brief's premise is half right.** `docs/research/safety-reg.md@vy` §3 (L147-243) is the only DPDP reading in
   the three files named. Neither `identity.md@vy` nor `india.md@vy` says anything about s.9, consent or age tiers.
   `india.md@vy` L370 has one line flagging religion as sensitive data "under DPDP". `identity.md` is about persona
   portability across models.
2. **The repos' DPDP readings carry three substantive errors** (§1):
   - **(a)** `safety-reg.md` L199-201 says s.9(3) bans tracking and monitoring "outright — no exceptions listed
     comparable to COPPA's carve-outs". That is wrong. s.9(4), Rule 12 and Fourth Schedule Part A item 3 exempt "an
     educational institution", and the condition is "tracking and behavioural monitoring — (a) for the educational
     activities of such institution" [V].
   - **(b)** `safety-reg.md` L217-219 and `ai2b@main docs/strategy/05-technology.md` L252-254 say Rule 10 confirms
     "the parent-child relationship" via DigiLocker. Rule 10(1) checks only "that the individual identifying herself
     as the parent is an adult who is identifiable", and DigiLocker is one optional source of an authorised token [V].
   - **(c)** The **2027-05-14** "full effect" date written into the code comes from a secondary market sweep. The
     project's own regulatory track, and r.1(4) of the Rules, give **2027-05-13**. 14 May is a minority computation
     (dpdp-deep §1).
3. **No repo built verifiable parental consent, and none was meant to.** All four Vyakti design proposals chose
   "verified-adult-only at India launch" because VPC was not affordable:
   - `docs/research/design/PROPOSAL-A-graph.md@vy` L966
   - `-B-events.md@vy` L921
   - `-C-minimal.md@vy` L824
   - `-D-multimodal.md@vy` L1164

   ai2bharat chose an 18+ declaration (05-technology L263, migration `…0024`). **Nothing in any repo gates s.9(3).**
   The only children's DPDP gate in code is `clock.ts`'s `engagementMechanics`, and that is s.9(2).
4. **Taxila already has the primary reading the map called missing.** `docs/research/safety/dpdp-deep.md` (2026-10-02,
   gazette text, 15 counsel questions, narrow-mode rules NM-1 to NM-13) closes §7's "second-hand" gap for the law
   itself. INHERITANCE-MAP never cited it. What was still missing is the reconciliation in §2 and §3 below.
5. **Taxila's code now conflicts with its own DPDP decision.** Decision `learner-legal-mode-ratchet` adopts NM-3:
   latency, pauses, prosody, trust and format posteriors are "never persisted in any mode". But:
   - `db/migrations/006_voice_features.sql` and `server/voice/features.js` persist per-child onset latency, pauses,
     f0 and speech rate, with no consent check.
   - `server/routes/lesson.js` L775-777 updates `rel_state.trust` at every lesson end, also with no consent check.
   - The ratchet itself is not implemented. `workspace.legal_mode` defaults to `'standard'`, which is not one of
     M0-M3 (`004_conductor.sql` L175).
   - Every consent row is written with `method 'checkbox_v1'` (`server/routes/account.js` L55). dpdp-deep rejects
     self-declaration as the sole mechanism (M-e).

   Compliance is deferred (`compliance-deferred-to-launch`), but these are launch-blockers that already exist in the
   schema.

---

## 1. Primary-sourced table for §2.18 (auth / accounts / consent)

Reading date for every row: 2026-10-02.

| # | provision | exact text [V] | what the repo source doc says [R] | what the repos built against it | verdict on the repo claim | question for counsel |
|---|---|---|---|---|---|---|
| 1 | **s.9(1) verifiable parental consent** | "The Data Fiduciary shall, before processing any personal data of a child or a person with disability who has a lawful guardian obtain verifiable consent of the parent of such child or the lawful guardian, as the case may be, in such manner as may be prescribed." | `safety-reg.md@vy` L201-202: "Verifiable parental consent is mandatory before processing a child's data." `ai2b@main 05-technology.md` L252-253: the same. | **Not built anywhere.** Vyakti: `api/_room-surface.js@vy` L1301-1306 refuses anyone who is not 18+ ("a Room is an adult surface"). `api/clock.js@vy` L20-24: "no verification lane exists yet", so a client asking for `adult_verified` "is refused by construction". ai2b: an 18+ declaration (`…0024`). Taxila: a `consent` table (`001_core.sql` L26-38), always `method='checkbox_v1'`. | Correct. "Before processing **any**" means no child voice before VPC, not even a demo lesson (dpdp-deep NM-13). | dpdp-deep Q12: does s.5(2) carry pre-commencement checkbox consents past 13 May 2027? **New G4-a:** may a parent-only trial lesson, with no child audio, run before VPC under Part B item 6? |
| 2 | **Rule 10 mechanism** | r.10(1): "…due diligence, for checking that the individual identifying herself as the parent is an adult who is identifiable … by reference to— (a) reliable details of identity and age … available with the Data Fiduciary; or (b) details of identity and age, voluntarily provided — (i) by the individual; or (ii) through a virtual token mapped to such details, which is issued by an authorised entity." | `safety-reg.md@vy` L217-219: "integrates with **DigiLocker** … to confirm the parent's identity and the parent-child relationship". Its source is "search summary". `ai2b@main 05-technology.md` L253: "DigiLocker-based verification of the parent's identity and relationship is the named method". | Nothing built. Vyakti's adult-verification lane (`api/_replica-identity.js@vy` L339 sets `age_tier='adult_verified'`) is face/ID liveness for voice cloning. The map already refuses that for minors. | **Wrong on two points.** The relationship is declared, not verified. DigiLocker is optional. Repeating it would over-build an integration and under-build the attestation. | dpdp-deep Q4, Q5, Q6 (which mechanisms satisfy Case 4; Aadhaar limits; liability language for a declared relationship). |
| 3 | **s.9(3) ban** | "A Data Fiduciary shall not undertake tracking or behavioural monitoring of children or targeted advertising directed at children." | `safety-reg.md@vy` L199-201: "bans behavioural tracking/monitoring of children and targeted advertising directed at children outright — no exceptions listed comparable to COPPA's carve-outs". `ai2b@main 05-technology.md` L254-255 and L268: "prohibited (s.9(3)) … the legal twin of NEVER MANIPULATE". | **No gate in any repo.** `src/engine/clock.ts@vy` L42-49 `TierGates` has only `engagementMechanics` (cited to s.9(2)) and `romanceRegisters`. ai2b's no-affect rule (`never-store.ts` + `…0022` CHECK) and closed six-kind memory list are the nearest structural analogue (ai2b-core §2). Taxila: decision `learner-legal-mode-ratchet` exists; code does not. | The quote is correct. "**Outright**, no exceptions" is wrong: see row 4. "Tracking" and "behavioural monitoring" are undefined in s.2 (dpdp-deep §2.2). | dpdp-deep Q1 (a)-(d). **New G4-b, G4-c** in §3 below. |
| 4 | **s.9(4) + Rule 12 + Fourth Schedule** | s.9(4): "(1) and (3) shall not be applicable to processing … by such classes of Data Fiduciaries or for such purposes, and subject to such conditions, as may be prescribed." Fourth Sch. Part A item 3: "A Data Fiduciary who is an educational institution. — Processing is restricted to tracking and behavioural monitoring— (a) for the educational activities of such institution; or (b) in the interests of safety of children enrolled with such institution." Note (c): "'educational institution' shall mean and include an institution of learning that imparts education, including vocational education". | `safety-reg.md@vy`: **absent.** `ai2b@main 05-technology.md` L257-259: "Fourth Schedule / Rule 12 exemptions are for schools, creches, clinics and transport providers … An independent online community is not obviously in that class". | Nothing built. No repo has a school-as-fiduciary mode. | ai2b is right and safety-reg missed it. For Taxila this is the **only** statutory route to its full learner model. It also proves the government regards educational tracking as "behavioural monitoring", since otherwise it would need no exemption (dpdp-deep §0.3, the surplusage argument). | dpdp-deep Q2 (is D2C Taxila an "institution of learning"; does a processor for a school inherit item 3). |
| 5 | **s.9(5) verifiably-safe notification** | "…may, if satisfied that a Data Fiduciary has ensured that its processing of personal data of children is done in a manner that is verifiably safe, notify … the age above which that Data Fiduciary shall be exempt from … (1) and (3)…" | Absent from every repo doc. | Nothing. | A per-fiduciary, age-thresholded route. No process exists [S, dpdp-deep §2.1]. | dpdp-deep Q9. |
| 6 | **s.9(2) detrimental effect** (the one the repos did build against) | "A Data Fiduciary shall not undertake such processing of personal data that is likely to cause any detrimental effect on the well-being of a child." | `safety-reg.md@vy` L195-199 and L206-215: a "product-design rule" reaching streaks, notification cadence and variable reward. | `clock.ts@vy` L52-57 `MINOR_HARD_GATES` freezes `engagementMechanics:false`. **But** L59-68: by owner decision 2026-08-15, `unverified` maps to adult gates (`engagementMechanics: true`). Already in the map's fact 1. | Correct and built, with the default inverted. s.9(4) does not reach (2), so it can never be exempted [V]. | dpdp-deep Q8. |
| 7 | **Commencement ("full effect")** | r.1(4): "Rules 3, 5 to 16, 22 and 23 shall come into force eighteen months after the date of publication of this Gazette." Gazette: "New Delhi, the 13th November, 2025", G.S.R. 846(E). Rule 10 and Rule 12 are inside 5-16. | Three different repo dates. (i) `safety-reg.md@vy` L149-157: notified 13 Nov 2025, Rules 3, 5-16, 22, 23 from **13 May 2027**. `RESEARCH.md@vy` L182 says the same. (ii) `market-verify.md@vy` L49: "notified … 14 Nov 2025 … full enforcement powers from **May 13, 2027**", which is internally inconsistent. (iii) `market-sweep-2026-08-25.md@vy` L25: "DPDP Act full effect **2027-05-14**". | The 14 May date was copied from (iii) into code comments and decisions: `db/migrations/016_memory_consent.sql@vy` L5, `db/schema.sql@vy` L127, `api/account.js@vy` L276, `src/engine/memory.ts@vy` L16, `src/state/store.ts@vy` L191, `api/_room-surface.js@vy` L1296, `context/decisions.md@vy#memory-asks-first` L2685, `measurements.md@vy` L2917. Also `@mm` `MemoryConsent.tsx` L3 and `Onboarding.tsx` L34. | 14 May is defensible only on the 14 Nov signature timestamp (dpdp-deep §1). **Plan to 13 May 2027.** s.9 itself commences with ss.3-17 by the Act's notification G.S.R. 843(E) [S]. A MeitY compression proposal (Jan 2026) may pull parts earlier [S]. | dpdp-deep §1 re-check list (any amendment that brings dates forward). |
| 8 | **Unbundled, itemised consent** (s.6(1), r.3) | s.6(1): consent "free, specific, informed, unconditional and unambiguous with a clear affirmative action" (dpdp-deep §7.1 [V]). | `market-sweep-2026-08-25.md@vy` L25: "cross-session personal/emotional memory storage needs its OWN specific, unbundled consent; penalties to ₹250 Cr". | Vyakti: `meera_consent` (`016_memory_consent.sql@vy`): append-only, four columns, no content, `version`, client `at` plus server `filed_at`, **device-keyed**. ai2b: `member_work_parcha_consents` and `_events` (`…0036` L257-330), three non-ladder values, member-set-only literal, append-only history. `bol_donation_consents` (`…0038` L168-240): `purpose_text_version`, `language_of_consent in ('en','hi')`, pseudonymous HMAC `contributor_ref`. `evidence_submissions` (`…0020` L106-107): two timestamped consent acts. | The design is right. The "₹250 Cr" is the s.8(5) security cap. The s.9 cap is ₹200 Cr (dpdp-deep §7.9 [V]). Consent is to a *sentence*, so `purpose_text_version` plus language (ai2b 038) is the field Taxila's `consent.version` should mirror. | dpdp-deep Q12, Q13. |
| 9 | **Default when no answer exists** | s.9(1): consent is obtained *before* processing. | `src/engine/memory.ts@vy` L29: "Blocked when consent is explicitly **refused**". | `memory.ts@vy` L80: `let writesAllowed = true;`. Absent consent permits writes. | **Inverted for children** (the map already says "invert" in §2.18 row 1; this is the code line). | none (settled). |

**ai2bharat migrations 020, 025 and 036-041 (listed as unread; now read for consent and identity columns).**

| migration @ `ai2b@main` | lines | consent / identity content | for Taxila |
|---|---|---|---|
| `202608310020_evidence_review.sql` | 915 | `evidence_submissions.member_id → member_profiles(user_id) on delete cascade`. `consent_two_reviewers_at` and `consent_work_not_person_at timestamptz not null` (L106-107). `show_name_to_reviewers default false`. Status machine with `withdrawn` and `revoked`, checked by CHECKs (L131-142). Snapshots work so that a learning reset does not cascade it away (L13-17). | Consent as **named, timestamped acts on the record they govern** fits a parent approving a share of the child's work. No age column. |
| `202609010020_opportunity_publication.sql` | 405 | No learner data. Append-only `decided_by` named-actor ledger. | Pattern only. |
| `202609010025_evidence_founding_reviewers.sql` | 538 | Reviewer credentials with a named grantor, ≤6-month expiry and reasoned withdrawal (L1-45, L69-107). Not consent. | A pattern for teacher/reviewer grants. No identity change. |
| `202609130036_parcha_record.sql` | 467 | `member_work_parcha_consents` (`none` / `show-to-reviewers` / `licence-for-training-with-royalty`, deliberately **not a ladder**, `set_by='member'` literal) plus append-only `_consent_events`, readable by the member (L257-330). `agreement_written_by='reviewer-review'` only, so "no model score on a learner record" is enforced by CHECK (L41-58, L120-123). | Copy the non-ladder consent shape for P1-P5 purposes. Copy the writer-role literal for any score shown to a parent. |
| `202609130037_parcha_charge_sheet.sql` | 69 | `user_id` cascade, RLS with no policies. | none |
| `202609130038_bol_item_donation.sql` | 616 | A second, independent consent; "never before completion"; `purpose_text_version`, `language_of_consent`, `attribution default 'anonymous'`; `contributor_ref = 'c-'‖hmac(user_id, private salt)` (L45-55, L168-240). No age check anywhere (grep `age|minor|child`: none). | The template for **P4 research consent** under `psych-consent-assent-two-tier`. For a child the grantor must be the parent, with child assent recorded beside it. |
| `…0039`, `…0040`, `…0041` learning catalog | 221 / 236 / 239 | Only widen module-id CHECKs on `member_learning_profiles`, `member_learning_module_records` and `member_saathi_memory` (`…0039` L14-30, L149-152). **No identity, age or consent columns added.** | skip |

Across 020, 025 and 036-041 there is **no age, guardian, parent or child column**. Identity is always
`member_profiles.user_id` (an authenticated id, which follows the inherited law). ai2bharat's minor posture lives only
in the 18+ declaration.

---

## 2. What the repos built, against what Taxila needs

| obligation | Vyakti/Meera `@vy` | ai2bharat | Taxila today | gap |
|---|---|---|---|---|
| VPC before any processing (s.9(1), r.10) | none (adult-only by design) | none (18+ declaration) | `consent` rows with `checkbox_v1` | Build a `vpc_verification` table and an adapter (dpdp-deep §9 item 3-4). **Parent attestation of relationship**, stored. |
| No tracking or behavioural monitoring (s.9(3)) | none | no-affect DB CHECK + six-kind list (indirect) | decision only. `voice_feature` and `rel_state.trust` persist behaviour | Implement the `legal_mode` ratchet. Reconcile `voice-features-longitudinal` with NM-3 (§3). |
| Detrimental-effect design rule (s.9(2)) | `MINOR_HARD_GATES` (frozen) | no streaks / no rank columns (`…0036` comment, `…0038` L56-64) | conductor/no-streak rules | Default must be minor (map fact 1). |
| Consent evidence (s.6(10)) | append-only, no content, `version`, `at` + `filed_at` | per-purpose, non-ladder, versioned wording + language, member-readable history | `consent(version, method)` | Add `language_of_consent`, `purpose_text_version` semantics, client tap time; key by `child_id` + `guardian_id`. |
| Withdrawal as easy as grant | forget wipes consent rows too (`016` L67-82) | member-set either direction | `setConsent` grants both ways | Decide whether erasure keeps the ledger. Note Rule 8(3) one-year retention (dpdp-deep Q3) argues against Vyakti's "a full wipe takes the consent rows too". |

---

## 3. The conflict with owner goals 2 and 3 (flagged explicitly)

**This is a product-shaping risk whichever way counsel rules.** Compliance is deprioritised, but s.9(3) cannot be
cured by parental consent (s.9(1) and (3) are separate duties, and only s.9(4)/(5) disapply (3)) [V]. The penalty for
a s.9 breach is up to ₹200 Cr, and a s.17(3) startup exemption cannot reach s.9 (dpdp-deep §7.9 [V]).

**Goal 2: covert comprehension detection.** Detecting whether the child understood, without quizzing, means inferring
a mental state from the child's *behaviour* rather than from a keyed answer. Examples are hesitation, latency, hedges,
prosody, teach-back quality and the "pata nahi" pattern. Under dpdp-deep §5.1:
- **Within the turn or session, it is low risk on every reading.** Reacting to the answer just given is not
  monitoring. NM-4 allows unrestricted in-session adaptation.
- **Persisted across sessions, it is high risk under I1 and I3.** The object is "the child's behaviour", not
  curriculum content (dpdp-deep §5.2 rows "Affect-from-dialogue counters" and "Timing, latency, prosody … Never
  stored").
- **"Covert" adds a second exposure [U].** Monitoring the child is not told about is the central case the word
  "monitoring" describes. It also strains s.9(2) and the Rule 3 itemised-notice duty, because the parent must be told
  the data items and purposes. "Covert" can describe the child's experience (no test feel). It cannot describe the
  notice.
- **Concrete Taxila collision:** `voice_feature` and `voice_baseline` (`006_voice_features.sql`) store per-child
  `onsetMs`, `pauseCount`, `pauseFrac`, `f0MedianHz` and `speechRateWps` z-scored against a lifelong baseline.
  `GET /api/voice/trends` (`server/voice/features.js` L3) feeds parent growth lines. No consent purpose gates it.
  That is NM-3 verbatim, and NM-3 is adopted in `learner-legal-mode-ratchet`.

**Goal 3: learning-profile discovery.** "How this child learns best, refined every interaction" is dpdp-deep's
**format-efficacy** layer (Thompson sampling per format × topic). It rates **high under I3**, and dpdp-deep turns it
**off in M1** (§5.2; NM-10 P5 "shown as unavailable until M3"). Taxila writes `format_trial` rows behind the
`learning_profile` consent (`server/routes/lesson.js` L781-787). That is consent-gated, but consent is exactly what
does not cure s.9(3). The relationship layer (`rel_state.trust`, `stage`) is persisted unconditionally (L775-777).
dpdp-deep §5.2 says "Not persisted in M1".

**What survives on the safest reading (M1), and so what to build first** [U, derived from dpdp-deep §6]:
1. Goal 2 as a **session-scoped Director signal** whose only persisted output is a keyed academic fact: an item
   outcome, `misconception_id`, or "explained twice, then correct independently". Never a latency, prosody or "did
   not really understand" score.
2. Goal 3 as **parent-declared preferences plus content-outcome records**: "fractions with pizza: correct
   independently". Never a posterior over the child's learning style.
3. Voice features computed on-device and used live, then **discarded at lesson end** in consumer mode. Longitudinal
   trends only in M2 (school mode) or after an opinion. WCPM on read-aloud items is a curriculum outcome, so it is
   the one trend arguably safe to keep.
4. Full goals 2 and 3 persisted only in **M2 School Mode**, where Taxila is a Data Processor for a school under the
   Fourth Schedule A3 exemption, or in **M3** after a written opinion supports reading I2 or I3, or after a s.9(5)
   notification.
5. **M0** (stateless) stays buildable in one transaction, in case counsel adopts I1.

**New questions for counsel** (add to dpdp-deep §8):
- **G4-a (s.9(1) + Part B item 6).** May a parent-run trial lesson with no child audio or input happen before VPC?
- **G4-b (s.9(3), covert).** Is inferring comprehension from a child's non-answer behaviour (latency, hesitation,
  prosody, hedging) "behavioural monitoring" when it is (i) used only within the turn, (ii) reduced to a keyed
  curriculum outcome before storage, or (iii) stored as per-child z-scored baselines with parent-visible trends? Does
  telling the parent, but not the child, cure any notice or s.9(2) problem with a "covert" design?
- **G4-c (s.9(3), learning profile).** Is a persisted per-child estimate of which teaching format works best "tracking
  or behavioural monitoring" or academic record-keeping? Does the answer change if it is parent-set and parent-editable
  rather than inferred?
- **G4-d (Rule 8(3) × consent ledger).** May the consent ledger be erased on a full wipe, which is Vyakti's design
  (`016` L67-82), or must it be retained for a year as a "log of the processing"?

---

## 4. Corrections this gap makes

- INHERITANCE-MAP §2.18 "Build new" and §7: the DPDP readings are second-hand in the **source repos**, but Taxila's
  own `docs/research/safety/dpdp-deep.md` is first-hand (gazette text). Cite it. 2027-05-14 should read **13 May 2027**
  (r.1(4); 14 May is a minority computation).
- `safety-reg.md@vy` "no exceptions" is wrong (Fourth Schedule A3). Its Rule 10 "parent-child relationship" claim is
  wrong (adulthood only; relationship declared).
- `ai2bharat-core.md` L44 says "DigiLocker-based verification is the named method". Rule 10 makes DigiLocker
  optional ("may"). Its source, `05-technology.md@ai2b@main` L253, adds the "relationship" error. The source's Fourth
  Schedule point (L257-259) is correct and is the one repo reading to keep.
- The brief's description of `identity.md` and `india.md` as DPDP sources is wrong. They contain no DPDP s.9 content.

## 5. What I did not do

- I did not re-read the Act's commencement notification G.S.R. 843(E). dpdp-deep tags it [S] too.
- I did not verify a DigiLocker age-token API, and did not check the MeitY compression proposal's status after Aug 2026.
- I did not run any code. The Taxila findings come from reading `server/routes/{account,lesson}.js`,
  `server/voice/features.js` (head) and `db/migrations/{001,004,006}`.
- I read `PROPOSAL-*` only at their DPDP lines. I did not read the market-sweep sources behind the 14 May date.
