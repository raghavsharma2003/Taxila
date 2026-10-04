"""P5 cut: every mouth edit -> a registered, colour-matched, feathered patch in c-front pixel space, packed in an atlas.

    python3 scripts/character/puppet2d/P/cut-mouths.py

Per edit: downscale the 4x close-up to c-front scale; register to c-front by ECC (translation) on the unedited ring;
colour-match with a per-channel affine fit on the ring between the patch ellipse and the edit mask; cut with the same
feathered ellipse as layers/mouth_rest. Output: art/character/puppet2d/P/layers/mouths.png + mouths.json, and a review
sheet work/mouth-review.png (each patch composited on the rest pose).
"""
import json, glob, os
import numpy as np
import cv2
from PIL import Image

# r2: cut ONLY the new edits in work/mouths-r2 with arm P's exact registration/colour-match, then APPEND them as a new
# row of the polish-r5 atlas (the 30 existing patches stay byte-identical).
#   python3 scripts/character/puppet2d/polish-r5/cut-mouths-r2.py
L = "art/character/puppet2d/polish-r5/layers"
WORK = "art/character/puppet2d/P/work"
X0, Y0, S = 402, 484, 256
g = json.load(open(f"{L}/geom.json"))
mcx, mcy, mrx, mry = g["geom"]["mouth_patch"]
ecx, ecy, erx, ery = g["geom"]["mouth_ellipse"]
ref = np.asarray(Image.open("art/character/puppet2d/polish-r5/c-front.png").convert("RGB")).astype(np.float32)[Y0:Y0 + S, X0:X0 + S]
import sys
sys.path.insert(0, "scripts/character/puppet2d/polish-r5")
import mouthshape
from scipy import ndimage as ndi
SRCDIR = sys.argv[1] if len(sys.argv) > 1 else "art/character/puppet2d/polish-r5/work/mouths-r2"
yy, xx = np.mgrid[0:S, 0:S]
alpha = mouthshape.alpha()[Y0:Y0 + S, X0:X0 + S]
reg = mouthshape.region()[Y0:Y0 + S, X0:X0 + S]
emask = mouthshape.edit_mask()[Y0:Y0 + S, X0:X0 + S]
ed = 1.0 - alpha                          # 0 inside .. 1 at the edge (used for the skin-correction ramp)
ring = (alpha < 0.55) & emask             # under the feather: what must match c-front
outside = ~ndi.binary_dilation(emask, iterations=6)
ys_, xs_ = np.where(alpha > 0.002)
bx0, by0, bx1, by1 = int(xs_.min() - 1), int(ys_.min() - 1), int(xs_.max() + 2), int(ys_.max() + 2)
cw, ch = bx1 - bx0, by1 - by0

files = sorted(glob.glob(f"{SRCDIR}/*.png"))
names = [os.path.basename(f)[:-4] for f in files]
cols = 6
rows = (len(names) + cols - 1) // cols
atlas = np.zeros((rows * ch, cols * cw, 4), np.uint8)
meta = {"cell": [cw, ch], "origin": [bx0 + X0, by0 + Y0], "cols": cols, "patches": {}}
review = []
rest = np.asarray(Image.open(f"{WORK}/rest.png").convert("RGB")).astype(np.float32)
for i, n in enumerate(names):
    if n == "rest":
        p = ref.copy()
        info = {"shift": [0, 0], "gain": [1, 1, 1]}
    else:
        e = np.asarray(Image.open(f"{SRCDIR}/{n}.png").convert("RGB").resize((S, S), Image.LANCZOS)).astype(np.float32)
        warp = np.eye(2, 3, dtype=np.float32)
        try:
            _, warp = cv2.findTransformECC(cv2.cvtColor(ref, cv2.COLOR_RGB2GRAY), cv2.cvtColor(e, cv2.COLOR_RGB2GRAY), warp,
                                           cv2.MOTION_TRANSLATION, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-5),
                                           outside.astype(np.uint8), 5)
        except cv2.error:
            pass
        e = cv2.warpAffine(e, warp, (S, S), flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
        gain = []
        p = e.copy()
        inl = ring.copy()
        for it in range(3):     # robust affine colour fit on skin-like ring pixels
            p = e.copy()
            for c in range(3):
                A = np.c_[e[inl, c], np.ones(inl.sum())]
                k, b0 = np.linalg.lstsq(A, ref[inl, c], rcond=None)[0]
                p[..., c] = e[..., c] * k + b0
                if it == 2:
                    gain.append(round(float(k), 3))
            err = np.abs(p - ref).max(2)
            inl = ring & (err < 18)
        # residual skin-shading field from inlier ring pixels; applied only where the patch itself is skin
        resid = np.zeros_like(p)
        wgt = np.zeros((S, S), np.float32)
        resid[inl] = (ref - p)[inl]
        wgt[inl] = 1
        resid = cv2.GaussianBlur(resid, (0, 0), 8)
        wgt = cv2.GaussianBlur(wgt, (0, 0), 8)[..., None]
        corr = np.clip(resid / np.maximum(wgt, 0.05), -25, 25)
        skinish = np.clip(1 - (np.abs(p - ref).max(2) - 10) / 20, 0, 1) * np.clip((ed - 0.3) / 0.4, 0, 1)
        p = p + corr * skinish[..., None]
        info = {"shift": [round(float(warp[0, 2]), 2), round(float(warp[1, 2]), 2)], "gain": gain}
    cell = np.dstack([np.clip(p, 0, 255), alpha * 255])[by0:by1, bx0:bx1].round().astype(np.uint8)
    r, c = divmod(i, cols)
    atlas[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw] = cell
    meta["patches"][n] = {"cell": [c * cw, r * ch], **info}
    comp = rest[Y0:Y0 + S, X0:X0 + S].copy()
    comp = comp * (1 - alpha[..., None]) + p * alpha[..., None]
    review.append((n, comp[50:230, 20:236]))
old = np.asarray(Image.open(f"{L}/mouths.png").convert("RGBA"))
om = json.load(open(f"{L}/mouths.json"))
assert om["cell"] == [cw, ch] and om["origin"] == meta["origin"], (om["cell"], om["origin"], cw, ch, meta["origin"])
for n in names:
    om["patches"].pop(n, None)
used_rows = max(p["cell"][1] for p in om["patches"].values()) // ch + 1
base = old[: used_rows * ch]
new = np.zeros((used_rows * ch + atlas.shape[0], max(base.shape[1], atlas.shape[1]), 4), np.uint8)
new[: base.shape[0], : base.shape[1]] = base
new[base.shape[0]:, : atlas.shape[1]] = atlas
for n, p in meta["patches"].items():
    om["patches"][n] = {**p, "cell": [p["cell"][0], p["cell"][1] + used_rows * ch]}
Image.fromarray(new, "RGBA").save(f"{L}/mouths.png", optimize=True)
json.dump(om, open(f"{L}/mouths.json", "w"), indent=1)
review = review
from PIL import ImageDraw
tw, th = 216, 180
sheet = Image.new("RGB", (cols * tw, rows * (th + 14)), "white")
d = ImageDraw.Draw(sheet)
for i, (n, im) in enumerate(review):
    r, c = divmod(i, cols)
    sheet.paste(Image.fromarray(np.clip(im, 0, 255).astype(np.uint8)), (c * tw, r * (th + 14) + 14))
    d.text((c * tw + 3, r * (th + 14) + 1), n, fill="black")
sheet.save("art/character/puppet2d/polish-r5/work/mouth-review-r2.png")
print(len(names), "patches; cell", cw, ch)
