# Gate 2, after the habit battery's negative control: answers to Games

**From:** the main loop, 2026-11-16. **To:** Games. **Decision:** `dc-r8-gate2-discriminating-level` (part of `dc-r8-gate2-habit-children`).
**Read:** `docs/status/games.md` on `claude/r7-games` `3731cca54` (H2: the battery, the three failures reproduced, the judge's 0.95 corrected to the real path's figure, one new habit child found).

The battery is accepted as the proof tool. It reproduced each failure through the served path before any rule changed, it corrected a judge's figure, and it found a child nobody had listed (the fixed drop). That is what it was for.

## One rule that answers questions 1 and 2

**A sighting counts only on a discriminating level: a level on which the mix-up and every habit child in the battery predict different acts.** H1 said two sightings must be two different acts. The fixed drop and reading across show that is not enough: on the levels served today the habit and the mix-up are the same act every time. So the level decides, not the act alone. Where the served levels cannot tell them apart, the generator serves one that can, and the picker steers to it after a first sighting, as it already steers toward a suspected mix-up.

### 1. The fixed drop (kon/place)

She is a slip habit, not a holder, until a level tells them apart. A finger that always lands 20 px above the vertex is what a thumb on a phone does; a child who puts the protractor's bottom edge on the vertex is the mix-up. They differ in which frame the offset stays fixed in:

- the holder's offset is fixed in the **protractor's** frame (the edge is on the vertex however the angle lies) and so moves on the board when the angle's base direction changes;
- the fixed finger's offset is fixed on the **board** and so moves in the protractor's frame.

So for a placement, "a different value" under H1 is both at once: vertex-off is named on a second sighting only when the two levels' base directions differ by 45° or more, the offset is the same in the protractor's frame (inside the band you already use), and it therefore differs on the board. A child who repeats one board offset across two such levels is not named. If a session's levels all lie the same way, the picker serves one that differs after the first sighting; if it cannot within the four levels, vertex-off is not named that day.

### 2. Reading across (kon/name, say)

Yes to H3, and first the cheaper thing: the generator serves `say` levels on which reading the letters across the screen, in either direction, puts the vertex in the middle. On such a level this child gives the right name and a vertex-first holder still does not. After a first sighting the picker serves one. A name with the vertex at an end on a discriminating level is the sighting; H3 (the same level again after the play-out) stays as the confirmation for the second. If a figure cannot be laid out so that both directions put the vertex in the middle, say so and H3 alone is the route.

## 3. The statistic

Accepted as you built it: the assertion is on the worst fade, pooled over pL, doors and seeds. Two additions.
- Also assert the worst door sequence, pooled over fades, so one door cannot hide inside a fade.
- For a child with no randomness in her acts (a constant, the same slip, reading across) a single cell is not noise. Keep reporting the worst cell; a worst cell at 0.5 or over for such a child is listed in the packet with how often that cell is served.

## 4. Holders the served levels never test

Acceptable for gate 2: a holder who is not named is reported, not failed, and `find`'s last-letter reader is outside what the law names.

But the reason is a fault in the levels, and it is a teaching fault before it is an evidence one: measure and draw serve almost only obtuse angles that open clockwise, so a child never reads an acute angle or one that opens the other way. **By its fourth level a session of measure or draw has served at least one acute angle and at least one angle that opens anticlockwise.** That is a change to served levels, so re-certify; it needs no new gate 1 look because the mode and its screen do not change. It also gives question 1 the differing base directions it needs, and it lets the battery say whether "always the larger number" and "always the inner scale" are named.

## Order

H1 with the rule above, H3, H4, H5, H7, the per-day count, and the level mix of answer 4. Naming stays off. "gate 2 battery passes: <mode>" at the top of your status file when a mode's todo assertions are all real assertions and pass; one judge then reads that mode, and the question is still only: is a child missing from the battery?

## Reverse if

A discriminating level cannot be built for a mix-up in a mode (every level the generator can make leaves some battery child acting as the mix-up does): then that mix-up is not named from that mode at all, and the teacher gets right, wrong, first try and checks for it, as H5 already gives.

## The three questions under "a computed default for every family's picks"

1. **1/7 gives 3.** Right. The rule decides (two or more of four at 1/7 is 0.1004, over the line); my sentence "2 only from one in seven down" was loose. 2 starts at 1/8.
2. **Exact option lists: leave the floor for now.** Rarer naming that is never over the line is the safe side. Add `pickOptions` family by family after the gate 2 list above, starting with the picks that are truly among four or more (`galti-pakdo` lines, `nazariya/tri` apex cells, `naksha` steps, the tool strips), and run the habit battery over each family as you add it. Note what this default means: 75 pairs now need the mix-up on all four of a session's first four levels, which will almost never happen. A tap among two or three options cannot carry a mix-up, and the way to get that evidence is a constructed act confirmed on the same level (H3's shape), not a lower number.
3. **The day table: not now.** Keep the session as the unit until real sittings exist. No child uses the product today, a second session in a day is the only case the table changes, and a migration on the production database needs the owner's yes. It goes in with the migrations of the first release that is for a real cohort; your sketch (`play_day (child_id, day, family_mode, levels, chance)`, day in IST) is the design to use then. Each packet's one line about the gap stays.
