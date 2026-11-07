# Stream 2 handoff: board / Studio / content

Branch `claude/r4-content`, draft PR #22. Last code head before handoff: `589569e8`, on 14.4.3 base `int/r5-rel1443 @ c61aed5c`. Its gates passed locally and in CI.

Stream 2 worked from cross-session messages from **main** (session_0135KCpT8GA8E1uzNPiw2Hw3), **QA** (session_01JvKJXTJRyWq4rytaVbnK5X), the **sim lab** (session_012H8HYZhSzPwAoXPMsKERUb) and **4A** (session_01XvJxJ5Qd12UtBy6pTypxzy). Main integrates into `int/r5-rel14xx`; stream 2 merges main's named base into `claude/r4-content` (merge, never rebase) before each head, then sends main the sha.

Owner directives in force: Azure-only AI; **no model / Azure calls until main says so (2026-10-24 stop)**; Neon TEST branch only, never production; never run `scripts/deploy-*.mjs`; frozen files `server/director/safety.js`, `server/compiler/floor.js`, `src/lesson/safetyStrings.ts`.

## What stream 2 owns

- **The Studio seam**, `server/studio/seam.js`:
  - the board slot (`requestIntent` → board-sync ladder → `drawn()` gates → `showFallbackOrFail` / `gatedFallback`);
  - keeping the board on the response (`keepBoardSlot`, the board coming back via `boardBack`);
  - late boards (`onScreenSlot`);
  - a picture held under a board (`p.under` / `restoreUnder`);
  - pictures (`showImage`), `clearBoard`, `retirePiece`;
  - the wire and trace (`push` → `studio.slot.<state>`, with `studio.slot.retired` for taken-down pieces).
- **Board predicates**:
  - `server/studio/request.js`: `answersRequest`, `isDrawing`, `syncedWithLine` / `syncWords`, `shownBefore`, `pictureSubjectOf`;
  - `server/director/requests.js`: `visualAskOf`, `freeSubjectOf`, `requestOf`, and the ASK_STOP / VERBISH / GENERIC lists. Main often union-merges these lists; check a merged list before editing it by exact string.
- **Visual-ask shapes and screen truth**:
  - `server/director/shapes.js`: `drawAsked`, `pictureNote`, `VISUAL_*`;
  - `server/brain/turn.js`: `boardTruthShape`, the late-board pointer, the picture lane;
  - `server/brain/propose.js` `whiteboardAskOf`.
- **The client board**: `src/modules/whiteboard/StudioWhiteboard.tsx` (sameAsBoard, frozen replay).
- **Ways-in chips by capability**: `state.js` `WAYS` / `waysOffer` / `waysCan`, plus seam `waysFor`.
- **Kits, items and fades**: `items.js` `choicesFor` / `fadeItem` / `withUnitForms`.

## Done in this stretch (newest first; every fix has a test that fails on base)

| commit | what |
|---|---|
| 589569e8 | A late board her line has left is never shown or pointed at (QA ac4e8e88 c07175b4 / a12e757b). Trace: `studio.late_board_dropped`. |
| 0a009e25 | The board her line goes back to comes back (`prevBoard`, `boardBack`; trace `studio.board_back`). |
| e8149234 | A taken-down piece is traced as `studio.slot.retired` with its reason; the wire is unchanged. |
| 02ae9217 | Her words never deny a picture the board draws or shows (drawAsked's last rule; `boardTruthShape`). |
| c75e6156 / 6d3d01a8 | visualAskOf: a picture SEEN somewhere is not the ask (`SEEN_IN`); "दी" in ASK_STOP; likha forms are verbs. |
| 8d53d3a1 | A picture stays under a board until the board draws; a failed board gives the screen back (38aad918). |
| 2c440b5e | A kept subject (`s.offTopic`) is spent once a board is asked for it. |
| b42cc474 / fc8be3ff | freeSubjectOf refuses verbs and fillers ("bola"); a failed board records `live:… template:…`. |
| cf25ca72 (+ f2380599 test) | isDrawing counts a rect with no text inside; template refusals are logged (run 8). |

Context entries for these are in `context/inbox/merged/r5-38aad918-s2.json` (merged by main) and `context/inbox/r1442-s2.json`. Graph edges are `{src, rel, dst}`, and every node needs an md write-up.

## Open items

1. **drawAsked vs VISUAL_DRAWING: ON HOLD, main's call.** QA c2cd0d93: she says "picture ko words mein dekhiye" while the board is up.
   - Likely source: `shapes.js` drawAsked's clause "describe X in words they can picture … never send their eyes to the screen or the board". It applies while the board sketches an off-kit X.
   - VISUAL_DRAWING (the named-subject board, owner-5) says "send their eyes to it once, then say what it shows".
   - Proposal: give drawAsked VISUAL_DRAWING's pointing rule. Not built. It touches owner-5's "never point before it is there", so wait for main's yes, or that turn's shape to confirm the source.
2. **589569e8 needs a QA live re-run.** QA's two lessons are not on the TEST endpoint stream 2 can read, so the test reproduces their shape. Look for `studio.late_board_dropped` then `studio.board_back`.
3. **02ae9217 / 0a009e25 are not measured on sim-lab** (see `open-r1442-board-truth-unmeasured`). They need a re-run counting "picture nahi hai" under a board. The sim-lab records don't carry board-to-board sequences at slot level.
4. **Parked proposal (a)**, `open-r5-ask-subject-first`:
   - The change: keep `req.subject ?? visualAskOf(text).subject ?? freeSubjectOf(text)` in `state.js` (~1564).
   - Code replay: 5 offTopic flips and 0 move flips in 4,068 turns. The real effect is on model-read requests, so it needs a sim-lab A/B on the affected cards.
5. **conv2.note.answer_correct on wrong answers** (QA 12fbd625 / a769071e): inert in code; routed to main / 4A. The note's intent never grades.
6. **Earlier**:
   - the sim lab's run of the off-kit cards (`evals/simlab/cards/offkit-14.4.1.json`);
   - main's review of `docs/design/round5/content/patches/census-f4-resume-checkin.diff` (an unapplied patch).

Nothing is half-done in the working tree. Every change is committed and pushed.

## Harnesses and data (`docs/handoff/stream2-data/`, redacted)

- `scripts/`: the 109 scratchpad measurement scripts. All use absolute paths under `/home/user/Taxila` and read `.../scratchpad/simrec`; repoint `root` to `docs/handoff/stream2-data/simrec` before reuse. Useful ones:
  - `subjdiff.mjs`, `two.mjs`, `subjlist.mjs`: before/after of the subject readers over every distinct sim-lab child line. They copy the old `requests.js` to `server/director/zz-*.js` so relative imports work; delete that copy afterwards.
  - `spentmeasure.mjs`, `ab.mjs`: a Director replay over sim-lab lessons with code-read requests.
  - `run8.mjs`, `seam8.mjs`: run 8 at seam level.
  - `l38*.mjs`: TEST-DB lesson readers. The TEST endpoint does NOT hold QA's or main's lessons; ask main for dumps.
  - `bola.mjs`, `cake.mjs`, `t6.mjs`: predicate probes.
- `simrec/`: sim-lab 14.2–14.4 records (308 lessons, 3,790 distinct child lines; sim children, no real child data). Every measurement above uses these.
- `results/`: small gate and suite outputs.
- Deployment-name values are replaced with `[REDACTED:NAME]`.
- The transcript is `docs/handoff/transcripts/stream2.jsonl.gz`, redacted the same way (it contained `DATABASE_URL`, now `[REDACTED:DATABASE_URL]`). The only remaining "secret-looking" strings in it are the scan regexes themselves.

## Gates and gotchas

- **Gates:** `npx tsc -b && npx vite build`, `node scripts/check-prompt-budget.mjs`, `node scripts/lint-ui.mjs --json` (ceiling 353; write it to a file, because piping truncates the JSON), `node --test $(ls tests/*.test.mjs | grep -v engines-browser)`.
  - Known failures: "migrations applied" and "r5 edit supersede" (int's migration 030 isn't on the Neon test branch), plus the RCA-4b TODO.
  - A full run takes about 20 minutes. Run it in the background, writing to a file with an `EXIT` line. Never edit files mid-run.
- **CI flake:** "Port … already in use" in the w2b-whiteboard-browser vite before-hook. If the PR run of the same commit is green, it's the flake.
- **Rules that must fire go last** in a shape (`join(...)` order). Test the regex against the end of the whole shape, not of one clause.
- **Board sync is word-level** (`syncWords`: 5-letter prefixes, the whole canonical cross-script key, Roman plural→singular). A board that shares no word or number with her line is "unsynced".
- **Seam tests:** set `TAXILA_BOARD_SYNC_MS` inside the test and restore it after; `npm test` runs all files in one process. Inject the live board's failure with `_setDeps({ planWhiteboard: async () => ({ ok: false, why: "planner_error" }) })`.
- **`requestIntent`'s on-screen handling is an `if / else if` chain** (image held under / retire non-board / remember prevBoard). Inserting a line between the branches silently breaks the picture keep, which happened once.
- **The Director can't see whether a board drew.** "Spent" and "asked" stand in for "drawn" until the seam's result reaches it.
- **Split commits:** when one file holds two fixes, build the intermediate file states by script and commit each. `git add -p` is interactive and not available.
- **Commit trailer:** `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01LJoMKWmmgGVu7ZtogXAAq5`. No model ids anywhere else. GitHub comments end with the Claude Code footer.
