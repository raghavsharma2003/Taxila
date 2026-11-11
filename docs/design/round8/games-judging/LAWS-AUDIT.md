# The three laws over every play family: audit of 2026-11-11

**From:** Games (C2), branch `claude/r8-laws-tally`. **For:** main. **Decision:** `dc-r8-game-modes-three-laws` (RULINGS-2026-11-11.md).

## What is now checked, and where

The checks are in `server/forge3/qa/laws.mjs`. They draw each family's real 2D view headless: a recording canvas, plus the painter's audit, which now records every colour role painted (`Audit.uses`). The level is driven through the law's own acts. Every level runs through these states:

- the first screen;
- the screen after each mal-rule's acts, at the first miss while a try remains (five frames over 6 s, so play-outs that run on the clock are seen);
- the solved screen.

The play cert (`server/forge3/play-cert.js`) runs them once per level it judges. A break fails that cell at every size, with `laws:L<n>:<state>`.

`tests/r8-play-laws.test.mjs` runs them over every (family, mode, goal) the coverage serves: 2 seeds, plus the level served when the Director's focus is on each mapped misconception. The suite fails on any break that is not in its `KNOWN` list. Every entry in `KNOWN` is listed below. A further run at 3 seeds and 3 goals per mode checked 930 levels and 2,958 screens.

| Law | What the cert asserts | What it cannot see (judges and family tests) |
|---|---|---|
| 1. Green means right, and only right | Nothing green on the first screen. After a miss with a try left, green is never the colour of a text, chip, circle, stroke, body or colour fill, except the reviewed part-right uses in `ALLOWED`. A miss screen with right-marks (ticks, good bodies) and no look mark at all fails. **In the painter:** a selected body and every canvas `you` are drawn in the new `focus` token (blue-violet, hue 230 to 280 in all four directions). Lime belongs to the DOM action button only. | Whether a green part really is right. The reviewed uses are listed in `ALLOWED` with the reason. Whether her wrong value is in the mix-up colour (it is now focus, never green). |
| 2. No key on screen after a miss while a try remains | No text drawn after the miss holds a value the family keeps hidden (`hiddenOf`, the values a line may not say first). Three exceptions: the value was on screen before she acted, it is her own act's value, or it is drawn green as a part she already got right. | Marks a key can be counted off (ticks plus a triangle, hops), lines to trace, readings that settle the next pick. These are read below per family. |
| 3. A mix-up is named only by an act a guess rarely produces | **In the grade** (`src/play/core/replay.ts`): on a goal in `oneDecision` or `chancePicks`, which takes a goal or a `goal:mal`, a mal-rule signature is `incorrect` at `CHANCE_WEIGHT` with `chanceMis`, never `misconceptionId`. **On the server** (`server/play/levels.js`): `nameOnRepeat` names it only when the session saw the same mix-up from a pick on a level whose surface differs (`surfaceOf`: the family's own, else the level's params). `afterLevelBody` remembers it and aims the next level at it. The seam row says `pick=1` and names no misconception. **In the cert:** every mal-rule whose signature comes from one act differing from the solver's, chosen among ≤ 5 options on screen, must not be named. | Options counted from the screen (enabled controls and pickable targets) at the decisive act. A typed, dialled or dragged value, or two or more of her own acts, counts as constructed. |

## Fixed in this branch (other than kon)

| Where | Law | The break (concrete screen or state) | Fix |
|---|---|---|---|
| Painter, every family that selects (45 views draw `selected` or a canvas `you`) | 1 | The selected row, card or box was outlined in lime (`you` #5B7A00 / #CBFF4D), which judges read as green. The tally judges saw it on the wrong Kaanch row. The kon judges saw a wrong find tap "turn green". | New `ArtTokens.focus` (kagaz #3B47B0, chalk #A9B4FF, blueprint #E2B0FF, raat #C8A6FF). `body(state: "selected")` and `roleColor("you")` paint focus. The DOM action button keeps lime. |
| `taraazu/equation`, `taraazu/equality` | 1 | On the first screen the given balance's needle and the "level" readout were green, though she had done nothing. | Green only once she has acted; ink before. |
| `kyun-lab/fair-test` predict | 1 | On the first screen the meter chip "1 cheez alag" was green, but in predict the set-up is given. | Neutral in predict; still green when she builds the fair test herself. |
| `gati/raftaar` aage | 1, 2 | After the run, with a try left, the faster mover's bar turned green and a magnifier pointed at it: the key, marked. | Green only once she has solved it; no magnifier while a try remains. |
| `gati/drishti` (bus story) | 1 | The roadside tree was drawn in the "good" green. | Leaf material (scenery). |
| `feeta/thermo` fever | 1 | The healthy band (36.8 to 37.2) was painted good-green after the run. | Neutral band colour. Its law-2 question is listed below. |
| `galti-pakdo/kaapi` | 1 | The friend's step note on the line she wrongly flagged was green. | Mix-up colour (look). |
| Law 3: 15 logics, 47 (goal, mix-up) pairs and the whole fair-test predict goal, named from one pick among 2 to 5 | 3 | Examples. `aakash` din: one tap of the "sun" tool named sun-goes (2 options). `todo-jodo/strips` compare: "choose bar 1" among 5 named bigger-denominator. `kyun-lab/fair-test` predict: one of 3 predictions named heavy-sinks (and 5 more). `chhaano` namak: "done" first named clear-pure (4 options). `bhaap`, `badlaav`, `rang`, `jaanch`, `gati`, `feeta/thermo`, `feeta/touch`, `naksha/route`, `parkar` (ssa, alt median), `kyun-lab/dhruv` taakat, `nazariya/array` turn, `todo-jodo/atoms` two-trees. | Each logic declares `chancePicks` (its line names the pairs). Their grade is now at chance weight and unnamed until a repeat. `oneDecision` goals (`galti-pakdo` pakdo, `hissa` shift, `nazariya` more, kon's six) are covered centrally with no family change. |

Family tests that asserted `misconceptionId` from those picks now accept `chanceMis` (18 test files). `r7-games-chance-weight` asserts a one-pick miss is unnamed at chance weight.

## Still breaking: listed for main (larger than a token or a hidden mark)

| Family / mode | Law | Concrete screen | Why it is not a mechanical fix |
|---|---|---|---|
| `aakash` chakkar, grahan, ritu | 2 | After a miss the line states the idea: "Sooraj wahin rehta hai. Prithvi ghoomti hai." (din, after the sun tool). Also "ek chakkar" (saal), "upar/neeche" (kab), "seedhi" (dhoop). | The why lines are authored content (`data/play/engine-words.json`). They need rewriting as what her act did, not what is true. |
| `badlaav/aag` jang | 2 | "... paani chahiye" after just-dirt. | Same: authored why line. |
| `bhaap/hawa` kamra | 2 | "Thandi hawa neeche farsh par hi rehti hai: upar kamra garam rehta hai." | Same. |
| `chhaano/sukha` farak, kram | 2 | "Bori mein Bhoosa aa gaya! Bajra paas hi gira": the line names where the grain falls (the key spot). | Same. |
| `jaanch/neela` iodine | 2 | "Bhoora hi raha: iodine starch dikhata hai, cheeni nahi." | Same. |
| `rang` milao, pehchaan | 2 | "Ab hara: zyada base se yeh basic ho gaya." / desi "hara". | Same. |
| `yantra/roshni` dhak, parda | 2 | "Abhi bhi roshni: Chaand ki apni roshni nahi hoti", "saaf nahi". | Same. |
| `aankde/tally` sort | 2, and "never does the skill" | After a miss the run prints each row's count ("1", "8", "11"), the totals of the next try. The child tallies and the game counts for her. | Needs a decision: is counting the tally part of the skill (then she types the totals, as in stambh/tally), or only bundling? |
| `galti-pakdo/kaapi` | 2 | After a check-later miss a "line 2" label shows, and it may be the first wrong line (hidden). | Read the check play-out with the family's owner; it may only mark her own check. |
| `koshtak/tray` open | 2 | After a miss the given route's end value "34" is printed: the place her opened row must reach. | It is the given path's play-out. Decide whether the target value may show while a try remains. |
| `kram/grow` far | 2 | After a "double" miss a "28" (the far-stage count) shows on one level. | To check whether it is her bag or the machine's stage 7. |
| `feeta/thermo` fever | 2 (question) | After the run the healthy band (now neutral) is on every thermometer. It may settle which child has fever. | A design question: it is the kit's reference, shown only after her run. |
| `kaal/order` | 2 (reading) | After a miss a chip "3601 saal door" gives the distance to the right year, so her mark ± 3601 is the key. | Not seen by the text check (the number is not the key itself). It is a reading that settles the next pick. |
| 3D engines (`yantra` kit and scene palette, `khand` scene) | 1 | The selected mirror's turn ring and the khand selection use `art.you` lime. | Outside the 2D painter. The engine palettes need the focus hex. |

After the fixes, 91 of the 107 modes the coverage serves show no break; 16 still do (the rows above and two kon modes).

## kon (the kon stream fixes these; not edited here)

| Mode | Law | Result |
|---|---|---|
| `kon/name` find | 1, 3 | **Fixed centrally.** The wrong tap's lime arc and label are now focus, not green. `vertex-name` from one tap is now `chanceMis` at chance weight (find is in `oneDecision`), named only on a repeat on another surface. **Still open:** her wrong pick should take the mix-up colour (look), not focus (ruling kon/name 1); the contradiction play-out and the pale tick (rulings 3, 4). |
| `kon/ends` | 1, 3 | A green circle after a miss (ray-order). `ray-two-ends` is named from one stop among 4 (hi or lo, 3 positions). |
| `kon/place` draw | 3 | `join-wrong-end` is named from one of 3 ends (ruling kon/place 4: at chance weight). |
| `kon/place` measure | 2, never does the skill | Not seen by the text check. The tap prints the reading (ruling kon/place 1). |
| `kon/turn`, `kon/cross`, `kon/zone` | 3 | Fixed centrally (`oneDecision`): cw-confuse, half-is-quarter, alternate-position, interior-equal and tilted-not-right are no longer named from one dial or pick. |
| `kon/close`, `kon/lines`, `kon/pair` | - | No break seen. |

**Update (kon stream, branch `claude/r8-kon-round2`):** every kon row above is now closed and `tests/r8-play-laws.test.mjs` lists no kon break. `kon/name` find: her wrong arc is the mix-up colour, the miss shows "asked ≠ her arc's two names", a later solve has a pale tick and the checks. `kon/ends`: the open-end light is green only on a solved figure, the asked figure is no longer drawn dashed after a miss (it was the key: law 2, not seen by the text check), and `ray-two-ends` is a chance pick (`chancePicks` "ends:ray-two-ends"). `kon/place` draw: `join-wrong-end` is a chance pick ("draw:join-wrong-end"). `kon/place` measure: she types the reading.

## Reviewed and allowed (`ALLOWED` in laws.mjs)

Each item is green on a part she got right, drawn beside her wrong parts in the mix-up colour.

- `darpan/mirror`: lines that fold true.
- `darpan/turn`: turns that map the shape onto itself.
- `galti-pakdo/kaapi`: the balance needle on a line that balances.
- `kaal/order`: landed stones' years. The next stone's year in its own task line is a given of that step.
- `kram/machine`: outputs that match.
- `nishana/compare` and `nishana/place`: flags on their marks.
- `paheli/cipher` and `paheli/magic`: columns and lines that are right.
- `yantra/roshni`: judged-right frames, with a tick.
- `todo-jodo/atoms`: an atom she split out herself.
- `stambh/tally`: the 5 over each bundle (ruling 3).

## Per family (3 seeds, 3 goals per mode; L = law broken now, A = allowed, F = fixed here)

| Family | Modes: result |
|---|---|
| aakash | chakkar L2, grahan L2, ritu L2; F3 (7 picks) |
| aankde | line -, stack -, tally L2 |
| arena | pick - |
| badlaav | aag L2, palat -; F3 (3 picks) |
| bhaap | avastha -, bhaapan -, chakra -, hawa L2; F3 (5 picks) |
| chhaano | geela -, sukha L2; F3 (7 picks) |
| darpan | mirror A1, tile -, turn A1 |
| feeta | compare -, fence -, measure -, scale -, thermo F1 (L2 question), thread -, touch -, trip -; F3 (3 picks) |
| galti-pakdo | kaapi L2, A1, F1; pakdo F3 (central) |
| gati | drishti F1, nishaan -, raftaar F1/F2; F3 (5 picks) |
| ghadi | calendar -, race -, run -, set - |
| guna | field -, pack -, story -, yard - |
| hissa | fold -, grid F3 (shift, central), pour -, story - |
| jaanch | daag -, neela L2, thali -; F3 (2 picks) |
| kaal | order A1/A2 (and the "saal door" reading, listed), place - |
| kila | divisibility -, factors -, lcm -, multiples - |
| kon | see above |
| koshtak | bin -, tray L2 |
| kram | beats -, grow L2, machine A1, nest - |
| kyun-lab | dhruv F3, disha -, fair-test F1, F3 |
| naksha | locate -, route F3, scale -, shape - |
| nazariya | array F3, floor -, mirror -, powers -, solid -, tri F3 (more, central), views - |
| nishana | compare A1, hop -, place A1 |
| paheli | cipher A1, magic A1, mirror -, pairs - |
| parkar | bisect -, build F3 (ssa), drop F3 (alt) |
| rang | milao L2, pehchaan L2; F3 (3 picks) |
| stambh | bars -, picto -, tally A2 (ruling), with the round-2 fixes in the next commit |
| taraazu | equality F1, equation F1, fill -, weigh - |
| todo-jodo | atoms A2, F3, bundles -, strips F3 (5 picks) |
| vakya | rail - |
| yantra | beam -, circuit -, pendulum -, roshni L2, A1 |
