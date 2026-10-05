"""Full-size artefact battery, analysis (judge r2 fix 3). Each pose is rendered at 1024 over cream AND teal
(battery.sh). Per pixel, alpha = 1 - |cream - teal| / |creamBG - tealBG|: where the backdrop shows through, the two
renders differ. Flags per pose:
  holes    backdrop showing (alpha < 0.85) in a component NOT connected to the outer backdrop (inside the character)
  seams    partial alpha (0.06..0.85) more than 3 px inside the silhouette (a light line over teal, a dark one over cream)
  islands  opaque components (alpha > 0.5) disconnected from the main body
Writes work/battery/report.json and 4x crops of every flagged region (work/battery/crops/).
    python3 scripts/character/puppet2d/polish-r10/battery.py
"""
import json
import os
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

D = "art/character/puppet2d/polish-r10/work/battery"
CR, TE = np.array([251.4, 229.4, 188.6]), np.array([30, 128, 128], float)
os.makedirs(f"{D}/crops", exist_ok=True)
names = sorted(f[:-4] for f in os.listdir(f"{D}/cream") if f.endswith(".png"))
rep = {"poses": {}, "totals": {"holes": 0, "seams": 0, "islands": 0}}
crops = []
for n in names:
    c = np.asarray(Image.open(f"{D}/cream/{n}.png").convert("RGB")).astype(float)
    t = np.asarray(Image.open(f"{D}/teal/{n}.png").convert("RGB")).astype(float)
    a = 1 - np.linalg.norm(c - t, axis=2) / np.linalg.norm(CR - TE)
    a = np.clip(a, 0, 1)
    bgm = a < 0.85
    lab, k = ndi.label(bgm)
    # the outer backdrop: components touching the frame
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    outer = np.isin(lab, list(edge))
    holes = bgm & ~outer
    # ignore 1-px dust at the AA rim of the silhouette (within 1 px of the outer backdrop)
    holes &= ~ndi.binary_dilation(outer, iterations=1)
    fg = a > 0.5
    near_bg = ndi.binary_dilation(a < 0.5, iterations=2)
    seams = (a > 0.06) & (a < 0.85) & ~near_bg
    # an enclosed backdrop region bigger than 400 px is a real gap of the design (between a lock and the neck, inside
    # a curl): not a hole. Small enclosed specks are the defects.
    hl, hk = ndi.label(holes)
    if hk:
        hs = ndi.sum(holes, hl, range(1, hk + 1))
        holes = np.isin(hl, 1 + np.where(hs < 400)[0])
    flab, fk = ndi.label(fg)
    if fk:
        sz = ndi.sum(fg, flab, range(1, fk + 1))
        main = 1 + int(np.argmax(sz))
        isl = fg & (flab != main)
    else:
        isl = np.zeros_like(fg)
    # the gap between the two strands of a lock is part of the design (c-front shows the backdrop through it): a hole or
    # seam whose surrounding ring is almost all hair is not a defect
    lumc = 0.299 * c[..., 0] + 0.587 * c[..., 1] + 0.114 * c[..., 2]
    hairy = (lumc < 95) & (a > 0.85)
    def design_gap(m):
        L, K = ndi.label(m)
        keep = np.zeros_like(m)
        for i, sl in enumerate(ndi.find_objects(L), 1):
            y0, y1, x0, x1 = max(0, sl[0].start - 3), sl[0].stop + 3, max(0, sl[1].start - 3), sl[1].stop + 3
            comp = L[y0:y1, x0:x1] == i
            ring = ndi.binary_dilation(comp, iterations=2) & ~comp & (a[y0:y1, x0:x1] > 0.85)
            if ring.sum() and hairy[y0:y1, x0:x1][ring].mean() > 0.9:
                continue
            keep[y0:y1, x0:x1] |= comp
        return keep
    holes = design_gap(holes)
    seams = design_gap(seams)
    r = {}
    for kind, m, mn in (("holes", holes, 2), ("seams", seams, 3), ("islands", isl, 2)):
        L, K = ndi.label(m)
        regs = []
        for i, sl in enumerate(ndi.find_objects(L), 1):
            s_ = int((L[sl] == i).sum())
            if s_ < mn:
                continue
            regs.append({"n": s_, "box": [sl[1].start, sl[0].start, sl[1].stop, sl[0].stop]})
        r[kind] = regs
        rep["totals"][kind] += len(regs)
        for g in regs[:6]:
            crops.append((n, kind, g))
    rep["poses"][n] = {k: len(v) for k, v in r.items()} | {"detail": r}
json.dump(rep, open(f"{D}/report.json", "w"), indent=0)
# crops: 4x, 64 px windows centred on each flagged region, over teal (seams show light there)
crops.sort(key=lambda x: -x[2]["n"])
tiles = []
for n, kind, g in crops[:80]:
    x0, y0, x1, y1 = g["box"]
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    im = Image.open(f"{D}/teal/{n}.png").convert("RGB").crop((cx - 32, cy - 32, cx + 32, cy + 32)).resize((256, 256), Image.NEAREST)
    tiles.append((f"{n} {kind} {g['n']}px @{cx},{cy}", im))
if tiles:
    from PIL import ImageDraw
    cols = 6
    M = Image.new("RGB", (256 * cols, 270 * ((len(tiles) + cols - 1) // cols)), (20, 20, 20))
    dr = ImageDraw.Draw(M)
    for i, (lbl, im) in enumerate(tiles):
        x, y = (i % cols) * 256, (i // cols) * 270
        M.paste(im, (x, y + 14))
        dr.text((x + 2, y + 1), lbl[:42], fill=(255, 255, 255))
    M.save(f"{D}/flags.png")
print(json.dumps(rep["totals"]))
worst = sorted(rep["poses"].items(), key=lambda kv: -(kv[1]["holes"] + kv[1]["seams"] + kv[1]["islands"]))[:15]
for n, v in worst:
    print(n, v["holes"], v["seams"], v["islands"], [(g["n"], g["box"][:2]) for g in (v["detail"]["holes"] + v["detail"]["seams"] + v["detail"]["islands"])[:5]])
