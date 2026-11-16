# Brain status

Newest entry first. Per main's 029: reports here and in commit messages, never by message.

## 2026-11-16 · `fae6adbd` (T3, c4 steady 96), `9717b18e` and `6b43c214` (M), `92a68d50` (H3 give-up)

**Done:**
- **T3** (036 item 1): the wrap's sentence about her is code's (`didSentence`, server/brain/say.js). It picks:
  - the last skill she reached;
  - in it, the latest check card she answered right at the first try (`rightLog`, misses 0);
  - that card's `did` (`{hi, en}`), in one of `wrap.didFrames` rotated by the lesson seed.
  A card with no `did` is skipped. No such card: no sentence. The model's `childSentence` is no longer called on the wrap.
  No script on int/r6 carries `did` yet, so the dry wrap is unchanged.
- **c4 steady 96** (036 item 3): tests/fixtures/c4-steady-96.json holds the director24 child line at 95 ("nahi, chhota hoga") and
  the live row 96.
  - tests/r8-director24-part96.test.mjs rebuilds the state from the run's script copy and plays her line through `planTurn` and `textReply`.
  - `partOnce` flags the live row. It reads 0 on today's turn (verdict, why, e2's point; the card held) and on the next one (the card).
- **M** (035 item 3), in the turn's own reply call:
  - The one-call reply's last note asks for one `JOIN <kind>: <words>` line for each joint the turn may need and for the verdict's opener.
  - Code takes those lines off the draft before any guard reads it, on the streamed path too.
  - The seam pass checks each line (`joinProblem`): one sentence, at most 12 words, no digit, no fraction word, no question, no screen
    word, no term of a card she has not answered, none of her last four turns. A verdict opener must also say its verdict.
  - On a failure, or with no line written, the authored form or code's frame is said.
  - Each seam records `by: model|authored`, plus `fellBack` with the reason. The verdict's seam carries `opener`.
  - Gated `joinChecked` rereads every model join and opener. New counts rows: `joinsWritten`/`joinsFellBack`, `openersWritten`/`openersFellBack`.
  - The dry stub writes no JOIN lines, so every joint and opener falls back and no dry line changed.
  - Not done: the why's opener. A why is joined to its verdict by "kyunki"/"because" inside one sentence, so there is no opener for
    the model to write and for code to check. Say if you want one anyway.
- **H3, give-up on a card** (c5-t01 stuck 6, c4 steering 32): a give-up on a live card says the card's own `ask.simpler`, the give_up
  cell's first line, before the card. Before, it said the beat's simpler, a hint for the point. Dry: c5-t01 stuck 6 changed as asked,
  and the Hindi request at 8 now says the beat's wording, which is new to her.
- Dry matrix after each step: 0 on every gated predicate. Counts: only the new rows moved.

**Next:** the rest of H3, a second request for help on the same part getting the worked answer with the board. It waits on the Hindi
question below because it changes the same pinned rows. Then the rest of A3 (repeated asides, the AI line's re-ask), then the harness flags.

**Not ready for director25 yet:** H3's second-request rule is open. M can only be read in a live run; the dry stub writes no joins.

**Questions for main:**
- The Hindi H3 question in the entry below is still open, and it decides the second-request rule too. A second request getting the
  worked answer breaks the same pinned rows: v68 c4 stuck 8, v610 alreadySaidKey stuck c5-t01 60, v64 K1 steering c4.
  May I retire them?

## 2026-11-16 · `979fe7fb` (item 8, harness) and `1700767c` (H3)

**Done (gated: test:all 7343 pass; the only failures are the two worktree-only browser suites):**
- Item 8, harness:
  - No false key from a whole ("8/8 = 1") or from a term being explained ("1/1 ka matlab").
  - `contradictionsV6` no longer checks a close against the next unit's board: 23 → 3 on the dry matrix.
- H3: the walk remembers every sentence she says in the lesson. A clarify or a give-up says the first help not said anywhere in it,
  else the card alone. `helpRepeats` now reads the whole lesson for these: 5 → 0.

**Question for main (H3):** sending a Hindi request to the worked answer whenever the lesson's wordings are spent breaks three pinned
live-walk tests that encode the older rule (new words, then the card):
- r7-brain-v68 "c4 stuck 8";
- v610 alreadySaidKey stuck c5-t01 60;
- v64 K1 steering c4.

Should I retire those rows for H3? Until you say, a Hindi request keeps her last two turns, and it gets the worked answer only on the
worked example's step.

**Still open from 035:**
- M (the model writes the joins).
- The rest of H3: a second request goes to the worked answer; a give-up on a card gets the card's own hint.
- T3 (waits on `did`).
- The rest of A3: repeated asides; the AI line's re-ask.

## 2026-11-16 · `1170fb85`, `5bded99b`, `e88cd8b9` (dc-r8-director24 items 1, 2, 4, 7 and part of 5)

**Done (each gated: test:all 7342 pass at the last; the only failures are the two worktree-only browser suites):**
- 1, the record:
  - A miss verdict is recorded only where a miss word is said.
  - A check-in is a check-in, never an aside.
  - The greet's simpler is the hook, never a verdict.
  - The closing key turn's verdict is a verdict, never a point.
  - The Hindi switch is in the record.
- 2, P: the held parts were said twice (c5-t02 steering 38, the run's one contradiction). Gated `partOnce` reads that row and c4 steady 96
  on director24's live rows, and 0 on the dry matrix. I could not get the dry matrix to reach c4 steady 96 (the e2 point never said).
- 4, L: a turn over 60 words that holds a point and a card is split at the point's check-in. The close's why, a bridge and a held part
  now count toward the cap. `longPointAndCard` (new count) and gated `longPointCard`: 25 → 0.
- 5, H3, in part: a Hindi request on a worked step with nothing unsaid gets the worked answer and closes the step (c6 offtopic 34).
- 7, K3: "Nahi," then the fact (gated `ynNahi`).
- 7, A3: after "bye", a goodbye, never the stop menu (gated `goodbyeNoMenu`: 11 → 0).
- Counts: in each commit message.

**Not yet:**
- 3, M: the model writes the joins.
- The rest of 5, H3: no help says a sentence from anywhere in the lesson; a second request goes to the worked answer; a give-up on a card
  gets the card's own hint.
- 6, T3: waits on Learning's `did` field.
- The rest of 7, A3: the second and third aside replies in the child's words; an AI line that never re-asks what she answered.
- 8, the harness: `contradictionsV6` on a verdict over its own answer board; the false keys at c5-t01 steady 92 and c4 stuck 26.

**What my gate could not run:** the two browser suites (they fail only in my worktree), and Learning's newest scripts beyond `3e25c5c60`.

**Questions for main:** is `did` (`{hi, en}` on each card) the field name to give Learning for T3?

## 2026-11-16 · 035 read (dc-r8-director24)

Working in 035's order: the seams record, P, M, L, H3, T3, K3/A3, then the harness. I'll write "ready for director25" here with the sha
when the predicates for P, M, L and H3 read 0 on the dry matrix, turns over 60 words that hold a point and a card read 0, and Learning's
`did` clauses are in. For T3 I propose the field `did` (`{hi, en}`) on each card. The safety read stays as it is.

## 2026-11-16 · `cf60489e` (main's 034)

**034 read.** `viewCaption` and `wrap.ack` stand.

**Done (gated: test:all 7325 pass; the only failures are the two worktree-only browser suites):**
- `quietPictureLines`, as asked: with Learning's `claude/r7-learning` scripts (3e25c5c60) on this commit it reads 0 of 16 picture turns,
  and every gated predicate reads 0. The last quiet line was a picture after a key: the board up is the card's answer board, so the
  caption is now found by `answerBoard` too. One false `authoredWhole` flag (a caption sharing words with a simpler) is fixed.
- The two walk faults reproduce on a fixture: Learning's c4 script with e1's point cut to two sentences, so the point and card share a
  turn (`tests/fixtures/scripts-point-card-one-turn`, run by `r8-main-034`). They are fixed there:
  - stuck 48: a second clarify at a then-card's check-in stays on that card, with help not yet said, else the card's worked answer.
  - steering 34: a give-up is not a wrong answer, and the walk's give-up-turned-repeat is not a request of hers, so the card's
    question is asked alone.

  Before the fix the fixture reads 3 flags (steering 34 `cardWholeAgain`, stuck 48 `clarifyCard` and `orderStays`); now 0.
- Counts: none moved on the pilots.

**Questions for main:** none.

## 2026-11-16 · `fe602e6b` (harness) and `d90164b2` (A2 on a worked step)

**Done (both gated: test:all 7301 pass; the only failures are the two worktree-only browser suites):**
- Harness, item 8:
  - `cardWholeAgain` reads a one-sentence card when a shorter question exists (a reask, or a question clause after its colon). It
    flags director23's c5-t01 steady 10, stuck 14 and steering 10, and 0 on the dry matrix. The walk asks such a card by that clause.
  - `hindiNewWords` reads a switch-and-card-only turn (c4 stuck 10, steering 8; c5-t02 steering 8). The walk now says new words there.
  - A question's numbers are never a false key (c5-t02 steady 132).
  - A close page is not counted against the next unit's board (`contradictionsV6`, c4 steady).
- A2: asked her taste on a worked step, the AI line ends on its question. The step is held, the reply leads the next turn in the
  child's words, then one step.

**Where director24 stands:**
- The seam predicates read 0 from `seams`.
- `readerAgrees` reads 0 with no equivalence table.
- Every gated predicate reads 0 on the dry matrix.
- `quietPictureLines` reads 9. It reaches 0 only when Learning authors `viewCaption` for the c4, c5-t01 and c5-t02 boards, so this is
  not yet "ready for director24".

**Still open:** the reply to a repeated aside in the child's words (c6 offtopic 24, 32) needs a better word pick or authored forms.

**Questions for main:** can Learning author `viewCaption` (and `wrap.ack`) on the four pilots? That is the last thing director24 waits on
from me.

## 2026-11-16 · `cb21c01b` (dc-r8-director23 T2, C, H2, boards, K2, A2 in part)

**Done (gated: test:all 7298 pass; the only failures are the two worktree-only browser suites):**
- T2:
  - A miss on the closing question gets a miss verdict before the key.
  - The sentence about the child is said to her in the second person, about the hardest thing she got right. Code picks it: the
    closing question if right, else the card right after the most misses. A third-person sentence is not said.
  - The wrap opens with Learning's `wrap.ack` when the child spoke after the closing key's check-in.
- C: the picture turn says Learning's `viewCaption` when authored, then the card's question alone. `quietPictureLines` reads 9 until
  the captions are authored.
- H2: a help turn whose lines are all in her last two turns says the first help not there (the cell's lines, the card's simpler, the
  point's simpler, `pointAlt`). With none left and a card following, the card alone. New gated `helpRepeats`: 0.
- Boards: a remediation on its own turn is drawn on its own board (c4 steady 98).
- K2: after a wrong answer to a yes-or-no card, one sentence that states the fact.
- A2, in part: the child's answer to her AI-line question gets a reply in the child's words (c4 offtopic 20).
- Counts: cardsSaid 280 → 272, cardsSaidAgainWithin2 36 → 28, boardChanged 313 → 314, boardKept 318 → 317, quietPictureLines (new) 9.

**Not yet, and why:**
- A2's AI question on a worked step (c6 stuck 38, steering 30). Keeping the question makes the next turn say the held step and the next
  step together, with no check-in between. It needs the walk to hold the step itself, a state change I'll make next.
- A2's reply to a repeated aside (c6 offtopic 24, 32). The word picker chose "maara" ("Achha, maara!"). It needs a better word pick or
  Learning's forms, so it stays on the neutral line for now.

**Doing next:** the harness fixes (item 8, in the working tree): `cardWholeAgain` on one-sentence cards with a shorter question, `hindiNewWords`
on a switch-and-card-only turn (with the walk now saying new words there), no false key from a question's givens, and no contradiction
counted for a close checked against the next unit's board. Then the A2 step hold.

**Questions for main:** none new.

## 2026-11-16 · `d93431e1` (dc-r8-director23 R2, the reader's record)

**Done (gated: test:all 7295 pass; the only failures are the two worktree-only browser suites):**
- The row's column is what the walk acted on this turn: no stale cell from a move built on the last one. A park or an aside acknowledged
  is `aside`, a break or stop is `stop`, her reply's answer is `aside_reply`.
- Her reply after a return or AI-line question goes on from where the lesson stood: an earlier-posed card's point is not said again
  (c5-t01 stuck 40, c5-t02 stuck 40). The second half of a split turn no longer carries the reply turn's acknowledgement (c4 offtopic 46).
- A line after the closing key's check-in is never graded.
- `readerAgrees` has no equivalence table: it matches by name, and the only other pairs are listed with a reason each. It reads 0.
  New gated `columnOfRead` reads 11 on director23's live rows and 0 on the dry matrix.
- Counts: columns.repeat 21 → 8, misconception 117 → 106, give_up 51 → 65, aside 8 → 24, aside_reply (new) 18, stop (new) 11.

**Doing next:** T2, pictures (C) and H2 are in the working tree; then boards, K2/A2, harness.

**For Learning (C):** I've named the caption field `viewCaption`, `{hi, en}`, placed beside any `board` a picture request can redraw
(an explain beat, a card, a worked step, a remediation). Brain finds it by its board and says it before the card's question. The counts
table now has `quietPictureLines`; it reads 9 until captions are authored. The wrap's acknowledgement, when the child spoke after the
closing key's check-in, is read from `wrap.ack` (a list of `{hi, en}` forms).

**Questions for main:** are `viewCaption` and `wrap.ack` the names you want to give Learning?

## 2026-11-16 · `748e700b` (dc-r8-director23 S, the seam pass)

**Done (gated: test:all 7292 pass; the only failures are the two worktree-only browser suites):**
- `server/brain/seams.js`: one pass over the finished turn's parts. It strips every joint an earlier pass left, labels the parts and
  places at most one joint a seam from `SEAM_TABLE`, keyed by the two kinds:
  - aside reply or AI line into the lesson;
  - miss verdict into remediation;
  - a return to an earlier card, after a then-card's verdict in the same turn or opening a turn;
  - try-first into the card.

  None between a point and its own card or a verdict and its own why. A filler that opens two neighbouring parts, or follows a
  fillers-only acknowledgement, is said once. Rows carry `seams`.
- Every other joint site in say.js is deleted.
- Forms rotate from a seed of the lesson key plus the count said; the verdict openers and the why's opener rotate from the same seed.
  The eval gave every lesson one session id (that was the judges' "one form in every lesson"), so each eval lesson now has its own
  `ctx.lessonKey`; a live lesson keys on its session id.
- The seam predicates read `seams` only: `backToJoint` and `missRemediationJoint` are rewritten, and the new `seamJoints` is gated. All read 0.
- Counts: joints.backTo 9 → 31 (the in-turn returns), afterAside 9 → 6, afterAiLine 9 → 10, turnsOver60Words 74 → 70.

**Doing next:** R2 (in the working tree, gating next), then T2, pictures, H2, boards, K2/A2, harness.

**R2 finding, as asked:** the 11 "misconception" rows wrote no misconception to the learner record. All 11 child lines were read
`no_evidence`, and evidence is written from the reading (`cls.outcome`, state.js), never from the row's column. The column was stale: a
move built from the last one (K's second wording) kept that turn's cell. So these were not misgrades; the fix is in R2.

**Questions for main:** none.

## 2026-11-16 · 033 read (dc-r8-director23)

Working in 033's order: S (the seam pass) first, then R2, T2, pictures, H2, boards, K2/A2, harness. I'll put "ready for director24"
here with the sha when the seam predicates read 0 from `seams`, `readerAgrees` reads 0 with no equivalences, and the quiet picture
lines read 0. The safety read in classify.js is left alone, as is the test child's "no place".

## 2026-11-16 · `b953f533` (main's 030 and 031)

**030 read.** J2 stands as rules. If director23's judges count more than 2 misplaced, stacked or missing joints in any topic, I
build the single seam pass as decided before any other work.

**Done (gated: test:all 7281 pass; the only failures are the two worktree-only browser suites):**
- T2: the teach-back's turn says one `teachback.leadIn` form before the question, rotation seeded by the lesson. Gated
  `teachbackLeadIn`: 0.
- T5: the wrap says each reached skill's `covered`, in order, then T4's sentence if it passes, then the goodbye; `wrap.covered`
  only as the fallback. Gated `coveredReached`: 0.
- A right teach-back answer: no check-in; the verdict leads the wrap in the same turn over the answer board from the first word.
  A miss as built (key and why on the answer board, check-in, then the wrap).
- `repeatedAuthored` no longer exempts cards (a card's question after new help in the same turn is still the help's ask). It
  stays pending: 11 on the dry matrix, mostly the picture request saying the card whole again (askAndCard's rule) and a set-up
  sentence said again after a miss.
- Counts: teacherTurns 680 → 678, childLines 664 → 662, moves.teachback 8 → 6, reads.no_evidence 369 → 367, boardKept 320 → 318,
  turnsOver60Words 72 → 74.

**Doing next:** compile step 3, column by column (repeat first).

**Questions for main:** should a picture request still say the card whole (askAndCard), now that repeatedAuthored counts it?
I've left it as built.

## 2026-11-16 07:20 · `7cd956e1` (A and B)

**Done (gated: test:all 7245 pass; the only failures are the two worktree-only browser suites):**
- A: the reply to the child's answer after her AI-line question takes the phrase form of the same shape ("Achha, toh tumhara favourite
  hai Virat.").
- B: a bridge changes no board; the next unit's board goes up with its first part. r7-brain-v69 N2 changed to the rule.
- Counts: boardChanged 292 → 303, boardKept 337 → 326 (the switch moves from the bridge to the next unit's first part, often a turn
  later); turnsOver60Words 64 → 65.

With this, Brain's items of dc-r8-director22 are in: R, T (Brain's parts), J2, W, H, K, A, B, and the harness (intent on every row,
the steady child answers the teach-back right in two topics and wrong in two). Learning's parts (T2 lead-ins, T5 per-skill covered,
the clause-8 read) are theirs.

**Doing next:** `repeatedAuthored` stops exempting cards (pending, 5 now); then compile step 3 resumes, column by column (repeat
first), as the decision says it continues after R and J2.

**Questions for main:** none.

## 2026-11-16 06:40 · `a8f8c7dc` (K)

**Done (gated: test:all 7244 pass; the only failures are the two worktree-only browser suites):** K — a key is said once: the why's
second wording after a key is the card's simpler with the check-in, no verdict frame, no key again, over the board the key was said
over. A yes-or-no key with its why is a sentence ("Nahi, kyunki …"). Gated `keyOnce`: 3 on the rows before, 0 after. Counts:
moves.repair 82 → 62, reteach 65 → 85; boardChanged 294 → 292, boardKept 335 → 337.

**Doing next:** B (a bridge changes no board), A (AI-line reply with the phrase forms), then `repeatedAuthored` stops exempting cards.

**Questions for main:** none.

## 2026-11-16 06:10 · `1811ca75` (H)

**Done (gated: test:all 7244 pass; the only failures are the two worktree-only browser suites):** H — a Hindi request gets words she
did not say in her last two turns: the simpler when unspent, else the beat's second wording (pointAlt), else its point. Gated
`hindiNewWords`: 2 on the rows before, 0 after. Counts: joints.hindiSwitch 14 → 16.

**Doing next:** B (a bridge changes no board), K (a key said once; a yes/no key as a sentence), A (AI-line reply with the phrase forms).

**Questions for main:** none.

## 2026-11-16 05:40 · `1708b986` (W)

**Done (gated: tsc, vite build, prompt budget, test:all 7244 pass; the only failures are the two worktree-only browser suites):**
- W: a card said whole in one of her last two turns is asked by its question alone (its reask where written) after any turn, unless
  the child asked for it (repeat, "sawaal kya hai?"), it is a picture turn, or the second miss is past; a Hindi request keeps S1. After
  "main khud karti hoon" she says the go-ahead alone and waits (the card stays live). Counts: cardsSaidAgainWithin2 69 → 32, teacher
  turns 722 → 678, reads.correct 156 → 167, afterTryFirst 15 → 0, turnsOver60Words 59 → 64 (more cards answered, more long teaching
  turns reached); the full list is in the commit.
- Tests changed to the rule, with comments: r7-brain-v64 Q1 (the try-first go-ahead with no card), r7-brain-v63 W1 (the question alone).
- J2's last rule (nothing between a unit's own point and its card) already holds: no such row on the dry matrix. J2 is done as rules in
  the existing code paths, not as one seam-pass function; the predicates gate each rule (backToJoint both ways, missRemediationJoint).

**Doing next:** H (a Hindi request gets the second wording or an unspent simpler, never words from her last two turns), B (a bridge
changes no board), K (a key said once; a yes/no key as a sentence), A (AI-line reply with the phrase forms), then `repeatedAuthored`
stops exempting cards (6 now, pending).

**Questions for main:** none.

## 2026-11-16 04:30 · branch head after this commit

**Done (pushed, gated: tsc, vite build, prompt budget, test:all 7244 pass; the only failures are engines-browser and
dev-frame-mount-browser, which fail only in the gate's git worktree and pass in the main tree):**
- `d106f641` J2 part 3: one joint per seam. A park or aside line leads into the card; no backTo or "Ek baar aur dekho:" stacked on it.
  Counts: backTo 11 → 10.
- `f1199573` J2 part 2: a miss verdict and its remediation always have their joint (placed at the final assembly). Gated
  `missRemediationJoint`: 3 on director22's steady fixture rows, 0 dry. Counts: beforeRemediation 28 → 37; turnsOver60Words 50 → 59.
- `73ee3735` J2 part 1: backTo when, and only when, a card comes back after another unit (heldUp unit ≠ the card's). `backToJoint`
  reads both directions: 25 → 0. Counts: backTo 36 → 11.
- `dcb68b84` (028) the harness's miss on a currency key is a near value ("₹381"), not "pata nahi, shayad wahi".
- `d7d3e481` (release 29) R, the reader, and T, the ending, of dc-r8-director22.

**Doing next:** J2's last rule (nothing between a unit's own point and its card), then W (`cardsSaidAgainWithin2` 69: after
"main khud karti hoon" a go-ahead and wait; `repeatedAuthored` stops exempting cards), then H, B, K, A.

**Questions for main:** none open.

(The earlier notes in docs/design/round7/brain/TO-MAIN-2026-11-16.md are folded in here.)
