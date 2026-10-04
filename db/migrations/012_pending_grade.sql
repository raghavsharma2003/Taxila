-- W1-C (BUILD-PLAN §3; comprehension audit G2 and G8). Two independent pieces, one allotted number.
--
-- 1. pending_grade: the blind verdict of a held why / teach-back event, written BY EVENT ID the moment it lands
--    (server/comprehension/later.js), so the next turn can read it on any replica (session.js awaitSettled), and the
--    turn's "folded without its verdict" claim (fallback_at), so a verdict that lands after the fold is applied once,
--    as a replay-safe correction event (`<event id>:late`, via 'late'). Verdict labels only: the child's verbatim span
--    is nulled before the row is written (no transcripts_retention consent is wired). No child_id column: the row
--    hangs off its lesson, which cascades from the child (and the M0 ratchet deletes lessons).
create table if not exists pending_grade (
  event_id      text primary key,
  lesson_id     uuid not null references lesson(id) on delete cascade,
  results       jsonb,
  settled_at    timestamptz,
  fallback_at   timestamptz,
  corrected_at  timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists pending_grade_lesson on pending_grade (lesson_id);
create index if not exists pending_grade_created on pending_grade (created_at);
-- the correction event's via (U/T only; learner/kt/ledger.js records it as seen and takes no K step)
alter table kt_evidence drop constraint if exists kt_evidence_via_check;
alter table kt_evidence add constraint kt_evidence_via_check check (via in ('dialogue','game','module','callback','weave','late'));

-- 2. test_clock: a server-side clock offset for @taxila.test guardians ONLY (the route refuses every other account
--    with 403 and logs the refusal; server/comprehension/testclock.js). Forward-only, at most 60 days. A request of a
--    guardian with an offset runs with Date shifted by it (runRequestClock); the lesson row's started_at / ended_at,
--    which the database stamps with now(), are shifted by the trigger below so the learner ledger's session times
--    agree with the shifted event times. A guardian with no row (every real account) is untouched.
create table if not exists test_clock (
  guardian_id   uuid primary key references guardian(id) on delete cascade,
  offset_ms     bigint not null default 0 check (offset_ms >= 0 and offset_ms <= 5184000000),
  set_at        timestamptz not null default now()
);

-- One-line plpgsql body (scripts/migrate.mjs splits on ';' at line END only, so the inner ';' stay in one statement).
create or replace function test_clock_shift_lesson() returns trigger language plpgsql as $tc$ declare off bigint; begin select t.offset_ms into off from test_clock t join child c on c.guardian_id = t.guardian_id where c.id = NEW.child_id; if off is null or off = 0 then return NEW; end if; if TG_OP = 'INSERT' then NEW.started_at := NEW.started_at + off * interval '1 millisecond'; elsif NEW.ended_at is not null and OLD.ended_at is null and abs(extract(epoch from (NEW.ended_at - now()))) < 60 then NEW.ended_at := NEW.ended_at + off * interval '1 millisecond'; end if; return NEW; end $tc$;

drop trigger if exists lesson_test_clock_ins on lesson;
create trigger lesson_test_clock_ins before insert on lesson for each row execute function test_clock_shift_lesson();
drop trigger if exists lesson_test_clock_end on lesson;
create trigger lesson_test_clock_end before update of ended_at on lesson for each row execute function test_clock_shift_lesson();
