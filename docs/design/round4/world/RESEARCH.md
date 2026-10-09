# Round 4 · world · RESEARCH: what "game-native" means for Taxila, and what we take

**Direction:** Prakash, a game-native world. **Key:** `world`. **Date:** 2026-10-09.
**Method:** a short desk review (sources linked inline). It is evidence about the references and about Indian children's
media habits. **Nothing here has been tested with a Taxila child.** The experiments that would test it are listed at
the end.

---

## 1. The references, and exactly what each one gives us

| reference | what makes it premium (not childish) | what Prakash takes | what Prakash refuses |
|---|---|---|---|
| **Monument Valley** (ustwo, 2014) | Ken Wong's isometric "little worlds": microcosms in empty space, designed so that "each frame would be worthy of public display". Flat-shaded volumes in three tones, distinct silhouettes. Wong names Indian and Islamic architecture among the sources. ([Creative Bloq](https://www.creativebloq.com/computer-arts/making-monument-valley-71412213), [Unity case study](https://activation.unity3d.com/case-study/monument-valley), [Kill Screen](https://killscreen.com/how-m-c-eschers-little-worlds-inspired-gorgeous-upcoming-monument-valley)) | The **world map**: each chapter is a stone mesa standing in mist, built from three-tone isometric volumes (`map.js` `box()`, top / moonlit face / shadow face). Every place is a composed "print". | Impossible geometry as decoration. A map must be literal: routes only on real prerequisites. |
| **Alto's Odyssey** (Snowman, 2018) | Harry Nesbitt's layered silhouettes with atmospheric perspective; minimalism that "leaves room" for the player; a world that implies more than it shows. ([Game Developer, Road to the IGF](https://www.gamedeveloper.com/business/road-to-the-igf-team-alto-s-i-alto-s-odyssey-i-)) | **Every scene is 4 to 6 silhouette layers** that fade toward the sky colour with distance (gate, terrace, pavilion, yard). Pointer parallax by depth. One hour of light per place. | Endless ambient loops. Here ambience moves only when the child moves (pointer, camera arrival). |
| **Sky: Children of the Light** (thatgamecompany) | Light as both the visual and the thematic spine: the GDC art talk is literally about using light "visually and thematically" for emotional environments; restoring stars to constellations is progression. ([GDC Vault](https://gdcvault.com/play/1026903/Art-of-Sky-Children-of), [80.lv](https://80.lv/articles/interview-a-deep-dive-into-the-art-of-sky-children-of-the-light-with-thatgamecompany)) | **Light is the only reward.** A pavilion gains a lamp when an idea is understood and keeps it for good when it is secure. Cross-chapter prerequisites appear as threads of light when you open a chapter. | Candles as a social currency (gifting). Taxila has no currency of any kind. |
| **Gris** (Nomada, 2018) | Progress restores colour to a drained world; nothing is counted. ([Wikipedia](https://en.wikipedia.org/wiki/Gris), [Gamereactor review](https://www.gamereactor.eu/gris-review/)) | Mastery changes the **world**, never a number: the night valley gains warm light pavilion by pavilion. | Gris's restoration is tied to completion; ours is tied to the learner ledger and can never be "finished" early by grinding. |
| **Hades** (Supergiant, 2020) | Interface treated as craft: Hades won both UI Art and UI/UX at the 2021 IGDA Global Industry Game Awards; dialogue is a large character portrait over a framed text box with a name plate. ([VGC](https://www.videogameschronicle.com/news/hades-wins-9-times-at-the-igda-global-industry-game-awards/), [Jen Zee](https://en.wikipedia.org/wiki/Jen_Zee)) | The **lesson dialogue**: Asha's portrait rises out of the top edge of a framed caption panel; a name plate; captions are phrase-level. Chamfered frames with a brass hairline on every panel. | Ornament for its own sake; combat-HUD density. |
| **Genshin Impact** (HoYoverse) | Polished open-world chrome: region-name reveals as you enter a place, fog-free legible map, consistent iconography. | The **place-name banner** on every screen entry ("Chapter 5 · Prime Time — The Pavilion"), letter-spaced Eczar between two brass rules. | Gacha, daily commissions, resin timers: every one of them is a dark pattern this product bans. |
| **Raji: An Ancient Epic** (Nodding Heads, Pune) | Proof that an Indian studio can render Indian places with sophistication: Rajasthan's medieval architecture with Pahari-miniature-informed art. ([80.lv](https://80.lv/articles/raji-building-a-game-about-indian-myths/)) | Indian architecture as the world's grammar: ogee arches, chhatris, shikharas, jaali, stepwells, bamboo scaffolding. | Mythic register and combat. |
| **Antariksha Sanchar** (Quicksand GamesLab) | "Indofuturism": a point-and-click puzzle set in Ramanujan's dreamworld, a South Indian temple town in 3D, with a Carnatic soundtrack. ([Homegrown](https://homegrown.co.in/homegrown-explore/antariksha-sanchar-is-a-trans-media-gaming-project-exploring-south-indian-narratives-culture), [Kill Screen](https://www.killscreen.com/enormous-beautiful-indian-transmedia-project-comes-games/)) | Mathematics and Indian place belong together without kitsch. The stone yard (the game) and the pavilion (the lesson) are real places, not abstract panels. | Mysticism. Maths here is law, never magic. |

**Type, motion, layout, colour, sound, per reference (the summary the build follows).**
- *Type:* display serif for places and titles (Hades and Genshin title cards), a hyperlegible sans for everything read
  quickly. Prakash uses **Eczar** (Rosetta, designed for Latin and Devanagari together) and **Mukta** (Ek Type, both
  scripts), both from Google Fonts.
- *Motion:* camera moves between places (Alto, Monument Valley), not page slides; weight on the child's own act (Hades:
  anticipation, hit-stop, recoil); UI chrome that settles rather than bounces.
- *Layout:* full-bleed scene with the interface floating as framed panels (a game's main menu); one primary call to
  action per screen.
- *Colour:* one light source per scene, coloured shadows (violet, never black), atmospheric perspective, one hot accent
  (lamp gold) that means "your move" and "understood".
- *Sound readiness:* every act has a synthesised sound in `Sfx` (stone crack, wood tock, bell chime, a four-note
  close), only ever after the child's own tap, with a mute toggle. Designed so a sound designer can swap samples in later.

---

## 2. What Indian 9-15-year-olds read as "for little kids" and as "for me"

| evidence | what it says | what Prakash does |
|---|---|---|
| Ormax Brand Trust Survey 2021, urban kids, 10 cities ([Ormax](https://www.ormaxmedia.com/data/library/In-digital-we-trust-urban-indian-kids-OrmaxMedia.pdf)) | The 5 most trusted media brands are all digital: YouTube, Ludo King, WhatsApp, Subway Surfers, Garena Free Fire. 85% played a mobile game in the last week. Among **older kids (10-14) only one TV brand makes the top 10**: the cartoon channels they grew up with fall away. | The reference class for a 12-year-old is the mobile game, not the kids' cartoon. Prakash borrows the visual literacy of games they already respect. |
| Lumikai State of India Gaming FY24 ([Lumikai](https://www.lumikai.com/post/indian-gaming-market-to-reach-9-2-bn-by-fy29)) | Mid-core games drive in-app spending growth (41% YoY); 66% of gamers are outside metros. (No teen split is published.) | Premium game polish is a mass-market Indian expectation, not a metro niche, so it has to run on a Rs 10k phone (see SPEC §7). |
| NN/g *Teenager's UX* (cited in `docs/design/reset/DESIGN-V3.md` F1-F4) | Teens reject condescending tone and pointless multimedia; tweens reject primary colours, exaggerated animation and "playful UI", often permanently. | No mascots, no bounce on chrome, no primary blocks. Motion only where it means something. |
| Yeager, Dahl & Dweck 2018 (DESIGN-V3 F5) | Adolescents respond to status and respect; condescension backfires. | Copy is short and adult. The child is a builder of a real place, not a sticker collector. |
| "Alpha Rising" via a secondary write-up ([okoone](https://www.okoone.com/spark/marketing-growth/what-gen-alphas-5-46-trillion-impact-really-means-for-your-business/)) | 39% of Gen Alpha respondents call age-targeted products "too childish". **Weak source**: secondary, method not seen. | Treated as a direction, not a number. |

**The lint this direction applies** (the "little kids" column is what today's Taxila shows):

| reads as "for little kids" (today) | reads as "for me" (Prakash) |
|---|---|
| giant rounded white cards on cream; a tiger avatar; clip-art kettle, watering can and slate as tiles (`docs/design/round2/review-shots/c4-voice-and-next-day/22-c4-day2-home.png`) | a lit place at dusk; chamfered glass panels with a brass hairline; the topic shown as a real skill graph |
| a face as a giant sticker filling half the screen | the teacher inside a lamplit arched window, lit by the scene's own light, sized like a game portrait |
| games as forms: a numeric keypad, "Wapas", "Ho gaya" buttons in a grid (`docs/design/round3/play/shots/all/atoms-p360-raat.jpg`) | sandstone blocks you crack with a chisel; dust, a hit-stop, a bell when a prime crystallises |
| a "map" that is a flowchart of four rounded boxes on beige (`docs/design/round3/play/shots/world-map-p360-kagaz.png`) | a valley of mesas at night where understanding is the only warm light |
| a postage-stamp board in a dark box under a pinned card (`docs/design/round3/forge/audit/before/game/01-ask-p360.png`) | the board is the biggest surface in the pavilion; it draws at the moment she names each step |

---

## 3. What in the current design Prakash rejects, and why

1. **Cream paper plus white rounded cards everywhere** (`calm-mastery.md` §5, "the Desk"). Calm, but it is a form, and
   forms read as homework. Rejected for children's screens. *Kept* for the parent corner, where a quiet editorial page is
   the premium register.
2. **Near-black instrument UI with lime "volt"** (`DESIGN-V3.md` §3.1). Grown-up, but cold and generic (every fintech
   app); it has no place in it, so nothing can grow. Rejected in favour of a dusk palette that carries warmth and
   depth. The one-accent law is kept: lamp gold replaces volt.
3. **Illustration as stock objects** (the kettle, watering can and slate tiles; `child-first-wonder.md`'s painted
   animals). Rejected: every image in Prakash is a place drawn in one consistent light model, with no text in images.
4. **Games inside a box in the corner of a card** (round-3 forge audit, 181 × 113 px engines). Rejected: the game owns the
   screen; the board owns the pavilion.
5. **Four unrelated art directions for games** (kagaz, chalk, blueprint, raat; `docs/design/round3/play/DESIGN.md` §0.6).
   Rejected as "particular style only" in reverse: four looks that don't belong to one world. In Prakash the families
   adopt **one** world's materials (sandstone, brass, chalk-light on slate), each family a different *place* in it (SPEC §6).
6. **Mastery as a flowchart** (round-3 world map). Rejected for a world where the ledger state is architecture. The
   round-3 *rules* are kept exactly: pencil and ink (here: lit scaffold and carved stone), no decay, no counters,
   routes only on real edges.

---

## 4. Risks, and the tests that would settle them

| risk | test |
|---|---|
| A dusk world reads as moody or sleepy to a 9-year-old | five-second test with 20 class 4-5 and 20 class 7-8 children: "Who is this app for?" against today's screens and two other round-4 directions |
| "Light as the only reward" still works like a reward loop | the six motivation tests (PRODUCT-DESIGN §8.1) on the map: does the child grind easy topics to light pavilions? Log topic choices for a week |
| The face (owner directive style C) is the most childish element on screen | side-by-side with the same face at two framings (sticker vs lit window), owner and a 12-year-old panel |
| SVG scenes cost too much on a Mali-G52 phone | device-lab run of this prototype: frame time while panning the map and while the game's particles run (SPEC §7 budget) |
