# Learning kit workflow: acceptance and spend (round 7 F, spend-gated; nothing runs until the owner sets a cap)

## Target G1: sentence-train items for English and Hindi grammar (C2 Games, via main 2026-11-04)

For each class 4-7 English and Hindi **grammar** skill, the kit holds at least **6 verified, sentence-length production
items**. These are the items C2's vakya builder (`server/play/tools/build-vakya.mjs` on claude/r7-games) admits. Each item:
- is a production kind (practice, error_spot, contrast, near_transfer, translate_rep), never "which is correct: X or Y?",
  and never an open task ("any …", "for example …", "जैसे …");
- has a key that is one full sentence or phrase of **3-12 words**, made only from the item's own words. Its distractors
  come from the item itself (the wrong sentence it quotes, the source sentence it transforms, the choices it offers) or
  from the skill's closed grammar set;
- does not print the key in the prompt, and does not print the key's word order with nothing left to decide;
- is **blind-solved** like every key: a solver that sees the prompt only must reach the key (verified.agrees === true),
  else it goes to adjudication; anything still unresolved is dropped, never kept.

C2's admission rules as of claude/r7-games @ 4ccd7d2eb (C2 tells F before any change):
- `build-vakya` treats `skill.kind === "grammar"` as grammar, besides its title patterns. The workflow tags every grammar
  skill, which makes c6 Hindi visible.
- A topic is admitted at MIN_ITEMS = 3 built items. Our acceptance stays at **≥ 6 built per grammar skill**.
- An item builds only when the key has exactly one right sentence. Dropped: "any…", "for example…", "your own…",
  "two sentences…", "जैसे", "कोई भी", several blanks, and a prompt that prints the sentence with one two-way swap.
- Distractor wagons come only from the item's `targetsMisconception` or the skill's closed set. **Every authored item
  names its misconception**, so its mal-train discriminates.
- Shapes to author, best first:
  1. an error_spot whose wrong sentence needs ≥ 2 changes or a reordering ("Where you are going?");
  2. a word-order build;
  3. a transform ("Report: 'I am tired,' said Ravi"; "Make a question asking where").

  Hindi: वचन/लिंग/काल transforms that change ≥ 2 words of a full sentence ("लड़का खेल रहा है" → plural), never single-word
  synonyms.

Acceptance for a run: `node server/play/tools/build-vakya.mjs --check` (C2's builder) reports `built >= 6` for every
grammar skill in its index, and `lint-kits` is clean.

### Size today (from C2's data/play/vakya/index.json, 2026-11-04)

| class/subject | grammar skills | buildable items now | items short of 6 per skill |
|---|---|---|---|
| c4 English | 4 | 5 | 19 |
| c4 Hindi | 7 | 5 | 37 |
| c5 English | 6 | 4 | 32 |
| c5 Hindi | 7 | 0 | 42 |
| c6 English | 15 | 15 | 75 |
| c7 English | 15 | 17 | 73 |
| c7 Hindi | 1 | 0 | 6 |
| **total** | **55** | **46** | **284** |

c6 Hindi has no row: none of its skill titles match the builder's Hindi grammar pattern (HI_GRAMMAR). The workflow tags
grammar skills explicitly (`skill.kind: "grammar"`) so the count does not depend on title wording. C2 is told this, so its
builder can read the tag.

### Calls and cost per run (estimate; Azure Direct models, priced at about $1.25 per M input and $10 per M output tokens)

- Authoring: about 400 candidates (284 needed, assuming about 30% drop at blind-solve). One call per skill per batch of 8:
  **about 60 calls**, about 4k tokens in and 2.5k out each, so about $1.8.
- Blind solve: one call per candidate, **about 400 calls**, about 1.5k in and 0.3k out each, so about $2.0.
- Adjudication: disagreements, about 20%, **about 80 calls**, about $0.8.
- **Total: about 540 calls, about $5 (about ₹420) per full run.** A re-run of only the failures is about 30% of that.
  Hard cap per run: 700 calls. The script stops and reports at the cap, and never retries in a loop.

## The other spend-gated workflows (prepared, not run)

All estimates use the same price basis as G1: Azure Direct GPT-class at about $1.25 per M input and $10 per M output
tokens. Judging is done by Claude in-session and costs nothing on Azure. Every run has a hard call cap and stops at it.

| # | workflow | size (counted 2026-11-04 from data/kits, data/placement) | calls per full run | ≈ cost |
|---|---|---|---|---|
| G1 | sentence-train grammar items (above) | 55 skills, 284 items short | ~540 (cap 700) | ~$5 |
| W1a | Hinglish + Devanagari complete answer forms | the 293 census items (docs/research/census/2026-10-21-kits-english-only-forms.json) | ~30 author (batches of 10) + ~293 blind re-solve ≈ **325** | ~$3 |
| W1b | `steps_hi` / `fadedVersion_hi` on worked examples, class 4-7 maths pilot | 141 topic worked examples, 0 have Hindi steps today | 141 author + 141 verify ≈ **280** | ~$3 |
| W1c | per-skill `explain` plans (concrete → pictorial → symbolic steps, anchor example with blind-solved numbers, analogy, misconception to pre-empt, board script), class 4-7 maths pilot | 424 skills | 424 author (long output) + 424 blind-solve of the anchor numbers ≈ **850** | ~$30 |
| W2a | relevel class 4-7: measured `ge` for items with none | 4,695 of 6,665 items unmeasured (1,970 have ge) | 2 raters × batches of 20 ≈ **470** | ~$10 |
| W2b | relevel classes 1-3 and 8-9 | 5,733 items, none measured | ≈ **575** | ~$12 |
| W3 | language kits on real texts, class 4-7 English and Hindi (learning-language-kits-real-text) | 101 topics, 467 skills, 1,675 items | ~1 passage + ~16 items + ~16 blind-solves + adjudication ≈ 35 per topic ≈ **3,500** | ~$60 |
| W4 | placement banks: class 9 maths and science (classes 3-8 exist) | 2 banks × ~120 items | ~6 author + 120 verify + ~25 adjudicate per bank ≈ **300** | ~$4 |
| W5 | Roman-Hinglish strings that trip the content filter ('teen' = three, and others) | 424 'teen' occurrences across the kits | **0**: a code rewrite to the numeral, then the existing lint; no model call | $0 |

**All of them: about 6,840 calls, about $127 (≈ ₹10,700).** Suggested order, if the owner approves part of it:
1. G1 + W1a + W5: the cheapest, and they unblock Games and the Hinglish graders (~$8).
2. W2a: Brain's level-matched item choice depends on it (~$10).
3. W1b + W1c pilot: Brain's per-skill explain beats (~$33).
4. W3, W2b, W4.

Each workflow ships as a short `scripts/kits/*.mjs` with `--dry-run` (prints the plan and call count, makes no call)
and `--cap N`. Nothing runs until the owner says yes.
