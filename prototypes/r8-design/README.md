# Round 8 design, phase 1: two directions

Static prototypes for the revamp in `docs/design/round8/DESIGN-REVIEW.md`. No product code was changed.

- **Start here: `board.html`.** It is the owner's comparison page. For each screen it shows today's app, direction A and direction B, each with two sentences. The page is self-contained (0.75 MB).
- `a-paper/`: direction A, "Paper and ink". See its README for the argument, tokens, measured contrast, motion and build cost.
- `b-night/`: direction B, "Night class". Its README has the same sections.
- `content.js`: the words, icons and board drawings, shared by both directions. The child and her parent are simulated.
- `layout.css`: the zones both directions share. It holds no values of its own.
- `shots/`: every screen in both directions at 360 × 740 (@2x) and 1366 × 768. Pages that scroll also have a `-full` shot.
- `tools/`: the scripts that make the shots, the contrast tables and `board.html`:
  - `shoot.mjs` also audits each screen: horizontal scroll, text size and 44 px touch targets.
  - `contrast.mjs`
  - `board.py`

The non-taste fixes from the review are in both directions:
- The board is the hero.
- Maths is set in STIX Two Text as stacked fractions.
- Colour carries meaning, and the same roles are shown in a legend: the part being talked about, the answer and a mix-up.
- The question is the second strongest thing on the screen.
- The phone lesson has five zones, not seven.
- The teacher is a 44 px initial with a voice ring. This is a neutral placeholder until the owner chooses Asha's look.
- There are no slash labels, grid, clipped corners, chevrons, monospace, emoji, mascots or scores.
- The parent corner is light, in a reading face.
- The offline home is designed.

Regenerate everything (from the repo root):

```
node prototypes/r8-design/tools/shoot.mjs        # all screens, both directions; prints the audit
node prototypes/r8-design/tools/contrast.mjs     # writes the contrast table into each README
python3 prototypes/r8-design/tools/board.py      # rebuilds board.html from shots/ and docs/design/round8/ui-now/
```

## Recommendation: A

1. **The board is the product, and the board reads best on paper.** Typeset fractions over a paper ground are what children already trust from a good textbook. That is also the Brilliant look the owner named. The existing whiteboard renderer has a `PAPER` palette with the same roles: blue focus, green "good", orange "mark".
2. **One theme for everyone.** Fault 5 in the review is that three designs are live at once. B still ships two (a dark child app and a light parent corner). A ships one.
3. **Light suits where and how the app is used.** It suits afternoon lessons in bright Indian homes on budget phones, and parents reading reports.
4. **It is a visible change.** B risks looking like a calmer release 16, after the owner asked for a revamp.

What would change this recommendation:
- A short look-test with 11-to-15-year-olds (DESIGN-V3 §15) that finds A reads young.
- The owner preferring the dark.

B is the cheaper build: about five commits against six, because most of B's work is deletion.
