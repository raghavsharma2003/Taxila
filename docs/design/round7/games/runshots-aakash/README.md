# Aakash run shots (r7 aakash, 360 × 640, deviceScaleFactor 1)

Class 7 science, chapter 12: the Earth's motions, seasons and eclipses, in the new family aakash ("sky"). The child turns
and moves a model that is not to scale. Nothing runs on a clock. The Earth spins an eighth of a turn, the Earth moves a
quarter of the way round the Sun, the Moon moves one place, or some months pass, only when the child taps a tool (or drags
the Earth with a finger). The glide that follows plays inside busy().

- **chakkar** (c7-science-ch12-t01). The Sun never moves.
  - **din** (s1, s2): the Earth seen from above its North Pole. The Sun's light comes from the left, so the half facing it
    has day. Spin the Earth turns it west to east (counterclockwise from above). The place on it turns from night into day
    and back. The sky over the place shows East and West: the Sun comes up in the east, stands overhead at noon, sets in the
    west, and at night the sky has no Sun. The card names moments (sunrise, noon, sunset, midnight), and Now! says the place
    has reached one. At look 3 there are two places: Arunachal is one spin step ahead of Gujarat (a scene value, not to
    scale), so it turns into the light first. The Earth can also be spun with a finger.
  - **saal** (s3, s1): the Earth on its path round the Sun. Spin the Earth turns it on its axis (the Spins dots); Go round
    moves it a quarter of the way round (the Way round dots). The card asks for "a day" (one whole spin, staying in its
    place on the path) and "a year" (once all the way round). Done closes each. The solved line gives the kit's numbers:
    about 24 hours and about 365¼ days.
- **ritu** (c7-science-ch12-t02). The Earth's path is seen a little from the side. The axis leans up and to the left at
  every place on the path, because it keeps pointing the same way in space. The point of the path closest to the Sun is
  marked (the kit: early January, the northern winter). Under the path, graph paper shows the same bundle of light falling
  on each half: a small bright patch (straight), a middle one (a little slanting) or a big dim one (slanting, spread out).
  The patch sizes are scene values to compare, never to measure.
  - **jhuk** (s1, s3): the card names a half and a season. Go round, then Here!
  - **dhoop** (s2): an ice block on India's field (north half) or Australia's (south half). A day of sun melts it only
    where the light falls straight.
- **grahan** (c7-science-ch12-t03). Seen from above: the Sun's light from the left, the Earth with its shadow behind it,
  and the Moon's path with its two crossing places (the red squares). The strip "From the side" shows the Sun-Earth line
  with the Moon above it, below it or on it (a picture, never an angle). The top-left disc is the Moon as seen from the
  Earth (its phase).
  - **chaaya** (s1, s2): the crossing places are at new and full moon. Move the Moon to make the card's eclipse, then
    Eclipse!
  - **kab** (s3): the level starts in a month when the Moon passes above or below the line at new and full moon. Months
    pass moves the crossing places on.

The driver acts ONLY through real input:
- page.mouse clicks at the centres of the canvas targets in `window.__play.audit.targets`: the tools and the Sun;
- in a separate run, page.mouse drags: arcs over the Earth's disc spin it;
- getByTestId(`play-ctl-done`) and getByTestId(`play-ctl-undo`) for the DOM buttons.

The driver reads each act list from the law's own solve and mal-rule acts and never dispatches them.

Results:
- Every goal was solved this way on seeds 3 and 17 at all three looks: 36 runs, every act arriving as touch.
- din was also solved by finger drags on seeds 3 and 17.
- Every mal-rule state was reached the same way.
- No label was clipped in any run.
- The smallest tap target was 48 px (the Sun, 48 × 60; the Moon is 48 × 48).

| file | what it shows |
|---|---|
| taps-din-f1-s3-solved-p360.png, taps-din-f1-s17-solved-p360.png | din: home turned to two moments (sunrise then noon, or the like) |
| taps-din-f2-s*-solved-p360.png | din look 2: three moments in turn |
| taps-din-f3-s3-solved-p360.png | din look 3: sunrise in Arunachal, then sunrise in Gujarat one spin step later, then noon in Gujarat |
| taps-din-f3-s17-solved-p360.png | din look 3: sunset in Arunachal, then in Gujarat |
| taps-saal-f*-s*-solved-p360.png | saal: a day (eight spin steps, the Spins dots full) and a year (four quarters round); the done line gives about 24 hours and about 365¼ days |
| taps-jhuk-f*-s*-solved-p360.png | jhuk: the Earth taken to each half's season; the patches show which half's light is straight |
| taps-dhoop-f*-s*-solved-p360.png | dhoop: each ice block melted where its half's light falls straight (a small bright patch) |
| taps-chaaya-f*-s*-solved-p360.png | chaaya: the Moon moved to new moon (its shadow on the Earth) or to full moon in the Earth's shadow (drawn red-brown) |
| taps-kab-f*-s*-solved-p360.png | kab: months passed until the crossing places sat at new and full moon, then the eclipse |
| mal-din-sun-goes-p360.png | sun-goes (t01 m1): the Sun tapped to move it round the Earth. It stays put; the magnifiers mark the Sun and the moment. "The Sun stays put. The Earth spins and carries the place." |
| mal-saal-spin-year-p360.png | spin-year (t01 m2): Done on "a year" after one whole spin on the spot. The Spins dots are full and the Way round dots empty: "That was one spin: a day. It is still in the same place." |
| mal-saal-trip-day-p360.png | trip-day (t01 m2): Go round tapped for "a day": "Going round the Sun is the year's movement, not a day's." |
| mal-jhuk-near-summer-p360.png | near-summer (t02 m1): Here! for the north's summer at the point closest to the Sun. The north half's light slants and spreads: "Closest to the Sun, but the north's light slants: winter." |
| mal-jhuk-axis-turns-p360.png | axis-turns (t02 m2): Tilt to the Sun. The tried axis is drawn dashed towards the Sun; the real one stays: "The axis keeps pointing the same way all the way round." |
| mal-dhoop-slant-same-p360.png | slant-same (t02 m3): a day of sun where India's light slants. The ice stays: "The same light spreads over more squares: the ice stays." |
| mal-chaaya-phase-shadow-p360.png | phase-shadow (t03 m2): Eclipse! for a lunar eclipse at a half moon. The Earth's shadow points away from it: "The Earth's shadow is far off: we see part of its lit half." |
| mal-kab-every-month-p360.png | every-month (t03 m1): Eclipse! at full moon in a month when the Moon passes below the line (the side strip, magnified): "no eclipse" |
| mal-kab-phase-shadow-p360.png | phase-shadow in kab: the same belief, a month off the line |

Not admitted: t03 m3 (sunglasses, or looking at a partly covered Sun) has no mechanic. It is the teacher's safety line.
