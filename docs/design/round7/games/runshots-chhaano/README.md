# Chhaano run shots (r7 chhaano, 360 × 640, deviceScaleFactor 1)

Class 6 science, separating mixtures, in the new family chhaano. Nothing runs on a clock.

- **sukha** (c6-science-ch09-t01, dry mixtures). The child taps a pile, then a method (Thresh, Winnow, Sieve, Handpick: the
  scene's own). The law splits the pile by the one difference the method uses, and the panel shows it at work. Threshing
  frees the grain from the stalks. Winnowing: tapping Winnow first THROWS one handful of the pile with no sack down; the
  heavier part lands near and the lighter is carried far, and the handful stays drawn on the Near / Far places while the
  child sets the grain sack (a sack set before that pile's throw is refused). Near / far is read from the throw, not
  guessed. Handpicking takes out the few visible pieces. A sieve lets through what is smaller than
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

**r7 quiz fix (2026-11-09).** Every sukha shot below was re-taken after the first throw was added: farak at look 1 (seeds 3,
17) and look 2 (seed 8), kram at looks 1 and 3 (seeds 3, 17), each mal-rule, the throw itself, and a run that checks no
Near / Far place is offered before the throw: 14 runs, all as expected, the law's acts equal to the taps' acts, no clipped
label; the smallest target in those runs was the DOM Undo button (132 × 48; the canvas targets are ≥ 50). The geela shots
are unchanged.

| file | what it shows |
|---|---|
| throw-farak-s3-p360.png | Winnow tapped on wheat and husk: the first throw; the wheat landed on Near, the husk carried to Far; the sack's place asked |
| taps-farak-f1-s3-solved-p360.png | farak, wheat and husk: thrown, then winnowed with the sack near; the husk carried far |
| taps-farak-f1-s17-solved-p360.png | farak, millet (bajra) and husk, the same way |
| taps-kram-f1-s3-solved-p360.png | kram, cut stalks with husk: threshed (stalks off), thrown, then winnowed: bajra, stalks, husk |
| taps-kram-f1-s17-solved-p360.png | kram, cut stalks with husk (wheat), the same way |
| taps-kram-f3-s3-solved-p360.png | kram look 3, moong with husk, small stones and dust: winnowed (husk and dust far), stones handpicked, the dust sieved from the husk |
| taps-kram-f3-s17-solved-p360.png | kram look 3, cut stalks with husk and small stones: thresh, winnow, handpick |
| taps-nithaar-f1-s3-solved-p360.png | nithaar, pond water: three waits (the dots fill, the mud sinks), decanted, the settled mud scooped into its jar |
| taps-nithaar-f1-s17-solved-p360.png | nithaar, sand in a bucket of water, the same way |
| taps-chhaan-f2-s3-solved-p360.png | chhaan, charcoal powder in water: filtered, the powder scooped off the paper |
| taps-chhaan-f2-s17-solved-p360.png | chhaan, sand and salt in water: filtered; the sand off the paper (the salt is not wanted here) |
| taps-namak-f1-s3-solved-p360.png | namak, salt water (Rann of Kutch): dried in the sun on a plate, the salt scooped into its jar |
| taps-namak-f2-s3-solved-p360.png | namak, sand and salt in water: filtered, the filtrate dried, sand and salt each into its jar |
| taps-namak-f2-s17-solved-p360.png | namak, mud and salt in water, the same way |
| mal-farak-heavy-far-p360.png | heavy-far (t01 m2): the throw seen, the sack still set Far. The husk lands in it and the wheat falls near; the magnifier sits by the sack |
| mal-kram-heavy-far-p360.png | heavy-far on moong, after the throw: the dust and husk land in the sack, the moong and stones fall near |
| mal-farak-same-size-p360.png | same-size (t01 m3): wheat and husk sieved; all fall through together; the lens shows the holes against the particles |
| mal-kram-same-size-p360.png | same-size on moong and small stones (one size): all stay on the sieve, the lens by it |
| mal-kram-one-method-p360.png | one-method (t01 m1): "Done" after winnowing alone (the throw, then the sack near). Pile 1 still holds moong and small stones, shown up close with the magnifier |
| mal-namak-salt-gone-p360.png | salt-gone (t02 m1): the salty water poured away. The puddle by the drain dries in the sun and the salt is left behind; the beaker stays (refused) |
| mal-namak-filter-salt-p360.png | filter-salt (t02 m2): the filter paper scooped for the salt. The paper holds only sand; a drop of what passed, dried, leaves the salt |
| mal-namak-clear-pure-p360.png | clear-pure (t02 m3): "Done" with the clear filtrate still holding salt. A drop of it, dried, leaves salt (the "boil before drinking" line is the teacher's, not a mechanic) |
