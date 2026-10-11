# Release 13: the r12 RCA fixes, the honest visual floor (A), and the owner-lesson replay

Stream 4A, branch `claude/r4-conversation`, on base `84bc6050` (claude/blissful-mayer-icwe2j). No recorder file is touched: the recorder's files are `shared/trace.ts`, `server/trace/**`, `src/trace/**` and migration 029.

This branch does share two files with the recorder's minimal choke-point hooks: `server/brain/turn.js` (my change is one 8-line block before `studioSlot`) and `server/studio/seam.js` (`clearBoard`, the `wbUnder` lines in `drawn()`). Merge order is main's call.

## What is in

| # | Fix | Files |
|---|---|---|
| 2 + 5 | A claim about the screen is checked by predicate against what is mounted (details below). The repair unpoints instead of deleting: "Screen par seedhi dekho: 4, 7, 10." → "Seedhi: 4, 7, 10." | `server/director/say.js` |
| 4a | `clear_board`, at any length, never ahead of a goodbye or stop. The Director's `move.clear` plus a must-note. The clearing turn retires what Studio shows, unmounts a rung, draws nothing, and the next board is fresh. | `requests.js`, `state.js`, `shapes.js`, `brain/turn.js`, `brain/propose.js`, `brain/reasons.js`, `studio/seam.js` (`clearBoard`) |
| 7 | `boardModeFor`: a "continue" page whose ops land on what the client already shows is drawn fresh. Pages that build beside the board, or erase first, stay continuations. | `stagecraft/board-sync.js`, `studio/seam.js` |
| (A) | The free subject the child names is kept (`freeSubjectOf`, `state.offTopic`, 4 turns). A picture of an off-kit subject gets `visualUnavailable`: she says plainly she can't show it, describes it in words, draws no board and never sends the child to search. `change_topic` with an off-kit subject offers no picture chip. | `requests.js`, `state.js`, `shapes.js`, `brain/propose.js` |

How fix 2's predicate decides:
- a "game" or "khel…" claim needs a play piece;
- the content words must be words the stage shows;
- pointing at a board ("dekho") is looking, not tapping.

**Not in this release:**
- Fix 1 (the board answering the child's request; no repeat page). RCA-1 is still `todo`.
- 4b, ASR term repair. It goes to 13b, as main allowed. RCA-4b is still `todo`.
- Fix 6 (speculation).
- (B), the image rung. Its design is in IMAGE-RUNG.md.

## Tests

- `tests/r12-rca.test.mjs`: 6 pass, 2 todo (RCA-1, RCA-4b).
- `tests/r13-visual-honest.test.mjs`: 4 pass, built on the owner's turns 18-25 and b08fe8a7 turn 4.
- Guard, truth and conversation suites (`owner-truth-guards`, `lesson-truth`, `round3-conversation`, `round3-truth`, `owner-requests`, `requests`, `p5-*`, `*guard*`, `r4-*`): all pass. The only failures in the wider runs are the environment's browser tests.
- Full gate on `b415c8ee`: tsc and vite build OK; 3059 pass, 2 todo. 1 failure: `conductor-db` "syncParentFacts…" on the Neon test branch. It is the same failure as on the RCA commit before any of these changes, and main's release-11 gate had 0, so it is environmental to this session's DB.
- Full gate on the final head (the release-13 head below): tsc and vite build OK; 3059 pass, 2 todo, 1 fail (the same `conductor-db` Neon test-branch failure).
- Prompt budget PASS. lint-ui 353 (the baseline).

## The owner's two lessons, replayed on TEST

**How it was run:**
- `tests/prod/owner-replay-r12.mjs` sends the child's exact turns in order: the cascade lane, the transcripts as heard, and the "Show me a picture" chip as a chip.
- Prod routing, a local server, one fresh test child per lesson (Kiko, class 9).
- **Before:** base `84bc6050`. **After:** this branch.
- Her lines are model-written, so a replay shows what the code does with the same child turns, not the same words. n = 1 replay per arm per lesson; the patched arm was replayed three times while fixing what the replays found.
- Full tables: `replay/base-84bc6050/replay.md` (before) and `replay/r13/replay.md` (after, the last run).

**What she said on 11 Oct, what base says now, what release 13 says now (a95d2ff1):**

**Turn 3, "Show me some games."**
- 11 Oct: "Screen par game: left Recursive, right Explicit…"
- Base replay: "Screen par Recursive rule dekhiye…"
- Release 13: last replay "Chaliye screen par 'spot the rule' kheliye…". That replay predates the final `khel*` fix; the line is now a screen problem, pinned in RCA-2. Second replay: "Chaliye 'Score Chain' khelte hain: bolkar bataiye…", a spoken game.

**Turn 11, a long turn with 7 and 16 and "photo dikhao".**
- 11 Oct: "Ab 10 ke baad number bolo."
- Base replay: "Board par cricket score line dikh rahi hai: 2 → 5 → 8 → 11…"
- Release 13: "Kiko, picture ko mind mein dekhiye: 4, 7, 10—har baar 3 add ho raha hai. Agla number bolkar batayiye."

**Turn 13, "background clear karo … recursive rules … hatao".**
- 11 Oct: "Kiko, background noise main control nahi kar sakti…"
- Base replay: "…background recording main control nahi karti…"
- Release 13: the request is now `clear_board` and **the board is cleared** (nothing on screen). Her line no longer talks about noise ("Cricket runs sochiye: 4, 7, 10…"). **Gap: she does not say she cleared it**, even with the must-note. This is open for 13b.

**Turn 21, "Different subject".**
- 11 Oct: "…aloo par picture, short story, ya quick quiz…"
- Base replay: "…Science, English, Social Science, ya potatoes par short topic…"
- Release 13: no picture is offered. But she lists subjects ("Science, English, ya SST") that no button can start. This is open: the switch offer exists only for real class topics.

**Turn 23, chip "Show me a picture".**
- 11 Oct: "Kiko, screen par aloo dekho: mitti ke neeche gol tuber…"
- Base replay: "Kiko, screen par potato ki picture dekhiye: bahar brown skin…" over the maths table.
- Release 13: "Aloo gol-matol hota hai, uska chilka bhura hota hai, aur woh mitti ke andar ugta hai. Aap aloo ka rang bataiye." No board, no claim.

**Turn 25, "आलू दिखाओ".**
- 11 Oct: "Kiko, board par aloo dekho: brown skin…"
- Base replay: "Kiko, board par dekhiye: brown skin, gol shape…" over the table.
- Release 13: "Kiko, aloo gol aur bhure chilke wala hota hai; woh mitti ke andar ugta hai. Aloo ki shape kaisi hoti hai?" No board.

**Turn 27, "ye recursive rule explicit rule likha hua hai, aloo dikhao".**
- 11 Oct: "…screen par maths board hi hai; actual aloo picture nahi…"
- Base replay: "…board par recursive rule aur explicit rule ki table hai…"
- Release 13: "Kiko, yahan aloo ki tasveer nahi aayegi; aloo bhura, gol-matol hota hai… Ab aap recursive rule ka example boliye."

**Turn 29, "image dikhao … dikha nahi pa rahi kya?"**
- 11 Oct: "…main is screen par nayi image nahi dikha sakti…"
- Base replay: "…Aloo ki photo ke liye image app kholiye."
- Release 13: "Kiko, aloo gol aur bhure chilke wala hota hai… Recursive rule mein har term pichhli term se banti hai—pehla term kya hota hai?"

**b08fe8a7:**

**Turn 5, "मुझे देखना है डायग्राम".**
- 11 Oct: "Kiko, diagram ko words mein dekho…"
- Base replay: "Kiko, screen par dekhiye: Recursive rule mein har box…"
- Release 13: "Kiko, screen ke comparison ko dekhiye: left mein previous term se step-by-step, right mein position n se direct nth term…", over the table that shows exactly that.

## What the replays found that I fixed during the run

- `POINT_AT` knew only "screen par/pe/mein". "screen ke four parts dekhiye" slipped through, so it now matches any "screen" or "board", minus board exams and CBSE/ICSE/state board.
- The play claim missed "kheliye", so it now matches every `khel*` and `play*` form.
- `clear_board` was not whole on a long turn, so `classifyFast` dropped it. A clear-board request is now always whole.
- The Devanagari "डायग्राम" was read as an off-kit subject, which made a diagram request "unavailable". It and the other picture-kind words are now generic.
- The maths table was drawn beside "aloo gol, bhura hota hai". There is now no board on a `visual_unavailable` turn.
- "Aloo ki photo search kijiye" and "image app kholiye": she must never send the child elsewhere (shape and must-note).

## Known gaps after release 13 (4A's read)

1. **She doesn't say the board was cleared** (turn 13). The board does clear.
2. **The same s1 table is still the board on most explain turns** (fix 1 is not done). It is honest now, because she points only at what is on it.
3. **The word-overlap predicate can't see a described picture that shares lesson words.** "diagram mein neele boxes … pehla box 2" over a table that says "First term" passes on "term". A claim's *shape* (boxes, arrows, colours) is not checked.
4. **Off-topic `change_topic` lists subjects she can't start** (turn 21).
5. **Speculation** still misses on request turns (fix 6).
