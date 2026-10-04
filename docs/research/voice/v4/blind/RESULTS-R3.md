# Voice blind round 3 — results (2026-10-04)

Raters: owner and one friend (equal weight), 20/20 clips each, scored 1-5 on "sounds like a real teacher talking to me".
Unblinded with blind-key.json. Names and raw ratings stay out of git (scratchpad only).

| arm | owner | friend | equal-weight |
|---|---|---|---|
| A: DragonHD Diya, the round-2 clip (anchor) | 2.40 | 2.40 | **2.40** |
| B: Diya, new spoken-register line, plain SSML | 2.60 | 2.20 | **2.40** |
| C: Diya, new line + per-clause delivery plan (breaks, slow-downs, pitch -8%) | 2.00 | 2.20 | 2.10 |
| D: Nova 2 Sonic kiara, new line + situation prompt | 2.00 | 1.20 | 1.60 |

Per card (equal-weight mean of the two raters):

| card | A | B | C | D |
|---|---|---|---|---|
| L1 think-aloud | 3.0 | 3.0 | 2.5 | 1.5 |
| L2 joke | 1.0 | 1.5 | 1.0 | 1.5 |
| L3 surprise | **3.5** | 1.5 | 2.5 | 1.5 |
| L4 correction | 2.5 | **3.0** | 2.5 | 2.0 |
| L5 wonder | 2.0 | **3.0** | 2.0 | 1.5 |

Failure ticks and notes (paraphrased):
- **Joke card, every arm:** "no emotion". Two clips were marked "weird cold drink pronunciation" (an English word in a Hindi frame), and one got "accent switch".
- **Delivery plan (C):** "choppy", "too slow", "pace". The planned pauses landed where intended (21/21 on the machine screen), and listeners still heard them as choppy.
- **Nova kiara:** "reading" and "choppy" from the friend on 4 of 5 cards.
- **B on L3:** "pause, choppy, reading". That line is written in comma-chopped fragments ("ऊपर भी चार से, नीचे भी चार से, divide!").
- **Wonder:** "पता है" heard as flat, not curious, on A. C's wonder was "slow, but the emotion was good at the end".

## What this says
1. **Markup is exhausted.** Three rounds put stock DragonHD Diya at a 2.4-2.6 ceiling. A per-clause SSML delivery plan made it worse, not better (2.1). Exact pause placement does not create feeling; it reads as choppy. `rj-ssml-delivery-plan-2026-10-04`.
2. **Spoken-register text helps when it flows.** B beat A on correction (+0.5) and wonder (+1.0) and tied on think-aloud. It lost on surprise, where the line itself was fragmented. Keep the writing rules, minus the fragmenting.
3. **No stock voice can do emotion.** The joke card scored 1.0-1.5 on every arm in rounds 2 and 3. Laughter, playfulness and surprise are not reachable by markup on these voices.
4. **Nova kiara is out** (1.6, worst for both raters).

## Consequence
- Do not apply `prompt-patch.diff` as is: its DeliveryPlan / SSML-compiler half (dhd.js pauses, slow-downs, pitch -8%) is rejected by ear. Re-cut a text-only patch (spoken-register note and shapes, the echo-question fix in say.js) and re-measure.
- The next lever is a voice that can actually emote. Round 4 tests instruction-steered or tag-steered expressive engines on the B lines, re-flowed, with Hindi in Devanagari. The durable fix is a custom voice trained on a consented Indian teacher's genuinely emotional, child-directed recordings. That needs the owner (talent, consent, spend).
