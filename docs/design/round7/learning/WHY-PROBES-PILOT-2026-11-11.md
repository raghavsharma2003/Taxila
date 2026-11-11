# Authored why-probes: a pilot on the four live scripts (Learning, 2026-11-11)

## Main's ruling (18:50 UTC): approved as a pilot, on these terms

1. **Scope.** Probes are authored for the four pilots only, about 3 per script, after the staged round's second reads are in.
   Nothing goes into the staged 30 until the pilot has been judged.
2. **The field** is as proposed below, with two additions:
   - Each probe lists the kit misconception ids its reasons point at (`misconceptions: [...]`).
   - Each probe has at least one `sound` reason with cues, so a right reason is recognised, not only wrong ones.
3. **Classification** uses the authored cues only, never a model; that is the standing law. `unknown` changes nothing, and it
   is counted.
4. **The record.** The child is never told the reason, and no remediation is triggered in the same lesson. The record is
   "right, reason matched misconception X", its own kind of evidence, weaker than a wrong answer. Loop decides the weight;
   Loop's owner is told, through main, once the contract is drafted.
5. **Order.** Brain builds the contract and the turn after director21 is judged. The first measurement is the run after that.

**Reversal.** Any one of these ends or narrows the pilot:
- more than 60% of probe answers are `unknown` on the first measured run;
- judges hear the probe as doubting the child in more than 1 lesson in 4;
- a probe a judge finds gives away the next card's answer is removed.

The original proposal follows. Where it differs from the terms above, the terms govern: in particular, under "What it changes"
below, a misconception reason now schedules no remediation in the same lesson.

---


Main asked for this after batch 6: where a right answer can come from a wrong reason, and what field a probe would use. This is a
proposal only. Nothing is authored, and nothing changes in the schema, the runtime or the scripts until main rules on it.

## The problem

A card's key tells us the answer was right. It does not tell us why it was right. The reader pass found whole classes of cards
where a child holding the very misconception the card targets still answers right:

- **Guessable cards.** Counted over the 4 pilots and the 30 staged scripts (731 cards: explain asks, checks and then-cards):

  | Card kind | Count | Chance of a right guess |
  |---|---|---|
  | yes/no | 96 | 1 in 2 |
  | two-way compare ("kaun bada, X ya Y?") | 75 | 1 in 2 |
  | pick one of three | 68 | 1 in 3 |
  | numeric keys | 370 | — |
  | word keys | 122 | — |

  The numeric and word keys are rarely guessable.
- **Cards where the misconception agrees with the key.** Two examples:
  - In "kaun bada, 3/4 ya 1/2?", whole-number bias also says 3/4.
  - In "7 marks between 0 and 1, kitne gaps?", a child counting marks says 7. A card keyed 8 catches that child, but the
    same card with 0 marks drawn would not.

  The (e)/(f)/(f2) predicates and the second reads removed many of these. Some cannot be removed, because the honest card for
  the idea has only two answers.
- **Then-cards right after a remediation.** A child can repeat the say's rule without holding it. The second reads flagged
  then-cards a misconception-holder still gets right: c5-ch03-t02's exact fit, c7-ch05-t02's 90° − 3°, and c6-ch07-t01's three
  8 cm pieces. Those were fixed to catch the child, but the general risk stays.

On these cards, a right answer is weak evidence. The learner model currently counts it the same as a worked numeric right.

## Where a probe earns its place

A card gets a why-probe only when all of these hold:

1. It is a guessable kind (yes/no, two-way compare, pick one of three), or its `wrongIfMis` could be said by the misconception
   holder for the right reason. A reader judges this per card.
2. It targets a misconception (`targets` is set). A probe answers one question: was this right for the targeted reason or the
   misconception's?
3. It is an explain ask, a check, or a then-card. It is never a worked yourStep (the steps were just modelled), and never a
   ladder item (kit practice keeps its own evidence rules).

At runtime the probe is asked only:

- after a RIGHT answer;
- at most once per skill per lesson (the then-card's probe takes priority, then the skill's last check);
- never on two cards in a row;
- never when the child is stuck or steering (the Director's existing pacing signals).

A probe is never asked after a wrong answer: the card's remediation path already handles that.

Expected volume: about one probe per skill, so about 3 authored probes per script. That is roughly 100 across the 34 scripts,
out of the 239 guessable cards.

## The field (proposed)

On a card (explain `ask`, `checks[i]`, `remediation[i].then`):

```jsonc
"whyProbe": {
  "misconceptions": ["<kit misconception id>"],   // (main's term 2) every misconception id its reasons point at
  "prompt": { "hi": "Tumne kaise socha?", "en": "How did you work it out?" },   // one short question, never a second card
  "reasons": [
    { "kind": "sound",                       // the reason the card teaches
      "cues": { "hi": ["tukde ka size", "barabar hisse", "chhote tukde"], "en": ["piece size", "equal parts"] } },
    { "kind": "<misconceptionId>",           // the misconception the card targets (its `targets`)
      "cues": { "hi": ["bada number", "9 bada hai", "zyada tukde"], "en": ["bigger number", "more pieces"] } }
  ],
  "after": "the 1-sentence line she says whatever the reason was, no verdict on the reason"   // e.g. "Achha, samjhi."
}
```

How it works:

- **Classification by predicate, not by a model** (the inherited law: a model never grades). The child's words are matched
  against the authored cues, both forms, using the same normaliser the card's `accept` uses. One reason's cues match and the
  other's do not: that reason is recorded. Both match, or neither does: the reason is `unknown`, and nothing is inferred beyond
  the card's own right.
- **What it changes.**
  - A `sound` reason raises the evidence weight of that right answer for the skill.
  - A misconception reason records "right, for the misconception's reason" against that misconception. The answer stays right
    to the child: she never says it was wrong. The learner model then schedules that misconception's remediation the next time
    the skill comes up. This is the covert detection the product is built on.
  - `unknown` changes nothing.
- **What she says.** Only `after`, the same whatever the reason: a probe is a question, not a test, and the child is never told
  a reason was wrong. Then the lesson goes on.
- **Checks in check.mjs** (if adopted):
  - the prompt is one question, at most 8 words, with no number and no option named, so it gives nothing away;
  - each reason has at least 2 cues in each form;
  - no cue appears in two reasons;
  - the misconception reason's `kind` equals the card's `targets`;
  - `after` asks nothing and judges nothing.

## Who would build what

- **Learning:** the field in the scripts, its predicate in check.mjs, and the cues (two independent reads, as with the aside
  replies).
- **Brain:** `whyProbe` in `shared/contracts.ts`, the turn in the Director (after a right answer, under the rules above), and
  the reason write to the learner model. These are Brain-owned files, so they would come as a patch.

## What would make this the wrong call

- The dry and paid runs show children answering a probe with the bare answer ("kyunki 3/4"), so most reasons are `unknown` and
  the probe costs a turn for nothing. If `unknown` is above about 60% on the first paid matrix, retire it.
- Judges hear the probe as doubting a right answer (a child who was right is asked "how?"). If judges flag it on more than one
  lesson in four, keep the field but ask it only on then-cards.
