"""Profile landmarks from a SILHOUETTE (MediaPipe does not hold landmarks at 90 deg: it reports ~60 deg yaw on a true
profile and its points slide). Works the same on a generated profile portrait and on our render, so the two are
compared by one definition.

  foreground  = not background (distance to the border colour, plus darkness), largest component, holes filled;
  f(y)        = how far forward the silhouette reaches on row y (pixels toward the nose side), Gaussian-smoothed;
  tip         = max of f in the upper 62% of the frame; then, walking down: subnasale (min), upper lip (max), stomion
                (min), lower lip (max), labiomental fold (min), pogonion (max), throat (min of f below the chin), menton =
                first row below the pogonion where f falls to throat + 0.35 (pogonion - throat); walking up from the tip:
                nasion (min), glabella (max);
  scale       = midface height H = subnasale.y - nasion.y.
Ratios (all in units of H): lowerFace = (menton - subnasale) / H, chinHeight = (menton - stomion) / H, and the
forward projections of the tip, lips and pogonion relative to the subnasale. A per-height curve (f at 40 heights from
nasion to menton, minus f(subnasale), over H) is also written for a curve distance.
    python3 profile.py img.png --nose right|left [--out p.json] [--debug dbg.png]"""
import argparse, json
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage


def silhouette(img, bg_hex=None):
    a = np.asarray(img.convert("RGB")).astype(np.float32) / 255
    h, w = a.shape[:2]
    if bg_hex:              # our renders: a known, flat backdrop colour
        if bg_hex == "auto":   # the most common border colour (the flat backdrop after tone mapping)
            bd = np.round(np.concatenate([a[:4].reshape(-1, 3), a[:, -4:].reshape(-1, 3), a[:, :4].reshape(-1, 3)]) * 255).astype(int)
            u, c = np.unique(bd, axis=0, return_counts=True)
            bgc = u[np.argmax(c)] / 255.0
        else:
            bgc = np.array([int(bg_hex[i:i + 2], 16) for i in (1, 3, 5)], np.float32) / 255
        fg = np.linalg.norm(a - bgc, axis=-1) > 0.04
        fg = ndimage.binary_opening(fg, iterations=2)
        lab, n = ndimage.label(fg)
        if n > 1:
            fg = lab == (1 + int(np.argmax(ndimage.sum(fg, lab, range(1, n + 1)))))
        return ndimage.binary_fill_holes(fg)
    # the backdrop has a soft gradient (a generated studio sweep): fit a robust quadratic in (x, y) per channel to the
    # frame's border band (left, right, top), trimming outliers (hair or cloth touching the border), and threshold the
    # residual; a single border-median colour put half the shaded backdrop into the foreground (measured on a profile)
    yy, xx = np.mgrid[0:h, 0:w]
    bmask = np.zeros((h, w), bool)
    bmask[:8] = True; bmask[:, :8] = True; bmask[:, -8:] = True
    X = np.stack([np.ones(h * w), xx.ravel() / w, yy.ravel() / h, (xx.ravel() / w) ** 2, (yy.ravel() / h) ** 2, xx.ravel() * yy.ravel() / (w * h)], 1)
    sel = np.nonzero(bmask.ravel())[0]
    A = a.reshape(-1, 3)
    for _ in range(4):
        coef, *_ = np.linalg.lstsq(X[sel], A[sel], rcond=None)
        r = np.linalg.norm(A[sel] - X[sel] @ coef, axis=1)
        sel = sel[r < max(0.03, 2.5 * np.median(r))]
    bgf = (X @ coef).reshape(h, w, 3)
    d = np.linalg.norm(a - bgf, axis=-1)
    fg = d > 0.06
    # opening 4: removes the thin vertical backdrop seams the generator leaves (1-3 px lines that reached the chin rows)
    fg = ndimage.binary_opening(fg, iterations=4)
    lab, n = ndimage.label(fg)
    if n > 1:
        sz = ndimage.sum(fg, lab, range(1, n + 1))
        fg = lab == (1 + int(np.argmax(sz)))
    return ndimage.binary_fill_holes(fg)


def analyse(img, nose="right", sigma=2.0, top_frac=0.62, bg_hex=None):
    fg = silhouette(img, bg_hex)
    h, w = fg.shape
    f = np.full(h, np.nan)
    for y in range(h):
        xs = np.nonzero(fg[y])[0]
        if len(xs):
            f[y] = xs.max() if nose == "right" else (w - 1 - xs.min())
    ok = ~np.isnan(f)
    f[~ok] = np.interp(np.nonzero(~ok)[0], np.nonzero(ok)[0], f[ok]) if ok.any() else 0
    fs = ndimage.gaussian_filter1d(f, sigma)
    top = int(np.nonzero(ok)[0][0])
    lim = int(top + top_frac * (h - top))
    tip = top + int(np.argmax(fs[top:lim]))
    d1 = np.gradient(fs)

    def next_ext(y0, kind, step=1, prom=1.5, maxlen=None):
        """next local min/max of fs from y0 in direction step, with a minimum prominence (px) against the run so far."""
        best_y, best_v = y0, fs[y0]
        y = y0 + step
        end = (h - 1 if step > 0 else 0) if maxlen is None else y0 + step * maxlen
        while (y <= end if step > 0 else y >= end) and 0 <= y < h:
            v = fs[y]
            if (kind == "min" and v < best_v) or (kind == "max" and v > best_v):
                best_y, best_v = y, v
            elif abs(v - best_v) > prom:
                return best_y
            y += step
        return best_y
    P = {"tip": tip}
    P["subnasale"] = next_ext(tip, "min")
    P["upperLip"] = next_ext(P["subnasale"], "max")
    P["stomion"] = next_ext(P["upperLip"], "min", prom=0.8)
    P["lowerLip"] = next_ext(P["stomion"], "max", prom=0.8)
    P["labiomental"] = next_ext(P["lowerLip"], "min")
    P["pogonion"] = next_ext(P["labiomental"], "max")
    P["nasion"] = next_ext(tip, "min", step=-1)
    P["glabella"] = next_ext(P["nasion"], "max", step=-1)
    H = max(P["subnasale"] - P["nasion"], 1)
    seg = fs[P["pogonion"]:min(h, P["pogonion"] + int(1.3 * H))]
    P["throat"] = P["pogonion"] + int(np.argmin(seg))
    thr = fs[P["throat"]] + 0.35 * (fs[P["pogonion"]] - fs[P["throat"]])
    below = np.nonzero(fs[P["pogonion"]:P["throat"] + 1] < thr)[0]
    P["menton"] = P["pogonion"] + (int(below[0]) if len(below) else 0)
    sn = fs[P["subnasale"]]
    R = {"H_px": int(H),
         "lowerFace": round((P["menton"] - P["subnasale"]) / H, 4),
         "chinHeight": round((P["menton"] - P["stomion"]) / H, 4),
         "lipHeight": round((P["stomion"] - P["subnasale"]) / H, 4),
         "noseProj": round((fs[P["tip"]] - sn) / H, 4),
         "upperLipProj": round((fs[P["upperLip"]] - sn) / H, 4),
         "lowerLipProj": round((fs[P["lowerLip"]] - sn) / H, 4),
         "pogonionProj": round((fs[P["pogonion"]] - sn) / H, 4),
         "nasionDepth": round((fs[P["tip"]] - fs[P["nasion"]]) / H, 4),
         "throatDepth": round((fs[P["pogonion"]] - fs[P["throat"]]) / H, 4)}
    ys = np.linspace(P["nasion"], P["menton"], 40)
    R["curve"] = np.round((np.interp(ys, np.arange(h), fs) - sn) / H, 4).tolist()
    R["rows"] = {k: int(v) for k, v in P.items()}
    R["fwd"] = {k: round(float(fs[v]), 1) for k, v in P.items()}
    return R, fg, fs


def debug(img, R, fs, nose, path):
    im = img.convert("RGB").copy()
    d = ImageDraw.Draw(im)
    w = im.width
    for y in range(0, len(fs), 2):
        x = fs[y] if nose == "right" else w - 1 - fs[y]
        d.point((x, y), fill=(255, 0, 0))
    for k, y in R["rows"].items():
        x = R["fwd"][k] if nose == "right" else w - 1 - R["fwd"][k]
        d.ellipse((x - 4, y - 4, x + 4, y + 4), outline=(0, 255, 0))
        d.text((x + 6 if nose == "right" else x - 70, y - 6), k, fill=(0, 120, 0))
    im.save(path)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("img"); ap.add_argument("--nose", default="right"); ap.add_argument("--out"); ap.add_argument("--debug"); ap.add_argument("--bg")
    a = ap.parse_args()
    img = Image.open(a.img)
    R, fg, fs = analyse(img, a.nose, bg_hex=a.bg)
    if a.debug:
        debug(img, R, fs, a.nose, a.debug)
    if a.out:
        json.dump(R, open(a.out, "w"), indent=1)
    print(json.dumps({k: v for k, v in R.items() if k != "curve"}))
