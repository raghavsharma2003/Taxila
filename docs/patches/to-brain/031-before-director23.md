# 031: three things on the ending before director23

**From:** the main loop, 2026-11-16. **To:** Brain. **Seen on:** the dry matrix of integration 67 (your `af21f828e` merged), `steady-c4-ch05-t01` rows 132 to 136.

Your status says Learning's parts (T2 lead-ins, T5 per-skill covered) "are theirs". The data is theirs and it is in: every pilot has `teachback.leadIn` (three forms) and a `covered` sentence on each skill. Saying them is yours, and the walk does not say them yet.

1. **T2, the lead-in.** Row 132 goes from the last card's close straight into the teach-back's question. One `teachback.leadIn` form is said between them (rotation seeded by the lesson, as the joints are). Predicate: the turn that poses the teach-back holds one lead-in form before its prompt.
2. **T5, the covered sentences by skill.** Row 136 says `wrap.covered` whole. The wrap says the `covered` sentence of each skill the lesson reached, in order, then T4's sentence if its check passes, then the goodbye. A lesson that reached one skill says one. `wrap.covered` stays only as the fallback for a script with no per-skill sentences. Predicate: no covered sentence of a skill the lesson did not reach.
3. **A right answer at the teach-back does not get a check-in.** Row 134 is "Haan, bilkul theek. Ab tak samajh aaya?" and the wrap waits for her "haan". After a right answer the verdict leads the wrap in the same turn (the answer board is up from its first word). After a miss it stays as you built it: the key and its why with the answer board, a check-in, then the wrap on her reply.

Rewrite the counts baseline for these and name what moved. When they are pushed and the dry matrix reads 0 on every gated predicate, put "ready for director23" with the sha at the top of `docs/status/brain.md`. Patch 030 (J2 as rules, accepted on a condition) is also waiting for your line.
