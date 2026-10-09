# Round 3 · stream conversation: apply order and proof

2026-10-09. Built on **HEAD cadf527**: every server file is identical to prod 145996f. The files these patches touch are
also unchanged in today's HEAD **566b28b**. Patches = scratch freeze `46cc018` (freeze 6). Pair 2 in RESULTS.md measured freeze 5b (`b78808e`). Freeze 6 adds three narrow fixes from owner-2 on the patched tree, and it has its own battery run (RESULTS.md "Freeze 6").

- Every patch passes `git apply --check` on 566b28b, alone and in order. They touch disjoint files.
- **With round3 truth (the only other stream that touches these files):**
  - Truth 02 touches `server/director/state.js`; truth 04 touches `server/director/say.js` G-PRAISE.
  - Truth 01-07 then conversation 01-04, and conversation 01-04 then truth 01-07, both apply cleanly on 566b28b and give
    **byte-identical trees** (checked in a scratch copy).
  - Truth 04 (`PRAISE_ANY_WIDE`) is what DETECTS the owner's prod case: c5-maths-ch07-t02-i06, "Aapne Pattern A ka niyam
    sahi pehchaana" on an ungraded turn. An earlier cut of this stream added its own wider alternative inside
    `PRAISE_ANY`. It was dropped in freeze 5b because it would also fire on a GRADED partial, where truth 04 deliberately
    lets her name the part that is right. Two patches to one regex for one defect was also a merge hazard. This stream
    owns what happens around the catch:
    - the bridge note "their last line was not an answer: no praise or agreement word" when the child's line was not an
      answer;
    - a rewrite reason that goes straight on, with no echo of their filler (the first wording was recited);
    - agreement to a request on an unverified reading is not praise.
- Nothing was committed, pushed, deployed or migrated. Hot files were changed only in a scratch copy:
  `/tmp/claude-0/…/scratchpad/r3-conversation/after`, a lean `git archive` with its own throwaway git, base `b19c02f`.
  - Freeze 1 (`3f6c79c`) and 2 (`1af2a6c`): pair 1 battery and held-out.
  - Freeze 3: the no-answer praise reason.
  - Freeze 4: the no-answer bridge note.
  - Freeze 5: skip in words, the card cap yields to re-presentation asks, the two-question repair keeps the carrying
    question.
  - Freeze 5b (`b78808e`): praise detection deferred to truth 04.
  - Freeze 6 (`46cc018`): a question about her needs no "?" (spoken "pubg khelte ho"); a help-request pose carries
    her own line, on a first pose too; the hint lead is capitalised.
- **New files, owned paths, no patch needed:**
  - `evals/conversation-r3/`: the battery harness with the debug read, `codemetrics.mjs`, `compare.mjs`, the judge fork,
    `acceptance-arm.sh`, results.
  - `tests/prod/round3-conversation.mjs`: acceptance, local and taxila.dev.
  - `docs/design/round3/conversation/`: RESEARCH, RESULTS, this file, acceptance outputs.
  - `context/inbox/r3-conversation.json`.
- **Kill switch:** `TAXILA_P5_R3CONV=off` restores round 2's reply path, shapes, readings and card cap. It is read on
  every call (`server/conversation/flags.js`). `TAXILA_P5=off` still turns the whole p5 stack off. **Not behind the
  switch** (plain guard corrections, each with a unit test):
  - `asksWhy` accepts the rule / "kya socha" / "what helped you" forms.
  - "we'll stop the lesson here" and "lesson ended" are goodbye words on a non-wrap turn.
  - A kit hint used as a lead gets its closing stop.

## Order

| # | patch | files | what it does | proven by |
|---|---|---|---|---|
| 01 | `01-composed-turns.diff` | `server/brain/say.js`, `server/conversation/compose.js`, `server/conversation/fallback-lead.js`, `server/conversation/flags.js` | See "What each patch does" below. | `tests/round3-conversation.test.mjs`: first pose, confirm, kill switch, re-pose not drift, code lead, variants, check-in, break, request praise, request note, one-call turn note, no-answer praise reason |
| 02 | `02-readings-moves-shapes.diff` | `server/conversation/lexicon.js`, `server/conversation/policy.js`, `server/director/state.js`, `server/director/shapes.js` | See below. | `tests/round3-conversation.test.mjs`: two needs, lexicon, skip in words, card cap, park push, share kept, after check-in, recited notes, small talk, say-back. Plus **budget: every new shape with every optional note fits the MOVE section, 2 registers × 2 bands × 2 lanes × 15 request types** |
| 03 | `03-guards-why-wrap-twoq.diff` | `server/director/say.js`, `server/director/items.js` | See below. | `tests/round3-conversation.test.mjs`: why-probe, stop check-in, two questions, praise no-false-catch |
| 04 | `04-tests.diff` | `tests/round3-conversation.test.mjs` (new, 31 tests), `tests/p5-interaction-director.test.mjs` | The stream's unit tests. Two existing asserts accept the R3 wording of the frustration and boredom shapes; the old wording still passes with the kill switch. | `node --test tests/round3-conversation.test.mjs`: 31/31 |

## What each patch does

**01, composed turns.**
- **The first pose of a question is a lead-slot turn.** The model writes only the bridge: ≤ 18 words for 10-15, ≤ 14
  for 6-9, ≥ 2. Code appends the verified question byte for byte. The slot's last note:
  - after a right answer, asks for the confirmation first;
  - after a non-answer line, says "their last line was not an answer: no praise or agreement word";
  - says "the lesson goes on".
- **`drift` only on a first pose.** A re-pose that ends on the card's form has posed it.
- A turn that ends on the pinned kit question has handed back, so an instruction-form kit question is not "flat".
- A granted break needs no hand-back.
- Agreeing to a non-answer request on an UNVERIFIED reading is not praise.
- A confirmation word among the first two statements confirms.
- When confirming an answered item, its own parts may be named.
- **The repair ladder ends in code.**
  - The lead-only repair also runs after a leak catch. It never runs after a floor catch, and the joined turn may carry
    no new problem, a leak included.
  - Then a fixed code lead (`fallback-lead.js`): the kit hint's statements when safe and unsaid, else a nudge variant
    she has not said this lesson, or "welcome back" after a return.
- **One-call turns end on their own shape note** (`turnNote`). Before it, the request's note (`requestNote`) when the
  move answers one with no card question. Not on a check-in, a granted break, a thinking wait, a why-probe or a closing
  move.
- A stop check-in must offer a choice (`nochoice`), else the fixed check-in line.
- The praise rewrite reason is "start from what they actually did" on a graded not-yet. On a turn with no answer it is
  "go straight on" (no echo of the filler).
- The two-question code repair keeps the question that carries the turn.
- **A turn that answers a request for help** (another way, clarify, slower, example, story, frustration, easier) must
  carry ≥ 4 words of her own before the card question, on a first pose too. If it is still bare after the model
  repairs, the fixed code lead applies, as on a re-pose. Owner-2 on both trees: "samajh nahi aaya" on a faded step got
  only the step's question.
- A kit hint used as her lead starts with a capital letter.

**02, readings, moves and shapes.**
- Readings:
  - not following + giving up → `frustration`;
  - a hold word before a request ("ruko, pehle diagram dikhao") is not a thought in progress;
  - "aa gaya, chalo" / "back, let's go" / "आ गया" → `back`;
  - a question about what SHE does ("PUBG khelte ho?", and without the "?" as a spoken line arrives) → small talk,
    answered now (owner-2 R7.defer);
  - **a skip in the child's words with a demonstrative or a next-one tail** ("ye wala skip karo", "isko chhodo dusra
    do", "next question please") → `skip` in code, so the classifier's stop flag can no longer turn it into "you want
    to stop";
  - the second need of a two-needs turn (`alsoReading`) rides as a note.
- Moves:
  - a share from their life is noticed and kept in `s.later` (topic screened in code). It is served once when the
    question resolves, or before the wrap;
  - a push on what was just parked gets a short real engagement, never a second "after this question";
  - frustration with no question on the table opens with empathy;
  - the move after a stop check-in that was not a stop carries on;
  - **the card cap yields to an ask to have THIS question again**: repeat, slower, another way, clarify, example,
    story, language, as it already did for "show me". Their next answer turn leaves it as before;
  - optional notes are added only while the shape keeps room under the MOVE cap. An over-cap MOVE section is a
    BudgetError, which is a 500.
- Shapes:
  - reworded where they were recited: "sensible", the park's "different thing", the frustration line;
  - the decline is avoid + name + hook (Chirpy Cardinal);
  - the stop check-in and the boredom offer say back what they asked.

**03, guards.**
- `asksWhy` accepts the rule / "kya socha" / "what helped you" forms.
- English "we'll stop the lesson here" / "lesson ended" are goodbye words on a non-wrap turn.
- `lastQuestionOnly(…, { keepContent })` is called with `keepContent` only when R3 is on.

## Gates run

PENDING

## Safety floor, unchanged

- scanSafety and the model distress read run on every committed turn before any of this. Nothing before the reply
  changed. The new code skip reading, like every lexicon reading, still gets the UNDERSTAND note's distress read in
  parallel, and scanSafety runs first.
- Every joined turn runs every truth guard: floor, leak, praise, deny, corrects, screen, parts, register, script,
  stage. The question is kit content byte for byte, and a lead that names the key or an accepted form is refused.
- The lead repair after a leak may not bring a leak back, and it never runs after a floor catch. Fixed code leads name no
  helpline, ask nothing and state no key.
- A share's topic and a parked topic pass the code screen (`unsafeChildPhrase`) before they are kept. Out-of-bounds stays
  a code decision (lexicon `oob`, policy `decline`).
- NEVER MANIPULATE:
  - the stop check-in must now offer a choice;
  - "haan" after "you want to stop" may end the lesson (letting them go is allowed; holding them is not);
  - no streaks, no guilt, no new hooks to come back;
  - the card cap change only delays the cap by the one turn the child asked for.
- MS CoC restriction 12: the share uptake is told never to name a feeling of theirs.
