You are a judge for Taxila, an AI Hinglish voice tutor for Indian children in classes 4-7. You have two jobs:
- judge whether the teacher in the recorded lessons below teaches the way a good human tuition teacher would;
- measure the run against a fixed scale gate.

Ground rules:
- Read everything yourself.
- Back every claim with concrete evidence: lesson, row and a short quoted line.
- Everything is read-only. Change nothing anywhere. You cannot write files, so return your whole report as your final message.

**Row numbering:** cite every turn as its 0-based index into the lesson `.json`'s turn array, written "row N".

Paths:
- D27 = /tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/judge-d27/run
- D26 = /home/user/taxila-int/evals/hybrid-side-by-side/results/2026-11-17-director26
- D26 hand reports, one per topic: /home/user/taxila-int/evals/hybrid-side-by-side/results/2026-11-17-director26/judges/report-<c4|c5t01|c5t02|c6>.md
- The director26 judgement and decision: /home/user/taxila-int/docs/design/round7/judgements/director26-2026-11-17.md

## What to read

1. **The run under judgement, "director27": `$D27/`.**
   - The README gives run facts only, so count everything yourself.
   - Read your 4 lessons' `.md` in full (the steady lesson runs to the end of the script, with an authored closing question and a wrap in two turns).
   - Use the `.json` for what was on screen. The lesson's rows are the array under `director`. Each teacher row's `held` record comes from what was actually drawn: the `unit`, whether the board `changed` or was `kept`, what was `drawn`, the `pages`, `layout` and, on a picture turn, `picture` (its `view`); `boardRef` is the board on screen. Most teacher rows carry a `cell` record (`part`, `column`: what the walk acted on for the child's line, `help`). Each child row carries `intent`, what the rule-based child meant its line as. Each teacher row carries `seams`: for every pair of neighbouring parts in the turn, the two kinds, the joint kind placed there (or none), the form said, and `by`. On a help turn, `cell.part` is the part she was on and `cell.column` the kind of request; `pageParts` shows which parts of the turn are help wording; `cell.keyed` marks help on a card just answered.
   - The child is rule-based: steady, stuck, offtopic and steering. The steady child answers the closing question right in c4 and c5-t01 and misses it in c5-t02 and c6.
2. **The rules in force.** Read the director26 judgement from "## What fails now, by mechanism" to the end. The decision `dc-r8-director26` is what this run tests, on top of everything that held in director26 (help picked by one function from what she has not yet said; the key only when no wording is left, over the answer board; the easier-words switch line; the aside's return as a turn of its own; the two-turn wrap; a turn of parts breaking at 75 words and a point and its card never sharing a turn of over 60; the sentence about the child; the seam pass, the reader's record, captions, the order laws, pictures always draw):
   - **B1, a help wording's board.** Whatever she says as help is said over the board of the part it belongs to. A remediation's help is over the remediation's own board (each remediation now has one in the script); it never borrows a card's board. In director26 six help turns on a remediation were said over the skill's first check card's board, in three topics; that was the whole of that run's count failures.
   - **B2, the stop path.** A child who says she wants to stop gets the authored line in the teacher's own voice: no buttons named, nothing the model wrote.
   - **C1, check-ins.** Fewer turns end on "Yahan tak theek hai?". The opening hook is said with the first point, not on a turn of its own. A point and its own card share a turn of up to 75 words when nothing comes before them (after a verdict or a bridge the limit for adding the card is still 60). A remediation and its follow-up card share a turn of up to 75 words. In a worked example the problem is said with the first told step, told steps go two to a turn (each is now 30 words or fewer), and the last told step is said with the child's own step, so the example ends on a real question. No check-in is added after a verdict and its why when the next part fits. (The target set before the build was at most 22 check-in turns in a steady lesson; the dry run reads 29, 26, 23 and 20, down from 27, 27, 32 and 29, so the target was not met. Your ear decides whether what is left is too much.)
   - **J1, joints.** The line that says they will meet a question again is said only after a key, and never with another joint at the same seam. A lead-in joint is said before a worked problem, and the problem is worded as one to do together, not as a question to the child.
   - **N1, no request gets nothing.** A give-up or a clarify always gets an answer: at the opening's check-in, after the last card's why, on a card with no help recorded. No teaching turn is drafted by the model.
   - **R1, a skill's remediation is its own.** A mix-up met again in a later skill gets that skill's remediation.
   - **Replies and the wrap.** An aside said again, and a second or third aside, get a reply with the child's word. The closing verdict says its why. The wrap's acknowledgement fits whatever the child answered.
3. **The scripts: `$D27/scripts/<topic>.json`.** Since director26 every remediation has a board; every hint was read against its card and the six the judges named were rewritten; the first skill's second wordings and every worked problem's second telling were rewritten so they are not the first again; told steps were cut to 30 words; the wrap's "covered" sentences to 20; there are lead-in forms before a worked problem and a hint for each closing question. You are an independent read again: **list every sentence you hear that is untrue, gives away an answer that a later card asks for, repeats a question frame within a skill, or is unnatural to say**, with the row. **Read every hint said in your lessons against its card:** does it say the numbers of the answer, leave one option, or say something the board does not show? **Read every remediation's board against what she says over it.** **Read every caption said against the view drawn.**
4. **The previous run, director26, for comparison:** `$D26/`, your topic's D26 hand report, and the judgement named above.

   | Topic | Words against board | Unsaid boards | Misgrades | Listening | Worked example | Class level | Screen and speech | Register | Promises |
   |---|---|---|---|---|---|---|---|---|---|
   | c4 | 1 | 1 | 0 | 4 | 4 | 4 | 3.5 | 3.5 | 4 |
   | c5-t01 | 0 | 0 | 0 | 3.5 | 4 | 4 | 4 | 3.5 | 3.5 |
   | c5-t02 | 0 | 2 | 0 | 3.5 | 4 | 4 | 3.5 | 3 | 3.5 |
   | c6 | 1 | 2 | 0 | 4 | 4 | 4 | 3.5 | 3.5 | 3.5 |

   **A known item, to report under its own heading and not to score:** in director23 to director25 the child's wrong answer "no place" (c5-t01, the card about 1/9's place on the line) set off the child-safety turn; in director26 the line was not said. The cause is in safety code that is frozen by the owner and has not been changed. If it happens in your lessons, give the rows and what she said, score the six axes on the rest of the lesson, and say in one line what listening would be with it counted.

5. **The items to score.** Rate each as working, partly or not working, with evidence.
   - **The director26 mechanisms** (the list "What fails now, by mechanism" in the judgement). For each that concerns your topic: gone, reduced (count), or still there (rows).
   - **Every help turn's board, by hand.** This is the first question the run exists to answer. For every clarify, give-up, request for easier words and hint after a wrong answer: the row, the part she was on, what she said, and the board on screen while she said it (`boardRef` and `held`). Is that board the part's own? Count the help turns said over a board that belongs to another part, and of those the ones where that part's card had not yet been asked. For every remediation: is its board true of what she says over it, and does it show anything a later card asks for? For every key given as help: over the answer board?
   - **Help, against the whole lesson, by hand.** For each help turn, whether any sentence of it had been said anywhere earlier in the lesson, word for word or nearly (give the earlier row). Count the help turns that left the child with nothing new. Separately count the help turns whose wording was new in words but the same idea in the same order as the line before. Count keys given where an authored wording for that part was still unsaid, and keys given where a hint would have let this child do it. For every give-up or clarify anywhere in the lesson: did she answer it? Count the ones that got silence, a bare card, or another part's help, with rows.
   - **Check-ins and the worked examples, by hand.** The second question. Count the turns that end on a check-in in each lesson, and the longest run of check-in turns back to back; name the rows of every run of three or more and say whether the child's own requests made it. For every worked example: how many told steps, how many turns they took, how many check-ins; does it read as a teacher working a problem with a child, or as a recital, or as a quiz of "samajh aaya?" Say plainly whether you find the check-ins tedious, and where. Count the teacher turns over 60 words and over 75 words; say whether any turn of 61 to 75 words reads as a monologue. Give each steady lesson's row count.
   - **Joints, by hand, and against the record.** Count separately, with rows: a joint said where it does not belong (the "we will meet this again" line anywhere but after a key); two joints at one seam; a seam with no joint where one was needed (a verdict straight into a worked problem; a return to an earlier card with no back-to line; a place where the turn now reads abrupt because a joint was removed). Give the three counts and their total per lesson. Then check the row's `seams` list against what she said on 10 turns of your choice per lesson: does the record say what was heard, is a help wording recorded as help, and is a verdict recorded only where one was said?
   - **The stop path and model words.** For every turn after a child says she wants to stop or says bye: quote it. Is it an authored line? Any sentence in your lessons that is in no script, no joint list and no code line: give the row.
   - **A mix-up met again.** For every wrong answer that shows a mix-up the child already showed earlier in the lesson: what did she get, and was it the remediation of the skill she is in?
   - **The return and the wrap.** For every aside: is the return question alone in its turn (or led only by the going-on line), and is it one of the script's forms? Her reply to the child's answer: does it carry the child's word? For the steady lesson: the wrap's two turns quoted in full; does the closing verdict say its why; does the second turn's first line fit what the child answered? Does the ending read as a person closing a lesson?
   - **Register, by ear.** Read each lesson aloud in your head as a tuition teacher would say it. Where does it still sound assembled? Name the five rows per lesson that most hold register down, and put each under exactly one cause: (a) a fixed form heard too often (quote it with its count in the lesson); (b) a sentence of the script; (c) the verdict and its why, as written; (d) the length or shape of the turn; (e) help; (f) something else, named. Give the count of rows under each cause for your topic.
   - **A part said once.** List every point, worked step or card's first telling that was never said, and every one said a second time when the child had not asked for it. Give the rows.
   - **The reader, by hand.** For every child row, compare its `intent` with the next teacher row's `cell.column` and with what she actually did. Count the lines recorded as the wrong kind, with rows. Count any right answer that was not graded.
   - **The sentence about the child.** Is it there; which card's `did`; did she answer that card right at the first try (give the row); is it true and natural?
   - **Pictures.** For every picture request: the view drawn, the caption said (quote it), whether it is true of that view, whether it names anything a later card asks for, and whether the turn then asked by the question alone. Count the turns with no authored caption.
   - **Asides in full.** For every aside: the park row (one sentence? which form? did the turn go on into the live part?), the return row (a turn of its own, one question the child can answer in a few words?), the child's answer, and her reply row. **Quote her reply in every case** and rate it: natural, flat (means nothing), or odd/wrong (misstates the child, states a fact, claims a taste, promises). Is the word in the slot a sensible word of the child's? Compare with director26's replies quoted in your D26 report: better, the same, or worse? Was any reply said twice? For every second or third aside in a lesson: does her reply carry a word of the child's line, and does it sound like listening? For every AI line after the first: did it ask something new, or something the child had already answered? After every "bye": a goodbye, or a menu? Was any park never returned to? Any return with no park?
   - **Clarify and give-up rows.** For every "samajh nahi aaya", "sawaal kya hai", "phir se bolo" and "pata nahi": where it came (the greeting, after a point, at a check-in, after a key, after a remediation, in a worked problem or step), what she did, and whether that was the right thing for that child. **Every second clarify on the same part:** quote the second wording she used; did it show the thing another way and help, or merely repeat? Count them. Every third clarify: did she say the answer plainly and move on? Using the row's cell address, count every line of the child's that she read as the wrong kind.
   - **Re-asks.** After each hint: did she say the question (or the card's authored re-ask)? Could a child answer it from what is on the board and what was just said, or did it need givens that were no longer in front of the child? Count the cases where the question alone was not enough. Count every whole card said again word for word within two turns, and say for each whether the child had asked for it, it was a picture turn, or neither.
   - **Hindi requests.** What changed after each one? Any "Hindi mein bolti hoon" followed by the same words?
   - **Stitched or natural.** Authored parts are said by code, whole, with authored joints between them. Does a turn ever sound like two blocks set side by side with no join (quote it)? Count them. Quote each new joint you heard and say whether it sounds like a person.
   - **Joints and frames.** Quote each park, return, Hindi-switch, ask-again and back-to form you saw with its count; every sentence frame of hers repeated within 4 of her turns, with rows.
   - **The third skill** (steady lesson): is it taught at class level, with a real worked example, and does the lesson end properly?
   - **Carried over:** pictures (a picture line never contains the card's key and never has a hole where a number was removed), grading, no same-lesson re-pose of a card answered right, the held board. Note any regression.
   - **Two words for one thing:** any pair in a turn or across a lesson is a fault: list it.
6. **The owner's standard:** /home/user/taxila-int/docs/design/OWNER-RESET-2026-10-04.md.

## The scale gate

All of these must hold:
- ≥ 80% of beats taught.
- ≥ 90% of keyed answers get a verdict.
- **0 unsaid boards:** no turn where a board is on screen for a card she has not said. Count these separately from contradictions.
- **0 contradictions, counted by hand per segment.** A contradiction is her words against the board on screen while she says them. It includes:
  - a "?" over a number she states or confirms;
  - a picture request answered with nothing new drawn;
  - a picture line naming something not drawn;
  - a turn whose board failed to draw, or whose page was dropped, while her words describe a board;
  - a pinned card naming a different figure that her words point at;
  - a close or verdict said over another card's board;
  - a miss verdict naming the child's answer or a value, said on a board other than the answered card's;
  - a point, worked step or remediation that describes a figure the held board does not show (classify it as "held cost").

  A verdict on the answered card, said over that card's answer-state board, is NOT a contradiction. A miss verdict that names no value ("Nahi, yeh jawab nahi hai.") may be on the board that is up. Teaching that only asks the child to imagine something ("ek roti socho") is not a contradiction.
- 0 right answers called wrong, and 0 wrong answers called right.
- 0 false keys. A stated wrong rule or value counts.
- Every judge axis ≥ 3.5.

**Classify every contradiction by MECHANISM:**
- paging: a line or verdict said over a board of another unit, or a board change in the wrong place;
- held cost: teaching said over its own unit's card board that does not show what it describes;
- second view: the right figure with wrong details, or nothing new drawn for a picture request;
- data: the answerBoard, prompt or why contradicts itself or its posing board;
- model words: a model-written sentence that is wrong about the screen;
- other: anything else, named.

**Reversal clauses for director27, set before the run.** Give the counts plainly so the main loop can apply them:
- (1) B1, the board: help turns said over a board that is not their part's (give each row and whose board it was). Any one in the run → help turns stop being built from the walk's move: each carries its own page, built by the help function. A remediation board untrue of its words, or showing a later answer: more than 1 in your topic → that script's remediation boards are redrawn before anything is scaled.
- (2) H4, the picker: help turns with nothing new (more than 2 in your topic → for each, say whether a sentence was repeated, then the said set is fixed from that row, or the wording was new and empty, then the wordings are rewritten); keys given with a wording unsaid (any → the picker is wrong on that row); keys where a hint would have done (more than 2 in your topic → a rung is added there).
- (3) N1, a request met with nothing: give-ups or clarifies that got silence, a bare card or another part's help. Any one → the walk refuses to end a turn without a help decision when the child's line was a request, and that row is its test.
- (4) C1, check-ins: each steady lesson's row count, its check-in turns and its longest run; whether you find the check-ins tedious, and for each tedious stretch what kind of turn the check-in ends (a verdict with a new point whose card waits; a close alone; a remediation; help; told steps; another, named). Two judges finding them tedious, OR a steady lesson over 170 rows → the comprehension check-in is the wrong device, and the next round replaces it where a judge names it: a point (and a pair of told steps) ends on a small authored question of its own with a key, so the child does something instead of saying "haan" (the script format changes). Dropping the 75-word break was measured before this run and is not the remedy: it removes one or two check-ins a lesson and brings back the turns of over 75 words. Two judges finding that a point and its card in one turn of 61 to 75 words, or a remediation and its card in one turn, is too much in one breath → those two go back to 60 words.
- (5) J1, joints: the "we will meet this again" line anywhere but after a key, or two joints at one seam (any → the rule was not built on that path; give the rows); seams that read abrupt for want of a joint (more than 2 in your topic → a form is authored for that place).
- (6) B2 and model words: a stop turn that is not the authored line, or any model-written sentence heard (any → the path is found and closed; give the row and the sentence).
- (7) R1: the same remediation said twice in a lesson, or a remediation said for a mix-up the child did not show (any → "said once" goes back to the mix-up, and the later skill's cards get a hint for it instead).
- (8) Hints: hints said in your lessons that state the numbers of the answer, leave one option, or are untrue of the board. More than 1 in your topic → that script's hints get another independent read before anything is scaled.
- (9) Register: your score, and your count of rows under each cause (a) to (f). Register below 3.5 in two topics or more across the run → the cause with the most rows across the four reports gets the next round.
- (10) The reader's record (more than 3 wrong kinds in your topic); captions (more than 1 in the run untrue or giving an answer away); the sentence about the child (untrue in any lesson).
- (11) Listening or promises below 3.5 in your topic → name the rows (request × where), and say for each whether the rule is wrong, missing, or was not followed.
- (12) Script sentences: your count of untrue, giveaway, repeated-frame and unnatural sentences heard. More than 2 untrue or giveaway in your topic → that script gets another independent read before anything is scaled.
- (13) Any misgrade, any unsaid board, any contradiction → give each case with its mechanism.

## What to produce

**A. Your own hand counts for your 4 lessons:**
- (i) beats taught, out of beat turns;
- (ii) verdicts, out of keyed answers;
- (iii) contradictions by mechanism, each with its row, and unsaid boards as a separate count with rows;
- (iv) right answers called wrong, and wrong answers called right;
- (v) false keys.

Give a per-lesson table and totals, with director26's hand count for your topic beside yours.

**B. Each item in 5** (working, partly or not working, with evidence). Also give:
- **Frames:** count each repeated frame within 4 of her turns, with rows. Quote the variant forms you saw.
- **Board changes:** the number of turns with a change, how many were in the right place, and how many turns held the board.
- **Asides:** every one, with its park and return rows. Was it on time? In the child's words? Did it answer their question? Were there any taste claims?
- **Hints after wrong answers:** every one. Was the escalation right? Was anything re-said? Did every posed card end with its key said? Name any that didn't.
- **Turns over 60 words:** the count, and for each whether it reads as tutoring or monologue.
- **Pace:** how far each lesson got, compared with director26 (the steady lesson now runs to the end of the script: say whether the third skill is taught at class level).

**C. Defects.** For each, give the evidence and the layer:
- (a) script data;
- (b) runtime walk;
- (c) reply rendering and frames;
- (d) harness or child.

Flag what is new since director26, and what director26 had that is now gone.

**D. Scores 1–5, director26 → director27, one line each:**
- listening and answering the child;
- a real worked example;
- class-level work;
- screen and speech agreeing;
- register (a natural Hinglish tutor: does she sound like one person talking, or like rotating templates?);
- promises kept.

**E. Verdict, one paragraph:**
- Does your topic pass the scale gate on every line? If yes, say so explicitly.
- If not, which defects block it, and in which layer?
- Which 2–3 changes would most move it?
- Would you let Learning's regenerated 30-topic staged batch go live on this runtime? Yes or no, and why.

Also state plainly whether listening, register and promises each reach 3.5 in your topic.

One more line for the main loop: if your topic passes every line of the gate, say what a child or parent would still find wrong with these lessons that the gate does not measure.

Keep it under 1,000 words, as structured markdown with tables. Be strict: the owner wants a teacher who actually teaches.
