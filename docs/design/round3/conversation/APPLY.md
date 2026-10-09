# Round 3 · stream conversation: apply order and proof

2026-10-09 · built on **HEAD cadf527** (every server file identical to prod 145996f + `data/kits-parts.json`).

- Every patch passes `git apply --check` on HEAD, alone and in order (they touch disjoint files).
- Nothing was committed, pushed, deployed or migrated. Hot files were changed only in a scratch copy
  (`/tmp/claude-0/…/scratchpad/r3-conversation/after`, a lean `git archive` of HEAD with its own throwaway git).
- **New files in the tree (owned paths, no patch needed):** `evals/conversation-r3/` (the battery harness with the debug
  read, `codemetrics.mjs`, the judge fork, results), `tests/prod/round3-conversation.mjs` (acceptance, local and taxila.dev),
  `docs/design/round3/conversation/` (RESEARCH, RESULTS, this file), `context/inbox/r3-conversation.json`.
- **Kill switch:** `TAXILA_P5_R3CONV=off` (read on every call, `server/conversation/flags.js`) → round 2's reply path, shapes
  and readings exactly; `TAXILA_P5=off` still turns the whole p5 stack off.

## Order

| # | patch | files | what it does | proven by |
|---|---|---|---|---|
| 01 | `01-composed-turns.diff` | `server/brain/say.js`, `server/conversation/compose.js`, `server/conversation/fallback-lead.js`, `server/conversation/flags.js` | **The first pose of a question is a lead-slot turn** (bridge ≤ 18 / 14 words, ≥ 2; after a right answer the slot's last note asks for the confirmation first; "the lesson goes on"); code appends the verified question. **`drift` only on a first pose** (a re-pose ending on the card's form has posed it). A turn ending on the pinned kit question has handed back (an instruction-form kit question is not "flat"). A granted break needs no hand-back. Agreeing to a non-answer request on an UNVERIFIED reading is not praise. A confirmation word among the first two statements confirms. The answered item's own parts may be named when confirming it. **Repair ladder ends in code:** the lead-only repair also after a leak catch (never after a floor catch; the joined turn may carry no new problem, a leak included), then a fixed code lead (`fallback-lead.js`: kit hint statements when safe and unsaid, else a nudge variant she has not said this lesson; "welcome back" after a return). A one-call turn answering a request with no card question gets the request's note LAST. A stop check-in must offer a choice (`nochoice`), else the fixed check-in line. Hint leads end with a stop. Kill switch documented in `flags.js`. | `tests/round3-conversation.test.mjs` (first pose, confirm, kill switch, re-pose not drift, code lead, variants, check-in, break, request praise, request note) |
| 02 | `02-readings-moves-shapes.diff` | `server/conversation/lexicon.js`, `server/conversation/policy.js`, `server/director/state.js`, `server/director/shapes.js` | Readings: not following + giving up → `frustration`; a hold word before a request ("ruko, pehle diagram dikhao") is not a thought in progress; "aa gaya, chalo" / "back, let's go" / "आ गया" → `back`; a question about what SHE does ("PUBG khelte ho?") → small talk, answered now (owner-2 R7.defer). The second need of a two-needs turn (`alsoReading`) rides as a note. Moves: a share from their life is noticed and kept in `s.later` (topic screened in code), served once when the question resolves (also after the why-probe path) or before the wrap; a push on what was just parked is a short real engagement (detour), never a second "after this question"; frustration with no question on the table opens with empathy; the move after a stop check-in that was not a stop carries on. Optional notes are added only while the shape keeps room under the MOVE cap (an over-cap MOVE section is a BudgetError → a 500). Shapes reworded where they were recited ("sensible", the park's "different thing", the frustration line), the decline is avoid + name + hook (Chirpy Cardinal), the stop check-in and boredom say back what they asked. | `tests/round3-conversation.test.mjs` (two needs, lexicon, park push, share kept, after check-in, recited notes, **budget: every new shape with every optional note fits the MOVE section, 2 registers × 2 bands × 2 lanes × 15 request types**) |
| 03 | `03-guards-praise-why-wrap.diff` | `server/director/say.js`, `server/director/items.js` | **G-PRAISE-1 for the prod case**: "aapne / tumne / you … (≤ 60 characters, one sentence) … sahi / correct / right + a verb of finding / working out / doing" (c5-maths-ch07-t02-i06 "Aapne Pattern A ka niyam sahi pehchaana"; "Aapne pattern ka agla number sahi nikala" on not_yet module answers); a superset of the owner checker's own pattern. `asksWhy` accepts the rule / "kya socha" / "what helped you" forms. English "we'll stop the lesson here" / "lesson ended" are goodbye words on a non-wrap turn. | `tests/round3-conversation.test.mjs` "praise guard", "why-probe", "stop check-in" |
| 04 | `04-tests.diff` | `tests/round3-conversation.test.mjs` (new, 23 tests), `tests/p5-interaction-director.test.mjs` | the stream's unit tests; two existing asserts accept the R3 wording of the frustration and boredom shapes (the old wording still passes with the kill switch) | `node --test tests/round3-conversation.test.mjs` 23/23 |

## Gates run (scratch copy of HEAD + 01-04)

- `node --test tests/round3-conversation.test.mjs` 23/23.
- 38 related suites in one process (brain, compiler, director, kit-budget, lesson-safety, lesson-truth, owner-requests,
  owner-truth-guards, p5-*, round2-*, safety-*, ship5-*): see RESULTS.md "Unit and gate runs" for the head vs after counts.
- `evals/persona-invariants.mjs` (copied into the scratch tree so it imports the patched server): **70/70** on HEAD and on
  HEAD + patches.
- Full `node --test tests/` on the lean scratch copies: HEAD 485/486, patched 486/487; the one failure on each side is a
  scratch-copy artefact (HEAD: `brain-turn` replays through the main tree's `evals/` into the main tree's `server/relational`,
  which another stream has modified; patched: `tests/fixtures/scene-corpus.mjs` imports a `docs/research` file the lean copy
  did not carry). `npx tsc -b`, `npx vite build` and the real `npm test` belong to the integrator (no client or TS file is
  touched).

## Safety floor, unchanged

- scanSafety and the model distress read run on every committed turn before any of this (nothing before the reply changed).
- Every joined turn runs every truth guard (floor, leak, praise, deny, corrects, screen, parts, register, script, stage).
  The question is kit content byte for byte; a lead naming the key or an accepted form is refused.
- The lead repair after a leak may not bring a leak back; it never runs after a floor catch. Fixed code leads name no
  helpline, ask nothing, state no key.
- A share's topic and a parked topic pass the code screen (`unsafeChildPhrase`) before they are kept; out-of-bounds stays a
  code decision (lexicon `oob`, policy `decline`).
- NEVER MANIPULATE: the stop check-in now must offer a choice; "haan" after "you want to stop" may end the lesson (letting
  them go is allowed; holding them is not). No streaks, no guilt, no new hooks to come back.
- MS CoC restriction 12: the share uptake is told never to name a feeling of theirs.
