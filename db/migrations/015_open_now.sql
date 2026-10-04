-- W1-A (BUILD-PLAN §3, item 2; smooth-reliability G8): the parent's one-tap "Open now for 1 hour" from Controls.
-- Opens the child's lesson HOURS until this time, today only, without changing the saved hours (hours_start/hours_end).
-- The daily limit and "done for today" still hold (server/routes/child.js homeStateOf). Written by POST /api/lesson/open-now.
alter table child_controls add column if not exists open_until timestamptz;
