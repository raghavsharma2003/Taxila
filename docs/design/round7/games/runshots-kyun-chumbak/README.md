# Kyun-Lab chumbak run shots (r7 kyun-chumbak, 360 × 640, deviceScaleFactor 1)

Class 6 science, magnets, as two new modes of the kyun-lab family. Nothing runs on a clock.

- **dhruv** (c6-science-ch04-t02, poles, attraction and repulsion):
  - **sira** (s1): a magnet hides under a cover (pencil case, noticeboard, pencil box), never at the cover's own ends. The
    child taps a spot to touch the pin there; the pins that cling hang below it (most at the magnet's two ends, one along
    its middle, none off it: scene counts, the order is the kit's). She flags two spots and taps "Lift the cover": the
    magnet shows, with the filings crowding its ends.
  - **jodo** (s2): a magnetic toy train. Each carriage has a magnet across it (N one end, S the other). Tap a carriage to
    turn it round; "Push" runs them together: unlike poles couple, like poles push apart. Look 3 hides the letters, so the
    push is how she finds the joint.
  - **pakka** (s2): two or three bars that look alike; one is a magnet. She taps an end of her marked magnet to hold that
    pole out, then taps a bar's end: pulled or pushed, written by the end. "Magnet: A" holds only for a bar that pushed.
  - **todo** (s3): imagined, never tried (the kit's own warning is on the goal line): a magnet has snapped into 2-4 pieces.
    "Label" mode steps a tag N, S, — (no pole); "Test N" / "Test S" bring that pole to an end. "Check" when every new end is
    labelled.
  - **taakat** (s3): the kit's own pair, a small thin magnet (20 pins) and a big grey one (8 pins). Tap one to dip it; its
    pins hang from it, counted. "Small is stronger" / "Big is stronger".
- **disha** (c6-science-ch04-t03, finding directions). The ground is drawn turned (screen-up is not north), so only the
  magnet tells. The round arrows under the ground are canvas buttons.
  - **latkao** (s1): she holds a magnet on a thread ("Turn the magnet" twists it). "Let go": it swings back and settles with
    its N end north, whatever the twist. "Turn the map" until the map's N arrow lies along it; "Done".
  - **ghoomo** (s2): she holds a compass; her head is the way she faces and the dial letter ahead of her is ringed. "Turn
    yourself" turns her and the box together (the needle stays); "Turn the box" turns the box in her hands. Face the
    highlighted landmark, set N under the needle, "Read".
  - **loha** (s2): the same, starting by a steel almirah, an iron table or a bar magnet, where the needle turns towards it.
    "Walk away" first.

The shots come from the play dev harness and a driver that acts ONLY through real input:
- page.mouse clicks at the centre of the canvas targets in `window.__play.audit.targets` (spots, flags, carriages, bar and
  piece ends, the held pole, magnets to dip, the turn arrows);
- getByTestId(`play-ctl-<id>`) for the DOM buttons (run, undo, claim-i, tool-*, let, go).

The driver reads the act lists from the law's own solve and mal-rule acts and turns each into the tap a child would make. It
never dispatches. Every goal was solved this way on seeds 3 and 17: sira at looks 1 and 3, jodo at 1, 2 and 3, pakka at 1
and 2, todo at 1 and 3, taakat at 1, latkao at 1 and 3, ghoomo at 1 and 3, loha at 1 and 2 (32 runs, every one a different
level). Every mal-rule state was reached the same way (6 runs). 24 more runs (every goal in raat / Hinglish, chalk / Hindi,
blueprint / English) were solved for the audit. Across all 62 runs no label was clipped, no text was under 14 px, and the
smallest tap target was 48 px.

| file | what it shows |
|---|---|
| taps-sira-f1-s3-solved-p360.png | sira, pencil box: the two ends flagged and the cover lifted; the filings crowd the ends |
| taps-sira-f1-s17-solved-p360.png | sira, a shorter magnet placed lower: the pins at its two ends, the flags ticked |
| taps-jodo-f1-s3-solved-p360.png | jodo, three carriages: two turned round, pushed; every joint couples (pull arrows) |
| taps-jodo-f3-s17-solved-p360.png | jodo look 3, the letters hidden until the train joins |
| taps-pakka-f1-s17-solved-p360.png | pakka, two bars: the S end held out, bar A's end pushed away; A shows its poles |
| taps-pakka-f2-s3-solved-p360.png | pakka, three bars: bar B pushed the S end away |
| taps-todo-f1-s3-solved-p360.png | todo, two pieces: the break's ends labelled S and N; each piece N…S |
| taps-todo-f3-s17-solved-p360.png | todo look 3, four pieces, every new end labelled |
| taps-taakat-f1-s3-solved-p360.png | taakat: both dipped, 20 pins and 8 pins; the small one tagged |
| taps-taakat-f1-s17-solved-p360.png | taakat, the big magnet on the left |
| taps-latkao-f1-s3-solved-p360.png | latkao: let go, the magnet settled; the map turned until its N lies along it |
| taps-latkao-f3-s17-solved-p360.png | latkao look 3: the map turned half round |
| taps-ghoomo-f1-s3-solved-p360.png | ghoomo: she turned to the landmark, set N under the needle, read |
| taps-ghoomo-f3-s17-solved-p360.png | ghoomo look 3: the landmark behind her at the start |
| taps-loha-f1-s3-solved-p360.png | loha: walked away from the bar magnet, turned, set the dial, read |
| taps-loha-f2-s17-solved-p360.png | loha by an iron table |
| mal-sira-middle-strong-p360.png | middle-strong (t02 m3): the middle of the magnet flagged (one pin there). Lifted: the filings crowd the two ends; the magnifier sits by the flagged spot |
| mal-pakka-pull-proves-p360.png | pull-proves (t02 m4): bar B called the magnet after one pull. A plain iron nail clings to the same pole; "a pull can't tell" |
| mal-todo-one-pole-p360.png | one-pole (t02 m2): the new ends labelled "no pole". Her marked magnet's S comes to that end and is pushed away: it is a pole |
| mal-taakat-big-stronger-p360.png | big-stronger (t02 m1): the big grey magnet tagged without dipping; the goal line gives the kit's 8 pins and asks for the other dip |
| mal-ghoomo-needle-turns-p360.png | needle-turns (t03 m3): the dial set, then she turned to the landmark and read. The needle stayed north; the box turned with her (magnifier at the needle) |
| mal-loha-iron-trust-p360.png | iron-trust (t03 m2): read by the bar magnet with the dial set under its pulled needle. In the corner, away from it, the needle swings back |

Not shown, by design: t03 m1 ("north is cold") has no mechanic; the needle simply settles as the kit says.
