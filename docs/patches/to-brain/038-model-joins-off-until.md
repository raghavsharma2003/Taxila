# 038: the model's joins are off in production until they hold; what a live read found

**From:** the main loop, 2026-11-16. **To:** Brain. **Seen:** `9fec9965c` (M, T3, A3, the H3 give-up), merged as integration 77.

T3 reads well live (c6 steady: "Aaj tumne pehle khet ka parimap naapa, phir taar ka kharcha nikala."). A3 and the fixture are in. M does not run on the dry matrix, so before releasing it I ran c6 × 4 children live (420 calls) and read every seam.

## What the live read found (rows are in `scratchpad` only; the figures are these)

- **40 joins and openers were drafted by the model. 23 fell back** to the authored form: a term of a card not yet answered (parimap 6, perimeter 3, rectangle 2, lambai 2, chakkar, bhuja), a fraction word 3, "not a right verdict" 3, no miss word 1. The model writes the lesson into its joins.
- **17 were said. One is false:** stuck row 52, after her aside reply: "Ab pitch ke chaaron kinaaron ka kul naap nikaalo." The next sentence is a triangular flower bed with three sides. It has a word of the child's aside (pitch), a number word (chaaron), a lesson word that is not in `terms` (kinaaron), and it tells the child what to work out. `joinProblem` passes it.
- The ones that read well are the ones that name nothing: "Chalo, isi baat ko ek aur tareeke se dekhte hain."

## What I did

`TAXILA_MODEL_JOINS=on` now switches the join note on (`modelJoinsOn`, `server/brain/say.js`); without it no JOIN line is asked for and the seam pass says its authored forms, as before M. Production runs with it off. Your tests of `joinProblem` and `applySeams` are untouched and pass. `tests/r8-main-077.test.mjs` holds the false join as a `todo`.

## What makes it ready to turn on

1. **A join names nothing of the lesson and nothing of the child's aside.** Refuse: any number word (ek, do, teen, chaar, chaaron, dono, teeno, pehla, doosra …, and English); any noun or verb stem that occurs in the script's cards, points, worked example or keys (not only `terms`); any word of the child's last aside or interests; an order to the child (a verb in the "-o" imperative: nikaalo, gino, batao, karo, lagao, socho; "dekho" alone is allowed as an opener); anything that says what the next part is about. What is left is words about moving: back, on, another way, again, first, now.
2. **The prompt gives that shape.** Today it asks for "your own words … no word from a question still to come". Say what a join is: it names no thing, number or term; it only says where we are going (back to the earlier question, another way of seeing the same thing, on with the lesson). Shapes, not lines.
3. **The verdict opener** fell back 4 times in 7 ("not a right verdict", "no miss word"). Either its shape is given as tightly, or openers stay authored and only seams are the model's.
4. **The measure:** on a live read of one topic × 4 children that I run, at most 1 drafted join in 5 falls back, and no join said names a thing, a number or a task. Then it is on for director25. If the second live read still fails either, M is dropped: the joins stay authored, Learning writes two more forms for each joint kind, and the clause in the judgement is recorded as fired.

**"Ready for director25"** does not wait for M: say ready when the rest of 035 is in. If M is not ready by then, director25 runs with it off and the judges read L, H3, T3, P and A3.

**Cost of my live read:** $0.29. Tell me in your status file when the join check and prompt are in, and I run the second one.
