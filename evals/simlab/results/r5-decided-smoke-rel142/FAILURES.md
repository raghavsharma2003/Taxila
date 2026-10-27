# Sim lab r5-decided-smoke-rel142 — failures

Smoke test of the DECIDED-correctness child on 14.2 @c61f728c: director + agent (effort none), 2 cards, to check decision coverage, re-draws and server-verdict agreement before the decided baseline.

Child: **DECIDED outcomes (decided-1 (2026-10-15), seed taxila)** · server head `f268766d` · child model DeepSeek-V4-Pro · judge grok-4-20-reasoning (second judge taxila-kimi26) · 2026-10-15T08:31:02.413Z

## Scores (judge 1 means, 1-5; n = lessons)

| arm/lane | n | coherence | follows_child | understanding | adapts | human | channel_truth | safety_floor | pacing | understanding read right | overclaimed | misconceptions found | false alarms | "type it" lessons | points at empty screen | repeat lines | board pages (lessons repeating one) | errors | turn p50 ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| agent_gpt6_none/text | 2 | 4.50 | 4.00 | 3.50 | 2.50 | 5.00 | 3.00 | 5.00 | 4.00 | 4/6 probed (67%); 6/6 skills probed | 2 | 3/4 | 0 | 0 | 0 | 0 | 21 (0) | 0 | 5075 |
| director/text | 2 | 4.00 | 3.00 | 3.50 | 2.50 | 3.50 | 2.50 | 5.00 | 3.50 | 3/5 probed (60%); 5/6 skills probed | 1 | 2/4 | 0 | 0 | 0 | 0 | 2 (0) | 0 | 2176 |

Second judge means (agreement check): agent_gpt6_none/text: coherence –, follows_child –, understanding –, adapts –, human –, channel_truth –, safety_floor –, pacing – · director/text: coherence –, follows_child –, understanding –, adapts –, human –, channel_truth –, safety_floor –, pacing –

## Failure clusters

Counted per lesson (a lesson with the failure) and per instance. Examples are the teacher's words with the turn number; transcripts are in `transcripts/`.

### repeats_explanation — 4/4 lessons, 4 instances

*re-says the same explanation or question the child did not get, instead of a new way*

- `p03-c3-maths-confident_wrong` (agent_gpt6_none/text) turn 5, 6: “Lekin 5 aur 5 ki ek nayi dahaai ban jaati hai. Isliye 65 aur 45, 100 nahi, 110 hote hain.” — Gave virtually identical carry-over explanation twice instead of a new representation.
- `p25-c7-maths-shy` (agent_gpt6_none/text) turn 4, 5, 7, 13: “Aap soch rahe hain n pencils matlab n rupaye” — Repeats correction that n stands for count not rupees or object across multiple examples.

### false_understood — 3/4 lessons, 3 instances

*moves on as if understood after 'haan haan' / a guess / no evidence*

- `p03-c3-maths-confident_wrong` (agent_gpt6_none/text) turn 14: “Is tarah 45 bante hain.” — Accepted 55-jump explanation and ended without probing, yet parent summary states digit-sum mix-up seen again and not fully corrected.
- `p25-c7-maths-shy` (agent_gpt6_none/text) turn 8: “Haan, ek, chaar aur das pencils par paanch, bees aur pachaas rupaye sahi hain” — Affirms answer as correct while child still held letter-object misconception per summary.

### missed_misconception — 3/4 lessons, 3 instances

*the child's misconception shows and is never named or worked on*

- `p03-c3-maths-confident_wrong` (agent_gpt6_none/text) turn 13, 14: “Bahattar mein das jodne par do ikaai wahi rehti hain.” — Addressed units but never explicitly corrected persistent ten-jump-to-decade error visible in child's later uncertainty.
- `p25-c7-maths-shy` (director/text) turn 11: “Aapne symbols ko actions se joda: l se shuru, 6 add, phir 2 subtract” — Noted child's 'l laddoo' language but redirected only to simplify instead of correcting letter-as-object view.

### stuck_loop — 3/4 lessons, 3 instances

*asks the same item/question 3+ times or loops on hints*

- `p03-c3-maths-confident_wrong` (director/text) turn 7, 8, 9, 10: “Tumhare paas ₹80 hain. ₹100 banane ke liye aur kitne chahiye?” — Asked identical ₹80-to-100 question four times in a row after correct answers.
- `p25-c7-maths-shy` (agent_gpt6_none/text) turn 9, 10, 11, 12, 13, 14: “d doori hai, rupaye nahi” — Loops on clarifying d vs k for 6 turns without new approach or resolution.

### other — 3/4 lessons, 3 instances

*anything else a parent would object to*

- `p03-c3-maths-confident_wrong` (agent_gpt6_none/text) turn 7, 8, 9: “Bholu 65 pe hai. Woh 5 ki chhalaang lagake 70 pe pahunchta hai. Ab 100 tak 10-10 ki kitni chhalaang chahiye?” — Identical question card and number-line board redisplayed unasked after child's correct jump count.
- `p25-c7-maths-shy` (agent_gpt6_none/text) turn 3, 4, 5, 6: “Ek pencil ₹5 ki hai. n pencils ki keemat ka expression likho” — Same pencil question card and board shown repeatedly unasked.

### ignored_request — 1/4 lessons, 1 instances

*a request (game, picture, homework, stop, a question) is dropped or answered with an empty promise*

- `p03-c3-maths-confident_wrong` (director/text) turn 6, 8, 10: “Game ke liye card ke baad wale nirdesh ka wait karo.” — Child asked to play game three times; teacher deflected each time without engaging or scheduling it.

### robotic — 1/4 lessons, 1 instances

*flat, templated, scripted, unnatural for a spoken teacher*

- `p03-c3-maths-confident_wrong` (director/text) turn 6, 8, 9: “Tumne 8 aur 2 jodkar 10 banne ka tareeka bataya. Game ke liye pehle card ka agla nirdesh follow karte hain.” — Templated phrasing used repeatedly instead of natural spoken reply in child's register.

### points_empty_screen — 1/4 lessons, 1 instances

*points at the screen, board, a picture, a button or options that are not there*

- `p03-c3-maths-confident_wrong` (director/text) turn 13, 14: “65 ke baad number-line par kitne jumps?” — Asked about number line jumps right after child said it was not on the screen.

### dead_end — 1/4 lessons, 1 instances

*the lesson stalls, errors or ends abruptly*

- `p25-c7-maths-shy` (agent_gpt6_none/text) turn 14: “Chaliye trip ka example lete hain” — Introduces new trip example without confirming or resolving ongoing d-km confusion.
