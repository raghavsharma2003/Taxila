# round2 latency: apply order and proof

2026-10-06 · stream latency · base **HEAD 4af5be6** (the hot files are identical to 48e3369 and to production web ee97e9c).

Every patch passes `git apply --check` on HEAD, alone and together with `docs/design/round2/truth/patches/*` in either
order (checked 2026-10-06). The three patches were applied to a scratch copy of HEAD (no worktree); the measured
"after" runs and the gates below ran on that copy.

New files, straight into the tree (outside the hot list; all under `server/` or `src/`, so the production image carries
them: `tests/runtime-image-imports.test.mjs`):

| file | what it is |
|---|---|
| `server/latency/perceive.js` | The turn's perceive stage as one function (classifyFast, classify, the UNDERSTAND note, the speculative replies) shared by the turn and the prefetch; the fingerprint; the per-process prefetch store (TTL 20 s, 30 per lesson per minute); the adopt rule. Note-parallel (rule 3) is here, **default OFF** (measured 1 used of 8 launched). |
| `server/latency/routes.js` | `POST /api/lesson/turn-prefetch`. Same gates as the turn (`loadTurnContext`: auth, guardian, core_tutoring consent), then ended / lane / rate. Fire-and-forget: 202 or 204, never an error. Warms the Diya socket. Optional SHADOW ack decision (`wantAck`). |
| `server/latency/ack.js` | SHADOW acknowledgement decision (the child's own answer token, after the model distress read, graded answers only, never on safety / goodbye / two turns running). Nothing is played. |
| `src/latency/prefetch.ts` | `TurnPrefetcher`: the device rule (energy-VAD quiet + deltas still for 250 ms, at most 3 sends per item, never the same text twice, barge-in bit). |
| `tests/latency-prefetch.test.mjs` | 20 unit tests: perceive mirrors the turn, the note gates, note-parallel (off by default), the fingerprint, adopt only on identical inputs and identical classifyFast, TTL, rate, the device rule, the ack's safety rules. |
| `tests/prod/round2-latency.mjs` | Acceptance, local or taxila.dev: route gates (202 / 204 empty / ended / lane / consent), adopt only identical words (local), a disclosure through the prefetch still gets the safeguard move with 1098 + 14416 digit-exact, turn → first audio per arm. |
| `evals/latency/turn-e2e.mjs`, `evals/latency/tts-region.mjs` | The measuring harnesses (speech end → first audio per stage; Diya first byte per speech region). |

## Order

| # | patch | file | what it changes | proven by |
|---|---|---|---|---|
| 01 | `01-brain-perceive-prefetch-adopt.diff` | `server/brain/turn.js` | The turn's perceive lines become `perceive()`; before running it, the turn tries `adoptPrefetch` (only a plain spoken text-lane turn: no chip, no module events, no help, not late, not edited, not a lane resume). Debug: `debug.prefetch {adopted, aheadMs \| miss}`, `debug.note {nonAnswer, intent, waitedMs, parallel}`, reason `turn.prefetch_adopted`. Without a prefetch the turn does exactly what HEAD does (same calls, same order, same clock). | unit suite above; full `npm test` on the patched copy (all non-browser tests green, see below); acceptance "identical words: adopted", "other words: not adopted", the disclosure check |
| 02 | `02-index-register-turn-prefetch.diff` | `server/index.js` | Registers the route (one import, one spread). | acceptance gates 202 / 204 |
| 03 | `03-cascade-link-send-prefetch.diff` | `src/lesson/cascadeLink.ts` | The link feeds partials / speech start / final / local VAD edges / barge-in to `TurnPrefetcher`. Hands-free only for the VAD edge; it never changes what the turn sends. | `TurnPrefetcher` suite; `npx tsc -b` and `npx vite build` on the patched copy |

01 needs `server/latency/perceive.js`; 02 needs `server/latency/routes.js` (+ `ack.js`); 03 needs `src/latency/prefetch.ts`.
Apply 01 and 02 together (02 alone adds a route whose work no turn adopts: pure cost).

## Switches

| switch | default | effect |
|---|---|---|
| `TAXILA_TURN_PREFETCH=off` (server) | on | the route answers 204 `off`; turns run exactly as HEAD |
| `?prefetch=0` / `localStorage tx.flag.latency.prefetch=0` / `VITE_TURN_PREFETCH=0` (client) | on | the device sends nothing |
| `TAXILA_NOTE_PARALLEL=on` (server) | off | rule 3: write the no-note reply while a non-answer's note is out |
| `TAXILA_SPECULATE` | 3 (unchanged) | the speculative fan-out, now also started by the prefetch |

## Ops change (no code)

Speech region = app region: `node scripts/deploy-azure.mjs --set AZURE_SPEECH_REGION=eastus2 --secret
AZURE_SPEECH_KEY=AZURE_OPENAI_API_KEY` while the app is in eastus2 (the India resource once the app moves). Measured
Diya first byte from the sandbox: India resource 431 / 467 ms vs eastus2 230 / 496 ms p50/p90, n=12 warm each
(`evals/latency/results/2026-10-06-tts-region-sandbox.json`). Before doing it: one `tts-region.mjs` run FROM the
eastus2 container (the sandbox is not the app's network).

## Scaling caveat

The prefetch store is per process, like the TTS prewarm. Production runs one replica (`w1d-web-single-replica`); with more
replicas and no session affinity, a prefetch and its turn on different replicas is a miss (`debug.prefetch.miss: "none"`),
never an error.

## Gates on the patched copy (2026-10-06)

- `node --test tests/latency-prefetch.test.mjs`: 20/20 (also green in the main tree, where the new files already are).
- `npx tsc -b`: exit 0. `npx vite build`: exit 0.
- Full `node --test tests/` on the patched copy: 2080 tests, 2010 pass. **One real failure found and fixed:**
  `tests/w2d-voice-lanes.test.mjs` asserts `server/index.js` contains `...lane }`; patch 02 originally appended
  `...latency` after `...lane`. Patch 02 now inserts it before (`..., ...face, ...latency, ...lane })`); that file and the
  latency suite then passed on the patched copy (53/53). The rest are artefacts of the scratch copy, each re-checked:
  the Playwright/vite browser tests (engines-browser 60, module-tray-geometry, w2b-whiteboard-browser) time out because
  the copy's `node_modules` / `public` are symlinks outside vite's root; they pass 60/60 and 7/7 in the main tree, and the
  only `src/` file the patches change is `cascadeLink.ts`. `eyes.test.mjs` "dirty run" needs `.git` (the copy has none).
  `voice-player-clock.test.mjs` is a timing test that missed under load; 2/2 in the main tree.
- Acceptance `tests/prod/round2-latency.mjs`: local 12/12; taxila.dev 1/3 (route not deployed, as expected).
  Outputs: `evals/latency/results/2026-10-06-acceptance-*.txt`.
