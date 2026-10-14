# R12 root-cause pass: the owner's release-11 lessons (2026-10-11)

Stream 4A, first pass. **No behaviour change ships from this in release 12.** The fixes are patch files for release 13.

- **Evidence:** `owner-lessons-2026-10-11.json` (lessons `a95d2ff1`, 29 turns, and `b08fe8a7`, 7 turns) at base `84bc6050`.
- **Code read:** at base `84bc6050`.
- **Tests:** `tests/r12-rca.test.mjs`, built from the lessons' real lines and the exported board pages.
- **Patches:** `patches/`. Each applies with `git apply` on `84bc6050`. `r13-tests-flip.diff` drops the `todo` marks that the applied fixes make pass.
- **Labels:** **confirmed** means shown by the export, a test or a replay. **Inferred** means read from the code with no runtime proof in the export.

| # | Failure | Root cause in one line | Reproducing test | Patch |
|---|---|---|---|---|
| 1 | Same "Recursive \| Explicit" table on 7 of 10 pages | Every fresh board on s1 resolves to the lesson's one cached code board; the child's ask never reaches Studio | RCA-1 (todo) | plan only |
| 2 | "Screen par game", "screen par aloo dekho" with neither mounted | The screen guard asks "is there anything to tap?", never "is this claim on screen?". The visual move shape says "it is on the screen now" whenever any module is mounted | RCA-2 (todo) | `r13-fix-2-5-screen-claims.diff` |
| 3 | "Different subject" then "Show me a picture" produced nothing | No path keeps a free subject or builds a picture outside the kit; `change_topic` loses "aloo" | RCA-3 (todo) | plan only |
| 4 | "Board clear karo … recursive rules hatao" answered with "background noise" | No clear-board request or action exists; ASR has no lesson-term biasing ("recursive" heard as "recording") | RCA-4a, RCA-4b (todo) | `r13-fix-4-clear-board.diff` (request + move; turn/Studio part is a plan) |
| 5 | "Ab 10 ke baad number bolo." alone | The screen guard deletes every sentence that says "screen", content and all; what was left was one line with no context | RCA-5 (todo) | `r13-fix-2-5-screen-claims.diff` |
| 6 | `turn.speculation_miss` on 14 of 15 speculated turns | The speculation key includes the compiled instructions; the model's understanding note and the request it reads change them, and speculation cannot foresee either | none (measurement) | plan only |
| 7 | "Examples drawn above the previous content" | The client draws every op since the last fresh page under a "continue" page; the server marks a page "continue" by beat alone, whatever it draws | RCA-7 (todo) | `r13-fix-7-board-continue.diff` |

**State on this branch:**
- Without the patches, `node --test tests/r12-rca.test.mjs` gives 1 pass and 7 todo.
- With all three patches and the test flip on a scratch tree:
  - `r12-rca` gives 5 pass and 3 todo (RCA-1, RCA-3 and RCA-4b remain, with no patch yet).
  - The request, guard, truth and conversation suites pass: 283 pass. The 5 failures are the environment's browser-renderer tests.
  - The studio and board suites match the base exactly: 130 pass and the same 30 environmental failures, nothing new.
- The full gate was not run on the patched tree. It must run before release 13.

---

## 1. The whiteboard re-draws skill s1's "Recursive rule | Explicit rule" table, whatever the child asks

**Confirmed from the export.** Ten pages were drawn in `a95d2ff1`:
- Pages 1, 2 and 6-10 carry the same 10 text ops ("Recursive rule · Explicit rule · First term · Nth term · directly · From the · one before · From n · Step by step · Far-away terms"), all on `c9-maths-ch08-t01-s1`, all with mode `fresh`. That is 7 pages, not 8. Main's count included the two `b08fe8a7` pages, which are the same table again.
- Pages 3-5 are bespoke staircases ("4 · +3 · ?"), mode `continue`.

The child asked for "some games" (turn 2), "koi photo … image … visualization" (turn 10), "aloo" (turns 18 and 24) and a different subject (turn 20). Every board on a fresh beat came back as the table.

**Code path:**
1. A visual request plans `reteach` with `visual: "diagram"` and `skillId = currentSkillId(...)`, which is always a kit skill, here s1 (`server/director/state.js` `requestMove` case `"visual"`).
2. `whiteboardAskOf` proposes `ask_whiteboard`, adding `replacesRung` when the Director's own template board `explainer@1` is in the tray (`server/brain/propose.js:71-90`).
3. `whiteboardIntentOf` builds the ask from these fields only: `skillId`, `beat`, `item`, her guarded line, `lastContent`, and `mode` (`next.wbBeat === beat.id ? "continue" : "fresh"`) (`propose.js:110-126`). **Nothing from the child's turn is in it.**
4. Board-first runs at kernel time and only in fresh mode (`server/stagecraft/board-first.js:97-135`):
   - `predictedLineOf` builds the predicted line from the kit's content, never from the child's words (`board-sync.js:49-60`).
   - `candidates()` calls `explainerFor` (`server/forge/explainer/lesson.js:80-101`).
   - For a topic with no code template or library entry (c9-maths-ch08-t01 has neither), `explainerFor` returns the lesson's model fill. That fill is a `compare@1` two-column table, made once per lesson at the hook and cached for 3 hours (`lesson.js:21-23, 89`).
   - The pick's facts become the move's content row, "on screen now … board · Recursive rule | Explicit rule | …". Her line is then written from that row.
5. At the ack the board is re-gated against her real line and drawn (`server/studio/seam.js` `requestIntent` → `drawn()` → `writeBoardPage`). On any fresh beat the lesson's one table wins again.
6. **`studio.rung_replaced`** (`server/brain/turn.js:777-783`) means: the live Studio board replaced the Director's template rung (`explainer@1`, the board module in the tray). The rung was unmounted, its facts row dropped, and its script passed as the board's fallback (`turn.js:763`).
   - Both the rung and the board's code candidates come from `explainerFor`, so the "replacement" is the same table. The trace can't show this: the row says *that* the rung was replaced, not by what. This is TRACKING-BRIEF §6.
   - The rows also show `beat.explain` rather than `child.asked_visual` on turns 4, 6 and 8. The ask was not marked as the child's when the move was not itself the visual request.

**Root cause:**
- The board is chosen per lesson and skill, from kit text, before the child is heard.
- The ask carries no description of what the child asked to see.
- Nothing compares a new page with the page already shown.

**Reproducing test:** RCA-1 (todo). The intent for turn 11's state, a picture of aloo requested on s1, carries no `request`. The evidence test pins the 7-of-10 count.

**Fix plan (release 13; Studio, stream 2 + 4A):**
1. **The request rides on the ask.** `whiteboardIntentOf` gets `request: { kind, subject?, said }`, built from `move.visual` / `move.request` plus the subject that fix 3 keeps. Board-first skips its preselect when `request.subject` is not a kit term.
2. **No repeat page.** `drawn()` refuses a script whose text ops equal the page on screen (same `facts.onScreen` labels, same ops). Instead it either keeps the board on screen with no new page, or runs the line planner with `previous_board` and the instruction "draw what is new".
3. **Trace names the replacement.** The trace row says what replaced the rung: `studio.rung_replaced:<source>` with `first | line | kept | code | template`.

**Safety-floor risk:** none. Boards never carry the safety floor, and the floor's predicates run on her words before any board.

## 2. She claims a game and an aloo picture that were never on screen

**Confirmed:**
- **Turn 3:** "Screen par game: left Recursive, right Explicit…" was spoken with no guard. Mounted were the explainer rung and the lesson table. No play piece, no Stagecraft piece.
- **Turns 23 and 25:** "screen par aloo dekho…" (no guard) and "board par aloo dekho…" (only `cantshow`) were spoken over the same table.
- The saved `lesson.state.lastMove.shape` ends with "it is on the screen now: point them at it in your first words and say what to look at".

**Code path:**
1. `state.js:1527`: `move.shape = join(move.shape, s.module?.id ? SH.VISUAL_ON_STAGE : SH.VISUAL_NOT_YET)`.
   - Any module mounted, here the `explainer@1` rung, tells the model the requested picture "is on the screen now".
   - `turn.js` later replaces the rung with the Studio board, but the shape was already compiled.
   - `askTruth` (`turn.js:645-650`, `shapes.js:263`) corrects only the game and animation clauses, and only the *instruction*, never her words.
2. The `visual_diagram` must-note (`shapes.js:494`): "never say there is no picture … if the screen has it, first send their eyes there (dekho / look)". Together with item 1, this is an instruction to point at the screen.
3. **The reply guard G-SAY-1** (`server/director/say.js:155`, called from `server/brain/say.js:357`): `screenProblem = refersToScreen(text) && (!screenHasTargets(ui, module) || …act words over a watch-only rung…)`.
   - It asks whether there is anything to tap. Chips or any mounted module satisfy it.
   - It never compares the claim with what is mounted: there is no check of "game" against a play piece, or of "aloo" against the board's labels.
   - "board" is not in `UI_WORDS`, so turn 25's "board par … dekho" cannot fire it at all.
4. `saysCantShow` fired on turn 25. `stripCantShow` removes only that sentence, and its rewrite note tells the model "the board draws for you" (`brain/say.js:514`), which pushes it toward "board par … dekho".
5. "Audit #9" names no guard in code. No predicate checks a visual claim against what is mounted. `screenContradiction` (`server/director/modules.js:383`) compares only fraction part counts, and only for Director modules.

**Root cause:**
- Truth about the screen is enforced by instruction (the shape says it is on screen), not by a predicate on her words against the mounted artifact.
- The instruction is computed from "a module is mounted", not from "the mounted thing shows what was asked".

**The predicate** (in `r13-fix-2-5-screen-claims.diff`): a sentence that points at the screen or the board ("screen/board par|pe|mein", "on the screen", "look at the board", स्क्रीन/बोर्ड पर) is a screen problem when either:
- it claims a game or activity (game, khel*, activity, play, गेम, खेल) and no play or Stagecraft piece, nor any interactive module, is mounted; or
- none of its content words (3+ letters, not pointing words, names or fillers; numbers count) is a word the mounted pieces show. Those words are the whiteboard script's texts and `facts.onScreen`, the rung's script texts and facts, and the chip labels (`stageWords`).

The repair is fix 5's: the pointing is taken out and the content kept in words. "Kiko, screen par aloo dekho: mitti ke neeche gol tuber…" becomes "Kiko, aloo: mitti ke neeche gol tuber…", which describes it in words without claiming the screen shows it.

**Reproducing test:** RCA-2 uses lines 3, 23 and 25 against the exported table. It also checks that pointing at what IS drawn stays allowed: "Screen par dekho: Recursive rule left mein hai" passes.

**Also needed (not in the patch):**
1. `state.js:1527` chooses VISUAL_ON_STAGE only when the mounted piece answers the request (a request subject in its words, or no subject). Otherwise it uses VISUAL_NOT_YET. This is Director (4A) work and depends on fix 3's subject.
2. The `cantshow` rewrite note says "describe it in words", not "the board draws for you".
3. The speculative path (`turn.js:1280`, `perceive.js:149`) passes `ui` with no studio slot. With the claim predicate on, a speculative reply would be judged against chips and module only. It must get the same `withStudioSlot(ui)`. The patch does not change this, so on a speculation hit the guard sees less of the stage than the real path does.

**Safety-floor risk: low.**
- The predicate only ever flags *more* lines, and the repair only removes pointing phrases.
- In `brain/say.js`, the floor (helplines, AI disclosure) is checked before the screen guard, and safeguard turns do not point at the screen.
- One risk to measure: a false flag on a legitimate pointing line whose words are on the board in another form, such as Devanagari against Latin. The repair then turns it into words-only, which costs a pointer, not truth.
- Release 13 should run the round3-conversation battery and owner-2 before and after on the same seeds.

## 3. "Different subject" + "Show me a picture" produced nothing

**Confirmed:**
- Turn 18, "mere ko aloo ke baare mein padhna hai", became `change_topic` from the model's understanding note. `requestOf` returns null for it.
- Turn 20, "Different subject": she offered "aloo par picture, short story, ya quick quiz".
- Turn 22: the chip `req:visual` became `reteach` on skill s1. The board drew the s1 table again (page 7) while she said "screen par aloo dekho".

**Code path:**
1. `change_topic` → `plan("repair", SH.offerWays(), …)` (`state.js:914`). The subject the child named is never stored. `switch` (`state.js:919-931`) only finds class topics (`findTopic`).
2. The `req:visual` chip → `{ type: "visual", kind: "diagram" }`, with no subject (`state.js:1255`, `classify.js:456`).
3. The visual move's `skillId = currentSkillId()` is always a kit skill. Every Studio intent needs a kit skill. Builders key on kit families. Generated specs check `onTopic` against the topic (`server/stagecraft/builders.js:161`). The image rung takes its prompt from the candidate, not from a free subject (`builders.js:165-171`).

**Root cause:**
- The product has no off-topic visual.
- Worse, the offer was made ("aloo par picture?") by a shape that never checks whether a picture of that can exist.
- And the subject is lost the moment it is said.

**Reproducing test:** RCA-3 (todo). `requestOf(line 18)` keeps no subject.

**Fix plan (release 13; product decision for main and the owner first):**
1. **Keep the subject.** `requestOf` reads "X ke baare mein padhna / dekhna / batao" as `topic` with `subject`. This already exists for "cricket ke baare mein baat karo". The Director stores it on `s.offTopic = { subject, turn }`.
2. **Never offer what cannot be shown.** For a subject outside the kit, `offerWays` offers only what exists: a short spoken story or a quick spoken quiz, or the topic switch (`switchOffer`) when `findTopic` finds a class topic. A picture is offered only when an image path exists.
3. **The honest picture path.** This is a decision for main. Today nothing can draw a potato in a maths lesson.
   - Option A, the floor: say so plainly ("aloo ki picture abhi nahi bana sakti"), describe it in words, then offer to come back. The owner must accept "no picture" as a line; that would reverse part of the "never say there is no picture" note.
   - Option B: a FLUX image rung (Azure, Direct) for a free subject. It would run behind the child-safety image gate, never for a person, with the subject checked by the existing safety predicates first. It needs a cost cap and a safety review.

**Safety-floor risk:**
- Option A: none.
- Option B: high until reviewed. A free-text image subject from a child is a new path for unsafe content, so it needs the frozen safety predicate on the subject and an image classifier on the output.

## 4. "Background clear karo … recursive rules jo kachra aa raha hai, hatao" → "background noise main control nahi kar sakti"

**Confirmed:** turn 12's transcript, "तेरे थोड़ा बैकग्राउंड क्लियर करो, ऐसे recording rules जो कचरा आ रहा है ना, हटाओ उसको". The board on screen showed "Recursive rule | Explicit rule". The rows show `conv2.note.repeat` / `request.repeat`, and she answered as if the request were about noise.

**4a, clear the board: no such capability.**
- `requestOf` has no clear, saaf, hatao or erase pattern (`server/director/requests.js:103-149`).
- The child-facing "Not this one" control is switched off for whiteboards (`src/studio/StudioStage.tsx:318`).
- The board's `erase` op is only drawn by the planner model.
- The words went to the classifier, which read them as `repeat`.

**4b, ASR.** The live transcription session gets one fixed prompt, about who speaks and which script to use (`server/voice/stt.js:36-40, 59-70`). The code says: "Keywords belong in the live model's structured `keywords` field, compiled per lesson; not wired yet" (`stt.js:34`). Two approaches were tried and rejected (`context/rejected.md:248, 278`):
- terms in the free-text prompt: the transcriber invented lesson content from near-silence;
- Azure PhraseList: no effect on hi-IN.

So "recursive" has no help against "recording".

**Root cause:**
- a missing request type and Director/Studio action for clearing the board;
- no lesson-vocabulary path into ASR or into the reading of its output.

**Reproducing tests:**
- RCA-4a: line 12, "board clear karo", "ye board hatao" and "board saaf karo" must be `clear_board`.
- RCA-4b (todo): `sttSession` passes a structured term list.

**Fix (4a, `r13-fix-4-clear-board.diff`):**
- `requestOf` → `clear_board` when a surface word (board / whiteboard / screen / background, in both scripts) is near a clear verb (clear / saaf / hatao / mitao / erase / खाली), or "kachra … hatao", at any length.
  - It never fires inside a numeric attempt, and never ahead of a goodbye or a stop. "board saaf karo, bye" is still a goodbye.
- The Director plans `withLead(SH.boardCleared())` with `move.clear = "board"`. The shape: "it is cleared now; say so in a few words, never about noise or the microphone; carry on".
- **Not in the patch** (stream 3 + Studio): in `brain/turn.js`, on `r.move.clear === "board"`, retire the on-screen Studio piece and unmount a rung, then reset `L.wbUnder`/`wbBeat` so the next board is fresh. Today `hostFeedback("not_this")` retires a piece, but whiteboards are excluded on several retire paths (`seam.js:649, 750, 984, 1022`).
- **False-positive risk:** "background noise clear nahi hai" or "screen par clear dikh raha hai" would read as `clear_board`. Measure on the request battery before shipping.

**Fix plan (4b):**
- Don't put terms back in the prompt (rejected twice).
- Repair kit terms after ASR in code, before classify: a per-lesson term map from kit skill titles and expectations, applied with a phonetic and edit-distance match ("recording rules" → "recursive rules" only when the lesson has "recursive rule" and the child's turn names the board or rules).
- Log the raw and the repaired text. A model never grades, so the repair touches only the reading of the request, never an answer.
- In parallel: does the Azure realtime transcription deployment accept a structured `keywords` field today? That is an Azure-side check for stream 2 / main.

**Safety-floor risk:**
- 4a: none. Goodbye, stop and the safety predicates are checked first, and `scanSafety` runs on the raw words before any request.
- 4b: low. The term repair must never change the text the safety predicate reads. It must run on a copy, after `scanSafety`.

## 5. "Ab 10 ke baad number bolo." after a long turn holding 7 and 16

**Confirmed:**
- Turn 11 META is `guard: ["screen"]`. Its reasons are `guard.rewritten`, `guard.screen` and `guard.replaced`.
- The child's turn 10 said "agla number … saat hoga … solah" (7, which is right, then 16) and asked for "image … visualization".
- On screen was page 3 (the staircase "4 · +3 · ?", drawn for turn 9), and page 4 ("? · +? · ?", `teacherReplySeq` 11) was drawn for this reply. Neither shows a 7 or a 10.

**Code path:**
1. The draft named the screen. Its exact text is not in the export; the flight recorder (dc-r12-flight-recorder) will hold drafts. `screenProblem` flagged it: a Studio whiteboard is not a "target" (`screenHasTargets` excludes `kind === "whiteboard"`), so with no chips any "screen" sentence fails.
2. The model rewrite still said "screen".
3. `brain/say.js:590`: `reply = keepOr(stripScreenRefs(reply))`. `stripScreenRefs` (`director/say.js:159-162`) **deletes every sentence that mentions the screen**, along with the sequence it was showing.
4. `keepOr` keeps the remainder if it "hands back" (`handsBack`: "bolo", `server/director/items.js:458`). What remained was the draft's last sentence. The child got "Ab 10 ke baad number bolo." with no 10, and no acknowledgement of their 7, anywhere before it.

**Root cause:** the screen repair has two defects.
- It treats *looking at* a board like *tapping* one: a whiteboard does not count.
- Its repair deletes whole sentences, content and all.

**Reproducing test:** RCA-5. The draft's shape is reconstructed, and the test says so: "Screen par seedhi dekho: 4, 7, 10. Ab 10 ke baad number bolo." The repair must keep "4, 7, 10". Today it returns exactly the line the child heard; the evidence test pins this.

**Fix (`r13-fix-2-5-screen-claims.diff`):**
- `screenProblem` splits **act** from **look**:
  - an act sentence (tap / drag / buttons / tiles) needs a target, as before;
  - a look sentence needs only something watchable (a whiteboard counts), and what it names is checked by fix 2's claim predicate.
- `stripScreenRefs` → `unpointScreen`: a pointing sentence loses only the pointing ("Screen par seedhi dekho: 4, 7, 10." → "Seedhi: 4, 7, 10."). An act sentence still goes.

**Also needed (stream 3, `brain/say.js` is read-only for 4A):** after a strip, if fewer than half the sentences survive, use the rewrite's lead slot or `fallbackReply`, never a bare tail.

**Safety-floor risk:** none. The floor is checked before this guard, and the repair never adds words.

## 6. `turn.speculation_miss` on almost every turn

**Confirmed (export, n = 17 turns):**

| | Turns | Median `server_ms` |
|---|---|---|
| Speculation missed | 14 | **2526 ms** |
| Speculation hit | 1 | **585 ms** |
| Not speculated (chip; byte-classified) | 2 | 1555 ms |

The one hit (a95d2ff1 turn 7) is the only speculated turn whose understanding note carried no request: `conv2.note.answer_wrong`. Every turn whose note was a request (game, visual, clarify, repeat, change_topic) or another reading (answer_correct, answer_hedged, noise) missed.

**Code path:**
- `speculate()` (`server/brain/turn.js:1268-1289`) runs one plan plus `textReply` per likely outcome. `SPEC_OUTCOMES.none = ["no_evidence"]`, so on these unkeyed turns that is one speculative reply per turn. It is started by `perceive()` while the classifier's model call runs.
- A hit needs `replyKey` equality (`turn.js:1209-1212`). The key is the JSON of the compiled instructions, the child's words, history, `lastMove`, hint level, verdict, chips, module and more.
- In these lessons, the real plan's move came from the understanding note and the request the model read. The speculative plan cannot know either, so its instructions and `lastMove` differ.

**Inferred, needs the miss reason:** `missReason()` (`turn.js:1352`) names the differing key parts, but only in the debug log, not in `brain_trace`. The flight recorder should store `speculation.differs`.

**Cost:**
- **Latency.** A miss writes the real reply only after classify. Median 2526 ms against 585 ms here. That is ~1.9 s per turn the child waits, and it hit 14 of 17 turns.
- **Tokens.** One wasted taxila-fast reply per speculated unkeyed turn, and up to 3 per item turn.
- **Quality.** A miss never ships a stale reply (exact key match). A hit's reply, though, was guarded with the speculative `ui`, which has no studio slot (`turn.js:1280`). With fix 2 on, that would under-check screen claims on hits.

**Root cause:** speculation predicts the *grade* (outcome) while the turn's move is decided by the *request* and the understanding note. On a request-heavy lesson like this one, the guess space has no request in it, so it nearly always misses.

**Fix plan (release 13, stream 3 + 4A):**
1. Speculate per *likely request* as well as per outcome. Use `classifyFast`'s request reading, plus the top one or two request types from the understanding note's prior, or the previous turn's request (turns 12-14 of a95d2ff1 repeated turn 11's visual request, and turn 3 repeated turn 1's game request).
2. Or start the reply only after the understanding note, which is cheaper than classify. Measure both on owner-2 at 3 seeds: the miss rate and p50/p90 `server_ms`.
3. Log `speculation.differs` into `brain_trace.reasons` as `turn.speculation_miss:<parts>`.
4. Pass `withStudioSlot(ui)` to the speculative `textReply`.

**Safety-floor risk:** none from the latency fix. On item 4, the speculative path must run the same guards with the same stage view; today it sees less.

## 7. "Those examples were drawn above the previous content"

**Confirmed by replaying the export through the client's rule:**
- The client draws every op since the last fresh page, complete, under a `continue` script (`src/modules/whiteboard/StudioWhiteboard.tsx` `priorFor` lines 43-52, `remember` 57-69).
- The server marks a page `continue` whenever the explain beat is unchanged (`propose.js:121`), whatever the page draws.

Replaying a95d2ff1's pages:

| Page (mode) | What it lands on |
|---|---|
| 3 (continue) | The staircase stroke crosses the table's "From the / one before / Step by step" |
| 4 (continue) | Writes "?", "+?", "?" exactly on page 3's "4", "+3", "?", and its stroke over the same staircase |
| 5 (continue) | All 5 ops land on the table's "First term", "Nth term", "directly" and its line |

That is the owner's report: the new example was drawn over the old board. Stream 2's client instrumentation is not needed to show this. It would confirm only what the phone painted, which the replay already predicts.

**Root cause:**
- A page is "continue" by beat, not by content.
- The client stacks rather than clears.
- Neither checks whether the new ops land on the ones already drawn.

**Reproducing test:** RCA-7 replays the exported pages through `boardModeFor`.
- Pages 3 and 4 must become fresh.
- Page 5, once page 4 is clean, sits beside the staircase and correctly stays a continuation.
- A continuation drawn beside the board stays one.

**Fix (`r13-fix-7-board-continue.diff`):**
- `board-sync.boardModeFor(script, under)`: a continue script whose ops land on the ops under it is drawn fresh. Box overlap is coarse; text is sized by its length and size. A script that targets an earlier op or erases first stays a continuation.
- `seam.js drawn()` applies it, tracking what the client has under a continue page (`L.wbUnder`, the same 120-op window as the client).
- No client change: the client already starts fresh on `mode: "fresh"`.

**Safety-floor risk:** none.

---

## Owner-visible priority for release 13 (4A's read; main decides)

1. **Fixes 2 + 5** (truth about the screen). She claimed things that weren't there. This is the lie that cost trust.
2. **Fix 7** (boards drawn over boards).
3. **Fix 1** (the repeated table): the request on the ask, and no repeat page.
4. **Fix 4a** with its turn/Studio half.
5. **Fix 6** (≈1.9 s per turn).
6. **Fix 3**, once main and the owner choose option A or B.
7. **Fix 4b**: the term repair, behind a measurement.

The child-safety floor is unchanged by everything here. No frozen file is touched: the patches change `director/say.js` (not safety.js), `requests.js`, `state.js`, `shapes.js`, `stagecraft/board-sync.js` and `studio/seam.js`.
