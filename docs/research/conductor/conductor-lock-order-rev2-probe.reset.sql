-- Per-trial reset for conductor-lock-order-rev2-probe.sh: two children (A, B), one running job for A, one due wakeup each.
truncate student_event, job, wakeup, conductor_state, child_seq, child, commitment restart identity cascade;
insert into child values ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002');
insert into child_seq values ('00000000-0000-0000-0000-000000000001', 5, null), ('00000000-0000-0000-0000-000000000002', 5, null);
insert into conductor_state values ('00000000-0000-0000-0000-000000000001', 0), ('00000000-0000-0000-0000-000000000002', 0);
insert into job (kind, child_id, idem_key, status, attempts) overriding system value values
  ('memory.consolidate','00000000-0000-0000-0000-000000000001','memory.consolidate:L1','running',1);
insert into wakeup values ('00000000-0000-0000-0000-000000000001','day_start:2026-10-03', now()-interval '1 minute','day_start', null),
                          ('00000000-0000-0000-0000-000000000002','day_start:2026-10-03', now()-interval '1 minute','day_start', null);
