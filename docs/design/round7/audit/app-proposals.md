# App audit: proposals for the owner (redesigns and naming choices)

Written by the app fix session, 2026-11-10. These are not built. Each says what the child or parent sees now, what is proposed, and the cost. "Small" is under a day of work, "medium" is a few days.

Ids are from `docs/design/round7/audit/app.md` (APP) and the journey audit's `journey.md` (JRN).

## Redesigns

### APP-20: World and Hangar while the map loads or fails
- **Now:** for 2 to 3 seconds, and for ever if the read fails, the World and the Hangar say "Your first secure idea lands here…", as if the child had nothing yet.
- **Proposed:** a quiet wait state while loading (the same mark the other screens use), and a "Try again" panel when the read fails. The "first secure idea" line shows only when the map really answered with nothing.
- **Cost:** small. One loading and one error state in `KakshaWorld.tsx`; the data hook already knows `loading`.

### APP-21: the mic dock below the fold at 360×640 with the number pad up
- **Now:** at 360×640 the stage solver reports overflow, so the lesson scrolls and the mic dock sits under the bottom edge while the pad is open. Budget phones are 360×640 to 720 after browser bars (`context/rejected.md:34`).
- **Proposed:** in `solveStage`, shrink the stage to its minimum slot height before allowing the page to scroll, and let the number pad take the pad-open height from the stage, not from the dock.
- **Cost:** medium. Same stage path as Studio's held-board split, so it must be done together with Studio and re-measured at 360×640 and 412×860. Not done here to avoid two people editing `stageLayout.ts`.

### APP-22: two "page not found" screens
- **Now:** `/start/typo` and `/parent/typo` show the old cream not-found page inside dark screens; the public pages show the Volt one.
- **Proposed:** one not-found screen (the public one) everywhere.
- **Cost:** small. Replace the two local fallbacks in `src/onboarding/index.tsx` and `src/parent/index.tsx`.

### APP-37: a stalled network leaves every exit disabled
- **Now:** on a slow network the child sits on "Getting the lesson ready" or "Saving today's lesson" and every button is disabled.
- **Proposed:** keep Pause enabled while the lesson is starting; enable "Finish" after 8 seconds of "saving" (the answer stays saved on the device and goes out on the next open).
- **Cost:** small to medium. The Finish path needs a check that the lesson's end is retried safely.

### APP-38: a refresh during Quick practice or Ask
- **Now:** a refresh in Quick practice starts a new set; a refresh in Ask returns to the empty form.
- **Proposed:** keep the lesson id in the URL for these two, as the main lesson does, so a refresh rejoins it.
- **Cost:** medium. Both screens start a lesson through `LessonScreen`; the id has to be written to the URL after the start answers.

### APP-39: a refresh mid-lesson loses "Now secure" and "Made for you" on the end screen
- **Now:** the end screen diffs against a map read taken when the lesson screen mounted. After a refresh that read is the middle of the lesson, so the lesson's own gains are not shown.
- **Proposed:** diff against the map as it was at the lesson's start time (the server already stamps `secureSince`), not against a snapshot taken at mount.
- **Cost:** medium. Needs the start time kept with the lesson id.

### APP-55: the Young theme runs a 60 fps loop that draws nothing
- **Now:** `Shell.tsx` starts a render loop for the Young theme that paints nothing. It costs battery on cheap phones.
- **Proposed:** do not start the loop when the theme draws nothing.
- **Cost:** small. Held back because it is in the shell all screens share and needs a look at each theme.

### APP-56: every return to the tab reads the plan twice
- **Now:** `plan.ts` reads the plan on both `focus` and `visibilitychange`.
- **Proposed:** drop the `focus` listener.
- **Cost:** small. Held back as a behaviour change in the plan loop.

### APP-57: no links in the public site header on phones
- **Now:** on phones the header has no links; Promises, Pricing and Help are only in the footer.
- **Proposed:** a menu button that opens the four links, or the three most useful as a row.
- **Cost:** small to medium. A design choice (a menu, or fewer links).

### APP-60: the type row is 10 px too wide at 360 px
- **Now:** the type row (input, Send, Talk) needs 328 px, about 10 px wider than the default dock. An older child typing with voice available can see Talk clipped.
- **Proposed:** lower the input's minimum width on phones.
- **Cost:** small. Needs a render at 360 px, not only the computed CSS.

## Naming and look choices (the owner picks)

### APP-36: one word per thing
Neighbouring screens use two words for the same thing. Pick one of each pair:
- "parent" or "grown-up"
- "orbit" or "World"
- "End lesson" or "End for today"
- "Your answer" or "You said"

Cost: small once chosen (copy tables only).

### APP-54: two catalogue emotes draw the same picture
Two emotes in `data/kaksha/catalog.json` render identically, and the renderer's "rocket" branch matches no id. Either draw a picture for the second emote, or retire one. Cost: small.

### APP-58: three different logos
The browser tab and share card, the parent corner, and the installed icon and `/who` each show a different mark. The owner picks one; then `public/brand`, `public/site/app` and `Mark` in `src/ui/Icon.tsx` are made to match. Cost: small to medium (icons need re-rendering). `src/app/landing/brand.mjs` can still regenerate the older set, so do not rerun it until a mark is chosen.

### APP-59: the "holdover" guard
`hooks.ts` documents a guard against a tap landing just as new answer tiles appear, but nothing applies it. Either apply it (a short delay on the first tap after the tiles change) or delete the code and its comment. Cost: small. Applying it changes how fast a tile reacts, so it is the owner's call.

### The 25-structure limit in the settlement (part of APP-19)
The order is now stable, but the settlement still draws only 25 structures; a child with a 26th secure skill sees none added. Options: grow the grid, add a second ring, or add a "more" count. Cost: medium (art and layout).

### APP-44: the classic child skin
Kept, as decided. It is reachable only with `?ui=classic`.

## From the journey audit (JRN)

### JRN-02: the "mic is off" card at 360×640
The card runs under the steer chips, so "Not now" is covered. Proposed: give the notice a slot of its own in the stage layout, or one line with a visible dismiss. It sits in the same `stageLayout.ts` path as APP-21, so do both together. Cost: medium.

### JRN-04: Hello buttons below the fold at 360×640
"Next" is at y 683, "That's me" at y 670, and "Next" after the faces at y 716, below the 640 px screen. While the first line plays, the only button says "Playing" and is disabled. Proposed: keep the main button in a bottom bar and shrink the face on short screens. Cost: small to medium; it is the first screen a child sees, so it should be checked on a real 360×640.

### JRN-05: tab strips cut the last tab with no sign of more
Notebook and the parent Notes strip cut the last tab at 360 px. Proposed: wrap to two rows, or fade the edge. Cost: small.

### JRN-06: small targets
The public Help page's "112" link is 24×22 and Pair's "Back" is 38 wide. Proposed: a 44 px minimum hit area. Cost: small.

### JRN-07: the sound-check page has no step header
`/start/check` is not linked from anywhere (the sound check moved into Hello, see the comment in `src/onboarding/Layout.tsx`), so no child or parent reaches it, and the missing header is not seen. Proposed: delete `Check.tsx` and its route. Held for the owner because it still contains the sound-check logic that Hello was built from.

## Not done in the deletion pass (could not prove dead quickly)
Unused copy keys (about 14 in APP-47, some in APP-45), the constant lesson-model fields (`thinkingSeconds`, `offlineBadge`, `noPack`), the `supportCode` prop that is never passed, `src/ui` exports `Card`, `Hi`, `StatusGlyph`, `ReauthField`, `Chip`, and `Footer`, `TopBar` in `src/app/Shell.tsx`. Each is small; a later pass can prove and remove them.
