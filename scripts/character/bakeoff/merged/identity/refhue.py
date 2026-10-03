"""The reference portraits' skin hue, for the G9 solve (g9.mjs g9Target): CIE L*a*b* (D65) of the linear-light mean of
five 13 x 13 px patches per view (MediaPipe landmarks 50 / 280 cheeks, 151 forehead, 205 / 425 lower cheeks), per-patch
channel medians, over the near-frontal views. Writes look.skin.refHue (degrees) and the per-view numbers to
art/character/bakeoff/merged/reports/refhue.json. Only the HUE is used: L* and C* stay the MST band's (the G9 bar);
the generator drifted light (L* 70-73 against MST 6's 55), so its lightness is not a target.
    python3 refhue.py --look art/character/bakeoff/merged/looks/teal.json"""
import argparse, json, os
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("--look", required=True)
ap.add_argument("--views", default="front,q3_left,q3_right,q45_left,q45_right")
a = ap.parse_args()
L = json.load(open(a.look))
d = L["references"]["set"]
LM = json.load(open(L["references"]["landmarks"]))


def s2l(c):
    c = c / 255
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def lab(rgb):
    r, g, b = rgb
    X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047; Y = 0.2126 * r + 0.7152 * g + 0.0722 * b; Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
    f = lambda t: np.cbrt(t) if t > 0.008856 else 7.787 * t + 16 / 116
    Lv, A, B = 116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))
    return {"L": round(float(Lv), 1), "a": round(float(A), 1), "b": round(float(B), 1), "C": round(float(np.hypot(A, B)), 1),
            "h": round(float(np.degrees(np.arctan2(B, A))), 1)}


rows = {}
for v in a.views.split(","):
    if not LM.get(v):
        continue
    im = np.asarray(Image.open(os.path.join(d, f"{v}.png")).convert("RGB")).astype(float)
    lm = np.array(LM[v]["lm"])
    acc = []
    for i in (50, 280, 151, 205, 425):
        x, y = lm[i, :2].astype(int)
        acc.append(s2l(np.median(im[y - 6:y + 7, x - 6:x + 7].reshape(-1, 3), 0)))
    rows[v] = lab(np.mean(acc, 0))
hue = round(float(np.median([r["h"] for r in rows.values()])), 1)
L["skin"]["refHue"] = hue
L["skin"]["_refHueNote"] = "hue angle (deg) of the reference portraits' skin (identity/refhue.py); G9 solves L*/C* to the MST band and the hue to this"
json.dump(L, open(a.look, "w"), indent=2)
os.makedirs("art/character/bakeoff/merged/reports", exist_ok=True)
json.dump({"method": __doc__.split("\n")[0], "views": rows, "refHue": hue}, open("art/character/bakeoff/merged/reports/refhue.json", "w"), indent=1)
print(json.dumps(rows), "refHue", hue)
