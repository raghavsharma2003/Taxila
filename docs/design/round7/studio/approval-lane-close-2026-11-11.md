# Approval lane: closed, 2026-11-11

**From:** C1 Studio, on main's ruling of 13:22. There will be no round 4: prompts have done what they can, and the yield fell from 6 of 22 in round 2 to 2 of 18 in round 3. Most of what is left is "misses the mix-up" and engine limits, and no `how` hint fixes either. A mix-up can't be checked without an executable mal-rule (see `mixup-predicate-2026-11-11.md`).

- **Result:** 13 of the 34 scripted topics have an approved game, 7 have no game target, and 14 are refused. Generation spent $0.175 of the $0.25 budget.
- **Approved** means a stored piece that passed two separate Claude Opus judges (rubric v2, `data/studio-approved/JUDGE-PROMPT.md`), rendered legible at p412 and l1366.
- Run records are in `data/studio-approved/runs/`.

## What re-opens it (the reversal)
A topic is generated or built, then judged, one at a time (never in rounds) when either of these happens:
- an engine gains the capability its no-game entry names;
- Games' families cover the topic with an executable mal-rule.

## The 34 topics

### Approved (13)

| Topic | Engine | Piece |
|---|---|---|
| c4-maths-ch03-t02 | rule-machine@1 | gen-…-0c1f1c81 |
| c4-maths-ch04-t01 | vault-heist@1 | gen-…-46f828e0 |
| c4-maths-ch04-t02 | scene-explainer@1 | cat-…-explainer (catalogue) |
| c4-maths-ch05-t01 | slice-at@1 | gen-…-af82c0ad (round 3) |
| c5-maths-ch02-t01 | catch-on-line@1 | gen-…-e14f359b |
| c5-maths-ch02-t02 | catch-on-line@1 | gen-…-a1bc53b3 (round 2) |
| c5-maths-ch13-t01 | sieve-storm@1 | gen-…-2eaa2cbb |
| c5-maths-ch13-t02 | sieve-storm@1 | gen-…-02d41791 |
| c6-maths-ch05-t01 | sieve-storm@1 | gen-…-132060cc (round 3) |
| c6-maths-ch06-t01 | area-claim@1 | gen-…-254ee040 |
| c6-maths-ch07-t01 | slice-at@1 | gen-…-e1a86604 |
| c6-maths-ch07-t05 | fraction-ops@1 | gen-…-3b481c3f |
| c7-maths-ch02-t01 | rule-machine@1 | gen-…-92068f8b |

### No game target (7)
The lesson stays on the board. The full why and needs for each are in `data/studio-approved/no-game-target.json`.

| Topic | Catalogue engine | What an engine needs |
|---|---|---|
| c4-maths-ch06-t01 | instrument@1 | an object laid on the ruler off zero (from 3 to 9), read as end minus start |
| c4-maths-ch14-t01 | pictograph@1 | tally marks (four standing lines and a crossing fifth) the child reads and counts |
| c5-maths-ch03-t02 | angle-cannon@1 | a fold-a-corner square tester laid on a drawn corner, showing the gap when it is not 90° |
| c6-maths-ch02-t01 | sort-storm@1 | a computed-key sort: segment, ray or line derived from the drawing's endpoints |
| c6-maths-ch02-t02 | angle-cannon@1 | lettered points A, B, C, and a round that names or picks the angle by its letters |
| c6-maths-ch02-t03 | angle-cannon@1 | a protractor the child places (drag and rotate) on a drawn angle |
| c6-maths-ch02-t04 | angle-cannon@1 | a base arm the engine turns to any direction, and a round that sorts tilted angles |

### Refused (14): the last reason each was refused

| Topic | Engine | Round | Last reason |
|---|---|---|---|
| c4-maths-ch01-t02 | geo-forge@1 | 3 | predicate: "vritt" in a title is not one of this topic's words |
| c4-maths-ch03-t01 | sieve-storm@1 | 3 | judge: register (even should be "sam sankhya") |
| c4-maths-ch07-t01 | dukaan@1 | 3 | judge: off topic; unrealistic prices (a 50-paise pencil) |
| c4-maths-ch09-t01 | sieve-storm@1 | 3 | judge: misses the mix-up; the title mentions trays |
| c5-maths-ch01-t01 | vault-heist@1 | 3 | judge: unreadable (words target on its label; engine fixed in e96ec2cec) |
| c5-maths-ch02-t03 | fraction-ops@1 | 2 | judge: misses the mix-up, off topic (no candidate in round 3) |
| c5-maths-ch03-t01 | angle-cannon@1 | 3 | judge: the sub says ghadi (clock) |
| c5-maths-ch05-t01 | instrument@1 | 3 | split: judge A pass, judge B register ("rule" for ruler) |
| c6-maths-ch07-t03 | catch-on-line@1 | 3 | predicate: 3/5 and 6/10 on a 12-tick line |
| c6-maths-ch07-t04 | catch-on-line@1 | 3 | predicate: 3/5 and 3/8 on a 12-tick line |
| c6-maths-ch08-t01 | geo-forge@1 | 3 | predicate: mixed script "Tribhuज" |
| c7-maths-ch03-t01 | instrument@1 | 3 | judge: 0.7 m on a 2000 m rule (wrong fact); misses the mix-up |
| c7-maths-ch05-t01 | geo-forge@1 | 3 | predicate: mixed script "Tribhuज", "Samलamb" |
| c7-maths-ch05-t02 | geo-forge@1 | 3 | predicate: mixed script "Tribhuज" |

**Patterns in the refusals:**
- **Content-near misses.** c5-ch05-t01, c4-ch03-t01 and c5-ch03-t01 failed on a single wording fault each.
- **Wording-only refusals.** The four geo-forge pieces and c5-ch01-t01 were refused for wording or an engine fault, and those are now checked or fixed.
- **Not yet built.** c6-ch07-t03 and t04 need a line whose ticks hold fifths and eighths, which the model has not yet built.

## Judge tokens
These counts come from the subagent token counts in this session's task notifications: each judge is a separate Claude Opus agent given only the packet (4 Reads + 1 Write).

| Judging | Agents | Tokens |
|---|---|---|
| Lane: judge A and B over regeneration rounds 1–3, 1b, 2b and re-judges | 66 | 6,109,407 (about 92.6k each, at most 93.7k; under the 300k cap) |
| Pilots: retries 1–5, rubric v1 and v2, c5-t02 | 12 | 1,221,277 |
| Catalogue samples: batch 1 (two judges), 20 by rubric, Sonnet and readability comparisons | 5 | 991,506 |
| **Total** | **83** | **8,322,190** |

## The checks that now exist, and what each caught
Every check runs before any judge sees a piece: either in `scripts/approve-check.mjs` (predicates), or in `server/stagecraft/builders.js` at generation (refusals that cost no paid check).

| Check | Where | Caught (pieces, across the runs) |
|---|---|---|
| Values on the ticks: catch-on-line fractions, angle-cannon scaffold angles, instrument targets on the scale's marks | predicate | 6 caught at the time (c6-ch07-t03 ×3, c6-ch07-t04 ×2, c5-ch03-t02); the instrument rule, added after round 3, also refuses that round's 2 instrument pieces the judges failed |
| English engine strings left in a Hinglish piece (also missing or blank strings) | predicate | 6 (c4-ch05-t01, c5-ch02-t02 ×2, c7-ch05-t01, c7-ch05-t02, c6-ch05-t01) |
| Geometry terms: the textbook's words or the lesson's own (geo-forge) | predicate | 4 (round 3) |
| Number words (digits rule) | predicate, and at generation since round 3 | 1 predicate (c4-ch05-t01 r2); content-check scores it explained |
| Case break inside a word (a typo) | predicate | 1 (c6-ch02-t04 r1b) |
| A word mixing scripts ("Tribhuज"), every engine | predicate and generation (new, main 13:22) | the 3 round 3 geo-forge pieces would also fail it; 0 of 398 catalogue and stored specs |
| Key verified against the kit (computed key, or a bound kit match) | generation | unverified_key refusals (sort-storm c6-ch02-t01 ×4, and others) |
| On topic (the engine's outcomes cover the topic) | generation | onTopic refusals in rounds 1–2 |
| No game target | generation | 7 topics get no target |
| Layout probe: overlap, cut-off, chrome, and the opt-in touch rule | test | the 2026-11-11 engine fixes (8 engines), and the vault words target |
| Render legibility (Q3.apart) at p412 and l1366 | predicate | gating at the judged sizes |
| Refused pieces are never served (never.json) | tray gate | every refused catalogue piece |

**Not wired: the mix-up predicate.** It agreed with the judges on only 6 of 25. "Misses the mix-up" stays a judge call until a topic has an executable mal-rule.
