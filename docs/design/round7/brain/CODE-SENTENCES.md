# F1: every sentence code can say (dc-r7-script-walk-v6-11)

**Scope:** every sentence and frame code writes into her line: the tables in `server/brain/say.js` and the closes built from a script's own fields.

**Counts:** how many of director19's 594 teacher turns (16 lessons) contain the form, counted over the run's records with a substring match on each form's longest fixed part. A count of 0 can also mean the form was added after the run (v6.10 step 1).

**Proposals:**

- **A**: authored per topic in the script, three forms (Learning).
- **K**: kept as a neutral code frame of at most three words.
- **R**: removed.
- **S**: safety floor. Frozen: its meaning is not touched in this pass.

Main rules on each row; Learning authors the A rows.

## Asides and joints

| Table (say.js) | Forms (Hinglish) | d19 | Proposal |
|---|---|---|---|
| `PARK_LATER` / `PARK_ACK` | "{aside} ki baat hum thodi der mein karenge." ×3; "…is sawaal ke baad…" ×3 | 0 | **A**. Already the script's `joints.asidePark` (D13). The code sets are a fallback only for a topic without a script, so remove them once all 34 scripts carry the joint. |
| `RETURN_Q` | "Ab tumhari {t} wali baat: usmein tumhe sabse achha kya lagta hai?" ×3 | 0 | **A**. D14's `joints.asideReturn` is one question on {aside}. Remove the code set when every script carries it. |
| `ASIDE_AGAIN` | "{t} wali baat maine likh li hai." ×2 | 0 | **A**, new joint kind `asideAgain`, three forms. |
| `ASIDE_RESUME` / `NEUTRAL_ACK` | "Achha." "Theek hai." "Hmm, achha." | Theek hai. 59, Achha. 28 | **K**. These are the neutral joint. "Hmm, achha." becomes "Hmm." (≤3 words). |
| `LANG_ACK` | "Theek hai, Hindi mein." ×3 | 0 | **A**. Already `joints.hindiSwitch`. Remove the code set with the joint everywhere. |
| `ASK_AGAIN` | "Ek baar phir bata do, tumhara jawab kya hai?" ×3 | 0 (d19 used the joint: "Mujhe theek se sunai nahi diya" 2) | **A**. Already `joints.askAgain`. Learning: the d19 form claims she did not hear, and is a yes/no question. Re-author it for "already answered" as well. |
| `honestTasteLine` | "Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe {t} ke baare mein…?" (3 forms) | 12 | **S**. Its meaning is frozen. The question back after the honest clause may become **A** later. |

## Verdicts and keys

| Table | Forms | d19 | Proposal |
|---|---|---|---|
| `FRAMES.right` | "Haan, sahi hai" / "Bilkul sahi" / "Haan, bilkul theek" / "Sahi jawab" | 79 / 53 / 28 / 10 | **K**. Short, neutral, already rotated. Then the card's authored why. |
| `FRAMES.notRight` | "Nahi, yeh jawab nahi hai." / "Yeh jawab sahi nahi hai." / "Abhi yeh sahi nahi hai." / "Nahi, yeh theek nahi hai." | 34 / 7 / 3 / 1 | **K**, cut to three words or fewer: "Nahi, abhi nahi." / "Yeh nahi." / "Abhi nahi." The not-right is the verdict, and the remediation carries the teaching. |
| `ECHO_NOT_RIGHT` | "{x} sahi nahi hai." / "Jawab {x} nahi hai." / … | 52 / 90 / 9 / 1 | **K**, kept as the first form only: "{x} sahi nahi hai." It names the child's own answer, so it is not a code sentence about the child. Remove "Jawab {x} nahi hai" (90: the most repeated line in the run). |
| `GAVE_FORMS` | "Is sawaal ka jawab {a} tha{, kyunki why}." ×9 | 12 / 4 / 1 / 12 / 4 / 1 / 4 / 0 / 1 | **A**. A new card field `giveUp` (three forms with {key} and {why}), or **K** as "Jawab: {a}, kyunki {why}." Proposal: K. The key and the why are authored already, and the frame is two words. |
| `GAVE_LINE` | "Pichhle sawaal ka jawab {a} tha…" | 0 | **R**. A key belongs to its own card's turn (the R7 split). |
| "Toh poora jawab: {a}." (worked close) | 1 form | 7 | **A**. The worked example's `answer` is already a sentence ("kyari ke liye 28 m baad lagegi"), so it is said bare and the frame goes. |
| `IGNORED_LEAD` | "{n}, tumne kaha. Saath mein dekhte hain." | 0 | **R**. A number they said is graded or re-posed, never echoed. |

## Re-pose, pace and steps

| Table | Forms | d19 | Proposal |
|---|---|---|---|
| `FRAMES.again` | "Phir se dekho:" / "Ek baar aur dekho:" / "Sawaal yeh hai:" / "Dhyan se dekho:" | 42 / 16 / 5 / 0 | **K**. Only on a real re-pose (step 1's `posedAt`), cut to "Phir se:" / "Sawaal yeh hai:". |
| `TRY_FIRST` | "Haan, pehle tum try karo —" ×3 | 16 | **K**, as "Theek hai, tum karo." (3 words), then the card. |
| `BEAT_ASK` / `WORKED_ASK` | "Yahan tak theek hai?" / "Ab tak samajh aaya?" / "Yahan tak saaf hai?" / "Yeh hissa saaf hua?" / "Yeh kadam saaf hai?" / "Yeh kadam samajh aaya?" | 23 / 10 / 18 / 18 / 3 / 8 | **A**. The check-in after a point is a part with its own cell in C1. Learning authors three per topic (the topic's own noun: "Yeh roti wala hissa saaf hua?"), and the code set stays as a three-word fallback. |
| `SPLIT_CARD` | "Ab isi par ek sawaal." ×3 | 3 | **R**. The card follows its teaching directly, or the check-in comes (C1 `then`). |
| `WORKED_GO` | "Ab agla kadam dekhte hain." ×3 | 1 | **R**. A step's own line opens it (v6.9 R6). |
| `WORKED_FRAME` / `WORKED_FRAME_PART` | "Chalo, ek sawaal saath mein hal karte hain." ×3 / "Yeh hissa dekho." ×3 | 0 / 0 | **A** for the worked opening, as a new field `workedExample.open`, three forms. **R** for the part frames. |
| `stepLabel` | "Pehla kadam dekho." / "Ab doosra kadam." / "Ab teesra kadam." | Pehla kadam dekho. 10 | **K**, as "Pehla kadam." / "Doosra kadam." / "Teesra kadam." (≤2 words, the step's own number). |
| `REMEDY_FRAME` | "Chalo, ise ek naye tareeke se dekhte hain." ×3 | 0 | **R**. The remediation's own `say` opens it. |
| `ALT_POINT` | "Ise dhyan se dekh lo." ×3 | 0 | **R**. |
| `NO_PICTURE` | "Iski doosri tasveer abhi nahi ban rahi…" ×3 | 1 | **A** as a per-topic joint `noPicture`, three forms, which keeps it true of that topic's boards. Until then, **K**. |
| `BREAK_OFFER` | "Thoda ruk jaate hain. Chuno: aage badhein, chhota break lein, ya aaj ke liye band karein?" | 0 (the menus used the model shape) | **K**, as the menu's own chips, with the sentence cut to "Thoda ruk jaayein?" |

## Fallbacks and safety (S, unchanged)

`FALLBACK.*` (wrap, safeguard, safeguardCheck, other, heard, stuck, checkinStop), `STAY`, `CARRIED`, `HELPED`, `CHECK_IN` and the helpline lines: **S**. They are counted 0 in d19 except the wrap (1 per lesson), and are not touched in this pass.

## Totals

- **A** (authored per topic): 11 kinds. 5 already exist as joints (park, return, Hindi switch, ask-again; plus the AI line's question, later). New: `asideAgain`, `noPicture`, the check-in forms, `workedExample.open`, the worked answer said bare.
- **K** (≤3-word code frames): 9.
- **R** (removed): 7 (`GAVE_LINE`, `IGNORED_LEAD`, `SPLIT_CARD`, `WORKED_GO`, `WORKED_FRAME_PART`, `REMEDY_FRAME`, `ALT_POINT`).
- **S** (frozen): the safety and fallback lines.

**The proof is G2:** a dry predicate `codeSentence` lists every sentence of every turn that is neither authored (it matches a script field) nor an approved K frame. It is seen failing today, and it reads 0 once the rulings land.
