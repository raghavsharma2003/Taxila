-- 038 (round 7, stream F Learning; PRODUCT-DESIGN-V2 §6.2 step 6, the name preview): how the child's name SOUNDS, in the
-- parent's own spelling ("Spell it how it sounds": "Aa-rav", "Ishaan" for "Ishan"). Optional; null = say first_name as
-- written. Voice reads it into the per-child name pronunciation on every lane. Letters, marks, spaces, ' and - only
-- (server/routes/account.js spokenNameOf); at most 40 characters.
alter table child add column if not exists name_spoken text check (name_spoken is null or char_length(name_spoken) <= 40);
