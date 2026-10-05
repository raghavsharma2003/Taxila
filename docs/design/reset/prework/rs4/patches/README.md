# RS-4 pre-work patches: where each applies after Wave 2 integration

The pre-work touched only `src/studio-v2/**` and `shared/studio-spec.ts`. Everything that must touch an existing or
Wave-2 file is here, in apply order. None of these is applied yet.

| # | file | applies to | owner after integration | what it does |
|---|---|---|---|---|
| 01 | `01-engine-artifact-kind.patch` | `shared/studio.ts`, `src/studio/renderers.ts`, new `src/studio-v2/react/EngineRenderer.tsx` | W2-H types/registry (one line each), RS-4 adapter | adds the `engine` artifact kind (rung 1 of `reset-studio-v2-on-w2h-host`) and registers the v2 renderer |
| 02 | `02-server-grade-v2.patch` | `server/studio/grade.js` | RS-4 | `createGradeSessionV2`: the server stores the validated spec and re-grades every raw act with `shared/studio-spec.ts gradeAnswer`; answer bound 256 KB for host-recorded input logs |
| 03 | `03-npm-test-shim.patch` | new `tests/studio-v2.test.mjs` | RS-0 / RS-4 | puts the v2 node suite into `npm test` (the commit gate) |
| 04 | `04-server-studio-spec.js.proposed` | new `server/studio/spec.js` | RS-4 | `archetypesFor(topic)` from outcome tags; `planSpec()`: one structured call → `validateSpec` (repair, else the reviewed default) |

## How to apply

1. Apply 01 and 03 on the integrated tree, then `npx tsc -b && npx vite build && npm test`.
2. Apply 02. The server imports `shared/studio-spec.ts` directly (erasable TypeScript only). Check that the production
   image's Node strips types (≥ 22.18, or pin `node:22.22-slim`); this was verified locally (v22.22.0), not in the image.
3. Drop in 04 as `server/studio/spec.js` and wire it into the router as rung 1:
   T-spec → library → T-build (≥ 90 s lead only) → board → W2-H skeleton.
4. RS-5 seams (no patch here, contracts are RS-0's seam commit):
   - `StageRequest { source: "child_request" | "beat" | "trigger" | "prefetch", want }` → `archetypesFor(topic, { want, misconceptionId })`;
   - the knobs "harder", "slower", "again" are `StudioV2PieceHandle.knob(k)`: instant, no new generation;
   - `stageFacts` = the piece's `facts()` (polled every 1 s by `StudioV2Piece`), so she refers only to what is on screen.
5. Evidence: on the server grade's first `right` per item, emit ONE kt_evidence event via 'studio' (W2-H's rule). The
   grade's `detail` may name a kit misconception (drop-zero, wrong protractor scale, mean-as-a-data-value, one-side
   balance): RS-5 can use it as a candidate signal, never as a verdict.

## What these patches do not change

- The child-safety floor: no generated piece for `c7-science-ch06` (adolescence); a test pins this.
- W2-H's gate, library, sha-checked frame and grader for code builds: v2 engines are reviewed product code, so their
  rung needs no frame gate. Their specs go through `validateSpec`, and their answers through the server re-grade.
