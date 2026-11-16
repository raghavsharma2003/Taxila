# Brain status

Newest entry first. Per main's 029: reports here and in commit messages, never by message.

## 2026-11-16 07:20 · `7cd956e1` (A and B)

**Done (gated: test:all 7245 pass; the only failures are the two worktree-only browser suites):**
- A: the reply to the child's answer after her AI-line question takes the phrase form of the same shape ("Achha, toh tumhara favourite
  hai Virat.").
- B: a bridge changes no board; the next unit's board goes up with its first part. r7-brain-v69 N2 changed to the rule.
- Counts: boardChanged 292 → 303, boardKept 337 → 326 (the switch moves from the bridge to the next unit's first part, often a turn
  later); turnsOver60Words 64 → 65.

With this, Brain's items of dc-r8-director22 are in: R, T (Brain's parts), J2, W, H, K, A, B, and the harness (intent on every row,
the steady child answers the teach-back right in two topics and wrong in two). Learning's parts (T2 lead-ins, T5 per-skill covered,
the clause-8 read) are theirs.

**Doing next:** `repeatedAuthored` stops exempting cards (pending, 5 now); then compile step 3 resumes, column by column (repeat
first), as the decision says it continues after R and J2.

**Questions for main:** none.

## 2026-11-16 06:40 · `a8f8c7dc` (K)

**Done (gated: test:all 7244 pass; the only failures are the two worktree-only browser suites):** K — a key is said once: the why's
second wording after a key is the card's simpler with the check-in, no verdict frame, no key again, over the board the key was said
over. A yes-or-no key with its why is a sentence ("Nahi, kyunki …"). Gated `keyOnce`: 3 on the rows before, 0 after. Counts:
moves.repair 82 → 62, reteach 65 → 85; boardChanged 294 → 292, boardKept 335 → 337.

**Doing next:** B (a bridge changes no board), A (AI-line reply with the phrase forms), then `repeatedAuthored` stops exempting cards.

**Questions for main:** none.

## 2026-11-16 06:10 · `1811ca75` (H)

**Done (gated: test:all 7244 pass; the only failures are the two worktree-only browser suites):** H — a Hindi request gets words she
did not say in her last two turns: the simpler when unspent, else the beat's second wording (pointAlt), else its point. Gated
`hindiNewWords`: 2 on the rows before, 0 after. Counts: joints.hindiSwitch 14 → 16.

**Doing next:** B (a bridge changes no board), K (a key said once; a yes/no key as a sentence), A (AI-line reply with the phrase forms).

**Questions for main:** none.

## 2026-11-16 05:40 · `1708b986` (W)

**Done (gated: tsc, vite build, prompt budget, test:all 7244 pass; the only failures are the two worktree-only browser suites):**
- W: a card said whole in one of her last two turns is asked by its question alone (its reask where written) after any turn, unless
  the child asked for it (repeat, "sawaal kya hai?"), it is a picture turn, or the second miss is past; a Hindi request keeps S1. After
  "main khud karti hoon" she says the go-ahead alone and waits (the card stays live). Counts: cardsSaidAgainWithin2 69 → 32, teacher
  turns 722 → 678, reads.correct 156 → 167, afterTryFirst 15 → 0, turnsOver60Words 59 → 64 (more cards answered, more long teaching
  turns reached); the full list is in the commit.
- Tests changed to the rule, with comments: r7-brain-v64 Q1 (the try-first go-ahead with no card), r7-brain-v63 W1 (the question alone).
- J2's last rule (nothing between a unit's own point and its card) already holds: no such row on the dry matrix. J2 is done as rules in
  the existing code paths, not as one seam-pass function; the predicates gate each rule (backToJoint both ways, missRemediationJoint).

**Doing next:** H (a Hindi request gets the second wording or an unspent simpler, never words from her last two turns), B (a bridge
changes no board), K (a key said once; a yes/no key as a sentence), A (AI-line reply with the phrase forms), then `repeatedAuthored`
stops exempting cards (6 now, pending).

**Questions for main:** none.

## 2026-11-16 04:30 · branch head after this commit

**Done (pushed, gated: tsc, vite build, prompt budget, test:all 7244 pass; the only failures are engines-browser and
dev-frame-mount-browser, which fail only in the gate's git worktree and pass in the main tree):**
- `d106f641` J2 part 3: one joint per seam. A park or aside line leads into the card; no backTo or "Ek baar aur dekho:" stacked on it.
  Counts: backTo 11 → 10.
- `f1199573` J2 part 2: a miss verdict and its remediation always have their joint (placed at the final assembly). Gated
  `missRemediationJoint`: 3 on director22's steady fixture rows, 0 dry. Counts: beforeRemediation 28 → 37; turnsOver60Words 50 → 59.
- `73ee3735` J2 part 1: backTo when, and only when, a card comes back after another unit (heldUp unit ≠ the card's). `backToJoint`
  reads both directions: 25 → 0. Counts: backTo 36 → 11.
- `dcb68b84` (028) the harness's miss on a currency key is a near value ("₹381"), not "pata nahi, shayad wahi".
- `d7d3e481` (release 29) R, the reader, and T, the ending, of dc-r8-director22.

**Doing next:** J2's last rule (nothing between a unit's own point and its card), then W (`cardsSaidAgainWithin2` 69: after
"main khud karti hoon" a go-ahead and wait; `repeatedAuthored` stops exempting cards), then H, B, K, A.

**Questions for main:** none open.

(The earlier notes in docs/design/round7/brain/TO-MAIN-2026-11-16.md are folded in here.)
