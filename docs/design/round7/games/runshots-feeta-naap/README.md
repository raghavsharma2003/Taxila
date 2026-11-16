# Feeta · naap run shots (r7 feeta-naap, 360 × 640, deviceScaleFactor 1)

Science measuring for class 6 as four new feeta modes (src/play/families/feeta/naap.logic.ts, naap.view.ts): thread
(c6-science-ch05-t02 curve, map), thermo (c6-science-ch07-t02 jobs, read, fever), scale (c6-science-ch05-t01 ruler, foot),
touch (c6-science-ch07-t01 feel). Nothing runs on a clock: a thermometer's column is shown settling, never raced.

Made with the play dev harness and a driver that acts ONLY through real input: page.mouse clicks at the centre of the canvas
targets in `window.__play.audit.targets` (curve points, counter wheels, eye spots, lanes, benches, hands), page.mouse
down/move/up drags (the eraser along the ruler; lanes onto benches on seed 17), and getByTestId(`play-ctl-<id>`) for the
DOM controls (tools, straighten, dip, ◀ ▶, run). The act lists come from the law's own solve / mal-rule acts (read, never
dispatched). Every goal was solved this way on seeds 3 (look 1) and 17 (look 3); feel once more per story (room, chai,
bowls). The smallest tap target measured in every run was 44 × 44 px; a separate audit over 6 seeds × 3 looks × 8 goals
(2,535 targets, the eraser pushed to both ends of the ruler) found none under 44 px and none outside the box.

| file | what it shows |
|---|---|
| taps-curve-s3-solved-p360.png | curve (19 cm): the thread pressed at start, every bend and end, straightened on the scale from 0, 19 read |
| taps-curve-s17-solved-p360.png | curve at look 3 (scale numbered every 10 cm): 17 cm |
| taps-map-s3-solved-p360.png | map, "1 cm = 10 km" above the map: the road's thread 18 cm → 180 km |
| taps-map-s17-solved-p360.png | map at look 3: 20 cm → 200 km |
| mal-curve-curve-cannot-p360.png | m1: the ruler on the straight stretch only (4 cm), the bends given up; magnifiers at the thread's end and the counter |
| mal-curve-chord-p360.png | m2: the thread from start to end only, straight across the bends: 16 cm, short of 19 |
| mal-curve-band-p360.png | m3: the rubber band along the whole curve, shrunk back once lifted: 15 cm |
| mal-map-curve-cannot-p360.png · mal-map-chord-p360.png · mal-map-band-p360.png | the same three beliefs on the map (50, 150, 140 km against 180) |
| taps-jobs-s3-solved-p360.png | jobs at look 1 (temperatures shown, the kit's): the fever check on the clinical (35–42 °C), boiling water, fridge water and chai on the lab (−10–110 °C); dipped, each column shows its job |
| taps-jobs-s17-solved-p360.png | jobs at look 3 (no temperatures on the cards), dragged onto the benches |
| mal-jobs-clinical-hot-p360.png | m1: boiling water and chai on the clinical: their columns stop at 42, magnifiers at the scale's end |
| taps-read-s3-solved-p360.png | read: the lab thermometer dipped in warm water, numbered every 10, 1 °C a small division: 36 |
| taps-read-s17-solved-p360.png | read at look 3 (no longer half-way marks): 47 |
| mal-read-read-out-p360.png | m2: dipped, then taken out: the column has moved away from the water's reading; the reading written then is not the water's |
| taps-fever-s3-solved-p360.png | fever: 37.2, 37.2 (normal) and 38.5 (fever) read on clinical thermometers in tenths; the run shades the healthy band (36.8–37.2) |
| taps-fever-s17-solved-p360.png | fever at look 3 (numbers only at 36 and 38), dragged onto the benches |
| mal-fever-exact-37-p360.png | m3: everyone above 37.0 on the fever bench: the two 37.2 children sit inside the healthy band, magnifiers there |
| taps-ruler-s3-solved-p360.png | ruler: the eraser slid to 0 (the ruler has a blank edge before its 0), the eye moved above its end, 8 cm |
| taps-ruler-s17-solved-p360.png | ruler at look 3: a broken ruler from 3, the eraser dragged to 3, 6 − 3 = 3 cm |
| mal-ruler-edge-start-p360.png | m1: the eraser lined up with the ruler's edge, the end mark (7) read: short of 8 |
| mal-ruler-side-eye-p360.png | m3: the eye left where it started, to one side: its sightline over the eraser's raised corner meets 9 |
| taps-foot-s3-solved-p360.png | foot: a 3 m cloth, 30 cm foot-rulers: 10 laid end to end |
| taps-foot-s17-solved-p360.png | foot at look 3 (no marks on the cloth): 1 m, 3 rulers and a little extra |
| mal-foot-metre-foot-p360.png | m2: one foot-ruler a metre (3 for 3 m): a long gap left, magnifier at their end |
| taps-feel-s3-solved-p360.png · taps-feel-room-solved-p360.png | feel, a room story: steel and wooden things on one step; the thermometers read the same |
| taps-feel-chai-solved-p360.png · taps-feel-s17-solved-p360.png | feel, chai story: the bucket of warm water below the cup of hot chai; "heat stored" bars show the bucket's is bigger |
| taps-feel-bowls-solved-p360.png | feel, bowls story: cold < this bowl < warm |
| mal-feel-metal-colder-p360.png | m1: the steel things a step colder than the wooden ones; the hand on the steel spoon says "feels cold" |
| mal-feel-heat-temp-p360.png | m2: the bucket put warmer than the chai; heat-stored bars and thermometers disagree with the shelf |
| mal-feel-touch-trust-p360.png | m3: the bowl both hands are in put with the warm bowl ("left hand: warm, right: cool") |
