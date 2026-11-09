# Jaanch run shots (r7 jaanch, 360 × 640, deviceScaleFactor 1, touch)

Class 6 science, chapter 3, topic 2: testing food for starch and fat, in the new family jaanch ("test"). Nothing runs on a
clock. A drop of iodine falls, a food is rubbed on the paper, the paper dries a step or is held to the light only when the
child taps; the paper dries only by her own Wait. Each beat is drawn inside busy().

The child runs each test and the result is what she sees; she says a result only after its evidence is on the bench (a few
drops; or the paper dry and held to the light). The iodine is a labelled bottle ("Dilute iodine") on the bench in the
teacher's lab, its dropper drawn alone over the dish. No act eats, tastes or touches anything and no hand is drawn: the
safety lines (tested food is never eaten, chemicals only with the teacher, a peanut allergy) are the teacher's.

The protein test is out of this game entirely (the owner's scope): no copper sulphate, sodium hydroxide, violet or protein
column anywhere. Skill s2's protein half is not covered; s2 is exercised by its paper-test half.

- **neela / iodine** (s1): a card of foods. Add one drop at a time (the pips show the drops; the first few are larger), watch
  the food turn blue-black or stay iodine's own brown, then say Shows starch / No starch shown. Sugar solution is on every
  card.
- **daag / kaagaz** (s2): a card of foods. Rub on paper (a liquid: A drop on paper), Wait till the paper is dry (a water
  patch fades and goes, an oily one stays), Hold to light (light shines through a patch that stayed), then say Shows fat /
  No fat shown. Water or a tomato is on every card.
- **thali / dono** (s3, s1, s2): the result grid (foods down the side, starch and fat across) with the food in front's Yes /
  No cells; the dish and the iodine on the left, the paper on the right; One drop, Rub, Wait, To light; Next food once both
  are said. The kit's new snack (blue-black AND a patch on dry paper) is on every card; when done, a food that showed both
  is ringed.

The driver acts ONLY through real touch: page.touchscreen.tap at the centres of the canvas targets in
`window.__play.audit.targets` (tool-drop, tool-rub, tool-wait, tool-light, mark-starch:yes|no, mark-fat:yes|no) and
locator.tap on the DOM buttons (`play-ctl-next`, `-undo`). Act lists are read from the law's own solve and mal-rule acts;
nothing is dispatched.

Results:
- Every goal solved this way on seeds 3 and 17 at all three looks: 18 runs, every act arriving as touch.
- Every mal-rule state reached the same way on seeds 3 and 17: 6 runs over the 3 goals.
- Every goal also solved at seed 9 in chalk / Hindi (look 1), raat / Hindi (look 3), blueprint / Hinglish (look 2) and
  kagaz / Hinglish (look 3), the audit read after every act: 12 runs.
- No label clipped in any frame audited. Smallest tap target 44 px (thali's Yes / No cells, 51 × 44).

| file | what it shows |
|---|---|
| taps-iodine-*.png | iodine: the bench (dish, dropper, labelled bottle); midway; the card filled as a table (blue-black or brown) |
| taps-kaagaz-*.png | kaagaz: the food beside the paper; midway; the card filled (patch stayed or went) |
| taps-dono-*.png | dono: the grid with Yes / No cells, the dish and the paper; the grid filled, the new snack ringed |
| mal-iodine-sugar-starch-p360.png | sugar-starch (m2): sugar solution said to show starch after it stayed brown. The kit's carbohydrate tree replaces the bottle (starch and sugar two branches, iodine pointing only at starch): "It stayed brown: iodine shows starch, not sugar." |
| mal-kaagaz-wet-fat-p360.png | wet-fat (m3): Shows fat said of a tomato or water while the patch is still wet. The patch and Wait are ringed: "Still wet: Wait, and see if the patch stays." |
| mal-dono-one-only-p360.png | one-only (m1): Next food after one test showed something, the other not done. The empty cell is ringed: "One food can hold more than one: run the other test too." |
| look-*-f3-raat-hi-*.png, look-*-f3-kagaz-hinglish-*.png | first and last frames in Hindi (raat) and Hinglish (kagaz) at look 3 |

Facts: every food's result is the kit's (rules in `src/play/families/jaanch/jaanch.logic.ts` KIT_OF; the tests read each
sentence out of `data/kits/c6-science.json`, item sentences only from verified items): potato (i03; the worked example's
boiled potato leaves no oily patch), rice and roti (the starch-test expectation), rice water (i04, i07), idli (rl-o1),
cucumber little or no blue-black (i03), sugar solution not blue-black (the expectation, i04), milk (i07), paneer no blue-black
and an oily patch (i08), groundnut no blue-black (i10) and a patch (the fat-test expectation), coconut and coconut oil (i05),
roasted cashew (rl-o2), chips (i09), water (the expectation, i05), tomato (m3), the new snack (rl-h3). Drops and drying steps
are scene values shown only as pips, never as numbers.

Not admitted: none (all three kit misconceptions, m1, m2 and m3, have a mechanic). Not covered: s2's protein half.
