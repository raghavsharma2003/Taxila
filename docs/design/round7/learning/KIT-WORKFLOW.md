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

### Size today (2026-11-04, after the grammar tags; from data/play/vakya/index.json as build-vakya makes it)

`node scripts/kits/tag-grammar.mjs` tags every class 4-7 English/Hindi grammar skill with `kind: "grammar"`. That is 85
skills: the 55 the builder's title patterns found, plus 30 it missed (listed with reasons in the script; c6 Hindi now
has 3). Five skills that only ask the child to NAME a part of speech, or to tell practice from practise, stay untagged
(`BORDERLINE` in the script). Tagging added c5-english-ch09 to the admitted topics (3 built items).

| class/subject | grammar skills | built now | skills at >= 6 | items short of 6 |
|---|---|---|---|---|
| c4-english | 12 | 10 | 0 | 62 |
| c4-hindi | 9 | 6 | 0 | 48 |
| c5-english | 11 | 9 | 0 | 57 |
| c5-hindi | 8 | 0 | 0 | 48 |
| c6-english | 18 | 17 | 0 | 91 |
| c6-hindi | 3 | 2 | 0 | 16 |
| c7-english | 20 | 22 | 0 | 98 |
| c7-hindi | 4 | 0 | 0 | 24 |
| **total** | **85** | **66** | **0** | **444** |

No grammar skill has 6 built items yet, so G1 authors for all 85: **128 author calls, ≈ $4.10** (dry run
`node scripts/kits/run.mjs g1`). The cap was raised from 120 to 150 for the larger set. The per-skill list is in
[G1-SHORTFALL.md](G1-SHORTFALL.md).

### Calls and cost per run (estimate; Azure Direct models, priced at about $1.25 per M input and $10 per M output tokens)

- Authoring: about 400 candidates (284 needed, assuming about 30% drop at blind-solve). One call per skill per batch of 8:
  **about 60 calls**, about 4k tokens in and 2.5k out each, so about $1.8.
- Blind solve: one call per candidate, **about 400 calls**, about 1.5k in and 0.3k out each, so about $2.0.
- Adjudication: disagreements, about 20%, **about 80 calls**, about $0.8.
- **Total: about 540 calls, about $5 (about ₹420) per full run.** A re-run of only the failures is about 30% of that.
  Hard cap per run: 700 calls. The script stops and reports at the cap, and never retries in a loop.

## All spend-gated workflows: built, dry-run counted, not run

**Revised 2026-11-04 (supersedes the first estimate of ~6,840 calls / ~$127).** Azure only AUTHORS. Every check is
done by Claude in session, per CLAUDE.md "Judges and evaluation use Claude": the blind solve of new keys, the
equivalence check of new answer forms, adjudication and the level rating. That removes every solver, adjudicator and
rater call from Azure. The counts below are the scripts' own dry runs (`node scripts/kits/run.mjs all`), priced at
taxila-gpt6 ($2 per M input, $10 per M output).

| # | workflow | script | Azure calls (exact) | ≈ cost | in-session Claude work |
|---|---|---|---|---|---|
| G1 | sentence-train grammar items (C2's vakya target) | `run.mjs g1` | 128 (cap 150) | $4.10 | blind-solve ~620 candidates |
| W1a | Hinglish + Devanagari complete answer forms (293 census items) | `run.mjs w1a` | 30 (cap 60) | $0.60 | equivalence check of the new forms |
| W1b | Hindi worked-example steps, class 4-7 maths | `run.mjs w1b` | 141 (cap 160) | $2.62 | code checks the numbers match; read-through |
| W1c | per-skill explain plans, class 4-7 maths | `run.mjs w1c` | 424 (cap 480) | $15.26 | blind-solve the 848 anchor and check answers |
| W2a | relevel class 4-7 (4,695 items with no ge) | `run.mjs w2` | **0** | $0 | rate 118 packets of 40 items |
| W2b | relevel classes 1-3 and 8-9 | `run.mjs w2 --only c1` … | **0** | $0 | rate about 145 packets |
| W3 | language kits on the real NCERT chapters, class 4-7 English/Hindi | `run.mjs w3` | 101 (cap 130) | $4.85 | blind-solve ~1,600 items |
| W4 | placement banks, class 9 maths and science | `run.mjs w4` | 8 (cap 8) | $0.36 | blind-solve 80 items |
| W5 | the 'teen' collisions | `w5-filter-numerals.mjs` | 0 | $0 | **done** (339 rewritten; 45 listed in W5-SKIPPED.md) |

**Total Azure: 787 calls, about $26 (≈ ₹2,200).**

How a run works:
1. `node --env-file=.env.local scripts/kits/run.mjs <wf> --run [--cap N] [--only prefix]` writes
   `evals/kit-runs/<wf>/verify-packet.jsonl` (no keys) and `keys.jsonl`. It is resumable and stops at the cap.
2. Claude solves or rates the packet in session.
3. A merge folds into `data/kits` only the items whose blind solve agreed, then `lint-kits`, the gates and a commit.

Nothing runs until the owner says yes.
