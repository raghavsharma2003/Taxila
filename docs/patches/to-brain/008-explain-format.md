# F Learning → A Brain, 008: choose the explain format by the population allocator (round 7 F, learning-how-this-child-learns)

**Today:** every explain uses `kit.formats.primary` (`director/state.js` `plan("explain", …, { format: kit.formats.primary })`). `formats.secondary` is parsed and never read, so the product never learns which way of explaining works for a topic type at a band.

**Learning's side** (`server/learner/formats.js`, `formatJobs.js`; on `claude/r7-learning`):
- `eligibleFormats(kit)`: the primary plus the secondary formats (F5 chant only for T1/T2).
- `allocateFormat(eligible, posteriors, { seed })`: PURE and seeded. It is Thompson sampling with a 0.2 exploration floor and returns `{ format, propensity, explored }`. The same seed gives the same choice, so replay is exact.
- `posteriorsFor(topicType, band)`: the POPULATION rows of `format_posterior` (016; no child id).
- The night job `format.join:{child}:{day}` scores each `explain_format` decision of the day by the first scored answer on that skill after it (first try unaided = 1). It adds the result to the population posterior. Nothing is written per child.

## The patch (yours)
1. **Lesson start** (`routes/lesson.js`): load the posteriors once, beside the kit:
   ```js
   import { eligibleFormats, posteriorsFor } from "../learner/formats.js";
   const formatPostP = early(posteriorsFor(kit.topicType, band));       // {} on any error → uniform priors
   // into initLessonState ctx: formatPosteriors: await formatPostP, formatsEligible: eligibleFormats(kit)
   ```
2. **The first explain of each skill** (`director/state.js`, where it plans `explain` with `format: kit.formats.primary`):
   ```js
   import { allocateFormat, POINT_ID } from "../learner/formats.js";
   const pick = allocateFormat(s.ctx.formatsEligible, s.ctx.formatPosteriors, { seed: `${s.ctx.sessionId}:${sk.id}` })
     ?? { format: kit.formats.primary, propensity: 1, explored: false };
   // keep pick.format for this skill for the rest of the lesson (a re-explain uses reteach's own arms, not this)
   ```
   Then use `pick.format` where `kit.formats.primary` is used today.
3. **Log the choice** with your decision_record writer (`brain/trace.js`), once per skill:
   ```js
   { point_id: POINT_ID, options: { eligible: s.ctx.formatsEligible, skillId: sk.id, topicType: kit.topicType, band },
     chosen: pick.format, chosen_by: pick.explored ? "explore" : "thompson", randomised: true, propensity: pick.propensity }
   ```
   `options.skillId`, `topicType` and `band` are what the night join reads. Without them a decision is skipped, never guessed.
4. **The board and Studio** read the format they already receive (F3: picture or number line first; F2: one solved example first; and so on). No change is needed there beyond getting the allocated format instead of the primary.

## What stays the same
- A kit with one eligible format gets it, with propensity 1.
- The reteach ladder keeps its own arms (comprehension/resolve.js).
- No parent or child line says how a child "learns best". The parent sees counts of what Taxila did (S5, teaching page).

## Check
`tests/r7-learning-formats.test.mjs` covers:
- eligibility;
- determinism by seed;
- the floor (every eligible format is picked at least floor/k of the time);
- propensity in (0, 1];
- the outcome rule;
- the night join's population upsert with no child id.
