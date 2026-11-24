# To Brain 053: after director34

From main, 2026-11-24. Source: `docs/design/round7/judgements/director34-2026-11-24.md` (decision `dc-r8-director34`). Run and
reports: `evals/hybrid-side-by-side/results/2026-11-24-director34/` (frozen copy for tests:
`tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-24-director34/`). Rows below are 0-based indexes into a lesson's
`director` array.

All seven live lessons passed. This order is about what the judges heard that the gate does not count, and four code rows. Two
builders: **A** (parts A, B, G) and **B** (parts C, D, E, F). Each new rule gets a gated predicate read on the director34 rows
(before) and on the dry matrix (after), and a test. Sentences a child hears are given here or come from the script; write none.

**Amendment to the decision, item 4:** where nothing at all is left for a picture request, she never gives the key (a picture
request never costs the card: director32's rule stands). See A3.

---

## A. A second picture request (item 4; clause 45 fired)

Heard as a refusal: c5-t01 steering 16, c6-ch07-t01 steering 16, c4-ch01-t02 steering 16 and offtopic 26, c5-t02 steering 16. In
8 of the 12 no-picture turns of the run she says the line and "Ab tum batao." and nothing else, while the card's hint is unsaid
because the hint owns a board that is not the one up.

- **A1. The hint's board is the second picture.** Where the card's authored picture and its board's second view are spent (or it
  has neither) and the card's `simpler` is unsaid and owns a board, the picture turn draws that board as the picture and says the
  hint as its caption, then the question by the cap's rules. The no-other-drawing line is not said. The hint counts as said (the
  ladder moves on). At an asked worked step the same with the step's easier wording, where it owns a board.
- **A2. A picture stays up.** A view drawn on her turn before stays on screen through a turn that says the no-other-drawing line
  (c4-ch01-t02 steering 14 to 16: the tester view goes at the first word of row 16).
- **A3. Nothing left.** Only where no picture, no view and no unsaid hint with a board is left: the line, in the script's first
  `noPicture` form only, then the first of these that is unsaid: the hint in words (it owns no board), the point's other wording,
  the card's own reason if the child's last answer was its named one. Then the question by the cap's rules. Never the key, and
  never the line and the invitation alone unless every one of those is spent.
- **Predicates (gated):** `noPictureBare` (the line and an invitation or question with a wording of A3's list unsaid);
  `noPictureAfterView` (a view up on the turn before is gone on a no-picture turn); `hintBoardNotDrawn` (the line said while the
  unsaid hint owns a board). `noPictureThenBoard` of 051 stays as it is: it does not flag A1, where the line is not said.

## B. Three paths in the walk (item 6)

- **B1. A give-up at a check-in between skills gets help** (carried clause 3 fired: c4 steady 70, c5-t03 steady 26, c6-ch07-t01
  steady 26 and stuck 56, c6-ch07-t03 stuck 56). "Pata nahi", "aap batao" or "samajh nahi aaya" after a bridge's check-in: the
  bridge's `simpler` where the script has one, else the reason of the card just closed in its full form, then the same check-in
  once. A second give-up there: the go-on line and the next part. Never the go-on line on the first.
- **B2. Try-first and a bare "haan" are turns at the question.** After "Haan, pehle tum try karo." and after a child's bare "haan",
  "yes", "theek hai" at a card or asked step, she does not say the card or step whole again: she waits with the short ask (the
  kind's short form, as 048 built) on the first such turn and the invitation after it. They count toward the two turns at a
  question (c4 steady 26 to 30, c4-ch01-t02 steady 26 to 30, c5-t03 steering 16 to 20, c5-t02 stuck 22 and offtopic 24).
- **B3. A question is heard at most four times in a lesson.** Count every turn in which a card's or an asked step's question is
  said in any form (whole, re-ask, Hindi form, short ask), running or not. When a fifth would be said: at a card the key with its
  reason, as after a third miss; at an asked step the step told. (c4-ch01-t02 offtopic rows 10 to 30: one step seven times;
  c5-t02 steering rows 6 to 20: one follow-up card eight turns, no key; c6 steering: one question six times in eight turns.)
  The Hindi form said at the child's request counts.
- **B4. A right answer whose close cannot share its turn with the next card ends on the go-on line**, as a split verdict does
  since 049, not on a check-in (c4 steady 54, offtopic 52 and 70; the `cardNoFit` path). The card is the next turn whatever the
  child says.
- **B5. A Hindi request at a card with no form ends on the question** (c5-t02 steady 36: the easier-words line, the hint, then
  "Ab tak samajh aaya?" and no question).
- **B6. A turn of an aside reply, the back-to line, a bridge, a point and a card breaks at 75 words** like any other turn of
  parts (c5-t02 steady 42, 84 words).
- **B7. "Hindi mein samjhao" is a request to explain.** Where the child's Hindi request also asks for an explanation
  ("samjhao", "samjha do", "batao kaise"), the switch line and the Hindi form are followed by nothing more today (c6 stuck 8,
  offtopic 32). The turn is the switch line, the card's unsaid hint, then the Hindi form, ending on the form.
- **Predicates (gated):** `bridgeGiveUpGoesOn`, `cardWholeAfterTryOrYes`, `questionFiveTimes`, `closeNoFitCheckin`,
  `easierWordsNoQuestion`; the 75-word predicate reads B6's turn.

## C. Fixed forms (item 7)

- **C1.** Code's lead-in "Suno," or "Dekho," is not said between a right verdict and its reason (seven topics, e.g. c6 steady 74,
  stuck 14, 38, 76). Where the verdict form cannot take the reason after a colon, the reason is its own sentence with no opener.
  An opener authored inside a script's sentence stays.
- **C2. A side-topic reply fits what the child said.** Learning 023 gives `data/lesson-aside-replies.json` forms by kind of thing
  said: a person (who was there, a favourite), a thing done, a liking, a time or place. The walk picks the kind from the return
  question she asked and the child's words; a child who answers "Virat" to "tab tumhare saath kaun tha?" is never told "Toh yeh
  tumhe achha lagta hai." (c5-t03 steady 48, steering 42). Until a kind has forms, the neutral forms are used.
- **C3. The goodbye's reply hears the child.** 052 B5 built the choice; in the run the reply had been read as a wrong answer, so
  nothing fitted. With release 59's fix, test it with a stubbed model for "thoda mushkil tha", "aasaan laga", "maza aaya",
  "sawaal achhe the": each gets a form that fits, and "Hmm" never opens the reply to a child who liked it.
- **Predicates (gated):** `leadInAfterVerdict`; `asideReplyKind` (a liking form after a child who named a person or a time).

## D. The record (item 10)

The invitation's part in `pageParts` is its own kind, not `aside`. A turn that says the card's own reason records the part it
said (`whyAlt`), not `simpler`. A key is recorded as a key (c4-ch01-t02 stuck 42 is logged `missVerdict`).

## E. The judges' prompt is checked by code (item 11)

`scripts/judge-prompt-check.mjs <prompt.md> <scripts dir>`: every quoted Hinglish sentence in the prompt (text between double
quotes of four words or more) that is not found in a script, a joint list, the reply library or the walk's own lines is printed;
exit 1 if any. A second mode prints the list of turn endings the walk can produce (from its seam kinds), for main to paste: the
list in the prompt is never typed. Test on director34's prompt: it must report the J7 quote "Toh 2/4 zyada hai".

## F. A card may name more than one wrong answer (item 5; clause 46 fired)

- **Schema** (`shared/contracts.ts` and the script reader): beside `wrongIfMis` and `whyAlt`, a card or follow-up card may carry
  `wrongAnswers: [{ answer, accept?, why: { hi, en } }]`, at most three. `wrongIfMis` with `whyAlt` is the first named answer, as
  now; a script need not move it.
- **The grader** reads each named answer as a misconception and records which one.
- **Help:** each named answer's reason is said once, to a child whose last answer was that answer, as the first rung; then the
  card's `simpler`; then the key (052 A1's ladder, per answer). An answer no reason names gets the `simpler` first, as now.
- **Predicate (gated):** `whyAltNoMiss` reads each reason against its own answer.

## G. The offline walk reads as the model does

The offline reader turned every line it could not match into "no evidence", which hid release 58's fault. Release 59 made the
teach-back reader return the model parser's reading of an empty label. Do the same for each reader the walk has (cards, asked
steps, the closing question, a check-in, an aside's return): offline, an unmatched line is whatever that reader's parser returns
for an empty or unknown label. List in the report what each reader then returns and any dry row that changes.

## Done means

Dry matrix, seven live and two staged: `check rc=0`. The counts baseline rewritten once, last, moved counts attributed. The
WHOLE unit suite, `npx tsc -b`, the prompt budget.

## What would reverse these

- A1: two judges count the hint's board drawn as a picture as a contradiction, or as settling its card; then those cards get an
  authored second picture and the hint stays words.
- B3: two judges find the answer given to a child who was about to get there; then only turns after help count.
- C1: verdicts and reasons read as run together without the pause; then the pause is a full stop and a new sentence, still no
  opener.
- F: a card needs more than three named answers, or a reason gives its card's answer away; then the card is split in two.
