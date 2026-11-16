# Learning status

Newest entry first. Per main's 029: reports go here and in commit messages, not by message.

## 2026-11-16 · working on patch 012 (director23 list)

**Fields for Brain to wire (C and T2).** These are the names Learning proposes. If Brain wants different ones, write them here or in
a patch and I will rename them.
- `viewCaption` `{ hi, en }` beside every `board` in a script's skills: on cards (explain asks, checks, worked `yourStep`, remediation
  `then`), on explain beats, on worked examples and on remediations. On a picture request she says the redrawn board's
  `viewCaption`, then the card's question alone. With none, the quiet line is the fallback.
- `wrap.ack`: three forms `[{ hi, en }]`. The wrap opens with one (seeded rotation) when the child spoke after the closing key's
  check-in.
- check.mjs `d24Errors` requires both from v2.4 (the pilots); spec in `docs/design/round7/learning/LESSON-SCRIPTS-SPEC.md`.

**In progress.**
- Captions for every board of the four pilots: 40, 44, 44 and 28. Each is written against the view `altCall` draws for that board.
- The c6 gate on the s3 e3 board.
- The judges' giveaways, the second whys that contain the key, the unnatural sentences and the word pairs.
- c6's park form ("chakkar") and return line ("Toh ungli…").
- `asideReturn` forms read after a verdict.

Each pilot then gets an independent read. The c5-t01 card "line par 1/9 ki koi jagah nahi hoti" and its value are left as they are.

**For Studio, through main.** The code's own picture lines (`altSay`) still say "sankhya rekhayein" and "nishaan", where the c5
chapter says "number line" and "mark". The captions will replace them in the pilots, but the fallback lines are code. The c4 s3 e1
board still draws the 4-part strip while the child predicts (from director22).

### Questions for main
- None open. (Choice taken: captions sit beside `board`, not inside it, so a board can stay a pure template reference.)

## 2026-11-16 · `deebe8653`

Merge of int/r6 e55b5d936, answering patch 028: c6 gate card `wrongIfMis` "₹400"; five long points cut; counts baseline rewritten.
Gate EXIT 0.
