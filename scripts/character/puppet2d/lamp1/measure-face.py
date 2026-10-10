"""Measurements for the round-4 face options.
1. Monk skin check, the method of scripts/character/g9.mjs moved to 2D: per patch the per-channel median, patches averaged
   in linear light, CIE L*a*b* (D65). Bar from g9: |L* - L*_MST| <= 3 and |C* - C*_MST| <= 4, against MST 6 (Asha's band,
   TEACHER-VISUAL §4.3). Patches: forehead L/R (either side of the bindi) and cheek L/R, 25 x 25 px on the 1024 front,
   placed by hand (PATCHES) and drawn on an overlay so the placement can be checked.
2. Frame registration: how far each expression frame drifts from its front (ORB + RANSAC similarity on the whole frame,
   so the plain background, hair and saree carry it): scale, rotation, translation in px at 1024.
   python3 -I measure.py <out.json> <overlay.png>
"""
import sys, json, os
import numpy as np, cv2
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
MST_HEX = {1: "#f6ede4", 2: "#f3e7db", 3: "#f7ead0", 4: "#eadaba", 5: "#d7bd96", 6: "#a07e56", 7: "#825c43", 8: "#604134", 9: "#3a312a", 10: "#292420"}
s2l = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def hex2lin(h): return [s2l(int(h[i:i + 2], 16) / 255) for i in (1, 3, 5)]
def lin2lab(rgb):
    r, g, b = rgb
    X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047; Y = 0.2126 * r + 0.7152 * g + 0.0722 * b; Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
    f = lambda t: np.cbrt(t) if t > 0.008856 else 7.787 * t + 16 / 116
    L = 116 * f(Y) - 16; a = 500 * (f(X) - f(Y)); bb = 200 * (f(Y) - f(Z))
    return {"L": round(L, 1), "a": round(a, 1), "b": round(bb, 1), "C": round(float(np.hypot(a, bb)), 1)}
MST_LAB = {k: lin2lab(hex2lin(v)) for k, v in MST_HEX.items()}

# hand-placed patch centres (1024 px), checked on the overlay
PATCHES = {
    "today": {"file": "/home/user/Taxila/docs/design/teacher/stylised/concepts/c-front.webp", "forehead_L": (455, 292), "forehead_R": (595, 292), "cheek_L": (415, 540), "cheek_R": (635, 540)},
    "s3-graphic": {"forehead_L": (458, 222), "forehead_R": (560, 222), "cheek_L": (418, 405), "cheek_R": (600, 405)},
    "a3-film": {"forehead_L": (450, 248), "forehead_R": (562, 248), "cheek_L": (412, 440), "cheek_R": (612, 440)},
    "w1-flat": {"forehead_L": (462, 205), "forehead_R": (562, 205), "cheek_L": (422, 385), "cheek_R": (600, 385)},
    "line-rest": {"forehead_L": (470, 222), "forehead_R": (554, 222), "cheek_L": (410, 410), "cheek_R": (612, 410)},
}
FAMILY = {"s3-graphic": "stylised", "a3-film": "anime", "w1-flat": "world", "line-rest": "line", "today": "today (c-front)"}
R = 12

def load(i, spec=None):
    p = (spec or {}).get("file") or (f"{HERE}/raw/{i}.png")
    return np.asarray(Image.open(p).convert("RGB").resize((1024, 1024), Image.LANCZOS))

def skin(i):
    spec = PATCHES[i]; a = load(i, spec)
    per, lins = {}, {}
    for k, v in spec.items():
        if k == "file": continue
        x, y = v
        px = a[y - R:y + R + 1, x - R:x + R + 1].reshape(-1, 3)
        lin = [s2l(float(np.median(px[:, c])) / 255) for c in range(3)]
        lins[k] = lin; per[k] = {"at": [x, y], **lin2lab(lin)}
    meanlin = list(np.mean(np.array(list(lins.values())), axis=0))
    lab = lin2lab(meanlin)
    t = MST_LAB[6]
    near = min(MST_LAB, key=lambda k: (MST_LAB[k]["L"] - lab["L"]) ** 2 + (MST_LAB[k]["a"] - lab["a"]) ** 2 + (MST_LAB[k]["b"] - lab["b"]) ** 2)
    dE = {k: round(float(np.sqrt((MST_LAB[k]["L"] - lab["L"]) ** 2 + (MST_LAB[k]["a"] - lab["a"]) ** 2 + (MST_LAB[k]["b"] - lab["b"]) ** 2)), 1) for k in (5, 6, 7, 8)}
    fore = lin2lab(list(np.mean([lins["forehead_L"], lins["forehead_R"]], axis=0)))
    cheek = lin2lab(list(np.mean([lins["cheek_L"], lins["cheek_R"]], axis=0)))
    return {"family": FAMILY[i], "patches": per, "forehead": fore, "cheek": cheek, "mean": lab, "target_MST6": t,
            "dL": round(lab["L"] - t["L"], 1), "dC": round(lab["C"] - t["C"], 1),
            "pass_g9_bar": abs(lab["L"] - t["L"]) <= 3 and abs(lab["C"] - t["C"]) <= 4, "nearest_MST": near, "dE76_to_MST": dE}

def register(front, frame):
    a = cv2.cvtColor(load(front), cv2.COLOR_RGB2GRAY); b = cv2.cvtColor(load(frame), cv2.COLOR_RGB2GRAY)
    orb = cv2.ORB_create(5000)
    k1, d1 = orb.detectAndCompute(a, None); k2, d2 = orb.detectAndCompute(b, None)
    m = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(d1, d2)
    m = sorted(m, key=lambda x: x.distance)[:800]
    p1 = np.float32([k1[x.queryIdx].pt for x in m]); p2 = np.float32([k2[x.trainIdx].pt for x in m])
    M, inl = cv2.estimateAffinePartial2D(p1, p2, method=cv2.RANSAC, ransacReprojThreshold=3)
    if M is None: return {"error": "no fit"}
    sc = float(np.hypot(M[0, 0], M[1, 0])); rot = float(np.degrees(np.arctan2(M[1, 0], M[0, 0])))
    # displacement of the face centre (512, 400) under the fitted transform
    c = np.array([512, 400, 1.0]); d = M @ c - c[:2]
    return {"scale": round(sc, 4), "rot_deg": round(rot, 2), "tx": round(float(M[0, 2]), 1), "ty": round(float(M[1, 2]), 1),
            "face_centre_shift_px": round(float(np.hypot(*d)), 1), "inliers": int(inl.sum()), "matches": len(m)}

if __name__ == "__main__":
    out, ov = sys.argv[1:3]
    res = {"date": "2026-10-10", "method": __doc__.strip(), "MST_LAB": MST_LAB, "skin": {}, "registration": {}}
    tiles = []
    for i in PATCHES:
        res["skin"][i] = skin(i)
        im = Image.fromarray(load(i, PATCHES[i])); d = ImageDraw.Draw(im)
        for k, v in PATCHES[i].items():
            if k == "file": continue
            d.rectangle((v[0] - R, v[1] - R, v[0] + R, v[1] + R), outline=(0, 255, 120), width=3)
        tiles.append(im.resize((400, 400)))
    S = Image.new("RGB", (400 * len(tiles), 400)); [S.paste(t, (400 * k, 0)) for k, t in enumerate(tiles)]; S.save(ov)
    frames = {"s3-graphic": ["speak2", "listen", "think2", "warm", "blink"], "a3-film": ["speak2", "listen", "think2", "warm", "blink"], "w1-flat": ["speak2", "listen", "think2", "warm", "blink"]}
    for f, ex in frames.items():
        res["registration"][f] = {e: register(f, f"{f}--{e}") for e in ex}
    json.dump(res, open(out, "w"), indent=1, default=float)
    for i, s in res["skin"].items():
        print(f"{i:12s} L*{s['mean']['L']:5.1f} a*{s['mean']['a']:5.1f} b*{s['mean']['b']:5.1f} C*{s['mean']['C']:5.1f} | dL {s['dL']:+5.1f} dC {s['dC']:+5.1f} pass={s['pass_g9_bar']} nearest MST {s['nearest_MST']} dE {s['dE76_to_MST']} | fore L*{s['forehead']['L']} cheek L*{s['cheek']['L']}")
    for f, r in res["registration"].items():
        print(f, {e: (v.get('scale'), v.get('rot_deg'), v.get('face_centre_shift_px'), v.get('inliers')) for e, v in r.items()})
