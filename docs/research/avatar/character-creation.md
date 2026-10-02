# Character creation for the Taxila 3D tutors

Date: 2026-10-02. Question: how do we make 4-6 original Indian tutor characters as rigged 3D heads/busts with
ARKit-52 blendshapes and visemes, which art style should they use, and what production pipeline can agents run
with headless Blender? The tutors span looks, genders, ages 22-45 and the didi/bhaiya/ma'am/sir roles. The pipeline
must cover licensing, and the result must run in a browser and in an Android WebView on ₹10k phones.

Evidence tags (same scheme as `../tech-and-market.md` and `audio-to-face-ml.md`):
- **[V]**: verified from a primary source I read: the licence text, repository source, README, vendor page or paper abstract.
- **[M]**: measured in this session by the prototype in `character-pipeline-proto/`, with n and method stated.
- **[S]**: secondary source or vendor claim, not reproduced.
- **[U]**: unverified. This covers my estimates and anything recalled but not re-read this session.

Builds on:
- `audio-to-face-ml.md` §5.1. The `FaceFrame` protocol (ARKit-52 + head + gaze + state) is the contract these characters must satisfy.
- `../tech-and-market.md` §2. It recommended 2D Rive for v1 and flagged the Ready Player Me closure (2026-01-31).
- `../../harvest/companion-tech.md` §13. Lip-sync is slaved to the playback clock, nothing renders on the audio thread, and any audio-path change re-runs echosim.
- `../design/kids-ux-ages.md` §11. It recommended an illustrated face; the owner has now explicitly chosen 3D, and §2 below reconciles the two.

Search-budget note: this session's WebSearch quota was exhausted on the first call. Every claim below comes from a
URL fetched directly, a repository cloned and read, or a measurement. Where neither was possible, the claim is
tagged [U] and the place to verify it is named.

---

## 0. TL;DR: the findings that change decisions

1. **Use stylised 3D, not photoreal 3D, and treat realism as one dial set per age band.**
   - Children older than about 9 find a human-like agent creepier than a machine-like one; younger children do
     not (Brink, Gray & Wellman 2019, n=240, ages 3-18) **[V]**. Classes 5-9 sit right on that boundary.
   - A mismatch between face realism and voice realism is itself eerie. In Mitchell et al. 2011 (n=48), both
     mismatched conditions were rated eerier than both matched ones, with interaction η²=0.44 **[V]**.
   - Our voice is "exactly human", so the face cannot simply be dialled down to cartoon. It must be
     **human-proportioned with stylised surfaces**, and its **motion quality must match the voice**.
   - So the target is "feature-animation stylised" (S2 on the §2.3 scale). That means believable anatomy, a mildly
     enlarged eye region and simplified skin. It does not mean big-head chibi, and it does not mean pores and peach fuzz.
2. **All characters share one base topology. Without it, the per-character work does not scale.**
   - Build every tutor on the **MPFB/MakeHuman base mesh**:
     - its assets and output are **CC0**, and its code is GPLv3 but used offline only **[V]**;
     - it is 19,158 vertices, of which 13,380 are body and about **4,050 are head** **[M]**;
     - it runs headless: a parametric human is created in **1.3 s** in the `bpy` 4.2 module **[M]**.
   - Each character is then a **sculpted delta** on that shared mesh. ARKit-52 and the 15 visemes are authored once
     and **re-baked through each character's stylisation**.
3. **Re-bake shape keys through the stylisation; never copy the deltas across.**
   - Measured on the ICT FaceKit head: enlarging the eyes ×1.15/×1.3/×1.5 and then adding the *original* blink delta
     leaves **1.3% / 3.4% / 8.1%** of the cornea visible through "closed" lids.
   - Baking the same warp into every shape key leaves **0.0%** **[M, n=1 head, 236 rays per eye, §6]**.
   - A child sees "her eyes didn't shut" on every blink, about 15 times a minute. This is the single most visible
     stylisation bug, and the pipeline gate catches it automatically.
4. **Decimating a finished realistic head does not produce a mobile character.**
   - The ICT head (26k verts) was decimated to 6.7k and 3.3k verts, with its shapes transferred by closest-point projection.
   - At blink=1, **10.7% / 3.7%** of the cornea stayed visible **[M]**, and lid and lip edge loops were destroyed.
   - Low-poly characters need **authored topology with lid and lip loops**, which MPFB provides, plus per-character correctives.
5. **The export pitfalls are large, and the gate must check them on every build.**
   - The default glTF export of an OBJ-imported head produced **102,530** GPU vertices from 25,959 mesh vertices,
     because custom split normals split every corner. Clearing them gave **27,956** **[M]**.
   - three.js r186 stores morph targets as a Float32 RGBA `DataArrayTexture` of `verts × slots × morphs × 16 B` **[V source]**.
     For 67 morphs, that means:

     | mesh | morph texture |
     |---|---|
     | 102k verts (split normals) | **110 MB** |
     | 28k verts | **30 MB** |
     | 7.9k verts | **8.4 MB** |
     | 4.1k verts | **4.4 MB** |

     All figures [M]. Morph normals double this.
   - The budget for a ₹10k phone is **≤ 6k face vertices, position-only morphs, ≤ 2.5 MB GLB** (§7).
6. **Image-to-3D generators (Meshy, Tripo, Hunyuan3D 2.1, Rodin, TRELLIS.2) are for props, hair blockouts and
   concept checks, not for faces.**
   - They emit fused, closed-mouth meshes with no lid, lip or mouth-interior topology [U, structural]. That leaves
     nothing to hang ARKit shapes on without a full retopology.
   - Licences differ sharply:
     - TRELLIS.2 is **MIT** **[V]**.
     - Hunyuan3D 2.1 **excludes the EU, UK and South Korea**, forbids using its outputs to improve other models, and
       requires a separate licence above **1M MAU** **[V]**.
     - Meshy's free tier is **CC BY 4.0**; paid tiers own their assets **[V]**.
7. **Several pipelines do not fit:**
   - **Photo→avatar services (Avaturn, Avatar SDK/MetaPerson).** They need a real person's face. That brings likeness
     and consent problems, and their output stays photoreal. Avaturn is free for non-commercial use only; PRO costs
     $800/mo **[V]**.
   - **MetaHuman.** It is realism-first and joint-driven, so it is the wrong art direction and the wrong weight class for a ₹10k phone.
   - **VRoid.** Its output is anime-styled with 5 mouth presets, and it would need ARKit conversion.
   - **Character Creator.** Shipping CC stock content in "online interactive services" needs Reallusion's
     **Extended License** **[V]**.
   - The clean chain is **MPFB (CC0) + our own sculpts + our own textures**, with ICT FaceKit (**MIT** **[V]**) as an
     expression-quality reference.
8. **The cast is bounded by voices, not by art.**
   - Each character needs a voice that passes the blind "human and Indian" ear test, and whose apparent age and
     gender match the face. A mismatch is the Mitchell effect.
   - The realtime catalogue has 10 voices, and the voice docs single out `marin` and `cedar` for quality.
   - Design **4 launch characters**, with 2 more in wave 2 only if two more voices pass. Fix every character's voice
     before any sculpting starts.

---

## 1. What a "character" must deliver (the contract)

| requirement | value | why |
|---|---|---|
| Face channels | ARKit-52 exact names in canonical order, plus Meta/Oculus 15 visemes (`viseme_sil … viseme_U`) | `FaceFrame.bs` is ARKit-52 (`audio-to-face-ml.md` §5.1); TalkingHead requires ARKit + Oculus visemes + a Mixamo-compatible rig **[V README]** |
| Extra keys | `mouthOpen`, `mouthSmile`, `eyesClosed`, `eyesLookUp`, `eyesLookDown` optional (TalkingHead derives them) **[V]** | compatibility |
| Rig | Mixamo-compatible bone names, root `Armature`; head, neck, spine1-2 and shoulders at minimum for a bust | TalkingHead pose and gesture templates **[V]** |
| Eyes | separate eyeball meshes, rotated by bones *and* `eyeLook*` shapes for lid follow | gaze in `FaceFrame.gaze`; lid follow on look-down sells "real" |
| Mouth interior | teeth (upper and lower), tongue, gum, dark mouth-socket | visemes `TH`, `DD`, `FF` show teeth and tongue (QA sheet, §6) |
| Framing | bust (head + shoulders + upper chest), seen from mid-chest up | most phones show 360×360-ish CSS px; hands are out of frame, so no finger rig |
| States | idle, listening, thinking, speaking, plus the Director's expression programs | `audio-to-face-ml.md` §6; these are runtime, not assets, but every shape they use must exist and look good |
| Delivery | one `.glb` per character, meshopt-compressed, KTX2 textures, plus a 2D portrait (WebP) for the picker | §7 |

---

## 2. Stylisation: what level of realism, and why

### 2.1 Evidence

| finding | source | implication for Taxila |
|---|---|---|
| Children older than 9 rate a very human-like robot creepier than a machine-like one; younger children do not. Creepiness tracks perceived *mind*. | Brink, Gray & Wellman 2019, *Child Development*, n=240, ages 3-18 **[V abstract]** | Classes 5-9 (ages ~10-15) are the risk group. A great voice tutor projects a mind, so it raises the stakes. |
| Mismatched face/voice realism is eerie: robot face + human voice, and human face + synthetic voice, both rated eerier than matched pairs (η²=0.44) | Mitchell et al. 2011, *i-Perception*, n=48 adults **[V]** | An exactly-human voice argues *against* a crude cartoon face. The face must read as a person, but stylised. |
| Duolingo animates characters in Rive with "20+ mouths" per character, with viseme designs that "followed their unique personalities". The most critical part was that visemes "looked believable when animated". | Duolingo blog **[V]** | Mouth believability beats surface realism. Budget the art time on mouths. |
| Khan Academy Kids: Kodi Bear and other 2D animals, gestures carry meaning | `../design/kids-ux-ages.md` **[V there]** | Under-9 products avoid human faces entirely. |
| Synthesis Tutor's product page shows no tutor face | synthesis.com/tutor **[V page; U whether the app has one]** | The best interactive tutor sells warmth through voice and manipulatives. |
| Praktika: four named AI tutors (Tama, Raven, Skye, Noah), user-selectable, presented as stylised characters on the site | praktika.ai **[V page]** | Tutor choice is a proven pattern in AI-tutor apps. |
| Shape stylisation drives perceived realism more than material does; realistic materials on stylised shapes can reduce appeal | Zell et al. 2015, "To stylize or not to stylize?", ACM TOG 34(6) **[U, recalled; the ACM page returned 403]** | Keep **materials as stylised as shapes**: hand-painted albedo, no pore normal maps. |

### 2.2 Reconciling with `kids-ux-ages.md` §11

That doc recommended an illustrated (2D) face for every band until measurement M-UX-6. The owner has chosen 3D.
The evidence does not forbid 3D. It forbids *near-photoreal human* faces for older children, and *realism
mismatches*. A stylised 3D character sits where Pixar and DreamWorks characters sit: human voice actors, human-legible
anatomy, stylised surfaces. Audiences of every age accept that combination **[U, industry practice; no controlled
child study found this session]**. The doc's caveat still applies: measure creepiness by age band before
launch (M-AV-1, §10).

### 2.3 The realism dial (pick S2, test S1 and S3)

| level | eyes (vs real) | head:body | skin | hair | reference feel | use |
|---|---|---|---|---|---|---|
| S0 | ×1.6+ | 1:3 | flat colour | solid shell | chibi / toy | rejected: reads as "for babies" to Class 5-9 [U] |
| S1 | ×1.3 | large head | painted gradients, no texture detail | sculpted clumps | preschool feature animation | test arm for classes 1-4 |
| **S2** | **×1.15-1.2** | **slightly large head, real proportions** | **painted albedo, soft fake-SSS, no pores** | **card clumps with painted strands** | **mainstream feature animation** | **default for all bands** |
| S3 | ×1.0-1.05 | real | scanned-detail-lite, light normal map | cards | stylised game hero | test arm for classes 7-9 |
| S4 | ×1.0 | real | photoreal | strand | MetaHuman | rejected for v1 (§0.1); revisit with video avatars in v2 |

Rules for S2, all checked by the gate or by an art-director review:
- **Mouth and eyes get the polygons, the art time and the correctives.** Brows must be thick enough to read at 64 px.
- **No visible teeth at rest; teeth slightly simplified** (no individual gaps). The tongue only shows in TH, DD and L.
- **Lighting is a fixed three-point rig baked into the material response**, not scene-lit, so a ₹10k GPU runs one
  unlit-plus-matcap or a cheap MeshStandard pass (§7).
- **Do not name a studio in prompts or briefs** ("in the style of Pixar"). Describe the qualities instead. A
  style is not copyrightable, but trade dress and model-provider policies make named-studio prompts a needless risk [U].

---

## 3. Art direction: the cast

### 3.1 Principles

1. **Address terms are roles, not just names.** "Didi" and "Bhaiya" mean an elder sibling or young mentor (22-26).
   "Ma'am" and "Sir" mean a classroom teacher (30-45). The child picks the relationship as much as the face. The
   voice docs' register rules (tum/aap) attach to the role.
2. **Skin tones span the real Indian range, and the picker never orders them light-to-dark.**
   - Use the **Monk Skin Tone (MST) scale**, Google with Dr Ellis Monk: 10 tones, an "open licensed tool" **[V site]**.
     Cover MST 4-9. At least half the cast is MST 6 or darker.
   - Each character's albedo is measured under the neutral QA light. The gate checks that the mean skin L* sits
     inside the target MST band (§5, G9), so a texture pass cannot quietly lighten anyone. Colourism in Indian media
     is the known failure mode [S, widely documented].
   - The MST hex swatches are not in the page bundle I fetched. Take them from skintone.google before use [U].
3. **Attire is everyday-Indian-professional, and modest without being severe.** Cotton saree, salwar-kurta,
   kurti over jeans, half-sleeve shirt, kurta, sweater-vest, cardigan. Nothing branded, no slogans. No
   school-uniform look for adults.
4. **Religious and community markers are part of a person, not a costume.**
   - Bindi, turban (dastaar), kara, hijab, cross pendant and similar markers appear only where they belong to the character.
   - Each one is reviewed by people from that community before it ships (§9).
   - No marker is ever used as a quick signal of "diversity".
5. **Each character is told apart at a glance.** A 64 px silhouette (hair shape + garment line + one accessory) and a
   signature colour must identify each one. The picker works for pre-readers.
6. **Personality goes in the face parameters, not in sentence-shaped text.** Each character has a runtime
   `faceStyle`: smile amplitude, blink rate, head-motion gain, brow expressiveness and idle gaze habits. The
   portfolio's rule against reciting prompt sentences applies to persona text. The face equivalent is: **no canned
   animation clips with "signature" lines**.
7. **No glamour.** Adult proportions, minimal make-up, no idealised bodies, and natural hairlines with a little
   grey on the 40+ characters. The characters are teachers, not influencers.

### 3.2 The cast: 4 at launch, 2 in wave 2 (chosen from 3 options)

Each row is a design brief for concept art. All names are invented and must be checked against real public
figures and trademarks before use (§9).

| # | name / address | age, gender | MST | look and attire | silhouette hook | faceStyle (runtime) | voice slot (§0.8) | default fit |
|---|---|---|---|---|---|---|---|---|
| 1 | **Anaya Didi** | 23, F | 6 | kurti over jeans with a denim jacket or cardigan; high ponytail; small studs | ponytail + jacket collar | smile 0.8, blink 17/min, head gain 1.1, brows lively | female voice A | classes 1-5, all subjects |
| 2 | **Kabir Bhaiya** | 25, M | 7 | half-sleeve check shirt over a plain tee; curly hair; round glasses | curls + round frames | smile 0.7, head gain 1.2, quick nods | male voice A | classes 3-8, science and maths |
| 3 | **Nandini Ma'am** | 34, F | 8 | handloom cotton saree with a thin contrasting border; low bun; wristwatch; optional small bindi | bun + saree pallu on the shoulder | smile 0.55, blink 14/min, calm head (0.8), expressive brows | female voice B | classes 4-9, maths |
| 4 | **Arjun Sir** | 42, M | 5 | plain kurta, or formal shirt with rolled sleeves; salt-and-pepper side hair; trimmed beard; rectangular glasses | glasses + beard edge | smile 0.6, slow head (0.7), long eye contact | male voice B | classes 5-9, social science and English |
| W2-a | **Zoya Ma'am** | 29, F | 6 | salwar-kameez with a draped dupatta; side braid | dupatta + braid | smile 0.7, warm brows | female voice C | languages, EVS |
| W2-b | **Harpreet Sir** | 45, M | 5 | dastaar (turban) + full beard; sweater-vest over a shirt | turban shape | smile 0.65, slow head | male voice C | maths and physics |
| W2-c | **Siami Didi** (Lalremsiami) | 25, F | 4 | Mizo-inspired woven shawl over a sweater; short bob | bob + shawl stripes | smile 0.75 | female voice C | English and science |

Design notes:
- **Ages 22-45 are covered** (23, 25, 34, 42, plus 29/45/25 in wave 2), as are both genders and four roles.
- **North-East Indian and Sikh representation** both sit in wave 2 because each needs community review and a voice
  slot. Swap W2-c into the launch set if user research shows more demand from NE states [U].
- **Turbans and saree pallus are rigid or skinned meshes, not cloth simulation.** That costs nothing at runtime. Long
  open hair is avoided because hair cards are the costliest asset to make look good at S2.
- **Do not give any character a subject stereotype on screen.** "Fit" is only a default recommendation in the picker.
- **Do not reuse "Meera".** It is the portfolio's companion product, and a shared name would blur two products.

### 3.3 Per-character deliverables (the art bible page)

For each character, the concept stage produces the following, and the art director signs it off before any 3D work:
- a front/¾/profile turnaround;
- an expression sheet: neutral, smile, big smile, thinking (gaze up-left, lips pressed), listening (soft brows, slight
  head tilt), surprised, concerned, proud;
- a mouth sheet: the 15 visemes drawn on that face;
- a colour script: skin MST, hair, garment, signature colour;
- a 256 px portrait for the picker.

---

## 4. Pipeline options compared

| route | licence for a paid kids' app on web | ARKit-52 + visemes | topology fit for facial animation | Indian looks / S2 style | web weight | verdict |
|---|---|---|---|---|---|---|
| **MPFB 2 (MakeHuman) in Blender** | assets CC0; output unrestricted; code GPLv3 used offline **[V]** | "Faceunits 01" (ARKit) and "Visemes 02" (Meta) asset packs; the TalkingHead guide uses them **[V]** | animation-ready quad base with lid and lip loops; 4k-vert head **[M]** | ethnicity sliders are African/Asian/Caucasian only **[V sample]**, so South Asian looks come from sculpting | light | **use: shared base topology for every character** |
| **ICT FaceKit (Light)** | **MIT** **[V]** | 53 ARKit-named expressions (L/R split; no `tongueOut`) **[V]** + 100 identity PCA modes | realistic scan topology, 26.7k verts; face region 9.4k **[V/M]** | realistic only | heavy | **use as a reference and donor** for expression quality (shape timing, smile anatomy); not shipped as-is |
| **Faceit (Blender add-on, paid)** | per-seat tool; output ours [U] | semi-automatic ARKit-52 + 21 Microsoft visemes; TalkingHead has a script mapping these to 15 Oculus visemes **[V]** | works on any mesh after landmarks | n/a | n/a | **use for artist correctives** if MPFB face units are not good enough; it is interactive, so it stays a human step |
| **Polywink (service)** | commercial | "Blendshapes On Demand" €499: 157 FACS shapes, under 24 h, "cartoon to photorealistic" **[V page]** | any | n/a | n/a | **fallback** if correctives stall; 6 × €499 ≈ €3k |
| **VRoid Studio → VRM** | creators set their own terms; pixiv's preset assets have their own terms **[V]** | VRM 1.0 presets are `aa ih ou ee oh`, blink and 5 emotions **[V spec]**; ARKit needs conversion (TalkingHead scripts; "some ARKit shape keys not yet implemented" **[V]**) | good | anime style, wrong for S2 Indian teachers | light | **no**, style mismatch; but VRM's `overrideMouth`/`overrideBlink` conflict rules **[V]** are worth copying into our compositor |
| **Image→3D: TRELLIS.2** | **MIT** (deps nvdiffrast/nvdiffrec carry their own licences) **[V]** | none | triangle soup from O-Voxel; 4B params; ~3 s at 512³, ~17 s at 1024³ on H100; needs a ≥24 GB GPU **[V]** | good concept fidelity | heavy until retopologised | **props, accessories, hair blockouts only** |
| **Image→3D: Hunyuan3D 2.1** | Tencent licence: Territory excludes EU/UK/South Korea; outputs may not improve other models; >1M MAU needs a licence; AUP requires labelling machine-generated content placed in public **[V]** | none | as above; shape model 3.3B, paint 2B; 10 GB VRAM shape / 29 GB total **[V]** | good | heavy | **avoid for shipped assets** (territory and MAU clauses); concept checks only |
| **Meshy (SaaS)** | free tier **CC BY 4.0**; paid tiers "own all assets" **[V]** | auto-rig (body) only **[V]** | triangle soup | good | heavy | props on a paid plan only |
| **Tripo (SaaS) / UniRig** | Tripo pricing page 403 to fetch **[U]**; UniRig code MIT **[V]** | body rigging only (skeleton + skin weights) **[V]** | n/a | n/a | n/a | UniRig is useful for auto-skinning garments and props |
| **Rodin / Hyper3D (SaaS)** | Creator $30/mo, Business $120/mo; "ChatAvatar commercial license" on Business **[V page]** | ChatAvatar face product [U whether ARKit-52 is included] | quads on Business ("High-Poly Quads") **[V]** | realistic-leaning | medium | **optional spike**: a ChatAvatar face as a wrap target; check its licence text first |
| **Avaturn (photo→avatar)** | free non-commercial; commercial requires notifying them plus extra terms **[V TalkingHead README]**; PRO $800/mo, 1,000 avatars **[V]** | T2 avatars are TalkingHead-compatible **[V]** | good | needs a real person's photo, so likeness consent; photoreal | light | **no**: original characters, not people |
| **Avatar SDK / MetaPerson** | commercial service; pricing not public **[V page]** | TalkingHead has rename scripts **[V]** | good | photo-based, photoreal | light | **no**, same reason |
| **Character Creator 4/5 (Reallusion)** | Standard licence allows "export content to any external software or game engine"; **Extended License required for "mass character outputs" in "commercial games, XR projects and online interactive services"**; no redistribution **[V]** | CC exports ARKit-compatible expression sets [U] | excellent | stylised packs exist [U] | medium-heavy | **viable but encumbered**; get a Reallusion licensing answer in writing first |
| **MetaHuman** | Epic changed the licence in mid-2025 to allow use outside Unreal [U; Epic pages returned 403 or a login wall this session] | joint-based RigLogic face; ARKit mapping exists for Live Link; blendshapes must be baked [U] | excellent, realistic | S4 only | very heavy (strand hair, 8k textures) | **no** for v1 (wrong style, wrong weight); revisit for the v2 video-real tier |
| **Microsoft Rocketbox** | MIT; includes ARKit + Oculus shapes; needs re-rigging **[S, TalkingHead README]** | yes | good, realistic | few Indian looks [U] | medium | reference only |
| **Ready Player Me** | closed 2026-01-31 **[S]** | n/a | n/a | n/a | n/a | gone |

---

## 5. The production pipeline ("character factory")

Agents run every step that has a deterministic check. Humans own taste: concept approval, sculpt, correctives
sign-off and community review. Headless Blender is the `bpy` 4.2 wheel from PyPI (`pip install bpy==4.2.0`),
which works with no display **[M]**. A pinned Blender 4.2 LTS binary run as `blender -b -P script.py -- args` works
equally well.

```
S0 brief.json ─► S1 concept (2D) ─► S2 base (MPFB) ─► S3 sculpt delta ─► S4 expression bake ─► S5 correctives
     │                │ human ✔          agent            human (artist)       agent                human + agent QA loop
     ▼                ▼
S6 hair/garments/accessories ─► S7 textures ─► S8 rig+skin ─► S9 export+compress ─► S10 gates ─► S11 runtime config
     human + agent (AI 3D for props)   human+agent      agent          agent               agent (+vision review, human ✔)
```

### 5.1 Stage by stage

**S0 Brief (agent).** Write `characters/<id>/brief.json`:
```json
{ "id": "nandini", "display": "Nandini Ma'am", "role": "maam", "age": 34, "gender": "f",
  "mst": 8, "styleLevel": "S2", "voice": "TBD-after-ear-test", "signatureColor": "#B5476B",
  "attire": ["cotton-saree-thin-border", "wristwatch"], "markers": ["small-bindi-optional"],
  "faceStyle": { "smileGain": 0.55, "blinkPerMin": 14, "headGain": 0.8, "browGain": 1.1 },
  "budgets": { "faceVerts": 6000, "totalTris": 25000, "glbBytes": 2500000, "textures": 3 } }
```

**S1 Concept (agent drafts, human approves).**
- An image model produces turnarounds, expression sheets and mouth sheets from the brief, using descriptive prompts with no studio names.
- The art director picks one and annotates it. The outputs must come from a provider whose terms assign them to us;
  record the provider and terms version in `provenance.json`.
- An agent cannot judge "warm but not saccharine". **This is the main human gate.**

**S2 Base (agent, headless).**
- Create the human with MPFB `HumanService.create_human()` and set the macro sliders (gender, age, weight, muscle,
  proportions) from the brief. This takes **1.3 s** **[M, e5]**.
- Load MPFB's face units and visemes packs; that step is not measured here because the packs are a separate
  download **[V TalkingHead MPFB guide]**.
- Save `base.blend`. Delete the body below the upper chest for bust characters, and keep the helper geometry for
  eyes, teeth and tongue.

**S3 Sculpt delta (human artist, about 2-4 days per character [U]).**
- Sculpt the S2 face on the MPFB topology in Blender, matching the concept. Store it as a single shape key
  `identity` on the base, never by editing the base. Topology stays identical across the cast.
- Optional agent pre-pass: a landmark-driven smooth warp (lattice or RBF) fitted from 2D landmarks on the concept
  front and profile. It gets the artist to about 70% faster [U].

**S4 Expression bake (agent).**
- Turn each ARKit/viseme key *k* into `identity(neutral + δk)`, not `identity(neutral) + δk`. In practice, evaluate
  the identity deformation (sculpt shape key, plus lattice or Surface-Deform if used) with key *k* active, and read
  the evaluated coordinates back as the new key.
- **Why:** measured, naive delta transfer leaks 1.3-8.1% cornea at blink=1 under eye scaling, while baking leaks
  0.0% **[M, e2]**.
- Then derive the 15 visemes from ARKit mixes (`arkit.py` has the first-pass recipe) and store them as real shape
  keys. They are tuned per character in S5.

**S5 Correctives (agent renders, human fixes).**
- The agent renders a **contact sheet**: 9-24 poses at 320 px, Cycles CPU, about 3 s per pose on 4 cores **[M, e4]**
  (`results/qa_sheet.png`).
- A vision-capable agent reviews it against the concept mouth sheet and the gate numbers, and flags issues:
  "PP lips not sealed", "smile asymmetric", "FF shows no upper teeth".
- The artist fixes the flagged shapes, using Faceit or plain sculpt on shape keys. The loop runs until G1-G8 pass and the art director signs off.

**S6 Hair, garments, accessories.**
- Hair is cards or shells, sculpted and authored by hand. AI image→3D can block out the bun, turban or saree pallu
  volume (TRELLIS.2, MIT), and the artist then retopologises it to under 3k tris.
- Garments are MPFB clothes (MHCLO, CC0) as a fitting base, then modelled per the concept.
- Accessories (glasses, watch, earrings, pen) come from AI 3D (TRELLIS.2 local, or Meshy on a paid plan), then
  agent decimation with `Decimate`, which is fine here because these meshes have no shape keys.
- UniRig (MIT) can propose skin weights for garments; a human checks them.

**S7 Textures.**
- Hand-painted S2 albedo at 1024² for the face, 1024² for garments and 512² for hair and eyes. Use a matcap-friendly
  roughness, with no pore normals.
- AI-assisted painting is allowed, but the **skin-tone gate G9** runs on the result.

**S8 Rig (agent).**
- MPFB adds the custom TalkingHead rig, `talkinghead.mpfbskel` + `.mhw` **[V guide]**. Apply transforms, fix bone
  rolls (A-pose), and name the root `Armature`.
- Bust characters keep the spine, neck, head, eyes, jaw and shoulder bones. Delete the finger and leg bones.

**S9 Export (agent).**
```python
bpy.ops.mesh.customdata_custom_splitnormals_clear(); bpy.ops.object.shade_smooth()   # 102,530 → 27,956 GPU verts [M]
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True,
    export_morph=True, export_morph_normal=False,      # morph normals: 136 MB vs 51 MB raw on the ICT head [M]
    export_animations=False, export_skins=True, export_apply=False)
```
```bash
gltf-transform meshopt  in.glb  m.glb          # 4.05 MB → 0.82 MB on a 7.9k-vert, 67-morph head [M]
gltf-transform uastc / etc1s  m.glb  out.glb   # KTX2: UASTC for the face albedo, ETC1S for garments/hair [U sizes]
```
TalkingHead's development version supports meshopt **[V MPFB guide]**. Confirm this against the version we pin.

**S10 Gates (agent).** These are all automatic, and any red gate blocks the build:

| gate | check | pass bar |
|---|---|---|
| G1 names | the 52 ARKit names + 15 viseme names exist, exactly spelled, none extra on the face mesh | 67/67 |
| G2 non-empty | every key except `viseme_sil` moves at least one vertex by ≥ 0.2 mm; `tongueOut` included (ICT has none, so it is authored) | 66/66 |
| G3 symmetry | `XLeft` mirrored ≈ `XRight` (Hausdorff ≤ 0.5 mm after mirroring) | all L/R pairs |
| G4 lid seal | at `eyeBlinkL/R=1`, ray test from the eyeball centre through cornea vertices: escaped rays | **0.0%** (method in `e2_stylise.py`) |
| G5 lip seal | at `viseme_PP=1` and `mouthClose+jawOpen(0.3)`, the upper-lip and lower-lip contact loops are within 0.3 mm | all loop pairs |
| G6 no intersections | at each viseme, teeth do not poke through lips; eyelids do not pass through eyeballs at `eyeLook*` extremes | BVH overlap = 0 |
| G7 budgets | GPU vertices (post-split) ≤ 6k on the face mesh, total tris ≤ 25k, morph texture ≤ 7 MB, GLB ≤ 2.5 MB, ≤ 6 draw calls | all |
| G8 no split blow-up | GPU vertices / Blender vertices ≤ 1.3 | catches the 3.95× normals bug **[M]** |
| G9 skin tone | mean L* (CIELAB) of the skin albedo, sampled on cheek/forehead masks under the QA light, sits inside the MST band in `brief.mst` | inside band |
| G10 provenance | every source asset has a licence entry (CC0 / MIT / ours / paid-tier SaaS with terms URL + date) | 100% |
| G11 runtime smoke | headless Chromium + three.js loads the GLB, plays a 10 s FaceFrame track, renders 30 frames, and compares to golden PNGs (SSIM ≥ 0.97) | pass |

**S11 Runtime config (agent).** Emit `characters/<id>/runtime.json`. It holds the `faceStyle`, TalkingHead `baseline`
offsets (head tilt, eyelid rest), the portrait URL, the signature colour, the voice id and the address term. The
compositor in `audio-to-face-ml.md` §5.3 reads `faceStyle` gains. No per-character code.

### 5.2 Who does what, and how long it takes

| stage | owner | per character | notes |
|---|---|---|---|
| S0, S2, S4, S8-S11 | agents (Sonnet or Opus fan-out, per the model policy) | minutes of compute | scripts in `character-pipeline-proto/` are the seed |
| S1 concept | agent drafts, art director picks | 1-2 days of iteration [U] | the main taste gate |
| S3 sculpt | 3D character artist (contract) | 2-4 days [U] | on MPFB topology |
| S5 correctives | artist + agent loop | 1-2 days [U] | the loop is mouth-first |
| S6-S7 hair, garments, textures | artist + agent | 3-5 days [U] | hair is the long pole |
| community and parent review | humans | 1 week, parallel | §9 |

Total: about **2-3 artist-weeks per character** [U], so about 8-12 for the launch four. At typical Indian freelance
character-artist rates this is a modest one-off. Get quotes, because these are not estimates I measured.

---

## 6. What the prototype measured (provenance for §0 and §5)

All runs: 2026-10-02, `bpy` 4.2.0 (PyPI wheel) on Linux with 4 vCPU and no GPU, gltf-transform 4.5.1, and three.js
r186 source for the memory formula. Scripts and JSON are in `character-pipeline-proto/` and `results/`. To
reproduce, `git clone` ICT-FaceKit and mpfb2 next to the scripts, then run `pip install bpy==4.2.0`.

**E1: ICT FaceKit head → ARKit-52 + 15 visemes → GLB (`e1_build.py`).**
- The neutral mesh has 26,719 vertices and 26,384 faces, in centimetres.
- 51 of the 52 ARKit shapes map directly from ICT's 53. `browInnerUp` and `cheekPuff` are summed from their L/R
  halves. `tongueOut` is missing and must be authored.
- The build took 9.0 s.
- Sizes:

  | build | raw GLB |
  |---|---|
  | with morph normals | **135.9 MB** |
  | without morph normals | **51.4 MB** |
  | trimmed of helper geometry | 49.6 MB |

- The glTF had **102,530** vertices against 25,959 in Blender. The cause was OBJ custom split normals.
- `mouthClose` alone moves vertices by up to 4.2 cm, because ARKit defines it relative to `jawOpen`. It is a
  corrective, and the compositor must never fire it without jaw.

**E2: stylisation safety (`e2_stylise.py`).**
- Method: a Gaussian-falloff radial enlargement of both eye regions (radius 2.2 cm) at scales 1.15, 1.3 and 1.5.
- Metric: the share of rays, cast from the left eyeball centre through its forward 15% of vertices (236 rays),
  that escape the face/lid surface at `eyeBlinkLeft=1`.
- Baselines: open eye 97.0%, blink 0.0%.

| eye scale | open | naive (W(neutral) + δ) | baked (W(neutral + δ)) |
|---|---|---|---|
| 1.15 | 97.0% | **1.3%** | **0.0%** |
| 1.3 | 97.0% | **3.4%** | **0.0%** |
| 1.5 | 97.5% | **8.1%** | **0.0%** |

n = 1 head and one warp family. The baked result is exact by construction: a continuous warp maps coincident points
to coincident points. So the effect generalises to any warp-type stylisation. It does not generalise to free
sculpting that moves lids independently, which is why G4 runs on every build.

**E3: decimate + transfer (`e3_lowpoly.py`).**

| mesh | Blender verts | GPU verts | tris | raw GLB | meshopt | gzip | morph tex (67, pos-only) | cornea visible at blink (rays) |
|---|---|---|---|---|---|---|---|---|
| ICT trimmed, normals fixed | 25,959 | 27,956 | 50,996 | 13.6 MB | 2.28 MB | 1.26 MB | 30.0 MB | 0.0% (reference) |
| decimate 0.25 + closest-point transfer | 6,719 | 7,852 | 12,748 | 4.05 MB | 0.82 MB | 0.39 MB | 8.4 MB | **10.7%** (56) |
| decimate 0.12 + transfer | 3,313 | 4,124 | 6,119 | 2.24 MB | 0.58 MB | 0.23 MB | 4.4 MB | **3.7%** (27) |

Decimation also reduced open-eye visibility to 82% and 78%, because the lid shape degrades. The conclusion is to
author low-poly topology, not to decimate a realistic head. MPFB's ~4k-vertex head is already in the right class.

**E4: headless QA renders (`e4_render.py`).**
- 9 poses at 320 px, 16 samples, Cycles CPU: 28-33 s in total.
- `results/qa_sheet.png` shows neutral, jawOpen, blink, smile, thinking, PP, aa, U and FF.
- The first-pass viseme recipe already reads correctly: PP pressed, FF upper teeth on lower lip, U rounded.
  Eye irises were hidden by the QA material, a cosmetic issue.

**E5: MPFB headless (`e5_mpfb.py`).**
- Installed as a user extension (`bl_ext.user_default.mpfb`) and enabled from `bpy`.
- `create_human` plus 6 macro sliders: **1.3 s**.
- Base mesh: 19,158 vertices and 18,486 faces. Body group: 13,380. Head (top 13% of height): **4,048** vertices.

What was **not** measured:
- MPFB's own face-unit and viseme quality, because the asset packs need a separate download.
- Phone frame times.
- Image→3D output quality, because there is no GPU here.
- Any child's reaction.

---

## 7. Performance budget for a ₹10k phone (Mali-G52/G57 class, 3-4 GB RAM)

| item | budget | basis |
|---|---|---|
| face mesh GPU vertices | **≤ 6,000** | morph texture = 6,000 × 67 × 16 B = **6.4 MB** (position only) **[V formula, M sizes]**; three.js also keeps the Float32 source array in JS heap unless disposed [V source: the buffer is passed to `DataArrayTexture`] |
| morph slots | position only (no morph normals) | normals double texture memory; recompute lighting cheaply or accept the small shading error (S2 painted shading hides it) |
| active morphs per frame | typically 8-20 non-zero | the shader loops all targets but fetches only non-zero ones (`if (morphTargetInfluences[i] != 0.0)`) **[V source]**; the compositor zeroes weights below 0.01 |
| total triangles | ≤ 25k (face 10-12k, hair ≤ 5k, garments ≤ 5k, eyes/teeth/tongue ≤ 3k) | an S2 bust; [U] until measured |
| draw calls | ≤ 6 (skin, eyes, mouth, hair, garment, accessories) | atlas accessories |
| textures | 3-4 × 1024² KTX2 + 512² hair/eyes | ETC1S/UASTC are GPU-compressed (about 0.5-1 MB GPU each) [U] |
| GLB download | ≤ 2.5 MB per character | measured head geometry 0.6-0.8 MB meshopt **[M]** plus textures |
| frame | 30 fps cap while speaking, 15 fps idle-listening when nothing moves much, pixel ratio ≤ 1.5 | render off the audio thread (`companion-tech` §13); rAF samples `FaceFrame` |
| picker | **2D WebP portraits plus one live 3D preview at a time**, never six live models | memory |

M-AV-4 (§10) measures these on real phones. The numbers above are the starting budget, not a promise.

---

## 8. Licensing matrix (shipped assets in a paid product for minors, web + Android)

| component | licence | ship? | obligations |
|---|---|---|---|
| MPFB base mesh, targets, rigs, MHCLO clothes, textures | CC0 1.0 **[V]** | **yes** | none; keep provenance anyway |
| MPFB code | GPLv3 **[V]** | not shipped (offline tool) | none for output: "no output from MPFB contains any trace of program logic" **[V]** |
| ICT FaceKit Light | MIT **[V]** | yes, if any ICT-derived shape ships | include the MIT notice in third-party notices |
| TalkingHead, HeadAudio | MIT **[V, via `audio-to-face-ml.md`]** | yes (runtime) | notice |
| TRELLIS.2 outputs | MIT code/model **[V]** | yes (props) | notice; check nvdiffrast's licence if it is used in our pipeline (it is NVIDIA's own licence) **[V pointer]** |
| Hunyuan3D 2.1 outputs | Tencent community licence: no EU/UK/KR; MAU > 1M needs a licence; machine-generated labelling in public **[V]** | **no** for shipped assets | n/a |
| Meshy outputs | free CC BY 4.0; paid "own all assets" **[V]** | paid tier only | keep the invoice and terms snapshot |
| Character Creator stock content | Standard vs Extended (online interactive services) **[V]** | only with the Extended licence in writing | per Reallusion |
| MetaHuman | [U] | no (v1) | n/a |
| Avaturn / Avatar SDK | commercial terms by agreement **[V/S]** | no | n/a |
| Concept images from an image model | per provider terms [U] | concept only; never shipped as textures without a terms check | record in provenance |
| Our sculpts, textures, rigs | ours (work-for-hire contracts with artists must assign copyright) [U, counsel] | yes | contracts |

Original characters also need a **name and likeness clearance**: no resemblance to a real teacher, actor or influencer,
and a trademark check of the names in classes 9, 41 and 42 [U, counsel]. Concept briefs must never use a real
person's photo as reference.

---

## 9. Representation and child-safety review

1. **Panels.** Run two or three sessions per character with Indian parents (Hindi-medium and English-medium, urban and
   peri-urban), working teachers, and Class 5-9 children. Children's sessions follow the testing protocol in
   `../design/kids-ux-ages.md` §10.
2. **Community review** is required for every religious or community marker (dastaar, hijab, bindi, NE textile
   patterns). Do not ship a marker that the community reviewers flag.
3. **Colourism check.** G9 measures skin tone mechanically. Panels also judge each tutor's apparent competence and
   warmth without skin tone being part of the question, and the results are compared across MST. A darker character
   rated as less competent is a defect to fix in design, not a finding to accept.
4. **Over-attachment.** Under-9s attribute minds readily (`../voice/human-likeness.md` §6). The face must not perform
   longing, sadness at goodbye, or "missing you". This is a *face program* constraint as much as a text one: the
   `concerned` expression is reserved for content difficulty, never for the child leaving. The Director's NEVER
   MANIPULATE floor extends to faces.
5. **AI disclosure.** The picker labels tutors as AI teachers, and the app-voiced disclosure (human-likeness §6)
   covers the session. Hunyuan's AUP clause 12 is one more reason not to use it for shipped faces.

---

## 10. Experiments to run before committing (with pass bars)

| id | experiment | method | pass bar |
|---|---|---|---|
| M-AV-1 | creepiness and appeal by band, S1 vs S2 vs S3 | the same character in three style levels, a 20 s speaking clip with the real voice; children rate on a 5-point smiley scale, "feels weird" vs "feels friendly" (Brink-style wording); n ≥ 30 per band | S2 "weird" ≤ S1 + 5 pp in classes 1-4 *and* ≤ 15% in classes 5-9 |
| M-AV-2 | voice-face fit | blind pairing: children and parents match 4 voices to 4 faces | ≥ 70% correct pairing for the intended voice (otherwise re-cast the voice or face) |
| M-AV-3 | gates on the real cast | G1-G11 in CI on every character build | all green |
| M-AV-4 | phone performance | 3 reference phones (₹8-12k, Mali-G52/G57, Android 12-14) in Chrome and Capacitor WebView: fps while speaking, JS heap, GPU memory, load time on 4G | ≥ 30 fps p95 while speaking; ≤ 150 MB tab memory; ≤ 3 s first face on 4G |
| M-AV-5 | Hindi lip believability | 30 Hinglish utterances rich in bilabials and /ʋ/ (`audio-to-face-ml.md` §0.7); A/B with audio offset ±80 ms as a control | ≥ 4/5 natural rating; the offset control detected (validates raters) |
| M-AV-6 | picker choice distribution | which tutor children pick and keep, by gender, band and state | no tutor < 10% share after 2 weeks (otherwise redesign, rather than drop, so that representation is kept) |

---

## 11. Not recommended, and why (candidates for `context/rejected.md` if tried)

1. **Naive delta transfer of expressions onto stylised identities.** Cornea leaks 1.3-8.1% at blink **[M]**. Bake through the warp.
2. **Decimating a realistic head to get a mobile head.** Lids and lips break: 10.7% / 3.7% cornea leak **[M]**. Author the topology.
3. **Exporting OBJ-imported heads without clearing custom split normals**: 3.95× GPU vertices **[M]**.
4. **Morph normals on mobile.** About 2.6× GLB size on E1 (136 vs 51 MB raw) **[M]** and 2× morph texture memory **[V formula]**.
5. **Image→3D generators for faces.** No lid, lip or mouth topology [U, structural], and licence encumbrances (Hunyuan) **[V]**.
6. **Photo→avatar services for original characters.** Likeness consent problems and photoreal output **[V terms; §2]**.
7. **MetaHuman or other S4 realism for children aged 10-15** in v1, on uncanny-valley grounds **[V Brink]**.
8. **A cartoon (S0) face on an exactly-human voice**, the realism mismatch **[V Mitchell]**.
9. **Six live 3D models on the picker screen**, which risks running out of memory on 3 GB phones [U, M-AV-4 will confirm].
10. **Creating a character before its voice passes the ear test.** Voices are the scarce resource (§0.8).

---

## 12. Open questions

- Do MPFB's "Faceunits 01" and "Visemes 02" packs reach S2 mouth quality, or does every character need Faceit or Polywink
  correctives? Download the packs and run E1-E4 on an MPFB head. This is the next experiment and costs about an hour.
- The MetaHuman licence text after mid-2025 is unverified here (the Epic pages are behind 403 or a login). It only
  matters for v2 video-real work.
- The exact terms of Tripo, and of Rodin ChatAvatar, need reading before any use.
- Saree pallu and dupatta: are rigid skinned meshes enough at S2, or does the idle breathing motion need two or three
  spring bones? TalkingHead supports dynamic bones (README Appendix E) **[V]**.
- Should older children (classes 7-9) get an S3 variant of the same character, with the same identity and less
  stylisation, if M-AV-1 shows S2 reads as "babyish" to them?

---

## Sources

Primary sources read this session:
- Brink, Gray & Wellman 2019, *Child Development*, doi:10.1111/cdev.12999 (abstract via Europe PMC).
- Mitchell et al. 2011, "A mismatch in the human realism of face and voice produces an uncanny valley", *i-Perception*:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC3485769/
- Duolingo, character visemes in Rive: https://blog.duolingo.com/world-character-visemes/
- Synthesis Tutor: https://www.synthesis.com/tutor · Praktika: https://praktika.ai/
- TalkingHead README and Blender guides (MPFB, VRoid, Faceit):
  - https://github.com/met4citizen/TalkingHead (README Appendix A)
  - https://github.com/met4citizen/TalkingHead/blob/main/blender/MPFB/MPFB.md
  - https://github.com/met4citizen/TalkingHead/blob/main/blender/VRoid/VROID.md
  - https://github.com/met4citizen/TalkingHead/blob/main/blender/Faceit/FACEIT.md
- ICT FaceKit: README and MIT licence, https://github.com/USC-ICT/ICT-FaceKit (cloned)
- MPFB 2:
  - LICENSE.md, LICENSE.ASSETS.md (CC0) and LICENSE.CODE.md (GPLv3): https://github.com/makehumancommunity/mpfb2 (cloned)
  - FAQ: https://static.makehumancommunity.org/mpfb/faq/can_i_sell_models.html
- TRELLIS.2 README and MIT licence: https://github.com/microsoft/TRELLIS.2 · TRELLIS licence: https://github.com/microsoft/TRELLIS
- Hunyuan3D 2.1 licence and README: https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1
- UniRig README and licence: https://github.com/VAST-AI-Research/UniRig
- VRM 1.0 expressions spec: https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm-1.0/expressions.md
- VRoid Studio: https://vroid.com/en/studio
- three.js r186 (dev branch) morph-target source:
  - `src/renderers/webgl/WebGLMorphtargets.js`
  - `src/renderers/shaders/ShaderChunk/morphtarget_vertex.glsl.js`
  - `src/renderers/shaders/ShaderChunk/morphtarget_pars_vertex.glsl.js`
- Meshy pricing and licence: https://www.meshy.ai/pricing · Hyper3D Rodin pricing: https://hyper3d.ai/pricing
- Avaturn pricing: https://avaturn.me/pricing · Avatar SDK MetaPerson: https://avatarsdk.com/metaperson/
- Reallusion content licence: https://www.reallusion.com/license/content.html
- Polywink: https://www.polywink.com/
- Faceit docs: https://faceit-doc.readthedocs.io/en/latest/
- Monk Skin Tone Scale: https://skintone.google/the-scale

Secondary sources, or recalled but not re-read:
- Zell et al. 2015 (ACM TOG 34(6), doi:10.1145/2816795.2818126; the page returned 403).
- MetaHuman licensing changes (2025).
- Ready Player Me shutdown, via `../tech-and-market.md`.
- Microsoft Rocketbox, via the TalkingHead README.

Taxila context: `audio-to-face-ml.md`, `../tech-and-market.md` §2, `../design/kids-ux-ages.md`,
`../voice/human-likeness.md`, `../../harvest/companion-tech.md` §13.
