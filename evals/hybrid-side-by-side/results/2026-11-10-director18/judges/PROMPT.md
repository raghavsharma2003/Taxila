You are a judge for Taxila, an AI Hinglish voice tutor for Indian children in classes 4-7. You have two jobs:
- judge whether the teacher in the recorded lessons below teaches the way a good human tuition teacher would;
- measure the run against a fixed scale gate.

Ground rules:
- Read everything yourself.
- Back every claim with concrete evidence: lesson, row and a short quoted line.
- Everything is read-only. Change nothing anywhere. You cannot write files, so return your whole report as your final message.

**Row numbering:** cite every turn as its 0-based index into the lesson `.json`'s turn array, written "row N".

Paths:
- D18 = /tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/judge-d18/evals/hybrid-side-by-side/results/2026-11-10-director18
- D17 = /tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/judge-d17/evals/hybrid-side-by-side/results/2026-11-10-director17
- D17 hand reports, one per topic: /tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/judge-d17/report-<c4|c5t01|c5t02|c6>.md

## What to read

1. **The run under judgement, "director18": `$D18/`.**
   - The README gives run facts only, so count everything yourself.
   - Read your 4 lessons' `.md` in full.
   - Use the `.json` for what was on screen. Each turn's `held` record now comes from what was actually drawn: the unit, whether the board `changed` or was `kept`, what was `drawn`, the `pages`, and `layout` (`split: true` with its two panels when a picture's second view is beside the held board).
   - The child is rule-based, as before: steady, stuck, offtopic and steering. It plays "pata nahi", picture requests, a cricket or Virat aside (including "aapko Virat pasand hai?"), "Hindi mein bolo", try-first, "samajh nahi aaya", "sawaal kya hai", "phir se bolo" and "aage chalo".
2. **The rule in force: the held board** (`dc-r7-held-board`), with the director17 decision `dc-r7-script-walk-v6-9` on top. Read /home/user/taxila-int/docs/design/round7/judgements/director17-2026-11-10.md from "Decision: dc-r7-script-walk-v6-9".
   - One board per unit: the unit's card board. A unit is a point and its ask, a worked example and its yourStep, a remediation and its then-card, or a bridge and the next skill's first card. A check is its own unit.
   - While the close of a just-answered card is spoken, the board is that card's answer-state board.
   - The board changes at most once per turn, at the start of the first spoken part of a new unit.
   - **New in v6.9:** a turn that says no unit part (an aside question or its return, an acknowledgement, a break menu, a stop menu, a goodbye) keeps the board that is up and does not move to the next unit. A bridge now belongs to the next card's unit and switches at its first spoken part.
   - A picture request draws its second view beside the held board, built only from the held board's own parts.
3. **The scripts: `$D18/scripts/<topic>.json`.** Learning's D12 since director17:
   - Bridges no longer carry a board of their own; each is written to be true of the next card's board.
   - No card is posed on bars that are already shaded or named so that the answer can be read off; no explanation states the key of a later card in its skill.
   - c5-t02: the s1 yourStep is on its own unnamed bars; c2 is on unnamed bars; e1's why is reworded; the remediations lost their own boards.
   - c4 s2: each point now models one grouping of its ask's own heap (e1: 12 laddoo in 4 groups of 3; e2: 24 mangoes in 4 groups of 6; e3: 12 marbles in 2 groups of 6).
   - c6: the ant's counter reads again, at 19 and at halfway; bridges reworded to the 10 × 6 rectangle and the square.
   - c5-t01: two lines reworded to what their board shows (the middle mark, the three gaps to 1).
   - **Learning's own watch items. Judge each in your topic:**
     - c4: e2's point models 1/4 before e3 teaches 1/4, and e1 and e3 both use a 12-object heap. Does the order confuse?
     - c5-t02: e1's why opens "2 patti, lambai ek hi, par neeche wali 8 mein bati hai…". Is it natural spoken Hinglish?
     - c5-t02: both gap remediations now ask the child to imagine the two empty parts over unshaded bars. Can a child follow?
4. **The previous run, director17, for comparison:** `$D17/`, your topic's D17 hand report, and the judgement named above.

   | Topic | Words against board | Unsaid board on screen | Misgrades | Listening | Screen and speech | Register | Promises |
   |---|---|---|---|---|---|---|---|
   | c4 | 3 | 4 | 0 | 3 | 3 | 3 | 3 |
   | c5-t01 | 3 | 3 | 0 | 3 | 3.5 | 3.5 | 3 |
   | c5-t02 | 1 | 1 | 0 | 3 | 4 | 3.5 | 3 |
   | c6 | 1 | 0 (2 listed) | 0 | 3 | 4 | 3.5 | 3.5 |

5. **The v6.9 items to score.** Rate each as working, partly or not working, with evidence.
   - **N1, turns that teach nothing hold the board.** Check every aside question, aside return, acknowledgement, break menu, stop menu and goodbye: was the board that was up kept, and did the walk stay on its unit? Count every turn where a board went up for a card she had not said.
   - **N2, bridges.** Every bridge: did the board switch at its first spoken part, and was the bridge true of the board it was said over?
   - **T1, the request table.** Score each pair you see, and list any that fail:
     - Hindi or clarify on a point, a worked step, a remediation, an open card: the live part re-said in different words; never the same sentence, never a skip past a remediation; with nothing left to re-say, the key and its why.
     - A miss after a simpler was already spent: the key.
     - "pata nahi" at a check-in after a point: the card is posed first.
     - A request (picture, repeat, try-first, Hindi) arriving where an aside reply is expected: served as that request.
     - An aside when no card is open: no "is sawaal ke baad"; a repeated aside is returned to once.
     - "haan" during a worked step: the next step, never a stop menu.
     - "aage chalo" with an aside pending: she moves on first.
   - **A5, the acknowledgement** after an aside reply: said only when the reply is about the aside, in three or more forms, and fitting what the child said.
   - **R6, wording.** Authored lines are said as written (no "jitna tukda humne liya"); one step opener per turn and none before the problem; the picture line ends with a full stop, keeps the card's "?", and says fractions as words.
   - **S10 and S11 (Studio).** Every picture request: is the second view built only from what the held board has (no invented bar), is `layout.split` recorded, and is her line true of it ("barabar" for equal parts)?
   - **D12 (Learning).** The items in 3, and the watch items.
   - **Carried over:** the held board's four rules, A4 (no reply to an aside graded), G1 (grading), V1″, A3 (no aside lost), K1, K3, K4, Q1, L1, F2. Note any regression.
6. **The owner's standard:** /home/user/taxila-int/docs/design/round7/OWNER-RESET-2026-10-04.md.

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

**Reversal clauses for director18.** Give the counts plainly so the main loop can apply them:
- (1) Any unsaid board on screen with N1 in place → Studio's seam refuses any board whose unit has no spoken part that turn. Give your count and rows.
- (2) Listening still below 3.5 with T1 in place → the failing table rows are re-authored with Learning, per topic. If below 3.5, name the rows (request × where) that failed, and say for each whether the row's rule is wrong or the rule was not followed.
- (3) Held cost above 0 (teaching said over a board that does not show it) → that unit gets paging back. Give each case.
- (4) Any misgrade → no further paid run until the key matrix covers the case.

## What to produce

**A. Your own hand counts for your 4 lessons:**
- (i) beats taught, out of beat turns;
- (ii) verdicts, out of keyed answers;
- (iii) contradictions by mechanism, each with its row, and unsaid boards as a separate count with rows;
- (iv) right answers called wrong, and wrong answers called right;
- (v) false keys.

Give a per-lesson table and totals, with director17's hand count for your topic beside yours.

**B. Each v6.9 item** (working, partly or not working, with evidence). Also give:
- **Frames:** count each repeated frame within 4 of her turns, with rows. Quote the variant forms you saw.
- **Board changes:** the number of turns with a change, how many were in the right place, and how many turns held the board.
- **Asides:** every one, with its park and return rows. Was it on time? In the child's words? Did it answer their question? Were there any taste claims?
- **Hints after wrong answers:** every one. Was the escalation right? Was anything re-said? Did every posed card end with its key said? Name any that didn't.
- **Turns over 60 words:** the count, and for each whether it reads as tutoring or monologue.
- **Pace:** how far each lesson got, compared with director17.

**C. Defects.** For each, give the evidence and the layer:
- (a) script data;
- (b) runtime walk;
- (c) reply rendering and frames;
- (d) harness or child.

Flag what is new since director17, and what director17 had that is now gone.

**D. Scores 1–5, director17 → director18, one line each:**
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

Also state plainly whether listening and promises reach 3.5 (listening was 3 in all four topics in director17), and whether register is at 3.5.

Keep it under 900 words, as structured markdown with tables. Be strict: the owner wants a teacher who actually teaches.
