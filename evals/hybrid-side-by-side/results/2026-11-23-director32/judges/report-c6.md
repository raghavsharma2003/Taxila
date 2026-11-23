# c6 (c6-maths-ch06-t01), director32: hand report

**c6 fails one gate line: false keys.** Under director31's ruling 1, a stated wrong rule counts as a false key. Here that is one rule, said in 3 rows, from 2 script lines (layer a), so it is not a code failure (clauses 27 and 34). Every other line passes, and every axis is at 3.5 or above.

## A. Hand counts

| Lesson (rows) | Beats | Verdicts / keyed | Contradictions | Unsaid boards | R→W / W→R | False keys |
|---|---|---|---|---|---|---|
| steady (103) | 49/49 | 35/35 | 0 | 0 | 0/0 | 1 row (16) |
| stuck (79) | 38/38 | 24/24 | 0 | 0 | 0/0 | 1 row (72) |
| offtopic (67) | 32/32 | 21/21 | 0 | 0 | 0/0 | 1 row (40) |
| steering (67) | 32/32 | 18/18 | 0 | 0 | 0/0 | 0 |
| **D32** | **151/151** | **98/98** | **0** | **0** | **0** | **1 rule, 3 rows** |
| D31 | 148/148 | 107/107 | 0 | 0 | 0 | 0 |

**The false rule (G1), "multiplication is not perimeter":**
- s1 `remediation[1].say`, "Parimap mein bhujayein jodte hain, guna nahi." (steady 16, offtopic 40). Two turns earlier the lesson's own verdict says "6 × 5 = 30 cm" for the hexagon's perimeter, and s2 then teaches 2 × (l + b) and 4 × bhuja.
- s2 `remediation[1].sayAlt`, "guna sirf andar ke square ginta hai" (stuck 72). It comes six turns after "seedha 4 × bhuja" (stuck 66). The bookmark card it leads to has its own whyAlt, "poora uska do guna, 26 cm".
- The true wording is already in the script: s1 `rem[1].sayAlt` ("lambai aur chaudai ka guna sirf farsh batata hai").
- This passed the independent read and main's read, so clause 28 fires.

**Other checks:**
- The code's `contradictionsV6` flags (stuck 72, offtopic 42) are miss verdicts said over the answered card's own board. The gate allows these.
- Grading: every child answer agrees with its verdict, including "untees/unatees metre", "teen sau assi", "pandrah sau", "chauraasi", "add them then multiply by 2", "neela wala" and "kitni baad lagegi".

## B. Items

**Boards: working.**
- Checked by script on every row: each page starts at its part's first word, and each part that owns a board is said over it.
- Hooks are said over a blank board. Joints, lead-ins, bridges and the Hindi switch keep the board already up.
- Remediations that own no board are said over the missed card's figure, and their words are true of it.
- No point or remediation board shows what its card asks. No help is said over another part's board (D31 had 1).
- Keys: stuck 40, steering 16 and steady 98, each over its answer board.
- Board changes: 92, all in the right place. Held: 62.

**Listening: partly.**
- Requests left without help: 0. The rungs work:
  - A give-up at an asked step gets the easier wording first (now the kitaab analogy, which no longer states the step), then the told step (stuck 20→24, offtopic 16→20, steering 30→34).
  - A give-up or clarify at a bridge's check-in goes on to the next point (stuck 54, steering 46).
  - The second miss gets the card's own whyAlt where the card is marked for it (steady 90, stuck 48 and 62).
- Faults:
  - **stuck 6→8:** the Hindi turn repeats the same re-ask word for word, twice running.
  - **steering 16:** "ek aur picture dikhao" is answered with the key, because all the hints were spent.
  - **The step question is still heard three or four turns running**, now in alternating forms: stuck 16–22, offtopic 14–18, steering 28–32. These are the same rows as in D31.
  - stuck 48: the "Jodiyan banao" hint does not answer the child's left-out side.
- "Nothing easier" was said once (steering 20, "Yahi sabse seedha tareeka hai jo mere paas hai"). It is true, and it is cold.

**Help.**
- Sentences repeated from earlier in the lesson: 0.
- Same idea in the same order, new words: 2 (stuck 62, steering 56).
- Keys given with an authored wording unsaid: 0. (The yourStep whyAlt was unsaid at stuck 40, but it is not authored as help.)

**Hindi (G2).** There were 4 requests (steady 36, stuck 8, offtopic 34, steering 8), all at cards with no Hindi form. Each got a switch line that promises only Hindi, then the card's unsaid help, then the re-ask. The help is new each time but in the same Hinglish as before, so it is not more Hindi. None of the script's Hindi forms was heard; I read all three, and they are plainer than their cards.

**Turn shapes (raw tokens):**

| Shape | steady/stuck/offtopic/steering | Words | Reading |
|---|---|---|---|
| a: verdict, reason, point, card | 5/4/4/4 | 50–68 (≤64 without symbols) | The question is clear. Worst: stuck 56, the formula said and then asked again |
| b: hook, first point, card | 1/1/1/1 | 67–73 | Fine |
| c: miss, remediation, card | 5/3/3/3 | 54–60 | A teacher talking |
| d: verdict, lead-in, problem, first question | 3/2/2/2 | 61–67 | Fine |
| e: aside reply or park into the live part | 2/1/3/2 | 28–73 | steady 42 (73) is too much in one breath |

- Turns ending outside the five allowed endings: **steady 38, offtopic 28, steering 36**, each a right verdict plus a check-in before a due aside return. D31 ruled these acceptable; they are still not among the five.
- Quick questions and invitations: 0.

**Check-ins.**
- Turns ending on a check-in, by my count: steady 4 (32, 38, 68, 98), stuck 2, offtopic 2, steering 4. The README counts 2/2/2/3.
- Longest run: 2 (steering 16–18, both after the key). None inside a worked example. Not tedious.
- Over 60 words: 12/9/10/8, all tutoring. Over 75 and over 90: 0.

**Worked examples: 4.**
- All three asked steps are deciding steps: "pehle kya nikaalna hoga?", "24 aur 18 ke saath kya karoge?", "pehle kaunsi doori nikalni hogi?".
- Each child's own step is thin: 35 − 31, 2 × 42, 3 × 160.
- D31's "4 m twice" is gone. A why is said again in the next turn at steady 24→26.

**Short reason.** 12 rows, all true. One is thin: offtopic 58, "10 aur 6 do-do baar, kul 32 m", said after three misses.

**Joints.**
- Every joint form is authored. Misplaced lines, two joints at one seam, returns with no back-to line, and worked problems with no lead-in: all 0.
- After-key return (steering 20): "Is tarah ka hisaab phir aayega; tab tak pehle wala sawaal saath mein dekhte hain." It sounds like a person.
- Abrupt seams: 2. At stuck 18 and offtopic 26, the caption "Maali ke paas 35 m baad hai." is followed at once by a question that says 35 m again.
- The `seams` record matched what was said on every row I checked. `cell.part` is null on 7 rows (steady 96–102, stuck 42, offtopic 30, steering 38).

**Pictures.**
- 4 drew a view: steady 18, stuck 18, offtopic 26, steering 14. Each drew the unrolled line beside the named board, with an authored, true caption that names no key.
- stuck 18 comes close to settling its step ("kyari ka kinaara khol kar…" when the step's key is the perimeter).
- From the script, not heard: the s3 authored pictures cut the strip into 4 pieces or 2 halves, which is exactly what those cards test.

**Asides.**
- Each reply is "Achha, toh tumhe chauka sabse achha lagta hai." It is natural and the same as D31.
- steady: park 34, return 40, reply 42. steering: park 32, return 38, reply 40. stuck: AI line 42, reply 44. offtopic: park 18, AI line 30, reply 32.
- Offtopic 48, "Haan, cricket, yeh tumne bataya tha.", is true but curt.
- Every park was returned to. No taste claims. The return does not use "sixer", which the child had already said (steering 31→38; known, not built).

**Stop and bye.** stuck 78 and steering 66 are the frozen stop menu. offtopic 66 is a goodbye. Model sentences: 0.

**Wrap (steady 100, 102).**
- The closing question was missed twice; the key comes at 98 with its why.
- The two turns are "Theek hai, samajh gayi. Aaj dekha ki…" (70 words, a covered recital) and "Achha, maine sun liya. Aaj tumne pehle khet ka parimap joda, phir taar ka kharcha nikala. Aaj ke liye itna hi, phir milte hain."
- The sentence about the child uses s3 c2's `did`, answered right first time at row 83. It is true and natural. No promise to remember.

**Register (3.5).**
- Causes, 20 rows in all: (a) 1, (b) 3, (c) 3, (d) 4, (e) 5, (f) 4.
- (a) is "Dekho," said 8 times in steady; it still comes within four turns (64→72→80).

**Pace.** steady reaches the end, and s3 (side and breadth from the perimeter, fence cost with a gate, three laps) is at class level. stuck, offtopic and steering stop at the s2 worked example.

## C. Defects

| Defect | Rows | Layer | New? |
|---|---|---|---|
| The "guna nahi" rule | steady 16, offtopic 40, stuck 72 | a | new |
| Hindi turn repeats the same re-ask | stuck 6→8 | b | new |
| Second picture request answered with the key | steering 16 | b | new |
| Step question 3–4 turns running (alternating forms) | stuck 16–22, offtopic 14–18, steering 28–32 | b | carried, reduced |
| Caption repeats a given | stuck 18, offtopic 26 | a | new |
| Verdict and check-in before a return | steady 38, offtopic 28, steering 36 | b | carried |
| `cell.part` null | 7 rows | b | carried |

**Gone since D31:** help over another part's board, the giveaway easier wording, the closing question whole twice, near-copy Hindi forms, the wrap's promise, and "4 m" twice.

## D. Scores, D31 → D32

| Axis | Score |
|---|---|
| Listening | 3.5 → **3.5** |
| Worked example | 4 → **4** |
| Class level | 4 → **4** |
| Screen and speech | 4.5 → **4.5** |
| Register | 3.5 → **3.5** |
| Promises | 4 → **3.5** (switch lines promise Hindi and give Hinglish; stuck 8; steering 16) |

## E. Verdict

**c6 does not pass every line of the gate.** It fails on false keys alone, under ruling 1's strict reading: one rule, three rows, two script lines, layer a. It is not a code cause, so the batches go on.

**Clauses that fire:** 28 (a false rule got past both reads), 2 (turn endings at steady 38, offtopic 28 and steering 36), and 13 (promises; the rule is not followed in spirit at the Hindi switch).

**What would most move it:**
1. Rewrite s1 `rem[1].say` and s2 `rem[1].sayAlt` to "lambai aur chaudai ka guna andar ki jagah hai".
2. Make the Hindi turn alternate the card's form, and make what follows it actually more Hindi.
3. After a picture or a give-up at an asked step, stop re-asking the step's question a third time.

**Would I put this script in front of a child?** No, as heard: a child taught "4 × bhuja" is told six turns later that multiplication only counts the inside squares. Yes once those two lines are rewritten.

**Do the axes reach 3.5?** Listening, register and promises each reach 3.5.