You are a judge for Taxila, an AI Hinglish voice tutor for Indian children in classes 4-7. You have two jobs:
- judge whether the teacher in the recorded lessons below teaches the way a good human tuition teacher would;
- measure the run against a fixed scale gate.

Ground rules:
- Read everything yourself.
- Back every claim with concrete evidence: lesson, row and a short quoted line.
- Everything is read-only. Change nothing anywhere. You cannot write files, so return your whole report as your final message.

**Row numbering:** cite every turn as its 0-based index into the lesson `.json`'s turn array, written "row N".

Paths:
- D28 = /tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/judge-d28/run
- D27 = /home/user/taxila-int/evals/hybrid-side-by-side/results/2026-11-17-director27
- D27 hand reports, one per topic: /home/user/taxila-int/evals/hybrid-side-by-side/results/2026-11-17-director27/judges/report-<c4|c5t01|c5t02|c6>.md
- The director27 judgement and decision: /home/user/taxila-int/docs/design/round7/judgements/director27-2026-11-17.md

## What to read

1. **The run under judgement, "director28": `$D28/`.**
   - The README gives run facts only, so count everything yourself.
   - Read your 4 lessons' `.md` in full (the steady lesson runs to the end of the script, with an authored closing question and a wrap in two turns).
   - Use the `.json` for what was on screen. The lesson's rows are the array under `director`. Each teacher row's `held` record comes from what was actually drawn: the `unit`, whether the board `changed` or was `kept`, what was `drawn`, the `pages` (each with the character it starts at), `layout` and, on a picture turn, `picture` (its `view`); `boardRef` is the board on screen at the turn's start. `pageParts` lists the parts said in the turn, where each starts and the board each part owns. Most teacher rows carry a `cell` record (`part`, `column`: what the walk acted on for the child's line, `help`). Each child row carries `intent`, what the rule-based child meant its line as. Each teacher row carries `seams`: for every pair of neighbouring parts in the turn, the two kinds, the joint kind placed there (or none), the form said, and `by`. On a help turn, `cell.part` is the part she was on and `cell.column` the kind of request; `cell.keyed` marks help after a key was said as help. A quick question's row has `cell.part` ending in `:quick`.
   - The child is rule-based: steady, stuck, offtopic and steering. The steady child answers the closing question right in c4 and c5-t01 and misses it in c5-t02 and c6. The children answer quick questions and asked steps from the keys as their kind does (steady right; stuck wrong or "pata nahi").
2. **The rules in force.** Read the director27 judgement from "## What fails now, by mechanism" to the end. The decision `dc-r8-director27` is what this run tests, on top of everything that held in director27 (help picked by one function from what she has not yet said and said over its own part's board; the key only when no wording is left, over the answer board; the authored stop line; a skill's own remediation; the aside's return as a turn of its own; the two-turn wrap; a turn of parts breaking at 75 words; a point and its own card sharing a turn to 75; the sentence about the child; replies with the child's word):
   - **P1, a turn's board is chosen part by part.** Each part that has a board of its own has it up from its own first word. A part with no board keeps what is up. A card's board is never drawn before the card's first word, on any path. In director27 this failed in four shapes: a remediation with its follow-up card in one turn (the card's board from the remediation's first word); the hook and first point over the first card's board; a remediation with no board said under its follow-up card's board; a card posed after the AI line without its own page.
   - **P2.** A remediation and its follow-up card are separate turns again; the remediation ends on its check-in.
   - **P3, a request gets help for the part she is on.** A clarify, a give-up or a request for easier words always gets a wording of that part, its key, or the authored line that says nothing easier is left; a back-to line with a card, or the next step, is never the whole answer. At a bridge's check-in the help is the bridge's own. After a key, one authored sentence says both that this will come again and that they now go back to the earlier question.
   - **P4.** A miss on the closing question gets its hint and the question again before any key.
   - **P5, joints.** A back-to line on every return to an earlier card. A lead-in before every worked problem. The line that says they will meet a question again only after a key said as help.
   - **Q1, a quick question where a card waits.** Where a verdict, its why and a new point leave no room for the card, the turn ends on a small authored question about the point just said (not on "samajh aaya?"). A right answer gets a short yes and the card; anything else gets the answer in one line and the card. No hint, no second try.
   - **Q2, a worked example done with the child.** At least one step of every worked example is asked, not told: a right answer gets a short confirmation, anything else gets the step told. The problem is never said alone, and no turn of a worked example ends on "Yeh kadam saaf hai?".
   - **R, a right answer goes on (decided after the build's dry run, `dc-r8-right-answer-goes-on`).** With quick questions in place the check-in left most often was a right answer's verdict and why standing alone. Two rules close it. (1) Every card has a short reason of 10 words or fewer (`whyShort` in the script); after a right answer only, it is said in the full why's place when the full why would leave no room for what follows (the row has `whyShort: true`). (2) Where a right verdict still stands alone before a worked example, the turn ends on an authored invitation to do the next problem together ("Agla sawaal hum dono saath mein karein?"), not on a comprehension check-in, and the next turn starts at the problem. The invitations are counted on their own line in the README; they are not counted as check-ins and are not hidden from you. A "phir se bolo" at a quick question gets the quick question again.
   - **Small paths.** After a request at the greeting the hook is said with the first point. A picture asked for after a key gets its authored caption. An aside reply is not said twice. A tired child's bye gets one sentence about that before the goodbye. A hint is followed by the card's authored re-ask where it has one.
   - **The measure set before the build:** at most 14 turns ending on a comprehension check-in in a steady lesson, none before a waiting card or inside a worked example, no turn over 75 words. The README gives the dry run's counts. Your ear decides whether what is left is too much. On the dry run c4's steady lesson is at 16, not 14 (its check-ins follow help, a remediation or a key, bar four); the other three are at 11, 8 and 10.
3. **The scripts: `$D28/scripts/<topic>.json`.** Since director27: every explain beat has a `quick` question with a key; worked examples have asked steps (`steps[].ask`); re-asks were rewritten so they do not do the card's work; hints were read against the board the card is posed on; each remediation either has a board its words speak or is an "imagine" telling with no board; the sentences the director27 judges named were rewritten. You are an independent read again: **list every sentence you hear that is untrue, gives away an answer that a later card asks for, repeats a question frame within a skill, or is unnatural to say**, with the row. **Read every quick question against its point and its card:** can a child who listened answer it in a word or two; is its key right (solve it yourself from the point and board); does it or its answer line hand over the card's answer? **Read every asked step the same way,** and say whether the child's own step still needs thinking after it. **Read every hint and re-ask said in your lessons against its card:** does it say the numbers of the answer, leave one option, or say something the board does not show? **Read every remediation's board against what she says over it.** **Read every caption said against the view drawn.**
4. **The previous run, director27, for comparison:** `$D27/`, your topic's D27 hand report, and the judgement named above.

   | Topic | Words against board | Unsaid boards (strict) | Misgrades | Listening | Worked example | Class level | Screen and speech | Register | Promises |
   |---|---|---|---|---|---|---|---|---|---|
   | c4 | 0 | 4 | 0 | 4 | 4 | 4 | 4 | 3.5 | 4 |
   | c5-t01 | 0 | 2 | 0 | 3 | 4 | 4 | 3.5 | 3.5 | 3.5 |
   | c5-t02 | 5 | 1 | 0 | 3.5 | 4 | 4 | 3 | 3.5 | 3.5 |
   | c6 | 2 | 4 | 0 | 4 | 4 | 4 | 3.5 | 3.5 | 3.5 |

   **The strict reading of an unsaid board, which you apply:** a board on screen that belongs to a card she has not yet said is an unsaid board, whatever is being said under it and whether or not the script lists that board under the part being said. In director27 two judges did not count a remediation said under its follow-up card's board; the main loop did.

   **A known item, to report under its own heading and not to score:** in director23 to director25 the child's wrong answer "no place" (c5-t01, the card about 1/9's place on the line) set off the child-safety turn; in director27 the line was said twice and got an ordinary miss verdict. The cause is in safety code that is frozen by the owner and has not been changed. If the safety turn happens in your lessons, give the rows and what she said, score the six axes on the rest of the lesson, and say in one line what listening would be with it counted.

5. **The items to score.** Rate each as working, partly or not working, with evidence.
   - **The director27 mechanisms** (the list "What fails now, by mechanism" in the judgement). For each that concerns your topic: gone, reduced (count), or still there (rows).
   - **Every turn's board, part by part, by hand.** This is the first question the run exists to answer. For every teacher turn that holds more than one part, every turn after an aside, the AI line, a return or a request at the greeting, every remediation, every help turn and every key: the parts said, the board up at each part's first word (`held.pages` against `pageParts`), and whether that board is that part's own or a board kept from an earlier part. Count, with rows: turns where a board is up for a card not yet said (unsaid boards, strict reading); turns where a part that owns a board is said without it; turns where a card is said without its board; help turns over another part's board. For every remediation: is its board true of what she says over it, and does it show anything a later card asks for? For every key given as help: over the answer board?
   - **Help, against the whole lesson, by hand.** For each help turn, whether any sentence of it had been said anywhere earlier in the lesson, word for word or nearly (give the earlier row). Count the help turns that left the child with nothing new. Separately count the help turns whose wording was new in words but the same idea in the same order as the line before. Count keys given where an authored wording for that part was still unsaid (the closing question included), and keys given where a hint would have let this child do it. **For every give-up, clarify or request for easier words anywhere in the lesson: what did the turn that answered it contain for the child?** Count the ones that got silence, a bare card, a back-to line and a card, the next step, or another part's help, with rows. Count the times the "nothing easier is left" line was said and say whether it was true (was a wording of that part still unsaid?).
   - **Quick questions, by hand.** The second question. For every quick question asked: the row, the point it follows, the question (quote it), the child's answer, what she said next (quote it), and the card that followed. Rate each: a real small step (the child does something that the point taught), a quiz that tests nothing, or the card asked twice. Was the child's answer read right (a right answer given the yes, anything else the answer line)? Did the question, the yes or the answer line give away the card's answer? Did a quick question appear where the point and its card would have fitted one turn, or fail to appear where a turn ended on a check-in with the card waiting? Count each. Say plainly whether the quick questions make the lesson better, the same or worse than "samajh aaya?" at those places, and why.
   - **Check-ins and the worked examples, by hand.** Count the turns that end on a comprehension check-in in each lesson, and the longest run back to back; name the rows of every run of three or more and say whether the child's own requests made it. Count the check-ins said before a waiting card and inside a worked example (both should be 0; give rows). For every worked example: the turns it took, which step was asked, the child's answer and her confirmation or telling (quote them), whether the problem was said alone, and whether the child's own step still needed thinking. Does it read as a teacher working a problem with a child, as a recital, or as a quiz? Say plainly whether you find the remaining check-ins tedious, and where (after help; after a remediation; after a bridge; a close alone; another, named). Count the teacher turns over 60 words and over 75 words; say whether any turn of 61 to 75 words reads as a monologue. Give each steady lesson's row count. **Count the invitations too** (turns ending on an invitation to a worked problem) and say what each reads as: a natural step into the problem, a check-in in disguise, or a tic. **For every row with `whyShort: true`:** quote the short reason; after it, is the right answer explained enough for that child, and is the short reason true?
   - **Joints, by hand, and against the record.** Count separately, with rows: a joint said where it does not belong (the "we will meet this again" line anywhere but after a key said as help); two joints at one seam; a return to an earlier card with no back-to line; a worked problem with no lead-in; any other seam that reads abrupt (quote it). Give the counts and their total per lesson. Quote the after-key return form each time it is said and say whether it sounds like a person. Then check the row's `seams` list against what she said on 10 turns of your choice per lesson: does the record say what was heard, is a help wording recorded as help, a verdict only where one was said, and the opener, the stop line and the closing question's lead-in as their own kinds?
   - **The stop path and model words.** For every turn after a child says she wants to stop or says bye: quote it. Is it an authored line? Any sentence in your lessons that is in no script, no joint list and no code line: give the row.
   - **A mix-up met again.** For every wrong answer that shows a mix-up the child already showed earlier in the lesson: what did she get, and was it the remediation of the skill she is in?
   - **The return and the wrap.** For every aside: is the return question alone in its turn (or led only by the going-on line), and is it one of the script's forms? Her reply to the child's answer: does it carry the child's word? For the steady lesson: the wrap's two turns quoted in full; does the closing verdict say its why; does the second turn's first line fit what the child answered? Does the ending read as a person closing a lesson?
   - **Register, by ear.** Read each lesson aloud in your head as a tuition teacher would say it. Where does it still sound assembled? Name the five rows per lesson that most hold register down, and put each under exactly one cause: (a) a fixed form heard too often (quote it with its count in the lesson); (b) a sentence of the script; (c) the verdict and its why, as written; (d) the length or shape of the turn; (e) help; (f) something else, named. Give the count of rows under each cause for your topic.
   - **A part said once.** List every point, worked step or card's first telling that was never said, and every one said a second time when the child had not asked for it. Give the rows.
   - **The reader, by hand.** For every child row, compare its `intent` with the next teacher row's `cell.column` and with what she actually did. Count the lines recorded as the wrong kind, with rows. Count any right answer that was not graded.
   - **The sentence about the child.** Is it there; which card's `did`; did she answer that card right at the first try (give the row); is it true and natural?
   - **Pictures.** For every picture request: the view drawn, the caption said (quote it), whether it is true of that view, whether it names anything a later card asks for, and whether the turn then asked by the question alone. Count the turns with no authored caption.
   - **Asides in full.** For every aside: the park row (one sentence? which form? did the turn go on into the live part?), the return row (a turn of its own, one question the child can answer in a few words?), the child's answer, and her reply row. **Quote her reply in every case** and rate it: natural, flat (means nothing), or odd/wrong (misstates the child, states a fact, claims a taste, promises). Is the word in the slot a sensible word of the child's? Compare with director27's replies quoted in your D27 report: better, the same, or worse? Was any reply said twice? For every second or third aside in a lesson: does her reply carry a word of the child's line, and does it sound like listening? For every AI line after the first: did it ask something new, or something the child had already answered? After every "bye": a goodbye, or a menu? Was any park never returned to? Any return with no park?
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

**Reversal clauses for director28, set before the run.** Give the counts plainly so the main loop can apply them:
- (1) P1, the board: turns where a board is up for a card not yet said; turns where a part that owns a board is said without it; turns where a card is said without its board; help turns over another part's board (give each row and whose board it was). Any one in the run → pages stop being derived from the walk's move at all: every part carries its page from the script compile and the walk only concatenates. A remediation board untrue of its words, or showing a later answer: more than 1 in your topic → that script's remediation boards are redrawn before anything is scaled.
- (2) The picker: help turns with nothing new (more than 2 in your topic → for each, say whether a sentence was repeated or the wording was new and empty); keys given with a wording unsaid, the closing question included (any → the picker is wrong on that row); keys where a hint would have done (more than 2 in your topic → a rung is added there).
- (3) P3, a request answered without help: requests that got silence, a bare card, a back-to line and a card, the next step, or another part's help. Any one → a turn for a request cannot be built without a help part (a hard precondition in the walk), and that row is its test. The "nothing easier is left" line said while a wording of that part was unsaid: any → the picker is wrong on that row.
- (4) Quick questions and check-ins: each steady lesson's row count, its check-in turns and its longest run; check-ins before a waiting card or inside a worked example (any → the path is found and closed; give the rows). For the quick questions, your counts of real small steps, quizzes that test nothing and cards asked twice, and your plain verdict (better, the same, worse than the check-in). Two judges finding them a quiz or worse than the check-in → quick questions are kept only in worked examples, and the place before a waiting card is closed by a short why on right answers so the point and its card share the turn. A quick question, its yes or its answer line giving away its card's answer: any in your topic → that topic's quick questions are re-read before anything is scaled. A quick answer read wrongly (a right answer given the answer line, or a wrong one given the yes): any → the accept lists are the fault and quick questions go two-option only. Two judges finding the remaining check-ins tedious → the next round acts on the kind of turn most often named (say which: after help; after a remediation; after a bridge; a close alone; another). Two judges naming the remediation's check-in → the remediation ends on its follow-up card when both fit 60 words, and the remediations are cut to fit. Short reasons and invitations: your count of each and your reading. Two judges finding right answers under-explained where the short reason was said → the short form is used only when the next part is a point, never before a card. Two judges finding the invitation a tic or a check-in in disguise → the verdict's turn ends on the worked example's first asked step, with the problem cut to fit. Two judges finding the 61 to 75 word turns that hold a verdict, a bridge, a point and a quick question a monologue → a bridge takes its own turn again and such turns break at 60.
- (5) Joints: the "we will meet this again" line anywhere but after a key said as help, or two joints at one seam (any → the rule was not built on that path; give the rows); returns to an earlier card with no back-to line (any → the path is found and closed); other seams that read abrupt (more than 2 in your topic → a form is authored for that place).
- (6) Model words and the stop path: a stop turn that is not the authored line, or any model-written sentence heard (any → the path is found and closed; give the row and the sentence).
- (7) R1: the same remediation said twice in a lesson, or a remediation said for a mix-up the child did not show (any → "said once" goes back to the mix-up, and the later skill's cards get a hint for it instead).
- (8) Hints and re-asks: hints said in your lessons that state the numbers of the answer, leave one option, or are untrue of the board the card is posed on; re-asks that do the card's work or need givens no longer in front of the child. More than 1 in your topic → that script's hints and re-asks get another independent read before anything is scaled.
- (9) Register: your score, and your count of rows under each cause (a) to (f). Register below 3.5 in two topics or more across the run → the cause with the most rows across the four reports gets the next round.
- (10) The reader's record (more than 3 wrong kinds in your topic); captions (more than 1 in the run untrue, giving an answer away, or not authored); the sentence about the child (untrue in any lesson).
- (11) Listening or promises below 3.5 in your topic → name the rows (request × where), and say for each whether the rule is wrong, missing, or was not followed.
- (12) Script sentences: your count of untrue, giveaway, repeated-frame and unnatural sentences heard; quick questions or asked steps with a wrong key (any → that script's keys are blind-solved again before anything is scaled). More than 2 untrue or giveaway in your topic → that script gets another independent read before anything is scaled.
- (13) Any misgrade, any unsaid board (strict reading), any contradiction → give each case with its mechanism.
- (14) The worked example: your score. Below 4 in two topics across the run → the asked step is the wrong step and moves; the examples do not go back to telling.

## What to produce

**A. Your own hand counts for your 4 lessons:**
- (i) beats taught, out of beat turns;
- (ii) verdicts, out of keyed answers;
- (iii) contradictions by mechanism, each with its row, and unsaid boards as a separate count with rows;
- (iv) right answers called wrong, and wrong answers called right;
- (v) false keys.

Give a per-lesson table and totals, with director27's hand count for your topic beside yours.

**B. Each item in 5** (working, partly or not working, with evidence). Also give:
- **Frames:** count each repeated frame within 4 of her turns, with rows. Quote the variant forms you saw.
- **Board changes:** the number of turns with a change, how many were in the right place, and how many turns held the board.
- **Asides:** every one, with its park and return rows. Was it on time? In the child's words? Did it answer their question? Were there any taste claims?
- **Hints after wrong answers:** every one. Was the escalation right? Was anything re-said? Did every posed card end with its key said? Name any that didn't.
- **Turns over 60 words:** the count, and for each whether it reads as tutoring or monologue.
- **Pace:** how far each lesson got, compared with director27 (the steady lesson now runs to the end of the script: say whether the third skill is taught at class level).

**C. Defects.** For each, give the evidence and the layer:
- (a) script data;
- (b) runtime walk;
- (c) reply rendering and frames;
- (d) harness or child.

Flag what is new since director27, and what director27 had that is now gone.

**D. Scores 1–5, director27 → director28, one line each:**
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
