"""Proportion pass (merged, iteration 3): explicit, measured corrections to the wrapped basis that the landmark wrap could
not reach. Runs inside build_look.py right after wrap.py / profilefit.py, before the head scale and every key, so all 82
keys, proxies, correctives and the lip seal are built on the corrected basis.

Why it exists (measured 2026-10-03, MediaPipe on the neutral H render vs the front reference, % of the outer-eye-corner
distance IOD): lower lip to chin (17-152) 33.3 vs 38.6, upper vermilion (0-13) 6.7 vs 8.0, subnasale to lip (2-0) 17.1 vs
15.5. In the true-profile render the chin sat ~4 mm behind the reference's and the lips pouted past it. The wrap moves
landmarks through a smoothed thin-plate field pinned at ~400 neighbours, so a correction on one landmark (the earlier
2.5 mm chin try) only dents the surface; this pass moves whole REGIONS with smooth ramps instead.

Fields (Blender axes: x = her left, -y = forward, z = up; metres; all symmetric in x, so G3 holds):
  chin    the mentum and the jaw underside move down `chinDownMm` and forward `chinFwdMm`. Vertical ramp: 0 at the lower
          vermilion border (landmark 17) - 2 mm, 1 at the chin (152) and below; it fades out again over `underFadeMm`
          below the chin (the throat stays). Lateral taper exp(-(x/sx)^2), sx = `chinSigmaXMm`. Front gate: vertices more
          than `depthMm` behind the chin front fade out (the neck and the ears never move).
  upper   the upper vermilion grows `upperLipMm` upward: weight 0 at the lip seam, 1 at the vermilion border, back to 0
          at the subnasale; per-x heights from the corr landmarks (seam = inner upper lip, border = outer upper lip).
  lower   the lower lip moves back `lowerLipBackMm` (the pout over a weak chin).
"""
import json
import numpy as np

OUT_UP = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291]
IN_UP = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308]
IN_LO = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308]
OUT_LO = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291]


def _ss(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def apply(B, spec, headw, body, corr_path, mir=None, log=print):
    C = json.load(open(corr_path))["corr"]

    def lm(k):
        c = C[k]
        return (B[c["vid"]] * np.array(c["w"])[:, None]).sum(0)

    rep = {}
    D = np.zeros_like(B)
    w0 = headw * body
    x, y, z = B[:, 0], B[:, 1], B[:, 2]
    # ---- chin
    dn, fw = float(spec.get("chinDownMm", 0)) / 1000, float(spec.get("chinFwdMm", 0)) / 1000
    if dn or fw:
        p17, p152 = lm(17), lm(152)
        chin_front_y = min(lm(175)[1], lm(199)[1], lm(152)[1])
        # z decreases downward: ramp from the lip (0) to the chin (1)
        t = _ss(0.0, 1.0, (p17[2] - 0.002 - z) / max(p17[2] - 0.002 - p152[2], 1e-4))
        fade = 1 - _ss(0.0, float(spec.get("underFadeMm", 30)) / 1000, p152[2] - z)
        lat = np.exp(-(x / (float(spec.get("chinSigmaXMm", 38)) / 1000)) ** 2)
        front = 1 - _ss(float(spec.get("depthMm", 45)) / 1000 * 0.6, float(spec.get("depthMm", 45)) / 1000, y - chin_front_y)
        wc = t * fade * lat * front * w0
        D[:, 2] -= dn * wc
        D[:, 1] -= fw * wc
        rep["chin"] = {"verts": int((wc > 0.05).sum()), "downMm": dn * 1000, "fwdMm": fw * 1000}
    # ---- upper vermilion
    up = float(spec.get("upperLipMm", 0)) / 1000
    if up:
        xs = np.array([lm(k)[0] for k in OUT_UP]); order = np.argsort(xs)
        zb = np.array([lm(k)[2] for k in OUT_UP])[order]; xs = xs[order]
        xi = np.array([lm(k)[0] for k in IN_UP]); oi = np.argsort(xi)
        zs = np.array([lm(k)[2] for k in IN_UP])[oi]; xi = xi[oi]
        zsub = lm(2)[2]
        zb_x = np.interp(x, xs, zb); zs_x = np.interp(x, xi, zs)
        r_in = (z - zs_x) / np.maximum(zb_x - zs_x, 1e-4)                     # 0 at the seam, 1 at the border
        r_out = (z - zb_x) / max(zsub - float(np.median(zb)), 1e-4)            # 0 at the border, 1 at the subnasale
        wu = np.where(z <= zb_x, _ss(0.0, 1.0, r_in), 1 - _ss(0.0, 1.0, r_out))
        wu *= (z > zs_x - 0.0005) * (np.abs(x) < np.abs(xs).max() + 0.004)
        wu *= 1 - _ss(np.abs(xs).max() - 0.004, np.abs(xs).max() + 0.004, np.abs(x))
        p0 = lm(0)
        wu *= 1 - _ss(0.008, 0.016, y - p0[1])                                   # front surface only (not the mouth bag)
        wu *= w0
        D[:, 2] += up * wu
        rep["upperLip"] = {"verts": int((wu > 0.05).sum()), "mm": up * 1000}
    # ---- lower lip back
    lb = float(spec.get("lowerLipBackMm", 0)) / 1000
    if lb:
        xs = np.array([lm(k)[0] for k in OUT_LO]); o = np.argsort(xs)
        zb = np.array([lm(k)[2] for k in OUT_LO])[o]; xs = xs[o]
        xi = np.array([lm(k)[0] for k in IN_LO]); oi = np.argsort(xi)
        zs = np.array([lm(k)[2] for k in IN_LO])[oi]; xi = xi[oi]
        zb_x = np.interp(x, xs, zb); zs_x = np.interp(x, xi, zs)
        r = (zs_x - z) / np.maximum(zs_x - zb_x, 1e-4)
        wl = np.where(r < 0.5, _ss(0.0, 0.5, r), 1 - _ss(1.0, 2.2, r)) * (z < zs_x + 0.0005)
        wl *= 1 - _ss(np.abs(xs).max() - 0.004, np.abs(xs).max() + 0.004, np.abs(x))
        wl *= 1 - _ss(0.008, 0.016, y - lm(17)[1])
        wl *= w0
        D[:, 1] += lb * wl
        rep["lowerLip"] = {"verts": int((wl > 0.05).sum()), "backMm": lb * 1000}
    if mir is not None:                      # symmetric on the topological mirror (G3; keys.mouth_corner_vids)
        D = 0.5 * (D + D[mir] * np.array([-1.0, 1.0, 1.0]))
    rep["maxMoveMm"] = round(float(np.linalg.norm(D, axis=1).max() * 1000), 2)
    log(f"proportion pass: {rep}")
    return B + D, rep
