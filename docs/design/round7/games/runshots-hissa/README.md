# Hissa pour run shots (games audit GAMES-08, 360 × 640, deviceScaleFactor 1)

Hissa `pour` (goals `fit`, `part`, `deci`; c7-maths-ch08-t02 and c7-maths-ch12-t02). The audit found that tapping Pour
until the jug refused, then Run, solved every pour level it was served: the child never decided a count. Now the child
first SAYS how many full cups (glasses) the jug will fill, on the − ? + stepper above the cups. Pour stays off until a
count is said. Once a cup is poured the count is locked: the jug is testing it, and an undo of the pours does not take it
back. The run answers: the count said must be the cups that fit, the jug must be empty, and the part-cup tag must be what
the last cup holds. A wrong count misses and shows the kit belief where one maps. After the run the count may be said again
and the level can still be solved, but the evidence keeps the first miss. Nothing is timed.

At fades 1 and 2 the jug is drawn with dashed cup marks, so a child may count the marks before saying the count. That is
the scaffold, and it fades: at fade 3 the jug is bare.

Made with the play dev harness (`PLAY_OUT=<dir> PLAY_PUBLIC=public npx vite build --config src/play/dev/vite.play.config.mjs`)
and `pour-taps.mjs` in this folder. The driver acts only through real input:

- `page.mouse` clicks at the centre of the canvas targets in `window.__play.audit.targets` (`count-up`, `count-dn`, `tag-0-up`, …);
- `getByTestId("play-ctl-pour" | "play-ctl-run")` for the DOM buttons.

The act lists come from the law's own solve and mal-rule acts. The driver reads them and never dispatches them.

`results.json` holds every check. Across en, hi and hinglish, 39 of 39 checks pass:

- the smallest canvas target is 44 × 44 px, and the smallest DOM button is 44 px;
- the smallest canvas text is 16 px;
- 0 canvas labels clipped, 0 button labels clipped, 0 goal lines clipped;
- 0 horizontal overflow and 0 page errors.

The first, longer goal lines were clamped: the hinglish line here at 360 px, and the en line in the play-cert's 320 px Desk box.
All three languages were shortened ("First say how many cups; then pour and tag the part left"), and the shots were taken again.

| file | what it shows |
|---|---|
| pour-fit-en-start-p360.png | 6 L ÷ 3/4 L, fade 1: the count is "?", highlighted. Pour a cup is off. The goal says to say how many full cups first |
| pour-fit-en-said-p360.png | 8 said with + taps; nothing poured yet |
| pour-fit-en-solved-p360.png | 8 said, 8 cups poured, the jug empty, Serve: the tick |
| pour-fit-en-mal-div-smaller-p360.png | div-smaller (÷ taken as making smaller): 4 said (6 × 3/4 = 4 1/2), 4 cups poured, 1/2 tagged. The run misses. Magnifiers mark the count, the jug and the last cup; the count can be said again |
| pour-part-en-start-p360.png · pour-part-en-said-p360.png · pour-part-en-solved-p360.png | the part goal (fade 2, no litre marks): start, said, solved |
| pour-part-en-mal-no-flip-p360.png | no-flip (÷ done as ×): 0 cups said, 1/32 tagged |
| pour-part-en-partcup-poured-p360.png | a part-cup level (1/2 L ÷ 1/3 L, from the harder door): 1 said, 1 cup poured, the jug refuses a second |
| pour-part-en-partcup-solved-p360.png | 1 said, 1 cup, the part-cup tagged 1/2; the rest pours into the last cup to the tag's line |
| pour-deci-en-start-p360.png · pour-deci-en-said-p360.png · pour-deci-en-solved-p360.png | 3.5 L ÷ 0.5 L in glasses ("How many full glasses?"): start, said (7), solved |
| pour-deci-en-mal-div-half-p360.png | div-half (÷ 0.5 taken as halving): 1 said, 3/4 tagged (1.75 glasses' worth); the run misses |
| pour-fit-hi-start-p360.png · pour-fit-hinglish-start-p360.png | the start in Hindi and in Hinglish (the count label and the goal line fit at 360) |
| pour-*-hi-solved-p360.png · pour-*-hinglish-solved-p360.png · pour-part-*-partcup-solved-p360.png | each goal solved by taps in Hindi and in Hinglish |

In every language, and for every goal, the audit's own replay passes through the UI (Pour pressed 8 times, then Run, with no
count said): Pour is disabled, no cup is poured, and the level is not solved. Those rows are `(… pour×8+run)` in
`results.json`.
