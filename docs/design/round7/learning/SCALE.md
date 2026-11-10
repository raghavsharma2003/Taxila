# Lesson scripts at scale (round 8 proposal, Learning, 2026-11-10)

**Status: proposal only.** Nothing here is decided or built. Figures are from the repo on 2026-11-10 unless marked.

## Where we are
- **Coverage:** 830 kit topics; 34 have a script (4 live pilots and the 30-topic staged batch), so 796 have none. The staged
  batch is all class 4–7 maths, being regenerated under D11–D13. Main's 826 counts the topics with no live script.
- **The format is settled:** v2.3, with answer boards, units true of their card board (the held board), no `bridgeBoard`,
  authored joints, and the D9–D13 leak and figure rules.
- **The pilot loop has done its job:** the director18 judging says so. Every rule it produced is now a predicate in
  `scripts/lesson-scripts/check.mjs`, so a new topic is checked against it without a paid run.

## What a judged batch of 30 costs
- **Authoring:** about 4–6 parallel Claude agents, roughly 150–250k agent tokens per topic (the D10–D12 pilot rewrites used
  110–290k per topic, at medium effort). No Azure model call: the scripts are authored and verified in session.
- **Blind solve:** one solver agent per 30–60 questions, about 10–20k tokens per topic, plus a hand read of every mismatch.
  - Earlier rounds agreed 98–100% on the first pass.
  - Every changed entry is solved again before it is stamped.
- **Predicate gate:** about 3 minutes of CPU per 30 topics with `check.mjs --all`, plus the repo gates. Free.
- **Judged run:** a director run is 16 lessons (4 topics × 4 personas), hand judged by Claude.
  - **Azure cost of a run:** main measures it, and it is not in my data.
  - **Claude judge time:** about 4 judge agents, one per topic, each reading 4 transcripts.
  - **Scale:** judging 30 topics is about 8 such runs, or a sample. Sample 4 topics in 30, chosen to cover each board
    template and each class, and judge the rest by predicate.

## Which checks are by predicate, which need a Claude judge
| By predicate (`check.mjs`, cheap, every topic) | Needs a Claude judge (sampled) |
|---|---|
| Structure and format rules; joints (3 distinct forms, `{said}` slot, word cap, no named topic) | The blind solve of every key, worked example and diagnostic; the hand read of mismatches |
| Studio's whiteboard gate over every unit's card board (W-checks: counts, figure, no reveal) | Register: does it sound like Asha, not a book; are the joints in the topic's voice |
| Brain's runtime validator (V) | Pedagogy: does a remediation teach its misconception; does a point model before it asks |
| Leak rules: no key or distractor still to come; no why naming a later key; no point solving a later card | Class-level naturalness of numbers and contexts (the 1/11 split in director16) |
| Figure rules: a line is a line, a strip is bars, a round whole is round; no card posed on its own answer | Whys with no verb (`check.mjs --manual` lists them; a verb test cannot prove a full clause) |
| Spoken-field lints: no quoted symbol, no rhetorical "?", no formula openings, no doubled lines | Listening: whether her replies follow the child (a run judgement, not a data check) |

## The order I would take topics in
1. **Classes 4–6 maths, in chapter-dependency order** (the curriculum graph's prerequisites). The templates, rules and
   register are proven here, and the kits are blind-verified and deep. That is about 98 − 30 = 68 topics.
2. **Class 7 maths, then 3 maths**, still in dependency order. Their kits are deep (c1–c7 maths depth is complete).
   - Class 3 needs the young register: shorter turns and an aloud passage mode. The patch on its spoken fields is small.
3. **What the learner model can place.**
   - Within a class, take first the topics the placement and kitna-pakka model can already place a child into (topics
     with diagnostic items and a ladder).
   - A script nobody can be routed to teaches nobody.
4. **Classes 1–2 maths**, in a young-band format pass. This means less board text and more concrete-object templates, and
   it may need Studio templates first.
5. **Languages (English and Hindi, c1–c9)** need a language format, not the maths units, so a format decision comes first.
   **Science, EVS and SST** need kit depth from NCERT sources (blocked: ncert.nic.in has returned 503 since 2026-11-08).

**Batching:** 30 topics per batch, drawn from at most 2 classes and 4 chapters, so that one judged run's sample covers the
batch's templates. Each batch is predicate-clean and blind-solved before it is staged.

## Dress (round 8, layer 2): what it adds, and when to build it in
**What dress is.** An example's nouns and labels come from an authored closed set per interest, filled in by code: "12
laddoo" can become "12 cricket balls". The numbers and the key stay the same. A validator proves every line and every board
true for every dress (round 8 PLAN, Decision 1).

**What it adds per topic (estimate):**
- **Authoring.** Mark the dressable nouns in each card's words as slots (`{thing}`, `{things}`, `{place}`). Write each
  topic's closed set, about 4–6 interests with 2–3 nouns each, in hi and en, with their counts and genders. Roughly +30–50%
  on top of today's authoring, about +60–100k agent tokens per topic.
  - Most of the cost is in agreement. Hinglish nouns carry gender ("ek pakki jagah" vs "ek pakka khamba"), so each slot
    carries its own agreement form.
- **Validation.** Predicate only, so no judge cost: the existing gate runs once per dress. A topic with 5 dresses costs 5
  gate passes, about 15 s of CPU each.
- **Judging.** Sample one dress per judged lesson, not every dress. The judge's question is whether the dress reads
  naturally for the class, which predicates cannot answer.
- **Boards are the hard part.** A board must name the same thing: wholes@1 titles, equal-groups labels and the round-whole
  rule. A round whole (roti, pizza) cannot be dressed as a bar or ball. So each dress set has to declare its figure (round,
  strip, countable), and the figure rules refuse a dress whose figure differs from the card's board.

**Recommendation: author the 30 with dress slots from the start; don't retrofit.**
- **Retrofit reopens every spoken field.** The units-true-of-their-board pass (D11) and the leak and register passes
  (D10–D13) would all have to be redone. Every noun becomes a slot, so the gate's counts and figure checks must be re-proved
  per dress.
- **Built in, it is one extra field per card.** Writing the slot once while the line is authored costs less than finding
  it again later.
- **What a start-from-scratch needs.** Format 2.4 has to exist first (`dress` sets and slot syntax in the validator), with
  the four pilots as its models. If director19 passes and Dress starts as planned, part 2's regenerated 30 stay at 2.3. The
  next batches would then be authored at 2.4, and the 30 retrofitted only where a judged run shows dress is wanted on them.
