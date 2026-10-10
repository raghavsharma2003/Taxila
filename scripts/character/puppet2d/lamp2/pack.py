"""lamp2 pack: two rigid layers + painted key patches, in the NATIVE pixel space of the approved 1024 front (rig-b).
  body   the figure with everything above the neck cut removed (the neck kept under the chin, so a head lift shows neck);
  head   hair, face, ears, earrings, bun and locks, down to a soft cut across the neck (it moves rigidly over the body);
  keys   one RGBA patch per painted key (mouth / eyes / brows): rgb = the key, alpha = its region mask feathered
         inward; drawn over the head layer it reproduces keys.py's composite exactly, and the rest of the face is the
         front's own pixels (the patch alpha is 0 there).
Matte: alpha from the colour distance to the cream ground (lamp1 restssim.py formula), colour decontaminated, so the
canvas clear colour replaces the paper. Skin grade: the Stage B half-way-to-MST-6 grade (kC 0.7262, dL -3.35, lamp1
skin.py), applied to the front AND to every key the same way. Key detail comes from rig space (keys.py), carried to
native space as a difference (key - front) so a patch equals the base wherever the key equals the front.
    python3 -I pack.py        (writes art/character/puppet2d/lamp2/*.webp, geom.json, pack-report.json)"""
import sys, os, json, io
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi
from keys import KEY_REGION

CREAM = np.array([246.0, 209.0, 152.0])

def grade(a, kC, dL, sig=1.0):
    """lamp1 skin.py grade, constants moved from rig space to native (y < 805 rig = 550 native; |x - 525| < 150 rig)"""
    lab = cv2.cvtColor(a.clip(0, 255).astype(np.uint8), cv2.COLOR_RGB2LAB).astype(np.float32)
    L = lab[..., 0] * 100 / 255; A = lab[..., 1] - 128; B = lab[..., 2] - 128
    hue = np.degrees(np.arctan2(B, A)); C = np.hypot(A, B)
    m = ((hue > 35) & (hue < 80) & (C > 18) & (L > 20) & (L < 85)).astype(np.float32)
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    m *= ((yy < 550) | (np.abs(xx - (X0 + 525 / K)) < 150 / K)).astype(np.float32)
    m = cv2.GaussianBlur(m, (0, 0), sig)
    A2 = A * (1 - m * (1 - kC)); B2 = B * (1 - m * (1 - kC)); L2 = L + m * dL
    o = np.stack([L2 * 255 / 100, A2 + 128, B2 + 128], -1).clip(0, 255).astype(np.uint8)
    return cv2.cvtColor(o, cv2.COLOR_LAB2RGB).astype(np.float32)

def webp(img, path, q):
    b = io.BytesIO(); img.save(b, "WEBP", quality=q, method=6); open(path, "wb").write(b.getvalue()); return len(b.getvalue())

def rgba(rgb, a):
    return Image.fromarray(np.dstack([rgb.clip(0, 255), (a * 255).clip(0, 255)]).round().astype(np.uint8), "RGBA")

def bbox(a, pad=2):
    ys, xs = np.where(a > 0.002)
    return [int(max(0, xs.min() - pad)), int(max(0, ys.min() - pad)), int(min(a.shape[1], xs.max() + 1 + pad)), int(min(a.shape[0], ys.max() + 1 + pad))]

def rs_to_native(img_rs):
    """a rig-space 1024 image -> native placement (zeros outside the rig crop)"""
    out = np.zeros((1024, 1024) + img_rs.shape[2:], np.float32)
    out[Y0:Y0 + SZ, X0:X0 + SZ] = cv2.resize(img_rs.astype(np.float32), (SZ, SZ), interpolation=cv2.INTER_AREA)
    return out

if __name__ == "__main__":
    os.makedirs(PACK, exist_ok=True)
    N = np.asarray(Image.open(FRONT_SRC).convert("RGB")).astype(np.float32)
    kC, dL = GRADE
    # ---- matte against the cream ground, decontaminated
    dist = np.sqrt(((N - CREAM) ** 2).sum(2))
    al = np.clip((dist - 8) / 40.0, 0, 1)
    bgc = np.median(N[ndi.binary_erosion(al == 0, iterations=3)].reshape(-1, 3), 0)   # the paper, flattened
    dec = np.where(al[..., None] > 0.02, (N - (1 - al[..., None]) * bgc) / np.maximum(al[..., None], 0.02), N)
    G = grade(dec, kC, dL)
    yy, xx = np.mgrid[0:1024, 0:1024].astype(np.float32)
    # ---- the neck cut (hand-read on grid-neck.png: chin at y 492, neck x 420-620 at y 500-540, collar from y 540)
    NECK_X0, NECK_X1 = 405, 635
    inneck = (xx >= NECK_X0) & (xx <= NECK_X1)
    lab = cv2.cvtColor(N.astype(np.uint8), cv2.COLOR_RGB2LAB).astype(np.float32)
    hue = np.degrees(np.arctan2(lab[..., 2] - 128, lab[..., 1] - 128)); C = np.hypot(lab[..., 1] - 128, lab[..., 2] - 128)
    skin = (hue > 30) & (hue < 85) & (C > 15) & (lab[..., 0] > 40)
    skin = ndi.binary_opening(skin, iterations=2)
    # the soft cut is for neck SKIN only: hair (the bun's lower edge) keeps its painted edge down to y 538
    ramp = np.clip((528 - yy) / 22, 0, 1)
    skin_soft = cv2.GaussianBlur(skin.astype(np.float32), (0, 0), 1.2)
    head_keep = np.where(inneck, ramp * skin_soft + (yy < 538) * (1 - skin_soft), (yy < 538).astype(np.float32))
    head_keep = head_keep * head_keep * (3 - 2 * head_keep)
    head_a = al * head_keep
    # body: the figure below the cut + the neck column (skin only) from y 498 down; rows 470-498 copy row 498 so a head
    # lift of a few px uncovers neck, never cream
    neckcol = inneck & (yy >= 498) & (yy < 560) & skin
    neckcol = ndi.binary_erosion(neckcol, iterations=1)
    # under the cut's soft band only neck SKIN goes to the body (the bun's lower edge there would ghost when the head moves)
    body_a = al * (head_keep <= 0.001)
    body_a = np.maximum(body_a, neckcol.astype(np.float32) * al)
    Gb = G.copy()
    row = 498
    for x in range(NECK_X0, NECK_X1 + 1):
        if neckcol[row + 2, x]:
            Gb[470:498, x] = G[row + 2, x]
    fill = np.zeros((1024, 1024), bool)
    for x in range(NECK_X0, NECK_X1 + 1):
        if neckcol[row + 2, x]: fill[470:498, x] = True
    fill = ndi.binary_erosion(fill, iterations=1)
    body_a = np.maximum(body_a, fill.astype(np.float32))
    # ---- crop boxes
    report = {"date": "2026-10-10", "method": __doc__.strip(), "space": "native px of the 1024 rig-b front", "files": {}}
    geom = {"rev": "lamp2", "size": [1024, 1024], "clear": [round(float(c) / 255, 4) for c in bgc],
            "rects": {}, "keys": {}, "regions": {}}
    BODY_BOX = [100, 0, 940, 700]
    b = bbox(body_a[BODY_BOX[1]:BODY_BOX[3], BODY_BOX[0]:BODY_BOX[2]])
    bx = [BODY_BOX[0] + b[0], BODY_BOX[1] + b[1], BODY_BOX[0] + b[2], BODY_BOX[1] + b[3]]
    report["files"]["body"] = webp(rgba(Gb[bx[1]:bx[3], bx[0]:bx[2]], body_a[bx[1]:bx[3], bx[0]:bx[2]]), f"{PACK}/body.webp", 88)
    geom["rects"]["body"] = bx
    h = bbox(head_a)
    report["files"]["head"] = webp(rgba(G[h[1]:h[3], h[0]:h[2]], head_a[h[1]:h[3], h[0]:h[2]]), f"{PACK}/head.webp", 92)
    geom["rects"]["head"] = h
    # ---- keys
    front_rs = np.asarray(Image.open(f"{S}/rs/front.png").convert("RGB")).astype(np.float32)
    for k, rname in KEY_REGION.items():
        p = f"{S}/rs/k-{k}.png"
        if not os.path.exists(p): print("missing key", k); continue
        comp = np.asarray(Image.open(p).convert("RGB")).astype(np.float32)
        m = np.asarray(Image.open(f"{S}/rs/m-{rname}.png")).astype(np.float32) / 255
        D = rs_to_native(comp - front_rs); mn = rs_to_native(m)
        # the patch: the graded key over the decontaminated front (the region is inside the face: alpha 1 there)
        Kn = grade(dec + D, kC, dL)
        r = bbox(mn, 1)
        report["files"][k] = webp(rgba(Kn[r[1]:r[3], r[0]:r[2]], mn[r[1]:r[3], r[0]:r[2]]), f"{PACK}/{k}.webp", 94)
        geom["keys"][k] = {"region": rname, "rect": r}
        geom["regions"].setdefault(rname, r)
    # framings (rig-space views of lamp1 / r8, moved to native px): [x0, y0, w, h]
    vr = {"close": [160, 40, 730, 730], "medium": [110, 25, 830, 875]}
    geom["views"] = {n: [round(X0 + v[0] / K, 2), round(Y0 + v[1] / K, 2), round(v[2] / K, 2), round(v[3] / K, 2)] for n, v in vr.items()}
    # rigid motion: the head turns about the neck base; breathing scales the body about its hem
    geom["pivot"] = [520, 532]
    geom["hem"] = 700
    gj = json.dumps(geom, separators=(",", ":"))
    open(f"{PACK}/geom.json", "w").write(gj)
    report["files"]["geom.json"] = len(gj)
    report["packBytes"] = sum(report["files"].values())
    # poster: the rest frame (body, head) over the clear colour, full native frame
    clear = np.array(geom["clear"]) * 255
    rest = clear * (1 - body_a[..., None]) + Gb * body_a[..., None]
    rest = rest * (1 - head_a[..., None]) + G * head_a[..., None]
    Image.fromarray(rest.clip(0, 255).round().astype(np.uint8)).save(f"{S}/rest-native.png")
    G_ref = clear * (1 - al[..., None]) + G * al[..., None]
    Image.fromarray(G_ref.clip(0, 255).round().astype(np.uint8)).save(f"{S}/front-graded-native.png")
    report["poster"] = webp(Image.fromarray(rest.clip(0, 255).round().astype(np.uint8)).crop((int(geom["views"]["medium"][0]), 0, int(geom["views"]["medium"][0] + geom["views"]["medium"][2]), 640)), f"{PACK}/rest.webp", 82)
    json.dump(report, open(f"{PACK}/pack-report.json", "w"), indent=1)
    print(json.dumps({k: v for k, v in report.items() if k != "method"}, indent=0))
