# Chhaano run shots (r7 chhaano, 360 × 640, deviceScaleFactor 1)

Class 6 science, separating mixtures, in the new family chhaano. Nothing runs on a clock.

- **sukha** (c6-science-ch09-t01, dry mixtures). The child taps a pile, then a method (Thresh, Winnow, Sieve, Handpick: the
  scene's own). The law splits the pile by the one difference the method uses, and the panel shows it at work. Threshing
  frees the grain from the stalks. Winnowing: the child first sets the grain sack Near or Far; the lighter part is carried
  far and the heavier falls near. Handpicking takes out the few visible pieces. A sieve lets through what is smaller than
  its holes. "Done" closes the level when every pile holds one part. **farak** (s2): two parts and the one method their
  difference allows. **kram** (s3, s2): three or four parts, two or three methods in turn, threshing first.
- **geela** (c6-science-ch09-t02, mixtures in water). There is one jar per part to recover. The child taps a vessel, then
  a method:
  - Wait settles it one step per tap: the dots fill and the mud sinks.
  - Decant pours the clearer liquid into a glass once it has settled. The glass may stay a little cloudy.
  - Pour away sends the liquid down the drain.
  - Filter keeps insoluble solids on the paper. The liquid and anything dissolved pass.
  - Sun dry takes the water away; whatever was in it stays on the plate.

  Tapping a jar scoops the chosen dry solid into it. The goals are **nithaar** (s1), **chhaan** (s2) and **namak**
  (s3, s2). A dissolved solid is never drawn in the water.

The shots come from the play dev harness and a driver that acts ONLY through real input:
- page.mouse clicks at the centre of the canvas targets in `window.__play.audit.targets` (piles, vessels, jars, methods,
  the sack's Near / Far);
- getByTestId(`play-ctl-done`) / (`play-ctl-undo`) for the DOM buttons.

The driver reads the act lists from the law's own solve and mal-rule acts. It never dispatches them. Every goal was solved
this way on seeds 3 and 17: farak at look 1, kram at looks 1 and 3, nithaar at 1, chhaan at 2, namak at 1 and 2. Every
mal-rule state was reached the same way. No label was clipped. The smallest tap target in every run was 50 px (a method
button, 80 × 50).

| file | what it shows |
|---|---|
| taps-farak-f1-s3-solved-p360.png | farak, wheat and husk: winnowed with the sack near; the husk carried far |
| taps-farak-f1-s17-solved-p360.png | farak, millet (bajra) and husk, the same way |
| taps-kram-f1-s3-solved-p360.png | kram, cut stalks with husk: threshed (stalks off), then winnowed: wheat, stalks, husk |
| taps-kram-f3-s3-solved-p360.png | kram look 3, moong with husk, small stones and dust: winnowed (husk and dust far), stones handpicked, the dust sieved from the husk |
| taps-kram-f3-s17-solved-p360.png | kram look 3, cut stalks with husk and small stones: thresh, winnow, handpick |
| taps-nithaar-f1-s3-solved-p360.png | nithaar, pond water: three waits (the dots fill, the mud sinks), decanted, the settled mud scooped into its jar |
| taps-nithaar-f1-s17-solved-p360.png | nithaar, sand in a bucket of water, the same way |
| taps-chhaan-f2-s3-solved-p360.png | chhaan, charcoal powder in water: filtered, the powder scooped off the paper |
| taps-chhaan-f2-s17-solved-p360.png | chhaan, sand and salt in water: filtered; the sand off the paper (the salt is not wanted here) |
| taps-namak-f1-s3-solved-p360.png | namak, salt water (Rann of Kutch): dried in the sun on a plate, the salt scooped into its jar |
| taps-namak-f2-s3-solved-p360.png | namak, sand and salt in water: filtered, the filtrate dried, sand and salt each into its jar |
| taps-namak-f2-s17-solved-p360.png | namak, mud and salt in water, the same way |
| aim-sack-p360.png | Winnow tapped: the wind, and the two places for the grain sack (Near, Far) |
| mal-farak-heavy-far-p360.png | heavy-far (t01 m2): the sack set Far. The husk lands in it and the wheat falls near; the magnifier sits by the sack |
| mal-kram-heavy-far-p360.png | heavy-far on moong: the dust and husk land in the sack, the moong and stones fall near |
| mal-farak-same-size-p360.png | same-size (t01 m3): wheat and husk sieved; all fall through together; the lens shows the holes against the particles |
| mal-kram-same-size-p360.png | same-size on moong and small stones (one size): all stay on the sieve, the lens by it |
| mal-kram-one-method-p360.png | one-method (t01 m1): "Done" after winnowing alone. Pile 1 still holds moong and small stones, shown up close with the magnifier |
| mal-namak-salt-gone-p360.png | salt-gone (t02 m1): the salty water poured away. The puddle by the drain dries in the sun and the salt is left behind; the beaker stays (refused) |
| mal-namak-filter-salt-p360.png | filter-salt (t02 m2): the filter paper scooped for the salt. The paper holds only sand; a drop of what passed, dried, leaves the salt |
| mal-namak-clear-pure-p360.png | clear-pure (t02 m3): "Done" with the clear filtrate still holding salt. A drop of it, dried, leaves salt (the "boil before drinking" line is the teacher's, not a mechanic) |
