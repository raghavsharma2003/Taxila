You are a judge for Taxila, an AI Hinglish voice tutor for Indian children in classes 4-7. You have two jobs:
- judge whether the teacher in the recorded lessons below teaches the way a good human tuition teacher would;
- measure the run against a fixed scale gate.

Ground rules:
- Read everything yourself.
- Back every claim with concrete evidence: lesson, row and a short quoted line.
- Everything is read-only. Change nothing anywhere. You cannot write files, so return your whole report as your final message.

**Row numbering:** cite every turn as its 0-based index into the lesson `.json`'s turn array, written "row N".

Paths:
- D21 = evals/hybrid-side-by-side/results/2026-11-11-director21
- D20 = evals/hybrid-side-by-side/results/2026-11-11-director20
- D20 hand reports, one per topic: evals/hybrid-side-by-side/results/2026-11-11-director20/judges/report-<c4|c5t01|c5t02|c6>.md
- The director20 judgement and decision: docs/design/round7/judgements/director20-2026-11-11.md

## What to read

1. **The run under judgement, "director21": `$D21/`.**
   - The README gives run facts only, so count everything yourself.
   - Read your 4 lessons' `.md` in full. The steady lesson is now about three times as long as before (it runs to the end of the script); read all of it.
   - Use the `.json` for what was on screen. The lesson's rows are the array under `director`. Each teacher row's `held` record comes from what was actually drawn: the `unit`, whether the board `changed` or was `kept`, what was `drawn`, the `pages`, and `layout` (`layout.split` true when a second view was drawn beside the held board). **New:** most teacher rows carry a `cell` record, the walk's own address for that turn (`part`: the part she is on; `column`: what the child's line was read as; `help`: the help already spent); use it to check that she read the child's line correctly.
   - The child is rule-based: steady, stuck, offtopic and steering. It plays "pata nahi", picture requests, a cricket or Virat aside, "Hindi mein bolo", try-first, "samajh nahi aaya", "sawaal kya hai", "phir se bolo" and "aage chalo". **New in this run:** the steady child stays to the end of the script; the stuck child says "phir bhi samajh nahi aaya" straight after her first re-explanation (a second clarify on the same part); the child's answer to her return question now fits the question (what happened, what they like doing, who, what they like most); the child never answers a card her line did not say.
2. **The rules in force.** Read the director20 judgement from "## What fails now, by mechanism" to the end. The decision `dc-r8-director20` is what this run tests. In short, on top of the held board and the picture rules:
   - **R1, her reply after an aside is authored.** She parks an aside in one sentence; later she returns in a turn of its own with one authored question; the child answers; her next turn opens with one of Learning's authored reply forms for that kind of aside (a sport, a show, food, people, a game, anything else), with one slot filled by a word the child said, or a plain form when no word fits; a sad answer gets a sad form, no question, then the lesson. The model no longer writes this sentence. No form states a fact, a taste of hers, or a promise.
   - **P1, every promise is kept.** Every park is returned to before the goodbye; a return is a turn of its own (the close of the card just answered may lead it); a park's turn goes on into the live part; after her "Main AI teacher hoon" line she asks no question unless her next turn answers the child's reply.
   - **L1 to L4.** A "pata nahi" at a check-in is never a yes: after a point she says the point's simpler and then the card; after a key, the key and its why again and the check-in (at most twice). A "samajh nahi aaya" after a key gets the why again, then the check-in. A clarify or "pata nahi" at the greeting gets a plainer opening line, then the hook. A Hindi request on a card gets the simpler wording and then the card, with "Hindi mein bolti hoon" only when what follows actually changes.
   - **S1, how a card is re-asked.** After a hint on a card she said whole in one of her last two turns, she says only the card's question (its last sentence). A card from earlier comes back with one authored lead-in and then the whole card. "Ab isi par ek sawaal." only when the card follows in the same turn. No turn ends on a close with nothing for the child to do.
   - **A second clarify on the same part:** the same line again with its board up, then the check-in; never the card and never the next part.
   - **Authored lines are said whole and word for word** (no word swapping inside a sentence a person wrote; no unit started and cut).
   - **No why-question after a right answer** on a scripted card (there is no authored probe line yet). Say if a right answer ever passes where a good tutor would have asked why.
   - A worked example says its final answer after a right answer (c4 failed this in director20).
3. **The scripts: `$D21/scripts/<topic>.json`, and they changed a lot.** Since director20 the four pilot scripts were read sentence by sentence by readers who did not write them and fixed in three rounds (79 faults at the first read: untrue statements, sentences that gave a later answer away, every yes/no card in c4 keyed "No"). The list of every card and field changed, with old and new keys, is docs/design/round7/learning/PILOT-CHANGES-2026-11-11.md. You are an independent read: **list every sentence you hear that is untrue, gives away an answer that a later card asks for, repeats a question frame within a skill, or is unnatural to say**, with the row. Each script also has a `greetSimpler`, the `backTo` joint, and the aside replies come from data/lesson-aside-replies.json.
4. **The previous run, director20, for comparison:** `$D20/`, your topic's D20 hand report, and the judgement named above.

   | Topic | Words against board | Unsaid boards | Misgrades | Listening | Worked example | Class level | Screen and speech | Register | Promises |
   |---|---|---|---|---|---|---|---|---|---|
   | c4 | 0 | 0 | 0 | 3 | 4 | 4 | 4 | 3.5 | 3.5 |
   | c5-t01 | 0 | 0 | 0 | 3 | 4 | 3.5 | 4 | 3 | 2.5 |
   | c5-t02 | 0 | 0 | 0 | 3 | 4 | 3.5 | 4.5 | 3.5 | 3 |
   | c6 | 0 | 0 | 0 | 3.5 | 4 | 3.5 | 4.5 | 3.5 | 3.5 |

5. **The items to score.** Rate each as working, partly or not working, with evidence.
   - **The thirteen director20 mechanisms** (the table "What fails now, by mechanism" in the judgement). For each that concerns your topic: gone, reduced (count), or still there (rows).
   - **Asides in full.** For every aside: the park row (one sentence? which form? did the turn go on into the live part?), the return row (a turn of its own, one question the child can answer in a few words?), the child's answer, and her reply row. **Quote her reply in every case** and rate it: natural, flat (means nothing), or odd/wrong (misstates the child, states a fact, claims a taste, promises). Is the word in the slot a sensible word of the child's? Compare with director20's model-written replies quoted in your D20 report: better, the same, or worse? Was any park never returned to? Any return with no park?
   - **Clarify and give-up rows.** For every "samajh nahi aaya", "sawaal kya hai", "phir se bolo" and "pata nahi": where it came (the greeting, after a point, at a check-in, after a key, after a remediation, in a worked problem or step), what she did, and whether that was the right thing for that child. **Every second clarify on the same part:** what she did, and did it help or merely repeat? Count them. Using the row's cell address, count every line of the child's that she read as the wrong kind.
   - **Re-asks.** After each hint: did she say only the question? Could a child answer that question from what is on the board and what was just said, or did it need givens that were no longer in front of the child? Count the cases where the question alone was not enough. Count any whole card said again word for word within two turns.
   - **Hindi requests.** What changed after each one? Any "Hindi mein bolti hoon" followed by the same words?
   - **Stitched or natural.** Authored parts are now said by code, whole. Does a turn ever sound like two blocks set side by side with no join (quote it)? Count them.
   - **Joints and frames.** Quote each park, return, Hindi-switch, ask-again and back-to form you saw with its count; every sentence frame of hers repeated within 4 of her turns, with rows.
   - **The third skill** (steady lesson): is it taught at class level, with a real worked example, and does the lesson end properly?
   - **Carried over:** pictures (a picture line never contains the card's key and never has a hole where a number was removed), grading, no same-lesson re-pose of a card answered right, the held board. Note any regression.
   - **Known before judging, already fixed after this run was cut: do not count these toward register, only confirm you saw them.** Eight rows where a script used two words for one thing in the same turn (the scripts now use one term): c5-t01 "marks" beside "nishaan" (steady about row 50, steering about row 38); c6 "side" beside "bhujayein" (steady about row 20, steering about row 28); c4 and c5-t02 "slice" beside "tukde" (c4 steady about rows 92, 98, 100; c5-t02 steady about row 134). Any OTHER pair of two words for one thing in a turn is a fault: list it.
6. **The owner's standard:** docs/design/OWNER-RESET-2026-10-04.md.

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

**Reversal clauses for director21, set before the run.** Give the counts plainly so the main loop can apply them:
- (1) Authored replies: of her replies after an aside in your lessons, how many are odd or wrong, how many flat, how many natural. More than 1 in 4 odd or wrong → that kind's forms are rewritten. Judged worse than director20's model sentences overall → say so: the reply returns to the model with the library as examples.
- (2) Stitched sound: if register is below director20's score for your topic, say whether authored parts said whole by code are the cause → the reply model may join parts.
- (3) Question-only re-asks: the count where the question alone was not enough → above 1 in 5, the givens are re-said after the second miss.
- (4) Second clarifies: the count, and how many merely repeated without helping → above 1 in 5, Learning authors second wordings.
- (5) Listening, register or promises below 3.5 in your topic → name the rows (request × where), and say for each whether the rule is wrong, missing, or was not followed.
- (6) Script sentences: your count of untrue, giveaway, repeated-frame and unnatural sentences heard. More than 2 untrue or giveaway in your topic → the pilots get another independent read before anything is scaled.
- (7) Any misgrade, any unsaid board, any contradiction → give each case with its mechanism.

## What to produce

**A. Your own hand counts for your 4 lessons:**
- (i) beats taught, out of beat turns;
- (ii) verdicts, out of keyed answers;
- (iii) contradictions by mechanism, each with its row, and unsaid boards as a separate count with rows;
- (iv) right answers called wrong, and wrong answers called right;
- (v) false keys.

Give a per-lesson table and totals, with director20's hand count for your topic beside yours.

**B. Each item in 5** (working, partly or not working, with evidence). Also give:
- **Frames:** count each repeated frame within 4 of her turns, with rows. Quote the variant forms you saw.
- **Board changes:** the number of turns with a change, how many were in the right place, and how many turns held the board.
- **Asides:** every one, with its park and return rows. Was it on time? In the child's words? Did it answer their question? Were there any taste claims?
- **Hints after wrong answers:** every one. Was the escalation right? Was anything re-said? Did every posed card end with its key said? Name any that didn't.
- **Turns over 60 words:** the count, and for each whether it reads as tutoring or monologue.
- **Pace:** how far each lesson got, compared with director20 (the steady lesson now runs to the end of the script: say whether the third skill is taught at class level).

**C. Defects.** For each, give the evidence and the layer:
- (a) script data;
- (b) runtime walk;
- (c) reply rendering and frames;
- (d) harness or child.

Flag what is new since director20, and what director20 had that is now gone.

**D. Scores 1–5, director20 → director21, one line each:**
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
