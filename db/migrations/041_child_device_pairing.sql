-- 041 (round 7, stream G platform-child-pairing): a child's own device, paired by a one-time code from the parent.
-- A paired device holds an ordinary auth_session row (cookie tx_child, never tx_session) plus a device_session row that
-- binds it to one child: every route that joins auth_session by token hash keeps working (guardian_id is the child's
-- guardian), and the scope is enforced in server/auth.js (child routes only, that one child; a parent session is an
-- auth_session row with NO device_session). Unpairing deletes the auth_session row (cascading here): the session ends
-- at once. pair_code: the parent's current code for a child (one per child: a new code replaces the old one); code_hash
-- is the sha256 of the code and redeeming deletes the row (single use). Additive and re-runnable; erasing a child
-- cascades both tables.
create table if not exists device_session (
  token_hash    text primary key references auth_session(token_hash) on delete cascade,
  id            uuid not null unique default gen_random_uuid(),
  child_id      uuid not null references child(id) on delete cascade,
  label         text,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz
);
create index if not exists device_session_child on device_session(child_id);

create table if not exists pair_code (
  child_id     uuid primary key references child(id) on delete cascade,
  guardian_id  uuid not null references guardian(id) on delete cascade,
  code_hash    text not null unique,
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now()
);
