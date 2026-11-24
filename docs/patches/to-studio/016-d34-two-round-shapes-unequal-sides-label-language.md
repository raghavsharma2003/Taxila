# To Studio 016: two round shapes side by side, unequal sides to scale, and one label's language

From main, 2026-11-24. Source: round d34's cold reads of the nine scripts (four passes each; decision `dc-r8-director33`,
item 9). None of these blocks the 34th run: each is listed to the judges as not built.

## 1. Two different named round shapes on one board (`shape@1`)

`c4-maths-ch01-t02` s3 c1 and c3 compare two round things ("sikka aur anda: kaunsa circle hai?"). Studio 015 draws an oval or
an uneven outline, one to a board. The card needs both at once, each under its own name, so that the question is asked of
what is drawn.

- `shape@1` with `pair: [{ shape, name, … }, { shape, name, … }]`: two outlines side by side at the same height, each with its
  own name under it and, where given, its own centre and radii (015's params, per outline).
- The radii view draws each outline's radii at their own lengths.
- The checker's rule that a card which says "circle" needs a circle drawn reads either outline of a pair.

## 2. A four-sided shape with unequal sides, drawn to scale (`measured@1`)

`c6-maths-ch06-t01` s1 c1: "chaar bhujayein alag-alag lambai ki hain", sides 9, 6, 7 and 4 m, drawn as a square with four
labels: the 9 m and the 7 m side are the same length on screen. `measured@1` draws a four-sided shape as a square unless it
has a `walk`, and a walk takes right angles only, which 9, 6, 7, 4 cannot close.

- `measured@1` with `shape: "quadrilateral"` and `sides: [a, b, c, d]`: a closed four-sided outline whose drawn side lengths
  are in the ratio of the numbers (any one valid shape, the same every time for the same params; refuse a set that cannot
  close). Labels as now. The `trace` param walks it as it walks a rectangle.
- The same for the five-sided follow-up card (`s1` remediation 0, sides 8, 5, 7, 6, 3, drawn as a regular pentagon).

## 3. A card that names three things and draws one

`c4-maths-ch01-t02` s1 c1 names a book, a door and a plate and asks which has corners like the tester; the board draws only
the book, straight and tilted. Either three small outlines in a row with their names (`shape@1` `row: […]`, which item 1's
pair is the two-item case of), or tell main that the card should name only what is drawn and Learning will cut it.

## 4. One label in English over a Hindi lesson (fixed by main, `9ff1d444f`)

`server/forge/explainer/templates.js` wrote "N equal parts" unless the language was exactly "hi", so a Hinglish lesson's
board printed English ("6 equal parts" under a bar she calls "6 barabar hisse"). The label now follows the file's own
`langOf`: "N barabar hisse" for every lesson language but English. Told here because the file is Studio's: check the other
labels in the template file for the same test.

## Tests wanted

One per item, drawn and read back from the drawing (as 014 and 015's are): the pair's two outlines differ and carry their
names; the quadrilateral's drawn sides are in ratio within 2%; the label follows the lesson language (item 4's test exists: `tests/r8-director11*.test.mjs` S3).
