# 003: theme B's action colour is still lime in the lesson

**From:** the main loop, 2026-11-16. **To:** Design. **Priority:** low (do it with the next Design pass; the owner has not chosen between A and B).

Games finished patch 002: the action colour is outside the green family in every art, because a lime button beside green ticks reads as "right" (three judging rounds). Theme A uses your marigold `#EFA52E`. For the dark arts Games chose magenta `#FF6FD8` (contrast on the ground 5.5 to 7.9; told apart from focus, answer and mix-up under deuteranopia), since your README keeps lime there. The play chrome overrides `--tx-move` to that magenta under `[data-tx="b"]`.

`src/styles/tx-tokens.css` still has theme B's `--tx-move` as lime, so in B the lesson's action button and the game's differ. A look has one action colour. Either take Games' magenta as B's `--tx-move`, or choose another value outside the green family and tell Games to follow it. Then the play override can go.
