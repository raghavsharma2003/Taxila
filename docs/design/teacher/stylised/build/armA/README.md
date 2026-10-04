# Arm A: procedural style C teacher (2026-10-04)

The teacher is built entirely from our own scripts in `scripts/character/stylised/armA/`. No image-to-3D model, no
third-party asset, and no GPU were used. Every shape is a number in `params.json`, so the polish loop edits numbers,
not vertices.

## Rebuild

```
PY=/tmp/claude-0/char/bpyenv/bin/python; cd scripts/character/stylised/armA
$PY build.py /tmp/claude-0/sa/build/final.blend          # mesh, parts, materials, 82 shape keys (~20 s)
$PY gates.py /tmp/claude-0/sa/build/final.blend gates.json
$PY export.py /tmp/claude-0/sa/build/final.blend raw.glb && node finish.mjs raw.glb art/character/stylised/armA/teacher.glb
RES=768 SPP=40 $PY render.py final.blend <dir> front q3L q3R profile back close eyes pose:<name> ...
$PY sheets.py <dir> docs/design/teacher/stylised/build/armA
```

## What it is

| file | role |
|---|---|
| `sdf.py` | Analytic head: a smooth union of rounded primitives (cranium, face, jaw, chin, cheeks, forehead, button nose, lips, neck). |
| `head.py` | A front-weighted cube-sphere ray-cast onto the head. Eye and mouth patches are inset into concentric named rings: 4 eye rings, 5 mouth rings, a lid tuck and a closed mouth bag. Each ring sits on an analytic curve, and the vertices sit on the lid sphere so the lids wrap the ball. |
| `parts.py` | Eyeball with its sides tucked, cornea shell, procedural iris, liner with a wing, tube brows, teeth arches, tongue, ears, gold studs, bindi, swept solid hair shells, bun, two locks, lofted kurta with piping. |
| `keys.py` | Rig-then-bake (plan §5.1) with no armature. Lids rotate on the eye sphere. The jaw rotates about a pivot, with weights smoothed over the mesh. Lip, cheek, brow and tongue channels are falloff fields. Keys = 52 ARKit + 15 visemes (the §5.3 recipes) + 3 Hindi tongue keys + 12 correctives, each computed as F(a+b)−F(a)−F(b)+rest. |
| `export.py` | 7 draw groups and the HeadRig skeleton (Spine2, Neck, Head, LeftEye, RightEye). |
| `finish.mjs` | meshopt compression. |

## Measured (this build, n = 1 build, `gates.json`)

- **Size:** 24,512 tris; GLB 0.63 MB (meshopt). The per-mesh split is in `art/character/stylised/armA/teacher_stats.json`.
- **G1 names:** 82/82 pass.
- **G3 mirror:** 0.0 mm, pass.
- **G4 lid seal:** 0.0% ball rays at blink, blink + lookDown, blink + squint and blink + cheekSquint.
- **G5/G6 mouth:** 0 interior or teeth rays at rest and at PP. At jaw 0.3 + close 0.3 (+ corrective), 1.5% of seam rays still reach the interior. The plan's bar is 0, so this one is still open.
- **Skin inside the eyeball:** 0 vertices at rest, blink and squint.
- **Not run:** partial-weight G-partial, a phone FPS bench, the B+ LOD, and the vision judge.

## Honest verdict (by eye, mine, one look; not a judge or the owner)

At thumbnail the render reads as the same *design*: hair shape and parting, bindi, brows, big brown eyes with a liner
wing and catchlight, teal kurta with orange piping, gold studs. At full size it is **not yet Memoji quality**. I would
score it 2.5/5 against `c-front.webp`.

**Gaps, in order of payoff:**
1. **Lower face.** The midface reads flat and wide, the nose and cheek planes are weak, and the profile muzzle reads wrong. This is the plan's §3.4 risk: the outline is fitted, the planes in between are not.
2. **Rest smile.** It is too small and the lips read as a flat bar. The concept has soft volume and lifted corners.
3. **Hair.** It reads too tall and helmet-like with visible clump ridges, and a V seam shows at the back.
4. **Neck.** It is long and thin.
5. **Eye surround.** There are faint dents around the eye rings.
6. **Teeth.** A dark notch at the upper-teeth centre shows in some visemes.

**Recommendation:** use Arm B's sculpt to inform region 1, per §4.4, before the owner's look. If the owner says "not the
same character" after the polish rounds, the §10 kill rule moves the work to the 2D puppet.
