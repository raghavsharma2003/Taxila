-- 042 (round 7 whole-project audit, platform PLAT-15; numbering: Platform 040-043): the parent's play wording switch.
-- server/play/dress.js withVerb reads child_controls.play_verb on four play routes, and no migration made the column:
-- each read failed and was swallowed, so the operator default (TAXILA_PLAY_VERB) was all any family got. Null = that
-- default; 'scan' or 'fire' = the parent's choice. The parent control that writes it is Games' (server/play) to wire.
alter table child_controls add column if not exists play_verb text check (play_verb in ('scan', 'fire'));
