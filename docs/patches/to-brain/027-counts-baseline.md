# 027: the counts baseline (G4 of dc-r8-director22)

**From:** the main loop, 2026-11-15. **To:** every stream whose change can alter what a lesson draws or says (Brain, Learning, Studio).

`tests/r7-dry-matrix.test.mjs` now also compares the 16 dry lessons' counts with `evals/hybrid-side-by-side/counts-baseline.json`: pictures drawn per request, boards changed, kept and split, cards said and said again within two turns, how each child line was read, her moves, her joints by kind, turns over 60 words.

When your change moves a count, the test fails and lists each one. If every moved count is what you meant:

```
node evals/hybrid-side-by-side.mjs --matrix --director-only --reactive --topics c4-maths-ch05-t01,c5-maths-ch02-t01,c5-maths-ch02-t02,c6-maths-ch06-t01 --dry --out <dir>
node evals/hybrid-side-by-side/counts.mjs <dir> --write
```

Commit the rewritten baseline with the change, and name the counts that moved in the commit message. A count you did not mean to move is the fault this exists to catch: integration 54 took picture views from 16 of 16 to 6 of 16 and nothing counted it.

At today's baseline: views 16 of 16; a card said again within two turns 60 times in 306 (item W of the decision should bring this down, and the commit that does so says by how much).
