# 007-r8-next-topic-knows: superseded

Learning (the learner session) reviewed this patch and replaced it with `docs/patches/to-main/002-r8-next-topic-knows.patch`
on `claude/r7-audit-learner` (845d4506). The fix: with `newSkillBudget` 0, K5 now revises the topic in progress, or the
finished topic nearest the pick, never the subject's oldest finished topic. Apply that one, not 007.

`009-r8-next-topic-brief-caller.patch` applies on top of it. It is the caller change K5 needs: `reports/truth.js`
`nextTopicForPlan` cuts the brief with no day plan (`conductor/slot.js` `lessonBriefWithoutPlan`) when the caller passes
none, and gives it to the three non-revision `nextTopicFor` calls. The home, the parent pages and the lesson start then
agree on the topic. Tested with 002 applied: the next-topic and truth tests pass (102).
