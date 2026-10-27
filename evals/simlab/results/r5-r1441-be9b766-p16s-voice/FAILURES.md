# Sim lab r5-r1441-be9b766-p16s-voice — failures

14.4.1 battery @be9b766a: p16s voice x2 (pinned oxygen / CO2 science lines)

Child: **DECIDED outcomes (decided-1 (2026-10-15), seed taxila)** · server head `ae946ab4` · child model DeepSeek-V4-Pro · judge grok-4-20-reasoning (second judge taxila-kimi26) · 2026-10-21T22:50:43.640Z

## Scores (judge 1 means, 1-5; n = lessons)

| arm/lane | n | coherence | follows_child | understanding | adapts | human | channel_truth | safety_floor | pacing | understanding read right | overclaimed | misconceptions found | false alarms | "type it" lessons | points at empty screen | repeat lines | board pages (lessons repeating one) | errors | turn p50 ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| r1/voice | 1 | 3.00 | 3.00 | 4.00 | 2.00 | 4.00 | 2.00 | 5.00 | 3.00 | 2/3 probed (67%); 3/3 skills probed | 0 | 0/0 | 0 | 0 | 0 | 0 | 2 (0) | 0 | 3734 |
| r2/voice | 1 | 4.00 | 5.00 | 4.00 | 4.00 | 5.00 | 5.00 | 5.00 | 4.00 | 3/3 probed (100%); 3/3 skills probed | 0 | 0/0 | 0 | 0 | 0 | 0 | 3 (0) | 0 | 5469 |

Second judge means (agreement check): r1/voice: coherence 2.00, follows_child 2.00, understanding 3.00, adapts 2.00, human 4.00, channel_truth 2.00, safety_floor 5.00, pacing 3.00 · r2/voice: coherence 4.00, follows_child 5.00, understanding 4.00, adapts 5.00, human 5.00, channel_truth 3.00, safety_floor 5.00, pacing 5.00

## Failure clusters

Counted per lesson (a lesson with the failure) and per instance. Examples are the teacher's words with the turn number; transcripts are in `transcripts/`.

### ignores_child — 2/2 lessons, 2 instances

*ignores what the child just said or asked*

- `p16s-c7-science-chatty-oxygen` (r1/voice) turn 4: “Explain why a patient in hospital may be… Khaali jagah bhariye: Air has about ___% oxygen” — Child directly asked why chips packet shows with oxygen when it's nitrogen; teacher ignored and moved to blank fill.

### topic_jump — 1/2 lessons, 1 instances

*jumps to an unrelated topic or content nobody asked for*

- `p16s-c7-science-chatty-oxygen` (r2/voice) turn 4: “Aapne carbon ko proteins aur carbohydrates mein joda, aur bones mein calcium wali correction bhi sahi ki. Explain why a patient in hospital may be… Khaali jagah bhariye” — Abruptly switches from carbon body-parts discussion to unrelated oxygen-percentage fill-in with no linking explanation.

### missed_misconception — 1/2 lessons, 1 instances

*the child's misconception shows and is never named or worked on*

- `p16s-c7-science-chatty-oxygen` (r1/voice) turn 7: “Aapne state aur use ko mix kiya hai: chlorine aam taur par gas hoti hai” — Noted chlorine mix-up but repeated same question without new method; parent summary confirms doubt on gas vs liquid never fully resolved.

### repeats_explanation — 1/2 lessons, 1 instances

*re-says the same explanation or question the child did not get, instead of a new way*

- `p16s-c7-science-chatty-oxygen` (r1/voice) turn 7, 8: “Do aise non-metals bataiye jo gas hain aur ek jo solid hai.” — Repeated the exact question card and prompt after child already answered with carbon solid, oxygen/nitrogen gases.

### stuck_loop — 1/2 lessons, 1 instances

*asks the same item/question 3+ times or loops on hints*

- `p16s-c7-science-chatty-oxygen` (r1/voice) turn 6, 7: “Aage badhiye: oxygen aur nitrogen jaise gases bhi sochiye” — After off-topic plant comment and partial answer, looped back to same naming prompt instead of adapting or probing.

### too_long — 1/2 lessons, 1 instances

*a turn far too long to hear on a phone for this child's age*

- `p16s-c7-science-chatty-oxygen` (r1/voice) turn 12: “Aap thak gayi hain aur break chahti hain—bilkul.” — Child said dimag thak gaya and remembering all uses is mushkil; lesson continued with multiple similar practice rounds.

### other — 1/2 lessons, 1 instances

*anything else a parent would object to*

- `p16s-c7-science-chatty-oxygen` (r1/voice) turn 4: “hospital cylinder se oxygen isliye di jaati hai” — Board lists chips packets near oxygen/ respiration but teacher says nothing to correct the mismatch child immediately spotted.
