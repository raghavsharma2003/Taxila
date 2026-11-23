# To Brain 050: at a script card, code says "wrong" only when it knows

From main, 2026-11-23. Found while the round d33 authors were rewriting asked steps: two of them had to change a worked
step's key from words to a number because the grader marked natural right answers wrong. Main's probe
(`classifyFast`, the gate's own `grade` helper), on int/r6 `ba3d5df61`:

| Key | Prompt | Reply | Graded |
|---|---|---|---|
| `2 se guna` | Upar ke 3 ka kya karein? | do se guna karo | **incorrect** |
| | | upar ko bhi 2 se guna karenge | **incorrect** |
| | | double karo | **incorrect** |
| | | 6 | **incorrect** |
| `2 gap chalo` | 2/5 ke liye kya karoge? | 2 gap aage jayenge | **incorrect** |
| | | do gap chalenge | **incorrect** |
| | | 2 gap | **incorrect** |
| `ek se zyada` | … ek tukda kaafi, ya zyada chahiye? | zyada chahiye | **incorrect** |
| | | do tukde chahiye | **incorrect** |
| `beech ke baad` | 4/6 beech se pehle hai ya baad mein? | baad mein | **incorrect** |
| | | beech ke baad aayega | model |

Every one of these is a right answer. 048 says of the script grader: "whatever the code cannot tell goes to the model, never
to `correct`". The same has to hold for `incorrect`, and does not: the block's last line
(`server/director/classify.js`, "`if ((R.nums.length === 1 || text.split(/\s+/).length <= 3) && … ) return done("incorrect", "script_key")`")
calls any short reply, and any reply with one number, wrong when it matched no form, whatever kind of key the card has. For
a key that is a number this is right. For a key that is words it is a guess. No judged run can show it: the scripted child
answers with the key. A real child will be told "Nahi" for a right answer, which is the fault the gate counts as a misgrade.

## Build

**W1. A key that is not a number: code says wrong only for a reason it can name.** When neither the key nor any accept form
is a bare number (with a unit at most) and the key is not a yes / no, an unmatched reply is `incorrect` in code only when one
of these holds; otherwise it goes to the model (`scriptUnsure: "word_key"`):
- it is the listed wrong answer, or the same answer as one (as today: the mix-up's outcome);
- it names exactly one option of the prompt, and that option is not a right form (the G3 picker; today it checks only the
  listed wrong answer and the forms);
- it is said the way a right form is said with other numbers (the d32 shape rule, as today);
- it is a bare yes / no to a card whose key is not one (an acknowledgement, as today: not an answer).
A reply whose only number is the number in a right form ("2 gap aage jayenge" to "2 gap chalo") is never `incorrect` in code.

**W2. A key that is a number: as today.** One readable number that differs is wrong in code; the rest is unchanged.

**W3. The plain ways of saying a word key are right in code** (so that the commonest right answers do not wait on a model
call), by one rule, not by longer accept lists: the reply and a right form are the same answer when their numbers, operators,
units and content words agree after dropping, on both sides, a closed list of words that carry no answer: the helping verbs
and endings of a spoken reply (karo, karna, karenge, kar do, karna hai, hoga, hogi, hai, hain, chalo, chalenge, chalna,
jayenge, jaana, aayega, lagega, lagenge, chahiye, do, dena) and the pointing words (upar, neeche, isko, usko, yahan, bhi, toh,
phir) **only where the form itself does not use that word as content**. An operation word (jodo, ghatao, guna, bhaag, baanto,
kaato) is never on the list. If the list cannot be made safe for a card (a form in which one of these words IS the answer),
that card is left to W1.
"do" is both a number (2) and a verb: the one number reader decides, as it does today.

**W4. A two-option prompt answered by its option's own words.** "baad mein" to "…beech se pehle hai ya baad mein?" keyed
"beech ke baad": the options of the prompt are compared with the forms by content words too (the option "baad mein" and the
form "beech ke baad" share the deciding word "baad" and the other option does not hold it), so the reply that names one option
is graded by which form that option is. Where the two options share their deciding word, the model reads it.

## Measure

- `tests/r8-script-cards-hear.test.mjs`: main's table above, every row `correct` or `model`, none `incorrect`; and for each
  key the wrong answers a child would give ("5 gap chalo", "2 jodo", "3 hi rahega", "ek kaafi", "beech se pehle", "pehle")
  never `correct`.
- The existing walls of that test unchanged: over every card of every script (live and staged), no right form `incorrect`,
  no wrong form `correct`. Report the counts before and after, and how many cards have a word key (W1 applies to those).
- A count for the record, per script: the cards whose key is words, and for each how many of its accept forms W3 makes
  unnecessary (do not delete them).
- The dry matrix is unchanged by this (the scripted child answers with keys): say so from one dry lesson before and after.

## Done means

No reply in the table is `incorrect`. Code says `incorrect` at a word-keyed card only under W1's four reasons, each with a
test. No listed wrong answer becomes `correct` or `model`. Nothing in the safety code is touched.
