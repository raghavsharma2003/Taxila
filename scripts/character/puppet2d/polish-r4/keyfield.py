"""r3 METHOD CHANGE, turn (judge r2 fix 2): angle keyforms from PAINTED 3/4 plates. Landmarks read by hand at 2x on a
20 px grid (keys/yawL-0, keys/yawR-0, c-front; gridcrop.py), plus the cranium silhouette read automatically from the
background mask. Each key is normalised into c-front's frame (vertical scale + offset from the eye and mouth lines, which
a yaw preserves; horizontal offset from the cranium silhouette centre). A regularised thin-plate spline turns the
landmark displacements into a dense field, sampled on a 33 x 33 grid over the canvas -> geom.json "yawKeys". The rig
interpolates between frontal (0) and the painted key (yaw / keyDeg) instead of extrapolating one frontal plate through a
depth proxy. Body anchors (neck and below) are pinned at zero: only the head turns.
    python3 scripts/character/puppet2d/polish-r4/keyfield.py
"""
import json
import numpy as np
from PIL import Image
from scipy.interpolate import RBFInterpolator

K = "art/character/puppet2d/polish-r4/keys"
L = "art/character/puppet2d/polish-r4/layers"
# name: front, yawL (face toward the viewer's left = rig yaw < 0), yawR (toward the right = rig yaw > 0); raw key px
LM = {
    "eyeL_out": [(375.8, 456.7), (355, 422), (445, 420)],
    "eyeL_in": [(469.5, 451.0), (429, 430), (530, 425)],
    "irisL": [(428.7, 457.4), (396, 430), (497.5, 420)],
    "eyeR_in": [(583.3, 451.7), (528.5, 415), (626, 412.5)],
    "eyeR_out": [(683.5, 442.0), (624, 412), (695, 407.5)],
    "irisR": [(628.6, 447.2), (567.5, 417.5), (662.5, 412.5)],
    "browL_out": [(364, 378), (345, 355), (420, 375)],
    "browL_in": [(474, 362), (424, 337), (545, 335)],
    "browR_in": [(574.7, 350), (507.5, 340), (625, 340)],
    "browR_out": [(703.7, 381.6), (642.5, 360), (712.5, 360)],
    "bindi": [(525, 354), (466, 336), (587.5, 330)],
    "nose": [(532.6, 547), (472.5, 520), (590, 505)],
    "nostrilL": [(511.6, 555), (452.5, 515), (570, 505)],
    "nostrilR": [(553.7, 555), (495, 516), (615, 507.5)],
    "mouthL": [(454, 584), (415, 545), (520, 540)],
    "mouthR": [(606, 576), (554, 539), (645, 536)],
    "lip": [(530, 606), (480, 562.5), (585, 555)],
    "lowlip": [(530, 627), (480, 582.5), (585, 575)],
    "earringL": [(316.8, 566.8), (328.5, 528.5), (337.5, 511)],
    "earringR": [(750, 543), (710, 503.5), (725, 495)],
    "faceL": [(345.8, 606), (345, 560), (387.5, 560)],
    "faceR": [(719.5, 606), (660, 560), (712.5, 560)],
    "chin": [(527, 710), (515, 655), (575, 649)],
}
FILES = ["art/character/puppet2d/polish-r4/c-front.png", f"{K}/yawL-0.png", f"{K}/yawR-2.png"]
# r4 (judge r3 fix 3): yawR-2 = the bun-corrected repaint (gen-keys.mjs yawRbun). Its landmarks are the hand-read yawR-0
# ones carried through a dense optical-flow registration (regplate.py, face residual 32 -> 9 grey levels); the two
# points beside the removed left bun (faceL, earringL) sit where the flow is unreliable and take the local -11 px shift.
import os as _os
if _os.path.exists(f"{K}/lmR-r4.json"):
    _m = json.load(open(f"{K}/lmR-r4.json"))
    _m["faceL"] = [LM["faceL"][2][0], LM["faceL"][2][1] - 11.0]
    _m["earringL"] = [LM["earringL"][2][0] + 1.0, LM["earringL"][2][1] - 11.0]
    for _k in LM:
        LM[_k][2] = tuple(_m[_k])


def bgmask(p):
    im = np.asarray(Image.open(p).convert("RGB")).astype(float)
    R, G, B = im[..., 0], im[..., 1], im[..., 2]
    lum = 0.299 * R + 0.587 * G + 0.114 * B
    # r4: relative to the plate's own backdrop (yawR-2's cream is 6 levels yellower: R-B hit the old fixed 80 cut-off)
    ref = np.median(np.concatenate([im[:40, :40].reshape(-1, 3), im[:40, -40:].reshape(-1, 3)]), 0)
    return (np.abs(im - ref).max(-1) < 18) & (lum > 195)


def eye_mouth(i):
    ey = (LM["irisL"][i][1] + LM["irisR"][i][1]) / 2
    my = (LM["mouthL"][i][1] + LM["mouthR"][i][1]) / 2
    return ey, my


def cranium_cx(bg, y0, y1):
    c = []
    for y in range(y0, y1, 8):
        r = np.where(~bg[y, 120:900])[0]
        if len(r):
            c.append(120 + 0.5 * (r.min() + r.max()))
    return float(np.mean(c))


bgs = [bgmask(f) for f in FILES]
fe, fm = eye_mouth(0)
fcx = cranium_cx(bgs[0], 80, 300)
out = {"keyDeg": 20.0,  # r4: the painted plate is reached exactly at the contract's yaw limit (+-20): no extrapolation
       "grid": {"x0": 0, "y0": 0, "step": 32, "n": 33}}
report = {}
for ki, name in ((1, "L"), (2, "R")):
    ke, km = eye_mouth(ki)
    s = (fm - fe) / (km - ke)
    # cranium rows of the key that correspond (normalised) to front rows 80..300
    kcx = cranium_cx(bgs[ki], int((80 - fe) / s + ke), int((300 - fe) / s + ke))
    norm = lambda p: ((p[0] - kcx) * s + fcx, (p[1] - ke) * s + fe)
    src, dst = [], []
    for k, v in LM.items():
        src.append(v[0]); dst.append(norm(v[ki]))
    # cranium silhouette: matching normalised rows, left and right edges
    for y in range(70, 420, 30):
        yk = int(round((y - fe) / s + ke))
        rf = np.where(~bgs[0][y, 120:900])[0]
        rk = np.where(~bgs[ki][yk, 120:900])[0]
        if len(rf) and len(rk):
            src += [(120 + rf.min(), y), (120 + rf.max(), y)]
            dst += [norm((120 + rk.min(), yk)), norm((120 + rk.max(), yk))]
    # the crown (topmost head pixel near the centre)
    def crown(bg):
        cols = np.where((~bg[:300]).any(0))[0]
        ys = [np.where(~bg[:300, x])[0].min() for x in range(400, 640, 4)]
        return float(np.min(ys))
    src.append((fcx, crown(bgs[0]))); dst.append((fcx, (crown(bgs[ki]) - ke) * s + fe))
    # body pinned (the head turns on the neck): neck base and shoulders
    pins = [(x, y) for y in (760, 820, 900, 1000) for x in range(200, 860, 80)] + [(0, 0), (1023, 0), (0, 1023), (1023, 1023)]
    src = np.array(src + pins, float); dst = np.array(dst + pins, float)
    disp = dst - src
    rbf = RBFInterpolator(src, disp, kernel="thin_plate_spline", smoothing=2.0)
    g = np.arange(33) * 32.0
    gx, gy = np.meshgrid(g, g)
    D = rbf(np.stack([gx.ravel(), gy.ravel()], 1)).reshape(33, 33, 2)
    # the neck between the jaw and the collar follows the head partially (it is the axis): blend 0 at y>=760 to 1 at
    # y<=690 is already the TPS between chin and pins; clamp anything below the collar to zero
    D[gy >= 760] = 0
    # fold check: Jacobian determinant of (identity + D) on the grid
    dxdx = np.gradient(D[..., 0], 32.0, axis=1) + 1; dydy = np.gradient(D[..., 1], 32.0, axis=0) + 1
    dxdy = np.gradient(D[..., 0], 32.0, axis=0); dydx = np.gradient(D[..., 1], 32.0, axis=1)
    J = dxdx * dydy - dxdy * dydx
    head = (gy < 720) & (gx > 220) & (gx < 820)
    res = np.linalg.norm(rbf(src[:len(LM)]) - disp[:len(LM)], axis=1)
    report[name] = {"scale": round(s, 4), "kcx": round(kcx, 1), "fcx": round(fcx, 1), "nose_dx": round(float(disp[list(LM).index("nose"), 0]), 1),
                    "J_min_head": round(float(J[head].min()), 3), "J_max_head": round(float(J[head].max()), 3), "lm_resid_px_max": round(float(res.max()), 2),
                    "far_eye_width_ratio": None}
    # far-eye compression at the key (normalised): eye width ratio
    wl = (np.array(norm(LM["eyeL_in"][ki])) - np.array(norm(LM["eyeL_out"][ki])))[0] / (LM["eyeL_in"][0][0] - LM["eyeL_out"][0][0])
    wr = (np.array(norm(LM["eyeR_out"][ki])) - np.array(norm(LM["eyeR_in"][ki])))[0] / (LM["eyeR_out"][0][0] - LM["eyeR_in"][0][0])
    report[name]["eye_width_ratio_L_R"] = [round(float(wl), 3), round(float(wr), 3)]
    out[name] = np.round(D, 2).tolist()
    # r4: the normalisation, so the runtime can sample the painted plate itself (two-texture keyform blend)
    out.setdefault("norm", {})[name] = {"s": round(float(s), 5), "kcx": round(kcx, 2), "fcx": round(fcx, 2), "ke": round(float(ke), 2), "fe": round(float(fe), 2)}
print(json.dumps(report, indent=1))
g = json.load(open(f"{L}/geom.json"))
g["yawKeys"] = out
json.dump(g, open(f"{L}/geom.json", "w"), indent=1)
json.dump(report, open(f"{K}/keyfield-report.json", "w"), indent=1)
