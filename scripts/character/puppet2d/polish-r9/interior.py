"""r3 mouth interior atlas, cut from the gpt-image-2 mouth atlas (layers/mouths.png): the ONLY use of the painted mouths
in r3. The lips themselves are c-front's own lips on a warped shell (rig.js). Output: layers/interior.png (128 x 64 RGBA,
straight alpha) with four canonical strips, u = 0..1 across the mouth's inner width:
  rows  0-15  upper teeth, top-anchored (row 0 = the teeth's top edge under the upper lip)   from 'laugh'
  rows 16-31  lower teeth, bottom-anchored (row 31 = the teeth's bottom edge on the lower lip) from 'E'
  rows 32-47  cavity, top (row 32, back/roof, darkest) to bottom (row 47, floor)               from 'aa'
  rows 48-63  tongue surface, tip/front (row 48) to back (row 63)                              from 'LL'
    python3 scripts/character/puppet2d/polish-r9/interior.py
"""
import json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

L = "art/character/puppet2d/polish-r9/layers"
m = json.load(open(f"{L}/mouths.json"))
A = np.asarray(Image.open(f"{L}/mouths.png").convert("RGBA")).astype(np.float32)
W = 128


def cell(n):
    x, y = m["patches"][n]["cell"]
    return A[y:y + 135, x:x + 213, :3]


def lumf(c):
    return 0.299 * c[..., 0] + 0.587 * c[..., 1] + 0.114 * c[..., 2]


def teeth_mask(c):
    R, B = c[..., 0], c[..., 2]
    t = np.clip((lumf(c) - 135) / 30.0, 0, 1) * np.clip((80 - (R - B)) / 15.0, 0, 1)
    t[:30] = 0
    t[110:] = 0
    return t


out = np.zeros((64, W, 4), np.float32)

# ---- upper teeth (laugh): per column the first teeth row, then 16 rows down
c = cell("laugh")
t = teeth_mask(c)
cols = [x for x in range(c.shape[1]) if t[:, x].max() > 0.6]
x0, x1 = min(cols), max(cols)
strip = np.zeros((16, x1 - x0 + 1, 4), np.float32)
for i, x in enumerate(range(x0, x1 + 1)):
    ys = np.where(t[:, x] > 0.5)[0]
    if not len(ys):
        continue
    top = ys.min() - 1
    for j in range(16):
        y = top + j
        strip[j, i, :3] = c[y, x]
        strip[j, i, 3] = 255 * (t[y, x] if j > 0 else t[y, x] * 0.6)
# teeth must be a continuous row: fill colour sideways where alpha is low (the cut's gaps between teeth are kept
# as the low-contrast separations painted in the atlas)
for j in range(16):
    a = strip[j, :, 3]
    if a.max() > 0:
        known = a > 0.3 * 255
        for ch in range(3):
            strip[j, :, ch] = np.interp(np.arange(len(a)), np.where(known)[0], strip[j, known, ch]) if known.any() else strip[j, :, ch]
up = np.asarray(Image.fromarray(strip.clip(0, 255).astype(np.uint8), "RGBA").resize((W, 16), Image.LANCZOS)).astype(np.float32)
# a clean edge: per column the teeth's bottom (alpha 0.5 crossing), smoothed along the row with a soft scallop kept,
# then alpha re-drawn as exact coverage of that edge (the raw cut was ragged at 2x)
_a = up[..., 3] / 255.0
def _edge(col):
    # first falling 0.5 crossing below the top rows (sub-pixel)
    for j in range(2, 16):
        if col[j] < 0.5 <= col[j - 1]:
            return j - 1 + (col[j - 1] - 0.5) / max(1e-3, col[j - 1] - col[j]) + 0.5
    return 16.0 if col[2:].min() >= 0.5 else 0.0
_bot = np.array([_edge(_a[:, i]) for i in range(W)])
print("teeth edge px", np.round(_bot[::8], 1))
# the painted edge, cut at 1x, is ragged; the drawn edge is a clean curve at the painted mean height with a soft
# regular scallop (8 front teeth across the row, the centre pair largest), as the atlas teeth read at full size
_uu = (np.arange(W) + 0.5) / W
_mean = np.median(_bot[W // 4: 3 * W // 4])
_n = 8
_ph = (_uu * _n) % 1.0
_sc = np.sqrt(np.clip(np.sin(np.pi * _ph), 0, 1))
_bs = _mean * (1 - 0.22 * (2 * _uu - 1) ** 2) - 1.1 * (1 - _sc) + 0.5 * np.exp(-((_uu - 0.5) / 0.09) ** 2)
# a faint separation between teeth (darker colour along the scallop troughs), from the painted row's own shading
_sep = np.exp(-((_ph - 0.0) / 0.06) ** 2) + np.exp(-((_ph - 1.0) / 0.06) ** 2)
_rows = np.arange(16)[:, None] + 0.5
up[..., 3] = 255 * np.clip(_bs[None, :] - _rows + 0.5, 0, 1) * np.clip(_rows + 0.5, 0, 1)
up[0:3, :, :3] = up[3:4, :, :3]          # the top rows hide under the lip: solid tooth colour (no mixed-pixel specks)
up[..., 3] = np.where(np.arange(16)[:, None] < 3, 255 * (_bs[None, :] > 3), up[..., 3])
for _r in range(16):                      # colour under low alpha = the nearest solid row above (no dark fringe)
    if _r > 0:
        _w = (up[_r, :, 3] < 200)[:, None]
        up[_r, :, :3] = np.where(_w, up[_r - 1, :, :3], up[_r, :, :3])
for _c in range(3):
    up[..., _c] = ndi.gaussian_filter(up[..., _c], (0.6, 2.0))
up[..., :3] *= (1 - 0.05 * _sep)[None, :, None]
out[0:16] = up

# ---- lower teeth (E): per column the last teeth row, 16 rows up
c = cell("E")
t = teeth_mask(c)
t[:58] = 0   # the lower row only
cols = [x for x in range(c.shape[1]) if t[:, x].max() > 0.5]
x0, x1 = min(cols), max(cols)
strip = np.zeros((16, x1 - x0 + 1, 4), np.float32)
for i, x in enumerate(range(x0, x1 + 1)):
    ys = np.where(t[:, x] > 0.4)[0]
    if not len(ys):
        continue
    bot = ys.max() + 1
    for j in range(16):
        y = bot - 15 + j
        strip[j, i, :3] = c[y, x]
        strip[j, i, 3] = 255 * t[y, x]
for j in range(16):
    a = strip[j, :, 3]
    known = a > 0.3 * 255
    if known.any():
        for ch in range(3):
            strip[j, :, ch] = np.interp(np.arange(len(a)), np.where(known)[0], strip[j, known, ch])
lo = np.asarray(Image.fromarray(strip.clip(0, 255).astype(np.uint8), "RGBA").resize((W, 16), Image.LANCZOS)).astype(np.float32)
# the E cell's lower row is 2-3 px of mixed pixels: the upper row, mirrored and a touch shaded, reads better
lo = up[::-1].copy()
lo[..., :3] *= np.array([0.9, 0.86, 0.82])
out[16:32] = lo

# ---- cavity (aa): the dark region below the teeth, column-normalised top..bottom, averaged into a 2D field
c = cell("aa")
lm = lumf(c)
tm = teeth_mask(c)
cols = [x for x in range(c.shape[1]) if tm[40:70, x].max() > 0.5 and 75 <= x <= 140]
x0, x1 = min(cols), max(cols)
cav = np.zeros((16, x1 - x0 + 1, 3), np.float32)
for i, x in enumerate(range(x0, x1 + 1)):
    y0 = np.where(tm[40:70, x] > 0.3)[0].max() + 40 + 3
    y1 = y0
    while y1 < 125 and c[y1 + 1, x, 0] < 165:
        y1 += 1
    yy = np.linspace(y0, y1, 16)
    for ch in range(3):
        cav[:, i, ch] = np.interp(yy, np.arange(135), ndi.gaussian_filter1d(c[:, x, ch], 1.0))
cav = ndi.gaussian_filter(cav, (0.8, 2.0, 0))
cv = np.asarray(Image.fromarray(cav.clip(0, 255).astype(np.uint8), "RGB").resize((W, 16), Image.LANCZOS)).astype(np.float32)
out[32:48, :, :3] = cv
out[32:48, :, 3] = 255

# ---- tongue (LL): pink, lighter than lip (B high relative to lip); centre columns, front to back
c = cell("LL")
R, G, B = c[..., 0], c[..., 1], c[..., 2]
tg = (B > 95) & (R > 180) & ((R - G) > 55) & ((R - G) < 110)
tg[:45] = False
tg[100:] = False
lab, n = ndi.label(tg)
big = lab == (1 + int(np.argmax(ndi.sum(tg, lab, range(1, n + 1)))))
ys, xs = np.where(big)
print("tongue box", xs.min(), xs.max(), ys.min(), ys.max())
x0, x1 = xs.min(), xs.max()
tng = np.zeros((16, x1 - x0 + 1, 3), np.float32)
for i, x in enumerate(range(x0, x1 + 1)):
    yy0 = np.where(big[:, x])[0]
    if not len(yy0):
        tng[:, i] = np.nan
        continue
    yy = np.linspace(yy0.min(), yy0.max(), 16)
    for ch in range(3):
        tng[:, i, ch] = np.interp(yy, np.arange(135), c[:, x, ch])
for ch in range(3):
    col = tng[:, :, ch]
    msk = np.isnan(col)
    col[msk] = np.nanmean(col)
tng = ndi.gaussian_filter(tng, (0.8, 2.0, 0))
tv = np.asarray(Image.fromarray(tng.clip(0, 255).astype(np.uint8), "RGB").resize((W, 16), Image.LANCZOS)).astype(np.float32)
out[48:64, :, :3] = tv
out[48:64, :, 3] = 255
Image.fromarray(out.clip(0, 255).round().astype(np.uint8), "RGBA").save(f"{L}/interior.png")
print("wrote", f"{L}/interior.png")
big8 = Image.fromarray(out.clip(0, 255).round().astype(np.uint8), "RGBA").resize((W * 6, 64 * 6), Image.NEAREST)
bg = Image.new("RGBA", big8.size, (40, 160, 160, 255))
bg.alpha_composite(big8)
bg.save("art/character/puppet2d/polish-r9/work/interior-6x.png")
