-- 028: the default lesson hours are 06:30-21:30 IST (round 4 journey audit #11, owner-approved 2026-10-10; was
-- 07:00-20:30, which refused Indian homework time after 20:30). The app writes the hours explicitly on every
-- controls save; this keeps a row inserted without them on the same default. Existing rows are not changed: a
-- parent's saved hours are theirs.
alter table child_controls alter column hours_start set default '06:30';
alter table child_controls alter column hours_end set default '21:30';
