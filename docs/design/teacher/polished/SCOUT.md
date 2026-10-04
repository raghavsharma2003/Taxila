# SCOUT: polished, licensable human heads for the Taxila teacher

Date 2026-10-04. Trigger: the owner's verdict on `bakeoff/COMPARE.png` and `gnm/renders/*/contact.png`: "scary,
cheap, unpolished, weird". I looked at COMPARE.png before writing this. Every row has the same failure modes. The
face proportions read as generic MakeHuman, so the faces are long and flat. The skin is uniform and plasticky,
or blotchy on the GNM rows. The lips are pasted on. The eyes are small and dead, and the hair is a flat cap. Each
of these was built by script with no artist involved. The numeric gates (legibility, lip seal, budgets) passed, and
none of them measures appeal. **The conclusion: stop sculpting faces ourselves. Start from a face a professional
artist or a professional capture system made, and keep only our runtime: rig contract, tiers, lip-sync, behaviour,
compositor.**

Status keys: **[V]** verified on the primary source in this session. **[S]** secondary source (press or a reseller page).
**[U]** unverified or inferred. Fab, ArtStation and Epic's EULA pages returned 403 / Cloudflare to this container,
so any claim about them comes from search snippets, press coverage or the seller's mirror page, and is marked.

Runtime contract we must land in (`CHARACTER-PIPELINE.md` §3-§4):
- Morph names: ARKit 52 (exact Apple names) + `viseme_sil PP FF TH DD kk CH SS nn RR aa E I O U`.
- H tier: ≤ 6 MB, ≤ 45k tris, ≤ 8 draws, 82 morphs.
- B+ tier: ≤ 2.2 MB, ≤ 18k tris, ≤ 5 draws, 58 morphs.
- B-lite: same geometry as B+.
- Relative morphs. Material slots are self-described in `extras.taxila`.

Any source that gives us ARKit 52 can be folded into the contract. Visemes either come with the source or are built
from ARKit, with TalkingHead's MIT `blender/build-visemes-from-arkit.py` or our own `visemeFold`. Triangle count is
fixed by decimation and LOD choice. **The things a pipeline cannot fix are the face's design, its texture and the
licence**, so the ranking weights those.

---

## 1. Licence reality check: "web delivery" is the filter that matters

A three.js page ships the GLB to the browser. Anyone can save it from DevTools. Most stock-asset licences forbid
exactly that:

| licence family | clause that bites a raw-GLB web app | verdict for us |
|---|---|---|
| **Reallusion Content EULA** (CC4/CC5, Headshot, ActorCore) [V] https://www.reallusion.com/Content/EULA/EULA.htm | "take all reasonable and industry-standard measures … to prevent other parties from gaining access to such 3D Models … 3D Models must be contained in proprietary formats so that they cannot be opened or imported into a publicly available software application." | **Blocked** for plain GLB unless Reallusion grants an Enterprise licence (case by case, https://www.reallusion.com/plan-and-pricing/enterprise) or a protected container is accepted by counsel |
| **TurboSquid Royalty Free** [V] https://www.turbosquid.com/help/en/articles/9937422-royalty-free-license | "must be contained in proprietary formats so that they cannot be opened or imported in a publicly available software application or framework … WebGL exports from Unity, Unreal, Lumberyard, and Stingray are permitted." | **Blocked for three.js** (only engine WebGL exports are named) |
| **Daz 3D Interactive Licence** [S] https://www.daz3d.com/daz-licenses | game source data "must be protected so that the original product cannot be extracted"; forum guidance says WebGL is not permitted without special licensing | **Blocked** |
| **CGTrader Royalty Free** [S] https://help.cgtrader.com/hc/en-us/articles/360015124437-Royalty-Free-License | usable "as long as the 3rd party cannot retrieve it on its own" | **Risky**: needs a protected container and a legal read |
| **Fab Standard License** [S] https://www.fab.com/eula | distribute "in object code format only as an inseparable part of a Project"; no standalone redistribution; usable with any tools | **Probably OK, needs a legal read** (a raw GLB is arguably not "object code"; meshopt + KTX2 + an obfuscated container strengthens the case) |
| **Unreal Engine EULA → MetaHuman** [S] cgchannel 2025-06, metahuman.com/license (login-walled), digitalproduction 2025-06-05 | Since UE 5.6 (June 2025), MetaHuman characters are "Non-Engine Products" and may be used in "any engine … Unity, Godot" and DCC tools. Free under $1M revenue a year; $1,850/seat/yr above that. Must not be used to train AI models | **Probably OK** (the "any engine" language is new and broad). The actual EULA text could not be fetched (Epic returns 403 to this proxy): **owner/counsel must read the MetaHuman + Distribution sections for a browser-delivered GLB** |
| **Superhive (Blender Market) Royalty Free** [V] https://superhivemarket.com/page/royalty-free-license | "personal, educational, and or commercial purposes"; no resell / redistribute / repackage; no logos | **OK** (no extraction clause) |
| **ThreeDee licence** [V] https://www.threedee.design/license/ | "royalty-free for personal and commercial projects … modify … unlimited projects"; cannot "redistribute or resell the original files" or sub-license | **OK** (no extraction clause; a modified, compressed GLB inside our app is not the original files) |
| **Avaturn ToU** (last updated 2023-01-26) [V] https://docs.google.com/document/d/e/2PACX-1vT5_TR6-MNs29LqI-LLKHvIKHVE0iluuapOpHODGRVDaqyfuCsEgaiE3ZIliI1-FN_-9rxJZ3iVo_jJ/pub | "You may use the avatars for commercial purposes only after notifying us at hello@avaturn.me with link to the project"; IP "shall … remain the sole and exclusive property of Avaturn" | **OK with conditions**: notify, then get written confirmation for children / web / paid use |
| **Itseez3D / Avatar SDK (MetaPerson) EULA** [V] https://avatarsdk.com/eula/ | Revocable licence "during the Term" to use the App. Revenue share only "if you intend to license or sell any rights to any Itseez3D Avatar to any third-party". Physical features may only be used with the Itseez3D avatar. No AI training | **OK with conditions**: confirm in writing that an exported avatar stays licensed after the Term |
| **MIT** (Rocketbox) [V] https://github.com/microsoft/Microsoft-Rocketbox | MIT since Nov 2020 | **OK** |
| **VRoid Studio presets** [V] https://vroid.com/en/studio/guidelines | presets may be used commercially by individuals and corporations unless a special clause applies | **OK** |
| **CC-BY / Sketchfab Free Standard** [V] https://sketchfab.com/licenses | commercial use OK (CC-BY needs attribution) | **OK, if the uploader really had the rights**. Several "free realistic" Sketchfab women are CC4/Daz exports re-licensed as CC-BY, which the uploader cannot do |
| **Unity Companion License** (Heretic / Enemies digital humans) [S] | only for Unity-based projects | **Excluded** |
| **Epic Digital Human samples** (Mike, Paragon busts) [S] | "Licensed for Use Only with Unreal Engine-based Products" | **Excluded** |
| **Meta Ava-256 / Goliath** [S] https://github.com/facebookresearch/ava-256 | CC-BY-NC 4.0 | **Excluded** |
| **TalkingHead sample avatars** [V] https://github.com/met4citizen/TalkingHead | brunette.glb CC BY-NC 4.0; avaturn.glb, avatarsdk.glb, vroid.glb non-commercial; mpfb.glb CC0 | **Excluded as shipped** (only mpfb is free, and it is our failed MakeHuman look) |

A lever that applies to every "proprietary format" licence: ship the GLB inside our own container (a chunked, XOR'd
or AES-keyed meshopt blob, decoded in memory and never written as `.glb`). This is the same protection Unity/UE WebGL
builds give, and TurboSquid explicitly accepts those. **It is not the plan of record.** It needs counsel's sign-off,
and it is listed only because it would reopen Reallusion, CGTrader and TurboSquid.

---

## 2. Ranked table

Scores are 1-5. **Vis** = visual polish / appeal (not uncanny). **Ind** = Indian representation available or
reachable. **Lic** = licence fit for a paid children's web app. **Rig** = ARKit 52 + visemes readiness.
Rank = Vis×2 + Lic×2 + Ind + Rig (max 30). Tris are the head/character as delivered, before our tiering.

| # | source | preview | licence | price | rig | tris | Vis | Ind | Lic | Rig | score | verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **MetaHuman** (UE 5.7 MetaHuman Creator, Linux/macOS/Windows [S]) → our GLB | https://www.metahuman.com (gallery) | UE EULA, Non-Engine Product, any engine [S] | **$0** (< $1M revenue a year) | 669 face shapes at LOD0 [V Epic LOD doc]; ARKit 52 via the shipped `AS_MetaHuman_ARKit_Mapping` [S, metahuman-to-glb]; visemes built from ARKit | head LOD0 24k verts, LOD1 12k, LOD2 6k, LOD3 2.5k [V https://dev.epicgames.com/documentation/metahuman/platform-support-and-lod-specifications-for-metahumans] | 5 | 5 | 4 | 4 | **28** | **PICK A (free)**: the most professional realistic face available, with South-Asian-looking presets and skin tones in Creator. Risk: realistic → uncanny if our three.js skin/eye shading is weak. Mitigation: MetaHuman's own maps, plus TaxilaSkin tuned against an Unreal reference render |
| 2 | **ThreeDee** stylised characters (Doctor Cartoon Female, Business Office Woman, Doctor Cartoon Male …) | https://www.threedee.design/assets/images/Doctor%20Cartoon%20Female/First.webp · https://www.threedee.design/assets/images/Cartoon-Woman-Rigged/first.webp | ThreeDee RF [V] | $48-68 each [V]; custom character work on quote | "ARKit 52 blendshapes" + lip-sync, GLB + FBX + .blend [V product pages] | "low-poly quad mesh", count not stated [U] | 5 | 4 | 5 | 4 | **28** | **PICK B (purchase)**: the high-appeal stylised look of modern professional avatars (Pixar-adjacent). Clean, warm, never uncanny. The Doctor/Office women are dark-haired and re-tone to Indian skin easily. Licence has no extraction clause. Their custom-3D service can make a bespoke Indian trio in the same style |
| 3 | **Avaturn** T2 avatar from a synthetic portrait | https://avaturn.me · sample `avatars/avaturn.glb` in https://github.com/met4citizen/TalkingHead | Avaturn ToU: commercial after notification [V] | **$0** (free creator; Pro $800/mo not needed) [V https://avaturn.me/pricing/] | ARKit + Oculus visemes + humanoid rig, Mixamo-compatible; TalkingHead-native [V avaturn.me, TalkingHead README] | **31.2k** (measured by us: T2 pipeline 1.44 MB, 16.9 MB resident) [M `docs/research/avatar/performance-android.md` §3] | 4 | 5 | 3 | 5 | **24** | **PICK C (free)**: fastest drop-in (already measured in our harness), photo-driven, so Indian representation comes from the input portrait. Clean, professional semi-real look. Risks: IP stays with Avaturn, the ToU is from 2023, and it is a third-party service at authoring time (Azure-only directive, §4) |
| 4 | **MetaPerson Creator** (Avatar SDK / itSeez3D) | https://avatarsdk.com/metaperson-creator/ | Itseez3D EULA [V]; revocable "during the Term" | first avatar **$0**, then in-app credits (price not published) [V https://avatarsdk.com/pricing-cloud/]; Pro $800/mo | `mobile_51` (ARKit minus `tongueOut`) + `visemes_15`; GLB LOD1/LOD2 [S docs.metaperson.avatarsdk.com] | LOD1/LOD2, count not published [U] | 4 | 5 | 3 | 4 | **23** | **PICK D (free first avatar, credits after)**: photoreal-leaning selfie avatars, a second photo-driven arm against Avaturn on the same synthetic portraits. Needs the post-Term licence confirmed |
| 5 | Riya (Giyasudeen Mohamed) | https://assets.superhivemarket.com/store/product/226587/image/xlarge-7bb664aeb4442cc55f2af72813f6b936.jpg | Superhive RF [V] (also listed free on Fab under Fab Standard [S]) | $10 Superhive [V] / free on Fab [S] | 52 ARKit, Auto-Rig Pro; FBX/GLB/OBJ/.blend; 4K maps [V] | 105k polys, 120k verts (full body) [V] | 3 | 2 | 5 | 5 | 23 | Reserve. Licence-clean and ARKit-native, but the renders read Western (grey/white hair, office look). Making it Indian means re-sculpting and re-texturing, which is the work we just failed at |
| 6 | Reallusion CC5 + Headshot 3 (image-to-3D head) | https://www.reallusion.com/character-creator/headshot/ | Reallusion Content EULA [V]: proprietary-format clause | CC5 $299 + Headshot 3 $199 perpetual [S]; Enterprise on quote | CC ARKit-compatible expression profile, viseme set | CC5 base ~ 14-30k [U] | 5 | 5 | 1 | 4 | 21 | **Best real-time artist tool, licence-blocked** for a raw GLB. Revisit only if Reallusion grants an Enterprise web licence (owner can request a quote) |
| 7 | Microsoft Rocketbox (+ HeadBox shapes) | https://media.sketchfab.com/models/f391c34bf069478982dcd402ba989da6/thumbnails/3cbcb5bd2ad94a8bad18f4cd3d40ffe6/1024.jpeg | MIT [V] | $0 | `*_facial.fbx` per avatar: 15 visemes, 48 FACS, Vive set, ARKit set (2022-06) [V repo README + tree] | ~ 10-14k hipoly per character [S Sketchfab uploads] | 2 | 2 | 5 | 5 | 21 | Licence-perfect floor, but the art is ~2010 game quality and would be judged "cheap". 115 avatars, little South Asian representation [S VALID paper]. HeadBox's Unity demo depends on non-commercial OpenFace; use only the shapes in the Rocketbox repo |
| 8 | "Indian Woman in Saree" (ar.jethin, Sketchfab) | https://media.sketchfab.com/models/b5965a93b03440dea65160f7cbac1fc7/thumbnails/589d489e72e34e0c931267dc979d413b/4c262b53a59a4ec3b4b6f08bb8bfc5ab.jpeg | Sketchfab Free Standard [V] | $0 | unknown blendshapes; 1 animation [V API] | 117.6k [V API] | 3 | 5 | 3 | 1 | 19 | The most appealing free Indian-looking upload. Provenance looks like Character Creator / Lumion, so the rights chain is doubtful and there is no ARKit set. Reference only |
| 9 | VRoid Studio / VRM | https://vroid.com/en/studio | VRoid guidelines [V], commercial OK | $0 | VRM expressions; ARKit "perfect sync" needs extra work | 20-60k [U] | 3 | 2 | 5 | 3 | 21 | Clean but anime. Wrong register for Indian parents and teachers; could be a "cartoon" alternative later |
| 10 | CharacterZ packs (Adultz, Unclez & Auntz, Elderz) | https://characterz.design/ | not shown on page [U] | $59-79 per pack, $299 bundle [V] | ARKit + visemes [V] | not stated | 4 | 3 | 2 | 4 | 19 | Similar stylised quality to ThreeDee, with older-adult packs (useful for the older-woman teacher). Licence must be read before purchase |
| 11 | Canino3d "Free Stylized Cartoon Girl" | https://media.sketchfab.com/models/dcaa822909ae4e04ad7eb85bc371a8c4/thumbnails/8d0b36fd3bd84094ac21761477ff22e4/a0ca6be85d31474493a726fa76485655.jpeg | CC-BY [V] | $0 | 100+ custom shapes, not ARKit-named [V desc] | 57k [V] | 3 | 2 | 4 | 2 | 18 | A free stylised fallback: teen proportions, Western look, shapes need remapping |
| 12 | Lena / other Fab ARKit realistic women | https://www.fab.com/listings/bbc92a90-2bf5-4c84-800f-ce87599dd80d | Fab Standard [S] | not retrievable (403) | 52 ARKit [S] | unknown | 3 | 2 | 3 | 5 | 18 | Unverifiable from here; Western faces |
| 13 | Mixamo characters | https://www.mixamo.com | Adobe: royalty-free, no standalone redistribution [S] | $0 | **no facial blendshapes** | 10-30k | 2 | 1 | 4 | 1 | 13 | Excluded: no face rig, dated |
| 14 | three.js `facecap.glb` (Bannaflak Face Cap) | https://threejs.org/examples/webgl_morphtargets_face.html | licence not stated in three.js or on bannaflak.com [V] | $0 | ARKit 52 | ~ 325 KB file | 2 | 1 | 1 | 5 | 12 | Excluded: a capture demo face, licence unknown |
| 15 | Daz Genesis 9 | https://www.daz3d.com/genesis-9-starter-essentials | Interactive Licence add-on $50 [S]; extraction prohibited | $50+/item | rich morphs; ARKit via plugins | 25k+ | 4 | 4 | 1 | 3 | 18 | Excluded on licence |
| 16 | TurboSquid / CGTrader ARKit heads (e.g. "10 Female Heads Pack - ARKit") | https://www.cgtrader.com/3d-models/character/woman/10-female-heads-pack-rigged-with-arkit-shapes | RF with extraction clauses [V/S] | varies | ARKit 52 | varies | 3 | 2 | 1 | 5 | 15 | Excluded unless we adopt the protected container |
| 17 | Ready Player Me | — | — | — | — | — | — | — | — | — | — | **Dead**: Netflix acquisition 2025-12-19; service shut 2026-01-31; API and hosted avatars gone [S https://avatarsdk.com/blog/2026/08/31/avatar-platforms-2026-whos-alive-whos-gone/] |
| 18 | NVIDIA Audio2Face Mark / Claire / James | https://github.com/NVIDIA/Audio2Face-3D | models: NVIDIA Open Model License (commercial OK) [S]; sample data: evaluation-only | $0 | — | — | — | — | — | — | — | **No head meshes distributed**, so it is not a face source. A possible future *driver* (audio → ARKit), but it needs a GPU at runtime |
| 19 | Unity Heretic/Enemies, Epic Digital Human, Meta Codec Avatars, Apple | — | engine-locked or NC | — | — | — | — | — | — | — | — | Excluded (see §1). Apple publishes no licensable textured head |
| 20 | Union Avatars | — | — | — | — | — | — | — | — | — | — | Offline since 2026-07 [S] |

Services, not assets, to keep in mind:
- **Polywink "Animation for iPhone X"**: auto ARKit 52 on any head, $299 per model, 24 h turnaround [S]. This
  makes any licence-clean sculpt ARKit-ready.
- **ThreeDee custom 3D**: bespoke characters in their style [V site].
- Both are purchases (owner), and both are third-party services at authoring time.

---

## 3. The four picks to build now

Two are free (A, C), one is free for the first avatar (D), and one needs a purchase (B). All four end in our
contract: `public/assets/teacher/<look>/{H,Bplus,Blite}.glb` + `runtime.json`, ARKit 52 + 15 visemes on H, and
`visemeFold` on B+.

### A. MetaHuman → GLB (free; realistic premium)

- **Download:**
  - Unreal Engine 5.7 for Linux: https://www.unrealengine.com/en-US/linux. Needs an Epic account and acceptance of
    the UE EULA; the Linux binary is behind login.
  - MetaHuman Creator plugin, inside UE 5.7 (Fab / Epic launcher): https://dev.epicgames.com/documentation/metahuman/metahuman-creator-in-unreal-engine
  - Reference conversion pipeline (MIT): https://github.com/sociofuture/metahuman-to-glb (UE 5.7 → GLB →
    Blender shape-key transfer of the 51/52 ARKit curves by KD-tree → Draco/KTX → three.js).
- **Build:** author the mid-30s Indian woman in Creator from South-Asian presets. Export through LOD1 (12k verts)
  for H and LOD2 (6k) for B+. Bake ARKit 52 at LOD0 from `AS_MetaHuman_ARKit_Mapping`, then transfer to the LOD
  meshes. Build visemes from ARKit. Swap strands for MetaHuman's card-hair LOD. Re-pack the maps into the TaxilaSkin
  slots.
- **Compute:** MetaHuman Creator's autorig and texture synthesis run on **Epic's cloud** [S], so the box needs
  egress to `*.on.epicgames.com`.
  - AWS: g6.2xlarge (L4, 8 vCPU, 32 GB, inside our 8-vCPU quota) with NICE DCV, or Linux UE 5.7 with Xvfb.
  - About 8-12 h total, roughly $12-20 compute + EBS 300 GB for the editor. Cap the job at $60 with
    `HARD_MAX_MINUTES` and the reaper.
- **Owner actions:**
  - An Epic account login (cannot be created on the owner's behalf).
  - Counsel reads the UE EULA MetaHuman / Distribution sections for raw-GLB web delivery.
  - Note the AI clause: no training on MetaHuman data. Our Director does not train on it, but the learner-model team
    must never feed renders into training.

### B. ThreeDee stylised (purchase; high-appeal stylised)

- **Download** (after purchase; Gumroad delivery):
  - https://www.threedee.design/products/3d-models/doctor-cartoon-female/ ($62, GLB+FBX)
  - https://www.threedee.design/products/3d-models/business-office-cartoon-woman/ ($68, GLB+FBX)
  - https://www.threedee.design/products/3d-models/doctor-cartoon-male-character/ ($48, GLB+FBX), for the man
  - Optional: https://www.threedee.design/products/3d-models/cartoon-woman-rigged/ ($48), the rig reference
- **Build:**
  - Re-tone the skin to the TEACHER-VISUAL Indian palette and swap the garment for a kurta or saree-blouse.
  - Remap ARKit names (verify all 52 exist) and add visemes from ARKit.
  - Decimate to tiers; the stylised style needs simple toon/PBR, and TaxilaSkin `TIER_LITE` suits it.
- **Owner action:** purchase, ≈ $178 for the three (or $116 for one woman + one man to evaluate first). An optional
  custom commission of a bespoke Indian trio, quote to be requested. **I did not buy anything.**

### C. Avaturn T2 from a synthetic Azure portrait (free; photo-driven semi-real)

- **Download:** create at https://avaturn.me (free creator, GLB export, T2 = blendshape face). Integration
  docs: https://docs.avaturn.me/docs/integration/bodies/. TalkingHead (MIT) loads it natively:
  https://github.com/met4citizen/TalkingHead.
- **Build:**
  - Generate a photoreal portrait of a fictional mid-30s Indian woman on Azure (FLUX on Foundry), so no real
    person's likeness is involved.
  - Run Avaturn, export the T2 GLB, and run our existing T2 pipeline (measured: 31.2k tris → 1.44 MB).
  - Decimate the face for B+.
- **Owner actions:**
  - Send the ToU notification to hello@avaturn.me and get written confirmation covering a paid children's web app
    and post-export perpetual use.
  - Decide whether a one-off third-party authoring service is acceptable under the Azure-only directive. It is not
    a runtime call.

### D. MetaPerson Creator from the same synthetic portraits (free first avatar; photo-driven photoreal-leaning)

- **Download:** https://avatarsdk.com/metaperson-creator/ (web creator; export GLB, LOD1 or LOD2, blendshape sets
  `mobile_51` + `visemes_15`). Docs: https://docs.metaperson.avatarsdk.com/
- **Build:** the same portrait as C, which makes it a controlled A/B of the two photo-driven vendors. Add
  `tongueOut` (which `mobile_51` lacks) as our own key; map `visemes_15` to our names (`IH`→`I`, `oh`→`O`,
  `ou`→`U`).
- **Owner actions:**
  - Pay the in-app credits for avatars 2-3 (price not published).
  - Get written confirmation that exported avatars remain licensed after the Term.
  - The same Azure-only authoring decision as C.

Why these four and not the others: they are the only sources that are, together, (a) professionally designed or
captured faces rather than our sculpts, (b) reachable for an Indian face without us re-sculpting, (c) licensable
for raw-GLB web delivery without a protected container, and (d) ARKit-native or ARKit-derivable. The reserve list,
in order: Riya (licence-clean, needs Indianising), CharacterZ (check licence; has elder packs), Reallusion CC5 (only
with an Enterprise web licence), Rocketbox (floor).

---

## 4. Constraints and flags for the main loop

- **Azure-only directive (2026-10-02):** picks A, C and D each use a third-party cloud at *authoring* time: Epic's
  autorig/texture service, Avaturn, itSeez3D. None is called at runtime. This is the owner's call. B uses no
  service.
- **AWS budget:** only A needs a GPU (about $12-20 expected, cap $60). C and D need none. The $400 ceiling leaves
  room for evidence renders (headless Chrome + SwiftShader runs on CPU anyway). Everything goes through
  `scripts/gpu/run.py` with `--max-minutes`, and the reaper and EventBridge backstop (`GPU-JOBS.md` §2).
- **Purchases, identified and priced, not bought:**

  | item | price |
  |---|---|
  | ThreeDee (B) | $48-68 each, ≈ $178 for three |
  | MetaPerson credits (D) | unpublished |
  | Riya reserve | $10 |
  | Polywink | $299/model |
  | CC5 + Headshot 3 | $299 + $199, plus Enterprise on quote |
  | CharacterZ | $59-79 per pack / $299 bundle |

- **Appeal gate:** numeric gates did not catch "scary". Before any build is declared done, the evidence sheet must go
  to the owner as a blind side-by-side (four picks × neutral / smile / talking frame / 3/4). The owner's eye is the
  gate. The existing emotion-legibility and lip-seal gates stay, but as secondary checks.
- **Child-safety floor** is unaffected: the face is a skin over the same Director/behaviour. Avoid any glamour styling
  in the presets: no heavy make-up, no fashion-model proportions.

Sources (primary unless noted):
- https://github.com/microsoft/Microsoft-Rocketbox
- https://github.com/openVRlab/Headbox
- https://github.com/met4citizen/TalkingHead
- https://www.reallusion.com/Content/EULA/EULA.htm
- https://www.reallusion.com/license/content.html
- https://www.turbosquid.com/help/en/articles/9937422-royalty-free-license
- https://help.cgtrader.com/hc/en-us/articles/360015124437-Royalty-Free-License
- https://superhivemarket.com/products/riya-realistic-girl-
- https://superhivemarket.com/page/royalty-free-license
- https://www.threedee.design/license/
- https://avaturn.me/pricing/
- the Avaturn ToU (Google Doc linked from avaturn.me)
- https://avatarsdk.com/eula/
- https://avatarsdk.com/pricing-cloud/
- https://dev.epicgames.com/documentation/metahuman/platform-support-and-lod-specifications-for-metahumans
- https://github.com/sociofuture/metahuman-to-glb
- https://www.cgchannel.com/2025/06/you-can-now-sell-metahumans-or-use-them-in-unity-or-godot/ [S]
- https://avatarsdk.com/blog/2026/08/31/avatar-platforms-2026-whos-alive-whos-gone/ [S, a competitor's blog]
- https://variety.com/2025/digital/news/netflix-acquires-ready-player-me-games-avatar-creation-1236612915/ [S]
- https://vroid.com/en/studio/guidelines
- Sketchfab Data API v3 (search and model metadata, queried 2026-10-04)
- https://github.com/NVIDIA/Audio2Face-3D
- https://github.com/facebookresearch/ava-256
- https://forums.unrealengine.com/t/metahuman-creator-in-editor-plugin-autorig-texture-download-fail-with-a-300s-http-timeout-server-error-from-non-us-regions-5-6-5-7-5-8-regression-from-5-5/2740392 [S, cloud dependency]
