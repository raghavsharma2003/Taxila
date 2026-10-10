"""Skin: measure the rig front against Monk 6, grade the skin half-way toward it, and re-measure inside the jharokha's
lamplight grade (the multiply vignette + screen rim of world/source/src/style.css .jh-grade/.jh-rim, as slots.py).
Method as docs/design/round4/face/source/measure.py (g9 moved to 2D): 4 hand-placed 25 x 25 patches (forehead L/R either
side of the bindi, cheeks L/R) in rig space, per-channel median, mean in linear light, CIE L*a*b* D65.
Grade as face/source/skingrade.py: a hue-wedge skin mask (head and neck only, the rust cardigan excluded), chroma x kC and
L* + dL with kC, dL solved so the patch mean lands half-way (in L* and C*) between the measured value and MST 6.
    python3 -I skin.py <out.json>     (writes rs/<frame>-g.png for every rig-space frame)"""
import sys, json, glob, os
import numpy as np, cv2
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
S = "/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/r4-asha"
MST6 = "#a07e56"
s2l = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def hex2lin(h): return [s2l(int(h[i:i + 2], 16) / 255) for i in (1, 3, 5)]
def lin2lab(rgb):
    r, g, b = rgb
    X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047; Y = 0.2126 * r + 0.7152 * g + 0.0722 * b; Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
    f = lambda t: np.cbrt(t) if t > 0.008856 else 7.787 * t + 16 / 116
    L = 116 * f(Y) - 16; a = 500 * (f(X) - f(Y)); bb = 200 * (f(Y) - f(Z))
    return {"L": round(float(L), 1), "a": round(float(a), 1), "b": round(float(bb), 1), "C": round(float(np.hypot(a, bb)), 1)}
T = lin2lab(hex2lin(MST6))
PATCH = {"forehead_L": (470, 262), "forehead_R": (580, 262), "cheek_L": (400, 522), "cheek_R": (650, 522)}
R = 12

def measure(a):
    lins = []
    per = {}
    for k, (x, y) in PATCH.items():
        px = a[y - R:y + R + 1, x - R:x + R + 1].reshape(-1, 3)
        lin = [s2l(float(np.median(px[:, c])) / 255) for c in range(3)]
        lins.append(lin); per[k] = lin2lab(lin)
    m = lin2lab(list(np.mean(np.array(lins), axis=0)))
    return {"patches": per, "mean": m, "dL": round(m["L"] - T["L"], 1), "dC": round(m["C"] - T["C"], 1), "g9_bar": abs(m["L"] - T["L"]) <= 3 and abs(m["C"] - T["C"]) <= 4}

def skin_mask(a):
    lab = cv2.cvtColor(a, cv2.COLOR_RGB2LAB).astype(np.float32)
    L = lab[..., 0] * 100 / 255; A = lab[..., 1] - 128; B = lab[..., 2] - 128
    hue = np.degrees(np.arctan2(B, A)); C = np.hypot(A, B)
    m = ((hue > 35) & (hue < 80) & (C > 18) & (L > 20) & (L < 85)).astype(np.float32)
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    m *= ((yy < 805) | (np.abs(xx - 525) < 150)).astype(np.float32)   # head + neck; the cardigan stays
    return cv2.GaussianBlur(m, (0, 0), 1.5), L, A, B

def grade(a, kC, dL):
    m, L, A, B = skin_mask(a)
    A2 = A * (1 - m * (1 - kC)); B2 = B * (1 - m * (1 - kC)); L2 = L + m * dL
    o = np.stack([L2 * 255 / 100, A2 + 128, B2 + 128], -1).clip(0, 255).astype(np.uint8)
    return cv2.cvtColor(o, cv2.COLOR_LAB2RGB)

def jh_grade(a):
    """the jharokha's multiply vignette + screen rim, applied over the full rig-space frame at the lesson head crop
    (approximately the window: the vignette's centre at 52 % / 34 % of the crop, as .jh-grade)"""
    f = a.astype(np.float32) / 255
    h, w = f.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    dx = (xx / w - .52) / .90; dy = (yy / h - .34) / .70
    r = np.sqrt(dx * dx + dy * dy)
    t = np.clip((r - .52) / (1 - .52), 0, 1)[..., None]
    f = f * (1 - t * .55 * (1 - np.array([196, 120, 72]) / 255))
    t2 = np.clip((yy / h - .55) / .45, 0, 1)[..., None]
    f = f * (1 - t2 * .35 * (1 - np.array([120, 60, 70]) / 255))
    rim = np.clip(1 - (xx / w) / .30, 0, 1)[..., None] * .32 * np.array([255, 170, 90]) / 255
    f = 1 - (1 - f) * (1 - rim)
    return (np.clip(f, 0, 1) * 255).astype(np.uint8)

a = np.asarray(Image.open(f"{S}/rs/front.png").convert("RGB"))
m0 = measure(a)
tgtL = (m0["mean"]["L"] + T["L"]) / 2; tgtC = (m0["mean"]["C"] + T["C"]) / 2
kC, dL = tgtC / m0["mean"]["C"], tgtL - m0["mean"]["L"]
for _ in range(6):   # the grade is not exactly linear in the patch mean (median, linear mean): refine
    m1 = measure(grade(a, kC, dL))
    kC *= tgtC / m1["mean"]["C"]; dL += tgtL - m1["mean"]["L"]
g = grade(a, kC, dL)
m1 = measure(g)
# inside the window: the head crop the lesson portrait shows (rig space x 175-875, y 20-930), graded, patches re-mapped
X0, Y0, X1, Y1 = 175, 20, 875, 930
def in_window(img):
    c = jh_grade(img[Y0:Y1, X0:X1])
    full = img.copy(); full[Y0:Y1, X0:X1] = c
    return measure(full)
res = {"date": "2026-10-10", "method": __doc__.strip(), "target_MST6": T, "patches_rigspace": PATCH,
       "flat_before": m0, "flat_after": m1, "grade": {"kC": round(kC, 4), "dL": round(dL, 2)},
       "in_window_before": in_window(a), "in_window_after": in_window(g)}
json.dump(res, open(sys.argv[1], "w"), indent=1)
for f in sorted(glob.glob(f"{S}/rs/*.png")):
    if f.endswith("-g.png"): continue
    im = np.asarray(Image.open(f).convert("RGB"))
    Image.fromarray(grade(im, kC, dL)).save(f[:-4] + "-g.png")
side = np.concatenate([a[150:760, 300:760], g[150:760, 300:760], jh_grade(a[20:930, 175:875])[130:740, 125:585], jh_grade(g[20:930, 175:875])[130:740, 125:585]], 1)
Image.fromarray(side).save(f"{S}/skin-compare.png")
for k in ("flat_before", "flat_after", "in_window_before", "in_window_after"):
    v = res[k]; print(k, v["mean"], "dL", v["dL"], "dC", v["dC"])
print("grade", res["grade"])
