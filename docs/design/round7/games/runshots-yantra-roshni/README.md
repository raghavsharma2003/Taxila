# Yantra · roshni run shots (r7, 360 × 640, deviceScaleFactor 1)

Class 7 science, chapter 11, topic 1: sources of light and materials (c7-science-ch11-t01), as a new mode of the family
yantra. It is a light bench. Each lane holds one thing on the left (a kit-named source of light, the Moon, or a steel plate).
In the middle of the lane is a slot where a screen of a kit-named material may stand. Then come two small frames: the card
(dashed: how the eye should see that thing) and, after a look, what the eye saw. The child's eye is on the right, and every
lane looks into it.

Nothing runs on a clock. A switch, a screen or a cover changes only on a tap, and **Look** (the run) asks the law what the
eye sees. What the eye sees is shown only after a look, because predicting it is the skill. Then the light's path is drawn
out as a beat inside busy(). It starts at each source, goes to the things its light falls on, and then through the slot to
the eye. It is dim and scattered past a translucent screen and stops at an opaque one. **A ray is never drawn from the eye.**
The eye never looks at the Sun: the Sun's lane always has a brick wall before the eye, and any eye-safety line is the
teacher's.

The things and materials are only the kit's:
- **Sources:** the Sun, a star ("other stars"), a candle flame, a glowing bulb, a firefly.
- **Non-luminous:** the Moon ("shines by reflecting sunlight"), and a steel plate (the kit's worked example).
- **Transparent:** clear glass, clean water, and air (an empty slot).
- **Translucent:** butter paper, frosted glass, oiled paper.
- **Opaque:** cardboard, wood, a steel plate, a brick wall.

Light amounts are qualitative: all, some or none ("seen clearly", "seen, but not clearly", "not seen"). No number is on
screen; the covers left are drawn as cardboard squares.

## The three goals

- **parda** (s2). The sources are lit. Tap a screen on the tray, then a lane's slot, to stand the screen there. Tap a filled
  slot to take the screen back. Then Look. The eye must see each light the way the card shows: clearly, not clearly, or not
  at all.
- **roshan** (s3). The sources start off. Only things that give out their own light have a switch: a knob on the icon; tap
  the lane to switch it. From look 2 there are screens to place as well. The eye must see only what the card shows. A
  non-luminous thing is seen only while a source is on whose light falls on it: only sunlight lights the Moon. The light
  that lights it must itself stay out of the eye's sight, behind a brick wall or an opaque screen.
- **dhak** (s1). Every source is lit. At the start, the eye's view of the bench is shown, and the Moon looks as bright as
  the rest. Tap a thing to put a cardboard cover over it, or to take the cover off. There are exactly as many covers as
  there are things that give out their own light. Make the room dark: no light given out anywhere.

## Mal-rules (kit ids)

| mal-rule | kit id | the act | what the law shows |
|---|---|---|---|
| blur-clear (parda) | m3, translucent = transparent | butter paper, frosted glass or oiled paper in a lane the card wants clear | the light reaches the eye dim and scattered; the frame shows a glow, not a clear light: "Seen, but not clearly: oiled paper lets only some light pass" |
| moon-alone (roshan) | m1, the Moon is a source | Look with the Moon on the card and no sunlight on it (e.g. a glowing bulb switched on, not the Sun) | the Moon's frame stays dark: "The Moon stays dark: no sunlight falls on it" |
| look-hard (roshan) | m2, we can see in total darkness | Look with no light on at all | no ray anywhere, every frame dark: "No light is on: the eye sees nothing, however it looks" |
| moon-cover (dhak) | m1, the Moon is a source | a cover on the Moon (so a source stays uncovered) | the Sun's light still falls on the covered Moon and the uncovered light still reaches the eye: "Still light: the Moon gives out no light of its own"; once the Sun is covered, the Moon goes dark by itself |

## How the shots were driven

The driver acts ONLY through real input:
- page.mouse clicks at the centres of the canvas targets in `window.__play.audit.targets`: the lanes (`thing-i`), the
  slots (`slot-i`) and the tray pieces (`tray-<material>`);
- getByTestId(`play-ctl-run`) (Look) and getByTestId(`play-ctl-undo`) for the DOM buttons.

The driver reads each act list from the law's own `solve` and `malActs` on the page. It never dispatches them.

## Results

- Every goal was solved this way on seeds 3 and 17 at all three looks: 18 runs, every act arriving as touch.
- Every mal-rule state was reached the same way: 4 states over the 3 goals.
- No label was clipped in any run, nor in the extra audits at seed 9, look 3 (chalk / Hindi, raat / Hinglish,
  blueprint / English).
- The smallest tap target was 48 px. The lanes and slots are 48 px or taller; the tray pieces and the DOM buttons are 48
  high.

| file | what it shows |
|---|---|
| taps-parda-f1-s3-start-p360.png | parda at the start: two lit lights, the card's frames (a firefly clear, a glowing bulb not seen), the tray |
| taps-parda-f*-s*-solved-p360.png | parda solved: air or clear glass where the card wants clear, a translucent screen where it wants "not clearly" (a dim, scattered ray), an opaque one where it wants nothing (the ray stops at the screen); every frame ticked |
| taps-roshan-f1-s3-start-p360.png | roshan at the start: the switches off, the card asks for a non-luminous thing only |
| taps-roshan-f*-s*-solved-p360.png | roshan solved: the light that lights the target is on behind its brick wall (or an opaque screen), and its light falls on the Moon or the steel plate and is reflected into the eye |
| taps-dhak-f1-s3-start-p360.png | dhak at the start: every source lit; the eye's view shows the Moon as bright as the rest (the Sun is behind its wall) |
| taps-dhak-f1-s3-midway-p360.png | dhak midway: one cover on; the eye's view is stale until the next look |
| taps-dhak-f*-s*-solved-p360.png | dhak solved: every thing that gives out its own light covered; the Moon and the steel plate uncovered and dark |
| mal-parda-blur-clear-p360.png | blur-clear (m3) |
| mal-roshan-moon-alone-p360.png | moon-alone (m1) |
| mal-roshan-look-hard-p360.png | look-hard (m2) |
| mal-dhak-moon-cover-p360.png | moon-cover (m1) |
| audit-*-f3-*-p360.png | look 3 in the other art directions and languages (chalk / Hindi, raat / Hinglish, blueprint / English) |

## Caveats

- **Quiz-in-costume risk (parda).** Placing a screen per lane is close to a three-way sort. What keeps it a mechanic: the
  card asks what the EYE should see, never the category word; the result comes only from the law at a look, drawn as the
  light's path; and air (an empty slot) is a real choice. At looks 2 and 3 more pieces are on the tray than the card needs.
- **roshan** shows the switches only on things that give out their own light, so its UI tells s1. That goal is s3; s1 is
  dhak's, and dhak draws every thing alike and lets every thing be covered.
- **A steel plate** is used as a non-luminous thing on the bench. The kit names it among the opaque materials, and its
  worked example calls it non-luminous. Its expectations name only the Moon as a non-luminous example.
- **The bench is a model.** The Sun and a candle flame stand on the same bench, as in the kit's own torch-and-bowl
  remediation. The law claims only what the kit says: only sunlight lights the Moon; any source lights the steel plate.
