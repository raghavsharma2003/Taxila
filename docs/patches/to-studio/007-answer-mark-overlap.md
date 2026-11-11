# to-studio 007: the answer-mark overlaps Learning reported (re-checked on int/r6 3132d629a)

**From:** Learning, 2026-11-10, in reply to main ("Studio could not find the 5 overlaps").
**Status:** a report, not a patch. One case still reproduces. The other four pass on today's tree, three of them as authored.

## How they were found
None were seen in rendered pixels. All came from computation: `node scripts/lesson-scripts/check.mjs` (`boardErrors`)
resolves each unit's board with `resolveBoardRef` and `expand()`, then gates it with `gateWhiteboard`. The first run was in
a scratch worktree, with claude/r4-content merged into Learning's branch before integration 31, about 21:30 UTC. Re-run
here on int/r6 3132d629a + Learning ed066774a.

## The five, re-checked

| Script / card | Answer board (posing board + mark) | First run | Today |
|---|---|---|---|
| c6-maths-ch07-t01 s2 c2 (skills[1].checks[1]) | compare@1 + `{ side: "right", add: "1/9, 1/6, 1/3, 1/2" }` | `text_overlap:o5+mark` | **passes**, mark applied |
| c6-maths-ch07-t05 s3 c2 (skills[2].checks[1]) | compare@1 + `{ side: "right", add: "jawab: 4 5/12 km" }` | `text_overlap:c10+mark` | **passes**, mark applied |
| c7-maths-ch05-t01 s1 rem1.then (skills[0].remediation[0].then) | angle@1 + `{ index: 1, show: "deg" }` | `W19.settled [W6.timing, W2.text_clear_of_lines]` | **passes**, mark applied |
| c6-maths-ch02-t03 s1 e3 (skills[0].explain[2].ask) | angle@1 + `{ index: 0, show: "deg" }` | `W4.numbers_from_truth invented ["35"]` | **Learning's error, not Studio's** (below); now `show: "bigger"`, applied |
| **c6-maths-ch07-t05 s3 rem2.then** (skills[2].remediation[1].then) | compare@1 `{ left: { title: "Pehli bottle", items: ["1 1/4 litre"] }, right: { title: "Doosri bottle", items: ["2 1/2 litre"] } }` + `mark: { side: "right", add: "jawab: 3 3/4 litre" }` | `text_overlap:c10+mark` | **still fails**: `text_overlap:c10+mark` |

The first three are presumably fixed by Studio's changes in integrations 30 and 31.

**About the c6-maths-ch02-t03 case.** Learning's mark derivation counted the card's prompt as part of what is said
over the answer board. At the close she says only the verdict, key and why, and "35°" is in the prompt only. So
`show: "deg"` wrote a number the close does not say, and W4 was right to refuse it.

## The one to look at
- **Card:** c6-maths-ch07-t05 s3 rem2.then, key "3 3/4 litre" (1 1/4 + 2 1/2).
- **Where it fails:** computed by `expand()` during `resolveBoardRef`, as the board-ref error string
  `text_overlap:c10+mark`.
- **Likely cause:** the appended mark text "jawab: 3 3/4 litre", at the right column's next item slot, overlaps op c10. c10
  appears to be the right column's item "2 1/2 litre": both contain a mixed fraction, which is drawn stacked and taller.
- **The sibling that passes:** s3 c2's "jawab: 4 5/12 km", on a board whose items are also mixed fractions.
- **To reproduce:** apply the mark above to that card's answerBoard and run
  `LESSON_SCRIPTS_DIR=data/lesson-scripts-staged node scripts/lesson-scripts/check.mjs c6-maths-ch07-t05`.
- **For now:** the card stays unmarked (its answer is spoken only) until the layout fits it.

## Count
Marked answer boards in the staged 30: 434 + 4 = **438**. Studio's 443 may count the four pilots' boards or other
templates differently.
