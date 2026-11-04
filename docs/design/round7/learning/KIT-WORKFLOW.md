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

Each gets its own section with its size and call count before it is put to the owner:
- Hinglish/Devanagari forms for the 293 census items, steps_hi/fadedVersion_hi on every worked example, and per-skill
  `explain` plans, piloted on class 4-7 maths;
- relevel classes 4-7 (the 70% of items with no measured ge), then classes 1-3 and 8-9;
- language kits on real texts (learning-language-kits-real-text);
- placement banks;
- rewording Roman-Hinglish kit strings that collide with the content filter ('teen' and others).
