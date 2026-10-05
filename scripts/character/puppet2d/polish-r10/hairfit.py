"""r10 (judge r9 fix 3, METHOD CHANGE: turn the hair, not only the face). Measures the hair CAP in the painted 30-degree keys
against c-front, in c-front's frame (each key normalised by the keyfield's fitted similarity: X = (px - kcx) * s + fcx,
Y = (py - ke) * s + fe, geom.yawKeys.norm), the way lightfit.py measured the skin light:
  - per row (y 60..420): the hair silhouette's left / right extents (dark, low-chroma pixels connected to the cap)
  - the part line: the darkest groove of the cap's top (y 70..170) within +-80 px of the cap centre
  - the hair-cap luminance per row on the far and near halves (for the hair relight)
Writes keys/hairfit.json and work/hairfit.png (key, c-front and the overlay of the two silhouettes).
    python3 scripts/character/puppet2d/polish-r10/hairfit.py"""
import json
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
R = "art/character/puppet2d/polish-r10/"
g = json.load(open(R + "layers/geom.json"))
N = g["yawKeys"]["norm"]
def norm_key(path, n):
    im = Image.open(path).convert("RGB")
    s = n["s"]
    # c-front px (X, Y) <- key px: px = (X - fcx) / s + kcx
    a = (1 / s, 0, n["kcx"] - n["fcx"] / s, 0, 1 / s, n["ke"] - n["fe"] / s)
    return im.transform((1024, 1024), Image.AFFINE, a, resample=Image.BICUBIC, fillcolor=(250, 229, 189))
def hairmask(im):
    a = np.asarray(im).astype(np.float32)
    L = a.mean(-1); C = a.max(-1) - a.min(-1)
    m = (L < 95) & (C < 45)
    m = ndi.binary_opening(m, iterations=1)
    lab, n = ndi.label(m)
    # the cap: the component under (512, 120)
    k = lab[120, 512] or lab[150, 520]
    cap = lab == k
    return ndi.binary_fill_holes(cap), L
out = {}
cf = Image.open(R + "c-front.png").convert("RGB")
mc, Lc = hairmask(cf)
def extents(m):
    rows = {}
    for y in range(50, 440, 10):
        xs = np.nonzero(m[y])[0]
        if len(xs): rows[y] = [int(xs.min()), int(xs.max())]
    return rows
def part(L, m):
    # the part: the darkest smoothed column in the cap's top band, near the centre
    band = np.where(m[70:170], L[70:170], 255).astype(np.float32)
    prof = ndi.gaussian_filter1d(band.mean(0), 3)
    xs = np.arange(1024); w = (xs > 380) & (xs < 680)
    return int(xs[w][np.argmin(prof[w])])
out["front"] = {"ext": extents(mc), "part": part(Lc, mc)}
for side, f in (("L", "yawL30-0.png"), ("R", "yawR30-0.png")):
    k = norm_key(R + "keys/" + f, N[side])
    mk, Lk = hairmask(k)
    e = extents(mk)
    # luminance of the cap per half (left / right of the key's own part), rows 80..300
    pk = part(Lk, mk)
    lum = {}
    for y in range(80, 320, 20):
        row = mk[y]
        lft = Lk[y][row & (np.arange(1024) < pk)]; rgt = Lk[y][row & (np.arange(1024) > pk)]
        lum[y] = [round(float(lft.mean()), 1) if len(lft) else None, round(float(rgt.mean()), 1) if len(rgt) else None]
    out[side] = {"ext": e, "part": pk, "lum": lum}
    k.save(R + f"work/key{side}30-norm.png")
    # overlay: c-front cap red, key cap green
    ov = np.zeros((1024, 1024, 3), np.uint8); ov[..., 0] = mc * 200; ov[..., 1] = mk * 200
    Image.fromarray(ov).save(R + f"work/hairov-{side}.png")
lumF = {}
pf = out["front"]["part"]
for y in range(80, 320, 20):
    row = mc[y]
    lft = Lc[y][row & (np.arange(1024) < pf)]; rgt = Lc[y][row & (np.arange(1024) > pf)]
    lumF[y] = [round(float(lft.mean()), 1), round(float(rgt.mean()), 1)]
out["front"]["lum"] = lumF
json.dump(out, open(R + "keys/hairfit.json", "w"), indent=1)
print("part front", out["front"]["part"], "L30", out["L"]["part"], "R30", out["R"]["part"])
for y in range(60, 440, 40):
    print(y, "front", out["front"]["ext"].get(y), "L30", out["L"]["ext"].get(y), "R30", out["R"]["ext"].get(y))
for y in range(80, 320, 40): print("lum", y, lumF[y], out["L"]["lum"][y], out["R"]["lum"][y])
