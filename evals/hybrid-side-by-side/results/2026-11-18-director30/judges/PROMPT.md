You are a judge for Taxila, an AI Hinglish voice tutor for Indian children in classes 4-7. You have two jobs:
- judge whether the teacher in the recorded lessons below teaches the way a good human tuition teacher would;
- measure the run against a fixed scale gate.

Ground rules:
- Read everything yourself.
- Back every claim with concrete evidence: lesson, row and a short quoted line.
- Everything is read-only. Change nothing anywhere. You cannot write files, so return your whole report as your final message.

**Row numbering:** cite every turn as its 0-based index into the lesson `.json`'s turn array, written "row N".

Paths:
- D30 = /tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/judge-d30/run
- D29 = /home/user/taxila-int/evals/hybrid-side-by-side/results/2026-11-18-director29
- D29 hand reports, one per topic: /home/user/taxila-int/evals/hybrid-side-by-side/results/2026-11-18-director29/judges/report-<c4|c5t01|c5t02|c6>.md
- The director29 judgement and decision: /home/user/taxila-int/docs/design/round7/judgements/director29-2026-11-18.md

## What to read

1. **The run under judgement, "director30": `$D30/`.**
   - The README gives run facts only, so count everything yourself.
   - Read your 4 lessons' `.md` in full (the steady lesson runs to the end of the script, with an authored closing question and a wrap in two turns).
   - Use the `.json` for what was on screen. The lesson's rows are the array under `director`. Each teacher row's `held` record comes from what was actually drawn: the `unit`, whether the board `changed` or was `kept`, what was `drawn`, the `pages` (each with the character it starts at), `layout` and, on a picture turn, `picture` (its `view`); `boardRef` is the board on screen at the turn's start. `pageParts` lists the parts said in the turn, where each starts and the board each part owns (a joint, a lead-in, a hook, a bridge with no board and a remediation with no board own none). Most teacher rows carry a `cell` record (`part`, `column`: what the walk acted on for the child's line, `help`). Each child row carries `intent`, what the rule-based child meant its line as. Each teacher row carries `seams`: for every pair of neighbouring parts in the turn, the two kinds, the joint kind placed there (or none), the form said, and `by`. On a help turn, `cell.part` is the part she was on and `cell.column` the kind of request; `cell.keyed` marks help after a key was said as help. A row that says a card's short reason has `whyShort: true`. A row with `noFit` (`"point"`, `"worked"` or `"card"`) is a turn that ended on a check-in because its parts did not fit one turn, in words or in boards the whiteboard can draw as one script. In `pageParts`, `own` is the board a part owns and `lead: true` marks a joint or lead-in that owns none. A short ask said in place of a card's question after a second miss in a row is a part of kind `reaskShort` in the row's `seams`.
   - The child is rule-based: steady, stuck, offtopic and steering. The steady child answers the closing question right in c4 and c5-t01 and misses it in c5-t02 and c6. The children answer asked steps from the keys as their kind does (steady right; stuck wrong or "pata nahi").
2. **The rules in force.** Read the director29 judgement from "## What fails now, by mechanism" to the end. The decision `dc-r8-director29` is what this run tests, on top of everything that held in director29 and is unchanged: a point and its card in one turn with the short reason making room; the hook, first point and card as the first teaching turn; a remediation with its follow-up card where the whole turn fits 60 words; the verdict's turn running into the worked example; worked examples that ask the step where the child decides; every point's and remediation's board its own; a joint keeps what is up; help as a hard precondition; the key over its answer board; the aside's return as a turn of its own; the two-turn wrap; a turn of parts breaking at 75 words. **After this decision a teaching turn ends on one of five things: a card's question, an asked worked step, the child's own step, a check-in after help, after a key or after a bridge, or "Haan, pehle tum try karo." at a card. Nothing else.**
   - **E1, a picture turn draws the board the walk named.** When a child asks for a picture, the board drawn is the part being helped, or the answered card's answer board after its key, never another card's. The caption said is that board's authored caption (`answerViewCaption` after a key); where the script has none, or the board has no second view, the board is redrawn alone and she says help's own words with no line about a picture. In director29 the same row in all four steering lessons (row 14) drew the first card's board. On a picture turn compare, yourself, `screen.counts` and `held.layout.panels` with `screen.preselected` and with what she says.
   - **E2, the page's start is one function on every path.** The easier-words line on a Hindi request is a lead and owns no page (director29: c5-t01 stuck 8).
   - **E3, two rungs and two cues.** At an asked worked step a give-up or a clarify gets the step's easier wording, then the step's question again; the step is told only at the second request or after a wrong answer. A remediation's unsaid wordings are help for its follow-up card before that card's key. A key is never the answer to an aside or to a yes.
   - **E4, a second request at the greeting starts the lesson.** After the greeting's simpler wording, a second "pata nahi, aap batao" gets one authored start line of six words or fewer ("Chalo, main batati hoon.") and then the hook, the first point and its card. The "nothing easier" line is never said before something has been taught.
   - **E5, a right answer goes on.** The short reason is allowed after a right answer whatever came before it. A worked example's close says the answer without its why when the why and the next card would not fit (`closeShort` on the row).
   - **E6, endings and seams.** An aside reply's turn never ends on a check-in. Every park line is followed by one authored joint ("Ab yeh kaam poora karte hain.") and then the live part. The short ask ("Ab phir se socho, jawab kya hoga?") is said only after help about the card's own figure; after help about another figure she says the card's authored re-ask.
   - **E7, the record.** `whyShort: true` only on a row that said the short reason; a told worked step is recorded `workedStep` and the greeting's question `greetAsk`, never `point`; one `start` seam a turn.
   - **E8, the scripts (Learning 018).** Every caption was read against the view that is drawn for its board, and against its worked example's asked steps; 38 answer captions were added; remediations that read as notes were rewritten as sentences to be said, and **five were left whole on purpose** (c5-t01 skill 3 twice, c5-t02 skill 2 twice and skill 3 once): each is said alone and ends on its check-in, because said beats fitted. Three asked worked steps were changed (c4 s3, c5-t01 s3, c6 s1); the wrap's acknowledgements were rewritten.
   - **Not built, by ruling, and not failures of this build:** a child's first "bas, aaj ke liye itna hi" still gets the stop protocol's one check-in (the safety floor is frozen); the aside's return stays a turn of its own, so a right verdict just before it ends on a check-in; the closing question's verdict ends on a check-in before the two-turn wrap; the whiteboard's cap of 120 drawing steps stays, so a turn whose boards cannot be drawn as one script is split (rows marked `noFit`, and one c4 turn after a right answer whose two boards do not fit).
   - **The measure set before the build:** on the dry run every turn is 75 words or fewer except where an aside reply, a park line or the start line leads (none over 90); no check-in after a point, after an aside reply or a park. The dry run on this code: 3 turns over 75 (79, 78, 80), each led by a park line or the start line; the steady lessons end 4, 5, 4 and 4 turns on a comprehension check-in (director29 live: 6, 6, 5, 6). The README gives the live counts. Your ear decides whether what is left is too much.
3. **The scripts: `$D30/scripts/<topic>.json`.** Since director29: see E8 above. You are an independent read again: **list every sentence you hear that is untrue, gives away an answer that a later card asks for, repeats a question frame within a skill, or is unnatural to say**, with the row. **Read every remediation aloud in your head:** is it a teacher talking, or notes? Is one left to stand alone too long for a child who just got something wrong? **Read every asked step:** is it the step where the child decides what to do, or a sum; is its key right (solve it yourself); does the child's own step still need thinking after it; is any fact said twice? **Read every hint and re-ask said in your lessons against its card:** does it say the numbers of the answer, leave one option, or say something the board does not show? **Read every caption said against the view drawn** (`held.layout`, `held.picture`): is it true of that view, and does it give away the question it is said before?
4. **The previous run, director29, for comparison:** `$D29/`, your topic's D29 hand report, and the judgement named above.

   | Topic | Words against board | Unsaid boards (strict) | Misgrades | Listening | Worked example | Class level | Screen and speech | Register | Promises |
   |---|---|---|---|---|---|---|---|---|---|
   | c4 | 1 | 0 | 0 | 3.5 | 4 | 4 | 4 | 3.5 | 3.5 |
   | c5-t01 | 1 | 1 | 0 | 3.5 | 4 | 4 | 4 | 3.5 | 3.5 |
   | c5-t02 | 2 | 1 | 0 | 3.5 | 3.5 | 4 | 3.5 | 3.5 | 3.5 |
   | c6 | 1 | 0 | 0 | 3.5 | 4 | 4 | 4 | 3.5 | 3.5 |

   **The strict reading of an unsaid board, which you apply:** a board on screen that belongs to a card she has not yet said is an unsaid board, whatever is being said under it and whether or not the script lists that board under the part being said. A board drawn before its own part's first word (under a joint, a lead-in, a hook or a bridge) is counted the same way. A point's or remediation's board that shows what its card asks and the part does not speak of is counted too (director29's c4 and c5-t01 rows were of that kind).

   **A known item, to report under its own heading and not to score:** in earlier runs the rule-based child's wrong answer "no place" (c5-t01) set off the child-safety turn; the cause is in safety code that is frozen by the owner. The script's token for that mix-up is now "koi mark nahi". If a safety turn happens in your lessons, give the rows and what she said, score the six axes on the rest of the lesson, and say in one line what listening would be with it counted.

5. **The items to score.** Rate each as working, partly or not working, with evidence.
   - **The director29 mechanisms** (the eleven under "What fails now, by mechanism" in the director29 judgement). For each that concerns your topic: gone, reduced (count), or still there (rows).
   - **Every turn's board, part by part, by hand.** This is the first question the run exists to answer. For every teacher turn that holds more than one part, every turn after an aside, the AI line, a return or a request at the greeting, every remediation, every help turn and every key: the parts said, the board up at each part's first word (`held.pages` against `pageParts`), and whether that board is that part's own or a board kept from an earlier part. Count, with rows: turns where a board is up for a card not yet said, or before its own part's first word (unsaid boards, strict reading); turns where a part that owns a board is said without it; turns where a card is said without its board; help turns over another part's board. **For every point and every remediation said in your lessons: is its board true of what she says over it, and does it show anything its card asks that the part does not speak of?** For every key given as help: over the answer board? For every joint, lead-in, hook and bridge: what was up while it was said?
   - **Help, against the whole lesson, by hand.** For each help turn, whether any sentence of it had been said anywhere earlier in the lesson, word for word or nearly (give the earlier row). Count the help turns that left the child with nothing new. Separately count the help turns whose wording was new in words but the same idea in the same order as the line before. Count keys given where an authored wording for that part was still unsaid (the closing question included), and keys given where a hint would have let this child do it. **For every give-up, clarify, "let me try" or request for Hindi or easier words anywhere in the lesson: what did the turn that answered it contain for the child, and for which part?** Count the ones that got silence, a bare card, a back-to line and a card, the next step, the next part, or another part's help, with rows. Count the times the "nothing easier is left" line was said and say whether it was true (was a wording of that part still unsaid?) and whether it sounds like a teacher.
   - **The turn shapes, by hand.** The second question. Count, per lesson, the turns that hold: (a) verdict, reason, point and card; (b) hook, first point and card; (c) miss form, remediation and follow-up card; (d) verdict, lead-in, problem and first question; (e) an aside reply or park line going on into the live part. For each kind: the word counts (lowest, highest), and **whether it reads as a teacher talking to a child or as too much in one breath** (quote the worst one of each kind). Can a child still tell which sentence is the question? Is the reason for the last answer lost when the next point follows straight on? Count any point said with its card where the point gives the card's answer. Count any turn that ends on something other than: a card's question, an asked worked step, the child's own step, or a check-in after help, after a key or after a bridge (give the rows and what it ended on). Count any quick question or invitation heard (both should be 0).
   - **Check-ins and the worked examples, by hand.** Count the turns that end on a comprehension check-in in each lesson, and the longest run back to back; name the rows of every run of three or more and say whether the child's own requests made it. Count the check-ins said after a point or a right verdict within a skill, after an aside reply or a park, before a waiting card, and inside a worked example (all should be 0; give rows). For every worked example: the turns it took, which step was asked (quote the question), whether it is a step where the child decides what to do or a sum, the child's answer and her confirmation or telling (quote them), the "not that" form if one was said, whether the child's own step still needed thinking, and any fact said twice. Does it read as a teacher working a problem with a child, as a recital, or as a quiz? Say plainly whether you find the remaining check-ins tedious, and where (after help; after a key; after a bridge; a remediation that stands alone; another, named). Count the teacher turns over 60 words, over 75 words and over 90 words. Give each steady lesson's row count. **For every row with `whyShort: true`:** quote the short reason; after it, is the right answer explained enough for that child, and is the short reason true?
   - **Joints, by hand, and against the record.** Count separately, with rows: a joint said where it does not belong (the "we will meet this again" line anywhere but after a key said as help); two joints at one seam; a return to an earlier card with no back-to line; a worked problem with no lead-in; any other seam that reads abrupt (quote it). Give the counts and their total per lesson. Quote the after-key return form each time it is said and say whether it sounds like a person. Then check the row's `seams` list against what she said on 10 turns of your choice per lesson: does the record say what was heard, is a help wording recorded as help, a verdict only where one was said, and the opener, the stop line and the closing question's lead-in as their own kinds?
   - **The stop path and model words.** For every turn after a child says she wants to stop or says bye: quote it. Is it an authored line? Any sentence in your lessons that is in no script, no joint list and no code line: give the row.
   - **A mix-up met again.** For every wrong answer that shows a mix-up the child already showed earlier in the lesson: what did she get, and was it the remediation of the skill she is in?
   - **The return and the wrap.** For every aside: is the return question alone in its turn (or led only by the going-on line), and is it one of the script's forms? Her reply to the child's answer: does it carry the child's word? For the steady lesson: the wrap's two turns quoted in full; does the closing verdict say its why; does the second turn's first line fit what the child answered? Does the ending read as a person closing a lesson?
   - **Register, by ear.** Read each lesson aloud in your head as a tuition teacher would say it. Where does it still sound assembled? Name the five rows per lesson that most hold register down, and put each under exactly one cause: (a) a fixed form heard too often (quote it with its count in the lesson); (b) a sentence of the script; (c) the verdict and its why, as written; (d) the length or shape of the turn; (e) help; (f) something else, named. Give the count of rows under each cause for your topic.
   - **A part said once.** List every point, worked step or card's first telling that was never said, and every one said a second time when the child had not asked for it. Give the rows.
   - **The reader, by hand.** For every child row, compare its `intent` with the next teacher row's `cell.column` and with what she actually did. Count the lines recorded as the wrong kind, with rows. Count any right answer that was not graded.
   - **The sentence about the child.** Is it there; which card's `did`; did she answer that card right at the first try (give the row); is it true and natural?
   - **Pictures.** For every picture request: the view drawn, the caption said (quote it), whether it is true of that view, whether it names anything a later card asks for, and whether the turn then asked by the question alone. Count the turns with no authored caption.
   - **Asides in full.** For every aside: the park row (one sentence? which form? did the turn go on into the live part?), the return row (a turn of its own, one question the child can answer in a few words?), the child's answer, and her reply row. **Quote her reply in every case** and rate it: natural, flat (means nothing), or odd/wrong (misstates the child, states a fact, claims a taste, promises). Is the word in the slot a sensible word of the child's? Compare with director29's replies quoted in your D29 report: better, the same, or worse? Was any reply said twice? For every second or third aside in a lesson: does her reply carry a word of the child's line, and does it sound like listening? For every AI line after the first: did it ask something new, or something the child had already answered? After every "bye": a goodbye, or a menu? Was any park never returned to? Any return with no park?
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

**Reversal clauses for director30, set before the run.** Give the counts plainly so the main loop can apply them:
- (1) The board: turns where a board is up for a card not yet said or before its own part's first word; turns where a part that owns a board is said without it; turns where a card is said without its board; help turns over another part's board (give each row, whose board it was, and whether the cause is the script's board or the paging). Any unsaid board from a joint, a lead-in, a hook or a bridge → the page's start is taken from the part's first word in one place for every path, and the predicate is written from that function's output. A point's or remediation's board that shows what its card asks and the part does not speak of, or is untrue of its words: any in your topic → that script's boards are read part by part again before anything is scaled.
- (2) The turn shapes: your counts of each kind and your reading. Two judges finding the turns of verdict, reason, point and card too much in one breath → the limit for that turn goes to 65 words and the scripts are cut again; quick questions do not come back. Two judges finding the remediation with its card too much in one breath → the two share a turn only when both fit 50 words; otherwise the remediation stands alone and ends on a check-in. Two judges finding the hook, first point and card too much for a first turn → the hook goes into the greeting's turn. Two judges finding the aside reply's turn (to 90 words) too long → the reply's joint goes straight to the card's question and the part is not said again. A turn ending on anything outside the five allowed endings: any → the path is found and closed (give the row).
- (3) A request answered without help: requests that got silence, a bare card, a back-to line and a card, the next step, the next part, or another part's help. Any one → the path is named and the precondition is moved to where the turn is assembled. The "nothing easier is left" line said while a wording of that part was unsaid: any → the picker is wrong on that row. Two judges finding the "nothing easier" line cold or a dead end for the child → it is followed by the key's why in new words (the scripts get one per card).
- (4) The picker: help turns with nothing new (more than 2 in your topic → for each, say whether a sentence was repeated or the wording was new and empty); keys given with a wording unsaid, the closing question included (any → the picker is wrong on that row); keys where a hint would have done (more than 2 in your topic → a rung is added there).
- (5) The short reason: your count of rows and your reading. Two judges finding right answers under-explained where the short reason is said → the short form is used only when the next part is a point of its own skill. A short reason that is untrue: any → that script's short reasons are read again.
- (6) Check-ins: each steady lesson's row count, its check-in turns and its longest run; check-ins after a point or a right verdict within a skill, after an aside reply or a park, before a waiting card or inside a worked example (any → the path is found and closed; give the rows). Two judges finding the remaining check-ins tedious → the next round acts on the kind of turn most often named.
- (7) The worked example: your score, and for each example whether the asked step is a deciding step or a sum. A worked example that two judges read as a quiz of sums → that script's examples are rewritten with the judges' rows before anything is scaled. Below 4 in two topics across the run → the asked step is the wrong step and moves; the examples do not go back to telling. An asked step with a wrong key, or a key the child kind could not reach from what was said: any → that script's keys are blind-solved again. "Let me try" at an asked step that skipped a step, or a wrong answer told with no "not that": any → the path is found and closed.
- (8) Joints: the "we will meet this again" line anywhere but after a key said as help, or two joints at one seam (any → the rule was not built on that path; give the rows); returns to an earlier card with no back-to line (any → the path is found and closed); an aside reply or park going into the live part with no joint (any → the same); other seams that read abrupt (more than 2 in your topic → a form is authored for that place).
- (9) Model words and the stop path: a stop turn that is not the authored line, the stop menu asked after a clear stop, or any model-written sentence heard (any → the path is found and closed; give the row and the sentence).
- (10) Hints and re-asks: hints said in your lessons that state the numbers of the answer, leave one option, or are untrue of the board the card is posed on; re-asks that do the card's work or need givens no longer in front of the child; the same re-ask said twice running word for word. More than 1 in your topic → that script's hints and re-asks get another independent read before anything is scaled.
- (11) Register: your score, and your count of rows under each cause (a) to (f). Register below 3.5 in two topics or more across the run → the cause with the most rows across the four reports gets the next round.
- (12) The reader's record and the row's record (more than 3 wrong kinds in your topic); captions (more than 1 in the run untrue, giving an answer away, or not authored); the sentence about the child (untrue in any lesson).
- (13) Listening or promises below 3.5 in your topic → name the rows (request × where), and say for each whether the rule is wrong, missing, or was not followed.
- (14) Script sentences: your count of untrue, giveaway, repeated-frame and unnatural sentences heard. More than 2 untrue or giveaway in your topic → that script gets another independent read before anything is scaled. A point cut so short that its card asks for something never taught: any → give the pair; that pair is rewritten.
- (15) Any misgrade, any unsaid board (strict reading), any contradiction → give each case with its mechanism.
- (17) The picture turns: for every picture turn in your lessons, the board drawn against the board named and against her words. Any picture turn whose drawn board is not the one named, on any path → the picture is taken out of the held-board path and drawn as a turn of its own. A picture turn after a key that redraws the board alone: does what she says there help, or is it the why said again?
- (18) The new rungs: every give-up or clarify at an asked worked step, and what it got. Two judges finding the step's easier wording before the told step slows a child who has given up → the step is told at the first give-up and the easier wording becomes the hint for a wrong answer only. Follow-up cards: was the remediation's second wording, said as help before the key, of use, or one more thing between the child and the answer?
- (19) The start after a second request at the greeting: quote the turn. Two judges finding the start line brushes the child's "aap batao" aside → the greeting's turn itself is rewritten so that it asks nothing a child can fail.
- (20) "Haan, pehle tum try karo." at a card: two judges finding it a dead turn → the card's question is said again after it.
- (21) Remediations said alone: the rows, and whether each reads as a teacher talking. A remediation left to stand alone in more than two places in a steady lesson → the 60-word limit for that turn is re-read against the judges' ear; the scripts are not cut again. A remediation that still reads as notes: give the row and the sentence.
- (16) Two topics passing every line of the gate with every axis at 3.5 → the staged scripts get the same read, three at a time, each judged before the next three. Say plainly whether yours passes.

## What to produce

**A. Your own hand counts for your 4 lessons:**
- (i) beats taught, out of beat turns;
- (ii) verdicts, out of keyed answers;
- (iii) contradictions by mechanism, each with its row, and unsaid boards as a separate count with rows;
- (iv) right answers called wrong, and wrong answers called right;
- (v) false keys.

Give a per-lesson table and totals, with director29's hand count for your topic beside yours.

**B. Each item in 5** (working, partly or not working, with evidence). Also give:
- **Frames:** count each repeated frame within 4 of her turns, with rows. Quote the variant forms you saw.
- **Board changes:** the number of turns with a change, how many were in the right place, and how many turns held the board.
- **Asides:** every one, with its park and return rows. Was it on time? In the child's words? Did it answer their question? Were there any taste claims?
- **Hints after wrong answers:** every one. Was the escalation right? Was anything re-said? Did every posed card end with its key said? Name any that didn't.
- **Turns over 60 words:** the count, and for each whether it reads as tutoring or monologue.
- **Pace:** how far each lesson got, compared with director29 (the steady lesson now runs to the end of the script: say whether the third skill is taught at class level).

**C. Defects.** For each, give the evidence and the layer:
- (a) script data;
- (b) runtime walk;
- (c) reply rendering and frames;
- (d) harness or child.

Flag what is new since director29, and what director29 had that is now gone.

**D. Scores 1–5, director29 → director30, one line each:**
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
