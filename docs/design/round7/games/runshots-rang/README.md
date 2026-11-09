# Rang run shots (r7 rang, 360 × 640, deviceScaleFactor 1)

Class 7 science, chapter 2: acids, bases, indicators and neutralisation, in the new family rang ("colour"). The child works a
dropper a drop at a time. Nothing runs on a clock. A drop lands on an indicator, a cup is sorted, or a base goes into the
glass only when the child taps. The drop falling is a beat inside busy().

Nothing is tasted, touched or drunk. The only way a liquid moves is the dropper; the liquids are drawn clear, so no colour
is claimed for any liquid itself. Any safety line is the teacher's.

- **pehchaan** (c7-science-ch02-t01). A row for each cup of the kit's own household liquids: lemon juice, vinegar, soap
  solution, baking soda solution, pure water, sugar solution and common salt solution. Tap a row to choose that cup. Tap an
  indicator: a drop from the chosen cup lands on it. Tap a bin to sort the cup acidic, basic or neutral. A sort is taken only
  when the colours seen so far leave one kind; a guess between two is refused, never marked right.
  - **litmus** (s2): blue and red litmus strips. A drop leaves a spot of the colour it gives. An acid turns blue litmus red,
    a base turns red litmus blue, and a neutral liquid changes neither, so a neutral cup needs both strips.
  - **desi** (s3): haldi (turmeric) paper and gudhal (hibiscus) water. Turmeric turns red in a base and stays yellow in
    acidic and neutral liquids. Hibiscus turns dark pink in an acid, green in a base, and keeps its own colour in a neutral
    liquid (a ringed spot marks a tested well). At looks 2 and 3 the gudhal water is short: one drop for each cup that is not
    a base, shown as dots on its button (a scene value). Turmeric has to find the bases first, which is the kit's own way.
- **milao** (c7-science-ch02-t02). Gudhal water in an acid is pink. The child adds a base a drop at a time. The pink fades
  as the base goes in, is gone at the right amount (the hibiscus water's own colour), and turns green past it. How many drops
  a glass takes is a scene value; no drop count is shown, because the colour is what the child watches. Once a base is in,
  the glass is labelled with what forms: "A salt and water form / Heat is given out", with warmth drawn over the glass.
  - **boond** (s2, s1): baking soda solution into lemon juice or vinegar. Plain water is on the bench too. Done when the
    pink has gone. At look 3, one card item asks for green.
  - **ilaaj** (s3, s1): the kit's uses. An ant bite (formic acid) takes baking soda, too much stomach acid takes an antacid
    (milk of magnesia), and acidic soil takes lime (chuna). Each case's sample is pink with gudhal water. The bench holds
    the case's own base, lemon juice (an acid itself: the pink stays, and it needs a drop more) and plain water.

The driver acts ONLY through real input:
- page.mouse clicks at the centres of the canvas targets in `window.__play.audit.targets`: the cup rows, the indicators,
  the bins and the droppers;
- getByTestId(`play-ctl-done`), getByTestId(`play-ctl-danger`) and getByTestId(`play-ctl-undo`) for the DOM buttons.

The driver reads each act list from the law's own solve and mal-rule acts. It never dispatches them.

Results:
- Every goal was solved this way on seeds 3 and 17 at all three looks: 24 runs, every act arriving as touch.
- Every mal-rule state was reached the same way: 8 states over the 4 goals.
- No label was clipped in any run, nor in the extra audits at seed 9 (looks 1 to 3, chalk / raat / blueprint, Hindi).
- The smallest tap target was 48 px (the indicator, bin and dropper buttons are 48 high; cup rows are 48 to 60).

| file | what it shows |
|---|---|
| taps-litmus-f1-s3-midway-p360.png | litmus: the first cups dropped and sorted; the next open cup chosen for the child |
| taps-litmus-f*-s*-solved-p360.png | litmus: every cup sorted; acids show a red spot on blue litmus, bases a blue spot on red litmus, neutral cups a spot on each strip with no change |
| taps-desi-f1-s3-midway-p360.png | desi: a base found by haldi (a red spot), the next cup chosen |
| taps-desi-f*-s*-solved-p360.png | desi: bases found by haldi; acids and neutral liquids told apart by gudhal (dark pink, or its own colour ringed); at looks 2 and 3 the gudhal dots are used up exactly |
| taps-boond-f1-s3-midway-p360.png | boond: some baking soda in; the pink lighter, the salt-and-water label up |
| taps-boond-f*-s*-solved-p360.png | boond: each glass as it ended (its own colour, or green where the card asked), and what formed |
| taps-ilaaj-f1-s3-midway-p360.png, taps-ilaaj-f*-s*-solved-p360.png | ilaaj: each use's sample brought to no pink with its own base |
| mal-litmus-own-red-p360.png | own-red (t01 m3): a neutral cup sorted acidic on red litmus alone. Blue litmus for the same cup is drawn dashed and magnified, staying blue: "Red litmus was red before the drop. Blue stays blue." |
| mal-desi-made-red-p360.png | made-red (t01 m3): a base sorted acidic because haldi went red. Gudhal for the same cup is drawn dashed, green: "Gudhal goes green for baking soda solution too: it was basic." |
| mal-boond-water-only-p360.png, mal-ilaaj-water-only-p360.png | water-only (t02 m2): Done on a pink glass after plain water: "Water only dilutes it: still pink, still acidic." |
| mal-boond-too-much-p360.png, mal-ilaaj-too-much-p360.png | too-much (t02 m3): Done for no pink after a drop past the right amount. The glass is green: "Green now: the extra base made it basic." |
| mal-boond-harm-mix-p360.png, mal-ilaaj-harm-mix-p360.png | harm-mix (t02 m1): Danger! once a base is in. Nothing harmful is drawn; the label of what forms is magnified: "It forms a salt and water; heat is given out." |

Not admitted, by the lead's ruling: t01 m1 (acids are dangerous and burn), t01 m2 (tasting is fine; acids taste sour) and
t01 m4 (bases are always safe) have no mechanic. They are the teacher's lines.
