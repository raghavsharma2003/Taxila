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
| npm test | 2,591 tests: 2,584 pass, 4 fail, 3 skipped (21.7 min). Fails: migrations-applied (reads the PRODUCTION db, where 023 is not applied; TEST has 24/24) and 3 conductor-db subtests, which raced this stream's own worker on the shared TEST branch: tests/conductor-db.test.mjs alone with the worker stopped 14/14 |
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

## Local battery (final tree on the production-image copy, worker-image copy running)

| file | now | integrator 2026-10-09 | note |
|---|---|---|---|
| w2i-safety | 39/39 | n/a | pass 2 was 38/39: the global @taxila.test count rose while this stream's browser check ran (harness artifact); alone 39/39 |
| owner-1 grading | 7/7 | 7/7 | typed 0/68 wrong, module 0/42, frame 0/256 misgrades |
| owner-2 no confusion | 10/12 | 8/12 | 2 defects in 90 turns, both R7.defer ("wapas aate hain" after an honest answer) |
| owner-3 ending | 48/48 | 48/48 | |
| owner-4 steering | 17/17 | 17/17 | pass 2 was 15/17 ("example do" got the model-failure line 2 of 2 runs): fixed (requested-example parts guard) and re-run |
| owner-5 visual | 11/14 | 11/14, 9/14 | 2 Studio slots failed in forge (slot never became an artifact) |
| round3-conversation | 26/27 | 22/28 | a happy share noticed but not returned to within 8 turns |
| round3-truth | 11/11 | 11/11 | |
| round3-relational-human | 29/29 | 23/24 (prefetch off) | prefetch off here |
| round3-play | 93/93 | 93/93 | |
| round3-forge | 39/46 | 40/47 | real on stage 12/12 (11/12); game asks ending in something to do 1/6 (2/6); playable views 3/18 (6/18); nonsense boards 0/17 (0/14); request to piece p90 2,273 ms n=1 (4,145) |
| round3-duplex | 18/18 | 18/18 | |
| round3-voicesig | 39/39 | 39/39 | pass 2 was 34/35: one lesson start 500 (NeonDbError in the start transaction, class only logged); not reproduced on re-run |
| round2-truth | 26/26 | 23/25 | |
| round2-conversation | 31/31 | 31/31 | |
| w2i-release | 39/39 | n/a | |
| p5 acceptance | 42/42 | 42/42 | |
| w2a-parent-truth | 65/65 | n/a | |
| w1a-young-text | 14/14 | n/a | |
| w1b-tray | 10/10 | n/a | |
| w2flow-walk | 83/84 | 78/79 | the walker's 2 scripted wrong answers both landed on covert probes (no verdict shown by design; each got a hint) |
| desk browser (this stream) | 25/25 + 3/3 | n/a | stop check-in, switch, B5 at 360/412/1366 |

The playable-views drop (6/18 -> 3/18) is the cost of admission by skill: "simulation dikhao" in c7-science-ch01-t01 got the
drying lab before because the topic had it; the lab exercises s3 (test an idea fairly) and the lesson was on s1.
