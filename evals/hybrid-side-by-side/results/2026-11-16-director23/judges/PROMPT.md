You are a judge for Taxila, an AI Hinglish voice tutor for Indian children in classes 4-7. You have two jobs:
- judge whether the teacher in the recorded lessons below teaches the way a good human tuition teacher would;
- measure the run against a fixed scale gate.

Ground rules:
- Read everything yourself.
- Back every claim with concrete evidence: lesson, row and a short quoted line.
- Everything is read-only. Change nothing anywhere. You cannot write files, so return your whole report as your final message.

**Row numbering:** cite every turn as its 0-based index into the lesson `.json`'s turn array, written "row N".

Paths:
- D23 = /tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/judge-d23/run
- D22 = /home/user/taxila-int/evals/hybrid-side-by-side/results/2026-11-15-director22
- D22 hand reports, one per topic: /home/user/taxila-int/evals/hybrid-side-by-side/results/2026-11-15-director22/judges/report-<c4|c5t01|c5t02|c6>.md
- The director22 judgement and decision: /home/user/taxila-int/docs/design/round7/judgements/director22-2026-11-15.md

## What to read

1. **The run under judgement, "director23": `$D23/`.**
   - The README gives run facts only, so count everything yourself.
   - Read your 4 lessons' `.md` in full (the steady lesson runs to the end of the script, with an authored closing question and wrap).
   - Use the `.json` for what was on screen. The lesson's rows are the array under `director`. Each teacher row's `held` record comes from what was actually drawn: the `unit`, whether the board `changed` or was `kept`, what was `drawn`, the `pages`, `layout` and, on a picture turn, `picture` (its `view`). Most teacher rows carry a `cell` record, the walk's own address for that turn (`part`, `column`: what the child's line was read as, `help`). **New:** each child row carries `intent`, what the rule-based child meant its line as; compare it with the `column` of the teacher's next row.
   - The child is rule-based: steady, stuck, offtopic and steering. **New in this run:** the steady child answers the closing question right in c4 and c5-t01 and misses it in c5-t02 and c6; a child's wrong answer on a money card is a near value.
2. **The rules in force.** Read the director22 judgement from "## What fails now, by mechanism" to the end. The decision `dc-r8-director22` is what this run tests, on top of the order laws O1 to O7, re-asks, second wordings and the aside replies that held in director22:
   - **P, pictures.** A picture request always draws a view. When no caption can be said without giving an answer away, her line names nothing in the picture ("Yeh lo, isi cheez ki ek aur tasveer, ise dhyan se dekho"). She never says a picture cannot be made.
   - **R, the reader.** What a child's line can be is decided by what she last asked. After her return question or her AI-line question, the next line and only the next is that reply. After a key's check-in, "pata nahi" and "samajh nahi aaya" are a give-up and a clarify, never a misconception; "haan" is a yes. While the closing question is open, a line is its answer or a non-answer.
   - **T, the ending.** One authored lead-in before the closing question. The answer board is up from the first word of the turn that says its key. After a right answer the verdict leads the wrap in the same turn; after a miss the key and its why are a turn with a check-in, then the wrap. The wrap says one authored "covered" sentence for each skill the lesson reached, then (if it passed a check by code) one model-written sentence about what this child did, then the goodbye.
   - **J2, the joints.** `backTo` is said when, and only when, the lesson returns to a card posed before another unit came between. A miss verdict and its remediation always have their joint. One joint at a seam, never two; none between a point and its own card.
   - **W.** A card she said whole in one of her last two turns is asked again by its question alone (its authored re-ask where written), unless the child asked to hear it, or it is a picture turn, or the second miss is past. After "main khud karti hoon" she says a short go-ahead and waits.
   - **H.** A Hindi request gets words she did not say in her last two turns (the simpler if unspent, else the second wording).
   - **B.** A bridge to the next skill changes no board; the next skill's first board goes up with its first part.
   - **K.** A key is said once; a yes-or-no key is said as a sentence.
   - **A.** Her reply after an AI-line question uses the child's own phrase, like the replies after a park.
3. **The scripts: `$D23/scripts/<topic>.json`.** Since director22 an independent reader re-read all four (three untrue sentences and three giveaways fixed; one word per idea; a wrong-answer value on c6's gate-cost card; second wordings; closing-question lead-ins; a "covered" sentence per skill). You are an independent read again: **list every sentence you hear that is untrue, gives away an answer that a later card asks for, repeats a question frame within a skill, or is unnatural to say**, with the row.
4. **The previous run, director22, for comparison:** `$D22/`, your topic's D22 hand report, and the judgement named above.

   | Topic | Words against board | Unsaid boards | Misgrades | Listening | Worked example | Class level | Screen and speech | Register | Promises |
   |---|---|---|---|---|---|---|---|---|---|
   | c4 | 5 | 0 | 0 | 3 | 4 | 4 | 3 | 3 | 3.5 |
   | c5-t01 | 5 | 0 | 0 | 3 | 4 | 4 | 3.5 | 3 | 4 |
   | c5-t02 | 2 | 2 | 0 | 3 | 4 | 4 | 3.5 | 3 | 3.5 |
   | c6 | 1 | 0 | 0 | 3.5 | 4 | 4 | 4 | 3 | 3.5 |

5. **The items to score.** Rate each as working, partly or not working, with evidence.
   - **The director22 mechanisms** (the list "What fails now, by mechanism" in the judgement). For each that concerns your topic: gone, reduced (count), or still there (rows).
   - **The reader, by hand.** For every child row, compare its `intent` with the next teacher row's `cell.column` and with what she actually did. Count the lines read as the wrong kind, with rows. Count any right answer that was not graded.
   - **Joints, by hand.** Count separately, with rows: a joint said where it does not belong (a `backTo` with nothing to go back to; a joint between a point and its own card); two joints at one seam or a doubled word; a seam with no joint where one was needed (a return to an earlier card, a miss verdict into a remediation, her aside reply into the lesson). Give the three counts and their total per lesson.
   - **The ending.** The lead-in row, the closing question, the child's answer, what she did, the board on each of those turns (is the answer board up from the first word of the key?), and the wrap quoted in full, including the sentence about the child if there is one. Is every "covered" sentence true of a skill this lesson reached? Is the sentence about the child true of this lesson's rows, and is it more than empty praise? Does the ending read as a person closing a lesson?
   - **Pictures.** For every picture request: was a view drawn (`held.picture.view`), what did she say, and did her line help the child see what the picture shows? Count the turns that used the line that names nothing.
   - **Asides in full.** For every aside: the park row (one sentence? which form? did the turn go on into the live part?), the return row (a turn of its own, one question the child can answer in a few words?), the child's answer, and her reply row. **Quote her reply in every case** and rate it: natural, flat (means nothing), or odd/wrong (misstates the child, states a fact, claims a taste, promises). Is the word in the slot a sensible word of the child's? Compare with director22's replies quoted in your D22 report: better, the same, or worse? Was any reply said twice? Rate the replies after her AI-line question separately. Was any park never returned to? Any return with no park?
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

**Reversal clauses for director23, set before the run.** Give the counts plainly so the main loop can apply them:
- (1) Joints: your count of misplaced, stacked and missing joints per lesson and for the topic. More than 2 in your topic → the walk's joints are rebuilt as one pass over the assembled turn. 2 or fewer AND register still below 3.5 → the reply model writes the joins. Give both numbers.
- (2) The sentence about the child: in how many of your lessons that reached the wrap was it present, true, and more than empty praise? Wrong or empty in more than 1 lesson in 8 across the run → it is replaced by a fact picked by code.
- (3) The reader: your count of lines read as the wrong kind. More than 3 in your topic → the child's intent tags or the reader's table are wrong; say which rows.
- (4) Pictures: of picture turns, how many used the line that names nothing, and in how many of those was the picture left unexplained? More than half unexplained → Learning authors a caption for each board's view.
- (5) Order laws: displaced parts said late, per lesson. More than 2 rows in your topic → a displaced point may be dropped when its card is already answered right.
- (6) Second clarifies: how many were unhelpful. More than half → a second clarify goes straight to the worked answer with the board.
- (7) Whole cards said again within two turns when the child had not asked and it was not a picture turn: the count. More than 2 in your topic → the rule is not holding; name the rows. Count picture turns that said the card whole separately: more than 2 in your topic → a picture turn asks by the question alone.
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

Give a per-lesson table and totals, with director22's hand count for your topic beside yours.

**B. Each item in 5** (working, partly or not working, with evidence). Also give:
- **Frames:** count each repeated frame within 4 of her turns, with rows. Quote the variant forms you saw.
- **Board changes:** the number of turns with a change, how many were in the right place, and how many turns held the board.
- **Asides:** every one, with its park and return rows. Was it on time? In the child's words? Did it answer their question? Were there any taste claims?
- **Hints after wrong answers:** every one. Was the escalation right? Was anything re-said? Did every posed card end with its key said? Name any that didn't.
- **Turns over 60 words:** the count, and for each whether it reads as tutoring or monologue.
- **Pace:** how far each lesson got, compared with director22 (the steady lesson now runs to the end of the script: say whether the third skill is taught at class level).

**C. Defects.** For each, give the evidence and the layer:
- (a) script data;
- (b) runtime walk;
- (c) reply rendering and frames;
- (d) harness or child.

Flag what is new since director22, and what director22 had that is now gone.

**D. Scores 1–5, director22 → director23, one line each:**
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
