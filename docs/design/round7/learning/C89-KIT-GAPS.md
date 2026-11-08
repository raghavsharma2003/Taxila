# Class 8-9 curriculum and kit gaps (CBSE/NCERT)

Round 7 F Learning, 2026-11-08 (main: "class 8-9 curriculum and kit gaps"). Per-topic detail is in `C89-KIT-GAPS.json`, next to this file.

## Coverage: no gaps

- **Syllabus graph:** every class 8 and 9 book is the current NCF-SE 2023 title, checked 2026-10-02 for the 2026-27 session (data/curriculum/SOURCES.md).
  - c8: Ganita Prakash, Curiosity, Poorvi, Exploring Society, Malhar.
  - c9: Ganita Manjari, Exploration, and English, Hindi and SST.
- **Topic level:** maths and science go down to topics. English, Hindi and SST are one topic per chapter (by design; SOURCES.md).
- **Kits:** all 239 class 8-9 topics have a kit, and all 239 have every item blind-verified (`verified.agrees === true`).

## Depth: the gaps

The bar is the one the next-30 kit work set (kit-gaps.mjs, dc-r7 kit gaps): every skill has a full worked example, at least 3 practice items (a ladder), and a real misconception.

| class | subject | topics | skills | skills with no worked example | skills with < 3 items | skills with no misconception |
|---|---|---|---|---|---|---|
| c8 | maths | 37 | 115 | 78 | 16 | 15 |
| c8 | science | 34 | 102 | 68 | 9 | 10 |
| c8 | english | 15 | 60 | 45 | 16 | 15 |
| c8 | hindi | 10 | 50 | 40 | 21 | 20 |
| c8 | sst | 15 | 64 | 49 | 24 | 16 |
| c9 | maths | 41 | 123 | 82 | 10 | 22 |
| c9 | science | 43 | 139 | 96 | 23 | 32 |
| c9 | english | 16 | 65 | 49 | 14 | 17 |
| c9 | hindi | 12 | 60 | 48 | 32 | 21 |
| c9 | sst | 16 | 69 | 53 | 32 | 22 |
| **total** | | 239 | 847 | 608 | 197 | 190 |

How each column is counted:
- **No worked example:** neither `workedExample` (skillId, or the topic's first skill) nor `skillExamples` covers the skill. A lesson script for it has nothing verified to walk through.
- **< 3 items:** a practice ladder needs three rungs (W5).
- **No misconception:** no `misconceptions[]` entry tagged with the skill, and no item on the skill targets one.

## What the gaps block

- **Lesson scripts for classes 8-9** (none exist yet, and (a) is held) need the worked examples and the 3-rung ladders first.
- **Live lessons from the kit alone run today.** The gaps make them thinner, not wrong.

## Proposed fill (asks main first: bulk)

- **Method:** the same pipeline as the next-30 kit gaps. Claude authors in session, a separate Claude agent blind-solves, and kit-gaps.mjs lints, packs blind and applies. No Azure.
- **Size:** 608 worked examples, about 200 items, about 190 misconceptions.
- **Slices, in order:**
  1. c8 maths and c9 maths (160 examples, 26 thin skills, 37 misconceptions). These are most used and most checkable by code.
  2. Science.
  3. English, Hindi and SST.
- **Pilot first:** about 10 topics of c8 maths end to end, with lint, blind-solve and agreement measured. The rest follows only on main's go.
