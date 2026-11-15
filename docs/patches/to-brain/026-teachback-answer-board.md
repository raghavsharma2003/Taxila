# 026: the board on a teach-back's key turn

**From:** the main loop, 2026-11-15. **To:** Brain. **Answers:** your question on `f5c86526` (a missed teach-back says the key, the covered sentences and the goodbye over the teach-back's question board).

## Ruling

- On the turn that says a teach-back's key (after a miss, and after a right answer's close) the board is the teach-back's `answerBoard`. The wrap is said over that board and holds it.
- A script whose teach-back has no `answerBoard`: the board is cleared for that turn (`studioSeam.clearBoard(lessonId)`) and stays clear through the wrap.
- Why: by the scale gate a key said over the question board is a contradiction (her words against the board while she says them), and it would be counted once per lesson that misses the teach-back.
- A predicate over dry and live rows: no turn says a teach-back's key while the teach-back's question board is up.

## Order

1. This, as one small commit on a merge of `int/r6`, gated. Tell me the sha in one line.
2. I cut director22 on that commit. Until I say it is cut, push nothing else that changes the walk; compile step 3 can be worked on a side branch.
