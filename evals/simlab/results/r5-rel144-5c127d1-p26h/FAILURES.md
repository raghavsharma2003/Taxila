# Sim lab r5-rel144-5c127d1-p26h — failures

14.4 @5c127d1a: p26h x2 (pinned British-rule 'race' history answer at turn 3)

Child: **DECIDED outcomes (decided-1 (2026-10-15), seed taxila)** · server head `463c9f1d` · child model DeepSeek-V4-Pro · judge grok-4-20-reasoning (second judge taxila-kimi26) · 2026-10-21T20:00:20.282Z

## Scores (judge 1 means, 1-5; n = lessons)

| arm/lane | n | coherence | follows_child | understanding | adapts | human | channel_truth | safety_floor | pacing | understanding read right | overclaimed | misconceptions found | false alarms | "type it" lessons | points at empty screen | repeat lines | board pages (lessons repeating one) | errors | turn p50 ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| r1/text | 1 | 4.00 | 3.00 | 3.00 | 4.00 | 4.00 | 4.00 | 5.00 | 4.00 | 0/2 probed (0%); 2/5 skills probed | 0 | 0/0 | 0 | 0 | 0 | 0 | 3 (0) | 0 | 3547 |
| r2/text | 1 | 3.00 | 2.00 | 4.00 | 2.00 | 4.00 | 4.00 | 5.00 | 3.00 | 4/4 probed (100%); 4/5 skills probed | 0 | 0/0 | 0 | 0 | 0 | 0 | 1 (0) | 0 | 4052 |

Second judge means (agreement check): r1/text: coherence 4.00, follows_child 3.00, understanding 3.00, adapts 4.00, human 3.00, channel_truth 3.00, safety_floor 5.00, pacing 4.00 · r2/text: coherence 4.00, follows_child 2.00, understanding 2.00, adapts 2.00, human 3.00, channel_truth 5.00, safety_floor 5.00, pacing 2.00

## Failure clusters

Counted per lesson (a lesson with the failure) and per instance. Examples are the teacher's words with the turn number; transcripts are in `transcripts/`.

### ignores_child — 2/2 lessons, 3 instances

*ignores what the child just said or asked*

- `p26h-c8-sst-bored-race` (r1/text) turn 3: “Thanks for telling me! Let's keep going.” — Child added point on British viewing themselves as superior race and treating Indians badly; teacher ignored and pivoted.

### topic_jump — 1/2 lessons, 1 instances

*jumps to an unrelated topic or content nobody asked for*

- `p26h-c8-sst-bored-race` (r2/text) turn 8: “Choose one: as conquerors, as company traders who slowly gained power, or as tourists. How did the English first come to India?” — After detailed 1765 diwani discussion, abruptly jumps backward to initial arrival without transition.

### misread_right_as_wrong — 1/2 lessons, 1 instances

*treats a right or reasonable answer as wrong*

- `p26h-c8-sst-bored-race` (r1/text) turn 9: “Aapne sequence dates ke basis par sahi lagaya.” — Praised date-based sequence but parent summary claims links between events still need practice, contra full understanding.

### missed_misconception — 1/2 lessons, 1 instances

*the child's misconception shows and is never named or worked on*

- `p26h-c8-sst-bored-race` (r2/text) turn 12, 13: “Predict: cheap machine-made cloth from British factories floods Indian markets...” — Child correctly predicts weavers unemployed and Dhaka decline but teacher never probes or records any misconception on drain of wealth or Champaran.

### repeats_explanation — 1/2 lessons, 1 instances

*re-says the same explanation or question the child did not get, instead of a new way*

- `p26h-c8-sst-bored-race` (r2/text) turn 7, 10: “What did the Company gain from the diwani of Bengal, Bihar and Orissa in 1765, and why was it so important?” — Re-asks exact diwani question immediately after correct answer; later re-asks Plassey battle for recap.

### stuck_loop — 1/2 lessons, 1 instances

*asks the same item/question 3+ times or loops on hints*

- `p26h-c8-sst-bored-race` (r2/text) turn 10, 11: “Ab isi sequence ko apne words mein ek baar recap kariye. Which battle in Bengal in 1757 followed this pattern, and who helped the Company?” — Forces repetition of already-given Plassey/Mir Jafar answer, prompting child to say 'maine abhi-abhi toh bola'.

### too_hard_or_easy — 1/2 lessons, 1 instances

*pitch wrong for the class or the child's state*

- `p26h-c8-sst-bored-race` (r2/text) turn 4, 5, 8, 9: “Put in order, earliest first: Battle of Buxar, Battle of Plassey, the Company gets its charter, the Crown takes direct rule.” — Child stated 'hum log pehle se yeh padh chuke hain' yet teacher assigns basic timeline and arrival MCQ already covered.

### other — 1/2 lessons, 1 instances

*anything else a parent would object to*

- `p26h-c8-sst-bored-race` (r1/text) turn 1: “Teach this to Bittu later.” — Unprompted reference to teaching the analogy to Bittu introduces unrelated element for this bored child.
