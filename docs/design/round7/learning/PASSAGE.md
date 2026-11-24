# Passages: the data is done, the lesson half is Brain's and Studio's

Audit findings CD-02, CD-03, CD-04 (docs/design/round7/audit/content-data.md). Learning owns the data and the loader and has done
them. This page says what is now in the kits, what the lesson has to do with it, and what Studio has to build.

## What was wrong

- 48 kit topics carried a story, poem, letter or scene (`passage`). Nothing read it. 677 items asked about a text the child never heard.
- In classes 5 to 9, English reading questions carried the whole text inside `prompt_en` and only a translated question in
  `prompt_hi`. A Hinglish lesson asked "Meenu har shaam kahaan baithti thi?" with no story.
- 102 class 8 and 9 English items were dropped when the kit loaded, because text plus question was longer than the prompt budget.
  Nobody saw the drop.

## What the kits hold now

- `topic.passages`: a list of `{ id, text, title?, kind? }`. Each text is stored once per topic. In classes 5 to 9 a topic that
  asks about two texts has two entries. `id` is `<topicId>-p1`, `-p2`, and so on. Poems and letters keep their lines as `\n`.
  `kind: "picture"` marks a scene written in words for a picture board (classes 1 and 2); it is not text to read out.
- `item.passageId`: the passage the question is about. 500 items in 116 topics. In classes 5 to 9, 202 items had their text lifted
  out of `prompt_en` and `prompt_hi`, so both prompts are now the short question.
- The old topic-level `passage` string is gone (it was in 48 topics) and the authoring headers ("(original story)", "the
  illustrator draws exactly this") are out of the text. Nine passages keep their title in `title`.
- Which classes 1 to 4 items depend on the passage was judged from the skill titles (story recall, poem recital, picture
  questions, "what is the poem's idea") and from names and "our story" in the question. An item that carries its own text
  (a rhyme pair, a quoted line to finish, a remediation line) stands alone.
- `server/content/kits.js`: `normalizeKit` carries `passages`. While the lesson cannot show a passage, every item with a
  `passageId` is moved from `kit.items` to `kit.heldItems`, so nothing asks about a story the child never met. Nothing is dropped:
  `kit.lint.itemsHeld` counts them. 500 items are held (4%); five topics keep fewer than six askable items, and `c2-english-ch02-t01`
  (a picture scene) keeps one. A skill whose items are all held has nothing to ask, so `next-topic.js` does not count it
  when it decides a topic is finished (CD-01).
- The prompt budget: `kit.lint.itemsDropped` is 0 for every kit, and a test fails if it is not (tests/r7-audit-content-data.test.mjs).
  Eight long science, EVS and English prompts were shortened to fit, with the same key.
- Flip: `TAXILA_PASSAGES=on` puts the held items back into `kit.items`. Turn it on only when both halves below have landed.
  A kit is normalized once per file change, so the flag is read at start-up.

## What the lesson does (Brain)

Patch 020-passage-lesson-half (docs/patches/to-brain) has the types and the pure decision; the wiring below is Brain's, because
it runs through `state.js`, `say.js` and the compiler.

1. **When.** Before the first item that has a `passageId` whose passage the child has not met in this lesson. `passageBeat()`
   in the patch returns the beat or null. The lesson keeps the list of met passages (`shownAfter`) in its state, with the pinned
   kit's hash, so a resumed lesson does not read the story twice.
2. **Classes 1 to 3: read aloud.** The teacher voice says the kit's own words, in order, as the kit wrote them (`aloudText`). It is
   content, not persona: the reply model renders the beat as a read-through and must not paraphrase or shorten it. It is a move of
   its own, ahead of the question, never a prefix to it.
3. **Class 4 and up: on the board.** The passage goes on the board and stays up while the question is asked and while hints run.
   The teacher says one short line to point at it and does not read it out unless the child asks. The question follows on the
   next turn.
4. **Budget.** Passages are 100 to 760 characters (class 4: median 557, longest 675; classes 5 to 9: median 170, 90th percentile
   523, longest 708; classes 1 to 3: median 264, longest 760). That does not fit the pinned last section, which is why the text was
   taken out of the prompts. The beat is its own move with its own text, and `checkFits` stays on the question alone.
5. **The leak guard.** A passage can contain the answer to its question (that is the point of recall). `revealsAnswer` must read
   the question and the child's draft, never the passage text.
6. **The slot.** A passage may hold `{friendF}` (none does today). Fill it with `fillFriendDeep` like any other kit text, so the
   story's girl is the same girl in the question.
7. **A picture passage** (`kind: "picture"`, five topics in classes 1 and 2) is not read out. The board shows the picture and the
   teacher describes only what the text says. That needs the picture board Studio already owns; if it cannot draw these scenes yet,
   leave those five topics' items held.

## What Studio needs: a passage board at 360 px

A new board template, `passage@1`, for class 4 and up (and for the picture scenes). What the data asks of it:

- Input: `{ title?, lines: string[], kind }`. `lines` is the passage split on `\n`. A poem is up to 10 lines, with a longest line
  of 257 characters in the data; prose is one or a few long paragraphs.
- At a 360 px phone width there is about 328 px of width after the 16 px gutters. At 16 px type that is roughly 36 Latin or
  30 Devanagari characters a line. The 90th percentile passage (about 520 characters) is 15 lines; the longest (708) is 20. That does
  not fit one board, so the template pages: poems split between lines (never inside one), prose at sentence ends, and a page
  holds about 280 characters or 8 lines, whichever is less. Page forward on a tap and by the teacher's cue; keep the page the
  question is about up while the question is asked.
- No horizontal scroll, type 16 px or more, line height 1.5 or more for Devanagari matras, and a tap target of 44 px or more for the page buttons.
- The tray gate that certifies the other templates at p360, p412 and l1366 should cover every passage: 169 passages, three
  languages (the passage text is one language, but the page chrome is three).
- The text must be exactly the kit's text. A board that rewrites or shortens it breaks the question.

## What is not done

- 172 items in classes 5 to 9 refer to "the poem" or "the story" without any text in the kit (the chapter's own NCERT text, which
  the kit never carried). They are still asked as before. Writing those texts is a content job: `context/rejected.md`
  (`kit-invented-companion-texts`) says an invented text must be stored and shown, so each would be written once, stored as a passage and linked.
  The ids are listed in docs/design/round7/learning/PASSAGE-RESIDUAL.txt.
- The arena (`server/play/tools/build-arena.mjs`) reads the raw kit. 25 arena challenges are about a passage item, 10 of them in
  classes 5 to 9, where the text used to sit in the question. Patch to-games/001 makes the builder skip them.
