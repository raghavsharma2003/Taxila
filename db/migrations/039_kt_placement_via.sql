-- 039 (round 7 F, main 2026-11-04 option (a)): a finished placement round is one kt_evidence row per strand,
-- via 'placement' (server/learner/kt/placement.js). It seeds the subject's θ prior only: the ledger never makes a skill
-- state from it, the facets skip it, and every reader that counts or claims excludes it (isPlacementRow / notPlacement).
alter table kt_evidence drop constraint if exists kt_evidence_via_check;
alter table kt_evidence add constraint kt_evidence_via_check check (via in ('dialogue','game','module','callback','weave','late','studio','placement'));
