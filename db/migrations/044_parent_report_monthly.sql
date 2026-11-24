-- 044 (round 7 F, main 2026-11-04: Learning's range extended to 044-049): parent_report.cadence widens to the monthly
-- report (server/reports/**, PARENT-REPORT §2, §9.2; period 'YYYY-MM') and, ahead of batch R2, the term report.
-- Additive and re-runnable.
alter table parent_report drop constraint if exists parent_report_cadence_check;
alter table parent_report add constraint parent_report_cadence_check check (cadence in ('daily', 'weekly', 'monthly', 'term'));
