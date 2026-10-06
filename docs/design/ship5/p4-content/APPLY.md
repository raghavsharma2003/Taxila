# p4-content: apply order and proof (live-built content with speculative stagecraft, priority 4)

2026-10-06 · stream p4-content · base **HEAD 8006902**.

Every patch except 05b passes `git apply --check` on 8006902. It also passes on the current HEAD 7866881, because none of
the patched files changed between the two.

- **05b** is the same change as 05, rebased onto the p5-interaction patch `05-turn-understand.diff`. Its dry run is
  clean once p5-05 has been applied to `server/brain/turn.js`.
- **Use either 05 or 05b, never both.**

**Patch 07 is already present in the main tree's working copy.** At the end of this stream, `scripts/lint-ui.mjs` there
already carried exactly the change in 07; it shows as uncommitted (`M`). So `git apply --check` of 07 fails against the
working copy but passes against HEAD. If that edit is kept, skip 07.

**How the patches were checked:** they were applied to a throwaway copy of the tree under the stream scratchpad (`git archive` of
HEAD, plus this stream's new files, plus the patches). On that copy:
- `tsc` reports 0 errors and `vite build` passes;
- `node --test tests/` passed 455 of 456 (the failure is described under Tests);
- a local server (`server/serve.mjs`, Neon TEST branch via `TAXILA_DB=test`, real Azure models) passed the batteries
  listed at the end.

No hot file in the main tree was touched.

## What ships, and how it turns off

Everything is ON by default. Each switch restores the old path on the next lesson, or the next ask for the board switches.

| switch | default | off restores |
|---|---|---|
| `STAGECRAFT` | `on` | `off`: no host is attached, so every seam call is a no-op and the Wave 2 view is exactly today's. `ready_made` shows only instant pieces (catalogue, engine default, board twin) and never builds a spec. |
| `TAXILA_BOARD_SYNC` | on | `0`: the whiteboard is exactly `deps.planWhiteboard`, the line plan with no deadline and no speculative, code or template board. |
| `TAXILA_BOARD_SYNC_MS` | 1900 | The board-sync deadline after the ask. |
| `DEPLOY_STAGECRAFT_SPEC` | `taxila-fast-bg` | The spec-build deployment. Owner action O-1 creates a dedicated one. Until then the reply lane's background twin is used, never the reply deployment itself. |
| `STAGECRAFT_LOG` | off | `1` logs the reveal and board-sync lines (`[studio] whiteboard drawn source=… sync=…`). |

**Automatic fallback.** This applies with no child-facing error:
- A spec build that throws, times out, returns 429 or fails validation is dropped. The ladder serves the next rung down:
  library, then the authored catalogue or engine default, then the board twin.
- A piece is never revealed in a loading, stale or broken state.
- A missing controller chunk on the client leaves the interim board twin drawn. It is never a spinner.
- A board-sync rung that fails the gate falls through to the next rung: spec, then line, then code, then template, then
  the line plan whenever it lands (the pre-ship5 behaviour).

**The safety floor is unchanged.**
- Pieces are quarantined for the rest of the lesson after any safeguard (seam `onSafety`).
- The turn passes `scanSafety(childText).distress || prev.safeguard` into the reveal point, so a distress turn reveals
  nothing.
- Every authored string is re-checked against the SEVERE and PII predicates at load.
- Strings in a freshly generated spec go through Q8.
- The model distress read and `scanSafety` on every committed turn are untouched.
- There is no emotion inference from speech (MS restriction 12): rest and flow use only outcomes and stage time.

## Order

| # | file | patch | what it does | proven by |
|---|---|---|---|---|
| 01 | `shared/studio.ts` | `01-shared-studio-artifact.diff` | Adds the `stagecraft` artifact kind (STAGECRAFT P9). | `tsc -b` |
| 02 | `src/studio/renderers.ts` | `02-studio-renderers.diff` | Registers `StagecraftRenderer` for that kind (P10). The renderer lazy-loads the controller chunk. | `vite build`, part E of the acceptance battery |
| 03 | `server/studio/seam.js` | `03-studio-seam.diff` | Stagecraft host per lesson, via the seam-bridge `augmentView`, `slotFor` and `onReveal` (P3); host grading via `gradeAny`; `prepareWhiteboard` and the board-sync ladder; template retimed to her line; Stagecraft spacing 2 turns (P5). | `tests/p4-content-seam.test.mjs` (4/4 once applied), `tests/w2-seams*.test.mjs`, acceptance parts A, B and C |
| 04 | `server/brain/propose.js` | `04-brain-propose.diff` | A reveal the child asked for costs 0 attention (urgency 3), so the Director's chips cannot price it out. A closing move still refuses it. | Acceptance part A, `owner-5-visual` |
| 05 / 05b | `server/brain/turn.js` | `05-brain-turn.diff`, or `05b-brain-turn.after-p5.diff` once p5-interaction 05 is applied | Reveal point per turn (P4); speculative board at turn start and at kernel time; a Stagecraft piece takes the tray from the Director's template rung (the rung is unmounted and its facts row dropped). | Acceptance parts A and C, `w2f-studio-gate` B |
| 06 | `server/azure.js` | `06-azure-signal.diff` | `DEPLOY_STAGECRAFT_SPEC` (P6); the caller's `AbortSignal` in `post()` (P8), so an invalidated candidate's build is cancelled. | `tests/p4-content-unit.test.mjs`, `tests/w2-seams*` (destructure regex) |
| 07 | `scripts/lint-ui.mjs` | `07-lint-ui.diff` | Allowlist entries for the Studio v2 token files, canvas engine art and the dev gallery, each with a reason. | `node scripts/lint-ui.mjs`: 0 findings in `src/stagecraft` and `src/studio-v2` |
| 08 | `server/director/requests.js` | `08-director-board-ask.diff` | "board pe/par/per dikhao/banao…" now counts as a visual request, so the whiteboard answers it. | `owner-5-visual`, `tests/stagecraft.test.mjs` |

**Not applied, and why:**
- **P1 and P2 (duplex-host reveal at a clause boundary).** The live duplex host that would take the cue is not
  constructed in the lesson at 8006902. The reveal rides the turn response instead, and the client mounts it with the
  reply.
- **P7 (separate reveal channel).** Same reason: the turn response carries the slot.

These patches become useful when the p1-duplex bridge lands. Until then, `cue` in the artifact is ignored.

## Tests

- **Unit** (pure, no network): `node --test tests/p4-content-unit.test.mjs tests/p4-content-seam.test.mjs tests/stagecraft.test.mjs`
  - Main tree: 51 pass, 4 skipped (the seam cases wait for patch 03).
  - Patched copy: 55 of 55 pass.
- **Full suite** on the patched copy: `node --test tests/` passed 455 of 456.
  - The one failure is `publish-look refuses a source without a complete plate` (avatar rig). It fails because `art/`
    is not in the archive copy.
  - It does not involve this stream.
- **Production probes:**
  - `tests/prod/p4-content-acceptance.mjs` runs parts A to E. `P4C_BOARD_REPS=N` repeats part C, and `P4C_SHOTS=dir`
    saves screenshots.
  - `tests/prod/p4-content-probe.mjs` prints the `brain_trace` reasons (TEST branch only).

## Local battery on the patched copy (2026-10-06, local server, Neon TEST, real Azure)

### p4-content-acceptance: 41/41 checks passed

- **A, requests on stage.**
  - Requests answered by a piece reached the stage in p50 2419 ms and p90 2552 ms, against a 3000 ms bar (n=6). This
    is API time from a local server; mounting on the device is not included.
  - Requests answered by the board: lateness after her audio starts was p50 = p90 = 1127 ms, against a 1500 ms bar
    (n=2).
  - Stagecraft answered 2 of 8 requests (the animation requests). Modules answered game and picture; the whiteboard
    answered diagram.
- **B, piece correctness.**
  - The revealed spec validates, and the piece is never in a loading state.
  - The host grades both ways: a forged `correct:true` on a wrong answer is graded wrong. This was checked on the typed
    lane.
  - Every number in her reveal line is on the piece or already in the talk (AT-7).
- **C, board sync.**
  - Lateness p50 1263 ms, p90 1453 ms, against a 1500 ms bar (n=9 boards: 3 reps × 3 topics). Every board passed
    strict shape, lint and the full gate W0–W9 against her line.
  - The other 3 of the 6 topics opened no whiteboard slot in the scripted turns. The kernel never asked for one there.
- **D, coverage.** The coverage report counts all 385 class 4-7 topics.
- **E, real Chromium client.**
  - The piece painted 3837 ms after the request was sent, including her reply.
  - Its canvases sit inside the stage box.
  - No loading or error words appeared.

### Server log over that run (16 boards)

| board source | count | sync time |
|---|---|---|
| code | 13 | about 1900 ms |
| line | 3 | 1812, 2265 and 4262 ms |

The 4262 ms board was the last rung: no code or template board existed for that ask.

### Other batteries

| battery | checks | notes |
|---|---|---|
| `w2f-studio-gate --parts B` | 21/21 | 4 boards; lateness p50 1359 ms, p90 1373 ms (n=4). Part A was not run because `STUDIO_QA_URL` is unset. |
| `owner-5-visual --lanes typed` | 8/8 | 6 of 6 request kinds produced on the stage. The animation request is now a Stagecraft scene explainer (it was 2 of 2 failed before). |
| `w2h-studio` | 21/21 | Regression. |
| `w1b-mounts` | 22/25 | The 3 failures are the maths item-bound mounts. They are known and not fixed here; see the stream report. |
