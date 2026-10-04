# Style C, polish round 2 (2026-10-04): build, gates and the section-8 judge run

**Verdict: 3D is failing the owner's bar.** One full polish iteration on fixes 1-6 did not reach 3+. The two judge
families scored the final build 2.17 / 5 (2.42 GPT, 1.67 Grok). My own score by eye is 2.5. Items 1-3 (same character /
Memoji register / not uncanny) pass at 17% / 28% / 0%, against a bar of 90%. By the rule in `JUDGE-r1.md` and
TECH-PLAN §10, the owner should be told plainly that 3D is failing. The next step is the 2D puppet of the same
character. I have not started it.

The judge result is advisory (`rj-holistic-model-judge-gate`). The owner sheet is the gate:
`owner-sheet.webp` (row 1: c-front vs render at 128 px and full size; row 2: four expression pairs plus 3/4; row 3: turntable).

## Files

| file | what |
|---|---|
| `art/character/stylised/polish-r2/teacher.glb` | tier H: 24,583 tris, 82 morphs, 1.31 MB (meshopt + quantize, KTX2 path) |
| `art/character/stylised/polish-r2/teacher_Bplus.glb` | tier B+: 10,604 tris, 58 morphs (ARKit 52 + `tongueTipUp` + 5 corrective keys), 0.70 MB |
| `art/character/stylised/polish-r2/{params,poses}.json`, `*_stats.json` | the exact numbers that built them, plus the per-mesh split |
| `contact-sheet.webp`, `expressions-sheet.webp`, `thumb-compare.webp`, `owner-sheet.webp` | evidence next to `c-front.webp`; every tile is a three.js TaxilaToon render, none is from Cycles |
| `gates-H.json`, `gates-Bplus.json` | G1-G6 + G-partial |
| `judge-r2.json` | the sanity battery (3 families) and both judge runs, with raw replies |

## Rebuild

```
PY=/tmp/claude-0/char/bpyenv/bin/python; cd scripts/character/stylised/r2
$PY build.py <dir>/final.blend [H|Bplus]          # ~30 s (H), AO bake included
$PY export.py <dir>/final.blend <dir>/raw.glb && node finish.mjs <dir>/raw.glb <out.glb> [--etc1s Bplus]
$PY gates.py <dir>/final.blend gates.json
cd /home/user/Taxila && node scripts/character/stylised/r2/render3.mjs <out.glb> <renders> --size 1024 front q3L pose:j_smile yaw:90 ...
python3 scripts/character/stylised/r2/sheets.py <renders> docs/design/teacher/stylised/build/polish-r2
python3 scripts/character/stylised/r2/judge/judge2.py sanity|run ...
```

`scripts/character/stylised/r2/` is a copy of the winning Arm A scripts, extended in place. `armA/` is untouched, so the
round-1 base still rebuilds.

## Fix list: what was done (and measured)

| # | fix | done | evidence |
|---|---|---|---|
| 1 | apple cheeks, narrower jaw, taper, shorter chin | the face is rebuilt as a face/apple/jaw/chin/muzzle ellipsoid set (`sdf.py`). The front half-widths now track the c-front outline within about 3 mm from z −16 to −68 mm (c-front 65/53/44 mm at z −16/−54/−63; render 65/52/45). Profile: forehead, then a 4.5 mm nose bump, then lips 2 mm behind the forehead plane, then the chin 5 mm behind the lips | `outline.py` / `sil.py` numbers in the session log |
| 2 | nose: no bridge, ball tip, less profile | the bridge capsule is removed; a ball tip with barely-there alae; the vertex-colour under-tip shade is too weak to see | judge item 7: 50% |
| 3 | resting smile baked into the base | corner lift 4.2 mm, mouth half-width 20.5 mm (between the concept's 23 and a softer read), a thin upper crescent and a fuller lower pillow (`lipL` ellipsoid). The visemes were re-baked and re-checked on the new base | judges still call it "stretched / painted on" (item 8: 17%) |
| 4 | eye surround | the r1 dents came from ring-to-boundary interpolation that never touched the real surface. Now (a) the SDF blends toward a sphere just outside the lid sphere (`eye_blend`, clamped so it never opens a pocket inside the head), and (b) a new `conform` pass relaxes and projects every non-feature vertex onto the SDF (80 iterations). The eyes moved 3.5 mm forward and 1 mm apart. The liner is thicker (2.8 → 6.5 mm with a 9 mm flick), and the lower liner is at 12% | dents gone by eye; faint creases remain at the eye corners in 3/4 |
| 5 | neck, bust, chin band | the neck is a recast cylinder (no grazing-ray folds), 0.0235 m radius. The kurta collar is up to z −0.09; the shoulders are 13% wider; the kurta is pushed out of the skin (no poke-through). The dark band is answered with an underside fill and an AO lift in the shader | the judge flagged the collar or neck in 4/18 replies |
| 6 | hair | crown 4 mm lower; 6 grooves per side with jittered spacing; the parting ends at the crown, so the back is a radial fan with no V seam; the shells are welded at the parting; the side edge has a sine roll (no helmet ledge); the hairline comes down over the temples | the bun reads (item 14: 11% → 78%); hair item 12: 11% |
| 7 | fatter pill brows | 10.5 / 10.8 / 6.8 mm, a round head over the first 16% of the length, a soft taper, near-black colour | item 6: 0% in both runs ("sharper brows", "thin brows") |
| 8 | eye life | the aperture is rebuilt from the eye close-up (upper margin 33.5°, lower 33°, corners 36° / 58°). The iris (31°) slightly overfills the height, and the upper lid rests on the iris top. The catchlight is a view-space disc in the cornea shader | item 9 (catchlight) 72%; "staring / bulging eyes" is still the top complaint |
| 9 | TaxilaToon in three.js | `r2/viewer/toon.js`: wrap diffuse with a soft two-tone ramp, warm terminator, rim, broad GGX, skin AO from `TEXCOORD_0.x` with a lift, an underside fill, a form roll-off, Kajiya-Kay hair on an analytic flow field toward the bun, a view-space cornea catchlight, and the lid shadow in the head frame. All round-2 evidence is three.js on SwiftShader | — |
| 10 | artefacts | **teeth notch**: the cause was a stale mouth-bag fan centre, created before placement and sitting 6 mm behind the lips. It is now placed behind the deepest ring; gone. **Jaw 0.3 + close 0.3 leak**: the close term now uses the pre-jaw delta, so jaw 1 + close 1 is exactly sealed; 1.5% → 0.0%. The mouth bag was culled by three; it now faces the viewer | `gates-H.json` |
| 11 | ports from Arm B | the G-partial chord push (`keys.chord_fix`); the B+ LOD (10.6k tris, 58 keys); the KTX2 + quantize finish (`finish.mjs`, attributes kept); shoulder bones (`LeftShoulder` / `RightShoulder`) | G-partial passes at 0.25/0.5/0.75 |
| 12 | section-8 run | 6 stimuli × {1024, 128} × two families, after the sanity battery, plus the owner sheet | below |

New gate behaviour: blink + lookDown now seals lower down, because the closing line follows the gaze. It was 0.43% in
this round before the fix.

## Gates (final build)

| gate | H | B+ |
|---|---|---|
| G1 names | 82/82 | 58/58 |
| G3 mirror | 0.0 mm | 0.0 mm |
| G4 lid seal (blink, + lookDown, + squint, + cheekSquint) | 0.0% | 0.0% |
| G5/G6 rest, PP, jaw 0.3 + close 0.3 | 0.0%, 0 teeth rays | 0.0% |
| G-partial: lid vertices in ball at 0.25/0.5/0.75 (blink, + lookDown, + squint), seal at jaw a + close a, blink 1 + lookDown a | 0 / 0.0% | 0 / 0.0% |

Not measured: phone FPS (Mali-G52), and a B-lite shader variant.

Open artefacts seen by eye:
- `viseme_U`: the teeth corners show through the puckered lips.
- Faint creases at the eye corners in 3/4.
- Neck streaks under the chin.
- The head has 15 draws, because several materials share each mesh; the plan's budget is 6-7.

## Section-8 judge

- **Sanity battery.** c-front vs 8 rejected faces (stylised-premium, GNM, procedural-v3, merged, plum, slate, Arm A r1,
  Arm B r1) and vs 8 ref/concept images, at 1024 and 128 px.
  - GPT (`DEPLOY_BRAIN`): rejected 16/16, accepted 16/16. **Passes.**
  - Grok (`grok-4-20-non-reasoning`): rejected 16/16, accepted 14/16. Both misses are at 128 px, so **it passes at 1024 only and is used only there.**
  - Mistral-Large-3: rejected 12/16. **Fails.**
  - grok-4-1-fast: rejected 11/15. **Fails.**
  - "Change the judge, not the bar."
- **Run 1** (an intermediate build) and **run 2** (final): n = 18 replies each (GPT 12, Grok 6).

| | run 1 | run 2 (final) | bar |
|---|---|---|---|
| mean score (1-5) | 2.22 | 2.17 | ≥ 4 |
| GPT / Grok mean | 2.42 / 1.83 | 2.42 / 1.67 | — |
| 128 px / 1024 px mean | 2.83 / 1.92 | 2.83 / 1.83 | — |
| item 1 same character | 22% | 17% (128 px: 50%) | ≥ 90% |
| item 2 Memoji register | 22% | 28% | ≥ 90% |
| item 3 not uncanny | 0% | 0% | ≥ 90% |
| item 14 bun reads | 11% | 78% | ≥ 75% |
| item 19 state reads | 33% | 44% | ≥ 70% |
| item 20 no artefacts | 0% | 0% | ≥ 75% |

Recurring defects, in both families, in order:
1. A stretched / painted / rigid mouth.
2. Staring, bulging or "dead" eyes with malformed lids.
3. A faceted, lumpy, plastic finish with seams (hair panels, neckline).
4. The wrong head-to-shoulder ratio.
5. Thin or sharp brows.

At 1024 px the judges see construction defects. These are the same class of problem that the owner called "cheap".

## Why I think it is failing, and what would be needed to continue 3D

The silhouette and the feature placement now track the concept (the 128 px same-character rate is 50%). What fails is
surface craft at full size. Every remaining defect is a hand-sculpting problem, not a parameter problem: lid
thickness, the lip roll, the brow profile, and the hair groove sculpt. The parametric SDF with ring patches has
reached its ceiling at about 2.2-2.5. That matches RESEARCH.md's estimate of an "agent ceiling 2-3.5" for a face.

Continuing in 3D would need, at least:
- Catmull-Clark level 2 on the head, with keys re-baked on the subdivided cage (the plan's §3.1, never built).
- Hand-authored lid and lip profiles.
- A real hair groove sculpt.

There is no evidence that these would reach 4. Recommended next step: the 2D puppet from the refs (TECH-PLAN §10).

## Spend

- **This round:** no GPU used, only Foundry tokens: about 110 vision calls across the sanity battery and two judge runs.
- **Ledger:** `scripts/gpu/status.py` shows a total of $1.953 across 9 runs, and none of them is from this round.
- **Live instance (not mine):** `voice-v3-open-20261004-115139-533b` (g6.2xlarge spot, about $0.50 so far, 180 min self-terminating cap) belongs to a different workstream. I did not launch it and did not touch it.
