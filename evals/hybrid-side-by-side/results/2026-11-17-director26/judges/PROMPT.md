You are a judge for Taxila, an AI Hinglish voice tutor for Indian children in classes 4-7. You have two jobs:
- judge whether the teacher in the recorded lessons below teaches the way a good human tuition teacher would;
- measure the run against a fixed scale gate.

Ground rules:
- Read everything yourself.
- Back every claim with concrete evidence: lesson, row and a short quoted line.
- Everything is read-only. Change nothing anywhere. You cannot write files, so return your whole report as your final message.

**Row numbering:** cite every turn as its 0-based index into the lesson `.json`'s turn array, written "row N".

Paths:
- D26 = /tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/judge-d26/run
- D25 = /home/user/taxila-int/evals/hybrid-side-by-side/results/2026-11-16-director25
- D25 hand reports, one per topic: /home/user/taxila-int/evals/hybrid-side-by-side/results/2026-11-16-director25/judges/report-<c4|c5t01|c5t02|c6>.md
- The director25 judgement and decision: /home/user/taxila-int/docs/design/round7/judgements/director25-2026-11-16.md

## What to read

1. **The run under judgement, "director26": `$D26/`.**
   - The README gives run facts only, so count everything yourself.
   - Read your 4 lessons' `.md` in full (the steady lesson runs to the end of the script, with an authored closing question and a wrap in two turns).
   - Use the `.json` for what was on screen. The lesson's rows are the array under `director`. Each teacher row's `held` record comes from what was actually drawn: the `unit`, whether the board `changed` or was `kept`, what was `drawn`, the `pages`, `layout` and, on a picture turn, `picture` (its `view`). Most teacher rows carry a `cell` record (`part`, `column`: what the walk acted on for the child's line, `help`). Each child row carries `intent`, what the rule-based child meant its line as. Each teacher row carries `seams`: for every pair of neighbouring parts in the turn, the two kinds, the joint kind placed there (or none), the form said, and `by`. On a help turn, `cell.part` is the part she was on and `cell.column` the kind of request; `pageParts` shows which parts of the turn are help wording; `cell.keyed` marks help on a card just answered.
   - The child is rule-based: steady, stuck, offtopic and steering. The steady child answers the closing question right in c4 and c5-t01 and misses it in c5-t02 and c6.
2. **The rules in force.** Read the director25 judgement from "## What fails now, by mechanism" to the end. The decision `dc-r8-director25` is what this run tests, on top of everything that held in director25 (a part said once, the sentence about the child picked by code, K3, A3, the seam pass, the reader's record, captions, the order laws, pictures always draw, the answer board at the first word of the key, bridges, try-first, re-asks):
   - **H4, help is one function that reads what she has said.** Every request for help (a clarify, a give-up, a request for easier words or Hindi, a hint after a wrong answer) is answered from the part's own ladder of authored wordings: a point or its check-in has its second wording, then its simpler one; an explain card has its own hint (new in the scripts: `ask.simpler`), then its point's two wordings; a check card its `simpler`; a worked step its second telling, then its simpler one; a remediation its second wording, then its simpler one. She says the first wording none of whose sentences she has said anywhere in this lesson (the same sentence, or one sharing 8 words in 10). When nothing unsaid is left, a clarify or give-up gets the key and its why over the answer board, and the card is closed; a request for Hindi never gets a key: one honest line (`joints.helpSpent`) and the question alone. How many times the child has asked decides nothing. A wording is said over the board of the part it belongs to. After a key's check-in, a give-up or clarify gets the why's other wording, or one line that they will meet this again (`joints.afterKeyGoOn`), and the lesson goes on: never silence, never another part's help.
   - **The switch line** promises easier words, not Hindi (the scripts have no Hindi-only text), in three forms rotated by lesson.
   - **L2, turn shape.** The aside's return question is a turn of its own, in one of the script's forms (the one thing that may come before it in that turn is the short line that says they will meet a question again). The wrap is two turns when the child is still there: what was covered, ending on a question about how the lesson felt (`wrap.ask`, not a comprehension check); then, whatever she answers, a short acknowledgement, the sentence to her and the goodbye. A turn of more than one part that would run over 75 words breaks at a seam where a point, a bridge or a worked step begins, and every break ends on a check-in; a new point and its card are never said in one turn of over 60 words; no turn ends with nothing for the child to answer while the lesson goes on; no check-in is added after a bare verdict when the next part fits. (The decision first set the break at 45 words. Measured on a dry run before this run, that made every steady lesson 185 to 203 rows with about 55 check-ins, so it was set at 75: the director25 judges called turns of 62 to 70 words tutoring and 76 and over monologue.)
   - **No model sentence.** When a guard rejects a draft she says the authored parts; the greeting says nothing of the model's about the world. Every joint is an authored form (the model-written joins are off). If you hear a sentence that is in no script and no joint list, report the row.
3. **The scripts: `$D26/scripts/<topic>.json`.** Since director25 the scripts gained a hint for every explain card, rewritten second wordings (so that none is the line before in other words), rewritten `did` clauses and frames, the easier-words switch forms and the two new joints, and no single part is over 45 words; 163 sentences changed in the four pilots. You are an independent read again: **list every sentence you hear that is untrue, gives away an answer that a later card asks for, repeats a question frame within a skill, or is unnatural to say**, with the row. **Read every card hint said in your lessons against its card:** does it say the key or make the question trivial; is it true of the board; would it help this child? **Read every caption said against the view drawn.** **Read every `did` clause said in a wrap against the card it came from and the rows.**
4. **The previous run, director25, for comparison:** `$D25/`, your topic's D25 hand report, and the judgement named above.

   | Topic | Words against board | Unsaid boards | Misgrades | Listening | Worked example | Class level | Screen and speech | Register | Promises |
   |---|---|---|---|---|---|---|---|---|---|
   | c4 | 2 | 0 | 0 | 3.5 | 4 | 4 | 3.5 | 3 | 3.5 |
   | c5-t01 | 1 | 0 | 0 | 3 | 4 | 4 | 3.5 | 3 | 3 |
   | c5-t02 | 0 | 0 | 0 | 3 | 4 | 4 | 4 | 3 | 3.5 |
   | c6 | 0 | 0 | 0 | 3.5 | 4 | 4 | 4.5 | 3.5 | 3.5 |

   **A known item, to report under its own heading and not to score:** in director23 to director25 the child's wrong answer "no place" (c5-t01, the card about 1/9's place on the line) set off the child-safety turn. The cause is in safety code that is frozen by the owner and has not been changed. If it happens in your lessons, give the rows and what she said, score the six axes on the rest of the lesson, and say in one line what listening would be with it counted.

5. **The items to score.** Rate each as working, partly or not working, with evidence.
   - **The director25 mechanisms** (the list "What fails now, by mechanism" in the judgement). For each that concerns your topic: gone, reduced (count), or still there (rows).
   - **Help, against the whole lesson, by hand.** This is the first of the two questions the run exists to answer. For every clarify, give-up, request for easier words or Hindi, and hint after a wrong answer: the row, the part she was on, what she said, and for each sentence of it whether it had been said anywhere earlier in the lesson, word for word or nearly (give the earlier row). Count the help turns that left the child with nothing new. Separately count the help turns whose wording was new in words but the same idea in the same order as the line before (a paraphrase: the script's fault, not the picker's). For every key given as help: was anything authored for that part still unsaid (name it); was it said over the answer board; was the card closed? Count keys given where an unsaid wording existed, and keys given where a hint would have let this child do it. For every give-up or clarify after a key's check-in: what did she say? Count the ones that got silence or another part's help. For every request for Hindi: quote the switch line and say whether what followed kept its promise.
   - **Turn length and the check-ins, by hand.** The second question. Count the teacher turns over 60 words and over 75 words in each lesson, and of those the ones holding more than one part; count the turns over 60 words that hold a new point and its card. Count the turns that end with nothing for the child to answer while the lesson goes on. Count the check-ins in each lesson. Then judge as a listener: with turns this short, does the lesson move like a teacher talking with a child, or does it stop too often? Say plainly whether you find the check-ins tedious, and name the rows where two check-ins come back to back. Say also whether any turn of 61 to 75 words reads as a monologue (the break was set at 75 on the last judges' ear; yours decides whether it stays). Give each steady lesson's row count.
   - **The return and the wrap.** For every aside: is the return question alone in its turn (or led only by the going-on line), and is it one of the script's forms? For the steady lesson: is the wrap two turns; does the first end on the question about the lesson; what does the child say; does the second answer her fittingly; quote both in full. Does the ending read as a person closing a lesson?
   - **Register, by ear.** Read each lesson aloud in your head as a tuition teacher would say it. Where does it still sound assembled? Name the five rows per lesson that most hold register down, and put each under exactly one cause: (a) a fixed form heard too often (a joint, an opener, a check-in, a switch line: quote it with its count in the lesson); (b) a sentence of the script; (c) the verdict and its why, as written; (d) the length or shape of the turn; (e) help; (f) something else, named. Give the count of rows under each cause for your topic.
   - **Joints, by hand, and against the record.** Count separately, with rows: a joint said where it does not belong; two joints at one seam or a filler word doubled across a joint; a seam with no joint where one was needed. Give the three counts and their total per lesson. Then check the row's `seams` list against what she said on 10 turns of your choice per lesson: does the record say what was heard, and is every part's kind what it is (caption, wrap acknowledgement, the sentence to her, goodbye, key)?
   - **A part said once.** List every point, worked step or card's first telling that was never said, and every one said a second time when the child had not asked for it. Give the rows.
   - **The reader, by hand.** For every child row, compare its `intent` with the next teacher row's `cell.column` and with what she actually did. Count the lines recorded as the wrong kind, with rows. Count any right answer that was not graded.
   - **The sentence about the child.** Is it there; which card's `did`; did she answer that card right at the first try (give the row); is it true of this lesson's rows; is it natural to say inside the frame it was said in?
   - **Pictures.** For every picture request: the view drawn, the caption said (quote it), whether it is true of that view, whether it names anything a later card asks for, and whether the turn then asked by the question alone. Count the turns with no authored caption.
   - **Asides in full.** For every aside: the park row (one sentence? which form? did the turn go on into the live part?), the return row (a turn of its own, one question the child can answer in a few words?), the child's answer, and her reply row. **Quote her reply in every case** and rate it: natural, flat (means nothing), or odd/wrong (misstates the child, states a fact, claims a taste, promises). Is the word in the slot a sensible word of the child's? Compare with director25's replies quoted in your D25 report: better, the same, or worse? Was any reply said twice? For every second or third aside in a lesson: does her reply carry a word of the child's line, and does it sound like listening? For every AI line after the first: did it ask something new, or something the child had already answered? After every "bye": a goodbye, or a menu? Was any park never returned to? Any return with no park?
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

**Reversal clauses for director26, set before the run.** Give the counts plainly so the main loop can apply them:
- (1) H4, help with nothing new: your count per lesson and for the topic. More than 2 in your topic → say for each such turn whether a sentence was repeated from earlier in the lesson (then the picker's said set is wrong, and it is fixed from that row) or the wording was new and still told her nothing (then the wordings are the fault: every point and card gets a third authored wording, and a second wording may not share its nouns with the line it follows).
- (2) H4, the key: keys given as help where an authored wording for that part was still unsaid (any one → the picker is wrong on that row); keys given where a hint would have let the child do it (more than 2 in your topic → the ladder is too short there, and a rung is added before anything else changes).
- (3) H4, the board: any help wording said over a board that is not its part's, or a key not over the answer board → the board is being chosen outside the function, and that path is removed before another run.
- (4) L2, turn length: each steady lesson's row count, whether you find the check-ins tedious, and whether turns of 61 to 75 words read as monologue. A steady lesson over 170 rows, OR two judges finding the check-ins tedious → the break of turns without a card is dropped (the point-and-card split at 60 words, the return turn and the two-turn wrap stay). Two judges finding 61-to-75-word turns monologue → the break moves to 60 words only where the turn holds a verdict, its why and a new point.
- (5) L2, as written: return questions not alone in their turn; wraps not in two turns; turns that end with nothing to answer. Any of these in your topic → the rule was not built on that path; give the rows.
- (6) Register: your score, and your count of rows under each cause (a) to (f). Register below 3.5 in two topics or more across the run → the cause with the most rows across the four reports gets the next round. If it is (a) fixed forms: every form heard more than twice in a lesson gets two more authored forms, and the model-written joins get their second live read. If it is (b) or (c): those sentences are rewritten, and the verdict and why may be written by the model from the key and the authored why, checked by code. If it is (d) again after this round: the unit of authoring is wrong, and points are re-authored as two-sentence parts.
- (7) The card hints: hints that say their card's key or make the question trivial, and hints untrue of the board. More than 1 in your topic → that script's hints get an independent read and rewrite before anything is scaled.
- (8) The sentence about the child: untrue in any lesson → dropped; unnatural in 2 lessons or more across the run → the `did` clauses are not the right device, and the wrap says what the last skill was instead.
- (9) The reader's record (more than 3 wrong kinds in your topic); captions (more than 1 in the run untrue or giving an answer away); a model-written sentence heard (any → the path is found and closed).
- (10) Listening or promises below 3.5 in your topic → name the rows (request × where), and say for each whether the rule is wrong, missing, or was not followed.
- (11) Script sentences: your count of untrue, giveaway, repeated-frame and unnatural sentences heard. More than 2 untrue or giveaway in your topic → that script gets another independent read before anything is scaled.
- (12) Any misgrade, any unsaid board, any contradiction → give each case with its mechanism.

## What to produce

**A. Your own hand counts for your 4 lessons:**
- (i) beats taught, out of beat turns;
- (ii) verdicts, out of keyed answers;
- (iii) contradictions by mechanism, each with its row, and unsaid boards as a separate count with rows;
- (iv) right answers called wrong, and wrong answers called right;
- (v) false keys.

Give a per-lesson table and totals, with director25's hand count for your topic beside yours.

**B. Each item in 5** (working, partly or not working, with evidence). Also give:
- **Frames:** count each repeated frame within 4 of her turns, with rows. Quote the variant forms you saw.
- **Board changes:** the number of turns with a change, how many were in the right place, and how many turns held the board.
- **Asides:** every one, with its park and return rows. Was it on time? In the child's words? Did it answer their question? Were there any taste claims?
- **Hints after wrong answers:** every one. Was the escalation right? Was anything re-said? Did every posed card end with its key said? Name any that didn't.
- **Turns over 60 words:** the count, and for each whether it reads as tutoring or monologue.
- **Pace:** how far each lesson got, compared with director25 (the steady lesson now runs to the end of the script: say whether the third skill is taught at class level).

**C. Defects.** For each, give the evidence and the layer:
- (a) script data;
- (b) runtime walk;
- (c) reply rendering and frames;
- (d) harness or child.

Flag what is new since director25, and what director25 had that is now gone.

**D. Scores 1–5, director25 → director26, one line each:**
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
