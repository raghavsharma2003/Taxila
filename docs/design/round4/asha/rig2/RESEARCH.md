# lamp2 research: how 2D productions animate a semi-realistic face without the uncanny valley

2026-10-10. Scope: half a day, desk research only. Tags: [S] a source says it (linked), [M] measured in this repo,
[U] my inference. Read with `context/rejected.md` (`rj-r4-lamp1-mesh-warp-uncanny`, `rj-p2d-*`) and
`docs/design/round4/asha/evidence/judge-live-tally.md`.

## What failed and why it matters here

lamp1 bent ONE painting (mesh warp: lip shell, jaw, turn field). Blind judges called it uncanny 4, 5, 3, 4 of 5 and
named "proportions swim" and "the mouth interior changes between consecutive frames" [M]. The same method on the
softer r8 cartoon scores uncanny 0/5 [M]. The literature agrees with that split:

- Motion and rendering flaws are tolerated on stylised characters and punished on realistic ones; the valley is deeper
  for animated faces than for stills (Dubosc et al., EGVE 2023 [S]).
- A mismatch between the realism of the appearance and the realism of the deformation (their case: linear blend
  skinning) is itself a cause of uncanniness; studios pick a stylised rendering to stay out of it (McDonnell & Breidt,
  "Face Reality", SIGGRAPH Asia 2010 [S]).
- Better motion quality raises acceptance; motion is not doomed per se (Piwek, McKay & Pollick, Cognition 2014 [S]).
  So the cure is not "no motion" but motion whose kind matches the drawing.

Reading [U]: a painted, semi-realistic face carries baked light and brush texture. Stretching it reveals the texture
moving relative to the light, which is exactly "a moving photo". Replacing it with another painting of the same face
never stretches anything: every frame the child sees is a painting.

## 1. Visual-novel key swaps

Visual novels animate painted, often semi-realistic sprites by **swapping whole drawn images**: a base with eye
states (open / closed) and separate mouth images laid over it; every mouth image is drawn at the exact resolution and
position of the base so it registers (Ren'Py lip-sync plugin notes, jaybe-games [S]; "Lip flaps and blinks",
nothack-europa [S]). Blinks run on a randomised timer and never in sync across characters (Feniks EasyBlink [S]).
Artists split the layers by function: base, eyes, face, outfit (itch.io devlog on complex spriting [S]).

Rules taken:
- R1. Every key is a full painting of the same face at the same registration; the swap region is the only place
  pixels differ. (Ours: masked composite of a registered edit, SSIM outside the region >= 0.995.)
- R2. Eyes and mouth are independent overlays on one base; the base never moves relative to them.
- R3. Blink timing is randomised (no fixed period), never periodic.

## 2. Live2D practice

Live2D's own tutorial: separate only the minimum number of parts needed for the motion you want
(docs.live2d.com, Illustration Processing [S]); its standard eye and mouth movements are parameter deformations
(docs.live2d.com, Adding Facial Expressions [S]). Two schools exist for mouths: deform the mouth mesh, or draw each
mouth shape and switch (r/Live2D discussion [S]); vowel mouths are usually mesh deformations
(the "aiueo" mouth tutorial [S]). Modellers who keep separate closed-eye art switch layers at the blink
(Live2D community, "switching eye textures" [S]). Deformation quality tip: the catchlight moves with the lid
(Live2D community [S]).

Reading [U]: Live2D deformation works because the art is cut and drawn FOR deformation (flat cel parts, hidden areas
painted). Our art is a single semi-realistic painting; the lamp1 result says deformation is the wrong choice for it.
The "draw each shape and switch" branch is the right one.

Rules taken:
- R4. No mesh deformation of skin, lips or eyes. Parts are drawn per state and switched.
- R5. Keep the catchlight inside the eye key (painted with it), never a separate moving sprite.
- R6. Licence note: Live2D itself stays rejected for this product (`rj-live2d-for-teacher`); only the practice is used.

## 3. Anime limited animation (held cels, few in-betweens)

Limited animation is built from held drawings, mouth flaps and selective movement: only the part that must move
moves (GarageFarm [S]; Pixune [S]). A typical flap is 2-3 frames; a sequence with more distinct mouth drawings
looks more natural (the Mononoke mouths essay, awesome-engine [S]). Commercial Japanese animation ranges from ones to
fours with threes as the base (Hiroshima University study [S]); "on twos" means each drawing is held for two frames,
12 drawings a second (animenewsnetwork forum [S]). A simplified mouth chart produces visible "flapping"
(Georgia Southern, Conducting Cartoon Consonants [S]).

Rules taken:
- R7. Selective motion: when she talks, only the mouth changes drawing; eyes and brows hold (they change only for a
  blink, a glance or an expression change).
- R8. Hold each mouth drawing for at least ~2 frames at 24 fps (about 70 ms) except a bilabial closure, which must
  always land (the seal is the most visible sync cue). Not longer: a 120 ms hold cut lip accuracy in this repo
  (`avatar-lipsync-dead-ends` #2 [M]).
- R9. Enough mouth drawings to avoid flapping: about 9-10 shapes, not 3.

## 4. Rhubarb-style mouth-shape sets

Rhubarb Lip Sync uses six basic shapes A-F (from the Hanna-Barbera set) plus optional G, H and X; A is the
closed P/B/M mouth, "almost identical" to X (rest) but with slight lip pressure (rhubarb-lip-sync README via
GitHub mirror [S]). Its Preston Blair output names the classic chart: AI, E, etc, FV, L, MBP, O, rest, WQ, with the
same timings (Lostmarble forum [S]).

Rules taken (our set, mapped from Diya's 15 visemes):

| key | Rhubarb / Blair | from Diya visemes |
|---|---|---|
| `rest` | X / rest | sil |
| `mbp` | A / MBP (lips pressed, no gap) | PP |
| `aa` | D / AI (open) | aa (w >= 0.75) |
| `eh` | C / E (half open, teeth) | aa (w < 0.75), E, kk, RR |
| `ee` | B / etc (teeth together, spread) | I, SS, CH |
| `oh` | E / O (rounded open) | O |
| `oo` | F / WQ (small rounded) | U |
| `fv` | G / FV (lower lip under teeth) | FF |
| `ltd` | H / L (slightly open, tongue tip at teeth) | DD, nn, TH |
| `smile` | warm closed smile (not speech) | the warm expression at rest |
| `calm` | neutral closed (safety face) | sil during a safety turn; replaces `smile` |

- R10. The `mbp` key must differ visibly from `rest` (pressed, slightly thinner lips): Rhubarb's own warning.

## 5. Motion budgets (how little a realistic face may move)

- Blinks: about 17 a minute at rest, fewer while reading, more while talking, driven by the motor act of speaking
  (Brych et al., PLOS ONE 2021 [S]); speakers' blinks at pauses and phrase ends are the ones listeners entrain to
  (Nakano & Kitazawa 2010, Exp Brain Res, as summarised in coverage [S]); longer blinks act as a listener cue
  (Hömke et al., PLOS ONE 2018, MPI coverage [S]). A spontaneous blink is about 100-400 ms; closing ~50-130 ms,
  opening about twice as long (Frontiers review; Springer study n = 8 [S]).
- Head: during speaking turns the head moves almost all the time (89.9 % of frames with non-zero velocity) and is
  nearly still in pauses and listening (12.8 %); fast movements mark stress (Hadar et al. 1983, Human Movement
  Science / Language and Speech, as cited [S]). Amplitudes in degrees were not found in the time box [U: small;
  nods are a few degrees].

Rules taken:
- R11. Blinks 15-20 a minute, a randomised schedule, biased to pauses and phrase ends (the floor-state change, a
  word gap); a blink = open -> half (1 frame) -> closed (~70 ms) -> half -> open, total ~180-220 ms, closing faster than
  opening. The half key appears only inside a blink, never held (`rj-p2d-mid-blink-06-still` [M]: a held half lid read
  "sleepy / smug").
- R12. Head: rigid translation and rotation only, within about +-2 degrees; more motion while speaking, near-still
  while listening. A turn is never faked by bending the face (lamp1, `rj-p2d-small-turn-keys` [M]).
- R13. Breathing: a sub-pixel vertical scale of the body only (a fraction of a pixel at the slot size).
- R14. Gaze: a swap to a painted look-left / look-right / look-up-aside eye key, not an iris slide.

## 6. Crossfades

[U] A hard cut between two painted mouths at 60 fps is how cel animation looks; a short dissolve hides the
quantisation of the 60 Hz frame clock against Diya's ~70-120 ms phones. A long dissolve shows two mouths at once
(double lip lines). Rule:
- R15. Mouth crossfade at most 60 ms (the brief allows 60-90; I take the low end), eased (smoothstep), so a 15 fps
  sample lands on a mixed frame in well under half the frames. Eye-key swaps 40-50 ms (a saccade is about that
  fast). Expression keys (brows, smile) 150-250 ms.

## Sources

- Dubosc et al., EGVE 2023: https://diglib7.eg.org/bitstream/handle/10.2312/egve20231314/063-071.pdf
- McDonnell & Breidt, "Face Reality", 2010: https://edepositireland.ie/handle/2262/49128
- Piwek, McKay & Pollick, Cognition 2014: https://eprints.gla.ac.uk/105081
- Ren'Py lip-sync plugin (jaybe-games): https://jaybe-games.itch.io/automatic-anime-lipsync-plugin-for-renpy
- Lip flaps and blinks (nothack-europa): https://nothack-europa.itch.io/lip-flaps-and-blinks
- Feniks EasyBlink: https://feniksdev.itch.io/easy-blinking-for-renpy
- itch.io devlog, complex spriting: https://itch.io/devlog/124663/the-challenges-of-complex-animation-spriting.amp
- Live2D, Illustration Processing: https://docs.live2d.com/en/cubism-editor-tutorials/psd/
- Live2D, Adding Facial Expressions: https://docs.live2d.com/en/cubism-editor-tutorials/expression/
- Live2D community, switching eye textures: https://community.live2d.com/discussion/1218/switching-eye-textures
- Live2D community, eye movement quality: https://community.live2d.com/discussion/27/improving-quality-of-eye-movement
- r/Live2D, drawn mouths vs deformers: https://pol1.lr.ggtyler.dev/r/Live2D/comments/1k6hk3f/questions_about_emotions
- Live2D "aiueo" mouth tutorial (summary): https://chaindesk.ai/tools/youtube-summarizer/20-live2-d-japanese-vowels-pmi8ZXXTnQw
- GarageFarm, limited animation: https://garagefarm.net/blog/limited-animation-what-is-it
- Pixune, limited animation: https://pixune.com/blog/what-is-limited-animation/
- Mononoke's mouths: https://awesome-engine.com/mononokes-mouths/
- Hiroshima University study on timing: https://ir.lib.hiroshima-u.ac.jp/46781/files/18259
- ANN forum on ones / twos: https://animenewsnetwork.com/bbs/phpBB2/viewtopic.php?p=226499
- Conducting Cartoon Consonants: https://digitalcommons.georgiasouthern.edu/curio-symposium/2020/2020/22
- Rhubarb Lip Sync (mirror of the README): https://github.com/wzpan/rhubarb-lip-sync
- Lostmarble forum, Rhubarb Preston Blair names: https://www.lostmarble.com/forum/viewtopic.php?p=214698
- Brych et al., PLOS ONE 2021: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8500445/
- Blinks as conversational cues (coverage of Hömke et al. 2018): https://zmescience.com/science/news-science/blinking-non-verbal-cues-12122018
- Blink kinematics review (Frontiers 2023): https://www.frontiersin.org/journals/systems-neuroscience/articles/10.3389/fnsys.2023.1242654/pdf
- Blink opening vs closing (Springer): https://link.springer.com/doi/10.1007/s00417-007-0611-8
- Hadar et al. 1983, head kinematics: https://cris.tau.ac.il/en/publications/kinematics-of-head-movements-accompanying-speech-during-conversat-2/
- Head movement and speech review (Frontiers 2019): https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2019.02459/pdf
