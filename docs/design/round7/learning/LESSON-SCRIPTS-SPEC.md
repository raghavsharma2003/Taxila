# Pilot lesson scripts: authoring spec (round 7 F, dc-r7-teaching-scripts)

The lesson brain (the Director) will WALK an authored script beat by beat. A small reply model turns each beat into
natural speech, after first answering what the child just said. You author the script, not the speech.

## The law that matters most: write SHAPES, not sentences
Text that reads like a line gets recited word for word. So every `convey` field says WHAT to get across, in note form
(fragments, arrows, "→", "=", "because"), never a quotable sentence. No greetings, no "Let's…", no "Good job",
no rhetorical questions, no exclamation marks.
- GOOD: "equal shares = same size pieces; count of pieces alone is not enough → 4 unequal pieces are not quarters"
- BAD: "Do you know that equal parts are the same size? Let's find out together!"

Numbers, keys, givens and steps in worked examples are exact and complete (they are data, not speech).
Hindi terms appear where the lesson's Hindi switch needs them, in the `terms` list (e.g. bhinn = fraction,
barabar hisse = equal parts, ansh = numerator, har = denominator, sankhya rekha = number line, parimap = perimeter,
bhuja = side, lambai = length, chaudai = breadth). Lesson language is Hinglish; you do not write the Hinglish.

## Ground truth: the kit
Your topic's kit JSON is given. Use ITS skills, misconceptions (ids and beliefs), worked example and items. Do not
invent misconceptions. The practice ladder uses the kit's REAL items by `itemId` (and you may restate them as a
`problem` shape, but the key must equal the kit's `answer`). Class level matters: practise what that class actually
does in NCERT, not counting exercises.

## Boards (what the screen can draw today; Studio owns them)
- `fraction-parts@1` { parts: 2-12, shade: 0-parts, whole: "circle"|"bar"|"roti" }
- `fraction-of@1` { a, b, c, d } (a/b of c/d as an area model; b, d in 2-6)
- `equal-groups@1` { groups: 2-6, each: 1-8 } (sharing a collection out into equal groups)
- `compare@1` { left: { title, items[1-4] }, right: { title, items[1-4] } } (labels ≤ 32 chars)
- `measured@1` { shape: "rect"|"square"|"triangle"|"circle", unit: "m"|"cm", w, h | sides:[a,b,c] | r, trace?: true }
- `shape@1` { shape: polygon/circle name, names?, side? } (unlabelled lengths)
- `number-line-hop@1` { start: int, hops: [int…] } (WHOLE numbers only; not for fractions)
- NEW, requested from Studio for c5: `fraction-line@1` { den: 2-12, from: 0, to: 1|2|3, marks?: [{ num, label? }], hop?: { num } }
  (0 to `to`, cut into `den` equal gaps per unit; marks highlight points num/den; a hop draws the jumps from 0).
  Use it for EVERY c5 number-line board. Never use a shaded circle for c5.
  Studio (2026-11-05) built it as written; labels are checked against num/den at expand. A CHECK board must not show its
  answer: use `mark: k` (a "?" on the k-th mark, its fraction never written) or `target: [a, den]` (the asked fraction
  written above the line, nothing placed), with no marks and no hop.
A board ref is `{ "template": "...", "params": { … } }`. Each explain beat and the worked example name the board
they speak over; the beat's `convey` must point at something visible on that board.

## The file you write: one JSON per topic, `<topicId>.script.json`
```jsonc
{
  "topicId": "…", "classLevel": 4, "version": 1, "status": "draft",
  "terms": [{ "hi": "barabar hisse", "en": "equal parts" }],                 // the lesson's Hindi terms
  "skills": [{
    "skillId": "…",                                                          // the kit's skill id
    "hook": { "convey": "<shape>", "interestSlots": ["cricket","food","…"],   // contexts the hook can be re-skinned into
              "slotUse": "<shape: what the interest supplies, e.g. the thing being shared / the field being fenced>" },
    "explain": [                                                             // 2-4 beats, in order
      { "id": "e1", "convey": "<shape>", "board": { "template": "…", "params": {…} }, "point": "<what on the board to point at>" }
    ],
    "workedExample": {                                                       // FULL, from the kit's workedExample (you may tidy)
      "problem": "<the problem stated in full, as data>",
      "givens": ["…"], "find": "…",
      "steps": [{ "do": "<shape of the step>", "result": "<exact value or statement>" }],   // every step, no gaps
      "answer": "<exact>", "why": "<shape: why this answer is right / what the method rests on>",
      "board": { "template": "…", "params": {…} }
    },
    "checks": [                                                              // 2-3 per skill
      { "id": "c1", "prompt": "<the question as data, complete and solvable on its own>",
        "key": "<exact answer>", "accept": ["<other correct forms>"],
        "targets": "<kit misconception id>", "wrongIfMis": "<the answer a child holding that misconception gives>",
        "board": { … } | null }
    ],
    "ladder": [                                                              // 3-5 class-level practice rungs, easy → hard
      { "itemId": "<kit item id>", "why": "<shape: what this rung adds>" }
    ],
    "remediation": [                                                         // one per misconception the skill touches
      { "targets": "<kit misconception id>", "move": "<shape of the re-teach: a DIFFERENT representation, class-level, never 'count them'>",
        "board": { … }, "then": "<shape of the follow-up question>", "thenKey": "<exact>" }
    ],
    "bridgeToNext": "<shape: how this skill leads into the next skill (null on the last)>"
  }]
}
```

## Hard rules (the reviewer checks each)
1. A check's prompt never contains or gives away its key ("2 lambi bhujayein 50 m… 50 m kitni baar aata hai?" is banned).
2. Every check targets a REAL kit misconception id, and `wrongIfMis` is the answer that misconception produces.
3. The worked example states the problem, lists the givens, does EVERY step, then the answer and why. No faded blanks.
4. Remediation never asks the child to count pieces/units; it changes the representation.
5. Every board's params are inside the ranges above; c5 uses `fraction-line@1` only.
6. Maths is correct (a fraction is equal parts of ONE whole; "2 runs in 5 balls = 2/5" is a ratio, not a fraction; banned).
7. `convey`, `why`, `move`, `do` are shapes: no quotable sentences.
8. Class level: c4 = halves/thirds/quarters of shapes and collections and unit-fraction comparison; c5 = fractions on a
   number line up to improper fractions; c6 = perimeter of polygons, 2(l+b), 4×side, finding a side, cost problems.
