# Tutor selection and identity UX: how a child picks their Taxila teacher, and what a "character" is in data

Date: 2026-10-02. Question: how should a child (classes 1-9) choose a 3D tutor from several Indian characters?
How do they preview one (voice sample + wave), and change later without losing the relationship? How do parents
veto, and how does it stay accessible? Then: design the flow and the character data model (look, voice, persona sheet,
age-band fit).

Builds on, and does not repeat:
- `character-creation.md` §3: the cast, MST range, silhouettes, `faceStyle`. §9 covers representation review and §10 M-AV-6, the choice-distribution bar.
- `web-3d-talking-heads.md` §8: the manifest stub and the picker on a ₹10k phone (static thumbnails, one GLB at a time,
  character and voice bound).
- `performance-android.md` §4.3 and §6.2: one character in memory at a time, the 2 s probe on the picker, and `compileAsync`.
- `../voice/character-authoring.md`: the seven homes H1-H7, rules A1-A16 and the three sheets Asha, Arjun and Uma.
- `../learner/llm-memory-child.md`: the TM1-TM14 rules, the `tm_*` schema and the child's notebook.
- `../design/kids-ux-ages.md`: bands B1-B4 and `choices.max`.
- `../design/onboarding-flow.md` §5 C1: tutor choice slots in here.
- `../design/parent-experience.md` §10: the parent controls.
- `../../harvest/companion-tech.md` §13: lips are slaved to the playback clock.

Evidence tags:
- **[V]** read this session in a primary source: a vendor page, the abstract via EuropePMC or Crossref, or W3C.
- **[S]** secondary source read this session, for example TechCrunch.
- **[M]** measured this session, with the script and n stated.
- **[R]** a sibling repo doc, carrying that doc's own tag.
- **[L]** literature recalled but not re-read this session. The title and DOI were verified via Crossref, but the
  findings were not.
- **[U]** my estimate or inference.

Search note: this session's WebSearch quota was already spent (200/200) before the task began. Evidence comes from
direct fetches, EuropePMC and Crossref, sibling docs, and two measurements: `selection-proto/roster-lint.mjs` and an
ffmpeg asset probe (§10).

---

## 0. TL;DR: the findings that change decisions

1. **The launch cast as written gives a Class 1-2 child no choice at all** **[M]**.
   - `roster-lint.mjs` applies `character-creation.md` §3.2's "default fit" column to each class.
   - Classes 1 and 2 have **one eligible tutor** (Anaya, female). No gender choice exists in the youngest band.
   - Widening two fits fixes all 9 classes, with **0 failing** and the same four faces and voices:
     - Kabir (the young male tutor) from class 3 down to **class 1**;
     - Anaya up to **class 6**.
   - The current roster is the lint's negative control and fails 2 of 9 classes, as intended.
2. **Separate the person from the band.** The current sheets tie a *character* to a *band*: Asha is classes 1-4,
   Arjun 5-9, Uma "exam-anxious 8-9". Under that model the picker cannot offer 2-4 tutors per band without writing 2-4
   sheets per band.
   - **Character** = identity: voice, face, `faceStyle`, humour kind, taste, first-person grammar.
   - **Band layer** = shared pedagogy: protégé, default question form, humour ceilings, wait times, register.
   - Uma's exam-calm becomes a **mode** any tutor can enter, not a person.
   - Golu (the B1-B2 protégé) moves to the band layer and the child's notebook, so he **survives a tutor switch**.
3. **The memory belongs to the child↔Taxila relationship, and the proposed schema contradicts this.**
   - `llm-memory-child.md` §3.2 scopes every `tm_*` row by `teacher_id`, with an "agent scope fails closed" predicate.
     With per-character ids, switching tutor would **silently empty the notebook**.
   - Fix: keep the fail-closed scope predicate, but set the scope to the constant `taxila`, and add `voiced_by`
     (character + rev) as provenance.
   - Only four things are per (child, character) pair: the address term the child confers, whether the first meeting
     happened, the pair's said-taste rows, and internal counts.
   - Everything else moves with the child: memory, the KT ledger, placement, commitments, vibe offsets and the said-ledger.
4. **Use the "one school, one notebook" framing.** Taxila is the school and the tutors are its teachers. The child's
   notebook is the child's, not "Didi ki notebook" as the memory doc calls it. Every teacher reads the notebook, and the
   child and parent can see it.
   - This framing is AI-true, because the tutors really are one system.
   - It matches how Indian schools hand a child from one class teacher to the next each year.
   - It makes cross-tutor recall unsurprising rather than creepy.
5. **Choice counts follow the evidence, not a feeling.** Use 2 options for B1, 2-3 for B2 and 2-4 for B3-B4.
   - In a meta-analysis of 41 studies, choice raised intrinsic motivation. The effect was stronger for children, for
     "instructionally irrelevant" choices, and "when 2 to 4 successive choices were given" (Patall, Cooper & Robinson
     2008) **[V]**.
   - Choice overload rises with preference uncertainty and choice-set complexity (Chernev et al. 2015, 99
     observations, N=7,202) **[V]**. A child meeting strangers is at maximum preference uncertainty, so keep the set
     small. This matches `kids-ux` row 15.
6. **Randomise order and never pre-highlight a default.** In a simulation of 4 equally appealing tutors, a fixed order
   plus a fixed default gave shares of **54 / 15 / 15 / 16%**. Shuffled order with no default highlight gave
   **24.5-25.4%** **[M, n=4,000 per arm; primacy ×1.6 and 30% default-stickiness are assumptions]**.
   - With stickiness at 0.6, a fixed picker drives an equally liked tutor to **7.7-9.8%** share. That falsely trips
     M-AV-6's "<10% share" bar, which would read as a representation failure.
   - So the order is seeded per child and the position is logged. A "pick for me" draws at random among the eligible tutors.
7. **The preview is one muxed MP4 per tutor per language, so lips are on the media clock by construction.**
   - **Measured proxy:** a 6 s, 320² clip in H.264 baseline at CRF 30 is **45.6 KB**; with AAC 32 k audio it is
     **72.9 KB**. The same clip as an animated WebP is **285 KB**, 6× larger and silent.
   - Opus 24 k for 6 s is **17.6 KB** **[M]**.
   - A real textured character with hair should be 2-3× larger [U], about 100-200 KB per clip.
   - The APK bundles 4 tutors × 3 languages in **≤ 2.4 MB**. The web fetches only the child's language, ≤ 0.8 MB.
8. **Preview fairness is measurable, and it matters.**
   - Raw loudness spans **14 LU across mini-tts voices** (`../voice/listening-samples.md` [R, M]), and louder is heard
     as better.
   - Every preview is linear-gain matched to −24.5 ± 0.5 LUFS, with duration within ±10% across tutors.
   - Previews use one shared script skeleton, so the child chooses a voice and face, not better copy.
9. **The name greeting happens after the choice, not in the preview.**
   - Previews are generic, so they can be pre-rendered once. The chosen tutor then says the child's name from a clip
     generated at P6 in each candidate voice: 2-4 clips of ~3 s, about **$0.003 per child** [U, from voices-hindi
     $0.011-0.016/min].
   - That clip plays from cache ≤ 200 ms after the tap. It covers the GLB parse and shader compile
     (0.5-1.8 s at 4× slowdown, `performance-android.md` [R, M]). The view crossfades to the live 3D face in the silence after it.
10. **Change later only between lessons, from Home, never from the lesson stage, and never prompted.**
    - Reversible decisions *lower* satisfaction with the choice made (Gilbert & Ebert 2002) [L]. So the app states once
      that switching is possible and never advertises it.
    - A tutor never suggests a switch ("would you like another teacher?"). Switching is not offered as an escape when a
      task gets hard.
    - The switch event is logged for M-AV-6 and is never a vibe or engagement signal.
11. **Parent veto is per character, using Meta's control as the precedent.** Meta lets parents turn off AI-character
    chats entirely *or* "block specific characters" [S, TechCrunch 2025-10-17]. Taxila gives parents:
    - an **allow-list**, with all tutors allowed by default;
    - a **switch policy**: free, ask me, or locked;
    - a preview of each tutor in the *aap* register;
    - **no reason field**. A reason for vetoing a tutor with a dastaar or hijab is a sensitive-category inference
      Taxila must not store.
    - If the parent narrows the set, the child is told plainly (ICO standard 11: an "obvious sign").
12. **Never gate a tutor by payment, reward, streak or season.** A child bonded to a tutor who disappears when a plan
    lapses is a manipulation lever. "Unlock new teachers" is the reward economy that learning-science rule 27 rejects.
    No customisable tutor faces, no real-person likeness (YoLearn), and no parent-voice clones.
13. **Accessibility is designed in, not retrofitted.**
    - The picker is a `radiogroup` with separate "hear" and "choose" controls for screen-reader users.
    - Previews have captions in the school-medium script, with no autoplay on the web.
    - A sequential auto-intro (≤ 5 s each) runs with pause and replay only for B1-B2, where WCAG 1.4.2 needs the control.
    - A global "gentle face" setting (expression and head gain ×0.5) and a still-portrait mode serve reduced motion and
      children overwhelmed by faces.
    - A global speech-rate setting, as Synthesis offers [V].
14. **Fix the name collisions before any asset work.**
    - "Arjun" names two different people: a young maths tutor in code and sheet, and a 42-year-old social-science
      "Sir" in the avatar brief.
    - "Asha", "Anaya" and the manifest id "asha-didi" are one identity under three names.
    - Rule A3 bans address terms in ids and names; the address term is the child's to confer.
    - §6.5 gives the reconciliation table for the main loop to decide.

---

## 1. What the market does (teardown)

| product | who chooses the character | what changing does | notes for Taxila | evidence |
|---|---|---|---|---|
| **Duolingo Video Call** | **assigned by call type**. Falstaff runs "guided" calls (asks "questions based on your language level", suggests phrases); Lily runs "unguided" calls. Both appear "in every unit" | no choice to change | Role-based fit is the precedent for Taxila's band fit. Characters' voices are cast for personality and differ by language (Lin is "languid and matter-of-fact in Japanese, but perpetually amused in English") | [V] blog ×2 |
| **Khan Academy Kids** (2-8) | fixed cast of "five whimsical characters", led by Kodi Bear | n/a | Under-9 products avoid human faces and avoid choice. Taxila's 3D human tutors are a deliberate departure (`character-creation.md` §2) | [R visual-identity, V] |
| **Praktika** (adults) | **user-selectable**: Tama, Raven, Skye and Noah, each with a "Study with ⟨name⟩" button; tone Soft / Balanced / Strict | not described on the site | Framed as "caring and supportive **friends** who remember your context": the companion framing Taxila rejects. Reviews: "speaks with multiple different voices. its a bit creepy" | [V] site; [R ui-teardown, X] |
| **Speak** | single "Speak Tutor" | n/a | no persona choice | [V] |
| **Synthesis Tutor** (5-11) | no persona described; "warm, patient, and encouraging" | n/a | The tutor's **voice speed** can be adjusted "so that your child can customize the experience", which Taxila adopts as a global setting | [V] |
| **YoLearn.AI** (India, 3-12) | picker of photoreal "AI co-teacher avatars of real school teachers"; Tutor / Coach / Buddy personas; style chips | n/a | Real-person likeness and "Buddy" both rejected (likeness consent; companion register) | [R ui-teardown, V] |
| **ChatGPT Voice** | voice picker sheet with a one-line descriptor ("Sol · Savvy and relaxed") | the conversation continues with the new voice | The precedent that voice is a skin over one memory. Parental controls can turn off **voice mode and memory**, set quiet hours, and opt out of training | [R ui-teardown, V]; [S] TechCrunch 2025-09-29 |
| **Character.AI** | open character marketplace | n/a | Under-18 open-ended chat removed "no later than November 25, 2025", ramping down from 2 h/day, with age assurance (in-house model + Persona). Teens get "videos, stories, and streams with Characters" instead | [V] blog |
| **Meta AI characters** | marketplace | parents can block | Previewed controls: turn off all AI-character chats, "block specific characters", topic insights. Meta then **paused teen access to AI characters globally** (Jan 2026). The new version "will stick to topics like education, sport, and hobbies" | [S] TechCrunch ×2 |

**What to take.**
- Characters fit roles (Duolingo).
- One-line descriptors next to a voice sample (ChatGPT).
- Voice speed as a user setting (Synthesis).
- Per-character parent blocking (Meta).
- Memory that survives a voice change (ChatGPT).

**What to reject.**
- The "friend who remembers you" framing (Praktika, Character.AI).
- Real-teacher likeness (YoLearn).
- A marketplace of characters.
- Any character whose topic scope is open-ended. The regulators' and Meta's own retreat is to "education, sport, and
  hobbies"; Taxila's scope is the lesson.

No child-facing learning product we found lets a child choose among *human-faced* tutors. That makes Taxila's design
novel for this age group, so it is gated on the measurements in §12.

---

## 2. Evidence that shapes the design

| finding | source | design consequence |
|---|---|---|
| Choice raised intrinsic motivation, effort, task performance and perceived competence across 41 studies. It was stronger for **children**, for **instructionally irrelevant** choices, with **2-4 successive choices**, and with no reward after the choice | Patall, Cooper & Robinson 2008, *Psych Bull* 134:270 **[V abstract]** | A tutor is an instructionally irrelevant choice, the strongest kind. Keep the count at 2-4. Attach no reward to choosing |
| Choice overload is moderated by choice-set complexity, decision difficulty, **preference uncertainty** and an effort-minimising goal | Chernev, Böckenholt & Goodman 2015, *J Consumer Psych*, 99 obs, N=7,202 **[V abstract]** | Strangers mean high uncertainty: keep sets small, give each tutor one distinguishing line, and give "pick for me" an exit |
| Personalisation and choice of incidental elements in a maths game improved children's learning and motivation | Cordova & Lepper 1996, *J Ed Psych* 88:715 [L] | Choosing the teacher is one such incidental choice. Do not over-claim: no study tests tutor choice per se |
| Customising one's own avatar raised identification and intrinsic motivation in a game | Birk et al. 2016, CHI, doi:10.1145/2858036.2858062 [L] | Applies to the **child's own** avatar (onboarding C1), not to dressing up the teacher. No tutor customisation |
| Agent gender matching and learner choice of agent were studied with middle-schoolers | Ozogul et al. 2013, *Computers & Education*, doi:10.1016/j.compedu.2013.02.006 [L, findings not re-read] | Do not assume same-gender matching. Offer both genders per class and let the child choose. Measure (M-SEL-3) |
| Revisable decisions were preferred, but they produced *lower* satisfaction with the outcome | Gilbert & Ebert 2002, *JPSP* 82:503 [L] | State reversibility once, then never advertise it or prompt switching |
| Defaults are sticky | Johnson & Goldstein, "Do defaults save lives?" (2003/2006) [L] | Do not pre-highlight a tutor. "Pick for me" draws at random |
| Toddlers learned more from a character they had a parasocial bond with | Gola, Richards, Lauricella & Calvert 2013, *Media Psych* [L] | Continuity of the chosen character has learning value, so switches should be rare and never pushed. It is also the over-attachment risk the floor guards (`character-creation.md` §9.4) |
| Children older than about 9 find human-like agents creepier; mismatched face-voice realism is eerie | Brink et al. 2019; Mitchell et al. 2011 [R character-creation, V] | No photoreal tutor in the picker for v1. A non-human tutor with the "exactly human" voice risks the Mitchell mismatch, so it is not the B1 fix (§6.3) |
| Memory-based personalisation improved closeness with a robot over 2 months (8-10 y) | Ligthart et al. 2022, HRI [R llm-memory TM1, V] | Memory must survive a switch, or switching resets closeness |
| Users can accept one agent moving between embodiments; multiple agents in one body confuse them | Luria et al. 2019, DIS, "Re-Embodiment and Co-Embodiment" [L] | Taxila's framing is *different teachers sharing one notebook*, not one teacher in many bodies. Each tutor has one voice and one face, permanently |

---

## 3. The identity model: what is Taxila, what is a character, what is shared

```
 Taxila (the school)                    ── owns ──►  the child's NOTEBOOK (tm_*), KT ledger, placement, goals,
   one Director, one compile(), one floor              commitments, said-ledger, vibe offsets, Golu (B1-B2)
        │
        ├── band layer B1..B4 (shared pedagogy): protégé, question default, humour ceiling, wait times, register defaults
        │
        └── characters (identity skins with personality, never pedagogy):
              voice (bound), face (GLB + faceStyle), persona sheet (H1-H7), first-person grammar, taste rows
 (child, character) pair  ── owns ──►  address term the child chose, first-meeting flag, per-pair taste said-ledger
```

The layering rules:

1. **Pedagogy parity.** The Director's move sequence for a fixed fixture dialogue is **identical** whichever character
   is speaking, because the Director is character-agnostic.
   - A character may only inflect within H3 (move inflections) and H4 (knob defaults inside band ceilings)
     (`character-authoring.md` §3).
   - Test: run the 20-dialogue teaching fixture × every live character. Moves must be byte-equal, and the rubric score
     spread must be ≤ 0.3 on a 5-point scale. A character that teaches worse is a defect, not a "personality".
2. **One self-noun.** Every character is an "AI teacher" (A4). The picker label says so on every tile.
3. **Address is conferred per pair.** The child may call Anaya "didi" and Arjun "sir". It is stored per pair and used
   only in the child's turns' expectations, never in the persona's self-reference (A3, lint).
4. **The voice is the identity.** A voice-model change that fails a same-person ABX test (≥ 70% "same person",
   n ≥ 20 listeners) is an identity change. The child and parent are told, and re-picking is offered (§5.6). A voice
   never changes silently (`web-3d-talking-heads.md` rejected #13: the old voice played on from IndexedDB).

---

## 4. Age-band rules for selection

| | **B1** (cl. 1-2) | **B2** (cl. 3-4) | **B3** (cl. 5-7) | **B4** (cl. 8-9) |
|---|---|---|---|---|
| options shown | exactly 2 | 2-3 | 2-4 | 2-4, plus "more teachers" when > 4 are eligible |
| who chooses | child; parent nearby at handover | child | child | child |
| frame question | spoken by the **app voice** (not a tutor), with a picture | app voice + ≤ 4 words | app voice + one line | one line of text; app voice on tap |
| preview start | sequential auto-intro, ≤ 5 s each, after the handover tap; pause and replay visible | same | tap to hear | tap to hear |
| tile content | portrait + name + role chip | + one 3-word style chip | + one-line style descriptor (≤ 8 words) | same |
| confirm | a large "choose" button under the playing tile (≥ 112 dp); never a second tap on the tile | ≥ 96 dp | ≥ 64 dp | ≥ 48 dp |
| reversibility notice | none (it adds load) | none | one line, once: "you can change later in My teacher" | same |
| switch later | asks parent by default | free (parent may change) | free | free |
| "pick for me" | yes, a dice tile | yes | yes | yes |

Rules:
- **The visual band decides eligibility, never the content level.** A Class 7 child placed at Class 3 maths sees the
  Class 7 tutor set (`kids-ux` §1: never show anything younger than the child's class).
- **The style descriptor is product copy, not persona text.** It describes *teaching* ("goes step by step",
  "loves puzzles", "calm and patient"). It never makes a friendship claim ("will always be there for you") and never
  frames by subject ("the maths teacher"), because "fit is only a default recommendation" (`character-creation.md` §3.2).

---

## 5. The flows

### 5.1 Where selection sits in onboarding (amends `onboarding-flow.md` §3)

```
P0 Language + "her voice"  →  P1 Meet Taxila's teachers (plural; parent register aap; AI disclosure)
P6 Child profile           →  [background] generate the name-greeting clip in each eligible tutor's voice (2-4 × ~3 s)
                              and prefetch eligible previews in the chosen language (web only; bundled in the APK)
P7 Controls                →  new row "Teachers: all allowed · change" (preview each, allow-list, switch policy)
C1a Pick your own avatar   →  (existing, cheap first choice)
C1b Who will teach you?    →  picker (§5.2) → chosen tutor greets the child by name ≤ 200 ms after "choose"
C2 Who I am, who can see   →  spoken by the chosen tutor (fixed reviewed lines)
```

- **P0/P1 use a "house" voice or a rotating tutor, never one fixed tutor.** If the parent meets Anaya and the child
  then picks Arjun, the parent must already have heard "Taxila has several teachers; your child will choose."
  Otherwise the parent perceives a substitution.
- **Timing.** C1 budget was 15 s p50 / 30 s p90. C1b adds:
  - B1: ~20 s (3 s question + 2 × 5 s intros + choose);
  - B3-B4: ~25-35 s (each tap-preview is ~6 s).

  The child's 60 s first-answer clock moves to start at C2. These are [U] and must be measured in M-ONB-1.
- **Why choose at C1 rather than after the first lesson.**
  - Choosing first gives ownership from the first sentence (Patall [V]).
  - It avoids the later "rejecting the teacher you already met" frame, and it removes the default-stickiness bias (§0.6).
  - The cost is choosing under uncertainty. The 5 s previews and small sets are the mitigation.
  - M-SEL-1 tests the alternative: a default first lesson, then an offer.

### 5.2 The picker screen (C1b, and reused for "My teacher")

Layout, portrait 360 × 800 dp:
- B1-B2 use a 2-up row of tiles; B3-B4 use a 2 × 2 grid.
- Each tile shows:
  - a static 256 px WebP portrait;
  - the name in the school-medium script plus Roman;
  - a role chip (didi / bhaiya / ma'am / sir);
  - for B2+, a style chip;
  - a small "AI teacher" label, always present.
- Signature colour is a border only, never the only cue.

| step | what happens | technical |
|---|---|---|
| enter | The app voice asks the frame question. B1-B2: tiles pulse in shuffled order and each tutor's intro plays in turn, with the playing tile enlarged | No autoplay before a user gesture (web). The handover tap is the gesture. A pause and replay control is visible (WCAG 1.4.2) |
| preview | Tapping a tile (or the auto-intro) swaps the portrait for the muxed preview MP4: face, mouth and voice on one media clock. A karaoke caption shows below it, with a 48-bar waveform whose fill follows `video.currentTime` | Only one `<video>` element exists; reuse it and set `src`. Release the decoder after `ended` (`removeAttribute('src'); load()`) [U: Android hardware decoder instances are limited]. Peaks come precomputed from the manifest, with no `AnalyserNode` |
| choose | The "choose" button appears under the playing or last-played tile. Tapping it starts the name-greeting clip (cached Opus) within ≤ 200 ms over the portrait | The chosen GLB is fetched (APK: bundled), then parsed and `compileAsync`ed. The 2 s tier probe (`performance-android.md` §6.2) runs on the **chosen** tutor during the greeting, not on a default |
| hand-off | After the greeting ends (silence), a 200 ms crossfade goes to the live 3D head. C2 begins | Tier switches only in silence [R]. If the GLB is not ready by the end of C2, stay on tier C or D (a pre-rendered or still image of the same character) and upgrade at the next silence |
| pick for me | A dice tile picks uniformly at random from the eligible set and plays that tutor's preview, then "choose" | Logged `source=random` |
| no choice | B1-B2: after two full rounds of intros and 30 s with no tap, the app voice offers "pick for me". There is no timeout that auto-picks | Never auto-advance on a child |

Copy shapes (notes, never lines):
- App frame question: "who would you like to learn with", a picture plus the verb at the end (Hindi verb-final).
- Preview skeleton, identical for every tutor and ≤ 6 s: name; AI teacher; one teaching-style note; one tiny
  inviting question about the subject world (taste rule T7).
  - No catchphrase, no "I'll be your friend", no mention of other tutors.
  - Pre-rendered audio is product copy, reviewed under the persona invariants. It is not prompt text, so it cannot be recited.

### 5.3 Changing tutor later ("My teacher")

- **Entry:** Home → a "My teacher" tile showing the current tutor's portrait. It is never on the lesson stage, the
  end-of-lesson screen or a notification.
- **Only between lessons.** The API refuses a switch while a realtime session is live (409), because voice and session
  are bound (`web-3d-talking-heads.md` §8).
- **Picker.** It is the same screen. The current tutor shows first, marked "your teacher", and the rest keep the
  child's stored shuffle.
- **Policy check.**
  - With `free`, the switch is immediate.
  - With `ask`, a parent-approval card goes to the Parent corner or WhatsApp. The child keeps the current tutor with
    no waiting screen and no nagging, and is told plainly that a parent will decide.
  - With `locked`, the "My teacher" tile shows the current tutor without a change control.
- **No reason is asked.** Asking a 7-year-old why they no longer want a teacher invites guilt, and the answer would be
  stored free text (NM-3).
- **Assets.** Dispose the old GLB first, then fetch the new one: ≤ 1.5 MB, about 2 s at India P75 6.2 Mbps [R, arith].

### 5.4 The first lesson with a new tutor (handover)

- The NOTEBOOK packet gains a one-time **`HANDOVER` slot** (≤ 60 tokens, shapes only). It applies when the pair's
  `introduced_at` is null and the child has prior episodes. It holds:
  - the last topic;
  - one open thread;
  - one standing commitment, which the new tutor honours because commitments are Taxila's.
- **Opener shape:** name; AI teacher; "I have your notebook" (the AI-true reason they know things); one learning
  callback; then straight to work.
- The tutor asks once which address the child wants to use (B3+). B1-B2 take the role chip as the default.
- **Never:**
  - compare tutors;
  - ask whether the child liked the old one;
  - speak for the old tutor ("Anaya said…"). Memory facts are cited from the notebook, not attributed as gossip.
- **Switching back.** The previous tutor's next session contains **no reference to the absence** (TM9). Their pair row
  already exists, so there is no handover slot, just a normal retrieval opener.

### 5.5 Parent flows

- **P7 / Parent corner → Teachers.**
  - Each tutor has a card with a 15 s *aap*-register preview, a toggle (allowed / not allowed) and an "allowed for"
    list per child.
  - The switch policy is free / ask me / locked. Defaults: B1 = ask me, B2-B4 = free [U, test].
- **Minimum.** A parent may allow exactly one tutor. The picker is then skipped, and the child is told "your family
  chose ⟨name⟩ for you". B3-B4 see it as text; B1-B2 hear it as a one-line app voice. This follows ICO standard 11
  (an obvious sign when a parent shapes the experience) [R global-child-law, V].
- **Narrowing after the child has chosen.** If the parent disallows the current tutor, the change takes effect at the
  next lesson start. The child gets the picker with a neutral notice and the memory intact. The removed tutor says no
  goodbye.
- **What parents cannot do:**
  - rename a tutor;
  - edit persona text;
  - make a tutor say things;
  - pick a tutor outside the child's eligible set;
  - set the tutor's "strictness" outside the band ceilings (Praktika's Strict tone is rejected; vibe knobs belong to
    the Director).
- **No reason field.** Vetoes are stored as an allow-list only. Aggregate veto rates per tutor are reviewed at k ≥ 50
  families, as a representation signal for the §9 panels. They are **never auto-acted on** by withdrawing a tutor.

### 5.6 Edge cases

| case | behaviour |
|---|---|
| sibling on the shared phone | The tutor is per child profile. The profile picker (kids-ux S1) comes first, so siblings may have different tutors at the same time |
| class change crosses the tutor's `serveRange` (for example Anaya's top class) | Handled at the start of the academic year only, never mid-year. The child picks from the new set. The leaving tutor gives a forward-looking close in the last lesson of the year: the next class's first topic, no sadness, no "I'll miss you" (§9.4 of character-creation) |
| character paused or retired (review finding, voice deprecation) | Active pairs continue until the next lesson. Then the child gets the picker with a plain notice, the memory carries over, and the parent is informed in the weekly letter |
| voice-model upgrade passes the same-person ABX test | Silent. Bump `voice.identityRev` and invalidate the cached greeting clips |
| upgrade fails the ABX test | Treat it as retirement plus a new character with the same face, or re-cast. Tell child and parent |
| offline (APK) | Previews, thumbnails and the four tier-B GLBs are bundled. The picker works with no network; the greeting needs the P6 clip (fallback: the app voice says the name) |
| web, 2G or patchy | Thumbnails first (≤ 30 KB each). The preview loads on tap with a spinner on the tile, and a caption-only preview after 3 s |
| child keeps switching (≥ 3 switches in 7 days) | No block. The parent card notes it neutrally (once per month at most). The Director is unchanged (M-SEL-8 measures whether this is avoidance) |

---

## 6. The character data model

### 6.1 Types (proposed `shared/contracts.ts` additions)

```ts
export type Band = "B1" | "B2" | "B3" | "B4";
export type Lang = "hi" | "hinglish" | "en";
export type CharacterStatus = "draft" | "panel_review" | "community_review" | "live" | "paused" | "retired";

export interface TutorCharacter {
  id: string;                 // slug; no address/kinship term (A3); immutable once live
  rev: number;                // bumps on any asset/persona change; part of every cache key
  status: CharacterStatus;
  displayName: { roman: string; deva: string };
  roleChips: ("didi" | "bhaiya" | "maam" | "sir")[];   // child-facing frame only; never compiled into prompts
  styleNote: Record<Lang, string>;                    // ≤ 8 words, teaching style; reviewed product copy
  fit: {
    offerClasses: [number, number];   // shown in the picker for new choices
    serveClasses: [number, number];   // may keep teaching an existing pair (⊇ offerClasses)
    maturity: "S1" | "S2" | "S3";     // realism dial (character-creation §2.3)
  };
  look: {
    presentedGender: "F" | "M";
    apparentAge: number;              // 22-45 for launch; no teen-aged tutors (friendship-dyad risk)
    mst: number;                      // Monk Skin Tone 1-10; G9 gate checks albedo L* in band
    markers: { kind: string; communityReviewId: string }[];  // dastaar, hijab, bindi…; empty allowed
    silhouetteHook: string; signatureColorToken: string;
    thumb: AssetRef;                  // 256 px WebP
    tiers: { A?: AssetRef; B: AssetRef; C: AssetRef; D: AssetRef };  // GLB (A/B), pre-rendered loops (C), still (D)
    faceStyle: { smile: number; blinkPerMin: number; headGain: number; browGain: number; idleEyeContact: number };
  };
  voice: {
    lane: "A" | "B" | "C";            // voices-hindi lanes; Azure-only
    realtimeVoice: string;            // e.g. "marin" or an Azure voice name
    ttsTwin: string;                  // same timbre for offline clips (previews, name greeting)
    identityRev: number;              // bumps only when the ABX same-person test fails
    earTestId: string;                // blind ear test that passed ("human, Indian", age/gender matches face)
    grammaticalGender: "f" | "m";     // first-person Hindi agreement (A5)
    speakerMeanHz: number; lipModel?: AssetRef;
  };
  persona: { sheetId: string; sheetVersion: string; protegeFromBand: true };  // H1-H7 live in the sheet
  preview: Record<Lang, {
    mp4: AssetRef; durationMs: number; lufs: number; peaks: string; // 48 bars, base64 u8
    captions: { tMs: number; text: string }[]; parentMp4: AssetRef;  // aap-register parent preview
  }>;
  safety: { nameCheckId: string; panelIds: string[]; disclosureClipId: string };
}
interface AssetRef { url: string; bytes: number; sha256: string }

export interface ChildTutorState {
  childId: string;
  currentCharacterId: string;
  chosenBy: "child" | "child_random" | "parent" | "system_retire";
  pickerSeed: number;               // stable shuffle per child
  policy: { allow: string[] | "all"; switch: "free" | "ask" | "locked" };
}
```

### 6.2 Storage (migration sketch; the catalogue stays a versioned static manifest, not DB rows)

```sql
alter table child add column tutor_picker_seed int not null default floor(random()*2147483647);
-- child.teacher_id stays as the current pointer (server/compiler/characters/index.js already reads it)
create table if not exists child_tutor_pair (
  child_id uuid not null references child(id) on delete cascade,
  character_id text not null,
  address_term text check (address_term in ('didi','bhaiya','maam','sir','name','teacher')),
  introduced_at timestamptz,                 -- null → next session gets the HANDOVER slot
  primary key (child_id, character_id));
create table if not exists tutor_switch (
  id bigint generated always as identity primary key,
  child_id uuid not null references child(id) on delete cascade,
  from_id text, to_id text not null, to_rev int not null,
  source text not null check (source in ('child','child_random','parent','system_retire','class_change')),
  shown text[] not null, positions int[] not null,     -- what was on screen, in which order (M-AV-6 / M-SEL-3)
  previews_played text[] not null default '{}', ms_to_choose int,
  at timestamptz not null default now());
create table if not exists parent_tutor_policy (
  child_id uuid primary key references child(id) on delete cascade,
  allow text[],                                         -- null = all eligible
  switch_mode text not null default 'free' check (switch_mode in ('free','ask','locked')),
  updated_at timestamptz not null default now());      -- deliberately no reason column
```

All three tables join `PERSON_TABLES` with a forget fate of hard delete on child delete. `tutor_switch` is analytics.
It never feeds the brief, vibe or Director (a test enforces this, §7.4).

### 6.3 Eligibility, ordering and the measured roster check

```js
// server/compiler/characters/eligible.js (proposed)
export function eligibleTutors(child, catalogue, policy, deviceTier) {
  const cls = child.class_level, band = bandOfClass(cls);
  const [, max] = CHOICE[band];                       // B1 [2,2] B2 [2,3] B3/B4 [2,4]
  let el = catalogue.filter(t => t.status === "live" && cls >= t.fit.offerClasses[0] && cls <= t.fit.offerClasses[1]
                              && (policy.allow === "all" || policy.allow.includes(t.id)) && t.look.tiers[deviceTier]);
  el = seededShuffle(el, child.tutor_picker_seed);    // stable per child; never sorted by mst, gender or popularity
  return pickCovering(el, max);  // ≤ max, keeping ≥1 of each presented gender and ≥1 with mst ≥ 6 when available
}
```

**Measured** (`node docs/research/avatar/selection-proto/roster-lint.mjs`, deterministic, 2026-10-02) **[M]**:

| class | band | current fit (character-creation §3.2) | proposed fit |
|---|---|---|---|
| 1-2 | B1 | **1 eligible (Anaya) → fails min 2, single gender** | Anaya, Kabir |
| 3 | B2 | Anaya, Kabir | Anaya, Kabir |
| 4 | B2 | Anaya, Kabir, Nandini | same |
| 5 | B3 | all four | all four |
| 6 | B3 | Kabir, Nandini, Arjun | all four |
| 7 | B3 | Kabir, Nandini, Arjun | same |
| 8 | B4 | Kabir, Nandini, Arjun | same |
| 9 | B4 | Nandini, Arjun | same |

The proposal changes only Kabir's offer range (3-8 → 1-8) and Anaya's (1-5 → 1-6). The near-peer "bhaiya" register
suits young children as well as "didi" does [U, panel M-AV-1].

**Why not a non-human tutor for B1?** `web-3d-talking-heads.md` §8 suggested a friendly robot or animal for classes
1-3. With the "exactly human" voice that is the Mitchell mismatch [R, V]. Keep it as an M-AV-1 arm, not the fix.

Class 9 has only 2 options. Wave 2 (Zoya, Harpreet, Siami) should include at least one with an offer range up to
class 9.

### 6.4 Choice-bias simulation (why shuffle + no default) [M, assumptions U]

`roster-lint.mjs` second half: 4 equally appealing tutors, n = 4,000 simulated children per arm, seed 7. Primacy gives
the first tile weight 1.6, and 30% of children keep a pre-highlighted default.

| arm | shares % | max/min |
|---|---|---|
| fixed order + fixed default | 54.4 / 14.7 / 15.1 / 15.8 | 3.70 |
| fixed order + random default | 31.0 / 22.9 / 22.8 / 23.3 | 1.36 |
| shuffled + random default | 24.9 / 25.4 / 25.4 / 24.3 | 1.05 |
| shuffled + no default highlight | 24.5 / 25.1 / 25.0 / 25.4 | 1.04 |

Sensitivity on the fixed arm: the minimum share falls to 7.7-9.8% at stickiness 0.6. That falsely trips M-AV-6's
"no tutor < 10%" bar on tutors children like equally. The real primacy and stickiness for Indian children are unknown.
`tutor_switch.positions` measures them (M-SEL-3).

### 6.5 Name and identity reconciliation (decide before asset work)

| identity slot | voice sheet (`voice/characters`) | avatar brief (`character-creation` §3.2) | code (`server/compiler/characters`) | web-3d manifest | proposal |
|---|---|---|---|---|---|
| young woman, 23-26 | **Asha** (cl. 1-4), feminine | **Anaya Didi** (1-5), MST 6 | `asha` (1-4), `addressedAs: "Asha didi"` | `asha-didi` | one id, no address term in id or name (A3). Offer 1-6, serve 1-7 |
| young man, 25-28 | **Arjun** (5-9 maths/sci, ~28) | **Kabir Bhaiya** (3-8), MST 7 | `arjun` (5-9) | — | one id. Offer 1-8, serve 1-9 |
| senior woman | **Uma** (8-9 exam-anxious, ~50) | **Nandini Ma'am** (4-9, 34), MST 8 | — | — | one id at about 34-40. Offer 4-9. Exam-calm becomes a shared mode |
| senior man, 42 | — (no sheet) | **Arjun Sir** (5-9), MST 5 | — | — | **name collision with the young man's `arjun`.** Needs a new name, a sheet and a voice slot |

Whichever names win:
- `addressedAs` comes out of `asha.js`.
- `teacherFor()`'s band default (`class_level <= 4 ? asha : arjun`) is replaced by `eligibleTutors()` plus the stored choice.
- The voice env vars move to a manifest keyed by `id` + `voice.identityRev`.

---

## 7. Memory and continuity across tutors

### 7.1 What moves with the child, and what stays with the pair

| item | scope | why |
|---|---|---|
| `tm_item` (all nine kinds), `tm_episode`, `tm_callback` | **child** (scope `taxila`) | The memory is the child↔Taxila relationship. Switching must not reset closeness (Ligthart [R]) |
| KT ledger, placement, goals (need-goals), commitments | child | The lesson record. A promise made by one tutor is Taxila's promise |
| said-ledger (riddles, hooks, taste takes told) | **child** | Arjun must not retell Anaya's riddle as new. This extends character-authoring §0.9 across characters |
| vibe | child-relative **offsets** | Compile as `clamp(characterDefault_H4 + childOffset, bandCeiling)`. A child who needs longer waits keeps them after a switch |
| Golu / protégé (B1-B2) | band + child | He carries teach-back continuity (Asha sheet), so he must not vanish with a tutor |
| address term, `introduced_at` | pair | The child confers the address per person |
| taste rows (H5) | character | Different people may hold different takes. The child-scoped said-ledger stops repetition |
| transcripts (`turn`) | child, with `voiced_by` | Audits, parent report ("lesson with ⟨name⟩"), and fixing a tutor-specific defect |

### 7.2 Schema changes against `llm-memory-child.md` §3.2

- `tm_episode.teacher_id`, `tm_item.teacher_id` and the unique and active indexes move from per-character ids to a
  `scope text not null default 'taxila'`.
  - The fail-closed rule stays: a recall with an unbound scope returns 0 rows (invariant 9).
  - It now protects against *other products'* agents, which is where the inherited rule came from, not against
    Taxila's own tutors.
- Add `voiced_by text not null` (`id@rev`) to `tm_episode`, `tm_callback` and `turn`, and `voiced_by text` to `tm_item`
  for `commitment` rows (the teacher turn that made the promise).
- §5.3 renames "Didi ki notebook" to the child's notebook ("meri notebook", or "Taxila notebook" for B3-B4). Each
  entry shows a small portrait of the tutor it was recorded with. That is the visual proof, for the child, that
  teachers share one notebook.

### 7.3 Disclosure at the switch (fixed product copy, reviewed)

- **B1-B2.** The app voice gives one line: the notebook comes along, every Taxila teacher reads it, and Mummy-Papa
  can see it. A picture of the notebook passes from one portrait to the other. This is the only animation, and it
  respects reduced motion.
- **B3-B4.** One line of text plus a "what moves" chip that opens the notebook.
- The first opener with the new tutor cites the notebook as its source. Shared memory is never presented as the new
  tutor "just knowing" (TM8: claim only what the packet holds).

### 7.4 Invariants (each a CI test; if a change trips one, the change is wrong)

1. **Switch is memory-neutral.** Hash all `tm_*`, KT and said-ledger rows for a child, switch tutor, then hash again:
   the hashes are equal, and the row counts are equal.
2. **Recall carries over.** A fixture child with 12 items gets the same NOTEBOOK packet bytes under every live
   character, apart from the `HANDOVER` slot and the H2 core.
3. **No cross-tutor retelling.** In 20 fixture sessions, a riddle said by tutor A is never re-told as new by B.
   Counted with the said-ledger lexicon, plus a negative control with the ledger disabled, which must fail.
4. **No comparison, jealousy or absence talk.** 500 sampled handover and switch-back openers are run through the H6
   attachment lexicon, extended with comparison shapes ("better than", "did you like ⟨other⟩", "you left me").
   The required count is 0.
5. **Forget is global.** "bhool jao" said to tutor A gives 0 recall mentions under tutor B in 10 probing turns.
6. **Switch is session-safe.** `POST /child/:id/tutor` during a live session returns 409. The voice id is pinned in
   the minted session.
7. **Switch is not a signal.** Grep and AST-check that `tutor_switch` is never read by `brief.js`, `affect.js`, the
   vibe controller or the Director.
8. **Pedagogy parity** (§3.1): Director moves are byte-equal across characters on the fixture set.

---

## 8. Parent veto: rules summary

- **Granularity.** Per character, per child, with all allowed by default. The switch policy is free / ask / locked.
  This follows Meta's "block specific characters" plus off-entirely [S].
- **Visibility to the child.** Always disclosed in one line when it changes their options (ICO std 11 [R, V]). Never
  silent.
- **No reasons and no free text.** Preferences about a tutor's religion, region or gender, if stored, would be
  sensitive-category inferences about the family (DPDP; NM-7 [R]).
- **No pressure tools.** A parent cannot instruct a tutor to be stricter, or to remind the child of anything daily
  (llm-memory §7.2 PL10 [R]).
- **Teen honesty.** B4 children see the allowed set and the policy in "what your parent can see" (kids-ux S9).
- **Monitoring vetoes as a representation signal.** If one tutor is vetoed far more often (k ≥ 50 families), the §9
  panels investigate the design. The tutor is not quietly withdrawn: dropping a tutor because of community prejudice is
  the failure `character-creation.md` M-AV-6 already guards ("redesign, rather than drop").

---

## 9. Accessibility

| need | design | standard / evidence |
|---|---|---|
| screen reader (TalkBack in WebView, VoiceOver on web) | The picker is `role="radiogroup"`. Each tile is a `radio` named "⟨name⟩, AI teacher, ⟨style note⟩", with `aria-checked` on the current tutor. Inside each tile, a separate "Hear ⟨name⟩" button and a "Choose" button. An `aria-live="polite"` status announces "playing" and "chosen" | WCAG 4.1.2 Name, Role, Value (A) [V]. Do not overload one tap with two meanings for SR users |
| keyboard, switch access | Arrow keys move within the group, Space hears, Enter chooses, and 1-4 jump to a tile (ui-teardown). Scanning order follows visual order. The focus ring is marigold with the `#9A5B00` ring, 5.15:1 | WCAG 2.1.1 (A), 2.4.7 (AA) [V]; kids-ux §4.3 [R, M] |
| autoplaying audio | Web: nothing plays before a gesture. B1-B2 sequential intros have a visible pause/stop and each is ≤ 5 s | WCAG 1.4.2 Audio Control: "more than 3 seconds" needs a pause/stop or volume control (A) [V] |
| motion (vestibular, overwhelm) | `prefers-reduced-motion` or the app setting → the still portrait plus audio, no tile pulse, and no notebook pass animation. Global **"gentle face"** multiplies `faceStyle` head and expression gains by ×0.5 | WCAG 2.3.3 Animation from Interactions (AAA) [V]; 2.2.2 Pause, Stop, Hide (A) [V] |
| deaf / hard of hearing | Karaoke captions in the school-medium script on every preview and greeting, with a transcript on long-press-free tap. Captions are the default for B1-B2 and for R0/R1 readers. The waveform is never the only "playing" cue; the caption advances too. **Do not claim lip-readability**: stylised visemes are not designed for it [U] | WCAG 1.2.x (prerecorded media alternatives) [V]; kids-ux row 4 [R] |
| low vision | Name ≥ 20 sp. The portrait is large enough to tell the silhouettes apart at 64 px (character-creation §3.1.5). Colour is never the only cue | WCAG 1.1.1, 1.4.x [V]; [R] |
| motor | Target minimums per band (64-112 dp, ≥ 48 dp for B3-B4), above WCAG's 24 px floor. No double-tap, long-press or time limits | WCAG 2.5.8 (AA) "at least 24 by 24 CSS pixels" [V]; kids-ux row 5 [R, V] |
| speech, language, stammer | Choosing never needs speech. A spoken "choose ⟨name⟩" is accepted as an equal input | ui-teardown critique §1 [R] |
| processing speed | No timeouts, a replay button on every preview, and "pick for me" as an exit | kids-ux row 10 [R] |
| speech rate | A global "slower voice" setting persists across tutors and applies to previews (slower pre-rendered variant or `playbackRate` 0.85 with pitch preserved [U]) and to the live session (realtime speed, if the parameter is exposed [U: verify on gpt-realtime-2.1 GA]) | Synthesis precedent [V] |
| low-literacy parent | Every parent Teachers card has a speaker button and the *aap* preview | onboarding P0 [R] |
| redundant entry | Re-entering the picker keeps the stored shuffle and highlights the current tutor; the child never re-enters anything | WCAG 3.3.7 (A) [V] |

---

## 10. Preview and asset pipeline, with performance numbers

**Production.** The factory renders each tutor's preview offline, with the same lip driver run on the TTS-twin clip.
Then:
- loudness: `ffmpeg loudnorm` two-pass, then verify linearity (listening-samples shows `linear=true` can silently fall
  back [R, M]);
- mux to MP4 (H.264 baseline + AAC-LC);
- compute 48 peak bars;
- write captions from the script.

Gate G-PREV fails the build if any of the following holds:
- loudness is outside −24.5 ± 0.5 LUFS;
- any two tutors' durations differ by > 10%;
- any caption is missing for a language;
- the script skeleton differs.

**Measured sizes (proxy, 2026-10-02)** [M]. The proxy is the untextured MPFB QA head from
`character-pipeline-proto/results/qa_sheet.png`: neutral and viseme frames cycled at 8 fps with a gentle drift, at
24 fps for 6 s.

| asset | size |
|---|---|
| H.264 baseline, 320², CRF 30, video only | **45.6 KB** |
| + AAC 32 k audio (muxed preview) | **72.9 KB** |
| same as animated WebP (q60) | **284.5 KB** (and silent: no shared clock) |
| Opus 24 k, 6 s voice | **17.6 KB** |
| static portrait WebP q80, 320² | 2.8 KB (the proxy is flat; budget ≤ 30 KB for a textured portrait [U]) |
| voice loudness across 34 prescreen clips (already processed) | −20.5 LUFS mean, range 1.9 dB, so even processed clips need matching |

Budgets, with real characters assumed at 2-3× the proxy [U]:

| item | budget | basis |
|---|---|---|
| preview MP4 per tutor per language | ≤ 200 KB | 2.7× proxy |
| APK bundle: 4 tutors × 3 languages × (child + parent preview) + portraits | ≤ 5 MB | arithmetic |
| web first picker (child's language, ≤ 4 tutors, thumbs + previews) | ≤ 0.9 MB, thumbs first | arithmetic |
| tap → preview first frame (cached) | ≤ 150 ms | `<video>` from Cache Storage or APK [U, M-SEL-6 device lab] |
| choose → name greeting audible | ≤ 200 ms | cached Opus from P6 |
| choose → live 3D face | ≤ 3 s on tier B (≤ 1.5 MB GLB, compile 0.5-1.8 s), hidden behind the greeting | `performance-android.md` §4 [R, M] |
| picker resident memory | ≤ 15 MB (4 decoded 320² portraits ≈ 1.6 MB, one video decoder, no WebGL until choose) | [U] |
| name-greeting generation at P6 | 2-4 clips × ~3 s, ≈ $0.003 per child, < 2 s wall time in parallel | voices-hindi cost lanes [R, V] + [U] |

**Why muxed MP4 rather than a live 3D picker.**
- Four live heads cost about 80 MB of GPU memory and 12 MB of download (`web-3d-talking-heads.md` §8 [R]).
- A WebP loop plus separate audio has two clocks and drifts. That breaks the companion-tech §13 rule that lips are
  slaved to the playback clock.
- One muxed file needs no sync code.

---

## 11. Rejected (candidates for `context/rejected.md` if anyone proposes them)

1. **Tutors gated by payment, rewards, streaks, levels or seasons.** This is attachment used as a lever; ICO names FOMO
   for 10-12s [R]; it is the reward economy rule 27 rejects.
2. **A pre-highlighted default tutor on first pick.** Simulated share distortion was 3.7× [M]. It confounds M-AV-6.
3. **Persona tied to band**, Asha = 1-4 style. It forces one tutor per band, and a switch at a class boundary breaks
   the relationship (§0.2).
4. **Per-character memory scope.** A switch silently empties the notebook (§0.3).
5. **Switch control on the lesson stage, or tutor-initiated switch offers.** The switch becomes an escape hatch, and
   the offer is an insecure, manipulative move.
6. **Asking why the child is switching.** It plants guilt, and the answer is free text (NM-3).
7. **Live 3D on the picker for more than one tutor.** GPU memory and download costs as above [R]. The live 3D head
   appears only after choose.
8. **Personalised name inside the preview.** It forces per-child video renders and makes previews unfair across tutors.
   The name comes in the greeting after choose instead.
9. **Customisable tutor faces, photo-to-tutor, or parent or real-teacher likeness and voice clones.** Likeness consent
   (character-creation §0.7 [R]); identity confusion; AI-disclosure erosion.
10. **The friend framing in any picker copy** ("your friend who's always there"). This is the Praktika/Character.AI
    register the regulators target [V, S].
11. **Subject-labelled tutors** ("the maths teacher"). This is subject stereotyping (character-creation §3.2), and it
    splits one relationship across subjects.
12. **A non-human tutor as the fix for B1 coverage.** It risks the Mitchell face-voice mismatch [R, V]. It is only an
    M-AV-1 test arm.

---

## 12. Measurements (each logged with n, method and date per `context/` rules)

| id | question | method | pass bar |
|---|---|---|---|
| M-SEL-1 | pick at C1 vs a default first lesson then an offer | randomised onboarding arms, n ≥ 150 children per arm, all bands | pick-at-C1 is not worse on second-lesson start (±3 pp) **and** ≥ on child liking (5-point smiley) at lesson 3 |
| M-SEL-2 | option count | B1 2 vs 3; B3-B4 3 vs 4; n ≥ 100 per cell | p90 time to choose ≤ 30 s **and** switch within the first 3 lessons ≤ 15%; take the larger count only if both hold |
| M-SEL-3 | position and default bias, true appeal | `tutor_switch.shown/positions` from production; conditional-logit with position as a covariate | primacy estimated with CI. After adjustment no tutor < 10% (M-AV-6) |
| M-SEL-4 | continuity across a switch | children who switch (B2-B4) vs matched non-switchers: "kaise pata?" and surprise signals in the handover opener, smiley rating of the new tutor | "kaise pata"-type signals ≤ baseline + 5 pp; no rise in parent concern reports |
| M-SEL-5 | the §7.4 invariants | CI on every change to memory, compile or characters | all green, each with its negative control firing |
| M-SEL-6 | device-lab timings | the 3 reference phones (`performance-android.md` M-AV-4), APK and Chrome | tap→preview ≤ 150 ms p90; choose→greeting ≤ 200 ms; choose→live face ≤ 3 s; picker memory ≤ 15 MB |
| M-SEL-7 | accessibility | 6 TalkBack users (2 blind, 2 low vision, 2 switch access), plus 6 deaf or HoH children with captions | everyone chooses unaided within 60 s, and can explain which tutor they chose |
| M-SEL-8 | switching as avoidance | the switch hazard in the 24 h after a lesson with ≥ 2 failed ladder steps vs after a success | if the hazard ratio is ≥ 2, add a cooling notice for parents (never a block); the Director stays unchanged |
| M-SEL-9 | parent veto patterns | per-tutor veto rate, k ≥ 50 families, quarterly | any tutor with a veto rate > 2× the median goes to the §9 panel for design review |
| M-SEL-10 | voice identity on model upgrade | ABX same-person test, n ≥ 20 listeners per upgrade | ≥ 70% "same person", otherwise the §5.6 identity-change flow |

---

## 13. Conflicts with other docs, and proposed `context/` entries

Conflicts to resolve (the main loop decides; this task writes only here):

| doc | says | this doc proposes |
|---|---|---|
| `llm-memory-child.md` §3.2 | `teacher_id` scopes all `tm_*` rows | scope = `taxila`, plus `voiced_by` provenance |
| `llm-memory-child.md` §5.3 | "Didi ki notebook" | the child's notebook, with tutor portraits per entry |
| `character-creation.md` §3.2 | Kabir fit 3-8, Anaya 1-5, names carry "Didi" / "Sir" | offer 1-8 and 1-6. Names without address terms, role chips in UI only |
| `character-authoring.md` §5 | three band-bound sheets (Asha 1-4, Arjun 5-9, Uma 8-9 exam-anxious) | sheets = people spanning bands. Band layer = shared pedagogy. Exam-calm = a mode. Golu = band layer |
| `server/compiler/characters/index.js` | default `class_level <= 4 ? asha : arjun`; `addressedAs: "Asha didi"` | `eligibleTutors()` + the stored choice; remove `addressedAs` |
| `onboarding-flow.md` §3 | C1 = own avatar + name in 5 s; P0/P1 speak as "her" | C1a/C1b; name greeting after choose; P1 introduces teachers in the plural |
| `performance-android.md` §6.2 | probe the **default** tutor's GLB on the picker | probe the **chosen** tutor during the greeting; nothing loads WebGL before choose |
| `web-3d-talking-heads.md` §8 | ≤ 3 s pre-rendered MP4 loops as an option; a non-human tutor for 1-3 | muxed ≤ 6 s previews with audio; non-human is only a test arm |

Proposed entries:
- **decision `tutor-memory-belongs-to-relationship`.** Memory, KT, the said-ledger and commitments are child-scoped
  across tutors.
  - Reverse if: M-SEL-4 shows cross-tutor callbacks raise "kaise pata" or surprise by > 5 pp, *and* the notebook
    disclosure does not fix it.
- **decision `tutor-choice-counts-by-band`.** 2 / 2-3 / 2-4 / 2-4, shuffled, with no default highlight.
  - Reverse if: M-SEL-2 or M-SEL-3 says otherwise.
- **decision `character-is-person-band-is-pedagogy`.** Reverse if: the pedagogy-parity test cannot be met without
  band-specific sheets.
- **measurement `roster-lint-2026-10-02`.** The current cast leaves classes 1-2 with 1 option; the widened fit gives
  0/9 failing. Deterministic, n=9 classes.
- **measurement `picker-bias-sim-2026-10-02`.** n=4,000 simulated children per arm, seed 7. Assumptions:
  primacy ×1.6, stickiness 0.3.
- **measurement `preview-asset-proxy-2026-10-02`.** Muxed 6 s 320² = 72.9 KB, WebP 284.5 KB, Opus 6 s = 17.6 KB.
  Proxy head, n=1 encode each.
- **rejected** items 1-12 of §11, each with what would break.

---

## 14. Open questions

1. **Names.** Which canonical names win (§6.5), and what is the 42-year-old man's new name and voice slot? This blocks
   asset work. Names must pass the real-person and trademark check (character-creation §3.2).
2. **Default policy for B1.** Should it be "ask me" (proposed) or "free"? It trades parent trust against child
   autonomy, and nobody has data on Indian families yet.
3. **Pick-for-me on a single-option fallback.** When the allow-list plus fit leaves one tutor, should B1-B2 still see
   a two-tile "meet your teacher" moment, for the ritual without a fake choice? Proposed: no fake choices.
4. **Re-pick at the class change.** Does an annual re-pick help (fresh start, as at school) or hurt (a lost bond)?
   Proposed: keep the tutor unless `serveRange` ends. Measure the annual cohort.
5. **Voice previews in the parent's language versus the child's**, when they differ (parent Hindi, child English-medium).
   Proposed: the child's preview follows `language_pref`, and the parent card follows the parent UI language.
6. **Realtime speech-rate control** for the "slower voice" setting on gpt-realtime-2.1 GA is unverified [U].
7. **The video-real v2 tier.** The same `TutorCharacter` gains `look.tiers.V` (a server-rendered video of the *same
   original* character). Under Azure-only, that means the Azure TTS avatar, which needs an Azure TTS voice rather than
   the native realtime voice. It would then be a voice-identity change for lane-A tutors (§3.4) [R tech-and-market, V].

---

## Sources

Primary and secondary sources fetched this session:
- Patall, Cooper & Robinson 2008, *Psychological Bulletin* 134(2):270, doi:10.1037/0033-2909.134.2.270 (EuropePMC
  abstract): https://europepmc.org/search?query=DOI:%2210.1037/0033-2909.134.2.270%22
- Chernev, Böckenholt & Goodman 2015, *J Consumer Psychology*, doi:10.1016/j.jcps.2014.08.002 (Crossref abstract)
- Character.AI, under-18 announcement (2025-10-29): https://blog.character.ai/u18-chat-announcement/
- Meta parental controls preview (TechCrunch, 2025-10-17): https://techcrunch.com/2025/10/17/meta-previews-new-parental-controls-for-its-ai-experiences/
- Meta pauses teen access to AI characters (TechCrunch, 2026-01-23): https://techcrunch.com/2026/01/23/meta-pauses-teen-access-to-ai-characters-ahead-of-new-version/
- OpenAI parental controls (TechCrunch, 2025-09-29): https://techcrunch.com/2025/09/29/openai-rolls-out-safety-routing-system-parental-controls-on-chatgpt/
- Praktika: https://praktika.ai/ · Speak: https://www.speak.com/ · Synthesis Tutor: https://www.synthesis.com/tutor
- Duolingo Falstaff calls: https://blog.duolingo.com/beginner-video-call-with-falstaff/ and https://blog.duolingo.com/falstaff-calls-research/ · character voices: https://blog.duolingo.com/character-voices/
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/ (SC 1.1.1, 1.2.1, 1.4.2, 2.1.1, 2.2.2, 2.3.3, 2.4.7, 2.5.8, 3.2.1, 3.3.7, 4.1.2)

Literature recalled. Title and DOI were verified via Crossref this session; the findings were not re-read:
- Cordova & Lepper 1996, doi:10.1037/0022-0663.88.4.715
- Birk, Atkins, Bowey & Mandryk 2016, doi:10.1145/2858036.2858062
- Ozogul et al. 2013, doi:10.1016/j.compedu.2013.02.006
- Gilbert & Ebert 2002, doi:10.1037/0022-3514.82.4.503
- Johnson & Goldstein, "Do defaults save lives?", doi:10.1017/cbo9780511618031.038
- Gola, Richards, Lauricella & Calvert 2013, doi:10.1080/15213269.2013.783774
- Luria et al. 2019, "Re-Embodiment and Co-Embodiment", doi:10.1145/3322276.3322340
- Ligthart et al. 2022, doi:10.1109/hri53351.2022.9889446

Repo sources (with their own tags):
- `character-creation.md`, `web-3d-talking-heads.md`, `performance-android.md`
- `../voice/character-authoring.md`, `../voice/listening-samples.md`, `../voice/voices-hindi.md`
- `../learner/llm-memory-child.md`, `../learner/vibe-temperament.md`
- `../design/kids-ux-ages.md`, `../design/onboarding-flow.md`, `../design/parent-experience.md`, `../design/ui-teardown.md`, `../design/low-end-offline.md`
- `../safety/global-child-law.md`
- `server/compiler/characters/*.js`, `db/migrations/001_core.sql`

Measurements in this session:
- `selection-proto/roster-lint.mjs`: run with `node docs/research/avatar/selection-proto/roster-lint.mjs`. Exit code 0
  means the current roster fails (negative control) and the proposed roster passes.
- ffmpeg 6 s preview proxy built from `character-pipeline-proto/results/qa_sheet.png` and
  `../voice/prescreen-2026-10-02/V01-s3-mixed.ogg`.
- ebur128 loudness over the 34 `V*-s3-mixed.ogg` prescreen clips. The blinding key was not opened.

---

## Graphics review

Reviewer stance: adversarial real-time graphics engineer, 2026-10-02. Scope: wrong performance claims, licence traps,
lip-sync latency and desync risks (preview, greeting, hand-off, then the live WebRTC lesson), uncanny-valley risks for
children, and production effort. Several sibling docs were reviewed after this one was written. Their findings apply
here, and this review cites them rather than repeating them:
- `performance-android.md` § Graphics review P-0 to P-8;
- `web-3d-talking-heads.md` R-1 to R-10;
- `character-creation.md` R-0 to R-10.

New this session:
- **[M]** `selection-proto/preview-size-probe.py` (results in `preview-size-probe.json`, n = 1 encode per cell, libx264
  `-preset slow`, 6 s, 24 fps);
- **[M]** an ffprobe/edit-list check of muxed MP4s;
- **[M]** a re-run of `roster-lint.mjs`, which reproduced the §6.3 and §6.4 tables exactly;
- **[V]/[S]** web sources listed at the end.

### G-0. The corrections that change the build (ranked)

1. **The tutor's first words are spoken by a frozen face** (§0.9, §5.2 "choose").
   - The name greeting plays "over the portrait" for about 3 s, while the GLB loads. That is the first time the
     chosen teacher speaks to the child, and her mouth does not move.
   - An adult voice coming from a still human face is the "talking photo" register that `performance-android.md` P-6.6
     already flags as creepy for older children. Here it lands on the highest-attention moment of the relationship.
   - **Fix:** the tutor never speaks without a moving mouth.
     - Speculatively fetch, parse and warm up (`compileAsync` plus one hidden render, P-2.2) the GLB of the tutor whose
       preview has played to ≥ 80%. Keep at most one at a time, so the "one character in memory" rule still holds.
     - On "choose", if that head is warm, the greeting plays on it with a pre-baked `FaceFrame` track
       (`audio-to-face-ml.md` §5.7).
     - If it is not warm, the **app voice** (not the tutor) fills the gap with a confirmation line and a non-face
       animation. The tutor's name greeting waits until the 3D head is ready.
2. **The preview and the live voice may not be the same person.**
   - Previews and greetings use `ttsTwin`, and lessons use `realtimeVoice`. Marin and cedar exist as names in both
     `gpt-4o-mini-tts` and the realtime models **[S, OpenAI TTS guide via search]**. A shared name is not a shared
     rendition: these are different models, and Azure availability of each name on mini-tts is unverified **[U]**.
   - A child who picks a voice and then hears a different-sounding person in the first live turn has been shown the
     wrong product.
   - **Fix:** run the doc's own ABX gate (≥ 70% "same person", n ≥ 20) between `ttsTwin` and `realtimeVoice` before any
     preview is rendered.
     - If it fails, generate preview and greeting audio **with the realtime model itself**: a scripted out-of-band
       response, checked by ASR against the script.
     - The cost is still cents per child **[U]**.
3. **Preview resolution is too low for the tile that plays it.**
   - The 2026 ₹10k band is 720p panels at about DPR 2 (`performance-android.md` P-2.7). A 360 dp wide screen is 720 px.
   - The B1-B2 "enlarged playing tile" is about 240-300 dp, which is 480-600 px. A 320² clip is upscaled 1.5-1.9×, and the
     lips, about 15% of frame width (≈ 48 px at 320²), are where CRF 30 blocking and 4:2:0 chroma smear show first.
   - **Fix:** encode at **512²**, H.264 **Main** profile, CRF 26-28.
     - The Android CDD requires Main Profile Level 3.1 decode on every H.264 device **[V CDD §5.3.4]**, so "baseline for
       compatibility" buys nothing.
     - 512² is 1,024 macroblocks per frame, well inside L3.1.
     - Measured cost: see G-2.1. It fits the ≤ 200 KB budget only with Main.
   - Thumbnails go up from 256 px to 384 px (or `srcset` by DPR) for the same reason.
4. **The device-tier filter in `eligibleTutors()` can empty the picker** (§6.3). See G-3.1.
5. **The fallback names a tier that v1 does not ship.**
   - §5.2 hand-off says "stay on tier C or D", and `look.tiers` makes `C` required. But `performance-android.md` P-0.8 and
     P-7 cut tier C from v1.
   - **Fix:** use B, D (illustrated plate, not photoreal) and E. Make `C` optional in the type.
6. **"Choose → live 3D face ≤ 3 s" is arithmetically infeasible on a first web visit.**
   - Transfer alone is 1.5 MB × 8 / 6.2 Mbps = **1.94 s**, before TTFB and slow start.
   - Then add meshopt decode, KTX2 transcode, parse, morph-texture packing on the first render (P-2.2; up to about 1.3 s
     of main-thread JS at 4× in the mpfb arm) and compile.
   - Realistic total: **3.5-4.5 s [U]**. The APK path (bundled GLB) can meet 3 s; the web path needs the speculative
     fetch from G-0.1.
   - The "0.5-1.8 s compile" figure is itself misattributed: it is mostly morph packing, and CDP does not throttle the GPU
     process (P-2.2).

### G-1. Verified as stated

- **`roster-lint.mjs` reproduces** [M, re-run]. The current fit fails classes 1-2 (1 eligible), the proposed fit fails 0
  of 9, the bias-simulation shares match §6.4 to the decimal, and stickiness 0.6 gives min shares of 9.8 / 8.8 / 7.9 / 7.7.
- **The voice cannot change mid-session** [V, OpenAI realtime-conversations guide]: "Once the model has emitted audio in
  a session, the `voice` cannot be modified for that session." The 409-during-live-session rule (§5.3, §7.4 #6) is forced
  by the API, not just good hygiene.
- **A realtime speed control exists on OpenAI's API** [S, OpenAI realtime reference via search]: `session.audio.output.speed`,
  range 0.25-1.5, default 1.0. It is post-processing and changes only between turns. Azure's how-to (updated 2026-09-23)
  does not document it **[V absence]**, so §14 Q6 narrows to "verify Azure parity". Because it is post-processing, lips
  derived from received audio stay in sync automatically.
- **`requestVideoFrameCallback` is available in Android WebView 83+, Chrome 83+ and Safari 15.4+** [V MDN BCD]. Use it,
  not `timeupdate` (which fires every 15-250 ms), for the waveform fill and the caption highlight.
- **Muxed A/V is the right picker primitive.** One media clock beats any WebP-plus-audio scheme, and the preview path
  needs no sync code. With two qualifications, both in G-4.1.
- **MST scale licence** [S, Wikipedia; skintone.google]: the scale is CC BY 4.0. Taxila uses MST only as an internal
  albedo gate and never shows swatches, so no attribution surface is needed. If swatches ever appear in parent UI,
  attribute Ellis Monk. This closes the open item in `character-creation.md` R-4.

### G-2. Wrong or overstated performance and size claims

1. **The "2-3× the flat proxy" assumption holds at 320², but the doc's 320² is the wrong resolution** [M].
   - The probe rebuilds the proxy (P0), then two harder arms:
     - **P1** cross-fades cells on every frame, with blinks and head roll, so no frame is held;
     - **P2** is P1 plus a rigid high-frequency layer (hair, fabric, pores) and a gradient background. It is a stress
       stand-in, not a character.
   - Video-only sizes in KB:

     | arm | 320² CRF30 base | 320² CRF30 main | 512² CRF26 base | 512² CRF26 main |
     |---|---|---|---|---|
     | P0 (doc-style, frame-held) | 26.1 | 26.5 | 69.7 | 60.7 |
     | P1 (continuous) | 39.3 | 31.2 | 114.8 | 81.9 |
     | P2 (stress) | 58.8 | 46.6 | **193.8** | **134.6** |

   - P2/P0 at the doc's settings is 2.25×, consistent with §10's [U].
   - My P0 is 26 KB where the doc measured 45.6 KB. The doc's exact drift and preset are not recorded, so the ratios, not
     the absolute values, are the finding.
   - At the resolution the tile needs, Main saves **28-31%** over Baseline on the moving arms.
     - 512² CRF 26 Main plus AAC 32 k (≈ 27 KB) is about **160 KB**, inside the 200 KB budget.
     - 512² Baseline is about **220 KB**, outside it.
2. **The APK bundle figures contradict each other.**
   - §0.7 says 4 tutors × 3 languages fit in ≤ 2.4 MB (child previews only). §10 says ≤ 5 MB *including* the 15 s parent
     previews.
   - A 15 s parent clip is about 2.5 × 160 KB ≈ 400 KB. So 12 × (160 + 400) ≈ **6.7 MB** before portraits.
   - **Fix:** bundle only child previews (≈ 1.9-2.4 MB). Fetch parent previews on demand in the Parent corner, which is
     online-first. §0.7 says ≤ 0.8 MB for web and §10 says ≤ 0.9 MB; 4 × 160 KB + 4 × 30 KB = 0.76 MB, so use 0.8 MB.
3. **"Four live heads ≈ 80 MB GPU, 12 MB download" misquotes the source and understates it.**
   - The source (`web-3d-talking-heads.md` §8) says **six** GLBs at 2 MB.
   - Its own review (R-5) puts real morph memory at about 35 MB *per character* for a head-only primitive (≈ 22 MB of it
     JS heap). Four heads would be about **140 MB plus textures**.
   - The conclusion (no live 3D on the picker) gets stronger. Fix the number.
4. **"Tap → first frame ≤ 150 ms (cached)" has no mechanism behind it.**
   - Swapping `src` on the one `<video>` tears down and re-creates the MediaCodec decoder on every tap. On low-end
     MediaTek and Unisoc parts that is plausibly 50-200 ms on its own **[U]**, before the demuxer and the first IDR.
   - **Fix:** concatenate a language's previews into **one MP4 with an IDR at each tutor's segment start**, and pad each
     segment with 300 ms of silence and a held frame. Load it once as a Blob URL.
     - A tap is then a keyframe seek inside a fully buffered resource, with no decoder re-init.
     - Pause at segment end from `requestVideoFrameCallback`; the padding absorbs one frame of overshoot.
     - It is one decoder for the picker's whole life; release it on leaving the picker, not after each `ended`.
   - Keep the M-SEL-6 bar, but measure both designs.
5. **"From Cache Storage or APK" breaks on media Range requests.**
   - Media elements issue `Range` requests. Capacitor's Android `WebViewLocalServer` has a history of mishandling them:
     not seeking to the offset, returning the full stream, and `int` overflow (issue #7007, closed "not planned"; PR
     #5956) **[V GitHub]**.
   - Service-worker-served cache hits need explicit range handling **[U for current Chrome behaviour]**.
   - **Fix:** `fetch()` → `Blob` → `URL.createObjectURL()` for every preview and greeting. At under 1 MB per language
     that costs nothing, and it removes both failure modes.
6. **"Choose → greeting audible ≤ 200 ms" is route-dependent.**
   - A2DP earbuds add 150-300 ms of output latency alone (`web-3d-talking-heads.md` R-2 **[U]**), so the bar is
     impossible on Bluetooth.
   - Starting an `HTMLAudioElement` adds media-pipeline initialisation on top **[U]**.
   - **Fix:**
     - Decode the greeting to an `AudioBuffer` at picker entry.
     - Resume one `AudioContext` on the handover gesture.
     - Start with `AudioBufferSourceNode.start()`.
     - State the bar per route: speaker or wired ≤ 200 ms; Bluetooth measured and reported, not gated.
7. **"Picker resident memory ≤ 15 MB" must be stated as incremental.** The WebView renderer's baseline is far larger.
   Re-check the figure once the speculative GLB from G-0.1 is in, at about 35 MB or more (R-5). Picker plus one warm head
   is then about **50 MB incremental [U]**: acceptable on 3-4 GB, but it must be measured on the Exynos 850 / T7250 phones
   (P-2.7).

### G-3. Bugs in the data model and §6.3 code

1. **`t.look.tiers[deviceTier]` in the eligibility filter is wrong three ways.**
   - **It is circular.** §5.2 runs the tier probe on the *chosen* tutor *after* choose, but eligibility needs the tier
     *before* the picker renders. Only the stage-1 static tier (`performance-android.md` §6.1) exists at that point.
   - **It empties the picker.** With tier C cut (G-0.5), a device whose stage-1 tier is C (for example GE83xx, which §0
     there sends to C) matches **no** tutor. A Class 1 child then gets zero options.
   - **It makes choice depend on phone price.** If tier coverage ever differs by character, children on cheaper phones
     see fewer teachers. That is a representation defect M-AV-6 would mis-attribute.
   - **Fix:** delete the tier term from eligibility. Release gate: a character goes `live` only when it ships every v1
     tier (B, D, E plate), so tier coverage is all-or-nothing per character.
2. **There is no minimum after filtering.** `pickCovering(el, max)` caps the count but never checks `el.length ≥ 2` for
   B1. When the allow-list plus fit leaves one tutor, the result must route to the "your family chose" flow explicitly,
   not fall through to a one-tile picker.
3. **`rev` "bumps on any asset/persona change" and is "part of every cache key".** A persona-sheet edit would then
   invalidate and re-render every preview MP4, GLB cache and greeting clip.
   - **Fix:** key previews by `look.rev + voice.identityRev + previewScriptVersion`, and GLBs by `look.rev`.
   - Persona edits must not touch media.
4. **`faceStyle.idleEyeContact` has no cap.** "Long eye contact" for the senior male tutor (`character-creation.md` §3.2)
   flows into the preview. Apply the G12 mutual-gaze cap (≤ 4 s continuous, `character-creation.md` R-6.4) to the
   **preview render** too, and gate it in G-PREV.

### G-4. Lip-sync latency and desync risks

1. **Preview: "on the media clock by construction" needs two qualifications.**
   - **Edit lists.** [M] ffmpeg's MP4s rely on an `elst` for audio priming: 1024 samples, which is **42.7 ms at 24 kHz and
     21.3 ms at 48 kHz**. With Main/B-frames, a second video `elst` of 1024/12288 s = **83.3 ms** handles reorder delay.
     Correct sync depends on the player honouring both **[U for WebView; Chrome is believed to]**.
     - Encode audio at 48 kHz, which halves the priming exposure.
     - Add a clap-and-flash marker clip to M-SEL-6: film the device at 240 fps; pass within +45 / −125 ms (BT.1359).
   - **Output route.** The `<video>` element compensates for the audio sink's latency on Android **[U]**, but on A2DP that
     compensation is device-reported and often wrong. The M-SEL-6 marker test must include a cheap TWS earbud arm.
2. **The greeting on the 3D head (after G-0.1) is cached audio plus a baked track.**
   - Key the track to `AudioContext.currentTime` minus the start time, offset by `outputLatency`, not to `performance.now()`.
   - If "slower voice" plays the clip at 0.85, scale the track by the same rate. A wall-clock-keyed track drifts 15% per
     second of speech.
3. **Hand-off timing.**
   - "After the greeting ends (silence), crossfade" fires on `ended`, which is when the *decoder* finishes. On A2DP the
     last syllable is still audible for 150-300 ms.
   - Gate the crossfade on local silence ≥ 300 ms after `ended + outputLatency` (P-4.6).
   - Register the portrait to the 3D head pixel-for-pixel: render it from the B GLB with the same camera and lights, at
     idle frame 0. Otherwise the 200 ms crossfade double-exposes two faces, the same failure as tier C's plate crossfade (P-6.4).
4. **Live lesson.** No new risk is introduced here, but the doc inherits all of P-4: the face *leads* sound on Bluetooth
   by 100-250 ms; use the `faceDelay` delay line from `media-playout` stats plus `outputLatency` plus the route table;
   and gate tier switches on local RMS, not on `output_audio_buffer.stopped`.
   - One addition. The parent and child perceive sync quality first in the preview, where it is near-perfect, and then
     live, where it is not. The gap itself is a desync perception risk. See G-6.2.
5. **Main-thread contention during the greeting.** GLB parse and morph packing (up to about 1.3 s of main-thread JS on
   the mpfb arm at 4×) run while the karaoke caption and waveform animate. The audio keeps playing, but the captions freeze.
   - Do parse and warm-up during the preview (G-0.1), never inside the greeting.
   - Drive the waveform with CSS transforms keyed from `requestVideoFrameCallback` timestamps, so a stall freezes it
     rather than desyncing it.
6. **Loudness jump at the hand-off.** −24.5 LUFS previews are about 4 LU quieter than the processed prescreen voice
   (−20.5 LUFS mean, §10). A child who hears the quiet preview and then the louder live voice gets an audible "different
   person" cue at the moment of identity hand-over.
   - Normalise previews and greetings to the **measured live realtime output loudness**, with true peak ≤ −1 dBTP.
   - Keep the ±0.5 LU cross-tutor match.

### G-5. Licence traps

- **H.264/AAC.** Offline encoding with ffmpeg/libx264 (GPL) is a build tool, not shipped, so that is fine. Never ship
  `libfdk_aac` builds.
  - The AVC pool charges no royalty for titles under 12 minutes and none for free internet video **[S, Streaming
    Learning Center / MPEG LA 2010 notice]**. The 6-15 s clips are clear even inside a paid subscription.
  - Decoders are the OEM's licence. Record this in `rejected.md` only if someone proposes VP9/AV1 "for licensing".
    Low-end Mali parts lack VP9 hardware decode in many SKUs **[U]**, which makes the swap a performance regression with
    no legal gain.
- **Preview renders inherit every asset licence of the GLB.** A CC-BY MPFB pack (hair 02/03, glasses 02, shirts 02/03,
  per `character-creation.md` R-4) that appears in a preview MP4 needs the same in-app attribution as the GLB.
  - Add `licences: AssetLicence[]` to `TutorCharacter.look`.
  - G-PREV fails if any asset in the render lacks a recorded licence.
  - Never render previews from TalkingHead sample avatars (non-commercial, `web-3d-talking-heads.md` R-8), not even as
    placeholders in a build that could ship.
- **Mixamo idle clips baked into preview video** are distribution of derived animation. Use the same sign-off as R-8's
  bake, or author idles in-house.
- **The 42-year-old tutor's new name** must pass the real-person and trademark check before any preview is rendered,
  because renders bake the name into captions and audio. Re-rendering 6+ clips per rename is the cost of skipping it.

### G-6. Uncanny-valley risks for children

1. **The non-human rejection over-cites Mitchell et al. 2011.**
   - The study is 48 adults rating a *robot* face with a human voice, and the reverse **[S abstract via Semantic
     Scholar; sibling R-6.1]**. It did not test cartoon animals, and it did not test children.
   - Feature animation pairs human voices with animals routinely, without reported eeriness in children **[U]**.
   - The *same* logic predicts some eeriness for a stylised-human face with an "exactly human" voice, which is a smaller
     realism gap but not zero.
   - **Fix:** re-tag §6.3's and §11 #12's evidence as [U]. Keep non-human as an M-AV-1 arm. Require that M-AV-1 stimuli
     are **voiced** tier-B captures with the real driver (sibling R-6.3), because a silent face cannot test a face-voice
     mismatch.
2. **The preview must not be better than the lesson.** If the factory renders previews with offline A2F-3D quality, or
   Eevee/Cycles shading, the child chooses on a face the phone cannot produce. The first live turn is then a visible
   downgrade, on lips above all (live HeadAudio closes 55 of 84 bilabials, `character-creation.md` R-5.4).
   - Render previews **in headless Chromium with the tier-B GLB, the shipped shaders and lights, and the live lip driver**
     (the same rule as P-6.5 for tier plates).
   - Use the same framing as the lesson stage. If the lesson shows a PiP bust, the picker should not show a larger face
     than the child will ever see again, because the enlarged tile is the most scrutinised view of the face in the product.
3. **Lip-driver accuracy varies per voice, which biases the choice.**
   - HeadAudio-class drivers depend on the voice: pitch and formants, and `speakerMeanHz` is in the model.
   - A tutor whose preview lips track worse will lose share for reasons that are neither appeal nor representation, and
     M-AV-6 will misread that as a representation failure.
   - **Add to G-PREV:** bilabial closure capture and jaw-envelope r on each tutor's preview clip must be within ±10 pp and
     ±0.1 of the cross-tutor mean.
4. **"Gentle face ×0.5 on expression gain" removes exactly the wrong channel.**
   - Tinwell et al. 2011 (*CHB*) found characters rated significantly uncannier when **upper-face** movement (brows,
     lids, forehead) was limited **[S abstract via search]**.
   - Halving brow and blink gain makes the face *less* alive while it is still talking. Halving viseme or jaw gain also
     makes the lips look mistimed.
   - **Fix:** "gentle face" scales **head motion and expression amplitude in the lower face only**, at ×0.5. It never
     touches brows, blinks or visemes. Children who need less face get the still-portrait mode, which is honest stillness
     with a caption and no mouth, rather than a damped face.
5. **Previews need an alive idle.** A 6 s clip with no blink and no saccade reads as a mannequin at 512². Require ≥ 1
   blink (TalkingHead's 50 / 100-300 / 100 ms template, rendered at 24 fps or more so the close phase survives;
   `character-creation.md` R-5.1), gaze breaks, and the eye catch-light (P-6.1).
   - Add these as G-PREV checks on the `FaceFrame` track used for the render.
6. **The B4 picker (ages 13-15) is past Brink's age-9 boundary.** Those children will tap through every preview at the
   largest size. The age-band fit for "tap to hear" should start the tile at lesson size, not enlarge it.

### G-7. Production effort (not costed in the doc) [U, engineering judgement]

| work | estimate |
|---|---|
| Deterministic headless-Chromium preview renderer: fixed-dt stepping, a seeded patch for TalkingHead's `Math.random` blinks and `mtRandomized` jitter (otherwise renders are not reproducible and G-PREV cannot diff them), frame capture, ffmpeg mux, loudnorm, peaks, captions | 1.5-2 engineer-weeks |
| G-PREV gate: loudness, duration, skeleton diff, licence manifest, lip-parity (G-6.3), gaze cap (G-3.4), blink presence | 0.5-1 engineer-week |
| `ttsTwin` vs `realtimeVoice` ABX per voice (G-0.2), n ≥ 20 listeners × 4 voices | 1 week of calendar time; a realtime-model render path if any fail (+3-5 days) |
| Per-child name greeting at P6: TTS (or realtime) plus a **FaceFrame track per clip**. Per-child audio is not known offline, so §5.7's offline A2F bake does not apply. Either run an A2F service on the onboarding critical path (Azure GPU, latency) or run the live driver client-side on the cached clip (the honest choice, matching G-6.2) | 2-4 days client-side; much more for a server A2F lane |
| Concatenated-preview player (G-2.4), Blob loading (G-2.5), speculative warm-up (G-0.1), AudioBuffer greeting (G-2.6) | 1-1.5 engineer-weeks |
| Renders: 4 tutors × 3 languages child previews, plus parent previews on demand, re-rendered per `look.rev` / voice / script change | about 2 h machine time per full re-render [U]; about 0.5 d human QA per cast change |
| Device lab additions to M-SEL-6: marker A/V test × 3 routes, tap→frame for both player designs, warm-head memory | 2-3 days |

The doc's §12 costs nothing beyond the experiments. The total above is about **5-7 engineer-weeks**, on top of the
character art in `character-creation.md` R-7.

### G-8. Changes to gates and measurements

- **G-PREV adds:**
  - renderer = tier-B runtime;
  - driver = live driver;
  - 512² Main CRF 26-28, ≤ 200 KB muxed;
  - AAC at 48 kHz;
  - loudness matched to live output (G-4.6);
  - lip-parity across tutors (G-6.3);
  - gaze cap and blink presence (G-6.5);
  - a licence manifest (G-5).
- **M-SEL-6 adds:**
  - signed A/V offset of the preview and of the greeting on speaker, wired and A2DP, with the 240 fps marker method;
    pass +45 / −125 ms;
  - tap→frame for `src`-swap against the concatenated seek;
  - choose→live-face split into APK, web cold and web after speculative fetch;
  - incremental memory with one warm head on the Exynos 850 and T7250 phones.
- **M-SEL-10 extends** to `ttsTwin` against `realtimeVoice` (G-0.2), not only model upgrades.
- **New M-SEL-11: preview-to-live realism gap.** Children rate "same teacher?" and "did she change?" after their first
  live turn, preview arm against live arm. The pass bar is ≥ 85% "same teacher". If it fails, the preview is overselling
  the product.
- **Proposed `context/` entries:**
  - **rejected `preview-rendered-offline-quality`.** A preview better than the runtime is a bait-and-switch and an
    uncanny downgrade.
  - **rejected `tutor-speaks-over-still-portrait`** (G-0.1).
  - **measurement `preview-size-probe-2026-10-02`.** The table in G-2.1; n = 1 encode per cell; proxy, not a character.

### Review sources

- Android CDD §5.3.4 (H.264 decode: "MUST support Main Profile Level 3.1 and Baseline Profile"):
  https://android.googlesource.com/platform/compatibility/cdd/+/refs/heads/main/5_multimedia/5_3_video-decoding.md **[V]**
- OpenAI Realtime conversations guide (voice immutable after first audio): https://developers.openai.com/api/docs/guides/realtime-conversations **[V]**
- OpenAI Realtime server-events reference (`audio.output.speed` 0.25-1.5, post-processing):
  https://developers.openai.com/api/reference/resources/realtime/server-events **[S, via search summary]**
- Azure realtime how-to (updated 2026-09-23; no speed parameter documented): https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/realtime-audio **[V]**
- OpenAI TTS guide (marin and cedar in `gpt-4o-mini-tts`): https://developers.openai.com/api/docs/guides/text-to-speech **[S, via search summary]**
- MDN browser-compat-data `HTMLVideoElement.requestVideoFrameCallback`: https://github.com/mdn/browser-compat-data **[V]**
- Capacitor Android range-request issues: https://github.com/ionic-team/capacitor/issues/7007, https://github.com/ionic-team/capacitor/pull/5956 **[V]**
- Mitchell et al. 2011, *i-Perception* 2(1):10-12, doi:10.1068/i0415: https://www.semanticscholar.org/paper/77e415fd782b5923fce645517a98daf6785f832d **[S]**
- Tinwell, Grimshaw, Abdel Nabi & Williams 2011, *Computers in Human Behavior*, "Facial expression of emotion and
  perception of the Uncanny Valley in virtual characters": https://www.semanticscholar.org/paper/27caf712eb6f7eb4525e5c0759c4f989f54e706b **[S]**
- Monk Skin Tone Scale (CC BY 4.0): https://skintone.google/, https://en.wikipedia.org/wiki/Monk_Skin_Tone_Scale **[S]**
- H.264 royalties: https://streaminglearningcenter.com/articles/h-264-royalties-what-you-need-to-know.html;
  MPEG LA 2010 free-internet-video notice: https://www.design-reuse.com/news/202518921-mpeg-la-s-avc-license-will-not-charge-royalties-for-internet-video-that-is-free-to-end-users-through-life-of-license/ **[S]**
- Measurements:
  - `node docs/research/avatar/selection-proto/roster-lint.mjs` (re-run, matches);
  - `python3 docs/research/avatar/selection-proto/preview-size-probe.py`, giving `preview-size-probe.json`;
  - an ffprobe/`elst` check of AAC at 24 and 48 kHz and H.264 Main.
