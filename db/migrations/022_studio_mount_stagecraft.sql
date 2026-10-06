-- ship5 integration (owner-ship-five-2026-10-05): a revealed Stagecraft piece (p4-content) writes its studio_mount row with
-- source 'stagecraft' (server/studio/seam.js writeMount). 017's check allowed only library / live / skeleton / whiteboard,
-- so every Stagecraft reveal's row was refused (103 "[studio] mount row failed: ... studio_mount_source_check" on the local
-- ship5 battery, 2026-10-06): no Made for you card, no parent "Made for {child}", no spend-cap row for those pieces.
-- Widens the check only. Additive; safe to re-run.
alter table studio_mount drop constraint if exists studio_mount_source_check;
alter table studio_mount add constraint studio_mount_source_check check (source in ('library','live','skeleton','whiteboard','stagecraft'));
