"""P1: segment c-front into layer masks (colour classes + hand geometry), checked by overlay PNGs by eye.

    python3 scripts/character/puppet2d/P/segment.py

Output: art/character/puppet2d/P/work/masks.npz (+ overlay PNG). Coordinates are c-front pixels (1024^2).
Hand geometry (all from by-eye reads of c-front at 2-3x zoom with a 10/20 px grid, 2026-10-04) lives in GEOM so the
cut is data, not code.
"""
import json
import numpy as np
import cv2
from PIL import Image
from scipy import ndimage as ndi

SRC = "art/character/puppet2d/P/c-front.png"
OUT = "art/character/puppet2d/P/work"
im = np.asarray(Image.open(SRC).convert("RGB")).astype(np.float32)
H, W = im.shape[:2]
R, G, B = im[..., 0], im[..., 1], im[..., 2]
lum = 0.299 * R + 0.587 * G + 0.114 * B
yy, xx = np.mgrid[0:H, 0:W]

GEOM = {
    # face outline below the hair (left side, chin, right side), x,y pairs; closed upward through the hair
    "jaw": [(322, 470), (326, 520), (338, 565), (356, 605), (380, 640), (410, 668), (450, 691), (490, 705), (530, 711),
            (570, 705), (603, 691), (640, 662), (675, 628), (705, 590), (726, 545), (736, 500), (738, 460)],
    "face_top": [(738, 420), (700, 300), (600, 215), (530, 200), (450, 215), (360, 300), (322, 420)],
    "earL": [(250, 430), (305, 430), (318, 560), (285, 575), (250, 540)],
    "earR": [(745, 420), (808, 420), (808, 545), (775, 572), (740, 560)],
    "lockL": [(278, 440), (318, 440), (330, 560), (320, 640), (338, 700), (322, 730), (296, 730), (300, 690), (282, 600), (284, 520)],
    "lockR": [(728, 395), (760, 395), (788, 520), (792, 620), (790, 705), (770, 705), (762, 640), (742, 560), (732, 480)],
    "bun": [(600, 575), (700, 560), (760, 600), (765, 700), (720, 745), (640, 745), (600, 700)],
    "neckR_extend": [(600, 690), (632, 690), (628, 745), (596, 745)],
    "browL": (346, 335, 480, 392), "browR": (566, 325, 712, 392),
    "eyeL": (348, 400, 480, 505), "eyeR": (575, 392, 712, 500),
    "mouth": (440, 560, 620, 690),
}


def poly(pts):
    m = np.zeros((H, W), np.uint8)
    cv2.fillPoly(m, [np.array(pts, np.int32)], 1)
    return m.astype(bool)


def box(b):
    m = np.zeros((H, W), bool)
    m[b[1]:b[3], b[0]:b[2]] = True
    return m


# ---- colour classes
dark = (lum < 118) & ((R - B) < 45) & (B < R + 12) & (G < R + 12)
bg = (lum > 205) & (B > 150) & (R > 235) & ((R - B) < 80)
teal = (G > R + 25) & (B > R + 25)
gold = (R > 170) & (G > 140) & (B < 150) & ((R - B) > 60) & (G > 0.72 * R)

# ---- face region: inside jaw + top polygon
face_poly = poly(GEOM["jaw"] + GEOM["face_top"])
feat = box(GEOM["browL"]) | box(GEOM["browR"]) | box(GEOM["eyeL"]) | box(GEOM["eyeR"]) | box(GEOM["mouth"])
# hair mass = dark components that are not wholly inside a feature box (brows, lashes, pupils, lips)
lab, n = ndi.label(dark)
hair_all = np.zeros((H, W), bool)
for i, sl in enumerate(ndi.find_objects(lab), 1):
    comp = lab[sl] == i
    if comp.sum() < 30:
        continue
    ys, xs = sl
    inside = any(xs.start >= b[0] - 4 and xs.stop <= b[2] + 4 and ys.start >= b[1] - 4 and ys.stop <= b[3] + 4
                 for b in (GEOM["browL"], GEOM["browR"], GEOM["eyeL"], GEOM["eyeR"], GEOM["mouth"]))
    if not inside:
        hair_all[sl] |= comp
hair_all = ndi.binary_closing(hair_all, iterations=2)
# soft anti-aliased hair edge band: pixels between hair and anything, darkish
lockL, lockR, bunP = poly(GEOM["lockL"]), poly(GEOM["lockR"]), poly(GEOM["bun"])
earL, earR = poly(GEOM["earL"]), poly(GEOM["earR"])

locks_L = hair_all & lockL & (yy > 455)
locks_R = hair_all & lockR & (yy > 470)
bun = hair_all & bunP & ~lockR
hair = hair_all & ~locks_L & ~locks_R & ~bun

face = face_poly & ~hair_all
ears = (earL | earR) & ~hair_all & ~face_poly & ~bg
body = (yy > 640) & ~face_poly & ~hair_all & ~bg & ~ears
body &= ~((yy < 700) & ~((xx > 420) & (xx < 640)))   # nothing body-like beside the cheeks
background = ~(face | hair_all | ears | body)

masks = dict(face=face, hair=hair, bun=bun, lockL=locks_L, lockR=locks_R, ears=ears, body=body, bg=background,
             feat=feat, face_poly=face_poly)
np.savez_compressed(f"{OUT}/masks.npz", **masks)
json.dump(GEOM, open(f"{OUT}/geom.json", "w"), indent=1)

# overlay
col = {"face": (255, 200, 0), "hair": (60, 60, 255), "bun": (255, 0, 255), "lockL": (0, 255, 0), "lockR": (0, 255, 0),
       "ears": (255, 0, 0), "body": (0, 255, 255)}
ov = im.copy()
for k, c in col.items():
    ov[masks[k]] = ov[masks[k]] * 0.45 + np.array(c) * 0.55
Image.fromarray(ov.clip(0, 255).astype(np.uint8)).save(f"{OUT}/seg-overlay.png")
print({k: int(v.sum()) for k, v in masks.items()})
