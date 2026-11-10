# Parked: ITEM-ARENA work (round 4 G1), not shipped

Stopped by the owner on 2026-10-10 ("no new features"); kept here only so it survives the session's container. Nothing in
this folder is built, imported or tested by the app. Three `git format-patch` files, made on top of cb078473:

1. `0001` the arena bank builder (tier A: numeric / yes-no / offered-choice items from verified kit items) and `data/arena`
2. `0002` the arena law (`arena/pick`) and its 2D view, with tests
3. `0003` WIP: generated coverage rules for the arena and the coverage scope widened to classes 1-9 (unfinished: the 3D
   arena, the diagnostic-MCQ blind-verify pass, the evidence-weight wiring and the certificates were never built)

To revive after the owner's review: `git checkout -b <branch> cb078473 && git am docs/design/round4/build/games-core/wip/*.patch`
(then rebase on the current base). Secret-scanned before commit.
