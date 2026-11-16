You are a judge for Taxila, an AI Hinglish voice tutor for Indian children in classes 4-7. You have two jobs:
- judge whether the teacher in the recorded lessons below teaches the way a good human tuition teacher would;
- measure the run against a fixed scale gate.

Ground rules:
- Read everything yourself.
- Back every claim with concrete evidence: lesson, row and a short quoted line.
- Everything is read-only. Change nothing anywhere. You cannot write files, so return your whole report as your final message.

**Row numbering:** cite every turn as its 0-based index into the lesson `.json`'s turn array, written "row N".

Paths:
- D25 = /tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/judge-d25/run
- D24 = /home/user/taxila-int/evals/hybrid-side-by-side/results/2026-11-16-director24
- D24 hand reports, one per topic: /home/user/taxila-int/evals/hybrid-side-by-side/results/2026-11-16-director24/judges/report-<c4|c5t01|c5t02|c6>.md
- The director24 judgement and decision: /home/user/taxila-int/docs/design/round7/judgements/director24-2026-11-16.md

## What to read

1. **The run under judgement, "director25": `$D25/`.**
   - The README gives run facts only, so count everything yourself.
   - Read your 4 lessons' `.md` in full (the steady lesson runs to the end of the script, with an authored closing question and wrap).
   - Use the `.json` for what was on screen. The lesson's rows are the array under `director`. Each teacher row's `held` record comes from what was actually drawn: the `unit`, whether the board `changed` or was `kept`, what was `drawn`, the `pages`, `layout` and, on a picture turn, `picture` (its `view`). Most teacher rows carry a `cell` record (`part`, `column`: what the walk acted on for the child's line, `help`). Each child row carries `intent`, what the rule-based child meant its line as. Each teacher row carries `seams`: for every pair of neighbouring parts in the turn, the two kinds, the joint kind placed there (or none), the form said, and `by` (who wrote it).
   - The child is rule-based: steady, stuck, offtopic and steering. The steady child answers the closing question right in c4 and c5-t01 and misses it in c5-t02 and c6.
2. **The rules in force.** Read the director24 judgement from "## What fails now, by mechanism" to the end. The decision `dc-r8-director24` is what this run tests, on top of everything that held in director24 (the seam pass, the reader's record, captions said over their own kind of view, the order laws, pictures always draw, the answer board at the first word of the closing key, bridges, try-first, re-asks):
   - **L, a turn carries one new thing.** A turn that would run over 60 words breaks at a check-in: a verdict with its why and the next point end on the point's check-in ("Yahan tak theek hai?" and its other forms), and the card comes on the next turn. The aside's return question is a turn of its own, never glued onto a verdict or a key. The wrap is two turns when the child is still there: what was covered, then the sentence to her and the goodbye.
   - **H3, help remembers the whole lesson.** Help of any kind never says a sentence she has already said anywhere in the lesson. The first help on a part is that part's own unsaid wording (a point's second wording or simpler; a card's hint; a worked problem's second telling). A second request for help on the same part (a clarify or a give-up, after either) gets the worked answer on the card's answer board, and the card is closed. A request for Hindi is not a request for help: it gets the part's unsaid wording in Hindi words, or, with none left, the same part once more in Hindi words after a line that says so, then the question; a second Hindi request on the same part counts as a second request. A give-up on a card gets that card's own hint, never the point's.
   - **T3, the sentence about the child.** It is picked by code, never written by a model: the latest check card of the last skill she reached that she answered right at the first try, said as that card's authored `did` clause (in the script, beside the card) inside one of the wrap's authored frames ("Aaj tumne …"). No such card: no sentence, and the goodbye stands alone.
   - **P, a part is said once.** A point, a worked step or a card's first telling is said exactly once unless the child asks for it again: never dropped, never said again because of a reply.
   - **K3.** After a wrong answer to a yes-or-no card: "Nahi," and then the one sentence that states the fact.
   - **A3.** A second or third aside gets a reply with a word of the child's own line; a later AI line asks a question the lesson has not asked yet, never one she answered. After "bye" she says goodbye, with no menu. A Hindi request is promised in words that are true of what follows.
   - **Joins are the authored forms.** The decision's rule M (the reply model writes the joins) was built, read live on one topic before this run and switched off: more than half of the drafted joins failed the checks and one said was false. So every joint in this run is an authored form from the seam table, rotated by lesson and by count, and every `seams` entry should read `by: authored`. If you find one that does not, report the row.
3. **The scripts: `$D25/scripts/<topic>.json`.** Since director24 Learning wrote a `did` clause for each check card, rewrote the point `simpler`s that were written for the card that follows and the worked-example `simpler`s that paraphrased, and fixed the two captions, "upar", the raw key slots and c5-t02's S3 `covered` sentence. You are an independent read again: **list every sentence you hear that is untrue, gives away an answer that a later card asks for, repeats a question frame within a skill, or is unnatural to say**, with the row. **Read every caption said in your lessons against the view drawn on that row** (`held.picture.view` and what `held.drawn` shows). **Read every `did` clause said in a wrap against the card it came from and against the rows:** is it true of what the child did, and is it natural to say?
4. **The previous run, director24, for comparison:** `$D24/`, your topic's D24 hand report, and the judgement named above.

   | Topic | Words against board | Unsaid boards | Misgrades | Listening | Worked example | Class level | Screen and speech | Register | Promises |
   |---|---|---|---|---|---|---|---|---|---|
   | c4 | 0 | 0 | 0 | 3.5 | 4 | 4 | 4 | 3 | 3.5 |
   | c5-t01 | 0 | 0 | 0 | 3.5 | 4 | 4 | 4 | 3 | 4 |
   | c5-t02 | 1 | 0 | 0 | 3.5 | 4 | 4 | 3.5 | 3 | 4 |
   | c6 | 0 | 0 | 0 | 3.5 | 4 | 4 | 4.5 | 3.5 | 3.5 |

   **A known item, to report under its own heading and not to score:** in director23 and director24 the child's wrong answer "no place" (c5-t01, the card about 1/9's place on the line) set off the child-safety turn. The cause is in safety code that is frozen by the owner and has not been changed. If it happens in your lessons, give the rows and what she said, score the six axes on the rest of the lesson, and say in one line what listening would be with it counted.

5. **The items to score.** Rate each as working, partly or not working, with evidence.
   - **The director24 mechanisms** (the list "What fails now, by mechanism" in the judgement). For each that concerns your topic: gone, reduced (count), or still there (rows).
   - **Turn length and the check-ins, by hand.** Count the teacher turns over 60 words in each lesson, and of those the ones that hold a new point and a card together (the rule says none). Count the turns that end on a point's check-in with the card on the next turn. Then judge them as a listener: does the check-in read as a teacher pausing for the child, or as an interruption that makes the lesson drag? Say plainly whether you find the added check-ins tedious, and name the rows. Give each steady lesson's row count.
   - **Register, by ear.** Read each lesson aloud in your head as a tuition teacher would say it. Where does it still sound assembled? Name the five rows per lesson that most hold register down, and put each under exactly one cause: (a) a fixed form heard too often (a joint, an opener, a check-in, a switch line: quote it with its count in the lesson); (b) a sentence of the script; (c) the verdict and its why, as written; (d) the length or shape of the turn; (e) help; (f) something else, named. Give the count of rows under each cause for your topic. This is the question the run exists to answer.
   - **Joints, by hand, and against the record.** Count separately, with rows: a joint said where it does not belong; two joints at one seam or a filler word doubled across a joint; a seam with no joint where one was needed. Give the three counts and their total per lesson. Then check the row's `seams` list against what she said on 10 turns of your choice per lesson: does the record say what was heard, and is every part's kind what it is (hook, check-in, miss verdict, Hindi switch)?
   - **A part said once.** List every point, worked step or card's first telling that was never said (its card arriving cold), and every one said a second time when the child had not asked for it. Give the rows.
   - **The reader, by hand.** For every child row, compare its `intent` with the next teacher row's `cell.column` and with what she actually did. Count the lines recorded as the wrong kind, with rows. Count any right answer that was not graded.
   - **The ending.** The lead-in row, the closing question, the child's answer, what she did, the board on each of those turns, and the wrap quoted in full (both turns). Is every "covered" sentence true of a skill this lesson reached? The sentence about the child: is it there; which card's `did` is it; did she answer that card right at the first try (give the row); is it true of this lesson's rows; is it about something that took doing; does it sound like a teacher telling a child what she did? Where it is absent, was there truly no card right at the first try in the last skill she reached? After a miss: is there a miss verdict before the key, and does the wrap acknowledge what the child said after the check-in? Does the ending read as a person closing a lesson?
   - **Pictures.** For every picture request: the view drawn, the caption said (quote it), whether it is true of that view, whether it names anything a later card asks for, and whether the turn then asked by the question alone. Could the child answer that question from the picture, the board and her last two turns? Count the turns with no authored caption.
   - **Help, against the whole lesson.** For every clarify, give-up, Hindi request and hint: what she said, and whether any sentence of it had been said anywhere earlier in the lesson (give the earlier row). Count help turns that left the child with nothing new. For every second request on the same part: did she get the worked answer on the answer board, and was the card closed? **Judge each worked answer given this way:** would a hint have let this child do it herself, so that the worked answer took the question away from her? Count those, with rows. For every Hindi request: was what followed in Hindi words, and was her promise true of it?
   - **Asides in full.** For every aside: the park row (one sentence? which form? did the turn go on into the live part?), the return row (a turn of its own, one question the child can answer in a few words?), the child's answer, and her reply row. **Quote her reply in every case** and rate it: natural, flat (means nothing), or odd/wrong (misstates the child, states a fact, claims a taste, promises). Is the word in the slot a sensible word of the child's? Compare with director24's replies quoted in your D24 report: better, the same, or worse? Was any reply said twice? For every second or third aside in a lesson: does her reply carry a word of the child's line, and does it sound like listening? For every AI line after the first: did it ask something new, or something the child had already answered? After every "bye": a goodbye, or a menu? Was any park never returned to? Any return with no park?
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

**Reversal clauses for director25, set before the run.** Give the counts plainly so the main loop can apply them:
- (1) L, turn length: each steady lesson's row count, and whether you find the added check-ins tedious. A steady lesson over 170 rows, OR two judges finding the check-ins tedious → the break moves from 60 words to 80.
- (2) H3, the worked answer: on how many help turns was the worked answer given where a hint would have let the child do it? More than 2 in your topic → the worked answer moves to the third request.
- (3) H3, memory: how many help turns left the child with nothing new? More than 2 in your topic → the rule did not do its work, and help is rebuilt from the list of what she has said, not patched again.
- (4) T3, the sentence about the child: untrue of the lesson's rows in any lesson → it is dropped and the wrap ends on the goodbye. Unnatural to say in 2 lessons or more across the run → Learning rewrites the `did` clauses and frames before anything is scaled.
- (5) P: any part dropped or said twice unasked. One or more in the run while the run's own `partOnce` predicate read 0 on that row → the predicate reads the wrong thing and is rewritten from that row before another run.
- (6) Register: your score, and your count of rows under each cause (a) to (f). Register below 3.5 in two topics or more across the run → the cause with the most rows across the four reports gets the next round and nothing else does: (a) fixed forms → Learning writes two more forms for each form you counted, and the model-written joins get their second live read; (b) script sentences → those scripts get another independent read and rewrite; (c) the verdict and its why → the reply model writes them from the key and the authored why as facts, checked by code; (d) turn shape → the break moves to 45 words; (e) help → clause 3 applies.
- (7) The reader's record: your count of lines recorded as the wrong kind. More than 3 in your topic → the test children's intent tags are wrong and are rewritten; say which rows.
- (8) Captions and picture turns: captions that give away a later answer or say something the picture does not show (more than 1 in the run → captions generated by code from the board's parameters); picture turns the child could not answer from the question alone (more than 2 in your topic → a picture turn says the card whole again).
- (9) Listening or promises below 3.5 in your topic → name the rows (request × where), and say for each whether the rule is wrong, missing, or was not followed.
- (10) Script sentences: your count of untrue, giveaway, repeated-frame and unnatural sentences heard. More than 2 untrue or giveaway in your topic → that script gets another independent read before anything is scaled.
- (11) Any misgrade, any unsaid board, any contradiction → give each case with its mechanism.

## What to produce

**A. Your own hand counts for your 4 lessons:**
- (i) beats taught, out of beat turns;
- (ii) verdicts, out of keyed answers;
- (iii) contradictions by mechanism, each with its row, and unsaid boards as a separate count with rows;
- (iv) right answers called wrong, and wrong answers called right;
- (v) false keys.

Give a per-lesson table and totals, with director24's hand count for your topic beside yours.

**B. Each item in 5** (working, partly or not working, with evidence). Also give:
- **Frames:** count each repeated frame within 4 of her turns, with rows. Quote the variant forms you saw.
- **Board changes:** the number of turns with a change, how many were in the right place, and how many turns held the board.
- **Asides:** every one, with its park and return rows. Was it on time? In the child's words? Did it answer their question? Were there any taste claims?
- **Hints after wrong answers:** every one. Was the escalation right? Was anything re-said? Did every posed card end with its key said? Name any that didn't.
- **Turns over 60 words:** the count, and for each whether it reads as tutoring or monologue.
- **Pace:** how far each lesson got, compared with director24 (the steady lesson now runs to the end of the script: say whether the third skill is taught at class level).

**C. Defects.** For each, give the evidence and the layer:
- (a) script data;
- (b) runtime walk;
- (c) reply rendering and frames;
- (d) harness or child.

Flag what is new since director24, and what director24 had that is now gone.

**D. Scores 1–5, director24 → director25, one line each:**
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
