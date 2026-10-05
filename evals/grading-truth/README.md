# Grading-truth battery (VALUES-100 V1.1)

Proves or disproves "0 wrong grades" for every live grading path. Truth is set by construction in `lib/oracle.mjs`,
which imports nothing from `server/`, `shared/` or `src/`. The truth for multi-part keys comes from two raters from
different model families (`label-parts.mjs`); only the labels they agree on are used.

| file | what it does |
|---|---|
| `lib/oracle.mjs` | Exact rationals; a seeded RNG. Surface forms of a value: digits; Indian and international grouping; English, Roman-Hindi and Devanagari number words; fraction forms; decimals; units and ₹; STT wrappers; self-corrections; hedges. Also near-miss wrong values. |
| `run.mjs` | The battery. It runs against the code tree named by `--root`. Sections: (1) lesson classifier, deterministic path; (2) module answers through the real frame protocol, with honest and forged claims; (3) W2-H Studio host grader, including remounts, malformed frames and restarts without a mount key; (4) Studio v2 `gradeAnswer` plus the extension specs (`gradeAny`); (5) placement; (6) comprehension R-KEY (dormant: exported, but no live route calls it); (7) `--model N`, the classifier's model leg on N deferred cases, stratified into 6 buckets. |
| `label-parts.mjs` | Two-rater parts labels for list-shaped kit keys, written to `data/parts-labels.json`. Calls Azure; there is a spend cap. |
| `results/<date>/<label>.json` | Per run: the summary per grader, every wrong grade, a sample of uncredited right answers, and the model-leg rows. |

```
node evals/grading-truth/run.mjs --root . --label baseline
node evals/grading-truth/run.mjs --root <copy with owner-truth 01-04> --label patched-01-04
TAXILA_PARTS_FILE=<parts file> node evals/grading-truth/run.mjs --root <copy with 01-04 + V1 patches> --label v1
NODE_USE_ENV_PROXY=1 node evals/grading-truth/run.mjs --root . --label baseline --model 420
NODE_USE_ENV_PROXY=1 node evals/grading-truth/label-parts.mjs --n 800
```

## Definitions

- **wrong grade**: a verdict that is not an abstention and disagrees with the truth. It comes in three kinds:
  - `false_credit`: a not-correct answer was credited;
  - `false_fail`: a correct answer was failed or marked partial;
  - `partial_miss`: a partial answer was marked incorrect.
- **uncredited**: a correct answer got an abstention (no evidence, then a re-ask). This is not a wrong grade, but it is
  reported per form, because a child who said the right thing earned nothing.

## Weak truth, named

- `text-wrong:other-item-key(weak-truth)` assumes that another item's key is wrong for this item. Two items can share
  an answer, so a disagreement here goes to a human. It is never counted as a proven wrong grade.
- The two-rater labels are only as good as the raters' agreement. Measured on 800 items: κ 0.43 on multi- vs single-part,
  κ 0.53 on acceptable entries. That is why the V1 parts data needs a human adjudication pass before it ships.

## Review v1 additions (2026-10-05)

- `numnoun:*` cases: keys that are a number followed by words ("3 edges", "8 a.m.", "4 lakh", "21 June"). Correct = the
  number in any form plus the key's words; wrong = another value with the key's words, or the decisive word swapped from an
  oracle-side confusion list (a.m./p.m., BCE/CE, lakh/crore, hundreds/tens, edges/faces, °C/°F, months...); a bare number is
  `incomplete` (no credit) when the words decide what it is and the question does not name them.
- `num-wrong:unit-swap`, `text-wrong:apostrophe-moved`, and `invalid-dup-keys` tagging for Studio sequence content the
  validator should reject.
- `--studio-stamp half|all|seam`: `seam` stamps the item only for archetypes whose seam declares `data-item` (what
  V1-04 delivers in a real frame); `all` is the upper bound.
- `--model-conc N` (default 6). The model leg shares the production deployment's rate limit: 3 trees x 6 workers hit 429s
  and the errors silently became abstentions. Use 2 and check the log for 429 before trusting a model-leg number.
