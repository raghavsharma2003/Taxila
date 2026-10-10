# RIG-NOTES: rebuilding the puppet on the grown-up face (option 1, `s3-graphic`)

Date: 2026-10-10. For: the rig rebuild, the moment the owner picks. Read with `docs/design/teacher/puppet2d/PLAN.md`
(the arm-P method), `JUDGE-r8.md` (where r8 stopped: 4.1/5), and `JUDGE.md` here. Evidence tags: [M] measured in this
folder, [R] carried from the puppet2d history, [U] estimate.

**The short version.** The r8 code carries over almost entirely: the cutter, the lid keys, the painted turn plates, the
mouth patch set, the QA gates, the runtime and the driver. Every **coordinate** does not. r8's scripts and `rig.js` hold
c-front pixel positions inline. The genuinely new work comes from paint texture and baked light:
1. completing hidden *textured* skin, where r8 used a smooth membrane fill;
2. re-lighting the turn, which r8 left as an optional fix;
3. limiting the warp so brush strokes never visibly stretch;
4. matting the fine flyaway strands.

Do a two-day gate (§5) before the full build.

---

## 1. What the front gives the rig (riggability audit of `images/stylised-rest.webp`)

| requirement (FACE.md) | `s3-graphic` | note |
|---|---|---|
| front view, head and shoulders | yes | head upright; at 1024 the eye line is near y 325 and the mouth near y 485 |
| plain background | yes | warm cream with paper grain; the grain must be flattened in the `bg` layer or it shows as a halo |
| even light | mostly | soft frontal key with gentle form shading; no hard cast shadows on the face |
| mouth closed, neutral | closed, with a faint resting smile | becomes the look's `restSmile`, exactly as c-front's smile did in r8 |
| eyes open | yes | |
| hair, face, brows, eyes, mouth separable | yes, with one hard part | crisp ink edges on the brows, lids, lip line and jaw. **Hard:** many single flyaway strands at both temples and over the ear tops (§3.5) |
| expression set as edits of the same front | yes, five frames, identity 5/5 blind [M] | registered drift 8.8-25 px, scale 0.914-0.994 [M]; register by DIS optical flow before cutting (`regplate.py`) |

Texture weight [M]: the whole front as WebP q80 is **72 KB against c-front's 27 KB (2.7×)**. The head crop at q85 is
50 KB against 17 KB. The r8 pack is 132 KB (world SPEC §6), so expect the painted pack near **300-400 KB** [U] unless the
skin layers take a lower quality than the feature layers (`pack.py` already splits these). That is inside the world's
700 KB shell budget, but it is no longer small.

## 2. Layer cut plan (r8 layer names kept, so `rig.js` and the driver need no new layer types)

All layers live in the new front's 1024² pixel space, so the rest pose is registered by construction. The rest-SSIM gate
(PLAN §0.2) applies: ≥ 0.97 on the head crop.

| r8 layer | from `s3-graphic` | hidden part to complete | how (new or carried) |
|---|---|---|---|
| `bg` | the cream ground | — | flat sample; **new:** flatten the paper grain to the median ground, or the grain halos round the matte |
| `hairback` | the hair mass behind the head and the nape | behind the face and neck | carried: membrane fill works on the dark hair interior. Keep the painted highlight strokes on top |
| `bun` | the low bun at the nape (her left, viewer's right) | where the neck and the strands hide it | carried method (r8 E4): masked edit plus `bunfix.py`-style composite |
| `nape` | under the bun | the uncovered nape on a head lift | carried: `bodyfill.py` |
| `body` | blouse + saree + pallu | under the chin and the strands | carried: the saree is low-texture cloth, so membrane fill is fine |
| `ears` | both ears | the tops under the hair | **new**: painted completion (an image-model edit), not membrane fill: ear skin is textured |
| `face` | skin with no eyes, brows or mouth; the nose kept | the forehead under the hairline; the temples; the area under brows, lids and lips | **new, the main item**: a painted "blank face" edit (PLAN E1/E1b). gpt-image-2 does not honour masks (`rj-p2d-masked-edit-not-honoured`), so take the full repaint, register it by DIS (`regplate.py`) and composite only the masked region with Poisson blending. A membrane fill here would read as a smooth plastic patch inside painted skin |
| `lidL/R`, `lowerL/R`, `scleraL/R`, `irisL/R`, `catchL/R` | the eye stack | the sclera and iris under the lids | carried (`lidkeys.py`, r8 eye stack); the iris is painted (completed by edit) |
| `lidmidL/R`, `lidshutL/R` | painted mid and closed lids | — | **the blink frame already exists** (`images/stylised-blink.webp`): register by DIS and cut the closed lid from it. One more edit is still needed for the mid lid (`gen-keys.mjs mid`) |
| `browL/R` | ink-edged brows | the skin under them (from `face`) | carried: ribbon brows; the ink edge makes the cut clean |
| `mouth_rest` + the mouth patch atlas | the lips | — | carried (`gen-mouths-r2.mjs`, `cut-mouths-r2.py`, `mouthshape.py`, `interior.py`); `speak` is the reference for `m_aa`, `warm` for the smile column |
| `hair` (the cap with the parting) | the top hair | — | carried; `hairline.py` and `foreheadfill.py` exist because the hairline edge bit r7, so re-run them here |
| `lockL/R`, `lockbed` | **the flyaway strands at the temples** (no thick locks on this face) | the skin and ear under them | **new:** matte the strands (§3.5) and put them on `lockL/R` ropes (verlet chains). If there are too many to rope, paint a cleaner front with 2-3 strands a side (one edit) |

**Coordinates are all new.** Every hand-read polygon in `layers.py` (`GEOM`: jaw, face_top, earL/R, lockL/R, bun, brow
polys), the mouth ellipse in `mouthshape.py`, the battery regions in `eyepass.py`, `teargate.py` and `hairgate.py`, and
the landmark grids in `keyfield.py`. Read them at 2× on a 20 px grid (`gridcrop.py`), as r3-r8 did.

## 3. What is new (and why)

1. **Per-look constants out of `rig.js`.** The head proxy is c-front's: `PX = { cx: 512, cy: 420, rx: 322, … }`, a nose bump
   at (530, 532), cheeks at x 452/608, pivot (530, 728). The new face has a smaller, longer head in the frame, so the
   proxy must be refit. Move these numbers into `geom.json` (a `proxy` block) so that one runtime serves any face.
   Touching `rig.js` means a new polish round, a re-judge and `evals/face-puppet/sync-runtime.mjs`, as its header says.
2. **Painted completion for textured skin** (§2 `face`, `ears`). r8's pull-push membrane fill is right for Memoji skin
   ("smooth fields", `layers.py` docstring) and wrong for brush texture. Budget: 6-10 high-quality edits with 2 tries
   each [U].
3. **Turn re-lighting is mandatory, not optional.** JUDGE-r8 fix 1 (far-side nose-plane shadow, far cheek −6-10 %,
   near-cheek highlight shift) was the gap between 4.1 and 4.5 on a face with soft generic shading. On a face whose light
   is painted in, an un-relit turn reads as a slid photograph. Use the painted ±25° plates (`gen-keys.mjs yawL yawR`) as
   a face-skin keyform blend (`plates.py`, already built for this) **plus** a yaw-keyed multiply overlay fitted to
   those plates.
4. **Warp limits.** Cap the local area change of any skin or hair lattice cell (start at ±8 %), and the turn at ±12° (r8
   turns to ±20° with painted 25-30° keys). Past that, cross-fade to the painted plate instead of stretching. Add a "stretch gate" to the battery:
   per frame, the maximum cell area ratio on the `face` and `hair` meshes.
5. **Strand matting** (§2 `lockL/R`). Alpha from the colour distance to the cream ground (as `battery.py` already does
   with two grounds), then de-halo with `fringe.py`. This is the most fiddly cut on the face.
6. **Skin grade.** Bake a half-way grade toward Monk 6 into every skin layer (`source/skingrade.py`: chroma ×0.78, L* −6
   on the measured patch mean). Then re-measure *inside the jharokha grade* once the 2D target is decided (JUDGE §5).
7. **Soft-volume mouth** (JUDGE-r8 fix 2). Cheek and chin warps keyed on jawOpen and mouthSmile, since painted cheeks
   carry visible form.
8. **Acting presets re-scored.** `teacher-presets-per-face` (rejected.md): presets do not transfer between faces. The
   five frames here are the acting targets for rest, speaking, listening, thinking (eyes up, level brows: JUDGE §2.3)
   and warm. Re-score every preset blind on this face.

## 4. Carried over as code (no rewrite)

`polish-r8/layers.py` (cut and de-halo framework), `lidkeys.py`, `gen-keys.mjs` (yaw plates + lids; rewrite the prompt's
identity text: "the same person as in the input image"), `landmarks.py`, `keyfield.py`, `plates.py`, `regplate.py`,
`bunfix.py`, `bodyfill.py`, `gen-mouths-r2.mjs`, `cut-mouths-r2.py`, `mouthshape.py`, `interior.py`, `pack.py`,
`battery.py` / `battery.sh`, `fringe.py`, `teargate.py`, `hairgate.py`, `restssim.py`, `eyepass.py`, `turncmp.py`,
`judge-blind.mjs` / `emo-ceiling.mjs` (REF becomes `s3-graphic`), `shoot.mjs`, `record.mjs`, `imgapi.mjs` (the ledger
and hard stop). The runtime: `gl.js`, `lips.js`, `life.js`, `expr.js` and `rig.js` (after §3.1). The driver stack
(`src/face-puppet/driver.ts`, `PuppetDriver`, lip-sync, behaviour, the duplex and TTS bridges) is untouched: the
HeadRig parameter names do not change.

## 5. The two-day gate (do this before anything else)

- **Build only:** `bg`, `hairback`, `body`, `face` (with the painted completion), `hair`, the eye stack with the painted
  closed lid, brows, and 6 mouths (`sil`, `PP`, `aa`, `O`, `E`, smile-`sil`), plus the turn at ±12° with plate blend
  and relight.
- **Show:** a 10 s clip at the 90 × 117 lesson slot and at 250 px tall, inside the jharokha grade: blink, three words of
  lip-sync, a listening tilt, a thinking glance, a turn. Put it next to the same clip of r8.
- **Pass:** the owner says it is her and premium. My eye finds no smear, swim or seam at 1:1. A blind "moving
  photograph / uncanny" question (n = 5, two model families) comes back ≤ 1/5.
- **Fail → option 4** (`w1-flat`). Its flat colour fields are what the r8 cutter and membrane fill already handle. Its
  shading is a few flat violet planes that can be moved per yaw. First, make one new front with stronger age cues
  (blind ages are 25-35 today) and re-run the five edits (about 6-7 images).

## 6. Image budget and effort

| item | calls | quality | USD [U] |
|---|---|---|---|
| completion edits (face blank, forehead, ears, iris, bun, nape) × 2 tries | ~14 | high | ~3 |
| mid lid + yaw ±25° plates (+ retries) | ~6 | high | ~1.3 |
| mouth set: 39 lip patches + 5 tongue + 30 % retries (PLAN §6.2) | ~58 | medium | ~3 |
| optional clean front with fewer strands | 1-2 | high | ~0.4 |
| blind judges | ~40 calls | text | ~2 |
| **total** | **~80 images** | | **≈ USD 10** |

The cost comes from measured usage: 7,024 output tokens per high-quality 1024² image at $30/M (≈ $0.21) in this
session [M]. Medium quality ≈ $0.05 [R: rj-image-medium-quality].

Effort [U], in agent days, from the r1-r8 history:
- the gate (§5): 2;
- the full layer set and mouth list, physics, presets: 3;
- polish rounds L1-L3 against the r8 gates: 3-4;
- B1 device bench on a Mali-G52-class phone and Integrate (PLAN §8: a look-kind switch, the pack, and `PUPPET_REV`): 1-2.

**About 2 to 2.5 weeks**, with an owner look at the gate and after L3. Option 4 would be about 1 to 1.5 weeks after its
new front: the same steps without the completion, relight and matting work.

## 7. Kill rule (carried from PLAN §9.4)

If, after the gate or after L3, the owner says "not her" or "not premium", stop and report. Do not run another polish
loop on the same method.
