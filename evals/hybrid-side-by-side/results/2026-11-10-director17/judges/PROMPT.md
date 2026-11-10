You are a judge for Taxila, an AI Hinglish voice tutor for Indian children in classes 4-7. You have two jobs:
- judge whether the teacher in the recorded lessons below teaches the way a good human tuition teacher would;
- measure the run against a fixed scale gate.

Ground rules:
- Read everything yourself.
- Back every claim with concrete evidence: lesson, row and a short quoted line.
- Everything is read-only. Change nothing anywhere. You cannot write files, so return your whole report as your final message.

**Row numbering:** cite every turn as its 0-based index into the lesson `.json`'s turn array, written "row N".

Paths:
- D17 = /tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/judge-d17/evals/hybrid-side-by-side/results/2026-11-10-director17
- D16 = /tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/judge-d16/evals/hybrid-side-by-side/results/2026-11-09-director16
- D16 hand reports, one per topic: /tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/judge-d16/report-<c4|c5t01|c5t02|c6>.md

## What to read

1. **The run under judgement, "director17": `$D17/`.**
   - The README gives run facts only, so count everything yourself.
   - Read your 4 lessons' `.md` in full.
   - Use the `.json` for what was on screen:
     - each turn's new `held` record: the board that was up, its unit, and `switchTo` (the one board change, with the character offset where it happens);
     - `pageParts` (her line's parts, each with its beat), `gate` (H5's check) and `screen`.
   - The child is rule-based, as before: steady, stuck, offtopic and steering. It plays "pata nahi", picture requests, a cricket or Virat aside (including "aapko Virat pasand hai?"), "Hindi mein bolo", try-first, "samajh nahi aaya", "sawaal kya hai", "phir se bolo" and "aage chalo".
2. **The big change: the held board** (decision `dc-r7-held-board`, in /home/user/taxila-int/docs/design/round7/judgements/director16-2026-11-09.md from "Decision: dc-r7-held-board").
   - The board follows the card. A unit is a point and its ask, a worked example and its yourStep, a remediation and its then-card, or a bridge and the next skill's first card. A check is its own unit.
   - One board per unit: the unit's card board. While the close of a just-answered card is spoken, the board is that card's answer-state board.
   - The board changes at most once per turn, at the start of the first spoken part of a new unit.
   - No card is on screen that she has not said, and an unsaid card is never graded.
   - Hindi, clarify, aside, "sawaal kya hai" and repeat turns hold the board that is up.
   - A picture request draws its second view BESIDE the held board (a split board), never instead of it. Her picture line is built from the drawn view ("Pizza: 3 alag-alag tukde"), never "yahi numbers". When no view can be drawn she promises no picture.
3. **The scripts: `$D17/scripts/<topic>.json`.** Learning's D11 rewrote them for the held board:
   - Each unit's spoken parts are meant to be true of the unit's card board: points were reworded, or the card board redrawn to carry both.
   - Remediations are reworded to their then-card's figure and no longer carry their own board.
   - No rhetorical "?" outside a card question or the worked problem; hooks are statements.
   - Compare cards whose prompt names the fractions are posed on unnamed bars (cut into parts, no fraction written).
   - Renumbering: c5-t01's 1/11 card is now 1/12 m, and 1/8-vs-1/9 is now 1/5 vs 1/6; c5-t02's s1 remediation is sixths and twelfths.
   - **Learning's own four watch items. Judge each in your topic:**
     - c5-t02: the s1 worked board shows 1/6 and 1/3 shaded, which makes the yourStep's answer (Sana) visible.
     - c4: the s2 points lost their small worked groupings and now teach the method only. Does the teaching suffer?
     - c5-t02: the s2 and s3 gap remediations both use "two parts short" on different strips.
     - c4 still poses titled strips; only c5-t02's untitled strips moved to unnamed bars.
4. **The previous run, director16, for comparison:** `$D16/`, your topic's D16 hand report, and the director16 judgement named above.

   | Topic | Contradictions (paging / second view) | Misgrades | Listening | Screen and speech | Register | Promises |
   |---|---|---|---|---|---|---|
   | c4 | 5 (4 / 1) | 0 | 3 | 3 | 3.5 | 3.5 |
   | c5-t01 | 0 | 1 (wrong called right) | 3 | 4.5 | 3.5 | 3 |
   | c5-t02 | 2 (1 / 1) | 0 | 3 | 3.5 | 3.5 | 3 |
   | c6 | 1 (1 / 0) | 0 | 3.5 | 4.5 | 3.5 | 3.5 |

5. **The v6.8 items to score.** Rate each as working, partly or not working, with evidence.
   - **The held board.** For every turn check the four rules: at most one board change; a change only where a new unit's first spoken part begins; every spoken part is about the board that is up; no graded answer to a card she did not say. Count every break, with its row.
   - **What the held board costs.** Find every point, worked step or remediation that is now said over a board that does not show what it describes (it used to have its own picture). Count them, and say for each whether the child could still follow. This decides reversal clause 1.
   - **Picture requests.** Every one: was a second view drawn beside the held board, was her line true of it, and when nothing could be drawn did she promise nothing?
   - **A4, aside questions.** An aside question ends her turn with no card posed or pinned. The child's next reply gets a one-line acknowledgement and is never graded; then the card is said aloud. List every aside with its rows. Any reply to an aside graded against a card is a misgrade.
   - **G1, grading.** Any answer with the wrong sign, a dropped or wrong unit, or a near number: was it graded correctly? List every misgrade either way.
   - **V1″.** Authored lines keep their own "?"; her model copy of the hook never appears.
   - **B1‴, Hindi and clarify.** "Hindi mein bolo" gets the live part's own text in different words; during a worked step it gets that step's line; a simpler spent on Hindi counts as spent, so the next miss gives the key; a closed card is never reopened; the greeting's "pata nahi" never carries into a later beat.
   - **R5, wording.** Check-ins vary across three or more forms; a worked close says its why once; no "Ab agla kadam" after a remediation; no doubled "Pehla kadam… Pehle…"; number agreement; "aage chalo" never gets the stop menu.
   - **H5, the counter.** For each of your contradictions, say whether the turn's `gate` flagged it. List any gate flag you did not count, and why.
   - **D11 (Learning).** The reworded points and remediations, the unnamed bars, the new numbers (natural for the class?), and the four watch items above.
   - **Carried over:** A3 (no aside lost), P5, K1, K3, K4, Q1, L1, F1′, F2. Note any regression.
6. **The owner's standard:** /home/user/taxila-int/docs/design/round7/OWNER-RESET-2026-10-04.md.

## The scale gate

All of these must hold:
- ≥ 80% of beats taught.
- ≥ 90% of keyed answers get a verdict.
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

**Reversal clauses for director17.** Give the counts plainly so the main loop can apply them:
- (1) The held board costs teaching: the worked-example or class-level axis falls below 3.5 because a point or remediation lost its own picture → paging returns for those units. Give your "held cost" count and say whether it pulled either axis below 3.5.
- (2) Listening still below 3.5 with A4 and B1‴ in place → request handling moves to an explicit table (request × beat kind → one response shape). If below 3.5, list the request and beat-kind pairs that failed.
- (3) Any misgrade → no further paid run until the key matrix covers the case. Give each misgrade's card, the child's words and the key.
- (4) The counter: H5 misses more than 1 of the hand count across the run → the counter is retired as a gate input.

## What to produce

**A. Your own hand counts for your 4 lessons:**
- (i) beats taught, out of beat turns;
- (ii) verdicts, out of keyed answers;
- (iii) contradictions by mechanism, each with its row;
- (iv) right answers called wrong, and wrong answers called right;
- (v) false keys.

Give a per-lesson table and totals, with director16's hand count for your topic beside yours.

**B. Each v6.8 item** (working, partly or not working, with evidence). Also give:
- **Frames:** count each repeated frame within 4 of her turns, with rows. Quote the variant forms you saw.
- **Board changes:** the number of turns with a change, how many were in the right place, and how many turns held the board.
- **Asides:** every one, with its park and return rows. Was it on time? In the child's words? Did it answer their question? Were there any taste claims?
- **Hints after wrong answers:** every one. Was the escalation right? Was anything re-said? Did every posed card end with its key said? Name any that didn't.
- **Turns over 60 words:** the count, and for each whether it reads as tutoring or monologue.
- **Pace:** how far each lesson got, compared with director16.

**C. Defects.** For each, give the evidence and the layer:
- (a) script data;
- (b) runtime walk;
- (c) reply rendering and frames;
- (d) harness or child.

Flag what is new since director16, and what director16 had that is now gone.

**D. Scores 1–5, director16 → director17, one line each:**
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
- Would you let Learning's 30-topic staged batch go live on this runtime? Yes or no, and why.

Also state plainly whether listening and promises reach 3.5 (they failed in three topics in director16), and whether register held at 3.5.

Keep it under 900 words, as structured markdown with tables. Be strict: the owner wants a teacher who actually teaches.
