"""lamp1 yaw keyform field, ported from polish-r8/keyfield.py: landmarks on the front and on the two painted ~30 degree
turn keys (rs/yawL.png, rs/yawR.png: the x-yawL / x-yawR edits in rig space), read by eye at 2x on a 10 px grid
(gridcrop.py, 2026-10-10), plus the cranium silhouette read automatically from the backdrop. Each key is normalised into
the front's frame, a regularised thin-plate spline turns the landmark displacements into a dense field sampled on a
33 x 33 grid -> geom.json "yawKeys" (reached at the rig's 20 degree limit, as r8).
Two changes from r8, both measured on these keys: (1) the scale comes from the eye-to-chin distance, not eye-to-mouth
(the yawL edit drew the mouth 25 px higher relative to the eyes: eye-mouth 160 vs the front's 186, eye-chin 300 vs 304,
so an eye-mouth normalisation would have stretched the whole key 15 %); (2) vertical displacements are damped to 0.3 (a
yaw is horizontal motion in 2D; the edits' small pitch differences would read as a nod).
    python3 -I keyfield.py"""
import json
import numpy as np
from PIL import Image
from scipy.interpolate import RBFInterpolator

S = "/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/r4-asha"
L = f"{S}/layers"
# name: front, yawL (face toward the viewer's left = rig yaw < 0), yawR; None = hidden in that key
LM = {
    "eyeL_out": [(386, 420), (291, 394), (527, 401)], "eyeL_in": [(465, 420), (353, 403), (618, 404)],
    "irisL": [(425.5, 418), (316, 391), (583, 391)],
    "eyeR_in": [(583, 421), (440, 403), (700, 404)], "eyeR_out": [(668, 420), (543, 399), (768, 398)],
    "irisR": [(626, 417), (475, 390), (735, 392)],
    "browL_out": [(349, 381), (285, 336), (497, 357)], "browL_in": [(484, 368), (355, 334), (650, 338)],
    "browR_in": [(565, 368), (412, 339), (705, 335)], "browR_out": [(701, 376), (565, 352), (775, 340)],
    "bindi": [(525, 343), (382, 324), (683, 330)],
    "nose": [(525, 527), (370, 490), (712, 490)], "nostrilL": [(502, 541), (352, 507), (665, 510)], "nostrilR": [(550, 541), (400, 512), (722, 508)],
    "mouthL": [(445, 601), (342, 550), (608, 572)], "mouthR": [(607, 601), (465, 554), (722, 568)],
    "lip": [(525, 605), (395, 552), (683, 568)], "lowlip": [(525, 636), (390, 598), (685, 594)],
    "earringL": [(306, 547), None, (387, 525)], "earringR": [(748, 546), (700, 512), None],
    "faceL": [(340, 600), (320, 600), (440, 600)], "faceR": [(715, 600), (650, 600), (802, 600)],
    "chin": [(527, 721), (400, 690), (690, 686)],
}
FILES = [f"{S}/rs/front.png", f"{S}/rs/yawL.png", f"{S}/rs/yawR.png"]
DY_DAMP = 0.3

def bgmask(p):
    im = np.asarray(Image.open(p).convert("RGB")).astype(float)
    lum = 0.299 * im[..., 0] + 0.587 * im[..., 1] + 0.114 * im[..., 2]
    ref = np.median(np.concatenate([im[:40, :40].reshape(-1, 3), im[:40, -40:].reshape(-1, 3)]), 0)
    return (np.abs(im - ref).max(-1) < 18) & (lum > 185)
def eye_chin(i):
    ey = (LM["irisL"][i][1] + LM["irisR"][i][1]) / 2
    return ey, LM["chin"][i][1]
def cranium_cx(bg, y0, y1):
    c = []
    for y in range(max(0, y0), min(1023, y1), 8):
        r = np.where(~bg[y, 120:900])[0]
        if len(r): c.append(120 + 0.5 * (r.min() + r.max()))
    return float(np.mean(c))
bgs = [bgmask(f) for f in FILES]
fe, fc = eye_chin(0)
fcx = cranium_cx(bgs[0], 80, 300)
out = {"keyDeg": 20.0, "grid": {"x0": 0, "y0": 0, "step": 32, "n": 33}}
report = {}
for ki, name in ((1, "L"), (2, "R")):
    ke, kc = eye_chin(ki)
    s = (fc - fe) / (kc - ke)
    kcx = cranium_cx(bgs[ki], int((80 - fe) / s + ke), int((300 - fe) / s + ke))
    norm = lambda p: ((p[0] - kcx) * s + fcx, (p[1] - ke) * s + fe)
    src, dst = [], []
    for k, v in LM.items():
        if v[ki] is None: continue
        src.append(v[0]); dst.append(norm(v[ki]))
    nlm = len(src)
    # silhouette rows from y 160 (above it the edits redrew the hair top narrower: a crown squeeze that folds the field)
    top_dx = None
    for y in range(160, 420, 30):
        yk = int(round((y - fe) / s + ke))
        rf = np.where(~bgs[0][y, 120:900])[0]; rk = np.where(~bgs[ki][yk, 120:900])[0]
        if len(rf) and len(rk):
            a0, b0 = (120 + rf.min(), y), (120 + rf.max(), y)
            a1, b1 = norm((120 + rk.min(), yk)), norm((120 + rk.max(), yk))
            src += [a0, b0]; dst += [a1, b1]
            if top_dx is None: top_dx = ((a1[0] - a0[0]) + (b1[0] - b0[0])) / 2
    # the crown moves rigidly with the top silhouette row (the skull's top translates in a yaw, it does not squeeze)
    def crown(bg): return float(np.min([np.where(~bg[:300, x])[0].min() for x in range(400, 640, 4) if (~bg[:300, x]).any()]))
    cy0 = crown(bgs[0])
    for cxo in (-120, 0, 120):
        src.append((fcx + cxo, cy0 + (25 if cxo else 0))); dst.append((fcx + cxo + top_dx, cy0 + (25 if cxo else 0)))
    # body pins: the shoulders at y 800+, the neck column (x 382-670) only from y 850 (the neck is the turn's axis; pins
    # 80 px under a chin that moves 160 px folded the far jaw)
    pins = [(x, y) for y in (800, 860, 940, 1010) for x in range(160, 900, 80) if not (y < 850 and 360 < x < 700)] + [(0, 0), (1023, 0), (0, 1023), (1023, 1023)]
    src = np.array(src + pins, float); dst = np.array(dst + pins, float)
    disp = dst - src
    disp[:, 1] *= DY_DAMP
    rbf = RBFInterpolator(src, disp, kernel="thin_plate_spline", smoothing=2.0)
    g = np.arange(33) * 32.0
    gx, gy = np.meshgrid(g, g)
    D = rbf(np.stack([gx.ravel(), gy.ravel()], 1)).reshape(33, 33, 2)
    D[gy >= 860] = 0
    dxdx = np.gradient(D[..., 0], 32.0, axis=1) + 1; dydy = np.gradient(D[..., 1], 32.0, axis=0) + 1
    dxdy = np.gradient(D[..., 0], 32.0, axis=0); dydx = np.gradient(D[..., 1], 32.0, axis=1)
    J = dxdx * dydy - dxdy * dydx
    head = (gy < 740) & (gx > 220) & (gx < 820)
    res = np.linalg.norm(rbf(src[:nlm]) - disp[:nlm], axis=1)
    wl = (norm(LM["eyeL_in"][ki])[0] - norm(LM["eyeL_out"][ki])[0]) / (LM["eyeL_in"][0][0] - LM["eyeL_out"][0][0])
    wr = (norm(LM["eyeR_out"][ki])[0] - norm(LM["eyeR_in"][ki])[0]) / (LM["eyeR_out"][0][0] - LM["eyeR_in"][0][0])
    report[name] = {"scale": round(s, 4), "kcx": round(kcx, 1), "fcx": round(fcx, 1), "nose_dx": round(float(disp[list(k for k in LM if LM[k][ki] is not None).index("nose"), 0]), 1),
                    "J_min_head": round(float(J[head].min()), 3), "J_max_head": round(float(J[head].max()), 3), "lm_resid_px_max": round(float(res.max()), 2),
                    "eye_width_ratio_L_R": [round(float(wl), 3), round(float(wr), 3)]}
    out[name] = np.round(D, 2).tolist()
    out.setdefault("norm", {})[name] = {"s": round(float(s), 5), "kcx": round(kcx, 2), "fcx": round(fcx, 2), "ke": round(float(ke), 2), "fe": round(float(fe), 2)}
print(json.dumps(report, indent=1))
gj = json.load(open(f"{L}/geom.json"))
gj["yawKeys"] = out
json.dump(gj, open(f"{L}/geom.json", "w"), indent=1)
json.dump(report, open(f"{S}/keyfield-report.json", "w"), indent=1)
