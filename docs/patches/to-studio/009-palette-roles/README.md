# Patch 009 to Studio: the board's role values from the token file

**Ruling (main, 2026-11-11, ruling 2):** "One source = Studio's src/theme/palette.ts; tx-tokens.css carries the same role values under the same names, and a unit test fails when they differ."

The test is `tests/r8-palette-sync.test.mjs` (Design's). It reads your file and never writes it. Today it holds a `PENDING` list of the 11 differences below. When you land this patch, those lines must come off `PENDING` in the same commit, because the test also fails when a pending difference is gone. Delete the whole `PENDING` set's contents; nothing else in the test changes.

## The values (A's answer `#0B736A` was accepted by main on 2026-11-11)

In `src/theme/palette.ts`:

**PAPER_STUDIO**
- `mint: "#185850"` becomes `mint: "#0B736A"`. This carries `roles.answer` and `roles.right`.
- `amber: "#B6581E"` becomes `amber: "#8A5A00"`. This carries `roles.mixup` and `roles.wrong`.

**PAPER_BOARD**
- `ink.mark: "#B6581E"` becomes `"#8A5A00"`.
- `ink.good: "#185850"` becomes `"#0B736A"`.
- `role` becomes `{ focus: "#3B47B0", slot: "#0B736A", answer: "#0B736A", mixup: "#8A5A00", muted: "#6F675B" }`.

**NIGHT_CHALK.role** (the r8 night roles, not the live night inks)
- The new value is `{ focus: "#8F9BFF", slot: "#4FE0A2", answer: "#4FE0A2", mixup: "#FFB54A", muted: "#8F9CAE" }`.
- Only the role table changes. `ground`, `edge` and `ink` stay as today's, and `NIGHT.roles` stays today's.

The comment above PAPER_STUDIO names the old pair. Its replacement could read: "answer #0B736A and mix-up #8A5A00: a bluish green and an ochre (Okabe-Ito), told apart for a red-green-blind child; Design's tx-tokens.css carries the same values (tests/r8-palette-sync.test.mjs)".

## Checked against your tests' own measures (computed 2026-11-11)

| pair | measure | value | your threshold |
|---|---|---|---|
| #0B736A on #FFFDF8 (paper ground) | contrast | 5.62 | 4.5 |
| #8A5A00 on #FFFDF8 | contrast | 5.83 | 4.5 |
| answer #0B736A vs mix-up #8A5A00 | deutan distance | 0.155 | 0.15 |
| focus #3B47B0 vs answer #0B736A | deutan distance | 0.301 | 0.15 |
| focus #3B47B0 vs mix-up #8A5A00 | deutan distance | 0.456 | 0.15 |
| #8F9BFF on #1F3B30 (night chalk ground) | contrast | 4.81 | 3 for a role mark |
| #4FE0A2 on #1F3B30 | contrast | 7.25 | 3 |
| #FFB54A on #1F3B30 | contrast | 6.93 | 3 |
| #8F9CAE (muted) on #1F3B30 | contrast | 4.36 | 3 |
| night focus vs answer, focus vs mix-up, answer vs mix-up | deutan distance | 0.710, 1.040, 0.335 | 0.15 |

**The paper answer/mix-up pair has the least margin (0.155).** If your test measures it under 0.15, tell Design. The answer would then move, and the token file with it. Your file would not move away from the tokens.

## Why the night chalk values change

Your night roles (#A9B4FF, #7FE0B0, #9DB3A6) were a reading of the phase 1 prototype. Theme B's token file settled on #8F9BFF, #4FE0A2 and #8F9CAE. The bridge already paints the Desk's board with the token values (`--k-*` → `--tx-*`), so this aligns the board's own fallback with what the Desk shows.
