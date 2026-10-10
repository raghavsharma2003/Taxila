# Round 3 fix stream: results (2026-10-10)

Every number here is from this sandbox: a LOCAL production build of the working tree (`node server/serve.mjs` +
`server/worker.mjs`, NODE_ENV=production, Neon TEST branch over the Neon HTTP driver, prod model routing: grok classifier
with the 1.5 s hedge, prefetch off), real Azure models, adult-scripted test children. Not taxila.dev, not a child. The battery
ran against a copy of the production image (server, shared, data, src, dist + `npm ci --omit=dev`), the worker against a copy
of the worker image (server, shared, data, db/migrations). Nothing committed, pushed, deployed or migrated.

## Blocking findings

### Adversarial (docs/design/round3/adversarial/r3-adversarial.test.mjs: 22/23, all 13 BLOCKING pass; N1 left, see below)

| # | fixed | how | test |
|---|---|---|---|
| B1a-c | yes | play admitted by SKILL: build-coverage ACTS (skills a rule's act exercises), levels.js entryFor, forge3 compose admitPlay; coverage rebuilt | adversarial B1a-c; tests/round3-fix.test.mjs |
| B2a-b | yes | play_act: while play is up, a parseVoice command goes to the game and is never graded against the folded card | adversarial B2a-b; round3-fix |
| B3 / B3b | yes | forget deletes every memory row she HELD (by id, any lesson), strips the brief, stops callbacks; parent memory card calls /api/parent/memory | adversarial B3, B3b; round3-relational-human-memory |
| B4a-b | yes | sexualAsk read first in code, any length, declined in classifyFast regardless of p5 flag; never a visual/game ask; applyNote monotone on decline | adversarial B4a x4, B4b; round3-fix |
| B5 | yes | forget after a disclosure in the lesson gets forget_after_safety + say.js guard + FALLBACK.forgetSafety; never the "I won't keep it" promise | adversarial B5 |
| N2-N8 | yes | callback screen, sad share not kept, pilot code expiry/lesson binding, "aa gaya" after "Samajh aaya?", no callback on a sad first message, "mazaak udaya" not a joke, consent copy | adversarial N2-N8 |
| N1 | no | conflicts with owner-3 goodbye-word rule and rj-fixr2-checkin-wrap-exempt; owner decision | adversarial N1 still fails (non-blocking) |

### Experience review

| # | fixed | how | evidence |
|---|---|---|---|
| B1 silence 4-11 s | NO | not fixed at the root; breakdown below; prewarm already exists | review timeline n=48-50 |
| B2 words vs screen | partly | server runs the frame's normalize() (engine-check.js), never mounts a refused config (436 -> 0 mounted); strips A/B in her facts; askTruth when nothing / only the activity is on screen; UI-word repair in code | engine scan; guard precision; round3-fix |
| B3 class 4 no game | partly | play composed first over a kept engine; class-4 fractions game playable 3/3 sizes (round3-forge); grams topic still has no play rule (said honestly) | round3-forge "game" case |
| B4 ruler for grams | yes | measureToolFor from the item's units: mass mounts nothing, litres the jug | round3-fix; engine scan |
| B5 work covered at 15 s | yes | timed help never covers a tray; Help on demand as a layer | browser: studio piece on screen 17 s in, 360 + 1366 |
| B6 false/unfair | partly | arithmeticSlip + selfPosedVerdict guards; assertion-rung numbers credited ("neither, both are 56"); interest only where the kit says the idea lives | kit scan 0/257,119 false flags; review 1/75 = the real slip |
| B7 BudgetError 500 | yes | OPTIONAL_CLAUSES + fitShape; gate still throws | 8,604 -> 0 of 278,880 compiles |
| B8 steering | (a) yes, (b) no | switch request + Start tile + next lesson; relational stop void on "<subject> padhna hai"; "half ka half" animation content not built | browser 3 viewports; round3-fix |
| B9 hands-free falls back | yes | config lookup answers retry, client retries, unknown never cached; longer timeout + prefetch | round3-fix; round3-duplex 18/18 |
| B10 check-in at 360 | yes | word tiles at label size in AnswerTray (the real one) and WorkTray, badges >= 14 px, no "chips" | browser 25/25 |

Also fixed while measuring: owner-4 "example do" shipped the model-failure line 2/2 (parts guard stripped a requested example);
findTopic substring match ("time" -> "Centimetres"); request types missing from the trace vocabulary.

## B1 where the time goes (review timeline, local, FIXED 750 ms fake ASR, n=48-50)

end of speech -> commit p50 1,037 ms; -> final p50 1,792; -> turn POST p50 1,844; turn p50 3,050 / p90 4,791; -> TTS request
p50 5,163; -> first audible word p50 6,070 / p90 7,583 ms. Bar 900 ms. Levers left: TAXILA_TURN_PREFETCH=on (integrator: turn
p50 3,614 -> 2,521 ms) and first-sentence streaming to TTS (not attempted: guards run on the whole reply).

## Gates (final tree)

| gate | result |
|---|---|
| npx tsc -b | exit 0 |
| npx vite build | exit 0 |
| npm test | 2,591 tests: 2,584 pass, 4 fail, 3 skipped. Fails: migrations-applied (reads the PRODUCTION db, 023 not applied there; TEST has 24/24) and conductor-db (3 subtests, Neon TEST races; see battery notes) |
| check-prompt-budget | PASS, worst 1,696 / 2,600 |
| persona invariants | 70/70 |
| runtime-image-imports | 1/1 |
| context --check | ok, 2,446 nodes, 2,072 edges |
| play coverage --check | ok (83 skills admitted, 1 rule not admitted) |
| lint-kits | exit 0 |
| lint-ui | FAIL, 353 findings (unchanged; owner decision) |
| adversarial suite | 22/23 (N1) |
| round3-fix unit file | tests/round3-fix.test.mjs, all pass |

## Production-image start check

Image copy, NODE_ENV=production, TEST: /?ready=1 200, /api/health?ready=1 200 (db ok), /modules.html 200, /play.html 200,
/api/duplex/config 200 shadow, POST /api/duplex/shadow 204, /api/parent/memory 401 signed out (400 on a malformed id),
POST /api/play/start 400 without a child. Worker-image copy (no src/): starts, "worker up", ticker leader.
