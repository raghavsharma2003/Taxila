-- 047 (round 7 F, cold-start placement; Learning's range 044-049): the onboarding answers a starting point is made from.
-- { parentView: { [subject]: "hard"|"fine"|"easy"|"unsure" }, childPicks: { [subject]: "tricky"|"okay"|"easy" } }
-- (server/placement/coldstart.js). Written by POST /api/placement/onboarding; each subject's cold-start estimate is a
-- placement row (036) with result.source = 'onboarding', so topic choice and the conductor read it like a placement.
-- Additive and re-runnable.
alter table child add column if not exists onboarding_answers jsonb not null default '{}'::jsonb;
