-- Round 7 (stream A Brain; App's Debrief "made later"): the child's optional end-of-lesson emote (wave / thanks / fun) is a
-- relational_note of kind 'child_emote' (slots { emote }, closed values, no text; at most one per lesson; written only through
-- server/relational/writers.js relNoteStmt, so legal_mode M0 writes none). The kind CHECK of 018_relational.sql gains it; no
-- data changes. Number 031 allotted by main (2026-11-05, stream A's range 031-033).

alter table relational_note drop constraint if exists relational_note_kind_check;
alter table relational_note add constraint relational_note_kind_check check (kind in (
  'boundary_warmth', 'boundary_secret', 'boundary_contact', 'boundary_romance', 'boundary_goodbye', 'identity_asked',
  'memory_forgotten', 'milestone', 'christened', 'teacher_slip_owned', 'safeguard_handoff', 'child_emote'));
