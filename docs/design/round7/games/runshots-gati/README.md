# Gati run shots (r7 gati, 360 × 640, deviceScaleFactor 1)

Motion for classes 6 and 7 as a new family (src/play/families/gati/gati.logic.ts, gati.view.ts): drishti (c6-science-ch05-t03
sandarbh, prakaar, do-gati), raftaar (c7-science-ch08-t02 aage, nikaalo, badlo), nishaan (c7-science-ch08-t03 ek-saa).
Nothing runs on a clock: the scene moves one interval only when the child taps the clock button ("Clock +1", "+1 hour",
"+2 s"), and that step is shown gliding; the run only shows what the law already answered.

Made with the play dev harness and a driver that acts ONLY through real input: page.mouse clicks at the centre of the canvas
targets in `window.__play.audit.targets` (eye buttons, at rest / moving, windows, bins, type buttons, lanes, counter wheels),
page.mouse down/move/up drags (lanes onto bins on seed 17), and getByTestId(`play-ctl-<id>`) for the DOM controls (the clock,
the two views, Check). The act lists come from the law's own solve / malActs (read, never dispatched). Every goal was solved
this way on seeds 3 (look 1), 17 (look 3) and 8 (look 2); each mal-rule state was reached the same way. The smallest tap
target in every run was 44 × 44 px.

**r7 quiz fix (2026-11-09, the lead's review: the skill must be the mechanic).** Re-shot by the same real-input driver for
every changed goal (sandarbh, prakaar, aage, nikaalo, badlo) on seeds 3, 17 and 8: 24 gati runs, all as expected, the
law's acts equal to the taps' acts, no clipped label, smallest target 44 × 44 (the aage flag button, the counter wheels'
halves). What changed for the child:
- prakaar: no look shows a thing's drawing or name before Check (look 1 used to); only the light's trail.
- sandarbh: three reference cards at every look; look 1 uses only the kit's own scenes (the lamp post is now the kit's
  signboard; the man on the platform only at looks 2 and 3).
- aage: "Mark here" on each lane chalks where its mover is at the clock's time; the flag is refused until both marks are
  for the same time (and a mover whose trip is over takes no mark). The clock no longer drops marks by itself.
- nikaalo and badlo: after Check the ghost (the typed speed for the same time) lands on the real mark carried down to its
  track, or away from it; the track grows to hold where it lands (the multiply case is no longer clipped at the end).

| file | what it shows |
|---|---|
| taps-sandarbh-s3-solved-p360.png | sandarbh look 1, three kit cards: Aman at the bus stop watched from the boy in the bus, the tree and the girl (at rest from the tree, moving from the two in the bus) |
| taps-sandarbh-s17-solved-p360.png | sandarbh look 3: the passenger from the signboard and the platform (moving) and her seat (at rest, one dot) |
| mal-sandarbh-no-reference-p360.png | m1: "at rest" from every reference (look 1, three cards); magnifiers on the cards that are wrong |
| prakaar-s3-before-check-p360.png | prakaar look 1 before Check: three lights and their trails, numbers only: no drawing, no name |
| taps-prakaar-s3-solved-p360.png | prakaar look 1 after Check: pendulum oscillatory, fan blade circular, slide linear; the things and names shown only now |
| taps-prakaar-s17-solved-p360.png | prakaar look 3: the same, four lights |
| mal-prakaar-curve-circular-p360.png | m2: stepped to 4, the pendulum's arc put on circular; the clock played on, it never goes round; magnifiers on the window and the bin |
| taps-do-gati-s3-solved-p360.png | do-gati: riding along, the merry-go-round's horse only bobs up and down (oscillatory) while from the ground it goes round (circular) |
| taps-do-gati-s17-solved-p360.png | do-gati look 3: a bicycle wheel (linear + circular), a merry-go-round (circular + oscillatory), a one-motion thing |
| mal-do-gati-one-type-p360.png | m3: one type each (the horse only round); magnifier on its window |
| aage-s3-flag-refused-p360.png | aage: one hour stepped, only the scooter marked; both flag buttons dim, the tapped flag refused (no flag until both marks are for one time) |
| aage-s3-marked-p360.png | aage: both marked at 1 h; the car's mark ahead of the scooter's; the flags now live |
| taps-aage-s3-solved-p360.png | aage: marked at the same hour, the car flagged; the run draws each first-hour distance |
| taps-aage-s17-solved-p360.png | aage at look 3 |
| mal-aage-farther-faster-p360.png | m1: both marked at 1 h (the car ahead), then stepped to the end; the scooter (200 km in 4 h) flagged over the car (160 km in 2 h) |
| taps-nikaalo-s3-solved-p360.png | nikaalo: speed = distance ÷ time; the ghost at 60 km/h for 3 h lands on the trip's end mark, carried down to its track |
| taps-nikaalo-s17-solved-p360.png | nikaalo look 3: a changing speed, average speed = total distance ÷ total time |
| mal-nikaalo-speed-distance-p360.png | m2: 180 set (the trip's distance): the track grows to 500 km; the ghost lands at 540 km, the trip's end mark far behind it |
| mal-nikaalo-multiply-p360.png | m3: 540 set (distance × time): the ghost lands at 1620 km inside the box; the real trip a short stretch at the start |
| taps-badlo-s3-solved-p360.png · taps-badlo-s17-solved-p360.png | badlo: 36 km/h, one second stepped, 10 m/s set; the ghost at 10 m/s for 1 s lands on the bus's 1 s mark; the kit's "1 km/h = 1000 m ÷ 3600 s = 5/18 m/s" |
| badlo-s3-kmh-typed-p360.png | badlo, the km/h number typed as m/s (36): the ghost lands at 36 m, the bus's 1 s mark (10 m) carried down far behind it (no kit misconception is mapped here) |
| taps-ek-saa-s3-solved-p360.png | ek-saa look 1: each interval's distance listed as the marks drop |
| taps-ek-saa-s17-solved-p360.png | ek-saa look 3 (read from the floor's metre marks), dragged onto the bins; the run lists every interval |
| mal-ek-saa-keeps-moving-p360.png | m1 (t03): every mover that never stopped put on uniform |
| mal-ek-saa-same-totals-p360.png | m2 (t03): the runner with the robot's total in the same time put on uniform |
| mal-ek-saa-uniform-slow-p360.png | m3 (t03): the fast train's equal 11 m gaps put on non-uniform |
