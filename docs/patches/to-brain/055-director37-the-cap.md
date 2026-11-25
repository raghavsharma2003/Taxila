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
