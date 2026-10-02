-- Guardian gate (PRODUCT-DESIGN §6.2, decision ds-parent-gate-pin-default) and stored parent controls (§6.9).
-- The PIN is a 4-6 digit secret on a shared family phone: only its scrypt hash is kept, wrong tries are
-- counted server-side (5 wrong → a 15 min wait), and an unlock is scoped to ONE guardian session, so a child
-- using the same cookie on the same phone is never inside the Parent corner unless a grown-up typed the PIN.
create table if not exists guardian_pin (
  guardian_id   uuid primary key references guardian(id) on delete cascade,
  pin_hash      text not null,                       -- scrypt$N$r$p$salt$hash (server/auth.js hashPassword)
  failed        int  not null default 0,             -- consecutive wrong tries since the last success
  locked_until  timestamptz,                         -- set after 5 wrong tries
  updated_at    timestamptz not null default now()
);

-- Per-session unlock of the Parent corner (null = locked). Short-lived; the client re-asks for the PIN after it.
alter table auth_session add column if not exists parent_unlocked_until timestamptz;

-- Parent controls per child. Defaults by class are applied by server/routes/parent.js, not here.
create table if not exists child_controls (
  child_id        uuid primary key references child(id) on delete cascade,
  daily_minutes   int  not null check (daily_minutes between 10 and 120),
  hours_start     text not null default '07:00' check (hours_start ~ '^[0-2][0-9]:[0-5][0-9]$'),
  hours_end       text not null default '20:30' check (hours_end ~ '^[0-2][0-9]:[0-5][0-9]$'),
  captions_always boolean not null default false,
  comfort_mode    boolean not null default false,    -- larger text, calmer screen; never names a condition
  address         text check (address in ('tum','aap')),
  report_channel  text not null default 'whatsapp' check (report_channel in ('whatsapp','app')),
  updated_at      timestamptz not null default now()
)
