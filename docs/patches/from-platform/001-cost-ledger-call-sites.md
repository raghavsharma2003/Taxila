# Platform → owners: cost-ledger call sites (round 7, platform-cost-ledger)

The price book (`server/cost/prices.js`), the spend events (`server/cost/meter.js`) and the lesson rollup
(`server/cost/rollup.js`, `lesson.cost` from migration 040) are on `claude/r7-platform`. Already covered without
anyone else's code:
- every chat call: `model.call` now carries `usd` (server/trace/model.js);
- every `server/azure.js tts()` call: a `speech.tts` event with `chars` and `usd`.

Each line below is one call at the place the spend happens. It never throws or awaits, and it records nothing when
tracing is off. Until these land, the ledger shows chat plus azure.js TTS only, and `scripts/cost.mjs` reports the
rest as missing rather than guessing.

| owner file | where | add |
|---|---|---|
| `server/routes/lesson.js` | `endLesson()`, after the lesson row is closed (fire-and-forget) | `rollupLesson(q, lesson.id).catch(() => {})` from `../cost/rollup.js` |
| `server/voice/speech.js` | `speakChunk()`, once its synthesis settles (Azure Speech / DragonHD path; azure.js `tts()` already records itself) | `ttsSpent({ engine: <voice or deployment>, chars: <text length sent>, ms, status })` from `../cost/meter.js` |
| `server/voice/stt.js` | the `sttSession()` socket's close | `sttSession({ model, sec: <open seconds> })` from `../cost/meter.js` (rename the import: the function shares the name) |
| `server/duplex/d5route.js` / `voicelive.js` | the relay's close | `d5Session({ sec: <session seconds>, reason })` from `../cost/meter.js` |
| `server/studio/picture.js` | after the images/generations response | `imageCall({ deployment: dep, n: 1, status: r.status })` from `../cost/meter.js` |

Events recorded outside a lesson's requests (the worker, nightly jobs) have no lesson sid. They show in
`node scripts/cost.mjs --day D` under "outside lessons", not in `lesson.cost`.
