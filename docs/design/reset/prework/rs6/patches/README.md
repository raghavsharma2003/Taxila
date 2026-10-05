# RS-6 pre-work patches: where each applies after Wave 2 integrates

All patches were made against the working tree of 2026-10-04 (sha256 prefixes below) and dry-run clean on it.
Wave 2 may touch these files before integration: if `patch` rejects a hunk, re-apply by hand; every hunk is self-contained.

| # | file | applies to | what | flag |
|---|---|---|---|---|
| 01 | `01-content-f0.patch` | `server/director/items.js` (06d48cf834d77680), `server/content/next-topic.js` (7ff3d82337a9d080) | Content F0 (CONTENT-LEVEL §3 F0 steps 1-5): queue by expected success, no item ge <= C-2 at 1-2, measured ge first, opener floor ge >= C-1, headroom below the top, diagnostic at 3+ and off item 1's motif, cap across skills dropping the easiest; `harderThan` + `selectNext({ harder })`; `fastForwardSkips`, `testedOut`; topic start at the school's chapter / placement GE / calendar | `TAXILA_CONTENT_F0=off` restores the old behaviour byte-for-byte |
| 02 | `02-kits-ge.patch` | `server/content/kits.js` (2560abfa9d1fbcf9) | `normalizeKit` carries `ge` and `demand` | none (additive) |
| 03 | `03-routes-placement.js` | NEW `server/routes/placement.js` + one import/spread in `server/router.js` | placement round API (start, answer) over `server/placement` | ship behind onboarding (RS-2) |
| 04 | `04-migration-placement.sql` | NEW `db/migrations/0NN_placement.sql` | `placement` table; `child.school_chapter` | additive |
| 05 | `05-contracts-and-schema.md` | `shared/contracts.ts` (RS-0 seam commit), `data/kits/SCHEMA.md` | `ge`, `demand`, `PlacementResult`, `PlacementItemPublic` | — |

## Apply, in order

```
patch -p1 -i docs/design/reset/prework/rs6/patches/01-content-f0.patch
patch -p1 -i docs/design/reset/prework/rs6/patches/02-kits-ge.patch
node data/kits-relevel/merge.mjs --out data/kits          # ONLY after the human pass (REPORT.md "what is left")
cp docs/design/reset/prework/rs6/patches/03-routes-placement.js server/routes/placement.js   # + router.js registration
cp docs/design/reset/prework/rs6/patches/04-migration-placement.sql db/migrations/0NN_placement.sql && node scripts/migrate.mjs
```

Patch 01 alone (no merge) already stops the owner's dice opener (test "real kits, patch alone"): the c4 dice rung is no
longer item 1 or 2, and the diagnostic moves to 3+. The merge is what lifts the first items' measured level.

## Callers to wire (other streams' files; not patched here)

- `server/director/state.js` (RS-5): the "harder one" chip calls `selectNext(s, kit, { harder: true })` (null = "that was the
  hardest one I have": say so, and request a spicy isomorph, F3); after each graded first attempt, add
  `fastForwardSkips(s, kit, answers)` to `s.skipped`; when `testedOut(kit, answers)`, mark the topic's skills practising and
  end practice early. Pass `{ weak: true }` to `buildPracticeQueue` when the child has shown weakness on this topic or its
  prerequisite (topicStatus "weak"), and `theta` once the ledger's strand θ is read by selection (F3).
- `src/onboarding/Setup.tsx` (RS-2): ask the parent "which chapter is your class doing now?" per subject, store in
  `child.school_chapter`; fill the "Where your child is starting" screen from `placement.result` (level, startGE as a
  chapter via `server/placement` `startChapter`).
- Wherever the strand epoch is first opened (`server/learner/kt/ledger.js initialBase`): pass `placement: result.placement`.
- `nextTopicFor(child, { startGE: { maths: result.startGE } })` until `school_chapter` exists.

## Tests

`node --test evals/content-level-v2/tests/*.test.mjs` (28 tests). The F0 tests apply patches 01 and 02 to a temp copy of
just those files (`evals/content-level-v2/lib/f0-sandbox.mjs`), so they keep proving the patch, not the tree. After
integration, copy `f0.test.mjs`, `placement.test.mjs` and `merged-kits.test.mjs` into `tests/` with imports pointed at the
real modules, so `npm test` gates them.
