# Round 4 · kinetic · RESEARCH: "Taal", the bold Indian premium direction

**Date:** 2026-10-09 · **Angle given:** bold Indian premium (CRED, Spotify Wrapped, Nike Training Club, Zomato and
Swiggy campaigns, Apple's India work) · **Prototype:** `index.html` · **System:** `SPEC.md` · **Proof:** `shots/`

Taal means rhythm. The direction treats Taxila like a music or sports app: every screen is a poster on its own deep
colour field, the teacher's words are the hero type, and the only things that move with force are the child's own
actions. Devanagari and Latin are set at the same size and weight everywhere they appear together.

Nothing in this document has been tested with a child. The claims about what 9-15 year olds read as "for me" come from
published research and product teardowns, and the India-specific evidence is thin (section 2 says where).

---

## 1. References, and exactly what Taal takes from each

| reference | what it is | what Taal takes | what Taal does not take |
|---|---|---|---|
| **CRED NeoPOP** ([CRED-CLUB/neopop-web](https://github.com/CRED-CLUB/neopop-web), [pub.dev neopop](https://pub.dev/packages/neopop), [AIM on the open-sourcing](https://analyticsindiamag.com/cred-open-sources-its-ui-design-system-neopop/)) | CRED's open design system. Its button is built from 5 surfaces (top, left, right, bottom, centre), so it reads as a physical slab. | **Elevation by hard extrusion, never by blur.** The `.slab` button has a face and two skewed edge faces; pressing it moves the face into the edge in 90 ms. Every primary action, every divisor key in the game and the teacher cards use it. It is the single strongest "this is not a school app" signal for Indian teens and parents, and it costs no blur filter on a Rs 10k phone. | CRED's black-and-gold luxury register and its finance density. Taxila's grounds are coloured, not black. |
| **Spotify Wrapped 2024** ([Spotify newsroom](https://newsroom.spotify.com/tag/spotify-wrapped), [D&AD 2024 entry](https://dandad.org/awards/professional/2024/238334/wrapped-design), [Fonts In Use: Spotify Mix](https://fontsinuse.com/uses/63891/spotify-2024-redesign)) | Story screens on saturated colour fields, "vibrant colour pairings" and "lively animations"; Spotify Mix is a variable font with a wide width and weight range made for type in motion. | **Each screen is its own colour field** (jamun, kajal, neel, mor, paper). **Type in motion on a width axis**: Taal's display face has a 75-125 % width axis and the motion system animates it (titles land wide; the word the teacher stresses widens as she says it). **Big numbers as heroes**: "360" on the home ticket, "84" in the game, "Prime Time" on the map. Synced-lyrics captions are the model for her live captions. | Wrapped's data-as-confetti energy, rankings and "top %" comparisons. There are no percentiles or ranks anywhere. |
| **Nike Training Club / Nike Run Club** ([Adobe "Designs We Love"](https://blog.adobe.com/en/publish/2017/04/18/uxperts-weigh-in-designs-we-love-april-edition), [MediaPost on AKQA's NTC rebuild](https://www.mediapost.com/publications/article/146083), [COLLINS: Nike Run Club](https://wearecollins.com/case-studies/nike-run-club)) | Large terse type, glanceable workout facts, expressive type for each run type. | **Condensed uppercase labels** (Anek at 75-80 % width, +0.1 em tracking) for eyebrows, state readouts ("SPEAKING", "YOUR MOVE") and door names ("GARAM", "TEEKHA"). **Terse copy**: "Your move", "Ho gaya", "Break it by". | The trophy and achievement layer, which [a Pratt critique](https://ixd.prattsi.org/2023/09/design-critique-nike-training-club-iphone-app/) calls featuritis and which Taxila's rules ban anyway. |
| **Apple BKC and Saket store barricades** ([9to5Mac](https://9to5mac.com/2023/04/04/apple-barricade-first-store-india/), [iMore](https://www.imore.com/apple/apples-first-ever-india-store-unveiled-in-mumbai-and-its-colorful)) | Apple redrew Mumbai's kaali-peeli taxi decals in bright colours with a "Hello Mumbai" greeting; Saket used Delhi's gates. | **Local visual culture rendered with global finish.** The first screen is a bilingual greeting poster ("Namaste, / नमस्ते, / Kabir."). The palette names and pairs are Indian (genda marigold with rani pink is the classic garland-and-gulaal pairing; mor is peacock teal) but each is used flat, large and sparingly. | Literal motifs (taxis, rangoli, truck art). Folk-art packs need paid commissions from those communities (round-3 play rule), and a motif costs a child nothing to understand. |
| **Zomato copy** ([afaqs: "Is Zomato a copywriter's new copy chief?"](https://www.afaqs.com/news/advertising/is-zomato-a-copywriters-new-copy-chief), [Social Samosa on push notifications](https://www.socialsamosa.com/2022/11/new-age-brands-redefined-age-old-push-notifications)) | Hinglish, present-tense, witty copy that writes the way people talk. | **The teacher speaks the family's real register** (Roman Hinglish by default, Devanagari Hindi and English one tap away), and **chips use the words a child would say** ("Phir se dikhao", "Dheere bolo", "English mein"). | Zomato's notification tactics (timing to convert, nudges). Taxila sends no engagement nudges. |
| **Swiggy brand book** ([Swiggy brandbook, typography and colour](https://www.swiggy.com/corporate/wp-content/uploads/2026/07/swiggy-brandbook.pdf)) | One confident orange (#FF5200) and one geometric family (Gilroy) across every surface. | **Few colours, used with total conviction.** Two character colours (marigold for the teacher, rani for the child) do all the semantic work; everything else is ground or ink. | Orange itself, and Gilroy (not on Google Fonts). |
| **Anek, by Ek Type** ([Google Design: Anek](https://design.google/library/anek-multiscript), [EkType/Anek](https://github.com/EkType/Anek)) | One variable family for 9 Indian scripts plus Latin, designed all at once "rather than starting from Latin", width axis condensed to expanded. Verified on the Google Fonts CSS API today: `wdth 75..125`, `wght 100..800`, Latin included. | **The only UI and display face.** It is the literal answer to "Devanagari and Latin treated as equals": the two scripts were designed together, share weight and colour, and both stretch on the same axis, so a Hindi title can land with the same kinetic move as an English one. | — |
| **Eczar, by Vaibhav Singh / Rosetta** ([Google Fonts](https://fonts.google.com/specimen/Eczar/about), [rosettatype/eczar](https://github.com/rosettatype/eczar)) | A Latin + Devanagari serif whose personality grows with weight; made for headlines. | **The parent's voice.** Parent headlines and the child's quoted words are Eczar, so the parent corner reads like a well-edited statement, not a dashboard. | Eczar on child screens (a serif reads "storybook" there; DESIGN-V3 dropped Literata for the same reason). |
| **Kao et al., CHI 2024, "How does juicy game feedback motivate?"** ([Imperial repository](https://spiral.imperial.ac.uk/entities/publication/253c32f5-d124-4a23-88b5-9aaaf114608d)) | Pre-registered, n = 1,699: success-dependent feedback raised every motive; amplified feedback reduced them, probably by impeding agency. | **Juice is proportional to the child's act and the law's answer.** A split cracks, squashes and rings; a refused divisor shakes and shows the remainder; both take the same time. No feedback fires that the child did not cause. | Amplification for its own sake (confetti, screen-filling bursts, idle loops). |

**Sound-readiness.** Spotify and NTC both treat sound as identity. Taal's game ships a synthesised palette (Web Audio,
no files): a low "thock" for a split, a rising pentatonic chime per atom so a finished tree plays a short scale, two soft
equal-length low notes for a refused divisor (never a buzzer), and a four-note chord when the tree multiplies back.
Nothing plays under the teacher's voice, and the game has a mute button.

---

## 2. What Indian 9-15 year olds read as "for little kids" versus "for me"

| finding | source | what Taal does |
|---|---|---|
| Children judge age-appropriateness instantly and harshly; a child in NN/g's early study called a site "for babies, maybe four or five years old. You can tell because of the cartoons and trains." | NN/g children's usability study, via [InfoWorld](https://www.infoworld.com/article/2225267/many-web-sites-aren-t-designed-well-for-kids.html) (secondary coverage; small 2002 sample) | No cartoon proportions, mascots, bubbly type or primary-colour blocks anywhere. The teacher is drawn with adult proportions (section 3). |
| Teens reject condescending or babyish tone, dense text and pointless multimedia; tweens reject primary colours, exaggerated animation and playful UI, and admire grown-up apps with clean lines, dark surfaces and modern type. | NN/g *Teenager's UX*, bitskingdom, ustwo, UXmatters, as collected in `docs/design/reset/DESIGN-V3.md` §1.1 (F1, F4) | Deep grounds, grown-up type, motion only when it answers the child or explains the idea. |
| Adolescents are more sensitive than children to status and respect; respectful framing roughly doubled compliance. | Yeager, Dahl & Dweck 2018, via DESIGN-V3 F5 | Copy is short and treats the child as capable ("Your move", "Ho gaya"). Never "Yay!" or "superstar". |
| Boredom is the top reason Gen Alpha abandons an app (52 %), then ads (47 %), then slow loading (36 %). | [PwC Generation Alpha survey 2026](https://www.pwc.com/us/en/industries/consumer-markets/library/gen-alpha-survey-report.html) (US sample, not Indian) | The stage always holds something real, transitions take under a second, and the game responds in the same frame as the tap. |
| Indian children 5-14 watch 60 % more online video than a year earlier; 75.7 % of Gen Alpha device users in Indian cities use a smartphone as their primary device. | Kantar Kidscan via [Manifest](https://manifest-media.in/marketing/131124/indian-children-in-the-age-group-of-5-14-consuming-60-more-video-cont.html); Hypercollective via [exchange4media](https://www.exchange4media.com/marketing-news/86-indian-parents-say-gen-alpha-kids-influence-family-purchases-study-152726.html) | Phone-first at 360 × 800, and a visual language borrowed from the video, music and payments apps they already use, not from school apps. |
| Indian youth brands with cultural pull (Zomato, CRED) use witty Hinglish-aware copy and a premium look. | DESIGN-V3 F11 (Think with Google APAC, TCS Gen Z, afaqs, CRED case studies) | Hinglish is the default teacher register; NeoPOP-style slabs carry the premium signal. |

**Gap, stated plainly.** I found no published study that tests what Indian 9-15 year olds read as childish, and none on
dark versus light interfaces for Indian tweens. The table mixes global evidence with Indian usage data. The direction is
a reasoned bet that must be checked with children (SPEC §12 lists the checks).

---

## 3. What in today's Taxila Taal rejects, and why

Evidence: the round-3 production walk (`docs/design/round3/forge/audit/before/*`, 12 asks on taxila.dev, 2026-10-09), the
round-3 play shots (`docs/design/round3/play/shots/all/*`), the teacher concepts (`docs/design/teacher/stylised/concepts/`)
and `src/`. The round-4 audit folder (`docs/design/round4/audit/shots/`) held only loading skeletons when I looked.

| today | why it reads as childish or basic | Taal instead |
|---|---|---|
| **The teacher's face.** The shipped puppet is concept `c-front`, generated from the prompt "3D emoji-avatar cartoon human … an oversized, almost spherical head … large simple oval eyes … someone a 7-year-old would instantly trust" (`concepts.json`). The audit shows a flat-vector Arjun with huge round eyes and glasses. | It was designed for 7-year-olds, and the product now serves 9-15. Oversized heads and eyes are the textbook "for little kids" cue. | An editorial poster portrait with adult proportions (eyes at mid-head, one eye-width apart), flat light-and-shadow planes and a marigold rim light. It is a stand-in drawn in SVG for this prototype; SPEC §7 says what the production rig must change. |
| **Cream paper, pill buttons with heavy black outlines, "Hear" pills**, the same on every screen (`before/game-perimeter/02-turn-p360.png`). | Rounded outlined pills on cream are the generic kids-app kit. Nothing on the screen has weight or hierarchy. | Coloured deep grounds per screen; hard-edged slabs with real depth; one primary action per screen. |
| **One chalkboard for everything** (12/12 boards were the green chalk ground in the audit). | Chalk is the most school-coded surface there is, and using it for every topic made every topic look the same. | The board is the same tree renderer the game uses, on the lesson's own stage, drawn at the moment she names each part. |
| **Timid type.** The older-band display size is 1.625-1.75 rem (26-28 px) (`src/child/child.css`, bands b3-b4), and the lesson title is a 15 px label. | Without a real display scale there is no hierarchy, and the screen reads as a form. | A display scale up to 180 px; topic titles, numbers and the greeting are posters. Body copy is 16-21 px. |
| **Painted-world metaphors**: a "sunlit courtyard", a "rooftop at dusk", "your sky", star shapes for progress (`src/child/screens/Home.tsx`, `progress/SkyMap.tsx`, `StateShape.tsx`). | Stars and storybook places are the "for little kids" register the research names. | The map is a transit diagram of real prerequisite edges, with ink and pencil states (round-3's world model, kept). |
| **The round-3 Todo-Jodo screen** (`atoms-p360-raat.jpg`): a 10-key numpad, small rounded tiles, a 2-line caption strip. | It works, but it looks like a calculator. The number, which is the idea, is the smallest thing on screen. | The number is the hero: a giant outline numeral behind the tree, slabs that crack, primes that turn into marigold atoms, divisor "chisel" keys, and the product strip that multiplies back at the end. |
| **DESIGN-V3's own look**: near-black, indigo "ion", acid-lime "volt", film grain. | The owner called the result childish and basic. It is also one of the stock looks of machine-made UI (near-black with a lone acid-green pop). | Coloured grounds and a culturally specific pair (marigold and rani). |

**What Taal keeps, because it is right and measured:** no streaks, points, timers or leaderboards; the face shows
knowledge states and never verdicts; the verdict lives on the work (tick or magnifier, same brightness, same timing);
hands-free duplex with typing as an equal; the stage owns its box; pencil and ink mastery; only real prerequisite edges
on the map; the AI disclosure on the first screen.

---

## 4. The aesthetic risk

**Her voice is set as kinetic type.** The caption is the largest text on the lesson screen. Words light up as she says
them, and the word she stresses widens on Anek's width axis. When she names the number, the number leaves her
sentence and flies onto the board, and her portrait steps aside from the stage into the caption row. Words become
objects.

The risk is that moving type distracts a child who is reading. The safeguards: only one word moves at a time, it moves
once, only on the beat she stresses, motion stops when the child holds the floor, and reduced motion freezes all of it
(captions appear whole, the board appears in place). On slow phones (≤ 4 cores) the width animation is skipped and the
word simply turns marigold.

## 5. What I could not do

- No real voice. The lesson's timing is simulated from her speaking rate (~13.5 characters per second); the prototype
  does not play the teacher's voice, and the "Hear Asha" button animates the caption and her mouth without audio.
- The portraits are agent-drawn stand-ins. `context/rejected.md#rj-agent-authored-stylised-face` records that
  agent-made faces scored badly; mine are flat 2D illustrations, not a rig, and the production face needs an illustrator.
- No child has seen any of this. The 4× CPU-throttle numbers in SPEC §10 come from headless Chromium with software
  rendering, not a real Rs 10k phone.
