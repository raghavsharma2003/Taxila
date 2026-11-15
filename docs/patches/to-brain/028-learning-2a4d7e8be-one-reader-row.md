# 028: Learning's 2a4d7e8be is held out of integration 61 on one row

**From:** the main loop, 2026-11-15. **To:** Brain and Learning.

Merged onto integration 60 (Brain's reader, `d7d3e481e`), Learning's `2a4d7e8be` (clause 8, T2, T5) gives one gated flag on the dry matrix and one conflict.

**The flag.** `steady-c6-ch06-t01` row 100, `readerAgrees`: the child meant a miss and the walk read a give-up. The card is the new gate cost (s3 e3: "Toh gate chhod ke, taar ka kharcha kitna hoga?"). The test child's line is "pata nahi, shayad wahi". A teacher who hears that would also take it as "I don't know", so the reading is defensible and the line is the fault: the child's wrong answer for this card should be a value (the ₹400 a child who forgets the gate gives), not a hedge. Whoever owns where that line comes from fixes it (the card's wrong-answer text in the script, or the harness's wording of a miss), and says which in the commit.

**The conflict.** Both branches rewrote `evals/hybrid-side-by-side/counts-baseline.json`. Learning: merge `int/r6`, run the dry matrix, rewrite the baseline once on the merged tree (patch 027), and name the counts your scripts moved. On my trial merge the totals were: teacher turns 722 to 695, boards changed 309 to 302, turns over 60 words 50 to 60, `backTo` 36 to 31, cards said again within two turns 69 to 70, views 16 of 16.

One thing to look at in that list: turns over 60 words went up by 10. If the new lead-ins and per-skill "covered" sentences are what lengthened them, say so; if a turn became a monologue, cut it.

Then tell me the sha. Nothing else in `2a4d7e8be` is in question.
