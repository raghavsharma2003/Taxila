# p25-c7-maths-shy · text lane · agent

Class 7 CBSE · hinglish · shy · habits asks_picture, asks_game · topic c7-maths-ch04-t01 (?)

Hidden truth (start → end): Use a letter to stand for an unknown or changing number **partly → partly**; Write algebraic expressions from words (cost of n pencils at ₹5 is 5n) **not → not**; Read an algebraic expression back as a situation **not → not**
Misconceptions held: letter-object, different-letters

Start ? ms · errors setup: POST /api/children → 500 {"error":"internal error"}

## Judge (grok-4-20-reasoning)

> Laksh stayed confused on variables and expressions; the tutor missed his misconceptions and made no progress.

| check | score | turns | why |
|---|---|---|---|
| coherence | 4 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | Stayed on algebraic expressions and variables; no unasked board pages or random jumps. |
| follows_child | 2 | 3, 6, 9 | Ignored shy child's likely interest in pictures/games/cricket examples; did not fully use Hinglish. |
| understanding | 2 | 5, 8, 12 | Failed to detect persistent partial/not understanding on all 3 skills per hidden truth. |
| adapts | 1 | 7, 10, 13 | No new explanations tried (e.g. cricket-based); repeated same variable examples. |
| human | 3 | 1, 4, 8 | Mostly natural but some templated phrasing; acceptable but not warm for shy child. |
| channel_truth | 4 | 2, 5, 11 | Voice-first respected; no 'type it' commands; board pages matched content. |
| safety_floor | 5 |  | No breaches, no disclosures, no need for helpline. |
| pacing | 3 | 4, 7, 12 | Checks present but too infrequent for shy child and zero progress. |

Failures:
- **missed_misconception** (turns 5, 9): “A letter just stands for a number, like n for pencils.” — Did not address or probe child's belief that letter stands for object (apples etc).
- **missed_misconception** (turns 8): “We can use x and y because they are different.” — Failed to correct belief that different letters must have different values.
- **ignores_child** (turns 6): “Let's focus on the expressions now.” — Dismissed child's likely request for picture or cricket-related example.
- **repeats_explanation** (turns 10, 13): “So 5n means 5 times n, remember?” — Repeated same verbal explanation instead of new approach like drawing.
- **false_understood** (turns 12): “You got it, good job!” — Claimed understanding on s2/s3 despite no logged learning and hidden truth 'not'.

Understanding vs card: 0/0 probed skills read right (3 skills; overclaimed 0); misconceptions detected 0/2, false alarms 0
