"""The reference portraits' sclera, relative to their skin, for the eye pass (viewer/shaders.js EYE_FRAG uSclera).
Per eye: the MediaPipe eye-opening polygon (mp_regions leye / reye edges), eroded 2 px; the iris is excluded as the
pixels darker than the polygon's 60th luminance percentile; the sclera colour is the linear-light median of the rest.
The SKIN is the same cheek / forehead patches as refhue.py. Written as the sclera / skin ratio per channel (linear), so
it is independent of the generator's exposure drift, plus the sclera's luminance contrast to the lower lid.
    python3 refsclera.py --look art/character/bakeoff/merged/looks/teal.json"""
import argparse, json, os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ap = argparse.ArgumentParser()
ap.add_argument("--look", required=True)
ap.add_argument("--views", default="front,q3_left,q3_right")
a = ap.parse_args()
L = json.load(open(a.look))
d = L["references"]["set"]
LM = json.load(open(L["references"]["landmarks"]))
RG = json.load(open(L["projection"]["regions"]))
s2l = lambda c: np.where(c / 255 <= 0.04045, c / 255 / 12.92, ((c / 255 + 0.055) / 1.055) ** 2.4)


def loop(edges):
    adj = {}
    for x, y in edges:
        adj.setdefault(x, []).append(y); adj.setdefault(y, []).append(x)
    st = edges[0][0]; out = [st]; prev = None; cur = st
    while True:
        nx = [n for n in adj[cur] if n != prev]
        if not nx or nx[0] == st:
            return out
        prev, cur = cur, nx[0]; out.append(cur)


rows = {}
for v in a.views.split(","):
    im = np.asarray(Image.open(os.path.join(d, f"{v}.png")).convert("RGB")).astype(float)
    lm = np.array(LM[v]["lm"])
    h, w = im.shape[:2]
    sk = np.mean([s2l(np.median(im[int(lm[i, 1]) - 6:int(lm[i, 1]) + 7, int(lm[i, 0]) - 6:int(lm[i, 0]) + 7].reshape(-1, 3), 0)) for i in (50, 280, 151, 205, 425)], 0)
    sc = []
    for e in ("leye", "reye"):
        m = Image.new("L", (w, h), 0)
        ImageDraw.Draw(m).polygon([tuple(lm[i, :2]) for i in loop([tuple(x) for x in RG[e + "_edges"]])], fill=255)
        m = ndimage.binary_erosion(np.asarray(m) > 0, iterations=2)
        px = s2l(im[m])
        Y = px @ np.array([0.2126, 0.7152, 0.0722])
        sc.append(np.median(px[Y > np.percentile(Y, 60)], 0))
    sc = np.mean(sc, 0)
    rows[v] = {"scleraLin": np.round(sc, 4).tolist(), "skinLin": np.round(sk, 4).tolist(), "ratio": np.round(sc / sk, 4).tolist()}
Yw = np.array([0.2126, 0.7152, 0.0722])
for r in rows.values():
    sc_, sk_ = np.array(r["scleraLin"]), np.array(r["skinLin"])
    r["lumaRatio"] = round(float(sc_ @ Yw / (sk_ @ Yw)), 3)
    r["tint"] = np.round(sc_ / (sc_ @ Yw), 3).tolist()
ratio = np.median([r["ratio"] for r in rows.values()], 0)
L.setdefault("eyes", {})["scleraLumaToSkin"] = float(np.median([r["lumaRatio"] for r in rows.values()]))
L["eyes"]["scleraTint"] = np.round(np.median([r["tint"] for r in rows.values()], 0), 3).tolist()
L["eyes"].pop("scleraToSkin", None)
L["eyes"]["_scleraNote"] = "reference sclera (brightest 40% of the eye opening) luminance / cheek luminance and its chroma (identity/refsclera.py); the eye pass is tuned so the RENDERED ratio matches (render-measured, merged.md)"
json.dump(L, open(a.look, "w"), indent=2)
json.dump({"views": rows, "scleraToSkin": ratio.tolist()}, open("art/character/bakeoff/merged/reports/refsclera.json", "w"), indent=1)
print(json.dumps(rows), L["eyes"])
