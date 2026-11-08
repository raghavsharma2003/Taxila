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

| file | what it shows |
|---|---|
| taps-sandarbh-s3-solved-p360.png | sandarbh: the bus story watched from the boy next to her; the girl at rest from him, moving from Aman at the bus stop |
| taps-sandarbh-s17-solved-p360.png | sandarbh at look 3 (three references): the passenger watched from her seat (one dot), the platform and lamp post (moving) |
| mal-sandarbh-no-reference-p360.png | m1: "at rest" from every reference; watched from the seat the man on the platform leaves a row of dots; a magnifier on that card |
| taps-prakaar-s3-solved-p360.png | prakaar look 1 (things drawn): pendulum oscillatory, fan blade circular, slide linear; the run plays the clock on to 12 |
| taps-prakaar-s17-solved-p360.png | prakaar look 3: only the lights and their paths until the run, then the things are shown |
| mal-prakaar-curve-circular-p360.png | m2: stepped to 4, the pendulum's arc put on circular; the clock played on, it never goes round; magnifiers on the window and the bin |
| taps-do-gati-s3-solved-p360.png | do-gati: riding along, the merry-go-round's horse only bobs up and down (oscillatory) while from the ground it goes round (circular) |
| taps-do-gati-s17-solved-p360.png | do-gati look 3: a bicycle wheel (linear + circular), a merry-go-round (circular + oscillatory), a one-motion thing |
| mal-do-gati-one-type-p360.png | m3: one type each (the horse only round); magnifier on its window |
| taps-aage-s3-solved-p360.png | aage: one hour stepped; the car ahead of the scooter after the same hour; the run draws each first-hour distance |
| taps-aage-s17-solved-p360.png | aage at look 3 (m/s or m/min) |
| mal-aage-farther-faster-p360.png | m1: stepped to the end, the scooter (200 km in 4 h) flagged over the car (160 km in 2 h); the first-hour bars disagree |
| taps-nikaalo-s3-solved-p360.png | nikaalo: the trip stepped to its end, speed = distance ÷ time on the speedometer; the ghost at that speed ends where the trip ended |
| taps-nikaalo-s17-solved-p360.png | nikaalo look 3: a changing speed, average speed = total distance ÷ total time |
| mal-nikaalo-speed-distance-p360.png | m2: the trip's distance set as the speed: the ghost runs far past the trip's end |
| mal-nikaalo-multiply-p360.png | m3: distance × time set: the ghost runs off the track |
| taps-badlo-s3-solved-p360.png · taps-badlo-s17-solved-p360.png | badlo: a km/h speedometer, one second stepped on a metre track, the m/s set; the kit's "1 km/h = 1000 m ÷ 3600 s = 5/18 m/s" |
| taps-ek-saa-s3-solved-p360.png | ek-saa look 1: each interval's distance listed as the marks drop |
| taps-ek-saa-s17-solved-p360.png | ek-saa look 3 (read from the floor's metre marks), dragged onto the bins; the run lists every interval |
| mal-ek-saa-keeps-moving-p360.png | m1 (t03): every mover that never stopped put on uniform |
| mal-ek-saa-same-totals-p360.png | m2 (t03): the runner with the robot's total in the same time put on uniform |
| mal-ek-saa-uniform-slow-p360.png | m3 (t03): the fast train's equal 11 m gaps put on non-uniform |
