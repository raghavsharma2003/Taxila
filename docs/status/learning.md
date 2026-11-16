# Learning status

Newest entry first. Per main's 029: reports go here and in commit messages, not by message.

## 2026-11-16 · patch 013 (director24 list): done in the push after this entry (Brain's 036: the name is `did`)

**Fields for Brain to wire (clause 4).** These are the names Learning proposes; if Brain wants different ones, write them here.
- `did` `{ hi, en }` on every check card (`skills[i].checks[j]`) and on `teachback`. It is a second-person clause said after
  "Aaj tumne" / "Today you", with no answer number where the doing matters more.
- `wrap.didFrames`: three frames `[{ hi, en }]`, each with one `{did}` slot ("Aaj tumne {did}."). Rotate by the lesson seed.
- check.mjs `d25Errors` requires both from v2.4; the spec is in LESSON-SCRIPTS-SPEC.md.

**For Brain (found while reading):**
- In an English lesson a key is said as written, so a key made speakable in Hinglish ("mark se pehle", "Gopi se kam") would be said
  in Hindi there. Pick an English accepted form for English lessons in `keyInLang` and `workedAnswerOf`. The English forms are in
  `accept`.
- "Yeh hissa saaf hua?" is a `BEAT_ASK` line in `server/brain/say.js`. In these lessons "hissa" is a fraction part; Learning cannot
  change that line.
- c6 also carries `did` on explain asks and worked steps, because in the steady run code picked those cards. Read `did` from any
  card that has one.

**Done.** The did clauses, the help wordings (point simplers that previewed the card, worked simplers that paraphrased), the
c5-t01 captions, the word pairs and sentences, and `asideReturn` read as a whole turn. Each pilot had an independent read, and its fails were fixed. The dry matrix reads 0 on every gated predicate, and the counts match int/r6's baseline.

## 2026-11-16 · `3e25c5c60` patch 012 (director23 list): done

**Fields for Brain to wire (C and T2).** These are the names Learning proposes. If Brain wants different ones, write them here or in
a patch and I will rename them.
- `viewCaption` `{ hi, en }` beside every `board` in a script's skills: on cards (explain asks, checks, worked `yourStep`, remediation
  `then`), on explain beats, on worked examples and on remediations. On a picture request she says the redrawn board's
  `viewCaption`, then the card's question alone. With none, the quiet line is the fallback.
- `wrap.ack`: three forms `[{ hi, en }]`. The wrap opens with one (seeded rotation) when the child spoke after the closing key's
  check-in.
- check.mjs `d24Errors` requires both from v2.4 (the pilots); spec in `docs/design/round7/learning/LESSON-SCRIPTS-SPEC.md`.

**Done (gated: merged int/r6 9b60d6f13; all suites green, see the commit; dry matrix 0 on every gated predicate; counts baseline rewritten).**
- Captions for every board of the four pilots: 40, 44, 44 and 28. Each is written against the view `altCall` draws for that board.
- The c6 gate on the s3 e3 board.
- The judges' giveaways, the second whys that contain the key, the unnatural sentences and the word pairs.
- c6's park form ("chakkar") and return line ("Toh ungli…").
- `asideReturn` forms read after a verdict.

Each pilot had an independent read, its fixes, and a second read of every fix. The c5-t01 card "line par 1/9 ki koi jagah nahi hoti" and its value are left as they are.

**For Brain and Studio, through main (code faults the readers found):**
- `wholes@1` takes at most two wholes, so the picture view of a three-whole card fails with `wholes_count` and draws nothing new.
  This hits c4 s3 c3, c5-t02 s1 c2 and c5-t02 s3 c1; their captions stay true of the board itself.
- A strip board's second view is circles while the card names upper and lower strips. The c4 captions map each circle to its strip.
- c5-t02 s3 e3's view draws 3/5 and 3/8 as circles in unequal pieces.
- c5-t01 s1 e2's view draws an 8-part strip just before the card whose key is 8.
- A two-denominator `fraction-line@1` is one line with gaps above and below it; the scripts now say "line ke upar / line ke neeche".

**For Studio, through main.** The code's own picture lines (`altSay`) still say "sankhya rekhayein" and "nishaan", where the c5
chapter says "number line" and "mark". The captions will replace them in the pilots, but the fallback lines are code. The c4 s3 e1
board still draws the 4-part strip while the child predicts (from director22).

**For Brain (walk faults seen on a c4 path, not in script text).** When the c4 s1 e1 point was shortened, it went out in the same
turn as its card, and the dry matrix showed two walk behaviours that the usual path does not reach. I put a sentence back (with no
giveaway) so the gate stays at 0, but the faults are there:
- stuck 48: a second "samajh nahi aaya" at a remediation then-card's check-in is answered with an earlier card (the pizza e2),
  which shows as clarifyCard plus orderStays.
- steering 34: two give-ups at a check-in get the hint, then the hint again with the whole card (cardWholeAgain).

### Questions for main
- None open. (Choice taken: captions sit beside `board`, not inside it, so a board can stay a pure template reference.)

## 2026-11-16 · `deebe8653`

Merge of int/r6 e55b5d936, answering patch 028: c6 gate card `wrongIfMis` "₹400"; five long points cut; counts baseline rewritten.
Gate EXIT 0.
