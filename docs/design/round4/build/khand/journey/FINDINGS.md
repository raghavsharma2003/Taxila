# Audit defect #2 ("no game or built piece in a lesson"): root causes, traced

The main session asked G2 to trace this end to end (stream 5's journey audit, `claude/r4-asha` @ 0cea014a, AUDIT.md
defect #2, scored 0/5). These are findings with evidence, not hypotheses.

## How it was traced

- **Tree:** base 4f92408 + G1 `claude/r4-games-core` @ cb078473 + `claude/r4-khand`, merged locally (never pushed).
- **Server:** a local production build started with `--env-file=tests/prod/prod-routing.env` (production's model
  routing), on my own Neon TEST branch, on 2026-10-10.
- **Logging:** temporary `[TRACE]` lines in the scratch tree only, never committed. They were placed in:
  - `server/brain/turn.js`: the move, the visual and the play ask;
  - `server/studio/seam.js`: the prefetch pieces with their router reasons, every turn's status proposal (Wave 2 and
    after Stagecraft), slotFor, and composeAsk;
  - `server/forge3/live.js`: every place `buildLive` returns null.
- **Children:** three fresh children, typed lane, 10 turns each, two game asks each (turns 4 and 8):

| child | class | topic (the planner's pick unless set) | play coverage |
|---|---|---|---|
| A | 4 | c4-maths-ch08-t01 (grams and kilograms; the audit's Riya) | none |
| B | 7 | c7-maths-ch08-t01 (multiplying fractions; the audit's Kabir) | none |
| C | 6 | c6-maths-ch06-t01 (perimeter), set as a control | Khand `floor/perimeter` and `floor/side` |

- **Evidence:** the per-turn table is `journey-trace-turns.json`; the server trace lines are `journey-trace-server.txt`.

**Reproduced:** 0 play pieces in 3/3 lessons; 0 of 6 game asks answered with a game. The only non-board piece was one
skeleton activity (B, turn 6).

## The request path works

Every game ask ("mujhe game khelna hai", "kya hum game khel sakte hain?") is classified `move=reteach visual=game`, and
`turn.js` calls `studioSeam.composeAsk`. Everything below happens after that point.

## Root causes

| # | what happens | evidence (trace) | owner |
|---|---|---|---|
| RC1 | **The play coverage does not admit the audit's topics.** `compose()` builds no play rung. Nothing on the turn path serves the ladder's next rung, `stagecraft:game`: on null, the turn requests the board. The board is shown, and her reply calls it a game ("Screen par game: Change to grams box dekho"; later "Game mode on, Riya" over a fill-in item). | `buildLive no play rung ["play: skill c4-maths-ch08-t01-s1 not admitted"] ["stagecraft:game","board:","voice:"]` (same for c7-maths-ch08-t01-s1) | coverage: G1 / G2 families; the null fallback and the honesty guard: 4A (`turn.js`, reply compile) |
| RC2 | **Khand's admitted topic is refused by visual QA.** `server/forge3/certs/play.json` holds no `nazariya` cells, and the round-4 rule refuses an art never judged at the device's size. Both of C's game asks and G1's patch-03 practice-beat prefetch return null. | `buildLive art QA refused nazariya/floor kagaz p360` (×5) | **G2 (me)**: certify Khand's arts; the table is forge's file, so this goes in as a patch request |
| RC3 | **Studio prefetch makes nothing for most topics.** `paramsFromKit` (`server/studio/plan.js`) derives params only for `shade_fraction` and `number_line_jump`, from the kit's fractions. The other 11 archetypes need truth packs that nothing supplies. | `prefetch … "pieces":[]` for A and C | stream 2 (Studio) |
| RC4 | **A first session gets only skeletons.** Bond stage `meeting` means promoted library builds only. With no promoted rows, every piece for a new child becomes a skeleton. | B: both `shade_fraction` pieces `fallback_ready`, `why: ["studio.first_session_promoted_only"]` | stream 2 (router rule 5) |
| RC5 | **A skeleton on screen blocks the next game ask.** `composeAsk` never runs for an ask while a piece is up and incomplete ("a game the child is in the middle of"), and a skeleton-as-activity counts as one. | B, turn 8: no `composeAsk` line; the slot was the skeleton `st:1` | stream 2 (`seam.composeAsk` guard) |

The parent corner's "Nothing made yet" follows from RC1-RC4: nothing was built.
