"""lamp3 (v3 a): ONE mouth model sheet. Every speech key keeps its own painted LIPS, but the inside of its opening is
replaced by a single shared interior (teeth, tongue, shadow) taken from one master key, so consecutive mouths can
differ only in the lip contour (J1-Jfinal: "the teeth / mouth interior change between consecutive frames").
  opening   per key: seeds = teeth (a* < 21, L* > 55) or dark interior (L* < 38) inside the mouth ellipse; a vertical
            closing bridges the tongue (lip-coloured, so colour alone cannot find it); holes filled; the largest
            component; eroded 1 px so the lips' painted inner edge stays the key's own.
  interior  the master key's opening content, edge-extended outward (nearest interior pixel) so it covers any key's
            opening; per key it is shifted vertically so the master's upper-lip line meets that key's (teeth hang from
            the upper lip), and blended in with a 1.5 px feather.
  openness  each key's real drawn opening (mean opening height over the central 40 px, rig px) -> geom.json, for the
            lip-sync estimator (the drawn mouth, not a table).
    python3 -I interior.py <master-key> [--show]     (rewrites rs/k-<key>.png for the speech keys; originals kept in rs-v2/)"""
import sys, os, json, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi

SPEECH = ["aa", "eh", "oh", "ee", "ltd", "fv", "oo"]
CX = 527
yy, xx = np.mgrid[0:1024, 0:1024]
MOUTH = (((xx - 527) / 105.0) ** 2 + ((yy - 614) / 42.0) ** 2) <= 1

def lab(a):
    l = cv2.cvtColor(a.astype(np.uint8), cv2.COLOR_RGB2LAB).astype(np.float32)
    return l[..., 0] * 100 / 255, l[..., 1] - 128, l[..., 2] - 128

def opening(a):
    L, A, B = lab(a)
    seeds = (((A < 21) & (L > 55)) | (L < 38)) & MOUTH
    seeds = ndi.binary_opening(seeds, iterations=1)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 21))
    m = cv2.morphologyEx(seeds.astype(np.uint8), cv2.MORPH_CLOSE, k).astype(bool)
    m = ndi.binary_fill_holes(m) & MOUTH
    lab_, n = ndi.label(m)
    if n == 0: return np.zeros_like(m)
    sizes = ndi.sum(m, lab_, range(1, n + 1))
    m = lab_ == (1 + int(np.argmax(sizes)))
    return ndi.binary_erosion(m, iterations=1)

def top_line(m):
    cols = [np.where(m[:, x])[0] for x in range(CX - 20, CX + 21)]
    tops = [c.min() for c in cols if len(c)]
    return float(np.median(tops)) if tops else None

def height(m):
    cols = [m[:, x].sum() for x in range(CX - 20, CX + 21)]
    return float(np.mean(cols))

if __name__ == "__main__":
    master = sys.argv[1]
    os.makedirs(f"{S}/rs-v2", exist_ok=True)
    src = lambda k: f"{S}/rs-v2/k-{k}.png" if os.path.exists(f"{S}/rs-v2/k-{k}.png") else f"{S}/rs/k-{k}.png"
    for k in SPEECH + ["mbp"]:
        if not os.path.exists(f"{S}/rs-v2/k-{k}.png"): shutil.copy(f"{S}/rs/k-{k}.png", f"{S}/rs-v2/k-{k}.png")
    M = np.asarray(Image.open(src(master)).convert("RGB")).astype(np.float32)
    Om = opening(M)
    # edge-extend the master interior: every pixel takes its nearest opening pixel's colour
    _, (iy, ix) = ndi.distance_transform_edt(~Om, return_indices=True)
    I = M[iy, ix]
    t_m = top_line(Om)
    rep = {"date": "2026-10-10", "method": __doc__.strip(), "master": master, "keys": {}}
    show = []
    for k in SPEECH:
        a = np.asarray(Image.open(src(k)).convert("RGB")).astype(np.float32)
        O = opening(a)
        t = top_line(O)
        dy = 0 if t is None or t_m is None else int(round(t - t_m))
        Ik = np.roll(I, dy, axis=0)
        f = cv2.GaussianBlur(O.astype(np.float32), (0, 0), 0.9)[..., None]
        out = a * (1 - f) + Ik * f
        Image.fromarray(out.clip(0, 255).round().astype(np.uint8)).save(f"{S}/rs/k-{k}.png")
        rep["keys"][k] = {"opening_px": int(O.sum()), "opening_height_px": round(height(O), 2), "top_line_shift_px": dy}
        show.append(np.concatenate([a[560:690, 410:645], out[560:690, 410:645], np.dstack([O[560:690, 410:645] * 255] * 3).astype(np.float32)], 1))
    hm = max(v["opening_height_px"] for v in rep["keys"].values()) or 1
    rep["openness"] = {k: round(v["opening_height_px"] / hm, 3) for k, v in rep["keys"].items()}
    json.dump(rep, open(f"{EVID}/interior.json", "w"), indent=1)
    print(json.dumps({k: v for k, v in rep.items() if k != "method"}, indent=0))
    if "--show" in sys.argv:
        Image.fromarray(np.concatenate(show, 0).clip(0, 255).astype(np.uint8)).resize((705 * 2 // 2, 130 * len(show))).save(f"{S}/v.png")
