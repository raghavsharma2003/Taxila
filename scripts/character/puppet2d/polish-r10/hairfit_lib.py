"""r10: hairfit.py's detectors (hair cap mask, extents, part line)."""
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
