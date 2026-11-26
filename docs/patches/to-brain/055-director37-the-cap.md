# To Brain 055: the cap (when she stops asking and tells), and three small walk items

From main, 2026-11-25. Source: `docs/design/round7/judgements/director37-2026-11-25.md` (`dc-r8-director37` item 3; rulings 1
and 5; "What is left" 1 and 7). Round d38's walk change is ONE thing, the cap, with three small items. No lesson script
changes in it (the script round is order `to-learning/026`). Built, read as heard and reviewed as round d37 was, measured on
two topics before any full run.

## What the judges found

The rule today (director35 item 6, "K4(c)"): a question is said at most four times in a lesson in all its forms (the short
ask and the invitation not counted); a fifth that she would say on her own is the told answer with its reason (a card) or
the told step (an asked step); a child's own request for the question is always honoured.

It counts wrongly in both directions:

- **Too early (four lessons, three judges, the carried clause 4):** the told answer came at the cap while one easier wording
  of the open part was still unsaid: c6-maths-ch06-t01 steering 22 (the remediation's "Ek haath ki paanchon ungliyan…"
  unsaid), c5-maths-ch02-t01 steering 22 (the remediation's chocolate wording unsaid), c6-maths-ch07-t03 stuck 42 and
  steering 22 (`remediation[0].simpler` unsaid). Round d37 made this more likely: help now ends on its question (so hearings
  mount faster) where it used to end on an invitation.
- **Too late (one lesson):** c4-maths-ch01-t02 offtopic 22 to 46: one step question heard eight times before it is told
  (rows 22, 24, 28, 30, 34, 36, 42, 44): after a give-up's help, after her reply to an AI question (twice), after a picture
  request's help, in the Hindi form, at the wait's second turn, and at the child's own "phir se bolo". Each is allowed
  singly; together they are a child kept at one question for twelve turns.

The rows are frozen under `tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-25-director37/`.

## The rule (C1 to C4)

- **C1. The answer is told only when nothing of the open part is left unsaid.** Where the cap would tell while a help
  wording of the open part is unsaid (the same wordings `pickHelp` would offer a child who asked at that moment, in its
  order), the turn is that wording as help instead, and it ends on an INVITATION, never on the question (the question has
  been heard four times). The answer is told at the child's next miss, give-up or non-answer once nothing is unsaid.
- **C2. After her reply to a side-topic, the way back to an open question is the short ask once the question has been
  heard twice** in the lesson ("Ab phir se socho, jawab kya hoga?" and the forms the walk already has for a short ask), not
  the question again in any form. Before that, as built (the re-ask).
- **C3. No fifth hearing on her own, in any form.** Counted: the question whole, its re-ask, its Hindi form, help or a
  remediation that ends on it. Not counted, as today: the short ask and the invitation. Where a turn of hers would be a
  fifth hearing (a wait's re-ask, help that would end on the question, a return to the question), it takes the form that
  does not say the question: the short ask or the invitation in that place, or C1's help, or the told answer when nothing
  is unsaid. A child's OWN request for the question ("phir se bolo", a Hindi request at a card with a Hindi form) is
  honoured always, as today, and counts as a hearing.
- **C4. The wait and the try-first are unchanged** (order 054 as built): a try-first is the go-ahead alone; the turn after
  it is the wait's. Only what a wait turn SAYS changes where C3 applies (wait two's re-ask would be the fifth hearing: it is
  what wait three is).

Gated checks, written before the fix and flagging the director37 rows above from the frozen fixtures (say how many rows
each flags there, and on the offline matrix before the fix): `keyWithWordingUnsaid` (a told answer or told step while a
help wording of that part was unsaid in the lesson: four rows in the fixtures) and `questionFifthOnHerOwn` (a fifth counted
hearing of one question that is not the answer to the child's own request for it: c4-maths-ch01-t02 offtopic). The existing
`questionFiveTimes` and `keyAfterFive` are read against the new rule: where they exempt what C2 or C3 now forbids, they are
tightened to it, by name, and nothing else about them changes.

## Three small items

- **S1. One go-on line where a park follows a let-go line.** At the check-in after a told answer, a side-topic gets the
  let-go line, the park line and a back-to-work line ("Theek hai, abhi aage badhte hain. Cricket ki baat bhi hogi, bas yeh
  kaam poora ho jaaye. Abhi apne kaam par wapas chalte hain. …": director37 steady c4-maths-ch01-t02 40; also the park line
  and joint that double "kaam" at steady c6-maths-ch07-t03 34). Order 054's item 8 dropped the first go-on line where her
  REPLY is in the middle; the same where a PARK is: the turn opens on the park line, and one back-to-work line follows.
- **S2. The picture a child asked for stays through the card where the card's board is the same figure.** After "Iski aur
  koi drawing mere paas nahi hai." the picture stays under the line and the help (as built) and, where the card's own
  board is the same template and figure with fewer marks (director37 steering c4-maths-ch06-t01 16: the broken scale with
  and without the "1 khaana poora" mark), under the card's question too. Where the card's board is another figure it comes
  up with the card, as built.
- **S3. Credit for the method at a step slip, ONLY if existing forms can say it.** At an asked worked step, a child who
  names the right operation with a wrong number ("33 ko 6 se bhaag" where the step is to divide by 3) hears "Nahi, kuch aur
  hai." (director37 c6-maths-ch07-t01 stuck 32, offtopic 16). If the script or the walk already has a form that grants the
  method, use it; if saying it needs a new sentence, do NOT build S3: say so, and it goes to Learning.

## Not in this round

The lesson scripts (`to-learning/026`); anything on or around a safety turn (frozen); the stop menu; fixed forms such as
"Toh poora jawab:"; register by cause.

## Reversal

Each on its own pair measure: C1 if a judge hears the extra help turn as the wait going on (then the unsaid wording is said
WITH the told answer, as its second sentence); C2 and C3 if two judges hear a child who lost the question (then the re-ask
returns at the third hearing after a reply and the cap goes to five); S2 if the kept picture is heard as stale under a
question it does not show.

---

## As built (added 2026-11-26, at the round's close)

The order above is kept as it was written. This section is what was built, and where main's rulings changed the order.
Where the two differ, this section is the rule.

### What main got wrong in the order

- **C2 is dropped.** The order's C2 (after her reply to a side-topic, the short ask once the question has been heard twice)
  is what two earlier judged rounds took out: a child who has just talked about cricket and hears "Ab phir se socho, jawab
  kya hoga?" does not know which question is meant. Those rounds' checks (`shortAskNoAnswer`, `shortAskKind`) forbid it and
  the builder rightly would not exempt them. Main wrote C2 from one sentence of the judgement without reading what the
  existing checks hold. After a reply to a side-topic the way back is the question, as built, while it has been heard fewer
  than four times.
- **C1 was written too wide.** As ordered it would give every unsaid wording before telling: two or more of her turns
  running with help piled on a child who has had four hearings, which is the wait going on. C1 is ONE turn a question.
- **An invitation after a side-topic** (main's first correction of the return) is forbidden by `inviteAfterPark` for the
  same reason C2 was wrong. Corrected again: the return ends on the question.
- **Three rulings made from one walk each and taken back within the hour.** C1 at every wait at the cap (against main's
  own earlier ruling that a child who only says "haan" is not asking for another wording; an order-054 test caught it):
  narrowed to a wait where no help was ever said at that question. "No remediation at the cap" (against
  `skillRemediation`'s rule that a named mix-up always gets its remediation): withdrawn. "The told answer on the way back
  from a follow-up card at the cap" (ruled to save a reading change): the first driven walk read "Sahi jawab, kyunki … Nahi,
  kyunki 3 tukde barabar nahi …", right and then no about a question three turns old; withdrawn, the question is asked.
- **S1, S2 and S3 were not built.** The round grew a second cause (the step read after help, below) and closed on the cap
  and that. The three small items are carried to the next walk order as written above.

### The cap as built

- **C1, one turn a question.** Where the cap would tell the answer while a help wording of the open part is unsaid, her turn
  is the FIRST unsaid wording (the picker's order) as help, ending on an invitation. At the child's next miss, give-up or
  non-answer the answer is told with its reason, whatever is still unsaid. Any help turn at four hearings that ends on an
  invitation is that question's C1 turn, whichever path said it.
- **Not "unsaid".** A wording any sentence of which the child has already heard in near-same words (eight in ten words, in
  order, in one sentence she has said) is not counted as unsaid: said whole it would repeat her, and cut it is not the
  authored wording. Such rows are the script's (order `to-learning/026`, section 1a).
- **C3, no fifth hearing on her own, after any turn of hers.** At four hearings: a wait's re-ask is the invitation; a child's
  request (a clarify, a give-up, a picture request, a Hindi request where the card has no Hindi form) is helped as always,
  and that help ends on an invitation; a child's own request for THE QUESTION ("phir se bolo" and its like, a Hindi request
  at a part with a Hindi form) is honoured and counts as a hearing. A side-topic question is not a request for the question.
- **The return at the cap.** After her reply to a side-topic at four hearings, with a wording unsaid: her reply, its joint,
  the first unsaid wording as help, and the QUESTION (its re-ask), once a question. This is the one fifth hearing on her
  own that is allowed: a child who drifted needs the question, and it comes with something new. After it, a miss gets the
  told answer; a further side-topic gets her reply, its joint and the told answer (a card: then its check-in; an asked
  step: the told step). With nothing unsaid at the return, the told answer comes at once.
- **The wait.** Order 054's wait keeps its own ladder; a child who only says "haan" is not asking for another wording, and
  where any help was said at that question the wait tells as built. Only where NO help turn was ever said at a question
  heard four times (a pure wait; a park, an answer-first line, then "haan") is the wait's telling turn C1's turn instead,
  and the next bare yes gets the told answer. After a question's C1 turn a bare yes is a non-answer: the answer is told.
- **A remediation at the cap, and the way back from its follow-up card.** A named mix-up always gets its remediation and
  follow-up card (`skillRemediation`, unchanged). Started at four or more hearings, that remediation is the question's C1
  turn. When the follow-up card is closed she goes back to the original card as she always has: the follow-up's verdict,
  the back-to line, the question, at any hearing count, once for each remediation (the second place a fifth hearing on her
  own is allowed: the child was taken to another question, and comes back with something new). A miss after it gets the
  told answer. A parked side-topic's return is never said while that way back is owed; it comes after the card's verdict.
- **"Help was said at this question"** has one definition, in the walk and in the checks (each in its own code): since the
  question was first posed, a turn of hers said a help wording of its part (a give-up's, a clarify's or a miss's help, a
  picture request's turn, the wait's help, C1's or C3's, a return's) or started a remediation of its named mistake. The
  question in its Hindi form, a re-ask, the short ask, an invitation, a park and a go-ahead are not help. Never cleared
  while the lesson lasts.
- **A yes-or-no card's told answer** is recorded and joined as any card's, on every path.
- **A named wrong answer's own reason still comes first** (order 054 C3, unchanged): at the cap, after a C1 turn too, a
  NAMED wrong answer whose own reason is unsaid gets the miss, that reason and one more try, ending on an invitation; the
  answer is told on the turn after.
- **A follow-up card is a question of its own**: its own count of hearings, its own help before it is told; the remediation
  it belongs to is the C1 turn of the ORIGINAL card only.
- **An AI question at the cap** ("aapko Virat pasand hai?") gets her AI line and its question alone; the told answer comes
  after the child's reply.
- **No back-to-work joint twice running.** A go-on joint is not said in a turn of hers whose turn before said one (the told
  step at a second return; her AI line said again before a card).
- **C4** as ordered.

### Checks: what was added and every reading that changed

New, gated: `keyWithWordingUnsaid`, `questionFifthOnHerOwn` (`evals/hybrid-side-by-side/d38a-predicates.mjs`).
Readings changed, each by a named ruling and unit tested on both sides:
- `yourTurnNotThird` reads through a turn that is exactly the go-ahead answering a try-first, and passes help that answers
  a child's request at four hearings and ends on an invitation.
- `keyAfterFive` passes C1's one turn and demands the key at the miss after it.
- `questionFiveTimes` and `questionFifthOnHerOwn` pass the one return turn, only where no C1 turn came before at that question.
- `replyCheckin` and `stepToldEarly` pass the told answer or told step at a second return (five hearings).
- `requestHelped` reads a `key` seam after a miss verdict (or a told-step seam) as the told answer of that part; and passes
  a third request at one check-in after a told answer, met by the meet-it-again line after two helps there.
- `orderRemediation` lists a remediation's `sayAlt` among its own wordings.
- `waitSecondNotReask` passes, at four or more hearings, the first help turn at that question (an unsaid wording ending on
  an invitation, no help said before) or the told answer where help was said before or nothing is unsaid.
  `keyWithWordingUnsaid`'s wait clause is TIGHTENED to the same rule (a told answer at a wait with a wording unsaid passes
  only where a help turn was said at that question).
- `aiAskAnswered` no longer reads a told answer's check-in as the AI line's own question (only where the AI line in that
  turn asked none of its own).
- `replyPointCardNext`'s list of what may stand before the held card gains her AI line said again (no question back).
- The narrow `c1TurnBefore` also holds for a remediation of that question's named mistake started at four or more hearings.
- `questionFifthOnHerOwn` and `questionFiveTimes` pass the way back from a remediation's follow-up card (verdict, back-to
  line, the original question), the first since that remediation started.
- `waitNoQuestion` passes, at four or more hearings, the told answer as the wait's turn where help was said at that question
  or nothing is unsaid.
- New, gated: `returnBeforeWayBack` (a parked side-topic's return said while a card whose follow-up was just closed is open).
- `yourTurnNotThird` passes, at four or more hearings, each ending on an invitation: the question's FIRST C1 turn (wherever
  an order-049 invitation stood before it), order 054 C3's named-reason turn once a question, and help answering the
  child's request.
- `reaskSameAfterHelp` does not read the question's Hindi form as help, and passes the child's own request for the question
  answered with the form she last heard (older than the round; the turn was always right).
- The way-back reading also holds after a TOLD follow-up card and where the turn opens on the help-spent line; the
  remediation-as-C1 reading looks back through the follow-up card's own turns.
- Re-pinned, each this round's own earlier re-pin or test: `r8-d38-055c3`, `r8-d38-055c3r`, `r8-d35-053a` line 233.
- One test edit, authorised by name: the held-board check of `tests/r7-brain-v68*` reads through a kept board of the open,
  already-asked card under a turn that ends on an invitation (a fresh board for an unsaid card still fails).

### What the offline matrix could not show

The cap's first matrix was clean on every gated check while walks the matrix does not reach broke three earlier checks
(found by the independent review, which drove them by hand). `tests/r8-d38-055gate.test.mjs` now drives those paths through
check-run's WHOLE gated list with an empty expected list: a card, a yes-or-no card and an asked step; four hearings, then
the one-more-wording turn, then each kind of child line; a clarify, a picture request, the Hindi form and a wait at four
hearings; two side-topics running; a remediation at the cap with its follow-up card right, wrong, told and given up; a
parked side-topic across all of these. Four review passes by one independent reviewer (no, no, no, yes) found ten, then
three, then four faults, all on driven paths and none a wrong mark; the last pass verified them fixed on 24 walks.

### A fault older than the round, found by that test and fixed here

Since commit 89dd33037 (round d30, 2026-11-18) the walk did not read a child's line as an answer to an asked worked step
once she had helped at that step: a child who said "pata nahi", was helped, and then gave the right answer was asked the
step again (release 63's tree, driven walk `old-step-give-right`); under the cap the same child would have heard "Nahi, yeh
nahi hai" and then her own answer. No run showed it, because the rule-based children answer only the question the walk
holds open, and after help at a step the walk held none: they said their next scripted line instead. `stepOnTable`
(`server/director/state.js`) puts the step's own item back after any help turn at it. In the offline matrix this changes 197
teacher rows in 9 of 36 lessons, each from the child's first line after help at an asked step; those paths had never been
heard and were read whole before the pair run. It was live for eight days, in releases up to 63.
Also fixed: at a yes-or-no card the told answer at a give-up was recorded under a verdict seam (the words were right).

### Measured: the pair run of 2026-11-26 (run `d38a`, commit 3f2e3e15a, 8 lessons, $0.50)

c4-maths-ch01-t02 (staged) and c6-maths-ch06-t01 (live), four rule-based children each, the scripts word for word
director37's; `check-run` exit 0 on the run, every gated predicate 0. Two judges, one a topic, against director37.
- **The step read after help: keep (both judges).** A right answer straight after help is confirmed (c4 offtopic 27, c6
  offtopic 17); no right answer asked again or called wrong, no wrong answer confirmed, no "Nahi" to a give-up, on any new
  path. The step that was heard eight times in director37 (c4 offtopic 22 to 46) is answered at its second hearing.
- **The cap: keep (both judges).** No question is heard more than four times in any of the eight lessons. c6 steering 22,
  where director37 told the answer with a wording unsaid, is now that wording and an invitation, and the child answers
  ("29 m"): "a real chance". c6 offtopic 34 the same. The c4 judge notes that in its topic no question reached the cap, so
  the cap is kept there untested.
- **Gate by hand:** c6-maths-ch06-t01 passes every line (150 of 150 beats, 108 of 108 verdicts, 0 contradictions, 0 wrong
  marks; listening 4, register 3.5, promises 4.5 → 4). c4-maths-ch01-t02: the walk passes every line (150 of 150, 95 of
  95, 0 wrong marks; listening 3.5 → 4), and the judge counts four contradictions, all one script row (the cake card's
  board has no tester under words that point at one: order `to-learning/026` section 1a; the same rows were in director37
  and counted 0 there). It stays staged.
- **Not reached by any child of the run, so kept unjudged:** the told answer after a bare "haan" that follows the
  one-more-wording turn; the told answer after "let me try", the go-ahead and a bare "haan"; the way back from a follow-up
  card at four hearings.
- **Outside both causes, found by the c6 judge:** offtopic 40, "Cricket wali baat maine likh li hai.", the walk's own
  fallback for a side-topic said again where the script has no kept form of its own (she wrote nothing down). Carried: the
  scripts get a form (order 026), and the fallback form leaves the walk in the next walk order.

### Carried to the next walk order

S1, S2, S3 as written above; the "maine likh li hai" fallback; a question's paraphrase inside help not counted as a hearing
(first review, never ruled); a second named-reason turn at one question for a second named answer (three help turns running,
each ending on an invitation); a named wrong answer at four hearings that gets the named reason where `skillRemediation`
wants the remediation (older than this round); the three unjudged turns above, to be put to the judges of the first run that
reaches them.
