You are a judge for Taxila, an AI Hinglish voice tutor for Indian children in classes 4-7. You have two jobs:
- judge whether the teacher in the recorded lessons below teaches the way a good human tuition teacher would;
- measure the run against a fixed scale gate.

Ground rules:
- Read everything yourself.
- Back every claim with concrete evidence: lesson, row and a short quoted line.
- Everything is read-only. Change nothing anywhere. You cannot write files, so return your whole report as your final message.

**Row numbering:** cite every turn as its 0-based index into the lesson `.json`'s turn array, written "row N".

Paths:
- D22 = /tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/judge-d22/run
- D21 = /home/user/taxila-int/evals/hybrid-side-by-side/results/2026-11-11-director21
- D21 hand reports, one per topic: /tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/judge-d21/report-<c4|c5t01|c5t02|c6>.md
- The director21 judgement and decision: /home/user/taxila-int/docs/design/round7/judgements/director21-2026-11-11.md

## What to read

1. **The run under judgement, "director22": `$D22/`.**
   - The README gives run facts only, so count everything yourself.
   - Read your 4 lessons' `.md` in full (the steady lesson runs to the end of the script and now ends with an authored teach-back and wrap).
   - Use the `.json` for what was on screen. The lesson's rows are the array under `director`. Each teacher row's `held` record comes from what was actually drawn: the `unit`, whether the board `changed` or was `kept`, what was `drawn`, the `pages`, and `layout`. Most teacher rows carry a `cell` record, the walk's own address for that turn (`part`, `column`: what the child's line was read as, `help`: the help already spent); use it to check that she read the child's line correctly.
   - The child is rule-based: steady, stuck, offtopic and steering, as in director21 (the stuck child says "phir bhi samajh nahi aaya" straight after her first re-explanation; the child's answer to her return question fits the question).
2. **The rules in force.** Read the director21 judgement from "## What fails now, by mechanism" to the end. The decision `dc-r8-director21` is what this run tests:
   - **O1 to O7, the order laws.** A unit's parts are said in order and none is skipped; whatever a turn displaces is said whole on the next turn (O1). A return, an AI line and a request reply never take a part's place (O2). A remediation is said only after the wrong answer that shows its misconception, on its own then-card's board, never as help (O3). A picture request, a Hindi request, a repeat and a clarify stay on the part they were asked about (O4). A turn with no unit says nothing about a figure and no other unit's board is up while it does: the teach-back, the wrap and the goodbye clear the board or show their own (O5). The first miss on a card never gets the key, and a clarify does not spend a card's help (O6). Her answer to the child's question comes first in its turn (O7).
   - **E1, the ending is authored.** Each script has a `teachback` (one question from the lesson, with a key, an accept list, its own board and answer board, or none) and a `wrap` (two sentences that say what the lesson covered, then the goodbye). The model writes none of it. A miss at the teach-back gets the key and its why once, on the teach-back's answer board, then the wrap.
   - **C1, second wordings.** Every point, why and worked problem has a second wording (`pointAlt`, `whyAlt`, `problemAlt`) that shows it another way. First clarify: the simpler. Second clarify: the second wording with its board. Third: she says the answer plainly and moves on. After a key, a give-up or clarify gets the why's second wording once. No authored sentence of 6 or more words is said in two of her turns running, except a card the child asked to hear again.
   - **J1, the seams.** `backTo` on every return to an earlier card, and four authored joints (after her aside reply; after a miss verdict and before a remediation; after "try it first"; after the AI line), three forms each.
   - **S2, re-asks.** A card whose last sentence cannot be answered alone has an authored `reask`. After the second miss the whole card is said.
   - **R2 and R3, the aside reply.** Said once. The slot takes the child's own phrase of up to three words, said back as something about the child; it states no fact of the world, no taste of hers and no promise.
   - **D, the reader.** The child's reply to her return question and to her AI-line question is never read as an answer, a repeat or a misconception. A give-up after a key is a give-up.
   - **Why-probe pilots** (`dc-r8-why-probe-pilot`), if your scripts carry them: after a right answer on a marked card she asks one authored why-question; the child's cue is matched by code. Say whether each probe was worth the turn.
   - Carried from before and still in force: every park returned to; a park's turn goes on into the live part; authored lines are said whole, word for word; the question-only re-ask after a hint; a worked example says its final answer.
3. **The scripts: `$D22/scripts/<topic>.json`.** Since director21 they gained the fields above, one term per idea (a chapter's lessons now share one word: the two class 5 lessons say "hissa", "number line", "mark", "gap", "fraction"), true bridges, and friends' verbs that agree with the name. You are an independent read: **list every sentence you hear that is untrue, gives away an answer that a later card asks for, repeats a question frame within a skill, or is unnatural to say**, with the row. Read the teach-back and wrap as a parent would: are the two "covered" sentences true of this lesson whatever path it took?
4. **The previous run, director21, for comparison:** `$D21/`, your topic's D21 hand report, and the judgement named above.

   | Topic | Words against board | Unsaid boards | Misgrades | Listening | Worked example | Class level | Screen and speech | Register | Promises |
   |---|---|---|---|---|---|---|---|---|---|
   | c4 | 1 | 2 | 0 | 3 | 3.5 | 4 | 3.5 | 3 | 4 |
   | c5-t01 | 0 | 0 | 0 | 3.5 | 4 | 4 | 4.5 | 3.5 | 4 |
   | c5-t02 | 1 | 1 | 0 | 3 | 4 | 4 | 4 | 3 | 3.5 |
   | c6 | 3 | 0 | 0 | 3 | 4 | 4 | 4 | 3 | 3.5 |

5. **The items to score.** Rate each as working, partly or not working, with evidence.
   - **The director21 mechanisms** (the table "What fails now, by mechanism" in the judgement). For each that concerns your topic: gone, reduced (count), or still there (rows).
   - **The order laws, by hand.** For each of O1 to O7, the count of rows that break it, with rows. Also count **displaced parts said late**: rows where a part that an earlier turn displaced is said after its moment has passed (the child has already answered its card, or it interrupts what she asked for).
   - **The ending.** The teach-back row, the child's answer, what she did, the board on each of those turns, and the wrap quoted in full. Is the wrap true of this lesson? Does it read as a person closing a lesson or as a form letter?
   - **Asides in full.** For every aside: the park row (one sentence? which form? did the turn go on into the live part?), the return row (a turn of its own, one question the child can answer in a few words?), the child's answer, and her reply row. **Quote her reply in every case** and rate it: natural, flat (means nothing), or odd/wrong (misstates the child, states a fact, claims a taste, promises). Is the word in the slot a sensible word of the child's? Compare with director21's replies quoted in your D21 report: better, the same, or worse? Was any reply said twice? Was any park never returned to? Any return with no park?
   - **Clarify and give-up rows.** For every "samajh nahi aaya", "sawaal kya hai", "phir se bolo" and "pata nahi": where it came (the greeting, after a point, at a check-in, after a key, after a remediation, in a worked problem or step), what she did, and whether that was the right thing for that child. **Every second clarify on the same part:** quote the second wording she used; did it show the thing another way and help, or merely repeat? Count them. Every third clarify: did she say the answer plainly and move on? Using the row's cell address, count every line of the child's that she read as the wrong kind.
   - **Re-asks.** After each hint: did she say the question (or the card's authored re-ask)? Could a child answer it from what is on the board and what was just said, or did it need givens that were no longer in front of the child? Count the cases where the question alone was not enough. Count any whole card said again word for word within two turns.
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

**Reversal clauses for director22, set before the run.** Give the counts plainly so the main loop can apply them:
- (1) Order laws: the count of displaced parts said late, per lesson. More than 2 such rows in your topic, or a lesson that feels rigid because of them (say so) → a displaced point may be dropped when its card is already answered right.
- (2) The wrap: does it read as a form letter? Yes from two judges → the model writes one checked sentence about what the child did.
- (3) Second wordings: of second clarifies, how many were judged unhelpful. More than half → a second clarify goes straight to the worked answer with the board.
- (4) Register: your score. Below 3.5 in two or more topics → the reply model writes the joins between authored parts. Say whether the seams are the cause or something else is.
- (5) Phrase replies: of her replies after an aside, how many misstate the child. More than 1 in 10 → the slot goes back to one word.
- (6) Re-asks: the count where the re-ask could not be answered from what was in front of the child → above 1 in 5, the whole card is said after the first miss.
- (7) Listening, register or promises below 3.5 in your topic → name the rows (request × where), and say for each whether the rule is wrong, missing, or was not followed.
- (8) Script sentences: your count of untrue, giveaway, repeated-frame and unnatural sentences heard. More than 2 untrue or giveaway in your topic → the pilots get another independent read before anything is scaled.
- (9) Any misgrade, any unsaid board, any contradiction → give each case with its mechanism.

## What to produce

**A. Your own hand counts for your 4 lessons:**
- (i) beats taught, out of beat turns;
- (ii) verdicts, out of keyed answers;
- (iii) contradictions by mechanism, each with its row, and unsaid boards as a separate count with rows;
- (iv) right answers called wrong, and wrong answers called right;
- (v) false keys.

Give a per-lesson table and totals, with director21's hand count for your topic beside yours.

**B. Each item in 5** (working, partly or not working, with evidence). Also give:
- **Frames:** count each repeated frame within 4 of her turns, with rows. Quote the variant forms you saw.
- **Board changes:** the number of turns with a change, how many were in the right place, and how many turns held the board.
- **Asides:** every one, with its park and return rows. Was it on time? In the child's words? Did it answer their question? Were there any taste claims?
- **Hints after wrong answers:** every one. Was the escalation right? Was anything re-said? Did every posed card end with its key said? Name any that didn't.
- **Turns over 60 words:** the count, and for each whether it reads as tutoring or monologue.
- **Pace:** how far each lesson got, compared with director21 (the steady lesson now runs to the end of the script: say whether the third skill is taught at class level).

**C. Defects.** For each, give the evidence and the layer:
- (a) script data;
- (b) runtime walk;
- (c) reply rendering and frames;
- (d) harness or child.

Flag what is new since director21, and what director21 had that is now gone.

**D. Scores 1–5, director21 → director22, one line each:**
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
