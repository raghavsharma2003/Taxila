# tests/e2e — round 5 QA / break-it harness

Exploratory Playwright scripts against a production build. Not part of `npm test` (they need a running server, the Neon
TEST branch and the real Azure models). Defects they found: `docs/design/round5/qa/DEFECTS.md`.

## Serve
```
npx vite build
NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt PORT=8090 \
  node --env-file=.env.local --env-file=tests/prod/prod-routing.env server/serve.mjs
```
`.env.local` (gitignored): the Azure keys, `DATABASE_URL` = the Neon TEST branch, random local salts.
The scripts launch `/opt/pw-browsers/chromium` (override with `QA_CHROMIUM`); the repo's Playwright wants a newer browser
build than the container has. For `npm test`'s browser tests point `PLAYWRIGHT_BROWSERS_PATH` at a dir of symlinks
`chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell -> /opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`
and run with `--test-concurrency=4` (at full concurrency the vite dev-server fixtures time out on this box).

## Scripts (env: `QA_OUT` output dir, `QA_BASE` default http://127.0.0.1:8090, `QA_DEV=phone|laptop`)
| script | what |
|---|---|
| `qa-setup.mjs` | the real set-up journey; writes `accounts.json` + `state-<name>.json` (`QA_LABELS=p2,p3` for more phone accounts) |
| `qa-child.mjs` | Hello cards, then every child screen |
| `qa-parent.mjs` | the PIN gate (wrong, right) and every Parent-corner page |
| `qa-family.mjs` | add a child, who-is-this, switch child, sign out, wrong password, sign in |
| `qa-lesson.mjs` | a live lesson with a timeline every 300 ms and a `QA_SCRIPT` of actions (see the file head); `QA_WAV` = the fake mic; `say` presses just before the WAV's next utterance; `QA_OPEN=1` opens lessons for an hour from Controls; `QA_SLOW=1` = Slow 3G + 4x CPU; `QA_DENY=1` = mic refused |
| `qa-twotabs.mjs` | one child's lesson in two tabs |
| `qa-gate-kill.mjs` | D03 repro: corner reopened after a killed tab must show the PIN (PASS/FAIL) |
| `qa-stale.mjs` | D04 repro: a tab across a deploy must recover by itself (PASS/FAIL); needs `QA_STALE_DIST` = the served copy |

Child-voice WAVs: `node --env-file=.env.local evals/qa/make-wavs.mjs <dir>` (Azure Speech, hi-IN-AnanyaNeural).
Every page's flight-recorder events (`/api/trace/batch`) and uploaded voice clips are kept in `QA_OUT`.
