# Live lesson walk under the new look (main loop, 2026-11-11 / 15)

`walk.mjs` runs the real lesson screen from the built `dist/`, served by `server/serve.mjs`, with `/api` answered by a small scripted Director (no model calls, no database). Usage: `node docs/design/round8/phase2/livewalk/walk.mjs <a|b> <p360|l1366>`. It was written by a helper agent that stopped when the account's usage limit was reached, so only theme A at 360 × 740 was captured (nine moments; three of the images are kept here). The paths inside the script were rewritten for the repo and it has not been re-run since: check it before relying on it.

What the three images show, theme A, phone:

1. **The question is not in the display face** (`a-p360-03-question.png`, `a-p360-04-hint.png`). In a lesson whose language is Hinglish the question card's computed family is `Mukta, "Noto Sans Devanagari", sans-serif` at 600, and its Latin letters fall to the system sans. Design's own screenshots, taken from an English fixture, show it in Literata. Most lessons are Hinglish.
2. **The debrief still carries the old look** (`a-p360-08-end.png`): "YOU SAID" in spaced capitals, the teacher's mark in a clipped tile, and the fixed "Finish" bar lying over the goodbye choices at the foot of the page.
3. The board card, the teacher's line, the hint card ("Count the shaded quarters on the board.", her answer, "Let's look again"), the chips and the "Your turn" dock render in the theme, with `data-tx="a"` and `data-board-theme="paper"` set, no sideways scroll, and no monospace text inside the lesson.

Not reached: a game inside a lesson (the "Game" chip did nothing against the scripted Director), theme B, and the laptop width.
