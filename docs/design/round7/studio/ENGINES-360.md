# Studio v2 engines on phones: what the re-certification shows, and the plan (C1 Studio, 2026-11-10)

Main's order (int/r6 dbabc5e52, then main's 18:17 message) was "engine fixes at 360 px first". Before building anything,
main asked for one table: for each Studio v2 engine, the catalogue pieces that use it, whether a play family already
covers those topics at 360, and what a phone-native layout would cost. Main's starting position: on a phone, the lesson
offers the play family where one covers the skill, and a Studio v2 engine gets a portrait layout only where no play family
does. Nothing here is built beyond the two fixes under "Done".

## The finding (a measurement of its own)

**On a 360 px phone a child never plays a Studio v2 game; she gets a still board.** A 1000-unit world in the 324 px tray
gives 12 px labels and 41 px targets, below the device floor (14 px, 44 px). So the stage draws the piece's board twin for
every piece: 488 of 488 rendered pieces at p360 are twins, and 0 of the twins fail. A phone is the first device for these
families, so for most children the Studio v2 games do not exist.

At p412 the game is played with 14.3 px labels. Every class 4-5 piece fails the strict young floor of 16 px: 0 of 295
strict passes, against 153 of 193 for classes 6-7. The serving rule (r3-forge device-swap-floor) still serves them. The
before/after table per engine is in `recert-2026-11-10.md`.

## Engine against play family (topic level)

The play coverage is `data/play/coverage.json` (server/play/tools/build-coverage.mjs). It covers maths, science and EVS
topics; a topic counts as covered when it has a law family. Every item-arena topic in the catalogue also has a law family.
Coverage is per topic and not per skill, because the catalogue piece belongs to a topic.

| engine | pieces | subjects | a play family covers the topic | none | families | portrait layout (estimate) |
|---|---|---|---|---|---|---|
| scene-explainer@1 (explainer) | 382 | all six | 186 | 196 | kyun-lab, nishana, todo-jodo, … | not needed: an explainer, and its twin is the same explanation as a board |
| story-rail@1 | 87 | english 44, hindi 29, evs 8, sst 4, science 2 | 7 | **80** | vakya 6, kaal 1 | 2 days: the rail stacks vertically; long captions re-wrap |
| sort-storm@1 | 33 | science 19, evs 10, sst 3, maths 1 | 7 | **26** | kyun-lab, kon, jaanch | 1.5 days: bins at the bottom, items fall in a tall lane |
| beat-line@1 | 28 | hindi 19, english 9 | 1 | **27** | vakya 1 | 1.5 days: the beat line becomes a column; syllable chips re-wrap |
| era-drop@1 | 14 | sst 11, evs 2, science 1 | 5 | **9** | kaal 5 | 1.5 days: a vertical timeline |
| town-lab@1 | 13 | sst 10, evs 3 | 0 | **13** | — | 2-3 days: a map sim with dense labels |
| land-lab@1 | 8 | evs 4, sst 4 | 0 | **8** | — | 2 days: a map sim |
| life-lab@1 / sky-lab@1 / food-web@1 | 5 / 7 / 4 | science, evs | 1 / 3 / 0 | 4 / 4 / 4 | kyun-lab, aakash | 1-1.5 days each |
| map-route, fair-test, pictograph, mirror-paint, motion-lab, phase-shift, shadow-play, geo-forge, dukaan, rule-machine | 3-17 each | maths, science | most | 1-4 each | naksha, kyun-lab, stambh, darpan, gati, bhaap, kon, guna, kram | only if the few uncovered topics matter |
| instrument, sieve-storm, fraction-ops, catch-on-line, angle-cannon, area-claim, heat-lab, pattern-lab, vault-heist, line-runner, data-rush, zero-pair, circuit-bench, solid-view, **slice-at**, field-lab, balance-beam, ray-lab | 2-15 each | maths, science | **all** | 0 | feeta, taraazu, ghadi, kila, hissa, todo-jodo, nishana, kon, nazariya, … | none: the play family serves the phone |

In total the 382 catalogue games split into 186 topics a play family covers and 196 it does not. Of those 196, 175 are
in six engines (story-rail, beat-line, sort-storm, town-lab, era-drop, land-lab), and these are language, SST and EVS.

What breaks in a portrait layout: the core assumes a 1000 × 625 world. That covers the tokens W and H, the safe zones,
the fx clamps (including today's coach band), the HUD rail, the stage's `studioV2PlayableAt` and the twin rule, and the
matrix harness. A portrait mode in the core is about 2 days and has to come first. Each engine then re-lays its own scene;
the estimates above assume the core mode exists.

## Are the two substitutes?

**In maths and science, yes, near enough.** The play families are certified at p360, p412 and l1366. They carry mal-rules
mapped to the topic's verified misconceptions, which is the same job a Studio v2 game does there. I agree with main's
position for these 21 engines: on a phone, the play family.

**In language, SST and EVS they are not substitutes, because no play family exists there.**
- story-rail sequences a story's events and their causes.
- beat-line works on the syllable and stress of a Hindi or English line.
- town-lab and land-lab simulate a system (a town's services, how land is used).
- era-drop orders a period.

The play families are law mechanics over maths and science, plus the item arena, which has no language or SST topic in
this catalogue. For these topics, a phone child gets a still board today, and a portrait layout is the only way to give
them a game.

One consequence for the approval lane: its three pilot engines (slice-at, catch-on-line, area-claim) are all maths and
all covered by play families (todo-jodo and hissa; todo-jodo and nishana; nazariya). On a phone, a judged generated piece
is shown only as its twin, so the lane reaches phone children only as a board.

## The plan I propose

1. **Phones, maths and science:** the lesson offers the play family where one covers the topic. That is a routing change in
   the Conductor, not engine work. No portrait layout for these 21 engines.
2. **A portrait mode in the Studio v2 core** (about 2 days), then **story-rail, beat-line and sort-storm** (about 5 days).
   Together these cover 133 of the 196 uncovered topics. After that, town-lab, era-drop and land-lab (about 6 days, 30
   topics).
3. **p412, young:** make the label size a per-band token (38 units Older, 43 Young, which is 16 px at 376 px), engine by
   engine, in the same pass as each engine's portrait layout. It changes how big things are, not how they look. If the
   design session counts it as restyling, it waits for their patch.
4. **The l1366 faults** (angle-cannon, beat-line, sort-storm, heat-lab, phase-shift, solid-view): local fixes, each found
   from the matrix's Q2, Q3 and Q5 details.

## Done (2026-11-10)

- `fx.pop` keeps every pop clear of the coach band. A miss pop on an item that fell out of the bottom was drawn over the
  coach line in every engine that pops. This was the c4 pilot's "Barabar parts" over "Bar ko equal kaato".
- slice-at draws a missed bar's ghost inside the play area: its dashed magnifier was cut off by the bottom edge.

## What would change this

- If main decides the twin board at 360 is the intended phone experience for language, SST and EVS, step 2 is dropped.
- If a Games family is planned for language or SST topics, step 2 waits for it rather than doing the work twice.
- If observed class 4-5 children read 14-16 px labels without misreads, step 3 drops in priority (r3-forge device-swap-floor).
