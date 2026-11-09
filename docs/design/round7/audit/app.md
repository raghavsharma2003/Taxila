# Audit: app (child app and lesson shell), 2026-11-09

Area 7 of `docs/design/round7/audit/BRIEF.md`. Branch `claude/r7-audit-app`, from `int/r6` at integration 21a.

**What a child gets today.** The Kaksha skin (`src/ui-v3/kaksha/**`) is the app on every device unless that device once opened `?ui=classic` (`src/ui-v3/kaksha/flag.ts:27-31`). The older child screens in `src/child/screens` are shared: each has a Kaksha branch and a classic branch. The lesson screen (`src/child/lesson`) is shared by both, with Kaksha supplying the stage layout. The `src/ui-v3/screens/**` "v3" design-system screens are not mounted by any route.

Status words in the table: **fix** = I fix it in phase 2 under the brief's rule (broken or inconsistent, inside the area); **main** = waits for main's reply (a deletion, a redesign, a naming decision, or outside the area); **route** = belongs to another stream.

## Findings

| id | sev | kind | owner | title | where | fix | status |
|---|---|---|---|---|---|---|---|
| APP-01 | P1 | broken | app | "Made for you" links from Home and the end-of-lesson screen open the Notebook but never play the piece | `src/child/screens/NotebookMade.tsx:39`; `server/reports/madeFor.js:28`; `server/routes/studio.js:165` | match the link's id against the card's `intentId` as well as its `id` | fix |
| APP-02 | P1 | broken | app | Notebook: a late summaries read replaces the server's pages with the device-only list (board pictures, Replay, other devices' lessons vanish) | `src/child/screens/Notebook.tsx:118-138` | the summaries branch patches `summary` onto the pages already shown, by lesson id | fix |
| APP-03 | P1 | broken | app | Pause → End lesson → "Short break" never reaches the teacher, and leaves an empty "Your answer" chip on the card | `src/child/lesson/useDesk.ts:998`, `:372`; `src/lesson/runtime.ts:661` | send the break chip with words (runtime drops a turn with no text); do not draw it as an answer | fix |
| APP-04 | P1 | broken | app | Tapping Help (or the no-mic card) while a game or module is on the stage unmounts it; it restarts from zero | `src/child/lesson/Desk.tsx:232,244`; `src/child/lesson/WorkTray.tsx:25-52`; `src/ui-v3/kaksha/lesson/StageBody.tsx:41-45,84-89` | a module, Studio piece or board with an overlay goes to `WorkTray` (which already layers the menu over mounted work), not `AnswerTray` | fix |
| APP-05 | P1 | broken | app | Ask: the microphone recording started on the Ask screen keeps running into the lesson, then posts up to 15 s of lesson audio to speech-to-text | `src/child/screens/Ask.tsx:60-66,74-93`; `src/child/askVoice.ts:46` | cancel the recorder in `submit` and `decide`; cancel a recorder that resolves after unmount | fix |
| APP-06 | P1 | broken | app | The World never shows the date a chapter was sealed: `normaliseMap` drops `sealedAt` | `src/child/api.ts:53-57`; read at `src/ui-v3/kaksha/views.tsx:265` | carry `sealedAt` through | fix |
| APP-07 | P1 | broken | app | Notebook → Then and now → a "This helped" link changes the URL and nothing else | `src/child/screens/Notebook.tsx:103,270`; `NotebookMade.tsx:33` | follow `?made=` after mount (switch to the Made page, open the piece) | fix |
| APP-08 | P1 | broken | app | `/who` (the installed app's start page) shows the raw error text ("internal error", "Failed to fetch") and no button | `src/app/Who.tsx:62,72` | a fixed sentence, "Try again" and Help; never the error's own text | fix |
| APP-09 | P1 | broken | app | Inside every Kaksha screen the older v2 components get night-theme ink even on the light theme: a young child's Help sheet has a near-white button label on white | `src/ui-v3/tokens.css:25-35` (`.v3` sets `--ink`, `--bg`, `--line`); `src/ui-v3/kaksha/kit.tsx:19`, `Shell.tsx:24`, `lesson/KakshaLesson.tsx:100` (`className="v3 kx"`) | map the shared names to the Kaksha tokens on `.kx` (as `childshell.css:10-11` already does for the child shell) | fix |
| APP-10 | P1 | broken | app | `/parent` is a blank cream page while the account loads | `src/app/ParentOnly.tsx:14` | return `<Loading />` | fix |
| APP-11 | P1 | broken | app | Public site header: "How a lesson works" does not scroll to the section | `src/app/landing/Site.tsx:85` (`to="/#lesson"`); no hash handling in `src/app` | scroll to `location.hash` on the landing | fix |
| APP-12 | P1 | broken | app | A tapped steer, later, stop, switch or safe chip is drawn and logged as the child's answer ("Your answer: Diagram bana ke dikhao") and can replace a real one | `src/child/lesson/useDesk.ts:368-372,708-714` | treat those chip ids as requests, not answers | fix |
| APP-13 | P1 | inconsistent | app | `/pricing`, `/pair`, `/signin` paint cream first and then turn near-black; the other public pages are dark from the first frame | `index.html:31`; `src/app/Shell.tsx:55` | add the three routes to the first-paint lists | fix |
| APP-14 | P1 | inconsistent | app | The child reads "Pakka since…" on one Notebook page and "Secure" everywhere else; the file's own rule bans Hinglish chrome words | `src/copy/en.ts:277,279`; `src/ui/copy.ts:228` | "Secure since {date}" | fix |
| APP-15 | P1 | inconsistent | app | A Hindi-lesson child who taps "कुछ और" sees their words in lower-case Latin | `src/child/lesson/useDesk.ts:120` | Devanagari, like the other rows | fix |
| APP-16 | P1 | inconsistent | app | Home and Hello say "Asha" when the child's teacher has another name | `src/ui-v3/kaksha/copy.ts:24,33`; rendered `views.tsx:85` | use the `{T}` name the screen already has | fix |
| APP-17 | P1 | inconsistent | app | An equipped hull or trail is one colour in the Hangar and another in the game | `src/ui-v3/kaksha/play/cosmetics.ts:6,18` (reads the retired classic palette) | read the palette of the look the child is on | fix |
| APP-18 | P1 | broken | app | With "Less motion" on, a newly secure station is drawn about 0.3 px wide (invisible) | `src/ui-v3/kaksha/Orbit.tsx:54,78,134` | no grow-in under reduced motion | fix |
| APP-19 | P1 | broken | app | The settlement rearranges when a new skill becomes secure, and drops a structure after 25 | `src/ui-v3/kaksha/world.ts:120-131`; callers `screens/KakshaWorld.tsx:29`, `lesson/debrief.ts:56` | pass the map's `secureSince` so order is stable; the 25 limit needs a design answer | fix (order); main (limit) |
| APP-20 | P1 | not good enough | app | World and Hangar say "Your first secure idea lands here…" while the map loads (2-3 s) and for ever when the read fails | `src/child/api.ts:96-103`; `src/ui-v3/kaksha/screens/KakshaWorld.tsx:23-32`; `views.tsx:235` | a wait state while loading; a "Try again" panel on failure | main |
| APP-21 | P1 | not good enough | app | At 360×640 with the number pad up, the lesson scrolls and the mic dock is below the fold | `src/ui-v3/kaksha/lesson/stageLayout.ts:105-109`; `lesson/stage.css:6` | shrink the stage to its slot minimum before allowing overflow | main |
| APP-22 | P1 | not good enough | app | Two "page not found" screens with different looks; `/start/typo` and `/parent/typo` show the cream one inside dark surfaces | `src/app/Shell.tsx:99-107`; `src/app/Public.tsx:148`; `src/onboarding/index.tsx:51`; `src/parent/index.tsx:13` | use the Public one everywhere | main |
| APP-23 | P2 | broken | app | Number pad digits typed for one question are still there on the next | `src/child/lesson/AnswerTray.tsx:32,76` | key the pad on the question | fix |
| APP-24 | P2 | broken | app | Hello: Skip within 0.9 s of "heard" finishes twice; tapping Me in that window is pulled into a lesson | `src/child/screens/Hello.tsx:144,147` | hold and clear the timer; finish once | fix |
| APP-25 | P2 | broken | app | The end-of-lesson screen re-reads the map (190 KB+) and the plan each time the lesson screen re-renders | `src/ui-v3/kaksha/lesson/KakshaLesson.tsx:91-92`; `lesson/Debrief.tsx:54-60` | stable loader callbacks | fix |
| APP-26 | P2 | broken | app | Tapping a "Made for you" tile on the end-of-lesson screen leaves without the finish step (no done-today mark, no notebook entry on the device) | `src/ui-v3/kaksha/lesson/Debrief.tsx:184` | run the finish step, then navigate | fix |
| APP-27 | P2 | broken | app | World: open a station that is new today, tap "Yesterday": the sheet is an empty heading and Close | `src/ui-v3/kaksha/views.tsx:188-195,274-278` | close the sheet on the toggle | fix |
| APP-28 | P2 | broken | app | Hangar: a slow first read can overwrite an item the child has just equipped | `src/ui-v3/kaksha/screens/KakshaWorld.tsx:58,62`; `equipSync.ts:19-20` | ignore the read if the child equipped since mount | fix |
| APP-29 | P2 | broken | app | Pairing can say "Something went wrong" after the one-time code has been spent, and the retry then says the code is wrong | `src/app/Pair.tsx:29-34`; `server/pair/routes.js:89` | navigate on the redeem result; a failed refresh is not a failed pairing | fix |
| APP-30 | P2 | inconsistent | app | Pause → End lesson → "Keep going" does not replay the line Pause cut; "Continue" does | `src/child/lesson/useDesk.ts:975-989,1001` | `cancelEnd` resumes like the others | fix |
| APP-31 | P2 | inconsistent | app | The Kaksha dock shows Practice and Ask when the plan refuses them (offline, capped, resting); the classic Home hides them | `src/child/plan.ts:125-129`; `src/ui-v3/kaksha/nav-model.ts:21`; `screens/KakshaHome.tsx:48` | the dock uses `practiceOffered(plan)` | fix |
| APP-32 | P2 | inconsistent | app | Dates on one Notebook screen come from two locales (one fixed `en-IN`, the rest the phone's) | `src/child/growth.ts:32` vs `Notebook.tsx:168,225`, `NotebookMade.tsx:56`, `NotebookJar.tsx:19`, `Remembers.tsx:26`, `views.tsx:265` | one date helper | fix |
| APP-33 | P2 | inconsistent | app | A signed-in family opening a link to a removed child reads "Please ask a grown-up to sign in again"; "Switch learner" on a paired device bounces straight back | `src/child/ChildShell.tsx:139-140,154`; `src/child/screens/Me.tsx:123`; `src/app/Who.tsx:56` | a line of its own for a missing child; hide the row on a paired device | fix |
| APP-34 | P2 | inconsistent | app | Rerunning the brand script overwrites the shipped app manifest with the old one (old icons, cream theme, no id) | `src/app/landing/brand.mjs:73-94`; `public/manifest.webmanifest` | drop the manifest write from the script | fix |
| APP-35 | P2 | inconsistent | app | A paired child device asks `/api/me` first on every open and always gets 403, though the file says it never does | `src/app/device.ts:2-3,39-48` | go straight to the child-device read when the paired marker is set and no sign-in marker is | fix |
| APP-36 | P2 | inconsistent | app | The same thing has two names on neighbouring screens: "parent" / "grown-up"; "orbit" / "World"; "End lesson" / "End for today"; "Your answer" / "You said" | `src/ui-v3/kaksha/copy.ts:26,30,113,132,194`; `src/child/copy.ts:78`; `src/copy/en.ts:243`; `src/ui/copy.ts` (`break.end`, `summary.answered`) | one word per thing | main (which word) |
| APP-37 | P2 | not good enough | app | On a stalled network the child sits on "Getting the lesson ready" or "Saving today's lesson" with every exit disabled | `src/child/lesson/Desk.tsx:336`; `AnswerDock.tsx:113-114`; `Summary.tsx:61` | enable Pause while starting; enable Finish after 8 s of ending | main |
| APP-38 | P2 | not good enough | app | A refresh during Quick practice starts a new set; during Ask it returns to the empty form | `src/child/lesson/LessonScreen.tsx:55`; `useDesk.ts:665`; `src/child/screens/Ask.tsx:33,79` | keep the lesson id in the URL for these two | main |
| APP-39 | P2 | not good enough | app | A refresh mid-lesson loses the end screen's "Now secure" and "Made for you" for that lesson | `src/ui-v3/kaksha/lesson/KakshaLesson.tsx:69,71` | diff on the lesson's start time and id, not on a snapshot taken at mount | main |
| APP-40 | P2 | no longer needed | app | The "not built yet" child stubs still ship in the entry bundle; the fallback can never run | `src/app/routes.tsx:8,39-42`; `src/app/childStubs.tsx`; `src/styles/app.css:30` | import `childRoutes` directly; delete the stubs | main |
| APP-41 | P2 | no longer needed | app | `/who` loads a Google Fonts stylesheet for a font no style uses | `src/app/band.ts:11-12,31`; caller `Who.tsx:40` | delete `ensureFont` and `FONT_URL` | main |
| APP-42 | P2 | no longer needed | app | `src/styles/parent.css` is imported by nothing | `src/styles/parent.css` | delete | main |
| APP-43 | P3 | no longer needed | app | The v3 design-system screens and their flag: about 2,500 lines no route mounts; flipping `ui.v3` changes nothing | `src/ui-v3/{V3Root,Stage,TeacherFace,TurnIndicator,Toast}.tsx`, `toast.ts`, `floor.ts`, `motion.ts`, `flag.ts`, `index.ts`, `v3.css`, `screens/**`, `gallery/**`, `Preview.tsx` | delete after moving the lint test off them (see note) | main |
| APP-44 | P3 | no longer needed | app | The classic child skin is reachable only with `?ui=classic` | `src/child/screens/Home.tsx`, `Map.tsx`, `progress/*`, most of `child.css`, classic branches elsewhere | owner's call (already in `gap-map.json:2160`) | main |
| APP-45 | P3 | no longer needed | app | Dead code in `src/child` | `day.ts` (5 exports), `api.ts` (`getTutors`, `chooseTutor`, `offerOf`), `band.ts:35`, `prefs.ts` (4 keys never read, 1 never written), `dev/harness.*`, unused copy keys | delete | main |
| APP-46 | P3 | no longer needed | app | Dead code in the lesson screen | `deskLayout.ts:281`, `captions.ts:55,77-85`, `ledge.ts:14-32`, `model.ts:75-80`, constant model fields (`thinkingSeconds`, `offlineBadge`, `noPack`), props never passed (`supportCode`, `notMeWindow`) | delete | main |
| APP-47 | P3 | no longer needed | app | Dead files and exports in `src/ui` and `src/app` | `src/ui/{Card,Hi,ReauthField,StatusGlyph}.tsx`, `Chip`, `readLang`; `Shell.tsx` `Footer`/`TopBar`; `landing/Site.tsx` `HeroArt`, `SiteArt`, `TeacherPortrait`; `Public.tsx:69` `Trust`; 14 unused copy keys | delete | main |
| APP-48 | P3 | no longer needed | app | Unreferenced assets, about 334 KB in every image | `public/landing/*.webp` (3), `public/fonts/mukta-*-latin*.woff2` (6) and `mukta-700-devanagari.woff2`, 15 files in `public/brand` | delete (the brand files with APP-34) | main |
| APP-49 | P3 | inconsistent | app | Comments and leftovers that say the opposite of the code | `src/child/routes.tsx:13,36`; `src/child/plan.ts:13-14`; `Notebook.tsx:14-19`; `src/ui-v3/kaksha/flag.ts:32,71,81`; `src/app/band.ts:2-3`; `src/app/install.ts:25-26`; `lesson/model.ts:2`; `LessonScreen.tsx:5` | correct the comments | fix |
| APP-50 | P3 | inconsistent | app | Sign-in errors worded two ways; "Wait a few minutes" where the server's limit is 60 s | `src/copy/en.ts:146-148,306` | one wording | fix |
| APP-51 | P3 | inconsistent | app | The installed app's theme colour is the retired classic black, the page's is Volt | `public/manifest.webmanifest:10-11` (`#05060A`) vs `index.html:7` and `kaksha/tokens.css:208` (`#08090B`); boot skeleton colours `index.html:38` | one colour | fix |
| APP-52 | P3 | inconsistent | app | `/who` sends a signed-out visitor to `/start/lang`, which only redirects | `src/app/Who.tsx:54`; `src/onboarding/index.tsx:31` | `/start/class` | fix |
| APP-53 | P3 | broken | app | A new pairing code shows the wrong time left for up to a second | `src/app/PairCard.tsx:35-43,56` | reset the clock when the code appears | fix |
| APP-54 | P3 | inconsistent | app | Two catalogue emotes draw the same picture; the renderer's "rocket" branch matches no id | `data/kaksha/catalog.json`; `src/ui-v3/kaksha/views.tsx:314-316` | a picture for the second emote | main |
| APP-55 | P3 | not good enough | app | The Young theme runs a 60 fps loop that draws nothing | `src/ui-v3/kaksha/Shell.tsx:83,95` | do not start the loop | main |
| APP-56 | P3 | not good enough | app | Every return to the tab reads the plan twice | `src/child/plan.ts:200-209` | drop the `focus` listener | main |
| APP-57 | P3 | not good enough | app | On phones the public site header has no links; Promises, Pricing and Help are only in the footer | `src/styles/landing.css:27,36` | a design decision | main |
| APP-58 | P3 | inconsistent | app | Three different logos (tab and share card; parent corner; installed icon and `/who`) | `src/ui/Icon.tsx` `Mark`; `public/brand`; `public/site/app` | owner picks | main |
| APP-59 | P3 | inconsistent | app | The "holdover" guard against a tap landing as the tiles appear is documented and never applied | `src/child/lesson/hooks.ts:96-125`; `useDesk.ts:516` | apply it or delete it | main |
| APP-60 | P2 | not good enough | app | At 360 px the type row (input, Send, Talk) is wider than the classic dock; computed from the CSS, not rendered | `src/child/lesson/desk.css:257-258,233,278,192` | lower the input's minimum width on phones | main |

### For other streams (outside this area; not counted above)

| ref | owner | what | where |
|---|---|---|---|
| X-1 | platform | The server preloads a landing hero image the landing no longer draws | `server/serve.mjs:82-99` |
| X-2 | platform | Fonts, landing pictures and icons are sent in full on every load: `no-cache`, no ETag, no 304 | `server/serve.mjs:112` |
| X-3 | platform | The landing video is served as `application/octet-stream` (no `.webm` type) | `server/serve.mjs:16-21` |
| X-4 | voice | An answer saved offline, then a reload that resumes the same lesson: the held answer is never sent (read from code, not reproduced) | `src/lesson/runtime.ts:359,499,525-529` |
| X-5 | brain | The server sends `ui.hint` but `UiDirectives` has no such field; the client reads it through a cast | `src/child/lesson/useDesk.ts:40-44`; `server/director/state.js:3587` |
| X-6 | tests | Several app tests match source text instead of running it, so they pass while the behaviour is broken: `round3-fix.test.mjs:554-566` (APP-04), `r7-app-notebook` (APP-01, 02), `r7-app-seals.test.mjs:78` (APP-06, feeds the raw map) | `tests/` |
| X-7 | face | `src/face-puppet/adapter.tsx` is only called from the dead `V3Root.tsx` (APP-43) | `src/face-puppet/adapter.tsx` |

## Evidence notes

**APP-01.** Home (`KakshaHome.tsx:80`) and the end screen (`KakshaLesson.tsx:93`) link to `/notebook?made=<id>` with the plan's id, which the server builds as `String(r.intent_id ?? r.build_sha)` (`madeFor.js:28`). The shelf looks it up with `cards.find((c) => c.id === open && c.replay)`, where a card's id is `String(r.id)`, the `studio_mount` row number (`studio.js:165`). The two never match, so nothing plays. The server already sends `intentId` on each card.

**APP-02.** One effect starts two reads. The server read sets pages with `boards`, `first`, `topicId`. The summaries read, when it returns, runs `setPages(list.map(...))` from the device's own list only. Whichever lands last wins; when a just-finished lesson has no cached summary the summaries read is in play on every open.

**APP-03.** `takeBreak` calls `runtime.tapChip({ id: "break:rest", label: "" })`. The link emits `child_final` with `text: ""`; the runtime queues a turn only `if ((e.text || e.asrConfidence === 0) && ...)` (`runtime.ts:661`), so nothing is sent and the server never sets `s.resting` (`state.js:2643`). The Desk still handles the event and sets `answer: { text: "" , form: "tapped" }`.

**APP-04.** `Desk.tsx:232`: `m.tray.kind === "tiles" || m.tray.kind === "pad" || !!m.tray.overlay` sends any tray with an overlay to `AnswerTray`, which draws only the menu. `WorkTray.tsx:48-52` has the layer that keeps a module, Studio piece or board mounted under the menu ("never lost to a Help tap"), but with that routing it is never reached. In Kaksha, `holdable()` (`StageBody.tsx:41`) keeps boards and non-play Studio pieces only, so a module or a play piece is unmounted.

**APP-05.** With hands-free on and the mic granted, Ask starts a recorder on open (`Ask.tsx:60-66`). `submit` and `decide` set `asked`, and Ask then renders `<LessonScreen variant="doubt">` itself, so it never unmounts and the effect cleanup that would cancel the recorder never runs. At `ASK_MAX_MS` (15 s) the recorder posts its clip to `/api/voice/transcribe`.

**APP-06.** `normaliseMap` rebuilds each chapter field by field (`id, number, title, sealed, here, school, secure, total, topics`) with no `sealedAt`. The World only ever gets the normalised map. `tests/r7-app-seals.test.mjs:78` feeds the raw map, so it passes.

**APP-07.** `useState(madeId ? "made" : ...)` reads `?made=` once. The "This helped" link goes to the same route, so the component stays on "growth"; `MadeShelf`'s `useState(openId)` has the same one-time read.

**APP-08.** `(e) => setErr(errText(e))` then `<main ...><ErrorNote>{err}</ErrorNote></main>`. Run in Chromium against the build: `/api/me` 500 → page text is "internal error" with no control; request aborted → "Failed to fetch". The manifest's `start_url` is `/who`, so this is what the installed app shows offline.

**APP-09.** `.v3 { --ink: #F2F4F8; --ink-2: #A9B0C0; --line; --bg; ... }` uses the same property names as `src/styles/tokens.css`. The three Kaksha roots carry `class="v3 kx"`, and no Kaksha stylesheet reads a `.v3` variable (0 matches for `var(--ink`, `var(--bg`, `var(--line`, `var(--board` under `src/ui-v3/kaksha`). Any v2 component inside gets night ink on the light theme. Rendered from the real CSS with `data-klook="volt" data-ktheme="dawn"`: `.dk-btn--secondary` text `rgb(242,244,248)` on `rgb(255,255,255)`.

**APP-10.** `if (me === undefined) return null;`. Run: `/api/me` delayed 2.5 s → boot mark, then an empty root on the cream body, then the gate.

**APP-11.** Run at 1280 px: on `/promises`, click the link → URL `/#lesson`, `scrollY` 0, the section at 833 px.

**APP-12.** `useDesk.ts:368-372`: only the help chip ids (`helpAskedKey`) are requests; every other typed/tapped `child_final` becomes `answer: { text: e.text, form: "tapped" }`. The Summary log (`:708-714`) takes any answer with non-null text.

**APP-13.** Run at 360 px: first frame `rgb(246,243,236)` on `/pricing`, `/pair`, `/signin`; final `rgb(8,9,11)`. `tests/r7-app-shell.test.mjs:47` pins the current regex and changes with the fix.

**APP-16.** `openSub: "Just start. Asha takes it from there."` is rendered under a face labelled with `rec.name`, which is the child's own name for her.

**APP-17.** `cosmetics.ts` reads `K_NIGHT[key]`, the classic palette; production ships the Volt look for both families (`look.ts:13`). Hue `her`: Hangar `#A98CFF`, game `#FFB547`.

**APP-18.** `grow = 1 - (1 - min(1, t/1.4))^3`; under reduced motion the loop draws one frame at t≈16 ms and stops, so `grow` ≈ 0.03 and a new station's size is `10 * 0.03`.

**APP-19.** Ran `world()`: going from 5 to 6 secure skills moved 4 of 5 structures; 25 → 26 removed one. `Settlement.tsx:4` says "nothing decays". Neither caller passes `since`.

**APP-21.** `solveStage({width:360,height:640,family:"older",answerNeed:232,chips:true,artifact:true})` returns `overflow: true` with the dock's bottom at 700. `context/rejected.md:34` records budget phones as 360 × 640-720 after browser bars.

**APP-25.** `loadAfter={() => loadMap(cid)}` and `loadMade` are new functions on every `renderSummary` call and both are effect dependencies in `Debrief.tsx:54-60`.

**APP-40 to APP-48 (dead things).** Importers were searched across `src`, `tests`, `scripts`, `server`, `evals`, `shared`, root `*.html`, `vite.config.ts`, `package.json`, Dockerfiles and `.github`, including `import()` and `import.meta.glob`. What still points at them and must change with a deletion:
- APP-40: `context/decisions.md:6894` already names the stubs as the last caller to drop.
- APP-43: `tests/ui-v3-lint.test.mjs:89-149` reads eight of these files; `tests/r7-face-fallback.test.mjs:29` asserts the adapter; `context/decisions.md:5066` cites the tree; `docs/design/reset/prework/rs1/shoot.mjs` drives the gallery. `Icon.tsx`, `primitives.tsx`, `tokens.css`, `tokens.ts`, `fonts/` and `lint/rules.mjs` are live and stay.
- APP-45: `src/child/teacher/TeacherNamer.tsx` is imported only by a test, but `Hello.tsx:15` says it is parked on purpose: kept, not listed. `src/child/dev/stage-geometry.mjs` is run by `tests/r7-app-steer.test.mjs:70`: kept.
- APP-48: `public/fonts/OFL-NOTICE.txt` stays (licence).

## Checked and clean

- Every route in `src/app/routes.tsx` and `src/child/routes.tsx` resolves to a module; dev routes are gated; no dev HTML page is a build input.
- Every client call in the area has a server route with matching fields (child, pair, code sign-in, equip, reflect, emote, plan, map, notebook, jar, memory).
- No raw `err.message` is drawn to a child in `src/child` or `src/ui-v3`; the lesson screen never shows `state.error`.
- Tap targets in `child.css`, `desk.css` and `src/styles` are 44 px or more.
- The device's saved keys are per child; none collide across children on one device.
- The service worker does not pin an old `index.html`.
- `context/rejected.md` has no entry on any fix proposed here; nothing overlaps the director17 queue.

## Coverage

- **Read fully:** `src/child/**` except the files below; `src/child/lesson/**` except `headset.ts`; `src/ui-v3/kaksha/**` except `Base.tsx` and `dev/*`; top-level `src/ui-v3` flag, floor, toast, V3Root, Preview, TeacherFace, TurnIndicator, motion, `tokens.css`, `lint/rules.mjs`, gallery entry; `src/app/**`; `src/ui/**` except `teacher/`; `src/copy/en.ts`; `src/styles/*.css`; `src/main.tsx`; `index.html`; `vite.config.ts`; `public/manifest.webmanifest`; `public/sw.js`; `data/kaksha/catalog.json`.
- **Skimmed (imports, exports, selectors):** the dead `src/ui-v3/screens/**`, `Stage.tsx`, `primitives.tsx`, `Icon.tsx`, `tokens.ts`, `v3.css`; `kaksha/Base.tsx`; `kaksha/dev/*`; `src/child/pictos.tsx`, `progress/Garden.tsx`, `progress/StateShape.tsx`; `child.css` after line 140 (searched for sizes); `src/child/lesson/dev/DeskDev.tsx` after line 120; `src/ui/icons/state.tsx`.
- **Not read:** `src/child/teacher/teacher-name.css`; font and image binaries (listed with sizes and searched for references); the Scheduler files and `headset.ts` (other areas).
- **Run:** `npx tsc -b` and `npx vite build` (pass); four first-paint and error-state checks in headless Chromium against the build (APP-08, 10, 11, 13); the real CSS rendered for APP-09; `world()` and `solveStage()` called directly for APP-19 and APP-21. No full journey in a browser (area 13 does that); APP-60 is computed from CSS and not rendered.
- **Method:** four readers took one slice each and I checked their candidates against the code; one skeptic pass then tried to refute the full list.
