# Covert comprehension, per turn: the blind-label eval (round 5, stream 4A)

**What is measured:** `server/director/read.js` `comprehensionRead`. It runs on top of the real classifier, `classify.js`: the code paths first, then the Azure model exactly as on a live turn. For one child turn it says:
- **understood**, **partly** or **not**;
- the misconception the turn shows, where there is one.

**The labels never come from a model.** They are fixed by how each case is built, from verified keys and two-rater data (`build-set.mjs`):

| Type | What the child says | Label |
|---|---|---|
| `correct` | The item's key, as written | understood |
| `correct_hi` | A two-rater "complete" form in Devanagari (`data/kits-parts.json`), else the key in a Hindi frame | understood |
| `correct_framed` | The key inside a child's sentence ("mujhe lagta hai …") | understood |
| `partial` | A two-rater "partial" form of a multi-part key | partly |
| `misconception` | The option a kit's verified diagnostic ties to a misconception id | not, plus that id |
| `misconception_framed` | The same option inside a child's sentence | not, plus that id |
| `wrong` | Another item's key from the same topic (never this key or an acceptable form) | not |
| `wrong_number` | A numeric key perturbed (k±1, ×10, +10, −2) | not |
| `bluff` | "haan haan samajh gaya" and kin: a claim with no evidence | partly. It must never be read as understood; the teacher gives it a light check |
| `dont_know` | "pata nahi" and kin, in both scripts | not |
| `silence` | An empty turn | not. The teacher waits and re-asks |

**The sets:**
- Stratified over classes 1-9, with every type in every class, two per class.
- Built deterministically: `set.json` with seed 2026 (dev, 198 turns) and `set-heldout.json` with seed 7 (held out, 198 turns).
- The read's rules were tuned only on misses in the first dev runs. The held-out set was built afterwards and is reported as is.

**Commands:**
```
node evals/comprehension-r5/build-set.mjs --per 2 > evals/comprehension-r5/set.json
node evals/comprehension-r5/build-set.mjs --per 2 --seed 7 > evals/comprehension-r5/set-heldout.json
node --env-file=.env.local --env-file=tests/prod/prod-routing.env evals/comprehension-r5/run.mjs [--set …] --out evals/comprehension-r5/results/<name>
```

**The report** (`summary.json`) gives:
- agreement overall, per class and per type;
- the misconception id named;
- "model-decided": the cases the classifier's model call decided, as opposed to code;
- "before": the classifier's outcome alone (correct → understood, partial → partly, everything else → not), which was the nearest thing to a read before round 5.

**Honest limits:**
- About half the turns are decided in code: exact key or option matches, the don't-know lexicon, silence. The framed and perturbed types are there so that the model, not an exact match, decides a large share.
- `wrong` cases are another item's key. A few of those are questions or near-misses, which is label noise; each miss is listed in the run output.
- Typed ASR-perfect text. Noisy ASR is tested in the simulated-child battery, `tests/prod/battery-r5.mjs`.
