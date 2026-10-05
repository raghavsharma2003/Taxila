# ship5 p2-face: apply order, switches, proofs

Stream: the style-C 2D puppet as the lesson face (priority 2), lip-synced to Diya on the real TTS path.
Owner directive: `owner-ship-five-2026-10-05`. Bars: `docs/design/reset/VALUES-100.md` V4 item 2.

## What is already in the tree (no patch needed)
- `src/face-puppet/**`, `server/face-puppet/**`, `tests/p2-face-*.test.mjs`, `tests/prod/p2-face-acceptance.mjs`, `evals/p2-face/**`
  are new files of this stream. The main loop's WIP checkpoints (621c778, f3f28ae) already carry most of them.
- v4 patches **03** (the puppet is the default face: `Teacher.tsx`, `V3Root.tsx`) and **06** (the picker shows the face that
  teaches) landed as hotfix `27d51a6`. Do **not** re-apply `docs/design/values/v4/patches/03-face-default.diff` or `06-picker-face.diff`.
- v4 `04-tests` are superseded by `tests/p2-face-*.test.mjs`. Do not copy them: their calm_steady case expects the concern
  preset, which policy R6 removes.

## Patches (apply in this order; each `git apply --check` passes on 8006902 and on 179fce6)
| # | file | touches | what |
|---|---|---|---|
| 01 | `patches/01-server-visemes.diff` | NEW `server/voice/azureTtsWs.js`, `server/voice/speech.js`, `server/voice/expressive/pauses.js`, `server/routes/voice.js` | Diya over the Speech websocket with viseme events (part 0 visemes only, later parts + word boundaries), the marks cached next to the PCM, `edgeTrim` reports the trimmed lead, and the route frames `{t:"visemes", part, atSample, leadMs, v, w?}` next to the part's audio. A websocket failure (429 included) retries the same voice on REST before the breaker counts it. **ship5 change vs v4:** pooled sockets per region 3 → 12 (`TAXILA_DHD_WS_POOL`); at 3, a second speaking child on the same replica opened an unpooled socket (a fresh TLS + upgrade) for every part. |
| 02 | `patches/02-client-visemes.diff` | `src/lesson/ttsStream.ts` | The PCM player emits each viseme batch on ITS clock (the clause anchor), re-anchors with a cut on underrun / pause / resume, closes the mouth on stop. **ship5 fix vs v4:** the anchor's ctx→performance time is converted ONCE per anchor (`anchorPerfTime`, output-clock based); per-batch conversion put one part's batches 0.1-8 ms apart on the product path and the face split the part into separate tracks. |
| 03 | `patches/03-server-face-config.diff` | `server/index.js` (one-line seam) | Registers `GET /api/face/config` from `server/face-puppet/config.js` (the runtime kill switches). |

01 and 02 are one feature (server and client): apply both or neither. 03 is independent.

## Switches (all ship ON; the old path is the automatic fallback)
| switch | where | off means |
|---|---|---|
| `TAXILA_FACE_PUPPET2D=0` | Container App env (runtime, no rebuild) | `GET /api/face/config` says `puppet2d:false`; every face not yet revealed lands on TutorFace (the pre-puppet face), the same path as any pre-reveal failure. Fails OPEN if the route is missing / slow (1.5 s) / errors. |
| `TAXILA_DHD_VISEMES=0` | Container App env (runtime) | Diya goes back to REST exactly as before (no viseme frames); the puppet lip-syncs from the audio tap (the judged live path). |
| `VITE_FACE_PUPPET2D=0` | build env | the puppet is off in that build. |
| `?puppet=0` / `?puppet=1` / `?puppet=default` | per device (persisted) | the owner's test switch; a device forced ON is not overridden by the server switch. |
| `TAXILA_DHD_WS_POOL` | runtime | websocket pool size per region (default 12). |

## Tests that prove each piece
| piece | test | where it runs |
|---|---|---|
| scheduler merge fix, words-only batches, next-part opening, viseme map, Hindi rules, policy R1-R6, safety floor, driver (lip-sync, thinking glance, Listener nods, safety-neutral mouth, duplex nods, detach), duplex bridge, safety latch | `tests/p2-face-unit.test.mjs` (17) | `npm test`, now |
| player clock + anchor-once (patch 02) | `tests/p2-face-player.test.mjs` (2) | `npm test`; **skipped until 02 is applied**, must PASS after |
| kill-switch config + route, pack revision, patch 01 (`onLead`, cached marks, `TAXILA_DHD_VISEMES`, ws module), patch 03 seam | `tests/p2-face-server.test.mjs` (7) | `npm test`; 01/03 cases **skipped until applied**, must PASS after |
| client switches: device flag, server kill, fail-open, one request per page | `tests/p2-face-flag.test.mjs` (4) | `npm test`, now |
| end to end on a running server | `tests/prod/p2-face-acceptance.mjs` | `TAXILA_BASE=… node tests/prod/p2-face-acceptance.mjs` (needs 01+02+03 deployed). The safety arm runs only on a LOCAL target (it opens a real safeguarding incident; set `P2F_SAFETY=1` on a remote target only when the safeguarding team expects it) and only where Asha is offered to a class-5 child (`TAXILA_TUTOR_OFFER=wide`); elsewhere it WARNs. |

After applying: `npx tsc -b && npx vite build && npm test` (the 6 skips in `tests/p2-face-*` become passes), then the
acceptance file against a local server, then deploy, then the acceptance file against taxila.dev.

## Duplex (the hook the duplex engine drives)
No `DuplexHost` is constructed in the tree yet. Whoever constructs it wraps its emit, and detaches on teardown:
```ts
import { withPuppet, puppetDuplexDetach } from "../face-puppet/duplexBridge.ts";
const host = new DuplexHost({ ..., emit: withPuppet(emit) });
// teardown: puppetDuplexDetach();
```
Poses own the listening face and the thinking glance once the first pose arrives; content-blind nods (≤ 1 per 3 s, never
while she speaks, never in safety); `yield` closes her mouth; `safety attend` and the `safety_attend` floor phase put the
face in the neutral safety calm. Until then the mic-level Listener nods at the child's phrase-final pauses.

## Verified how
Every patch was applied to a scratch copy of only the files involved plus the client/server tree
(`/tmp/claude-0/…/scratchpad/ship5/p2-face/tree`, base = `git archive 8006902`, voice rate updated to 697e612's 0 %), then:
`tsc --noEmit` 0 errors, `vite build` OK, `tests/p2-face-*.test.mjs` 30/30 pass, the patched server run against the Neon TEST
branch, and `tests/prod/p2-face-acceptance.mjs` run against it (results in the stream report).
