truncate student_event, job, wakeup, conductor_state, child_seq, child restart identity cascade;
insert into child values ('00000000-0000-0000-0000-000000000001');
insert into child_seq values ('00000000-0000-0000-0000-000000000001', 5, null);
insert into conductor_state values ('00000000-0000-0000-0000-000000000001', 0);
insert into job (kind, child_id, idem_key, status, attempts) overriding system value values ('memory.consolidate','00000000-0000-0000-0000-000000000001','memory.consolidate:L1','running',1);
insert into wakeup values ('00000000-0000-0000-0000-000000000001','day_start:2026-10-03', now()-interval '1 minute','day_start', null);
