# safety-robust patches: apply notes (2026-10-05)

These patches touch files Wave 2 owns, so they were not applied in place. They were generated with `diff -u`
against the tree as it stood on 2026-10-05. Each one was checked with `git apply --check` against the main tree, then
applied in a sandbox copy, where all the gates below passed.

Apply them in order, from the repo root:

```
git apply evals/safety-robust/patches/01-classify-model-read-every-turn-and-unreadable.patch
git apply evals/safety-robust/patches/02-brain-or-duplex-safety-pending-and-model-note.patch
git apply evals/safety-robust/patches/03-duplex-model-note-seam.patch
```

Patch 02 imports `server/duplex/registry.js`, and patch 03 creates that file, so **apply 02 and 03 together**. If
`git apply` refuses because Wave 2 has moved a hunk, apply that hunk by hand. Every hunk is small, and each is described
below.

## 01: `server/director/classify.js`

1. Import `readability` from `./safety.js`. It is a re-export of `server/safety/normalize.js`, and it is already in the
   main tree.
2. In `classifyFast`, put this line right after the low-ASR line:
   `if (!typed && readability(text).unreadable) return { result: null, flags, text, lowAsr: true, unreadable: true };`
   - It must come after the predicate (`if (safety.distress) …`).
   - It must come before the exact-match and lexical branches.
3. Add the new export `needsModelDistressRead(result, text)` above the `classify` doc comment.
4. In `classify`, a bytes-decided result that `needsModelDistressRead` accepts now runs `distressCheck`. A distress
   verdict sets `flags.distress` and `distressKind ??= "model"` and keeps the outcome. The read only ever ORs in.
5. In the low-ASR path, an unreadable turn sends only its readable rest to `distressCheck`.

## 02: `server/brain/turn.js` + `shared/contracts.ts`

1. In `turn.js`, add `import { duplexRegistry } from "../duplex/registry.js";` after the `seam-safe.js` import.
2. In `turn.js`, put a block right after `mark("classified");`:
   - `body.duplex?.safetyPending` is OR-ed into `cls.flags.distress`, before `planTurn`.
   - A non-predicate distress verdict is sent to `duplexRegistry.sliceFor(lesson.id)?.modelNote(...)` inside `seamSafe`.
3. In `contracts.ts`, add `TurnRequest.duplex`. It is exactly the type in `docs/research/duplex/INTEGRATION.md` §2.
   **If W2-E has already added `duplex`, skip this hunk.** Only `safetyPending` is read here.

## 03: `server/duplex/slice.js`, `server/duplex/routes.js`, new `server/duplex/registry.js`

1. `registry.js` is a new file: `export const duplexRegistry = { sliceFor: () => null }`.
2. `slice.js` gets `modelNote(kind, t)`. It calls `this.safety.modelNote`, and on a trip it also calls `spec.onSafety`
   and `builds.onSafety`.
3. `routes.js` sets `duplexRegistry.sliceFor = (id) => slices.get(id)?.slice ?? null` inside `createDuplexRoutes`.

## After applying

```
npx tsc -b
node --test tests/safety*.test.mjs
node --test tests/classify.test.mjs tests/brain-turn.test.mjs tests/brain-lanes.test.mjs tests/duplex-critic.test.mjs tests/duplex-runtime.test.mjs tests/duplex-engine-model.test.mjs tests/lesson-safety.test.mjs tests/director-module-turn.test.mjs
```

- `tests/safety*.test.mjs`: `safety-robust-seams` stops skipping. Expect 30/30.
- The suite list: expect 100/101 in the sandbox. The one skip is environmental: no stage-B ONNX model.

## Not covered by these patches

- **The duplex routes are not registered** (`server/index.js`, INTEGRATION.md S1). Until they are,
  `duplexRegistry.sliceFor` stays the null stub, and the model note has no slice to reach. Patch 02's OR on
  `safetyPending` works as soon as the device sends `TurnRequest.duplex`.
- **The device engine's `src/duplex/markers.ts unreadableTail`** only reads the last two tokens, for end-of-turn timing.
  That is unchanged here. The server-side ask-again in patch 01 is the authority.
