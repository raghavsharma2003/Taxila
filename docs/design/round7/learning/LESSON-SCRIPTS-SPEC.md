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

### Rules from the staged reader pass (main, 2026-11-11; each is also a check.mjs predicate)
9. A card's key is never heard in its own spoken prompt. Her voice says numerals in words ("60,040" → "sixty thousand
   forty"), so a read-aloud or place-value card puts its number on its own board and the prompt points at it.
10. A card's key is never said earlier in the script with that card's own numbers: in the hook, a point, a simpler, a why,
   a worked step, an earlier card, or an earlier skill's line ("4 × 7 = 28" in s2's worked example before s3 asks 4 × 7).
11. A card never repeats a kit ladder item (same numbers, same answer). Ask something the practice does not.
12. A remediation's then-card uses a different object from its say: the say acts the idea out on one thing, and the
   then-card asks about another. The say never states the then-card's key, including a yes/no or word key.
13. A skill never asks the same question frame twice. Frames are compared with numbers and letter names masked
   ("ray XY ke kitne endpoints?" asked for KL, then for GH, is one question).
14. A rule is stated with its limit, or only for cases inside it: "clockwise goes to bigger numbers" breaks at 12, and
   "a multiple is never smaller than its number" breaks at 0. Do not delete a rule the point needs. Give its limit.

## v2.4 (director21 → director22, dc-r8-director21): the ending, second wordings, seams and re-asks are authored

All spoken text is `{ hi, en }`. check.mjs `d22Errors` requires these from `"version": 2.4`; the pilots carry them first, the staged 30
after.

- **`teachback`** (top level, E1): `{ prompt, key, accept[], why, board? }`. One question that uses the lesson's main idea once more,
  on new numbers (never a card's or a ladder item's), answerable from the prompt and its own board (or none). It ends on its question;
  at most three sentences. A non-answer gets the key and the why, once.
- **`wrap`** (top level, E1): `{ covered, goodbye }`. `covered` is exactly two sentences on what the lesson covered: the ideas, never
  what the child did ("tumne", "you"), never praise. `goodbye` is one sentence, no question. The model writes none of the ending.
- **Second wordings** (C1), each `{ hi, en, board? }`: `pointAlt` on every explain beat, `whyAlt` on every card that has a why,
  `problemAlt` on every worked example. A second wording shows the idea another way (another picture, a smaller number, an everyday
  thing, the reverse direction). It shares no sentence of three or more words with the first wording and is not the first shortened
  (at most 80% of its words from the first). With its own `board`, it speaks every number on that board. It never states a later
  card's key. Cells: first clarify → the simpler; second → the second wording; third → the answer plainly, the part marked for return.
- **Seam joints** (J1), in `joints`, three forms each, one sentence, asking, judging and promising nothing, no slot: `afterAside`
  (after her reply to an aside), `beforeRemediation` (after a miss verdict), `afterTryFirst` (after "pehle tum try karo"),
  `afterAiLine` (after the AI line). Each reads well before any part of the lesson.
- **`reask`** (S2) on a card whose last sentence cannot be answered from the board and that sentence alone (it points back with
  woh/yeh/it/that, or is five words or fewer, after earlier sentences): one self-contained question that names its givens. It is the
  re-ask after help; after the second miss the whole card is said.

From director22 (dc-r8-director22, T2, T5 and clause 8), also required by `d22Errors`:
- **`teachback.leadIn`** (T2): three forms `[{ hi, en }]`; Brain says one just before the teach-back's question. Each is one sentence that
  says one last question is coming. It names no value, asks nothing and praises nothing, in at most 14 words. The three forms differ.
- **`skills[i].covered`** (T5): `{ hi, en }`, one sentence on what that skill covered, never what the child did, no praise, no question.
  The wrap says the covered sentences of the skills the lesson reached, in order, then `wrap.goodbye`. `wrap.covered` stays as the
  fallback until Brain reads them.
- **`skills[i].remediation[j].sayAlt`**: `{ hi, en, board? }`, the remediation's second wording, said when the same remediation would be
  said again. It follows the second-wording rules above, and is true of its own board or else of its then-card's board.
- Two more synonym sets: the drawn strip (bar / patti) and half a perimeter (aadha raasta / kinaara / chakkar / parimap). A two-word
  name is told apart by its second word.

Data rules from director21 (row 12), for every v2.3+ script: `friendVerbErrors` ({friend} with a gendered verb → {friendM}/{friendF},
or "{friend} ka kehna hai"; "ne kaha" agrees with its object and is fine); `bridgeTrueErrors` (a bridge says what comes next, never a
recap); `hookReuseErrors` (a hook's things come back in its skill); `allBoardsResolve` (every board and answerBoard, a remediation's own
board included). From v2.4: `synonymErrors`, one word per idea across the synonym sets (a step along a line; a group of things; one
piece of a cut whole; from director22 the drawn strip and half a perimeter), the `terms` glossary excepted.

Aside replies (R3, data/lesson-aside-replies.json): each kind's `phraseReplies[i]` answers `returns[i]` with one `{phrase}` slot,
up to three of the child's own words, said back about the child; Brain turns first person into second and drops a final
postposition. `replies` ({word}) stays until Brain reads `phraseReplies`.
