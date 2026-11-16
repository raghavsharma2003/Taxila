# The catalogue under the Claude rubric: a 20-topic sample (2026-11-10)

Main's ask: the 385 catalogue topics were cross-checked by a Foundry model (DeepSeek-V4-Flash) before the Claude-judge
directive (2026-10-27). Before a full re-check, judge a seeded random sample with the approval lane's rubric and the same
separate judge, and report the fault rate and the kinds of fault.

- **Sample:** 20 of the 369 topics whose catalogue game passed the old check (sorted by id), drawn with a seeded shuffle
  (mulberry32), **seed 20261110**: `scripts/approve-check.mjs --catalogue-sample 20 --seed 20261110` reproduces it.
  `index.json` lists them.
- **Render:** each topic's catalogue game was rendered in the real Desk tray (forge3 harness, local Chromium) at p360, p412
  and l1366. One screenshot per size, sha256 in `packets.json`. The images themselves are not committed.
- **Judge:** a separate Claude agent (Opus) that wrote none of it. It was given only the images, the spec as data, the
  topic's cards with their keys, and the topic's mix-ups, and judged them against `data/studio-approved/JUDGE-PROMPT.md`
  (rubric v1). Its verdicts, with a quoted reason for each fault, are in `verdicts.json`.

## Result

| | pieces |
|---|---|
| pass on every rubric item | **4 / 20** |
| a **content** fault (truth, topic, register, key, answer given away) | **11 / 20 (55%)** |
| readability faults only | 5 / 20 |

| Fault kind | faults |
|---|---|
| unreadable at ≥ 1 size (cut-off coach line, overlapping pills, text spilling out of its button) | 17, in 13 pieces |
| off topic: the game practises something else | 4 (c4 rounding played as exact change; c5 shared Earth as a food web; c7 HCF × LCM as common factors; c7 state vs government as barter) |
| register: the wrong word or broken template text | 3 (both class 5 Hindi train games use "फाँक" for the rail fork; c6 science "…will show it: sets") |
| wrong key: a right answer graded wrong, or a wrong one graded right | 2 (c6 science: "Soil washed away" graded as an "Other use" of forests; c6 sst: one of several correct cause-effect pairs accepted) |
| wrong fact | 1 (c6 English: "The poem glows in silence"; it is the flame that glows) |
| answer given away | 1 (c6 science: "Guava tree" and "Rose bush" name their own bins) |

The readability faults are mostly the same engine layouts repeated across topics: the train games' coach line, the sorting
games' round pill at 1366, button text. They are Studio v2 engine fixes, not catalogue data. The content faults are the
catalogue's own: 11 of 20 is far above what the old check's "pass" implies.

## A second finding: the tray certificates are stale

The certificates the tray gate serves the catalogue from (`server/forge3/certs/catalogue.json`, 2026-10-09) do not match
today's render. On today's harness every sampled game fails Q1 (legible) and Q4 (touchable) at p360 in the 328 × 404 tray,
in any order and with a longer boot. The certificates record p360 as passing and p412 as failing for the same pieces. The
tray gate is still serving catalogue games at p360 on a stale verdict. Re-certifying the catalogue (no model call) is
Studio's to do. Main decides when, since it may withdraw pieces children see today.
