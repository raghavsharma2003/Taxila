# Release 11 · stream 2 · the public site in Volt night

Brief: `docs/design/round4/build/r11/BRIEF.md` on base `efc0e721`. Decision: `dc-r4-volt-everywhere`.

## What changed

The site is drawn in Volt night everywhere. That covers the landing (rebuilt from scratch), `/promises`, `/privacy`,
`/help`, `/leaving`, not-found, the header and footer, and Loading/RouteError on the public paths.

- **Palette and type.**
  - The root is K's own scope: `.kx`, `data-klook="volt"`, `data-ktheme="night"`.
  - Every colour is one of K's tokens. `landing.css` is layout only.
  - Type is K's: Space Grotesk, plus Geist Mono for the `//` eyebrows.
- **The hero is the product itself.** It shows real captures of Home (Asha with her AI label), the Desk mid-lesson with
  the board, and Antariksh running.
  - "See a real lesson" shows the real lesson screen at "Your turn", which fixes the empty phone frame.
  - Play shows Antariksh and the child's world.
  - On phones the captures sit right under the headline, so the product is on the first screen and the CTA is still
    above the fold at 360×800.
- **The honest sections keep their words.**
  - The four plain words become HUD chips. "How do we know?" becomes a timeline.
  - "No points, no streaks, no leaderboards" stays, as do the promises, price and "where we are", the FAQ and the
    helplines.
  - The AI disclosure and the helpline wording are unchanged.
- **The game moves.** The Play section shows 7 s of real Antariksh play from the games harness's own recording
  (`public/site/game-loop.webm`, 166 KB, muted, looping), with the still as its poster.
  - It is below the fold only: it mounts when the frame nears the viewport and is never the LCP element.
  - Reduced motion keeps the still.
- **One lime element per screen state.** That element is K's chamfered CTA. The header Start is ink, and the brand mark
  is ink on void.
- **`index.html`:**
  - the Volt theme-color;
  - a Volt first paint on the public paths;
  - on `/`, the hero capture is preloaded instead of the art manifest, which the landing no longer uses.

## Evidence

The before build is base `efc0e721`; the after build is this branch. Both are production builds served locally. All of
it comes from adult-run harnesses; no child has used it.

| what | before | after |
|---|---|---|
| pages × sizes (360x800, 412x915, 1366x768) | 18 views | 18 views |
| views below a floor (overflow, text < 14 px, a missing helpline) | 3 (the landing has 13 px text at all 3 sizes) | **0** |
| links or buttons under 44 px (inline links in sentences exempt) | not measured | **0** |
| landing LCP, lab mid phone, n = 5, median / max | 5068 / 5112 ms (painted hero) | **4212 / 4332 ms** (`/site/desk.webp`, 25 KB; the game video is never the LCP element) |
| landing media really loaded for a scrolling visitor (img complete + naturalWidth, video has frames) | 360/412: 3 of 4 (one image with no source) | **6 of 6 at 360, 412 and 1366** (5 captures + the game loop) |
| landing bytes on first load | 863 KB | 733 KB |

- Sheets:
  - `before-pages-*.webp` and `after-pages-*.webp`: every page's first screen at each size;
  - `before-landing-full-*.webp` and `after-landing-full-*.webp`: the whole landing. These are re-shot the way a
    visitor sees the page: the harness scrolls in steps, requires every image and video to have loaded, and only then
    takes the full shot. A full-page shot that never scrolls leaves `loading=lazy` frames empty
    (`rj-r4-fullpage-shot-lazy`); this pass's first sheets had that artifact.
- Measurements: `*-site-measure.json` and `*-lcp.json`.
- Harnesses:
  - `tests/prod/r11-site-sheets.mjs` (floors and sheets);
  - `tests/prod/r11-site-lcp.mjs` (LCP: 412x915, DPR 2.6, CPU 4x slower, 1.6 Mbps / 150 ms);
  - `tests/prod/r11-site-captures.mjs` (re-takes `public/site/*.webp` from the app).
- Tests: `tests/r11-site-volt.test.mjs`. It checks the scope, that there is no palette or font host, the lime rule,
  the real captures (each phone-sized), the honest sections word for word, the helplines and the chrome.

## Not done / notes

- Most of the remaining LCP time is the app's JavaScript before first render, which is not in this stream's files.
- RouteError keeps the app's shared `btn` buttons, now on Volt night. Their own look belongs to whoever owns `src/ui`.
- The painted promise and help art (`/assets/art/...`) is no longer shown on the site. The files stay, because other
  surfaces may use them.
