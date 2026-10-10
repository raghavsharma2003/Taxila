# Kaksha · futurist direction pass (2026-10-10)

**The brief (owner directive, via the main session):** "Don't go too Indian. Be modern, futuristic, engaging and cool:
the vibe Gen Alpha likes." The brand stays **Taxila**. Lesson language stays the child's, and the chrome stays English.
The safety floor and the Help sheet are untouched. There are still **no coins, streaks, leaderboards or loot boxes**:
everything is earned by real learning.

**What this is:** two options, rendered on the **real** Kaksha screens rather than mock-ups:
- Home, World (orbit and the new **base**), Hangar, the lesson **Desk**, and the **Debrief** with a real secure crossing.
- Each option has an **older** (dark) palette and a **young** (bright) palette.
- Each was shot at **360 × 800** and **1366 × 768**.

The looks are a CSS and token layer on the same components (`data-klook`), and the pick is one line in
`src/ui-v3/kaksha/look.ts` (`KAKSHA_LOOK`).

**Picked (main session, 2026-10-10): Volt for both families**, with Holo as the alternate behind a per-device
`?look=holo` / `?look=volt` switch (`?look=default` clears it). On older Volt, lime is only on CTAs, the lamp and the
"Now secure" moment. The world and shell names are the shortlist's first entries (Zenith, Flight Deck) until they are
named. The look now covers the whole child app for the Kaksha cohort (`../RESULTS.md`).

## Look at these first

| | phone 360 × 800 | laptop 1366 × 768 |
|---|---|---|
| **A · Holo** | [`sheet-holo__360x800.webp`](sheet-holo__360x800.webp) | [`sheet-holo__1366x768.webp`](sheet-holo__1366x768.webp) |
| **B · Volt** | [`sheet-volt__360x800.webp`](sheet-volt__360x800.webp) | [`sheet-volt__1366x768.webp`](sheet-volt__1366x768.webp) |
| today (classic, for reference) | [`sheet-classic__360x800.webp`](sheet-classic__360x800.webp) | [`sheet-classic__1366x768.webp`](sheet-classic__1366x768.webp) |

Each sheet has the older family on top and the young family below. The columns are Home · World · Base · Hangar ·
Desk · Debrief. Every single page is in [`shots/`](shots/), named `<look>-<family>-<screen>__<w>x<h>.webp`.

## A · Holo: "glass and light"

- **Older:** deep space (`#070818`) with soft pink and cyan nebula glows. Panels are dark glass with an **iridescent
  cyan → violet → pink edge**. The one move is a pill that runs cyan → violet with a breathing glow. Her accent is holo
  pink (`#FF6AD5`), which replaces kesar. Corners are rounded throughout.
- **Young:** lilac daylight, white glass cards and a soft violet lift. The move is electric violet → magenta with
  white text. It's bright and friendly, and still clearly sci-fi.
- **Why it might win:** it is the most *current*. It feels like glass-and-light OS interfaces and premium creator apps.
  It also reads "AI tutor" without trying. It's the calmer of the two, so it fits a learning screen the child reads for
  20 minutes.
- **Risk:** glass looks can go soft and samey. The iridescent edge is carrying the identity. No `backdrop-filter`
  is used: the panels are solid with a gradient border, so low-end phones lose nothing and pay nothing.

## B · Volt: "HUD and plastic"

- **Older:** carbon black with a faint 44 px HUD grid. The one move is **electric lime** (`#C6FF3A`) with an
  uppercase label and a `»` chevron. There are sharp chamfered corners and corner brackets, `//` section labels, and an
  ultraviolet accent for her (`#A98CFF`). It's a game-client feel.
- **Young ("Volt Pop"):** mint with a dot grid, white cards with a **thick ink outline and a hard 4 px offset shadow**,
  and an electric-blue move with a lime "pop" shadow under it. It's toy-plastic, chunky and very tappable. Presses
  physically *push the button in*.
- **Why it might win:** it has the most *game* energy. The young version is the most distinctive thing in either option
  (a child would recognise it across the room). The older version looks like the games they already play.
- **Risk:** the older palette is loud. Lime is reserved for the one move, so it stays meaningful, but a whole lesson in
  HUD chrome may tire.

**My recommendation:** **Volt for the young family and Holo for the older family** is a valid third option. Both
palettes are already built per family, so a mix is one map in `look.ts`. If it has to be one, take **Holo**: it ages
better across classes 1-9 and keeps the lesson calm.

## The settlement becomes a base

The Indian-town structures are gone (stepwell, minaret, bazaar, jantar). The **rules are unchanged** (`world.ts`,
`data/kaksha/catalog.json`):
- a structure exists only while its skill is **secure**;
- placement is deterministic and nothing decays;
- there are no counts;
- the drawing is ≤ 600 SVG nodes and static after the rise.

Each base structure still **shows its idea**:

| idea (catalogue rule) | was | base structure | why it shows the idea |
|---|---|---|---|
| equal parts, equivalent fractions | Stepwell | **Solar array** | six equal panels |
| number line, integers, decimals | Bridge | **Maglev rail** | pylons on equal spans |
| angles | Jantar | **Radar dish** | a dish set at a measured tilt |
| primes and factors | Minaret | **Power core** | whole cells stacked, none split |
| patterns, multiples | Bazaar | **Hab pods** | pods that repeat in a row |
| area, perimeter, measure | Courtyard | **Landing pad** | a measured grid |
| shapes, fractions | Pavilion | **Geo dome** | a shape held true |
| forces, magnets, energy | Windmill | **Wind turbine** | a force that turns |
| light and shadow | Sundial | **Observatory** | light, measured |
| living things, food, plants | Fields | **Biodome** | a garden under glass |
| stories, words, grammar | Library | **Comms tower** | an idea sent in words |

The ground is a regolith plate with a survey grid. The **child's ship parks on a launch pad** in the corner, drawn in
the Hangar's colours. The pad is ground rather than a structure, so it counts nothing. It ties base customisation to
the ship.

## Engagement, within the rules already decided

These are built and visible in the shots:
- **The earned moment** in the Debrief. A shield badge pops, 14 particles burst, and it reads "NOW SECURE ·
  Equivalent fractions · Builds a Solar array at your base · Opened: Green jet trail". It appears **only** when the
  ledger says a skill crossed to secure in this session (the same `nowSecure()` as before: TRUTH-1 and EARN-1 are
  checked on every Debrief shot). There's no score and no count. The code avoids the economy vocabulary, so
  `K-ECON` stays green.
- **The Hangar loadout:** the ship as equipped, with **Hull / Trail / Board / Emote** slots. Empty slots say
  "Standard", never "locked" or "missing".
- **Emotes (proposal):** Rocket, Wave and Star. These are reactions the child could send her at the end of a lesson.
  They're earned like every item (by a secure idea), never bought, never random. They're in the dev fixture only. To
  ship them, add them to `catalog.json` and give the Debrief a "send her a reaction" row.
- **Juice:**
  - **Springs:** presses spring back (`cubic-bezier(.34, 1.8, .5, 1)`), and Volt Pop buttons push in.
  - **Glows:** the one move has a breathing glow.
  - **Pops:** "New" badges and base structures pop in with a spring.
  - **Particles:** only on the earned moment.
  - Nothing else loops while the child reads. **Reduced motion stills all of it**: the existing global rule, plus the
    burst is removed.
- **Not proposed:** sound on every earned thing is the obvious next step, but the Debrief has no sound seam today. It
  would be a small, separate patch: one earned chime, respecting the "Sound effects" setting.

## Names (shortlist; the main session picks)

No legal or trademark search has been done. I avoided every game title I know of (for example Halo, Starfield,
Astroneer, Outer Wilds, No Man's Sky, Fortnite, Roblox, Minecraft, Brawl Stars).

| for | 1 | 2 | 3 |
|---|---|---|---|
| **The world** (her planet: the rings and the base) | **Zenith** (the highest point; it fits "your best ideas") | **Lumen** (a unit of light) | **Apogee** (an orbit's far point) |
| **The app shell** (the child's space; brand stays Taxila) | **Flight Deck** | **Skyport** | **Launch Bay** |
| **The settlement** | **Base** (as directed) | Outpost | Colony |

The shipped copy uses **Zenith + Flight Deck** (placeholders: `KX_NAMES` in `copy.ts`) until the main session names them.
- **Already English:** subject rings say Maths / Science / English / EVS / Hindi / Social, and the copy reads
  "Planet Zenith", "Riya's world", "Orbit | Base", "My world".
- **Placeholders kept:** the game names (Antariksh, Khand) still appear only in the Briefing (K2), until G1/G2 rename them.

## References (what each one teaches; references, not copies)

- **Fortnite (Locker) / Roblox (Avatar Shop):** loadout slots and emotes as self-expression. *Taken:* slots and emotes.
  *Rejected:* currency, shops, rarity tiers and timed items.
- **Minecraft / Astroneer:** a base you build from what you've earned, in a readable iso or soft-poly world. *Taken:*
  each structure is earned; pastel sci-fi materials for the young base.
- **Brawl Stars / Fall Guys:** chunky, outlined, high-contrast "toy" UI that kids read instantly, plus satisfying
  press feedback. *Taken:* Volt Pop's outlines, offset shadows and push-in buttons.
- **Duolingo:** spring motion and a celebration moment at the end of a session. *Taken:* the earned moment.
  *Rejected:* streaks, XP and leagues (they're banned here, and K-ECON enforces it).
- **Glass-and-light OS interfaces, and AI-assistant apps:** glass panels, iridescent light edges, calm depth. *Taken:*
  Holo's panel and her window.
- **Sci-fi HUD games (generic, not one title):** grids, corner brackets, `//` labels, a single neon action colour.
  *Taken:* Volt older.
- **Toca Boca:** bright, friendly and never childish for the youngest. *Taken:* Holo young's lilac daylight and
  rounded white cards.

## Floors held (measured, 2026-10-10)

`tests/prod/r4-kaksha-futurist-shots.mjs` → [`lint-futurist.json`](lint-futurist.json).
- **Coverage:** 72 pages: 3 looks × 2 families × 6 screens × 2 viewports. The real views run on the dev pages, and the
  real Desk and Debrief run with fixture models.
- **Result:** **0 findings and 0 page errors** across 1,335 text nodes.
- **What was checked on every page:**
  - text ≥ 14 px; Devanagari ≥ 16 px; targets ≥ 44 px;
  - WCAG contrast on the composited ground (every gradient stop); no horizontal overflow;
  - **AI-1:** her name always carries "AI";
  - **HELP-1:** Pause is one tap away on the Desk;
  - **TRUTH-1:** the Debrief names exactly the skill that crossed;
  - **EARN-1:** the earned moment appears only on a real crossing, and never in classic;
  - **BASE-1 / BASE-2:** the launch pad is there, and the base is ≤ 600 nodes.
- **One defect found and fixed:** on the first run, Holo's earned card failed contrast. The iridescent border gradient
  sat under its text, so it now uses a solid secure-green border with a glow.
- **Palettes:** all four pass ≥ 5:1 on every Kaksha text pair, including the move's label at both ends of its gradient
  (`tests/r4-kaksha-lint.test.mjs` K-CONTRAST-LOOKS). `tokens.css` mirrors `tokens.ts` (K-MIRROR-LOOKS).
- **Desk:** the skin is only re-pointed tokens, so it follows the look with no Desk change. Her window's cream ground
  on the Desk is the face pack's own clear colour; **K-P1** (the lit ground, queued for K4) is what lets it follow the
  look.

## Preview it yourself

```
npx vite                       # then open (dev builds only honour ?look=)
/src/ui-v3/kaksha/dev/index.html?screen=home&theme=night&look=holo     (theme=dawn for the young family)
/src/ui-v3/kaksha/dev/index.html?screen=world&theme=dawn&look=volt     (then tap "Base")
/src/ui-v3/kaksha/dev/index.html?screen=hangar&theme=night&look=volt
/src/ui-v3/kaksha/dev/desk.html?class=7&fixture=summary-secure&look=holo   (class=4 for the young family)
node tests/prod/r4-kaksha-futurist-shots.mjs   # regenerates every shot, the sheets and the lint
```

## Code (all on `claude/r4-app-design`, Kaksha-owned files; no patch request needed)

- `src/ui-v3/kaksha/look.ts`: `KAKSHA_LOOK` (ships `"classic"`). `?look=` is honoured in dev builds only.
- `src/ui-v3/kaksha/tokens.ts` / `tokens.css`: `K_LOOKS` with the four palettes, mirrored and contrast-tested.
- `src/ui-v3/kaksha/futurist.css`: each look's signature (shape, edge, motion), the earned moment, the loadout, and
  the base materials.
- `src/ui-v3/kaksha/Base.tsx`: the base structures and the ground with the launch pad. `Settlement.tsx` draws it in a
  futurist look.
- `copy.ts`: the futurist English and `KX_NAMES`. `views.tsx`: shell name, base labels, loadout, emote art.
  `lesson/Debrief.tsx`: the earned moment.

**What landing the pick means:**
- set `KAKSHA_LOOK`;
- swap the catalogue labels for the base names;
- name the world and shell;
- delete the classic town shapes;
- re-run the K1/K2 shot harnesses.

That's a small slice, and it happens before the K merge.
