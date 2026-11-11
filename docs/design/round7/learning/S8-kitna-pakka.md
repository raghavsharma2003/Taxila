# S8 "Kitna pakka?" — the how-sure bet, end to end (spec only)

Round 7 F Learning, 2026-11-08. Main's ask: a ready spec for PARENT-REPORT S8 ("How sure", B2+). **No code and no asks yet.** Brain and App build it after director11 is judged.

**Sources:**
- PARENT-REPORT.md §5 S8.
- RESEARCH-PROGRAM MS-S1/S2.
- metacognition-srl.md (MS-D1…D3, §3.2-§3.6, §4.1, §6.1).
- learning-science P12.

Numbers marked [U] are untested defaults. MS1 (wording) and MS3 (measured reliability) tune them.

## 0. What this is, and what it is not

- **It is** a one-tap self-report after selected answers: "how sure were you?". It has three levels, and it comes *after* the child answers and *before* the verdict.
- **It is a learning move first.** Confident errors followed by feedback are hypercorrected in grades 3-6 (Metcalfe & Finn 2012). Monitoring tools show d = .42 (Dignath 2023). It is a measure second.
- **It is not:**
  - a quiz on top of the quiz;
  - a score;
  - a stake ("bet points");
  - a confidence label on the child.
- **No raw "confidence minus accuracy" is computed or used** (MS-D1: raw bias is confounded with ability, r = −.53 to −.74 by construction).

## 1. The child move: when the tap appears

**Eligible answers.** All of these must hold:
1. The item is a keyed card whose first attempt is graded by code or a verified key: explain ask, check, then-card or yourStep. A model never grades.
2. It is the child's **first attempt** on that item, unaided:
   - no hint rung spent;
   - no "pata nahi";
   - no help asked before answering.
   The outcome joined to the bet is KT class C0 against anything else.
3. ASR confidence on the answer is at or above the turn's ASR floor (LS §7.2 rule 3), or the answer was a tap.
4. It is not a safeguarding turn, not inside a stop check, not the last 2 minutes of a sitting, and not a test-window review turn.

**Sampling (MS-D2).**
- **At most 3 bets per session** [U; MS H1 randomises 2-4 later].
- **Never two in a row**: at least 2 eligible answers lie between bets.
- **Never on the first answer of a lesson.**
- **Stratified across difficulty.** For each eligible answer, take the predicted P(correct) from KT (θ against the item's b) and its tercile (low, mid, high). Fill one bet per tercile before a second in any tercile. Sampling only hard items inflates "overconfidence" by range restriction (§3.2).
- **Inside a stratum, pick at random** with probability 1/2. The draw is seeded by sessionId + itemKey, so a replay asks the same items.
- **No bet in the first-week warm lessons** (R15 `warm`). The child's first contact with a new format adds familiarity drift (§6.2), so bets begin from the third lesson in a subject.
- **Bands:** B1 (6-7) gets faces, not words (§2). The bet is **off for class 1** [U]. Classes 2-9 are on.

**Order inside the turn.**
1. Child answers.
2. Taxila says the ask shape (§2).
3. Three tap targets appear. Voice also works.
4. The child taps or says one, or **skips**: no answer in 6 s, or a spoken "pata nahi" or "skip".
5. Taxila gives the usual verdict and close.

There is no comment on the bet itself before the verdict. A skip is never re-asked.

**After the verdict**, there is at most one item-level line, never a line about the self:
- A **confident error** (pakka + wrong) gets the hypercorrection shape: "this one was tricky; let's see where it turned". The item is queued for the next delayed check (LOT).
- A **guess that was right** gets a "you got it; let's see why it works" shape.
- **Never:** "you were too sure", "overconfident", or any tally.

## 2. The three states, as shapes (not lines)

Shapes only (the inherited law: sentence-shaped prompt text gets recited). Brain writes the spoken line from the shape, in the child's register. App draws the three targets.

| level | id | meaning (what it must mean to the child) | B1 face | ask-shape slot | never confused with |
|---|---|---|---|---|---|
| 2 | `pakka` | sure about THIS answer | 😀 | ⟨I am sure of this one⟩ | "I know the topic" |
| 1 | `shayad` | maybe; could be wrong | 🙂 | ⟨I think so, not sure⟩ | — |
| 0 | `andaaza` | a guess | 🤔 | ⟨I guessed⟩ | "pata nahi" / "I don't know the topic" (§3.6: the lowest level is about the answer, not the topic) |

- **Ask shape** (`bet.ask`): ⟨after-answer, before-verdict⟩ + ⟨how sure about this answer⟩ + ⟨three choices named once⟩. No question about the topic, no stakes, no "be honest". Kept ≤ 12 spoken words.
- **Ack shape** (`bet.ack`): one neutral token ("theek hai" / "okay"), then straight to the verdict. Never "good choice", never a reaction to the level.
- **Wording** "pakka / shayad / andaaza" is [U: MS1] and is tested with children. A social-desirability default ("pakka" said as politeness to an adult-like voice) is a known risk (§4.1). The tap path reduces it.

## 3. What Brain stores per answer, and the wire

**Wire (contracts, Brain-owned):**
- `TurnResponse.ui.bet?: { itemKey: string; options: ["pakka", "shayad", "andaaza"]; faces: boolean }`
  - It is present only on a turn that asks.
  - `faces = band === "B1"`.
  - The client draws it instead of the steer row for that turn.
- The answer comes back on the existing chip path: `TurnRequest.chipId = "bet:<level>"` with level `pakka | shayad | andaaza`. A skip is `"bet:skip"`, or the next turn's own childText.
  - A spoken answer is classified against the three words plus their face names. Below the ASR floor it is dropped, never guessed (§3.5).
  - No new request field is needed.

**Storage.** One row per bet, a `MetaEvent` (metacognition-srl §6.1). The proposal is a new table, because a bet is not KT evidence and must not move θ or pL:

```sql
-- proposed migration (Learning range): meta_event
create table meta_event (
  id text primary key,                 -- "<lessonId>:bet:<itemKey>"
  child_id uuid not null references child(id) on delete cascade,
  session_id text not null, at timestamptz not null default now(),
  kind text not null check (kind in ('bet')),             -- 'jol' | 'help' | … later
  item_key text not null, skill_ids text[] not null,
  level smallint check (level in (0, 1, 2)),              -- null = skipped
  via text not null check (via in ('tap', 'voice', 'skip')), asr_conf real,
  latency_ms int,                                          -- research only (Kolloff), never reported
  first_outcome text not null check (first_outcome in ('C0', 'other')),
  evidence_id text not null,                               -- the kt_evidence row of the answer it is about
  sampled_tercile smallint not null check (sampled_tercile in (0, 1, 2)),
  grader_version text not null, band text not null, domain text not null,
  legal_mode_at_write text not null
);
```

- `first_outcome` is written when the verdict is known, from the same graded answer: `evidence_id` is that answer's kt_evidence row.
- No fold, no θ, no pL. The learner model never reads `meta_event`.
- Consent: the `learning_profile` grant, the same as other per-child signals. Legal-mode guards as in writer.js. A bet is never written for an M0 child.

## 4. What App draws

- **Three large tap targets** where the steer row is, for one turn only: word chips (B2+) or three faces (B1).
- **Equal size, equal visual weight, fixed order** (pakka, shayad, andaaza). None is highlighted or pre-selected.
- **No timer bar.** A 6 s quiet window, then it disappears (counted as a skip).
- **No feedback on the tap itself:** no colour change by correctness, no sound, no counter. The verdict follows as usual.
- **Never a history** of bets on the child's screen in v1.
- **B2+ child-facing calibration feedback** ("you said pakka, you were right" in counts, monthly) is MS-S10 child-facing reflection. It is out of scope here and not built.

## 5. How S8 reads it (parent report, monthly and term), with honest floors

**Floors (MS-D3, RESEARCH-PROGRAM MS-S1):**
- **Band:** B2+ only (8+). B1 never sees S8.
- **Volume:** per domain (subject), ≥ 30 bets **and** ≥ 10 bets on wrong first answers. Below that, S8 shows the fallback only.
  - At 82% accuracy, ΔConf is .38 at 30 bets, and 31% of children have < 3 errors (MS P3). The wrong-answer floor is what keeps the table honest.
- **Cells:** a level with n < 5 is suppressed ("—").
- **Difficulty mix:** shown on every table as the tercile counts.

**Shapes (report templates, like `place.*` / `rest.*`):**
- `sure.table` {subject, n2, a2, n1, a1, n0, a0, e, m, h}: the three rows "said pakka {n2} times, right {a2}", and so on, plus ⟨mix of easy, middle and hard questions: {e}/{m}/{h}⟩.
- `sure.read` {level}: **one** reading slot from a fixed set, about one level only:
  - ⟨when {name} said "pakka", {name} was right {a} of {n} times⟩
  - no comparison between levels below the resolution threshold (MS P10);
  - no resolution sentence at any band in v1 (MS P1: r(ΔConf, d′) = +.85, mostly knowledge);
  - no change line in v1 (MS P9).
- `sure.cue` (fixed copy): ask "how sure are you, and how could we check?" rather than "is it right?" (Fyfe 2022).
- `sure.collecting` {subject, n} (fallback): ⟨still collecting {name}'s "how sure" answers in {subject}; {n} of 30 so far⟩.

**Check (check.js re-derivation).** Every slot is recomputed from `meta_event` joined to its kt_evidence rows:
- the counts per level and outcome;
- the tercile counts;
- both floors;
- the n < 5 suppression.

**Lexicon.** Never:
- overconfident, underconfident, low confidence, self-doubt;
- calibration percentages;
- gendered framing.

The lexicon already bans confidence and confident (emotion), so the copy uses "how sure" and "pakka" only.

**Kill switches.** S8 drops at section level if any of these hold:
- MS10 (report pressure) shows a rise in parent-pressure items;
- MS6 shows bets lower delayed learning or raise avoidance;
- MS3 finds split-half < .70 at 30 bets in real data. The table can stay, but `sure.read` goes.

## 6. Build order and owners (after director11)

1. **Learning:** migration `meta_event`; the sampler (pure: eligibility, terciles, seeded draw, caps) and its tests; report shapes, claims and check for S8; an offline sim of table stability at 30/60/120 bets on the real KT θ.
2. **Brain:** emit `ui.bet` from the sampler on eligible turns; read `chipId "bet:*"` and voice; the ack and hypercorrection shapes; write `meta_event` after the verdict.
3. **App:** the three targets (words / faces) in the steer slot, 6 s window, no feedback.
4. **Measure before parents see it:** MS1 (wording, a small child panel) and the table-stability sim. S8 ships to parents only when both pass.

## 7. Open questions for main

- Class 1 off: confirm.
- The 3-per-session cap competes with the lesson's own pace (W6). Should a bet count against the turn budget?
- Domain = subject (maths, evs, …), or finer (chapter strand)? Topic specificity (§3.6) argues finer, but that makes the 30-bet floor take months. v1 proposes subject.
