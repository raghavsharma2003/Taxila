# Round 3 · forge · AUDIT: the owner's complaint, reproduced on taxila.dev (2026-10-09)

**Where and how.** taxila.dev, web + worker 145996f, 2026-10-09 09:20-09:55 UTC. The REAL child client in Chromium
(`harness/walk.mjs`), through the sandbox proxy with TLS verified (a private NSS db that trusts the proxy CA; no
`ignoreHTTPSErrors`). One `@taxila.test` guardian, a fresh class 5-7 child per case (the Older Desk; class 4 topics were
taken by a class 5 child because the Young Desk has no typed row and this walk types), the practice page of the topic on
the typed lane, two ordinary turns, then the child's visual ask. When something real was on the stage, the SAME page was
shot at **360 × 800, 412 × 915 and 1366 × 768** (one lesson, the Desk re-solves from its container; one context at DPR 2
with touch, resized). The account was deleted afterwards. This is one adult-scripted run per case (n = 12 asks); it shows
what a child sees, not how often (the library matrix below gives the rates).

Screenshots: `before/<case>/01-ask-<size>.png` (the ask), `02-turn-*` / `03-turn-*` (the next practice turns when the tray
changed). Records with every turn response and slot: `before/<case>/record.json`. The library matrix (every catalogue piece
at the same tray boxes, judged by `server/forge3/qa`): `matrix-before/` (summary.json, matrix.json, a sample of shots).

## 1. What the child saw, case by case (12 asks)

| case | topic | the child said | what showed | what is wrong |
|---|---|---|---|---|
| picture | c5-maths-ch02-t01 Fractions on a line | "picture dikhao" | board: a line 0-1, an arrow from 0 to 1/11 of the way, the word "fraction" | **nonsense:** she says "0 se 1 ke beech 5 equal gaps hain; 2/5 doosre mark par" — no ticks, no gaps, an arrow at the wrong place; labels 11 px at 360 (`picture/01-ask-p360.png`) |
| diagram | c6-maths-ch07-t01 Fractional units | "show me a diagram" | board: 3 ovals, 3 dots each, "3 × 3 = 9" | **nonsense:** she says "3 equal groups, each holding 5 dots. What is the total?" (`diagram/01-ask-l1366.png`); the drawing sits in the top-left of an empty slate (24% of the box) |
| draw | c5-evs-ch01-t01 Forms of water | "draw it" | board: melts → evaporates → condenses → freezes (a cycle of verbs) | passable; the same green chalkboard as every other case |
| whiteboard | c7-maths-ch08-t01 Multiplying fractions | "whiteboard pe bana ke samjhao" | board: the words "fraction · of · fraction → multiply" | **nonsense:** she says "screen par roti ke 5 equal parts hain; shaded hissa 3/5" — no roti, no parts; she reads the facts row aloud ("fraction \| of \| fraction \| multiply dekhiye"); "multiply" overlaps itself at 412 (`whiteboard/01-ask-p412.png`) |
| game | c4-maths-ch05-t01 Equal shares | "game khelna hai" | the fractions@1 engine that was in the tray was **unmounted**; board: a half-disc "one-half", a quarter "one-quarter", "more equal parts" | **asked for a game, got a static board** that replaced the game; the board shows halves and quarters under "1/3 ka ek part dikhaiye" |
| animation | c6-science-ch01-t01 How scientists find out | "animation dikhao na" | board: a 5-box flow chart Observe → Ask a testable question → … | **no animation** ("screen par movement nahi hai"); **the board answers her question** "Observe ke baad kaunsa step aata hai?"; the last box is cut at the board's bottom edge |
| game-perimeter | c6-maths-ch06-t01 Perimeter | "game khelna hai" | the geoboard was unmounted; board: a polygon with arrows "boundary"; the next turn mounts the geoboard again with **"Shade a shape with area = 3"** | asked for a game, got a board; then an **area task in a perimeter lesson** under "length 50 aur breadth 30, expression batao", the grid **cut off at the right edge** and its Check / Clear buttons cut at the bottom at 360 (`game-perimeter/02-turn-p360.png`) — the round-2 defect, still there |
| sim-science | c7-science-ch01-t01 | "simulation dikhao" | board: a 5-box flow chart "Idea to test → Two identical cups → …" | no simulation ("screen ke flow ko bolkar simulate kijiye": simulate it by speaking) |
| picture-evs | c4-evs-ch01-t01 Community | "picture dikhao" | board: a 5-box flow chart "List the jobs → Match jobs to people → …" | a flow chart for "what is a community", no picture |
| diagram-science | c6-science-ch02-t01 Stems | "show me a diagram" | board: two columns of words "Shrubs / Trees, hard woody stems, …" | words in two columns, no picture of a stem |
| game-sst | c6-sst-ch01-t01 Locating places | "can we play a game?" | board: "Equator → latitude → Prime Meridian → longitude → New Delhi" | **"let's play Spot the Place using the five boxes"** over a flow chart that is not a sequence; the "Prime Meridian" box is cut at the bottom edge; her next line asks about map scale over the same latitude board |
| animation-maths | c5-maths-ch01-t01 Big numbers | "animation dikhao na" | board: "Screen / One lakh / Seven thousand / Forty / ?" | a label that says **"Screen"**; the answer to her question (1,07,040 in words) is the board; the next turn's number pad is cut off at 360 |

And on every one of the 12: the same green chalkboard (`board.ground` "chalk" in 12/12 scripts), and a Studio v2 piece
appeared in none (all 12 asks were answered by the whiteboard path).

## 2. Counts (taxila.dev walk, n = 12 asks, 51 measured views after the ask)

- Asked kind honoured: picture / diagram / draw / whiteboard asks 6/6 got a board; **game / animation / simulation asks
  0/6 got anything interactive**, and **2/2 that had an engine in the tray lost it to a board**.
- Boards that contradict her line or give its answer away: **7/12** (picture, diagram, whiteboard ×1 per lesson, game,
  animation, game-sst, animation-maths). The whiteboard gate W0-W9 passed every one of them.
- Look: **12/12 the same chalkboard.**
- Layout, re-judged on the same boards at the same tray boxes with the forge3 verdict (`matrix-before`, group
  `prod-whiteboard`, 20 distinct boards × 3 sizes = 60 views): **9 broken** (all text < 14 px on a phone: 6 at 360, 3 at 412).
- Module engines (6 views of the practice turns): **5 broken** — content taller or wider than the tray (507 px in 355 px at
  360 × 800: number pad cut; geoboard grid and buttons cut).

## 3. The library at the child's size (`matrix-before`, every catalogue piece, 1,162 artifacts × 3 sizes)

The catalogue (`data/studio-catalogue/topics/*.json`, 382 class 4-7 topics) rendered in the REAL Desk tray + StudioStage at
the tray boxes taxila.dev gave (360 → 328 × 404, 412 → 380 × 519, 1366 → 752 × 408), judged by
`server/forge3/qa/checks.js` (text ≥ 14 px, nothing clipped, no overlapping text, targets ≥ 44 px, something drawn, no
errors, a board not drawn in a corner). Local Chromium, the HEAD tree's renderers, fake clock to each piece's settled state.

| piece | 360 × 800 | 412 × 915 | 1366 × 768 |
|---|---|---|---|
| Studio v2 games (378 pieces, 37 engines) | 378/378 broken | 378/378 broken | 378/378 broken |
| Studio v2 scene explainer (382) | 382/382 broken | 382/382 broken | 382/382 broken |
| catalogue boards (382, first beat) | 381/382 broken | 367/382 broken | 9/382 broken |

Why, from the failing checks: every Studio v2 view has the host's type label at 8 px, ellipsised ("GAME · STORY…") — at
every size; on phones the 1000 × 625 world is width-bound (canvas labels 11.9 px, targets 41 px at 360); HUD pills overlap
one another (Q3 in 701/756 game phone views); pills include **"CHAIN ×0"** and **"ACCURACY 0%"** (a streak and a percentage on
a child's screen). Boards fail at 360 on text size (an 800 × 500 board's words at 9-13 px in a 312 px box) and draw in a
corner of an empty slate (soft check S1, content < 35% of the box, failed on 118/382 at 360). (The verdicts above
are re-read with the final checks: Q7 "not a speck" applies to boards only; the run's own summary.json still counts it for
canvas engines, which changes no row: every Studio v2 view also fails Q1.)

The explainer is one engine for 382 topics, the game is one of 37 engines with 87 topics on story-rail@1 and 33 on
sort-storm@1, and the explainer library's 316 template boards are 197 flow@1 charts (62%), 96 compare@1, 12 parts@1, 11
cycle@1 — written as five words by a model and drawn as boxes and arrows whether or not the idea is a sequence.

## 4. Root causes (each fixed or patched; see `../RESEARCH.md` §3 and `../APPLY.md`)

1. **The picture was never checked against the words.** The gate checked a board's numbers, words, overlap and counts of
   drawn families against her line, but passed vacuously when nothing was drawn, and accepted any product of her counts
   (9 = 3 × 3 for "3 groups of 5"). → wb-gate@3 W10-W13 (`server/studio/qa/semantics.js`).
2. **A fixed landscape world in a portrait leftover box.** Studio v2 draws 1000 × 625 units; the Desk's tray is the
   elastic remainder; the stage fitted the WHOLE board too, so a corner drawing stayed small. → the stage frames a board's
   content (`src/studio/boardView.ts`), uses every px of a phone tray, and shows the board twin when the device's own box
   cannot hold a Studio v2 world (`src/studio/twinBoard.ts`); the lesson stage leaves out the host's dev label, duplicate
   captions and score / streak pills (`src/studio/studio.css` + patch 01).
3. **Engines that do not fit their frame are cut, not fitted.** → patch 02 (`src/modules/frame/fit.ts`).
4. **The request kind is not honoured.** The visual request becomes a whiteboard ask on every lane, and the board replaces
   the engine in the tray. → patch 03 (keep the engine for game / animation / simulation asks) + `server/forge3/compose.js`
   (the ladder: play → certified game → keep the engine → board).
5. **One look.** The whiteboard renderer's paper and grid grounds were never used. → `server/forge3/art.js` (one ground per
   lesson by subject and band, varied across lessons) wired in `server/studio/seam.js`.
6. **An engine default that invents a task.** The geoboard's unbound default built "area = 3" from the item's first number
   in a perimeter lesson. → patch 06.
7. **Nothing judged a piece at the size the child got.** → the forge3 visual QA (`server/forge3/qa`), certificates for the
   library (`server/forge3/certify.js`, patch 05), the QA service for generated pieces (`server/forge3/qa-service.mjs`,
   `gate.js`), and the device check in the stage.

## 5. Not covered by this audit (said plainly)

- The Young Desk (classes 1-4 typed lane has no input; a class 4 child without a microphone could not answer the warm-up
  "Tumhe kaunsa cartoon pasand hai?" at all — seen in the smoke run, `../RESULTS.md` §5) and the voice lane.
- Stagecraft pieces on the live site: none appeared in this walk; the library matrix covers how they render.
- Real phones (all views are desktop Chromium at phone sizes, DPR 2), Indian networks, and children.
