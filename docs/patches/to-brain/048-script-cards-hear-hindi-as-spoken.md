# To Brain 048: a script card hears the answer the way a child says it

From main, 2026-11-18, while the director32 scripts were being read. Found by the independent script readers
(they ran children's phrasings through `classifyFast`) and then probed by main. Not in dc-r8-director31; this is
a fault in the product as released (release 53) and is fixed in the same round.

## What is wrong

`server/director/classify.js`, the script-grade branch (`dc-r7-script-walk-v3 K2`, about line 772): a lesson
script's keyed card is graded in code. The reply is right when it is the key or an accept form, it is the named
mix-up when it is `wrongIfMis`, and **any other reply of three words or fewer, or with one number, is marked
incorrect without a model reading it.** That last step assumes the reply was written the way the script writes
its forms: Latin Hinglish with digits. It is not, on the voice lane or for a child who says her numbers in Hindi.

Probe (main, 2026-11-18, `classifyFast` called directly with `mode: "item"`, `item.scriptCheck: {}`, n = 27
replies, every one of them the right answer to its key; 22 were graded incorrect, the table shows them and three
of the five that passed):

| key | reply | graded |
|---|---|---|
| 2 | `do`, `do hain`, `do hisse` | incorrect |
| 2 | `दो` | incorrect |
| 3 | `तीन` | incorrect |
| 1500 | `pandrah sau`, `पंद्रह सौ` | incorrect |
| 130 | `ek sau tees`, `एक सौ तीस` | incorrect |
| 600 | `chhah sau` | incorrect |
| 25 | `pachees`, `पच्चीस` | incorrect |
| 1/4 | `एक बटा चार` | incorrect |
| 12 wali patti | `12 wali`, `बारह वाली` | incorrect |
| 3 | `teen`, `mujhe lagta hai teen` | correct |
| 4 | `chaar hai na` | correct |

`server/grading/spoken-number.js` (round 5, the one reader for spoken numbers) reads every number in that table
correctly in both scripts (`numbersIn("pandrah sau")` = 1500, `spokenNumber("पच्चीस")` = 25). The script branch
does not use it: it uses the 40-word Latin table `HI_NUMS` and skips `do` outright. Azure's recogniser writes
Hindi-led speech in Devanagari (`server/voice/expressive/lint.js` records this), and nothing brings a child's
words to Latin before `classifyFast` (`server/brain/turn.js:481`, `server/latency/perceive.js:77` pass the text
as heard). So on a voice lesson a right answer said in Hindi is told it is wrong. No paid run has seen this:
every run's child types Latin Hinglish.

## What to build

**G1. One number reader.** In the script branch, numbers in the reply are read by `spoken-number.js` (both
scripts, hundreds and thousands, the fused hundreds, 21 to 99, `dedh` / `dhai` / `sadhe` if the reader has
them), and so are numbers in the key and accept forms. `do` is two when the reply is a number phrase or the key
is a number (`do`, `do hain`, `do hisse`, `do bata aath`); it stays the verb in a longer sentence. Delete
`HI_NUMS` and `hindiNumbers` if nothing else needs them; one reader, not two.

**G2. A reply in Devanagari is compared in Devanagari, and is never marked wrong for its spelling.** Bring the
key, the accept forms and `wrongIfMis` to Devanagari with `server/voice/translit` (`toDevanagari`) and compare
on the same normal form as the reply (numbers by G1, the filler words of `WORD_FILL` and the pairs of
`WORD_SAME` on one footing in both scripts: हाँ / नहीं / बराबर / बड़ा / छोटा / ज़्यादा / कम / पहले / बाद / बीच / आगे /
पीछे, with and without nukta and candrabindu). A match is graded as today. **No match, and the reply has
Devanagari letters: the code does not grade it.** It goes to the model with the key, as before K2, because the
code cannot tell another spelling of the right answer from a wrong answer. A number that differs from a numeric
key is still wrong in code (G1 makes that safe in both scripts).

**G3. The noun may be dropped.** When the prompt offers options (`A ya B`, or the script's own option list) and
the reply holds every word that sets one option apart from the others and no word that sets another apart, it
is that option: `12 wali` for `12 wali patti`, `Neha ka kam` for the option worded that way in the prompt. Only
when exactly one option qualifies. This replaces most of the hand-listed short forms; the lists stay as they
are.

**G4. A gate that says the answer the way a child would.** `tests/r8-script-cards-hear.test.mjs`: for every
keyed card of every script in `data/lesson-scripts/` (and, with `LESSON_SCRIPTS_DIR`, the staged ones), build
the right answer's spoken forms in code and grade each through `classifyFast`:

- the key bare; with `hai`, `hai na`, `wala` / `wali`, `mujhe lagta hai …`, `shayad …`
- a numeric key as digits, as Latin Hindi words and as Devanagari words (from the reader's own tables, so the
  test and the reader cannot drift apart), with and without the key's unit; a fraction as `a/b`, `a bata b`,
  `a by b`, `एक बटा चार`
- a yes / no key as `haan` / `nahi` / `हाँ` / `नहीं` / `ji haan` / `bilkul nahi`
- an option key without its shared noun (G3), and in Devanagari through `toDevanagari`

Every form must grade correct or go to the model; **none may grade incorrect or as the mix-up.** And the
card's `wrongIfMis`, said the same ways, must grade as the mix-up or go to the model, never correct. The test
prints script, card and phrase for each failure. Cards it cannot build forms for are counted and listed, not
skipped silently.

**G5. Two things 047 may have left** (check before building; skip what is there):
- a picture request at a card on the checker's `PICTURE_NONE` list gets the card's hint, said as help, not
  "there is nothing to draw" and not the same board again;
- a card's `pictureBoard` + `pictureCaption` are what a picture request draws.

**G6. One line about a picture, not two.** Where a script card has a `viewCaption` or `pictureCaption`, the
engine's own line for the view ("do sankhya rekhayein …") is not also said: the script's caption is the line.
The comparing-fractions reader found the two-scale line view captioned "ek number line" by the script while the
engine line says two.

## Measure

- The probe table above, as the first test in the G4 file: all 27 right.
- G4 over the five live scripts and the two staged rewrites: 0 right forms graded incorrect or as a mix-up; 0
  wrong forms graded correct. Report the counts (cards, forms, sent to the model).
- The dry matrix and `check-run.mjs` unchanged at 0 (the typed child's lessons do not change).
- `tests/r5-spoken-numbers.test.mjs` and the grading suites pass.

## What would reverse this

G2's "Devanagari with no match goes to the model": if a judged voice run shows the model crediting wrong
Devanagari answers at these cards (a false key), the forms are authored in both scripts instead and the code
grades them. G3: if the gate or a judged run finds one reply fitting two options, G3 is withdrawn and the short
forms go back to being listed by hand.
