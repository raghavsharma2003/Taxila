# c4 (c4-maths-ch05-t01), director32: hand judgement

**c4 passes the scale gate on every line, and every axis is at 3.5 or higher.** Listening, register and promises each reach 3.5, but only just. Clauses 2, 3, 6, 12 and 28 fire.

## A. Hand counts

| Lesson (rows) | Beats | Verdicts / keyed | Contradictions | Unsaid boards | Right→wrong / wrong→right | False keys |
|---|---|---|---|---|---|---|
| steady (109) | 51/52 (row 50, return) | 34/34 | 0 | 0 | 0/0 | 0 |
| stuck (71) | 33/34 (34, AI line) | 20/20 | 0 | 0 | 0/0 | 0 |
| offtopic (77) | 36/37 (44, AI line) | 21/21 | 0 | 0 | 0/0 | 0 |
| steering (51) | 24/24 | 15/15 | 0 | 0 | 0/0 | 0 |
| **d32** | **144/147 (98%)** | **90/90** | **0** | **0** | 0/0 | **0** |
| d31 | 144/147 | 97/97 | 0 | 0 | 0/0 | 0 (3 rows of one untrue rule) |

- I checked every `pageParts` start against `held.pages` by script and by hand. Every board starts at its own part's first word.
- `contradictionsV6`=1 on steady 68 and 100, offtopic 72 and steering 14. None is a contradiction by hand:
  - Steady 68 and offtopic 72: a miss form that names no value, said over a page whose template is null in `held` while `screen` shows the c2 board kept.
  - Steady 100: the verdict is over c2's answer board.
  - Steering 14: the caption is true of the round view.
- G1: none of the sentences heard is untrue. Rem[0] now says "gin kar ek-tihaai nahi keh sakte", and the wrap says "barabar tukdon ko hi gin kar". The D31 false rule is gone.
- G9: every child answer and its verdict agree, including "ek bata chhah", "nahi, 1/6 hai", "1/4" (for "chhota") and "sahi nahi". One accept-list risk was never heard: s2 c1 accepts "ek plate" for "kaunsa fraction".

## B. Items

**Mechanisms (D31) for c4**

| # | Status |
|---|---|
| 1 Rule denied by keys | Gone |
| 2 Picture with nothing new | Gone. 4 of 4 drew a new view |
| 3 Hindi form = card | Reduced but changed. The c2 form is deleted, yet offtopic 32 now gets "Achha, ab Hindi mein kehti hoon." plus the card word for word. Steering 8's form is the card with synonyms |
| 4 Question 3+ turns running | Reduced. Offtopic 58–62 (step prompt/reask/prompt). Steering 6–16 has 6 turns on the Pinky card (child-driven) |
| 5 Short ask out of place | Gone. Steady 96, stuck 6 and offtopic 24 all follow the card's own hint |
| 6 False back-to | Gone (7 of 7 valid) |
| 9 Help misses the mistake | **Still there.** See Help below |
| 10 Wrap ack | Gone. Steady 106: "Hmm, theek hai, samajh gayi." |
| 11 Stitched told step | Gone. Stuck 42 is a sentence |
| 12 Return ignores the child | **Still there.** Offtopic 56: "Haan, sixer maara, yeh tumne bataya tha." The sixer is new |
| 13 Script lines | s3 asked step is still recall (below). s3 close now says "6 wali ka tukda chhota" |

**Help**
- Nothing new: 2.
  - Offtopic 32: a Hindi request answered with the bare card. **Clause 3 fires.**
  - Stuck 46: the problemAlt restates row 38's "rangin tukde … plate par bache".
- New words, same idea: 6 (steady 48; stuck 30; offtopic 52; steering 8, 16 and 32).
- G7 misses:
  - Steering 30 and 32: two point wordings about the 1/8 strip at the Raju card. The card's whyAlt ("kaatne se pehle 6 tukde the…") is never said.
  - Offtopic 52: the pointAlt about 1/6 at a 1/3 card.
  - Stuck 26–32: three restatements of "neeche = saare" against "Golu", then the key. The one sentence that answers Golu, then.whyAlt "2/2 ka matlab poori chocolate hoti", is never said.
- Keys: stuck 32 and offtopic 34, both over their answer boards. Offtopic 34 is a key where a hint would have done.
- "Nothing easier" line: said 0 times.

**Turn shapes**

| Shape | n | Words | Worst |
|---|---|---|---|
| (a) verdict, reason, point, card | 16 | 55–66 | steady 86 (66, Zoya) |
| (b) hook, point, card | 4 | 67–71 | fine |
| (c) miss form, remediation, card | 8 | 56–59 | fine |
| (d) verdict, lead-in, problem, step | 7 | 54–70 | stuck 38 |
| (e) reply or park into the live part | 6 | 47–69 | offtopic 56 |

- **Endings outside the five allowed: 6.** These are check-ins after a right verdict inside a skill: steady 46, 56 and 70, stuck 68, offtopic 54 and 74. They come from the listed-whole and return-wait split, and none carries `noFit`. **Clauses 2 and 6 fire.** Steady 46→48 is the longest run (2): the child's give-up added a second check-in while the aside return waited.
- Turns over 60 words: 25 (steady 10, stuck 4, offtopic 6, steering 5). Over 75: 0. The 75-word sayAlt plus card turn (steady 10, stuck 26, steering 12) reads as monologue.
- Short reasons: 11 rows, all true and enough. Not built: steady 86 at 66 words; a reason said in two turns running at steady 88→90.

**Worked examples**
- s1 step "neeche wala number kya hoga?" is a deciding step.
- s2 step "3 barabar group … ya 3-3 ke group?" is a deciding step.
- s3 step "chhota tukda kaunsi chocolate se aayega?" is recall: "zyada tukde, chhota tukda" was said earlier in the same turn (steady 88).
- None reads as a recital or a quiz of sums.

**Boards and G8**
- 89 turns changed the board, all in the right place. 8 help turns paged to their own board and back. 47 turns held the board.
- **s3 e1 gives itself away:** the prediction "Isi patti ko ab 4 barabar tukdon mein kaato" is posed over a bar already drawn in 4 beside the half (steady 76). **Clause 28 fires.**
- The s3 rem then-card (cakes 9 vs 7) and the s3 own step (3 and 6 strips aligned) are readable by eye.

**Pictures**
- 5 requests. Each view was named and drawn, with an authored caption that is true of it and names no later card:
  - steady 18: strips;
  - stuck 18: the circle as a strip;
  - offtopic 26: strips;
  - steering 14: a circle.
- Steering 16 (second request) got the remediation's hint, as designed.

**Asides**
- Steady:
  - Park 44, then a return alone at 50 ("Cricket ki baari aa gayi…").
  - Her reply at 52: "Achha, toh tumhe batting sabse achha lagta hai." Natural.
  - The park and afterPark joints read "kaam poora ho jaaye. Ab yeh kaam poora karte hain." This is carried from D31.
- AI lines: stuck 34 and offtopic 44, both authored and both answered with the batting reply.
- Offtopic:
  - The park at 36 is never returned to.
  - Her reply at 56 is odd: it misstates the child.
- No taste claims.

**Wrap (steady 106/108)**
- The closing verdict says its why (104).
- The acks fit what the child said.
- "Aaj tumne teen chocolate ke tukde chhote se bade tak lagaye: 1/10, 1/7, 1/4." is true: s3 c3 was right at the first try (row 101).
- The covered turn is 69 words.

**Record (clause 12)**
- `cell.part` is null on steady 72 and 104, stuck 34 and offtopic 36.
- Stuck 42 records "Nahi, yeh nahi hai." as a `point`.
- `held.pages` shows null where the screen kept the board (steady 68 and 72, offtopic 72).
- Reader: 0 lines recorded as the wrong kind.

**Other items**
- Stop: stuck 70 and steering 50 get the frozen menu. Offtopic 76 is the authored goodbye.
- Model words: 0.
- The s2 and s3 hooks are never said (steady 44 and 76, stuck 62, offtopic 46). The cricket slot is unused again.
- Joints: stuck 62 "Theek hai, main shuru karti hoon." after "samajh nahi aaya" at the bridge is abrupt.
- "Haan, pehle tum try karo." at offtopic 38 drew "phir se bolo".

**Frames.** "Dekho," steady ×9 (within 4 turns: 16/22, 74/76), stuck ×4, offtopic ×5. "Toh poora jawab:" ×3 in steady. Check-in forms rotate four ways.

**Pace.** Steady reaches the end of the script, and the third skill is taught at class level. Stuck stops at s2 e2 and steering at the s1 bridge (both on their scripted stops). Offtopic ends at s2 rem on the child's "bye".

## C. Defects

| Defect | Rows | Layer | New? |
|---|---|---|---|
| Hindi request → switch line + same card | o32 | b | new |
| Check-ins after a right verdict, no `noFit` | s46, s56, s70, k68, o54, o74 | b | carried, more |
| Help misses the mistake (card whyAlt never used) | r30, r32, o52, k26–32, k46 | b/a | carried |
| Return reply misstates the child | o56 | c | carried |
| s3 e1 posed over its answer | s76 | a | newly seen |
| s3 asked step is recall | s88 | a | carried |
| s2/s3 hooks never said | above | b | carried |
| Record gaps | above | b | carried |

## D. Scores (director31 → director32)

| Axis | Score |
|---|---|
| Listening | 3.5 → 3.5 (o32, G7 misses, o56) |
| Worked example | 3.5 → 3.5 (s3 step) |
| Class level | 4 → 4 |
| Screen and speech | 4 → 4 |
| Register | 3.5 → 3.5 |
| Promises | 3.5 → 3.5 (o32 Hindi promise, o36 park unreturned) |

**Register: the five rows per lesson that most hold it down, by cause.**

| Cause | Rows |
|---|---|
| (a) fixed form | 0 |
| (b) script sentence | 1 (r26 "8 saare tukde ginta hai") |
| (c) verdict and why as written | 3 (s56 "sahi hai: … banao:", k32, o54) |
| (d) length or shape of turn | 5 (s86, s106, k38, o18, r34) |
| (e) help | 8 (s10, k26, k46, o32, o52, r8, r12, r30) |
| (f) other | 3 (s44 joint, k62 startAnyway, o56 reply) |

## E. Verdict

**c4 passes the scale gate on every line, with every axis at 3.5 or higher. Listening, register and promises each reach exactly 3.5.**

The changes that would most move it:
1. Make the card's whyAlt the second help after a miss.
2. Close the Hindi-request path that ends on a bare card.
3. Stop ending on a check-in after a right verdict; split the turn on the point instead.

I would put this script in front of a child: it is true, its boards are honest, and it listens to most requests.

What the gate does not measure: a stuck child hears "neeche wala number saare tukde ginta hai" four times in four wordings and is never told the one thing their mistake needs. A parent would also hear "Dekho," nine times and an invented "yeh tumne bataya tha".