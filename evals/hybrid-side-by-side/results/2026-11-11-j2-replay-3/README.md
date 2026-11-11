# J2 replay 3, 2026-11-11: the child's sentence never reaches the J2 call

**Run by:** the main loop, on Brain 4c87cafeb (claude/r4-conversation), same command as replays 1 and 2. **n:** 4 exchanges x 20 drafts = 80 (c6 holds two returns). **Cost:** $0.071. Simulated child, one seed; three different child sentences.

| Exchange | Words given | Sentence in the prompt | Pass | Clean (pass and no echo of the real sentence) | Refused by |
|---|---|---|---|---|---|
| "batting sabse achhi lagti hai" | batting | no | 18 of 20 | 18 | lesson 2 |
| "jab Virat chauka maarta hai, woh" | chauka, virat | no | 20 of 20 | 20 | |
| "jab Virat chauka maarta hai, woh" | chauka, virat | no | 20 of 20 | 20 | |
| "sixer, jab ball seedha bahar jaati hai" | ball, sixer | no | 18 of 20 | 18 | rule 2 |
| **All** | | | **76 of 80** | **76 of 80** | lesson 2, rule 2 |

Replay 1: 12 of 60. Replay 2: 50 of 60 by the predicate, 37 clean. Target was 16 of 20 clean per exchange: met on all four.

## What changed

- The child's line is cut from the reply call on the turn that answers the return (no extra call, no added latency); the note carries one or two of their words.
- For this sentence only, the lesson clause drops function words (har, upar, neeche, total, kul, khaya...) and the rule clause drops a bare "hota hai".
- The echo clause reads the child's real sentence. No draft echoes it.

## Still to judge

- Some passing lines are flat or odd ("Batting mein bat se ball ko zor se milaya.", "Virat ka chauka yaad reh gaya."). A reading judge sees them in director20; this replay only shows they are safe and on the child's topic.
- The 4 refusals are harmless sentences ("hissa" read as a lesson word in a fractions lesson; "yaad aata hai" read as a rule form). Left as they are: the fallback is the neutral line.
