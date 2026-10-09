# Round 4 audit: why Taxila reads as "childish and basic"

**Key:** `audit` · **Date:** 2026-10-09 · **Target:** taxila.dev, production, as deployed at 16:24-16:45 UTC
**Owner verdict being explained:** "The whole ui, ux, product design, animation everything on product is childish and
basic shit."

This is a causes audit, not a redesign. Every finding names the screenshot that shows it and the source that produces
it, so a fix can go to the cause. It does not propose a new look. That is the redesign streams' job, and the owner
chooses by looking. Section 6 lists what the redesign has to change across the whole system.

---

## 0. The answer on one page

Taxila reads as **childish** because the live product is still the ages 6-9 design. It was built as a "picture book
place" with baby-animal avatars, a big-eyed cartoon teacher, a garden that grows, rounded pills and "ask a grown-up"
copy. Nothing in it changes for a class 8 child. The reset that was written for ages 9-15 (`docs/design/reset/DESIGN-V3.md`:
dark, premium, "no mascots, no cartoon animals") **was never switched on**. `src/ui-v3/` exists, `uiV3Enabled()` is
called nowhere outside its own folder, and `src/app/routes.tsx` imports none of it.

It reads as **basic** because nothing on screen shows craft:
- **Type:** one accessibility typeface does everything, at 4 sizes inside a 14-18 px band.
- **Colour:** the screens are mostly cream, white and grey.
- **Surfaces:** every one is a white card with a 1-2 px grey outline.
- **Motion:** there is almost none. The motion spec is "settle, never bounce", so a right answer gets a 22 px tick.
- **Sound:** synthesised sine beeps, off by default for ages 10 and up.
- **Art:** four rendering styles that never meet, sometimes on one screen: painted backdrops, glossy AI clip-art,
  flat vector faces and a dark sci-fi game HUD.

**Top 10 causes, ranked by impact** (detail in §5):
1. **The teacher looks like a sticker, not a teacher.** Asha is a big-eyed chibi girl. Arjun is a flat clip-art avatar.
   They are drawn in two styles and do nothing but blink and move their lips.
2. **The live design is the 6-9 design. The 9-15 reset was never shipped,** and class 4 is put in the "Young" family.
3. **Baby-animal avatars and glossy clip-art objects** sit on every child screen.
4. **The copy talks down**: "Grown-ups", "Ask a grown-up to turn on the microphone", "Pick your picture", "That's me",
   "Let's plant the first one today".
5. **There is no type system,** only an accessibility font. Atkinson Hyperlegible sits at 14-18 px with no display
   voice, and maths never looks like maths.
6. **The answer moment has no payoff.** Right gets a 22 px tick on a chip. Wrong gets a magnifier. Nothing moves,
   nothing sounds, nothing changes in the world.
7. **The lesson is a chat form, not a stage**: an empty beige tray, a disabled grey Send, "Thinking… 6 s".
8. **The "game" is a third design system dropped in**: a dark HUD with 8-9 px mono labels and a title over the scene.
   It is often unrelated to the question (a ruler for a weight problem).
9. **Generic, low-energy surfaces.** About 54-91 % of the pixels on most screens are light neutrals. Outlined white
   cards are stacked on wallpaper, and the laptop layout is the phone layout floating in empty space.
10. **The progress world and empty states are placeholders**: a grid of identical grey dots called a "Sky map", and
    one clip-art object plus one sentence for every empty state.

---

## 1. Method, and what this audit cannot claim

- **Account:** the w0-smoke flow (`tests/prod/lib.mjs` `withTestAccount`). API signup of an `@taxila.test` guardian,
  then child (class 5 Riya, Hinglish, cricket), consent and open hours. Siblings Kabir (class 4, band b2 "Young") and
  Meher (class 8, band b4) were added, and a PIN was set. `DELETE /api/account` ran in `finally`. Four accounts were
  made in all, and every run's log ends **"cleanup: account deleted"**.
  - A first attempt that failed (next bullet).
  - The main walk.
  - The supplement: a class 7 child (Dev), `?face=B`, Pause → End.
  - The recorded motion session: a fresh class 6 child.
- **Browser:** Playwright 1.63 with the preinstalled Chromium.
  - Chromium pointed at the sandbox proxy failed (`net::ERR_TOO_MANY_RETRIES` on the first JS chunk). The landing
    rendered as a grey skeleton, and that attempt's shots were thrown away.
  - Every request is now routed through Node's `fetch` over the proxy, and Node verifies TLS. This is exactly what
    `tests/prod/_owner.mjs` `launchRouted` does. The browser made no TLS connection of its own.
  - The scratch runs carried `ignoreHTTPSErrors` on the browser context, copied from `tests/prod/lib.mjs` `launch`.
    It had no effect because no request reached the browser's network stack. It is removed from the copies in
    `harness/`.
  - Each state was shot at **360×800, 412×915 and 1366×768** by resizing one page. The Desk and the parent corner
    re-lay themselves out from their container.
- **Type facts:** at every shot the harness recorded the font families, sizes and weights of the visible text
  (`capture-log.json`). The colour shares in §4 come from the PNGs.
- **Not seen, or not like a phone:**
  - **The round 3 games (Todo-Jodo, Taraazu, Nishana, Kyun-Lab) are not on taxila.dev.** `GET /api/play/admit`
    answered 404 at 16:20 UTC, so a child cannot meet them. The "game chrome" audited here is what a child does meet:
    Studio v2 pieces ("Balance the parcel") and module skeletons ("Sahi hisson ko shade karo").
  - **Headless Chromium uses SwiftShader**, which is on `KNOWN_BAD_GPU` (`src/avatar/tier.ts`), so Arjun drew at
    tier D, the 2D plate. Forcing `?face=B` with WebGL on (`shots/lesson-b3-faceB-*`, `shots/child-b3-*-faceB*`)
    gives the same flat vector look with a moving mouth. What a child sees on a Rs 10k phone with a Mali-G52 (B-lite)
    still needs a real device.
  - **The whiteboard's hand font** (`HAND_FONT` = Segoe Print, Chalkboard SE, Comic Sans MS, Comic Neue, `casual`)
    fell back to a plain sans on Linux. On Android, `casual` is a comic handwriting face. That is inferred from
    Android's system font config, not seen here.
  - **The typed walk could not finish the Young lesson.** The Young dock has no text row, so the class 4 walk stopped
    after the opening. The Young summary was not captured, and the Older summary was reached through Pause → End.
  - This is **one adult-scripted run per band**. It shows what a child sees, not how often, and no child or parent
    judged anything here.

---

## 2. Research: what reads "for little kids" vs "for me" to Indian 9-15 year olds, and what parents read as premium

### 2.1 Children police age-fit, fast and narrowly
- **NN/g, children aged 3-12** (three rounds: 2001 with 55 children aged 6-11, 2010 with 35 aged 3-12, 2018 with 35
  aged 3-12):
  - Children are "acutely aware of age differences". They reacted negatively to content aimed even one school grade
    above or below their own.
  - A 6-year-old dismissed a site as "for babies, maybe 4 or 5 years old. You can tell because of the cartoons and
    trains."
  - NN/g recommends designing separately for 3-5, 6-8 and 9-12. There is "no such thing as designing for children".
  - Source: [NN/g, Children's UX: usability issues](https://www.nngroup.com/articles/childrens-websites-usability-issues/).
- **NN/g, teenagers 13-17** (100 users across three rounds; US, UK and Australia):
  - "Avoid anything that sounds condescending or babyish." The "kid" label is a "teen repellent".
  - Teens prefer neutral graphics to childish ones, so ease up on the heavy animations and garish colour schemes that
    work for younger audiences.
  - Teens dislike tiny type as much as adults do. They like features that let them act (quizzes, games, making
    things) over pointless multimedia.
  - Source: [NN/g, Teenagers' UX](https://www.nngroup.com/articles/usability-of-websites-for-teenagers/).
- **The neoteny cue is a real industry signal.** Disney Research (Carter et al., IDC 2016) measured characters made for
  younger children and found larger heads, larger eyes and rounder eyes than in characters made for older children.
  Honest caveat: the same study found that children's own preferences did not vary systematically by age. Big round
  eyes are what the industry uses to say "for younger kids". They are not proof that kids dislike them. Source:
  [Disney Research, Designing animated characters for children of different ages](https://studios.disneyresearch.com/2016/06/21/designing-animated-characters-for-children-of-different-ages/).
- **Adolescents trade on status and respect.** Interventions work when they treat young people as capable and give
  them status. Being talked down to, or treated as small, backfires. Source:
  [Yeager, Dahl & Dweck 2018, Perspectives on Psychological Science](https://doi.org/10.1177/1745691617722620).
- **Tweens leave "kid" early.** Nickelodeon focus-group research reported that by about 11, children no longer think
  of themselves as kids and ignore pictures aimed at them. This is dated trade reporting, so treat it as directional:
  [City Journal, "Tweens: ten going on sixteen"](https://www.city-journal.org/article/tweens-ten-going-on-sixteen).

### 2.2 How the products this age respects handle it
- **They split the kid look off by age, as a separate product.**
  - **Spotify Kids** (ages 3-12) has two experiences. The younger one uses "softer, character-based" art, simpler
    shapes and softer colours. The older one is "more realistic and detailed". Its avatars are monsters.
    ([Internet Matters](https://internetmatters.org/hub/news-blogs/spotify-kids-app-launched-to-provide-curated-songs-for-children-aged-3-and-over),
    [TechXplore](https://techxplore.com/news/2019-10-spotify-standalone-music-app-kids.html))
  - **Khan Academy Kids** is a separate app for ages 2-8 ([App Store](https://apps.apple.com/in/app/id1378467217)).
  - **BYJU'S** put Disney characters only on its K-3 product, for ages 6-8
    ([Business Insider](https://www.businessinsider.in/byjus-and-disney-partner-to-roll-out-early-learn-app/amp_articleshow/69532987.cms),
    [TechRadar](https://www.techradar.com/news/byjus-early-learn-app-now-available-for-kindergarten-kids)).
  - None of them shows a class 8 child the K-3 look. Taxila does (§3.5).
- **Cartoon can work for older users, but only with a system and an attitude.**
  - **Duolingo** is cartoony and used by adults. Its 2019 work moved to one geometric, flat-perspective illustration
    grammar so that anyone's drawings combine. It added a custom typeface (Feather Bold) and a voice with a distinct
    personality, and it gave Duo "a wider range of expressions and movement".
    ([Design Week](https://www.designweek.co.uk/duolingo-rebrand-avoids-silicon-valley-tropes-and-reflects-companys-quirky-personality/),
    [Creative Bloq](https://www.creativebloq.com/news/feather-bold))
  - Taxila has the cartoon without the system. Its art comes in four styles (§3.8), its type is generic and its copy
    has no attitude.
- **Brilliant** rebuilt its game mechanics on Rive state machines so that interactions have real transitions between
  states. Its tutor character, Koji, reacts to lesson state: waving, nodding, and reacting differently depending on
  whether you breezed through or fought for it. ([Rive on Brilliant](https://rive.app/blog/how-brilliant-org-motivates-learners-with-rive-animations),
  [Rive, Koji](https://rive.app/blog/brilliant-builds-its-math-and-coding-tutor-character-with-rive))
  - Taxila's teacher shows no state beyond lips and blinks. Its answer feedback is a stroke on a chip.

### 2.3 What Indian parents read as premium vs cheap
- **The look is the first credibility cue.**
  - Stanford / Consumer WebWatch: "design look" was the most frequent theme in 2,684 people's credibility comments,
    in 46.1 % of comments ([Consumer Reports](https://advocacy.consumerreports.org/research/how-do-people-evaluate-a-web-sites-credibility)).
  - Visual appeal is judged within 50 ms, and those judgements agree with longer looks (Lindgaard et al. 2006,
    *Behaviour & IT* 25(2); [Nature news](https://www.nature.com/news/2006/060109/full/news060109-13.html)).
  - A parent decides "cheap or serious" before reading a word of the promises.
- **In India, trust attaches to the teacher.**
  - PhysicsWallah is, in its CEO's words, "a face-led brand… also a teacher-led brand". Its trust was built on a
    relatable, real teacher and low prices, not on ad spend ([Inc42](https://inc42.com/?p=538711),
    [Wikipedia](https://en.wikipedia.org/wiki/Physics_Wallah)).
  - In a 2022 LocalCircles survey (about 27,000 responses), 69 % of paying edtech customers reported problems,
    including teacher quality ([Careers360](https://news.careers360.com/edtech-customers-facing-infra-quality-refund-issues-96-percent-seek-government-regulation-survey)).
  - A parent judging Taxila is judging the teacher's face first. Today that face is a vector avatar (§3.8.1).
- **Premium in Indian consumer apps** (CRED's NeoPOP is the local reference): a restrained dark base with bright
  accents kept for moments, hard edges, high-end type, little clutter and one design language across every product
  ([Analytics India Mag](https://analyticsindiamag.com/cred-open-sources-its-ui-design-system-neopop/),
  [Homegrown](https://homegrown.co.in/article/806427/cred-s-new-design-philosophy-channels-the-unbridled-creative-spirit-of-the-neo-pop-art-movemen)).
  The live Taxila is the opposite on every count: light cream, pill-rounded, generic type and several languages at
  once.
- **Not re-verified this session:** the Indian Gen Z app and game references (Instagram, YouTube, BGMI, Free Fire,
  Spotify, Valorant) are cited in `docs/design/reset/DESIGN-V3.md` §17. The detailed parent-sentiment figures in
  Central Square Foundation's BaSE 2.0 were not reachable.

### 2.4 The rule this gives the redesign
For a 9-15 year old, these cues read as "for little kids":
- big round eyes and big heads;
- baby animals;
- "grown-up" language;
- pastel, rounded, pill-shaped everything;
- one big uniform type size;
- picture-book places.

These read as "for me":
- a credible person;
- an aspirational, older reference point (the apps they already use);
- dense, purposeful information;
- confident type with a voice;
- motion with weight that responds to what *they* did;
- humour or attitude;
- being treated as capable.

A parent reads "premium" from the teacher's credibility and from the same system being consistent and crafted
everywhere. None of this needs a reward economy, so the NEVER MANIPULATE floor is not in tension with any of it.

---

## 3. Screen by screen

Paths are relative to this folder (`docs/design/round4/audit/`). `__360x800`, `__412x915` and `__1366x768` exist for
every shot name unless noted. `-full` means a full-page shot.

### 3.1 Landing `/` (`shots/landing__*.png`, `shots/landing-full__*.png`)

| what reads childish / basic | why | source |
|---|---|---|
| The two teacher portraits are flat vector circles (Bitmoji-style heads) pasted onto a painted, realistic desk scene, and again under "Your child names the teacher". | Two rendering styles collide in the hero. The face style is the default-avatar look a parent associates with free apps, not with a teacher. | `src/app/landing/Site.tsx` `TeacherPortrait` → `src/avatar/Plate2D.tsx` `DrawnPlate`; the hero is `bg/landing-hero` |
| "A personal AI teacher for **classes 1 to 9**" | The headline promises a product for 6-year-olds as well. Target is classes 4-9. | `src/app/landing/Landing.tsx` hero copy; `index.html` meta |
| The page is a list of disclaimers: "Our promises", "Where we are: no reviews, ratings or results", "We have not set a price", helplines twice. | Compliance-led copy with no product magic. Nothing shows a game, a board building, or the teacher's voice. The "real lesson" proof is a 240 px phone mock of a beige card reading `1/2 = 2/4`. | `Landing.tsx` sections (header comment: "no testimonials… every claim maps to something shipped") |
| Type: Literata serif headings + Atkinson body, 8 sizes from 13 to 28 px at 360 (`capture-log.json`) | A bookish serif plus an accessibility sans reads as a public-information leaflet, not as a product. | `src/styles/tokens.css` `--font-title`, `--font-ui`; `src/styles/landing.css` |
| One navy button colour on cream, with no accent | A single colour family on a light neutral (66 % light-neutral pixels at 360) gives a "template" first impression (Lindgaard: decided in 50 ms). | `tokens.css` `--nib`, `--paper` |
| The garden mock ("Progress your child can see"): clip-art flowers in a brown box | It tells the parent that progress is a toy. | `Landing.tsx` → the Garden screenshot asset |

### 3.2 Sign-up and onboarding (`shots/signup-1-class*`, `onboarding-2-meet-teacher*`, `signup-3-promises*`, `signup-4-account`, `signup-5-consent`, `onboarding-6-about-child*`, `onboarding-7-pin-hours`, `onboarding-8-sound-check`, `onboarding-9-handover`)

| what | why | source |
|---|---|---|
| Teacher pick "Meet Arjun": the flat vector bust in a navy rounded square is the only image in the flow (`onboarding-2-meet-teacher-picked__360x800.png`; the class 8 pick is identical, `onboarding-2-meet-teacher-class8`). | It is the most important trust moment for the parent, and the teacher looks like a profile placeholder. Class 1-4 parents meet Asha, the chibi puppet (§3.8.1). | `src/onboarding/steps/Meet.tsx` → `TeacherFace` → `src/avatar/Plate2D.tsx` |
| Every step is the same white outlined tiles (`.tile`: 2 px `#868A94` border, 16-24 px radius) in a 480 px column, with a 4 px segment bar | It reads as a form wizard. The grey 2 px outline on every tile makes the screen look like a wireframe. | `src/styles/ui.css` `.tile`; `src/onboarding/Layout.tsx` `StepFrame`; `tokens.css` `--line:#868A94` |
| A black focus box around each step title ("Create your parent account", "What Taxila may do", "Ready for Riya?") in `signup-4-account`, `signup-5-consent`, `onboarding-9-handover` | The title gets focus on every step. `.onb-title { outline:none }` removes the outline but not base.css's `box-shadow` ring, so a 2 px box shows. In this capture it appeared on direct loads and keyboard arrival. Whether a touch user sees it was not tested. | `Layout.tsx` (`h1.current?.focus()`), `src/onboarding/onboarding-v2.css` `.onb-v2 .onb-title`, `src/styles/base.css` `:focus-visible` |
| 1366: a 560 px card floats over a blurred crop of a hand and a steel chai glass (`onboarding-2-meet-teacher-picked__1366x768.png`) | The background photo is cropped arbitrarily and the card has no relation to it. It is decoration without composition. | `onboarding-v2.css` `.onb-edge` + `bg/onboarding-edge` |
| Handover "Give the phone to Riya now / Later" with a 96 px stroke phone and clock (`onboarding-9-handover`) | Icon-in-a-box tiles in the default style. | `src/onboarding/Setup.tsx` `HandoverStep` |
| Copy: mostly plain and respectful to parents. "Only grown-ups should know it" (PIN) starts the "grown-up" register the child then inherits. | | `Setup.tsx` |

### 3.3 Who is learning (`shots/who-picker__*.png`)
- Navy discs with a single white initial ("R", "K", "M") inside 2 px outlined tiles, with a door glyph top-right. At
  1366 there are three 140 px tiles in an empty cream page. This is the default-avatar fallback. The child's chosen
  picture is not shown here for a child who has not done Hello.
- Sources: `src/app/Who.tsx`; `src/styles/app.css` `.who-*`.

### 3.4 First meeting, Hello (`shots/child-hello-01-greet` … `05-name`; Young: `child-b2-hello-01..03-avatars`)

| what | why | source |
|---|---|---|
| Card 1: the teacher's name in Literata 28 px and "AI teacher" under a flat bust, with a "Next" button (`child-hello-01-greet__360x800`) | The first moment a 10-15 year old meets the product is a name tag. | `src/child/screens/Hello.tsx` `greet`; `.hello-name` |
| Card 2: "I'm a computer teacher, not a person." with a glossy 3D laptop clip-art | The disclosure is required and stays (safety floor). The *art* that carries it (a toy laptop with a plant) and the "computer teacher" wording read as a picture book. | `Hello.tsx` `ai` card; `states/ai-teacher-card` art; `child/copy.ts` `aiLine2` |
| Card 3 "Pick your picture": red panda cub, tiger cub, elephant calf, river dolphin, hornbill, peacock (`child-hello-03-picture`, `child-b2-hello-03-avatars`, all 24 in `shots/art-avatars.png`) | Baby animals are the clearest "for little kids" cue (NN/g "cartoons"; Spotify Kids gives the same choice to ages 3-12). A class 8 child gets the same six on the first page. | `src/child/pictos.tsx` `AVATARS` (line 95); `public/assets/gen/avatars/*` |
| Card 4 "Your grown-up chose these. Are they right?" with one cricket-bat clip-art tile | "Your grown-up" positions a 13-year-old as a small child. | `child/copy.ts` `likesQ` |
| Card 5 "What will you call your teacher?" | Naming the teacher is a kid-app ritual. Safe, but young. | `src/child/teacher/TeacherNamer.tsx` |

### 3.5 Child home (`shots/child-b3-home*`, `child-b4-home*`, Young `child-b2-home*`)

| what | why | source |
|---|---|---|
| **Class 8 (b4) home is the class 5 home** (`child-b4-home__360x800` vs `child-b3-home__360x800`): the same rooftop, same Arjun, same tiles, same "Grown-ups" pill, same animal avatar. | Bands b3 and b4 differ only in a few px of type. Nothing ages up. | `src/child/band.ts` `bandForClass`; `tokens.css` `[data-band=b3/b4]` |
| **Class 4 gets the 6-9 product** (`child-b2-home__*`): the courtyard, Asha, a "Your first lesson" card with a balance-jug clip-art, and three picture tiles (watering can "Garden", slate "Practice", notebook). No tab bar. | `bandForClass(4) = "b2"` → family "young". A 9-year-old in the target band is designed for as a 6-year-old (NN/g: one grade off is already rejected). | `src/child/band.ts` lines 9-14; `src/child/screens/Home.tsx` `YoungTiles` |
| The home is a column of white outlined cards floating on a painted wallpaper (`child-b3-home__1366x768`): the teacher in a white frame, a "Today" card with a glossy pencil-box clip-art, two text tiles, a "Your sky" panel. | The painting is a backdrop, not a place you act in. The cards have no relation to it. A widget board over a desktop wallpaper reads as basic. | `src/child/chrome.tsx` `ChildScreen`/`Ground`; `child.css` `.home-grid`, `.cs-card` |
| "Grown-ups" pill on every home, top-right | The parent door is named in toddler register for every band. | `chrome.tsx` `GrownUps`; `child/copy.ts` `grownups` |
| Subject and state spots are glossy, semi-3D AI-rendered objects (pencil box, balance jug, watering can, slate; `shots/art-states-subjects.png`, `shots/art-topics.png`) | Clip-art "stock object" look, a fourth style next to the painting, the vector face and the HUD. | `src/child/art.tsx` `Spot`; `public/assets/gen/{states,subjects,topics}` |
| Type at 360: 4 sizes, 13-24 px (Older); Young 16-24 px with everything 16-18 | No hierarchy beyond "card title" and "body". Young is big and uniform, like a large-print reader. | `child.css` lines 22-33 (`--t-*` per band) |

### 3.6 World map: Sky map (Older) and Garden (Young) (`shots/child-b3-map*`, `child-b4-map*`, `child-b2-map-garden*`, `child-b3-map-sheet*`)

| what | why | source |
|---|---|---|
| Sky map (`child-b3-map__1366x768`, `child-b3-map-full`): a navy panel tiled with identical grey dot clusters joined by hairlines, chapter names in 12-13 px, "Your class is here" as a white pill | Every not-started skill is the same grey dot, so a new child sees a wallpaper of placeholders. There is no depth, no scale, no sense of a world you are crossing. It reads unfinished. | `src/child/progress/SkyMap.tsx`; `StateShape.tsx` `SkyStar` (`not_started` = a 0.45 r grey dot); `child.css` `.sky-label` 13 px |
| "Weight and Capacity · 0 of 6 Secure" counter strip on the map | A bare count on a fantasy map: neither a game state nor a report. | `src/child/screens/Map.tsx` |
| Class 8 with no lessons (`child-b4-map__360x800`): a telescope clip-art and "Your first star appears after your first lesson." | The empty state is one object and one sentence (§3.13). | `child/copy.ts` `emptySky` |
| Garden (`child-b2-map-garden`): a seed-packet-in-soil clip-art, "Let's plant the first one today." Later, per the landing mock: plants in brick beds, a bird for "check again". | A growing-plant metaphor is a classic preschool reward picture. | `src/child/progress/Garden.tsx`; `child/copy.ts` `emptyGarden`; `public/assets/gen/garden/*` |
| Skill sheet (`child-b3-map-sheet__360x800`): a bottom sheet with a small teacher bust, a navy square, "Not started" and "This shows what you've shown so far." | Low information and no visual of the skill itself. | `Map.tsx` skill sheet |

### 3.7 Notebook, Ask, Me, Your teacher, Practice (`shots/child-b3-notebook*`, `child-b3-ask*`, `child-b3-me*`, `child-b3-teacher*`, `child-b3-practice*`, Young `child-b2-notebook*`, `child-b2-me*`)

| what | why | source |
|---|---|---|
| Notebook empty: a glossy blue notebook clip-art and "Your next lesson will add a page here." | The same empty-state template again. | `src/child/screens/Notebook.tsx`; `states/notebook-empty` |
| Ask: a "Your question" textarea, one 88 px "Type" tile and a disabled grey "Ask". At 1366, a narrow card on a painted floor. | A support form. The one way a curious 13-year-old can drive the product looks like a complaints box. | `src/child/screens/Ask.tsx`; `child.css` `.ask-*` |
| Me: a settings list of "off" pill switches. The **"Captions" label is cut to "Captior"** by its segmented control, and the theme row is cut at the bottom at 360 (`child-b3-me__360x800`). | Visible clipping is a "basic / broken" tell. The screen is pure system settings with no identity. | `src/child/screens/Me.tsx`; `child.css` `.me-row--choice .seg` |
| Your teacher: the plate bust in a white card and "Your teacher's name: Arjun / Change name" | | `src/child/screens/Teacher.tsx` |

### 3.8 The live lesson (the Desk)

Shots: `lesson-b3-01-start`, `-02-mic-ask`, `-04-question-card`, `-04-question-tiles`, `-05-feedback-wrong`,
`-05-feedback-right`, `-06-board`, `-07-module`, `-07-studio-stagecraft`, `-08-stop-checkin`, `-09-end`; class 8
`lesson-b4-*`; Young `lesson-b2-01-start`, `lesson-b2-09-end`; tier B `lesson-b3-faceB-start`, `-faceB-turn2`.

#### 3.8.1 The teacher's face (highest impact)

| what | why | source |
|---|---|---|
| **Asha** (classes 1-4; `lesson-b2-01-start__412x915`, `child-b2-home__1366x768`): a big-eyed, round-faced, Pixar-chibi girl in a peach square | Large round eyes and a big head are exactly the "made for younger children" proportions (Disney Research). She looks younger than a teacher and reads as a children's-app mascot. | `src/face-puppet/PuppetFace.tsx` (`PUPPET_TUTORS = {"asha"}`, line 87), assets `public/face-puppet/r8`; `src/face-puppet/LessonFace.tsx` |
| **Arjun** (classes 5-9; every b3/b4 shot): a flat vector man with oval glasses, a bun of hair, a rectangle neck and no shading, pasted on a painted study backdrop (`lesson-b3-01-start__1366x768`) | Clip-art avatar quality, in a different style from Asha, on a different style of backdrop. It is not a credible adult teacher, which costs trust with the parent (PW is "a face-led brand"). | `src/avatar/TutorFace.tsx` → `src/avatar/Plate2D.tsx` `DrawnPlate` (tier D); the tier B head gives the same look (`lesson-b3-faceB-start`); `shared/tutors.js` looks; backdrop `bg/stage-older` |
| She only blinks and moves her lips. There is no gesture, no gaze to the board, no pointing and no reaction to what the child did. Her knowledge states are a word in the dock ("Arjun is thinking"). | The face is designed as a status light (DESIGN rule: knowledge states, never emotions). The rule is right, but it was implemented as "show nothing". Brilliant's tutor nods and reacts to how hard the problem was. | `src/ui/teacher/Teacher.tsx`; `src/avatar/behaviour.ts` |
| Size swings: an 80 px circle with an "AI" tag at 360 in work mode (`lesson-b3-04-question-card__360x800`); a 440 px bust taking a third of the screen at 1366 (`lesson-b3-01-start__1366x768`) | At phone size she is a chat avatar. At laptop size she is a big, inert poster. | `src/child/lesson/deskLayout.ts`; `TeacherWindow.tsx` `SpeechRow` |

#### 3.8.2 Captions
- Fragments of her speech are centred in plain 18-22 px under the face: "Riya,", "main Arjun,", "Meher,"
  (`lesson-b3-07-studio-stagecraft__1366x768`, `lesson-b4-06-board__1366x768`). A comma-terminated name alone on
  screen looks like a bug.
- The phrase-level cross-fade is the only motion (150 ms).
- Sources: `src/child/lesson/Caption.tsx`, `captions.ts`; `desk.css` `.dk-caption-line`.

#### 3.8.3 The question card
- The question is a wall of bold Hinglish in a white outlined box: "Train mein 18 kg samaan teen barabar wazan wale
  boxes mein hai. Har box ka wazan grams mein kitna hai?" in 18-20 px Atkinson 600, wrapping to 6 lines at 360
  (`lesson-b3-04-question-card__360x800`).
- Numbers sit inline in body type. There is no maths typesetting, no emphasis on the quantities and no picture.
- "Your answer: pata nahi, shayad sau" is a grey pill.
- Sources: `src/child/lesson/QuestionCard.tsx`; `desk.css` `.dk-card`, `.dk-ask`.

#### 3.8.4 The work tray, desk and dock
| what | why | source |
|---|---|---|
| A large empty beige box (the tray) whenever nothing is mounted. With no mic, it holds a 3D mic-toggle clip-art and "**Ask a grown-up to turn on the microphone**" plus "Not now" (`lesson-b3-02-mic-ask__360x800`, `lesson-b3-01-start__1366x768`) | Half the phone is an empty placeholder. The message addresses a class 5-9 child as a toddler. | `src/child/lesson/WorkTray.tsx` / `AnswerDock.tsx` no-mic state; `src/ui/copy.ts` line 127 `mic.off_title` |
| The dock is a chat bar: "Type your answer" and a disabled grey-lilac "Send", topped by a state word: "Arjun is talking", "Thinking… 6 s" (a live seconds counter) | A messaging UI with a visible latency counter. The counter tells the child they are waiting for a server. | `AnswerDock.tsx`; `src/ui/copy.ts` `floor.thinking_s`; `desk.css` `.dk-dock` |
| "Your turn" is the only colour in the lesson: the marigold lamp on the dock border (`lesson-b3-09-end__360x800`) | The one accent is a warning-yellow outline on a form field. | `tokens.css` `--lamp*` (G-LAMP-1: the lamp may appear nowhere else) |
| Tiles (`lesson-b3-04-question-tiles`): three small outlined boxes ("2,050 g", "250 g", "2,500 g") with 12 px key numbers, centred in a big empty beige tray | Small targets adrift in a big box. The 12 px digits are below the 14 px floor. | `src/child/lesson/AnswerTray.tsx`; `desk.css` `.dk-tile-key` 12 px |
| Young answer menu (`lesson-b2-09-end__360x800`): "Hear it again", "Show me choices", "Show me how" as three glossy outlined pictos (ear, cards, hand) in 2 px outlined tiles | Picture-book icon style (`shots/art-pictos.png`: thick dark outline, glossy fill). | `AnswerTray.tsx` help menu; `public/assets/gen/picto/*` |
| Top bar at 360: "Converting kg an" is cut off by the CC and more buttons (`lesson-b3-01-start__360x800`) | Clipped title. | `Desk.tsx` `TopBar`; `desk.css` `.dk-short` `white-space:nowrap` with `overflow:hidden` on `.dk-title` |

#### 3.8.5 Board and diagram
- **Chalkboard** (`lesson-b3-06-board__360x800`): a flat green rectangle with "1 / + 1000" written small in the middle,
  with no frame, no texture and no build-up. The board is the only "visual" in most lessons (round 3 forge audit: the
  same chalkboard in 12/12 asks).
- **Hand font:** the whiteboard's stack is `"Segoe Print", "Chalkboard SE", "Comic Sans MS", "Comic Neue", casual`.
  On Windows that renders Comic Sans, on Apple Chalkboard SE, on Android the system `casual` face. Each one is a
  comic-handwriting font.
- **Fraction pie** (`lesson-b4-06-board__1366x768`): a hand-drawn 8-slice pie pushed left, with the right half of the
  board empty, while she says "7 shaded" and 2 are shaded. Content mismatches like this make the visuals feel
  thrown-together (also `docs/design/round3/forge/audit/README.md`: 7/12 boards contradict her line).
- Sources: `src/modules/whiteboard/palette.ts` line 24 `HAND_FONT`; `src/child/lesson/Board.tsx`;
  `src/studio/StudioStage.tsx`; `desk.css` `.dk-board`, `.dk-chalk`.

#### 3.8.6 Games and modules that appear
| what | why | source |
|---|---|---|
| "Balance the parcel" (`lesson-b3-07-studio-stagecraft__*`, `lesson-b3-05-feedback-wrong__*`): a dark navy HUD panel. The `GAME · INSTRUMENT BENCH` chip, `ROUND 1/3`, `MEASURED 0/0`, `PRECISION` are in **8-9 px Geist Mono uppercase**. The title "Balance the parcel" is in Bricolage 800 *over* the scale, and "Round 1/3" overlaps a second "ROUND 1/3". At 1366 the whole piece is greyed under a veil while she talks. | A third design language (DESIGN-V3's dark HUD) inside the cream paper app. Text sits below every floor, labels overlap, and the piece is dimmed. Round 3 judged **378/378 Studio v2 games broken** at the child's tray sizes. | `src/studio-v2/core/host.css` lines 23, 35, 40, 56 (`font: 600 clamp(7px…13px) Geist Mono`); `src/studio-v2/core/tokens.ts`; `src/studio-v2/engines/ext/instrument.ts` (`label: "Game · Instrument Bench"`); `docs/design/round3/forge/audit/README.md` §3 |
| Ruler module "Yeh kitna lamba hai?" (`lesson-b3-07-module__360x800`, `lesson-b3-05-feedback-right__412x915`): an orange rectangle over a ruler, with −1 / − / 0 / + / +1 steppers and a green "Check", **during a weight question** | A generic worksheet widget, unrelated to the question on the card. | `src/modules/frame/engines/measure.tsx` line 35 |
| "Sahi hisson ko shade karo. 7/8" (`lesson-b4-07-studio-skeleton__360x800`): an unshaded line-drawn pie and a navy "Jaanch Karo" button in a white card, while the card asks about a test percentage | Worksheet clip-art. The "game" is a form with a pie. | `src/studio/skeletons.tsx` `fraction-parts (shade_fraction)`; its words come from the piece's strings table |
| **The round 3 games are not live** (§1) | The child cannot meet the work that was built to fix this. | `docs/design/round3/play/APPLY.md` (patches not applied on prod) |

### 3.9 Feedback after an answer (motion: `motion/frames/lesson-b3-feedback-right-*.png`, `lesson-b3-feedback-wrong-*.png`, 10 frames at 100 ms; strips `motion/lesson-b3-feedback-right-strip.png`, `motion/lesson-b3-feedback-wrong-strip.png`, `motion/lesson-b4-feedback-wrong-strip.png`; in the recorded session `motion/v-after-answer-1..3-strip.png`)

| what | why | source |
|---|---|---|
| **Right answer** ("6,000 g", verdict `correct` from the server): over the next 1.0 s the frames show the chip "Your answer: 6,000 g" landing (a 240 ms rise), the dock word changing to "Arjun is thinking", the tray emptying, then an unrelated ruler module appearing. No tick was visible in that second. | By design, the tick waits for "her first voiced frame" of the reply, then draws a 22 px stroke in 280 ms with a green chip border. That is the entire payoff. There is no sound for Older (Sound effects off by default) and nothing changes in the world. | `src/child/lesson/useDesk.ts` lines 258, 288-300; `src/child/lesson/AnswerChip.tsx`; `desk.css` lines 110-121 (`dk-land`, `dk-draw`); `src/ui/sound/earcons.ts` ("nothing here is keyed to correctness") |
| **Wrong answer**: the chip lands, then a hint line appears in the card and a game mounts. By design the verdict is a magnifier glyph with no colour change. | Kind, and correctly free of shame. But with no consequence in the work (the scale does not tip, the number line does not overshoot) the answer has no weight. | `AnswerChip.tsx`; `QuestionCard.tsx` hint line |
| **After an answer the layout snaps** (`motion/v-after-answer-2-strip.png`, the class 6 session). Over about 1.4 s the chip "12" lands, the dock word goes "Got it" → "…" → "Arjun is thinking". Then in one frame her 150 px window collapses to a 36 px circle and a geoboard appears. Its task is "Aisi shape rango jiska kshetrafal = 3" (*area*) in a **perimeter** lesson. | The Face → Work geometry change is a cut, not a transition. The thing that appears after the answer is unrelated to it, so cause and effect are invisible. | `src/child/lesson/deskLayout.ts` (geometry by tray), `Desk.tsx`; `src/modules/frame/engines/geoboard.tsx` ("Aisi shape rango jiska … kshetrafal"); content mismatch also in the round 3 forge audit |
| **No verdict moment at the end**: the summary (`lesson-summary__*`) is a white page with a 136 px bust, "What you did today", "You listened to Arjun today.", "Next time: Multiplying fractions" and a navy "Finish" | An anticlimax. No artefact the child made, no "then vs now", nothing to show anyone. | `src/child/lesson/Summary.tsx`; `desk.css` `.dk-summary*` |

### 3.10 Pause and end (`shots/lesson-pause-sheet__*`, `lesson-end-confirm__*`, `lesson-b3-08-stop-checkin__*`)
- **Pause:** a white bottom sheet over a 40 % grey veil, with Continue / End lesson and "Need help? Talk to a
  grown-up" plus the two helpline buttons. The helplines are floor and stay.
- **End confirm:** "End the lesson?" with Keep going / End lesson. These are plain system dialogs.
- **The stop check-in** ("Keep going / Short break / Stop for today") arrives as three answer tiles with 12 px key
  numbers in the same empty tray. It looks like a quiz question.
- Sources: `src/child/lesson/sheets/Pause.tsx`, `EndConfirm.tsx`; `desk.css` `.dk-veil`, `.dk-sheet`.

### 3.11 Parent corner (`shots/parent-0-gate*`, `parent-1-home*`, `parent-2-progress*`, `parent-3-lessons*`, `parent-4-lesson-card*`, `parent-5-controls*`, `parent-6-notes*`, `parent-7-more*`, `parent-8-children*`, `parent-9-help*`)

| what | why | source |
|---|---|---|
| Gate: "Grown-ups only / Enter your parent PIN" in Literata with a full-width PIN pad | Fine as a lock. The "Grown-ups" wording is shared with the child surfaces. | `src/parent/Gate.tsx` |
| Home (`parent-1-home__1366x768`): a 240 px left rail, a decorative strip of painted wall with a potted plant (`bg/parent-header`), then white cards ("This week", "Try at home · 5 minutes", "Next lesson"). The claim "Riya can now convert mixed units (2 kg 50 g = 2050 g)" is in Literata 20 px with an outlined "Got it" chip. | It reads as a settings dashboard. The header art is decoration. There is no picture of the child's work, no voice clip, no chart and no teacher. The most valuable content (evidence) is one level down behind "How do we know?". | `src/parent/Home.tsx`; `src/parent/Shell.tsx`; `src/parent/parent.css` |
| Progress (`parent-2-progress-full__360x800`): "Class 5 · Chapters started: 1 · Secure: 0 of 74", then a long list of chapters and skills, each with a dashed "Not started" pill | An admin checklist. 74 dashed pills is what "not started" looks like at scale. | `src/parent/Progress.tsx`; `StateChip` in `src/ui/Chip.tsx` |
| Lessons and lesson card (`parent-3-lessons`, `parent-4-lesson-card`): text rows. A card that says "This lesson didn't finish", "No answers were checked in this lesson", "No checks were recorded in this lesson" | Three empty statements in three boxes. The honest negative states are shown as the main content. | `src/parent/Lessons.tsx` |
| Controls (`parent-5-controls`): four duration tiles and **native `<input type=time>`** fields ("12:00 AM") | Browser-default pickers. DESIGN-V3 R11 had already flagged native pickers. | `src/parent/Controls.tsx`; `src/onboarding/Setup.tsx` `HoursFields` |
| Type: 6-7 sizes between 13 and 22 px (13, 14, 15, 16, 17, 20, 22), with Literata for claims | Many near-identical sizes make a muddy hierarchy. Serif sentences next to small grey caps read like a bank statement. | `parent.css` `.pa-h1`, `.pa-h2`, `.pa-meta`, `.pa-effect` |

### 3.12 Motion, transitions, loading and sound (`motion/`)
- **Teacher speaking.**
  - Frames: `motion/frames/v-teacher-speaking-*.png` (20 frames at 100 ms, 412×915, class 6) and
    `lesson-b3-teacher-speaking-*.png` (14 frames, 360×800). Strips: `motion/v-teacher-speaking-strip.png`,
    `lesson-b3-…`, `lesson-b2-…` (Asha) and `lesson-b4-…-strip.png`.
  - In the 412 burst the frame-to-frame pixel diff is **empty in 12 of 19 pairs**. The face holds still for about
    1.1 s at a time.
  - What does change: the caption "Namaste Riya," appears, the mouth opens a few px (teeth visible in a few frames), and
    the eyes blink once.
  - Head, gaze, shoulders and hands never move. At 360 in work mode her face is an 80 px circle and lip motion does
    not read at all (`lesson-b3-04-question-card__360x800`).
- **Transitions.**
  - **Home → map** (`motion/v-transition-home-to-map-strip.png`, `motion/transition-home-to-map-strip.png`, 60-80 ms
    frames): a hard cut to an empty navy panel. The sky painting fades in over about 200 ms, then every star and
    label pops in at once.
  - **Map → home** (`motion/v-transition-map-to-home-strip.png`): the same cut.
  - **Home → lesson** (`motion/v-transition-home-to-lesson-strip.png`, 80 ms frames): Home stays frozen for about
    400 ms after the tap. Then a cut to the Desk with the face and an empty white card reading "Getting the lesson
    ready" for over a second (all 11 later frames). There is no "lights down" or entry moment, and the loading state
    is a sentence in a box.
  - Route chunks load with `Suspense fallback={null}` (`src/child/routes.tsx`) or a spinner (`src/app/Shell.tsx`
    `Loading`). The only element motion is an 8 px, 160-240 ms rise (`base.css` `tx-enter`).
- **Motion tokens** (`tokens.css` lines 90-95): "settle, never bounce; transform + opacity only".
  - Durations are 90-300 ms, plus `--m-seal` 1500 ms for a milestone that never occurred in these runs.
  - The design deliberately removed weight, anticipation and follow-through. That is what makes it feel inert,
    not calm.
- **Sound:**
  - Earcons are synthesised sines (`src/ui/sound/earcons.ts`: E5→A5 "turn", a 1600 Hz "received" tick, A4→F4
    "system").
  - They are identical for every answer and off by default for Older ("Sound effects: off", `child-b3-me`).
  - The only produced audio is her voice. A silent, beeping product reads as basic.
- **Full session video:** `motion/lesson-session-412x915.webm` (about 50 s, 412×915, a fresh class 6 account).
  Home → map → home, Start, the lesson opening with the teacher speaking, three typed turns (one brings in the
  geoboard), then Pause → End → the summary. Recorded with Playwright `recordVideo` through the routed client. The
  account was deleted afterwards.

### 3.13 Empty states and loading
- **Every empty state is one glossy object, one sentence and a button:**
  - notebook (`child-b3-notebook`, `child-b2-notebook`);
  - garden (`child-b2-map-garden`);
  - sky (`child-b4-map`);
  - the home "loading" card, a grey square and a grey bar.
- Nothing teaches, previews or invites.
- Sources: `src/child/art.tsx` `Spot` with `states/*`; `Home.tsx` `hpc--loading`.

---

## 4. Measured facts (this run, n = 1 page state per row, 360×800 unless noted)

| screen | distinct text sizes (px) | families | smallest text | light-neutral pixels* |
|---|---|---|---|---|
| landing | 13, 14, 16, 17, 18, 22, 26, 28 | Literata, Atkinson | 13 px "AI teacher" | 66 % |
| signup class | 13, 16, 17, 20, 24 | Atkinson | 13 px "Step" | 87 % |
| child home b3 | 13, 14, 16, 24 | Atkinson, Literata | 13 px tab labels | 55 % |
| child home b2 (Young) | 16, 18, 24 | Atkinson | 16 px | 35 % (courtyard art) |
| Me b3 | 13, 14, 17, 24 | Atkinson, Literata | 13 px | 90 % |
| notebook empty b3 | 13, 16, 24 | Atkinson, Literata | 13 px | 88 % |
| lesson: question card b3 | 14, 16, 17, 18, 20 | Atkinson, Mukta | 14 px | 56 % |
| lesson: tiles b3 | 12, 14, 16, 17, 18 | Atkinson, Mukta | **12 px tile keys** | 91 % |
| lesson: game up b3 | 8, 9, 11, 13, 14, 16, 17, 18 | Atkinson, Mukta, **Geist Mono, Bricolage** | **8 px "Game · Instrument Bench"** | 67 % |
| lesson b2 (Young) | 16, 18, 22 | Atkinson, Mukta | 16 px | 54 % |
| parent home | 13, 14, 15, 16, 17, 20, 32 | Atkinson, Literata | 13 px | (not measured) |

\* The share of downscaled pixels with HSV saturation < 0.12 and value > 0.85 (cream, white, light grey). Method:
PIL over the PNG, resized to 180×400. All type facts are in `capture-log.json`.

Two readings follow:
- **The lesson has no type hierarchy.** Its whole range is 14-18 px (a ratio of 1.29), and the question, captions,
  dock and buttons all sit inside it.
- **The only screen with more than one display face is the game.** That face arrives at 8-9 px, from a different
  design system.

---

## 5. The top 10 causes, ranked by impact

Impact means how much of the "childish and basic" reading each cause carries. It is judged on how many screens it
touches, how early it is seen (first 50 ms, first session), and whether it is seen by the parent, the child, or both.

1. **The teacher is a sticker.** Asha's chibi puppet and Arjun's flat vector plate are two unrelated styles. Neither
   is credible as an adult teacher, and neither does anything a teacher does: look at the board, point, nod, react.
   She is on every screen, the parent meets her first, and Indian edtech trust is face-led.
   Files: `src/face-puppet/PuppetFace.tsx`, `src/avatar/Plate2D.tsx`, `src/avatar/TutorFace.tsx`, `shared/tutors.js`.
2. **The shipped design is the ages 6-9 design.**
   - The live identity is V2's "Lamp and Paper, painted world": `docs/design/PRODUCT-DESIGN-V2.md` §7, `§12`, and
     `docs/design/directions/child-first-wonder.md` §0 "Taxila is a place… a well-made Indian picture book".
   - The 9-15 reset (`DESIGN-V3.md`) is unshipped. `src/ui-v3/flag.ts` defaults off, and no file outside `src/ui-v3/`
     reads it.
   - `bandForClass(4) = "b2"` gives class 4 the Young family.
   - Bands b3 and b4 differ only in type size.
3. **Baby-animal avatars and glossy clip-art.** The 24 avatars (cubs, calves, a kitten in a basket in the topics) and
   about 150 AI-rendered glossy objects with dark outlines are on every child screen.
   Files: `src/child/pictos.tsx` `AVATARS`, `public/assets/gen/**`; see `shots/art-*.png`.
4. **Copy that talks down.** "Grown-ups", "Ask a grown-up to…", "Your grown-up chose these", "Pick your picture",
   "That's me", "I'm a computer teacher", "Let's plant the first one today". It is shared by every band.
   Files: `src/child/copy.ts`, `src/ui/copy.ts`, `src/avatar/picker/copy.ts`.
5. **An accessibility font used as the brand, and no type scale.** Atkinson Hyperlegible Next for everything, Literata
   for some titles, 14-18 px in the lesson, no numeral or maths treatment, and 6-8 near-identical sizes elsewhere.
   Files: `src/styles/tokens.css` (families, `--t-*`), `src/child/child.css` lines 22-33,
   `src/child/lesson/desk.css`.
6. **No payoff loop.** The verdict is a 22 px tick that waits for audio. Wrong is a magnifier. Older has no sound,
   nothing in the work responds, the summary is empty, and "never a score" was read as "never a moment".
   Files: `useDesk.ts`, `AnswerChip.tsx`, `Summary.tsx`, `earcons.ts`.
7. **The lesson is a chat form.** An empty beige tray, a dock with a disabled Send, a "Thinking… n s" counter, and
   "Ask a grown-up to turn on the microphone" taking half a phone.
   Files: `Desk.tsx`, `WorkTray.tsx`, `AnswerDock.tsx`, `deskLayout.ts`.
8. **Three design systems inside one lesson.** The paper Desk, the dark Studio v2 HUD (8-9 px mono, overlapping
   titles, 378/378 judged broken in round 3), worksheet skeletons and modules (a ruler for weight), and a Comic-Sans
   chalkboard.
   Files: `src/studio-v2/core/host.css`, `src/studio/skeletons.tsx`, `src/modules/frame/engines/*`,
   `src/modules/whiteboard/palette.ts`.
9. **Generic surfaces and phone-only composition.**
   - Most screens are 54-91 % cream, white and grey, with one navy.
   - Every surface is a white card with a 1-2 px `#868A94` outline and a 16-24 px radius.
   - The painted backdrops are wallpaper behind the cards.
   - At 1366 the phone column floats in empty space (Who, Hello, onboarding, summary).
   Files: `tokens.css` (`--paper`, `--surface`, `--line`, radii), `src/styles/ui.css` `.tile`, `child.css` `.cs-card`.
10. **Placeholder-grade progress and empty states.** A Sky map of identical grey dots, a garden of plants, and
    one-object empty states.
    Files: `SkyMap.tsx`, `StateShape.tsx`, `Garden.tsx`, `art.tsx` `Spot`.

Below the top 10, still visible:
- clipped labels ("Captior", "Converting kg an");
- focus rings on headings;
- native time pickers;
- a landing page made of disclaimers that sells "classes 1 to 9".

---

## 6. What must change system-wide (not per screen)

These are requirements for whatever direction the owner picks, not a direction.

1. **One art direction with one owner.** Pick one rendering language for the teacher, the world, icons, diagrams and
   games, and write it down as rules a generator and a coder can both follow. Remove the leftovers:
   - the AI-glossy clip-art set (`public/assets/gen/{picto,states,subjects,topics,avatars,interests,home}`);
   - the code-drawn plate as a visible face;
   - the dark HUD as a separate system;
   - the comic hand-font stack.
   Today each workstream brought its own style, and nothing forced them to agree.
2. **A teacher who is credible and does teacher things.**
   - One quality bar for both teachers: an adult, aspirational and in the same style.
   - Give her non-emotional *teaching* behaviour: gaze to the work, a point or mark on the board, a nod when an answer
     lands, writing or building on the board.
   - Size her by role, not by geometry: present when talking, small and docked when the work is up.
   - The floor (knowledge states, never emotions, never a companion) holds. "Shows nothing" was never required.
3. **Age up the whole product to 9-15 and delete the 6-9 product from the child path.**
   - One family for classes 4-9: no Young courtyard, garden, picture tiles or 64 px pills for class 4.
   - Retire the bands' look differences. Keep only readability (≥ 16 px for classes 4-5, ≥ 14 px elsewhere).
   - Landing and onboarding say classes 4-9.
   - The V3 work is the starting evidence. It was written for exactly this and never shipped.
4. **A copy register for a capable 9-15 year old.**
   - No "grown-up", "pick your picture", "that's me" or "computer teacher".
   - The AI disclosure stays, worded for this age.
   - Copy shapes and dry wit, per DESIGN-V3 §0.7. This is chrome, not prompt text.
   - Keep the helplines and "talk to an adult you trust" lines, in respectful words.
5. **A real type system.**
   - A display face with a voice, a UI face, a numeric or maths treatment for every quantity and expression, and a
     scale with clear steps.
   - Atkinson can stay as the reading face if measured best, but it is not the brand.
   - Every stage label at or above the 14 px floor in real pixels at 360, including games.
6. **A payoff grammar for answers, without slot-machine psychology.**
   - The work responds to the answer: the scale tips, the line overshoots, the strip snaps.
   - The teacher reacts as a teacher (a nod, a mark on the board).
   - One sound family with real craft, on for every band, with a visible twin and respecting silent mode.
   - A visible change in the map tied to the ledger.
   - Same response for every correct answer of a kind, never variable-ratio, never a streak, never a count against a
     target (NEVER MANIPULATE).
   - The verdict must not wait on audio playback to appear.
7. **The lesson as a stage, not a form.**
   - The work area is the hero. An empty tray is never shown.
   - The no-mic and thinking states are designed moments, not placeholders and counters.
   - The dock is an instrument, not a chat bar.
   - Games render inside the same system and the same tokens as the Desk, or they do not ship (round 3 RUBRIC).
8. **Motion with weight, on a budget.**
   - Real transitions between places, an entry into the lesson, and anticipation and follow-through on the answer
     moment.
   - Tokens for spring and overshoot where meaning needs it. Keep transform and opacity on low-end phones, and
     `prefers-reduced-motion` stays honoured.
   - "Settle, never bounce" is retired as a blanket rule.
9. **Surfaces and colour with intent.**
   - Replace "white outlined card on cream" as the default container.
   - Give the accent a job beyond the dock outline, and pick a ground that reads premium to Indian parents (§2.3).
   - Compose 1366 as its own layout, not a centred phone.
   - Keep AA contrast measured.
10. **Progress, empty and parent surfaces that show real things.**
    - The map shows the child's actual work and where they are going, not a grid of identical dots.
    - Empty states preview what will be there.
    - The parent corner leads with evidence: the child's own words, a board they built, then and now. It has no
      decorative headers and no checklist of 74 "Not started" pills.
11. **Ship what was built.** The round 3 games and the V3 screens exist and are not reachable on taxila.dev. Any
    redesign that is not wired to the router and deployed changes nothing the owner sees.

**What must not change:**
- the AI disclosure;
- Childline 1098 and Tele-MANAS 14416;
- the teacher's non-companion register;
- no streaks, no FOMO, no loot or variable rewards;
- tap targets ≥ 44 px;
- readable Devanagari;
- AA contrast;
- reduced motion.

Each of these can be met in a premium, older design. None of them caused the childish look. The design reading them
as aesthetic rules did ("no lamp outside the dock" became "no colour"; "settle" became "no motion").

---

## 7. Files in this folder

- `AUDIT.md`: this file.
- `shots/<screen>__<w>x<h>.png`: every state at 360×800, 412×915 and 1366×768 (`-full` = full page).
  - `art-avatars.png`, `art-pictos.png`, `art-states-subjects.png`, `art-topics.png`, `art-backgrounds.png`: contact
    sheets of the shipped generated art (`public/assets/art/**`).
- `motion/`:
  - `frames/`: bursts. `v-*` are from the recorded class 6 session (transitions, teacher speaking, after each answer,
    summary). `lesson-b3-*` and `transition-home-to-map-*` are from the main walk.
  - `*-strip.png`: each burst as one image (Asha's speaking strip is `lesson-b2-teacher-speaking-strip.png`).
  - `lesson-session-412x915.webm`: the recorded session.
- `capture-log.json`: per shot and size, the URL, overflow, font sizes, families, weights and smallest text.
- Harness scripts. Run any of them with `NODE_USE_ENV_PROXY=1 TAXILA_BASE=https://taxila.dev AUDIT_OUT=<dir>/ node
  <file>`. All use `tests/prod/lib.mjs` `withTestAccount` and delete the account, and the log of every run in this
  audit ends "cleanup: account deleted".
  - `harness/capture.mjs`: the main walk.
  - `harness/capture-supplement.mjs`: `?face=B`, Pause → End → summary.
  - `harness/capture-motion.mjs`: the recorded session.
