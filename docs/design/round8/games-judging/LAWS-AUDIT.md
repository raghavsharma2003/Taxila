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
| 1. Green means right, and only right | Nothing green on the first screen. After a miss with a try left, green is never the colour of a text, chip, circle, stroke, body or colour fill, except the reviewed part-right uses in `ALLOWED`. A miss screen with right-marks (ticks, good bodies) and no look mark at all fails. **In the painter:** a selected body and every pick are drawn in the `focus` token (blue-violet in all four directions); "you" is not a painter role, and a canvas use of it fails (patch 002). The action hue (marigold on kagaz, magenta on the dark arts, never green) belongs to the DOM action button only. | Whether a green part really is right. The reviewed uses are listed in `ALLOWED` with the reason. Whether her wrong value is in the mix-up colour (it is now focus, never green). |
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

None. (The 3D engines' row is resolved below, with Design's patch 002.)

### Resolved under the rulings of 2026-11-15 (`RULINGS-2026-11-15.md`)

| Family / mode | What changed | Held by |
|---|---|---|
| 3D engines (`yantra` kit and scene palette, `khand` scene; also `antariksh`) | The selection takes the focus colour, as in the 2D painter, read through `lawColor` (`src/play/core/styles.ts`, the same `LAW_ROLES` map): yantra's turn ring, the selected mirror's frame glow, the circuit's post rings and the wire being drawn, and her value's label (each theme names the art whose focus stands off its floor and its label pill: lab kagaz, rooftop kagaz / raat labels, bench blueprint); khand's cursor, drag box and landing flash (the paper art's focus, which stands off the daylit world); antariksh's reticle, bolt and probe marks (raat's focus). The 3D label role is `focus`, no longer `you`. In the same commit, Design's patch 002: the action hue is outside green in both looks (kagaz marigold #EFA52E; chalk, blueprint and raat magenta #FF6FD8), "you" is not a painter role (no figure in it), and kagaz and raat hold Design's focus, answer and mix-up. Shots: `focus-action/`. | `laws.mjs` (a canvas "you" in any state fails law 1; `tokenBreaks`: Design's values on kagaz and raat, the action outside green) over every served level in `tests/r8-play-laws.test.mjs`; `tests/r8-play-roles.test.mjs` (the engines' palettes equal the focus token; play.css equals ART; Design's values; deuteranopia ≥ 0.15) |
| `kaal/order` (and place, century) | No distance, no stone floated to its true place, no true year or band while a try remains. After her first miss on a stone: a direction only ("Isse pehle" / "Isse baad mein"); from the second: her mark alone. | `tests/r8-games-kaal-miss.test.mjs`, every served kaal level |
| `galti-pakdo/kaapi` | The "line N" tag stays: it names the line she herself checked (state.on is set only by her check, or 0 after a fix). | `ALLOWED` in `laws.mjs`; generator assertion in `tests/r7-games-galti-pakdo.test.mjs` |
| `koshtak/tray` open | The two routes are seen to end apart with no number at either end; the end value is printed when solved. | `laws.mjs` law 2 over every served level (row left `KNOWN`) |
| `kram/grow` far | The "28" was the bag's remainder (her count less the far stage's), so after "double" it was the key. The bag now shows her own count before and after the run. | `laws.mjs` law 2 over every served level (row left `KNOWN`) |
| `feeta/thermo` fever | The healthy band is drawn on the solved screen only; the task line gives the normal range as numbers (36.8 to 37.2 °C). | `tests/r8-games-naap-fever-band.test.mjs`, every served fever level |
| `aankde/tally` sort | Counting the tally is the skill: she types each row's total into its cell with stambh/tally's typed total (`src/play/core/typedtotal.ts`, now shared: the cell and its pad), and "Gino" waits until every total is typed. Solved only when the tally is right AND every typed total is the row's count; a wrong total is a miss. A run prints no count while a try remains: each cell gets a tick (row right) or the dashed box (her number not the row's), the total row stays "of N". The counts and the survey's total appear on the solved screen. The law's solver and mal-rules type the totals (tally-five: the strokes counted one by one; total-mismatch: her rows as they read). | `tests/r8-games-aankde-typed.test.mjs`, every served sort level; `laws.mjs` law 2 over every served level (row left `KNOWN`) |

**The seven science families' why lines** (ruling row 1). Each miss line is cut to what her act did on the screen; the clause that stated the idea is now the solved line's, said whether or not she missed first. Lines are shown in hinglish; `en` and `hi` say the same (`data/play/engine-words.json`). Held by `laws.mjs` `IDEA_WORDS` (per family/mode and goal, the words of the idea its solved line states, in all three languages): any text drawn after a miss while a try remains, not on the first screen, holding one fails law 2, over every served level (`tests/r8-play-laws.test.mjs` in hinglish, rows left `KNOWN`; `tests/r8-laws-idea-words.test.mjs` in en and hi, the old lines as fixtures, every miss line of these goals in all three languages, and each solved line stating its idea).

| Family / mode (goal) | Old miss line → new miss line | Solved line (states the idea) |
|---|---|---|
| `aakash/chakkar` (din) | "Sooraj wahin rehta hai. Prithvi ghoomti hai." → "Sooraj hila nahi." | "Sooraj wahin raha; Prithvi ne har jagah ko roshni mein ghumaya." (unchanged) |
| `aakash/chakkar` (saal) | "Yeh ek chakkar apne upar tha: ek din. Jagah wahi hai." → "Prithvi apne upar ghoomi, par raaste par wahin rahi."; "Sooraj ka chakkar saal ki chaal hai, din ki nahi." → "Prithvi aage nahi chali: card par ek din hai."; "Abhi saal nahi: Sooraj ka poora chakkar nahi hua." → "Prithvi abhi wahan nahi lauti jahan se chali thi."; "Wahin wapas aa gayi: poora ek chakkar." → "Prithvi wahin laut aayi jahan se chali thi." | "Ek chakkar: din, lagbhag 24 ghante. Sooraj ka: lagbhag 365¼ din." (unchanged) |
| `aakash/ritu` (jhuk) | "Dhuri poore raaste ek hi taraf rehti hai." → "Kuch nahi badla: Prithvi jaisi thi, waisi rahi."; "Sooraj ke sabse paas, par uttar mein dhoop tirchhi: sardi." → "Yahan uttar mein sardi hai." | "Dhuri kabhi nahi ghoomi: Sooraj ki taraf jhuka hissa garmi." (unchanged) |
| `aakash/ritu` (dhoop) | "Wahi roshni zyada khaanon par faili: barf rahi." → "Barf nahi pighli."; "Roshni thodi faili: barf thodi hi pighli." → "Barf thodi hi pighli." The patch labels ("Seedhi: chhota, tez", "Tirchhi: faili hui") are drawn on the solved screen only (jhuk too); while a try remains the lit squares show it. | "Seedhi dhoop, chhota tez dhabba, barf pighli: garmi." (unchanged) |
| `aakash/grahan` (chaaya, kab) | "Is mahine Chaand line ke upar se guzra: grahan nahi." → "Is mahine grahan nahi hua." (and the side strip's "line ke upar / neeche" label is gone: the Moon drawn off the line shows it); "Prithvi ki chhaaya door hai: roshan hissa thoda dikhta hai." → "Chaand ka roshan hissa waisa hi raha."; en "Not lined up for that eclipse here." → "That eclipse does not happen here." | "Sooraj, Chaand aur Prithvi ek seedhi line mein: grahan." / "Teenon ek line mein hon tabhi: zyadatar mahine bina grahan." (unchanged) |
| `badlaav/aag` (trikon) | "Dhakkan hawa rokta hai: pankha hawa bhejta hai, garmi nahi." → "Pankha jhala, par aag waisi hi rahi." | "Indhan, oxygen, garmi: ek hatao to aag bujhti hai." (unchanged) |
| `badlaav/aag` (raakh) | "Nasht nahi hua: zyada hissa gas ban kar hawa mein gaya." → "Indhan kam ho gaya. Woh kahan gaya? Aag ko dhyaan se dekho." | "Kuch nasht nahi hua: hawa mein gaya, ya peeche bacha." (unchanged) |
| `badlaav/aag` (jang) | "Mitti nahi: jang nayi cheez hai. Ise oxygen aur paani chahiye." → "Ponchha, par jang nahi utri." | "Jang ko paani aur hawa chahiye: dheere, bina lau." → "Jang nayi cheez: ise paani aur hawa chahiye, dheere, bina lau." |
| `bhaap/hawa` (kamra) | "Thandi hawa neeche farsh par hi rehti hai: upar kamra garam rehta hai." → "Kamra garam hi raha." | "Garam hawa upar uthi, thandi neeche baithi, aur poora kamra badal gaya." (unchanged) |
| `bhaap/hawa` (naav) | "Hawa samundar se zameen ki taraf chal rahi hai: naav kinaare par hi rehti hai." → "Naav kinaare par hi rahi."; "Hawa naav ko samundar ki taraf dhakelti hai, aur naav pehle se wahin hai." → "Naav pehle se samundar mein hai." | "Hawa naav ko wahin le gayi jahan jaana tha." → "Din: samundar se zameen ki hawa. Raat: zameen se samundar ki." |
| `chhaano/sukha` (farak, kram) | "Bori mein {light} aa gaya! {heavy} paas hi gira" → "Bori mein {light} aa gaya!" (the key spot dropped; the play-out shows where the grain fell); "{parts} sab chalni par ruk gaye: ek hi size ke hain" → "{parts} sab chalni par ruk gaye" (and "... neeche gir gaye"); "{parts}: itne chhote tukde haath se nahi chune jaate" → "{parts}: haath se nahi chune gaye" | "Har cheez apni dheri mein!" → "Sab alag: har tareeke ne ek farak dekha, bhaar, size ya rang." |
| `jaanch/neela` (iodine) | "Bhoora hi raha: iodine starch dikhata hai, cheeni nahi." → "Bhoora hi raha." The carbohydrate tree (iodine pointing only at starch) is no longer drawn after the miss. | "Neela-kaala ne starch dikhaya; cheeni ka ghol bhoora raha." → "Neela-kaala ne starch dikhaya. Iodine cheeni nahi dikhata." |
| `rang/pehchaan` (litmus) | "Laal litmus pehle se laal tha. Neela bhi neela raha." (kept: what her drop did) | "Sab litmus ke rangon se alag ho gaye." → "Acid neele litmus ko laal karta hai, base laal ko neela." |
| `rang/pehchaan` (desi) | "{liquid} se gudhal bhi hara: woh pehle se basic tha." → "{liquid} acidic mein nahi gaya. Gudhal par bhi dekho." (the key colour dropped) | "Sab haldi aur gudhal ke rangon se alag ho gaye." → "Base par haldi laal, gudhal hara: rang batata hai, badalta nahi." |
| `rang/milao` (boond, ilaaj) | "Ab hara: zyada base se yeh basic ho gaya." → "Gulaabi gaya, par rang wahin nahi ruka."; "Paani sirf patla karta hai: gulaabi hai, acidic hai." → "Paani daala: abhi bhi gulaabi."; "Abhi bhi gulaabi: abhi bhi acidic. Rang dekho." → "Abhi bhi gulaabi. Rang dekho."; "Gulaabi nahi, hara bhi nahi: abhi neutral hai." → "Gulaabi chala gaya. Card dekho." (green was the next try's answer); "Isse namak aur paani bante hain; garmi nikalti hai." → "Label dekho: kya bana?" | boond: "Acid aur base ne ek doosre ka asar khatam kiya." → "Base ne acid khatam kiya. Zyada base: basic. Paani: bas patla."; ilaaj: "Har base ne apna acid khatam kiya: neutralisation." (unchanged) |
| `yantra/roshni` (parda) | "Dikha, par saaf nahi: {mat} thodi hi roshni jaane deta" (and too_clear, some_light, no_light) → "{mat}: aankh ne jo dekha, card se nahi mila" (the eye's view shows how) | "Aankh har roshni ko waise hi dekhti hai jaise card mein" → "Sab roshni jaaye: saaf. Thodi: dhundhla. Kuch nahi: andhera." |
| `yantra/roshni` (roshan) | "Chaand andhera hi raha: us par dhoop nahi padi" → "Chaand andhera hi raha"; "Koi roshni nahi: aankh kitna bhi dekhe, kuch nahi dikhta" → "Aankh ko kuch nahi dikha"; "{thing} par roshni nahi padi: aankh use nahi dekh paati" → "{thing} nahi dikha"; "Nahi dikha: {mat} roshni nahi jaane deta" → "Nahi dikha: beech mein {mat} hai"; "{mat} se thodi roshni ab bhi aati hai: aankh dekh leti" → "Aankh ko {mat} ke paar roshni dikhi"; "{thing} par roshni padi, to dikha: card mein nahi hai" → "{thing} dikha: card mein nahi hai" | "Aankh ko theek wahi dikhta hai jo card mein hai" → "Jis par roshni pade, wahi dikhe: Chaand bhi Sooraj ki roshni se." |
| `yantra/roshni` (dhak) | "Abhi bhi roshni: Chaand ki apni roshni nahi hoti" / "... steel ki plate apni roshni nahi deti" / "... {thing} apni roshni deta hai" → "Abhi bhi roshni" | "Andhera: koi roshni nahi deta, aankh ko kuch nahi dikhta" → "Andhera: apni roshni wale sab dhake; Chaand ki apni roshni nahi." |

**Resolved (late-evening ruling 2, 2026-11-15): the en-only breaks.** `tests/r8-play-laws.test.mjs` now runs the law checks in hinglish, `en` and `hi` (the same seeds and levels in each, `KNOWN` empty in each). The `en` run showed three science modes holding a hidden value after a miss; each line now says what her act did, without the key's word, the same in all three languages (`data/play/engine-words.json`):

| Family / mode (goal), mal | Old miss line → new miss line (hinglish / en / hi) |
|---|---|
| `badlaav/palat` (ghol), gone: `badlaav.why.still_there` | "Wahin hai: taraazu utna hi dikhata hai jitna pehle." → "Tumne Gayab kaha: taraazu phir dekho, hilaane se pehle aur baad." / "Still there: the scale reads the same as before stirring." → "You said Gone: read the scale again, before and after stirring." / "वहीं है: तराज़ू उतना ही दिखाता है जितना पहले।" → "तुमने ग़ायब कहा: तराज़ू फिर देखो, हिलाने से पहले और बाद।" |
| `jaanch/daag` (kaagaz), wet-fat: `jaanch.why.wet_patch` | "Abhi geela hai: Ruko, dekho daag rehta hai ya nahi." → "Tumne geele mein hi bata diya: Ruko dabao, phir dekho." / "Still wet: Wait, and see if the patch stays." → "You said it while it was still wet: tap Wait, then look again." / "अभी गीला है: रुको, देखो दाग़ रहता है या नहीं।" → "तुमने गीले में ही बता दिया: रुको दबाओ, फिर देखो।" |
| `jaanch/thali` (dono), one-only: `jaanch.why.test_other` | "Ek khaane mein kai cheezein ho sakti hain: doosri bhi jaancho." → "Tumne is khaane ki ek hi jaanch ki: doosri jaanch bhi karo." / "One food can hold more than one: run the other test too." → "You ran one test on this food: run the other test too." / "एक खाने में कई चीज़ें हो सकती हैं: दूसरी जाँच भी करो।" → "तुमने इस खाने की एक ही जाँच की: दूसरी जाँच भी करो।" |

The `hi` run found no break, but the word keys of these families (`HIDDEN` in badlaav, jaanch, rang, aakash, yantra/roshni) are listed in hinglish and English only, so its law-2 key check sees numbers and `IDEA_WORDS` there, not those word keys; the three lines above were changed in `hi` to match. No checker change.

With these, `KNOWN` in `tests/r8-play-laws.test.mjs` is empty in every language: no served level of any family breaks a law in the hinglish, en or hi run.

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

## Law 4: after a miss, the check waits until her act changes (2026-11-16, `dc-r8-gate2-shadow` S4)

**The check (`checkWaits` in laws.mjs).** The check is the act that missed. Its control, where a control made it, is the one whose press dispatches that act. After the miss, while a try remains, the law presses it again on the same answer. It passes when:

- the control is disabled or gone; or
- the law refuses the press without playing the miss again and without raising a facts count of checks or tries.

It runs over every served level, in all three languages, through every mal-rule's acts, as laws 1 to 3 do.

**The fix (`missWait` in `src/play/core/viewkit.ts`).** The view's `react` records the state a miss leaves. The check control is off while the state is still that one and the law, applied and dropped, would miss again. Before any miss, nothing changes, so no first screen changes and no re-cert is needed. The two earlier examples are stambh/tally's Jaancho (a view snapshot) and kon/name's Yahi naam (a logic refusal, `unchanged`).

**Failed before (48 modes), fixed by "the button waits" (28 modes).** Each check button is now off after a miss until her answer changes:

| Button | Modes |
|---|---|
| done | aakash/grahan, bhaap/avastha, bhaap/bhaapan, nazariya/mirror, nazariya/views, nazariya/solid, nazariya/tri, stambh/bars, stambh/picto |
| commit | kon/close, kon/cross, kon/ends, kon/lines, kon/pair, kon/turn, kon/zone, nishana/hop |
| run | kaal/order, kaal/place (act `check`), kyun-lab/disha, taraazu/fill, taraazu/weigh (act `weigh`), vakya/rail, yantra/circuit, yantra/pendulum, yantra/roshni |
| sab | galti-pakdo/kaapi |
| next | jaanch/thali |

The same buttons now wait in modes that stay open for another act: aakash, badlaav, chhaano and rang/milao `done`; todo-jodo `done`; nishana/place `commit`; kyun-lab/dhruv `run`; nazariya/floor `done`.

**Still open (20 modes; `CHECK_WAITS_OPEN`, `KNOWN` law 4 in `tests/r8-play-laws`).** In these modes the act that missed is her answer itself, so "the button waits" does not say what to do. Each needs main's choice.

| Kind | Modes (the act) | What it needs |
|---|---|---|
| pick | todo-jodo/strips (`choose-0/1/same`), nishana/place round (`round-N`), kyun-lab/dhruv (`claim-N`), kon/place draw (`join-o/a`), rang/milao (`danger`), badlaav/palat ghol (`gone`) | Grey out the missed option until she changes something? That narrows the options (elimination). On kon/place draw it also changes the blind chance that gate 2 reads. |
| typed | todo-jodo/atoms hcf/lcm (`name x`), nazariya/floor and nazariya/powers (`name n`), taraazu/equality (`drop n`), kon/place measure (`read n`) | Refuse a typed number that equals the one that missed (a logic refusal, as kon/name's `unchanged`, so the server's replay agrees), or let it count? |
| experiment | aakash/chakkar and aakash/ritu (`use`), badlaav/aag (`use`), badlaav/palat (`file`, `mark`, `put`), bhaap/chakra and bhaap/hawa (`use`), chhaano/geela (`use`, `take`), chhaano/sukha (`use`), jaanch/daag and jaanch/neela (`mark`), rang/pehchaan (`sort`), todo-jodo/atoms (`split`) | The miss is an experiment. Doing it again plays its consequence again. Is a repeated experiment a check? |

**The cert.** A re-cert of any open mode would now fail its cells at `laws:L4`. None was re-certified, and `play.json` is unchanged.

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
- `stambh/tally`: the count over each group (1 to 5) while it plays. Since the evening judging (ruling 2) it fades: nothing stays over the tally while a try remains.

## Per family (3 seeds, 3 goals per mode; L = law broken now, A = allowed, F = fixed here)

| Family | Modes: result |
|---|---|
| aakash | chakkar F2, grahan F2, ritu F2 (why lines, ruling 2026-11-15); F3 (7 picks) |
| aankde | line -, stack -, tally F2 (typed totals, ruling 2026-11-15) |
| arena | pick - |
| badlaav | aag F2 (why lines), palat -; F3 (3 picks) |
| bhaap | avastha -, bhaapan -, chakra -, hawa F2 (why lines); F3 (5 picks) |
| chhaano | geela -, sukha F2 (why lines); F3 (7 picks) |
| darpan | mirror A1, tile -, turn A1 |
| feeta | compare -, fence -, measure -, scale -, thermo F1 (L2 question), thread -, touch -, trip -; F3 (3 picks) |
| galti-pakdo | kaapi L2, A1, F1; pakdo F3 (central) |
| gati | drishti F1, nishaan -, raftaar F1/F2; F3 (5 picks) |
| ghadi | calendar -, race -, run -, set - |
| guna | field -, pack -, story -, yard - |
| hissa | fold -, grid F3 (shift, central), pour -, story - |
| jaanch | daag -, neela F2 (why lines), thali -; F3 (2 picks) |
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
| rang | milao F2, pehchaan F2 (why lines); F3 (3 picks) |
| stambh | bars -, picto -, tally A2 (ruling), with the round-2 fixes in the next commit |
| taraazu | equality F1, equation F1, fill -, weigh - |
| todo-jodo | atoms A2, F3, bundles -, strips F3 (5 picks) |
| vakya | rail - |
| yantra | beam -, circuit -, pendulum -, roshni F2 (why lines), A1 |
