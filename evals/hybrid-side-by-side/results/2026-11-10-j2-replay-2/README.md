# J2 replay 2, 2026-11-10: the prompt carries the child's words, not their sentence

**Run by:** the main loop, on Brain 16b0f0fcc (claude/r4-conversation), same command as replay 1 (`--scenario offtopic --dry --j2-live 20 --j2-usd 0.10`, topics c4-maths-ch05-t01, c5-maths-ch02-t02, c6-maths-ch06-t01). **n:** 3 exchanges x 20 drafts = 60. **Cost:** $0.053. Simulated child, one seed.

| Exchange | Words given | Pass by the predicate | Of those, still an echo of the child's real sentence | Clean | First sentence refused by |
|---|---|---|---|---|---|
| c4: "jab Virat chauka maarta hai, woh" | chauka, virat | 19 of 20 | 0 | 19 | rule 1 |
| c5: "batting sabse achhi lagti hai" | batting | 19 of 20 | 13 | 6 | rule 1 |
| c6: "batting sabse achhi lagti hai" | batting | 12 of 20 | 0 | 12 | lesson 5, rule 3 |
| **All** | | **50 of 60** (replay 1: 12) | **13** | **37 of 60** | lesson 5, rule 5 |

"Echo of the real sentence" is counted by the main loop: three of the child's words in a row in the draft's first sentence.

## What it shows

- **Giving words instead of the sentence works where the sentence is really gone**: c4 went from 4 to 19 of 20 with no echo.
- **In c5 the sentence is still in the prompt** (the turn's history carries the child's line), and 13 of 20 drafts are "Batting tumhe sabse achhi lagti hai." The predicate passes them because the echo clause now reads against the chosen words, not against what the child said. That is a hole in the predicate, opened by this change.
- **c6 misses the target (12 of 20, target 16)**: `lesson` refuses 5 drafts on the everyday word "har" ("Batting mein har shot ka andaaz alag hota hai"), and `rule` refuses 3 on a bare "hota hai". None of the 8 says anything about the lesson.
- No draft spoke as a man or promised to remember.

`j2-replay.json` holds every draft with the clause that refused each sentence.
