#!/usr/bin/env python3
# household-pg16-probe.py (gap-fill G3-household-siblings). Applies household.sql on top of a stub of the
# 001/002/004 tables it depends on (copied from CONDUCTOR.md §2.4, §3.1, §3.9, §4.10.3), then runs functional cases
# F1-F6 and F10 (n = 1 each) and the race cells F7-F8 (n = 5 each), each with a negative control.
# Needs a scratch Postgres 16:  PGHOST=/socket/dir PGPORT=54329 python3 household-pg16-probe.py   (~2 min)
import os, subprocess, sys, time, threading

HOST, PORT = os.environ.get('PGHOST', 'localhost'), os.environ.get('PGPORT', '5432')
DIR = os.path.dirname(os.path.abspath(__file__))
G, G2 = '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a2'
A, B, C = ('00000000-0000-0000-0000-00000000000%d' % i for i in (1, 2, 3))
H = '00000000-0000-0000-0000-0000000000f1'

def psql(db, sql, check=False):
    p = subprocess.run(['psql', '-h', HOST, '-p', PORT, '-U', 'postgres', '-d', db, '-q', '-X', '-t', '-A',
                        '-v', 'ON_ERROR_STOP=1', '-c', sql], capture_output=True, text=True)
    if check and p.returncode: raise RuntimeError(p.stderr)
    return (p.stdout + p.stderr).strip()

BASE = f"""
create extension if not exists pgcrypto;
create function gen_ulid() returns text language sql as $$ select gen_random_uuid()::text $$;
create table guardian (id uuid primary key);
create table child (id uuid primary key, guardian_id uuid not null references guardian(id) on delete cascade);
create table device (id text primary key, guardian_id uuid not null references guardian(id) on delete cascade);
create table workspace (child_id uuid primary key references child(id) on delete cascade, state text not null default 'active');
create table conductor_state (child_id uuid primary key references child(id) on delete cascade, version bigint not null default 0);
create table conductor_usage (child_id uuid not null references child(id) on delete cascade, learning_day date not null,
  used_min real not null default 0, primary key (child_id, learning_day));
create table decision_log (child_id uuid not null references child(id) on delete cascade, version bigint not null,
  primary key (child_id, version));
create table child_seq (child_id uuid primary key references child(id) on delete cascade, last bigint not null default 0,
  pending_since timestamptz);
create table student_event (child_id uuid not null references child(id) on delete cascade, seq bigint not null,
  id text not null, type text not null, source text not null, idem_key text not null, occurred_at timestamptz not null,
  correlation_id text not null, causation_id text, body jsonb not null, traceparent text,
  primary key (child_id, seq), unique (child_id, idem_key));
create or replace function ingest_event(p_child uuid, p_id text, p_type text, p_source text, p_idem text,
  p_occurred timestamptz, p_corr text, p_cause text, p_body jsonb, p_trace text default null)
returns bigint language plpgsql as $$
declare s bigint;
begin
  if exists (select 1 from student_event where child_id = p_child and idem_key = p_idem) then return null; end if;
  insert into child_seq (child_id) values (p_child) on conflict do nothing;
  update child_seq set last = last + 1, pending_since = coalesce(pending_since, now())
   where child_id = p_child returning last into s;
  if current_setting('probe.slow', true) = 'on' then perform pg_sleep(0.4); end if;   -- widens race windows
  insert into student_event (child_id, seq, id, type, source, idem_key, occurred_at, correlation_id, causation_id, body, traceparent)
  values (p_child, s, p_id, p_type, p_source, p_idem, p_occurred, p_corr, p_cause, p_body, p_trace)
  on conflict (child_id, idem_key) do nothing;
  return s;
end $$;
create table wakeup (child_id uuid not null references child(id) on delete cascade, dedupe text not null,
  due_at timestamptz not null, reason text not null, fired_at timestamptz, primary key (child_id, dedupe));
create table notification (id bigint generated always as identity primary key,
  guardian_id uuid not null references guardian(id) on delete cascade, child_id uuid references child(id) on delete cascade,
  cls text not null, dedupe text not null, unique (guardian_id, dedupe));
create table notify_slot (guardian_id uuid not null references guardian(id) on delete cascade,
  child_id uuid not null references child(id) on delete cascade, scope text not null, slot smallint not null,
  notification_id bigint not null references notification(id) on delete cascade, primary key (guardian_id, child_id, scope, slot));
"""
SEED = f"""
insert into guardian values ('{G}'), ('{G2}');
insert into child values ('{A}', '{G}'), ('{B}', '{G}'), ('{C}', '{G}');
insert into device values ('dev1', '{G}');
insert into workspace (child_id) values ('{A}'), ('{B}'), ('{C}');
insert into conductor_state (child_id) values ('{A}'), ('{B}'), ('{C}');
insert into child_seq (child_id) values ('{A}'), ('{B}'), ('{C}');
insert into conductor_usage values ('{A}', '2026-10-05', 20), ('{B}', '2026-10-05', 0), ('{C}', '2026-10-05', 0);
insert into household (id, owner_guardian_id, tz) values ('{H}', '{G}', 'Asia/Kolkata');
insert into household_member (child_id, household_id, ref) values ('{A}', '{H}', 1), ('{B}', '{H}', 2), ('{C}', '{H}', 3);
insert into household_device values ('dev1', '{H}', 0);
insert into household_slot values
  ('{H}', '2026-10-05', '{A}', 0, 0, 1, '2026-10-05 16:30+05:30', '2026-10-05 16:51+05:30', 'planned'),
  ('{H}', '2026-10-05', '{B}', 0, 0, 1, '2026-10-05 16:56+05:30', '2026-10-05 17:24+05:30', 'planned'),
  ('{H}', '2026-10-05', '{C}', 0, 0, 1, '2026-10-05 17:29+05:30', '2026-10-05 18:21+05:30', 'planned');
insert into household_inbox (household_id, child_id, day, kind, body) values
  ('{H}', '{A}', '2026-10-05', 'plan_reported', '{{"requestedMin":21}}'),
  ('{H}', '{B}', '2026-10-05', 'plan_reported', '{{"requestedMin":28}}');
insert into household_decision values ('{H}', 1, now(), now(), 'probe', '2026-10-05', 2, '{{}}', '[]');
insert into household_decision_member values ('{H}', 1, '{A}', 1, '{{}}'), ('{H}', 1, '{B}', 2, '{{}}'), ('{H}', 1, '{C}', 3, '{{}}');
"""

def fresh(name):
    subprocess.run(['dropdb', '-h', HOST, '-p', PORT, '-U', 'postgres', '--if-exists', name], capture_output=True)
    subprocess.run(['createdb', '-h', HOST, '-p', PORT, '-U', 'postgres', name], check=True)
    psql(name, BASE, check=True)
    p = subprocess.run(['psql', '-h', HOST, '-p', PORT, '-U', 'postgres', '-d', name, '-q', '-X', '-v', 'ON_ERROR_STOP=1',
                        '-f', os.path.join(DIR, 'household.sql')], capture_output=True, text=True)
    if p.returncode: raise RuntimeError(p.stderr)
    psql(name, SEED, check=True)
    return name

results = []
def rec(ok, label, got):
    results.append(ok); print(('PASS ' if ok else 'FAIL ') + label + ' :: ' + str(got).replace('\n', ' ')[:220]); sys.stdout.flush()

def race(db, a_sql, b_sql, delay, n=5, reset=None):
    """Run a_sql, then b_sql `delay` s later, in separate sessions; count deadlocks over n runs."""
    dl, outs = 0, []
    for _ in range(n):
        if reset: reset()
        out = {}
        def go(k, s): out[k] = psql(db, s)
        t = threading.Thread(target=go, args=('a', a_sql)); t.start(); time.sleep(delay)
        go('b', b_sql); t.join()
        dl += (out['a'] + out['b']).count('deadlock detected'); outs.append(out)
    return dl, outs

print('server_version', psql('postgres', 'show server_version'))
# ---------------- F1 exclusion constraint ----------------
db = fresh('hh_f1')
r = psql(db, f"insert into household_slot values ('{H}','2026-10-05','{B}',1,0,2,'2026-10-05 17:20+05:30','2026-10-05 17:40+05:30','done')")
rec('exclusion constraint' in r, 'F1a I-H1: an overlapping row in the same lane is refused at COMMIT (23P01)', r)
r = psql(db, f"insert into household_slot values ('{H}','2026-10-05','{B}',1,0,2,'2026-10-05 16:51+05:30','2026-10-05 16:56+05:30','done')")
rec(r == '', 'F1b adjacent half-open ranges [16:51,16:56) between two windows are accepted', r or 'ok')
r = psql(db, f"insert into household_slot values ('{H}','2026-10-05','{B}',2,1,2,'2026-10-05 16:30+05:30','2026-10-05 16:50+05:30','done')")
rec(r == '', 'F1c the same time on lane 1 (a second phone) is accepted', r or 'ok')
swap = f"""begin;
update household_slot set starts_at='2026-10-05 17:00+05:30', ends_at='2026-10-05 17:28+05:30' where child_id='{A}' and seq=0;
update household_slot set starts_at='2026-10-05 16:30+05:30', ends_at='2026-10-05 16:51+05:30' where child_id='{B}' and seq=0;
update household_slot set starts_at='2026-10-05 17:33+05:30', ends_at='2026-10-05 18:25+05:30' where child_id='{C}' and seq=0;
commit;"""
db = fresh('hh_f1b'); r = psql(db, swap)
rec(r == '', 'F1d a pass that re-times all three windows (crossing transiently) commits: the constraint is DEFERRED', r or 'ok')
db = fresh('hh_f1c'); r = psql(db, swap.replace('begin;', 'begin; set constraints household_slot_no_overlap immediate;'))
rec('exclusion constraint' in r, 'F1d-control the same pass with the constraint IMMEDIATE fails mid-pass', r)

# ---------------- F2 per-guardian cap ----------------
db = fresh('hh_f2')
seqs = [psql(db, f"select coalesce(notify_take('{G}','learn:2026-W41','{c}',{x},null)::text,'blocked')") for c, x in
        [('weekly_letter', 'null'), ('weekly_letter', 'null'), ('milestone', f"'{A}'"), ('milestone', f"'{B}'"), ('test_window', f"'{C}'")]]
rec(seqs == ['1', 'blocked', '2', 'blocked', 'blocked'], 'F2a I-H2: per guardian-week, the family letter takes slot 1 once, ONE other learning push takes slot 2, the rest block', seqs)
wb = [psql(db, f"select coalesce(notify_take('{G}','wb:2026-W41','wellbeing_note','{x}',null)::text,'coalesced')") for x in (A, B)]
rec(wb == ['1', 'coalesced'], 'F2b one wellbeing pointer per guardian-week; the second child coalesces into the in-app note', wb)
v = psql(db, f"select coalesce(notify_take('{G2}','learn:2026-W41','milestone','{A}',null)::text,'blocked')")
rec(v == '2', 'F2c a second guardian (viewer) has her own recipient cap', v)
r = psql(db, f"insert into notify_slot (guardian_id, scope, slot, cls, child_id) values ('{G}','learn:2026-W42',1,'milestone','{A}')")
rec('violates check constraint' in r, 'F2d slot 1 cannot hold a milestone (it is the family letter\'s)', r)

# ---------------- F3 erasure keeps the cap (tombstone) ----------------
db = fresh('hh_f3')
psql(db, f"insert into notification (guardian_id, child_id, cls, dedupe) values ('{G}','{A}','milestone','ms:a:1')")
psql(db, f"select notify_take('{G}','learn:2026-W41','milestone','{A}',(select id from notification where dedupe='ms:a:1'))")
psql(db, f"delete from child where id='{A}'")
row = psql(db, "select slot||':'||coalesce(child_id::text,'null')||':'||coalesce(notification_id::text,'null') from notify_slot")
again = psql(db, f"select coalesce(notify_take('{G}','learn:2026-W41','milestone','{C}',null)::text,'blocked')")
rec(row == '2:null:null' and again == 'blocked', 'F3 I-H2/I-H6: erasing the child who took slot 2 leaves a content-free tombstone; a sibling is still capped', f'{row}; next={again}')
db = fresh('hh_f3c')
psql(db, "alter table notify_slot drop constraint notify_slot_child_id_fkey, add constraint notify_slot_child_id_fkey foreign key (child_id) references child(id) on delete cascade")
psql(db, f"select notify_take('{G}','learn:2026-W41','milestone','{A}',null)"); psql(db, f"delete from child where id='{A}'")
again = psql(db, f"select coalesce(notify_take('{G}','learn:2026-W41','milestone','{C}',null)::text,'blocked')")
rec(again == '2', 'F3-control with ON DELETE CASCADE the erasure frees the slot and the guardian gets a 3rd push', again)

# ---------------- F4 erasure isolation ----------------
db = fresh('hh_f4')
snap = lambda: psql(db, f"""select md5(string_agg(t, '|' order by t)) from (
  select 'h:'||id||version||anchor_school as t from household union all
  select 'm:'||child_id||ref||state from household_member where child_id<>'{A}' union all
  select 's:'||child_id||seq||starts_at||ends_at||hh_version from household_slot where child_id<>'{A}' union all
  select 'd:'||version||output from household_decision union all
  select 'e:'||child_id||seq from student_event) x""")
before = snap()
psql(db, f"update workspace set state='erasing' where child_id='{A}'")
psql(db, f"begin; update household set version = version where id='{H}'; update household_member set state='leaving' where child_id='{A}'; commit;")
psql(db, f"delete from child where id='{A}'")
left = psql(db, f"""select (select count(*) from household_slot where child_id='{A}') + (select count(*) from household_member where child_id='{A}')
  + (select count(*) from household_inbox where child_id='{A}') + (select count(*) from household_decision_member where child_id='{A}')
  + (select count(*) from wakeup where child_id='{A}') + (select count(*) from notify_slot where child_id='{A}')""")
after = snap()
rec(before == after and left == '0', 'F4 I-H6: erasing one sibling leaves the household row, the siblings\' members/slots, the decision record and every log unchanged; 0 rows carry the erased id', f'unchanged={before == after}; rows left={left}')

# ---------------- F5 courier ----------------
db = fresh('hh_f5')
psql(db, f"""insert into wakeup (child_id, dedupe, due_at, reason, event_type, payload) values ('{B}', 'hh:2026-10-05:v2', now(), 'household',
  'household.window_assigned', '{{"day":"2026-10-05","hhVersion":2,"lane":0,"from":"17:00","to":"17:28","state":"planned","cause":"sibling_replan","reason":"forged"}}')""")
n1 = psql(db, 'select count(*) from fire_wakeups(500)'); n2 = psql(db, 'select count(*) from fire_wakeups(500)')
ev = psql(db, f"select type||'|'||source||'|'||(body->>'hhVersion')||'|'||(body->>'cause')||'|'||(body->>'reason') from student_event where child_id='{B}'")
rec(n1 == '1' and n2 == '0' and ev == 'household.window_assigned|system|2|sibling_replan|household', 'F5 the courier row becomes ONE household.window_assigned event in that child\'s log, payload merged under the courier keys (a forged `reason` loses); a re-fire adds nothing', f'{n1},{n2}: {ev}')

# ---------------- F6 FK lock compatibility ----------------
def inbox_wait(alloc_lock):
    db = fresh('hh_f6')
    out = {}
    def alloc(): out['a'] = psql(db, f"begin; {alloc_lock}; select pg_sleep(2); commit;")
    t = threading.Thread(target=alloc); t.start(); time.sleep(0.3)
    t0 = time.time(); psql(db, f"insert into household_inbox (household_id, child_id, day, kind, body) values ('{H}','{B}','2026-10-05','plan_reported','{{}}')")
    w = time.time() - t0; t.join(); return w
w = inbox_wait(f"update household set version = version + 1 where id = '{H}'")
rec(w < 0.5, 'F6 the allocator\'s household UPDATE (NO KEY UPDATE) never blocks a child commit\'s household_inbox insert (FK KEY SHARE)', f'{w:.2f} s')
w = inbox_wait(f"select 1 from household where id = '{H}' for update")
rec(w > 1.4, 'F6-control an allocator that takes SELECT … FOR UPDATE blocks every child commit\'s inbox insert', f'{w:.2f} s')

# ---------------- F7 notify_slot races (n = 5) ----------------
def take(child, cls, sleep):
    return f"begin; select 'T'||coalesce(notify_take('{G}','learn:2026-W41','{cls}','{child}',null)::text,'x'); select pg_sleep({sleep}); commit;"
db = fresh('hh_f7'); reset = lambda: psql(db, 'truncate notify_slot')
dl, outs = race(db, take(A, 'milestone', 1), take(B, 'milestone', 0), 0.3, reset=reset)
got = [sorted([o['a'].split()[0] if o['a'] else '', o['b'].split()[0] if o['b'] else '']) for o in outs]
rec(dl == 0 and all(g == ['T2', 'Tx'] for g in got), 'F7a two siblings\' commits race for slot 2: exactly one wins, the other blocks, 0/5 deadlocks', f'deadlocks {dl}/5; {got[0]}')
both = lambda first, second, child: f"begin; select notify_take('{G}','learn:2026-W41','{first}',{child},null); select pg_sleep(0.8); select notify_take('{G}','learn:2026-W41','{second}',{child},null); commit;"
dl, _ = race(db, both('weekly_letter', 'milestone', 'null'), both('weekly_letter', 'milestone', f"'{B}'"), 0.3, reset=reset)
rec(dl == 0, 'F7b two commits each taking slot 1 then slot 2: 0/5 deadlocks', f'deadlocks {dl}/5')
dl, _ = race(db, both('weekly_letter', 'milestone', 'null'), both('milestone', 'weekly_letter', f"'{B}'"), 0.3, reset=reset)
rec(dl >= 1, 'F7-control one commit takes 1 then 2, the other 2 then 1: deadlocks', f'deadlocks {dl}/5')

# ---------------- F8 lock-order cells (n = 5) ----------------
ALLOC = lambda touch_a, sleep: f"""begin; update household set version = version + 1, lease_until = now() + interval '30 seconds' where id = '{H}';
update household_slot set hh_version = hh_version + 1 where household_id = '{H}' {"" if touch_a else f"and child_id <> '{A}'"};
delete from household_inbox where household_id = '{H}' and id <= 1000;
select pg_sleep({sleep});
insert into household_decision values ('{H}', 2, now(), now(), 'probe', '2026-10-05', 1000, '{{}}', '[]') on conflict do nothing;
insert into household_decision_member values ('{H}', 2, '{B}', 2, '{{}}'), ('{H}', 2, '{C}', 3, '{{}}') on conflict do nothing;
{f"insert into wakeup (child_id, dedupe, due_at, reason, event_type, payload) values ('{A}', 'hh:x:v'||txid_current(), now(), 'household', 'household.window_assigned', '{{}}');" if touch_a else ""}
insert into wakeup (child_id, dedupe, due_at, reason, event_type, payload) values
  ('{B}', 'hh:x:v'||txid_current(), now(), 'household', 'household.window_assigned', '{{}}'),
  ('{C}', 'hh:x:v'||txid_current(), now(), 'household', 'household.window_assigned', '{{}}');
commit;"""
COMMIT_B = lambda sleep: f"""begin; update conductor_state set version = version + 1 where child_id = '{B}';
select pg_sleep({sleep});
insert into wakeup values ('{B}', 'day_start:2026-10-06', now() + interval '1 day', 'day_start', null) on conflict (child_id, dedupe) do update set due_at = excluded.due_at where wakeup.fired_at is null;
select notify_take('{G}', 'learn:2026-W41', 'milestone', '{B}', null);
insert into household_inbox (household_id, child_id, day, kind, body) values ('{H}', '{B}', '2026-10-05', 'plan_reported', '{{}}');
update child_seq set pending_since = null where child_id = '{B}';
commit;"""
db = fresh('hh_f8a'); rs = lambda: psql(db, 'truncate notify_slot; delete from wakeup')
d1, _ = race(db, ALLOC(False, 1), COMMIT_B(0), 0.3, reset=rs); d2, _ = race(db, COMMIT_B(1), ALLOC(False, 0), 0.3, reset=rs)
rec(d1 + d2 == 0, 'F8a allocator vs a sibling\'s Conductor commit, each side first: 0/10 deadlocks', f'{d1}/5 + {d2}/5')
db = fresh('hh_f8b')
FIRE = "set probe.slow = 'on'; select count(*) from fire_wakeups(500);"
def rs_b():
    psql(db, f"delete from wakeup; insert into wakeup values ('{B}','day_start:a', now() - interval '1 minute','day_start',null), ('{C}','day_start:a', now() - interval '1 minute','day_start',null)")
d1, _ = race(db, FIRE, ALLOC(False, 0.5), 0.1, reset=rs_b); d2, _ = race(db, ALLOC(False, 1), FIRE, 0.3, reset=rs_b)
fired = psql(db, "select count(*) from student_event where type = 'clock.wakeup'")
rec(d1 + d2 == 0, 'F8b allocator courier inserts vs a slow two-child fire_wakeups batch, each side first: 0/10 deadlocks', f'{d1}/5 + {d2}/5; clock.wakeup events {fired}')
# erasure with the (2b) fence vs an in-flight allocator that started BEFORE the fence (so it still touches A)
ERASE_FENCED = f"""begin; update household set version = version where id = '{H}'; update household_member set state = 'leaving' where child_id = '{A}'; commit;
delete from child where id = '{A}';"""
ERASE_BARE = f"delete from child where id = '{A}';"
d_ok = 0; outs_ok = []
for i in range(5):
    db = fresh('hh_f8c'); d, o = race(db, ALLOC(True, 1), ERASE_FENCED, 0.3, n=1); d_ok += d; outs_ok.append(psql(db, f"select count(*) from child where id='{A}'"))
rec(d_ok == 0 and all(x == '0' for x in outs_ok), 'F8c erasure with the household fence (2b) vs an allocator already touching the erased child: 0/5 deadlocks, child erased', f'deadlocks {d_ok}/5; remaining {outs_ok}')
d_bad = 0
for i in range(5):
    db = fresh('hh_f8c'); d, o = race(db, ALLOC(True, 1), ERASE_BARE, 0.3, n=1); d_bad += d
rec(d_bad >= 1, 'F8c-control the same erasure WITHOUT the fence: the cascade waits on the allocator\'s slot row while the allocator\'s courier FK waits on the deleted child', f'deadlocks {d_bad}/5')
# session.reassign through the courier vs a Director turn on B and a slow fire_wakeups over A and B
REASSIGN = f"""begin; select 1 from workspace where child_id in ('{A}','{B}') order by child_id for update;
update conductor_usage set used_min = used_min - 20 where child_id = '{A}'; update conductor_usage set used_min = used_min + 20 where child_id = '{B}';
select pg_sleep(0.6);
insert into session_reassign (guardian_id, from_child, to_child, scope, minutes, voice_sec, micro_usd_moved, micro_usd_kept)
  values ('{G}', '{A}', '{B}', '{{}}', 20, '{{}}', 0, 0);
insert into wakeup (child_id, dedupe, due_at, reason, event_type, payload) values
  ('{A}', 'ra:'||txid_current(), now(), 'reassign', 'session.reassigned', '{{"direction":"out"}}'),
  ('{B}', 'ra:'||txid_current(), now(), 'reassign', 'session.reassigned', '{{"direction":"in"}}');
commit;"""
TURN_B = f"""begin; select 1 from workspace where child_id = '{B}' for update; select pg_sleep(0.4);
select ingest_event('{B}', gen_ulid(), 'skill.milestone', 'director', 'ms:'||txid_current(), now(), 'c', null, '{{}}'); commit;"""
db = fresh('hh_f8d')
def rs_d(): psql(db, f"delete from wakeup; insert into wakeup values ('{A}','day_start:a', now() - interval '1 minute','day_start',null), ('{B}','day_start:a', now() - interval '1 minute','day_start',null)")
d1, _ = race(db, REASSIGN, TURN_B, 0.2, reset=rs_d); d2, _ = race(db, TURN_B, REASSIGN, 0.2, reset=rs_d)
d3, _ = race(db, FIRE, REASSIGN, 0.1, reset=rs_d)
rec(d1 + d2 + d3 == 0, 'F8d session.reassign (workspaces in id order, courier rows, no child_seq) vs a Director turn and a two-child fire batch: 0/15 deadlocks', f'{d1}/5 + {d2}/5 + {d3}/5')
REASSIGN_DIRECT = f"""begin; select ingest_event('{A}', gen_ulid(), 'session.reassigned', 'system', 'ra:a:'||txid_current(), now(), 'c', null, '{{}}');
select pg_sleep(0.6); select ingest_event('{B}', gen_ulid(), 'session.reassigned', 'system', 'ra:b:'||txid_current(), now(), 'c', null, '{{}}'); commit;"""
BATCH_BA = f"""begin; select ingest_event('{B}', gen_ulid(), 'clock.wakeup', 'clock', 'w:b:'||txid_current(), now(), 'c', null, '{{}}');
select pg_sleep(0.6); select ingest_event('{A}', gen_ulid(), 'clock.wakeup', 'clock', 'w:a:'||txid_current(), now(), 'c', null, '{{}}'); commit;"""
dl, _ = race(db, REASSIGN_DIRECT, BATCH_BA, 0.2)
rec(dl >= 1, 'F8d-control a reassign that ingests straight into both children (A then B) vs a courier batch firing B then A: deadlocks', f'deadlocks {dl}/5')

# ---------------- F10 one pending admission per device ----------------
db = fresh('hh_f10')
up = lambda child, lesson: psql(db, f"""insert into device_admission (device_id, child_id, lesson_id, priority) values ('dev1','{child}','{lesson}',1)
  on conflict (device_id) do update set child_id = excluded.child_id, lesson_id = excluded.lesson_id, priority = excluded.priority, since = now()
  where device_admission.child_id <> excluded.child_id returning child_id""")
r1 = up(A, '00000000-0000-0000-0000-00000000aa01'); r2 = up(A, '00000000-0000-0000-0000-00000000aa02'); r3 = up(B, '00000000-0000-0000-0000-00000000bb01')
cnt = psql(db, "select count(*)||':'||max(child_id::text) from device_admission")
rec(r1 == A and r2 == '' and r3 == B and cnt == f'1:{B}', 'F10 I-H8: a same-child double tap reuses the wait; a profile switch replaces it; never 2 pending admissions on one device', f'{r1[-2:]},{r2 or "reused"},{r3[-2:]} → {cnt[:3]}…')

print(f'\n{sum(results)}/{len(results)} PASS')
