"""Overlay of a fit (fit/teal.json) on the reference portraits: the projected GNM skin outline (green), the model's
landmark points (blue) and MediaPipe's (red), per fitted view.    python fit_overlay.py <fit.json> <out.png>"""
import json, sys, numpy as np
sys.path.insert(0, __import__("os").path.dirname(__import__("os").path.abspath(__file__)))
import gnm_model as G
from PIL import Image, ImageDraw
from scipy.spatial.transform import Rotation as Rot
f = json.load(open(sys.argv[1])); m = G.GNM()
V = m.bind(np.array(f["identity"]), np.array(f["nuisanceExpression"]))
C = G.mp_correspondence()
REFD = G.paths(__import__("os").path.basename(sys.argv[1]).split(".")[0])["REFD"]
LM = json.load(open(REFD + "/landmarks.json"))
sk = m.group("skin_exterior")
tiles = []
for v, cam in f["cameras"].items():
    cam = np.array(cam); R = Rot.from_rotvec(cam[:3]).as_matrix()
    Y = V @ R.T; uv = np.stack([cam[3] * Y[:, 0] + cam[4], -cam[3] * Y[:, 1] + cam[5]], 1)
    im = Image.open(f"{REFD}/{v}.png").convert("RGB"); d = ImageDraw.Draw(im)
    front = sk & (Y[:, 2] > np.percentile(Y[sk, 2], 40))
    mk = Image.new("L", im.size, 0); dm = ImageDraw.Draw(mk)
    skt = m.tri[sk[m.tri].all(1)]
    for t in skt: dm.polygon([tuple(uv[i]) for i in t], fill=255)
    mk = np.asarray(mk) > 0
    edge = mk ^ np.roll(mk, 1, 0) | mk ^ np.roll(mk, 1, 1)
    arr = np.asarray(im).copy(); ys, xs = np.where(edge)
    for dy in (-1, 0, 1):
        arr[np.clip(ys + dy, 0, arr.shape[0] - 1), xs] = (0, 255, 0)
    im = Image.fromarray(arr); d = ImageDraw.Draw(im)
    for (x, y) in (np.array(LM[v]["lm"])[C["landmarks"], :2] if LM.get(v) else []): d.ellipse((x - 2, y - 2, x + 2, y + 2), outline=(255, 0, 0))
    X = V[C["vertices"]] + C["reference"] - m.T[C["vertices"]]; Yl = X @ R.T
    for (x, y) in np.stack([cam[3] * Yl[:, 0] + cam[4], -cam[3] * Yl[:, 1] + cam[5]], 1): d.ellipse((x - 1.5, y - 1.5, x + 1.5, y + 1.5), fill=(0, 0, 255))
    tiles.append(im.crop((150, 200, 900, 1200)).resize((375, 500)))
W = Image.new("RGB", (375 * len(tiles), 500))
for i, t in enumerate(tiles): W.paste(t, (375 * i, 0))
W.save(sys.argv[2])
