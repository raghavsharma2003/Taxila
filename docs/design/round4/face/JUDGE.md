# JUDGE: round 4, the grown-up teacher face for Prakash

Date: 2026-10-10. Brief: `FACE.md` (round-4 briefs). Owner's words: "go with Prakash with a grown-up face, show me that
face also or we can make anime type women face of mature and confident women".
Deliverables in this folder: `index.html` (the comparison page, not published), `images/` (every kept image, plus `tried/`
and `superseded/`), `gen.json` (every image request), `RIG-NOTES.md`, `shots/`, `evidence/` (raw judge JSON, measurements,
sheets) and `source/` (the scripts as run; they ran from the session scratch folder, so the paths inside point there).

**Verdict in one line:** all four options clear the safety floor on every blind run: never childish, never sexualised,
always read as a teacher. They differ on age, warmth, fit with the world, and how hard they are to rig. I would ship
**option 1 (grown-up painted)**, but only after a two-day rig test. If that test fails, **option 4 (lamplight flat)** is
the fallback.

---

## 1. What I made

| # | family | front | how | images |
|---|---|---|---|---|
| 1 | Grown-up, painted (the main loop's recommendation) | `s3-graphic` | gpt-image-2 generation, then 5 high-fidelity edits | 8 fronts tried, 7 edits (2 superseded) |
| 2 | Mature anime (the owner's suggestion) | `a3-film` | same | 7 fronts tried, 7 edits (2 superseded) |
| 3 | Line of light, in lamplight | `line-rest` | the studio `portraitSVG` + `Teacher` parameters, redrawn in code (`source/lineoflight.mjs`), rendered in Chromium | 0 |
| 4 | Lamplight flat (my addition) | `w1-flat` | gpt-image-2 generation + 5 edits | 1 front, 7 edits (2 superseded) |

- **Images:** 37 of the 90-image cap, all on `taxila-image` (gpt-image-2, eastus2 account). That is 16 generations and
  21 edits at quality high, 1024², with `input_fidelity` high on the edits. 0 failed requests. 259,888 output tokens,
  about USD 8. Nothing came from any other model or provider.
- **The other `AZURE_IMAGE_*` deployments** (the bake-off the brief allows) were not used. They are the gpt-image-2
  capacity pool (`image-capacity-pool-2026-10-04`), so they add capacity, not a different model. FLUX on Foundry
  refuses prompts that contain "Indian" or age and skin-tone wording (`rj-flux2-pro-labels-and-indian-prompts`,
  `rj-flux2-flex`), and every prompt here needs both. MAI-Image was refused on 4/20 requests in the scouts. Not a
  measured bake-off on this task: a decision from the logged evidence.
- **Why a fourth family.** The world SPEC builds every place from flat layered shapes with violet shadows (§1.1, §5). The
  audit's top cause is "the teacher is a sticker": a face in a different art style from everything around it. Options
  1 and 2 are, again, a different style from the world. Option 4 is the face drawn in the world's own light model.
  It is also the style that the existing rig's membrane fill and flat cuts already suit.

## 2. What I learned making them (these change how to prompt the next character)

1. **A realistic identity block beats any style word.** The first identity text was written the way a real face is
   described: fine lines beside the nose, under-eye folds, a slight asymmetry. With it, both "anime" prompts (`a1-film`,
   `a1-cel`) came back as realistic illustrations, and every "stylised" prompt came back as a near-realistic oil portrait
   (`s1-*`, `s2-*`, `s3-planes`). The fix was to write the same identity again in each style's own terms (`WHO_ANIME`,
   `WHO_DESIGN` in `source/jobs.mjs`). Counted by eye: 0/2 "anime" fronts written with the realistic block came back as
   anime, against 5/5 with the anime block (one of those, `a2-soft`, only half-way). 6/6 "stylised" fronts written with the
   realistic block came back as semi-real painted portraits. The 2 written with the design block were visibly more stylised.
2. **A neutral, closed mouth reads stern on an adult face.** Round 1 looked severe. Adding a "pleasant open resting
   face, corners level" sentence fixed it from round 2 on.
3. **"Speaking" edits come back looking surprised, and a side glance comes back looking disapproving.** In the blind
   identity check, the first thinking frames read as a "sceptical / disapproving side-eye" in 3/3 gpt-5.6-sol runs for
   options 1 and 4, and 3/3 for option 3. The first speaking frames read as "mouth open in surprise" (3/3 for options 2
   and 4). Redone with the eyes UP and level brows, and a mid-word mouth with the brows held. Now every speaking frame
   reads as speaking. The upward thinking glance still reads as a mild eye-roll in 1/3 gpt-5.6-sol runs for options 1
   and 4, and 0/3 for option 2. This is the same faint scepticism the r8 judge found (JUDGE-r8). In the rig, the timing
   of the glance (≤ 3.5 s, TEACHER-VISUAL §7.2) and a little inner-brow lift carry the fix.
4. **The edit model does not follow gaze direction.** I asked for "upper left". Every family looked right, and the
   first takes looked sideways, not up. The rig moves the gaze by parameter, so this matters only for reference frames.
5. **Edits drift in framing.** Measured after registration (ORB + RANSAC similarity on the whole frame,
   `source/measure.py`), the face centre moves 0.5-39.9 px at 1024 and the scale is 0.91-1.00. The worst is
   `w1-flat--think2` (scale 0.918, 22.8 px) and `w1-flat--blink` (0.955, 32 px). Listening frames include the
   requested tilt (9-13° measured on the whole frame). The page shows every frame registered by scale and translation
   only, which is what the rig does before it cuts patches. The rotation is kept.

## 3. My own judgement, per family (by eye, at 1x and at 90 × 117, 150 × 190, 250 tall and 38 × 48)

The four fronts were picked by eye **before** any blind result existed (`source/picks.txt`, timestamped), so the
judge could not steer the pick (`teacher-stylised-on-makehuman-rejected`: "poses chosen against the judge that grades them").

- **1 · Grown-up, painted (`s3-graphic`).** The best image here. A credible, warm Indian schoolteacher in her thirties.
  The ink drawing under the paint keeps it an illustration and not a photo. It survives the 38 px chip. The six frames
  are one person. *Weak:* it is the least "designed" of the four, close to a real portrait, and that is exactly the
  kind of face that looks uncanny when warped. The fine flyaway strands at the temples are matting work. The skin is
  orange (§5). The warm smile adds visible smile lines; that reads as age, which is correct, but it is the most
  "lined" frame on the page.
- **2 · Mature anime (`a3-film`).** It does what you asked: adult proportions, a defined jaw, a drawn nose, calm eyes,
  no moe. It has film grain and a retro theatrical look. *Weak:* it is cool, even aloof at rest. The hard nose-side
  shadow is the strongest shape at chip size. Next to option 1 it is plainer. The knitted-brow thinking frame
  read as disapproving and was replaced.
- **3 · Line of light (`line-rest`).** A faithful adaptation, and a puppet already: six parameter settings of one
  drawing. *Weak, and I will not dress it up:* it is agent-drawn vector art, and it hits the ceiling `rj-agent-authored-stylised-face`
  measured. It reads plain and older (blind: 30-50). The listening frame still reads as a sceptical side glance after
  one fix, and the warm frame reads as "squinting" in 1/3 runs. Its only clear wins are size (≈ 11 KB per frame
  as SVG), exact identity, and skin on the Monk band (because I chose the fill).
- **4 · Lamplight flat (`w1-flat`).** It sits in the jharokha as if it belonged there: flat planes, plum-violet
  neck shadow, lamp-gold light. It is the crispest at 38 px. *Weak:* it reads youngest (blind: 25-35 on 5/5), so it is
  closest to the floor of "clearly 30 to 40". It has the most orange skin (ΔC* +32). The lips are a deep coral that could
  read as lipstick. Its edits drifted the most in framing.

Rejected along the way (13 fronts, thumbnails in the page): `s1-paint`, `s1-ink` (realistic, stern, about 40); `a1-film`,
`a1-cel` (asked for anime, came back realistic); `s2-game` (credible and warm, the runner-up for option 1, but the closest
to a photograph); `s2-paint`, `s3-planes` (oil-real); `a2-cel` (real anime, but TV-flat and basic); `a2-soft` (mid-20s,
idealised); `a3-cel` (mature but plainer than a3-film); `s4-feature` (model-like neck and cheekbones); `s4-poster`
(late 20s, a little stern); `a4-warm` (warmer, but blind 18-32, too young).

## 4. Blind checks (Azure vision models; a model's opinion is a proxy, not the owner's)

**Method.** `source/blind.mjs`: one front per call, `detail: high`, no context at all. The judge was told nothing about age,
job, country, product or intent. Open questions came first (age, top-3 occupations, origin), then the yes/no items
(teacher, childish, sexualised, Indian, idealised). Two model families on the eastus2 account: **gpt-5.6-sol**
(`taxila-brain`, reasoning medium, n = 3 per front) and **Kimi K2.6** (`taxila-kimi26`, n = 2 per front). Mistral
Medium 3.5 was probed once on the control. It called today's chibi "not childish", so it was not used
(`rj-mistral-m35-image-judge` already records it as a weak vision judge). **Control:** today's chibi (`c-front`)
was read as childish in 5/5 runs, so the judges can see childishness when it is there.

Summary (n = 5 per front: 3 gpt-5.6-sol + 2 Kimi K2.6):

| front | age ranges given | teacher | childish | sexualised | reads Indian | "idealised" |
|---|---|---|---|---|---|---|
| 1 painted `s3-graphic` | 28-38, 28-38, 28-38, 25-35, 25-40 | 5/5 | 0/5 | 0/5 | 5/5 | 3/5 |
| 2 anime `a3-film` | 28-38, 25-35, 25-35, 25-35, 25-35 | 5/5 | 0/5 | 0/5 | 4/5 | 5/5 |
| 3 line `line-rest` | 30-45, 30-45, 35-50, 35-50, 35-50 | 5/5 | 0/5 | 0/5 | 5/5 | 2/5 |
| 4 flat `w1-flat` | 25-35 (5/5) | 5/5 | 0/5 | 0/5 | 5/5 | 5/5 |
| today `c-front` (control) | 25-35, 22-32, 22-32, 25-35, 25-35 | 5/5 | **5/5** | 0/5 | 4/5 | 5/5 |

How to read it: "teacher" is 5/5 even for the chibi, because the saree, bindi and framing do the work. So it does not
separate the options. The judges say "reads Indian" is mostly the saree and bindi, which is honest. "Idealised" fires on
almost everything, the chibi included, so it discriminates poorly. The one item that clearly separates the options is
**age**: option 4 never reaches 36, option 3 reaches 50, and option 1 is the only one centred on the brief's 30-40.

Verbatim answers (every run):

#### Option 1, grown-up painted (s3-graphic): n = 5 (3 gpt-5.6-sol, 2 Kimi K2.6)

| judge, run | age | occupation guesses | origin guess | teacher? | childish? | sexualised? | Indian? |
|---|---|---|---|---|---|---|---|
| gpt-5.6-sol #1 | 28-38 | schoolteacher; civil servant; office professional | Cannot determine actual origin from appearance; the sari and bindi visually suggest an Indian setting. | True: Conservative sari, neat grooming, and a composed frontal presentation. | False: Adult proportions and a naturalistic, mature face. | False: Modest clothing, neutral pose, minimal makeup, and no flirtatious expression. | True: The depiction uses a sari with a bordered drape, a central bindi, and understated gold earrings—strong Indian cultural signifiers. |
| gpt-5.6-sol #2 | 28-38 | schoolteacher; civil servant; office professional | Not determinable from appearance; the sari and bindi signal Indian cultural styling. | True: Conservative sari, neat grooming, and composed frontal presentation. | False: Adult proportions and a realistic, restrained portrait style. | False: Neutral expression, modest clothing, and straightforward bust framing. | True: The bindi, sari with bordered drape, blouse, and simple gold earrings are strongly associated with Indian dress; this indicates styling, not confirmed origin. |
| gpt-5.6-sol #3 | 28-38 | schoolteacher; civil servant; office professional | South Asia, most likely India, based on the sari and bindi | True: Conservative sari, neat grooming, and a composed expression fit a teacher portrait. | False: Adult proportions and restrained, realistic facial features. | False: Modest clothing, neutral frontal pose, minimal makeup, and no flirtatious expression. | True: Bindi, sari with a bordered drape, small gold earrings, and center-parted tied-back hair. |
| Kimi K2.6 #1 | 25-40 | Schoolteacher; Bank employee; Office administrator | India | True: Neat sari, bindi, small gold earrings and a composed, professional expression read as a conventional schoolteacher. | False: Nothing; proportions are fully adult, expression is mature, and the detailed realistic style is not toy-like. | False: Nothing; traditional full-coverage sari, neutral direct gaze, no makeup or flirtatious framing. | True: Red bindi, sari, gold stud earrings, brown skin tone and facial structure. |
| Kimi K2.6 #2 | 25-35 | schoolteacher; administrative assistant; bank clerk | India | True: Neat sari, bindi, modest blouse, composed neutral expression; looks respectable and orderly. | False: Nothing: realistic adult proportions, natural eyes, serious expression, no toy-like or toddler styling. | False: Nothing: fully covered sari, neutral closed-lip expression, no makeup, no cleavage or suggestive framing. | True: Red bindi, dark hair in bun, gold stud earrings, teal sari with border, brown skin, South Asian features. |

#### Option 2, mature anime (a3-film): n = 5 (3 gpt-5.6-sol, 2 Kimi K2.6)

| judge, run | age | occupation guesses | origin guess | teacher? | childish? | sexualised? | Indian? |
|---|---|---|---|---|---|---|---|
| gpt-5.6-sol #1 | 28-38 | schoolteacher; government office worker; community worker | Visually coded as South Asian, most likely Indian | True: The plain sari, tied-back hair, and composed expression fit a conventional teacher portrait. | False: The eyes are slightly enlarged and stylised, but the proportions and presentation are clearly adult. | False: Neutral expression, frontal pose, modest clothing, and no suggestive framing. | True: Sari, central bindi, gold stud earrings, and the overall visual styling are strongly Indian-coded. |
| gpt-5.6-sol #2 | 25-35 | schoolteacher; government office worker; community leader | India, likely South India | True: Conservative sari, neat grooming, and composed expression fit a schoolteacher. | False: Adult facial and body proportions; the enlarged eyes are stylised but not toddler-like. | False: Neutral frontal pose, restrained expression, minimal make-up, and conservative clothing. | True: Sari, central bindi, gold stud earrings, dark center-parted hair, and South Asian styling. |
| gpt-5.6-sol #3 | 25-35 | schoolteacher; office worker; civil servant | Cannot determine origin from appearance; the sari and bindi visually code her as broadly South Asian. | True: Conservative sari, neat grooming, and composed frontal presentation. | False: Adult facial and body proportions; the enlarged eyes are stylised but not babyish. | False: Neutral expression, formal pose, modest clothing, and no suggestive framing. | False: The sari, bindi, gold studs, and hairstyle suggest South Asian styling, but they do not establish Indian identity specifically. |
| Kimi K2.6 #1 | 25-35 | schoolteacher; office worker/administrator; homemaker | India | True: Wearing a sari with a bindi and small gold studs, hair neatly parted and pinned back; this exact modest, orderly presentation is the default visual shorthand for an Indian schoolteacher. | False: Adult proportions throughout: defined jaw, visible neck structure, mature nose and eyes that are large but not infantile. No toddler-style roundness or toy aesthetics. | False: Modest high-neck sari coverage with no skin shown below the collarbone; expression is neutral and direct, not coy; no exaggerated makeup, cleavage, or suggestive framing. | True: Red bindi centered on forehead, teal sari with traditional woven border, small gold stud earrings, dark hair parted in the middle and pinned back, warm brown skin tone and facial structure. |
| Kimi K2.6 #2 | 25-35 | schoolteacher; government office worker; homemaker | India | True: Modest saree, neat bun, composed expression—looks professional and approachable. | False: Adult proportions and realistic rendering; no toy-like or babyish features. | False: Conservative clothing, neutral expression, no revealing framing or flirtatious cues. | True: Red bindi, saree with traditional border, gold earrings, brown skin, dark hair. |

#### Option 3, line of light (line-rest): n = 5 (3 gpt-5.6-sol, 2 Kimi K2.6)

| judge, run | age | occupation guesses | origin guess | teacher? | childish? | sexualised? | Indian? |
|---|---|---|---|---|---|---|---|
| gpt-5.6-sol #1 | 30-45 | schoolteacher; office worker or civil servant; homemaker | India, plausibly South India | True: The modest sari, tied-back hair, and composed expression fit a conventional teacher depiction. | False: Adult proportions and restrained facial styling; not babyish or toy-like. | False: Neutral expression, modest clothing, and straightforward bust framing. | True: Bindi, sari with contrasting border, gold stud earrings, center-parted hair, and low bun. |
| gpt-5.6-sol #2 | 30-45 | schoolteacher; government office worker; community worker | South Asia, likely India | True: The modest sari, neat hair and composed expression fit a conventional teacher portrait. | False: Adult proportions and restrained styling; only the simplified vector treatment is cartoon-like. | False: Neutral expression, frontal framing, minimal jewellery and modest clothing. | True: The bindi, sari-style drape, low bun and small gold earrings are strongly associated with Indian dress. |
| gpt-5.6-sol #3 | 35-50 | schoolteacher; office worker or civil servant; community worker | Not determinable; the portrait is culturally coded toward India or the Indian subcontinent through the sari and bindi. | True: The modest sari and composed, formal presentation fit a conventional teacher depiction. | False: Simplified flat-vector features, but the proportions and styling clearly depict an adult. | False: Neutral expression, straightforward framing, modest clothing, and no seductive pose or glamour styling. | True: The bindi, sari-style drape, gold stud earrings, center-parted hair, and low bun are strongly Indian-coded. |
| Kimi K2.6 #1 | 35-50 | schoolteacher; homemaker; office clerk | India | True: Mature, modest, neatly dressed in a sari with a neutral, authoritative expression typical of a schoolteacher. | False: Nothing infantile; proportions are adult and the style is a simple flat illustration without toy-like exaggeration. | False: Neutral expression, modest sari covering the shoulders, no makeup, coy pose, or flirtatious framing. | True: Red bindi, sari with visible border, gold earrings, skin tone, and hairstyle. |
| Kimi K2.6 #2 | 35-50 | schoolteacher; homemaker; office worker | India | True: Neat sari, bindi, and composed expression match the common archetype of an Indian schoolteacher. | False: Adult facial proportions and stylized flat vector rendering; no enlarged eyes, toy-like roundness or toddler cues. | False: Modest high-coverage sari, neutral direct expression, no makeup beyond bindi, and straightforward head-and-shoulders framing. | True: Red bindi, sari with coloured border, gold stud earrings, brown skin tone and dark hair in a low bun. |

#### Option 4, lamplight flat (w1-flat): n = 5 (3 gpt-5.6-sol, 2 Kimi K2.6)

| judge, run | age | occupation guesses | origin guess | teacher? | childish? | sexualised? | Indian? |
|---|---|---|---|---|---|---|---|
| gpt-5.6-sol #1 | 25-35 | schoolteacher; civil servant; office professional | Indian cultural presentation; actual geographic origin cannot be determined from appearance alone | True: The modest sari, neat grooming, and composed frontal presentation fit a teacher portrait. | False: Adult proportions and mature facial structure; not toy-like or toddler-oriented. | False: Neutral expression, straightforward framing, and modest clothing. | True: Sari, bindi, gold stud earrings, and styling strongly signal Indian cultural dress. |
| gpt-5.6-sol #2 | 25-35 | schoolteacher; civil servant; office professional | India, possibly South India | True: Her modest sari, neat grooming, and composed expression fit a conventional teacher portrait. | False: Adult proportions and a mature, restrained illustration style. | False: Neutral frontal pose, modest clothing, and no flirtatious expression or framing. | True: Bindi, sari with contrasting border, blouse, gold stud earrings, and center-parted tied-back hair. |
| gpt-5.6-sol #3 | 25-35 | schoolteacher; civil servant; office professional | Depicted as Indian/South Asian; no specific region is identifiable. | True: Neat sari, restrained jewelry, and formal front-facing presentation. | False: Adult proportions and a polished editorial style; nothing babyish or toy-like. | False: Neutral expression, modest clothing, and straightforward portrait framing. | True: Sari, centered bindi, gold stud earrings, and South Asian styling. |
| Kimi K2.6 #1 | 25-35 | schoolteacher; bank officer; administrative professional | India | True: Neat sari, conservative blouse, tidy bun, bindi, and composed expression fit the stereotype of an Indian schoolteacher. | False: Nothing—adult proportions, realistic eyes, and sober styling throughout. | False: Nothing—modest high-neck sari coverage, neutral frontal pose, plain makeup, no flirtatious expression. | True: Red bindi, sari with woven border, gold studs, brown skin, dark hair, and South Asian facial features. |
| Kimi K2.6 #2 | 25-35 | teacher; administrative professional; homemaker | India | True: modest saree, neat bun, bindi and calm composed expression fit a schoolteacher archetype | False: none; adult proportions, realistic facial structure, no oversized eyes or toy-like stylisation | False: none; high-neck modest saree, neutral front-facing pose, composed expression, no revealing framing | True: red bindi, saree with traditional border, gold earrings, skin tone and South Asian facial features |

#### Today, the shipped chibi (c-front), control: n = 5 (3 gpt-5.6-sol, 2 Kimi K2.6)

| judge, run | age | occupation guesses | origin guess | teacher? | childish? | sexualised? | Indian? |
|---|---|---|---|---|---|---|---|
| gpt-5.6-sol #1 | 22-32 | schoolteacher; office worker; community educator | India, likely South Asia more broadly | True: Modest kurta-style clothing and a friendly, composed expression fit a teacher portrayal. | True: Oversized head and eyes, simplified features, and smooth toy-like 3D rendering. | False: Neutral frontal pose, modest clothing, and no seductive expression or framing. | True: Central bindi, kurta-style neckline, gold stud earrings, and South Asian styling. |
| gpt-5.6-sol #2 | 22-32 | schoolteacher; children's educational presenter; office worker | Cannot determine from appearance; the styling is broadly South Asian-coded. | True: Modest kurta-style top, neat grooming, and friendly neutral expression. | True: Toy-like 3D rendering, oversized eyes, large rounded head, and simplified features. | False: No revealing clothing, seductive pose, flirtatious expression, or glamorous framing. | False: The bindi, gold earrings, and kurta-style neckline suggest South Asian styling, but not India specifically. |
| gpt-5.6-sol #3 | 25-35 | schoolteacher; office worker; community worker | India, broadly South Asian | True: Modest kurta-like clothing and a neat, approachable presentation. | True: Oversized head and eyes, rounded features, and toy-like 3D proportions. | False: Neutral front-facing pose, modest clothing, and no seductive styling. | True: Bindi, kurta-style neckline, gold stud earrings, and South Asian character styling. |
| Kimi K2.6 #1 | 25-35 | Teacher; Nurse/healthcare worker; Administrative assistant | India | True: Modest collared top, friendly but mature expression, and approachable demeanor fit a schoolteacher in family-oriented animation. | True: Enormous rounded eyes, perfectly smooth plastic-like skin, simplified facial sculpt and proportions typical of CGI characters made for children's media. | False: Nothing; clothing is modest with a high neck/long sleeves, pose is neutral bust framing, expression is plain friendly with no flirtatious or glamorous cues. | True: Red bindi centered on forehead, gold stud earrings, dark hair and skin tone, and a kurta-style teal top with contrast trim. |
| Kimi K2.6 #2 | 25-35 | teacher; administrative professional; nurse or caregiver | India | True: warm, approachable smile and modest, tidy dress read as trustworthy and professional in an educational setting | True: massive glossy eyes, perfectly rounded face, tiny nose and lack of facial texture give a toy-like, infantilised CGI doll look | False: nothing; high-neck long-sleeve top, neutral front-facing pose, friendly but non-flirtatious expression, no makeup or framing that signals glamour or seduction | True: dark red bindi on forehead, gold ball earrings, teal kurta-style top with orange piping and split neckline, warm brown skin and black hair |

### Identity across the six frames (blind, n = 5 per family)

**Method.** `source/idcheck.mjs`: the family's six frames as an unlabelled 3 × 2 grid. The judge was not told the
order. It was asked whether all six are one person in one style, what differs, an identity score from 1 to 5, an
open "what is each face doing", and anything off. Same two models, 3 + 2 runs. Superseded runs, on the earlier frames,
are kept in `evidence/superseded/`.

| family | same person | identity scores | "anything off" |
|---|---|---|---|
| 1 painted | 5/5 | 5, 5, 5, 5, 5 | 1/5: the upward thinking glance "reads mildly disapproving" |
| 2 anime | 5/5 | 5, 5, 5, 5, 5 | 0/5 |
| 3 line | 5/5 | 4, 5, 4, 5, 5 | 3/5: the listening glance reads sceptical; once the thinking glance and the warm squint too |
| 4 flat | 5/5 | 5, 5, 5, 5, 5 | 1/5: the thinking glance "eye-roll with pursed lips" |

My own check agrees on identity: same face, hair, bun, bindi, studs, saree border and skin in all six frames of every
family. The exception is the framing drift (§2.5).

Verbatim (every run):

#### Option 1 (stylised): n = 5

| judge, run | same person | identity 1-5 | what each cell is doing (rest / speak / listen / think / warm / blink) | anything off |
|---|---|---|---|---|
| gpt-5.6-sol #1 | True | 5 | neutral, looking forward / speaking with mouth open / faint smile, sideways gaze / looking upward thoughtfully / smiling softly / eyes closed calmly | (none) |
| gpt-5.6-sol #2 | True | 5 | neutral forward look / speaking with mouth open / soft sideways glance / looking upward / gently smiling / eyes peacefully closed | (none) |
| gpt-5.6-sol #3 | True | 5 | neutral, looking forward / speaking with mouth open / slight sideways smile / rolling eyes upward / smiling gently / eyes closed calmly | Cell 4: upward eye-roll reads mildly disapproving. |
| Kimi K2.6 #1 | True | 5 | neutral calm expression / mouth slightly open / slight knowing smile / eyes glancing sideways / warm gentle smile / eyes closed peacefully | (none) |
| Kimi K2.6 #2 | True | 5 | Neutral composed expression / Mouth slightly open / Subtle knowing smile / Neutral sideways glance / Warm gentle smile / Eyes closed peacefully | (none) |

#### Option 2 (anime): n = 5

| judge, run | same person | identity 1-5 | what each cell is doing (rest / speak / listen / think / warm / blink) | anything off |
|---|---|---|---|---|
| gpt-5.6-sol #1 | True | 5 | calm neutral expression / speaking with mouth open / gazing softly aside / looking to the side / smiling gently / eyes peacefully closed | (none) |
| gpt-5.6-sol #2 | True | 5 | calm neutral expression / speaking with mouth open / soft sideways glance / neutral attentive expression / slight warm smile / eyes closed serenely | (none) |
| gpt-5.6-sol #3 | True | 5 | calm neutral expression / speaking with mouth open / soft attentive look / neutral direct gaze / gently smiling / eyes closed serenely | (none) |
| Kimi K2.6 #1 | True | 5 | Neutral calm expression / Mouth open speaking / Looking off to side / Stoic neutral face / Gentle slight smile / Eyes closed peacefully | (none) |
| Kimi K2.6 #2 | True | 5 | Neutral calm expression / Mouth open speaking / Glancing to the side / Blank neutral look / Soft gentle smile / Eyes closed peacefully | (none) |

#### Option 3 (line): n = 5

| judge, run | same person | identity 1-5 | what each cell is doing (rest / speak / listen / think / warm / blink) | anything off |
|---|---|---|---|---|
| gpt-5.6-sol #1 | True | 4 | neutral forward look / speaking with open smile / glancing sideways skeptically / looking upward thoughtfully / faint knowing smile / eyes calmly closed | Cell 3 reads as mildly disapproving or skeptical. |
| gpt-5.6-sol #2 | True | 5 | looking forward neutrally / smiling and speaking / glancing sideways skeptically / looking upward pensively / squinting with slight smile / eyes calmly closed | Cell 3 reads mildly disapproving; cell 5 reads skeptical. |
| gpt-5.6-sol #3 | True | 4 | neutral, looking forward / smiling with mouth open / glancing sideways / looking upward / smiling faintly / eyes closed calmly | Cell 4's upward eye-roll can read as mildly disapproving. |
| Kimi K2.6 #1 | True | 5 | neutral calm face / mouth open speaking / slight polite smile / eyes look left / eyes look right / eyes closed resting | (none) |
| Kimi K2.6 #2 | True | 5 | neutral calm expression / smiling with open mouth / subtle smile looking forward / eyes looking to side / gentle closed mouth smile / eyes closed peacefully | (none) |

#### Option 4 (world): n = 5

| judge, run | same person | identity 1-5 | what each cell is doing (rest / speak / listen / think / warm / blink) | anything off |
|---|---|---|---|---|
| gpt-5.6-sol #1 | True | 5 | calm slight smile / speaking with mouth open / gentle closed-mouth smile / pursed lips, looking upward / warm slight smile / eyes closed calmly | (none) |
| gpt-5.6-sol #2 | True | 5 | neutral slight smile / speaking with mouth open / gentle sideways smile / eye-roll with pursed lips / warm closed-mouth smile / eyes calmly closed | Cell 4 reads mildly disapproving due to the upward eye-roll and pursed lips. |
| gpt-5.6-sol #3 | True | 5 | calm neutral smile / speaking with mouth open / gently smiling sideways / looking upward thoughtfully / warm gentle smile / eyes closed serenely | (none) |
| Kimi K2.6 #1 | True | 5 | neutral calm expression / mouth slightly open / soft pleased smile / eyes glancing upward / slight contented smile / eyes closed peacefully | (none) |
| Kimi K2.6 #2 | True | 5 | neutral front-facing gaze / mouth slightly open / subtle closed-mouth smile / gazing upward and right / soft warm smile / eyes closed peacefully | (none) |

## 5. Skin against the Monk band (TEACHER-VISUAL §4.3: Asha is MST 6)

**Method** (g9.mjs moved to 2D, `source/measure.py`): four hand-placed 25 × 25 px patches on each 1024 front. Two are on
the forehead, either side of the bindi, and two on the cheeks. The overlay is `evidence/sheets/patches.webp`. Per patch,
the per-channel median is taken; patches are averaged in linear light, then converted to CIE L*a*b* (D65). The target is
MST 6, `#a07e56`, L* 55.1, a* 7.8, b* 26.7, C* 27.9. The g9 bar is |ΔL*| ≤ 3 and |ΔC*| ≤ 4. n = 4 patches per front, one
front per family, 2026-10-10.

| front | forehead L* / C* | cheek L* / C* | mean L* a* b* C* | ΔL* | ΔC* | g9 bar | nearest MST (ΔE76 to 5 / 6 / 7) |
|---|---|---|---|---|---|---|---|
| 1 `s3-graphic` | 67.2 / 49.8 | 70.8 / 48.3 | 69.0 19.7 44.9 49.0 | +13.9 | +21.1 | fail | 6 (28.6 / 25.8 / 36.8) |
| 2 `a3-film` | 60.3 / 51.8 | 60.8 / 52.2 | 60.6 24.7 45.8 52.0 | +5.5 | +24.1 | fail | 6 (35.6 / 26.1 / 33.5) |
| 3 `line-rest` | 56.8 / 31.0 | 54.8 / 31.1 | 55.8 13.8 27.8 31.0 | +0.7 | +3.1 | pass | 6 (24.8 / 6.1 / 15.2) |
| 4 `w1-flat` | 61.8 / 59.5 | 63.6 / 61.1 | 62.7 31.1 51.7 60.3 | +7.6 | +32.4 | fail | 6 (42.6 / 35.0 / 41.7) |
| today `c-front` | 66.1 / 53.3 | 72.1 / 55.4 | 69.2 26.5 47.4 54.3 | +14.1 | +26.4 | fail | 6 |

**What this says.** Every image-model face, today's included, is lighter than the MST 6 swatch and roughly twice as
saturated. The large a* (20-31 against 8) is the orange. The line portrait passes only because I set its fill from the
swatch. I tested a skin-only grade (`source/skingrade.py`; `images/grade-*.webp`, and `evidence/sheets/grade3.webp`).
Grading `s3-graphic` until it passes the bar (C* 27.8, ΔL* +2.6) makes the skin read **ashy and grey** on the cream
lamplight. A half-way grade (C* 37.4, ΔL* +7.7) reads as the most natural brown of the three. The g9 bar was written for
a 3D albedo rendered under the stage light, not for painted pixels on a cream ground under a multiply grade. **Decision
needed (main loop / owner):** either grade 2D skin to the swatch and accept a cooler look, or redefine the 2D check as
"measured inside the jharokha grade, C* within a band" and set that band by eye on a phone. I recommend the half-way grade
for whichever face ships, re-measured inside the window.

## 6. Which one I would ship, and why

**Option 1, grown-up painted, gated by a two-day rig test.**

- It is the only face whose blind age reads centre on the brief's "clearly 30 to 40". The ranges were 25-40, with
  four of five starting at 25 or 28 and ending at 35-40. Option 4 never goes above 35. Option 3 goes to 50.
- It is the most direct answer to the owner's words ("show me that face": a grown-up face). The audit's cause 1 is a face
  that is not credible as an adult teacher. This is the most credible adult teacher on the page.
- The voice is exactly human. TEACHER-VISUAL §4.2 argues that a more human face *reduces* the voice-face mismatch, and
  that the risk moves into motion. That is where the gate goes.
- Identity holds 5/5 across the six frames. It is never childish or sexualised (0/5), and it reads Indian 5/5.

**What is weak about this choice, plainly.** It is the hardest face here to animate, and the r8 rig's two known gaps
(turns that do not re-light; open mouths that do not move the cheeks like soft volume, JUDGE-r8) both get *harder* with
painted texture and baked light. If the paint smears or she reads like an animated photograph, she is worse than a
good flat face. So the gate is concrete (RIG-NOTES §5). Rig only the eyes (blink, gaze), six mouths and a ±10° turn,
render them at the 90 × 117 lesson slot and at 250 px, and show the owner a 10-second clip. If it fails, switch to
**option 4**: its flat shapes are what today's cutter and membrane fill were built for, and it suits the world best,
but it needs a second front with stronger age cues first. **Option 2** is the right pick if the owner wants
stylisation. It rigs nearly as easily as option 4 and reads older, but it is cooler. **Option 3** should not ship as
the face. Its place is the cheapest fallback (tier D or E) or a first-run "drawing in" moment.

## 7. Limits (what this cannot tell anyone)

- A vision model's opinion is a proxy. Neither the owner, a child nor a parent has seen these faces.
- These are stills. Nothing was rigged. Every claim about motion is a forecast from the r1-r8 puppet history.
- No phone was used. The slot views are Chromium at DPR 2 (`shots/`).
- The skin numbers come from 4 patches on one front per family. Painted light is baked into them, so they mix albedo
  and lighting, as g9's render measurement also does.
- No resemblance check against public figures was run (TEACHER-VISUAL H2 asks for one before shipping).

## 8. Proposed `context/` entries (for the main loop to merge; this agent writes only `docs/design/round4/face/`)

- **measurement `r4-face-blind-2026-10-10`**: n = 5 per front (gpt-5.6-sol ×3, Kimi K2.6 ×2), blind single-image questionnaire
  (`source/blind.mjs`). Childish 0/5 for all four options and 5/5 for today's chibi. Sexualised 0/5 for all. Age reads:
  painted 25-40, anime 25-38, line 30-50, flat 25-35. Identity across six frames 5/5 for all four (scores 5 except line
  4, 5, 4, 5, 5).
- **measurement `r4-face-skin-2026-10-10`**: 4 patches per front, linear mean → L*a*b* against MST 6 (L* 55.1, C* 27.9).
  Painted ΔL* +13.9 / ΔC* +21.1; anime +5.5 / +24.1; flat +7.6 / +32.4; today's chibi +14.1 / +26.4. A full grade to the
  bar reads ashy; a half grade (C* ≈ 37) reads natural (by eye, n = 1 viewer).
- **rejection `rj-realistic-identity-block-overrides-style`**: tried a realistic identity description (fine lines,
  folds, asymmetry) with style words for anime and stylised. It broke (counted by eye): 0/2 anime fronts came back as anime, and 6/6 stylised
  fronts came back semi-real. Instead, describe the identity in the style's own terms. Reverse if a model follows
  style words over identity text.
- **rejection `rj-side-glance-thinking-frame`**: tried edits asking for a sideways thinking glance with drawn-together brows.
  They broke: "sceptical / disapproving side-eye" in 3/3 blind runs for three of four families, which is a verdict leak.
  Instead, eyes up, level brows, soft lips. Even then 1/3 runs call the upward glance a mild eye-roll, so timing in the
  rig matters.
- **rejection `rj-g9-bar-on-painted-2d`**: tried grading painted skin to the g9 bar (|ΔL*| ≤ 3, |ΔC*| ≤ 4 against the MST hex).
  It broke: ashy, grey skin on the cream lamplight. Instead, the 2D target needs its own definition (§5). Reverse if a phone
  look-test prefers the full grade.
- **decision (proposed) `r4-face-option1-gated`**: the owner's pick decides. My recommendation is option 1 behind the
  two-day rig gate, with option 4 as the fallback. Reverse if the gate clip smears or reads as an animated photograph,
  or if the owner prefers 2 or 4 on sight.
