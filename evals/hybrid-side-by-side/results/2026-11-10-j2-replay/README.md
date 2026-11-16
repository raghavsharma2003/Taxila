# J2 replay, 2026-11-10: why her reply sentence to an aside is refused

**Run by:** the main loop, on int/r6 e43790b66 (integration 32: Brain 882f27220). **Method:** `evals/hybrid-side-by-side.mjs --matrix --director-only --reactive --topics c4-maths-ch05-t01,c5-maths-ch02-t02,c6-maths-ch06-t01 --scenario offtopic --dry --j2-live 20 --j2-usd 0.10`. The lessons are dry; each of the 3 aside returns sent its own real prompt to the live reply model 20 times. **n:** 3 exchanges x 20 drafts = 60. **Cost:** $0.053. The child is the harness's simulated child; no real child's words.

| Exchange (what the child said) | Pass | First sentence refused by |
|---|---|---|
| c4: "jab Virat chauka maarta hai, woh" | 4 of 20 | echo 16 |
| c5: "batting sabse achhi lagti hai" | 6 of 20 | echo 7, promise 4, rule 2, lesson 1 |
| c6: "batting sabse achhi lagti hai" | 2 of 20 | echo 18 |
| **All** | **12 of 60 (20%)** | **echo 41**, promise 4, rule 2, lesson 1 |

## What it shows

- **The predicate is right and the model echoes.** 41 of 48 refusals are `echo`: the draft opens by repeating the child's sentence ("Batting sabse achhi lagti hai." word for word, or with "samajh gaya" / "accha chunav" added). The note already says "never three of their words in a row"; the model does it anyway.
- **The two suspects are not the cause.** `rule` refused 2 of 60 ("Batting ka maza alag hota hai, bat se shot lagana." is harmless; "Batting mein timing aur shot chunna zaroori hota hai." is a general rule and rightly refused). `lesson` refused 1, rightly ("ab fractions par dhyaan dete hain"). `promise` refused 4, rightly ("ab maths par lautte hain": the code says the return).
- **The 12 that pass are the sentence we want**: "Batting ka maza alag hi hai, Riya.", "Batting dekhna bhi mazedaar lagta hai.", "Virat ka chauka dekhkar cricket ka maza badh jaata hai."
- **A fault the predicate did not name:** 4 drafts speak as a man ("samajh gaya"). They were refused, but only because they also echoed. One draft says "yeh baat yaad rakhungi" (a promise to remember), also refused only as an echo.

`j2-replay.json` holds every draft with the clause that refused each sentence.
