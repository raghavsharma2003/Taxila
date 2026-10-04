# Owner-truth root causes (F1-F21), prod 9242020 vs working tree (Wave 2 in flight)

Date: 2026-10-04. Input: `evals/owner-truth/results/2026-10-04T18-30-08/` (18 sessions, 394 child turns, revision
taxila-web--s9242020-kj16). Method: every failure traced on the prod commit (`git show 9242020:<path>`) and on the
current working tree (uncommitted Wave 2 edits included; W2-H `server/studio/**` was being edited during this read).
Line numbers marked **P** are on 9242020, **W** on the working tree. No product code was changed. No model calls,
no Azure spend.

Wave 2 status per failure comes from BUILD-PLAN §4, `context/inbox/merged/w2-*.json` and the code itself. "Fixed"
means the root cause in this document is removed in W code, not that a stream says so.

Checks run locally, with no network:
- `normalize()` of number-line@1 on the prod params;
- `scanSafety` / `wantsToStop` on the probe phrases;
- `praiseProblem` on the F2/F3 replies;
- the `LATIN` script regex on the s09 Gujarati marks;
- a count over the 394 turns: 0 HTTP errors, and 38 replies (9.6%) that are byte-identical to the pinned question.
  These 38 split as answer 21, module 8, visual 5, steer 3, confused 1. Turn latency was p50 1.3 s, p90 2.4 s, max 8.8 s.

## Summary table

| id | item | root cause (one line) | prod file:line (P) | working tree (W) | W2 status |
|---|---|---|---|---|---|
| F1 | 1 | A bound T1 engine is graded by the frame's own `data.correct`. The server never re-checks the value against the key | director/modules.js:176-178, classify.js:298-299 | director/modules.js:335-337, classify.js (same fast path) | **Not fixed** (open item engines-v1-server-recheck; W2-B added facts/guards only) |
| F2 | 1 | The reply model and the transcript get the frame's claim ("answer (wrong)") while the verdict comes from server `gradeEvent`. The deny guard misses "yahan galti hui" / "step toot gaya" | routes/lesson.js:715-718, :873, :891; director/say.js:32-33, :75-83 | brain/turn.js:79-81, :243, :261; director/say.js same | **Not fixed** |
| F3 | 1 | Same claim-vs-verdict split, in reverse ("answer (right)" on not_yet). The praise guard has no emoji: a "✅" opener passes on not_yet | same as F2; say.js:17-23 | same | **Not fixed** |
| F4 | 1 | An unbound number-line mount sends no `mode`. The frame defaults it to `place`, which turns off the generic path: no target, an integer 0-10 line, and Check disabled. fraction-bars predict has no commit by design (show only) | shared/engine-catalog.js:602-603; src/modules/frame/params.ts:15-18; engines/numberLine.tsx:20, :191; numberLine.logic.ts:40-43 | unchanged | **Not fixed** (W2-B owns src/modules) |
| F5 | 1 | Lenient classifier rubric: "KEY … even with extra words", and `partial` is only offered for why/teachback, so a multi-part key has no partial label. The praise guard is off when verdict = ungraded | classify.js:18, :74, :97; say.js:77 | classify.js:70, :150; say.js:77 | **Not fixed** |
| F6 | 3 | One stop flag (lexical OR model `wants_to_stop`) goes straight to `toWrap(stopping)`: phase done, end:true. No check-in state exists | state.js:578 (+:559 in safeguard), :545-548; classify.js:63, :85, :144, :282; safety.js:124-133 | state.js:679, :646; classify.js:115, :138; brain/turn.js:333-342 (RELEASE forces wantsToStop) | **Not fixed; Wave 2 locks it in** (BUILD-PLAN:684, :865 `w2i-release.mjs` "the lesson ends that turn") |
| F7 | 3 | end:true closes the row. Any lesson with a graded answer counts as today's lesson, so a restart gets 409 "today's lesson is done". A start never resumes an ended lesson (it always builds a new state) | lesson.js:1028 (end), :514-519 (startRefusal), :626 (new state); child.js:42-43, :115; state.js:569 | lesson.js:107-111, :237; child.js:47, :150; state.js:670 | **Not fixed** (W2-A changed counting rules, not this) |
| F8 | 3+4 | No intent between "stop this topic" and "stop the lesson". The model reads "talk about something else" as `wants_to_stop` from a one-line prompt definition | classify.js:85 → state.js:578 | classify.js:138 → state.js:679 | **Not fixed** |
| F9 | 3 | "I'm done" is not in the stop lexicon (only bare `bas` matches), so the stop depends on a nondeterministic model flag. When it misses, the model still writes "Yahin rok dete hain", which the goodbye guard does not match | safety.js:124; say.js:208-212 | safety.js:125; say.js same | **Not fixed** |
| F10 | 3 (safety) | A safeguard turn whose reply is replaced uses one fixed line in disclosure wording ("Tumne jo bataya, woh zaroori hai"), whatever the trigger. The safeguard state is released only by chip or by the calm counter, so "continue karte hain" gets the helplines again | lesson.js:230-249, :342, :348, :968-978; state.js:556-566 | brain/say.js:79-97, :195, :201; state.js:657-667 | **Not fixed** (wording only; do NOT narrow the predicate) |
| F11 | 4 | Any non-answer in practice → verdict `off`/`unclear` → `repairOffTopic`, whose shape is literally "one warm line…; then back to the question" | state.js:153-160, :457-470; shapes.js:122 | state.js:182, :549-561; shapes.js:156 | **Not fixed** |
| F12 | 4 | No language-switch intent. `ctx.lang` is fixed at start and the words "hindi mein" map to unclear/off | state.js:457-470 (no handler) | same | **Not fixed** |
| F13 | 4 | `teach()` never reads the child's turn: every utterance in hook/explain advances `teachIdx`. In practice the request is unclear. "Explain another way" exists only as a chip id | state.js:220-258; classify.js:262-267 | state.js:249+; classify.js:316 | **Not fixed** (GENERIC_REP "story" fires only on wheel-spinning, state.js:461/511 W) |
| F14 | 4 | "slowly please" (spoken) is unclear → `repairUnclear`, whose shape says "ask them to say it once more, slowly". The model tells the CHILD to speak slowly | shapes.js:119-121; state.js:469 | shapes.js:153-155; state.js:561 | **Partial**: W2-C persona/pace.js lengthens wait/endpointing (state.js:772 W), but the move shape is unchanged |
| F15 | 4 | Same as F13: "example do" is not mapped. `helpExplain({how})` gives an example only for the chip | shapes.js `helpExplain`; classify.js:262 | same | **Not fixed** |
| F16 | 5 | No visual-request intent anywhere. The request becomes repair/hint, so no Studio/whiteboard ask is made. The explain shape says "then a picture… point at the whiteboard anchor" while explain mounts no whiteboard, so the model draws ASCII or denies it can | shapes.js:40; state.js:228-235 (no whiteboard on explain); compiler/characters/*.js:15-17 ("picture → rule") | shapes.js:40; brain/propose.js:55-65 (ask only on an explanation beat, never on voice); studio/seam.js:391 `requestIntent` (W2-H, beat-driven) | **Partial at best**: W2-B/W2-E/W2-H put a board on explain beats, but a child's request still never triggers anything; the W2-H plan ("W2 rule for intents", BUILD-PLAN:783-788) has no child-request source |
| F17 | 5 | Same as F16, plus the reply is replaced by the bare question (drift/leak after rewrite, or model unavailable → `promptFor(item)`) | lesson.js:348, :402-405, :409-413 | brain/say.js:201, :255-258, :265 | **Not fixed** |
| F18 | 2 | The leak guard strips every sentence that "reveals" the NEXT item from a teaching turn. For an open item ("make a testable question") the whole explanation is the key, so only a split-off tail remains ("” Aapka question?"). Gujarati marks pass the script check because `\p{M}` allows any script's combining marks | lesson.js:211, :263, :401 (withoutLeaks), :217 (LATIN) | brain/say.js:112, :255, :66 | **Not fixed** |
| F19 | 2 | Steering and visual requests are unclear (no state change), and G-ASK parity re-appends the pinned question verbatim every turn. The unclear cap (3) plus 4 hint rungs keep one item up to about 6 turns. 9.6% of replies are only the question (fallback/drift) | state.js:457-470; say.js:194-197 (endOnAsk); lesson.js:404 | state.js:549-561; say.js:194-197; brain/say.js:258 | **Not fixed** |
| F20 | 2 | Code repairs glue `promptFor(item)` onto a draft that already quotes part of the prompt. `endOnAsk` de-dups only WHOLE sentences contained in the ask, and `repairDrift` / `keepOr` do not de-dup | say.js:194-197; lesson.js:252-259, :411-412 | say.js:194-197; brain/say.js:101-109, :265 | **Not fixed** |
| F21 | 2 | The explain move mounts an unbound engine with the upcoming item's values (2/5) while the model teaches with its own example (1/4). The words are not tied to the screen | director/modules.js:60-96 (show plan); lesson.js `screenProblem` (tap words only) | director/modules.js `moduleFacts` + `screenContradiction` (W2-B), applied to her own words in brain (w2e-parts-guard-own-words) | **Partial** (W2-B measured 30/40 to 35/40 with facts alone; the guard on top is not measured on prod) |

## Per-failure detail

### F1: the module answer trusts the frame (critical)
- P `server/director/modules.js:163-178` `moduleAnswerOf`.
  - A G1 fill is graded by `forge/grade.js gradeEvent`, which ignores the claim.
  - A bound T1 engine returns `{ correct: d.correct }` straight from the frame event (`:176-178`). The header comment
    says it plainly: "server re-check is the open item engines-v1-server-recheck".
- P `server/director/classify.js:298-299` `classifyFast`: `moduleAnswer.correct` becomes the outcome, with no model
  call and no key comparison.
- W: the same function, now at `modules.js:322-337`. The W2-B edits (+163 lines: moduleFacts, screenContradiction,
  the explainer rung) do not touch grading.
- Real-UI exposure: the engine computes `correct` from params bound to the key, so a forged claim needs a modified
  client. An engine bug, though, grades silently: see F4 for one engine that is wrong on screen.
- Fix: `patches/item1-engine-server-recheck.patch` (modules.js). It applies on P and must be rebased on W.

### F2 / F3: the words contradict the verdict
- Reproduction detail. All 5 cited turns are G1 `scene@1` choice-cards where the simulator deliberately sent a frame
  claim opposite to the truth (child-sim.mjs:462-463).
  - The SERVER grade was right every time: s12 t9 pick o1 (a misconception) was graded not_yet; s12 t10 pick o2 (the
    key) was graded correct.
  - The teacher's words still followed the forged claim.
- Root cause 1 (the data flow): `activitySummary` turns the frame's `data.correct` into "answer (right)" / "answer
  (wrong)".
  - That text is what the reply model receives as the child's turn: P `lesson.js:891`, W `brain/turn.js:261`.
  - It is also what the transcript row stores: P `:873`, W `:243`.
  - The verdict note comes from the server grade, so the model gets two disagreeing signals and follows the concrete
    one.
- Root cause 2 (the guard): the G-PRAISE guards are lexical and anchored to the opening.
  - `praiseProblem("✅ …", "not_yet")` returns null: there is no emoji in `PRAISE_OPEN`.
  - `praiseProblem("yahan galti … hui", "correct")` returns null: `DENY_OPEN` (say.js:32-33) has `galat`, not
    `galti`, and nothing like "step toot gaya".
  - Verified by running the guard locally on all three replies.
- Exposure in real use: the scene renderer evaluates the same `probe.correct` as the binding, so the claim usually
  agrees. The guard gap, however, is live for typed answers too.
- W2: not fixed. `brain/turn.js:79-81` is a byte copy of the prod function.

### F4: an activity that cannot be answered
- Cause: `shared/engine-catalog.js:602-603` sends an unbound plan with no `mode` ("an unbound plan sends no mode
  unless a preset names one").
- In the frame, `params.ts:15-18` applies the def default `mode: "place"` (`numberLine.tsx:20`).
  - `numberLine.logic.ts:40` sets `generic = p.mode === "show" || "predict" || undefined`, which is false for
    `"place"`.
  - So `target` is not taken from `fractions` (`:43`), `kind` falls back to `whole`, and the line is 0-10.
  - Check stays disabled while `!c.target` (`numberLine.tsx:191`).
- Verified locally:
  - `normalize({fractions:[[1,8]]})` gives a fraction line 0..1 with ticks of 1/8;
  - `normalize({mode:"place", fractions:[[1,8]]})` gives a whole line 0..10 with a null target, which is what the
    browser replay rendered (browser.json mounts 1, 8, 26, 27, 33).
- These mounts are show/predict (never graded, itemId null). The child still sees a "Put the marker on: ?" task that
  cannot be done, about the wrong numbers.
- fraction-bars@1 `predict:true` (mounts 2, 5) is an unbound show with no commit by design. That makes it "unanswerable"
  only in the sense that a child is shown −/+ with nothing to do. Soft.
- W: none of these files changed. W2-B owns `src/modules/**` and the catalog.

### F5: a partial answer graded correct
- `classify.js` P:18 / W:70: `OPEN_KINDS = {why, teachback}`, so the `partial` option is absent for practice items
  with multi-part keys (P:74).
- The rubric's key line, P:97 / W:150: "the KEY (any wording…), even with extra words". With only key / other_wrong to
  choose from, a 2-of-3-part answer is labelled key.
- s17 t17: the pasted, irrelevant answer had no verdict (ungraded), and `praiseProblem` returns null for ungraded
  (`say.js:77`), so "sahi likhi" went out.
- W2: unchanged. The W2-E signals block is off by default and leaves the labels alone.

### F6 / F8 / F9: a child's stop phrase ends the lesson at once
- Detection:
  - The lexical `wantsToStop` (P `safety.js:124-133`) matches `bye`, "I want to stop", `mujhe jaana hai`, `ab bas
    karo`, or a bare `bas`/`stop`.
  - Verified: "lesson khatam", "I'm done", "end the lesson" and "can we talk about something else" are all false
    lexically. So those ends came from the classifier model's `wants_to_stop` flag.
  - That flag is defined in a single prompt clause, "they say they want to stop or leave now" (P `classify.js:85`,
    W `:138`), and OR-ed into the flags (P `:144`, `:282`).
- Action: P `state.js:578` / W `:679`: `if (flags.wantsToStop) return toWrap(s, { stopping: true })`.
  - `toWrap` (P `:545-548`) sets `phase = "done"`.
  - `step()` returns `end: s.phase === "done"`, and the route sends `end: true` (P `lesson.js:1028`).
  - The wrap shape is "they want to stop: stop now; short warm goodbye" (P `shapes.js:195`).
  - No check-in or confirmation state exists in the Director.
- F8: there is no "change topic" intent, so a topic change can only become `wants_to_stop` or `off_topic`.
- F9: a missed flag leaves the move as the unclear cap (offerChoices). The model echoes the stop ("Yahin rok dete
  hain") and the goodbye guard `WRAP_WORDS` (P `say.js:208`) does not match it, so the turn both stops and re-asks.
- W2: worse by design.
  - `brain/turn.js:333-342`: an accepted relational RELEASE re-plans the turn with `wantsToStop: true`.
  - BUILD-PLAN:684 has the gate "RELEASE wins in 100%".
  - BUILD-PLAN:865 `w2i-release.mjs`: "a child says goodbye mid-practice. The lesson ends that turn, with no 'one
    more'".
  - Both contradict owner item 3 and must be rewritten before W2-I builds them. The W2-I seam is still a no-op
    (`relational/seam.js` decide → null).
- Fix:
  - `patches/item3-stop-checkin.patch`: one warm check-in with keep going / short break / stop. The lesson ends on the
    stop chip or on stop words again the next turn. Pause→End and parent controls still end it directly.
  - `item3b-brain-release-marker.patch`: lets a true goodbye ("bye", "mujhe jaana hai") still end the lesson at once,
    so NEVER MANIPULATE stays intact.
  - Both touch W2 hot files (state.js, brain/turn.js): rebase after Wave 2.

### F7: the day is closed after an end
- `end:true` → the client calls POST /api/lesson/end, which sets the row `ended_at` and `phase done`.
- P `child.js:42-43` `countsAsDone`: `did.length > 0` or minutes ≥ DONE_MIN_MINUTES, so any lesson with one graded
  answer counts as today's lesson.
- P `lesson.js:514-519` `startRefusal("done", "lesson")` returns "today's lesson is done", hence the 409.
- When the day is not done, `start()` builds a fresh state (P `:626` `step(state0, {event:"start"})`), so progress in
  the ended lesson is not resumed: a new opening.
- P `state.js:569`: any further turn on a done state re-wraps.
- W: the same (`lesson.js:107-111`, `:237`; `child.js:47`). W2-A's truth.js unified the counting, not the
  close-on-stop behaviour.

### F10: disclosure wording on "i'm done" (safety floor; wording only)
- s15 t16 is byte-identical to `FALLBACK.hinglish.safeguard` (P `lesson.js:233`). That line is emitted only by
  `fallbackReply` (P `:241-249`).
- The paths that reach it are:
  - the reply or rewrite content-filter fail-closed (P `:342`, `:968-978`);
  - the reply model unavailable (`:348`);
  - a floor violation left after the rewrite (`:398`).
- Which one fired cannot be recovered from the transcript: the response carries no guard trace. The prod logs need a
  look for `[classify] blocked by the content filter` / `[lesson] reply blocked` at 18:30-18:58Z.
- The distress flag itself came from the model, the content filter or `distressCheck`, not from the predicate
  (verified: `scanSafety("i'm done")` is false).
- Stickiness: P `state.js:556-566`.
  - Once `s.safeguard` is set, only `chipId safe:continue` or the calm counter releases it. The child's typed
    "continue karte hain" is neither, so `safeguardStay` (helplines) runs for 2 turns, then the carry-on/stop question.
  - This is the designed hold.
- The defect is narrow: one fixed line for all safeguard fallbacks presumes a disclosure. A neutral "Are you OK? If
  anything is worrying you, Childline 1098 / Tele-MANAS 14416" line for non-disclosure triggers keeps the floor.
- Do NOT narrow the predicate. W: `brain/say.js:79-97`, unchanged.

### F11-F15: steering requests are not understood
- One structural cause covers all five:
  - The Director has no request/intent taxonomy for free-form steering.
  - A child's words become either an answer label or flags (`dontKnow`, `asksForAnswer`, `offTopic`, `wantsToStop`,
    `distress`).
  - P `state.js:153-160` `verdict()`: anything else is `off` or `unclear` → `unclear()` (P `:457-470`), which re-poses
    the same question.
  - The only "explain differently / how / slower / choices" handling is `HELP_REQUESTS` keyed by chip id (P
    `classify.js:262-267`); the child's words never map to it.
- F11 (cricket): the `repairOffTopic` shape (P `shapes.js:122`) literally instructs "then back to the question", so
  "baad mein baat karenge" is the designed output.
- F12 (Hindi): `ctx.lang` is set at start and nothing switches it.
- F13 (story) / F15 (example):
  - In hook/explain, `teach()` (P `state.js:220-258`) ignores `input.cls` and advances `teachIdx`, so the next
    procedural step comes out.
  - In practice, the request is unclear.
- F14 (slowly): on the spoken lane the request is unclear → `repairUnclear` (P `shapes.js:121`): "ask them to say it
  once more, slowly". The model then told the child to speak slowly. An exact shape-recitation defect.
- W2: no steering intent in any stream.
  - W2-C `persona/pace.js` + `state.js:772` (W) raise wait/endpointing on "slowly", which partially helps F14's voice
    timing, but the move is still `repairUnclear`.
  - The W2-E signals block (off by default) has `meta_slow` / `meta_break` acts but no topic / language / story /
    example / visual acts, and no Director consumer that changes the move.
  - The new `server/signals/**` layer (uncommitted) is evidence-only by its own contract.

### F16 / F17: a visual request puts nothing on the stage
- No path exists from a child's request to Studio, the whiteboard or the library:
  - The request becomes repair or hint (seen in s12 t7: `repairUnclear` on "show me a diagram").
  - P has no Studio at all.
  - W `brain/propose.js:55-65` makes a whiteboard ask only when the Director's beat is an explanation beat, never on
    the voice lane (`:58`) and never under strain. A repair beat never qualifies.
  - The W2-H seam (`studio/seam.js`, being filled now) takes intents from the lesson-start prefetch and that
    beat-driven ask only. That is the BUILD-PLAN "W2 rule for intents" (:783-788), which has no child-request source.
- Why ASCII art and "I can't draw":
  - The explain shape (P/W `shapes.js:40`) says "objects first, then a picture, then the symbol; point at the
    whiteboard anchor".
  - But `teach()` deliberately mounts no whiteboard on explain (P `state.js:228-235`).
  - The characters' brief says "picture → rule → number" (P `compiler/characters/arjun.js:15`, `asha.js:17`).
  - The model is told to use pictures it does not have, so it improvises ASCII (read aloud on the cascade lane),
    recites "Whiteboard anchor:" (s12), or says it cannot show pictures.
- F17's bare-question replies:
  - drift/leak surviving the rewrite → `reply = promptFor(item)` (P `lesson.js:404`, W `brain/say.js:258`);
  - `keepOr` (P `:411`, W `:265`);
  - model unavailable → `fallbackReply` → `promptFor` (P `:348`, W `:201`).
  - Measured: 38/394 replies (9.6%) are exactly the pinned question, 5 of them on visual slots.
- Side hazard: `persona/signals.js:15` maps the word "draw" to the interest `drawing`, so "draw it" can be taken as an
  interest signal.

### F18: a gutted template turn with a stray quote
- The mechanism, confirmed on s06 t2, s06 t21, s08 t2 and s18 t2 (all explain moves on c6-science-ch01):
  - On TEACHING_MOVES (hook/explain/worked/reteach) the leak guard checks the reply against the upcoming item
    (`ahead`).
  - The next item's key is "Any question that can be checked by trying something", which is what the explanation
    teaches. `revealsAnswer` fires on every teaching sentence.
  - After the rewrite still leaks, `withoutLeaks` (P `lesson.js:263`, `:401`; W `brain/say.js:112`, `:255`) drops
    every such sentence.
  - The sentence regex `[^.!?।]+[.!?।]*` splits inside a quoted example question, so the leftover is the closing
    quote plus the tail: "” Aapka question?".
- The same path gives "Great, Meher. Why? At the end, teach Bittu." (a hook).
- For definition-shaped open items the guard makes teaching the concept impossible. The remainder needs a coherence
  check (a minimum length, a balanced quote, a hand-back), and the "ahead" check should be skipped or narrowed when the
  next item is a why/definition item whose key is the skill's own statement.
- s09 t17 Gujarati glyphs: `LATIN = /^[\p{Script=Latin}\p{Script=Common}\p{M}]*$/u` (P `lesson.js:217`, W
  `brain/say.js:66`) accepts any combining mark, including Gujarati U+0A82/U+0AC7, so the script guard never fires
  (verified locally).
- s12 t22: "Whiteboard anchor: …" is the explain shape's "point at the whiteboard anchor" recited (law: sentence-shaped
  prompt text gets recited).

### F19 / F20: question loops and duplicate sentences
- F19 has three causes:
  1. Steering and visual requests count as unclear and change nothing (F11-F17).
  2. G-ASK parity: every corrective turn must end on the pinned question verbatim (`endOnAsk`, P/W
     `director/say.js:194-197`). Verbatim repetition is the designed output.
  3. Item budgets: unclear cap 3 (P `state.js:58`), then offerChoices, then leave; plus the 4-rung hint ladder. One
     item can hold the card for about 6 turns.
- F20: `endOnAsk` drops a draft sentence only if the ask CONTAINS the whole sentence. "…; ab socho: Tarbooz A ke 3
  tukde kiye: ek bada aur do chhote." is kept, then the full prompt is appended, so the sentence appears twice (s15 t8).
  `repairDrift` (P `lesson.js:252-259`, W `brain/say.js:101-109`) and `keepOr` append `promptFor` with no de-dup at all.

### F21: words do not match the stage
- P: the explain move mounts an unbound engine show built from the upcoming item's values (`modules.js:60-96`, SHOW
  moves). The reply model never sees what is on screen (`screenProblem` only checks tap words), so it teaches 1/4 over
  a 2/5 mount.
- W: W2-B `moduleFacts` (a telegraphic on-screen row) and `screenContradiction` (part counts), with W2-E applying the
  guard to her own words only (w2e-parts-guard-own-words).
  - Measured offline: 30/40, rising to 35/40 with the facts row (rj-w2b-facts-row-alone).
  - The guard is not measured in production. Partial.

## Error and fallback paths checked as "confused reply" sources
- **HTTP or model errors**: 0 of 394 turns carried an error, so outages are not the driver. The classify retry on
  taxila-fast (W2-E, `classify.js classifyFallback`) narrows the `source:"error"` no-evidence turns further.
- **Timeouts**: the reply is cut at 6 s with one retry (P `lesson.js:338`); max turn latency was 8.8 s, which is
  consistent with occasional retries. The fallback is `promptFor(item)` (counted in the 9.6% above).
- **Prompt-budget truncation**: no evidence. compile's budget gate throws rather than truncating; the W2-C brief v2
  peaks at 1348/2600 tokens. Open: `scripts/check-prompt-budget.mjs` still measures the legacy brief
  (open-w2c-budget-gate-v2).
- **Empty kit fields**: not observed as a cause in these transcripts.
- **Classify mistakes**: the dominant source for items 3 and 1-partial (F5, F6, F8, F9, F10's trigger). The stop and
  distress flags are single-clause prompt definitions with no lexical backstop for common Hinglish and English stop
  phrases, and no "topic change" label.
- **Guard rewrites that gut the reply**: the dominant source for item 2 (F17-F20).

## What Wave 2 must change in its own plan (not just code)
1. BUILD-PLAN:684 and :865 (`w2i-release.mjs`, "RELEASE wins in 100%") encode the behaviour the owner rejected in
   item 3. Rewrite them as "stop phrase → one check-in; a true goodbye or the second stop ends", or W2-I will ship F6
   as a passing acceptance test.
2. W2-H's "W2 rule for intents" (BUILD-PLAN:783-788) needs a third source: the child's explicit visual request,
   detected in the Director and routed through `studioSeam.requestIntent` on any beat, the voice lane included.
   Without it, item 5 cannot pass even after Studio lands.
3. Item 4 has no owner stream. A Director intent layer is needed: a closed taxonomy (change_topic, explain_differently,
   slower, example, language, story, visual, stop, break), detected lexically first with the classifier as backstop,
   that maps onto the existing `helpMove` / `helpExplain` / `SLOWER` shapes (which today only chips can reach).

## Caveats
- F2/F3 as reproduced use forged frame claims. The defects are real (the reply reads an untrusted claim, and the guard
  is blind to ✅ and "galti hui"), but their frequency with the real renderer is unmeasured.
- The F10 trigger (content filter, model distress or reply fallback) needs the prod logs for 18:30-18:58Z.
- W line numbers move: Wave 2 is still editing `server/brain/**`, `server/studio/**` and `server/director/**`.
