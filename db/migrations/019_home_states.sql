-- W2-A (BUILD-PLAN §4 W2-A #4, #9; STUDENT-FLOW §4.2 SF1; flows G8, G12). Additive only.
--
-- 1. Home states the parent drives (server/routes/child.js homeStateOf):
--    homework_until: the parent's "Homework help today" (Controls) opens the child home on the `homework` card until
--      this time (the end of today's learning day); the day's lesson stays as the second card. Never a promise to the child.
--    test_window: a school test the parent entered (subject + dates). Inside the window the home shows
--      "Revision for {subject} test" (`test_window`) and the lesson revises that subject. Calm copy, no countdown.
-- 2. text_only: Controls' "Tap and type only" is a per-CHILD setting the server returns with the plan (was a device-local
--    pref, tap-and-type-device-local), so a parent setting it on their own phone reaches the child's phone.
-- 3. password_reset: "Forgot password?" by email. Only a sha256 of the one-time token is stored; single use; 30 minutes.
alter table child_controls add column if not exists homework_until timestamptz;
alter table child_controls add column if not exists text_only boolean not null default false;

-- one school test window per child, parent-entered: { "subject": "maths", "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" } (≤ 21 days).
-- A column of child_controls (not a new child_id table): it is a parent-entered control, kept by the M0 ratchet with them.
alter table child_controls add column if not exists test_window jsonb;

create table if not exists password_reset (
  token_hash  text primary key,
  guardian_id uuid not null references guardian(id) on delete cascade,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists password_reset_guardian on password_reset (guardian_id, created_at desc);
