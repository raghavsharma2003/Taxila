You are a judge for Taxila, an AI Hinglish voice tutor for Indian children in classes 4-7. You have two jobs:
- judge whether the teacher in the recorded lessons below teaches the way a good human tuition teacher would;
- measure the run against a fixed scale gate.

Ground rules:
- Read everything yourself.
- Back every claim with concrete evidence: lesson, row and a short quoted line.
- Everything is read-only. Change nothing anywhere. You cannot write files, so return your whole report as your final message.

**Row numbering:** cite every turn as its 0-based index into the lesson `.json`'s turn array, written "row N".

Paths:
- D19 = /tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/judge-d19/evals/hybrid-side-by-side/results/2026-11-10-director19
- D18 = /tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/judge-d18/evals/hybrid-side-by-side/results/2026-11-10-director18
- D18 hand reports, one per topic: /tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/judge-d18/report-<c4|c5t01|c5t02|c6>.md

## What to read

1. **The run under judgement, "director19": `$D19/`.**
   - The README gives run facts only, so count everything yourself.
   - Read your 4 lessons' `.md` in full.
   - Use the `.json` for what was on screen. The lesson's rows are the array under `director`. Each teacher row's `held` record comes from what was actually drawn: the `unit`, whether the board `changed` or was `kept` (now compared against the board up BEFORE the turn), what was `drawn`, the `pages`, and `layout`. A picture turn also carries a `picture` record; when a second view was drawn beside the held board, `layout.split` is true with its two panels.
   - The child is rule-based, as before: steady, stuck, offtopic and steering. It plays "pata nahi", picture requests, a cricket or Virat aside (including "aapko Virat pasand hai?"), "Hindi mein bolo", try-first, "samajh nahi aaya", "sawaal kya hai", "phir se bolo" and "aage chalo". New: the child answers only a card her line has said, and the goodbye waits while a card she said is open.
2. **The rule in force: the held board** (`dc-r7-held-board`), with `dc-r7-script-walk-v6-9` and now the director18 decision `dc-r7-script-walk-v6-10` on top. Read /home/user/taxila-int/docs/design/round7/judgements/director18-2026-11-10.md from "Decision: dc-r7-script-walk-v6-10".
   - One board per unit: the unit's card board. A unit is a point and its ask, a worked example and its yourStep, a remediation and its then-card, or a bridge and the next skill's first card. A check is its own unit.
   - While the close of a just-answered card is spoken, the board is that card's answer-state board.
   - The board changes at most once per turn, at the start of the first spoken part of a new unit.
   - A turn that says no unit part (an aside question or its return, a joint, a break menu, a stop menu, a goodbye) keeps the board that is up. A bridge belongs to the next card's unit.
   - **New in v6.10:** a picture turn is decided once: the second view and her line come from one call. When no second view can be built for a board, she says one honest line that there is no second picture for this one (three forms) and re-says the live part; she must never describe a view that is not drawn.
3. **The scripts: `$D19/scripts/<topic>.json`.** Learning's D13 since director18:
   - A top-level `joints` block per script: `asidePark`, `asideReturn` (with `{said}`, the child's own words, and `{aside}`), `hindiSwitch`, `askAgain`, three or more forms each. Code says these authored forms; its own fixed sentences are only a fallback.
   - c4 s2: e3 is on a new heap (20 marbles as 2 groups of 10, asking 1/4 → 5); e1's point no longer states e3's answer.
   - c5-t01: e2's worked example is now 4 marks → 5 gaps → 1/5 (it used to be the yourStep's own numbers).
   - c5-t02: e1's why is a full sentence; both gap remediations are one part short and true of unshaded bars; s1 c1's answer board is shaded.
4. **The previous run, director18, for comparison:** `$D18/`, your topic's D18 hand report, and the judgement named above.

   | Topic | Words against board (all second view) | Unsaid boards | Misgrades | Listening | Screen and speech | Register | Promises |
   |---|---|---|---|---|---|---|---|
   | c4 | 1 | 0 | 0 | 3.5 | 4 | 3 | 3.5 |
   | c5-t01 | 3 | 0 | 0 | 3 | 3.5 | 3.5 | 3.5 |
   | c5-t02 | 3 | 0 | 0 | 3 | 3 | 3 | 3 |
   | c6 | 2 | 0 | 0 | 3.5 | 3.5 | 3.5 | 3.5 |

5. **The v6.10 items to score.** Rate each as working, partly or not working, with evidence.
   - **P6, the picture turn.** Every picture request: either a second view is drawn beside the held board (`layout.split`) and her line is true of that view and names nothing it does not draw (and never the key), or no view is drawn and she says the honest line and re-says the live part. Count any picture line spoken with no view drawn. Is the honest line natural, and does it vary?
   - **T2, the request table.** Score each row you see, and list any that fail:
     - Clarify ("samajh nahi aaya") at the check-in after a point: the point re-said in other authored words, not the card posed.
     - An aside with no card heard: answered or parked with no "is sawaal ke baad".
     - "Hindi mein bolo" with nothing live: the language changes and she goes on; no promise beyond the turn ("ab se").
     - An aside during a worked step: answered or parked in one clause first, then the step.
     - A Hindi or clarify request never uses up a card's help: after such a request, a miss still gets the simpler or the remediation, not the key.
     - After the child's reply to her aside question: the walk resumes at the unit's next unsaid part, never the card alone with a point dropped.
     - "woh maine bata diya" right after a card: she asks for it once more in one line; she does not give the key (a second one moves on with the key).
     - Try-first with no card open: she poses the card.
     - "Kuch poochna hai?" must not appear as a check-in.
     - Carried over from v6.9: a miss after a spent simpler gets the key; "pata nahi" at a check-in poses the card; "haan" in a worked step is the next step; a request where an aside reply is expected is served as that request.
   - **A6, the acknowledgement is removed.** "Achha, yeh jaankar achha laga" (or any canned acknowledgement) must not appear. After an aside reply: at most one neutral joint, then the unit's next part. Does the board wait for her first unit part?
   - **R7, pace and openers.** After a give-up: the key and its why, then a check-in; the next point in the NEXT turn (count any turn that stacks key + new point + new card). A step opener names its own step or is absent; one opener per turn. Nothing appended after a bridge ("Ab aage chalte hain." gone). After a miss the close is not "Toh poora jawab". In Hindi mode no single English word swapped into a Hindi frame beside its Hindi twin.
   - **Joints (D13 + Brain).** The aside park, the aside return, the Hindi switch and the ask-again line: are they the script's authored forms, do they vary within and across your 4 lessons, and does the return pick up what the child actually said (`{said}`)? Quote each form you saw with its count.
   - **No same-lesson re-pose.** A card the child answered right (with or without help) must not be posed again in that lesson, except when the child asks for the question again. List any.
   - **D13 (Learning).** The data items in 3: are they true of their boards and natural to say?
   - **Carried over:** N1 (turns that teach nothing hold the board; count any unsaid board), N2 (bridges), the held board's rules, A4 (no reply to an aside graded), G1 (grading), A3 (no aside lost), R6 (authored lines said as written). Note any regression.
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
  - **new this run:** a point, worked step or remediation that describes a figure the held board does not show (classify it as "held cost").

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

**Reversal clauses for director19.** Give the counts plainly so the main loop can apply them:
- (1) Any picture line spoken with no view drawn → picture requests are answered only with the held board and one honest line. Give your count and rows.
- (2) Listening still below 3.5 in your topic → that topic's failing request handling is authored turn by turn in the script. If below 3.5, name the rows (request × where) that failed, and say for each whether the rule is wrong, missing, or was not followed.
- (3) Register below 3.5 with authored joints → every remaining code-written sentence is listed and authored or removed. If below 3.5, list each repeated code-written sentence with its count.
- (4) Any misgrade, any unsaid board, or any held cost → as in director18's clauses. Give each case.

## What to produce

**A. Your own hand counts for your 4 lessons:**
- (i) beats taught, out of beat turns;
- (ii) verdicts, out of keyed answers;
- (iii) contradictions by mechanism, each with its row, and unsaid boards as a separate count with rows;
- (iv) right answers called wrong, and wrong answers called right;
- (v) false keys.

Give a per-lesson table and totals, with director18's hand count for your topic beside yours.

**B. Each v6.10 item** (working, partly or not working, with evidence). Also give:
- **Frames:** count each repeated frame within 4 of her turns, with rows. Quote the variant forms you saw.
- **Board changes:** the number of turns with a change, how many were in the right place, and how many turns held the board.
- **Asides:** every one, with its park and return rows. Was it on time? In the child's words? Did it answer their question? Were there any taste claims?
- **Hints after wrong answers:** every one. Was the escalation right? Was anything re-said? Did every posed card end with its key said? Name any that didn't.
- **Turns over 60 words:** the count, and for each whether it reads as tutoring or monologue.
- **Pace:** how far each lesson got, compared with director18.

**C. Defects.** For each, give the evidence and the layer:
- (a) script data;
- (b) runtime walk;
- (c) reply rendering and frames;
- (d) harness or child.

Flag what is new since director18, and what director18 had that is now gone.

**D. Scores 1–5, director18 → director19, one line each:**
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

Keep it under 900 words, as structured markdown with tables. Be strict: the owner wants a teacher who actually teaches.
