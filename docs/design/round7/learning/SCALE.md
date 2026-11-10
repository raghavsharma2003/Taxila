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
