-- 035 (round 7, stream F Learning; dc-r7 D5 "every parent control is wired or hidden", superseding dc-r14's global off):
--   limits_on   the family's own opt-in for the daily limit and lesson hours (off by default: a lesson is always open,
--               as dc-r14 wanted; a parent who turns it on gets the cap, the hours and "done for today", and Brain's
--               mid-lesson wrap). TAXILA_DAY_LIMITS=on|off still forces every child on or off (server/routes/child.js).
--   extra_time  "Extra time to answer" (PRODUCT-DESIGN-V2 §6.5.4): normal | more | most; Voice's duplex patience reads it.
--   data_saver  "Data saver" (§6.5.4): lighter media on slow networks; Voice (TTS transport) and Studio read it.
alter table child_controls add column if not exists limits_on boolean not null default false;
alter table child_controls add column if not exists extra_time text not null default 'normal' check (extra_time in ('normal', 'more', 'most'));
alter table child_controls add column if not exists data_saver boolean not null default false;
