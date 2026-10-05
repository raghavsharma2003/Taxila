# V1-05: required answer parts per kit item (data and pipeline)

**Why.** "Is this key multi-part?" cannot be read from a key's commas. Kit keys carry reasons and examples the question
never asked for.
- Owner-truth patch 04's `multiPartKey` marked **169 of 174 (97%)** two-rater-agreed SINGLE-part keys as multi-part.
- Its multi-part rubric would therefore have graded complete answers "partial".
- In the other direction, **947 of the 1,631** acceptable entries the raters agreed on were **partial** answers. The
  lesson's exact-match path credits every acceptable entry as the full key.

All of this is from `evals/grading-truth/data/parts-labels.json`, 2026-10-05, n = 800 of 2,750 list-shaped class 4-7
keys. Raters were gpt-5.6-terra and DeepSeek-V4-Pro; only agreed labels are kept. Spend was USD 1.91.

**What V1-02 reads.** `data/kits-parts.json`, through `server/content/parts.js`:

```json
{ "items": { "<itemId>": { "parts": ["…", "…"], "acceptable": { "<entry>": "complete" | "partial" | "wrong" } } } }
```

An item with no row keeps today's behaviour: single-part, and acceptable entries treated as complete.

**How to build it** (RS-6 owns `data/kits/**`; this is a data job, not a code job):
1. Run `NODE_USE_ENV_PROXY=1 node evals/grading-truth/label-parts.mjs --n 2750` to label every list-shaped class 4-7 key.
   Estimated cost: about USD 7 (from USD 1.91 for 800).
2. **Human adjudication.** A person adjudicates every rater disagreement before anything ships:
   - the multi- vs single-part call (κ = 0.43 between the two models, 212 of 800 disagreed);
   - every acceptable-entry label (κ = 0.53, 513 of 2,144 disagreed).
   The model agreement is not good enough to ship unreviewed.
3. Write the result to `data/kits-parts.json`. Add a lint step (`scripts/lint-kits.mjs`): every list-shaped key has a
   row, and every acceptable entry has a label.
4. **Fix the kits themselves.** An acceptable entry labelled `wrong` is a kit bug: delete it from `acceptable`.

`docs/design/values/v1/data/kits-parts.sample.json` holds the 686 agreed rows from the 800-item sample (not
adjudicated). It is what the V1 battery and model-leg numbers were measured with, and it is not for production.

**Measured with the sample.** These numbers are scored against the same two-rater labels the code reads. For the
deterministic path that is circular by construction: it proves that the code USES the data correctly, not that the data
is right. The model leg is not circular, because the model never sees the labels, only the parts.

| tree | lesson.classifyFast wrong grades (n = 25,385) | acceptable entry rated partial, credited as key | one rated part credited as key | acceptable entry rated wrong, credited | "-N" credited for N | "2 5" credited for 2.5 |
|---|---|---|---|---|---|---|
| baseline | 1,294 | 838 | 27 | 8 | 398 | 23 |
| owner-truth 01-04 | 1,294 | 838 | 27 | 8 | 398 | 23 |
| + V1-02 with the sample parts | 0 | 0 | 0 | 0 | 0 | 0 |
