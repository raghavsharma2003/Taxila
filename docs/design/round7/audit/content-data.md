# Audit: content-data (2026-11-09)

Area 3 of the whole-project audit: `data/curriculum`, `data/kits`, `data/kits-relevel`, `data/lesson-scripts-staged`, `data/placement`, `data/arena`, `data/geo`, `scripts/kits`, `server/content`. Base: `int/r6` at integration 21a. Nothing paid was called.

## Summary

- **No wrong answer key was found.** 1,802 items were solved blind (keys withheld until the answers were written) and every stored key agreed in substance. That includes all 456 placement items. A wrong key would have been P0; there is none in the sample.
- **The worst defect is in how content is used, not in the keys.** Eight topics can never be finished because one of their skills has nothing to ask (CD-01). English reading questions lose their passage in a Hinglish lesson (CD-02, CD-03), and a third of class 9 English never loads (CD-04).
- **The curriculum graph is clean.** 830 topics, 830 kits, no duplicate ids, no missing or orphan kits, no dangling, forward or circular prerequisites.
- Counts: 23 findings. P0 0, P1 8, P2 9, P3 6. Broken 8, inconsistent 6, not good enough 5, no longer needed 4.

## What was solved blind

Nine solver agents each got questions without keys, wrote their answers, and only then opened the keys. I checked every disagreement they raised against the data myself.

| Batch | Content | Solved | Wrong keys |
|---|---|---|---|
| Maths, classes 1-3 | 120 kit items, 30 diagnostics, 24 worked examples | 174 | 0 |
| Maths, classes 4-5 | 80 kit items, 20 diagnostics, 16 worked examples, 72 placement | 188 | 0 |
| Maths, classes 6-7 | 80 kit items, 20 diagnostics, 16 worked examples, 72 placement | 188 | 0 |
| Maths, classes 8-9 and placement 3, 8 | 80 kit items, 20 diagnostics, 16 worked examples, 84 placement | 200 | 0 |
| Science, classes 6-9 | 120 kit items, 24 diagnostics | 144 | 0 |
| EVS, classes 3-5 | 90 kit items, 18 diagnostics, 120 placement | 228 | 0 |
| Social science 6-9, science placement 6-8 | 80 kit items, 24 diagnostics, 108 placement | 212 | 0 |
| English, classes 1-9 | 180 kit items, 54 diagnostics | 234 | 0 |
| Hindi, classes 1-9 | 180 kit items, 54 diagnostics | 234 | 0 |
| **Total** | 1,010 kit items, 264 diagnostics, 72 worked examples, 456 placement | **1,802** | **0** |

The kit sample is seeded and random within each class and subject file: 40 items per maths file, 30 per science or EVS file, 20 per English, Hindi or social science file (8% of the 12,597 kit items). Placement was solved in full.

Limits of this check:
- Some English and Hindi items for classes 1-6 ask about a story, poem or picture the prompt does not carry (the English solver counted about 25). The solvers guessed 14 of them wrong (6 English, 8 Hindi) and could not re-derive the key. Those keys are unverified, not confirmed (see CD-03).
- The solvers are the same model family as this session. The kits' own blind solve used other families (DeepSeek, Grok), so the two checks are independent of each other.

## Findings

Owner is the stream that owns the path. "Mine" in the status column means I fix it in phase 2 under the rule for this area. "Waits" means it needs main's reply first.

| id | sev | kind | owner | title | where | fix | status |
|---|---|---|---|---|---|---|---|
| CD-01 | P1 | broken | learning | Eight topics can never be finished: a skill with nothing to ask keeps the topic "in progress" for ever, so the child is given the same topic again | `server/content/next-topic.js:21-28,134`; 8 skills listed below | Count only skills that have a loadable item when deciding a topic is complete | mine |
| CD-02 | P1 | broken | learning + brain | In a Hinglish lesson, about 185 English reading questions are asked without their passage | `server/director/items.js:24`; `prompt_hi` in c5, c7, c8, c9 English | Put the passage in `prompt_hi`, or store it once per topic and have the teacher read it (with CD-03) | waits (bulk rewrite or Brain code) |
| CD-03 | P1 | inconsistent | brain + learning | The stored story for 48 topics (`passage`) is read by nothing; 677 items sit in topics whose story the child never hears | `data/kits/c1..c4-english.json`, 2 topics of `c3-hindi.json`; `server/content/kits.js:119-131` | Carry `passage` through `normalizeKit` and have the lesson read it before the first recall item | waits (contract and Brain) |
| CD-04 | P1 | not good enough | learning | 102 of 430 class 8-9 English items never load: they are longer than the prompt budget and are dropped silently | `server/content/kits.js:110`; c8-english 27 of 204, c9-english 75 of 226 | Same as CD-03: one passage per topic, short questions | waits (with CD-02, CD-03) |
| CD-05 | P1 | broken | learning | A class 1 item asks the opposite question in Hindi; the right Hindi answer is marked wrong | `c1-maths-ch03-t03-i11` | Hindi asks "later", as the English does | mine |
| CD-06 | P1 | broken | learning | "an art club" is marked wrong; only "the" is accepted | `c6-english-ch01-t01-rl-h3` | Accept the "an" forms | mine |
| CD-07 | P1 | broken | learning | Placement: "3:25 pm" and "3:25" are not credited, and "3.25" is marked wrong | `pl-c4-maths-m11`, `server/placement/grade.js` | Add the accepted forms to the item | mine |
| CD-08 | P1 | broken | games | Two arena challenges show number tiles for "say the plan in three steps" with key "1" | `server/play/tools/build-arena.mjs:30`; `c3-evs-ch02-t02-i02`, `c9-maths-ch11-t01-i09` | `head()` must not cut a numbered list at "1."; rebuild | route to games |
| CD-09 | P2 | inconsistent | learning | 14 kit lines the teacher says still name "Asha" (her own name) or "Riya" instead of the friend slot | 4 items, 10 diagnostics (list below) | Re-run `scripts/kits/friend-slot.py`; rebuild the arena | mine |
| CD-10 | P2 | broken | learning | Three accepted forms mark a wrong or empty answer right | `c3-hindi-ch04-t01-i13`, `c3-hindi-ch09-t01-i08`, `c8-hindi-ch05-t01-i08` | Remove the three forms | mine |
| CD-11 | P2 | broken | learning | Nine lines of Hinglish or fact no teacher would say (tin sheet written as "3", a rope in kho-kho, "marne" for "maarne") | list below | Correct the nine strings | mine |
| CD-12 | P2 | not good enough | learning | A diagnostic asks only "Who ruled first?"; the rulers are named only in the options | `c7-sst-ch05-t01-m2` | Name both rulers in the stem | mine |
| CD-13 | P2 | inconsistent | learning | Ten placement questions exist twice in one class at two difficulty levels | pairs listed below | Retire one of each pair | waits (removes items) |
| CD-14 | P2 | not good enough | learning | A three-number addition pyramid is anchored at the top of class 8 in placement | `pl-c8-maths-l10` | Retire it or re-anchor it at class 3-4 | waits |
| CD-15 | P2 | not good enough | games | About 100 arena challenges show four numbers for a yes/no or "explain" question | `server/play/tools/build-arena.mjs:130-141` | Take a numeric key only from the head of the answer, not from an accepted form, unless the question asks for a number | route to games |
| CD-16 | P2 | inconsistent | games | The older game-level builder serves kit text with a raw `{friendF}` in it | `server/forge/g2/levels.js:43,80` | Fill the slot, or skip items that carry it | route to games |
| CD-17 | P2 | inconsistent | learning + brain | The Hindi name रिया is never a slot: about 240 uses; in 18 items English says `{friendF}` and Hindi says रिया | Hindi kits c3-c9 | Slot the Devanagari name too (needs Devanagari names in `server/director/friend.js`) | waits (Brain code) |
| CD-18 | P3 | inconsistent | main | The homework matcher feeds a whole sentence to `findTopic`, which only matches bare topic words | `server/homework/match.js:84` | Strip filler words before the call, as `rj-r4t-findtopic-as-intake` says | route to main |
| CD-19 | P3 | no longer needed | learning | The mini-kit generator cannot run for any curriculum topic: all 830 have a file kit | `server/content/minikit.js`, `server/content/index.js:47-55`; stale header in `kits.js:2` | Keep as a fallback or delete; correct the header comment either way | waits (deletion) |
| CD-20 | P3 | no longer needed | learning | Four one-off kit scripts have nothing left to do and nothing references them | `scripts/kits/w5-decide.mjs`, `w5-decisions.json`, `w2-merge.mjs`; `runner.mjs:12` names a script that does not exist | Delete the three files; correct the comment | waits (deletion) |
| CD-21 | P3 | inconsistent | learning | The kit schema document is behind the data | `data/kits/SCHEMA.md:8` | Document the six subjects and the `passage`, `relevel`, `ge`, `demand` fields; say `skillExamples` is for script authors only | mine |
| CD-22 | P3 | no longer needed | learning + main | The curriculum validator is run by no test or gate; `boards.json` and `index.json` are read by no product code | `data/curriculum/validate.mjs`, `boards.json`, `index.json` | Add the validator to the test suite; keep the two files as documentation or delete | mine (test); deletion waits |
| CD-23 | P3 | not good enough | learning | The 30 staged scripts pass today's validator but are a format behind the pilots and all need the D11 rework | `data/lesson-scripts-staged/*.json` | None from me: Learning regenerates after D11 | report only |

## Evidence

### CD-01: eight topics can never be finished

- `topicStatus(states, skillCount)` calls a topic learned only when `states.length >= skillCount` (`server/content/next-topic.js:23`). `nextTopicFor` passes `kit.skills.length` (line 134).
- A `skill_state` row is written only for a skill that got evidence (`server/brain/turn.js:1753`), and evidence comes from an item of that skill.
- Eight skills have no item after the kit loads:
  - no item in the kit at all (reading-aloud and recitation skills): `c5-hindi-ch05-t01-s1`, `c5-hindi-ch06-t01-s1`, `c5-hindi-ch08-t01-s1`, `c6-hindi-ch03-t01-s1`;
  - every item dropped by the prompt budget (CD-04): `c8-english-ch01-t01-s1`, `c9-english-ch01-t01-s1`, `c9-english-ch07-t01-s1`, `c9-english-ch11-t01-s1`.
- Reproduced with the real kits: with every other skill of `c5-hindi-ch05-t01` mastered, `topicStatus` returns `in_progress` and `pickTopic` over the class 5 Hindi order returns `c5-hindi-ch05-t01` again, not `c5-hindi-ch06-t01`. The same for `c8-english-ch01-t01`.
- What the child sees: after finishing chapter 5 of class 5 Hindi, every later Hindi lesson is chapter 5 again. A class 8 or 9 child starting English is held on chapter 1.

### CD-02: reading questions without their passage

- `promptFor(item, lang)` returns `prompt_hi` unless the lesson language is English (`server/director/items.js:24`).
- `c8-english-ch10-t01-i01`: `prompt_en` begins "Read: 'When Tara was eight, she planted a cherry stone beside her grandmother's kitchen door in Shimla…'". `promptFor(item, "hinglish")` is the whole of: "Kahani suno. Tara ne cherry ki guthli kahan boyi?"
- Count: 185 items where `prompt_en` quotes a text, none of it is in `prompt_hi`, and `prompt_hi` is under 45% of its length. By file: c9-english 69, c8-english 53, c7-english 47, c5-english 15, c3-english 1. The English solver reported the same pattern independently.
- Related, not counted: items that lean on the item before them ("the same reaction", `c9-science-ch09-t01-i02`) cannot be answered when served alone.

### CD-03: the stored story is never read

- 48 kit topics carry a `passage`: every topic of c1, c2, c3 and c4 English, and 2 of c3 Hindi. Example, `c3-english-ch09-t01`: "Pihu had a wish. 'I wish I had a tiffin full of aloo parathas…'".
- No file under `server/`, `src/`, `shared/` or `scripts/` reads `.passage`, and `normalizeKit` does not copy it (`server/content/kits.js:119-131`).
- `c3-english-ch09-t01-i01` asks "What was Pihu's first wish?". The story is the product's own, so no textbook has it either.
- `context/rejected.md`, `kit-invented-companion-texts`, already says: "Never keep an invented text unless it is stored and shown in the lesson." It is stored; it is not shown.

### CD-04: class 8-9 English items dropped at load

- `normalizeKit` drops an item that does not fit the pinned prompt section (`checkFits`, `server/content/kits.js:110`). It drops 111 items across all kits; 102 are in c8-english and c9-english, each carrying its own 400-600 character passage.
- Per topic, c9-english keeps 7 to 11 of 13 to 16 items. Four skills lose every item (CD-01).
- The drop is counted in `kit.lint.itemsDropped` and shown nowhere.

### CD-05, CD-06, CD-07: right answers marked wrong

- `c1-maths-ch03-t03-i11`: English "Which do you reach later, 3 or 7?"; Hindi "Pehle 3 aayega ya 7?" (which comes first). Accepted: 7, seven, saat. A child who answers the Hindi question correctly says 3.
- `c6-english-ch01-t01-rl-h3`: "…she joined ___ art club." Accepted: "saw; the", "saw, the", "saw the". "saw; an" is correct English and is refused.
- `pl-c4-maths-m11`: answer "3:25 p.m.", no accepted forms. `gradePlacement` gives `null` for "3:25 pm" and "3:25" (no credit) and `false` for "3.25".

### CD-08, CD-15: arena challenges that do not fit their question

- `build-arena.mjs:30` `head()` cuts the kit answer at ". ". For an answer written as a numbered list ("1. Stop and stay in one place. 2. …") the head is "1", which parses as a number, so the challenge becomes: "Say the lost-child plan in three steps." with tiles 3, 6, 2, 1 and key 1. The second case, `c9-maths-ch11-t01-i09`, is in a topic the arena serves (`eligible: true`).
- 548 numeric challenges take their key from an accepted form because the head of the answer is not a number (line 141, `?? nums[0]`). Where the question asks for a number that is fine. In 51 the question is "Is he right?" and in 46 it opens with why, explain, teach or which. Examples: "Why is 4.8 ÷ 0.6 the same as 48 ÷ 6?" with tiles 4, 8, 13, 9; "Which statement is a complete measurement? (a)… (b)… (c)… Explain." with tiles 13 m, 12 m, 14 m, 21 m.
- The arena data is otherwise in step with the kits: `build-arena.mjs --check` passes, every key is among its options exactly once, and no decoy equals the key by value.

### CD-09, CD-16, CD-17: the friend slot

- Kits use `{friendF}` 747 times so that a story character is never the child and never the teacher (`server/director/friend.js:1`).
- Still naming Asha or Riya, in text the teacher says: items `c1-maths-ch05-t02-i14`, `c8-english-ch06-t01-i15`, `c8-maths-ch01-t03-i14`, `c8-maths-ch10-t01-i16`; diagnostics `c1-maths-ch06-t02-m-wrong-fact`, `c1-maths-ch08-t01-m-bundle-as-one`, `c2-maths-ch11-t01-m-counted-twice`, `c3-maths-ch07-t01-m-turn-changes-total`, `c3-maths-ch10-t01-m-unit-any-word`, `c4-maths-ch05-t02-m-metre-is-1000`, `c4-maths-ch10-t01-m-aim-for-nine`, `c6-maths-ch09-t01-m-slide-copy`, `c8-maths-ch14-t01-m-height-wrong-base`, `c9-maths-ch03-t03-m-tried-some`. These were added after the slot script last ran. Another 49 strings in `skillExamples` name them too.
- `scripts/kits/friend-slot.py:4` still says it is "HELD until the Games banks fill {friendF} too". The banks do fill it (`server/play/levels.js:97`), and the kits already carry the script's output.
- `server/forge/g2/levels.js` reads raw kit text and never fills the slot: 13 of its 880 specs carry a literal `{friendF}` (first: `c1-maths-ch05-t02`).
- The script only matches Latin letters. रिया stays in about 240 places in the Hindi kits, and in 18 items and diagnostics the English prompt has the slot while the Hindi prompt says रिया (`c3-hindi-ch07-t01-i01`).
- Placement names Riya 58 times and Asha 10 times and has no slot. Placement is not spoken by the teacher, so this is noted, not counted.

### CD-10: accepted forms that are wrong

- `c3-hindi-ch04-t01-i13` ("Say 'चिड़िया'. Is the first sound short or long?") accepts "चिड़िया", the word the child was told to say.
- `c3-hindi-ch09-t01-i08` ("Find the naming words") accepts "तीन शब्द" (three words), which names none.
- `c8-hindi-ch05-t01-i08` (finish Kabir's doha, "…आज करै सो ___") accepts "abhi" and "अभी". The word is "अब".

### CD-11: lines no teacher would say

| Where | Now | Should be |
|---|---|---|
| `c4-evs-ch09-t02-i04` prompt_hi | "ek patli 3 (tin) ki chhat aur deewaron wali" | "ek patli tin ki chaadar ki chhat aur deewaron wali" (the numeral rewrite hit the metal) |
| `c4-english-ch09-t01-rl-h1` both prompts | "During a kho-kho match, Kabir held the rope firmly" | a tug-of-war match (kho-kho has no rope) |
| `c7-science-ch04-t01-i03` prompt_hi | "kaun ki aawaaz goonjegi" | "kiski aawaaz goonjegi" |
| `c7-maths-ch01-t01-rl-h3` prompt_hi | "Event A ya Event B—and kaunsa" | "…aur kaunsa" |
| diagnostic `c9-science-ch01-t03-m2` prompt_hi | "theory bada hokar law ban jaati hai" | "badi hokar" |
| diagnostic `c8-science-ch01-t01-m3` prompt_hi | "Usse aur kya chahiye?" | "Use aur kya chahiye?" |
| `pl-c7-science-e12` prompt_hi | "microbes ko marne ke liye" (to die) | "maarne ke liye" (to kill) |
| `pl-c4-maths-e03` prompt_hi | "chauṛa" | "chauda" |
| `pl-c4-maths-m05` prompt_hi | "ek baar baad lagane ke liye" ("baad" reads as "after") | "ek baar baadh (fence) lagane ke liye" |

Across 1,802 items the solvers flagged about ten lines of Hinglish. The register is otherwise natural.

### CD-13, CD-14: placement bank

- Same question at two anchors in one class, both usable: c5-maths m10 and l02 (identical wording, GE 4.5 and 4.8), c5-maths m12 and l07, c5-maths m11 and l05, c4-maths m05 and l01, c3-maths m01 and e05, c7-maths e11 and m03, c8-maths e10 and m01, c4-evs e09 and m02, c6-science m10 and l02, c7-science m06 and l01. One placement can show a child the same sum twice, and one sum carries two difficulty values.
- `pl-c8-maths-l10` (7, 9, 5 → 30) is anchored at GE 7.8. Its own blind solve disagreed (`verified.agrees: false`) and it is usable only through `adjudicated`. Two solvers here flagged it as class 3-4 arithmetic.
- Also seen, not counted: the correct option is stored first in 247 of 257 placement MCQs. `server/placement/session.js:15` shuffles per item, so the child does not see that order.

### CD-18: homework matching

- `matchHomework("fractions", { class_level: 5 })` finds `c5-maths-ch02-t01`. `matchHomework("fractions ka homework hai", …)` finds only the subject. "photosynthesis ke questions likhne hain" for class 7 finds nothing.
- Cause: `findTopicLiteral` requires every word of four or more letters to start a title word (`server/content/curriculum.js`), which is right for a short named subject and wrong for a sentence. `context/rejected.md` `rj-r4t-findtopic-as-intake` records exactly this, so `findTopic` should stay as it is and the caller should change. `server/homework` is outside this area.

### CD-19 to CD-22: left over

- Mini-kits: 830 of 830 topics normalize from a file, so `getKit` returns at line 47 of `server/content/index.js` every time. `kits.js:2` still says kits "are generated by another workflow WHILE this code runs".
- `node scripts/kits/w5-decide.mjs` stops at its first rewrite ("occurs 0 times"): all were applied. `node scripts/kits/w2-merge.mjs` reports 0 items to merge. Neither they nor `w5-decisions.json` are named by a test, a package script or CI. `scripts/kits/lib/runner.mjs:12` points at `scripts/kits/merge.mjs`, which does not exist.
- `data/kits-relevel` (3 MB) is already folded into the kits, but `tests/rs6-merged-kits.test.mjs` reads it and `context/` cites it. It stays.
- `data/kits/SCHEMA.md:8` lists three subjects; there are six. `skillExamples` (706 examples, 590 KB) is dropped by `normalizeKit` and read by no product code. It exists for the people and agents who write lesson scripts.
- `node data/curriculum/validate.mjs` passes (38 files, 518 chapters, 830 topics, 629 prerequisite links) but nothing runs it.

### CD-23: staged lesson scripts (report only)

- All 30 pass `LESSON_SCRIPTS_DIR=data/lesson-scripts-staged node scripts/lesson-scripts/check.mjs --all`: structure 0, boards 0, runtime 0.
- They are format 2.2. The four pilots are 2.3 and all carry `answerBoard` on asks, on the worked example's `yourStep`, on checks and on remediation `then` cards. No staged script has any of them.
- Against director14-16:
  - **Dropped points (director16 cause 3):** not present. None of the 248 staged points contains a "?" sentence for `say.js` to drop.
  - **Held board (D11):** all 147 staged remediations carry their own board, different from their then-card's board. Under the held board each one shares its card's board, so every remediation needs Learning's rework.
  - **A card that answers itself, a "?" over stated fractions (cause 6):** cannot be checked on 2.2 data, which has no answer boards.
- 117 of 248 staged explain boards are `compare@1` (a two-column text table). That is the most used template by a wide margin.

## Coverage

**Read fully**
- `server/content/*.js` (6 files).
- `scripts/kits/*` headers and entry points; each script dry-run where it has one.
- `data/curriculum`: every file through the graph checks (ids, chapter order, prerequisites, cycles, duplicate titles) and the validator.
- `data/placement`: all 456 items solved blind; every numeric key run through its own grader.
- `data/arena`: all 3,004 challenges checked against their kit item (key present once, no equal decoy, in step with the kit).
- `data/geo/india-places.json`: 61 places, all inside India's bounds, 13 spot-checked against known coordinates.
- `data/lesson-scripts-staged`: all 30 through the validator and the format comparison.

**Sampled**
- `data/kits`: every topic through `normalizeKit` and the structural checks; 1,010 of 12,597 items, 264 of 2,647 diagnostics and 72 worked examples solved blind.
- Hinglish: read by the solvers on the same sample, not on all 12,597 prompts.
- `data/arena`: about 60 of the 548 lifted-key challenges read by eye.

**Not read**
- `data/kits-relevel` item by item: it is already merged into the kits, and the kit sample includes re-levelled items.
- Whether the curriculum matches the printed NCERT books chapter by chapter: no web access in this audit. The class 9 books (Ganita Manjari, Kaveri, Exploration) are newer than anything I can check from memory.
- `evals/kit-runs`, which the kit scripts write to.
