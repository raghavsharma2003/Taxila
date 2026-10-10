# Stream K (Kaksha) · patch requests

Apply these in the order listed. Each one is also on `claude/r4-app-design` as its own commit, with a subject starting
`[patch-request]`. The numbers follow BUILD-SPEC §10.2.

| # | file (owner) | diff | why | proved by |
|---|---|---|---|---|
| K-P8 | `src/child/routes.tsx` (stream 5) | `08-child-routes-kaksha.diff` | Behind `ui.kaksha` (default off), the index route renders `KakshaHome`, `map` renders `KakshaWorld`, and the new `hangar` route renders `KakshaHangar`. The flag is read at render time, and the Kaksha chunks are lazy. With the flag off, every route renders exactly what it does today; `hangar` redirects to Home. | `npx tsc -b`; `npx vite build`; `npm test` (incl. `ui-v2-b2`, `child-routes` unit tests); `tests/prod/r4-kaksha-shots.mjs` 0 findings over 48 states |
| K-P7 | `scripts/lint-ui.mjs` (main) | `07-lint-ui-kaksha-allow.diff` | L-HEX allow for the Kaksha palette files (`src/ui-v3/kaksha/tokens.{css,ts}`). L-DEVA and L-HING allow for the dormant localisation columns in `src/ui-v3/kaksha/copy.ts`: `CHROME_LANG` is fixed to `"en"` (K-O1 answer), and K-EN proves nothing else is rendered. | `node scripts/lint-ui.mjs --json` gives 353 findings with the patch (the baseline) and 491 without it; `tests/ui-v2-lint` unchanged; `tests/r4-kaksha-lint` K-EN |

**Not needed in K0:** K-P1 (lit ground on `<Teacher>`), K-P2 (Desk skin), K-P3 and K-P4 (play), K-P5
(`secure_since`), K-P6 (parent cards) and K-P9 (app router).
- Kaksha draws her lit ground itself behind `<Teacher ground={false}>`.
- The world reads the existing `/api/child/map`. Until K-P5 lands, the settlement slots fall back to each skill's
  seed.
