You are a judge for Taxila, an AI Hinglish voice tutor for Indian children in classes 4-7. You have two jobs:
- judge whether the teacher in the recorded lessons below teaches the way a good human tuition teacher would;
- measure the run against a fixed scale gate.

Ground rules:
- Read everything yourself.
- Back every claim with concrete evidence: lesson, row and a short quoted line.
- Everything is read-only. Change nothing anywhere. You cannot write files, so return your whole report as your final message.

**Row numbering:** cite every turn as its 0-based index into the lesson `.json`'s turn array, written "row N".

Paths:
- D24 = /tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/judge-d24/run
- D23 = /home/user/taxila-int/evals/hybrid-side-by-side/results/2026-11-16-director23
- D23 hand reports, one per topic: /home/user/taxila-int/evals/hybrid-side-by-side/results/2026-11-16-director23/judges/report-<c4|c5t01|c5t02|c6>.md
- The director23 judgement and decision: /home/user/taxila-int/docs/design/round7/judgements/director23-2026-11-16.md

## What to read

1. **The run under judgement, "director24": `$D24/`.**
   - The README gives run facts only, so count everything yourself.
   - Read your 4 lessons' `.md` in full (the steady lesson runs to the end of the script, with an authored closing question and wrap).
   - Use the `.json` for what was on screen. The lesson's rows are the array under `director`. Each teacher row's `held` record comes from what was actually drawn: the `unit`, whether the board `changed` or was `kept`, what was `drawn`, the `pages`, `layout` and, on a picture turn, `picture` (its `view`). Most teacher rows carry a `cell` record (`part`, `column`: what the walk acted on for the child's line, `help`). Each child row carries `intent`, what the rule-based child meant its line as. **New in this run:** each teacher row carries `seams`: for every pair of neighbouring parts in the turn, the two kinds, the joint kind placed there (or none) and the form said.
   - The child is rule-based: steady, stuck, offtopic and steering. The steady child answers the closing question right in c4 and c5-t01 and misses it in c5-t02 and c6.
2. **The rules in force.** Read the director23 judgement from "## What fails now, by mechanism" to the end. The decision `dc-r8-director23` is what this run tests, on top of everything that held in director23 (the order laws, pictures always draw, the answer board at the first word of the closing key, bridges, try-first, re-asks):
   - **S, the seam pass.** One pass places every joint. At most one joint at a seam; none between a point and its own card or between a verdict and its own why. A return to an earlier card has its `backTo` whether the return opens a turn or follows a then-card's verdict inside one. Her reply to an aside or after her AI line leads into the lesson with one joint. A filler word that opens two neighbouring parts is said once. Forms rotate by lesson and by count, and so do the opener of the why after a verdict ("Dekho,") and the verdict openers.
   - **R2, the reader's record.** The row's `column` is what the walk acted on. Her reply after a return or AI-line question is a reply: she answers it and goes on from where the lesson stood, and nothing already said is said again because of it. A give-up or clarify after a key's check-in is recorded as that. A line after the closing key's check-in is never graded.
   - **C, captions.** Each board a picture request can redraw has an authored caption (`viewCaption` beside that board in the script) that says what to look at and names nothing a later card asks for. The picture turn says the caption, then the card's question alone, never the whole card. A caption is said only over the kind of view it was written for; otherwise the code's own line, then "Yeh lo, isi cheez ki ek aur tasveer, ise dhyan se dekho", stand in.
   - **T2, the ending.** The sentence about the child is said to her, in the second person, about the hardest thing she got right. A miss on the closing question gets a miss verdict before the key. When the child says something after the closing key's check-in, the wrap opens with one short authored acknowledgement (`wrap.ack`).
   - **H2, help never repeats.** No help (clarify, give-up, Hindi, hint) says a sentence she said in her last two turns. At a point's check-in, help is the point's own second wording or simpler, never a card's and never the next card. A give-up on a card gets that card's own hint. A second clarify with nothing unsaid left goes to the worked answer with the board.
   - **Boards.** A remediation with its own authored board has it drawn before she describes it. c6's field with a gate now draws the gate.
   - **K2.** After a wrong answer to a yes-or-no card the key is one sentence that states the fact, never "Yeh jawab sahi nahi hai. Haan, kyunki".
   - **A2.** Her AI line ends with her question back; a second aside in a lesson gets a reply in the child's words.
3. **The scripts: `$D24/scripts/<topic>.json`.** Since director23 Learning fixed the judges' list (giveaways, second whys that contained the key, unnatural sentences, word pairs) and wrote 156 captions; each pilot had an independent read. You are an independent read again: **list every sentence you hear that is untrue, gives away an answer that a later card asks for, repeats a question frame within a skill, or is unnatural to say**, with the row. **Read every caption said in your lessons against the view drawn on that row** (`held.picture.view` and what `held.drawn` shows): is it true of the picture, and does it name anything a later card asks for?
4. **The previous run, director23, for comparison:** `$D23/`, your topic's D23 hand report, and the judgement named above.

   | Topic | Words against board | Unsaid boards | Misgrades | Listening | Worked example | Class level | Screen and speech | Register | Promises |
   |---|---|---|---|---|---|---|---|---|---|
   | c4 | 1 | 0 | 0 | 3.5 | 4 | 4 | 3.5 | 3 | 3.5 |
   | c5-t01 | 0 | 0 | 0 | 3 | 4 | 4 | 4 | 3 | 4 |
   | c5-t02 | 2 | 0 | 0 | 3 | 4 | 4 | 3.5 | 3 | 3.5 |
   | c6 | 1 | 0 | 0 | 3.5 | 4 | 4 | 4 | 3 | 3.5 |

   **A known item, to report under its own heading and not to score:** in director23 the child's wrong answer "no place" (c5-t01, the card about 1/9's place on the line) set off the child-safety turn in two lessons. The cause is in safety code that is frozen by the owner and has not been changed. If it happens in your lessons, give the rows and what she said, score the six axes on the rest of the lesson, and say in one line what listening would be with it counted.

5. **The items to score.** Rate each as working, partly or not working, with evidence.
   - **The director23 mechanisms** (the list "What fails now, by mechanism" in the judgement). For each that concerns your topic: gone, reduced (count), or still there (rows).
   - **Joints, by hand, and against the record.** Count separately, with rows: a joint said where it does not belong (between a point and its own card; between a verdict and its own why; a `backTo` with nothing to go back to); two joints at one seam or a filler word doubled; a seam with no joint where one was needed (a return to an earlier card, in a turn or opening one; a miss verdict into a remediation; her aside reply or AI line into the lesson). Give the three counts and their total per lesson. Then check the row's `seams` list against what she said on 10 turns of your choice per lesson: does the record say what was heard?
   - **Register, by ear.** Read each lesson aloud in your head as a tuition teacher would say it. Where does it still sound assembled? Name the five rows per lesson that most hold register down, and say for each what is wrong: the joint, the opener, a repeated frame, a sentence of the script, the length of the turn, or something else. This is the question the run exists to answer.
   - **The reader, by hand.** For every child row, compare its `intent` with the next teacher row's `cell.column` and with what she actually did. Count the lines recorded as the wrong kind, with rows. Count any right answer that was not graded, and any part said again because of a reply.
   - **The ending.** The lead-in row, the closing question, the child's answer, what she did, the board on each of those turns, and the wrap quoted in full. Is every "covered" sentence true of a skill this lesson reached? The sentence about the child: is it there, in the second person, true of this lesson's rows, about something hard, and more than empty praise? After a miss: is there a miss verdict before the key, and does the wrap acknowledge what the child said after the check-in? Does the ending read as a person closing a lesson?
   - **Pictures.** For every picture request: the view drawn, the caption said (quote it), whether it is true of that view, whether it helps the child see what to look at, whether it names anything a later card asks for, and whether the turn then asked by the question alone. Could the child answer that question from the picture, the board and her last two turns? Count the turns with no authored caption.
   - **Help.** For every clarify, give-up, Hindi request and hint: what she said, and whether any sentence of it was in her last two turns. Count help turns that left the child with nothing new.
   - **Asides in full.** For every aside: the park row (one sentence? which form? did the turn go on into the live part?), the return row (a turn of its own, one question the child can answer in a few words?), the child's answer, and her reply row. **Quote her reply in every case** and rate it: natural, flat (means nothing), or odd/wrong (misstates the child, states a fact, claims a taste, promises). Is the word in the slot a sensible word of the child's? Compare with director23's replies quoted in your D23 report: better, the same, or worse? Was any reply said twice? Rate the replies after her AI-line question separately, and say whether every AI line ended with her question back. Was any park never returned to? Any return with no park?
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

**Reversal clauses for director24, set before the run.** Give the counts plainly so the main loop can apply them:
- (1) Joints and register: your count of misplaced, stacked and missing joints per lesson and for the topic, and your register score. More than 2 joint faults in your topic, OR register below 3.5 in two topics or more across the run → the reply model writes the joins from the `seams` list, with the authored parts checked intact by code. Say also, from your "register, by ear" rows, whether joints are still what holds register down or something else is, and what.
- (2) The reader's record: your count of lines recorded as the wrong kind. More than 3 in your topic → the child's intent tags are wrong and the test children are rewritten; say which rows.
- (3) Captions: of the captions said in your lessons, how many give away a later answer or say something the picture does not show? More than 1 in the run → captions are generated by code from the board's parameters and the authored ones dropped.
- (4) The sentence about the child: in the lessons of yours that reached the wrap, was it absent, in the third person, wrong, or empty? More than 1 in 4 across the run → it is replaced by a fact picked by code and said in an authored form.
- (5) Picture turns by the question alone: on how many picture turns could the child not answer without the card's givens? More than 2 in your topic → a picture turn says the card whole again.
- (6) Help: how many help turns left the child with nothing new? More than 1 in your topic → a second request for help of any kind goes to the worked answer.
- (7) Order laws: displaced parts said late, per lesson. More than 2 rows in your topic → a displaced point may be dropped when its card is already answered right.
- (8) Listening, register or promises below 3.5 in your topic → name the rows (request × where), and say for each whether the rule is wrong, missing, or was not followed.
- (9) Script sentences: your count of untrue, giveaway, repeated-frame and unnatural sentences heard. More than 2 untrue or giveaway in your topic → that script gets another independent read before anything is scaled.
- (10) Any misgrade, any unsaid board, any contradiction → give each case with its mechanism.

## What to produce

**A. Your own hand counts for your 4 lessons:**
- (i) beats taught, out of beat turns;
- (ii) verdicts, out of keyed answers;
- (iii) contradictions by mechanism, each with its row, and unsaid boards as a separate count with rows;
- (iv) right answers called wrong, and wrong answers called right;
- (v) false keys.

Give a per-lesson table and totals, with director23's hand count for your topic beside yours.

**B. Each item in 5** (working, partly or not working, with evidence). Also give:
- **Frames:** count each repeated frame within 4 of her turns, with rows. Quote the variant forms you saw.
- **Board changes:** the number of turns with a change, how many were in the right place, and how many turns held the board.
- **Asides:** every one, with its park and return rows. Was it on time? In the child's words? Did it answer their question? Were there any taste claims?
- **Hints after wrong answers:** every one. Was the escalation right? Was anything re-said? Did every posed card end with its key said? Name any that didn't.
- **Turns over 60 words:** the count, and for each whether it reads as tutoring or monologue.
- **Pace:** how far each lesson got, compared with director23 (the steady lesson now runs to the end of the script: say whether the third skill is taught at class level).

**C. Defects.** For each, give the evidence and the layer:
- (a) script data;
- (b) runtime walk;
- (c) reply rendering and frames;
- (d) harness or child.

Flag what is new since director23, and what director23 had that is now gone.

**D. Scores 1–5, director23 → director24, one line each:**
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
