# Round 2 · stream conversation: apply order and proof

2026-10-07 · base **HEAD 617df2b** (identical to ee97e9c for every file these patches touch).

- Every patch passes `git apply --check` on HEAD. Applied in order 01..05 they also apply on top of every other round-2
  patch (truth 01-07, latency 01-03, content 01-06, applied first), checked on a scratch copy 2026-10-07.
- Nothing was committed, pushed, deployed or migrated. Hot files were changed only in scratch copies.
- **New files** (already in the tree, used by the patches):
  - `server/conversation/compose.js` — the lead slot (pure)
  - `server/conversation/fallback-lead.js` — the no-model lead for an outage turn (pure)
  - `tests/prod/round2-conversation.mjs` — acceptance (local server and taxila.dev)
  - `evals/conversation-r2/heldout-cases.mjs`, `prep-heldout.mjs` — the held-out battery on the same harness
  - `docs/design/round2/conversation/RESEARCH.md`, `RESULTS.md`, `battery/`

## Order

| # | patch | files | what it does | proven by |
|---|---|---|---|---|
| 01 | `01-lead-slot.diff` | `server/brain/say.js`, `tests/p5-interaction-reply.test.mjs` | On a turn with a card question that answers a (non-content) request or re-poses the question, the model writes only what comes BEFORE the question (last-positioned one-job note); code strips its questions and any copy of the card question and appends the card question byte for byte. A lead is refused (→ the old one-call path) when it has < 4 words, names the item's key or an accepted form, or drops/defers the question. Content requests (answer_q, clarify, example, story, another, why, how) never take the slot. Length counts her own words (24 / 30). Last repair: a turn still bare or repeating after every other repair gets one lead-only call, kept only if it adds no new problem, never after a floor or leak catch. Every truth guard runs on the joined turn. Two existing reply tests run their one-call cases with the slot off. | `tests/round2-conversation.test.mjs` "lead slot: …", "compose: …" (11 cases incl. key refusal, drop refusal, content requests, kill switch) |
| 02 | `02-readings-steering-persist.diff` | `server/conversation/lexicon.js`, `policy.js`, `server/director/state.js`, `shapes.js`, `server/compiler/compile.js`, `server/brain/reasons.js`, `tests/p5-interaction-conversation.test.mjs` | (a) `unclear` reading: a stutter or filler that trails off on a word that cannot end a thought, and the note's `noise`, become a no-blame "say it again or finish it" (never a verdict). (b) `move.prefs`: how the child asked to be taught rides on every later move, rendered droppable in MOVE. (c) pinned Hindi: everyday words in Hindi. (d) animation shape names what moves. (e) a second push with nothing parked is engaged, never a second "later". (f) `move.lead` carries the request's note for 01. | "unclear: …", "how they asked to be taught …", "pinned Hindi …", "insistence with nothing parked …"; `p5-interaction-conversation` (kit-answer scan: still ≤ 40 of 44,103 kit answers read as a request) |
| 03 | `03-round2-unit-tests.diff` | `tests/round2-conversation.test.mjs` (new) | the stream's 17 unit tests (needs 01, 02, 05 and `compose.js` / `fallback-lead.js`) | `node --test tests/round2-conversation.test.mjs` 17/17 |
| 04 | `04-owner4-checker-imperative.diff` | `tests/prod/_owner.mjs` | owner-4's `childSlow` matches imperatives only: "main dheere bolungi" (SHE goes slower, the asked-for move) was scored as telling the child to speak slowly. Checker fix, not product. | owner-4 local run (RESULTS.md) |
| 05 | `05-fallback-lead.diff` | `server/brain/say.js` | `fallbackReply` with a card question: a fixed code lead for what the move is doing (identity → "AI teacher", unclear → say it again, help → the kit hint's statements when safe, else a generic lead), then the question. Before: the bare question on every model outage / 429. Apply after 01. | "fallback lead (no model): …" (2 cases incl. reply model throwing 429 on an identity turn) |

| 06 | `06-director-truth-lead-slot.diff` | `tests/director-truth.test.mjs` | "13 ka square": with the slot the drift is never written, so `caught` has no "ask"; the test accepts `caught.includes("ask") \|\| guard.leadSlot`. The behaviour asserts (ends on the card, one question) are unchanged and pass. | `node --test tests/director-truth.test.mjs` |

**Off switch.** `TAXILA_P5_LEADSLOT=off` → the one-call path and the bare-question fallback exactly as HEAD (01 + 05).
`TAXILA_P5_STEER=off` (or `TAXILA_P5=off`) removes prefs, lead notes, the unclear move and the detour change (02).

**Safety floor, unchanged.**
- scanSafety and the model distress read run on every committed turn as before (nothing in the turn pipeline before the
  reply changed). Safeguard and wrap moves never take the lead slot, prefs, or a fallback lead.
- The joined turn goes through every guard (floor, leak, praise, register, screen, script, stage). A lead that states the
  key is caught by the same leak guard (unit test).
- Identity with every model down still says "AI teacher" (05). No fixed lead names a helpline or asks a question.
- MS CoC restriction 12: "unclear" is about the words heard, never the child; no emotion is inferred anywhere.

## Gates run (scratch copy of HEAD + patches)

- `node --test tests/round2-conversation.test.mjs tests/p5-interaction-reply.test.mjs tests/director-truth.test.mjs tests/lesson-safety.test.mjs`: 48/48.
- 37 related suites in one process (director, brain, compile, p5, persona, safety, lesson, owner, request, trace, budget):
  the same 13 failures on the HEAD copy and the patched copy (pre-existing, scratch copy without `public/`, `art/`, parts
  of `evals/`), 0 new. Two new failures found on the way were fixed (lesson-safety floor: no lead repair after a floor
  catch; director-truth: patch 06).
- `evals/persona-invariants.mjs` 70/70 on the patched copy.
- On HEAD + truth + latency + content + conversation patches (others first): all apply; the stream's suites and
  `round2-truth*` pass.
- `npx tsc -b`, `npx vite build`, full `npm test` and `evals/persona-invariants.mjs` on the real tree belong to the
  integrator (no client or TS file is touched; no persona text is touched).

Measured results: [RESULTS.md](RESULTS.md).
