# Release 11: Volt everywhere, for everyone

Main session, 2026-10-11. This brief is shared by four streams: K, stream 2, stream 5 and G1.

## Why

Owner, 2026-10-11 06:49 UTC, verbatim:

> "The whole ui and ux just look the same. Please fix this and as discussed revamp the ui ux and product design and put
> it on prod. The design sense that we discussed. Need to revamp the whole thing"

The owner attached a 412 px phone screenshot of taxila.dev's landing page. It still has the warm lamplit-desk hero,
the serif headline, a lavender "Start free set-up" button, and "See a real lesson" with an empty phone frame under it.

The owner saw no change because:

- The Volt look reached only the owner's own signed-in account, and only the child screens (the ui.kaksha cohort).
- The public site, the set-up, sign-in and the parent corner were never redesigned.
- Main's live screenshots of release 9 (2026-10-11, 412x915) show the landing, /promises, /help, /start/class and the
  sign-in page all in the pre-round-4 plain dark style.
- The landing's lesson preview renders as an empty phone frame.

## The design sense we discussed (read these context nodes)

- `owner-modern-futurist-vibe-20261010`: "Don't go too Indian; be modern, futuristic, engaging and cool, the vibe
  Gen Alpha likes."
- `dc-r4-owner-vision-superhuman-tutor`: "real great fully gamified app ... which they find cool and engaging",
  games at Minecraft or space-fighter level, SketchMind-class live content.
- `dc-r4-futurist-reskin`: modern English names, a futuristic base, a neon/electric token system, and Gen-Alpha
  patterns (skins, loadouts, emotes, juicy feedback, a level-up moment).
- `dc-r4-look-volt`: Volt for both families.
- `dc-r4-gamification-b`: what stays banned.

## Decision

`dc-r4-volt-everywhere`: one identity, Volt, on every surface, for every account, in production.

- Child app: Kaksha + Volt are the default. There is no cohort gate. `?ui=classic` stays as a per-device escape hatch.
- Public site, set-up, sign-in and the parent corner get the same identity.

## Identity: one system, no new palette

- **Tokens.** Use K's existing tokens only: `src/ui-v3/kaksha/tokens.ts` / `tokens.css` and the `data-klook="volt"`
  block in `futurist.css`. Do not invent colours. If a surface needs a token that does not exist, ask K (via main) or
  derive it with `color-mix` from an existing one.
  - Volt night (carbon HUD): older children, the public site, the set-up and the parent corner.
  - Volt day ("toy plastic", mint, electric blue, hard offset shadows): the child screens for the young family
    (classes 1-4).
- **Scoping.** The simplest correct way to get the tokens on a page outside child mode is to give the page root the
  same scope Kaksha uses: `class="kx"` plus `data-klook="volt"` and the night/day attribute K's shell sets. Read
  `src/ui-v3/kaksha/shell-attrs.ts` and `childshell.css`. Do not copy values.
- **Type.** K's faces: the sans display and the mono `// LABEL` HUD eyebrows. Nothing else, and no new font hosts.
- **Components.**
  - A chamfered CTA. One lime element per screen state at most (the one-volt law, `tests/ui-v3-lint` L-CANDY).
  - Corner-bracket panels.
  - Mono `//` eyebrows.
  - Segmented controls and HUD chips.
- **Motion.** A spring on press, the breathing glow on the one move, and a burst on an earned moment. Reduced
  motion stills all of it.
- **Floors.** These are never traded:
  - text at least 14 px; targets at least 44 px; contrast at least 5:1 by token pair;
  - no horizontal scroll at 360 px;
  - the AI label next to the teacher wherever she appears;
  - Childline 1098 and Tele-MANAS 14416 wherever they are today.

## Surfaces and owners

| stream | session | surfaces | files you own |
|---|---|---|---|
| K | U1 gamified app | **every child-mode screen**, see "K, the child app" below | `src/child/**`, `src/ui-v3/**`, `src/app/Who.tsx`, `src/play/**` (frames and chrome only), child tests |
| 2 | live content | **the public site**: landing (rebuilt from scratch), /promises, /privacy, /help, /leaving, not-found, the site header and footer, public Loading/RouteError | `src/app/landing/**`, `src/app/Public.tsx`, `src/app/Shell.tsx` (Loading/RouteError only), `src/styles/landing.css`, `public/site/**` (new), `index.html` meta, landing tests |
| 5 | Asha / set-up | **set-up and sign-in**: every /start/* step, sign-in (/start/phone?login=1), forgot password, auth errors, the hand-off into child mode | `src/onboarding/**`, `src/styles/onboarding.css`, onboarding tests |
| G1 | games core | **the parent corner**: every /parent/* page, see "G1, the parent corner" below | `src/parent/**`, `src/styles/parent.css`, parent tests |

### K, the child app

1. **Flip the default.**
   - Production renders Kaksha + Volt for every account. Do it in code (`kakshaDecision`), not with an env var.
   - Keep `?ui=classic` as the device opt-out.
   - Update `tests/r4-kaksha-cohort.test.mjs` and every test that assumed "off by default".
   - The TAXILA_UI_KAKSHA server cohort becomes harmless; leave the server alone.
2. **No classic leftovers on any child screen:**
   - /who
   - Hello (the first meeting)
   - the teacher picker
   - Home, World/Base and Hangar
   - Notebook and Ask
   - Me: fix the Captions row cut at 412 px
   - Practice
   - the lesson Desk, tray, whiteboard frame, game frames and Studio surface
   - Debrief
   - loading, error and empty states
3. **A juice pass for Gen Alpha, inside `dc-r4-gamification-b`.**
   - The orbit and base panels read sparse and empty in the pick sheet. Give the world depth: parallax stars,
     planet light, the ship.
   - Press feedback, and the level-up moment in the Debrief.
4. **Parity.** What each screen says and does is unchanged. Re-run your parity harness against the new default, and
   your contrast and floor lints for both families.

### Stream 2, the public site

The landing is rebuilt from scratch in Volt night.

- **The hero.** It must make a 10-year-old say "whoa" and make a parent trust it. Show the product itself: real
  captures of the Kaksha Home/World, the Desk mid-lesson with Asha and her AI label, and a game running (Antariksh or
  Stackverse). No stock photos and no lamplit desk.
- **The lesson preview.** Fix the empty phone frame under "See a real lesson".
- **Honest sections stay.** Keep the four plain words, "How do we know?", "no points, no streaks, no leaderboards"
  and the promises, restyled and made scannable. Every claim stays true.
- **Site chrome and pages.**
  - The header (Sign in, Start).
  - The footer: Help, Privacy, Promises, and Childline 1098 / Tele-MANAS 14416 as they are today.
  - /promises, /privacy, /help, /leaving and not-found.
- **Speed.** Hero images are webp and sized for a phone; everything below the fold is lazy. Keep LCP fast on a mid
  phone.

### Stream 5, set-up and sign-in

- **Every step.** All five steps (class/board/language, the child profile, account/phone, consent, check), sign-in,
  forgot password and the auth errors.
- **The look.** Volt night for the grown-up. Moments that face the child (choosing a name, hearing Asha) use the
  child's family look.
- **Make it feel like setting up a game.** A HUD progress bar, big tappable tiles, styled voice previews.
- **What stays the same.** The same five steps, fields and validation, and the same consent text word for word.

### G1, the parent corner

- **Pages.** Every /parent/* page: the gate, the shell and nav, home, the evidence sheet, progress, lessons, notes,
  controls, children, data/delete, help and report.
- **The look.** Volt night "calm": the same identity at lower intensity.
  - No breathing glow; lime only on the one primary action per page.
  - Dense, legible and evidence-first.
  - The four plain words and the "How do we know?" ledger become HUD chips and a timeline.
- **Tests.** The parent claims tests and the parent Playwright battery pass unchanged.

## Rules (all streams)

1. **Presentation only.**
   - Do not change server, API, data or safety logic. Leave `server/**`, `shared/safety*`, `floor.js` and
     `safetyStrings.ts` alone.
   - You may tighten copy for tone, but every claim stays true, the promises keep their meaning, and the AI
     disclosure and helpline wording do not change.
2. **Branch.** Start from base `claude/blissful-mayer-icwe2j` at the sha main gives you. Use your own branch; if its
   PR has merged, restart the branch from base. Push often.
3. **Stay in your files.** Anything outside your list goes as a patch file in
   `docs/design/round4/build/r11/<stream>/patches/` with a README line.
4. **Evidence.** Put it in `docs/design/round4/build/r11/<stream>/`:
   - before/after sheets (webp) at 360x800, 412x915 and 1366x768, from real pages, not fixtures, wherever possible;
   - your UI lint and floor tests;
   - `npx tsc -b && npx vite build`, plus your targeted tests, plus the full `npm test` if your container can run it.
5. **Context.** Add `context/inbox/r11-<stream>.json`: decisions with reversal conditions, measurements with n,
   method and date, and rejections.
6. **Never** deploy, touch the production database, or call a paid or third-party API.
   - Prefer real product captures and SVG/CSS art.
   - Generated art only through the Azure image deployment, and only if a capture cannot do the job.
7. **Time.** Push a first complete pass by **09:30 UTC**, then message main with:
   - the head sha and file list;
   - the before/after sheets;
   - the tests you ran and their results;
   - anything you could not do.

   Main integrates as streams land; release 11 goes live the same day.
